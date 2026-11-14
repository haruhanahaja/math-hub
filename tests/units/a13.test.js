/* A13 소수의 뜻과 덧셈·뺄셈 — 단원 전용 검사 + 답 형식 decimal 검사.
   화면에 보이는 식 · 문제 글을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000, K = MH.kinds.decimal;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var B = function (x) { return BigInt(x); };
  var SCALE = 6, TEN = function (k) { var x = 1n; for (var i = 0; i < k; i++) x *= 10n; return x; };
  /** 소수 글자를 10^6 배 한 정수로 읽는다: '3.25' → 3250000n. 읽을 수 없으면 null. places 는 소수점 아래 자릿수 */
  var readDec = function (s) {
    var m = /^(\d+)(?:\.(\d+))?$/.exec(s);
    if (!m) return null;
    var f = m[2] || '';
    return { v: B(m[1] + f) * TEN(SCALE - f.length), places: f.length, whole: B(m[1]), text: s };
  };
  /** 답 { n, p } 를 같은 눈금의 정수로 */
  var ans = function (a) { return B(a.n) * TEN(SCALE - a.p); };
  var digitsOf = function (x, places) { var s = String(x.v / TEN(SCALE - places)); while (s.length < places + 1) s = '0' + s; return s.split('').reverse().map(Number); };

  group('답 형식 decimal');
  eq(JSON.stringify(K.parse('3.25')), '{"n":325,"p":2}', '3.25');
  eq(JSON.stringify(K.parse('0.50')), '{"n":50,"p":2}', '끝의 0 은 입력한 그대로 읽음');
  eq(JSON.stringify(K.parse('7')), '{"n":7,"p":0}', '자연수');
  eq(JSON.stringify(K.parse('3.')), '{"n":3,"p":0}', '소수점만 찍고 끝낸 입력은 자연수로');
  eq(JSON.stringify(K.parse('0.007')), '{"n":7,"p":3}', '0.007');
  eq(K.parse(''), null, '빈칸'); eq(K.parse('.5'), null, '소수점으로 시작'); eq(K.parse('1.2.3'), null, '소수점 두 개'); eq(K.parse('1.23456'), null, '소수점 아래 다섯 자리'); eq(K.parse('-1.5'), null, '음수'); eq(K.parse('1/2'), null, '분수');
  ok(K.equal({ n: 5, p: 1 }, { n: 50, p: 2 }) && K.equal({ n: 3, p: 0 }, { n: 300, p: 2 }) && !K.equal({ n: 5, p: 1 }, { n: 5, p: 2 }), '값이 같으면 같은 답(0.5 = 0.50, 3 = 3.00)');
  eq(K.tex({ n: 50, p: 2 }) + ' ' + K.raw({ n: 1609, p: 2 }) + ' ' + K.say({ n: 50, p: 2 }) + ' ' + K.tex({ n: 7, p: 3 }), '0.5 16.09 0.50 0.007', '보여 주는 글자');
  eq(K.note({ n: 50, p: 2 }, '0.50', {}), '소수점 아래 끝의 0은 쓰지 않아도 돼요: 0.5.', '끝의 0 안내');
  eq(K.note({ n: 300, p: 2 }, '3.00', {}), '소수점 아래 끝의 0은 쓰지 않아도 돼요: 3.', '3.00 → 3');
  eq(K.note({ n: 5, p: 1 }, '0.5', {}), null, '끝의 0 이 없으면 안내 없음'); eq(K.note({ n: 50, p: 2 }, '0.50', { zeros: 'off' }), null, '안내를 끈 유형');
  eq(K.common({ n: 75, p: 2 }, { n: 75, p: 1 }).id + ' ' + K.common({ n: 75, p: 0 }, { n: 75, p: 1 }).id, 'point-shift point-shift', '소수점 자리가 다른 답');
  eq(K.common({ n: 85, p: 1 }, { n: 75, p: 1 }).explain.split('. ')[0], '일의 자리가 1만큼 달라요', '일의 자리 1 차이');
  eq(K.common({ n: 313, p: 2 }, { n: 323, p: 2 }).explain.split('. ')[0], '소수 첫째 자리가 1만큼 달라요', '소수 첫째 자리 1 차이');
  eq(K.common({ n: 12, p: 1 }, { n: 75, p: 1 }), null, '설명할 수 없는 오답');
  eq(MH.decStr(325, 2) + ' ' + MH.decStr(5, 2) + ' ' + MH.decStr(350, 2) + ' ' + MH.decStr(350, 2, true) + ' ' + MH.decStr(12, 0) + ' ' + JSON.stringify(MH.dec(350, 2)) + ' ' + MH.pow10(3), '3.25 0.05 3.5 3.50 12 {"n":35,"p":1} 1000', '소수 도구');
  done('읽기 · 비교 · 안내 · 공통 실수');

  group('A13 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var readForms = {};
  each('A13.read', function (p, pr, level, where) {
    var f = /^(\d*)\\dfrac\{(\d+)\}\{(10+)\}$/.exec(pr.tex || ''), c = /^(0\.0*1)이 (\d+)개인 수를 소수로 쓰세요\.$/.exec(pr.text);
    if (!ok((!!f && pr.text === '분수를 소수로 쓰세요.') || (!!c && !pr.tex), where + '문제 글 형식 ' + pr.tex + ' ' + pr.text)) return;
    var den = f ? B(f[3]) : TEN(c[1].length - 2), w = f ? B(f[1] || 0) : 0n, a = B(f ? f[2] : c[2]);
    ok(ans(p.answer) * den === (w * den + a) * TEN(SCALE), where + (pr.tex || pr.text) + ' → ' + K.tex(p.answer));
    ok(a % 10n !== 0n || level === 0, where + '끝자리가 0 이 아닌 수');
    if (level === 0) ok(!!f && den === 10n && a < 10n, where + '분모가 10인 진분수 · 대분수');
    if (level === 1) ok(den === 10n && w === 0n && a > 10n, where + '0.1이 몇 개 · 분모가 10인 가분수');
    if (level === 2) ok(den >= 100n, where + '분모가 100, 1000');
    readForms[level + (c ? '개수' : w ? '대분수' : a > den ? '가분수' : '진분수')] = 1;
  });
  eq(Object.keys(readForms).sort().join(' | '), '0대분수 | 0진분수 | 1가분수 | 1개수 | 2개수 | 2대분수 | 2진분수', '문제 꼴이 단계에 맞게 고루 나옴');
  done('분수를 소수로');
  each('A13.place', function (p, pr, level, where) {
    if (level === 1) {
      var x = readDec(pr.tex || ''), m = /^이 수에서 숫자 (\d)[이가] 나타내는 수를 쓰세요\.$/.exec(pr.text);
      if (!ok(!!x && !!m, where + '문제 글 형식 ' + pr.tex + ' ' + pr.text)) return;
      var s = pr.tex, at = s.indexOf(m[1]), point = s.indexOf('.');
      ok(at >= 0 && s.indexOf(m[1], at + 1) < 0, where + '묻는 숫자는 수 안에 한 번만 나옴 ' + s);
      var value = B(m[1]) * (at < point ? TEN(SCALE + point - at - 1) : TEN(SCALE - (at - point)));
      ok(ans(p.answer) === value, where + s + ' 의 숫자 ' + m[1] + ' → ' + K.tex(p.answer));
      return;
    }
    var parts = /^(.+)인 수를 쓰세요\.$/.exec(pr.text || ''), sum = 0n, units = [], fine = !!parts && !pr.tex;
    if (fine) parts[1].split(', ').forEach(function (t) {
      var q = /^(10|1|0\.1|0\.01|0\.001)이 ([1-9])개$/.exec(t);
      if (!q) { fine = false; return; }
      sum += readDec(q[1]).v * B(q[2]); units.push(q[1]);
    });
    if (!ok(fine, where + '문제 글 형식 ' + pr.text)) return;
    ok(ans(p.answer) === sum, where + pr.text + ' → ' + K.tex(p.answer));
    var order = ['10', '1', '0.1', '0.01', '0.001'], idx = units.map(function (u) { return order.indexOf(u); });
    ok(idx.every(function (v, i) { return i === 0 || v > idx[i - 1]; }), where + '큰 자리부터 차례로 말함');
    var gap = idx[idx.length - 1] - idx[0] + 1 > idx.length;
    ok(level === 0 ? !gap && idx[0] === 1 : gap, where + (level === 0 ? '빈 자리 없이 일의 자리부터' : '빈 자리(0)가 있는 수') + ' ' + pr.text);
  });
  done('자릿값');
  var signs = {};
  each('A13.compare', function (p, pr, level, where) {
    var m = /^(\S+) \\;\\bigcirc\\; (\S+)$/.exec(pr.tex || ''), x = m && readDec(m[1]), y = m && readDec(m[2]);
    if (!ok(!!x && !!y && pr.text === '○ 안에 알맞은 기호를 고르세요.', where + '문제 글 형식 ' + pr.tex)) return;
    eq(p.answer, x.v > y.v ? '>' : x.v < y.v ? '<' : '=', where + pr.tex);
    if (level === 0) ok(x.places === y.places && x.v !== y.v, where + '자릿수가 같은 서로 다른 소수');
    if (level === 1) ok(x.places !== y.places && x.places + y.places === 3 && x.whole === y.whole, where + '소수 한 자리 수와 두 자리 수, 자연수 부분은 같음');
    if (level === 2) ok(x.places !== y.places && x.whole === y.whole && (p.answer === '=' || m[1].charAt(m[1].indexOf('.') + 1) === m[2].charAt(m[2].indexOf('.') + 1)), where + '자릿수가 다르고 소수 첫째 자리까지 같음');
    signs[level + p.answer] = 1;
  });
  eq(Object.keys(signs).sort().join(' '), '0< 0> 1< 1= 1> 2< 2= 2>', '부등호와 등호가 고루 나옴(자릿수가 같은 단계에는 등호 없음)');
  done('크기 비교');
  [['A13.add', '+'], ['A13.sub', '-']].forEach(function (pair) {
    each(pair[0], function (p, pr, level, where) {
      var m = pair[1] === '+' ? /^(\S+) \+ (\S+)$/.exec(pr.tex || '') : /^(\S+) - (\S+)$/.exec(pr.tex || ''), x = m && readDec(m[1]), y = m && readDec(m[2]);
      if (!ok(!!x && !!y && !pr.text, where + '문제 글 형식 ' + pr.tex)) return;
      ok(ans(p.answer) === (pair[1] === '+' ? x.v + y.v : x.v - y.v) && (pair[1] === '+' || x.v > y.v), where + pr.tex + ' → ' + K.tex(p.answer));
      ok(!/\.\d*0$/.test(m[1]) && !/\.\d*0$/.test(m[2]), where + '끝에 0 이 붙은 소수는 내지 않음');
      var P = Math.max(x.places, y.places), a = digitsOf(x, P), b = digitsOf(y, P), carry = false, borrow = false;
      a.forEach(function (d, i) { if (d + (b[i] || 0) >= 10) carry = true; if (d < (b[i] || 0)) borrow = true; });
      var regroup = pair[1] === '+' ? carry : borrow;
      if (level === 0) ok(x.places === y.places && !regroup, where + '자릿수가 같고 받아올림 · 받아내림이 없음');
      if (level === 1) ok(x.places === y.places && regroup, where + '자릿수가 같고 받아올림 · 받아내림이 있음');
      if (level === 2) ok(x.places !== y.places, where + '자릿수가 다름');
      /* 풀이의 세로셈에 자릿수를 맞춘 두 수와 답이 적혀 있는가 */
      var steps = MH.types[p.type].steps(p.v), last = steps.filter(function (s) { return s.tex && s.tex.indexOf('array') >= 0; }).pop().tex;
      var pad = function (o) { var t = o.text; if (P > o.places) { if (!o.places) t += '.'; for (var k = o.places; k < P; k++) t += '0'; } return t; };
      ok(last.indexOf(' ' + pad(x) + ' ') >= 0 && last.indexOf(' ' + pad(y) + ' ') >= 0 && last.indexOf('\\hline ' + MH.decStr(p.answer.n * MH.pow10(P - p.answer.p), P, true) + ' ') >= 0, where + '세로셈 ' + last);
    });
    done(pair[1] === '+' ? '덧셈' : '뺄셈');
  });

  group('A13 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v, null) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var Js = function (p, raws) { return raws.map(function (r) { return J(p, r); }).join(' '); };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var text = function (p) { var pr = MH.types[p.type].prompt(p.v); return (pr.tex || '') + (pr.text ? ' ' + pr.text : ''); };

  var r1 = prob('A13.read', { form: 0, k: 2, w: 0, a: 7 });                     /* 7/100 = 0.07 */
  eq(Js(r1, ['0.07', '0.070', '0.7', '7', '0.007', '0.08']), 'correct:- correct-note:- wrong:zero-missing wrong:no-point wrong:one-place-more wrong:place-diff', '7/100 의 답과 실수');
  eq(MH.judge(r1, '0.7').mistake.explain, '빈 자리의 0을 빠뜨렸어요. 분모가 100이면 소수점 아래가 두 자리예요. 끝 숫자가 소수 둘째 자리에 오도록 앞자리에 0을 써요: 0.07.', '0 을 빠뜨린 실수의 설명');
  eq(says(r1), '100분의 1을 소수로 쓰면 0.01이에요. 100분의 7은 0.01이 7개인 수예요. [\\dfrac{1}{100} = 0.01] | 소수점 아래가 두 자리여야 하는데 7은 한 자리 수예요. 모자란 앞자리에 0을 써요. [\\dfrac{7}{100} = 0.07] | 끝 숫자 7이 소수 둘째 자리에 오도록 쓰면 0.07이에요. [\\dfrac{7}{100} = 0.07]', '분수를 소수로 풀이');
  var r2 = prob('A13.read', { form: 1, k: 1, w: 0, a: 36 });                    /* 0.1이 36개 = 3.6 */
  eq(text(r2), ' 0.1이 36개인 수를 소수로 쓰세요.', '개수로 묻는 문제 글');
  eq(Js(r2, ['3.6', '0.36', '36']), 'correct:- wrong:count-after-point wrong:no-point', '0.1이 36개: 답과 실수');
  eq(MH.judge(r2, '0.36').mistake.explain, '36을 그대로 소수점 뒤에 썼어요. 0.1이 10개 모이면 1이 돼요. 36개는 1이 3개와 0.1이 6개예요.', '개수를 소수점 뒤에 쓴 실수의 설명');
  var r3 = prob('A13.read', { form: 0, k: 1, w: 1, a: 2 });                     /* 1과 2/10 = 1.2 */
  eq(Js(r3, ['1.2', '0.2', '12', '0.12']), 'correct:- wrong:whole-dropped wrong:no-point wrong:one-place-more', '1과 2/10 의 답과 실수');

  var p1 = prob('A13.place', { form: 0, t: 0, o: 4, d1: 0, d2: 6, d3: 0, at: 0 });   /* 1이 4개, 0.01이 6개 = 4.06 */
  eq(text(p1), ' 1이 4개, 0.01이 6개인 수를 쓰세요.', '모으기 문제 글');
  eq(Js(p1, ['4.06', '4.6', '406', '40.6', '0.406', '4.07']), 'correct:- wrong:packed wrong:no-point wrong:point-right wrong:point-left wrong:place-diff', '4.06 의 답과 실수');
  eq(says(p1), '자리마다 나타내는 수를 써요: 1이 4개 → 4, 0.01이 6개 → 0.06. | 소수 첫째 자리는 말하지 않았으니 비어 있어요. 빈 자리에는 0을 써요. | 모두 더하면 4.06이에요. [4 + 0.06 = 4.06]', '0 이 들어가는 소수 풀이');
  var p2 = prob('A13.place', { form: 1, t: 0, o: 4, d1: 6, d2: 9, d3: 1, at: 3 });   /* 4.691 의 9 → 0.09 */
  eq(text(p2), '4.691 이 수에서 숫자 9가 나타내는 수를 쓰세요.', '숫자가 나타내는 수 문제 글');
  eq(Js(p2, ['0.09', '9', '0.9', '0.009', '4.691']), 'correct:- wrong:digit-only wrong:place-off wrong:place-off-right wrong:whole-number', '4.691 의 9: 답과 실수');
  var p3 = prob('A13.place', { form: 1, t: 0, o: 4, d1: 6, d2: 9, d3: 1, at: 1 });   /* 4.691 의 4 → 4 */
  eq(Js(p3, ['4', '4.0', '0.4']), 'correct:- correct-note:- wrong:place-off-right', '일의 자리 숫자가 나타내는 수');

  var c1 = prob('A13.compare', { shape: [1, 2], ps: 1, pl: 2, eq: 0, side: 0, i: 5, j: 5, a: 4, b: 21 });    /* 5.4 > 5.21 */
  eq(text(c1), '5.4 \\;\\bigcirc\\; 5.21 ○ 안에 알맞은 기호를 고르세요.', '비교 문제 글');
  eq(Js(c1, ['>', '<', '=']), 'correct:- wrong:as-whole-numbers wrong:said-equal', '5.4 ○ 5.21');
  eq(MH.judge(c1, '<').mistake.explain, '소수점 아래의 수 4와 21을 자연수처럼 비교했어요. 소수는 자릿수가 많다고 큰 수가 아니에요. 자릿수를 맞추면 5.40과 5.21이에요.', '자연수처럼 비교한 실수의 설명');
  eq(says(c1), '자릿수를 맞춰요. 끝에 0을 붙여도 크기는 같으니까 5.4는 5.40과 같아요. [5.4 = 5.40] | 자연수 부분은 5로 같아요. 소수 첫째 자리의 숫자는 4와 2예요. 4가 2보다 커요. | 5.4가 5.21보다 커요. [5.40 > 5.21 \\;\\Rightarrow\\; 5.4 > 5.21]', '크기 비교 풀이');
  var c2 = prob('A13.compare', { shape: [1, 2], ps: 1, pl: 2, eq: 1, side: 1, i: 0, j: 0, a: 5, b: 50 });    /* 0.50 = 0.5 */
  eq(text(c2).split(' ○')[0] + ' ' + Js(c2, ['=', '>', '<']), '0.50 \\;\\bigcirc\\; 0.5 correct:- wrong:as-whole-numbers wrong:zero-changes-size', '0.50 ○ 0.5');
  var c3 = prob('A13.compare', { shape: [2, 2], ps: 2, pl: 2, eq: 0, side: 0, i: 3, j: 4, a: 86, b: 27 });   /* 3.86 < 4.27 */
  eq(Js(c3, ['<', '>', '=']), 'correct:- wrong:reversed wrong:said-equal', '3.86 ○ 4.27');
  eq(says(c3).split(' | ')[0], '자연수 부분부터 비교해요. 3과 4 가운데 4쪽이 더 커요. 소수점 아래는 볼 필요가 없어요.', '자연수 부분이 다르면 거기서 끝');

  var a1 = prob('A13.add', { px: 1, py: 1, x: 58, y: 17 });                     /* 5.8 + 1.7 = 7.5 */
  eq(Js(a1, ['7.5', '7.50', '6.5', '6.15', '75', '4.1', '0.75', '9.9']), 'correct:- correct-note:- wrong:carry-dropped wrong:sum-after-point wrong:no-point wrong:subtracted wrong:point-shift wrong:-', '5.8 + 1.7 의 답과 실수');
  eq(MH.judge(a1, '6.15').mistake.explain, '소수점 아래끼리 더한 15를 소수점 뒤에 그대로 썼어요. 0.1이 10개 모이면 1이니까, 넘는 만큼은 일의 자리로 올려요.', '합을 소수점 뒤에 그대로 쓴 실수의 설명');
  var a2 = prob('A13.add', { pp: [1, 2], px: 1, py: 2, x: 71, y: 482 });        /* 7.1 + 4.82 = 11.92 */
  eq(Js(a2, ['11.92', '5.53', '1.92']), 'correct:- wrong:right-aligned wrong:carry-dropped', '7.1 + 4.82 의 답과 실수');
  eq(MH.judge(a2, '5.53').mistake.explain, '소수점이 아니라 끝자리를 맞춰 계산했어요. 7.1과 4.82는 자릿수가 달라요. 소수점끼리 맞추고 빈 자리는 0으로 생각해요.', '끝자리를 맞춘 실수의 설명');
  eq(says(a2), '소수점끼리 자리를 맞춰 세로로 써요. 자릿수가 다르니까 7.1은 7.10으로 생각해요(빈 자리는 0). [\\begin{array}{r} 7.10 \\\\ +\\enspace 4.82 \\\\ \\hline \\phantom{0} \\end{array}] | 소수 둘째 자리: 0 + 2 = 2. | 소수 첫째 자리: 1 + 8 = 9. | 일의 자리: 7 + 4 = 11. 1을 쓰고 1을 윗자리로 올려요. | 올린 1은 맨 앞자리에 써요. | 소수점을 같은 자리에 그대로 내려 찍어요. 답은 11.92예요. [\\begin{array}{r} 7.10 \\\\ +\\enspace 4.82 \\\\ \\hline 11.92 \\end{array}]', '자릿수가 다른 덧셈 풀이');
  var a3 = prob('A13.add', { px: 2, py: 2, x: 247, y: 153 });                   /* 2.47 + 1.53 = 4 */
  eq(K.tex(a3.answer) + ' ' + Js(a3, ['4', '4.00', '4.0']), '4 correct:- correct-note:- correct-note:-', '답이 자연수가 되는 덧셈');
  eq(says(a3).split(' | ').slice(-2).join(' | '), '소수점을 같은 자리에 그대로 내려 찍어요. 답은 4.00이에요. [\\begin{array}{r} 2.47 \\\\ +\\enspace 1.53 \\\\ \\hline 4.00 \\end{array}] | 소수점 아래 끝의 0은 생략해요. [4.00 = 4]', '끝의 0 을 생략하는 풀이');

  var s1 = prob('A13.sub', { px: 2, py: 2, x: 931, y: 618 });                   /* 9.31 − 6.18 = 3.13 */
  eq(Js(s1, ['3.13', '3.130', '3.27', '3.23', '15.49', '313', '3.14']), 'correct:- correct-note:- wrong:bigger-minus-smaller wrong:borrow-not-reduced wrong:added wrong:no-point wrong:place-diff', '9.31 − 6.18 의 답과 실수');
  eq(says(s1), '소수점끼리 자리를 맞춰 세로로 써요. [\\begin{array}{r} 9.31 \\\\ -\\enspace 6.18 \\\\ \\hline \\phantom{0} \\end{array}] | 소수 둘째 자리: 1에서 8을 뺄 수 없어요. 윗자리에서 1을 빌려 와 11 − 8 = 3. | 소수 첫째 자리: 아랫자리에 1을 빌려줘서 3이 2가 됐어요. 2 − 1 = 1. | 일의 자리: 9 − 6 = 3. | 소수점을 같은 자리에 그대로 내려 찍어요. 답은 3.13이에요. [\\begin{array}{r} 9.31 \\\\ -\\enspace 6.18 \\\\ \\hline 3.13 \\end{array}]', '받아내림이 있는 뺄셈 풀이');
  var s2 = prob('A13.sub', { pp: [0, 1], px: 0, py: 1, x: 5, y: 3 });           /* 5 − 0.3 = 4.7 */
  eq(Js(s2, ['4.7', '0.2', '5.3', '5.7', '47']), 'correct:- wrong:right-aligned wrong:bigger-minus-smaller wrong:borrow-not-reduced wrong:no-point', '5 − 0.3 의 답과 실수');
  var s3 = prob('A13.sub', { pp: [1, 3], px: 1, py: 3, x: 6, y: 561 });         /* 0.6 − 0.561 = 0.039 */
  eq(K.tex(s3.answer), '0.039', '0.6 − 0.561');
  eq(says(s3).split(' | ').slice(1, 5).join(' | '), '소수 셋째 자리: 0에서 1을 뺄 수 없어요. 윗자리에서 1을 빌려 와 10 − 1 = 9. | 소수 둘째 자리: 0은 빌려줄 수 없어서 윗자리에서 먼저 1을 빌려 와요. 10에서 1을 빌려주고 9가 남아요. 9 − 6 = 3. | 소수 첫째 자리: 아랫자리에 1을 빌려줘서 6이 5가 됐어요. 5 − 5 = 0. | 일의 자리에는 0을 써요.', '0 에서 빌려 오는 뺄셈 풀이');
  done('판정 · 실수 · 풀이 예');
})();
