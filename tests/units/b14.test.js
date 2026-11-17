/* B14 연립일차방정식 — 단원 전용 검사.
   화면에 보이는 식을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어, 단원 파일의 풀이와 따로 해를 구한다.
   ① 식에 (0,0) · (1,0) · (0,1)을 넣어 계수를 읽고 크라메르 공식으로 푼다. ② 활용 문제는 문제 글에서 수를 읽어 자연수를 모두 넣어 본다.
   풀이의 모든 줄은 구한 해를 넣었을 때 양쪽이 같아야 한다. */
(function () {
  'use strict';
  var N = 1000, noJosa = ALG.noJosa, calc = ALG.calc;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var wrongOf = function (p, id) { var m = MH.mistakesFor(p).filter(function (x) { return x.id === id; })[0]; return m ? m.value : null; };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx), all = h.concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.mistakesFor(p).map(function (m) { return m.explain; }));
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    MH.mistakesFor(p).forEach(function (m) { ok(m.explain.length >= 25, where + '실수 설명이 짧음: ' + m.id); });
    if (p.seed <= 200) noJosa(all, where);
    if (p.seed <= 300) all.forEach(function (t) {
      var re = /(\d)\$?(이에요|예요|은 |는 |이 |가 |을 |를 |과 |와 |으로 |로 )/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
      ok(t.split('$').length % 2 === 1, where + '$ 짝: ' + t);
    });
  };
  /* ── 분수 계산(BigInt) ── */
  var Q = function (n) { return ALG.Q(BigInt(n), 1n); };
  var sub = function (a, b) { return { n: a.n * b.d - b.n * a.d, d: a.d * b.d }; };
  var mul = function (a, b) { return { n: a.n * b.n, d: a.d * b.d }; };
  var div = function (a, b) { return { n: a.n * b.d, d: a.d * b.n }; };
  var zero = function (a) { return a.n === 0n; };
  var same = function (a, b) { return zero(sub(a, b)); };
  var toInt = function (a) { return a.d !== 0n && a.n % a.d === 0n ? Number(a.n / a.d) : NaN; };
  var envOf = function (o) { var e = {}, k; for (k in o) e[k] = Q(o[k]); return e; };
  /** 글 → 식의 목록. 식 하나는 등호로 나눈 조각들(A = B = C 는 조각 셋) */
  var eqsOf = function (tex) { return tex.replace(/^\\begin\{cases\} /, '').replace(/ \\end\{cases\}$/, '').split(' \\\\ ').map(function (t) { return t.split(' = '); }); };
  /** 모든 식에서 등호로 이은 조각의 값이 모두 같은가 */
  var holds = function (tex, env) { return eqsOf(tex).every(function (parts) { var v = parts.map(function (t) { return calc(t, env); }); return parts.length >= 2 && v.every(function (x) { return same(x, v[0]); }); }); };
  /** 조각 둘(L = R)을 문자 u, v 의 일차식으로 읽는다 → a·u + b·v = c */
  var lin = function (L, R, u, v, fixed) {
    var f = function (x, y) { var e = {}, k; for (k in fixed || {}) e[k] = fixed[k]; e[u] = Q(x); e[v] = Q(y); return sub(calc(L, e), calc(R, e)); };
    var f0 = f(0, 0), a = sub(f(1, 0), f0), b = sub(f(0, 1), f0);
    /* 일차식인지: (2, 3)에서의 값이 맞아야 한다 */
    if (!same(sub(f(2, 3), f0), { n: 2n * a.n * b.d + 3n * b.n * a.d, d: a.d * b.d })) throw new Error('일차식이 아님: ' + L + ' = ' + R);
    return { a: a, b: b, c: sub(Q(0), f0) };
  };
  var cramer = function (e1, e2) {
    var D = sub(mul(e1.a, e2.b), mul(e2.a, e1.b));
    if (zero(D)) return null;
    return [toInt(div(sub(mul(e1.c, e2.b), mul(e2.c, e1.b)), D)), toInt(div(sub(mul(e1.a, e2.c), mul(e2.a, e1.c)), D))];
  };
  /** 문제의 글(연립방정식 또는 A = B = C)을 푼다 → [x, y] */
  var solveTex = function (tex, u, v, fixed) {
    var es = eqsOf(tex), pairs = es.length === 1 && es[0].length === 3 ? [[es[0][0], es[0][2]], [es[0][1], es[0][2]]] : es;
    if (pairs.length !== 2 || pairs.some(function (p) { return p.length !== 2; })) throw new Error('연립방정식이 아님: ' + tex);
    return cramer(lin(pairs[0][0], pairs[0][1], u || 'x', v || 'y', fixed), lin(pairs[1][0], pairs[1][1], u || 'x', v || 'y', fixed));
  };
  var stepsHold = function (id, p, env, where) {
    var st = MH.types[id].steps(p.v);
    st.forEach(function (s, i) { if (s.tex.indexOf(' = ') >= 0) ok(holds(s.tex, env), where + '풀이 ' + (i + 1) + '째 줄이 해에서 성립하지 않음: ' + s.tex); });
    ok(st.length >= 2 && !/1 \\times|[+-] 1[a-z]/.test(st.map(function (s) { return s.tex; }).join(' ; ')), where + '풀이에 1 × … 꼴이 있음');
    return st;
  };
  var askOf = function (text, s, where) {
    var m = /풀어 \$(x|y|x \+ y)\$의 값을 구하세요\.$/.exec(text);
    ok(!!m, where + '문제 글: ' + text);
    return !m ? NaN : m[1] === 'x' ? s[0] : m[1] === 'y' ? s[1] : s[0] + s[1];
  };
  var signedChecks = function (id, p, want, where, bag) {
    eq(p.answer.n, want, where + '답'); ok(p.answer.p === 0, where + '답은 정수');
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; ok(x.value.n !== want && x.value.p === 0, where + '실수 ' + x.id + ' 의 값'); });
    if (p.seed <= 60) { eq(J(p, String(want)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(MH.judge(p, String(x.value.n)).verdict, 'wrong', where + '실수 값 판정'); }); }
    detailed(id, p, where);
  };
  var costOf = function (tex) {
    var es = eqsOf(tex), e1 = lin(es[0][0], es[0][1], 'x', 'y'), e2 = lin(es[1][0], es[1][1], 'x', 'y'), best = 9;
    ['a', 'b'].forEach(function (k) { var u = Math.abs(toInt(e1[k])), v = Math.abs(toInt(e2[k])), c; if (!u || !v) return; c = u === v ? 0 : (u % v === 0 || v % u === 0) ? 1 : 2; best = Math.min(best, c); });
    return best;
  };

  group('B14 — 검사 도구 자체 검사');
  eq(solveTex('\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}').join(','), '3,1', '가감법 예');
  eq(solveTex('\\begin{cases} y = 2x - 1 \\\\ 3x + 2y = 12 \\end{cases}').join(','), '2,3', '대입법 예');
  eq(solveTex('\\begin{cases} \\dfrac{x}{2} - \\dfrac{y}{3} = \\dfrac{1}{6} \\\\ 0.3x + 0.2(x - y) = 0.7 \\end{cases}').join(','), '3,4', '분수 · 소수 · 괄호');
  eq(solveTex('2x + y - 1 = x - y + 4 = 6').join(','), '3,1', 'A = B = C');
  ok(solveTex('\\begin{cases} x + y = 2 \\\\ 2x + 2y = 4 \\end{cases}') === null && isNaN(solveTex('\\begin{cases} 2x + y = 2 \\\\ x - y = 0 \\end{cases}')[0]), '해가 정해지지 않거나 정수가 아닌 경우');
  ok(holds('\\begin{cases} 6x + 12y = -42 \\\\ -6x + 6y = 24 \\end{cases}', envOf({ x: -5, y: -1 })) && !holds('x + y = 3', envOf({ x: 1, y: 1 })) && holds('x + y = -5 + (-1) = -6', envOf({ x: -5, y: -1 })), '식이 성립하는지');
  eq(costOf('\\begin{cases} 2x + 4y = -14 \\\\ -3x + 3y = 12 \\end{cases}'), 2, '곱해야 하는 식의 수');
  done('도구');

  group('B14 — 해인 순서쌍 고르기: 보기를 모두 넣어 본다 (단계마다 1,000문제)');
  var bag = {};
  each('B14.pair', function (p, pr, level, where) {
    var opts = MH.optionsOf(p), es = eqsOf(pr.tex), fit;
    var parse = function (o) { var m = /^\((-?\d+),\\ (-?\d+)\)$/.exec(o); return m ? [Number(m[1]), Number(m[2])] : null; };
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && !!parse(o); }) && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' '));
    eq(es.length, level === 0 ? 1 : 2, where + '식의 수');
    ok(level !== 2 || es.filter(function (e) { return e[0] === 'y'; }).length === 1, where + 'y = … 꼴의 식이 하나');
    /* 식마다 보기가 맞는지 */
    fit = function (o) { var v = parse(o), env = envOf({ x: v[0], y: v[1] }); return es.map(function (e) { return same(calc(e[0], env), calc(e[1], env)); }); };
    ok(opts.every(function (o) { return (o === p.answer) === fit(o).every(Boolean); }), where + '정답만 모든 식에 맞아야 함: ' + pr.tex + ' ' + opts.join(' '));
    if (level > 0) eq(solveTex(pr.tex).join(','), parse(p.answer).join(','), where + '따로 푼 해');
    MH.mistakesFor(p).forEach(function (x) {
      bag[x.id] = 1;
      if (x.id === 'first-only') ok(fit(x.value)[0] && !fit(x.value)[1], where + 'first-only 는 첫째 식에만 맞는다');
      if (x.id === 'second-only') ok(!fit(x.value)[0] && fit(x.value)[1], where + 'second-only 는 둘째 식에만 맞는다');
      if (x.id === 'swapped') eq(parse(x.value).reverse().join(','), parse(p.answer).join(','), where + 'swapped 는 순서만 바뀐 쌍');
      /* 설명에 적은 계산이 그 보기의 실제 계산과 같다 */
      var v = parse(x.value);
      ok(x.explain.indexOf('$x = ' + v[0] + '$, $y = ' + v[1] + '$') === 0 && /달라/.test(x.explain), where + '실수 설명: ' + x.explain);
    });
    stepsHold('B14.pair', p, envOf({ x: parse(p.answer)[0], y: parse(p.answer)[1] }), where);
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed('B14.pair', p, where);
  });
  eq(Object.keys(bag).sort().join(' '), 'first-only near near-2 near-3 second-only sign swapped', '실수의 종류');
  done('해인 순서쌍');

  group('B14 — 가감법 · 대입법 · 복잡한 식: 따로 푼 해와 답이 같은가 (유형 · 단계마다 1,000문제)');
  var SHAPE = {
    'B14.elim': [function (t) { return costOf(t) === 0; }, function (t) { return costOf(t) === 1; }, function (t) { return costOf(t) === 2; }],
    'B14.subst': [function (t) { return /(\{cases\} |\\\\ )[xy] = /.test(t); }, function (t) { return /(\{cases\} |\\\\ )[xy] = /.test(t); }, function (t) { return !/(\{cases\} |\\\\ )[xy] = /.test(t) && /(^|[^\d]|\s)[xy] [+-] \d*[xy] = |[+-] [xy] = /.test(t); }],
    'B14.form': [function (t) { return /\(/.test(t); }, function (t) { return /dfrac|\d\.\d/.test(t); }, function (t) { return !/cases/.test(t) && t.split(' = ').length === 3; }]
  };
  var WANT = { 'B14.elim': 'other-variable rhs-not-multiplied rhs-op', 'B14.subst': 'no-paren other-variable', 'B14.form': 'other-variable paren-first-only rhs-not-multiplied rhs-not-scaled rhs-op' };
  Object.keys(SHAPE).forEach(function (id) {
    var seen = {}, asks = {};
    each(id, function (p, pr, level, where) {
      var s = solveTex(pr.tex), want, st, m = /\$(x|y|x \+ y)\$의 값/.exec(pr.text);
      ok(!!s && !isNaN(s[0]) && !isNaN(s[1]) && Math.abs(s[0]) <= 12 && Math.abs(s[1]) <= 12, where + '해가 정수 한 쌍이 아님: ' + pr.tex);
      ok(SHAPE[id][level](pr.tex), where + '단계에 맞지 않는 식: ' + pr.tex);
      want = askOf(pr.text, s, where); if (m) asks[m[1]] = 1;
      st = stepsHold(id, p, envOf({ x: s[0], y: s[1] }), where);
      ok(st.some(function (x) { return x.tex === 'x = ' + s[0]; }) && st.some(function (x) { return x.tex === 'y = ' + s[1] || x.tex.replace(/^y = .* = /, 'y = ') === 'y = ' + s[1]; }) || id === 'B14.subst', where + '풀이에 두 값이 모두 나온다');
      if (wrongOf(p, 'other-variable')) eq(wrongOf(p, 'other-variable').n, m && m[1] === 'x' ? s[1] : s[0], where + '다른 문자의 값');
      ok(!m || m[1] !== 'x + y' || !wrongOf(p, 'other-variable'), where + '합을 물을 때는 other-variable 이 없다');
      if (id === 'B14.subst') ok(st.some(function (x) { return /통째로 넣어요|서로 같아요/.test(x.say); }), where + '대입하는 줄');
      if (id === 'B14.elim') ok(st.some(function (x) { return /변끼리 (더하면|빼면)/.test(x.say); }) && (level === 0) === !st.some(function (x) { return /계수의 크기를 같게 만들어요/.test(x.say); }), where + '가감법의 줄');
      signedChecks(id, p, want, where, seen);
    });
    eq(Object.keys(seen).sort().join(' '), WANT[id], id + ': 실수의 종류');
    eq(Object.keys(asks).sort().join(' | '), 'x | x + y | y', id + ': 묻는 것 세 가지');
    done(MH.types[id].title);
  });

  group('B14 — 상수 구하기: 해를 넣어 상수를 따로 구한다 (단계마다 1,000문제)');
  bag = {};
  each('B14.param', function (p, pr, level, where) {
    var m, x, y, es = eqsOf(pr.tex), want, env, withA, noA, s, f0, f1, ab;
    if (level === 1) {
      m = /^연립방정식의 해가 \$x = (-?\d+)\$, \$y = (-?\d+)\$일 때, 상수 \$(a|b|a \+ b)\$의 값을 구하세요\.$/.exec(pr.text);
      ok(!!m && /^\\begin\{cases\} ax \+ by = -?\d+ \\\\ bx [+-] ay = -?\d+ \\end\{cases\}$/.test(pr.tex), where + '문제: ' + pr.text + ' ' + pr.tex);
      if (!m) return;
      ab = solveTex(pr.tex, 'a', 'b', envOf({ x: m[1], y: m[2] }));
      ok(!!ab && !isNaN(ab[0]) && !isNaN(ab[1]), where + 'a, b 가 정수가 아님');
      want = m[3] === 'a' ? ab[0] : m[3] === 'b' ? ab[1] : ab[0] + ab[1];
      env = envOf({ x: m[1], y: m[2], a: ab[0], b: ab[1] });
      ok(holds(pr.tex, env), where + '구한 상수를 넣은 식에 해가 맞는다');
    } else {
      withA = es.filter(function (e) { return /a/.test(e.join(' ')); }); noA = es.filter(function (e) { return !/a/.test(e.join(' ')); });
      ok(es.length === 2 && withA.length === 1 && noA.length === 1, where + 'a 가 든 식은 하나: ' + pr.tex);
      if (level === 0) {
        m = /^연립방정식의 해가 \$x = (-?\d+)\$, \$y = (-?\d+)\$일 때, 상수 \$a\$의 값을 구하세요\.$/.exec(pr.text);
        ok(!!m, where + '문제 글: ' + pr.text); if (!m) return;
        x = Number(m[1]); y = Number(m[2]);
      } else {
        m = /^연립방정식의 해가 일차방정식 \$([xy]) = (-?\d*)([xy])\$를 만족할 때, 상수 \$a\$의 값을 구하세요\.$/.exec(pr.text);
        ok(!!m && m[1] !== m[3], where + '문제 글: ' + pr.text); if (!m) return;
        s = cramer(lin(noA[0][0], noA[0][1], 'x', 'y'), lin(m[1], m[2] + m[3], 'x', 'y'));
        ok(!!s && !isNaN(s[0]) && !isNaN(s[1]), where + '조건과 a 가 없는 식으로 해가 정해지지 않음'); if (!s) return;
        x = s[0]; y = s[1];
        if (wrongOf(p, 'solution-value')) eq(wrongOf(p, 'solution-value').n, m[1] === 'y' ? x : y, where + 'solution-value 는 먼저 구한 해');
      }
      ok(holds(noA[0].join(' = '), envOf({ x: x, y: y })), where + 'a 가 없는 식에 해가 맞는다');
      /* a 가 든 식은 a 의 일차식: a = 0, 1 을 넣어 푼다 */
      f0 = sub(calc(withA[0][0], envOf({ x: x, y: y, a: 0 })), calc(withA[0][1], envOf({ x: x, y: y, a: 0 })));
      f1 = sub(calc(withA[0][0], envOf({ x: x, y: y, a: 1 })), calc(withA[0][1], envOf({ x: x, y: y, a: 1 })));
      want = toInt(div(sub(Q(0), f0), sub(f1, f0)));
      env = envOf({ x: x, y: y, a: want });
      ok(!isNaN(want) && want !== 0 && holds(pr.tex, env), where + '상수 a = ' + want);
    }
    /* 풀이: 문자가 x, y, a, b 가운데 무엇이든 구한 값에서 성립한다 */
    stepsHold('B14.param', p, env, where);
    signedChecks('B14.param', p, want, where, bag);
  });
  eq(Object.keys(bag).sort().join(' '), 'other-variable rhs-not-multiplied rhs-op solution-value swapped-xy', '실수의 종류');
  done('상수 구하기');

  group('B14 — 활용: 문제 글에서 수를 읽어 자연수를 모두 넣어 본다 (단계마다 1,000문제)');
  var num = function (t) { return Number(String(t).replace(/,/g, '')); }, kinds = [{}, {}, {}], asked = {};
  bag = {};
  each('B14.word', function (p, pr, level, where) {
    var t = pr.text, m, kind, cond, range = [1, 60, 1], ansOf, unit, x, y, found = [], st, first;
    if ((m = /^한 (\S+)에 ([\d,]+)원인 (\S+?)[과와] 한 \S+에 ([\d,]+)원인 (\S+?)[을를] 합해서 (\d+)(\S+) 샀더니 값이 모두 ([\d,]+)원이었어요\. (\S+?)[은는] 몇 \S+ 샀는지 구하세요\.$/.exec(t))) {
      kind = 'buy'; unit = m[1]; cond = function (x, y) { return x + y === num(m[6]) && num(m[2]) * x + num(m[4]) * y === num(m[8]); }; first = m[9] === m[3]; ok((first || m[9] === m[5]) && m[7] === m[1], where + '묻는 물건: ' + t);
    } else if ((m = /^입장료가 어른은 ([\d,]+)원, 어린이는 ([\d,]+)원인 박물관에 어른과 어린이를 합해서 (\d+)명이 들어갔더니 입장료가 모두 ([\d,]+)원이었어요\. (어른|어린이)[은는] 몇 명인지 구하세요\.$/.exec(t))) {
      kind = 'ticket'; unit = '명'; cond = function (x, y) { return x + y === num(m[3]) && num(m[1]) * x + num(m[2]) * y === num(m[4]); }; first = m[5] === '어른';
    } else if ((m = /^(\S+?)[과와] (\S+?)[이가] 합해서 (\d+)(\S+) 있고, (\S+?)[은는] 모두 (\d+)개예요\. (\S+) 한 \S+의 \S+ (\d)개, (\S+) 한 \S+의 \S+ (\d)개예요\. (\S+?)[은는] 몇 \S+인지 구하세요\.$/.exec(t))) {
      kind = 'legs'; unit = m[4]; cond = function (x, y) { return x + y === num(m[3]) && num(m[8]) * x + num(m[10]) * y === num(m[6]); }; first = m[11] === m[1]; ok((first || m[11] === m[2]) && m[7] === m[1] && m[9] === m[2], where + '묻는 것: ' + t);
    } else if ((m = /^두 자리 자연수가 있어요\. 십의 자리 숫자와 일의 자리 숫자의 합은 (\d+)이고, 십의 자리 숫자와 일의 자리 숫자를 바꾼 수는 처음 수보다 (\d+)만큼 (커요|작아요)\. 처음 수를 구하세요\.$/.exec(t))) {
      kind = 'digits'; unit = ''; range = [1, 9, 1]; cond = function (x, y) { return y <= 9 && x + y === num(m[1]) && (10 * y + x) - (10 * x + y) === (m[3] === '커요' ? 1 : -1) * num(m[2]); }; ansOf = function (x, y) { return 10 * x + y; };
    } else if ((m = /^현재 (\S+?)[과와] (\S+)의 나이의 합은 (\d+)살이고, (\d+)년 후에는 (\S+)의 나이가 (\S+)의 나이의 (\d)배가 돼요\. 현재 (\S+)의 나이를 구하세요\.$/.exec(t))) {
      kind = 'age'; unit = '살'; range = [1, 90, 1]; cond = function (x, y) { return x + y === num(m[3]) && x + num(m[4]) === num(m[7]) * (y + num(m[4])); }; first = m[8] === m[1]; ok((first || m[8] === m[2]) && m[5] === m[1] && m[6] === m[2], where + '묻는 사람: ' + t);
    } else if ((m = /^집에서 도서관까지 가는데, 처음에는 시속 (\d+) km로 자전거를 타고 가다가 도중에 자전거가 고장 나서 시속 (\d+) km로 걸어갔어요\. 집에서 도서관까지의 거리는 (\d+) km이고, 모두 (?:(\d+)시간)? ?(30분)?이 걸렸어요\. (자전거를 타고 간|걸어간) 거리는 몇 km인지 구하세요\.$/.exec(t))) {
      kind = 'dist'; unit = 'km'; cond = function (x, y) { return x + y === num(m[3]) && 2 * (x * num(m[2]) + y * num(m[1])) === (2 * num(m[4] || 0) + (m[5] ? 1 : 0)) * num(m[1]) * num(m[2]); }; first = m[6] !== '걸어간';
      ok(!!(m[4] || m[5]) && !/  /.test(t), where + '걸린 시간: ' + t);
    } else if ((m = /^(\S+) (\d)(\S+?)[과와] (\S+) (\d)\S+의 값은 ([\d,]+)원이고, (\S+) (\d)\S+?[과와] (\S+) (\d)\S+의 값은 ([\d,]+)원이에요\. (\S+) 한 (\S+)의 값은 얼마인지 구하세요\.$/.exec(t))) {
      kind = 'price'; unit = '원'; range = [100, 3000, 100]; cond = function (x, y) { return num(m[2]) * x + num(m[5]) * y === num(m[6]) && num(m[8]) * x + num(m[10]) * y === num(m[11]); }; first = m[12] === m[1]; ok((first || m[12] === m[4]) && m[7] === m[1] && m[9] === m[4] && m[13] === m[3], where + '묻는 물건: ' + t);
    }
    ok(!!kind && !pr.tex && !/을를|은는|undefined|NaN/.test(t), where + '문제 글: ' + t);
    if (!kind) return;
    kinds[level][kind] = 1;
    for (x = range[0]; x <= range[1]; x += range[2]) for (y = range[0]; y <= range[1]; y += range[2]) if (cond(x, y)) found.push([x, y]);
    eq(found.length, 1, where + '조건에 맞는 쌍은 하나: ' + t);
    if (found.length !== 1) return;
    x = found[0][0]; y = found[0][1];
    if (!ansOf) { ansOf = function (x, y) { return first ? x : y; }; asked[first ? 'x' : 'y'] = 1; }
    eq(p.answer, ansOf(x, y), where + t);
    eq(MH.types['B14.word'].answer.suffix(p.v), unit, where + '단위');
    ok(x !== y, where + '두 값이 같으면 묻는 것을 헷갈려도 맞는다');
    /* 풀이: 세운 식과 그 뒤의 모든 줄이 직접 찾은 쌍에서 성립한다 */
    st = stepsHold('B14.word', p, envOf({ x: x, y: y }), where);
    ok(/^\\begin\{cases\}/.test(st[0].tex) && /라고 해요|샀다고 해요/.test(st[0].say), where + '풀이의 첫 줄은 식 세우기');
    ok(st.every(function (s) { return !/\d{5,}[xy]/.test(s.tex); }) && !/-?\d{3,}[xy] = /.test(st.slice(2).map(function (s) { return s.tex; }).join(' ; ')), where + '풀이의 계수가 너무 큼: ' + st.map(function (s) { return s.tex; }).join(' ; '));
    MH.mistakesFor(p).forEach(function (w) { bag[w.id] = 1; ok(w.value !== p.answer && w.value > 0, where + '실수 ' + w.id + ' 의 값'); });
    if (kind !== 'digits') eq(wrongOf(p, 'other-variable'), first ? y : x, where + '다른 쪽의 값');
    else { eq(wrongOf(p, 'reversed-number'), 10 * y + x, where + '자리를 바꾼 수'); eq(wrongOf(p, 'digit-only'), x, where + '십의 자리 숫자'); }
    if (p.seed <= 100) { eq(J(p, String(p.answer)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (w) { eq(J(p, String(w.value)), 'wrong:' + w.id, where + '실수 판정 ' + w.id); }); }
    detailed('B14.word', p, where);
  });
  eq(kinds.map(function (k) { return Object.keys(k).sort().join(' '); }).join(' / '), 'buy legs ticket / age digits / dist price', '단계마다 나오는 상황');
  eq(Object.keys(asked).sort().join(' '), 'x y', '두 쪽을 모두 묻는다');
  eq(Object.keys(bag).sort().join(' '), 'digit-only no-years-added other-variable reversed-number', '실수의 종류');
  done('활용');

  group('B14 — 구체적인 예');
  var find = function (id, level, test) { for (var seed = 1; seed <= 6000; seed++) { var p = MH.makeProblem(id, level, seed); if (test(MH.types[id].prompt(p.v, p.ctx), p)) return p; } return null; };
  var texs = function (id, p) { return MH.types[id].steps(p.v).map(function (s) { return s.tex; }); };
  var p1 = find('B14.elim', 0, function (pr, p) { return /\+ y = .*- y = /.test(pr.tex) && /\$x\$의 값/.test(pr.text); });
  ok(!!p1 && /^\d*x \+ \(?-?\d*x\)? = /.test(texs('B14.elim', p1)[0].replace(/^-/, '')), '+y 와 −y 는 더해서 없앤다: ' + (p1 && texs('B14.elim', p1)[0]));
  var p2 = find('B14.subst', 0, function (pr, p) { return !!wrongOf(p, 'no-paren'); });
  ok(!!p2 && texs('B14.subst', p2)[0].indexOf('(') >= 0, '대입할 때 괄호를 친다');
  var p3 = find('B14.form', 1, function (pr, p) { return !!wrongOf(p, 'rhs-not-scaled'); }), p4 = find('B14.form', 0, function (pr, p) { return !!wrongOf(p, 'paren-first-only'); });
  ok(!!p3 && !!p4, '오른쪽에 곱하지 않은 실수 · 괄호의 첫 항에만 곱한 실수가 나온다');
  var p5 = find('B14.word', 1, function (pr, p) { return !!wrongOf(p, 'no-years-added'); });
  ok(!!p5 && /년 후/.test(MH.types['B14.word'].prompt(p5.v, p5.ctx).text), '나이 문제의 실수');
  var p6 = find('B14.elim', 0, function (pr) { return true; });
  ok(MH.judge(p6, '').verdict === 'invalid', '빈 답은 판정하지 않는다');
  done('예');
})();
