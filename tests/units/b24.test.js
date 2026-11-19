/* B24 닮음과 피타고라스 정리 — 단원 전용 검사.
   문제 글의 수를 읽어 답을 다시 계산한다(단원 파일의 계산과 무관하다). 나눗셈 없이 곱셈으로 견준다(답 × 3 = 길이 × 5 …).
   닮음: 대응변의 길이의 비 = 닮음비, 넓이의 비 = 닮음비의 제곱, 부피의 비 = 세제곱. 평행선: AD : DB = AE : EC, AD : AB = DE : BC.
   피타고라스 정리: (답)² 을 직접 계산해 견준다. 근호가 든 보기는 제곱한 값(정수)으로 읽고, 가장 간단한 꼴인지도 본다.
   직각삼각형 고르기는 보기 넷을 모두 읽어 답만 직각삼각형이고 나머지는 직각삼각형이 아닌 삼각형인지 본다.
   그림은 닮은 모양 · 평행 · 직각이 실제로 맞는지 좌표로 확인하고, 그림에 적힌 길이가 문제 글과 같은지 본다. */
(function () {
  'use strict';
  var N = 1000, noJosa = ALG.noJosa;
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
        if (/\^\{\\circ\}\$?$/.test(t.slice(0, m.index + 1)) || /\^\{\d+$/.test(t.slice(0, m.index + 1))) continue;
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
      ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object/.test(t) && !/ $/.test(t), where + '글: ' + t);
    });
  };
  /** 키패드 문제의 공통 검사 */
  var numChecks = function (id, p, pr, where, bag) {
    var def = MH.types[id], kind = MH.kinds.int, ans = p.answer, ms = MH.mistakesFor(p), steps = def.steps(p.v);
    ok(Number.isInteger(ans) && ans >= 1, where + '답은 자연수');
    ms.forEach(function (x) { bag[x.id] = 1; ok(Number.isInteger(x.value) && x.value >= 1 && x.value !== ans, where + '실수 값: ' + x.id); });
    ok(ms.length >= 2 && ms.every(function (x, i) { return ms.every(function (y, j) { return i === j || x.value !== y.value; }); }), where + '실수가 둘은 있고 값이 서로 달라야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    ok(steps.length >= 2, where + '풀이 줄 수');
    if (pr.figure) ok(pr.figure.type === 'geo' && geoOk(pr.figure), where + '그림 형식: ' + JSON.stringify(pr.figure).slice(0, 300));
    detailed(id, p, where);
    return ans;
  };
  /** 문제 글에서 'N cm'(또는 'N m')로 적힌 길이를 차례로(cm² · cm³ 은 뺀다) */
  var lens = function (t) { var out = [], re = /(\d+)\\,\\mathrm\{c?m\}(?!\^)/g, m; while ((m = re.exec(t))) out.push(Number(m[1])); return out; };
  var areas = function (t) { var out = [], re = /(\d+)\\,\\mathrm\{cm\}\^\{[23]\}/g, m; while ((m = re.exec(t))) out.push(Number(m[1])); return out; };
  var ratioOf = function (t) { var m = /\$(\d+) : (\d+)\$/.exec(t); return m ? [Number(m[1]), Number(m[2])] : null; };
  var texts = function (f) { return f.items.filter(function (i) { return i[0] === 'text'; }); };
  var labels = function (f) { return texts(f).map(function (i) { return i[3]; }).filter(function (s) { return !/^[A-Z]$/.test(s); }); };
  /** 그림에 적힌 길이는 모두 문제 글에 있고, x 가 꼭 하나 있다 */
  var labelsOk = function (f, t, where) {
    var l = lens(t), ls = labels(f);
    ok(ls.filter(function (s) { return s === 'x'; }).length === 1 && ls.every(function (s) { var m = /^(\d+) cm$/.exec(s); return s === 'x' || (m && l.indexOf(Number(m[1])) >= 0); }), where + '그림의 길이가 문제 글과 다름: ' + ls.join(', '));
  };
  var polys = function (f) { return f.items.filter(function (i) { return i[0] === 'poly'; }).map(function (it) { var out = [], k; for (k = 0; k < it[1].length; k += 2) out.push([it[1][k], it[1][k + 1]]); return out; }); };
  var dot = function (O, P, Q) { return (P[0] - O[0]) * (Q[0] - O[0]) + (P[1] - O[1]) * (Q[1] - O[1]); };
  var cross = function (O, P, Q) { return (P[0] - O[0]) * (Q[1] - O[1]) - (P[1] - O[1]) * (Q[0] - O[0]); };
  var dist = function (P, Q) { return Math.sqrt((P[0] - Q[0]) * (P[0] - Q[0]) + (P[1] - Q[1]) * (P[1] - Q[1])); };
  /** 근호가 든 길이 'k\sqrt{m}' 를 제곱한 값(정수)으로. 가장 간단한 꼴이 아니면 null */
  var sqOf = function (s) {
    var m = /^(\d*)(?:\\sqrt\{(\d+)\})?$/.exec(s), k, r, i;
    if (!m || (m[1] === '' && m[2] === undefined)) return null;
    k = m[1] === '' ? 1 : Number(m[1]); r = m[2] === undefined ? 1 : Number(m[2]);
    if (m[2] !== undefined) { if (r < 2 || k < 1 || m[1] === '1') return null; for (i = 2; i * i <= r; i++) if (r % (i * i) === 0) return null; }
    return k * k * r;
  };
  var lenSq = function (s) { var m = /^(.*)\\,\\mathrm\{cm\}$/.exec(s); return m ? sqOf(m[1]) : null; };
  var setOf = function (s) { var p = s.split(',\\ ').map(sqOf); return p.length === 3 && p.every(function (v) { return v !== null; }) ? p : null; };
  var sorted = function (x) { return x.slice().sort(function (a, b) { return a - b; }); };
  var rightSet = function (sq) { var s = sorted(sq); return s[0] + s[1] === s[2]; };
  var triSet = function (sq) { var s = sorted(sq); return Math.sqrt(s[0]) + Math.sqrt(s[1]) > Math.sqrt(s[2]) + 1e-9; };
  /** 보기 고르기 문제의 공통 검사 */
  var choiceChecks = function (id, p, pr, where, bag) {
    var opts = MH.optionsOf(p), ms = MH.mistakesFor(p), steps = MH.types[id].steps(p.v);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && ms.length === 3, where + '보기: ' + opts.join(' | '));
    ms.forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    ok(steps.length >= 2, where + '풀이 줄 수');
    if (pr.figure) ok(pr.figure.type === 'geo' && geoOk(pr.figure), where + '그림 형식');
    return ms;
  };

  group('B24 — 검사 도구 자체 검사');
  ok(lens('$\\overline{AB} = 6\\,\\mathrm{cm}$, 넓이 $72\\,\\mathrm{cm}^{2}$, 사다리 $13\\,\\mathrm{m}$').join() === '6,13' && areas('$72\\,\\mathrm{cm}^{2}$, $8\\,\\mathrm{cm}^{3}$, $5\\,\\mathrm{cm}$').join() === '72,8' && ratioOf('닮음비는 $2 : 5$예요').join() === '2,5', '글 읽기');
  ok(sqOf('2\\sqrt{5}') === 20 && sqOf('\\sqrt{7}') === 7 && sqOf('12') === 144 && sqOf('\\sqrt{8}') === null && sqOf('1\\sqrt{2}') === null && sqOf('x') === null && sqOf('') === null && lenSq('3\\sqrt{2}\\,\\mathrm{cm}') === 18 && lenSq('3\\sqrt{2}') === null, '근호 읽기');
  ok(setOf('6,\\ 8,\\ 10').join() === '36,64,100' && setOf('\\sqrt{3},\\ 3,\\ 2\\sqrt{3}').join() === '3,9,12' && setOf('6,\\ 8') === null, '세 변 읽기');
  ok(rightSet([100, 36, 64]) && !rightSet([36, 64, 121]) && rightSet([3, 12, 9]) && triSet([36, 64, 121]) && !triSet([4, 9, 25]) && !triSet([1, 4, 9]), '직각삼각형 · 삼각형 판별');
  ok(dot([0, 0], [5, 0], [0, 7]) === 0 && cross([0, 0], [2, 2], [5, 5]) === 0 && Math.abs(dist([0, 0], [3, 4]) - 5) < 1e-9, '좌표 도구');
  done('도구');

  group('B24 — 닮음비와 대응변 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B24.ratio', function (p, pr, level, where) {
    var ans = numChecks('B24.ratio', p, pr, where, bag), t = pr.text, l = lens(t), r = ratioOf(t), f = pr.figure, P, xi;
    ok(/\\triangle ABC \\backsim \\triangle DEF/.test(t), where + '닮음 표시');
    if (/둘레/.test(t)) { kinds[level + 'peri'] = 1; ok(!f && r[0] < r[1], where + '둘레 문제'); eq(ans * r[0], l[0] * r[1], where + '둘레의 길이'); return; }
    ok(!!f, where + '그림이 있어야 함'); labelsOk(f, t, where);
    /* 그림: 두 삼각형이 닮았고(대응변의 비가 같다) 오른쪽이 더 크다 */
    P = polys(f); ok(P.length === 2 && [0, 1, 2].every(function (i) { var a = dist(P[0][i], P[0][(i + 1) % 3]), b = dist(P[1][i], P[1][(i + 1) % 3]), a0 = dist(P[0][0], P[0][1]), b0 = dist(P[1][0], P[1][1]); return b > a && Math.abs(a / b - a0 / b0) < 0.03; }), where + '그림의 두 삼각형이 닮지 않음');
    xi = texts(f).filter(function (i) { return i[3] === 'x'; })[0];
    if (!r) { kinds[level + 'find'] = 1; ok(l.length === 3 && l[0] < l[2] && l[0] !== l[1], where + '주어진 길이'); eq(ans * l[0], l[1] * l[2], where + '대응변'); ok(xi[1] > 140, where + 'x 는 큰 삼각형에'); return; }
    ok(r[0] < r[1], where + '닮음비는 작은 것 : 큰 것');
    kinds[level + (r[0] === 1 ? 'times' : 'ratio')] = 1;
    if (/\\overline\{AB\} = /.test(t)) { eq(ans * r[0], l[0] * r[1], where + '큰 쪽 구하기'); ok(xi[1] > 140, where + 'x 는 큰 삼각형에'); }
    else { ok(/\\overline\{DE\} = /.test(t), where + '모르는 문제: ' + t); eq(ans * r[1], l[0] * r[0], where + '작은 쪽 구하기'); ok(xi[1] < 140, where + 'x 는 작은 삼각형에'); }
  });
  eq(Object.keys(kinds).sort().join(' '), '0times 1ratio 2find 2peri', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added difference inverse ratio-only same squared wrong-pair', '실수의 종류');
  done('닮음비');

  group('B24 — 삼각형과 평행선 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B24.parallel', function (p, pr, level, where) {
    var ans = numChecks('B24.parallel', p, pr, where, bag), t = pr.text, l = lens(t), f = pr.figure, T, sg, D, E, ticks;
    ok(!!f, where + '그림이 있어야 함'); labelsOk(f, t, where);
    /* 그림: 선분 DE 는 변 BC 와 평행하고 두 끝이 변 AB, AC 위에 있다 */
    T = polys(f)[0]; sg = f.items.filter(function (i) { return i[0] === 'seg'; })[0]; D = [sg[1], sg[2]]; E = [sg[3], sg[4]];
    ok(T.length === 3 && T[1][1] === T[2][1] && D[1] === E[1] && Math.abs(cross(T[0], T[1], D)) / dist(T[0], T[1]) <= 1.5 && Math.abs(cross(T[0], T[2], E)) / dist(T[0], T[2]) <= 1.5 && D[1] > T[0][1] + 20 && D[1] < T[1][1] - 20, where + '그림의 평행선');
    ticks = f.items.filter(function (i) { return i[0] === 'tick'; }).length;
    if (/중점/.test(t)) {
      ok(ticks === 4 && Math.abs(dist(T[0], D) - dist(D, T[1])) <= 2 && Math.abs(dist(T[0], E) - dist(E, T[2])) <= 2, where + '중점 그림');
      if (/\\overline\{BC\} = /.test(t)) { kinds[level + 'mid'] = 1; eq(2 * ans, l[0], where + '중점을 이은 선분'); } else { kinds[level + 'mid-back'] = 1; eq(ans, 2 * l[0], where + '중점에서 밑변'); }
      return;
    }
    ok(ticks === 0 && /평행/.test(t) && l.length === 3, where + '평행선 문제');
    if (/\\overline\{EC\}\$의/.test(t)) { kinds[level + 'sides'] = 1; eq(ans * l[0], l[2] * l[1], where + '두 변을 같은 비로'); if (level === 0) ok(l[1] % l[0] === 0, where + '쉬운 비'); }
    else if (/\\overline\{BC\}\$의/.test(t)) { kinds[level + 'base'] = 1; eq(ans * l[0], l[2] * (l[0] + l[1]), where + '밑변'); }
    else { kinds[level + 'base-back'] = 1; ok(/\\overline\{DE\}\$의/.test(t), where + '모르는 문제: ' + t); eq(ans * (l[0] + l[1]), l[2] * l[0], where + '평행한 선분'); }
  });
  eq(Object.keys(kinds).sort().join(' '), '0mid 0mid-back 0sides 1sides 2base 2base-back', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'difference inverse part-ratio same tripled whole-ratio wrong-way', '실수의 종류');
  done('평행선');

  group('B24 — 넓이의 비와 부피의 비 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B24.area', function (p, pr, level, where) {
    var ans = numChecks('B24.area', p, pr, where, bag), t = pr.text, l = lens(t), a = areas(t), r = ratioOf(t), e, pw, small;
    ok(!pr.figure, where + '그림이 없어야 함');
    if (!r) {
      kinds[level + 'back'] = 1; ok(a.length === 2 && a[0] < a[1] && l.length === 1, where + '넓이 둘과 길이 하나');
      eq(ans * ans * a[0], l[0] * l[0] * a[1], where + '넓이의 비에서 길이');   /* (길이의 비)² = 넓이의 비 */
      return;
    }
    e = /부피/.test(t) ? 3 : 2; pw = function (x) { return e === 3 ? x * x * x : x * x; }; small = /작은 [가-힣]+의 (넓이|부피)가/.test(t);
    ok(r[0] < r[1] && a.length === 1 && (small || /큰 [가-힣]+의 (넓이|부피)가/.test(t)), where + '문제 글');
    ok(/\^\{3\}/.test(t) === (e === 3) && /cm³/.test(t) === (e === 3), where + '단위');
    kinds[level + (e === 3 ? 'vol' : r[0] === 1 && level === 0 ? 'k2' : 'mn')] = 1;
    if (small) eq(ans * pw(r[0]), a[0] * pw(r[1]), where + '큰 쪽'); else eq(ans * pw(r[1]), a[0] * pw(r[0]), where + '작은 쪽');
  });
  eq(Object.keys(kinds).sort().join(' '), '0k2 1mn 2back 2vol', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added area-ratio-used cubed difference doubled-instead inverse not-squared same wrong-power', '실수의 종류');
  done('넓이의 비');

  group('B24 — 피타고라스 정리 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B24.pyth', function (p, pr, level, where) {
    var ans = numChecks('B24.pyth', p, pr, where, bag), t = pr.text, l = lens(t), f = pr.figure, T;
    if (/사다리/.test(t)) { kinds[level + 'ladder'] = 1; ok(!f && l[0] > l[1], where + '사다리가 더 길다'); eq(ans * ans + l[1] * l[1], l[0] * l[0], where + '사다리'); return; }
    ok(!!f && f.items.some(function (i) { return i[0] === 'sq'; }), where + '그림과 직각 표시'); labelsOk(f, t, where);
    if (/직사각형/.test(t)) { kinds[level + 'rect'] = 1; eq(ans * ans, l[0] * l[0] + l[1] * l[1], where + '대각선'); }
    else if (/이등변/.test(t)) { kinds[level + 'iso'] = 1; ok(l[1] % 2 === 0 && l[1] < 2 * l[0], where + '밑변'); eq(4 * ans * ans + l[1] * l[1], 4 * l[0] * l[0], where + '높이'); }
    else {
      T = polys(f)[0]; ok(T.length === 3 && dot(T[0], T[1], T[2]) === 0, where + '그림이 직각삼각형이 아님');
      if (/빗변의 길이 \$x\$/.test(t)) { kinds[level + 'hyp'] = 1; eq(ans * ans, l[0] * l[0] + l[1] * l[1], where + '빗변'); }
      else { kinds[level + 'leg'] = 1; ok(/빗변의 길이가/.test(t) && l[0] > l[1], where + '빗변이 가장 길다'); eq(ans * ans + l[1] * l[1], l[0] * l[0], where + '다른 변'); }
    }
    ok(l.every(function (v) { return v <= 60; }), where + '수가 너무 큼');
  });
  eq(Object.keys(kinds).sort().join(' '), '0hyp 1leg 2iso 2ladder 2rect', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added area doubled-sum full-subtracted halved not-rooted perimeter subtracted', '실수의 종류');
  done('피타고라스 정리');

  group('B24 — 피타고라스 정리와 근호 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B24.root', function (p, pr, level, where) {
    var id = 'B24.root', ms = choiceChecks(id, p, pr, where, bag), t = pr.text, l = lens(t), a = lenSq(p.answer), steps = MH.types[id].steps(p.v), f = pr.figure;
    ok(a !== null, where + '답을 읽을 수 없거나 가장 간단한 꼴이 아님: ' + p.answer);
    eq(steps[steps.length - 1].tex, p.answer, where + '풀이의 마지막 줄은 답');
    ms.forEach(function (x) { var w = lenSq(x.value); ok(w !== null && w !== a, where + '틀린 보기의 값: ' + x.value); });
    ok(!!f && f.items.some(function (i) { return i[0] === 'sq'; }), where + '그림과 직각 표시'); labelsOk(f, t, where);
    ok(Math.round(Math.sqrt(a)) * Math.round(Math.sqrt(a)) !== a, where + '답에 근호가 있어야 함');
    if (/정사각형/.test(t)) { kinds[level + 'sq-diag'] = 1; eq(a, 2 * l[0] * l[0], where + '정사각형의 대각선'); }
    else if (/정삼각형/.test(t)) { kinds[level + 'equi-h'] = 1; eq(4 * a, 3 * l[0] * l[0], where + '정삼각형의 높이'); }
    else if (/빗변의 길이 \$x\$/.test(t)) { kinds[level + 'hyp'] = 1; eq(a, l[0] * l[0] + l[1] * l[1], where + '빗변'); }
    else { kinds[level + 'leg'] = 1; ok(/빗변의 길이가/.test(t) && l[0] > l[1], where + '빗변이 가장 길다'); eq(a + l[1] * l[1], l[0] * l[0], where + '다른 변'); }
  });
  eq(Object.keys(kinds).sort().join(' '), '0hyp 1leg 2equi-h 2sq-diag', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added added-squares area base-not-halved doubled half-only not-rooted root-of-diff root-of-sum root2 root3 same subtracted', '실수의 종류');
  done('근호');

  group('B24 — 직각삼각형인지 알아보기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B24.right', function (p, pr, level, where) {
    var id = 'B24.right', ms = choiceChecks(id, p, pr, where, bag), t = pr.text, l = lens(t), opts = MH.optionsOf(p), NO = '직각삼각형이 아니다', OPP = ['\\angle C', '\\angle A', '\\angle B'], s, big, want, a;
    ok(!pr.figure, where + '그림이 없어야 함');
    if (/인 각을 고르세요/.test(t)) {
      /* 변 AB, BC, CA 의 맞은편 꼭짓점은 C, A, B */
      ok(l.length === 3 && opts.slice().sort().join('|') === OPP.concat([NO]).sort().join('|'), where + '보기');
      s = sorted(l); big = l.indexOf(s[2]); ok(s[1] < s[2] && s[0] + s[1] > s[2], where + '가장 긴 변이 하나이고 삼각형이 된다');
      want = s[0] * s[0] + s[1] * s[1] === s[2] * s[2] ? OPP[big] : NO; kinds[level + (want === NO ? 'none' : 'angle')] = 1;
      eq(p.answer, want, where + '직각인 각');
      return;
    }
    kinds[level + (/sqrt/.test(opts.join('')) ? 'rootset' : 'set')] = 1;
    a = setOf(p.answer); ok(!!a && rightSet(a) && triSet(a), where + '답이 직각삼각형이 아님: ' + p.answer);
    ms.forEach(function (x) { var w = setOf(x.value); ok(!!w && !rightSet(w) && triSet(w), where + '틀린 보기가 직각삼각형이거나 삼각형이 아님: ' + x.value); });
    if (level === 2) ok(/sqrt/.test(p.answer), where + '답에 근호가 있어야 함');
  });
  eq(Object.keys(kinds).sort().join(' '), '0set 1angle 1none 2rootset', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'assumed-right consecutive leg-off long-off not-right opposite-middle opposite-shortest short-off unsquared-sum', '실수의 종류');
  done('직각삼각형');
})();
