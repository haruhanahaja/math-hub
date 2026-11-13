/* 문제 유형 템플릿 등록과 문제 만들기 (plan/architecture.md 1장).
   문제는 저장하지 않는다. (유형 id, version, 단계, 씨앗)이 같으면 항상 같은 문제가 만들어진다. */
(function () {
  'use strict';
  var MH = globalThis.MH = globalThis.MH || {};
  var MAX_TRIES = 200;                                   /* 조건에 맞는 숫자를 못 찾으면 오류(조건이 너무 빡빡함) */
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
        return { type: typeId, version: def.version, level: level, seed: seed, v: v, ctx: ctx, answer: def.solve(v, ctx) };
      }
    }
    throw new Error(typeId + ' ' + level + '단계: ' + MAX_TRIES + '번 안에 조건에 맞는 숫자를 찾지 못했습니다');
  };
})();
