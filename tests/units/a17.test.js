/* A17 분수·소수 혼합 계산 — 단원 전용 검사.
   화면에 보이는 식과 글을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var B = function (x) { return BigInt(x); };
  var g = function (a, b) { while (b) { var t = a % b; a = b; b = t; } return a; };
  /** 분수 글자를 { n, d } 로 읽는다: '2\dfrac{1}{5}' → 11/5 */
  var readFrac = function (s) {
    var m = /^(\d*)\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(s);
    if (!m) return null;
    var w = m[1] ? B(m[1]) : 0n, n = B(m[2]), d = B(m[3]);
    return { n: w * d + n, d: d, frac: true, mixed: !!m[1], lowest: g(n, d) === 1n, proper: n < d };
  };
  /** 소수 글자를 { n, d } 로 읽는다: '3.25' → 325/100 */
  var readDec = function (s) {
    var m = /^(\d+)\.(\d+)$/.exec(s);
    if (!m) return null;
    var d = 1n;
    for (var i = 0; i < m[2].length; i++) d *= 10n;
    return { n: B(m[1] + m[2]), d: d, frac: false, places: m[2].length, clean: m[2].charAt(m[2].length - 1) !== '0' };
  };
  var readNum = function (s) { return readFrac(s) || readDec(s); };
  var finite = function (d) { while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n; return d === 1n; };
  var same = function (x, y) { return x.n * y.d === y.n * x.d; };
  var OPS = {
    '+': function (x, y) { return { n: x.n * y.d + y.n * x.d, d: x.d * y.d }; },
    '-': function (x, y) { return { n: x.n * y.d - y.n * x.d, d: x.d * y.d }; },
    '\\times': function (x, y) { return { n: x.n * y.n, d: x.d * y.d }; },
    '\\div': function (x, y) { return { n: x.n * y.d, d: x.d * y.n }; }
  };
  /** 답 값을 { n, d } 로: 소수 { n, p } 또는 분수 { n, d } */
  var ansOf = function (a) { return a.p !== undefined ? { n: B(a.n), d: B(MH.pow10(a.p)) } : { n: B(a.n), d: B(a.d) }; };
  var FORM = '계산하세요. 답은 분수나 자연수로 써요.';

  group('A17 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var seenAd = {};
  each('A17.add-dec', function (p, pr, level, where) {
    var m = /^(\S+) ([+-]) (\S+)$/.exec(pr.tex || ''), x = m && readNum(m[1]), y = m && readNum(m[3]);
    if (!ok(!!x && !!y && x.frac !== y.frac && pr.text === '계산해서 답을 소수로 쓰세요.', where + '문제 글 형식 ' + pr.tex)) return;
    var f = x.frac ? x : y, d = x.frac ? y : x;
    ok(same(ansOf(p.answer), OPS[m[2]](x, y)), where + pr.tex + ' → ' + JSON.stringify(p.answer));
    ok(p.answer.n > 0 && p.answer.p >= 1 && p.answer.p <= 3 && p.answer.n % 10 !== 0, where + '답은 0보다 큰 소수(세 자리 안, 끝의 0 없음)');
    ok(f.lowest && f.proper && finite(f.d) && d.clean, where + '유한소수가 되는 기약분수와 끝의 0이 없는 소수 ' + pr.tex);
    ok([[2n, 5n], [4n, 20n, 25n, 50n], [8n, 40n, 125n]][level].indexOf(f.d) >= 0, where + '단계에 맞는 분모 ' + pr.tex);
    seenAd[level + m[2] + (x.frac ? 'L' : 'R')] = 1;
  });
  eq(Object.keys(seenAd).length, 12, '단계마다 덧셈 · 뺄셈과 분수의 좌우 자리가 모두 나옴');
  done('소수로 고쳐서 더하고 빼기');

  var seenAf = {}, mixedAf = 0;
  each('A17.add-frac', function (p, pr, level, where) {
    var m = /^(\S+) ([+-]) (\S+)$/.exec(pr.tex || ''), x = m && readNum(m[1]), y = m && readNum(m[3]);
    if (!ok(!!x && !!y && x.frac !== y.frac && pr.text === FORM, where + '문제 글 형식 ' + pr.tex)) return;
    var f = x.frac ? x : y, d = x.frac ? y : x, a = ansOf(p.answer);
    ok(same(a, OPS[m[2]](x, y)), where + pr.tex + ' → ' + JSON.stringify(p.answer));
    ok(a.n > 0n && g(a.n, a.d) === 1n && a.d <= 60n, where + '답은 0보다 큰 기약분수(분모 60 이하)');
    ok(f.lowest && f.proper && !finite(f.d) && d.clean, where + '소수로 끝나지 않는 기약분수와 끝의 0이 없는 소수 ' + pr.tex);
    if (level < 2) ok(!f.mixed, where + '진분수 ' + pr.tex); else { ok(f.mixed, where + '대분수 ' + pr.tex); mixedAf++; }
    if (level === 0) ok((f.d === 3n || f.d === 6n) && d.places === 1, where + '분모 3, 6과 소수 한 자리 수 ' + pr.tex);
    /* 약분하지 않은 답도 정답이고, 약분하라고 알려 준다 */
    if (a.d * 2n < 10000000n) ok(MH.judge(p, ',' + a.n * 2n + ',' + a.d * 2n).verdict === 'correct-note', where + '약분 안 한 답은 정답 + 안내');
    seenAf[level + m[2] + (x.frac ? 'L' : 'R')] = 1;
  });
  eq(Object.keys(seenAf).length, 12, '단계마다 덧셈 · 뺄셈과 분수의 좌우 자리가 모두 나옴');
  eq(mixedAf, N, '마지막 단계는 모두 대분수');
  done('분수로 고쳐서 더하고 빼기');

  var seenMd = {};
  each('A17.mul-div', function (p, pr, level, where) {
    var m = /^(\S+) (\\times|\\div) (\S+)$/.exec(pr.tex || ''), x = m && readNum(m[1]), y = m && readNum(m[3]);
    if (!ok(!!x && !!y && x.frac !== y.frac && pr.text === FORM, where + '문제 글 형식 ' + pr.tex)) return;
    var f = x.frac ? x : y, d = x.frac ? y : x, a = ansOf(p.answer);
    ok(same(a, OPS[m[2]](x, y)), where + pr.tex + ' → ' + JSON.stringify(p.answer));
    ok(a.n > 0n && g(a.n, a.d) === 1n && a.d <= 30n && a.n <= 150n, where + '답은 기약분수(분모 30 이하)');
    ok(f.lowest && f.proper && f.d <= 9n && d.clean, where + '기약분수와 끝의 0이 없는 소수 ' + pr.tex);
    if (level === 0) ok(m[2] === '\\times' && !f.mixed && d.n < d.d, where + '진분수 × 1보다 작은 소수 ' + pr.tex);
    if (level === 1) ok(m[2] === '\\div' && !f.mixed && d.n < d.d, where + '진분수와 1보다 작은 소수의 나눗셈 ' + pr.tex);
    seenMd[level + m[2] + (x.frac ? 'L' : 'R') + (level === 2 && f.mixed ? 'M' : '')] = 1;
  });
  eq(Object.keys(seenMd).length, 2 + 2 + 8, '곱셈 · 나눗셈, 분수의 좌우 자리, 대분수가 모두 나옴');
  done('분수와 소수의 곱셈 · 나눗셈');

  var seenMx = {};
  each('A17.mixed', function (p, pr, level, where) {
    var t = pr.tex || '', m = /^\\left\((\S+) ([+-]) (\S+)\\right\) (\\times|\\div) (\S+)$/.exec(t), paren = !!m;
    if (!m) m = /^(\S+) ([+-]) (\S+) (\\times|\\div) (\S+)$/.exec(t);
    var x = m && readNum(m[1]), y = m && readNum(m[3]), z = m && readNum(m[5]);
    if (!ok(!!x && !!y && !!z && pr.text === FORM, where + '문제 글 형식 ' + t)) return;
    var a = ansOf(p.answer), inner = paren ? OPS[m[2]](x, y) : OPS[m[4]](y, z), val = paren ? OPS[m[4]](inner, z) : OPS[m[2]](x, inner);
    ok(same(a, val), where + t + ' → ' + JSON.stringify(p.answer));
    ok(a.n > 0n && inner.n > 0n && g(a.n, a.d) === 1n && a.d <= 40n && a.n <= 200n, where + '답과 중간 값이 0보다 크고 답은 기약분수(분모 40 이하)');
    var kinds = [x, y, z].map(function (q) { return q.frac ? 'f' : 'd'; }).join('');
    ok(kinds.indexOf('f') >= 0 && kinds.indexOf('d') >= 0, where + '분수와 소수가 모두 들어 있음 ' + t);
    ok([x, y, z].every(function (q) { return q.frac ? q.lowest && q.proper && !q.mixed : q.clean; }), where + '기약 진분수와 끝의 0이 없는 소수 ' + t);
    ok(paren === (level === 2) && (level === 2 || (m[4] === '\\times') === (level === 0)), where + '단계에 맞는 식의 모양 ' + t);
    seenMx[level + m[2] + m[4]] = 1;
    seenMx['pat' + level + kinds] = 1;
  });
  eq(Object.keys(seenMx).filter(function (k) { return k.indexOf('pat') !== 0; }).length, 2 + 2 + 4, '단계마다 식의 모양이 모두 나옴');
  eq(Object.keys(seenMx).filter(function (k) { return k.indexOf('pat') === 0; }).length, 18, '단계마다 분수 · 소수의 자리 6가지가 모두 나옴');
  done('분수와 소수의 혼합 계산');

  /* 문장제: 글에서 상황(낱말)과 두 수를 읽어 직접 계산한다 */
  var STORIES = [
    ['물통', '+', 'L', 0], ['끈', '-', 'm', 0], ['서점', '+', 'km', 0], ['밀가루', '-', 'kg', 0],
    ['철사', '\\times', 'kg', 1], ['수도', '\\times', 'L', 1], ['텃밭', '\\times', 'm²', 1], ['기차', '\\times', 'km', 1],
    ['주스', '\\div', '컵', 2], ['직사각형이', '\\div', 'm', 2], ['리본', '\\div', '도막', 2], ['걸었어요', '\\div', 'km', 2]
  ];
  var seenW = {};
  each('A17.word', function (p, pr, level, where) {
    var text = pr.text || '', st = STORIES.filter(function (s) { return text.indexOf(s[0]) >= 0; });
    var nums = (text.match(/\$[^$]+\$|\d+\.\d+/g) || []).map(function (s) { return readNum(s.replace(/\$/g, '')); });
    if (!ok(st.length === 1 && nums.length === 2 && !!nums[0] && !!nums[1] && nums[0].frac !== nums[1].frac && !pr.tex, where + '문제 글 형식 ' + text)) return;
    var s = st[0], whole = s[2] === '컵' || s[2] === '도막', a = ansOf(p.answer);
    /* '… 시간 동안 … km를 걸었어요' 는 나누는 수(시간)가 글에서 먼저 나온다 */
    var x = s[0] === '걸었어요' ? nums[1] : nums[0], y = s[0] === '걸었어요' ? nums[0] : nums[1];
    ok(s[3] === level, where + '단계에 맞는 상황 ' + text);
    ok(same(a, OPS[s[1]](x, y)), where + text + ' → ' + JSON.stringify(p.answer));
    ok(MH.types['A17.word'].answer.suffix(p.v, p.ctx) === s[2] && text.indexOf('몇 ' + s[2]) >= 0, where + '묻는 단위와 답의 단위 ' + text);
    ok(p.answer.n > 0 && p.answer.p <= 2 && (p.answer.p === 0 || p.answer.n % 10 !== 0), where + '답은 소수 두 자리 안');
    ok(whole ? p.answer.p === 0 && !/소수로/.test(text) : p.answer.p >= 1 && / 답은 소수로 써요\.$/.test(text), where + '몇 컵 · 몇 도막은 자연수, 나머지는 소수 ' + text + ' → ' + JSON.stringify(p.answer));
    var f = nums[0].frac ? nums[0] : nums[1], d = nums[0].frac ? nums[1] : nums[0];
    ok(f.lowest && f.proper && [2n, 4n, 5n].indexOf(f.d) >= 0 && d.clean, where + '분모 2, 4, 5인 기약분수와 끝의 0이 없는 소수 ' + text);
    seenW[s[0] + (nums[0].frac ? 'F' : 'D')] = 1;
  });
  eq(Object.keys(seenW).length, 24, '상황 12가지에서 분수와 소수의 자리가 모두 바뀌어 나옴');
  done('분수와 소수가 섞인 문장제');

  group('A17 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v, null) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var Js = function (p, raws) { return raws.map(function (r) { return J(p, r); }).join(' '); };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var tex = function (p) { var pr = MH.types[p.type].prompt(p.v); return pr.tex || pr.text; };

  var a1 = prob('A17.add-dec', { b: 4, w: 0, a: 3, dp: 1, dn: 5, op: 0, side: 0 });                 /* 3/4 + 0.5 = 1.25 */
  eq(tex(a1) + ' ' + Js(a1, ['1.25', '1.250', '0.8', '0.25', '0.75', '1.2']), '\\dfrac{3}{4} + 0.5 correct:- correct-note:- wrong:numerator-after-point wrong:wrong-operation wrong:converted-only wrong:-', '3/4 + 0.5 의 답과 실수');
  eq(says(a1), '분수를 소수로 고쳐요. 분모 4에 25를 곱하면 100이 되니까 분자에도 25를 곱해요. [\\dfrac{3}{4} = \\dfrac{75}{100} = 0.75] | 소수점 아래 자릿수가 달라요. 끝에 0을 붙여 자릿수를 맞춰요. 소수점의 자리를 맞춰 더해요. [0.75 + 0.50 = 1.25]', '소수로 고쳐서 더하는 풀이');
  eq(MH.judge(a1, '0.8').mistake.explain, '분수 4분의 3을 0.3으로 생각했어요. 분자를 그대로 소수점 아래에 쓸 수 있는 것은 분모가 10, 100, 1000일 때뿐이에요. 분모 4를 100으로 바꾸면 0.75예요.', '분자를 소수점 아래에 쓴 실수의 설명');
  var a2 = prob('A17.add-dec', { b: 5, w: 1, a: 2, dp: 1, dn: 23, op: 1, side: 1 });                /* 2.3 − 1 2/5 = 0.9 */
  eq(tex(a2) + ' ' + Js(a2, ['0.9', '1.1', '3.7', '1.4', '0.90']), '2.3 - 1\\dfrac{2}{5} correct:- wrong:numerator-after-point wrong:wrong-operation wrong:converted-only correct-note:-', '2.3 − 1과 2/5 의 답과 실수');
  eq(MH.judge(a2, '1.4').mistake.explain, '1.4는 분수를 소수로 고친 값이에요. 계산이 아직 남았어요: 2.3 − 1.4.', '분수를 소수로 고치기만 한 실수의 설명');
  var a3 = prob('A17.add-dec', { b: 20, w: 0, a: 13, dp: 1, dn: 29, op: 0, side: 1 });              /* 2.9 + 13/20 = 3.55 */
  eq(tex(a3) + ' ' + Js(a3, ['3.55', '0.94']), '2.9 + \\dfrac{13}{20} correct:- wrong:right-aligned', '2.9 + 13/20 의 답과 끝자리를 맞춘 실수');
  eq(MH.judge(a3, '0.94').mistake.explain, '소수점이 아니라 끝자리를 맞춰서 계산했어요. 2.9는 2.90과 같아요. 소수점의 자리를 맞춰서 다시 계산해요.', '끝자리를 맞춘 실수의 설명');

  var f1 = prob('A17.add-frac', { b: 3, w: 0, a: 1, dp: 1, dn: 5, op: 0, side: 0 });                /* 1/3 + 0.5 = 5/6 */
  eq(tex(f1) + ' ' + Js(f1, [',5,6', ',10,12', ',2,5', ',2,6', ',1,6', ',3,5']), '\\dfrac{1}{3} + 0.5 correct:- correct-note:- wrong:tops-and-bottoms wrong:numerators-unscaled wrong:- wrong:numerator-after-point', '1/3 + 0.5 의 답과 실수(1/6 은 정해 둔 실수가 아님)');
  eq(MH.judge(f1, ',10,12').note, '약분하면 $\\frac{5}{6}$예요.', '약분하지 않은 답의 안내');
  eq(says(f1), '3분의 1은 소수로 고치면 끝나지 않아요(1 ÷ 3 = 0.333…). 그래서 소수를 분수로 고쳐요. 0.5는 10분의 5고, 약분하면 2분의 1이에요. [0.5 = \\dfrac{5}{10} = \\dfrac{1}{2}] | 분모를 3과 2의 최소공배수 6으로 통분하고 분자끼리 더해요. [\\dfrac{1}{3} + \\dfrac{1}{2} = \\dfrac{2}{6} + \\dfrac{3}{6} = \\dfrac{5}{6}]', '분수로 고쳐서 더하는 풀이');
  eq(MH.judge(f1, ',2,6').mistake.explain, '분모만 6으로 바꾸고 분자는 그대로 뒀어요. 분모에 곱한 수를 분자에도 곱해야 해요: 3분의 1 = 6분의 2.', '통분할 때 분자를 그대로 둔 실수의 설명');
  var f2 = prob('A17.add-frac', { b: 6, w: 1, a: 5, dp: 2, dn: 75, op: 1, side: 0 });               /* 1 5/6 − 0.75 = 1 1/12 */
  eq(tex(f2) + ' ' + Js(f2, ['1,1,12', ',13,12', ',26,24', ',31,12']), '1\\dfrac{5}{6} - 0.75 correct:- correct:- correct-note:- wrong:wrong-operation', '1과 5/6 − 0.75 의 답(대분수 · 가분수 모두 정답)');
  eq(says(f2).split(' | ').slice(1).join(' | '), '대분수를 가분수로 고쳐요: 1 × 6 + 5 = 11. [1\\dfrac{5}{6} = \\dfrac{11}{6}] | 분모를 6과 4의 최소공배수 12로 통분하고 분자끼리 빼요. [\\dfrac{11}{6} - \\dfrac{3}{4} = \\dfrac{22}{12} - \\dfrac{9}{12} = \\dfrac{13}{12}] | 가분수를 대분수로 고쳐요: 13 ÷ 12 = 1 … 1. [\\dfrac{13}{12} = 1\\dfrac{1}{12}]', '대분수가 있는 뺄셈의 풀이');

  var m1 = prob('A17.mul-div', { op: 0, b: 3, w: 0, a: 2, dp: 1, dn: 6, side: 1 });                 /* 0.6 × 2/3 = 2/5 */
  eq(tex(m1) + ' ' + Js(m1, [',2,5', ',4,10', ',9,10', ',1,25']), '0.6 \\times \\dfrac{2}{3} correct:- correct-note:- wrong:flipped-in-multiplication wrong:denominator-wrong', '0.6 × 2/3 의 답과 실수');
  eq(says(m1), '소수를 분수로 고쳐요. 0.6은 10분의 6이고, 약분하면 5분의 3이에요. [0.6 = \\dfrac{6}{10} = \\dfrac{3}{5}] | 분자는 분자끼리, 분모는 분모끼리 곱해요. 약분할 수 있으면 약분해요. [\\dfrac{3}{5} \\times \\dfrac{2}{3} = \\dfrac{3 \\times 2}{5 \\times 3} = \\dfrac{6}{15} = \\dfrac{2}{5}]', '소수를 분수로 고쳐서 곱하는 풀이');
  var m2 = prob('A17.mul-div', { op: 1, b: 4, w: 0, a: 3, dp: 1, dn: 5, side: 0 });                 /* 3/4 ÷ 0.5 = 1 1/2 */
  eq(tex(m2) + ' ' + Js(m2, ['1,1,2', ',3,2', ',6,4', ',3,8', ',2,3', '15,,']), '\\dfrac{3}{4} \\div 0.5 correct:- correct:- correct-note:- wrong:not-flipped wrong:flipped-dividend wrong:denominator-wrong', '3/4 ÷ 0.5 의 답과 실수');
  eq(says(m2).split(' | ').slice(1).join(' | '), '나눗셈을 곱셈으로 고쳐요. 나누는 수 2분의 1의 분자와 분모를 바꿔서 곱해요. [\\dfrac{3}{4} \\div \\dfrac{1}{2} = \\dfrac{3}{4} \\times 2] | 분자는 분자끼리, 분모는 분모끼리 곱해요. 약분할 수 있으면 약분해요. [\\dfrac{3}{4} \\times 2 = \\dfrac{3 \\times 2}{4} = \\dfrac{6}{4} = \\dfrac{3}{2} = 1\\dfrac{1}{2}]', '나눗셈을 곱셈으로 고치는 풀이');
  eq(MH.judge(m2, ',3,8').mistake.explain, '나누는 수를 뒤집지 않고 그대로 곱했어요. ÷ 2분의 1은 × 2로 고쳐서 계산해요.', '나누는 수를 뒤집지 않은 실수의 설명');
  eq(MH.judge(m2, '15,,').mistake.explain, '0.5를 분모가 100인 분수로 고쳤어요. 0.5는 소수 한 자리 수라서 분모가 10이에요: 10분의 5.', '소수의 분모를 잘못 잡은 실수의 설명');
  var m3 = prob('A17.mul-div', { op: 0, b: 3, w: 1, a: 1, dp: 1, dn: 15, side: 0 });                /* 1 1/3 × 1.5 = 2 */
  eq(tex(m3) + ' ' + Js(m3, ['2,,', ',2,1', '1,1,2', ',8,9']), '1\\dfrac{1}{3} \\times 1.5 correct:- correct:- wrong:whole-separately wrong:flipped-in-multiplication', '1과 1/3 × 1.5 의 답(자연수)과 실수');
  eq(MH.judge(m3, '1,1,2').mistake.explain, '대분수의 자연수 1은 그대로 두고 분수 부분만 곱했어요. 대분수는 가분수(3분의 4)로 고친 다음에 곱해요.', '자연수 부분을 따로 둔 실수의 설명');

  var x1 = prob('A17.mixed', { form: 0, pat: 'dfd', x: { n: 5, p: 1 }, y: { a: 1, b: 4 }, z: { n: 8, p: 1 } });      /* 0.5 + 1/4 × 0.8 = 7/10 */
  eq(tex(x1) + ' ' + Js(x1, [',7,10', ',14,20', ',3,5', ',1,5', ',3,10']), '0.5 + \\dfrac{1}{4} \\times 0.8 correct:- correct-note:- wrong:order-ignored wrong:first-part-only wrong:wrong-sign', '0.5 + 1/4 × 0.8 의 답과 실수');
  eq(says(x1), '소수를 분수로 고쳐요. 0.5는 2분의 1이고, 0.8은 5분의 4예요. [0.5 = \\dfrac{5}{10} = \\dfrac{1}{2},\\quad 0.8 = \\dfrac{8}{10} = \\dfrac{4}{5}] | 분수로 다시 쓴 식이에요. 곱셈을 덧셈 · 뺄셈보다 먼저 계산해요. [\\dfrac{1}{2} + \\dfrac{1}{4} \\times \\dfrac{4}{5}] | 곱셈부터 계산해요. 분자는 분자끼리, 분모는 분모끼리 곱해요. [\\dfrac{1}{4} \\times \\dfrac{4}{5} = \\dfrac{1 \\times 4}{4 \\times 5} = \\dfrac{4}{20} = \\dfrac{1}{5}] | 그 값을 2분의 1에 더해요. 분모를 10으로 통분해요. [\\dfrac{1}{2} + \\dfrac{1}{5} = \\dfrac{5}{10} + \\dfrac{2}{10} = \\dfrac{7}{10}]', '곱셈이 섞인 식의 풀이');
  eq(MH.judge(x1, ',3,5').mistake.explain, '앞에서부터 차례로 계산했어요. 곱셈은 덧셈 · 뺄셈보다 먼저 계산해요. 4분의 1 × 0.8부터 계산해요.', '계산 순서를 무시한 실수의 설명');
  var x2 = prob('A17.mixed', { form: 3, pat: 'dfd', x: { n: 15, p: 1 }, y: { a: 2, b: 3 }, z: { n: 8, p: 1 } });     /* 1.5 − 2/3 ÷ 0.8 = 2/3 */
  eq(tex(x2) + ' ' + Js(x2, [',2,3', '1,1,24', ',5,6', ',29,30', ',7,3']), '1.5 - \\dfrac{2}{3} \\div 0.8 correct:- wrong:order-ignored wrong:first-part-only wrong:not-flipped wrong:wrong-sign', '1.5 − 2/3 ÷ 0.8 의 답과 실수');
  eq(MH.judge(x2, ',5,6').mistake.explain, '3분의 2 ÷ 0.8까지만 계산했어요. 이 값을 1.5에서 빼야 답이 돼요.', '먼저 계산하는 부분만 답한 실수의 설명');
  var x3 = prob('A17.mixed', { form: 6, pat: 'fdf', x: { a: 1, b: 2 }, y: { n: 25, p: 2 }, z: { a: 3, b: 4 } });     /* (1/2 + 0.25) ÷ 3/4 = 1 */
  eq(tex(x3) + ' ' + Js(x3, ['1,,', ',5,6', ',3,4', ',9,16', ',1,3']), '\\left(\\dfrac{1}{2} + 0.25\\right) \\div \\dfrac{3}{4} correct:- wrong:order-ignored wrong:first-part-only wrong:not-flipped wrong:wrong-sign', '(1/2 + 0.25) ÷ 3/4 의 답과 실수');
  eq(says(x3).split(' | ').slice(2).join(' | '), '괄호 안을 계산해요. 분모를 4로 통분하고 분자끼리 더해요. [\\dfrac{1}{2} + \\dfrac{1}{4} = \\dfrac{2}{4} + \\dfrac{1}{4} = \\dfrac{3}{4}] | 그 값을 4분의 3으로 나눠요. 나누는 수의 분자와 분모를 바꿔서 곱해요. [\\dfrac{3}{4} \\div \\dfrac{3}{4} = \\dfrac{3}{4} \\times \\dfrac{4}{3} = \\dfrac{3 \\times 4}{4 \\times 3} = \\dfrac{12}{12} = 1]', '괄호가 있는 식의 풀이');
  eq(MH.judge(x3, ',5,6').mistake.explain, '괄호를 빼고 계산했어요. 괄호가 있으면 괄호 안의 2분의 1 + 0.25를 가장 먼저 계산해요.', '괄호를 무시한 실수의 설명');

  var w1 = prob('A17.word', { k: 0, s: 1, fd: 0, b: 4, w: 2, a: 1, dp: 1, dn: 8 });                  /* 2 1/4 − 0.8 = 1.45 */
  eq(tex(w1) + ' ' + Js(w1, ['1.45', '3.05', '1.3', '1.450']), '끈 $2\\dfrac{1}{4}$ m 가운데 0.8 m를 썼어요. 남은 끈은 몇 m일까요? 답은 소수로 써요. correct:- wrong:wrong-operation wrong:numerator-after-point correct-note:-', '끈 문제의 답과 실수');
  eq(says(w1), '쓰고 남은 양을 구하니까 빼요. 식을 세워요. [2\\dfrac{1}{4} - 0.8] | 분수를 소수로 고쳐요. 분모 4에 25를 곱하면 100이 되니까 분자에도 25를 곱해요. [2\\dfrac{1}{4} = 2\\dfrac{25}{100} = 2.25] | 소수점의 자리를 맞춰 빼요. 답은 1.45 m예요. [2.25 - 0.80 = 1.45]', '끈 문제의 풀이');
  var w2 = prob('A17.word', { k: 1, s: 0, fd: 0, b: 4, w: 0, a: 3, dp: 1, dn: 24 });                 /* 3/4 × 2.4 = 1.8 */
  eq(tex(w2) + ' ' + Js(w2, ['1.8', '3.15', '0.72', '1.80']), '1 m의 무게가 $\\dfrac{3}{4}$ kg인 철사가 있어요. 이 철사 2.4 m의 무게는 몇 kg일까요? 답은 소수로 써요. correct:- wrong:added-instead wrong:numerator-after-point correct-note:-', '철사 문제의 답과 실수');
  eq(says(w2), '(1 m의 무게) × (길이)의 식을 세워요. [\\dfrac{3}{4} \\times 2.4] | 소수를 분수로 고쳐요. [2.4 = \\dfrac{24}{10} = \\dfrac{12}{5}] | 분자는 분자끼리, 분모는 분모끼리 곱하고 약분해요. [\\dfrac{3}{4} \\times \\dfrac{12}{5} = \\dfrac{3 \\times 12}{4 \\times 5} = \\dfrac{36}{20} = \\dfrac{9}{5}] | 분수를 소수로 고쳐요. 답은 1.8 kg이에요. [\\dfrac{9}{5} = \\dfrac{18}{10} = 1.8]', '철사 문제의 풀이');
  eq(MH.judge(w2, '3.15').mistake.explain, '두 수를 더했어요. (1 m의 무게) × (길이) 식으로 구하는 문제라서 곱해야 해요.', '곱해야 하는데 더한 실수의 설명');
  var w3 = prob('A17.word', { k: 2, s: 0, fd: 0, b: 4, w: 0, a: 3, qp: 0, qn: 6 });                  /* 4.5 ÷ 3/4 = 6 */
  eq(tex(w3) + ' ' + Js(w3, ['6', '3.375', '18', '6.0']), '주스 4.5 L를 한 컵에 $\\dfrac{3}{4}$ L씩 나누어 담아요. 모두 몇 컵이 될까요? correct:- wrong:multiplied-instead wrong:numerator-forgotten correct-note:-', '주스 문제의 답과 실수');
  eq(says(w3), '(전체 양) ÷ (한 컵의 양)의 식을 세워요. [4.5 \\div \\dfrac{3}{4}] | 소수를 분수로 고쳐요. [4.5 = \\dfrac{45}{10} = \\dfrac{9}{2}] | 나누는 수의 분자와 분모를 바꿔서 곱해요. 답은 6컵이에요. [\\dfrac{9}{2} \\div \\dfrac{3}{4} = \\dfrac{9}{2} \\times \\dfrac{4}{3} = \\dfrac{9 \\times 4}{2 \\times 3} = \\dfrac{36}{6} = 6]', '주스 문제의 풀이');
  eq(MH.judge(w3, '18').mistake.explain, '분모 4만 곱하고 분자 3으로 나누지 않았어요. ÷ 4분의 3은 × 3분의 4예요.', '분모만 곱한 실수의 설명');
  var w4 = prob('A17.word', { k: 2, s: 3, fd: 1, b: 2, w: 1, a: 1, qp: 1, qn: 35 });                 /* 5 1/4 ÷ 1.5 = 3.5 */
  eq(tex(w4) + ' ' + Js(w4, ['3.5', '7.875', '5.25']), '1.5시간 동안 $5\\dfrac{1}{4}$ km를 걸었어요. 같은 빠르기로 한 시간에는 몇 km를 걸을까요? 답은 소수로 써요. correct:- wrong:multiplied-instead wrong:-', '걷기 문제의 답과 실수');
  eq(says(w4).split(' | ').slice(1).join(' | '), '소수를 분수로 고쳐요. 대분수는 가분수로 고쳐요. [5\\dfrac{1}{4} = \\dfrac{21}{4},\\quad 1.5 = \\dfrac{15}{10} = \\dfrac{3}{2}] | 나누는 수의 분자와 분모를 바꿔서 곱해요. [\\dfrac{21}{4} \\div \\dfrac{3}{2} = \\dfrac{21}{4} \\times \\dfrac{2}{3} = \\dfrac{21 \\times 2}{4 \\times 3} = \\dfrac{42}{12} = \\dfrac{7}{2}] | 분수를 소수로 고쳐요. 답은 3.5 km예요. [\\dfrac{7}{2} = \\dfrac{35}{10} = 3.5]', '걷기 문제의 풀이');
  done('판정 · 실수 · 풀이 예');
})();
