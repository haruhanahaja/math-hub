/* A16 비와 비율 — 단원 전용 검사.
   화면에 보이는 식과 문제 글을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
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
  var nums = function (s) { return (s.match(/\d+/g) || []).map(B); };
  var suffix = function (p) { var f = MH.types[p.type].answer.suffix; return f ? f(p.v, p.ctx) : ''; };

  group('A16 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var forms = {};
  each('A16.ratio', function (p, pr, level, where) {
    var shown = (pr.tex ? pr.tex + ' / ' : '') + pr.text, cmp = null, base = null, m, form = '';
    if (!ok(/비율을 분수로 쓰세요\.$/.test(pr.text), where + '문제 글 형식 ' + shown)) return;
    if (pr.tex) { m = /^(\d+) : (\d+)$/.exec(pr.tex); if (m) { cmp = B(m[1]); base = B(m[2]); form = '기호'; } }
    else if ((m = /^(\d+)에 대한 (\d+)의 비율을/.exec(pr.text))) { base = B(m[1]); cmp = B(m[2]); form = '에 대한(앞)'; }
    else if ((m = /^(\d+)의 (\d+)에 대한 비율을/.exec(pr.text))) { cmp = B(m[1]); base = B(m[2]); form = '에 대한(뒤)'; }
    else if ((m = /^(\d+)[과와] (\d+)의 비율을/.exec(pr.text))) { cmp = B(m[1]); base = B(m[2]); form = '와'; }
    else if ((m = /^(.+)\. (.+) 수에 대한 (.+) 수의 비율을/.exec(pr.text))) {
      var lead = m[1], count = function (name) { var k = new RegExp(name + ' (\\d+)').exec(lead); return k ? B(k[1]) : null; };
      var all = nums(lead);
      base = /^전체/.test(m[2]) ? (all.length === 2 ? all[0] + all[1] : null) : count(m[2]);
      cmp = count(m[3]);
      form = /^전체/.test(m[2]) ? '상황 · 전체' : cmp === all[0] ? '상황 · 앞' : '상황 · 뒤';
    }
    if (!ok(cmp !== null && base !== null, where + '문제 글을 읽을 수 없음 ' + shown)) return;
    ok(B(p.answer.n) * base === B(p.answer.d) * cmp, where + shown + ' → ' + p.answer.n + '/' + p.answer.d);
    ok(g(B(p.answer.n), B(p.answer.d)) === 1n && cmp % base !== 0n, where + '답은 기약분수이고 자연수가 아님 ' + shown);
    if (level === 0) ok(form === '기호', where + '기호로 쓴 비 ' + shown);
    if (level === 1) ok(/^(에 대한|와)/.test(form), where + '말로 쓴 비 ' + shown);
    if (level === 2) ok(/^상황/.test(form), where + '상황 ' + shown);
    forms[form] = 1;
  });
  eq(Object.keys(forms).sort().join(' | '), '기호 | 상황 · 뒤 | 상황 · 앞 | 상황 · 전체 | 에 대한(뒤) | 에 대한(앞) | 와', '비를 나타내는 여러 가지 말이 모두 나옴');
  done('비율을 분수로');
  each('A16.percent', function (p, pr, level, where) {
    var shown = (pr.tex ? pr.tex + ' / ' : '') + pr.text, a = null, b = null, m;
    if ((m = /^(\d+)\.(\d+)$/.exec(pr.tex || ''))) { a = B(m[1] + m[2]); b = B('1' + m[2].replace(/\d/g, '0')); ok(level === 0 && m[2].slice(-1) !== '0', where + '끝의 0 이 없는 소수 ' + shown); }
    else if ((m = /^\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(pr.tex || ''))) { a = B(m[1]); b = B(m[2]); ok(level === 1 && g(a, b) === 1n, where + '기약분수 ' + shown); }
    else if (!pr.tex) { var k = nums(pr.text); if (k.length === 2) { b = k[0]; a = k[1]; } ok(level === 2 && a < b, where + '전체보다 적은 수 ' + shown); }
    if (!ok(a !== null && /몇 %일까요\?$/.test(pr.text), where + '문제 글 형식 ' + shown)) return;
    ok(B(p.answer) * b === a * 100n, where + shown + ' → ' + p.answer);
    ok(p.answer > 0 && p.answer !== 100 && suffix(p) === '%', where + '답은 100 이 아닌 자연수, 단위는 % ' + shown);
  });
  done('비율을 백분율로');
  var dirs = {};
  each('A16.percent-of', function (p, pr, level, where) {
    var m = /^(\d+)의 (\d+)%는 얼마일까요\?$/.exec(pr.text), total, r, mult;
    if (!ok(!pr.tex, where + '문제 글 형식 ' + pr.text)) return;
    if (m) { total = B(m[1]); r = B(m[2]); mult = r; ok(level < 2 && suffix(p) === '', where + '식만 있는 문제 ' + pr.text); }
    else {
      var k = /(\d+) ?(원|명|mL)/.exec(pr.text), q = /(\d+)%/.exec(pr.text), down = /할인|마셨/.test(pr.text), up = /늘었|올랐/.test(pr.text);
      if (!ok(!!k && !!q && down !== up && level === 2, where + '문장제 형식 ' + pr.text)) return;
      total = B(k[1]); r = B(q[1]); mult = down ? 100n - r : 100n + r;
      ok(suffix(p) === k[2], where + '단위 ' + suffix(p) + ' ' + pr.text);
      dirs[(down ? '줄어듦 ' : '늘어남 ') + k[2]] = 1;
    }
    ok(B(p.answer) * 100n === total * mult, where + pr.text + ' → ' + p.answer);
    ok(r > 0n && r < 100n && p.answer > 1 && p.answer !== 100, where + '0%~100% 사이, 답은 1, 100 이 아님 ' + pr.text);
    if (level === 0) ok([10n, 20n, 25n, 50n, 75n].indexOf(r) >= 0, where + '쉬운 백분율 ' + pr.text);
    if (level === 1) ok([10n, 20n, 25n, 50n, 75n].indexOf(r) < 0, where + '여러 가지 백분율 ' + pr.text);
  });
  eq(Object.keys(dirs).sort().join(' | '), '늘어남 명 | 늘어남 원 | 줄어듦 mL | 줄어듦 원', '할인 · 인상 상황이 모두 나옴');
  done('전체의 몇 %');
  var blanks = {};
  each('A16.proportion', function (p, pr, level, where) {
    var m = /^(\S+) : (\S+) = (\S+) : (\S+)$/.exec(pr.tex || '');
    if (!ok(!!m && pr.text === '□에 알맞은 수를 쓰세요.', where + '문제 글 형식 ' + pr.tex)) return;
    var t = m.slice(1), at = t.indexOf('\\square');
    if (!ok(at >= 0 && t.filter(function (x) { return x === '\\square'; }).length === 1 && t.every(function (x, i) { return i === at || /^\d+$/.test(x); }), where + '빈칸은 하나 ' + pr.tex)) return;
    var v = t.map(function (x, i) { return i === at ? B(p.answer) : B(x); });
    ok(v[0] * v[3] === v[1] * v[2] && p.answer > 0, where + pr.tex + ' → ' + p.answer);
    var scale = v[2] % v[0] === 0n || v[0] % v[2] === 0n;
    if (level === 0) ok(at >= 2 && g(v[0], v[1]) === 1n && v[2] % v[0] === 0n, where + '간단한 비에 같은 수를 곱함 ' + pr.tex);
    if (level === 1) ok(g(v[2], v[3]) === 1n && v[0] % v[2] === 0n, where + '뒤의 비가 간단한 비 ' + pr.tex);
    if (level === 2) ok(!scale, where + '자연수 배가 아님(외항 · 내항의 곱으로 품) ' + pr.tex);
    blanks[level + ':' + at] = 1;
  });
  eq(Object.keys(blanks).sort().join(' '), '0:2 0:3 1:0 1:1 1:2 1:3 2:0 2:1 2:2 2:3', '빈칸의 자리가 고루 나옴');
  done('비례식의 빈칸');
  var units = {};
  each('A16.word', function (p, pr, level, where) {
    var k = nums(pr.text), a = B(p.answer);
    if (!ok(!pr.tex && k.length === 3, where + '문제 글 형식 ' + pr.text)) return;
    if (level === 0) ok(/(\d+) : (\d+)/.test(pr.text) && a * k[0] === k[1] * k[2] && k[2] % k[0] === 0n, where + pr.text + ' → ' + p.answer);
    if (level === 1) ok(a * k[0] === k[1] * k[2] && k[1] % k[0] === 0n && k[2] % k[0] !== 0n, where + pr.text + ' → ' + p.answer);
    if (level === 2) {
      var last = pr.text.split('. ').slice(-1)[0], second = /동생|오후|둘째/.test(last);
      ok(/(\d+) : (\d+)/.test(pr.text) && a * (k[1] + k[2]) === k[0] * (second ? k[2] : k[1]), where + pr.text + ' → ' + p.answer);
      units['배분 ' + (second ? '뒤' : '앞')] = 1;
    }
    ok(p.answer > 0 && pr.text.indexOf('몇 ' + suffix(p)) >= 0 || (suffix(p) === '원' && /얼마/.test(pr.text)), where + '단위 ' + suffix(p) + ' ' + pr.text);
    units[level + suffix(p)] = 1;
  });
  eq(Object.keys(units).sort().join(' '), '0cm 0g 0mL 1L 1m 1원 1쪽 2cm 2개 2원 2쪽 배분 뒤 배분 앞', '여러 상황과 단위가 모두 나옴');
  done('비례식 문장제');

  group('A16 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v, null) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var Js = function (p, raws) { return raws.map(function (r) { return J(p, r); }).join(' '); };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var show = function (p) { var x = MH.types[p.type].prompt(p.v); return (x.tex ? x.tex + ' / ' : '') + (x.text || ''); };
  var E = function (p, raw) { return MH.judge(p, raw).mistake.explain; };

  var r1 = prob('A16.ratio', { form: 1, t: 0, s: 0, x: 6, y: 8 });
  eq(show(r1) + ' # ' + Js(r1, ['3,4', '6,8', '4,3', '6,14', '1,2']), '8에 대한 6의 비율을 분수로 쓰세요. # correct:- correct-note:- wrong:reversed wrong:of-total wrong:-', '8에 대한 6의 비율');
  eq(MH.judge(r1, '6,8').note, '약분하면 $\\frac{3}{4}$이에요.', '약분하지 않은 답의 안내');
  eq(says(r1), "'~에 대한'이 붙은 쪽이 기준량이에요. 기준량은 8, 비교하는 양은 6이에요. | 비율 = 비교하는 양 ÷ 기준량이에요. 기준량 8을 분모에, 비교하는 양 6을 분자에 써요. [6 \\div 8 = \\dfrac{6}{8}] | 분자와 분모를 최대공약수 2로 나누어 약분해요. [\\dfrac{6}{8} = \\dfrac{3}{4}]", '기준량을 찾는 풀이');
  var r2 = prob('A16.ratio', { form: 4, t: 2, s: 0, x: 6, y: 9 });
  eq(show(r2) + ' # ' + Js(r2, ['2,5', '6,15', '6,9', '5,2']), '주머니에 빨간 구슬 6개와 파란 구슬 9개가 있어요. 전체 구슬 수에 대한 빨간 구슬 수의 비율을 분수로 쓰세요. # correct:- correct-note:- wrong:not-total wrong:reversed', '전체에 대한 비율');
  eq(E(r2, '6,9'), '파란 구슬 수 9를 분모로 썼어요. 기준량은 전체 구슬 수예요: 6 + 9 = 15.', '전체를 기준량으로 보지 않은 실수의 설명');
  var r3 = prob('A16.ratio', { form: 0, t: 0, s: 0, x: 3, y: 4 });
  eq(show(r3) + ' # ' + Js(r3, ['3,4', '4,3', '3,7']), '3 : 4 / 비율을 분수로 쓰세요. # correct:- wrong:reversed wrong:of-total', '3 : 4 의 비율');
  eq(E(r3, '4,3'), '기준량과 비교하는 양의 자리를 바꿨어요. 기호 : 의 오른쪽에 있는 수가 기준량이에요. 기준량 4를 분모(아래)에 써요.', '기준량을 바꿔 쓴 실수의 설명');

  var p1 = prob('A16.percent', { k: 0, s: 0, p: 1, b: 10, a: 4 });
  eq(show(p1) + ' # ' + Js(p1, ['40', '4', '400', '41']), '0.4 / 비율을 백분율로 나타내면 몇 %일까요? # correct:- wrong:digits-only wrong:three-places wrong:-', '0.4 를 백분율로');
  eq(says(p1), '비율에 100을 곱해요. 소수점을 오른쪽으로 두 칸 옮겨요. 빈 자리에는 0을 채워요. [0.4 \\times 100 = 40] | 답은 40%예요. [0.4 = 40\\%]', '소수를 백분율로 바꾸는 풀이');
  var p2 = prob('A16.percent', { k: 0, s: 0, p: 2, b: 100, a: 5 });
  eq(show(p2).split(' / ')[0] + ' # ' + Js(p2, ['5', '50']) + ' # ' + E(p2, '50'), '0.05 # correct:- wrong:zero-dropped # 소수 첫째 자리의 0을 빠뜨렸어요. 0.05는 0.01이 5개인 수라서 5%예요.', '0.05 를 50% 로 쓴 실수');
  var p3 = prob('A16.percent', { k: 1, s: 0, b: 4, a: 3 });
  eq(Js(p3, ['75', '3', '34', '25']), 'correct:- wrong:numerator-only wrong:digits-joined wrong:multiplier-only', '3/4 을 백분율로');
  eq(says(p3), '분모를 100으로 만들어요. 분모와 분자에 25를 곱해요. [\\dfrac{3}{4} = \\dfrac{3 \\times 25}{4 \\times 25} = \\dfrac{75}{100}] | 100분의 75는 75%예요. [\\dfrac{3}{4} = 75\\%]', '분수를 백분율로 바꾸는 풀이');
  var p4 = prob('A16.percent', { k: 2, s: 1, b: 40, m: 35, a: 14 });
  eq(show(p4) + ' # ' + Js(p4, ['35', '14', '65']), '문제 40개 가운데 14개를 맞혔어요. 정답률은 몇 %일까요? # correct:- wrong:count-as-percent wrong:complement', '40개 가운데 14개');

  var o1 = prob('A16.percent-of', { q: 0, s: 0, r: 25, h: 4, N: 80 });
  eq(show(o1) + ' # ' + Js(o1, ['20', '2000', '200', '21']), '80의 25%는 얼마일까요? # correct:- wrong:not-divided wrong:divided-by-ten wrong:-', '80 의 25%');
  eq(says(o1), '25%는 100분의 25예요. 약분하면 4분의 1이에요. [25\\% = \\dfrac{25}{100} = \\dfrac{1}{4}] | 80의 4분의 1은 80 ÷ 4 = 20이에요. [80 \\div 4 = 20]', '쉬운 백분율은 분수로 바꿔 푸는 풀이');
  var o2 = prob('A16.percent-of', { q: 0, s: 0, r: 7, N: 300 });
  eq(Js(o2, ['21', '2100', '3', '210']), 'correct:- wrong:not-divided wrong:one-percent wrong:divided-by-ten', '300 의 7%');
  eq(says(o2) + ' # ' + E(o2, '3'), '300의 1%는 300 ÷ 100 = 3이에요. [300 \\div 100 = 3] | 7%는 1%의 7배예요: 3 × 7 = 21. [300 \\times \\dfrac{7}{100} = 21] # 3은 1%의 값이에요. 7%는 그것의 7배예요: 3 × 7 = 21.', '1% 를 거치는 풀이와 1% 만 구한 실수');
  var o3 = prob('A16.percent-of', { q: 1, s: 0, k: 6, r: 30, h: 120, N: 12000 });
  eq(show(o3) + ' # ' + Js(o3, ['8400', '3600', '15600', '11970']), '정가가 12000원인 물건을 30% 할인해서 팔아요. 판매 가격은 얼마일까요? # correct:- wrong:part-only wrong:wrong-direction wrong:percent-as-amount', '30% 할인한 가격');
  eq(says(o3).split(' | ').slice(-1)[0], '할인 금액은 3600이에요. 처음 양에서 빼요: 12000 − 3600 = 8400. 답은 8400원이에요. [12000 - 3600 = 8400]', '할인 문장제 풀이의 마지막');
  eq(E(o3, '3600'), '할인 금액을 답했어요. 묻는 것은 그만큼 줄어든 뒤의 양이에요: 12000 − 3600 = 8400.', '할인 금액만 답한 실수의 설명');

  var q1 = prob('A16.proportion', { p: 3, q: 4, m: 1, n: 3, pos: 2 });
  eq(show(q1).split(' / ')[0] + ' # ' + Js(q1, ['9', '11', '16', '3', '12']), '3 : 4 = \\square : 12 # correct:- wrong:added wrong:crossed wrong:factor-only wrong:copied', '3 : 4 = □ : 12');
  eq(says(q1), '후항끼리 비교해요. 4에 3을 곱하면 12가 돼요. [4 \\times 3 = 12] | 전항에도 똑같이 3을 곱해요: 3 × 3 = 9. [3 : 4 = 9 : 12]', '같은 수를 곱하는 풀이');
  eq(E(q1, '11'), '4와 12의 차이만큼 더했어요. 비는 더하거나 빼면 달라져요. 같은 수를 곱하거나 같은 수로 나눠야 해요.', '차이만큼 더한 실수의 설명');
  var q2 = prob('A16.proportion', { p: 2, q: 3, m: 6, n: 1, pos: 3 });
  eq(show(q2).split(' / ')[0] + ' # ' + Js(q2, ['3', '6', '8']), '12 : 18 = 2 : \\square # correct:- wrong:factor-only wrong:added', '12 : 18 = 2 : □');
  eq(says(q2) + ' # ' + E(q2, '6'), '전항끼리 비교해요. 12를 6으로 나누면 2가 돼요. [12 \\div 6 = 2] | 후항도 똑같이 6으로 나눠요: 18 ÷ 6 = 3. [12 : 18 = 2 : 3] # 6은 나눈 수예요. □에는 18을 6으로 나눈 수를 써요.', '같은 수로 나누는 풀이와 나눈 수만 쓴 실수');
  var q3 = prob('A16.proportion', { p: 2, q: 3, m: 3, n: 4, pos: 3 });
  eq(says(q3), '외항의 곱과 내항의 곱은 같아요. □가 없는 내항의 곱을 먼저 구해요. [9 \\times 8 = 72] | □ × 6도 72가 돼야 해요. 72 ÷ 6 = 12. [\\square = 72 \\div 6 = 12] | 답은 12예요. [6 : 9 = 8 : 12]', '외항의 곱 = 내항의 곱으로 푸는 풀이');

  var w1 = prob('A16.word', { k: 0, s: 1, w: 0, u: 1, p: 4, q: 3, n: 5 });
  eq(show(w1) + ' # ' + Js(w1, ['15', '19', '5', '20']), '가로와 세로의 비가 4 : 3인 직사각형 모양 사진이 있어요. 가로가 20 cm이면 세로는 몇 cm일까요? # correct:- wrong:added wrong:factor-only wrong:-', '가로 : 세로 = 4 : 3');
  var w2 = prob('A16.word', { k: 1, s: 0, w: 0, q: 1, p: 3, n: 5, u: 4 });
  eq(show(w2) + ' # ' + Js(w2, ['2000', '400', '6000']), '사과 3개의 값이 1200원이에요. 같은 사과 5개의 값은 얼마일까요? # correct:- wrong:unit-only wrong:not-divided', '사과 3개에 1200원');
  eq(says(w2), '1개에 해당하는 양을 구해요: 1200 ÷ 3 = 400. [1200 \\div 3 = 400] | 거기에 5를 곱해요: 400 × 5 = 2000. 답은 2000원이에요. [400 \\times 5 = 2000] | 비례식으로 확인해요. 외항의 곱과 내항의 곱이 같아요. [3 : 1200 = 5 : 2000]', '하나의 값을 거치는 풀이');
  var w3 = prob('A16.word', { k: 2, s: 0, w: 1, u: 1, p: 3, q: 2, n: 4 });
  eq(show(w3) + ' # ' + Js(w3, ['8', '12', '4', '10']), '사탕 20개를 형과 동생이 3 : 2의 비로 나누어 가져요. 동생은 몇 개를 가질까요? # correct:- wrong:other-share wrong:one-bundle wrong:divided-by-own', '20개를 3 : 2 로 나누기');
  eq(says(w3), '전체를 3 + 2 = 5묶음으로 나눈다고 생각해요. [3 + 2 = 5] | 한 묶음은 20 ÷ 5 = 4예요. [20 \\div 5 = 4] | 동생은 2묶음이에요: 4 × 2 = 8. 답은 8개예요. [20 \\times \\dfrac{2}{5} = 8]', '비례배분 풀이');
  eq(E(w3, '10'), '전체를 2로 나눴어요. 전체는 3 + 2 = 5묶음이에요. 먼저 5로 나누고 2를 곱해요.', '전체를 자기 비로 나눈 실수의 설명');
  done('판정 · 실수 · 풀이 예');
})();
