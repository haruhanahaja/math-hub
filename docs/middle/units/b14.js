/* B14 연립일차방정식 — 가감법, 대입법, 활용
   유형(쉬운 것부터): B14.pair 해인 순서쌍 고르기(보기 고르기) · B14.elim 가감법 · B14.subst 대입법
                     · B14.form 괄호 · 분수 · 소수 · A = B = C 꼴 · B14.param 상수 구하기 · B14.word 활용 (모두 키패드)
   답이 순서쌍이면 보기 고르기, 답이 수 하나(x 의 값, x + y 의 값, 상수, 개수 …)이면 키패드다.
   간단한 식은 { a, b, c } (a x + b y = c)로 다루고, 복잡한 식의 양쪽은 항의 목록이다:
     [계수, 'x' | 'y' | ''] · 묶음 ['g', 곱하는 수, [항 …]] · 분수 계수 ['q', 분자, 분모, 문자 | ''] · 소수 ['d', 10배 한 정수, 문자 | '']
   숫자는 해 (p, q) 에서 거꾸로 맞춰 항상 정수 해가 나온다. 계산은 모두 정수로 한다.
   검산: 답을 만든 계산(가감법)과 따로, 해를 원래 식에 넣어 양쪽이 같은지 본다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, body = A.body, order4 = A.order4, lcm = MH.lcm, gcd = MH.gcd, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var wj = function (w, pair) { return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!(q && ok(q)) && ++i < 120); return q; };
  var won = function (n) { return String(n).replace(/\B(?=(\d{3})+$)/g, ','); };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  /* 계수 × 넣은 값. 계수가 ±1 이면 곱셈 기호를 쓰지 않는다. mulL: 식의 맨 앞, mulR: + · − 뒤 */
  var mulL = function (c, v) { return c === 1 ? String(v) : c === -1 ? '-' + par(v) : c + ' \\times ' + par(v); };
  var mulR = function (c, v) { return abs(c) === 1 ? par(v) : abs(c) + ' \\times ' + par(v); };
  var XY = ['x', 'y'], NAME = ['첫째 식', '둘째 식'];

  /* ── 간단한 식 a x + b y = c ── */
  var std = function (a, b, c) { return { a: a, b: b, c: c }; };
  var stdTex = function (e, V) { V = V || XY; return poly([[e.a, V[0]], [e.b, V[1]]]) + ' = ' + e.c; };
  var cases = function (list) { return '\\begin{cases} ' + list.join(' \\\\ ') + ' \\end{cases}'; };
  var at = function (e, p, q) { return e.a * p + e.b * q; };
  var cramer = function (e1, e2) {
    var D = e1.a * e2.b - e2.a * e1.b, p, q;
    if (!D) return null;
    p = (e1.c * e2.b - e2.c * e1.b) / D; q = (e1.a * e2.c - e2.a * e1.c) / D;
    return isInt(p) && isInt(q) ? { p: p, q: q } : null;
  };
  var times = function (e, m) { return std(e.a * m, e.b * m, e.c * m); };
  /** 가감법으로 푼다 → { p, q, steps, c: 없애는 방법, W: 먼저 구하는 문자, U: 없애는 문자, wrongW: { 실수 id: W 의 틀린 값 } } */
  var elim = function (e1, e2, V) {
    V = V || XY;
    var s = cramer(e1, e2), pick = function (k) {
      var u1 = e1[k], u2 = e2[k], L;
      if (!u1 || !u2) return null;
      L = lcm(abs(u1), abs(u2));
      return { k: k, m1: L / abs(u1), m2: L / abs(u2), L: L, cost: (L / abs(u1) > 1 ? 1 : 0) + (L / abs(u2) > 1 ? 1 : 0), add: u1 * u2 < 0 };
    };
    var ca = pick('a'), cb = pick('b'), c = !ca ? cb : !cb ? ca : (cb.cost < ca.cost || (cb.cost === ca.cost && cb.L <= ca.L)) ? cb : ca;
    if (!s || !c) return null;
    var keep = c.k === 'a' ? 'b' : 'a', W = V[keep === 'a' ? 0 : 1], U = V[keep === 'a' ? 1 : 0], E1 = times(e1, c.m1), E2 = times(e2, c.m2), sg = c.add ? 1 : -1;
    /* 뺄 때는 남는 문자의 계수가 양수가 되는 쪽으로 뺀다(F1 − F2) */
    var back = !c.add && E1[keep] - E2[keep] < 0, F1 = back ? E2 : E1, F2 = back ? E1 : E2, raw = [c.m1 > 1 ? e1.c : E1.c, c.m2 > 1 ? e2.c : E2.c];
    if (back) raw.reverse();
    var Ac = F1[keep] + sg * F2[keep], C = F1.c + sg * F2.c, w = keep === 'a' ? s.p : s.q, u = keep === 'a' ? s.q : s.p, steps = [], opT = c.add ? ' + ' : ' - ', wrongW = {}, x;
    if (c.cost) steps.push({ say: '$' + U + '$의 계수의 크기를 같게 만들어요. ' + (c.m1 > 1 ? '첫째 식의 양쪽에 ' + c.m1 + pj(c.m1, '을/를') + ' 곱하고' : '첫째 식은 그대로 두고') + ', ' + (c.m2 > 1 ? '둘째 식의 양쪽에 ' + c.m2 + pj(c.m2, '을/를') + ' 곱해요.' : '둘째 식은 그대로 둬요.') + ' 오른쪽의 수에도 꼭 곱해요.', tex: cases([stdTex(E1, V), stdTex(E2, V)]) });
    steps.push({ say: c.add ? '$' + U + '$의 계수가 크기는 같고 부호가 반대예요. 두 식을 변끼리 더하면 $' + U + '$가 사라져요.' : '$' + U + '$의 계수가 같아요. ' + (back ? '둘째 식에서 첫째 식을' : '첫째 식에서 둘째 식을') + ' 변끼리 빼면 $' + U + '$가 사라져요. 빼는 식의 모든 항의 부호에 주의해요.',
      tex: poly([[F1[keep], W]]) + opT + (F2[keep] < 0 ? '(' + poly([[F2[keep], W]]) + ')' : poly([[F2[keep], W]])) + ' = ' + F1.c + opT + par(F2.c) });
    if (Ac !== 1) steps.push({ say: '양쪽을 각각 계산해요.', tex: poly([[Ac, W]]) + ' = ' + C });
    steps.push({ say: Ac === 1 ? '$' + W + '$의 값이 나왔어요.' : '양쪽을 $' + W + '$ 앞의 수 $' + Ac + '$' + pj(Ac, '으로/로') + ' 나눠요.', tex: W + ' = ' + w });
    steps.push({ say: '구한 값을 첫째 식에 넣어 $' + U + '$의 값을 구해요.', tex: keep === 'a' ? mulL(e1.a, w) + (e1.b < 0 ? ' - ' : ' + ') + body([e1.b, U]) + ' = ' + e1.c : poly([[e1.a, U]]) + (e1.b < 0 ? ' - ' : ' + ') + mulR(e1.b, w) + ' = ' + e1.c });
    steps.push({ say: '$' + U + '$의 값을 구해요.', tex: U + ' = ' + u });
    x = (F1.c - sg * F2.c) / Ac; if (isInt(x) && x !== w) wrongW['rhs-op'] = x;
    if (c.cost) { x = (raw[0] + sg * raw[1]) / Ac; if (isInt(x) && x !== w) wrongW['rhs-not-multiplied'] = x; }
    return { p: s.p, q: s.q, steps: steps, c: c, W: W, U: U, keep: keep, wrongW: wrongW, e1: e1, Ac: Ac };
  };
  /** 묻는 것(ask: 'x' | 'y' | 'sum')의 값과, 가감법의 실수가 그 값에 미치는 결과 */
  var asked = function (el, ask, V) {
    V = V || XY;
    var val = function (p, q) { return ask === 'sum' ? p + q : ask === V[0] ? p : q; }, wrong = {}, id, w, u, e = el.e1;
    wrong['other-variable'] = ask === 'sum' ? null : ask === V[0] ? el.q : el.p;
    for (id in el.wrongW) {
      w = el.wrongW[id]; u = el.keep === 'a' ? (e.c - e.a * w) / e.b : (e.c - e.b * w) / e.a;
      if (ask === el.W) wrong[id] = w; else if (isInt(u)) wrong[id] = el.keep === 'a' ? val(w, u) : val(u, w);
    }
    return { ans: val(el.p, el.q), wrong: wrong,
      text: ask === 'sum' ? '$' + V[0] + ' + ' + V[1] + '$의 값' : '$' + ask + '$의 값',
      last: { say: '묻는 것을 다시 확인하고 답해요.', tex: ask === 'sum' ? V[0] + ' + ' + V[1] + ' = ' + el.p + ' + ' + par(el.q) + ' = ' + (el.p + el.q) : ask + ' = ' + val(el.p, el.q) } };
  };
  var ELIM = '연립방정식은 문자가 둘이라 바로 풀 수 없어요. 그래서 문자 하나를 없애서 문자가 하나뿐인 방정식으로 바꿔요. 가감법은 두 식을 통째로 더하거나 빼서 없애는 방법이에요. 사과 2개와 배 1개가 2,500원, 사과 1개와 배 1개가 1,700원이라면, 두 장바구니를 빼서 사과 1개가 800원임을 아는 것과 같아요.';
  var coefNote = function (e1, e2, V) { return '두 식에서 같은 문자의 계수를 견줘요. $' + V[0] + '$의 계수는 차례로 $' + e1.a + '$, $' + e2.a + '$. $' + V[1] + '$의 계수는 차례로 $' + e1.b + '$, $' + e2.b + '$.'; };
  var elimHint2 = function (el, e1, e2, V) {
    var c = el.c;
    return coefNote(e1, e2, V || XY) + ' ' + (c.cost ? '크기가 같은 계수가 없으니 곱해서 맞춰요. $' + el.U + '$를 없애려면 ' + [c.m1 > 1 ? '첫째 식에 ' + c.m1 : '', c.m2 > 1 ? '둘째 식에 ' + c.m2 : ''].filter(Boolean).join(', ') + pj(c.m2 > 1 ? c.m2 : c.m1, '을/를') + ' 곱하면 돼요. 오른쪽의 수에도 빠짐없이 곱해요.'
      : '$' + el.U + '$의 계수의 크기가 이미 같아요. 곱할 필요 없이 바로 없앨 수 있어요.');
  };
  var ELIM3 = '① 없앨 문자의 계수의 크기를 같게 맞춰요. ② 그 계수의 부호가 같으면 두 식을 빼고, 다르면 더해요. 뺄 때는 빼는 식의 모든 항의 부호가 바뀌는 것에 주의해요. ③ 남은 문자의 값을 구해요. ④ 그 값을 처음 식 하나에 넣어 다른 문자의 값을 구해요. ⑤ 두 값을 다른 식에도 넣어 맞는지 확인하고, 문제에서 묻는 것을 답해요.';

  /* ── 복잡한 식의 양쪽 ── */
  var special = function (it) { return typeof it[0] === 'string'; };
  var sideTex = function (s) {
    var out = '';
    s.forEach(function (it, i) {
      var k = it[0], c = special(it) ? it[1] : it[0], b;
      if (k === 'g') b = (abs(c) === 1 ? '' : abs(c)) + '(' + poly(it[2]) + ')';
      else if (k === 'q') b = '\\dfrac{' + (abs(c) === 1 && it[3] ? '' : abs(c)) + it[3] + '}{' + it[2] + '}';
      else if (k === 'd') b = MH.decStr(abs(c), 1) + it[2];
      else b = body(it);
      out += (i ? (c < 0 ? ' - ' : ' + ') : (c < 0 ? '-' : '')) + b;
    });
    return out || '0';
  };
  var eqTex = function (e) { return sideTex(e.L) + ' = ' + sideTex(e.R); };
  /** 식 하나를 a x + b y = c 로 정리한다. f.firstOnly: 괄호의 첫 항에만 곱하는 실수, f.rhsKeep: 분모를 없앨 때 오른쪽에는 곱하지 않는 실수 */
  var norm = function (e, f) {
    f = f || {};
    var M = 1, a = 0, b = 0, c = 0, used = { g: false, q: false, d: false }, all = e.L.concat(e.R);
    all.forEach(function (it) { if (it[0] === 'q') M = lcm(M, it[2]); else if (it[0] === 'd') M = lcm(M, 10); });
    var add = function (coef, v, sign) { if (v === 'x') a += sign * coef; else if (v === 'y') b += sign * coef; else c -= sign * coef; };
    var side = function (s, sign, mult) {
      s.forEach(function (it) {
        if (it[0] === 'g') { used.g = true; it[2].forEach(function (t, i) { add((f.firstOnly && i > 0 ? 1 : it[1]) * t[0] * mult, t[1], sign); }); }
        else if (it[0] === 'q') { used.q = true; add(it[1] * mult / it[2], it[3], sign); }
        else if (it[0] === 'd') { used.d = true; add(it[1] * mult / 10, it[2], sign); }
        else add(it[0] * mult, it[1], sign);
      });
    };
    side(e.L, 1, M); side(e.R, -1, f.rhsKeep ? 1 : M);
    var g = gcd(gcd(abs(a), abs(b)), abs(c)) || 1, plain = e.L.length <= 2 && e.R.length === 1 && !all.some(special) && e.L.every(function (t) { return t[1]; }) && !e.R[0][1];
    if ((plain && g < 10) || f.firstOnly || f.rhsKeep || g === 1) g = 1;
    if (a < 0 && b <= 0 && g > 1) g = -g;
    return { e: std(a / g, b / g, c / g), M: M, used: used, plain: plain, reduced: abs(g) > 1 };
  };
  var holdsAt = function (e, p, q) { var n = norm(e); return at(n.e, p, q) === n.e.c; };

  /* ── 틀: 보기 고르기 / 수 하나 ── */
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var options = function (v) { var p = P(v), list = [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) {
      var p = P(v), all;
      if (!p || p.check !== true || p.wrong.length !== 3) return false;
      all = [p.ans].concat(p.wrong.map(function (w) { return w[0]; }));
      return all.every(function (x, i) { return all.indexOf(x) === i; });
    };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B14', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { text: p.text, tex: p.tex }; },
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
  /** build(q) → { text, tex, ans, unit, hints, steps, wrong: { 실수 id: 수 }, check }. o.kind: 'signed' | 'int' */
  var numQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var leak = function (p) { var a = String(abs(p.ans)); return p.ans > 0 && nums((p.tex || '') + ' ' + p.text.replace(/,/g, '')).indexOf(a) < 0 && nums(p.hints.join(' ').replace(/,/g, '')).indexOf(a) >= 0; };
    var where = function (v) { var p = P(v); return !!p && p.check === true && isInt(p.ans) && (o.kind === 'signed' || p.ans > 0) && !leak(p); };
    o.levels.forEach(function (lv) { lv.where = where; });
    var val = function (n) { return o.kind === 'signed' ? { n: n, p: 0 } : n; };
    MH.defineType({
      id: o.id, unit: 'B14', version: 1, title: o.title,
      answer: o.kind === 'signed' ? { kind: 'signed' } : { kind: 'int', common: false, suffix: function (v) { return P(v).unit || ''; } },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; return out; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v); return p.check === true && (o.kind === 'signed' ? ans.p === 0 && ans.n === p.ans : ans === p.ans); },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), x = p.wrong[m[0]], k, earlier = false;
            if (x === undefined || x === null || x === p.ans || !isInt(x) || (o.kind !== 'signed' && x < 0)) return null;
            /* 같은 틀린 값이 두 실수에 걸리면 앞의 실수만 쓴다 */
            for (k = 0; k < o.mistakes.length && o.mistakes[k][0] !== m[0]; k++) if (p.wrong[o.mistakes[k][0]] === x) earlier = true;
            return earlier ? null : val(x);
          },
          explain: function () { return m[1]; } };
      })
    });
  };
  var M_OTHER = ['other-variable', '다른 문자의 값을 답했어요. 값은 맞게 구했을 수 있어요. 문제에서 묻는 것이 $x$인지 $y$인지(또는 어느 쪽의 개수인지) 다시 확인해요.'];
  var M_RHSOP = ['rhs-op', '두 식을 더하거나 뺄 때 오른쪽의 수를 반대로 계산했어요. 왼쪽을 더했으면 오른쪽도 더하고, 왼쪽을 뺐으면 오른쪽도 빼요. 뺄 때는 음수의 부호에 주의해요.'];
  var M_RHSMUL = ['rhs-not-multiplied', '식에 수를 곱할 때 오른쪽의 수에는 곱하지 않았어요. 등식의 양쪽에 똑같이 곱해야 등식이 유지돼요. 왼쪽의 두 항과 오른쪽의 수 모두에 곱해요.'];

  /* ── B14.pair 해인 순서쌍 고르기 ─────────────────────── */
  var pairTex = function (p, q) { return '(' + p + ',\\ ' + q + ')'; };
  var showEq = function (d) { return d.y ? 'y = ' + poly([[d.m, 'x'], [d.k, '']]) : stdTex(d.e); };
  var plug = function (d, u, v) {
    if (d.y) return { ok: v === d.m * u + d.k, say: '왼쪽은 ' + v + ', 오른쪽은 $' + mulL(d.m, u) + (d.k ? (d.k < 0 ? ' - ' : ' + ') + abs(d.k) : '') + ' = ' + (d.m * u + d.k) + '$', tex: v + ' = ' + mulL(d.m, u) + (d.k ? (d.k < 0 ? ' - ' : ' + ') + abs(d.k) : '') };
    var L = at(d.e, u, v), t = mulL(d.e.a, u) + (d.e.b < 0 ? ' - ' : ' + ') + mulR(d.e.b, v);
    return { ok: L === d.e.c, say: '왼쪽은 $' + t + ' = ' + L + '$, 오른쪽은 ' + d.e.c, tex: t + ' = ' + d.e.c };
  };
  var pairBuild = function (q) {
    var ds = q.eqs, p = q.p, v = q.q, one = ds.length === 1, wrong = [], seen = [pairTex(p, v)], cands, solves = function (u, w) { return ds.every(function (d) { return plug(d, u, w).ok; }); };
    var why = function (u, w) {
      var r = ds.map(function (d) { return plug(d, u, w); }), bad = r[0].ok ? 1 : 0, head = '$x = ' + u + '$, $y = ' + w + '$' + pj(w, '을/를') + ' ';
      if (one) return head + '넣으면 ' + r[0].say + '. 양쪽이 달라서 해가 아니에요.';
      return head + (r[0].ok || r[1].ok ? NAME[1 - bad] + '에 넣으면 맞아요. 하지만 ' + NAME[bad] + '에 넣으면 ' + r[bad].say + '. 양쪽이 달라요. 두 식에 모두 맞아야 연립방정식의 해예요.' : NAME[0] + '에 넣으면 ' + r[0].say + '. 양쪽이 달라서 해가 아니에요.');
    };
    var e1 = one || !ds[0].y ? ds[0].e : std(-ds[0].m, 1, ds[0].k), e2 = one ? null : ds[1].y ? std(-ds[1].m, 1, ds[1].k) : ds[1].e, t = q.t;
    cands = one ? [[v, p, 'swapped'], [p, -v, 'sign'], [p + e1.b * t, v - e1.a * t + t, 'near'], [p + 1, v, 'near-2'], [p, v + 1, 'near-3']]
      : [[p + e1.b * t, v - e1.a * t, 'first-only'], [p + e2.b * t, v - e2.a * t, 'second-only'], [v, p, 'swapped'], [p + 1, v - 1, 'near'], [p - 1, v, 'near-2']];
    cands.forEach(function (c) {
      var s = pairTex(c[0], c[1]);
      if (wrong.length < 3 && seen.indexOf(s) < 0 && !solves(c[0], c[1]) && abs(c[0]) <= 15 && abs(c[1]) <= 15) { seen.push(s); wrong.push([s, c[2], why(c[0], c[1])]); }
    });
    return {
      text: one ? '다음 중 일차방정식의 해인 순서쌍 $(x,\\ y)$를 고르세요.' : '다음 중 연립방정식의 해인 순서쌍 $(x,\\ y)$를 고르세요.', tex: one ? showEq(ds[0]) : cases(ds.map(showEq)),
      ans: pairTex(p, v), wrong: wrong, check: solves(p, v),
      hints: [one ? '문자가 둘인 방정식의 해는 수 한 쌍이에요. $x$ 자리와 $y$ 자리에 각각 넣었을 때 양쪽이 같아지는 $x$, $y$의 값이에요. 순서쌍 $(x,\\ y)$는 앞의 수가 $x$, 뒤의 수가 $y$예요. 순서를 바꾸면 다른 쌍이에요.'
          : '연립방정식의 해는 두 식을 동시에 참이 되게 하는 $x$, $y$ 한 쌍이에요. 자물쇠가 둘 달린 문과 같아요. 열쇠가 두 자물쇠에 모두 맞아야 문이 열려요. 한 식에만 맞는 쌍은 해가 아니에요.',
        '보기의 순서쌍에서 앞의 수를 $x$ 자리에, 뒤의 수를 $y$ 자리에 넣어 왼쪽을 계산해요. 음수를 넣을 때는 괄호를 쳐서 곱해요. 계산한 값이 오른쪽과 같은지 봐요.',
        one ? '① 보기 하나를 골라 $x$, $y$ 자리에 넣어요. ② 왼쪽을 계산해서 오른쪽의 수와 견줘요. ③ 같으면 해, 다르면 해가 아니에요. $x$와 $y$의 자리를 바꿔 넣지 않도록 조심해요.'
          : '① 보기 하나를 골라 첫째 식에 넣어 봐요. ② 첫째 식에 맞지 않으면 바로 버려요. ③ 맞으면 둘째 식에도 넣어 봐요. ④ 두 식에 모두 맞는 쌍이 답이에요. 보기 가운데에는 한 식에만 맞는 쌍이 섞여 있어요.'],
      steps: ds.map(function (d, i) { return { say: (one ? '' : NAME[i] + '에 ') + '$x = ' + p + '$, $y = ' + v + '$' + pj(v, '을/를') + ' 넣으면 양쪽이 같아요.', tex: plug(d, p, v).tex }; }).concat([{ say: one ? '그래서 이 순서쌍이 해예요.' : '두 식에 모두 맞으니 이 순서쌍이 해예요.', tex: pairTex(p, v) }])
    };
  };
  var sysOf = function (r, lim, cm) {
    return until(function () {
      var p = nz(r, -lim, lim), v = nz(r, -lim, lim), a1 = nz(r, -cm, cm), b1 = nz(r, -cm, cm), a2 = nz(r, -cm, cm), b2 = nz(r, -cm, cm);
      return { p: p, q: v, e1: std(a1, b1, a1 * p + b1 * v), e2: std(a2, b2, a2 * p + b2 * v) };
    }, function (s) { return s.e1.a * s.e2.b !== s.e2.a * s.e1.b && abs(s.e1.c) <= 40 && abs(s.e2.c) <= 40 && s.e1.c !== 0 && s.e2.c !== 0 && s.p !== s.q; });
  };
  choiceQ({
    id: 'B14.pair', title: '해인 순서쌍 고르기', ids: ['swapped', 'sign', 'near', 'near-2', 'near-3', 'first-only', 'second-only'], build: pairBuild,
    levels: [
      { name: '일차방정식의 해', vars: { q: sampler(function (r) { var s = sysOf(r, 6, 5); return { eqs: [{ e: s.e1 }], p: s.p, q: s.q, t: pm(r, 1), o: order4(r) }; }) } },
      { name: '연립방정식의 해', vars: { q: sampler(function (r) { var s = sysOf(r, 6, 4); return { eqs: [{ e: s.e1 }, { e: s.e2 }], p: s.p, q: s.q, t: pm(r, 1), o: order4(r) }; }) } },
      { name: 'y = … 꼴이 섞인 연립방정식', vars: { q: sampler(function (r) {
          /* y = m x + k 와 다른 식이 같은 직선이면 해가 한 쌍으로 정해지지 않는다 → 다시 뽑는다 */
          return until(function () {
            var s = sysOf(r, 6, 4), m = nz(r, -4, 4), k = s.q - m * s.p, d = { y: true, m: m, k: k }, first = r.int(0, 1) === 1, e = first ? s.e2 : s.e1;
            return e.a + e.b * m === 0 ? null : { eqs: first ? [d, { e: e }] : [{ e: e }, d], p: s.p, q: s.q, t: pm(r, 1), o: order4(r) };
          }, function () { return true; });
        }) } }
    ]
  });

  /* ── B14.elim 가감법 ──────────────────────────────── */
  var elimBuild = function (q) {
    var el = elim(q.e1, q.e2), as;
    if (!el) return null;
    as = asked(el, q.ask);
    return {
      text: '연립방정식을 풀어 ' + as.text + '을 구하세요.', tex: cases([stdTex(q.e1), stdTex(q.e2)]), ans: as.ans, wrong: as.wrong, steps: el.steps.concat([as.last]),
      check: at(q.e1, el.p, el.q) === q.e1.c && at(q.e2, el.p, el.q) === q.e2.c && (q.cost === undefined || el.c.cost === q.cost),
      hints: [ELIM, elimHint2(el, q.e1, q.e2), ELIM3]
    };
  };
  var ASK = ['x', 'y', 'x', 'y', 'sum'];
  var elimQ = function (r, cost, lim, cm) {
    return until(function () { var s = sysOf(r, lim, cm); return { e1: s.e1, e2: s.e2, ask: r.pick(ASK), cost: cost }; }, function (q) { var p = elimBuild(q); return !!p && p.check; });
  };
  numQ({
    id: 'B14.elim', title: '가감법', kind: 'signed', build: elimBuild, mistakes: [M_OTHER, M_RHSOP, M_RHSMUL],
    levels: [
      { name: '바로 더하거나 빼기', vars: { q: sampler(function (r) { return elimQ(r, 0, 7, 5); }) } },
      { name: '한 식에 수를 곱하기', vars: { q: sampler(function (r) { return elimQ(r, 1, 7, 6); }) } },
      { name: '두 식에 모두 수를 곱하기', vars: { q: sampler(function (r) { return elimQ(r, 2, 6, 5); }) } }
    ]
  });

  /* ── B14.subst 대입법 ─────────────────────────────────
     v.q = { I: 따로 나와 있는 문자('x' | 'y'), m, k (I = m·O + k), e: 다른 식, both: [m2, k2](다른 식도 I = … 꼴), re: 첫 식을 I + … = … 로 내고 고쳐 쓴다, ask } */
  var SUBST = '대입법은 한 문자를 다른 문자의 식으로 바꿔 넣어서 문자를 하나로 줄이는 방법이에요. "$y$는 $2x + 1$과 같다"고 알려 줬다면, 다른 식의 $y$ 자리에 $2x + 1$을 통째로 넣으면 돼요. 영화표 1장이 팝콘 2개 값과 같다면, 영화표 대신 팝콘 2개로 바꿔 계산해도 되는 것과 같아요.';
  var substBuild = function (q) {
    var I = q.I, O = I === 'y' ? 'x' : 'y', m = q.m, k = q.k, isoT = I + ' = ' + poly([[m, O], [k, '']]), steps = [], wrong = {}, Ac, C, o, iv, cI, cO, subT, expT, e = q.e, t1, t2, p, v, ask = q.ask, val;
    if (q.both) {
      Ac = m - q.both[0]; C = q.both[1] - k; t2 = I + ' = ' + poly([[q.both[0], O], [q.both[1], '']]);
      if (!Ac || C % Ac) return null;
      o = C / Ac; subT = poly([[m, O], [k, '']]) + ' = ' + poly([[q.both[0], O], [q.both[1], '']]);
      steps.push({ say: '두 식 모두 $' + I + '$가 무엇과 같은지 알려 줘요. 같은 $' + I + '$이니 오른쪽의 두 식도 서로 같아요.', tex: subT });
      steps.push({ say: '문자가 있는 항은 왼쪽으로, 수는 오른쪽으로 이항해서 정리해요.', tex: poly([[Ac, O]]) + ' = ' + C });
      cI = 1;
    } else {
      cI = I === 'y' ? e.b : e.a; cO = I === 'y' ? e.a : e.b; Ac = cO + cI * m; C = e.c - cI * k; t2 = stdTex(e);
      if (!Ac || C % Ac) return null;
      o = C / Ac;
      var grp = (abs(cI) === 1 ? '' : abs(cI)) + '(' + poly([[m, O], [k, '']]) + ')';
      subT = (I === 'y' ? poly([[cO, O]]) + (cI < 0 ? ' - ' : ' + ') + grp : (cI < 0 ? '-' : '') + grp + (cO < 0 ? ' - ' : ' + ') + body([cO, O])) + ' = ' + e.c;
      expT = (I === 'y' ? poly([[cO, O], [cI * m, O], [cI * k, '']]) : poly([[cI * m, O], [cI * k, ''], [cO, O]])) + ' = ' + e.c;
      if (q.re) steps.push({ say: NAME[q.swap ? 1 : 0] + '을 $' + I + ' = \\cdots$ 꼴로 고쳐 써요. $' + I + '$만 왼쪽에 남기고 나머지를 이항해요.', tex: isoT });
      steps.push({ say: '$' + I + '$ 자리에 $' + poly([[m, O], [k, '']]) + '$' + (k ? pj(k, '을/를') : '를') + ' 통째로 넣어요. 괄호를 꼭 쳐요.', tex: subT });
      if (expT !== subT) steps.push({ say: '괄호를 풀어요. 괄호 앞의 수를 괄호 안의 모든 항에 곱해요.', tex: expT });
      steps.push({ say: '정리해요.', tex: poly([[Ac, O]]) + ' = ' + C });
      /* 괄호 없이 넣은 실수: 괄호 앞의 수를 첫 항에만 곱한다 */
      if (cI !== 1 && k) wrong['no-paren'] = (e.c - k) / Ac;
    }
    iv = m * o + k; p = I === 'y' ? o : iv; v = I === 'y' ? iv : o;
    if (Ac !== 1) steps.push({ say: '양쪽을 $' + O + '$ 앞의 수 $' + Ac + '$' + pj(Ac, '으로/로') + ' 나눠요.', tex: O + ' = ' + o });
    steps.push({ say: '구한 값을 $' + isoT + '$에 넣어 $' + I + '$의 값을 구해요.', tex: I + ' = ' + mulL(m, o) + (k ? (k < 0 ? ' - ' : ' + ') + abs(k) : '') + ' = ' + iv });
    val = function (ov, ivv) { var pp = I === 'y' ? ov : ivv, vv = I === 'y' ? ivv : ov; return ask === 'sum' ? pp + vv : ask === 'x' ? pp : vv; };
    if (wrong['no-paren'] !== undefined) wrong['no-paren'] = isInt(wrong['no-paren']) ? val(wrong['no-paren'], m * wrong['no-paren'] + k) : null;
    wrong['other-variable'] = ask === 'sum' ? null : ask === 'x' ? v : p;
    steps.push({ say: '묻는 것을 다시 확인하고 답해요.', tex: ask === 'sum' ? 'x + y = ' + p + ' + ' + par(v) + ' = ' + (p + v) : ask + ' = ' + (ask === 'x' ? p : v) });
    t1 = q.re ? stdTex(q.reE) : isoT;
    var first = I === 'y' ? std(-m, 1, k) : std(1, -m, k), second = q.both ? (I === 'y' ? std(-q.both[0], 1, q.both[1]) : std(1, -q.both[0], q.both[1])) : e;
    return {
      text: '연립방정식을 풀어 ' + (ask === 'sum' ? '$x + y$의 값' : '$' + ask + '$의 값') + '을 구하세요.', tex: cases(q.swap ? [t2, t1] : [t1, t2]), ans: val(o, iv), wrong: wrong, steps: steps,
      check: at(first, p, v) === first.c && at(second, p, v) === second.c && abs(p) <= 12 && abs(v) <= 12,
      hints: [SUBST,
        q.both ? '두 식의 왼쪽이 똑같이 $' + I + '$예요. 같은 것과 같은 두 식은 서로 같아요. 그래서 오른쪽끼리 등호로 이으면 $' + O + '$만 있는 방정식이 돼요.'
          : (q.re ? '이 문제에는 $' + I + ' = \\cdots$ 꼴의 식이 없어요. $' + I + '$의 계수가 1인 식을 골라 $' + I + '$만 왼쪽에 남기면 그런 꼴이 돼요. 그다음 ' : '') + '다른 식에서 $' + I + '$가 있는 자리를 찾아요. 그 자리에 $' + I + '$와 같은 식을 통째로 넣어요. $' + I + '$ 앞에 수나 −가 곱해져 있으면 꼭 괄호를 쳐서 넣어요. 괄호가 없으면 첫 항에만 곱해지는 실수가 생겨요.',
        '① 한 문자를 다른 문자의 식으로 바꿔 넣어요. ② 괄호를 풀고 정리해서 문자가 하나인 방정식을 풀어요. ③ 구한 값을 $' + I + ' = \\cdots$ 꼴의 식에 넣어 나머지 문자의 값을 구해요. ④ 두 값을 처음의 두 식에 넣어 맞는지 확인하고, 문제에서 묻는 것을 답해요.']
    };
  };
  var substQ = function (r, mode) {
    return until(function () {
      var I = r.pick(XY), p = nz(r, -7, 7), v = nz(r, -7, 7), o = I === 'y' ? p : v, iv = I === 'y' ? v : p, m = nz(r, -4, 4), k = iv - m * o, a = nz(r, -5, 5), b = nz(r, -5, 5), q, m2;
      q = { I: I, m: m, k: k, e: std(a, b, a * p + b * v), ask: r.pick(ASK), swap: mode > 0 && r.int(0, 1) === 1 };
      if (mode === 1 && r.int(0, 1)) { m2 = nz(r, -4, 4); q.both = [m2, iv - m2 * o]; if (m2 === m) return null; }
      if (mode === 2) { q.re = true; q.reE = I === 'y' ? std(-m, 1, k) : std(1, -m, k); if (!k) return null; }
      return q;
    }, function (q) { var p = substBuild(q); return !!p && p.check && abs(q.e.c) <= 40 && abs(q.k) <= 20 && (!q.both || abs(q.both[1]) <= 20); });
  };
  numQ({
    id: 'B14.subst', title: '대입법', kind: 'signed', build: substBuild,
    mistakes: [M_OTHER, ['no-paren', '식을 넣을 때 괄호를 치지 않아서, 앞의 수를 첫 항에만 곱했어요. $2y$의 $y$ 자리에 $x + 3$을 넣으면 $2(x + 3)$이에요. 2를 두 항 모두에 곱해 $2x + 6$이 돼요.']],
    levels: [
      { name: '한 식이 y = … 또는 x = … 꼴', vars: { q: sampler(function (r) { return substQ(r, 0); }) } },
      { name: '두 식이 모두 같은 꼴', vars: { q: sampler(function (r) { return substQ(r, 1); }) } },
      { name: '식을 고쳐 써서 대입하기', vars: { q: sampler(function (r) { return substQ(r, 2); }) } }
    ]
  });

  /* ── 복잡한 연립방정식을 정리해서 푼다(B14.form · B14.word 가 쓴다) ── */
  var pipeline = function (eqs, V) {
    var ns = eqs.map(function (e) { return norm(e); }), steps = [], el, how = [], used = { g: false, q: false, d: false };
    ns.forEach(function (n) { ['g', 'q', 'd'].forEach(function (k) { if (n.used[k]) used[k] = true; }); });
    if (used.q) how.push('분수가 있는 식은 양쪽에 분모의 최소공배수를 곱해요');
    if (used.d) how.push('소수가 있는 식은 양쪽에 10을 곱해요');
    if (used.g) how.push('괄호는 분배법칙으로 풀어요');
    if (!ns.every(function (n) { return n.plain && !n.reduced; })) {
      if (!ns.every(function (n) { return n.plain; })) how.push('문자가 있는 항은 왼쪽으로, 수는 오른쪽으로 모아요');
      if (ns.some(function (n) { return n.reduced; })) how.push('모든 항이 같은 수로 나누어떨어지면 그 수로 나눠서 간단히 해요');
      steps.push({ say: '두 식을 각각 간단한 꼴로 정리해요. ' + how.join('. ') + '.', tex: cases(ns.map(function (n) { return stdTex(n.e, V); })) });
    }
    el = elim(ns[0].e, ns[1].e, V);
    if (!el) return null;
    return { el: el, ns: ns, steps: steps.concat(el.steps), used: used, how: how };
  };
  /** 실수 f 를 저지른 채 정리해서 풀었을 때의 해(정수가 아니면 null) */
  var flawed = function (eqs, f) { var n = eqs.map(function (e) { return norm(e, f); }); return cramer(n[0].e, n[1].e); };

  /* ── B14.form 괄호 · 분수 · 소수 · A = B = C ─────────── */
  var FORM = '식이 복잡해 보여도 방법은 같아요. 먼저 두 식을 각각 "$ax + by = c$" 꼴로 깔끔하게 정리하고, 그다음 가감법이나 대입법으로 풀어요. 요리하기 전에 재료를 다듬는 것과 같아요. 괄호는 풀고, 분수와 소수는 양쪽에 알맞은 수를 곱해서 정수로 바꿔요.';
  var formBuild = function (q) {
    var eqs = q.eqs, pl = pipeline(eqs), as, wrong, w, texQ, head = [], h2;
    if (!pl) return null;
    as = asked(pl.el, q.ask); wrong = as.wrong;
    w = pl.used.g ? flawed(eqs, { firstOnly: 1 }) : null; if (w) wrong['paren-first-only'] = q.ask === 'sum' ? w.p + w.q : q.ask === 'x' ? w.p : w.q;
    w = pl.used.q || pl.used.d ? flawed(eqs, { rhsKeep: 1 }) : null; if (w) wrong['rhs-not-scaled'] = q.ask === 'sum' ? w.p + w.q : q.ask === 'x' ? w.p : w.q;
    if (q.chain) {
      /* A = B = C 꼴: eqs 는 [A = C, B = C] */
      texQ = sideTex(eqs[0].L) + ' = ' + sideTex(eqs[1].L) + ' = ' + sideTex(eqs[0].R);
      head.push({ say: '$A = B = C$ 꼴은 식 세 개가 모두 같다는 뜻이에요. 가장 간단한 식을 두 번 써서 두 식으로 나눠요.', tex: cases(eqs.map(eqTex)) });
      h2 = '이 문제는 등호가 두 개 이어진 $A = B = C$ 꼴이에요. 세 식이 모두 같으니 둘씩 짝지어 식 두 개를 만들 수 있어요. 가장 간단한 식(여기서는 맨 오른쪽)을 두 번 쓰면 계산이 쉬워요: (맨 왼쪽) = (맨 오른쪽), (가운데) = (맨 오른쪽).';
    } else {
      texQ = cases(eqs.map(eqTex));
      h2 = '두 식을 하나씩 정리해요. ' + pl.how.join('. ') + '.' + (pl.used.q || pl.used.d ? ' 분수나 소수를 없애려고 곱할 때는 왼쪽의 모든 항과 오른쪽에 똑같이 곱해요.' : '') + (pl.used.g ? ' 괄호 앞의 수는 괄호 안의 모든 항에 곱해요. 괄호 앞이 음수이면 부호도 함께 바뀌어요.' : '');
    }
    return {
      text: '연립방정식을 풀어 ' + as.text + '을 구하세요.', tex: texQ, ans: as.ans, wrong: wrong, steps: head.concat(pl.steps).concat([as.last]),
      check: eqs.every(function (e) { return holdsAt(e, pl.el.p, pl.el.q); }) && abs(pl.el.p) <= 12 && abs(pl.el.q) <= 12 && pl.ns.every(function (n) { return abs(n.e.a) <= 12 && abs(n.e.b) <= 12 && abs(n.e.c) <= 60 && n.e.a && n.e.b; }),
      hints: [FORM, h2, '① 두 식을 각각 $ax + by = c$ 꼴로 정리해요. ② 정리한 두 식에서 없애기 쉬운 문자를 골라요. 계수의 크기를 맞추고, 부호가 같으면 빼고 다르면 더해요. ③ 한 문자의 값을 구한 다음, 정리한 식에 넣어 다른 문자의 값을 구해요. ④ 묻는 것을 답해요.']
    };
  };
  var rhsItem = function (n, d) { var g = gcd(abs(n), d) || 1; return d / g === 1 ? [n / g, ''] : ['q', n / g, d / g, '']; };
  var formEq = function (r, kind, p, v) {
    var m, u, b, a, d1, d2, n1, n2, M, c;
    if (kind === 'paren') {
      m = pm(r, r.int(2, 5)); u = nz(r, -5, 5); b = nz(r, -5, 5);
      if (r.int(0, 1)) return { L: [['g', m, [[1, 'x'], [u, '']]], [b, 'y']], R: [[m * (p + u) + b * v, '']] };
      a = nz(r, -6, 6); return { L: [[a, 'x'], ['g', m, [[1, 'x'], [b, 'y']]]], R: [[a * p + m * (p + b * v), '']] };
    }
    if (kind === 'frac') {
      d1 = r.pick([2, 3, 4, 5, 6]); d2 = r.pick([2, 3, 4, 6]); n1 = pm(r, 1); n2 = pm(r, r.int(1, d2 > 2 ? 2 : 1)); M = lcm(d1, d2);
      if (d1 === d2 || gcd(abs(n2), d2) !== 1) return null;
      return { L: [['q', n1, d1, 'x'], ['q', n2, d2, 'y']], R: [rhsItem(n1 * p * (M / d1) + n2 * v * (M / d2), M)] };
    }
    if (kind === 'dec') { a = nz(r, -9, 9); b = nz(r, -9, 9); c = a * p + b * v; return c ? { L: [['d', a, 'x'], ['d', b, 'y']], R: [['d', c, '']] } : null; }
    a = nz(r, -5, 5); b = nz(r, -5, 5); return { L: [[a, 'x'], [b, 'y']], R: [[a * p + b * v, '']] };
  };
  var formQ = function (r, kinds) {
    return until(function () {
      var p = nz(r, -8, 8), v = nz(r, -8, 8), k = r.pick(kinds), e1 = formEq(r, k[0], p, v), e2 = formEq(r, k[1], p, v);
      return e1 && e2 ? { eqs: r.int(0, 1) ? [e1, e2] : [e2, e1], ask: r.pick(ASK) } : null;
    }, function (q) { var b = formBuild(q); return !!b && b.check; });
  };
  var chainQ = function (r) {
    return until(function () {
      var p = nz(r, -7, 7), v = nz(r, -7, 7), a1 = nz(r, -5, 5), b1 = nz(r, -5, 5), a2 = nz(r, -5, 5), b2 = nz(r, -5, 5), C = nz(r, -15, 20), k1 = C - a1 * p - b1 * v, k2 = C - a2 * p - b2 * v;
      var L1 = [[a1, 'x'], [b1, 'y']], L2 = [[a2, 'x'], [b2, 'y']];
      if (k1) L1.push([k1, '']); if (k2) L2.push([k2, '']);
      return abs(k1) <= 15 && abs(k2) <= 15 && (k1 || k2) ? { eqs: [{ L: L1, R: [[C, '']] }, { L: L2, R: [[C, '']] }], ask: r.pick(ASK), chain: true } : null;
    }, function (q) { var b = formBuild(q); return !!b && b.check; });
  };
  numQ({
    id: 'B14.form', title: '복잡한 연립방정식', kind: 'signed', build: formBuild,
    mistakes: [M_OTHER, ['paren-first-only', '괄호를 풀 때 괄호 앞의 수를 첫 항에만 곱했어요. $2(x + 3)$은 $2x + 3$이 아니라 $2x + 6$이에요. 괄호 안의 모든 항에 곱해요.'],
      ['rhs-not-scaled', '분수나 소수를 없애려고 곱할 때 오른쪽에는 곱하지 않았어요. 등식의 양쪽에 똑같이 곱해야 해요. 왼쪽의 모든 항과 오른쪽 모두에 곱해요.'], M_RHSOP, M_RHSMUL],
    levels: [
      { name: '괄호가 있는 식', vars: { q: sampler(function (r) { return formQ(r, [['paren', 'plain'], ['paren', 'paren']]); }) } },
      { name: '분수 · 소수 계수', vars: { q: sampler(function (r) { return formQ(r, [['frac', 'plain'], ['dec', 'plain'], ['frac', 'dec'], ['frac', 'paren']]); }) } },
      { name: 'A = B = C 꼴', vars: { q: sampler(chainQ) } }
    ]
  });

  /* ── B14.param 상수 구하기 ───────────────────────────── */
  var PARAM = '해는 두 식을 모두 참이 되게 하는 $x$, $y$의 값이에요. 그러니 해를 알고 있다면 식의 $x$, $y$ 자리에 그 값을 넣을 수 있어요. 넣고 나면 모르는 것은 상수(문자 $a$, $b$)뿐이라서, 상수를 구하는 방정식이 돼요. 열쇠를 알면 자물쇠의 모양을 거꾸로 알아낼 수 있는 것과 같아요.';
  /** 상수 a 가 든 식: where 'x'(a x + b y = c) | 'y'(b x + a y = c) | 'c'(b x + d y = a). other 는 a 가 아닌 계수들 */
  var aEq = function (where, n1, n2) { return where === 'x' ? 'ax' + (n1 < 0 ? ' - ' : ' + ') + body([n1, 'y']) + ' = ' + n2 : where === 'y' ? poly([[n1, 'x']]) + ' + ay = ' + n2 : poly([[n1, 'x'], [n2, 'y']]) + ' = a'; };
  var aSolve = function (where, n1, n2, p, v) {
    /* → { a, plugTex, steps } */
    var a, t;
    if (where === 'c') { a = n1 * p + n2 * v; return { a: a, steps: [{ say: '$a$가 든 식에 $x = ' + p + '$, $y = ' + v + '$' + pj(v, '을/를') + ' 넣어요.', tex: mulL(n1, p) + (n2 < 0 ? ' - ' : ' + ') + mulR(n2, v) + ' = a' }, { say: '왼쪽을 계산하면 $a$의 값이에요.', tex: 'a = ' + a }] }; }
    var mine = where === 'x' ? p : v, other = where === 'x' ? v : p, rest = n2 - n1 * other;
    if (!mine || rest % mine) return null;
    a = rest / mine;
    t = where === 'x' ? 'a \\times ' + par(p) + (n1 < 0 ? ' - ' : ' + ') + mulR(n1, v) + ' = ' + n2 : mulL(n1, p) + ' + a \\times ' + par(v) + ' = ' + n2;
    return { a: a, steps: [{ say: '$a$가 든 식에 $x = ' + p + '$, $y = ' + v + '$' + pj(v, '을/를') + ' 넣어요.', tex: t }, { say: '수끼리 계산하고, $a$가 있는 항만 왼쪽에 남겨요.', tex: poly([[mine, 'a']]) + ' = ' + rest }, { say: '$a$의 값을 구해요.', tex: 'a = ' + a }] };
  };
  var paramBuild = function (q) {
    var p = q.p, v = q.q, s, t, sw, wrong = {}, el, as, e1, e2, V = ['a', 'b'], o, Ac;
    if (q.kind === 'one') {
      s = aSolve(q.where, q.n1, q.n2, p, v); if (!s) return null;
      sw = aSolve(q.where, q.n1, q.n2, v, p); wrong['swapped-xy'] = sw ? sw.a : null;
      t = cases(q.first ? [aEq(q.where, q.n1, q.n2), stdTex(q.e)] : [stdTex(q.e), aEq(q.where, q.n1, q.n2)]);
      return {
        text: '연립방정식의 해가 $x = ' + p + '$, $y = ' + v + '$일 때, 상수 $a$의 값을 구하세요.', tex: t, ans: s.a, wrong: wrong, steps: s.steps, check: at(q.e, p, v) === q.e.c && s.a !== 0 && abs(s.a) <= 20,
        hints: [PARAM, '두 식 가운데 $a$가 들어 있는 식만 쓰면 돼요. 그 식의 $x$ 자리와 $y$ 자리에 문제에서 알려 준 값을 넣어요. $x$의 값과 $y$의 값을 서로 바꿔 넣지 않도록 조심해요. 음수를 넣을 때는 괄호를 쳐요.',
          '① $a$가 든 식을 골라요. ② $x$, $y$ 자리에 해를 넣어요. ③ 수끼리 계산하면 $a$만 남은 방정식이 돼요. ④ 그 방정식을 풀어 $a$를 구해요. $a$가 없는 다른 식은 해가 맞는지 확인하는 데 쓸 수 있어요.']
      };
    }
    if (q.kind === 'two') {
      /* a x + b y = c1, b x + sg·a y = c2 의 해가 (p, v) → p a + v b = c1, sg·v a + p b = c2 */
      e1 = std(p, v, q.c1); e2 = std(q.sg * v, p, q.c2); el = elim(e1, e2, V); if (!el) return null;
      as = asked(el, q.ask === 'x' ? 'a' : q.ask === 'y' ? 'b' : 'sum', V);
      return {
        text: '연립방정식의 해가 $x = ' + p + '$, $y = ' + v + '$일 때, 상수 ' + as.text + '을 구하세요.', tex: cases(['ax + by = ' + q.c1, 'bx ' + (q.sg > 0 ? '+' : '-') + ' ay = ' + q.c2]), ans: as.ans, wrong: as.wrong,
        steps: [{ say: '두 식의 $x$, $y$ 자리에 해를 넣어요. $a$, $b$에 대한 연립방정식이 생겨요.', tex: cases([stdTex(e1, V), stdTex(e2, V)]) }].concat(el.steps).concat([as.last]),
        check: at(e1, el.p, el.q) === q.c1 && at(e2, el.p, el.q) === q.c2 && el.p !== 0 && el.q !== 0 && abs(el.p) <= 9 && abs(el.q) <= 9 && el.c.cost <= 1,
        hints: [PARAM, '이번에는 두 식 모두에 상수가 들어 있어요. 두 식의 $x$ 자리와 $y$ 자리에 해를 넣으면, $a$와 $b$가 문자인 새 연립방정식이 생겨요. 둘째 식은 $b$가 $x$ 앞에, $a$가 $y$ 앞에 있으니 자리를 잘 보고 넣어요. 새 식은 $a$ 항을 앞에, $b$ 항을 뒤에 오게 정리해요.',
          '① 두 식에 해를 넣어 $a$, $b$에 대한 식 두 개를 만들어요. ② 그 연립방정식을 가감법으로 풀어요. 없앨 문자의 계수를 맞추고, 부호가 같으면 빼고 다르면 더해요. ③ $a$, $b$의 값을 구하고 문제에서 묻는 것을 답해요.']
      };
    }
    /* 조건: 해가 y = m x (또는 x = m y)를 만족한다. e 는 a 가 없는 식 */
    o = q.I === 'y' ? p : v; Ac = q.I === 'y' ? q.e.a + q.e.b * q.m : q.e.b + q.e.a * q.m;
    s = aSolve(q.where, q.n1, q.n2, p, v);
    if (!s || !Ac || (q.I === 'y' ? v !== q.m * p : p !== q.m * v)) return null;
    var O = q.I === 'y' ? 'x' : 'y', cond = q.I + ' = ' + poly([[q.m, O]]), cI = q.I === 'y' ? q.e.b : q.e.a, cO = q.I === 'y' ? q.e.a : q.e.b, mo = poly([[q.m, O]]);
    var subT = (q.I === 'y' ? poly([[cO, O]]) + (cI < 0 ? ' - ' : ' + ') + (abs(cI) === 1 ? '' : abs(cI) + ' \\times ') + (q.m < 0 ? '(' + mo + ')' : mo) : (cI < 0 ? '-' : '') + (abs(cI) === 1 ? '' : abs(cI) + ' \\times ') + (q.m < 0 ? '(' + mo + ')' : mo) + (cO < 0 ? ' - ' : ' + ') + body([cO, O])) + ' = ' + q.e.c;
    wrong['solution-value'] = q.I === 'y' ? p : v;
    return {
      text: '연립방정식의 해가 일차방정식 $' + cond + '$를 만족할 때, 상수 $a$의 값을 구하세요.', tex: cases(q.first ? [aEq(q.where, q.n1, q.n2), stdTex(q.e)] : [stdTex(q.e), aEq(q.where, q.n1, q.n2)]), ans: s.a, wrong: wrong,
      steps: [{ say: '$a$가 없는 식과 조건 $' + cond + '$로 먼저 해를 구해요. $' + q.I + '$ 자리에 조건의 식을 넣어요.', tex: subT }, { say: '곱셈을 하고 동류항끼리 정리해요.', tex: poly([[Ac, O]]) + ' = ' + q.e.c }, { say: '양쪽을 $' + O + '$ 앞의 수로 나눠 $' + O + '$의 값을 구해요.', tex: O + ' = ' + o },
        { say: '조건에 넣어 $' + q.I + '$의 값을 구해요.', tex: q.I + ' = ' + mulL(q.m, o) + ' = ' + (q.m * o) }].concat(s.steps),
      check: at(q.e, p, v) === q.e.c && s.a !== 0 && abs(s.a) <= 20 && Ac * o === q.e.c,
      hints: [PARAM, '$a$를 모르니 $a$가 든 식은 아직 쓸 수 없어요. 대신 해가 만족하는 식이 두 개 더 있어요: $a$가 없는 식과 조건 $' + cond + '$. 이 두 식만으로 먼저 $x$, $y$의 값을 구할 수 있어요. 조건이 "$' + q.I + '$는 ~와 같다" 꼴이니 대입법이 편해요.',
        '① $a$가 없는 식의 $' + q.I + '$ 자리에 조건의 식을 넣어 $' + O + '$의 값을 구해요. ② 조건에 넣어 $' + q.I + '$의 값도 구해요. ③ 구한 $x$, $y$의 값을 $a$가 든 식에 넣어요. ④ $a$만 남은 방정식을 풀어요.']
    };
  };
  var withA = function (r, p, v) {
    var where = r.pick(['x', 'y', 'c', 'x', 'y']), n1 = nz(r, -5, 5), n2, a = nz(r, -6, 6);
    if (where === 'c') return { where: where, n1: n1, n2: nz(r, -5, 5) };
    n2 = where === 'x' ? a * p + n1 * v : n1 * p + a * v;
    return { where: where, n1: n1, n2: n2 };
  };
  numQ({
    id: 'B14.param', title: '상수 구하기', kind: 'signed', build: paramBuild,
    mistakes: [['solution-value', '연립방정식의 해($x$ 또는 $y$의 값)를 답했어요. 해는 맞게 구했을 수 있어요. 문제에서 묻는 것은 상수 $a$예요. 구한 해를 $a$가 든 식에 넣어 $a$를 구해요.'], ['swapped-xy', '$x$의 값과 $y$의 값을 서로 바꿔 넣었어요. $x$ 자리에는 $x$의 값을, $y$ 자리에는 $y$의 값을 넣어요. 넣기 전에 어느 값이 어느 문자의 것인지 다시 확인해요.'], M_OTHER, M_RHSOP, M_RHSMUL],
    levels: [
      { name: '해가 주어졌을 때 상수 하나', vars: { q: sampler(function (r) {
          return until(function () {
            var p = nz(r, -6, 6), v = nz(r, -6, 6), w = withA(r, p, v), a = nz(r, -5, 5), b = nz(r, -5, 5);
            return { kind: 'one', p: p, q: v, where: w.where, n1: w.n1, n2: w.n2, e: std(a, b, a * p + b * v), first: r.int(0, 1) === 1 };
          }, function (q) { var b = paramBuild(q); return !!b && b.check && q.p !== q.q && abs(q.n2) <= 40 && abs(q.e.c) <= 40; });
        }) } },
      { name: '해가 주어졌을 때 상수 둘', vars: { q: sampler(function (r) {
          return until(function () {
            var p = nz(r, -5, 5), v = nz(r, -5, 5), a = nz(r, -6, 6), b = nz(r, -6, 6), sg = pm(r, 1);
            return { kind: 'two', p: p, q: v, sg: sg, c1: a * p + b * v, c2: b * p + sg * a * v, ask: r.pick(ASK) };
          }, function (q) { var b = paramBuild(q); return !!b && b.check && abs(q.p) !== abs(q.q) && abs(q.c1) <= 40 && abs(q.c2) <= 40; });
        }) } },
      { name: '해가 조건을 만족할 때', vars: { q: sampler(function (r) {
          return until(function () {
            var I = r.pick(XY), m = r.pick([-3, -2, -1, 2, 3, 4]), o = nz(r, -4, 4), p = I === 'y' ? o : m * o, v = I === 'y' ? m * o : o, w = withA(r, p, v), a = nz(r, -5, 5), b = nz(r, -5, 5);
            return { kind: 'cond', I: I, m: m, p: p, q: v, where: w.where, n1: w.n1, n2: w.n2, e: std(a, b, a * p + b * v), first: r.int(0, 1) === 1 };
          }, function (q) { var b = paramBuild(q); return !!b && b.check && abs(q.n2) <= 40 && abs(q.e.c) <= 40 && q.e.c !== 0; });
        }) } }
    ]
  });

  /* ── B14.word 활용 ────────────────────────────────── */
  var PLAN = '활용 문제는 네 걸음으로 풀어요. ① 모르는 것 두 가지를 $x$, $y$로 놓아요. ② 문장에서 "같다"는 관계를 두 개 찾아 식 두 개를 세워요. 보통 하나는 개수(또는 합)에 대한 식이고, 다른 하나는 값 · 다리 수 · 시간처럼 따져서 더한 것에 대한 식이에요. ③ 연립방정식을 풀어요. ④ 문제에서 묻는 것이 $x$인지 $y$인지 확인하고, 답이 말이 되는지(개수가 자연수인지) 따져요.';
  var BUY = [['사과', '배', '개'], ['연필', '지우개', '개'], ['빵', '우유', '개'], ['장미', '튤립', '송이'], ['과자', '사탕', '봉지']];
  var LEGS = [['닭', '토끼', 2, 4, '마리', '다리'], ['오리', '돼지', 2, 4, '마리', '다리'], ['자전거', '자동차', 2, 4, '대', '바퀴'], ['두발자전거', '세발자전거', 2, 3, '대', '바퀴']];
  var hm = function (half) { return (half >= 2 ? Math.floor(half / 2) + '시간' : '') + (half % 2 ? (half >= 2 ? ' ' : '') + '30분' : ''); };
  var wordBuild = function (q) {
    var eqs, text, unit, xn, yn, h2, th, ansOf = function (p, v) { return q.ask === 'x' ? p : v; }, extra = {}, pl, ans, t, sayXY;
    if (q.kind === 'buy') {
      th = BUY[q.t]; unit = th[2]; xn = th[0]; yn = th[1];
      eqs = [{ L: [[1, 'x'], [1, 'y']], R: [[q.N, '']] }, { L: [[q.pa, 'x'], [q.pb, 'y']], R: [[q.M, '']] }];
      text = '한 ' + unit + '에 ' + won(q.pa) + '원인 ' + xn + wj(xn, '과/와') + ' 한 ' + unit + '에 ' + won(q.pb) + '원인 ' + yn + wj(yn, '을/를') + ' 합해서 ' + q.N + unit + ' 샀더니 값이 모두 ' + won(q.M) + '원이었어요. ' + (q.ask === 'x' ? xn + wj(xn, '은/는') : yn + wj(yn, '은/는')) + ' 몇 ' + unit + ' 샀는지 구하세요.';
      sayXY = xn + wj(xn, '을/를') + ' $x$' + unit + ', ' + yn + wj(yn, '을/를') + ' $y$' + unit + ' 샀다고 해요.';
      h2 = sayXY + ' 첫째 식은 개수예요: 두 가지를 합한 개수가 문제에 나와 있어요. 둘째 식은 값이에요: (' + xn + ' 한 ' + unit + '의 값) × $x$와 (' + yn + ' 한 ' + unit + '의 값) × $y$를 더한 것이 전체 값이에요.';
    } else if (q.kind === 'ticket') {
      unit = '명'; xn = '어른'; yn = '어린이';
      eqs = [{ L: [[1, 'x'], [1, 'y']], R: [[q.N, '']] }, { L: [[q.pa, 'x'], [q.pb, 'y']], R: [[q.M, '']] }];
      text = '입장료가 어른은 ' + won(q.pa) + '원, 어린이는 ' + won(q.pb) + '원인 박물관에 어른과 어린이를 합해서 ' + q.N + '명이 들어갔더니 입장료가 모두 ' + won(q.M) + '원이었어요. ' + (q.ask === 'x' ? '어른은' : '어린이는') + ' 몇 명인지 구하세요.';
      sayXY = '어른을 $x$명, 어린이를 $y$명이라고 해요.';
      h2 = sayXY + ' 첫째 식은 사람 수예요: 어른과 어린이를 합한 수가 문제에 나와 있어요. 둘째 식은 입장료예요: (어른 한 명의 입장료) × $x$와 (어린이 한 명의 입장료) × $y$를 더한 것이 전체 입장료예요.';
    } else if (q.kind === 'legs') {
      th = LEGS[q.t]; unit = th[4]; xn = th[0]; yn = th[1];
      eqs = [{ L: [[1, 'x'], [1, 'y']], R: [[q.N, '']] }, { L: [[th[2], 'x'], [th[3], 'y']], R: [[q.M, '']] }];
      text = xn + wj(xn, '과/와') + ' ' + yn + wj(yn, '이/가') + ' 합해서 ' + q.N + unit + ' 있고, ' + th[5] + wj(th[5], '은/는') + ' 모두 ' + q.M + '개예요. ' + (th[5] === '다리' ? xn + ' 한 마리의 다리는 ' + th[2] + '개, ' + yn + ' 한 마리의 다리는 ' + th[3] + '개예요. ' : xn + ' 한 대의 바퀴는 ' + th[2] + '개, ' + yn + ' 한 대의 바퀴는 ' + th[3] + '개예요. ') + (q.ask === 'x' ? xn + wj(xn, '은/는') : yn + wj(yn, '은/는')) + ' 몇 ' + unit + '인지 구하세요.';
      sayXY = xn + wj(xn, '을/를') + ' $x$' + unit + ', ' + yn + wj(yn, '을/를') + ' $y$' + unit + '라고 해요.';
      h2 = sayXY + ' 첫째 식은 ' + unit + ' 수예요: 두 가지를 합한 수가 문제에 나와 있어요. 둘째 식은 ' + th[5] + '의 수예요: (' + xn + ' 하나의 ' + th[5] + ' 수) × $x$와 (' + yn + ' 하나의 ' + th[5] + ' 수) × $y$를 더한 것이 전체 ' + th[5] + ' 수예요.';
    } else if (q.kind === 'digits') {
      unit = ''; t = 9 * (q.b - q.a);
      eqs = [{ L: [[1, 'x'], [1, 'y']], R: [[q.a + q.b, '']] }, { L: [[10, 'y'], [1, 'x']], R: [[10, 'x'], [1, 'y'], [t, '']] }];
      text = '두 자리 자연수가 있어요. 십의 자리 숫자와 일의 자리 숫자의 합은 ' + (q.a + q.b) + '이고, 십의 자리 숫자와 일의 자리 숫자를 바꾼 수는 처음 수보다 ' + abs(t) + '만큼 ' + (t > 0 ? '커요' : '작아요') + '. 처음 수를 구하세요.';
      ansOf = function (p, v) { return 10 * p + v; }; extra['reversed-number'] = 10 * q.b + q.a; extra['digit-only'] = q.a;
      sayXY = '처음 수의 십의 자리 숫자를 $x$, 일의 자리 숫자를 $y$라고 해요.';
      h2 = sayXY + ' 그러면 처음 수는 $10x + y$예요(십의 자리 숫자는 10이 $x$개라는 뜻이에요). 자리를 바꾼 수는 $10y + x$예요. 첫째 식은 두 숫자의 합이고, 둘째 식은 "(바꾼 수) = (처음 수) ' + (t > 0 ? '+' : '−') + ' (차이)"예요.';
    } else if (q.kind === 'age') {
      unit = '살'; t = q.k * (q.c + q.n) - q.n;
      eqs = [{ L: [[1, 'x'], [1, 'y']], R: [[t + q.c, '']] }, { L: [[1, 'x'], [q.n, '']], R: [['g', q.k, [[1, 'y'], [q.n, '']]]] }];
      text = '현재 ' + q.who[0] + wj(q.who[0], '과/와') + ' ' + q.who[1] + '의 나이의 합은 ' + (t + q.c) + '살이고, ' + q.n + '년 후에는 ' + q.who[0] + '의 나이가 ' + q.who[1] + '의 나이의 ' + q.k + '배가 돼요. 현재 ' + (q.ask === 'x' ? q.who[0] : q.who[1]) + '의 나이를 구하세요.';
      extra['no-years-added'] = (t + q.c) % (q.k + 1) === 0 ? (q.ask === 'x' ? q.k : 1) * (t + q.c) / (q.k + 1) : null;
      sayXY = '현재 ' + q.who[0] + '의 나이를 $x$살, ' + q.who[1] + '의 나이를 $y$살이라고 해요.';
      h2 = sayXY + ' 첫째 식은 현재 나이의 합이에요. 둘째 식은 ' + q.n + '년 후의 일이에요. 그때는 두 사람 모두 ' + q.n + '살씩 더 먹어요. 그래서 (' + q.who[0] + '의 나이 + ' + q.n + ') = ' + q.k + ' × (' + q.who[1] + '의 나이 + ' + q.n + ')로 써요. 두 사람 모두에게 ' + q.n + pj(q.n, '을/를') + ' 더하는 것을 잊지 않아요.';
    } else if (q.kind === 'dist') {
      unit = 'km'; t = q.h1 + q.h2;
      eqs = [{ L: [[1, 'x'], [1, 'y']], R: [[q.u * q.h1 / 2 + q.v * q.h2 / 2, '']] }, { L: [['q', 1, q.u, 'x'], ['q', 1, q.v, 'y']], R: [rhsItem(t, 2)] }];
      text = '집에서 도서관까지 가는데, 처음에는 시속 ' + q.u + ' km로 자전거를 타고 가다가 도중에 자전거가 고장 나서 시속 ' + q.v + ' km로 걸어갔어요. 집에서 도서관까지의 거리는 ' + (q.u * q.h1 / 2 + q.v * q.h2 / 2) + ' km이고, 모두 ' + hm(t) + '이 걸렸어요. ' + (q.ask === 'x' ? '자전거를 타고 간' : '걸어간') + ' 거리는 몇 km인지 구하세요.';
      sayXY = '자전거를 타고 간 거리를 $x$ km, 걸어간 거리를 $y$ km라고 해요.';
      h2 = sayXY + ' 첫째 식은 거리예요: 두 거리를 더하면 전체 거리예요. 둘째 식은 시간이에요. 시간은 (거리) ÷ (속력)이니, 자전거를 탄 시간과 걸은 시간을 각각 분수로 쓰고 더하면 전체 시간이에요. 30분은 $\\dfrac{1}{2}$시간으로 고쳐요.';
    } else {
      th = BUY[q.t]; unit = '원'; xn = th[0]; yn = th[1];
      eqs = [{ L: [[q.n1, 'x'], [q.n2, 'y']], R: [[q.n1 * q.pa + q.n2 * q.pb, '']] }, { L: [[q.n3, 'x'], [q.n4, 'y']], R: [[q.n3 * q.pa + q.n4 * q.pb, '']] }];
      text = xn + ' ' + q.n1 + th[2] + wj(th[2], '과/와') + ' ' + yn + ' ' + q.n2 + th[2] + '의 값은 ' + won(q.n1 * q.pa + q.n2 * q.pb) + '원이고, ' + xn + ' ' + q.n3 + th[2] + wj(th[2], '과/와') + ' ' + yn + ' ' + q.n4 + th[2] + '의 값은 ' + won(q.n3 * q.pa + q.n4 * q.pb) + '원이에요. ' + (q.ask === 'x' ? xn : yn) + ' 한 ' + th[2] + '의 값은 얼마인지 구하세요.';
      sayXY = xn + ' 한 ' + th[2] + '의 값을 $x$원, ' + yn + ' 한 ' + th[2] + '의 값을 $y$원이라고 해요.';
      h2 = sayXY + ' 문장 하나가 식 하나예요. "' + xn + ' 몇 ' + th[2] + wj(th[2], '과/와') + ' ' + yn + ' 몇 ' + th[2] + '의 값"은 (개수) × $x$와 (개수) × $y$를 더한 것이에요. 두 번의 장보기를 각각 식으로 써요.';
    }
    pl = pipeline(eqs); if (!pl) return null;
    ans = ansOf(pl.el.p, pl.el.q);
    extra['other-variable'] = q.kind === 'digits' ? null : q.ask === 'x' ? pl.el.q : pl.el.p;
    return {
      text: text, ans: ans, unit: unit, wrong: extra,
      steps: [{ say: sayXY + ' 문장을 식 두 개로 옮겨요.', tex: cases(eqs.map(eqTex)) }].concat(pl.steps).concat([{ say: '묻는 것을 다시 확인하고 답해요.', tex: q.kind === 'digits' ? '10 \\times ' + pl.el.p + ' + ' + pl.el.q + ' = ' + ans : q.ask + ' = ' + ans }]),
      check: eqs.every(function (e) { return holdsAt(e, pl.el.p, pl.el.q); }) && pl.el.p > 0 && pl.el.q > 0 && pl.el.p !== pl.el.q && abs(pl.el.Ac) <= 12,
      hints: [PLAN, h2, '① 위에서 말로 세운 두 식을 숫자와 $x$, $y$로 옮겨 써요. ② 괄호나 분수가 있으면 먼저 정리해요. ③ 가감법으로 풀어요. 없앨 문자의 계수를 맞추고, 부호가 같으면 빼고 다르면 더해요. ④ $x$, $y$가 각각 무엇이었는지 다시 보고, 문제에서 묻는 쪽을 답해요.']
    };
  };
  var okW = function (q) { var b = wordBuild(q); return !!b && b.check; };
  var WHO = [['어머니', '딸'], ['아버지', '아들'], ['이모', '조카'], ['선생님', '학생']];
  var SPEED = [[12, 4], [16, 4], [12, 6], [10, 4], [14, 4], [18, 6]];
  numQ({
    id: 'B14.word', title: '연립방정식의 활용', kind: 'int', build: wordBuild,
    mistakes: [M_OTHER, ['reversed-number', '자리를 바꾼 수를 답했어요. 문제에서 묻는 것은 처음 수예요. 십의 자리 숫자가 $x$, 일의 자리 숫자가 $y$이면 처음 수는 $10x + y$예요.'],
      ['digit-only', '십의 자리 숫자만 답했어요. 구한 $x$, $y$는 각 자리의 숫자예요. 문제에서 묻는 것은 두 자리 수 전체($10x + y$)예요.'],
      ['no-years-added', '몇 년 후의 나이에 그 햇수를 더하지 않았어요. 시간이 지나면 두 사람 모두 나이를 먹어요. 두 사람의 나이에 똑같이 햇수를 더한 다음 배수 관계를 식으로 써요.']],
    levels: [
      { name: '개수와 값 · 다리 수', vars: { q: sampler(function (r) {
          return until(function () {
            var k = r.int(0, 2), x = r.int(2, 12), y = r.int(2, 12), pa, pb, t;
            if (k === 2) { t = r.int(0, LEGS.length - 1); return { kind: 'legs', t: t, N: x + y, M: LEGS[t][2] * x + LEGS[t][3] * y, ask: r.pick(XY) }; }
            pa = r.int(3, 20) * 100; pb = r.int(3, 20) * 100;
            if (k === 1) { pa = r.int(3, 9) * 1000; pb = r.int(1, 4) * 1000; return pa > pb ? { kind: 'ticket', N: x + y, pa: pa, pb: pb, M: pa * x + pb * y, ask: r.pick(XY) } : null; }
            return pa !== pb ? { kind: 'buy', t: r.int(0, BUY.length - 1), N: x + y, pa: pa, pb: pb, M: pa * x + pb * y, ask: r.pick(XY) } : null;
          }, okW);
        }) } },
      { name: '두 자리 수 · 나이', vars: { q: sampler(function (r) {
          return until(function () {
            var a, b, c, k, n;
            if (r.int(0, 1)) { a = r.int(1, 9); b = r.int(1, 9); return a !== b ? { kind: 'digits', a: a, b: b } : null; }
            c = r.int(5, 16); k = r.int(2, 4); n = r.int(2, 10);
            return k * (c + n) - n >= 28 && k * (c + n) - n <= 58 ? { kind: 'age', c: c, k: k, n: n, who: r.pick(WHO), ask: r.pick(XY) } : null;
          }, okW);
        }) } },
      { name: '거리와 시간 · 두 번의 장보기', vars: { q: sampler(function (r) {
          return until(function () {
            var s, h1, h2, pa, pb, n;
            if (r.int(0, 1)) { s = r.pick(SPEED); h1 = r.int(1, 4); h2 = r.int(1, 4); return { kind: 'dist', u: s[0], v: s[1], h1: h1, h2: h2, ask: r.pick(XY) }; }
            pa = r.int(3, 15) * 100; pb = r.int(3, 15) * 100; n = [r.int(1, 5), r.int(1, 5), r.int(1, 5), r.int(1, 5)];
            return pa !== pb && n[0] * n[3] !== n[1] * n[2] ? { kind: 'price', t: r.int(0, BUY.length - 1), pa: pa, pb: pb, n1: n[0], n2: n[1], n3: n[2], n4: n[3], ask: r.pick(XY) } : null;
          }, okW);
        }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B14', [
  { title: '문자가 둘인 방정식', body: [
    '$x + y = 5$처럼 문자가 둘인 일차방정식은 해가 하나로 정해지지 않아요. $x$, $y$가 자연수라면 해는 여러 쌍이에요.',
    { ex: [['(1,\\ 4)', '1 + 4 = 5'], ['(2,\\ 3)', '2 + 3 = 5'], ['(3,\\ 2)', '3 + 2 = 5'], ['(4,\\ 1)', '4 + 1 = 5']] },
    '해는 $x$의 값과 $y$의 값 한 쌍이고, 순서쌍 $(x,\\ y)$로 써요. 앞이 $x$, 뒤가 $y$예요.',
    '식이 하나 더 있으면 해가 한 쌍으로 정해져요. 이렇게 식 두 개를 한 묶음으로 본 것이 연립방정식이에요.'
  ] },
  { title: '연립방정식의 해', body: [
    '연립방정식의 해는 두 식을 동시에 참이 되게 하는 $x$, $y$ 한 쌍이에요. 자물쇠가 둘 달린 문처럼, 두 식에 모두 맞아야 해요.',
    { tex: '\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}' },
    '$(3,\\ 2)$를 넣으면 $3 + 2 = 5$, $3 - 2 = 1$로 두 식에 모두 맞아요. 그래서 해는 $x = 3$, $y = 2$예요.',
    '$(4,\\ 1)$은 첫째 식에는 맞지만 둘째 식에는 $4 - 1 = 3$이라 맞지 않아요. 해가 아니에요.'
  ] },
  { title: '가감법', body: [
    '두 식을 변끼리 더하거나 빼서 문자 하나를 없애는 방법이에요.',
    { list: ['① 없앨 문자의 계수의 크기를 같게 맞춰요(필요하면 식에 수를 곱해요).', '② 그 계수의 부호가 다르면 더하고, 같으면 빼요.', '③ 남은 문자의 값을 구하고, 처음 식에 넣어 나머지 값을 구해요.'] },
    { tex: '\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases} \\;\\Rightarrow\\; 3x = 9 \\;\\Rightarrow\\; x = 3,\\ y = 1' },
    '$y$의 계수가 $1$과 $-1$이라 더하면 $y$가 사라져요. 식에 수를 곱할 때는 오른쪽의 수에도 꼭 곱해요.'
  ] },
  { title: '대입법', body: [
    '한 식이 $y = \\cdots$ 또는 $x = \\cdots$ 꼴이면, 그 식을 다른 식에 통째로 넣는 방법이 편해요.',
    { tex: '\\begin{cases} y = 2x - 1 \\\\ 3x + 2y = 12 \\end{cases} \\;\\Rightarrow\\; 3x + 2(2x - 1) = 12' },
    '넣을 때는 꼭 괄호를 쳐요. $2y$의 $y$ 자리에 $2x - 1$을 넣으면 $2(2x - 1) = 4x - 2$예요.',
    { tex: '7x - 2 = 12 \\;\\Rightarrow\\; x = 2,\\quad y = 2 \\times 2 - 1 = 3' }
  ] },
  { title: '복잡한 식과 활용', body: [
    '괄호 · 분수 · 소수가 있으면 먼저 $ax + by = c$ 꼴로 정리해요. 분수는 분모의 최소공배수를, 소수는 10을 양쪽에 곱해요.',
    '$A = B = C$ 꼴은 $A = C$, $B = C$처럼 두 식으로 나눠서 풀어요.',
    '문장으로 된 문제는 모르는 것 두 가지를 $x$, $y$로 놓고, "같다"는 관계 두 개를 찾아 식을 세워요.',
    { ex: [['x + y = 10', '사과와 배를 합해서 10개'], ['800x + 1200y = 9600', '값이 모두 9,600원']] },
    '답을 구한 뒤에는 문제에서 묻는 것이 $x$인지 $y$인지 꼭 다시 확인해요.'
  ] }
]);
