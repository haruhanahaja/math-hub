/* B03 정수와 유리수의 덧셈·뺄셈 — 답 형식 rational 과 단원 전용 검사.
   화면에 보이는 식을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000, RA = MH.kinds.rational, SG = MH.kinds.signed;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  /** '+3', '-1.5' 를 10 배 한 BigInt 로 */
  var tenths = function (t) { var m = /^([+-]?)(\d+)(?:\.(\d))?$/.exec(t); return (m[1] === '-' ? -1n : 1n) * BigInt(m[2] + (m[3] || '0')); };
  var answerTenths = function (p) { return BigInt(p.answer.n) * (p.answer.p ? 1n : 10n); };
  /** 힌트가 자세한가: 셋 이상이고, 하나하나가 한 줄짜리 규칙이 아니다 */
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx);
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
  };

  group('답 형식 rational');
  var P = function (raw) { var v = RA.parse(raw); return v && v.n + '/' + v.d + '/' + v.sign + (v.whole ? '/정수' : ''); };
  eq(P('-3,4'), '-3/4/-', '음의 분수'); eq(P('3,4'), '3/4/', '양의 분수'); eq(P('+3,4'), '3/4/+', '+ 를 붙인 분수');
  eq(P('-5,'), '-5/1/-/정수', '분모를 비운 정수'); eq(P('7'), '7/1//정수', '수 하나'); eq(P('-3/4'), '-3/4/-', '빗금으로 쓴 분수'); eq(P('-0,5'), '0/5/-', '−0');
  eq(P(','), null, '빈칸'); eq(P('-,4'), null, '분자가 빔'); eq(P('3,0'), null, '분모 0'); eq(P('-'), null, '부호만'); eq(P('3,4,5'), null, '칸이 셋');
  ok(RA.equal(RA.parse('-2,8'), { n: -1, d: 4 }) && RA.equal(RA.parse('6,3'), { n: 2, d: 1 }) && !RA.equal(RA.parse('1,4'), { n: -1, d: 4 }), '값 비교');
  ok(RA.valid({ n: -1, d: 4 }) && !RA.valid({ n: 1, d: 0 }) && !RA.valid(null), '쓸 수 있는 값');
  eq(RA.tex({ n: -1, d: 4 }) + ' ' + RA.tex({ n: 5, d: 6 }) + ' ' + RA.tex({ n: -3, d: 1 }), '-\\dfrac{1}{4} \\dfrac{5}{6} -3', '정답 표시');
  eq(RA.raw({ n: -1, d: 4 }) + ' ' + RA.raw({ n: 3, d: 1 }), '-1,4 3,', 'raw');
  eq(RA.sayTex(RA.parse('-2,8')) + ' ' + RA.sayTex(RA.parse('+5,')), '-\\frac{2}{8} +5', '내 답은 쓴 그대로');
  eq(RA.note(RA.parse('-2,8'), '-2,8', {}), '약분하면 $-\\dfrac{1}{4}$이에요.', '약분 안내');
  eq(RA.note(RA.parse('-6,3'), '-6,3', {}), '약분하면 $-2$예요.', '약분하면 정수');
  eq(RA.note(RA.parse('-1,4'), '-1,4', {}), null, '기약분수');
  eq(RA.next(['-3', ''], 0) + ' ' + RA.next(['-3', ''], 1) + ' ' + RA.next(['-3', '4'], 0) + ' ' + RA.next(['-', ''], 0), '1 -1 -1 -1', '확인을 눌렀을 때 옮겨 갈 칸');
  eq(RA.common(RA.parse('1,4'), { n: -1, d: 4 }).id, 'sign', '공통 실수: 부호가 반대');
  done('읽기 · 비교 · 표시 · 약분 안내');

  group('B03 — 보이는 식과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var TWO = /^\(([+-]\d+(?:\.\d)?)\) ([+-]) \(([+-]\d+(?:\.\d)?)\)$/;
  [['B03.same', '+', function (a, b) { return a * b > 0n; }], ['B03.diff', '+', function (a, b) { return a * b < 0n; }], ['B03.sub', '-', function () { return true; }]].forEach(function (t) {
    var zero = 0;
    each(t[0], function (p, pr, level, where) {
      var m = TWO.exec(pr.tex);
      if (!ok(!!m && m[2] === t[1], where + '식의 형식 ' + pr.tex)) return;
      var a = tenths(m[1]), b = tenths(m[3]), want = t[1] === '+' ? a + b : a - b;
      eq(String(answerTenths(p)), String(want), where + pr.tex + ' → ' + SG.tex(p.answer));
      ok(t[2](a, b), where + '두 수의 부호 ' + pr.tex);
      ok(level === 2 ? /\./.test(pr.tex) : !/\./.test(pr.tex) && (level === 0) === (a > -100n && a < 100n && b > -100n && b < 100n), where + '수의 크기 ' + pr.tex);
      if (want === 0n) { zero++; ok(!/(^|[^\d.])0([^\d.]|$)/.test(MH.types[t[0]].hints(p.v).join(' ')), where + '답이 0 인 문제의 힌트에 0 이 나옴'); }
      detailed(t[0], p, where);
    });
    if (t[0] === 'B03.diff') ok(zero > 0, '합이 0 인 문제도 나옴');
    done(MH.types[t[0]].title);
  });
  var FR = /^\\left\(([+-])\\dfrac\{(\d+)\}\{(\d+)\}\\right\) ([+-]) \\left\(([+-])\\dfrac\{(\d+)\}\{(\d+)\}\\right\)$/, ops = {};
  each('B03.frac', function (p, pr, level, where) {
    var m = FR.exec(pr.tex);
    if (!ok(!!m, where + '식의 형식 ' + pr.tex)) return;
    var an = (m[1] === '-' ? -1n : 1n) * BigInt(m[2]), ad = BigInt(m[3]), bn = (m[5] === '-' ? -1n : 1n) * BigInt(m[6]), bd = BigInt(m[7]);
    if (m[4] === '-') bn = -bn;
    var n = an * bd + bn * ad, d = ad * bd;
    ok(BigInt(p.answer.n) * d === n * BigInt(p.answer.d), where + pr.tex + ' → ' + RA.tex(p.answer));
    ok(MH.gcd(p.answer.n, p.answer.d) === 1 && p.answer.d > 1 && p.answer.n !== 0, where + '답은 0 도 정수도 아닌 기약분수 ' + RA.tex(p.answer));
    ok(an < 0n || bn < 0n, where + '덧셈으로 바꿨을 때 음수가 있음 ' + pr.tex);
    ok(level === 0 ? ad === bd && m[4] === '+' : level === 1 ? ad !== bd && (ad % bd === 0n || bd % ad === 0n) : ad % bd !== 0n && bd % ad !== 0n, where + '분모의 관계 ' + pr.tex);
    ok(MH.gcd(Number(m[2]), Number(m[3])) === 1 && MH.gcd(Number(m[6]), Number(m[7])) === 1 && Number(m[2]) < Number(m[3]) && Number(m[6]) < Number(m[7]), where + '기약 진분수로 낸다 ' + pr.tex);
    /* 약분하지 않은 답도 정답(안내가 붙는다) */
    eq(MH.judge(p, (p.answer.n * 2) + ',' + (p.answer.d * 2)).verdict, 'correct-note', where + '약분하지 않은 답');
    ops[level + m[4]] = 1;
    detailed('B03.frac', p, where);
  });
  eq(Object.keys(ops).sort().join(' '), '0+ 1+ 1- 2+ 2-', '단계마다 나오는 연산');
  done('분수의 덧셈과 뺄셈');
  var shapes = {};
  each('B03.mixed', function (p, pr, level, where) {
    var paren = /\(/.test(pr.tex), x = 0n, count, m, re;
    if (paren) {
      re = /(?:^|([+-]) )\(([+-]\d+)\)/g; count = 0;
      while ((m = re.exec(pr.tex))) { x = m[1] === '-' ? x - BigInt(m[2]) : x + BigInt(m[2]); count++; }
      ok(/ - \(/.test(pr.tex), where + '뺄셈이 하나는 있음 ' + pr.tex);
    } else {
      var parts = pr.tex.replace(/([+-]) /g, '$1').split(' ');
      count = parts.length;
      parts.forEach(function (t) { x += BigInt(t); });
      ok(/^-?\d+( [+-] \d+)+$/.test(pr.tex), where + '식의 형식 ' + pr.tex);
    }
    eq(String(p.answer.n), String(x), where + pr.tex);
    ok(count === (level === 2 ? 4 : 3) && (level === 0 ? paren : level === 1 ? !paren : true), where + '수의 개수 · 꼴 ' + pr.tex);
    shapes[level + (paren ? 'paren' : 'plain')] = 1;
    detailed('B03.mixed', p, where);
  });
  eq(Object.keys(shapes).sort().join(' '), '0paren 1plain 2paren 2plain', '단계마다 나오는 꼴');
  done('덧셈과 뺄셈이 섞인 식');

  group('B03 — 흔한 실수와 풀이 · 힌트의 구체적인 예');
  var prob = function (type, v, answer) { return { type: type, v: v, ctx: null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var E = function (p, raw) { return MH.judge(p, raw).mistake.explain; };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var H = function (p) { return MH.types[p.type].hints(p.v); };
  var sm = prob('B03.same', { p: 0, sa: -1, sb: -1, x: 3, y: 5 }, { n: -8, p: 0 }), df = prob('B03.diff', { p: 0, sa: 1, sb: -1, x: 3, y: 5 }, { n: -2, p: 0 });
  var z = prob('B03.diff', { p: 0, sa: -1, sb: 1, x: 4, y: 4 }, { n: 0, p: 0 }), sb = prob('B03.sub', { p: 0, sa: -1, sb: -1, x: 2, y: 6 }, { n: 4, p: 0 });
  eq([J(sm, '-8'), J(sm, '8'), J(sm, '-2'), J(sm, '-9')].join(' '), 'correct:- wrong:lost-sign wrong:subtracted wrong:-', '(−3) + (−5)');
  eq([J(df, '-2'), J(df, '2'), J(df, '-8'), J(df, '8')].join(' '), 'correct:- wrong:wrong-sign wrong:added wrong:added-other', '(+3) + (−5)');
  eq(J(z, '0') + ' ' + J(z, '8') + ' ' + J(z, '-8'), 'correct:- wrong:added-other wrong:added', '(−4) + (+4)');
  eq([J(sb, '4'), J(sb, '+4'), J(sb, '-8'), J(sb, '-4')].join(' '), 'correct:- correct:- wrong:not-flipped wrong:wrong-sign', '(−2) − (−6)');
  eq(E(df, '-8'), '두 수의 크기를 더했어요. 부호가 다르면 서로 반대쪽으로 가는 것이라서, 더하지 않고 큰 쪽에서 작은 쪽을 빼요: 5 − 3.', '부호가 다른데 더한 실수의 설명');
  eq(E(sb, '-8'), '가운데 −만 +로 바꾸고, 빼는 수의 부호는 그대로 뒀어요. (−6)의 부호도 반대로 바꿔서 (−2) + (+6)으로 계산해야 해요.', '부호를 안 바꾼 실수의 설명');
  eq(H(df).join(' | '), '수직선에서 생각해 보세요. +는 오른쪽으로, −는 왼쪽으로 가는 거예요. 0에서 출발해서 오른쪽으로 3만큼 간 다음, 방향을 바꿔 왼쪽으로 5만큼 가요. 서로 반대쪽으로 가니까 간 거리가 서로 깎여요. | 부호가 다른 두 수의 덧셈은 이렇게 해요. ① 부호를 떼고 두 수의 크기(절댓값)를 비교해요: 3과 5. ② 큰 쪽에서 작은 쪽을 빼요. ③ 답의 부호는 절댓값이 큰 수의 부호를 따라요. | 절댓값이 큰 수는 −5예요(왼쪽으로 더 많이 갔어요). 그래서 답의 부호는 −이고, 숫자는 5 − 3을 계산한 값이에요.', '부호가 다른 덧셈의 힌트');
  eq(H(sb)[1] + ' | ' + H(sb)[2], '바꾸는 곳은 두 군데예요. ① 가운데 −를 +로 바꿔요. ② 빼는 수 (−6)의 부호를 반대로 바꿔 (+6)으로 써요. 앞의 수 (−2)는 그대로 둬요. | 바꾸면 이렇게 돼요: $(-2) + (+6)$. 이제 덧셈이에요.', '뺄셈의 힌트');
  eq(H(z)[2], '두 수의 절댓값이 4로 같아요. 왼쪽으로 간 만큼 오른쪽으로 되돌아오면 어디에 서 있게 될까요?', '합이 0 인 문제의 마지막 힌트');
  eq(says(sm), '두 수의 부호가 같아요. 부호를 떼고 두 수를 더해요. [3 + 5 = 8] | 두 수가 함께 가진 부호 −를 붙여요. 답은 −8이에요. [(-3) + (-5) = -8]', '부호가 같은 덧셈의 풀이');
  eq(says(z), '두 수의 부호가 다르고, 부호를 뗀 크기(절댓값)는 4로 같아요. | 4만큼 갔다가 똑같이 4만큼 되돌아오니 0이에요. [(-4) + (+4) = 0]', '합이 0 인 풀이');
  eq(says(sb).split(' | ')[0], '뺄셈을 덧셈으로 바꿔요. 가운데 −를 +로, 빼는 수 (−6)의 부호를 반대로 바꿔요. [(-2) - (-6) = (-2) + (+6)]', '뺄셈 풀이의 첫 줄');

  var fr = prob('B03.frac', { q: { a: [-1, 2], b: [-1, 3], op: '-' } }, { n: -1, d: 6 }), f2 = prob('B03.frac', { q: { a: [-1, 6], b: [-1, 3], op: '+' } }, { n: -1, d: 2 });
  eq([J(fr, '-1,6'), J(fr, '-2,12'), J(fr, '-5,6'), J(fr, '1,6'), J(fr, '-1,5')].join(' '), 'correct:- correct-note:- wrong:not-flipped wrong:wrong-sign wrong:-', '(−1/2) − (−1/3)');
  eq(J(f2, '-1,2') + ' ' + J(f2, '-3,6') + ' ' + J(f2, '-1,6'), 'correct:- correct-note:- wrong:abs-mixup', '(−1/6) + (−1/3)');
  eq(says(fr), '뺄셈을 덧셈으로 바꿔요. 빼는 수의 부호를 반대로 바꿔요. [\\left(-\\dfrac{1}{2}\\right) - \\left(-\\dfrac{1}{3}\\right) = \\left(-\\dfrac{1}{2}\\right) + \\left(+\\dfrac{1}{3}\\right)] | 분모 2와 3의 최소공배수 6으로 분모를 맞춰요(통분). 부호는 그대로예요. [\\left(-\\dfrac{3}{6}\\right) + \\left(+\\dfrac{2}{6}\\right)] | 분모는 그대로 두고 분자끼리 계산해요. 부호가 다르니 3 − 2 = 1에 절댓값이 큰 수의 부호를 붙여요. [\\dfrac{(-3) + (+2)}{6} = -\\dfrac{1}{6}] | 더 약분할 수 없으니 이것이 답이에요. [-\\dfrac{1}{6}]', '분수 뺄셈의 풀이');
  eq(says(f2).split(' | ').pop(), '분자와 분모를 3으로 나누어 약분해요. [-\\dfrac{3}{6} = -\\dfrac{1}{2}]', '약분하는 풀이의 마지막 줄');
  eq(H(fr)[1], '분수라도 방법은 정수와 똑같아요. 다만 분모가 같아야 분자끼리 계산할 수 있어요. 분모 2와 3의 최소공배수 6으로 분모를 맞춰요(통분): $\\frac{1}{2} = \\frac{3}{6}$, $\\frac{1}{3} = \\frac{2}{6}$. 분모에 곱한 수를 분자에도 똑같이 곱해요. 부호는 그대로 둬요.', '통분 힌트');
  eq(H(f2)[0].split('통분): ')[1], '$\\frac{1}{3} = \\frac{2}{6}$. 분모에 곱한 수를 분자에도 똑같이 곱해요. 부호는 그대로 둬요.', '바꿀 필요가 없는 분수는 힌트에 쓰지 않음');

  var mp = prob('B03.mixed', { q: { form: 'paren', t: [-3, 5, -2], ops: ['+', '-'] } }, { n: 4, p: 0 }), ml = prob('B03.mixed', { q: { form: 'plain', t: [-3, 5, -9], ops: ['+', '+'] } }, { n: -7, p: 0 });
  eq(MH.types['B03.mixed'].prompt(mp.v).tex + ' / ' + MH.types['B03.mixed'].prompt(ml.v).tex, '(-3) + (+5) - (-2) / -3 + 5 - 9', '섞인 식의 모양');
  eq(J(mp, '4') + ' ' + J(mp, '0') + ' ' + J(mp, '-4'), 'correct:- wrong:not-flipped wrong:wrong-sign', '(−3) + (+5) − (−2)');
  eq(J(ml, '-7') + ' ' + J(ml, '-1') + ' ' + J(ml, '7'), 'correct:- wrong:first-positive wrong:wrong-sign', '−3 + 5 − 9');
  eq(E(ml, '-1'), '맨 앞의 −를 빠뜨렸어요. 맨 앞의 수는 3이 아니라 −3이에요.', '맨 앞의 − 를 빠뜨린 실수의 설명');
  eq(says(ml), '각 수 앞의 기호를 그 수의 부호로 읽어요. 그러면 모두 덧셈이에요. [-3 + 5 - 9 = (-3) + (+5) + (-9)] | 양수는 양수끼리, 음수는 음수끼리 모아 더해요. [(-3) + (-9) = -12] | 이제 (+5) + (−12)를 계산해요. 두 수의 부호가 달라요. 부호를 뗀 크기(절댓값)가 큰 쪽에서 작은 쪽을 빼요. [12 - 5 = 7] | 답의 부호는 절댓값이 큰 수 −12의 부호 −를 따라요. 답은 −7이에요. [(+5) + (-12) = -7]', '섞인 식의 풀이');
  eq(H(mp)[1] + ' | ' + H(mp)[2].split('. ①')[0], '그렇게 읽으면 이렇게 돼요: $(-3) + (+5) + (+2)$. 덧셈만 남았으니 더하는 순서를 바꿔도 답이 같아요. | 양수는 양수끼리, 음수는 음수끼리 모으면 쉬워요. 양수: (+5), (+2) / 음수: (−3)', '섞인 식의 힌트');
  done('실수 · 풀이 · 힌트 예');
})();
