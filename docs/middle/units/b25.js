/* B25 삼각비 — sin · cos · tan 의 뜻, 30° · 45° · 60° 의 값, 길이와 넓이 구하기
   유형(쉬운 것부터): B25.def 삼각비의 뜻 · B25.relation 한 삼각비로 다른 삼각비 구하기 (키패드, 분수)
                     · B25.special 30° · 45° · 60° 의 삼각비 · B25.length 삼각비로 변의 길이 구하기 · B25.apply 삼각비의 활용 · B25.area 삼각비와 넓이 (보기 고르기. 답에 근호)
   답이 분수 하나이면 키패드(분자 / 분모 칸), 답에 근호가 들면 보기 고르기다.
   근호가 든 값은 { n, d, r } = (n/d)√r 로 다루고(정수 계산만) vtex 로 쓴다. 30° · 45° · 60° 의 삼각비는 표 SV, 변의 길이는 제곱의 비 RR 로 구한다.
   그림은 figure 'geo'. 각 30° · 45° · 60° 는 실제 크기대로 그리고, 길이는 적어 넣은 약도다. */
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
      id: o.id, unit: 'B25', version: 1, title: o.title,
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
      id: o.id, unit: 'B25', version: 1, title: o.title,
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
  var deg = function (n) { return n + '^{\\circ}'; }, D = function (n) { return n + '°'; };
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
  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  var red = function (n, d) { var g = gcd(n, d) || 1; return [n / g, d / g]; };
  var ftex = function (f) { return f[1] === 1 ? String(f[0]) : frac(f[0], f[1]); };

  /* ── 틀: 답이 분수(키패드). build(q) → { text, figure, ans: [분자, 분모](기약분수), wrong: { 실수 id: [분자, 분모] }, hints, steps, check } ── */
  var fracQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var same = function (x, y) { return x[0] * y[1] === y[0] * x[1]; };
    var okW = function (p, r) { return !!r && r[0] > 0 && r[1] >= 1 && !same(r, p.ans); };
    o.levels.forEach(function (lv) {
      lv.where = function (v) {
        var p = P(v), ws = [];
        if (!p || p.check !== true || gcd(p.ans[0], p.ans[1]) !== 1 || p.ans[1] === 1) return false;
        o.mistakes.forEach(function (m) { var r = p.wrong[m[0]]; if (okW(p, r) && !ws.some(function (w) { return same(w, r); })) ws.push(r); });
        return ws.length >= 2;
      };
    });
    MH.defineType({
      id: o.id, unit: 'B25', version: 1, title: o.title,
      answer: { kind: 'fraction' },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; if (p.figure) out.figure = p.figure; return out; },
      solve: function (v) { var a = P(v).ans; return { n: a[0], d: a[1] }; },
      verify: function (v, ans) { var p = P(v); return p.check === true && ans.n * p.ans[1] === p.ans[0] * ans.d && gcd(ans.n, ans.d) === 1; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: { n: p.ans[0], d: p.ans[1] } }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), r = p.wrong[m[0]], i, e;
            if (!okW(p, r)) return null;
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) { e = p.wrong[o.mistakes[i][0]]; if (e && same(e, r)) return null; }
            r = red(r[0], r[1]); return { n: r[0], d: r[1] };
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  /* ── 근호가 든 값: (n/d)√r. n ≥ 0, r 은 제곱수로 나누어떨어지지 않는다 ── */
  var simp = function (n) { var k = 1, i; for (i = 2; i * i <= n; i++) while (n % (i * i) === 0) { k *= i; n /= i * i; } return [k, n]; };
  var mk = function (n, d, r) { var s = simp(r || 1), g; n *= s[0]; g = gcd(n, d) || 1; return { n: n / g, d: d / g, r: n === 0 ? 1 : s[1] }; };
  var mul = function (x, y) { return mk(x.n * y.n, x.d * y.d, x.r * y.r); };
  var div = function (x, y) { return mk(x.n * y.d, x.d * y.n * y.r, x.r * y.r); };   /* 1/√r = √r/r */
  var add = function (x, y, sign) { var n; if (x.r !== y.r) return null; n = x.n * y.d + (sign || 1) * y.n * x.d; return n < 0 ? null : mk(n, x.d * y.d, x.r); };
  /** √(N/D) */
  var fromSq = function (N, Dn) { return mk(1, Dn, N * Dn); };
  var vtex = function (x) { var top = x.r === 1 ? String(x.n) : (x.n === 1 ? '' : x.n) + '\\sqrt{' + x.r + '}'; return x.d === 1 ? top : '\\dfrac{' + top + '}{' + x.d + '}'; };
  /** 그림에 적을 글(정수 또는 k√r) */
  var vplain = function (x) { return (x.r === 1 ? String(x.n) : (x.n === 1 ? '' : x.n) + '√' + x.r) + (x.d === 1 ? '' : '/' + x.d); };
  var veq = function (x, y) { return x.n === y.n && x.d === y.d && x.r === y.r; };
  var FN = ['\\sin', '\\cos', '\\tan'], FK = ['사인', '코사인', '탄젠트'];
  /** 30° · 45° · 60° 의 삼각비 */
  var SV = { 30: [mk(1, 2, 1), mk(1, 2, 3), mk(1, 3, 3)], 45: [mk(1, 2, 2), mk(1, 2, 2), mk(1, 1, 1)], 60: [mk(1, 2, 3), mk(1, 2, 1), mk(1, 1, 3)] };
  var tr = function (f, a) { return FN[f] + ' ' + deg(a); };
  /** 직각삼각형에서 각 a 의 (마주 보는 변)² : (붙어 있는 변)² : (빗변)² */
  var RR = { 30: [1, 3, 4], 45: [1, 1, 2], 60: [3, 1, 4] };
  /** 각 a 인 직각삼각형에서 g 번 변의 길이의 제곱이 G2 일 때 x 번 변의 길이(0 마주 보는 변, 1 붙어 있는 변, 2 빗변) */
  var sideOf = function (a, g, G2, x) { return fromSq(G2 * RR[a][x], RR[a][g]); };

  /* ── 그림 ── */
  /** 직각삼각형 ABC(직각은 C, 왼쪽 아래). 가로 BC = a, 세로 CA = b. lab: [BC, CA, AB] 에 적을 글(없으면 null). at: 각 표시를 할 꼭짓점 */
  var defFig = function (a, b, lab, at, alt) {
    var s = Math.min(180 / a, 112 / b), w = Math.max(Math.round(a * s), 80), h = Math.max(Math.round(b * s), 64), x0 = Math.round(155 - w / 2), C = [x0, 150], B = [x0 + w, 150], A = [x0, 150 - h];
    var beta = Math.round(Math.atan2(h, w) * 180 / Math.PI), it = [['poly', flat([C, B, A])], ['sq', C[0], C[1], 0], txt(x0 - 11, 159, 'C'), txt(B[0] + 12, 156, 'B'), txt(x0, A[1] - 11, 'A')];
    it.push(at === 'B' ? ['arc', B[0], B[1], 22, 180 - beta, 180] : ['arc', A[0], A[1], 22, 270, 360 - beta]);
    if (lab[0]) it.push(txt(x0 + w / 2, 165, lab[0])); if (lab[1]) it.push(txt(x0 - 11 - 3 * lab[1].length, 150 - h / 2, lab[1])); if (lab[2]) it.push(txt(x0 + w / 2 + 10 + 3 * lab[2].length, 150 - h / 2 - 11, lab[2]));
    return geo(180, alt, it);
  };
  /** 한 각이 a(30 · 45 · 60)인 직각삼각형. 각은 왼쪽 아래(B), 직각은 오른쪽 아래(C). lab: { opp, adj, hyp } 에 적을 글. names 이면 꼭짓점 이름도 적는다 */
  var trigFig = function (a, lab, alt, names) {
    var dim = { 30: [190, 110], 45: [120, 120], 60: [76, 132] }[a], w = dim[0], h = dim[1], B = [Math.round(145 - w / 2), 152], C = [B[0] + w, 152], A = [C[0], 152 - h], m = G.polar(B[0], B[1], a === 30 ? 50 : 38, a / 2);
    var it = [['poly', flat([B, C, A])], ['sq', C[0], C[1], 90], ['arc', B[0], B[1], a === 30 ? 30 : 20, 0, a], txt(m[0], m[1], D(a))];
    if (names) it.push(txt(B[0] - 12, 156, 'B'), txt(C[0] + 12, 160, 'C'), txt(A[0], A[1] - 11, 'A'));
    if (lab.adj) it.push(txt(B[0] + w / 2 + 14, 167, lab.adj)); if (lab.opp) it.push(txt(C[0] + 12 + 3.5 * lab.opp.length, 152 - h / 2, lab.opp)); if (lab.hyp) it.push(txt(B[0] + w / 2 - 12 - 3 * lab.hyp.length, 152 - h / 2 - 12, lab.hyp));
    return geo(185, alt, it);
  };
  /** 끼인각이 a 인 삼각형 · 평행사변형. 각은 왼쪽 아래 */
  var areaFig = function (a, para, la, lb, alt) {
    var base = para ? 120 : 150, cx = a < 90 ? (para ? 55 : 70) : (para ? 145 : 130), C = [cx, 150], B = [cx + base, 150], A = G.polar(cx, 150, 100, a), m = G.polar(cx, 150, a < 40 ? 48 : 34, a / 2), mid = [(C[0] + A[0]) / 2, (C[1] + A[1]) / 2];
    var it = [['poly', flat(para ? [C, B, [A[0] + base, A[1]], A] : [C, B, A]), true], ['arc', cx, 150, a < 40 ? 28 : 18, 0, a], a >= 150 ? txt(cx - 2, 165, D(a)) : txt(m[0], m[1], D(a)), txt(cx + base / 2 + 10, 165, la), a >= 150 ? txt(mid[0] - 22, mid[1] + 16, lb) : txt(mid[0] - 14 - 3 * lb.length, mid[1] - 4, lb)];
    return geo(180, alt, it);
  };

  /* ── B25.def 삼각비의 뜻 ─────────────────────── */
  var TRI = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  var D_KEY = '직각삼각형에서 한 예각의 크기가 정해지면, 삼각형이 크든 작든 변의 길이의 비는 늘 같아요. 닮은 도형이기 때문이에요. 그 비에 이름을 붙인 것이 삼각비예요. 기준이 되는 각을 정하고, 그 각과 마주 보는 변, 그 각에 붙어 있는 변, 빗변(직각의 맞은편)을 찾아요. 사인은 (마주 보는 변) ÷ (빗변), 코사인은 (붙어 있는 변) ÷ (빗변), 탄젠트는 (마주 보는 변) ÷ (붙어 있는 변)이에요.';
  var D_LAST = '① 기준이 되는 각을 찾아 표시해요. ② 빗변(직각의 맞은편, 가장 긴 변)을 찾아요. ③ 기준각과 마주 보는 변, 기준각에 붙어 있는 변을 찾아요. ④ 사인은 마주 보는 변 ÷ 빗변, 코사인은 붙어 있는 변 ÷ 빗변, 탄젠트는 마주 보는 변 ÷ 붙어 있는 변이에요. 약분도 해요.';
  var defBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, f = q.fn, at = q.at, hide = q.hide, opp = at === 'A' ? a : b, adj = at === 'A' ? b : a, oppN = at === 'A' ? 'BC' : 'CA', adjN = at === 'A' ? 'CA' : 'BC';
    var vals = [[opp, c], [adj, c], [opp, adj]], ans = red(vals[f][0], vals[f][1]), wrong = {}, sides = [['AB', c], ['BC', a], ['CA', b]].filter(function (s, i) { return i !== hide; }), last = sides[sides.length - 1][1];
    var text = '그림의 직각삼각형 $ABC$에서 $\\angle C = 90^{\\circ}$이고 ' + sides.map(function (s) { return '$\\overline{' + s[0] + '} = ' + s[1] + '$'; }).join(', ') + pj(last, '이에요/예요') + '. $' + FN[f] + ' ' + at + '$의 값을 구하세요.';
    var fig = defFig(a, b, [hide === 1 ? null : String(a), hide === 2 ? null : String(b), hide === 0 ? null : String(c)], at, '직각삼각형 ABC가 있다. 직각은 왼쪽 아래의 꼭짓점 C에 있고, 꼭짓점 B는 오른쪽 아래, 꼭짓점 A는 왼쪽 위에 있다. ' + sides.map(function (s) { return '변 ' + s[0] + '의 길이는 ' + s[1]; }).join(', ') + '이다. 각 ' + at + '에 표시가 있다.');
    var steps = [], num = [opp, adj, opp][f], den = [c, c, adj][f], numN = [oppN, adjN, oppN][f], denN = ['AB', 'AB', adjN][f], hn, h2;
    ['as-sin', 'as-cos', 'as-tan'].forEach(function (id, i) { if (i !== f) wrong[id] = vals[i]; });
    wrong.inverted = [vals[f][1], vals[f][0]];
    if (hide >= 0) {
      hn = ['AB', 'BC', 'CA'][hide];
      steps.push(hide === 0 ? { say: '빗변 $AB$의 길이를 피타고라스 정리로 구해요.', tex: '\\overline{AB}^{2} = ' + a + '^{2} + ' + b + '^{2} = ' + c * c + ',\\quad \\overline{AB} = ' + c }
        : { say: '변 $' + hn + '$의 길이를 피타고라스 정리로 구해요. 빗변의 제곱에서 다른 변의 제곱을 빼요.', tex: '\\overline{' + hn + '}^{2} = ' + c + '^{2} - ' + (hide === 1 ? b : a) + '^{2} = ' + (hide === 1 ? a * a : b * b) + ',\\quad \\overline{' + hn + '} = ' + (hide === 1 ? a : b) });
    }
    steps.push({ say: '$\\angle ' + at + '$' + (at === 'A' ? '와' : '와') + ' 마주 보는 변은 $' + oppN + '$, 붙어 있는 변은 $' + adjN + '$, 빗변은 $AB$예요.', tex: FN[f] + ' ' + at + ' = \\dfrac{\\overline{' + numN + '}}{\\overline{' + denN + '}}' });
    steps.push({ say: '길이를 넣어요.' + (gcd(num, den) > 1 ? ' 약분도 해요.' : ''), tex: FN[f] + ' ' + at + ' = ' + frac(num, den) + (gcd(num, den) > 1 ? ' = ' + ftex(ans) : '') });
    h2 = '기준이 되는 각은 $\\angle ' + at + '$예요. 그림에서 꼭짓점 $' + at + '$에 손가락을 올려놓고 생각해요. 직각의 맞은편에 있는 가장 긴 변 $AB$가 빗변이에요. 꼭짓점 $' + at + '$에 닿지 않고 건너편에 있는 변 $' + oppN + '$' + (oppN === 'BC' ? '가' : '가') + ' 마주 보는 변이에요. 꼭짓점 $' + at + '$에 닿아 있으면서 빗변이 아닌 변 $' + adjN + '$' + '가 붙어 있는 변이에요. ' + (hide >= 0 ? '길이가 적혀 있지 않은 변은 피타고라스 정리로 먼저 구해요. ' : '') + FK[f] + '는 ' + ['마주 보는 변을 빗변으로', '붙어 있는 변을 빗변으로', '마주 보는 변을 붙어 있는 변으로'][f] + ' 나눈 값이에요.';
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, check: true, hints: [D_KEY, h2, D_LAST] };
  };
  var triK = function (r, maxC) { var t = r.pick(TRI), k = r.int(1, Math.max(1, Math.floor(maxC / t[2]))), s = r.int(0, 1); return [t[s] * k, t[1 - s] * k, t[2] * k]; };
  fracQ({
    id: 'B25.def', title: '삼각비의 뜻', build: defBuild,
    mistakes: [['as-sin', '사인의 값을 답했어요. 사인은 (마주 보는 변) ÷ (빗변)이에요. 묻는 삼각비가 무엇인지 다시 보고, 분자와 분모에 올 변을 골라요.'],
      ['as-cos', '코사인의 값을 답했어요. 코사인은 (붙어 있는 변) ÷ (빗변)이에요. 묻는 삼각비가 무엇인지 다시 보고, 분자와 분모에 올 변을 골라요.'],
      ['as-tan', '탄젠트의 값을 답했어요. 탄젠트는 (마주 보는 변) ÷ (붙어 있는 변)이에요. 묻는 삼각비가 무엇인지 다시 보고, 분자와 분모에 올 변을 골라요.'],
      ['inverted', '분자와 분모를 거꾸로 썼어요. 사인과 코사인은 빗변이 분모에 오고, 탄젠트는 붙어 있는 변이 분모에 와요.']],
    levels: [
      { name: '세 변을 알 때 (아래쪽 각)', minDistinct: 24, vars: { q: sampler(function (r) { var t = triK(r, 15); return { a: t[0], b: t[1], c: t[2], fn: r.int(0, 2), at: 'B', hide: -1 }; }) } },
      { name: '세 변을 알 때 (두 각)', minDistinct: 80, vars: { q: sampler(function (r) { var t = triK(r, 39); return { a: t[0], b: t[1], c: t[2], fn: r.int(0, 2), at: r.int(0, 2) ? 'A' : 'B', hide: -1 }; }) } },
      { name: '두 변만 알 때', minDistinct: 120, vars: { q: sampler(function (r) { var t = triK(r, 30); return { a: t[0], b: t[1], c: t[2], fn: r.int(0, 2), at: r.int(0, 1) ? 'A' : 'B', hide: r.int(0, 2) }; }) } }
    ]
  });

  /* ── B25.relation 한 삼각비로 다른 삼각비 구하기 ────────── */
  var PRIM = TRI.concat([[9, 40, 41], [12, 35, 37]]);
  var E_KEY = '삼각비 하나를 알면 직각삼각형의 모양이 정해져요. 그래서 나머지 삼각비도 구할 수 있어요. 방법은 그림을 그리는 것이에요. $\\sin A = \\dfrac{3}{5}$이면 마주 보는 변이 3, 빗변이 5인 직각삼각형을 그려요. 실제 길이가 6과 10이어도 비는 같으니, 가장 간단한 3과 5로 그리면 돼요. 그다음 피타고라스 정리로 나머지 한 변을 구하고, 묻는 삼각비를 읽어요.';
  var E_LAST = '① $\\angle C = 90^{\\circ}$인 직각삼각형을 그리고 $\\angle A$를 표시해요. ② 주어진 삼각비의 분자와 분모를 알맞은 변에 적어요. ③ 피타고라스 정리로 나머지 변을 구해요. ④ 묻는 삼각비를 (변) ÷ (변)으로 읽어요.';
  var relBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, from = q.from, to = q.to, vals = [[a, c], [b, c], [a, b]], given = vals[from], ans = vals[to], wrong = {}, steps, h2, third, thirdN, text;
    text = '$\\angle C = 90^{\\circ}$인 직각삼각형 $ABC$에서 $' + FN[from] + ' A = ' + frac(given[0], given[1]) + '$일 때, $' + FN[to] + ' A$의 값을 구하세요.';
    third = from === 0 ? b : from === 1 ? a : c; thirdN = from === 0 ? '붙어 있는 변' : from === 1 ? '마주 보는 변' : '빗변';
    wrong.same = given; wrong.inverted = [ans[1], ans[0]];
    wrong['not-rooted'] = from === 2 ? (to === 0 ? [a, c * c] : [b, c * c]) : (to === 2 ? (from === 0 ? [a, b * b] : [a * a, b]) : (to === 1 ? [b * b, c] : [a * a, c]));
    wrong['one-minus'] = from < 2 && to < 2 ? [c - given[0], c] : null;
    wrong.added = from === 2 ? (to === 0 ? [a, a + b] : [b, a + b]) : null;
    wrong['other-ratio'] = vals[3 - from - to];
    steps = [{ say: '주어진 ' + FK[from] + '의 값에 맞게 직각삼각형을 그려요. ' + ['마주 보는 변을 $' + a + '$, 빗변을 $' + c + '$', '붙어 있는 변을 $' + b + '$, 빗변을 $' + c + '$', '마주 보는 변을 $' + a + '$, 붙어 있는 변을 $' + b + '$'][from] + pj([c, c, b][from], '으로/로') + ' 놓아요.', tex: FN[from] + ' A = ' + frac(given[0], given[1]) },
      { say: '피타고라스 정리로 ' + thirdN + '의 길이를 구해요.', tex: from === 2 ? a + '^{2} + ' + b + '^{2} = ' + c * c + ' = ' + c + '^{2}' : c + '^{2} - ' + given[0] + '^{2} = ' + third * third + ' = ' + third + '^{2}' },
      { say: FK[to] + '는 ' + ['(마주 보는 변) ÷ (빗변)', '(붙어 있는 변) ÷ (빗변)', '(마주 보는 변) ÷ (붙어 있는 변)'][to] + '이에요.', tex: FN[to] + ' A = ' + frac(ans[0], ans[1]) }];
    h2 = '머릿속으로만 하지 말고 직각삼각형을 직접 그려요. 직각을 $C$에 두고 $\\angle A$를 표시해요. 주어진 값 $' + frac(given[0], given[1]) + '$의 분자와 분모를 변에 적어요. ' + FK[from] + '는 ' + ['(마주 보는 변) ÷ (빗변)', '(붙어 있는 변) ÷ (빗변)', '(마주 보는 변) ÷ (붙어 있는 변)'][from] + '이니, 분자 $' + given[0] + '$' + pj(given[0], '은/는') + ' ' + ['마주 보는 변', '붙어 있는 변', '마주 보는 변'][from] + '에, 분모 $' + given[1] + '$' + pj(given[1], '은/는') + ' ' + ['빗변', '빗변', '붙어 있는 변'][from] + '에 적어요. 아직 모르는 ' + thirdN + '은 피타고라스 정리로 구해요. 세 변을 모두 알면 ' + FK[to] + '를 읽을 수 있어요.';
    return { text: text, ans: ans, wrong: wrong, steps: steps, check: true, hints: [E_KEY, h2, E_LAST] };
  };
  var relQ = function (pairs) { return sampler(function (r) { var t = r.pick(PRIM), s = r.int(0, 1), p = r.pick(pairs); return { a: t[s], b: t[1 - s], c: t[2], from: p[0], to: p[1] }; }); };
  fracQ({
    id: 'B25.relation', title: '한 삼각비로 다른 삼각비 구하기', build: relBuild,
    mistakes: [['same', '주어진 값을 그대로 답했어요. 사인, 코사인, 탄젠트는 서로 다른 변의 비예요. 삼각형을 그려서 묻는 삼각비의 변을 찾아요.'],
      ['one-minus', '분모에서 분자를 뺐어요. 나머지 변은 뺄셈이 아니라 피타고라스 정리로 구해요. 빗변의 제곱에서 한 변의 제곱을 빼고 제곱근을 찾아요.'],
      ['added', '빗변을 두 변의 합으로 구했어요. 빗변은 두 변을 각각 제곱해서 더한 다음, 제곱해서 그 값이 되는 수를 찾아요.'],
      ['not-rooted', '피타고라스 정리에서 제곱한 값을 그대로 변의 길이로 썼어요. 제곱해서 그 값이 되는 수가 변의 길이예요.'],
      ['other-ratio', '다른 삼각비의 값을 답했어요. 묻는 삼각비가 사인인지 코사인인지 탄젠트인지 다시 보고, 알맞은 두 변을 골라요.'],
      ['inverted', '분자와 분모를 거꾸로 썼어요. 사인과 코사인은 빗변이 분모에 오고, 탄젠트는 붙어 있는 변이 분모에 와요.']],
    levels: [
      { name: '사인과 코사인', minDistinct: 24, vars: { q: relQ([[0, 1], [1, 0]]) } },
      { name: '탄젠트 구하기', minDistinct: 24, vars: { q: relQ([[0, 2], [1, 2]]) } },
      { name: '탄젠트에서 사인 · 코사인', minDistinct: 24, vars: { q: relQ([[2, 0], [2, 1]]) } }
    ]
  });

  /* ── B25.special 30° · 45° · 60° 의 삼각비 ───────────── */
  var V_KEY = '$30^{\\circ}$, $45^{\\circ}$, $60^{\\circ}$의 삼각비는 두 개의 삼각자에서 나와요. 정삼각형을 반으로 자르면 각이 $30^{\\circ}$, $60^{\\circ}$, $90^{\\circ}$인 직각삼각형이 되고, 세 변의 비는 $1 : \\sqrt{3} : 2$예요. 가장 짧은 변이 $30^{\\circ}$의 맞은편이에요. 정사각형을 대각선으로 자르면 각이 $45^{\\circ}$, $45^{\\circ}$, $90^{\\circ}$인 직각삼각형이 되고, 세 변의 비는 $1 : 1 : \\sqrt{2}$예요. 이 두 삼각형을 그리면 값을 외우지 않아도 읽을 수 있어요.';
  var V_LAST = '① 두 삼각형을 그려요: 변의 비가 $1 : \\sqrt{3} : 2$인 것과 $1 : 1 : \\sqrt{2}$인 것. ② 기준각과 마주 보는 변, 붙어 있는 변, 빗변을 찾아요. ③ 삼각비를 읽어요. ④ 분모에 근호가 있으면 분모와 분자에 같은 근호를 곱해 없애요.';
  var ANG = [30, 45, 60];
  var co = function (f, a) { return f === 2 ? div(mk(1, 1, 1), SV[a][2]) : SV[a][1 - f]; };
  var opOf = function (op, x, y) { return op === '+' ? add(x, y, 1) : op === '-' ? add(x, y, -1) : op === '\\times' ? mul(x, y) : div(x, y); };
  var specialBuild = function (q) {
    var f = q.f, a = q.a, v = SV[a] && SV[a][f], text, tex, ans, cands, steps, h2, x, y, res, xs, ys;
    var shape = function (ang) { return ang === 45 ? '정사각형을 대각선으로 자른 직각삼각형(변의 비 $1 : 1 : \\sqrt{2}$)' : '정삼각형을 반으로 자른 직각삼각형(변의 비 $1 : \\sqrt{3} : 2$)'; };
    if (q.kind === 'value') {
      text = '다음 삼각비의 값을 고르세요.'; tex = tr(f, a); ans = vtex(v);
      cands = mixc([[vtex(co(f, a)), 'co-function', f === 2 ? '분자와 분모를 거꾸로 읽었어요. 탄젠트는 (마주 보는 변) ÷ (붙어 있는 변)이에요.' : '사인과 코사인을 바꿔 읽었어요. 사인은 (마주 보는 변) ÷ (빗변), 코사인은 (붙어 있는 변) ÷ (빗변)이에요.']],
        ANG.filter(function (b) { return b !== a; }).map(function (b, i) { return [vtex(SV[b][f]), i ? 'other-angle-2' : 'other-angle', '$' + deg(b) + '$의 값을 골랐어요($' + tr(f, b) + ' = ' + vtex(SV[b][f]) + '$). 기준각이 $' + deg(a) + '$인 삼각형을 그려서 읽어요.']; }).concat([
          [vtex(SV[a][f === 2 ? 0 : 2]), 'other-function', f === 2 ? '사인의 값을 골랐어요. 탄젠트는 빗변이 아니라 붙어 있는 변으로 나눠요.' : '탄젠트의 값을 골랐어요. 사인과 코사인은 빗변으로 나눠요.'],
          [vtex(SV[a][f === 0 ? 1 : 0]), 'other-function-2', '다른 삼각비의 값을 골랐어요. 묻는 삼각비가 무엇인지 다시 보고 알맞은 두 변을 골라요.']]), q.perm);
      steps = [{ say: shape(a) + '을 그려요. $' + deg(a) + '$와 마주 보는 변, 붙어 있는 변, 빗변을 찾아요.', tex: a === 45 ? '1 : 1 : \\sqrt{2}' : a === 30 ? '1 : \\sqrt{3} : 2' : '\\sqrt{3} : 1 : 2' }, { say: FK[f] + '는 ' + ['(마주 보는 변) ÷ (빗변)', '(붙어 있는 변) ÷ (빗변)', '(마주 보는 변) ÷ (붙어 있는 변)'][f] + '이에요. 분모에 근호가 있으면 없애요.', tex: ans }];
      h2 = '값을 외우지 못해도 그림으로 찾을 수 있어요. $' + deg(a) + '$가 들어 있는 삼각형은 ' + shape(a) + '이에요. 이 삼각형을 그리고 세 변에 길이를 적어요. ' + (a === 45 ? '직각을 낀 두 변이 1, 빗변이 $\\sqrt{2}$예요.' : '가장 짧은 변 1은 $30^{\\circ}$의 맞은편, $\\sqrt{3}$은 $60^{\\circ}$의 맞은편, 빗변은 2예요.') + ' 이제 $' + deg(a) + '$인 각에 손가락을 올려놓고, 마주 보는 변과 붙어 있는 변을 찾아요. ' + FK[f] + '는 ' + ['마주 보는 변을 빗변으로', '붙어 있는 변을 빗변으로', '마주 보는 변을 붙어 있는 변으로'][f] + ' 나눈 값이에요.';
    } else if (q.kind === 'calc') {
      x = SV[a][f]; y = SV[q.a2][q.f2]; res = opOf(q.op, x, y); if (!res || res.n === 0) return null;
      xs = co(f, a); ys = co(q.f2, q.a2);
      text = '다음을 계산한 값을 고르세요.'; tex = tr(f, a) + ' ' + q.op + ' ' + tr(q.f2, q.a2); ans = vtex(res);
      var cand = function (r2, id, why) { return r2 && r2.n > 0 ? [vtex(r2), id, why] : null; };
      cands = mixc([cand(opOf(q.op, xs, y), 'first-swapped', '앞의 값을 헷갈렸어요($' + tr(f, a) + ' = ' + vtex(x) + '$). 삼각형을 그려서 다시 읽어요.')], [
        cand(opOf(q.op, x, ys), 'second-swapped', '뒤의 값을 헷갈렸어요($' + tr(q.f2, q.a2) + ' = ' + vtex(y) + '$). 삼각형을 그려서 다시 읽어요.'),
        cand(opOf(q.op === '+' ? '\\times' : q.op === '\\times' ? '+' : q.op === '-' ? '\\div' : '-', x, y), 'wrong-op', '계산 기호를 잘못 봤어요. 두 값을 구한 다음, 식에 적힌 기호대로 계산해요.'),
        cand(opOf(q.op, xs, ys), 'both-swapped', '두 값을 모두 헷갈렸어요. 사인은 (마주 보는 변) ÷ (빗변), 코사인은 (붙어 있는 변) ÷ (빗변)이에요.'),
        res.r > 1 ? cand(mk(res.n, res.d, 1), 'root-dropped', '근호를 빠뜨렸어요. 근호가 든 값은 계산이 끝날 때까지 근호를 그대로 가지고 가요.') : null,
        cand(mk(res.n * 2, res.d, res.r), 'doubled', '계산 도중에 2를 한 번 덜 나눴어요. 분모끼리 곱하거나 통분할 때 분모를 다시 확인해요.'),
        cand(mk(res.n, res.d * 2, res.r), 'halved', '계산 도중에 2로 한 번 더 나눴어요. 분모끼리 곱하거나 통분할 때 분모를 다시 확인해요.')], q.perm);
      steps = [{ say: '두 삼각비의 값을 각각 구해요.', tex: tr(f, a) + ' = ' + vtex(x) + ',\\quad ' + tr(q.f2, q.a2) + ' = ' + vtex(y) }, { say: '값을 넣고 계산해요.' + (q.op === '\\div' ? ' 나눗셈은 뒤의 수를 뒤집어 곱해요.' : ''), tex: vtex(x) + ' ' + q.op + ' ' + vtex(y) + ' = ' + ans }];
      steps[1] = { say: steps[1].say, tex: ans };
      steps.splice(1, 0, { say: '값을 식에 넣어요.', tex: vtex(x) + ' ' + q.op + ' ' + vtex(y) });
      h2 = '식을 한꺼번에 보지 말고 조각으로 나눠요. 먼저 $' + tr(f, a) + '$의 값을 구해요. ' + shape(a) + '을 그리고 읽으면 돼요. 그다음 $' + tr(q.f2, q.a2) + '$의 값도 같은 방법으로 구해요. 두 값을 구했으면 삼각비는 잊고, 수 두 개의 계산으로 생각해요. ' + (q.op === '+' || q.op === '-' ? '분모가 다르면 통분하고, 근호 안의 수가 같은 것끼리만 더하거나 뺄 수 있어요.' : q.op === '\\times' ? '분자끼리, 분모끼리 곱하고, 근호끼리 곱하면 근호 안의 수를 곱해요.' : '나눗셈은 뒤의 수의 분자와 분모를 뒤집어서 곱해요. 분모에 근호가 남으면 없애요.');
    } else {
      text = '$0^{\\circ} < x < 90^{\\circ}$일 때, 다음을 만족시키는 $x$의 크기를 고르세요.'; tex = FN[f] + ' x = ' + vtex(v); ans = deg(a);
      cands = mixc(a === 45 ? [] : [[deg(90 - a), 'co-angle', (f === 2 ? '분자와 분모를 거꾸로 읽었어요' : '사인과 코사인을 바꿔 읽었어요') + '($' + tr(f, 90 - a) + ' = ' + vtex(SV[90 - a][f]) + '$). 삼각형을 그리고 두 각에서 차례로 값을 읽어 봐요.']],
        [a !== 45 ? [deg(45), 'deg-45', '$45^{\\circ}$의 값은 달라요($' + tr(f, 45) + ' = ' + vtex(SV[45][f]) + '$). $45^{\\circ}$의 삼각비에는 $\\sqrt{2}$가 나오거나 값이 1이에요.'] : null,
          a === 45 ? [deg(30), 'deg-30', '$30^{\\circ}$의 값은 달라요($' + tr(f, 30) + ' = ' + vtex(SV[30][f]) + '$). 삼각형을 그려서 값을 다시 읽어요.'] : null,
          a === 45 ? [deg(60), 'deg-60', '$60^{\\circ}$의 값은 달라요($' + tr(f, 60) + ' = ' + vtex(SV[60][f]) + '$). 삼각형을 그려서 값을 다시 읽어요.'] : null,
          [deg(90), 'deg-90', '$x$는 $90^{\\circ}$보다 작아요. 직각삼각형에서 직각이 아닌 각만 생각해요.'],
          [deg(15), 'deg-15', '$15^{\\circ}$의 삼각비는 이렇게 간단한 값이 아니에요. $30^{\\circ}$, $45^{\\circ}$, $60^{\\circ}$ 가운데에서 찾아요.']], q.perm);
      steps = [{ say: '값에 $\\sqrt{2}$가 있거나 $\\tan$의 값이 1이면 $45^{\\circ}$의 삼각형, 그렇지 않으면 $30^{\\circ}$ · $60^{\\circ}$의 삼각형이에요.', tex: a === 45 ? '1 : 1 : \\sqrt{2}' : '1 : \\sqrt{3} : 2' }, { say: '그 삼각형에서 ' + FK[f] + '의 값이 $' + vtex(v) + '$인 각을 찾아요.', tex: tr(f, a) + ' = ' + vtex(v) }, { say: '그 각이 $x$예요.', tex: ans }];
      h2 = '거꾸로 찾는 문제예요. 값을 보고 어느 삼각형인지 먼저 알아내요. 값에 $\\sqrt{2}$가 있으면(탄젠트는 값이 1이면) 정사각형을 자른 삼각형이고, $\\sqrt{3}$이 있거나 $\\dfrac{1}{2}$이면 정삼각형을 자른 삼각형이에요. 그 삼각형을 그리고 세 변에 길이를 적어요. 그다음 직각이 아닌 두 각에서 차례로 ' + FK[f] + '의 값을 읽어 봐요. 읽은 값이 주어진 $' + vtex(v) + '$인 각이 $x$예요.';
    }
    /* 답이 수 하나(1, 2, 3 …)이고 그 수가 문제에는 없는데 힌트의 변의 비(1 : √3 : 2)에 나오면 내지 않는다 */
    return finish({ text: text, tex: tex, ans: ans, cands: cands, steps: steps, hints: [V_KEY, h2, V_LAST], ok: !(/^\d+$/.test(ans) && nums(text + ' ' + tex).indexOf(ans) < 0 && nums([V_KEY, h2, V_LAST].join(' ')).indexOf(ans) >= 0) });
  };
  var okV = function (q) { var p = specialBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B25.special', title: '30° · 45° · 60°의 삼각비', build: specialBuild,
    ids: ['co-function', 'other-angle', 'other-angle-2', 'other-function', 'other-function-2', 'first-swapped', 'second-swapped', 'wrong-op', 'both-swapped', 'root-dropped', 'doubled', 'halved', 'co-angle', 'deg-45', 'deg-30', 'deg-60', 'deg-90', 'deg-15'],
    levels: [
      { name: '삼각비의 값', minDistinct: 8, vars: { q: sampler(function (r) { return until(function () { return { kind: 'value', f: r.int(0, 2), a: r.pick(ANG), perm: perm6(r), o: order4(r) }; }, okV); }) } },
      { name: '삼각비의 계산', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return { kind: 'calc', f: r.int(0, 2), a: r.pick(ANG), f2: r.int(0, 2), a2: r.pick(ANG), op: r.pick(['+', '-', '\\times', '\\times', '\\div']), perm: perm6(r), o: order4(r) }; }, function (q) { return !(q.f === q.f2 && q.a === q.a2) && okV(q); }); }) } },
      { name: '각의 크기 구하기', minDistinct: 9, vars: { q: sampler(function (r) { return until(function () { return { kind: 'angle', f: r.int(0, 2), a: r.pick(ANG), perm: perm6(r), o: order4(r) }; }, okV); }) } }
    ]
  });

  /* ── B25.length 삼각비로 변의 길이 구하기 ───────────── */
  var SIDE = ['AC', 'BC', 'AB'], ROLE = ['마주 보는 변', '붙어 있는 변', '빗변'];
  var N_KEY = '삼각비는 변의 길이의 비예요. 그래서 각 하나와 변 하나를 알면 다른 변의 길이를 구할 수 있어요. 방법은 늘 같아요. 아는 변과 구하는 변, 두 변이 함께 들어 있는 삼각비를 골라요. 마주 보는 변과 빗변이면 사인, 붙어 있는 변과 빗변이면 코사인, 마주 보는 변과 붙어 있는 변이면 탄젠트예요. 그 삼각비의 값을 넣으면 구하는 변이 $x$인 식이 돼요.';
  var N_LAST = '① 기준각에서 보아 아는 변과 구하는 변이 각각 마주 보는 변 · 붙어 있는 변 · 빗변 가운데 무엇인지 정해요. ② 그 두 변이 들어 있는 삼각비를 골라요. ③ 삼각비 = (변) ÷ (변) 꼴의 식을 쓰고 값을 넣어요. ④ $x$를 구해요. 빗변이 가장 긴지 확인해요.';
  /** 두 변(g 아는 변, x 구하는 변)이 들어 있는 삼각비와 식 */
  var pickFn = function (g, x) { var s = [g, x].sort().join(''); return s === '02' ? 0 : s === '12' ? 1 : 2; };
  var lengthParts = function (a, g, G2, x, names, U) {
    var gv = fromSq(G2, 1), ans = sideOf(a, g, G2, x), other = sideOf(a, g, G2, 3 - g - x), f = pickFn(g, x), top = f === 1 ? 1 : 0, bot = f === 2 ? 1 : 2, sv = SV[a][f], mult = x === top;
    var nm = function (i) { return i === x ? 'x' : vtex(gv); };
    var cands = [[vtex(other) + U, 'other-side', '다른 변의 길이를 구했어요. 구하는 변이 기준각에서 보아 ' + ROLE[x] + '인지 다시 확인하고, 알맞은 삼각비를 골라요.'],
      [vtex(mult ? div(gv, sv) : mul(gv, sv)) + U, 'inverse-op', mult ? '삼각비의 값을 곱해야 하는데 나눴어요. 식 $' + FN[f] + ' ' + deg(a) + ' = \\dfrac{x}{' + vtex(gv) + '}$에서 $x$를 구하려면 양쪽에 분모를 곱해요.' : '삼각비의 값으로 나눠야 하는데 곱했어요. 구하는 변이 분모에 있으니, 아는 변을 삼각비의 값으로 나눠요.'],
      a !== 45 ? [vtex(sideOf(90 - a, g, G2, x)) + U, 'wrong-angle', '$' + deg(90 - a) + '$의 삼각비 값을 썼어요. 기준각은 $' + deg(a) + '$예요($' + tr(f, a) + ' = ' + vtex(sv) + '$).'] : null,
      [vtex(gv) + U, 'same', '주어진 길이를 그대로 골랐어요. 두 변의 길이는 삼각비만큼 달라요. 식을 세워서 계산해요.'],
      [vtex(mk(ans.n * 2, ans.d, ans.r)) + U, 'doubled', '계산 도중에 2로 나누는 것을 빠뜨렸어요. 삼각비의 값의 분모를 다시 확인해요.'],
      [vtex(mk(ans.n, ans.d * 2, ans.r)) + U, 'halved', '계산 도중에 2로 한 번 더 나눴어요. 삼각비의 값의 분모를 다시 확인해요.']];
    var steps = [{ say: '기준각 $' + deg(a) + '$에서 보아 아는 변은 ' + ROLE[g] + ', 구하는 변은 ' + ROLE[x] + '이에요. 두 변이 들어 있는 삼각비는 ' + FK[f] + '예요.', tex: FN[f] + ' ' + deg(a) + ' = \\dfrac{' + nm(top) + '}{' + nm(bot) + '}' },
      { say: '$' + tr(f, a) + ' = ' + vtex(sv) + '$의 값을 넣고 $x$를 구해요.', tex: 'x = ' + vtex(gv) + (mult ? ' \\times ' : ' \\div ') + vtex(sv) },
      { say: mult ? '곱해서 정리해요.' : '나눗셈은 뒤집어서 곱해요. 분모에 근호가 남으면 없애요.', tex: vtex(ans) + U }];
    return { ans: ans, gv: gv, f: f, mult: mult, cands: cands, steps: steps };
  };
  var lengthBuild = function (q) {
    var a = q.a, g = q.g, x = q.x, P = lengthParts(a, g, q.G2, x, SIDE, ''), lab = {}, text, h2;
    if (P.ans.d !== 1) return null;
    lab[['opp', 'adj', 'hyp'][g]] = vplain(P.gv); lab[['opp', 'adj', 'hyp'][x]] = 'x';
    text = '그림의 직각삼각형 $ABC$에서 $\\angle C = 90^{\\circ}$, $\\angle B = ' + deg(a) + '$이고 $\\overline{' + SIDE[g] + '} = ' + vtex(P.gv) + '$일 때, $\\overline{' + SIDE[x] + '}$의 길이 $x$를 고르세요.';
    h2 = '기준각은 $\\angle B = ' + deg(a) + '$예요. 꼭짓점 $B$에 손가락을 올려놓고 두 변의 역할을 정해요. 길이를 아는 변 $' + SIDE[g] + '$' + (g === 0 ? '는' : '는') + ' ' + ROLE[g] + '이고, 구하는 변 $' + SIDE[x] + '$' + '는 ' + ROLE[x] + '이에요. 이 두 변이 함께 들어 있는 삼각비는 ' + FK[P.f] + '예요. ' + FK[P.f] + '의 뜻대로 (변) ÷ (변) 꼴의 식을 쓰고, 한쪽에는 $' + tr(P.f, a) + '$의 값을, 다른 쪽에는 길이와 $x$를 넣어요. ' + (P.mult ? '$x$가 분자에 있으니 양쪽에 분모를 곱하면 돼요.' : '$x$가 분모에 있으니, 아는 길이를 삼각비의 값으로 나누면 돼요.');
    return finish({ text: text, ans: vtex(P.ans), cands: mixc([P.cands[0]], P.cands.slice(1), q.perm),
      figure: trigFig(a, lab, '직각삼각형 ABC가 있다. 직각은 오른쪽 아래의 꼭짓점 C에 있고, 왼쪽 아래의 꼭짓점 B의 각은 ' + a + '도이다. 변 ' + SIDE[g] + '의 길이는 ' + vplain(P.gv) + '이고 변 ' + SIDE[x] + '의 길이는 x이다.', true),
      steps: P.steps, hints: [N_KEY, h2, N_LAST] });
  };
  var okN = function (q) { var p = lengthBuild(q); return !!p && p.check; };
  /** 아는 변의 길이의 제곱: 정수 k 또는 k√2 · k√3 */
  var givenSq = function (r, roots) { var k = r.int(1, 8), m = r.pick(roots); return k * k * m; };
  choiceQ({
    id: 'B25.length', title: '삼각비로 변의 길이 구하기', build: lengthBuild,
    ids: ['other-side', 'inverse-op', 'wrong-angle', 'same', 'doubled', 'halved'],
    levels: [
      { name: '빗변을 알 때', minDistinct: 40, vars: { q: sampler(function (r) { return until(function () { var a = r.pick(ANG); return { a: a, g: 2, x: r.int(0, 1), G2: givenSq(r, a === 45 ? [1, 2, 2] : [1, 1, 3]) * 4, perm: perm6(r), o: order4(r) }; }, okN); }) } },
      { name: '직각을 낀 두 변', minDistinct: 40, vars: { q: sampler(function (r) { return until(function () { var g = r.int(0, 1); return { a: r.pick(ANG), g: g, x: 1 - g, G2: givenSq(r, [1, 1, 3]), perm: perm6(r), o: order4(r) }; }, okN); }) } },
      { name: '빗변 구하기', minDistinct: 40, vars: { q: sampler(function (r) { return until(function () { var a = r.pick(ANG); return { a: a, g: r.int(0, 1), x: 2, G2: givenSq(r, a === 45 ? [1, 2] : [1, 3]), perm: perm6(r), o: order4(r) }; }, okN); }) } }
    ]
  });

  /* ── B25.apply 삼각비의 활용 ────────────────────── */
  var M = '\\,\\mathrm{m}', m_ = function (n) { return '$' + n + M + '$'; };
  var A_KEY = '직접 잴 수 없는 높이나 거리를 삼각비로 구할 수 있어요. 나무에 올라가지 않아도, 나무에서 떨어진 거리와 꼭대기를 올려다본 각만 재면 높이를 알 수 있어요. 요령은 상황 속에서 직각삼각형을 찾아 그리는 것이에요. 땅은 가로, 나무나 벽은 세로이고 둘은 직각으로 만나요. 올려다본 눈길이나 사다리가 빗변이 돼요. 그다음은 변의 길이를 구하는 문제와 똑같아요.';
  var A_LAST = '① 상황을 직각삼각형으로 그려요(땅은 가로, 벽 · 나무는 세로). ② 주어진 각과 길이를 그림에 적어요. ③ 아는 변과 구하는 변이 들어 있는 삼각비를 골라요. ④ 식을 세워 구해요. 눈의 높이가 주어지면 마지막에 더해요.';
  var THING = ['나무', '건물', '탑', '가로등'];
  var applyBuild = function (q) {
    var a = q.a, G0 = q.G, g, x, P, text, ans, cands, steps, h2, fig, nm = THING[q.s || 0], e = q.e, lab = {}, U = M;
    if (q.kind === 'tree' || q.kind === 'eye') { g = 1; x = 0; } else if (q.kind === 'back') { g = 0; x = 1; } else if (q.kind === 'ladder-d') { g = 2; x = 1; } else { g = 2; x = 0; }
    P = lengthParts(a, g, G0 * G0, x, null, U); if (P.ans.d !== 1) return null;
    ans = vtex(P.ans) + U; cands = P.cands; steps = P.steps;
    if (q.kind === 'tree') text = nm + '에서 ' + m_(G0) + ' 떨어진 땅 위의 한 점에서 ' + nm + '의 꼭대기를 올려다본 각의 크기가 $' + deg(a) + '$예요. ' + nm + '의 높이를 고르세요. (눈의 높이는 생각하지 않아요.)';
    else if (q.kind === 'back') text = '높이가 ' + m_(G0) + '인 ' + nm + '의 꼭대기를 땅 위의 한 점에서 올려다본 각의 크기가 $' + deg(a) + '$예요. 그 점에서 ' + nm + '까지의 거리를 고르세요. (눈의 높이는 생각하지 않아요.)';
    else if (q.kind === 'ladder-h') text = '길이가 ' + m_(G0) + '인 사다리를 벽에 기대어 세웠더니 사다리와 바닥이 이루는 각의 크기가 $' + deg(a) + '$였어요. 사다리의 위 끝이 닿은 곳의 높이를 고르세요.';
    else if (q.kind === 'ladder-d') text = '길이가 ' + m_(G0) + '인 사다리를 벽에 기대어 세웠더니 사다리와 바닥이 이루는 각의 크기가 $' + deg(a) + '$였어요. 사다리의 아래 끝에서 벽까지의 거리를 고르세요.';
    else if (q.kind === 'kite') text = '연줄을 ' + m_(G0) + '만큼 풀어 연을 날리고 있어요. 팽팽한 연줄과 땅이 이루는 각의 크기가 $' + deg(a) + '$일 때, 연의 높이를 고르세요. (손의 높이는 생각하지 않아요.)';
    else {
      text = nm + '에서 ' + m_(G0) + ' 떨어진 곳에 서서 ' + nm + '의 꼭대기를 올려다본 각의 크기가 $' + deg(a) + '$예요. 눈의 높이가 ' + m_(e) + '일 때, ' + nm + '의 높이를 고르세요.';
      var plus = function (v, k) { if (k < 0 && v.n * v.n * v.r <= k * k * v.d * v.d) return null; return v.r === 1 && v.d === 1 ? (v.n + k) + U : v.d === 1 ? '(' + vtex(v) + (k < 0 ? ' - ' : ' + ') + Math.abs(k) + ')' + U : null; };
      ans = plus(P.ans, e);
      cands = [[vtex(P.ans) + U, 'eye-forgotten', '눈의 높이를 더하지 않았어요. 삼각형으로 구한 것은 눈높이에서 꼭대기까지의 높이예요. 땅에서 눈까지의 높이를 더해야 해요.']].concat(P.cands.map(function (c) { if (!c) return null; var m2 = /^(.*)\\,\\mathrm\{m\}$/.exec(c[0]), v2 = c[1] === 'other-side' ? sideOf(a, g, G0 * G0, 3 - g - x) : c[1] === 'inverse-op' ? (P.mult ? div(P.gv, SV[a][P.f]) : mul(P.gv, SV[a][P.f])) : c[1] === 'wrong-angle' ? sideOf(90 - a, g, G0 * G0, x) : null, s2 = v2 && plus(v2, e); return m2 && s2 ? [s2, c[1], c[2]] : null; }),
        [[plus(P.ans, -e), 'eye-subtracted', '눈의 높이를 뺐어요. 눈은 땅보다 위에 있으니, 삼각형으로 구한 높이에 눈의 높이를 더해요.']]);
      steps = P.steps.slice(0, 2).concat([{ say: '이것은 눈높이에서 꼭대기까지의 높이예요.', tex: 'x = ' + vtex(P.ans) }, { say: '땅에서 눈까지의 높이를 더해요.', tex: ans }]);
    }
    if (q.kind !== 'eye') {
      lab[['opp', 'adj', 'hyp'][g]] = G0 + ' m'; lab[['opp', 'adj', 'hyp'][x]] = 'x';
      fig = trigFig(a, lab, '직각삼각형으로 나타낸 그림이다. 가로로 놓인 변은 땅, 세로로 놓인 변은 높이이고, 왼쪽 아래의 각은 ' + a + '도이다. ' + ['세로로 놓인 변', '가로로 놓인 변', '비스듬한 변'][g] + '의 길이는 ' + G0 + '미터이고 ' + ['세로로 놓인 변', '가로로 놓인 변', '비스듬한 변'][x] + '의 길이는 x이다.', false);
    }
    h2 = '먼저 상황을 직각삼각형으로 바꿔 그려요. 땅을 가로선으로, ' + (q.kind.indexOf('ladder') === 0 ? '벽' : q.kind === 'kite' ? '연에서 땅으로 내린 선' : nm) + '을 세로선으로 그리면 둘이 직각으로 만나요. ' + (g === 2 ? '비스듬한 ' + (q.kind === 'kite' ? '연줄' : '사다리') + '이 빗변이에요.' : '올려다본 눈길이 빗변이에요.') + ' 각 $' + deg(a) + '$는 땅과 빗변 사이에 있어요. 이 각에서 보아 길이 ' + m_(G0) + '를 아는 변은 ' + ROLE[g] + '이고, 구하는 변은 ' + ROLE[x] + '이에요. 이 두 변이 들어 있는 삼각비는 ' + FK[P.f] + '예요. ' + FK[P.f] + '의 식에 값과 길이를 넣어 풀어요.' + (q.kind === 'eye' ? ' 마지막에 눈의 높이를 잊지 않아요.' : '');
    return finish({ text: text, figure: fig, ans: ans, cands: mixc([cands[0]], cands.slice(1), q.perm), steps: steps, hints: [A_KEY, h2, A_LAST] });
  };
  var okA = function (q) { var p = applyBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B25.apply', title: '삼각비의 활용', build: applyBuild,
    ids: ['other-side', 'inverse-op', 'wrong-angle', 'same', 'doubled', 'halved', 'eye-forgotten', 'eye-subtracted'],
    levels: [
      { name: '올려다본 각으로 높이 구하기', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return { kind: 'tree', a: r.pick(ANG), G: r.int(3, 30), s: r.int(0, 3), perm: perm6(r), o: order4(r) }; }, okA); }) } },
      { name: '사다리와 연', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return { kind: r.pick(['ladder-h', 'ladder-d', 'kite']), a: r.pick(ANG), G: 2 * r.int(1, 15), perm: perm6(r), o: order4(r) }; }, function (q) { return (q.kind === 'kite' || q.G <= 12) && okA(q); }); }) } },
      { name: '눈의 높이 · 거리 구하기', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return r.int(0, 1) ? { kind: 'eye', a: r.pick(ANG), G: r.int(3, 30), e: r.int(1, 2), s: r.int(0, 3), perm: perm6(r), o: order4(r) } : { kind: 'back', a: r.pick(ANG), G: r.int(3, 30), s: r.int(0, 3), perm: perm6(r), o: order4(r) }; }, okA); }) } }
    ]
  });

  /* ── B25.area 삼각비와 넓이 ─────────────────────── */
  var CM = '\\,\\mathrm{cm}', CM2 = '\\,\\mathrm{cm}^{2}', cm = function (n) { return '$' + n + CM + '$'; };
  var Z_KEY = '삼각형의 넓이는 (밑변) × (높이) ÷ 2예요. 그런데 높이를 모르고 두 변과 그 사이의 각(끼인각)만 알 때가 있어요. 이때 삼각비로 높이를 만들 수 있어요. 두 변이 $a$, $b$이고 끼인각이 $C$이면, $b$를 빗변으로 하는 직각삼각형에서 높이는 $b \\sin C$예요. 그래서 넓이는 $\\dfrac{1}{2}ab \\sin C$예요. 평행사변형은 삼각형 두 개이니 $ab \\sin C$예요.';
  var Z_LAST = '① 두 변과 그 사이의 각(끼인각)을 확인해요. ② 삼각형은 $\\dfrac{1}{2} \\times a \\times b \\times \\sin C$, 평행사변형은 $a \\times b \\times \\sin C$예요. ③ 각이 $90^{\\circ}$보다 크면 $180^{\\circ}$에서 뺀 각의 사인을 써요. ④ 수끼리 먼저 곱하고 근호는 그대로 붙여요.';
  var areaBuild = function (q) {
    var a = q.a, b = q.b, C = q.C, C0 = C > 90 ? 180 - C : C, para = q.para, sn = SV[C0][0], cs = SV[C0][1], base = mk(a * b, para ? 1 : 2, 1), res = mul(base, sn), text, ans, cands, steps, h2;
    if (res.d !== 1) return null;
    ans = vtex(res) + CM2;
    text = para ? '그림의 평행사변형에서 이웃한 두 변의 길이가 ' + cm(a) + ', ' + cm(b) + '이고 그 끼인각의 크기가 $' + deg(C) + '$예요. 이 평행사변형의 넓이를 고르세요.' : '그림의 삼각형에서 두 변의 길이가 ' + cm(a) + ', ' + cm(b) + '이고 그 끼인각의 크기가 $' + deg(C) + '$예요. 이 삼각형의 넓이를 고르세요.';
    cands = mixc([para ? [vtex(mul(mk(a * b, 2, 1), sn)) + CM2, 'halved', '2로 나눴어요. 2로 나누는 것은 삼각형이에요. 평행사변형은 삼각형 두 개라서 두 변과 사인의 값을 곱하기만 해요.'] : [vtex(mul(mk(a * b, 1, 1), sn)) + CM2, 'not-halved', '2로 나누지 않았어요. 그 값은 평행사변형의 넓이예요. 삼각형은 그 절반이에요.']], [
      [vtex(base) + CM2, 'no-sine', '사인의 값을 곱하지 않았어요. 두 변을 곱하기만 하면 끼인각이 직각일 때의 넓이예요. 사인의 값($' + FN[0] + ' ' + deg(C0) + ' = ' + vtex(sn) + '$)도 곱해요.'],
      [vtex(mul(base, cs)) + CM2, 'cos-used', '코사인의 값을 곱했어요. 높이는 끼인각과 마주 보는 변이라서 사인을 써요($' + FN[0] + ' ' + deg(C0) + ' = ' + vtex(sn) + '$).'],
      [(2 * (a + b)) + CM2, 'perimeter', '두 변을 더해서 2배 했어요. 그것은 둘레를 구하는 계산이에요. 넓이는 두 변과 사인의 값을 곱해요.'],
      [vtex(mul(base, SV[C0][2])) + CM2, 'tan-used', '탄젠트의 값을 곱했어요. 넓이 공식에는 사인이 들어가요($' + FN[0] + ' ' + deg(C0) + ' = ' + vtex(sn) + '$).'],
      res.r > 1 ? [vtex(mk(res.n, res.d, 1)) + CM2, 'root-dropped', '근호를 빠뜨렸어요. $' + FN[0] + ' ' + deg(C0) + ' = ' + vtex(sn) + '$의 근호를 끝까지 가지고 가요.'] : null], q.perm);
    steps = (C > 90 ? [{ say: '끼인각이 $90^{\\circ}$보다 커요. $180^{\\circ}$에서 뺀 각의 사인을 써요.', tex: '180^{\\circ} - ' + deg(C) + ' = ' + deg(C0) }] : []).concat([
      { say: (para ? '평행사변형의 넓이는 (한 변) × (이웃한 변) × (끼인각의 사인)이에요.' : '삼각형의 넓이는 $\\dfrac{1}{2}$ × (한 변) × (다른 변) × (끼인각의 사인)이에요.'), tex: (para ? '' : '\\dfrac{1}{2} \\times ') + a + ' \\times ' + b + ' \\times ' + FN[0] + ' ' + deg(C0) },
      { say: '사인의 값($' + FN[0] + ' ' + deg(C0) + ' = ' + vtex(sn) + '$)을 넣어요.', tex: (para ? '' : '\\dfrac{1}{2} \\times ') + a + ' \\times ' + b + ' \\times ' + vtex(sn) },
      { say: '수끼리 곱하고 근호는 그대로 붙여요.', tex: ans }]);
    h2 = '높이가 주어지지 않았으니 삼각비로 높이를 만들어요. 길이가 ' + cm(a) + '인 변을 밑변으로 눕혀 놓아요. 다른 변 ' + cm(b) + '의 끝에서 밑변' + (C > 90 ? '을 길게 늘인 선' : '') + '에 직각으로 선을 내리면 그것이 높이예요. 이때 ' + cm(b) + '인 변이 빗변인 직각삼각형이 생기고, 높이는 ' + (C > 90 ? '$180^{\\circ} - ' + deg(C) + '$인 각' : '끼인각 $' + deg(C) + '$') + '과 마주 보는 변이에요. 그래서 높이는 (빗변) × (사인의 값)이에요. 밑변에 이 높이를 곱하고' + (para ? ', 평행사변형이니 2로 나누지 않아요.' : ', 삼각형이니 2로 나눠요.');
    return finish({ text: text, ans: ans, cands: cands, steps: steps, hints: [Z_KEY, h2, Z_LAST],
      figure: areaFig(C, para, a + ' cm', b + ' cm', (para ? '평행사변형' : '삼각형') + '이 있다. 아래쪽 변의 길이는 ' + a + '센티미터, 왼쪽 아래 꼭짓점에서 비스듬히 올라가는 변의 길이는 ' + b + '센티미터이고, 두 변 사이의 각은 ' + C + '도이다.') });
  };
  var okZ = function (q) { var p = areaBuild(q); return !!p && p.check; };
  var areaQ = function (angs, paras) { return sampler(function (r) { return until(function () { var a = r.int(3, 12), b = r.int(2, 10); return a === b ? null : { a: a, b: b, C: r.pick(angs), para: r.pick(paras), perm: perm6(r), o: order4(r) }; }, okZ); }); };
  choiceQ({
    id: 'B25.area', title: '삼각비와 넓이', build: areaBuild,
    ids: ['halved', 'not-halved', 'no-sine', 'cos-used', 'perimeter', 'tan-used', 'root-dropped'],
    levels: [
      { name: '삼각형의 넓이', minDistinct: 60, vars: { q: areaQ(ANG, [false]) } },
      { name: '평행사변형의 넓이', minDistinct: 60, vars: { q: areaQ(ANG, [true]) } },
      { name: '끼인각이 둔각일 때', minDistinct: 100, vars: { q: areaQ([120, 135, 150], [false, false, true]) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B25', [
  { title: '삼각비란', body: [
    '직각삼각형에서 한 예각의 크기가 같으면, 삼각형이 크든 작든 변의 길이의 비는 늘 같아요(닮은 도형). 그 비가 삼각비예요.',
    { figure: { type: 'geo', h: 180, alt: '직각삼각형 ABC가 있다. 직각은 오른쪽 아래의 꼭짓점 C에 있고, 왼쪽 아래의 꼭짓점 B에 각 표시가 있다. 변 AB는 빗변, 변 AC는 각 B와 마주 보는 변, 변 BC는 각 B에 붙어 있는 변이다.', items: [['poly', [50, 150, 230, 150, 230, 45]], ['sq', 230, 150, 90], ['arc', 50, 150, 26, 0, 30], ['text', 38, 156, 'B'], ['text', 242, 158, 'C'], ['text', 230, 34, 'A'], ['text', 122, 84, '빗변'], ['text', 266, 98, '마주 보는 변'], ['text', 140, 166, '붙어 있는 변']] } },
    { ex: [['\\sin B = \\dfrac{(\\text{마주 보는 변})}{(\\text{빗변})}', '사인'], ['\\cos B = \\dfrac{(\\text{붙어 있는 변})}{(\\text{빗변})}', '코사인'], ['\\tan B = \\dfrac{(\\text{마주 보는 변})}{(\\text{붙어 있는 변})}', '탄젠트']] },
    '기준이 되는 각이 바뀌면 마주 보는 변과 붙어 있는 변도 바뀌어요. 빗변은 늘 직각의 맞은편이에요.'
  ] },
  { title: '삼각비 구하기', body: [
    '세 변이 3, 4, 5인 직각삼각형에서 가장 짧은 변 3과 마주 보는 각을 $A$라고 하면:',
    { ex: [['\\sin A = \\dfrac{3}{5}', '마주 보는 변 3 ÷ 빗변 5'], ['\\cos A = \\dfrac{4}{5}', '붙어 있는 변 4 ÷ 빗변 5'], ['\\tan A = \\dfrac{3}{4}', '마주 보는 변 3 ÷ 붙어 있는 변 4']] },
    '삼각비 하나만 알아도 삼각형을 그릴 수 있어요. $\\sin A = \\dfrac{5}{13}$이면 마주 보는 변 5, 빗변 13으로 그리고, 피타고라스 정리로 나머지 변 12를 구해요. 그러면 $\\cos A = \\dfrac{12}{13}$이에요.'
  ] },
  { title: '30°, 45°, 60°의 삼각비', body: [
    '정삼각형을 반으로 자르면 변의 비가 $1 : \\sqrt{3} : 2$인 직각삼각형이 나와요. 정사각형을 대각선으로 자르면 $1 : 1 : \\sqrt{2}$예요.',
    { figure: { type: 'geo', h: 170, alt: '직각삼각형 두 개가 있다. 왼쪽은 각이 30도와 60도이고 변의 길이가 1, 루트 3, 2이다. 오른쪽은 각이 45도이고 변의 길이가 1, 1, 루트 2이다.', items: [['poly', [20, 140, 150, 140, 150, 65]], ['sq', 150, 140, 90], ['arc', 20, 140, 30, 0, 30], ['text', 66, 131, '30°'], ['arc', 150, 65, 16, 210, 270], ['text', 138, 90, '60°'], ['text', 85, 155, '√3'], ['text', 161, 104, '1'], ['text', 78, 90, '2'], ['poly', [190, 140, 280, 140, 280, 50]], ['sq', 280, 140, 90], ['arc', 190, 140, 20, 0, 45], ['text', 224, 129, '45°'], ['text', 235, 155, '1'], ['text', 290, 96, '1'], ['text', 224, 84, '√2']] } },
    { ex: [['\\sin 30^{\\circ} = \\dfrac{1}{2},\\ \\cos 30^{\\circ} = \\dfrac{\\sqrt{3}}{2},\\ \\tan 30^{\\circ} = \\dfrac{\\sqrt{3}}{3}', '30°'], ['\\sin 45^{\\circ} = \\dfrac{\\sqrt{2}}{2},\\ \\cos 45^{\\circ} = \\dfrac{\\sqrt{2}}{2},\\ \\tan 45^{\\circ} = 1', '45°'], ['\\sin 60^{\\circ} = \\dfrac{\\sqrt{3}}{2},\\ \\cos 60^{\\circ} = \\dfrac{1}{2},\\ \\tan 60^{\\circ} = \\sqrt{3}', '60°']] },
    '외우기 어려우면 두 삼각형을 그려서 읽으면 돼요.'
  ] },
  { title: '변의 길이 구하기', body: [
    '각 하나와 변 하나를 알면 다른 변을 구할 수 있어요. 아는 변과 구하는 변이 함께 들어 있는 삼각비를 골라요.',
    { ex: [['\\sin 30^{\\circ} = \\dfrac{x}{8}', '빗변 8, 구하는 변은 마주 보는 변'], ['x = 8 \\times \\dfrac{1}{2} = 4', '양쪽에 8을 곱해요']] },
    { ex: [['\\tan 60^{\\circ} = \\dfrac{x}{5}', '붙어 있는 변 5, 구하는 변은 마주 보는 변'], ['x = 5 \\times \\sqrt{3} = 5\\sqrt{3}', '양쪽에 5를 곱해요']] },
    '구하는 변이 분모에 있으면, 아는 변을 삼각비의 값으로 나눠요.'
  ] },
  { title: '높이와 거리 재기', body: [
    '나무에서 10 m 떨어진 곳에서 꼭대기를 올려다본 각이 $30^{\\circ}$이면, 땅 · 나무 · 눈길로 직각삼각형을 그려요.',
    { figure: { type: 'geo', h: 185, alt: '직각삼각형으로 나타낸 그림이다. 가로로 놓인 변은 땅이고 길이는 10미터, 세로로 놓인 변은 나무의 높이 x이고, 왼쪽 아래의 각은 30도이다.', items: [['poly', [50, 152, 240, 152, 240, 42]], ['sq', 240, 152, 90], ['arc', 50, 152, 30, 0, 30], ['text', 98, 139, '30°'], ['text', 159, 167, '10 m'], ['text', 256, 97, 'x']] } },
    { ex: [['\\tan 30^{\\circ} = \\dfrac{x}{10}', '붙어 있는 변 10, 구하는 변은 마주 보는 변'], ['x = 10 \\times \\dfrac{\\sqrt{3}}{3} = \\dfrac{10\\sqrt{3}}{3}', '나무의 높이(m)']] },
    '눈의 높이가 주어지면 마지막에 더해요.'
  ] },
  { title: '삼각비와 넓이', body: [
    '두 변 $a$, $b$와 그 끼인각 $C$를 알면 높이가 $b \\sin C$라서 넓이를 구할 수 있어요.',
    { ex: [['S = \\dfrac{1}{2}ab \\sin C', '삼각형'], ['S = ab \\sin C', '평행사변형']] },
    { ex: [['\\dfrac{1}{2} \\times 6 \\times 4 \\times \\sin 30^{\\circ} = \\dfrac{1}{2} \\times 6 \\times 4 \\times \\dfrac{1}{2} = 6', '두 변이 6, 4이고 끼인각이 30°인 삼각형'], ['6 \\times 4 \\times \\sin 60^{\\circ} = 6 \\times 4 \\times \\dfrac{\\sqrt{3}}{2} = 12\\sqrt{3}', '이웃한 두 변이 6, 4이고 끼인각이 60°인 평행사변형']] },
    '끼인각이 $90^{\\circ}$보다 크면 $180^{\\circ}$에서 뺀 각의 사인을 써요. 끼인각이 $120^{\\circ}$이면 $\\sin 60^{\\circ}$를 써요.'
  ] }
]);
