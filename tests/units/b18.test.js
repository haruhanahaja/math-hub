/* B18 근호를 포함한 식의 계산 — 단원 전용 검사.
   화면에 보이는 식(문제 · 보기 · 풀이의 줄)을 이 파일의 읽개(val)로 직접 읽어 값을 구한다.
   값은 10^40 배 한 BigInt 정수이고 √ 는 정수 제곱근이다(부동소수점을 쓰지 않는다).
   문제의 값 = 답의 값, 틀린 보기의 값 ≠ 답의 값, 풀이의 모든 줄의 값 = 문제의 값인지 본다.
   단원 파일의 계산(S, seval, approx …)과 무관하다. */
(function () {
  'use strict';
  var N = 1000, noJosa = ALG.noJosa, B = BigInt;
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
        if (/\}\}\$?$/.test(t.slice(0, m.index + 3)) || /dfrac\{\d+\}\{\d+$/.test(t.slice(0, m.index + 1)) || /\^\{\d+$/.test(t.slice(0, m.index + 1))) continue;   /* 분수 · 지수 뒤는 따로 읽는다 */
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
      ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object/.test(t), where + '글: ' + t);
    });
  };

  /* ── 읽개: 식의 글자 → 10^40 배 한 정수 ── */
  var SC = 10n ** 40n, TOL = 10n ** 15n, FAR = 10n ** 31n;   /* 10^-25 안이면 같은 값, 10^-9 넘게 다르면 다른 값 */
  var isq = function (n) { if (n < 2n) return n; var x = n, y = (x + 1n) / 2n; while (y < x) { x = y; y = (x + n / x) / 2n; } return x; };
  var val = function (tex, env) {
    var s = tex.replace(/\\left|\\right/g, ''), i = 0;
    var at = function (t) { return s.substr(i, t.length) === t; };
    var skip = function () { while (s.charAt(i) === ' ') i++; };
    var eat = function (t) { if (!at(t)) throw new Error('"' + t + '" 가 와야 함: ' + s + ' @' + i); i += t.length; };
    var expr, term, unary, juxt, power, primary;
    primary = function () {
      var m, v, w;
      if ((m = /^\d+(\.\d+)?/.exec(s.slice(i)))) { i += m[0].length; return m[1] ? B(m[0].replace('.', '')) * SC / 10n ** B(m[1].length - 1) : B(m[0]) * SC; }
      if (at('\\sqrt{')) { i += 6; v = expr(); eat('}'); if (v < 0n) throw new Error('근호 안이 음수: ' + s); return isq(v * SC); }
      if (at('\\dfrac{')) { i += 7; v = expr(); eat('}'); eat('{'); w = expr(); eat('}'); return v * SC / w; }
      if (at('(')) { i++; v = expr(); eat(')'); return v; }
      if (at('a') && env && env.a !== undefined) { i++; return B(env.a) * SC; }
      throw new Error('읽지 못함: ' + s + ' @' + i);
    };
    power = function () { var v = primary(), m, e, z; if (at('^{') && (m = /^\^\{(\d+)\}/.exec(s.slice(i)))) { i += m[0].length; z = SC; for (e = 0; e < Number(m[1]); e++) z = z * v / SC; return z; } return v; };
    juxt = function () { var v = power(); while (at('\\sqrt{') || at('\\dfrac{') || at('(') || (at('a') && env && env.a !== undefined)) v = v * power() / SC; return v; };
    unary = function () { skip(); if (at('-')) { i++; return -juxt(); } return juxt(); };
    term = function () { var v = unary(); for (;;) { skip(); if (at('\\times')) { i += 6; v = v * unary() / SC; } else if (at('\\div')) { i += 4; v = v * SC / unary(); } else return v; } };
    expr = function () { var v = term(); for (;;) { skip(); if (at('+')) { i++; v += term(); } else if (at('-')) { i++; v -= term(); } else return v; } };
    var out = expr(); skip();
    if (i !== s.length) throw new Error('끝까지 읽지 못함: ' + s + ' @' + i);
    return out;
  };
  var dist = function (x, y) { return x > y ? x - y : y - x; };
  var eqv = function (x, y) { return dist(x, y) < TOL; };
  var sfreeOk = function (n) { for (var k = 2; k * k <= n; k++) if (n % (k * k) === 0) return false; return true; };
  var gcdN = function (a, b) { while (b) { var t = a % b; a = b; b = t; } return a; };
  /** 답이 가장 간단한 꼴인가: 근호 안에 제곱인수가 없고, 분모에 근호가 없고, 분수는 기약이고, 같은 근호가 두 번 나오지 않는다 */
  var tidy = function (t) {
    var rads = (t.match(/\\sqrt\{(\d+)\}/g) || []).map(function (x) { return Number(/\d+/.exec(x)[0]); }), fr = /\\dfrac\{(\d*)(?:\\sqrt\{\d+\})?\}\{(\d+)\}/g, m;
    if ((t.match(/\\sqrt/g) || []).length !== rads.length || rads.some(function (n, i) { return !sfreeOk(n) || n < 2 || rads.indexOf(n) !== i; })) return false;
    if (/\}\{[^{}]*\\sqrt/.test(t)) return false;
    while ((m = fr.exec(t))) if (gcdN(Number(m[1] || 1), Number(m[2])) !== 1 || m[2] === '1') return false;
    return true;
  };
  var choiceChecks = function (id, p, pr, where, bag) {
    var opts = MH.optionsOf(p), v, a;
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    try {
      v = val(pr.tex); a = val(p.answer);
      ok(eqv(v, a), where + '문제의 값과 답의 값이 다름: ' + pr.tex + ' → ' + p.answer);
      opts.forEach(function (o, i) { var w = val(o); ok(o === p.answer || dist(w, a) > FAR, where + '틀린 보기가 답과 같은 값: ' + o); opts.forEach(function (o2, j) { if (j < i) ok(dist(val(o2), w) > FAR, where + '두 보기가 같은 값: ' + o + ' , ' + o2); }); });
      MH.types[id].steps(p.v).forEach(function (s, i) { s.tex.split(' = ').forEach(function (part) { ok(eqv(val(part), v), where + '풀이 ' + (i + 1) + '째 줄의 값이 문제와 다름: ' + part); }); });
      ok(MH.types[id].steps(p.v).length >= 2, where + '풀이 줄 수');
    } catch (e) { ok(false, where + '식을 읽지 못함: ' + pr.tex + ' / ' + opts.join(' | ') + ' (' + e + ')'); }
    return opts;
  };

  group('B18 — 검사 도구 자체 검사');
  ok(eqv(val('2\\sqrt{3} \\times (-3\\sqrt{2})'), val('-6\\sqrt{6}')) && eqv(val('\\dfrac{6}{\\sqrt{12}}'), val('\\sqrt{3}')) && eqv(val('6\\sqrt{10} \\div 2\\sqrt{5}'), val('3\\sqrt{2}')) && eqv(val('\\sqrt{3}(\\sqrt{12} - 2)'), val('6 - 2\\sqrt{3}')), '식 읽기');
  ok(eqv(val('\\sqrt{0.12}'), val('\\dfrac{\\sqrt{3}}{5}')) && eqv(val('\\sqrt{2^{2} \\times 3}'), val('2\\sqrt{3}')) && eqv(val('(3 - 5)\\sqrt{2}'), val('-2\\sqrt{2}')) && eqv(val('a\\sqrt{3}', { a: 4 }), val('\\sqrt{48}')) && eqv(val('\\sqrt{\\dfrac{22 \\times 5}{2}}'), val('\\sqrt{55}')), '식 읽기 2');
  ok(!eqv(val('\\sqrt{2} + \\sqrt{3}'), val('\\sqrt{5}')) && dist(val('\\sqrt{2} + \\sqrt{3}'), val('\\sqrt{5}')) > FAR, '다른 값');
  ok(tidy('2\\sqrt{3}') && tidy('\\dfrac{\\sqrt{6}}{3}') && tidy('6 - 2\\sqrt{3}') && !tidy('\\sqrt{12}') && !tidy('\\dfrac{1}{\\sqrt{2}}') && !tidy('\\dfrac{2\\sqrt{3}}{4}') && !tidy('\\sqrt{2} + 3\\sqrt{2}') && !tidy('\\sqrt{\\dfrac{1}{2}}'), '가장 간단한 꼴');
  done('도구');

  group('B18 — 근호의 곱셈 · 나눗셈 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B18.mul', function (p, pr, level, where) {
    choiceChecks('B18.mul', p, pr, where, bag);
    var t = pr.tex, k = /\\dfrac\{\\sqrt/.test(t) && level === 0 ? 'fracdiv' : /\\sqrt\{\\dfrac/.test(t) ? 'inner' : /\\times.*\\div/.test(t) ? 'three' : /\\div/.test(t) ? 'div' : 'mul';
    kinds[level + k] = 1;
    ok(pr.text === '다음을 계산하세요.' && tidy(p.answer) && /^-?\d*\\sqrt\{\d+\}$/.test(p.answer), where + '답의 꼴: ' + p.answer);
    ok(level === 0 ? !/\d\\sqrt/.test(t) && !/\\sqrt\{\\dfrac/.test(t) : level === 1 ? /\d\\sqrt|-\\sqrt/.test(t) && (k === 'mul' || k === 'div') : k === 'inner' || k === 'three', where + '단계에 맞는 식: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0div 0fracdiv 0mul 1div 1mul 2inner 2three', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added coef-added coef-lost coef-subtracted divisor-ignored half-rooted inverted multiplied numer-only root-dropped sign subtracted', '실수의 종류');
  done('곱셈 · 나눗셈');

  group('B18 — 근호 밖으로 꺼내기 · 안으로 넣기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B18.simplify', function (p, pr, level, where) {
    var opts = choiceChecks('B18.simplify', p, pr, where, bag), t = pr.tex, m;
    if (level === 0) { m = /^\\sqrt\{(\d+)\}$/.exec(t); ok(!!m && !sfreeOk(Number(m[1])) && tidy(p.answer) && /^\d+\\sqrt\{\d+\}$/.test(p.answer) && /가장 간단히/.test(pr.text), where + '꺼내기: ' + t + ' → ' + p.answer); kinds.out = 1; }
    else if (level === 1) { m = /^(-?)(\d+)\\sqrt\{(\d+)\}$/.exec(t); ok(!!m && p.answer === m[1] + '\\sqrt{' + Number(m[2]) * Number(m[2]) * Number(m[3]) + '}' && /근호 안으로 넣어/.test(pr.text), where + '넣기: ' + t + ' → ' + p.answer); kinds[m && m[1] ? 'in-' : 'in+'] = 1; ok(opts.every(function (o) { return /^-?\\sqrt\{\d+\}$/.test(o); }), where + '보기의 꼴'); }
    else { ok(/^\\sqrt\{\\dfrac\{\d+\}\{\d+\}\}$|^\\sqrt\{0\.\d\d\}$/.test(t) && tidy(p.answer) && /^\\dfrac\{\d*\\sqrt\{\d+\}\}\{\d+\}$/.test(p.answer), where + '분수 · 소수: ' + t + ' → ' + p.answer); kinds[/dfrac/.test(t) ? 'frac' : 'dec'] = 1; }
  });
  eq(Object.keys(kinds).sort().join(' '), 'dec frac in+ in- out', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added denominator-kept half-out not-squared one-place root-dropped root-ignored sign-lost square-out swapped wrong-squared', '실수의 종류');
  done('꺼내기 · 넣기');

  group('B18 — 등식에 맞는 자연수 (단계마다 1,000문제)');
  bag = {};
  each('B18.coef', function (p, pr, level, where) {
    var t = pr.tex, m, want, kind = MH.kinds.int, def = MH.types['B18.coef'];
    if ((m = /^\\sqrt\{(\d+)\} = a\\sqrt\{(\d+)\}$/.exec(t))) { ok(level === 0 && sfreeOk(Number(m[2])) && Number(m[1]) % Number(m[2]) === 0, where + '식: ' + t); want = Number(isq(B(m[1]) / B(m[2]))); ok(want * want * Number(m[2]) === Number(m[1]), where + '몫은 제곱수'); }
    else if ((m = /^(\d+)\\sqrt\{(\d+)\} = \\sqrt\{a\}$/.exec(t))) { ok(level === 1, where + '식: ' + t); want = Number(m[1]) * Number(m[1]) * Number(m[2]); }
    else if ((m = /^\\sqrt\{(\d+)\} \\times \\sqrt\{(\d+)\} = a\\sqrt\{(\d+)\}$/.exec(t))) { ok(level === 2 && sfreeOk(Number(m[3])), where + '식: ' + t); want = Number(isq(B(m[1]) * B(m[2]) / B(m[3]))); ok(want * want * Number(m[3]) === Number(m[1]) * Number(m[2]) && want >= 2, where + '몫은 제곱수'); }
    else { ok(false, where + '문제의 식: ' + t); return; }
    eq(p.answer, want, where + '답: ' + t);
    ok(pr.text === '다음 등식이 성립할 때, 자연수 $a$의 값을 구하세요.', where + '문제 글');
    try {
      ok(t.split(' = ').map(function (x) { return val(x, { a: want }); }).every(function (x, i, l) { return eqv(x, l[0]); }), where + '답을 넣으면 등식이 성립해야 함');
      MH.mistakesFor(p).forEach(function (x) { var l = t.split(' = ').map(function (y) { return val(y, { a: x.value }); }); ok(dist(l[0], l[1]) > FAR, where + '실수 값이 등식을 만족함: ' + x.id); });
      def.steps(p.v).forEach(function (s, i) { var l = s.tex.split(' = ').map(function (x) { return val(x, { a: want }); }); ok(l.length >= 2 && l.every(function (x) { return eqv(x, l[0]); }), where + '풀이 ' + (i + 1) + '째 줄: ' + s.tex); });
    } catch (e) { ok(false, where + '식을 읽지 못함: ' + t + ' (' + e + ')'); }
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { var j = MH.judge(p, kind.raw(x.value, def.answer)); ok(j.verdict === 'wrong' && !!j.mistake, where + '실수 값 판정 ' + x.id); }); }
    detailed('B18.coef', p, where);
  });
  eq(Object.keys(bag).sort().join(' '), 'added halved not-squared one-factor product-kept radicand square-out wrong-squared', '실수의 종류');
  done('등식에 맞는 자연수');

  group('B18 — 분모의 유리화 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B18.rational', function (p, pr, level, where) {
    choiceChecks('B18.rational', p, pr, where, bag);
    var t = pr.tex, m = /^\\dfrac\{(\d+|\\sqrt\{\d+\})\}\{(\d*)\\sqrt\{(\d+)\}\}$/.exec(t), k;
    ok(!!m && pr.text === '분모를 유리화한 것을 고르세요.' && tidy(p.answer), where + '문제 · 답의 꼴: ' + t + ' → ' + p.answer); if (!m) return;
    k = /sqrt/.test(m[1]) ? 'r/r' : m[2] ? 'k' : sfreeOk(Number(m[3])) ? 'plain' : 'simp'; kinds[level + k] = 1;
    ok(level === 0 ? k === 'plain' : level === 1 ? (k === 'k' || k === 'r/r') && sfreeOk(Number(m[3])) : k === 'simp' || k === 'r/r', where + '단계에 맞는 식: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0plain 1k 1r/r 2r/r 2simp', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-lost denominator-only denominator-squared numerator-only root-dropped square-out', '실수의 종류');
  done('분모의 유리화');

  group('B18 — 근호의 덧셈 · 뺄셈 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B18.add', function (p, pr, level, where) {
    choiceChecks('B18.add', p, pr, where, bag);
    var t = pr.tex, rads = (t.match(/\\sqrt\{(\d+)\}/g) || []).map(function (x) { return Number(/\d+/.exec(x)[0]); }), uniq = rads.filter(function (n, i) { return rads.indexOf(n) === i; });
    ok(pr.text === '다음을 계산하세요.' && tidy(p.answer), where + '답은 가장 간단한 꼴: ' + p.answer);
    if (level === 0) ok(uniq.length === 1 && rads.length >= 2 && sfreeOk(uniq[0]) && /^-?\d*\\sqrt\{\d+\}$/.test(p.answer), where + '1단계: ' + t);
    else if (level === 1) ok(uniq.length === 2 && rads.length === 4 && uniq.every(sfreeOk) && (p.answer.match(/\\sqrt/g) || []).length === 2, where + '2단계: ' + t);
    else { ok(rads.some(function (n) { return !sfreeOk(n); }) && /^-?\d*\\sqrt\{\d+\}$/.test(p.answer), where + '3단계는 먼저 간단히 해야 하는 식: ' + t); kinds[/dfrac/.test(t) ? 'frac' : 'plain'] = 1; }
  });
  eq(Object.keys(kinds).sort().join(' '), 'frac plain', '3단계의 종류');
  eq(Object.keys(bag).sort().join(' '), 'all-merged coef-multiplied cross denominator-only numerator-only radicands-added root-dropped sign square-out', '실수의 종류');
  done('덧셈 · 뺄셈');

  group('B18 — 분배법칙과 혼합 계산 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B18.mixed', function (p, pr, level, where) {
    choiceChecks('B18.mixed', p, pr, where, bag);
    var t = pr.tex, k = /\\div/.test(t) ? 'div' : /\) [+-] /.test(t) ? 'tail' : 'dist';
    ok((t.match(/\\sqrt\{(\d+)\}/g) || []).every(function (x) { var n = Number(/\d+/.exec(x)[0]), r = Number(isq(B(n))); return r * r !== n; }), where + '근호 안이 제곱수인 항: ' + t);
    kinds[level + k] = 1;
    ok(pr.text === '다음을 계산하세요.' && tidy(p.answer) && /\(.*[+-].*\)/.test(t), where + '문제 · 답의 꼴: ' + t + ' → ' + p.answer);
    ok(level === 0 ? /^\\sqrt\{\d+\}\(\\sqrt\{\d+\} [+-] \\sqrt\{\d+\}\)$/.test(t) && (p.answer.match(/\\sqrt/g) || []).length === 2 : level === 1 ? k === 'dist' : k !== 'dist', where + '단계에 맞는 식: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0dist 1dist 2div 2tail', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'first-only multiplied root-dropped second-only sign tail-ignored', '실수의 종류');
  done('분배법칙과 혼합 계산');
})();
