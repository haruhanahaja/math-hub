/* A17 분수·소수 혼합 계산 — 분수와 소수가 섞인 사칙 계산(기초 구간 마무리)
   유형(쉬운 것부터): A17.add-dec 소수로 고쳐서 더하고 빼기 · A17.add-frac 분수로 고쳐서 더하고 빼기 · A17.mul-div 곱셈과 나눗셈
                     · A17.mixed 계산 순서가 있는 혼합 계산 · A17.word 문장제
   한 가지 모양으로 맞춰서 계산한다: 분수가 유한소수가 되면 소수로, 아니면(분모 3, 6, 9 …) 소수를 분수로.
   소수는 { n, p }(n ÷ 10^p)로 다루고 계산은 정수와 분수(MH.F)로만 한다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F, D = MH.dec, P10 = MH.pow10, gcd = MH.gcd, lcm = MH.lcm;

  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  /** 대분수 꼴 수식(w 가 0 이면 분수만) */
  var T = function (w, n, d) { return (w ? w : '') + frac(n, d); };
  var S = function (n, p) { return MH.decStr(n, p, true); };
  var show = function (d) { return S(d.n, d.p); };
  var when = function (test, make) { return function (v) { return test(v) ? make(v) : null; }; };
  var len = function (n) { return String(n).length; };
  var lowest = function (v) { return gcd(v.a, v.b) === 1; };
  var clean = function (v) { return v.dn % 10 !== 0; };
  var gt0 = function (q) { return q.compare(0) > 0; };
  /** Fraction → 답 값 { n, d } (0 이하면 null) */
  var val = function (q) { return q && gt0(q) ? { n: q.n, d: q.d } : null; };
  var V = function (n, d) { return n > 0 && d > 0 ? { n: n, d: d } : null; };
  /** Fraction 을 수식으로: fr 는 가분수 그대로, mx 는 대분수 꼴 */
  var fr = function (q) { return q.d === 1 ? String(q.n) : frac(q.n, q.d); };
  var mx = function (q) { var r = q.n % q.d, w = (q.n - r) / q.d; return q.d === 1 ? String(q.n) : T(w, r, q.d); };
  /** Fraction 을 글로: 4분의 3, 1과 4분의 3, 2. rdJ 는 마지막에 읽는 수에 조사를 붙인다. */
  var rdJ = function (q, pair) {
    var r = q.n % q.d, w = (q.n - r) / q.d;
    if (q.d === 1) return josa(q.n, pair);
    return (w ? josa(w, '과/와') + ' ' : '') + q.d + '분의 ' + josa(r, pair);
  };
  var rd = function (q) { return rdJ(q, '/'); };
  /** 가분수 그대로 읽기: 4분의 7 */
  var rdTopJ = function (q, pair) { return (q.d === 1 ? '' : q.d + '분의 ') + josa(q.n, pair); };
  var rdTop = function (q) { return rdTopJ(q, '/'); };
  var tail = function (R) { return R.d !== 1 && R.n > R.d ? ' = ' + mx(R) : ''; };

  /* 분수 계산을 한 줄 수식으로 */
  var addTex = function (P, Qv, minus) {
    var L = lcm(P.d, Qv.d), pn = P.n * (L / P.d), qn = Qv.n * (L / Qv.d), rn = minus ? pn - qn : pn + qn, R = F(rn, L), op = minus ? ' - ' : ' + ';
    var one = function (n) { return L === 1 ? String(n) : frac(n, L); };
    var s = fr(P) + op + fr(Qv);
    if (P.d !== L || Qv.d !== L) s += ' = ' + one(pn) + op + one(qn);
    s += ' = ' + one(rn);
    if (L !== 1 && R.d !== L) s += ' = ' + fr(R);
    return s;
  };
  var mulTex = function (P, Qv) {
    var R = P.mul(Qv), s = fr(P) + ' \\times ' + fr(Qv);
    if (P.d === 1 && Qv.d === 1) return s + ' = ' + fr(R);
    s += ' = ' + frac(P.n + ' \\times ' + Qv.n, [P.d, Qv.d].filter(function (x) { return x !== 1; }).join(' \\times '));
    s += ' = ' + frac(P.n * Qv.n, P.d * Qv.d);
    if (R.d !== P.d * Qv.d) s += ' = ' + fr(R);
    return s;
  };
  var divTex = function (P, Qv) { return fr(P) + ' \\div ' + fr(Qv) + ' = ' + mulTex(P, Qv.inverse()); };

  /* 분수 w 와 a/b, 소수 dn ÷ 10^dp 를 쓰는 유형(add-dec · add-frac · mul-div · word)의 공통 도구 */
  /** 분모 b 를 10^k 으로 만들 수 있는 가장 작은 k (없으면 0) */
  var placesOf = function (b) { for (var k = 1; k <= 4; k++) if (P10(k) % b === 0) return k; return 0; };
  var target = function (v) { return P10(placesOf(v.b)); };
  var mult = function (v) { return target(v) / v.b; };
  var topOf = function (v) { return v.w * v.b + v.a; };
  var Fx = function (v) { return F(topOf(v), v.b); };                     /* 분수의 값 */
  var Dx = function (v) { return F(v.dn, P10(v.dp)); };                   /* 소수의 값 */
  var fracTex = function (v) { return T(v.w, v.a, v.b); };
  var decTex = function (v) { return S(v.dn, v.dp); };
  /** 분수를 소수로 고친 값 { n, p } (끝의 0 없음: 기약분수이고 k 가 가장 작으므로) */
  var fdec = function (v) { var k = placesOf(v.b); return { n: v.w * P10(k) + v.a * mult(v), p: k }; };
  var given = function (v) { return { n: v.dn, p: v.dp }; };
  /** 분자를 그대로 소수점 아래에 쓴 수(w.a) — 흔한 실수 */
  var glue = function (v) { return { n: v.w * P10(len(v.a)) + v.a, p: len(v.a) }; };
  /** 왼쪽 · 오른쪽 순서로: side 가 1 이면 소수가 왼쪽 */
  var sides = function (v, f, d) { return v.side ? [d, f] : [f, d]; };
  /** 소수 x, y 를 자릿수를 맞춘 정수로 더하거나 뺀다. 0 이하면 null */
  var calc = function (x, y, minus) {
    var P = Math.max(x.p, y.p), a = x.n * P10(P - x.p), b = y.n * P10(P - y.p), r = minus ? a - b : a + b;
    return r > 0 ? D(r, P) : null;
  };
  /** Fraction 을 소수 { n, p } 로(소수점 아래 네 자리 안에 끝날 때만. 아니면 null) */
  var asDec = function (q) {
    if (!q || !gt0(q)) return null;
    for (var k = 0; k <= 4; k++) if (P10(k) % q.d === 0) return D(q.n * (P10(k) / q.d), k);
    return null;
  };
  /** 검산용: 분수 [분자, 분모] 를 fraction.js 없이 정수로만 계산한다 */
  var R = {
    add: function (x, y) { return [x[0] * y[1] + y[0] * x[1], x[1] * y[1]]; },
    sub: function (x, y) { return [x[0] * y[1] - y[0] * x[1], x[1] * y[1]]; },
    mul: function (x, y) { return [x[0] * y[0], x[1] * y[1]]; },
    div: function (x, y) { return [x[0] * y[1], x[1] * y[0]]; },
    same: function (x, y) { return x[0] * y[1] === y[0] * x[1] && x[1] * y[1] !== 0; }
  };
  var fracPair = function (v) { return [v.w * v.b + v.a, v.b]; };
  var decPair = function (v) { return [v.dn, P10(v.dp)]; };
  var ansPair = function (ans) { return ans.p !== undefined ? [ans.n, P10(ans.p)] : [ans.n, ans.d]; };
  var opTex = function (v) { return v.op ? ' - ' : ' + '; };
  var opSay = function (v) { return v.op ? ' − ' : ' + '; };

  /* ── A17.add-dec 소수로 고쳐서 더하고 빼기 ──────────────
     분모가 10, 100, 1000 의 약수인 분수 ± 소수. 분수를 소수로 고쳐서 계산하고 답도 소수로 쓴다. */
  var adAns = function (v) { var s = sides(v, fdec(v), given(v)); return calc(s[0], s[1], v.op); };
  /* 답이 자연수로 떨어지는 문제는 뺀다(답을 소수로 쓰는 유형) */
  var adOk = function (v) { var r = adAns(v); return lowest(v) && clean(v) && r !== null && r.p >= 1; };
  MH.defineType({
    id: 'A17.add-dec', unit: 'A17', version: 1, title: '소수로 고쳐서 더하고 빼기',
    answer: { kind: 'decimal' },
    levels: [
      { name: '분모가 2, 5인 분수', vars: { b: pick([2, 5]), w: pick([0, 0, 1]), a: function (v) { return int(1, v.b - 1); }, dp: 1, dn: int(1, 29), op: pick([0, 1]), side: pick([0, 1]) }, where: adOk },
      { name: '분모가 4, 20, 25, 50인 분수', vars: { b: pick([4, 4, 20, 25, 50]), w: pick([0, 0, 1]), a: function (v) { return int(1, v.b - 1); }, dp: pick([1, 2]), dn: function (v) { return v.dp === 1 ? int(1, 29) : int(1, 199); }, op: pick([0, 1]), side: pick([0, 1]) }, where: adOk },
      { name: '분모가 8, 40, 125인 분수', vars: { b: pick([8, 8, 40, 125]), w: pick([0, 1, 2]), a: function (v) { return int(1, v.b - 1); }, dp: pick([1, 2, 3]), dn: function (v) { return v.dp === 1 ? int(1, 39) : v.dp === 2 ? int(1, 299) : int(1, 999); }, op: pick([0, 1]), side: pick([0, 1]) }, where: adOk }
    ],
    prompt: function (v) { var s = sides(v, fracTex(v), decTex(v)); return { tex: s[0] + opTex(v) + s[1], text: '계산해서 답을 소수로 쓰세요.' }; },
    solve: adAns,
    /* 검산: 정수로만 한 분수 계산과 값이 같은가 */
    verify: function (v, ans) { var s = sides(v, fracPair(v), decPair(v)); return R.same(ansPair(ans), v.op ? R.sub(s[0], s[1]) : R.add(s[0], s[1])); },
    hints: function (v) {
      return [
        '분수와 소수가 섞여 있으면 한 가지 모양으로 맞춰서 계산해요. 여기서는 분수를 소수로 고쳐요.',
        '분모 ' + v.b + '에 ' + josa(mult(v), '을/를') + ' 곱하면 ' + josa(target(v), '이/가') + ' 돼요. 분자에도 똑같이 곱해요.',
        '소수끼리 ' + (v.op ? '뺄' : '더할') + ' 때는 소수점의 자리를 맞춰요. 자릿수가 다르면 끝에 0을 붙여요.'
      ];
    },
    steps: function (v) {
      var f = fdec(v), d = given(v), s = sides(v, f, d), P = Math.max(f.p, d.p), a = s[0].n * P10(P - s[0].p), b = s[1].n * P10(P - s[1].p), r = v.op ? a - b : a + b, ans = adAns(v);
      var out = [
        { say: '분수를 소수로 고쳐요. 분모 ' + v.b + '에 ' + josa(mult(v), '을/를') + ' 곱하면 ' + josa(target(v), '이/가') + ' 되니까 분자에도 ' + josa(mult(v), '을/를') + ' 곱해요.' + (v.w ? ' 자연수 ' + josa(v.w, '은/는') + ' 소수점 앞에 써요.' : ''),
          tex: fracTex(v) + ' = ' + T(v.w, v.a * mult(v), target(v)) + ' = ' + show(f) },
        { say: (f.p !== d.p ? '소수점 아래 자릿수가 달라요. 끝에 0을 붙여 자릿수를 맞춰요. ' : '') + '소수점의 자리를 맞춰 ' + (v.op ? '빼요.' : '더해요.'),
          tex: S(a, P) + opTex(v) + S(b, P) + ' = ' + S(r, P) }
      ];
      if (ans.p !== P) out.push({ say: '소수점 아래 끝의 0은 쓰지 않아요. 답은 ' + josa(show(ans), '이에요/예요') + '.', tex: S(r, P) + ' = ' + show(ans) });
      out[out.length - 1].value = ans;
      return out;
    },
    /* ① 분자를 그대로 소수점 아래에 씀 ② 소수점이 아니라 끝자리를 맞춰 계산 ③ 더하기와 빼기를 바꿈 ④ 분수를 소수로 고치기만 함 */
    mistakes: [
      { id: 'numerator-after-point', wrong: function (v) { var s = sides(v, glue(v), given(v)); return calc(s[0], s[1], v.op); },
        explain: function (v) { return '분수 ' + rdJ(Fx(v), '을/를') + ' ' + josa(show(glue(v)), '으로/로') + ' 생각했어요. 분자를 그대로 소수점 아래에 쓸 수 있는 것은 분모가 10, 100, 1000일 때뿐이에요. 분모 ' + josa(v.b, '을/를') + ' ' + josa(target(v), '으로/로') + ' 바꾸면 ' + josa(show(fdec(v)), '이에요/예요') + '.'; } },
      { id: 'right-aligned', wrong: when(function (v) { return fdec(v).p !== v.dp; }, function (v) { var s = sides(v, fdec(v), given(v)), r = v.op ? s[0].n - s[1].n : s[0].n + s[1].n; return r > 0 ? D(r, Math.max(s[0].p, s[1].p)) : null; }),
        explain: function (v) { var f = fdec(v), d = given(v), short = f.p < d.p ? f : d, P = Math.max(f.p, d.p); return '소수점이 아니라 끝자리를 맞춰서 계산했어요. ' + josa(show(short), '은/는') + ' ' + S(short.n * P10(P - short.p), P) + '과 같아요. 소수점의 자리를 맞춰서 다시 계산해요.'; } },
      { id: 'wrong-operation', wrong: function (v) { var s = sides(v, fdec(v), given(v)); return calc(s[0], s[1], !v.op); },
        explain: function (v) { return (v.op ? '빼야 하는데 더했어요.' : '더해야 하는데 뺐어요.') + ' 식의 기호가 ' + (v.op ? '−' : '+') + '인지 다시 확인해 보세요.'; } },
      { id: 'converted-only', wrong: function (v) { var f = fdec(v); return D(f.n, f.p); },
        explain: function (v) { var s = sides(v, show(fdec(v)), decTex(v)); return josa(show(fdec(v)), '은/는') + ' 분수를 소수로 고친 값이에요. 계산이 아직 남았어요: ' + s[0] + opSay(v) + s[1] + '.'; } }
    ]
  });

  /* ── A17.add-frac 분수로 고쳐서 더하고 빼기 ─────────────
     분모가 3, 6, 9 … 인 분수(소수로 고치면 끝나지 않음) ± 소수. 소수를 분수로 고쳐서 계산한다. */
  var two = function (v) { return sides(v, Fx(v), Dx(v)); };
  var afAns = function (v) { var s = two(v); return v.op ? s[0].sub(s[1]) : s[0].add(s[1]); };
  var afOk = function (v) { var r = afAns(v); return lowest(v) && clean(v) && gt0(r) && r.d <= 60; };
  /** a ÷ b 를 소수 셋째 자리까지 쓴 글(끝나지 않는 소수를 보여 줄 때): 0.666… */
  var endless = function (a, b) { return S((a * 1000 - (a * 1000) % b) / b, 3) + '…'; };
  var FORM = '계산하세요. 답은 분수나 자연수로 써요.';
  MH.defineType({
    id: 'A17.add-frac', unit: 'A17', version: 1, title: '분수로 고쳐서 더하고 빼기',
    answer: { kind: 'fraction', whole: true, show: 'mixed' },
    levels: [
      { name: '분모가 3, 6인 분수와 소수 한 자리 수', minDistinct: 180, vars: { b: pick([3, 6]), w: 0, a: function (v) { return int(1, v.b - 1); }, dp: 1, dn: int(1, 19), op: pick([0, 1]), side: pick([0, 1]) }, where: afOk },
      { name: '분모가 7, 9, 12, 15인 분수', vars: { b: pick([3, 6, 7, 9, 9, 12, 15]), w: 0, a: function (v) { return int(1, v.b - 1); }, dp: pick([1, 1, 2]), dn: function (v) { return v.dp === 1 ? int(1, 19) : pick([25, 75, 125]); }, op: pick([0, 1]), side: pick([0, 1]) }, where: afOk },
      { name: '대분수와 1보다 큰 소수', vars: { b: pick([3, 6, 9, 12, 15]), w: pick([1, 1, 2]), a: function (v) { return int(1, v.b - 1); }, dp: pick([1, 1, 2]), dn: function (v) { return v.dp === 1 ? int(1, 39) : pick([25, 75, 125, 175, 225]); }, op: pick([0, 1]), side: pick([0, 1]) }, where: afOk }
    ],
    prompt: function (v) { var s = sides(v, fracTex(v), decTex(v)); return { tex: s[0] + opTex(v) + s[1], text: FORM }; },
    solve: function (v) { return val(afAns(v)); },
    verify: function (v, ans) { var s = sides(v, fracPair(v), decPair(v)); return R.same(ansPair(ans), v.op ? R.sub(s[0], s[1]) : R.add(s[0], s[1])); },
    hints: function (v) {
      return [
        v.b + '분의 ' + josa(v.a, '은/는') + ' 소수로 고치면 끝나지 않아요. 이럴 때는 소수를 분수로 고쳐요.',
        josa(decTex(v), '은/는') + ' 분모가 ' + P10(v.dp) + '인 분수로 쓸 수 있어요. 약분할 수 있으면 약분해요.',
        '분모가 다른 분수는 통분한 다음 분자끼리 ' + (v.op ? '빼요.' : '더해요.')
      ];
    },
    steps: function (v) {
      var d = Dx(v), s = two(v), L = lcm(s[0].d, s[1].d), ans = afAns(v), t = P10(v.dp), out = [];
      out.push({ say: v.b + '분의 ' + josa(v.a, '은/는') + ' 소수로 고치면 끝나지 않아요(' + v.a + ' ÷ ' + v.b + ' = ' + endless(v.a, v.b) + '). 그래서 소수를 분수로 고쳐요. ' + josa(decTex(v), '은/는') + ' ' + t + '분의 ' + (d.d === t ? josa(v.dn, '이에요/예요') + '.' : josa(v.dn, '이고/고') + ', 약분하면 ' + rdTopJ(d, '이에요/예요') + '.'),
        tex: decTex(v) + ' = ' + frac(v.dn, t) + (d.d === t ? '' : ' = ' + fr(d)) });
      if (v.w) out.push({ say: '대분수를 가분수로 고쳐요: ' + v.w + ' × ' + v.b + ' + ' + v.a + ' = ' + topOf(v) + '.', tex: fracTex(v) + ' = ' + frac(topOf(v), v.b) });
      out.push({ say: (s[0].d === s[1].d ? '분모가 같으니 분자끼리 ' : '분모를 ' + josa(s[0].d, '과/와') + ' ' + s[1].d + '의 최소공배수 ' + josa(L, '으로/로') + ' 통분하고 분자끼리 ') + (v.op ? '빼요.' : '더해요.') + (ans.d !== L ? ' 약분할 수 있으면 약분해요.' : ''),
        tex: addTex(s[0], s[1], v.op) });
      if (tail(ans)) out.push({ say: '가분수를 대분수로 고쳐요: ' + ans.n + ' ÷ ' + ans.d + ' = ' + (ans.n - ans.n % ans.d) / ans.d + ' … ' + ans.n % ans.d + '.', tex: fr(ans) + tail(ans) });
      out[out.length - 1].value = val(ans);
      return out;
    },
    /* ① 분자끼리 · 분모끼리 계산 ② 통분할 때 분자를 그대로 둠 ③ 더하기와 빼기를 바꿈 ④ 분수의 분자를 소수점 아래에 놓고 계산 */
    mistakes: [
      { id: 'tops-and-bottoms', wrong: function (v) { var s = two(v); return v.op ? V(s[0].n - s[1].n, s[0].d - s[1].d) : V(s[0].n + s[1].n, s[0].d + s[1].d); },
        explain: function (v) { var s = two(v); return '분자는 분자끼리, 분모는 분모끼리 ' + (v.op ? '뺐어요' : '더했어요') + '. 분모가 다른 분수는 먼저 통분해야 해요. 분모를 ' + josa(lcm(s[0].d, s[1].d), '으로/로') + ' 맞춘 다음 분자끼리만 ' + (v.op ? '빼요.' : '더해요.'); } },
      { id: 'numerators-unscaled', wrong: when(function (v) { var s = two(v); return s[0].d !== s[1].d; }, function (v) { var s = two(v); return V(v.op ? s[0].n - s[1].n : s[0].n + s[1].n, lcm(s[0].d, s[1].d)); }),
        explain: function (v) { var s = two(v), L = lcm(s[0].d, s[1].d), x = s[0].d !== L ? s[0] : s[1]; return '분모만 ' + josa(L, '으로/로') + ' 바꾸고 분자는 그대로 뒀어요. 분모에 곱한 수를 분자에도 곱해야 해요: ' + rdTop(x) + ' = ' + L + '분의 ' + x.n * (L / x.d) + '.'; } },
      { id: 'wrong-operation', wrong: function (v) { var s = two(v); return val(v.op ? s[0].add(s[1]) : s[0].sub(s[1])); },
        explain: function (v) { return (v.op ? '빼야 하는데 더했어요.' : '더해야 하는데 뺐어요.') + ' 식의 기호가 ' + (v.op ? '−' : '+') + '인지 다시 확인해 보세요.'; } },
      { id: 'numerator-after-point', wrong: function (v) { var g = glue(v), s = sides(v, F(g.n, P10(g.p)), Dx(v)); return val(v.op ? s[0].sub(s[1]) : s[0].add(s[1])); },
        explain: function (v) { return '분수 ' + rdJ(Fx(v), '을/를') + ' 소수 ' + josa(show(glue(v)), '으로/로') + ' 생각했어요. ' + v.b + '분의 ' + josa(v.a, '은/는') + ' ' + v.a + ' ÷ ' + josa(v.b, '이라서/라서') + ' 소수로는 끝나지 않아요. 소수 ' + josa(decTex(v), '을/를') + ' 분수로 고쳐서 계산해요.'; } }
    ]
  });

  /* ── A17.mul-div 분수와 소수의 곱셈 · 나눗셈 ────────────
     소수를 분수로 고쳐서 곱하거나 나눈다. op 0 곱셈, 1 나눗셈. */
  var mdAns = function (v) { var s = two(v); return v.op ? s[0].div(s[1]) : s[0].mul(s[1]); };
  var mdOk = function (v) { var r = mdAns(v); return lowest(v) && clean(v) && r.d <= 30 && r.n <= 150; };
  var mdSign = function (v) { return v.op ? ' \\div ' : ' \\times '; };
  /** 소수의 분모를 잘못 잡은 값(한 자리 소수를 100분의 …, 두 자리 소수를 10분의 …) */
  var badDp = function (v) { return v.dp === 1 ? 2 : 1; };
  MH.defineType({
    id: 'A17.mul-div', unit: 'A17', version: 1, title: '분수와 소수의 곱셈 · 나눗셈',
    answer: { kind: 'fraction', whole: true, show: 'mixed' },
    levels: [
      { name: '곱셈', minDistinct: 200, vars: { op: 0, b: int(2, 9), w: 0, a: function (v) { return int(1, v.b - 1); }, dp: 1, dn: int(1, 9), side: pick([0, 1]) }, where: mdOk },
      { name: '나눗셈', minDistinct: 200, vars: { op: 1, b: int(2, 9), w: 0, a: function (v) { return int(1, v.b - 1); }, dp: 1, dn: int(1, 9), side: pick([0, 1]) }, where: mdOk },
      { name: '대분수 · 1보다 큰 소수', vars: { op: pick([0, 1]), b: int(2, 9), w: pick([0, 1, 1, 2]), a: function (v) { return int(1, v.b - 1); }, dp: pick([1, 1, 2]), dn: function (v) { return v.dp === 1 ? int(11, 39) : pick([25, 75, 125, 175, 225]); }, side: pick([0, 1]) }, where: mdOk }
    ],
    prompt: function (v) { var s = sides(v, fracTex(v), decTex(v)); return { tex: s[0] + mdSign(v) + s[1], text: FORM }; },
    solve: function (v) { return val(mdAns(v)); },
    verify: function (v, ans) { var s = sides(v, fracPair(v), decPair(v)); return R.same(ansPair(ans), v.op ? R.div(s[0], s[1]) : R.mul(s[0], s[1])); },
    hints: function (v) {
      return [
        '곱셈과 나눗셈은 소수를 분수로 고치면 약분하면서 계산할 수 있어요.',
        josa(decTex(v), '은/는') + ' 분모가 ' + P10(v.dp) + '인 분수로 쓸 수 있어요.' + (v.w ? ' 대분수는 가분수로 고쳐요.' : ''),
        v.op ? '나눗셈은 나누는 수(뒤의 수)의 분자와 분모를 바꿔서 곱해요.' : '분자는 분자끼리, 분모는 분모끼리 곱해요.'
      ];
    },
    steps: function (v) {
      var d = Dx(v), s = two(v), ans = mdAns(v), t = P10(v.dp), out = [];
      out.push({ say: '소수를 분수로 고쳐요. ' + josa(decTex(v), '은/는') + ' ' + t + '분의 ' + (d.d === t ? josa(v.dn, '이에요/예요') + '.' : josa(v.dn, '이고/고') + ', 약분하면 ' + rdTopJ(d, '이에요/예요') + '.'),
        tex: decTex(v) + ' = ' + frac(v.dn, t) + (d.d === t ? '' : ' = ' + fr(d)) });
      if (v.w) out.push({ say: '대분수를 가분수로 고쳐요: ' + v.w + ' × ' + v.b + ' + ' + v.a + ' = ' + topOf(v) + '.', tex: fracTex(v) + ' = ' + frac(topOf(v), v.b) });
      if (v.op) out.push({ say: '나눗셈을 곱셈으로 고쳐요. 나누는 수 ' + rdTop(s[1]) + '의 분자와 분모를 바꿔서 곱해요.', tex: fr(s[0]) + ' \\div ' + fr(s[1]) + ' = ' + fr(s[0]) + ' \\times ' + fr(s[1].inverse()) });
      out.push({ say: '분자는 분자끼리, 분모는 분모끼리 곱해요.' + (ans.d !== s[0].d * (v.op ? s[1].n : s[1].d) ? ' 약분할 수 있으면 약분해요.' : ''), tex: mulTex(s[0], v.op ? s[1].inverse() : s[1]) + tail(ans), value: val(ans) });
      return out;
    },
    /* ① 나누는 수를 뒤집지 않고 곱함 ② 곱셈인데 뒤의 수를 뒤집음 ③ 나누어지는 수를 뒤집음 ④ 소수의 분모를 잘못 잡음 ⑤ 대분수의 자연수 부분을 따로 둠 */
    mistakes: [
      { id: 'not-flipped', wrong: when(function (v) { return v.op === 1; }, function (v) { var s = two(v); return val(s[0].mul(s[1])); }),
        explain: function (v) { var s = two(v); return '나누는 수를 뒤집지 않고 그대로 곱했어요. ÷ ' + rdTopJ(s[1], '은/는') + ' × ' + rdTopJ(s[1].inverse(), '으로/로') + ' 고쳐서 계산해요.'; } },
      { id: 'flipped-in-multiplication', wrong: when(function (v) { return v.op === 0; }, function (v) { var s = two(v); return val(s[0].div(s[1])); }),
        explain: function () { return '곱셈인데 뒤의 수의 분자와 분모를 바꿔서 곱했어요. 뒤집는 것은 나눗셈일 때뿐이에요. 곱셈은 그대로 분자끼리, 분모끼리 곱해요.'; } },
      { id: 'flipped-dividend', wrong: when(function (v) { return v.op === 1; }, function (v) { var s = two(v); return val(s[1].div(s[0])); }),
        explain: function () { return '앞의 수(나누어지는 수)를 뒤집었어요. 뒤집는 것은 나누는 수, 곧 ÷ 뒤에 있는 수예요.'; } },
      { id: 'denominator-wrong', wrong: function (v) { var s = sides(v, Fx(v), F(v.dn, P10(badDp(v)))); return val(v.op ? s[0].div(s[1]) : s[0].mul(s[1])); },
        explain: function (v) { return josa(decTex(v), '을/를') + ' 분모가 ' + P10(badDp(v)) + '인 분수로 고쳤어요. ' + josa(decTex(v), '은/는') + ' 소수 ' + (v.dp === 1 ? '한' : '두') + ' 자리 수라서 분모가 ' + josa(P10(v.dp), '이에요/예요') + ': ' + P10(v.dp) + '분의 ' + v.dn + '.'; } },
      { id: 'whole-separately', wrong: when(function (v) { return v.op === 0 && v.w > 0; }, function (v) { return val(F(v.w).add(F(v.a, v.b).mul(Dx(v)))); }),
        explain: function (v) { return '대분수의 자연수 ' + josa(v.w, '은/는') + ' 그대로 두고 분수 부분만 곱했어요. 대분수는 가분수(' + v.b + '분의 ' + topOf(v) + ')로 고친 다음에 곱해요.'; } }
    ]
  });

  /* ── A17.mixed 계산 순서가 있는 혼합 계산 ───────────────
     수 세 개 x, y, z (분수 { a, b } 또는 소수 { n, p }). pat 의 글자가 d 인 자리가 소수.
     form 0 · 1: x ± y × z   2 · 3: x ± y ÷ z   4 · 5: (x ± y) × z   6 · 7: (x ± y) ÷ z   (홀수는 뺄셈) */
  var isD = function (s) { return s.p !== undefined; };
  var sv = function (s) { return isD(s) ? F(s.n, P10(s.p)) : F(s.a, s.b); };
  var stex = function (s) { return isD(s) ? S(s.n, s.p) : frac(s.a, s.b); };
  var sJ = function (s, pair) { return isD(s) ? josa(S(s.n, s.p), pair) : rdJ(sv(s), pair); };
  var spair = function (s) { return isD(s) ? [s.n, P10(s.p)] : [s.a, s.b]; };
  var fracList = function (maxB) { var out = []; for (var b = 2; b <= maxB; b++) for (var a = 1; a < b; a++) if (gcd(a, b) === 1) out.push({ a: a, b: b }); return out; };
  var FR6 = fracList(6), FR9 = fracList(9);
  var DEC1 = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return { n: n, p: 1 }; });
  var DEC2 = DEC1.concat([{ n: 12, p: 1 }, { n: 15, p: 1 }, { n: 25, p: 2 }, { n: 75, p: 2 }]);
  var PATS = ['fdf', 'dff', 'ffd', 'ddf', 'dfd', 'fdd'];
  var slot = function (i, fl, dl) { return function (v) { return pick(v.pat.charAt(i) === 'd' ? dl : fl); }; };
  var minus = function (v) { return v.form % 2 === 1; };
  var isDiv = function (v) { return (v.form >> 1) % 2 === 1; };
  var paren = function (v) { return v.form >= 4; };
  /** 먼저 계산하는 부분 */
  var inner = function (v) {
    var x = sv(v.x), y = sv(v.y), z = sv(v.z);
    return paren(v) ? (minus(v) ? x.sub(y) : x.add(y)) : (isDiv(v) ? y.div(z) : y.mul(z));
  };
  var mixAns = function (v) { var i = inner(v); return paren(v) ? (isDiv(v) ? i.div(sv(v.z)) : i.mul(sv(v.z))) : (minus(v) ? sv(v.x).sub(i) : sv(v.x).add(i)); };
  /** 순서를 무시하고 계산한 값(괄호가 없으면 앞에서부터, 괄호가 있으면 괄호를 빼고) */
  var wrongOrder = function (v) {
    var x = sv(v.x), y = sv(v.y), z = sv(v.z), a, b;
    if (paren(v)) { a = isDiv(v) ? y.div(z) : y.mul(z); return minus(v) ? x.sub(a) : x.add(a); }
    b = minus(v) ? x.sub(y) : x.add(y);
    return isDiv(v) ? b.div(z) : b.mul(z);
  };
  var mixOk = function (v) { var i = inner(v), r = mixAns(v); return gt0(i) && gt0(r) && r.d <= 40 && r.n <= 200 && i.d <= 40 && i.n <= 200; };
  var pm = function (v) { return minus(v) ? ' - ' : ' + '; };
  var td = function (v) { return isDiv(v) ? ' \\div ' : ' \\times '; };
  var mixTex = function (v, f) { return paren(v) ? '\\left(' + f(v.x) + pm(v) + f(v.y) + '\\right)' + td(v) + f(v.z) : f(v.x) + pm(v) + f(v.y) + td(v) + f(v.z); };
  var tdSay = function (v) { return isDiv(v) ? ' ÷ ' : ' × '; };
  var mixLevel = function (forms, fl, dl) { return { vars: { form: pick(forms), pat: pick(PATS), x: slot(0, fl, dl), y: slot(1, fl, dl), z: slot(2, fl, dl) }, where: mixOk }; };
  var named = function (name, lv) { lv.name = name; return lv; };
  MH.defineType({
    id: 'A17.mixed', unit: 'A17', version: 1, title: '분수와 소수의 혼합 계산',
    answer: { kind: 'fraction', whole: true, show: 'mixed' },
    levels: [
      named('곱셈이 섞인 식', mixLevel([0, 1], FR6, DEC1)),
      named('나눗셈이 섞인 식', mixLevel([2, 3], FR6, DEC1)),
      named('괄호가 있는 식', mixLevel([4, 5, 6, 7], FR9, DEC2))
    ],
    prompt: function (v) { return { tex: mixTex(v, stex), text: FORM }; },
    solve: function (v) { return val(mixAns(v)); },
    /* 검산: 정수로만 한 분수 계산과 값이 같은가 */
    verify: function (v, ans) {
      var x = spair(v.x), y = spair(v.y), z = spair(v.z), pmOp = minus(v) ? R.sub : R.add, tdOp = isDiv(v) ? R.div : R.mul;
      return R.same(ansPair(ans), paren(v) ? tdOp(pmOp(x, y), z) : pmOp(x, tdOp(y, z)));
    },
    hints: function (v) {
      return [
        '소수를 모두 분수로 고치면 어떤 식이든 계산할 수 있어요.',
        paren(v) ? '괄호가 있으면 괄호 안을 가장 먼저 계산해요.' : (isDiv(v) ? '나눗셈' : '곱셈') + '은 덧셈 · 뺄셈보다 먼저 계산해요.',
        paren(v) ? '괄호 안을 통분해서 ' + (minus(v) ? '뺀' : '더한') + ' 다음, 그 값' + (isDiv(v) ? '을 ' + sJ(v.z, '으로/로') + ' 나눠요.' : '에 ' + sJ(v.z, '을/를') + ' 곱해요.')
          : '먼저 ' + sJ(v.y, '/') + tdSay(v) + sJ(v.z, '을/를') + ' 계산하고, 그 값을 ' + sJ(v.x, '/') + (minus(v) ? '에서 빼요.' : '에 더해요.')
      ];
    },
    steps: function (v) {
      var x = sv(v.x), y = sv(v.y), z = sv(v.z), i = inner(v), ans = mixAns(v), seen = {}, decs = [v.x, v.y, v.z].filter(function (s) { var key = isD(s) && show(s); if (!key || seen[key]) return false; seen[key] = 1; return true; });
      var out = [
        { say: '소수를 분수로 고쳐요. ' + decs.map(function (s, i) { return josa(show(s), '은/는') + ' ' + (i === decs.length - 1 ? rdTopJ(sv(s), '이에요/예요') : rdTopJ(sv(s), '이고/고')); }).join(', ') + '.',
          tex: decs.map(function (s) { var t = P10(s.p), q = sv(s); return show(s) + ' = ' + frac(s.n, t) + (q.d === t ? '' : ' = ' + fr(q)); }).join(',\\quad ') },
        { say: '분수로 다시 쓴 식이에요. ' + (paren(v) ? '괄호 안을 가장 먼저 계산해요.' : (isDiv(v) ? '나눗셈' : '곱셈') + '을 덧셈 · 뺄셈보다 먼저 계산해요.'), tex: mixTex(v, function (s) { return fr(sv(s)); }) }
      ];
      if (paren(v)) {
        out.push({ say: '괄호 안을 계산해요. ' + (x.d === y.d ? '분모가 같으니 분자끼리 ' : '분모를 ' + josa(lcm(x.d, y.d), '으로/로') + ' 통분하고 분자끼리 ') + (minus(v) ? '빼요.' : '더해요.'), tex: addTex(x, y, minus(v)) });
        out.push({ say: isDiv(v) ? '그 값을 ' + rdTopJ(z, '으로/로') + ' 나눠요. 나누는 수의 분자와 분모를 바꿔서 곱해요.' : '그 값에 ' + rdTopJ(z, '을/를') + ' 곱해요.', tex: (isDiv(v) ? divTex(i, z) : mulTex(i, z)) + tail(ans), value: val(ans) });
      } else {
        out.push({ say: isDiv(v) ? '나눗셈부터 계산해요. 나누는 수의 분자와 분모를 바꿔서 곱해요.' : '곱셈부터 계산해요. 분자는 분자끼리, 분모는 분모끼리 곱해요.', tex: isDiv(v) ? divTex(y, z) : mulTex(y, z) });
        out.push({ say: '그 값을 ' + rdTop(x) + (minus(v) ? '에서 빼요. ' : '에 더해요. ') + (x.d === i.d ? '분모가 같아요.' : '분모를 ' + josa(lcm(x.d, i.d), '으로/로') + ' 통분해요.'), tex: addTex(x, i, minus(v)) + tail(ans), value: val(ans) });
      }
      return out;
    },
    /* ① 계산 순서를 무시함 ② 나누는 수를 뒤집지 않음 ③ 먼저 계산하는 부분만 답함 ④ 더하기와 빼기를 바꿈 */
    mistakes: [
      { id: 'order-ignored', wrong: function (v) { return val(wrongOrder(v)); },
        explain: function (v) {
          return paren(v) ? '괄호를 빼고 계산했어요. 괄호가 있으면 괄호 안의 ' + sJ(v.x, '/') + (minus(v) ? ' − ' : ' + ') + sJ(v.y, '을/를') + ' 가장 먼저 계산해요.'
            : '앞에서부터 차례로 계산했어요. ' + (isDiv(v) ? '나눗셈' : '곱셈') + '은 덧셈 · 뺄셈보다 먼저 계산해요. ' + sJ(v.y, '/') + tdSay(v) + sJ(v.z, '/') + '부터 계산해요.';
        } },
      { id: 'not-flipped', wrong: when(isDiv, function (v) { var i = inner(v), x = sv(v.x), y = sv(v.y), z = sv(v.z); return val(paren(v) ? i.mul(z) : (minus(v) ? x.sub(y.mul(z)) : x.add(y.mul(z)))); }),
        explain: function (v) { return '나눗셈을 곱셈으로 고칠 때 나누는 수 ' + sJ(v.z, '을/를') + ' 뒤집지 않았어요. 나누는 수를 분수로 고친 다음 분자와 분모를 바꿔서 곱해요.'; } },
      { id: 'first-part-only', wrong: function (v) { return val(inner(v)); },
        explain: function (v) {
          return paren(v) ? '괄호 안만 계산했어요. 이 값' + (isDiv(v) ? '을 ' + sJ(v.z, '으로/로') + ' 나눠야' : '에 ' + sJ(v.z, '을/를') + ' 곱해야') + ' 답이 돼요.'
            : sJ(v.y, '/') + tdSay(v) + sJ(v.z, '/') + '까지만 계산했어요. 이 값을 ' + sJ(v.x, '/') + (minus(v) ? '에서 빼야' : '에 더해야') + ' 답이 돼요.';
        } },
      { id: 'wrong-sign', wrong: function (v) {
        var x = sv(v.x), y = sv(v.y), z = sv(v.z), i = inner(v), b;
        if (!paren(v)) return val(minus(v) ? x.add(i) : x.sub(i));
        b = minus(v) ? x.add(y) : x.sub(y);
        return val(isDiv(v) ? b.div(z) : b.mul(z));
      },
        explain: function (v) { return (minus(v) ? '빼야 하는데 더했어요.' : '더해야 하는데 뺐어요.') + ' 식의 기호가 ' + (minus(v) ? '−' : '+') + '인지 다시 확인해 보세요.'; } }
    ]
  });

  /* ── A17.word 분수와 소수가 섞인 문장제 ─────────────────
     k 0 더하기 · 빼기, 1 곱하기, 2 나누기. s 는 상황. fd 가 1 이면 분수와 소수의 자리를 바꾼다. 답은 소수(또는 자연수). */
  var ADD = [
    { unit: 'L', minus: 0, text: function (A, B) { return '물통에 물이 ' + A + ' L 들어 있어요. 여기에 물 ' + B + ' L를 더 부었어요. 물통의 물은 모두 몇 L일까요?'; } },
    { unit: 'm', minus: 1, text: function (A, B) { return '끈 ' + A + ' m 가운데 ' + B + ' m를 썼어요. 남은 끈은 몇 m일까요?'; } },
    { unit: 'km', minus: 0, text: function (A, B) { return '집에서 서점까지는 ' + A + ' km이고, 서점에서 도서관까지는 ' + B + ' km예요. 집에서 서점을 지나 도서관까지 가는 거리는 몇 km일까요?'; } },
    { unit: 'kg', minus: 1, text: function (A, B) { return '밀가루 ' + A + ' kg 가운데 ' + B + ' kg을 썼어요. 남은 밀가루는 몇 kg일까요?'; } }
  ];
  var MUL = [
    { unit: 'kg', how: '(1 m의 무게) × (길이)', text: function (A, B) { return '1 m의 무게가 ' + A + ' kg인 철사가 있어요. 이 철사 ' + B + ' m의 무게는 몇 kg일까요?'; } },
    { unit: 'L', how: '(1분에 나오는 양) × (시간)', text: function (A, B) { return '1분에 물이 ' + A + ' L씩 나오는 수도가 있어요. ' + B + '분 동안 나오는 물은 몇 L일까요?'; } },
    { unit: 'm²', how: '(가로) × (세로)', text: function (A, B) { return '가로가 ' + A + ' m, 세로가 ' + B + ' m인 직사각형 모양의 텃밭이 있어요. 텃밭의 넓이는 몇 m²일까요?'; } },
    { unit: 'km', how: '(1분에 가는 거리) × (시간)', text: function (A, B) { return '1분에 ' + A + ' km를 달리는 기차가 있어요. 이 기차가 ' + B + '분 동안 달린 거리는 몇 km일까요?'; } }
  ];
  var DIV = [
    { unit: '컵', how: '(전체 양) ÷ (한 컵의 양)', text: function (X, Y) { return '주스 ' + X + ' L를 한 컵에 ' + Y + ' L씩 나누어 담아요. 모두 몇 컵이 될까요?'; } },
    { unit: 'm', how: '(넓이) ÷ (가로)', text: function (X, Y) { return '넓이가 ' + X + ' m²인 직사각형이 있어요. 가로가 ' + Y + ' m일 때 세로는 몇 m일까요?'; } },
    { unit: '도막', how: '(전체 길이) ÷ (한 도막의 길이)', text: function (X, Y) { return '리본 ' + X + ' m를 ' + Y + ' m씩 잘랐어요. 모두 몇 도막이 될까요?'; } },
    { unit: 'km', how: '(거리) ÷ (시간)', text: function (X, Y) { return Y + '시간 동안 ' + X + ' km를 걸었어요. 같은 빠르기로 한 시간에는 몇 km를 걸을까요?'; } }
  ];
  var story = function (v) { return (v.k === 0 ? ADD : v.k === 1 ? MUL : DIV)[v.s]; };
  var inText = function (tex) { return '$' + tex + '$'; };
  /* k 2: 나누는 수 Y = 분수 w a/b, 몫 q = qn ÷ 10^qp, 나누어지는 수 X = Y × q */
  var quot = function (v) { return F(v.qn, P10(v.qp)); };
  var dividend = function (v) { return Fx(v).mul(quot(v)); };
  /** 문제에 나오는 두 수 [앞, 뒤] 의 값(Fraction), 수식, 글 */
  var wordVals = function (v) {
    if (v.k === 2) return [dividend(v), Fx(v)];
    return v.fd ? [Dx(v), Fx(v)] : [Fx(v), Dx(v)];
  };
  var wordTex = function (v) {
    if (v.k === 2) return v.fd ? [mx(dividend(v)), show(fdec(v))] : [show(asDec(dividend(v))), fracTex(v)];
    return v.fd ? [decTex(v), fracTex(v)] : [fracTex(v), decTex(v)];
  };
  /** 화면의 문제 글에 넣는 모양: 분수는 $ … $ 로 감싼다 */
  var wordShown = function (v) { return wordTex(v).map(function (t) { return /dfrac/.test(t) ? inText(t) : t; }); };
  var wordOp = function (v) { return v.k === 0 ? (ADD[v.s].minus ? ' - ' : ' + ') : v.k === 1 ? ' \\times ' : ' \\div '; };
  var wordQ = function (v) {
    var s = wordVals(v);
    return v.k === 0 ? (ADD[v.s].minus ? s[0].sub(s[1]) : s[0].add(s[1])) : v.k === 1 ? s[0].mul(s[1]) : s[0].div(s[1]);
  };
  var wordAns = function (v) { return asDec(wordQ(v)); };
  var places = function (q) { var d = asDec(q); return d ? d.p : 9; };
  var wordOk = function (v) {
    if (!lowest(v)) return false;
    if (v.k === 2) {
      var X = dividend(v);
      if (v.qp === 1 && v.qn % 10 === 0) return false;
      if (v.s % 2 === 0 && X.compare(9) > 0) return false;
      return v.fd ? [2, 4, 5].indexOf(X.d) >= 0 && fdec(v).p <= 2 : X.d !== 1 && places(X) <= 2;
    }
    if (!clean(v)) return false;
    var r = wordQ(v);
    return gt0(r) && places(r) <= 2 && r.d !== 1;
  };
  var wordFrac = { b: pick([2, 4, 5]), w: pick([0, 0, 1, 2]), a: function (v) { return int(1, v.b - 1); } };
  /** 분수 답을 소수로 고치는 한 줄 수식 */
  var toDecTex = function (q) {
    var d = asDec(q), k = placesOf(q.d), m = P10(k) / q.d;
    return fr(q) + (m === 1 ? '' : ' = ' + frac(q.n * m, P10(k))) + ' = ' + show(d);
  };
  var UNIT_READ = { L: '리터', m: '미터', km: '킬로미터', kg: '킬로그램', 'm²': '제곱미터' };
  /** '1.8 kg이에요' — 조사는 단위를 읽는 소리에 맞춘다 */
  var withUnit = function (ans, unit) { var w = UNIT_READ[unit] || unit; return show(ans) + (UNIT_READ[unit] ? ' ' : '') + unit + josa(w, '이에요/예요').slice(w.length); };
  /** 문제에 보이는 수(수식 글자 t, 값 q)를 가분수로 고치는 한 줄 수식. 이미 진분수면 null */
  var convTex = function (t, q) {
    if (/dfrac/.test(t)) return t === fr(q) ? null : t + ' = ' + fr(q);
    var f = (t.split('.')[1] || ''), n = Number(t.replace('.', '')), ten = P10(f.length);
    return t + ' = ' + frac(n, ten) + (q.d === ten ? '' : ' = ' + fr(q));
  };
  MH.defineType({
    id: 'A17.word', unit: 'A17', version: 1, title: '분수와 소수가 섞인 문장제',
    answer: { kind: 'decimal', suffix: function (v) { return story(v).unit; } },
    levels: [
      { name: '더하기 · 빼기', vars: { k: 0, s: pick([0, 1, 2, 3]), fd: pick([0, 1]), b: wordFrac.b, w: wordFrac.w, a: wordFrac.a, dp: pick([1, 1, 2]), dn: function (v) { return v.dp === 1 ? int(3, 39) : int(5, 395); } }, where: function (v) { return wordOk(v) && (v.dp === 1 || v.dn % 5 === 0); } },
      { name: '곱하기', vars: { k: 1, s: pick([0, 1, 2, 3]), fd: pick([0, 1]), b: wordFrac.b, w: wordFrac.w, a: wordFrac.a, dp: 1, dn: int(2, 48) }, where: wordOk },
      { name: '나누기', minDistinct: 150, vars: { k: 2, s: pick([0, 1, 2, 3]), fd: pick([0, 0, 1]), b: wordFrac.b, w: pick([0, 0, 1]), a: wordFrac.a, qp: function (v) { return v.s % 2 === 0 ? 0 : 1; }, qn: function (v) { return v.s % 2 === 0 ? int(2, 12) : int(11, 49); } }, where: wordOk }
    ],
    prompt: function (v) { var t = wordShown(v), whole = v.k === 2 && v.s % 2 === 0; return { text: story(v).text(t[0], t[1]) + (whole ? '' : ' 답은 소수로 써요.') }; },
    solve: wordAns,
    /* 검산: 정수로만 한 분수 계산과 값이 같은가(나눗셈은 몫 × 나누는 수 = 나누어지는 수) */
    verify: function (v, ans) {
      var a = ansPair(ans), f = fracPair(v);
      if (v.k === 2) return R.same(a, [v.qn, P10(v.qp)]) && R.same(R.mul(a, f), [dividend(v).n, dividend(v).d]);
      var d = decPair(v), s = v.fd ? [d, f] : [f, d];
      return R.same(a, v.k === 1 ? R.mul(s[0], s[1]) : ADD[v.s].minus ? R.sub(s[0], s[1]) : R.add(s[0], s[1]));
    },
    hints: function (v) {
      if (v.k === 0) return [
        ADD[v.s].minus ? '쓰고 남은 양을 구하니까 뺄셈이에요.' : '모두 합한 양을 구하니까 덧셈이에요.',
        '분수를 소수로 고쳐요. 분모 ' + v.b + '에 ' + josa(mult(v), '을/를') + ' 곱하면 ' + josa(target(v), '이/가') + ' 돼요.',
        '소수점의 자리를 맞춰서 계산해요.'
      ];
      if (v.k === 1) return [
        MUL[v.s].how + '의 곱셈식을 세워요.',
        '소수를 분수로 고치면 약분하면서 곱할 수 있어요.',
        '분수로 나온 답은 분모를 10이나 100으로 바꿔서 소수로 써요.'
      ];
      return [
        DIV[v.s].how + '의 나눗셈식을 세워요.',
        '소수를 분수로 고친 다음, 나누는 수의 분자와 분모를 바꿔서 곱해요.',
        v.s % 2 === 0 ? '계산한 값이 자연수로 나오는지 확인해요.' : '분수로 나온 답은 소수로 고쳐서 써요.'
      ];
    },
    steps: function (v) {
      var t = wordTex(v), s = wordVals(v), ans = wordAns(v), q = wordQ(v), unit = story(v).unit, out = [], f, d, P, a, b, r;
      var fin = ' 답은 ' + withUnit(ans, unit) + '.';
      if (v.k === 0) {
        f = fdec(v); d = given(v); P = Math.max(f.p, d.p);
        a = (v.fd ? d : f); b = (v.fd ? f : d); r = ADD[v.s].minus ? a.n * P10(P - a.p) - b.n * P10(P - b.p) : a.n * P10(P - a.p) + b.n * P10(P - b.p);
        out.push({ say: (ADD[v.s].minus ? '쓰고 남은 양을 구하니까 빼요.' : '모두 합한 양을 구하니까 더해요.') + ' 식을 세워요.', tex: t[0] + wordOp(v) + t[1] });
        out.push({ say: '분수를 소수로 고쳐요. 분모 ' + v.b + '에 ' + josa(mult(v), '을/를') + ' 곱하면 ' + josa(target(v), '이/가') + ' 되니까 분자에도 ' + josa(mult(v), '을/를') + ' 곱해요.', tex: fracTex(v) + ' = ' + T(v.w, v.a * mult(v), target(v)) + ' = ' + show(f) });
        out.push({ say: '소수점의 자리를 맞춰 ' + (ADD[v.s].minus ? '빼요.' : '더해요.') + fin, tex: S(a.n * P10(P - a.p), P) + wordOp(v) + S(b.n * P10(P - b.p), P) + ' = ' + S(r, P) + (ans.p !== P ? ' = ' + show(ans) : ''), value: ans });
        return out;
      }
      out.push({ say: (v.k === 1 ? MUL : DIV)[v.s].how + '의 식을 세워요.', tex: t[0] + wordOp(v) + t[1] });
      out.push({ say: '소수를 분수로 고쳐요.' + (v.w ? ' 대분수는 가분수로 고쳐요.' : ''), tex: t.map(function (x, i) { return convTex(x, s[i]); }).filter(function (x) { return x; }).join(',\\quad ') });
      out.push({ say: v.k === 1 ? '분자는 분자끼리, 분모는 분모끼리 곱하고 약분해요.' : '나누는 수의 분자와 분모를 바꿔서 곱해요.', tex: v.k === 1 ? mulTex(s[0], s[1]) : divTex(s[0], s[1]) });
      if (q.d !== 1) out.push({ say: '분수를 소수로 고쳐요.' + fin, tex: toDecTex(q) });
      else out[out.length - 1].say += fin;
      out[out.length - 1].value = ans;
      return out;
    },
    /* ① 더하기와 빼기를 바꿈 ② 분자를 그대로 소수점 아래에 씀 ③ 곱해야 하는데 더함 ④ 나눠야 하는데 곱함 ⑤ 나누는 수의 분모만 곱함 ⑥ 나눗셈의 순서를 바꿈 */
    mistakes: [
      { id: 'wrong-operation', wrong: when(function (v) { return v.k === 0; }, function (v) { var s = wordVals(v); return asDec(ADD[v.s].minus ? s[0].add(s[1]) : s[0].sub(s[1])); }),
        explain: function (v) { return ADD[v.s].minus ? '빼야 하는데 더했어요. 쓰고 남은 양을 묻고 있으니 처음 양에서 쓴 양을 빼요.' : '더해야 하는데 뺐어요. 모두 합한 양을 묻고 있으니 두 양을 더해요.'; } },
      { id: 'numerator-after-point', wrong: when(function (v) { return v.k < 2; }, function (v) {
        var g = glue(v), G = F(g.n, P10(g.p)), s = v.fd ? [Dx(v), G] : [G, Dx(v)];
        return asDec(v.k === 1 ? s[0].mul(s[1]) : ADD[v.s].minus ? s[0].sub(s[1]) : s[0].add(s[1]));
      }),
        explain: function (v) { return '분수 ' + rdJ(Fx(v), '을/를') + ' ' + josa(show(glue(v)), '으로/로') + ' 생각했어요. 분자를 그대로 소수점 아래에 쓸 수 있는 것은 분모가 10, 100일 때뿐이에요. 분모 ' + josa(v.b, '을/를') + ' ' + josa(target(v), '으로/로') + ' 바꾸면 ' + josa(show(fdec(v)), '이에요/예요') + '.'; } },
      { id: 'added-instead', wrong: when(function (v) { return v.k === 1; }, function (v) { return asDec(Fx(v).add(Dx(v))); }),
        explain: function (v) { return '두 수를 더했어요. ' + MUL[v.s].how + ' 식으로 구하는 문제라서 곱해야 해요.'; } },
      { id: 'multiplied-instead', wrong: when(function (v) { return v.k === 2; }, function (v) { return asDec(dividend(v).mul(Fx(v))); }),
        explain: function (v) { return '두 수를 곱했어요. ' + DIV[v.s].how + ' 식으로 구하는 문제라서 나눠야 해요. 나누는 수의 분자와 분모를 바꿔서 곱해요.'; } },
      { id: 'numerator-forgotten', wrong: when(function (v) { return v.k === 2 && !v.fd && topOf(v) > 1; }, function (v) { return asDec(dividend(v).mul(v.b)); }),
        explain: function (v) { return '분모 ' + josa(v.b, '만/만') + ' 곱하고 분자 ' + josa(topOf(v), '으로/로') + ' 나누지 않았어요. ÷ ' + v.b + '분의 ' + josa(topOf(v), '은/는') + ' × ' + topOf(v) + '분의 ' + josa(v.b, '이에요/예요') + '.'; } },
      { id: 'reversed-division', wrong: when(function (v) { return v.k === 2; }, function (v) { return asDec(Fx(v).div(dividend(v))); }),
        explain: function (v) { return '나눗셈의 순서가 바뀌었어요. ' + DIV[v.s].how + '의 순서로 나눠요. 앞의 수가 나누어지는 수예요.'; } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('A17', [
  { title: '분수와 소수가 섞이면 — 한 가지 꼴로 통일', body: [
    '분수와 소수는 그대로는 함께 계산할 수 없어요. 둘 다 소수로 고치거나, 둘 다 분수로 고친 다음 계산해요.',
    { ex: [['소수로 통일', '분모가 2, 4, 5, 8, 20, 25 …처럼 소수로 딱 떨어질 때 편해요'], ['분수로 통일', '분모가 3, 6, 7, 9 …이거나 곱셈 · 나눗셈일 때 편해요']] }
  ] },
  { title: '소수로 고쳐서 계산하기', body: [
    { tex: '\\dfrac{1}{4} + 0.5 = 0.25 + 0.5 = 0.75' },
    { list: ['① 분수를 소수로 고쳐요: $\\dfrac{1}{4} = \\dfrac{25}{100} = 0.25$.', '② 소수점의 줄을 맞춰 더하거나 빼요.'] },
    '덧셈과 뺄셈에서, 분수가 소수로 딱 떨어질 때 쓰기 좋은 방법이에요.'
  ] },
  { title: '분수로 고쳐서 계산하기', body: [
    '$\\dfrac{1}{3}$은 소수로 쓰면 0.333…으로 끝나지 않아요. 이럴 때는 소수 쪽을 분수로 고쳐요.',
    { tex: '0.5 + \\dfrac{1}{3} = \\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{3}{6} + \\dfrac{2}{6} = \\dfrac{5}{6}' },
    '곱셈과 나눗셈은 분수로 고치면 약분이 되어서 훨씬 쉬워요.',
    { tex: '1.5 \\div 0.75 = \\dfrac{3}{2} \\div \\dfrac{3}{4} = \\dfrac{3}{2} \\times \\dfrac{4}{3} = 2' }
  ] },
  { title: '계산 순서는 그대로', body: [
    { list: ['① 괄호 안 먼저', '② 곱셈 · 나눗셈', '③ 덧셈 · 뺄셈', '④ 같은 단계끼리는 왼쪽부터'] },
    { tex: '\\left(\\dfrac{3}{8} + 0.25\\right) \\div 0.5 = \\dfrac{5}{8} \\div \\dfrac{1}{2} = \\dfrac{5}{4}' },
    '지금까지 배운 분수, 소수, 계산 순서를 한꺼번에 쓰는 단원이에요. 한 줄에 한 가지씩만 계산해요.'
  ] }
]);
