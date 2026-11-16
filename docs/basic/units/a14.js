/* A14 소수의 곱셈과 나눗셈 — 소수점 위치, (소수)×(소수), (소수)÷(자연수·소수)
   유형(쉬운 것부터): A14.shift 소수점 옮기기(10, 100, 0.1 …) · A14.by-whole 소수 × 자연수 · A14.mul 소수 × 소수
                     · A14.div-whole 소수 ÷ 자연수 · A14.div 소수로 나누기
   소수는 { n, p }(n ÷ 10^p)로 다루고, 계산은 정수로만 한다(부동소수점을 쓰지 않는다). 답은 소수 키패드로 쓴다(decimal).
   소수 키패드는 소수점 아래 네 자리까지 받으므로, 모든 답은 소수점 아래 네 자리 안에서 끝나게 만든다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F, D = MH.dec, P10 = MH.pow10;

  /** 소수를 글자로. 적힌 자릿수 그대로: S(350, 2) → 3.50 */
  var S = function (n, p) { return MH.decStr(n, p, true); };
  var SJ = function (n, p, pair) { return josa(S(n, p), pair); };
  /** 값 { n, p } 를 글자로 */
  var show = function (d) { return S(d.n, d.p); };
  var when = function (test, make) { return function (v) { return test(v) ? make(v) : null; }; };
  var all = function () { var tests = [].slice.call(arguments); return function (v) { return tests.every(function (t) { return t(v); }); }; };
  var len = function (n) { return String(n).length; };
  /** 키패드로 칠 수 있는 값만 오답으로 쓴다(소수점 아래 네 자리까지) */
  var typable = function (d) { return d && d.p <= 4 ? d : null; };
  var count = function (k) { return ['한', '두', '세', '네', '다섯', '여섯'][k - 1]; };
  var exact = function (n, p) { return F(n, P10(p)); };
  var sameValue = function (ans, f) { return F(ans.n, P10(ans.p)).equals(f); };
  /** 풀이의 끝: 끝의 0 을 생략하는 단계를 붙이고 마지막 단계에 답을 적는다. kept 는 0 을 생략하기 전의 글자 */
  var finish = function (out, n, p) {
    var value = D(n, p);
    if (S(n, p) !== show(value)) out.push({ say: '소수점 아래 끝의 0은 생략해요.', tex: S(n, p) + ' = ' + show(value) });
    out[out.length - 1].value = value;
    return out;
  };

  /* ── A14.shift 소수점 옮기기 ──────────────────────────
     x (n, 소수점 아래 px 자리) 에 op 를 한다. m: × 10^k · d: ÷ 10^k · c: × 0.1^k (소수점을 k 칸 옮긴다) */
  /** n ÷ 10^p 의 소수점을 오른쪽으로 k 칸(음수면 왼쪽으로) 옮긴 값 */
  var moved = function (n, p, k) { var q = p - k; return q >= 0 ? D(n, q) : D(n * P10(-q), 0); };
  var dir = function (v) { return v.op === 'm' ? v.k : -v.k; };
  var other = function (v) { return v.op === 'c' ? S(1, v.k) : String(P10(v.k)); };
  var shiftTex = function (v) { return S(v.n, v.px) + (v.op === 'd' ? ' \\div ' : ' \\times ') + other(v); };
  var side = function (v) { return dir(v) > 0 ? '오른쪽' : '왼쪽'; };
  var notTen = function (v) { return v.n % 10 !== 0; };
  MH.defineType({
    id: 'A14.shift', unit: 'A14', version: 1, title: '소수점 옮기기',
    answer: { kind: 'decimal' },
    levels: [
      { name: '10, 100, 1000을 곱하기', vars: { op: 'm', px: pick([1, 2, 3]), k: function (v) { return int(1, v.px); }, n: int(1, 999) }, where: notTen },
      { name: '10, 100, 1000으로 나누기', vars: { op: 'd', px: pick([0, 1, 2]), k: function (v) { return int(1, Math.min(3, 4 - v.px)); }, n: int(1, 999) },
        where: all(notTen, function (v) { return len(v.n) >= v.px + v.k; }) },
      { name: '0.1, 0.01을 곱하기 · 0 채우기', vars: { op: pick(['m', 'c', 'c', 'd']), px: pick([0, 1, 2]), k: function (v) { return v.op === 'm' ? int(Math.min(v.px + 1, 3), 3) : int(1, Math.min(3, 4 - v.px)); }, n: int(1, 99) },
        where: all(notTen, function (v) { return v.op === 'm' ? v.px >= 1 && v.k > v.px : v.op === 'd' ? len(v.n) < v.px + v.k : true; }) }
    ],
    prompt: function (v) { return { tex: shiftTex(v) }; },
    solve: function (v) { return moved(v.n, v.px, dir(v)); },
    /* 검산: 정확한 분수 계산으로 x × 10^k 또는 x ÷ 10^k 와 같은가 */
    verify: function (v, ans) { var x = exact(v.n, v.px), t = F(P10(v.k)); return sameValue(ans, v.op === 'm' ? x.mul(t) : x.div(t)); },
    hints: function (v) {
      var big = String(P10(v.k));
      return [
        '10을 곱하면 소수점이 오른쪽으로 한 칸, 10으로 나누면 왼쪽으로 한 칸 옮겨져요.',
        v.op === 'c' ? josa(other(v), '을/를') + ' 곱하는 것은 ' + josa(big, '으로/로') + ' 나누는 것과 같아요. 수가 작아져요.' : big + '에는 0이 ' + count(v.k) + ' 개 있어요. 소수점을 ' + side(v) + '으로 그만큼 옮겨요.',
        '옮길 자리에 숫자가 없으면 그 자리에 0을 채워요.'
      ];
    },
    steps: function (v) {
      var big = String(P10(v.k)), r = moved(v.n, v.px, dir(v)), out = [];
      var first = v.op === 'm' ? josa(big, '을/를') + ' 곱하면 수가 ' + big + '배로 커져요.' : v.op === 'd' ? josa(big, '으로/로') + ' 나누면 수가 작아져요.' : josa(other(v), '을/를') + ' 곱하는 것은 ' + josa(big, '으로/로') + ' 나누는 것과 같아요.';
      out.push({ say: first + ' 소수점을 ' + side(v) + '으로 ' + count(v.k) + ' 칸 옮겨요.' + (v.px === 0 ? ' 자연수는 일의 자리 뒤에 소수점이 있다고 생각해요.' : '') });
      if (v.op === 'm' && v.k > v.px) out.push({ say: '소수점 아래 숫자가 ' + count(v.px) + ' 개뿐이라 옮길 자리가 모자라요. 모자란 자리에 0을 채워요.' });
      else if (v.op !== 'm' && len(v.n) < v.px + v.k) out.push({ say: '옮길 자리에 숫자가 없어요. 빈 자리에 0을 채우고, 일의 자리에도 0을 써요.' });
      else if (v.op !== 'm' && len(v.n) === v.px + v.k) out.push({ say: '소수점 앞에 숫자가 없으면 일의 자리에 0을 써요.' });
      out.push({ say: '답은 ' + josa(show(r), '이에요/예요') + '.', tex: shiftTex(v) + ' = ' + show(r), value: r });
      return out;
    },
    /* ① 반대 방향으로 옮김 ② 수를 그대로 둠(0 만 붙이거나 뗌) ③ 한 칸 덜 옮김 ④ 한 칸 더 옮김 */
    mistakes: [
      { id: 'wrong-direction', wrong: function (v) { return typable(moved(v.n, v.px, -dir(v))); },
        explain: function (v) { return '소수점을 반대쪽으로 옮겼어요. ' + (v.op === 'm' ? '곱하면 수가 커지니까 오른쪽으로' : v.op === 'd' ? '나누면 수가 작아지니까 왼쪽으로' : josa(other(v), '은/는') + ' 1보다 작은 수라서 곱하면 수가 작아져요. 왼쪽으로') + ' 옮겨요.'; } },
      { id: 'unchanged', wrong: function (v) { return D(v.n, v.px); },
        explain: function (v) { return '수의 크기가 그대로예요. ' + (v.op === 'm' ? '소수는 끝에 0을 붙여도 크기가 변하지 않아요. ' : '') + '소수점을 ' + side(v) + '으로 ' + count(v.k) + ' 칸 옮겨야 해요.'; } },
      { id: 'one-short', wrong: when(function (v) { return v.k >= 2; }, function (v) { return moved(v.n, v.px, dir(v) > 0 ? v.k - 1 : 1 - v.k); }),
        explain: function (v) { return '소수점을 한 칸 덜 옮겼어요. ' + P10(v.k) + '에는 0이 ' + count(v.k) + ' 개 있으니 ' + count(v.k) + ' 칸 옮겨요.'; } },
      { id: 'one-more', wrong: function (v) { return typable(moved(v.n, v.px, dir(v) > 0 ? v.k + 1 : -v.k - 1)); },
        explain: function (v) { return '소수점을 한 칸 더 옮겼어요. ' + (v.op === 'c' ? josa(other(v), '은/는') + ' 소수 ' + count(v.k) + ' 자리 수니까 ' : P10(v.k) + '에는 0이 ' + count(v.k) + ' 개 있으니 ') + count(v.k) + ' 칸만 옮겨요.'; } }
    ]
  });

  /* ── A14.by-whole 소수 × 자연수 ───────────────────────
     x (n, 소수점 아래 px 자리) × k. first 가 1 이면 자연수를 앞에 쓴다. */
  var wholeOf = function (v) { return Math.floor(v.n / P10(v.px)); };
  var fracOf = function (v) { return v.n % P10(v.px); };
  var byWholeTex = function (v) { return v.first ? v.k + ' \\times ' + S(v.n, v.px) : S(v.n, v.px) + ' \\times ' + v.k; };
  MH.defineType({
    id: 'A14.by-whole', unit: 'A14', version: 1, title: '소수 × 자연수',
    answer: { kind: 'decimal' },
    levels: [
      { name: '소수 한 자리 수 × 한 자리 수', minDistinct: 250, vars: { first: 0, px: 1, n: int(1, 99), k: int(2, 9) }, where: all(notTen, function (v) { return (v.n * v.k) % 10 !== 0; }) },
      { name: '소수 두 자리 수 · 두 자리 수 곱하기', vars: { first: 0, px: pick([1, 2]), n: function (v) { return v.px === 1 ? int(11, 99) : int(1, 999); }, k: function (v) { return v.px === 1 ? int(11, 25) : int(2, 9); } }, where: notTen },
      { name: '자연수 × 소수 · 큰 수', vars: { first: pick([0, 1, 1]), px: pick([1, 2]), n: function (v) { return v.px === 1 ? int(1, 99) : int(1, 999); }, k: function (v) { return v.px === 1 ? int(12, 45) : int(11, 25); } }, where: notTen }
    ],
    prompt: function (v) { return { tex: byWholeTex(v) }; },
    solve: function (v) { return D(v.n * v.k, v.px); },
    verify: function (v, ans) { return sameValue(ans, exact(v.n, v.px).mul(v.k)); },
    hints: function (v) {
      return [
        '소수점이 없다고 생각하고 자연수처럼 곱해요: ' + v.n + ' × ' + v.k + '.',
        SJ(v.n, v.px, '은/는') + ' 소수 ' + count(v.px) + ' 자리 수예요. 곱에도 소수점 아래가 ' + count(v.px) + ' 자리가 되도록 소수점을 찍어요.',
        wholeOf(v) ? '어림해서 확인해요. ' + SJ(v.n, v.px, '은/는') + ' ' + wholeOf(v) + '보다 조금 큰 수니까, 답은 ' + wholeOf(v) + ' × ' + v.k + ' = ' + wholeOf(v) * v.k + '보다 조금 커요.' : '어림해서 확인해요. 소수점 앞이 0인 수를 곱했으니까 답은 ' + v.k + '보다 작아요.'
      ];
    },
    steps: function (v) {
      var N = v.n * v.k, out = [];
      out.push({ say: '소수점이 없다고 생각하고 자연수처럼 곱해요.', tex: v.n + ' \\times ' + v.k + ' = ' + N });
      out.push({ say: SJ(v.n, v.px, '은/는') + ' ' + v.n + '의 ' + P10(v.px) + '분의 1이에요(소수 ' + count(v.px) + ' 자리 수). 곱도 ' + N + '의 ' + P10(v.px) + '분의 1이니까, 소수점 아래가 ' + count(v.px) + ' 자리가 되도록 소수점을 찍어요.' + (len(N) < v.px ? ' 숫자가 모자라니까 앞에 0을 채워요.' : len(N) === v.px ? ' 소수점 앞 일의 자리에는 0을 써요.' : ''),
        tex: byWholeTex(v) + ' = ' + S(N, v.px) });
      return finish(out, N, v.px);
    },
    /* ① 소수점을 찍지 않음 ② 곱을 소수점 뒤에 그대로 씀 ③ 자연수 부분에만 곱함 ④ 소수 부분에만 곱함 ⑤ 더함 */
    mistakes: [
      { id: 'no-point', wrong: function (v) { return D(v.n * v.k, 0); },
        explain: function (v) { return '소수점을 찍지 않았어요. ' + SJ(v.n, v.px, '이/가') + ' 소수 ' + count(v.px) + ' 자리 수니까 곱에도 소수점 아래 ' + count(v.px) + ' 자리가 되도록 찍어요: ' + show(D(v.n * v.k, v.px)) + '.'; } },
      { id: 'product-after-point', wrong: when(function (v) { return !wholeOf(v) && v.n * v.k >= P10(v.px); }, function (v) { return D(v.n * v.k, len(v.n * v.k)); }),
        explain: function (v) { return v.n + ' × ' + v.k + ' = ' + josa(v.n * v.k, '을/를') + ' 소수점 뒤에 그대로 썼어요. ' + S(1, v.px) + '이 ' + v.n * v.k + '개면 ' + josa(S(v.n * v.k, v.px), '이에요/예요') + '. 소수점 아래는 ' + count(v.px) + ' 자리예요.'; } },
      { id: 'whole-only', wrong: when(function (v) { return wholeOf(v) > 0; }, function (v) { return D(wholeOf(v) * v.k * P10(v.px) + fracOf(v), v.px); }),
        explain: function (v) { return '자연수 부분 ' + wholeOf(v) + '에만 ' + josa(v.k, '을/를') + ' 곱했어요. 소수 부분 ' + S(fracOf(v), v.px) + '에도 곱해야 해요. 자연수처럼 통째로 곱하면 빠뜨리지 않아요: ' + v.n + ' × ' + v.k + '.'; } },
      { id: 'fraction-only', wrong: when(function (v) { return wholeOf(v) > 0; }, function (v) { return D(wholeOf(v) * P10(v.px) + fracOf(v) * v.k, v.px); }),
        explain: function (v) { return '소수 부분 ' + S(fracOf(v), v.px) + '에만 ' + josa(v.k, '을/를') + ' 곱했어요. 자연수 부분 ' + wholeOf(v) + '에도 곱해야 해요. 자연수처럼 통째로 곱하면 빠뜨리지 않아요: ' + v.n + ' × ' + v.k + '.'; } },
      { id: 'added', wrong: function (v) { return D(v.n + v.k * P10(v.px), v.px); },
        explain: function () { return '곱해야 하는데 더했어요. × 기호를 다시 확인해요.'; } }
    ]
  });

  /* ── A14.mul 소수 × 소수 ─────────────────────────────
     x (a, 소수점 아래 pa 자리) × y (b, pb 자리) = a × b 에 소수점 아래 pa + pb 자리 */
  var parts = function (n, p) { return { w: Math.floor(n / P10(p)), f: n % P10(p) }; };
  var mulVars = function (shape, ra, rb) { return { shape: shape, pa: function (v) { return v.shape[0]; }, pb: function (v) { return v.shape[1]; }, a: ra, b: rb }; };
  var mulClean = function (v) { return v.a % 10 !== 0 && v.b % 10 !== 0; };
  MH.defineType({
    id: 'A14.mul', unit: 'A14', version: 1, title: '소수 × 소수',
    answer: { kind: 'decimal' },
    levels: [
      { name: '1보다 작은 소수 한 자리 수끼리', minDistinct: 55, vars: mulVars([1, 1], int(1, 9), int(1, 9)), where: function (v) { return (v.a * v.b) % 10 !== 0; } },
      { name: '소수 한 자리 수끼리', vars: mulVars([1, 1], int(2, 99), int(2, 35)), where: all(mulClean, function (v) { return v.a > 10 || v.b > 10; }) },
      { name: '자릿수가 다른 소수', vars: mulVars(pick([[1, 2], [2, 1]]), function (v) { return int(1, v.pa === 1 ? 99 : 250); }, function (v) { return int(1, v.pb === 1 ? 99 : 250); }), where: mulClean }
    ],
    prompt: function (v) { return { tex: S(v.a, v.pa) + ' \\times ' + S(v.b, v.pb) }; },
    solve: function (v) { return D(v.a * v.b, v.pa + v.pb); },
    verify: function (v, ans) { return sameValue(ans, exact(v.a, v.pa).mul(exact(v.b, v.pb))); },
    hints: function (v) {
      return [
        '소수점이 없다고 생각하고 자연수처럼 곱해요: ' + v.a + ' × ' + v.b + '.',
        '두 수의 소수점 아래 자릿수를 더해요: ' + count(v.pa) + ' 자리와 ' + count(v.pb) + ' 자리.',
        '곱의 소수점 아래가 그 자릿수가 되도록 소수점을 찍어요. 숫자가 모자라면 앞에 0을 채워요.'
      ];
    },
    steps: function (v) {
      var N = v.a * v.b, P = v.pa + v.pb, out = [];
      out.push({ say: '소수점이 없다고 생각하고 자연수처럼 곱해요.', tex: v.a + ' \\times ' + v.b + ' = ' + N });
      out.push({ say: '소수점 아래 자릿수를 더해요. ' + SJ(v.a, v.pa, '은/는') + ' ' + count(v.pa) + ' 자리, ' + SJ(v.b, v.pb, '은/는') + ' ' + count(v.pb) + ' 자리니까 곱은 소수점 아래 ' + count(P) + ' 자리예요.' });
      out.push({ say: josa(N, '의/의') + ' 오른쪽 끝에서 ' + count(P) + ' 자리 앞에 소수점을 찍어요.' + (len(N) < P ? ' 숫자가 모자라니까 앞에 0을 채워요.' : len(N) === P ? ' 소수점 앞 일의 자리에는 0을 써요.' : ''), tex: S(v.a, v.pa) + ' \\times ' + S(v.b, v.pb) + ' = ' + S(N, P) });
      return finish(out, N, P);
    },
    /* ① 소수점 아래 자릿수를 더하지 않음(덧셈처럼 자리를 맞춤) ② 소수점을 찍지 않음 ③ 자연수끼리, 소수끼리 따로 곱함 ④ 더함 */
    mistakes: [
      { id: 'places-not-added', wrong: function (v) { return D(v.a * v.b, Math.max(v.pa, v.pb)); },
        explain: function (v) { return '덧셈처럼 소수점 자리를 그대로 내려 찍었어요. 곱셈에서는 두 수의 소수점 아래 자릿수를 더해요: ' + count(v.pa) + ' 자리 + ' + count(v.pb) + ' 자리 = ' + count(v.pa + v.pb) + ' 자리. 답은 ' + josa(show(D(v.a * v.b, v.pa + v.pb)), '이에요/예요') + '.'; } },
      { id: 'no-point', wrong: function (v) { return D(v.a * v.b, 0); },
        explain: function (v) { return '소수점을 찍지 않았어요. 곱의 소수점 아래는 ' + count(v.pa + v.pb) + ' 자리예요: ' + S(v.a * v.b, v.pa + v.pb) + (v.a * v.b % 10 ? '' : ' = ' + show(D(v.a * v.b, v.pa + v.pb))) + '.'; } },
      { id: 'parts-separately', wrong: when(function (v) { return v.pa === v.pb && parts(v.a, v.pa).w > 0 && parts(v.b, v.pb).w > 0; }, function (v) {
        var x = parts(v.a, v.pa), y = parts(v.b, v.pb), f = x.f * y.f, L = Math.max(len(f), v.pa);
        return D(x.w * y.w * P10(L) + f, L);
      }),
        explain: function (v) { var x = parts(v.a, v.pa), y = parts(v.b, v.pb); return '자연수끼리(' + x.w + ' × ' + y.w + '), 소수끼리 따로 곱했어요. 곱셈은 덧셈처럼 따로 계산할 수 없어요. 자연수처럼 통째로 곱해요: ' + v.a + ' × ' + v.b + '.'; } },
      { id: 'added', wrong: function (v) { var P = Math.max(v.pa, v.pb); return D(v.a * P10(P - v.pa) + v.b * P10(P - v.pb), P); },
        explain: function () { return '곱해야 하는데 더했어요. × 기호를 다시 확인해요.'; } }
    ]
  });

  /* ── A14.div-whole 소수 ÷ 자연수 ──────────────────────
     몫 q (소수점 아래 pq 자리) 와 나누는 수 k 를 먼저 정한다. 나누어지는 수는 q × k (끝의 0 은 떼고 보여 준다). */
  var dividend = function (v) { return D(v.q * v.k, v.pq); };
  /** 몫의 숫자마다 k 를 곱해도 9 이하인가(자리마다 따로 나누어떨어지는가) */
  var digitwise = function (v) { return String(v.q).split('').every(function (c) { return Number(c) * v.k <= 9; }); };
  /** 몫의 소수점 바로 뒤에 0 이 오는가(1.05, 0.07) */
  var zeroInside = function (v) { var f = v.q % P10(v.pq); return f > 0 && len(f) < v.pq; };
  var qClean = function (v) { return v.q % 10 !== 0 && v.q * v.k <= 9999; };
  MH.defineType({
    id: 'A14.div-whole', unit: 'A14', version: 1, title: '소수 ÷ 자연수',
    answer: { kind: 'decimal' },
    levels: [
      { name: '자리마다 나누어떨어질 때', minDistinct: 80, vars: { pq: pick([1, 2]), k: int(2, 4), q: int(1, 444) }, where: all(qClean, digitwise, function (v) { return !zeroInside(v); }) },
      { name: '내림이 있는 나눗셈', vars: { pq: pick([1, 2]), k: int(2, 9), q: int(2, 999) }, where: all(qClean, function (v) { return !digitwise(v) && !zeroInside(v) && (v.q * v.k) % 10 !== 0; }) },
      { name: '0을 내려 계산 · 몫에 0이 있을 때', vars: { pq: pick([1, 2, 2, 3]), k: pick([2, 3, 4, 5, 6, 7, 8, 9, 12]), q: int(2, 999) }, where: all(qClean, function (v) { return (v.q * v.k) % 10 === 0 || zeroInside(v); }) }
    ],
    prompt: function (v) { return { tex: show(dividend(v)) + ' \\div ' + v.k }; },
    solve: function (v) { return D(v.q, v.pq); },
    /* 검산: 정확한 분수 계산으로, 답에 나누는 수를 곱하면 화면에 보이는 나누어지는 수가 되는가 */
    verify: function (v, ans) { var x = dividend(v); return F(ans.n, P10(ans.p)).mul(v.k).equals(exact(x.n, x.p)); },
    hints: function (v) {
      var x = dividend(v);
      return [
        '소수점이 없다고 생각하고 자연수의 나눗셈처럼 계산해요.',
        x.p < v.pq ? '나누어떨어지지 않으면 ' + josa(show(x), '을/를') + ' ' + S(v.q * v.k, v.pq) + '처럼 끝에 0을 붙여 계속 나눠요.' : '몫의 소수점은 나누어지는 수의 소수점과 같은 자리에 찍어요.',
        x.n < v.k * P10(x.p) ? josa(show(x), '이/가') + ' ' + v.k + '보다 작으니까 몫은 1보다 작아요. 몫의 일의 자리에 0을 써요.' : '어림해요. ' + josa(Math.floor(x.n / P10(x.p)), '을/를') + ' ' + josa(v.k, '으로/로') + ' 나눈 몫에 가까운 수가 나와요.'
      ];
    },
    steps: function (v) {
      var x = dividend(v), N = v.q * v.k, out = [];
      if (x.p < v.pq) out.push({ say: josa(show(x), '은/는') + ' ' + S(N, v.pq) + '과 같아요. 끝에 0을 붙여 나누어떨어질 때까지 계산해요.', tex: show(x) + ' = ' + S(N, v.pq) });
      out.push({ say: '소수점이 없다고 생각하고 자연수처럼 나눠요.', tex: N + ' \\div ' + v.k + ' = ' + v.q });
      out.push({ say: SJ(N, v.pq, '은/는') + ' ' + N + '의 ' + P10(v.pq) + '분의 1이니까 몫도 ' + v.q + '의 ' + P10(v.pq) + '분의 1이에요. 나누어지는 수와 같은 자리에 소수점을 찍어요.' + (zeroInside(v) ? ' 숫자가 모자란 자리에는 0을 써요.' : v.q < P10(v.pq) ? ' 몫의 일의 자리에는 0을 써요.' : ''),
        tex: show(x) + ' \\div ' + v.k + ' = ' + S(v.q, v.pq) });
      out.push({ say: '검산: 몫에 나누는 수를 곱하면 나누어지는 수가 나와요.', tex: S(v.q, v.pq) + ' \\times ' + v.k + ' = ' + show(x), value: D(v.q, v.pq) });
      return out;
    },
    /* ① 소수점을 찍지 않음 ② 몫의 0 을 빠뜨림 ③ 소수점을 한 자리 앞에 찍음 ④ 곱함 */
    mistakes: [
      { id: 'no-point', wrong: function (v) { return D(v.q, 0); },
        explain: function (v) { return '몫에 소수점을 찍지 않았어요. 나누어지는 수의 소수점과 같은 자리에 찍어요: ' + S(v.q, v.pq) + '.'; } },
      { id: 'zero-skipped', wrong: when(zeroInside, function (v) { var u = P10(v.pq), f = v.q % u; return D(Math.floor(v.q / u) * P10(len(f)) + f, len(f)); }),
        explain: function (v) { return '몫의 0을 빠뜨렸어요. 나눌 수 없는 자리에는 몫에 0을 쓰고 다음 숫자를 내려요. 답은 ' + SJ(v.q, v.pq, '이에요/예요') + '.'; } },
      { id: 'point-early', wrong: function (v) { return typable(D(v.q, v.pq + 1)); },
        explain: function (v) { return '소수점을 한 자리 앞에 찍었어요. 검산해 보면 ' + S(v.q, v.pq + 1) + ' × ' + v.k + ' = ' + josa(show(D(v.q * v.k, v.pq + 1)), '이라/라') + ' 맞지 않아요. 답은 ' + SJ(v.q, v.pq, '이에요/예요') + '.'; } },
      { id: 'multiplied', wrong: function (v) { var x = dividend(v); return D(x.n * v.k, x.p); },
        explain: function () { return '나눠야 하는데 곱했어요. ÷ 기호를 다시 확인해요.'; } }
    ]
  });

  /* ── A14.div 소수로 나누기 ───────────────────────────
     나누는 수 d (소수점 아래 pd 자리) 와 몫 q (pq 자리) 를 먼저 정한다. 나누어지는 수는 d × q. */
  var top = function (v) { return D(v.d * v.q, v.pd + v.pq); };                 /* 나누어지는 수 */
  var topMoved = function (v) { return D(v.d * v.q, v.pq); };                   /* 소수점을 pd 칸 옮긴 나누어지는 수 */
  var divTex = function (v) { return show(top(v)) + ' \\div ' + S(v.d, v.pd); };
  var dClean = function (v) { return v.d % 10 !== 0 && (v.pq === 0 || v.q % 10 !== 0); };
  MH.defineType({
    id: 'A14.div', unit: 'A14', version: 1, title: '소수로 나누기',
    answer: { kind: 'decimal' },
    levels: [
      { name: '자릿수가 같은 소수끼리', vars: { pd: pick([1, 2]), pq: 0, d: int(2, 99), q: int(2, 9) }, where: all(dClean, function (v) { return (v.d * v.q) % 10 !== 0; }) },
      { name: '몫이 소수일 때', vars: { pd: 1, pq: 1, d: int(2, 9), q: int(11, 99) }, where: all(dClean, function (v) { return (v.d * v.q) % 10 !== 0; }) },
      { name: '자연수 ÷ 소수 · 0 채우기', minDistinct: 150, vars: { pd: pick([1, 2]), pq: pick([0, 0, 1]), d: function (v) { return int(2, v.pd === 1 ? 9 : 99); }, q: int(2, 99) }, where: all(dClean, function (v) { return top(v).p < v.pd; }) }
    ],
    prompt: function (v) { return { tex: divTex(v) }; },
    solve: function (v) { return D(v.q, v.pq); },
    /* 검산: 정확한 분수 계산으로, 답에 나누는 수를 곱하면 화면에 보이는 나누어지는 수가 되는가 */
    verify: function (v, ans) { var x = top(v); return F(ans.n, P10(ans.p)).mul(exact(v.d, v.pd)).equals(exact(x.n, x.p)); },
    hints: function (v) {
      var x = top(v);
      return [
        '나누는 수 ' + josa(S(v.d, v.pd), '을/를') + ' 자연수로 만들어요. 소수점을 오른쪽으로 ' + count(v.pd) + ' 칸 옮기면 돼요.',
        '나누어지는 수 ' + show(x) + '의 소수점도 똑같이 오른쪽으로 ' + count(v.pd) + ' 칸 옮겨요. 두 수에 같은 수를 곱해도 몫은 변하지 않아요.' + (x.p < v.pd ? ' 옮길 자리가 모자라면 0을 채워요.' : ''),
        '바꾼 식을 계산해요. 몫의 소수점은 옮긴 뒤의 소수점 자리에 찍어요.'
      ];
    },
    steps: function (v) {
      var x = top(v), m = topMoved(v), out = [];
      out.push({ say: '나누는 수가 자연수가 되도록 두 수의 소수점을 똑같이 오른쪽으로 ' + count(v.pd) + ' 칸 옮겨요. 두 수에 똑같이 ' + josa(P10(v.pd), '을/를') + ' 곱해도 몫은 변하지 않아요.' + (x.p < v.pd ? ' ' + josa(show(x), '은/는') + ' 옮길 자리가 모자라니까 0을 채워요.' : ''),
        tex: divTex(v) + ' = ' + show(m) + ' \\div ' + v.d });
      if (m.p > 0) out.push({ say: '자연수로 나누는 나눗셈이 됐어요. 자연수처럼 나눈 다음(' + m.n + ' ÷ ' + v.d + ' = ' + v.q + '), 나누어지는 수 ' + show(m) + '의 소수점 자리에 맞춰 몫에 소수점을 찍어요.', tex: show(m) + ' \\div ' + v.d + ' = ' + S(v.q, v.pq) });
      else out.push({ say: '자연수의 나눗셈이 됐어요.', tex: show(m) + ' \\div ' + v.d + ' = ' + S(v.q, v.pq) });
      out.push({ say: '검산: 몫에 나누는 수를 곱하면 나누어지는 수가 나와요.', tex: S(v.q, v.pq) + ' \\times ' + S(v.d, v.pd) + ' = ' + show(x), value: D(v.q, v.pq) });
      return out;
    },
    /* ① 나누는 수의 소수점만 옮김 ② 소수점을 무시하고 숫자끼리 나눔 ③ 나누어지는 수의 소수점만 옮김 ④ 곱함 */
    mistakes: [
      { id: 'divisor-only', wrong: function (v) { return D(v.q, v.pq + v.pd); },
        explain: function (v) { return '나누는 수 ' + S(v.d, v.pd) + '의 소수점만 옮기고, 나누어지는 수는 그대로 뒀어요. 두 수의 소수점을 똑같이 ' + count(v.pd) + ' 칸 옮겨야 몫이 변하지 않아요: ' + show(topMoved(v)) + ' ÷ ' + v.d + '.'; } },
      { id: 'points-ignored', wrong: when(function (v) { return top(v).n % v.d === 0; }, function (v) { return D(top(v).n / v.d, 0); }),
        explain: function (v) { var x = top(v); return '소수점을 떼고 ' + x.n + ' ÷ ' + josa(v.d, '을/를') + ' 계산했어요. 두 수의 소수점 아래 자릿수가 다르면 그렇게 할 수 없어요. 소수점을 똑같이 ' + count(v.pd) + ' 칸씩 옮겨요: ' + show(topMoved(v)) + ' ÷ ' + v.d + '.'; } },
      { id: 'dividend-only', wrong: function (v) { return moved(v.q, v.pq, v.pd); },
        explain: function (v) { return '몫이 너무 커요. 나누는 수 ' + S(v.d, v.pd) + '의 소수점을 옮긴 칸 수만큼만 나누어지는 수의 소수점을 옮겨요. 검산해 보면 답은 ' + SJ(v.q, v.pq, '이에요/예요') + '.'; } },
      { id: 'multiplied', wrong: function (v) { var x = top(v); return typable(D(x.n * v.d, x.p + v.pd)); },
        explain: function () { return '나눠야 하는데 곱했어요. ÷ 기호를 다시 확인해요.'; } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('A14', [
  { title: '10, 100, 1000 — 소수점만 옮겨요', body: [
    { ex: [['0.84 \\times 10', '소수점을 오른쪽으로 한 칸 → 8.4'], ['0.84 \\times 1000', '오른쪽으로 세 칸. 빈자리는 0 → 840'], ['8.4 \\div 100', '소수점을 왼쪽으로 두 칸 → 0.084']] },
    '곱하면 수가 커지니 소수점이 오른쪽으로, 나누면 작아지니 왼쪽으로 가요. 0의 개수만큼 옮겨요.'
  ] },
  { title: '소수의 곱셈 — 자연수처럼 곱하고 소수점은 나중에', body: [
    { tex: '1.2 \\times 0.3 = 0.36' },
    { list: ['① 소수점을 없다고 보고 곱해요: 12 × 3 = 36.', '② 두 수의 소수점 아래 자릿수를 더해요: 1자리 + 1자리 = 2자리.', '③ 답의 소수점 아래가 2자리가 되게 점을 찍어요: 0.36.'] },
    '덧셈과 달리 곱셈에서는 소수점의 줄을 맞출 필요가 없어요.'
  ] },
  { title: '소수 ÷ 자연수 — 몫의 소수점은 같은 자리에', body: [
    { tex: '32.24 \\div 8 = 4.03' },
    '자연수의 나눗셈처럼 높은 자리부터 나누고, 몫의 소수점은 나누어지는 수의 소수점 바로 위에 찍어요.',
    '어떤 자리에서 나눌 수 없으면 몫에 0을 쓰고 다음 자리로 넘어가요(위에서 2 ÷ 8을 못 하니 0을 쓰고 24 ÷ 8 = 3).'
  ] },
  { title: '소수로 나누기 — 나누는 수를 자연수로 만들어요', body: [
    { tex: '27 \\div 0.6 = 270 \\div 6 = 45' },
    '나누는 수와 나누어지는 수에 똑같이 10(또는 100)을 곱해도 몫은 변하지 않아요. 두 수의 소수점을 같은 칸만큼 오른쪽으로 옮겨서, 나누는 수를 자연수로 만든 다음 나눠요.',
    '1보다 작은 수로 나누면 몫이 원래 수보다 커져요.'
  ] }
]);
