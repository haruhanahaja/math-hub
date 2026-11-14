/* A11 분수의 곱셈 — 단원 전용 검사.
   화면에 보이는 식 · 문제 글을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000, K = MH.kinds.fraction;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var B = function (x) { return BigInt(x); };
  var g = function (a, b) { a = B(a); b = B(b); while (b) { var t = a % b; a = b; b = t; } return a; };
  /** 곱셈식을 읽는다: 인수마다 { w, n, d, whole }(자연수 인수는 whole). 읽을 수 없으면 null */
  var readProduct = function (tex) {
    var out = [], bad = false;
    tex.split(' \\times ').forEach(function (t) {
      var m = /^(\d*)\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(t), k = /^\d+$/.test(t);
      if (m) out.push({ w: B(m[1] || 0), n: B(m[2]), d: B(m[3]), whole: false });
      else if (k) out.push({ w: B(t), n: 0n, d: 1n, whole: true });
      else bad = true;
    });
    return bad || out.length < 2 ? null : out;
  };
  /** 답이 인수들의 곱과 같은 기약분수인가 */
  var check = function (p, pr, where) {
    var fs = readProduct(pr.tex || '');
    if (!ok(!!fs, where + '문제 글 형식 ' + pr.tex)) return null;
    var n = 1n, d = 1n;
    fs.forEach(function (f) { n *= f.w * f.d + f.n; d *= f.d; });
    ok(B(p.answer.n) * d === n * B(p.answer.d), where + pr.tex + ' → ' + p.answer.n + '/' + p.answer.d);
    ok(g(p.answer.n, p.answer.d) === 1n && p.answer.d > 1, where + '답은 자연수가 아닌 기약분수 ' + p.answer.n + '/' + p.answer.d);
    ok(fs.every(function (f) { return f.whole || (f.n >= 1n && f.n < f.d && g(f.n, f.d) === 1n); }), where + '분수 부분은 기약인 진분수 ' + pr.tex);
    return fs;
  };
  var cross = function (fs) { var c = 0; fs.forEach(function (x, i) { fs.forEach(function (y, j) { if (i !== j && g(x.w * x.d + x.n, y.d) > 1n) c++; }); }); return c; };

  group('A11 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var orders = {};
  each('A11.by-whole', function (p, pr, level, where) {
    var fs = check(p, pr, where); if (!fs) return;
    var fr = fs[0].whole ? fs[1] : fs[0], k = fs[0].whole ? fs[0] : fs[1];
    if (!ok(fs.length === 2 && k.whole && !fr.whole && k.w >= 2n, where + '분수 하나와 자연수 하나 ' + pr.tex)) return;
    if (level === 0) ok(fr.w === 0n && !fs[0].whole && g(k.w, fr.d) === 1n, where + '진분수 × 자연수(약분 없음) ' + pr.tex);
    if (level === 1) ok(fr.w === 0n && g(k.w, fr.d) > 1n, where + '약분이 필요한 곱 ' + pr.tex);
    if (level === 2) ok(fr.w >= 1n, where + '대분수 × 자연수 ' + pr.tex);
    orders[level + (fs[0].whole ? '자연수 먼저' : '분수 먼저')] = 1;
  });
  eq(Object.keys(orders).sort().join(' | '), '0분수 먼저 | 1분수 먼저 | 1자연수 먼저 | 2분수 먼저 | 2자연수 먼저', '곱하는 순서가 섞여 나옴');
  done('분수와 자연수의 곱');
  each('A11.frac', function (p, pr, level, where) {
    var fs = check(p, pr, where); if (!fs) return;
    if (!ok(fs.length === 2 && fs.every(function (f) { return !f.whole && f.w === 0n; }), where + '진분수 둘 ' + pr.tex)) return;
    var plain = g(fs[0].n * fs[1].n, fs[0].d * fs[1].d) === 1n;
    if (level === 0) ok(fs[0].n === 1n && fs[1].n === 1n, where + '단위분수끼리 ' + pr.tex);
    if (level === 1) ok(plain && fs[0].n * fs[1].n > 1n, where + '약분이 필요 없는 곱 ' + pr.tex);
    if (level === 2) ok(!plain, where + '곱한 뒤 약분이 필요한 곱 ' + pr.tex);
  });
  done('분수끼리의 곱');
  each('A11.cancel', function (p, pr, level, where) {
    var fs = check(p, pr, where); if (!fs) return;
    if (!ok(fs.length === (level === 2 ? 3 : 2) && fs.every(function (f) { return !f.whole && f.w === 0n; }), where + '진분수 ' + (level === 2 ? '셋' : '둘') + ' ' + pr.tex)) return;
    ok(level === 0 ? cross(fs) === 1 : level === 1 ? cross(fs) === 2 : cross(fs) >= 1, where + '서로 약분할 수 있는 쌍의 수 ' + cross(fs) + ' ' + pr.tex);
    ok(p.answer.n < p.answer.d, where + '답은 1보다 작음');
  });
  done('곱하기 전에 약분');
  each('A11.mixed', function (p, pr, level, where) {
    var fs = check(p, pr, where); if (!fs) return;
    if (!ok(fs.length === 2 && fs.every(function (f) { return !f.whole; }), where + '분수 둘 ' + pr.tex)) return;
    var mixed = fs.filter(function (f) { return f.w >= 1n; }).length;
    ok(mixed === (level === 0 ? 1 : 2), where + (level === 0 ? '대분수 하나와 진분수 하나 ' : '대분수 둘 ') + pr.tex);
    if (level === 1) ok(cross(fs) === 0, where + '약분 없이 곱하는 문제 ' + pr.tex);
    if (level === 2) ok(cross(fs) >= 1, where + '약분할 수 있는 문제 ' + pr.tex);
  });
  done('대분수의 곱');
  var stories = {};
  each('A11.of', function (p, pr, level, where) {
    var m = /^\D+ (\d+)\D* 가운데 \$\\dfrac\{(\d+)\}\{(\d+)\}\$([을를]) .+ (.+ 몇 (.+)일까요\?)$/.exec(pr.text);
    if (!ok(!!m && !pr.tex, where + '문제 글 형식 ' + pr.text)) return;
    var total = B(m[1]), a = B(m[2]), b = B(m[3]), rest = /남은|않은/.test(pr.text);
    ok(total % b === 0n && a < b && g(a, b) === 1n, where + '전체가 분모로 나누어떨어지는 기약 진분수 ' + pr.text);
    var used = total / b * a;
    ok(B(p.answer) === (rest ? total - used : used) && p.answer > 0, where + pr.text + ' → ' + p.answer);
    ok(level === 0 ? a === 1n && !rest : level === 1 ? a > 1n && !rest : a > 1n && rest, where + '단계에 맞는 물음 ' + pr.text);
    eq(m[4], MH.josa(Number(a), '을/를').slice(-1), where + '분수 뒤의 조사');
    eq(MH.types['A11.of'].answer.suffix(p.v), m[6], where + '답 칸의 단위');
    stories[m[6]] = 1;
  });
  eq(Object.keys(stories).sort().join(' '), 'L m 개 쪽', '이야기 네 가지가 모두 나옴');
  done('전체의 몇 분의 몇');

  group('A11 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v, null) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var tex = function (p) { return K.tex(p.answer, MH.types[p.type].answer); };

  var w1 = prob('A11.by-whole', { w: 0, b: 4, a: 3, k: 6, first: 1 });          /* 3/4 × 6 = 9/2 */
  eq(tex(w1), '4\\dfrac{1}{2}', '3/4 × 6 = 4와 1/2');
  eq(J(w1, ',9,2') + ' ' + J(w1, '4,1,2') + ' ' + J(w1, ',18,4') + ' ' + J(w1, '4,2,4'), 'correct:- correct:- correct-note:- correct-note:-', '가분수 · 대분수 · 약분 안 된 답');
  eq(J(w1, ',18,24') + ' ' + J(w1, ',3,4') + ' ' + J(w1, ',3,24') + ' ' + J(w1, ',9,4') + ' ' + J(w1, ',5,2'), 'wrong:both-multiplied wrong:both-multiplied wrong:denominator-multiplied wrong:added wrong:-', '3/4 × 6 의 실수');
  eq(says(w1), '4분의 3 × 6은 4분의 3을 6번 더한 것과 같아요. 4분의 1이 모두 3 × 6 = 18개예요. | 자연수는 분자에만 곱해요. 분모는 그대로 4예요: 3 × 6 = 18. [\\dfrac{3}{4} \\times 6 = \\dfrac{3 \\times 6}{4} = \\dfrac{18}{4}] | 분자 18과 분모 4를 2로 나눠 약분해요. [\\dfrac{18}{4} = \\dfrac{9}{2}] | 분자가 분모보다 커요. 9 ÷ 2 = 4 … 1이니까 대분수로 쓰면 4와 2분의 1이에요. [\\dfrac{9}{2} = 4\\dfrac{1}{2}]', '분수 × 자연수 풀이');
  var w2 = prob('A11.by-whole', { w: 1, b: 3, a: 2, k: 2, first: 0 });          /* 2 × 1과 2/3 = 10/3 */
  eq(MH.types['A11.by-whole'].prompt(w2.v).tex, '2 \\times 1\\dfrac{2}{3}', '자연수가 앞에 오는 식');
  eq(J(w2, '3,1,3') + ' ' + J(w2, ',10,3') + ' ' + J(w2, '2,2,3') + ' ' + J(w2, ',7,3') + ' ' + J(w2, '1,4,3'), 'correct:- correct:- wrong:whole-only wrong:fraction-only wrong:fraction-only', '2 × 1과 2/3 의 답과 실수 (1과 4/3 도 분수 부분에만 곱한 실수)');

  var f1 = prob('A11.frac', { b: 3, d: 3, a: 1, c: 2 });                        /* 1/3 × 2/3 = 2/9 */
  eq(J(f1, '2,9') + ' ' + J(f1, '2,3') + ' ' + J(f1, '2,6') + ' ' + J(f1, '3,6') + ' ' + J(f1, '9,9'), 'correct:- wrong:kept-denominator wrong:denominators-added wrong:cross wrong:added-instead', '1/3 × 2/3 의 답과 실수');
  eq(MH.judge(f1, '2,3').mistake.explain, '분모가 같다고 분모를 그대로 뒀어요. 그건 덧셈과 뺄셈의 방법이에요. 곱셈에서는 분모끼리도 곱해요: 3 × 3 = 9.', '분모를 그대로 둔 실수의 설명');
  var f2 = prob('A11.frac', { b: 5, d: 8, a: 4, c: 3 });                        /* 4/5 × 3/8 = 3/10 */
  eq(J(f2, '3,10') + ' ' + J(f2, '12,40') + ' ' + J(f2, '6,20'), 'correct:- correct-note:- correct-note:-', '4/5 × 3/8: 약분이 덜 된 답은 정답으로 하고 알려 줌');
  eq(says(f2), '분수의 곱셈은 통분하지 않고, 분자는 분자끼리 분모는 분모끼리 곱해요. | 분자: 4 × 3 = 12, 분모: 5 × 8 = 40. [\\dfrac{4}{5} \\times \\dfrac{3}{8} = \\dfrac{4 \\times 3}{5 \\times 8} = \\dfrac{12}{40}] | 분자 12와 분모 40을 4로 나눠 약분해요. [\\dfrac{12}{40} = \\dfrac{3}{10}]', '분수 × 분수 풀이');

  var c1 = prob('A11.cancel', { a: 3, b: 8, c: 4, d: 9, e: 1, f: 1 });          /* 3/8 × 4/9 = 1/6 */
  eq(tex(c1), '\\dfrac{1}{6}', '3/8 × 4/9 = 1/6');
  eq(J(c1, '1,6') + ' ' + J(c1, '12,72') + ' ' + J(c1, '4,72') + ' ' + J(c1, '27,32'), 'correct:- correct-note:- wrong:numerator-only-cancel wrong:cross', '3/8 × 4/9 의 답과 실수');
  eq(says(c1), '곱하기 전에 약분해요. 분자 3과 분모 9를 3으로 나눠요: 3 ÷ 3 = 1, 9 ÷ 3 = 3. [\\dfrac{3}{8} \\times \\dfrac{4}{9} = \\dfrac{1}{8} \\times \\dfrac{4}{3}] | 한 번 더 약분해요. 분자 4와 분모 8을 4로 나눠요: 4 ÷ 4 = 1, 8 ÷ 4 = 2. [\\dfrac{1}{8} \\times \\dfrac{4}{3} = \\dfrac{1}{2} \\times \\dfrac{1}{3}] | 남은 수로 분자는 분자끼리, 분모는 분모끼리 곱해요: 분자 1 × 1 = 1, 분모 2 × 3 = 6. [\\dfrac{1}{2} \\times \\dfrac{1}{3} = \\dfrac{1}{6}]', '곱하기 전에 약분하는 풀이');
  var c2 = prob('A11.cancel', { a: 4, b: 9, c: 6, d: 7, e: 1, f: 1 });          /* 4/9 × 6/7 = 8/21 */
  eq(J(c2, '8,21') + ' ' + J(c2, '6,63') + ' ' + J(c2, '8,63'), 'correct:- wrong:same-side-cancel wrong:numerator-only-cancel', '4/9 × 6/7 에서 분자 4와 6을 서로 약분 → 6/63, 분자 6만 3으로 나눔 → 8/63');
  eq(MH.judge(c2, '6,63').mistake.explain, '분자 4와 분자 6을 서로 약분했어요. 약분은 분자와 분모 사이에서만 할 수 있어요. 분자끼리는 약분하지 않아요.', '분자끼리 약분한 실수의 설명');
  var c3 = prob('A11.cancel', { a: 9, b: 20, c: 5, d: 9, e: 1, f: 1 });         /* 9/20 × 5/9 = 1/4 */
  eq(says(c3).split(' | ')[0], '곱하기 전에 약분해요. 분자 9와 분모 9를 9로 나눠요: 9 ÷ 9 = 1, 9 ÷ 9 = 1. [\\dfrac{9}{20} \\times \\dfrac{5}{9} = \\dfrac{1}{20} \\times 5]', '약분해서 분모가 1 이 되면 자연수로 씀');

  var m1 = prob('A11.mixed', { w1: 2, w2: 1, flip: 0, b: 4, d: 6, a: 1, c: 1 });  /* 2와 1/4 × 1과 1/6 = 21/8 */
  eq(tex(m1), '2\\dfrac{5}{8}', '2와 1/4 × 1과 1/6 = 2와 5/8');
  eq(J(m1, '2,5,8') + ' ' + J(m1, ',21,8') + ' ' + J(m1, '2,1,24') + ' ' + J(m1, ',14,24') + ' ' + J(m1, ',54,28'), 'correct:- correct:- wrong:parts-separately wrong:whole-times-numerator wrong:cross', '대분수 곱의 답과 실수');
  eq(MH.judge(m1, '2,1,24').mistake.explain, '자연수끼리(2 × 1), 분수끼리 따로 곱했어요. 곱셈은 덧셈처럼 따로 계산할 수 없어요. 먼저 가분수로 바꿔요: 2와 4분의 1 = 4분의 9, 1과 6분의 1 = 6분의 7.', '따로 곱한 실수의 설명');
  var m2 = prob('A11.mixed', { w1: 1, w2: 1, flip: 1, b: 5, d: 5, a: 4, c: 2 });  /* 화면에는 1과 2/5 × 1과 4/5 */
  eq(MH.types['A11.mixed'].prompt(m2.v).tex, '1\\dfrac{2}{5} \\times 1\\dfrac{4}{5}', '자리를 바꿔 보여 주는 식');
  eq(says(m2).split(' | ')[0], '대분수를 가분수로 바꿔요. 1 × 5 + 2 = 7, 1 × 5 + 4 = 9. [1\\dfrac{2}{5} = \\dfrac{7}{5},\\quad 1\\dfrac{4}{5} = \\dfrac{9}{5}]', '풀이는 화면에 보이는 순서대로');

  var o1 = prob('A11.of', { s: 0, q: 0, b: 7, a: 3, m: 6, N: 42 });             /* 42 m 의 3/7 = 18 */
  eq(MH.types['A11.of'].prompt(o1.v).text, '리본 42 m 가운데 $\\dfrac{3}{7}$을 선물 포장에 썼어요. 쓴 리본은 몇 m일까요?', '문제 글(분수는 수식으로)');
  eq(J(o1, '18') + ' ' + J(o1, '6') + ' ' + J(o1, '126') + ' ' + J(o1, '294') + ' ' + J(o1, '24') + ' ' + J(o1, '19'), 'correct:- wrong:divided-only wrong:numerator-only wrong:times-denominator wrong:rest-instead wrong:-', '42 의 3/7 의 답과 실수');
  var o2 = prob('A11.of', { s: 0, q: 1, b: 7, a: 3, m: 6, N: 42 });             /* 남은 리본 24 */
  eq(J(o2, '24') + ' ' + J(o2, '18'), 'correct:- wrong:used-part', '남은 양을 묻는 문제');
  eq(says(o2), '전체 42의 7분의 3을 구하는 것은 42에 7분의 3을 곱하는 것과 같아요. [42 \\times \\dfrac{3}{7}] | 전체의 7분의 1은 42 ÷ 7 = 6이에요. [42 \\div 7 = 6] | 7분의 3은 그것의 3배예요: 6 × 3 = 18. 쓴 양은 18 m예요. [42 \\times \\dfrac{3}{7} = 18] | 남은 양은 전체에서 그만큼을 빼요: 42 − 18 = 24. 답은 24 m예요. [42 - 18 = 24]', '남은 양 풀이');
  eq(MH.judge(prob('A11.of', { s: 3, q: 0, b: 4, a: 1, m: 6, N: 24 }), '18').mistake.explain, '남은 사과를 답했어요. 묻는 것은 나눠 준 사과예요: 24 ÷ 4 = 6.', '남은 양을 답한 실수의 설명');
  done('판정 · 실수 · 풀이 예');
})();
