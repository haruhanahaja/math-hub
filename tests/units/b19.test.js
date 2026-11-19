/* B19 다항식의 곱셈 — 단원 전용 검사.
   화면에 보이는 식(문제 · 보기 · 풀이의 줄)을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어, 문자에 수 세 벌을 넣은 값으로 견준다.
   문제의 값 = 답의 값, 틀린 보기의 값 ≠ 답의 값, 풀이의 모든 줄의 값 = 문제의 값인지 본다.
   답이 수인 유형은 문제의 글자에서 수를 읽어 답을 따로 계산한다. 단원 파일의 계산과 무관하다. */
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
  var choiceChecks = function (id, p, pr, where, bag) {
    var opts = MH.optionsOf(p), v = sig(pr.tex), a = sig(p.answer), steps = MH.types[id].steps(p.v), sigs;
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    ok(pr.text === '다음 식을 전개하세요.' && !!v && v === a && tidy(p.answer), where + '문제의 값 = 답의 값, 답은 정리한 꼴: ' + pr.tex + ' → ' + p.answer);
    sigs = opts.map(sig);
    ok(sigs.every(function (s, i) { return !!s && sigs.indexOf(s) === i; }), where + '값이 같은 보기가 있음: ' + opts.join(' | '));
    ok(opts.every(function (o) { return o === p.answer || tidy(o); }), where + '틀린 보기도 정리한 꼴: ' + opts.join(' | '));
    ok(steps.length >= 2 && steps.every(function (s) { return s.tex.split(' = ').every(function (part) { return sig(part) === v; }); }), where + '풀이의 줄이 문제와 값이 다름: ' + steps.map(function (s) { return s.tex; }).join(' / '));
    return opts;
  };

  group('B19 — 검사 도구 자체 검사');
  ok(sig('(x + 2)(x + 3)') === sig('x^{2} + 5x + 6') && sig('(2x - 3y)^{2}') === sig('(2x)^{2} - 2 \\times 2x \\times 3y + (3y)^{2}') && sig('(x + 2)(x + 3)') !== sig('x^{2} + 6x + 5') && sig('(-x + 3)^{2}') === sig('x^{2} - 6x + 9'), '식 읽기');
  ok(tidy('6ax + 15a - 10x - 25') && tidy('64 - a^{2}') && tidy('-x^{2} + 16x + 64') && !tidy('x^{2} + 3x + 2x + 6') && !tidy('(x + 1)^{2}') && !tidy('1x + 2') && !tidy('x^{2} + 0x + 3'), '정리한 꼴');
  done('도구');

  group('B19 — 분배법칙으로 전개하기 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B19.expand', function (p, pr, level, where) {
    choiceChecks('B19.expand', p, pr, where, bag);
    var t = pr.tex, m = /^\(([^()]+)\)\(([^()]+)\)$/.exec(t), n1 = m ? termsOf(m[1]).length : 0, n2 = m ? termsOf(m[2]).length : 0, na = termsOf(p.answer).length;
    ok(!!m && n1 === 2 && n2 === (level === 2 ? 3 : 2), where + '문제의 꼴: ' + t);
    ok(level === 0 ? na === 4 : level === 1 ? na === 3 && /x\^\{2\}/.test(p.answer) && /xy/.test(p.answer) && /y\^\{2\}/.test(p.answer) : na === 5, where + '답의 항 수: ' + p.answer);
    eq(MH.types['B19.expand'].steps(p.v)[0].tex.replace(/ - /g, ' + ').split(' + ').length, n1 * n2, where + '첫 줄은 곱셈을 모두 늘어놓은 것');
  });
  eq(Object.keys(bag).sort().join(' '), 'const-added cross-sign first-last last-sign no-square one-missing second-undistributed', '실수의 종류');
  done('전개');

  group('B19 — 완전제곱식 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B19.square', function (p, pr, level, where) {
    choiceChecks('B19.square', p, pr, where, bag);
    var t = pr.tex, m = /^\((-?)(\d*)([a-z]) ([+-]) (\d*)([a-z]?)\)\^\{2\}$/.exec(t);
    ok(!!m && termsOf(p.answer).length === 3, where + '문제 · 답의 꼴: ' + t + ' → ' + p.answer); if (!m) return;
    var k = m[1] ? 'neg' : m[6] ? 'two' : m[2] ? 'coef' : 'plain'; kinds[level + k + m[4]] = 1;
    ok(level === 0 ? k === 'plain' : level === 1 ? k === 'coef' : k === 'neg' || k === 'two', where + '단계에 맞는 식: ' + t);
    /* 답을 따로 계산한다: (p·u ± q·w)² = p²u² ± 2pq·uw + q²w² */
    var P = Number(m[2] || 1) * (m[1] ? -1 : 1), Q = Number(m[5] || 1) * (m[4] === '-' ? -1 : 1), u = m[3], w = m[6];
    ok(sig(p.answer) === sig(P * P + u + '^{2} + (' + 2 * P * Q + ')' + u + (w || '') + ' + ' + Q * Q + (w ? w + '^{2}' : '')), where + '답: ' + t + ' → ' + p.answer);
  });
  eq(Object.keys(kinds).sort().join(' '), '0plain+ 0plain- 1coef+ 1coef- 2neg+ 2neg- 2two+ 2two-', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-not-squared last-doubled last-negative middle-half middle-sign neg-kept no-middle', '실수의 종류');
  done('완전제곱식');

  group('B19 — 합과 차의 곱 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B19.conj', function (p, pr, level, where) {
    choiceChecks('B19.conj', p, pr, where, bag);
    var t = pr.tex, m = /^\(([^()]+)\)\(([^()]+)\)$/.exec(t), A, B, same, flip;
    ok(!!m && termsOf(p.answer).length === 2 && / - /.test(p.answer) && p.answer.charAt(0) !== '-', where + '문제 · 답의 꼴: ' + t + ' → ' + p.answer); if (!m) return;
    A = termsOf(m[1]); B = termsOf(m[2]);
    /* 두 괄호의 항은 한 쌍은 똑같고, 한 쌍은 부호만 반대여야 한다 */
    same = A.filter(function (x) { return B.indexOf(x) >= 0; }); flip = A.filter(function (x) { return B.indexOf(x.charAt(0) === '-' ? x.slice(1) : '-' + x) >= 0; });
    ok(A.length === 2 && B.length === 2 && same.length === 1 && flip.length === 1, where + '합과 차의 꼴: ' + t);
    ok(sig(p.answer) === sig('(' + same[0] + ')^{2} - (' + flip[0] + ')^{2}'), where + '답: ' + t + ' → ' + p.answer);
    /* 기본 꼴: 두 괄호의 첫 항이 문자가 든 같은 항이고 음수가 아니다. 3단계는 차례나 부호가 바뀐 꼴이다 */
    var std = A[0] === B[0] && /^\d*[a-z]$/.test(A[0]);
    kinds[level + (std ? 'std' : /^\d+$/.test(A[0]) && A[0] === B[0] ? 'numfirst' : A[0].charAt(0) === '-' ? 'neg' : 'swap')] = 1;
    ok(level < 2 ? std : !std, where + '단계에 맞는 식: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0std 1std 2neg 2numfirst 2swap', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-not-squared middle-kept not-squared plus reversed square-like', '실수의 종류');
  done('합과 차의 곱');

  group('B19 — (x + a)(x + b) 꼴의 전개 (단계마다 1,000문제)');
  bag = {};
  var lin2 = /^\((\d*)x ([+-]) (\d+)\)\((\d*)x ([+-]) (\d+)\)$/;
  var read2 = function (m) { return { p: Number(m[1] || 1), a: Number(m[3]) * (m[2] === '-' ? -1 : 1), s: Number(m[4] || 1), b: Number(m[6]) * (m[5] === '-' ? -1 : 1) }; };
  each('B19.xab', function (p, pr, level, where) {
    choiceChecks('B19.xab', p, pr, where, bag);
    var m = lin2.exec(pr.tex), c;
    ok(!!m && termsOf(p.answer).length === 3, where + '문제 · 답의 꼴: ' + pr.tex + ' → ' + p.answer); if (!m) return;
    c = read2(m);
    ok(level === 0 ? c.p === 1 && c.s === 1 && c.a > 0 && c.b > 0 : level === 1 ? c.p === 1 && c.s === 1 && (c.a < 0 || c.b < 0) : c.p * c.s > 1, where + '단계에 맞는 식: ' + pr.tex);
    ok(sig(p.answer) === sig(c.p * c.s + 'x^{2} + (' + (c.p * c.b + c.a * c.s) + ')x + (' + c.a * c.b + ')'), where + '답: ' + pr.tex + ' → ' + p.answer);
  });
  eq(Object.keys(bag).sort().join(' '), 'abs-added const-sum cross-sign lead-added middle-one no-middle plain-sum product-sign sum-sign swapped', '실수의 종류');
  done('(x + a)(x + b)');

  var numChecks = function (id, p, where, bag) {
    var def = MH.types[id], kind = MH.kinds[def.answer.kind], S = def.answer.kind === 'signed', ans = S ? p.answer.n : p.answer;
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; var w = S ? x.value.n : x.value; ok(Number.isInteger(w) && w !== ans && (S ? w !== -ans && w !== 0 : w >= 1), where + '실수 값: ' + x.id + ' ' + w); });
    ok(MH.mistakesFor(p).length >= 1, where + '실수가 하나는 있어야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    detailed(id, p, where);
    return ans;
  };

  group('B19 — 계수 · 상수 구하기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B19.coef', function (p, pr, level, where) {
    var ans = numChecks('B19.coef', p, where, bag), t = pr.tex, m, c, want, k, steps = MH.types['B19.coef'].steps(p.v), sub = function (x) { return x.replace(/a/g, '(' + ans + ')'); };
    ok(p.answer.p === 0 && ans !== 0, where + '답은 0 이 아닌 정수');
    if ((m = lin2.exec(t))) {
      c = read2(m); k = /상수항/.test(pr.text) ? 'const' : c.p * c.s === 1 ? 'xc' : 'lin';
      ok(pr.text === (k === 'const' ? '다음 식을 전개했을 때, 상수항을 구하세요.' : '다음 식을 전개했을 때, $x$의 계수를 구하세요.'), where + '문제 글');
      want = k === 'const' ? c.a * c.b : c.p * c.b + c.a * c.s;
      steps.slice(0, -1).forEach(function (s, i) { ok(s.tex.split(' = ').every(function (x) { return sig(x) === (k === 'lin' ? sig('(' + want + ')x') : sig(t)); }), where + '풀이 ' + (i + 1) + '째 줄: ' + s.tex); });
      eq(steps[steps.length - 1].tex, String(want), where + '풀이의 마지막 줄');
    } else if ((m = /^\(x \+ a\)\(x ([+-]) (\d+)\) = (.+)$/.exec(t))) {
      k = 'find'; ok(pr.text === '다음 등식이 성립할 때, 상수 $a$의 값을 구하세요.' && tidy(m[3]), where + '문제 글');
      want = ans; ok(sig(sub(t.split(' = ')[0])) === sig(m[3]), where + '답을 넣으면 등식이 성립해야 함: ' + t);
      steps.forEach(function (s, i) { var l = s.tex.split(' = ').map(function (x) { return sig(sub(x)); }); ok(l.length === 2 && l[0] === l[1], where + '풀이 ' + (i + 1) + '째 줄: ' + s.tex); });
    } else if ((m = /^\(x ([+-]) (\d+)\)\^\{2\} = x\^\{2\} \+ ax \+ (\d+)$/.exec(t))) {
      k = 'sq'; ok(pr.text === '다음 등식이 성립할 때, 상수 $a$의 값을 구하세요.' && Number(m[3]) === Number(m[2]) * Number(m[2]), where + '문제 글');
      want = 2 * Number(m[2]) * (m[1] === '-' ? -1 : 1); ok(sig(t.split(' = ')[0]) === sig(sub(t.split(' = ')[1])), where + '답을 넣으면 등식이 성립해야 함: ' + t);
      steps.forEach(function (s, i) { var l = s.tex.split(' = ').map(function (x) { return sig(sub(x)); }); ok(l.length === 2 && l[0] === l[1], where + '풀이 ' + (i + 1) + '째 줄: ' + s.tex); });
    } else { ok(false, where + '문제의 식: ' + t); return; }
    kinds[level + k] = 1;
    eq(ans, want, where + '답: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0const 0xc 1find 2lin 2sq', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'abs-added added copied no-double outer-only plain-sum product-for-sum squared sum-for-product', '실수의 종류');
  done('계수 · 상수');

  group('B19 — 곱셈 공식의 활용 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B19.apply', function (p, pr, level, where) {
    var ans = numChecks('B19.apply', p, where, bag), t = pr.tex, m, want, k, steps = MH.types['B19.apply'].steps(p.v), A = sig(String(ans)), s, q, target, rhs;
    var numeric = function (from) { steps.slice(from).forEach(function (st, i) { ok(st.tex.split(' = ').every(function (x) { return sig(x) === A; }), where + '풀이 ' + (from + i + 1) + '째 줄: ' + st.tex); }); };
    ok(Number.isInteger(ans) && ans >= 1 && steps.length === 3 && steps[2].tex === String(ans), where + '답은 자연수, 풀이는 세 줄');
    if ((m = /^(\d+)\^\{2\}$/.exec(t))) { k = 'sq'; want = Number(m[1]) * Number(m[1]); numeric(0); ok(pr.text === '곱셈 공식을 이용하여 계산하세요.' && /^\d+\^\{2\} = \(\d+0 [+-] \d\)\^\{2\} = /.test(steps[0].tex), where + '쉬운 수로 쪼개기: ' + steps[0].tex); }
    else if ((m = /^(\d+) \\times (\d+)$/.exec(t))) { k = 'mul'; want = Number(m[1]) * Number(m[2]); numeric(0); ok(/= \(\d+0 \+ \d\)\(\d+0 [+-] \d\) = /.test(steps[0].tex), where + '쉬운 수로 쪼개기: ' + steps[0].tex); }
    else if ((m = /^x ([+-]) y = (-?\d+),\\quad xy = (-?\d+)$/.exec(t))) {
      k = 'sum'; s = Number(m[2]); q = Number(m[3]); target = /\$(.+)\$의 값을 구하세요\.$/.exec(pr.text)[1];
      ok(target === 'x^{2} + y^{2}' || target === '(x ' + (m[1] === '+' ? '-' : '+') + ' y)^{2}', where + '구하는 식: ' + pr.text);
      want = target === 'x^{2} + y^{2}' ? s * s - (m[1] === '+' ? 2 : -2) * q : s * s - (m[1] === '+' ? 4 : -4) * q;
      /* 첫 줄은 항등식이고, 그 오른쪽에 주어진 값을 넣은 것이 답이다 */
      rhs = steps[0].tex.split(' = ');
      ok(rhs.length === 2 && rhs[0] === target && sig(rhs[0]) === sig(rhs[1]), where + '풀이 첫 줄은 항등식: ' + steps[0].tex);
      ok(sig(rhs[1].replace('(x ' + m[1] + ' y)', '(' + s + ')').replace('xy', ' \\times (' + q + ')')) === A, where + '항등식에 값을 넣으면 답: ' + steps[0].tex);
      ok(s * s - (m[1] === '+' ? 4 : -4) * q > 0, where + '조건에 맞는 실수 x, y 가 있어야 함: ' + t);
      numeric(1);
    } else if ((m = /^x ([+-]) \\dfrac\{1\}\{x\} = (\d+)$/.exec(t))) {
      k = 'recip'; want = Number(m[2]) * Number(m[2]) - (m[1] === '+' ? 2 : -2);
      ok(pr.text === '위 조건이 성립할 때, $x^{2} + \\dfrac{1}{x^{2}}$의 값을 구하세요.', where + '문제 글');
      rhs = steps[0].tex.split(' = '); ok(sig(rhs[0]) === sig('(' + t.split(' = ')[0] + ')^{2}') && sig(rhs[1]) === sig(m[2] + '^{2}'), where + '풀이 첫 줄: ' + steps[0].tex);
      rhs = steps[1].tex.split(' = '); ok(rhs[0] === 'x^{2} + \\dfrac{1}{x^{2}}' && sig(rhs[1]) === A, where + '풀이 둘째 줄: ' + steps[1].tex);
    } else if ((m = /^\((\d*)\\sqrt\{(\d+)\} \+ (\d*)(?:\\sqrt\{(\d+)\})?\)\((\d*)\\sqrt\{(\d+)\} - (\d*)(?:\\sqrt\{(\d+)\})?\)$/.exec(t))) {
      k = 'root'; ok(m[1] === m[5] && m[2] === m[6] && m[3] === m[7] && m[4] === m[8] && (m[4] !== undefined || m[3] !== ''), where + '합과 차의 꼴: ' + t);
      want = Number(m[1] || 1) * Number(m[1] || 1) * Number(m[2]) - Number(m[3] || 1) * Number(m[3] || 1) * Number(m[4] || 1);
      numeric(1);
    } else { ok(false, where + '문제의 식: ' + t); return; }
    kinds[level + k] = 1;
    eq(ans, want, where + '답: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0mul 0sq 1sum 2recip 2root', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-not-squared const-sum doubled just-square last-negative middle-half no-double no-middle not-squared over-squared plus root-kept sign-flipped square-like swapped two-for-four', '실수의 종류');
  done('활용');
})();
