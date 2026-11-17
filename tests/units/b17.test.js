/* B17 제곱근과 실수 — 단원 전용 검사.
   문제 글과 보기를 정규식으로 읽어, BigInt 정수 제곱근(isq)과 BigInt 분수만으로 답을 따로 구한다.
   무리수의 크기는 10^30 배 한 정수(√ 는 정수 제곱근)로 견준다. 부동소수점은 쓰지 않는다.
   단원 파일의 계산(isq, atomVal, cItem …)과 무관하다. */
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
      var re = /(\d)\)?\}?\$?(이에요|예요|은 |는 |이 |가 |을 |를 |과 |와 |으로 |로 )/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        if (/\}\}\$?$/.test(t.slice(0, m.index + 3)) || /dfrac\{\d+\}\{\d+$/.test(t.slice(0, m.index + 1)) || /\^\{\d+$/.test(t.slice(0, m.index + 1))) continue;   /* 지수 뒤는 '제곱' 으로 읽는다 */   /* 분수는 분자로 읽는다: 따로 보지 않는다 */
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
      ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object/.test(t), where + '글: ' + t);
    });
  };
  /* ── BigInt 도구 ── */
  var B = BigInt;
  var isq = function (n) { n = B(n); if (n < 2n) return n; var x = n, y = (x + 1n) / 2n; while (y < x) { x = y; y = (x + n / x) / 2n; } return x; };
  var isSq = function (n) { var k = isq(n); return k * k === B(n); };
  var Q = function (n, d) { return ALG.Q(B(n), B(d === undefined ? 1 : d)); };
  var sub = function (a, b) { return { n: a.n * b.d - b.n * a.d, d: a.d * b.d }; };
  var add = function (a, b) { return { n: a.n * b.d + b.n * a.d, d: a.d * b.d }; };
  var mul = function (a, b) { return { n: a.n * b.n, d: a.d * b.d }; };
  var div = function (a, b) { return { n: a.n * b.d, d: a.d * b.n }; };
  var neg = function (a) { return { n: -a.n, d: a.d }; };
  var same = function (a, b) { return a.n * b.d === b.n * a.d; };
  var sgn = function (a) { return a.n === 0n ? 0 : (a.n > 0n) === (a.d > 0n) ? 1 : -1; };
  var absQ = function (a) { return sgn(a) < 0 ? neg(a) : a; };
  var less = function (a, b) { return sgn(sub(a, b)) < 0; };
  var show = function (a) { var d = a.d < 0n ? -a.d : a.d, n = a.d < 0n ? -a.n : a.n, g = function (x, y) { x = x < 0n ? -x : x; while (y) { var t = x % y; x = y; y = t; } return x; }, k = g(n, d) || 1n; return String(n / k) + (d / k === 1n ? '' : '/' + String(d / k)); };
  var gcdN = function (a, b) { while (b) { var t = a % b; a = b; b = t; } return a; };
  /** 수 하나(정수 · 소수 · 분수)를 분수로 읽는다 */
  var plain = function (t) {
    var m;
    if ((m = /^(-?)(\d+)$/.exec(t))) return Q((m[1] ? '-' : '') + m[2]);
    if ((m = /^(-?)(\d+)\.(\d+)$/.exec(t))) return Q((m[1] ? '-' : '') + m[2] + m[3], B(10) ** B(m[3].length));
    if ((m = /^(-?)\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(t))) return Q((m[1] ? '-' : '') + m[2], m[3]);
    return null;
  };
  /** k + s√n 꼴의 수를 10^30 배 한 정수로 읽는다(크기를 견줄 때만 쓴다) */
  var HP = 10n ** 30n;
  var hp = function (t) {
    var m, v;
    if ((m = /^(-?)\\sqrt\{(\d+)\}(?: ([+-]) (\d+))?$/.exec(t))) return (m[1] ? -1n : 1n) * isq(B(m[2]) * HP * HP) + (m[3] ? (m[3] === '-' ? -1n : 1n) * B(m[4]) * HP : 0n);
    if ((m = /^(\d+) - \\sqrt\{(\d+)\}$/.exec(t))) return B(m[1]) * HP - isq(B(m[2]) * HP * HP);
    v = plain(t) || calc(t, {});
    return v.n * HP / v.d;
  };
  var numChecks = function (id, p, want, where, bag) {
    var def = MH.types[id], kind = MH.kinds[def.answer.kind], a = p.answer, got = def.answer.kind === 'rational' ? Q(a.n, a.d) : Q(a);
    ok(same(got, want), where + '답: 기대 ' + show(want) + ', 실제 ' + show(got));
    if (def.answer.kind === 'rational') ok(a.d >= 1 && MH.gcd(Math.abs(a.n), a.d) === 1, where + '답은 기약분수');
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) {
      eq(J(p, kind.raw(a, def.answer)), 'correct:-', where + '정답 판정');
      MH.mistakesFor(p).forEach(function (x) { var j = MH.judge(p, kind.raw(x.value, def.answer)); ok(j.verdict === 'wrong' && !!j.mistake, where + '실수 값 판정 ' + x.id); });
    }
    detailed(id, p, where);
  };
  var choiceChecks = function (id, p, where, bag) {
    var opts = MH.optionsOf(p);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    return opts;
  };

  group('B17 — 검사 도구 자체 검사');
  ok(isq(48) === 6n && isq(49) === 7n && isSq(144) && !isSq(145) && isq(10n ** 40n) === 10n ** 20n, '정수 제곱근');
  ok(hp('\\sqrt{2} + 1') > hp('2') && hp('\\sqrt{2} + 1') < hp('\\dfrac{5}{2}') && hp('5 - \\sqrt{10}') < hp('2') && hp('-\\sqrt{8}') > hp('-3') && hp('\\sqrt{9}') === hp('3'), '무리수의 크기 견주기');
  ok(show(plain('-0.25')) === '-1/4' && show(plain('\\dfrac{6}{4}')) === '3/2' && plain('\\sqrt{2}') === null, '수 읽기');
  done('도구');

  /* ── 제곱근 구하기 ── */
  group('B17 — 제곱근 구하기 (단계마다 1,000문제)');
  /** 보기 하나를 읽는다: { pm, s(부호), sq(크기의 제곱, 분수) } */
  var rootOpt = function (o) {
    var pm = /^\\pm /.test(o), t = o.replace(/^\\pm /, ''), s = /^-/.test(t) ? -1 : 1, m, v;
    t = t.replace(/^-/, '');
    if ((m = /^\\sqrt\{(\d+)\}$/.exec(t))) return { pm: pm, s: s, sq: Q(m[1]) };
    v = plain(t);
    return v ? { pm: pm, s: s, sq: mul(v, v) } : null;
  };
  var bag = {}, kinds = {};
  each('B17.root', function (p, pr, level, where) {
    var opts = choiceChecks('B17.root', p, where, bag), m, target, one = 0, a = rootOpt(p.answer), k;
    ok(!pr.tex && !pr.figure && !!a && opts.every(function (o) { return !!rootOpt(o); }), where + '보기를 읽지 못함: ' + opts.join(' | '));
    if (!a) return;
    if ((m = /^\$(\d+)\$의 제곱근을 고르세요\.$/.exec(pr.text))) { target = Q(m[1]); kinds[isSq(m[1]) ? 'int' : 'sym'] = 1; ok(isSq(m[1]) ? level === 0 && /^\\pm \d+$/.test(p.answer) : level === 2 && p.answer === '\\pm \\sqrt{' + m[1] + '}', where + '단계 · 답의 꼴: ' + p.answer); }
    else if ((m = /^\$\\dfrac\{(\d+)\}\{(\d+)\}\$의 제곱근을 고르세요\.$/.exec(pr.text))) { target = Q(m[1], m[2]); kinds.frac = 1; ok(level === 1 && isSq(m[1]) && isSq(m[2]) && gcdN(Number(m[1]), Number(m[2])) === 1 && /^\\pm \\dfrac/.test(p.answer), where + '분수'); }
    else if ((m = /^\$(\d+\.\d\d)\$의 제곱근을 고르세요\.$/.exec(pr.text))) { target = plain(m[1]); kinds.dec = 1; ok(level === 1 && /^\\pm \d+\.\d$/.test(p.answer), where + '소수'); }
    else if ((m = /^\$\\sqrt\{(\d+)\}\$의 제곱근을 고르세요\.$/.exec(pr.text))) { k = isq(m[1]); ok(level === 2 && isSq(m[1]) && isSq(k), where + '근호 안은 네제곱수'); target = Q(k); kinds['of-root'] = 1; }
    else if ((m = /^제곱근 \$(\d+)\$의 값을 고르세요\.$/.exec(pr.text))) { target = Q(m[1]); one = 1; kinds.named = 1; ok(level === 2 && isSq(m[1]), where + '제곱수'); }
    else if ((m = /^\$(\d+)\$의 (양|음)의 제곱근을 고르세요\.$/.exec(pr.text))) { target = Q(m[1]); one = m[2] === '양' ? 1 : -1; kinds[m[2]] = 1; ok(level === 2 && isSq(m[1]), where + '제곱수'); }
    else { ok(false, where + '문제 글: ' + pr.text); return; }
    ok(same(a.sq, target) && (one ? !a.pm && a.s === one : a.pm), where + '답을 제곱하면 원래 수: ' + pr.text + ' → ' + p.answer);
    ok(MH.mistakesFor(p).every(function (x) { var w = rootOpt(x.value); return !(same(w.sq, a.sq) && w.pm === a.pm && (w.pm || w.s === a.s)); }), where + '틀린 보기가 답과 같은 값');
    var st = MH.types['B17.root'].steps(p.v);
    ok(st.length >= 2 && st[st.length - 1].tex === p.answer, where + '풀이');
    st[0].tex.split(',\\quad ').forEach(function (line) {
      var s2 = /^\(?(.+?)\)?\^\{2\} = (.+)$/.exec(line.replace('\\left(', '(').replace('\\right)', ')')), s1 = /^(-?)\\sqrt\{(\d+)\} = (-?\d+)$/.exec(line), b;
      if (s1) ok(B(s1[3]) * B(s1[3]) === B(s1[2]) && (s1[1] === '-') === (s1[3] < 0), where + '풀이의 식: ' + line);
      else if (s2) { b = rootOpt(s2[1].replace(/^\((.*)\)$/, '$1')); ok(!!b && (same(b.sq, plain(s2[2]) || Q(0))), where + '풀이의 식: ' + line); }
      else ok(false, where + '풀이의 식을 읽지 못함: ' + line);
    });
  });
  eq(Object.keys(kinds).sort().join(' '), 'dec frac int named of-root sym 양 음', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'all-roots halved negative-only numer-only point-wrong positive-only root-not-taken squared value-only wrong-sign', '실수의 종류');
  done('제곱근 구하기');

  /* ── 근호가 든 수의 값 ── */
  group('B17 — 근호가 든 수의 값 (단계마다 1,000문제)');
  /** 근호가 든 수 하나의 값(분수). 읽지 못하면 null */
  var atom = function (t) {
    var m, s = 1, v, k;
    if (plain(t)) return plain(t);
    if ((m = /^\((-.*)\)$/.exec(t)) && atom(m[1])) return atom(m[1]);
    if (/^-/.test(t)) { s = -1; t = t.slice(1); }
    if ((m = /^\\sqrt\{(\d+)\}$/.exec(t))) { k = isq(m[1]); v = k * k === B(m[1]) ? Q(k) : null; }
    else if ((m = /^\\sqrt\{\\dfrac\{(\d+)\}\{(\d+)\}\}$/.exec(t))) v = isSq(m[1]) && isSq(m[2]) ? Q(isq(m[1]), isq(m[2])) : null;
    else if ((m = /^\(-?\\sqrt\{(\d+)\}\)\^\{2\}$/.exec(t))) v = Q(m[1]);
    else if ((m = /^\\sqrt\{\(-(\d+)\)\^\{2\}\}$/.exec(t)) || (m = /^\\sqrt\{(\d+)\^\{2\}\}$/.exec(t))) v = Q(m[1]);
    else return null;
    return v && s < 0 ? neg(v) : v;
  };
  var expr = function (t) {
    var k = t.split(' '), a = atom(k[0]), b;
    if (k.length === 1) return a;
    b = atom(k[2]);
    if (k.length !== 3 || !a || !b) return null;
    return k[1] === '+' ? add(a, b) : k[1] === '-' ? sub(a, b) : k[1] === '\\times' ? mul(a, b) : k[1] === '\\div' ? div(a, b) : null;
  };
  ok(show(expr('-\\sqrt{(-3)^{2}} - (-\\sqrt{\\dfrac{4}{9}})')) === '-7/3' && show(expr('(-\\sqrt{5})^{2} \\div \\sqrt{100}')) === '1/2' && expr('\\sqrt{8}') === null && show(expr('-(\\sqrt{7})^{2} \\times (-\\sqrt{4})')) === '14', '식 읽기');
  bag = {}; var shapes = {}, ops = {};
  each('B17.value', function (p, pr, level, where) {
    var want = expr(pr.tex), parts = pr.tex.split(' ');
    ok(!!want && !pr.figure && pr.text === (parts.length === 1 ? '다음 값을 구하세요.' : '다음을 계산하세요.'), where + '문제: ' + pr.tex);
    if (!want) return;
    ok(level === 2 ? parts.length === 3 : parts.length === 1, where + '단계에 맞는 식: ' + pr.tex);
    if (level === 0) ok(/^-?\\sqrt\{\d+\}$/.test(pr.tex), where + '1단계는 제곱수의 제곱근');
    if (level === 1) shapes[/dfrac/.test(pr.tex) ? 'fr' : /^-?\(/.test(pr.tex) ? 'pw' : 'ab'] = 1;
    if (level === 2) ops[parts[1]] = 1;
    numChecks('B17.value', p, want, where, bag);
    MH.types['B17.value'].steps(p.v).forEach(function (s, i) {
      var v;
      if (s.tex.indexOf(' = ') < 0) return;
      v = s.tex.split(' = ').map(expr);
      ok(v.every(function (x) { return !!x && same(x, v[0]); }), where + '풀이 ' + (i + 1) + '째 줄: ' + s.tex);
    });
  });
  eq(Object.keys(shapes).sort().join(' '), 'ab fr pw', '2단계의 식의 종류');
  eq(Object.keys(ops).sort().join(' '), '+ - \\div \\times', '3단계의 연산');
  eq(Object.keys(bag).sort().join(' '), 'first-sign halved numer-only root-ignored second-sign squared-again', '실수의 종류');
  done('근호가 든 수의 값');

  /* ── 문자가 든 제곱근 ── */
  group('B17 — 문자가 든 제곱근 간단히 하기 (단계마다 1,000문제)');
  /** 근호가 든 식의 값: 근호마다 |안의 식| 으로 바꿔 더한다. 근호가 없으면 계산기로 읽는다 */
  var mixed = function (tex, env) {
    var re = /( - | \+ |^-|^)\\sqrt\{(\([^)]*\)|[a-z])\^\{2\}\}/g, m, z = Q(0), end = 0;
    if (tex.indexOf('\\sqrt') < 0) return calc(tex, env);
    while ((m = re.exec(tex))) { if (m.index !== end) throw new Error('읽지 못함: ' + tex); end = re.lastIndex; z = (/-/.test(m[1]) ? sub : add)(z, absQ(calc(m[2], env))); }
    if (end !== tex.length) throw new Error('읽지 못함: ' + tex);
    return z;
  };
  ok(show(mixed('-\\sqrt{(-3b)^{2}}', { b: Q(-2) })) === '-6' && show(mixed('\\sqrt{(a - 2)^{2}} - \\sqrt{(a - 5)^{2}}', { a: Q(3) })) === '-1' && show(mixed('\\sqrt{x^{2}}', { x: Q(-7, 2) })) === '7/2', '절댓값으로 읽기');
  bag = {}; var conds = {}, letters = {};
  each('B17.simplify', function (p, pr, level, where) {
    var opts = choiceChecks('B17.simplify', p, where, bag), m = /^\$(.+?)\$일 때, 다음 식을 간단히 한 것을 고르세요\.$/.exec(pr.text), c, L, xs, env, truth;
    ok(!!m && !pr.figure, where + '문제 글: ' + pr.text); if (!m) return;
    if ((c = /^(-?\d+) < ([abx]) < (-?\d+)$/.exec(m[1]))) { L = c[2]; ok(level === 2 && Number(c[1]) < Number(c[3]), where + '범위'); xs = [add(Q(c[1]), Q(1, 100)), div(add(Q(c[1]), Q(c[3])), Q(2)), sub(Q(c[3]), Q(1, 100)), add(Q(c[1]), div(sub(Q(c[3]), Q(c[1])), Q(3)))]; conds.both = 1; }
    else if ((c = /^([abx]) ([<>]) (-?\d+)$/.exec(m[1]))) { L = c[1]; ok(level === 2 ? c[3] !== '0' : c[3] === '0' && (c[2] === '>') === (level === 0), where + '조건: ' + m[1]); xs = [Q(1, 100), Q(1), Q(50), Q(13, 3)].map(function (d) { return c[2] === '>' ? add(Q(c[3]), d) : sub(Q(c[3]), d); }); conds[c[2]] = 1; }
    else { ok(false, where + '조건: ' + m[1]); return; }
    letters[L] = 1;
    env = function (x) { var e = {}; e[L] = x; return e; };
    try { truth = xs.map(function (x) { return mixed(pr.tex, env(x)); }); } catch (e) { ok(false, where + '식을 읽지 못함: ' + pr.tex); return; }
    ok(truth.every(function (v) { return sgn(v) !== 0 || /[+-] \\sqrt/.test(pr.tex); }), where + '값');
    opts.forEach(function (o) {
      var eqAll = !/\\pm/.test(o) && xs.every(function (x, i) { return same(calc(o, env(x)), truth[i]); });
      ok(eqAll === (o === p.answer), where + '답만 조건의 모든 수에서 같아야 함: ' + pr.tex + ' (' + m[1] + ') → ' + o);
    });
    MH.types['B17.simplify'].steps(p.v).forEach(function (s, i) {
      var q;
      if ((q = /^(.+) ([<>]) 0$/.exec(s.tex))) ok(xs.every(function (x) { return sgn(calc(q[1], env(x))) === (q[2] === '>' ? 1 : -1); }), where + '풀이의 부호: ' + s.tex);
      else if (s.tex.indexOf(' = ') >= 0) ok(xs.every(function (x) { var v = s.tex.split(' = ').map(function (t) { return mixed(t, env(x)); }); return v.every(function (y) { return same(y, v[0]); }); }), where + '풀이 ' + (i + 1) + '째 줄: ' + s.tex);
      else ok(xs.every(function (x, j) { return same(calc(s.tex, env(x)), truth[j]); }), where + '풀이의 마지막 줄: ' + s.tex);
    });
  });
  eq(Object.keys(conds).sort().join(' '), '< > both', '조건의 종류');
  eq(Object.keys(letters).sort().join(''), 'abx', '문자');
  eq(Object.keys(bag).sort().join(' '), 'both-negative both-positive const-sign opposite pm squared', '실수의 종류');
  done('문자가 든 제곱근');

  /* ── 유리수와 무리수 ── */
  group('B17 — 유리수와 무리수: 보기를 하나하나 따로 판단한다 (단계마다 1,000문제)');
  var TRUE = /^(순환소수는 모두 유리수이다|무리수는 순환하지 않는 무한소수이다|유리수와 무리수를 통틀어 실수라고 한다|모든 정수는 유리수이다|유한소수는 모두 유리수이다|서로 다른 두 유리수 사이에는 무리수가 있다)$/;
  var FALSE = /^(무한소수는 모두 무리수이다|근호를 쓴 수는 모두 무리수이다|유리수는 모두 유한소수이다|무리수도 정수끼리의 분수로 쓸 수 있다|유리수도 무리수도 아닌 실수가 있다|원주율 π는 유리수이다|순환소수는 무리수이다|수직선 위에 무리수를 나타내는 점은 없다)$/;
  var AREA = /^넓이가 (\d+)인 정사각형의 한 변의 길이는 (유리수|무리수)이다$/;
  /** 문장: 옳으면 true. 수: 유리수이면 true. 읽지 못하면 null */
  var says = function (o) { var m = AREA.exec(o); return m ? isSq(m[1]) === (m[2] === '유리수') : TRUE.test(o) ? true : FALSE.test(o) ? false : null; };
  var isRat = function (o) {
    var t = o.replace(/^-/, ''), m;
    if (/^\d+$/.test(t) || /^\\dfrac\{\d+\}\{\d+\}$/.test(t) || /^\d+\.\d+$/.test(t) || /^\d+\.\\dot\{\d\}$/.test(t)) return true;
    if ((m = /^\\sqrt\{(\d+)\}$/.exec(t))) return isSq(m[1]);
    if ((m = /^\\sqrt\{\\dfrac\{(\d+)\}\{(\d+)\}\}$/.exec(t))) return isSq(B(m[1]) * B(m[2]));
    if ((m = /^\\sqrt\{(\d+)\.(\d+)\}$/.exec(t))) return isSq(B(m[1] + m[2]) * 10n ** B(m[2].length));
    if (/^\\pi( [+-] \d+)?$/.test(t) || t === '0.1010010001\\cdots') return false;
    if ((m = /^\\sqrt\{(\d+)\} [+-] \d+$/.exec(t))) return isSq(m[1]);
    return null;
  };
  ok(isRat('\\sqrt{0.49}') === true && isRat('\\sqrt{0.9}') === false && isRat('\\sqrt{0.4}') === false && isRat('\\sqrt{\\dfrac{8}{2}}') === true && isRat('-\\sqrt{\\dfrac{4}{7}}') === false && isRat('1.\\dot{6}') === true && isRat('\\pi - 3') === false && isRat('\\sqrt{1.44}') === true, '유리수 판단');
  ok(says('넓이가 16인 정사각형의 한 변의 길이는 무리수이다') === false && says('넓이가 7인 정사각형의 한 변의 길이는 무리수이다') === true && says('아무 말') === null, '문장 판단');
  bag = {}; var sets = [{}, {}, {}], wants = {}, forms = {};
  each('B17.irrational', function (p, pr, level, where) {
    var opts = choiceChecks('B17.irrational', p, where, bag), m = level === 2 ? /^다음 중 옳(은|지 않은) 것을 고르세요\.$/.exec(pr.text) : /^다음 중 (유리수|무리수)인 것을 고르세요\.$/.exec(pr.text), cls = level === 2 ? says : isRat, want;
    ok(!!m && !pr.tex && !pr.figure, where + '문제 글: ' + pr.text); if (!m) return;
    want = m[1] === '은' || m[1] === '유리수'; wants[level + m[1]] = 1; sets[level][opts.slice().sort().join('|')] = 1;
    ok(opts.every(function (o) { return cls(o) !== null && (cls(o) === want) === (o === p.answer); }), where + '답만 조건에 맞아야 함: ' + opts.join(' | ') + ' → ' + p.answer);
    if (level === 2) ok(opts.filter(function (o) { return AREA.test(o); }).length <= 1 && opts.every(function (o) { return !/[$\\]/.test(o); }), where + '같은 틀의 문장이 두 번 나옴');
    if (level === 0) ok(opts.every(function (o) { return /^-?(\d+|\\dfrac\{\d+\}\{\d+\}|\\sqrt\{\d+\})$/.test(o); }), where + '1단계는 자연수의 제곱근 · 정수 · 분수뿐');
    opts.forEach(function (o) { forms[o.replace(/\d+/g, 'N')] = 1; });
    MH.mistakesFor(p).concat([{ value: p.answer, explain: MH.types['B17.irrational'].steps(p.v)[0].say }]).forEach(function (x) {
      var s = level === 2 ? /^이 말은 (옳아요|틀려요)\./.exec(x.explain) : /^이 수는 (유리수|무리수)예요\./.exec(x.explain), t;
      ok(!!s && (s[1] === '옳아요' || s[1] === '유리수') === cls(x.value), where + '설명의 판단: ' + x.value + ' / ' + x.explain);
      if ((t = /\$\\sqrt\{(\d+)\} = (\d+)\$/.exec(x.explain))) ok(B(t[2]) * B(t[2]) === B(t[1]), where + '설명의 계산: ' + x.explain);
      if ((t = /\$(\d+\.\d)\$[을를] 제곱하면 \$(\d+\.\d\d)\$/.exec(x.explain))) ok(same(mul(plain(t[1]), plain(t[1])), plain(t[2])), where + '설명의 계산: ' + x.explain);
      if ((t = /근호가 벗겨져 \$\\dfrac\{(\d+)\}\{(\d+)\}\$/.exec(x.explain))) ok(x.value === '\\sqrt{\\dfrac{' + t[1] * t[1] + '}{' + t[2] * t[2] + '}}', where + '설명의 계산: ' + x.explain);
    });
  });
  eq(Object.keys(wants).length, 6, '단계마다 두 가지 물음이 모두 나온다');
  ok(sets.every(function (s) { return Object.keys(s).length >= 300; }), '보기의 조합이 다양하다: ' + sets.map(function (s) { return Object.keys(s).length; }).join(', '));
  ok(Object.keys(forms).length >= 30, '보기의 꼴이 다양하다: ' + Object.keys(forms).length);
  eq(Object.keys(bag).sort().join(' '), 'pick-1 pick-2 pick-3', '실수의 종류');
  done('유리수와 무리수');

  /* ── 제곱근의 어림 ── */
  group('B17 — 제곱근의 어림 (단계마다 1,000문제)');
  /** 조건에 맞는 자연수를 1 부터 하나씩 세어 본다 */
  var count = function (test, top) { var c = 0, last = 0, first = 0; for (var x = 1; x <= top; x++) if (test(B(x))) { c++; last = x; if (!first) first = x; } return { c: c, last: last, first: first }; };
  bag = {}; kinds = {};
  each('B17.between', function (p, pr, level, where) {
    var m, want, n, k;
    if ((m = /^\$\\sqrt\{(\d+)\}\$보다 (작은 자연수 가운데 가장 큰 수|큰 자연수 가운데 가장 작은 수)를 구하세요\.$/.exec(pr.text))) {
      n = B(m[1]); ok(level === 0 && !isSq(n), where + '근호 안은 제곱수가 아님');
      want = /^작은/.test(m[2]) ? count(function (x) { return x * x < n; }, 300).last : count(function (x) { return x * x > n; }, 300).first; kinds[/^작은/.test(m[2]) ? 'floor' : 'ceil'] = 1;
    } else if ((m = /^\$(\d+) < \\sqrt\{x\} < (\d+)\$[을를] 만족하는 자연수 \$x\$의 개수를 구하세요\.$/.exec(pr.text))) {
      ok(level === 1, where + '단계'); want = count(function (x) { return B(m[1]) * B(m[1]) < x && x < B(m[2]) * B(m[2]); }, 400).c; kinds.range = 1;
    } else if ((m = /^\$\\sqrt\{(\d+)\} < x < \\sqrt\{(\d+)\}\$[을를] 만족하는 자연수 \$x\$의 개수를 구하세요\.$/.exec(pr.text))) {
      ok(level === 1 && !isSq(m[1]) && !isSq(m[2]), where + '단계'); want = count(function (x) { return x * x > B(m[1]) && x * x < B(m[2]); }, 400).c; kinds.ints = 1;
    } else if ((m = /^\$\\sqrt\{(\d+)\} \+ (\d+)\$보다 작은 자연수 가운데 가장 큰 수를 구하세요\.$/.exec(pr.text))) {
      n = B(m[1]); k = B(m[2]); ok(level === 2 && !isSq(n), where + '단계'); want = count(function (x) { return x - k <= 0n || (x - k) * (x - k) < n; }, 300).last; kinds.sum = 1;
    } else if ((m = /^\$(\d+) - \\sqrt\{(\d+)\}\$보다 작은 자연수 가운데 가장 큰 수를 구하세요\.$/.exec(pr.text))) {
      n = B(m[2]); k = B(m[1]); ok(level === 2 && !isSq(n), where + '단계'); want = count(function (x) { return k - x > 0n && n < (k - x) * (k - x); }, 300).last; kinds.diff = 1;
    } else { ok(false, where + '문제 글: ' + pr.text); return; }
    ok(want >= 1 && !pr.tex && !pr.figure, where + '답은 자연수');
    numChecks('B17.between', p, Q(want), where, bag);
    MH.types['B17.between'].steps(p.v).forEach(function (s, i) {
      var chain;
      if (/x/.test(s.tex)) return;
      try {
        chain = s.tex.split(' < ').map(function (part) { var v = part.split(' = ').map(hp); ok(v.every(function (y) { return y === v[0]; }), where + '풀이의 등식: ' + part); return v[0]; });
        ok(chain.every(function (v, j) { return !j || chain[j - 1] < v; }), where + '풀이 ' + (i + 1) + '째 줄의 크기 차례: ' + s.tex);
      } catch (e) { ok(false, where + '풀이를 읽지 못함: ' + s.tex + ' (' + e + ')'); }
    });
  });
  eq(Object.keys(kinds).sort().join(' '), 'ceil diff floor ints range sum', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'difference-only endpoints-included halved no-square one-less one-more one-off other-side radicand-count root-ignored root-only', '실수의 종류');
  done('제곱근의 어림');

  /* ── 실수의 대소 관계 ── */
  group('B17 — 실수의 대소 관계 (단계마다 1,000문제)');
  /** 수 하나의 크기 차례를 정하는 값: 부호 × (크기의 제곱). 분수 */
  var ord = function (o) {
    var s = /^-/.test(o) ? -1 : 1, t = o.replace(/^-/, ''), m = /^\\sqrt\{(\d+)\}$/.exec(t), f = /^\\sqrt\{\\dfrac\{(\d+)\}\{(\d+)\}\}$/.exec(t), v = m ? Q(m[1]) : f ? Q(f[1], f[2]) : plain(t) ? mul(plain(t), plain(t)) : null;
    return v ? (s < 0 ? neg(v) : v) : null;
  };
  var truthOf = function (o) { var m = /^(.+) ([<>]) (.+)$/.exec(o), a, b; if (!m) return null; a = hp(m[1]); b = hp(m[3]); if ((a > b ? a - b : b - a) < HP / 1000000n) return null; return (m[2] === '>') === (a > b); };
  ok(truthOf('\\sqrt{5} + 1 > 3') === true && truthOf('7 - \\sqrt{10} > 4') === false && truthOf('-\\sqrt{8} < -3') === false && truthOf('\\sqrt{3} + 2 < \\sqrt{5} + 2') === true && truthOf('\\sqrt{3} - 6 < -4') === true, '부등식의 참 · 거짓');
  bag = {}; sets = [{}, {}, {}]; wants = {}; var looks = {};
  each('B17.compare', function (p, pr, level, where) {
    var opts = choiceChecks('B17.compare', p, where, bag), m, vals, best, st = MH.types['B17.compare'].steps(p.v);
    ok(!pr.tex && !pr.figure, where + '문제');
    sets[level][opts.slice().sort().join('|')] = 1;
    if (level < 2) {
      m = /^다음 중 가장 (큰|작은) 수를 고르세요\.$/.exec(pr.text); vals = opts.map(ord);
      ok(!!m && vals.every(function (v) { return !!v; }), where + '문제 글 · 보기: ' + pr.text + ' / ' + opts.join(' | ')); if (!m || vals.indexOf(null) >= 0) return;
      wants[level + m[1]] = 1;
      best = opts.filter(function (o, i) { return vals.every(function (v, j) { return i === j || (m[1] === '큰' ? less(v, vals[i]) : less(vals[i], v)); }); });
      ok(best.length === 1 && best[0] === p.answer, where + '답: ' + opts.join(' | ') + ' → ' + p.answer);
      ok(opts.some(function (o) { return /sqrt/.test(o); }) && opts.some(function (o) { return !/sqrt/.test(o); }), where + '근호가 있는 수와 없는 수가 섞여 있어야 함');
      if (level === 0) ok(opts.every(function (o) { return /^(\d+|\\sqrt\{\d+\})$/.test(o); }), where + '1단계는 양의 정수와 제곱근');
      else { ok(opts.some(function (o) { return /^-|dfrac/.test(o); }), where + '2단계는 음수나 분수'); looks[(/^-/.test(opts[0]) ? '음' : '양') + (opts.some(function (o) { return /dfrac/.test(o); }) ? '분' : '')] = 1; }
      MH.mistakesFor(p).forEach(function (x) { var s = /그래서 이 수는 답보다 (작아요|커요)\.$/.exec(x.explain); ok(!!s && (s[1] === '작아요') === less(ord(x.value), ord(p.answer)), where + '설명의 크기: ' + x.value + ' / ' + x.explain); });
      var chain = st[1].tex.split(' < ');
      ok(chain.length === 4 && chain.slice().sort().join('|') === opts.slice().sort().join('|') && chain.every(function (o, i) { return !i || less(ord(chain[i - 1]), ord(o)); }), where + '풀이의 크기 차례: ' + st[1].tex);
      st[0].tex.split(',\\quad ').forEach(function (line) { var e = line.split(' = '); ok(e.length === 2 && same(ord(e[0]), ord(e[1])), where + '풀이의 식: ' + line); });
    } else {
      m = /^다음 중 옳(은|지 않은) 것을 고르세요\.$/.exec(pr.text);
      ok(!!m && opts.every(function (o) { return truthOf(o) !== null; }), where + '문제 글 · 보기: ' + pr.text + ' / ' + opts.join(' | ')); if (!m) return;
      wants[level + m[1]] = 1;
      ok(opts.every(function (o) { return (truthOf(o) === (m[1] === '은')) === (o === p.answer); }), where + '답만 조건에 맞아야 함: ' + opts.join(' | ') + ' → ' + p.answer);
      opts.forEach(function (o) { looks[o.replace(/\d+/g, 'N').replace(/[<>]/, '○')] = 1; });
      MH.mistakesFor(p).concat([{ value: p.answer, explain: st[0].say }]).forEach(function (x) {
        var s = /^이 식은 (옳아요|틀려요)\./.exec(x.explain), t, re = /\$(\d+) = \\sqrt\{(\d+)\}\$이고 \$(\d+) ([<>]) (\d+)\$이니 \$\\sqrt\{(\d+)\} ([<>]) (\d+)\$/.exec(x.explain);
        ok(!!s && (s[1] === '옳아요') === truthOf(x.value), where + '설명의 판단: ' + x.value + ' / ' + x.explain);
        if (re) ok(B(re[1]) * B(re[1]) === B(re[2]) && re[5] === re[2] && re[3] === re[6] && re[8] === re[1] && re[4] === re[7] && (re[4] === '<') === (B(re[3]) < B(re[5])), where + '설명의 계산: ' + x.explain);
        if ((t = /\$(\d+) - (\d+) = (\d+)\$/.exec(x.explain))) ok(Number(t[1]) - Number(t[2]) === Number(t[3]), where + '설명의 뺄셈: ' + x.explain);
      });
      ok(truthOf(st[0].tex) === true && st[0].tex.replace(/[<>]/, '○') === p.answer.replace(/[<>]/, '○'), where + '풀이의 바른 식: ' + st[0].tex);
    }
  });
  eq(Object.keys(wants).length, 6, '단계마다 두 가지 물음이 모두 나온다');
  ok(sets.every(function (s) { return Object.keys(s).length >= 300; }), '보기의 조합이 다양하다: ' + sets.map(function (s) { return Object.keys(s).length; }).join(', '));
  ok(['음', '음분', '양분'].every(function (k) { return looks[k]; }) && Object.keys(looks).length >= 9, '보기의 꼴이 다양하다: ' + Object.keys(looks).join(' | '));
  eq(Object.keys(bag).sort().join(' '), 'pick-1 pick-2 pick-3', '실수의 종류');
  done('실수의 대소 관계');
})();
