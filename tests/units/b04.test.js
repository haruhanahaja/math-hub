/* B04 정수와 유리수의 곱셈·나눗셈 — 단원 전용 검사.
   화면에 보이는 식(KaTeX 글)을 여기서 따로 만든 계산기(BigInt 분수)로 다시 읽어 답을 확인한다. 엔진의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, SG = MH.kinds.signed, RA = MH.kinds.rational;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  /* ── 식 읽기: 덧셈 · 뺄셈 < 곱셈 · 나눗셈 < 앞에 붙은 부호 < 거듭제곱 < 괄호 · 수 ── */
  var gcd = function (a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { var t = a % b; a = b; b = t; } return a; };
  var Q = function (n, d) { if (d < 0n) { n = -n; d = -d; } var g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
  var calc = function (tex) {
    var s = tex.replace(/\\left|\\right/g, '').replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, '($1/$2)').replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\^\{(\d+)\}/g, '^$1').replace(/\s/g, '');
    var i = 0;
    var atom = function () {
      if (s[i] === '(') { i++; var x = expr(); if (s[i] !== ')') throw new Error('괄호 ' + tex); i++; return x; }
      var m = /^(\d+)(?:\.(\d+))?/.exec(s.slice(i));
      if (!m) throw new Error('수가 와야 함 ' + tex + ' @' + i);
      i += m[0].length;
      return Q(BigInt(m[1] + (m[2] || '')), 10n ** BigInt((m[2] || '').length));
    };
    var power = function () {
      var x = atom();
      if (s[i] !== '^') return x;
      var m = /^\^(\d+)/.exec(s.slice(i)); i += m[0].length;
      return Q(x.n ** BigInt(m[1]), x.d ** BigInt(m[1]));
    };
    var unary = function () { if (s[i] === '-') { i++; var x = unary(); return Q(-x.n, x.d); } if (s[i] === '+') { i++; return unary(); } return power(); };
    var term = function () {
      var x = unary();
      while (s[i] === '*' || s[i] === '/') { var op = s[i++], y = unary(); if (op === '/' && y.n === 0n) throw new Error('0 으로 나눔'); x = op === '*' ? Q(x.n * y.n, x.d * y.d) : Q(x.n * y.d, x.d * y.n); }
      return x;
    };
    var expr = function () {
      var x = term();
      while (s[i] === '+' || s[i] === '-') { var op = s[i++], y = term(); x = Q(op === '+' ? x.n * y.d + y.n * x.d : x.n * y.d - y.n * x.d, x.d * y.d); }
      return x;
    };
    var out = expr();
    if (i !== s.length) throw new Error('읽다 만 식 ' + tex + ' @' + i);
    return out;
  };
  var same = function (x, answer) {
    var a = answer.d !== undefined ? Q(BigInt(answer.n), BigInt(answer.d)) : Q(BigInt(answer.n), 10n ** BigInt(answer.p));
    return x.n === a.n && x.d === a.d;
  };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx);
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
  };

  group('B04 — 계산기 자체 검사');
  var C = function (t) { var x = calc(t); return x.n + '/' + x.d; };
  eq([C('2 + 3 \\times 4'), C('-3^{2}'), C('(-3)^{2}'), C('-(-2)^{3}'), C('(-12) \\div (+3) - (-2) \\times 5'), C('\\left(-\\dfrac{2}{3}\\right) \\div \\left(+\\dfrac{4}{9}\\right)'), C('(-0.5) \\times (+0.4)'), C('(3 - 7) \\times (-2)')].join(' '),
    '14/1 -9/1 9/1 8/1 6/1 -3/2 -1/5 8/1', '순서 · 부호 · 거듭제곱 · 분수 · 소수');
  done('식 읽기');

  group('B04 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var NUM = '\\(([+-])(\\d+(?:\\.\\d)?)\\)';
  [['B04.mul', '\\times'], ['B04.div', '\\div']].forEach(function (t) {
    var re = new RegExp('^' + NUM + ' \\' + t[1] + ' ' + NUM + '$'), kinds = {};
    each(t[0], function (p, pr, level, where) {
      var m = re.exec(pr.tex);
      if (!ok(!!m, where + '식의 형식 ' + pr.tex)) return;
      ok(same(calc(pr.tex), p.answer), where + pr.tex + ' → ' + SG.tex(p.answer));
      ok(!(m[1] === '+' && m[3] === '+'), where + '음수가 하나는 있음 ' + pr.tex);
      ok((level === 2) === (/\./.test(pr.tex) || p.answer.p > 0), where + '소수는 마지막 단계에만 ' + pr.tex);
      ok((p.answer.n < 0) === (m[1] !== m[3]), where + '부호 규칙 ' + pr.tex);
      if (t[0] === 'B04.div') ok(!/\./.test(m[4]) && Number(m[4]) >= 2, where + '나누는 수는 2 이상의 정수 ' + pr.tex);
      kinds[m[1] + m[3]] = 1;
      detailed(t[0], p, where);
    });
    eq(Object.keys(kinds).sort().join(' '), '+- -+ --', t[0] + ' 부호의 짝');
    done(MH.types[t[0]].title);
  });
  var shapes = {};
  each('B04.frac', function (p, pr, level, where) {
    ok(same(calc(pr.tex), p.answer), where + pr.tex + ' → ' + RA.tex(p.answer));
    ok(MH.gcd(p.answer.n, p.answer.d) === 1 && p.answer.d > 1 && p.answer.n !== 0, where + '답은 0 도 정수도 아닌 기약분수 ' + RA.tex(p.answer));
    var opList = pr.tex.match(/\\times|\\div/g) || [], ops = opList.join('');
    ok(level === 0 ? ops === '\\times' : level === 1 ? ops === '\\div' : /div/.test(ops) && opList.length === 2, where + '연산의 꼴 ' + pr.tex);
    ok(/-/.test(pr.tex), where + '음수가 하나는 있음 ' + pr.tex);
    eq(MH.judge(p, (p.answer.n * 3) + ',' + (p.answer.d * 3)).verdict, 'correct-note', where + '약분하지 않은 답');
    shapes[level + (/\(([+-])\d+\)/.test(pr.tex) ? '정수' : '')] = 1;
    detailed('B04.frac', p, where);
  });
  eq(Object.keys(shapes).sort().join(' '), '0 1 2 2정수', '세 수의 식에는 정수도 섞임');
  done('분수의 곱셈과 나눗셈');
  var forms = {};
  each('B04.pow', function (p, pr, level, where) {
    ok(same(calc(pr.tex), p.answer), where + pr.tex + ' → ' + SG.tex(p.answer));
    ok(/\^\{\d\}/.test(pr.tex) && (level === 2) === /\\times/.test(pr.tex), where + '식의 꼴 ' + pr.tex);
    ok(Math.abs(p.answer.n) <= 400 && p.answer.p === 0, where + '답의 크기 ' + p.answer.n);
    forms[level + (/^-\(/.test(pr.tex) ? '-(' : /^-/.test(pr.tex) ? '-' : '(')] = 1;
    detailed('B04.pow', p, where);
  });
  eq(Object.keys(forms).sort().join(' '), '0( 1( 1- 1-( 2( 2- 2-(', '단계마다 나오는 꼴');
  done('음수의 거듭제곱');
  var has = {};
  each('B04.mixed', function (p, pr, level, where) {
    ok(same(calc(pr.tex), p.answer), where + pr.tex + ' → ' + SG.tex(p.answer));
    ok(/\\times|\\div/.test(pr.tex) && / [+-] /.test(pr.tex), where + '곱셈 · 나눗셈과 덧셈 · 뺄셈이 섞임 ' + pr.tex);
    var pow = /\^/.test(pr.tex), grp = /\(-?\d+ [+-] \d+\)/.test(pr.tex);
    ok(level === 0 ? !pow && !grp : level === 1 ? !pow && grp : pow, where + '단계의 꼴 ' + pr.tex);
    ok(/-/.test(pr.tex) && Math.abs(p.answer.n) <= 150, where + '음수가 있고 답이 크지 않음 ' + pr.tex);
    /* 풀이의 각 줄도 계산기로 확인한다: '식 = 값' 꼴은 양쪽이 같아야 하고, 식을 다시 쓴 줄은 값이 답과 같아야 한다 */
    MH.types['B04.mixed'].steps(p.v).forEach(function (s) {
      if (!s.tex) return;
      s.tex.split(',\\quad ').forEach(function (part) {
        var side = part.split(' = ');
        if (side.length === 2) { var l = calc(side[0]), r = calc(side[1]); ok(l.n === r.n && l.d === r.d, where + '풀이의 줄이 틀림 ' + part); }
        else ok(same(calc(part), p.answer), where + '다시 쓴 식의 값이 답과 다름 ' + part);
      });
    });
    if (/^-\d+\^/.test(pr.tex)) has.lead = 1;
    if (/\\div \(-?\d+ [+-]/.test(pr.tex)) has.divGroup = 1;
    if (p.answer.n === 0) has.zero = 1;
    detailed('B04.mixed', p, where);
  });
  ok(has.lead && has.divGroup, '맨 앞에 −를 쓴 거듭제곱, 괄호 묶음으로 나누는 식도 나옴');
  done('사칙 혼합 계산');

  group('B04 — 흔한 실수와 풀이 · 힌트의 구체적인 예');
  var prob = function (type, v, answer) { return { type: type, v: v, ctx: null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var E = function (p, raw) { return MH.judge(p, raw).mistake.explain; };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var H = function (p) { return MH.types[p.type].hints(p.v); };
  var mu = prob('B04.mul', { s: [-1, 1], m: { x: 6, pa: 0, y: 4, pb: 0 } }, { n: -24, p: 0 }), mm = prob('B04.mul', { s: [-1, -1], m: { x: 25, pa: 1, y: 4, pb: 1 } }, { n: 1, p: 0 });
  eq([J(mu, '-24'), J(mu, '24'), J(mu, '-2'), J(mu, '-10')].join(' '), 'correct:- wrong:wrong-sign wrong:added wrong:-', '(−6) × (+4)');
  eq(MH.kinds.signed.tex(MH.types['B04.mul'].solve(mm.v)) + ' ' + J(mm, '1') + ' ' + J(mm, '1.00') + ' ' + J(mm, '-1'), '1 correct:- correct:- wrong:wrong-sign', '(−2.5) × (−0.4) = 1 (끝의 0 은 덜어 낸다)');
  eq(H(mm)[2], '2.5 × 0.4는 소수점이 없다고 보고 25 × 4를 계산한 다음, 소수점 아래가 두 자리가 되게 점을 찍어요. 답은 그 숫자 앞에 부호 +를 붙인 수예요(+는 쓰지 않아도 돼요).', '소수 곱셈의 마지막 힌트');
  eq(H(mu)[1], '차례는 두 가지예요. ① 부호를 먼저 정해요: 두 수의 부호가 같으면 +, 다르면 −. 이 문제는 (−6)과 (+4)라서 부호가 달라요. ② 부호를 떼고 숫자끼리 곱해요: 6 × 4.', '곱셈의 둘째 힌트');
  eq(says(mu), '두 수의 부호가 달라요. 곱의 부호는 −예요. | 부호를 떼고 숫자끼리 곱해요. [6 \\times 4 = 24] | 부호 −를 붙여요. 답은 −24예요. [(-6) \\times (+4) = -24]', '곱셈의 풀이');
  var dv = prob('B04.div', { s: [-1, 1], m: { x: 171, px: 1, y: 9, q: 19, pq: 1 } }, { n: -19, p: 1 });
  eq([J(dv, '-1.9'), J(dv, '1.9'), J(dv, '-19'), J(dv, '-2')].join(' '), 'correct:- wrong:wrong-sign wrong:point wrong:-', '(−17.1) ÷ (+9)');
  eq(says(dv).split(' | ')[1], '부호를 떼고 숫자끼리 나눠요. [17.1 \\div 9 = 1.9]', '나눗셈 풀이의 둘째 줄');

  var fr = prob('B04.frac', { q: { t: [[6, 5], [-9, 2]], ops: ['÷'] } }, { n: -4, d: 15 });
  eq([J(fr, '-4,15'), J(fr, '-12,45'), J(fr, '4,15'), J(fr, '-27,5'), J(fr, '-54,10')].join(' '), 'correct:- correct-note:- wrong:wrong-sign wrong:not-flipped wrong:not-flipped', '(+6/5) ÷ (−9/2)');
  eq(says(fr), '나눗셈을 곱셈으로 바꿔요. ÷ 뒤의 수를 역수로 써요(부호는 그대로). [\\left(+\\dfrac{6}{5}\\right) \\times \\left(-\\dfrac{2}{9}\\right)] | 음수가 한 개(홀수 개)라서 답의 부호는 −예요. | 부호를 떼고 분자끼리, 분모끼리 곱해요. 분자와 분모를 3으로 나누어 약분해요. [\\dfrac{6 \\times 2}{5 \\times 9} = \\dfrac{12}{45} = \\dfrac{4}{15}] | 부호 −를 붙이면 답이에요. [-\\dfrac{4}{15}]', '분수 나눗셈의 풀이');
  var f3 = prob('B04.frac', { q: { t: [[9, 8], [-3, 4], [-3, 1]], ops: ['×', '÷'] } }, { n: 9, d: 32 });
  eq(MH.types['B04.frac'].prompt(f3.v).tex, '\\left(+\\dfrac{9}{8}\\right) \\times \\left(-\\dfrac{3}{4}\\right) \\div (-3)', '정수가 섞인 식의 모양');
  eq(H(f3)[1] + ' | ' + H(f3)[2].split(' 곱하기 전에')[0], '부호를 먼저 정해요. 곱하는 수 가운데 음수가 짝수 개이면 +, 홀수 개이면 −예요(음수 둘이 만나면 +가 되니까요). 이 식에는 음수가 두 개 있어요. | 이제 부호를 떼고 분자는 분자끼리, 분모는 분모끼리 곱해요: $\\frac{9}{8} \\times \\frac{3}{4} \\times \\frac{1}{3}$.', '세 수의 힌트');

  var p1 = prob('B04.pow', { q: { f: [{ k: 'in', a: 2, n: 4 }] } }, { n: 16, p: 0 }), p2 = prob('B04.pow', { q: { f: [{ k: 'out', a: 3, n: 2 }] } }, { n: -9, p: 0 });
  var p3 = prob('B04.pow', { q: { f: [{ k: 'negin', a: 2, n: 3 }] } }, { n: 8, p: 0 }), p4 = prob('B04.pow', { q: { f: [{ k: 'out', a: 2, n: 3 }, { k: 'pos', a: 3, n: 2 }] } }, { n: -72, p: 0 });
  eq([J(p1, '16'), J(p1, '-16'), J(p1, '8'), J(p1, '-8')].join(' '), 'correct:- wrong:paren-mixup wrong:times wrong:-', '(−2)⁴');
  eq([J(p2, '-9'), J(p2, '9'), J(p2, '-6')].join(' '), 'correct:- wrong:paren-mixup wrong:times', '−3²');
  eq([J(p3, '8'), J(p3, '-8'), J(p3, '6')].join(' '), 'correct:- wrong:wrong-sign wrong:times', '−(−2)³');
  eq(J(p4, '-72') + ' ' + J(p4, '72'), 'correct:- wrong:wrong-sign', '−2³ × 3²');
  eq(E(p2, '9'), '괄호를 거꾸로 읽었어요. $-3^{2}$은 괄호가 없으니 3만 두 번 곱하고, 그 앞에 −를 붙여요. 지수가 짝수여도 −는 곱하지 않았으니 답은 음수예요.', '괄호를 거꾸로 읽은 실수의 설명');
  eq(E(p1, '8'), '밑과 지수를 곱했어요(2 × 4). 지수 4는 곱하는 횟수예요. 2를 네 번 곱해야 해요: $2 \\times 2 \\times 2 \\times 2$.', '밑과 지수를 곱한 실수의 설명');
  eq(says(p3), '거듭제곱을 곱셈으로 풀어 써요. 먼저 (−2)를 세 번 곱한 다음, 맨 앞의 −로 그 부호를 한 번 더 뒤집어요. [-(-2)^{3} = -\\{(-2) \\times (-2) \\times (-2)\\}] | 음수를 세 번(홀수 번) 곱하면 부호가 −이고, 그것을 뒤집으니 +예요. 답은 8이에요. [-\\{(-2) \\times (-2) \\times (-2)\\} = 8]', '−(−2)³ 의 풀이');
  eq(says(p4), '괄호가 없으니 2만 세 번 곱하고, 그 앞에 −를 붙여요. 그래서 답은 음수예요. [-2^{3} = -(2 \\times 2 \\times 2) = -8] | 3을 두 번 곱한 양수예요. [3^{2} = 3 \\times 3 = 9] | 두 값을 곱해요. 두 수의 부호가 달라요. 곱의 부호는 −예요. [(-8) \\times (+9) = -72]', '거듭제곱의 곱의 풀이');
  eq(H(p1)[1], '풀어 쓰면 이래요. $(-2)^{4} = (-2) \\times (-2) \\times (-2) \\times (-2)$. 음수를 짝수 번 곱하면 +, 홀수 번 곱하면 −가 돼요.', '거듭제곱의 둘째 힌트');

  var m0 = prob('B04.mixed', { q: { terms: [{ sg: 1, f: [{ n: -3 }], ops: [] }, { sg: 1, f: [{ n: 4 }, { n: -2 }], ops: ['×'] }] } }, { n: -11, p: 0 });
  var m2 = prob('B04.mixed', { q: { terms: [{ sg: -1, f: [{ pow: [3, 2] }], ops: [] }, { sg: -1, f: [{ n: -12 }, { sum: [-1, '-', 3] }], ops: ['÷'] }] } }, { n: -12, p: 0 });
  var m3 = prob('B04.mixed', { q: { terms: [{ sg: 1, f: [{ pow: [-2, 2] }, { n: 3 }], ops: ['×'] }, { sg: -1, f: [{ n: 10 }, { n: -5 }], ops: ['÷'] }] } }, { n: 14, p: 0 });
  eq(MH.types['B04.mixed'].prompt(m0.v).tex + ' / ' + MH.types['B04.mixed'].prompt(m2.v).tex + ' / ' + MH.types['B04.mixed'].prompt(m3.v).tex,
    '(-3) + 4 \\times (-2) / -3^{2} - (-12) \\div (-1 - 3) / (-2)^{2} \\times 3 - 10 \\div (-5)', '섞인 식의 모양');
  eq([J(m0, '-11'), J(m0, '-2'), J(m0, '11'), J(m0, '5')].join(' '), 'correct:- wrong:left-to-right wrong:wrong-sign wrong:-', '(−3) + 4 × (−2)');
  eq([J(m2, '-12'), J(m2, '6'), J(m2, '12')].join(' '), 'correct:- wrong:pow-paren wrong:wrong-sign', '−3² − (−12) ÷ (−1 − 3)');
  eq([J(m3, '14'), J(m3, '-10'), J(m3, '-14')].join(' '), 'correct:- wrong:pow-paren wrong:wrong-sign', '(−2)² × 3 − 10 ÷ (−5)');
  eq(E(m0, '-2'), '앞에서부터 차례로 계산했어요. 곱셈과 나눗셈은 덧셈 · 뺄셈보다 먼저 해요. $4 \\times (-2)$부터 계산해요.', '순서를 무시한 실수의 설명');
  eq(E(m2, '6'), '거듭제곱의 부호를 잘못 정했어요. $-3^{2}$은 괄호가 없으니 3만 두 번 곱한 뒤 −를 붙여요. 그래서 음수예요.', '맨 앞 거듭제곱의 실수 설명');
  eq(says(m2), '거듭제곱을 먼저 계산해요. 맨 앞의 −는 거듭제곱을 한 다음에 붙여요. [3^{2} = 9] | 괄호로 묶은 부분을 계산해요. [(-1 - 3) = -4] | 구한 값을 넣어 식을 다시 써요. [-9 - (-12) \\div (-4)] | 곱셈과 나눗셈을 계산해요. 부호가 같으면 +, 다르면 −예요. [(-12) \\div (-4) = 3] | 남은 뺄셈은 빼는 수의 부호를 바꿔 더해요: (−9) + (−3). 답은 −12예요. [-9 - 3 = -12]', '거듭제곱 · 괄호가 있는 식의 풀이');
  eq(H(m0)[1], '이 식에는 거듭제곱도 괄호 묶음도 없어요(음수 하나를 감싼 괄호는 묶음이 아니에요). 그래서 곱셈 · 나눗셈인 $4 \\times (-2)$ 부분부터 계산해요. 두 수를 곱하거나 나눌 때는 부호가 같으면 +, 다르면 −예요.', '첫 단계의 둘째 힌트');
  eq(H(m2)[1], '이 식에서 가장 먼저 계산할 곳은 거듭제곱 $-3^{2}$, 괄호 묶음 $(-1 - 3)$ 부분이에요. $-3^{2}$은 괄호가 없으니 3만 두 번 곱한 뒤 앞에 −를 붙여요. 그다음 $(-12) \\div (-1 - 3)$ 부분을 계산해요. 두 수를 곱하거나 나눌 때는 부호가 같으면 +, 다르면 −예요.', '거듭제곱 · 괄호가 있는 식의 둘째 힌트');
  done('실수 · 풀이 · 힌트 예');
})();
