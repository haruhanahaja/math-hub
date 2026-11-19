/* B24 닮음과 피타고라스 정리 — 닮음비, 넓이의 비, 피타고라스 정리
   유형(쉬운 것부터): B24.ratio 닮음비와 대응변 · B24.parallel 삼각형과 평행선 · B24.area 넓이의 비와 부피의 비 · B24.pyth 피타고라스 정리 (키패드, 자연수)
                     · B24.root 피타고라스 정리와 근호 · B24.right 직각삼각형인지 알아보기 (보기 고르기)
   답이 수 하나이면 키패드, 답에 근호가 들거나 판단을 묻는 문제는 보기 고르기다.
   길이는 모두 정수(또는 정수의 제곱근)로 다룬다. 근호는 제곱한 값(정수)으로 계산하고 rt(n) 으로 √n 을 가장 간단하게 쓴다.
   그림은 figure 'geo' 약도다. 길이를 적어 넣은 것이고 길이의 비는 맞지 않을 수 있다(직각 표시 · 평행 · 닮은 모양은 맞게 그린다). */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, order4 = A.order4, sameVal = A.sameVal, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var sgn = function (x) { return x < 0 ? -1 : 1; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!(q && ok(q)) && ++i < 200); return q; };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  var perm6 = function (r) { return r.shuffle([0, 1, 2, 3, 4, 5]); };

  /** 틀린 보기 후보의 차례: first 는 늘 앞에, rest 는 문제마다 섞은 차례(perm)로 */
  var mixc = function (first, rest, perm) {
    return first.concat(rest.map(function (c, i) { return [perm[i % perm.length], i, c]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }).map(function (x) { return x[2]; }));
  };
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B24', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; if (p.figure) out.figure = p.figure; return out; },
      solve: function (v) { return P(v).ans; },
      verify: function (v, ans) { return good(v) && ans === P(v).ans && options(v).indexOf(ans) >= 0; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: p.ans }; return out; },
      mistakes: o.ids.map(function (id) {
        var find = function (v) { return P(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
        return { id: id, wrong: function (v) { var w = find(v); return w ? w[0] : null; }, explain: function (v) { var w = find(v); return w ? w[2] : ''; } };
      })
    });
  };
  /* ── 틀: 수 하나(키패드). o.kind: 'int'(자연수) | 'signed'(부호 있는 정수)
     build(q) → { text, tex, ans: 정수, hints, steps, wrong: { 실수 id: 정수 }, check } ── */
  var numQ = function (o) {
    var lastQ = null, lastP = null, S = o.kind === 'signed';
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (n) { return S ? { n: n, p: 0 } : n; };
    var leak = function (p) { var a = String(p.ans); return p.ans > (S ? 0 : 19) && nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && (S ? p.ans !== 0 : p.ans >= 1) && p.check === true && !leak(p); }; });
    MH.defineType({
      id: o.id, unit: 'B24', version: 1, title: o.title,
      answer: { kind: o.kind },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; if (p.figure) out.figure = p.figure; return out; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v); return p.check === true && (S ? ans.p === 0 && ans.n === p.ans : ans === p.ans); },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), x = p.wrong[m[0]], i;
            /* 부호만 반대인 답은 공통 실수(sign)가 맡는다 */
            if (!isInt(x) || x === p.ans || (S ? x === 0 || x === -p.ans : x < 1)) return null;
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) if (p.wrong[o.mistakes[i][0]] === x) return null;
            return val(x);
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  var G = MH.geo, gcd = MH.gcd;
  var CM = '\\,\\mathrm{cm}', CM2 = '\\,\\mathrm{cm}^{2}', CM3 = '\\,\\mathrm{cm}^{3}';
  var cm = function (n) { return '$' + n + CM + '$'; };
  var u = function (n) { return n + ' cm'; };
  var intOr = function (n, d) { return d !== 0 && n % d === 0 ? n / d : null; };
  var enough = function (wrong, ans) { var ws = []; Object.keys(wrong).forEach(function (id) { var w = wrong[id]; if (isInt(w) && w >= 1 && w !== ans && ws.indexOf(w) < 0) ws.push(w); }); return ws.length >= 2; };
  var seg = function (P, Q, dash) { return dash ? ['seg', P[0], P[1], Q[0], Q[1], true] : ['seg', P[0], P[1], Q[0], Q[1]]; };
  var txt = function (x, y, s) { return ['text', Math.round(x), Math.round(y), String(s)]; };
  var flat = function (pts) { var out = []; pts.forEach(function (p) { out.push(p[0], p[1]); }); return out; };
  var geo = function (h, alt, items) { return { type: 'geo', h: h, alt: alt, items: items }; };
  var finish = function (o) {
    var seen = [o.ans], wrong = [];
    o.cands.forEach(function (c) {
      if (!c || !c[0] || wrong.length >= 3 || seen.indexOf(c[0]) >= 0 || wrong.some(function (w) { return w[1] === c[1]; })) return;
      seen.push(c[0]); wrong.push(c);
    });
    return { tex: o.tex, text: o.text, figure: o.figure, ans: o.ans, wrong: wrong, hints: o.hints, steps: o.steps, check: wrong.length === 3 && o.ok !== false };
  };
  /** n = k² × m 으로 나눈다(m 은 제곱수로 나누어떨어지지 않는다) */
  var simp = function (n) { var k = 1, i; for (i = 2; i * i <= n; i++) while (n % (i * i) === 0) { k *= i; n /= i * i; } return [k, n]; };
  /** √n 을 가장 간단하게 */
  var rt = function (n) { var s = simp(n); return s[1] === 1 ? String(s[0]) : (s[0] === 1 ? '' : s[0]) + '\\sqrt{' + s[1] + '}'; };
  var isSq = function (n) { return simp(n)[1] === 1; };
  var TRI = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  /** 피타고라스 수 하나: 배수를 곱하고 두 변의 차례를 섞는다 → [한 변, 다른 변, 빗변] */
  var triple = function (r, maxC) { var t = r.pick(TRI), k = r.int(1, Math.max(1, Math.floor(maxC / t[2]))), s = r.int(0, 1); return [t[s] * k, t[1 - s] * k, t[2] * k]; };

  /* ── 그림 ── */
  /** 닮은 두 삼각형(작은 ABC, 큰 DEF). lab: { AB, BC, DE, EF } 가운데 적을 것만 */
  var simFig = function (lab, alt) {
    var it = [['poly', [40, 150, 115, 150, 66, 90]], ['poly', [150, 150, 280, 150, 196, 46]], txt(66, 79, 'A'), txt(31, 157, 'B'), txt(124, 157, 'C'), txt(196, 35, 'D'), txt(141, 157, 'E'), txt(289, 157, 'F')];
    if (lab.AB) it.push(txt(53 - 12 - 3 * lab.AB.length, 116, lab.AB));
    if (lab.BC) it.push(txt(77, 165, lab.BC));
    if (lab.DE) it.push(txt(173 - 12 - 3 * lab.DE.length, 92, lab.DE));
    if (lab.EF) it.push(txt(215, 165, lab.EF));
    return geo(180, alt, it);
  };
  /** 삼각형 ABC 와 변 BC 에 평행한 선분 DE. f: AD ÷ AB(그리는 자리. 0.32 ~ 0.68 로 잡는다). lab: { AD, DB, AE, EC, DE, BC }. mid 이면 D, E 대신 M, N 이고 같은 길이 표시를 넣는다 */
  var parFig = function (f, lab, alt, mid) {
    var A = [150, 25], B = [50, 160], C = [260, 160], g = Math.max(0.36, Math.min(0.68, f));
    var D = [Math.round(A[0] + (B[0] - A[0]) * g), Math.round(A[1] + (B[1] - A[1]) * g)], E = [Math.round(A[0] + (C[0] - A[0]) * g), D[1]];
    var it = [['poly', flat([A, B, C])], seg(D, E), txt(150, 13, 'A'), txt(40, 167, 'B'), txt(270, 167, 'C'), txt(D[0] - 16, D[1] + 3, mid ? 'M' : 'D'), txt(E[0] + 16, E[1] + 3, mid ? 'N' : 'E')];
    var left = function (P, Q, s) { it.push(txt((P[0] + Q[0]) / 2 - 15 - 3 * s.length, (P[1] + Q[1]) / 2 - 3, s)); }, right = function (P, Q, s) { it.push(txt((P[0] + Q[0]) / 2 + 15 + 3 * s.length, (P[1] + Q[1]) / 2 - 3, s)); };
    if (mid) it.push(['tick', A[0], A[1], D[0], D[1]], ['tick', D[0], D[1], B[0], B[1]], ['tick', A[0], A[1], E[0], E[1]], ['tick', E[0], E[1], C[0], C[1]]);
    if (lab.AD) left(A, D, lab.AD); if (lab.DB) left(D, B, lab.DB); if (lab.AE) right(A, E, lab.AE); if (lab.EC) right(E, C, lab.EC);
    if (lab.DE) it.push(txt((D[0] + E[0]) / 2, D[1] + 13, lab.DE)); if (lab.BC) it.push(txt(155, 173, lab.BC));
    return geo(185, alt, it);
  };
  /** 직각삼각형. 직각은 왼쪽 아래. 가로 a, 세로 b(길이의 비대로 그리되 너무 납작하지 않게 잡는다). la · lb · lc: 가로 · 세로 · 빗변에 적을 글 */
  var rightFig = function (a, b, la, lb, lc, alt) {
    var s = Math.min(190 / a, 118 / b), w = Math.max(Math.round(a * s), 72), h = Math.max(Math.round(b * s), 56), x0 = Math.round(160 - w / 2), C = [x0, 150], B = [x0 + w, 150], A = [x0, 150 - h];
    var it = [['poly', flat([C, B, A])], ['sq', C[0], C[1], 0]];
    if (la) it.push(txt(x0 + w / 2, 165, la)); if (lb) it.push(txt(x0 - 12 - 3 * lb.length, 150 - h / 2, lb)); if (lc) it.push(txt(x0 + w / 2 + 10 + 3 * lc.length, 150 - h / 2 - 11, lc));
    return geo(180, alt, it);
  };

  /* ── B24.ratio 닮음비와 대응변 ─────────────────── */
  var R_KEY = '닮은 도형은 모양은 같고 크기만 다른 도형이에요. 사진을 확대하거나 축소한 것과 같아요. 확대하면 모든 변이 똑같은 배율로 늘어나고, 각의 크기는 그대로예요. 서로 짝이 되는 변을 대응변이라 하고, 대응변의 길이의 비를 닮음비라고 해요. 닮음비가 $1 : 2$이면 큰 도형의 모든 변이 작은 도형의 대응변의 2배예요. 넓이가 아니라 길이의 비라는 것을 기억해요.';
  var R_LAST = '① 서로 짝이 되는 변(대응변)을 찾아요. 닮음을 쓴 꼭짓점의 차례가 짝이에요. ② 닮음비를 확인하거나 대응변 한 쌍으로 구해요. ③ 비례식 (작은 도형의 변) : (큰 도형의 변) = (닮음비)를 세워요. ④ 큰 도형의 변이 더 긴지 확인해요.';
  var SIM = '$\\triangle ABC \\backsim \\triangle DEF$';
  var ratioBuild = function (q) {
    var k = q.k, m = q.m, n = q.n, t = q.t, w = q.w, up = q.up, g, text, ans, wrong = {}, steps, h2, fig, ab, bc, de, P;
    if (q.kind === 'times') {
      g = up ? q.a : q.a * k; ans = up ? q.a * k : q.a;
      text = SIM + '이고, 닮음비는 $1 : ' + k + '$' + pj(k, '이에요/예요') + '. ' + (up ? '$\\overline{AB} = ' + g + CM + '$일 때, 대응변 $\\overline{DE}$' : '$\\overline{DE} = ' + g + CM + '$일 때, 대응변 $\\overline{AB}$') + '의 길이는 몇 cm인가요?';
      fig = simFig(up ? { AB: u(g), DE: 'x' } : { AB: 'x', DE: u(g) }, '닮은 두 삼각형이 있다. 왼쪽의 작은 삼각형 ABC와 오른쪽의 큰 삼각형 DEF이다. ' + (up ? '변 AB의 길이는 ' + g + '센티미터이고 변 DE의 길이는 x이다.' : '변 DE의 길이는 ' + g + '센티미터이고 변 AB의 길이는 x이다.'));
      wrong.added = up ? g + k : g - k; wrong.inverse = up ? intOr(g, k) : g * k; wrong.same = g;
      steps = [{ say: '닮음비가 $1 : ' + k + '$이니 대응변의 길이의 비도 $1 : ' + k + '$' + pj(k, '이에요/예요') + '.', tex: '\\overline{AB} : \\overline{DE} = 1 : ' + k }, up ? { say: '큰 삼각형의 변은 작은 삼각형의 대응변의 $' + k + '$배예요.', tex: g + ' \\times ' + k + ' = ' + ans } : { say: '작은 삼각형의 변은 큰 삼각형의 대응변을 $' + k + '$' + pj(k, '으로/로') + ' 나눈 것이에요.', tex: g + ' \\div ' + k + ' = ' + ans }];
      h2 = '닮음비 $1 : ' + k + '$의 뜻은 "작은 삼각형의 변의 길이가 1이면 큰 삼각형의 대응변의 길이는 ' + k + '이다"예요. 곧 큰 삼각형 $DEF$의 모든 변은 작은 삼각형 $ABC$의 대응변의 ' + k + '배예요. 변 $AB$와 변 $DE$는 닮음을 쓴 차례에서 같은 자리에 있으니 대응변이에요. ' + (up ? '작은 쪽의 길이 ' + cm(g) + '를 알고 큰 쪽을 구하니 곱해요.' : '큰 쪽의 길이 ' + cm(g) + '를 알고 작은 쪽을 구하니 나눠요.') + ' 닮음비의 수를 더하거나 빼는 것이 아니에요.';
    } else if (q.kind === 'ratio') {
      ab = m * t; de = n * t; g = up ? ab : de; ans = up ? de : ab;
      text = SIM + '이고, 닮음비는 $' + m + ' : ' + n + '$' + pj(n, '이에요/예요') + '. ' + (up ? '$\\overline{AB} = ' + g + CM + '$일 때, 대응변 $\\overline{DE}$' : '$\\overline{DE} = ' + g + CM + '$일 때, 대응변 $\\overline{AB}$') + '의 길이는 몇 cm인가요?';
      fig = simFig(up ? { AB: u(g), DE: 'x' } : { AB: 'x', DE: u(g) }, '닮은 두 삼각형이 있다. 왼쪽의 작은 삼각형 ABC와 오른쪽의 큰 삼각형 DEF이다. ' + (up ? '변 AB의 길이는 ' + g + '센티미터이고 변 DE의 길이는 x이다.' : '변 DE의 길이는 ' + g + '센티미터이고 변 AB의 길이는 x이다.'));
      wrong.inverse = up ? intOr(g * m, n) : intOr(g * n, m); wrong.difference = up ? g + (n - m) : g - (n - m); wrong['ratio-only'] = up ? n : m; wrong.same = g;
      steps = [{ say: '대응변의 길이의 비가 닮음비와 같아요. 비례식을 세워요.', tex: up ? g + ' : x = ' + m + ' : ' + n : 'x : ' + g + ' = ' + m + ' : ' + n }, { say: '안쪽끼리 곱한 것과 바깥쪽끼리 곱한 것이 같아요.', tex: up ? m + ' \\times x = ' + g + ' \\times ' + n : n + ' \\times x = ' + g + ' \\times ' + m }, { say: '$x$ 앞의 수로 나눠요.', tex: 'x = ' + ans }];
      h2 = '닮음비 $' + m + ' : ' + n + '$' + pj(n, '은/는') + ' 삼각형 $ABC$의 변과 삼각형 $DEF$의 대응변의 길이의 비예요. 앞의 수가 $ABC$ 쪽, 뒤의 수가 $DEF$ 쪽이에요. 변 $AB$와 변 $DE$가 대응변이니, 구하는 길이를 $x$로 놓고 $\\overline{AB} : \\overline{DE}$가 닮음비와 같다는 비례식을 세워요. 주어진 길이 ' + cm(g) + '를 ' + (up ? '$AB$' : '$DE$') + ' 자리에 넣어요. 그다음 안쪽끼리, 바깥쪽끼리 곱해서 $x$를 구해요.';
    } else if (q.kind === 'find') {
      ab = m * t; bc = m * w; de = n * t; ans = n * w;
      text = '그림에서 ' + SIM + '예요. $\\overline{AB} = ' + ab + CM + '$, $\\overline{BC} = ' + bc + CM + '$, $\\overline{DE} = ' + de + CM + '$일 때, $\\overline{EF}$의 길이는 몇 cm인가요?';
      fig = simFig({ AB: u(ab), BC: u(bc), DE: u(de), EF: 'x' }, '닮은 두 삼각형이 있다. 왼쪽의 작은 삼각형 ABC는 변 AB가 ' + ab + '센티미터, 변 BC가 ' + bc + '센티미터이다. 오른쪽의 큰 삼각형 DEF는 변 DE가 ' + de + '센티미터이고 변 EF의 길이는 x이다.');
      wrong.difference = bc + (de - ab); wrong['wrong-pair'] = intOr(de * ab, bc); wrong.inverse = intOr(bc * ab, de); wrong.same = bc;
      steps = [{ say: '길이를 둘 다 아는 대응변 $AB$와 $DE$로 닮음비를 구해요.', tex: ab + ' : ' + de + ' = ' + m + ' : ' + n }, { say: '변 $BC$와 변 $EF$도 대응변이에요. 같은 비로 비례식을 세워요.', tex: bc + ' : x = ' + m + ' : ' + n }, { say: '안쪽끼리, 바깥쪽끼리 곱해서 $x$를 구해요.', tex: 'x = ' + ans }];
      h2 = '닮음비가 주어지지 않았으니 먼저 찾아야 해요. 두 삼각형에서 길이를 둘 다 아는 대응변 한 쌍을 찾아요. 변 $AB$와 변 $DE$예요. 이 둘의 길이 ' + cm(ab) + '와 ' + cm(de) + '의 비를 가장 간단한 자연수의 비로 고치면 닮음비예요. 그다음 구하는 변 $EF$의 짝을 찾아요. 닮음을 쓴 차례에서 같은 자리에 있는 변 $BC$예요. 변 $BC$와 변 $EF$의 길이의 비도 닮음비와 같다고 놓고 풀어요.';
    } else {
      P = m * t; ans = n * t;
      text = SIM + '이고, 닮음비는 $' + m + ' : ' + n + '$' + pj(n, '이에요/예요') + '. $\\triangle ABC$의 둘레의 길이가 ' + cm(P) + '일 때, $\\triangle DEF$의 둘레의 길이는 몇 cm인가요?';
      wrong.squared = intOr(P * n * n, m * m); wrong.difference = P + (n - m); wrong.inverse = intOr(P * m, n); wrong['ratio-only'] = n;
      steps = [{ say: '세 변이 모두 같은 비로 늘어나니, 세 변을 더한 둘레의 길이의 비도 닮음비와 같아요.', tex: P + ' : x = ' + m + ' : ' + n }, { say: '안쪽끼리, 바깥쪽끼리 곱해요.', tex: m + ' \\times x = ' + P + ' \\times ' + n }, { say: '$x$ 앞의 수로 나눠요.', tex: 'x = ' + ans }];
      h2 = '둘레는 세 변의 길이를 더한 것이에요. 닮은 도형에서는 세 변이 모두 똑같은 배율로 늘어나요. 변 하나하나가 같은 배율로 늘어나니, 그것들을 더한 둘레도 똑같은 배율로 늘어나요. 그래서 둘레의 길이의 비는 닮음비 $' + m + ' : ' + n + '$' + pj(n, '과/와') + ' 같아요. 둘레도 길이이기 때문이에요. 제곱하는 것은 넓이의 비를 구할 때예요. 구하는 둘레를 $x$로 놓고 ' + cm(P) + '와의 비가 닮음비와 같다는 비례식을 세워요.';
    }
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans), hints: [R_KEY, h2, R_LAST] };
  };
  var coprime = function (r, lo, hi) { var m, n; do { m = r.int(lo, hi - 1); n = r.int(m + 1, hi); } while (gcd(m, n) !== 1 || m === 1); return [m, n]; };
  numQ({
    id: 'B24.ratio', title: '닮음비와 대응변', kind: 'int', build: ratioBuild,
    mistakes: [['added', '닮음비의 수를 길이에 더하거나 뺐어요. 닮음비는 몇 배인지를 나타내요. 곱하거나 나눠야 해요.'],
      ['inverse', '곱할 것을 나누거나, 나눌 것을 곱했어요. 큰 도형의 변이 작은 도형의 대응변보다 길어야 해요. 비례식의 자리를 다시 확인해요.'],
      ['same', '주어진 길이를 그대로 답했어요. 닮은 도형은 모양만 같고 크기는 달라요. 닮음비만큼 길이가 달라져요.'],
      ['difference', '닮음비의 두 수의 차를 길이에 더하거나 뺐어요. 닮음은 같은 수를 더하는 것이 아니라 같은 수를 곱하는 것이에요.'],
      ['ratio-only', '닮음비에 나온 수를 그대로 답했어요. 닮음비는 길이 자체가 아니라 길이의 비예요. 비례식을 세워서 구해요.'],
      ['wrong-pair', '대응변이 아닌 변끼리 짝을 지었어요. 닮음을 쓴 꼭짓점의 차례대로 $AB$와 $DE$, $BC$와 $EF$가 짝이에요.'],
      ['squared', '닮음비를 제곱했어요. 제곱하는 것은 넓이의 비예요. 둘레는 길이이니 닮음비를 그대로 써요.']],
    levels: [
      { name: '닮음비가 1 : k', minDistinct: 90, vars: { q: sampler(function (r) { return until(function () { return { kind: 'times', k: r.int(2, 5), a: r.int(3, 15), up: r.int(0, 1) }; }, function (q) { return ratioBuild(q).check; }); }) } },
      { name: '닮음비가 m : n', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { var c = coprime(r, 2, 7); return { kind: 'ratio', m: c[0], n: c[1], t: r.int(2, 9), up: r.int(0, 1) }; }, function (q) { return ratioBuild(q).check; }); }) } },
      { name: '닮음비 찾기 · 둘레의 길이', minDistinct: 170, vars: { q: sampler(function (r) {
          return until(function () {
            var c = coprime(r, 2, 6), t = r.int(2, 6), w = r.int(2, 7);
            if (r.int(0, 2) === 0) return { kind: 'peri', m: c[0], n: c[1], t: r.int(4, 12) };
            return t === w ? null : { kind: 'find', m: c[0], n: c[1], t: t, w: w };
          }, function (q) { return ratioBuild(q).check; });
        }) } }
    ]
  });

  /* ── B24.parallel 삼각형과 평행선 ────────────────── */
  var L_KEY = '삼각형 $ABC$에서 변 $BC$에 평행한 선을 그어 두 변과 만나는 점을 $D$, $E$라고 해요. 그러면 작은 삼각형 $ADE$는 큰 삼각형 $ABC$를 그대로 줄인 닮은 도형이에요. 평행선의 동위각이 같아서 두 삼각형의 각이 모두 같기 때문이에요. 그래서 $\\overline{AD} : \\overline{AB} = \\overline{AE} : \\overline{AC} = \\overline{DE} : \\overline{BC}$예요. 또 두 변이 같은 비로 잘려서 $\\overline{AD} : \\overline{DB} = \\overline{AE} : \\overline{EC}$예요.';
  var L_LAST = '① 평행한 두 선분을 확인해요. ② 옆 변의 조각끼리 비교할 때는 $\\overline{AD} : \\overline{DB} = \\overline{AE} : \\overline{EC}$를 써요. ③ 평행한 선분 $DE$, $BC$가 나오면 삼각형 전체의 변으로 $\\overline{AD} : \\overline{AB} = \\overline{DE} : \\overline{BC}$를 써요. ④ $\\overline{AB} = \\overline{AD} + \\overline{DB}$예요.';
  var parBuild = function (q) {
    var k = q.k, ad = q.ad, db = q.db, ae = q.ae, de = q.de, g, text, ans, wrong = {}, steps, h2, fig, bc, ab, c1, c2;
    if (q.kind === 'mid') {
      g = q.back ? k : 2 * k; ans = q.back ? 2 * k : k;
      text = '그림의 삼각형 $ABC$에서 점 $M$, $N$은 각각 변 $AB$, 변 $AC$의 중점이에요. ' + (q.back ? '$\\overline{MN} = ' + g + CM + '$일 때, $\\overline{BC}$' : '$\\overline{BC} = ' + g + CM + '$일 때, $\\overline{MN}$') + '의 길이는 몇 cm인가요?';
      fig = parFig(0.5, q.back ? { DE: u(g), BC: 'x' } : { DE: 'x', BC: u(g) }, '삼각형 ABC에서 변 AB의 중점 M과 변 AC의 중점 N을 이었다. ' + (q.back ? '선분 MN의 길이는 ' + g + '센티미터이고 변 BC의 길이는 x이다.' : '변 BC의 길이는 ' + g + '센티미터이고 선분 MN의 길이는 x이다.'), true);
      wrong.same = g; wrong['wrong-way'] = q.back ? intOr(g, 2) : 2 * g; wrong.tripled = q.back ? 3 * g : intOr(g, 3);
      steps = [{ say: '두 변의 중점을 이은 선분은 나머지 변과 평행하고, 길이는 그 변의 절반이에요.', tex: '\\overline{MN} = \\dfrac{1}{2}\\,\\overline{BC}' }, q.back ? { say: '$\\overline{BC}$는 $\\overline{MN}$의 2배예요.', tex: '\\overline{BC} = 2 \\times ' + g + ' = ' + ans } : { say: '$\\overline{BC}$의 길이를 반으로 나눠요.', tex: '\\overline{MN} = ' + g + ' \\div 2 = ' + ans }];
      h2 = '중점은 선분을 똑같이 둘로 나누는 한가운데 점이에요. 점 $M$이 변 $AB$의 중점이니 $\\overline{AM}$은 $\\overline{AB}$의 절반이에요. 점 $N$도 마찬가지예요. 그러면 작은 삼각형 $AMN$은 큰 삼각형 $ABC$를 꼭 절반 크기로 줄인 닮은 도형이에요. 닮음비가 $1 : 2$이니 선분 $MN$과 변 $BC$의 길이의 비도 $1 : 2$예요. ' + (q.back ? '주어진 것이 작은 쪽 $MN$이니 큰 쪽 $BC$는 그보다 길어야 해요.' : '주어진 것이 큰 쪽 $BC$이니 작은 쪽 $MN$은 그보다 짧아야 해요.');
    } else if (q.kind === 'sides') {
      ans = ae * db / ad;
      text = '그림의 삼각형 $ABC$에서 $\\overline{DE}$와 $\\overline{BC}$는 평행해요. $\\overline{AD} = ' + ad + CM + '$, $\\overline{DB} = ' + db + CM + '$, $\\overline{AE} = ' + ae + CM + '$일 때, $\\overline{EC}$의 길이는 몇 cm인가요?';
      fig = parFig(ad / (ad + db), { AD: u(ad), DB: u(db), AE: u(ae), EC: 'x' }, '삼각형 ABC에서 변 AB 위의 점 D와 변 AC 위의 점 E를 이은 선분 DE가 변 BC와 평행하다. 선분 AD는 ' + ad + '센티미터, 선분 DB는 ' + db + '센티미터, 선분 AE는 ' + ae + '센티미터이고 선분 EC의 길이는 x이다.');
      wrong.inverse = intOr(ae * ad, db); wrong.difference = ae + (db - ad); wrong.same = ae; wrong['whole-ratio'] = intOr(ae * (ad + db), ad);
      steps = [{ say: '평행선이 두 변을 같은 비로 나눠요.', tex: '\\overline{AD} : \\overline{DB} = \\overline{AE} : \\overline{EC}' }, { say: '길이를 넣어요.', tex: ad + ' : ' + db + ' = ' + ae + ' : x' }, { say: '안쪽끼리, 바깥쪽끼리 곱해서 $x$를 구해요.', tex: 'x = ' + ans }];
      h2 = '변 $BC$에 평행한 선분 $DE$는 두 변 $AB$, $AC$를 똑같은 비로 잘라요. 사다리의 가로대가 양쪽 기둥을 같은 높이에서 만나는 것과 같아요. 그래서 왼쪽 변의 위 조각과 아래 조각의 비 $' + ad + ' : ' + db + '$' + pj(db, '이/가') + ' 오른쪽 변의 위 조각과 아래 조각의 비와 같아요. 오른쪽 변의 위 조각이 ' + cm(ae) + '이니, 아래 조각을 $x$로 놓고 비례식을 세워요. 위 조각끼리, 아래 조각끼리 같은 자리에 오도록 써요.';
    } else {
      ab = ad + db; bc = de * ab / ad; g = q.back ? bc : de; ans = q.back ? de : bc;
      text = '그림의 삼각형 $ABC$에서 $\\overline{DE}$와 $\\overline{BC}$는 평행해요. $\\overline{AD} = ' + ad + CM + '$, $\\overline{DB} = ' + db + CM + '$, ' + (q.back ? '$\\overline{BC} = ' + g + CM + '$일 때, $\\overline{DE}$' : '$\\overline{DE} = ' + g + CM + '$일 때, $\\overline{BC}$') + '의 길이는 몇 cm인가요?';
      fig = parFig(ad / ab, q.back ? { AD: u(ad), DB: u(db), DE: 'x', BC: u(g) } : { AD: u(ad), DB: u(db), DE: u(g), BC: 'x' }, '삼각형 ABC에서 변 AB 위의 점 D와 변 AC 위의 점 E를 이은 선분 DE가 변 BC와 평행하다. 선분 AD는 ' + ad + '센티미터, 선분 DB는 ' + db + '센티미터이다. ' + (q.back ? '변 BC는 ' + g + '센티미터이고 선분 DE의 길이는 x이다.' : '선분 DE는 ' + g + '센티미터이고 변 BC의 길이는 x이다.'));
      wrong['part-ratio'] = q.back ? intOr(g * ad, db) : intOr(g * db, ad); wrong.difference = q.back ? g - db : g + db; wrong.same = g; wrong.inverse = q.back ? intOr(g * ab, ad) : intOr(g * ad, ab);
      c1 = ad / gcd(ad, ab); c2 = ab / gcd(ad, ab);
      steps = [{ say: '삼각형 $ADE$와 삼각형 $ABC$가 닮았어요. 큰 삼각형의 변 $AB$의 길이를 먼저 구해요.', tex: '\\overline{AB} = ' + ad + ' + ' + db + ' = ' + ab }, { say: '닮음비는 $\\overline{AD} : \\overline{AB}$예요.', tex: ad + ' : ' + ab + (c1 === ad ? '' : ' = ' + c1 + ' : ' + c2) }, { say: '$\\overline{DE} : \\overline{BC}$도 같은 비예요. 비례식을 풀어요.', tex: (q.back ? 'x : ' + g : g + ' : x') + ' = ' + c1 + ' : ' + c2 + ',\\quad x = ' + ans }];
      h2 = '선분 $DE$와 변 $BC$는 서로 다른 삼각형의 변이에요. $DE$는 작은 삼각형 $ADE$의 변이고, $BC$는 큰 삼각형 $ABC$의 변이에요. 그러니 두 삼각형의 변끼리 비교해야 해요. 작은 삼각형의 변은 $AD$이고, 큰 삼각형의 대응변은 $DB$가 아니라 $AB$ 전체예요. 먼저 $' + ad + '$' + pj(ad, '과/와') + ' $' + db + '$' + pj(db, '을/를') + ' 더해서 $\\overline{AB}$를 구해요. 그다음 $\\overline{AD} : \\overline{AB}$와 $\\overline{DE} : \\overline{BC}$가 같다는 비례식을 세워요.';
    }
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans), hints: [L_KEY, h2, L_LAST] };
  };
  numQ({
    id: 'B24.parallel', title: '삼각형과 평행선', kind: 'int', build: parBuild,
    mistakes: [['same', '주어진 길이를 그대로 답했어요. 두 선분은 길이가 달라요. 비례식을 세워서 구해요.'],
      ['wrong-way', '2배 할 것을 반으로 나누거나, 반으로 나눌 것을 2배 했어요. 중점을 이은 선분 $MN$이 변 $BC$의 절반이에요.'],
      ['tripled', '3배 또는 3분의 1로 계산했어요. 중점은 변을 둘로 나누니 닮음비는 $1 : 2$예요.'],
      ['inverse', '비례식의 자리를 거꾸로 놓았어요. 위 조각끼리, 아래 조각끼리(또는 작은 삼각형끼리, 큰 삼각형끼리) 같은 자리에 써요.'],
      ['difference', '길이의 차를 더하거나 뺐어요. 평행선은 변을 같은 비로 나눠요. 같은 수를 더하는 것이 아니라 같은 수를 곱해요.'],
      ['whole-ratio', '$\\overline{AD} : \\overline{AB}$를 썼어요. 그렇게 구한 것은 $\\overline{AC}$ 전체의 길이예요. $\\overline{EC}$는 $\\overline{AD} : \\overline{DB}$로 구해요.'],
      ['part-ratio', '$\\overline{AD} : \\overline{DB}$를 썼어요. $DE$와 $BC$는 두 삼각형의 변이니, 삼각형 전체의 변으로 $\\overline{AD} : \\overline{AB}$를 써야 해요.']],
    levels: [
      { name: '중점을 이은 선분 · 쉬운 비', minDistinct: 60, vars: { q: sampler(function (r) {
          return until(function () { var ad = r.int(2, 6), j = r.int(2, 3); return r.int(0, 1) ? { kind: 'mid', k: r.int(3, 15), back: r.int(0, 1) } : { kind: 'sides', ad: ad, db: ad * j, ae: r.int(2, 7) }; }, function (q) { return (q.kind === 'mid' || q.ad !== q.ae) && parBuild(q).check; });
        }) } },
      { name: '두 변을 같은 비로 나누기', minDistinct: 110, vars: { q: sampler(function (r) {
          return until(function () { var c = coprime(r, 2, 5), s = r.int(0, 1), t = r.int(1, 4), w = r.int(2, 5); return t === w ? null : { kind: 'sides', ad: c[s] * t, db: c[1 - s] * t, ae: c[s] * w }; }, function (q) { return parBuild(q).check; });
        }) } },
      { name: '평행한 두 선분의 길이', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () {
            var ad = r.int(2, 8), db = r.int(2, 8), g = gcd(ad, ad + db), de = (ad / g) * r.int(1, 4);
            return ad === db || de < 2 || db * 7 < ad * 3 || ad * 7 < db * 3 ? null : { kind: 'base', ad: ad, db: db, de: de, back: r.int(0, 1) };
          }, function (q) { return parBuild(q).check; });
        }) } }
    ]
  });

  /* ── B24.area 넓이의 비와 부피의 비 ──────────────── */
  var S_KEY = '한 변이 1인 정사각형을 2배로 확대하면 한 변이 2가 돼요. 넓이는 $2 \\times 2 = 4$, 곧 4배가 돼요. 가로도 2배, 세로도 2배가 되기 때문이에요. 그래서 닮음비가 $m : n$이면 넓이의 비는 $m^{2} : n^{2}$이에요. 입체도형은 높이까지 늘어나니 부피의 비는 $m^{3} : n^{3}$이에요. 길이는 그대로, 넓이는 제곱, 부피는 세제곱이에요.';
  var S_LAST = '① 닮음비(길이의 비)를 확인해요. ② 넓이의 비는 닮음비의 두 수를 각각 제곱해요. 부피의 비는 각각 세제곱해요. ③ 비례식을 세워 구해요. ④ 큰 도형의 넓이 · 부피가 더 큰지 확인해요.';
  var FLAT = ['삼각형', '사각형', '오각형', '육각형'], SOLID = ['직육면체', '원기둥', '사각뿔', '원뿔'];
  var areaBuild = function (q) {
    var k = q.k, m = q.m, n = q.n, t = q.t, up = q.up, nm = (q.kind === 'vol' ? SOLID : FLAT)[q.s], g, text, ans, wrong = {}, steps, h2, s1, s2;
    if (q.kind === 'k2') {
      g = q.S; ans = g * k * k;
      text = '닮음비가 $1 : ' + k + '$인 두 닮은 ' + josa(nm, '이/가') + ' 있어요. 작은 ' + nm + '의 넓이가 $' + g + CM2 + '$일 때, 큰 ' + nm + '의 넓이는 몇 cm²인가요?';
      wrong['not-squared'] = g * k; wrong['doubled-instead'] = k === 2 ? null : g * 2 * k; wrong.cubed = g * k * k * k; wrong.added = g + k * k;
      steps = [{ say: '넓이의 비는 닮음비의 두 수를 각각 제곱한 것이에요.', tex: '1^{2} : ' + k + '^{2} = 1 : ' + k * k }, { say: '큰 ' + nm + '의 넓이는 작은 ' + nm + '의 넓이의 $' + k * k + '$배예요.', tex: g + ' \\times ' + k * k + ' = ' + ans }];
      h2 = '닮음비 $1 : ' + k + '$' + pj(k, '은/는') + ' 길이의 비예요. 큰 ' + nm + '은 작은 ' + nm + '보다 가로 방향으로도 ' + k + '배, 세로 방향으로도 ' + k + '배 늘어나 있어요. 넓이는 두 방향의 길이를 곱해서 정해지니, 넓이는 ' + k + '배가 아니라 ' + k + '배의 ' + k + '배가 돼요. 곧 닮음비의 수를 제곱한 만큼 커져요. 먼저 $' + k + '$' + pj(k, '을/를') + ' 제곱해서 넓이가 몇 배인지 구하고, 작은 ' + nm + '의 넓이 $' + g + '$에 곱해요.';
    } else if (q.kind === 'mn' || q.kind === 'vol') {
      var e = q.kind === 'vol' ? 3 : 2, pw = function (x) { return e === 3 ? x * x * x : x * x; }, U = e === 3 ? CM3 : CM2, word = e === 3 ? '부피' : '넓이', unit = e === 3 ? 'cm³' : 'cm²';
      s1 = pw(m) * t; s2 = pw(n) * t; g = up ? s1 : s2; ans = up ? s2 : s1;
      text = '닮음비가 $' + m + ' : ' + n + '$인 두 닮은 ' + josa(nm, '이/가') + ' 있어요. ' + (up ? '작은' : '큰') + ' ' + nm + '의 ' + word + josa(word, '이/가').slice(word.length) + ' $' + g + U + '$일 때, ' + (up ? '큰' : '작은') + ' ' + nm + '의 ' + word + '는 몇 ' + unit + '인가요?';
      wrong['not-squared'] = up ? intOr(g * n, m) : intOr(g * m, n); wrong.inverse = up ? intOr(g * pw(m), pw(n)) : intOr(g * pw(n), pw(m)); wrong['wrong-power'] = e === 3 ? (up ? intOr(g * n * n, m * m) : intOr(g * m * m, n * n)) : (up ? intOr(g * n * n * n, m * m * m) : intOr(g * m * m * m, n * n * n)); wrong.difference = up ? g + (pw(n) - pw(m)) : g - (pw(n) - pw(m));
      steps = [{ say: word + '의 비는 닮음비의 두 수를 각각 ' + (e === 3 ? '세제곱' : '제곱') + '한 것이에요.', tex: m + '^{' + e + '} : ' + n + '^{' + e + '} = ' + pw(m) + ' : ' + pw(n) }, { say: '구하는 ' + word + '를 $x$로 놓고 비례식을 세워요.', tex: (up ? g + ' : x' : 'x : ' + g) + ' = ' + pw(m) + ' : ' + pw(n) }, { say: '안쪽끼리, 바깥쪽끼리 곱해서 $x$를 구해요.', tex: 'x = ' + ans }];
      h2 = e === 3
        ? '닮음비 $' + m + ' : ' + n + '$' + pj(n, '은/는') + ' 길이의 비예요. 입체도형은 가로, 세로, 높이의 세 방향으로 모두 같은 배율로 늘어나요. 부피는 세 방향의 길이를 곱해서 정해지니, 부피의 비는 닮음비의 두 수를 각각 세 번씩 곱한 것이에요. 먼저 $' + m + '$' + pj(m, '과/와') + ' $' + n + '$' + pj(n, '을/를') + ' 각각 세제곱해서 부피의 비를 구해요. 그다음 주어진 부피 $' + g + '$' + pj(g, '을/를') + ' ' + (up ? '작은' : '큰') + ' 쪽 자리에 넣고 비례식을 풀어요.'
        : '닮음비 $' + m + ' : ' + n + '$' + pj(n, '은/는') + ' 길이의 비예요. 넓이는 가로와 세로, 두 방향의 길이를 곱해서 정해져요. 두 방향이 모두 같은 배율로 늘어나니, 넓이의 비는 닮음비의 두 수를 각각 제곱한 것이에요. 먼저 $' + m + '$' + pj(m, '과/와') + ' $' + n + '$' + pj(n, '을/를') + ' 각각 제곱해서 넓이의 비를 구해요. 그다음 주어진 넓이 $' + g + '$' + pj(g, '을/를') + ' ' + (up ? '작은' : '큰') + ' 쪽 자리에 넣고 비례식을 풀어요.';
    } else {
      s1 = m * m * q.j; s2 = n * n * q.j; g = m * t; ans = n * t;
      text = '두 닮은 ' + nm + '의 넓이가 $' + s1 + CM2 + '$, $' + s2 + CM2 + '$예요. 작은 ' + nm + '의 한 변의 길이가 ' + cm(g) + '일 때, 큰 ' + nm + '에서 그 변에 대응하는 변의 길이는 몇 cm인가요?';
      wrong['area-ratio-used'] = intOr(g * s2, s1); wrong.same = g; wrong.difference = g + (n - m); wrong.inverse = intOr(g * m, n);
      steps = [{ say: '넓이의 비를 가장 간단한 자연수의 비로 고쳐요.', tex: s1 + ' : ' + s2 + ' = ' + m * m + ' : ' + n * n }, { say: '넓이의 비는 닮음비를 제곱한 것이에요. 제곱해서 그 수가 되는 수를 찾으면 닮음비예요.', tex: m * m + ' : ' + n * n + ' = ' + m + '^{2} : ' + n + '^{2},\\quad \\text{닮음비 } ' + m + ' : ' + n }, { say: '대응변의 길이의 비가 닮음비와 같아요.', tex: g + ' : x = ' + m + ' : ' + n + ',\\quad x = ' + ans }];
      h2 = '거꾸로 가는 문제예요. 넓이의 비는 닮음비의 두 수를 각각 제곱한 것이었어요. 그러니 넓이의 비에서 닮음비로 돌아가려면 제곱을 풀어야 해요. 먼저 두 넓이 $' + s1 + '$' + pj(s1, '과/와') + ' $' + s2 + '$의 비를 가장 간단한 자연수의 비로 고쳐요. 그 두 수는 각각 어떤 수를 제곱한 수예요. 제곱해서 그 수가 되는 자연수를 찾으면 그것이 닮음비예요. 변의 길이는 넓이의 비가 아니라 이 닮음비로 구해요.';
    }
    return { text: text, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans), hints: [S_KEY, h2, S_LAST] };
  };
  numQ({
    id: 'B24.area', title: '넓이의 비와 부피의 비', kind: 'int', build: areaBuild,
    mistakes: [['not-squared', '닮음비를 그대로 썼어요. 닮음비는 길이의 비예요. 넓이의 비는 제곱, 부피의 비는 세제곱해야 해요.'],
      ['doubled-instead', '제곱하지 않고 2를 곱했어요. 제곱은 같은 수를 두 번 곱하는 것이에요. $3^{2}$은 6이 아니라 9예요.'],
      ['cubed', '세제곱했어요. 세제곱은 부피의 비예요. 넓이의 비는 닮음비를 제곱해요.'],
      ['added', '몇 배인지 구한 수를 곱하지 않고 더했어요. 넓이의 비는 몇 배인지를 나타내니 곱해요.'],
      ['inverse', '비례식의 자리를 거꾸로 놓았어요. 큰 도형의 넓이 · 부피가 작은 도형보다 커야 해요.'],
      ['wrong-power', '넓이와 부피의 지수를 헷갈렸어요. 넓이의 비는 제곱, 부피의 비는 세제곱이에요.'],
      ['difference', '비의 두 수의 차를 더하거나 뺐어요. 비는 같은 수를 더하는 것이 아니라 같은 수를 곱하는 관계예요.'],
      ['area-ratio-used', '넓이의 비를 그대로 길이에 썼어요. 길이의 비(닮음비)는 넓이의 비의 제곱을 푼 것이에요.'],
      ['same', '주어진 길이를 그대로 답했어요. 넓이가 다르니 두 도형의 크기가 달라요. 닮음비를 구해서 계산해요.']],
    levels: [
      { name: '닮음비가 1 : k일 때 넓이', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { return { kind: 'k2', k: r.int(2, 5), S: r.int(2, 15), s: r.int(0, 3) }; }, function (q) { return areaBuild(q).check; }); }) } },
      { name: '닮음비가 m : n일 때 넓이', minDistinct: 180, vars: { q: sampler(function (r) { return until(function () { var c = coprime(r, 2, 6); return { kind: 'mn', m: c[0], n: c[1], t: r.int(1, 6), up: r.int(0, 1), s: r.int(0, 3) }; }, function (q) { return areaBuild(q).check; }); }) } },
      { name: '부피의 비 · 넓이의 비로 길이 구하기', minDistinct: 250, vars: { q: sampler(function (r) {
          return until(function () {
            var c = r.int(0, 2) ? coprime(r, 2, 5) : [1, r.int(2, 4)];
            if (r.int(0, 1)) return { kind: 'vol', m: c[0], n: c[1], t: r.int(1, 5), up: r.int(0, 1), s: r.int(0, 3) };
            return { kind: 'back', m: c[0], n: c[1], j: r.int(1, 4), t: r.int(2, 8), s: r.int(0, 3) };
          }, function (q) { return areaBuild(q).check; });
        }) } }
    ]
  });

  /* ── B24.pyth 피타고라스 정리 (답이 자연수) ──────────── */
  var P_KEY = '직각삼각형에서 직각을 마주 보는 가장 긴 변을 빗변이라고 해요. 피타고라스 정리는 "직각을 낀 두 변을 각각 제곱해서 더하면 빗변의 제곱과 같다"는 것이에요. 두 변이 $a$, $b$이고 빗변이 $c$이면 $a^{2} + b^{2} = c^{2}$이에요. 두 변 위에 그린 정사각형 두 개의 넓이를 합치면 빗변 위에 그린 정사각형의 넓이와 꼭 같아요. 길이를 그냥 더하는 것이 아니라 제곱해서 더해요.';
  var P_LAST = '① 직각 표시를 찾고, 그 맞은편의 빗변을 찾아요. ② 빗변을 구할 때는 두 변의 제곱을 더해요. ③ 다른 변을 구할 때는 빗변의 제곱에서 아는 변의 제곱을 빼요. ④ 제곱해서 그 수가 되는 수를 찾아요. 빗변이 가장 긴지 확인해요.';
  var pythBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, text, ans, wrong = {}, steps, h2, fig;
    var sqStep = function (x, y, plus) { return x + '^{2} ' + (plus ? '+' : '-') + ' ' + y + '^{2} = ' + x * x + ' ' + (plus ? '+' : '-') + ' ' + y * y + ' = ' + (plus ? x * x + y * y : x * x - y * y); };
    if (q.kind === 'hyp') {
      ans = c; text = '그림의 직각삼각형에서 직각을 낀 두 변의 길이가 ' + cm(a) + ', ' + cm(b) + '예요. 빗변의 길이 $x$는 몇 cm인가요?';
      fig = rightFig(a, b, u(a), u(b), 'x', '직각삼각형이 있다. 직각은 왼쪽 아래에 있다. 가로로 놓인 변은 ' + a + '센티미터, 세로로 놓인 변은 ' + b + '센티미터이고, 비스듬한 빗변의 길이는 x이다.');
      wrong.added = a + b; wrong['not-rooted'] = a * a + b * b; wrong.subtracted = abs(a - b); wrong['doubled-sum'] = 2 * (a + b);
      steps = [{ say: '직각을 낀 두 변을 각각 제곱해서 더하면 빗변의 제곱이에요.', tex: 'x^{2} = ' + sqStep(a, b, true) }, { say: '제곱해서 $' + c * c + '$' + pj(c * c, '이/가') + ' 되는 양수를 찾아요.', tex: 'x = ' + ans }];
      h2 = '구하는 변 $x$는 직각의 맞은편에 있는 빗변이에요. 빗변의 제곱은 나머지 두 변의 제곱을 더한 것과 같아요. 먼저 ' + cm(a) + '를 제곱하고, ' + cm(b) + '도 제곱해요. 제곱은 같은 수를 두 번 곱하는 것이에요. 두 값을 더하면 $x^{2}$, 곧 빗변을 제곱한 값이 나와요. 여기서 멈추면 안 돼요. 같은 수를 두 번 곱해서 그 값이 되는 수를 찾아야 빗변의 길이예요. 구구단이나 제곱수를 떠올려 봐요.';
    } else if (q.kind === 'leg') {
      ans = b; text = '그림의 직각삼각형에서 빗변의 길이가 ' + cm(c) + '이고 다른 한 변의 길이가 ' + cm(a) + '예요. 나머지 한 변의 길이 $x$는 몇 cm인가요?';
      fig = rightFig(a, b, u(a), 'x', u(c), '직각삼각형이 있다. 직각은 왼쪽 아래에 있다. 가로로 놓인 변은 ' + a + '센티미터, 비스듬한 빗변은 ' + c + '센티미터이고, 세로로 놓인 변의 길이는 x이다.');
      wrong.subtracted = c - a; wrong['not-rooted'] = c * c - a * a; wrong.added = c + a; wrong['halved'] = intOr(c * c - a * a, 2);
      steps = [{ say: '빗변의 제곱에서 아는 변의 제곱을 빼면 나머지 변의 제곱이에요.', tex: 'x^{2} = ' + sqStep(c, a, false) }, { say: '제곱해서 $' + b * b + '$' + pj(b * b, '이/가') + ' 되는 양수를 찾아요.', tex: 'x = ' + ans }];
      h2 = '이번에는 빗변을 알고 있고, 직각을 낀 변 하나를 구해요. 피타고라스 정리에서 두 변의 제곱을 더하면 빗변의 제곱이었어요. 거꾸로, 빗변의 제곱에서 한 변의 제곱을 빼면 나머지 변의 제곱이 남아요. 먼저 빗변 ' + cm(c) + '를 제곱하고, 아는 변 ' + cm(a) + '를 제곱해요. 큰 것에서 작은 것을 빼요. 그 값이 $x^{2}$이에요. 마지막으로 같은 수를 두 번 곱해서 그 값이 되는 수를 찾아요.';
    } else if (q.kind === 'rect') {
      ans = c; text = '가로의 길이가 ' + cm(a) + ', 세로의 길이가 ' + cm(b) + '인 직사각형의 대각선의 길이는 몇 cm인가요?';
      fig = geo(180, '직사각형이 있다. 가로는 ' + a + '센티미터, 세로는 ' + b + '센티미터이고, 왼쪽 아래 꼭짓점과 오른쪽 위 꼭짓점을 이은 대각선의 길이는 x이다.', [['poly', [60, 150, 250, 150, 250, 50, 60, 50]], seg([60, 150], [250, 50], true), ['sq', 250, 150, 90], txt(155, 165, u(a)), txt(250 + 12 + 3 * u(b).length, 100, u(b)), txt(145, 88, 'x')]);
      wrong.added = a + b; wrong['not-rooted'] = a * a + b * b; wrong.perimeter = 2 * (a + b); wrong.area = a * b;
      steps = [{ say: '대각선을 그으면 가로, 세로를 두 변으로 하는 직각삼각형이 생겨요. 대각선이 빗변이에요.', tex: 'x^{2} = ' + sqStep(a, b, true) }, { say: '제곱해서 $' + c * c + '$' + pj(c * c, '이/가') + ' 되는 양수를 찾아요.', tex: 'x = ' + ans }];
      h2 = '직사각형에 대각선을 하나 그으면 직사각형이 직각삼각형 두 개로 나뉘어요. 직사각형의 네 각은 모두 직각이기 때문이에요. 그 직각삼각형에서 직각을 낀 두 변은 직사각형의 가로 ' + cm(a) + '와 세로 ' + cm(b) + '이고, 대각선은 직각의 맞은편에 있는 빗변이에요. 그러니 피타고라스 정리를 그대로 쓸 수 있어요. 가로와 세로를 각각 제곱해서 더하고, 제곱해서 그 값이 되는 수를 찾아요.';
    } else if (q.kind === 'iso') {
      ans = b; text = '그림의 이등변삼각형은 길이가 같은 두 변이 ' + cm(c) + '이고 밑변이 ' + cm(2 * a) + '예요. 꼭짓점에서 밑변에 내린 높이 $x$는 몇 cm인가요?';
      fig = geo(185, '이등변삼각형이 있다. 길이가 같은 두 변은 각각 ' + c + '센티미터이고 밑변은 ' + 2 * a + '센티미터이다. 위 꼭짓점에서 밑변의 한가운데로 직각으로 내린 높이의 길이는 x이다.', [['poly', [70, 155, 230, 155, 150, 30]], seg([150, 30], [150, 155], true), ['sq', 150, 155, 0], ['tick', 70, 155, 150, 30], ['tick', 230, 155, 150, 30], txt(150, 171, u(2 * a)), txt(190 + 14 + 3 * u(c).length, 88, u(c)), txt(161, 100, 'x')]);
      wrong.subtracted = c - a; wrong['not-rooted'] = c * c - a * a; wrong['full-subtracted'] = c - 2 * a;
      steps = [{ say: '이등변삼각형의 높이는 밑변을 똑같이 둘로 나눠요. 밑변의 절반을 구해요.', tex: 2 * a + ' \\div 2 = ' + a }, { say: '높이, 밑변의 절반, 비스듬한 변으로 직각삼각형이 생겨요. 빗변은 $' + c + '$' + pj(c, '이에요/예요') + '.', tex: 'x^{2} = ' + sqStep(c, a, false) }, { say: '제곱해서 $' + b * b + '$' + pj(b * b, '이/가') + ' 되는 양수를 찾아요.', tex: 'x = ' + ans }];
      h2 = '이등변삼각형은 가운데를 따라 접으면 딱 포개져요. 그래서 꼭짓점에서 내린 높이는 밑변을 똑같이 둘로 나눠요. 높이를 그으면 왼쪽과 오른쪽에 똑같은 직각삼각형이 하나씩 생겨요. 그 직각삼각형의 빗변은 비스듬한 변 ' + cm(c) + '이고, 한 변은 밑변 전체가 아니라 밑변 ' + cm(2 * a) + '의 절반이에요. 나머지 한 변이 높이 $x$예요. 밑변을 반으로 나누는 것을 먼저 하고, 빗변의 제곱에서 그 절반의 제곱을 빼요.';
    } else {
      ans = b; text = '길이가 ' + cm(c).replace('cm', 'm') + '인 사다리를 벽에 기대어 세웠어요. 사다리의 아래 끝이 벽에서 ' + cm(a).replace('cm', 'm') + ' 떨어져 있을 때, 사다리의 위 끝은 바닥에서 몇 m 높이에 있나요? (벽과 바닥은 직각으로 만나요.)';
      wrong.subtracted = c - a; wrong['not-rooted'] = c * c - a * a; wrong.added = c + a;
      steps = [{ say: '벽, 바닥, 사다리로 직각삼각형이 생겨요. 사다리가 빗변이에요.', tex: 'x^{2} = ' + sqStep(c, a, false) }, { say: '제곱해서 $' + b * b + '$' + pj(b * b, '이/가') + ' 되는 양수를 찾아요.', tex: 'x = ' + ans }];
      h2 = '그림을 머릿속에 그려 봐요. 벽은 세로로 서 있고 바닥은 가로로 놓여 있고, 둘은 직각으로 만나요. 사다리는 그 사이에 비스듬히 걸쳐 있어요. 그러면 벽, 바닥, 사다리가 직각삼각형을 이루어요. 직각의 맞은편에 비스듬히 놓인 사다리가 빗변이에요. 바닥에서 벽까지 떨어진 거리가 한 변이고, 구하는 높이가 나머지 한 변이에요. 빗변인 사다리의 길이를 제곱하고, 거기서 떨어진 거리의 제곱을 빼요.';
    }
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans), hints: [P_KEY, h2, P_LAST] };
  };
  numQ({
    id: 'B24.pyth', title: '피타고라스 정리', kind: 'int', build: pythBuild,
    mistakes: [['added', '길이를 그냥 더했어요. 피타고라스 정리는 길이를 각각 제곱한 다음 더하거나 빼는 것이에요.'],
      ['not-rooted', '제곱한 값을 그대로 답했어요. 그 값은 구하는 변을 제곱한 것이에요. 제곱해서 그 값이 되는 수를 찾아야 해요.'],
      ['subtracted', '길이를 그냥 뺐어요. 길이를 각각 제곱한 다음에 계산하고, 마지막에 제곱해서 그 값이 되는 수를 찾아요.'],
      ['doubled-sum', '두 변을 더해서 2배 했어요. 제곱은 2를 곱하는 것이 아니라 같은 수를 두 번 곱하는 것이에요.'],
      ['halved', '제곱을 푼다고 2로 나눴어요. 제곱의 반대는 2로 나누는 것이 아니라, 두 번 곱해서 그 값이 되는 수를 찾는 것이에요.'],
      ['perimeter', '둘레의 길이를 구했어요. 대각선은 가로와 세로로 만든 직각삼각형의 빗변이에요.'],
      ['area', '넓이를 구했어요. 대각선의 길이는 가로와 세로를 각각 제곱해서 더한 다음 구해요.'],
      ['full-subtracted', '비스듬한 변에서 밑변을 그냥 뺐어요. 밑변의 절반으로 직각삼각형을 만들고 제곱해서 계산해요.']],
    levels: [
      { name: '빗변의 길이', minDistinct: 20, vars: { q: sampler(function (r) { return until(function () { var t = triple(r, 30); return { kind: 'hyp', a: t[0], b: t[1], c: t[2] }; }, function (q) { return pythBuild(q).check; }); }) } },
      { name: '다른 한 변의 길이', minDistinct: 20, vars: { q: sampler(function (r) { return until(function () { var t = triple(r, 30); return { kind: 'leg', a: t[0], b: t[1], c: t[2] }; }, function (q) { return pythBuild(q).check; }); }) } },
      { name: '직사각형의 대각선 · 이등변삼각형의 높이 · 활용', minDistinct: 40, vars: { q: sampler(function (r) {
          return until(function () { var k = r.int(0, 2), t = triple(r, k === 2 ? 26 : 30); if (k === 0 && t[0] < t[1]) t = [t[1], t[0], t[2]]; return { kind: ['rect', 'iso', 'ladder'][k], a: t[0], b: t[1], c: t[2] }; }, function (q) { return pythBuild(q).check; });
        }) } }
    ]
  });

  /* ── B24.root 피타고라스 정리 (답에 근호) ───────────── */
  var T_KEY = '피타고라스 정리로 구한 제곱이 $25$나 $36$ 같은 제곱수가 아닐 때도 많아요. 그럴 때는 근호를 써서 나타내요. $x^{2} = 5$이면 $x = \\sqrt{5}$예요. 근호 안에 제곱수가 숨어 있으면 밖으로 꺼내요. $\\sqrt{20} = \\sqrt{4 \\times 5} = 2\\sqrt{5}$예요. 계산은 똑같아요. 직각을 낀 두 변을 제곱해서 더하면 빗변의 제곱이고, 마지막에 근호를 씌워요.';
  var T_LAST = '① 빗변을 찾아요. ② 빗변을 구하면 제곱의 합, 다른 변을 구하면 제곱의 차를 계산해요. ③ 그 값에 근호를 씌워요. ④ 근호 안에 $4$, $9$, $16$ 같은 제곱수가 곱해져 있으면 밖으로 꺼내요.';
  var L = function (s) { return s + CM; };
  var rootBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, v, s, text, ans, cands, steps, h2, fig;
    var outStep = function (n) { var x = simp(n); return x[0] === 1 ? { say: '근호 안에 제곱수가 숨어 있지 않으니 그대로 답이에요.', tex: 'x = ' + rt(n) } : { say: '$' + n + ' = ' + x[0] * x[0] + ' \\times ' + x[1] + '$이니 제곱수 $' + x[0] * x[0] + '$' + pj(x[0] * x[0], '을/를') + ' 근호 밖으로 꺼내요.', tex: 'x = \\sqrt{' + n + '} = ' + rt(n) }; };
    if (q.kind === 'hyp') {
      v = a * a + b * b; ans = L(rt(v)); text = '그림의 직각삼각형에서 직각을 낀 두 변의 길이가 ' + cm(a) + ', ' + cm(b) + '예요. 빗변의 길이 $x$를 고르세요.';
      fig = rightFig(a, b, u(a), u(b), 'x', '직각삼각형이 있다. 직각은 왼쪽 아래에 있다. 가로로 놓인 변은 ' + a + '센티미터, 세로로 놓인 변은 ' + b + '센티미터이고, 비스듬한 빗변의 길이는 x이다.');
      cands = mixc([[L(String(a + b)), 'added', '두 변의 길이를 그냥 더했어요. 각각 제곱해서 더한 다음 근호를 씌워요. 빗변은 두 변의 합보다 짧아요.']], [
        [L(String(v)), 'not-rooted', '제곱의 합 $' + v + '$' + pj(v, '을/를') + ' 그대로 답했어요. 그 값은 $x^{2}$이에요. 근호를 씌워야 $x$예요.'],
        a !== b ? [L(rt(abs(a * a - b * b))), 'subtracted', '두 변의 제곱을 뺐어요. 빗변을 구할 때는 두 변의 제곱을 더해요. 빼는 것은 다른 변을 구할 때예요.'] : null,
        [L(rt(a + b)), 'root-of-sum', '제곱하지 않고 더한 값에 근호를 씌웠어요. 먼저 두 변을 각각 제곱해서 더해요.'],
        [L(rt(2 * v)), 'doubled', '제곱의 합을 2배 했어요. 두 변의 제곱을 한 번씩만 더해요.']], q.perm);
      steps = [{ say: '직각을 낀 두 변을 각각 제곱해서 더하면 빗변의 제곱이에요.', tex: 'x^{2} = ' + a + '^{2} + ' + b + '^{2} = ' + a * a + ' + ' + b * b + ' = ' + v }, outStep(v)];
      steps[steps.length - 1] = { say: steps[steps.length - 1].say, tex: ans };
      h2 = '구하는 변 $x$는 직각의 맞은편에 있는 빗변이에요. 먼저 두 변 ' + cm(a) + ', ' + cm(b) + '를 각각 제곱해요. 두 값을 더하면 $x^{2}$이 나와요. 이번에는 그 값이 제곱수가 아니에요. 어떤 자연수를 두 번 곱해도 그 값이 되지 않아요. 그럴 때는 그 값에 근호를 씌운 것이 답이에요. 마지막으로 근호 안의 수를 살펴요. $4$, $9$, $16$, $25$ 같은 제곱수로 나누어떨어지면 그 제곱수를 근호 밖으로 꺼내요.';
    } else if (q.kind === 'leg') {
      v = c * c - a * a; ans = L(rt(v)); text = '그림의 직각삼각형에서 빗변의 길이가 ' + cm(c) + '이고 다른 한 변의 길이가 ' + cm(a) + '예요. 나머지 한 변의 길이 $x$를 고르세요.';
      fig = rightFig(a, Math.max(2, simp(v)[0]), u(a), 'x', u(c), '직각삼각형이 있다. 직각은 왼쪽 아래에 있다. 가로로 놓인 변은 ' + a + '센티미터, 비스듬한 빗변은 ' + c + '센티미터이고, 세로로 놓인 변의 길이는 x이다.');
      cands = mixc([[L(rt(c * c + a * a)), 'added-squares', '두 변의 제곱을 더했어요. 빗변을 알고 다른 변을 구할 때는 빗변의 제곱에서 빼요. 빗변이 가장 길어야 해요.']], [
        [L(String(c - a)), 'subtracted', '길이를 그냥 뺐어요. 각각 제곱한 다음 빼고, 마지막에 근호를 씌워요.'],
        [L(String(v)), 'not-rooted', '제곱의 차 $' + v + '$' + pj(v, '을/를') + ' 그대로 답했어요. 그 값은 $x^{2}$이에요. 근호를 씌워야 $x$예요.'],
        [L(rt(c - a)), 'root-of-diff', '제곱하지 않고 뺀 값에 근호를 씌웠어요. 먼저 두 길이를 각각 제곱해요.'],
        [L(rt(c + a)), 'root-of-sum', '제곱하지 않고 더한 값에 근호를 씌웠어요. 각각 제곱하고, 빗변의 제곱에서 빼요.']], q.perm);
      steps = [{ say: '빗변의 제곱에서 아는 변의 제곱을 빼면 나머지 변의 제곱이에요.', tex: 'x^{2} = ' + c + '^{2} - ' + a + '^{2} = ' + c * c + ' - ' + a * a + ' = ' + v }, outStep(v)];
      steps[steps.length - 1] = { say: steps[steps.length - 1].say, tex: ans };
      h2 = '빗변을 알고 있고, 직각을 낀 변 하나를 구해요. 빗변의 제곱에서 아는 변의 제곱을 빼면 나머지 변의 제곱이 남아요. 먼저 빗변 ' + cm(c) + '를 제곱하고, 아는 변 ' + cm(a) + '를 제곱해요. 큰 것에서 작은 것을 빼면 $x^{2}$이에요. 그 값이 제곱수가 아니니 근호를 씌워서 답해요. 마지막으로 근호 안의 수가 $4$, $9$, $16$ 같은 제곱수로 나누어떨어지는지 보고, 그렇다면 그 제곱수를 근호 밖으로 꺼내요.';
    } else if (q.kind === 'sq-diag') {
      ans = L(rt(2 * a * a)); text = '한 변의 길이가 ' + cm(a) + '인 정사각형의 대각선의 길이를 고르세요.';
      fig = geo(180, '정사각형이 있다. 한 변의 길이는 ' + a + '센티미터이고, 왼쪽 아래 꼭짓점과 오른쪽 위 꼭짓점을 이은 대각선의 길이는 x이다.', [['poly', [95, 155, 215, 155, 215, 35, 95, 35]], seg([95, 155], [215, 35], true), ['sq', 215, 155, 90], txt(155, 169, u(a)), txt(215 + 12 + 3 * u(a).length, 95, u(a)), txt(144, 86, 'x')]);
      cands = mixc([[L(String(2 * a)), 'added', '두 변의 길이를 그냥 더했어요. 각각 제곱해서 더한 다음 근호를 씌워요. 대각선은 두 변의 합보다 짧아요.']], [
        [L(String(a * a)), 'area', '한 변을 제곱했어요. 그것은 넓이를 구하는 계산이에요. 대각선은 두 변의 제곱을 더해서 구해요.'],
        [L(rt(3 * a * a)), 'root3', '$\\sqrt{3}$을 곱했어요. $\\sqrt{3}$이 나오는 것은 정삼각형의 높이예요. 정사각형의 대각선은 한 변의 $\\sqrt{2}$배예요.'],
        [L(String(2 * a * a)), 'not-rooted', '제곱의 합을 그대로 답했어요. 그 값은 대각선을 제곱한 것이에요. 근호를 씌워요.'],
        [L(String(a)), 'same', '한 변의 길이를 그대로 답했어요. 대각선은 비스듬히 가로지르니 한 변보다 길어요.']], q.perm);
      steps = [{ say: '대각선을 그으면 두 변을 낀 직각삼각형이 생겨요. 대각선이 빗변이에요.', tex: 'x^{2} = ' + a + '^{2} + ' + a + '^{2} = ' + 2 * a * a }, { say: '근호를 씌우고, 제곱수 $' + a * a + '$' + pj(a * a, '을/를') + ' 밖으로 꺼내요.', tex: ans }];
      h2 = '정사각형에 대각선을 그으면 직각삼각형 두 개로 나뉘어요. 그 직각삼각형에서 직각을 낀 두 변은 모두 정사각형의 한 변 ' + cm(a) + '이고, 대각선이 빗변이에요. 같은 길이를 제곱해서 두 번 더하니, 한 변의 제곱의 2배가 대각선의 제곱이에요. 여기에 근호를 씌워요. 근호 안에는 한 변의 제곱이 그대로 들어 있으니 밖으로 꺼낼 수 있어요. 그래서 정사각형의 대각선은 언제나 한 변의 $\\sqrt{2}$배예요.';
    } else {
      s = 2 * a; ans = L(rt(3 * a * a)); text = '한 변의 길이가 ' + cm(s) + '인 정삼각형의 높이를 고르세요.';
      fig = geo(185, '정삼각형이 있다. 한 변의 길이는 ' + s + '센티미터이고, 위 꼭짓점에서 밑변의 한가운데로 직각으로 내린 높이의 길이는 x이다.', [['poly', [78, 158, 222, 158, 150, 33]], seg([150, 33], [150, 158], true), ['sq', 150, 158, 0], txt(150, 173, u(s)), txt(186 + 14 + 3 * u(s).length, 90, u(s)), txt(161, 105, 'x')]);
      cands = mixc([[L(rt(3 * s * s)), 'base-not-halved', '한 변의 길이에 바로 $\\sqrt{3}$을 곱했어요. 높이는 밑변을 반으로 나눠요. 밑변의 절반 $' + a + '$' + pj(a, '으로/로') + ' 계산해요.']], [
        [L(rt(2 * a * a)), 'root2', '$\\sqrt{2}$를 곱했어요. $\\sqrt{2}$가 나오는 것은 정사각형의 대각선이에요. 정삼각형의 높이에는 $\\sqrt{3}$이 나와요.'],
        [L(rt(5 * a * a)), 'added-squares', '두 길이의 제곱을 더했어요. 한 변이 빗변이니, 한 변의 제곱에서 밑변의 절반의 제곱을 빼요.'],
        [L(String(s)), 'same', '한 변의 길이를 그대로 답했어요. 높이는 비스듬한 변보다 짧아요.'],
        [L(String(a)), 'half-only', '밑변의 절반을 답했어요. 그것은 직각삼각형의 한 변이에요. 높이는 피타고라스 정리로 구해요.']], q.perm);
      steps = [{ say: '높이는 밑변을 반으로 나눠요. 밑변의 절반을 구해요.', tex: s + ' \\div 2 = ' + a }, { say: '높이, 밑변의 절반, 한 변으로 직각삼각형이 생겨요. 한 변이 빗변이에요.', tex: 'x^{2} = ' + s + '^{2} - ' + a + '^{2} = ' + s * s + ' - ' + a * a + ' = ' + 3 * a * a }, { say: '근호를 씌우고, 제곱수가 있으면 밖으로 꺼내요.', tex: ans }];
      h2 = '정삼각형은 세 변의 길이가 모두 같아요. 위 꼭짓점에서 밑변으로 높이를 그으면 밑변이 똑같이 둘로 나뉘고, 직각삼각형 두 개가 생겨요. 그 직각삼각형의 빗변은 정삼각형의 한 변 ' + cm(s) + '이고, 한 변은 밑변의 절반이에요. 나머지 한 변이 높이 $x$예요. 먼저 밑변을 반으로 나눠요. 그다음 빗변의 제곱에서 그 절반의 제곱을 빼요. 남은 값에 근호를 씌우고, 근호 안에 제곱수가 있으면 꺼내요.';
    }
    return finish({ text: text, figure: fig, ans: ans, cands: cands, steps: steps, hints: [T_KEY, h2, T_LAST] });
  };
  var okR = function (q) { var p = rootBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B24.root', title: '피타고라스 정리와 근호', build: rootBuild,
    ids: ['added', 'not-rooted', 'subtracted', 'root-of-sum', 'doubled', 'added-squares', 'root-of-diff', 'area', 'root3', 'same', 'base-not-halved', 'root2', 'half-only'],
    levels: [
      { name: '빗변의 길이', minDistinct: 30, vars: { q: sampler(function (r) { return until(function () { var a = r.int(1, 9), b = r.int(1, 9); return isSq(a * a + b * b) ? null : { kind: 'hyp', a: a, b: b, perm: perm6(r), o: order4(r) }; }, okR); }) } },
      { name: '다른 한 변의 길이', minDistinct: 30, vars: { q: sampler(function (r) { return until(function () { var a = r.int(1, 9), c = a + r.int(1, 6); return isSq(c * c - a * a) || c > 12 ? null : { kind: 'leg', a: a, c: c, perm: perm6(r), o: order4(r) }; }, okR); }) } },
      { name: '정사각형의 대각선 · 정삼각형의 높이', minDistinct: 16, vars: { q: sampler(function (r) { return until(function () { return r.int(0, 1) ? { kind: 'sq-diag', a: r.int(2, 12), perm: perm6(r), o: order4(r) } : { kind: 'equi-h', a: r.int(1, 9), perm: perm6(r), o: order4(r) }; }, okR); }) } }
    ]
  });

  /* ── B24.right 직각삼각형인지 알아보기 ─────────────── */
  var J_KEY = '피타고라스 정리는 거꾸로도 성립해요. 세 변의 길이가 $a$, $b$, $c$인 삼각형에서 $a^{2} + b^{2} = c^{2}$이면, 그 삼각형은 가장 긴 변 $c$를 빗변으로 하는 직각삼각형이에요. 그래서 각도기 없이 길이만으로 직각인지 알 수 있어요. 옛날 사람들은 길이가 3, 4, 5인 끈으로 삼각형을 만들어 직각을 쟀어요. $3^{2} + 4^{2} = 9 + 16 = 25 = 5^{2}$이기 때문이에요.';
  var J_LAST = '① 세 변 가운데 가장 긴 변을 찾아요. ② 가장 긴 변을 제곱해요. ③ 나머지 두 변을 각각 제곱해서 더해요. ④ 두 값이 같으면 직각삼각형이고, 직각은 가장 긴 변의 맞은편에 있어요.';
  var sortN = function (x) { return x.slice().sort(function (p, q) { return p - q; }); };
  /** 변의 길이의 제곱 세 개로 직각삼각형인지 · 삼각형이 되는지 */
  var isRight = function (sq) { var s = sortN(sq); return s[0] + s[1] === s[2]; };
  var isTri = function (sq) { var s = sortN(sq), d = s[2] - s[0] - s[1]; return d < 0 || 4 * s[0] * s[1] > d * d; };
  var rot = function (x, k) { return x.map(function (_, i) { return x[(i + k) % x.length]; }); };
  var showSet = function (sq, k) { return rot(sq, k % 3).map(rt).join(',\\ '); };
  var why = function (sq) { var s = sortN(sq); return '가장 긴 변의 제곱은 $' + s[2] + '$인데, 나머지 두 변의 제곱의 합은 $' + s[0] + ' + ' + s[1] + ' = ' + (s[0] + s[1]) + '$' + pj(s[0] + s[1], '이에요/예요') + '. 두 값이 달라요.'; };
  var rightBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, n = q.n, text, ans, cands, steps, h2, good, bad, mk, names, opp, lens, order, big, mid, sm, sq = function (x) { return x * x; };
    if (q.kind === 'set' || q.kind === 'rootset') {
      if (q.kind === 'set') {
        good = [a * a, b * b, c * c];
        bad = [[[a * a, b * b, sq(c + 1)], 'long-off', '가장 긴 변이 조금 길어요. '], [[a * a, sq(b + 1), c * c], 'leg-off', '직각삼각형과 비슷해 보이지만 한 변이 조금 달라요. '], [[sq(n), sq(n + 1), sq(n + 2)], 'consecutive', '이어진 세 수라고 직각삼각형이 되지는 않아요. 3, 4, 5만 특별해요. '], [[sq(a + 1), b * b, c * c], 'short-off', '직각삼각형과 비슷해 보이지만 한 변이 조금 달라요. ']];
      } else {
        good = [q.n1, q.n2, q.n1 + q.n2];
        bad = [[[a * a, b * b, a + b], 'unsquared-sum', '근호 안에 두 수를 그냥 더해 넣은 것이에요. 제곱해서 더해야 해요. '], [[q.n1, q.n2, q.n1 + q.n2 + 1], 'long-off', '가장 긴 변이 조금 길어요. '], [[q.n1, q.n2 + 1, q.n1 + q.n2], 'leg-off', '직각삼각형과 비슷해 보이지만 한 변이 조금 달라요. '], [[q.n1 + 1, q.n2, q.n1 + q.n2], 'short-off', '직각삼각형과 비슷해 보이지만 한 변이 조금 달라요. ']];
      }
      text = '세 변의 길이가 다음과 같은 삼각형 가운데 직각삼각형인 것을 고르세요. (단위는 cm)';
      ans = showSet(good, q.perm[0]);
      mk = bad.map(function (w, i) { return !isRight(w[0]) && isTri(w[0]) ? [showSet(w[0], q.perm[i + 1]), w[1], w[2] + why(w[0])] : null; });
      cands = mixc([], mk, q.perm);
      big = sortN(good);
      steps = [{ say: '가장 긴 변을 제곱해요.', tex: '(' + rt(big[2]) + ')^{2} = ' + big[2] }, { say: '나머지 두 변을 각각 제곱해서 더해요. 가장 긴 변의 제곱과 같아요.', tex: '(' + rt(big[0]) + ')^{2} + (' + rt(big[1]) + ')^{2} = ' + big[0] + ' + ' + big[1] + ' = ' + big[2] }, { say: '두 값이 같으니 직각삼각형이에요.', tex: ans }];
      h2 = '보기를 하나씩 검사해요. 검사하는 방법은 언제나 같아요. 세 수 가운데 가장 큰 수를 골라 제곱하고, 나머지 두 수를 각각 제곱해서 더해요. 두 값이 같으면 직각삼각형이에요. ' + (q.kind === 'rootset' ? '근호가 있는 수는 제곱하면 근호가 벗겨져요. $(\\sqrt{7})^{2} = 7$이고 $(2\\sqrt{3})^{2} = 4 \\times 3 = 12$예요. 근호가 있는 수와 없는 수의 크기를 견줄 때도 제곱해서 견줘요.' : '예를 들어 세 변이 $2$, $3$, $4$이면 가장 긴 변의 제곱은 $16$이고 나머지의 제곱의 합은 $4 + 9 = 13$이라서 직각삼각형이 아니에요.') + ' 길이를 그냥 더해서 견주면 안 돼요.';
      return finish({ text: text, ans: ans, cands: cands, steps: steps, hints: [J_KEY, h2, J_LAST] });
    }
    /* 어느 각이 직각인가 */
    lens = q.right ? [a, b, c] : [a, b, c + q.d]; names = ['AB', 'BC', 'CA']; opp = ['\\angle C', '\\angle A', '\\angle B'];
    order = [q.perm[0] % 3, (q.perm[0] + 1 + q.perm[1] % 2) % 3]; order.push(3 - order[0] - order[1]);   /* order[i]: i 번째로 짧은 길이를 받을 변 */
    sm = order[0]; mid = order[1]; big = order[2];
    var len = []; len[sm] = lens[0]; len[mid] = lens[1]; len[big] = lens[2];
    text = '삼각형 $ABC$에서 $\\overline{AB} = ' + len[0] + CM + '$, $\\overline{BC} = ' + len[1] + CM + '$, $\\overline{CA} = ' + len[2] + CM + '$예요. 크기가 $90^{\\circ}$인 각을 고르세요.';
    var NO = '직각삼각형이 아니다', L2 = lens[2] * lens[2], S2 = lens[0] * lens[0] + lens[1] * lens[1];
    if (q.right) {
      ans = opp[big];
      cands = [[opp[mid], 'opposite-middle', '직각은 가장 긴 변의 맞은편에 있어요. 가장 긴 변은 $' + names[big] + '$이고, 그 변에 닿지 않는 꼭짓점의 각이 직각이에요.'],
        [opp[sm], 'opposite-shortest', '가장 짧은 변의 맞은편 각을 골랐어요. 그 각은 가장 작은 각이에요. 직각은 가장 긴 변 $' + names[big] + '$의 맞은편에 있어요.'],
        [NO, 'not-right', '직각삼각형이 맞아요. 가장 긴 변의 제곱 $' + L2 + '$' + pj(L2, '과/와') + ' 나머지 두 변의 제곱의 합 $' + lens[0] * lens[0] + ' + ' + lens[1] * lens[1] + '$' + pj(lens[1] * lens[1], '이/가') + ' 같아요.']];
      steps = [{ say: '가장 긴 변 $' + names[big] + '$의 길이를 제곱해요.', tex: lens[2] + '^{2} = ' + L2 }, { say: '나머지 두 변을 각각 제곱해서 더해요. 같은 값이니 직각삼각형이에요.', tex: lens[0] + '^{2} + ' + lens[1] + '^{2} = ' + lens[0] * lens[0] + ' + ' + lens[1] * lens[1] + ' = ' + S2 }, { say: '직각은 빗변 $' + names[big] + '$의 맞은편, 곧 그 변에 닿지 않는 꼭짓점에 있어요.', tex: ans }];
    } else {
      ans = NO;
      cands = [[opp[big], 'assumed-right', '직각삼각형이라고 보고 가장 긴 변의 맞은편 각을 골랐어요. 먼저 확인해야 해요. 가장 긴 변의 제곱은 $' + L2 + '$인데 나머지 두 변의 제곱의 합은 $' + S2 + '$' + pj(S2, '이에요/예요') + '.'],
        [opp[mid], 'opposite-middle', '가장 긴 변의 제곱은 $' + L2 + '$, 나머지 두 변의 제곱의 합은 $' + S2 + '$' + pj(S2, '이에요/예요') + '. 두 값이 다르니 직각인 각이 없어요.'],
        [opp[sm], 'opposite-shortest', '가장 짧은 변의 맞은편 각은 가장 작은 각이에요. 게다가 가장 긴 변의 제곱 $' + L2 + '$' + pj(L2, '과/와') + ' 나머지의 제곱의 합 $' + S2 + '$' + pj(S2, '이/가') + ' 달라서 직각이 없어요.']];
      steps = [{ say: '가장 긴 변 $' + names[big] + '$의 길이를 제곱해요.', tex: lens[2] + '^{2} = ' + L2 }, { say: '나머지 두 변을 각각 제곱해서 더해요.', tex: lens[0] + '^{2} + ' + lens[1] + '^{2} = ' + lens[0] * lens[0] + ' + ' + lens[1] * lens[1] + ' = ' + S2 }, { say: '두 값이 다르니 직각삼각형이 아니에요. 직각인 각이 없어요.', tex: L2 + ' \\ne ' + S2 }];
    }
    h2 = '두 걸음으로 풀어요. 첫째, 정말 직각삼각형인지 확인해요. 세 변 가운데 가장 긴 변을 골라 제곱하고, 나머지 두 변을 각각 제곱해서 더해요. 두 값이 같을 때만 직각삼각형이에요. 둘째, 직각삼각형이 맞다면 직각의 자리를 찾아요. 직각은 가장 긴 변(빗변)의 맞은편에 있어요. 변의 이름에 들어 있지 않은 꼭짓점이 맞은편 꼭짓점이에요. 예를 들어 변 $PQ$의 맞은편 꼭짓점은 삼각형 $PQR$에서 $R$이에요.';
    return finish({ text: text, ans: ans, cands: cands, steps: steps, hints: [J_KEY, h2, J_LAST] });
  };
  var okJ = function (q) { var p = rightBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B24.right', title: '직각삼각형인지 알아보기', build: rightBuild,
    ids: ['long-off', 'leg-off', 'consecutive', 'short-off', 'unsquared-sum', 'opposite-middle', 'opposite-shortest', 'not-right', 'assumed-right'],
    levels: [
      { name: '직각삼각형 고르기', minDistinct: 1, vars: { q: sampler(function (r) { return until(function () { var t = sortN(triple(r, 40)), n; do { n = r.int(2, 9); } while (n === 3); return { kind: 'set', a: t[0], b: t[1], c: t[2], n: n, perm: perm6(r), o: order4(r) }; }, okJ); }) } },
      { name: '직각인 각 찾기', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { var t = sortN(triple(r, 52)); return { kind: 'angle', a: t[0], b: t[1], c: t[2], right: r.int(0, 3) > 0, d: r.int(0, 1) ? 1 : -1, perm: perm6(r), o: order4(r) }; }, function (q) { return (q.right || q.c + q.d > q.b) && okJ(q); }); }) } },
      { name: '근호가 든 길이', minDistinct: 1, vars: { q: sampler(function (r) { return until(function () { var n1 = r.int(1, 12), n2 = r.int(n1, 16), a = r.int(1, 4), b = r.int(a, 5); return n1 === n2 || (isSq(n1) && isSq(n2) && isSq(n1 + n2)) ? null : { kind: 'rootset', n1: n1, n2: n2, a: a, b: b, perm: perm6(r), o: order4(r) }; }, okJ); }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B24', [
  { title: '닮음과 닮음비', body: [
    '모양은 같고 크기만 다른 두 도형을 닮은 도형이라고 해요. 사진을 확대 · 축소한 것과 같아요. 기호 $\\backsim$로 나타내고, 꼭짓점은 서로 짝이 되는 차례대로 써요.',
    { figure: { type: 'geo', h: 180, alt: '닮은 두 삼각형이 있다. 작은 삼각형 ABC의 변 AB는 3센티미터, 변 BC는 4센티미터이고, 큰 삼각형 DEF의 변 DE는 6센티미터, 변 EF는 8센티미터이다.', items: [['poly', [40, 150, 115, 150, 66, 90]], ['poly', [150, 150, 280, 150, 196, 46]], ['text', 66, 79, 'A'], ['text', 31, 157, 'B'], ['text', 124, 157, 'C'], ['text', 196, 35, 'D'], ['text', 141, 157, 'E'], ['text', 289, 157, 'F'], ['text', 29, 116, '3 cm'], ['text', 77, 165, '4 cm'], ['text', 149, 92, '6 cm'], ['text', 215, 165, '8 cm']] } },
    '짝이 되는 변(대응변)의 길이의 비가 닮음비예요. 위 그림은 $3 : 6 = 4 : 8 = 1 : 2$이니 닮음비가 $1 : 2$예요. 짝이 되는 각(대응각)의 크기는 서로 같아요.',
    '두 삼각형은 두 쌍의 각의 크기가 각각 같기만 해도 닮은 도형이에요.'
  ] },
  { title: '대응변의 길이 구하기', body: [
    '닮음비를 알면 비례식으로 모르는 변을 구할 수 있어요. 닮음비가 $2 : 3$이고 작은 쪽의 변이 $8$이면:',
    { ex: [['8 : x = 2 : 3', '대응변의 비 = 닮음비'], ['2 \\times x = 8 \\times 3', '안쪽끼리, 바깥쪽끼리 곱해요'], ['x = 12', '큰 쪽이 더 길어요']] },
    '둘레의 길이의 비도 닮음비와 같아요. 둘레도 길이이기 때문이에요.'
  ] },
  { title: '삼각형과 평행선', body: [
    '삼각형 $ABC$에서 변 $BC$에 평행한 선분 $DE$를 그으면 작은 삼각형 $ADE$와 큰 삼각형 $ABC$가 닮은 도형이에요.',
    { figure: { type: 'geo', h: 185, alt: '삼각형 ABC에서 변 AB 위의 점 D와 변 AC 위의 점 E를 이은 선분 DE가 변 BC와 평행하다. 선분 AD는 2센티미터, 선분 DB는 4센티미터, 선분 DE는 3센티미터, 변 BC는 9센티미터이다.', items: [['poly', [150, 25, 50, 160, 260, 160]], ['seg', 117, 70, 187, 70], ['text', 150, 13, 'A'], ['text', 40, 167, 'B'], ['text', 270, 167, 'C'], ['text', 101, 73, 'D'], ['text', 203, 73, 'E'], ['text', 107, 45, '2 cm'], ['text', 57, 112, '4 cm'], ['text', 152, 83, '3 cm'], ['text', 155, 173, '9 cm']] } },
    { ex: [['\\overline{AD} : \\overline{DB} = \\overline{AE} : \\overline{EC}', '두 변을 같은 비로 나눠요'], ['\\overline{AD} : \\overline{AB} = \\overline{DE} : \\overline{BC}', '평행한 선분은 삼각형 전체의 변과 견줘요']] },
    '위 그림에서 $\\overline{AB} = 2 + 4 = 6$이니 $2 : 6 = 3 : 9$예요. 두 변의 중점을 이은 선분은 나머지 변의 절반이에요.'
  ] },
  { title: '넓이의 비와 부피의 비', body: [
    '한 변을 2배로 늘인 정사각형에는 처음 정사각형이 4개 들어가요. 가로도 2배, 세로도 2배이기 때문이에요.',
    { figure: { type: 'geo', h: 150, alt: '작은 정사각형 하나와, 한 변이 2배인 큰 정사각형이 있다. 큰 정사각형은 작은 정사각형 네 개로 나뉘어 있다.', items: [['poly', [50, 125, 100, 125, 100, 75, 50, 75], true], ['poly', [150, 125, 250, 125, 250, 25, 150, 25]], ['seg', 200, 25, 200, 125, true], ['seg', 150, 75, 250, 75, true], ['text', 75, 137, '1'], ['text', 200, 137, '2']] } },
    { ex: [['m : n', '닮음비(길이의 비)'], ['m^{2} : n^{2}', '넓이의 비'], ['m^{3} : n^{3}', '부피의 비']] },
    '닮음비가 $2 : 3$이면 넓이의 비는 $4 : 9$, 부피의 비는 $8 : 27$이에요.'
  ] },
  { title: '피타고라스 정리', body: [
    '직각삼각형에서 직각의 맞은편에 있는 가장 긴 변이 빗변이에요. 직각을 낀 두 변을 각각 제곱해서 더하면 빗변의 제곱과 같아요.',
    { figure: { type: 'geo', h: 180, alt: '직각삼각형이 있다. 직각은 왼쪽 아래에 있고, 가로로 놓인 변은 4, 세로로 놓인 변은 3, 비스듬한 빗변은 5이다.', items: [['poly', [81, 150, 239, 150, 81, 32]], ['sq', 81, 150, 0], ['text', 160, 165, '4'], ['text', 66, 91, '3'], ['text', 173, 80, '5']] } },
    { tex: 'a^{2} + b^{2} = c^{2}' },
    { ex: [['3^{2} + 4^{2} = 9 + 16 = 25 = 5^{2}', '빗변은 5'], ['13^{2} - 5^{2} = 169 - 25 = 144 = 12^{2}', '빗변이 13, 한 변이 5이면 나머지는 12']] },
    '길이를 그냥 더하는 것이 아니라 제곱해서 더해요. 마지막에는 제곱해서 그 값이 되는 수를 찾아요.'
  ] },
  { title: '근호가 나올 때 · 직각삼각형인지 알아보기', body: [
    '제곱이 제곱수가 아니면 근호를 써요. 두 변이 $2$, $4$이면 $x^{2} = 4 + 16 = 20$이고 $x = \\sqrt{20} = 2\\sqrt{5}$예요.',
    { ex: [['a\\sqrt{2}', '한 변이 a인 정사각형의 대각선'], ['\\dfrac{\\sqrt{3}}{2}a', '한 변이 a인 정삼각형의 높이']] },
    '거꾸로, 세 변의 길이에서 (가장 긴 변)² = (나머지 두 변의 제곱의 합)이면 직각삼각형이에요. 직각은 가장 긴 변의 맞은편에 있어요.',
    { ex: [['6^{2} + 8^{2} = 100 = 10^{2}', '6, 8, 10은 직각삼각형'], ['4^{2} + 5^{2} = 41 \\ne 6^{2}', '4, 5, 6은 직각삼각형이 아니에요']] }
  ] }
]);
