/* B19 다항식의 곱셈 — 전개, 곱셈 공식
   유형(쉬운 것부터): B19.expand 분배법칙으로 전개하기 · B19.square 완전제곱식 (a ± b)² · B19.conj 합과 차의 곱 (a + b)(a − b)
                     · B19.xab (x + a)(x + b) 와 (ax + b)(cx + d) (여기까지 보기 고르기)
                     · B19.coef 계수 · 상수 구하기(키패드, 부호 있는 정수) · B19.apply 곱셈 공식의 활용(키패드, 자연수)
   답이 식이면 보기 고르기, 답이 수 하나이면 키패드다.
   식은 항의 목록으로 다룬다. 항 = { c: 정수 계수, e: { x: 2, y: 1 } }. 계산은 모두 정수로 한다.
   틀린 보기는 '흔한 실수 하나를 저지른 계산'을 실제로 해서 만든다.
   검산: 문제의 식과 답을 MH.alg.sameVal 로 견준다(문자에 두 가지 수를 넣어 값을 비교). 틀린 보기는 답 · 다른 보기와 값이 달라야 한다. */
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

  /* ── 항과 다항식 ── */
  var ORDER = ['a', 'b', 'x', 'y'];
  var T = function (c, e) { return { c: c, e: e || {} }; };
  var V = function (c, v) { var e = {}; if (v) e[v] = 1; return T(c, e); };
  var key = function (e) { return ORDER.filter(function (k) { return e[k]; }).map(function (k) { return k + (e[k] === 1 ? '' : '^{' + e[k] + '}'); }).join(''); };
  var deg = function (e) { return ORDER.reduce(function (s, k) { return s + (e[k] || 0); }, 0); };
  /** 차수가 높은 항부터, 같은 차수이면 앞 문자의 지수가 큰 항부터, 상수항은 맨 뒤 */
  var cmp = function (a, b) { var d = deg(b.e) - deg(a.e), i; for (i = 0; !d && i < ORDER.length; i++) d = (b.e[ORDER[i]] || 0) - (a.e[ORDER[i]] || 0); return d; };
  var mulT = function (a, b) { var e = {}; ORDER.forEach(function (k) { var x = (a.e[k] || 0) + (b.e[k] || 0); if (x) e[k] = x; }); return T(a.c * b.c, e); };
  var sq = function (t) { return mulT(t, t); };
  var neg = function (t) { return T(-t.c, t.e); };
  var mag = function (t) { return T(abs(t.c), t.e); };
  var ptex = function (ts) { return poly(ts.map(function (t) { return [t.c, key(t.e)]; })); };
  var one = function (t) { return ptex([t]); };
  /** 두 다항식의 곱을 곱한 차례대로 늘어놓는다(동류항은 아직 모으지 않는다) */
  var pmul = function (P, Q) { var out = []; P.forEach(function (a) { Q.forEach(function (b) { out.push(mulT(a, b)); }); }); return out; };
  var comb = function (ts) {
    var g = {}, ks = [];
    ts.forEach(function (t) { var k = key(t.e); if (!g[k]) { g[k] = T(0, t.e); ks.push(k); } g[k].c += t.c; });
    return ks.map(function (k) { return g[k]; }).filter(function (t) { return t.c !== 0; }).sort(cmp);
  };
  var bin = function (P) { return '(' + ptex(P) + ')'; };
  /** 제곱을 쓴다: x → x^{2}, 3 → 3^{2}, 2x → (2x)^{2}, -x → (-x)^{2} */
  var sqTex = function (t) { var s = one(t); return /^[a-z]$|^\d+$/.test(s) ? s + '^{2}' : '(' + s + ')^{2}'; };
  var wrap = function (t) { var s = one(t); return s.charAt(0) === '-' ? '(' + s + ')' : s; };

  /* ── 틀: 보기 고르기 ── */
  var texOf = function (x) { return typeof x === 'string' ? x : ptex(x); };
  /** 틀린 보기 후보의 차례: first 는 늘 앞에, rest 는 문제마다 섞은 차례(perm)로 */
  var mixc = function (first, rest, perm) {
    return first.concat(rest.map(function (c, i) { return [perm[i % perm.length], i, c]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }).map(function (x) { return x[2]; }));
  };
  /** 보기 고르기 문제를 마무리한다: 답의 글자, 글자도 값도 서로 다른 틀린 보기 3개(실수 id 는 한 번씩), 검산 */
  var finish = function (o) {
    var ans = texOf(o.ans), seen = [ans], wrong = [];
    o.cands.forEach(function (c) {
      var t;
      if (!c || !c[0] || wrong.length >= 3 || wrong.some(function (w) { return w[1] === c[1]; })) return;
      t = texOf(c[0]);
      if (t === '0' || t.length > 40 || seen.some(function (s) { return s === t || sameVal(s, t); })) return;
      seen.push(t); wrong.push([t, c[1], c[2]]);
    });
    return { tex: o.raw, text: o.text || '다음 식을 전개하세요.', ans: ans, wrong: wrong, hints: o.hints, steps: o.steps, check: wrong.length === 3 && ans.length <= 40 && sameVal(o.raw, ans) && o.ok !== false };
  };
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B19', version: 1, title: o.title,
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
  /* ── 틀: 수 하나(키패드). o.kind: 'int'(자연수) | 'signed'(부호 있는 정수)
     build(q) → { text, tex, ans: 정수, hints, steps, wrong: { 실수 id: 정수 }, check } ── */
  var numQ = function (o) {
    var lastQ = null, lastP = null, S = o.kind === 'signed';
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (n) { return S ? { n: n, p: 0 } : n; };
    var leak = function (p) { var a = String(p.ans); return p.ans > (S ? 0 : 19) && nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && (S ? p.ans !== 0 : p.ans >= 1) && p.check === true && !leak(p); }; });
    MH.defineType({
      id: o.id, unit: 'B19', version: 1, title: o.title,
      answer: { kind: o.kind },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { text: p.text, tex: p.tex }; },
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

  /* ── B19.expand 분배법칙으로 전개하기 ───────────────── */
  var EXP = '전개는 괄호를 풀어 하나의 다항식으로 만드는 것이에요. 두 모임이 만나 악수하는 장면을 떠올려 보세요. 앞 괄호의 사람들이 뒤 괄호의 사람들과 빠짐없이 한 번씩 악수해요. 앞에 2명, 뒤에 2명이면 악수는 모두 4번이에요. 곱셈도 똑같이, 앞 괄호의 각 항을 뒤 괄호의 모든 항에 한 번씩 곱해요.';
  var expBuild = function (q) {
    var P = q.A, Q = q.B, n = Q.length, prod = pmul(P, Q), ans = comb(prod), raw = bin(P) + bin(Q), last = prod.length - 1, cands, like = ans.length < prod.length;
    var flip = function (i) { return comb(prod.map(function (t, j) { return j === i ? neg(t) : t; })); };
    var cA = P[1], cB = Q[n - 1], bothNum = key(cA.e) === '' && key(cB.e) === '';
    cands = mixc([[comb([prod[0], prod[last]]), 'first-last', '앞의 항끼리, 뒤의 항끼리만 곱했어요. 앞 괄호의 각 항을 뒤 괄호의 모든 항에 곱해야 해요. 엇갈린 곱셈이 빠졌어요.']], [
      [flip(last), 'last-sign', '마지막 곱셈의 부호가 틀렸어요. 부호가 같은 두 수의 곱은 양수, 부호가 다른 두 수의 곱은 음수예요.'],
      [flip(n), 'cross-sign', '엇갈려 곱한 항의 부호가 틀렸어요. 각 항은 앞에 붙은 부호까지 함께 곱해요.'],
      [comb(prod.filter(function (t, j) { return j !== 1; })), 'one-missing', '곱셈을 한 번 빠뜨렸어요. 앞 괄호의 항 수와 뒤 괄호의 항 수를 곱한 만큼 곱셈을 해야 해요.'],
      bothNum && cA.c + cB.c !== 0 ? [comb(prod.slice(0, last).concat([T(cA.c + cB.c)])), 'const-added', '두 상수를 곱하지 않고 더했어요. 전개는 곱셈이에요. 상수끼리도 곱해요.'] : null,
      n === 3 ? [comb(prod.slice(0, n).concat([cA])), 'second-undistributed', '앞 괄호의 첫 항만 곱하고 둘째 항은 그대로 내려 썼어요. 둘째 항도 뒤 괄호의 모든 항에 곱해요.'] : null,
      n === 2 && deg(prod[0].e) === 2 && Object.keys(prod[0].e).length === 1 ? [[T(prod[0].c, P[0].e)].concat(comb(prod.slice(1))), 'no-square', '같은 문자끼리 곱했는데 제곱으로 쓰지 않았어요. $x \\times x = x^{2}$이에요.'] : null
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands,
      steps: [{ say: '앞 괄호의 각 항을 뒤 괄호의 모든 항에 한 번씩 곱해요. 곱셈은 모두 ' + prod.length + '번이에요.', tex: ptex(prod) }, { say: like ? '동류항끼리 모아서 정리해요.' : '동류항이 없어요. 차수가 높은 항부터 차례로 쓰면 답이에요.', tex: ptex(ans) }],
      hints: [EXP, '앞 괄호의 항은 ' + P.length + '개(' + P.map(function (t) { return '$' + one(t) + '$'; }).join(', ') + '), 뒤 괄호의 항은 ' + n + '개(' + Q.map(function (t) { return '$' + one(t) + '$'; }).join(', ') + ')예요. 그러니 곱셈은 모두 ' + prod.length + '번 해야 해요. 앞 괄호의 첫 항부터 뒤 괄호의 항들에 차례로 곱하고, 그다음 둘째 항을 똑같이 곱해요. 빼기 부호가 붙은 항은 음수로 생각하고 부호까지 함께 곱해요.',
        '① 앞 괄호의 첫 항을 뒤 괄호의 모든 항에 곱해요. ② 앞 괄호의 둘째 항도 뒤 괄호의 모든 항에 곱해요. ③ 곱한 횟수가 맞는지 세어 봐요. ④ 문자와 차수가 같은 동류항이 있으면 계수끼리 더해서 한 항으로 모아요.'] });
  };
  var okE = function (q) { var p = expBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B19.expand', title: '분배법칙으로 전개하기', ids: ['first-last', 'last-sign', 'cross-sign', 'one-missing', 'const-added', 'second-undistributed', 'no-square'], build: expBuild,
    levels: [
      { name: '(x + a)(y + b)', vars: { q: sampler(function (r) { return until(function () { var L = r.pick([['x', 'y'], ['a', 'b'], ['a', 'x'], ['b', 'y']]); return { A: [V(r.pick([1, 1, 2, 3]), L[0]), V(nz(r, -9, 9), '')], B: [V(r.pick([1, 1, 2]), L[1]), V(nz(r, -9, 9), '')], perm: perm6(r), o: order4(r) }; }, okE); }) } },
      { name: '(ax + by)(cx + dy)', vars: { q: sampler(function (r) {
          return until(function () { var p = r.int(1, 3), s = r.int(1, 3), m = nz(r, -5, 5), n = nz(r, -5, 5); return (p === s && abs(m) === abs(n)) || p * n + m * s === 0 ? null : { A: [V(p, 'x'), V(m, 'y')], B: [V(s, 'x'), V(n, 'y')], perm: perm6(r), o: order4(r) }; }, okE);
        }) } },
      { name: '(항 2개) × (항 3개)', vars: { q: sampler(function (r) {
          return until(function () { var p = r.pick([1, 1, 2]), m = nz(r, -5, 5), n = nz(r, -4, 4), s = nz(r, -6, 6); return p * s + m === 0 ? null : { A: [V(p, 'x'), V(m, '')], B: [V(1, 'x'), V(n, 'y'), V(s, '')], perm: perm6(r), o: order4(r) }; }, okE);
        }) } }
    ]
  });

  /* ── B19.square 완전제곱식 ──────────────────────── */
  var SQH = '한 변의 길이가 $a + b$인 정사각형을 그려 보세요. 가로와 세로를 각각 $a$와 $b$로 나누면 네 조각이 생겨요. 큰 정사각형(넓이 $a^{2}$) 하나, 작은 정사각형(넓이 $b^{2}$) 하나, 그리고 직사각형(넓이 $ab$) 두 개예요. 그래서 $(a + b)^{2} = a^{2} + 2ab + b^{2}$이에요. 가운데의 직사각형 두 개, 곧 $2ab$를 빠뜨리는 실수가 가장 많아요.';
  var sqBuild = function (q) {
    var f = V(q.neg ? -q.p : q.p, q.v1), g = V(q.s * q.q, q.v2), fg = mulT(f, g), raw = bin([f, g]) + '^{2}', ans = comb([sq(f), T(2 * fg.c, fg.e), sq(g)]), mid = T(2 * fg.c, fg.e), cands, minus = g.c < 0;
    cands = mixc([[[sq(f), sq(g)], 'no-middle', '가운데 항을 빠뜨렸어요. 제곱은 각 항만 제곱하는 것이 아니에요. 두 항을 곱한 것의 2배가 가운데에 꼭 들어가요.']], [
      [[sq(f), fg, sq(g)], 'middle-half', '가운데 항에 2를 곱하지 않았어요. 두 항의 곱은 두 번 나오니까 2배를 해요.'],
      fg.c < 0 ? [[sq(f), mid, neg(sq(g))], 'last-negative', '마지막 항의 부호가 틀렸어요. 마지막 항은 제곱한 것이라서 언제나 양수예요.'] : null,
      [[sq(f), neg(mid), sq(g)], 'middle-sign', '가운데 항의 부호가 틀렸어요. 가운데 항의 부호는 두 항을 곱한 것의 부호와 같아요.'],
      abs(f.c) > 1 ? [[T(abs(f.c), sq(f).e), mid, sq(g)], 'coef-not-squared', '문자만 제곱하고 계수는 제곱하지 않았어요. 앞의 항 전체를 제곱하니 계수도 함께 제곱해요.'] : null,
      q.v2 === '' && abs(g.c) !== 2 ? [[sq(f), mid, T(2 * abs(g.c))], 'last-doubled', '마지막 수를 제곱하지 않고 2배 했어요. 제곱은 같은 수를 두 번 곱하는 것이에요.'] : null,
      f.c < 0 ? [[neg(sq(f)), mid, sq(g)], 'neg-kept', '음수인 항을 제곱했는데 $-$ 부호를 남겼어요. 음수를 제곱하면 양수가 돼요.'] : null
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands,
      steps: [{ say: '공식 ' + (minus && !q.neg ? '$(a - b)^{2} = a^{2} - 2ab + b^{2}$' : '$(a + b)^{2} = a^{2} + 2ab + b^{2}$') + '에 맞춰 써요.' + (q.neg ? ' 앞의 항은 부호까지 통째로 $a$ 자리에 넣어요.' : ''),
          tex: minus && !q.neg ? sqTex(f) + ' - 2 \\times ' + wrap(f) + ' \\times ' + one(mag(g)) + ' + ' + sqTex(mag(g)) : sqTex(f) + ' + 2 \\times ' + wrap(f) + ' \\times ' + wrap(g) + ' + ' + sqTex(g) },
        { say: '제곱과 곱셈을 각각 계산해요.', tex: ptex(ans) }],
      hints: [SQH, '이 문제에서 공식의 $a$ 자리에 오는 것: $' + one(f) + '$. $b$ 자리에 오는 것: $' + one(mag(g)) + '$. ' + (minus ? '두 항 사이가 빼기이니 가운데 항만 빼기가 되고, 마지막 항은 제곱이라서 더하기예요. ' : '') + '항은 모두 세 개가 나와요. 앞의 항의 제곱, 두 항을 곱한 것의 2배, 뒤의 항의 제곱이에요.' + (abs(f.c) > 1 ? ' 앞의 항을 제곱할 때는 계수도 함께 제곱해요.' : ''),
        '① 앞의 항을 제곱해요(계수가 있으면 계수도 제곱). ② 두 항을 곱하고 2배 해요. 부호는 두 항 사이의 부호를 따라가요. ③ 뒤의 항을 제곱해요. 제곱은 언제나 양수예요. ④ 세 항을 차례로 써요.'] });
  };
  var okS = function (q) { var p = sqBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B19.square', title: '완전제곱식', ids: ['no-middle', 'middle-half', 'last-negative', 'middle-sign', 'coef-not-squared', 'last-doubled', 'neg-kept'], build: sqBuild,
    levels: [
      { name: '(x ± a)²', minDistinct: 30, vars: { q: sampler(function (r) { return until(function () { return { p: 1, v1: r.pick(['x', 'y']), q: r.int(1, 9), v2: '', s: pm(r, 1), neg: false, perm: perm6(r), o: order4(r) }; }, okS); }) } },
      { name: '(ax ± b)²', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return { p: r.int(2, 5), v1: r.pick(['x', 'y']), q: r.int(1, 7), v2: '', s: pm(r, 1), neg: false, perm: perm6(r), o: order4(r) }; }, okS); }) } },
      { name: '(ax ± by)² · 앞의 항이 음수인 식', minDistinct: 80, vars: { q: sampler(function (r) {
          return until(function () { return r.int(0, 1) ? { p: r.int(1, 4), v1: 'x', q: r.int(2, 5), v2: 'y', s: pm(r, 1), neg: false, perm: perm6(r), o: order4(r) } : { p: r.int(1, 3), v1: r.pick(['x', 'y']), q: r.int(1, 7), v2: '', s: pm(r, 1), neg: true, perm: perm6(r), o: order4(r) }; }, okS);
        }) } }
    ]
  });

  /* ── B19.conj 합과 차의 곱 ──────────────────────── */
  var CJ = '두 괄호가 한쪽은 더하기, 한쪽은 빼기이고 나머지는 똑같은 꼴이에요. 이런 식을 전개하면 가운데 항 두 개가 크기는 같고 부호만 반대라서 서로 지워져요. $(a + b)(a - b)$를 전개하면 $a^{2} - ab + ab - b^{2}$인데, $-ab$와 $+ab$가 사라지는 거예요. 그래서 제곱의 차 $a^{2} - b^{2}$만 남아요.';
  var cjBuild = function (q) {
    var f = V(q.f[0], q.f[1]), g = V(q.g[0], q.g[1]), F = q.form, P1, P2, same, diff, ans, cands, raw;
    if (F === 0) { P1 = [f, g]; P2 = [f, neg(g)]; }
    else if (F === 1) { P1 = [f, neg(g)]; P2 = [f, g]; }
    else if (F === 2) { P1 = [neg(f), g]; P2 = [neg(f), neg(g)]; }
    else if (F === 3) { P1 = [g, f]; P2 = [f, neg(g)]; }
    else if (F === 4) { P1 = [g, neg(f)]; P2 = [g, f]; }
    else { P1 = [neg(f), g]; P2 = [f, g]; }
    /* same: 두 괄호에서 부호가 같은 항, diff: 부호가 다른 항 */
    same = F === 4 || F === 5 ? g : F === 2 ? neg(f) : f; diff = F === 4 || F === 5 ? f : g;
    raw = bin(P1) + bin(P2); ans = [sq(same), neg(sq(diff))];
    var S = mag(same), D = mag(diff), sd = mulT(S, D);
    cands = mixc(F >= 3 ? [[[sq(D), neg(sq(S))], 'reversed', '빼는 차례가 바뀌었어요. 두 괄호에서 부호가 같은 항의 제곱이 앞에 오고, 부호가 다른 항의 제곱을 빼요.']] : [[[sq(S), sq(D)], 'plus', '제곱의 합으로 썼어요. 합과 차의 곱은 제곱의 차예요. 뒤의 항의 제곱은 빼요.']], [
      F >= 3 ? [[sq(S), sq(D)], 'plus', '제곱의 합으로 썼어요. 합과 차의 곱은 제곱의 차예요. 부호가 다른 항의 제곱은 빼요.'] : [[sq(D), neg(sq(S))], 'reversed', '빼는 차례가 바뀌었어요. 두 괄호에서 부호가 같은 항의 제곱이 앞에 오고, 부호가 다른 항의 제곱을 빼요.'],
      [comb([sq(S), T(-2 * sd.c, sd.e), sq(D)]), 'square-like', '완전제곱식의 공식을 썼어요. 두 괄호의 부호가 다르면 가운데 항은 서로 지워져서 남지 않아요.'],
      key(D.e) === '' && D.c > 1 ? [[sq(S), neg(D)], 'not-squared', '빼는 수를 제곱하지 않았어요. 두 항 모두 제곱한 다음에 빼요.'] : null,
      S.c > 1 && key(S.e) ? [[T(S.c, sq(S).e), neg(sq(D))], 'coef-not-squared', '문자만 제곱하고 계수는 제곱하지 않았어요. 항 전체를 제곱하니 계수도 함께 제곱해요.'] : D.c > 1 && key(D.e) ? [[sq(S), neg(T(D.c, sq(D).e))], 'coef-not-squared', '문자만 제곱하고 계수는 제곱하지 않았어요. 항 전체를 제곱하니 계수도 함께 제곱해요.'] : null,
      [comb([sq(S), T(2 * sd.c, sd.e), neg(sq(D))]), 'middle-kept', '가운데 항을 남겼어요. 엇갈려 곱한 두 항은 부호만 반대라서 서로 지워져요.']
    ], q.perm);
    return finish({ raw: raw, ans: ptex(ans), cands: cands,
      steps: [{ say: '두 괄호에서 부호가 같은 항과 부호가 다른 항을 찾아요. (부호가 같은 항의 제곱) − (부호가 다른 항의 제곱)으로 써요.', tex: sqTex(same) + ' - ' + sqTex(D) }, { say: '제곱을 각각 계산해요.', tex: ptex(ans) }],
      hints: [CJ, '두 괄호를 나란히 놓고 견줘 보세요. 두 괄호에서 부호가 같은 항: $' + one(same) + '$. 부호가 서로 다른 항: $' + one(D) + '$. ' + (F >= 2 ? '항의 차례가 바뀌어 있거나 앞에 $-$ 부호가 붙어 있어도, 부호가 같은 항과 다른 항만 찾으면 돼요. ' : '') + '부호가 같은 항의 제곱에서 부호가 다른 항의 제곱을 빼요. 가운데 항은 서로 지워져서 생기지 않아요.',
        '① 두 괄호에서 부호가 같은 항을 찾아 제곱해요. ② 부호가 다른 항을 찾아 제곱해요. 계수가 있으면 계수도 제곱해요. ③ 앞의 것에서 뒤의 것을 빼요. ④ 항이 두 개뿐인지 확인해요.'] });
  };
  var okC = function (q) { var p = cjBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B19.conj', title: '합과 차의 곱', ids: ['plus', 'reversed', 'square-like', 'not-squared', 'coef-not-squared', 'middle-kept'], build: cjBuild,
    levels: [
      { name: '(x + a)(x − a)', minDistinct: 40, vars: { q: sampler(function (r) { return until(function () { return { f: [1, r.pick(['x', 'a', 'y', 'b'])], g: [r.int(1, 9), ''], form: r.int(0, 1), perm: perm6(r), o: order4(r) }; }, okC); }) } },
      { name: '계수가 있는 식', minDistinct: 80, vars: { q: sampler(function (r) {
          return until(function () { return r.int(0, 1) ? { f: [r.int(2, 5), r.pick(['x', 'a'])], g: [r.int(1, 7), ''], form: r.int(0, 1), perm: perm6(r), o: order4(r) } : { f: [r.int(1, 4), 'x'], g: [r.int(2, 5), 'y'], form: r.int(0, 1), perm: perm6(r), o: order4(r) }; }, okC);
        }) } },
      { name: '항의 차례 · 부호가 바뀐 식', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return { f: [r.int(1, 3), r.pick(['x', 'a', 'y'])], g: [r.int(1, 9), ''], form: r.int(2, 5), perm: perm6(r), o: order4(r) }; }, okC); }) } }
    ]
  });

  /* ── B19.xab (x + a)(x + b) 와 (ax + b)(cx + d) ───── */
  var XAB = '$(x + a)(x + b)$를 전개하면 $x^{2} + bx + ax + ab$예요. 가운데의 $bx$와 $ax$는 동류항이라 하나로 모여요. 그래서 $x$의 계수는 두 수의 합 $a + b$, 상수항은 두 수의 곱 $ab$가 돼요. "가운데는 합, 끝은 곱"이라고 기억해요. 합과 곱의 자리를 바꾸는 실수가 많아요.';
  var xabBuild = function (q) {
    var p = q.p, a = q.a, s = q.r, b = q.b, x = { x: 1 }, x2 = { x: 2 }, P1 = [T(p, x), T(a)], P2 = [T(s, x), T(b)], raw = bin(P1) + bin(P2), ans = comb(pmul(P1, P2)), plain = p === 1 && s === 1, mid = p * b + a * s, cands;
    var Q3 = function (c2, c1, c0) { return [T(c2, x2), T(c1, x), T(c0)].filter(function (t) { return t.c !== 0; }); };
    if (plain) cands = mixc([[Q3(1, a * b, a + b), 'swapped', '합과 곱의 자리를 바꿨어요. $x$의 계수가 두 수의 합이고, 상수항이 두 수의 곱이에요.']], [
      [Q3(1, 0, a * b), 'no-middle', '가운데 항을 빠뜨렸어요. 엇갈려 곱한 두 항이 모여서 $x$의 항이 생겨요.'],
      [Q3(1, a + b, a + b), 'const-sum', '상수항도 두 수의 합으로 썼어요. 상수항은 두 수를 곱한 값이에요.'],
      [Q3(1, a + b, -a * b), 'product-sign', '상수항의 부호가 틀렸어요. 부호가 같은 두 수의 곱은 양수, 부호가 다른 두 수의 곱은 음수예요.'],
      [Q3(1, -(a + b), a * b), 'sum-sign', '$x$의 계수의 부호가 틀렸어요. 두 수를 부호까지 그대로 더해요.'],
      a * b < 0 ? [Q3(1, sgn(abs(a) > abs(b) ? a : b) * (abs(a) + abs(b)), a * b), 'abs-added', '부호가 다른 두 수를 더할 때 크기를 그냥 더했어요. 부호가 다르면 큰 쪽에서 작은 쪽을 빼요.'] : null
    ], q.perm);
    else cands = mixc([[Q3(p * s, p * b, a * b), 'middle-one', '엇갈린 곱셈을 한 번만 했어요. 바깥쪽 항끼리의 곱과 안쪽 항끼리의 곱을 모두 구해서 더해야 $x$의 계수가 돼요.']], [
      [Q3(p * s, 0, a * b), 'no-middle', '가운데 항을 빠뜨렸어요. 엇갈려 곱한 두 항이 모여서 $x$의 항이 생겨요.'],
      [Q3(p * s, a + b, a * b), 'plain-sum', '$x$의 계수를 두 상수의 합으로 썼어요. $x$ 앞에 계수가 있으면 그 계수까지 엇갈려 곱한 다음에 더해요.'],
      [Q3(p + s, mid, a * b), 'lead-added', '$x$의 계수끼리 곱하지 않고 더했어요. 첫 항은 두 계수의 곱에 $x^{2}$을 붙인 것이에요.'],
      [Q3(p * s, mid, -a * b), 'product-sign', '상수항의 부호가 틀렸어요. 부호가 같은 두 수의 곱은 양수, 부호가 다른 두 수의 곱은 음수예요.'],
      [Q3(p * s, p * b - a * s, a * b), 'cross-sign', '엇갈려 곱한 항 하나의 부호가 틀렸어요. 각 항은 앞에 붙은 부호까지 함께 곱해요.']
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands, ok: mid !== 0,
      steps: [plain ? { say: '$x$의 계수 자리에는 두 수의 합, 상수항 자리에는 두 수의 곱을 써요.', tex: 'x^{2} + (' + a + ' + ' + par(b) + ')x + ' + par(a) + ' \\times ' + par(b) }
          : { say: '첫 항은 $x$의 계수끼리의 곱, 가운데는 엇갈려 곱한 두 값의 합, 끝은 상수끼리의 곱이에요.', tex: '(' + p + ' \\times ' + s + ')x^{2} + (' + p + ' \\times ' + par(b) + ' + ' + par(a) + ' \\times ' + s + ')x + ' + par(a) + ' \\times ' + par(b) },
        { say: '괄호 안과 곱셈을 계산해요.', tex: ptex(ans) }],
      hints: [XAB, plain ? '두 괄호 안의 수는 $' + a + '$' + pj(a, '과/와') + ' $' + b + '$' + pj(b, '이에요/예요') + '. 빼기가 붙은 수는 음수로 봐요. $x$의 계수를 구하려면 이 두 수를 부호까지 그대로 더해요. 상수항을 구하려면 두 수를 곱해요. 곱할 때 부호가 같으면 양수, 다르면 음수가 돼요.'
          : '$x$ 앞에 계수가 있어서 "합과 곱"만으로는 안 돼요. 네 번의 곱셈을 차례로 해요. 앞끼리($' + one(P1[0]) + '$, $' + one(P2[0]) + '$), 바깥끼리($' + one(P1[0]) + '$, $' + b + '$), 안끼리($' + a + '$, $' + one(P2[0]) + '$), 뒤끼리($' + a + '$, $' + b + '$) 곱해요. 바깥끼리와 안끼리의 곱은 둘 다 $x$의 항이라서 하나로 모아요.',
        '① 첫 항: $x$가 든 항끼리 곱해요. ② 가운데 항: 엇갈려 곱한 두 항을 더해요(계수가 없으면 두 수의 합). ③ 마지막 항: 상수끼리 곱해요. ④ 부호를 하나씩 다시 확인해요.'] });
  };
  var okX = function (q) { var p = xabBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B19.xab', title: '(x + a)(x + b) 꼴의 전개', ids: ['swapped', 'no-middle', 'const-sum', 'product-sign', 'sum-sign', 'abs-added', 'middle-one', 'plain-sum', 'lead-added', 'cross-sign'], build: xabBuild,
    levels: [
      { name: '두 수가 모두 양수', minDistinct: 50, vars: { q: sampler(function (r) { return until(function () { var a = r.int(1, 9), b = r.int(1, 9); return a === b ? null : { p: 1, a: a, r: 1, b: b, perm: perm6(r), o: order4(r) }; }, okX); }) } },
      { name: '음수가 있는 식', minDistinct: 120, vars: { q: sampler(function (r) { return until(function () { var a = nz(r, -9, 9), b = nz(r, -9, 9); return abs(a) === abs(b) || (a > 0 && b > 0) ? null : { p: 1, a: a, r: 1, b: b, perm: perm6(r), o: order4(r) }; }, okX); }) } },
      { name: '(ax + b)(cx + d)', vars: { q: sampler(function (r) {
          return until(function () { var p = r.int(1, 4), s = r.int(1, 4), a = nz(r, -6, 6), b = nz(r, -6, 6); return (p === 1 && s === 1) || (p === s && abs(a) === abs(b)) ? null : { p: p, a: a, r: s, b: b, perm: perm6(r), o: order4(r) }; }, okX);
        }) } }
    ]
  });

  /* ── B19.coef 계수 · 상수 구하기 ─────────────────── */
  var coefBuild = function (q) {
    var a = q.a, b = q.b, p = q.p, s = q.r, x = { x: 1 }, tex, text, ans, wrong = {}, steps, h2, P1, P2, full, m, n;
    if (q.kind === 'xc' || q.kind === 'const') {
      P1 = [T(1, x), T(a)]; P2 = [T(1, x), T(b)]; tex = bin(P1) + bin(P2); full = comb(pmul(P1, P2));
      text = q.kind === 'xc' ? '다음 식을 전개했을 때, $x$의 계수를 구하세요.' : '다음 식을 전개했을 때, 상수항을 구하세요.';
      if (q.kind === 'xc') { ans = a + b; wrong['product-for-sum'] = a * b; wrong['abs-added'] = a * b < 0 ? sgn(abs(a) > abs(b) ? a : b) * (abs(a) + abs(b)) : null; }
      else { ans = a * b; wrong['sum-for-product'] = a + b; }
      steps = [{ say: '공식대로 써요. $x$의 계수는 두 수의 합, 상수항은 두 수의 곱이에요.', tex: tex + ' = x^{2} + (' + a + ' + ' + par(b) + ')x + ' + par(a) + ' \\times ' + par(b) }, { say: '합과 곱을 계산해요.', tex: tex + ' = ' + ptex(full) }, { say: q.kind === 'xc' ? '$x$ 앞의 수를 부호까지 읽어요.' : '문자가 없는 항을 부호까지 읽어요.', tex: String(ans) }];
      h2 = '괄호 안의 두 수는 $' + a + '$' + pj(a, '과/와') + ' $' + b + '$' + pj(b, '이에요/예요') + '. 빼기가 붙은 수는 음수예요. ' + (q.kind === 'xc' ? '$x$의 계수는 엇갈려 곱한 두 항이 모여서 생기니, 두 수를 부호까지 그대로 더하면 돼요. 곱하는 것이 아니에요.' : '상수항은 문자가 없는 항이에요. 괄호 안의 수끼리 곱할 때만 생기니, 두 수를 곱하면 돼요. 더하는 것이 아니에요. 부호가 다르면 음수가 돼요.');
    } else if (q.kind === 'find') {
      /* (x + a)(x + b) = x² + m x + n 에서 a */
      m = a + b; n = a * b; ans = a; tex = '(x + a)' + bin([T(1, x), T(b)]) + ' = ' + ptex([T(1, { x: 2 }), T(m, x), T(n)]); text = '다음 등식이 성립할 때, 상수 $a$의 값을 구하세요.';
      wrong.added = m + b; wrong.copied = m;
      steps = [{ say: '왼쪽을 공식대로 전개하면 $x$의 계수는 두 수의 합이에요.', tex: 'a + ' + par(b) + ' = ' + m }, { say: '$a$만 남기고 계산해요.', tex: 'a = ' + m + ' - ' + par(b) }, { say: '뺄셈을 계산해요.', tex: 'a = ' + ans }];
      h2 = '왼쪽을 전개하면 $x$의 계수는 괄호 안의 두 수 $a$와 $' + b + '$의 합이에요. 그런데 오른쪽을 보면 $x$의 계수가 $' + m + '$' + pj(m, '이에요/예요') + '. 그러니 $a$에 $' + b + '$' + pj(b, '을/를') + ' 더한 값이 $' + m + '$' + pj(m, '과/와') + ' 같다는 식을 세울 수 있어요. 이 식에서 $a$를 구해요. 구한 값으로 상수항(두 수의 곱)도 맞는지 확인해요.';
    } else if (q.kind === 'lin') {
      P1 = [T(p, x), T(a)]; P2 = [T(s, x), T(b)]; tex = bin(P1) + bin(P2); full = comb(pmul(P1, P2)); text = '다음 식을 전개했을 때, $x$의 계수를 구하세요.'; ans = p * b + a * s;
      wrong['outer-only'] = p * b; wrong['plain-sum'] = a + b; wrong['product-for-sum'] = a * b;
      steps = [{ say: '$x$의 항은 엇갈려 곱할 때 생겨요. 바깥끼리, 안끼리 곱해요.', tex: one(P1[0]) + ' \\times ' + par(b) + ' + ' + par(a) + ' \\times ' + one(P2[0]) }, { say: '두 곱을 더해요.', tex: ptex([T(p * b, x), T(a * s, x)]) + ' = ' + ptex([T(ans, x)]) }, { say: '$x$ 앞의 수를 부호까지 읽어요.', tex: String(ans) }];
      h2 = '식 전체를 전개하지 않아도 돼요. $x$의 항이 생기는 곱셈만 골라서 해요. 바깥끼리($' + one(P1[0]) + '$, $' + b + '$) 곱하면 $x$의 항이 하나, 안끼리($' + a + '$, $' + one(P2[0]) + '$) 곱하면 $x$의 항이 또 하나 생겨요. 이 두 항의 계수를 부호까지 더한 것이 답이에요. 한쪽만 구하고 멈추면 안 돼요.';
    } else {
      /* (x + k)² = x² + a x + k² 에서 a */
      ans = 2 * a; tex = bin([T(1, x), T(a)]) + '^{2} = x^{2} + ax + ' + a * a; text = '다음 등식이 성립할 때, 상수 $a$의 값을 구하세요.';
      wrong['no-double'] = a; wrong.squared = a * a;
      steps = [{ say: '왼쪽을 완전제곱식의 공식으로 전개해요.', tex: bin([T(1, x), T(a)]) + '^{2} = x^{2} + 2 \\times x \\times ' + par(a) + ' + ' + par(a) + '^{2}' }, { say: '가운데 항을 계산해서 $x$의 계수를 읽어요.', tex: 'a = 2 \\times ' + par(a) }, { say: '곱셈을 계산해요.', tex: 'a = ' + ans }];
      h2 = '오른쪽의 $ax$는 전개했을 때 가운데에 생기는 항이에요. 완전제곱식에서 가운데 항은 두 항을 곱한 것의 2배예요. 여기서 두 항은 $x$와 $' + a + '$' + pj(a, '이에요/예요') + '. 이 둘을 곱하고 2배 한 다음, $x$ 앞에 남는 수를 부호까지 읽어요. 괄호 안의 수를 그대로 답하지 않도록 조심해요.';
    }
    return { tex: tex, text: text, ans: ans, wrong: wrong, steps: steps, check: true,
      hints: [q.kind === 'sq' ? SQH : XAB, h2, '① 어떤 곱셈 공식의 꼴인지 살펴봐요. ② 구하려는 항이 어떤 곱셈에서 생기는지 생각해요($x$의 항은 엇갈린 곱, 상수항은 수끼리의 곱). ③ 부호까지 넣어서 계산해요. ④ 음수이면 $-$ 부호를 붙여서 답해요.'] };
  };
  numQ({
    id: 'B19.coef', title: '계수 · 상수 구하기', kind: 'signed', build: coefBuild,
    mistakes: [['product-for-sum', '두 수를 곱했어요. $x$의 계수는 엇갈려 곱한 두 항이 모인 것이라서, 두 수의 합이에요.'],
      ['sum-for-product', '두 수를 더했어요. 상수항은 괄호 안의 수끼리 곱해서 생기니, 두 수의 곱이에요.'],
      ['abs-added', '부호가 다른 두 수를 더할 때 크기를 그냥 더했어요. 부호가 다르면 큰 쪽에서 작은 쪽을 빼고, 큰 쪽의 부호를 붙여요.'],
      ['added', '빼야 할 것을 더했어요. $a$에 어떤 수를 더한 값이 $x$의 계수이니, $a$는 $x$의 계수에서 그 수를 뺀 값이에요.'],
      ['copied', '오른쪽의 $x$의 계수를 그대로 답했어요. $x$의 계수는 $a$ 하나가 아니라 괄호 안의 두 수를 더한 값이에요.'],
      ['outer-only', '바깥끼리만 곱했어요. 안끼리 곱해도 $x$의 항이 생기니, 두 곱을 더해야 해요.'],
      ['plain-sum', '두 상수를 그냥 더했어요. $x$ 앞에 계수가 있으면 그 계수와 엇갈려 곱한 다음에 더해요.'],
      ['no-double', '괄호 안의 수를 그대로 답했어요. 완전제곱식의 가운데 항은 두 항을 곱한 것의 2배예요.'],
      ['squared', '괄호 안의 수를 제곱했어요. 제곱한 수는 상수항이에요. $x$의 계수는 두 항을 곱한 것의 2배예요.']],
    levels: [
      { name: '(x + a)(x + b) 의 계수 · 상수항', minDistinct: 150, vars: { q: sampler(function (r) { var a, b; do { a = nz(r, -9, 9); b = nz(r, -9, 9); } while (a + b === 0 || a === b); return { kind: r.pick(['xc', 'xc', 'const']), a: a, b: b }; }) } },
      { name: '등식에서 상수 구하기', minDistinct: 150, vars: { q: sampler(function (r) { var a, b; do { a = nz(r, -9, 9); b = nz(r, -9, 9); } while (a + b === 0 || a === b); return { kind: 'find', a: a, b: b }; }) } },
      { name: '(ax + b)(cx + d) 의 계수 · 완전제곱식의 상수', minDistinct: 150, vars: { q: sampler(function (r) {
          var p, s, a, b;
          if (r.int(0, 3) === 0) return { kind: 'sq', a: nz(r, -9, 9) };
          do { p = r.int(1, 5); s = r.int(1, 5); a = nz(r, -7, 7); b = nz(r, -7, 7); } while ((p === 1 && s === 1) || p * b + a * s === 0);
          return { kind: 'lin', p: p, r: s, a: a, b: b };
        }) } }
    ]
  });

  /* ── B19.apply 곱셈 공식의 활용 ──────────────────── */
  var APN = '곱셈 공식은 수의 계산을 빠르게 해 줘요. 어려운 수를 "계산하기 쉬운 수 ± 작은 수"로 쪼개는 것이 요령이에요. 예를 들어 $51$은 $50 + 1$, $49$는 $50 - 1$로 볼 수 있어요. 그러면 $51^{2}$은 완전제곱식 공식으로, $51 \\times 49$는 합과 차의 곱 공식으로 암산하듯 계산할 수 있어요.';
  var APV = '$x$와 $y$의 값을 따로 몰라도 돼요. 곱셈 공식을 거꾸로 보면 길이 보여요. $(x + y)^{2} = x^{2} + 2xy + y^{2}$에서 $2xy$를 옮기면 $x^{2} + y^{2} = (x + y)^{2} - 2xy$예요. 마찬가지로 $(x - y)^{2} = x^{2} - 2xy + y^{2}$에서 $x^{2} + y^{2} = (x - y)^{2} + 2xy$예요. 주어진 합(또는 차)과 곱을 이 식에 넣기만 하면 돼요.';
  var applyBuild = function (q) {
    var Bs = q.B, k = q.k, j = q.j, tex, text, ans, wrong = {}, steps, hints, s = q.s, p = q.p, a = q.a, b = q.b, m = q.m, n = q.n, sq2;
    var LAST3 = '① 문제의 식이 어떤 곱셈 공식의 꼴인지 찾아요. ② 공식의 문자 자리에 문제의 수를 넣어요. ③ 제곱과 곱셈을 먼저 계산해요. ④ 더하고 빼서 마무리하고, 부호를 다시 확인해요.';
    if (q.kind === 'sq') {
      /* (B ± k)² */
      n = Bs + s * k; ans = n * n; tex = n + '^{2}'; text = '곱셈 공식을 이용하여 계산하세요.';
      wrong['no-middle'] = Bs * Bs + k * k; wrong['middle-half'] = Bs * Bs + s * Bs * k + k * k; wrong['last-negative'] = s < 0 ? Bs * Bs - 2 * Bs * k - k * k : null;
      steps = [{ say: '$' + n + '$' + pj(n, '을/를') + ' 계산하기 쉬운 수로 쪼개서 완전제곱식 공식을 써요.', tex: n + '^{2} = (' + Bs + (s < 0 ? ' - ' : ' + ') + k + ')^{2} = ' + Bs + '^{2}' + (s < 0 ? ' - ' : ' + ') + '2 \\times ' + Bs + ' \\times ' + k + ' + ' + k + '^{2}' }, { say: '제곱과 곱셈을 계산해요.', tex: Bs * Bs + (s < 0 ? ' - ' : ' + ') + 2 * Bs * k + ' + ' + k * k }, { say: '차례로 더하고 빼요.', tex: String(ans) }];
      hints = [APN, '$' + n + '$' + pj(n, '은/는') + ' $' + Bs + (s < 0 ? ' - ' : ' + ') + k + '$' + pj(k, '으로/로') + ' 볼 수 있어요. 그러면 $(' + Bs + (s < 0 ? ' - ' : ' + ') + k + ')^{2}$을 완전제곱식 공식으로 전개하면 돼요. 항은 세 개예요. $' + Bs + '$의 제곱, 두 수 $' + Bs + '$' + pj(Bs, '과/와') + ' $' + k + '$' + pj(k, '을/를') + ' 곱한 것의 2배, $' + k + '$의 제곱이에요.' + (s < 0 ? ' 빼기이니 가운데 항만 빼고, 마지막 제곱은 더해요.' : ' 가운데 항을 빠뜨리지 않도록 조심해요.'), LAST3];
    } else if (q.kind === 'conj') {
      ans = Bs * Bs - k * k; tex = (Bs + k) + ' \\times ' + (Bs - k); text = '곱셈 공식을 이용하여 계산하세요.';
      wrong.plus = Bs * Bs + k * k; wrong['not-squared'] = k > 1 ? Bs * Bs - k : null; wrong['square-like'] = Bs * Bs - 2 * Bs * k + k * k;
      steps = [{ say: '두 수를 같은 수에 더하고 뺀 꼴로 쪼개서 합과 차의 곱 공식을 써요.', tex: tex + ' = (' + Bs + ' + ' + k + ')(' + Bs + ' - ' + k + ') = ' + Bs + '^{2} - ' + k + '^{2}' }, { say: '제곱을 각각 계산해요.', tex: Bs * Bs + ' - ' + k * k }, { say: '뺄셈을 계산해요.', tex: String(ans) }];
      hints = [APN, '두 수 $' + (Bs + k) + '$' + pj(Bs + k, '과/와') + ' $' + (Bs - k) + '$' + pj(Bs - k, '은/는') + ' 한가운데 수 $' + Bs + '$에서 똑같이 $' + k + '$만큼 떨어져 있어요. 그래서 $(' + Bs + ' + ' + k + ')(' + Bs + ' - ' + k + ')$' + pj(k, '으로/로') + ' 쓸 수 있어요. 합과 차의 곱은 제곱의 차예요. 가운데 수의 제곱에서 떨어진 거리의 제곱을 빼요. 가운데 항은 생기지 않아요.', LAST3];
    } else if (q.kind === 'xab') {
      ans = (Bs + j) * (Bs + k); tex = (Bs + j) + ' \\times ' + (Bs + k); text = '곱셈 공식을 이용하여 계산하세요.';
      wrong['no-middle'] = Bs * Bs + j * k; wrong['const-sum'] = Bs * Bs + (j + k) * Bs + (j + k); wrong.swapped = Bs * Bs + j * k * Bs + (j + k);
      steps = [{ say: '두 수를 같은 수에 작은 수를 더한 꼴로 쪼개서 $(x + a)(x + b)$ 공식을 써요.', tex: tex + ' = (' + Bs + ' + ' + j + ')(' + Bs + ' + ' + k + ') = ' + Bs + '^{2} + (' + j + ' + ' + k + ') \\times ' + Bs + ' + ' + j + ' \\times ' + k }, { say: '제곱과 곱셈을 계산해요.', tex: Bs * Bs + ' + ' + (j + k) * Bs + ' + ' + j * k }, { say: '차례로 더해요.', tex: String(ans) }];
      hints = [APN, '두 수를 $' + Bs + ' + ' + j + '$' + pj(j, '과/와') + ' $' + Bs + ' + ' + k + '$' + pj(k, '으로/로') + ' 쪼개요. $' + Bs + '$' + pj(Bs, '을/를') + ' $x$로 보면 $(x + ' + j + ')(x + ' + k + ')$ 꼴이에요. 그러니 항은 세 개예요. $' + Bs + '$의 제곱, 작은 두 수의 합에 $' + Bs + '$' + pj(Bs, '을/를') + ' 곱한 것, 작은 두 수의 곱이에요. 가운데는 합, 끝은 곱이라는 것을 기억해요.', LAST3];
    } else if (q.kind === 'sum') {
      /* q.d: +1 이면 x + y = s, -1 이면 x − y = s. q.t: 'sq' x² + y² | 'other' (x ∓ y)² */
      sq2 = q.t === 'sq'; ans = s * s - q.d * (sq2 ? 2 : 4) * p;
      var given = 'x ' + (q.d > 0 ? '+' : '-') + ' y', target = sq2 ? 'x^{2} + y^{2}' : '(x ' + (q.d > 0 ? '-' : '+') + ' y)^{2}', c = sq2 ? 2 : 4, op = q.d > 0 ? ' - ' : ' + ';
      tex = given + ' = ' + s + ',\\quad xy = ' + p; text = '위 조건이 성립할 때, $' + target + '$의 값을 구하세요.';
      wrong['no-double'] = sq2 ? s * s - q.d * p : null; wrong['two-for-four'] = sq2 ? null : s * s - q.d * 2 * p; wrong['sign-flipped'] = s * s + q.d * c * p; wrong['just-square'] = s * s;
      steps = [{ say: '곱셈 공식을 바꿔 써서, 구하려는 식을 주어진 식으로 나타내요.', tex: target + ' = (' + given + ')^{2}' + op + c + 'xy' }, { say: '주어진 값을 넣어요.', tex: par(s) + '^{2}' + op + c + ' \\times ' + par(p) }, { say: '제곱과 곱셈을 먼저 계산하고 마무리해요.', tex: String(ans) }];
      hints = [APV, '주어진 것은 $' + given + '$의 값과 $xy$의 값이에요. $(' + given + ')^{2}$을 전개하면 $x^{2} ' + (q.d > 0 ? '+' : '-') + ' 2xy + y^{2}$이에요. ' + (sq2 ? '여기서 $2xy$를 반대쪽으로 옮기면 $x^{2} + y^{2}$만 남아요. 옮길 때 부호가 바뀌는 것에 주의해요.' : '구하려는 $' + target + '$을 전개한 것과 견줘 보면 가운데 항의 부호만 달라요. $2xy$가 $-2xy$로(또는 그 반대로) 바뀌려면 $2xy$의 2배만큼, 곧 $4xy$만큼 차이가 나요.') + ' $xy$가 음수이면 괄호를 쳐서 넣어요.', LAST3];
    } else if (q.kind === 'recip') {
      ans = k * k - q.d * 2; tex = 'x ' + (q.d > 0 ? '+' : '-') + ' \\dfrac{1}{x} = ' + k; text = '위 조건이 성립할 때, $x^{2} + \\dfrac{1}{x^{2}}$의 값을 구하세요.';
      wrong['just-square'] = k * k; wrong['sign-flipped'] = k * k + q.d * 2; wrong.doubled = 2 * k;
      steps = [{ say: '주어진 식의 양쪽을 제곱해요. $x$와 $\\dfrac{1}{x}$을 곱하면 1이라서 가운데 항은 2가 돼요.', tex: 'x^{2} ' + (q.d > 0 ? '+' : '-') + ' 2 + \\dfrac{1}{x^{2}} = ' + k + '^{2}' }, { say: '2를 반대쪽으로 옮겨요.', tex: 'x^{2} + \\dfrac{1}{x^{2}} = ' + k * k + (q.d > 0 ? ' - ' : ' + ') + '2' }, { say: '계산해요.', tex: String(ans) }];
      hints = ['$x$의 값을 직접 구하려고 하면 어려워요. 대신 주어진 식을 통째로 제곱해 보세요. 완전제곱식 공식에서 가운데 항은 두 항을 곱한 것의 2배예요. 그런데 $x$와 $\\dfrac{1}{x}$은 곱하면 약분되어 1이 돼요. 그래서 가운데 항이 문자 없이 수 2로 깔끔하게 떨어져요.',
        '주어진 식의 왼쪽을 제곱하면 항이 세 개 나와요. $x^{2}$, 가운데 항, 그리고 $\\dfrac{1}{x^{2}}$이에요. 가운데 항은 ' + (q.d > 0 ? '$+2$' : '$-2$') + '예요. 오른쪽도 똑같이 제곱해서 $' + k + '^{2}$으로 써요. 그러면 구하려는 식에 수 하나가 더 붙어 있는 꼴이 돼요. 그 수를 반대쪽으로 옮기면 돼요. 옮길 때 부호가 바뀌어요.', LAST3];
    } else {
      /* (m√a + n√b)(m√a − n√b), b = 1 이면 n 은 정수 */
      var ra = (m === 1 ? '' : m) + '\\sqrt{' + a + '}', rb = b === 1 ? String(n) : (n === 1 ? '' : n) + '\\sqrt{' + b + '}';
      ans = m * m * a - n * n * b; tex = '(' + ra + ' + ' + rb + ')(' + ra + ' - ' + rb + ')'; text = '곱셈 공식을 이용하여 계산하세요.';
      wrong.plus = m * m * a + n * n * b; wrong['over-squared'] = m * m * a * a - n * n * b * b; wrong['coef-not-squared'] = m > 1 || (n > 1 && b > 1) ? m * a - (b > 1 ? n * b : n * n) : null; wrong['root-kept'] = b === 1 && n > 1 ? m * m * a - n : null;
      steps = [{ say: '합과 차의 곱이니 제곱의 차로 써요.', tex: '(' + ra + ')^{2} - ' + (b === 1 ? rb + '^{2}' : '(' + rb + ')^{2}') }, { say: '근호가 든 수를 제곱하면 근호가 사라져요. 근호 밖의 수는 따로 제곱해요.', tex: m * m * a + ' - ' + n * n * b }, { say: '뺄셈을 계산해요.', tex: String(ans) }];
      hints = ['근호가 든 수에도 곱셈 공식을 그대로 쓸 수 있어요. 두 괄호가 더하기와 빼기만 다르고 나머지는 같으니 합과 차의 곱이에요. 전개하면 제곱의 차만 남아요. $\\sqrt{2}$를 제곱하면 2가 되듯이, 근호가 든 수는 제곱하면 근호가 사라져요. 그래서 답이 근호 없는 깔끔한 수로 나와요.',
        '두 괄호에서 부호가 같은 항은 $' + ra + '$, 부호가 다른 항은 $' + rb + '$' + pj(b === 1 ? n : b, '이에요/예요') + '. 앞의 것을 제곱하고, 뒤의 것을 제곱해서 빼요. ' + (m > 1 || (n > 1 && b > 1) ? '근호 앞에 수가 있으면 그 수도 제곱해야 해요. 근호 밖의 수의 제곱과 근호 안의 수를 곱해요. ' : '') + '근호 안의 수를 한 번 더 제곱하지 않도록 조심해요. $\\sqrt{a}$의 제곱은 $a$ 그대로예요.', LAST3];
    }
    return { tex: tex, text: text, ans: ans, wrong: wrong, steps: steps, hints: hints, check: true };
  };
  var okA = function (q) { var p = applyBuild(q); return p.ans >= 1; };
  numQ({
    id: 'B19.apply', title: '곱셈 공식의 활용', kind: 'int', build: applyBuild,
    mistakes: [['no-middle', '가운데 항을 빠뜨렸어요. 쪼갠 두 수를 엇갈려 곱한 항이 가운데에 꼭 들어가요.'],
      ['middle-half', '가운데 항에 2를 곱하지 않았어요. 완전제곱식의 가운데 항은 두 수를 곱한 것의 2배예요.'],
      ['last-negative', '마지막 항까지 뺐어요. 마지막 항은 제곱한 것이라서 빼기 꼴이어도 더해요.'],
      ['plus', '제곱의 합으로 계산했어요. 합과 차의 곱은 제곱의 차예요. 뒤의 제곱은 빼요.'],
      ['not-squared', '빼는 수를 제곱하지 않았어요. 두 수 모두 제곱한 다음에 빼요.'],
      ['square-like', '완전제곱식의 공식을 썼어요. 더하기와 빼기가 섞인 곱에서는 가운데 항이 서로 지워져요.'],
      ['const-sum', '마지막 항도 두 수의 합으로 썼어요. 마지막 항은 작은 두 수의 곱이에요.'],
      ['swapped', '합과 곱의 자리를 바꿨어요. 가운데 항에는 두 수의 합, 마지막 항에는 두 수의 곱을 써요.'],
      ['no-double', '$xy$를 한 번만 계산했어요. 완전제곱식의 가운데 항은 $2xy$이니, $xy$의 값을 2배 해서 옮겨요.'],
      ['two-for-four', '$2xy$만큼만 고쳤어요. $+2xy$가 $-2xy$로 바뀌려면 $4xy$만큼 차이가 나요.'],
      ['sign-flipped', '옮기는 항의 부호가 틀렸어요. 등호 반대쪽으로 옮기면 더하기는 빼기로, 빼기는 더하기로 바뀌어요.'],
      ['just-square', '주어진 값을 제곱하기만 했어요. 제곱하면 가운데 항이 함께 생기니, 그 항을 덜어 내야 해요.'],
      ['doubled', '주어진 값을 2배 했어요. 제곱은 2배가 아니라 같은 수를 두 번 곱하는 것이에요.'],
      ['over-squared', '근호 안의 수를 한 번 더 제곱했어요. 근호가 든 수를 제곱하면 근호만 사라지고 안의 수는 그대로예요.'],
      ['coef-not-squared', '근호 앞의 수를 제곱하지 않았어요. 근호 밖의 수도 함께 제곱해서 근호 안의 수와 곱해요.'],
      ['root-kept', '빼는 수를 제곱하지 않았어요. 두 항 모두 제곱한 다음에 빼요.']],
    levels: [
      { name: '수의 계산', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () {
            var Bs = r.pick([20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300]), kind = r.pick(['sq', 'sq', 'conj', 'xab']), k = kind === 'conj' ? r.int(1, 9) : r.int(1, 4), j = r.int(1, 5);
            return kind === 'xab' && j === k ? null : { kind: kind, B: Bs, k: k, j: j, s: pm(r, 1) };
          }, okA);
        }) } },
      { name: '합 · 차와 곱으로 식의 값 구하기', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () { var d = pm(r, 1), s = pm(r, r.int(2, 9)), p = nz(r, -12, 12); return { kind: 'sum', d: d, s: s, p: p, t: r.pick(['sq', 'sq', 'other']) }; }, function (q) { return okA(q) && q.s * q.s - q.d * 4 * q.p > 0; });
        }) } },
      { name: '역수의 합 · 근호가 든 식', minDistinct: 100, vars: { q: sampler(function (r) {
          return until(function () {
            var a, b, m, n;
            if (r.int(0, 3) === 0) return { kind: 'recip', d: pm(r, 1), k: r.int(3, 12) };
            a = r.pick([2, 3, 5, 6, 7, 10, 11, 13]); m = r.pick([1, 1, 2, 3]);
            if (r.int(0, 1)) { b = r.pick([2, 3, 5, 6, 7]); n = r.pick([1, 1, 2]); } else { b = 1; n = r.int(1, 6); }
            return a === b ? null : { kind: 'root', a: a, b: b, m: m, n: n };
          }, okA);
        }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B19', [
  { title: '전개: 빠짐없이 한 번씩 곱하기', body: [
    '괄호로 묶인 다항식의 곱을 풀어서 하나의 다항식으로 쓰는 것을 전개라고 해요.',
    '앞 괄호의 각 항을 뒤 괄호의 모든 항에 한 번씩 곱해요. 두 모임의 사람들이 빠짐없이 악수하는 것과 같아요.',
    { tex: '(a + b)(c + d) = ac + ad + bc + bd' },
    '곱한 다음 동류항이 있으면 모아요.',
    { tex: '(x + 2)(x + 3) = x^{2} + 3x + 2x + 6 = x^{2} + 5x + 6' }
  ] },
  { title: '완전제곱식', body: [
    '같은 식을 두 번 곱한 꼴이에요. 한 변이 $a + b$인 정사각형의 넓이로 생각하면, 정사각형 두 개와 직사각형 두 개로 나뉘어요.',
    { tex: '(a + b)^{2} = a^{2} + 2ab + b^{2}' },
    { tex: '(a - b)^{2} = a^{2} - 2ab + b^{2}' },
    '가운데 항 $2ab$를 빠뜨리지 않아요. 마지막 항은 제곱이라서 언제나 더해요.',
    { ex: [['(x + 3)^{2} = x^{2} + 6x + 9', '가운데는 $2 \\times x \\times 3$'], ['(2x - 5)^{2} = 4x^{2} - 20x + 25', '계수도 함께 제곱']] }
  ] },
  { title: '합과 차의 곱', body: [
    '더하기와 빼기만 다른 두 식을 곱하면 가운데 항이 서로 지워져요.',
    { tex: '(a + b)(a - b) = a^{2} - ab + ab - b^{2} = a^{2} - b^{2}' },
    '부호가 같은 항의 제곱에서 부호가 다른 항의 제곱을 빼요.',
    { ex: [['(x + 4)(x - 4) = x^{2} - 16', '항이 두 개만 남아요'], ['(3 - x)(3 + x) = 9 - x^{2}', '부호가 같은 항은 3']] }
  ] },
  { title: '(x + a)(x + b)', body: [
    '$x$의 계수는 두 수의 합, 상수항은 두 수의 곱이에요. "가운데는 합, 끝은 곱"으로 기억해요.',
    { tex: '(x + a)(x + b) = x^{2} + (a + b)x + ab' },
    { ex: [['(x + 2)(x + 5) = x^{2} + 7x + 10', '합 7, 곱 10'], ['(x - 3)(x + 4) = x^{2} + x - 12', '합 1, 곱 $-12$']] },
    '$x$ 앞에 계수가 있으면 네 번의 곱셈을 모두 해요.',
    { tex: '(2x + 1)(3x - 2) = 6x^{2} - 4x + 3x - 2 = 6x^{2} - x - 2' }
  ] },
  { title: '곱셈 공식의 활용', body: [
    '어려운 수를 쉬운 수로 쪼개면 공식으로 빠르게 계산할 수 있어요.',
    { ex: [['102^{2} = (100 + 2)^{2} = 10000 + 400 + 4', '완전제곱식'], ['51 \\times 49 = (50 + 1)(50 - 1) = 2500 - 1', '합과 차의 곱']] },
    '공식을 바꿔 쓰면, 합과 곱만 알아도 제곱의 합을 구할 수 있어요.',
    { tex: 'x^{2} + y^{2} = (x + y)^{2} - 2xy' }
  ] }
]);
