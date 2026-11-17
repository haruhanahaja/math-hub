/* B11 지수법칙과 단항식의 계산 — 단원 전용 검사.
   화면에 보이는 식(문제 · 보기 · 풀이)을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어, 문자에 수 세 벌을 넣은 값으로 견준다.
   단원 파일의 단항식 계산과 무관하다. */
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
  var texts = function (id, p) { return MH.types[id].hints(p.v, p.ctx).concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.mistakesFor(p).map(function (m) { return m.explain; })); };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx), all = texts(id, p);
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    MH.mistakesFor(p).forEach(function (m) { ok(m.explain.length >= 25, where + '실수 설명이 짧음: ' + m.id); });
    if (p.seed <= 200) noJosa(all, where);
    if (p.seed <= 300) all.forEach(function (t) {
      var re = /(\d)\$?(이에요|예요|은 |는 |이 |가 |을 |를 |과 |와 |으로 |로 )/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
    });
    /* 힌트 · 풀이 · 설명 속 수식의 $ 는 짝이 맞아야 한다 */
    all.forEach(function (t) { ok(t.split('$').length % 2 === 1, where + '$ 짝: ' + t); });
  };
  /** 간단히 한 식인가: 곱셈 · 나눗셈 기호와 괄호가 없고, 같은 문자가 두 번 나오지 않고, 수는 맨 앞(분수이면 분자 · 분모의 맨 앞)에만 있다 */
  var simple = function (t) {
    if (/\\times|\\div|[()]/.test(t)) return false;
    var m = /^-?\\dfrac\{([^{}]*(?:\{\d+\}[^{}]*)*)\}\{([^{}]*(?:\{\d+\}[^{}]*)*)\}([a-z^{}\d]*)$/.exec(t), parts = m ? [m[1], m[2], m[3]] : [t.replace(/^-/, '')];
    var lettersAll = t.replace(/\\dfrac/g, '').replace(/\^\{\d+\}/g, '').replace(/[^a-z]/g, '');
    if (lettersAll.split('').some(function (c, i, a) { return a.indexOf(c) !== i; })) return false;
    return parts.every(function (x) { return /^\d*(?:[a-z](?:\^\{\d+\})?)*$/.test(x); }) && !/\^\{[01]\}/.test(t);
  };

  group('B11 — 식 읽기 자체 검사');
  ok(sig('2x^{2}y \\times (-3xy^{3})') === sig('-6x^{3}y^{4}') && sig('12a^{5} \\div 4a^{2}') === sig('3a^{3}') && sig('6a^{3} \\div \\dfrac{2}{3}a') === sig('9a^{2}')
    && sig('\\left(\\dfrac{a^{2}}{b}\\right)^{3}') === sig('\\dfrac{a^{6}}{b^{3}}') && sig('a^{2} \\div a^{5}') === sig('\\dfrac{1}{a^{3}}') && sig('8a^{4} \\div 2a \\times 3a') === sig('12a^{4}'), '같은 식');
  ok(sig('a^{2} \\times a^{3}') !== sig('a^{6}') && sig('(2a)^{3}') !== sig('6a^{3}') && sig('8a^{4} \\div 2a \\times 3a') !== sig('\\dfrac{4}{3}a^{2}'), '다른 식');
  ok(simple('-6x^{3}y^{4}') && simple('\\dfrac{3x^{2}}{2y}') && simple('-\\dfrac{2}{3}ab^{2}') && simple('1') && simple('\\dfrac{1}{a^{3}}') && !simple('a^{2}a') && !simple('3 \\times a') && !simple('a^{1}') && !simple('(a)^{2}'), '간단히 한 식 판별');
  done('도구');

  group('B11 — 지수 구하기: □ 에 답을 넣으면 등식이 성립하는가 (단계마다 1,000문제)');
  var bag = {}, kinds = [{}, {}, {}];
  each('B11.exp', function (p, pr, level, where) {
    var holds = function (x) { var s = pr.tex.replace('\\square', String(x)).split(' = '); return s.length === 2 && sig(s[0]) !== null && sig(s[0]) === sig(s[1]); };
    MH.mistakesFor(p).forEach(function (m) { bag[m.id] = 1; ok(!holds(m.value), where + '실수 ' + m.id + ' 의 값 ' + m.value + ' 도 등식을 만족함'); });
    kinds[level][p.v.q.kind] = 1;
    ok(pr.tex.split('\\square').length === 2 && /□ 안에 알맞은 수/.test(pr.text), where + '문제: ' + pr.tex);
    ok(holds(p.answer) && !holds(p.answer + 1) && (p.answer === 1 || !holds(p.answer - 1)), where + pr.tex + ' → ' + p.answer);
    ok(!/\^\{1\}/.test(pr.tex), where + '지수 1 을 드러내 쓰지 않는다: ' + pr.tex);
    var st = MH.types['B11.exp'].steps(p.v), last = st[st.length - 1].tex.split(' = ');
    ok(last.length === 2 && Number(last[1]) === p.answer && sig(last[0]) === sig(last[1]), where + '풀이의 마지막 줄: ' + st[st.length - 1].tex);
    if (p.seed <= 100) eq(J(p, String(p.answer)), 'correct:-', where + '정답 판정');
    detailed('B11.exp', p, where);
  });
  eq(kinds.map(function (k) { return Object.keys(k).sort().join(' '); }).join(' / '), 'mul pow / combo div / base find prod', '단계마다 나오는 문제 종류');
  eq(Object.keys(bag).sort().join(' '), 'added all-added all-multiplied base-same divided hidden-one multiplied not-applied subtracted', '실수의 종류');
  done('지수 구하기');

  group('B11 — 답이 식인 유형: 정답만 원래 식과 같은가 (유형 · 단계마다 1,000문제)');
  var SHAPE = {
    'B11.law': [function (t) { return !/\\div|\d[a-z]/.test(t); }, function (t) { return /\\div/.test(t); }, function (t) { return /^(\\left)?\(.*\)\^\{\d\}$/.test(t) && !/\\times|\\div/.test(t); }],
    'B11.mul': [function (t) { return /^[^\\]*\\times[^\\]*$/.test(t) && !/\)\^/.test(t); }, function (t) { return !/\\div|\)\^/.test(t); }, function (t) { return !/\\div/.test(t) && /\)\^\{[23]\}/.test(t); }],
    'B11.div': [function (t) { return t.split('\\div').length === 2 && !/\\times|dfrac/.test(t); }, function (t) { return t.split('\\div').length === 2 && !/\\times|dfrac/.test(t); }, function (t) { return t.split('\\div').length === 2 && (/dfrac/.test(t) || /\)\^/.test(t)); }],
    'B11.mixed': [function (t) { return /\\times.*\\div/.test(t); }, function (t) { return /\\div.*\\times/.test(t); }, function (t) { return /\\div.*\\div/.test(t) || /\)\^/.test(t); }]
  };
  var IDS = {
    'B11.law': 'coef-not-powered coef-times div-as-mul doubled exp-divided exp-less exp-multiplied exp-off hidden-one inverted left-letter pow-added pow-sign zero',
    'B11.mul': 'coef-added coef-not-powered coef-times exp-less exp-multiplied exp-off hidden-one pow-added pow-sign sign',
    'B11.div': 'coef-not-powered coef-subtracted div-as-mul exp-divided exp-off inverted no-flip pow-added sign',
    'B11.mixed': 'coef-not-powered div-as-mul exp-multiplied exp-off inverted pow-added right-first sign'
  };
  Object.keys(SHAPE).forEach(function (id) {
    var def = MH.types[id], rules = 0, spare = 0, total = 0;
    bag = {};
    each(id, function (p, pr, level, where) {
      var opts = MH.optionsOf(p), a = sig(p.answer), st = def.steps(p.v), m;
      total++;
      MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; if (/^exp-(off|less)$/.test(x.id)) spare++; });
      ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i; }) && MH.mistakesFor(p).length === 3, where + '보기 4개가 서로 다르고 틀린 보기마다 설명이 있어야 함: ' + opts.join(' | '));
      ok(SHAPE[id][level](pr.tex), where + '단계에 맞지 않는 식: ' + pr.tex);
      ok(a !== null && sig(pr.tex) === a, where + pr.tex + ' → ' + p.answer);
      ok(opts.every(function (o) { return o === p.answer || (sig(o) !== null && sig(o) !== a); }), where + '값이 같은 틀린 보기: ' + opts.join(' | '));
      ok(opts.every(simple), where + '간단히 하지 않은 보기: ' + opts.join(' | '));
      /* 풀이: 줄마다 등호로 이은 식은 서로 같고, 식 전체를 다시 쓴 줄은 답과 같다. 마지막 줄은 정답이다 */
      st.forEach(function (s, i) {
        var chains = s.tex.split(',\\quad ').map(function (c) { return c.split(' = ').map(sig); });
        ok(chains.every(function (c) { return c[0] !== null && c.every(function (x) { return x === c[0]; }); }), where + '풀이 ' + (i + 1) + '째 줄의 등식: ' + s.tex);
        if (!/,\\quad | = /.test(s.tex) && !/거듭제곱을 먼저/.test(s.say)) ok(sig(s.tex) === a, where + '풀이 ' + (i + 1) + '째 줄이 답과 다름: ' + s.tex);
      });
      ok(st.length >= 2 && st[st.length - 1].tex === p.answer, where + '풀이의 마지막 줄');
      /* 규칙 검사: 가장 단순한 꼴(양수 계수 · 문자 하나)의 문제에서 답과 틀린 보기가 규칙대로인가 */
      if ((m = /^(\d*)([abxy])\^\{(\d)\} \\(times|div) (\d*)\2\^\{(\d)\}$/.exec(pr.tex))) {
        var c1 = Number(m[1] || 1), c2 = Number(m[5] || 1), e1 = Number(m[3]), e2 = Number(m[6]), L = m[2], mono = function (c, e) { return e === 0 ? String(c) : (c === 1 ? '' : c) + L + (e === 1 ? '' : '^{' + e + '}'); };
        rules++;
        if (m[4] === 'times') {
          eq(p.answer, mono(c1 * c2, e1 + e2), where + '곱셈 규칙');
          if (wrongOf(p, 'exp-multiplied')) eq(wrongOf(p, 'exp-multiplied'), mono(c1 * c2, e1 * e2), where + '지수를 곱한 보기');
          if (wrongOf(p, 'coef-added')) eq(wrongOf(p, 'coef-added'), mono(c1 + c2, e1 + e2), where + '계수를 더한 보기');
          if (wrongOf(p, 'doubled')) eq(wrongOf(p, 'doubled'), '2' + mono(1, e1 + e2), where + '앞에 2를 붙인 보기');
        } else if (c1 % c2 === 0 && e1 > e2) {
          eq(p.answer, mono(c1 / c2, e1 - e2), where + '나눗셈 규칙');
          if (wrongOf(p, 'div-as-mul')) eq(wrongOf(p, 'div-as-mul'), mono(c1 / c2, e1 + e2), where + '지수를 더한 보기');
          if (wrongOf(p, 'coef-subtracted')) eq(wrongOf(p, 'coef-subtracted'), mono(c1 - c2, e1 - e2), where + '계수를 뺀 보기');
          if (wrongOf(p, 'exp-divided')) eq(wrongOf(p, 'exp-divided'), mono(c1 / c2, e1 / e2), where + '지수를 나눈 보기');
        }
      }
      if ((m = /^\(([abxy])\^\{(\d)\}\)\^\{(\d)\}$/.exec(pr.tex))) {
        rules++;
        eq(p.answer, m[1] + '^{' + (Number(m[2]) * Number(m[3])) + '}', where + '거듭제곱의 거듭제곱');
        if (wrongOf(p, 'pow-added')) eq(wrongOf(p, 'pow-added'), m[1] + '^{' + (Number(m[2]) + Number(m[3])) + '}', where + '지수를 더한 보기');
      }
      if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
      detailed(id, p, where);
    });
    eq(Object.keys(bag).sort().join(' '), IDS[id], id + ': 틀린 보기의 종류');
    ok(id === 'B11.mixed' || rules >= 80, id + ': 규칙 검사를 한 문제 ' + rules + '개');
    ok(spare <= total * 1.1, id + ': 지수를 잘못 센 보기(예비)가 너무 많음 ' + spare + ' / ' + total);
    done(def.title);
  });

  group('B11 — 구체적인 예');
  var find = function (id, level, test) { for (var seed = 1; seed <= 8000; seed++) { var p = MH.makeProblem(id, level, seed); if (test(MH.types[id].prompt(p.v, p.ctx), p)) return p; } return null; };
  var p1 = find('B11.law', 1, function (pr) { return pr.tex === 'a^{2} \\div a^{5}'; });
  ok(!!p1 && p1.answer === '\\dfrac{1}{a^{3}}' && wrongOf(p1, 'inverted') === 'a^{3}' && wrongOf(p1, 'div-as-mul') === 'a^{7}', 'a² ÷ a⁵ = 1/a³');
  var p2 = find('B11.law', 1, function (pr) { return pr.tex === 'x^{3} \\div x^{3}'; });
  ok(!!p2 && p2.answer === '1' && MH.optionsOf(p2).indexOf('0') >= 0 && !/(^|\D)1(\D|$)/.test(MH.types['B11.law'].hints(p2.v).join(' ').replace(/[①②③]/g, '')), 'x³ ÷ x³ = 1 (힌트가 1 을 말하지 않는다)');
  var p3 = find('B11.law', 2, function (pr) { return /^\(2[abxy]\^\{3\}\)\^\{3\}$/.test(pr.tex); });
  ok(!!p3 && /^8[abxy]\^\{9\}$/.test(p3.answer) && /^2[abxy]\^\{9\}$/.test(wrongOf(p3, 'coef-not-powered')) && /^6[abxy]\^\{9\}$/.test(wrongOf(p3, 'coef-times')) && /^8[abxy]\^\{6\}$/.test(wrongOf(p3, 'pow-added')), '(2a³)³ = 8a⁹ 와 틀린 보기');
  var p4 = find('B11.law', 2, function (pr) { return /^\(-[abxy]\^\{2\}\)\^\{2\}$/.test(pr.tex); });
  ok(!!p4 && /^[abxy]\^\{4\}$/.test(p4.answer) && /^-[abxy]\^\{4\}$/.test(wrongOf(p4, 'coef-not-powered') || wrongOf(p4, 'pow-sign')), '(−a²)² = a⁴');
  var p5 = find('B11.exp', 2, function (pr) { return pr.tex === '8^{3} = 2^{\\square}'; });
  eq(p5 && [p5.answer, J(p5, '9'), J(p5, '3'), J(p5, '6')].join(' '), '9 correct:- wrong:base-same wrong:added', '8³ = 2^□');
  var p6 = find('B11.exp', 1, function (pr) { return /^\(([abxy235])\^\{2\}\)\^\{3\} \\times \1\^\{4\} = /.test(pr.tex); });
  eq(p6 && [p6.answer, J(p6, '10'), J(p6, '9'), J(p6, '24')].join(' '), '10 correct:- wrong:all-added wrong:all-multiplied', '(a²)³ × a⁴ = a^□');
  var p7 = find('B11.div', 2, function (pr, p) { return /dfrac/.test(pr.tex) && !!wrongOf(p, 'no-flip'); });
  ok(!!p7 && sig(wrongOf(p7, 'no-flip')) !== sig(p7.answer), '분수 계수로 나누기: 역수를 쓰지 않은 보기');
  var p8 = find('B11.mixed', 1, function (pr, p) { return !!wrongOf(p, 'right-first'); });
  ok(!!p8, '나눈 다음 곱하기: 뒤를 먼저 계산한 보기');
  if (p8) { var t8 = MH.types['B11.mixed'].prompt(p8.v).tex.split(' \\div '), rest = t8[1].split(' \\times '); ok(sig(wrongOf(p8, 'right-first')) === sig('\\dfrac{' + t8[0] + '}{(' + rest[0] + ') \\times (' + rest[1] + ')}'), 'A ÷ B × C 를 A ÷ (B × C) 로 계산한 값'); }
  done('예');
})();
