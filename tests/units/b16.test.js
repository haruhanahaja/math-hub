/* B16 일차함수와 일차방정식 — 단원 전용 검사.
   화면에 보이는 등식을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어 (0,0) · (1,0) · (0,1) 에서의 값으로
   계수(A x + B y + C = 0)를 따로 구하고, 문제 글에서 읽은 조건에 답이 맞는지 본다.
   단원 파일의 계산(gen, cramer, relOf …)과 무관하다. */
(function () {
  'use strict';
  var N = 1000, noJosa = ALG.noJosa, calc = ALG.calc;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx), all = h.concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.mistakesFor(p).map(function (m) { return m.explain; }));
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    MH.mistakesFor(p).forEach(function (m) { ok(m.explain.length >= 25, where + '실수 설명이 짧음: ' + m.id); });
    if (p.seed <= 200) noJosa(all, where);
    if (p.seed <= 300) all.forEach(function (t) {
      var re = /(\d)\)?\$?(이에요|예요|은 |는 |이 |가 |을 |를 |과 |와 |으로 |로 )/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        if (/\}\$?$/.test(t.slice(0, m.index + 1))) continue;
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
      ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object/.test(t), where + '글: ' + t);
    });
  };
  /* ── 분수 계산(BigInt) ── */
  var Q = function (n, d) { return ALG.Q(BigInt(n), BigInt(d === undefined ? 1 : d)); };
  var sub = function (a, b) { return { n: a.n * b.d - b.n * a.d, d: a.d * b.d }; };
  var add = function (a, b) { return { n: a.n * b.d + b.n * a.d, d: a.d * b.d }; };
  var mul = function (a, b) { return { n: a.n * b.n, d: a.d * b.d }; };
  var div = function (a, b) { return { n: a.n * b.d, d: a.d * b.n }; };
  var neg = function (a) { return { n: -a.n, d: a.d }; };
  var same = function (a, b) { return a.n * b.d === b.n * a.d; };
  var zero = function (a) { return a.n === 0n; };
  var show = function (a) { var d = a.d < 0n ? -a.d : a.d, n = a.d < 0n ? -a.n : a.n, g = function (x, y) { x = x < 0n ? -x : x; while (y) { var t = x % y; x = y; y = t; } return x; }, k = g(n, d) || 1n; return String(n / k) + (d / k === 1n ? '' : '/' + String(d / k)); };
  /** 등식 L = R 에서 L − R 의 값 */
  var G = function (tex, x, y, more) { var e = { x: x, y: y }, k, s = tex.split(' = '); for (k in more || {}) e[k] = more[k]; if (s.length !== 2) throw new Error('등식이 아님: ' + tex); return sub(calc(s[0], e), calc(s[1], e)); };
  var holds = function (tex, x, y, more) { try { return zero(G(tex, x, y, more)); } catch (e) { return false; } };
  /** 등식을 읽어 { A, B, C }(A x + B y + C = 0)를 얻는다. x, y 의 일차식이 아니면 null */
  var co = function (tex, more) {
    try { var C = G(tex, Q(0), Q(0), more), A = sub(G(tex, Q(1), Q(0), more), C), B = sub(G(tex, Q(0), Q(1), more), C);
      return same(G(tex, Q(2), Q(-3), more), add(C, add(mul(A, Q(2)), mul(B, Q(-3))))) && same(G(tex, Q(5), Q(7), more), add(C, add(mul(A, Q(5)), mul(B, Q(7))))) ? { A: A, B: B, C: C } : null; } catch (e) { return null; }
  };
  var det = function (a, b, c, d) { return sub(mul(a, d), mul(b, c)); };
  /** 두 직선: 0 한 점에서 만난다 · 1 평행 · 2 일치 */
  var rel = function (e, f) { return !zero(det(e.A, e.B, f.A, f.B)) ? 0 : zero(det(e.A, e.C, f.A, f.C)) && zero(det(e.B, e.C, f.B, f.C)) ? 2 : 1; };
  var meet = function (e, f) { var D = det(e.A, e.B, f.A, f.B); return { x: div(det(neg(e.C), e.B, neg(f.C), f.B), D), y: div(det(e.A, neg(e.C), f.A, neg(f.C)), D) }; };
  var eqs = function (tex) { return tex.replace(/^\\begin\{cases\} /, '').replace(/ \\end\{cases\}$/, '').split(' \\\\ '); };
  /** 풀이의 줄: x 와 y 가 함께 든 줄은 기준 직선과 같은 직선인지, 그 밖의 등식은 주어진 값에서 성립하는지 본다 */
  var stepsHold = function (id, p, env, ref, where) {
    var st = MH.types[id].steps(p.v);
    st.forEach(function (s, i) {
      var t = s.tex, c, v;
      if (/\\text|\\quad|\\neq|cases/.test(t) || t.indexOf(' = ') < 0) return;
      if (/x/.test(t) && /y/.test(t)) { c = co(t); ok(!!c && !!ref && rel(c, ref) === 2, where + '풀이 ' + (i + 1) + '째 줄이 같은 직선이 아님: ' + t); return; }
      try { v = t.split(' = ').map(function (x) { return calc(x, env); }); ok(v.every(function (x) { return same(x, v[0]); }), where + '풀이 ' + (i + 1) + '째 줄이 성립하지 않음: ' + t); }
      catch (e) { ok(false, where + '풀이 ' + (i + 1) + '째 줄을 읽지 못함: ' + t + ' (' + e + ')'); }
    });
    ok(st.length >= 2, where + '풀이 줄 수');
  };
  var numChecks = function (id, p, want, where, bag) {
    var def = MH.types[id], kind = MH.kinds[def.answer.kind], a = p.answer, got = def.answer.kind === 'rational' ? Q(a.n, a.d) : Q(a.n);
    ok(same(got, want), where + '답: 기대 ' + show(want) + ', 실제 ' + show(got));
    if (def.answer.kind === 'rational') ok(a.d >= 1 && MH.gcd(Math.abs(a.n), a.d) === 1, where + '답은 기약분수');
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) {
      eq(J(p, kind.raw(a, def.answer)), 'correct:-', where + '정답 판정');
      MH.mistakesFor(p).forEach(function (x) { var j = MH.judge(p, kind.raw(x.value, def.answer)); ok(j.verdict === 'wrong' && !!j.mistake, where + '실수 값 판정 ' + x.id); });
    }
    detailed(id, p, where);
    return got;
  };
  var choiceChecks = function (id, p, where, bag) {
    var opts = MH.optionsOf(p);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    return opts;
  };
  var PT = '\\$\\((-?\\d+),\\\\ (-?\\d+)\\)\\$', pair = function (o) { var m = /^\((-?\d+),\\ (-?\d+)\)$/.exec(o); return m ? [Q(m[1]), Q(m[2])] : null; };
  var isInt = function (a) { return /^-?\d+$/.test(show(a)); };

  group('B16 — 검사 도구 자체 검사');
  var c1 = co('2x - 3y + 6 = 0'), c2 = co('y = -\\dfrac{2}{3}x + 4'), c3 = co('4x = -24');
  ok(!!c1 && show(c1.A) === '2' && show(c1.B) === '-3' && show(c1.C) === '6' && !!c2 && show(div(neg(c2.A), c2.B)) === '-2/3' && !!c3 && zero(c3.B), '계수 읽기');
  ok(rel(co('x + 2y = 3'), co('2x + 4y = 5')) === 1 && rel(co('x + 2y = 3'), co('-2x - 4y + 6 = 0')) === 2 && rel(co('x + 2y = 3'), co('y = x')) === 0, '두 직선의 위치 관계');
  var M0 = meet(co('x - y = -1'), co('x + y = 3'));
  ok(show(M0.x) === '1' && show(M0.y) === '2' && holds('x + y = 3', Q(1), Q(2)) && !holds('x + y = 3', Q(2), Q(2)), '교점');
  done('도구');

  group('B16 — 일차방정식을 y = ax + b 꼴로 (단계마다 1,000문제)');
  var bag = {}, forms = {};
  each('B16.form', function (p, pr, level, where) {
    var opts = choiceChecks('B16.form', p, where, bag), e = co(pr.tex), a = co(p.answer);
    ok(!!e && !zero(e.A) && !zero(e.B) && !pr.figure && /y = ax \+ b/.test(pr.text), where + '문제: ' + pr.tex);
    if (!e) return;
    forms[/ = 0$/.test(pr.tex)] = 1;
    ok(opts.every(function (o) { return /^y = /.test(o) && !/y/.test(o.slice(4)) && !!co(o); }), where + '보기는 y = … 꼴: ' + opts.join(' | '));
    ok(!!a && rel(a, e) === 2 && opts.every(function (o) { return (rel(co(o), e) === 2) === (o === p.answer); }), where + '답만 같은 직선이어야 함: ' + pr.tex + ' → ' + p.answer);
    var m = div(neg(e.A), e.B), k = div(neg(e.C), e.B), one = show(e.B) === '1' || show(e.B) === '-1';
    ok(level === 0 ? one : level === 1 ? !one && isInt(m) && isInt(k) : !isInt(m), where + '단계에 맞는 식: ' + pr.tex);
    stepsHold('B16.form', p, {}, e, where);
  });
  eq(Object.keys(forms).length, 2, '… = c 꼴과 … = 0 꼴이 모두 나온다');
  eq(Object.keys(bag).sort().join(' '), 'both-sign const-sign move-sign not-divided', '실수의 종류');
  done('y = ax + b 꼴');

  group('B16 — 기울기 · 절편 · 지나는 점 (단계마다 1,000문제)');
  bag = {}; var asks = {};
  each('B16.read', function (p, pr, level, where) {
    var e = co(pr.tex), m, want, env = {}, e0, e1, g0, g1;
    if ((m = /^이 일차방정식의 그래프의 (기울기|\$x\$절편|\$y\$절편)를? ?을? ?구하세요\.$/.exec(pr.text.replace('기울기를', '기울기를 ').replace('  ', ' ')))) {
      ok(!!e && !zero(e.A) && !zero(e.B), where + '식: ' + pr.tex); if (!e) return;
      want = m[1] === '기울기' ? div(neg(e.A), e.B) : m[1] === '$x$절편' ? div(neg(e.C), e.A) : div(neg(e.C), e.B);
      asks[m[1]] = 1; env = m[1] === '$x$절편' ? { x: want, y: Q(0) } : m[1] === '$y$절편' ? { x: Q(0), y: want } : {};
      ok(level === 0 ? m[1] !== '$x$절편' && isInt(want) : level === 1, where + '단계에 맞는 물음: ' + pr.text);
      if (level === 1) ok(m[1] === '$x$절편' || !isInt(want), where + '2단계는 x절편이거나 분수');
    } else if ((m = new RegExp('^이 일차방정식의 그래프가 점 \\$\\((-?\\d+),\\\\ k\\)\\$를 지날 때, \\$k\\$의 값을 구하세요\\.$').exec(pr.text))) {
      ok(!!e && !zero(e.B) && level === 2, where + '식: ' + pr.tex); if (!e) return;
      want = div(neg(add(e.C, mul(e.A, Q(m[1])))), e.B); asks.pt = 1; env = { k: want };
      ok(holds(pr.tex, Q(m[1]), want), where + '점이 직선 위에 있어야 함');
    } else if ((m = new RegExp('^이 일차방정식의 그래프가 점 ' + PT + '[을를] 지날 때, 상수 \\$a\\$의 값을 구하세요\\.$').exec(pr.text))) {
      ok(/^ax /.test(pr.tex) && level === 2, where + '식: ' + pr.tex);
      g0 = G(pr.tex, Q(m[1]), Q(m[2]), { a: Q(0) }); g1 = G(pr.tex, Q(m[1]), Q(m[2]), { a: Q(1) });
      want = div(neg(g0), sub(g1, g0)); asks.coef = 1; env = { a: want };
      e0 = co(pr.tex, { a: Q(0) }); e1 = co(pr.tex, { a: Q(1) });
      ok(!!e0 && zero(e0.A) && show(e1.A) === '1' && holds(pr.tex, Q(m[1]), Q(m[2]), { a: want }), where + 'a 는 x 의 계수');
      e = null;
    } else { ok(false, where + '문제 글: ' + pr.text); return; }
    numChecks('B16.read', p, want, where, bag);
    ok(!pr.figure, where + '그림 없음');
    stepsHold('B16.read', p, env, e, where);
  });
  eq(Object.keys(asks).sort().join(' '), '$x$절편 $y$절편 coef pt 기울기', '물음의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-read const-read move-sign not-divided other-intercept reciprocal swapped-xy', '실수의 종류');
  done('기울기 · 절편 · 지나는 점');

  group('B16 — 축에 평행한 직선 (단계마다 1,000문제)');
  bag = {}; var shapes = {}, figs = {};
  each('B16.axis', function (p, pr, level, where) {
    var opts = choiceChecks('B16.axis', p, where, bag), m, want, f = pr.figure, e;
    ok(opts.every(function (o) { return /^[xy] = -?\d+$/.test(o); }), where + '보기의 꼴: ' + opts.join(' | '));
    if (level === 0) {
      ok(!!f && f.type === 'plane' && planeOk(f) && (f.vline === undefined) !== (f.hline === undefined) && !f.line && !pr.tex, where + '그림: ' + JSON.stringify(f));
      want = f.vline !== undefined ? 'x = ' + f.vline : 'y = ' + f.hline; shapes.fig = 1; figs[want] = 1;
    } else if ((m = new RegExp('^점 ' + PT + '[을를] 지나고 \\$([xy])\\$축에 (평행한|수직인) 직선의 방정식을 고르세요\\.$').exec(pr.text))) {
      var vertical = (m[3] === 'y') === (m[4] === '평행한');
      want = vertical ? 'x = ' + m[1] : 'y = ' + m[2]; shapes[m[4]] = 1;
      ok(level === 1 && !f && !pr.tex && m[1] !== m[2], where + '단계');
    } else if ((m = new RegExp('^두 점 ' + PT + ', ' + PT + '[을를] 지나는 직선의 방정식을 고르세요\\.$').exec(pr.text))) {
      ok(level === 2 && (m[1] === m[3]) !== (m[2] === m[4]), where + '두 점은 한쪽 좌표만 같아야 함: ' + pr.text);
      want = m[1] === m[3] ? 'x = ' + m[1] : 'y = ' + m[2]; shapes.two = 1;
    } else if (pr.text === '이 방정식의 그래프와 같은 직선을 고르세요.') {
      e = co(pr.tex);
      ok(level === 2 && !!e && zero(e.A) !== zero(e.B), where + '문자가 하나인 식: ' + pr.tex); if (!e) return;
      want = zero(e.B) ? 'x = ' + show(div(neg(e.C), e.A)) : 'y = ' + show(div(neg(e.C), e.B)); shapes.eq = 1;
      ok(opts.every(function (o) { return (rel(co(o), e) === 2) === (o === p.answer); }), where + '답만 같은 직선');
      stepsHold('B16.axis', p, { x: div(neg(e.C), zero(e.A) ? Q(1) : e.A), y: div(neg(e.C), zero(e.B) ? Q(1) : e.B) }, e, where);
    } else { ok(false, where + '문제 글: ' + pr.text); return; }
    eq(p.answer, want, where + '답');
  });
  eq(Object.keys(shapes).sort().join(' '), 'eq fig two 수직인 평행한', '문제의 종류');
  eq(Object.keys(figs).length, 16, '그림의 직선 16가지가 모두 나온다');
  eq(Object.keys(bag).sort().join(' '), 'axis-swapped both coord-swapped not-divided sign', '실수의 종류');
  done('축에 평행한 직선');

  group('B16 — 두 직선의 교점 (단계마다 1,000문제)');
  bag = {}; var yforms = {};
  each('B16.cross', function (p, pr, level, where) {
    var opts = choiceChecks('B16.cross', p, where, bag), es = eqs(pr.tex), E = es.map(function (t) { return co(t); }), a = pair(p.answer), f = pr.figure, M;
    ok(es.length === 2 && E.every(function (e) { return !!e && !zero(e.A) && !zero(e.B); }) && rel(E[0], E[1]) === 0 && !!a && opts.every(function (o) { return !!pair(o); }), where + '문제: ' + pr.tex + ' / ' + opts.join(' | '));
    if (!a || !E[0] || !E[1]) return;
    M = meet(E[0], E[1]);
    ok(same(M.x, a[0]) && same(M.y, a[1]) && holds(es[0], a[0], a[1]) && holds(es[1], a[0], a[1]), where + '답은 두 식의 해: ' + pr.tex + ' → ' + p.answer);
    MH.mistakesFor(p).forEach(function (x) {
      var w = pair(x.value), h = [holds(es[0], w[0], w[1]), holds(es[1], w[0], w[1])];
      ok(!(h[0] && h[1]), where + '틀린 보기가 해가 됨: ' + x.value);
      if (/^\$x\$좌표와 \$y\$좌표의 순서를 바꿨어요/.test(x.explain)) ok(same(w[0], a[1]) && same(w[1], a[0]), where + '순서를 바꾼 보기: ' + x.value);
      else if (/첫째 식의 그래프 위에만/.test(x.explain)) ok(h[0] && !h[1], where + '설명과 다름: ' + x.value + ' / ' + x.explain);
      else if (/둘째 식의 그래프 위에만/.test(x.explain)) ok(!h[0] && h[1], where + '설명과 다름: ' + x.value + ' / ' + x.explain);
      else ok(/어느 것 위에도 있지 않아요/.test(x.explain) && !h[0] && !h[1], where + '설명과 다름: ' + x.value + ' / ' + x.explain);
    });
    if (level === 0) {
      ok(!!f && f.type === 'plane' && planeOk(f) && !!f.line && !!f.line2 && /그림은 두 일차방정식의 그래프/.test(pr.text), where + '그림: ' + JSON.stringify(f));
      [f.line, f.line2].forEach(function (l, i) { var g = { A: Q(l[0]), B: Q(-l[1]), C: Q(l[1] * (l[2] || 0)) }; ok(rel(g, E[i]) === 2, where + '그림의 ' + (i + 1) + '째 직선이 식과 다름: ' + JSON.stringify(l) + ' / ' + es[i]); });
      ok([a[0], a[1]].every(function (v) { return isInt(v) && Math.abs(Number(show(v))) <= 4; }), where + '교점은 모눈 안의 격자점');
      ok(Math.abs(f.line[0] * f.line2[1] - f.line2[0] * f.line[1]) >= f.line[1] * f.line2[1], where + '두 직선의 기울기 차이는 1 이상(교점이 또렷하게 보인다)');
    } else ok(!f && /교점의 좌표를 고르세요/.test(pr.text), where + '그림 없음');
    if (level === 1) ok(es.every(function (t) { return !/^y = /.test(t); }), where + '2단계는 일차방정식 꼴');
    if (level === 2) { ok(es.some(function (t) { return /^y = /.test(t); }), where + '3단계는 y = … 꼴이 든 식'); yforms[es.filter(function (t) { return /^y = /.test(t); }).length] = 1; }
    stepsHold('B16.cross', p, { x: a[0], y: a[1] }, null, where);
  });
  eq(Object.keys(yforms).sort().join(' '), '1 2', 'y = … 꼴이 하나인 문제와 둘인 문제');
  eq(Object.keys(bag).sort().join(' '), 'first-only near near-2 second-only sign-x sign-y swapped', '실수의 종류');
  done('두 직선의 교점');

  group('B16 — 해의 개수와 위치 관계 (단계마다 1,000문제)');
  bag = {}; var rels = [{}, {}, {}], OPTS = ['한 점에서 만난다 (해가 한 쌍)', '평행하다 (해가 없다)', '일치한다 (해가 무수히 많다)', '두 점에서 만난다 (해가 두 쌍)'];
  each('B16.count', function (p, pr, level, where) {
    var opts = choiceChecks('B16.count', p, where, bag), es, E, r, m, e;
    ok(!pr.figure, where + '그림 없음');
    if (level < 2) {
      es = eqs(pr.tex); E = es.map(function (t) { return co(t); });
      ok(es.length === 2 && E.every(function (x) { return !!x && !zero(x.B) && !zero(x.A); }) && /위치 관계를 고르세요/.test(pr.text), where + '문제: ' + pr.tex); if (!E[0] || !E[1]) return;
      r = rel(E[0], E[1]); rels[level][r] = 1;
      eq(opts.join('|'), OPTS.join('|'), where + '보기는 늘 같은 차례');
      eq(p.answer, OPTS[r], where + '답: ' + pr.tex);
      if (level === 0) ok(es.some(function (t) { return /^y = /.test(t); }), where + '1단계는 y = … 꼴');
      else ok(es.every(function (t) { return !/^y = /.test(t); }), where + '2단계는 일차방정식 꼴');
      MH.mistakesFor(p).forEach(function (x) {
        if (/기울기가 달라요/.test(x.explain)) ok(r === 0, where + '설명: ' + x.explain);
        if (/기울기가 서로 같아요/.test(x.explain)) ok(r !== 0, where + '설명: ' + x.explain);
        if (/절편까지 같아요|절편까지 같아서/.test(x.explain)) ok(r === 2, where + '설명: ' + x.explain);
        if (/절편이 달라요|절편이 달라서/.test(x.explain)) ok(r === 1, where + '설명: ' + x.explain);
      });
      MH.types['B16.count'].steps(p.v).forEach(function (s) {
        var c;
        if (/cases/.test(s.tex)) { c = eqs(s.tex).map(function (t) { return co(t); }); ok(c.length === 2 && rel(c[0], E[0]) === 2 && rel(c[1], E[1]) === 2, where + '풀이의 고친 식: ' + s.tex); }
        else if (/\\neq| = /.test(s.tex) && !/text/.test(s.tex)) { c = s.tex.split(/ \\neq | = /).map(function (t) { return calc(t, {}); }); ok(same(c[0], c[1]) === / = /.test(s.tex), where + '풀이의 견줌: ' + s.tex); }
      });
    } else {
      m = /^다음 중 이 일차방정식과 연립했을 때 해가 (없는|무수히 많은) 것을 고르세요\.$/.exec(pr.text); e = co(pr.tex);
      ok(!!m && !!e && !zero(e.A) && !zero(e.B), where + '문제: ' + pr.text + ' / ' + pr.tex); if (!m || !e) return;
      r = m[1] === '없는' ? 1 : 2; rels[2][r] = 1;
      ok(opts.every(function (o) { var c = co(o); return !!c && (rel(c, e) === r) === (o === p.answer); }), where + '답만 조건에 맞아야 함: ' + pr.tex + ' → ' + opts.join(' | '));
      MH.mistakesFor(p).forEach(function (x) { eq(rel(co(x.value), e), x.id === 'parallel' ? 1 : x.id === 'same-line' ? 2 : 0, where + '실수의 종류와 보기: ' + x.id + ' ' + x.value); });
      var st = MH.types['B16.count'].steps(p.v);
      ok(st.length === 3 && rel(co(st[0].tex), e) === 2 && rel(co(st[1].tex), co(p.answer)) === 2 && st[2].tex === p.answer, where + '풀이: 주어진 식 → 답의 식');
    }
  });
  eq(rels.map(function (s) { return Object.keys(s).sort().join(''); }).join(' '), '012 012 12', '단계마다 모든 경우가 나온다');
  eq(Object.keys(bag).sort().join(' '), 'intersect-2 intersect-3 parallel said-infinite said-none said-one said-two same-line', '실수의 종류');
  done('해의 개수와 위치 관계');

  group('B16 — 상수 구하기 (단계마다 1,000문제)');
  bag = {}; var kinds = {};
  each('B16.param', function (p, pr, level, where) {
    var es = eqs(pr.tex), ia = es.map(function (t) { return /a/.test(t); }), tA = es.filter(function (t, i) { return ia[i]; })[0], rest = es.filter(function (t, i) { return !ia[i]; }), R = rest.map(function (t) { return co(t); }), m, x, y, want, a0, a1, g0, g1, env;
    ok(ia.filter(Boolean).length === 1 && /^ax /.test(tA) && R.every(function (e) { return !!e && !zero(e.A) && !zero(e.B); }) && !pr.figure, where + '문제: ' + pr.tex);
    if (!tA || !R[0]) return;
    a0 = co(tA, { a: Q(0) }); a1 = co(tA, { a: Q(1) });
    ok(!!a0 && !!a1 && zero(a0.A) && show(a1.A) === '1', where + 'a 는 x 의 계수: ' + tA);
    if (/해가 없을 때/.test(pr.text)) {
      ok(level === 2 && rest.length === 1, where + '단계'); kinds.none = 1;
      want = div(mul(R[0].A, a0.B), R[0].B);
      ok(rel(co(tA, { a: want }), R[0]) === 1, where + '평행해야 함(일치하면 안 됨): ' + pr.tex);
      env = { a: want };
    } else {
      if ((m = new RegExp('^두 일차방정식의 그래프의 교점의 좌표가 ' + PT + '일 때, 상수 \\$a\\$의 값을 구하세요\\.$').exec(pr.text))) { ok(level === 0 && rest.length === 1, where + '단계'); x = Q(m[1]); y = Q(m[2]); kinds.pt = 1; }
      else if ((m = /^두 일차방정식의 그래프의 교점의 \$x\$좌표가 \$(-?\d+)\$일 때, 상수 \$a\$의 값을 구하세요\.$/.exec(pr.text))) { ok(level === 1 && rest.length === 1, where + '단계'); x = Q(m[1]); y = div(neg(add(R[0].C, mul(R[0].A, x))), R[0].B); kinds.xc = 1; ok(isInt(y), where + '교점의 y좌표는 정수'); }
      else if (pr.text === '세 일차방정식의 그래프가 한 점에서 만날 때, 상수 $a$의 값을 구하세요.') { ok(level === 2 && rest.length === 2 && rel(R[0], R[1]) === 0, where + '단계'); if (rest.length !== 2) return; m = meet(R[0], R[1]); x = m.x; y = m.y; kinds.three = 1; ok(isInt(x) && isInt(y), where + '교점은 정수'); }
      else { ok(false, where + '문제 글: ' + pr.text); return; }
      ok(rest.every(function (t) { return holds(t, x, y); }), where + '교점이 a 없는 식 위에 있어야 함');
      g0 = G(tA, x, y, { a: Q(0) }); g1 = G(tA, x, y, { a: Q(1) }); want = div(neg(g0), sub(g1, g0));
      ok(holds(tA, x, y, { a: want }) && R.every(function (e) { return rel(co(tA, { a: want }), e) === 0; }), where + '구한 a 로 세 직선이 그 점에서 만나야 함');
      env = { a: want, x: x, y: y };
    }
    numChecks('B16.param', p, want, where, bag);
    MH.types['B16.param'].steps(p.v).forEach(function (s, i) {
      if (/\\quad|\\text/.test(s.tex) || s.tex.indexOf(' = ') < 0) return;
      try { var v = s.tex.split(' = ').map(function (t) { return calc(t, env); }); ok(v.every(function (t) { return same(t, v[0]); }), where + '풀이 ' + (i + 1) + '째 줄: ' + s.tex); } catch (e) { ok(false, where + '풀이를 읽지 못함: ' + s.tex + ' (' + e + ')'); }
    });
  });
  eq(Object.keys(kinds).sort().join(' '), 'none pt three xc', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-copied const-ratio move-sign not-divided ratio-inverted swapped-xy x-answered y-answered', '실수의 종류');
  done('상수 구하기');
})();
