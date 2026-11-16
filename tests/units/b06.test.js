/* B06 일차식의 계산 — 단원 전용 검사.
   화면에 보이는 식과 보기(KaTeX 글)를 tests/algcalc.js 의 계산기(BigInt 분수)로 다시 읽어 값을 비교한다. 엔진의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, sig = ALG.sig, noJosa = ALG.noJosa;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx);
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    /* 답이 문자 하나(3x − 2x = x)이면 '문자 x 가 있는 항' 과 겹치므로 보지 않는다 */
    if (typeof p.answer === 'string' && p.answer.length > 1) ok(h.join(' ').replace(/ /g, '').indexOf('$' + p.answer + '$') < 0, where + '힌트가 정답 보기를 그대로 말함');
    if (p.seed <= 60) noJosa(h.concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })), where);
  };
  /** 식을 항으로 나눈다: '3x - 2y + 5' → [{ c: 3, s: 'x', d: 1 }, …] */
  var terms = function (tex) {
    return tex.replace(/ - /g, ' + -').split(' + ').map(function (t) {
      var m = /^(-?)(\d*)(?:([a-z])(?:\^\{(\d)\})?)?$/.exec(t);
      if (!m) throw new Error('항을 읽을 수 없음 ' + t);
      return { c: (m[1] ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2])), s: m[3] ? m[3] + (m[4] ? '^{' + m[4] + '}' : '') : '', d: m[3] ? Number(m[4] || 1) : 0 };
    });
  };

  group('B06 — 항 · 계수 · 차수 (단계마다 1,000문제)');
  var asked = {};
  each('B06.coef', function (p, pr, level, where) {
    var ts = terms(pr.tex), want, m;
    ok(ts.every(function (t, k) { return t.c !== 0 && ts.every(function (u, j) { return j === k || u.s !== t.s; }); }), where + '같은 종류의 항이 두 번 나옴 ' + pr.tex);
    if ((m = /^\$(.+)\$의 계수를 구하세요\.$/.exec(pr.text))) { want = ts.filter(function (t) { return t.s === m[1]; }); ok(want.length === 1, where + '계수를 물은 항이 없음'); want = want.length ? want[0].c : null; asked.coef = 1; if (Math.abs(want) === 1) asked.one = 1; }
    else if (pr.text === '상수항을 구하세요.') { want = ts.filter(function (t) { return t.s === ''; }); ok(want.length === 1, where + '상수항이 없음'); want = want.length ? want[0].c : null; asked.cons = 1; }
    else if (pr.text === '항은 모두 몇 개일까요?') { want = ts.length; asked.count = 1; }
    else if (pr.text === '다항식의 차수를 구하세요.') { want = Math.max.apply(null, ts.map(function (t) { return t.d; })); asked['deg' + want] = 1; }
    else ok(false, where + '모르는 물음 ' + pr.text);
    ok(p.answer.p === 0 && p.answer.n === want, where + pr.tex + ' ' + pr.text + ' → ' + p.answer.n + ' (기대 ' + want + ')');
    ok(level === 2 || ts.every(function (t) { return t.d <= 1; }), where + '0 · 1단계는 일차식 ' + pr.tex);
    detailed('B06.coef', p, where);
  });
  ok(asked.coef && asked.one && asked.cons && asked.count && asked.deg1 && asked.deg2 && asked.deg3, '물음의 종류 ' + Object.keys(asked).join(' '));
  done('항 · 계수 · 차수');

  group('B06 — 보이는 식과 보기가 맞는가 (유형 · 단계마다 1,000문제)');
  /* 정답 보기만 원래 식과 값이 같다. 틀린 보기는 값이 모두 다르고, 저마다 실수 설명이 붙는다 */
  var choices = function (id, p, pr, where) {
    var opts = MH.optionsOf(p), want = sig(pr.tex), sigs = opts.map(sig);
    ok(want !== null, where + '식을 읽을 수 없음 ' + pr.tex);
    ok(opts.length === 4 && sigs.every(function (s, k) { return s !== null && sigs.indexOf(s) === k; }), where + '보기는 값이 서로 다른 네 개 ' + opts.join(' , '));
    ok(opts.indexOf(p.answer) >= 0 && sig(p.answer) === want, where + '정답 보기의 값 ' + pr.tex + ' → ' + p.answer);
    opts.forEach(function (o) {
      var j = MH.judge(p, o);
      if (o === p.answer) ok(j.verdict === 'correct', where + '정답 보기가 정답으로 판정되지 않음');
      else ok(j.verdict === 'wrong' && j.mistake && j.mistake.explain.length >= 30, where + '틀린 보기에 설명이 없음 ' + o);
    });
    /* 풀이의 식: '=' 가 있으면 양쪽이, 없으면 그 식이 원래 식과 같은 값 */
    MH.types[id].steps(p.v).forEach(function (s) {
      if (!s.tex) return;
      s.tex.split(' = ').forEach(function (part) { ok(id === 'B06.scale' && /^\(?-?\d+\)? \\(times|div) /.test(s.tex) && !/[a-z]/.test(s.tex.replace(/\\(times|div)/g, '')) ? true : sig(part) === want, where + '풀이의 식이 원래 식과 다름 ' + s.tex); });
    });
    detailed(id, p, where);
    return opts;
  };
  /** 다 정리된 일차식인가: 같은 종류의 항이 한 번씩, 문자는 알파벳 순서, 상수항은 맨 뒤, 쓸모없는 1 · 0 이 없음 */
  var tidy = function (t) {
    if (!/^-?(\d+[a-z]?|[a-z])([+-](\d+[a-z]?|[a-z]))*$/.test(t)) return false;
    var ls = t.split(/[+-]/).filter(function (x) { return x; }).map(function (x) { return [x.replace(/[a-z]/, ''), x.replace(/\d+/, '')]; });
    return ls.every(function (x, k) { return x[0] !== '0' && !(x[0] === '1' && x[1]) && (k === 0 || (ls[k - 1][1] !== '' && (x[1] === '' || ls[k - 1][1] < x[1]))); });
  };
  var gcd = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; };
  each('B06.like', function (p, pr, level, where) {
    choices('B06.like', p, pr, where);
    ok(tidy(p.answer), where + '정답이 정리된 꼴이 아님 ' + p.answer);
    var ts = terms(pr.tex), kinds = ts.map(function (t) { return t.s; }).filter(function (s, k, a) { return a.indexOf(s) === k; });
    ok(kinds.length === (level === 0 ? 1 : level === 1 ? 2 : kinds.indexOf('') >= 0 ? 3 : 2) && ts.length > kinds.length, where + '단계의 꼴 ' + pr.tex);
  });
  done('동류항 정리');
  var forms = {};
  each('B06.scale', function (p, pr, level, where) {
    choices('B06.scale', p, pr, where);
    ok(tidy(p.answer), where + '정답이 정리된 꼴이 아님 ' + p.answer);
    var f = /\\dfrac/.test(pr.tex) ? 'frac' : /^-\(/.test(pr.tex) ? 'neg' : /\\div/.test(pr.tex) ? (/[+-] \d/.test(pr.tex) ? 'div' : 'monodiv') : / [+-] /.test(pr.tex) ? 'dist' : 'mono';
    forms[level + f] = 1;
    ok(level === 0 ? f === 'mono' || f === 'monodiv' : level === 1 ? f === 'dist' : f === 'frac' || f === 'neg' || f === 'div', where + '단계의 꼴 ' + pr.tex);
  });
  eq(Object.keys(forms).sort().join(' '), '0mono 0monodiv 1dist 2div 2frac 2neg', '일차식과 수의 곱셈 · 나눗셈: 단계마다 나오는 꼴');
  done('일차식과 수의 곱셈 · 나눗셈');
  each('B06.addsub', function (p, pr, level, where) {
    choices('B06.addsub', p, pr, where);
    ok(tidy(p.answer) && /[a-z][+-]\d+$/.test(p.answer), where + '정답은 문자가 있는 항과 상수항 ' + p.answer);
    var minus = /\) - \d?\(/.test(pr.tex), mult = /(^|- |\+ )\d\(/.test(pr.tex);
    ok(level === 0 ? !minus && !mult : level === 1 ? minus && !mult : mult, where + '단계의 꼴 ' + pr.tex);
  });
  done('일차식의 덧셈과 뺄셈');
  each('B06.frac', function (p, pr, level, where) {
    choices('B06.frac', p, pr, where);
    var m = /^\\frac\{(-?\d*)[a-z]([+-]\d+)\}\{(\d+)\}$/.exec(p.answer), d = pr.tex.match(/\}\{(\d+)\}/g).map(function (x) { return Number(x.replace(/\D/g, '')); });
    ok(!!m, where + '정답은 분수 하나 ' + p.answer);
    if (m) {
      var a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
      ok(gcd(gcd(a, Number(m[2])), Number(m[3])) === 1 && m[1] !== '1' && m[1] !== '-1', where + '정답이 더 약분됨 ' + p.answer);
      ok(Number(m[3]) === d[0] * d[1] / gcd(d[0], d[1]), where + '분모는 최소공배수 ' + p.answer);
    }
    ok(d.length === 2 && (level === 0 ? d[0] === d[1] : d[0] !== d[1]) && (level === 1 ? /\} \+ \\dfrac/.test(pr.tex) : level === 2 ? /\} - \\dfrac/.test(pr.tex) : true), where + '단계의 꼴 ' + pr.tex);
  });
  done('분수 꼴 일차식의 계산');

  group('B06 — 흔한 실수와 풀이 · 힌트의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var EX = function (p, raw) { return MH.judge(p, raw).mistake.explain; };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var show = function (p) { return MH.types[p.type].prompt(p.v).tex + ' → ' + MH.optionsOf(p).join(' , '); };
  var judges = function (p) { return MH.optionsOf(p).map(function (o) { return J(p, o); }).join(' '); };
  var O = [0, 1, 2, 3];
  var c1 = prob('B06.coef', { q: { t: [[3, 'x'], [-5, '']], ask: 'coef', of: 'x' } }), c2 = prob('B06.coef', { q: { t: [[-1, 'a'], [4, '']], ask: 'coef', of: 'a' } });
  var c3 = prob('B06.coef', { q: { t: [[2, 'x^{2}'], [-4, 'x'], [1, '']], ask: 'degree', of: 'x' } }), c4 = prob('B06.coef', { q: { t: [[2, 'x'], [-1, 'y'], [7, '']], ask: 'count', of: 'x' } });
  var c5 = prob('B06.coef', { q: { t: [[3, 'x'], [-5, '']], ask: 'const', of: 'x' } });
  eq(MH.types['B06.coef'].prompt(c1.v).tex + ' / ' + [J(c1, '3'), J(c1, '-3'), J(c1, '-5'), J(c1, '8')].join(' '), '3x - 5 / correct:- wrong:sign wrong:other-term wrong:-', '3x − 5 에서 x 의 계수');
  eq([J(c2, '-1'), J(c2, '0'), J(c2, '1'), J(c2, '4')].join(' '), 'correct:- wrong:no-one wrong:sign wrong:other-term', '−a + 4 에서 a 의 계수');
  eq(MH.types['B06.coef'].prompt(c3.v).tex + ' / ' + [J(c3, '2'), J(c3, '3')].join(' ') + ' / ' + [J(c4, '3'), J(c4, '2')].join(' ') + ' / ' + [J(c5, '-5'), J(c5, '5'), J(c5, '3')].join(' '),
    '2x^{2} - 4x + 1 / correct:- wrong:degree-count / correct:- wrong:const-not-term / correct:- wrong:sign wrong:other-term', '차수 · 항의 개수 · 상수항');
  eq(says(c2), '식을 항으로 나눠요(−는 뒤의 항에 붙여요): $-a$, $4$ | 문자 부분이 $a$인 항을 찾아요: $-a$. 문자 앞에 수가 없으니 −1이 생략된 것이에요. 계수는 −1이에요.', '생략된 1 의 풀이');
  eq(MH.types['B06.coef'].hints(c1.v)[1], '자를 때 −는 바로 뒤의 항에 붙여서 가져가요. 이 식을 항으로 나누면 이렇게 돼요: $3x$, $-5$', '항으로 나누는 힌트');

  var l1 = prob('B06.like', { q: { t: [[3, 'x'], [5, ''], [-1, 'x'], [2, '']], o: O } }), l2 = prob('B06.like', { q: { t: [[3, 'x'], [4, 'x']], o: O } });
  eq(show(l1) + ' / ' + judges(l1), '3x + 5 - x + 2 → 2x+7 , 9x , 4x+7 , 3x+7 / correct:- wrong:unlike wrong:sign wrong:no-one', '3x + 5 − x + 2');
  eq(says(l1), '같은 종류의 항끼리 모아요. 부호를 함께 옮겨요. [3x - x + 5 + 2] | 계수끼리 계산하고 문자는 그대로 붙여요. [(3 - 1)x + (5 + 2)] | 종류가 다른 항은 더 합칠 수 없어요. 이것이 답이에요. [3x + 5 - x + 2 = 2x + 7]', '동류항 정리의 풀이');
  eq(MH.optionsOf(l2).slice(0, 2).join(' , ') + ' / ' + J(l2, '7x^{2}'), '7x , 7x^{2} / wrong:squared', '3x + 4x');
  eq(EX(l1, '9x'), '종류가 다른 항까지 합쳤어요. 문자가 있는 항과 수만 있는 항, 문자가 서로 다른 항은 합칠 수 없어요. 사과 3개와 귤 2개를 "사과귤 5개"라고 할 수 없는 것과 같아요.', '다른 종류를 합친 실수의 설명');

  var s1 = prob('B06.scale', { q: { k: 'dist', x: 'x', n: -2, a: 1, b: -3, o: O } }), s2 = prob('B06.scale', { q: { k: 'neg', x: 'a', a: 2, b: -5, o: O } });
  var s3 = prob('B06.scale', { q: { k: 'mono', x: 'y', a: 3, n: -6, op: '×', o: O } }), s4 = prob('B06.scale', { q: { k: 'div', x: 'x', n: 3, a: 6, b: -9, o: O } });
  eq(show(s1) + ' / ' + judges(s1), '-2(x - 3) → -2x+6 , -2x-3 , -2x-6 , -x-5 / correct:- wrong:first-only wrong:sign-second wrong:added', '−2(x − 3)');
  eq(says(s1), '괄호 안의 모든 항에 곱해요(분배법칙). [(-2) \\times x + (-2) \\times (-3)] | 항마다 계산해요. 부호에 주의해요. [-2(x - 3) = -2x + 6]', '분배법칙의 풀이');
  eq(show(s2) + ' / ' + judges(s2), '-(2a - 5) → -2a+5 , -2a-5 , 2a-5 , 2a+5 / correct:- wrong:first-only wrong:no-change wrong:sign', '−(2a − 5)');
  eq(show(s3) + ' / ' + judges(s3), '3y \\times (-6) → -18y , -18 , 18y , -3y / correct:- wrong:no-letter wrong:sign wrong:added', '3y × (−6)');
  eq(show(s4) + ' / ' + judges(s4), '(6x - 9) \\div 3 → 2x-3 , 2x-9 , 2x+3 , 18x-27 / correct:- wrong:first-only wrong:sign-second wrong:wrong-op', '(6x − 9) ÷ 3');

  var a1 = prob('B06.addsub', { q: { x: 'x', p: [[1, 3, 2], [1, 1, -5]], op: '-', o: O } }), a2 = prob('B06.addsub', { q: { x: 'a', p: [[2, 1, -1], [3, 1, 2]], op: '+', o: O } });
  eq(show(a1) + ' / ' + judges(a1), '(3x + 2) - (x - 5) → 2x+7 , 2x-3 , 4x-3 , 9x / correct:- wrong:minus-first-only wrong:added-op wrong:unlike', '(3x + 2) − (x − 5)');
  eq(says(a1), '괄호를 풀어요. −가 붙은 괄호는 안의 모든 항의 부호가 바뀌어요. [(3x + 2) - (x - 5) = 3x + 2 - x + 5] | 동류항끼리 모아요. [3x - x + 2 + 5] | 같은 종류끼리 계수를 계산해요. [2x + 7]', '뺄셈의 풀이');
  eq(show(a2) + ' / ' + judges(a2), '2(a - 1) + 3(a + 2) → 5a+4 , 5a+1 , 9a , 5a-8 / correct:- wrong:first-only wrong:unlike wrong:sign', '2(a − 1) + 3(a + 2)');

  var f1 = prob('B06.frac', { q: { x: 'x', f: [[2, 1, 3], [1, -4, 4]], op: '-', o: O } });
  eq(show(f1) + ' / ' + judges(f1), '\\dfrac{2x + 1}{3} - \\dfrac{x - 4}{4} → \\frac{5x+16}{12} , \\frac{5x-8}{12} , \\frac{x+5}{7} , \\frac{x+5}{12} / correct:- wrong:minus-first-only wrong:no-common wrong:numer-only', '분모가 다른 뺄셈');
  eq(says(f1), '분모의 최소공배수 12로 통분해요. 분모에 곱한 수를 분자 전체에 곱해요. [\\dfrac{4(2x + 1)}{12} - \\dfrac{3(x - 4)}{12}] | 분모는 그대로 두고 분자끼리 한 분수로 써요. 분자는 괄호로 묶어 둬요. [\\dfrac{4(2x + 1) - 3(x - 4)}{12}] | 분자의 괄호를 풀어요. − 뒤의 괄호는 모든 항의 부호가 바뀌어요. [\\dfrac{8x + 4 - 3x + 12}{12}] | 분자에서 동류항끼리 계산해요. [\\frac{5x + 16}{12}]'.replace('[\\frac{5x', '[\\dfrac{5x'), '분수 꼴의 풀이');
  eq(EX(f1, '\\frac{5x-8}{12}'), '빼는 식의 첫 항만 부호를 바꿨어요. 괄호 앞에 −가 있으면 괄호 안의 모든 항의 부호가 바뀌어요.', '첫 항만 부호를 바꾼 실수의 설명');
  done('실수 · 풀이 · 힌트 예');
})();
