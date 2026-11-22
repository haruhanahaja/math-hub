/* C01 다항식의 연산 — 덧셈 · 곱셈, 곱셈 공식의 확장(세제곱 등), 다항식의 나눗셈
   유형(쉬운 것부터): C01.addsub 덧셈과 뺄셈 · C01.mul 다항식의 곱셈 · C01.trisq 세 항의 제곱 (a + b + c)²
                     · C01.cube 세제곱 (a ± b)³ · C01.sumcube 세제곱의 합과 차 (a ± b)(a² ∓ ab + b²) (여기까지 보기 고르기)
                     · C01.value 곱셈 공식의 변형(키패드, 부호 있는 정수)
                     · C01.div 나눗셈의 몫 · 검산식(보기 고르기) · C01.rem 나눗셈의 나머지(키패드, 부호 있는 정수)
   답이 식이면 보기 고르기, 답이 수 하나이면 키패드다.
   식은 항의 목록으로 다룬다. 항 = { c: 정수 계수, e: { x: 2, y: 1 } }. 한 문자의 다항식은 계수의 배열(높은 차수부터)로도 다룬다. 계산은 모두 정수로 한다.
   틀린 보기는 '흔한 실수 하나를 저지른 계산'을 실제로 해서 만든다.
   검산: 문제의 식과 답을 MH.alg.sameVal 로 견준다. 나눗셈은 (나누는 식) × (몫) + (나머지) 가 나뉘는 식과 같은지 본다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, order4 = A.order4, sameVal = A.sameVal, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var sgn = function (x) { return x < 0 ? -1 : 1; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  var perm6 = function (r) { return r.shuffle([0, 1, 2, 3, 4, 5]); };
  var ORD = ['첫째', '둘째', '셋째'];

  /* ── 항과 다항식 ── */
  var ORDER = ['a', 'b', 'c', 'x', 'y'];
  var T = function (c, e) { return { c: c, e: e || {} }; };
  var key = function (e) { return ORDER.filter(function (k) { return e[k]; }).map(function (k) { return k + (e[k] === 1 ? '' : '^{' + e[k] + '}'); }).join(''); };
  var deg = function (e) { return ORDER.reduce(function (s, k) { return s + (e[k] || 0); }, 0); };
  /** 차수가 높은 항부터, 같은 차수이면 앞 문자의 지수가 큰 항부터, 상수항은 맨 뒤 */
  var cmp = function (a, b) { var d = deg(b.e) - deg(a.e), i; for (i = 0; !d && i < ORDER.length; i++) d = (b.e[ORDER[i]] || 0) - (a.e[ORDER[i]] || 0); return d; };
  var mulT = function (a, b) { var e = {}; ORDER.forEach(function (k) { var x = (a.e[k] || 0) + (b.e[k] || 0); if (x) e[k] = x; }); return T(a.c * b.c, e); };
  var sq = function (t) { return mulT(t, t); };
  var neg = function (t) { return T(-t.c, t.e); };
  var mag = function (t) { return T(abs(t.c), t.e); };
  var scale = function (t, k) { return T(t.c * k, t.e); };
  var ptex = function (ts) { return poly(ts.map(function (t) { return [t.c, key(t.e)]; })); };
  var one = function (t) { return ptex([t]); };
  var pmul = function (P, Q) { var out = []; P.forEach(function (a) { Q.forEach(function (b) { out.push(mulT(a, b)); }); }); return out; };
  var comb = function (ts) {
    var g = {}, ks = [];
    ts.forEach(function (t) { var k = key(t.e); if (!g[k]) { g[k] = T(0, t.e); ks.push(k); } g[k].c += t.c; });
    return ks.map(function (k) { return g[k]; }).filter(function (t) { return t.c !== 0; }).sort(cmp);
  };
  var bin = function (P) { return '(' + ptex(P) + ')'; };
  /** 거듭제곱을 쓴다: x → x^{3}, 3 → 3^{3}, 2x → (2x)^{3} */
  var powTex = function (t, n) { var s = one(t); return (/^[a-z]$|^\d+$/.test(s) ? s : '(' + s + ')') + '^{' + n + '}'; };
  var wrap = function (t) { var s = one(t); return s.charAt(0) === '-' ? '(' + s + ')' : s; };
  var powNum = function (n, k) { return par(n) + '^{' + k + '}'; };

  /* ── 한 문자의 다항식: 계수의 배열(높은 차수부터). [2, 0, -3] 은 2x² − 3 ── */
  var D = function (cs) { var n = cs.length - 1; return cs.map(function (c, i) { return T(c, n - i ? { x: n - i } : {}); }).filter(function (t) { return t.c !== 0; }); };
  var dmul = function (p, q) { var out = [], i; for (i = 0; i < p.length + q.length - 1; i++) out.push(0); p.forEach(function (a, i2) { q.forEach(function (b, j) { out[i2 + j] += a * b; }); }); return out; };
  /** m·p + n·q (낮은 차수 쪽으로 줄을 맞춘다) */
  var dadd = function (p, q, m, n) { var L = Math.max(p.length, q.length), out = [], i; for (i = 0; i < L; i++) out.push(m * (p[i - (L - p.length)] || 0) + n * (q[i - (L - q.length)] || 0)); return out; };
  /** 나눗셈: 몫 q, 나머지 r, 한 번씩 나눈 기록 rounds. 계수가 정수로 나누어떨어지지 않으면 null */
  var ddiv = function (a, b) {
    var r = a.slice(), q = [], rounds = [], n = a.length - b.length, i, j, c, before;
    if (n < 0) return null;
    for (i = 0; i <= n; i++) {
      if (r[i] % b[0] !== 0) return null;
      c = r[i] / b[0] || 0; before = r.slice(i); q.push(c);
      for (j = 0; j < b.length; j++) r[i + j] -= c * b[j];
      if (c !== 0) rounds.push({ c: c, d: n - i, before: before, after: r.slice(i + 1) });
    }
    return { q: q, r: r.slice(n + 1), rounds: rounds };
  };
  var sameArr = function (x, y) { return x.length === y.length && x.every(function (v, i) { return v === y[i]; }); };

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
    return { tex: o.tex || o.raw, text: o.text || '다음 식을 전개하세요.', ans: ans, wrong: wrong, hints: o.hints, steps: o.steps,
      check: wrong.length === 3 && ans.length <= 40 && ans !== '0' && sameVal(o.raw, o.same || ans) && o.ok !== false };
  };
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'C01', version: 1, title: o.title,
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
  /* ── 틀: 부호 있는 정수 하나(키패드). build(q) → { text, tex, ans: 0 이 아닌 정수, hints, steps, wrong: { 실수 id: 정수 }, check }
     답이 문제에 없는 양수인데 힌트에 그 수가 나오면 거른다 ── */
  var numQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (n) { return { n: n, p: 0 }; };
    var leak = function (p) { var a = String(abs(p.ans)); return nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    var okW = function (p, x) { return isInt(x) && x !== p.ans && x !== 0 && x !== -p.ans; };
    var count = function (p) { var seen = []; o.mistakes.forEach(function (m) { var x = p.wrong[m[0]]; if (okW(p, x) && seen.indexOf(x) < 0) seen.push(x); }); return seen.length; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && p.ans !== 0 && abs(p.ans) <= 999 && p.check === true && !leak(p) && count(p) >= 2; }; });
    MH.defineType({
      id: o.id, unit: 'C01', version: 1, title: o.title,
      answer: { kind: 'signed' },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { text: p.text, tex: p.tex }; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v); return p.check === true && ans.p === 0 && ans.n === p.ans; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), x = p.wrong[m[0]], i;
            if (!okW(p, x)) return null;                                        /* 부호만 반대인 답은 공통 실수(sign)가 맡는다 */
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) if (p.wrong[o.mistakes[i][0]] === x) return null;
            return val(x);
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  /* ── C01.addsub 덧셈과 뺄셈 ─────────────────────────── */
  var AS_KEY = '다항식의 덧셈과 뺄셈은 같은 종류끼리 모으는 일이에요. 사과는 사과끼리, 귤은 귤끼리 세는 것처럼, $x^{2}$이 붙은 항은 $x^{2}$이 붙은 항끼리, $x$가 붙은 항은 $x$가 붙은 항끼리, 수는 수끼리 계산해요. 이렇게 문자와 차수가 같은 항을 동류항이라고 해요.';
  var rot = function (ts, k) { k = k % ts.length; return ts.slice(k).concat(ts.slice(0, k)); };
  var asBuild = function (q) {
    var m = q.m, n = q.n, an = abs(n), sub = n < 0, coef = m !== 1 || an !== 1, SA = rot(D(q.A), q.ra || 0), SB = rot(D(q.B), q.rb || 0);
    var sc = function (ts, k) { return ts.map(function (t) { return scale(t, k); }); };
    var all = sc(SA, m).concat(sc(SB, n)), ans = D(dadd(q.A, q.B, m, n)), mixed = !!((q.ra || 0) % SA.length || (q.rb || 0) % SB.length), missing = SA.length < q.A.length || SB.length < q.B.length;
    var name = (m === 1 ? '' : m) + 'A' + (sub ? ' - ' : ' + ') + (an === 1 ? '' : an) + 'B';
    var raw = (m === 1 ? '' : m) + '(' + ptex(SA) + ')' + (sub ? ' - ' : ' + ') + (an === 1 ? '' : an) + '(' + ptex(SB) + ')', cands;
    if (ans.length < 2) return null;
    cands = mixc([sub ? [comb(sc(SA, m).concat(SB.map(function (t, i) { return scale(t, i === 0 ? -an : an); }))), 'first-only-minus', '빼는 식의 첫 항만 빼고 나머지 항은 더했어요. 괄호 앞의 빼기는 괄호 안의 모든 항의 부호를 바꿔요.']
      : [D(dadd(q.A, q.B, m, -n)), 'subtracted', '더해야 하는데 뺐어요. 문제의 식에서 두 다항식 사이의 기호가 +인지 −인지 다시 확인해요.']], [
      sub ? [D(dadd(q.A, q.B, m, an)), 'added', '빼야 하는데 더했어요. 빼는 식은 모든 항의 부호를 바꾼 다음에 동류항끼리 모아요.'] : null,
      coef ? [comb(SA.map(function (t, i) { return scale(t, i === 0 ? m : 1); }).concat(SB.map(function (t, i) { return scale(t, i === 0 ? n : sgn(n)); }))), 'coef-first-only', '식 앞의 수를 첫 항에만 곱했어요. 괄호 앞의 수는 괄호 안의 모든 항에 하나씩 곱해요.'] : null,
      coef ? [D(dadd(q.A, q.B, 1, sgn(n))), 'coef-dropped', '식 앞에 곱해진 수를 빠뜨렸어요. 각 식에 수를 먼저 곱한 다음에 더하거나 빼요.'] : null,
      sub && !coef ? [D(dadd(q.A, q.B, -1, 1)), 'reversed', '빼는 차례를 거꾸로 했어요. 앞의 식에서 뒤의 식을 빼야 해요. 차례가 바뀌면 모든 항의 부호가 반대가 돼요.'] : null,
      mixed && SA.length === SB.length ? [comb(SA.map(function (t, i) { return T(m * t.c + n * SB[i].c, t.e); })), 'by-position', '써 있는 차례대로 계산했어요. 차례가 아니라 차수가 같은 항(동류항)끼리 모아야 해요. 먼저 두 식을 내림차순으로 정리해요.'] : null,
      [ans.map(function (t, i) { return i === ans.length - 1 ? neg(t) : t; }), 'one-sign', '마지막 항의 부호가 틀렸어요. 음수를 더하거나 뺄 때 부호를 한 번 더 확인해요.'],
      ans.length >= 3 ? [ans.map(function (t, i) { return i === 1 ? neg(t) : t; }), 'mid-sign', '가운데 항의 부호가 틀렸어요. 계수끼리 계산할 때 음수의 덧셈과 뺄셈을 다시 확인해요.'] : null,
      [[T(ans[0].c + ans[1].c, ans[0].e)].concat(ans.slice(2)), 'degree-merged', '차수가 다른 항을 합쳤어요. $x^{2}$이 붙은 항과 $x$가 붙은 항은 동류항이 아니라서 합칠 수 없어요.']
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands,
      tex: '\\begin{aligned} A &= ' + ptex(SA) + ' \\\\ B &= ' + ptex(SB) + ' \\end{aligned}',
      text: '두 다항식 $A$, $B$가 위와 같을 때, $' + name + '$를 계산하세요.',
      steps: [{ say: (coef ? '각 식을 괄호로 묶고, 곱하는 수를 괄호 앞에 써요.' : '두 식을 괄호로 묶어서 나란히 써요.'), tex: raw },
        { say: '괄호를 풀어요.' + (coef ? ' 괄호 앞의 수는 괄호 안의 모든 항에 곱해요.' : '') + (sub ? ' 괄호 앞이 빼기이면 괄호 안의 모든 항의 부호가 바뀌어요.' : ''), tex: ptex(all) },
        { say: '차수가 같은 동류항끼리 모으고, 차수가 높은 항부터 차례로 써요(내림차순).', tex: ptex(ans) }],
      hints: [AS_KEY,
        '① 먼저 두 식을 차수가 높은 항부터 차례로 정리해요(내림차순). ' + (mixed ? '이 문제는 항의 차례가 뒤섞여 있으니 항마다 차수를 확인해요. ' : '') + (missing ? '빠진 차수의 항은 계수가 0이라고 생각해요. ' : '') + '② ' + (coef ? '식 앞의 수는 괄호 안의 모든 항에 곱해요. ' : '') + (sub ? '빼는 식은 모든 항의 부호를 바꿔요. $-(x - 3)$은 $-x + 3$이 되는 것과 같아요. ' : '두 식을 괄호로 묶어 나란히 쓰고 괄호를 풀어요. ') + '③ 차수가 같은 항끼리 계수를 계산해요.',
        '세로로 줄을 맞춰 쓰면 실수가 줄어요. 윗줄에 앞의 식을, 아랫줄에 뒤의 식을 쓰되 같은 차수의 항이 위아래로 오게 맞춰요. 자리가 비면 비워 둬요. 그다음 세로 줄마다 계수만 ' + (sub ? '빼요. 음수를 빼는 것은 더하는 것과 같아요.' : '더해요. 음수를 더하는 것은 빼는 것과 같아요.')] });
  };
  var coefs = function (r, n, lim, zero) { var out = [], i, z = zero ? r.int(1, n) : -1; for (i = 0; i <= n; i++) out.push(i === z ? 0 : nz(r, -lim, lim)); return out; };
  choiceQ({
    id: 'C01.addsub', title: '다항식의 덧셈과 뺄셈', build: asBuild,
    ids: ['first-only-minus', 'subtracted', 'added', 'coef-first-only', 'coef-dropped', 'reversed', 'by-position', 'one-sign', 'mid-sign', 'degree-merged'],
    levels: [
      { name: '덧셈', vars: { q: sampler(function (r) { return { A: coefs(r, 2, 9), B: coefs(r, 2, 9), m: 1, n: 1, perm: perm6(r), o: order4(r) }; }) } },
      { name: '뺄셈 (차례가 섞인 식)', vars: { q: sampler(function (r) { var k = r.int(0, 2); return { A: coefs(r, 3, 7, r.int(0, 2) === 0), B: coefs(r, 3, 7, r.int(0, 2) === 0), m: 1, n: -1, ra: k === 0 ? 0 : r.int(1, 2), rb: k === 0 ? r.int(1, 2) : k === 1 ? 0 : r.int(1, 2), perm: perm6(r), o: order4(r) }; }) } },
      { name: '수를 곱해서 더하고 빼기', vars: { q: sampler(function (r) { var m = r.int(1, 3), n = pm(r, r.int(m === 1 ? 2 : 1, 3)); return { A: coefs(r, 2, 6), B: coefs(r, 2, 6), m: m, n: n, perm: perm6(r), o: order4(r) }; }) } }
    ]
  });

  /* ── C01.mul 다항식의 곱셈 ─────────────────────────── */
  var mulBuild = function (q) {
    var P = D(q.P), Q = D(q.Q), n = Q.length, prod = pmul(P, Q), last = prod.length - 1, ans = comb(prod), raw = bin(P) + bin(Q), cands, rows;
    var flip = function (i) { return comb(prod.map(function (t, j) { return j === i ? neg(t) : t; })); };
    if (P.length !== q.P.length || n !== q.Q.length) return null;
    rows = P.map(function (t) { return Q.map(function (u) { return mulT(t, u); }); });
    cands = mixc([[comb([prod[0], prod[last]]), 'first-last', '앞의 항끼리, 뒤의 항끼리만 곱했어요. 앞 괄호의 각 항을 뒤 괄호의 모든 항에 곱해야 해요.']], [
      [comb(prod.slice(0, n).concat(P.slice(1))), 'second-undistributed', '앞 괄호의 첫 항만 곱하고 나머지 항은 그대로 내려 썼어요. 나머지 항도 뒤 괄호의 모든 항에 곱해요.'],
      [comb(prod.filter(function (t, j) { return j !== n; })), 'one-missing', '곱셈을 한 번 빠뜨렸어요. 앞 괄호의 항 수와 뒤 괄호의 항 수를 곱한 만큼 곱셈을 해야 해요.'],
      [flip(n), 'cross-sign', '곱한 항의 부호가 하나 틀렸어요. 각 항은 앞에 붙은 부호까지 함께 곱해요. 부호가 다른 두 수의 곱은 음수예요.'],
      [flip(last), 'last-sign', '마지막 곱셈의 부호가 틀렸어요. 부호가 같은 두 수의 곱은 양수, 부호가 다른 두 수의 곱은 음수예요.'],
      [comb([T(prod[0].c, Q[0].e)].concat(prod.slice(1))), 'exp-not-added', '맨 앞 곱셈에서 지수를 더하지 않았어요. 같은 문자끼리 곱하면 지수를 더해요($x \\times x^{2} = x^{3}$).']
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands,
      steps: rows.map(function (row, i) { return { say: '앞 괄호의 ' + ORD[i] + ' 항을 뒤 괄호의 모든 항에 곱해요.', tex: wrap(P[i]) + bin(Q) + ' = ' + ptex(row) }; }).concat([{ say: '위에서 구한 줄을 모두 더하고, 동류항끼리 모아요.', tex: ptex(ans) }]),
      hints: ['다항식의 곱셈은 분배법칙을 여러 번 쓰는 것이에요. 선물을 나눠 주는 사람이 방 안의 모든 사람에게 하나씩 건네는 장면을 떠올려 봐요. 앞 괄호의 항 하나하나가 뒤 괄호의 모든 항을 한 번씩 만나요. 앞에 ' + P.length + '항, 뒤에 ' + n + '항이니 곱셈은 모두 $' + P.length + ' \\times ' + n + '$번이에요.',
        '① 앞 괄호의 첫째 항 $' + one(P[0]) + '$에 뒤 괄호의 항 ' + n + '개를 차례로 곱해 한 줄로 써요. ② 다음 항 $' + one(P[1]) + '$도 같은 방법으로 곱해 아랫줄에 써요. 빼기가 붙은 항은 음수로 보고 부호까지 곱해요. ③ 같은 문자끼리 곱하면 지수를 더해요($x \\times x^{2} = x^{3}$).',
        '곱한 결과를 줄마다 차수가 같은 항이 위아래로 오게 맞춰 써요. 그다음 세로로 계수를 더하면 동류항이 한 번에 정리돼요. 답의 항은 차수가 높은 것부터 써요. 곱셈을 빠짐없이 다 했는지 횟수를 세어 보는 것도 잊지 않아요.'] });
  };
  choiceQ({
    id: 'C01.mul', title: '다항식의 곱셈', build: mulBuild, ids: ['first-last', 'second-undistributed', 'one-missing', 'cross-sign', 'last-sign', 'exp-not-added'],
    levels: [
      { name: '(일차식) × (이차식)', vars: { q: sampler(function (r) { return { P: [1, nz(r, -6, 6)], Q: [1, nz(r, -6, 6), nz(r, -6, 6)], perm: perm6(r), o: order4(r) }; }) } },
      { name: '계수가 있는 식', vars: { q: sampler(function (r) { return { P: [r.int(2, 3), nz(r, -5, 5)], Q: [r.int(1, 2), nz(r, -5, 5), nz(r, -5, 5)], perm: perm6(r), o: order4(r) }; }) } },
      { name: '(이차식) × (이차식)', vars: { q: sampler(function (r) { return { P: [1, nz(r, -4, 4), nz(r, -4, 4)], Q: [1, nz(r, -4, 4), nz(r, -4, 4)], perm: perm6(r), o: order4(r) }; }) } }
    ]
  });

  /* ── C01.trisq 세 항의 제곱 ─────────────────────────── */
  var TRI_KEY = '세 항의 제곱은 한 변이 $a + b + c$인 정사각형 땅의 넓이로 생각하면 쉬워요. 가로와 세로를 각각 세 토막으로 나누면 땅이 9칸으로 갈라져요. 대각선의 3칸은 정사각형($a^{2}$, $b^{2}$, $c^{2}$)이고, 나머지 6칸은 직사각형인데 같은 것이 2개씩 있어요. 그래서 $(a + b + c)^{2} = a^{2} + b^{2} + c^{2} + 2ab + 2bc + 2ca$예요.';
  var triBuild = function (q) {
    var ts = q.ts.map(function (t) { return T(t[0], t[1]); }), raw = '(' + ptex(ts) + ')^{2}', s = ts.map(sq), PR = [[0, 1], [1, 2], [2, 0]];
    var cr = PR.map(function (p) { return scale(mulT(ts[p[0]], ts[p[1]]), 2); }), ans = comb(s.concat(cr)), hasNeg = ts.some(function (t) { return t.c < 0; }), like = ans.length < 6, cands;
    var ni = -1, ci = -1;
    ts.forEach(function (t, i) { if (!key(t.e) && abs(t.c) >= 2) ni = i; if (key(t.e) && abs(t.c) >= 2) ci = i; });
    cands = mixc([[comb(s), 'squares-only', '세 항을 각각 제곱하기만 했어요. 두 항씩 짝지어 곱한 것을 2배 한 항 세 개도 더해야 해요.']], [
      [comb(s.concat(cr.map(function (t) { return T(t.c / 2, t.e); }))), 'no-double', '두 항의 곱에 2를 곱하지 않았어요. 같은 직사각형이 2개씩 있으니 곱마다 2배 해요.'],
      [comb(s.concat(cr.slice(0, 2))), 'one-missing', '두 항의 곱을 하나 빠뜨렸어요. 짝은 (첫째, 둘째), (둘째, 셋째), (셋째, 첫째)로 모두 세 개예요.'],
      [comb(s.concat(cr.map(function (t, i) { return i === 1 ? neg(t) : t; }))), 'cross-sign', '두 항의 곱 하나의 부호가 틀렸어요. 부호가 같은 두 항의 곱은 양수, 다른 두 항의 곱은 음수예요.'],
      hasNeg ? [comb(s.concat(cr.map(mag))), 'all-plus', '모든 항을 더하기로 썼어요. 음수인 항이 하나 들어간 곱은 음수가 돼요. 항마다 부호를 붙여서 곱해요.'] : null,
      hasNeg ? [comb(s.map(function (t, i) { return ts[i].c < 0 ? neg(t) : t; }).concat(cr)), 'neg-square', '음수인 항의 제곱을 음수로 썼어요. 음수도 제곱하면 양수가 돼요.'] : null,
      ni >= 0 ? [comb(s.map(function (t, i) { return i === ni ? T(abs(ts[i].c)) : t; }).concat(cr)), 'const-not-squared', '수로 된 항을 제곱하지 않고 그대로 썼어요. 수도 제곱해야 해요.'] : null,
      ci >= 0 ? [comb(s.map(function (t, i) { return i === ci ? T(abs(ts[i].c), t.e) : t; }).concat(cr)), 'coef-not-squared', '계수를 제곱하지 않았어요. $(2x)^{2}$은 $2x^{2}$이 아니라 $4x^{2}$이에요. 계수도 함께 제곱해요.'] : null
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands,
      steps: [{ say: '세 항을 각각 제곱하고, 두 항씩 짝지은 곱 세 개를 2배 해서 더해요.', tex: ts.map(function (t) { return powTex(t, 2); }).join(' + ') + PR.map(function (p) { return ' + 2 \\times ' + wrap(ts[p[0]]) + ' \\times ' + wrap(ts[p[1]]); }).join('') },
        { say: '하나씩 계산해요. 음수가 들어간 곱은 부호를 잘 봐요.', tex: ptex(s.concat(cr)) },
        { say: like ? '동류항끼리 모으고, 차수가 높은 항부터 차례로 써요.' : '차수가 높은 항부터 차례로 써요.', tex: ptex(ans) }],
      hints: [TRI_KEY,
        '세 항을 부호까지 붙여서 읽어요: ' + ts.map(function (t) { return '$' + one(t) + '$'; }).join(', ') + '. ① 세 항을 각각 제곱해요. 음수도 제곱하면 양수가 돼요. ② 두 항씩 짝을 지으면 짝은 세 개예요(첫째와 둘째, 둘째와 셋째, 셋째와 첫째). 짝마다 곱하고 2배 해요. ③ 음수가 하나 든 짝의 곱은 음수, 음수가 둘 든 짝의 곱은 양수예요.',
        '계산한 항은 모두 6개가 나와야 해요(제곱 3개, 2배 한 곱 3개). 개수를 세어 빠진 것이 없는지 확인해요. ' + (like ? '이 문제는 차수가 같은 항이 생기니 마지막에 동류항끼리 모아요.' : '마지막에 차수가 높은 항부터 차례로 정리해요.')] });
  };
  var PAIRS = [['x', 'y'], ['a', 'b']];
  var L1 = function (v) { var e = {}; e[v] = 1; return e; };
  choiceQ({
    id: 'C01.trisq', title: '세 항의 제곱', build: triBuild, ids: ['squares-only', 'no-double', 'one-missing', 'cross-sign', 'all-plus', 'neg-square', 'const-not-squared', 'coef-not-squared'],
    levels: [
      { name: '문자 두 개와 수', minDistinct: 60, vars: { q: sampler(function (r) {
        var p;
        if (r.int(0, 9) === 0) return { ts: [[1, L1('a')], [pm(r, 1), L1('b')], [pm(r, 1), L1('c')]], perm: perm6(r), o: order4(r) };
        p = r.pick(PAIRS); return { ts: [[1, L1(p[0])], [pm(r, 1), L1(p[1])], [pm(r, r.int(1, 9)), {}]], perm: perm6(r), o: order4(r) };
      }) } },
      { name: '계수가 있는 식', minDistinct: 120, vars: { q: sampler(function (r) {
        var p = r.pick(PAIRS), mn = r.pick([[2, 1], [1, 2], [3, 1], [1, 3]]);
        return { ts: [[mn[0], L1(p[0])], [pm(r, mn[1]), L1(p[1])], [pm(r, r.int(1, 5)), {}]], perm: perm6(r), o: order4(r) };
      }) } },
      { name: '한 문자의 이차식', minDistinct: 100, vars: { q: sampler(function (r) { return { ts: [[1, { x: 2 }], [pm(r, r.int(1, 5)), { x: 1 }], [pm(r, r.int(1, 6)), {}]], perm: perm6(r), o: order4(r) }; }) } }
    ]
  });

  /* ── C01.cube 세제곱 ─────────────────────────────── */
  var CUBE_KEY = '세제곱은 같은 식을 세 번 곱하는 것이에요. $(a + b)(a + b)(a + b)$를 실제로 전개해서 정리하면 $a^{3} + 3a^{2}b + 3ab^{2} + b^{3}$이 돼요. 계수는 1, 3, 3, 1이고, 앞의 것의 지수는 하나씩 내려가고 뒤의 것의 지수는 하나씩 올라가요. 한 모서리가 $a + b$인 상자를 잘라 보면 큰 정육면체 1개, 납작한 덩어리 3개, 길쭉한 덩어리 3개, 작은 정육면체 1개가 나오는 것과 같아요.';
  var cubeBuild = function (q) {
    var a = T(q.a[0], q.a[1]), b = T(q.b[0], q.b[1]), bb = mag(b), minus = b.c < 0, raw = '(' + ptex([a, b]) + ')^{3}', op = minus ? ' - ' : ' + ';
    var a2 = sq(a), b2 = sq(b), a3 = mulT(a2, a), b3 = mulT(b2, b), m1 = scale(mulT(a2, b), 3), m2 = scale(mulT(a, b2), 3), ans = [a3, m1, m2, b3], bnum = !key(b.e), cands;
    cands = mixc([[[a3, b3], 'no-middle', '두 항을 각각 세제곱하기만 했어요. 가운데에 $3a^{2}b$와 $3ab^{2}$에 해당하는 항 두 개가 더 있어요.']], [
      [[a3, T(m1.c / 3, m1.e), T(m2.c / 3, m2.e), b3], 'no-three', '가운데 두 항에 3을 곱하지 않았어요. 같은 모양의 덩어리가 3개씩 나오니 3을 곱해요.'],
      [[a3, T(m1.c / 3 * 2, m1.e), T(m2.c / 3 * 2, m2.e), b3], 'two-for-three', '가운데 항에 2를 곱했어요. 2를 곱하는 것은 제곱 공식이에요. 세제곱 공식에서는 3을 곱해요.'],
      minus ? [[a3, m1, neg(m2), b3], 'all-minus', '뒤의 항을 모두 빼기로 썼어요. 부호는 +, −, +, − 차례로 번갈아 나와요. 음수를 두 번 곱한 셋째 항은 양수예요.'] : null,
      minus ? [[a3, m1, m2, neg(b3)], 'last-plus', '마지막 항을 더했어요. 음수를 세 번 곱하면 음수예요. 마지막 항은 빼야 해요.'] : null,
      minus ? [[a3, mag(m1), m2, mag(b3)], 'all-plus', '모든 항을 더하기로 썼어요. 빼기가 들어 있으니 둘째 항과 넷째 항은 음수예요.'] : null,
      [[a3, m1, T(3 * a.c * abs(b.c), mulT(a, b).e), b3], 'b-not-squared', '셋째 항에서 뒤의 것을 제곱하지 않았어요. 셋째 항은 3 × (앞의 것) × (뒤의 것의 제곱)이에요.'],
      a.c >= 2 ? [[T(a.c, a3.e), m1, m2, b3], 'coef-not-cubed', '첫 항의 계수를 세제곱하지 않았어요. $(2x)^{3}$은 $2x^{3}$이 아니라 $8x^{3}$이에요.'] : null,
      bnum && abs(b.c) >= 2 ? [[a3, m1, m2, T(3 * b.c)], 'times-three', '마지막 항에서 수를 세 번 곱하지 않고 3배 했어요. 세제곱은 같은 수를 세 번 곱하는 것이에요.'] : null
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands,
      steps: [{ say: (minus ? '$(a - b)^{3} = a^{3} - 3a^{2}b + 3ab^{2} - b^{3}$에 넣어요. 부호가 번갈아 나와요.' : '$(a + b)^{3} = a^{3} + 3a^{2}b + 3ab^{2} + b^{3}$에 넣어요.'),
        tex: powTex(a, 3) + op + '3 \\times ' + powTex(a, 2) + ' \\times ' + one(bb) + ' + 3 \\times ' + one(a) + ' \\times ' + powTex(bb, 2) + op + powTex(bb, 3) },
        { say: '거듭제곱을 먼저 계산하고, 수끼리 곱해요.', tex: ptex(ans) }],
      hints: [CUBE_KEY,
        '공식에 넣을 것을 먼저 정해요: 앞의 것 → $' + one(a) + '$, 뒤의 것 → $' + one(bb) + '$. ① 첫 항은 앞의 것을 세 번 곱해요. 계수가 있으면 계수도 세 번 곱해요. ② 둘째 항은 3 × (앞의 것의 제곱) × (뒤의 것), 셋째 항은 3 × (앞의 것) × (뒤의 것의 제곱)이에요. ③ 마지막 항은 뒤의 것을 세 번 곱해요.' + (minus ? ' 가운데가 빼기이니 부호는 +, −, +, − 차례예요.' : ''),
        '답의 항은 4개예요. 가운데 두 항에 3을 곱했는지, 괄호째 거듭제곱해야 할 곳을 놓치지 않았는지 확인해요. $(2x)^{3}$은 $2x^{3}$이 아니라 $8x^{3}$이에요. 숫자도 함께 세 번 곱하기 때문이에요.'] });
  };
  var VARS = ['x', 'a', 'y'];
  var twoTerm = function (r, level) {
    var p, m;
    if (level === 0) return { a: [1, L1(r.pick(VARS))], b: [pm(r, r.int(1, 6)), {}] };
    if (level === 1) {
      if (r.int(0, 3)) return { a: [r.int(2, 3), L1(r.pick(VARS))], b: [pm(r, r.int(1, 4)), {}] };
      p = r.pick(PAIRS); return { a: [1, L1(p[0])], b: [pm(r, r.int(1, 3)), L1(p[1])] };
    }
    if (r.int(0, 2)) return { a: [r.int(2, 4), L1(r.pick(VARS))], b: [pm(r, r.int(2, 5)), {}] };
    p = r.pick(PAIRS); m = r.int(2, 3); return { a: [m, L1(p[0])], b: [pm(r, r.int(1, 3)), L1(p[1])] };
  };
  var withOrder = function (r, q) { q.perm = perm6(r); q.o = order4(r); return q; };
  choiceQ({
    id: 'C01.cube', title: '세제곱 공식', build: cubeBuild, ids: ['no-middle', 'no-three', 'two-for-three', 'all-minus', 'last-plus', 'all-plus', 'b-not-squared', 'coef-not-cubed', 'times-three'],
    levels: [
      { name: '(x ± 수)³', minDistinct: 30, vars: { q: sampler(function (r) { return withOrder(r, twoTerm(r, 0)); }) } },
      { name: '계수나 다른 문자가 있는 식', minDistinct: 50, vars: { q: sampler(function (r) { return withOrder(r, twoTerm(r, 1)); }) } },
      { name: '계수가 둘 다 있는 식', minDistinct: 70, vars: { q: sampler(function (r) { return withOrder(r, twoTerm(r, 2)); }) } }
    ]
  });

  /* ── C01.sumcube 세제곱의 합과 차 ───────────────────── */
  var SC_KEY = '$(a + b)(a^{2} - ab + b^{2}) = a^{3} + b^{3}$, $(a - b)(a^{2} + ab + b^{2}) = a^{3} - b^{3}$이에요. 전개하면 가운데 항 4개가 둘씩 짝을 지어 지워지고 양 끝의 세제곱만 남아요. 외울 때는 「첫째 괄호와 둘째 괄호의 가운데 부호는 서로 반대」라는 것을 꼭 함께 기억해요. 답의 부호는 첫째 괄호의 부호를 따라가요.';
  var SC_LAST = '공식 꼴이 맞으면 두 항을 각각 세제곱해서 첫째 괄호의 부호대로 잇기만 하면 돼요. 계수가 있는 항은 계수까지 세제곱해요. 공식 꼴이 아니면 지름길이 없어요. 첫째 괄호의 각 항을 둘째 괄호의 세 항에 하나씩 곱해 6개의 항을 만들고 동류항끼리 모아요.';
  var scBuild = function (q) {
    var a = T(q.a[0], q.a[1]), b = T(q.b[0], q.b[1]), bb = mag(b), minus = b.c < 0, trap = !!q.trap, a2 = sq(a), b2 = sq(b), ab = mulT(a, b), first = [a, b], second = [a2, trap ? ab : neg(ab), b2];
    var raw = bin(first) + bin(second), prod = pmul(first, second), ans = comb(prod), a3 = mulT(a2, a), b3 = mulT(b2, b), cube = [a3, scale(mulT(a2, b), 3), scale(mulT(a, b2), 3), b3], bnum = !key(b.e), cands, steps;
    var CUBED = '세제곱 공식 $(a \\pm b)^{3}$처럼 전개했어요. 이 식은 같은 식을 세 번 곱한 것이 아니에요. 괄호 두 개의 모양을 다시 봐요.';
    if (trap) {
      cands = mixc([[[a3, b3], 'formula-misused', '공식처럼 보이지만 공식 꼴이 아니에요. 공식은 둘째 괄호의 가운데 부호가 첫째 괄호와 반대여야 해요. 이 식은 하나씩 곱해야 해요.']], [
        [[a3, neg(b3)], 'sign', '공식 꼴이 아닌데 공식을 썼고 부호도 달라요. 가운데 부호가 서로 반대인지부터 확인해요. 아니면 하나씩 곱해요.'],
        [cube, 'as-cube', CUBED],
        [comb(prod.filter(function (t, j) { return j !== 1; })), 'one-missing', '곱셈을 한 번 빠뜨렸어요. 항이 2개인 괄호와 3개인 괄호를 곱하니 곱셈은 모두 6번이에요.'],
        [comb(prod.map(function (t, j) { return j === 4 ? neg(t) : t; })), 'cross-sign', '곱한 항의 부호가 하나 틀렸어요. 각 항은 앞에 붙은 부호까지 함께 곱해요.']
      ], q.perm);
      steps = [{ say: '공식과 견줘 봐요. 공식이라면 둘째 괄호의 가운데 부호가 첫째 괄호와 반대여야 하는데, 이 식은 같아요. 공식을 쓸 수 없으니 첫째 항부터 하나씩 곱해요.', tex: wrap(a) + bin(second) + ' = ' + ptex(prod.slice(0, 3)) },
        { say: '첫째 괄호의 둘째 항도 둘째 괄호의 모든 항에 곱해요.', tex: wrap(b) + bin(second) + ' = ' + ptex(prod.slice(3)) },
        { say: '두 줄을 더하고 동류항끼리 모아요.', tex: ptex(ans) }];
    } else {
      cands = mixc([[[a3, neg(b3)], 'sign', '답의 부호가 틀렸어요. 답의 부호는 첫째 괄호의 가운데 부호를 따라가요. 더하기이면 세제곱의 합, 빼기이면 세제곱의 차예요.']], [
        [cube, 'as-cube', CUBED],
        [[a3, T(sgn(b.c) * b.c * b.c, b2.e)], 'squared', '뒤의 항을 제곱만 했어요. 양 끝에 남는 것은 두 항의 세제곱이에요. 같은 것을 세 번 곱해요.'],
        bnum ? [[a3, T(3 * b.c)], 'times-three', '뒤의 수를 세 번 곱하지 않고 3배 했어요. 세제곱은 같은 수를 세 번 곱하는 것이에요.'] : null,
        a.c >= 2 ? [[T(a.c, a3.e), b3], 'coef-not-cubed', '앞의 항의 계수를 세제곱하지 않았어요. $(2x)^{3}$은 $2x^{3}$이 아니라 $8x^{3}$이에요.'] : null,
        [comb([a3, second[1], b3]), 'middle-kept', '가운데 항을 남겼어요. 공식 꼴에서는 가운데 항들이 모두 짝을 지어 지워지고 세제곱 두 개만 남아요.']
      ], q.perm);
      steps = [{ say: '둘째 괄호가 (앞의 것의 제곱), (두 항의 곱), (뒤의 것의 제곱)으로 이루어졌는지, 가운데 부호가 첫째 괄호와 반대인지 확인해요.', tex: bin(first) + '(' + powTex(a, 2) + (minus ? ' + ' : ' - ') + one(a) + ' \\times ' + one(bb) + ' + ' + powTex(bb, 2) + ')' },
        { say: (minus ? '$(a - b)(a^{2} + ab + b^{2}) = a^{3} - b^{3}$ 꼴이에요. 두 항을 각각 세제곱해서 빼요.' : '$(a + b)(a^{2} - ab + b^{2}) = a^{3} + b^{3}$ 꼴이에요. 두 항을 각각 세제곱해서 더해요.'), tex: powTex(a, 3) + (minus ? ' - ' : ' + ') + powTex(bb, 3) },
        { say: '거듭제곱을 계산해요.', tex: ptex(ans) }];
    }
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps,
      hints: [SC_KEY,
        '먼저 이 식이 공식 꼴인지 확인해요. ① 첫째 괄호의 두 항을 봐요: $' + one(a) + '$, $' + one(bb) + '$. ② 둘째 괄호의 첫 항이 앞의 것의 제곱($' + one(a2) + '$), 끝 항이 뒤의 것의 제곱($' + one(b2) + '$)인지 봐요. ③ 가운데 항이 두 항의 곱이고, 그 부호가 첫째 괄호의 가운데 부호와 반대인지 봐요. 세 가지가 모두 맞아야 공식을 쓸 수 있어요.',
        SC_LAST] });
  };
  choiceQ({
    id: 'C01.sumcube', title: '세제곱의 합과 차', build: scBuild, ids: ['sign', 'as-cube', 'squared', 'times-three', 'coef-not-cubed', 'middle-kept', 'formula-misused', 'one-missing', 'cross-sign'],
    levels: [
      { name: '(x ± 수)(x² ∓ …)', minDistinct: 30, vars: { q: sampler(function (r) { return withOrder(r, twoTerm(r, 0)); }) } },
      { name: '계수나 다른 문자가 있는 식', minDistinct: 50, vars: { q: sampler(function (r) { return withOrder(r, twoTerm(r, 1)); }) } },
      { name: '공식 꼴인지 가려내기', minDistinct: 100, vars: { q: sampler(function (r) { var q = withOrder(r, twoTerm(r, r.int(0, 1))); q.trap = r.int(0, 1) === 1; return q; }) } }
    ]
  });

  /* ── C01.value 곱셈 공식의 변형 ─────────────────────── */
  var V_KEY = '두 수를 따로 구하지 않아도 돼요. 합(또는 차)과 곱만 알면 답을 구할 수 있어요. 가진 재료로 만들 수 있게 공식의 모양을 바꾸는 것이 요령이에요. 곱셈 공식을 전개한 식에서, 구하려는 것만 남기고 나머지를 반대쪽으로 옮겨요.';
  var V_NEG = ' 음수를 넣을 때는 괄호로 묶어요. 거듭제곱부터 계산하고, 그다음 곱셈, 마지막에 덧셈과 뺄셈을 해요.';
  var valBuild = function (q) {
    var s = q.s, p = q.p, k = q.k, t = q.t, ans, c;
    var given = function (n) { return '$' + n + '$' + pj(n, '을/를'); };
    if (q.t0 === 'sum3' || q.t0 === 'diff3') {
      var plus = q.t0 === 'sum3', op = plus ? '+' : '-', disc = plus ? s * s - 4 * p : s * s + 4 * p;
      c = 3 * p * s; ans = plus ? s * s * s - c : s * s * s + c;
      return { tex: 'x ' + op + ' y = ' + s + ',\\quad xy = ' + p, text: '위 조건이 성립할 때, $x^{3} ' + op + ' y^{3}$의 값을 구하세요.', ans: ans, check: disc > 0 && p !== 0,
        wrong: plus ? { 'just-cube': s * s * s, plus: s * s * s + c, 'no-sum': s * s * s - 3 * p, 'no-three': s * s * s - p * s, 'square-formula': s * s - 2 * p }
          : { 'just-cube': s * s * s, minus: s * s * s - c, 'no-sum': s * s * s + 3 * p, 'no-three': s * s * s + p * s, 'square-formula': s * s + 2 * p },
        steps: [{ say: (plus ? '$(x + y)^{3}$을 전개한 식에서 가운데 두 항 $3x^{2}y + 3xy^{2} = 3xy(x + y)$를 빼면 세제곱의 합만 남아요.' : '$(x - y)^{3}$을 전개한 식에서 가운데 두 항 $-3x^{2}y + 3xy^{2} = -3xy(x - y)$를 반대쪽으로 넘기면 세제곱의 차만 남아요.'), tex: 'x^{3} ' + op + ' y^{3} = (x ' + op + ' y)^{3} ' + (plus ? '-' : '+') + ' 3xy(x ' + op + ' y)' },
          { say: '주어진 값을 넣어요.', tex: powNum(s, 3) + (plus ? ' - ' : ' + ') + '3 \\times ' + par(p) + ' \\times ' + par(s) },
          { say: '거듭제곱, 곱셈을 먼저 하고 마지막에 ' + (plus ? '빼요.' : '더해요.'), tex: (s * s * s) + (plus ? ' - ' : ' + ') + par(c) + ' = ' + ans }],
        hints: [V_KEY,
          '① 변형한 공식은 $x^{3} ' + op + ' y^{3} = (x ' + op + ' y)^{3} ' + (plus ? '-' : '+') + ' 3xy(x ' + op + ' y)$예요. ② $x ' + op + ' y$가 있는 자리 두 곳에 ' + given(s) + ', $xy$가 있는 자리에 ' + given(p) + ' 넣어요. ③' + V_NEG,
          (plus ? '합을 세제곱한 것에서 「3 × 곱 × 합」을 빼요.' : '차를 세제곱한 것에 「3 × 곱 × 차」를 더해요.') + ' 3을 곱하는 것과 ' + (plus ? '합' : '차') + '을 한 번 더 곱하는 것을 빠뜨리기 쉬워요. 곱이 음수이면 ' + (plus ? '빼는 수가 음수가 되어 결국 더하게 돼요.' : '더하는 수가 음수가 되어 결국 빼게 돼요.')] };
    }
    if (q.t0 === 'recip') {
      var pl = q.d > 0, o2 = pl ? '+' : '-', g = 'x ' + o2 + ' \\dfrac{1}{x}', G = '\\left(' + g + '\\right)';
      ans = pl ? k * k * k - 3 * k : k * k * k + 3 * k;
      return { tex: g + ' = ' + k, text: '위 조건이 성립할 때, $x^{3} ' + o2 + ' \\dfrac{1}{x^{3}}$의 값을 구하세요.', ans: ans, check: true,
        wrong: pl ? { 'just-cube': k * k * k, plus: k * k * k + 3 * k, 'no-sum': k * k * k - 3, 'square-formula': k * k - 2 } : { 'just-cube': k * k * k, minus: k * k * k - 3 * k, 'no-sum': k * k * k + 3, 'square-formula': k * k + 2 },
        steps: [{ say: '두 수 $x$와 $\\dfrac{1}{x}$의 곱은 1이에요. 그래서 변형한 공식의 「3 × 곱」 자리가 3이 돼요.', tex: 'x^{3} ' + o2 + ' \\dfrac{1}{x^{3}} = ' + G + '^{3} ' + (pl ? '-' : '+') + ' 3' + G },
          { say: '주어진 값을 넣어요.', tex: k + '^{3} ' + (pl ? '-' : '+') + ' 3 \\times ' + k },
          { say: '거듭제곱, 곱셈을 먼저 하고 마지막에 ' + (pl ? '빼요.' : '더해요.'), tex: (k * k * k) + (pl ? ' - ' : ' + ') + (3 * k) + ' = ' + ans }],
        hints: [V_KEY,
          '$x$와 $\\dfrac{1}{x}$을 두 수로 생각해요. 두 수의 곱은 $x \\times \\dfrac{1}{x} = 1$로 늘 1이에요. ① 세제곱의 ' + (pl ? '합' : '차') + ' 공식을 변형한 식에서 한 수의 자리에 $x$, 다른 수의 자리에 $\\dfrac{1}{x}$을 넣어요. ② 「3 × 곱 × ' + (pl ? '합' : '차') + '」에서 곱이 1이니 「3 × ' + (pl ? '합' : '차') + '」만 남아요. ③ ' + (pl ? '합' : '차') + '의 자리에 ' + given(k) + ' 넣어요.',
          '주어진 값을 세제곱한 다음, 주어진 값의 3배를 ' + (pl ? '빼요.' : '더해요.') + ' 세제곱만 하고 끝내면 안 돼요. 가운데 두 항이 남아 있기 때문이에요. 제곱 공식의 변형(제곱하고 2를 빼거나 더하기)과 헷갈리지 않게 조심해요.'] };
    }
    if (q.t0 === 'tri') {
      ans = s * s - 2 * p;
      return { tex: 'a + b + c = ' + s + ',\\quad ab + bc + ca = ' + p, text: '위 조건이 성립할 때, $a^{2} + b^{2} + c^{2}$의 값을 구하세요.', ans: ans, check: s * s >= 3 * p && p !== 0,
        wrong: { 'just-square': s * s, plus: s * s + 2 * p, 'no-double': s * s - p, 'product-only': 2 * p },
        steps: [{ say: '$(a + b + c)^{2}$을 전개한 식에서 $2(ab + bc + ca)$를 반대쪽으로 넘겨요.', tex: 'a^{2} + b^{2} + c^{2} = (a + b + c)^{2} - 2(ab + bc + ca)' },
          { say: '주어진 값을 넣어요.', tex: powNum(s, 2) + ' - 2 \\times ' + par(p) },
          { say: '제곱과 곱셈을 먼저 하고 마지막에 빼요.', tex: (s * s) + ' - ' + par(2 * p) + ' = ' + ans }],
        hints: [V_KEY,
          '① 세 항의 제곱 공식은 $(a + b + c)^{2} = a^{2} + b^{2} + c^{2} + 2(ab + bc + ca)$예요. ② 구하려는 제곱의 합만 남기면 $a^{2} + b^{2} + c^{2} = (a + b + c)^{2} - 2(ab + bc + ca)$예요. ③ $a + b + c$의 자리에 ' + given(s) + ', $ab + bc + ca$의 자리에 ' + given(p) + ' 넣어요.' + V_NEG,
          '합을 제곱한 것에서 「두 수씩 곱한 것의 합」의 2배를 빼요. 2배를 빠뜨리거나, 빼지 않고 더하는 실수가 많아요. 곱의 합이 음수이면 빼는 수가 음수라서 결국 더하게 돼요.'] };
    }
    /* tri-rev: 합과 제곱의 합으로 ab + bc + ca 구하기 */
    ans = (s * s - t) / 2;
    return { tex: 'a + b + c = ' + s + ',\\quad a^{2} + b^{2} + c^{2} = ' + t, text: '위 조건이 성립할 때, $ab + bc + ca$의 값을 구하세요.', ans: ans, check: isInt(ans) && 3 * t >= s * s,
      wrong: { 'no-half': s * s - t, 'plus': isInt((s * s + t) / 2) ? (s * s + t) / 2 : null, 'not-squared': isInt((s - t) / 2) ? (s - t) / 2 : null, 'doubled': 2 * (s * s - t) },
      steps: [{ say: '세 항의 제곱 공식을 써요.', tex: '(a + b + c)^{2} = a^{2} + b^{2} + c^{2} + 2(ab + bc + ca)' },
        { say: '아는 값을 넣어요. 모르는 것은 $ab + bc + ca$ 하나뿐이에요.', tex: powNum(s, 2) + ' = ' + t + ' + 2(ab + bc + ca)' },
        { say: '합을 제곱한 값에서 제곱의 합을 빼고 2로 나눠요.', tex: '(' + (s * s) + ' - ' + t + ') \\div 2 = ' + ans }],
      hints: [V_KEY,
        '① 세 항의 제곱 공식은 $(a + b + c)^{2} = a^{2} + b^{2} + c^{2} + 2(ab + bc + ca)$예요. ② $a + b + c$의 자리에 ' + given(s) + ', $a^{2} + b^{2} + c^{2}$의 자리에 ' + given(t) + ' 넣어요. ③ 그러면 모르는 것이 $ab + bc + ca$ 하나뿐인 식이 돼요. 일차방정식을 풀듯이 구해요.',
        '합을 먼저 제곱해요. 거기에서 제곱의 합을 빼면 「구하는 값의 2배」가 남아요. 마지막에 2로 나누는 것을 잊지 않아요. 답이 음수가 나올 수도 있어요. 그때는 − 키를 눌러 넣어요.'] };
  };
  numQ({
    id: 'C01.value', title: '곱셈 공식의 변형', build: valBuild,
    mistakes: [['just-cube', '주어진 값을 세제곱하기만 했어요. 세제곱을 전개하면 가운데에 항이 두 개 더 있어요. 그것을 빼거나 더해 줘야 해요.'],
      ['plus', '빼야 하는 것을 더했어요. 구하려는 것만 남기고 나머지를 반대쪽으로 넘기면 부호가 바뀌어요.'],
      ['minus', '더해야 하는 것을 뺐어요. $(x - y)^{3}$을 전개하면 가운데 항이 $-3xy(x - y)$라서, 반대쪽으로 넘기면 더하기가 돼요.'],
      ['no-sum', '3과 곱만 곱하고, 합(또는 차)을 한 번 더 곱하지 않았어요. 가운데 두 항을 묶으면 $3xy(x + y)$처럼 합이 한 번 더 곱해져요.'],
      ['no-three', '가운데 항에 3을 곱하지 않았어요. 세제곱 공식의 가운데 두 항에는 3이 곱해져 있어요.'],
      ['square-formula', '제곱 공식의 변형을 썼어요. 이 문제는 세제곱이에요. 주어진 값을 세 번 곱하고, 3이 곱해진 항을 계산해요.'],
      ['just-square', '합을 제곱하기만 했어요. 세 항의 제곱을 전개하면 $2(ab + bc + ca)$가 더 있어요. 그것을 빼야 해요.'],
      ['no-double', '곱의 합에 2를 곱하지 않았어요. 전개하면 두 수씩 곱한 것이 2개씩 나와요.'],
      ['product-only', '곱의 합을 2배 하기만 했어요. 합을 제곱한 값에서 그것을 빼야 해요.'],
      ['no-half', '마지막에 2로 나누지 않았어요. 합의 제곱에서 제곱의 합을 빼면 구하는 값의 2배가 남아요.'],
      ['not-squared', '합을 제곱하지 않고 그대로 썼어요. 공식의 왼쪽은 합의 제곱이에요.'],
      ['doubled', '2로 나눠야 하는데 2를 곱했어요. 남은 값이 구하는 값의 2배이니 2로 나눠요.']],
    levels: [
      { name: '합과 곱으로 세제곱의 합', minDistinct: 100, vars: { q: sampler(function (r) { return { t0: 'sum3', s: nz(r, -6, 6), p: nz(r, -9, 8) }; }) } },
      { name: '차와 곱 · 역수의 합', minDistinct: 60, vars: { q: sampler(function (r) {
        var d;
        if (r.int(0, 4) === 0) { d = pm(r, 1); return { t0: 'recip', d: d, k: d > 0 ? r.int(3, 7) : r.int(1, 6) }; }
        return { t0: 'diff3', s: r.int(1, 6), p: nz(r, -8, 12) };
      }) } },
      { name: '세 문자', minDistinct: 150, vars: { q: sampler(function (r) {
        var s = nz(r, -9, 9);
        if (r.int(0, 2) === 0) return { t0: 'tri-rev', s: s, t: r.int(Math.ceil(s * s / 3), s * s + 30) };
        return { t0: 'tri', s: s, p: nz(r, -15, Math.floor(s * s / 3)) };
      }) } }
    ]
  });

  /* ── C01.div 나눗셈의 몫 · 검산식, C01.rem 나눗셈의 나머지 ───────── */
  var D_KEY = '다항식의 나눗셈은 수의 세로 나눗셈과 똑같은 박자로 해요. 「나누고 → 곱하고 → 빼고 → 다음 항을 내리고」를 되풀이해요. 수의 나눗셈에서 앞자리부터 몫을 세우듯이, 다항식에서는 차수가 가장 높은 항부터 몫을 세워요. 남은 식의 차수가 나누는 식의 차수보다 낮아지면 끝이에요.';
  var lead = function (cs) { return one(D(cs)[0]); };
  var divInfo = function (q) {
    var Acs = dadd(dmul(q.B, q.Q), q.R, 1, 1), res = ddiv(Acs, q.B), flipB = q.B.map(function (c, i) { return i === 0 ? c : -c; });
    if (!res || !sameArr(res.q, q.Q) || !sameArr(res.r, q.R) || q.Q.some(function (c) { return c === 0; }) || Acs[0] === 0) return null;
    return { A: Acs, At: ptex(D(Acs)), Bt: ptex(D(q.B)), res: res, alt: ddiv(Acs, flipB), missing: D(Acs).length < Acs.length };
  };
  var roundSteps = function (I, B) {
    return I.res.rounds.map(function (r, i) {
      var qt = T(r.c, r.d ? { x: r.d } : {});
      return { say: (i === 0 ? '나뉘는 식' : '남은 식') + '의 맨 앞 항을 나누는 식의 맨 앞 항으로 나눠요($' + lead(r.before) + ' \\div ' + lead(B) + ' = ' + one(qt) + '$). 이 몫에 나누는 식을 곱해서 ' + (i === 0 ? '나뉘는 식' : '남은 식') + '에서 빼요.',
        tex: '(' + ptex(D(r.before)) + ') - ' + wrap(qt) + '(' + ptex(D(B)) + ') = ' + ptex(D(r.after)) };
    });
  };
  var divHint2 = function (I, B) {
    return '① 두 식을 차수가 높은 항부터 정리해요. ' + (I.missing ? '나뉘는 식에 빠진 차수가 있으니, 그 자리는 계수가 0이라고 생각하고 비워서 줄을 맞춰요. ' : '') + '② 맨 앞 항끼리 나눠요. $' + lead(I.A) + ' \\div ' + lead(B) + '$의 결과가 몫의 첫 항이에요. ③ 그 항에 나누는 식 $' + I.Bt + '$ 전체를 곱해서 나뉘는 식 아래에 쓰고 빼요. 뺄 때는 아랫줄 모든 항의 부호가 바뀌어요. ④ 남은 식을 가지고 ②와 ③을 되풀이해요.';
  };
  var checkBuild = function (q) {
    var B = D(q.B), Q = D(q.Q), r = q.R[0], BQ = dmul(q.B, q.Q), Acs = dadd(BQ, q.R, 1, 1), prod = pmul(B, Q), n = Q.length, Bt = ptex(B), Qt = ptex(Q), cands;
    if (!r || Q.length !== q.Q.length) return null;
    cands = mixc([[D(BQ), 'no-remainder', '나머지를 더하지 않았어요. 나누는 식과 몫을 곱한 다음 나머지까지 더해야 원래 식이 돼요.']], [
      [D(dadd(BQ, q.R, 1, -1)), 'rem-subtracted', '나머지를 더하지 않고 뺐어요. 나머지는 나누고 「남은」 것이니 더해야 원래 식이 돼요.'],
      [comb([prod[0], prod[prod.length - 1], T(r)]), 'first-last', '곱할 때 앞의 항끼리, 뒤의 항끼리만 곱했어요. 앞 괄호의 각 항을 뒤 괄호의 모든 항에 곱해야 해요.'],
      [D(dadd(dadd(q.B, q.Q, 1, 1), q.R, 1, 1)), 'added', '세 식을 모두 더했어요. 나누는 식과 몫은 곱하고, 나머지만 더해요.'],
      [comb(prod.map(function (t, j) { return j === n ? neg(t) : t; }).concat([T(r)])), 'cross-sign', '곱한 항의 부호가 하나 틀렸어요. 각 항은 앞에 붙은 부호까지 함께 곱해요.'],
      [D(dmul(q.B, dadd(q.Q, q.R, 1, 1))), 'rem-into-quotient', '나머지를 몫에 먼저 더한 다음 곱했어요. 곱셈을 먼저 하고, 그 결과에 나머지를 더해요.']
    ], q.perm);
    return finish({ raw: '(' + Bt + ')(' + Qt + ') + ' + par(r), ans: D(Acs), cands: cands,
      tex: '\\begin{aligned} B &= ' + Bt + ' \\\\ Q &= ' + Qt + ' \\\\ R &= ' + r + ' \\end{aligned}',
      text: '다항식 $A$를 $B$로 나눈 몫이 $Q$, 나머지가 $R$일 때, 다항식 $A$를 고르세요.',
      steps: [{ say: '나눗셈은 (나뉘는 식) = (나누는 식) × (몫) + (나머지)로 검산해요. 이 식에 그대로 넣어요.', tex: 'A = (' + Bt + ')(' + Qt + ') + ' + par(r) },
        { say: '곱셈을 먼저 전개해서 정리해요.', tex: ptex(D(BQ)) + (r < 0 ? ' - ' : ' + ') + abs(r) },
        { say: '마지막에 수끼리 계산해요.', tex: ptex(D(Acs)) }],
      hints: ['나눗셈을 거꾸로 되돌리는 문제예요. 과자 17개를 5개씩 묶으면 3묶음이 되고 2개가 남아요. 거꾸로 $5 \\times 3 + 2$를 계산하면 처음의 17이 나와요. 다항식도 똑같아요. (나뉘는 식) = (나누는 식) × (몫) + (나머지)예요. 이 식을 검산식이라고 해요.',
        '① $B$와 $Q$를 곱해요. 앞 괄호의 각 항을 뒤 괄호의 모든 항에 곱하고 동류항끼리 모아요. ② 곱한 결과에 나머지 $R$을 더해요. 나머지가 음수이면 빼는 것과 같아요. ③ 차수가 높은 항부터 차례로 정리해요.',
        '나머지를 빠뜨리거나, 더하지 않고 빼는 실수가 많아요. 다 구한 다음에는 차수를 확인해 봐요. 구한 식의 가장 높은 차수는 나누는 식의 차수와 몫의 차수를 더한 것과 같아야 해요.'] });
  };
  var divBuild = function (q) {
    var I, Qc, B = q.B, lowered, noSub, cands;
    if (q.mode === 'check') return checkBuild(q);
    I = divInfo(q); if (!I) return null;
    Qc = I.res.q;
    lowered = I.A.slice(0, Qc.length).every(function (c) { return c % B[0] === 0; }) ? I.A.slice(0, Qc.length).map(function (c) { return c / B[0]; }) : null;
    noSub = I.A[1] % B[0] === 0 ? Qc.map(function (c, i) { return i === 1 ? I.A[1] / B[0] : c; }) : null;
    cands = mixc([[I.alt && D(I.alt.q), 'divisor-sign', '곱해서 뺄 때 부호를 틀렸어요. 몫의 항에 나누는 식을 곱한 것을 통째로 빼야 해요. 빼는 줄의 모든 항의 부호가 바뀌어요.']], [
      [lowered && D(lowered), 'just-lowered', '나뉘는 식의 계수를 앞에서부터 그대로 옮겨 적었어요. 한 항씩 나누고, 곱해서 빼는 과정을 거쳐야 다음 항이 정해져요.'],
      [q.R.some(function (c) { return c !== 0; }) ? D(dadd(Qc, q.R, 1, 1)) : null, 'remainder-added', '나머지를 몫에 더했어요. 마지막에 남은 식은 몫이 아니라 나머지예요. 몫과 따로 써요.'],
      [D(Qc.map(function (c, i) { return i === Qc.length - 1 ? -c : c; })), 'last-sign', '몫의 마지막 항의 부호가 틀렸어요. 남은 식의 맨 앞 항의 부호를 그대로 가지고 나눠요.'],
      [noSub && D(noSub), 'no-subtract', '첫 번째 뺄셈을 하지 않고 다음 항을 그대로 나눴어요. 몫의 항을 하나 세울 때마다 곱해서 빼야 해요.'],
      [Qc.length >= 3 ? D(Qc.map(function (c, i) { return i === 1 ? -c : c; })) : null, 'mid-sign', '몫의 가운데 항의 부호가 틀렸어요. 뺄셈을 한 뒤 남은 식의 맨 앞 항의 부호를 다시 확인해요.']
    ], q.perm);
    return finish({ raw: I.At, same: '(' + I.Bt + ')(' + ptex(D(Qc)) + ') + (' + ptex(D(q.R)) + ')', ans: D(Qc), cands: cands,
      tex: '(' + I.At + ') \\div (' + I.Bt + ')', text: '다음 나눗셈의 몫을 고르세요.',
      steps: roundSteps(I, B).concat([{ say: '남은 식의 차수가 나누는 식의 차수보다 낮아졌으니 여기서 멈춰요. 그동안 구한 항을 차례로 모은 것이 몫이고, 마지막에 남은 식이 나머지예요.', tex: ptex(D(Qc)) }]),
      hints: [D_KEY, divHint2(I, B),
        '가장 흔한 실수는 빼기예요. 곱해서 쓴 줄을 「통째로」 빼야 해서, 음수인 항을 빼면 더하기가 돼요. 몫의 항은 모두 ' + Qc.length + '개가 나와요. 한 번 뺄 때마다 맨 앞 항이 사라지는지 확인하면 계산이 맞는지 알 수 있어요.'] });
  };
  var remBuild = function (q) {
    var I = divInfo(q), B = q.B, Qc, R;
    if (!I) return null;
    Qc = I.res.q; R = q.R[0];
    return { tex: '(' + I.At + ') \\div (' + I.Bt + ')', text: '다음 나눗셈의 나머지를 구하세요.', ans: R,
      check: sameVal(I.At, '(' + I.Bt + ')(' + ptex(D(Qc)) + ') + ' + par(R)),
      wrong: { 'divisor-sign': I.alt ? I.alt.r[0] : null, 'const-kept': I.A[I.A.length - 1], 'last-added': R + 2 * Qc[Qc.length - 1] * B[1], 'quotient-term': Qc[Qc.length - 1] },
      steps: roundSteps(I, B).concat([{ say: '남은 것은 수뿐이라 더 나눌 수 없어요. 이 수가 나머지예요.', tex: String(R) }]),
      hints: [D_KEY, divHint2(I, B),
        '나머지는 맨 마지막 뺄셈에서 나와요. 나누는 식이 일차식이면 나머지는 문자가 없는 수 하나예요. 마지막 줄에서 음수를 빼는지 양수를 빼는지 부호를 한 번 더 확인해요. 답이 음수이면 − 키를 눌러 넣어요.'] };
  };
  var divQ = function (level) {
    return sampler(function (r) {
      var q;
      if (level === 0) q = { B: [1, nz(r, -5, 5)], Q: [r.int(1, 3), nz(r, -6, 6)], R: [r.int(-9, 9)] };
      else if (level === 1) q = { B: [1, nz(r, -4, 4)], Q: [r.int(1, 2), nz(r, -5, 5), nz(r, -5, 5)], R: [r.int(-9, 9)] };
      else if (level === 2) q = { B: [1, r.int(-3, 3), nz(r, -4, 4)], Q: [r.int(1, 2), nz(r, -5, 5)], R: [r.int(-6, 6), r.int(-6, 6)] };
      else if (level === 3) q = { mode: 'check', B: [1, nz(r, -5, 5)], Q: r.int(0, 1) ? [1, nz(r, -5, 5), nz(r, -5, 5)] : [r.int(2, 3), nz(r, -6, 6)], R: [nz(r, -9, 9)] };
      else q = { B: r.pick([[2, 1], [2, -1], [2, 3], [2, -3], [3, 1], [3, -1], [3, 2], [3, -2], [3, 4], [3, -4]]), Q: r.int(0, 1) ? [r.int(1, 2), nz(r, -4, 4), nz(r, -4, 4)] : [r.int(1, 3), nz(r, -5, 5)], R: [nz(r, -9, 9)] };
      return withOrder(r, q);
    });
  };
  choiceQ({
    id: 'C01.div', title: '다항식의 나눗셈', build: divBuild,
    ids: ['divisor-sign', 'just-lowered', 'remainder-added', 'last-sign', 'no-subtract', 'mid-sign', 'no-remainder', 'rem-subtracted', 'first-last', 'added', 'cross-sign', 'rem-into-quotient'],
    levels: [
      { name: '(이차식) ÷ (일차식)의 몫', vars: { q: divQ(0) } },
      { name: '(삼차식) ÷ (일차식)의 몫', vars: { q: divQ(1) } },
      { name: '(삼차식) ÷ (이차식)의 몫', vars: { q: divQ(2) } },
      { name: '검산식으로 원래 식 구하기', vars: { q: divQ(3) } }
    ]
  });
  numQ({
    id: 'C01.rem', title: '나눗셈의 나머지', build: remBuild,
    mistakes: [['divisor-sign', '곱해서 뺄 때 부호를 틀렸어요. 몫의 항에 나누는 식을 곱한 것을 통째로 빼야 해요. 빼는 줄의 모든 항의 부호가 바뀌어요.'],
      ['const-kept', '나뉘는 식의 상수항을 그대로 답했어요. 마지막 뺄셈까지 해야 나머지가 나와요.'],
      ['last-added', '마지막 줄에서 빼야 하는데 더했어요. 몫의 마지막 항에 나누는 식을 곱한 것을 남은 식에서 빼요.'],
      ['quotient-term', '몫의 마지막 항을 답했어요. 나머지는 마지막 뺄셈을 하고 남은 수예요.']],
    levels: [
      { name: '(이차식) ÷ (일차식)', vars: { q: divQ(0) } },
      { name: '(삼차식) ÷ (일차식)', vars: { q: divQ(1) } },
      { name: '나누는 식의 계수가 1이 아닐 때', vars: { q: divQ(4) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('C01', [
  { title: '다항식을 정리하는 법', body: [
    '항이 여러 개인 식을 다항식이라고 해요. 다항식은 차수가 높은 항부터 차례로 쓰면 보기 쉬워요. 이렇게 쓰는 것을 내림차순으로 정리한다고 해요.',
    { ex: [['3x - 5 + 2x^{3} + x^{2}', '뒤섞인 식'], ['2x^{3} + x^{2} + 3x - 5', '내림차순으로 정리한 식']] },
    '책꽂이에 책을 키 순서대로 꽂는 것과 같아요. 순서를 맞춰 두면 같은 차수의 항을 바로 찾을 수 있어서 계산 실수가 줄어요.',
    '문자와 차수가 같은 항을 동류항이라고 해요. $2x^{2}$과 $-5x^{2}$은 동류항이고, $2x^{2}$과 $2x$는 동류항이 아니에요.'
  ] },
  { title: '덧셈과 뺄셈', body: [
    '다항식의 덧셈과 뺄셈은 동류항끼리 계수를 계산하는 것이에요. 사과는 사과끼리, 귤은 귤끼리 세는 것과 같아요.',
    { ex: [['(2x^{2} + 3x) + (x^{2} - 5x) = 3x^{2} - 2x', '동류항끼리 더해요'], ['(2x^{2} + 3x) - (x^{2} - 5x) = x^{2} + 8x', '빼는 식은 모든 항의 부호를 바꿔요']] },
    '뺄셈에서는 괄호 앞의 빼기가 괄호 안의 모든 항에 걸려요. 첫 항만 빼고 나머지를 더하는 실수가 가장 많아요.',
    '$2A - 3B$처럼 수가 곱해져 있으면, 그 수를 괄호 안의 모든 항에 먼저 곱해요.'
  ] },
  { title: '곱셈', body: [
    '다항식의 곱셈은 분배법칙을 여러 번 쓰는 것이에요. 앞 괄호의 각 항을 뒤 괄호의 모든 항에 한 번씩 곱해요.',
    { ex: [['x(x^{2} - 2x + 4) = x^{3} - 2x^{2} + 4x', '앞 괄호의 첫째 항을 곱해요'], ['3(x^{2} - 2x + 4) = 3x^{2} - 6x + 12', '앞 괄호의 둘째 항을 곱해요'], ['(x + 3)(x^{2} - 2x + 4) = x^{3} + x^{2} - 2x + 12', '두 줄을 더하고 동류항끼리 모아요']] },
    '항이 2개인 식과 3개인 식을 곱하면 곱셈은 모두 6번이에요. 횟수를 세어 보면 빠뜨린 것을 찾을 수 있어요.',
    '같은 문자끼리 곱하면 지수를 더해요. $x \\times x^{2} = x^{3}$이에요.'
  ] },
  { title: '곱셈 공식', body: [
    '자주 나오는 곱셈은 결과를 공식으로 기억해 두면 빨라요. 중학교에서 배운 제곱 공식에 세 가지가 더해져요.',
    { ex: [['\\begin{aligned} (a + b + c)^{2} &= a^{2} + b^{2} + c^{2} \\\\ &\\quad + 2ab + 2bc + 2ca \\end{aligned}', '세 항의 제곱'], ['(a + b)^{3} = a^{3} + 3a^{2}b + 3ab^{2} + b^{3}', '합의 세제곱'], ['(a - b)^{3} = a^{3} - 3a^{2}b + 3ab^{2} - b^{3}', '차의 세제곱. 부호가 번갈아 나와요']] },
    { ex: [['(a + b)(a^{2} - ab + b^{2}) = a^{3} + b^{3}', '세제곱의 합'], ['(a - b)(a^{2} + ab + b^{2}) = a^{3} - b^{3}', '세제곱의 차']] },
    '아래 두 공식은 괄호 두 개의 가운데 부호가 서로 반대일 때만 쓸 수 있어요. 부호가 같으면 공식 꼴이 아니니 하나씩 곱해요.',
    '공식이 기억나지 않으면 분배법칙으로 직접 전개하면 돼요. 공식은 그 결과를 미리 적어 둔 것이에요.'
  ] },
  { title: '곱셈 공식의 변형', body: [
    '두 수의 합과 곱만 알아도 제곱의 합이나 세제곱의 합을 구할 수 있어요. 공식에서 구하려는 것만 남기고 나머지를 반대쪽으로 넘기면 돼요.',
    { ex: [['a^{2} + b^{2} = (a + b)^{2} - 2ab', '제곱의 합'], ['a^{3} + b^{3} = (a + b)^{3} - 3ab(a + b)', '세제곱의 합'], ['a^{3} - b^{3} = (a - b)^{3} + 3ab(a - b)', '세제곱의 차'], ['\\begin{aligned} a^{2} + b^{2} + c^{2} &= (a + b + c)^{2} \\\\ &\\quad - 2(ab + bc + ca) \\end{aligned}', '세 수의 제곱의 합']] },
    '$a + b = 4$, $ab = 2$이면 $a^{3} + b^{3} = 4^{3} - 3 \\times 2 \\times 4 = 64 - 24 = 40$이에요. 두 수를 따로 구하지 않았어요.'
  ] },
  { title: '나눗셈', body: [
    '다항식의 나눗셈도 수의 나눗셈처럼 「나누고, 곱하고, 빼고」를 되풀이해요. $(x^{2} + 5x + 7) \\div (x + 2)$를 해 봐요.',
    { ex: [['x^{2} \\div x = x', '맨 앞 항끼리 나눠요. 몫의 첫 항이 나와요'], ['(x^{2} + 5x + 7) - x(x + 2) = 3x + 7', '곱해서 빼요'], ['3x \\div x = 3', '남은 식의 맨 앞 항을 다시 나눠요'], ['(3x + 7) - 3(x + 2) = 1', '곱해서 빼요. 수만 남으면 끝이에요']] },
    '몫은 $x + 3$, 나머지는 $1$이에요. 나머지의 차수는 늘 나누는 식의 차수보다 낮아요.',
    { ex: [['17 = 5 \\times 3 + 2', '수의 나눗셈: 17 ÷ 5의 몫은 3, 나머지는 2'], ['x^{2} + 5x + 7 = (x + 2)(x + 3) + 1', '검산식: (나뉘는 식) = (나누는 식) × (몫) + (나머지)']] },
    '나뉘는 식에 빠진 차수가 있으면 그 자리를 비워 두고 줄을 맞춰요. $x^{3} - 2x + 1$은 $x^{2}$의 자리가 비어 있는 식이에요.'
  ] }
]);
