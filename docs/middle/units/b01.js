/* B01 소인수분해 — 소수, 거듭제곱, 소인수분해로 최대공약수·최소공배수 구하기
   유형(쉬운 것부터): B01.prime 소수와 합성수 · B01.power 거듭제곱 · B01.factor 소인수분해
                     · B01.gcd 소인수분해로 최대공약수 · B01.lcm 소인수분해로 최소공배수
   최대공약수 · 최소공배수 유형에서 수는 소수 2, 3, 5, 7 의 지수 목록(예: [3, 1, 0, 0] = 2³ × 3)으로 만든다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, INT = MH.kinds.int, FAC = MH.kinds.factors;
  var PRIMES = [2, 3, 5, 7];

  /** 소인수의 목록(작은 것부터): factorize(84) → [2, 2, 3, 7] */
  function factorize(n) { var out = []; for (var p = 2; p * p <= n; p++) while (n % p === 0) { out.push(p); n /= p; } if (n > 1) out.push(n); return out; }
  function isPrime(n) { return n >= 2 && factorize(n).length === 1; }
  /** 검산용: 1 부터 n 까지 하나씩 나눠 보며 약수를 센다(factorize 와 다른 방법) */
  function countDivisors(n) { var c = 0; for (var d = 1; d <= n; d++) if (n % d === 0) c++; return c; }
  function pow(a, n) { var x = 1; while (n-- > 0) x *= a; return x; }
  function ptex(a, n) { return n === 1 ? String(a) : a + '^{' + n + '}'; }
  /** 소인수분해한 꼴의 수식: ftex(84) → 2^{2} \times 3 \times 7 */
  function ftex(n) { return FAC.tex({ f: factorize(n) }); }
  /** 'a의 n제곱' */
  function powName(a, n) { return a + '의 ' + (n === 2 ? '제곱' : n === 3 ? '세제곱' : n + '제곱'); }
  var numeric = function (a, b) { return a - b; };
  var uniq = function (list) { return list.filter(function (x, i) { return list.indexOf(x) === i; }); };
  var range = function (lo, hi, test) { var out = []; for (var n = lo; n <= hi; n++) if (test(n)) out.push(n); return out; };

  /* ── B01.prime 소수와 합성수 ───────────────────────────
     form 0: 한 수가 소수인지 합성수인지(1 은 둘 다 아님) · form 1: 네 수 가운데 소수 하나 고르기 */
  var CLASS = ['소수', '합성수', '둘 다 아님'];
  var classOf = function (n) { return n === 1 ? CLASS[2] : isPrime(n) ? CLASS[0] : CLASS[1]; };
  /** 소수 n 하나와 합성수 셋을 작은 수부터 늘어놓은 보기 */
  var choices = function (composites) {
    return function (v) { return new MH.Sampler(function (r) { return [v.n].concat(r.shuffle(composites).slice(0, 3)).sort(numeric); }); };
  };
  /** n = p × q (p 는 가장 작은 소인수) */
  var split = function (n) { var p = factorize(n)[0]; return n + ' = ' + p + ' × ' + n / p; };
  /** '20은 2로 나누어떨어져요(20 = 2 × 10).' */
  var divisible = function (n) { return josa(n, '은/는') + ' ' + josa(factorize(n)[0], '으로/로') + ' 나누어떨어져요(' + split(n) + ').'; };
  /** 소수 n 을 작은 소수로 나눠 본 결과: '29 ÷ 2 = 14 … 1, 29 ÷ 3 = 9 … 2, …' */
  var trials = function (n) {
    var out = [];
    for (var p = 2; p * p <= n; p++) if (isPrime(p)) out.push(n + ' ÷ ' + p + ' = ' + (n - n % p) / p + ' … ' + n % p);
    return out;
  };
  MH.defineType({
    id: 'B01.prime', unit: 'B01', version: 1, title: '소수와 합성수',
    answer: { kind: 'choice', options: function (v) { return v.form === 0 ? CLASS : v.opts.map(String); } },
    levels: [
      { name: '소수일까, 합성수일까 (30까지)', minDistinct: 28, vars: { form: 0, n: pick([1].concat(range(1, 30, function () { return true; }))), opts: 0 } },
      { name: '소수 고르기 (50까지)', vars: { form: 1, n: pick(range(11, 50, isPrime)), opts: choices([9, 15, 21, 25, 27, 33, 35, 39, 45, 49]) } },
      { name: '소수 고르기 (100까지)', vars: { form: 1, n: pick(range(51, 100, isPrime)), opts: choices([49, 51, 57, 63, 69, 77, 81, 87, 91, 93, 99]) } }
    ],
    prompt: function (v) {
      return { text: v.form === 0 ? josa(v.n, '은/는') + ' 소수일까요, 합성수일까요?' : v.opts.join(', ') + ' 가운데 소수는 어느 것일까요?' };
    },
    solve: function (v) { return v.form === 0 ? classOf(v.n) : String(v.n); },
    /* 검산: 약수를 하나씩 세어 본다(소수는 약수가 딱 2개) */
    verify: function (v, ans) {
      if (v.form === 0) { var c = countDivisors(v.n); return ans === (c === 1 ? CLASS[2] : c === 2 ? CLASS[0] : CLASS[1]); }
      var primes = v.opts.filter(function (x) { return countDivisors(x) === 2; });
      return v.opts.length === 4 && uniq(v.opts).length === 4 && primes.length === 1 && String(primes[0]) === ans;
    },
    hints: function (v) {
      if (v.form === 0) return [
        '소수는 약수가 1과 자기 자신, 딱 2개뿐인 수예요. 합성수는 약수가 3개 이상인 수예요.',
        v.n <= 3 ? v.n + '의 약수를 모두 써 보세요. 몇 개인가요?'
          : '1과 ' + v.n + ' 자신 말고, ' + josa(v.n, '을/를') + ' 나누어떨어지게 하는 수가 있는지 찾아보세요. 2, 3, 5 같은 작은 소수로 나누어 보면 돼요.'
      ];
      return [
        '소수는 약수가 1과 자기 자신뿐인 수예요. 다른 수로 나누어떨어지면 소수가 아니에요.',
        '각 수를 3, 5, 7로 나누어 보세요.',
        '각 자리 숫자를 더한 값이 3의 배수이면 그 수도 3의 배수예요. 일의 자리가 0이나 5이면 5의 배수예요.'
      ];
    },
    steps: function (v) {
      var n = v.n;
      if (v.form === 1) return v.opts.map(function (x) {
        return { say: isPrime(x) ? josa(x, '은/는') + ' 2, 3, 5, 7 어느 것으로도 나누어떨어지지 않아요.' : divisible(x) + ' 합성수예요.' };
      }).concat([{ say: '1과 자기 자신으로만 나누어떨어지는 수는 ' + n + '뿐이에요. 소수는 ' + josa(n, '이에요/예요') + '.', value: String(n) }]);
      if (n === 1) return [
        { say: '1의 약수는 1 하나뿐이에요.' },
        { say: '소수는 약수가 2개, 합성수는 약수가 3개 이상이어야 해요. 그래서 1은 소수도 합성수도 아니에요.', value: CLASS[2] }
      ];
      if (!isPrime(n)) return [
        { say: divisible(n) },
        { say: '1과 ' + n + ' 말고도 약수가 있으니 ' + josa(n, '은/는') + ' 합성수예요.', value: CLASS[1] }
      ];
      var t = trials(n);
      return [
        { say: t.length ? josa(n, '을/를') + ' 작은 소수로 나누어 봐요: ' + t.join(', ') + '. 나누어떨어지는 것이 없어요.' : n + '보다 작은 수 가운데 ' + josa(n, '을/를') + ' 나누어떨어지게 하는 수는 1뿐이에요.' },
        { say: n + '의 약수는 1과 ' + n + ', 2개뿐이에요. 그래서 ' + josa(n, '은/는') + ' 소수예요.', value: CLASS[0] }
      ];
    },
    mistakes: [
      { id: 'said-prime', wrong: function (v) { return v.form === 0 && !isPrime(v.n) ? CLASS[0] : null; },
        explain: function (v) {
          return v.n === 1 ? '1은 약수가 1 하나뿐이에요. 소수는 약수가 딱 2개여야 해서, 1은 소수가 아니에요.'
            : divisible(v.n) + ' 1과 ' + v.n + ' 말고도 약수가 있으니 소수가 아니에요.';
        } },
      { id: 'said-composite', wrong: function (v) { return v.form === 0 && (v.n === 1 || isPrime(v.n)) ? CLASS[1] : null; },
        explain: function (v) {
          return v.n === 1 ? '1은 약수가 1 하나뿐이에요. 합성수는 약수가 3개 이상이어야 해서, 1은 합성수가 아니에요.'
            : josa(v.n, '은/는') + ' 1과 ' + v.n + ' 말고는 어떤 수로도 나누어떨어지지 않아요. 약수가 2개뿐이면 소수예요.';
        } },
      { id: 'said-neither', wrong: function (v) { return v.form === 0 && v.n > 1 ? CLASS[2] : null; },
        explain: function (v) { return '소수도 합성수도 아닌 자연수는 1뿐이에요. 1보다 큰 수는 약수가 2개이면 소수, 3개 이상이면 합성수예요. ' + v.n + '의 약수를 세어 보세요.'; } },
      { id: 'picked-composite', match: function (v, raw) { var x = INT.parse(raw); return v.form === 1 && x !== null && x !== v.n && v.opts.indexOf(x) >= 0; },
        explain: function (v, ctx, x) { x = Number(x); return divisible(x) + ' 1과 ' + x + ' 말고도 약수가 있으니 합성수예요.'; } }
    ]
  });

  /* ── B01.power 거듭제곱 ────────────────────────────────
     form 0: aⁿ 의 값 · form 1: V = a^□ 의 지수 · form 2: a × a × … × a = a^□ 의 지수 · form 3: aⁿ × bᵐ 의 값 */
  var valueOf = function (v) { return pow(v.a, v.n); };
  var onForm = function (forms, fn) { return function (v) { return forms.indexOf(v.form) >= 0 ? fn(v) : null; }; };
  /** a 를 차례로 곱해 간 값: chain(2, 5) → [2, 4, 8, 16, 32] */
  var chain = function (a, n) { var out = [], x = 1; for (var i = 0; i < n; i++) { x *= a; out.push(x); } return out; };
  var times = function (a, n) { var out = []; for (var i = 0; i < n; i++) out.push(a); return out; };
  MH.defineType({
    id: 'B01.power', unit: 'B01', version: 1, title: '거듭제곱',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '거듭제곱의 값', minDistinct: 20, vars: { form: 0, a: int(2, 12), n: int(2, 7), b: 0, m: 0 },
        where: function (v) { return valueOf(v) <= 150 || (v.a === 10 && v.n <= 5); } },
      { name: '지수 찾기', minDistinct: 60, vars: { form: pick([1, 2]), a: int(2, 10), n: int(2, 10), b: 0, m: 0 },
        where: function (v) { return v.form === 1 ? valueOf(v) <= 1100 : v.n <= 6; } },
      { name: '거듭제곱의 곱', minDistinct: 50, vars: { form: 3, a: pick([2, 3, 5, 7]), n: int(1, 4), b: pick([3, 5, 7, 11]), m: int(1, 3) },
        where: function (v) { return v.a < v.b && v.n + v.m >= 3 && valueOf(v) * pow(v.b, v.m) <= 2000; } }
    ],
    prompt: function (v) {
      if (v.form === 0) return { tex: ptex(v.a, v.n), text: '거듭제곱의 값을 구하세요.' };
      if (v.form === 1) return { tex: valueOf(v) + ' = ' + v.a + '^{\\square}', text: '□ 안에 알맞은 수를 구하세요.' };
      if (v.form === 2) return { tex: times(v.a, v.n).join(' \\times ') + ' = ' + v.a + '^{\\square}', text: '□ 안에 알맞은 수를 구하세요.' };
      return { tex: ptex(v.a, v.n) + ' \\times ' + ptex(v.b, v.m), text: '값을 구하세요.' };
    },
    solve: function (v) { return v.form === 0 ? valueOf(v) : v.form === 3 ? valueOf(v) * pow(v.b, v.m) : v.n; },
    /* 검산: 값을 밑으로 거꾸로 나눠 가며 센다 */
    verify: function (v, ans) {
      var x = v.form === 0 || v.form === 3 ? ans : valueOf(v), count = 0, i;
      if (v.form === 1 || v.form === 2) { while (x > 1 && x % v.a === 0) { x /= v.a; count++; } return x === 1 && count === ans; }
      for (i = 0; i < v.n; i++) { if (x % v.a !== 0) return false; x /= v.a; }
      for (i = 0; i < v.m; i++) { if (x % v.b !== 0) return false; x /= v.b; }
      return x === 1;
    },
    hints: function (v) {
      var a = v.a, n = v.n;
      if (v.form === 0) return [
        josa(powName(a, n), '은/는') + ' ' + josa(a, '을/를') + ' ' + n + '번 곱한 수예요. ' + josa(a + ' × ' + n, '이/가') + ' 아니에요.',
        josa(times(a, n).join(' × '), '을/를') + ' 앞에서부터 차례로 곱해 보세요.'
      ];
      if (v.form === 1) return [
        '□는 ' + josa(a, '을/를') + ' 몇 번 곱했는지를 나타내는 수(지수)예요.',
        josa(a, '을/를') + ' 계속 곱해 보세요: ' + a + ', ' + a + ' × ' + a + ', … 몇 번 곱했을 때 ' + josa(valueOf(v), '이/가') + ' 되는지 세어 보세요.'
      ];
      if (v.form === 2) return [
        '같은 수를 여러 번 곱한 것을 거듭제곱으로 간단히 써요. 곱한 횟수를 오른쪽 위에 작게 쓰고, 이 수를 지수라고 해요.',
        josa(a, '이/가') + ' 모두 몇 번 곱해졌는지 세어 보세요. × 기호의 수가 아니라 ' + a + '의 개수를 세요.'
      ];
      return [
        '거듭제곱을 각각 먼저 계산한 다음, 두 값을 곱해요.',
        josa([[a, n], [v.b, v.m]].map(function (t) { return t[1] === 1 ? josa(t[0], '은/는') + ' 그대로 ' + t[0] : josa(powName(t[0], t[1]), '은/는') + ' ' + times(t[0], t[1]).join(' × '); }).join(', '), '을/를') + ' 뜻해요.'
      ];
    },
    steps: function (v) {
      var a = v.a, n = v.n, V = valueOf(v), c = chain(a, n);
      if (v.form === 0) return [
        { say: josa(powName(a, n), '은/는') + ' ' + josa(a, '을/를') + ' ' + n + '번 곱한 수예요.', tex: ptex(a, n) + ' = ' + times(a, n).join(' \\times ') },
        { say: '앞에서부터 차례로 곱하면 ' + c.join(', ') + '. 답은 ' + josa(V, '이에요/예요') + '.', tex: ptex(a, n) + ' = ' + V, value: V }
      ];
      if (v.form === 1) return [
        { say: josa(a, '을/를') + ' ' + josa(V, '이/가') + ' 될 때까지 곱해요. 한 번씩 곱할 때마다 ' + c.join(', ') + '.' },
        { say: n + '번 곱했을 때 ' + josa(V, '이/가') + ' 됐어요. □는 ' + josa(n, '이에요/예요') + '.', tex: V + ' = ' + ptex(a, n), value: n }
      ];
      if (v.form === 2) return [
        { say: '곱해진 ' + a + '의 개수를 세요. 모두 ' + n + '개예요.' },
        { say: '같은 수를 ' + n + '번 곱한 것은 지수 ' + josa(n, '을/를') + ' 써서 나타내요.', tex: times(a, n).join(' \\times ') + ' = ' + ptex(a, n), value: n }
      ];
      var W = pow(v.b, v.m);
      return [
        { say: '거듭제곱을 각각 먼저 계산해요.', tex: [[a, n, V], [v.b, v.m, W]].filter(function (t) { return t[1] > 1; }).map(function (t) { return ptex(t[0], t[1]) + ' = ' + t[2]; }).join(',\\quad ') },
        { say: '두 값을 곱해요.', tex: V + ' \\times ' + W + ' = ' + V * W, value: V * W }
      ];
    },
    /* 값: ① 밑 × 지수 ② 밑과 지수를 바꿈 ③ 한 번 덜 · 더 곱함
       지수: ④ 하나 적게 · 많게 셈 ⑤ 밑으로 한 번 나눈 몫을 답함
       곱: ⑥ 밑 × 지수끼리 곱함 ⑦ 두 거듭제곱을 더함 */
    mistakes: [
      { id: 'times', wrong: onForm([0], function (v) { return v.a * v.n; }),
        explain: function (v) { return '밑과 지수를 곱했어요(' + v.a + ' × ' + v.n + '). ' + josa(powName(v.a, v.n), '은/는') + ' ' + josa(v.a, '을/를') + ' ' + v.n + '번 곱한 수예요: ' + times(v.a, v.n).join(' × ') + '.'; } },
      { id: 'swapped', wrong: onForm([0], function (v) { return pow(v.n, v.a); }),
        explain: function (v) { return josa(v.n, '을/를') + ' ' + v.a + '번 곱했어요. 아래에 크게 쓴 수 ' + josa(v.a, '을/를') + ', 위에 작게 쓴 수 ' + v.n + '번만큼 곱해야 해요.'; } },
      { id: 'one-less', wrong: onForm([0], function (v) { return pow(v.a, v.n - 1); }),
        explain: function (v) { return josa(v.a, '을/를') + ' ' + (v.n - 1) + '번만 곱했어요. ' + v.n + '번 곱해야 해요. 한 번 더 곱하세요.'; } },
      { id: 'one-more', wrong: onForm([0], function (v) { return pow(v.a, v.n + 1); }),
        explain: function (v) { return josa(v.a, '을/를') + ' ' + (v.n + 1) + '번 곱했어요. ' + v.n + '번만 곱해야 해요.'; } },
      { id: 'counted-less', wrong: onForm([1, 2], function (v) { return v.n - 1; }),
        explain: function (v) {
          return v.form === 2 ? '× 기호의 수를 셌어요. 지수는 곱해진 ' + v.a + '의 개수예요. ' + josa(v.a, '이/가') + ' 모두 몇 개인지 다시 세어 보세요.'
            : josa(v.a, '을/를') + ' ' + (v.n - 1) + '번 곱하면 ' + josa(pow(v.a, v.n - 1), '이에요/예요') + '. 한 번 더 곱해야 ' + josa(valueOf(v), '이/가') + ' 돼요.';
        } },
      { id: 'counted-more', wrong: onForm([1, 2], function (v) { return v.n + 1; }),
        explain: function (v) {
          return v.form === 2 ? '하나 더 셌어요. 곱해진 ' + v.a + '의 개수를 다시 세어 보세요.'
            : josa(v.a, '을/를') + ' ' + (v.n + 1) + '번 곱하면 ' + pow(v.a, v.n + 1) + '이라서 ' + valueOf(v) + '보다 커요.';
        } },
      { id: 'divided', wrong: onForm([1], function (v) { return valueOf(v) / v.a; }),
        explain: function (v) { return valueOf(v) + ' ÷ ' + v.a + ' 의 몫을 답했어요. □는 ' + josa(v.a, '을/를') + ' 곱한 횟수예요. ' + josa(v.a, '을/를') + ' 몇 번 곱해야 ' + josa(valueOf(v), '이/가') + ' 되는지 세어 보세요.'; } },
      { id: 'times-each', wrong: onForm([3], function (v) { return v.a * v.n * v.b * v.m; }),
        explain: function (v) { return '밑과 지수를 곱했어요. 거듭제곱은 밑을 지수만큼 여러 번 곱하는 거예요. ' + (v.n > 1 ? josa(powName(v.a, v.n), '은/는') + ' ' + josa(times(v.a, v.n).join(' × '), '이에요/예요') : josa(powName(v.b, v.m), '은/는') + ' ' + josa(times(v.b, v.m).join(' × '), '이에요/예요')) + '.'; } },
      { id: 'added', wrong: onForm([3], function (v) { return valueOf(v) + pow(v.b, v.m); }),
        explain: function (v) { return '두 거듭제곱의 값을 더했어요. 가운데 기호는 ×예요. ' + valueOf(v) + ' × ' + josa(pow(v.b, v.m), '을/를') + ' 계산하세요.'; } }
    ]
  });

  /* ── B01.factor 소인수분해 ─────────────────────────────
     답은 소수들의 곱으로 쓴다(답 형식 factors): 2×2×3×7 또는 2^2×3×7 */
  /** 작은 소수부터 나눠 내려간 줄: ladder(84) → ['84 ÷ 2 = 42', '42 ÷ 2 = 21', '21 ÷ 3 = 7'] */
  function ladder(n) {
    var rows = [], f = factorize(n);
    for (var i = 0; i < f.length - 1; i++) { rows.push(n + ' ÷ ' + f[i] + ' = ' + n / f[i]); n /= f[i]; }
    return rows;
  }
  /** 지수 목록을 뽑는다: EX([4, 3, 2, 1]) → 2 의 지수 0~4, 3 의 지수 0~3 … (뒤에 더 적은 소수 11, 13 은 extra 로) */
  function EX(max) { return new MH.Sampler(function (r) { return max.map(function (m) { return r.int(0, m); }); }); }
  var BASES = PRIMES.concat([11, 13]);
  var val = function (e) { var x = 1; e.forEach(function (k, i) { x *= pow(BASES[i], k); }); return x; };
  var omega = function (e) { return e.reduce(function (s, k) { return s + k; }, 0); };
  MH.defineType({
    id: 'B01.factor', unit: 'B01', version: 1, title: '소인수분해',
    answer: { kind: 'factors' },
    levels: [
      { name: '작은 수 (60까지)', minDistinct: 38, vars: { e: 0, n: pick(range(4, 60, function (n) { return !isPrime(n); })) } },
      { name: '400까지', minDistinct: 30, vars: { e: EX([5, 4, 2, 2]), n: function (v) { return val(v.e); } },
        where: function (v) { return v.n > 60 && v.n <= 400 && omega(v.e) >= 3; } },
      { name: '큰 수 (11, 13 포함)', minDistinct: 90, vars: { e: EX([4, 3, 2, 1, 1, 1]), n: function (v) { return val(v.e); } },
        where: function (v) { return v.n > 300 && v.n <= 2000 && omega(v.e) >= 3 && v.e[4] + v.e[5] <= 1; } }
    ],
    prompt: function (v) { return { text: josa(v.n, '을/를') + ' 소인수분해하세요.' }; },
    solve: function (v) { return { f: factorize(v.n) }; },
    /* 검산: 쓴 수가 모두 소수이고(약수가 2개), 곱하면 원래 수가 된다 */
    verify: function (v, ans) {
      var x = 1;
      ans.f.forEach(function (p) { x *= p; });
      return x === v.n && ans.f.every(function (p) { return countDivisors(p) === 2; });
    },
    hints: function (v) {
      return [
        '소인수분해는 수를 소수들만의 곱으로 나타내는 거예요.',
        '가장 작은 소수 2부터 나누어떨어지는지 보세요. 나누어떨어지면 그 몫을 같은 방법으로 또 나눠요. 2로 안 되면 3, 5, 7 … 차례로 해 봐요.',
        v.n + ' ÷ ' + factorize(v.n)[0] + ' 부터 시작해 보세요. 몫이 소수가 될 때까지 계속 나눠요.'
      ];
    },
    steps: function (v) {
      var f = factorize(v.n), rows = ladder(v.n), last = f[f.length - 1], repeated = uniq(f).length < f.length;
      return [
        { say: '작은 소수부터 차례로 나눠요: ' + rows.join(', ') + '. 몫 ' + josa(last, '은/는') + ' 소수라서 여기서 멈춰요.' },
        { say: '나눈 소수들과 마지막 몫을 모두 곱하면 처음 수가 돼요.', tex: v.n + ' = ' + f.join(' \\times ') },
        { say: repeated ? '같은 소수를 여러 번 곱한 것은 거듭제곱으로 묶어 써요.' : '같은 소수가 여러 번 나오지 않으니 이대로가 답이에요.', tex: v.n + ' = ' + ftex(v.n), value: { f: f } }
      ];
    },
    /* ① 소수가 아닌 몫에서 멈춤 ② 소인수를 한 번씩만 씀. 그 밖의 오답은 답 형식의 공통 실수가 잡는다(1 을 씀 · 소수가 아닌 수 · 곱이 다름) */
    mistakes: [
      { id: 'stopped-early', wrong: function (v) { var f = factorize(v.n); return f.length >= 3 ? { f: [f[0], v.n / f[0]] } : null; },
        explain: function (v) { var q = v.n / factorize(v.n)[0]; return josa(q, '은/는') + ' 소수가 아니에요. ' + q + '도 더 나눌 수 있어요. 소수만 남을 때까지 계속 나눠요.'; } },
      { id: 'distinct-only', wrong: function (v) { var f = factorize(v.n), u = uniq(f); return u.length < f.length ? { f: u } : null; },
        explain: function (v) {
          var u = uniq(factorize(v.n));
          return '소인수 ' + josa(u.join(', '), '은/는') + ' 맞게 찾았어요. 하지만 곱하면 ' + josa(u.reduce(function (s, p) { return s * p; }, 1), '이라서/라서') + ' ' + josa(v.n, '이/가') + ' 되지 않아요. 같은 소수로 몇 번 나누어지는지 세어 지수로 써요.';
        } }
    ]
  });

  /* ── 소인수분해로 최대공약수 · 최소공배수 (B01.gcd · B01.lcm 공통) ──
     v.E: 수마다의 지수 목록(수가 둘 또는 셋). v.shown 이 참이면 문제에 소인수분해한 꼴로 보여 준다.
     수는 '공통으로 들어갈 부분 × 수마다 따로 곱할 부분'으로 만든다(공통 부분이 넉넉해야 문제가 된다). */
  function family(k, coreMax, extraMax) {
    return new MH.Sampler(function (r) {
      var draw = function (max) { return max.map(function (m) { return r.int(0, m); }); }, core = draw(coreMax), out = [];
      for (var i = 0; i < k; i++) { var x = draw(extraMax); out.push(core.map(function (c, j) { return c + x[j]; })); }
      return out;
    });
  }
  var expsOf = function (v) { return v.E; };
  /** 문제에 나오는 순서의 수들. 소인수분해한 꼴로 줄 때는 뽑은 순서, 수로 줄 때는 작은 수부터 */
  var listOf = function (v) { var e = expsOf(v); return v.shown ? e : e.slice().sort(function (x, y) { return val(x) - val(y); }); };
  var numsOf = function (v) { return listOf(v).map(val); };
  var merge = function (list, fn) { return PRIMES.map(function (p, i) { return fn(list.map(function (e) { return e[i]; })); }); };
  var least = function (ks) { return Math.min.apply(null, ks); }, most = function (ks) { return Math.max.apply(null, ks); };
  var G = function (v) { return val(merge(expsOf(v), least)); }, L = function (v) { return val(merge(expsOf(v), most)); };
  /** 지수 목록의 수식: [3, 1, 0, 0] → 2^{3} \times 3 */
  var etex = function (e) { var t = []; e.forEach(function (k, i) { if (k > 0) t.push(ptex(PRIMES[i], k)); }); return t.join(' \\times '); };
  var commonPrimes = function (v) { var m = merge(expsOf(v), least); return PRIMES.filter(function (p, i) { return m[i] > 0; }); };
  var allPrimes = function (v) { var m = merge(expsOf(v), most); return PRIMES.filter(function (p, i) { return m[i] > 0; }); };
  /** 조건: 수가 서로 다르고, 모두 소수가 아니고(소인수가 둘 이상), 최대공약수가 어느 수와도 같지 않고 소인수를 core 개 이상 가진다
      (최대공약수를 묻는 문제는 core 2: 힌트가 공통인 소인수를 알려 주므로, 그것이 곧 답이 되지 않게 한다) */
  var sound = function (v, core) {
    var e = expsOf(v), n = e.map(val), g = merge(e, least);
    return uniq(n).length === n.length && e.every(function (x) { return omega(x) >= 2; }) && omega(g) >= (core || 2) && n.indexOf(val(g)) < 0;
  };
  var pairPrompt = function (word) {
    return function (v) {
      var n = numsOf(v);
      if (v.shown) return { tex: listOf(v).map(etex).join(',\\quad '), text: '소인수분해한 꼴로 주어진 두 수의 ' + word + '를 구하세요.' };
      return { text: (n.length === 3 ? n.join(', ') : josa(n[0], '과/와') + ' ' + n[1]) + '의 ' + word + '를 구하세요.' };
    };
  };
  /** 풀이의 앞부분: 수로 준 문제는 수마다 소인수분해한 줄을 먼저 보여 준다 */
  var factorSteps = function (v) {
    return v.shown ? [] : listOf(v).map(function (e) { return { say: josa(val(e), '을/를') + ' 소인수분해해요.', tex: val(e) + ' = ' + etex(e) }; });
  };
  var firstHint = function (v) {
    var e = listOf(v)[0];
    return v.shown ? null : '먼저 각 수를 소인수분해해요: $' + val(e) + ' = ' + etex(e) + '$. 다른 수도 같은 방법으로 해 보세요.';
  };
  /** 입력을 직접 보고 판단하는 실수: 공약수(공배수)지만 가장 크지(작지) 않음 · 일부 수의 약수(배수)일 뿐임 */
  var looseMistakes = function (isGcd) {
    var word = isGcd ? '약수' : '배수', hits = function (x, n) { return isGcd ? n % x === 0 : x % n === 0; };
    return [
      { id: 'common-not-best',
        match: function (v, raw) { var x = INT.parse(raw); return x !== null && x >= 1 && numsOf(v).every(function (n) { return hits(x, n); }); },
        explain: function (v, ctx, x) {
          return isGcd ? josa(x, '은/는') + ' 공약수가 맞아요. 하지만 가장 큰 공약수는 아니에요. 공통인 소인수를 빠짐없이, 지수가 작은 쪽만큼 모두 곱했는지 확인해 보세요.'
            : josa(x, '은/는') + ' 공배수가 맞아요. 하지만 가장 작은 공배수는 아니에요. 공통인 소인수를 두 번 곱하지 않았는지 확인해 보세요.';
        } },
      { id: 'not-common',
        match: function (v, raw) { var x = INT.parse(raw); return x !== null && x >= 2 && numsOf(v).some(function (n) { return hits(x, n); }); },
        explain: function (v, ctx, x) {
          var n = numsOf(v), yes = n.filter(function (m) { return hits(x, m); })[0], no = n.filter(function (m) { return !hits(x, m); })[0];
          return josa(x, '은/는') + ' ' + yes + '의 ' + word + '이지만 ' + no + '의 ' + word + '는 아니에요. 모든 수의 ' + word + '를 찾아야 해요.';
        } }
    ];
  };

  /* ── B01.gcd 소인수분해로 최대공약수 ─────────────────── */
  MH.defineType({
    id: 'B01.gcd', unit: 'B01', version: 1, title: '소인수분해로 최대공약수',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '소인수분해한 꼴의 두 수', minDistinct: 200, vars: { shown: true, E: family(2, [2, 1, 1, 1], [2, 1, 1, 1]) }, where: function (v) { return sound(v) && Math.max.apply(null, numsOf(v)) <= 600; } },
      { name: '두 수 (200까지)', minDistinct: 200, vars: { shown: false, E: family(2, [2, 2, 1, 1], [2, 1, 1, 1]) }, where: function (v) { return sound(v) && numsOf(v)[1] <= 200; } },
      { name: '세 수 (150까지)', minDistinct: 240, vars: { shown: false, E: family(3, [2, 1, 1, 1], [2, 1, 1, 0]) }, where: function (v) { return sound(v) && numsOf(v)[2] <= 150; } }
    ],
    prompt: pairPrompt('최대공약수'),
    solve: G,
    /* 검산: 가장 작은 수부터 내려오며, 모든 수를 나누어떨어지게 하는 첫 수를 찾는다 */
    verify: function (v, ans) {
      var n = numsOf(v);
      for (var d = Math.min.apply(null, n); d >= 1; d--) if (n.every(function (x) { return x % d === 0; })) return d === ans;
    },
    hints: function (v) {
      return [firstHint(v),
        '최대공약수는 모든 수에 공통으로 들어 있는 소인수만 곱해서 만들어요. 한쪽에만 있는 소인수는 쓰지 않아요.',
        '공통인 소인수는 ' + josa(commonPrimes(v).join(', '), '이에요/예요') + '. 소인수마다 지수를 비교해서 가장 작은 것을 골라 곱하세요(지수가 안 쓰여 있으면 1이에요).'
      ].filter(Boolean);
    },
    steps: function (v) {
      var g = merge(expsOf(v), least);
      return factorSteps(v).concat([
        { say: '모든 수에 공통으로 들어 있는 소인수는 ' + josa(commonPrimes(v).join(', '), '이에요/예요') + '. 소인수마다 지수가 가장 작은 것을 골라요(지수가 안 쓰여 있으면 1).', tex: etex(g) },
        { say: '곱하면 최대공약수예요.', tex: etex(g) + ' = ' + val(g), value: val(g) }
      ]);
    },
    /* ① 최소공배수를 구함 ② 공통인 소인수에서 지수가 큰 쪽을 고름 ③ 공통인 소인수를 한 번씩만 곱함 */
    mistakes: [
      { id: 'opposite', wrong: L,
        explain: function () { return '최소공배수를 구했어요. 최대공약수는 공통인 소인수만, 지수가 작은 쪽으로 곱해요. 최대공약수는 주어진 어느 수보다도 클 수 없어요.'; } },
      { id: 'larger-exponent', wrong: function (v) { var lo = merge(expsOf(v), least), hi = merge(expsOf(v), most); return val(hi.map(function (k, i) { return lo[i] > 0 ? k : 0; })); },
        explain: function () { return '공통인 소인수는 맞게 골랐어요. 그런데 지수가 큰 쪽을 골랐어요. 최대공약수는 모든 수를 나눌 수 있어야 하니까 지수가 작은 쪽을 골라요.'; } },
      { id: 'once-each', wrong: function (v) { return commonPrimes(v).reduce(function (s, p) { return s * p; }, 1); },
        explain: function (v) { return '공통인 소인수 ' + josa(commonPrimes(v).join(', '), '을/를') + ' 한 번씩만 곱했어요. 같은 소인수가 모든 수에 여러 번 들어 있을 수 있어요. 지수를 비교해서 작은 쪽만큼 곱하세요.'; } }
    ].concat(looseMistakes(true))
  });

  /* ── B01.lcm 소인수분해로 최소공배수 ─────────────────── */
  MH.defineType({
    id: 'B01.lcm', unit: 'B01', version: 1, title: '소인수분해로 최소공배수',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '소인수분해한 꼴의 두 수', minDistinct: 200, vars: { shown: true, E: family(2, [2, 1, 1, 0], [2, 1, 1, 1]) }, where: function (v) { return sound(v) && L(v) <= 1500; } },
      { name: '두 수 (100까지)', minDistinct: 100, vars: { shown: false, E: family(2, [2, 1, 1, 0], [2, 1, 1, 1]) }, where: function (v) { return sound(v, 1) && numsOf(v)[1] <= 100 && L(v) <= 1000; } },
      { name: '세 수 (60까지)', minDistinct: 200, vars: { shown: false, E: family(3, [1, 1, 1, 0], [2, 1, 1, 1]) }, where: function (v) { return sound(v, 1) && numsOf(v)[2] <= 60 && L(v) <= 1000; } }
    ],
    prompt: pairPrompt('최소공배수'),
    solve: L,
    /* 검산: 가장 큰 수의 배수를 차례로 보며, 모든 수로 나누어지는 첫 수를 찾는다 */
    verify: function (v, ans) {
      var n = numsOf(v), big = Math.max.apply(null, n);
      for (var x = big; ; x += big) if (n.every(function (m) { return x % m === 0; })) return x === ans;
    },
    hints: function (v) {
      return [firstHint(v),
        '최소공배수는 어느 한 수에라도 들어 있는 소인수를 모두 곱해서 만들어요. 한쪽에만 있는 소인수도 빠뜨리지 않아요.',
        '나오는 소인수는 ' + josa(allPrimes(v).join(', '), '이에요/예요') + '. 소인수마다 지수를 비교해서 가장 큰 것을 골라 곱하세요.'
      ].filter(Boolean);
    },
    steps: function (v) {
      var l = merge(expsOf(v), most);
      return factorSteps(v).concat([
        { say: '어느 한 수에라도 들어 있는 소인수는 ' + josa(allPrimes(v).join(', '), '이에요/예요') + '. 소인수마다 지수가 가장 큰 것을 골라요.', tex: etex(l) },
        { say: '곱하면 최소공배수예요.', tex: etex(l) + ' = ' + val(l), value: val(l) }
      ]);
    },
    /* ① 최대공약수를 구함 ② 공통인 소인수만 곱함 ③ 소인수를 한 번씩만 곱함 ④ 수를 그냥 모두 곱함 */
    mistakes: [
      { id: 'opposite', wrong: G,
        explain: function () { return '최대공약수를 구했어요. 최소공배수는 나오는 소인수를 모두, 지수가 큰 쪽으로 곱해요. 최소공배수는 주어진 어느 수보다도 작을 수 없어요.'; } },
      { id: 'common-only', wrong: function (v) { var lo = merge(expsOf(v), least), hi = merge(expsOf(v), most); return val(hi.map(function (k, i) { return lo[i] > 0 ? k : 0; })); },
        explain: function () { return '공통인 소인수만 곱했어요. 최소공배수에는 한쪽에만 있는 소인수도 모두 들어가야 해요.'; } },
      { id: 'once-each', wrong: function (v) { return allPrimes(v).reduce(function (s, p) { return s * p; }, 1); },
        explain: function () { return '소인수를 한 번씩만 곱했어요. 소인수마다 지수를 비교해서 가장 큰 쪽만큼 곱해야 모든 수의 배수가 돼요.'; } },
      { id: 'product', wrong: function (v) { return numsOf(v).reduce(function (s, n) { return s * n; }, 1); },
        explain: function () { return '주어진 수를 모두 곱했어요. 공배수는 맞지만 가장 작지는 않아요. 공통인 소인수는 한 번만(지수가 큰 쪽으로) 곱해요.'; } }
    ].concat(looseMistakes(false))
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B01', [
  { title: '소수란? 더 쪼갤 수 없는 수', body: [
    '약수가 1과 자기 자신, 딱 두 개뿐인 수를 소수라고 해요. 다른 두 자연수의 곱으로 쪼갤 수 없는 수예요.',
    { ex: [['7', '약수가 1, 7뿐 → 소수'], ['6', '약수가 1, 2, 3, 6 → 소수가 아님(2 × 3으로 쪼개져요)']] },
    '소수가 아니면서 1보다 큰 수는 합성수라고 해요. 1은 약수가 1 하나뿐이라서 소수도 합성수도 아니에요.',
    '작은 소수부터 쓰면 2, 3, 5, 7, 11, 13, 17, 19 … 예요. 짝수인 소수는 2 하나뿐이에요.',
    '주의: 0.5 같은 수도 "소수"라고 불렀지만, 그것과는 글자만 같고 전혀 다른 말이에요. 이 단원의 소수는 2, 3, 5, 7 같은 자연수예요.'
  ] },
  { title: '거듭제곱 — 같은 수를 여러 번 곱하기', body: [
    '같은 수를 여러 번 곱할 때는 짧게 줄여 써요.',
    { tex: '2 \\times 2 \\times 2 = 2^{3}' },
    '아래에 크게 쓴 2를 밑(곱하는 수), 위에 작게 쓴 3을 지수(곱한 횟수)라고 해요. "2의 세제곱"이라고 읽어요.',
    '$2^{3}$은 2 × 3이 아니에요. 2를 세 번 곱한 2 × 2 × 2 = 8이에요.',
    { ex: [['3^{2}', '3 × 3 = 9'], ['2^{4}', '2 × 2 × 2 × 2 = 16'], ['5^{1}', '5를 한 번 → 5']] }
  ] },
  { title: '소인수분해 — 수를 소수의 곱으로', body: [
    '어떤 수를 소수들만의 곱으로 나타내는 것을 소인수분해라고 해요. 레고를 가장 작은 조각까지 분해하는 것과 같아요.',
    { tex: '12 = 2 \\times 2 \\times 3 = 2^{2} \\times 3' },
    { list: ['① 가장 작은 소수 2로 나누어 봐요: 12 ÷ 2 = 6.', '② 몫 6을 또 나눠요: 6 ÷ 2 = 3.', '③ 몫 3은 소수라서 더 나눌 수 없어요. 끝.', '④ 나눈 수들과 마지막 몫을 곱으로 써요: 2 × 2 × 3.'] },
    '2로 안 나누어지면 3, 그다음 5, 7 … 차례로 해 봐요. 어떤 순서로 나누어도 결과는 같아요.'
  ] },
  { title: '소인수분해로 최대공약수 · 최소공배수 구하기', body: [
    '두 수를 소인수분해해 놓으면 최대공약수와 최소공배수를 한눈에 구할 수 있어요.',
    { tex: '12 = 2^{2} \\times 3, \\quad 18 = 2 \\times 3^{2}' },
    { ex: [['최대공약수', '두 수에 모두 들어 있는 소인수만, 지수는 작은 쪽 → $2 \\times 3 = 6$'], ['최소공배수', '한 번이라도 나온 소인수를 모두, 지수는 큰 쪽 → $2^{2} \\times 3^{2} = 36$']] },
    '최대공약수는 "둘이 함께 가진 것만", 최소공배수는 "둘을 모두 담을 만큼"이라고 기억하면 쉬워요.'
  ] }
]);
