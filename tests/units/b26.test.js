/* B26 원의 성질 — 단원 전용 검사.
   문제 글에서 길이 · 각을 읽고 답을 다시 계산해 견준다(단원 파일의 계산과 무관하다. 길이는 Math.sqrt 로, 각은 삼각형 · 사각형의 각의 합으로).
   그림은 좌표로 잰다: 현의 수선은 현의 한가운데에 수직으로, 접선은 반지름과 수직으로, 내접원은 세 변까지의 거리가 반지름과 같게,
   원주각 · 중심각 · 내접 삼각형의 각은 재어 보면 답과 같게 그려져야 한다. */
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
  var RAD = Math.PI / 180, near = function (x, y, tol) { return Math.abs(x - y) <= (tol || 1e-9); };
  /** 문제 글에서 '\overline{XY} = N cm' 을 모두 읽는다(같은 길이로 묶인 '\overline{OM} = \overline{ON} = N' 도) */
  var lensOf = function (t) {
    var out = {}, re = /((?:\\overline\{[A-Z]{2}\} = )+)(\d+)\\,\\mathrm\{cm\}/g, m;
    while ((m = re.exec(t))) (m[1].match(/[A-Z]{2}/g) || []).forEach(function (n) { out[n] = Number(m[2]); });
    return out;
  };
  var radiusOf = function (t) { var m = /반지름의 길이가 \$(\d+)\\,\\mathrm\{cm\}\$/.exec(t); return m ? Number(m[1]) : null; };
  var angOf = function (t) { var out = {}, re = /\\angle ([A-Z]{3}) = (\d+)\^\{\\circ\}/g, m; while ((m = re.exec(t))) out[m[1]] = Number(m[2]); return out; };
  var items = function (f, k) { return f.items.filter(function (i) { return i[0] === k; }); };
  var labels = function (f) { return items(f, 'text').map(function (i) { return i[3]; }); };
  /** 그림에서 이름이 s 인 글자의 자리 */
  var at = function (f, s) { var t = items(f, 'text').filter(function (i) { return i[3] === s; })[0]; return t ? [t[1], t[2]] : null; };
  var dist = function (p, q) { return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1])); };
  var angleAt = function (O, P, Q) { var u = [P[0] - O[0], P[1] - O[1]], v = [Q[0] - O[0], Q[1] - O[1]]; return Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.sqrt((u[0] * u[0] + u[1] * u[1]) * (v[0] * v[0] + v[1] * v[1]))) / RAD; };
  /** 점에서 직선 PQ 까지의 거리 */
  var lineDist = function (X, P, Q) { return Math.abs((Q[0] - P[0]) * (P[1] - X[1]) - (P[0] - X[0]) * (Q[1] - P[1])) / dist(P, Q); };
  /** 원 위의 점: 이름표에서 중심 쪽으로 12 만큼 당긴 자리와 가장 가까운 선분 끝점 */
  var onCircle = function (f, s) {
    var c = items(f, 'circle')[0], O = [c[1], c[2]], L = at(f, s), best = null;
    items(f, 'seg').concat(items(f, 'poly').map(function (p) { return null; })).forEach(function (g) { if (!g) return; [[g[1], g[2]], [g[3], g[4]]].forEach(function (e) { if (Math.abs(dist(e, O) - c[3]) <= 2 && (!best || dist(e, L) < dist(best, L))) best = e; }); });
    return best;
  };

  group('B26 — 검사 도구 자체 검사');
  eq(JSON.stringify(lensOf('$\\overline{OM} = \\overline{ON} = 12\\,\\mathrm{cm}$일 때 $\\overline{AB} = 7\\,\\mathrm{cm}$')), '{"OM":12,"ON":12,"AB":7}', '길이 읽기');
  eq(JSON.stringify(angOf('$\\angle APB = 40^{\\circ}$일 때, $\\angle AOB$')), '{"APB":40}', '각 읽기');
  ok(near(lineDist([0, 5], [-3, 0], [9, 0]), 5) && near(angleAt([0, 0], [1, 0], [1, 1]), 45), '거리 · 각 재기');
  done('도구');

  group('B26 — 현의 길이 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B26.chord', function (p, pr, level, where) {
    var a = numChecks('B26.chord', p, pr, where, bag), t = pr.text, L = lensOf(t), r = radiusOf(t), two = /두 현/.test(t), k, want, f = pr.figure, c, M, A;
    if (/현 \$(AB|CD)\$의 길이는 몇 cm/.test(t)) { k = two ? 'eq-len' : 'half'; want = 2 * Math.sqrt(r * r - L.OM * L.OM); ok(!two || (L.ON === L.OM && /현 \$CD\$의 길이는/.test(t)), where + '두 현의 거리'); }
    else if (/원 \$O\$의 반지름의 길이는 몇 cm/.test(t)) { k = 'radius'; want = Math.sqrt(L.AB * L.AB / 4 + L.OM * L.OM); ok(r === null, where + '반지름이 글에 있음'); }
    else { k = two ? 'eq-dist' : 'dist'; want = Math.sqrt(r * r - L.AB * L.AB / 4); ok(/\\overline\{O[MN]\}\$의 길이는 몇 cm/.test(t) && (!two || L.CD === L.AB), where + '문제 글: ' + t); }
    kinds[level + k] = 1; ok(near(a, want), where + '값 ' + a + ' ≠ ' + want);
    /* 그림: 현의 두 끝은 원 위에, 수선의 발은 현의 한가운데에, 수선은 현과 수직 */
    c = items(f, 'circle')[0]; M = items(f, 'seg')[1]; A = items(f, 'seg')[0];
    ok(Math.abs(dist([A[1], A[2]], [c[1], c[2]]) - c[3]) <= 2 && Math.abs(dist([A[3], A[4]], [c[1], c[2]]) - c[3]) <= 2 && Math.abs(M[3] - (A[1] + A[3]) / 2) <= 1 && M[4] === A[2] && M[1] === c[1] && M[2] === c[2] && M[1] === M[3], where + '그림의 현과 수선');
    ok(items(f, 'seg').length === (two ? 4 : 3) && labels(f).indexOf('M') >= 0 && (labels(f).indexOf('N') >= 0) === two, where + '그림의 조각');
    labels(f).filter(function (x) { return / cm$/.test(x); }).forEach(function (x) { var n = parseInt(x, 10); ok(n === r || n === L.OM, where + '그림에 적힌 길이 ' + x); });
  });
  eq(Object.keys(kinds).sort().join(' '), '0half 1dist 1radius 2eq-dist 2eq-len', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'diameter half-answered no-square not-doubled', '실수의 종류');
  done('현');

  group('B26 — 접선의 길이와 각 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B26.tangent', function (p, pr, level, where) {
    var a = numChecks('B26.tangent', p, pr, where, bag), t = pr.text, L = lensOf(t), r = radiusOf(t), g = angOf(t), k, want, f = pr.figure, c = items(f, 'circle')[0], O = [c[1], c[2]], P = at(f, 'P'), segs = items(f, 'seg'), T = [segs[0][3], segs[0][4]], drawn;
    if (/\\overline\{PT\}\$의 길이는/.test(t)) { k = 'len'; want = Math.sqrt(L.OP * L.OP - r * r); }
    else if (/\\overline\{OP\}\$의 길이는/.test(t)) { k = 'op'; want = Math.sqrt(L.PT * L.PT + r * r); }
    else if (/둘레의 길이는/.test(t)) { k = 'peri'; want = 2 * L.PA + 2 * r; }
    else if (/넓이는 몇 \$\\mathrm\{cm\}\^\{2\}\$/.test(t)) { k = 'area'; want = r * Math.sqrt(L.OP * L.OP - r * r); }
    else if (/\\angle AOB\$의 크기는/.test(t)) { k = 'apb'; want = 360 - 90 - 90 - g.APB; }
    else if (/\\angle APB\$의 크기는/.test(t)) { k = 'aob'; want = 360 - 90 - 90 - g.AOB; }
    else { k = 'pab'; ok(/\\angle PAB\$의 크기는/.test(t), where + '모르는 문제: ' + t); want = (180 - g.APB) / 2; }
    kinds[level + k] = 1; ok(near(a, want), where + '값 ' + a + ' ≠ ' + want);
    /* 그림: 접점은 원 위에 있고 접선은 반지름과 수직(약 90°). 각 문제는 각 APB 를 실제 크기로 그린다 */
    P = [P[0] - 12, P[1]];
    ok(Math.abs(dist(T, O) - c[3]) <= 2 && Math.abs(angleAt(T, O, P) - 90) <= 3 && items(f, 'sq').length === (k === 'len' || k === 'op' ? 1 : 2), where + '그림의 접선');
    if (k === 'apb' || k === 'aob' || k === 'pab') { drawn = 2 * angleAt(P, T, O); ok(Math.abs(drawn - (k === 'aob' ? 180 - g.AOB : g.APB)) <= 4, where + '그림의 각 ' + drawn); ok(labels(f).indexOf('x') >= 0, where + '그림의 x'); }
  });
  eq(Object.keys(kinds).sort().join(' '), '0len 0op 1area 1peri 2aob 2apb 2pab', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), '360-minus 90-minus added area-not-perimeter half-angle half-area no-square not-halved one-side perimeter-not-area same subtracted used-op', '실수의 종류');
  done('접선');

  group('B26 — 삼각형의 내접원 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B26.incircle', function (p, pr, level, where) {
    var a = numChecks('B26.incircle', p, pr, where, bag), t = pr.text, L = lensOf(t), k, want, x, y, z, f = pr.figure, T = items(f, 'poly')[0][1], c = items(f, 'circle')[0], V, m;
    /* x · y · z: 꼭짓점 A · B · C 에서 나온 접선의 길이. AB = x + y, BC = y + z, CA = z + x */
    if ((m = /변 \$(AB|BC|CA)\$의 길이는 몇 cm/.exec(t))) { k = 'side'; x = L.AD; y = L.BE; z = L.CF; want = { AB: x + y, BC: y + z, CA: z + x }[m[1]]; }
    else if (/둘레의 길이는/.test(t)) { k = 'peri'; want = 2 * L.AB + 2 * L.CF; z = L.CF; x = null; }
    else if (/\\overline\{CF\}\$의 길이는/.test(t)) { k = 'chain'; x = L.AD; y = L.AB - x; z = L.BC - y; want = z; }
    else if (/\\overline\{AD\}\$의 길이는/.test(t)) { k = 'find'; x = (L.AB + L.CA - L.BC) / 2; y = L.AB - x; z = L.CA - x; want = x; }
    else { k = 'inradius'; ok(/반지름의 길이는/.test(t) && /\\angle C = 90/.test(t) && L.BC * L.BC + L.CA * L.CA === L.AB * L.AB, where + '직각삼각형이 아님: ' + t); z = (L.BC + L.CA - L.AB) / 2; x = L.CA - z; y = L.BC - z; want = z; ok(near(z, L.BC * L.CA / (L.AB + L.BC + L.CA)), where + '반지름 = 넓이 × 2 ÷ 둘레'); }
    kinds[level + k] = 1; ok(near(a, want), where + '값 ' + a + ' ≠ ' + want);
    if (x !== null) ok(x >= 1 && y >= 1 && z >= 1 && Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z), where + '조각의 길이');
    /* 그림: 원이 세 변에 모두 접한다(중심에서 세 변까지의 거리 = 반지름) */
    V = [[T[0], T[1]], [T[2], T[3]], [T[4], T[5]]];
    ok([[0, 1], [1, 2], [2, 0]].every(function (e) { return Math.abs(lineDist([c[1], c[2]], V[e[0]], V[e[1]]) - c[3]) <= 2.5; }), where + '그림의 원이 변에 접하지 않음');
    ok(['A', 'B', 'C', 'D', 'E', 'F', 'O'].every(function (s) { return labels(f).indexOf(s) >= 0; }) && items(f, 'dot').length === 4 && items(f, 'sq').length === (k === 'inradius' ? 1 : 0), where + '그림의 이름');
    if (x !== null) ok(Math.abs(dist(V[0], V[1]) / dist(V[1], V[2]) - (x + y) / (y + z)) <= 0.06, where + '그림의 변의 비');
  });
  eq(Object.keys(kinds).sort().join(' '), '0side 1chain 1peri 2find 2inradius', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'all-added direct not-doubled not-halved one-step other-vertex other-vertex-2 side-doubled-only wrong-pair wrong-pair-2', '실수의 종류');
  done('내접원');

  group('B26 — 원주각과 중심각 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B26.inscribed', function (p, pr, level, where) {
    var a = numChecks('B26.inscribed', p, pr, where, bag), t = pr.text, g = angOf(t), k, want, f = pr.figure, c = items(f, 'circle')[0], O = [c[1], c[2]], A = onCircle(f, 'A'), B = onCircle(f, 'B'), P = onCircle(f, 'P'), Q, drawn;
    ok(!!A && !!B && !!P, where + '그림의 점'); if (!A || !B || !P) return;
    if (/지름/.test(t)) { k = 'semi'; want = 180 - 90 - g.PAB; drawn = angleAt(B, P, A); ok(/\\angle PBA\$의 크기는/.test(t) && near(angleAt(O, A, B), 180, 1.5), where + '지름'); }
    else if (/네 점/.test(t)) { k = 'same-arc'; want = g.APB; Q = onCircle(f, 'Q'); drawn = angleAt(Q, A, B); ok(/\\angle AQB\$의 크기는/.test(t) && Math.abs(angleAt(P, A, B) - g.APB) <= 2, where + '같은 호'); }
    else if (/짧은 쪽의 호/.test(t)) { k = 'reflex'; want = (360 - g.AOB) / 2; drawn = angleAt(P, A, B); ok(Math.abs(angleAt(O, A, B) - g.AOB) <= 2, where + '그림의 중심각'); }
    else if (g.OAB) { k = 'iso'; want = (180 - 2 * g.OAB) / 2; drawn = angleAt(P, A, B); ok(Math.abs(angleAt(A, O, B) - g.OAB) <= 2, where + '그림의 밑각'); }
    else if (g.AOB) { k = 'c2i'; want = g.AOB / 2; drawn = angleAt(P, A, B); ok(/\\angle APB\$의 크기는/.test(t), where + '묻는 각'); }
    else { k = 'i2c'; want = 2 * g.APB; drawn = angleAt(O, A, B); ok(/\\angle AOB\$의 크기는/.test(t) && Math.abs(angleAt(P, A, B) - g.APB) <= 2, where + '그림의 원주각'); }
    kinds[level + k] = 1; ok(near(a, want), where + '값 ' + a + ' ≠ ' + want);
    /* 그림: 묻는 각을 좌표로 재면 답과 같다(실제 크기) */
    ok(Math.abs(drawn - a) <= (k === 'reflex' ? 3.5 : 2), where + '그림에서 잰 각 ' + drawn + ' ≠ 답 ' + a);
    ok(labels(f).indexOf('x') >= 0 && labels(f).indexOf('O') >= 0 && labels(f).filter(function (s) { return /°$/.test(s); }).length === 1, where + '그림의 글자');
  });
  eq(Object.keys(kinds).sort().join(' '), '0c2i 0i2c 1same-arc 1semi 2iso 2reflex', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'center-answered doubled halved minor same supp whole-turn', '실수의 종류');
  done('원주각');

  group('B26 — 원주각과 호의 길이 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B26.arc', function (p, pr, level, where) {
    var a = numChecks('B26.arc', p, pr, where, bag), t = pr.text, k, m, f = pr.figure, c, V, R, i, opp;
    if ((m = /길이는 \$(\d+)\\,\\mathrm\{cm\}\$, 호 \$CD\$의 길이는 \$(\d+)\\,\\mathrm\{cm\}\$예요\. 호 \$AB\$에 대한 원주각의 크기가 \$(\d+)\^\{\\circ\}\$일 때, 호 \$CD\$에 대한 원주각의 크기는 몇 도/.exec(t))) {
      k = 'angle'; ok(a * Number(m[1]) === Number(m[3]) * Number(m[2]) && !f, where + '정비례(각)'); if (level === 0) ok(Number(m[2]) % Number(m[1]) === 0, where + '0단계는 몇 배');
    } else if ((m = /크기는 \$(\d+)\^\{\\circ\}\$, 호 \$CD\$에 대한 원주각의 크기는 \$(\d+)\^\{\\circ\}\$예요\. 호 \$AB\$의 길이가 \$(\d+)\\,\\mathrm\{cm\}\$일 때, 호 \$CD\$의 길이는 몇 cm/.exec(t))) {
      k = 'length'; ok(a * Number(m[1]) === Number(m[3]) * Number(m[2]) && !f && Number(m[1]) < 180 && Number(m[2]) < 180, where + '정비례(길이)'); if (level === 0) ok(Number(m[2]) % Number(m[1]) === 0, where + '0단계는 몇 배');
    } else {
      m = /길이의 비가 \$(\d+) : (\d+) : (\d+)\$일 때, \$\\angle ([ABC])\$의 크기는/.exec(t); k = 'tri'; ok(!!m, where + '문제 글: ' + t); if (!m) return;
      R = { C: Number(m[1]), A: Number(m[2]), B: Number(m[3]) };   /* 호 AB 는 각 C, 호 BC 는 각 A, 호 CA 는 각 B 의 맞은편 */
      ok(a * (R.A + R.B + R.C) === 180 * R[m[4]], where + '원주각 = 180° × (맞은편 호) ÷ (전체)');
      /* 그림: 세 꼭짓점이 원 위에 있고, 삼각형의 각을 좌표로 재면 호의 비대로다 */
      c = items(f, 'circle')[0]; V = items(f, 'poly')[0][1]; V = { A: [V[0], V[1]], B: [V[2], V[3]], C: [V[4], V[5]] };
      ok(['A', 'B', 'C'].every(function (s) { return Math.abs(dist(V[s], [c[1], c[2]]) - c[3]) <= 2 && dist(at(f, s), V[s]) <= 14; }), where + '그림의 꼭짓점');
      i = m[4]; opp = ['A', 'B', 'C'].filter(function (s) { return s !== i; }); ok(Math.abs(angleAt(V[i], V[opp[0]], V[opp[1]]) - a) <= 2.5, where + '그림에서 잰 각');
    }
    kinds[level + k] = 1; ok(a < 180, where + '원주각은 180°보다 작다');
  });
  eq(Object.keys(kinds).sort().join(' '), '0angle 0length 1angle 1length 2tri', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added central inverse same wrong-part wrong-part-2', '실수의 종류');
  done('호의 길이');
})();
