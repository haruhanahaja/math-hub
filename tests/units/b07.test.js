/* B07 일차방정식 — 단원 전용 검사.
   화면에 보이는 방정식을 tests/algcalc.js 의 계산기(BigInt 분수)로 다시 읽는다. 문자에 0 과 1 을 넣어 본 값으로 해를 따로 구해 답과 견준다. 엔진의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, Q = ALG.Q, calc = ALG.calc, noJosa = ALG.noJosa;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var big = function (n) { return BigInt(n); };
  var gcdB = function (a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { var t = a % b; a = b; b = t; } return a; };
  var norm = function (n, d) { if (d < 0n) { n = -n; d = -d; } var g = gcdB(n, d) || 1n; return { n: n / g, d: d / g }; };
  var sub = function (a, b) { return norm(a.n * b.d - b.n * a.d, a.d * b.d); };
  var same = function (a, b) { return a.n * b.d === b.n * a.d; };
  /** 식 'L = R' 의 (왼쪽 − 오른쪽) 에 문자 값 x 를 넣은 값 */
  var gap = function (tex, letter, x) { var s = tex.split(' = '), env = {}; env[letter] = x; return sub(calc(s[0], env), calc(s[1], env)); };
  /** 일차방정식의 해: f(x) = 왼쪽 − 오른쪽 이 일차식이므로 f(0), f(1) 로 구한다. 해가 하나가 아니면 null */
  var root = function (tex, letter) {
    var f0 = gap(tex, letter, Q(0n, 1n)), f1 = gap(tex, letter, Q(1n, 1n)), slope = sub(f1, f0);
    if (slope.n === 0n) return null;
    var r = norm(-f0.n * slope.d, f0.d * slope.n), f2 = gap(tex, letter, Q(2n, 1n));
    return same(sub(f2, f1), slope) ? r : null;   /* 일차식인지도 확인 */
  };
  var holds = function (tex, letter, r) { var s = tex.split(' = '), env = {}; env[letter] = r; var v = s.map(function (t) { return calc(t, env); }); return v.every(function (y) { return same(y, v[0]); }); };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx);
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    if (p.seed <= 80) noJosa(h.concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.types[id].mistakes.map(function (m) { return m.wrong(p.v) ? m.explain(p.v) : ''; })), where);
  };

  group('B07 — 계산기로 해 구하기 자체 검사');
  var show = function (r) { return r ? r.n + '/' + r.d : 'null'; };
  eq([show(root('2x + 1 = 7', 'x')), show(root('\\dfrac{x + 1}{2} = \\dfrac{x - 3}{3} + 1', 'x')), show(root('0.3a + 0.5 = 2', 'a')), show(root('3(y - 2) = y + 4', 'y')), show(root('2x + 1 = 2x + 3', 'x')), show(root('3x + 1 = 6', 'x'))].join(' '),
    '3/1 -3/1 5/1 5/1 null 5/3', '해 구하기');
  done('해 구하기');

  group('B07 — 방정식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var solveType = function (id, form) {
    var seen = {};
    each(id, function (p, pr, level, where) {
      var m = /^방정식을 풀어 \$([a-z])\$의 값을 구하세요\.$/.exec(pr.text), a = p.answer, rational = MH.types[id].answer.kind === 'rational';
      ok(!!m && pr.tex.split(' = ').length === 2 && pr.tex.indexOf(m ? m[1] : '?') >= 0, where + '문제의 모양 ' + pr.tex + ' ' + pr.text);
      if (!m) return;
      var r = root(pr.tex, m[1]), mine = rational ? norm(big(a.n), big(a.d)) : norm(big(a.n), 1n);
      ok(!!r && same(r, mine), where + pr.tex + ' 의 해 ' + show(r) + ' ≠ 답 ' + JSON.stringify(a));
      ok(rational ? a.d >= 1 && gcdB(big(a.n), big(a.d)) === 1n && a.n !== 0 : a.p === 0 && Number.isInteger(a.n) && a.n !== 0, where + '답의 꼴 ' + JSON.stringify(a));
      MH.types[id].steps(p.v).forEach(function (s) { if (s.tex) ok(holds(s.tex, m[1], mine), where + '풀이의 식이 해에서 성립하지 않음 ' + s.tex); });
      var f = form(pr.tex, level, a, m[1]);
      ok(f !== false, where + '단계의 꼴 ' + pr.tex);
      seen[level + ':' + f] = 1;
      detailed(id, p, where);
    });
    return Object.keys(seen).sort().join(' ');
  };
  var count = function (t, re) { return (t.match(re) || []).length; };
  eq(solveType('B07.basic', function (t, level) {
    var f = /dfrac/.test(t) ? (/[+-] \d/.test(t) ? 'divtwo' : 'div') : /^-?\d*[a-z] = /.test(t) ? 'mul' : /^(-?\d+[a-z]) [+-] \d+ = /.test(t) ? 'two' : /^([a-z] [+-] \d+|\d+ \+ [a-z]) = /.test(t) ? 'add' : null;
    return f && (level === 0 ? f === 'add' : level === 1 ? f === 'mul' || f === 'div' : f === 'two' || f === 'divtwo') ? f : false;
  }), '0:add 1:div 1:mul 2:divtwo 2:two', '등식의 성질로 풀기: 단계마다 나오는 꼴');
  done('등식의 성질로 풀기');
  eq(solveType('B07.move', function (t, level, a, x) {
    var s = t.split(' = '), both = s[0].indexOf(x) >= 0 && s[1].indexOf(x) >= 0, n = count(t, /[+-] /g) + 2 - (0);
    if (/[(\\.]/.test(t) || !both) return false;
    return level === 0 ? (n === 3 ? 'x' : false) : level === 1 ? (n === 4 ? 'xc' : false) : (n >= 5 ? 'many' : false);
  }), '0:x 1:xc 2:many', '이항해서 풀기: 단계마다 나오는 꼴');
  done('이항해서 풀기');
  eq(solveType('B07.paren', function (t, level) {
    var g = count(t, /\(/g);
    return /[\\.]/.test(t) ? false : level === 2 ? (g === 2 ? 'two' : false) : g === 1 ? (level === 0 ? (/^-?\d\([^)]*\) = -?\d+$/.test(t) ? 'one' : false) : 'one+') : false;
  }), '0:one 1:one+ 2:two', '괄호가 있는 방정식: 단계마다 나오는 꼴');
  done('괄호가 있는 방정식');
  eq(solveType('B07.frac', function (t, level, a) {
    var dec = /\d\.\d/.test(t), fr = /dfrac/.test(t), numer = /dfrac\{[^}]* [+-] /.test(t);
    if (level < 3 && a.d !== 1) return false;
    return level === 0 ? (dec && !fr ? 'dec' : false) : level === 1 ? (fr && !dec && !numer ? 'fr' : false) : level === 2 ? (numer && !dec ? 'numer' : false) : (!dec && !fr && a.d > 1 ? 'sol' : false);
  }), '0:dec 1:fr 2:numer 3:sol', '계수가 소수 · 분수인 방정식: 단계마다 나오는 꼴');
  done('계수가 소수 · 분수인 방정식');

  each('B07.shift', function (p, pr, level, where) {
    var x = /[a-z]/.exec(pr.tex)[0], r = root(pr.tex, x), opts = MH.optionsOf(p);
    ok(!!r && r.n !== 0n, where + '해가 하나가 아님 ' + pr.tex);
    ok(opts.length === 4 && opts.every(function (o, k) { return opts.indexOf(o) === k; }) && opts.indexOf(p.answer) >= 0, where + '보기는 서로 다른 네 개 ' + opts.join(' , '));
    opts.forEach(function (o) {
      var j = MH.judge(p, o), s = o.split(' = ');
      ok(holds(o, x, r) === (o === p.answer), where + '보기 ' + o + ' 의 참 · 거짓 (식 ' + pr.tex + ')');
      if (o === p.answer) {
        ok(j.verdict === 'correct', where + '정답 보기가 정답으로 판정되지 않음');
        ok(s[0].indexOf(x) >= 0 && s[1].indexOf(x) < 0 && !/^-?\d+$/.test(s[0]), where + '정답은 문자가 왼쪽, 수가 오른쪽 ' + o);
      } else ok(j.verdict === 'wrong' && j.mistake && j.mistake.explain.length >= 30, where + '틀린 보기에 설명이 없음 ' + o);
    });
    var s0 = pr.tex.split(' = '), lc = /[+-] \d+$/.test(s0[0]), rx = s0[1].indexOf(x) >= 0;
    ok(level === 0 ? lc && !rx : level === 1 ? !lc && rx : lc && rx, where + '단계의 꼴 ' + pr.tex);
    var h = MH.types['B07.shift'].hints(p.v);
    ok(h.join(' ').indexOf(p.answer) < 0, where + '힌트가 정답 보기를 그대로 말함');
    detailed('B07.shift', p, where);
  });
  done('이항');

  group('B07 — 흔한 실수와 풀이 · 힌트의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var EX = function (p, raw) { return MH.judge(p, raw).mistake.explain; };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var T = function (p) { return MH.types[p.type].prompt(p.v).tex; };
  var H = function (p) { return MH.types[p.type].hints(p.v); };
  var O = [0, 1, 2, 3];
  var b1 = prob('B07.basic', { q: { k: 'add', x: 'x', a: 3, b: 5 } }), b2 = prob('B07.basic', { q: { k: 'mul', x: 'x', a: -3, b: 12 } }), b3 = prob('B07.basic', { q: { k: 'two', x: 'x', a: 2, b: 4, c: 10 } });
  var b4 = prob('B07.basic', { q: { k: 'div', x: 'a', a: 3, b: -6 } });
  eq(T(b1) + ' / ' + [J(b1, '2'), J(b1, '8'), J(b1, '-2')].join(' '), 'x + 3 = 5 / correct:- wrong:same-op wrong:sign', 'x + 3 = 5');
  eq(says(b1), '양쪽에서 3을 빼요. [x + 3 - 3 = 5 - 3] | 오른쪽을 계산하면 해가 나와요. [x = 2]', '더해진 수를 없애는 풀이');
  eq(EX(b1, '8'), '반대 계산을 해야 하는데 같은 계산을 했어요. 왼쪽에서 3이 더해져 있으니 양쪽에서 3을 빼야 해요.', '같은 계산을 한 실수의 설명');
  eq(T(b2) + ' / ' + [J(b2, '-4'), J(b2, '-36'), J(b2, '15'), J(b2, '4')].join(' '), '-3x = 12 / correct:- wrong:times wrong:minus wrong:sign', '−3x = 12');
  eq(says(b2), '양쪽을 문자 앞의 수 $-3$으로 나눠요. [\\dfrac{-3x}{-3} = \\dfrac{12}{-3}] | 왼쪽은 약분되어 문자만 남아요. 오른쪽을 계산해요. [x = -4]', '곱해진 수를 없애는 풀이');
  eq(T(b3) + ' / ' + [J(b3, '3'), J(b3, '6'), J(b3, '7'), J(b3, '1')].join(' '), '2x + 4 = 10 / correct:- wrong:half wrong:same-op wrong:divide-first', '2x + 4 = 10');
  eq(H(b3)[2], '① 양쪽에서 4를 빼요: $2x = 10 - 4$. ② 오른쪽을 계산해요. ③ 양쪽을 $2$로 나눠요. 순서를 바꾸면 계산이 복잡해져요.', '두 번 쓰는 문제의 셋째 힌트');
  eq(T(b4) + ' / ' + [J(b4, '-18'), J(b4, '-2')].join(' ') + ' / ' + says(b4), '\\dfrac{a}{3} = -6 / correct:- wrong:divided / 양쪽에 3을 곱해요. [\\dfrac{a}{3} \\times 3 = (-6) \\times 3] | 왼쪽은 약분되어 문자만 남아요. 오른쪽을 계산해요. [a = -18]', 'a/3 = −6');

  var s1 = prob('B07.shift', { q: { x: 'x', a: 5, b: 3, c: 2, d: 9, o: O } }), s2 = prob('B07.shift', { q: { x: 'x', a: 3, b: 5, c: 0, d: 11, o: O } }), s3 = prob('B07.shift', { q: { x: 'y', a: 5, b: 0, c: -2, d: 9, o: O } });
  var judges = function (p) { return MH.optionsOf(p).map(function (o) { return J(p, o); }).join(' '); };
  eq(T(s1) + ' → ' + MH.optionsOf(s1).join(' , ') + ' / ' + judges(s1), '5x + 3 = 2x + 9 → 5x - 2x = 9 - 3 , 5x - 2x = 9 + 3 , 5x + 2x = 9 - 3 , 5x + 2x = 9 + 3 / correct:- wrong:keep-const wrong:keep-x wrong:keep-both', '5x + 3 = 2x + 9 의 이항');
  eq(T(s2) + ' → ' + MH.optionsOf(s2).join(' , ') + ' / ' + judges(s2), '3x + 5 = 11 → 3x = 11 - 5 , 3x = 11 + 5 , 3x = 11 , 3x = -11 - 5 / correct:- wrong:keep-sign wrong:dropped wrong:stay-flipped', '3x + 5 = 11 의 이항');
  eq(T(s3) + ' → ' + MH.optionsOf(s3).join(' , '), '5y = -2y + 9 → 5y + 2y = 9 , 5y - 2y = 9 , 5y = 9 , 5y + 2y = -9', '5y = −2y + 9 의 이항');
  eq(H(s1)[1].split(': ')[1] + ' / ' + says(s1), '$+2x$, $+3$ / 등호를 건너야 하는 항을 찾아요: $+2x$, $+3$ | 건너는 항만 부호를 바꿔서 옮겨요. 제자리에 있는 항은 그대로예요. [5x - 2x = 9 - 3]', '이항의 힌트와 풀이');

  var m1 = prob('B07.move', { q: { x: 'x', L: [[5, 'x'], [3, '']], R: [[2, 'x'], [9, '']] } });
  eq(T(m1) + ' / ' + [J(m1, '2'), J(m1, '4'), J(m1, '6')].join(' '), '5x + 3 = 2x + 9 / correct:- wrong:keep-const wrong:half', '5x + 3 = 2x + 9');
  eq(says(m1), '문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요. 등호를 건너는 항은 부호가 바뀌어요. [5x - 2x = 9 - 3] | 양쪽을 각각 계산해요. [3x = 6] | 양쪽을 문자 앞의 수 $3$으로 나눠요. [x = \\dfrac{6}{3} = 2]', '이항해서 푸는 풀이');
  eq(H(m1)[1], '① 문자 $x$가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 모아요. 이 식에서 등호를 건너야 하는 항: $+2x$, $+3$. 이 항들만 부호가 바뀌고, 제자리에 있는 항은 그대로예요.', '이항해서 푸는 둘째 힌트');

  var p1 = prob('B07.paren', { q: { x: 'x', L: [['g', 3, [[1, 'x'], [-2, '']]]], R: [[1, 'x'], [4, '']] } });
  var p2 = prob('B07.paren', { q: { x: 'x', L: [['g', 2, [[1, 'x'], [1, '']]], ['g', -3, [[1, 'x'], [-2, '']]]], R: [[5, '']] } });
  eq(T(p1) + ' / ' + [J(p1, '5'), J(p1, '3'), J(p1, '10')].join(' '), '3(x - 2) = x + 4 / correct:- wrong:first-only wrong:half', '3(x − 2) = x + 4');
  eq(says(p1).split(' | ')[0], '분배법칙으로 괄호를 풀어요. 괄호 안의 모든 항에 곱해요. [3x - 6 = x + 4]', '괄호를 푸는 풀이');
  eq(T(p2) + ' / ' + [J(p2, '3'), J(p2, '-9'), J(p2, '-6'), J(p2, '-3')].join(' '), '2(x + 1) - 3(x - 2) = 5 / correct:- wrong:minus-paren wrong:first-only wrong:sign', '2(x + 1) − 3(x − 2) = 5');
  eq(says(p2).split(' | ').slice(-2).join(' | '), '양쪽을 각각 계산해요. [-x = -3] | 양쪽에 −1을 곱해서 부호를 바꿔요. [x = 3]', '문자 앞이 −1 인 풀이');

  var f1 = prob('B07.frac', { q: { k: 'dec', x: 'x', p: 1, L: [[3, 'x'], [5, '']], R: [[20, '']] } });
  var f2 = prob('B07.frac', { q: { k: 'fr', x: 'x', L: [['f', 1, [[1, 'x'], [1, '']], 2]], R: [['f', 1, [[1, 'x'], [-3, '']], 3], [1, '']] } });
  var f3 = prob('B07.frac', { q: { k: 'sol', x: 'x', L: [[3, 'x'], [1, '']], R: [[6, '']] } });
  var f4 = prob('B07.frac', { q: { k: 'fr', x: 'x', L: [['f', 1, [[1, 'x']], 2], [-1, '']], R: [['f', 1, [[1, 'x']], 3]] } });
  eq(T(f1) + ' / ' + [J(f1, '5'), J(f1, '-1'), J(f1, '15')].join(' '), '0.3x + 0.5 = 2 / correct:- wrong:int-not-multiplied wrong:half', '0.3x + 0.5 = 2');
  eq(says(f1), '양쪽의 모든 항에 10을 곱해서 계수를 정수로 바꿔요. [3x + 5 = 20] | 문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요. 등호를 건너는 항은 부호가 바뀌어요. [3x = 20 - 5] | 양쪽을 각각 계산해요. [3x = 15] | 양쪽을 문자 앞의 수 $3$으로 나눠요. [x = \\dfrac{15}{3} = 5]', '소수 계수의 풀이');
  eq(T(f2) + ' / ' + [J(f2, '-3'), J(f2, '-8')].join(' ') + ' / ' + says(f2).split(' | ').slice(0, 2).join(' | '),
    '\\dfrac{x + 1}{2} = \\dfrac{x - 3}{3} + 1 / correct:- wrong:int-not-multiplied / 분모의 최소공배수 6을 양쪽의 모든 항에 곱해요. 분자가 여러 항이면 괄호로 묶어요. [3(x + 1) = 2(x - 3) + 6] | 괄호를 풀어요. 음수를 곱하면 괄호 안의 모든 항의 부호가 바뀌어요. [3x + 3 = 2x - 6 + 6]', '분자가 식인 방정식');
  eq(T(f3) + ' / ' + [J(f3, '5/3'), J(f3, '3/5'), J(f3, '5'), J(f3, '-5/3')].join(' ') + ' / ' + says(f3).split(' | ').pop(), '3x + 1 = 6 / correct:- wrong:flipped wrong:half wrong:sign / 양쪽을 문자 앞의 수 $3$으로 나눠요. 나누어떨어지지 않으면 분수로 써요. [x = \\dfrac{5}{3}]', '해가 분수인 방정식');
  eq(T(f4) + ' / ' + J(f4, '6') + ' ' + J(f4, '1') + ' / ' + H(f4)[1], '\\dfrac{x}{2} - 1 = \\dfrac{x}{3} / correct:- wrong:int-not-multiplied / 분모를 없애려면 분모들의 최소공배수를 양쪽에 곱해요. 이 식의 분모는 2, 3이고 최소공배수는 6이에요. 양쪽의 모든 항에 6을 곱하면 분모가 약분되어 사라져요.', 'x/2 − 1 = x/3');
  done('실수 · 풀이 · 힌트 예');
})();
