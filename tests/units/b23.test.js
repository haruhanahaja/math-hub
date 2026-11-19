/* B23 도형의 기초 — 단원 전용 검사.
   문제 글의 수를 읽어 도형의 성질로 답을 다시 계산한다(단원 파일의 계산과 무관하다).
   각도 그림은 실제 크기대로 그리므로 그림으로도 검산한다: 각 표시(호) 바로 뒤의 글자가 그 각의 이름이다.
   이름이 x 인 호의 크기(도2 − 도1)는 답과 같아야 하고, 이름이 'N°' 인 호의 크기는 N 이어야 한다.
   삼각형은 꼭짓점 좌표로 잰 실제 각도 호의 크기와 맞아야 한다(반올림 오차 3° 까지).
   다각형은 꼭짓점을 직접 세어 대각선을 구하고, 원과 부채꼴은 보기의 π 앞 수를 분수로 읽어 견준다. */
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
  /** 문제 글에서 '…^{\circ}' 로 적힌 각도를 차례로 */
  var degs = function (t) { var out = [], re = /(\d+)\^\{\\circ\}/g, m; while ((m = re.exec(t))) out.push(Number(m[1])); return out; };
  /** 문제 글에서 'N cm' 로 적힌 길이를 차례로(cm² 는 뺀다) */
  var lens = function (t) { var out = [], re = /(\d+)\\,\\mathrm\{cm\}(?!\^)/g, m; while ((m = re.exec(t))) out.push(Number(m[1])); return out; };
  var area = function (t) { var m = /(\d+)\\,\\mathrm\{cm\}\^\{2\}/.exec(t); return m ? Number(m[1]) : null; };
  /** 그림의 각 표시: [{ at: [x, y], span, label }] */
  var arcs = function (f) { var out = []; f.items.forEach(function (it, i) { var nx = f.items[i + 1]; if (it[0] === 'arc' && nx && nx[0] === 'text') out.push({ at: [it[1], it[2]], from: it[4], to: it[5], span: it[5] - it[4], label: nx[3] }); }); return out; };
  /** 그림의 각 표시가 답 · 문제 글과 맞는가. x 의 크기를 돌려준다(없으면 null) */
  var arcCheck = function (f, where) {
    var x = null;
    arcs(f).forEach(function (a) {
      var m = /^(\d+)°$/.exec(a.label);
      if (a.label === 'x') x = a.span; else if (m) eq(a.span, Number(m[1]), where + '그림의 각 ' + a.label);
    });
    return x;
  };
  /** 세 점으로 잰 각 ABC(도) */
  var measure = function (A, B, C) { var u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]], c = (u[0] * v[0] + u[1] * v[1]) / Math.sqrt((u[0] * u[0] + u[1] * u[1]) * (v[0] * v[0] + v[1] * v[1])); return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI; };
  var polyOf = function (f) { var it = f.items.filter(function (i) { return i[0] === 'poly'; })[0], out = [], k; if (!it) return null; for (k = 0; k < it[1].length; k += 2) out.push([it[1][k], it[1][k + 1]]); return out; };
  /** 그림의 삼각형에서 꼭짓점마다 잰 각이 그 자리의 내각 표시와 맞는가 */
  var triMeasured = function (f, where) {
    var P = polyOf(f); if (!P || P.length !== 3) { ok(false, where + '삼각형이 없음'); return; }
    arcs(f).forEach(function (a) {
      var i = -1, real; P.forEach(function (pt, k) { if (pt[0] === a.at[0] && pt[1] === a.at[1]) i = k; });
      if (i < 0) { ok(false, where + '각 표시가 꼭짓점에 없음'); return; }
      real = measure(P[(i + 1) % 3], P[i], P[(i + 2) % 3]);
      ok(Math.abs(real - a.span) <= 3 || Math.abs(180 - real - a.span) <= 3, where + '그림의 각이 실제와 다름: ' + a.label + ' ' + a.span + ' / ' + real.toFixed(1));
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
  var NAMES = { '삼': 3, '사': 4, '오': 5, '육': 6, '칠': 7, '팔': 8, '구': 9, '십': 10, '십일': 11, '십이': 12, '십삼': 13, '십사': 14, '십오': 15, '십팔': 18, '이십': 20 };
  var sides = function (t) { var m = /^정?([가-힣]+)각형/.exec(t); return m && NAMES[m[1]] ? NAMES[m[1]] : null; };
  /** 변이 n 개인 다각형의 대각선을 직접 센다: 이웃하지 않는 꼭짓점의 짝 */
  var countDiag = function (n, from) { var c = 0, i, j; for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (j - i !== 1 && !(i === 0 && j === n - 1) && (from === undefined || i === from || j === from)) c++; return c; };
  /** π 가 든 보기를 { n, d, pi, unit } 로 읽는다. 읽을 수 없으면 null */
  var readPi = function (s) {
    var m;
    if ((m = /^(\d+)\^\{\\circ\}$/.exec(s))) return { n: Number(m[1]), d: 1, pi: false, unit: 'deg' };
    if ((m = /^\\dfrac\{(\d*)\\pi\}\{(\d+)\}\\,\\mathrm\{cm\}(\^\{2\})?$/.exec(s))) return { n: m[1] === '' ? 1 : Number(m[1]), d: Number(m[2]), pi: true, unit: m[3] ? 'cm2' : 'cm' };
    if ((m = /^(\d*)(\\pi)?\\,\\mathrm\{cm\}(\^\{2\})?$/.exec(s))) return m[1] === '' && !m[2] ? null : { n: m[1] === '' ? 1 : Number(m[1]), d: 1, pi: !!m[2], unit: m[3] ? 'cm2' : 'cm' };
    return null;
  };
  var gcd = function (a, b) { while (b) { var t = a % b; a = b; b = t; } return a; };
  /** 보기의 값이 (n/d)(π) 단위와 같은가 */
  var isVal = function (o, n, d, pi, unit) { return !!o && o.n * d === n * o.d && o.pi === pi && o.unit === unit; };

  group('B23 — 검사 도구 자체 검사');
  ok(degs('두 각 $37^{\\circ}$, $64^{\\circ}$').join() === '37,64' && lens('$6\\,\\mathrm{cm}$, 넓이 $72\\,\\mathrm{cm}^{2}$').join() === '6' && area('넓이가 $72\\,\\mathrm{cm}^{2}$') === 72, '글 읽기');
  ok(Math.abs(measure([10, 0], [0, 0], [0, 10]) - 90) < 1e-9 && Math.abs(measure([10, 0], [0, 0], [10, 10]) - 45) < 1e-9, '각 재기');
  ok(countDiag(5) === 5 && countDiag(6) === 9 && countDiag(8) === 20 && countDiag(6, 0) === 3 && countDiag(12, 4) === 9, '대각선 세기');
  ok(sides('정십이각형의 한 내각') === 12 && sides('오각형의 내각') === 5 && sides('이십각형의') === 20 && sides('내각의 합') === null, '다각형 이름');
  ok(isVal(readPi('\\dfrac{25\\pi}{2}\\,\\mathrm{cm}'), 25, 2, true, 'cm') && isVal(readPi('\\pi\\,\\mathrm{cm}^{2}'), 1, 1, true, 'cm2') && isVal(readPi('12\\,\\mathrm{cm}'), 12, 1, false, 'cm') && isVal(readPi('160^{\\circ}'), 160, 1, false, 'deg') && readPi('x') === null && !isVal(readPi('8\\pi\\,\\mathrm{cm}'), 8, 1, true, 'cm2'), 'π 가 든 보기 읽기');
  ok(geoOk({ type: 'geo', h: 100, alt: '삼각형이 하나 있다. 밑변은 아래에 있다.', items: [['poly', [10, 90, 200, 90, 100, 10]], ['arc', 10, 90, 17, 0, 40], ['text', 40, 80, 'x']] }) && !geoOk({ type: 'geo', h: 100, alt: '삼각형이 하나 있다. 밑변은 아래에 있다.', items: [['seg', 10, 90, 400, 90]] }) && !geoOk({ type: 'geo', h: 100, alt: '짧다', items: [['dot', 10, 10]] }) && !geoOk({ type: 'geo', h: 100, alt: '삼각형이 하나 있다. 밑변은 아래에 있다.', items: [['blob', 1, 2]] }), '그림 형식 검사');
  done('도구');

  group('B23 — 각과 평행선 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B23.angle', function (p, pr, level, where) {
    var ans = numChecks('B23.angle', p, pr, where, bag), t = pr.text, d = degs(t), f = pr.figure, x, m, as, sg, slope, tv;
    ok(!!f, where + '그림이 있어야 함');
    x = arcCheck(f, where);
    if (/x\$의 값/.test(t)) {
      kinds[level + 'expr'] = 1; m = /\((\d*)x ([+-]) (\d+)\)\^\{\\circ\}\$, \$\((\d*)x ([+-]) (\d+)\)\^\{\\circ\}/.exec(t);
      ok(!!m, where + '식을 읽을 수 없음: ' + t); if (!m) return;
      var k1 = Number(m[1] || 1), c1 = (m[2] === '-' ? -1 : 1) * Number(m[3]), k2 = Number(m[4] || 1), c2 = (m[5] === '-' ? -1 : 1) * Number(m[6]);
      ok(k1 * ans + c1 + k2 * ans + c2 === 180 && k1 * ans + c1 > 0 && k2 * ans + c2 > 0, where + '두 각의 합이 180 이 아님');
      as = arcs(f); ok(as.length === 2 && as[0].span === k1 * ans + c1 && as[1].span === k2 * ans + c2, where + '그림의 각이 식의 값과 다름');
      return;
    }
    eq(x, ans, where + '그림의 x 각');
    if (/반직선/.test(t)) { kinds[level + 'straight'] = 1; eq(ans, 180 - d[0], where + '평각'); }
    else if (/마주 보는 각/.test(t)) { kinds[level + 'vertical'] = 1; eq(ans, d[0], where + '맞꼭지각'); }
    else if (/꺾인/.test(t)) { kinds[level + 'bent'] = 1; eq(ans, d[0] + d[1], where + '꺾인 선'); }
    else {
      kinds[level + 'par'] = 1; ok(ans === d[0] || ans === 180 - d[0], where + '평행선의 각');
      /* 가로지르는 직선의 실제 기울기로 다시 계산: 두 평행선은 가로로 놓여 있다 */
      sg = f.items.filter(function (i) { return i[0] === 'seg'; }); tv = sg[2]; slope = Math.atan2(tv[2] - tv[4], tv[3] - tv[1]) * 180 / Math.PI; if (slope < 0) slope += 180;
      ok(sg[0][2] === sg[0][4] && sg[1][2] === sg[1][4], where + '평행선이 가로가 아님');
      as = arcs(f); as.forEach(function (a) { var lo = ((a.from % 180) + 180) % 180, want = lo === 0 ? slope : 180 - slope; ok(Math.abs(want - a.span) <= 3, where + '그림의 각이 실제와 다름: ' + a.label + ' ' + a.span + ' / ' + want.toFixed(1)); });
      ok(as.length === 2 && as[0].at[1] < as[1].at[1], where + '표시된 각은 위, x 는 아래 교점');
    }
  });
  eq(Object.keys(kinds).sort().join(' '), '0straight 0vertical 1par 2bent 2expr', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'const-sign difference equal equal-set full one-only right-angle sum-360 sum-90 supplement', '실수의 종류');
  done('각과 평행선');

  group('B23 — 삼각형의 각 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B23.triangle', function (p, pr, level, where) {
    var ans = numChecks('B23.triangle', p, pr, where, bag), t = pr.text, d = degs(t), f = pr.figure, x;
    ok(!!f, where + '그림이 있어야 함'); x = arcCheck(f, where); eq(x, ans, where + '그림의 x 각'); triMeasured(f, where);
    if (/이등변/.test(t)) {
      ok(f.items.filter(function (i) { return i[0] === 'tick'; }).length === 2, where + '같은 길이 표시');
      if (/꼭지각의 크기가/.test(t)) { kinds[level + 'iso-base'] = 1; eq(2 * ans, 180 - d[0], where + '밑각'); } else { kinds[level + 'iso-apex'] = 1; eq(ans, 180 - 2 * d[0], where + '꼭지각'); }
    } else if (/외각 \$\\angle x\$/.test(t)) { kinds[level + 'ext'] = 1; eq(ans, d[0] + d[1], where + '외각'); }
    else if (/외각의 크기가/.test(t)) { kinds[level + 'ext-back'] = 1; eq(ans, d[0] - d[1], where + '외각에서 내각'); }
    else { kinds[level + 'sum'] = 1; eq(ans, 180 - d[0] - d[1], where + '세 내각의 합'); }
    ok(ans > 0 && ans < 180, where + '각의 범위');
  });
  eq(Object.keys(kinds).sort().join(' '), '0sum 1ext 1ext-back 2iso-apex 2iso-base', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'difference half-apex halved interior not-halved one-base one-subtracted same sum-360 sum-only', '실수의 종류');
  done('삼각형의 각');

  group('B23 — 다각형의 각과 대각선 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B23.polygon', function (p, pr, level, where) {
    var ans = numChecks('B23.polygon', p, pr, where, bag), t = pr.text, d = degs(t), n = sides(t);
    ok(!pr.figure, where + '그림이 없어야 함');
    if (/내각의 크기의 합은/.test(t)) { kinds[level + 'isum'] = 1; eq(ans + 360, 180 * n, where + '내각의 합'); }   /* 내각 + 외각 = 180 이 n 쌍, 외각의 합은 360 */
    else if (/그을 수 있는 대각선/.test(t)) { kinds[level + 'fromv'] = 1; eq(ans, countDiag(n, 0), where + '한 꼭짓점의 대각선'); }
    else if (/삼각형 몇 개/.test(t)) { kinds[level + 'tris'] = 1; eq(ans, countDiag(n, 0) + 1, where + '삼각형의 개수'); }
    else if (/한 내각의 크기는/.test(t)) { kinds[level + 'reg-in'] = 1; eq(ans * n + 360, 180 * n, where + '정다각형의 한 내각'); }
    else if (/한 외각의 크기는/.test(t)) { kinds[level + 'reg-ex'] = 1; eq(ans * n, 360, where + '정다각형의 한 외각'); }
    else if (/내각의 크기의 합이/.test(t)) { kinds[level + 'n-sum'] = 1; eq(180 * ans - 360, d[0], where + '변의 개수(내각의 합)'); }
    else if (/한 외각의 크기가/.test(t)) { kinds[level + 'n-ext'] = 1; eq(d[0] * ans, 360, where + '변의 개수(외각)'); }
    else if (/한 내각의 크기가/.test(t)) { kinds[level + 'n-int'] = 1; eq((180 - d[0]) * ans, 360, where + '변의 개수(내각)'); }
    else { kinds[level + 'diag'] = 1; ok(/대각선은 모두/.test(t), where + '모르는 문제: ' + t); eq(ans, countDiag(n), where + '대각선의 개수'); }
    if (!/인 (정)?다각형은/.test(t)) ok(n !== null, where + '다각형 이름을 읽을 수 없음: ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0fromv 0isum 0tris 1reg-ex 1reg-in 2diag 2n-ext 2n-int 2n-sum', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'all-n always-360 by-180 by-360 by-n-180 exterior-instead from-one-vertex interior-instead interior-used minus-three minus-two n-minus-1 n-minus-1-times n-minus-2-rule n-times no-plus-2 not-halved plus-one sum-not-divided', '실수의 종류');
  done('다각형');

  group('B23 — 사각형의 성질 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B23.quad', function (p, pr, level, where) {
    var ans = numChecks('B23.quad', p, pr, where, bag), t = pr.text, d = degs(t), l = lens(t), f = pr.figure, x = f ? arcCheck(f, where) : null, P;
    if (/세 내각/.test(t)) { kinds[level + 'sum4'] = 1; eq(ans, 360 - d[0] - d[1] - d[2], where + '네 내각의 합'); ok(ans < 180, where + '볼록한 사각형'); }
    else if (/이웃한 각/.test(t)) { kinds[level + 'adj'] = 1; eq(ans, 180 - d[0], where + '이웃한 각'); eq(x, ans, where + '그림의 x 각'); }
    else if (/마주 보는 각/.test(t)) { kinds[level + 'opp'] = 1; eq(ans, d[0], where + '대각'); eq(x, ans, where + '그림의 x 각'); }
    else if (/평행사변형.*둘레/.test(t)) { kinds[level + 'peri'] = 1; eq(ans, l[0] + l[1] + l[0] + l[1], where + '둘레'); }
    else if (/평행사변형.*AO/.test(t)) { kinds[level + 'diag'] = 1; eq(2 * ans, l[0], where + '대각선의 절반'); }
    else if (/직사각형.*BO/.test(t)) { kinds[level + 'rect-half'] = 1; eq(2 * ans, l[0], where + '직사각형의 대각선의 절반'); }
    else if (/직사각형.*BD/.test(t)) { kinds[level + 'rect-full'] = 1; eq(ans, 2 * l[0], where + '직사각형의 대각선'); }
    else if (/마름모.*angle BAC/.test(t)) { kinds[level + 'rhom-angle'] = 1; eq(ans, 90 - d[0], where + '마름모의 각'); eq(x, ans, where + '그림의 x 각'); ok(f.items.some(function (i) { return i[0] === 'sq'; }), where + '직각 표시'); }
    else { kinds[level + 'rhom-peri'] = 1; ok(/마름모의 둘레/.test(t), where + '모르는 문제: ' + t); eq(ans, 4 * l[0], where + '마름모의 둘레'); }
    /* 평행사변형 그림: 마주 보는 변이 평행하고, 표시한 각이 실제와 맞는가 */
    if (f && /평행사변형/.test(t)) {
      P = polyOf(f); ok(P.length === 4 && P[1][0] - P[0][0] === P[2][0] - P[3][0] && P[0][1] === P[1][1] && P[2][1] === P[3][1], where + '평행사변형 그림');
      if (d.length) ok(Math.abs(measure(P[1], P[0], P[3]) - d[0]) <= 3, where + '그림의 각 A 가 실제와 다름');
    }
  });
  eq(Object.keys(kinds).sort().join(' '), '0sum4 1adj 1diag 1opp 1peri 2rect-full 2rect-half 2rhom-angle 2rhom-peri', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'doubled doubled-angle equal full halved-again not-doubled one-doubled one-missed other-diagonal product quadrupled right-angle same-length squared sum-540 sum-given supplement three-sides two-sides', '실수의 종류');
  done('사각형');

  group('B23 — 도형의 넓이 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B23.area', function (p, pr, level, where) {
    var ans = numChecks('B23.area', p, pr, where, bag), t = pr.text, l = lens(t), S = area(t), f = pr.figure, labels;
    ok(!!f, where + '그림이 있어야 함');
    labels = f.items.filter(function (i) { return i[0] === 'text'; }).map(function (i) { return i[3]; });
    ok(labels.every(function (s) { var m = /^(\d+) cm$/.exec(s); return s === 'x' || (m && l.indexOf(Number(m[1])) >= 0); }), where + '그림의 길이가 문제 글과 다름: ' + labels.join(', '));
    eq(labels.filter(function (s) { return s !== 'x'; }).length, l.length, where + '그림에 적힌 길이의 개수');
    eq(labels.indexOf('x') >= 0, S !== null, where + '높이를 묻는 문제에만 x');
    if (S === null) {
      if (/삼각형의 넓이/.test(t)) { kinds[level + 'tri'] = 1; eq(2 * ans, l[0] * l[1], where + '삼각형'); }
      else if (/평행사변형의 넓이/.test(t)) { kinds[level + 'para'] = 1; eq(ans, l[0] * l[1], where + '평행사변형'); ok(l[2] > l[1], where + '비스듬한 변은 높이보다 길다'); }
      else if (/사다리꼴의 넓이/.test(t)) { kinds[level + 'trap'] = 1; eq(2 * ans, (l[0] + l[1]) * l[2], where + '사다리꼴'); }
      else { kinds[level + 'rhom'] = 1; ok(/마름모의 넓이/.test(t), where + '모르는 문제: ' + t); eq(2 * ans, l[0] * l[1], where + '마름모'); }
    } else if (/삼각형의 높이/.test(t)) { kinds[level + 'tri-h'] = 1; eq(l[0] * ans, 2 * S, where + '삼각형의 높이'); }
    else if (/평행사변형의 높이/.test(t)) { kinds[level + 'para-h'] = 1; eq(l[0] * ans, S, where + '평행사변형의 높이'); }
    else { kinds[level + 'trap-h'] = 1; ok(/사다리꼴의 높이/.test(t), where + '모르는 문제: ' + t); eq((l[0] + l[1]) * ans, 2 * S, where + '사다리꼴의 높이'); }
  });
  eq(Object.keys(kinds).sort().join(' '), '0para 0tri 1rhom 1trap 2para-h 2trap-h 2tri-h', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added area-half base-copied base-sum bases-times doubled halved not-doubled not-halved one-base perimeter side-used', '실수의 종류');
  done('넓이');

  group('B23 — 원과 부채꼴 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B23.circle', function (p, pr, level, where) {
    var id = 'B23.circle', t = pr.text, opts = MH.optionsOf(p), ms = MH.mistakesFor(p), steps = MH.types[id].steps(p.v), a = readPi(p.answer), d = degs(t), l = lens(t), f = pr.figure, r, k, m, sec;
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && ms.length === 3, where + '보기: ' + opts.join(' | '));
    ms.forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    ok(steps.length >= 2 && steps[steps.length - 1].tex === p.answer, where + '풀이의 마지막 줄은 답');
    ok(!!a && gcd(a.n, a.d) === 1, where + '답을 읽을 수 없거나 약분이 안 됨: ' + p.answer);
    /* 틀린 보기는 모두 읽을 수 있고 값이 답과 달라야 한다 */
    ms.forEach(function (x) { var w = readPi(x.value); ok(!!w && gcd(w.n, w.d) === 1 && !(w.n * a.d === a.n * w.d && w.pi === a.pi), where + '틀린 보기의 값: ' + x.value); });
    if (f) ok(f.type === 'geo' && geoOk(f), where + '그림 형식');
    if (/인 원의/.test(t)) {
      r = /^지름/.test(t) ? l[0] / 2 : l[0]; ok(Number.isInteger(r) && !!f, where + '반지름');
      if (/둘레/.test(t)) { kinds[level + 'circ-len'] = 1; ok(isVal(a, 2 * r, 1, true, 'cm'), where + '원의 둘레'); } else { kinds[level + 'circ-area'] = 1; ok(isVal(a, r * r, 1, true, 'cm2'), where + '원의 넓이'); }
      ok(f.items.some(function (i) { return i[0] === 'text' && i[3] === l[0] + ' cm'; }), where + '그림의 길이');
    } else if (/같은 원에서/.test(t)) { kinds[level + 'prop'] = 1; ok(a.unit === 'cm' && !a.pi && a.d === 1 && a.n * d[0] === l[0] * d[1] && d[0] !== d[1], where + '정비례'); }
    else if (/중심각의 크기를 고르세요/.test(t)) {
      kinds[level + 'angle'] = 1; m = /\$(\d*)\\pi\\,\\mathrm\{cm\}\$/.exec(t); k = m[1] === '' ? 1 : Number(m[1]);
      ok(a.unit === 'deg' && a.n > 0 && a.n < 360 && 2 * l[0] * a.n === 360 * k, where + '중심각');   /* 2πr × (각/360) = kπ */
    } else if (/호의 길이가/.test(t)) {
      kinds[level + 'half-rl'] = 1; m = /\$(\d*)\\pi\\,\\mathrm\{cm\}\$/.exec(t); k = m[1] === '' ? 1 : Number(m[1]);
      ok(isVal(a, l[0] * k, 2, true, 'cm2') && k < 2 * l[0], where + '반지름과 호의 길이로 넓이');   /* 호는 원의 둘레보다 짧다 */
    } else {
      sec = f && f.items.filter(function (i) { return i[0] === 'sector'; })[0];
      ok(!!sec && sec[5] - sec[4] === d[0] && d[0] > 0 && d[0] < 360, where + '그림의 중심각');
      if (/호의 길이를/.test(t)) { kinds[level + 'sec-len'] = 1; ok(isVal(a, 2 * l[0] * d[0], 360, true, 'cm'), where + '호의 길이'); } else { kinds[level + 'sec-area'] = 1; ok(/부채꼴의 넓이를/.test(t), where + '모르는 문제: ' + t); ok(isVal(a, l[0] * l[0] * d[0], 360, true, 'cm2'), where + '부채꼴의 넓이'); }
    }
  });
  eq(Object.keys(kinds).sort().join(' '), '0circ-area 0circ-len 1sec-area 1sec-len 2angle 2half-rl 2prop', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added added-once area-formula circumference-formula diameter-doubled diameter-squared doubled-ratio half-ratio inverse not-halved not-squared pi-lost quartered radius-only rest-angle same-length short-once supplement whole-circle', '실수의 종류');
  done('원과 부채꼴');
})();
