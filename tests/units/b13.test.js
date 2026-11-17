/* B13 일차부등식 — 단원 전용 검사.
   화면에 보이는 부등식을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽고, 수를 하나하나 넣어 본 참 · 거짓으로 답을 확인한다.
   (범위 문제는 −45 ~ 45 를 반 칸씩, 정수 문제는 정수를 모두 넣어 본다.) 단원 파일의 풀이 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, noJosa = ALG.noJosa, Q = ALG.Q, calc = ALG.calc;
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
  /* ── 부등식 읽기 ── */
  var REL = / (<|>|\\leq|\\geq|=) /;
  var cmp = function (a, b) { var x = a.n * b.d - b.n * a.d; return x < 0n ? -1 : x > 0n ? 1 : 0; };
  var relOk = function (op, c) { return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '\\leq' ? c <= 0 : op === '\\geq' ? c >= 0 : c === 0; };
  /** 부등식(글)에 문자의 값을 넣으면 참인가 */
  var truth = function (tex, env) { var m = tex.split(REL); if (m.length !== 3) throw new Error('부등식이 아님: ' + tex); return relOk(m[1], cmp(calc(m[0], env), calc(m[2], env))); };
  /** −45 ~ 45 를 반 칸씩 넣어 본 참 · 거짓을 이어 쓴 글(해가 같은 부등식이면 같은 글) */
  var GRID = []; for (var g = -90; g <= 90; g++) GRID.push(Q(BigInt(g), 2n));
  var sol = function (tex) { try { return GRID.map(function (x) { return truth(tex, { x: x }) ? '1' : '0'; }).join(''); } catch (e) { return null; } };
  var ints = function (tex, lo, hi) { var out = []; for (var x = lo; x <= hi; x++) if (truth(tex, { x: Q(BigInt(x), 1n) })) out.push(x); return out; };

  group('B13 — 검사 도구 자체 검사');
  ok(sol('3x + 2 \\leq 5x - 6') === sol('x \\geq 4') && sol('-3x < 12') === sol('x > -4') && sol('\\dfrac{x}{2} - 1 < \\dfrac{x + 1}{3}') === sol('x < 8') && sol('0.3x + 1 > 0.5x - 0.2') === sol('x < 6'), '해가 같은 부등식');
  ok(sol('-3x < 12') !== sol('x < -4') && sol('x > 3') !== sol('x \\geq 3') && sol('2(x - 3) \\geq 5x + 6') === sol('x \\leq -4') && sol('?') === null, '해가 다른 부등식');
  eq(ints('2x - 10 \\leq -3', 1, 80).join(','), '1,2,3', '자연수인 해');
  done('도구');

  group('B13 — 부등식의 성질: 조건에 맞는 수를 모두 넣어 본다 (단계마다 1,000문제)');
  var bag = {}, answers = {};
  each('B13.prop', function (p, pr, level, where) {
    var given = /^\$(.+)\$일 때, □ 안에 알맞은 부등호를 고르세요\.$/.exec(pr.text), opts = MH.optionsOf(p), parts = pr.tex.split(' \\;\\square\\; ');
    ok(!!given && parts.length === 2 && opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && /^(<|>|=|\\leq|\\geq)$/.test(o); }), where + '문제의 모양: ' + pr.text + ' / ' + pr.tex);
    var letters = given[1].replace(/\\[a-z]+/g, '').match(/[a-z]/g).filter(function (c, i, a) { return a.indexOf(c) === i; }), pairs = [], u, v, env;
    eq(letters.length, 2, where + '문자는 둘');
    for (u = -4; u <= 4; u++) for (v = -4; v <= 4; v++) { env = {}; env[letters[0]] = Q(BigInt(u), 1n); env[letters[1]] = Q(BigInt(v), 1n); if (truth(given[1], env)) pairs.push(env); }
    var always = function (o) { return pairs.every(function (e) { return truth(parts[0] + ' ' + o + ' ' + parts[1], e); }); };
    ok(pairs.length >= 20 && always(p.answer), where + given[1] + ' 이면 ' + parts[0] + ' ' + p.answer + ' ' + parts[1]);
    ok(opts.every(function (o) { return o === p.answer || !always(o); }), where + '틀린 보기도 늘 참임: ' + opts.join(' '));
    /* 풀이: 줄마다 조건에 맞는 모든 수에서 참이고, 마지막 줄은 답을 넣은 식이다 */
    var st = MH.types['B13.prop'].steps(p.v);
    ok(st.every(function (s) { return pairs.every(function (e) { return truth(s.tex, e); }); }), where + '풀이에 참이 아닌 줄이 있음');
    ok(st.length === (level === 2 ? 3 : 2) && st[st.length - 1].tex === parts[0] + ' ' + p.answer + ' ' + parts[1] && st[0].tex === given[1], where + '풀이의 처음과 끝');
    ok(level === 2 || /^[a-z] /.test(given[1]), where + '1 · 2단계는 문자의 대소가 조건');
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    answers[p.answer] = 1;
    eq(MH.mistakesFor(p).length, 3, where + '틀린 보기마다 설명');
    /* 음수를 곱하거나 나눈 문제(조건과 답의 방향이 다르다)에서 방향을 안 바꾼 보기는 not-flipped */
    var gOp = given[1].split(REL)[1], turned = /[<l]/.test(gOp) !== /[<l]/.test(p.answer);
    eq(!!wrongOf(p, 'not-flipped'), turned, where + '방향이 바뀌는 문제에만 not-flipped');
    if (wrongOf(p, 'not-flipped')) eq(wrongOf(p, 'not-flipped'), gOp, where + '방향을 안 바꾼 보기');
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed('B13.prop', p, where);
  });
  eq(Object.keys(bag).sort().join(' '), 'both equal flipped not-flipped strict', '실수의 종류');
  eq(Object.keys(answers).sort().join(' '), '< > \\geq \\leq', '네 부등호가 모두 답으로 나온다');
  done('부등식의 성질');

  group('B13 — 부등식과 해 (단계마다 1,000문제)');
  var PH = { '이상이다': '\\geq', '이하이다': '\\leq', '보다 크다': '>', '보다 작다': '<', '초과이다': '>', '미만이다': '<', '보다 크지 않다': '\\leq', '보다 작지 않다': '\\geq' }, seenPh = {};
  bag = {};
  each('B13.sol', function (p, pr, level, where) {
    var opts = MH.optionsOf(p), m;
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i; }) && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    if (level === 0) {
      var f = pr.figure, r = f && f.ray;
      ok(!!r && f.type === 'line' && f.parts === 1 && f.max - f.min === 8 && r.at >= 1 && r.at <= 7, where + '그림: ' + JSON.stringify(f));
      eq(p.answer, 'x ' + (r.dir > 0 ? (r.open ? '>' : '\\geq') : (r.open ? '<' : '\\leq')) + ' ' + (f.min + r.at), where + '수직선 읽기');
      ok(opts.map(function (o) { return o.replace(/^x \S+ /, ''); }).every(function (k) { return k === String(f.min + r.at); }) && opts.map(sol).every(function (s, i, a) { return a.indexOf(s) === i; }), where + '보기는 같은 경계의 네 범위');
    } else if (level === 1) {
      var good = opts.filter(function (o) { return truth(pr.tex, { x: Q(BigInt(o), 1n) }); });
      ok(opts.every(function (o) { return /^-?\d+$/.test(o); }) && good.length === 1 && good[0] === p.answer, where + pr.tex + ' 의 해는 보기 가운데 하나뿐: ' + opts.join(', ') + ' → ' + p.answer);
      if (wrongOf(p, 'boundary-value')) ok(/ [<>] /.test(pr.tex) && sol(pr.tex.replace(' < ', ' \\leq ').replace(' > ', ' \\geq ')) !== null && truth(pr.tex.replace(' < ', ' = ').replace(' > ', ' = '), { x: Q(BigInt(wrongOf(p, 'boundary-value')), 1n) }), where + '경계의 수는 양쪽을 같게 만든다');
      var st = MH.types['B13.sol'].steps(p.v);
      ok(truth(st[0].tex, {}) && truth(st[1].tex, {}), where + '풀이의 계산: ' + st[0].tex + ' / ' + st[1].tex);
    } else {
      m = /^어떤 수 \$x\$(?:의 (\d+)배에 (\d+)[을를] 더한 수는|의 (\d+)배에서 (\d+)[을를] 뺀 수는|에 (\d+)[을를] 더한 다음 (\d+)배 한 수는) (\d+) ?(\S+(?: \S+){0,2})\. 이것을 부등식으로 나타낸 것을 고르세요\.$/.exec(pr.text);
      ok(!!m && PH[m[8]] !== undefined, where + '문장: ' + pr.text);
      if (m) {
        seenPh[m[8]] = 1;
        eq(p.answer, (m[1] ? m[1] + 'x + ' + m[2] : m[3] ? m[3] + 'x - ' + m[4] : m[6] + '(x + ' + m[5] + ')') + ' ' + PH[m[8]] + ' ' + m[7], where + pr.text);
        ok(opts.map(function (o) { return o.split(REL)[0] + '|' + o.split(REL)[2]; }).every(function (s, i, a) { return s === a[0]; }), where + '보기는 부등호만 다르다');
      }
    }
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed('B13.sol', p, where);
  });
  eq(Object.keys(seenPh).length, 8, '여덟 가지 끝말이 모두 나온다');
  eq(Object.keys(bag).sort().join(' '), 'both boundary boundary-value direction not-solution-1 not-solution-2 not-solution-3', '실수의 종류');
  done('부등식과 해');

  group('B13 — 부등식의 풀이: 수를 넣어 본 해와 답의 범위가 같은가 (유형 · 단계마다 1,000문제)');
  var SHAPE = {
    'B13.basic': [/^(x [+-] \d+|-?\d*x) \S+ -?\d+$/, /^-?\d*x [+-] \d+ \S+ -?\d+$/, /x.* (<|>|\\leq|\\geq) .*x/],
    'B13.paren': [/\(/, /dfrac/, /\d\.\d/]
  };
  Object.keys(SHAPE).forEach(function (id) {
    var def = MH.types[id], seen = {}, flips = 0;
    each(id, function (p, pr, level, where) {
      var opts = MH.optionsOf(p), a = sol(p.answer), st = def.steps(p.v);
      MH.mistakesFor(p).forEach(function (x) { seen[x.id] = 1; });
      ok(opts.length === 4 && MH.mistakesFor(p).length === 3 && opts.every(function (o) { return /^x (<|>|\\leq|\\geq) -?\d+$/.test(o); }), where + '보기: ' + opts.join(' | '));
      ok(SHAPE[id][level].test(pr.tex), where + '단계에 맞지 않는 식: ' + pr.tex);
      ok(a !== null && sol(pr.tex) === a && /0/.test(a) && /1/.test(a), where + pr.tex + ' → ' + p.answer);
      ok(opts.map(sol).every(function (s, i, arr) { return arr.indexOf(s) === i; }), where + '해가 같은 보기가 있음: ' + opts.join(' | '));
      /* 풀이: 모든 줄이 원래 부등식과 해가 같다. 마지막 줄은 답이다 */
      st.forEach(function (s, i) { ok(sol(s.tex) === a, where + '풀이 ' + (i + 1) + '째 줄의 해가 다름: ' + s.tex); });
      ok(st.length >= 2 && st[st.length - 1].tex === p.answer, where + '풀이의 마지막 줄');
      /* 방향을 안 바꾼(또는 괜히 바꾼) 보기는 경계는 같고 방향만 반대다 */
      var w = wrongOf(p, 'not-flipped') || wrongOf(p, 'flipped'), flipT = { '<': '>', '>': '<', '\\leq': '\\geq', '\\geq': '\\leq' };
      ok(!!w && w === p.answer.replace(/^x (\S+)/, function (t, o) { return 'x ' + flipT[o]; }), where + '방향만 반대인 보기');
      /* not-flipped 는 풀이에 '음수로 나누는' 줄이 있을 때만 */
      var negDiv = st.some(function (s) { return /음수로 나누면/.test(s.say); });
      eq(!!wrongOf(p, 'not-flipped'), negDiv, where + 'not-flipped 와 음수로 나누는 풀이');
      if (negDiv) flips++;
      if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
      detailed(id, p, where);
    });
    eq(Object.keys(seen).sort().join(' '), 'flipped move-sign move-sign-flip not-flipped value-sign value-sign-flip', id + ': 실수의 종류');
    ok(flips >= 900 && flips <= 2100, id + ': 방향이 바뀌는 문제 ' + flips + ' / 3000');
    done(def.title);
  });

  group('B13 — 정수인 해 · 상수 구하기: 정수를 모두 넣어 본다 (단계마다 1,000문제)');
  bag = {};
  each('B13.count', function (p, pr, level, where) {
    var n = p.answer.n, xs, m, st = MH.types['B13.count'].steps(p.v);
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; ok(x.value.n !== n, where + '실수 ' + x.id + ' 의 값이 정답과 같음'); });
    ok(p.answer.p === 0, where + '답은 정수');
    if (level === 0) {
      xs = ints(pr.tex, -100, 100);
      m = /가장 (큰|작은) 정수 \$x\$의 값을 구하세요\.$/.exec(pr.text);
      ok(!!m && xs.length > 0 && xs.length < 201, where + pr.text);
      if (m) { eq(n, m[1] === '큰' ? xs[xs.length - 1] : xs[0], where + pr.tex + ' ' + pr.text); ok(m[1] === '큰' ? xs[0] === -100 : xs[xs.length - 1] === 100, where + '반대쪽은 끝이 없다'); }
    } else if (level === 1) {
      xs = ints(pr.tex, 1, 100);
      ok(/자연수 \$x\$는 모두 몇 개인지 구하세요\.$/.test(pr.text) && xs.length >= 1 && xs.length <= 12 && xs[xs.length - 1] === xs.length, where + pr.text + ' ' + xs.join(','));
      eq(n, xs.length, where + pr.tex + ' 의 자연수인 해의 개수');
    } else {
      m = /해가 \$(x \S+ -?\d+)\$일 때, 상수 \$a\$의 값을 구하세요\.$/.exec(pr.text);
      ok(!!m && /^\dx [+-] a \S+ -?\d+$/.test(pr.tex), where + pr.tex + ' ' + pr.text);
      if (m) {
        eq(sol(pr.tex.replace(' a ', ' (' + n + ') ')), sol(m[1]), where + 'a = ' + n + ' 을 넣은 부등식의 해');
        ok(sol(pr.tex.replace(' a ', ' (' + (n + Number(pr.tex[0])) + ') ')) !== sol(m[1]), where + 'a 가 다르면 해가 다르다');
      }
    }
    if (level < 2) st.slice(0, level === 0 ? -1 : -2).forEach(function (s, i) { ok(sol(s.tex) === sol(pr.tex), where + '풀이 ' + (i + 1) + '째 줄의 해가 다름: ' + s.tex); });
    ok(st.length >= 2 && new RegExp('(^|= )' + String(n).replace('-', '\\-') + '$').test(st[st.length - 1].tex), where + '풀이의 마지막 줄: ' + st[st.length - 1].tex);
    if (p.seed <= 100) { eq(J(p, String(n)), 'correct:-', where + '정답 판정'); eq(MH.judge(p, String(n + 1)).verdict, 'wrong', where + '오답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(MH.judge(p, String(x.value.n)).verdict, 'wrong', where + '실수 값 판정'); }); }
    detailed('B13.count', p, where);
  });
  eq(Object.keys(bag).sort().join(' '), 'boundary-excluded boundary-included move-sign not-divided not-flipped rounded-wrong zero-counted', '실수의 종류');
  done('정수인 해 · 상수 구하기');

  group('B13 — 부등식의 활용: 문제 글에서 수를 읽어 직접 세어 본다 (단계마다 1,000문제)');
  var num = function (t) { return Number(t.replace(/,/g, '')); }, kinds = [{}, {}, {}];
  bag = {};
  each('B13.word', function (p, pr, level, where) {
    var t = pr.text, m, cond, wantMax, x, best = null, kind;
    if ((m = /^한 \S+에 ([\d,]+)원인 \S+ ([\d,]+)원짜리 .+ 전체 금액이 ([\d,]+)원 이하가 되게 하려면 \S+ 최대 몇 \S+까지/.exec(t))) { kind = 'buy'; wantMax = true; cond = function (x) { return num(m[1]) * x + num(m[2]) <= num(m[3]); }; }
    else if ((m = /^수학 시험을 두 번 봐서 (\d+)점과 (\d+)점을 받았어요\. 세 번의 시험 점수의 평균이 (\d+)점 이상이 되려면, 세 번째 시험에서 몇 점 이상/.exec(t))) { kind = 'avg'; wantMax = false; cond = function (x) { return (num(m[1]) + num(m[2]) + x) >= 3 * num(m[3]); }; }
    else if ((m = /^집 앞 가게에서는 \S+ 한 \S+ ([\d,]+)원이고, 할인점에서는 ([\d,]+)원이에요\. .*왕복 교통비 ([\d,]+)원이 들어요\. \S+ 몇 \S+ 이상 살 때 할인점에서 사는 것이 유리한지/.exec(t))) { kind = 'better'; wantMax = false; cond = function (x) { return num(m[1]) * x > num(m[2]) * x + num(m[3]); }; }
    else if ((m = /^지금 형의 통장에는 ([\d,]+)원, 동생의 통장에는 ([\d,]+)원이 들어 있어요\. 다음 달부터 매달 형은 ([\d,]+)원씩, 동생은 ([\d,]+)원씩 저금해요\. 동생의 예금액이 형의 예금액보다 많아지는 것은 몇 개월 후부터/.exec(t))) { kind = 'save'; wantMax = false; cond = function (x) { return num(m[2]) + num(m[4]) * x > num(m[1]) + num(m[3]) * x; }; }
    else if ((m = /^등산을 하는데 올라갈 때는 시속 (\d+) km로 걷고, 내려올 때는 같은 길을 시속 (\d+) km로 걸어요\. 전체 걸리는 시간을 (\d+)시간 이내로 하려면 최대 몇 km 지점까지/.exec(t))) { kind = 'dist'; wantMax = true; cond = function (x) { return x * (num(m[1]) + num(m[2])) <= num(m[3]) * num(m[1]) * num(m[2]); }; }
    ok(!!kind && !pr.tex, where + '문제 글: ' + t);
    if (!kind) return;
    kinds[level][kind] = 1;
    for (x = 1; x <= 400; x++) if (cond(x)) { if (wantMax) best = x; else { best = x; break; } }
    eq(p.answer, best, where + t);
    ok(wantMax ? !cond(best + 1) : best === 1 || !cond(best - 1), where + '한 걸음 더 간 수는 조건에 맞지 않는다');
    ok(/구하세요\.$/.test(t) && !/을를|이가|\d원\d/.test(t), where + '문제 글의 끝');
    eq(MH.types['B13.word'].answer.suffix(p.v), { buy: /최대 몇 (\S+)까지/.exec(t) ? /최대 몇 (\S+)까지/.exec(t)[1] : '', avg: '점', better: (/몇 (\S+) 이상 살/.exec(t) || [])[1], save: '개월', dist: 'km' }[kind], where + '단위');
    /* 풀이: 세운 부등식에서 수를 넣어 본 결과가 문제의 조건과 같다. 그 뒤의 줄은 해가 같다 */
    var st = MH.types['B13.word'].steps(p.v), s0 = sol(st[0].tex);
    ok([best - 1, best, best + 1].every(function (v) { return truth(st[0].tex, { x: Q(BigInt(v), 1n) }) === cond(v); }), where + '세운 부등식이 조건과 다름: ' + st[0].tex);
    st.slice(1, -1).forEach(function (s, i) { ok(sol(s.tex) === s0, where + '풀이 ' + (i + 2) + '째 줄의 해가 다름: ' + s.tex); });
    eq(st[st.length - 1].tex, 'x = ' + best, where + '풀이의 마지막 줄');
    MH.mistakesFor(p).forEach(function (w) { bag[w.id] = 1; ok(w.value !== best && w.value >= 0, where + '실수 ' + w.id + ' 의 값'); });
    if (p.seed <= 100) { eq(J(p, String(best)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (w) { eq(J(p, String(w.value)), 'wrong:' + w.id, where + '실수 판정 ' + w.id); }); }
    detailed('B13.word', p, where);
  });
  eq(kinds.map(function (k) { return Object.keys(k).sort().join(' '); }).join(' / '), 'buy / avg better / dist save', '단계마다 나오는 상황');
  eq(Object.keys(bag).sort().join(' '), 'avg-two boundary-included fee-ignored rounded-down rounded-up speed-added target-only up-only', '실수의 종류');
  done('부등식의 활용');

  group('B13 — 구체적인 예');
  var find = function (id, level, test) { for (var seed = 1; seed <= 6000; seed++) { var p = MH.makeProblem(id, level, seed); if (test(MH.types[id].prompt(p.v, p.ctx), p)) return p; } return null; };
  var p1 = find('B13.basic', 0, function (pr) { return pr.tex === '-3x < 12'; });
  ok(!!p1 && p1.answer === 'x > -4' && wrongOf(p1, 'not-flipped') === 'x < -4', '−3x < 12 → x > −4');
  var p2 = find('B13.basic', 0, function (pr) { return /^x \+ 3 > 5$/.test(pr.tex); });
  ok(!p2 || (p2.answer === 'x > 2' && wrongOf(p2, 'move-sign') === 'x > 8'), 'x + 3 > 5 → x > 2 (이항 부호를 안 바꾸면 x > 8)');
  var p3 = find('B13.prop', 1, function (pr) { return pr.text.indexOf('$a < b$') === 0 && pr.tex === '-2a \\;\\square\\; -2b'; });
  ok(!!p3 && p3.answer === '>' && MH.optionsOf(p3).indexOf('=') >= 0, 'a < b 이면 −2a > −2b');
  var p4 = find('B13.count', 0, function (pr, p) { return / < /.test(pr.tex) && /큰/.test(pr.text) && !!wrongOf(p, 'boundary-included'); });
  ok(!!p4 && wrongOf(p4, 'boundary-included').n === p4.answer.n + 1, '등호가 없으면 경계보다 하나 작은 정수');
  var p5 = find('B13.word', 0, function (pr, p) { return !!wrongOf(p, 'rounded-up'); });
  ok(!!p5 && wrongOf(p5, 'rounded-up') === p5.answer + 1, '최대 개수: 올림한 수는 틀린 답');
  done('예');
})();
