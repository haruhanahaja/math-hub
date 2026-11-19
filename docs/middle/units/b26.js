/* B26 원의 성질 — 현과 접선, 원주각과 중심각
   유형(쉬운 것부터): B26.chord 현의 길이 · B26.tangent 접선의 길이와 각 · B26.incircle 삼각형의 내접원과 접선의 길이
                     · B26.inscribed 원주각과 중심각 · B26.arc 원주각과 호의 길이 (모두 키패드, 자연수)
   길이는 피타고라스 수로 만들어 답이 자연수로 나온다. 각은 도(°) 단위의 자연수다.
   그림은 figure 'geo'. 원주각 · 중심각 · 접선이 이루는 각과 내접원은 실제 크기대로 그리고, 현과 접선의 길이는 약도다. */
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
      id: o.id, unit: 'B26', version: 1, title: o.title,
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
      id: o.id, unit: 'B26', version: 1, title: o.title,
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

  var G = MH.geo, RAD = Math.PI / 180;
  var CM = '\\,\\mathrm{cm}', cm = function (n) { return '$' + n + CM + '$'; }, dg = function (n) { return '$' + n + '^{\\circ}$'; };
  var ov = function (s, n) { return '$\\overline{' + s + '} = ' + n + CM + '$'; }, an = function (s, n) { return '$\\angle ' + s + ' = ' + n + '^{\\circ}$'; };
  var txt = function (x, y, s) { return ['text', Math.round(x), Math.round(y), String(s)]; };
  var seg = function (p, q, dash) { return dash ? ['seg', p[0], p[1], q[0], q[1], true] : ['seg', p[0], p[1], q[0], q[1]]; };
  var flat = function (pts) { var out = []; pts.forEach(function (p) { out.push(p[0], p[1]); }); return out; };
  var geo = function (h, alt, items) { return { type: 'geo', h: h, alt: alt, items: items }; };
  var isqrt = function (n) { var s = Math.round(Math.sqrt(n)); return s * s === n ? s : null; };
  /** 서로 다른 쓸 만한 실수 값이 둘 이상인가 */
  var enough = function (ans, wrong) { var seen = []; Object.keys(wrong).forEach(function (k) { var x = wrong[k]; if (isInt(x) && x >= 1 && x !== ans && seen.indexOf(x) < 0) seen.push(x); }); return seen.length >= 2; };
  var TRI = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  /** 피타고라스 수 하나: 배수를 곱하고 두 변의 차례를 섞는다 → [한 변, 다른 변, 빗변] */
  var triple = function (r, maxC) { var t = r.pick(TRI), k = r.int(1, Math.max(1, Math.floor(maxC / t[2]))), s = r.int(0, 1); return [t[s] * k, t[1 - s] * k, t[2] * k]; };

  /* ── 그림 도우미 ── */
  var dir = function (V, P) { var d = Math.atan2(-(P[1] - V[1]), P[0] - V[0]) / RAD; return d < 0 ? d + 360 : d; };
  /** 꼭짓점 V 에서 두 점 P1 · P2 쪽으로 벌어진 각(180° 보다 작은 쪽)에 호와 글을 놓는다 */
  var angMark = function (V, P1, P2, label, rad, off) {
    var d1 = dir(V, P1), d2 = dir(V, P2), span = (d2 - d1 + 360) % 360, t, p;
    if (span > 180) { t = d1; d1 = d2; span = 360 - span; }
    d1 = Math.round(d1); span = Math.max(Math.round(span), 4); rad = rad || (span < 35 ? 30 : 18);
    p = G.polar(V[0], V[1], rad + (off || (span < 35 ? 28 : String(label).length > 2 ? 15 : 12)), d1 + span / 2);
    return [['arc', V[0], V[1], rad, d1, d1 + span], txt(p[0], p[1], label)];
  };
  /** 점 P 의 이름을 중심 O 의 반대쪽으로 dist 만큼 떨어뜨려 적는다 */
  var name = function (P, O, s, dist) { var p = G.polar(P[0], P[1], dist || 12, dir(O, P)); return txt(p[0], p[1], s); };

  /* ── B26.chord 현의 길이 ─────────────────────── */
  /** 원 O 와 현. two 이면 현이 둘(AB 는 아래, CD 는 오른쪽 위). ratio = (중심에서 현까지의 거리) ÷ (반지름). lab: { om, oa } */
  var chordFig = function (ratio, two, lab, alt) {
    var O = [150, 98], R = 72, k = Math.min(Math.max(ratio, two ? 0.6 : 0.3), 0.65), dpx = R * k, half = R * Math.sqrt(1 - k * k);
    var M = [150, Math.round(98 + dpx)], A = [Math.round(150 - half), M[1]], B = [Math.round(150 + half), M[1]], N, C, D2, it;
    it = [['circle', 150, 98, R], seg(A, B), seg(O, M), ['sq', M[0], M[1], 90], ['dot', 150, 98], txt(150, 85, 'O'), name(A, O, 'A'), name(B, O, 'B'), txt(150, M[1] + 13, 'M')];
    if (two) {
      N = G.polar(150, 98, dpx, 40); C = G.polar(N[0], N[1], half, 130); D2 = G.polar(N[0], N[1], half, 310);
      it.push(seg(C, D2), seg(O, N), ['sq', N[0], N[1], 130], name(C, O, 'C'), name(D2, O, 'D'), name(N, O, 'N'));
    } else it.push(seg(O, A));
    if (lab.om) it.push(txt(150 + 8 + 4 * lab.om.length, (98 + M[1]) / 2, lab.om));
    if (lab.oa) it.push(txt((150 + A[0]) / 2 - 4 - 22 * k, (98 + A[1]) / 2 - 11, lab.oa));
    return geo(200, alt, it);
  };
  var C_KEY = '원의 중심에서 현에 수직으로 선을 내리면 그 선은 현을 똑같이 둘로 나눠요. 종이 원을 현의 두 끝이 포개지도록 반으로 접으면 접은 선이 중심을 지나는 것과 같아요. 그래서 중심 $O$, 수선의 발 $M$, 현의 한 끝 $A$를 이으면 직각삼각형 $OMA$가 생겨요. 빗변은 반지름 $OA$이고, 나머지 두 변은 중심에서 현까지의 거리 $OM$과 현의 절반 $AM$이에요. 이 삼각형에 피타고라스 정리를 써요.';
  var C_KEY2 = '한 원에서 중심으로부터 같은 거리에 있는 두 현은 길이가 같아요. 거꾸로 길이가 같은 두 현은 중심에서 같은 거리에 있어요. 원은 어느 쪽으로 돌려도 똑같은 모양이라서, 한 현을 중심 둘레로 돌리면 다른 현에 꼭 포개지기 때문이에요. 그리고 중심에서 현에 내린 수선은 현을 똑같이 둘로 나눠요. 그래서 한 현에서 알아낸 길이를 다른 현에 그대로 옮겨 쓸 수 있어요.';
  var C_LAST = '① 중심 $O$와 현의 한 끝을 이어 반지름을 그려요. ② 직각삼각형에서 빗변(반지름), 중심에서 현까지의 거리, 현의 절반을 표시해요. ③ 피타고라스 정리로 모르는 변을 구해요. ④ 현 전체를 묻는지 확인해요. 현 전체는 절반의 2배예요.';
  var chordBuild = function (q) {
    var d = q.d, h = q.h, r = q.r, k = q.kind, two = k.indexOf('eq') === 0, ans, wrong = {}, text, steps, h2, lab = {}, alt;
    var head = two ? '그림과 같이 원 $O$의 중심에서 두 현 $AB$, $CD$에 내린 수선의 발을 각각 $M$, $N$이라고 해요. ' : '그림과 같이 원 $O$의 중심에서 현 $AB$에 내린 수선의 발을 $M$이라고 해요. ';
    if (k === 'half' || k === 'eq-len') {
      ans = 2 * h; wrong = { 'not-doubled': h, 'no-square': 2 * (r - d), diameter: 2 * r };
      text = head + (two ? '원의 반지름의 길이가 ' + cm(r) + '이고 $\\overline{OM} = \\overline{ON} = ' + d + CM + '$일 때, 현 $CD$의 길이는 몇 cm인지 구하세요.' : '원의 반지름의 길이가 ' + cm(r) + '이고 ' + ov('OM', d) + '일 때, 현 $AB$의 길이는 몇 cm인지 구하세요.');
      steps = [{ say: '반지름 $OA$를 그으면 직각삼각형 $OMA$가 생겨요. 빗변은 반지름이에요.', tex: '\\overline{AM}^{2} = ' + r + '^{2} - ' + d + '^{2} = ' + h * h },
        { say: '제곱해서 그 값이 되는 수가 현의 절반이에요.', tex: '\\overline{AM} = ' + h },
        { say: (two ? '수선은 현을 이등분하니 $\\overline{AB}$는 그 2배이고, 중심에서 같은 거리에 있는 현 $CD$도 길이가 같아요.' : '수선은 현을 이등분하니 현 전체는 그 2배예요.'), tex: '2 \\times ' + h + ' = ' + ans }];
      h2 = '반지름 $OA$를 그으면 직각삼각형 $OMA$가 생겨요. 빗변은 반지름 ' + cm(r) + '이고, 한 변은 중심에서 현까지의 거리 ' + cm(d) + '예요. 나머지 한 변이 현의 절반 $AM$이에요. 빗변의 제곱에서 ' + cm(d) + '의 제곱을 빼면 $AM$의 제곱이 나오고, 제곱해서 그 값이 되는 수가 $AM$의 길이예요. ' + (two ? '이렇게 현 $AB$의 길이를 구하면, 중심에서 같은 거리에 있는 현 $CD$의 길이도 그것과 같아요.' : '묻는 것은 현 전체이니 마지막에 절반을 2배 해요.');
      lab = { om: d + ' cm', oa: two ? null : r + ' cm' };
    } else if (k === 'radius') {
      ans = r; wrong = { 'no-square': h + d, diameter: 2 * r };
      text = head + ov('AB', 2 * h) + ', ' + ov('OM', d) + '일 때, 원 $O$의 반지름의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '수선은 현을 이등분해요. 현의 절반을 구해요.', tex: '\\overline{AM} = ' + 2 * h + ' \\div 2 = ' + h },
        { say: '직각삼각형 $OMA$에서 빗변 $OA$가 반지름이에요.', tex: '\\overline{OA}^{2} = ' + h + '^{2} + ' + d + '^{2} = ' + r * r },
        { say: '제곱해서 그 값이 되는 수가 반지름의 길이예요.', tex: '\\overline{OA} = ' + r }];
      h2 = '먼저 현을 반으로 나눠요. 수선의 발 $M$은 현 $AB$의 한가운데라서 $AM$은 ' + cm(2 * h) + '의 절반이에요. 그다음 반지름 $OA$를 그어 직각삼각형 $OMA$를 만들어요. 직각을 낀 두 변은 현의 절반과 ' + cm(d) + '(중심에서 현까지의 거리)이고, 빗변이 반지름이에요. 두 변을 각각 제곱해서 더하면 반지름의 제곱이 나와요. 길이를 그냥 더하면 안 돼요.';
      lab = { om: d + ' cm' };
    } else {
      ans = d; wrong = { 'no-square': r - h, 'half-answered': h };
      text = two ? head + '원의 반지름의 길이가 ' + cm(r) + '이고 $\\overline{AB} = \\overline{CD} = ' + 2 * h + CM + '$일 때, $\\overline{ON}$의 길이는 몇 cm인지 구하세요.' : head + '원의 반지름의 길이가 ' + cm(r) + '이고 ' + ov('AB', 2 * h) + '일 때, 중심 $O$에서 현 $AB$까지의 거리 $\\overline{OM}$의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '수선은 현을 이등분해요. 현의 절반을 구해요.', tex: '\\overline{AM} = ' + 2 * h + ' \\div 2 = ' + h },
        { say: '직각삼각형 $OMA$에서 빗변은 반지름이에요.', tex: '\\overline{OM}^{2} = ' + r + '^{2} - ' + h + '^{2} = ' + d * d },
        { say: (two ? '$\\overline{OM}$의 길이를 구했어요. 길이가 같은 두 현은 중심에서 같은 거리에 있으니 $\\overline{ON}$도 같아요.' : '제곱해서 그 값이 되는 수가 중심에서 현까지의 거리예요.'), tex: String(d) }];
      h2 = '먼저 현을 반으로 나눠요. 수선의 발 $M$은 현 $AB$의 한가운데라서 $AM$은 ' + cm(2 * h) + '의 절반이에요. 그다음 반지름 $OA$를 그어 직각삼각형 $OMA$를 만들어요. 빗변은 반지름 ' + cm(r) + '이고, 한 변은 현의 절반이에요. 빗변의 제곱에서 현의 절반의 제곱을 빼면 $OM$의 제곱이 나와요. ' + (two ? '두 현의 길이가 같으니 $ON$의 길이는 $OM$의 길이와 같아요.' : '현 전체의 길이를 그대로 넣지 않도록 조심해요.');
      lab = { oa: two ? null : r + ' cm' };
    }
    alt = two ? '원 O 안에 두 현 AB와 CD가 있다. 중심 O에서 현 AB에 내린 수선의 발은 M, 현 CD에 내린 수선의 발은 N이다.' : '원 O 안에 현 AB가 있다. 중심 O에서 현 AB에 내린 수선의 발은 M이고, 반지름 OA가 그어져 있다.';
    return { text: text, figure: chordFig(d / r, two, lab, alt), ans: ans, wrong: wrong, steps: steps, hints: [two ? C_KEY2 : C_KEY, h2, C_LAST], check: enough(ans, wrong) };
  };
  var chordQ = function (kinds, maxC, minRatio) { return sampler(function (r) { return until(function () { var t = triple(r, maxC); return { kind: r.pick(kinds), d: t[0], h: t[1], r: t[2] }; }, function (q) { return q.d / q.r >= (minRatio || 0) && chordBuild(q).check; }); }); };
  numQ({
    id: 'B26.chord', title: '현의 길이', kind: 'int', build: chordBuild,
    mistakes: [['not-doubled', '현의 절반만 구했어요. 중심에서 내린 수선은 현을 똑같이 둘로 나눠요. 직각삼각형에서 구한 길이를 2배 해야 현 전체예요.'],
      ['no-square', '길이를 제곱하지 않고 그냥 더하거나 뺐어요. 직각삼각형의 세 변은 피타고라스 정리로 이어져 있어요. 각 변을 제곱해서 계산해요.'],
      ['diameter', '지름을 답했어요. 직각삼각형의 빗변은 지름이 아니라 반지름이에요. 구한 값이 묻는 것과 같은지 확인해요.'],
      ['half-answered', '현의 절반을 답했어요. 묻는 것은 중심에서 현까지의 거리예요. 현의 절반과 반지름으로 피타고라스 정리를 써요.']],
    levels: [
      { name: '현의 길이 구하기', minDistinct: 20, vars: { q: chordQ(['half'], 30) } },
      { name: '반지름 · 중심에서 현까지의 거리', minDistinct: 40, vars: { q: chordQ(['radius', 'dist'], 30) } },
      { name: '두 현', minDistinct: 30, vars: { q: chordQ(['eq-len', 'eq-dist'], 39, 0.45) } }
    ]
  });

  /* ── B26.tangent 접선의 길이와 각 ─────────────────── */
  /** 원 O 와 원 밖의 점 P 에서 그은 접선. two 이면 접선 둘(접점 A, B), 아니면 하나(접점 T). p: 각 APB(주면 실제 크기대로). lab: { r, pt, op, o, p, a } */
  var tanFig = function (two, p, lab, alt) {
    var R = p ? 50 : 52, O = [p ? 72 : 85, 100], th = p ? (180 - p) / 2 : 72.9, P = [Math.round(O[0] + R / Math.cos(th * RAD)), 100], A = G.polar(O[0], O[1], R, th), B = G.polar(O[0], O[1], R, -th), m;
    var it = [['circle', O[0], O[1], R], seg(P, A), seg(O, A), ['sq', A[0], A[1], Math.round(th + 180)], ['dot', O[0], O[1]], txt(O[0] - 12, 100, 'O'), txt(P[0] + 12, 100, 'P'), name(A, O, two ? 'A' : 'T')];
    if (two) it.push(seg(P, B), seg(O, B), ['sq', B[0], B[1], Math.round(90 - th)], name(B, O, 'B')); else it.push(seg(O, P));
    if (lab.o) it = it.concat(angMark(O, A, B, lab.o, 13, 19));
    if (lab.p) it = it.concat(angMark(P, A, B, lab.p, 24, 17));
    if (lab.a) it.push(seg(A, B), angMark(A, P, B, lab.a, 20)[0], txt(A[0] + 24, A[1] + 24, lab.a));
    if (lab.r) { m = [(O[0] + A[0]) / 2, (O[1] + A[1]) / 2]; it.push(txt(m[0] - 10 - 3 * lab.r.length, m[1] - 2, lab.r)); }
    if (lab.pt) it.push(txt((P[0] + A[0]) / 2 + 8, (P[1] + A[1]) / 2 - 12, lab.pt));
    if (lab.op) it.push(txt((O[0] + P[0]) / 2 + 14, 112, lab.op));
    return geo(200, alt, it);
  };
  var T_KEY = '접선은 원에 딱 한 점에서 스치듯 닿는 직선이에요. 접선은 접점을 지나는 반지름과 늘 직각으로 만나요. 평평한 바닥에 놓인 바퀴를 떠올리면, 바퀴의 중심에서 바닥에 닿은 점까지 그은 선은 바닥과 수직이에요. 그래서 중심 $O$, 접점, 원 밖의 점 $P$를 이으면 직각삼각형이 생겨요. 직각은 접점에 있고, 빗변은 직각의 맞은편인 $OP$예요.';
  var T_KEY2 = '원 밖의 한 점 $P$에서 원에 접선을 두 개 그을 수 있고, 점 $P$에서 두 접점까지의 길이는 같아요. $\\overline{PA} = \\overline{PB}$예요. 선분 $OP$를 그으면 삼각형 $PAO$와 삼각형 $PBO$가 꼭 포개지기 때문이에요. 반지름도 $\\overline{OA} = \\overline{OB}$이고, 접선과 반지름은 접점에서 직각으로 만나요. 그래서 사각형 $PAOB$는 두 각이 직각이고 이웃한 변끼리 길이가 같은 모양이에요.';
  var T_LAST = '① 접점에 직각 표시를 해요(접선과 반지름은 수직). ② 길이를 묻으면 중심, 접점, 점 $P$로 직각삼각형을 만들고 피타고라스 정리를 써요. 빗변은 $OP$예요. ③ 접선이 둘이면 $\\overline{PA} = \\overline{PB}$를 써요. ④ 각을 묻으면 사각형의 네 각의 합, 삼각형의 세 각의 합을 써요.';
  var tangentBuild = function (q) {
    var r = q.r, t = q.t, c = q.c, p = q.p, k = q.kind, ans, wrong, text, steps, h2, fig, two = '그림과 같이 원 $O$ 밖의 점 $P$에서 원에 그은 두 접선의 접점을 $A$, $B$라고 해요. ', one = '그림과 같이 원 $O$ 밖의 점 $P$에서 원에 그은 접선의 접점을 $T$라고 해요. ';
    var alt1 = '원 O와 원 밖의 점 P가 있다. 점 P에서 그은 접선이 점 T에서 원에 닿고, 반지름 OT와 선분 OP가 그어져 있다. 접점 T에 직각 표시가 있다.', alt2 = '원 O와 원 밖의 점 P가 있다. 점 P에서 그은 두 접선이 점 A와 점 B에서 원에 닿고, 반지름 OA와 OB가 그어져 있다. 두 접점에 직각 표시가 있다.';
    if (k === 'len') {
      ans = t; wrong = { 'no-square': c - r, added: c + r };
      text = one + '원의 반지름의 길이가 ' + cm(r) + '이고 ' + ov('OP', c) + '일 때, $\\overline{PT}$의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '접선과 반지름은 접점 $T$에서 직각으로 만나요. 직각삼각형 $OTP$의 빗변은 $OP$예요.', tex: '\\overline{PT}^{2} = ' + c + '^{2} - ' + r + '^{2} = ' + t * t }, { say: '제곱해서 그 값이 되는 수가 접선의 길이예요.', tex: '\\overline{PT} = ' + t }];
      h2 = '접점 $T$에 직각 표시를 해요. 그러면 삼각형 $OTP$가 직각삼각형이라는 것이 보여요. 직각의 맞은편에 있는 $OP$가 빗변이고 길이는 ' + cm(c) + '예요. 직각을 낀 두 변은 반지름 $OT$(' + cm(r) + ')와 구하려는 접선 $PT$예요. 빗변의 제곱에서 반지름의 제곱을 빼면 $PT$의 제곱이 나와요. 길이를 그냥 빼면 안 되고, 제곱해서 빼야 해요.';
      fig = tanFig(false, 0, { r: r + ' cm', op: c + ' cm' }, alt1);
    } else if (k === 'op') {
      ans = c; wrong = { 'no-square': t + r, subtracted: abs(t - r) };
      text = one + '원의 반지름의 길이가 ' + cm(r) + '이고 ' + ov('PT', t) + '일 때, $\\overline{OP}$의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '접선과 반지름은 접점 $T$에서 직각으로 만나요. 직각삼각형 $OTP$의 빗변은 $OP$예요.', tex: '\\overline{OP}^{2} = ' + r + '^{2} + ' + t + '^{2} = ' + c * c }, { say: '제곱해서 그 값이 되는 수가 $\\overline{OP}$의 길이예요.', tex: '\\overline{OP} = ' + c }];
      h2 = '접점 $T$에 직각 표시를 해요. 그러면 삼각형 $OTP$가 직각삼각형이라는 것이 보여요. 직각을 낀 두 변은 반지름 $OT$(' + cm(r) + ')와 접선 $PT$(' + cm(t) + ')예요. 구하려는 $OP$는 직각의 맞은편에 있는 빗변이에요. 두 변을 각각 제곱해서 더하면 빗변의 제곱이 나와요. 길이를 그냥 더하거나 빼면 안 돼요.';
      fig = tanFig(false, 0, { r: r + ' cm', pt: t + ' cm' }, alt1);
    } else if (k === 'peri') {
      ans = 2 * (t + r); wrong = { 'one-side': t + r, 'area-not-perimeter': t * r };
      text = two + '원의 반지름의 길이가 ' + cm(r) + '이고 ' + ov('PA', t) + '일 때, 사각형 $PAOB$의 둘레의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '한 점에서 그은 두 접선의 길이는 같아요.', tex: '\\overline{PB} = \\overline{PA} = ' + t }, { say: '반지름도 길이가 같아요.', tex: '\\overline{OA} = \\overline{OB} = ' + r }, { say: '네 변을 모두 더해요.', tex: t + ' + ' + t + ' + ' + r + ' + ' + r + ' = ' + ans }];
      h2 = '사각형 $PAOB$의 네 변을 하나씩 짚어요. $PA$는 ' + cm(t) + '로 주어졌어요. $PB$도 같은 점 $P$에서 그은 접선이라서 $PA$와 길이가 같아요. $OA$와 $OB$는 둘 다 반지름이라서 ' + cm(r) + '예요. 이제 길이가 적히지 않은 변은 없어요. 둘레는 네 변을 모두 더한 것이니, 접선 두 개와 반지름 두 개를 더해요.';
      fig = tanFig(true, 0, { r: r + ' cm', pt: t + ' cm' }, alt2);
    } else if (k === 'area') {
      ans = r * t; wrong = { 'perimeter-not-area': 2 * (t + r), 'half-area': (r * t) % 2 ? null : r * t / 2, 'used-op': r * c };
      text = two + '원의 반지름의 길이가 ' + cm(r) + '이고 ' + ov('OP', c) + '일 때, 사각형 $PAOB$의 넓이는 몇 $\\mathrm{cm}^{2}$인지 구하세요.';
      steps = [{ say: '선분 $OP$를 그으면 직각삼각형 $PAO$가 생겨요. 접선 $PA$의 길이를 구해요.', tex: '\\overline{PA}^{2} = ' + c + '^{2} - ' + r + '^{2} = ' + t * t + ',\\quad \\overline{PA} = ' + t },
        { say: '직각삼각형 $PAO$의 넓이는 직각을 낀 두 변의 곱의 절반이에요.', tex: '\\dfrac{1}{2} \\times ' + t + ' \\times ' + r },
        { say: '사각형 $PAOB$는 이런 삼각형 2개예요.', tex: '2 \\times \\dfrac{1}{2} \\times ' + t + ' \\times ' + r + ' = ' + ans }];
      h2 = '선분 $OP$를 그어 사각형을 삼각형 두 개로 나눠요. 삼각형 $PAO$와 삼각형 $PBO$는 꼭 포개지는 직각삼각형이에요. 먼저 삼각형 $PAO$에서 접선 $PA$의 길이를 구해요. 빗변이 $OP$(' + cm(c) + ')이고 한 변이 반지름(' + cm(r) + ')이니 피타고라스 정리를 써요. 직각삼각형의 넓이는 직각을 낀 두 변을 곱해서 2로 나눈 값이에요. 그런 삼각형이 2개이니, 사각형의 넓이는 접선의 길이와 반지름을 곱한 값이에요.';
      fig = tanFig(true, 0, { r: r + ' cm' }, alt2);
    } else if (k === 'apb' || k === 'aob') {
      ans = 180 - p; wrong = { same: p, '90-minus': 90 - p, '360-minus': 360 - p };
      text = two + (k === 'apb' ? an('APB', p) + '일 때, $\\angle AOB$의 크기는 몇 도인지 구하세요.' : an('AOB', p) + '일 때, $\\angle APB$의 크기는 몇 도인지 구하세요.');
      steps = [{ say: '접선과 반지름은 접점에서 직각으로 만나요.', tex: '\\angle PAO = \\angle PBO = 90^{\\circ}' }, { say: '사각형 $PAOB$의 네 각의 합은 $360^{\\circ}$예요. 직각 두 개를 빼면 나머지 두 각의 합이 남아요.', tex: '360^{\\circ} - 90^{\\circ} - 90^{\\circ} = 180^{\\circ}' }, { say: '거기에서 주어진 각을 빼요.', tex: '180^{\\circ} - ' + p + '^{\\circ} = ' + ans + '^{\\circ}' }];
      h2 = '사각형 $PAOB$의 네 각을 하나씩 짚어요. 접점 $A$와 $B$에 있는 각은 접선과 반지름이 만나는 각이라서 둘 다 직각이에요. 사각형의 네 각을 모두 더하면 $360^{\\circ}$이니, 직각 두 개를 빼고 남는 것이 $\\angle APB$와 $\\angle AOB$의 합이에요. 그 합에서 주어진 각 ' + dg(p) + '를 빼면 구하는 각이 나와요. 두 각은 서로 같지 않아요. 하나가 커지면 다른 하나는 그만큼 작아져요.';
      fig = tanFig(true, k === 'apb' ? p : 180 - p, k === 'apb' ? { p: p + '°', o: 'x' } : { o: p + '°', p: 'x' }, alt2 + ' 각 ' + (k === 'apb' ? 'APB' : 'AOB') + '의 크기는 ' + p + '도이다.');
    } else {
      ans = (180 - p) / 2; wrong = { 'not-halved': 180 - p, 'half-angle': p / 2 };
      text = two + an('APB', p) + '일 때, $\\angle PAB$의 크기는 몇 도인지 구하세요.';
      steps = [{ say: '한 점에서 그은 두 접선의 길이는 같아요. 삼각형 $PAB$는 이등변삼각형이에요.', tex: '\\overline{PA} = \\overline{PB}' }, { say: '세 각의 합 $180^{\\circ}$에서 꼭지각을 빼면 두 밑각의 합이에요.', tex: '180^{\\circ} - ' + p + '^{\\circ} = ' + (180 - p) + '^{\\circ}' }, { say: '두 밑각은 크기가 같으니 반으로 나눠요.', tex: (180 - p) + '^{\\circ} \\div 2 = ' + ans + '^{\\circ}' }];
      h2 = '선분 $AB$를 그으면 삼각형 $PAB$가 생겨요. 같은 점 $P$에서 그은 두 접선은 길이가 같으니 $PA$와 $PB$의 길이가 같고, 이 삼각형은 이등변삼각형이에요. 이등변삼각형은 두 밑각 $\\angle PAB$와 $\\angle PBA$의 크기가 같아요. 삼각형의 세 각의 합에서 꼭지각 ' + dg(p) + '를 빼면 두 밑각을 더한 값이 남아요. 그것을 똑같이 둘로 나누면 밑각 하나예요.';
      fig = tanFig(true, p, { p: p + '°', a: 'x' }, alt2 + ' 선분 AB가 그어져 있고 각 APB의 크기는 ' + p + '도이다.');
    }
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, hints: [k === 'len' || k === 'op' ? T_KEY : T_KEY2, h2, T_LAST], check: enough(ans, wrong) };
  };
  var tanQ = function (kinds, maxC) { return sampler(function (r) { return until(function () { var t = triple(r, maxC), k = r.pick(kinds), p = k === 'aob' ? r.int(122, 140) : k === 'pab' ? 2 * r.int(20, 29) : r.int(40, 58); return { kind: k, r: t[0], t: t[1], c: t[2], p: p }; }, function (q) { return tangentBuild(q).check; }); }); };
  numQ({
    id: 'B26.tangent', title: '접선의 길이와 각', kind: 'int', build: tangentBuild,
    mistakes: [['no-square', '길이를 제곱하지 않고 그냥 더하거나 뺐어요. 접점에 직각이 있으니 직각삼각형이에요. 각 변을 제곱해서 피타고라스 정리로 계산해요.'],
      ['added', '빗변과 반지름을 더했어요. 접선은 직각삼각형의 한 변이에요. 빗변의 제곱에서 반지름의 제곱을 빼고, 제곱해서 그 값이 되는 수를 찾아요.'],
      ['subtracted', '두 길이를 뺐어요. 구하는 변은 직각의 맞은편에 있는 빗변이에요. 두 변을 각각 제곱해서 더하고, 제곱해서 그 값이 되는 수를 찾아요.'],
      ['one-side', '접선 하나와 반지름 하나만 더했어요. 사각형의 변은 네 개예요. 접선도 두 개, 반지름도 두 개이니 모두 더해요.'],
      ['area-not-perimeter', '접선의 길이와 반지름을 곱했어요. 그것은 넓이를 구하는 계산이에요. 둘레는 네 변의 길이를 모두 더해요.'],
      ['perimeter-not-area', '네 변의 길이를 더했어요. 그것은 둘레예요. 넓이는 직각삼각형 두 개의 넓이를 더해서 구해요.'],
      ['half-area', '직각삼각형 하나의 넓이만 구했어요. 사각형은 꼭 포개지는 직각삼각형 두 개로 되어 있으니 2배 해요.'],
      ['used-op', '반지름에 빗변의 길이를 곱했어요. 넓이에는 직각을 낀 두 변이 필요해요. 접선의 길이를 피타고라스 정리로 먼저 구해요.'],
      ['same', '주어진 각을 그대로 답했어요. 두 각은 크기가 같지 않아요. 사각형의 네 각의 합에서 직각 두 개와 주어진 각을 빼요.'],
      ['90-minus', '직각에서 주어진 각을 뺐어요. 사각형에는 직각이 두 개 있어요. 네 각의 합에서 직각 두 개를 빼고 남은 값에서 주어진 각을 빼요.'],
      ['360-minus', '사각형의 네 각의 합에서 주어진 각만 뺐어요. 접점에 있는 직각 두 개도 빼야 해요. 접선과 반지름은 수직이에요.'],
      ['not-halved', '두 밑각의 합을 답했어요. 이등변삼각형의 두 밑각은 크기가 같으니, 그 합을 반으로 나눠야 밑각 하나예요.'],
      ['half-angle', '주어진 각을 반으로 나눴어요. 먼저 삼각형의 세 각의 합에서 꼭지각을 빼고, 남은 값을 반으로 나눠요.']],
    levels: [
      { name: '접선의 길이', minDistinct: 40, vars: { q: tanQ(['len', 'op'], 30) } },
      { name: '두 접선과 사각형', minDistinct: 40, vars: { q: tanQ(['peri', 'area'], 30) } },
      { name: '접선과 각', minDistinct: 40, vars: { q: tanQ(['apb', 'aob', 'pab'], 30) } }
    ]
  });

  /* ── B26.incircle 삼각형의 내접원 ─────────────────── */
  /** 접선의 길이가 x(꼭짓점 A) · y(B) · z(C)인 삼각형과 내접원. 접점은 D(변 AB) · E(변 BC) · F(변 CA) */
  var incFig = function (x, y, z, alt, right) {
    var c = x + y, a = y + z, b = z + x, ax = (a * a + c * c - b * b) / (2 * a), ay = Math.sqrt(c * c - ax * ax), rho = a * ay / 2 / (x + y + z), lo = Math.min(0, ax), hi = Math.max(a, ax);
    var s = Math.min(220 / (hi - lo), 130 / ay), x0 = 150 - s * (hi + lo) / 2, y0 = 100 + s * ay / 2, pt = function (px, py) { return [Math.round(x0 + s * px), Math.round(y0 - s * py)]; };
    var A = pt(ax, ay), B = pt(0, 0), C = pt(a, 0), I = pt(y, rho), Dp = pt(y * ax / c, y * ay / c), E = pt(y, 0), F = pt(a + z * (ax - a) / b, z * ay / b);
    var it = [['poly', flat([A, B, C])], ['circle', I[0], I[1], Math.round(s * rho)], ['dot', Dp[0], Dp[1]], ['dot', E[0], E[1]], ['dot', F[0], F[1]], ['dot', I[0], I[1]], txt(I[0], I[1] - 11, 'O'),
      txt(A[0], A[1] - 11, 'A'), txt(B[0] - 11, B[1] + 6, 'B'), txt(C[0] + 11, C[1] + 6, 'C'), name(Dp, I, 'D', 13), txt(E[0], E[1] + 13, 'E'), name(F, I, 'F', 13)];
    if (right) it.push(['sq', C[0], C[1], 90]);
    return geo(200, alt, it);
  };
  var I_KEY = '원 밖의 한 점에서 그은 두 접선의 길이는 같아요. 삼각형 안에 꼭 끼인 원(내접원)에서는 세 꼭짓점이 모두 원 밖의 점이에요. 그래서 꼭짓점마다 길이가 같은 접선이 한 쌍씩 있어요. $\\overline{AD} = \\overline{AF}$, $\\overline{BD} = \\overline{BE}$, $\\overline{CE} = \\overline{CF}$예요. 삼각형의 세 변은 이 세 가지 길이가 둘씩 이어 붙은 것이에요. 같은 길이에 같은 표시를 해 두면 식이 저절로 보여요.';
  var I_LAST = '① 그림에서 꼭짓점마다 길이가 같은 접선 한 쌍에 같은 표시를 해요($A$에서 한 쌍, $B$에서 한 쌍, $C$에서 한 쌍). ② 아는 길이를 같은 표시가 있는 곳에 옮겨 적어요. ③ 변의 길이 = (한쪽 조각) + (다른 쪽 조각)으로 식을 세워요. ④ 묻는 것이 변인지, 조각인지, 둘레인지 확인해요.';
  var incBuild = function (q) {
    var x = q.x, y = q.y, z = q.z, k = q.kind, c = x + y, a = y + z, b = z + x, sum = x + y + z, ans, wrong, text, steps, h2, i = q.side || 0, right = k === 'inradius';
    var head = '그림과 같이 원 $O$가 삼각형 $ABC$의 세 변 $AB$, $BC$, $CA$와 각각 점 $D$, $E$, $F$에서 접해요. ';
    var SD = ['AB', 'BC', 'CA'], val = [c, a, b], parts = [['AD', 'BD', x, y], ['BE', 'CE', y, z], ['CF', 'AF', z, x]][i], given = ov('AD', x) + ', ' + ov('BE', y) + ', ' + ov('CF', z);
    if (k === 'side') {
      ans = val[i]; wrong = { 'wrong-pair': val[(i + 1) % 3], 'wrong-pair-2': val[(i + 2) % 3], 'all-added': sum };
      text = head + given + '일 때, 변 $' + SD[i] + '$의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '꼭짓점마다 두 접선의 길이가 같아요. 변 $' + SD[i] + '$를 이루는 두 조각의 길이를 찾아요.', tex: '\\overline{' + parts[0] + '} = ' + parts[2] + ',\\quad \\overline{' + parts[1] + '} = ' + parts[3] }, { say: '두 조각을 더하면 변의 길이예요.', tex: parts[2] + ' + ' + parts[3] + ' = ' + ans }];
      h2 = '변 $' + SD[i] + '$는 접점에서 두 조각으로 나뉘어요. 두 조각은 $' + parts[0] + '$와 $' + parts[1] + '$예요. 이 가운데 길이가 바로 주어지지 않은 조각은, 같은 꼭짓점에서 나온 다른 접선과 길이가 같다는 것으로 찾아요. 꼭짓점 $A$에서 나온 두 접선은 ' + cm(x) + ', $B$에서 나온 두 접선은 ' + cm(y) + ', $C$에서 나온 두 접선은 ' + cm(z) + '예요. 변 $' + SD[i] + '$의 두 끝 꼭짓점에 해당하는 두 길이만 더해요.';
    } else if (k === 'peri') {
      ans = 2 * (c + z); wrong = { 'not-doubled': c + z, 'side-doubled-only': 2 * c + z };
      text = head + ov('AB', c) + ', ' + ov('CF', z) + '일 때, 삼각형 $ABC$의 둘레의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '$\\overline{AF} = \\overline{AD}$, $\\overline{BE} = \\overline{BD}$이니, 이 둘을 더하면 변 $AB$의 길이와 같아요.', tex: '\\overline{AF} + \\overline{BE} = \\overline{AB} = ' + c }, { say: '$\\overline{CE} = \\overline{CF}$예요.', tex: '\\overline{CE} = ' + z }, { say: '둘레는 여섯 조각을 모두 더한 것이에요.', tex: c + ' + ' + c + ' + ' + z + ' + ' + z + ' = ' + ans }];
      h2 = '둘레는 접점으로 나뉜 여섯 조각을 모두 더한 것이에요. 여섯 조각은 길이가 같은 것끼리 세 쌍이에요. 변 $AB$(' + cm(c) + ')는 $A$ 쪽 조각 하나와 $B$ 쪽 조각 하나로 되어 있어요. $A$ 쪽 조각과 $B$ 쪽 조각은 다른 변에도 하나씩 더 있으니, 그 둘을 더한 것도 변 $AB$의 길이와 같아요. $C$ 쪽 조각은 ' + cm(z) + '짜리가 두 개예요. 이렇게 묶어서 모두 더해요.';
    } else if (k === 'chain') {
      ans = z; wrong = { 'one-step': y, direct: a - x };
      text = head + ov('AB', c) + ', ' + ov('BC', a) + ', ' + ov('AD', x) + '일 때, $\\overline{CF}$의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '변 $AB$에서 $\\overline{AD}$를 빼면 $\\overline{BD}$예요.', tex: '\\overline{BD} = ' + c + ' - ' + x + ' = ' + y }, { say: '꼭짓점 $B$에서 나온 두 접선의 길이는 같아요.', tex: '\\overline{BE} = \\overline{BD} = ' + y }, { say: '변 $BC$에서 $\\overline{BE}$를 빼면 $\\overline{CE}$이고, 이것은 $\\overline{CF}$와 같아요.', tex: a + ' - ' + y + ' = ' + ans }];
      h2 = '아는 길이에서 출발해 한 걸음씩 옮겨 가요. 첫째, 변 $AB$(' + cm(c) + ')에서 $AD$(' + cm(x) + ')를 빼면 나머지 조각 $BD$가 나와요. 둘째, 꼭짓점 $B$에서 나온 두 접선은 길이가 같으니 $BE$는 $BD$와 같아요. 셋째, 변 $BC$(' + cm(a) + ')에서 $BE$를 빼면 $CE$가 나와요. 넷째, 꼭짓점 $C$에서 나온 두 접선은 길이가 같으니 $CF$는 $CE$와 같아요.';
    } else if (k === 'find') {
      ans = x; wrong = { 'not-halved': 2 * x, 'other-vertex': y, 'other-vertex-2': z };
      text = head + ov('AB', c) + ', ' + ov('BC', a) + ', ' + ov('CA', b) + '일 때, $\\overline{AD}$의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '$\\overline{AD} = \\overline{AF}$예요. 변 $AB$와 변 $CA$를 더하면 $\\overline{AD}$ 2개와 $\\overline{BD}$, $\\overline{CF}$가 들어 있어요.', tex: c + ' + ' + b + ' = ' + (c + b) }, { say: '$\\overline{BD} + \\overline{CF} = \\overline{BE} + \\overline{CE}$이고 이것은 변 $BC$의 길이예요. 그것을 빼면 $\\overline{AD}$ 2개가 남아요.', tex: (c + b) + ' - ' + a + ' = ' + 2 * x }, { say: '반으로 나눠요.', tex: 2 * x + ' \\div 2 = ' + ans }];
      h2 = '꼭짓점 $A$에서 나온 조각을 ○, $B$에서 나온 조각을 △, $C$에서 나온 조각을 □라고 표시해요. 그러면 변 $AB$는 ○ + △ = ' + cm(c) + ', 변 $BC$는 △ + □ = ' + cm(a) + ', 변 $CA$는 □ + ○ = ' + cm(b) + '예요. 구하는 $AD$는 ○예요. ○가 들어 있는 두 변을 더하면 ○가 2개, △와 □가 하나씩 있어요. 거기에서 △ + □인 변 $BC$를 빼면 ○ 2개만 남아요. 마지막에 반으로 나눠요.';
    } else {
      ans = z; wrong = { 'not-halved': 2 * z, 'other-vertex': y, 'other-vertex-2': x };
      text = '그림과 같이 원 $O$가 $\\angle C = 90^{\\circ}$인 직각삼각형 $ABC$의 세 변 $AB$, $BC$, $CA$와 각각 점 $D$, $E$, $F$에서 접해요. ' + ov('AB', c) + ', ' + ov('BC', a) + ', ' + ov('CA', b) + '일 때, 원 $O$의 반지름의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '사각형 $OECF$는 네 각이 직각이고 이웃한 두 변이 반지름이라서 정사각형이에요. $\\overline{CE} = \\overline{CF}$가 반지름이에요.', tex: '\\overline{CE} = \\overline{CF} = (\\text{반지름})' }, { say: '변 $BC$와 변 $CA$를 더하고 변 $AB$를 빼면 $\\overline{CE}$ 2개가 남아요.', tex: a + ' + ' + b + ' - ' + c + ' = ' + 2 * z }, { say: '반으로 나눠요.', tex: 2 * z + ' \\div 2 = ' + ans }];
      h2 = '직각이 있는 꼭짓점 $C$를 봐요. 반지름 $OE$와 $OF$는 접선인 변과 수직이라서, 사각형 $OECF$는 네 각이 모두 직각이고 $OE$와 $OF$의 길이가 같은 정사각형이에요. 그래서 $CE$와 $CF$의 길이가 바로 반지름이에요. 이제 조각 문제예요. 변 $BC$(' + cm(a) + ')와 변 $CA$(' + cm(b) + ')를 더하면 $C$ 쪽 조각이 2개, $A$ 쪽과 $B$ 쪽 조각이 하나씩 있어요. 거기에서 변 $AB$(' + cm(c) + ')를 빼면 $C$ 쪽 조각 2개만 남아요.';
    }
    return { text: text, ans: ans, wrong: wrong, steps: steps, hints: [I_KEY, h2, I_LAST], check: enough(ans, wrong) && (!right || a * a + b * b === c * c),
      figure: incFig(x, y, z, (right ? '직각삼각형 ABC 안에 원 O가 꼭 끼어 있다. 직각은 꼭짓점 C에 있다.' : '삼각형 ABC 안에 원 O가 꼭 끼어 있다.') + ' 원은 변 AB와 점 D에서, 변 BC와 점 E에서, 변 CA와 점 F에서 접한다.', right) };
  };
  var incQ = function (kinds) { return sampler(function (r) { return until(function () { var k = r.pick(kinds), t, z; if (k === 'inradius') { t = triple(r, 30); z = (t[0] + t[1] - t[2]) / 2; return { kind: k, x: t[1] - z, y: t[0] - z, z: z }; } return { kind: k, x: r.int(2, 9), y: r.int(2, 9), z: r.int(2, 9), side: r.int(0, 2) }; }, function (q) { return incBuild(q).check; }); }); };
  numQ({
    id: 'B26.incircle', title: '삼각형의 내접원과 접선의 길이', kind: 'int', build: incBuild,
    mistakes: [['wrong-pair', '다른 변의 길이를 구했어요. 묻는 변의 두 끝 꼭짓점을 확인하고, 그 두 꼭짓점에서 나온 접선의 길이를 더해요.'],
      ['wrong-pair-2', '다른 변의 길이를 구했어요. 묻는 변이 어느 접점에서 나뉘는지 보고, 그 변을 이루는 두 조각만 더해요.'],
      ['all-added', '주어진 세 길이를 모두 더했어요. 한 변은 조각 두 개로 되어 있어요. 묻는 변의 두 끝 꼭짓점에 해당하는 두 길이만 더해요.'],
      ['not-doubled', '조각을 한 번씩만 더했어요. 길이가 같은 조각이 두 개씩 있으니 둘레는 그 2배예요. 여섯 조각을 빠짐없이 세어 봐요.'],
      ['side-doubled-only', '꼭짓점 $C$ 쪽 조각을 한 번만 더했어요. $\\overline{CE}$와 $\\overline{CF}$는 길이가 같은 조각 두 개예요. 둘 다 더해요.'],
      ['one-step', '중간에 구한 $\\overline{BD}$의 길이를 답했어요. 한 걸음 더 가야 해요. 그 길이를 변 $BC$로 옮기고, 변 $BC$에서 빼요.'],
      ['direct', '변 $BC$에서 $\\overline{AD}$를 바로 뺐어요. $\\overline{AD}$는 변 $BC$ 위의 조각이 아니에요. 먼저 $\\overline{BD}$를 구해서 $\\overline{BE}$로 옮겨요.'],
      ['not-halved', '반으로 나누지 않았어요. 두 변을 더하고 나머지 변을 빼면 같은 조각이 2개 남아요. 조각 하나는 그 절반이에요.'],
      ['other-vertex', '다른 꼭짓점에서 나온 접선의 길이를 구했어요. 구하는 조각이 들어 있는 두 변을 더하고, 들어 있지 않은 변을 빼요.'],
      ['other-vertex-2', '다른 꼭짓점에서 나온 접선의 길이를 구했어요. 어느 꼭짓점의 조각을 묻는지 그림에서 다시 확인해요.']],
    levels: [
      { name: '변의 길이', minDistinct: 300, vars: { q: incQ(['side']) } },
      { name: '둘레 · 조각 옮기기', minDistinct: 300, vars: { q: incQ(['peri', 'chain']) } },
      { name: '세 변으로 조각 구하기 · 직각삼각형', minDistinct: 150, vars: { q: incQ(['find', 'find', 'inradius']) } }
    ]
  });

  /* ── B26.inscribed 원주각과 중심각 ─────────────────── */
  var O0 = [150, 100], R0 = 74, pt = function (d) { return G.polar(150, 100, R0, d); };
  var circ = function (pts) { var it = [['circle', 150, 100, R0], ['dot', 150, 100]]; Object.keys(pts).forEach(function (n) { it.push(name(pts[n], O0, n)); }); return it; };
  var V_KEY = '원 위의 두 점 $A$, $B$와 중심 $O$를 이어 만든 각 $\\angle AOB$가 중심각이에요. 원 위의 다른 점 $P$에서 $A$와 $B$를 바라본 각 $\\angle APB$가 원주각이에요. 같은 호 $AB$를 바라볼 때, 원주각의 크기는 언제나 중심각의 크기의 절반이에요. 중심은 호에 가까이 있어서 호가 넓게 보이고, 원 위의 점은 멀리 있어서 딱 절반으로 좁게 보인다고 생각하면 돼요.';
  var V_KEY2 = '한 호를 바라보는 원주각은 원 위의 어느 점에서 재어도 크기가 같아요. 모두 같은 중심각의 절반이기 때문이에요. 극장에서 무대의 양 끝을 바라볼 때, 원 모양으로 놓인 자리에서는 어디에 앉아도 무대가 같은 폭으로 보이는 것과 같아요. 특히 지름을 바라보는 원주각은 반원에 대한 원주각이고, 그 중심각이 일직선이라서 원주각은 늘 직각이에요.';
  var V_LAST = '① 각이 바라보는 호를 찾아 색칠해요(각의 두 변이 원과 만나는 두 점 사이). ② 꼭짓점이 중심이면 중심각, 원 위에 있으면 원주각이에요. ③ 같은 호라면 원주각 = 중심각의 절반, 원주각끼리는 같아요. ④ 지름이 있으면 그 지름을 바라보는 원주각이 직각인 것을 써요.';
  var inscribedBuild = function (q) {
    var k = q.k, kind = q.kind, pd = q.pd, ans, wrong, text, steps, h2, A, B, P, Q, it, alt, head = '그림과 같이 원 $O$ 위에 세 점 $A$, $B$, $P$가 있어요. ';
    if (kind === 'c2i' || kind === 'i2c') {
      A = pt(270 - k); B = pt(270 + k); P = pt(pd);
      it = circ({ A: A, B: B, P: P }).concat([seg(O0, A), seg(O0, B), seg(P, A), seg(P, B), k < 45 ? txt(pd > 90 ? 192 : 108, 100, 'O') : txt(150, 87, 'O')], angMark(O0, A, B, kind === 'c2i' ? 2 * k + '°' : 'x'), angMark(P, A, B, kind === 'c2i' ? 'x' : k + '°', 26));
      alt = '원 O 위에 세 점 A, B, P가 있다. 중심 O와 A, B를 이은 중심각 AOB와, 점 P와 A, B를 이은 원주각 APB가 그려져 있다.';
      if (kind === 'c2i') {
        ans = k; wrong = { doubled: 4 * k, same: 2 * k };
        text = head + an('AOB', 2 * k) + '일 때, $\\angle APB$의 크기는 몇 도인지 구하세요.';
        steps = [{ say: '$\\angle AOB$는 호 $AB$에 대한 중심각, $\\angle APB$는 같은 호에 대한 원주각이에요.', tex: '\\angle APB = \\dfrac{1}{2} \\angle AOB' }, { say: '중심각을 반으로 나눠요.', tex: 2 * k + '^{\\circ} \\div 2 = ' + ans + '^{\\circ}' }];
        h2 = '두 각이 같은 호를 바라보는지 먼저 확인해요. $\\angle AOB$의 두 변은 $A$와 $B$에서 원과 만나고, $\\angle APB$의 두 변도 $A$와 $B$에서 원과 만나요. 둘 다 호 $AB$를 바라봐요. 꼭짓점이 중심 $O$에 있는 것이 중심각, 원 위의 점 $P$에 있는 것이 원주각이에요. 주어진 것은 중심각 ' + dg(2 * k) + '이고 묻는 것은 원주각이에요. 원주각은 중심각보다 작아요. 중심각의 절반을 구해요.';
      } else {
        ans = 2 * k; wrong = { halved: k / 2, same: k };
        text = head + an('APB', k) + '일 때, $\\angle AOB$의 크기는 몇 도인지 구하세요.';
        steps = [{ say: '$\\angle APB$는 호 $AB$에 대한 원주각, $\\angle AOB$는 같은 호에 대한 중심각이에요.', tex: '\\angle AOB = 2 \\times \\angle APB' }, { say: '원주각을 2배 해요.', tex: '2 \\times ' + k + '^{\\circ} = ' + ans + '^{\\circ}' }];
        h2 = '두 각이 같은 호를 바라보는지 먼저 확인해요. $\\angle APB$의 두 변은 $A$와 $B$에서 원과 만나고, $\\angle AOB$의 두 변도 $A$와 $B$에서 원과 만나요. 둘 다 호 $AB$를 바라봐요. 꼭짓점이 원 위의 점 $P$에 있는 것이 원주각, 중심 $O$에 있는 것이 중심각이에요. 주어진 것은 원주각 ' + dg(k) + '이고 묻는 것은 중심각이에요. 중심각은 원주각보다 커요. 원주각이 중심각의 절반이니, 거꾸로 중심각은 원주각의 2배예요.';
      }
    } else if (kind === 'same-arc') {
      A = pt(270 - k); B = pt(270 + k); P = pt(128); Q = pt(58);
      it = circ({ A: A, B: B, P: P, Q: Q }).concat([seg(P, A), seg(P, B), seg(Q, A), seg(Q, B), txt(150, 114, 'O')], angMark(P, A, B, k + '°', 26), angMark(Q, A, B, 'x', 26));
      alt = '원 O 위에 네 점 A, B, P, Q가 있다. 점 P와 A, B를 이은 각 APB와, 점 Q와 A, B를 이은 각 AQB가 그려져 있다. 두 점 P, Q는 직선 AB의 같은 쪽에 있다.';
      ans = k; wrong = { doubled: 2 * k, supp: 180 - k, halved: k / 2 };
      text = '그림과 같이 원 $O$ 위에 네 점 $A$, $B$, $P$, $Q$가 있어요. ' + an('APB', k) + '일 때, $\\angle AQB$의 크기는 몇 도인지 구하세요.';
      steps = [{ say: '$\\angle APB$와 $\\angle AQB$는 둘 다 호 $AB$에 대한 원주각이에요.', tex: '\\angle AQB = \\angle APB' }, { say: '한 호에 대한 원주각의 크기는 모두 같아요.', tex: ans + '^{\\circ}' }];
      h2 = '두 각이 바라보는 호를 찾아요. $\\angle APB$의 두 변은 $A$와 $B$에서 원과 만나요. $\\angle AQB$의 두 변도 $A$와 $B$에서 원과 만나요. 두 각은 꼭짓점의 자리만 다르고, 바라보는 호는 똑같이 호 $AB$예요. 그리고 두 꼭짓점 $P$, $Q$는 모두 원 위에 있으니 둘 다 원주각이에요. 같은 호를 바라보는 원주각끼리는 꼭짓점이 어디에 있든 크기가 달라지지 않아요. 계산할 것이 없는 문제예요.';
    } else if (kind === 'semi') {
      A = pt(180); B = pt(0); P = pt(2 * k);
      it = circ({ A: A, B: B, P: P }).concat([seg(A, B), seg(P, A), seg(P, B), txt(150, 112, 'O')], angMark(A, P, B, k + '°', 28), angMark(B, P, A, 'x', 24));
      alt = '원 O의 지름 AB가 가로로 놓여 있고, 원 위의 점 P와 A, B를 이은 삼각형 PAB가 그려져 있다. 각 PAB의 크기는 ' + k + '도이다.';
      ans = 90 - k; wrong = { supp: 180 - k, same: k };
      text = '그림과 같이 선분 $AB$는 원 $O$의 지름이고 점 $P$는 원 위의 점이에요. ' + an('PAB', k) + '일 때, $\\angle PBA$의 크기는 몇 도인지 구하세요.';
      steps = [{ say: '$\\angle APB$는 지름 $AB$를 바라보는 원주각(반원에 대한 원주각)이라서 직각이에요.', tex: '\\angle APB = 90^{\\circ}' }, { say: '삼각형의 세 각의 합은 $180^{\\circ}$이니, 나머지 두 각의 합은 $90^{\\circ}$예요.', tex: '\\angle PAB + \\angle PBA = 90^{\\circ}' }, { say: '주어진 각을 빼요.', tex: '90^{\\circ} - ' + k + '^{\\circ} = ' + ans + '^{\\circ}' }];
      h2 = '문제에 지름이 있으면 직각을 찾아요. $\\angle APB$는 원 위의 점 $P$에서 지름의 두 끝 $A$, $B$를 바라본 각이에요. 지름에 대한 중심각은 일직선이니, 그 절반인 원주각은 직각이에요. 그래서 삼각형 $PAB$는 꼭짓점 $P$에 직각이 있는 직각삼각형이에요. 삼각형의 세 각의 합에서 직각을 빼면, 남은 두 각 $\\angle PAB$와 $\\angle PBA$의 합이 직각과 같아요. 거기에서 주어진 ' + dg(k) + '를 빼요.';
    } else if (kind === 'iso') {
      A = pt(180 + k); B = pt(360 - k); P = pt(pd);
      it = circ({ A: A, B: B, P: P }).concat([seg(O0, A), seg(O0, B), seg(A, B), seg(P, A), seg(P, B), txt(150, 88, 'O')], angMark(A, O0, B, k + '°', 30), angMark(P, A, B, 'x', 26));
      alt = '원 O 위에 세 점 A, B, P가 있다. 반지름 OA, OB와 현 AB로 삼각형 OAB가 그려져 있고, 점 P와 A, B를 이은 원주각 APB가 그려져 있다. 각 OAB의 크기는 ' + k + '도이다.';
      ans = 90 - k; wrong = { 'center-answered': 180 - 2 * k, same: k };
      text = head + an('OAB', k) + '일 때, $\\angle APB$의 크기는 몇 도인지 구하세요.';
      steps = [{ say: '$\\overline{OA} = \\overline{OB}$(반지름)이니 삼각형 $OAB$는 이등변삼각형이에요.', tex: '\\angle OBA = \\angle OAB = ' + k + '^{\\circ}' }, { say: '세 각의 합에서 두 밑각을 빼면 중심각이에요.', tex: '\\angle AOB = 180^{\\circ} - 2 \\times ' + k + '^{\\circ} = ' + (180 - 2 * k) + '^{\\circ}' }, { say: '원주각은 중심각의 절반이에요.', tex: (180 - 2 * k) + '^{\\circ} \\div 2 = ' + ans + '^{\\circ}' }];
      h2 = '두 걸음으로 풀어요. 첫째 걸음은 중심각 $\\angle AOB$를 구하는 것이에요. 삼각형 $OAB$에서 $OA$와 $OB$는 둘 다 반지름이라 길이가 같고, 그래서 두 밑각 $\\angle OAB$와 $\\angle OBA$가 둘 다 ' + dg(k) + '예요. 삼각형의 세 각의 합에서 이 두 각을 빼면 꼭지각인 중심각이 나와요. 둘째 걸음은 원주각이에요. $\\angle APB$는 같은 호 $AB$를 바라보는 원주각이니 방금 구한 중심각의 절반이에요.';
    } else {
      A = pt(270 - k); B = pt(270 + k); P = pt(pd);
      it = circ({ A: A, B: B, P: P }).concat([seg(O0, A), seg(O0, B), seg(P, A), seg(P, B), txt(150, 88, 'O')], angMark(O0, A, B, 2 * k + '°', 12, 15), angMark(P, A, B, 'x', 16, 11));
      alt = '원 O 위에 세 점 A, B, P가 있다. 중심각 AOB의 크기는 ' + 2 * k + '도이고, 점 P는 두 점 A, B 사이의 짧은 호 위에 있다. 점 P와 A, B를 이은 각 APB가 그려져 있다.';
      ans = 180 - k; wrong = { minor: k, 'whole-turn': 360 - 2 * k, same: 2 * k };
      text = '그림과 같이 원 $O$ 위에 세 점 $A$, $B$, $P$가 있고, 점 $P$는 짧은 쪽의 호 $AB$ 위에 있어요. ' + an('AOB', 2 * k) + '일 때, $\\angle APB$의 크기는 몇 도인지 구하세요.';
      steps = [{ say: '$\\angle APB$가 바라보는 호는 점 $P$가 없는 쪽, 긴 호 $AB$예요. 그 호에 대한 중심각을 구해요.', tex: '360^{\\circ} - ' + 2 * k + '^{\\circ} = ' + (360 - 2 * k) + '^{\\circ}' }, { say: '원주각은 그 중심각의 절반이에요.', tex: (360 - 2 * k) + '^{\\circ} \\div 2 = ' + ans + '^{\\circ}' }];
      h2 = '원주각이 바라보는 호는 꼭짓점의 건너편에 있는 호예요. 점 $P$가 짧은 호 위에 있으니, $\\angle APB$가 바라보는 것은 $P$가 없는 긴 쪽의 호 $AB$예요. 그런데 주어진 ' + dg(2 * k) + '는 짧은 호에 대한 중심각이에요. 그래서 그대로 반으로 나누면 안 돼요. 먼저 한 바퀴에서 ' + dg(2 * k) + '를 빼서 긴 호에 대한 중심각을 구해요. 그다음 그 절반이 원주각이에요. 답은 직각보다 큰 각이 돼요.';
    }
    return { text: text, figure: geo(200, alt, it), ans: ans, wrong: wrong, steps: steps, hints: [kind === 'same-arc' || kind === 'semi' ? V_KEY2 : V_KEY, h2, V_LAST], check: enough(ans, wrong) && isInt(ans) };
  };
  var insQ = function (make) { return sampler(function (r) { return until(function () { return make(r); }, function (q) { return inscribedBuild(q).check; }); }); };
  numQ({
    id: 'B26.inscribed', title: '원주각과 중심각', kind: 'int', build: inscribedBuild,
    mistakes: [['doubled', '2배 했어요. 원주각은 중심각의 절반이고, 같은 호에 대한 원주각끼리는 크기가 같아요. 묻는 각이 중심각인지 원주각인지 다시 확인해요.'],
      ['halved', '반으로 나눴어요. 중심각은 원주각의 2배이고, 같은 호에 대한 원주각끼리는 크기가 같아요. 묻는 각의 꼭짓점이 어디에 있는지 확인해요.'],
      ['same', '주어진 각을 그대로 답했어요. 묻는 각과 주어진 각은 꼭짓점의 자리가 달라요. 두 각이 어떤 사이인지 그림에서 확인해요.'],
      ['supp', '$180^{\\circ}$에서 주어진 각을 뺐어요. 삼각형의 세 각의 합을 쓸 때는 지름을 바라보는 직각도 함께 빼야 해요. 같은 호의 원주각이면 크기가 같아요.'],
      ['center-answered', '중심각을 답했어요. 한 걸음 더 가야 해요. 묻는 각은 원 위의 점에서 잰 원주각이니, 중심각의 절반을 구해요.'],
      ['minor', '짧은 호에 대한 중심각을 반으로 나눴어요. 이 원주각이 바라보는 것은 긴 호예요. 한 바퀴에서 주어진 각을 뺀 다음 반으로 나눠요.'],
      ['whole-turn', '긴 호에 대한 중심각을 답했어요. 한 걸음 더 가야 해요. 원주각은 그 중심각의 절반이에요.']],
    levels: [
      { name: '원주각은 중심각의 절반', minDistinct: 120, vars: { q: insQ(function (r) { var c = r.int(0, 1); return { kind: c ? 'c2i' : 'i2c', k: c ? r.int(30, 75) : 2 * r.int(15, 37), pd: r.pick([70, 90, 110]) }; }) } },
      { name: '같은 호 · 지름', minDistinct: 60, vars: { q: insQ(function (r) { return r.int(0, 1) ? { kind: 'same-arc', k: r.int(35, 65) } : { kind: 'semi', k: r.int(25, 65) }; }) } },
      { name: '이등변삼각형 · 긴 호', minDistinct: 90, vars: { q: insQ(function (r) { return r.int(0, 1) ? { kind: 'iso', k: r.int(25, 60), pd: r.pick([70, 90, 110]) } : { kind: 'reflex', k: r.int(50, 75), pd: r.pick([255, 270, 285]) }; }) } }
    ]
  });

  /* ── B26.arc 원주각과 호의 길이 ─────────────────── */
  var A_KEY = '한 원에서 호의 길이와 그 호를 바라보는 원주각의 크기는 함께 늘고 함께 줄어요. 호가 2배로 길어지면 원주각도 2배, 호가 절반이 되면 원주각도 절반이에요. 이런 사이를 정비례라고 해요. 피자를 자를 때 조각의 테두리가 길수록 조각의 각이 큰 것과 같아요. 그래서 길이가 같은 호에 대한 원주각은 크기가 같고, 호의 길이의 비가 곧 원주각의 크기의 비예요.';
  var A_KEY2 = '원 전체(한 바퀴)를 바라보는 중심각은 $360^{\\circ}$이고, 원주각은 중심각의 절반이니 원 전체에 대한 원주각은 $180^{\\circ}$라고 생각할 수 있어요. 원 위의 세 점으로 삼각형을 만들면, 삼각형의 세 각은 저마다 맞은편의 호를 바라보는 원주각이에요. 세 호를 합치면 원 전체이고 세 각을 합치면 $180^{\\circ}$예요. 그래서 호의 길이의 비대로 $180^{\\circ}$를 나누면 세 각이 나와요.';
  var A_LAST = '① 어느 호가 어느 원주각과 짝인지 표시해요(각의 맞은편에 있는 호). ② 호의 길이의 비를 가장 간단한 비로 적어요. ③ 원주각의 크기의 비가 그것과 같아요. 한 칸이 몇 도(또는 몇 cm)인지 구해요. ④ 묻는 쪽의 칸 수만큼 곱해요.';
  var arcBuild = function (q) {
    var kind = q.kind, ans, wrong, text, steps, h2, fig, u = q.u, v = q.v, g = q.g, t = q.t, L1 = u * g, L2 = v * g, k1 = u * t, k2 = v * t, a, b, c, s, part, i, one, nm, arcs, d1, d2, d3, P3;
    if (kind === 'angle') {
      ans = k2; wrong = { same: k1, inverse: (k1 * u) % v ? null : k1 * u / v, added: k1 + (L2 - L1) };
      text = '한 원에서 호 $AB$의 길이는 ' + cm(L1) + ', 호 $CD$의 길이는 ' + cm(L2) + '예요. 호 $AB$에 대한 원주각의 크기가 ' + dg(k1) + '일 때, 호 $CD$에 대한 원주각의 크기는 몇 도인지 구하세요.';
      steps = [{ say: '호의 길이의 비를 가장 간단하게 적어요.', tex: L1 + ' : ' + L2 + ' = ' + u + ' : ' + v }, { say: '원주각의 크기의 비도 같아요. 한 칸의 크기를 구해요.', tex: k1 + '^{\\circ} \\div ' + u + ' = ' + t + '^{\\circ}' }, { say: '호 $CD$는 ' + v + '칸이에요.', tex: t + '^{\\circ} \\times ' + v + ' = ' + ans + '^{\\circ}' }];
      h2 = '호의 길이와 원주각은 정비례해요. 먼저 두 호의 길이 ' + cm(L1) + '와 ' + cm(L2) + '를 견줘서 가장 간단한 비로 바꿔요. 두 수를 같은 수로 나누면 돼요. 그 비가 곧 두 원주각의 크기의 비예요. 호 $AB$ 쪽 칸 수로 ' + dg(k1) + '를 나누면 한 칸이 몇 도인지 나오고, 거기에 호 $CD$ 쪽 칸 수를 곱하면 구하는 원주각이에요. 길이의 차를 각에 더하면 안 돼요. 더하기가 아니라 곱하기로 이어진 사이예요.';
    } else if (kind === 'length') {
      ans = L2; wrong = { same: L1, inverse: (L1 * u) % v ? null : L1 * u / v, added: L1 + (k2 - k1) };
      text = '한 원에서 호 $AB$에 대한 원주각의 크기는 ' + dg(k1) + ', 호 $CD$에 대한 원주각의 크기는 ' + dg(k2) + '예요. 호 $AB$의 길이가 ' + cm(L1) + '일 때, 호 $CD$의 길이는 몇 cm인지 구하세요.';
      steps = [{ say: '원주각의 크기의 비를 가장 간단하게 적어요.', tex: k1 + ' : ' + k2 + ' = ' + u + ' : ' + v }, { say: '호의 길이의 비도 같아요. 한 칸의 길이를 구해요.', tex: L1 + ' \\div ' + u + ' = ' + g }, { say: '호 $CD$는 ' + v + '칸이에요.', tex: g + ' \\times ' + v + ' = ' + ans }];
      h2 = '호의 길이와 원주각은 정비례해요. 먼저 두 원주각 ' + dg(k1) + '와 ' + dg(k2) + '를 견줘서 가장 간단한 비로 바꿔요. 두 수를 같은 수로 나누면 돼요. 그 비가 곧 두 호의 길이의 비예요. 호 $AB$ 쪽 칸 수로 ' + cm(L1) + '를 나누면 한 칸이 몇 cm인지 나오고, 거기에 호 $CD$ 쪽 칸 수를 곱하면 구하는 길이예요. 각의 차를 길이에 더하면 안 돼요. 더하기가 아니라 곱하기로 이어진 사이예요.';
    } else {
      a = q.a; b = q.b; c = q.c; s = a + b + c; i = q.ask; part = [b, c, a][i]; one = 180 / s; nm = ['A', 'B', 'C'][i]; arcs = ['BC', 'CA', 'AB'];
      ans = one * part; wrong = { central: 2 * ans, 'wrong-part': one * [c, a, b][i], 'wrong-part-2': one * [a, b, c][i], 'ratio-of-360': null };
      text = '그림과 같이 원 위에 세 점 $A$, $B$, $C$가 있어요. 호 $AB$, 호 $BC$, 호 $CA$의 길이의 비가 $' + a + ' : ' + b + ' : ' + c + '$일 때, $\\angle ' + nm + '$의 크기는 몇 도인지 구하세요.';
      steps = [{ say: '$\\angle ' + nm + '$가 바라보는 호는 맞은편의 호 $' + arcs[i] + '$예요. 세 각의 크기의 비는 맞은편 호의 길이의 비와 같아요.', tex: '\\angle C : \\angle A : \\angle B = ' + a + ' : ' + b + ' : ' + c },
        { say: '세 각의 합 $180^{\\circ}$를 전체 칸 수로 나눠 한 칸의 크기를 구해요.', tex: '180^{\\circ} \\div (' + a + ' + ' + b + ' + ' + c + ') = ' + one + '^{\\circ}' }, { say: '호 $' + arcs[i] + '$는 ' + part + '칸이에요.', tex: one + '^{\\circ} \\times ' + part + ' = ' + ans + '^{\\circ}' }];
      h2 = '삼각형 $ABC$의 세 각은 모두 원주각이에요. 먼저 $\\angle ' + nm + '$가 어느 호를 바라보는지 찾아요. 꼭짓점 $' + nm + '$에서 나간 두 변이 원과 만나는 두 점 사이, 곧 맞은편에 있는 호 $' + arcs[i] + '$예요. 꼭짓점 이름이 들어 있지 않은 호라고 기억하면 쉬워요. 세 호의 길이의 비에서 그 호가 몇 칸인지 확인해요. 세 각의 합을 전체 칸 수로 나누면 한 칸의 크기가 나오고, 거기에 그 호의 칸 수를 곱해요. 한 바퀴의 각으로 나누면 중심각이 나오니 조심해요.';
      d1 = 90 + 180 * b / s; d2 = d1 + 360 * a / s; d3 = d2 + 360 * b / s; P3 = { A: pt(d1), B: pt(d2), C: pt(d3) };
      fig = geo(200, '원 위에 세 점 A, B, C가 있고 세 점을 이은 삼각형 ABC가 그려져 있다.', [['circle', 150, 100, R0], ['poly', flat([P3.A, P3.B, P3.C])], name(P3.A, O0, 'A'), name(P3.B, O0, 'B'), name(P3.C, O0, 'C')]);
    }
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, hints: [kind === 'tri' ? A_KEY2 : A_KEY, h2, A_LAST], check: enough(ans, wrong) && isInt(ans) && ans < 150 };
  };
  var propQ = function (kinds, mult) { return sampler(function (r) { return until(function () { var u = mult ? 1 : r.int(2, 7), v = mult ? r.int(2, 4) : r.int(1, 7); return u === v || MH.gcd(u, v) !== 1 ? null : { kind: r.pick(kinds), u: u, v: v, g: r.int(2, 9), t: r.int(mult ? 10 : 4, mult ? 40 : 20) }; }, function (q) { return q.u * q.t <= 80 && arcBuild(q).check; }); }); };
  numQ({
    id: 'B26.arc', title: '원주각과 호의 길이', kind: 'int', build: arcBuild,
    mistakes: [['same', '주어진 값을 그대로 답했어요. 두 호는 길이가 다르니 원주각의 크기도 달라요. 호의 길이의 비만큼 원주각도 달라져요.'],
      ['inverse', '비를 거꾸로 썼어요. 호가 길수록 원주각도 커요. 긴 호 쪽이 더 큰 값이 되는지 확인해요.'],
      ['added', '두 값의 차를 더했어요. 호의 길이와 원주각은 더하기가 아니라 곱하기로 이어져 있어요. 비를 세워서 구해요.'],
      ['central', '중심각을 구했어요. 한 바퀴의 각 $360^{\\circ}$가 아니라, 삼각형의 세 각의 합 $180^{\\circ}$를 호의 길이의 비로 나눠요.'],
      ['wrong-part', '다른 호를 바라보는 각을 구했어요. 묻는 각이 바라보는 호는 맞은편에 있는 호, 곧 그 꼭짓점 이름이 들어 있지 않은 호예요.'],
      ['wrong-part-2', '다른 호를 바라보는 각을 구했어요. 꼭짓점에서 나간 두 변이 원과 만나는 두 점 사이의 호가 그 각의 짝이에요.']],
    levels: [
      { name: '호가 몇 배일 때', minDistinct: 150, vars: { q: propQ(['angle', 'length'], true) } },
      { name: '호의 길이의 비', minDistinct: 300, vars: { q: propQ(['angle', 'length'], false) } },
      { name: '원에 내접하는 삼각형', minDistinct: 100, vars: { q: sampler(function (r) { return until(function () { var s = r.pick([4, 5, 6, 9, 10, 12, 15, 18, 20]), a = r.int(1, s - 2), b = r.int(1, s - a - 1); return { kind: 'tri', a: a, b: b, c: s - a - b, ask: r.int(0, 2) }; }, function (q) { return arcBuild(q).check && 6 * Math.min(q.a, q.b, q.c) >= q.a + q.b + q.c; }); }) } }
    ]
  });

  /* ── 개념 카드 ── */
  MH.defineConcept('B26', [
    { title: '원과 현', body: [
      '원 위의 두 점을 이은 선분이 현이에요. 중심을 지나는 현이 지름이고, 가장 긴 현이에요.',
      { figure: chordFig(0.6, false, {}, '원 O 안에 현 AB가 있다. 중심 O에서 현 AB에 내린 수선의 발은 M이고, 반지름 OA가 그어져 있다. 삼각형 OMA는 직각삼각형이다.') },
      '원의 중심에서 현에 내린 수선은 현을 똑같이 둘로 나눠요. 그래서 $\\overline{AM} = \\overline{BM}$이에요.',
      '반지름 $OA$를 그으면 직각삼각형 $OMA$가 생겨요. 빗변은 반지름이에요.',
      { ex: [['\\overline{AM}^{2} = 5^{2} - 3^{2} = 16', '반지름 5, 중심에서 현까지의 거리 3'], ['\\overline{AM} = 4,\\quad \\overline{AB} = 8', '현의 절반은 4, 현 전체는 8']] }
    ] },
    { title: '현의 길이와 중심에서의 거리', body: [
      '한 원에서 중심으로부터 같은 거리에 있는 두 현은 길이가 같아요. 거꾸로 길이가 같은 두 현은 중심에서 같은 거리에 있어요.',
      { figure: chordFig(0.6, true, {}, '원 O 안에 두 현 AB와 CD가 있다. 중심 O에서 현 AB에 내린 수선의 발은 M, 현 CD에 내린 수선의 발은 N이다. 두 수선의 길이가 같다.') },
      { ex: [['\\overline{OM} = \\overline{ON} \\ \\Rightarrow\\ \\overline{AB} = \\overline{CD}', '거리가 같으면 길이가 같다'], ['\\overline{AB} = \\overline{CD} \\ \\Rightarrow\\ \\overline{OM} = \\overline{ON}', '길이가 같으면 거리가 같다']] },
      '현이 중심에 가까울수록 길어요. 중심을 지나면 지름이에요.'
    ] },
    { title: '원의 접선', body: [
      '원과 한 점에서만 만나는 직선이 접선이고, 그 점이 접점이에요. 접선은 접점을 지나는 반지름과 수직이에요.',
      { figure: tanFig(true, 0, {}, '원 O와 원 밖의 점 P가 있다. 점 P에서 그은 두 접선이 점 A와 점 B에서 원에 닿고, 반지름 OA와 OB가 그어져 있다. 두 접점에 직각 표시가 있다.') },
      '원 밖의 한 점에서 그은 두 접선의 길이는 같아요. $\\overline{PA} = \\overline{PB}$예요.',
      { ex: [['\\overline{PA}^{2} = 13^{2} - 5^{2} = 144,\\quad \\overline{PA} = 12', '반지름 5, 중심에서 점 P까지 13'], ['\\angle APB + \\angle AOB = 180^{\\circ}', '사각형 PAOB에서 직각 둘을 뺀 나머지']] }
    ] },
    { title: '삼각형의 내접원', body: [
      '삼각형의 세 변에 모두 접하는 원이 내접원이에요. 꼭짓점마다 길이가 같은 접선이 한 쌍씩 있어요.',
      { figure: incFig(4, 5, 6, '삼각형 ABC 안에 원 O가 꼭 끼어 있다. 원은 변 AB와 점 D에서, 변 BC와 점 E에서, 변 CA와 점 F에서 접한다.', false) },
      { ex: [['\\overline{AD} = \\overline{AF}', '꼭짓점 A에서'], ['\\overline{BD} = \\overline{BE}', '꼭짓점 B에서'], ['\\overline{CE} = \\overline{CF}', '꼭짓점 C에서']] },
      '$\\overline{AD} = 4$, $\\overline{BE} = 5$, $\\overline{CF} = 6$이면 세 변은 $4 + 5$, $5 + 6$, $6 + 4$이고 둘레는 $2 \\times (4 + 5 + 6) = 30$이에요.'
    ] },
    { title: '원주각과 중심각', body: [
      '호 $AB$를 중심 $O$에서 바라본 각이 중심각, 원 위의 점 $P$에서 바라본 각이 원주각이에요.',
      { figure: geo(200, '원 O 위에 세 점 A, B, P가 있다. 중심 O와 A, B를 이은 중심각 AOB는 100도이고, 점 P와 A, B를 이은 원주각 APB는 50도이다.', circ({ A: pt(220), B: pt(320), P: pt(95) }).concat([seg(O0, pt(220)), seg(O0, pt(320)), seg(pt(95), pt(220)), seg(pt(95), pt(320)), txt(165, 93, 'O')], angMark(O0, pt(220), pt(320), '100°'), angMark(pt(95), pt(220), pt(320), '50°', 26))) },
      '원주각의 크기는 같은 호에 대한 중심각의 크기의 절반이에요.',
      { ex: [['\\angle APB = \\dfrac{1}{2} \\angle AOB', '원주각은 중심각의 절반'], ['\\angle AOB = 100^{\\circ} \\ \\Rightarrow\\ \\angle APB = 50^{\\circ}', '그림의 경우']] }
    ] },
    { title: '원주각의 성질', body: [
      '한 호에 대한 원주각은 원 위의 어디에서 재어도 크기가 같아요. 모두 같은 중심각의 절반이기 때문이에요.',
      '지름을 바라보는 원주각(반원에 대한 원주각)은 $90^{\\circ}$예요. 중심각이 $180^{\\circ}$이기 때문이에요.',
      { figure: geo(200, '원 O의 지름 AB가 가로로 놓여 있고, 원 위의 점 P와 A, B를 이은 삼각형 PAB가 그려져 있다. 꼭짓점 P에 직각 표시가 있다.', circ({ A: pt(180), B: pt(0), P: pt(60) }).concat([seg(pt(180), pt(0)), seg(pt(60), pt(180)), seg(pt(60), pt(0)), txt(150, 112, 'O'), ['sq', pt(60)[0], pt(60)[1], 210]])) },
      '한 원에서 호의 길이와 원주각의 크기는 정비례해요.',
      { ex: [['4\\,\\mathrm{cm} \\to 20^{\\circ}', '호의 길이가 4 cm일 때 원주각이 20°이면'], ['12\\,\\mathrm{cm} \\to 60^{\\circ}', '호가 3배이면 원주각도 3배']] }
    ] }
  ]);
})();
