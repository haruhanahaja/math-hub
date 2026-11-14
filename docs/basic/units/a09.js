/* A09 약분과 통분 — 크기가 같은 분수, 기약분수, 통분, 분수의 크기 비교
   유형(쉬운 것부터): A09.equal 크기가 같은 분수 · A09.reduce 기약분수로 약분 · A09.common 통분 · A09.compare 크기 비교
   A09.reduce 는 기약분수로 써야 한다(reduce: 'require'). A09.compare 는 보기(>, =, <)를 고른다(choice). */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F, gcd = MH.gcd, lcm = MH.lcm, K = MH.kinds.fraction;

  var tex = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  /** 글로 읽는 분수: 4분의 3. 조사는 마지막에 읽는 분자에 맞춘다. */
  var read = function (n, d) { return d + '분의 ' + n; };
  var readJ = function (n, d, pair) { return d + '분의 ' + josa(n, pair); };
  var when = function (test, make) { return function (v) { return test(v) ? make(v) : null; }; };
  var reduced = function (v) { return gcd(v.a, v.b) === 1; };

  /* ── A09.equal 크기가 같은 분수 ───────────────────────
     a/b(기약분수)와 ak/bk. form 0: a/b = □/bk · 1: a/b = ak/□ (곱하기) · 2: ak/bk = □/b · 3: ak/bk = a/□ (나누기) */
  var part = function (v) {
    var A = v.a * v.k, B = v.b * v.k;
    return [
      { from: v.b, to: B, src: v.a, ans: A, known: '분모', unknown: '분자', mult: true },
      { from: v.a, to: A, src: v.b, ans: B, known: '분자', unknown: '분모', mult: true },
      { from: B, to: v.b, src: A, ans: v.a, known: '분모', unknown: '분자', mult: false },
      { from: A, to: v.a, src: B, ans: v.b, known: '분자', unknown: '분모', mult: false }
    ][v.form];
  };
  var equalTex = function (v, box) {
    var A = v.a * v.k, B = v.b * v.k;
    return [tex(v.a, v.b) + ' = ' + tex(box, B), tex(v.a, v.b) + ' = ' + tex(A, box), tex(A, B) + ' = ' + tex(box, v.b), tex(A, B) + ' = ' + tex(v.a, box)][v.form];
  };
  /** 같은 계산을 식으로: 3 × 4 = 12 / 12 ÷ 4 = 3 */
  var same = function (p, k) { return p.src + (p.mult ? ' × ' : ' ÷ ') + k + ' = ' + p.ans; };
  /** 다른 쪽에도 똑같이: 분자에도 똑같이 3을 곱해요 / 분모도 똑같이 4로 나눠요 */
  var also = function (p, k) { return p.unknown + (p.mult ? '에도 똑같이 ' + josa(k, '을/를') + ' 곱해요' : '도 똑같이 ' + josa(k, '으로/로') + ' 나눠요'); };
  MH.defineType({
    id: 'A09.equal', unit: 'A09', version: 1, title: '크기가 같은 분수',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '같은 수를 곱하기', minDistinct: 180, vars: { form: pick([0, 1]), b: int(2, 9), a: function (v) { return int(1, v.b - 1); }, k: int(2, 5) }, where: reduced },
      { name: '같은 수로 나누기', minDistinct: 180, vars: { form: pick([2, 3]), b: int(2, 9), a: function (v) { return int(1, v.b - 1); }, k: int(2, 5) }, where: reduced },
      { name: '섞어서, 더 큰 수', vars: { form: pick([0, 1, 2, 3]), b: int(3, 12), a: function (v) { return int(1, v.b - 1); }, k: int(3, 9) }, where: reduced }
    ],
    prompt: function (v) { return { tex: equalTex(v, '\\square'), text: '□에 알맞은 수를 쓰세요.' }; },
    solve: function (v) { return part(v).ans; },
    /* 검산: 답을 □에 넣은 분수가 다른 쪽 분수와 같은 값인가 */
    verify: function (v, ans) {
      var A = v.a * v.k, B = v.b * v.k;
      return [F(ans, B).equals(F(v.a, v.b)), F(A, ans).equals(F(v.a, v.b)), F(ans, v.b).equals(F(A, B)), F(v.a, ans).equals(F(A, B))][v.form];
    },
    hints: function (v) {
      var p = part(v);
      return [
        '분자와 분모에 0이 아닌 같은 수를 곱하거나, 분자와 분모를 같은 수로 나눠도 분수의 크기는 변하지 않아요.',
        p.known + ' ' + josa(p.from, '이/가') + ' ' + josa(p.to, '이/가') + ' 됐어요. ' + (p.mult ? '몇을 곱했는지' : '몇으로 나눴는지') + ' 찾아보세요.',
        p.unknown + (p.mult ? '에도 똑같이 그 수를 곱해요.' : '도 똑같이 그 수로 나눠요.')
      ];
    },
    steps: function (v) {
      var p = part(v);
      return [
        { say: p.known + ' ' + josa(p.from, '이/가') + ' ' + josa(p.to, '이/가') + ' 됐어요. ' + (p.mult ? p.to + ' ÷ ' + p.from + ' = ' + v.k + '이니까 ' + josa(v.k, '을/를') + ' 곱한 거예요.' : p.from + ' ÷ ' + p.to + ' = ' + v.k + '이니까 ' + josa(v.k, '으로/로') + ' 나눈 거예요.') },
        { say: '크기가 같으려면 ' + also(p, v.k) + ': ' + same(p, v.k) + '.', tex: equalTex(v, p.ans), value: p.ans }
      ];
    },
    /* ① 곱하지(나누지) 않고 차이만큼 더함(뺌) ② 한쪽만 바꾸고 그대로 둠 ③ 곱한(나눈) 수를 답함 */
    mistakes: [
      { id: 'added', wrong: function (v) { var p = part(v), w = p.src + (p.to - p.from); return w > 0 ? w : null; },
        explain: function (v) {
          var p = part(v), gap = Math.abs(p.to - p.from);
          return p.known + (p.mult ? '에 ' + josa(gap, '을/를') + ' 더한' : '에서 ' + josa(gap, '을/를') + ' 뺀') + ' 것으로 보고 ' + p.unknown + (p.mult ? '에도 더했어요' : '에서도 뺐어요') + '. 같은 수를 더하거나 빼면 분수의 크기가 달라져요. ' + also(p, v.k) + ': ' + same(p, v.k) + '.';
        } },
      { id: 'unchanged', wrong: function (v) { return part(v).src; },
        explain: function (v) { var p = part(v); return p.unknown + ' ' + josa(p.src, '을/를') + ' 그대로 썼어요. ' + p.known + '만 바뀌면 분수의 크기가 달라져요. ' + also(p, v.k) + ': ' + same(p, v.k) + '.'; } },
      { id: 'factor-only', wrong: function (v) { return v.k; },
        explain: function (v) { var p = part(v); return (p.mult ? '곱한 수 ' : '나눈 수 ') + josa(v.k, '을/를') + ' 썼어요. □에는 ' + p.unknown + ' ' + josa(p.src, p.mult ? '에/에' : '을/를') + ' ' + (p.mult ? josa(v.k, '을/를') + ' 곱한' : josa(v.k, '으로/로') + ' 나눈') + ' 수가 들어가요: ' + same(p, v.k) + '.'; } }
    ]
  });

  /* ── A09.reduce 기약분수로 약분 ───────────────────────
     n/d = (a × g)/(b × g), a/b 는 기약분수. 답은 a/b. 덜 약분한 답은 틀린 것이 아니라 다시 쓰게 한다(reduce: 'require'). */
  var nd = { n: function (v) { return v.a * v.g; }, d: function (v) { return v.b * v.g; } };
  var reduceVars = function (b, g) { return { b: b, a: function (v) { return int(1, v.b - 1); }, g: g, n: nd.n, d: nd.d }; };
  /** 분자와 분모를 함께 나누는 가장 작은 수(1 제외) */
  var smallest = function (n, d) { for (var p = 2; p <= n; p++) if (n % p === 0 && d % p === 0) return p; return 1; };
  var typed = function (raw) { var p = K.parse(raw, { reduce: 'require' }); return p && p.pn !== null && !p.w ? p : null; };
  MH.defineType({
    id: 'A09.reduce', unit: 'A09', version: 1, title: '기약분수로 나타내기',
    answer: { kind: 'fraction', reduce: 'require', common: false },
    levels: [
      { name: '한 번 나누면 끝', minDistinct: 70, vars: reduceVars(int(2, 9), pick([2, 3, 5])), where: reduced },
      { name: '여러 번 나누기', minDistinct: 140, vars: reduceVars(int(2, 9), pick([4, 6, 8, 9, 10, 12])), where: reduced },
      { name: '더 큰 수', vars: reduceVars(int(3, 12), int(6, 18)), where: reduced }
    ],
    prompt: function (v) { return { tex: tex(v.n, v.d), text: '기약분수로 나타내세요.' }; },
    solve: function (v) { var f = F(v.n, v.d); return { n: Number(f.n), d: Number(f.d) }; },
    /* 검산: 값이 처음 분수와 같고, 분자와 분모를 함께 나누는 수가 1뿐인가 */
    verify: function (v, ans) { return ans.n * v.d === v.n * ans.d && gcd(ans.n, ans.d) === 1 && ans.n === v.a && ans.d === v.b; },
    hints: function (v) {
      var p = smallest(v.n, v.d);
      return [
        '분자와 분모를 함께 나눌 수 있는 수(공약수)를 찾아보세요. 1은 빼고요.',
        josa(v.n, '과/와') + ' ' + josa(v.d, '은/는') + ' 둘 다 ' + josa(p, '으로/로') + ' 나누어떨어져요.',
        '나눈 뒤에도 함께 나눌 수 있는 수가 또 있는지 확인해요. 더 나눌 수 없을 때까지 하면 기약분수예요.'
      ];
    },
    steps: function (v) {
      var n = v.n, d = v.d, out = [];
      while (smallest(n, d) > 1) {
        var p = smallest(n, d);
        out.push({ say: josa(n, '과/와') + ' ' + josa(d, '은/는') + ' 둘 다 ' + josa(p, '으로/로') + ' 나누어떨어져요. 분자와 분모를 ' + josa(p, '으로/로') + ' 나눠요.', tex: tex(n, d) + ' = ' + tex(n + ' \\div ' + p, d + ' \\div ' + p) + ' = ' + tex(n / p, d / p) });
        n /= p; d /= p;
      }
      out.push({ say: josa(n, '과/와') + ' ' + josa(d, '을/를') + ' 함께 나눌 수 있는 수는 1뿐이에요. 기약분수는 ' + readJ(n, d, '이에요/예요') + '.' + (out.length > 1 ? ' (처음부터 최대공약수 ' + josa(v.g, '으로/로') + ' 한 번에 나눠도 돼요.)' : ''), tex: tex(v.n, v.d) + ' = ' + tex(n, d), value: { n: n, d: d } });
      return out;
    },
    /* ① 분자만 나눔 ② 분모만 나눔 ③ 분자와 분모에서 같은 수를 뺌 ④ 분자와 분모를 서로 다른 수로 나눔 */
    mistakes: [
      { id: 'numerator-only', wrong: function (v) { return { n: v.a, d: v.d }; },
        explain: function (v) { return '분자만 ' + josa(v.g, '으로/로') + ' 나눴어요. 분모 ' + v.d + '도 똑같이 ' + josa(v.g, '으로/로') + ' 나눠야 크기가 변하지 않아요: ' + v.d + ' ÷ ' + v.g + ' = ' + v.b + '.'; } },
      { id: 'denominator-only', wrong: function (v) { return { n: v.n, d: v.b }; },
        explain: function (v) { return '분모만 ' + josa(v.g, '으로/로') + ' 나눴어요. 분자 ' + v.n + '도 똑같이 ' + josa(v.g, '으로/로') + ' 나눠야 크기가 변하지 않아요: ' + v.n + ' ÷ ' + v.g + ' = ' + v.a + '.'; } },
      { id: 'subtracted', wrong: function (v) { var p = smallest(v.n, v.d); return v.n > p ? { n: v.n - p, d: v.d - p } : null; },
        match: function (v, raw) { var p = typed(raw); return !!p && p.n >= 1 && p.n < v.n && v.n - p.n === v.d - p.d; },
        explain: function (v, ctx, value) {
          var k = value ? v.n - value.n : smallest(v.n, v.d);
          return '분자와 분모에서 똑같이 ' + josa(k, '을/를') + ' 뺐어요. 같은 수를 빼면 분수의 크기가 달라져요. 약분은 분자와 분모를 같은 수로 나누는 거예요.';
        } },
      { id: 'different-divisors',
        match: function (v, raw) { var p = typed(raw); return !!p && p.n >= 1 && v.n % p.n === 0 && v.d % p.d === 0 && v.n / p.n !== v.d / p.d; },
        explain: function (v, ctx, value) {
          var x = v.n / value.n, y = v.d / value.d;
          var did = x === 1 ? '분모만 ' + josa(y, '으로/로') + ' 나눴어요' : y === 1 ? '분자만 ' + josa(x, '으로/로') + ' 나눴어요' : '분자는 ' + josa(x, '으로/로') + ', 분모는 ' + josa(y, '으로/로') + ' 나눴어요';
          return did + '. 분자와 분모를 같은 수로 나눠야 크기가 변하지 않아요. ' + josa(v.n, '과/와') + ' ' + josa(v.d, '을/를') + ' 함께 나눌 수 있는 수를 찾아보세요.';
        } }
    ]
  });

  /* ── A09.common 통분 ─────────────────────────────────
     기약분수 a/b, c/d (b ≠ d), L = 두 분모의 최소공배수.
     q 0: 가장 작은 공통분모 L 을 묻는다 · q 1: 공통분모를 보여 주고 분자를 묻는다 · q 2: 공통분모 없이 분자를 묻는다
     which: □가 앞 분수(0)에 있는지 뒤 분수(1)에 있는지 */
  var L = function (v) { return lcm(v.b, v.d); };
  /** □가 있는 분수(n/d)와 그 분수에 곱하는 수 m, 다른 분수(on/od)와 곱하는 수 om */
  var target = function (v) {
    var t = v.which === 0 ? { n: v.a, d: v.b, on: v.c, od: v.d } : { n: v.c, d: v.d, on: v.a, od: v.b };
    t.m = L(v) / t.d; t.om = L(v) / t.od;
    return t;
  };
  var commonVars = function (q, lo, hi) {
    return { q: q, which: q === 0 ? 0 : pick([0, 1]), b: int(lo, hi), d: int(lo, hi), a: function (v) { return int(1, v.b - 1); }, c: function (v) { return int(1, v.d - 1); } };
  };
  /* 분모가 다른 기약분수 둘. 분자를 묻는 문제는 □가 있는 분수의 분모가 실제로 바뀌어야 한다(1 을 곱하는 문제 제외). */
  var twoReduced = function (v) { return v.b !== v.d && gcd(v.a, v.b) === 1 && gcd(v.c, v.d) === 1 && (v.q === 0 || target(v).m > 1); };
  /** 통분을 두 줄로: 3/4 = 9/12, 5/6 = 10/12 (좁은 화면에서도 넘치지 않게 위아래로 쓴다) */
  var twoLines = function (v, x, y, l) { return '\\begin{aligned}' + tex(v.a, v.b) + ' &= ' + tex(x, l) + ' \\\\[6pt] ' + tex(v.c, v.d) + ' &= ' + tex(y, l) + '\\end{aligned}'; };
  var multiples = function (n, upTo) { var out = []; for (var m = n; m <= upTo; m += n) out.push(m); return out.join(', '); };
  var asked = function (q) { return function (v) { return q.indexOf(v.q) >= 0; }; };
  MH.defineType({
    id: 'A09.common', unit: 'A09', version: 1, title: '통분',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '가장 작은 공통분모', vars: commonVars(0, 2, 9), where: twoReduced },
      { name: '통분한 분자', vars: commonVars(1, 2, 10), where: twoReduced },
      { name: '공통분모부터 스스로', minDistinct: 250, vars: commonVars(2, 4, 12), where: function (v) { return twoReduced(v) && gcd(v.b, v.d) > 1; } }
    ],
    prompt: function (v) {
      if (v.q === 0) return { tex: tex(v.a, v.b) + ',\\quad ' + tex(v.c, v.d), text: '두 분수를 통분하려고 해요. 공통분모가 될 수 있는 수 가운데 가장 작은 수를 쓰세요.' };
      var t = target(v), l = v.q === 1 ? L(v) : '\\triangle', other = v.q === 1 ? t.on * t.om : '\\bigcirc';
      return { tex: v.which === 0 ? twoLines(v, '\\square', other, l) : twoLines(v, other, '\\square', l), text: (v.q === 1 ? '두 분수를 통분했어요.' : '가장 작은 공통분모로 통분할 때,') + ' □에 알맞은 수를 쓰세요.' };
    },
    solve: function (v) { var t = target(v); return v.q === 0 ? L(v) : t.n * t.m; },
    /* 검산: (q 0) 두 분모로 나누어떨어지고, 그보다 작은 공배수가 없는가 · (q 1, 2) 답/L 이 원래 분수와 같은 값인가 */
    verify: function (v, ans) {
      if (v.q === 0) { for (var m = 1; m < ans; m++) if (m % v.b === 0 && m % v.d === 0) return false; return ans % v.b === 0 && ans % v.d === 0; }
      var t = target(v);
      return F(ans, L(v)).equals(F(t.n, t.d));
    },
    hints: function (v) {
      if (v.q === 0) return [
        '공통분모는 두 분모 ' + josa(v.b, '과/와') + ' ' + v.d + ' 모두의 배수(공배수)예요.',
        v.b + '의 배수와 ' + v.d + '의 배수를 작은 것부터 차례로 써 보세요.',
        '두 줄에 처음으로 똑같이 나오는 수가 가장 작은 공통분모(최소공배수)예요.'
      ];
      var t = target(v);
      return [
        v.q === 1 ? '분모 ' + josa(t.d, '이/가') + ' ' + josa(L(v), '이/가') + ' 됐어요. 몇을 곱했는지 찾아보세요.' : '먼저 공통분모를 정해요. ' + josa(v.b, '과/와') + ' ' + v.d + '의 최소공배수가 가장 작은 공통분모예요.',
        v.q === 1 ? '분모에 곱한 수를 분자에도 똑같이 곱해야 크기가 변하지 않아요.' : '공통분모를 원래 분모 ' + josa(t.d, '으로/로') + ' 나누면 곱할 수가 나와요.',
        v.q === 1 ? '곱할 수는 ' + L(v) + ' ÷ ' + josa(t.d, '이에요/예요') + '.' : '그 수를 분자 ' + t.n + '에도 똑같이 곱해요.'
      ];
    },
    steps: function (v) {
      var l = L(v);
      if (v.q === 0) return [
        { say: '공통분모는 두 분모의 공배수예요. 배수를 차례로 써 봐요.', tex: '\\begin{aligned}' + v.b + '&: ' + multiples(v.b, l) + ', \\cdots \\\\ ' + v.d + '&: ' + multiples(v.d, l) + ', \\cdots\\end{aligned}' },
        { say: '처음으로 똑같이 나오는 수는 ' + josa(l, '이에요/예요') + '. 가장 작은 공통분모는 두 분모의 최소공배수 ' + josa(l, '이에요/예요') + '.' + (l === v.b * v.d ? '' : ' (두 분모의 곱 ' + v.b * v.d + '보다 작아요.)'), value: l }
      ];
      var t = target(v), ans = t.n * t.m;
      return [
        { say: v.q === 1 ? '공통분모는 ' + josa(l, '이에요/예요') + '.' : josa(v.b, '과/와') + ' ' + v.d + '의 최소공배수는 ' + josa(l, '이에요/예요') + '. 이것이 가장 작은 공통분모예요.' },
        { say: l + ' ÷ ' + t.d + ' = ' + t.m + '이니까 분모와 분자에 ' + josa(t.m, '을/를') + ' 곱해요.', tex: tex(t.n, t.d) + ' = ' + tex(t.n + ' \\times ' + t.m, t.d + ' \\times ' + t.m) + ' = ' + tex(ans, l) },
        { say: '□에 알맞은 수는 ' + josa(ans, '이에요/예요') + '.' + (t.om === 1 ? ' 다른 분수는 분모가 이미 ' + l + '이라서 그대로예요.' : ' 다른 분수는 ' + l + ' ÷ ' + t.od + ' = ' + josa(t.om, '을/를') + ' 곱해 ' + readJ(t.on * t.om, l, '이/가') + ' 돼요.'), tex: twoLines(v, v.a * l / v.b, v.c * l / v.d, l), value: ans }
      ];
    },
    /* 공통분모: ① 두 분모를 곱함 ② 공약수를 씀 ③ 두 분모를 더함 ④ 큰 분모를 그대로 씀
       분자: ⑤ 분자를 그대로 둠 ⑥ 곱할 수만 씀 ⑦ 다른 분수에 곱할 수를 곱함 ⑧ 분모가 늘어난 만큼 더함 ⑨ 두 분모의 곱을 공통분모로 씀 */
    mistakes: [
      { id: 'product', wrong: when(asked([0]), function (v) { return v.b * v.d; }),
        explain: function (v) { return '두 분모를 곱한 ' + v.b + ' × ' + v.d + ' = ' + v.b * v.d + '도 공통분모가 될 수 있어요. 하지만 더 작은 공통분모가 있어요. ' + v.b + '의 배수와 ' + v.d + '의 배수를 차례로 써서 처음 겹치는 수를 찾아보세요.'; } },
      { id: 'gcd', wrong: when(function (v) { return v.q === 0 && gcd(v.b, v.d) > 1; }, function (v) { return gcd(v.b, v.d); }),
        explain: function (v) { return '두 분모를 함께 나누는 수(공약수)를 썼어요. 공통분모는 두 분모의 배수 가운데서 찾아요. 약수가 아니라 공배수예요.'; } },
      { id: 'sum', wrong: when(asked([0]), function (v) { return v.b + v.d; }),
        explain: function (v) { return '두 분모를 더했어요. 공통분모는 ' + josa(v.b, '과/와') + ' ' + v.d + ' 모두의 배수여야 해요. ' + josa(v.b + v.d, '은/는') + ' 두 수 모두의 배수가 아니에요.'; } },
      { id: 'bigger', wrong: when(asked([0]), function (v) { return Math.max(v.b, v.d); }),
        explain: function (v) { var big = Math.max(v.b, v.d), small = Math.min(v.b, v.d); return '큰 분모 ' + josa(big, '을/를') + ' 그대로 썼어요. ' + josa(big, '은/는') + ' ' + small + '의 배수가 아니라서 공통분모가 될 수 없어요. ' + big + '의 배수를 차례로 보면서 ' + small + '의 배수이기도 한 수를 찾아보세요.'; } },
      { id: 'unchanged', wrong: when(asked([1, 2]), function (v) { return target(v).n; }),
        explain: function (v) { var t = target(v); return '분자 ' + josa(t.n, '을/를') + ' 그대로 썼어요. 분모만 바꾸면 분수의 크기가 달라져요. 분모에 ' + josa(t.m, '을/를') + ' 곱했으니 분자에도 곱해요: ' + t.n + ' × ' + t.m + ' = ' + t.n * t.m + '.'; } },
      { id: 'multiplier', wrong: when(asked([1, 2]), function (v) { return target(v).m; }),
        explain: function (v) { var t = target(v); return '분모에 곱한 수 ' + josa(t.m, '을/를') + ' 썼어요. □에는 분자 ' + t.n + '에 ' + josa(t.m, '을/를') + ' 곱한 수가 들어가요: ' + t.n + ' × ' + t.m + ' = ' + t.n * t.m + '.'; } },
      { id: 'other-multiplier', wrong: when(function (v) { return v.q > 0 && target(v).m !== target(v).om; }, function (v) { var t = target(v); return t.n * t.om; }),
        explain: function (v) { var t = target(v); return '다른 분수에 곱할 수 ' + josa(t.om, '을/를') + ' 곱했어요. ' + readJ(t.n, t.d, '은/는') + ' 분모 ' + josa(t.d, '이/가') + ' ' + josa(L(v), '이/가') + ' 되도록 ' + josa(t.m, '을/를') + ' 곱해요: ' + t.n + ' × ' + t.m + ' = ' + t.n * t.m + '.'; } },
      { id: 'added', wrong: when(asked([1, 2]), function (v) { var t = target(v); return t.n + L(v) - t.d; }),
        explain: function (v) { var t = target(v); return '분모가 ' + (L(v) - t.d) + '만큼 늘었다고 분자에도 ' + josa(L(v) - t.d, '을/를') + ' 더했어요. 같은 수를 더하면 크기가 달라져요. 분모에 ' + josa(t.m, '을/를') + ' 곱했으니 분자에도 곱해요: ' + t.n + ' × ' + t.m + ' = ' + t.n * t.m + '.'; } },
      { id: 'product-denominator', wrong: when(asked([2]), function (v) { var t = target(v); return t.n * t.od; }),
        explain: function (v) { var t = target(v); return '두 분모의 곱 ' + josa(v.b * v.d, '을/를') + ' 공통분모로 했어요. 틀린 통분은 아니지만 가장 작은 공통분모는 최소공배수 ' + josa(L(v), '이에요/예요') + '. ' + L(v) + ' ÷ ' + t.d + ' = ' + t.m + '이니까 분자는 ' + t.n + ' × ' + t.m + ' = ' + josa(t.n * t.m, '이에요/예요') + '.'; } }
    ]
  });

  /* ── A09.compare 분수의 크기 비교 ─────────────────────
     a/b ○ c/d 의 ○에 들어갈 기호(>, =, <)를 고른다. */
  var SIGN = function (x, y) { return x > y ? '>' : x < y ? '<' : '='; };
  /** 통분: 공통분모 l, 두 분자 x, y */
  var both = function (v) { var l = L(v); return { l: l, x: v.a * (l / v.b), y: v.c * (l / v.d) }; };
  var compareTex = function (v, sign) { return tex(v.a, v.b) + ' \\;' + sign + '\\; ' + tex(v.c, v.d); };
  var bigger = function (x, y) { return josa(x, '이/가') + ' ' + y + '보다 ' + (x > y ? '크니까' : '작으니까'); };
  /** 맺음말: 4분의 3이 6분의 5보다 작아요. */
  var verdict = function (v) {
    var t = both(v);
    return t.x === t.y ? readJ(v.a, v.b, '과/와') + ' ' + readJ(v.c, v.d, '은/는') + ' 크기가 같아요.' : readJ(v.a, v.b, '이/가') + ' ' + read(v.c, v.d) + '보다 ' + (t.x > t.y ? '커요.' : '작아요.');
  };
  /** 왜 그런지: 분모가 같을 때 · 분자가 같을 때 · 통분해야 할 때 */
  var why = function (v) {
    var t = both(v);
    if (v.b === v.d) return '분모가 같으니 분자를 비교해요. ' + bigger(v.a, v.c) + ' ';
    if (v.a === v.c) return '분자가 같으면 분모가 작은 쪽이 더 커요. 분모 ' + bigger(v.b, v.d) + ' ';
    return '분모를 ' + josa(t.l, '으로/로') + ' 같게 하면(통분) ' + readJ(t.x, t.l, '과/와') + ' ' + readJ(t.y, t.l, '이에요/예요') + '. ' + (t.x === t.y ? '분자가 같으니까 ' : '분자 ' + bigger(t.x, t.y) + ' ');
  };
  var multipleVars = function (name) {
    /* 작은 분모 s 의 분수 p/s 와, 분모가 s × k 인 분수. e 가 0 이면 크기가 같은 분수, 아니면 분자를 off 만큼 어긋나게 한다. flip 이면 자리를 바꾼다. */
    var small = { a: function (v) { return v.p; }, b: function (v) { return v.s; } };
    var large = { a: function (v) { return v.p * v.k + (v.e ? v.off : 0); }, b: function (v) { return v.s * v.k; } };
    return function (v) { return (v.flip ? (name === 'a' || name === 'b' ? large : small) : (name === 'a' || name === 'b' ? small : large))[name === 'a' || name === 'c' ? 'a' : 'b'](v); };
  };
  MH.defineType({
    id: 'A09.compare', unit: 'A09', version: 1, title: '분수의 크기 비교',
    answer: { kind: 'choice', options: ['>', '=', '<'] },
    levels: [
      { name: '분모나 분자가 같을 때', vars: { mode: pick([0, 1]), b: int(3, 12), d: function (v) { return v.mode === 0 ? v.b : int(2, 12); }, a: function (v) { return int(1, Math.min(v.b, v.d) - 1); }, c: function (v) { return v.mode === 0 ? int(1, v.b - 1) : v.a; } },
        where: function (v) { return v.mode === 0 ? v.a !== v.c : v.b !== v.d; } },
      { name: '한 분모가 다른 분모의 배수', minDistinct: 150, vars: { s: int(2, 6), k: int(2, 4), p: function (v) { return int(1, v.s - 1); }, e: pick([0, 1, 1, 1]), off: pick([-2, -1, 1, 2]), flip: pick([0, 1]), a: multipleVars('a'), b: multipleVars('b'), c: multipleVars('c'), d: multipleVars('d') },
        where: function (v) { return v.a >= 1 && v.a < v.b && v.c >= 1 && v.c < v.d; } },
      { name: '통분해서 비교', vars: { b: int(3, 12), d: int(3, 12), a: function (v) { return int(1, v.b - 1); }, c: function (v) { return int(1, v.d - 1); } },
        where: function (v) { return v.b % v.d !== 0 && v.d % v.b !== 0 && 4 * Math.abs(v.a * v.d - v.c * v.b) < v.b * v.d; } }
    ],
    prompt: function (v) { return { tex: compareTex(v, '\\bigcirc'), text: '○ 안에 알맞은 기호를 고르세요.' }; },
    solve: function (v) { var t = both(v); return SIGN(t.x, t.y); },
    /* 검산: 통분하지 않고 정확한 분수 계산으로 비교 */
    verify: function (v, ans) { var c = F(v.a, v.b).compare(F(v.c, v.d)); return ans === (c > 0 ? '>' : c < 0 ? '<' : '='); },
    hints: function (v) {
      if (v.b === v.d) return ['분모가 같으면 조각 하나의 크기가 같아요.', '조각 수(분자)가 많은 쪽이 더 커요.', '분자 ' + josa(v.a, '과/와') + ' ' + v.c + ' 가운데 어느 쪽이 큰지 보세요.'];
      if (v.a === v.c) return ['분자가 같으면 조각 수가 같아요. 조각 하나의 크기를 비교해요.', '분모가 클수록 더 잘게 나눈 것이라 조각 하나가 작아요.', '분모 ' + josa(v.b, '과/와') + ' ' + v.d + ' 가운데 작은 쪽의 분수가 더 커요.'];
      var big = Math.max(v.b, v.d), small = Math.min(v.b, v.d);
      return [
        '분모가 다르면 그대로는 비교할 수 없어요. 분모를 같게 만들어요(통분).',
        big % small === 0 ? josa(big, '은/는') + ' ' + small + '의 배수니까 공통분모를 ' + josa(big, '으로/로') + ' 하면 돼요.' : josa(v.b, '과/와') + ' ' + v.d + '의 최소공배수를 공통분모로 해요.',
        '분모가 같아지면 분자가 큰 쪽이 더 커요. 분자까지 같으면 크기가 같은 분수예요.'
      ];
    },
    steps: function (v) {
      var t = both(v), sign = SIGN(t.x, t.y), last = { tex: compareTex(v, sign), value: sign };
      if (v.b === v.d) return [
        { say: '분모가 ' + josa(v.b, '으로/로') + ' 같아요. 조각 하나의 크기가 같으니 분자만 비교하면 돼요.' },
        { say: bigger(v.a, v.c) + ' ' + verdict(v), tex: last.tex, value: sign }
      ];
      if (v.a === v.c) return [
        { say: '분자가 ' + josa(v.a, '으로/로') + ' 같아요. 조각 수가 같으니 조각 하나의 크기를 비교해요.' },
        { say: '분모가 작을수록 조각 하나가 커요. 분모 ' + bigger(v.b, v.d) + ' ' + verdict(v), tex: last.tex, value: sign }
      ];
      var changed = [];
      if (t.l !== v.b) changed.push(tex(v.a, v.b) + ' = ' + tex(t.x, t.l));
      if (t.l !== v.d) changed.push(tex(v.c, v.d) + ' = ' + tex(t.y, t.l));
      return [
        { say: '분모가 달라서 그대로는 비교할 수 없어요. 공통분모를 ' + josa(t.l, '으로/로') + ' 해서 통분해요.', tex: changed.join(',\\quad ') },
        { say: '분모가 같아졌으니 분자를 비교해요.', tex: tex(t.x, t.l) + ' \\;' + sign + '\\; ' + tex(t.y, t.l) },
        { say: (t.x === t.y ? '분자가 같으니까 ' : bigger(t.x, t.y) + ' ') + verdict(v), tex: last.tex, value: sign }
      ];
    },
    /* ① 분자가 같을 때 분모가 큰 쪽을 크다고 함 ② 분자와 분모의 수가 큰 쪽을 크다고 함 ③ 크기가 같은데 다르다고 함 ④ 부등호 방향이 반대 ⑤ 크기가 다른데 같다고 함 */
    mistakes: [
      { id: 'bigger-denominator', wrong: function (v) { return v.a === v.c && v.b !== v.d ? SIGN(v.b, v.d) : null; },
        explain: function (v) { return '분모가 큰 쪽을 더 크다고 봤어요. 분자가 같을 때는 분모가 작은 쪽이 더 커요. 똑같이 나눈 조각 수가 적을수록 조각 하나가 크니까요. ' + verdict(v); } },
      { id: 'bigger-numbers', wrong: function (v) { return v.a > v.c && v.b > v.d ? '>' : v.a < v.c && v.b < v.d ? '<' : null; },
        explain: function (v) { return '분자와 분모의 수가 크다고 더 큰 분수는 아니에요. ' + why(v) + verdict(v); } },
      { id: 'missed-equal', match: function (v, raw) { var t = both(v); return t.x === t.y && (raw === '>' || raw === '<'); },
        explain: function (v) { return '두 분수는 모양이 달라도 크기가 같아요. ' + why(v) + verdict(v); } },
      { id: 'opposite', wrong: function (v) { var t = both(v); return t.x === t.y ? null : SIGN(t.y, t.x); },
        explain: function (v) { return '부등호의 방향이 반대예요. 부등호는 벌어진 쪽이 큰 수예요. ' + why(v) + verdict(v); } },
      { id: 'said-equal', wrong: function () { return '='; },
        explain: function (v) { return '두 분수의 크기는 같지 않아요. ' + why(v) + verdict(v); } }
    ]
  });
})();
