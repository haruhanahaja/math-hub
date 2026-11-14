/* A12 분수의 나눗셈 — 역수, (분수)÷(자연수), (분수)÷(분수)
   유형(쉬운 것부터): A12.reciprocal 역수 · A12.by-whole 분수 ÷ 자연수 · A12.count 몫이 자연수인 나눗셈(몇 번 들어가나)
                     · A12.frac 분수 ÷ 분수 · A12.mixed 대분수의 나눗셈
   분수로 답하는 유형의 답은 기약분수 { n, d }. 값이 같으면 가분수로 써도 대분수로 써도 정답이고, 약분이 덜 됐으면 알려 주기만 한다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F, gcd = MH.gcd;

  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  /** 대분수 꼴 수식: 자연수 w, 분자 n, 분모 d (w 가 0 이면 분수만) */
  var T = function (w, n, d) { return (w ? w : '') + frac(n, d); };
  /** 분수 n/d 의 수식. 분모가 1 이면 자연수로 쓴다. */
  var O = function (n, d) { return d === 1 ? String(n) : frac(n, d); };
  /** 글로 읽는 분수: 4분의 3. 분모가 1 이면 자연수. 조사는 마지막에 읽는 분자에 맞춘다. */
  var read = function (n, d) { return d === 1 ? String(n) : d + '분의 ' + n; };
  var readJ = function (n, d, pair) { return (d === 1 ? '' : d + '분의 ') + josa(n, pair); };
  var readM = function (w, n, d) { return (w ? josa(w, '과/와') + ' ' : '') + read(n, d); };
  var reduce = function (n, d) { var g = gcd(n, d); return { n: n / g, d: d / g }; };
  /** 오답 값(만들 수 없으면 null) */
  var V = function (n, d) { return n > 0 && d > 0 ? { n: n, d: d } : null; };
  var when = function (test, make) { return function (v) { return test(v) ? make(v) : null; }; };
  var all = function () { var tests = [].slice.call(arguments); return function (v) { return tests.every(function (t) { return t(v); }); }; };
  var WHOLE = { kind: 'fraction', whole: true, show: 'mixed' };
  /** 풀이의 끝: 약분하고, 가분수이면 대분수로 바꾼다. 마지막 단계에 답을 붙인다. */
  var finish = function (out, n, d) {
    var g = gcd(n, d);
    if (g > 1) { out.push({ say: '분자 ' + josa(n, '과/와') + ' 분모 ' + josa(d, '을/를') + ' ' + josa(g, '으로/로') + ' 나눠 약분해요.', tex: frac(n, d) + ' = ' + frac(n / g, d / g) }); n /= g; d /= g; }
    if (n > d && d > 1) { var r = n % d, w = (n - r) / d; out.push({ say: '분자가 분모보다 커요. ' + n + ' ÷ ' + d + ' = ' + w + ' … ' + josa(r, '이니까/니까') + ' 대분수로 쓰면 ' + josa(w, '과/와') + ' ' + readJ(r, d, '이에요/예요') + '.', tex: frac(n, d) + ' = ' + T(w, r, d) }); }
    out[out.length - 1].value = { n: n, d: d };
    return out;
  };
  /** 곱하기 전에 약분: 분자 하나와 분모 하나를 골라 함께 나눈다 */
  var cancel = function (ns, ds) {
    ns = ns.slice(); ds = ds.slice(); var did = [];
    for (var i = 0; i < ns.length; i++) for (var j = 0; j < ds.length; j++) {
      var g = gcd(ns[i], ds[j]);
      if (g > 1) { did.push({ i: i, j: j, n: ns[i], d: ds[j], g: g }); ns[i] /= g; ds[j] /= g; }
    }
    return { ns: ns, ds: ds, did: did };
  };
  /* 곱셈식. 약분해서 1 이 된 인수는 쓰지 않는다(모두 1 이면 1). */
  var exprTex = function (ns, ds) {
    var out = [];
    ns.forEach(function (n, i) { if (n !== 1 || ds[i] !== 1) out.push(O(n, ds[i])); });
    return out.length ? out.join(' \\times ') : '1';
  };
  /** 곱을 글로: 2 × 4 = 8 (1 은 빼고, 곱할 것이 하나뿐이면 그 수만) */
  var timesSay = function (list) { var f = list.filter(function (x) { return x !== 1; }), p = list.reduce(function (a, b) { return a * b; }, 1); return f.length > 1 ? f.join(' × ') + ' = ' + p : String(p); };
  /** 나눗셈 n1/d1 ÷ n2/d2 의 풀이: 역수의 곱셈으로 바꾸고 → 약분하고 → 곱한다. left 는 식의 왼쪽(나눗셈식) 수식 */
  var divideSteps = function (out, n1, d1, n2, d2) {
    out.push({ say: '나누는 수 ' + read(n2, d2) + '의 역수는 ' + readJ(d2, n2, '이에요/예요') + '. 나눗셈을 역수의 곱셈으로 바꿔요.', tex: O(n1, d1) + ' \\div ' + O(n2, d2) + ' = ' + O(n1, d1) + ' \\times ' + O(d2, n2) });
    var ns = [n1, d2], ds = [d1, n2], c = cancel(ns, ds), curN = ns.slice(), curD = ds.slice();
    c.did.forEach(function (x, at) {
      var before = exprTex(curN, curD);
      curN[x.i] = x.n / x.g; curD[x.j] = x.d / x.g;
      out.push({ say: (at ? '한 번 더 약분해요. ' : '곱하기 전에 약분해요. ') + '분자 ' + josa(x.n, '과/와') + ' 분모 ' + josa(x.d, '을/를') + ' ' + josa(x.g, '으로/로') + ' 나눠요: ' + x.n + ' ÷ ' + x.g + ' = ' + x.n / x.g + ', ' + x.d + ' ÷ ' + x.g + ' = ' + x.d / x.g + '.', tex: before + ' = ' + exprTex(curN, curD) });
    });
    var N = c.ns[0] * c.ns[1], D = c.ds[0] * c.ds[1];
    /* 약분하고 나니 곱할 것이 남지 않았으면(한쪽이 1) 곱셈 단계는 건너뛴다 */
    var left = [0, 1].filter(function (i) { return c.ns[i] !== 1 || c.ds[i] !== 1; }).length;
    if (left > 1 || !c.did.length) out.push({ say: (c.did.length ? '남은 수로 ' : '') + '분자는 분자끼리, 분모는 분모끼리 곱해요: 분자 ' + timesSay(c.ns) + ', 분모 ' + timesSay(c.ds) + '.', tex: exprTex(c.ns, c.ds) + ' = ' + O(N, D) });
    return finish(out, N, D);
  };
  /* 검산: 정확한 분수 계산으로, 답에 나누는 수를 곱하면 나누어지는 수가 되는가 */
  var verifyQuotient = function (operands) {
    return function (v, ans) { var o = operands(v); return gcd(ans.n, ans.d) === 1 && F(ans.n, ans.d).mul(F(o[2], o[3])).equals(F(o[0], o[1])); };
  };

  /* ── A12.reciprocal 역수 ─────────────────────────────
     수 (w 와 a/b) 의 역수. 자연수 k 는 w = 0, a = k, b = 1 로 둔다. */
  var top = function (v) { return v.w * v.b + v.a; };
  var lowest = function (v) { return gcd(v.a, v.b) === 1; };
  var shown = function (v) { return v.b === 1 ? String(v.a) : T(v.w, v.a, v.b); };
  MH.defineType({
    id: 'A12.reciprocal', unit: 'A12', version: 1, title: '역수',
    answer: { kind: 'fraction', whole: true },
    levels: [
      { name: '진분수의 역수', minDistinct: 80, vars: { w: 0, b: int(3, 20), a: function (v) { return int(2, v.b - 1); } }, where: lowest },
      { name: '자연수 · 단위분수 · 가분수', minDistinct: 90, vars: { w: 0, form: pick([0, 1, 2]), b: function (v) { return v.form === 0 ? 1 : int(2, 12); }, a: function (v) { return v.form === 0 ? int(2, 20) : v.form === 1 ? 1 : int(v.b + 1, 2 * v.b + 5); } }, where: lowest },
      { name: '대분수의 역수', minDistinct: 120, vars: { w: int(1, 5), b: int(2, 9), a: function (v) { return int(1, v.b - 1); } }, where: lowest }
    ],
    prompt: function (v) { return { tex: shown(v), text: '이 수의 역수를 쓰세요.' }; },
    solve: function (v) { return { n: v.b, d: top(v) }; },
    /* 검산: 원래 수와 곱하면 1 이 되는가 */
    verify: function (v, ans) { return F(ans.n, ans.d).mul(F(top(v), v.b)).equals(1); },
    hints: function (v) {
      return [
        '역수는 곱해서 1이 되는 수예요.',
        v.w ? '대분수는 먼저 가분수로 바꿔요. 분자는 ' + v.w + ' × ' + v.b + ' + ' + josa(v.a, '이에요/예요') + '.' : v.b === 1 ? '자연수 ' + josa(v.a, '은/는') + ' 분모가 1인 분수로 볼 수 있어요.' : '분수의 역수는 분자와 분모의 자리를 바꾼 수예요.',
        v.w || v.b === 1 ? '분자와 분모의 자리를 바꾸면 역수예요.' : v.a === 1 ? '자리를 바꿨을 때 분모가 1이 되면 자연수로 써요.' : '분자 ' + josa(v.a, '을/를') + ' 아래로, 분모 ' + josa(v.b, '을/를') + ' 위로 보내요.'
      ];
    },
    steps: function (v) {
      var n = top(v), out = [];
      if (v.w) out.push({ say: '대분수를 가분수로 바꿔요. 분자는 ' + v.w + ' × ' + v.b + ' + ' + v.a + ' = ' + josa(n, '이에요/예요') + '.', tex: T(v.w, v.a, v.b) + ' = ' + frac(n, v.b) });
      else if (v.b === 1) out.push({ say: '자연수 ' + josa(n, '은/는') + ' 분모가 1인 분수로 볼 수 있어요.', tex: n + ' = ' + frac(n, 1) });
      else out.push({ say: '역수는 곱해서 1이 되는 수예요. 분수는 분자와 분모의 자리를 바꾸면 돼요.' });
      out.push({ say: '분자와 분모의 자리를 바꿔요. ' + readJ(n, v.b, '의/의') + ' 역수는 ' + readJ(v.b, n, '이에요/예요') + '. 곱하면 1이 돼요.', tex: frac(n, v.b) + ' \\times ' + frac(v.b, n) + ' = 1', value: { n: v.b, d: n } });
      return out;
    },
    /* ① 수를 그대로 씀 ② 더해서 1 이 되는 수를 씀 ③ 대분수의 분수 부분만 뒤집음 */
    mistakes: [
      { id: 'unchanged', wrong: function (v) { return V(top(v), v.b); },
        explain: function (v) { return '수를 그대로 썼어요. 역수는 곱해서 1이 되는 수예요. ' + (v.b === 1 ? '자연수 ' + josa(v.a, '은/는') + ' 1분의 ' + josa(v.a, '으로/로') + ' 보고 ' : '') + '분자와 분모의 자리를 바꿔요.'; } },
      { id: 'complement', wrong: when(function (v) { return !v.w && v.b > 1 && v.a < v.b; }, function (v) { return V(v.b - v.a, v.b); }),
        explain: function (v) { return '더해서 1이 되는 수를 썼어요. 역수는 곱해서 1이 되는 수예요. ' + readJ(v.a, v.b, '의/의') + ' 분자와 분모의 자리를 바꿔요.'; } },
      { id: 'fraction-part-only', wrong: when(function (v) { return v.w > 0; }, function (v) { return V(v.w * v.a + v.b, v.a); }),
        explain: function (v) { return '분수 부분 ' + read(v.a, v.b) + '만 뒤집고 자연수 ' + josa(v.w, '은/는') + ' 그대로 뒀어요. 대분수는 먼저 가분수 ' + readJ(top(v), v.b, '으로/로') + ' 바꾼 다음 통째로 뒤집어요.'; } }
    ]
  });

  /* ── A12.by-whole (분수)÷(자연수) ─────────────────────
     (w 와 a/b) ÷ k = 가분수의 분모에 k 를 곱한 것 */
  MH.defineType({
    id: 'A12.by-whole', unit: 'A12', version: 1, title: '분수 ÷ 자연수',
    answer: WHOLE,
    levels: [
      { name: '분자가 나누어떨어질 때', minDistinct: 80, vars: { w: 0, k: int(2, 5), m: int(1, 4), b: int(3, 20), a: function (v) { return v.k * v.m; } }, where: all(lowest, function (v) { return v.a < v.b; }) },
      { name: '분자가 나누어떨어지지 않을 때', minDistinct: 110, vars: { w: 0, k: int(2, 9), b: int(2, 9), a: function (v) { return int(1, v.b - 1); } }, where: all(lowest, function (v) { return gcd(v.a, v.k) === 1; }) },
      { name: '대분수 ÷ 자연수', vars: { w: int(1, 4), k: int(2, 6), b: int(2, 7), a: function (v) { return int(1, v.b - 1); } }, where: lowest }
    ],
    prompt: function (v) { return { tex: T(v.w, v.a, v.b) + ' \\div ' + v.k }; },
    solve: function (v) { return reduce(top(v), v.b * v.k); },
    verify: verifyQuotient(function (v) { return [top(v), v.b, v.k, 1]; }),
    hints: function (v) {
      return [
        (v.w ? '대분수는 먼저 가분수로 바꿔요. ' : '') + josa(v.k, '으로/로') + ' 나누는 것은 ' + readJ(1, v.k, '을/를') + ' 곱하는 것과 같아요.',
        '÷ ' + josa(v.k, '을/를') + ' × ' + readJ(1, v.k, '으로/로') + ' 바꿔요. ' + readJ(1, v.k, '은/는') + ' ' + v.k + '의 역수예요.',
        gcd(top(v), v.k) > 1 ? '곱하기 전에 분자와 ' + josa(v.k, '을/를') + ' 약분할 수 있어요.' : '분모에 ' + josa(v.k, '을/를') + ' 곱하면 돼요. 분자는 그대로예요.'
      ];
    },
    steps: function (v) {
      var n = top(v), out = [];
      if (v.w) out.push({ say: '대분수를 가분수로 바꿔요. 분자는 ' + v.w + ' × ' + v.b + ' + ' + v.a + ' = ' + josa(n, '이에요/예요') + '.', tex: T(v.w, v.a, v.b) + ' = ' + frac(n, v.b) });
      return divideSteps(out, n, v.b, v.k, 1);
    },
    /* ① 나누지 않고 곱함 ② 나누어지는 수를 뒤집음 ③ (대분수) 자연수 부분만 나눔 ④ (대분수) 분수 부분만 나눔 */
    mistakes: [
      { id: 'multiplied', wrong: function (v) { return V(top(v) * v.k, v.b); },
        explain: function (v) { return '나눗셈인데 ' + josa(v.k, '을/를') + ' 곱했어요. ' + josa(v.k, '으로/로') + ' 나누는 것은 ' + readJ(1, v.k, '을/를') + ' 곱하는 것이에요. 분자가 아니라 분모에 ' + josa(v.k, '을/를') + ' 곱해요.'; } },
      { id: 'flipped-dividend', wrong: function (v) { return V(v.b * v.k, top(v)); },
        explain: function (v) { return '앞에 있는 나누어지는 수를 뒤집었어요. 역수로 바꾸는 것은 뒤에 있는 나누는 수 ' + josa(v.k, '이에요/예요') + ': ÷ ' + v.k + ' → × ' + read(1, v.k) + '.'; } },
      { id: 'whole-part-only', wrong: when(function (v) { return v.w > 0 && v.w % v.k === 0; }, function (v) { return V(v.w / v.k * v.b + v.a, v.b); }),
        explain: function (v) { return '자연수 부분 ' + v.w + '만 ' + josa(v.k, '으로/로') + ' 나눴어요. 분수 부분 ' + read(v.a, v.b) + '도 나눠야 해요. 가분수 ' + readJ(top(v), v.b, '으로/로') + ' 바꿔서 나누면 빠뜨리지 않아요.'; } },
      { id: 'fraction-part-only', wrong: when(function (v) { return v.w > 0; }, function (v) { return V(v.w * v.b * v.k + v.a, v.b * v.k); }),
        explain: function (v) { return '분수 부분 ' + read(v.a, v.b) + '만 ' + josa(v.k, '으로/로') + ' 나눴어요. 자연수 부분 ' + v.w + '도 나눠야 해요. 가분수 ' + readJ(top(v), v.b, '으로/로') + ' 바꿔서 나누면 빠뜨리지 않아요.'; } }
    ]
  });

  /* ── A12.count 몫이 자연수인 나눗셈 ────────────────────
     form 0: k ÷ 1/b · form 1: a/b ÷ c/b (a = c × m) · form 2: k ÷ a/b (k = a × m). 답은 자연수. */
  var countAnswer = function (v) { return v.form === 0 ? v.k * v.b : v.form === 1 ? v.m : v.m * v.b; };
  MH.defineType({
    id: 'A12.count', unit: 'A12', version: 1, title: '몇 번 들어갈까',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '자연수 ÷ 단위분수', minDistinct: 55, vars: { form: 0, k: int(2, 9), b: int(2, 9), a: 1, c: 1, m: 1 } },
      { name: '분모가 같은 분수끼리', minDistinct: 60, vars: { form: 1, b: int(5, 15), c: int(1, 5), m: int(2, 6), a: function (v) { return v.c * v.m; }, k: 0 }, where: function (v) { return v.a < v.b; } },
      { name: '자연수 ÷ 진분수', minDistinct: 90, vars: { form: 2, b: int(3, 9), a: function (v) { return int(2, v.b - 1); }, m: int(1, 6), k: function (v) { return v.a * v.m; }, c: 0 }, where: lowest }
    ],
    prompt: function (v) { return { tex: v.form === 1 ? frac(v.a, v.b) + ' \\div ' + frac(v.c, v.b) : v.k + ' \\div ' + frac(v.a, v.b) }; },
    solve: countAnswer,
    /* 검산: 정확한 분수 계산으로, 몫에 나누는 수를 곱하면 나누어지는 수가 되는가 */
    verify: function (v, ans) { return v.form === 1 ? F(v.c, v.b).mul(ans).equals(F(v.a, v.b)) : F(v.a, v.b).mul(ans).equals(v.k); },
    hints: function (v) {
      if (v.form === 0) return [
        v.k + ' ÷ ' + readJ(1, v.b, '은/는') + ' ' + v.k + ' 안에 ' + readJ(1, v.b, '이/가') + ' 몇 번 들어가는지 묻는 거예요.',
        '1 안에는 ' + readJ(1, v.b, '이/가') + ' ' + v.b + '번 들어가요.',
        josa(v.k, '은/는') + ' 1이 ' + v.k + '개예요. ' + v.b + '번씩 ' + v.k + '묶음을 세면 돼요.'
      ];
      if (v.form === 1) return [
        '분모가 같으면 조각의 크기가 같아요. 조각의 수끼리 나누면 돼요.',
        readJ(v.a, v.b, '은/는') + ' ' + readJ(1, v.b, '이/가') + ' ' + v.a + '개, ' + readJ(v.c, v.b, '은/는') + ' ' + v.c + '개예요.',
        v.a + '개 안에 ' + v.c + '개가 몇 번 들어가는지 세요: ' + v.a + ' ÷ ' + v.c + '.'
      ];
      return [
        '나눗셈은 나누는 수의 역수를 곱하는 것과 같아요.',
        read(v.a, v.b) + '의 역수는 ' + readJ(v.b, v.a, '이에요/예요') + '.',
        v.k + ' × ' + readJ(v.b, v.a, '을/를') + ' 계산해요. ' + josa(v.k, '을/를') + ' 먼저 ' + josa(v.a, '으로/로') + ' 나누면(약분) 쉬워요.'
      ];
    },
    steps: function (v) {
      var ans = countAnswer(v);
      if (v.form === 0) return [
        { say: '1 안에는 ' + readJ(1, v.b, '이/가') + ' ' + v.b + '번 들어가요.', tex: '1 \\div ' + frac(1, v.b) + ' = ' + v.b },
        { say: josa(v.k, '은/는') + ' 1이 ' + v.k + '개니까 ' + v.k + ' × ' + v.b + ' = ' + ans + '번 들어가요. ' + read(1, v.b) + '의 역수 ' + josa(v.b, '을/를') + ' 곱한 것과 같아요.', tex: v.k + ' \\div ' + frac(1, v.b) + ' = ' + v.k + ' \\times ' + v.b + ' = ' + ans, value: ans }
      ];
      if (v.form === 1) return [
        { say: '분모가 ' + josa(v.b, '으로/로') + ' 같아요. ' + readJ(v.a, v.b, '은/는') + ' ' + readJ(1, v.b, '이/가') + ' ' + v.a + '개, ' + readJ(v.c, v.b, '은/는') + ' ' + v.c + '개예요.' },
        { say: v.a + '개 안에 ' + v.c + '개가 몇 번 들어가는지 세면 돼요: ' + v.a + ' ÷ ' + v.c + ' = ' + ans + '.', tex: frac(v.a, v.b) + ' \\div ' + frac(v.c, v.b) + ' = ' + v.a + ' \\div ' + v.c + ' = ' + ans, value: ans }
      ];
      return [
        { say: '나누는 수 ' + read(v.a, v.b) + '의 역수는 ' + readJ(v.b, v.a, '이에요/예요') + '. 나눗셈을 역수의 곱셈으로 바꿔요.', tex: v.k + ' \\div ' + frac(v.a, v.b) + ' = ' + v.k + ' \\times ' + frac(v.b, v.a) },
        { say: josa(v.k, '과/와') + ' 분모 ' + josa(v.a, '을/를') + ' ' + josa(v.a, '으로/로') + ' 약분하면 ' + v.k + ' ÷ ' + v.a + ' = ' + josa(v.m, '이에요/예요') + '. 남은 수를 곱해요: ' + v.m + ' × ' + v.b + ' = ' + ans + '.', tex: v.k + ' \\times ' + frac(v.b, v.a) + ' = ' + v.m + ' \\times ' + v.b + ' = ' + ans, value: ans }
      ];
    },
    /* ① 1 안에 들어가는 횟수만 답함 ② 분모로 나눔 ③ 분자끼리 뺌 ④ 분자끼리 곱함 ⑤ 분자로 나누기만 함 ⑥ 분모를 곱하기만 함 ⑦ 역수로 바꾸지 않고 곱함 */
    mistakes: [
      { id: 'denominator-only', wrong: when(function (v) { return v.form === 0; }, function (v) { return v.b; }),
        explain: function (v) { return josa(v.b, '은/는') + ' 1 안에 ' + readJ(1, v.b, '이/가') + ' 들어가는 횟수예요. ' + v.k + ' 안에는 그 ' + v.k + '배가 들어가요: ' + v.k + ' × ' + v.b + ' = ' + v.k * v.b + '.'; } },
      { id: 'divided-instead', wrong: when(function (v) { return v.form === 0 && v.k % v.b === 0; }, function (v) { return v.k / v.b; }),
        explain: function (v) { return josa(v.k, '을/를') + ' ' + josa(v.b, '으로/로') + ' 나눴어요. ' + readJ(1, v.b, '으로/로') + ' 나누는 것은 ' + josa(v.b, '으로/로') + ' 나누는 것과 달라요. 역수 ' + josa(v.b, '을/를') + ' 곱해요: ' + v.k + ' × ' + v.b + ' = ' + v.k * v.b + '.'; } },
      { id: 'subtracted', wrong: when(function (v) { return v.form === 1; }, function (v) { return v.a - v.c; }),
        explain: function (v) { return '분자끼리 뺐어요. 나눗셈은 몇 번 들어가는지 세는 거예요: ' + v.a + ' ÷ ' + v.c + ' = ' + v.m + '.'; } },
      { id: 'multiplied', wrong: when(function (v) { return v.form === 1; }, function (v) { return v.a * v.c; }),
        explain: function (v) { return '분자끼리 곱했어요. 나눗셈이니까 분자끼리 나눠요: ' + v.a + ' ÷ ' + v.c + ' = ' + v.m + '.'; } },
      { id: 'divided-only', wrong: when(function (v) { return v.form === 2; }, function (v) { return v.m; }),
        explain: function (v) { return v.k + ' ÷ ' + v.a + ' = ' + v.m + '까지만 했어요. 역수 ' + readJ(v.b, v.a, '을/를') + ' 곱하는 것이니까 분자 ' + v.b + '도 곱해야 해요: ' + v.m + ' × ' + v.b + ' = ' + v.m * v.b + '.'; } },
      { id: 'multiplied-only', wrong: when(function (v) { return v.form === 2; }, function (v) { return v.k * v.b; }),
        explain: function (v) { return v.k + ' × ' + v.b + '만 했어요. 역수 ' + readJ(v.b, v.a, '을/를') + ' 곱하는 것이니까 ' + josa(v.a, '으로/로') + ' 나누는 것도 해야 해요: ' + v.k * v.b + ' ÷ ' + v.a + ' = ' + v.m * v.b + '.'; } },
      { id: 'not-flipped', wrong: when(function (v) { return v.form === 2 && (v.k * v.a) % v.b === 0; }, function (v) { return v.k * v.a / v.b; }),
        explain: function (v) { return '나누는 수를 그대로 곱했어요(' + v.k + ' × ' + read(v.a, v.b) + '). 나눗셈은 나누는 수의 역수 ' + readJ(v.b, v.a, '을/를') + ' 곱해요.'; } }
    ]
  });

  /* ── 분수 ÷ 분수 (가분수 꼴 n1/d1 ÷ n2/d2) 에 함께 쓰는 실수 ───── */
  var divMistakes = function (X) {
    return [
      { id: 'not-flipped', wrong: function (v) { var x = X(v); return V(x[0] * x[2], x[1] * x[3]); },
        explain: function (v) { var x = X(v); return '나눗셈인데 나누는 수를 그대로 곱했어요. 나누는 수 ' + read(x[2], x[3]) + '의 분자와 분모를 바꾼 역수 ' + readJ(x[3], x[2], '을/를') + ' 곱해요.'; } },
      { id: 'flipped-dividend', wrong: function (v) { var x = X(v); return V(x[1] * x[2], x[0] * x[3]); },
        explain: function (v) { var x = X(v); return '앞에 있는 나누어지는 수를 뒤집었어요. 역수로 바꾸는 것은 뒤에 있는 나누는 수예요: ' + read(x[2], x[3]) + ' → ' + read(x[3], x[2]) + '.'; } },
      { id: 'both-flipped', wrong: function (v) { var x = X(v); return V(x[1] * x[3], x[0] * x[2]); },
        explain: function (v) { var x = X(v); return '두 수를 모두 뒤집었어요. 나누어지는 수 ' + readJ(x[0], x[1], '은/는') + ' 그대로 두고, 나누는 수만 역수 ' + readJ(x[3], x[2], '으로/로') + ' 바꿔요.'; } }
    ];
  };

  /* ── A12.frac (분수)÷(분수) ──────────────────────────
     a/b ÷ c/d. b 가 1 이면 나누어지는 수는 자연수 a. */
  var fracX = function (v) { return [v.a, v.b, v.c, v.d]; };
  var notWhole = function (X) { return function (v) { var x = X(v); return (x[0] * x[3]) % (x[1] * x[2]) !== 0; }; };
  var bothLowest = function (v) { return gcd(v.a, v.b) === 1 && gcd(v.c, v.d) === 1; };
  var canCancel = function (X) { return function (v) { var x = X(v); return cancel([x[0], x[3]], [x[1], x[2]]).did.length > 0; }; };
  var not = function (t) { return function (v) { return !t(v); }; };
  MH.defineType({
    id: 'A12.frac', unit: 'A12', version: 1, title: '분수 ÷ 분수',
    answer: WHOLE,
    levels: [
      { name: '분모가 같을 때', minDistinct: 120, vars: { b: int(3, 12), d: function (v) { return v.b; }, a: function (v) { return int(1, v.b - 1); }, c: function (v) { return int(1, v.b - 1); } }, where: all(bothLowest, notWhole(fracX)) },
      { name: '역수를 곱하기', vars: { whole: pick([0, 0, 1]), b: function (v) { return v.whole ? 1 : int(2, 9); }, d: int(2, 9), a: function (v) { return v.whole ? int(2, 6) : int(1, v.b - 1); }, c: function (v) { return int(1, v.d - 1); } },
        where: all(bothLowest, notWhole(fracX), not(canCancel(fracX)), function (v) { return v.b !== v.d; }) },
      { name: '약분하며 나누기', vars: { b: int(2, 12), d: int(2, 12), a: function (v) { return int(1, v.b - 1); }, c: function (v) { return int(1, v.d - 1); } },
        where: all(bothLowest, notWhole(fracX), canCancel(fracX), function (v) { return v.b !== v.d; }) }
    ],
    prompt: function (v) { return { tex: O(v.a, v.b) + ' \\div ' + O(v.c, v.d) }; },
    solve: function (v) { return reduce(v.a * v.d, v.b * v.c); },
    verify: verifyQuotient(fracX),
    hints: function (v) {
      return [
        v.b === v.d ? '분모가 같으면 조각의 크기가 같아요. 분자끼리 나눈 것과 같아요: ' + v.a + ' ÷ ' + v.c + '.' : '나눗셈은 나누는 수의 역수를 곱하는 것과 같아요.',
        '나누는 수 ' + read(v.c, v.d) + '의 분자와 분모를 바꾸면 역수예요. 앞의 수는 그대로 둬요.',
        '곱셈으로 바꾼 뒤에는 약분할 수 있으면 먼저 하고, 분자끼리 분모끼리 곱해요.'
      ];
    },
    steps: function (v) {
      if (v.b !== v.d) return divideSteps([], v.a, v.b, v.c, v.d);
      return finish([
        { say: '분모가 ' + josa(v.b, '으로/로') + ' 같아요. ' + readJ(v.a, v.b, '은/는') + ' ' + readJ(1, v.b, '이/가') + ' ' + v.a + '개, ' + readJ(v.c, v.b, '은/는') + ' ' + v.c + '개니까 ' + v.a + ' ÷ ' + josa(v.c, '과/와') + ' 같아요.', tex: frac(v.a, v.b) + ' \\div ' + frac(v.c, v.b) + ' = ' + v.a + ' \\div ' + v.c + ' = ' + frac(v.a, v.c) },
        { say: '나누는 수의 역수를 곱해서 계산해도 같은 답이 나와요. 분모 ' + josa(v.b, '은/는') + ' 서로 약분돼요.', tex: frac(v.a, v.b) + ' \\times ' + frac(v.b, v.c) + ' = ' + frac(v.a, v.c) }
      ], v.a, v.c);
    },
    mistakes: divMistakes(fracX)
  });

  /* ── A12.mixed 대분수의 나눗셈 ────────────────────────
     (w1 과 a/b) ÷ (w2 와 c/d). w 가 0 이면 진분수. 둘 가운데 하나 이상은 대분수. */
  var mixedX = function (v) { return [v.w1 * v.b + v.a, v.b, v.w2 * v.d + v.c, v.d]; };
  var mixedVars = function (w1, w2) { return { w1: w1, w2: w2, b: int(2, 6), d: int(2, 6), a: function (v) { return int(1, v.b - 1); }, c: function (v) { return int(1, v.d - 1); } }; };
  MH.defineType({
    id: 'A12.mixed', unit: 'A12', version: 1, title: '대분수의 나눗셈',
    answer: WHOLE,
    levels: [
      { name: '대분수 ÷ 진분수', minDistinct: 240, vars: mixedVars(int(1, 3), 0), where: all(bothLowest, notWhole(mixedX)) },
      { name: '대분수로 나누기', vars: mixedVars(int(0, 3), int(1, 3)), where: all(bothLowest, notWhole(mixedX), not(canCancel(mixedX))) },
      { name: '약분하며 나누기', vars: mixedVars(int(1, 3), int(1, 3)), where: all(bothLowest, notWhole(mixedX), canCancel(mixedX)) }
    ],
    prompt: function (v) { return { tex: T(v.w1, v.a, v.b) + ' \\div ' + T(v.w2, v.c, v.d) }; },
    solve: function (v) { var x = mixedX(v); return reduce(x[0] * x[3], x[1] * x[2]); },
    verify: verifyQuotient(mixedX),
    hints: function (v) {
      var w = v.w2 || v.w1, n = v.w2 ? v.c : v.a, d = v.w2 ? v.d : v.b;
      return [
        '대분수는 먼저 가분수로 바꿔요. 분자는 자연수 × 분모 + 분자예요: ' + w + ' × ' + d + ' + ' + n + '.',
        '가분수로 바꾼 다음, 뒤에 있는 나누는 수를 역수로 바꿔 곱해요.',
        '곱셈으로 바꾼 뒤에는 약분할 수 있으면 먼저 하고, 분자끼리 분모끼리 곱해요.'
      ];
    },
    steps: function (v) {
      var x = mixedX(v), conv = [], say = [];
      if (v.w1) { conv.push(T(v.w1, v.a, v.b) + ' = ' + frac(x[0], v.b)); say.push(v.w1 + ' × ' + v.b + ' + ' + v.a + ' = ' + x[0]); }
      if (v.w2) { conv.push(T(v.w2, v.c, v.d) + ' = ' + frac(x[2], v.d)); say.push(v.w2 + ' × ' + v.d + ' + ' + v.c + ' = ' + x[2]); }
      return divideSteps([{ say: '대분수를 가분수로 바꿔요. ' + say.join(', ') + '.', tex: conv.join(',\\quad ') }], x[0], x[1], x[2], x[3]);
    },
    /* ①②③ 은 분수 ÷ 분수와 같음 ④ 나누는 대분수의 분수 부분만 뒤집음 */
    mistakes: divMistakes(mixedX).concat([
      { id: 'fraction-part-flipped', wrong: when(function (v) { return v.w2 > 0; }, function (v) { var x = mixedX(v); return V(x[0] * (v.w2 * v.c + v.d), x[1] * v.c); }),
        explain: function (v) { var x = mixedX(v); return '나누는 수 ' + readM(v.w2, v.c, v.d) + '에서 분수 부분만 뒤집었어요. 대분수는 먼저 가분수 ' + readJ(x[2], x[3], '으로/로') + ' 바꾼 다음 통째로 뒤집어요: ' + read(x[3], x[2]) + '.'; } }
    ])
  });
})();
