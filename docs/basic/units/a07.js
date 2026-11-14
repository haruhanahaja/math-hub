/* A07 약수와 배수 — 약수, 배수, 최대공약수, 최소공배수
   유형(쉬운 것부터): A07.divisors 약수 · A07.multiples 배수 · A07.gcd 최대공약수 · A07.lcm 최소공배수 · A07.word 문장제
   두 수를 다루는 유형에서 a 는 작은 수, b 는 큰 수다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, INT = MH.kinds.int;

  /** n 의 약수를 작은 수부터(짝을 지어 찾는다): { list, pairs: ['1 × 24', …] } */
  function divisors(n) {
    var low = [], high = [], pairs = [];
    for (var d = 1; d * d <= n; d++) if (n % d === 0) { low.push(d); if (d * d !== n) high.unshift(n / d); pairs.push(d + ' × ' + n / d); }
    return { list: low.concat(high), pairs: pairs };
  }
  /** 검산용: 1 부터 n 까지 하나씩 나눠 보며 센다(divisors 와 다른 방법) */
  function divisorsSlow(n) { var out = []; for (var d = 1; d <= n; d++) if (n % d === 0) out.push(d); return out; }
  /** a × q 가 limit 를 넘지 않는 가장 큰 q */
  function fit(limit, a) { var q = 0; while (a * (q + 1) <= limit) q++; return q; }
  /** 1 보다 큰 가장 작은 공약수(없으면 1) */
  function smallestCommon(a, b) { for (var d = 2; d <= a; d++) if (a % d === 0 && b % d === 0) return d; return 1; }
  /** 검산용: 큰 수부터 내려오며 찾는 최대공약수, 배수를 늘어놓아 찾는 최소공배수 */
  function gcdSlow(a, b) { for (var d = a < b ? a : b; d >= 1; d--) if (a % d === 0 && b % d === 0) return d; }
  function lcmSlow(a, b) { for (var x = b; ; x += b) if (x % a === 0) return x; }
  var range = function (lo, hi, test) { var out = []; for (var n = lo; n <= hi; n++) if (test(n)) out.push(n); return out; };
  var manyDivisors = function (n) { return divisors(n).list.length >= 4; };

  /* ── A07.divisors 약수 ────────────────────────────────
     form 0: 약수의 개수 · form 1: 작은 수부터 k번째 약수 */
  var kth = function (v) { return int(2, divisors(v.n).list.length - 1); };
  MH.defineType({
    id: 'A07.divisors', unit: 'A07', version: 1, title: '약수',
    answer: { kind: 'int', common: false, suffix: function (v) { return v.form === 0 ? '개' : ''; } },
    levels: [
      { name: '약수의 개수 (30까지)', minDistinct: 16, vars: { form: 0, n: pick(range(6, 30, manyDivisors)), k: 0 } },
      { name: '몇 번째 약수 (50까지)', minDistinct: 80, vars: { form: 1, n: pick(range(6, 50, manyDivisors)), k: kth } },
      { name: '약수의 개수와 순서 (100까지)', minDistinct: 200, vars: { form: pick([0, 1]), n: pick(range(30, 100, manyDivisors)), k: function (v) { return v.form === 0 ? 0 : kth(v); } } }
    ],
    prompt: function (v) {
      return { text: v.form === 0 ? v.n + '의 약수는 모두 몇 개일까요?' : v.n + '의 약수를 작은 수부터 늘어놓을 때, ' + v.k + '번째 수는 무엇일까요?' };
    },
    solve: function (v) { var d = divisors(v.n).list; return v.form === 0 ? d.length : d[v.k - 1]; },
    verify: function (v, ans) { var d = divisorsSlow(v.n); return ans === (v.form === 0 ? d.length : d[v.k - 1]); },
    hints: function (v) {
      return [
        '약수는 ' + josa(v.n, '을/를') + ' 나누어떨어지게 하는 수예요. 1과 ' + v.n + ' 자신도 약수예요.',
        '곱해서 ' + josa(v.n, '이/가') + ' 되는 두 수를 1 × ' + v.n + '부터 차례로 짝지어 찾아보세요.',
        v.form === 0 ? '찾은 짝에 나온 수를 모두 세요. 같은 수끼리 곱한 짝(예: 4 × 4)의 수는 한 번만 세요.'
          : v.n + '의 약수는 모두 ' + divisors(v.n).list.length + '개예요. 작은 수부터 늘어놓고 ' + v.k + '번째를 찾아요.'
      ];
    },
    steps: function (v) {
      var D = divisors(v.n), d = D.list;
      return [
        { say: '곱해서 ' + josa(v.n, '이/가') + ' 되는 두 수를 작은 수부터 짝지어 찾아요: ' + D.pairs.join(', ') + '.' },
        { say: '짝에 나온 수를 작은 수부터 늘어놓으면 ' + v.n + '의 약수예요: ' + d.join(', ') + '.' },
        v.form === 0 ? { say: '세어 보면 모두 ' + d.length + '개예요.', value: d.length }
          : { say: v.k + '번째 수는 ' + josa(d[v.k - 1], '이에요/예요') + '.', value: d[v.k - 1] }
      ];
    },
    /* 개수: ① 1 과 자기 자신을 빠뜨림 ② 하나를 빠뜨림 ③ 짝의 수를 답함
       순서: ④ 1 을 빼고 셈 ⑤ 한 칸 앞 ⑥ 배수를 구함 ⑦ 약수가 아닌 수 */
    mistakes: [
      { id: 'missed-ends', wrong: function (v) { return v.form === 0 ? divisors(v.n).list.length - 2 : null; },
        explain: function (v) { return '1과 ' + v.n + ' 자신도 ' + v.n + '의 약수예요. 이 두 수를 빠뜨리지 않았는지 확인해 보세요.'; } },
      { id: 'missed-one', wrong: function (v) { return v.form === 0 ? divisors(v.n).list.length - 1 : null; },
        explain: function (v) { return '약수 하나를 빠뜨렸어요. 곱해서 ' + josa(v.n, '이/가') + ' 되는 짝을 1 × ' + v.n + '부터 차례로 찾으면 빠뜨리지 않아요.'; } },
      { id: 'pairs', wrong: function (v) { return v.form === 0 ? divisors(v.n).pairs.length : null; },
        explain: function () { return '짝의 수를 답했어요. 짝마다 수가 두 개씩 들어 있어요(같은 수끼리 곱한 짝만 하나). 짝에 나온 수를 모두 세요.'; } },
      { id: 'counted-from-two', wrong: function (v) { return v.form === 1 ? divisors(v.n).list[v.k] : null; },
        explain: function (v) { return '한 칸 뒤의 수예요. 1도 약수라서 1부터 세어야 해요.'; } },
      { id: 'previous', wrong: function (v) { return v.form === 1 ? divisors(v.n).list[v.k - 2] : null; },
        explain: function (v) { return '한 칸 앞의 수예요. 약수를 작은 수부터 늘어놓고 ' + v.k + '번째를 다시 세어 보세요.'; } },
      { id: 'multiple', wrong: function (v) { return v.form === 1 ? v.n * v.k : null; },
        explain: function (v) { return '배수를 구했어요. 약수는 ' + josa(v.n, '을/를') + ' 나누어떨어지게 하는 수라서 ' + v.n + '보다 클 수 없어요.'; } },
      { id: 'not-divisor', match: function (v, raw) { var x = INT.parse(raw); return v.form === 1 && x !== null && (x < 1 || v.n % x !== 0); },
        explain: function (v, ctx, x) { return josa(x, '은/는') + ' ' + v.n + '의 약수가 아니에요. ' + (x === 0 ? '0으로는 나눌 수 없어요.' : josa(v.n, '을/를') + ' ' + josa(x, '으로/로') + ' 나누면 나누어떨어지지 않아요.'); } }
    ]
  });

  /* ── A07.multiples 배수 ───────────────────────────────
     form 0: k번째 배수 · form 1: 1 부터 N 까지의 배수의 개수 · form 2: N 보다 큰 가장 작은 배수 */
  var onlyForm = function (form, fn) { return function (v) { return v.form === form ? fn(v, fit(v.N, v.a)) : null; }; };
  MH.defineType({
    id: 'A07.multiples', unit: 'A07', version: 1, title: '배수',
    answer: { kind: 'int', common: false, suffix: function (v) { return v.form === 1 ? '개' : ''; } },
    levels: [
      { name: '몇 번째 배수', minDistinct: 100, vars: { form: 0, a: int(2, 12), k: int(2, 12), N: 0 } },
      { name: '범위 안의 배수의 개수', vars: { form: 1, a: int(3, 12), k: 0, N: int(20, 100) }, where: function (v) { return fit(v.N, v.a) >= 2; } },
      { name: '어떤 수보다 큰 가장 작은 배수', vars: { form: 2, a: int(6, 19), k: 0, N: int(50, 200) }, where: function (v) { return v.N % v.a !== 0; } }
    ],
    prompt: function (v) {
      return { text: v.form === 0 ? v.a + '의 배수를 작은 수부터 늘어놓을 때, ' + v.k + '번째 수는 무엇일까요?'
        : v.form === 1 ? '1부터 ' + v.N + '까지의 수 가운데 ' + v.a + '의 배수는 모두 몇 개일까요?'
          : v.N + '보다 큰 ' + v.a + '의 배수 가운데 가장 작은 수는 무엇일까요?' };
    },
    solve: function (v) { var q = fit(v.N, v.a); return v.form === 0 ? v.a * v.k : v.form === 1 ? q : v.a * (q + 1); },
    /* 검산: 배수를 하나씩 더해 가며 직접 센다 */
    verify: function (v, ans) {
      var x = 0, count = 0;
      if (v.form === 0) { for (var i = 0; i < v.k; i++) x += v.a; return x === ans; }
      while (x + v.a <= v.N) { x += v.a; count++; }
      return v.form === 1 ? count === ans : x + v.a === ans && ans > v.N && ans % v.a === 0;
    },
    hints: function (v) {
      var first = v.a + '의 배수는 ' + v.a + ' × 1, ' + v.a + ' × 2, ' + v.a + ' × 3, … 이에요.';
      if (v.form === 0) return [first, '첫 번째 배수는 ' + v.a + ' 자신이에요.', v.k + '번째 배수는 ' + v.a + '에 ' + josa(v.k, '을/를') + ' 곱한 수예요.'];
      if (v.form === 1) return [first, v.a + '에 얼마를 곱해야 ' + josa(v.N, '을/를') + ' 넘지 않으면서 가장 커지는지 찾아보세요.', '그때 곱한 수가 곧 배수의 개수예요. ' + v.N + ' ÷ ' + v.a + ' 의 몫과 같아요.'];
      return [v.N + ' ÷ ' + v.a + ' 의 몫을 구해 보세요.', v.a + '에 그 몫을 곱한 수는 ' + v.N + '보다 작아요. 그다음 배수가 답이에요.', '그다음 배수는 ' + josa(v.a, '을/를') + ' 한 번 더 더하면 돼요.'];
    },
    steps: function (v) {
      var a = v.a, q = fit(v.N, a);
      if (v.form === 0) return [
        { say: a + '의 배수는 ' + a + '에 1, 2, 3, …을 차례로 곱한 수예요. 첫 번째 배수는 ' + a + ' × 1 = ' + josa(a, '이에요/예요') + '.' },
        { say: v.k + '번째 배수는 ' + a + '에 ' + josa(v.k, '을/를') + ' 곱해요.', tex: a + ' \\times ' + v.k + ' = ' + a * v.k, value: a * v.k }
      ];
      var edge = a + ' × ' + q + ' = ' + a * q + ', ' + a + ' × ' + (q + 1) + ' = ' + a * (q + 1) + '. ' + josa(a * (q + 1), '은/는') + ' ' + v.N + '보다 커요.';
      if (v.form === 1) return [
        { say: a + '의 배수 가운데 ' + josa(v.N, '을/를') + ' 넘지 않는 가장 큰 수를 찾아요. ' + edge },
        { say: a + ' × 1부터 ' + a + ' × ' + q + '까지가 ' + v.N + ' 이하의 배수예요. 모두 ' + q + '개예요.', value: q }
      ];
      return [
        { say: v.N + ' 근처의 ' + a + '의 배수를 찾아요. ' + edge },
        { say: josa(a * q, '은/는') + ' ' + v.N + '보다 작으니, ' + v.N + '보다 큰 가장 작은 배수는 그다음 배수예요.', tex: a + ' \\times ' + (q + 1) + ' = ' + a * (q + 1), value: a * (q + 1) }
      ];
    },
    mistakes: [
      { id: 'kth-previous', wrong: onlyForm(0, function (v) { return v.a * (v.k - 1); }),
        explain: function (v) { return v.a + ' × ' + (v.k - 1) + ' 을 답했어요. 첫 번째 배수는 ' + v.a + ' 자신(' + v.a + ' × 1)이에요. ' + v.k + '번째는 ' + v.a + ' × ' + v.k + ' 예요.'; } },
      { id: 'kth-next', wrong: onlyForm(0, function (v) { return v.a * (v.k + 1); }),
        explain: function (v) { return v.a + ' × ' + (v.k + 1) + ' 을 답했어요. 한 번 더 갔어요. ' + v.k + '번째는 ' + v.a + ' × ' + v.k + ' 예요.'; } },
      { id: 'kth-added', wrong: onlyForm(0, function (v) { return v.a + v.k; }),
        explain: function (v) { return '두 수를 더했어요. 배수는 곱해서 만들어요. ' + v.k + '번째 배수는 ' + v.a + ' × ' + v.k + ' 예요.'; } },
      { id: 'count-one-more', wrong: onlyForm(1, function (v, q) { return q + 1; }),
        explain: function (v) { var q = fit(v.N, v.a); return v.a + ' × ' + (q + 1) + ' = ' + josa(v.a * (q + 1), '은/는') + ' ' + v.N + '보다 커서 셀 수 없어요. 0은 1부터 세는 범위에 들어가지 않아요.'; } },
      { id: 'count-one-less', wrong: onlyForm(1, function (v, q) { return q - 1; }),
        explain: function (v) { var q = fit(v.N, v.a); return v.a + ' × ' + q + ' = ' + v.a * q + '도 ' + josa(v.N, '을/를') + ' 넘지 않아요. 하나를 덜 셌어요.'; } },
      { id: 'count-largest', wrong: onlyForm(1, function (v, q) { return v.a * q; }),
        explain: function (v) { var q = fit(v.N, v.a); return '가장 큰 배수를 답했어요. 묻는 것은 개수예요. ' + v.a * q + ' = ' + v.a + ' × ' + q + ' 이니까 배수는 ' + q + '개예요.'; } },
      { id: 'next-below', wrong: onlyForm(2, function (v, q) { return v.a * q; }),
        explain: function (v) { return v.N + '보다 작은 배수를 답했어요. 묻는 것은 ' + v.N + '보다 큰 배수예요. ' + josa(v.a, '을/를') + ' 한 번 더 더해요.'; } },
      { id: 'next-skipped', wrong: onlyForm(2, function (v, q) { return v.a * (q + 2); }),
        explain: function (v) { var q = fit(v.N, v.a); return '그보다 작은 ' + v.a + ' × ' + (q + 1) + ' = ' + v.a * (q + 1) + '도 ' + v.N + '보다 커요. 가장 작은 것을 찾아야 해요.'; } },
      { id: 'next-added', wrong: onlyForm(2, function (v) { return v.N + v.a; }),
        explain: function (v) { return v.N + '에 ' + josa(v.a, '을/를') + ' 더했어요. ' + josa(v.N, '이/가') + ' ' + v.a + '의 배수가 아니라서 ' + (v.N + v.a) + '도 배수가 아니에요. ' + v.N + ' 바로 아래의 배수부터 찾아요.'; } }
    ]
  });

  /* ── 두 수의 최대공약수 · 최소공배수 (A07.gcd · A07.lcm · A07.word 공통) ── */
  function gcdSteps(a, b) {
    var da = divisors(a).list, db = divisors(b).list, g = MH.gcd(a, b);
    var common = da.filter(function (d) { return b % d === 0; });
    return [
      { say: a + '의 약수: ' + da.join(', ') + '.' },
      { say: b + '의 약수: ' + db.join(', ') + '.' },
      { say: '두 수에 공통으로 있는 약수(공약수): ' + common.join(', ') + '. 이 가운데 가장 큰 수가 최대공약수예요.' },
      { say: '최대공약수는 ' + josa(g, '이에요/예요') + '. 확인: ' + a + ' = ' + g + ' × ' + a / g + ', ' + b + ' = ' + g + ' × ' + b / g + '.', value: g }
    ];
  }
  function lcmSteps(a, b) {
    var l = MH.lcm(a, b), seq = [];
    for (var x = b; x <= l; x += b) seq.push(x + (x % a === 0 ? '(○)' : '(×)'));
    return [
      { say: '최소공배수는 두 수의 공통인 배수(공배수) 가운데 가장 작은 수예요. 큰 수 ' + b + '의 배수 가운데 ' + a + '의 배수이기도 한 첫 수를 찾아요.' },
      { say: b + '의 배수를 차례로 보며 ' + josa(a, '으로/로') + ' 나누어지는지 확인해요: ' + seq.join(', ') + '.' },
      { say: '최소공배수는 ' + josa(l, '이에요/예요') + '. 확인: ' + l + ' = ' + a + ' × ' + l / a + ', ' + l + ' = ' + b + ' × ' + l / b + '.', value: l }
    ];
  }
  function gcdHints(a, b) {
    var p = smallestCommon(a, b);
    return [
      '최대공약수는 두 수를 모두 나누어떨어지게 하는 수(공약수) 가운데 가장 큰 수예요.',
      '작은 수 ' + a + '의 약수를 큰 것부터 떠올리면서, ' + b + '도 나누어떨어지게 하는지 확인해 보세요.',
      /* 가장 작은 공약수가 곧 답이면 수를 말하지 않는다 */
      p < MH.gcd(a, b) ? '두 수 모두 ' + josa(p, '으로/로') + ' 나누어져요. 나눈 몫끼리 또 공통으로 나눌 수 있는지 살펴보세요.'
        : '두 수의 공약수는 1 말고 하나뿐이에요. ' + a + '의 약수 가운데 1이 아닌 것을 하나씩 확인해 보세요.'
    ];
  }
  function lcmHints(a, b) {
    var g = MH.gcd(a, b);
    return [
      '최소공배수는 두 수 모두의 배수(공배수) 가운데 가장 작은 수예요.',
      '큰 수 ' + b + '의 배수를 작은 것부터 차례로 보면서, ' + josa(a, '으로/로') + ' 나누어지는 첫 수를 찾아보세요.',
      g === 1 ? '두 수는 1 말고는 공약수가 없어요. 이럴 때 최소공배수는 두 수의 곱이에요.'
        : '두 수의 최대공약수는 ' + josa(g, '이에요/예요') + '. (두 수의 곱) ÷ (최대공약수)로도 구할 수 있어요.'
    ];
  }
  /* 흔한 실수. kindOf(v, ctx) 가 'gcd' 인지 'lcm' 인지에 따라 달라진다.
     ① 최대공약수와 최소공배수를 바꿔 구함 ② 공약수(공배수)는 맞지만 가장 큰(작은) 것이 아님 ③ 한 수의 약수(배수)일 뿐임 ④ 어느 쪽의 약수(배수)도 아님 */
  function pairMistakes(kindOf) {
    var isGcd = function (v, ctx) { return kindOf(v, ctx) === 'gcd'; };
    var G = function (v) { return MH.gcd(v.a, v.b); }, L = function (v) { return MH.lcm(v.a, v.b); };
    var notBest = function (v, ctx) {
      if (isGcd(v, ctx)) { var d = smallestCommon(v.a, v.b); return d < G(v) ? d : G(v) > 1 ? 1 : null; }
      return G(v) > 1 ? v.a * v.b : 2 * L(v);
    };
    var oneSide = function (v, ctx) { return v.b % v.a === 0 ? null : isGcd(v, ctx) ? v.a : v.b; };
    var given = function (x, raw) { return x === undefined ? raw : x; };
    return [
      { id: 'opposite', wrong: function (v, ctx) { return isGcd(v, ctx) ? L(v) : G(v) > 1 ? G(v) : null; },
        explain: function (v, ctx) {
          return isGcd(v, ctx) ? '최소공배수를 구했어요. 묻는 것은 두 수를 모두 나누어떨어지게 하는 가장 큰 수라서, 작은 수 ' + v.a + '보다 클 수 없어요.'
            : '최대공약수를 구했어요. 묻는 것은 두 수 모두의 배수 가운데 가장 작은 수라서, 큰 수 ' + v.b + '보다 작을 수 없어요.';
        } },
      { id: 'common-not-best', wrong: notBest,
        match: function (v, raw, ctx) {
          var x = INT.parse(raw);
          if (x === null || x < 1) return false;
          return isGcd(v, ctx) ? x < G(v) && v.a % x === 0 && v.b % x === 0 : x > L(v) && x % v.a === 0 && x % v.b === 0;
        },
        explain: function (v, ctx, x) {
          x = given(x, notBest(v, ctx));
          return isGcd(v, ctx) ? josa(x, '은/는') + ' 두 수의 공약수가 맞아요. 하지만 가장 큰 공약수는 아니에요. 더 큰 공약수가 있는지 찾아보세요.'
            : josa(x, '은/는') + ' 두 수의 공배수가 맞아요. 하지만 가장 작은 공배수는 아니에요.' + (x === v.a * v.b ? ' 두 수를 곱하면 항상 공배수가 되지만, 가장 작다고는 할 수 없어요.' : ' 더 작은 공배수가 있는지 찾아보세요.');
        } },
      { id: 'not-common', wrong: oneSide,
        match: function (v, raw, ctx) {
          var x = INT.parse(raw);
          if (x === null || x < 2) return false;
          return isGcd(v, ctx) ? (v.a % x === 0) !== (v.b % x === 0) : (x % v.a === 0) !== (x % v.b === 0);
        },
        explain: function (v, ctx, x) {
          x = given(x, oneSide(v, ctx));
          var gcd = isGcd(v, ctx), hitA = gcd ? v.a % x === 0 : x % v.a === 0, yes = hitA ? v.a : v.b, no = hitA ? v.b : v.a, word = gcd ? '약수' : '배수';
          return josa(x, '은/는') + ' ' + yes + '의 ' + word + '이지만 ' + no + '의 ' + word + '는 아니에요. 두 수 모두의 ' + word + '를 찾아야 해요.';
        } },
      { id: 'unrelated',
        match: function (v, raw, ctx) {
          var x = INT.parse(raw);
          if (x === null || x < 1) return false;
          return isGcd(v, ctx) ? v.a % x !== 0 && v.b % x !== 0 : x % v.a !== 0 && x % v.b !== 0;
        },
        explain: function (v, ctx, x) {
          var word = isGcd(v, ctx) ? '약수' : '배수';
          return josa(x, '은/는') + ' ' + v.a + '의 ' + word + '도, ' + v.b + '의 ' + word + '도 아니에요. ' + (isGcd(v, ctx) ? '최대공약수는 두 수를 모두 나누어떨어지게 해요.' : '최소공배수는 두 수 모두로 나누어져요.');
        } }
    ];
  }
  var coprimePair = function (v) { return v.m < v.n && MH.coprime(v.m, v.n); };
  var A = function (v) { return v.g * v.m; }, B = function (v) { return v.g * v.n; };

  /* ── A07.gcd 최대공약수 ─────────────────────────────── */
  MH.defineType({
    id: 'A07.gcd', unit: 'A07', version: 1, title: '최대공약수',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '작은 두 수', minDistinct: 45, vars: { g: int(2, 6), m: int(1, 6), n: int(2, 7), a: A, b: B }, where: function (v) { return coprimePair(v) && v.b <= 40; } },
      { name: '큰 두 수', minDistinct: 150, vars: { g: int(4, 18), m: int(2, 8), n: int(3, 9), a: A, b: B }, where: function (v) { return coprimePair(v) && v.b <= 120; } }
    ],
    prompt: function (v) { return { text: josa(v.a, '과/와') + ' ' + v.b + '의 최대공약수를 구하세요.' }; },
    solve: function (v) { return MH.gcd(v.a, v.b); },
    verify: function (v, ans) { return gcdSlow(v.a, v.b) === ans; },
    hints: function (v) { return gcdHints(v.a, v.b); },
    steps: function (v) { return gcdSteps(v.a, v.b); },
    mistakes: pairMistakes(function () { return 'gcd'; })
  });

  /* ── A07.lcm 최소공배수 ─────────────────────────────── */
  MH.defineType({
    id: 'A07.lcm', unit: 'A07', version: 1, title: '최소공배수',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '작은 두 수', minDistinct: 30, vars: { a: int(2, 9), b: int(3, 12) }, where: function (v) { return v.a < v.b && MH.lcm(v.a, v.b) <= 72; } },
      { name: '큰 두 수', minDistinct: 60, vars: { g: int(2, 8), m: int(2, 6), n: int(3, 7), a: A, b: B }, where: function (v) { return coprimePair(v) && v.b <= 60 && v.g * v.m * v.n <= 200; } }
    ],
    prompt: function (v) { return { text: josa(v.a, '과/와') + ' ' + v.b + '의 최소공배수를 구하세요.' }; },
    solve: function (v) { return MH.lcm(v.a, v.b); },
    verify: function (v, ans) { return lcmSlow(v.a, v.b) === ans; },
    hints: function (v) { return lcmHints(v.a, v.b); },
    steps: function (v) { return lcmSteps(v.a, v.b); },
    mistakes: pairMistakes(function () { return 'lcm'; })
  });

  /* ── A07.word 문장제 ─────────────────────────────────
     문제에는 a, b 순서로 나온다. kind 가 gcd 이면 최대공약수, lcm 이면 최소공배수가 답이다. */
  var CONTEXTS = [
    { id: 'gcd-share', kind: 'gcd', unit: '명', text: function (a, b) { return '사과 ' + a + '개와 귤 ' + b + '개를 최대한 많은 사람에게 남김없이 똑같이 나눠 주려고 해요. 몇 명에게 나눠 줄 수 있을까요?'; },
      why: '남김없이 똑같이 나누려면 사람 수가 두 수 모두의 약수여야 해요. 최대한 많은 사람이므로 최대공약수를 구해요.' },
    { id: 'gcd-tile', kind: 'gcd', unit: 'cm', text: function (a, b) { return '가로 ' + a + ' cm, 세로 ' + b + ' cm인 직사각형 종이를 남는 부분 없이 크기가 같은 정사각형으로 잘라요. 가장 큰 정사각형의 한 변은 몇 cm일까요?'; },
      why: '남는 부분이 없으려면 정사각형의 한 변이 가로와 세로 모두의 약수여야 해요. 가장 큰 정사각형이므로 최대공약수를 구해요.' },
    { id: 'gcd-bundle', kind: 'gcd', unit: '개', text: function (a, b) { return '빨간 구슬 ' + a + '개와 파란 구슬 ' + b + '개를 남김없이 똑같이 나눠 담아 꾸러미를 만들어요. 꾸러미를 최대한 많이 만들면 몇 개일까요?'; },
      why: '남김없이 똑같이 나눠 담으려면 꾸러미 수가 두 수 모두의 약수여야 해요. 최대한 많이 만들므로 최대공약수를 구해요.' },
    { id: 'lcm-bus', kind: 'lcm', unit: '분', text: function (a, b) { return '두 버스가 각각 ' + a + '분, ' + b + '분마다 출발해요. 지금 동시에 출발했다면, 다음에 처음으로 다시 동시에 출발하는 것은 몇 분 뒤일까요?'; },
      why: '동시에 출발하는 때는 두 수 모두의 배수예요. 처음으로 다시 만나는 때이므로 최소공배수를 구해요.' },
    { id: 'lcm-square', kind: 'lcm', unit: 'cm', text: function (a, b) { return '가로 ' + a + ' cm, 세로 ' + b + ' cm인 직사각형 카드를 같은 방향으로 빈틈없이 늘어놓아 정사각형을 만들어요. 가장 작은 정사각형의 한 변은 몇 cm일까요?'; },
      why: '정사각형의 한 변은 가로의 배수이면서 세로의 배수여야 해요. 가장 작은 정사각형이므로 최소공배수를 구해요.' },
    { id: 'lcm-lights', kind: 'lcm', unit: '초', text: function (a, b) { return '전구 하나는 ' + a + '초마다, 다른 하나는 ' + b + '초마다 깜빡여요. 지금 동시에 깜빡였다면, 몇 초 뒤에 처음으로 다시 동시에 깜빡일까요?'; },
      why: '동시에 깜빡이는 때는 두 수 모두의 배수예요. 처음으로 다시 만나는 때이므로 최소공배수를 구해요.' }
  ];
  MH.defineType({
    id: 'A07.word', unit: 'A07', version: 1, title: '약수와 배수 문장제',
    answer: { kind: 'int', common: false, suffix: function (v, ctx) { return ctx.unit; } },
    contexts: CONTEXTS,
    levels: [
      { name: '작은 두 수', minDistinct: 150, vars: { g: int(2, 6), m: int(2, 5), n: int(3, 7), a: A, b: B }, where: coprimePair },
      { name: '큰 두 수', vars: { g: int(3, 12), m: int(2, 6), n: int(3, 7), a: A, b: B }, where: function (v) { return coprimePair(v) && v.b <= 90 && v.g * v.m * v.n <= 300; } }
    ],
    prompt: function (v, ctx) { return { text: ctx.text(v.a, v.b) }; },
    solve: function (v, ctx) { return ctx.kind === 'gcd' ? MH.gcd(v.a, v.b) : MH.lcm(v.a, v.b); },
    verify: function (v, ans, ctx) { return (ctx.kind === 'gcd' ? gcdSlow(v.a, v.b) : lcmSlow(v.a, v.b)) === ans; },
    hints: function (v, ctx) { return [ctx.why].concat((ctx.kind === 'gcd' ? gcdHints(v.a, v.b) : lcmHints(v.a, v.b)).slice(1)); },
    steps: function (v, ctx) {
      var gcd = ctx.kind === 'gcd', inner = gcd ? gcdSteps(v.a, v.b) : lcmSteps(v.a, v.b), last = inner[inner.length - 1];
      return [{ say: ctx.why }].concat(gcd ? inner.slice(0, -1) : inner.slice(1, -1),
        [{ say: last.say + ' 답은 ' + last.value + josa(ctx.unit, '이에요/예요') + '.', value: last.value }]);
    },
    mistakes: pairMistakes(function (v, ctx) { return ctx.kind; })
  });
})();
