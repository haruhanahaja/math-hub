/* 문제 유형 템플릿 등록과 문제 만들기 (plan/architecture.md 1장).
   문제는 저장하지 않는다. (유형 id, version, 단계, 씨앗)이 같으면 항상 같은 문제가 만들어진다. */
(function () {
  'use strict';
  var MH = globalThis.MH = globalThis.MH || {};
  /* 조건에 맞는 숫자를 못 찾으면 오류. 앱에서는 씨앗이 무작위라서, 넉넉하게 잡아 실제로는 오류가 나지 않게 한다.
     조건이 너무 빡빡한 단계는 테스트가 평균 시도 횟수(MH.lastTries)로 잡아낸다(tests/types.test.js) */
  var MAX_TRIES = 5000;
  var NEED = ['id', 'unit', 'version', 'title', 'answer', 'levels', 'prompt', 'solve', 'verify', 'hints', 'steps', 'mistakes'];

  MH.types = MH.types || {};

  MH.defineType = function (def) {
    NEED.forEach(function (k) { if (def[k] === undefined) throw new Error('유형 ' + def.id + ': ' + k + ' 칸이 없습니다'); });
    if (def.id.indexOf(def.unit + '.') !== 0) throw new Error('유형 id 는 "단원ID.이름" 이어야 합니다: ' + def.id);
    if (MH.types[def.id]) throw new Error('유형 id 가 겹칩니다: ' + def.id);
    if (!MH.kinds[def.answer.kind]) throw new Error('유형 ' + def.id + ': 모르는 답 형식 ' + def.answer.kind);
    if (!def.levels.length) throw new Error('유형 ' + def.id + ': 단계가 없습니다');
    MH.types[def.id] = def;
    return def;
  };

  /* 개념 카드: 단원을 처음 열 때 문제보다 먼저 보여 주는 짧은 설명(plan/architecture.md 1장).
     cards: [{ title: 카드 제목, body: [조각 …] }] — 조각은 아래 가운데 하나.
       '글'($ … $ 사이는 수식) · { tex: 가운데에 크게 쓰는 수식 } · { figure: 그림(MH.figure 와 같은 형식) }
       · { list: ['글', …] } 점 목록 · { ex: [['수식 또는 낱말', '설명'], …] } 예시 표 */
  MH.concepts = MH.concepts || {};
  MH.defineConcept = function (unit, cards) {
    if (MH.concepts[unit]) throw new Error('개념 카드가 겹칩니다: ' + unit);
    if (!Array.isArray(cards) || !cards.length) throw new Error('개념 카드 ' + unit + ': 카드가 없습니다');
    cards.forEach(function (c, i) {
      if (!c.title || !Array.isArray(c.body) || !c.body.length) throw new Error('개념 카드 ' + unit + ' ' + (i + 1) + '번: title 과 body 가 있어야 합니다');
      c.body.forEach(function (b) {
        if (!(typeof b === 'string' || (b && (typeof b.tex === 'string' || b.figure || Array.isArray(b.list) || Array.isArray(b.ex))))) throw new Error('개념 카드 ' + unit + ' ' + (i + 1) + '번: 모르는 조각');
      });
    });
    MH.concepts[unit] = cards;
    return cards;
  };

  MH.lastLevel = function (typeId) { return MH.types[typeId].levels.length - 1; };

  /** 문제 하나를 만든다. 돌려주는 것: { type, version, level, seed, v(숫자들), ctx(상황), answer(정답 값) } */
  MH.makeProblem = function (typeId, level, seed) {
    var def = MH.types[typeId];
    if (!def) throw new Error('모르는 유형: ' + typeId);
    var lv = def.levels[level];
    if (!lv) throw new Error(typeId + ': 단계 ' + level + ' 이 없습니다');
    var r = MH.rng(MH.hash(typeId + '|' + def.version + '|' + level + '|' + seed));
    var names = Object.keys(lv.vars);
    for (var t = 0; t < MAX_TRIES; t++) {
      var ctx = def.contexts ? r.pick(def.contexts) : null;
      var v = {};
      for (var i = 0; i < names.length; i++) {
        var spec = lv.vars[names[i]];
        if (typeof spec === 'function') spec = spec(v, ctx);          /* 앞에서 뽑은 값을 쓰는 칸 */
        v[names[i]] = spec instanceof MH.Sampler ? spec.sample(r) : spec;
      }
      if (!lv.where || lv.where(v, ctx)) {
        MH.lastTries = t + 1;
        return { type: typeId, version: def.version, level: level, seed: seed, v: v, ctx: ctx, answer: def.solve(v, ctx) };
      }
    }
    throw new Error(typeId + ' ' + level + '단계: ' + MAX_TRIES + '번 안에 조건에 맞는 숫자를 찾지 못했습니다');
  };
})();
