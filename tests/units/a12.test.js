/* A12 분수의 나눗셈 — 단원 전용 검사.
   화면에 보이는 식을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
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
  /** 수 하나를 읽는다: { w, n, d, whole, top(가분수의 분자) }. 읽을 수 없으면 null */
  var readNumber = function (t) {
    var m = /^(\d*)\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(t), o = null;
    if (m) o = { w: B(m[1] || 0), n: B(m[2]), d: B(m[3]), whole: false };
    else if (/^\d+$/.test(t)) o = { w: B(t), n: 0n, d: 1n, whole: true };
    if (o) o.top = o.w * o.d + o.n;
    return o;
  };
  /** 나눗셈식 X ÷ Y 를 읽는다 */
  var readDivision = function (tex) {
    var parts = String(tex || '').split(' \\div '), x = parts.length === 2 ? parts.map(readNumber) : [null];
    return x.every(function (o) { return !!o; }) ? x : null;
  };
  /** 분수 부분은 기약인 진분수인가(자연수는 통과) */
  var proper = function (o) { return o.whole || (o.n >= 1n && o.n < o.d && g(o.n, o.d) === 1n); };
  /** 답(기약분수)이 X ÷ Y 와 같은가: 답 × Y = X */
  var check = function (p, pr, where) {
    var x = readDivision(pr.tex);
    if (!ok(!!x && !pr.text, where + '문제 글 형식 ' + pr.tex)) return null;
    ok(B(p.answer.n) * x[1].top * x[0].d === x[0].top * x[1].d * B(p.answer.d), where + pr.tex + ' → ' + p.answer.n + '/' + p.answer.d);
    ok(g(p.answer.n, p.answer.d) === 1n && p.answer.d > 1, where + '답은 자연수가 아닌 기약분수 ' + p.answer.n + '/' + p.answer.d);
    ok(proper(x[0]) && proper(x[1]), where + '분수 부분은 기약인 진분수 ' + pr.tex);
    return x;
  };
  /** 역수의 곱셈으로 바꿨을 때 약분할 수 있는 쌍이 있는가 */
  var cancels = function (x) { return g(x[0].top, x[1].top) > 1n || g(x[0].d, x[1].d) > 1n; };

  group('A12 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var forms = {};
  each('A12.reciprocal', function (p, pr, level, where) {
    var o = readNumber(pr.tex || '');
    if (!ok(!!o && pr.text === '이 수의 역수를 쓰세요.', where + '문제 글 형식 ' + pr.tex)) return;
    ok(B(p.answer.n) * o.top === B(p.answer.d) * o.d, where + pr.tex + ' 와 곱하면 1 → ' + p.answer.n + '/' + p.answer.d);
    ok(g(p.answer.n, p.answer.d) === 1n, where + '답은 기약분수');
    ok(o.whole || g(o.n, o.d) === 1n, where + '보이는 분수는 기약분수 ' + pr.tex);
    var kind = o.whole ? '자연수' : o.w >= 1n ? '대분수' : o.n === 1n ? '단위분수' : o.n < o.d ? '진분수' : '가분수';
    if (level === 0) ok(kind === '진분수', where + '진분수 ' + pr.tex);
    if (level === 1) ok(kind === '자연수' || kind === '단위분수' || kind === '가분수', where + '자연수 · 단위분수 · 가분수 ' + pr.tex);
    if (level === 2) ok(kind === '대분수' && o.n < o.d, where + '대분수 ' + pr.tex);
    if (kind === '자연수') ok(o.w >= 2n, where + '1 의 역수는 내지 않음');
    if (kind === '단위분수') ok(p.answer.d === 1, where + '단위분수의 역수는 자연수');
    forms[level + kind] = 1;
  });
  eq(Object.keys(forms).sort().join(' | '), '0진분수 | 1가분수 | 1단위분수 | 1자연수 | 2대분수', '수의 꼴이 단계에 맞게 고루 나옴');
  done('역수');
  each('A12.by-whole', function (p, pr, level, where) {
    var x = check(p, pr, where); if (!x) return;
    if (!ok(!x[0].whole && x[1].whole && x[1].w >= 2n, where + '분수 ÷ 자연수 ' + pr.tex)) return;
    if (level === 0) ok(x[0].w === 0n && x[0].n % x[1].w === 0n, where + '분자가 나누어떨어짐 ' + pr.tex);
    if (level === 1) ok(x[0].w === 0n && g(x[0].n, x[1].w) === 1n, where + '분자가 나누어떨어지지 않음(약분 없음) ' + pr.tex);
    if (level === 2) ok(x[0].w >= 1n, where + '대분수 ÷ 자연수 ' + pr.tex);
  });
  done('분수 ÷ 자연수');
  each('A12.count', function (p, pr, level, where) {
    var x = readDivision(pr.tex);
    if (!ok(!!x && !pr.text, where + '문제 글 형식 ' + pr.tex)) return;
    ok(typeof p.answer === 'number' && p.answer >= 1 && B(p.answer) * x[1].top * x[0].d === x[0].top * x[1].d, where + pr.tex + ' → ' + p.answer);
    ok(proper(x[0]) || level === 1, where + '나누어지는 수 ' + pr.tex);
    if (level === 0) ok(x[0].whole && !x[1].whole && x[1].w === 0n && x[1].n === 1n, where + '자연수 ÷ 단위분수 ' + pr.tex);
    if (level === 1) ok(!x[0].whole && !x[1].whole && x[0].w === 0n && x[1].w === 0n && x[0].d === x[1].d && x[0].n < x[0].d && x[0].n > x[1].n, where + '분모가 같은 진분수끼리 ' + pr.tex);
    if (level === 2) ok(x[0].whole && !x[1].whole && x[1].w === 0n && x[1].n >= 2n && proper(x[1]), where + '자연수 ÷ 진분수 ' + pr.tex);
  });
  done('몫이 자연수인 나눗셈');
  var dividends = {};
  each('A12.frac', function (p, pr, level, where) {
    var x = check(p, pr, where); if (!x) return;
    if (!ok(!x[1].whole && x[0].w === (x[0].whole ? x[0].w : 0n) && x[1].w === 0n, where + '진분수(또는 자연수) ÷ 진분수 ' + pr.tex)) return;
    if (level === 0) ok(!x[0].whole && x[0].d === x[1].d, where + '분모가 같음 ' + pr.tex);
    if (level === 1) { ok(x[0].d !== x[1].d && !cancels(x), where + '약분 없이 역수를 곱하는 문제 ' + pr.tex); dividends[x[0].whole ? '자연수' : '분수'] = 1; }
    if (level === 2) ok(!x[0].whole && x[0].d !== x[1].d && cancels(x), where + '약분할 수 있는 문제 ' + pr.tex);
  });
  eq(Object.keys(dividends).sort().join(' '), '분수 자연수', '역수를 곱하기 단계에 자연수 ÷ 분수도 나옴');
  done('분수 ÷ 분수');
  each('A12.mixed', function (p, pr, level, where) {
    var x = check(p, pr, where); if (!x) return;
    if (!ok(!x[0].whole && !x[1].whole, where + '분수 둘 ' + pr.tex)) return;
    if (level === 0) ok(x[0].w >= 1n && x[1].w === 0n, where + '대분수 ÷ 진분수 ' + pr.tex);
    if (level === 1) ok(x[1].w >= 1n && !cancels(x), where + '대분수로 나누기(약분 없음) ' + pr.tex);
    if (level === 2) ok(x[0].w >= 1n && x[1].w >= 1n && cancels(x), where + '대분수끼리, 약분할 수 있는 문제 ' + pr.tex);
  });
  done('대분수의 나눗셈');

  group('A12 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v, null) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var Js = function (p, raws) { return raws.map(function (r) { return J(p, r); }).join(' '); };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var tex = function (p) { return K.tex(p.answer, MH.types[p.type].answer); };
  var r1 = prob('A12.reciprocal', { w: 0, a: 3, b: 4 });                        /* 3/4 의 역수 4/3 */
  eq(Js(r1, [',4,3', '1,1,3', ',8,6', ',3,4', ',1,4', ',5,3']), 'correct:- correct:- correct-note:- wrong:unchanged wrong:complement wrong:-', '3/4 의 역수: 답과 실수');
  eq(says(r1), '역수는 곱해서 1이 되는 수예요. 분수는 분자와 분모의 자리를 바꾸면 돼요. | 분자와 분모의 자리를 바꿔요. 4분의 3의 역수는 3분의 4예요. 곱하면 1이 돼요. [\\dfrac{3}{4} \\times \\dfrac{4}{3} = 1]', '역수 풀이');
  var r2 = prob('A12.reciprocal', { w: 0, a: 5, b: 1 });                        /* 5 의 역수 1/5 */
  eq(MH.types['A12.reciprocal'].prompt(r2.v).tex, '5', '자연수는 자연수로 보여 줌');
  eq(Js(r2, [',1,5', '5,,', ',5,1', ',2,10']), 'correct:- wrong:unchanged wrong:unchanged correct-note:-', '5 의 역수: 답과 실수');
  eq(MH.judge(r2, '5,,').mistake.explain, '수를 그대로 썼어요. 역수는 곱해서 1이 되는 수예요. 자연수 5는 1분의 5로 보고 분자와 분모의 자리를 바꿔요.', '자연수를 그대로 쓴 실수의 설명');
  eq(MH.judge(prob('A12.reciprocal', { w: 0, a: 10, b: 1 }), '10,,').mistake.explain, '수를 그대로 썼어요. 역수는 곱해서 1이 되는 수예요. 자연수 10은 1분의 10으로 보고 분자와 분모의 자리를 바꿔요.', '받침에 맞는 조사(10으로)');
  var r3 = prob('A12.reciprocal', { w: 0, a: 1, b: 7 });                        /* 1/7 의 역수 7 */
  eq(tex(r3) + ' ' + Js(r3, ['7,,', ',7,1', ',1,7', ',6,7']), '7 correct:- correct:- wrong:unchanged wrong:complement', '단위분수의 역수는 자연수');
  var r4 = prob('A12.reciprocal', { w: 2, a: 1, b: 3 });                        /* 2와 1/3 의 역수 3/7 */
  eq(Js(r4, [',3,7', ',7,3', '2,1,3', '5,,', '2,3,1']), 'correct:- wrong:unchanged wrong:unchanged wrong:fraction-part-only wrong:fraction-part-only', '대분수의 역수: 답과 실수');
  eq(MH.judge(r4, '5,,').mistake.explain, '분수 부분 3분의 1만 뒤집고 자연수 2는 그대로 뒀어요. 대분수는 먼저 가분수 3분의 7로 바꾼 다음 통째로 뒤집어요.', '분수 부분만 뒤집은 실수의 설명');
  eq(says(r4), '대분수를 가분수로 바꿔요. 분자는 2 × 3 + 1 = 7이에요. [2\\dfrac{1}{3} = \\dfrac{7}{3}] | 분자와 분모의 자리를 바꿔요. 3분의 7의 역수는 7분의 3이에요. 곱하면 1이 돼요. [\\dfrac{7}{3} \\times \\dfrac{3}{7} = 1]', '대분수의 역수 풀이');

  var w1 = prob('A12.by-whole', { w: 0, k: 2, m: 2, b: 11, a: 4 });             /* 4/11 ÷ 2 = 2/11 */
  eq(Js(w1, [',2,11', ',4,22', ',8,11', ',22,4', '5,1,2', ',4,11']), 'correct:- correct-note:- wrong:multiplied wrong:flipped-dividend wrong:flipped-dividend wrong:-', '4/11 ÷ 2 의 답과 실수');
  eq(says(w1), '나누는 수 2의 역수는 2분의 1이에요. 나눗셈을 역수의 곱셈으로 바꿔요. [\\dfrac{4}{11} \\div 2 = \\dfrac{4}{11} \\times \\dfrac{1}{2}] | 곱하기 전에 약분해요. 분자 4와 분모 2를 2로 나눠요: 4 ÷ 2 = 2, 2 ÷ 2 = 1. [\\dfrac{4}{11} \\times \\dfrac{1}{2} = \\dfrac{2}{11}]', '약분하고 나면 곱할 것이 없는 풀이(× 1 은 쓰지 않음)');
  var w2 = prob('A12.by-whole', { w: 0, k: 3, b: 5, a: 2 });                    /* 2/5 ÷ 3 = 2/15 */
  eq(Js(w2, [',2,15', ',6,5', '1,1,5', '7,1,2']), 'correct:- wrong:multiplied wrong:multiplied wrong:flipped-dividend', '2/5 ÷ 3 의 답과 실수');
  eq(says(w2).split(' | ')[1], '분자는 분자끼리, 분모는 분모끼리 곱해요: 분자 2, 분모 5 × 3 = 15. [\\dfrac{2}{5} \\times \\dfrac{1}{3} = \\dfrac{2}{15}]', '분모에 자연수를 곱하는 풀이');
  var w3 = prob('A12.by-whole', { w: 2, k: 2, b: 3, a: 2 });                    /* 2와 2/3 ÷ 2 = 4/3 */
  eq(tex(w3), '1\\dfrac{1}{3}', '2와 2/3 ÷ 2 = 1과 1/3');
  eq(Js(w3, ['1,1,3', ',4,3', ',8,6', '1,2,3', '2,1,3', '5,1,3', ',3,4']), 'correct:- correct:- correct-note:- wrong:whole-part-only wrong:fraction-part-only wrong:multiplied wrong:flipped-dividend', '대분수 ÷ 자연수의 답과 실수');
  eq(MH.judge(w3, '1,2,3').mistake.explain, '자연수 부분 2만 2로 나눴어요. 분수 부분 3분의 2도 나눠야 해요. 가분수 3분의 8로 바꿔서 나누면 빠뜨리지 않아요.', '자연수 부분만 나눈 실수의 설명');

  var c1 = prob('A12.count', { form: 0, k: 8, b: 4, a: 1, c: 1, m: 1 });        /* 8 ÷ 1/4 = 32 */
  eq(Js(c1, ['32', '4', '2', '7']), 'correct:- wrong:denominator-only wrong:divided-instead wrong:-', '8 ÷ 1/4 의 답과 실수');
  eq(says(c1), '1 안에는 4분의 1이 4번 들어가요. [1 \\div \\dfrac{1}{4} = 4] | 8은 1이 8개니까 8 × 4 = 32번 들어가요. 4분의 1의 역수 4를 곱한 것과 같아요. [8 \\div \\dfrac{1}{4} = 8 \\times 4 = 32]', '자연수 ÷ 단위분수 풀이');
  var c2 = prob('A12.count', { form: 1, b: 7, c: 2, m: 3, a: 6, k: 0 });        /* 6/7 ÷ 2/7 = 3 */
  eq(Js(c2, ['3', '4', '12', '5']), 'correct:- wrong:subtracted wrong:multiplied wrong:-', '6/7 ÷ 2/7 의 답과 실수');
  var c3 = prob('A12.count', { form: 2, b: 3, a: 2, m: 3, k: 6, c: 0 });        /* 6 ÷ 2/3 = 9 */
  eq(Js(c3, ['9', '3', '18', '4', '5']), 'correct:- wrong:divided-only wrong:multiplied-only wrong:not-flipped wrong:-', '6 ÷ 2/3 의 답과 실수');
  eq(MH.judge(c3, '4').mistake.explain, '나누는 수를 그대로 곱했어요(6 × 3분의 2). 나눗셈은 나누는 수의 역수 2분의 3을 곱해요.', '역수로 바꾸지 않은 실수의 설명');
  eq(says(c3), '나누는 수 3분의 2의 역수는 2분의 3이에요. 나눗셈을 역수의 곱셈으로 바꿔요. [6 \\div \\dfrac{2}{3} = 6 \\times \\dfrac{3}{2}] | 6과 분모 2를 2로 약분하면 6 ÷ 2 = 3이에요. 남은 수를 곱해요: 3 × 3 = 9. [6 \\times \\dfrac{3}{2} = 3 \\times 3 = 9]', '자연수 ÷ 진분수 풀이');

  var f1 = prob('A12.frac', { b: 7, d: 4, a: 6, c: 3 });                        /* 6/7 ÷ 3/4 = 8/7 */
  eq(tex(f1), '1\\dfrac{1}{7}', '6/7 ÷ 3/4 = 1과 1/7');
  eq(Js(f1, [',8,7', '1,1,7', ',24,21', ',9,14', ',7,8', ',14,9', '1,5,9', ',1,2']), 'correct:- correct:- correct-note:- wrong:not-flipped wrong:flipped-dividend wrong:both-flipped wrong:both-flipped wrong:-', '6/7 ÷ 3/4 의 답과 실수');
  eq(MH.judge(f1, ',14,9').mistake.explain, '두 수를 모두 뒤집었어요. 나누어지는 수 7분의 6은 그대로 두고, 나누는 수만 역수 3분의 4로 바꿔요.', '둘 다 뒤집은 실수의 설명');
  eq(says(f1), '나누는 수 4분의 3의 역수는 3분의 4예요. 나눗셈을 역수의 곱셈으로 바꿔요. [\\dfrac{6}{7} \\div \\dfrac{3}{4} = \\dfrac{6}{7} \\times \\dfrac{4}{3}] | 곱하기 전에 약분해요. 분자 6과 분모 3을 3으로 나눠요: 6 ÷ 3 = 2, 3 ÷ 3 = 1. [\\dfrac{6}{7} \\times \\dfrac{4}{3} = \\dfrac{2}{7} \\times 4] | 남은 수로 분자는 분자끼리, 분모는 분모끼리 곱해요: 분자 2 × 4 = 8, 분모 7. [\\dfrac{2}{7} \\times 4 = \\dfrac{8}{7}] | 분자가 분모보다 커요. 8 ÷ 7 = 1 … 1이니까 대분수로 쓰면 1과 7분의 1이에요. [\\dfrac{8}{7} = 1\\dfrac{1}{7}]', '분수 ÷ 분수 풀이');
  var f2 = prob('A12.frac', { b: 5, d: 5, a: 3, c: 4 });                        /* 3/5 ÷ 4/5 = 3/4 */
  eq(Js(f2, [',3,4', ',15,20', ',12,25', '1,1,3']), 'correct:- correct-note:- wrong:not-flipped wrong:flipped-dividend', '3/5 ÷ 4/5 의 답과 실수');
  eq(says(f2), '분모가 5로 같아요. 5분의 3은 5분의 1이 3개, 5분의 4는 4개니까 3 ÷ 4와 같아요. [\\dfrac{3}{5} \\div \\dfrac{4}{5} = 3 \\div 4 = \\dfrac{3}{4}] | 나누는 수의 역수를 곱해서 계산해도 같은 답이 나와요. 분모 5는 서로 약분돼요. [\\dfrac{3}{5} \\times \\dfrac{5}{4} = \\dfrac{3}{4}]', '분모가 같을 때의 풀이');
  var f3 = prob('A12.frac', { whole: 1, b: 1, d: 5, a: 2, c: 3 });              /* 2 ÷ 3/5 = 10/3 */
  eq(MH.types['A12.frac'].prompt(f3.v).tex, '2 \\div \\dfrac{3}{5}', '자연수 ÷ 분수의 식');
  eq(Js(f3, ['3,1,3', ',10,3', ',6,5', '1,1,5', ',3,10', ',5,6']), 'correct:- correct:- wrong:not-flipped wrong:not-flipped wrong:flipped-dividend wrong:both-flipped', '2 ÷ 3/5 의 답과 실수');

  var m1 = prob('A12.mixed', { w1: 2, w2: 2, b: 5, d: 5, a: 3, c: 1 });         /* 2와 3/5 ÷ 2와 1/5 = 13/11 */
  eq(tex(m1), '1\\dfrac{2}{11}', '2와 3/5 ÷ 2와 1/5 = 1과 2/11');
  eq(Js(m1, ['1,2,11', ',13,11', ',65,55', '18,1,5', ',11,13', '5,18,25']), 'correct:- correct:- correct-note:- wrong:fraction-part-flipped wrong:flipped-dividend wrong:not-flipped', '대분수 나눗셈의 답과 실수');
  eq(MH.judge(m1, '18,1,5').mistake.explain, '나누는 수 2와 5분의 1에서 분수 부분만 뒤집었어요. 대분수는 먼저 가분수 5분의 11로 바꾼 다음 통째로 뒤집어요: 11분의 5.', '분수 부분만 뒤집은 실수의 설명');
  var m1s = says(m1).split(' | ');
  eq(m1s[0], '대분수를 가분수로 바꿔요. 2 × 5 + 3 = 13, 2 × 5 + 1 = 11. [2\\dfrac{3}{5} = \\dfrac{13}{5},\\quad 2\\dfrac{1}{5} = \\dfrac{11}{5}]', '대분수 둘을 가분수로');
  eq(m1s[m1s.length - 1], '분자가 분모보다 커요. 13 ÷ 11 = 1 … 2니까 대분수로 쓰면 1과 11분의 2예요. [\\dfrac{13}{11} = 1\\dfrac{2}{11}]', '받침에 맞는 조사(2니까)');
  var m2 = prob('A12.mixed', { w1: 0, w2: 1, b: 3, d: 2, a: 2, c: 1 });         /* 2/3 ÷ 1과 1/2 = 4/9 */
  eq(Js(m2, [',4,9', '1,,', ',9,4']), 'correct:- wrong:not-flipped wrong:flipped-dividend', '진분수 ÷ 대분수의 답과 실수');
  eq(says(m2), '대분수를 가분수로 바꿔요. 1 × 2 + 1 = 3. [1\\dfrac{1}{2} = \\dfrac{3}{2}] | 나누는 수 2분의 3의 역수는 3분의 2예요. 나눗셈을 역수의 곱셈으로 바꿔요. [\\dfrac{2}{3} \\div \\dfrac{3}{2} = \\dfrac{2}{3} \\times \\dfrac{2}{3}] | 분자는 분자끼리, 분모는 분모끼리 곱해요: 분자 2 × 2 = 4, 분모 3 × 3 = 9. [\\dfrac{2}{3} \\times \\dfrac{2}{3} = \\dfrac{4}{9}]', '진분수 ÷ 대분수 풀이');
  done('판정 · 실수 · 풀이 예');
})();
