/* B11 지수법칙과 단항식의 계산 — 지수법칙, 단항식의 곱셈 · 나눗셈
   유형(쉬운 것부터): B11.exp 지수 구하기(□ 안의 수, 키패드) · B11.law 지수법칙(보기 고르기) · B11.mul 단항식의 곱셈(보기 고르기)
                     · B11.div 단항식의 나눗셈(보기 고르기) · B11.mixed 곱셈과 나눗셈의 혼합(보기 고르기)
   답이 수 하나(지수)이면 키패드, 답이 식이면 보기 고르기다.
   단항식은 { n, d, e } 로 다룬다: 계수 n/d(기약, d > 0), e 는 문자마다의 지수(음수이면 분모에 있다). 6x²/y → { n: 6, d: 1, e: { x: 2, y: -1 } }
   계산은 모두 정수로 한다. 틀린 보기는 '흔한 실수 하나를 저지른 계산'을 실제로 해서 만든다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, gcd = MH.gcd, abs = Math.abs, order4 = MH.alg.order4, F = MH.F;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var ipow = function (b, k) { var x = 1; while (k-- > 0) x *= b; return x; };
  /** 다시 뽑기: ok 가 참이 될 때까지(많아야 60번) */
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!ok(q) && ++i < 60); return q; };

  /* ── 단항식 ── */
  var M = function (n, d, e) {
    var out = {}, g;
    if (d < 0) { n = -n; d = -d; }
    g = gcd(n, d) || 1;
    Object.keys(e).sort().forEach(function (k) { if (e[k]) out[k] = e[k]; });
    return { n: n / g, d: d / g, e: out };
  };
  var letters = function (e, s) { return Object.keys(e).filter(function (k) { return s * e[k] > 0; }).map(function (k) { return k + (abs(e[k]) === 1 ? '' : '^{' + abs(e[k]) + '}'); }).join(''); };
  /** 단항식을 쓴 꼴: 3a^{2}b, -\dfrac{2}{3}x, \dfrac{3x^{2}}{2y}, \dfrac{1}{a^{2}}, 1 */
  var tex = function (A) {
    var s = A.n < 0 ? '-' : '', n = abs(A.n), up = letters(A.e, 1), dn = letters(A.e, -1);
    if (!dn) return A.d === 1 ? s + (n === 1 && up ? '' : n) + up : s + '\\dfrac{' + n + '}{' + A.d + '}' + up;
    return s + '\\dfrac{' + (n === 1 && up ? '' : n) + up + '}{' + (A.d === 1 ? '' : A.d) + dn + '}';
  };
  var isOne = function (A) { return A.n === 1 && A.d === 1 && !Object.keys(A.e).length; };
  var wrap = function (s) { return /dfrac/.test(s) ? '\\left(' + s + '\\right)' : '(' + s + ')'; };

  /* ── 계산. f 에 실수 하나를 적으면 그 실수를 저지른 계산을 한다 ── */
  var powF = function (A, p, f) {
    var e = {}, k, n = ipow(A.n, p), d = ipow(A.d, p);
    for (k in A.e) e[k] = f.powAdd ? A.e[k] + (A.e[k] > 0 ? p : -p) : A.e[k] * p;
    if (f.coefKeep) { n = A.n; d = A.d; }
    if (f.coefTimes) { if (A.d !== 1 || abs(A.n) === 1) return null; n = A.n * p; d = 1; }
    if (f.powSign) { if (A.n > 0) return null; n = -abs(n); }
    return M(n, d, e);
  };
  var mulF = function (A, B, f) {
    var e = {}, k, n = A.n * B.n, d = A.d * B.d, a, b;
    for (k in A.e) e[k] = A.e[k];
    for (k in B.e) {
      a = e[k]; b = B.e[k];
      if (a === undefined) e[k] = b;
      else if (f.expMul) e[k] = a * b;
      else if (f.hiddenOne) e[k] = a === 1 && b === 1 ? 1 : (a === 1 ? 0 : a) + (b === 1 ? 0 : b);
      else e[k] = a + b;
    }
    if (f.coefAdd) { n = A.n * B.d + B.n * A.d; d = A.d * B.d; if (!n) return null; }
    return M(n, d, e);
  };
  var divF = function (A, B, f) {
    var e = {}, k, n = A.n * B.d, d = A.d * B.n;
    for (k in A.e) e[k] = A.e[k];
    for (k in B.e) {
      if (f.divAsMul) e[k] = (e[k] || 0) + B.e[k];
      else if (e[k] === undefined) e[k] = -B.e[k];
      else if (f.expDiv) { if (e[k] % B.e[k] !== 0) return null; e[k] = e[k] / B.e[k]; }
      else e[k] -= B.e[k];
    }
    if (f.coefSub) { n = A.n * B.d - B.n * A.d; d = A.d * B.d; if (!n) return null; }
    if (f.noFlip) { if (B.d === 1) return null; n = A.n * B.n; d = A.d * B.d; }
    return M(n, d, e);
  };
  /** 식 Q = { terms: [{ m: 단항식, p: 지수 }], ops: ['×' | '÷' …] } 을 앞에서부터 계산한다 */
  var value = function (Q, f) {
    f = f || {};
    var ms = [], acc, i, k, rest, t, x, neg = Q.terms.some(function (t) { return t.m.n < 0; }), hasDiv = Q.ops.indexOf('÷') >= 0;
    for (i = 0; i < Q.terms.length; i++) { t = Q.terms[i]; x = t.p > 1 ? powF(t.m, t.p, f) : t.m; if (!x) return null; ms.push(x); }
    if (f.rightFirst) {
      if (ms.length !== 3 || Q.ops[0] !== '÷') return null;
      rest = Q.ops[1] === '×' ? mulF(ms[1], ms[2], {}) : divF(ms[1], ms[2], {});
      acc = divF(ms[0], rest, {});
    } else {
      acc = ms[0];
      for (i = 1; i < ms.length && acc; i++) acc = Q.ops[i - 1] === '×' ? mulF(acc, ms[i], f) : divF(acc, ms[i], f);
    }
    if (!acc) return null;
    if (f.sign) { if (!neg) return null; acc = M(-acc.n, acc.d, acc.e); }
    if (f.doubled) { if (hasDiv || ms.length < 2 || ms.some(function (m) { return m.n !== 1 || m.d !== 1; })) return null; acc = M(acc.n * ms.length, acc.d, acc.e); }
    if (f.inverted) { if (!hasDiv || !Object.keys(acc.e).length) return null; x = {}; for (k in acc.e) x[k] = -acc.e[k]; acc = M(acc.n, acc.d, x); }
    if (f.expOff) { k = Object.keys(acc.e)[0]; if (!k) return null; x = {}; for (i in acc.e) x[i] = acc.e[i]; x[k] += (x[k] > 0 ? 1 : -1) * f.expOff; acc = M(acc.n, acc.d, x); }
    return acc;
  };
  /** 실수 id → [계산에 넣는 실수, 설명] */
  var FLAW = {
    'exp-multiplied': [{ expMul: 1 }, '곱셈인데 지수를 곱했어요. $a^{2} \\times a^{3}$은 $a$를 2번 곱한 것에 3번 곱한 것을 이어 붙인 것이에요. $a$가 모두 5번 곱해지니 지수는 더해요.'],
    'coef-added': [{ coefAdd: 1 }, '수(계수)를 더했어요. 곱셈이니 수끼리도 곱해요. 더하는 것은 문자의 지수뿐이에요.'],
    'hidden-one': [{ hiddenOne: 1 }, '지수가 안 보이는 문자를 세지 않았어요. $x$는 $x^{1}$이에요. 그 1도 지수에 더해야 해요.'],
    'pow-added': [{ powAdd: 1 }, '거듭제곱의 거듭제곱인데 지수를 더했어요. $(a^{2})^{3}$은 $a^{2}$을 3번 곱한 것이에요. 2개씩 3묶음이니 지수는 곱해요.'],
    'coef-not-powered': [{ coefKeep: 1 }, '괄호 안의 수(계수)에는 지수를 적용하지 않았어요. 괄호 밖의 지수는 괄호 안의 수와 문자 모두에 적용해요. $(2a)^{3}$이면 2도 3번 곱해요.'],
    'coef-times': [{ coefTimes: 1 }, '계수에 지수를 곱했어요. $2^{3}$은 $2 \\times 3$이 아니라 $2 \\times 2 \\times 2$예요. 거듭제곱은 같은 수를 거듭 곱하는 것이에요.'],
    'pow-sign': [{ powSign: 1 }, '부호가 틀렸어요. 음수를 짝수 번 곱하면 양수, 홀수 번 곱하면 음수예요. $(-a)^{2}$은 $(-a) \\times (-a)$라서 양수예요.'],
    sign: [{ sign: 1 }, '부호가 틀렸어요. 곱하거나 나누는 수 가운데 음수가 홀수 개이면 결과는 −, 짝수 개이면 +예요. 부호부터 먼저 정해요.'],
    doubled: [{ doubled: 1 }, '앞에 수를 붙였어요. 그것은 덧셈($a^{3} + a^{3} = 2a^{3}$)에서 하는 일이에요. 곱셈에서는 지수만 달라지고 계수는 1 그대로예요.'],
    'exp-divided': [{ expDiv: 1 }, '나눗셈인데 지수를 나눴어요. $a^{6} \\div a^{2}$은 분수로 쓰고 $a$를 2개씩 약분하는 것이에요. 4개가 남으니 지수는 빼요.'],
    'coef-subtracted': [{ coefSub: 1 }, '수(계수)를 뺐어요. 나눗셈이니 수끼리도 나눠요. 빼는 것은 문자의 지수뿐이에요.'],
    'div-as-mul': [{ divAsMul: 1 }, '나누는 식의 문자를 곱했어요. ÷ 뒤의 식은 수도 문자도 통째로 분모로 가요. 그래서 같은 문자의 지수는 더하지 않고 빼요.'],
    'no-flip': [{ noFlip: 1 }, '분수를 뒤집지 않고 그대로 곱했어요. 분수로 나누는 것은 그 역수(분자와 분모를 바꾼 수)를 곱하는 것이에요.'],
    inverted: [{ inverted: 1 }, '문자가 남는 자리가 바뀌었어요. 분수로 쓰고 약분했을 때, 지수가 더 큰 쪽에 문자가 남아요. 분자 쪽이 크면 분자에, 분모 쪽이 크면 분모에 남아요.'],
    'right-first': [{ rightFirst: 1 }, '뒤의 두 식을 먼저 계산했어요. 곱셈과 나눗셈이 섞여 있으면 앞에서부터 차례로 계산해요. ÷ 는 바로 뒤의 식 하나만 분모로 보내요.'],
    'exp-off': [{ expOff: 1 }, '지수를 하나 더 많이 셌어요. 같은 문자의 지수를 하나씩 다시 세어 보세요. 지수가 안 보이는 문자는 지수가 1이에요.'],
    'exp-less': [{ expOff: -1 }, '지수를 하나 덜 셌어요. 같은 문자의 지수를 하나씩 다시 세어 보세요. 지수가 안 보이는 문자는 지수가 1이에요.']
  };

  /* ── 식을 쓰는 꼴 ── */
  var operand = function (t, i) {
    var s = tex(t.m);
    if (t.p > 1) return wrap(s) + '^{' + t.p + '}';
    return i > 0 && t.m.n < 0 ? wrap(s) : s;
  };
  var rawTex = function (Q) { return Q.terms.map(function (t, i) { return (i ? (Q.ops[i - 1] === '×' ? ' \\times ' : ' \\div ') : '') + operand(t, i); }).join(''); };
  /** 거듭제곱을 수와 문자마다 나누어 쓴 꼴: (-2x^{2})^{3} → (-2)^{3} \times (x^{2})^{3} */
  var powDetail = function (t) {
    var m = t.m, p = t.p, one = function (k) { return abs(m.e[k]) === 1 ? k + '^{' + p + '}' : '(' + k + '^{' + abs(m.e[k]) + '})^{' + p + '}'; };
    var up = Object.keys(m.e).filter(function (k) { return m.e[k] > 0; }).map(one), dn = Object.keys(m.e).filter(function (k) { return m.e[k] < 0; }).map(one);
    if (m.d !== 1) dn.unshift(m.d + '^{' + p + '}');
    if (m.n !== 1 || m.d !== 1) up.unshift((m.n < 0 ? '(' + m.n + ')' : m.n) + '^{' + p + '}');
    return dn.length ? '\\dfrac{' + (up.join(' \\times ') || '1') + '}{' + dn.join(' \\times ') + '}' : up.join(' \\times ');
  };
  /** 수는 수끼리, 같은 문자는 같은 문자끼리 모은 꼴: \dfrac{12}{4} \times \dfrac{a^{5}}{a^{2}} */
  var grouped = function (ms, ops) {
    var numC = [], denC = [], keys = {}, groups = [], c = function (x) { return x; }, fmt = function (list) { return list.map(function (x) { return x < 0 && list.length > 1 ? '(' + x + ')' : String(x); }).join(' \\times '); };
    ms.forEach(function (m, i) {
      var up = i === 0 || ops[i - 1] === '×';
      if (m.n !== 1) (up ? numC : denC).push(c(m.n));
      if (m.d !== 1) (up ? denC : numC).push(c(m.d));
      Object.keys(m.e).forEach(function (k) { keys[k] = 1; });
    });
    if (numC.length || denC.length) groups.push(denC.length ? ['\\dfrac{' + (fmt(numC) || '1') + '}{' + fmt(denC) + '}', 1] : [numC.length === 1 && numC[0] < 0 ? '(' + numC[0] + ')' : fmt(numC), numC.length]);
    Object.keys(keys).sort().forEach(function (k) {
      var upE = [], dnE = [], it = function (x) { return k + (x === 1 ? '' : '^{' + x + '}'); };
      ms.forEach(function (m, i) { var x = m.e[k], up = i === 0 || ops[i - 1] === '×'; if (!x) return; ((up && x > 0) || (!up && x < 0) ? upE : dnE).push(it(abs(x))); });
      groups.push(dnE.length ? ['\\dfrac{' + (upE.join(' \\times ') || '1') + '}{' + dnE.join(' \\times ') + '}', 1] : [upE.join(' \\times '), upE.length]);
    });
    return groups.map(function (g) { return g[1] > 1 && groups.length > 1 ? '(' + g[0] + ')' : g[0]; }).join(' \\times ');
  };

  /* ── 답이 식인 유형의 공통 틀 ──
     o = { id, title, kind: 'law' | 'mul' | 'div' | 'mixed', ids: [실수 id … (앞의 것부터 보기로 쓴다)], levels }
     v.q = { terms: [{ n, d, e, p }], ops, c: 보기 후보를 돌리는 수, o: 보기 순서 } */
  var INTRO = {
    'law-mul': '거듭제곱은 같은 것을 여러 번 곱한 것을 짧게 쓴 것이에요. $a^{3}$은 $a \\times a \\times a$예요. 그래서 $a^{3} \\times a^{2}$은 $a$를 3번 곱한 것 뒤에 2번 곱한 것을 이어 붙인 것이고, $a$는 모두 5번 곱해져요. 밑이 같은 거듭제곱의 곱셈에서는 지수를 더해요.',
    'law-pow': '$(a^{2})^{3}$은 $a^{2}$을 3번 곱한 것이에요: $a^{2} \\times a^{2} \\times a^{2}$. 달걀 2개씩 든 묶음이 3개 있는 것과 같아서, $a$는 모두 $2 \\times 3$번 곱해져요. 거듭제곱의 거듭제곱에서는 지수를 곱해요.',
    'law-div': '나눗셈은 분수로 쓰고 약분하면 돼요. $a^{5} \\div a^{2}$은 분자에 $a$가 5개, 분모에 $a$가 2개 곱해진 분수예요. 위아래에서 2개씩 지우면 분자에 3개가 남아요. 그래서 나눗셈에서는 지수를 빼요. 분모 쪽이 더 많으면 분모에 남고, 개수가 같으면 모두 지워져 1이 돼요.',
    'law-all': '$(ab)^{3}$은 $ab$를 3번 곱한 것이에요: $ab \\times ab \\times ab$. $a$도 3번, $b$도 3번 곱해지니 $a^{3}b^{3}$이에요. 괄호 밖의 지수는 괄호 안의 수와 문자 모두에 하나씩 나누어 줘요. 분수 꼴이면 분자와 분모에 각각 적용해요.',
    mul: '단항식의 곱셈은 순서를 바꿔 곱해도 결과가 같아요. 그래서 수는 수끼리, 같은 문자는 같은 문자끼리 모아서 곱해요. 서랍을 정리하듯 종류별로 나누는 거예요. 수끼리는 그냥 곱하고, 같은 문자끼리는 지수를 더해요.',
    div: '단항식의 나눗셈은 분수로 고쳐서 약분하면 돼요. 나누는 식을 통째로 분모에 써요. 그다음 수는 수끼리, 같은 문자는 같은 문자끼리 약분해요. 수끼리는 나누고, 같은 문자끼리는 지수를 빼요.',
    mixed: '곱셈과 나눗셈이 섞여 있으면 앞에서부터 차례로 계산해요. 가장 쉬운 방법은 전체를 분수 하나로 쓰는 것이에요. 곱하는 식은 분자에, 나누는 식(÷ 바로 뒤의 식 하나)은 분모에 써요. 그다음 종류별로 약분해요.'
  };
  var exprType = function (o) {
    var lastQ = null, lastP = null;
    var build = function (q) {
      var Q = { terms: q.terms.map(function (t) { return { m: M(t.n, t.d, t.e), p: t.p || 1 }; }), ops: q.ops }, ans = value(Q), ansT, raw = rawTex(Q), wrong, cands, k;
      if (!ans) return null;
      ansT = tex(ans);
      cands = o.ids.map(function (id) {
        if (id === 'zero') return isOne(ans) ? ['0', id, '같은 것끼리 나누면 0이 아니라 1이에요. $5 \\div 5 = 1$인 것과 같아요. 분자와 분모가 모두 약분되면 1이 남아요.'] : null;
        if (id === 'left-letter') return isOne(ans) ? [Object.keys(Q.terms[0].m.e)[0], id, '문자가 하나 남는다고 봤어요. 분자와 분모의 개수가 같으면 남김없이 약분돼요. 모두 약분되면 1이 남아요.'] : null;
        var w = value(Q, FLAW[id][0]);
        return w ? [tex(w), id, FLAW[id][1]] : null;
      }).filter(Boolean);
      /* 지수를 잘못 센 보기(exp-off, exp-less)는 다른 실수로 보기 셋을 채우지 못할 때만 쓴다 */
      var main = cands.filter(function (c) { return c[1] !== 'exp-off' && c[1] !== 'exp-less'; }), spare = cands.filter(function (c) { return c[1] === 'exp-off' || c[1] === 'exp-less'; });
      wrong = [];
      for (k = 0; k < main.length + spare.length && wrong.length < 3; k++) {
        var c = k < main.length ? main[(k + q.c) % main.length] : spare[k - main.length];
        if (c[0] !== ansT && wrong.every(function (w) { return w[0] !== c[0]; })) wrong.push(c);
      }
      /* 검산: 원래 식과 정답에 작은 수를 넣어 본 값이 같다 */
      var ENV = [{ a: F(2), b: F(3), x: F(3), y: F(2) }, { a: F(-3), b: F(2), x: F(-2), y: F(3) }];
      var check = wrong.length === 3 && ENV.every(function (env) { return MH.alg.ev(raw, env).equals(MH.alg.ev(ansT, env)); });
      var hasPow = Q.terms.some(function (t) { return t.p > 1; }), hasDiv = q.ops.indexOf('÷') >= 0, powered = Q.terms.filter(function (t) { return t.p > 1; });
      var ms = Q.terms.map(function (t) { return t.p > 1 ? powF(t.m, t.p, {}) : t.m; }), fracDiv = ms.some(function (m, i) { return i > 0 && q.ops[i - 1] === '÷' && m.d !== 1; });
      var divisors = ms.filter(function (m, i) { return i > 0 && q.ops[i - 1] === '÷'; });
      var single = Q.terms.length === 1, g = single ? '' : grouped(ms, q.ops);
      var intro = o.kind !== 'law' ? INTRO[o.kind] : single && (Object.keys(Q.terms[0].m.e).length > 1 || !isOne(M(Q.terms[0].m.n, Q.terms[0].m.d, {}))) ? INTRO['law-all'] : hasPow ? INTRO['law-pow'] : hasDiv ? INTRO['law-div'] : INTRO['law-mul'];
      var h2 = hasPow ? '이 식에는 괄호의 거듭제곱($' + powered.map(function (t) { return operand(t, 0); }).join('$, $') + '$)이 있어요. 이것부터 풀어요. 괄호 밖의 지수는 괄호 안의 수와 문자 모두에 적용해요. 수는 그 횟수만큼 거듭 곱하고, 문자의 지수에는 곱해요. 음수는 짝수 번 곱하면 양수, 홀수 번 곱하면 음수가 돼요.'
        : hasDiv ? '÷ 바로 뒤에 있는 식($' + divisors.map(tex).join('$, $') + '$)은 통째로 분모로 가요. 수도 문자도 모두 분모에 써요.' + (fracDiv ? ' 분수가 곱해진 식으로 나눌 때는 역수를 곱해요. 이때 분수만 뒤집는 것이 아니라 문자까지 함께 분모로 보내요.' : ' 분수로 쓰고 나면 수는 수끼리, 같은 문자는 같은 문자끼리 약분할 수 있어요.')
        : '이 식을 종류별로 나눠 봐요. 수(계수)끼리 한 묶음, 같은 문자끼리 한 묶음이에요. 지수가 안 보이는 문자는 지수가 1이에요($x = x^{1}$). 계수가 안 보이는 식은 계수가 1이에요.';
      var h3 = (single ? '① 괄호 안의 수와 문자 하나하나에 지수를 적용해요: $' + powDetail(Q.terms[0]) + '$. ' : '① ' + (hasPow ? '거듭제곱을 푼 다음, ' : '') + '수는 수끼리, 같은 문자는 같은 문자끼리 모으면 이런 모양이 돼요: $' + g + '$. ')
        + '② 부호를 먼저 정해요. 음수가 홀수 개이면 −, 짝수 개이면 +예요. ③ 수끼리 계산해요. ④ 같은 문자끼리 계산해요. 곱셈은 지수를 더하고, 나눗셈(분수 꼴)은 지수를 빼고, 거듭제곱의 거듭제곱은 지수를 곱해요.';
      if (o.kind === 'law' && !single) {
        if (!hasPow && !hasDiv) h2 = '같은 문자끼리 지수를 봐요. ' + Object.keys(ans.e).map(function (k) {
          var es = ms.filter(function (m) { return m.e[k]; }).map(function (m) { return m.e[k]; });
          return '$' + k + '$의 지수는 ' + (es.length > 1 ? '차례로 ' : '') + es.join(', ') + pj(es[es.length - 1], '이에요/예요') + '.';
        }).join(' ') + ' 지수가 안 보이는 문자는 지수가 1이에요. 문자가 다르면 따로따로 세요.';
        else if (!hasPow) h2 = '÷ 바로 뒤에 있는 식($' + divisors.map(tex).join('$, $') + '$)은 분모로 가요. 분수로 쓰고 나면 분자와 분모에 똑같이 있는 문자를 하나씩 짝지어 지울 수 있어요. 분자와 분모에 그 문자가 각각 몇 개씩 곱해져 있는지 세어 보세요.';
        h3 = '① ' + (hasPow ? '괄호의 거듭제곱을 푼 다음, ' : '') + '같은 문자끼리 모으면 이런 모양이 돼요: $' + g + '$. ② 곱셈이면 지수를 더하고, 분수 꼴(나눗셈)이면 큰 지수에서 작은 지수를 빼요. 뺀 뒤에 문자는 지수가 컸던 쪽(분자 또는 분모)에 남아요. ③ 지수끼리 곱하거나 나누지 않도록, 그리고 앞에 수를 붙이지 않도록 조심해요.';
      }
      var lawish = o.kind === 'law', steps = [];
      if (hasPow) steps.push({ say: '거듭제곱을 먼저 풀어요. 괄호 안의 수와 문자 모두에 지수를 적용해요.', tex: Q.terms.map(function (t, i) { return t.p > 1 ? operand(t, 0) + ' = ' + powDetail(t) + (single ? '' : ' = ' + tex(ms[i])) : null; }).filter(Boolean).join(',\\quad ') });
      if (!single) {
        if (fracDiv) steps.push({ say: '분수가 곱해진 식으로 나누는 것은 그 역수를 곱하는 것이에요. 문자도 함께 분모로 가요.', tex: ms.map(function (m, i) { var inv = i > 0 && q.ops[i - 1] === '÷' && m.d !== 1, x = inv ? divF(M(1, 1, {}), m, {}) : m, s = tex(x); return (i ? (inv || q.ops[i - 1] === '×' ? ' \\times ' : ' \\div ') : '') + (i && x.n < 0 ? wrap(s) : s); }).join('') });
        steps.push({ say: lawish ? (hasDiv ? '나누는 식을 분모에 써요.' : '같은 문자끼리 모아요.') : (hasDiv ? '나누는 식을 분모에 쓰고, ' : '') + '수는 수끼리, 같은 문자는 같은 문자끼리 모아요.', tex: g });
      }
      steps.push({ say: single ? '수는 거듭 곱하고, 문자의 지수에는 곱해요.' : lawish ? '같은 문자끼리 지수를 계산해요. 곱셈은 더하고, 나눗셈은 빼요.' : '부호를 정하고 각각 계산해요.', tex: ansT, value: ansT });
      var hints = [intro, h2, h3];
      /* 답이 수 하나(모두 약분되어 1 이 되는 식 …)이면 힌트가 그 수를 말하지 않게 한다 */
      if (isOne(ans)) hints = ['나눗셈은 분수로 쓰고 약분하면 돼요. 분자와 분모에 같은 문자가 곱해져 있으면 위아래에서 하나씩 짝지어 지울 수 있어요. 사탕을 똑같은 수의 사람에게 나누어 주는 것처럼, 같은 것끼리 나누는 상황을 떠올려 보세요.',
        (hasPow ? '먼저 괄호의 거듭제곱을 풀어요(지수를 곱해요). 그다음 ' : '') + '이 식을 분수로 쓰면 $' + g + '$ 모양이에요. 분자와 분모에 같은 문자가 곱해진 개수를 각각 세어 보세요. 개수가 같으면 남김없이 모두 지워져요.',
        '① 분자와 분모에서 같은 문자를 하나씩 짝지어 지워요. ② 모두 지워졌을 때 "아무것도 남지 않는다"고 생각하기 쉬워요. 하지만 약분은 나눗셈이에요. 같은 수끼리 나눈 몫이 얼마인지 생각해 보세요(예: $5 \\div 5$). ③ 그 몫이 답이에요.'];
      if (/^-?\d+$/.test(ansT) && nums(hints.join(' ')).indexOf(String(abs(ans.n))) >= 0) check = false;
      return { raw: raw, ans: ansT, wrong: wrong, check: check, hints: hints, steps: steps, mono: ans };
    };
    var P = function (v) { if (v.q !== lastQ) { lastP = build(v.q); lastQ = v.q; } return lastP; };
    var options = function (v) { var p = P(v), list = [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v); return !!p && p.check === true; };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B11', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { return { tex: P(v).raw, text: '계산해서 간단히 한 것을 고르세요.' }; },
      solve: function (v) { return P(v).ans; },
      verify: function (v, ans) { return good(v) && ans === P(v).ans && options(v).indexOf(ans) >= 0; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { return P(v).steps; },
      mistakes: o.ids.map(function (id) {
        var find = function (v) { return P(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
        return { id: id, wrong: function (v) { var w = find(v); return w ? w[0] : null; }, explain: function (v) { var w = find(v); return w ? w[2] : ''; } };
      })
    });
  };

  /* ── 문제에 쓸 식 만들기 ── */
  var LET = ['a', 'b', 'x', 'y'], PAIR = [['a', 'b'], ['x', 'y']];
  var T = function (n, d, e, p) { return { n: n, d: d, e: e, p: p || 1 }; };
  var E1 = function (L, m) { var e = {}; if (m) e[L] = m; return e; };
  var E2 = function (P, m, n) { var e = {}; if (m) e[P[0]] = m; if (n) e[P[1]] = n; return e; };
  /** 답이 깔끔한가: 계수의 크기, 분모, 지수의 크기 */
  var tidy = function (maxN, maxD) {
    return function (q) {
      var a = value({ terms: q.terms.map(function (t) { return { m: M(t.n, t.d, t.e), p: t.p || 1 }; }), ops: q.ops });
      return !!a && abs(a.n) <= maxN && a.d <= maxD && Object.keys(a.e).every(function (k) { return abs(a.e[k]) <= 12; });
    };
  };
  var Q = function (r, terms, ops) { return { terms: terms, ops: ops, c: r.int(0, 9), o: order4(r) }; };

  /* ── B11.law 지수법칙 ──────────────────────────────── */
  exprType({
    id: 'B11.law', title: '지수법칙', kind: 'law',
    ids: ['exp-multiplied', 'pow-added', 'hidden-one', 'doubled', 'exp-divided', 'inverted', 'div-as-mul', 'zero', 'left-letter', 'coef-not-powered', 'coef-times', 'pow-sign', 'exp-off', 'exp-less'],
    levels: [
      { name: '곱셈 · 거듭제곱의 거듭제곱', minDistinct: 150, vars: { q: sampler(function (r) {
          var L = r.pick(LET), P = r.pick(PAIR), k = r.int(0, 4);
          if (k <= 1) return until(function () { return Q(r, [T(1, 1, E1(L, r.int(1, 7))), T(1, 1, E1(L, r.int(1, 7)))], ['×']); }, function (q) { return q.terms[0].e[L] + q.terms[1].e[L] > 2; });
          if (k === 2) return Q(r, [T(1, 1, E1(L, r.int(2, 5)), r.int(2, 4))], []);
          if (k === 3) return Q(r, [T(1, 1, E1(P[0], r.int(1, 5))), T(1, 1, E1(P[1], r.int(1, 5))), T(1, 1, E1(P[0], r.int(1, 5)))], ['×', '×']);
          return Q(r, [T(1, 1, E1(L, r.int(2, 4)), r.int(2, 3)), T(1, 1, E1(L, r.int(1, 5)))], ['×']);
        }) } },
      { name: '나눗셈', minDistinct: 150, vars: { q: sampler(function (r) {
          var L = r.pick(LET), k = r.int(0, 5), m;
          if (k <= 2) return until(function () { return Q(r, [T(1, 1, E1(L, r.int(1, 9))), T(1, 1, E1(L, r.int(1, 9)))], ['÷']); }, function (q) { return q.terms[0].e[L] !== q.terms[1].e[L] && q.terms[0].e[L] + q.terms[1].e[L] > 2; });
          if (k === 3) { m = r.int(2, 8); return Q(r, [T(1, 1, E1(L, m)), T(1, 1, E1(L, m))], ['÷']); }
          if (k === 4) return Q(r, [T(1, 1, E1(L, r.int(2, 4)), r.int(2, 3)), T(1, 1, E1(L, r.int(1, 9)))], ['÷']);
          return Q(r, [T(1, 1, E1(L, r.int(1, 6))), T(1, 1, E1(L, r.int(1, 6))), T(1, 1, E1(L, r.int(1, 9)))], ['×', '÷']);
        }) } },
      { name: '곱 · 몫의 거듭제곱', minDistinct: 150, vars: { q: sampler(function (r) {
          var L = r.pick(LET), P = r.pick(PAIR), k = r.int(0, 4), c;
          if (k === 0) return Q(r, [T(1, 1, E2(P, r.int(1, 4), r.int(1, 4)), r.int(2, 4))], []);
          if (k === 1) { c = r.pick([2, 3, -2, -3, -1, -1]); return Q(r, [T(c, 1, E1(L, r.int(1, 4)), c === -1 ? r.int(2, 5) : r.int(2, 3))], []); }
          if (k === 2) return Q(r, [T(1, 1, E2(P, r.int(1, 4), -r.int(1, 4)), r.int(2, 4))], []);
          if (k === 3) return Q(r, [T(r.pick([2, 3, -2, -3, -1]), 1, E2(P, r.int(1, 3), r.int(1, 3)), r.int(2, 3))], []);
          return Q(r, [T(r.pick([2, 3, -2, -1]), 1, E2(P, r.int(1, 3), -r.int(1, 3)), r.int(2, 3))], []);
        }) } }
    ]
  });

  /* ── B11.mul 단항식의 곱셈 ─────────────────────────── */
  exprType({
    id: 'B11.mul', title: '단항식의 곱셈', kind: 'mul',
    ids: ['coef-added', 'exp-multiplied', 'hidden-one', 'sign', 'pow-added', 'coef-not-powered', 'coef-times', 'pow-sign', 'exp-off', 'exp-less'],
    levels: [
      { name: '문자가 한 가지', vars: { q: sampler(function (r) {
          var L = r.pick(LET);
          return until(function () { return Q(r, [T(nz(r, -9, 9), 1, E1(L, r.int(1, 5))), T(nz(r, -9, 9), 1, E1(L, r.int(1, 5)))], ['×']); }, function (q) { return abs(q.terms[0].n * q.terms[1].n) > 1; });
        }) } },
      { name: '문자가 두 가지', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR), three = r.int(0, 3) === 0;
          return until(function () {
            var t = [T(nz(r, -6, 6), 1, E2(P, r.int(1, 4), r.int(0, 4))), T(nz(r, -6, 6), 1, E2(P, r.int(0, 4), r.int(1, 4)))];
            if (three) t.push(T(nz(r, -3, 3), 1, E2(P, r.int(0, 2), r.int(0, 2))));
            return Q(r, t, three ? ['×', '×'] : ['×']);
          }, function (q) { return tidy(72, 1)(q) && q.terms.every(function (t) { return Object.keys(t.e).length > 0; }); });
        }) } },
      { name: '거듭제곱이 있는 곱셈', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR);
          return until(function () {
            var pw = T(r.pick([-3, -2, -1, 2, 3]), 1, E2(P, r.int(1, 3), r.int(0, 2)), r.int(2, 3)), other = T(nz(r, -5, 5), 1, E2(P, r.int(0, 3), r.int(1, 3)));
            return Q(r, r.int(0, 1) ? [pw, other] : [other, pw], ['×']);
          }, tidy(135, 1));
        }) } }
    ]
  });

  /* ── B11.div 단항식의 나눗셈 ───────────────────────── */
  var FR = [[1, 2], [1, 3], [2, 3], [3, 2], [3, 4], [4, 3], [2, 5], [5, 2], [1, 4]];
  exprType({
    id: 'B11.div', title: '단항식의 나눗셈', kind: 'div',
    ids: ['coef-subtracted', 'exp-divided', 'div-as-mul', 'inverted', 'no-flip', 'sign', 'pow-added', 'coef-not-powered', 'exp-off'],
    levels: [
      { name: '문자가 한 가지', vars: { q: sampler(function (r) {
          var L = r.pick(LET);
          return until(function () {
            var cb = pm(r, r.int(2, 9)), eb = r.int(1, 4), qc = nz(r, -9, 9), qe = r.pick([0, 1, 1, 2, 2, 3, 4]);
            return Q(r, [T(qc * cb, 1, E1(L, eb + qe)), T(cb, 1, E1(L, eb))], ['÷']);
          }, function (q) { return abs(q.terms[0].n) <= 72; });
        }) } },
      { name: '문자가 두 가지', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR);
          return until(function () { return Q(r, [T(pm(r, r.int(2, 24)), 1, E2(P, r.int(1, 5), r.int(1, 5))), T(pm(r, r.int(2, 8)), 1, E2(P, r.int(1, 5), r.int(0, 5)))], ['÷']); },
            function (q) { return tidy(12, 5)(q) && JSON.stringify(q.terms[0].e) !== JSON.stringify(q.terms[1].e); });
        }) } },
      { name: '분수 계수 · 거듭제곱', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR);
          if (r.int(0, 1)) return until(function () {
            var f = r.pick(FR);
            return Q(r, [T(f[0] * nz(r, -6, 6), 1, E2(P, r.int(1, 5), r.int(1, 4))), T(pm(r, f[0]), f[1], E2(P, r.int(1, 3), r.int(0, 3)))], ['÷']);
          }, tidy(40, 1));
          return until(function () {
            return Q(r, [T(r.pick([-3, -2, -1, 2, 3]), 1, E2(P, r.int(1, 3), r.int(1, 2)), r.int(2, 3)), T(pm(r, r.int(1, 9)), 1, E2(P, r.int(1, 4), r.int(0, 3)))], ['÷']);
          }, tidy(27, 4));
        }) } }
    ]
  });

  /* ── B11.mixed 곱셈과 나눗셈의 혼합 ─────────────────── */
  var term2 = function (r, P, c) { return T(nz(r, -c, c), 1, E2(P, r.int(0, 3), r.int(0, 3))); };
  var hasLetters = function (q) { return q.terms.every(function (t) { return Object.keys(t.e).length > 0; }); };
  exprType({
    id: 'B11.mixed', title: '곱셈과 나눗셈의 혼합', kind: 'mixed',
    ids: ['right-first', 'div-as-mul', 'sign', 'inverted', 'exp-multiplied', 'pow-added', 'coef-not-powered', 'exp-off'],
    levels: [
      { name: '곱한 다음 나누기', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR);
          return until(function () { return Q(r, [term2(r, P, 9), term2(r, P, 6), term2(r, P, 9)], ['×', '÷']); }, function (q) { return tidy(30, 1)(q) && hasLetters(q) && abs(q.terms[2].n) > 1; });
        }) } },
      { name: '나눈 다음 곱하기', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR);
          return until(function () { return Q(r, [term2(r, P, 12), term2(r, P, 6), term2(r, P, 6)], ['÷', '×']); }, function (q) { return tidy(30, 1)(q) && hasLetters(q) && abs(q.terms[1].n) > 1; });
        }) } },
      { name: '거듭제곱 · 나눗셈 두 번', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR), k = r.int(0, 2);
          return until(function () {
            var pw = T(r.pick([-2, -1, 2, 3]), 1, E2(P, r.int(1, 2), r.int(1, 2)), r.int(2, 3));
            if (k === 0) return Q(r, [T(nz(r, -6, 6) * r.pick([2, 3, 4, 6]), 1, E2(P, r.int(2, 6), r.int(2, 6))), term2(r, P, 4), term2(r, P, 4)], ['÷', '÷']);
            if (k === 1) return Q(r, [pw, term2(r, P, 5), term2(r, P, 6)], ['×', '÷']);
            return Q(r, [term2(r, P, 9), pw, term2(r, P, 4)], ['÷', '×']);
          }, function (q) { return tidy(48, 1)(q) && hasLetters(q); });
        }) } }
    ]
  });

  /* ── B11.exp 지수 구하기 (□ 안의 수) ───────────────────
     문제 = { tex, ans, wrong: { 실수 id: [오답, 설명] }, hints, steps, check } */
  var SQ = '\\square', pw = function (b, e) { return b + '^{' + e + '}'; };
  /** 밑(문자 또는 숫자) 뒤의 조사: 문자 a b x y 는 받침 없이 읽는다 */
  var bj = function (b, pair) { return /\d/.test(b) ? pj(Number(b), pair) : josa('아', pair).slice(1); };
  var COUNT = '거듭제곱은 같은 것을 여러 번 곱한 것을 짧게 쓴 것이에요. $a^{3}$은 $a \\times a \\times a$, 곧 $a$를 3번 곱한 것이에요. 지수는 "몇 번 곱했나"를 세는 수예요. 그래서 지수 문제는 곱해진 개수를 세는 문제예요.';
  var W = {
    multiplied: '지수를 곱했어요. 곱셈에서는 곱해진 개수를 이어서 세는 것이니 지수를 더해요.',
    added: '지수를 더했어요. 이 계산에서는 더하는 것이 아니에요. 곱해진 개수가 어떻게 달라지는지 다시 세어 보세요.',
    'hidden-one': '지수가 안 보이는 것을 세지 않았어요. $a$는 $a^{1}$이에요. 그 1도 더해야 해요.',
    divided: '지수를 나눴어요. 나눗셈은 분수로 쓰고 약분하는 것이에요. 지워진 개수만큼 빼요.',
    'all-added': '지수를 모두 더했어요. 거듭제곱의 거듭제곱에서는 지수를 곱해야 해요. 그다음에 더하거나 빼요.',
    'all-multiplied': '지수를 모두 곱했어요. 괄호의 거듭제곱에서만 곱하고, 그 뒤의 곱셈에서는 더해요.',
    'not-applied': '괄호 밖의 지수를 적용하지 않았어요. 괄호 밖의 지수는 괄호 안의 모든 문자에 하나씩 나누어 줘요.',
    subtracted: '지수를 뺐어요. 거듭제곱의 거듭제곱에서는 지수를 곱하니, 거꾸로 구할 때는 나눠요.',
    'base-same': '밑이 달라진 것을 생각하지 않았어요. 밑을 같은 수로 바꿔 쓰면 지수도 달라져요.'
  };
  var EXP = {
    mul: function (q) {
      var b = q.b, es = q.es, sum = es.reduce(function (s, x) { return s + x; }, 0), ones = es.filter(function (x) { return x === 1; }).length, show = function (x) { return x === 1 ? b : pw(b, x); };
      return { tex: es.map(show).join(' \\times ') + ' = ' + pw(b, SQ), ans: sum,
        wrong: { multiplied: es.reduce(function (s, x) { return s * x; }, 1), 'hidden-one': ones ? sum - ones : null },
        hints: [COUNT, '곱셈은 이어 붙이는 것이에요. $' + b + '$' + bj(b, '을/를') + ' ' + es.join('번, ') + '번 곱한 것을 차례로 이어 붙이면, $' + b + '$' + bj(b, '이/가') + ' 모두 몇 번 곱해졌는지 셀 수 있어요.' + (ones ? ' 지수가 안 보이는 $' + b + '$' + bj(b, '은/는') + ' 한 번 곱한 것이니 지수가 1이에요.' : ''),
          '① 각 거듭제곱의 지수를 읽어요. ② 밑이 같은 거듭제곱의 곱셈이니 지수를 모두 더해요: $' + es.join(' + ') + '$. ③ 그 합이 □ 안에 들어갈 수예요. 지수끼리 곱하지 않도록 조심해요.'],
        steps: [{ say: '밑이 같은 거듭제곱의 곱셈에서는 지수를 더해요.', tex: pw(b, es.join(' + ')) }, { say: '지수를 계산해요.', tex: es.join(' + ') + ' = ' + sum }],
        check: ipow(2, sum) === es.reduce(function (s, x) { return s * ipow(2, x); }, 1) };
    },
    pow: function (q) {
      var b = q.b, m = q.m, n = q.n;
      return { tex: '(' + pw(b, m) + ')^{' + n + '} = ' + pw(b, SQ), ans: m * n, wrong: { added: m + n },
        hints: [COUNT, '$(' + pw(b, m) + ')^{' + n + '}$은 $' + pw(b, m) + '$을 ' + n + '번 곱한 것이에요. $' + b + '$' + bj(b, '이/가') + ' ' + m + '개씩 든 묶음이 ' + n + '개 있는 것과 같아요. 달걀이 ' + m + '개씩 든 판이 ' + n + '판 있을 때 달걀의 수를 세는 것과 같은 계산이에요.',
          '① 한 묶음에 $' + b + '$' + bj(b, '이/가') + ' 몇 개 있는지 봐요(안쪽 지수). ② 묶음이 몇 개인지 봐요(바깥 지수). ③ 묶음마다 같은 개수이니 두 수를 곱해요: $' + m + ' \\times ' + n + '$. 두 지수를 더하지 않도록 조심해요.'],
        steps: [{ say: '거듭제곱의 거듭제곱에서는 지수를 곱해요.', tex: pw(b, m + ' \\times ' + n) }, { say: '지수를 계산해요.', tex: m + ' \\times ' + n + ' = ' + (m * n) }],
        check: ipow(ipow(2, m), n) === ipow(2, m * n) };
    },
    div: function (q) {
      var b = q.b, m = q.m, n = q.n, big = m > n, ans = abs(m - n);
      if (m === n) return null;
      return { tex: pw(b, m) + ' \\div ' + pw(b, n) + ' = ' + (big ? pw(b, SQ) : '\\dfrac{1}{' + pw(b, SQ) + '}'), ans: ans, wrong: { divided: big && m % n === 0 ? m / n : null, added: m + n },
        hints: [COUNT, '나눗셈은 분수로 쓰고 약분해요. 분자에 $' + b + '$' + bj(b, '이/가') + ' ' + m + '개, 분모에 $' + b + '$' + bj(b, '이/가') + ' ' + n + '개 곱해져 있어요. 위아래에서 같은 개수만큼 지워요. ' + (big ? '분자 쪽이 더 많으니 분자에 남아요.' : '분모 쪽이 더 많으니 분모에 남아요. 그래서 답이 분수 꼴이에요.'),
          '① 분자와 분모 가운데 개수가 적은 쪽을 찾아요. ② 그 개수만큼 위아래에서 지워요. ③ 남은 개수는 큰 수에서 작은 수를 뺀 것이에요: $' + Math.max(m, n) + ' - ' + Math.min(m, n) + '$. 지수를 나누지 않도록 조심해요.'],
        steps: [{ say: '분수로 쓰면 같은 것끼리 약분돼요. 지수는 빼요.', tex: '\\dfrac{' + pw(b, m) + '}{' + pw(b, n) + '} = ' + (big ? pw(b, m + ' - ' + n) : '\\dfrac{1}{' + pw(b, n + ' - ' + m) + '}') }, { say: '지수를 계산해요.', tex: Math.max(m, n) + ' - ' + Math.min(m, n) + ' = ' + ans }],
        check: big ? ipow(2, m) === ipow(2, n) * ipow(2, ans) : ipow(2, n) === ipow(2, m) * ipow(2, ans) };
    },
    combo: function (q) {
      var b = q.b, m = q.m, n = q.n, k = q.k, mulOp = q.op === '×', ans = mulOp ? m * n + k : m * n - k;
      if (ans < 1) return null;
      return { tex: '(' + pw(b, m) + ')^{' + n + '} ' + (mulOp ? '\\times' : '\\div') + ' ' + (k === 1 ? b : pw(b, k)) + ' = ' + pw(b, SQ), ans: ans, wrong: { 'all-added': mulOp ? m + n + k : m + n - k, 'all-multiplied': mulOp ? m * n * k : null },
        hints: [COUNT, '계산이 두 가지 섞여 있어요. 괄호의 거듭제곱을 먼저 풀고, 그다음에 ' + (mulOp ? '곱셈' : '나눗셈') + '을 해요. $(' + pw(b, m) + ')^{' + n + '}$은 $' + b + '$' + bj(b, '이/가') + ' ' + m + '개씩 든 묶음이 ' + n + '개라서 지수를 곱해요.',
          '① 괄호부터: 지수 $' + m + ' \\times ' + n + '$' + pj(n, '을/를') + ' 계산해요. ② 그 결과에 ' + (mulOp ? '$' + b + '$' + bj(b, '을/를') + ' ' + k + '번 더 곱하니 지수에 ' + k + josa(String(k), '을/를').slice(String(k).length) + ' 더해요.' : '$' + b + '$' + bj(b, '을/를') + ' ' + k + '개 약분하니 지수에서 ' + k + josa(String(k), '을/를').slice(String(k).length) + ' 빼요.') + ' ③ 곱하는 지수와 ' + (mulOp ? '더하는' : '빼는') + ' 지수를 헷갈리지 않도록 차례를 지켜요.'],
        steps: [{ say: '괄호의 거듭제곱을 먼저 풀어요. 지수를 곱해요.', tex: pw(b, m + ' \\times ' + n) + (mulOp ? ' \\times ' : ' \\div ') + (k === 1 ? b : pw(b, k)) }, { say: mulOp ? '곱셈이니 지수를 더해요.' : '나눗셈이니 지수를 빼요.', tex: m + ' \\times ' + n + (mulOp ? ' + ' : ' - ') + k + ' = ' + ans }],
        check: mulOp ? ipow(ipow(2, m), n) * ipow(2, k) === ipow(2, ans) : ipow(ipow(2, m), n) === ipow(2, ans) * ipow(2, k) };
    },
    prod: function (q) {
      var P = q.P, m = q.m, n = q.n, k = q.k, fr = q.frac, a = m === 1 ? P[0] : pw(P[0], m), b = n === 1 ? P[1] : pw(P[1], n);
      return { tex: fr ? '\\left(\\dfrac{' + a + '}{' + b + '}\\right)^{' + k + '} = \\dfrac{' + pw(P[0], m * k) + '}{' + pw(P[1], SQ) + '}' : '(' + a + b + ')^{' + k + '} = ' + pw(P[0], m * k) + pw(P[1], SQ), ans: n * k, wrong: { added: n + k, 'not-applied': n },
        hints: [INTRO['law-all'], '괄호 밖의 지수 ' + k + josa(String(k), '은/는').slice(String(k).length) + ' 괄호 안의 $' + P[0] + '$ 쪽과 $' + P[1] + '$ 쪽 모두에 적용돼요. 괄호 전체를 ' + k + '번 곱하면 $' + b + '$도 ' + k + '번 곱해지기 때문이에요. □는 $' + P[1] + '$의 지수예요.',
          '① 괄호 안에서 $' + P[1] + '$의 지수를 읽어요(안 보이면 1이에요). ② 그것이 ' + k + '번 곱해지니, 거듭제곱의 거듭제곱처럼 지수를 곱해요: $' + n + ' \\times ' + k + '$. ③ 더하지 않도록 조심해요.'],
        steps: [{ say: '괄호 밖의 지수를 괄호 안의 문자마다 적용해요.', tex: fr ? '\\dfrac{' + pw(P[0], m + ' \\times ' + k) + '}{' + pw(P[1], n + ' \\times ' + k) + '}' : pw(P[0], m + ' \\times ' + k) + pw(P[1], n + ' \\times ' + k) }, { say: '$' + P[1] + '$의 지수를 계산해요.', tex: n + ' \\times ' + k + ' = ' + (n * k) }],
        check: ipow(ipow(3, n), k) === ipow(3, n * k) };
    },
    find: function (q) {
      var b = q.b, m = q.m, t = q.t, isMul = q.op === '×', ans = isMul ? t - m : t / m;
      if (!Number.isInteger(ans) || ans < 1) return null;
      return { tex: isMul ? pw(b, SQ) + ' \\times ' + pw(b, m) + ' = ' + pw(b, t) : '(' + pw(b, SQ) + ')^{' + m + '} = ' + pw(b, t), ans: ans, wrong: isMul ? { divided: t % m === 0 ? t / m : null, added: t + m } : { subtracted: t - m, added: t + m },
        hints: [COUNT, isMul ? '곱셈에서는 지수를 더해요. 그러니 □와 ' + m + josa(String(m), '을/를').slice(String(m).length) + ' 더한 것이 오른쪽의 지수 ' + t + josa(String(t), '이/가').slice(String(t).length) + ' 되어야 해요. 지수만 따로 떼어서 식을 세울 수 있어요.' : '거듭제곱의 거듭제곱에서는 지수를 곱해요. 그러니 □에 ' + m + josa(String(m), '을/를').slice(String(m).length) + ' 곱한 것이 오른쪽의 지수 ' + t + josa(String(t), '이/가').slice(String(t).length) + ' 되어야 해요. 지수만 따로 떼어서 식을 세울 수 있어요.',
          isMul ? '① 지수만 보고 식을 세워요: $' + SQ + ' + ' + m + ' = ' + t + '$. ② 더해서 ' + t + josa(String(t), '이/가').slice(String(t).length) + ' 되는 수를 찾으려면 거꾸로 빼요. ③ 구한 수를 □에 넣어 왼쪽을 다시 계산해서 확인해요.' : '① 지수만 보고 식을 세워요: $' + SQ + ' \\times ' + m + ' = ' + t + '$. ② 곱해서 ' + t + josa(String(t), '이/가').slice(String(t).length) + ' 되는 수를 찾으려면 거꾸로 나눠요. ③ 구한 수를 □에 넣어 왼쪽을 다시 계산해서 확인해요.'],
        steps: [{ say: isMul ? '곱셈에서는 지수를 더하니, 지수끼리 이런 식이 돼요.' : '거듭제곱의 거듭제곱에서는 지수를 곱하니, 지수끼리 이런 식이 돼요.', tex: SQ + (isMul ? ' + ' : ' \\times ') + m + ' = ' + t }, { say: isMul ? '거꾸로 빼서 구해요.' : '거꾸로 나눠서 구해요.', tex: t + (isMul ? ' - ' : ' \\div ') + m + ' = ' + ans }],
        check: isMul ? ipow(2, ans) * ipow(2, m) === ipow(2, t) : ipow(ipow(2, ans), m) === ipow(2, t) };
    },
    base: function (q) {
      var c = q.c, k = q.k, big = ipow(c[0], c[1]), ans = c[1] * k;
      return { tex: pw(big, k) + ' = ' + pw(c[0], SQ), ans: ans, wrong: { 'base-same': k, added: c[1] + k },
        hints: [COUNT, '왼쪽과 오른쪽의 밑이 달라요. 밑을 같게 만들어야 지수를 견줄 수 있어요. ' + big + josa(String(big), '은/는').slice(String(big).length) + ' ' + c[0] + josa(String(c[0]), '을/를').slice(String(c[0]).length) + ' 몇 번 곱한 수인지 먼저 알아봐요. ' + big + ' = $' + pw(c[0], c[1]) + '$이에요.',
          '① 왼쪽의 밑 ' + big + josa(String(big), '을/를').slice(String(big).length) + ' $' + pw(c[0], c[1]) + '$' + '으로 바꿔 써요. 그러면 왼쪽은 $(' + pw(c[0], c[1]) + ')^{' + k + '}$이 돼요. ② 거듭제곱의 거듭제곱이니 지수를 곱해요: $' + c[1] + ' \\times ' + k + '$. ③ 그 수가 □예요.'],
        steps: [{ say: '밑을 ' + c[0] + '의 거듭제곱으로 바꿔 써요.', tex: pw(big, k) + ' = (' + pw(c[0], c[1]) + ')^{' + k + '}' }, { say: '거듭제곱의 거듭제곱이니 지수를 곱해요.', tex: c[1] + ' \\times ' + k + ' = ' + ans }],
        check: ipow(big, k) === ipow(c[0], ans) };
    }
  };
  (function () {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = EXP[v.q.kind](v.q); lastQ = v.q; } return lastP; };
    var TEXT = '□ 안에 알맞은 수를 구하세요.';
    var leak = function (p) { var a = String(p.ans); return p.ans > 19 && nums(p.tex).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    var where = function (v) { var p = P(v); return !!p && p.check === true && Number.isInteger(p.ans) && p.ans >= 1 && p.ans <= 60 && !leak(p); };
    var LB = function (r) { return r.pick(['a', 'b', 'x', 'y', '2', '3', '5']); };
    MH.defineType({
      id: 'B11.exp', unit: 'B11', version: 1, title: '지수 구하기',
      answer: { kind: 'int', common: false },
      levels: [
        { name: '곱셈 · 거듭제곱의 거듭제곱', where: where, vars: { q: sampler(function (r) {
            var k = r.int(0, 4);
            if (k <= 1) return { kind: 'mul', b: LB(r), es: [r.int(1, 9), r.int(2, 9)] };
            if (k === 2) return { kind: 'mul', b: LB(r), es: r.shuffle([r.int(1, 6), r.int(2, 6), r.int(1, 6)]) };
            return { kind: 'pow', b: LB(r), m: r.int(2, 9), n: r.int(2, 6) };
          }) } },
        { name: '나눗셈 · 섞인 계산', where: where, vars: { q: sampler(function (r) {
            var k = r.int(0, 3);
            if (k <= 1) return { kind: 'div', b: LB(r), m: r.int(2, 12), n: r.int(2, 12) };
            return { kind: 'combo', b: LB(r), m: r.int(2, 6), n: r.int(2, 5), k: r.int(1, 9), op: r.pick(['×', '÷']) };
          }) } },
        { name: '괄호의 거듭제곱 · 거꾸로 구하기', where: where, vars: { q: sampler(function (r) {
            var k = r.int(0, 4), m;
            if (k <= 1) return { kind: 'prod', P: r.pick(PAIR), m: r.int(1, 5), n: r.int(1, 6), k: r.int(2, 6), frac: r.int(0, 2) === 0 };
            if (k === 2) return { kind: 'find', b: LB(r), op: '×', m: r.int(2, 9), t: r.int(5, 20) };
            if (k === 3) { m = r.int(2, 6); return { kind: 'find', b: LB(r), op: 'pow', m: m, t: m * r.int(2, 8) }; }
            return { kind: 'base', c: r.pick([[2, 2], [2, 3], [2, 4], [3, 2], [3, 3], [5, 2]]), k: r.int(2, 9) };
          }) } }
      ],
      prompt: function (v) { return { tex: P(v).tex, text: TEXT }; },
      solve: function (v) { return P(v).ans; },
      verify: function (v, ans) { var p = P(v); return p.check === true && ans === p.ans; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: p.ans }; return out; },
      mistakes: Object.keys(W).map(function (id) {
        return { id: id,
          wrong: function (v) { var p = P(v), x = p.wrong[id]; return x === null || x === undefined || x === p.ans || !Number.isInteger(x) || x < 0 ? null : x; },
          explain: function () { return W[id]; } };
      })
    });
  })();
})();

/* ── 개념 카드 ── */
MH.defineConcept('B11', [
  { title: '지수는 곱한 횟수', body: [
    '거듭제곱은 같은 것을 여러 번 곱한 것을 짧게 쓴 것이에요. 곱해지는 것이 밑, 곱한 횟수가 지수예요.',
    { tex: 'a^{3} = a \\times a \\times a' },
    '지수법칙은 새로 외울 규칙이 아니라 "모두 몇 번 곱했나"를 세는 방법이에요. 헷갈리면 풀어서 써 보면 돼요.',
    { ex: [['a^{2} \\times a^{3}', '곱셈 — 2번 곱한 것 뒤에 3번을 이어 붙여요. 모두 5번: 지수를 더해요.'], ['(a^{2})^{3}', '거듭제곱의 거듭제곱 — 2개씩 3묶음이에요. 모두 6번: 지수를 곱해요.']] },
    '$a$처럼 지수가 안 보이는 문자는 지수가 1이에요.'
  ] },
  { title: '나눗셈은 약분', body: [
    '거듭제곱의 나눗셈은 분수로 쓰고 약분해요. 지워진 개수만큼 지수를 빼요.',
    { tex: 'a^{5} \\div a^{2} = \\dfrac{a \\times a \\times a \\times a \\times a}{a \\times a} = a^{3}' },
    { ex: [['a^{5} \\div a^{2} = a^{3}', '분자 쪽이 많으면 분자에 남아요.'], ['a^{2} \\div a^{2} = 1', '개수가 같으면 모두 지워져 1이 돼요(0이 아니에요).'], ['a^{2} \\div a^{5} = \\dfrac{1}{a^{3}}', '분모 쪽이 많으면 분모에 남아요.']] }
  ] },
  { title: '괄호의 거듭제곱', body: [
    '괄호 밖의 지수는 괄호 안의 수와 문자 모두에 하나씩 나누어 줘요. 괄호 전체를 여러 번 곱하면 안에 든 것이 모두 그만큼 곱해지기 때문이에요.',
    { ex: [['(ab)^{3} = a^{3}b^{3}', '문자마다 지수를 적용해요.'], ['(2a^{2})^{3} = 8a^{6}', '수 2도 3번 곱해서 8이에요(2 × 3 = 6이 아니에요).'], ['\\left(\\dfrac{a}{b^{2}}\\right)^{3} = \\dfrac{a^{3}}{b^{6}}', '분자와 분모에 각각 적용해요.']] },
    '음수는 짝수 번 곱하면 양수, 홀수 번 곱하면 음수예요. $(-a)^{2} = a^{2}$, $(-a)^{3} = -a^{3}$.'
  ] },
  { title: '단항식의 곱셈', body: [
    '수와 문자의 곱으로만 이루어진 식을 단항식이라고 해요. 단항식끼리 곱할 때는 종류별로 모아요.',
    { list: ['① 부호를 먼저 정해요. 음수가 홀수 개이면 −, 짝수 개이면 +.', '② 수(계수)끼리 곱해요.', '③ 같은 문자끼리 곱해요. 지수를 더해요.'] },
    { tex: '2x^{2}y \\times (-3xy^{3}) = (2 \\times (-3)) \\times (x^{2} \\times x) \\times (y \\times y^{3}) = -6x^{3}y^{4}' },
    '수는 맨 앞에, 문자는 알파벳 순서로 써요.'
  ] },
  { title: '단항식의 나눗셈', body: [
    '나누는 식을 통째로 분모에 써서 분수로 고쳐요. 그다음 수는 수끼리, 같은 문자는 같은 문자끼리 약분해요.',
    { tex: '12a^{5}b \\div 4a^{2}b = \\dfrac{12a^{5}b}{4a^{2}b} = 3a^{3}' },
    '분수가 곱해진 식으로 나눌 때는 역수를 곱해요. 이때 문자도 함께 분모로 가요.',
    { tex: '6a^{3} \\div \\dfrac{2}{3}a = 6a^{3} \\times \\dfrac{3}{2a} = 9a^{2}' },
    '곱셈과 나눗셈이 섞여 있으면 앞에서부터 차례로 계산해요. ÷ 는 바로 뒤의 식 하나만 분모로 보내요.'
  ] }
]);
