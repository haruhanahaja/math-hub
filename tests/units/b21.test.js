/* B21 이차방정식 — 단원 전용 검사.
   화면에 보이는 방정식(문제 · 풀이의 줄)을 읽어 x 에 −1, 0, 1 을 넣은 값으로 계수 A, B, C 를 구하고,
   화면에 보이는 해(답 · 보기)를 읽어 (m + k√n) / d 꼴의 근으로 바꾼 다음 방정식에 직접 넣어 본다(정수 계산).
   답은 방정식의 해 전체이고 가장 간단한 꼴, 틀린 보기는 해 전체가 아니어야 한다(덜 간단히 한 not-reduced 만 예외).
   답이 수인 유형은 문제의 글자에서 수를 읽어 답을 따로 구한다(활용은 자연수를 하나씩 넣어 보고 뜻에 맞는 것이 하나뿐인지 본다).
   단원 파일의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, noJosa = ALG.noJosa;
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
      var re = /(\d)\)?\}?\$?(이에요|예요|은 |는 |이 |가 |을 |를 |과 |와 |으로 |로 )/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        if (/\}\}\$?$/.test(t.slice(0, m.index + 3)) || /\^\{\d+$/.test(t.slice(0, m.index + 1)) || /\d\)\^\{2\}\$$/.test(t.slice(0, m.index + 7))) continue;   /* 지수 뒤는 '제곱' 으로 읽는다 */
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
      ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object|와\(과\)/.test(t) && !/ $/.test(t), where + '글: ' + t);
    });
  };
  var gcdN = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; };
  var squarefree = function (n) { for (var i = 2; i * i <= n; i++) if (n % (i * i) === 0) return false; return true; };

  /* ── 방정식 읽기: (왼쪽) − (오른쪽) 의 계수 [A, B, C] ── */
  var side = function (s) {
    if (!/^[-+ 0-9x(){}^]+$/.test(s)) return null;
    var js = s.replace(/\(([^()]+)\)\^\{2\}/g, '(($1)*($1))').replace(/x\^\{2\}/g, '(x*x)').replace(/(\d)(x|\()/g, '$1*$2').replace(/\)\(/g, ')*(').replace(/x\(/g, 'x*(');
    if (/[\^{}]/.test(js)) return null;
    try { return new Function('x', 'return ' + js + ';'); } catch (e) { return null; }
  };
  var coefs = function (tex) {
    var parts = tex.split(' = '), L, R, f;
    if (parts.length !== 2) return null;
    L = side(parts[0]); R = side(parts[1]); if (!L || !R) return null;
    f = function (x) { return L(x) - R(x); };
    return [(f(1) + f(-1) - 2 * f(0)) / 2, (f(1) - f(-1)) / 2, f(0)];
  };
  var same = function (a, b) { return !!a && !!b && a[0] !== 0 && b[0] !== 0 && a[0] * b[1] === a[1] * b[0] && a[0] * b[2] === a[2] * b[0] && a[1] * b[2] === a[2] * b[1]; };

  /* ── 해 읽기 → { roots: [[m, k, n, d]] ((m + k√n) / d), dbl, simple(가장 간단한 꼴인가), irr } ── */
  var ratOf = function (s) {
    var m = /^(-?)(\d+)$/.exec(s);
    if (m) return { n: Number(m[1] + m[2]), d: 1, simple: true };
    m = /^(-?)\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(s);
    return m ? { n: Number(m[1] + m[2]), d: Number(m[3]), simple: Number(m[3]) > 1 && gcdN(Number(m[2]), Number(m[3])) === 1 } : null;
  };
  var CORE = /^(?:(-?\d+) (\\pm|\+) |(\\pm) )?(\d*)\\sqrt\{(\d+)\}$/;
  var solOf = function (tex) {
    var s, m, a, b, d = 1, simple = true, mm, k, n, both;
    if (tex.slice(0, 4) !== 'x = ') return null;
    s = tex.slice(4);
    if ((m = /^(.+) \\text\{ 또는 \} x = (.+)$/.exec(s))) {
      a = ratOf(m[1]); b = ratOf(m[2]); if (!a || !b) return null;
      return { roots: [[a.n, 0, 1, a.d], [b.n, 0, 1, b.d]], dbl: false, irr: false, simple: a.simple && b.simple && a.n * b.d < b.n * a.d && !(a.n === -b.n && a.d === b.d) };
    }
    if ((m = /^(.+) \\text\{ \(중근\)\}$/.exec(s))) { a = ratOf(m[1]); return a ? { roots: [[a.n, 0, 1, a.d]], dbl: true, irr: false, simple: a.simple } : null; }
    if ((a = ratOf(s))) return { roots: [[a.n, 0, 1, a.d]], dbl: false, irr: false, simple: a.simple };
    if ((m = /^\\pm (.+)$/.exec(s)) && (a = ratOf(m[1]))) return a.n > 0 ? { roots: [[-a.n, 0, 1, a.d], [a.n, 0, 1, a.d]], dbl: false, irr: false, simple: a.simple } : null;
    if ((m = /^\\pm \\dfrac\{(\d*)\\sqrt\{(\d+)\}\}\{(\d+)\}$/.exec(s))) { mm = 0; k = Number(m[1] || 1); n = Number(m[2]); d = Number(m[3]); both = true; simple = d > 1; }
    else {
      if ((m = /^\\dfrac\{(.+)\}\{(\d+)\}$/.exec(s))) { d = Number(m[2]); s = m[1]; simple = d > 1; }
      m = CORE.exec(s); if (!m) return null;
      mm = Number(m[1] || 0); k = Number(m[4] || 1); n = Number(m[5]); both = m[2] === '\\pm' || !!m[3];
      if (m[1] === '0' || m[4] === '1' || m[4] === '0' || (d > 1 && m[3])) simple = false;
    }
    if (n < 2 || Math.round(Math.sqrt(n)) * Math.round(Math.sqrt(n)) === n) return null;   /* 근호 안이 제곱수인 해는 쓰지 않는다 */
    simple = simple && squarefree(n) && gcdN(gcdN(mm, k), d) === 1;
    return { roots: both ? [[mm, -k, n, d], [mm, k, n, d]] : [[mm, k, n, d]], dbl: false, irr: true, simple: simple };
  };
  var sat = function (r, e) { return e[0] * (r[0] * r[0] + r[1] * r[1] * r[2]) + e[1] * r[0] * r[3] + e[2] * r[3] * r[3] === 0 && r[1] * (2 * e[0] * r[0] + e[1] * r[3]) === 0; };
  /** 방정식 e 의 해 전체인가 */
  var full = function (s, e) {
    var D = e[1] * e[1] - 4 * e[0] * e[2];
    return !!s && s.roots.every(function (r) { return sat(r, e); }) && (D === 0 ? s.dbl && s.roots.length === 1 : !s.dbl && s.roots.length === 2);
  };

  /** 해를 고르는 문제의 공통 검사 → { e: 계수, s: 답 } */
  var solveChecks = function (id, p, pr, where, bag) {
    var opts = MH.optionsOf(p), ms = MH.mistakesFor(p), e = coefs(pr.tex), s = solOf(p.answer), steps = MH.types[id].steps(p.v);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && ms.length === 3, where + '보기: ' + opts.join(' | '));
    ms.forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    ok(pr.text === '다음 이차방정식을 푸세요.' && !!e && e[0] !== 0 && e[1] * e[1] - 4 * e[0] * e[2] >= 0, where + '문제는 실수인 해가 있는 이차방정식: ' + pr.tex);
    if (!e) return null;
    ok(!!s && s.simple && full(s, e), where + '답은 해 전체이고 가장 간단한 꼴: ' + pr.tex + ' → ' + p.answer);
    ms.forEach(function (x) {
      var w = solOf(x.value);
      if (x.id === 'not-reduced') ok(!!w && full(w, e) && !w.simple, where + '덜 간단히 한 보기: ' + x.value);
      else ok(!!w && !full(w, e), where + '틀린 보기가 해이거나 읽을 수 없음: ' + x.value + ' (' + x.id + ')');
    });
    ok(steps.length >= 2 && steps[steps.length - 1].tex === p.answer, where + '풀이의 마지막 줄은 답');
    steps.forEach(function (st) { if (st.tex.indexOf('\\') < 0 && / = /.test(st.tex)) ok(same(coefs(st.tex), e), where + '풀이의 줄이 문제와 다른 방정식: ' + st.tex); });
    return { e: e, s: s || { roots: [], irr: false } };
  };

  group('B21 — 검사 도구 자체 검사');
  eq(String(coefs('(2x + 3)(x - 4) = 0')), '2,-5,-12', '곱셈 꼴 읽기');
  eq(String(coefs('x^{2} - 2x = 48')), '1,-2,-48', '정리가 안 된 식 읽기');
  eq(String(coefs('3(x - 2)^{2} = 81')), '3,-12,-69', '제곱 꼴 읽기');
  ok(same(coefs('x(x + 1) = 56'), coefs('2x^{2} + 2x - 112 = 0')) && !same(coefs('x^{2} = 4'), coefs('x^{2} = 5')), '같은 방정식');
  ok(full(solOf('x = -\\dfrac{3}{2} \\text{ 또는 } x = 4'), [2, -5, -12]) && !full(solOf('x = 4'), [2, -5, -12]) && !full(solOf('x = -4 \\text{ 또는 } x = \\dfrac{3}{2}'), [2, -5, -12]), '유리수인 해');
  ok(full(solOf('x = 3 \\text{ (중근)}'), [1, -6, 9]) && !full(solOf('x = \\pm 3'), [1, -6, 9]) && full(solOf('x = \\pm 3'), [1, 0, -9]) && !full(solOf('x = 3 \\text{ (중근)}'), [1, 0, -9]), '중근과 ±');
  ok(full(solOf('x = \\dfrac{-3 \\pm \\sqrt{13}}{2}'), [1, 3, -1]) && !full(solOf('x = \\dfrac{3 \\pm \\sqrt{13}}{2}'), [1, 3, -1]) && !full(solOf('x = \\dfrac{-3 + \\sqrt{13}}{2}'), [1, 3, -1]) && !full(solOf('x = -3 \\pm \\sqrt{13}'), [1, 3, -1]), '근의 공식 꼴');
  ok(full(solOf('x = 2 \\pm 2\\sqrt{3}'), [1, -4, -8]) && full(solOf('x = \\dfrac{4 \\pm \\sqrt{48}}{2}'), [1, -4, -8]) && solOf('x = 2 \\pm 2\\sqrt{3}').simple && !solOf('x = \\dfrac{4 \\pm \\sqrt{48}}{2}').simple && !solOf('x = \\dfrac{4 \\pm 4\\sqrt{3}}{2}').simple, '가장 간단한 꼴');
  ok(full(solOf('x = \\pm \\dfrac{\\sqrt{6}}{2}'), [2, 0, -3]) && full(solOf('x = \\pm 2\\sqrt{7}'), [1, 0, -28]) && solOf('x = \\pm \\sqrt{9}') === null && solOf('x = 2 또는 3') === null, '± 근호 꼴');
  ok(!solOf('x = \\dfrac{2}{4}').simple && !solOf('x = 3 \\text{ 또는 } x = 1').simple && !solOf('x = -3 \\text{ 또는 } x = 3').simple, '유리수 해의 꼴');
  done('도구');

  group('B21 — 한 근이 주어진 이차방정식 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B21.root', function (p, pr, level, where) {
    var def = MH.types['B21.root'], kind = MH.kinds.signed, ans = p.answer.n, ms = MH.mistakesFor(p), m, r, c, b, want, k, t = /한 근이 \$x = (-?\d+)\$일 때, (.*)$/.exec(pr.text);
    ok(p.answer.p === 0 && Number.isInteger(ans) && ans !== 0 && !!t, where + '답은 0 이 아닌 정수: ' + pr.text); if (!t) return;
    ms.forEach(function (x) { bag[x.id] = 1; ok(x.value.p === 0 && Number.isInteger(x.value.n) && x.value.n !== ans, where + '실수 값: ' + x.id); });
    ok(ms.length >= 2, where + '실수가 둘은 있어야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    detailed('B21.root', p, where);
    r = Number(t[1]);
    if ((m = /^x\^\{2\} \+ ax ([+-]) (\d+) = 0$/.exec(pr.tex))) {
      c = Number(m[2]) * (m[1] === '-' ? -1 : 1);
      if (/다른 한 근/.test(t[2])) { k = 'other'; want = c / r; ok(want !== r && Number.isInteger((r * r + c) / r), where + '다른 근은 주어진 근과 다른 정수'); }
      else { k = 'mid'; want = -(r * r + c) / r; ok(r * r + want * r + c === 0, where + '근을 넣으면 0'); }
    } else if ((m = /^x\^\{2\} ([+-]) (\d*)x \+ a = 0$/.exec(pr.tex))) {
      k = 'const'; b = Number(m[2] || 1) * (m[1] === '-' ? -1 : 1); want = -(r * r + b * r);
    } else { ok(false, where + '문제의 식: ' + pr.tex); return; }
    ok(k === 'other' ? t[2] === '다른 한 근을 구하세요. ($a$는 상수)' : t[2] === '상수 $a$의 값을 구하세요.', where + '묻는 말: ' + pr.text);
    kinds[level + k] = 1;
    eq(ans, want, where + '답: ' + pr.tex + ' / ' + pr.text);
  });
  eq(Object.keys(kinds).sort().join(' '), '0mid 1const 2other', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'constant-a half-plugged not-divided other-root root-copied root-negated square-sign sum-used', '실수의 종류');
  done('한 근');

  group('B21 — 인수분해로 풀기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B21.factor', function (p, pr, level, where) {
    var c = solveChecks('B21.factor', p, pr, where, bag), k, t = pr.tex; if (!c) return;
    ok(!c.s.irr, where + '해는 유리수: ' + p.answer);
    k = /^\(|^x\(/.test(t) ? 'prod' : !/ = 0$/.test(t) ? 'arr' : c.e[1] * c.e[1] === 4 * c.e[0] * c.e[2] ? 'dbl' : c.e[0] !== 1 ? 'lead' : 'std';
    kinds[level + k] = 1;
    ok(level === 0 ? k === 'prod' : level === 1 ? k === 'std' : k === 'dbl' || k === 'arr' || k === 'lead', where + '단계에 맞는 식: ' + t);
    if (k !== 'prod' && k !== 'arr') ok(/^\d*x\^\{2\} [+-] \d*x( [+-] \d+)? = 0$/.test(t) && gcdN(gcdN(c.e[0], c.e[1]), c.e[2]) === 1, where + '정리된 식: ' + t);
    if (k === 'prod') ok(/^(x|\(\d*x [+-] \d+\))\(x [+-] \d+\) = 0$/.test(t), where + '곱셈 꼴: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0prod 1std 2arr 2dbl 2lead', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-ignored inverted middle-kept middle-used not-arranged not-rooted one-only one-sign plus-minus product-only signs-kept', '실수의 종류');
  done('인수분해');

  group('B21 — 제곱근으로 풀기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B21.sqrt', function (p, pr, level, where) {
    var c = solveChecks('B21.sqrt', p, pr, where, bag), t = pr.tex; if (!c) return;
    kinds[level + (c.s.irr ? 'i' : 'r')] = 1;
    ok(level === 0 ? /^\d*x\^\{2\}( - \d+ = 0| = \d+)$/.test(t) : level === 1 ? /^\(x [+-] \d+\)\^\{2\} = \d+$/.test(t) : /^\d+\(x [+-] \d+\)\^\{2\} = \d+$|^\(x [+-] \d+\)\^\{2\} - \d+ = 0$/.test(t), where + '단계에 맞는 식: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0i 0r 1i 1r 2i 2r', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'halved moved-inside not-divided not-rooted positive-only shift-lost shift-sign square-out', '실수의 종류');
  done('제곱근');

  group('B21 — 완전제곱식으로 풀기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B21.complete', function (p, pr, level, where) {
    var t = pr.tex, c, e, a, opts, ms, steps, m;
    ok(/^\d*x\^\{2\} [+-] \d+x [+-] \d+ = 0$/.test(t), where + '정리된 식: ' + t);
    if (level > 0) {
      c = solveChecks('B21.complete', p, pr, where, bag); if (!c) return;
      ok(c.s.irr && c.e[1] % (2 * c.e[0]) === 0 && c.e[2] % c.e[0] === 0 && (level === 1 ? c.e[0] === 1 : c.e[0] > 1), where + '단계에 맞는 식: ' + t);
      ok(MH.types['B21.complete'].steps(p.v).some(function (st) { return /^\(x [+-] \d+\)\^\{2\} = \d+$/.test(st.tex); }), where + '풀이에 완전제곱식이 있어야 함');
      kinds[level + 'solve'] = 1; return;
    }
    /* 0단계: (x + p)² = q 꼴로 고치기. 답은 문제와 같은 방정식, 틀린 보기는 다른 방정식 */
    e = coefs(t); a = coefs(p.answer); opts = MH.optionsOf(p); ms = MH.mistakesFor(p); steps = MH.types['B21.complete'].steps(p.v);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && /^\(x [+-] \d+\)\^\{2\} = -?\d+$/.test(o); }) && opts.indexOf(p.answer) >= 0 && ms.length === 3, where + '보기: ' + opts.join(' | '));
    ms.forEach(function (x) { bag[x.id] = 1; ok(!same(coefs(x.value), e), where + '틀린 보기가 같은 방정식: ' + x.value); });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed('B21.complete', p, where);
    m = /= (-?\d+)$/.exec(p.answer);
    ok(pr.text === '다음 이차방정식을 $(x + p)^{2} = q$ 꼴로 고친 것을 고르세요.' && !!e && e[0] === 1 && same(a, e) && Number(m[1]) > 0, where + '답은 문제와 같은 방정식: ' + t + ' → ' + p.answer);
    ok(steps[steps.length - 1].tex === p.answer && steps.every(function (st) { return same(coefs(st.tex), e); }), where + '풀이의 줄: ' + steps.map(function (st) { return st.tex; }).join(' / '));
    kinds['0form'] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0form 1solve 2solve', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'const-sign half-not-squared inner-sign not-divided not-halved not-rooted only-moved positive-only right-sign', '실수의 종류');
  done('완전제곱식');

  group('B21 — 근의 공식 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B21.formula', function (p, pr, level, where) {
    var c = solveChecks('B21.formula', p, pr, where, bag), t = pr.tex, e, D, raw, steps; if (!c) return;
    e = c.e; D = e[1] * e[1] - 4 * e[0] * e[2]; raw = 'x = \\dfrac{' + (-e[1]) + ' \\pm \\sqrt{' + D + '}}{' + 2 * e[0] + '}'; steps = MH.types['B21.formula'].steps(p.v);
    ok(/^\d*x\^\{2\} [+-] \d*x [+-] \d+ = 0$/.test(t) && gcdN(gcdN(e[0], e[1]), e[2]) === 1 && c.s.irr, where + '정리된 식이고 해는 무리수: ' + t);
    ok(steps.some(function (st) { return st.tex === raw; }) && steps[0].tex === 'a = ' + e[0] + ',\\quad b = ' + e[1] + ',\\quad c = ' + e[2], where + '풀이에 계수와 공식에 넣은 줄이 있어야 함: ' + raw);
    ok(level === 0 ? e[0] === 1 && p.answer === raw : level === 1 ? e[0] > 1 && p.answer === raw : p.answer !== raw, where + '단계에 맞는 식: ' + t + ' → ' + p.answer);
    kinds[level + (/dfrac/.test(p.answer) ? 'f' : 'n')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0f 1f 2f 2n', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'a-lost ac-sign b-sign four-lost not-reduced partial-reduce positive-only two-lost', '실수의 종류');
  done('근의 공식');

  group('B21 — 이차방정식의 활용 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  /** 1 ~ 999 가운데 조건에 맞는 자연수가 하나뿐이면 그 수 */
  var only = function (fn) { var hit = [], x; for (x = 1; x < 1000; x++) if (fn(x)) hit.push(x); return hit.length === 1 ? hit[0] : NaN; };
  var first = function (fn) { for (var x = 1; x < 1000; x++) if (fn(x)) return x; return NaN; };
  each('B21.apply', function (p, pr, level, where) {
    var def = MH.types['B21.apply'], kind = MH.kinds.int, ans = p.answer, t = pr.text, ms = MH.mistakesFor(p), steps = def.steps(p.v), m, want, k, a, b, c;
    ms.forEach(function (x) { bag[x.id] = 1; ok(Number.isInteger(x.value) && x.value >= 1 && x.value !== ans, where + '실수 값: ' + x.id + ' ' + x.value); });
    ok(ms.length >= 1 && !pr.tex, where + '실수가 하나는 있어야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    detailed('B21.apply', p, where);
    ok(Number.isInteger(ans) && ans >= 1 && steps.length >= 3 && steps[steps.length - 1].tex === 'x = ' + ans, where + '답은 자연수, 풀이의 마지막 줄은 x = 답');
    if ((m = /^연속하는 두 자연수의 곱이 \$(\d+)\$일 때, 두 수 가운데 작은 수를 구하세요\.$/.exec(t))) { k = 'consec'; a = Number(m[1]); want = only(function (x) { return x * (x + 1) === a; }); }
    else if ((m = /^연속하는 두 자연수의 제곱의 합이 \$(\d+)\$일 때, 두 수 가운데 작은 수를 구하세요\.$/.exec(t))) { k = 'sqsum'; a = Number(m[1]); want = only(function (x) { return x * x + (x + 1) * (x + 1) === a; }); }
    else if ((m = /^어떤 자연수를 제곱한 수는 그 수의 \$(\d+)\$배보다 \$(\d+)\$만큼 커요\. 이 자연수를 구하세요\.$/.exec(t))) { k = 'kplus'; a = Number(m[1]); b = Number(m[2]); ok(a >= 2, where + '1배는 쓰지 않음'); want = only(function (x) { return x * x === a * x + b; }); }
    else if ((m = /^가로의 길이가 세로의 길이보다 \$(\d+)\\,\\mathrm\{cm\}\$ 더 긴 직사각형이 있어요\. 넓이가 \$(\d+)\\,\\mathrm\{cm\}\^\{2\}\$일 때, 세로의 길이는 몇 cm인가요\?$/.exec(t))) { k = 'rect'; a = Number(m[1]); b = Number(m[2]); want = only(function (x) { return x * (x + a) === b; }); }
    else if ((m = /^정사각형의 가로를 \$(\d+)\\,\\mathrm\{cm\}\$ 늘이고 세로를 \$(\d+)\\,\\mathrm\{cm\}\$ 줄였더니 넓이가 \$(\d+)\\,\\mathrm\{cm\}\^\{2\}\$인 직사각형이 되었어요\. 처음 정사각형의 한 변의 길이는 몇 cm인가요\?$/.exec(t))) { k = 'square'; a = Number(m[1]); b = Number(m[2]); c = Number(m[3]); want = only(function (x) { return x > b && (x + a) * (x - b) === c; }); ok(want * want !== c, where + '넓이가 그대로이면 안 됨'); }
    else if ((m = /^둘레의 길이가 \$(\d+)\\,\\mathrm\{cm\}\$이고 넓이가 \$(\d+)\\,\\mathrm\{cm\}\^\{2\}\$인 직사각형이 있어요\. 가로가 세로보다 길 때, 가로의 길이는 몇 cm인가요\?$/.exec(t))) { k = 'peri'; a = Number(m[1]); b = Number(m[2]); ok(a % 2 === 0, where + '둘레는 짝수'); want = only(function (x) { var h = a / 2 - x; return h >= 1 && x > h && x * h === b; }); }
    else if ((m = /^지면에서 초속 \$(\d+)\\,\\mathrm\{m\}\$로 똑바로 위로 던진 공의 \$x\$초 후의 높이는 \$\((\d+)x - 5x\^\{2\}\)\\,\\mathrm\{m\}\$예요\. (.*)$/.exec(t))) {
      a = Number(m[1]); ok(m[1] === m[2], where + '속력과 식의 계수가 같아야 함');
      if ((c = /^공의 높이가 처음으로 \$(\d+)\\,\\mathrm\{m\}\$가 되는 것은 던진 지 몇 초 후인가요\?$/.exec(m[3]))) { k = 'throw'; b = Number(c[1]); want = first(function (x) { return a * x - 5 * x * x === b; }); ok(only(function (x) { return x > want && a * x - 5 * x * x === b; }) > want, where + '같은 높이를 두 번 지나야 함'); }
      else if (m[3] === '공이 다시 지면에 떨어지는 것은 던진 지 몇 초 후인가요?') { k = 'ground'; want = only(function (x) { return a * x - 5 * x * x === 0; }); }
      else { ok(false, where + '문제의 글: ' + t); return; }
    } else if ((m = /^가로 \$(\d+)\\,\\mathrm\{m\}\$, 세로 \$(\d+)\\,\\mathrm\{m\}\$인 직사각형 모양의 땅에 폭이 일정한 길을 가로 방향과 세로 방향으로 하나씩 냈어요\. 길을 뺀 나머지 땅의 넓이가 \$(\d+)\\,\\mathrm\{m\}\^\{2\}\$일 때, 길의 폭은 몇 m인가요\?$/.exec(t))) {
      k = 'road'; a = Number(m[1]); b = Number(m[2]); c = Number(m[3]); ok(a > b, where + '가로가 더 긴 땅'); want = only(function (x) { return x < b && (a - x) * (b - x) === c; });
    } else { ok(false, where + '문제의 글: ' + t); return; }
    kinds[level + k] = 1;
    eq(ans, want, where + '답: ' + t);
    /* 풀이의 방정식 줄(문자가 x 뿐인 등식)은 모두 같은 방정식이고, 답이 그 방정식의 해여야 한다 */
    var eqs = steps.map(function (st) { return coefs(st.tex); }).filter(function (e) { return !!e && e[0] !== 0; });
    ok(eqs.length >= 2 && eqs.every(function (e) { return same(e, eqs[0]) && e[0] * ans * ans + e[1] * ans + e[2] === 0; }), where + '풀이의 방정식: ' + steps.map(function (st) { return st.tex; }).join(' / '));
  });
  eq(Object.keys(kinds).sort().join(' '), '0consec 0kplus 0sqsum 1peri 1rect 1square 2ground 2road 2throw', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'difference half-perimeter larger left-height left-width new-height new-width other-root peak-time root-sum second-time smaller speed-copied sum-given time-sum', '실수의 종류');
  done('활용');
})();
