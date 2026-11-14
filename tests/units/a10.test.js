/* A10 분수의 덧셈과 뺄셈 — 단원 전용 검사.
   화면에 보이는 식을 다시 읽어서, 엔진과 무관한 계산(BigInt 의 통분 없는 곱셈)으로 답을 확인한다. */
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
  var TERM = '(\\d*)\\\\dfrac\\{(\\d+)\\}\\{(\\d+)\\}';
  /** 식을 읽는다: { w1, a, b, op, w2, c, d } (모두 BigInt) 와 통분 없이 계산한 값 n / d */
  var readExpr = function (tex) {
    var m = new RegExp('^' + TERM + ' ([+-]) ' + TERM + '$').exec(tex);
    if (!m) return null;
    var e = { w1: B(m[1] || 0), a: B(m[2]), b: B(m[3]), op: m[4], w2: B(m[5] || 0), c: B(m[6]), d: B(m[7]) };
    var p = (e.w1 * e.b + e.a) * e.d, q = (e.w2 * e.d + e.c) * e.b;
    e.n = e.op === '+' ? p + q : p - q; e.den = e.b * e.d;
    return e;
  };
  var check = function (p, pr, where) {
    var e = readExpr(pr.tex);
    if (!ok(!!e, where + '문제 글 형식 ' + pr.tex)) return null;
    ok(B(p.answer.n) * e.den === e.n * B(p.answer.d) && e.n > 0n, where + pr.tex + ' → ' + p.answer.n + '/' + p.answer.d);
    ok(g(p.answer.n, p.answer.d) === 1n && p.answer.d > 1, where + '답은 자연수가 아닌 기약분수 ' + p.answer.n + '/' + p.answer.d);
    ok(e.a >= 1n && e.a < e.b && e.c >= 1n && e.c < e.d, where + '분수 부분은 진분수 ' + pr.tex);
    return e;
  };
  var unlike = function (e, level, where, tex) {
    ok(g(e.a, e.b) === 1n && g(e.c, e.d) === 1n, where + '기약분수끼리 ' + tex);
    if (level === 0) ok(e.b !== e.d && (e.b % e.d === 0n || e.d % e.b === 0n), where + '한 분모가 다른 분모의 배수 ' + tex);
    if (level === 1) ok(g(e.b, e.d) === 1n, where + '공통인 약수가 없는 분모 ' + tex);
    if (level === 2) ok(g(e.b, e.d) > 1n && e.b % e.d !== 0n && e.d % e.b !== 0n, where + '공약수가 있고 배수는 아닌 분모 ' + tex);
  };

  group('답 형식 fraction — 정답을 대분수 꼴로 보여 주기 (show: mixed)');
  var spec = { kind: 'fraction', whole: true, show: 'mixed' };
  eq(K.tex({ n: 7, d: 4 }, spec) + ' ' + K.tex({ n: 3, d: 4 }, spec) + ' ' + K.tex({ n: 7, d: 4 }, { whole: true }), '1\\dfrac{3}{4} \\dfrac{3}{4} \\dfrac{7}{4}', '1보다 크면 대분수 꼴');
  eq(K.redo(K.parse(',7,4'), ',7,4', spec) + ' ' + K.redo(K.parse('1,3,4'), '1,3,4', spec), 'null null', '가분수로 써도 대분수로 써도 다시 쓰게 하지 않음');
  done('표시');

  group('A10 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  each('A10.same', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    ok(e.b === e.d && e.w1 === 0n && e.w2 === 0n && e.op === (level === 1 ? '-' : '+'), where + '분모가 같은 진분수의 ' + (level === 1 ? '뺄셈' : '덧셈') + ' ' + pr.tex);
    if (level === 0) ok(e.a + e.c < e.b, where + '합이 1보다 작아야 함 ' + pr.tex);
    if (level === 2) ok(e.a + e.c > e.b, where + '합이 1보다 커야 함 ' + pr.tex);
  });
  done('분모가 같은 덧셈과 뺄셈');
  each('A10.add', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    ok(e.op === '+' && e.w1 === 0n && e.w2 === 0n, where + '진분수의 덧셈 ' + pr.tex); unlike(e, level, where, pr.tex);
  });
  done('분모가 다른 덧셈');
  each('A10.sub', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    ok(e.op === '-' && e.w1 === 0n && e.w2 === 0n && p.answer.n < p.answer.d, where + '진분수의 뺄셈 ' + pr.tex); unlike(e, level, where, pr.tex);
  });
  done('분모가 다른 뺄셈');
  var carried = 0;
  each('A10.mixed-add', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    ok(e.op === '+' && e.w1 >= 1n && e.w2 >= 1n, where + '대분수의 덧셈 ' + pr.tex);
    var over = e.a * e.d + e.c * e.b > e.b * e.d;
    if (level < 2) ok(e.b === e.d && over === (level === 1), where + '분모가 같고 받아올림 ' + (level === 1 ? '있음' : '없음') + ' ' + pr.tex);
    else { ok(e.b !== e.d && e.b * e.d / g(e.b, e.d) <= 30n, where + '분모가 다르고 공통분모가 30 이하 ' + pr.tex); if (over) carried++; }
  });
  ok(carried > 200 && carried < 800, '분모가 다른 대분수 덧셈: 받아올림이 있는 문제와 없는 문제가 섞여 나옴 (' + carried + ')');
  done('대분수의 덧셈');
  var borrowed = 0;
  each('A10.mixed-sub', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    ok(e.op === '-' && e.w1 >= 1n && e.w2 >= 1n && e.w1 >= e.w2, where + '대분수의 뺄셈 ' + pr.tex);
    var borrow = e.a * e.d < e.c * e.b;
    if (level < 2) ok(e.b === e.d && borrow === (level === 1), where + '분모가 같고 받아내림 ' + (level === 1 ? '있음' : '없음') + ' ' + pr.tex);
    else { ok(e.b !== e.d && e.b * e.d / g(e.b, e.d) <= 30n, where + '분모가 다르고 공통분모가 30 이하 ' + pr.tex); if (borrow) borrowed++; }
    if (level === 0) ok(e.w1 > e.w2, where + '자연수 부분이 남아야 함 ' + pr.tex);
  });
  ok(borrowed > 200 && borrowed < 800, '분모가 다른 대분수 뺄셈: 받아내림이 있는 문제와 없는 문제가 섞여 나옴 (' + borrowed + ')');
  done('대분수의 뺄셈');

  group('A10 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, op, w1, a, b, w2, c, d) { var v = { op: op, w1: w1, w2: w2, b: b, d: d, a: a, c: c }; return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v, null) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var tex = function (p) { return K.tex(p.answer, MH.types[p.type].answer); };

  var s1 = prob('A10.same', '+', 0, 1, 4, 0, 1, 4);                    /* 1/4 + 1/4 */
  eq(tex(s1), '\\dfrac{1}{2}', '1/4 + 1/4 = 1/2');
  eq(J(s1, ',1,2') + ' ' + J(s1, ',2,4') + ' ' + J(s1, ',2,8'), 'correct:- correct-note:- wrong:denominators-too', '1/4 + 1/4 → 1/2, 2/4, 2/8');
  eq(MH.judge(s1, ',2,4').note, '약분하면 $\\frac{1}{2}$이에요.', '약분이 덜 된 답은 정답으로 하고 알려 줌');
  var s2 = prob('A10.same', '+', 0, 3, 5, 0, 4, 5);                    /* 3/5 + 4/5 */
  eq(tex(s2), '1\\dfrac{2}{5}', '3/5 + 4/5 = 1과 2/5 (정답은 대분수 꼴로 보여 줌)');
  eq(J(s2, ',7,5') + ' ' + J(s2, '1,2,5') + ' ' + J(s2, ',2,5') + ' ' + J(s2, ',7,10') + ' ' + J(s2, ',1,5'), 'correct:- correct:- wrong:dropped-whole wrong:denominators-too wrong:wrong-operation', '3/5 + 4/5 의 답과 실수');
  eq(MH.judge(s2, '0,7,5').verdict + ' ' + MH.judge(s2, '0,7,5').note, 'invalid 값은 맞아요. 그런데 분수 부분이 아직 가분수예요. 자연수를 더 덜어 내 보세요.', '0과 7/5 는 다시 쓰게 함');
  eq(says(s2), '분모가 5로 같아요. 조각의 크기가 같으니 분자끼리만 계산하면 돼요. | 분모는 그대로 두고 분자끼리 더해요: 3 + 4 = 7. [\\dfrac{3}{5} + \\dfrac{4}{5} = \\dfrac{7}{5}] | 분자가 분모보다 커요. 5분의 5가 1이니까 대분수로 바꿔요: 분자는 7 − 5 = 2. [\\dfrac{7}{5} = 1\\dfrac{2}{5}]', '합이 1보다 큰 덧셈 풀이');
  var s3 = prob('A10.same', '-', 0, 5, 8, 0, 3, 8);                    /* 5/8 − 3/8 */
  eq(J(s3, ',1,4') + ' ' + J(s3, ',2,8') + ' ' + J(s3, ',8,8') + ' ' + J(s3, ',2,16'), 'correct:- correct-note:- wrong:wrong-operation wrong:denominators-too', '5/8 − 3/8 의 답과 실수');

  var a1 = prob('A10.add', '+', 0, 3, 4, 0, 5, 6);                     /* 3/4 + 5/6 = 19/12 */
  eq(tex(a1), '1\\dfrac{7}{12}', '3/4 + 5/6 = 1과 7/12');
  eq(J(a1, ',19,12') + ' ' + J(a1, '1,7,12') + ' ' + J(a1, ',38,24'), 'correct:- correct:- correct-note:-', '가분수 · 대분수 · 약분 안 된 답');
  eq(J(a1, ',8,10') + ' ' + J(a1, ',8,12') + ' ' + J(a1, ',14,12') + ' ' + J(a1, ',7,12') + ' ' + J(a1, ',5,12'), 'wrong:denominators-too wrong:numerators-kept wrong:half-converted wrong:dropped-whole wrong:-', '3/4 + 5/6 의 실수');
  eq(MH.judge(a1, ',4,5').mistake.id, 'denominators-too', '8/10 을 약분해 4/5 로 써도 같은 실수로 봄');
  eq(MH.judge(a1, ',8,12').mistake.explain, '분모만 12로 바꾸고 분자는 그대로 뒀어요. 통분할 때는 분자에도 같은 수를 곱해야 크기가 변하지 않아요: 4분의 3은 12분의 9, 6분의 5는 12분의 10.', '분자를 그대로 둔 실수의 설명');
  eq(says(a1), '분모가 달라요. 4와 6의 최소공배수 12를 공통분모로 해서 통분해요. [\\dfrac{3}{4} = \\dfrac{9}{12},\\quad \\dfrac{5}{6} = \\dfrac{10}{12}] | 분모는 그대로 두고 분자끼리 더해요: 9 + 10 = 19. [\\dfrac{9}{12} + \\dfrac{10}{12} = \\dfrac{19}{12}] | 분자가 분모보다 커요. 12분의 12가 1이니까 대분수로 바꿔요: 분자는 19 − 12 = 7. [\\dfrac{19}{12} = 1\\dfrac{7}{12}]', '분모가 다른 덧셈 풀이');
  var a2 = prob('A10.add', '+', 0, 1, 2, 0, 3, 8);                     /* 1/2 + 3/8 */
  eq(says(a2).split(' | ')[0], '분모가 달라요. 8은 2의 배수니까 8을 공통분모로 해서 통분해요. [\\dfrac{1}{2} = \\dfrac{4}{8}]', '한 분모가 배수일 때의 풀이');
  eq(MH.types['A10.add'].hints(a2.v)[1], '8은 2의 배수니까 8을 공통분모로 하면 돼요. 분모에 곱한 수를 분자에도 곱해요.', '한 분모가 배수일 때의 힌트');

  var b1 = prob('A10.sub', '-', 0, 5, 6, 0, 3, 4);                     /* 5/6 − 3/4 = 1/12 */
  eq(J(b1, '1,12') + ' ' + J(b1, '2,2') + ' ' + J(b1, '2,12') + ' ' + J(b1, '7,12') + ' ' + J(b1, '19,12'), 'correct:- wrong:denominators-too wrong:numerators-kept wrong:half-converted wrong:wrong-operation', '5/6 − 3/4 의 답과 실수');
  eq(K.fieldsOf(MH.types['A10.sub'].answer).length + ' ' + K.fieldsOf(MH.types['A10.add'].answer).length, '2 3', '뺄셈(답이 1보다 작음)은 두 칸, 덧셈은 자연수 칸까지 세 칸');
  var b2 = prob('A10.sub', '-', 0, 9, 10, 0, 2, 5);                    /* 9/10 − 2/5 = 1/2 */
  eq(says(b2), '분모가 달라요. 10은 5의 배수니까 10을 공통분모로 해서 통분해요. [\\dfrac{2}{5} = \\dfrac{4}{10}] | 분모는 그대로 두고 분자끼리 빼요: 9 − 4 = 5. [\\dfrac{9}{10} - \\dfrac{4}{10} = \\dfrac{5}{10}] | 분자 5와 분모 10을 5로 나눠 약분해요. [\\dfrac{5}{10} = \\dfrac{1}{2}]', '약분으로 끝나는 뺄셈 풀이');

  var m1 = prob('A10.mixed-add', '+', 2, 3, 4, 1, 2, 4);               /* 2와 3/4 + 1과 2/4 = 4와 1/4 */
  eq(tex(m1), '4\\dfrac{1}{4}', '2와 3/4 + 1과 2/4 = 4와 1/4');
  eq(J(m1, '4,1,4') + ' ' + J(m1, ',17,4') + ' ' + J(m1, '3,5,4') + ' ' + J(m1, '3,1,4') + ' ' + J(m1, ',5,4') + ' ' + J(m1, '3,5,8'), 'correct:- correct:- invalid:- wrong:no-carry wrong:fractions-only wrong:denominators-too', '대분수 덧셈의 답과 실수');
  eq(MH.judge(m1, '3,1,4').mistake.explain, '분수 부분에서 1을 올렸는데 자연수에 더하지 않았어요. 자연수는 2 + 1 = 3에 올린 1을 더해 4예요.', '올린 1 을 더하지 않은 실수의 설명');
  eq(says(m1), '분모가 4로 같아요. 자연수는 자연수끼리, 분수는 분수끼리 계산해요. | 자연수끼리 더하면 2 + 1 = 3, 분자끼리 더하면 3 + 2 = 5예요. 분모는 그대로 4예요. [2\\dfrac{3}{4} + 1\\dfrac{2}{4} = 3\\dfrac{5}{4}] | 분수 부분 4분의 5가 1보다 커요. 4분의 4를 1로 바꿔 자연수에 올려요: 자연수는 3 + 1 = 4, 분자는 5 − 4 = 1. [3\\dfrac{5}{4} = 4\\dfrac{1}{4}]', '받아올림이 있는 대분수 덧셈 풀이');
  var m2 = prob('A10.mixed-add', '+', 1, 1, 2, 2, 1, 3);               /* 1과 1/2 + 2와 1/3 = 3과 5/6 */
  eq(J(m2, '3,5,6') + ' ' + J(m2, '3,2,6') + ' ' + J(m2, '3,2,5'), 'correct:- wrong:numerators-kept wrong:denominators-too', '분모가 다른 대분수 덧셈의 실수');

  var d1 = prob('A10.mixed-sub', '-', 4, 1, 8, 2, 3, 8);               /* 4와 1/8 − 2와 3/8 = 1과 3/4 */
  eq(tex(d1), '1\\dfrac{3}{4}', '4와 1/8 − 2와 3/8 = 1과 3/4');
  eq(J(d1, '1,3,4') + ' ' + J(d1, '1,6,8') + ' ' + J(d1, '2,2,8') + ' ' + J(d1, '2,6,8') + ' ' + J(d1, '6,4,8'), 'correct:- correct-note:- wrong:flipped wrong:no-decrement wrong:wrong-operation', '대분수 뺄셈의 답과 실수');
  eq(MH.judge(d1, '1,6,8').note, '약분하면 $1\\frac{3}{4}$이에요.', '대분수의 약분 안내');
  eq(says(d1), '분모가 8로 같아요. 자연수는 자연수끼리, 분수는 분수끼리 계산해요. | 8분의 1에서 8분의 3을 뺄 수 없어요. 자연수 4에서 1을 빌려 와요. 1은 8분의 8이니까 분자는 1 + 8 = 9, 자연수는 3이 돼요. [4\\dfrac{1}{8} = 3\\dfrac{9}{8}] | 자연수끼리 빼면 3 − 2 = 1, 분자끼리 빼면 9 − 3 = 6이에요. 분모는 그대로 8이에요. [3\\dfrac{9}{8} - 2\\dfrac{3}{8} = 1\\dfrac{6}{8}] | 분자 6과 분모 8을 2로 나눠 약분해요. [1\\dfrac{6}{8} = 1\\dfrac{3}{4}]', '받아내림이 있는 대분수 뺄셈 풀이');
  var d2 = prob('A10.mixed-sub', '-', 3, 3, 4, 1, 1, 6);               /* 3과 3/4 − 1과 1/6 = 2와 7/12 */
  eq(J(d2, '2,7,12') + ' ' + J(d2, ',31,12') + ' ' + J(d2, '2,2,12') + ' ' + J(d2, ',7,12'), 'correct:- correct:- wrong:numerators-kept wrong:fractions-only', '분모가 다른 대분수 뺄셈의 답과 실수');
  eq(says(d2).split(' | ')[0], '분모가 달라요. 4와 6의 최소공배수 12를 공통분모로 해서 통분해요. [3\\dfrac{3}{4} = 3\\dfrac{9}{12},\\quad 1\\dfrac{1}{6} = 1\\dfrac{2}{12}]', '대분수의 통분');
  done('판정 · 실수 · 풀이 예');
})();
