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
    var found = null;
    /* ① 값이 아니라 쓴 모양을 봐야 하는 실수 ② 그 유형의 흔한 실수 ③ 공통 실수 */
    def.mistakes.forEach(function (m) {
      if (!found && m.match && m.match(problem.v, raw, problem.ctx)) found = { id: m.id, explain: m.explain(problem.v, problem.ctx) };
    });
    if (!found) MH.mistakesFor(problem).forEach(function (m) { if (!found && kind.equal(m.value, value)) found = { id: m.id, explain: m.explain }; });
    if (!found) found = kind.common(value, problem.answer);
    return { verdict: 'wrong', note: null, mistake: found, value: value };
  };
})();
