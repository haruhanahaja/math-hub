/* A14 소수의 곱셈과 나눗셈 — 단원 전용 검사.
   화면에 보이는 식을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000, K = MH.kinds.decimal;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var B = function (x) { return BigInt(x); };
  var SCALE = 6, TEN = function (k) { var x = 1n; for (var i = 0; i < k; i++) x *= 10n; return x; }, ONE = TEN(SCALE);
  /** 소수 글자를 10^6 배 한 정수로 읽는다: '3.25' → 3250000n */
  var readDec = function (s) {
    var m = /^(\d+)(?:\.(\d+))?$/.exec(s);
    if (!m) return null;
    var f = m[2] || '';
    return { v: B(m[1] + f) * TEN(SCALE - f.length), places: f.length, digits: m[1] + f, text: s, clean: !f || f.charAt(f.length - 1) !== '0' };
  };
  var ans = function (a) { return B(a.n) * TEN(SCALE - a.p); };
  /** 'X op Y' 꼴의 식을 읽는다 */
  var readExpr = function (tex) {
    var m = /^(\S+) \\(times|div) (\S+)$/.exec(tex || ''), x = m && readDec(m[1]), y = m && readDec(m[3]);
    return x && y ? { x: x, y: y, op: m[2] } : null;
  };
  /** 답이 식의 값과 같고, 키패드로 칠 수 있는가(소수점 아래 네 자리까지) */
  var check = function (p, pr, where) {
    var e = readExpr(pr.tex);
    if (!ok(!!e && !pr.text, where + '문제 글 형식 ' + pr.tex)) return null;
    ok(e.op === 'times' ? ans(p.answer) * ONE === e.x.v * e.y.v : ans(p.answer) * e.y.v === e.x.v * ONE, where + pr.tex + ' → ' + K.tex(p.answer));
    ok(p.answer.p <= 4 && (p.answer.p === 0 || p.answer.n % 10 !== 0), where + '답은 소수점 아래 네 자리 안, 끝의 0 없이 ' + K.tex(p.answer));
    ok(e.x.clean && e.y.clean, where + '끝에 0 이 붙은 소수는 내지 않음 ' + pr.tex);
    return e;
  };

  group('A14 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var shiftForms = {};
  each('A14.shift', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    var big = /^10+$/.test(e.y.text), small = /^0\.0*1$/.test(e.y.text), k = big ? e.y.text.length - 1 : e.y.places;
    if (!ok(big || (small && e.op === 'times'), where + '10, 100, 1000 또는 0.1, 0.01, 0.001 ' + pr.tex)) return;
    if (level === 0) ok(e.op === 'times' && big && k <= e.x.places, where + '10의 거듭제곱을 곱하고, 0 을 채울 필요가 없음 ' + pr.tex);
    if (level === 1) ok(e.op === 'div' && big && ans(p.answer) * 10n >= ONE, where + '10의 거듭제곱으로 나누고, 답이 0.1 이상 ' + pr.tex);
    if (level === 2) ok(e.op === 'times' && big ? k > e.x.places : small || ans(p.answer) * 10n < ONE, where + '0 을 채워야 하거나 0.1, 0.01을 곱하는 문제 ' + pr.tex);
    shiftForms[level + (small ? '×소수' : e.op === 'times' ? '×' : '÷')] = 1;
  });
  eq(Object.keys(shiftForms).sort().join(' '), '0× 1÷ 2× 2×소수 2÷', '단계에 맞는 계산이 고루 나옴');
  done('소수점 옮기기');
  var orders = {};
  each('A14.by-whole', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    var first = e.x.places === 0, d = first ? e.y : e.x, k = first ? e.x : e.y;
    if (!ok(e.op === 'times' && d.places > 0 && k.places === 0 && k.v >= 2n * ONE, where + '소수 하나와 자연수 하나 ' + pr.tex)) return;
    if (level === 0) ok(!first && d.places === 1 && k.v <= 9n * ONE, where + '소수 한 자리 수 × 한 자리 수 ' + pr.tex);
    if (level === 1) ok(!first && (d.places === 2 || k.v >= 11n * ONE), where + '소수 두 자리 수이거나 두 자리 수를 곱함 ' + pr.tex);
    if (level === 2) ok(k.v >= 11n * ONE, where + '두 자리 수를 곱함 ' + pr.tex);
    orders[level + (first ? '자연수 먼저' : '소수 먼저')] = 1;
  });
  eq(Object.keys(orders).sort().join(' | '), '0소수 먼저 | 1소수 먼저 | 2소수 먼저 | 2자연수 먼저', '마지막 단계에서 곱하는 순서가 섞여 나옴');
  done('소수 × 자연수');
  each('A14.mul', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    if (!ok(e.op === 'times' && e.x.places > 0 && e.y.places > 0, where + '소수 둘 ' + pr.tex)) return;
    if (level === 0) ok(e.x.places === 1 && e.y.places === 1 && e.x.v < ONE && e.y.v < ONE, where + '1보다 작은 소수 한 자리 수끼리 ' + pr.tex);
    if (level === 1) ok(e.x.places === 1 && e.y.places === 1 && (e.x.v > ONE || e.y.v > ONE), where + '소수 한 자리 수끼리 ' + pr.tex);
    if (level === 2) ok(e.x.places + e.y.places === 3, where + '소수 한 자리 수와 두 자리 수 ' + pr.tex);
  });
  done('소수 × 소수');
  var hard = {};
  each('A14.div-whole', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    var k = Number(e.y.text), text = K.tex(p.answer), zero = /\.0/.test(text);
    if (!ok(e.op === 'div' && e.y.places === 0 && k >= 2 && k !== 10, where + '자연수로 나눔 ' + pr.tex)) return;
    var each1 = e.x.digits.split('').every(function (c) { return Number(c) % k === 0; });
    if (level === 0) ok(each1 && e.x.places === p.answer.p && !zero, where + '자리마다 나누어떨어짐 ' + pr.tex);
    if (level === 1) ok(!each1 && e.x.places === p.answer.p && !zero, where + '내림이 있고 0 을 내릴 필요가 없음 ' + pr.tex);
    if (level === 2) { ok(e.x.places < p.answer.p || zero, where + '0 을 내려 계산하거나 몫에 0 이 있음 ' + pr.tex + ' = ' + text); hard[(e.x.places < p.answer.p ? '0 내리기' : '몫에 0') + (e.x.places === 0 ? ' · 자연수' : '')] = 1; }
  });
  eq(Object.keys(hard).sort().join(' | '), '0 내리기 | 0 내리기 · 자연수 | 몫에 0', '마지막 단계의 세 가지 꼴(자연수 ÷ 자연수 포함)이 모두 나옴');
  done('소수 ÷ 자연수');
  each('A14.div', function (p, pr, level, where) {
    var e = check(p, pr, where); if (!e) return;
    if (!ok(e.op === 'div' && e.y.places > 0, where + '소수로 나눔 ' + pr.tex)) return;
    if (level === 0) ok(e.x.places === e.y.places && p.answer.p === 0, where + '자릿수가 같고 몫이 자연수 ' + pr.tex);
    if (level === 1) ok(e.y.places === 1 && e.x.places === 2 && p.answer.p === 1, where + '소수 두 자리 수 ÷ 소수 한 자리 수, 몫은 소수 ' + pr.tex);
    if (level === 2) ok(e.x.places < e.y.places, where + '나누어지는 수의 자릿수가 더 적음(0 을 채워야 함) ' + pr.tex);
  });
  done('소수로 나누기');

  group('A14 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v, null) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var Js = function (p, raws) { return raws.map(function (r) { return J(p, r); }).join(' '); };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var tex = function (p) { return MH.types[p.type].prompt(p.v).tex; };

  var h1 = prob('A14.shift', { op: 'm', px: 2, k: 1, n: 123 });                 /* 1.23 × 10 = 12.3 */
  eq(tex(h1) + ' = ' + K.tex(h1.answer), '1.23 \\times 10 = 12.3', '10 을 곱하는 식');
  eq(Js(h1, ['12.3', '12.30', '0.123', '1.23', '1.230', '123', '12.4']), 'correct:- correct-note:- wrong:wrong-direction wrong:unchanged wrong:unchanged wrong:one-more wrong:place-diff', '1.23 × 10 의 답과 실수');
  eq(MH.judge(h1, '1.230').mistake.explain, '수의 크기가 그대로예요. 소수는 끝에 0을 붙여도 크기가 변하지 않아요. 소수점을 오른쪽으로 한 칸 옮겨야 해요.', '0 만 붙인 실수의 설명');
  var h2 = prob('A14.shift', { op: 'd', px: 1, k: 2, n: 626 });                 /* 62.6 ÷ 100 = 0.626 */
  eq(Js(h2, ['0.626', '6260', '62.6', '6.26', '0.0626']), 'correct:- wrong:wrong-direction wrong:unchanged wrong:one-short wrong:one-more', '62.6 ÷ 100 의 답과 실수');
  eq(says(h2), '100으로 나누면 수가 작아져요. 소수점을 왼쪽으로 두 칸 옮겨요. | 소수점 앞에 숫자가 없으면 일의 자리에 0을 써요. | 답은 0.626이에요. [62.6 \\div 100 = 0.626]', '100 으로 나누는 풀이');
  var h3 = prob('A14.shift', { op: 'c', px: 2, k: 1, n: 7 });                   /* 0.07 × 0.1 = 0.007 */
  eq(tex(h3) + ' ' + Js(h3, ['0.007', '0.7', '0.07', '0.0007']), '0.07 \\times 0.1 correct:- wrong:wrong-direction wrong:unchanged wrong:one-more', '0.07 × 0.1 의 답과 실수');
  eq(MH.judge(h3, '0.7').mistake.explain, '소수점을 반대쪽으로 옮겼어요. 0.1은 1보다 작은 수라서 곱하면 수가 작아져요. 왼쪽으로 옮겨요.', '0.1 을 곱했는데 커진 실수의 설명');
  var h4 = prob('A14.shift', { op: 'm', px: 2, k: 3, n: 84 });                  /* 0.84 × 1000 = 840 */
  eq(K.tex(h4.answer) + ' ' + Js(h4, ['840', '84', '8400', '0.84']), '840 correct:- wrong:one-short wrong:one-more wrong:unchanged', '0.84 × 1000 의 답과 실수');
  eq(says(h4).split(' | ')[1], '소수점 아래 숫자가 두 개뿐이라 옮길 자리가 모자라요. 모자란 자리에 0을 채워요.', '0 을 채우는 풀이');

  var w1 = prob('A14.by-whole', { first: 0, px: 1, n: 28, k: 4 });              /* 2.8 × 4 = 11.2 */
  eq(Js(w1, ['11.2', '11.20', '112', '8.8', '5.2', '6.8', '1.12']), 'correct:- correct-note:- wrong:no-point wrong:whole-only wrong:fraction-only wrong:added wrong:point-shift', '2.8 × 4 의 답과 실수');
  eq(says(w1), '소수점이 없다고 생각하고 자연수처럼 곱해요. [28 \\times 4 = 112] | 2.8은 28의 10분의 1이에요(소수 한 자리 수). 곱도 112의 10분의 1이니까, 소수점 아래가 한 자리가 되도록 소수점을 찍어요. [2.8 \\times 4 = 11.2]', '소수 × 자연수 풀이');
  var w2 = prob('A14.by-whole', { first: 0, px: 1, n: 3, k: 4 });               /* 0.3 × 4 = 1.2 */
  eq(Js(w2, ['1.2', '0.12', '12', '4.3']), 'correct:- wrong:product-after-point wrong:no-point wrong:added', '0.3 × 4 의 답과 실수');
  eq(MH.judge(w2, '0.12').mistake.explain, '3 × 4 = 12를 소수점 뒤에 그대로 썼어요. 0.1이 12개면 1.2예요. 소수점 아래는 한 자리예요.', '곱을 소수점 뒤에 그대로 쓴 실수의 설명');
  var w3 = prob('A14.by-whole', { first: 1, px: 1, n: 22, k: 15 });             /* 15 × 2.2 = 33 */
  eq(tex(w3) + ' = ' + K.tex(w3.answer) + ' ' + Js(w3, ['33', '33.0', '330']), '15 \\times 2.2 = 33 correct:- correct-note:- wrong:no-point', '자연수를 앞에 쓴 식, 답이 자연수');
  eq(says(w3).split(' | ').slice(-1)[0], '소수점 아래 끝의 0은 생략해요. [33.0 = 33]', '끝의 0 을 생략하는 풀이');

  var m1 = prob('A14.mul', { shape: [1, 1], pa: 1, pb: 1, a: 7, b: 5 });        /* 0.7 × 0.5 = 0.35 */
  eq(Js(m1, ['0.35', '3.5', '35', '1.2', '0.36']), 'correct:- wrong:places-not-added wrong:no-point wrong:added wrong:place-diff', '0.7 × 0.5 의 답과 실수');
  eq(MH.judge(m1, '3.5').mistake.explain, '덧셈처럼 소수점 자리를 그대로 내려 찍었어요. 곱셈에서는 두 수의 소수점 아래 자릿수를 더해요: 한 자리 + 한 자리 = 두 자리. 답은 0.35예요.', '자릿수를 더하지 않은 실수의 설명');
  eq(says(m1), '소수점이 없다고 생각하고 자연수처럼 곱해요. [7 \\times 5 = 35] | 소수점 아래 자릿수를 더해요. 0.7은 한 자리, 0.5는 한 자리니까 곱은 소수점 아래 두 자리예요. | 35의 오른쪽 끝에서 두 자리 앞에 소수점을 찍어요. 소수점 앞 일의 자리에는 0을 써요. [0.7 \\times 0.5 = 0.35]', '소수 × 소수 풀이');
  var m2 = prob('A14.mul', { shape: [1, 1], pa: 1, pb: 1, a: 15, b: 17 });      /* 1.5 × 1.7 = 2.55 */
  eq(Js(m2, ['2.55', '25.5', '1.35', '3.2', '255']), 'correct:- wrong:places-not-added wrong:parts-separately wrong:added wrong:no-point', '1.5 × 1.7 의 답과 실수');
  var m3 = prob('A14.mul', { shape: [1, 2], pa: 1, pb: 2, a: 2, b: 3 });        /* 0.2 × 0.03 = 0.006 */
  eq(K.tex(m3.answer) + ' | ' + says(m3).split(' | ')[2], '0.006 | 6의 오른쪽 끝에서 세 자리 앞에 소수점을 찍어요. 숫자가 모자라니까 앞에 0을 채워요. [0.2 \\times 0.03 = 0.006]', '앞에 0 을 채우는 풀이');
  var m4 = prob('A14.mul', { shape: [1, 1], pa: 1, pb: 1, a: 25, b: 14 });      /* 2.5 × 1.4 = 3.5 */
  eq(K.tex(m4.answer) + ' ' + Js(m4, ['3.5', '3.50', '35']), '3.5 correct:- correct-note:- wrong:places-not-added', '끝의 0 이 생기는 곱');

  var d1 = prob('A14.div-whole', { pq: 2, k: 3, q: 306 });                      /* 9.18 ÷ 3 = 3.06 */
  eq(tex(d1) + ' ' + Js(d1, ['3.06', '3.6', '306', '0.306', '27.54', '30.6']), '9.18 \\div 3 correct:- wrong:zero-skipped wrong:no-point wrong:point-early wrong:multiplied wrong:point-shift', '9.18 ÷ 3 의 답과 실수');
  eq(MH.judge(d1, '0.306').mistake.explain, '소수점을 한 자리 앞에 찍었어요. 검산해 보면 0.306 × 3 = 0.918이라 맞지 않아요. 답은 3.06이에요.', '소수점을 앞에 찍은 실수의 설명');
  var d2 = prob('A14.div-whole', { pq: 3, k: 2, q: 345 });                      /* 0.69 ÷ 2 = 0.345 */
  eq(says(d2), '0.69는 0.690과 같아요. 끝에 0을 붙여 나누어떨어질 때까지 계산해요. [0.69 = 0.690] | 소수점이 없다고 생각하고 자연수처럼 나눠요. [690 \\div 2 = 345] | 0.690은 690의 1000분의 1이니까 몫도 345의 1000분의 1이에요. 나누어지는 수와 같은 자리에 소수점을 찍어요. 몫의 일의 자리에는 0을 써요. [0.69 \\div 2 = 0.345] | 검산: 몫에 나누는 수를 곱하면 나누어지는 수가 나와요. [0.345 \\times 2 = 0.69]', '0 을 내려 계산하는 풀이');
  var d3 = prob('A14.div-whole', { pq: 2, k: 4, q: 75 });                       /* 3 ÷ 4 = 0.75 */
  eq(tex(d3) + ' ' + Js(d3, ['0.75', '75', '12']), '3 \\div 4 correct:- wrong:no-point wrong:multiplied', '자연수 ÷ 자연수');

  var v1 = prob('A14.div', { pd: 1, pq: 1, d: 3, q: 87 });                      /* 2.61 ÷ 0.3 = 8.7 */
  eq(tex(v1) + ' ' + Js(v1, ['8.7', '0.87', '87', '0.783', '8.8']), '2.61 \\div 0.3 correct:- wrong:divisor-only wrong:points-ignored wrong:multiplied wrong:place-diff', '2.61 ÷ 0.3 의 답과 실수');
  eq(says(v1), '나누는 수가 자연수가 되도록 두 수의 소수점을 똑같이 오른쪽으로 한 칸 옮겨요. 두 수에 똑같이 10을 곱해도 몫은 변하지 않아요. [2.61 \\div 0.3 = 26.1 \\div 3] | 자연수로 나누는 나눗셈이 됐어요. 자연수처럼 나눈 다음(261 ÷ 3 = 87), 나누어지는 수 26.1의 소수점 자리에 맞춰 몫에 소수점을 찍어요. [26.1 \\div 3 = 8.7] | 검산: 몫에 나누는 수를 곱하면 나누어지는 수가 나와요. [8.7 \\times 0.3 = 2.61]', '소수로 나누는 풀이');
  var v2 = prob('A14.div', { pd: 2, pq: 0, d: 25, q: 24 });                     /* 6 ÷ 0.25 = 24 */
  eq(tex(v2) + ' ' + Js(v2, ['24', '0.24', '2400', '1.5']), '6 \\div 0.25 correct:- wrong:divisor-only wrong:dividend-only wrong:multiplied', '6 ÷ 0.25 의 답과 실수');
  eq(MH.judge(v2, '0.24').mistake.explain, '나누는 수 0.25의 소수점만 옮기고, 나누어지는 수는 그대로 뒀어요. 두 수의 소수점을 똑같이 두 칸 옮겨야 몫이 변하지 않아요: 600 ÷ 25.', '나누는 수만 옮긴 실수의 설명');
  eq(says(v2).split(' | ')[0], '나누는 수가 자연수가 되도록 두 수의 소수점을 똑같이 오른쪽으로 두 칸 옮겨요. 두 수에 똑같이 100을 곱해도 몫은 변하지 않아요. 6은 옮길 자리가 모자라니까 0을 채워요. [6 \\div 0.25 = 600 \\div 25]', '자연수 ÷ 소수 풀이');
  done('판정 · 실수 · 풀이 예');
})();
