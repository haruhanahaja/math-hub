/* 답 형식(kind)과 정답 판정 (plan/architecture.md 1.5절).
   kind 하나가 "읽기 · 비교 · 형태 확인 · 표시 · 공통 실수 찾기"를 맡는다.
   새 형식(fraction, decimal …)은 그 형식이 처음 필요한 단원에서 여기에 추가한다. */
(function () {
  'use strict';
  var MH = globalThis.MH = globalThis.MH || {};

  MH.kinds = {
    /* 자연수(0 포함). 입력은 숫자 키패드로 친 문자열. */
    int: {
      /** 입력을 값으로 읽는다. 읽을 수 없으면 null. */
      parse: function (raw) {
        var s = String(raw == null ? '' : raw).trim();
        if (!/^\d{1,15}$/.test(s)) return null;
        return Number(s);
      },
      equal: function (a, b) { return a === b; },
      /** 값은 맞는데 형태를 더 다듬을 수 있으면 알려 줄 말. 자연수는 해당 없음. */
      note: function () { return null; },
      tex: function (value) { return String(value); },
      /** raw: 그 값을 입력했을 때의 문자열(parse 의 반대) · say: '내 답: …' 에 쓰는 글 */
      raw: function (value) { return String(value); },
      say: function (value) { return String(value); },
      valid: function (value) { return Number.isSafeInteger(value) && value >= 0; },
      /** 유형에 적힌 실수로 설명이 안 될 때 보는 공통 실수 */
      common: function (input, answer) {
        var d = Math.abs(input - answer), a = String(answer), b = String(input);
        for (var k = 1, p = 10; p <= d; k++, p *= 10) {
          if (d === p) return { id: 'place-' + k, explain: MH.place(k) + '의 자리가 1만큼 달라요. ' + MH.place(k) + '의 자리로 받아올리거나 받아내린 수를 빠뜨리지 않았는지 확인해 보세요.' };
        }
        if (a.length === b.length && a.length > 1 && a.split('').sort().join('') === b.split('').sort().join(''))
          return { id: 'digit-order', explain: '숫자는 맞는데 자리가 바뀌었어요. 각 자리에 쓴 숫자의 순서를 확인해 보세요.' };
        if (a.length === b.length && a.slice(0, -1) === b.slice(0, -1))
          return { id: 'ones-only', explain: '일의 자리만 달라요. 일의 자리 계산을 다시 해 보세요.' };
        return null;
      }
    },
    /* 몫과 나머지. 값은 { q, r }. 입력은 두 칸(fields)이고, 판정에는 '몫,나머지' 문자열로 넘어온다. */
    'quotient-remainder': {
      fields: ['몫', '나머지'],
      parse: function (raw) {
        var m = /^(\d{1,7}),(\d{1,7})$/.exec(String(raw == null ? '' : raw).replace(/\s/g, ''));
        return m ? { q: Number(m[1]), r: Number(m[2]) } : null;
      },
      equal: function (a, b) { return !!a && !!b && a.q === b.q && a.r === b.r; },
      note: function () { return null; },
      tex: function (value) { return value.q + ' \\cdots ' + value.r; },
      raw: function (value) { return value.q + ',' + value.r; },
      say: function (value) { return '몫 ' + value.q + ', 나머지 ' + value.r; },
      valid: function (value) { return !!value && Number.isSafeInteger(value.q) && Number.isSafeInteger(value.r) && value.q >= 0 && value.r >= 0; },
      common: function () { return null; }
    }
  };

  /** 그 문제에서 실제로 쓸 수 있는 실수 목록: [{ id, value, explain }]
      실수의 오답이 정답과 같거나 답이 될 수 없는 값이면 건너뛴다. */
  MH.mistakesFor = function (problem) {
    var def = MH.types[problem.type], kind = MH.kinds[def.answer.kind], out = [];
    def.mistakes.forEach(function (m) {
      if (!m.wrong) return;
      var w = m.wrong(problem.v, problem.ctx);
      if (w == null || !kind.valid(w) || kind.equal(w, problem.answer)) return;
      out.push({ id: m.id, value: w, explain: m.explain(problem.v, problem.ctx) });
    });
    return out;
  };

  /** 정답 판정. 결과: { verdict: 'correct' | 'correct-note' | 'wrong' | 'invalid', note, mistake: { id, explain } | null, value } */
  MH.judge = function (problem, raw) {
    var def = MH.types[problem.type], kind = MH.kinds[def.answer.kind];
    var value = kind.parse(raw, def.answer);
    if (value === null) return { verdict: 'invalid', note: null, mistake: null, value: null };
    if (kind.equal(value, problem.answer)) {
      var note = kind.note(value, raw, def.answer);
      return { verdict: note ? 'correct-note' : 'correct', note: note, mistake: null, value: value };
    }
    var found = null, usable = {};
    MH.mistakesFor(problem).forEach(function (m) { usable[m.id] = m; });
    /* ① 그 유형의 흔한 실수를 적힌 순서대로 본다. wrong: 그 실수가 만드는 오답과 같은가 · match: 입력을 직접 보고 판단
       ② 없으면 답 형식의 공통 실수(유형이 answer.common: false 로 끌 수 있다) */
    def.mistakes.forEach(function (m) {
      if (found) return;
      if (m.match) { if (m.match(problem.v, raw, problem.ctx)) found = { id: m.id, explain: m.explain(problem.v, problem.ctx, value) }; }
      else if (usable[m.id] && kind.equal(usable[m.id].value, value)) found = { id: m.id, explain: usable[m.id].explain };
    });
    if (!found && def.answer.common !== false) found = kind.common(value, problem.answer);
    return { verdict: 'wrong', note: null, mistake: found, value: value };
  };
})();
