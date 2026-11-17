/* B12 다항식의 계산 — 단원 전용 검사.
   화면에 보이는 식(문제 · 보기 · 풀이)을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어, 문자에 수를 넣은 값으로 견준다.
   틀린 보기는 '그 실수를 저지른 식'을 문제의 글자에서 따로 만들어 값이 같은지 본다. 단원 파일의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, sig = ALG.sig, noJosa = ALG.noJosa;
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
  /** 띄어 쓴 다항식을 항으로 나눈다: '3x - 5y + 1' → ['3x', '-5y', '1'] */
  var termsOf = function (t) { return t.replace(/ - /g, ' + -').split(' + '); };
  var P = function (s) { return '(' + s + ')'; };
  /** 붙여 쓴 보기를 항으로: '3x^{2}-5x+4' → ['3x^{2}', '-5x', '+4'] */
  var optTerms = function (t) { return t.match(/[+-]?[^+-]+/g) || []; };
  var letterPart = function (term) { return term.replace(/^[+-]?\d*/, ''); };
  var degree = function (lp) { var d = 0, re = /[a-z](?:\^\{(\d+)\})?/g, m; while ((m = re.exec(lp))) d += Number(m[1] || 1); return d; };
  /** 간단히 한 다항식인가: 괄호 · 곱셈 기호가 없고, 같은 종류의 항이 한 번씩만 나오고, 차수가 높은 항부터 쓰고, 계수 1 과 지수 1 을 쓰지 않는다 */
  var simple = function (t) {
    if (/[()\\ ]/.test(t) || /\^\{1\}/.test(t)) return false;
    var ts = optTerms(t), lps = ts.map(letterPart), degs = lps.map(degree);
    return ts.length >= 1 && lps.every(function (x, i) { return lps.indexOf(x) === i; }) && degs.every(function (d, i) { return i === 0 || d <= degs[i - 1]; })
      && ts.every(function (x) { return /^[+-]?(\d+|\d*(?:[a-z](?:\^\{\d+\})?)+)$/.test(x) && !/^[+-]?[01][a-z]/.test(x) && !/^[+-]?0$/.test(x); }) && ts.slice(1).every(function (x) { return /^[+-]/.test(x); });
  };

  group('B12 — 검사 도구 자체 검사');
  ok(sig('(3x + 2y) - (x - 5y)') === sig('2x+7y') && sig('2x(3x + 4)') === sig('6x^{2}+8x') && sig('(6x^{2} + 4x) \\div 2x') === sig('3x+2')
    && sig('(4x^{2} - 6x) \\div \\dfrac{2}{3}x') === sig('6x-9') && sig('(x - 2y) \\times (-2x)') === sig('-2x^{2}+4xy') && sig('(9a^{2}b - 6ab^{2}) \\div (-3ab)') === sig('-3a+2b'), '같은 식');
  ok(sig('(3x + 2y) - (x - 5y)') !== sig('2x-3y') && sig('2x(3x + 4)') !== sig('6x^{2}+4') && sig('(6x^{2} + 2x) \\div 2x') !== sig('3x'), '다른 식');
  ok(simple('3x^{2}-5x+4') && simple('-x-8y') && simple('a^{2}+5ab') && simple('6xy-2y^{2}-5x') && !simple('3x+2x') && !simple('4+3x') && !simple('1x+2') && !simple('2(x+1)') && !simple('x^{1}+2'), '간단히 한 식 판별');
  eq(termsOf('3x - 5y + 1').join('|'), '3x|-5y|1', '항으로 나누기');
  done('도구');

  group('B12 — 답이 식인 유형: 정답만 원래 식과 같은가 (유형 · 단계마다 1,000문제)');
  var SHAPE = {
    'B12.add': [/^\([^()]*\) \+ \([^()]*\)$/, /^\([^()]*\) - \([^()]*\)$/, /^\d?\([^()]*\) [+-] \d\([^()]*\)$/],
    'B12.quad': [/^\([^()]*\^\{2\}[^()]*\) \+ \([^()]*\)$/, /^\([^()]*\^\{2\}[^()]*\) - \([^()]*\)$/, /^\d?\([^()]*\) [+-] \d\([^()]*\)$/],
    'B12.mono': [/^-?\d?[abxy]\([^()]*\)$/, /^-?\d?[abxy]\([^()]*\)$/, /^(-?\d?[abxy^{}2]+\([^()]*\)|\([^()]*\) \\times \(?-?\d?[abxy]+\)?)$/],
    'B12.div': [/^\([^()]*\) \\div \(?-?\d[abxy]\)?$/, /^\([^()]*\) \\div \(?-?\d[abxy]+\)?$/, /^\([^()]*\) \\div (\\left\(-)?\\dfrac\{\d\}\{\d\}[abxy]+(\\right\))?$/],
    'B12.mixed': [/^-?\d?[abxy]\([^()]*\) [+-] \d?[abxy]\([^()]*\)$/, /^\([^()]*\) \\div \d[abxy] [+-] \d?\([^()]*\)$/, /\\div/]
  };
  var IDS = {
    'B12.add': 'abs-added coef-off dist-first first-sign sign-first sub-as-add term-sign',
    'B12.quad': 'abs-added dist-first exp-added first-sign sign-first sub-as-add term-sign',
    'B12.mono': 'coef-added dist-first exp-not-added first-sign sign-first term-sign',
    'B12.div': 'denominator-dropped dist-first div-as-mul first-sign sign-first term-sign term-vanished',
    'B12.mixed': 'abs-added dist-first div-as-mul exp-not-added first-sign sign-first sub-as-add term-sign'
  };
  Object.keys(SHAPE).forEach(function (id) {
    var def = MH.types[id], bag = {}, rules = 0;
    each(id, function (p, pr, level, where) {
      var opts = MH.optionsOf(p), a = sig(p.answer), st = def.steps(p.v), m, w, A, B, k;
      MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
      ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i; }) && MH.mistakesFor(p).length === 3, where + '보기 4개가 서로 다르고 틀린 보기마다 설명이 있어야 함: ' + opts.join(' | '));
      ok(SHAPE[id][level].test(pr.tex), where + '단계에 맞지 않는 식: ' + pr.tex);
      ok(a !== null && sig(pr.tex) === a, where + pr.tex + ' → ' + p.answer);
      ok(opts.every(function (o) { return o === p.answer || (sig(o) !== null && sig(o) !== a); }), where + '값이 같은 틀린 보기: ' + opts.join(' | '));
      ok(opts.every(simple), where + '간단히 하지 않은 보기: ' + opts.join(' | '));
      ok(opts.every(function (o) { return optTerms(o).length <= 4; }), where + '보기가 너무 김: ' + opts.join(' | '));
      /* 풀이: 모든 줄이 원래 식과 같은 값이고, 마지막 줄은 정답이다 */
      st.forEach(function (s, i) { ok(sig(s.tex) === a, where + '풀이 ' + (i + 1) + '째 줄이 답과 다름: ' + s.tex); });
      ok(st.length >= 2 && st[st.length - 1].tex === p.answer, where + '풀이의 마지막 줄');
      /* 규칙 검사: 틀린 보기는 그 실수를 저지른 식과 값이 같다 */
      if ((m = /^(\d?)\(([^()]*)\) ([+-]) (\d?)\(([^()]*)\)$/.exec(pr.tex))) {
        A = (m[1] || '1') + P(m[2]); B = termsOf(m[5]); k = m[4] || '1'; rules++;
        if ((w = wrongOf(p, 'sub-as-add'))) ok(m[3] === '-' && sig(w) === sig(A + ' + ' + k + P(m[5])), where + '뺄셈을 덧셈으로 한 보기: ' + w);
        if ((w = wrongOf(p, 'sign-first'))) ok(m[3] === '-' && sig(w) === sig(A + ' - ' + k + P(B[0]) + B.slice(1).map(function (t) { return ' + ' + k + P(t); }).join('')), where + '첫 항만 부호를 바꾼 보기: ' + w);
        if ((w = wrongOf(p, 'dist-first'))) ok(sig(w) === sig(A + ' ' + m[3] + ' ' + k + P(B[0]) + B.slice(1).map(function (t) { return ' + ' + P(t); }).join('')) || m[1] > 1, where + '첫 항에만 곱한 보기: ' + w);
      }
      if ((m = /^(-?\d?[abxy])\(([^()]*)\)$/.exec(pr.tex))) {
        B = termsOf(m[2]); rules++;
        eq(optTerms(p.answer).length, B.length, where + '곱한 결과의 항의 수');
        if ((w = wrongOf(p, 'dist-first'))) ok(sig(w) === sig(P(m[1]) + ' \\times ' + P(B[0]) + B.slice(1).map(function (t) { return ' + ' + P(t); }).join('')), where + '첫 항에만 곱한 보기: ' + w);
        if ((w = wrongOf(p, 'sign-first'))) ok(m[1][0] === '-' && sig(w) === sig(P(m[1]) + ' \\times ' + P(B[0]) + ' + ' + P(m[1].slice(1) || '1') + ' \\times ' + P(B.slice(1).join(' + '))), where + '첫 항만 부호를 바꾼 보기: ' + w);
      }
      if ((m = /^\(([^()]*)\) \\div \(?(-?\d+)([abxy]+)\)?$/.exec(pr.tex))) {
        B = termsOf(m[1]); rules++;
        eq(optTerms(p.answer).length, B.length, where + '나눈 결과의 항의 수');
        if ((w = wrongOf(p, 'div-as-mul'))) ok(sig(w) === sig(P(m[1]) + ' \\div ' + P(m[2]) + ' \\times ' + m[3]), where + '문자를 곱한 보기: ' + w);
        if ((w = wrongOf(p, 'term-vanished'))) ok(optTerms(p.answer).filter(function (t) { return !/[a-z]/.test(t); }).length === 1 && w === optTerms(p.answer).filter(function (t) { return /[a-z]/.test(t); }).join(''), where + '상수항을 빠뜨린 보기: ' + w);
        if ((w = wrongOf(p, 'dist-first'))) ok(sig(w) === sig(P(B[0]) + ' \\div ' + P(m[2] + m[3]) + B.slice(1).map(function (t) { return ' + ' + P(t); }).join('')), where + '첫 항만 나눈 보기: ' + w);
      }
      if ((m = /^\(([^()]*)\) \\div (\\left\(-)?\\dfrac\{(\d)\}\{(\d)\}([abxy]+)/.exec(pr.tex))) {
        rules++;
        ok(wrongOf(p, 'denominator-dropped') === null || sig(wrongOf(p, 'denominator-dropped')) === sig(P(m[1]) + ' \\div ' + P((m[2] ? '-' : '') + m[3] + m[5])), where + '분모를 빠뜨린 보기');
      }
      if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
      detailed(id, p, where);
    });
    eq(Object.keys(bag).sort().join(' '), IDS[id], id + ': 틀린 보기의 종류');
    ok(id === 'B12.mixed' || rules >= 1500, id + ': 규칙 검사를 한 문제 ' + rules + '개');
    done(def.title);
  });

  group('B12 — 계수 구하기: 식에 수를 넣어 계수를 따로 구한다 (단계마다 1,000문제)');
  var Qn = function (n) { return ALG.Q(BigInt(n), 1n); }, num = function (q) { return Number(q.n) / Number(q.d); };
  var bagC = {}, asks = {};
  each('B12.coef', function (p, pr, level, where) {
    var letters = pr.tex.replace(/\\[a-z]+/g, '').match(/[a-z]/g).filter(function (c, i, a) { return a.indexOf(c) === i; }).sort();
    var f = function (u, v) { var env = {}; env[letters[0]] = Qn(u); if (letters[1]) env[letters[1]] = Qn(v); return num(ALG.calc(pr.tex, env)); };
    var coef = {}, want = [], re = /\$([^$]+)\$의 계수|상수항/g, m, st = MH.types['B12.coef'].steps(p.v), last = st[st.length - 1].tex.split(' = ');
    /* 문자가 하나이면 이차식 ax² + bx + c, 둘이면 일차식 ax + by + c */
    coef[''] = f(0, 0);
    if (letters.length === 1) { coef[letters[0] + '^{2}'] = (f(1, 0) + f(-1, 0)) / 2 - f(0, 0); coef[letters[0]] = (f(1, 0) - f(-1, 0)) / 2; ok(f(2, 0) === 4 * coef[letters[0] + '^{2}'] + 2 * coef[letters[0]] + coef[''], where + '이차식이 아님: ' + pr.tex); }
    else { coef[letters[0]] = f(1, 0) - f(0, 0); coef[letters[1]] = f(0, 1) - f(0, 0); ok(f(2, 3) === 2 * coef[letters[0]] + 3 * coef[letters[1]] + coef[''], where + '일차식이 아님: ' + pr.tex); }
    while ((m = re.exec(pr.text))) want.push(m[1] || '');
    asks[level + ':' + want.length] = 1;
    ok(want.length === (/의 합을/.test(pr.text) ? 2 : 1) && want.every(function (k) { return coef[k] !== undefined && coef[k] !== 0; }), where + '묻는 것: ' + pr.text);
    eq(p.answer.n, want.reduce(function (s, k) { return s + coef[k]; }, 0), where + pr.tex + ' ' + pr.text);
    ok(p.answer.p === 0 && p.answer.n !== 0, where + '답은 0 이 아닌 정수');
    ok(/(를|을|합을) 구하세요\.$/.test(pr.text) && !/계수을|상수항를/.test(pr.text), where + '문제 글: ' + pr.text);
    st.slice(0, -1).forEach(function (s, i) { ok(sig(s.tex) === sig(pr.tex), where + '풀이 ' + (i + 1) + '째 줄이 원래 식과 다름: ' + s.tex); });
    ok(Number(last[last.length - 1]) === p.answer.n && (last.length === 1 || sig(last[0]) === sig(last[1])), where + '풀이의 마지막 줄: ' + st[st.length - 1].tex);
    MH.mistakesFor(p).forEach(function (x) { bagC[x.id] = 1; ok(x.value.n !== p.answer.n, where + '실수 ' + x.id + ' 의 값이 정답과 같음'); });
    if (p.seed <= 100) {
      eq(J(p, String(p.answer.n)), 'correct:-', where + '정답 판정');
      eq(MH.judge(p, String(p.answer.n + 1)).verdict, 'wrong', where + '오답 판정');
      MH.mistakesFor(p).forEach(function (x) { eq(MH.judge(p, String(x.value.n)).verdict, 'wrong', where + '실수 값 판정'); });
    }
    detailed('B12.coef', p, where);
  });
  eq(Object.keys(bagC).sort().join(' '), 'abs-added dist-first exp-not-added sign-first sub-as-add', '실수의 종류');
  eq(Object.keys(asks).sort().join(' '), '0:1 1:1 2:1 2:2', '단계마다 묻는 계수의 수');
  done('계수 구하기');

  group('B12 — 구체적인 예');
  var find = function (id, level, test) { for (var seed = 1; seed <= 6000; seed++) { var p = MH.makeProblem(id, level, seed); if (test(MH.types[id].prompt(p.v, p.ctx), p)) return p; } return null; };
  var p1 = find('B12.add', 1, function (pr, p) { return !!wrongOf(p, 'sign-first') && !!wrongOf(p, 'sub-as-add'); });
  ok(!!p1 && sig(wrongOf(p1, 'sign-first')) !== sig(wrongOf(p1, 'sub-as-add')), '뺄셈: 두 가지 부호 실수가 서로 다른 보기');
  var p2 = find('B12.div', 0, function (pr) { return /^\(\d+[abxy]\^\{2\} \+ \d+[abxy]\) \\div \d[abxy]$/.test(pr.tex); });
  ok(!!p2 && /^\d*[abxy]\+\d+$/.test(p2.answer), '(ax² + bx) ÷ cx 는 일차식: ' + (p2 && p2.answer));
  var p3 = find('B12.div', 0, function (pr, p) { return /[+-]1$/.test(p.answer) && !!wrongOf(p, 'term-vanished'); });
  ok(!!p3 && wrongOf(p3, 'term-vanished') === p3.answer.replace(/[+-]1$/, ''), '같은 것끼리 나눈 1 을 빠뜨린 보기');
  var p4 = find('B12.mono', 0, function (pr, p) { return /^2[abxy]\(3[abxy] \+ 4\)$/.test(pr.tex); });
  ok(!p4 || /^6[abxy]\^\{2\}\+8[abxy]$/.test(p4.answer), '2x(3x + 4) = 6x² + 8x');
  var p5 = find('B12.quad', 0, function (pr, p) { return !!wrongOf(p, 'exp-added'); });
  ok(!!p5 && wrongOf(p5, 'exp-added') === p5.answer.replace('^{2}', '^{4}'), '덧셈에서 지수를 더한 보기');
  var p6 = find('B12.coef', 0, function (pr) { return /상수항을/.test(pr.text); }), p7 = find('B12.coef', 2, function (pr) { return /의 계수와 상수항의 합을/.test(pr.text); });
  ok(!!p6 && !!p7, '상수항을 묻는 문제와 계수와 상수항의 합을 묻는 문제가 있다');
  done('예');
})();
