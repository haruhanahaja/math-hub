/* B20 인수분해 — 단원 전용 검사.
   화면에 보이는 식(문제 · 보기 · 풀이의 줄)을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어, 문자에 수 세 벌을 넣은 값으로 견준다.
   문제의 값 = 답의 값(답을 전개하면 문제가 된다), 답은 끝까지 인수분해한 꼴, 틀린 보기의 값 ≠ 답의 값(덜 묶은 보기만 예외),
   풀이의 모든 줄의 값 = 문제의 값인지 본다. 답이 수인 유형은 문제의 글자에서 수를 읽어 답을 따로 계산한다. 단원 파일의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, sig = ALG.sig, noJosa = ALG.noJosa;
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
      ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object/.test(t), where + '글: ' + t);
    });
  };
  var termsOf = function (t) { return t.replace(/ - /g, ' + -').split(' + '); };
  var letterPart = function (term) { return term.replace(/^-?\d*/, ''); };
  /** 전개해서 정리한 다항식인가: 괄호 · 곱셈 기호가 없고, 같은 종류의 항이 한 번씩만 나오고, 계수 0 · 1 과 지수 1 을 쓰지 않는다 */
  var tidy = function (t) {
    if (/[()\\]/.test(t) || /\^\{1\}/.test(t)) return false;
    var ts = termsOf(t), lps = ts.map(letterPart);
    return lps.every(function (x, i) { return lps.indexOf(x) === i; }) && ts.every(function (x) { return /^-?(\d+|\d*(?:[a-z](?:\^\{\d+\})?)+)$/.test(x) && !/^-?[01][a-z]/.test(x) && !/^-?0$/.test(x); });
  };
  /** 괄호 하나가 더 묶을 것이 없는 일차식인가: 항마다 일차 이하, 계수의 최대공약수 1, 모든 항에 든 문자 없음, 첫 항은 양수 */
  var gcdN = function (a, b) { while (b) { var t = a % b; a = b; b = t; } return a; };
  var primitive = function (inner) {
    var ts = termsOf(inner), cs = ts.map(function (x) { return Number(/^-?\d+/.exec(x) ? /^-?\d+/.exec(x)[0] : (x.charAt(0) === '-' ? -1 : 1)); }), lps = ts.map(letterPart);
    return ts.length >= 2 && ts[0].charAt(0) !== '-' && lps.every(function (l) { return /^[a-z]?$/.test(l); }) && cs.reduce(function (g, c) { return gcdN(g, Math.abs(c)); }, 0) === 1 && !'abxy'.split('').some(function (v) { return lps.every(function (l) { return l.indexOf(v) >= 0; }); });
  };
  /** 끝까지 인수분해한 꼴인가: (앞에 묶어 낸 단항식)(일차식)(일차식) 또는 (일차식)^{2}. → { pre, parts } 또는 null */
  var factored = function (t) {
    var m = /^([^()]*)\(([^()]+)\)(\^\{2\})?(?:\(([^()]+)\))?$/.exec(t);
    if (!m || (m[3] && m[4]) || !/^(\d*(?:[a-z](?:\^\{\d+\})?)*)$/.test(m[1]) || /^[01]/.test(m[1])) return null;
    if (!primitive(m[2]) || (m[4] && !primitive(m[4])) || (m[4] && m[4] === m[2])) return null;
    return { pre: m[1], parts: m[4] ? [m[2], m[4]] : m[3] ? [m[2], m[2]] : [m[2]] };
  };
  var SAME_OK = { 'not-finished': 1, partial: 1 };
  var choiceChecks = function (id, p, pr, where, bag) {
    var opts = MH.optionsOf(p), v = sig(pr.tex), a = sig(p.answer), steps = MH.types[id].steps(p.v), ms = MH.mistakesFor(p), distinct = [a], f = factored(p.answer);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && ms.length === 3, where + '보기: ' + opts.join(' | '));
    ms.forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    ok(pr.text === '다음 식을 인수분해하세요.' && tidy(pr.tex) && !!v && v === a, where + '문제는 전개된 식이고 답과 값이 같아야 함: ' + pr.tex + ' → ' + p.answer);
    ok(!!f, where + '답은 끝까지 인수분해한 꼴: ' + p.answer);
    /* 틀린 보기: 값이 답 · 다른 보기와 달라야 한다. 덜 묶은 식(not-finished, partial)만 값이 같고, 그 식은 끝까지 인수분해한 꼴이 아니어야 한다 */
    ms.forEach(function (x) {
      var s = sig(x.value);
      if (SAME_OK[x.id]) ok(s === a && !factored(x.value) && /\(/.test(x.value), where + '덜 묶은 보기: ' + x.value);
      else { ok(!!s && distinct.indexOf(s) < 0, where + '값이 겹치는 보기: ' + x.value + ' (' + x.id + ')'); distinct.push(s); }
    });
    ok(steps.length >= 2 && steps.every(function (s) { return s.tex.split(' = ').every(function (part) { return sig(part) === v; }); }) && steps[steps.length - 1].tex === p.answer, where + '풀이의 줄이 문제와 값이 다름: ' + steps.map(function (s) { return s.tex; }).join(' / '));
    return f || { pre: '', parts: [] };
  };

  group('B20 — 검사 도구 자체 검사');
  ok(sig('2(x + 3)(x - 3)') === sig('2x^{2} - 18') && sig('(2x - 5)^{2}') === sig('4x^{2} - 20x + 25') && sig('2xy(x - 5y + 1)') === sig('2x^{2}y - 10xy^{2} + 2xy'), '식 읽기');
  ok(!!factored('2(x + 3)(x - 3)') && !!factored('(2x - 5)^{2}') && !!factored('3xy(4x - 7)') && !!factored('(4 + x)(4 - x)') && !factored('2(x^{2} - 9)') && !factored('(2x + 6)(x - 3)') && !factored('2(20x + 8)') && !factored('x(x^{2} + 3x)') && !factored('x^{2} - 9') && !factored('(x + 3)(x + 3)'), '끝까지 인수분해한 꼴');
  done('도구');

  var nTerms = function (t) { return termsOf(t).length; };
  group('B20 — 공통인수로 묶기 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B20.common', function (p, pr, level, where) {
    var f = choiceChecks('B20.common', p, pr, where, bag);
    ok(f.parts.length === 1 && f.pre !== '' && nTerms(f.parts[0]) === nTerms(pr.tex) && nTerms(pr.tex) === (level === 2 ? 3 : 2), where + '답의 꼴: ' + p.answer);
    ok(level === 0 ? /^\d+$/.test(f.pre) : /[a-z]/.test(f.pre), where + '단계에 맞는 공통인수: ' + f.pre);
    kinds[level + (/^\d/.test(f.pre) ? 'n' : '') + (/[a-z]/.test(f.pre) ? 'l' : '')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0n 1l 1nl 2l 2nl', '공통인수의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-kept exp-kept first-left one-dropped one-left partial sign', '실수의 종류');
  done('공통인수');

  group('B20 — 완전제곱식으로 인수분해 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B20.square', function (p, pr, level, where) {
    var f = choiceChecks('B20.square', p, pr, where, bag);
    ok(f.parts.length === 2 && f.parts[0] === f.parts[1] && /\^\{2\}$/.test(p.answer) && nTerms(pr.tex) === 3, where + '답의 꼴: ' + p.answer);
    ok(level === 2 ? /^\d+$/.test(f.pre) : f.pre === '', where + '공통인수: ' + p.answer);
    ok(level === 0 ? /^[a-z] [+-] \d+$/.test(f.parts[0]) : level === 1 ? /^\d*[a-z] [+-] \d+[a-z]?$/.test(f.parts[0]) && /^\d+[a-z] |\d[a-z]$/.test(f.parts[0]) : true, where + '단계에 맞는 식: ' + p.answer);
    kinds[level + (/ - /.test(f.parts[0]) ? '-' : '+')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0+ 0- 1+ 1- 2+ 2-', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-not-rooted conj factor-lost middle-used not-finished not-rooted sign', '실수의 종류');
  done('완전제곱식');

  group('B20 — 제곱의 차 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B20.diff', function (p, pr, level, where) {
    var f = choiceChecks('B20.diff', p, pr, where, bag), A, B;
    ok(f.parts.length === 2 && nTerms(pr.tex) === 2 && / - /.test(pr.tex), where + '문제 · 답의 꼴: ' + pr.tex + ' → ' + p.answer); if (f.parts.length !== 2) return;
    A = termsOf(f.parts[0]); B = termsOf(f.parts[1]);
    ok(A[0] === B[0] && B[1] === '-' + A[1], where + '합과 차의 곱: ' + p.answer);
    var k = f.pre ? 'pre' : /^\d+$/.test(A[0]) ? 'rev' : 'std'; kinds[level + k] = 1;
    ok(level === 0 ? k === 'std' && /^[a-z]$/.test(A[0]) : level === 1 ? k === 'std' && (/^\d+[a-z]$/.test(A[0]) || /[a-z]$/.test(A[1])) : k !== 'std', where + '단계에 맞는 식: ' + pr.tex);
  });
  eq(Object.keys(kinds).sort().join(' '), '0std 1std 2pre 2rev', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-not-rooted factor-lost halved not-finished not-rooted plus-square reversed square', '실수의 종류');
  done('제곱의 차');

  group('B20 — x² + bx + c 의 인수분해 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B20.xbc', function (p, pr, level, where) {
    var f = choiceChecks('B20.xbc', p, pr, where, bag), m = /^(\d*)x\^\{2\} ([+-]) (\d*)x(y?) ([+-]) (\d+)(y\^\{2\})?$/.exec(pr.tex), c, bb, cc, nums;
    ok(!!m && f.parts.length === 2 && f.parts.every(function (x) { return /^x [+-] \d*y?$/.test(x); }), where + '문제 · 답의 꼴: ' + pr.tex + ' → ' + p.answer); if (!m || f.parts.length !== 2) return;
    c = Number(m[1] || 1); bb = Number(m[3] || 1) * (m[2] === '-' ? -1 : 1) / c; cc = Number(m[6]) * (m[5] === '-' ? -1 : 1) / c;
    /* 괄호 안의 두 수: 합은 x 의 계수, 곱은 상수항 */
    nums = f.parts.map(function (x) { var t = termsOf(x)[1]; return Number(/^-?\d+/.exec(t) ? /^-?\d+/.exec(t)[0] : (t.charAt(0) === '-' ? -1 : 1)); });
    ok(nums[0] + nums[1] === bb && nums[0] * nums[1] === cc && String(c === 1 ? '' : c) === f.pre, where + '합과 곱: ' + pr.tex + ' → ' + p.answer);
    var k = m[4] ? 'y' : c > 1 ? 'pre' : nums[0] > 0 && nums[1] > 0 ? 'pos' : 'neg'; kinds[level + k] = 1;
    ok(level === 0 ? k === 'pos' : level === 1 ? k === 'neg' : k === 'y' || k === 'pre', where + '단계에 맞는 식: ' + pr.tex);
  });
  eq(Object.keys(kinds).sort().join(' '), '0pos 1neg 2pre 2y', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'factor-lost letter-lost not-finished one-sign product-only signs-flipped sum-only', '실수의 종류');
  done('x² + bx + c');

  group('B20 — ax² + bx + c 의 인수분해 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B20.axbc', function (p, pr, level, where) {
    var f = choiceChecks('B20.axbc', p, pr, where, bag), m = /^(\d+)x\^\{2\} ([+-]) (\d*)x ([+-]) (\d+)$/.exec(pr.tex), lead;
    ok(!!m && f.pre === '' && f.parts.length === 2 && f.parts.every(function (x) { return /^\d*x [+-] \d+$/.test(x); }), where + '문제 · 답의 꼴: ' + pr.tex + ' → ' + p.answer); if (!m || f.parts.length !== 2) return;
    lead = f.parts.map(function (x) { return Number(/^\d+/.exec(x) ? /^\d+/.exec(x)[0] : 1); });
    eq(lead[0] * lead[1], Number(m[1]), where + 'x² 의 계수');
    var neg = m[2] === '-' || m[4] === '-'; kinds[level + (lead[0] > 1 && lead[1] > 1 ? 'split' : neg ? 'neg' : 'pos')] = 1;
    ok(level === 0 ? !neg && [2, 3, 5].indexOf(Number(m[1])) >= 0 : level === 1 ? neg && lead[1] === 1 : lead[0] > 1 && lead[1] > 1, where + '단계에 맞는 식: ' + pr.tex);
  });
  eq(Object.keys(kinds).sort().join(' '), '0pos 1neg 2split', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'inner-swapped lead-lost lead-unsplit one-sign signs-flipped swapped-sign', '실수의 종류');
  done('ax² + bx + c');

  group('B20 — 인수분해의 활용 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  var rootOf = function (n) { var k = Math.round(Math.sqrt(n)); return k * k === n ? k : NaN; };
  each('B20.value', function (p, pr, level, where) {
    var def = MH.types['B20.value'], kind = MH.kinds.int, ans = p.answer, t = pr.tex, m, want, k, steps = def.steps(p.v), A = sig(String(ans)), L, C, filled;
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; ok(Number.isInteger(x.value) && x.value >= 1 && x.value !== ans, where + '실수 값: ' + x.id + ' ' + x.value); });
    ok(MH.mistakesFor(p).length >= 2, where + '실수가 둘은 있어야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    detailed('B20.value', p, where);
    ok(Number.isInteger(ans) && ans >= 1 && steps.length === 3 && steps[2].tex === String(ans), where + '답은 자연수, 풀이는 세 줄');
    var identities = function () { steps.slice(0, 2).forEach(function (s, i) { var l = s.tex.split(' = ').map(sig); ok(l.length === 2 && !!l[0] && l[0] === l[1], where + '풀이 ' + (i + 1) + '째 줄은 항등식: ' + s.tex); }); };
    var numeric = function () { steps.forEach(function (s, i) { ok(s.tex.split(' = ').every(function (x) { return sig(x) === A; }), where + '풀이 ' + (i + 1) + '째 줄: ' + s.tex); }); };
    if ((m = /^(\d*)x\^\{2\} ([+-]) (\d+)x \+ \\square$/.exec(t))) {
      k = 'const'; L = rootOf(Number(m[1] || 1)); C = Number(m[3]) / (2 * L); want = C * C; filled = t.replace('\\square', String(ans));
      ok(pr.text === '위 식이 완전제곱식이 되도록 $\\square$ 안에 알맞은 수를 구하세요.' && sig(filled) === sig('(' + L + 'x ' + m[2] + ' ' + C + ')^{2}'), where + '빈칸을 채우면 완전제곱식: ' + filled); identities();
    } else if ((m = /^(\d*)x\^\{2\} \+ \\square x \+ (\d+)$/.exec(t))) {
      k = 'mid'; L = rootOf(Number(m[1] || 1)); C = rootOf(Number(m[2])); want = 2 * L * C; filled = t.replace('\\square ', String(ans));
      ok(pr.text === '위 식이 완전제곱식이 되도록 $\\square$ 안에 알맞은 양수를 구하세요.' && sig(filled) === sig('(' + L + 'x + ' + C + ')^{2}'), where + '빈칸을 채우면 완전제곱식: ' + filled); identities();
    } else if ((m = /^(\d+)\^\{2\} - (\d+)\^\{2\}$/.exec(t))) {
      k = 'diff'; want = Number(m[1]) * Number(m[1]) - Number(m[2]) * Number(m[2]); numeric();
      ok((Number(m[1]) + Number(m[2])) % 10 === 0 && /= \(\d+ \+ \d+\)\(\d+ - \d+\)$/.test(steps[0].tex), where + '합이 계산하기 쉬운 수: ' + t);
    } else if ((m = /^(\d+)\^\{2\} ([+-]) 2 \\times (\d+) \\times (\d+) \+ (\d+)\^\{2\}$/.exec(t))) {
      k = 'sq3'; ok(m[1] === m[3] && m[4] === m[5], where + '완전제곱식의 꼴: ' + t); L = Number(m[1]) + (m[2] === '+' ? 1 : -1) * Number(m[4]); want = L * L; numeric();
      ok(L % 10 === 0, where + '괄호 안이 계산하기 쉬운 수: ' + t);
    } else { ok(false, where + '문제의 식: ' + t); return; }
    kinds[level + k] = 1;
    eq(ans, want, where + '답: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0const 1mid 2diff 2sq3', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added base-only diff-squared doubled half-only middle-squared no-double no-middle not-squared root-only roots-added sign-wrong squared-kept sum-only sum-squared', '실수의 종류');
  done('활용');
})();
