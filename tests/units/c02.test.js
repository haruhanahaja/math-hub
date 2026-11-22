/* C02 항등식과 나머지정리 — 단원 전용 검사.
   화면에 보이는 식을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어 답을 따로 구한다. 단원 파일의 계산과 무관하다.
   · 항등식의 모르는 계수는, 식이 문자에 대해 일차라는 것만 써서 수를 여러 개 넣은 연립방정식을 여기서 직접 풀어 구한다.
   · 나머지 · 몫은 여기서 따로 만든 세로 나눗셈으로 구한다. 조립제법의 표는 칸마다 규칙(대각선은 곱하기, 세로는 더하기)이 맞는지 본다. */
(function () {
  'use strict';
  var N = 1000, sig = ALG.sig, calc = ALG.calc, Q = ALG.Q, noJosa = ALG.noJosa, isInt = Number.isInteger;
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
    if (p.seed <= 300) all.forEach(function (t) { ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object/.test(t), where + '글: ' + t); });
    ok(!/undefined|NaN|null|object/.test(JSON.stringify(MH.types[id].steps(p.v))), where + '풀이에 undefined');
  };
  var termsOf = function (t) { return t.replace(/ - /g, ' + -').split(' + '); };
  var readPoly = function (t) {
    var cs = [], i;
    termsOf(t).forEach(function (term) {
      var m = /^(-?)(\d*)(?:(x)(?:\^\{(\d+)\})?)?$/.exec(term), d;
      if (!m || (m[2] === '' && !m[3])) throw new Error('다항식이 아님: ' + t);
      d = m[3] ? Number(m[4] || 1) : 0; cs[d] = (cs[d] || 0) + (m[1] ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2]));
    });
    for (i = 0; i < cs.length; i++) cs[i] = cs[i] || 0;
    return cs;
  };
  var trim = function (cs) { cs = cs.slice(); while (cs.length && !cs[cs.length - 1]) cs.pop(); return cs; };
  var sameP = function (x, y) { return trim(x).join(',') === trim(y).join(','); };
  var divP = function (a, b) {
    var q = [], db = b.length - 1, i, j, c;
    a = a.slice();
    for (i = a.length - 1; i >= db; i--) { c = a[i] / b[db]; if (!isInt(c)) return null; q[i - db] = c; for (j = 0; j <= db; j++) a[i - db + j] -= c * b[j]; }
    return { q: q, r: a.slice(0, db) };
  };
  var evalP = function (cs, x) { var s = 0, i; for (i = cs.length - 1; i >= 0; i--) s = s * x + cs[i]; return s; };
  var descending = function (t) { var ds = termsOf(t).map(function (term) { var m = /x(?:\^\{(\d+)\})?/.exec(term); return m ? Number(m[1] || 1) : 0; }); return ds.every(function (d, i) { return i === 0 || ds[i - 1] > d; }); };
  /* ── 분수 계산(BigInt) 과 연립일차방정식 ── */
  var qi = function (n) { return Q(BigInt(n), 1n); };
  var qsub = function (a, b) { return Q(a.n * b.d - b.n * a.d, a.d * b.d); }, qmul = function (a, b) { return Q(a.n * b.n, a.d * b.d); }, qdiv = function (a, b) { return Q(a.n * b.d, a.d * b.n); };
  var qnum = function (a) { return a.d === 1n ? Number(a.n) : NaN; };
  /** fns: 문자의 값(env)을 받아 0 이 되어야 하는 값을 돌려주는 함수들. 문자에 대해 일차라는 것만 써서 문자의 값을 구한다. 풀 수 없거나 해가 하나가 아니면 null */
  var solveLinear = function (fns, names) {
    var zero = {}, rows, n = names.length, i, j, k, piv, f, out = {};
    names.forEach(function (nm) { zero[nm] = qi(0); });
    rows = fns.map(function (fn) {
      var f0 = fn(zero), row = names.map(function (nm) { var e = {}; names.forEach(function (x) { e[x] = qi(x === nm ? 1 : 0); }); return qsub(fn(e), f0); });
      row.push(qsub(qi(0), f0)); return row;
    });
    for (i = 0; i < n; i++) {
      piv = -1; for (j = i; j < rows.length; j++) if (rows[j][i].n !== 0n) { piv = j; break; }
      if (piv < 0) return null;
      f = rows[piv]; rows[piv] = rows[i]; rows[i] = f;
      for (j = 0; j < rows.length; j++) if (j !== i && rows[j][i].n !== 0n) { f = qdiv(rows[j][i], rows[i][i]); for (k = i; k <= n; k++) rows[j][k] = qsub(rows[j][k], qmul(f, rows[i][k])); }
    }
    for (j = n; j < rows.length; j++) if (rows[j][n].n !== 0n) return null;                       /* 남은 식이 어긋나면 해가 없다 */
    names.forEach(function (nm, idx) { out[nm] = qnum(qdiv(rows[idx][n], rows[idx][idx])); });
    return out;
  };
  /** 「왼쪽 = 오른쪽」 이 x 에 대한 항등식이 되게 하는 문자의 값 */
  var solveIdentity = function (tex, names) {
    var parts = tex.split(' = ');
    return solveLinear([0, 1, 2, 3, -1, -2, 5].slice(0, names.length + 2).map(function (x) { return function (env) { var e = { x: qi(x) }; names.forEach(function (nm) { e[nm] = env[nm]; }); return qsub(calc(parts[0], e), calc(parts[1], e)); }; }), names);
  };
  var at = function (tex, x, more) { var e = { x: typeof x === 'object' ? x : qi(x) }; Object.keys(more || {}).forEach(function (k) { e[k] = more[k]; }); return calc(tex, e); };
  var eqLine = function (tex) { var parts = tex.split(' = ').map(sig); return parts.length >= 2 && parts.every(function (x) { return !!x && x === parts[0]; }); };
  /** 식 속의 문자(명령어 \\times 등의 글자는 빼고)를 그 값으로 바꾼다 */
  var subLetters = function (t, names, sol) { return t.replace(/\\[a-zA-Z]+|[a-ek]/g, function (m) { return m.charAt(0) !== '\\' && names.indexOf(m) >= 0 ? '(' + sol[m] + ')' : m; }); };
  var lettersIn = function (tex) { return ['a', 'b', 'c', 'd', 'e', 'k'].filter(function (l) { return tex.replace(/\\[a-z]+/g, '').indexOf(l) >= 0; }); };

  var choiceBase = function (id, p, where, bag) {
    var opts = MH.optionsOf(p);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    return opts;
  };
  var numChecks = function (id, p, where, bag) {
    var def = MH.types[id], kind = MH.kinds[def.answer.kind], ans = p.answer.n, steps = def.steps(p.v);
    ok(p.answer.p === 0 && isInt(ans) && ans !== 0, where + '답은 0 이 아닌 정수');
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; ok(isInt(x.value.n) && x.value.n !== ans && x.value.n !== -ans && x.value.n !== 0, where + '실수 값: ' + x.id + ' ' + x.value.n); });
    ok(MH.mistakesFor(p).length >= 2, where + '실수가 둘은 있어야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    detailed(id, p, where);
    ok(Number(steps[steps.length - 1].tex.split(' = ').pop()) === ans, where + '풀이의 마지막 줄: ' + steps[steps.length - 1].tex);
    return ans;
  };

  group('C02 — 검사 도구 자체 검사');
  var s0 = solveIdentity('a(x + 1) + b(x - 1) = 5x + 1', ['a', 'b']);
  ok(!!s0 && s0.a === 3 && s0.b === 2 && solveIdentity('ax + 2 = 3x + 5', ['a']) === null && solveIdentity('(2x - 1)^{3} = ax^{3} + bx^{2} + cx + d', ['a', 'b', 'c', 'd']).b === -12, '항등식 풀기');
  ok(sameP(divP([5, -2, 0, 1], [-2, 1]).q, [2, 2, 1]) && divP([5, -2, 0, 1], [-2, 1]).r[0] === 9 && evalP([5, -2, 0, 1], 2) === 9, '세로 나눗셈 · 값 넣기');
  done('도구');

  group('C02 — 항등식 가려내기 (단계마다 1,000문제)');
  var bag = {}, kinds = {}, sets = {};
  each('C02.identity', function (p, pr, level, where) {
    var opts = choiceBase('C02.identity', p, where, bag), idn = opts.filter(function (o) { var parts = o.split(' = '); return parts.length === 2 && sig(parts[0]) === sig(parts[1]); });
    ok(opts.every(function (o) { return o.split(' = ').length === 2 && !!sig(o.split(' = ')[0]) && !!sig(o.split(' = ')[1]); }), where + '보기는 모두 등식: ' + opts.join(' | '));
    eq(pr.text, level === 2 ? '다음 중 $x$에 대한 항등식이 아닌 것을 고르세요.' : '다음 중 $x$에 대한 항등식을 고르세요.', where + '문제 글');
    if (level === 2) ok(idn.length === 3 && idn.indexOf(p.answer) < 0, where + '항등식이 아닌 것은 답 하나뿐: ' + opts.join(' | '));
    else ok(idn.length === 1 && idn[0] === p.answer, where + '항등식은 답 하나뿐: ' + opts.join(' | '));
    /* 실수 설명에 적은 수: x 에 그 수를 넣은 양쪽의 값 */
    MH.mistakesFor(p).forEach(function (x) {
      var m = /^\$x = (-?\d+)\$[을를] 넣어 보면 왼쪽은 \$(-?\d+)\$, 오른쪽은 \$(-?\d+)\$\./.exec(x.explain), parts = x.value.split(' = ');
      if (level === 2) return ok(/항등식이에요/.test(x.explain), where + '설명: ' + x.explain);
      ok(!!m && qnum(at(parts[0], Number(m[1]))) === Number(m[2]) && qnum(at(parts[1], Number(m[1]))) === Number(m[3]) && m[2] !== m[3], where + '설명에 적은 값: ' + x.value + ' / ' + x.explain);
    });
    (sets[level] = sets[level] || {})[opts.slice().sort().join('|')] = 1; kinds[level + (/\^\{2\} = |\)\(/.test(p.answer) ? 'formula' : 'simple')] = 1;
  });
  [0, 1, 2].forEach(function (l) { ok(Object.keys(sets[l]).length >= 900, 'C02.identity ' + l + '단계: 보기 묶음이 ' + Object.keys(sets[l]).length + '가지뿐'); });
  eq(Object.keys(kinds).sort().join(' '), '0simple 1formula 2formula 2simple', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'eq-collect eq-conj eq-dist eq-linear eq-quad eq-sq eq-xab id-collect id-conj id-dist id-sq id-xab', '실수의 종류');
  done('항등식 가려내기');

  group('C02 — 계수 비교법 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('C02.coef', function (p, pr, level, where) {
    var ans = numChecks('C02.coef', p, where, bag), m = /^다음 등식이 \$x\$에 대한 항등식일 때, 상수 \$([abc])\$의 값을 구하세요\.$/.exec(pr.text), names = lettersIn(pr.tex), sol, steps = MH.types['C02.coef'].steps(p.v), sub;
    ok(!!m && names.indexOf(m[1]) >= 0, where + '문제 글: ' + pr.text); if (!m) return;
    sol = solveIdentity(pr.tex, names);
    ok(!!sol && sol[m[1]] === ans, where + '답: ' + pr.tex + ' → ' + JSON.stringify(sol) + ' / ' + ans); if (!sol) return;
    ok(names.every(function (nm) { return isInt(sol[nm]) && sol[nm] !== 0; }), where + '문자의 값은 모두 0 이 아닌 정수: ' + JSON.stringify(sol));
    sub = function (t) { return subLetters(t, names, sol); };
    ok(steps.length === 4 && eqLine(sub(steps[0].tex)) && steps[1].tex.split(',\\quad ').every(function (e) { return eqLine(sub(e)); }) && steps[2].tex.split(',\\quad ').every(function (e) { return eqLine(sub(e)); }) && steps[2].tex.split(',\\quad ').length === names.length,
      where + '풀이의 줄(값을 넣으면 모두 성립): ' + steps.map(function (s) { return s.tex; }).join(' / '));
    eq(sig(steps[0].tex.split(' = ')[0]), sig(pr.tex.split(' = ')[0]), where + '풀이 첫 줄의 왼쪽은 문제의 왼쪽을 전개한 것');
    kinds[level + String(names.length) + (/\^\{2\}/.test(pr.tex) ? 'q' : 'l')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '02l 12l 22q 23q', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'b-ignored const-only half moved-wrong no-const no-dist no-double not-moved one-only other p-squared sum sum-for-product', '실수의 종류');
  done('계수 비교법');

  group('C02 — 수치 대입법 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('C02.subst', function (p, pr, level, where) {
    var ans = numChecks('C02.subst', p, where, bag), names = lettersIn(pr.tex), sol = solveIdentity(pr.tex, names), m, want, steps = MH.types['C02.subst'].steps(p.v), sub;
    ok(!!sol && names.every(function (nm) { return isInt(sol[nm]); }), where + '항등식을 풀 수 있어야 함: ' + pr.tex); if (!sol) return;
    sub = function (t) { return subLetters(t, names, sol); };
    if ((m = /^다음 등식이 \$x\$에 대한 항등식일 때, 상수 \$([a-e])\$의 값을 구하세요\.$/.exec(pr.text))) { want = sol[m[1]]; kinds[level + (level === 2 ? 'const' : 'one' + names.length)] = 1; }
    else if ((m = /^다음 등식이 \$x\$에 대한 항등식일 때, \$([a-e +-]+)\$의 값을 구하세요\.$/.exec(pr.text))) { want = qnum(calc(sub(m[1]), {})); kinds[level + (/-/.test(m[1]) ? 'alt' : 'all')] = 1; ok(m[1].replace(/[ +-]/g, '') === names.join(''), where + '구하는 식: ' + m[1]); }
    else { ok(false, where + '문제 글: ' + pr.text); return; }
    eq(ans, want, where + '답: ' + pr.tex + ' ' + pr.text);
    ok(steps.length >= 2 && steps.every(function (s) { return s.tex.split(',\\quad ').every(function (e) { return e.indexOf(' = ') < 0 || eqLine(sub(e)); }); }), where + '풀이의 줄(값을 넣으면 모두 성립): ' + steps.map(function (s) { return s.tex; }).join(' / '));
    ok(level === 2 ? /^\(\d*x [+-] \d+\)\^\{[234]\} = /.test(pr.tex) : names.every(function (nm) { return sol[nm] !== 0; }), where + '식의 꼴: ' + pr.tex);
  });
  eq(Object.keys(kinds).sort().join(' '), '0one2 1one2 1one3 2all 2alt 2const', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'all-mixed alt-mixed const-compared ends-only last-forgotten lead-mixed no-divide no-power other other-root sign-sub times-n', '실수의 종류');
  done('수치 대입법');

  group('C02 — 나머지정리 (단계마다 1,000문제)');
  bag = {};
  each('C02.remainder', function (p, pr, level, where) {
    var ans = numChecks('C02.remainder', p, where, bag), body = pr.tex.replace(/^P\(x\) = /, ''), steps = MH.types['C02.remainder'].steps(p.v), m, B, d, root, sol;
    ok(pr.tex.indexOf('P(x) = ') === 0, where + '문제의 식: ' + pr.tex);
    if (level < 2) {
      m = /^다항식 \$P\(x\)\$를 \$([^$]+)\$(으로|로) 나누었을 때의 나머지를 구하세요\.$/.exec(pr.text); ok(!!m, where + '문제 글: ' + pr.text); if (!m) return;
      B = readPoly(m[1]); d = divP(readPoly(body), B);
      ok(B.length === 2 && (level === 0 ? B[1] === 1 : B[1] >= 2) && descending(body), where + '단계에 맞는 식: ' + m[1]);
      ok(!!d && d.r.length === 1 && d.r[0] === ans, where + '나머지(세로 나눗셈): ' + pr.tex + ' ÷ ' + m[1] + ' → ' + ans);
      eq(qnum(at(body, Q(BigInt(-B[0]), BigInt(B[1])))), ans, where + '나머지(값 넣기)');
      ok(steps.some(function (s) { var t = /^P.*?\) = (.+)$/.exec(s.tex); return !!t && /^P\\left|^P\(-?\d+\)/.test(s.tex) && sig(t[1]) === sig(String(ans)); }), where + '풀이에 수를 넣은 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
    } else {
      m = /^다항식 \$P\(x\)\$를 \$x ([+-]) (\d+)\$(으로|로) 나누었을 때의 나머지가 \$(-?\d+)\$일 때, 상수 \$k\$의 값을 구하세요\.$/.exec(pr.text); ok(!!m, where + '문제 글: ' + pr.text); if (!m) return;
      root = (m[1] === '-' ? 1 : -1) * Number(m[2]);
      sol = solveLinear([function (env) { return qsub(at(body, root, env), qi(Number(m[4]))); }], ['k']);
      ok(!!sol && sol.k === ans && /k/.test(body), where + '답: ' + pr.tex + ' → ' + JSON.stringify(sol));
      ok(steps.length === 3 && steps.every(function (s) { return eqLine(s.tex.replace(/k/g, '(' + ans + ')')); }), where + '풀이의 줄(k 를 넣으면 성립): ' + steps.map(function (s) { return s.tex; }).join(' / '));
    }
  });
  eq(Object.keys(bag).sort().join(' '), 'b-direct coef-sum const-kept lead-only moved-wrong no-divide not-divided sign-sub zero-remainder', '실수의 종류');
  done('나머지정리');

  group('C02 — 인수 찾기 (단계마다 1,000문제)');
  bag = {};
  each('C02.isfactor', function (p, pr, level, where) {
    var opts = choiceBase('C02.isfactor', p, where, bag), P = readPoly(pr.tex.replace(/^P\(x\) = /, '')), root = function (o) { var m = /^x ([+-]) (\d+)$/.exec(o); return m ? (m[1] === '-' ? 1 : -1) * Number(m[2]) : NaN; }, zero;
    ok(pr.tex.indexOf('P(x) = ') === 0 && opts.every(function (o) { return isInt(root(o)); }) && P.length === (level === 0 ? 3 : 4), where + '문제 · 보기의 꼴: ' + pr.tex + ' / ' + opts.join(' | '));
    zero = opts.filter(function (o) { return evalP(P, root(o)) === 0; });
    eq(pr.text, level === 2 ? '다음 중 다항식 $P(x)$의 인수가 아닌 것을 고르세요.' : '다음 중 다항식 $P(x)$의 인수인 것을 고르세요.', where + '문제 글');
    if (level === 2) ok(zero.length === 3 && zero.indexOf(p.answer) < 0, where + '인수가 아닌 것은 답 하나뿐: ' + opts.join(' | '));
    else { ok(zero.length === 1 && zero[0] === p.answer, where + '인수는 답 하나뿐: ' + opts.join(' | ')); ok(!!divP(P, [-root(p.answer), 1]) && divP(P, [-root(p.answer), 1]).r[0] === 0, where + '답으로 나누어떨어짐'); }
    MH.mistakesFor(p).forEach(function (x) { var m = /\$P\((-?\d+)\) = (-?\d+)\$/.exec(x.explain); ok(!!m && Number(m[1]) === root(x.value) && evalP(P, Number(m[1])) === Number(m[2]) && (x.id === 'sign-flipped') === (level < 2 && root(x.value) === -root(p.answer)), where + '설명에 적은 값: ' + x.value + ' / ' + x.explain); });
    MH.types['C02.isfactor'].steps(p.v).slice(0, 2).forEach(function (s) { s.tex.split(',\\quad ').forEach(function (e) { var m = /^P\((-?\d+)\) = (-?\d+)$/.exec(e); ok(!!m && evalP(P, Number(m[1])) === Number(m[2]), where + '풀이의 값: ' + e); }); });
  });
  eq(Object.keys(bag).sort().join(' '), 'is-factor-a is-factor-b is-factor-c not-zero-a not-zero-b not-zero-c sign-flipped', '실수의 종류');
  done('인수 찾기');

  group('C02 — 인수정리로 계수 구하기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('C02.factor', function (p, pr, level, where) {
    var ans = numChecks('C02.factor', p, where, bag), body = pr.tex.replace(/^P\(x\) = /, ''), names = lettersIn(body), steps = MH.types['C02.factor'].steps(p.v), m, roots, sol, ask, sub;
    if (level < 2) { m = /^다항식 \$P\(x\)\$가 \$x ([+-]) (\d+)\$(으로|로) 나누어떨어질 때, 상수 \$(k)\$의 값을 구하세요\.$/.exec(pr.text); roots = m ? [(m[1] === '-' ? 1 : -1) * Number(m[2])] : []; ask = 'k'; }
    else { m = /^다항식 \$P\(x\)\$가 \$x ([+-]) (\d+)\$[과와] \$x ([+-]) (\d+)\$(으로|로) 모두 나누어떨어질 때, 상수 \$([ab])\$의 값을 구하세요\.$/.exec(pr.text); roots = m ? [(m[1] === '-' ? 1 : -1) * Number(m[2]), (m[3] === '-' ? 1 : -1) * Number(m[4])] : []; ask = m && m[6]; }
    ok(!!m && names.length === roots.length && names.indexOf(ask) >= 0 && roots[0] !== roots[1], where + '문제의 꼴: ' + pr.tex + ' / ' + pr.text); if (!m) return;
    sol = solveLinear(roots.map(function (r) { return function (env) { return at(body, r, env); }; }), names);
    ok(!!sol && sol[ask] === ans && names.every(function (nm) { return isInt(sol[nm]) && sol[nm] !== 0; }), where + '답: ' + pr.tex + ' → ' + JSON.stringify(sol) + ' / ' + ans); if (!sol) return;
    sub = function (t) { return subLetters(t, names, sol); };
    ok(steps.length === 3 && steps.slice(0, 2).every(function (s) { return s.tex.split(',\\quad ').every(function (e) { return eqLine(sub(e)); }); }), where + '풀이의 줄(값을 넣으면 성립): ' + steps.map(function (s) { return s.tex; }).join(' / '));
    /* 구한 값을 넣은 식은 실제로 나누어떨어진다 */
    roots.forEach(function (r) { var d = divP(readPoly(sub(body).replace(/\((-?\d+)\)/g, '$1').replace(/\+ -/g, '- ').replace(/(^|[ -])1x/g, '$1x')), [-r, 1]); ok(!d || d.r[0] === 0, where + '나누어떨어짐'); });
    kinds[level + String(names.length) + (level < 2 ? String(readDeg(body)) : '')] = 1;
  });
  function readDeg(t) { var m = /x\^\{(\d)\}/.exec(t); return m ? Number(m[1]) : 1; }
  eq(Object.keys(kinds).sort().join(' '), '012 113 22', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'both-added const-forgotten no-divide one-remainder one-root-only other power-ignored sign-sub', '실수의 종류');
  done('인수정리로 계수 구하기');

  /** 조립제법의 표 읽기: { r, top, mid, bot }. 빈칸(□)은 fill 로 채운다 */
  var readTable = function (tex, fill) {
    var m = /^\\begin\{array\}\{c\|(c+)\} (.+) \\\\ & & (.+) \\\\ \\hline & (.+) \\end\{array\}$/.exec(tex), num = function (s) { return s === '\\square' ? fill : Number(s); }, top;
    if (!m) return null;
    top = m[2].split(' & ').map(num);
    return { n: m[1].length, r: top[0], top: top.slice(1), mid: m[3].split(' & ').map(num), bot: m[4].split(' & ').map(num), blanks: (tex.match(/\\square/g) || []).length };
  };
  var tableOk = function (t) {
    return t.top.length === t.n && t.mid.length === t.n - 1 && t.bot.length === t.n && t.bot[0] === t.top[0]
      && t.mid.every(function (v, i) { return v === t.r * t.bot[i]; }) && t.bot.slice(1).every(function (v, i) { return v === t.top[i + 1] + t.mid[i]; });
  };
  var tableText = function (text) { return /^위의 표는 \$\((.+)\) \\div \(x ([+-]) (\d+)\)\$[을를] 조립제법으로 /.exec(text); };

  group('C02 — 조립제법의 빈칸 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('C02.synth', function (p, pr, level, where) {
    var ans = numChecks('C02.synth', p, where, bag), t = readTable(pr.tex, ans), m = tableText(pr.text), P, row;
    ok(!!t && !!m && t.blanks === 1 && /과정이에요\. □에 알맞은 수를 구하세요\.$/.test(pr.text), where + '문제의 꼴: ' + pr.tex + ' / ' + pr.text); if (!t || !m) return;
    P = readPoly(m[1]);
    ok(tableOk(t), where + '답을 넣으면 표의 규칙이 모두 맞아야 함: ' + pr.tex + ' ← ' + ans);
    ok(sameP(P, t.top.slice().reverse()) && P.length === t.n && t.r === (m[2] === '-' ? 1 : -1) * Number(m[3]) && t.n === (level === 2 ? 5 : 4), where + '표의 윗줄 · 왼쪽 수가 식과 맞아야 함: ' + pr.text);
    row = /& \\square.*\\hline/.test(pr.tex) || /\\\\ & & \\square/.test(pr.tex) ? 'm' : 'b'; kinds[level + row + (t.top.indexOf(0) >= 0 ? '0' : '')] = 1;
    ok(level !== 0 || /\\square \\end\{array\}$/.test(pr.tex), where + '0단계는 마지막 칸');
    eq(t.bot[t.n - 1], divP(P, [-t.r, 1]).r[0], where + '표의 마지막 수 = 나머지');
  });
  eq(Object.keys(kinds).sort().join(' '), '0b 1b 1b0 1m 1m0 2b 2b0 2m 2m0', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added below-copied middle-copied multiplied subtracted top-copied used-top', '실수의 종류');
  done('조립제법의 빈칸');

  group('C02 — 조립제법 읽기 (단계마다 1,000문제)');
  bag = {};
  each('C02.synthq', function (p, pr, level, where) {
    var opts = choiceBase('C02.synthq', p, where, bag), t = readTable(pr.tex, NaN), m = tableText(pr.text), P, d, sigs = opts.map(sig), steps = MH.types['C02.synthq'].steps(p.v);
    ok(!!t && !!m && t.blanks === 0 && /계산한 것이에요\. 몫을 고르세요\.$/.test(pr.text), where + '문제의 꼴: ' + pr.tex + ' / ' + pr.text); if (!t || !m) return;
    P = readPoly(m[1]); d = divP(P, [-t.r, 1]);
    ok(tableOk(t) && sameP(P, t.top.slice().reverse()) && P.length === t.n && t.r === (m[2] === '-' ? 1 : -1) * Number(m[3]), where + '표가 맞아야 함: ' + pr.tex);
    ok(sameP(d.q, readPoly(p.answer)) && descending(p.answer) && d.r[0] === t.bot[t.n - 1], where + '몫: ' + pr.text + ' → ' + p.answer);
    ok(sigs.every(function (s, i) { return !!s && sigs.indexOf(s) === i; }), where + '값이 같은 보기가 있음: ' + opts.join(' | '));
    ok(level === 0 ? t.n === 4 && t.top.indexOf(0) < 0 : level === 1 ? t.n === 4 && t.top.indexOf(0) >= 0 : t.n === 5, where + '단계에 맞는 표: ' + pr.tex);
    ok(steps.length === 2 && steps[1].tex === p.answer && steps[0].tex === t.bot.slice(0, -1).join(',\\ ') + '\\ \\mid\\ ' + t.bot[t.n - 1], where + '풀이의 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
  });
  eq(Object.keys(bag).sort().join(' '), 'degree-high degree-kept first-dropped middle-row remainder-added top-row', '실수의 종류');
  done('조립제법 읽기');

  group('C02 — 개념 카드');
  ok(MH.concepts.C02 && MH.concepts.C02.length === 6, '개념 카드는 6장');
  done('개념 카드');
})();
