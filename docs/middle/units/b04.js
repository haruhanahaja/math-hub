/* B04 정수와 유리수의 곱셈·나눗셈 — 부호 규칙, 거듭제곱, 사칙 혼합 계산
   유형(쉬운 것부터): B04.mul 두 수의 곱셈 · B04.div 두 수의 나눗셈 · B04.frac 분수의 곱셈과 나눗셈
                     · B04.pow 거듭제곱 · B04.mixed 사칙 혼합 계산
   정수 · 소수는 10^p 배 한 정수(부호 포함)로 다룬다. 답 형식은 signed, 분수는 rational.
   힌트에는 계산한 중간 값을 쓰지 않는다(답이 드러난다). 개수는 숫자 대신 낱말(한 · 두 · 세)로 쓴다. */
(function () {
  'use strict';
  var MH = globalThis.MH, pick = MH.pick, josa = MH.josa, F = MH.F;
  var abs = Math.abs;
  /** 부호가 있는 소수 값(끝의 0 은 덜어 낸다) */
  var S = function (n, p) { var d = MH.dec(abs(n), p || 0); return { n: n < 0 ? -d.n : d.n, p: d.p }; };
  var D = function (n, p) { return MH.decStr(abs(n), p || 0); };
  var str = function (n, p, plus) { return (n < 0 ? '−' : n > 0 && plus ? '+' : '') + D(n, p); };
  var stex = function (n, p, plus) { return str(n, p, plus).replace('−', '-'); };
  var par = function (n, p) { return '(' + stex(n, p, true) + ')'; };
  var parT = function (n, p) { return '(' + str(n, p, true) + ')'; };
  /** 괄호에 넣은 수 뒤에 조사를 붙인다: pj(-4, 0, '을/를') → '(−4)를' */
  var pj = function (n, p, pair) { var w = str(n, p, true); return '(' + w + ')' + josa(w, pair).slice(w.length); };
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var CNT = ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
  var SIGNS = [[-1, 1], [1, -1], [-1, -1]];                 /* 두 수가 모두 양수인 문제는 내지 않는다 */
  var mark = function (n) { return n < 0 ? '−' : '+'; };
  /** 이 문제의 두 수는 부호가 같은가 다른가 */
  var signLine = function (a, pa, b, pb) { return '이 문제는 ' + pj(a, pa, '과/와') + ' ' + pj(b, pb, '이라서/라서') + ' 부호가 ' + (a * b > 0 ? '같아요' : '달라요') + '.'; };
  var signStep = function (a, b, what) { return '두 수의 부호가 ' + (a * b > 0 ? '같아요. ' + what + '의 부호는 +예요.' : '달라요. ' + what + '의 부호는 −예요.'); };
  var signedAnswer = { kind: 'signed', decimal: true };

  /* ── B04.mul 두 수의 곱셈 ──────────────────────────────
     v.m = { x, pa, y, pb }: 앞의 수 x ÷ 10^pa, 뒤의 수 y ÷ 10^pb (부호는 v.s) */
  var mA = function (v) { return v.s[0] * v.m.x; }, mB = function (v) { return v.s[1] * v.m.y; };
  MH.defineType({
    id: 'B04.mul', unit: 'B04', version: 1, title: '두 수의 곱셈',
    answer: signedAnswer,
    levels: [
      { name: '한 자리 수', minDistinct: 150, vars: { s: pick(SIGNS), m: sampler(function (r) { return { x: r.int(1, 9), pa: 0, y: r.int(1, 9), pb: 0 }; }) } },
      { name: '두 자리 수 × 한 자리 수', vars: { s: pick(SIGNS), m: sampler(function (r) {
          var big = r.int(11, 40), small = r.int(2, 9);
          return r.int(0, 1) ? { x: big, pa: 0, y: small, pb: 0 } : { x: small, pa: 0, y: big, pb: 0 };
        }) } },
      { name: '소수', vars: { s: pick(SIGNS), m: sampler(function (r) {
          var d; do { d = r.int(2, 99); } while (d % 10 === 0);
          var o = r.int(0, 1) ? { n: r.int(2, 9), p: 0 } : { n: r.int(1, 9), p: 1 };
          return r.int(0, 1) ? { x: d, pa: 1, y: o.n, pb: o.p } : { x: o.n, pa: o.p, y: d, pb: 1 };
        }) } }
    ],
    prompt: function (v) { return { tex: par(mA(v), v.m.pa) + ' \\times ' + par(mB(v), v.m.pb), text: '계산하세요.' }; },
    solve: function (v) { return S(mA(v) * mB(v), v.m.pa + v.m.pb); },
    /* 검산: 정확한 분수로 곱해 본다 */
    verify: function (v, ans) { return F(mA(v), MH.pow10(v.m.pa)).mul(F(mB(v), MH.pow10(v.m.pb))).equals(F(ans.n, MH.pow10(ans.p))); },
    hints: function (v) {
      var a = mA(v), b = mB(v), m = v.m, X = D(a, m.pa), Y = D(b, m.pb), p = m.pa + m.pb, how;
      var big = Math.max(m.x, m.y), small = Math.min(m.x, m.y);
      if (p) how = X + ' × ' + josa(Y, '은/는') + ' 소수점이 없다고 보고 ' + m.x + ' × ' + josa(m.y, '을/를') + ' 계산한 다음, 소수점 아래가 ' + CNT[p] + ' 자리가 되게 점을 찍어요.';
      else if (big > 9 && big % 10) how = X + ' × ' + josa(Y, '은/는') + ' 큰 수를 쪼개면 쉬워요. ' + (big - big % 10) + ' × ' + josa(small, '과/와') + ' ' + (big % 10) + ' × ' + josa(small, '을/를') + ' 따로 계산해서 더해요.';
      else if (big > 9) how = X + ' × ' + josa(Y, '은/는') + ' 0을 잠깐 떼고 곱한 다음 0을 다시 붙여요.';
      else how = X + ' × ' + josa(Y, '은/는') + ' 곱셈구구예요.';
      return [
        a * b > 0 ? '부호부터 생각해 봐요. −는 "반대로 뒤집기"예요. 빚(−)이 생기는 것을 다시 뒤집으면, 곧 빚을 없애 주면 이익(+)이 되죠. 그래서 −가 두 번 겹친 음수 × 음수는 양수예요.'
          : '부호부터 생각해 봐요. 곱셈은 같은 수를 여러 번 더하는 것이에요. 빚(−)을 여러 번 더하면 더 큰 빚이 돼요. 그래서 양수와 음수를 곱하면 음수예요. 곱하는 순서를 바꿔도 답은 같아요.',
        '차례는 두 가지예요. ① 부호를 먼저 정해요: 두 수의 부호가 같으면 +, 다르면 −. ' + signLine(a, m.pa, b, m.pb) + ' ② 부호를 떼고 숫자끼리 곱해요: ' + X + ' × ' + Y + '.',
        how + ' 답은 그 숫자 앞에 부호 ' + mark(a * b) + '를 붙인 수예요' + (a * b > 0 ? '(+는 쓰지 않아도 돼요).' : '.')
      ];
    },
    steps: function (v) {
      var a = mA(v), b = mB(v), m = v.m, ans = S(a * b, m.pa + m.pb);
      return [
        { say: signStep(a, b, '곱') },
        { say: '부호를 떼고 숫자끼리 곱해요.', tex: D(a, m.pa) + ' \\times ' + D(b, m.pb) + ' = ' + D(ans.n, ans.p) },
        { say: '부호 ' + mark(a * b) + '를 붙여요. 답은 ' + josa(str(ans.n, ans.p), '이에요/예요') + '.', tex: par(a, m.pa) + ' \\times ' + par(b, m.pb) + ' = ' + stex(ans.n, ans.p), value: ans }
      ];
    },
    /* ① 숫자는 맞는데 부호가 반대 ② 곱하지 않고 더함 */
    mistakes: [
      { id: 'wrong-sign', wrong: function (v) { return S(-mA(v) * mB(v), v.m.pa + v.m.pb); },
        explain: function (v) { return '숫자는 맞았어요. 그런데 부호가 반대예요. 두 수의 부호가 ' + (mA(v) * mB(v) > 0 ? '같으니 답은 양수예요(음수 × 음수 = 양수).' : '다르니 답은 음수예요.'); } },
      { id: 'added', wrong: function (v) {
          var a = mA(v), b = mB(v), m = v.m;
          if (m.pa !== m.pb) return null;
          var sum = (a + b) * MH.pow10(m.pa);
          return sum === a * b || sum === -a * b ? null : S(a + b, m.pa);
        },
        explain: function (v) { return '두 수를 더했어요. 이 문제는 곱셈(×)이에요. 부호를 정한 다음 ' + D(mA(v), v.m.pa) + ' × ' + josa(D(mB(v), v.m.pb), '을/를') + ' 계산해요.'; } }
    ]
  });

  /* ── B04.div 두 수의 나눗셈 ────────────────────────────
     v.m = { x, px, y, q, pq }: (x ÷ 10^px) ÷ y = q ÷ 10^pq. 나누는 수 y 는 정수 */
  var dA = function (v) { return v.s[0] * v.m.x; }, dB = function (v) { return v.s[1] * v.m.y; };
  var dAns = function (v) { return S(v.s[0] * v.s[1] * v.m.q, v.m.pq); };
  MH.defineType({
    id: 'B04.div', unit: 'B04', version: 1, title: '두 수의 나눗셈',
    answer: signedAnswer,
    levels: [
      { name: '곱셈구구 범위', minDistinct: 150, vars: { s: pick(SIGNS), m: sampler(function (r) { var y = r.int(2, 9), q = r.int(1, 9); return { x: y * q, px: 0, y: y, q: q, pq: 0 }; }) } },
      { name: '몫이 두 자리 수', vars: { s: pick(SIGNS), m: sampler(function (r) { var y = r.int(2, 9), q = r.int(11, 40); return { x: y * q, px: 0, y: y, q: q, pq: 0 }; }) } },
      { name: '소수', vars: { s: pick(SIGNS), m: sampler(function (r) {
          var q; do { q = r.int(1, 99); } while (q % 10 === 0);
          var y = r.int(2, 9);
          return { x: y * q, px: 1, y: y, q: q, pq: 1 };
        }) } }
    ],
    prompt: function (v) { return { tex: par(dA(v), v.m.px) + ' \\div ' + par(dB(v), 0), text: '계산하세요.' }; },
    solve: dAns,
    /* 검산: 몫에 나누는 수를 곱하면 나누어지는 수 */
    verify: function (v, ans) { return ans.n * dB(v) * MH.pow10(v.m.px) === dA(v) * MH.pow10(ans.p); },
    hints: function (v) {
      var a = dA(v), b = dB(v), m = v.m, X = D(a, m.px), Y = D(b, 0);
      return [
        '나눗셈은 곱셈을 거꾸로 한 것이에요. ' + parT(a, m.px) + ' ÷ ' + pj(b, 0, '은/는') + ' "' + parT(b, 0) + '에 어떤 수를 곱하면 ' + pj(a, m.px, '이/가') + ' 될까?"를 찾는 것이에요. 그래서 부호 규칙도 곱셈과 똑같아요.',
        '차례는 두 가지예요. ① 부호를 먼저 정해요: 두 수의 부호가 같으면 +, 다르면 −. ' + signLine(a, m.px, b, 0) + ' ② 부호를 떼고 숫자끼리 나눠요: ' + X + ' ÷ ' + Y + '.',
        (m.pq ? X + ' ÷ ' + josa(Y, '은/는') + ' 자연수의 나눗셈처럼 높은 자리부터 나누고, 몫의 소수점은 나누어지는 수 ' + X + '의 소수점과 같은 자리에 찍어요. 나눌 수 없는 자리에는 0을 써요.'
          : m.q > 9 ? X + ' ÷ ' + josa(Y, '은/는') + ' 높은 자리부터 차례로 나눠요. 윗자리에서 남은 수는 다음 자리의 숫자와 붙여서 이어 나눠요.'
            : X + ' ÷ ' + josa(Y, '은/는') + ' ' + Y + '단 곱셈구구에서 찾아요: ' + Y + ' × □ = ' + X + '.')
          + ' 답은 그 숫자 앞에 부호 ' + mark(a * b) + '를 붙인 수예요' + (a * b > 0 ? '(+는 쓰지 않아도 돼요).' : '.')
      ];
    },
    steps: function (v) {
      var a = dA(v), b = dB(v), m = v.m, ans = dAns(v);
      return [
        { say: signStep(a, b, '몫') },
        { say: '부호를 떼고 숫자끼리 나눠요.', tex: D(a, m.px) + ' \\div ' + D(b, 0) + ' = ' + D(ans.n, ans.p) },
        { say: '부호 ' + mark(a * b) + '를 붙여요. 답은 ' + josa(str(ans.n, ans.p), '이에요/예요') + '.', tex: par(a, m.px) + ' \\div ' + par(b, 0) + ' = ' + stex(ans.n, ans.p), value: ans }
      ];
    },
    /* ① 숫자는 맞는데 부호가 반대 ② 몫의 소수점을 빠뜨림 */
    mistakes: [
      { id: 'wrong-sign', wrong: function (v) { var x = dAns(v); return { n: -x.n, p: x.p }; },
        explain: function (v) { return '숫자는 맞았어요. 그런데 부호가 반대예요. 나눗셈도 곱셈처럼, 두 수의 부호가 ' + (dA(v) * dB(v) > 0 ? '같으니 답은 양수예요.' : '다르니 답은 음수예요.'); } },
      { id: 'point', wrong: function (v) { return v.m.pq ? S(v.s[0] * v.s[1] * v.m.q, 0) : null; },
        explain: function (v) { return '몫의 소수점을 빠뜨렸어요. 나누어지는 수 ' + D(dA(v), v.m.px) + '의 소수점과 같은 자리에 몫의 소수점을 찍어요.'; } }
    ]
  });

  /* ── B04.frac 분수의 곱셈과 나눗셈 ─────────────────────
     v.q = { t: [[분자(부호 포함), 분모], …], ops: ['×' | '÷', …] }. 분모가 1 이면 정수 */
  var ftex = function (n, d) { return (n < 0 ? '-' : '') + '\\dfrac{' + abs(n) + '}{' + d + '}'; };
  var termTex = function (x, small) {
    if (x[1] === 1) return par(x[0], 0);
    var s = '\\left(' + (x[0] > 0 ? '+' : '') + ftex(x[0], x[1]) + '\\right)';
    return small ? s.replace('dfrac', 'frac') : s;
  };
  var bare = function (x) { return x[1] === 1 ? String(abs(x[0])) : '\\frac{' + abs(x[0]) + '}{' + x[1] + '}'; };
  var chainTex = function (list, ops, small) { return list.map(function (x, i) { return (i ? (ops[i - 1] === '÷' ? '\\div ' : '\\times ') : '') + termTex(x, small); }).join(' '); };
  /** 나눗셈을 모두 곱셈으로 바꾼 수들(나누는 수는 역수로. 부호는 그대로) */
  var asProduct = function (q) { return q.t.map(function (x, i) { return i && q.ops[i - 1] === '÷' ? [(x[0] < 0 ? -1 : 1) * x[1], abs(x[0])] : x; }); };
  var times = function (list) { return list.map(function () { return '×'; }); };
  var product = function (list) {
    var n = 1, d = 1;
    list.forEach(function (x) { n *= x[0]; d *= x[1]; });
    var f = F(n, d);
    return { n: Number(f.s) * Number(f.n), d: Number(f.d), rawN: abs(n), rawD: d };
  };
  var negatives = function (list) { return list.filter(function (x) { return x[0] < 0; }).length; };
  var oneFrac = function (r) { var d, n; do { d = r.int(2, 9); n = r.int(1, 9); } while (n === d || MH.gcd(n, d) > 1); return [r.pick([-1, 1]) * n, d]; };
  var fracOk = function (v) {
    var ans = product(asProduct(v.q));
    return negatives(v.q.t) >= 1 && ans.d > 1 && abs(ans.n) <= 60 && ans.d <= 60;
  };
  MH.defineType({
    id: 'B04.frac', unit: 'B04', version: 1, title: '분수의 곱셈과 나눗셈',
    answer: { kind: 'rational' },
    levels: [
      { name: '곱셈', vars: { q: sampler(function (r) { return { t: [oneFrac(r), oneFrac(r)], ops: ['×'] }; }) }, where: fracOk },
      { name: '나눗셈', vars: { q: sampler(function (r) { return { t: [oneFrac(r), oneFrac(r)], ops: ['÷'] }; }) }, where: fracOk },
      { name: '세 수의 곱셈과 나눗셈', vars: { q: sampler(function (r) {
          var t = [oneFrac(r), oneFrac(r), oneFrac(r)];
          if (r.int(0, 1)) t[r.int(0, 2)] = [r.pick([-1, 1]) * r.int(2, 6), 1];
          return { t: t, ops: r.pick([['×', '÷'], ['÷', '×'], ['÷', '÷']]) };
        }) }, where: fracOk }
    ],
    prompt: function (v) { return { tex: chainTex(v.q.t, v.q.ops), text: '계산하세요.' }; },
    solve: function (v) { var a = product(asProduct(v.q)); return { n: a.n, d: a.d }; },
    /* 검산: 답에서 거꾸로 되짚어 가면 맨 앞의 수 */
    verify: function (v, ans) {
      var q = v.q, x = F(ans.n, ans.d);
      for (var i = q.t.length - 1; i >= 1; i--) x = q.ops[i - 1] === '×' ? x.div(F(q.t[i][0], q.t[i][1])) : x.mul(F(q.t[i][0], q.t[i][1]));
      return x.equals(F(q.t[0][0], q.t[0][1])) && MH.gcd(ans.n, ans.d) === 1;
    },
    hints: function (v) {
      var q = v.q, list = asProduct(q), k = negatives(list), out = [], cancel = '';
      if (q.ops.indexOf('÷') >= 0) out.push('나눗셈은 곱셈으로 바꿔요. ÷를 ×로 바꾸고, ÷ 바로 뒤의 수는 분자와 분모를 뒤집어 역수로 써요(정수는 분모가 1인 분수로 보고 뒤집어요). 이때 부호는 바꾸지 않아요. 부호를 바꾸는 것은 뺄셈을 덧셈으로 고칠 때뿐이에요: $' + chainTex(list, times(list), true) + '$');
      out.push('부호를 먼저 정해요. 곱하는 수 가운데 음수가 짝수 개이면 +, 홀수 개이면 −예요(음수 둘이 만나면 +가 되니까요). 이 식에는 음수가 ' + CNT[k] + ' 개 있어요.');
      list.some(function (x) { return list.some(function (y) { var g = MH.gcd(x[0], y[1]); if (g > 1) cancel = ' 예를 들어 분자 ' + josa(abs(x[0]), '과/와') + ' 분모 ' + josa(y[1], '은/는') + ' 둘 다 ' + josa(g, '으로/로') + ' 나눌 수 있어요.'; return g > 1; }); });
      out.push('이제 부호를 떼고 분자는 분자끼리, 분모는 분모끼리 곱해요: $' + list.map(bare).join(' \\times ') + '$. 곱하기 전에 분자 하나와 분모 하나를 같은 수로 나눌 수 있으면 먼저 약분해요.' + cancel);
      out.push('계산한 분수 앞에, 앞에서 정한 부호를 붙이면 답이에요. 답이 음수이면 − 키를 누르고, 분자와 분모를 칸에 따로 써요. 더 약분할 수 있는지도 확인해요.');
      return out;
    },
    steps: function (v) {
      var q = v.q, list = asProduct(q), ans = product(list), k = negatives(list), out = [], neg = k % 2 === 1;
      if (q.ops.indexOf('÷') >= 0) out.push({ say: '나눗셈을 곱셈으로 바꿔요. ÷ 뒤의 수를 역수로 써요(부호는 그대로).', tex: chainTex(list, times(list)) });
      out.push({ say: '음수가 ' + CNT[k] + ' 개(' + (neg ? '홀수' : '짝수') + ' 개)라서 답의 부호는 ' + (neg ? '−' : '+') + '예요.' });
      var nums = list.map(function (x) { return abs(x[0]); }), dens = list.map(function (x) { return x[1]; }).filter(function (d) { return d > 1; });
      out.push({ say: '부호를 떼고 분자끼리, 분모끼리 곱해요.' + (ans.rawD !== ans.d ? ' 분자와 분모를 ' + josa(ans.rawD / ans.d, '으로/로') + ' 나누어 약분해요.' : ''),
        tex: '\\dfrac{' + nums.join(' \\times ') + '}{' + dens.join(' \\times ') + '} = \\dfrac{' + ans.rawN + '}{' + ans.rawD + '}' + (ans.rawD !== ans.d ? ' = \\dfrac{' + abs(ans.n) + '}{' + ans.d + '}' : '') });
      out.push({ say: '부호 ' + (neg ? '−' : '+') + '를 붙이면 답이에요.', tex: ftex(ans.n, ans.d), value: { n: ans.n, d: ans.d } });
      return out;
    },
    /* ① 숫자는 맞는데 부호가 반대 ② 나누는 수를 역수로 바꾸지 않고 그대로 곱함 */
    mistakes: [
      { id: 'wrong-sign', wrong: function (v) { var a = product(asProduct(v.q)); return { n: -a.n, d: a.d }; },
        explain: function (v) { var k = negatives(v.q.t); return '숫자는 맞았어요. 그런데 부호가 반대예요. 음수가 ' + CNT[k] + ' 개(' + (k % 2 ? '홀수' : '짝수') + ' 개)라서 답은 ' + (k % 2 ? '음수' : '양수') + '예요. 역수로 바꿀 때 부호는 바꾸지 않아요.'; } },
      { id: 'not-flipped', wrong: function (v) {
          var q = v.q, a = product(asProduct(q)), w = product(q.t);
          return q.ops.indexOf('÷') < 0 || w.n * a.d === a.n * w.d || w.n * a.d === -a.n * w.d ? null : { n: w.n, d: w.d };
        },
        explain: function () { return '나누는 수를 뒤집지 않고 그대로 곱했어요. ÷를 ×로 바꿀 때는 ÷ 바로 뒤의 수의 분자와 분모를 뒤집어 역수로 써야 해요.'; } }
    ]
  });

  /* ── B04.pow 거듭제곱 ──────────────────────────────────
     v.q = { f: [인수 …] } — 인수가 둘이면 곱한다. 인수 { k, a, n }:
       in (−a)^n · out −a^n · negin −(−a)^n · pos a^n · num 정수 a(부호 포함, n 없음) */
  var fTex = function (f) {
    return f.k === 'in' ? '(-' + f.a + ')^{' + f.n + '}' : f.k === 'out' ? '-' + f.a + '^{' + f.n + '}' : f.k === 'negin' ? '-(-' + f.a + ')^{' + f.n + '}'
      : f.k === 'pos' ? f.a + '^{' + f.n + '}' : par(f.a, 0);
  };
  var rep = function (item, n) { var out = []; for (var i = 0; i < n; i++) out.push(item); return out.join(' \\times '); };
  /** 거듭제곱을 곱셈으로 풀어 쓴 모습 */
  var spread = function (f) {
    return f.k === 'in' ? rep('(-' + f.a + ')', f.n) : f.k === 'out' ? '-(' + rep(f.a, f.n) + ')' : f.k === 'negin' ? '-\\{' + rep('(-' + f.a + ')', f.n) + '\\}' : rep(f.a, f.n);
  };
  var powOf = function (a, n) { var x = 1; for (var i = 0; i < n; i++) x *= a; return x; };
  var fValue = function (f) {
    return f.k === 'in' ? powOf(-f.a, f.n) : f.k === 'out' ? -powOf(f.a, f.n) : f.k === 'negin' ? -powOf(-f.a, f.n) : f.k === 'pos' ? powOf(f.a, f.n) : f.a;
  };
  var powValue = function (q) { return q.f.reduce(function (x, f) { return x * fValue(f); }, 1); };
  /** 괄호를 거꾸로 읽었을 때: (−a)^n ↔ −a^n */
  var mixedUp = function (q) { return q.f.reduce(function (x, f) { return x * fValue(f.k === 'in' ? { k: 'out', a: f.a, n: f.n } : f.k === 'out' ? { k: 'in', a: f.a, n: f.n } : f); }, 1); };
  var PAIRS = (function () {
    var out = [], a, n;
    for (a = 1; a <= 10; a++) for (n = 2; n <= 9; n++) if (powOf(a, n) <= 130 && (a > 1 || n <= 7)) out.push([a, n]);
    return out;
  })();
  var SMALL = PAIRS.filter(function (x) { return powOf(x[0], x[1]) <= 32; });
  /** 이 거듭제곱에서 무엇을 몇 번 곱하는가 / 그래서 부호가 어떻게 되는가 */
  var whatOf = function (f) {
    var times = CNT[f.n] + ' 번';
    return f.k === 'in' ? '괄호가 있으니 −까지 포함한 ' + pj(-f.a, 0, '을/를') + ' ' + times + ' 곱해요.'
      : f.k === 'out' ? '괄호가 없으니 ' + f.a + '만 ' + times + ' 곱하고, 그 앞에 −를 붙여요.'
        : f.k === 'negin' ? '먼저 ' + pj(-f.a, 0, '을/를') + ' ' + times + ' 곱한 다음, 맨 앞의 −로 그 부호를 한 번 더 뒤집어요.'
          : josa(f.a, '을/를') + ' ' + times + ' 곱한 양수예요.';
  };
  var signOf = function (f) {
    var times = CNT[f.n] + ' 번(' + (f.n % 2 ? '홀수' : '짝수') + ' 번)';
    return f.k === 'in' ? '음수를 ' + times + ' 곱하니 부호는 ' + (f.n % 2 ? '−' : '+') + '예요.'
      : f.k === 'out' ? (f.n % 2 ? '그래서 답은 음수예요.' : '지수가 짝수여도 −는 곱하지 않았으니 답은 음수예요.')
        : f.k === 'negin' ? '음수를 ' + times + ' 곱하면 부호가 ' + (f.n % 2 ? '−' : '+') + '이고, 그것을 뒤집으니 ' + (f.n % 2 ? '+' : '−') + '예요.' : '';
  };
  var why = function (f) { return f.k === 'num' ? '' : ('$' + fTex(f) + '$은 ' + whatOf(f) + ' ' + signOf(f)).trim(); };
  MH.defineType({
    id: 'B04.pow', unit: 'B04', version: 1, title: '음수의 거듭제곱',
    answer: { kind: 'signed' },
    levels: [
      { name: '(음수)의 거듭제곱', minDistinct: 20, vars: { q: sampler(function (r) { var x = r.pick(PAIRS); return { f: [{ k: 'in', a: x[0], n: x[1] }] }; }) } },
      { name: '괄호가 있을 때와 없을 때', minDistinct: 60, vars: { q: sampler(function (r) { var x = r.pick(PAIRS); return { f: [{ k: r.pick(['in', 'out', 'out', 'negin']), a: x[0], n: x[1] }] }; }) } },
      { name: '거듭제곱의 곱', minDistinct: 200, vars: { q: sampler(function (r) {
          var x = r.pick(SMALL), y = r.pick(SMALL), k = r.pick(['in', 'in', 'pos', 'num']);
          return { f: [{ k: r.pick(['in', 'out', 'negin']), a: x[0], n: x[1] }, k === 'num' ? { k: 'num', a: r.pick([-1, 1]) * r.int(2, 9) } : { k: k, a: y[0], n: y[1] }] };
        }) }, where: function (v) { return abs(powValue(v.q)) <= 400; } }
    ],
    prompt: function (v) { return { tex: v.q.f.map(fTex).join(' \\times '), text: '계산하세요.' }; },
    solve: function (v) { return S(powValue(v.q), 0); },
    /* 검산: 풀어 쓴 곱셈을 하나씩 곱해 본다(부호는 음수의 개수로 따로 센다) */
    verify: function (v, ans) {
      var size = 1, negs = 0;
      v.q.f.forEach(function (f) {
        if (f.k === 'num') { size *= abs(f.a); if (f.a < 0) negs++; return; }
        for (var i = 0; i < f.n; i++) size *= f.a;
        if (f.k === 'in' || f.k === 'negin') negs += f.n;
        if (f.k === 'out' || f.k === 'negin') negs++;
      });
      return ans.p === 0 && ans.n === (negs % 2 ? -size : size);
    },
    hints: function (v) {
      var fs = v.q.f, pows = fs.filter(function (f) { return f.k !== 'num'; });
      return [
        '거듭제곱은 같은 수를 여러 번 곱하는 것이고, 위에 작게 쓴 지수가 곱하는 횟수예요. 무엇을 여러 번 곱하는지는 괄호가 정해요. 괄호가 있으면 괄호 안 전체(−까지)를 여러 번 곱하고, 괄호가 없으면 숫자만 여러 번 곱한 뒤 앞의 −를 붙여요.',
        '풀어 쓰면 이래요. ' + pows.map(function (f) { return '$' + fTex(f) + ' = ' + spread(f) + '$'; }).join(', ') + '. 음수를 짝수 번 곱하면 +, 홀수 번 곱하면 −가 돼요.',
        pows.map(why).join(' ') + (fs.length > 1 ? ' 두 값을 따로 구한 다음 곱해요. 곱할 때는 부호가 같으면 +, 다르면 −예요.' : ' 숫자는 ' + josa(fs[0].a, '을/를') + ' ' + CNT[fs[0].n] + ' 번 곱한 값이에요.')
      ];
    },
    steps: function (v) {
      var fs = v.q.f, total = powValue(v.q), out = [];
      fs.forEach(function (f) {
        if (f.k === 'num') return;
        if (fs.length === 1) out.push({ say: '거듭제곱을 곱셈으로 풀어 써요. ' + whatOf(f), tex: fTex(f) + ' = ' + spread(f) });
        else out.push({ say: (whatOf(f) + ' ' + signOf(f)).trim(), tex: fTex(f) + ' = ' + spread(f) + ' = ' + stex(fValue(f), 0) });
      });
      if (fs.length === 1) out.push({ say: (signOf(fs[0]) + ' 답은 ' + josa(str(total, 0), '이에요/예요') + '.').trim(), tex: spread(fs[0]) + ' = ' + stex(total, 0), value: S(total, 0) });
      else out.push({ say: '두 값을 곱해요. ' + signStep(fValue(fs[0]), fValue(fs[1]), '곱'), tex: par(fValue(fs[0]), 0) + ' \\times ' + par(fValue(fs[1]), 0) + ' = ' + stex(total, 0), value: S(total, 0) });
      return out;
    },
    /* ① 괄호를 거꾸로 읽음((−a)^n ↔ −a^n) ② 밑과 지수를 곱함 ③ 숫자는 맞는데 부호가 반대 */
    mistakes: [
      { id: 'paren-mixup', wrong: function (v) { var w = mixedUp(v.q); return w === powValue(v.q) ? null : S(w, 0); },
        explain: function (v) { return '괄호를 거꾸로 읽었어요. ' + v.q.f.filter(function (f) { return f.k === 'in' || f.k === 'out'; }).map(why).join(' '); } },
      { id: 'times', wrong: function (v) {
          var f = v.q.f[0], ans = powValue(v.q);
          return v.q.f.length > 1 || f.a * f.n === abs(ans) ? null : S((ans < 0 ? -1 : 1) * f.a * f.n, 0);
        },
        explain: function (v) { var f = v.q.f[0]; return '밑과 지수를 곱했어요(' + f.a + ' × ' + f.n + '). 지수 ' + josa(f.n, '은/는') + ' 곱하는 횟수예요. ' + josa(f.a, '을/를') + ' ' + CNT[f.n] + ' 번 곱해야 해요: $' + rep(f.a, f.n) + '$.'; } },
      { id: 'wrong-sign', wrong: function (v) { var ans = powValue(v.q); return mixedUp(v.q) === -ans ? null : S(-ans, 0); },
        explain: function (v) { return '숫자는 맞았어요. 그런데 부호가 반대예요. ' + v.q.f.filter(function (f) { return f.k !== 'num'; }).map(why).join(' '); } }
    ]
  });

  /* ── B04.mixed 사칙 혼합 계산 ──────────────────────────
     v.q = { terms: [항 …] } — 항들을 + − 로 잇는다. 항 { sg: 1 | −1(앞의 기호. 맨 앞 항의 −1 은 맨 앞에 쓴 −), f: [인수 …], ops: ['×' | '÷'] }
     인수: { n: 정수 } · { pow: [밑(부호 포함), 지수] } · { sum: [x, '+' | '-', y] }(괄호 묶음. y 는 양수) */
  var gTex = function (f) {
    if (f.pow) return (f.pow[0] < 0 ? '(' + f.pow[0] + ')' : f.pow[0]) + '^{' + f.pow[1] + '}';
    if (f.sum) return '(' + f.sum[0] + ' ' + f.sum[1] + ' ' + f.sum[2] + ')';
    return f.n < 0 ? '(' + f.n + ')' : String(f.n);
  };
  var gVal = function (f) { return f.pow ? powOf(f.pow[0], f.pow[1]) : f.sum ? (f.sum[1] === '+' ? f.sum[0] + f.sum[2] : f.sum[0] - f.sum[2]) : f.n; };
  var tTex = function (t) { return t.f.map(function (f, i) { return (i ? (t.ops[i - 1] === '÷' ? ' \\div ' : ' \\times ') : '') + gTex(f); }).join(''); };
  var tVal = function (t) { var x = gVal(t.f[0]); for (var i = 1; i < t.f.length; i++) x = t.ops[i - 1] === '×' ? x * gVal(t.f[i]) : x / gVal(t.f[i]); return x; };
  var eTex = function (q) { return q.terms.map(function (t, i) { return (i ? (t.sg < 0 ? ' - ' : ' + ') : t.sg < 0 ? '-' : '') + tTex(t); }).join(''); };
  var eVal = function (q) { return q.terms.reduce(function (s, t) { return s + t.sg * tVal(t); }, 0); };
  var factors = function (q, key) { var out = []; q.terms.forEach(function (t) { t.f.forEach(function (f) { if (f[key]) out.push(f); }); }); return out; };
  var plain = function (q) { return { terms: q.terms.map(function (t) { return { sg: t.sg, ops: t.ops, f: t.f.map(function (f) { return { n: gVal(f) }; }) }; }) }; };
  /* 식 만들기 */
  var sn = function (r, lo, hi) { return r.pick([-1, 1]) * r.int(lo, hi); };
  var mkNum = function (r) { return { f: [{ n: sn(r, 1, 12) }], ops: [] }; };
  var mkProd = function (r) {
    if (r.int(0, 1)) return { f: [{ n: sn(r, 2, 9) }, { n: sn(r, 2, 9) }], ops: ['×'] };
    var d = sn(r, 2, 9);
    return { f: [{ n: d * sn(r, 1, 9) }, { n: d }], ops: ['÷'] };
  };
  var mkSum = function (r) { return { sum: [sn(r, 1, 9), r.pick(['+', '-']), r.int(1, 9)] }; };
  var mkGroup = function (r) {
    var g = mkSum(r), k = sn(r, 2, 6), way = r.int(0, 2);
    return way === 0 ? { f: [g, { n: k }], ops: ['×'] } : way === 1 ? { f: [{ n: k }, g], ops: ['×'] } : { f: [{ n: gVal(g) * k }, g], ops: ['÷'] };
  };
  var mkPow = function (r, base) {
    var b = base || r.pick([-1, -2, -2, -3, -3, -4, -5]), e = abs(b) === 2 ? r.int(2, 4) : abs(b) === 3 ? r.int(2, 3) : abs(b) === 1 ? r.int(2, 7) : 2, p = { pow: [b, e] }, way = r.int(0, 2);
    return way === 0 ? { f: [p, { n: sn(r, 2, 6) }], ops: ['×'] } : way === 1 && abs(b) > 1 ? { f: [p, { n: r.pick([-1, 1]) * abs(b) }], ops: ['÷'] } : { f: [p], ops: [] };
  };
  var expr = function (make) {
    return sampler(function (r) {
      var terms = make(r);
      terms.forEach(function (t, i) { if (t.sg === undefined) t.sg = i ? r.pick([-1, 1]) : 1; });
      return { terms: terms };
    });
  };
  var exprOk = function (v) {
    var q = v.q, fine = true, neg = q.terms[0].sg < 0;
    q.terms.forEach(function (t) {
      var x = gVal(t.f[0]);
      t.f.forEach(function (f, i) {
        var y = gVal(f);
        if (y === 0 || (f.sum && abs(y) === 1)) fine = false;
        if ((f.n !== undefined && f.n < 0) || (f.pow && f.pow[0] < 0) || (f.sum && (f.sum[0] < 0 || y < 0))) neg = true;
        if (i) { if (t.ops[i - 1] === '÷' && x % y !== 0) fine = false; x = t.ops[i - 1] === '×' ? x * y : x / y; }
      });
      if (abs(x) > 150) fine = false;
    });
    return fine && neg && abs(eVal(q)) <= 150;
  };
  /** 순서를 무시하고 앞에서부터 차례로 계산한 값: a ± b × c 를 (a ± b) × c 로 */
  var leftToRight = function (q) {
    var t = q.terms;
    if (t.length !== 2 || t[0].f.length !== 1 || t[0].f[0].n === undefined || t[1].f.length !== 2 || t[1].f[0].n === undefined || t[1].f[1].n === undefined) return null;
    var x = t[0].f[0].n + t[1].sg * t[1].f[0].n, c = t[1].f[1].n;
    if (t[1].ops[0] === '÷' && x % c !== 0) return null;
    x = t[1].ops[0] === '×' ? x * c : x / c;
    return x === eVal(q) ? null : x;
  };
  /** 거듭제곱의 괄호를 거꾸로 읽은 값: (−a)^n 을 −a^n 으로, 맨 앞의 −a^n 을 (−a)^n 으로 */
  var powMixup = function (q) {
    var hit = false, total = 0;
    q.terms.forEach(function (t, i) {
      var x = tVal(t) * t.sg;
      t.f.forEach(function (f, j) {
        if (f.pow && f.pow[1] % 2 === 0 && (f.pow[0] < 0 || (i === 0 && j === 0 && t.sg < 0))) { x = -x; hit = true; }
      });
      total += x;
    });
    return hit && total !== eVal(q) ? total : null;
  };
  MH.defineType({
    id: 'B04.mixed', unit: 'B04', version: 1, title: '사칙 혼합 계산',
    answer: { kind: 'signed' },
    levels: [
      { name: '곱셈 · 나눗셈 먼저', vars: { q: expr(function (r) { return r.int(0, 1) ? [mkNum(r), mkProd(r)] : [mkProd(r), mkNum(r)]; }) }, where: exprOk },
      { name: '괄호가 있는 식', vars: { q: expr(function (r) { var w = r.int(0, 2); return w === 0 ? [mkGroup(r), mkNum(r)] : w === 1 ? [mkNum(r), mkGroup(r)] : [mkGroup(r), mkProd(r)]; }) }, where: exprOk },
      { name: '거듭제곱이 있는 식', vars: { q: expr(function (r) {
          var w = r.int(0, 3), lead;
          if (w === 0) return [mkPow(r), mkProd(r)];
          if (w === 1) return [mkProd(r), mkPow(r)];
          if (w === 2) return [mkPow(r), mkGroup(r)];
          lead = mkPow(r, r.int(2, 5)); lead.sg = -1;                 /* 맨 앞에 −를 쓴 −a^n */
          return [lead, mkProd(r)];
        }) }, where: exprOk }
    ],
    prompt: function (v) { return { tex: eTex(v.q), text: '계산하세요.' }; },
    solve: function (v) { return S(eVal(v.q), 0); },
    /* 검산: 항마다 정확한 분수로 다시 계산해 더한다 */
    verify: function (v, ans) {
      var sum = F(0);
      v.q.terms.forEach(function (t) {
        var x = F(gVal(t.f[0]));
        for (var i = 1; i < t.f.length; i++) x = t.ops[i - 1] === '×' ? x.mul(F(gVal(t.f[i]))) : x.div(F(gVal(t.f[i])));
        sum = t.sg < 0 ? sum.sub(x) : sum.add(x);
      });
      return ans.p === 0 && sum.equals(F(ans.n));
    },
    hints: function (v) {
      var q = v.q, pows = factors(q, 'pow'), sums = factors(q, 'sum'), first = [], note = '';
      pows.forEach(function (f) { first.push('거듭제곱 $' + (q.terms[0].sg < 0 && q.terms[0].f[0] === f ? '-' : '') + gTex(f) + '$'); });
      sums.forEach(function (f) { first.push('괄호 묶음 $' + gTex(f) + '$'); });
      if (pows.length) {
        var f = pows[0], lead = q.terms[0].sg < 0 && q.terms[0].f[0] === f;
        note = f.pow[0] < 0 ? ' $' + gTex(f) + '$은 ' + pj(f.pow[0], 0, '을/를') + ' ' + CNT[f.pow[1]] + ' 번 곱한 것이에요.'
          : lead ? ' $-' + gTex(f) + '$은 괄호가 없으니 ' + (f.pow[0] + '만') + ' ' + CNT[f.pow[1]] + ' 번 곱한 뒤 앞에 −를 붙여요.'
            : ' $' + gTex(f) + '$은 ' + josa(f.pow[0], '을/를') + ' ' + CNT[f.pow[1]] + ' 번 곱한 것이에요.';
      }
      var mult = q.terms.filter(function (t) { return t.f.length > 1; }).map(function (t) { return '$' + tTex(t) + '$'; });
      return [
        '식이 길어도 순서만 지키면 돼요. ① 거듭제곱 ② 괄호로 묶은 부분 ③ 곱셈과 나눗셈 ④ 덧셈과 뺄셈. 같은 단계끼리는 왼쪽부터 해요. 하나하나는 앞에서 배운 계산이에요. 한 줄에 한 가지씩만 계산하고 나머지는 그대로 옮겨 써요.',
        (first.length ? '이 식에서 가장 먼저 계산할 곳은 ' + first.join(', ') + ' 부분이에요.' + note : '이 식에는 거듭제곱도 괄호 묶음도 없어요(음수 하나를 감싼 괄호는 묶음이 아니에요).')
          + (first.length ? ' 그다음 ' : ' 그래서 곱셈 · 나눗셈인 ') + mult.join(', ') + (first.length ? ' 부분을 계산해요.' : ' 부분부터 계산해요.') + ' 두 수를 곱하거나 나눌 때는 부호가 같으면 +, 다르면 −예요.',
        '마지막에 남는 것은 덧셈이나 뺄셈 한 번이에요. 뺄셈이면 빼는 수의 부호를 바꿔 덧셈으로 고쳐요. 부호가 같은 두 수는 절댓값을 더해 그 부호를 붙이고, 부호가 다른 두 수는 큰 쪽에서 작은 쪽을 빼고 절댓값이 큰 수의 부호를 붙여요.'
      ];
    },
    steps: function (v) {
      var q = v.q, pows = factors(q, 'pow'), sums = factors(q, 'sum'), out = [], p = plain(q), ans = eVal(q);
      var leadPow = q.terms[0].sg < 0 && q.terms[0].f[0].pow;
      if (pows.length) out.push({ say: '거듭제곱을 먼저 계산해요.' + (leadPow ? ' 맨 앞의 −는 거듭제곱을 한 다음에 붙여요.' : ''), tex: pows.map(function (f) { return gTex(f) + ' = ' + gVal(f); }).join(',\\quad ') });
      if (sums.length) out.push({ say: '괄호로 묶은 부분을 계산해요.', tex: sums.map(function (f) { return gTex(f) + ' = ' + gVal(f); }).join(',\\quad ') });
      if (pows.length || sums.length) out.push({ say: '구한 값을 넣어 식을 다시 써요.', tex: eTex(p) });
      var mult = q.terms.filter(function (t) { return t.f.length > 1; }), pm = p.terms.filter(function (t) { return t.f.length > 1; });
      if (mult.length) out.push({ say: '곱셈과 나눗셈을 계산해요. 부호가 같으면 +, 다르면 −예요.', tex: pm.map(function (t) { return tTex(t) + ' = ' + tVal(t); }).join(',\\quad ') });
      var a = q.terms[0].sg * tVal(q.terms[0]), b = tVal(q.terms[1]), minus = q.terms[1].sg < 0;
      out.push({ say: (minus ? '남은 뺄셈은 빼는 수의 부호를 바꿔 더해요: ' + parT(a, 0) + ' + ' + parT(-b, 0) + '. ' : '남은 덧셈을 계산해요. ') + '답은 ' + josa(str(ans, 0), '이에요/예요') + '.',
        tex: stex(a, 0) + (minus ? ' - ' : ' + ') + (b < 0 ? '(' + b + ')' : b) + ' = ' + stex(ans, 0), value: S(ans, 0) });
      return out;
    },
    /* ① 순서를 무시하고 앞에서부터 계산 ② 거듭제곱의 괄호를 거꾸로 읽음 ③ 숫자는 맞는데 부호가 반대 */
    mistakes: [
      { id: 'left-to-right', wrong: function (v) { var w = leftToRight(v.q); return w === null ? null : S(w, 0); },
        explain: function (v) { return '앞에서부터 차례로 계산했어요. 곱셈과 나눗셈은 덧셈 · 뺄셈보다 먼저 해요. $' + tTex(v.q.terms[1]) + '$부터 계산해요.'; } },
      { id: 'pow-paren', wrong: function (v) { var w = powMixup(v.q); return w === null ? null : S(w, 0); },
        explain: function (v) {
          var q = v.q, f = factors(q, 'pow')[0];
          return f.pow[0] < 0 ? '거듭제곱의 부호를 잘못 정했어요. $' + gTex(f) + '$은 ' + pj(f.pow[0], 0, '을/를') + ' ' + CNT[f.pow[1]] + ' 번 곱하니 양수예요.'
            : '거듭제곱의 부호를 잘못 정했어요. $-' + gTex(f) + '$은 괄호가 없으니 ' + (f.pow[0] + '만') + ' ' + CNT[f.pow[1]] + ' 번 곱한 뒤 −를 붙여요. 그래서 음수예요.';
        } },
      { id: 'wrong-sign', wrong: function (v) { var ans = eVal(v.q); return ans === 0 || leftToRight(v.q) === -ans || powMixup(v.q) === -ans ? null : S(-ans, 0); },
        explain: function () { return '숫자는 맞았어요. 그런데 부호가 반대예요. 마지막 덧셈 · 뺄셈에서 절댓값이 큰 수의 부호를 따랐는지 확인해 보세요.'; } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B04', [
  { title: '곱셈의 부호 — 같으면 +, 다르면 −', body: [
    '부호가 있는 수의 곱셈은 부호와 숫자를 따로 생각해요. 숫자는 그냥 곱하고, 부호는 아래 규칙으로 정해요.',
    { ex: [['(+) \\times (+)', '+ : (+3) × (+2) = +6'], ['(+) \\times (-)', '− : (+3) × (−2) = −6'], ['(-) \\times (+)', '− : (−3) × (+2) = −6'], ['(-) \\times (-)', '+ : (−3) × (−2) = +6']] },
    '양수 × 음수가 음수인 까닭: (+3) × (−2)는 빚 2원을 3번 더한 것이라서 빚 6원이에요.',
    '음수 × 음수가 양수인 까닭: −는 "반대로 뒤집기"예요. 빚 2원을 3번 없애 주면(뒤집기를 두 번) 6원 이익이 돼요.'
  ] },
  { title: '규칙을 눈으로 확인하기', body: [
    '(−2)에 곱하는 수를 3, 2, 1, 0 … 으로 하나씩 줄여 보면 답이 2씩 커져요. 이 흐름을 그대로 이어 가면 음수 × 음수가 양수가 돼요.',
    { ex: [['(+2) \\times (-2)', '−4'], ['(+1) \\times (-2)', '−2'], ['0 \\times (-2)', '0'], ['(-1) \\times (-2)', '+2'], ['(-2) \\times (-2)', '+4']] },
    '어떤 수에 0을 곱하면 언제나 0이에요.'
  ] },
  { title: '나눗셈 — 부호 규칙은 곱셈과 같아요', body: [
    '나눗셈은 곱셈을 거꾸로 한 것이라서 부호 규칙이 똑같아요. 두 수의 부호가 같으면 +, 다르면 −.',
    { ex: [['(-12) \\div (-3)', '부호가 같아요 → +4'], ['(-12) \\div (+3)', '부호가 달라요 → −4'], ['(+12) \\div (-3)', '부호가 달라요 → −4']] },
    '분수로 나눌 때는 나누는 수를 역수(분자와 분모를 뒤집은 수)로 바꿔 곱해요. 이때 부호는 그대로 둬요.',
    { tex: '\\left(-\\dfrac{2}{3}\\right) \\div \\left(-\\dfrac{4}{5}\\right) = \\left(-\\dfrac{2}{3}\\right) \\times \\left(-\\dfrac{5}{4}\\right) = +\\dfrac{5}{6}' },
    '0을 어떤 수로 나누면 0이에요. 하지만 어떤 수도 0으로는 나눌 수 없어요.'
  ] },
  { title: '여러 수를 곱할 때 — 음수의 개수를 세요', body: [
    '음수 둘이 만나면 +가 되니까, 음수가 짝수 개이면 답은 +, 홀수 개이면 −예요.',
    { ex: [['(-2) \\times (-3) \\times (-1)', '음수 세 개(홀수) → −6'], ['(-2) \\times (+3) \\times (-1)', '음수 두 개(짝수) → +6']] },
    { list: ['① 음수의 개수를 세어 부호를 먼저 정해요.', '② 부호를 떼고 숫자끼리 곱해요.', '③ 정한 부호를 붙여요.'] }
  ] },
  { title: '음수의 거듭제곱 — 괄호를 잘 보세요', body: [
    '거듭제곱은 같은 수를 여러 번 곱하는 것이에요. 무엇을 여러 번 곱하는지는 괄호가 정해요.',
    { ex: [['(-3)^{2}', '(−3) × (−3) = +9. −까지 두 번 곱해요'], ['-3^{2}', '−(3 × 3) = −9. 3만 두 번 곱하고 −를 붙여요'], ['(-2)^{3}', '(−2) × (−2) × (−2) = −8']] },
    '음수를 짝수 번 곱하면 +, 홀수 번 곱하면 −가 돼요. $(-1)^{100} = +1$, $(-1)^{101} = -1$이에요.'
  ] },
  { title: '섞인 식의 계산 순서', body: [
    { list: ['① 거듭제곱', '② 괄호로 묶은 부분', '③ 곱셈과 나눗셈', '④ 덧셈과 뺄셈', '같은 단계끼리는 왼쪽부터 해요.'] },
    { tex: '\\begin{aligned} &(-2)^{2} \\times 3 - 10 \\div (-5) \\\\ &= 4 \\times 3 - 10 \\div (-5) \\\\ &= 12 - (-2) \\\\ &= 12 + 2 = 14 \\end{aligned}' },
    '한 줄에 한 단계씩만 계산하고, 나머지는 그대로 옮겨 써요. 여러 단계를 머릿속으로 한꺼번에 하면 부호를 놓치기 쉬워요.'
  ] }
]);
