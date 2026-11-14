/* A11 분수의 곱셈 — (분수)×(자연수), (분수)×(분수), 계산 중 약분, 대분수의 곱셈, 전체의 몇 분의 몇
   유형(쉬운 것부터): A11.by-whole 분수와 자연수의 곱 · A11.frac 분수끼리의 곱 · A11.cancel 곱하기 전에 약분
                     · A11.mixed 대분수의 곱 · A11.of 전체의 몇 분의 몇(문장제)
   분수로 답하는 유형의 답은 기약분수 { n, d }. 값이 같으면 가분수로 써도 대분수로 써도 정답이고, 약분이 덜 됐으면 알려 주기만 한다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F, gcd = MH.gcd;

  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  /** 대분수 꼴 수식: 자연수 w, 분자 n, 분모 d (w 가 0 이면 분수만) */
  var T = function (w, n, d) { return (w ? w : '') + frac(n, d); };
  /** 글로 읽는 분수: 4분의 3. 조사는 마지막에 읽는 분자에 맞춘다. */
  var read = function (n, d) { return d + '분의 ' + n; };
  var readJ = function (n, d, pair) { return d + '분의 ' + josa(n, pair); };
  var readM = function (w, n, d) { return (w ? josa(w, '과/와') + ' ' : '') + read(n, d); };
  /** 수 뒤에 붙는 조사만: 3 → '을', 4 → '를' */
  var particle = function (n, pair) { return josa(n, pair).slice(String(n).length); };
  var reduce = function (n, d) { var g = gcd(n, d); return { n: n / g, d: d / g }; };
  /** 오답 값(만들 수 없으면 null) */
  var V = function (n, d) { return n > 0 && d > 0 ? { n: n, d: d } : null; };
  var when = function (test, make) { return function (v) { return test(v) ? make(v) : null; }; };
  var all = function () { var tests = [].slice.call(arguments); return function (v) { return tests.every(function (t) { return t(v); }); }; };
  var WHOLE = { kind: 'fraction', whole: true, show: 'mixed' }, PLAIN = { kind: 'fraction' };
  /* 검산: 정확한 분수 계산으로 인수들을 곱한 값과 같고, 기약분수인가 */
  var verifyProduct = function (factors) {
    return function (v, ans) {
      var p = factors(v).reduce(function (acc, f) { return acc.mul(F(f[0], f[1])); }, F(1, 1));
      return gcd(ans.n, ans.d) === 1 && p.equals(F(ans.n, ans.d));
    };
  };
  /** 풀이의 끝: 약분하고, 가분수이면 대분수로 바꾼다. 마지막 단계에 답을 붙인다. */
  var finish = function (out, n, d) {
    var g = gcd(n, d);
    if (g > 1) { out.push({ say: '분자 ' + josa(n, '과/와') + ' 분모 ' + josa(d, '을/를') + ' ' + josa(g, '으로/로') + ' 나눠 약분해요.', tex: frac(n, d) + ' = ' + frac(n / g, d / g) }); n /= g; d /= g; }
    if (n > d) { var r = n % d, w = (n - r) / d; out.push({ say: '분자가 분모보다 커요. ' + n + ' ÷ ' + d + ' = ' + w + ' … ' + r + '이니까 대분수로 쓰면 ' + josa(w, '과/와') + ' ' + readJ(r, d, '이에요/예요') + '.', tex: frac(n, d) + ' = ' + T(w, r, d) }); }
    out[out.length - 1].value = { n: n, d: d };
    return out;
  };
  /** 곱하기 전에 약분: 분자 하나와 분모 하나를 골라 함께 나눈다. 돌려주는 것: 약분한 뒤의 분자들 · 분모들 · 한 일의 목록 */
  var cancel = function (ns, ds) {
    ns = ns.slice(); ds = ds.slice(); var did = [];
    for (var i = 0; i < ns.length; i++) for (var j = 0; j < ds.length; j++) {
      var g = gcd(ns[i], ds[j]);
      if (g > 1) { did.push({ i: i, j: j, n: ns[i], d: ds[j], g: g }); ns[i] /= g; ds[j] /= g; }
    }
    return { ns: ns, ds: ds, did: did };
  };
  var product = function (list) { return list.reduce(function (a, b) { return a * b; }, 1); };
  /* 약분해서 분모가 1 이 된 인수는 자연수로 쓴다 */
  var exprTex = function (ns, ds) { return ns.map(function (n, i) { return ds[i] === 1 ? String(n) : frac(n, ds[i]); }).join(' \\times '); };
  /** 약분 단계와 곱셈 단계를 붙인다 */
  var cancelSteps = function (out, ns, ds) {
    var c = cancel(ns, ds), curN = ns.slice(), curD = ds.slice();
    c.did.forEach(function (x, at) {
      var before = exprTex(curN, curD);
      curN[x.i] = x.n / x.g; curD[x.j] = x.d / x.g;
      out.push({ say: (at ? '한 번 더 약분해요. ' : '곱하기 전에 약분해요. ') + '분자 ' + josa(x.n, '과/와') + ' 분모 ' + josa(x.d, '을/를') + ' ' + josa(x.g, '으로/로') + ' 나눠요: ' + x.n + ' ÷ ' + x.g + ' = ' + x.n / x.g + ', ' + x.d + ' ÷ ' + x.g + ' = ' + x.d / x.g + '.', tex: before + ' = ' + exprTex(curN, curD) });
    });
    var N = product(c.ns), D = product(c.ds);
    out.push({ say: (c.did.length ? '남은 수로 ' : '') + '분자는 분자끼리, 분모는 분모끼리 곱해요: 분자 ' + c.ns.join(' × ') + ' = ' + N + ', 분모 ' + c.ds.join(' × ') + ' = ' + D + '.', tex: exprTex(c.ns, c.ds) + ' = ' + frac(N, D) });
    return finish(out, N, D);
  };

  /* ── A11.by-whole (분수)×(자연수), (자연수)×(분수) ────────
     (w 와 a/b) × k. first 가 1 이면 분수가 앞, 0 이면 자연수가 앞. */
  var top = function (v) { return v.w * v.b + v.a; };
  var notWhole = function (v) { return (top(v) * v.k) % v.b !== 0; };
  var properAB = function (v) { return gcd(v.a, v.b) === 1; };
  /** 식을 글로: 4분의 3 × 6은 / 6 × 4분의 3은 */
  var timesSay = function (v) { return v.first ? read(v.a, v.b) + ' × ' + josa(v.k, '은/는') : v.k + ' × ' + readJ(v.a, v.b, '은/는'); };
  var byWholeVars = function (w, b, k, first) { return { w: w, b: b, a: function (v) { return int(1, v.b - 1); }, k: k, first: first }; };
  MH.defineType({
    id: 'A11.by-whole', unit: 'A11', version: 1, title: '분수와 자연수의 곱',
    answer: WHOLE,
    levels: [
      { name: '진분수 × 자연수', minDistinct: 120, vars: byWholeVars(0, int(2, 9), int(2, 9), 1), where: all(properAB, notWhole, function (v) { return gcd(v.k, v.b) === 1; }) },
      { name: '약분이 필요한 곱', minDistinct: 100, vars: byWholeVars(0, int(4, 12), int(2, 9), pick([0, 1])), where: all(properAB, notWhole, function (v) { return gcd(v.k, v.b) > 1; }) },
      { name: '대분수 × 자연수', minDistinct: 200, vars: byWholeVars(int(1, 3), int(2, 6), int(2, 6), pick([0, 1])), where: all(properAB, notWhole) }
    ],
    prompt: function (v) { var t = T(v.w, v.a, v.b); return { tex: v.first ? t + ' \\times ' + v.k : v.k + ' \\times ' + t }; },
    solve: function (v) { return reduce(top(v) * v.k, v.b); },
    verify: verifyProduct(function (v) { return [[top(v), v.b], [v.k, 1]]; }),
    hints: function (v) {
      if (v.w) return [
        '대분수는 먼저 가분수로 바꾸면 계산하기 쉬워요.',
        '가분수의 분자는 자연수 × 분모 + 분자예요: ' + v.w + ' × ' + v.b + ' + ' + v.a + '.',
        '가분수의 분자에만 ' + josa(v.k, '을/를') + ' 곱해요. 분모는 그대로예요.'
      ];
      return [
        timesSay(v) + ' ' + readJ(v.a, v.b, '을/를') + ' ' + v.k + '번 더한 것과 같아요.',
        '자연수는 분자에만 곱해요. 분모는 조각의 크기라서 바뀌지 않아요.',
        '분자는 ' + v.a + ' × ' + josa(v.k, '이에요/예요') + '. 계산한 뒤 약분할 수 있는지, 가분수이면 대분수로 바꿀 수 있는지 확인해요.'
      ];
    },
    steps: function (v) {
      var n = top(v), out = [], t = T(v.w, v.a, v.b);
      if (v.w) out.push({ say: '대분수를 가분수로 바꿔요. 분자는 ' + v.w + ' × ' + v.b + ' + ' + v.a + ' = ' + josa(n, '이에요/예요') + '.', tex: t + ' = ' + frac(n, v.b) });
      else out.push({ say: timesSay(v) + ' ' + readJ(v.a, v.b, '을/를') + ' ' + v.k + '번 더한 것과 같아요. ' + readJ(1, v.b, '이/가') + ' 모두 ' + v.a + ' × ' + v.k + ' = ' + v.a * v.k + '개예요.' });
      out.push({ say: '자연수는 분자에만 곱해요. 분모는 그대로 ' + josa(v.b, '이에요/예요') + ': ' + n + ' × ' + v.k + ' = ' + n * v.k + '.', tex: (v.first ? frac(n, v.b) + ' \\times ' + v.k : v.k + ' \\times ' + frac(n, v.b)) + ' = ' + frac(n + ' \\times ' + v.k, v.b) + ' = ' + frac(n * v.k, v.b) });
      return finish(out, n * v.k, v.b);
    },
    /* ① 분모에도 곱함 ② 분모에만 곱함 ③ 분자에 더함 ④ (대분수) 자연수 부분에만 곱함 ⑤ (대분수) 분수 부분에만 곱함 */
    mistakes: [
      { id: 'both-multiplied', wrong: when(function (v) { return !v.w; }, function (v) { return V(v.a * v.k, v.b * v.k); }),
        explain: function (v) { return '분자와 분모에 모두 ' + josa(v.k, '을/를') + ' 곱했어요. 그러면 크기가 그대로예요(크기가 같은 분수). 자연수는 분자에만 곱해요: ' + v.a + ' × ' + v.k + ' = ' + v.a * v.k + ', 분모는 그대로 ' + v.b + '.'; } },
      { id: 'denominator-multiplied', wrong: when(function (v) { return !v.w; }, function (v) { return V(v.a, v.b * v.k); }),
        explain: function (v) { return '분모에 ' + josa(v.k, '을/를') + ' 곱했어요. 분모가 커지면 분수는 오히려 작아져요. 자연수는 분자에 곱해요: ' + v.a + ' × ' + v.k + ' = ' + v.a * v.k + '.'; } },
      { id: 'added', wrong: when(function (v) { return !v.w; }, function (v) { return V(v.a + v.k, v.b); }),
        explain: function (v) { return '분자에 ' + josa(v.k, '을/를') + ' 더했어요. 곱셈이니까 분자에 곱해요: ' + v.a + ' × ' + v.k + ' = ' + v.a * v.k + '.'; } },
      { id: 'whole-only', wrong: when(function (v) { return v.w > 0; }, function (v) { return V(v.w * v.k * v.b + v.a, v.b); }),
        explain: function (v) { return '자연수 부분 ' + v.w + '에만 ' + josa(v.k, '을/를') + ' 곱했어요. 분수 부분 ' + read(v.a, v.b) + '에도 곱해야 해요. 가분수 ' + readJ(top(v), v.b, '으로/로') + ' 바꿔서 곱하면 빠뜨리지 않아요.'; } },
      { id: 'fraction-only', wrong: when(function (v) { return v.w > 0; }, function (v) { return V(v.w * v.b + v.a * v.k, v.b); }),
        explain: function (v) { return '분수 부분 ' + read(v.a, v.b) + '에만 ' + josa(v.k, '을/를') + ' 곱했어요. 자연수 부분 ' + v.w + '에도 곱해야 해요. 가분수 ' + readJ(top(v), v.b, '으로/로') + ' 바꿔서 곱하면 빠뜨리지 않아요.'; } }
    ]
  });

  /* ── A11.frac (진분수)×(진분수) ───────────────────────
     a/b × c/d. 곱한 뒤 약분한다(곱하기 전에 약분하는 방법은 다음 유형). */
  var twoVars = function (lo, hi, unit) {
    return { b: int(lo, hi), d: int(lo, hi), a: unit ? 1 : function (v) { return int(1, v.b - 1); }, c: unit ? 1 : function (v) { return int(1, v.d - 1); } };
  };
  var twoReduced = function (v) { return gcd(v.a, v.b) === 1 && gcd(v.c, v.d) === 1; };
  var crossFree = function (v) { return gcd(v.a * v.c, v.b * v.d) === 1; };
  MH.defineType({
    id: 'A11.frac', unit: 'A11', version: 1, title: '분수끼리의 곱',
    answer: PLAIN,
    levels: [
      { name: '단위분수끼리', minDistinct: 55, vars: twoVars(2, 9, true) },
      { name: '진분수 × 진분수', minDistinct: 250, vars: twoVars(2, 9, false), where: all(twoReduced, crossFree, function (v) { return v.a * v.c > 1; }) },
      { name: '곱한 뒤 약분', minDistinct: 220, vars: twoVars(2, 9, false), where: all(twoReduced, function (v) { return !crossFree(v); }) }
    ],
    prompt: function (v) { return { tex: frac(v.a, v.b) + ' \\times ' + frac(v.c, v.d) }; },
    solve: function (v) { return reduce(v.a * v.c, v.b * v.d); },
    verify: verifyProduct(function (v) { return [[v.a, v.b], [v.c, v.d]]; }),
    hints: function (v) {
      return [
        '분수의 곱셈은 통분하지 않아요.',
        '분자는 분자끼리, 분모는 분모끼리 곱해요.',
        crossFree(v) ? '분모는 ' + v.b + ' × ' + josa(v.d, '이에요/예요') + '.' : '곱한 뒤에 분자와 분모를 함께 나눌 수 있는 수가 있으면 약분해요.'
      ];
    },
    steps: function (v) {
      var n = v.a * v.c, d = v.b * v.d;
      return finish([
        { say: '분수의 곱셈은 통분하지 않고, 분자는 분자끼리 분모는 분모끼리 곱해요.' },
        { say: '분자: ' + v.a + ' × ' + v.c + ' = ' + n + ', 분모: ' + v.b + ' × ' + v.d + ' = ' + d + '.', tex: frac(v.a, v.b) + ' \\times ' + frac(v.c, v.d) + ' = ' + frac(v.a + ' \\times ' + v.c, v.b + ' \\times ' + v.d) + ' = ' + frac(n, d) }
      ], n, d);
    },
    /* ① 분자와 분모를 엇갈려 곱함 ② 분모가 같다고 분모를 그대로 둠 ③ 분모끼리는 더함 ④ 곱셈인데 덧셈을 함 */
    mistakes: [
      { id: 'cross', wrong: function (v) { return V(v.a * v.d, v.b * v.c); },
        explain: function (v) { return '분자와 분모를 엇갈려 곱했어요. 분자는 분자끼리(' + v.a + ' × ' + v.c + '), 분모는 분모끼리(' + v.b + ' × ' + v.d + ') 곱해요.'; } },
      { id: 'kept-denominator', wrong: when(function (v) { return v.b === v.d; }, function (v) { return V(v.a * v.c, v.b); }),
        explain: function (v) { return '분모가 같다고 분모를 그대로 뒀어요. 그건 덧셈과 뺄셈의 방법이에요. 곱셈에서는 분모끼리도 곱해요: ' + v.b + ' × ' + v.d + ' = ' + v.b * v.d + '.'; } },
      { id: 'denominators-added', wrong: function (v) { return V(v.a * v.c, v.b + v.d); },
        explain: function (v) { return '분자는 곱했는데 분모는 더했어요. 분모끼리도 곱해요: ' + v.b + ' × ' + v.d + ' = ' + v.b * v.d + '.'; } },
      { id: 'added-instead', wrong: function (v) { return V(v.a * v.d + v.c * v.b, v.b * v.d); },
        explain: function () { return '곱셈인데 덧셈을 했어요. 기호를 다시 확인해요. 곱셈은 통분하지 않고 분자끼리, 분모끼리 곱해요.'; } }
    ]
  });

  /* ── A11.cancel 곱하기 전에 약분 ──────────────────────
     a/b × c/d (× e/f). 분수 하나하나는 기약분수이고, 한 분수의 분자와 다른 분수의 분모를 약분할 수 있다.
     e = f = 1 이면 분수 두 개의 곱이다. */
  var parts = function (v) { return v.f > 1 ? { ns: [v.a, v.c, v.e], ds: [v.b, v.d, v.f] } : { ns: [v.a, v.c], ds: [v.b, v.d] }; };
  var done = function (v) { var p = parts(v); return cancel(p.ns, p.ds); };
  var threeReduced = function (v) { return twoReduced(v) && gcd(v.e, v.f) === 1 && v.a < v.b && v.c < v.d && (v.f === 1 || v.e < v.f); };
  /* 한 쌍만: 앞 분자 a = g × p 와 뒤 분모 d = g × q 를 약분할 수 있다. flip 이면 두 분수의 자리를 바꾼다. */
  var onePair = { g: pick([2, 3, 4, 5, 6]), p: int(1, 4), q: int(1, 4), y: int(2, 9), x: function (v) { return int(1, v.g * v.q - 1); }, flip: pick([0, 1]),
    a: function (v) { return v.flip ? v.x : v.g * v.p; }, b: function (v) { return v.flip ? v.g * v.q : v.y; },
    c: function (v) { return v.flip ? v.g * v.p : v.x; }, d: function (v) { return v.flip ? v.y : v.g * v.q; }, e: 1, f: 1 };
  /* 두 쌍: 앞 분자와 뒤 분모, 뒤 분자와 앞 분모를 모두 약분할 수 있는 식. 조건이 까다로워 무작위로 뽑으면 잘 맞지 않으므로,
     조건에 맞는 (a, b, c, d) 를 처음에 한 번 모두 찾아 두고 그 가운데서 고른다(분모 4~24). */
  var TWO = (function () {
    var out = [];
    for (var b = 4; b <= 24; b++) for (var d = 4; d <= 24; d++) for (var a = 2; a < b; a++) {
      if (gcd(a, b) > 1 || gcd(a, d) === 1) continue;
      for (var c = 2; c < d; c++) if (gcd(c, d) === 1 && gcd(c, b) > 1 && cancel([a, c], [b, d]).did.length === 2) out.push([a, b, c, d]);
    }
    return out;
  })();
  var twoPairs = { t: pick(TWO), a: function (v) { return v.t[0]; }, b: function (v) { return v.t[1]; }, c: function (v) { return v.t[2]; }, d: function (v) { return v.t[3]; }, e: 1, f: 1 };
  var three = { b: int(2, 9), d: int(2, 9), f: int(2, 9), a: function (v) { return int(1, v.b - 1); }, c: function (v) { return int(1, v.d - 1); }, e: function (v) { return int(1, v.f - 1); } };
  MH.defineType({
    id: 'A11.cancel', unit: 'A11', version: 1, title: '곱하기 전에 약분',
    answer: PLAIN,
    levels: [
      { name: '한 번 약분', vars: onePair, where: all(threeReduced, function (v) { return done(v).did.length === 1; }) },
      { name: '두 번 약분', vars: twoPairs, where: all(threeReduced, function (v) { return done(v).did.length === 2; }) },
      { name: '세 분수의 곱', vars: three, where: all(threeReduced, function (v) { return done(v).did.length >= 2; }) }
    ],
    prompt: function (v) { var p = parts(v); return { tex: exprTex(p.ns, p.ds) }; },
    solve: function (v) { var p = parts(v); return reduce(product(p.ns), product(p.ds)); },
    verify: verifyProduct(function (v) { return [[v.a, v.b], [v.c, v.d], [v.e, v.f]]; }),
    hints: function (v) {
      var x = done(v).did[0];
      return [
        '곱하기 전에 약분하면 수가 작아져서 계산이 쉬워요.',
        '분자 하나와 분모 하나를 골라요. 다른 분수의 분모와도 약분할 수 있어요.',
        '분자 ' + josa(x.n, '과/와') + ' 분모 ' + josa(x.d, '은/는') + ' 둘 다 ' + josa(x.g, '으로/로') + ' 나누어떨어져요.'
      ];
    },
    steps: function (v) { var p = parts(v); return cancelSteps([], p.ns, p.ds); },
    /* ① 약분할 때 분자만 나눔 ② 분자끼리(분모끼리) 약분함 ③ 분자와 분모를 엇갈려 곱함 */
    mistakes: [
      { id: 'numerator-only-cancel', wrong: function (v) { var p = parts(v), x = done(v).did[0]; return V(product(p.ns) / x.g, product(p.ds)); },
        explain: function (v) { var x = done(v).did[0]; return '약분하면서 분자 ' + x.n + '만 ' + josa(x.g, '으로/로') + ' 나누고 분모 ' + josa(x.d, '은/는') + ' 나누지 않았어요. 약분은 분자 하나와 분모 하나를 같은 수로 함께 나눠요: ' + x.d + ' ÷ ' + x.g + ' = ' + x.d / x.g + '.'; } },
      { id: 'same-side-cancel', wrong: function (v) {
          if (v.f > 1) return null;
          var g = gcd(v.a, v.c), h = gcd(v.b, v.d);
          return g > 1 ? V(v.a * v.c / (g * g), v.b * v.d) : h > 1 ? V(v.a * v.c, v.b * v.d / (h * h)) : null;
        },
        explain: function (v) { var top = gcd(v.a, v.c) > 1; return (top ? '분자 ' + josa(v.a, '과/와') + ' 분자 ' + josa(v.c, '을/를') : '분모 ' + josa(v.b, '과/와') + ' 분모 ' + josa(v.d, '을/를')) + ' 서로 약분했어요. 약분은 분자와 분모 사이에서만 할 수 있어요. ' + (top ? '분자끼리' : '분모끼리') + '는 약분하지 않아요.'; } },
      { id: 'cross', wrong: when(function (v) { return v.f === 1; }, function (v) { return V(v.a * v.d, v.b * v.c); }),
        explain: function (v) { return '분자와 분모를 엇갈려 곱했어요. 약분은 엇갈려 해도 되지만, 곱할 때는 분자는 분자끼리(' + v.a + ' × ' + v.c + '), 분모는 분모끼리(' + v.b + ' × ' + v.d + ') 곱해요.'; } }
    ]
  });

  /* ── A11.mixed 대분수의 곱 ────────────────────────────
     (w1 과 a/b) × (w2 와 c/d). w2 가 0 이면 뒤는 진분수. flip 이면 두 수의 자리를 바꿔 보여 준다. */
  var imp = function (v) { return { n1: v.w1 * v.b + v.a, n2: v.w2 * v.d + v.c }; };
  var mixedVars = function (w2) { return Object.assign({ w1: int(1, 3), w2: w2, flip: pick([0, 1]) }, twoVars(2, 6, false)); };
  var mixedFine = function (v) { var m = imp(v); return twoReduced(v) && (m.n1 * m.n2) % (v.b * v.d) !== 0; };
  var canCancel = function (v) { var m = imp(v); return cancel([m.n1, m.n2], [v.b, v.d]).did.length > 0; };
  var mixedTex = function (v) { var x = T(v.w1, v.a, v.b), y = T(v.w2, v.c, v.d); return v.flip ? y + ' \\times ' + x : x + ' \\times ' + y; };
  MH.defineType({
    id: 'A11.mixed', unit: 'A11', version: 1, title: '대분수의 곱',
    answer: WHOLE,
    levels: [
      { name: '대분수 × 진분수', vars: mixedVars(0), where: mixedFine },
      { name: '대분수 × 대분수', vars: mixedVars(int(1, 3)), where: all(mixedFine, function (v) { return !canCancel(v); }) },
      { name: '약분하며 곱하기', vars: mixedVars(int(1, 3)), where: all(mixedFine, canCancel) }
    ],
    prompt: function (v) { return { tex: mixedTex(v) }; },
    solve: function (v) { var m = imp(v); return reduce(m.n1 * m.n2, v.b * v.d); },
    verify: verifyProduct(function (v) { return [[v.w1 * v.b + v.a, v.b], [v.w2 * v.d + v.c, v.d]]; }),
    hints: function (v) {
      return [
        '대분수는 먼저 가분수로 바꿔요. 자연수끼리, 분수끼리 따로 곱하면 안 돼요.',
        '가분수의 분자는 자연수 × 분모 + 분자예요: ' + v.w1 + ' × ' + v.b + ' + ' + v.a + '.',
        '가분수로 바꾼 뒤 분자는 분자끼리, 분모는 분모끼리 곱해요. 곱하기 전에 약분할 수 있으면 먼저 해요.'
      ];
    },
    steps: function (v) {
      var m = imp(v), x = T(v.w1, v.a, v.b) + ' = ' + frac(m.n1, v.b), y = T(v.w2, v.c, v.d) + ' = ' + frac(m.n2, v.d);
      var sx = v.w1 + ' × ' + v.b + ' + ' + v.a + ' = ' + m.n1, sy = v.w2 + ' × ' + v.d + ' + ' + v.c + ' = ' + m.n2;
      var out = [{ say: '대분수를 가분수로 바꿔요. ' + (v.w2 ? (v.flip ? sy + ', ' + sx : sx + ', ' + sy) : sx) + '.', tex: v.w2 ? (v.flip ? y + ',\\quad ' + x : x + ',\\quad ' + y) : x }];
      return v.flip ? cancelSteps(out, [m.n2, m.n1], [v.d, v.b]) : cancelSteps(out, [m.n1, m.n2], [v.b, v.d]);
    },
    /* ① 자연수끼리, 분수끼리 따로 곱함 ② 가분수로 바꿀 때 자연수 × 분자를 함 ③ 분자와 분모를 엇갈려 곱함 */
    mistakes: [
      { id: 'parts-separately', wrong: function (v) { var bd = v.b * v.d; return V((v.w2 ? v.w1 * v.w2 : v.w1) * bd + v.a * v.c, bd); },
        explain: function (v) {
          var m = imp(v), cx = readM(v.w1, v.a, v.b) + ' = ' + read(m.n1, v.b), cy = readM(v.w2, v.c, v.d) + ' = ' + read(m.n2, v.d);
          return (v.w2 ? '자연수끼리(' + v.w1 + ' × ' + v.w2 + '), 분수끼리 따로 곱했어요. ' : '자연수 ' + josa(v.w1, '은/는') + ' 그대로 두고 분수끼리만 곱했어요. ') + '곱셈은 덧셈처럼 따로 계산할 수 없어요. 먼저 가분수로 바꿔요: ' + (v.w2 && v.flip ? cy + ', ' + cx : v.w2 ? cx + ', ' + cy : cx) + '.';
        } },
      { id: 'whole-times-numerator', wrong: function (v) { return V(v.w1 * v.a * imp(v).n2, v.b * v.d); },
        explain: function (v) { return '대분수를 가분수로 바꿀 때 자연수와 분자를 곱했어요(' + v.w1 + ' × ' + v.a + '). 자연수에는 분모를 곱하고 분자를 더해요: ' + v.w1 + ' × ' + v.b + ' + ' + v.a + ' = ' + imp(v).n1 + '.'; } },
      { id: 'cross', wrong: function (v) { var m = imp(v); return V(m.n1 * v.d, v.b * m.n2); },
        explain: function () { return '가분수로 바꾼 뒤 분자와 분모를 엇갈려 곱했어요. 분자는 분자끼리, 분모는 분모끼리 곱해요.'; } }
    ]
  });

  /* ── A11.of 전체의 몇 분의 몇 (문장제) ─────────────────
     전체 N = b × m 의 a/b. q 가 0 이면 그만큼을, 1 이면 남은 양을 묻는다. 답은 자연수. */
  var STORY = [
    { unit: 'm', lead: function (N) { return '리본 ' + N + ' m 가운데 '; }, did: ' 선물 포장에 썼어요.', ask: ['쓴 리본은 몇 m일까요?', '남은 리본은 몇 m일까요?'], part: '쓴 양', rest: '남은 양' },
    { unit: '쪽', lead: function (N) { return '책 ' + N + '쪽 가운데 '; }, did: ' 읽었어요.', ask: ['읽은 쪽수는 몇 쪽일까요?', '아직 읽지 않은 쪽수는 몇 쪽일까요?'], part: '읽은 쪽수', rest: '읽지 않은 쪽수' },
    { unit: 'L', lead: function (N) { return '물 ' + N + ' L 가운데 '; }, did: ' 화분에 줬어요.', ask: ['화분에 준 물은 몇 L일까요?', '남은 물은 몇 L일까요?'], part: '화분에 준 양', rest: '남은 양' },
    { unit: '개', lead: function (N) { return '사과 ' + N + '개 가운데 '; }, did: ' 이웃에게 나눠 줬어요.', ask: ['나눠 준 사과는 몇 개일까요?', '남은 사과는 몇 개일까요?'], part: '나눠 준 사과', rest: '남은 사과' }
  ];
  /** 단위를 붙여 맺는 말: 18 m예요 / 18쪽이에요 (m, L 은 문제 글처럼 한 칸 띈다) */
  var unitSay = function (unit) { return (/^[a-zA-Z]+$/.test(unit) ? ' ' : '') + josa(unit, '이에요/예요'); };
  var ofVars = function (q, unit) { return { s: pick([0, 1, 2, 3]), q: q, b: int(unit ? 2 : 3, 9), a: unit ? 1 : function (v) { return int(2, v.b - 1); }, m: int(2, 9), N: function (v) { return v.b * v.m; } }; };
  MH.defineType({
    id: 'A11.of', unit: 'A11', version: 1, title: '전체의 몇 분의 몇',
    answer: { kind: 'int', common: false, suffix: function (v) { return STORY[v.s].unit; } },
    levels: [
      { name: '전체의 몇 분의 1', minDistinct: 200, vars: ofVars(0, true) },
      { name: '전체의 몇 분의 몇', vars: ofVars(0, false), where: properAB },
      { name: '남은 양', vars: ofVars(1, false), where: properAB }
    ],
    /* 문제 글의 $ … $ 사이는 화면에서 수식(분수)으로 그린다 */
    prompt: function (v) { var st = STORY[v.s]; return { text: st.lead(v.N) + '$' + frac(v.a, v.b) + '$' + particle(v.a, '을/를') + st.did + ' ' + st.ask[v.q] }; },
    solve: function (v) { return v.q ? v.N - v.m * v.a : v.m * v.a; },
    /* 검산: 정확한 분수 계산으로 전체 × 분수(남은 양은 전체 × (1 − 분수)) */
    verify: function (v, ans) { var f = F(v.a, v.b); return F(v.N, 1).mul(v.q ? F(1, 1).sub(f) : f).equals(ans); },
    hints: function (v) {
      return [
        '전체의 ' + readJ(1, v.b, '은/는') + ' 전체를 똑같이 ' + josa(v.b, '으로/로') + ' 나눈 것 가운데 하나예요.',
        '먼저 ' + v.N + ' ÷ ' + josa(v.b, '을/를') + ' 계산해요.',
        v.q ? readJ(v.a, v.b, '은/는') + ' ' + read(1, v.b) + '의 ' + v.a + '배예요. 남은 양은 전체에서 그만큼을 빼요.' : v.a > 1 ? readJ(v.a, v.b, '은/는') + ' ' + read(1, v.b) + '의 ' + v.a + '배예요.' : '나눈 몫이 바로 전체의 ' + readJ(1, v.b, '이에요/예요') + '.'
      ];
    },
    steps: function (v) {
      var st = STORY[v.s], used = v.m * v.a;
      var out = [
        { say: '전체 ' + v.N + '의 ' + readJ(v.a, v.b, '을/를') + ' 구하는 것은 ' + v.N + '에 ' + readJ(v.a, v.b, '을/를') + ' 곱하는 것과 같아요.', tex: v.N + ' \\times ' + frac(v.a, v.b) },
        { say: '전체의 ' + readJ(1, v.b, '은/는') + ' ' + v.N + ' ÷ ' + v.b + ' = ' + josa(v.m, '이에요/예요') + '.', tex: v.N + ' \\div ' + v.b + ' = ' + v.m, value: v.m }
      ];
      if (v.a > 1) out.push({ say: readJ(v.a, v.b, '은/는') + ' 그것의 ' + v.a + '배예요: ' + v.m + ' × ' + v.a + ' = ' + used + '. ' + st.part + josa(st.part, '은/는').slice(st.part.length) + ' ' + used + unitSay(st.unit) + '.', tex: v.N + ' \\times ' + frac(v.a, v.b) + ' = ' + used, value: used });
      if (v.q) out.push({ say: st.rest + josa(st.rest, '은/는').slice(st.rest.length) + ' 전체에서 그만큼을 빼요: ' + v.N + ' − ' + used + ' = ' + (v.N - used) + '. 답은 ' + (v.N - used) + unitSay(st.unit) + '.', tex: v.N + ' - ' + used + ' = ' + (v.N - used), value: v.N - used });
      return out;
    },
    /* ① 분모로 나누기만 함 ② 분자만 곱함 ③ 분모를 곱함 ④ 남은 양을 묻는데 쓴 양을 답함 ⑤ 쓴 양을 묻는데 남은 양을 답함 */
    mistakes: [
      { id: 'divided-only', wrong: when(function (v) { return v.a > 1; }, function (v) { return v.m; }),
        explain: function (v) { return v.N + ' ÷ ' + v.b + ' = ' + josa(v.m, '은/는') + ' 전체의 ' + readJ(1, v.b, '이에요/예요') + '. ' + readJ(v.a, v.b, '은/는') + ' 그것의 ' + v.a + '배예요: ' + v.m + ' × ' + v.a + ' = ' + v.m * v.a + '.'; } },
      { id: 'numerator-only', wrong: when(function (v) { return v.a > 1; }, function (v) { return v.N * v.a; }),
        explain: function (v) { return '분자 ' + josa(v.a, '을/를') + ' 곱하기만 했어요. 전체보다 큰 수가 나왔죠? 분모 ' + josa(v.b, '으로/로') + ' 나누는 것도 해야 해요: ' + v.N + ' ÷ ' + v.b + ' × ' + v.a + ' = ' + v.m * v.a + '.'; } },
      { id: 'times-denominator', wrong: function (v) { return v.N * v.b; },
        explain: function (v) { return '분모 ' + josa(v.b, '을/를') + ' 곱했어요. ' + readJ(1, v.b, '은/는') + ' 전체를 ' + josa(v.b, '으로/로') + ' 나눈 것 가운데 하나라서, 곱하는 게 아니라 나눠요: ' + v.N + ' ÷ ' + v.b + ' = ' + v.m + '.'; } },
      { id: 'used-part', wrong: when(function (v) { return v.q === 1; }, function (v) { return v.m * v.a; }),
        explain: function (v) { var st = STORY[v.s]; return st.part + josa(st.part, '을/를').slice(st.part.length) + ' 답했어요. 묻는 것은 ' + josa(st.rest, '이에요/예요') + '. 전체에서 빼요: ' + v.N + ' − ' + v.m * v.a + ' = ' + (v.N - v.m * v.a) + '.'; } },
      { id: 'rest-instead', wrong: when(function (v) { return v.q === 0; }, function (v) { return v.N - v.m * v.a; }),
        explain: function (v) { var st = STORY[v.s]; return st.rest + josa(st.rest, '을/를').slice(st.rest.length) + ' 답했어요. 묻는 것은 ' + josa(st.part, '이에요/예요') + ': ' + v.N + ' ÷ ' + v.b + (v.a > 1 ? ' × ' + v.a : '') + ' = ' + v.m * v.a + '.'; } }
    ]
  });
})();
