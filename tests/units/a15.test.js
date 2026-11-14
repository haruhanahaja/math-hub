/* A15 분수 ↔ 소수 — 단원 전용 검사.
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
  var g = function (a, b) { while (b) { var t = a % b; a = b; b = t; } return a; };
  /** 분수 글자를 { n, d } 로 읽는다: '2\dfrac{1}{5}' → 11/5, '\dfrac{3}{4}' → 3/4 */
  var readFrac = function (s) {
    var m = /^(\d*)\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(s);
    if (!m) return null;
    var w = m[1] ? B(m[1]) : 0n, n = B(m[2]), d = B(m[3]);
    return { n: w * d + n, d: d, w: w, top: n, mixed: !!m[1], lowest: g(n, d) === 1n, proper: n < d };
  };
  /** 소수 글자를 { n, d } 로 읽는다: '3.25' → 325/100 */
  var readDec = function (s) {
    var m = /^(\d+)(?:\.(\d+))?$/.exec(s);
    if (!m) return null;
    var f = m[2] || '', d = 1n;
    for (var i = 0; i < f.length; i++) d *= 10n;
    return { n: B(m[1] + f), d: d, places: f.length, clean: !f || f.charAt(f.length - 1) !== '0' };
  };
  var finite = function (d) { while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n; return d === 1n; };
  var same = function (x, y) { return x.n * y.d === y.n * x.d; };

  group('A15 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  each('A15.to-ten', function (p, pr, level, where) {
    var m = /^(\\dfrac\{\d+\}\{\d+\}) = \\dfrac\{\\square\}\{(10|100|1000)\}$/.exec(pr.tex || ''), f = m && readFrac(m[1]);
    if (!ok(!!f && pr.text === '□에 알맞은 수를 쓰세요.', where + '문제 글 형식 ' + pr.tex)) return;
    var t = B(m[2]);
    ok(B(p.answer) * f.d === f.n * t, where + pr.tex + ' → ' + p.answer);
    ok(f.lowest && t % f.d === 0n && f.d < t, where + '기약분수이고 분모가 ' + t + '의 약수 ' + pr.tex);
    ok([10n, 100n, 1000n].filter(function (x) { return x % f.d === 0n; })[0] === t, where + '만들 수 있는 가장 작은 10의 거듭제곱 ' + pr.tex);
    if (level === 0) ok(t / f.d === 2n || t / f.d === 5n, where + '2나 5를 곱함 ' + pr.tex);
    if (level === 1) ok(t === 100n && (f.d === 4n || f.d === 25n), where + '분모 4, 25 ' + pr.tex);
    if (level === 2) ok(t === 1000n, where + '분모를 1000으로 ' + pr.tex);
  });
  done('분모를 10, 100, 1000으로');
  var shapes = {};
  each('A15.to-decimal', function (p, pr, level, where) {
    var f = readFrac(pr.tex || '');
    if (!ok(!!f && pr.text === '분수를 소수로 쓰세요.', where + '문제 글 형식 ' + pr.tex)) return;
    ok(same(f, { n: B(p.answer.n), d: B(MH.pow10(p.answer.p)) }), where + pr.tex + ' → ' + K.tex(p.answer));
    ok(p.answer.p >= 1 && p.answer.p <= 3 && p.answer.n % 10 !== 0, where + '답은 소수점 아래 세 자리 안, 끝의 0 없이 ' + K.tex(p.answer));
    ok(finite(f.d) && f.lowest, where + '유한소수가 되는 기약분수 ' + pr.tex);
    ok(f.mixed ? f.proper : true, where + '대분수의 분수 부분은 진분수 ' + pr.tex);
    if (level === 0) ok((f.d === 2n || f.d === 5n) && f.proper, where + '분모 2, 5 ' + pr.tex);
    if (level === 1) ok([4n, 20n, 25n, 50n].indexOf(f.d) >= 0 && f.proper && p.answer.p === 2, where + '분모 4, 20, 25, 50 ' + pr.tex);
    if (level === 2) { ok(f.proper ? p.answer.p === 3 : f.d <= 8n, where + '세 자리 소수이거나 가분수 ' + pr.tex); shapes[f.proper ? (f.mixed ? '대분수' : '진분수') : '가분수'] = 1; }
  });
  eq(Object.keys(shapes).sort().join(' '), '가분수 대분수 진분수', '마지막 단계에 가분수 · 대분수 · 진분수가 모두 나옴');
  done('분수를 소수로');
  var reduced = [0, 0, 0];
  each('A15.to-fraction', function (p, pr, level, where) {
    var d = readDec(pr.tex || '');
    if (!ok(!!d && pr.text === '소수를 기약분수로 쓰세요.', where + '문제 글 형식 ' + pr.tex)) return;
    ok(same(d, { n: B(p.answer.n), d: B(p.answer.d) }), where + pr.tex + ' → ' + p.answer.n + '/' + p.answer.d);
    ok(g(B(p.answer.n), B(p.answer.d)) === 1n, where + '답은 기약분수 ' + p.answer.n + '/' + p.answer.d);
    ok(d.clean && d.places === level + 1 && d.n % d.d !== 0n, where + '소수 ' + (level + 1) + '자리 수, 끝의 0 없음 ' + pr.tex);
    if (B(p.answer.d) < d.d) reduced[level]++;
    /* 약분하지 않은 답은 다시 쓰게 한다 */
    if (B(p.answer.d) < d.d) ok(MH.judge(p, ',' + d.n + ',' + d.d).verdict === 'invalid', where + '약분하지 않은 답은 다시 ' + pr.tex);
  });
  ok(reduced[0] > 300 && reduced[1] > 300 && reduced[2] === 3 * N / 3, '약분이 필요한 문제가 충분히 나옴(세 자리 수는 모두) ' + reduced.join(' '));
  done('소수를 기약분수로');
  var signs = {};
  each('A15.compare', function (p, pr, level, where) {
    var m = /^(\S+) \\;\\bigcirc\\; (\S+)$/.exec(pr.tex || '');
    var lf = m && readFrac(m[1]), rf = m && readFrac(m[2]), x = m && (lf || readDec(m[1])), y = m && (rf || readDec(m[2]));
    if (!ok(!!x && !!y && (!!lf) !== (!!rf) && pr.text === '○ 안에 알맞은 기호를 고르세요.', where + '문제 글 형식 ' + pr.tex)) return;
    var l = x.n * y.d, r = y.n * x.d, f = lf || rf, d = lf ? y : x;
    ok(p.answer === (l > r ? '>' : l < r ? '<' : '='), where + pr.tex + ' → ' + p.answer);
    ok(f.lowest && f.proper && finite(f.d) && d.clean && d.n > 0n, where + '기약 진분수(대분수)와 0보다 큰 소수 ' + pr.tex);
    signs[level + p.answer + (lf ? 'L' : 'R')] = 1;
  });
  eq(Object.keys(signs).length, 18, '단계마다 >, =, < 와 분수의 좌우 자리가 모두 나옴');
  done('분수와 소수의 크기 비교');

  group('A15 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v, null) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var Js = function (p, raws) { return raws.map(function (r) { return J(p, r); }).join(' '); };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var tex = function (p) { return MH.types[p.type].prompt(p.v).tex; };

  var t1 = prob('A15.to-ten', { b: 4, a: 3 });                                   /* 3/4 = □/100 */
  eq(tex(t1) + ' ' + Js(t1, ['75', '3', '25', '99', '70']), '\\dfrac{3}{4} = \\dfrac{\\square}{100} correct:- wrong:numerator-unchanged wrong:multiplier-only wrong:difference-added wrong:-', '3/4 = □/100 의 답과 실수');
  eq(says(t1), '분모 4에 25를 곱하면 100이 돼요. [4 \\times 25 = 100] | 분자에도 똑같이 25를 곱해요: 3 × 25 = 75. [\\dfrac{3}{4} = \\dfrac{3 \\times 25}{4 \\times 25} = \\dfrac{75}{100}]', '분모를 100으로 만드는 풀이');

  var d1 = prob('A15.to-decimal', { imp: 0, b: 4, w: 0, a: 3 });                 /* 3/4 = 0.75 */
  eq(Js(d1, ['0.75', '0.750', '3.4', '0.3', '0.03', '0.7']), 'correct:- correct-note:- wrong:digits-joined wrong:numerator-after-point wrong:numerator-not-scaled wrong:-', '3/4 의 답과 실수');
  var d2 = prob('A15.to-decimal', { imp: 0, b: 5, w: 2, a: 1 });                 /* 2 1/5 = 2.2 */
  eq(tex(d2) + ' ' + Js(d2, ['2.2', '2.1', '2.5', '0.2', '2.20']), '2\\dfrac{1}{5} correct:- wrong:numerator-after-point wrong:denominator-after-point wrong:whole-dropped correct-note:-', '2와 1/5 의 답과 실수');
  eq(says(d2).split(' | ').slice(-1)[0], '자연수 부분 2를 소수점 앞에 쓰면 2.2예요. 분수 부분은 분자 ÷ 분모(1 ÷ 5)로 계산해도 같아요. [2\\dfrac{1}{5} = 2.2]', '대분수를 소수로 바꾸는 풀이의 마지막');
  var d3 = prob('A15.to-decimal', { imp: 1, b: 8, w: 2, a: 1 });                 /* 17/8 = 2.125 */
  eq(tex(d3) + ' ' + Js(d3, ['2.125', '17.8', '2.1', '0.017', '0.125']), '\\dfrac{17}{8} correct:- wrong:digits-joined wrong:numerator-after-point wrong:numerator-not-scaled wrong:-', '가분수 17/8 의 답과 실수');
  eq(says(d3).split(' | ')[0], '가분수를 대분수로 바꿔요. 17 ÷ 8 = 2 … 1이에요. [\\dfrac{17}{8} = 2\\dfrac{1}{8}]', '가분수 풀이의 첫 단계');
  eq(MH.judge(d3, '2.1').mistake.explain, '17 ÷ 8의 몫 2와 나머지 1을 소수점으로 이어 썼어요. 나머지 1은 8분의 1이라는 뜻이에요. 분모 8을 1000으로 바꾸면 1 × 125 = 125.', '몫과 나머지를 이어 쓴 실수의 설명');
  var d4 = prob('A15.to-decimal', { imp: 0, b: 125, w: 0, a: 3 });               /* 3/125 = 0.024 */
  eq(K.tex(d4.answer) + ' | ' + says(d4).split(' | ')[1], '0.024 | 1000분의 24는 0.001이 24개인 수예요. 소수점 아래가 세 자리가 되도록 빈 자리에 0을 써요. [\\dfrac{24}{1000} = 0.024]', '빈 자리에 0 을 쓰는 풀이');

  var f1 = prob('A15.to-fraction', { p: 2, big: 0, n: 75 });                     /* 0.75 = 3/4 */
  eq(Js(f1, [',3,4', ',75,100', ',15,20', ',75,10', ',75,1000', ',7,5']), 'correct:- invalid:- invalid:- wrong:denominator-short wrong:denominator-long wrong:digits-split', '0.75 의 답과 실수(약분 안 한 답은 다시)');
  eq(MH.judge(f1, ',75,100').note, '값은 같지만 더 약분할 수 있어요. 분자와 분모를 함께 나눌 수 있는 수가 더 있는지 찾아보세요.', '약분하지 않은 답의 안내');
  eq(says(f1), '0.75는 소수 두 자리 수예요. 0.01이 75개니까 분모가 100인 분수로 써요. [0.75 = \\dfrac{75}{100}] | 약분해요. 75와 100의 최대공약수 25로 분자와 분모를 나눠요: 75 ÷ 25 = 3, 100 ÷ 25 = 4. [\\dfrac{75}{100} = \\dfrac{3}{4}]', '0.75 를 기약분수로 바꾸는 풀이');
  var f2 = prob('A15.to-fraction', { p: 1, n: 24 });                             /* 2.4 = 2 2/5 */
  eq(Js(f2, ['2,2,5', ',12,5', '2,4,10', ',2,5', ',2,4', '2,4,100']), 'correct:- correct:- invalid:- wrong:whole-dropped wrong:point-as-bar wrong:denominator-long', '2.4 의 답과 실수(대분수 · 가분수 모두 정답)');
  eq(says(f2).split(' | ')[0], '2.4는 소수 한 자리 수예요. 자연수 부분 2는 그대로 두고, 소수점 아래는 0.1이 4개니까 10분의 4예요. [2.4 = 2\\dfrac{4}{10}]', '자연수 부분이 있는 소수의 풀이');
  var f3 = prob('A15.to-fraction', { p: 3, big: 0, n: 125 });                    /* 0.125 = 1/8 */
  eq(tex(f3) + ' ' + Js(f3, [',1,8', ',125,100', ',1,80']), '0.125 correct:- wrong:denominator-short wrong:denominator-long', '0.125 의 답과 실수');

  var c1 = prob('A15.compare', { b: 4, w: 0, a: 1, off: -5, side: 0 });          /* 1/4 ○ 0.2 */
  eq(tex(c1) + ' ' + Js(c1, ['>', '<', '=']), '\\dfrac{1}{4} \\;\\bigcirc\\; 0.2 correct:- wrong:numerator-after-point wrong:said-equal', '1/4 과 0.2 의 비교');
  eq(says(c1), '분수를 소수로 바꿔요. 분모와 분자에 25를 곱하면 100분의 25예요. [\\dfrac{1}{4} = \\dfrac{25}{100} = 0.25] | 소수끼리 비교해요. 0.2는 0.20과 같아요. 0.25가 0.20보다 커요. [0.25 > 0.20] | 분수가 소수보다 커요. [\\dfrac{1}{4} \\;>\\; 0.2]', '자릿수를 맞춰 비교하는 풀이');
  eq(MH.judge(c1, '<').mistake.explain, '분수 4분의 1을 0.1로 생각했어요. 분모가 4예요. 분모를 100으로 바꾸면 0.25예요.', '분자를 소수점 아래에 놓은 실수의 설명');
  var c2 = prob('A15.compare', { b: 5, w: 1, a: 3, off: 0, side: 1 });           /* 1.6 ○ 1 3/5 */
  eq(tex(c2) + ' ' + Js(c2, ['=', '>', '<']), '1.6 \\;\\bigcirc\\; 1\\dfrac{3}{5} correct:- wrong:numerator-after-point wrong:missed-equal', '1.6 과 1과 3/5 의 비교');
  eq(MH.judge(c2, '<').mistake.explain, '두 수는 크기가 같아요. 분수를 소수로 바꾸면 1.6이에요. 주어진 소수와 똑같은 수예요.', '같은 수를 다르다고 한 실수의 설명');
  var c3 = prob('A15.compare', { b: 8, w: 0, a: 3, off: 25, side: 1 });          /* 0.4 ○ 3/8 */
  eq(tex(c3) + ' ' + Js(c3, ['>', '<', '=']), '0.4 \\;\\bigcirc\\; \\dfrac{3}{8} correct:- wrong:reversed wrong:said-equal', '0.4 와 3/8 의 비교');
  eq(MH.judge(c3, '<').mistake.explain, '부등호의 방향이 반대예요. 부등호는 큰 수 쪽으로 벌어져요. 분수를 소수로 바꾸면 0.375고, 이 수가 0.4보다 작아요.', '부등호 방향 실수의 설명');
  done('판정 · 실수 · 풀이 예');
})();
