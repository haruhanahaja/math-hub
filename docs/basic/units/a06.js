/* A06 혼합 계산의 순서 — 곱셈·나눗셈 먼저, 괄호 먼저
   유형(쉬운 것부터): A06.left 앞에서부터 차례로 · A06.muldiv 곱셈·나눗셈 먼저 · A06.paren 괄호 먼저
                     · A06.mixed 괄호와 사칙이 섞인 식 · A06.word 하나의 식으로 푸는 문장제
   식은 낱말 목록(tokens)으로 다룬다: [20, '−', 3, '×', 4], ['(', 3, '+', 4, ')', '×', 5]. 연산 기호는 화면에 보이는 글자(+ − × ÷) 그대로다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick;

  var isNum = function (t) { return typeof t === 'number'; };
  var isHigh = function (op) { return op === '×' || op === '÷'; };
  var show = function (t) { return t.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')'); };
  var toTex = function (t) { return show(t).replace(/×/g, '\\times').replace(/÷/g, '\\div').replace(/−/g, '-'); };
  /** 계산 한 번. 답이 음수가 되거나 나누어떨어지지 않으면 null */
  function apply(l, op, r) {
    if (op === '+') return l + r;
    if (op === '−') return l >= r ? l - r : null;
    if (op === '×') return l * r;
    return r > 0 && l % r === 0 ? l / r : null;
  }
  /** 식을 한 번에 한 계산씩 줄여 가며 계산한다. 계산할 수 없으면 null.
      mode: 'std' 바른 순서 · 'ltr' 괄호는 지키되 무조건 앞에서부터 · 'rtl' 뒤에서부터 · 'noparen' 괄호를 빼고 바른 순서
      { value, trace: [{ l, op, r, res, reason('paren' | 'muldiv' | 'left'), after, afterTex, box(결과 자리에 □) }] } */
  function run(tokens, mode) {
    var t = mode === 'noparen' ? tokens.filter(function (x) { return x !== '(' && x !== ')'; }) : tokens.slice(), trace = [];
    while (t.length > 1) {
      var close = t.indexOf(')'), open = close < 0 ? -1 : t.lastIndexOf('(', close);
      var lo = open + 1, hi = close < 0 ? t.length : close, ops = [], hasLow = false, at, i;
      for (i = lo; i < hi; i++) if (!isNum(t[i])) { ops.push(i); if (!isHigh(t[i])) hasLow = true; }
      if (!ops.length) return null;
      at = mode === 'ltr' ? ops[0] : mode === 'rtl' ? ops[ops.length - 1] : (ops.filter(function (k) { return isHigh(t[k]); })[0] || ops[0]);
      var l = t[at - 1], op = t[at], r = t[at + 1], res = apply(l, op, r), pos = at - 1;
      if (res === null) return null;
      t.splice(pos, 3, res);
      if (open >= 0 && ops.length === 1) { t.splice(open, 3, res); pos = open; }        /* 괄호 안이 수 하나가 되면 괄호를 지운다 */
      var b = t.slice(); b[pos] = '□';
      trace.push({ l: l, op: op, r: r, res: res, reason: open >= 0 ? 'paren' : isHigh(op) && hasLow ? 'muldiv' : 'left', after: show(t), afterTex: toTex(t), box: show(b) });
    }
    return { value: t[0], trace: trace };
  }
  /** 검산용: 문법대로 읽어 내려가는 계산(run 과 다른 방법). 식 := 항 (+|− 항)* · 항 := 인수 (×|÷ 인수)* · 인수 := 수 | (식) */
  function parse(tokens) {
    var i = 0;
    function factor() { if (tokens[i] === '(') { i++; var x = expr(); i++; return x; } return tokens[i++]; }
    function term() { var x = factor(); while (isHigh(tokens[i])) { var op = tokens[i++]; x = apply(x, op, factor()); } return x; }
    function expr() { var x = term(); while (tokens[i] === '+' || tokens[i] === '−') { var op = tokens[i++]; x = apply(x, op, term()); } return x; }
    return expr();
  }
  var valueOf = function (tokens, mode) { var R = run(tokens, mode); return R ? R.value : null; };
  /** 문제로 쓸 수 있는 식인가: 계산이 되고, 보이는 수가 1~200, 중간 결과가 999 이하, 답이 1 이상 */
  function fine(tokens) {
    var R = run(tokens, 'std');
    return !!R && R.value >= 1 && tokens.every(function (x) { return !isNum(x) || (x >= 1 && x <= 200); }) && R.trace.every(function (s) { return s.res <= 999; });
  }
  var calc = function (s) { return s.l + ' ' + s.op + ' ' + s.r; };

  /* ── 풀이 · 힌트 (모든 유형 공통) ──────────────────── */
  function steps(tokens) {
    var tr = run(tokens, 'std').trace;
    return tr.map(function (s, i) {
      var last = i === tr.length - 1;
      var why = s.reason === 'paren' ? '괄호 안을 가장 먼저 계산해요: ' : s.reason === 'muldiv' ? '×, ÷ 는 +, − 보다 먼저 계산해요: ' : last ? '남은 계산을 해요: ' : '앞에서부터 차례로 계산해요: ';
      var out = { say: why + calc(s) + ' = ' + s.res + '.', tex: last ? toTex(tokens) + ' = ' + s.res : s.afterTex };
      if (last) out.value = s.res;
      return out;
    });
  }
  function rule(tokens) {
    var ops = tokens.filter(function (x) { return !isNum(x); }), out = [];
    if (ops.indexOf('(') >= 0) out.push('괄호가 있으면 괄호 안을 가장 먼저 계산해요.');
    if (ops.some(isHigh) && ops.some(function (x) { return x === '+' || x === '−'; })) out.push('×, ÷ 는 +, − 보다 먼저 계산해요.');
    out.push('+, − 끼리 또는 ×, ÷ 끼리는 앞에서부터 차례로 계산해요.');
    return out.join(' ');
  }
  function hints(tokens) {
    var first = run(tokens, 'std').trace[0];
    return [rule(tokens), '먼저 계산할 곳은 ' + calc(first) + ' 예요.', '그 결과를 □라고 하면 남은 식은 ' + first.box + ' 예요.'];
  }

  /* ── 흔한 실수 (식을 받아 다른 순서로 계산해 본다) ────
     ① 순서를 무시하고 앞에서부터  ② 괄호를 빼고 계산  ③ 뒤쪽부터 계산  ④ 한 번만 계산하고 멈춤  ⑤ 마지막 계산에서 + 와 − 를 바꿈 */
  function mistakes(of, ids) {
    var first = function (v, ctx) { return run(of(v, ctx), 'std').trace[0]; };
    var lastOf = function (v, ctx) { var tr = run(of(v, ctx), 'std').trace; return tr[tr.length - 1]; };
    var all = {
      'left-to-right': { wrong: function (v, ctx) { return valueOf(of(v, ctx), 'ltr'); },
        explain: function (v, ctx) { return '순서를 따지지 않고 앞에서부터 계산했어요. ' + (first(v, ctx).reason === 'paren' ? '괄호 안을 가장 먼저, 그다음 ×, ÷ 를 +, − 보다 먼저 계산해요.' : '×, ÷ 는 +, − 보다 먼저 계산해요.') + ' 먼저 계산할 곳은 ' + calc(first(v, ctx)) + ' 예요.'; } },
      'ignored-paren': { wrong: function (v, ctx) { return valueOf(of(v, ctx), 'noparen'); },
        explain: function (v, ctx) { return '괄호가 없는 것처럼 계산했어요. 괄호가 있으면 괄호 안을 가장 먼저 계산해요. 먼저 계산할 곳은 ' + calc(first(v, ctx)) + ' 예요.'; } },
      'right-first': { wrong: function (v, ctx) { return valueOf(of(v, ctx), 'rtl'); },
        explain: function (v, ctx) { return '뒤쪽을 먼저 계산했어요. +, − 끼리 또는 ×, ÷ 끼리만 있는 식은 앞에서부터 차례로 계산해요. 먼저 계산할 곳은 ' + calc(first(v, ctx)) + ' 예요.'; } },
      'stopped': { wrong: function (v, ctx) { return first(v, ctx).res; },
        explain: function (v, ctx) { var s = first(v, ctx); return calc(s) + ' = ' + s.res + ' 까지만 계산했어요. 아직 계산이 남았어요: ' + s.after + '.'; } },
      'plus-minus': { wrong: function (v, ctx) { var s = lastOf(v, ctx); return isHigh(s.op) ? null : apply(s.l, s.op === '+' ? '−' : '+', s.r); },
        explain: function (v, ctx) { var s = lastOf(v, ctx); return '마지막 계산에서 + 와 − 를 바꿔 계산했어요. 마지막 계산은 ' + calc(s) + ' 예요.'; } }
    };
    return ids.map(function (id) { return { id: id, wrong: all[id].wrong, explain: all[id].explain }; });
  }

  function defineExpr(id, title, forms, levels, test, ids) {
    var of = function (v) { return forms[v.form](v); };
    MH.defineType({
      id: id, unit: 'A06', version: 1, title: title,
      answer: { kind: 'int' },
      levels: levels.map(function (lv) {
        return { name: lv[0], minDistinct: lv[2], vars: { form: pick(lv[1]), a: int(2, 9), b: int(2, 9), c: int(2, 9), d: int(2, 9), e: int(10, 90) },
          where: function (v) { var t = of(v); return fine(t) && test(t, run(t, 'std').value); } };
      }),
      prompt: function (v) { return { tex: toTex(of(v)), text: '계산하세요.' }; },
      solve: function (v) { return run(of(v), 'std').value; },
      verify: function (v, ans) { return parse(of(v)) === ans; },
      hints: function (v) { return hints(of(v)); },
      steps: function (v) { return steps(of(v)); },
      mistakes: mistakes(of, ids)
    });
  }
  /* 순서가 답을 바꾸는 식만 낸다(아무 순서로 해도 같은 답이 나오면 연습이 안 된다) */
  var differs = function (mode) { return function (t, ans) { return valueOf(t, mode) !== ans; }; };

  /* ── A06.left 앞에서부터 차례로 ─────────────────────── */
  defineExpr('A06.left', '앞에서부터 차례로', [
    function (v) { return [v.e, '−', v.a, '+', v.b]; },
    function (v) { return [v.e, '−', v.a, '−', v.b]; },
    function (v) { return [v.e, '+', v.a, '−', v.b]; },
    function (v) { return [v.a * v.b, '÷', v.b, '×', v.c]; },
    function (v) { return [v.a, '×', v.b, '÷', v.c]; },
    function (v) { return [v.a * v.b * v.c, '÷', v.b, '÷', v.c]; }
  ], [['덧셈과 뺄셈', [0, 1, 2]], ['곱셈과 나눗셈', [3, 4, 5]]], differs('rtl'), ['right-first', 'stopped', 'plus-minus']);

  /* ── A06.muldiv 곱셈 · 나눗셈 먼저 ──────────────────── */
  defineExpr('A06.muldiv', '곱셈·나눗셈 먼저', [
    function (v) { return [v.e, '+', v.a, '×', v.b]; },
    function (v) { return [v.e, '−', v.a, '×', v.b]; },
    function (v) { return [v.e, '+', v.a * v.b, '÷', v.a]; },
    function (v) { return [v.e, '−', v.a * v.b, '÷', v.a]; },
    function (v) { return [v.a, '×', v.b, '+', v.c, '×', v.d]; },
    function (v) { return [v.e, '−', v.a, '×', v.b, '+', v.c]; },
    function (v) { return [v.a * v.b, '÷', v.a, '+', v.c, '×', v.d]; },
    function (v) { return [v.e, '+', v.a, '×', v.b, '−', v.c * v.d, '÷', v.d]; }
  ], [['곱셈이 섞인 식', [0, 1]], ['나눗셈이 섞인 식', [2, 3]], ['긴 식', [4, 5, 6, 7]]], differs('ltr'), ['left-to-right', 'stopped', 'plus-minus']);

  /* ── A06.paren 괄호 먼저 ────────────────────────────── */
  defineExpr('A06.paren', '괄호 먼저', [
    function (v) { return ['(', v.a, '+', v.b, ')', '×', v.c]; },
    function (v) { return [v.a, '×', '(', v.b, '+', v.c, ')']; },
    function (v) { return [v.e, '−', '(', v.a, '+', v.b, ')']; },
    function (v) { return [v.e, '−', '(', v.a, '−', v.b, ')']; },
    function (v) { return ['(', v.e, '+', v.a, ')', '÷', v.b]; },
    function (v) { return ['(', v.e, '−', v.a, ')', '÷', v.b]; },
    function (v) { return [v.a * (v.b + v.c), '÷', '(', v.b, '+', v.c, ')']; }
  ], [['괄호와 덧셈 · 뺄셈 · 곱셈', [0, 1, 2, 3]], ['괄호와 나눗셈', [4, 5, 6]]], differs('noparen'), ['ignored-paren', 'stopped', 'plus-minus']);

  /* ── A06.mixed 괄호와 사칙이 섞인 식 ────────────────── */
  defineExpr('A06.mixed', '괄호와 사칙이 섞인 식', [
    function (v) { return [v.e, '+', '(', v.a, '+', v.b, ')', '×', v.c]; },
    function (v) { return [v.e, '−', '(', v.a, '−', v.b, ')', '×', v.c]; },
    function (v) { return ['(', v.a, '+', v.b, ')', '×', v.c, '−', v.d]; },
    function (v) { return [v.e, '+', v.a * (v.b + v.c), '÷', '(', v.b, '+', v.c, ')']; },
    function (v) { return ['(', v.a, '+', v.b, ')', '×', '(', v.c, '−', v.d, ')']; },
    function (v) { return ['(', v.e, '−', v.a, ')', '÷', v.b, '+', v.c, '×', v.d]; },
    function (v) { return [v.a, '×', v.b, '−', '(', v.e, '+', v.c, ')', '÷', v.d]; }
  ], [['괄호 하나, 계산 세 번', [0, 1, 2]], ['나눗셈과 긴 식', [3, 4, 5, 6]]],
  differs('noparen'), ['ignored-paren', 'left-to-right', 'stopped', 'plus-minus']);

  /* ── A06.word 하나의 식으로 푸는 문장제 ──────────────── */
  var CONTEXTS = [
    { id: 'left-after', unit: '개', expr: function (v) { return [v.e, '−', v.a, '×', v.b]; },
      text: function (v) { return '귤이 ' + v.e + '개 있었어요. 한 봉지에 ' + v.a + '개씩 ' + v.b + '봉지에 담아 나눠 줬어요. 남은 귤은 몇 개일까요?'; },
      hint: '나눠 준 귤의 수를 먼저 구해서 처음 있던 수에서 빼요.' },
    { id: 'group-total', unit: '명', expr: function (v) { return ['(', v.a, '+', v.b, ')', '×', v.c]; },
      text: function (v) { return '한 모둠에 어른 ' + v.a + '명과 아이 ' + v.b + '명이 있어요. 이런 모둠이 ' + v.c + '개 있다면 사람은 모두 몇 명일까요?'; },
      hint: '한 모둠의 사람 수를 먼저 구하고, 모둠 수를 곱해요. 먼저 구할 것은 괄호로 묶어요.' },
    { id: 'share-rest', unit: '쪽', expr: function (v) { return ['(', v.e, '−', v.a, ')', '÷', v.b]; },
      text: function (v) { return v.e + '쪽짜리 책을 ' + v.a + '쪽 읽었어요. 남은 쪽을 ' + v.b + '일 동안 매일 같은 쪽수씩 읽으려면 하루에 몇 쪽씩 읽어야 할까요?'; },
      hint: '남은 쪽수를 먼저 구하고, 날수로 나눠요. 먼저 구할 것은 괄호로 묶어요.' },
    { id: 'two-blocks', unit: '개', expr: function (v) { return [v.a, '×', v.b, '+', v.c, '×', v.d]; },
      text: function (v) { return '의자를 한 줄에 ' + v.a + '개씩 ' + v.b + '줄 놓고, 그 뒤에 한 줄에 ' + v.c + '개씩 ' + v.d + '줄을 더 놓았어요. 의자는 모두 몇 개일까요?'; },
      hint: '앞쪽 의자 수와 뒤쪽 의자 수를 각각 곱셈으로 구해서 더해요.' },
    { id: 'pack-together', unit: '상자', expr: function (v) { return ['(', v.e, '+', v.a, ')', '÷', v.b]; },
      text: function (v) { return '사과 ' + v.e + '개와 배 ' + v.a + '개를 합쳐서 한 상자에 ' + v.b + '개씩 담았더니 남는 것이 없었어요. 모두 몇 상자일까요?'; },
      hint: '과일 수를 먼저 합치고, 한 상자에 담는 수로 나눠요. 먼저 구할 것은 괄호로 묶어요.' }
  ];
  var wordOf = function (v, ctx) { return ctx.expr(v); };
  MH.defineType({
    id: 'A06.word', unit: 'A06', version: 1, title: '하나의 식으로 푸는 문장제',
    answer: { kind: 'int', suffix: function (v, ctx) { return ctx.unit; } },
    contexts: CONTEXTS,
    levels: [{ name: '하나의 식으로', vars: { a: int(2, 9), b: int(2, 9), c: int(2, 9), d: int(2, 9), e: int(10, 90) },
      where: function (v, ctx) { var t = ctx.expr(v), ans = valueOf(t, 'std'); return fine(t) && (valueOf(t, 'ltr') !== ans || valueOf(t, 'noparen') !== ans); } }],
    prompt: function (v, ctx) { return { text: ctx.text(v) }; },
    solve: function (v, ctx) { return run(ctx.expr(v), 'std').value; },
    verify: function (v, ans, ctx) { return parse(ctx.expr(v)) === ans; },
    hints: function (v, ctx) { return [ctx.hint, '하나의 식으로 쓰면 ' + show(ctx.expr(v)) + ' 예요.', '먼저 계산할 곳은 ' + calc(run(ctx.expr(v), 'std').trace[0]) + ' 예요.']; },
    steps: function (v, ctx) {
      var t = ctx.expr(v), inner = steps(t), last = inner[inner.length - 1];
      return [{ say: ctx.hint + ' 하나의 식으로 써요.', tex: toTex(t) }].concat(inner.slice(0, -1),
        [{ say: last.say + ' 답은 ' + last.value + MH.josa(ctx.unit, '이에요/예요') + '.', tex: last.tex, value: last.value }]);
    },
    mistakes: mistakes(wordOf, ['left-to-right', 'ignored-paren', 'stopped', 'plus-minus'])
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('A06', [
  { title: '계산 순서에 약속이 필요한 까닭', body: [
    { tex: '2 + 3 \\times 4' },
    '앞에서부터 하면 5 × 4 = 20, 곱셈부터 하면 2 + 12 = 14예요. 사람마다 답이 달라지면 안 되니까 순서를 약속으로 정해 뒀어요. 바른 답은 14예요.'
  ] },
  { title: '약속한 순서', body: [
    { list: ['① 괄호 안을 가장 먼저 계산해요.', '② 그다음 곱셈과 나눗셈을 계산해요.', '③ 마지막으로 덧셈과 뺄셈을 계산해요.', '④ 같은 단계끼리는 왼쪽부터 차례로 해요.'] },
    '곱셈과 나눗셈은 "묶음"을 만드는 계산이라서, 낱개를 더하고 빼기 전에 묶음부터 정리한다고 생각하면 돼요.'
  ] },
  { title: '한 줄씩 차례로 풀어 쓰기', body: [
    { tex: '61 + 80 \\div (6 + 4)' },
    { list: ['① 괄호: 6 + 4 = 10 → 61 + 80 ÷ 10', '② 나눗셈: 80 ÷ 10 = 8 → 61 + 8', '③ 덧셈: 61 + 8 = 69'] },
    '한 번에 한 가지만 계산하고, 나머지는 그대로 옮겨 써요. 머릿속으로 여러 단계를 한꺼번에 하면 틀리기 쉬워요.'
  ] },
  { title: '자주 틀리는 곳 — 같은 단계는 왼쪽부터', body: [
    { ex: [['10 - 4 + 3', '왼쪽부터: 6 + 3 = 9 (4 + 3을 먼저 하면 안 돼요)'], ['42 \\div 3 \\div 7', '왼쪽부터: 14 ÷ 7 = 2'], ['12 \\div 2 \\times 3', '왼쪽부터: 6 × 3 = 18']] },
    '덧셈이 뺄셈보다 먼저인 것이 아니에요. 둘은 같은 단계라서 앞에 있는 것부터 해요. 곱셈과 나눗셈도 마찬가지예요.'
  ] }
]);
