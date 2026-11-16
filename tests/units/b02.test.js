/* B02 정수와 유리수의 뜻 — 답 형식 signed 와 단원 전용 검사.
   화면에 보이는 문제 글 · 식 · 그림을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000, SG = MH.kinds.signed;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  /** 수식으로 쓴 수 하나를 [분자, 분모](BigInt)로 읽는다: '-3', '+2.5', '-\frac{6}{3}', '\dfrac{1}{2}' */
  var read = function (t) {
    var m = /^\s*([+-]?)(?:\\d?frac\{(\d+)\}\{(\d+)\}|(\d+)(?:\.(\d+))?)\s*$/.exec(t);
    if (!m) throw new Error('읽을 수 없는 수: ' + t);
    var s = m[1] === '-' ? -1n : 1n;
    return m[2] ? [s * BigInt(m[2]), BigInt(m[3])] : [s * BigInt(m[4] + (m[5] || '')), 10n ** BigInt((m[5] || '').length)];
  };
  var whole = function (q) { return q[0] % q[1] === 0n; };
  var show = function (p) { return SG.tex(p.answer, MH.types[p.type].answer); };

  group('답 형식 signed');
  var P = function (raw) { var v = SG.parse(raw); return v && v.n + '/' + v.p + '/' + v.sign; };
  eq(P('-3'), '-3/0/-', '음수'); eq(P('+7'), '7/0/+', '양의 부호'); eq(P('7'), '7/0/', '부호 없음');
  eq(P('-1.5'), '-15/1/-', '음의 소수'); eq(P('−2'), '-2/0/-', '뺄셈 기호(−)로 쓴 음수'); eq(P('-0'), '0/0/-', '−0 은 0');
  eq(P('0.50'), '50/2/', '끝의 0'); eq(P('-12.'), '-12/0/-', '소수점만 찍은 수');
  eq(P(''), null, '빈칸'); eq(P('-'), null, '부호만'); eq(P('+-3'), null, '부호 둘'); eq(P('3-'), null, '뒤에 붙은 부호'); eq(P('1.2.3'), null, '소수점 둘');
  ok(SG.equal(SG.parse('-1.50'), { n: -15, p: 1 }) && SG.equal(SG.parse('+3'), { n: 3, p: 0 }) && !SG.equal(SG.parse('3'), { n: -3, p: 0 }), '값 비교');
  ok(SG.valid({ n: -15, p: 1 }) && !SG.valid({ n: 1.5, p: 0 }) && !SG.valid(null), '쓸 수 있는 값');
  eq(SG.tex({ n: -15, p: 1 }) + ' ' + SG.tex({ n: 7, p: 0 }) + ' ' + SG.tex({ n: 7, p: 0 }, { plus: 'notice' }) + ' ' + SG.tex({ n: 0, p: 0 }, { plus: 'notice' }), '-1.5 7 +7 0', '정답 표시');
  eq(SG.sayTex(SG.parse('+7')) + ' ' + SG.sayTex(SG.parse('-0.50')) + ' ' + SG.say(SG.parse('-3')), '+7 -0.50 −3', '내 답은 쓴 그대로');
  eq(SG.note(SG.parse('7'), '7', { plus: 'notice' }), '부호를 붙여 쓰면 $+7$이에요.', '부호를 안 붙인 양수');
  eq(SG.note(SG.parse('+7'), '+7', { plus: 'notice' }), null, '부호를 붙인 양수');
  eq(SG.note(SG.parse('7'), '7', {}), null, '부호를 묻지 않는 문제');
  eq(SG.common(SG.parse('3'), { n: -3, p: 0 }).id, 'sign', '공통 실수: 부호가 반대');
  eq(SG.common(SG.parse('4'), { n: -3, p: 0 }), null, '공통 실수 아님');
  done('읽기 · 비교 · 표시 · 공통 실수');

  group('B02 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var used = {}, forms = {};
  each('B02.sign', function (p, pr, level, where) {
    var m, spec = MH.types['B02.sign'].answer;
    if ((m = /^0보다 (\d+(?:\.\d+)?)만큼 (큰|작은) 수를 부호를 붙여 나타내세요\.$/.exec(pr.text))) {
      eq(show(p), (m[2] === '큰' ? '+' : '-') + m[1], where + pr.text);
      ok(level >= 1 && (level === 2) === /\./.test(m[1]), where + '단계 ' + pr.text);
      eq(spec.suffix(p.v, p.ctx), '', where + '단위 없음');
      forms['zero' + level] = 1;
    } else {
      m = /^(.+)[을를] ([+−])(\d+) ?(\S+?)(?:으로|로) 나타낼 때, (.+)[을를] 부호를 붙여 나타내세요\.$/.exec(pr.text);
      if (!ok(!!m, where + '문제 글 형식 ' + pr.text)) return;
      var c = p.ctx, side = function (t) { return t.indexOf(c.neg) >= 0 && t.indexOf(c.pos) < 0 ? '−' : t.indexOf(c.pos) >= 0 && t.indexOf(c.neg) < 0 ? '+' : '?'; };
      eq(side(m[1]), m[2], where + '보기의 부호 ' + pr.text);
      ok(m[1].indexOf(m[3]) >= 0 && m[4] === c.unit, where + '보기의 수 · 단위 ' + pr.text);
      var num = /\d+/.exec(m[5])[0];
      ok(side(m[5]) !== '?' && side(m[5]) !== m[2], where + '묻는 쪽은 보기의 반대쪽 ' + pr.text);
      eq(show(p), (side(m[5]) === '+' ? '+' : '-') + num, where + pr.text);
      ok(num !== m[3], where + '보기와 다른 수 ' + pr.text);
      eq(spec.suffix(p.v, p.ctx), c.unit, where + '답 칸의 단위');
      used[c.id] = 1; forms['ctx' + level] = 1;
    }
    /* 부호 없이 쓴 양수는 정답 + 안내, 음수는 오답 */
    eq(MH.judge(p, String(Math.abs(p.answer.n) / 1).replace(/^(\d+)$/, function (d) { return MH.decStr(Number(d), p.answer.p); })).verdict, p.answer.n > 0 ? 'correct-note' : 'wrong', where + '부호 없이 쓴 답');
  });
  eq(Object.keys(used).length, MH.types['B02.sign'].contexts.length, '모든 상황이 쓰임');
  eq(Object.keys(forms).sort().join(' '), 'ctx0 ctx2 zero1 zero2', '단계마다 정해진 꼴이 나옴');
  done('부호를 붙여 나타내기');

  var LABEL = { '양의 정수': function (q) { return whole(q) && q[0] > 0n; }, '음의 정수': function (q) { return whole(q) && q[0] < 0n; }, '정수': whole,
    '정수가 아닌 유리수': function (q) { return !whole(q); }, '양수': function (q) { return q[0] > 0n; }, '음수': function (q) { return q[0] < 0n; } };
  var asked = {}, disguised = 0;
  each('B02.kind', function (p, pr, level, where) {
    var opts = (pr.text.match(/\$[^$]+\$/g) || []).map(function (t) { return t.slice(1, -1); }), m = / 가운데 (.+?)[은는] 어느 것일까요\?$/.exec(pr.text);
    if (!ok(opts.length === 4 && m && LABEL[m[1]], where + '문제 글 형식 ' + pr.text)) return;
    eq(MH.optionsOf(p).join(' | '), opts.join(' | ').replace(/dfrac/g, 'frac'), where + '보기가 문제 글의 수와 같음');
    opts = MH.optionsOf(p);
    var vals = opts.map(read), hits = opts.filter(function (t, i) { return LABEL[m[1]](vals[i]); });
    ok(hits.length === 1 && hits[0] === p.answer, where + pr.text + ' → ' + p.answer);
    ok(vals.every(function (a, i) { return vals.every(function (b, j) { return i === j || a[0] * b[1] !== b[0] * a[1]; }); }), where + '값이 같은 보기가 있음 ' + pr.text);
    var fake = opts.filter(function (t, i) { return /frac/.test(t) && whole(vals[i]); }).length;
    ok(level === 2 ? fake >= 1 : fake === 0, where + '약분하면 정수가 되는 분수는 마지막 단계에만 ' + pr.text);
    ok(level > 0 || !/frac/.test(pr.text), where + '첫 단계에는 분수가 없음');
    asked[level + m[1]] = 1; disguised += fake;
    /* 다른 보기를 고르면 그 수가 무엇인지 알려 준다 */
    var other = opts.filter(function (t) { return t !== p.answer; })[0], j = MH.judge(p, other);
    ok(j.verdict === 'wrong' && j.mistake.id === 'picked-other' && j.mistake.explain.indexOf('$' + other + '$') === 0 && !/undefined|NaN/.test(j.mistake.explain), where + '다른 보기를 고른 설명 ' + JSON.stringify(j.mistake));
  });
  eq(Object.keys(asked).sort().join(' '), '0양의 정수 0음의 정수 1양수 1음수 1정수 1정수가 아닌 유리수 2양의 정수 2음의 정수 2정수 2정수가 아닌 유리수', '단계마다 묻는 종류');
  done('수의 분류');

  each('B02.line', function (p, pr, level, where) {
    var f = pr.figure;
    if (!ok(f && f.type === 'line' && f.min < 0 && f.max > 0 && f.mark >= 0 && f.mark <= (f.max - f.min) * f.parts, where + '그림 ' + JSON.stringify(f))) return;
    /* 답 × parts = 왼쪽 끝에서 센 눈금의 위치 */
    eq(p.answer.n * f.parts, (f.min * f.parts + f.mark) * MH.pow10(p.answer.p), where + JSON.stringify(f) + ' → ' + show(p));
    ok(f.parts === [1, 2][level] || (level === 2 && (f.parts === 4 || f.parts === 5)), where + '눈금 간격');
    ok(level === 0 ? p.answer.n !== 0 && p.answer.p === 0 : f.mark % f.parts !== 0, where + '가리키는 자리 ' + JSON.stringify(f));
    eq(/소수로/.test(pr.text), level > 0, where + '소수로 쓰라는 안내');
  });
  done('수직선 위의 수');

  var absForms = {};
  each('B02.abs', function (p, pr, level, where) {
    var m, c = 0, x, sfx = MH.types['B02.abs'].answer.suffix(p.v);
    if ((m = /^\\left\| ([+-])(\d+(?:\.\d+)?) \\right\|$/.exec(pr.tex || ''))) {
      eq(show(p), m[2], where + pr.tex);
      ok(level < 2 && (level === 1) === /\./.test(m[2]) && sfx === '', where + '단계 ' + pr.tex);
      absForms['value' + m[1]] = 1;
    } else if ((m = /^절댓값이 (\d+)인 수 가운데 (음수|양수)를 구하세요\.$/.exec(pr.text))) {
      eq(show(p), (m[2] === '음수' ? '-' : '') + m[1], where + pr.text);
      ok(level === 1 && sfx === '', where + '단계 ' + pr.text);
      absForms[m[2]] = 1;
    } else {
      m = /^절댓값이 (?:(\d+) 이하인|(\d+)보다 작은|(\d+) 이상 (\d+) 이하인) 정수는 모두 몇 개일까요\?$/.exec(pr.text);
      if (!ok(!!m && level === 2 && sfx === '개', where + '문제 글 형식 ' + pr.text)) return;
      for (x = -100; x <= 100; x++) { var d = x < 0 ? -x : x; if (m[1] ? d <= Number(m[1]) : m[2] ? d < Number(m[2]) : d >= Number(m[3]) && d <= Number(m[4])) c++; }
      eq(show(p), String(c), where + pr.text);
      absForms[m[1] ? 'le' : m[2] ? 'lt' : 'between'] = 1;
    }
  });
  eq(Object.keys(absForms).sort().join(' '), 'between le lt value+ value- 양수 음수', '모든 꼴이 나옴');
  done('절댓값');

  var signs = {};
  each('B02.compare', function (p, pr, level, where) {
    var side = pr.tex.split(' \\;\\bigcirc\\; ');
    if (!ok(side.length === 2, where + '식의 형식 ' + pr.tex)) return;
    var a = read(side[0]), b = read(side[1]), c = a[0] * b[1] - b[0] * a[1];
    eq(p.answer, c > 0n ? '>' : c < 0n ? '<' : '=', where + pr.tex);
    ok(a[0] < 0n || b[0] < 0n, where + '적어도 한 수는 음수 ' + pr.tex);
    ok(side[0] !== side[1], where + '같은 수를 두 번 씀 ' + pr.tex);
    ok(level === 0 ? !/[.]|frac/.test(pr.tex) : level === 1 ? /\./.test(pr.tex) && !/frac/.test(pr.tex) : /dfrac/.test(pr.tex), where + '단계에 맞는 수 ' + pr.tex);
    /* 풀이의 마지막 식도 같은 관계를 말한다 */
    var last = MH.types['B02.compare'].steps(p.v).pop();
    eq(last.tex, side[0] + ' ' + p.answer + ' ' + side[1], where + '풀이의 식');
    signs[level + p.answer] = 1;
  });
  eq(Object.keys(signs).sort().join(' '), '0< 0> 1< 1> 2< 2= 2>', '답의 종류(같음은 분수와 소수를 비교할 때만)');
  done('대소 비교');

  group('B02 — 흔한 실수와 풀이의 구체적인 예');
  var prob = function (type, v, answer, ctx) { return { type: type, v: v, ctx: ctx || null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var E = function (p, raw) { return MH.judge(p, raw).mistake.explain; };
  var says = function (p) { return MH.types[p.type].steps(p.v, p.ctx).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var C = MH.types['B02.sign'].contexts, temp = C.filter(function (c) { return c.id === 'temp'; })[0], money = C.filter(function (c) { return c.id === 'money'; })[0];
  var s1 = prob('B02.sign', { form: 0, dir: -1, p: 0, a: 3, b: 7 }, { n: -3, p: 0 }, temp), s2 = prob('B02.sign', { form: 0, dir: 1, p: 0, a: 3000, b: 500 }, { n: 3000, p: 0 }, money);
  var s3 = prob('B02.sign', { form: 1, dir: -1, p: 1, a: 25, b: 0 }, { n: -25, p: 1 }, temp);
  eq(MH.types['B02.sign'].prompt(s1.v, temp).text, '영상 7 °C를 +7 °C로 나타낼 때, 영하 3 °C를 부호를 붙여 나타내세요.', '문제 글(기온)');
  eq(MH.types['B02.sign'].prompt(s2.v, money).text, '500원의 지출을 −500원으로 나타낼 때, 3000원의 수입을 부호를 붙여 나타내세요.', '문제 글(돈)');
  eq(MH.types['B02.sign'].prompt(s3.v, temp).text, '0보다 2.5만큼 작은 수를 부호를 붙여 나타내세요.', '문제 글(0보다 작은 수)');
  eq([J(s1, '-3'), J(s1, '3'), J(s1, '+3'), J(s1, '-7'), J(s1, '-4')].join(' '), 'correct:- wrong:flipped wrong:flipped wrong:copied-example wrong:-', '영하 3 °C');
  eq([J(s2, '+3000'), J(s2, '3000'), J(s2, '-3000'), J(s2, '+500')].join(' '), 'correct:- correct-note:- wrong:flipped wrong:copied-example', '3000원의 수입');
  eq(MH.judge(s2, '3000').note, '부호를 붙여 쓰면 $+3000$이에요.', '부호 안내');
  eq(E(s1, '3'), '‘영하’ 쪽은 ‘영상’ 쪽과 반대예요. ‘영상’ 쪽을 +로 나타냈으니, 여기에는 −를 붙여요.', '부호를 안 붙인 실수의 설명');
  eq(J(s3, '-2.5') + ' ' + J(s3, '2.5'), 'correct:- wrong:flipped', '0보다 2.5만큼 작은 수');
  eq(says(s1), '‘영상’ 쪽을 +로 나타냈으니, 반대인 ‘영하’ 쪽은 −로 나타내요. | 영하 3 °C는 −3 °C예요.', '부호 풀이');
  eq(says(s2).split(' | ')[1], '3000원의 수입은 +3000원이에요.', '부호 풀이(돈)');

  var num = function (n, d, k, plus) { return { n: n, d: d, k: k, plus: !!plus }; };
  var k1 = prob('B02.kind', { q: { ask: 'int', opts: [num(-15, 10, 'dec'), num(-6, 3, 'frac'), num(5, 4, 'frac', true), num(7, 10, 'dec')] } }, '-\\frac{6}{3}');
  eq(MH.types['B02.kind'].prompt(k1.v).text, '$-1.5$,  $-\\dfrac{6}{3}$,  $+\\dfrac{5}{4}$,  $0.7$ 가운데 정수는 어느 것일까요?', '분류 문제 글');
  eq(J(k1, '-\\frac{6}{3}') + ' ' + J(k1, '-1.5'), 'correct:- wrong:picked-other', '정수 고르기');
  eq(E(k1, '+\\frac{5}{4}'), '$+\\frac{5}{4}$는 정수가 아닌 유리수예요(양수). 정수가 아니에요.', '다른 보기를 고른 설명');
  eq(says(k1).split(' | ')[1], '$-\\frac{6}{3}$은 6 ÷ 3 = 2라서 −2와 같아요. 음의 정수예요.', '약분하면 정수가 되는 분수의 풀이');
  var k0 = prob('B02.kind', { q: { ask: 'pos', opts: [num(0, 1, 'int'), num(-2, 1, 'int'), num(3, 1, 'int', true), num(-5, 10, 'dec')] } }, '+3');
  eq(E(k0, '0'), '$0$은 양수도 음수도 아닌 정수예요. 양수가 아니에요.', '0 을 양수로 고른 설명');

  var l1 = prob('B02.line', { min: -2, max: 2, parts: 2, mark: 1 }, { n: -15, p: 1 }), l0 = prob('B02.line', { min: -5, max: 5, parts: 1, mark: 2 }, { n: -3, p: 0 });
  eq([J(l1, '-1.5'), J(l1, '1.5'), J(l1, '-3'), J(l1, '-2.5'), J(l1, '-1.50')].join(' '), 'correct:- wrong:sign wrong:tick-as-one wrong:from-left-tick correct:-', '−1.5 를 가리키는 수직선');
  eq(E(l1, '-2.5'), '왼쪽 큰 눈금 −2에 소수 부분을 붙여 읽었어요. □는 −2보다 오른쪽이라서 −2보다 큰 수예요. 0에서부터 왼쪽으로 몇 칸인지 세어 보세요.', '왼쪽 눈금부터 읽은 실수의 설명');
  eq(J(l0, '-3') + ' ' + J(l0, '3') + ' ' + J(l0, '2'), 'correct:- wrong:sign wrong:-', '−3 을 가리키는 수직선');
  eq(says(l1), '□는 0의 왼쪽에 있으니 음수예요. 답에 −를 붙여요. | 0과 1 사이를 똑같이 2칸으로 나누었으니 작은 눈금 한 칸은 0.5예요. | □는 0에서 왼쪽으로 3칸 떨어져 있어요. 0.5 × 3 = 1.5이므로 답은 −1.5예요.', '수직선 풀이');

  var a0 = prob('B02.abs', { form: 0, s: -1, p: 0, a: 7, b: 0 }, { n: 7, p: 0 }), a0p = prob('B02.abs', { form: 0, s: 1, p: 1, a: 25, b: 0 }, { n: 25, p: 1 });
  var a1 = prob('B02.abs', { form: 1, s: -1, p: 0, a: 5, b: 0 }, { n: -5, p: 0 }), a2 = prob('B02.abs', { form: 2, s: 1, p: 0, a: 3, b: 0 }, { n: 7, p: 0 });
  var a3 = prob('B02.abs', { form: 3, s: 1, p: 0, a: 3, b: 0 }, { n: 5, p: 0 }), a4 = prob('B02.abs', { form: 4, s: 1, p: 0, a: 2, b: 4 }, { n: 6, p: 0 });
  eq(J(a0, '7') + ' ' + J(a0, '-7') + ' ' + J(a0p, '2.5') + ' ' + J(a0p, '-2.5'), 'correct:- wrong:kept-sign correct:- wrong:made-negative', '|−7|, |+2.5|');
  eq(J(a1, '-5') + ' ' + J(a1, '5'), 'correct:- wrong:other-side', '절댓값이 5인 음수');
  eq([J(a2, '7'), J(a2, '4'), J(a2, '6'), J(a2, '5')].join(' '), 'correct:- wrong:no-negatives wrong:no-zero wrong:boundary', '절댓값이 3 이하인 정수의 개수');
  eq([J(a3, '5'), J(a3, '3'), J(a3, '4'), J(a3, '7')].join(' '), 'correct:- wrong:no-negatives wrong:no-zero wrong:boundary', '절댓값이 3보다 작은 정수의 개수');
  eq([J(a4, '6'), J(a4, '3'), J(a4, '9')].join(' '), 'correct:- wrong:no-negatives wrong:filled-middle', '절댓값이 2 이상 4 이하인 정수의 개수');
  eq(E(a2, '5'), '‘3 이하’에는 절댓값이 꼭 3인 +3과 −3도 들어가요.', '경계를 뺀 실수의 설명');
  eq(says(a4), '절댓값이 2 이상 4 이하인 정수를 작은 수부터 모두 써요: −4, −3, −2, 2, 3, 4. | 세어 보면 모두 6개예요.', '개수 풀이');
  eq(says(a0), '−7은 수직선에서 0으로부터 7만큼 떨어져 있어요. | 절댓값은 그 거리예요. 부호를 떼어 내면 돼요. [\\left| -7 \\right| = 7]', '절댓값 풀이');

  var c1 = prob('B02.compare', { q: [num(-3, 1, 'int'), num(-5, 1, 'int')] }, '>'), c2 = prob('B02.compare', { q: [num(-4, 1, 'int'), num(4, 1, 'int')] }, '<');
  var c3 = prob('B02.compare', { q: [num(-1, 2, 'frac'), num(-5, 10, 'dec')] }, '='), c4 = prob('B02.compare', { q: [num(-1, 2, 'frac'), num(-2, 3, 'frac')] }, '>'), c5 = prob('B02.compare', { q: [num(0, 1, 'int'), num(-3, 10, 'dec')] }, '>');
  eq(J(c1, '>') + ' ' + J(c1, '<') + ' ' + J(c1, '='), 'correct:- wrong:said-less wrong:said-equal', '−3 과 −5');
  eq(E(c1, '<'), '절댓값이 큰 쪽을 더 크다고 봤어요. 음수끼리는 반대예요. 음수끼리는 절댓값이 큰 수가 0에서 더 멀리 왼쪽에 있어서 더 작아요. $-3$이 $-5$보다 커요.', '절댓값만 비교한 실수의 설명');
  eq(E(c2, '='), '절댓값은 같지만 부호가 달라요. 음수는 0보다 작고 양수는 0보다 커요. 그래서 양수는 음수보다 언제나 커요. $4$가 $-4$보다 커요.', '부호만 다른 두 수를 같다고 한 설명');
  eq(says(c3), '$-\\frac{1}{2}$을 소수로 바꾸면 $-0.5$예요(분자 ÷ 분모). | 두 수는 같아요. [-\\dfrac{1}{2} = -0.5]', '같은 두 수의 풀이');
  eq(says(c4), '둘 다 음수예요. 절댓값을 비교하면 $\\frac{2}{3}$가 $\\frac{1}{2}$보다 커요 (분모를 6으로 맞추면 $\\frac{1}{2} = \\frac{3}{6}$, $\\frac{2}{3} = \\frac{4}{6}$). | 음수끼리는 절댓값이 큰 수가 0에서 더 멀리 왼쪽에 있어서 더 작아요. $-\\frac{1}{2}$이 $-\\frac{2}{3}$보다 커요. [-\\dfrac{1}{2} > -\\dfrac{2}{3}]', '음의 분수끼리의 풀이');
  eq(says(c5).split(' | ')[0] + ' / ' + says(c1).split(' | ')[0], '음수는 0보다 작아요. / 둘 다 음수예요. 절댓값을 비교하면 $5$가 $3$보다 커요.', '0 과 음수 · 음의 정수끼리');
  done('실수 · 풀이 예');
})();
