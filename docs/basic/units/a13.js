/* A13 소수의 뜻과 덧셈·뺄셈 — 자릿값, 소수의 크기 비교, 자리 맞춰 더하고 빼기
   유형(쉬운 것부터): A13.read 분수를 소수로 · A13.place 자릿값 · A13.compare 크기 비교 · A13.add 소수의 덧셈 · A13.sub 소수의 뺄셈
   소수는 { n, p }(n ÷ 10^p)로 다루고, 계산은 자릿수를 맞춘 정수로만 한다(부동소수점을 쓰지 않는다).
   답은 소수 키패드로 쓴다(decimal). 값이 같으면 정답이고(0.50 = 0.5), 크기 비교는 보기(>, =, <)를 고른다(choice). */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F, D = MH.dec, P10 = MH.pow10;

  /** 소수를 글자로. 끝의 0 도 적힌 자릿수 그대로 보여 준다: S(350, 2) → 3.50 */
  var S = function (n, p) { return MH.decStr(n, p, true); };
  var SJ = function (n, p, pair) { return josa(S(n, p), pair); };
  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  var when = function (test, make) { return function (v) { return test(v) ? make(v) : null; }; };
  var all = function () { var tests = [].slice.call(arguments); return function (v) { return tests.every(function (t) { return t(v); }); }; };
  var len = function (n) { return String(n).length; };
  /** 자릿수를 글로: 1 → 한 자리 */
  var howMany = function (k) { return ['한', '두', '세', '네'][k - 1] + ' 자리'; };
  /** 자릿수를 맞춘 정수 N 의 오른쪽에서 i 번째 숫자 */
  var digit = function (N, i) { return Math.floor(N / P10(i)) % 10; };
  /** 소수점 아래가 P 자리일 때, 오른쪽에서 i 번째 자리의 이름 */
  var placeName = function (i, P) { return i < P ? MH.decPlace(P - i) : MH.place(i - P) + '의 자리'; };
  /** 분수로 바꾼 정확한 값(검산용) */
  var exact = function (n, p) { return F(n, P10(p)); };
  var sameValue = function (ans, f) { return F(ans.n, P10(ans.p)).equals(f); };

  /* ── A13.read 분수를 소수로 ───────────────────────────
     값은 w + a / 10^k. form 0: 분수(w 가 있으면 대분수, a 가 분모보다 크면 가분수) · form 1: '0.1이 a개인 수' */
  var den = function (v) { return P10(v.k); };
  var readValue = function (v) { return v.w * den(v) + v.a; };
  var notTen = function (v) { return v.a % 10 !== 0; };
  MH.defineType({
    id: 'A13.read', unit: 'A13', version: 1, title: '분수를 소수로',
    answer: { kind: 'decimal' },
    levels: [
      { name: '분모가 10인 분수', minDistinct: 70, vars: { form: 0, k: 1, w: pick([0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), a: int(1, 9) } },
      { name: '0.1이 몇 개 · 가분수', minDistinct: 120, vars: { form: pick([0, 1]), k: 1, w: 0, a: int(11, 99) }, where: notTen },
      { name: '분모가 100, 1000인 분수', vars: { form: pick([0, 0, 1]), k: pick([2, 2, 3]), w: function (v) { return v.form ? 0 : int(0, 3); }, a: function (v) { return int(1, v.form && v.k === 2 ? 999 : den(v) - 1); } }, where: notTen }
    ],
    prompt: function (v) {
      if (v.form) return { text: S(1, v.k) + '이 ' + v.a + '개인 수를 소수로 쓰세요.' };
      return { tex: (v.w ? v.w : '') + frac(v.a, den(v)), text: '분수를 소수로 쓰세요.' };
    },
    solve: function (v) { return D(readValue(v), v.k); },
    /* 검산: 정확한 분수 계산으로 w + a / 10^k 와 같은가 */
    verify: function (v, ans) { return sameValue(ans, F(v.w).add(F(v.a, den(v)))); },
    hints: function (v) {
      var d = den(v), unit = S(1, v.k);
      return [
        d + '분의 1을 소수로 쓰면 ' + josa(unit, '이에요/예요') + '. 소수점 아래 ' + howMany(v.k) + ' 수예요.',
        v.w ? '자연수 ' + josa(v.w, '은/는') + ' 소수점 앞에, 분수 부분은 소수점 뒤에 써요.'
          : v.a >= d ? unit + '이 ' + d + '개 모이면 1이에요. ' + v.a + '개 가운데 ' + d + '개씩 묶어 자연수 부분을 만들어요.'
            : len(v.a) < v.k ? '소수점 아래가 ' + howMany(v.k) + '가 되어야 해요. 숫자가 모자란 앞자리에는 0을 써요.' : josa(unit, '이/가') + ' ' + v.a + '개인 수예요.',
        v.a + '의 끝 숫자 ' + josa(v.a % 10, '이/가') + ' ' + MH.decPlace(v.k) + '에 오도록 써요.'
      ];
    },
    steps: function (v) {
      var d = den(v), unit = S(1, v.k), n = readValue(v), out = [];
      out.push({ say: d + '분의 1을 소수로 쓰면 ' + josa(unit, '이에요/예요') + '.' + (v.form ? '' : ' ' + d + '분의 ' + josa(v.a, '은/는') + ' ' + unit + '이 ' + v.a + '개인 수예요.'), tex: frac(1, d) + ' = ' + unit });
      if (v.a >= d) { var q = Math.floor(v.a / d), r = v.a % d; out.push({ say: unit + '이 ' + d + '개 모이면 1이에요. ' + v.a + '개는 ' + d + '개씩 ' + q + '묶음과 ' + r + '개니까, 1이 ' + q + '개와 ' + unit + '이 ' + r + '개예요.', tex: v.a + ' = ' + d + ' \\times ' + q + ' + ' + r }); }
      else if (len(v.a) < v.k) out.push({ say: '소수점 아래가 ' + howMany(v.k) + '여야 하는데 ' + josa(v.a, '은/는') + ' ' + howMany(len(v.a)) + ' 수예요. 모자란 앞자리에 0을 써요.', tex: frac(v.a, d) + ' = ' + S(v.a, v.k) });
      out.push({ say: (v.w ? '자연수 ' + josa(v.w, '은/는') + ' 소수점 앞에 써요. ' : '') + '끝 숫자 ' + josa(v.a % 10, '이/가') + ' ' + MH.decPlace(v.k) + '에 오도록 쓰면 ' + SJ(n, v.k, '이에요/예요') + '.',
        tex: (v.form ? '' : (v.w ? v.w : '') + frac(v.a, d) + ' = ') + S(n, v.k), value: D(n, v.k) });
      return out;
    },
    /* ① 소수점을 찍지 않음 ② 빈 자리에 0 을 쓰지 않음 ③ 개수를 그대로 소수점 아래에 씀 ④ 한 자리 더 밀어 씀 ⑤ 자연수 부분을 빠뜨림 */
    mistakes: [
      { id: 'no-point', wrong: function (v) { return D(readValue(v), 0); },
        explain: function (v) { return '소수점을 찍지 않았어요. ' + (v.form ? S(1, v.k) + '이 ' + v.a + '개인 수니까' : '분모가 ' + den(v) + '이니까') + ' 소수점 아래가 ' + howMany(v.k) + '가 되도록 소수점을 찍어요: ' + S(readValue(v), v.k) + '.'; } },
      { id: 'zero-missing', wrong: when(function (v) { return len(v.a) < v.k; }, function (v) { return D(v.w * P10(len(v.a)) + v.a, len(v.a)); }),
        explain: function (v) { return '빈 자리의 0을 빠뜨렸어요. 분모가 ' + den(v) + '이면 소수점 아래가 ' + howMany(v.k) + '예요. 끝 숫자가 ' + MH.decPlace(v.k) + '에 오도록 앞자리에 0을 써요: ' + S(readValue(v), v.k) + '.'; } },
      { id: 'count-after-point', wrong: when(function (v) { return !v.w && v.a >= den(v); }, function (v) { return D(v.a, len(v.a)); }),
        explain: function (v) { var d = den(v); return josa(v.a, '을/를') + ' 그대로 소수점 뒤에 썼어요. ' + S(1, v.k) + '이 ' + d + '개 모이면 1이 돼요. ' + v.a + '개는 1이 ' + Math.floor(v.a / d) + '개와 ' + S(1, v.k) + '이 ' + v.a % d + '개예요.'; } },
      { id: 'one-place-more', wrong: function (v) { return D(readValue(v), v.k + 1); },
        explain: function (v) { return '소수점 아래 자리를 하나 더 밀어 썼어요. 분모가 ' + den(v) + '이면 소수점 아래는 ' + howMany(v.k) + '예요.'; } },
      { id: 'whole-dropped', wrong: when(function (v) { return v.w > 0; }, function (v) { return D(v.a, v.k); }),
        explain: function (v) { return '자연수 부분 ' + josa(v.w, '을/를') + ' 빠뜨렸어요. 자연수는 소수점 앞에 그대로 써요.'; } }
    ]
  });

  /* ── A13.place 자릿값 ────────────────────────────────
     숫자 ds = [십, 일, 소수 첫째, 둘째, 셋째 자리]. form 0: '1이 3개, 0.1이 7개인 수'(모으기) · form 1: '숫자 2가 나타내는 수' (at 번째 자리) */
  var UNIT = [[1, -1], [1, 0], [1, 1], [1, 2], [1, 3]];                    /* 자리의 단위: 10, 1, 0.1, 0.01, 0.001 */
  var unitStr = function (i) { return i === 0 ? '10' : S(1, i - 1); };
  var ds = function (v) { return [v.t, v.o, v.d1, v.d2, v.d3]; };
  var placeTotal = function (v) { var x = ds(v); return ((((x[0] * 10 + x[1]) * 10 + x[2]) * 10 + x[3]) * 10) + x[4]; };   /* 소수 셋째 자리까지 맞춘 정수 */
  var lastPlace = function (v) { var x = ds(v); for (var i = 4; i > 1; i--) if (x[i]) return i - 1; return 0; };          /* 소수점 아래 자릿수 */
  var used = function (v) { var x = ds(v), out = []; x.forEach(function (d, i) { if (d) out.push(i); }); return out; };
  /** 가장 높은 자리와 가장 낮은 자리 사이에 0 인 자리가 있는가 */
  var hasGap = function (v) { var u = used(v); return u[u.length - 1] - u[0] + 1 > u.length; };
  var distinct = function (v) { var u = used(v).map(function (i) { return ds(v)[i]; }); return u.every(function (d, i) { return u.indexOf(d) === i; }); };
  var partValue = function (v, i) { return D(ds(v)[i] * P10(4 - i), 3); };       /* i 번째 자리 숫자가 나타내는 수 */
  var partStr = function (v, i) { var x = partValue(v, i); return S(x.n, x.p); };
  var whole = function (v) { var p = lastPlace(v); return S(placeTotal(v) / P10(3 - p), p); };
  var dig = function (lo, hi) { return int(lo, hi); };
  MH.defineType({
    id: 'A13.place', unit: 'A13', version: 1, title: '소수의 자릿값',
    answer: { kind: 'decimal' },
    levels: [
      { name: '자리의 수를 모아 소수 만들기', minDistinct: 250, vars: { form: 0, t: 0, o: dig(1, 9), d1: dig(1, 9), d2: pick([0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), d3: 0, at: 0 } },
      { name: '숫자가 나타내는 수', vars: { form: 1, t: 0, o: dig(1, 9), d1: dig(1, 9), d2: dig(1, 9), d3: pick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), at: function (v) { return int(1, v.d3 ? 4 : 3); } }, where: distinct },
      { name: '0이 들어가는 소수', vars: { form: 0, t: pick([0, 0, 0, 1, 2, 3]), o: dig(0, 9), d1: dig(0, 9), d2: dig(0, 9), d3: pick([0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), at: 0 },
        where: function (v) { var u = used(v); return u.length >= 2 && u[u.length - 1] >= 3 && hasGap(v); } }
    ],
    prompt: function (v) {
      if (v.form) return { tex: whole(v), text: '이 수에서 숫자 ' + josa(ds(v)[v.at], '이/가') + ' 나타내는 수를 쓰세요.' };
      return { text: used(v).map(function (i) { return unitStr(i) + '이 ' + ds(v)[i] + '개'; }).join(', ') + '인 수를 쓰세요.' };
    },
    solve: function (v) { return v.form ? partValue(v, v.at) : D(placeTotal(v), 3); },
    /* 검산: 자리마다 (숫자 × 단위)를 정확한 분수로 더한 값과 같은가 */
    verify: function (v, ans) {
      var sum = F(0), x = ds(v);
      (v.form ? [v.at] : [0, 1, 2, 3, 4]).forEach(function (i) { sum = sum.add(F(x[i]).mul(i === 0 ? F(10) : F(1, P10(i - 1)))); });
      return sameValue(ans, sum);
    },
    hints: function (v) {
      var x = ds(v);
      if (v.form) return [
        '소수점 바로 뒤가 소수 첫째 자리(0.1의 자리), 그다음이 소수 둘째 자리(0.01의 자리)예요.',
        '숫자 ' + josa(x[v.at], '이/가') + ' 어느 자리에 있는지 찾아요. 소수점에서부터 세요.',
        v.at === 1 ? '일의 자리 숫자는 1이 몇 개인지를 나타내요.' : '그 자리의 단위(' + unitStr(v.at) + ')가 ' + x[v.at] + '개인 수를 써요.'
      ];
      return [
        '1의 개수는 일의 자리에, 0.1의 개수는 소수 첫째 자리에, 0.01의 개수는 소수 둘째 자리에 써요.',
        hasGap(v) ? '말하지 않은 자리는 비어 있는 자리예요. 그 자리에는 0을 써요.' : '큰 자리부터 차례로 숫자를 써요. 일의 자리 뒤에 소수점을 찍어요.',
        '가장 작은 단위는 ' + josa(unitStr(used(v).pop()), '이에요/예요') + '. 그 숫자가 ' + (lastPlace(v) ? MH.decPlace(lastPlace(v)) : '일의 자리') + '에 와요.'
      ];
    },
    steps: function (v) {
      var x = ds(v), u = used(v), p = lastPlace(v);
      if (v.form) {
        var name = v.at === 1 ? '일의 자리' : MH.decPlace(v.at - 1);
        return [
          { say: whole(v) + '에서 숫자 ' + josa(x[v.at], '은/는') + ' ' + name + '에 있어요.' },
          { say: name + '는 ' + unitStr(v.at) + '의 자리예요. ' + unitStr(v.at) + '이 ' + x[v.at] + '개니까 ' + josa(partStr(v, v.at), '을/를') + ' 나타내요.', tex: unitStr(v.at) + ' \\times ' + x[v.at] + ' = ' + partStr(v, v.at), value: partValue(v, v.at) }
        ];
      }
      var out = [{ say: '자리마다 나타내는 수를 써요: ' + u.map(function (i) { return unitStr(i) + '이 ' + x[i] + '개 → ' + partStr(v, i); }).join(', ') + '.' }];
      if (hasGap(v)) {
        var empty = [];
        for (var i = u[0] + 1; i < u[u.length - 1]; i++) if (!x[i]) empty.push(i === 1 ? '일의 자리' : MH.decPlace(i - 1));
        out.push({ say: empty.join(', ') + '는 말하지 않았으니 비어 있어요. 빈 자리에는 0을 써요.' });
      }
      out.push({ say: '모두 더하면 ' + josa(whole(v), '이에요/예요') + '.', tex: u.map(function (i) { return partStr(v, i); }).join(' + ') + ' = ' + whole(v), value: D(placeTotal(v), 3) });
      return out;
    },
    /* ① 빈 자리의 0 을 쓰지 않고 붙여 씀 ② 소수점을 찍지 않음 · 한 자리 옮겨 찍음 ③ 숫자만 답함 ④ 한 자리 옆의 값을 답함 ⑤ 수 전체를 답함 */
    mistakes: [
      { id: 'packed', wrong: when(function (v) { return !v.form && hasGap(v); }, function (v) {
        var x = ds(v), u = used(v), hi = u.filter(function (i) { return i <= 1; }), lo = u.filter(function (i) { return i > 1; });
        var W = 0; if (hi.length) W = hi.length === 2 || hi[0] === 1 ? x[0] * 10 + x[1] : x[0];      /* 자연수 부분: 십의 자리만 있으면 한 자리 수처럼 붙여 씀 */
        var f = 0; lo.forEach(function (i) { f = f * 10 + x[i]; });
        return D(W * P10(lo.length) + f, lo.length);
      }),
        explain: function (v) { return '빈 자리에 0을 쓰지 않고 숫자를 붙여 썼어요. 말하지 않은 자리에는 0을 써서 자리를 지켜요: ' + whole(v) + '.'; } },
      { id: 'no-point', wrong: when(function (v) { return !v.form; }, function (v) { return D(placeTotal(v) / P10(3 - lastPlace(v)), 0); }),
        explain: function (v) { return '소수점을 찍지 않았어요. 일의 자리 숫자 뒤에 소수점을 찍어요: ' + whole(v) + '.'; } },
      { id: 'point-right', wrong: when(function (v) { return !v.form && lastPlace(v) >= 1; }, function (v) { var p = lastPlace(v); return D(placeTotal(v) / P10(3 - p), p - 1); }),
        explain: function (v) { return '소수점을 한 자리 뒤에 찍었어요. 소수점은 일의 자리 숫자 ' + ds(v)[1] + ' 바로 뒤에 찍어요: ' + whole(v) + '.'; } },
      { id: 'point-left', wrong: when(function (v) { return !v.form; }, function (v) { var p = lastPlace(v); return D(placeTotal(v) / P10(3 - p), p + 1); }),
        explain: function (v) { return '소수점을 한 자리 앞에 찍었어요. 소수점은 일의 자리 숫자 ' + ds(v)[1] + ' 바로 뒤에 찍어요: ' + whole(v) + '.'; } },
      { id: 'digit-only', wrong: when(function (v) { return v.form && v.at > 1; }, function (v) { return D(ds(v)[v.at], 0); }),
        explain: function (v) { return '숫자 ' + josa(ds(v)[v.at], '을/를') + ' 그대로 썼어요. 이 숫자는 ' + MH.decPlace(v.at - 1) + '에 있어서 ' + unitStr(v.at) + '이 ' + ds(v)[v.at] + '개, 곧 ' + josa(partStr(v, v.at), '을/를') + ' 나타내요.'; } },
      { id: 'place-off', wrong: when(function (v) { return v.form && v.at > 1; }, function (v) { return D(ds(v)[v.at], v.at - 2); }),
        explain: function (v) { return '한 자리 왼쪽의 값을 썼어요. 소수점 바로 뒤가 소수 첫째 자리예요. 숫자 ' + josa(ds(v)[v.at], '은/는') + ' ' + MH.decPlace(v.at - 1) + '에 있으니 ' + josa(partStr(v, v.at), '이에요/예요') + '.'; } },
      { id: 'place-off-right', wrong: when(function (v) { return v.form && v.at < 4; }, function (v) { return D(ds(v)[v.at], v.at); }),
        explain: function (v) { return '한 자리 오른쪽의 값을 썼어요. 숫자 ' + josa(ds(v)[v.at], '은/는') + ' ' + (v.at === 1 ? '일의 자리' : MH.decPlace(v.at - 1)) + '에 있으니 ' + josa(partStr(v, v.at), '이에요/예요') + '.'; } },
      { id: 'whole-number', wrong: when(function (v) { return v.form; }, function (v) { return D(placeTotal(v), 3); }),
        explain: function (v) { return '수 전체를 썼어요. 묻는 것은 숫자 ' + ds(v)[v.at] + ' 하나가 나타내는 수예요: ' + partStr(v, v.at) + '.'; } }
    ]
  });

  /* ── A13.compare 소수의 크기 비교 ─────────────────────
     짧은 소수 (i 와 a, 소수점 아래 ps 자리) 와 긴 소수 (j 와 b, pl 자리). side 가 1 이면 긴 소수를 왼쪽에 쓴다. */
  var SIGN = function (x, y) { return x > y ? '>' : x < y ? '<' : '='; };
  var pair = function (v) {
    var s = { n: v.i * P10(v.ps) + v.a, p: v.ps, w: v.i, f: v.a }, l = { n: v.j * P10(v.pl) + v.b, p: v.pl, w: v.j, f: v.b };
    return v.side ? [l, s] : [s, l];
  };
  /** 소수점 아래 자릿수를 맞춘 두 정수 */
  var scaled = function (v) { var x = pair(v), P = Math.max(x[0].p, x[1].p); return { P: P, A: x[0].n * P10(P - x[0].p), B: x[1].n * P10(P - x[1].p) }; };
  var compareSign = function (v) { var s = scaled(v); return SIGN(s.A, s.B); };
  var naive = function (v) { var x = pair(v); return SIGN(x[0].f, x[1].f); };      /* 소수점 아래를 자연수처럼 비교한 결과 */
  var show = function (o) { return S(o.n, o.p); };
  var fracVar = function (name) { return function (v) { var p = v[name]; return int(1, P10(p) - 1); }; };
  var compareVars = function (shape, equalRate) {
    return { shape: shape, ps: function (v) { return v.shape[0]; }, pl: function (v) { return v.shape[1]; }, eq: equalRate, side: pick([0, 1]), i: int(0, 9), j: function (v) { return v.i; },
      a: fracVar('ps'), b: function (v) { return v.eq ? v.a * P10(v.pl - v.ps) : int(1, P10(v.pl) - 1); } };
  };
  var cleanEnds = function (v) { return v.a % 10 !== 0 && (v.eq || v.b % 10 !== 0); };
  MH.defineType({
    id: 'A13.compare', unit: 'A13', version: 1, title: '소수의 크기 비교',
    answer: { kind: 'choice', options: ['>', '=', '<'] },
    levels: [
      { name: '자릿수가 같은 소수', vars: { shape: pick([[1, 1], [2, 2]]), ps: function (v) { return v.shape[0]; }, pl: function (v) { return v.shape[1]; }, eq: 0, side: 0, i: int(0, 9), j: function (v) { return pick([v.i, v.i, v.i, int(0, 9)]); }, a: fracVar('ps'), b: fracVar('pl') },
        where: function (v) { return v.a % 10 !== 0 && v.b % 10 !== 0 && compareSign(v) !== '='; } },
      { name: '자릿수가 다른 소수', minDistinct: 250, vars: compareVars([1, 2], pick([0, 0, 0, 0, 1])), where: cleanEnds },
      { name: '소수 셋째 자리까지', vars: compareVars(pick([[1, 3], [2, 3], [1, 2]]), pick([0, 0, 0, 0, 0, 1])),
        where: all(cleanEnds, function (v) { return v.eq || Math.floor(v.a / P10(v.ps - 1)) === Math.floor(v.b / P10(v.pl - 1)); }) }
    ],
    prompt: function (v) { var x = pair(v); return { tex: show(x[0]) + ' \\;\\bigcirc\\; ' + show(x[1]), text: '○ 안에 알맞은 기호를 고르세요.' }; },
    solve: compareSign,
    /* 검산: 자릿수를 맞추지 않고 정확한 분수로 비교 */
    verify: function (v, ans) { var x = pair(v), c = exact(x[0].n, x[0].p).compare(exact(x[1].n, x[1].p)); return ans === (c > 0 ? '>' : c < 0 ? '<' : '='); },
    hints: function (v) {
      var x = pair(v);
      return [
        '소수는 높은 자리부터 차례로 비교해요. 먼저 자연수 부분을 봐요.',
        '자연수 부분이 같으면 소수 첫째 자리, 그래도 같으면 소수 둘째 자리를 비교해요.',
        x[0].p !== x[1].p ? '자릿수가 다르면 끝에 0을 붙여 자릿수를 맞춰도 돼요. 끝에 0을 붙여도 크기는 같아요(0.5 = 0.50).' : '처음으로 숫자가 다른 자리에서 큰 쪽이 더 큰 수예요.'
      ];
    },
    steps: function (v) {
      var x = pair(v), s = scaled(v), sign = compareSign(v), out = [];
      var L = S(s.A, s.P), R = S(s.B, s.P);
      if (x[0].p !== x[1].p) {
        var short = x[0].p < x[1].p ? x[0] : x[1];
        out.push({ say: '자릿수를 맞춰요. 끝에 0을 붙여도 크기는 같으니까 ' + SJ(short.n, short.p, '은/는') + ' ' + S(short.n * P10(s.P - short.p), s.P) + '과 같아요.', tex: show(short) + ' = ' + S(short.n * P10(s.P - short.p), s.P) });
      }
      if (x[0].w !== x[1].w) out.push({ say: '자연수 부분부터 비교해요. ' + josa(x[0].w, '과/와') + ' ' + x[1].w + ' 가운데 ' + Math.max(x[0].w, x[1].w) + '쪽이 더 커요. 소수점 아래는 볼 필요가 없어요.' });
      else if (sign === '=') out.push({ say: '자연수 부분도, 소수점 아래 모든 자리의 숫자도 같아요.' });
      else {
        var same = ['자연수 부분은 ' + josa(x[0].w, '으로/로') + ' 같아요.'];
        for (var i = s.P - 1; i >= 0; i--) {
          var a = digit(s.A, i), b = digit(s.B, i), name = MH.decPlace(s.P - i);
          if (a === b) { same.push(name + '도 ' + josa(a, '으로/로') + ' 같아요.'); continue; }
          out.push({ say: same.join(' ') + ' ' + name + '의 숫자는 ' + josa(a, '과/와') + ' ' + josa(b, '이에요/예요') + '. ' + josa(a, '이/가') + ' ' + b + '보다 ' + (a > b ? '커요.' : '작아요.') });
          break;
        }
      }
      out.push({ say: sign === '=' ? SJ(x[0].n, x[0].p, '과/와') + ' ' + SJ(x[1].n, x[1].p, '은/는') + ' 크기가 같아요.' : SJ(x[0].n, x[0].p, '이/가') + ' ' + show(x[1]) + '보다 ' + (sign === '>' ? '커요.' : '작아요.'),
        tex: (L !== show(x[0]) || R !== show(x[1]) ? L + ' ' + sign + ' ' + R + ' \\;\\Rightarrow\\; ' : '') + show(x[0]) + ' ' + sign + ' ' + show(x[1]), value: sign });
      return out;
    },
    /* ① 소수점 아래를 자연수처럼 비교(자릿수가 많으면 크다고 생각) ② 끝의 0 때문에 다른 수라고 생각 ③ 같다고 생각 ④ 부등호 방향이 반대 */
    mistakes: [
      { id: 'as-whole-numbers', wrong: when(function (v) { var x = pair(v); return x[0].w === x[1].w && x[0].p !== x[1].p; }, naive),
        explain: function (v) {
          var x = pair(v), s = scaled(v);
          return '소수점 아래의 수 ' + josa(S(x[0].f, 0), '과/와') + ' ' + josa(S(x[1].f, 0), '을/를') + ' 자연수처럼 비교했어요. 소수는 자릿수가 많다고 큰 수가 아니에요. 자릿수를 맞추면 ' + SJ(s.A, s.P, '과/와') + ' ' + SJ(s.B, s.P, '이에요/예요') + '.';
        } },
      { id: 'zero-changes-size', wrong: when(function (v) { return compareSign(v) === '='; }, function (v) { return naive(v) === '>' ? '<' : '>'; }),
        explain: function (v) { var x = pair(v); return '끝에 0이 붙어도 크기는 변하지 않아요. ' + SJ(x[0].n, x[0].p, '과/와') + ' ' + SJ(x[1].n, x[1].p, '은/는') + ' 같은 수예요.'; } },
      { id: 'said-equal', wrong: when(function (v) { return compareSign(v) !== '='; }, function () { return '='; }),
        explain: function (v) { var s = scaled(v); return '두 수는 같지 않아요. 자릿수를 맞춰 ' + SJ(s.A, s.P, '과/와') + ' ' + josa(S(s.B, s.P), '을/를') + ' 높은 자리부터 비교해 보세요.'; } },
      { id: 'reversed', wrong: when(function (v) { return compareSign(v) !== '='; }, function (v) { return compareSign(v) === '>' ? '<' : '>'; }),
        explain: function (v) { var x = pair(v), sign = compareSign(v); return '부등호의 방향이 반대예요. 부등호는 큰 수 쪽으로 벌어져요. ' + SJ(x[0].n, x[0].p, '이/가') + ' ' + show(x[1]) + '보다 ' + (sign === '>' ? '크니까 >' : '작으니까 <') + '예요.'; } }
    ]
  });

  /* ── 소수의 덧셈 · 뺄셈에 함께 쓰는 것 ──────────────────
     x (소수점 아래 px 자리) 와 y (py 자리). 자릿수를 맞춘 정수 X, Y 로 계산한다. */
  var calc = function (v) { var P = Math.max(v.px, v.py); return { P: P, X: v.x * P10(P - v.px), Y: v.y * P10(P - v.py) }; };
  var places = function (c) { return Math.max(len(c.X), len(c.Y), c.P + 1); };
  /** 자리마다 따로 계산한 결과를 모은다: f(윗수의 숫자, 아랫수의 숫자) */
  var perDigit = function (c, f) { var n = 0; for (var i = places(c) - 1; i >= 0; i--) n = n * 10 + f(digit(c.X, i), digit(c.Y, i)); return n; };
  var noCarrySum = function (c) { return perDigit(c, function (a, b) { return (a + b) % 10; }); };
  var hasCarry = function (v) { var c = calc(v); return noCarrySum(c) !== c.X + c.Y; };
  var absDiff = function (c) { return perDigit(c, function (a, b) { return Math.abs(a - b); }); };
  var hasBorrow = function (v) { var c = calc(v); return absDiff(c) !== c.X - c.Y; };
  var column = function (a, op, b, res) { return '\\begin{array}{r} ' + a + ' \\\\ ' + op + '\\enspace ' + b + ' \\\\ \\hline ' + (res === undefined ? '\\phantom{0}' : res) + ' \\end{array}'; };
  var cleanOperands = function (v) { return (v.px === 0 || v.x % 10 !== 0) && (v.py === 0 || v.y % 10 !== 0); };
  var MAX = [9, 99, 999, 999];                                             /* 소수점 아래 자릿수별 가장 큰 수(자릿수를 뗀 정수) */
  var operand = function (name) { return function (v) { return int(1, MAX[v[name]]); }; };
  var sameVars = function () { return { px: pick([1, 2]), py: function (v) { return v.px; }, x: operand('px'), y: operand('py') }; };
  var mixedVars = function () { return { pp: pick([[1, 2], [2, 1], [0, 1], [1, 0], [0, 2], [2, 0], [1, 3], [3, 1]]), px: function (v) { return v.pp[0]; }, py: function (v) { return v.pp[1]; }, x: operand('px'), y: operand('py') }; };
  /** 풀이의 첫 단계: 소수점끼리 맞춰 세로로 쓴다 */
  var alignStep = function (v, c, op) {
    var pad = v.px !== v.py, short = v.px < v.py ? [v.x, v.px] : [v.y, v.py];
    return { say: '소수점끼리 자리를 맞춰 세로로 써요.' + (pad ? ' 자릿수가 다르니까 ' + SJ(short[0], short[1], '은/는') + ' ' + S(short[0] * P10(c.P - short[1]), c.P) + '으로 생각해요(빈 자리는 0).' : ''), tex: column(S(c.X, c.P), op, S(c.Y, c.P)) };
  };
  /** 풀이의 끝: 소수점을 내려 찍고, 끝의 0 은 생략한다 */
  var pointStep = function (out, c, op, R) {
    var value = D(R, c.P), kept = S(R, c.P), short = S(value.n, value.p);
    out.push({ say: '소수점을 같은 자리에 그대로 내려 찍어요. 답은 ' + josa(kept, '이에요/예요') + '.', tex: column(S(c.X, c.P), op, S(c.Y, c.P), kept) });
    if (kept !== short) out.push({ say: '소수점 아래 끝의 0은 생략해요.', tex: kept + ' = ' + short });
    out[out.length - 1].value = value;
    return out;
  };
  var calcHints = function (word) {
    return function (v) {
      var c = calc(v), short = v.px < v.py ? [v.x, v.px] : [v.y, v.py];
      return [
        '소수점끼리 자리를 맞춰 세로로 써요. 같은 자리 숫자끼리 계산해야 해요.',
        v.px !== v.py ? SJ(short[0], short[1], '은/는') + ' ' + S(short[0] * P10(c.P - short[1]), c.P) + '과 같아요. 빈 자리에 0을 써서 자릿수를 맞춰요.' : '자연수의 ' + word + '처럼 가장 낮은 자리부터 계산해요.',
        '계산한 다음 소수점을 같은 자리에 그대로 내려 찍어요.'
      ];
    };
  };
  var rightAlignedSay = function (v) { return '소수점이 아니라 끝자리를 맞춰 계산했어요. ' + SJ(v.x, v.px, '과/와') + ' ' + SJ(v.y, v.py, '은/는') + ' 자릿수가 달라요. 소수점끼리 맞추고 빈 자리는 0으로 생각해요.'; };

  /* ── A13.add 소수의 덧셈 ─────────────────────────────── */
  MH.defineType({
    id: 'A13.add', unit: 'A13', version: 1, title: '소수의 덧셈',
    answer: { kind: 'decimal' },
    levels: [
      { name: '받아올림이 없는 덧셈', vars: sameVars(), where: all(cleanOperands, function (v) { return !hasCarry(v); }) },
      { name: '받아올림이 있는 덧셈', vars: sameVars(), where: all(cleanOperands, hasCarry) },
      { name: '자릿수가 다른 소수', vars: mixedVars(), where: cleanOperands }
    ],
    prompt: function (v) { return { tex: S(v.x, v.px) + ' + ' + S(v.y, v.py) }; },
    solve: function (v) { var c = calc(v); return D(c.X + c.Y, c.P); },
    /* 검산: 정확한 분수 계산으로 x + y 와 같은가 */
    verify: function (v, ans) { return sameValue(ans, exact(v.x, v.px).add(exact(v.y, v.py))); },
    hints: calcHints('덧셈'),
    steps: function (v) {
      var c = calc(v), out = [alignStep(v, c, '+')], carry = 0, R = 0, n = places(c);
      for (var i = 0; i < n; i++) {
        var a = digit(c.X, i), b = digit(c.Y, i), s = a + b + carry, name = placeName(i, c.P);
        if (i >= c.P + 1 && a === 0 && b === 0 && !carry) continue;
        if (a === 0 && b === 0 && !carry) { out.push({ say: name + ': 두 수 모두 0이니까 0을 써요.' }); continue; }
        out.push({ say: name + ': ' + a + ' + ' + b + (carry ? ' + 1(올린 수)' : '') + ' = ' + s + '.' + (s >= 10 ? ' ' + josa(s % 10, '을/를') + ' 쓰고 1을 윗자리로 올려요.' : '') });
        R += (s % 10) * P10(i); carry = s >= 10 ? 1 : 0;
      }
      if (carry) { out.push({ say: '올린 1은 맨 앞자리에 써요.' }); R += P10(n); }
      return pointStep(out, c, '+', R);
    },
    /* ① 끝자리를 맞춰 더함 ② 받아올림을 빠뜨림 ③ 소수 부분의 합을 소수점 뒤에 그대로 씀 ④ 소수점을 찍지 않음 ⑤ 뺌 */
    mistakes: [
      { id: 'right-aligned', wrong: when(function (v) { return v.px !== v.py; }, function (v) { return D(v.x + v.y, Math.max(v.px, v.py)); }), explain: rightAlignedSay },
      { id: 'carry-dropped', wrong: when(hasCarry, function (v) { var c = calc(v); return D(noCarrySum(c), c.P); }),
        explain: function (v) { var c = calc(v); return '받아올림을 빠뜨렸어요. 한 자리의 합이 10이 넘으면 윗자리로 1을 올려요. 자연수의 덧셈과 똑같이 계산하면 ' + SJ(c.X + c.Y, c.P, '이에요/예요') + '.'; } },
      { id: 'sum-after-point', wrong: when(function (v) { var c = calc(v), u = P10(c.P); return c.X % u + c.Y % u >= u; }, function (v) {
        var c = calc(v), u = P10(c.P), f = c.X % u + c.Y % u, w = Math.floor(c.X / u) + Math.floor(c.Y / u);
        return D(w * P10(len(f)) + f, len(f));
      }),
        explain: function (v) { var c = calc(v), u = P10(c.P), f = c.X % u + c.Y % u; return '소수점 아래끼리 더한 ' + josa(f, '을/를') + ' 소수점 뒤에 그대로 썼어요. ' + S(1, c.P) + '이 ' + u + '개 모이면 1이니까, 넘는 만큼은 일의 자리로 올려요.'; } },
      { id: 'no-point', wrong: function (v) { var c = calc(v); return D(c.X + c.Y, 0); },
        explain: function (v) { var c = calc(v); return '소수점을 찍지 않았어요. 계산한 다음 소수점을 같은 자리에 그대로 내려 찍어요: ' + S(c.X + c.Y, c.P) + '.'; } },
      { id: 'subtracted', wrong: function (v) { var c = calc(v); return c.X === c.Y ? null : D(Math.abs(c.X - c.Y), c.P); },
        explain: function () { return '더해야 하는데 뺐어요. + 기호를 다시 확인해요.'; } }
    ]
  });

  /* ── A13.sub 소수의 뺄셈 (x > y) ─────────────────────── */
  var bigger = function (v) { var c = calc(v); return c.X > c.Y; };
  MH.defineType({
    id: 'A13.sub', unit: 'A13', version: 1, title: '소수의 뺄셈',
    answer: { kind: 'decimal' },
    levels: [
      { name: '받아내림이 없는 뺄셈', vars: sameVars(), where: all(cleanOperands, bigger, function (v) { return !hasBorrow(v) && (v.x - v.y) % 10 !== 0; }) },
      { name: '받아내림이 있는 뺄셈', vars: sameVars(), where: all(cleanOperands, bigger, hasBorrow) },
      { name: '자릿수가 다른 소수', vars: mixedVars(), where: all(cleanOperands, bigger) }
    ],
    prompt: function (v) { return { tex: S(v.x, v.px) + ' - ' + S(v.y, v.py) }; },
    solve: function (v) { var c = calc(v); return D(c.X - c.Y, c.P); },
    /* 검산: 정확한 분수 계산으로, 답에 y 를 더하면 x 가 되는가 */
    verify: function (v, ans) { return F(ans.n, P10(ans.p)).add(exact(v.y, v.py)).equals(exact(v.x, v.px)); },
    hints: calcHints('뺄셈'),
    steps: function (v) {
      var c = calc(v), out = [alignStep(v, c, '-')], lent = 0, R = 0, n = places(c);
      for (var i = 0; i < n; i++) {
        var top = digit(c.X, i), b = digit(c.Y, i), a = top - lent, name = placeName(i, c.P), r, say;
        if (i >= len(c.X)) break;
        if (i >= c.P + 1 && top === 0 && b === 0 && !lent) continue;
        if (a >= b) { r = a - b; say = (lent ? '아랫자리에 1을 빌려줘서 ' + josa(top, '이/가') + ' ' + josa(a, '이/가') + ' 됐어요. ' : '') + a + ' − ' + b + ' = ' + r + '.'; lent = 0; }
        else {
          r = a + 10 - b;
          say = (a < 0 ? '0은 빌려줄 수 없어서 윗자리에서 먼저 1을 빌려 와요. 10에서 1을 빌려주고 9가 남아요. 9'
            : (lent ? '아랫자리에 1을 빌려줘서 ' + josa(a, '이/가') + ' 됐어요. ' : '') + a + '에서 ' + josa(b, '을/를') + ' 뺄 수 없어요. 윗자리에서 1을 빌려 와 ' + (a + 10)) + ' − ' + b + ' = ' + r + '.';
          lent = 1;
        }
        out.push({ say: name + ': ' + say });
        R += r * P10(i);
      }
      if (len(c.X) <= c.P) out.push({ say: '일의 자리에는 0을 써요.' });
      return pointStep(out, c, '-', R);
    },
    /* ① 끝자리를 맞춰 뺌 ② 자리마다 큰 수에서 작은 수를 뺌 ③ 빌려준 자리를 줄이지 않음 ④ 더함 ⑤ 소수점을 찍지 않음 */
    mistakes: [
      { id: 'right-aligned', wrong: when(function (v) { return v.px !== v.py && v.x !== v.y; }, function (v) { return D(Math.abs(v.x - v.y), Math.max(v.px, v.py)); }), explain: rightAlignedSay },
      { id: 'bigger-minus-smaller', wrong: when(hasBorrow, function (v) { var c = calc(v); return D(absDiff(c), c.P); }),
        explain: function (v) { var c = calc(v); return '자리마다 큰 숫자에서 작은 숫자를 뺐어요. 위의 숫자가 작으면 윗자리에서 1을 빌려 와야 해요. 받아내림을 하면 ' + SJ(c.X - c.Y, c.P, '이에요/예요') + '.'; } },
      { id: 'borrow-not-reduced', wrong: when(hasBorrow, function (v) { var c = calc(v); return D(perDigit(c, function (a, b) { return (a - b + 10) % 10; }), c.P); }),
        explain: function (v) { var c = calc(v); return '윗자리에서 1을 빌려 오고, 빌려준 자리의 숫자를 1 줄이지 않았어요. 빌려준 자리는 1 작아져요. 바르게 계산하면 ' + SJ(c.X - c.Y, c.P, '이에요/예요') + '.'; } },
      { id: 'added', wrong: function (v) { var c = calc(v); return D(c.X + c.Y, c.P); },
        explain: function () { return '빼야 하는데 더했어요. − 기호를 다시 확인해요.'; } },
      { id: 'no-point', wrong: function (v) { var c = calc(v); return D(c.X - c.Y, 0); },
        explain: function (v) { var c = calc(v); return '소수점을 찍지 않았어요. 계산한 다음 소수점을 같은 자리에 그대로 내려 찍어요: ' + S(c.X - c.Y, c.P) + '.'; } }
    ]
  });
})();
