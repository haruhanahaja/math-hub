/* A06 혼합 계산의 순서 — 단원 전용 검사.
   화면에 보이는 식을 다시 읽어서, 엔진과 무관한 계산(자바스크립트의 식 계산, BigInt 와 보통 수 두 가지)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  /** 수식 글(TeX)을 자바스크립트 식으로 바꿔 계산한다. BigInt 계산(나눗셈은 버림)과 보통 계산이 같아야 나눗셈이 모두 나누어떨어진 것이다. */
  function calc(tex) {
    var js = tex.replace(/\\times/g, '*').replace(/\\div/g, '/');
    if (!/^[\d\s+\-*\/()]+$/.test(js)) return null;
    var exact = (0, eval)(js), big = Number((0, eval)(js.replace(/\d+/g, '$&n')));
    return exact === big ? exact : null;
  }
  var count = function (tex, re) { return (tex.match(re) || []).length; };

  group('A06 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  /* 유형 · 단계마다 식의 모양: [계산 횟수의 범위, 괄호가 있어야 하는가] */
  var shape = {
    'A06.left': [[2, 2, false], [2, 2, false]], 'A06.muldiv': [[2, 2, false], [2, 2, false], [3, 4, false]],
    'A06.paren': [[2, 2, true], [2, 2, true]], 'A06.mixed': [[3, 3, true], [3, 4, true]]
  };
  Object.keys(shape).forEach(function (id) {
    var forms = {};
    each(id, function (p, pr, level, where) {
      var v = calc(pr.tex), s = shape[id][level], ops = count(pr.tex, /\+|-|\\times|\\div/g), nums = (pr.tex.match(/\d+/g) || []).map(Number);
      ok(v === p.answer && p.answer >= 1, where + pr.tex + ' = ' + v + ' ≠ ' + p.answer);
      ok(ops >= s[0] && ops <= s[1] && (count(pr.tex, /\(/g) > 0) === s[2], where + '식의 모양 ' + pr.tex);
      ok(nums.every(function (n) { return n >= 1 && n <= 200; }), where + '수의 범위 ' + pr.tex);
      if (id === 'A06.left') ok(count(pr.tex, /\+|-/g) === (level ? 0 : 2), where + (level ? '×, ÷ 만' : '+, − 만') + ' 있어야 함 ' + pr.tex);
      if (id === 'A06.muldiv') ok(count(pr.tex, /\+|-/g) > 0 && count(pr.tex, /\\times|\\div/g) > 0 && (level !== 0 || !/div/.test(pr.tex)) && (level !== 1 || /div/.test(pr.tex)), where + '연산의 종류 ' + pr.tex);
      /* 순서를 틀리면 답이 달라지는 식이어야 한다: 괄호를 지우거나, 앞에서부터만 계산하면 다른 값 */
      if (s[2]) ok(calc(pr.tex.replace(/[()]/g, '')) !== p.answer, where + '괄호가 없어도 답이 같음 ' + pr.tex);
      forms[p.v.form] = 1;
    });
    eq(Object.keys(forms).length, { 'A06.left': 6, 'A06.muldiv': 8, 'A06.paren': 7, 'A06.mixed': 7 }[id], id + ': 모든 꼴이 나옴');
    done(id);
  });
  var formula = {
    'left-after': function (n) { return n[0] - n[1] * n[2]; }, 'group-total': function (n) { return (n[0] + n[1]) * n[2]; },
    'share-rest': function (n) { return (n[0] - n[1]) / n[2]; }, 'two-blocks': function (n) { return n[0] * n[1] + n[2] * n[3]; },
    'pack-together': function (n) { return (n[0] + n[1]) / n[2]; }
  }, used = {};
  each('A06.word', function (p, pr, level, where) {
    var nums = (pr.text.match(/\d+/g) || []).map(Number), want = formula[p.ctx.id](nums);
    ok(Number.isInteger(want) && want === p.answer && p.answer >= 1, where + pr.text + ' → ' + p.answer + ' (기대 ' + want + ')');
    eq(MH.types['A06.word'].answer.suffix(p.v, p.ctx), p.ctx.unit, where + '답 칸의 단위');
    /* 힌트에 적힌 식도 같은 답이어야 한다 */
    var h = /쓰면 (.+?)(?:이에요|예요)\.$/.exec(MH.types['A06.word'].hints(p.v, p.ctx)[1]);
    ok(!!h && calc(h[1].replace(/×/g, '\\times').replace(/÷/g, '\\div').replace(/−/g, '-')) === p.answer, where + '힌트의 식');
    used[p.ctx.id] = 1;
  });
  eq(Object.keys(used).length, MH.types['A06.word'].contexts.length, '모든 상황이 쓰임');
  done('문장제');

  group('A06 — 흔한 실수와 풀이의 구체적인 예');
  var prob = function (type, v, answer, ctx) { return { type: type, v: v, ctx: ctx || null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var V = function (form, e, a, b, c, d) { return { form: form, a: a, b: b, c: c || 2, d: d || 2, e: e }; };
  var m1 = prob('A06.muldiv', V(1, 20, 3, 4), 8);                          /* 20 − 3 × 4 */
  eq(MH.types['A06.muldiv'].prompt(m1.v).tex, '20 - 3 \\times 4', '식의 표시');
  eq(J(m1, '8'), 'correct:-', '20 − 3 × 4 = 8');
  eq(J(m1, '68'), 'wrong:left-to-right', '20 − 3 × 4 → 68 (앞에서부터)');
  eq(J(m1, '12'), 'wrong:stopped', '20 − 3 × 4 → 12 (곱셈만 하고 멈춤)');
  eq(J(m1, '32'), 'wrong:plus-minus', '20 − 3 × 4 → 32 (빼야 하는데 더함)');
  eq(MH.judge(m1, '68').mistake.explain, '순서를 따지지 않고 앞에서부터 계산했어요. ×, ÷ 는 +, − 보다 먼저 계산해요. 먼저 계산할 곳은 3 × 4예요.', '앞에서부터 계산한 실수의 설명');
  eq(MH.judge(m1, '12').mistake.explain, '3 × 4 = 12 까지만 계산했어요. 아직 계산이 남았어요: 20 − 12.', '멈춘 실수의 설명');
  var l0 = prob('A06.left', V(0, 30, 8, 5), 27);                           /* 30 − 8 + 5 */
  eq(J(l0, '17'), 'wrong:right-first', '30 − 8 + 5 → 17 (뒤쪽 먼저)');
  eq(J(l0, '22'), 'wrong:stopped', '30 − 8 + 5 → 22');
  eq(J(prob('A06.left', V(3, 10, 4, 6, 3), 12), '4'), 'wrong:stopped', '24 ÷ 6 × 3 → 4');
  var p0 = prob('A06.paren', V(0, 10, 3, 4, 5), 35);                       /* (3 + 4) × 5 */
  eq(J(p0, '23'), 'wrong:ignored-paren', '(3 + 4) × 5 → 23 (괄호 무시)');
  eq(J(p0, '7'), 'wrong:stopped', '(3 + 4) × 5 → 7');
  eq(J(prob('A06.paren', V(3, 20, 8, 3), 15), '9'), 'wrong:ignored-paren', '20 − (8 − 3) → 9 (괄호 무시)');
  var x1 = prob('A06.mixed', V(1, 54, 6, 3, 7), 33);                       /* 54 − (6 − 3) × 7 */
  eq(J(x1, '27'), 'wrong:ignored-paren', '54 − (6 − 3) × 7 → 27');
  eq(J(x1, '357'), 'wrong:left-to-right', '54 − (6 − 3) × 7 → 357');
  eq(MH.judge(x1, '357').mistake.explain, '순서를 따지지 않고 앞에서부터 계산했어요. 괄호 안을 가장 먼저, 그다음 ×, ÷ 를 +, − 보다 먼저 계산해요. 먼저 계산할 곳은 6 − 3이에요.', '괄호가 있는 식에서 앞에서부터 계산한 실수의 설명');
  var W = MH.types['A06.word'].contexts, wv = { a: 6, b: 2, c: 3, d: 4, e: 48 };
  eq(J(prob('A06.word', wv, 36, W[0]), '84'), 'wrong:left-to-right', '귤 48개에서 6개씩 2봉지 → 84');
  eq(J(prob('A06.word', wv, 24, W[1]), '12'), 'wrong:ignored-paren', '어른 6명과 아이 2명, 3모둠 → 12');
  eq(J(prob('A06.word', wv, 24, W[3]), '60'), 'wrong:left-to-right', '6개씩 2줄, 3개씩 4줄 → 60');

  var says = function (id, v, ctx) { return MH.types[id].steps(v, ctx).map(function (s) { return s.say + ' [' + s.tex + ']'; }).join(' | '); };
  eq(says('A06.muldiv', m1.v), '×, ÷ 는 +, − 보다 먼저 계산해요: 3 × 4 = 12. [20 - 12] | 남은 계산을 해요: 20 − 12 = 8. [20 - 3 \\times 4 = 8]', '20 − 3 × 4 풀이');
  eq(says('A06.mixed', x1.v), '괄호 안을 가장 먼저 계산해요: 6 − 3 = 3. [54 - 3 \\times 7] | ×, ÷ 는 +, − 보다 먼저 계산해요: 3 × 7 = 21. [54 - 21] | 남은 계산을 해요: 54 − 21 = 33. [54 - (6 - 3) \\times 7 = 33]', '54 − (6 − 3) × 7 풀이');
  eq(says('A06.left', l0.v), '앞에서부터 차례로 계산해요: 30 − 8 = 22. [22 + 5] | 남은 계산을 해요: 22 + 5 = 27. [30 - 8 + 5 = 27]', '30 − 8 + 5 풀이');
  eq(says('A06.word', wv, W[0]).split(' | ').pop(), '남은 계산을 해요: 48 − 12 = 36. 답은 36개예요. [48 - 6 \\times 2 = 36]', '문장제 풀이의 마지막 줄');
  eq(MH.types['A06.mixed'].hints(x1.v).join(' | '), '괄호가 있으면 괄호 안을 가장 먼저 계산해요. ×, ÷ 는 +, − 보다 먼저 계산해요. +, − 끼리 또는 ×, ÷ 끼리는 앞에서부터 차례로 계산해요. | 먼저 계산할 곳은 6 − 3이에요. | 그 결과를 □라고 하면 남은 식은 54 − □ × 7이에요.', '힌트');
  done('실수 · 풀이 예');
})();
