/* A15 분수 ↔ 소수 — 분수를 소수로(유한소수가 되는 것만), 소수를 기약분수로
   유형(쉬운 것부터): A15.to-ten 분모를 10 · 100 · 1000으로 · A15.to-decimal 분수를 소수로 · A15.to-fraction 소수를 기약분수로
                     · A15.compare 분수와 소수의 크기 비교
   분모는 10, 100, 1000의 약수만 쓴다(2, 4, 5, 8, 20, 25, 40, 50, 125 …) → 항상 유한소수가 된다.
   소수는 { n, p }(n ÷ 10^p)로 다루고 계산은 정수와 분수(MH.F)로만 한다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F, D = MH.dec, P10 = MH.pow10, gcd = MH.gcd;

  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  /** 대분수 꼴 수식(w 가 0 이면 분수만) */
  var T = function (w, n, d) { return (w ? w : '') + frac(n, d); };
  var read = function (n, d) { return d + '분의 ' + n; };
  var readJ = function (n, d, pair) { return d + '분의 ' + josa(n, pair); };
  var S = function (n, p) { return MH.decStr(n, p, true); };
  var show = function (d) { return S(d.n, d.p); };
  var when = function (test, make) { return function (v) { return test(v) ? make(v) : null; }; };
  var all = function () { var tests = [].slice.call(arguments); return function (v) { return tests.every(function (t) { return t(v); }); }; };
  var len = function (n) { return String(n).length; };
  var count = function (k) { return ['한', '두', '세', '네'][k - 1]; };
  var lowest = function (v) { return gcd(v.a, v.b) === 1; };
  /** 분모 b 를 10^k 으로 만들 수 있는 가장 작은 k (b 는 10, 100, 1000 의 약수) */
  var placesOf = function (b) { for (var k = 1; k <= 4; k++) if (P10(k) % b === 0) return k; return 0; };
  var target = function (v) { return P10(placesOf(v.b)); };
  var mult = function (v) { return target(v) / v.b; };
  var sameValue = function (ans, f) { return F(ans.n, P10(ans.p)).equals(f); };

  /* ── A15.to-ten 분모를 10 · 100 · 1000으로 ─────────────
     a/b = □/T (T 는 10, 100, 1000). 답은 a × (T ÷ b). */
  var numer = function (hi) { return function (v) { return int(1, Math.max(v.b - 1, hi)); }; };
  MH.defineType({
    id: 'A15.to-ten', unit: 'A15', version: 1, title: '분모를 10, 100, 1000으로',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '2나 5를 곱하면 될 때', minDistinct: 40, vars: { b: pick([2, 5, 20, 50]), a: numer(19) }, where: all(lowest, function (v) { return v.b <= 5 || v.a < v.b; }) },
      { name: '분모가 4, 25일 때', minDistinct: 22, vars: { b: pick([4, 25]), a: numer(19) }, where: lowest },
      { name: '분모를 1000으로', minDistinct: 150, vars: { b: pick([8, 40, 125, 200, 250, 500]), a: numer(19) }, where: lowest }
    ],
    prompt: function (v) { return { tex: frac(v.a, v.b) + ' = ' + frac('\\square', target(v)), text: '□에 알맞은 수를 쓰세요.' }; },
    solve: function (v) { return v.a * mult(v); },
    /* 검산: □에 답을 넣은 분수가 원래 분수와 같은 값인가 */
    verify: function (v, ans) { return F(ans, target(v)).equals(F(v.a, v.b)); },
    hints: function (v) {
      return [
        '분모와 분자에 같은 수를 곱해도 분수의 크기는 변하지 않아요.',
        '분모 ' + v.b + '에 어떤 수를 곱하면 ' + josa(target(v), '이/가') + ' 되는지 찾아요.',
        target(v) + ' ÷ ' + josa(v.b, '을/를') + ' 계산하면 곱할 수가 나와요. 분자에도 같은 수를 곱해요.'
      ];
    },
    steps: function (v) {
      var m = mult(v), t = target(v);
      return [
        { say: '분모 ' + v.b + '에 ' + josa(m, '을/를') + ' 곱하면 ' + josa(t, '이/가') + ' 돼요.', tex: v.b + ' \\times ' + m + ' = ' + t },
        { say: '분자에도 똑같이 ' + josa(m, '을/를') + ' 곱해요: ' + v.a + ' × ' + m + ' = ' + v.a * m + '.', tex: frac(v.a, v.b) + ' = ' + frac(v.a + ' \\times ' + m, v.b + ' \\times ' + m) + ' = ' + frac(v.a * m, t), value: v.a * m }
      ];
    },
    /* ① 분자를 그대로 둠 ② 곱한 수만 답함 ③ 분모가 커진 만큼 분자에 더함 */
    mistakes: [
      { id: 'numerator-unchanged', wrong: function (v) { return v.a; },
        explain: function (v) { return '분자를 그대로 뒀어요. 분모에 ' + josa(mult(v), '을/를') + ' 곱했으니 분자에도 똑같이 ' + josa(mult(v), '을/를') + ' 곱해야 크기가 같아요.'; } },
      { id: 'multiplier-only', wrong: function (v) { return mult(v); },
        explain: function (v) { return josa(mult(v), '은/는') + ' 분모에 곱한 수예요. □에는 분자 ' + v.a + '에 ' + josa(mult(v), '을/를') + ' 곱한 수를 써요.'; } },
      { id: 'difference-added', wrong: function (v) { return v.a + target(v) - v.b; },
        explain: function (v) { return '분모가 ' + (target(v) - v.b) + '만큼 커졌다고 분자에도 그만큼 더했어요. 더하는 것이 아니라 같은 수를 곱해야 크기가 같아요: ' + v.a + ' × ' + mult(v) + '.'; } }
    ]
  });

  /* ── A15.to-decimal 분수를 소수로 ─────────────────────
     w 와 a/b 를 소수로. imp 가 1 이면 가분수 (w × b + a)/b 로 보여 준다. */
  var topOf = function (v) { return v.w * v.b + v.a; };
  var fracShown = function (v) { return v.imp ? frac(topOf(v), v.b) : T(v.w, v.a, v.b); };
  var decOf = function (v) { var k = placesOf(v.b); return D(v.w * P10(k) + v.a * mult(v), k); };
  /** 자연수 부분 w 뒤에 숫자 f 를 소수점 아래로 붙인 수(w.f) */
  var glue = function (w, f) { return D(w * P10(len(f)) + f, len(f)); };
  MH.defineType({
    id: 'A15.to-decimal', unit: 'A15', version: 1, title: '분수를 소수로',
    answer: { kind: 'decimal' },
    levels: [
      { name: '분모가 2, 5인 분수', minDistinct: 35, vars: { imp: 0, b: pick([2, 5]), w: pick([0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), a: function (v) { return int(1, v.b - 1); } }, where: lowest },
      { name: '분모가 4, 20, 25, 50인 분수', minDistinct: 150, vars: { imp: 0, b: pick([4, 4, 20, 25, 50]), w: pick([0, 0, 1, 2, 3]), a: function (v) { return int(1, v.b - 1); } }, where: lowest },
      { name: '분모가 8, 40, 125인 분수 · 가분수', minDistinct: 150, vars: { b: pick([8, 8, 40, 125, 200, 2, 4, 5]), imp: function (v) { return v.b <= 5 ? 1 : v.b === 8 ? pick([0, 1]) : 0; }, w: function (v) { return v.imp ? int(1, 4) : pick([0, 0, 1, 2]); }, a: function (v) { return int(1, v.b - 1); } }, where: lowest }
    ],
    prompt: function (v) { return { tex: fracShown(v), text: '분수를 소수로 쓰세요.' }; },
    solve: decOf,
    /* 검산: 정확한 분수 계산으로 w + a/b 와 같은가 */
    verify: function (v, ans) { return sameValue(ans, F(v.w).add(F(v.a, v.b))); },
    hints: function (v) {
      return [
        '분모를 10, 100, 1000 가운데 하나로 바꾸면 소수로 쓸 수 있어요.',
        '분모 ' + v.b + '에 ' + josa(mult(v), '을/를') + ' 곱하면 ' + josa(target(v), '이/가') + ' 돼요. 분자에도 똑같이 곱해요.',
        v.imp ? '가분수는 먼저 대분수로 바꾸면 쉬워요: ' + topOf(v) + ' ÷ ' + v.b + '.' : v.w ? '자연수 부분 ' + josa(v.w, '은/는') + ' 소수점 앞에 그대로 써요. 분수 부분만 바꾸면 돼요.' : read(1, target(v)) + '은 ' + josa(S(1, placesOf(v.b)), '이에요/예요') + '. 분자가 그 개수예요.'
      ];
    },
    steps: function (v) {
      var m = mult(v), t = target(v), k = placesOf(v.b), am = v.a * m, out = [];
      if (v.imp) out.push({ say: '가분수를 대분수로 바꿔요. ' + topOf(v) + ' ÷ ' + v.b + ' = ' + v.w + ' … ' + josa(v.a, '이에요/예요') + '.', tex: frac(topOf(v), v.b) + ' = ' + T(v.w, v.a, v.b) });
      out.push({ say: '분모 ' + josa(v.b, '을/를') + ' ' + josa(t, '으로/로') + ' 만들어요. 분모와 분자에 똑같이 ' + josa(m, '을/를') + ' 곱해요.', tex: frac(v.a, v.b) + ' = ' + frac(v.a + ' \\times ' + m, v.b + ' \\times ' + m) + ' = ' + frac(am, t) });
      out.push({ say: readJ(am, t, '은/는') + ' ' + S(1, k) + '이 ' + am + '개인 수예요.' + (len(am) < k ? ' 소수점 아래가 ' + count(k) + ' 자리가 되도록 빈 자리에 0을 써요.' : ''), tex: frac(am, t) + ' = ' + S(am, k) });
      out.push({ say: (v.w ? '자연수 부분 ' + josa(v.w, '을/를') + ' 소수점 앞에 쓰면 ' + josa(show(decOf(v)), '이에요/예요') + '. ' : '') + (v.imp ? '처음부터 분자 ÷ 분모(' + topOf(v) + ' ÷ ' + v.b + ')를 계산해도 같은 답이 나와요.' : v.w ? '분수 부분은 분자 ÷ 분모(' + v.a + ' ÷ ' + v.b + ')로 계산해도 같아요.' : '분자 ÷ 분모(' + v.a + ' ÷ ' + v.b + ')를 계산해도 같은 답이 나와요.'), tex: fracShown(v) + ' = ' + show(decOf(v)), value: decOf(v) });
      return out;
    },
    /* ① 분자와 분모를 소수점으로 이어 씀 ② 분자를 그대로 소수점 아래에 씀 ③ 분모를 소수점 아래에 씀 ④ 분모만 바꾸고 분자는 그대로 둠 ⑤ 자연수 부분을 빠뜨림 */
    mistakes: [
      { id: 'digits-joined', wrong: when(function (v) { return v.imp || !v.w; }, function (v) { return glue(v.imp ? topOf(v) : v.a, v.b); }),
        explain: function (v) { var n = v.imp ? topOf(v) : v.a; return '분자 ' + josa(n, '과/와') + ' 분모 ' + josa(v.b, '을/를') + ' 소수점으로 이어 썼어요. ' + readJ(n, v.b, '은/는') + ' ' + n + ' ÷ ' + josa(v.b, '이라는/라는') + ' 뜻이에요. 분모를 ' + josa(target(v), '으로/로') + ' 바꿔서 소수로 써요.'; } },
      { id: 'numerator-after-point', wrong: function (v) { return glue(v.w, v.a); },
        explain: function (v) { return v.imp ? topOf(v) + ' ÷ ' + v.b + '의 몫 ' + josa(v.w, '과/와') + ' 나머지 ' + josa(v.a, '을/를') + ' 소수점으로 이어 썼어요. 나머지 ' + josa(v.a, '은/는') + ' ' + readJ(v.a, v.b, '이라는/라는') + ' 뜻이에요. 분모 ' + josa(v.b, '을/를') + ' ' + josa(target(v), '으로/로') + ' 바꾸면 ' + v.a + ' × ' + mult(v) + ' = ' + v.a * mult(v) + '.'
          : '분자 ' + josa(v.a, '을/를') + ' 그대로 소수점 아래에 썼어요. 그렇게 쓸 수 있는 것은 분모가 10, 100, 1000일 때뿐이에요. 먼저 분모 ' + josa(v.b, '을/를') + ' ' + josa(target(v), '으로/로') + ' 바꿔요: ' + v.a + ' × ' + mult(v) + ' = ' + v.a * mult(v) + '.'; } },
      { id: 'denominator-after-point', wrong: when(function (v) { return v.a === 1 && !v.imp; }, function (v) { return glue(v.w, v.b); }),
        explain: function (v) { return '분모 ' + josa(v.b, '을/를') + ' 소수점 아래에 썼어요. ' + readJ(1, v.b, '은/는') + ' 1을 ' + josa(v.b, '으로/로') + ' 나눈 수예요: 1 ÷ ' + v.b + ' = ' + show(D(mult(v), placesOf(v.b))) + '.'; } },
      { id: 'numerator-not-scaled', wrong: function (v) { var k = placesOf(v.b); return v.imp ? D(topOf(v), k) : D(v.w * P10(k) + v.a, k); },
        explain: function (v) { var n = v.imp ? topOf(v) : v.a; return '분모만 ' + josa(target(v), '으로/로') + ' 바꾸고 분자는 그대로 뒀어요. 분모에 ' + josa(mult(v), '을/를') + ' 곱했으니 분자에도 곱해요: ' + n + ' × ' + mult(v) + ' = ' + n * mult(v) + '.'; } },
      { id: 'whole-dropped', wrong: when(function (v) { return v.w > 0 && !v.imp; }, function (v) { return D(v.a * mult(v), placesOf(v.b)); }),
        explain: function (v) { return '자연수 부분 ' + josa(v.w, '을/를') + ' 빠뜨렸어요. 분수 부분은 ' + josa(show(D(v.a * mult(v), placesOf(v.b))), '이고/고') + ', 자연수 ' + josa(v.w, '은/는') + ' 소수점 앞에 써요.'; } }
    ]
  });

  /* ── A15.to-fraction 소수를 기약분수로 ────────────────
     소수 n ÷ 10^p (자연수 부분 w, 소수점 아래 숫자 f). 답은 기약분수여야 한다(reduce: 'require'). */
  var wOf = function (v) { return Math.floor(v.n / P10(v.p)); };
  var fOf = function (v) { return v.n % P10(v.p); };
  var gOf = function (v) { return gcd(fOf(v), P10(v.p)); };
  var V = function (n, d) { return n > 0 && d > 0 ? { n: n, d: d } : null; };
  var clean = function (v) { return v.n % 10 !== 0; };
  /** 두 수를 함께 나눌 수 있는 가장 작은 수(2 또는 5) */
  var smallFactor = function (v) { return fOf(v) % 2 === 0 ? 2 : 5; };
  MH.defineType({
    id: 'A15.to-fraction', unit: 'A15', version: 1, title: '소수를 기약분수로',
    answer: { kind: 'fraction', whole: true, reduce: 'require', show: 'mixed' },
    levels: [
      { name: '소수 한 자리 수', minDistinct: 70, vars: { p: 1, n: int(1, 99) }, where: clean },
      { name: '소수 두 자리 수', minDistinct: 220, vars: { p: 2, big: pick([0, 0, 1]), n: function (v) { return v.big ? int(101, 399) : int(1, 99); } }, where: all(clean, function (v) { return fOf(v) > 0; }) },
      { name: '소수 세 자리 수', minDistinct: 200, vars: { p: 3, big: pick([0, 0, 1]), n: function (v) { return v.big ? int(1001, 2999) : int(1, 999); } }, where: all(clean, function (v) { return fOf(v) > 0 && gOf(v) >= 4; }) }
    ],
    prompt: function (v) { return { tex: S(v.n, v.p), text: '소수를 기약분수로 쓰세요.' }; },
    solve: function (v) { var g = gcd(v.n, P10(v.p)); return { n: v.n / g, d: P10(v.p) / g }; },
    /* 검산: 정확한 분수 계산으로 값이 같고, 기약분수인가 */
    verify: function (v, ans) { return gcd(ans.n, ans.d) === 1 && F(ans.n, ans.d).equals(F(v.n, P10(v.p))); },
    hints: function (v) {
      var t = P10(v.p);
      return [
        '소수 한 자리 수는 분모가 10, 두 자리 수는 100, 세 자리 수는 1000인 분수로 쓸 수 있어요.',
        '소수점 아래 숫자 ' + josa(fOf(v), '을/를') + ' 분자로, ' + josa(t, '을/를') + ' 분모로 써요.' + (wOf(v) ? ' 자연수 부분 ' + josa(wOf(v), '은/는') + ' 그대로 둬요.' : ''),
        gOf(v) > 1 ? '약분해요. ' + josa(fOf(v), '과/와') + ' ' + josa(t, '은/는') + ' 모두 ' + josa(smallFactor(v), '으로/로') + ' 나누어져요.' : josa(fOf(v), '과/와') + ' ' + josa(t, '을/를') + ' 함께 나눌 수 있는 수가 1뿐이에요. 이미 기약분수예요.'
      ];
    },
    steps: function (v) {
      var t = P10(v.p), w = wOf(v), f = fOf(v), g = gOf(v), out = [];
      out.push({ say: josa(S(v.n, v.p), '은/는') + ' 소수 ' + count(v.p) + ' 자리 수예요. ' + (w ? '자연수 부분 ' + josa(w, '은/는') + ' 그대로 두고, 소수점 아래는 ' + S(1, v.p) + '이 ' + f + '개니까 ' + readJ(f, t, '이에요/예요') + '.' : S(1, v.p) + '이 ' + f + '개니까 분모가 ' + t + '인 분수로 써요.'), tex: S(v.n, v.p) + ' = ' + T(w, f, t) });
      if (g > 1) out.push({ say: '약분해요. ' + josa(f, '과/와') + ' ' + t + '의 최대공약수 ' + josa(g, '으로/로') + ' 분자와 분모를 나눠요: ' + f + ' ÷ ' + g + ' = ' + f / g + ', ' + t + ' ÷ ' + g + ' = ' + t / g + '.', tex: T(w, f, t) + ' = ' + T(w, f / g, t / g) });
      else out.push({ say: josa(f, '과/와') + ' ' + josa(t, '을/를') + ' 함께 나눌 수 있는 수는 1뿐이에요. 이미 기약분수예요.', tex: S(v.n, v.p) + ' = ' + T(w, f, t) });
      out[out.length - 1].value = { n: v.n / gcd(v.n, t), d: t / gcd(v.n, t) };
      return out;
    },
    /* ① 분모의 0 을 하나 덜 씀 ② 분모의 0 을 하나 더 씀 ③ 소수점 아래 두 숫자를 분자 · 분모로 씀 ④ 자연수 부분을 빠뜨림 ⑤ 소수점을 분수의 가로선처럼 봄 */
    mistakes: [
      { id: 'denominator-short', wrong: when(function (v) { return v.p >= 2; }, function (v) { var t = P10(v.p - 1); return V(wOf(v) * t + fOf(v), t); }),
        explain: function (v) { return '분모를 ' + josa(P10(v.p - 1), '으로/로') + ' 썼어요. ' + josa(S(v.n, v.p), '은/는') + ' 소수 ' + count(v.p) + ' 자리 수라서 분모가 ' + josa(P10(v.p), '이에요/예요') + '. 소수점 아래 자릿수만큼 0이 붙어요.'; } },
      { id: 'denominator-long', wrong: function (v) { var t = P10(v.p + 1); return V(wOf(v) * t + fOf(v), t); },
        explain: function (v) { return '분모를 ' + josa(P10(v.p + 1), '으로/로') + ' 썼어요. ' + josa(S(v.n, v.p), '은/는') + ' 소수 ' + count(v.p) + ' 자리 수라서 분모가 ' + josa(P10(v.p), '이에요/예요') + '.'; } },
      { id: 'digits-split', wrong: when(function (v) { return v.p === 2 && !wOf(v) && fOf(v) >= 10; }, function (v) { return V(Math.floor(fOf(v) / 10), fOf(v) % 10); }),
        explain: function (v) { return '소수점 아래 두 숫자를 분자와 분모로 나눠 썼어요. ' + josa(S(v.n, v.p), '은/는') + ' 0.01이 ' + fOf(v) + '개인 수예요. 분자는 ' + fOf(v) + ', 분모는 100으로 시작해요.'; } },
      { id: 'whole-dropped', wrong: when(function (v) { return wOf(v) > 0; }, function (v) { return V(fOf(v), P10(v.p)); }),
        explain: function (v) { return '자연수 부분 ' + josa(wOf(v), '을/를') + ' 빠뜨렸어요. 소수점 앞의 ' + josa(wOf(v), '은/는') + ' 대분수의 자연수 부분으로 그대로 써요.'; } },
      { id: 'point-as-bar', wrong: when(function (v) { return wOf(v) > 0; }, function (v) { return V(wOf(v), fOf(v)); }),
        explain: function (v) { return '소수점 앞의 수를 분자로, 뒤의 수를 분모로 썼어요. 소수점은 분수의 가로선이 아니에요. ' + josa(S(v.n, v.p), '은/는') + ' ' + josa(wOf(v), '과/와') + ' ' + S(1, v.p) + ' ' + fOf(v) + '개를 합한 수예요.'; } }
    ]
  });

  /* ── A15.compare 분수와 소수의 크기 비교 ───────────────
     분수 (w 와 a/b) 와 소수. 소수는 분수의 값에서 off 만큼(10^k 눈금) 어긋난 수. side 가 1 이면 소수를 왼쪽에 쓴다. */
  var SIGN = function (x, y) { return x > y ? '>' : x < y ? '<' : '='; };
  var fracScaled = function (v) { return v.w * target(v) + v.a * mult(v); };            /* 분수의 값 × 10^k */
  var decShown = function (v) { return D(fracScaled(v) + v.off, placesOf(v.b)); };
  var cmpSign = function (v) { var s = SIGN(0, v.off); return v.side ? SIGN(v.off, 0) : s; };
  var cmpTex = function (v, sign) { var f = T(v.w, v.a, v.b), d = show(decShown(v)); return (v.side ? d : f) + ' \\;' + sign + '\\; ' + (v.side ? f : d); };
  /** 분자를 그대로 소수점 아래에 쓴 수와 소수를 비교한 결과(흔한 실수) */
  var naiveSign = function (v) {
    var x = glue(v.w, v.a), y = decShown(v), P = Math.max(x.p, y.p), s = SIGN(x.n * P10(P - x.p), y.n * P10(P - y.p));
    return v.side ? SIGN(0, s === '>' ? 1 : s === '<' ? -1 : 0) : s;
  };
  var positive = function (v) { return fracScaled(v) + v.off > 0; };
  MH.defineType({
    id: 'A15.compare', unit: 'A15', version: 1, title: '분수와 소수의 크기 비교',
    answer: { kind: 'choice', options: ['>', '=', '<'] },
    levels: [
      { name: '분모가 2, 5인 분수', minDistinct: 60, vars: { b: pick([2, 5]), w: pick([0, 0, 1, 2]), a: function (v) { return int(1, v.b - 1); }, off: pick([-3, -2, -1, 0, 1, 2, 3]), side: pick([0, 1]) }, where: all(lowest, positive) },
      { name: '분모가 4, 20, 25, 50인 분수', vars: { b: pick([4, 4, 20, 25, 50]), w: pick([0, 0, 0, 1]), a: function (v) { return int(1, v.b - 1); }, off: pick([-20, -10, -5, -3, -1, 0, 0, 1, 3, 5, 10, 20]), side: pick([0, 1]) }, where: all(lowest, positive) },
      { name: '분모가 8, 40, 125인 분수', vars: { b: pick([8, 8, 40, 125]), w: pick([0, 0, 1, 2]), a: function (v) { return int(1, v.b - 1); }, off: pick([-125, -75, -25, -5, -1, 0, 0, 1, 5, 25, 75, 125]), side: pick([0, 1]) }, where: all(lowest, positive) }
    ],
    prompt: function (v) { return { tex: cmpTex(v, '\\bigcirc'), text: '○ 안에 알맞은 기호를 고르세요.' }; },
    solve: cmpSign,
    /* 검산: 정확한 분수 계산으로 비교 */
    verify: function (v, ans) {
      var d = decShown(v), c = F(v.w).add(F(v.a, v.b)).compare(F(d.n, P10(d.p)));
      if (v.side) c = -c;
      return ans === (c > 0 ? '>' : c < 0 ? '<' : '=');
    },
    hints: function (v) {
      return [
        '분수와 소수는 모양이 달라서 그대로는 비교하기 어려워요. 분수를 소수로 바꿔요.',
        '분모 ' + v.b + '에 ' + josa(mult(v), '을/를') + ' 곱하면 ' + josa(target(v), '이/가') + ' 돼요. 분자에도 똑같이 곱해요.',
        '소수끼리는 높은 자리부터 차례로 비교해요. 자릿수가 다르면 끝에 0을 붙여 맞춰요.'
      ];
    },
    steps: function (v) {
      var k = placesOf(v.b), fs = fracScaled(v), d = decShown(v), ds = fs + v.off, sign = cmpSign(v), bigger = fs > ds;
      var out = [{ say: '분수를 소수로 바꿔요. 분모와 분자에 ' + josa(mult(v), '을/를') + ' 곱하면 ' + readJ(v.a * mult(v), target(v), '이에요/예요') + '.' + (v.w ? ' 자연수 ' + josa(v.w, '은/는') + ' 소수점 앞에 써요.' : ''),
        tex: T(v.w, v.a, v.b) + ' = ' + T(v.w, v.a * mult(v), target(v)) + ' = ' + S(fs, k) }];
      out.push({ say: fs === ds ? '바꾼 소수 ' + josa(S(fs, k), '이/가') + ' 주어진 소수와 똑같아요.'
        : '소수끼리 비교해요. ' + (d.p < k ? josa(show(d), '은/는') + ' ' + S(ds, k) + '과 같아요. ' : '') + josa(S(fs, k), '이/가') + ' ' + S(ds, k) + '보다 ' + (bigger ? '커요.' : '작아요.'),
        tex: S(fs, k) + ' ' + SIGN(fs, ds) + ' ' + S(ds, k) });
      out.push({ say: fs === ds ? '분수와 소수의 크기가 같아요.' : '분수가 소수보다 ' + (bigger ? '커요.' : '작아요.'), tex: cmpTex(v, sign), value: sign });
      return out;
    },
    /* ① 분자를 그대로 소수점 아래에 놓고 비교 ② 같다고 생각 ③ 부등호 방향이 반대 ④ 같은 수인데 다르다고 생각 */
    mistakes: [
      { id: 'numerator-after-point', wrong: naiveSign,
        explain: function (v) { var x = glue(v.w, v.a); return '분수 ' + (v.w ? read(v.a, v.b) + '의 분자를 소수점 아래에 놓아 ' : readJ(v.a, v.b, '을/를') + ' ') + josa(show(x), '으로/로') + ' 생각했어요. 분모가 ' + josa(v.b, '이에요/예요') + '. 분모를 ' + josa(target(v), '으로/로') + ' 바꾸면 ' + josa(S(fracScaled(v), placesOf(v.b)), '이에요/예요') + '.'; } },
      { id: 'said-equal', wrong: when(function (v) { return v.off !== 0; }, function () { return '='; }),
        explain: function (v) { return '두 수는 같지 않아요. 분수를 소수로 바꾸면 ' + josa(S(fracScaled(v), placesOf(v.b)), '이에요/예요') + '. ' + josa(show(decShown(v)), '과/와') + ' 높은 자리부터 비교해 보세요.'; } },
      { id: 'reversed', wrong: when(function (v) { return v.off !== 0; }, function (v) { return cmpSign(v) === '>' ? '<' : '>'; }),
        explain: function (v) { return '부등호의 방향이 반대예요. 부등호는 큰 수 쪽으로 벌어져요. 분수를 소수로 바꾸면 ' + josa(S(fracScaled(v), placesOf(v.b)), '이고/고') + ', 이 수가 ' + show(decShown(v)) + '보다 ' + (v.off < 0 ? '커요.' : '작아요.'); } },
      { id: 'missed-equal', match: function (v, raw) { return v.off === 0 && (raw === '>' || raw === '<'); },
        explain: function (v) { return '두 수는 크기가 같아요. 분수를 소수로 바꾸면 ' + josa(S(fracScaled(v), placesOf(v.b)), '이에요/예요') + '. 주어진 소수와 똑같은 수예요.'; } }
    ]
  });
})();
