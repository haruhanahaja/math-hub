/* C03 인수분해 — 단원 전용 검사.
   화면에 보이는 식을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어 답을 따로 확인한다. 단원 파일의 계산과 무관하다.
   · 답은 문제의 식과 값이 같고(문자에 수 세 벌), 끝까지 인수분해되어 있다(답의 괄호마다 더 쪼개지는지 여기서 따로 따진다).
   · 틀린 보기는 값이 다르다. 단, '끝까지 인수분해하지 않은 식'(not-finished)은 값이 같고 덜 쪼갠 것이다.
   · 빈 계수는 항등식을 여기서 직접 풀어 구하고, 식의 값은 문자에 수를 넣어 바로 계산한다. */
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
  var qi = function (n) { return Q(BigInt(n), 1n); };
  var qsub = function (a, b) { return Q(a.n * b.d - b.n * a.d, a.d * b.d); }, qmul = function (a, b) { return Q(a.n * b.n, a.d * b.d); }, qdiv = function (a, b) { return Q(a.n * b.d, a.d * b.n); };
  var qnum = function (a) { return a.d === 1n ? Number(a.n) : NaN; };
  var termsOf = function (t) { return t.replace(/ - /g, ' + -').split(' + '); };
  /** x 의 다항식 읽기: 계수의 배열(낮은 차수부터). 다른 문자가 있거나 다항식이 아니면 null */
  var readPoly = function (t) {
    var cs = [], i, bad = false;
    termsOf(t).forEach(function (term) {
      var m = /^(-?)(\d*)(?:(x)(?:\^\{(\d+)\})?)?$/.exec(term), d;
      if (!m || (m[2] === '' && !m[3])) { bad = true; return; }
      d = m[3] ? Number(m[4] || 1) : 0; cs[d] = (cs[d] || 0) + (m[1] ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2]));
    });
    if (bad) return null;
    for (i = 0; i < cs.length; i++) cs[i] = cs[i] || 0;
    return cs;
  };
  var evalP = function (cs, x) { var s = 0, i; for (i = cs.length - 1; i >= 0; i--) s = s * x + cs[i]; return s; };
  var hasIntRoot = function (cs) { for (var x = -80; x <= 80; x++) if (evalP(cs, x) === 0) return true; return false; };
  /** 곱으로 쓴 식의 괄호들: [{ body, exp }] */
  var factorsOf = function (t) { var out = [], re = /\(([^()]+)\)(?:\^\{(\d)\})?/g, m; while ((m = re.exec(t))) out.push({ body: m[1], exp: Number(m[2] || 1) }); return out; };
  /** x 만의 식을 끝까지 인수분해한 꼴인가: 괄호는 x + c 이거나, 정수 근이 없는 x² + bx + c 다(최고차 계수 1). 차수의 합은 deg */
  var fullyFactored = function (t, deg) {
    var fs = factorsOf(t), sum = 0;
    return fs.length >= 1 && t.replace(/\(([^()]+)\)(?:\^\{(\d)\})?/g, '') === '' && fs.every(function (f) {
      var cs = readPoly(f.body);
      if (!cs || cs.length < 2 || cs.length > 3 || cs[cs.length - 1] !== 1) return false;
      sum += (cs.length - 1) * f.exp;
      return cs.length === 2 ? cs[0] !== 0 : !hasIntRoot(cs);
    }) && sum === deg;
  };
  var eqLine = function (tex, env) { var parts = tex.split(' = '), v; try { v = parts.map(function (x) { return ALG.str(calc(x, env)); }); } catch (e) { return false; } return parts.length >= 2 && v.every(function (x) { return x === v[0]; }); };
  var sigLine = function (tex) { var parts = tex.split(' = ').map(sig); return parts.length >= 2 && parts.every(function (x) { return !!x && x === parts[0]; }); };
  /** fns: 문자의 값(env)을 받아 0 이 되어야 하는 값을 돌려주는 함수들. 문자에 대해 일차라는 것만 써서 문자의 값을 구한다 */
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
    for (j = n; j < rows.length; j++) if (rows[j][n].n !== 0n) return null;
    names.forEach(function (nm, idx) { out[nm] = qnum(qdiv(rows[idx][n], rows[idx][idx])); });
    return out;
  };
  var solveIdentity = function (tex, names) {
    var parts = tex.split(' = ');
    return solveLinear([0, 1, 2, 3, -1, -2, 5].slice(0, names.length + 2).map(function (x) { return function (env) { var e = { x: qi(x) }; names.forEach(function (nm) { e[nm] = env[nm]; }); return qsub(calc(parts[0], e), calc(parts[1], e)); }; }), names);
  };
  /** 조립제법의 표가 규칙(대각선은 곱하기, 세로는 더하기)에 맞고 나머지가 0 인가. 맞으면 { r, top, bot } */
  var readTable = function (tex) {
    var m = /^\\begin\{array\}\{c\|(c+)\} (.+) \\\\ & & (.+) \\\\ \\hline & (.+) \\end\{array\}$/.exec(tex), top, mid, bot, r;
    if (!m) return null;
    top = m[2].split(' & ').map(Number); r = top.shift(); mid = m[3].split(' & ').map(Number); bot = m[4].split(' & ').map(Number);
    if (!(top.length === m[1].length && mid.length === top.length - 1 && bot.length === top.length && bot[0] === top[0] && mid.every(function (v, i) { return v === r * bot[i]; }) && bot.slice(1).every(function (v, i) { return v === top[i + 1] + mid[i]; }) && bot[bot.length - 1] === 0)) return null;
    return { r: r, top: top, bot: bot };
  };

  /** 보기 고르기 유형의 공통 검사. same: 값이 답과 같아도 되는 실수 id(끝까지 인수분해하지 않은 식) */
  var choiceBase = function (id, p, pr, where) {
    var opts = MH.optionsOf(p), a = sig(p.answer), steps = MH.types[id].steps(p.v);
    eq(pr.text, '다음 식을 인수분해하세요.', where + '문제 글');
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40 && !!sig(o); }) && opts.indexOf(p.answer) >= 0 && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    ok(!!a && a === sig(pr.tex), where + '답을 전개하면 문제의 식: ' + pr.tex + ' → ' + p.answer);
    MH.mistakesFor(p).forEach(function (x) {
      if (x.id === 'not-finished') ok(sig(x.value) === a && x.value !== p.answer && /끝나지 않았어요/.test(x.explain), where + '덜 인수분해한 보기: ' + x.value);
      else ok(sig(x.value) !== a, where + '틀린 보기의 값이 답과 같음: ' + x.id + ' ' + x.value);
    });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    eq(steps[steps.length - 1].tex, p.answer, where + '풀이의 마지막 줄');
    /* 풀이의 줄: 등식은 양쪽 값이 같고(X 로 놓은 줄 · 표 · P(수) 줄은 따로 본다), 식 하나뿐인 줄은 문제의 식과 값이 같다 */
    steps.forEach(function (s) {
      if (/\\begin|X/.test(s.tex)) return;
      s.tex.replace(/^P\(-?\d+\) = /, '').split(',\\quad ').forEach(function (e) { ok(e.indexOf(' = ') >= 0 ? sigLine(e) : sig(e) === a, where + '풀이의 줄: ' + e); });
    });
    return opts;
  };
  var numChecks = function (id, p, where) {
    var def = MH.types[id], kind = MH.kinds[def.answer.kind], ans = p.answer.n, steps = def.steps(p.v);
    ok(p.answer.p === 0 && isInt(ans) && ans !== 0, where + '답은 0 이 아닌 정수');
    MH.mistakesFor(p).forEach(function (x) { ok(isInt(x.value.n) && x.value.n !== ans && x.value.n !== -ans && x.value.n !== 0, where + '실수 값: ' + x.id + ' ' + x.value.n); });
    ok(MH.mistakesFor(p).length >= 2, where + '실수가 둘은 있어야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    detailed(id, p, where);
    ok(Number(steps[steps.length - 1].tex.split(' = ').pop()) === ans, where + '풀이의 마지막 줄: ' + steps[steps.length - 1].tex);
    return ans;
  };

  group('C03 — 검사 도구 자체 검사');
  ok(fullyFactored('(x + 1)(x - 2)^{2}', 3) && fullyFactored('(x - 1)(x^{2} + x + 1)', 3) && !fullyFactored('(x - 1)(x^{2} - x - 6)', 3) && !fullyFactored('(x^{2} - 4)(x^{2} + 1)', 4) && !fullyFactored('(x + 1)(x - 2)', 3) && !fullyFactored('2(x + 1)(x - 2)', 2), '끝까지 인수분해했는지 가려냄');
  ok(!!readTable('\\begin{array}{c|cccc} 1 & 1 & -2 & -5 & 6 \\\\ & & 1 & -1 & -6 \\\\ \\hline & 1 & -1 & -6 & 0 \\end{array}') && !readTable('\\begin{array}{c|cccc} 1 & 1 & -2 & -5 & 6 \\\\ & & 1 & -1 & -5 \\\\ \\hline & 1 & -1 & -6 & 1 \\end{array}'), '조립제법의 표');
  ok(solveIdentity('x^{3} - 8 = (x - 2)(ax^{2} + bx + c)', ['a', 'b', 'c']).b === 2 && sigLine('x^{4} + x^{2} + 1 = (x^{2} + x + 1)(x^{2} - x + 1)') && !sigLine('x^{3} + 8 = (x + 2)^{3}'), '항등식 풀기 · 등식 확인');
  done('도구');

  var kinds;
  group('C03 — 세제곱 꼴 (단계마다 1,000문제)');
  kinds = {};
  each('C03.cube', function (p, pr, level, where) {
    choiceBase('C03.cube', p, pr, where);
    var m = /^\((\d*)([xp]) ([+-]) (\d*)([yq]?)\)\^\{3\}$/.exec(p.answer);
    ok(!!m && termsOf(pr.tex).length === 4, where + '답 · 문제의 꼴: ' + pr.tex + ' → ' + p.answer); if (!m) return;
    ok((level === 0 ? m[1] === '' && !m[5] : level === 1 ? m[1] === '' && !!m[5] : Number(m[1]) >= 2) && (!m[5] || (m[2] === 'x') === (m[5] === 'y')) && MH.gcd(Number(m[1] || 1), Number(m[4] || 1)) === 1, where + '단계에 맞는 식: ' + p.answer);
    kinds[level + m[3]] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0+ 0- 1+ 1- 2+ 2-', '문제의 종류');
  done('세제곱 꼴');

  group('C03 — 세제곱의 합과 차 (단계마다 1,000문제)');
  kinds = {};
  each('C03.sumcube', function (p, pr, level, where) {
    choiceBase('C03.sumcube', p, pr, where);
    var m = /^(\d*)\((\d*)[xp] ([+-]) (\d*)[yq]?\)\((.+)\)$/.exec(p.answer), mid;
    ok(!!m && termsOf(pr.tex).length === 2 && termsOf(m ? m[5] : '').length === 3, where + '답 · 문제의 꼴: ' + pr.tex + ' → ' + p.answer); if (!m) return;
    mid = / ([+-]) \d*[a-z]/.exec(m[5]);
    ok(!!mid && mid[1] !== m[3] && / \+ [^+-]+$/.test(m[5]), where + '둘째 괄호의 가운데 항은 첫째 괄호와 반대 부호, 끝 항은 +: ' + p.answer);
    ok((level === 2) === (m[1] !== '') && (level === 0 ? m[2] === '' : true), where + '단계에 맞는 식: ' + p.answer);
    kinds[level + m[3]] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0+ 0- 1+ 1- 2+ 2-', '문제의 종류');
  done('세제곱의 합과 차');

  group('C03 — 세 항의 제곱 꼴 (단계마다 1,000문제)');
  kinds = {};
  each('C03.trisq', function (p, pr, level, where) {
    choiceBase('C03.trisq', p, pr, where);
    var m = /^\((\d*)x ([+-]) (\d*)y ([+-]) (\d*)(z?)\)\^\{2\}$/.exec(p.answer);
    ok(!!m && termsOf(pr.tex).length === 6, where + '답 · 문제의 꼴: ' + pr.tex + ' → ' + p.answer); if (!m) return;
    ok(level === 0 ? m[2] + m[4] === '++' : level === 1 ? m[2] + m[4] !== '++' : true, where + '단계에 맞는 부호: ' + p.answer);
    ok(MH.gcd(MH.gcd(Number(m[1] || 1), Number(m[3] || 1)), Number(m[5] || 1)) === 1, where + '괄호 안에 공통인수가 없어야 함: ' + p.answer);
    kinds[level + (m[6] ? 'z' : 'n')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0n 0z 1n 1z 2n 2z', '문제의 종류');
  done('세 항의 제곱 꼴');

  group('C03 — 공통부분을 한 덩어리로 (단계마다 1,000문제)');
  kinds = {};
  each('C03.subst', function (p, pr, level, where) {
    choiceBase('C03.subst', p, pr, where);
    var steps = MH.types['C03.subst'].steps(p.v), fin = MH.mistakesFor(p).some(function (x) { return x.id === 'not-finished'; });
    ok(level === 0 ? /^\(x [+-] \d\)\^\{2\} [+-] \d*\(x [+-] \d\) [+-] \d+$/.test(pr.tex) : level === 1 ? /^\(x\^\{2\} [+-] \d?x\)\^\{2\} [+-] \d*\(x\^\{2\} [+-] \d?x\) [+-] \d+$/.test(pr.tex) : /^\(x\^\{2\} [+-] \d?x [+-] \d\)\(x\^\{2\} [+-] \d?x [+-] \d\) [+-] \d+$/.test(pr.tex), where + '문제의 꼴: ' + pr.tex);
    ok(fullyFactored(p.answer.replace(/^x\(/, '(x + 0)(').replace(/^x\^\{2\}$/, '(x + 0)^{2}'), level === 0 ? 2 : 4) || (level === 0 && /^x/.test(p.answer)), where + '끝까지 인수분해: ' + p.answer);
    ok(!/^x/.test(p.answer), where + '답에 x 만 있는 인수는 없음: ' + p.answer);
    /* X 로 놓은 줄: X 에 공통부분을 넣으면 문제의 식과 같다 */
    var common = level === 0 ? /^\((x [+-] \d)\)/.exec(pr.tex)[1] : /^\((x\^\{2\} [+-] \d?x)/.exec(pr.tex)[1];
    steps.filter(function (s) { return /X/.test(s.tex); }).forEach(function (s) { s.tex.split(' = ').forEach(function (e) { eq(sig(e.replace(/X/g, '(' + common + ')')), sig(pr.tex), where + 'X 를 되돌린 값: ' + e); }); });
    ok(steps.filter(function (s) { return /X/.test(s.tex); }).length === 2, where + 'X 로 놓은 줄은 둘');
    kinds[level + (fin ? 'more' : '')] = 1;
  });
  ok(kinds['1more'] && kinds['2more'] && kinds['1'] && kinds['2'] && kinds['0'], '더 인수분해되는 문제와 안 되는 문제가 모두 나옴');
  done('공통부분을 한 덩어리로');

  group('C03 — 사차식 (단계마다 1,000문제)');
  kinds = {};
  each('C03.biquad', function (p, pr, level, where) {
    choiceBase('C03.biquad', p, pr, where);
    var P = readPoly(pr.tex), fs = factorsOf(p.answer), lin = fs.filter(function (f) { return readPoly(f.body).length === 2; }).length;
    ok(!!P && P.length === 5 && P[4] === 1 && P[3] === 0 && P[1] === 0 && P[0] !== 0, where + '문제의 꼴: ' + pr.tex);
    ok(fullyFactored(p.answer, 4), where + '끝까지 인수분해: ' + p.answer);
    ok(level === 0 ? lin === 0 && fs.every(function (f) { return /^x\^\{2\} [+-] \d+$/.test(f.body); }) : level === 1 ? lin >= 2 : lin === 0 && fs.length === 2 && fs.every(function (f) { return /^x\^\{2\} [+-] \d?x [+-] \d+$/.test(f.body); }), where + '단계에 맞는 답: ' + p.answer);
    if (level === 2) ok(Math.abs(P[2]) <= 30 && !(function () { for (var u = -40; u <= 40; u++) if (u !== 0 && P[0] % u === 0 && u + P[0] / u === P[2]) return true; return false; })(), where + 'x² 을 X 로 놓아서는 인수분해되지 않아야 함: ' + pr.tex);
    kinds[level + String(fs.length) + (lin ? 'L' + lin : '')] = 1;
  });
  ok(kinds['01'] && kinds['02'] && kinds['13L2'] && kinds['12L2'] && kinds['22'], '문제의 종류: ' + Object.keys(kinds).sort().join(' '));
  done('사차식');

  group('C03 — 인수정리로 인수분해 (단계마다 1,000문제)');
  kinds = {};
  each('C03.theorem', function (p, pr, level, where) {
    choiceBase('C03.theorem', p, pr, where);
    var P = readPoly(pr.tex), deg = level === 2 ? 4 : 3, steps = MH.types['C03.theorem'].steps(p.v), fs = factorsOf(p.answer), t1, t2, m, lin = 0, x, cs, mult;
    ok(!!P && P.length === deg + 1 && P[deg] === 1 && P[0] !== 0 && P.every(function (c) { return Math.abs(c) <= 60; }), where + '문제의 꼴: ' + pr.tex);
    ok(fullyFactored(p.answer, deg), where + '끝까지 인수분해: ' + p.answer);
    fs.forEach(function (f) { if (readPoly(f.body).length === 2) lin += f.exp; });
    /* 정수 근의 개수(중복 포함)를 여기서 따로 세어 답의 일차식의 수와 견준다 */
    mult = 0; cs = P.slice();
    for (x = -60; x <= 60; x++) while (cs.length > 1 && evalP(cs, x) === 0) { var q = [], i, carry = 0; for (i = cs.length - 1; i >= 1; i--) { carry = cs[i] + carry * x; q[i - 1] = carry; } cs = q; mult++; }
    eq(lin, mult, where + '일차식 인수의 수 = 정수 근의 수: ' + pr.tex + ' → ' + p.answer);
    ok(level === 0 ? lin === 3 : level === 1 ? lin === 1 : lin === 2, where + '단계에 맞는 답: ' + p.answer);
    /* 풀이: 넣은 수가 실제로 0 을 만들고, 조립제법의 표가 맞고, 첫 표의 윗줄이 문제의 계수다 */
    m = /^P\((-?\d+)\) = /.exec(steps[0].tex); t1 = readTable(steps[1].tex);
    ok(!!m && evalP(P, Number(m[1])) === 0 && !!t1 && t1.r === Number(m[1]) && t1.top.join(',') === P.slice().reverse().join(','), where + '풀이의 첫 표: ' + steps[1].tex);
    ok(steps.length === (level === 2 ? 4 : 3), where + '풀이의 줄 수');
    if (level === 2) { t2 = readTable(steps[2].tex); ok(!!t2 && !!t1 && t2.top.join(',') === t1.bot.slice(0, -1).join(','), where + '풀이의 둘째 표: ' + steps[2].tex); }
    /* 처음 넣어 보는 수는 정수 근 가운데 절댓값이 가장 작은 것이다 */
    for (x = 1; m && x < Math.abs(Number(m[1])); x++) ok(evalP(P, x) !== 0 && evalP(P, -x) !== 0, where + '더 작은 근이 있음: ' + x);
    kinds[level + (fs.some(function (f) { return f.exp > 1; }) ? 'rep' : 'one')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0one 0rep 1one 2one 2rep', '문제의 종류');
  done('인수정리로 인수분해');

  group('C03 — 인수분해한 식의 빈 계수 (단계마다 1,000문제)');
  kinds = {};
  each('C03.blank', function (p, pr, level, where) {
    var ans = numChecks('C03.blank', p, where), m = /^다음과 같이 인수분해될 때, (상수|양수) \$([abc])\$의 값을 구하세요\.$/.exec(pr.text), steps = MH.types['C03.blank'].steps(p.v), names, sol, t;
    ok(!!m && (m[1] === '양수') === (level === 2), where + '문제 글: ' + pr.text); if (!m) return;
    if (level < 2) {
      names = level === 0 ? ['a', 'b'] : ['a', 'b', 'c']; sol = solveIdentity(pr.tex, names);
      ok(!!sol && sol[m[2]] === ans && names.every(function (nm) { return isInt(sol[nm]) && sol[nm] !== 0; }), where + '답: ' + pr.tex + ' → ' + JSON.stringify(sol) + ' / ' + ans); if (!sol) return;
      if (level === 0) { t = readTable(steps[0].tex); ok(!!t && t.bot.slice(0, 3).join(',') === [1, sol.a, sol.b].join(',') && sigLine(steps[1].tex.replace(/a/g, '(' + sol.a + ')').replace(/b/g, '(' + sol.b + ')')), where + '풀이의 표: ' + steps[0].tex); }
      else ok(sigLine(steps[0].tex) && sig(steps[1].tex) === sig(pr.tex.split(' = ')[0]) && (m[2] !== 'a' || !/^x/.test(pr.tex)), where + '풀이의 줄: ' + steps[0].tex + ' / ' + steps[1].tex);
    } else {
      ok(ans > 0 && sigLine(pr.tex.replace(/a/g, '(' + ans + ')')) && /^x\^\{4\}( [+-] \d*x\^\{2\})? \+ \d+ = /.test(pr.tex), where + '답을 넣으면 등식이 성립: ' + pr.tex + ' ← ' + ans);
      /* 다른 양수는 답이 될 수 없다 */
      for (t = 1; t <= 12; t++) if (t !== ans) ok(!sigLine(pr.tex.replace(/a/g, '(' + t + ')')), where + '답이 하나가 아님: ' + t);
      ok(sigLine(steps[0].tex) && sig(steps[1].tex) === sig(pr.tex.split(' = ')[0]) && sig(steps[2].tex) === sig(pr.tex.split(' = ')[0]), where + '풀이의 줄');
    }
    kinds[level + m[2]] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0a 0b 1a 1b 1c 2a', '문제의 종류');
  done('인수분해한 식의 빈 계수');

  group('C03 — 인수분해로 식의 값 구하기 (단계마다 1,000문제)');
  kinds = {};
  each('C03.value', function (p, pr, level, where) {
    var ans = numChecks('C03.value', p, where), steps = MH.types['C03.value'].steps(p.v), env = {}, re = /\$([xyz]) = (-?\d+)\$/g, m, n = 0;
    while ((m = re.exec(pr.text))) { env[m[1]] = qi(Number(m[2])); n++; }
    eq(n, level === 0 ? 1 : level === 1 ? 0 : 3, where + '문제 글에 주어진 값의 수: ' + pr.text);
    eq(qnum(calc(pr.tex, env)), ans, where + '식의 값: ' + pr.tex + ' ' + pr.text);
    steps.forEach(function (s) { ok(level === 1 ? eqLine(s.tex, {}) : sigLine(s.tex) || eqLine(s.tex, env), where + '풀이의 줄: ' + s.tex); });
    if (level !== 1) ok(sigLine(steps[0].tex) && steps[0].tex.indexOf(pr.tex + ' = ') === 0, where + '풀이 첫 줄은 인수분해: ' + steps[0].tex);
    if (level === 1) ok(/^\\dfrac\{(\d+)\^\{3\} ([+-]) (\d+)\^\{3\}\}\{\1\^\{2\} [+-] \1 \\times \3 \+ \3\^\{2\}\}$/.test(pr.tex) && ans > 0, where + '분수의 꼴: ' + pr.tex);
    kinds[level + (ans < 0 ? '-' : '+')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0+ 0- 1+ 2+', '문제의 종류');
  done('인수분해로 식의 값 구하기');

  group('C03 — 개념 카드');
  ok(MH.concepts.C03 && MH.concepts.C03.length === 6, '개념 카드는 6장');
  done('개념 카드');
})();
