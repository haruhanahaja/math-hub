/* C01 다항식의 연산 — 단원 전용 검사.
   화면에 보이는 식(문제 · 보기 · 풀이의 줄)을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어, 문자에 수 세 벌을 넣은 값으로 견준다.
   한 문자의 다항식은 글자에서 계수를 읽어, 여기서 따로 만든 덧셈 · 곱셈 · 나눗셈으로 답을 다시 구한다. 단원 파일의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, sig = ALG.sig, noJosa = ALG.noJosa, isInt = Number.isInteger;
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
  };
  var termsOf = function (t) { return t.replace(/ - /g, ' + -').split(' + '); };
  var letterPart = function (term) { return term.replace(/^-?\d*/, ''); };
  /** 전개해서 정리한 다항식인가: 괄호 · 곱셈 기호가 없고, 같은 종류의 항이 한 번씩만 나오고, 계수 0 · 1 과 지수 1 을 쓰지 않는다 */
  var tidy = function (t) {
    if (/[()\\]/.test(t) || /\^\{1\}/.test(t)) return false;
    var ts = termsOf(t), lps = ts.map(letterPart);
    return lps.every(function (x, i) { return lps.indexOf(x) === i; }) && ts.every(function (x) { return /^-?(\d+|\d*(?:[a-z](?:\^\{\d+\})?)+)$/.test(x) && !/^-?[01][a-z]/.test(x) && !/^-?0$/.test(x); });
  };
  /** 한 문자(x)의 다항식을 읽어 계수의 배열로(낮은 차수부터). 항의 차례는 뒤섞여 있어도 된다 */
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
  var addP = function (x, y, m, n) { var out = [], i; for (i = 0; i < Math.max(x.length, y.length); i++) out.push(m * (x[i] || 0) + n * (y[i] || 0)); return out; };
  var mulP = function (x, y) { var out = [], i, j; for (i = 0; i < x.length + y.length - 1; i++) out.push(0); for (i = 0; i < x.length; i++) for (j = 0; j < y.length; j++) out[i + j] += x[i] * y[j]; return out; };
  /** 세로 나눗셈(낮은 차수부터의 배열). 계수가 정수로 나누어떨어지지 않으면 null */
  var divP = function (a, b) {
    var q = [], db = b.length - 1, i, j, c;
    a = a.slice();
    for (i = a.length - 1; i >= db; i--) { c = a[i] / b[db]; if (!isInt(c)) return null; q[i - db] = c; for (j = 0; j <= db; j++) a[i - db + j] -= c * b[j]; }
    return { q: q, r: a.slice(0, db) };
  };
  var degs = function (t) { return termsOf(t).map(function (term) { var m = /x(?:\^\{(\d+)\})?/.exec(term); return m ? Number(m[1] || 1) : 0; }); };
  var descending = function (t) { var ds = degs(t); return ds.every(function (d, i) { return i === 0 || ds[i - 1] > d; }); };
  var gcd = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; };
  var eqLine = function (tex) { var parts = tex.split(' = ').map(sig); return parts.length >= 2 && parts.every(function (x) { return !!x && x === parts[0]; }); };

  var choiceChecks = function (id, p, pr, where, bag) {
    var opts = MH.optionsOf(p), sigs;
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    sigs = opts.map(sig);
    ok(sigs.every(function (s, i) { return !!s && sigs.indexOf(s) === i; }), where + '값이 같은 보기가 있음: ' + opts.join(' | '));
    ok(opts.every(tidy), where + '보기는 모두 정리한 꼴: ' + opts.join(' | '));
    return opts;
  };
  var numChecks = function (id, p, where, bag) {
    var def = MH.types[id], kind = MH.kinds[def.answer.kind], ans = p.answer.n;
    ok(p.answer.p === 0 && isInt(ans) && ans !== 0, where + '답은 0 이 아닌 정수');
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; ok(isInt(x.value.n) && x.value.n !== ans && x.value.n !== -ans && x.value.n !== 0, where + '실수 값: ' + x.id + ' ' + x.value.n); });
    ok(MH.mistakesFor(p).length >= 2, where + '실수가 둘은 있어야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    detailed(id, p, where);
    return ans;
  };

  group('C01 — 검사 도구 자체 검사');
  ok(sameP(readPoly('3x - 5 + 2x^{3} + x^{2}'), [-5, 3, 1, 2]) && sameP(readPoly('-x^{2} + 4'), [4, 0, -1]) && sameP(mulP([3, 1], [4, -2, 1]), [12, -2, 1, 1]), '다항식 읽기 · 곱하기');
  ok(sameP(divP([7, 5, 1], [2, 1]).q, [3, 1]) && sameP(divP([7, 5, 1], [2, 1]).r, [1]) && divP([1, 0, 1], [1, 2]) === null && sameP(divP([1, -2, 0, 1], [-1, 1]).q, [-1, 1, 1]), '세로 나눗셈');
  ok(descending('x^{3} - 2x + 1') && !descending('x + x^{2}') && tidy('a^{3} + 3a^{2}b + 3ab^{2} + b^{3}') && !tidy('x^{2} + 3x + 2x'), '내림차순 · 정리한 꼴');
  ok(eqLine('(x^{2} + 5x + 7) - x(x + 2) = 3x + 7') && !eqLine('(x^{2} + 5x + 7) - x(x + 2) = 3x + 6'), '등식 검사');
  done('도구');

  group('C01 — 덧셈과 뺄셈 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('C01.addsub', function (p, pr, level, where) {
    choiceChecks('C01.addsub', p, pr, where, bag);
    var m = /^\\begin\{aligned\} A &= (.+) \\\\ B &= (.+) \\end\{aligned\}$/.exec(pr.tex), t = /^두 다항식 \$A\$, \$B\$가 위와 같을 때, \$(\d?)A ([+-]) (\d?)B\$를 계산하세요\.$/.exec(pr.text), steps = MH.types['C01.addsub'].steps(p.v);
    ok(!!m && !!t, where + '문제의 꼴: ' + pr.tex + ' / ' + pr.text); if (!m || !t) return;
    var ma = Number(t[1] || 1), nb = (t[2] === '-' ? -1 : 1) * Number(t[3] || 1), coef = !!(t[1] || t[3]), want = addP(readPoly(m[1]), readPoly(m[2]), ma, nb), mixed = !descending(m[1]) || !descending(m[2]);
    ok(sameP(readPoly(p.answer), want) && descending(p.answer), where + '답: ' + pr.tex + ' ' + pr.text + ' → ' + p.answer);
    eq(sig(ma + '(' + m[1] + ') + (' + nb + ')(' + m[2] + ')'), sig(p.answer), where + '문제의 값 = 답의 값');
    ok(t[1] !== '1' && t[3] !== '1' && tidy(m[1]) && tidy(m[2]), where + '식의 꼴: ' + pr.tex);
    ok(level === 0 ? t[2] === '+' && !coef && !mixed : level === 1 ? t[2] === '-' && !coef && mixed : coef && !mixed, where + '단계에 맞는 문제: ' + pr.text);
    ok(steps.length === 3 && steps.every(function (s) { return sig(s.tex) === sig(p.answer); }) && steps[2].tex === p.answer, where + '풀이의 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
    kinds[level + t[2] + (coef ? 'c' : '')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0+ 1- 2+c 2-c', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added by-position coef-dropped coef-first-only degree-merged first-only-minus mid-sign one-sign reversed subtracted', '실수의 종류');
  done('덧셈 · 뺄셈');

  group('C01 — 다항식의 곱셈 (단계마다 1,000문제)');
  bag = {};
  each('C01.mul', function (p, pr, level, where) {
    choiceChecks('C01.mul', p, pr, where, bag);
    var m = /^\(([^()]+)\)\(([^()]+)\)$/.exec(pr.tex), steps = MH.types['C01.mul'].steps(p.v), rows, P, Q;
    ok(!!m && pr.text === '다음 식을 전개하세요.', where + '문제의 꼴: ' + pr.tex); if (!m) return;
    P = readPoly(m[1]); Q = readPoly(m[2]);
    ok(sameP(readPoly(p.answer), mulP(P, Q)) && descending(p.answer) && sig(pr.tex) === sig(p.answer), where + '답: ' + pr.tex + ' → ' + p.answer);
    ok(descending(m[1]) && descending(m[2]) && termsOf(m[1]).length === (level === 2 ? 3 : 2) && termsOf(m[2]).length === 3 && (level === 1 ? P[1] >= 2 : P[P.length - 1] === 1 && Q[2] === 1), where + '단계에 맞는 식: ' + pr.tex);
    rows = steps.slice(0, -1);
    ok(rows.length === termsOf(m[1]).length && rows.every(function (s) { return eqLine(s.tex) && termsOf(s.tex.split(' = ')[1]).length === 3; }), where + '풀이의 줄마다 등식: ' + rows.map(function (s) { return s.tex; }).join(' / '));
    eq(sig(rows.map(function (s) { return '(' + s.tex.split(' = ')[1] + ')'; }).join(' + ')), sig(p.answer), where + '줄을 모두 더하면 답');
    eq(steps[steps.length - 1].tex, p.answer, where + '풀이의 마지막 줄');
  });
  eq(Object.keys(bag).sort().join(' '), 'cross-sign exp-not-added first-last last-sign one-missing second-undistributed', '실수의 종류');
  done('곱셈');

  group('C01 — 세 항의 제곱 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('C01.trisq', function (p, pr, level, where) {
    choiceChecks('C01.trisq', p, pr, where, bag);
    var m = /^\(([^()]+)\)\^\{2\}$/.exec(pr.tex), steps = MH.types['C01.trisq'].steps(p.v), ts, k;
    ok(!!m && pr.text === '다음 식을 전개하세요.' && termsOf(m[1]).length === 3, where + '문제의 꼴: ' + pr.tex); if (!m) return;
    ts = termsOf(m[1]);
    eq(sig(pr.tex), sig(p.answer), where + '문제의 값 = 답의 값: ' + pr.tex + ' → ' + p.answer);
    k = /x\^\{2\}/.test(m[1]) ? 'quad' : /\d[a-z]/.test(m[1]) ? 'coef' : /^-?[a-z]$/.test(ts[2]) ? 'abc' : 'plain'; kinds[level + k] = 1;
    ok(level === 0 ? k === 'abc' || k === 'plain' : level === 1 ? k === 'coef' : k === 'quad', where + '단계에 맞는 식: ' + pr.tex);
    eq(termsOf(p.answer).length, k === 'quad' ? termsOf(p.answer).length : 6, where + '답의 항 수: ' + p.answer);
    ok(k !== 'quad' || (descending(p.answer) && sameP(readPoly(p.answer), mulP(readPoly(m[1]), readPoly(m[1])))), where + '답(이차식의 제곱): ' + p.answer);
    ok(steps.length === 3 && steps.every(function (s) { return sig(s.tex) === sig(pr.tex); }) && steps[2].tex === p.answer && termsOf(steps[1].tex).length === 6, where + '풀이의 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
  });
  eq(Object.keys(kinds).sort().join(' '), '0abc 0plain 1coef 2quad', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'all-plus coef-not-squared const-not-squared cross-sign neg-square no-double one-missing squares-only', '실수의 종류');
  done('세 항의 제곱');

  group('C01 — 세제곱 공식 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('C01.cube', function (p, pr, level, where) {
    choiceChecks('C01.cube', p, pr, where, bag);
    var m = /^\((\d*)([a-z]) ([+-]) (\d*)([a-z]?)\)\^\{3\}$/.exec(pr.tex), steps = MH.types['C01.cube'].steps(p.v), k;
    ok(!!m && pr.text === '다음 식을 전개하세요.' && (m[4] || m[5]), where + '문제의 꼴: ' + pr.tex); if (!m) return;
    eq(sig(pr.tex), sig(p.answer), where + '문제의 값 = 답의 값: ' + pr.tex + ' → ' + p.answer);
    eq(termsOf(p.answer).length, 4, where + '답은 네 항: ' + p.answer);
    k = (m[1] ? 'c' : '') + (m[5] ? 'two' : 'num'); kinds[level + k + m[3]] = 1;
    ok(level === 0 ? k === 'num' : level === 1 ? k === 'cnum' || k === 'two' : k === 'cnum' || k === 'ctwo', where + '단계에 맞는 식: ' + pr.tex);
    ok(steps.length === 2 && steps.every(function (s) { return sig(s.tex) === sig(pr.tex); }) && steps[1].tex === p.answer && termsOf(steps[0].tex).length === 4, where + '풀이의 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
    ok(/\^\{3\}\$에 넣어요/.test(steps[0].say) && (m[3] === '-') === /\(a - b\)/.test(steps[0].say), where + '풀이에 쓴 공식: ' + steps[0].say);
  });
  eq(Object.keys(kinds).sort().join(' '), '0num+ 0num- 1cnum+ 1cnum- 1two+ 1two- 2cnum+ 2cnum- 2ctwo+ 2ctwo-', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'all-minus all-plus b-not-squared coef-not-cubed last-plus no-middle no-three times-three two-for-three', '실수의 종류');
  done('세제곱');

  group('C01 — 세제곱의 합과 차 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('C01.sumcube', function (p, pr, level, where) {
    choiceChecks('C01.sumcube', p, pr, where, bag);
    var m = /^\(([^()]+)\)\(([^()]+)\)$/.exec(pr.tex), steps = MH.types['C01.sumcube'].steps(p.v), ts, formula, rows;
    ok(!!m && pr.text === '다음 식을 전개하세요.' && termsOf(m[1]).length === 2 && termsOf(m[2]).length === 3, where + '문제의 꼴: ' + pr.tex); if (!m) return;
    ts = termsOf(m[1]);
    eq(sig(pr.tex), sig(p.answer), where + '문제의 값 = 답의 값: ' + pr.tex + ' → ' + p.answer);
    /* 공식 꼴인가: 둘째 괄호가 a² − ab + b² (b 는 부호까지) 와 같은 식인가 */
    formula = sig(m[2]) === sig('(' + ts[0] + ')^{2} - (' + ts[0] + ')(' + ts[1] + ') + (' + ts[1] + ')^{2}');
    ok(formula || sig(m[2]) === sig('(' + ts[0] + ')^{2} + (' + ts[0] + ')(' + ts[1] + ') + (' + ts[1] + ')^{2}'), where + '둘째 괄호의 꼴: ' + pr.tex);
    eq(termsOf(p.answer).length, formula ? 2 : 4, where + '답의 항 수: ' + p.answer);
    ok(level === 2 || formula, where + '0 · 1단계는 공식 꼴만: ' + pr.tex);
    kinds[level + (formula ? 'f' : 't') + (/^-/.test(ts[1]) ? '-' : '+')] = 1;
    eq(steps.length, 3, where + '풀이는 세 줄'); eq(steps[2].tex, p.answer, where + '풀이의 마지막 줄');
    if (formula) ok(steps.every(function (s) { return sig(s.tex) === sig(pr.tex); }), where + '풀이의 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
    else {
      rows = steps.slice(0, 2);
      ok(rows.every(function (s) { return eqLine(s.tex); }) && sig(rows.map(function (s) { return '(' + s.tex.split(' = ')[1] + ')'; }).join(' + ')) === sig(p.answer), where + '풀이의 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
      ok(MH.mistakesFor(p).some(function (x) { return x.id === 'formula-misused'; }), where + '공식을 잘못 쓴 보기가 있어야 함');
    }
  });
  eq(Object.keys(kinds).sort().join(' '), '0f+ 0f- 1f+ 1f- 2f+ 2f- 2t+ 2t-', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'as-cube coef-not-cubed cross-sign formula-misused middle-kept one-missing sign squared times-three', '실수의 종류');
  done('세제곱의 합 · 차');

  group('C01 — 곱셈 공식의 변형 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('C01.value', function (p, pr, level, where) {
    var ans = numChecks('C01.value', p, where, bag), t = pr.tex, steps = MH.types['C01.value'].steps(p.v), A = sig(String(ans)), m, want, k, s, q, parts;
    if ((m = /^x ([+-]) y = (-?\d+),\\quad xy = (-?\d+)$/.exec(t))) {
      k = m[1] === '+' ? 'sum3' : 'diff3'; s = Number(m[2]); q = Number(m[3]);
      eq(pr.text, '위 조건이 성립할 때, $x^{3} ' + m[1] + ' y^{3}$의 값을 구하세요.', where + '문제 글');
      want = m[1] === '+' ? s * s * s - 3 * q * s : s * s * s + 3 * q * s;
      ok((m[1] === '+' ? s * s - 4 * q : s * s + 4 * q) > 0 && q !== 0, where + '조건에 맞는 실수 x, y 가 있어야 함: ' + t);
      parts = steps[0].tex.split(' = ');
      ok(parts.length === 2 && parts[0] === 'x^{3} ' + m[1] + ' y^{3}' && sig(parts[0]) === sig(parts[1]), where + '풀이 첫 줄은 항등식: ' + steps[0].tex);
      eq(sig(parts[1].replace(/\(x [+-] y\)/g, '(' + s + ')').replace('xy', ' \\times (' + q + ') \\times ')), A, where + '항등식에 값을 넣으면 답: ' + steps[0].tex);
    } else if ((m = /^x ([+-]) \\dfrac\{1\}\{x\} = (\d+)$/.exec(t))) {
      k = 'recip' + m[1]; s = Number(m[2]);
      eq(pr.text, '위 조건이 성립할 때, $x^{3} ' + m[1] + ' \\dfrac{1}{x^{3}}$의 값을 구하세요.', where + '문제 글');
      want = m[1] === '+' ? s * s * s - 3 * s : s * s * s + 3 * s;
      ok(m[1] === '-' || s >= 2, where + '조건에 맞는 실수 x 가 있어야 함: ' + t);
      parts = steps[0].tex.split(' = ');
      ok(parts.length === 2 && sig(parts[0]) === sig(parts[1]) && sig(parts[0]) === sig('x^{3} ' + m[1] + ' \\dfrac{1}{x^{3}}'), where + '풀이 첫 줄은 항등식: ' + steps[0].tex);
    } else if ((m = /^a \+ b \+ c = (-?\d+),\\quad ab \+ bc \+ ca = (-?\d+)$/.exec(t))) {
      k = 'tri'; s = Number(m[1]); q = Number(m[2]); want = s * s - 2 * q;
      eq(pr.text, '위 조건이 성립할 때, $a^{2} + b^{2} + c^{2}$의 값을 구하세요.', where + '문제 글');
      ok(s * s >= 3 * q && q !== 0, where + '조건에 맞는 실수 a, b, c 가 있어야 함: ' + t);
      ok(eqLine(steps[0].tex) && steps[0].tex.split(' = ')[0] === 'a^{2} + b^{2} + c^{2}', where + '풀이 첫 줄은 항등식: ' + steps[0].tex);
    } else if ((m = /^a \+ b \+ c = (-?\d+),\\quad a\^\{2\} \+ b\^\{2\} \+ c\^\{2\} = (\d+)$/.exec(t))) {
      k = 'tri-rev'; s = Number(m[1]); q = Number(m[2]); want = (s * s - q) / 2;
      eq(pr.text, '위 조건이 성립할 때, $ab + bc + ca$의 값을 구하세요.', where + '문제 글');
      ok(3 * q >= s * s && isInt(want), where + '조건에 맞는 실수 a, b, c 가 있어야 함: ' + t);
      ok(eqLine(steps[0].tex), where + '풀이 첫 줄은 항등식: ' + steps[0].tex);
      eq(sig(steps[1].tex.split(' = ')[0]), sig(steps[1].tex.split(' = ')[1].replace('(ab + bc + ca)', '(' + ans + ')')), where + '답을 넣으면 둘째 줄이 성립: ' + steps[1].tex);
    } else { ok(false, where + '문제의 식: ' + t); return; }
    kinds[level + k] = 1;
    eq(ans, want, where + '답: ' + t);
    ok(steps.length === 3 && steps.filter(function (st) { return !/[a-z]/.test(st.tex.replace(/\\[a-z]+/g, '')); }).every(function (st) { return st.tex.split(' = ').every(function (x) { return sig(x) === A; }); }), where + '수로 된 풀이의 줄은 모두 답과 같은 값: ' + steps.map(function (st) { return st.tex; }).join(' / '));
    ok(/ = -?\d+$/.test(steps[2].tex) && Number(steps[2].tex.split(' = ').pop()) === ans, where + '풀이의 마지막 줄: ' + steps[2].tex);
  });
  eq(Object.keys(kinds).sort().join(' '), '0sum3 1diff3 1recip+ 1recip- 2tri 2tri-rev', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'doubled just-cube just-square minus no-double no-half no-sum no-three not-squared plus product-only square-formula', '실수의 종류');
  done('공식의 변형');

  group('C01 — 나눗셈의 몫 · 검산식 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('C01.div', function (p, pr, level, where) {
    choiceChecks('C01.div', p, pr, where, bag);
    var steps = MH.types['C01.div'].steps(p.v), m, Ap, Bp, Qp, d;
    ok(descending(p.answer), where + '답은 내림차순: ' + p.answer);
    if (level === 3) {
      m = /^\\begin\{aligned\} B &= (.+) \\\\ Q &= (.+) \\\\ R &= (-?\d+) \\end\{aligned\}$/.exec(pr.tex);
      ok(!!m && pr.text === '다항식 $A$를 $B$로 나눈 몫이 $Q$, 나머지가 $R$일 때, 다항식 $A$를 고르세요.', where + '문제의 꼴: ' + pr.tex); if (!m) return;
      Bp = readPoly(m[1]); Qp = readPoly(m[2]);
      ok(Bp.length === 2 && Number(m[3]) !== 0 && descending(m[1]) && descending(m[2]), where + '식의 꼴: ' + pr.tex);
      ok(sameP(readPoly(p.answer), addP(mulP(Bp, Qp), [Number(m[3])], 1, 1)), where + '답 = B × Q + R: ' + pr.tex + ' → ' + p.answer);
      eq(sig('(' + m[1] + ')(' + m[2] + ') + (' + m[3] + ')'), sig(p.answer), where + '검산식의 값 = 답의 값');
      ok(steps.length === 3 && steps[0].tex.indexOf('A = ') === 0 && steps.every(function (s) { return sig(s.tex.replace(/^A = /, '')) === sig(p.answer); }) && steps[2].tex === p.answer, where + '풀이의 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
      kinds['3check' + Qp.length] = 1; return;
    }
    m = /^\((.+)\) \\div \((.+)\)$/.exec(pr.tex);
    ok(!!m && pr.text === '다음 나눗셈의 몫을 고르세요.', where + '문제의 꼴: ' + pr.tex); if (!m) return;
    Ap = readPoly(m[1]); Bp = readPoly(m[2]); d = divP(Ap, Bp);
    ok(descending(m[1]) && descending(m[2]) && tidy(m[1]) && tidy(m[2]), where + '식의 꼴: ' + pr.tex);
    ok(Ap.length === (level === 0 ? 3 : 4) && Bp.length === (level === 2 ? 3 : 2) && Bp[Bp.length - 1] === 1, where + '단계에 맞는 차수: ' + pr.tex);
    ok(!!d && sameP(d.q, readPoly(p.answer)) && d.q.every(function (c) { return c !== 0; }), where + '몫: ' + pr.tex + ' → ' + p.answer);
    ok(steps.length >= 2 && steps.slice(0, -1).every(function (s) { return eqLine(s.tex); }) && steps[steps.length - 1].tex === p.answer, where + '풀이의 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
    /* 풀이의 첫 줄은 나뉘는 식에서 시작하고, 마지막 뺄셈에서 남은 식이 나머지다 */
    ok(steps[0].tex.indexOf('(' + m[1] + ') - ') === 0 && !!d && sameP(readPoly(steps[steps.length - 2].tex.split(' = ')[1]), d.r), where + '풀이의 처음과 나머지: ' + steps[0].tex);
    kinds[level + (d && d.r.every(function (c) { return c === 0; }) ? 'exact' : 'rem')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0exact 0rem 1exact 1rem 2exact 2rem 3check2 3check3', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added cross-sign divisor-sign first-last just-lowered last-sign mid-sign no-remainder no-subtract rem-into-quotient rem-subtracted remainder-added', '실수의 종류');
  done('몫 · 검산식');

  group('C01 — 나눗셈의 나머지 (단계마다 1,000문제)');
  bag = {};
  each('C01.rem', function (p, pr, level, where) {
    var ans = numChecks('C01.rem', p, where, bag), steps = MH.types['C01.rem'].steps(p.v), m = /^\((.+)\) \\div \((.+)\)$/.exec(pr.tex), Ap, Bp, d;
    ok(!!m && pr.text === '다음 나눗셈의 나머지를 구하세요.', where + '문제의 꼴: ' + pr.tex); if (!m) return;
    Ap = readPoly(m[1]); Bp = readPoly(m[2]); d = divP(Ap, Bp);
    ok(descending(m[1]) && descending(m[2]) && tidy(m[1]) && tidy(m[2]) && Bp.length === 2 && Bp[0] !== 0, where + '식의 꼴: ' + pr.tex);
    ok(level === 0 ? Ap.length === 3 && Bp[1] === 1 : level === 1 ? Ap.length === 4 && Bp[1] === 1 : Bp[1] >= 2 && gcd(Bp[1], Bp[0]) === 1, where + '단계에 맞는 식: ' + pr.tex);
    ok(!!d && d.r.length === 1 && d.r[0] === ans, where + '나머지: ' + pr.tex + ' → ' + ans);
    ok(steps.length >= 2 && steps.slice(0, -1).every(function (s) { return eqLine(s.tex); }) && steps[steps.length - 1].tex === String(ans) && steps[steps.length - 2].tex.split(' = ')[1] === String(ans), where + '풀이의 줄: ' + steps.map(function (s) { return s.tex; }).join(' / '));
  });
  eq(Object.keys(bag).sort().join(' '), 'const-kept divisor-sign last-added quotient-term', '실수의 종류');
  done('나머지');

  group('C01 — 개념 카드');
  ok(MH.concepts.C01 && MH.concepts.C01.length === 6, '개념 카드는 6장');
  done('개념 카드');
})();
