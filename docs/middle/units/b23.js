/* B23 도형의 기초 — 각과 평행선, 삼각형 · 사각형의 성질, 다각형의 각, 넓이, 원과 부채꼴
   유형(쉬운 것부터): B23.angle 각과 평행선 · B23.triangle 삼각형의 각 · B23.polygon 다각형의 각과 대각선 · B23.quad 사각형의 성질
                     · B23.area 도형의 넓이 (키패드, 자연수) · B23.circle 원과 부채꼴 (보기 고르기. 답에 π 가 들어간다)
   답이 수 하나(각도 · 개수 · 길이 · 넓이)이면 키패드, 답이 π 가 든 식이면 보기 고르기다.
   답은 모두 정수로 계산한다. 그림은 figure { type: 'geo', h, alt, items } 로 그리고, 그림 좌표만 MH.geo(polar · reach · tri)로 정한다.
   각 표시는 mark(꼭짓점, 도1, 도2, 이름) 으로 넣는다: 호 ['arc', …] 바로 뒤에 그 이름 ['text', …] 이 온다(검사가 이 짝으로 각의 크기를 읽는다).
   각도 그림은 실제 크기대로 그리고, 넓이 그림은 길이를 적어 넣은 약도다(길이의 비는 맞지 않는다). */
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
      id: o.id, unit: 'B23', version: 1, title: o.title,
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
      id: o.id, unit: 'B23', version: 1, title: o.title,
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
  var CM = '\\,\\mathrm{cm}', CM2 = '\\,\\mathrm{cm}^{2}';
  var cm = function (n) { return '$' + n + CM + '$'; };
  var intOr = function (n, d) { return d !== 0 && n % d === 0 ? n / d : null; };
  /** 틀린 답 후보가 둘은 있는가(키패드 문제. 답은 자연수) */
  var enough = function (wrong, ans) { var ws = []; Object.keys(wrong).forEach(function (id) { var w = wrong[id]; if (isInt(w) && w >= 1 && w !== ans && ws.indexOf(w) < 0) ws.push(w); }); return ws.length >= 2; };
  /** 각 표시(호)와 그 이름. 도1 < 도2 */
  var mark = function (V, d1, d2, label) {
    var span = d2 - d1, small = span < 40, p = G.polar(V[0], V[1], String(label).length > 4 ? (small ? 62 : 50) : small ? 46 : 33, (d1 + d2) / 2);
    return [['arc', V[0], V[1], small ? 26 : 17, d1, d2], ['text', p[0], p[1], String(label)]];
  };
  var seg = function (P, Q, dash) { return dash ? ['seg', P[0], P[1], Q[0], Q[1], true] : ['seg', P[0], P[1], Q[0], Q[1]]; };
  var txt = function (x, y, s) { return ['text', x, y, String(s)]; };
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

  /* ── B23.angle 각과 평행선 ─────────────────────── */
  var A_KEY = '각의 크기는 벌어진 정도예요. 한 바퀴는 $360^{\\circ}$, 반 바퀴인 곧은 직선(평각)은 $180^{\\circ}$, 책 모서리 같은 직각은 $90^{\\circ}$예요. 두 직선이 만나면 서로 마주 보는 각(맞꼭지각)은 크기가 같아요. 가위를 벌리면 양쪽 날과 양쪽 손잡이가 똑같이 벌어지는 것과 같아요. 평행한 두 직선이 다른 직선과 만나면 같은 자리에 있는 각(동위각)과 엇갈린 자리에 있는 각(엇각)의 크기가 같아요.';
  var A_LAST = '① 그림에서 직선(평각 $180^{\\circ}$)을 찾아요. ② 마주 보는 각은 같아요(맞꼭지각). ③ 평행선이 있으면 같은 자리의 각, 엇갈린 자리의 각이 같아요. ④ 구한 각이 그림에서 뾰족한지(예각) 벌어졌는지(둔각) 눈으로 확인해요.';
  var POS = { NE: 0, NW: 1, SW: 2, SE: 3 }, PNAME = ['오른쪽 위', '왼쪽 위', '왼쪽 아래', '오른쪽 아래'];
  var ex = function (k, c) { return (k === 1 ? '' : k) + 'x' + (c === 0 ? '' : (c > 0 ? ' + ' : ' - ') + abs(c)); };
  var angleBuild = function (q) {
    var a = q.a, b = q.b, t = q.t, O, P, text, ans, wrong = {}, steps, h2, fig, items, Pt, Pb, val, gi, xi, top, A1, B1;
    if (q.kind === 'straight') {
      O = [150, 140]; P = G.polar(150, 140, 115, a); ans = 180 - a;
      fig = geo(165, '곧은 직선 위의 한 점에서 비스듬히 반직선을 그었다. 반직선과 직선이 이루는 두 각 가운데 오른쪽 각은 ' + a + '도이고 왼쪽 각은 x이다.', [seg([20, 140], [280, 140]), seg(O, P)].concat(mark(O, 0, a, D(a)), mark(O, a, 180, 'x')));
      text = '그림처럼 직선 위의 한 점에서 반직선을 그었어요. 한쪽 각의 크기가 $' + deg(a) + '$일 때, $\\angle x$의 크기는 몇 도인가요?';
      wrong.equal = a; wrong['right-angle'] = 90 - a; wrong.full = 360 - a;
      steps = [{ say: '두 각을 합치면 곧은 직선이 돼요. 직선은 평각이라 $180^{\\circ}$예요.', tex: '\\angle x + ' + deg(a) + ' = 180^{\\circ}' }, { say: '$180^{\\circ}$에서 주어진 각을 빼요.', tex: '\\angle x = ' + deg(ans) }];
      h2 = '그림에서 두 각은 나란히 붙어 있고, 둘의 바깥쪽 변은 하나의 곧은 직선을 이루어요. 곧은 직선은 반 바퀴를 돈 것과 같으니 평각이에요. 그래서 두 각의 크기를 더하면 평각의 크기와 같아요. 주어진 각이 $' + deg(a) + '$이니, 평각의 크기에서 그만큼을 빼면 $\\angle x$의 크기가 나와요. 그림에서 $\\angle x$가 ' + (a > 90 ? '뾰족한 각' : '많이 벌어진 각') + '인지 눈으로도 확인해요.';
    } else if (q.kind === 'vertical') {
      O = [150, 95]; ans = a; P = G.polar(150, 95, 95, a); Pb = G.polar(150, 95, 95, a + 180);
      fig = geo(190, '두 직선이 한 점에서 만난다. 만나서 생긴 네 각 가운데 오른쪽 위의 각은 ' + a + '도이고, 그 각과 마주 보는 왼쪽 아래의 각은 x이다.', [seg([20, 95], [280, 95]), seg(P, Pb)].concat(mark(O, 0, a, D(a)), mark(O, 180, 180 + a, 'x')));
      text = '그림처럼 두 직선이 한 점에서 만나요. 한 각의 크기가 $' + deg(a) + '$일 때, 마주 보는 각인 $\\angle x$의 크기는 몇 도인가요?';
      wrong.supplement = 180 - a; wrong['right-angle'] = 90 - a; wrong.full = 360 - a;
      steps = [{ say: '두 직선이 만날 때 서로 마주 보는 각을 맞꼭지각이라고 해요.', tex: '\\angle x \\text{ 와 } ' + deg(a) + '\\text{ 는 맞꼭지각}' }, { say: '맞꼭지각의 크기는 서로 같아요.', tex: '\\angle x = ' + deg(ans) }];
      h2 = '$\\angle x$와 주어진 각은 꼭짓점을 사이에 두고 서로 마주 보고 있어요. 이런 두 각을 맞꼭지각이라고 해요. 왜 크기가 같은지 생각해 봐요. 두 각 사이에 끼어 있는 옆의 각을 하나 골라요. 주어진 각과 옆의 각을 더하면 평각이고, $\\angle x$와 그 옆의 각을 더해도 평각이에요. 똑같은 것에서 똑같은 것을 뺐으니 남는 두 각의 크기도 같아요.';
    } else if (q.kind === 'par') {
      val = function (i) { return i % 2 === 0 ? t : 180 - t; };
      gi = q.g; xi = q.x; a = val(gi); ans = val(xi); top = val(xi);
      Pt = G.reach(150, 95, t, 40); Pb = G.reach(150, 95, t, -40);
      var arcAt = function (V, i, label) { var from = [0, t, 180, 180 + t][i], to = [t, 180, 180 + t, 360][i]; return mark(V, from, to, label); };
      fig = geo(190, '평행한 두 직선 l, m과 그 둘을 가로지르는 직선이 있다. 직선 l과 만나는 곳의 ' + PNAME[gi] + ' 각은 ' + a + '도이고, 직선 m과 만나는 곳의 ' + PNAME[xi] + ' 각은 x이다.',
        [seg([20, 55], [272, 55]), seg([20, 135], [272, 135]), seg(G.reach(150, 95, t, 78), G.reach(150, 95, t, -78)), txt(286, 55, 'l'), txt(286, 135, 'm')].concat(arcAt(Pt, gi, D(a)), arcAt(Pb, xi, 'x')));
      text = '그림에서 두 직선 $l$, $m$은 서로 평행해요. 표시된 각의 크기가 $' + deg(a) + '$일 때, $\\angle x$의 크기는 몇 도인가요?';
      wrong[ans === a ? 'supplement' : 'equal'] = ans === a ? 180 - a : a; wrong['right-angle'] = 90 - a; wrong.full = 360 - a;
      steps = [gi === xi ? { say: '표시된 각과 $\\angle x$는 두 교점에서 같은 자리(' + PNAME[xi] + ')에 있어요. 이런 각을 동위각이라고 해요.', tex: deg(a) }
        : (gi + 2) % 4 === xi ? { say: '위쪽 교점에서 표시된 각과 마주 보는 각(맞꼭지각)은 크기가 같아요. 그 각이 $\\angle x$와 같은 자리에 있어요.', tex: deg(a) }
          : { say: '위쪽 교점에서 $\\angle x$와 같은 자리(' + PNAME[xi] + ')에 있는 각을 구해요. 표시된 각과 합쳐서 평각이에요.', tex: '180^{\\circ} - ' + deg(a) + ' = ' + deg(top) },
        { say: '두 직선이 평행하면 같은 자리에 있는 각(동위각)의 크기가 같아요.', tex: '\\angle x = ' + deg(ans) }];
      h2 = '평행선 문제는 "각을 옮긴다"고 생각하면 쉬워요. 가로지르는 직선을 따라 아래쪽 교점을 위쪽 교점으로 밀어 올리면 두 교점이 겹쳐요. 두 직선이 평행하니, 같은 자리에 있던 각끼리는 딱 포개져요. 그래서 먼저 위쪽 교점에서 $\\angle x$와 같은 자리에 있는 각을 찾아요. 그 각이 표시된 각 $' + deg(a) + '$와 마주 보면 크기가 같고, 나란히 붙어 있으면 둘을 더해서 평각이 돼요.';
    } else if (q.kind === 'bent') {
      P = [80, 95]; A1 = G.reach(80, 95, a, 70); B1 = G.reach(80, 95, -b, -70); ans = a + b;
      fig = geo(190, '평행한 두 직선 l, m 사이에 꺾인 선이 있다. 꺾인 선은 직선 l과 ' + a + '도, 직선 m과 ' + b + '도를 이루고, 두 직선 사이에서 꺾인 곳의 각은 x이다.',
        [seg([20, 25], [272, 25]), seg([20, 165], [272, 165]), seg(A1, P), seg(P, B1), txt(286, 25, 'l'), txt(286, 165, 'm')].concat(mark(A1, 180, 180 + a, D(a)), mark(B1, 180 - b, 180, D(b)), mark(P, -b, a, 'x')));
      text = '그림에서 두 직선 $l$, $m$은 서로 평행해요. 표시된 두 각의 크기가 $' + deg(a) + '$, $' + deg(b) + '$일 때, 꺾인 곳의 각 $\\angle x$의 크기는 몇 도인가요?';
      wrong.difference = abs(a - b); wrong.supplement = 180 - a - b; wrong['one-only'] = Math.max(a, b);
      steps = [{ say: '꺾인 점을 지나고 두 직선에 평행한 선을 하나 그어요. $\\angle x$가 위아래 두 조각으로 나뉘어요.', tex: '\\angle x = (\\text{위 조각}) + (\\text{아래 조각})' }, { say: '평행선에서 엇각의 크기는 같아요. 위 조각은 $' + deg(a) + '$, 아래 조각은 $' + deg(b) + '$예요.', tex: '\\angle x = ' + deg(a) + ' + ' + deg(b) }, { say: '두 조각을 더해요.', tex: '\\angle x = ' + deg(ans) }];
      h2 = '이런 그림에서는 선을 하나 더 그으면 풀려요. 꺾인 점을 지나면서 두 직선과 평행한 선을 그어요. 그러면 $\\angle x$가 위 조각과 아래 조각으로 나뉘어요. 위 조각은 직선 $l$ 쪽의 표시된 각과 엇갈린 자리에 있어서 크기가 같아요(엇각). 아래 조각도 직선 $m$ 쪽의 표시된 각과 엇각이라 크기가 같아요. 그러니 $\\angle x$는 표시된 두 각을 합친 것이에요.';
    } else {
      ans = q.x; A1 = q.k1 * ans + q.c1; B1 = q.k2 * ans + q.c2; O = [150, 140]; P = G.polar(150, 140, 115, A1);
      fig = geo(165, '곧은 직선 위의 한 점에서 비스듬히 반직선을 그었다. 반직선과 직선이 이루는 두 각 가운데 오른쪽 각은 ' + ex(q.k1, q.c1) + '도이고 왼쪽 각은 ' + ex(q.k2, q.c2) + '도이다.', [seg([20, 140], [280, 140]), seg(O, P)].concat(mark(O, 0, A1, ex(q.k1, q.c1)), mark(O, A1, 180, ex(q.k2, q.c2))));
      text = '그림처럼 직선 위의 한 점에서 반직선을 그었어요. 두 각의 크기가 $(' + ex(q.k1, q.c1) + ')^{\\circ}$, $(' + ex(q.k2, q.c2) + ')^{\\circ}$일 때, $x$의 값을 구하세요.';
      wrong['equal-set'] = intOr(q.c2 - q.c1, q.k1 - q.k2); wrong['sum-360'] = intOr(360 - q.c1 - q.c2, q.k1 + q.k2); wrong['sum-90'] = intOr(90 - q.c1 - q.c2, q.k1 + q.k2); wrong['const-sign'] = intOr(180 + q.c1 + q.c2, q.k1 + q.k2);
      steps = [{ say: '두 각을 합치면 평각이에요. 더해서 $180$이 되는 식을 세워요.', tex: '(' + ex(q.k1, q.c1) + ') + (' + ex(q.k2, q.c2) + ') = 180' }, { say: '문자끼리, 수끼리 모아요.', tex: ex(q.k1 + q.k2, q.c1 + q.c2) + ' = 180' }, { say: '수를 옮기고 $x$ 앞의 수로 나눠요.', tex: 'x = ' + ans }];
      h2 = '두 각이 나란히 붙어서 곧은 직선을 이루고 있어요. 그러니 두 각의 크기를 더하면 평각의 크기와 같아요. 두 식을 더해서 평각의 크기와 같다고 놓으면 $x$에 대한 일차방정식이 돼요. 괄호를 풀고 $x$가 든 항끼리, 수끼리 모아요. 수를 등호 반대쪽으로 옮길 때 부호가 바뀌는 것을 조심해요. 마지막에 $x$ 앞의 수로 나눠요. 구하는 것은 각의 크기가 아니라 $x$의 값이에요.';
    }
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans), hints: [A_KEY, h2, A_LAST] };
  };
  var ang = function (r) { var a; do { a = r.int(25, 155); } while (a > 80 && a < 100); return a; };
  numQ({
    id: 'B23.angle', title: '각과 평행선', kind: 'int', build: angleBuild,
    mistakes: [['equal', '주어진 각과 크기가 같다고 봤어요. 두 각은 나란히 붙어서 평각을 이루어요. $180^{\\circ}$에서 빼야 해요.'],
      ['supplement', '$180^{\\circ}$에서 뺐어요. 두 각은 더해서 평각이 되는 사이가 아니에요. 그림에서 두 각이 어떤 자리에 있는지 다시 봐요.'],
      ['right-angle', '$90^{\\circ}$에서 뺐어요. 그림에 직각은 없어요. 곧은 직선이 이루는 평각 $180^{\\circ}$를 기준으로 생각해요.'],
      ['full', '$360^{\\circ}$에서 뺐어요. 한 바퀴가 아니라 곧은 직선(평각 $180^{\\circ}$)을 기준으로 생각해요.'],
      ['difference', '두 각의 차를 구했어요. 꺾인 곳의 각은 위 조각과 아래 조각을 합친 것이에요. 두 각을 더해요.'],
      ['one-only', '두 각 가운데 하나만 답했어요. 꺾인 곳의 각은 두 조각으로 이루어져 있어요. 두 각을 더해요.'],
      ['equal-set', '두 식을 서로 같다고 놓았어요. 두 각은 크기가 같은 것이 아니라 더해서 평각이 되는 사이예요.'],
      ['sum-360', '두 각의 합을 $360^{\\circ}$로 놓았어요. 곧은 직선은 반 바퀴라서 $180^{\\circ}$예요.'],
      ['sum-90', '두 각의 합을 $90^{\\circ}$로 놓았어요. 두 각이 이루는 것은 직각이 아니라 곧은 직선(평각)이에요.'],
      ['const-sign', '수를 옮길 때 부호를 바꾸지 않았어요. 등호를 넘어가면 더하기는 빼기로 바뀌어요.']],
    levels: [
      { name: '평각과 맞꼭지각', minDistinct: 150, vars: { q: sampler(function (r) { return { kind: r.int(0, 2) ? 'straight' : 'vertical', a: ang(r) }; }) } },
      { name: '평행선의 동위각과 엇각', minDistinct: 250, vars: { q: sampler(function (r) { var t = r.int(40, 75); return { kind: 'par', t: r.int(0, 1) ? t : 180 - t, g: r.int(0, 3), x: r.int(0, 3) }; }) } },
      { name: '꺾인 선 · 식으로 나타낸 각', minDistinct: 250, vars: { q: sampler(function (r) {
          return until(function () {
            var k1, k2, x, rest, c1;
            if (r.int(0, 1)) return { kind: 'bent', a: r.int(25, 70), b: r.int(25, 70) };
            k1 = r.int(1, 4); k2 = r.int(1, 4); x = r.int(10, 40); rest = 180 - (k1 + k2) * x; c1 = 5 * r.int(-8, 12);
            return k1 === k2 || c1 === 0 || rest - c1 === 0 || k1 * x + c1 < 30 || k2 * x + rest - c1 < 30 ? null : { kind: 'expr', k1: k1, k2: k2, x: x, c1: c1, c2: rest - c1 };
          }, function (q) { return angleBuild(q).check; });
        }) } }
    ]
  });

  /* ── B23.triangle 삼각형의 각 ───────────────────── */
  var T_KEY = '삼각형의 세 내각의 크기를 더하면 언제나 $180^{\\circ}$예요. 종이 삼각형의 세 모서리를 찢어서 한 점에 모으면 곧은 직선이 되는 것으로 확인할 수 있어요. 한 변을 길게 늘였을 때 삼각형 바깥에 생기는 각을 외각이라고 해요. 외각의 크기는 그와 이웃하지 않는 두 내각의 크기를 더한 것과 같아요. 두 변의 길이가 같은 이등변삼각형은 두 밑각의 크기가 같아요.';
  var T_LAST = '① 삼각형의 세 내각의 합은 $180^{\\circ}$예요. ② 외각은 이웃하지 않는 두 내각의 합이에요. ③ 이등변삼각형은 두 밑각이 같아요. ④ 구한 각을 넣어서 세 내각의 합이 $180^{\\circ}$가 되는지 확인해요.';
  var triBuild = function (q) {
    var a = q.a, b = q.b, c = 180 - a - b, T, A1, B1, C1, vals, lab, u = q.u, g, text, ans, wrong = {}, steps, h2, fig, E, e;
    if (q.kind === 'sum') {
      T = G.tri(a, b, 45, 25, 210, 125); A1 = T[0]; B1 = T[1]; C1 = T[2]; vals = [a, b, c]; ans = vals[u]; g = vals.filter(function (v, i) { return i !== u; });
      lab = function (i) { return i === u ? 'x' : D(vals[i]); };
      fig = geo(180, '삼각형이 있다. 두 내각의 크기는 ' + g[0] + '도와 ' + g[1] + '도이고, 나머지 한 내각은 x이다.', [['poly', flat(T)]].concat(mark(A1, 0, a, lab(0)), mark(B1, 180 - b, 180, lab(1)), mark(C1, 180 + a, 360 - b, lab(2))));
      text = '그림의 삼각형에서 두 내각의 크기가 $' + deg(g[0]) + '$, $' + deg(g[1]) + '$일 때, 나머지 한 내각 $\\angle x$의 크기는 몇 도인가요?';
      wrong['sum-360'] = 360 - g[0] - g[1]; wrong['sum-only'] = g[0] + g[1]; wrong['one-subtracted'] = 180 - g[0];
      steps = [{ say: '삼각형의 세 내각의 크기를 더하면 $180^{\\circ}$예요.', tex: deg(g[0]) + ' + ' + deg(g[1]) + ' + \\angle x = 180^{\\circ}' }, { say: '$180^{\\circ}$에서 두 각을 차례로 빼요.', tex: '\\angle x = ' + deg(ans) }];
      h2 = '삼각형은 어떤 모양이든 세 내각의 크기를 더하면 평각의 크기와 같아요. 두 각을 알고 있으니 나머지 하나는 저절로 정해져요. 먼저 주어진 두 각 $' + deg(g[0]) + '$, $' + deg(g[1]) + '$를 더해요. 그 합을 세 내각의 합에서 빼면 $\\angle x$예요. 한 번에 빼기 어려우면 하나씩 차례로 빼도 돼요. 두 각 가운데 하나만 빼고 멈추지 않도록 조심해요.';
    } else if (q.kind === 'ext') {
      T = G.tri(a, b, 30, 30, 190, 115); A1 = T[0]; B1 = T[1]; C1 = T[2]; e = a + c; E = [Math.min(B1[0] + 60, 290), B1[1]];
      if (q.v === 0) {
        ans = e; text = '그림의 삼각형에서 두 내각의 크기가 $' + deg(a) + '$, $' + deg(c) + '$일 때, 한 변을 늘여서 생긴 외각 $\\angle x$의 크기는 몇 도인가요?';
        fig = geo(180, '삼각형의 밑변을 오른쪽으로 길게 늘였다. 왼쪽 아래 내각은 ' + a + '도, 위쪽 내각은 ' + c + '도이고, 오른쪽 아래 꼭짓점 바깥에 생긴 외각은 x이다.', [['poly', flat(T)], seg(B1, E)].concat(mark(A1, 0, a, D(a)), mark(C1, 180 + a, 360 - b, D(c)), mark(B1, 0, 180 - b, 'x')));
        wrong.interior = b; wrong['one-subtracted'] = 180 - a; wrong.difference = abs(a - c);
        steps = [{ say: '외각의 크기는 그와 이웃하지 않는 두 내각의 크기의 합과 같아요.', tex: '\\angle x = ' + deg(a) + ' + ' + deg(c) }, { say: '두 각을 더해요.', tex: '\\angle x = ' + deg(ans) }];
        h2 = '$\\angle x$는 삼각형 바깥에 있는 외각이에요. 외각 바로 옆에 붙어 있는 내각은 아직 모르지만, 구할 필요가 없어요. 외각과 옆의 내각을 더하면 평각이고, 삼각형의 세 내각을 더해도 평각이에요. 양쪽에서 옆의 내각을 빼면, 외각은 나머지 두 내각을 더한 것과 같아요. 그러니 멀리 떨어진 두 내각 $' + deg(a) + '$, $' + deg(c) + '$를 더하면 바로 답이에요.';
      } else {
        ans = c; text = '그림의 삼각형에서 한 외각의 크기가 $' + deg(e) + '$이고 그와 이웃하지 않는 한 내각의 크기가 $' + deg(a) + '$일 때, $\\angle x$의 크기는 몇 도인가요?';
        fig = geo(180, '삼각형의 밑변을 오른쪽으로 길게 늘였다. 오른쪽 아래 꼭짓점 바깥에 생긴 외각은 ' + e + '도, 왼쪽 아래 내각은 ' + a + '도이고, 위쪽 내각은 x이다.', [['poly', flat(T)], seg(B1, E)].concat(mark(A1, 0, a, D(a)), mark(C1, 180 + a, 360 - b, 'x'), mark(B1, 0, 180 - b, D(e))));
        wrong['sum-only'] = e + a < 180 ? e + a : null; wrong.interior = b; wrong['one-subtracted'] = 180 - a;
        steps = [{ say: '외각의 크기는 그와 이웃하지 않는 두 내각의 크기의 합과 같아요.', tex: deg(e) + ' = ' + deg(a) + ' + \\angle x' }, { say: '외각에서 아는 내각을 빼요.', tex: '\\angle x = ' + deg(ans) }];
        h2 = '외각의 크기는 그와 이웃하지 않는 두 내각을 더한 것과 같아요. 여기서는 외각 $' + deg(e) + '$가 주어져 있고, 멀리 떨어진 두 내각 가운데 하나인 $' + deg(a) + '$도 주어져 있어요. 나머지 하나가 $\\angle x$예요. "두 내각을 더하면 외각"이니, 거꾸로 외각에서 아는 내각을 빼면 $\\angle x$가 나와요. 외각 옆의 내각을 구해서 세 내각의 합으로 풀어도 같은 답이 나와요.';
      }
    } else {
      b = q.a; a = q.a; c = 180 - 2 * a; T = G.tri(a, a, 45, 20, 210, 135); A1 = T[0]; B1 = T[1]; C1 = T[2];
      var ticks = [['tick', A1[0], A1[1], C1[0], C1[1]], ['tick', B1[0], B1[1], C1[0], C1[1]]];
      if (q.v === 0) {
        ans = a; text = '그림의 삼각형은 두 변의 길이가 같은 이등변삼각형이에요. 꼭지각의 크기가 $' + deg(c) + '$일 때, 밑각 $\\angle x$의 크기는 몇 도인가요?';
        fig = geo(180, '위쪽 꼭짓점에서 내려오는 두 변의 길이가 같은 이등변삼각형이다. 위쪽 꼭지각은 ' + c + '도이고 왼쪽 아래 밑각은 x이다.', [['poly', flat(T)]].concat(ticks, mark(C1, 180 + a, 360 - a, D(c)), mark(A1, 0, a, 'x')));
        wrong['not-halved'] = 180 - c; wrong['half-apex'] = intOr(c, 2); wrong.same = c;
        steps = [{ say: '세 내각의 합에서 꼭지각을 빼면 두 밑각의 합이 남아요.', tex: '180^{\\circ} - ' + deg(c) + ' = ' + deg(180 - c) }, { say: '두 밑각의 크기가 같으니 반으로 나눠요.', tex: '\\angle x = ' + deg(ans) }];
        h2 = '이등변삼각형은 길이가 같은 두 변이 만나는 곳의 각을 꼭지각, 나머지 두 각을 밑각이라고 해요. 두 밑각의 크기는 서로 같아요. 반으로 접으면 딱 포개지기 때문이에요. 세 내각의 합에서 꼭지각 $' + deg(c) + '$를 빼면 두 밑각을 합친 크기가 남아요. 두 밑각은 크기가 같으니 그것을 똑같이 둘로 나누면 밑각 하나의 크기예요. 나누는 것을 잊지 않아요.';
      } else {
        ans = c; text = '그림의 삼각형은 두 변의 길이가 같은 이등변삼각형이에요. 한 밑각의 크기가 $' + deg(a) + '$일 때, 꼭지각 $\\angle x$의 크기는 몇 도인가요?';
        fig = geo(180, '위쪽 꼭짓점에서 내려오는 두 변의 길이가 같은 이등변삼각형이다. 왼쪽 아래 밑각은 ' + a + '도이고 위쪽 꼭지각은 x이다.', [['poly', flat(T)]].concat(ticks, mark(A1, 0, a, D(a)), mark(C1, 180 + a, 360 - a, 'x')));
        wrong['one-base'] = 180 - a; wrong.same = a; wrong.halved = intOr(180 - a, 2);
        steps = [{ say: '이등변삼각형의 두 밑각은 크기가 같아요. 다른 밑각도 $' + deg(a) + '$예요.', tex: deg(a) + ' + ' + deg(a) + ' = ' + deg(2 * a) }, { say: '세 내각의 합에서 두 밑각을 빼요.', tex: '\\angle x = 180^{\\circ} - ' + deg(2 * a) + ' = ' + deg(ans) }];
        h2 = '이등변삼각형의 두 밑각은 크기가 같아요. 그림에는 밑각이 하나만 적혀 있지만, 반대쪽 밑각도 똑같이 $' + deg(a) + '$예요. 이 숨은 각을 먼저 찾아 적어요. 그러면 세 각 가운데 두 개를 아는 셈이에요. 세 내각의 합에서 두 밑각을 모두 빼면 꼭지각 $\\angle x$가 남아요. 밑각을 한 번만 빼고 멈추지 않도록 조심해요.';
      }
    }
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans), hints: [T_KEY, h2, T_LAST] };
  };
  numQ({
    id: 'B23.triangle', title: '삼각형의 각', kind: 'int', build: triBuild,
    mistakes: [['sum-360', '세 내각의 합을 $360^{\\circ}$로 계산했어요. 삼각형의 세 내각의 합은 $180^{\\circ}$예요. $360^{\\circ}$는 사각형이에요.'],
      ['sum-only', '주어진 두 각을 더하기만 했어요. 문제에서 묻는 각이 어느 것인지, 그 각과 주어진 각이 어떤 관계인지 다시 봐요.'],
      ['one-subtracted', '$180^{\\circ}$에서 각을 하나만 뺐어요. 그 값은 다른 각의 크기예요. 그림에서 $\\angle x$의 자리를 다시 확인해요.'],
      ['interior', '외각 옆에 붙어 있는 내각의 크기를 답했어요. 문제에서 묻는 각이 어느 것인지 그림에서 다시 확인해요.'],
      ['difference', '두 내각의 차를 구했어요. 외각의 크기는 이웃하지 않는 두 내각을 더한 것이에요.'],
      ['not-halved', '두 밑각을 합친 크기를 답했어요. 두 밑각은 크기가 같으니 반으로 나눠야 밑각 하나의 크기예요.'],
      ['half-apex', '꼭지각을 반으로 나눴어요. 먼저 $180^{\\circ}$에서 꼭지각을 빼고, 남은 것을 반으로 나눠요.'],
      ['same', '주어진 각과 크기가 같다고 봤어요. 크기가 같은 것은 두 밑각끼리예요. 꼭지각과 밑각은 보통 달라요.'],
      ['one-base', '밑각을 하나만 뺐어요. 밑각은 두 개이고 크기가 같아요. 두 개를 모두 빼요.'],
      ['halved', '밑각을 뺀 다음 반으로 나눴어요. 반으로 나누는 것은 꼭지각을 알고 밑각을 구할 때예요. 여기서는 밑각 두 개를 빼면 끝이에요.']],
    levels: [
      { name: '세 내각의 합', minDistinct: 250, vars: { q: sampler(function (r) { return until(function () { var a = r.int(25, 110), b = r.int(25, 110); return 180 - a - b < 25 || a + b < 60 ? null : { kind: 'sum', a: a, b: b, u: r.int(0, 2) }; }, function (q) { return triBuild(q).check; }); }) } },
      { name: '외각', minDistinct: 250, vars: { q: sampler(function (r) { return until(function () { var a = r.int(30, 80), b = r.int(40, 100); return 180 - a - b < 30 ? null : { kind: 'ext', a: a, b: b, v: r.int(0, 1) }; }, function (q) { return triBuild(q).check; }); }) } },
      { name: '이등변삼각형', minDistinct: 60, vars: { q: sampler(function (r) { return until(function () { return { kind: 'iso', a: r.int(32, 76), v: r.int(0, 1) }; }, function (q) { return q.a !== 60 && triBuild(q).check; }); }) } }
    ]
  });

  /* ── B23.polygon 다각형의 각과 대각선 ──────────────── */
  var NAME = { 3: '삼', 4: '사', 5: '오', 6: '육', 7: '칠', 8: '팔', 9: '구', 10: '십', 11: '십일', 12: '십이', 13: '십삼', 14: '십사', 15: '십오', 18: '십팔', 20: '이십' };
  var REG = [3, 5, 6, 8, 9, 10, 12, 15, 18, 20];
  var P_KEY = '다각형은 한 꼭짓점에서 대각선을 모두 그으면 삼각형 여러 개로 나뉘어요. 삼각형 하나의 내각의 합이 $180^{\\circ}$이니, 삼각형의 개수만 알면 내각의 합을 구할 수 있어요. 변이 $n$개인 다각형은 삼각형 $(n - 2)$개로 나뉘어요. 그래서 내각의 합은 $180^{\\circ} \\times (n - 2)$예요. 외각의 합은 변의 개수와 상관없이 언제나 $360^{\\circ}$예요. 다각형의 둘레를 한 바퀴 돌면 방향이 꼭 한 바퀴 바뀌기 때문이에요.';
  var P_LAST = '① 변의 개수 $n$을 확인해요. ② 내각의 합은 $180^{\\circ} \\times (n - 2)$, 외각의 합은 $360^{\\circ}$예요. ③ 정다각형은 각이 모두 같으니 합을 $n$으로 나눠요. ④ 대각선은 한 꼭짓점에서 $(n - 3)$개, 모두 합쳐 $n(n - 3) \\div 2$개예요.';
  var polyBuild = function (q) {
    var n = q.n, nm = NAME[n] + '각형', text, ans, wrong = {}, steps, h2, S, e, i;
    if (q.kind === 'isum') {
      ans = 180 * (n - 2); text = nm + '의 내각의 크기의 합은 몇 도인가요?';
      wrong['n-times'] = 180 * n; wrong['n-minus-1-times'] = 180 * (n - 1); wrong['always-360'] = 360;
      steps = [{ say: nm + '은 한 꼭짓점에서 대각선을 그으면 삼각형 $' + (n - 2) + '$개로 나뉘어요.', tex: n + ' - 2 = ' + (n - 2) }, { say: '삼각형 하나의 내각의 합 $180^{\\circ}$에 삼각형의 개수를 곱해요.', tex: '180^{\\circ} \\times ' + (n - 2) + ' = ' + deg(ans) }];
      h2 = nm + '은 변이 $' + n + '$개예요. 한 꼭짓점을 골라 거기서 그을 수 있는 대각선을 모두 그어 봐요. 그러면 ' + nm + '이 삼각형 여러 개로 쪼개져요. 삼각형의 개수는 변의 개수보다 2만큼 적어요. 쪼개진 삼각형들의 내각을 모두 모으면 처음 다각형의 내각과 똑같아요. 그러니 삼각형 하나의 내각의 합에 삼각형의 개수를 곱하면 돼요. 변의 개수를 그대로 곱하지 않도록 조심해요.';
    } else if (q.kind === 'fromv') {
      ans = n - 3; text = nm + '의 한 꼭짓점에서 그을 수 있는 대각선은 몇 개인가요?';
      wrong['minus-two'] = n - 2; wrong['n-minus-1'] = n - 1; wrong['all-n'] = n;
      steps = [{ say: '한 꼭짓점에서 자기 자신과 양옆의 이웃한 두 꼭짓점으로는 대각선을 그을 수 없어요. 셋을 빼요.', tex: n + ' - 3' }, { say: '남은 꼭짓점의 개수가 대각선의 개수예요.', tex: String(ans) }];
      h2 = '대각선은 이웃하지 않는 두 꼭짓점을 이은 선분이에요. 꼭짓점 하나를 골라요. ' + nm + '에는 꼭짓점이 모두 $' + n + '$개 있어요. 그 가운데 고른 꼭짓점 자신에게는 선을 그을 수 없어요. 양옆의 이웃한 두 꼭짓점으로 그은 선은 대각선이 아니라 변이에요. 그러니 대각선을 그을 수 없는 꼭짓점이 모두 셋이에요. 전체 꼭짓점의 개수에서 이 셋을 빼요.';
    } else if (q.kind === 'tris') {
      ans = n - 2; text = nm + '의 한 꼭짓점에서 대각선을 모두 그으면 삼각형 몇 개로 나뉘나요?';
      wrong['minus-three'] = n - 3; wrong['n-minus-1'] = n - 1; wrong['all-n'] = n;
      steps = [{ say: '한 꼭짓점에서 그을 수 있는 대각선은 $' + (n - 3) + '$개예요.', tex: n + ' - 3 = ' + (n - 3) }, { say: '선을 하나 그을 때마다 조각이 하나씩 늘어요. 삼각형은 대각선보다 하나 더 많아요.', tex: (n - 3) + ' + 1 = ' + ans }];
      h2 = '먼저 한 꼭짓점에서 그을 수 있는 대각선의 개수를 구해요. 자기 자신과 양옆의 두 꼭짓점을 빼면 돼요. 그다음 조각의 개수를 생각해요. 피자를 칼로 한 번 자르면 두 조각, 두 번 자르면 세 조각이 되는 것처럼, 대각선을 하나 그을 때마다 조각이 하나씩 늘어요. 그래서 삼각형의 개수는 대각선의 개수보다 하나 더 많아요. 결국 변의 개수보다 2만큼 적어요.';
    } else if (q.kind === 'reg-in' || q.kind === 'reg-ex') {
      e = 360 / n; i = 180 - e;
      if (q.kind === 'reg-in') { ans = i; text = '정' + nm + '의 한 내각의 크기는 몇 도인가요?'; wrong['exterior-instead'] = e; wrong['sum-not-divided'] = 180 * (n - 2); wrong['by-n-180'] = intOr(180, n);
        steps = [{ say: '내각의 합을 구해요.', tex: '180^{\\circ} \\times (' + n + ' - 2) = ' + deg(180 * (n - 2)) }, { say: '정다각형은 내각의 크기가 모두 같아요. 각의 개수 $' + n + '$' + pj(n, '으로/로') + ' 나눠요.', tex: deg(180 * (n - 2)) + ' \\div ' + n + ' = ' + deg(ans) }];
        h2 = '정다각형은 변의 길이가 모두 같고 내각의 크기도 모두 같은 다각형이에요. 그러니 내각의 합을 구한 다음 각의 개수로 똑같이 나누면 한 내각의 크기가 나와요. 정' + nm + '은 변이 $' + n + '$개이니 삼각형으로 쪼개서 내각의 합을 먼저 구해요. 그다음 그 합을 $' + n + '$' + pj(n, '으로/로') + ' 나눠요. 다른 방법도 있어요. 한 외각을 먼저 구하고 평각에서 빼도 같은 답이 나와요.';
      } else { ans = e; text = '정' + nm + '의 한 외각의 크기는 몇 도인가요?'; wrong['interior-instead'] = i; wrong['sum-not-divided'] = 360; wrong['by-n-180'] = intOr(180, n);
        steps = [{ say: '다각형의 외각의 합은 언제나 $360^{\\circ}$예요.', tex: '360^{\\circ}' }, { say: '정다각형은 외각의 크기가 모두 같아요. 각의 개수 $' + n + '$' + pj(n, '으로/로') + ' 나눠요.', tex: '360^{\\circ} \\div ' + n + ' = ' + deg(ans) }];
        h2 = '외각의 합은 다각형의 변이 몇 개든 언제나 한 바퀴예요. 다각형의 둘레를 따라 걸으면 꼭짓점마다 외각만큼 방향을 틀게 되고, 한 바퀴를 돌아 제자리에 오면 몸이 꼭 한 바퀴 돌아 있기 때문이에요. 정' + nm + '은 외각 $' + n + '$개의 크기가 모두 같아요. 그러니 한 바퀴의 크기를 $' + n + '$' + pj(n, '으로/로') + ' 똑같이 나누면 한 외각의 크기예요. 내각을 구하는 것과 헷갈리지 않아요.';
      }
    } else if (q.kind === 'n-sum') {
      S = 180 * (n - 2); ans = n; text = '내각의 크기의 합이 $' + deg(S) + '$인 다각형은 변이 몇 개인가요?';
      wrong['no-plus-2'] = n - 2; wrong['plus-one'] = n - 1; wrong['by-360'] = intOr(S, 360);
      steps = [{ say: '내각의 합은 $180^{\\circ} \\times (n - 2)$예요. 식을 세워요.', tex: '180 \\times (n - 2) = ' + S }, { say: '양쪽을 $180$으로 나눠요. 이것이 삼각형의 개수예요.', tex: 'n - 2 = ' + (n - 2) }, { say: '2를 더하면 변의 개수예요.', tex: 'n = ' + ans }];
      h2 = '거꾸로 푸는 문제예요. 다각형의 내각의 합은 삼각형 하나의 내각의 합에 삼각형의 개수를 곱한 것이에요. 그러니 주어진 합 $' + deg(S) + '$를 삼각형 하나의 내각의 합으로 나누면 삼각형이 몇 개인지 알 수 있어요. 여기서 끝이 아니에요. 삼각형의 개수는 변의 개수보다 2만큼 적으니, 삼각형의 개수에 2를 더해야 변의 개수가 돼요. 마지막 걸음을 잊지 않아요.';
    } else if (q.kind === 'n-ext' || q.kind === 'n-int') {
      e = 360 / n; i = 180 - e; ans = n;
      if (q.kind === 'n-ext') { text = '한 외각의 크기가 $' + deg(e) + '$인 정다각형은 변이 몇 개인가요?'; wrong['by-180'] = intOr(180, e); wrong['interior-used'] = intOr(360, 180 - e); wrong['plus-one'] = n - 1;
        steps = [{ say: '외각의 합은 언제나 $360^{\\circ}$이고, 정다각형은 외각의 크기가 모두 같아요.', tex: deg(e) + ' \\times n = 360^{\\circ}' }, { say: '$360^{\\circ}$를 한 외각의 크기로 나눠요.', tex: 'n = ' + ans }];
        h2 = '정다각형은 외각의 크기가 모두 같아요. 그리고 외각을 모두 더하면 언제나 한 바퀴예요. 그러니 한 외각 $' + deg(e) + '$가 몇 개 모여야 한 바퀴가 되는지 세면 돼요. 한 바퀴의 크기를 한 외각의 크기로 나눠요. 나온 수가 외각의 개수이고, 외각의 개수는 꼭짓점의 개수, 곧 변의 개수와 같아요. 평각의 크기로 나누지 않도록 조심해요.';
      } else { text = '한 내각의 크기가 $' + deg(i) + '$인 정다각형은 변이 몇 개인가요?'; wrong['by-180'] = intOr(180, e); wrong['interior-used'] = intOr(360, i); wrong['plus-one'] = n - 1;
        steps = [{ say: '내각과 외각을 더하면 평각이에요. 한 외각의 크기를 먼저 구해요.', tex: '180^{\\circ} - ' + deg(i) + ' = ' + deg(e) }, { say: '외각의 합 $360^{\\circ}$를 한 외각의 크기로 나눠요.', tex: 'n = 360 \\div ' + e + ' = ' + ans }];
        h2 = '내각으로 바로 풀면 계산이 복잡해요. 외각으로 바꿔서 풀면 쉬워요. 한 꼭짓점에서 내각과 외각은 나란히 붙어서 곧은 직선을 이루니, 둘을 더하면 평각이에요. 평각의 크기에서 내각 $' + deg(i) + '$를 빼서 한 외각의 크기를 구해요. 그다음은 외각 문제와 같아요. 외각의 합인 한 바퀴를 한 외각의 크기로 나누면 변의 개수가 나와요.';
      }
    } else {
      ans = n * (n - 3) / 2; text = nm + '의 대각선은 모두 몇 개인가요?';
      wrong['not-halved'] = n * (n - 3); wrong['from-one-vertex'] = n - 3; wrong['n-minus-2-rule'] = intOr(n * (n - 2), 2);
      steps = [{ say: '한 꼭짓점에서 그을 수 있는 대각선은 $' + (n - 3) + '$개예요. 꼭짓점이 $' + n + '$개이니 곱해요.', tex: n + ' \\times ' + (n - 3) + ' = ' + n * (n - 3) }, { say: '대각선 하나를 양 끝에서 한 번씩, 두 번 세었어요. 2로 나눠요.', tex: n * (n - 3) + ' \\div 2 = ' + ans }];
      h2 = '두 걸음으로 세어요. 먼저 한 꼭짓점에서 그을 수 있는 대각선의 개수를 구해요. 자기 자신과 양옆의 두 꼭짓점을 빼면 돼요. 꼭짓점이 $' + n + '$개이니 그 수에 $' + n + '$' + pj(n, '을/를') + ' 곱해요. 그런데 이렇게 세면 대각선 하나를 두 번씩 세게 돼요. 한 대각선은 양 끝의 두 꼭짓점 모두에서 그어지기 때문이에요. 악수를 두 사람이 한 번 한 것으로 세는 것과 같아요. 그래서 마지막에 2로 나눠요.';
    }
    return { text: text, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans), hints: [P_KEY, h2, P_LAST] };
  };
  numQ({
    id: 'B23.polygon', title: '다각형의 각과 대각선', kind: 'int', build: polyBuild,
    mistakes: [['n-times', '$180^{\\circ}$에 변의 개수를 그대로 곱했어요. 삼각형의 개수는 변의 개수보다 2만큼 적어요.'],
      ['n-minus-1-times', '변의 개수에서 1만 뺐어요. 한 꼭짓점에서 대각선을 그으면 삼각형은 (변의 개수 − 2)개가 생겨요.'],
      ['always-360', '$360^{\\circ}$라고 답했어요. 언제나 $360^{\\circ}$인 것은 외각의 합이에요. 내각의 합은 변이 많을수록 커져요.'],
      ['minus-two', '꼭짓점의 개수에서 2를 뺐어요. 그 수는 나뉘는 삼각형의 개수예요. 대각선은 자기 자신과 양옆의 두 꼭짓점을 뺀 (변의 개수 − 3)개예요.'],
      ['n-minus-1', '자기 자신만 뺐어요. 양옆의 이웃한 꼭짓점으로 그은 선은 대각선이 아니라 변이에요.'],
      ['all-n', '꼭짓점의 개수를 그대로 답했어요. 자기 자신과 이웃한 꼭짓점으로는 대각선을 그을 수 없어요.'],
      ['minus-three', '한 꼭짓점에서 그을 수 있는 대각선의 개수를 답했어요. 삼각형은 대각선보다 하나 더 많아요.'],
      ['exterior-instead', '한 외각의 크기를 답했어요. 내각은 평각 $180^{\\circ}$에서 외각을 뺀 것이에요.'],
      ['interior-instead', '한 내각의 크기를 답했어요. 외각은 평각 $180^{\\circ}$에서 내각을 뺀 것이에요.'],
      ['sum-not-divided', '각의 크기의 합을 답했어요. 정다각형은 각의 크기가 모두 같으니, 합을 각의 개수로 나눠야 한 각의 크기예요.'],
      ['by-n-180', '$180^{\\circ}$를 변의 개수로 나눴어요. 외각의 합은 $360^{\\circ}$이고, 내각의 합은 $180^{\\circ} \\times (n - 2)$예요.'],
      ['no-plus-2', '삼각형의 개수를 답했어요. 변의 개수는 삼각형의 개수보다 2만큼 많아요. 2를 더해요.'],
      ['plus-one', '변의 개수가 하나 모자라요. 식을 세워서 차례로 계산하고, 구한 수로 처음 조건이 맞는지 확인해요.'],
      ['by-360', '$360^{\\circ}$로 나눴어요. 삼각형 하나의 내각의 합인 $180^{\\circ}$로 나눠야 삼각형의 개수가 나와요.'],
      ['by-180', '$180^{\\circ}$를 기준으로 나눴어요. 외각의 합은 $360^{\\circ}$예요. $360^{\\circ}$를 한 외각의 크기로 나눠요.'],
      ['interior-used', '$360^{\\circ}$를 내각의 크기로 나눴어요. $360^{\\circ}$는 외각의 합이에요. 한 외각의 크기로 나눠요.'],
      ['not-halved', '2로 나누지 않았어요. 대각선 하나를 양 끝에서 한 번씩, 두 번 세었으니 반으로 나눠요.'],
      ['from-one-vertex', '한 꼭짓점에서 그을 수 있는 대각선의 개수만 답했어요. 모든 꼭짓점에서 그은 것을 합쳐야 해요.'],
      ['n-minus-2-rule', '한 꼭짓점에서 그을 수 있는 대각선을 (변의 개수 − 2)개로 셌어요. 자기 자신과 양옆의 두 꼭짓점, 셋을 빼요.']],
    levels: [
      { name: '내각의 합 · 한 꼭짓점의 대각선', minDistinct: 24, vars: { q: sampler(function (r) { var k = r.int(0, 2); return k === 0 ? { kind: 'isum', n: r.int(5, 12) } : { kind: k === 1 ? 'fromv' : 'tris', n: r.pick([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20]) }; }) } },
      { name: '정다각형의 한 내각 · 한 외각', minDistinct: 18, vars: { q: sampler(function (r) { return { kind: r.int(0, 1) ? 'reg-in' : 'reg-ex', n: r.pick(REG) }; }) } },
      { name: '거꾸로 구하기 · 대각선의 개수', minDistinct: 30, vars: { q: sampler(function (r) { var k = r.int(0, 3); return k === 0 ? { kind: 'n-sum', n: r.int(5, 15) } : k === 1 ? { kind: 'n-ext', n: r.pick(REG) } : k === 2 ? { kind: 'n-int', n: r.pick(REG.slice(1)) } : { kind: 'diag', n: r.int(5, 12) }; }) } }
    ]
  });

  /* ── B23.quad 사각형의 성질 ─────────────────────── */
  var Q_KEY = '사각형은 대각선 하나로 삼각형 두 개로 나뉘어요. 그래서 네 내각의 합은 $360^{\\circ}$예요. 평행사변형은 마주 보는 두 쌍의 변이 각각 평행한 사각형이에요. 평행사변형에서는 마주 보는 변의 길이가 같고, 마주 보는 각의 크기가 같고, 이웃한 두 각을 더하면 $180^{\\circ}$이고, 두 대각선이 서로를 반으로 나눠요. 직사각형은 두 대각선의 길이가 같고, 마름모는 두 대각선이 직각으로 만나요.';
  var Q_LAST = '① 어떤 사각형인지 확인해요. ② 평행사변형: 마주 보는 변 · 각이 같고, 이웃한 각의 합은 $180^{\\circ}$, 대각선은 서로를 반으로 나눠요. ③ 직사각형: 대각선의 길이가 같아요. ④ 마름모: 네 변이 같고 대각선이 직각으로 만나요.';
  var quadBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, s = q.s, t = q.t, d = q.d, e = q.e, text, ans, wrong = {}, steps, h2, fig, pa, PA, PB, PC, PD, O, base, T, A1, B1, C1, mir;
    var para = function (ang0) { var dx = Math.round((G.reach(0, 0, ang0, 100)[0])), x0 = Math.round(75 - dx / 2); PA = [x0, 155]; PB = [x0 + 150, 155]; PD = [x0 + dx, 55]; PC = [x0 + dx + 150, 55]; return [['poly', flat([PA, PB, PC, PD])], txt(PA[0] - 12, 165, 'A'), txt(PB[0] + 12, 165, 'B'), txt(PC[0] + 12, 45, 'C'), txt(PD[0] - 12, 45, 'D')]; };
    if (q.kind === 'sum4') {
      ans = 360 - a - b - c; text = '사각형의 세 내각의 크기가 $' + deg(a) + '$, $' + deg(b) + '$, $' + deg(c) + '$일 때, 나머지 한 내각의 크기는 몇 도인가요?';
      wrong['sum-given'] = a + b + c; wrong['one-missed'] = 360 - a - b; wrong['sum-540'] = 540 - a - b - c;
      steps = [{ say: '사각형의 네 내각의 합은 $360^{\\circ}$예요. 주어진 세 각을 먼저 더해요.', tex: deg(a) + ' + ' + deg(b) + ' + ' + deg(c) + ' = ' + deg(a + b + c) }, { say: '$360^{\\circ}$에서 빼요.', tex: '360^{\\circ} - ' + deg(a + b + c) + ' = ' + deg(ans) }];
      h2 = '사각형에 대각선을 하나 그으면 삼각형 두 개가 돼요. 삼각형 하나의 내각의 합이 평각이니, 사각형의 네 내각의 합은 그 두 배인 한 바퀴예요. 네 각 가운데 세 개를 알고 있으니 나머지 하나는 정해져요. 주어진 세 각 $' + deg(a) + '$, $' + deg(b) + '$, $' + deg(c) + '$를 빠짐없이 더해요. 그 합을 네 내각의 합에서 빼면 답이에요. 세 각 가운데 하나를 빠뜨리지 않았는지 확인해요.';
    } else if (q.kind === 'adj' || q.kind === 'opp') {
      pa = para(a);
      if (q.kind === 'adj') { ans = 180 - a; text = '그림의 평행사변형 $ABCD$에서 $\\angle A = ' + deg(a) + '$일 때, 이웃한 각 $\\angle B$의 크기는 몇 도인가요?';
        fig = geo(200, '평행사변형 ABCD가 있다. 아래 왼쪽 꼭짓점 A의 각은 ' + a + '도이고, 아래 오른쪽 꼭짓점 B의 각은 x이다.', pa.concat(mark(PA, 0, a, D(a)), mark(PB, a, 180, 'x')));
        wrong.equal = a; wrong['right-angle'] = 90 - a; wrong.full = 360 - a;
        steps = [{ say: '평행사변형에서 이웃한 두 각의 크기를 더하면 $180^{\\circ}$예요.', tex: '\\angle A + \\angle B = 180^{\\circ}' }, { say: '$180^{\\circ}$에서 $\\angle A$를 빼요.', tex: '\\angle B = 180^{\\circ} - ' + deg(a) + ' = ' + deg(ans) }];
        h2 = '평행사변형은 마주 보는 변이 평행해요. 변 $AD$와 변 $BC$가 평행하고, 변 $AB$가 그 둘을 가로질러요. 그러면 $\\angle A$와 $\\angle B$는 평행선 사이에서 같은 쪽 안쪽에 있는 각이 돼요. 이런 두 각은 더해서 평각이에요. 변 $AB$를 오른쪽으로 길게 늘여 보면 $\\angle B$ 옆에 $\\angle A$와 크기가 같은 동위각이 생기는 것으로 확인할 수 있어요. 그러니 평각의 크기에서 $' + deg(a) + '$를 빼요.';
      } else { ans = a; text = '그림의 평행사변형 $ABCD$에서 $\\angle A = ' + deg(a) + '$일 때, 마주 보는 각 $\\angle C$의 크기는 몇 도인가요?';
        fig = geo(200, '평행사변형 ABCD가 있다. 아래 왼쪽 꼭짓점 A의 각은 ' + a + '도이고, 위 오른쪽 꼭짓점 C의 각은 x이다.', pa.concat(mark(PA, 0, a, D(a)), mark(PC, 180, 180 + a, 'x')));
        wrong.supplement = 180 - a; wrong['right-angle'] = 90 - a; wrong.full = 360 - a;
        steps = [{ say: '$\\angle A$와 $\\angle C$는 서로 마주 보는 각(대각)이에요.', tex: '\\angle A \\text{ 와 } \\angle C \\text{ 는 대각}' }, { say: '평행사변형에서 마주 보는 각의 크기는 서로 같아요.', tex: '\\angle C = ' + deg(ans) }];
        h2 = '$\\angle A$와 $\\angle C$는 평행사변형에서 서로 마주 보는 자리에 있어요. 평행사변형을 대각선의 교점을 중심으로 반 바퀴 돌리면 처음 모양과 딱 겹쳐요. 이때 꼭짓점 $A$는 꼭짓점 $C$의 자리로 가요. 그래서 마주 보는 두 각은 크기가 같아요. 이웃한 각과 헷갈리지 않아요. 이웃한 두 각은 더해서 평각이 되고, 마주 보는 두 각은 크기가 같아요.';
      }
    } else if (q.kind === 'peri') {
      pa = para(65); ans = 2 * (s + t); text = '그림의 평행사변형 $ABCD$에서 $\\overline{AB} = ' + s + CM + '$, $\\overline{BC} = ' + t + CM + '$일 때, 둘레의 길이는 몇 cm인가요?';
      fig = geo(200, '평행사변형 ABCD가 있다. 아래쪽 변 AB의 길이는 ' + s + '센티미터, 오른쪽 변 BC의 길이는 ' + t + '센티미터이다.', pa.concat([txt((PA[0] + PB[0]) / 2, 170, s + ' cm'), txt(Math.min((PB[0] + PC[0]) / 2 + 32, 268), 105, t + ' cm')]));
      wrong['not-doubled'] = s + t; wrong.product = s * t; wrong['one-doubled'] = 2 * s + t;
      steps = [{ say: '평행사변형은 마주 보는 변의 길이가 같아요. 길이가 $' + s + '$인 변이 둘, $' + t + '$인 변이 둘이에요.', tex: '\\overline{CD} = ' + s + ',\\quad \\overline{AD} = ' + t }, { say: '네 변의 길이를 모두 더해요.', tex: '2 \\times (' + s + ' + ' + t + ') = ' + ans }];
      h2 = '둘레는 도형을 한 바퀴 두르는 길이, 곧 네 변의 길이를 모두 더한 것이에요. 그림에는 두 변의 길이만 적혀 있어요. 나머지 두 변은 평행사변형의 성질로 알 수 있어요. 마주 보는 변끼리 길이가 같으니, 변 $CD$는 변 $AB$와 같고 변 $AD$는 변 $BC$와 같아요. 네 변의 길이를 모두 적은 다음 더해요. 이웃한 두 변을 더한 것의 두 배와 같아요. 두 변을 곱하면 안 돼요.';
    } else if (q.kind === 'diag') {
      pa = para(65); O = [Math.round((PA[0] + PC[0]) / 2), 105]; ans = d / 2;
      text = '그림의 평행사변형 $ABCD$에서 두 대각선이 만나는 점을 $O$라고 해요. $\\overline{AC} = ' + d + CM + '$, $\\overline{BD} = ' + e + CM + '$일 때, $\\overline{AO}$의 길이는 몇 cm인가요?';
      fig = geo(200, '평행사변형 ABCD에 두 대각선 AC와 BD를 그었고, 두 대각선은 점 O에서 만난다.', pa.concat([seg(PA, PC), seg(PB, PD), ['dot', O[0], O[1]], txt(O[0], O[1] + 16, 'O')]));
      wrong.doubled = 2 * d; wrong['same-length'] = d; wrong['other-diagonal'] = intOr(e, 2);
      steps = [{ say: '평행사변형의 두 대각선은 서로를 반으로 나눠요. 점 $O$는 대각선 $AC$의 한가운데예요.', tex: '\\overline{AO} = \\overline{CO}' }, { say: '$\\overline{AC}$의 길이를 반으로 나눠요.', tex: '\\overline{AO} = ' + d + ' \\div 2 = ' + ans }];
      h2 = '평행사변형의 두 대각선은 서로를 똑같이 반으로 나눠요. 두 대각선이 만나는 점 $O$는 대각선 $AC$의 한가운데이면서 대각선 $BD$의 한가운데예요. 묻는 선분 $AO$는 대각선 $AC$의 절반이에요. 그러니 $AC$의 길이를 반으로 나눠요. 문제에 대각선이 두 개 나오니, 어느 대각선의 절반인지 글자를 보고 골라요. $AO$의 두 글자 가운데 $A$가 들어 있는 대각선은 $AC$예요.';
    } else if (q.kind === 'rect') {
      PA = [55, 155]; PB = [245, 155]; PC = [245, 45]; PD = [55, 45]; O = [150, 100];
      fig = geo(200, '직사각형 ABCD에 두 대각선 AC와 BD를 그었고, 두 대각선은 점 O에서 만난다.', [['poly', flat([PA, PB, PC, PD])], seg(PA, PC), seg(PB, PD), ['dot', 150, 100], txt(150, 117, 'O'), txt(43, 165, 'A'), txt(257, 165, 'B'), txt(257, 35, 'C'), txt(43, 35, 'D')]);
      if (q.v === 0) { ans = d / 2; text = '그림의 직사각형 $ABCD$에서 두 대각선이 만나는 점을 $O$라고 해요. $\\overline{AC} = ' + d + CM + '$일 때, $\\overline{BO}$의 길이는 몇 cm인가요?';
        wrong.doubled = 2 * d; wrong['same-length'] = d; wrong['halved-again'] = intOr(d, 4);
        steps = [{ say: '직사각형의 두 대각선은 길이가 같아요.', tex: '\\overline{BD} = \\overline{AC} = ' + d }, { say: '두 대각선은 서로를 반으로 나눠요. $\\overline{BD}$의 길이를 반으로 나눠요.', tex: '\\overline{BO} = ' + d + ' \\div 2 = ' + ans }];
        h2 = '묻는 선분 $BO$는 대각선 $BD$의 일부예요. 그런데 주어진 것은 다른 대각선 $AC$의 길이예요. 여기서 직사각형의 성질을 써요. 직사각형은 두 대각선의 길이가 같아요. 그러니 대각선 $BD$의 길이도 $' + d + '$' + pj(d, '이에요/예요') + '. 그리고 직사각형도 평행사변형이라서 두 대각선이 서로를 반으로 나눠요. 점 $O$가 $BD$의 한가운데이니, $BD$의 길이를 반으로 나누면 돼요.';
      } else { ans = 2 * d; text = '그림의 직사각형 $ABCD$에서 두 대각선이 만나는 점을 $O$라고 해요. $\\overline{AO} = ' + d + CM + '$일 때, $\\overline{BD}$의 길이는 몇 cm인가요?';
        wrong['same-length'] = d; wrong['halved-again'] = intOr(d, 2); wrong.quadrupled = 4 * d;
        steps = [{ say: '두 대각선은 서로를 반으로 나눠요. $\\overline{AC}$는 $\\overline{AO}$의 두 배예요.', tex: '\\overline{AC} = 2 \\times ' + d + ' = ' + ans }, { say: '직사각형의 두 대각선은 길이가 같아요.', tex: '\\overline{BD} = \\overline{AC} = ' + ans }];
        h2 = '주어진 선분 $AO$는 대각선 $AC$의 절반이에요. 두 대각선이 서로를 반으로 나누기 때문이에요. 그러니 먼저 $AO$의 길이를 두 배 해서 대각선 $AC$의 길이를 구해요. 묻는 것은 다른 대각선 $BD$의 길이예요. 직사각형은 두 대각선의 길이가 같으니, $BD$의 길이는 방금 구한 $AC$의 길이와 같아요. 절반의 길이를 그대로 답하지 않도록 조심해요.';
      }
    } else if (q.kind === 'rhom-angle') {
      T = G.tri(a, a, 45, 15, 210, 85); A1 = T[0]; B1 = T[1]; C1 = T[2]; base = A1[1]; mir = [C1[0], 2 * base - C1[1]]; ans = 90 - a;
      text = '그림의 마름모 $ABCD$에서 $\\angle ABD = ' + deg(a) + '$일 때, $\\angle BAC$의 크기는 몇 도인가요?';
      fig = geo(Math.min(2 * base - C1[1] + 22, 220), '마름모 ABCD에 두 대각선을 그었다. 위 꼭짓점 A, 왼쪽 꼭짓점 B, 아래 꼭짓점 C, 오른쪽 꼭짓점 D이고, 두 대각선은 직각으로 만난다. 각 ABD는 ' + a + '도이고 각 BAC는 x이다.',
        [['poly', flat([C1, A1, mir, B1])], seg(A1, B1), seg(C1, mir), ['sq', C1[0], base, 0], txt(C1[0], Math.max(C1[1] - 10, 8), 'A'), txt(A1[0] - 12, base, 'B'), txt(C1[0], mir[1] + 12, 'C'), txt(B1[0] + 12, base, 'D')].concat(mark(A1, 0, a, D(a)), mark(C1, 180 + a, 270, 'x')));
      wrong.equal = a; wrong.supplement = 180 - a; wrong['doubled-angle'] = 2 * a;
      steps = [{ say: '마름모의 두 대각선은 직각으로 만나요. 두 대각선이 만나는 점을 $O$라고 하면 삼각형 $ABO$는 직각삼각형이에요.', tex: '\\angle AOB = 90^{\\circ}' }, { say: '삼각형 $ABO$의 세 내각의 합은 $180^{\\circ}$예요. 직각을 빼면 나머지 두 각의 합은 $90^{\\circ}$예요.', tex: '\\angle BAC = 90^{\\circ} - ' + deg(a) + ' = ' + deg(ans) }];
      h2 = '마름모는 네 변의 길이가 모두 같은 사각형이에요. 마름모의 두 대각선은 언제나 직각으로 만나요. 두 대각선이 만나는 점과 꼭짓점 $A$, $B$로 이루어진 작은 삼각형을 봐요. 이 삼각형은 한 각이 직각인 직각삼각형이에요. 주어진 각 $' + deg(a) + '$와 묻는 각이 이 삼각형의 나머지 두 각이에요. 세 내각의 합에서 직각을 빼고, 주어진 각도 빼면 묻는 각이 남아요.';
    } else {
      ans = 4 * s; text = '한 변의 길이가 ' + cm(s) + '인 마름모의 둘레의 길이는 몇 cm인가요?';
      wrong['two-sides'] = 2 * s; wrong.squared = s * s; wrong['three-sides'] = 3 * s;
      steps = [{ say: '마름모는 네 변의 길이가 모두 같아요.', tex: s + ' + ' + s + ' + ' + s + ' + ' + s }, { say: '한 변의 길이에 4를 곱해요.', tex: '4 \\times ' + s + ' = ' + ans }];
      h2 = '마름모는 네 변의 길이가 모두 같은 사각형이에요. 그래서 한 변의 길이만 알면 네 변의 길이를 모두 아는 셈이에요. 둘레는 도형을 한 바퀴 두르는 길이이니, 네 변의 길이를 모두 더하면 돼요. 같은 수를 네 번 더하는 것은 그 수에 4를 곱하는 것과 같아요. 한 변의 길이를 제곱하면 넓이를 구하는 것처럼 되어 버리니 조심해요. 변이 네 개라는 것도 잊지 않아요.';
    }
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans), hints: [Q_KEY, h2, Q_LAST] };
  };
  numQ({
    id: 'B23.quad', title: '사각형의 성질', kind: 'int', build: quadBuild,
    mistakes: [['sum-given', '주어진 세 각을 더하기만 했어요. 그 합을 네 내각의 합 $360^{\\circ}$에서 빼야 나머지 각이 나와요.'],
      ['one-missed', '세 각 가운데 하나를 빼지 않았어요. 주어진 세 각을 모두 빼요.'],
      ['sum-540', '네 내각의 합을 $540^{\\circ}$로 계산했어요. 사각형은 삼각형 두 개로 나뉘니 $360^{\\circ}$예요.'],
      ['equal', '주어진 각과 크기가 같다고 봤어요. 크기가 같은 것은 마주 보는 각이에요. 이 두 각은 다른 관계예요.'],
      ['supplement', '$180^{\\circ}$에서 뺐어요. 더해서 $180^{\\circ}$가 되는 것은 이웃한 두 각이에요. 이 두 각은 다른 관계예요.'],
      ['right-angle', '$90^{\\circ}$에서 뺐어요. 평행사변형의 각은 보통 직각이 아니에요. 평행사변형의 성질을 써요.'],
      ['full', '$360^{\\circ}$에서 뺐어요. 네 각의 합이 $360^{\\circ}$인 것은 맞지만, 여기서는 두 각 사이의 관계를 써요.'],
      ['not-doubled', '이웃한 두 변만 더했어요. 변은 모두 네 개예요. 마주 보는 변까지 더해요.'],
      ['product', '두 변의 길이를 곱했어요. 둘레는 변의 길이를 모두 더한 것이에요.'],
      ['one-doubled', '한 쌍의 변만 두 번 더했어요. 두 쌍의 변 모두 마주 보는 변끼리 길이가 같아요.'],
      ['doubled', '길이를 두 배 했어요. 묻는 선분은 대각선의 절반이에요. 반으로 나눠요.'],
      ['same-length', '주어진 길이를 그대로 답했어요. 대각선 전체와 그 절반을 구별해요. 점 $O$는 대각선의 한가운데예요.'],
      ['other-diagonal', '다른 대각선의 절반을 답했어요. 선분의 이름에 든 글자를 보고 어느 대각선의 일부인지 확인해요.'],
      ['halved-again', '반으로 나눠야 할 때와 두 배 해야 할 때를 헷갈렸어요. 대각선 전체는 절반의 두 배예요.'],
      ['quadrupled', '네 배를 했어요. 대각선 하나는 절반 두 개로 이루어져 있어요. 두 배만 해요.'],
      ['doubled-angle', '주어진 각을 두 배 했어요. 그 값은 $\\angle ABC$의 크기예요. 대각선이 직각으로 만나는 것을 써요.'],
      ['two-sides', '변 두 개만 더했어요. 마름모의 변은 네 개예요.'],
      ['squared', '한 변의 길이를 제곱했어요. 둘레는 네 변의 길이를 더한 것이에요.'],
      ['three-sides', '변 세 개만 더했어요. 마름모의 변은 네 개예요.']],
    levels: [
      { name: '사각형의 네 내각의 합', minDistinct: 250, vars: { q: sampler(function (r) { return until(function () { var a = r.int(50, 130), b = r.int(50, 130), c = r.int(50, 130); return 360 - a - b - c < 40 || 360 - a - b - c > 150 ? null : { kind: 'sum4', a: a, b: b, c: c }; }, function (q) { return quadBuild(q).check; }); }) } },
      { name: '평행사변형', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () {
            var k = r.int(0, 3), a = r.int(50, 78), d = 2 * r.int(3, 15), e;
            if (k < 2) return { kind: k ? 'adj' : 'opp', a: r.int(0, 1) ? a : 180 - a };
            if (k === 2) { a = r.int(4, 15); d = r.int(3, 12); return a === d ? null : { kind: 'peri', s: a, t: d }; }
            e = 2 * r.int(3, 15); return d === e ? null : { kind: 'diag', d: d, e: e };
          }, function (q) { return quadBuild(q).check; });
        }) } },
      { name: '직사각형과 마름모', minDistinct: 80, vars: { q: sampler(function (r) {
          return until(function () {
            var k = r.int(0, 2), v = r.int(0, 1);
            if (k === 0) return { kind: 'rect', v: v, d: v ? r.int(3, 15) : 2 * r.int(3, 15) };
            if (k === 1) return { kind: 'rhom-angle', a: r.int(25, 62) };
            return { kind: 'rhom-peri', s: r.int(3, 19) };
          }, function (q) { return q.a !== 45 && quadBuild(q).check; });
        }) } }
    ]
  });

  /* ── B23.area 넓이 ──────────────────────────── */
  var S_KEY = '넓이 공식은 모두 직사각형에서 나와요. 평행사변형은 한쪽 끝의 삼각형을 잘라 반대쪽에 붙이면 직사각형이 되니 (밑변) × (높이)예요. 삼각형은 똑같은 것 두 개를 붙이면 평행사변형이 되니 그 절반인 (밑변) × (높이) ÷ 2예요. 사다리꼴도 똑같은 것 두 개를 붙이면 평행사변형이 되어 (윗변 + 아랫변) × (높이) ÷ 2예요. 높이는 비스듬한 변의 길이가 아니라 밑변에 직각으로 잰 길이예요.';
  var S_LAST = '① 도형의 종류를 확인해요. ② 밑변과 높이를 찾아요(높이는 직각으로 잰 길이). ③ 삼각형 · 사다리꼴 · 마름모는 마지막에 2로 나눠요. ④ 넓이의 단위는 cm²예요.';
  var areaBuild = function (q) {
    var b = q.b, h = q.h, s = q.s, a = q.a, d1 = q.d1, d2 = q.d2, S, text, ans, wrong = {}, steps, h2, fig;
    var triFig = function (lb, lh) { return geo(180, '삼각형이 있다. 아래쪽 밑변의 길이는 ' + lb + ', 위 꼭짓점에서 밑변에 직각으로 내린 높이는 ' + lh + '이다.', [['poly', flat([[50, 150], [250, 150], [120, 35]]), true], seg([120, 35], [120, 150], true), ['sq', 120, 150, 0], txt(150, 166, lb), txt(120 + 12 + 4 * String(lh).length, 100, lh)]); };
    var paraFig = function (lb, lh, ls) { return geo(180, '평행사변형이 있다. 아래쪽 밑변의 길이는 ' + lb + ', 밑변에 직각으로 잰 높이는 ' + lh + (ls ? ', 비스듬한 변의 길이는 ' + ls : '') + '이다.', [['poly', flat([[40, 150], [200, 150], [260, 45], [100, 45]]), true], seg([100, 45], [100, 150], true), ['sq', 100, 150, 0], txt(120, 166, lb), txt(100 + 12 + 4 * String(lh).length, 100, lh)].concat(ls ? [txt(264, 108, ls)] : [])); };
    var trapFig = function (la, lb, lh) { return geo(180, '사다리꼴이 있다. 윗변의 길이는 ' + la + ', 아랫변의 길이는 ' + lb + ', 두 변 사이에 직각으로 잰 높이는 ' + lh + '이다.', [['poly', flat([[40, 150], [260, 150], [210, 50], [100, 50]]), true], seg([100, 50], [100, 150], true), ['sq', 100, 150, 0], txt(155, 36, la), txt(150, 166, lb), txt(100 + 12 + 4 * String(lh).length, 100, lh)]); };
    var u = function (n) { return n + ' cm'; };
    if (q.kind === 'tri') {
      ans = b * h / 2; fig = triFig(u(b), u(h)); text = '밑변의 길이가 ' + cm(b) + ', 높이가 ' + cm(h) + '인 삼각형의 넓이는 몇 cm²인가요?';
      wrong['not-halved'] = b * h; wrong.added = b + h; wrong.perimeter = 2 * (b + h);
      steps = [{ say: '삼각형의 넓이는 (밑변) × (높이) ÷ 2예요.', tex: b + ' \\times ' + h + ' \\div 2' }, { say: '곱한 다음 2로 나눠요.', tex: b * h + ' \\div 2 = ' + ans }];
      h2 = '삼각형의 넓이는 밑변과 높이로 구해요. 똑같은 삼각형을 하나 더 만들어 뒤집어 붙이면 평행사변형이 돼요. 그 평행사변형의 넓이는 밑변과 높이를 곱한 것이에요. 삼각형은 그 절반이니, 밑변 ' + cm(b) + '와 높이 ' + cm(h) + '를 곱한 다음 2로 나눠요. 2로 나누는 것을 가장 많이 잊어요. 높이는 꼭짓점에서 밑변까지 직각으로 내린 점선의 길이예요.';
    } else if (q.kind === 'para') {
      ans = b * h; fig = paraFig(u(b), u(h), u(s)); text = '그림의 평행사변형은 밑변의 길이가 ' + cm(b) + ', 높이가 ' + cm(h) + '이고, 비스듬한 변의 길이가 ' + cm(s) + '예요. 이 평행사변형의 넓이는 몇 cm²인가요?';
      wrong.halved = intOr(b * h, 2); wrong['side-used'] = b * s; wrong.perimeter = 2 * (b + s);
      steps = [{ say: '평행사변형의 넓이는 (밑변) × (높이)예요. 비스듬한 변의 길이는 쓰지 않아요.', tex: b + ' \\times ' + h }, { say: '곱해요.', tex: String(ans) }];
      h2 = '평행사변형의 한쪽 끝을 세로로 잘라 반대쪽에 옮겨 붙이면 직사각형이 돼요. 그 직사각형의 가로는 평행사변형의 밑변이고, 세로는 평행사변형의 높이예요. 그래서 넓이는 밑변과 높이를 곱한 것이에요. 이 문제에는 길이가 세 개 나와요. 그 가운데 비스듬한 변의 길이 ' + cm(s) + '는 넓이와 상관없어요. 밑변에 직각으로 잰 점선의 길이가 높이예요. 삼각형이 아니니 2로 나누지 않아요.';
    } else if (q.kind === 'trap') {
      ans = (a + b) * h / 2; fig = trapFig(u(a), u(b), u(h)); text = '윗변의 길이가 ' + cm(a) + ', 아랫변의 길이가 ' + cm(b) + ', 높이가 ' + cm(h) + '인 사다리꼴의 넓이는 몇 cm²인가요?';
      wrong['not-halved'] = (a + b) * h; wrong['one-base'] = b * h; wrong['bases-times'] = a * b;
      steps = [{ say: '사다리꼴의 넓이는 (윗변 + 아랫변) × (높이) ÷ 2예요. 먼저 두 변을 더해요.', tex: '(' + a + ' + ' + b + ') \\times ' + h + ' \\div 2' }, { say: '괄호 안을 계산하고, 높이를 곱한 다음 2로 나눠요.', tex: (a + b) + ' \\times ' + h + ' \\div 2 = ' + ans }];
      h2 = '똑같은 사다리꼴을 하나 더 만들어 거꾸로 뒤집어 옆에 붙이면 평행사변형이 돼요. 그 평행사변형의 밑변은 윗변과 아랫변을 이어 붙인 길이예요. 그래서 먼저 윗변 ' + cm(a) + '와 아랫변 ' + cm(b) + '를 더해요. 거기에 높이 ' + cm(h) + '를 곱하면 평행사변형의 넓이이고, 사다리꼴은 그 절반이니 2로 나눠요. 괄호 안의 덧셈을 가장 먼저 해요.';
    } else if (q.kind === 'rhom') {
      ans = d1 * d2 / 2; text = '두 대각선의 길이가 ' + cm(d1) + ', ' + cm(d2) + '인 마름모의 넓이는 몇 cm²인가요?';
      fig = geo(180, '마름모가 있다. 가로로 놓인 대각선의 길이는 ' + d1 + '센티미터, 세로로 놓인 대각선의 길이는 ' + d2 + '센티미터이고, 두 대각선은 직각으로 만난다.', [['poly', flat([[150, 20], [250, 90], [150, 160], [50, 90]]), true], seg([50, 90], [250, 90], true), seg([150, 20], [150, 160], true), ['sq', 150, 90, 0], txt(205, 78, u(d1)), txt(122, 122, u(d2))]);
      wrong['not-halved'] = d1 * d2; wrong.added = d1 + d2; wrong.perimeter = 2 * (d1 + d2);
      steps = [{ say: '마름모의 넓이는 (한 대각선) × (다른 대각선) ÷ 2예요.', tex: d1 + ' \\times ' + d2 + ' \\div 2' }, { say: '곱한 다음 2로 나눠요.', tex: d1 * d2 + ' \\div 2 = ' + ans }];
      h2 = '마름모를 딱 맞게 둘러싸는 직사각형을 그려 봐요. 그 직사각형의 가로와 세로는 마름모의 두 대각선의 길이와 같아요. 마름모의 두 대각선은 직각으로 만나기 때문이에요. 직사각형 안에서 마름모가 차지하는 넓이는 꼭 절반이에요. 네 귀퉁이의 삼각형을 안으로 접으면 마름모를 딱 덮거든요. 그래서 두 대각선 ' + cm(d1) + ', ' + cm(d2) + '를 곱한 다음 2로 나눠요.';
    } else if (q.kind === 'tri-h') {
      S = b * h / 2; ans = h; fig = triFig(u(b), 'x'); text = '밑변의 길이가 ' + cm(b) + '이고 넓이가 $' + S + CM2 + '$인 삼각형의 높이는 몇 cm인가요?';
      wrong['not-doubled'] = intOr(S, b); wrong['base-copied'] = b; wrong['area-half'] = intOr(S, 2);
      steps = [{ say: '높이를 $x$로 놓고 넓이 공식에 넣어요.', tex: b + ' \\times x \\div 2 = ' + S }, { say: '양쪽에 2를 곱해요.', tex: b + ' \\times x = ' + 2 * S }, { say: '밑변의 길이로 나눠요.', tex: 'x = ' + ans }];
      h2 = '넓이 공식을 거꾸로 써요. 삼각형의 넓이는 밑변과 높이를 곱한 다음 2로 나눈 것이에요. 계산한 차례를 거꾸로 되돌리면 돼요. 마지막에 2로 나눴으니, 먼저 넓이 $' + S + '$에 2를 곱해요. 그러면 밑변과 높이를 곱한 값이 나와요. 그 값을 밑변 ' + cm(b) + '로 나누면 높이예요. 2를 곱하는 것을 빠뜨리면 높이가 절반으로 나와요.';
    } else if (q.kind === 'para-h') {
      S = b * h; ans = h; fig = paraFig(u(b), 'x'); text = '밑변의 길이가 ' + cm(b) + '이고 넓이가 $' + S + CM2 + '$인 평행사변형의 높이는 몇 cm인가요?';
      wrong.doubled = 2 * h; wrong['base-copied'] = b; wrong['area-half'] = intOr(S, 2);
      steps = [{ say: '높이를 $x$로 놓고 넓이 공식에 넣어요.', tex: b + ' \\times x = ' + S }, { say: '넓이를 밑변의 길이로 나눠요.', tex: 'x = ' + S + ' \\div ' + b + ' = ' + ans }];
      h2 = '넓이 공식을 거꾸로 써요. 평행사변형의 넓이는 밑변과 높이를 곱한 것이에요. 넓이와 밑변을 알고 있으니, "밑변에 어떤 수를 곱해야 넓이가 되는가"를 찾으면 돼요. 곱셈의 반대는 나눗셈이니 넓이 $' + S + '$' + pj(S, '을/를') + ' 밑변 ' + cm(b) + '로 나눠요. 평행사변형의 넓이 공식에는 2로 나누는 것이 없어요. 그러니 2를 곱하거나 나누지 않아요.';
    } else {
      S = (a + b) * h / 2; ans = h; fig = trapFig(u(a), u(b), 'x'); text = '윗변의 길이가 ' + cm(a) + ', 아랫변의 길이가 ' + cm(b) + '이고 넓이가 $' + S + CM2 + '$인 사다리꼴의 높이는 몇 cm인가요?';
      wrong['not-doubled'] = intOr(S, a + b); wrong['one-base'] = intOr(2 * S, b); wrong['base-sum'] = a + b;
      steps = [{ say: '높이를 $x$로 놓고 넓이 공식에 넣어요.', tex: '(' + a + ' + ' + b + ') \\times x \\div 2 = ' + S }, { say: '괄호 안을 더하고, 양쪽에 2를 곱해요.', tex: (a + b) + ' \\times x = ' + 2 * S }, { say: '두 변의 합으로 나눠요.', tex: 'x = ' + ans }];
      h2 = '넓이 공식을 거꾸로 써요. 사다리꼴의 넓이는 윗변과 아랫변을 더하고, 높이를 곱하고, 2로 나눈 것이에요. 먼저 윗변 ' + cm(a) + '와 아랫변 ' + cm(b) + '를 더해 둬요. 그다음 계산한 차례를 거꾸로 되돌려요. 마지막에 2로 나눴으니 넓이 $' + S + '$에 2를 곱해요. 그 값을 두 변의 합으로 나누면 높이가 나와요. 아랫변 하나로만 나누지 않도록 조심해요.';
    }
    return { text: text, figure: fig, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans), hints: [S_KEY, h2, S_LAST] };
  };
  numQ({
    id: 'B23.area', title: '도형의 넓이', kind: 'int', build: areaBuild,
    mistakes: [['not-halved', '2로 나누지 않았어요. 삼각형 · 사다리꼴 · 마름모의 넓이는 곱한 다음 반으로 나눠요.'],
      ['added', '두 길이를 더했어요. 넓이는 두 길이를 곱해서 구해요.'],
      ['perimeter', '길이를 더해서 두 배 했어요. 그것은 둘레를 구하는 방법이에요. 넓이는 곱해서 구해요.'],
      ['halved', '2로 나눴어요. 평행사변형의 넓이는 (밑변) × (높이)이고, 2로 나누는 것은 삼각형이에요.'],
      ['side-used', '높이 대신 비스듬한 변의 길이를 곱했어요. 높이는 밑변에 직각으로 잰 길이예요.'],
      ['one-base', '윗변과 아랫변 가운데 하나만 썼어요. 사다리꼴은 두 변을 더해서 써요.'],
      ['bases-times', '윗변과 아랫변을 곱했어요. 두 변은 더하고, 거기에 높이를 곱한 다음 2로 나눠요.'],
      ['not-doubled', '넓이에 2를 곱하지 않았어요. 넓이 공식에서 2로 나눴으니, 거꾸로 갈 때는 먼저 2를 곱해요.'],
      ['base-copied', '밑변의 길이를 그대로 답했어요. 넓이 공식에 넣어서 높이를 구해야 해요.'],
      ['area-half', '넓이를 2로 나누기만 했어요. 넓이를 밑변의 길이로 나눠야 높이가 나와요.'],
      ['doubled', '2를 곱했어요. 평행사변형의 넓이 공식에는 2로 나누는 것이 없으니, 거꾸로 갈 때도 2를 곱하지 않아요.'],
      ['base-sum', '윗변과 아랫변의 합을 답했어요. 넓이의 2배를 그 합으로 나눠야 높이가 나와요.']],
    levels: [
      { name: '삼각형과 평행사변형', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { var b = r.int(4, 16), h = r.int(3, 12); if (r.int(0, 1)) return b === h || (b * h) % 2 ? null : { kind: 'tri', b: b, h: h }; return b === h ? null : { kind: 'para', b: b, h: h, s: h + r.int(1, 3) }; }, function (q) { return areaBuild(q).check; }); }) } },
      { name: '사다리꼴과 마름모', minDistinct: 250, vars: { q: sampler(function (r) { return until(function () { var a = r.int(3, 10), b = a + r.int(2, 8), h = r.int(3, 12), d1 = r.int(6, 20), d2 = r.int(4, 16); if (r.int(0, 1)) return ((a + b) * h) % 2 ? null : { kind: 'trap', a: a, b: b, h: h }; return (d1 * d2) % 2 || d1 <= d2 ? null : { kind: 'rhom', d1: d1, d2: d2 }; }, function (q) { return areaBuild(q).check; }); }) } },
      { name: '넓이로 높이 구하기', minDistinct: 250, vars: { q: sampler(function (r) { return until(function () { var k = r.int(0, 2), b = r.int(4, 16), h = r.int(3, 12), a = r.int(3, 9); if (k === 0) return b === h || (b * h) % 2 ? null : { kind: 'tri-h', b: b, h: h }; if (k === 1) return b === h ? null : { kind: 'para-h', b: b, h: h }; b = a + r.int(2, 8); return ((a + b) * h) % 2 ? null : { kind: 'trap-h', a: a, b: b, h: h }; }, function (q) { return areaBuild(q).check; }); }) } }
    ]
  });

  /* ── B23.circle 원과 부채꼴 ─────────────────────── */
  var C_KEY = '원의 둘레를 지름으로 나누면 어떤 원이든 같은 수가 나와요. 그 수가 원주율이고 $\\pi$라고 써요. 약 3.14이지만 끝없이 이어지는 수라서 $\\pi$를 그대로 써요. 반지름이 $r$인 원의 둘레는 $2\\pi r$, 넓이는 $\\pi r^{2}$이에요. 부채꼴은 피자 한 조각처럼 원을 잘라 낸 것이에요. 중심각이 $360^{\\circ}$ 가운데 얼마를 차지하는지에 따라 호의 길이도 넓이도 원 전체의 그만큼이에요.';
  var C_LAST = '① 반지름인지 지름인지 확인해요(지름은 반지름의 2배). ② 원의 둘레는 $2\\pi r$, 넓이는 $\\pi r^{2}$이에요. ③ 부채꼴은 원 전체의 값에 (중심각) ÷ $360^{\\circ}$를 곱해요. ④ 길이는 cm, 넓이는 cm²로 답해요.';
  /** (n/d)π 단위. 약분해서 쓴다 */
  var piT = function (n, d, unit) { var g = gcd(n, d) || 1; n /= g; d /= g; return (d === 1 ? (n === 1 ? '' : n) + '\\pi' : '\\dfrac{' + (n === 1 ? '' : n) + '\\pi}{' + d + '}') + unit; };
  var plain = function (n, unit) { return n + unit; };
  var circleBuild = function (q) {
    var r = q.r, th = q.th, k = q.k, text, ans, cands, steps, h2, fig, given, cx, cy, R0, p1;
    if (q.kind === 'circle') {
      given = q.dia ? '지름의 길이가 ' + cm(2 * r) : '반지름의 길이가 ' + cm(r);
      fig = geo(180, q.dia ? '원이 있다. 원의 중심을 지나는 지름의 길이는 ' + 2 * r + '센티미터이다.' : '원이 있다. 원의 중심에서 원 위의 한 점까지 그은 반지름의 길이는 ' + r + '센티미터이다.', [['circle', 150, 90, 72], ['dot', 150, 90], q.dia ? seg([78, 90], [222, 90]) : seg([150, 90], [222, 90]), txt(q.dia ? 150 : 186, 76, (q.dia ? 2 * r : r) + ' cm')]);
      var toR = q.dia ? [{ say: '지름의 절반이 반지름이에요.', tex: 'r = ' + 2 * r + ' \\div 2 = ' + r }] : [];
      if (q.ask === 'len') {
        text = given + '인 원의 둘레의 길이를 고르세요.'; ans = piT(2 * r, 1, CM);
        cands = mixc([[piT(r * r, 1, CM), 'area-formula', '넓이를 구하는 식 $\\pi r^{2}$을 썼어요. 둘레의 길이는 $2\\pi r$, 곧 (지름) × $\\pi$예요.']], [
          [piT(r, 1, CM), 'radius-only', '반지름에 $\\pi$만 곱했어요. 둘레는 (지름) × $\\pi$예요. 반지름을 2배 해서 지름으로 만들어요.'],
          [piT(4 * r, 1, CM), 'diameter-doubled', '2를 한 번 더 곱했어요. 둘레는 (지름) × $\\pi$이고, 지름은 반지름의 2배예요. 2는 한 번만 곱해요.'],
          [plain(2 * r, CM), 'pi-lost', '$\\pi$를 빠뜨렸어요. 그 수는 지름의 길이예요. 둘레는 지름의 $\\pi$배예요.']], q.perm);
        steps = toR.concat([{ say: '원의 둘레의 길이는 $2\\pi r$이에요.', tex: '2 \\times \\pi \\times ' + r }, { say: '수끼리 곱하고 $\\pi$는 그대로 붙여요.', tex: ans }]);
        h2 = '원의 둘레는 지름의 $\\pi$배예요. 어떤 크기의 원이든 둘레를 지름으로 나누면 늘 같은 수 $\\pi$가 나오기 때문이에요. ' + (q.dia ? '지름이 ' + cm(2 * r) + '로 주어져 있으니 거기에 $\\pi$를 곱하면 바로 둘레예요. 지름을 다시 2배 하지 않도록 조심해요.' : '반지름이 ' + cm(r) + '로 주어져 있으니 먼저 2배 해서 지름을 구하고, 거기에 $\\pi$를 곱해요.') + ' $\\pi$는 수로 바꾸지 않고 문자처럼 그대로 써요. 길이를 묻고 있으니 제곱은 나오지 않아요.';
      } else {
        text = given + '인 원의 넓이를 고르세요.'; ans = piT(r * r, 1, CM2);
        cands = mixc([[piT(2 * r, 1, CM2), 'circumference-formula', '둘레를 구하는 식 $2\\pi r$을 썼어요. 넓이는 $\\pi r^{2}$, 곧 (반지름) × (반지름) × $\\pi$예요.']], [
          [piT(4 * r * r, 1, CM2), 'diameter-squared', '지름을 제곱했어요. 넓이 공식에서 제곱하는 것은 반지름이에요. 지름을 반으로 나눈 반지름을 써요.'],
          [piT(r, 1, CM2), 'not-squared', '반지름을 제곱하지 않았어요. 넓이는 (반지름) × (반지름) × $\\pi$예요.'],
          [plain(r * r, CM2), 'pi-lost', '$\\pi$를 빠뜨렸어요. 반지름을 제곱한 다음 $\\pi$를 곱해야 원의 넓이예요.']], q.perm);
        steps = toR.concat([{ say: '원의 넓이는 $\\pi r^{2}$이에요.', tex: '\\pi \\times ' + r + '^{2}' }, { say: '반지름을 제곱하고 $\\pi$는 그대로 붙여요.', tex: ans }]);
        h2 = '원의 넓이는 반지름을 두 번 곱하고 거기에 $\\pi$를 곱한 것이에요. 원을 피자처럼 아주 잘게 잘라 엇갈리게 늘어놓으면 직사각형에 가까운 모양이 돼요. 그 가로는 둘레의 절반, 세로는 반지름이라서 이런 식이 나와요. ' + (q.dia ? '여기서는 지름이 ' + cm(2 * r) + '로 주어져 있어요. 공식에 넣는 것은 반지름이니, 먼저 지름을 반으로 나눠요.' : '반지름 ' + cm(r) + '를 제곱해요. 2를 곱하는 것이 아니라 같은 수를 두 번 곱하는 것이에요.') + ' 넓이이니 단위는 cm²예요.';
      }
    } else if (q.kind === 'sector') {
      cx = 150; cy = th > 180 ? 100 : 150; R0 = th > 180 ? 82 : 110; p1 = G.polar(cx, cy, 38, th / 2);
      fig = geo(th > 180 ? 195 : 170, '부채꼴이 있다. 반지름의 길이는 ' + r + '센티미터이고 중심각의 크기는 ' + th + '도이다.', [['sector', cx, cy, R0, 0, th], ['arc', cx, cy, 16, 0, th], txt(p1[0], p1[1], D(th)), txt(cx + R0 / 2, cy + 14, r + ' cm')]);
      if (q.ask === 'len') {
        text = '반지름의 길이가 ' + cm(r) + ', 중심각의 크기가 $' + deg(th) + '$인 부채꼴의 호의 길이를 고르세요.'; ans = piT(2 * r * th, 360, CM);
        cands = mixc([[piT(2 * r, 1, CM), 'whole-circle', '원 전체의 둘레를 구했어요. 부채꼴은 원의 일부예요. 중심각이 $360^{\\circ}$ 가운데 차지하는 만큼만 곱해요.']], [
          [piT(r * r * th, 360, CM), 'area-formula', '넓이를 구하는 식을 썼어요. 호의 길이는 원의 둘레 $2\\pi r$에 (중심각) ÷ $360^{\\circ}$를 곱해요.'],
          [piT(4 * r * th, 360, CM), 'doubled-ratio', '중심각을 $180^{\\circ}$로 나눴어요. 한 바퀴는 $360^{\\circ}$예요. (중심각) ÷ $360^{\\circ}$를 곱해요.'],
          [piT(r * th, 360, CM), 'half-ratio', '원의 둘레를 $\\pi r$로 계산했어요. 둘레는 $2\\pi r$이에요. 2를 빠뜨리지 않아요.']], q.perm);
        steps = [{ say: '원 전체의 둘레를 구해요.', tex: '2 \\times \\pi \\times ' + r + ' = ' + piT(2 * r, 1, '') }, { say: '중심각이 한 바퀴 가운데 차지하는 만큼을 곱해요.', tex: piT(2 * r, 1, '') + ' \\times \\dfrac{' + th + '}{360}' }, { say: '약분해서 계산해요.', tex: ans }];
        h2 = '부채꼴의 호는 원의 둘레의 일부예요. 얼마만큼인지는 중심각이 정해요. 한 바퀴가 $360^{\\circ}$이니, 중심각 $' + deg(th) + '$는 한 바퀴 가운데 $\\dfrac{' + th + '}{360}$만큼이에요. 이 분수를 먼저 약분해 두면 계산이 쉬워요. 그다음 원 전체의 둘레를 구해요. 반지름 ' + cm(r) + '를 2배 하고 $\\pi$를 곱하면 돼요. 마지막으로 둘레에 약분한 분수를 곱해요.';
      } else {
        text = '반지름의 길이가 ' + cm(r) + ', 중심각의 크기가 $' + deg(th) + '$인 부채꼴의 넓이를 고르세요.'; ans = piT(r * r * th, 360, CM2);
        cands = mixc([[piT(r * r, 1, CM2), 'whole-circle', '원 전체의 넓이를 구했어요. 부채꼴은 원의 일부예요. 중심각이 $360^{\\circ}$ 가운데 차지하는 만큼만 곱해요.']], [
          [piT(2 * r * th, 360, CM2), 'circumference-formula', '호의 길이를 구하는 식을 썼어요. 넓이는 원의 넓이 $\\pi r^{2}$에 (중심각) ÷ $360^{\\circ}$를 곱해요.'],
          [piT(2 * r * r * th, 360, CM2), 'doubled-ratio', '중심각을 $180^{\\circ}$로 나눴어요. 한 바퀴는 $360^{\\circ}$예요. (중심각) ÷ $360^{\\circ}$를 곱해요.'],
          [piT(r * th, 360, CM2), 'not-squared', '반지름을 제곱하지 않았어요. 원의 넓이는 (반지름) × (반지름) × $\\pi$예요.']], q.perm);
        steps = [{ say: '원 전체의 넓이를 구해요.', tex: '\\pi \\times ' + r + '^{2} = ' + piT(r * r, 1, '') }, { say: '중심각이 한 바퀴 가운데 차지하는 만큼을 곱해요.', tex: piT(r * r, 1, '') + ' \\times \\dfrac{' + th + '}{360}' }, { say: '약분해서 계산해요.', tex: ans }];
        h2 = '부채꼴은 원에서 잘라 낸 피자 한 조각이에요. 조각의 크기는 중심각이 정해요. 한 바퀴가 $360^{\\circ}$이니, 중심각 $' + deg(th) + '$인 조각은 원 전체의 $\\dfrac{' + th + '}{360}$만큼이에요. 이 분수를 먼저 약분해요. 그다음 원 전체의 넓이를 구해요. 반지름 ' + cm(r) + '를 제곱하고 $\\pi$를 곱하면 돼요. 마지막으로 원의 넓이에 약분한 분수를 곱해요.';
      }
    } else if (q.kind === 'angle') {
      th = 180 * k / r; text = '반지름의 길이가 ' + cm(r) + '이고 호의 길이가 $' + piT(k, 1, CM) + '$인 부채꼴의 중심각의 크기를 고르세요.'; ans = deg(th);
      cands = mixc([[deg(2 * th), 'doubled-ratio', '원의 둘레를 $\\pi r$로 계산했어요. 둘레는 $2\\pi r$이에요. 그래서 중심각이 2배로 나왔어요.']], [
        isInt(th / 2) ? [deg(th / 2), 'half-ratio', '한 바퀴를 $180^{\\circ}$로 계산했어요. 한 바퀴는 $360^{\\circ}$예요.'] : null,
        180 - th > 0 ? [deg(180 - th), 'supplement', '$180^{\\circ}$에서 뺐어요. 중심각은 (호의 길이) ÷ (원의 둘레)에 $360^{\\circ}$를 곱해서 구해요.'] : null,
        360 - th !== 2 * th ? [deg(360 - th), 'rest-angle', '부채꼴을 뺀 나머지 부분의 각을 답했어요. 묻는 것은 부채꼴의 중심각이에요.'] : null], q.perm);
      steps = [{ say: '원 전체의 둘레를 구해요.', tex: '2 \\times \\pi \\times ' + r + ' = ' + piT(2 * r, 1, '') }, { say: '호의 길이가 둘레 가운데 얼마를 차지하는지 구해요.', tex: '\\dfrac{' + piT(k, 1, '') + '}{' + piT(2 * r, 1, '') + '} = \\dfrac{' + k / gcd(k, 2 * r) + '}{' + 2 * r / gcd(k, 2 * r) + '}' }, { say: '한 바퀴 $360^{\\circ}$에 그만큼을 곱해요.', tex: ans }];
      h2 = '호의 길이는 원의 둘레 가운데 중심각이 차지하는 만큼이에요. 거꾸로 생각하면, 호의 길이가 둘레의 몇 분의 몇인지 알면 중심각이 한 바퀴의 몇 분의 몇인지 알 수 있어요. 먼저 반지름 ' + cm(r) + '로 원 전체의 둘레를 구해요. 그다음 호의 길이를 둘레로 나눠서 분수로 나타내요. $\\pi$는 분자와 분모에 똑같이 있으니 약분되어 사라져요. 마지막으로 그 분수를 한 바퀴의 크기에 곱해요.';
    } else if (q.kind === 'prop') {
      var l1 = q.l1, t1 = q.t1, t2 = q.t2, l2 = l1 * t2 / t1;
      text = '한 원에서 중심각의 크기가 $' + deg(t1) + '$인 부채꼴의 호의 길이가 ' + cm(l1) + '예요. 같은 원에서 중심각의 크기가 $' + deg(t2) + '$인 부채꼴의 호의 길이를 고르세요.'; ans = plain(l2, CM);
      cands = mixc([[plain(l1, CM), 'same-length', '호의 길이가 그대로라고 봤어요. 중심각이 달라지면 호의 길이도 같은 비율로 달라져요.']], [
        isInt(l1 * t1 / t2) ? [plain(l1 * t1 / t2, CM), 'inverse', '거꾸로 계산했어요. 중심각이 커지면 호도 길어지고, 작아지면 호도 짧아져요(정비례).'] : null,
        [plain(l2 + l1, CM), 'added-once', '몇 배인지 셀 때 하나를 더 셌어요. 중심각이 몇 배인지 나눗셈으로 정확히 구해요.'],
        l2 - l1 > 0 && l2 - l1 !== l1 ? [plain(l2 - l1, CM), 'short-once', '늘어난 만큼만 답했어요. 처음 길이에 늘어난 만큼을 더해야 전체 호의 길이예요.'] : null], q.perm);
      steps = [{ say: '한 원에서 호의 길이는 중심각의 크기에 정비례해요. 중심각이 몇 배인지 구해요.', tex: deg(t2) + ' \\div ' + deg(t1) + ' = ' + (isInt(t2 / t1) ? t2 / t1 : '\\dfrac{' + t2 / gcd(t1, t2) + '}{' + t1 / gcd(t1, t2) + '}') }, { say: '호의 길이도 같은 배가 돼요.', tex: ans }];
      h2 = '같은 원에서는 중심각이 2배가 되면 호의 길이도 2배, 3배가 되면 호의 길이도 3배가 돼요. 피자 조각의 각을 두 배로 벌리면 테두리도 두 배로 길어지는 것과 같아요. 이런 관계를 정비례라고 해요. 먼저 중심각이 $' + deg(t1) + '$에서 $' + deg(t2) + '$로 몇 배가 되었는지 구해요. 큰 것을 작은 것으로 나누면 돼요. 그다음 처음 호의 길이 ' + cm(l1) + '에 같은 수를 곱해요. 중심각이 작아졌으면 호도 짧아져요.';
    } else {
      text = '반지름의 길이가 ' + cm(r) + '이고 호의 길이가 $' + piT(k, 1, CM) + '$인 부채꼴의 넓이를 고르세요.'; ans = piT(r * k, 2, CM2);
      cands = mixc([[piT(r * k, 1, CM2), 'not-halved', '2로 나누지 않았어요. 부채꼴의 넓이는 (반지름) × (호의 길이) ÷ 2예요. 삼각형의 넓이와 닮았어요.']], [
        [piT(r * r, 1, CM2), 'whole-circle', '원 전체의 넓이를 구했어요. 부채꼴은 원의 일부예요. (반지름) × (호의 길이) ÷ 2로 구해요.'],
        [piT(r * k, 4, CM2), 'quartered', '2로 두 번 나눴어요. (반지름) × (호의 길이)를 2로 한 번만 나눠요.'],
        [piT(r + k, 1, CM2), 'added', '반지름과 호의 길이를 더했어요. 넓이는 두 길이를 곱해서 구해요.']], q.perm);
      steps = [{ say: '부채꼴의 넓이는 (반지름) × (호의 길이) ÷ 2예요.', tex: '\\dfrac{1}{2} \\times ' + r + ' \\times ' + piT(k, 1, '') }, { say: '수끼리 곱하고 $\\pi$는 그대로 붙여요.', tex: ans }];
      h2 = '중심각을 몰라도 부채꼴의 넓이를 구할 수 있어요. 부채꼴을 아주 잘게 자르면 조각 하나하나가 가느다란 삼각형처럼 돼요. 그 삼각형의 높이는 반지름이고, 밑변을 모두 이으면 호의 길이가 돼요. 그래서 부채꼴의 넓이는 삼각형의 넓이처럼 (반지름) × (호의 길이) ÷ 2예요. 반지름 ' + cm(r) + '와 호의 길이를 곱한 다음 2로 나눠요. $\\pi$는 문자처럼 그대로 둬요.';
    }
    return finish({ text: text, figure: fig, ans: ans, cands: cands, steps: steps, hints: [C_KEY, h2, C_LAST] });
  };
  var okC = function (q) { var p = circleBuild(q); return !!p && p.check; };
  var TH = [30, 45, 60, 90, 120, 135, 150, 180, 240, 270];
  choiceQ({
    id: 'B23.circle', title: '원과 부채꼴', build: circleBuild,
    ids: ['area-formula', 'radius-only', 'diameter-doubled', 'pi-lost', 'circumference-formula', 'diameter-squared', 'not-squared', 'whole-circle', 'doubled-ratio', 'half-ratio', 'supplement', 'rest-angle', 'same-length', 'inverse', 'added-once', 'short-once', 'not-halved', 'quartered', 'added'],
    levels: [
      { name: '원의 둘레와 넓이', minDistinct: 36, vars: { q: sampler(function (r) { return until(function () { return { kind: 'circle', r: r.int(3, 12), dia: r.int(0, 1), ask: r.int(0, 1) ? 'len' : 'area', perm: perm6(r), o: order4(r) }; }, okC); }) } },
      { name: '부채꼴의 호의 길이와 넓이', minDistinct: 60, vars: { q: sampler(function (r) {
          return until(function () {
            var th = r.pick(TH), rr = r.int(2, 12), ask = r.int(0, 1) ? 'len' : 'area';
            return (ask === 'len' ? (2 * rr * th) % 360 : (rr * rr * th) % 360) !== 0 ? null : { kind: 'sector', r: rr, th: th, ask: ask, perm: perm6(r), o: order4(r) };
          }, okC);
        }) } },
      { name: '중심각 구하기 · 정비례 · 호의 길이로 넓이 구하기', minDistinct: 100, vars: { q: sampler(function (r) {
          return until(function () {
            var k = r.int(0, 2), rr = r.int(2, 12), kk = r.int(1, 12), t1, t2, l1;
            if (k === 0) return (180 * kk) % rr !== 0 || 180 * kk / rr >= 360 || 180 * kk / rr < 30 ? null : { kind: 'angle', r: rr, k: kk, perm: perm6(r), o: order4(r) };
            if (k === 1) { t1 = r.pick([20, 30, 40, 45, 60]); t2 = t1 * r.pick([2, 3, 4]) / r.pick([1, 1, 2]); l1 = r.int(2, 12); return t2 === t1 || t2 > 180 || !isInt(t2) || !isInt(l1 * t2 / t1) ? null : { kind: 'prop', t1: t1, t2: t2, l1: l1, perm: perm6(r), o: order4(r) }; }
            return (rr * kk) % 2 || kk >= 2 * rr ? null : { kind: 'half-rl', r: rr, k: kk, perm: perm6(r), o: order4(r) };
          }, okC);
        }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B23', [
  { title: '각, 맞꼭지각, 평행선', body: [
    '곧은 직선은 반 바퀴라서 $180^{\\circ}$(평각)예요. 두 직선이 만날 때 서로 마주 보는 각을 맞꼭지각이라 하고, 그 크기는 같아요.',
    { figure: { type: 'geo', h: 150, alt: '두 직선이 한 점에서 만난다. 마주 보는 두 각이 모두 50도이고, 그 옆의 각은 130도이다.', items: [['seg', 20, 75, 280, 75], ['seg', 211, 2, 89, 148], ['arc', 150, 75, 17, 0, 50], ['text', 180, 61, '50°'], ['arc', 150, 75, 17, 180, 230], ['text', 120, 89, '50°'], ['arc', 150, 75, 14, 50, 180], ['text', 128, 52, '130°']] } },
    '평행한 두 직선이 다른 직선과 만나면 같은 자리의 각(동위각)끼리, 엇갈린 자리의 각(엇각)끼리 크기가 같아요.',
    { figure: { type: 'geo', h: 160, alt: '평행한 두 직선 l, m을 한 직선이 가로지른다. 위쪽 교점의 오른쪽 위 각과 아래쪽 교점의 오른쪽 위 각은 동위각이라 둘 다 60도이고, 위쪽 교점의 왼쪽 아래 각도 엇각이라 60도이다.', items: [['seg', 20, 45, 272, 45], ['seg', 20, 115, 272, 115], ['seg', 193, 5, 107, 155], ['text', 286, 45, 'l'], ['text', 286, 115, 'm'], ['arc', 170, 45, 17, 0, 60], ['text', 199, 31, '60°'], ['arc', 130, 115, 17, 0, 60], ['text', 159, 101, '60°'], ['arc', 170, 45, 17, 180, 240], ['text', 141, 59, '60°']] } }
  ] },
  { title: '삼각형의 내각과 외각', body: [
    '삼각형의 세 내각의 크기를 더하면 언제나 $180^{\\circ}$예요.',
    { figure: { type: 'geo', h: 170, alt: '삼각형의 밑변을 오른쪽으로 길게 늘였다. 세 내각은 50도, 60도, 70도이고, 70도인 각 바깥의 외각은 110도이다.', items: [['poly', [40, 145, 200, 145, 150, 14]], ['seg', 200, 145, 280, 145], ['arc', 40, 145, 17, 0, 50], ['text', 70, 131, '50°'], ['arc', 150, 14, 17, 230, 291], ['text', 147, 47, '60°'], ['arc', 200, 145, 17, 111, 180], ['text', 174, 127, '70°'], ['arc', 200, 145, 15, 0, 111], ['text', 226, 120, '110°']] } },
    '한 변을 늘였을 때 바깥에 생기는 각이 외각이에요. 외각의 크기는 이웃하지 않는 두 내각의 합과 같아요. 위 그림에서 $50^{\\circ} + 60^{\\circ} = 110^{\\circ}$예요.',
    '두 변의 길이가 같은 이등변삼각형은 두 밑각의 크기가 같아요.'
  ] },
  { title: '다각형의 각과 대각선', body: [
    '변이 $n$개인 다각형은 한 꼭짓점에서 대각선을 그으면 삼각형 $(n - 2)$개로 나뉘어요.',
    { ex: [['180^{\\circ} \\times (n - 2)', '내각의 크기의 합'], ['360^{\\circ}', '외각의 크기의 합(언제나 같아요)'], ['n - 3', '한 꼭짓점에서 그을 수 있는 대각선의 개수'], ['\\dfrac{n(n - 3)}{2}', '대각선의 전체 개수']] },
    '정다각형은 각의 크기가 모두 같아요. 정육각형의 한 외각은 $360^{\\circ} \\div 6 = 60^{\\circ}$, 한 내각은 $180^{\\circ} - 60^{\\circ} = 120^{\\circ}$예요.'
  ] },
  { title: '사각형의 성질', body: [
    '사각형의 네 내각의 합은 $360^{\\circ}$예요. 마주 보는 두 쌍의 변이 각각 평행한 사각형이 평행사변형이에요.',
    { list: ['평행사변형: 마주 보는 변의 길이가 같고, 마주 보는 각의 크기가 같아요. 이웃한 두 각의 합은 $180^{\\circ}$이고, 두 대각선은 서로를 반으로 나눠요.', '직사각형: 네 각이 모두 직각이고, 두 대각선의 길이가 같아요.', '마름모: 네 변의 길이가 같고, 두 대각선이 직각으로 만나요.', '정사각형: 직사각형이면서 마름모예요.'] },
    '직사각형, 마름모, 정사각형은 모두 평행사변형이라서 평행사변형의 성질을 그대로 가져요.'
  ] },
  { title: '넓이', body: [
    '높이는 밑변에 직각으로 잰 길이예요. 비스듬한 변의 길이가 아니에요.',
    { figure: { type: 'geo', h: 170, alt: '평행사변형이 있다. 밑변은 8센티미터이고, 밑변에 직각으로 잰 높이는 5센티미터이다.', items: [['poly', [40, 140, 200, 140, 260, 35, 100, 35], true], ['seg', 100, 35, 100, 140, true], ['sq', 100, 140, 0], ['text', 120, 156, '8 cm'], ['text', 128, 90, '5 cm']] } },
    { ex: [['(\\text{밑변}) \\times (\\text{높이})', '평행사변형'], ['(\\text{밑변}) \\times (\\text{높이}) \\div 2', '삼각형'], ['(\\text{윗변} + \\text{아랫변}) \\times (\\text{높이}) \\div 2', '사다리꼴'], ['(\\text{대각선}) \\times (\\text{대각선}) \\div 2', '마름모']] }
  ] },
  { title: '원과 부채꼴', body: [
    '원의 둘레를 지름으로 나눈 수가 원주율 $\\pi$예요. 반지름이 $r$인 원의 둘레는 $2\\pi r$, 넓이는 $\\pi r^{2}$이에요.',
    { figure: { type: 'geo', h: 160, alt: '반지름이 6센티미터이고 중심각이 60도인 부채꼴이다.', items: [['sector', 95, 140, 120, 0, 60], ['arc', 95, 140, 18, 0, 60], ['text', 130, 120, '60°'], ['text', 155, 153, '6 cm']] } },
    '부채꼴은 원 전체의 (중심각) ÷ $360^{\\circ}$만큼이에요. 위 부채꼴은 원의 $\\dfrac{60}{360} = \\dfrac{1}{6}$이에요.',
    { ex: [['2\\pi \\times 6 \\times \\dfrac{1}{6} = 2\\pi', '호의 길이(cm)'], ['\\pi \\times 6^{2} \\times \\dfrac{1}{6} = 6\\pi', '넓이(cm²)']] }
  ] }
]);
