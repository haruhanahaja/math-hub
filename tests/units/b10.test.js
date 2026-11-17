/* B10 유리수와 순환소수 — 단원 전용 검사.
   답을 만드는 코드와 따로, 화면에 보이는 식만 읽어서 답을 다시 구해 견준다.
   분수 ↔ 소수는 여기서 따로 만든 BigInt 나눗셈으로 계산한다. 엔진의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, noJosa = ALG.noJosa;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var right = function (p, raw) { return /^correct/.test(MH.judge(p, raw).verdict); };
  var gcdB = function (a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { var t = a % b; a = b; b = t; } return a; };
  var ten = function (k) { var x = 1n; while (k-- > 0) x *= 10n; return x; };
  /** 나눗셈 n ÷ d 를 나머지가 되풀이될 때까지 한다: { w, pre, rep } (끝나면 rep 가 '') */
  var divide = function (n, d) {
    n = BigInt(n); d = BigInt(d);
    var w = n / d, r = n % d, seen = {}, digits = '', at = 0;
    while (r !== 0n && seen[r] === undefined) { seen[r] = at++; r *= 10n; digits += String(r / d); r %= d; }
    return r === 0n ? { w: String(w), pre: digits, rep: '' } : { w: String(w), pre: digits.slice(0, seen[r]), rep: digits.slice(seen[r]) };
  };
  var isFinite2 = function (n, d) { return divide(n, d).rep === ''; };
  /** 점을 찍어 쓴 소수 읽기: '1.2\dot{3}4\dot{5}' → { w, pre, rep }. 점을 잘못 찍은 꼴이면 null */
  var readDots = function (tex) {
    var m = /^(\d+)\.((?:\d|\\dot\{\d\})+)$/.exec(tex), digits = '', marks = [], re = /\\dot\{(\d)\}|(\d)/g, t;
    if (!m) return null;
    while ((t = re.exec(m[2]))) { if (t[1] !== undefined) { marks.push(digits.length); digits += t[1]; } else digits += t[2]; }
    if (marks.length === 0) return { w: m[1], pre: digits, rep: '' };
    if (marks.length > 2 || marks[marks.length - 1] !== digits.length - 1) return null;
    return { w: m[1], pre: digits.slice(0, marks[0]), rep: digits.slice(marks[0]) };
  };
  /** 소수의 값: [분자, 분모] (BigInt) */
  var valueOf = function (x) {
    var k = x.pre.length, L = x.rep.length;
    return L ? [BigInt(x.w + x.pre + x.rep) - BigInt(x.w + x.pre), (ten(L) - 1n) * ten(k)] : [BigInt(x.w + x.pre), ten(k)];
  };
  var sameValue = function (a, b) { return a[0] * b[1] === b[0] * a[1]; };
  /** 그 값을 쓰는 표준 꼴(가장 짧은 순환마디, 되풀이가 처음 시작되는 자리) */
  var standard = function (x) { var v = valueOf(x); return divide(v[0], v[1]); };
  var sameForm = function (a, b) { return !!a && !!b && String(a.w) === String(b.w) && a.pre === b.pre && a.rep === b.rep; };
  /** 길게 쓴 순환소수 읽기: '0.1232323\cdots' → 보이는 숫자에 맞는 가장 단순한 { w, pre, rep }. 되풀이가 두 번 넘게 보여야 한다 */
  var readLong = function (tex) {
    var m = /^(\d+)\.(\d+)\\cdots$/.exec(tex), k, L, i, okk;
    if (!m) return null;
    for (k = 0; k < m[2].length; k++) for (L = 1; k + 2 * L <= m[2].length; L++) {
      okk = true;
      for (i = k + L; i < m[2].length; i++) if (m[2].charAt(i) !== m[2].charAt(i - L)) { okk = false; break; }
      if (okk) return { w: m[1], pre: m[2].slice(0, k), rep: m[2].slice(k, k + L), shown: (m[2].length - k) / L };
    }
    return null;
  };
  var fr = function (tex) { var m = /^\\d?frac\{(\d+)\}\{(\d+)\}$/.exec(tex); return m ? [Number(m[1]), Number(m[2])] : null; };
  var texts = function (id, p) { return MH.types[id].hints(p.v, p.ctx).concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.mistakesFor(p).map(function (m) { return m.explain; })); };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx), all = texts(id, p);
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    MH.mistakesFor(p).forEach(function (m) { ok(m.explain.length >= 25, where + '실수 설명이 짧음: ' + m.id); });
    if (p.seed <= 200) noJosa(all, where);
    /* 숫자 바로 뒤에 오는 조사: 받침이 있는 숫자(0 1 3 6 7 8) 뒤에는 '은 · 이 · 을 · 과 · 이에요', 다만 ㄹ 받침(1 7 8) 뒤에는 '으로' 가 아니라 '로' */
    if (p.seed <= 300) all.forEach(function (t) {
      var re = /(\d)\$?(이에요|예요|은 |는 |이 |가 |을 |를 |과 |와 |으로 |로 )/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
    });
  };
  var choiceOk = function (p, where) {
    var opts = MH.optionsOf(p);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i; }), where + '보기 4개가 서로 달라야 함: ' + opts.join(' | '));
    ok(opts.indexOf(p.answer) >= 0, where + '보기에 정답이 없음');
    ok(MH.mistakesFor(p).length === 3, where + '틀린 보기 셋에 모두 설명이 있어야 함');
    return opts;
  };
  var idsOf = function (p, bag) { MH.mistakesFor(p).forEach(function (m) { bag[m.id] = 1; }); };

  group('B10 — 나눗셈 · 점 읽기 자체 검사');
  var show = function (x) { return x ? x.w + '.' + x.pre + '(' + x.rep + ')' : 'null'; };
  eq([show(divide(1, 3)), show(divide(1, 6)), show(divide(3, 8)), show(divide(14, 11)), show(divide(1, 7)), show(divide(1, 22))].join(' '), '0.(3) 0.1(6) 0.375() 1.(27) 0.(142857) 0.0(45)', '나눗셈');
  eq([show(readDots('0.\\dot{3}')), show(readDots('1.2\\dot{3}4\\dot{5}')), show(readDots('0.25')), show(readDots('0.\\dot{2}7')), show(readDots('0.\\dot{1}\\dot{2}\\dot{3}'))].join(' '), '0.(3) 1.2(345) 0.25() null null', '점 읽기');
  eq([show(readLong('0.272727\\cdots')), show(readLong('1.33333\\cdots')), show(readLong('0.1232323\\cdots')), show(readLong('2.50777\\cdots'))].join(' '), '0.(27) 1.(3) 0.1(23) 2.50(7)', '길게 쓴 소수 읽기');
  ok(sameValue(valueOf(readDots('0.1\\dot{6}')), [1n, 6n]) && sameValue(valueOf(readDots('1.\\dot{2}\\dot{7}')), [14n, 11n]) && sameForm(standard(readDots('0.2\\dot{7}\\dot{2}')), readDots('0.\\dot{2}\\dot{7}')), '값 · 표준 꼴');
  done('도구');

  group('B10 — 유한소수 판별: 나눗셈을 해 본 결과와 답이 맞는가 (단계마다 1,000문제)');
  var bag = {};
  each('B10.finite', function (p, pr, level, where) {
    var opts = choiceOk(p, where), fin = /유한소수로 나타낼 수 있는 분수를 고르세요/.test(pr.text), inf = /순환소수가 되는 분수/.test(pr.text), fs = opts.map(fr), good;
    idsOf(p, bag);
    ok(fin !== inf && (level === 2) === inf, where + '문제 글: ' + pr.text);
    ok(fs.every(Boolean) && pr.tex === opts.join(',\\quad ').replace(/\\frac/g, '\\dfrac') && opts.every(function (o) { return /^\\frac/.test(o); }), where + '문제에 보이는 분수와 보기가 다름');
    if (!fs.every(Boolean)) return;
    good = opts.filter(function (o, i) { return isFinite2(fs[i][0], fs[i][1]) === fin; });
    ok(good.length === 1 && good[0] === p.answer, where + opts.join(' | ') + ' → ' + p.answer);
    ok(fs.every(function (f) { return f[0] < f[1] && f[1] <= 90; }), where + '분수가 너무 큼');
    var a = fr(p.answer), red = fs.filter(function (f) { return MH.gcd(f[0], f[1]) === 1; }).length;
    ok(level === 0 ? red === 4 : level === 1 ? MH.gcd(a[0], a[1]) > 1 : red < 4, where + '약분 조건');
    var st = MH.types['B10.finite'].steps(p.v);
    ok(st.length === 5 && st[4].tex === p.answer, where + '풀이는 보기 넷을 차례로 살피고 정답으로 끝난다');
    detailed('B10.finite', p, where);
  });
  eq(Object.keys(bag).sort().join(' '), 'cancels no-2-5 pow2 two-five with-2 with-5', '틀린 보기의 종류');
  done('유한소수 판별');

  group('B10 — 유한소수가 되게 하는 수: 1부터 넣어 보며 찾은 수와 답이 맞는가 (단계마다 1,000문제)');
  bag = {};
  var big = 0;
  each('B10.make', function (p, pr, level, where) {
    var m, f, k, least = 0, isTen = function (x) { while (x % 10 === 0) x /= 10; return x === 1; };
    idsOf(p, bag);
    if (level === 0) {
      f = fr(pr.tex);
      ok(!!f && /10의 거듭제곱/.test(pr.text) && MH.gcd(f[0], f[1]) === 1, where + '문제: ' + pr.tex);
      for (k = 1; k <= 2000 && !least; k++) if (isTen(f[1] * k)) least = k;
    } else {
      m = /^(\\dfrac\{\d+\}\{\d+\}) \\times a$/.exec(pr.tex); f = m && fr(m[1]);
      ok(!!f && /가장 작은 자연수 \$a\$/.test(pr.text) && f[0] < f[1] && (level === 1 ? MH.gcd(f[0], f[1]) === 1 : MH.gcd(f[0], f[1]) > 1), where + '문제: ' + pr.tex);
      for (k = 1; k <= f[1] && !least; k++) if (isFinite2(f[0] * k, f[1])) least = k;
    }
    ok(least === p.answer && p.answer >= 2, where + pr.tex + ' → ' + p.answer + ' (찾은 수 ' + least + ')');
    if (p.answer > 19) big++;
    if (p.seed <= 100) { ok(right(p, String(p.answer)), where + '정답 판정'); ok(!right(p, String(p.answer * 2)), where + '더 큰 수는 오답(가장 작은 수가 아니다)'); }
    detailed('B10.make', p, where);
  });
  eq(Object.keys(bag).sort().join(' '), 'cancelled new-den new-num no-reduce other-prime part-only two-five whole-den', '실수의 종류');
  ok(big >= 100, '답이 20 이상인 문제도 나와야 함(' + big + '개)');
  done('유한소수가 되게 하는 수');

  group('B10 — 순환마디와 자리의 숫자: 숫자를 직접 늘어놓아 본 결과와 답이 맞는가 (단계마다 1,000문제)');
  bag = {};
  var zeroRem = 0;
  each('B10.cycle', function (p, pr, level, where) {
    var x, m, s;
    idsOf(p, bag);
    if (level === 0) {
      x = readLong(pr.tex);
      ok(!!x && x.shown >= 3 && sameForm(standard(x), x), where + '순환소수를 읽을 수 없거나 되풀이가 덜 보임: ' + pr.tex);
      ok(!!x && String(p.answer) === x.rep, where + pr.tex + ' → ' + p.answer);
    } else {
      x = readDots(pr.tex); m = /소수점 아래 (\d+)번째 자리의 숫자/.exec(pr.text);
      ok(!!x && !!m && x.rep.length >= 2 && sameForm(standard(x), x) && (level === 2) === (x.pre.length > 0), where + '문제: ' + pr.tex + ' ' + pr.text);
      if (!x || !m) return;
      s = x.pre; while (s.length < Number(m[1])) s += x.rep;
      ok(String(p.answer) === s.charAt(Number(m[1]) - 1), where + pr.tex + ' ' + m[1] + '번째 → ' + p.answer);
      if ((Number(m[1]) - x.pre.length) % x.rep.length === 0) zeroRem++;
    }
    detailed('B10.cycle', p, where);
  });
  eq(Object.keys(bag).sort().join(' '), 'first-only ignore-pre off-one remainder shifted twice with-pre with-whole zero-first', '실수의 종류');
  ok(zeroRem >= 200, '나누어떨어지는 문제도 나와야 함(' + zeroRem + '개)');
  done('순환마디와 자리의 숫자');

  group('B10 — 순환소수의 표현: 정답만 값이 같고 표준 꼴인가 (단계마다 1,000문제)');
  bag = {};
  each('B10.dots', function (p, pr, level, where) {
    var opts = choiceOk(p, where), target, v, a = readDots(p.answer), good;
    idsOf(p, bag);
    if (level < 2) {
      target = readLong(pr.tex);
      ok(!!target && target.shown >= 3 && (level === 1) === (target.pre.length > 0), where + '문제: ' + pr.tex);
    } else {
      v = fr(pr.tex);
      ok(!!v && MH.gcd(v[0], v[1]) === 1 && v[0] < v[1], where + '문제: ' + pr.tex);
      target = v && divide(v[0], v[1]);
    }
    if (!target) return;
    ok(target.rep !== '' && sameForm(a, target), where + pr.tex + ' → ' + p.answer);
    /* 값이 같으면서 표준 꼴인 보기는 정답 하나뿐이다 */
    good = opts.filter(function (o) { var x = readDots(o); return !!x && sameValue(valueOf(x), valueOf(target)) && sameForm(standard(x), x); });
    ok(good.length === 1 && good[0] === p.answer, where + '맞는 보기: ' + good.join(' | '));
    /* 분수를 소수로 고치는 문제에서는 값이 같은 다른 보기를 내지 않는다 */
    if (level === 2) ok(opts.every(function (o) { var x = readDots(o); return o === p.answer || (!!x && !sameValue(valueOf(x), valueOf(target))); }), where + '값이 같은 틀린 보기: ' + opts.join(' | '));
    var st = MH.types['B10.dots'].steps(p.v);
    ok(st[st.length - 1].tex === p.answer, where + '풀이의 마지막 줄은 정답');
    detailed('B10.dots', p, where);
  });
  eq(Object.keys(bag).sort().join(' '), 'all-dots first-only last-only no-dot pre-dropped reversed shifted twice with-pre', '틀린 보기의 종류');
  done('순환소수의 표현');

  group('B10 — 순환소수를 분수로: 따로 구한 값과 답이 맞는가 (단계마다 1,000문제)');
  bag = {};
  var reducible = 0, improper = 0;
  each('B10.tofrac', function (p, pr, level, where) {
    var x = readDots(pr.tex), v, a = p.answer, st = MH.types['B10.tofrac'].steps(p.v), last = st[st.length - 1];
    idsOf(p, bag);
    ok(!!x && x.rep !== '' && sameForm(standard(x), x), where + '문제: ' + pr.tex);
    if (!x) return;
    ok(level === 0 ? x.w === '0' && !x.pre : level === 1 ? x.w !== '0' && !x.pre : x.pre.length >= 1, where + '단계에 맞지 않는 수: ' + pr.tex);
    v = valueOf(x);
    ok(sameValue(v, [BigInt(a.n), BigInt(a.d)]) && MH.gcd(a.n, a.d) === 1, where + pr.tex + ' → ' + a.n + '/' + a.d);
    ok((a.n > a.d) === /가분수로 써요/.test(pr.text), where + '가분수 안내');
    if (a.n > a.d) improper++;
    /* 풀이: 빼서 만든 식 (수)x = (수) 가 값과 맞고, 마지막 줄이 답으로 끝난다 */
    var lin = st.map(function (s) { return /^(\d+)x = (\d+)$/.exec(s.tex || ''); }).filter(Boolean)[0];
    ok(!!lin && sameValue(v, [BigInt(lin[2]), BigInt(lin[1])]), where + '풀이의 식');
    ok(new RegExp('= ' + (a.d === 1 ? a.n : '\\\\dfrac\\{' + a.n + '\\}\\{' + a.d + '\\}') + '$').test(last.tex), where + '풀이의 마지막 줄: ' + last.tex);
    if (lin && MH.gcd(Number(lin[1]), Number(lin[2])) > 1) reducible++;
    /* 판정: 약분하지 않은 답은 정답이고 약분을 알려 준다. 유한소수처럼 쓴 답은 오답 */
    if (p.seed <= 150) {
      var j = MH.judge(p, (a.n * 2) + ',' + (a.d * 2));
      ok(j.verdict === 'correct-note' && /약분/.test(j.note), where + '약분 안 한 답: ' + JSON.stringify(j));
      ok(right(p, a.n + ',' + a.d) && MH.judge(p, a.n + ',' + a.d).verdict === 'correct', where + '정답 판정');
    }
    MH.mistakesFor(p).forEach(function (m) { ok(!sameValue(v, [BigInt(m.value.n), BigInt(m.value.d)]), where + '실수 ' + m.id + ' 의 값이 정답과 같음'); });
    detailed('B10.tofrac', p, where);
  });
  eq(Object.keys(bag).sort().join(' '), 'all-nines as-finite frac-only no-subtract sub-whole wrong-nines', '실수의 종류');
  ok(reducible >= 600 && improper >= 900, '약분이 되는 문제 ' + reducible + '개, 가분수 답 ' + improper + '개');
  done('순환소수를 분수로');

  group('B10 — 흔한 실수와 풀이 · 힌트의 구체적인 예');
  var find = function (id, level, test) { for (var seed = 1; seed <= 6000; seed++) { var p = MH.makeProblem(id, level, seed); if (test(MH.types[id].prompt(p.v, p.ctx), p)) return p; } return null; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var p1 = find('B10.tofrac', 0, function (pr) { return pr.tex === '0.\\dot{2}\\dot{7}'; });
  ok(!!p1 && p1.answer.n === 3 && p1.answer.d === 11, '0.(27) = 3/11');
  eq(p1 && [J(p1, '3,11'), J(p1, '27,99'), J(p1, '27,100'), J(p1, '27,9')].join(' '), 'correct:- correct-note:- wrong:as-finite wrong:wrong-nines', '0.(27) 의 판정');
  var p2 = find('B10.tofrac', 1, function (pr) { return pr.tex === '1.\\dot{2}'; });
  eq(p2 && [p2.answer.n + '/' + p2.answer.d, J(p2, '11,9'), J(p2, '12,9'), J(p2, '2,9'), J(p2, '12,10')].join(' '), '11/9 correct:- wrong:no-subtract wrong:frac-only wrong:as-finite', '1.(2) 의 판정');
  var p3 = find('B10.tofrac', 2, function (pr) { return pr.tex === '0.1\\dot{6}'; });
  eq(p3 && [p3.answer.n + '/' + p3.answer.d, J(p3, '15,90'), J(p3, '16,90'), J(p3, '15,99'), J(p3, '16,100')].join(' '), '1/6 correct-note:- wrong:no-subtract wrong:all-nines wrong:as-finite', '0.1(6) 의 판정');
  var p4 = find('B10.make', 0, function (pr) { return pr.tex === '\\dfrac{7}{20}'; });
  eq(p4 && [p4.answer, J(p4, '5'), J(p4, '2'), J(p4, '100'), J(p4, '35')].join(' '), '5 correct:- wrong:other-prime wrong:new-den wrong:new-num', '7/20 의 분모를 100 으로');
  var p5 = find('B10.make', 1, function (pr) { return pr.tex === '\\dfrac{7}{60} \\times a'; });
  eq(p5 && [p5.answer, J(p5, '3'), J(p5, '60'), J(p5, '20')].join(' '), '3 correct:- wrong:whole-den wrong:two-five', '7/60 × a');
  var p6 = find('B10.make', 2, function (pr) { return pr.tex === '\\dfrac{3}{90} \\times a'; });
  eq(p6 && [p6.answer, J(p6, '3'), J(p6, '9'), J(p6, '90')].join(' '), '3 correct:- wrong:no-reduce wrong:whole-den', '3/90 × a (약분하면 1/30)');
  var p7 = find('B10.cycle', 1, function (pr) { return /^0\.\\dot\{1\}4285\\dot\{7\}$/.test(pr.tex) || (readDots(pr.tex).rep.length === 3 && / 30번째/.test(pr.text)); });
  ok(!!p7, '자리의 숫자 예');
  var p8 = find('B10.dots', 2, function (pr) { return pr.tex === '\\dfrac{5}{6}'; });
  ok(!!p8 && p8.answer === '0.8\\dot{3}' && MH.optionsOf(p8).slice().sort().join(' ') === ['0.8\\dot{3}', '0.83', '0.\\dot{8}\\dot{3}', '0.\\dot{3}'].sort().join(' '), '5/6 = 0.8(3) 과 틀린 보기');
  var p9 = find('B10.dots', 2, function (pr) { return pr.tex === '\\dfrac{2}{11}'; });
  ok(!!p9 && p9.answer === '0.\\dot{1}\\dot{8}', '2/11 = 0.(18)');
  done('실수 · 풀이 · 힌트 예');
})();
