/* B12 다항식의 계산 — 다항식의 덧셈 · 뺄셈, (단항식) × (다항식), (다항식) ÷ (단항식)
   유형(쉬운 것부터): B12.add 일차식의 덧셈 · 뺄셈 · B12.quad 이차식의 덧셈 · 뺄셈 · B12.mono (단항식) × (다항식)
                     · B12.div (다항식) ÷ (단항식) · B12.mixed 섞인 계산 (여기까지 보기 고르기) · B12.coef 계수 구하기(키패드)
   답이 식이면 보기 고르기, 답이 수 하나(계수)이면 키패드다.
   식은 '조각'의 목록으로 다룬다: 조각 = { s: +1 | -1, kind: 'poly' | 'mul' | 'div', m: { c, d, e }, P: [항 …], back }
     poly  s·c(P)            괄호 앞에 수 c 가 곱해진 다항식(c = 1 이면 괄호만)
     mul   s·(c·문자)(P)     단항식 × 다항식(back 이면 뒤에서 곱한다)
     div   s·(P) ÷ (c/d·문자) 다항식 ÷ 단항식
   항 = { c: 정수 계수, e: { x: 2, y: 1 } }. 계산은 모두 정수로 한다. 틀린 보기는 '흔한 실수 하나를 저지른 계산'을 실제로 해서 만든다. */
(function () {
  'use strict';
  var MH = globalThis.MH, abs = Math.abs, poly = MH.alg.poly, order4 = MH.alg.order4, sameVal = MH.alg.sameVal;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var sgn = function (x) { return x < 0 ? -1 : 1; };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!ok(q) && ++i < 80); return q; };

  /* ── 항과 다항식 ── */
  var ORDER = ['a', 'b', 'x', 'y'];
  var T = function (c, e) { return { c: c, e: e || {} }; };
  var key = function (e) { return ORDER.filter(function (k) { return e[k]; }).map(function (k) { return k + (e[k] === 1 ? '' : '^{' + e[k] + '}'); }).join(''); };
  var deg = function (e) { return ORDER.reduce(function (s, k) { return s + (e[k] || 0); }, 0); };
  /** 차수가 높은 항부터, 같은 차수이면 앞 문자의 지수가 큰 항부터, 상수항은 맨 뒤 */
  var cmp = function (a, b) {
    var d = deg(b.e) - deg(a.e), i;
    for (i = 0; !d && i < ORDER.length; i++) d = (b.e[ORDER[i]] || 0) - (a.e[ORDER[i]] || 0);
    return d;
  };
  var addE = function (a, b, s) { var o = {}; ORDER.forEach(function (k) { var x = (a[k] || 0) + s * (b[k] || 0); if (x) o[k] = x; }); return o; };
  var maxE = function (a, b) { var o = {}; ORDER.forEach(function (k) { var x = Math.max(a[k] || 0, b[k] || 0); if (x) o[k] = x; }); return o; };
  var overlap = function (a, b) { return ORDER.some(function (k) { return a[k] && b[k]; }); };
  var ptex = function (ts, tight) { return poly(ts.map(function (t) { return [t.c, key(t.e)]; }), tight); };
  var mono = function (c, e) { var k = key(e); return (c < 0 ? '-' : '') + (abs(c) !== 1 || !k ? abs(c) : '') + k; };
  var par = function (s) { return s[0] === '-' ? '(' + s + ')' : s; };
  /** 동류항끼리 모은다. f.absAdd: 부호가 다른 두 동류항의 크기를 더해 버리는 실수 */
  var combine = function (ts, f) {
    var groups = {}, keys = [];
    ts.forEach(function (t) { var k = key(t.e); if (!groups[k]) { groups[k] = []; keys.push(k); } groups[k].push(t); });
    return keys.map(function (k) {
      var g = groups[k], c = g.reduce(function (s, t) { return s + t.c; }, 0);
      if (f && f.absAdd && g.length === 2 && g[0].c * g[1].c < 0) { f.hit = true; c = sgn(abs(g[0].c) >= abs(g[1].c) ? g[0].c : g[1].c) * (abs(g[0].c) + abs(g[1].c)); }
      return T(c, g[0].e);
    }).filter(function (t) { return t.c !== 0; }).sort(cmp);
  };

  /* ── 조각 하나를 푼다. f 에 실수를 적으면 그 실수를 저지른다(저질렀으면 f.hit) ── */
  var partTerms = function (p, idx, f) {
    var m = p.m, hasL = key(m.e) !== '', eff = p.s * m.c, many = p.P.length > 1;
    return p.P.map(function (t, i) {
      var c, e;
      if (p.kind === 'div') {
        c = p.s * t.c * m.d / m.c; e = addE(t.e, m.e, -1);
        if (f.divAsMul && hasL) { f.hit = true; e = addE(t.e, m.e, 1); }
        if (f.denDrop && m.d !== 1) { f.hit = true; c = p.s * t.c / m.c; }
      } else {
        c = p.s * m.c * t.c; e = addE(m.e, t.e, 1);
        if (f.expKeep && overlap(m.e, t.e)) { f.hit = true; e = maxE(m.e, t.e); }
        if (f.coefAdd && hasL && abs(m.c) > 1) { f.hit = true; c = sgn(c) * (abs(m.c) + abs(t.c)); }
      }
      if (f.distFirst && i > 0 && (abs(m.c) > 1 || m.d !== 1 || hasL)) { f.hit = true; c = t.c; e = t.e; }
      if (f.signFirst && i > 0 && eff < 0) { f.hit = true; c = -c; }
      if (f.subAsAdd && idx > 0 && p.s < 0) { f.hit = true; c = -c; }
      return T(c, e);
    });
  };
  /** 식 전체를 계산한다 → { R: 답(모은 것), all: 괄호만 푼 것 }. 실수 f 가 이 식에서 일어날 수 없으면 null */
  var evaluate = function (Q, f) {
    f = f ? Object.assign({}, f) : {};
    var flawed = Object.keys(f).length > 0, all = [], R, i, ks;
    Q.parts.forEach(function (p, idx) { all = all.concat(partTerms(p, idx, f)); });
    R = combine(all, f);
    if (f.vanish && Q.parts.length === 1 && Q.parts[0].kind === 'div' && R.length > 1) {
      i = R.map(function (t) { return key(t.e); }).indexOf('');
      if (i >= 0) { f.hit = true; R.splice(i, 1); }
    }
    if (f.expSum) R = R.map(function (t) { ks = Object.keys(t.e); if (ks.length === 1 && t.e[ks[0]] === 2) { f.hit = true; var e = {}; e[ks[0]] = 4; return T(t.c, e); } return t; }).sort(cmp);
    if (f.lastSign && R.length >= 2) { f.hit = true; R[R.length - 1] = T(-R[R.length - 1].c, R[R.length - 1].e); }
    if (f.firstSign && R.length >= 1) { f.hit = true; R[0] = T(-R[0].c, R[0].e); }
    if (f.coefOff && R.length >= 1) { f.hit = true; R[0] = T(R[0].c + sgn(R[0].c), R[0].e); }
    if (f.coefOffLast && R.length >= 2) { f.hit = true; R[R.length - 1] = T(R[R.length - 1].c + sgn(R[R.length - 1].c), R[R.length - 1].e); }
    return flawed && !f.hit ? null : { R: R, all: all };
  };
  /** 실수 id → [계산에 넣는 실수, 설명] */
  var FLAW = {
    'sign-first': [{ signFirst: 1 }, '괄호 앞의 −를 첫 항에만 적용했어요. 괄호 앞의 −는 괄호 안의 모든 항에 적용돼요. $-(a - b)$는 $-a + b$예요. 뒤의 항도 부호가 바뀌어요.'],
    'sub-as-add': [{ subAsAdd: 1 }, '빼야 하는 식을 더했어요. 괄호 앞에 −가 있으면 괄호 안의 모든 항의 부호를 반대로 바꾼 다음에 계산해요.'],
    'dist-first': [{ distFirst: 1 }, '괄호 앞의 것을 첫 항에만 계산했어요. 분배법칙은 괄호 안의 모든 항에 하나씩 적용해요. $2(a + b)$는 $2a + 2b$예요.'],
    'abs-added': [{ absAdd: 1 }, '부호가 다른 동류항의 수를 그냥 더했어요. $5x - 2x$처럼 부호가 다르면 큰 쪽에서 작은 쪽을 빼요. 가진 돈 5에서 빚 2를 갚는 것과 같아요.'],
    'exp-added': [{ expSum: 1 }, '덧셈인데 지수를 더했어요. $x^{2} + x^{2}$은 $x^{2}$이 2개라서 $2x^{2}$이에요. 덧셈 · 뺄셈에서는 계수만 달라지고 문자와 지수는 그대로예요.'],
    'exp-not-added': [{ expKeep: 1 }, '같은 문자를 곱했는데 지수가 그대로예요. $x \\times x$는 $x$가 아니라 $x^{2}$이에요. 같은 문자끼리 곱하면 지수를 더해요.'],
    'coef-added': [{ coefAdd: 1 }, '수(계수)를 더했어요. 곱셈이니 수끼리도 곱해요. $2x \\times 3x$는 $5x^{2}$이 아니라 $6x^{2}$이에요.'],
    'div-as-mul': [{ divAsMul: 1 }, '나누는 식의 문자를 곱했어요. 나누는 식은 수도 문자도 통째로 분모로 가요. 그래서 같은 문자의 지수는 더하지 않고 빼요.'],
    'denominator-dropped': [{ denDrop: 1 }, '분수의 분자로만 나누고 분모를 빠뜨렸어요. 분수로 나누는 것은 역수를 곱하는 것이에요. 그러면 분모였던 수가 위로 올라와 곱해져요.'],
    'term-vanished': [{ vanish: 1 }, '같은 것끼리 나눈 항을 빠뜨렸어요. $2x \\div 2x$는 0이 아니라 1이에요. 모두 약분되어도 1이 남으니 그 항을 꼭 써야 해요.'],
    'term-sign': [{ lastSign: 1 }, '마지막 항의 부호가 틀렸어요. 항마다 앞의 부호(+, −)를 함께 가져가서 계산했는지 뒤의 항부터 다시 확인해 보세요.'],
    'first-sign': [{ firstSign: 1 }, '첫 항의 부호가 틀렸어요. 음수와 음수를 곱하면 양수, 양수와 음수를 곱하면 음수예요. 첫 항의 부호를 다시 확인해 보세요.'],
    'coef-off': [{ coefOff: 1 }, '첫 항의 계수 계산이 틀렸어요. 그 항에 들어가는 수들을 부호까지 따로 적어서 다시 계산해 보세요.'],
    'coef-off-last': [{ coefOffLast: 1 }, '마지막 항의 계수 계산이 틀렸어요. 그 항에 들어가는 수들을 부호까지 따로 적어서 다시 계산해 보세요.']
  };
  var SPARE = { 'coef-off': 1, 'coef-off-last': 1 };

  /* ── 식을 쓰는 꼴 ── */
  var fracOf = function (m) { return '\\dfrac{' + abs(m.c) + '}{' + m.d + '}' + key(m.e); };
  var divisorTex = function (m) { return m.d === 1 ? par(mono(m.c, m.e)) : m.c < 0 ? '\\left(-' + fracOf(m) + '\\right)' : fracOf(m); };
  /** 분수 계수 단항식의 역수: (2/3)x → 3/(2x) */
  var inverseTex = function (m, s) { var t = '\\dfrac{' + m.d + '}{' + mono(abs(m.c), m.e) + '}'; return s * m.c < 0 ? '\\left(-' + t + '\\right)' : t; };
  var partTex = function (p, i) {
    var body = '(' + ptex(p.P) + ')', lead = i ? (p.s < 0 ? ' - ' : ' + ') : (p.s < 0 ? '-' : ''), M = mono(p.m.c, p.m.e);
    if (p.kind === 'poly') return lead + (p.m.c === 1 ? '' : p.m.c) + body;
    if (p.kind === 'mul') return lead + (p.back ? body + ' \\times ' + par(M) : M + body);
    return lead + body + ' \\div ' + divisorTex(p.m);
  };
  var rawTex = function (Q) { return Q.parts.map(partTex).join(''); };
  /** 조각 하나를 어떻게 푸는지(힌트용). 수식 바로 뒤에 조사가 오지 않게 쓴다 */
  var describe = function (p, i) {
    var shown = partTex(p, i).replace(/^ [+] /, '').replace(/^ - /, '-'), m = p.m, sc = p.s * m.c, each;
    if (p.kind === 'poly' && m.c === 1) return '$' + shown + '$ → ' + (p.s > 0 ? '괄호 앞에 곱해진 수가 없어요. 괄호를 그대로 벗겨요.' : '괄호 앞에 −가 있어요. 괄호 안의 모든 항의 부호를 반대로 바꿔요(+는 −로, −는 +로).');
    if (p.kind === 'div') {
      if (m.d !== 1) return '$' + shown + '$ → 나누는 식에 분수가 곱해져 있어요. 나누는 대신 역수 $' + inverseTex(m, 1) + '$ 곱하기로 바꿔요. 그다음 괄호 안의 모든 항에 하나씩 곱해요.' + (p.s < 0 ? ' 앞에 −가 있으니 나온 항의 부호를 모두 바꿔요.' : '');
      each = p.P.map(function (t) { return '$\\dfrac{' + mono(t.c, t.e) + '}{' + mono(m.c, m.e) + '}$'; }).join(', ');
      return '$' + shown + '$ → 괄호 안의 모든 항을 하나씩 나눠요: ' + each + '. 수는 수끼리 나누고, 같은 문자는 지수를 빼요.' + (p.s < 0 ? ' 앞에 −가 있으니 나온 항의 부호를 모두 바꿔요.' : '');
    }
    each = p.P.map(function (t) { return '$' + mono(sc, m.e) + ' \\times ' + par(mono(t.c, t.e)) + '$'; }).join(', ');
    return '$' + shown + '$ → 괄호 안의 모든 항에 하나씩 곱해요: ' + each + '. 첫 항에만 곱하지 않도록 조심해요.';
  };
  var likeNote = function (all, R) {
    var count = {}, names;
    all.forEach(function (t) { var k = key(t.e); count[k] = (count[k] || 0) + 1; });
    names = Object.keys(count).filter(function (k) { return count[k] > 1; }).map(function (k) { return k ? '$' + k + '$ 항' : '수만 있는 항'; });
    return names.length ? '괄호를 풀고 나면 같은 종류의 항(동류항)이 보여요. 이 식에서는 ' + names.join(', ') + '끼리 모을 수 있어요. 문자와 지수가 모두 같아야 동류항이에요.'
      : '괄호를 풀고 나면 이 식에는 동류항이 없어요. 더 모을 것이 없으니, 나온 항을 차수가 높은 것부터 차례로 쓰면 돼요.';
  };
  var INTRO = {
    add: '다항식의 덧셈과 뺄셈은 같은 종류끼리 모으는 일이에요. 사과 3개와 배 2개에 사과 1개를 더하면 사과끼리만 합쳐지죠. 문자와 지수가 똑같은 항(동류항)끼리만 계수를 더하거나 빼요. 괄호 앞에 −가 있으면 괄호 안의 모든 항의 부호가 바뀌어요. 빚 묶음을 통째로 없애는 것과 같아서, 묶음 안의 것이 하나도 빠짐없이 바뀌어요.',
    quad: '$x^{2}$ 항과 $x$ 항은 서로 다른 종류예요. 넓이(㎡)와 길이(m)를 더할 수 없는 것과 같아요. 그래서 이차식의 덧셈 · 뺄셈에서는 $x^{2}$ 항끼리, $x$ 항끼리, 수끼리 따로 모아요. 이때 계수만 더하거나 빼고, 문자와 지수는 그대로 둬요.',
    mono: '(단항식) × (다항식)은 분배법칙으로 계산해요. 한 봉지에 사과 3개와 배 4개가 들어 있을 때 봉지가 2개이면 사과도 2배, 배도 2배가 되죠. 괄호 밖의 단항식을 괄호 안의 모든 항에 하나씩 곱해요. 곱할 때는 수는 수끼리, 같은 문자는 지수를 더해요.',
    div: '(다항식) ÷ (단항식)은 괄호 안의 모든 항을 하나씩 나누는 계산이에요. 사과 6개와 배 4개를 두 사람이 나누면 사과도 반, 배도 반씩 갖는 것과 같아요. 분수로 쓰고 항마다 약분하면 돼요. 수는 수끼리 나누고, 같은 문자는 지수를 빼요.',
    mixed: '계산이 섞여 있으면 차례를 지켜요. 먼저 곱셈과 나눗셈으로 괄호를 모두 풀고, 그다음에 동류항끼리 모아요. 괄호를 풀 때는 괄호 앞의 것(수, 문자, 부호)을 괄호 안의 모든 항에 하나씩 적용해요.',
    coef: '계수는 문자 앞에 곱해진 수예요. 부호도 계수에 들어가요. $-3x^{2}$에서 $x^{2}$의 계수는 −3이에요. 문자 없이 수만 있는 항은 상수항이라고 해요. 식을 간단히 한 다음에 그 항 앞의 수를 읽으면 돼요.'
  };
  /** 문제 하나의 힌트 · 풀이 */
  var explainQ = function (Q, kind, res) {
    var all = res.all, R = res.R, single = Q.parts.length === 1, p0 = Q.parts[0], ansT = ptex(R, true), steps = [], expanded = ptex(all);
    var h2 = '이 식의 괄호를 하나씩 봐요. ' + Q.parts.map(describe).join(' ');
    var h3 = '① 위에서 본 대로 괄호를 모두 풀어서 한 줄로 써요. 이때 항마다 앞의 부호를 꼭 함께 써요. ② ' + likeNote(all, R) + ' ③ 동류항끼리 계수를 계산해요. 부호가 다르면 큰 쪽에서 작은 쪽을 빼고, 큰 쪽의 부호를 붙여요.';
    if (single && p0.kind === 'mul') h3 = '① 위에서 본 곱셈을 하나씩 따로 계산해요. ② 곱셈마다 차례는 부호 → 수 → 문자예요. 음수가 하나이면 −, 둘이면 +예요. 수는 수끼리 곱하고, 같은 문자끼리 곱하면 지수를 더해요($x \\times x = x^{2}$). ③ 나온 항을 부호와 함께 차례로 이어 쓰면 끝이에요. 항의 수는 괄호 안의 항의 수와 같아야 해요.';
    else if (single) h3 = '① 위에서 본 대로 항마다 따로 계산해요. ② 항마다 차례는 부호 → 수 → 문자예요. 음수가 하나이면 −, 둘이면 +예요. 수는 수끼리 계산하고, 같은 문자는 약분해서 지수를 빼요. 같은 것끼리 나누면 0이 아니라 1이에요. ③ 나온 항을 부호와 함께 차례로 이어 쓰면 끝이에요. 항의 수는 괄호 안의 항의 수와 같아야 해요.';
    else if (R.length === all.length) h3 = '① 위에서 본 대로 괄호를 모두 풀어서 한 줄로 써요. 이때 항마다 앞의 부호를 꼭 함께 써요. ② ' + likeNote(all, R) + ' ③ 항마다 부호가 맞는지 한 번 더 확인해요.';
    if (single && p0.kind === 'mul') steps.push({ say: '괄호 밖의 단항식을 괄호 안의 모든 항에 하나씩 곱해요(분배법칙).', tex: p0.P.map(function (t, i) { return (i ? ' + ' + par(mono(p0.m.c, p0.m.e)) : mono(p0.m.c, p0.m.e)) + ' \\times ' + par(mono(t.c, t.e)); }).join('') });
    else if (single && p0.kind === 'div' && p0.m.d === 1) steps.push({ say: '괄호 안의 모든 항을 하나씩 나눠요. 분수로 쓰면 약분하기 쉬워요.', tex: p0.P.map(function (t, i) { return (i ? (t.c < 0 ? ' - ' : ' + ') : (t.c < 0 ? '-' : '')) + '\\dfrac{' + mono(abs(t.c), t.e) + '}{' + mono(p0.m.c, p0.m.e) + '}'; }).join('') });
    else if (single && p0.kind === 'div') {
      steps.push({ say: '분수가 곱해진 식으로 나누는 것은 그 역수를 곱하는 것이에요. 문자도 함께 분모로 가요.', tex: '(' + ptex(p0.P) + ') \\times ' + inverseTex(p0.m, 1) });
      steps.push({ say: '괄호 안의 모든 항에 하나씩 곱해요.', tex: p0.P.map(function (t, i) { return (i ? ' + ' : '') + par(mono(t.c, t.e)) + ' \\times ' + inverseTex(p0.m, 1); }).join('') });
    } else {
      steps.push({ say: '괄호를 모두 풀어요. 괄호 앞의 수 · 문자 · 부호를 괄호 안의 모든 항에 적용해요.', tex: expanded });
      if (R.length < all.length) {
        var sorted = all.map(function (t, i) { return [t, i]; }).sort(function (a, b) { return cmp(a[0], b[0]) || a[1] - b[1]; }).map(function (x) { return x[0]; });
        if (ptex(sorted) !== expanded) steps.push({ say: '동류항끼리 모아요. 항 앞의 부호를 함께 가져가요.', tex: ptex(sorted) });
      }
    }
    steps.push({ say: single ? (p0.kind === 'mul' ? '수는 수끼리 곱하고, 같은 문자는 지수를 더해요.' : '항마다 약분해요. 수는 수끼리 나누고, 같은 문자는 지수를 빼요.') : R.length < all.length ? '동류항끼리 계수를 계산해요.' : '차수가 높은 항부터 차례로 써요.', tex: ansT });
    return { hints: [INTRO[kind], h2, h3], steps: steps };
  };

  /* ── 답이 식인 유형의 공통 틀 ──
     o = { id, title, kind, ids: [실수 id …(앞의 것부터 보기로 쓴다)], levels }   v.q = { parts, c: 보기 후보를 돌리는 수, o: 보기 순서 } */
  var hasLetter = function (R) { return R.length > 0 && R.every(function (t) { return abs(t.c) <= 99; }) && R.some(function (t) { return key(t.e) !== ''; }); };
  var exprType = function (o) {
    var lastQ = null, lastP = null;
    var build = function (q) {
      var res = evaluate(q), raw = rawTex(q), ansT, cands, main, spare, wrong = [], k, c, ex;
      if (!hasLetter(res.R)) return null;
      ansT = ptex(res.R, true);
      cands = o.ids.map(function (id) { var w = evaluate(q, FLAW[id][0]); return w && hasLetter(w.R) && w.R.length <= 4 ? [ptex(w.R, true), id, FLAW[id][1]] : null; }).filter(Boolean);
      main = cands.filter(function (x) { return !SPARE[x[1]]; }); spare = cands.filter(function (x) { return SPARE[x[1]]; });
      for (k = 0; k < main.length + spare.length && wrong.length < 3; k++) {
        c = k < main.length ? main[(k + q.c) % main.length] : spare[k - main.length];
        if (c[0] !== ansT && wrong.every(function (w) { return w[0] !== c[0]; })) wrong.push(c);
      }
      ex = explainQ(q, o.kind, res);
      ex.steps[ex.steps.length - 1].value = ansT;
      return { raw: raw, ans: ansT, wrong: wrong, hints: ex.hints, steps: ex.steps, check: wrong.length === 3 && sameVal(raw, ansT) && wrong.every(function (w) { return !sameVal(w[0], ansT); }) };
    };
    var P = function (v) { if (v.q !== lastQ) { lastP = build(v.q); lastQ = v.q; } return lastP; };
    var options = function (v) { var p = P(v), list = [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v); return !!p && p.check === true; };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B12', version: 1, title: o.title,
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
  var LET = ['x', 'a', 'y', 'b'], PAIR = [['x', 'y'], ['a', 'b']];
  var e1 = function (k, n) { var o = {}; if (n) o[k] = n; return o; };
  var e2 = function (P, m, n) { var o = {}; if (m) o[P[0]] = m; if (n) o[P[1]] = n; return o; };
  var lin2 = function (r, P, m) { return [T(nz(r, -m, m), e1(P[0], 1)), T(nz(r, -m, m), e1(P[1], 1))]; };
  var lin3 = function (r, P, m) { return lin2(r, P, m).concat([T(nz(r, -m, m), {})]); };
  var quad3 = function (r, L, m) { return [T(nz(r, -m, m), e1(L, 2)), T(nz(r, -m, m), e1(L, 1)), T(nz(r, -m, m), {})]; };
  var quad2 = function (r, L, m) { var q = quad3(r, L, m); q.splice(r.int(0, 2), 1); return q; };
  var part = function (s, kind, m, P, back) { return { s: s, kind: kind, m: { c: m[0], d: m[1] || 1, e: m[2] || {} }, P: P, back: !!back }; };
  var Qm = function (r, parts) { return { parts: parts, c: r.int(0, 9), o: order4(r) }; };
  var times = function (ts, c, e) { return ts.map(function (t) { return T(t.c * c, addE(t.e, e, 1)); }); };
  /** 답의 항이 n 개 이상이고 계수가 lim 이하 */
  var tidy = function (n, lim) { return function (q) { var R = evaluate(q).R; return R.length >= n && R.every(function (t) { return abs(t.c) <= lim; }); }; };

  /* ── B12.add 일차식의 덧셈 · 뺄셈 ───────────────────── */
  exprType({
    id: 'B12.add', title: '다항식의 덧셈 · 뺄셈', kind: 'add',
    ids: ['sign-first', 'sub-as-add', 'dist-first', 'abs-added', 'term-sign', 'first-sign', 'coef-off'],
    levels: [
      { name: '덧셈', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR), g = r.int(0, 2) ? lin2 : lin3;
          return until(function () { return Qm(r, [part(1, 'poly', [1], g(r, P, 9)), part(1, 'poly', [1], g(r, P, 9))]); }, tidy(2, 18));
        }) } },
      { name: '뺄셈', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR), g = r.int(0, 2) ? lin2 : lin3;
          return until(function () { return Qm(r, [part(1, 'poly', [1], g(r, P, 9)), part(-1, 'poly', [1], g(r, P, 9))]); }, tidy(2, 18));
        }) } },
      { name: '수가 곱해진 괄호', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR), g = r.int(0, 2) ? lin2 : lin3;
          return until(function () { return Qm(r, [part(1, 'poly', [r.pick([1, 2, 2, 3, 4])], g(r, P, 6)), part(pm(r, 1), 'poly', [r.int(2, 5)], g(r, P, 6))]); }, tidy(2, 40));
        }) } }
    ]
  });

  /* ── B12.quad 이차식의 덧셈 · 뺄셈 ───────────────────── */
  exprType({
    id: 'B12.quad', title: '이차식의 덧셈 · 뺄셈', kind: 'quad',
    ids: ['sign-first', 'sub-as-add', 'dist-first', 'exp-added', 'abs-added', 'term-sign', 'first-sign'],
    levels: [
      { name: '덧셈', vars: { q: sampler(function (r) {
          var L = r.pick(LET);
          return until(function () { return Qm(r, [part(1, 'poly', [1], quad3(r, L, 9)), part(1, 'poly', [1], r.int(0, 2) ? quad3(r, L, 9) : quad2(r, L, 9))]); }, tidy(2, 18));
        }) } },
      { name: '뺄셈', vars: { q: sampler(function (r) {
          var L = r.pick(LET);
          return until(function () { return Qm(r, [part(1, 'poly', [1], quad3(r, L, 9)), part(-1, 'poly', [1], r.int(0, 2) ? quad3(r, L, 9) : quad2(r, L, 9))]); }, tidy(2, 18));
        }) } },
      { name: '수가 곱해진 괄호', vars: { q: sampler(function (r) {
          var L = r.pick(LET);
          return until(function () { return Qm(r, [part(1, 'poly', [r.pick([1, 2, 2, 3])], r.int(0, 1) ? quad3(r, L, 5) : quad2(r, L, 5)), part(pm(r, 1), 'poly', [r.int(2, 4)], r.int(0, 1) ? quad3(r, L, 5) : quad2(r, L, 5))]); }, tidy(2, 36));
        }) } }
    ]
  });

  /* ── B12.mono (단항식) × (다항식) ───────────────────── */
  exprType({
    id: 'B12.mono', title: '(단항식) × (다항식)', kind: 'mono',
    ids: ['dist-first', 'sign-first', 'exp-not-added', 'coef-added', 'term-sign', 'first-sign'],
    levels: [
      { name: '문자가 한 가지', vars: { q: sampler(function (r) {
          var L = r.pick(LET);
          return until(function () { return Qm(r, [part(1, 'mul', [nz(r, -6, 6), 1, e1(L, 1)], [T(nz(r, -9, 9), e1(L, 1)), T(nz(r, -9, 9), {})])]); }, tidy(2, 54));
        }) } },
      { name: '문자가 두 가지', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR), k = r.int(0, 1);
          return until(function () { return Qm(r, [part(1, 'mul', [nz(r, -6, 6), 1, e1(P[k], 1)], r.int(0, 2) ? lin2(r, P, 9) : lin3(r, P, 7))]); }, tidy(2, 54));
        }) } },
      { name: '항이 셋 · 뒤에서 곱하기', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR), k = r.int(0, 3);
          return until(function () {
            if (k === 0) return Qm(r, [part(1, 'mul', [nz(r, -5, 5), 1, e1(P[0], 1)], quad3(r, P[0], 7), true)]);
            if (k === 1) return Qm(r, [part(1, 'mul', [nz(r, -5, 5), 1, e2(P, 1, 1)], lin3(r, P, 7), r.int(0, 1) === 1)]);
            if (k === 2) return Qm(r, [part(1, 'mul', [nz(r, -5, 5), 1, e1(P[0], 2)], lin3(r, P, 7))]);
            return Qm(r, [part(1, 'mul', [nz(r, -6, 6), 1, e1(P[1], 1)], lin3(r, P, 8), true)]);
          }, tidy(3, 48));
        }) } }
    ]
  });

  /* ── B12.div (다항식) ÷ (단항식) ───────────────────── */
  var POOL = [{ x: 1 }, { y: 1 }, {}, { x: 1, y: 1 }, { x: 2 }, { y: 2 }];
  var quotient = function (r, P, n, m) {
    return r.shuffle(POOL.slice()).slice(0, n).map(function (e) { return T(nz(r, -m, m), e2(P, e.x || 0, e.y || 0)); }).sort(cmp);
  };
  var FR = [[1, 2], [1, 3], [2, 3], [3, 2], [3, 4], [2, 5], [1, 4]];
  exprType({
    id: 'B12.div', title: '(다항식) ÷ (단항식)', kind: 'div',
    ids: ['dist-first', 'div-as-mul', 'term-vanished', 'sign-first', 'denominator-dropped', 'term-sign', 'first-sign'],
    levels: [
      { name: '문자가 한 가지', vars: { q: sampler(function (r) {
          var L = r.pick(LET), c = r.int(0, 3) ? r.int(2, 6) : -r.int(2, 6), three = r.int(0, 3) === 0;
          return until(function () {
            var qt = three ? quad3(r, L, 6) : [T(nz(r, -9, 9), e1(L, 1)), T(nz(r, -9, 9), {})];
            return Qm(r, [part(1, 'div', [c, 1, e1(L, 1)], times(qt, c, e1(L, 1)))]);
          }, tidy(2, 9));
        }) } },
      { name: '문자가 두 가지', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR), e = r.pick([e2(P, 1, 0), e2(P, 0, 1), e2(P, 1, 1)]), c = pm(r, r.int(2, 6));
          return until(function () { return Qm(r, [part(1, 'div', [c, 1, e], times(quotient(r, P, r.int(2, 3), 8), c, e))]); }, tidy(2, 8));
        }) } },
      { name: '분수 계수로 나누기', vars: { q: sampler(function (r) {
          var P = r.pick(PAIR), e = r.pick([e2(P, 1, 0), e2(P, 0, 1), e2(P, 1, 1)]), f = r.pick(FR), c = pm(r, f[0]);
          /* 나뉘는 식의 계수는 분자의 배수: (c·k) ÷ (c/d) = d·k */
          return until(function () { return Qm(r, [part(1, 'div', [c, f[1], e], times(quotient(r, P, r.int(2, 3), 5), c, e))]); }, tidy(2, 25));
        }) } }
    ]
  });

  /* ── B12.mixed 섞인 계산 ────────────────────────── */
  var mulPart = function (r, s, L, m) { return part(s, 'mul', [s === 1 && r.int(0, 2) === 0 ? -r.int(1, m) : r.int(1, m), 1, e1(L, 1)], [T(nz(r, -6, 6), e1(L, 1)), T(nz(r, -6, 6), {})]); };
  var divPart = function (r, s, P, quot) { var c = r.int(2, 5), e = r.pick([e2(P, 1, 0), e2(P, 0, 1)]); return part(s, 'div', [c, 1, e], times(quot, c, e)); };
  var mixedQ = [
    function (r) { var L = r.pick(LET), s = pm(r, 1), a = mulPart(r, 1, L, 5), b = mulPart(r, s, L, 5); b.m.c = abs(b.m.c); return Qm(r, [a, b]); },
    function (r) { var P = r.pick(PAIR), s = pm(r, 1); return Qm(r, [divPart(r, 1, P, lin2(r, P, 6)), part(s, 'poly', [r.int(1, 4)], lin2(r, P, 5))]); },
    function (r) {
      var P = r.pick(PAIR), s = pm(r, 1), k = r.int(0, 2), sq = function () { return [T(nz(r, -6, 6), e2(P, 2, 0)), T(nz(r, -6, 6), e2(P, 1, 1))]; };
      if (k === 0) return Qm(r, [part(1, 'mul', [nz(r, -4, 4), 1, e1(P[0], 1)], lin2(r, P, 5)), divPart(r, s, P, sq())]);
      if (k === 1) return Qm(r, [divPart(r, 1, P, sq()), part(s, 'mul', [r.int(1, 4), 1, e1(P[0], 1)], lin2(r, P, 5))]);
      return Qm(r, [divPart(r, 1, P, lin3(r, P, 6)), divPart(r, s, P, lin3(r, P, 6))]);
    }
  ];
  exprType({
    id: 'B12.mixed', title: '섞인 계산', kind: 'mixed',
    ids: ['dist-first', 'sign-first', 'sub-as-add', 'exp-not-added', 'div-as-mul', 'abs-added', 'term-sign', 'first-sign'],
    levels: [
      { name: '곱셈과 덧셈 · 뺄셈', vars: { q: sampler(function (r) { return until(function () { return mixedQ[0](r); }, tidy(2, 40)); }) } },
      { name: '나눗셈과 덧셈 · 뺄셈', vars: { q: sampler(function (r) { return until(function () { return mixedQ[1](r); }, tidy(2, 30)); }) } },
      { name: '곱셈과 나눗셈이 함께', vars: { q: sampler(function (r) { return until(function () { return mixedQ[2](r); }, tidy(2, 36)); }) } }
    ]
  });

  /* ── B12.coef 계수 구하기 (키패드) ───────────────────
     v.q = { parts, want: [문자 부분 …('' 는 상수항)] } 계산한 식에서 want 의 계수(둘이면 그 합)를 구한다 */
  (function () {
    var IDS = ['sign-first', 'sub-as-add', 'dist-first', 'abs-added', 'exp-not-added'];
    var lastQ = null, lastP = null;
    var nameOf = function (k) { return k ? '$' + k + '$의 계수' : '상수항'; };
    var coefOf = function (R, want) {
      var cs = want.map(function (k) { var t = R.filter(function (x) { return key(x.e) === k; })[0]; return t ? t.c : null; });
      return cs.indexOf(null) >= 0 ? null : cs;
    };
    var total = function (cs) { return cs.reduce(function (s, x) { return s + x; }, 0); };
    var build = function (q) {
      var res = evaluate(q), raw = rawTex(q), cs = coefOf(res.R, q.want), ans, ex, wrong = {}, names = q.want.map(nameOf), ask, last;
      if (!cs) return null;
      ans = total(cs);
      IDS.forEach(function (id) { var w = evaluate(q, FLAW[id][0]), c = w && coefOf(w.R, q.want); if (c && total(c) !== ans) wrong[id] = total(c); });
      ask = names.length === 1 ? names[0] + '를' : names[0] + '와 ' + names[1] + '의 합을';
      if (names.length === 1 && names[0] === '상수항') ask = '상수항을';
      ex = explainQ(q, 'coef', res);
      last = ex.steps[ex.steps.length - 1];
      ex.steps[ex.steps.length - 1] = { say: last.say, tex: ptex(res.R) };
      ex.steps.push({ say: (names.length === 1 ? '구하는 것은 ' + names[0] + '예요. 그 항 앞의 수를 부호까지 함께 읽어요.' : '구하는 것은 ' + names.join('와 ') + '의 합이에요. 두 수를 부호까지 함께 읽어서 더해요.').replace('상수항예요', '상수항이에요'), tex: cs.length === 1 ? String(ans) : cs[0] + ' + ' + par(String(cs[1])) + ' = ' + ans });
      return { raw: raw, text: '이 식을 계산했을 때, ' + ask + ' 구하세요.', ans: ans, wrong: wrong, steps: ex.steps,
        hints: [INTRO.coef, ex.hints[1], '① 괄호를 모두 풀어서 한 줄로 써요. ② 구하는 항과 같은 종류의 항만 골라요. 다른 항은 계산하지 않아도 돼요. ③ 고른 항의 계수를 부호까지 함께 계산해요. ' + (names.length === 2 ? '두 가지를 각각 구한 다음 더해요. ' : '') + '답이 음수이면 −를 꼭 붙여요.'],
        check: sameVal(raw, ptex(res.R)) && ans !== 0 && abs(ans) <= 60 };
    };
    var P = function (v) { if (v.q !== lastQ) { lastP = build(v.q); lastQ = v.q; } return lastP; };
    var leak = function (p) { var a = String(abs(p.ans)); return p.ans > 0 && nums(p.raw).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    var where = function (v) { var p = P(v); return !!p && p.check === true && !leak(p); };
    var withWant = function (r, q, n) {
      var ks = evaluate(q).R.map(function (t) { return key(t.e); }), pickd = r.shuffle(ks.slice()).slice(0, n);
      pickd.sort(function (a, b) { return ks.indexOf(a) - ks.indexOf(b); });
      return { parts: q.parts, want: pickd };
    };
    var enough = function (n) { return function (q) { return q.want.length === n; }; };
    MH.defineType({
      id: 'B12.coef', unit: 'B12', version: 1, title: '계수 구하기',
      answer: { kind: 'signed' },
      levels: [
        { name: '이차식의 덧셈 · 뺄셈', where: where, vars: { q: sampler(function (r) {
            var L = r.pick(LET);
            return until(function () { return withWant(r, Qm(r, [part(1, 'poly', [1], quad3(r, L, 9)), part(pm(r, 1), 'poly', [1], quad3(r, L, 9))]), 1); }, enough(1));
          }) } },
        { name: '수가 곱해진 괄호', where: where, vars: { q: sampler(function (r) {
            var L = r.pick(LET), P2 = r.pick(PAIR), quad = r.int(0, 1) === 1;
            return until(function () { return withWant(r, Qm(r, [part(1, 'poly', [r.pick([1, 2, 3])], quad ? quad3(r, L, 6) : lin3(r, P2, 6)), part(pm(r, 1), 'poly', [r.int(2, 5)], quad ? quad3(r, L, 6) : lin3(r, P2, 6))]), 1); }, enough(1));
          }) } },
        { name: '곱셈이 섞인 식 · 두 계수의 합', where: where, vars: { q: sampler(function (r) {
            var L = r.pick(LET), k = r.int(0, 2);
            return until(function () {
              if (k === 0) return withWant(r, mixedQ[0](r), 1);
              if (k === 1) return withWant(r, mixedQ[0](r), 2);
              return withWant(r, Qm(r, [part(1, 'poly', [r.pick([1, 2, 3])], quad3(r, L, 6)), part(pm(r, 1), 'poly', [r.int(2, 4)], quad3(r, L, 6))]), 2);
            }, enough(k === 0 ? 1 : 2));
          }) } }
      ],
      prompt: function (v) { var p = P(v); return { tex: p.raw, text: p.text }; },
      solve: function (v) { return { n: P(v).ans, p: 0 }; },
      verify: function (v, ans) { var p = P(v); return p.check === true && ans.p === 0 && ans.n === p.ans; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: { n: p.ans, p: 0 } }; return out; },
      mistakes: IDS.map(function (id) {
        return { id: id, wrong: function (v) { var x = P(v).wrong[id]; return x === undefined ? null : { n: x, p: 0 }; }, explain: function () { return FLAW[id][1]; } };
      })
    });
  })();
})();

/* ── 개념 카드 ── */
MH.defineConcept('B12', [
  { title: '다항식과 동류항', body: [
    '항이 하나인 식이 단항식, 단항식을 더해서 만든 식이 다항식이에요. $3x + 2y - 5$는 항이 3개인 다항식이에요.',
    '문자와 지수가 모두 같은 항을 동류항이라고 해요. 동류항끼리만 더하거나 뺄 수 있어요. 사과는 사과끼리, 배는 배끼리 세는 것과 같아요.',
    { ex: [['3x + 2x = 5x', '동류항 — 계수끼리 더해요.'], ['3x + 2y', '문자가 달라요. 더 간단히 할 수 없어요.'], ['3x^{2} + 2x', '지수가 달라요. 동류항이 아니에요.']] },
    '$x^{2}$처럼 차수가 2인 항이 가장 높은 식을 이차식이라고 해요. $2x^{2} - 3x + 1$은 이차식이에요.'
  ] },
  { title: '덧셈과 뺄셈', body: [
    '괄호를 풀고 동류항끼리 모아요. 덧셈은 괄호를 그대로 벗기면 돼요.',
    { tex: '(3x + 2y) + (x - 5y) = 3x + x + 2y - 5y = 4x - 3y' },
    '뺄셈은 조심해요. 괄호 앞의 −는 괄호 안의 모든 항의 부호를 바꿔요.',
    { tex: '(3x + 2y) - (x - 5y) = 3x + 2y - x + 5y = 2x + 7y' },
    '$-(x - 5y)$를 $-x - 5y$로 쓰는 실수가 가장 많아요. 뒤의 항도 빠짐없이 바꿔요.'
  ] },
  { title: '이차식의 덧셈과 뺄셈', body: [
    '방법은 똑같아요. $x^{2}$ 항끼리, $x$ 항끼리, 수끼리 따로 모아요.',
    { tex: '(2x^{2} - 3x + 1) - (x^{2} + 2x - 4) = 2x^{2} - x^{2} - 3x - 2x + 1 + 4 = x^{2} - 5x + 5' },
    '계수만 더하거나 빼고, 문자와 지수는 그대로 둬요. $x^{2} + x^{2}$은 $2x^{2}$이에요($x^{4}$이 아니에요).',
    '괄호 앞에 수가 있으면 분배법칙으로 먼저 풀어요: $2(x^{2} - x) = 2x^{2} - 2x$.'
  ] },
  { title: '(단항식) × (다항식)', body: [
    '분배법칙을 써요. 괄호 밖의 단항식을 괄호 안의 모든 항에 하나씩 곱해요. 이렇게 괄호를 푸는 것을 전개라고 해요.',
    { tex: '2x(3x + 4) = 2x \\times 3x + 2x \\times 4 = 6x^{2} + 8x' },
    { list: ['수는 수끼리 곱해요.', '같은 문자끼리 곱하면 지수를 더해요($x \\times x = x^{2}$).', '음수를 곱하면 모든 항의 부호가 바뀌어요.'] },
    { tex: '-3a(2a - 5b) = -6a^{2} + 15ab' }
  ] },
  { title: '(다항식) ÷ (단항식)', body: [
    '괄호 안의 모든 항을 하나씩 나눠요. 분수로 쓰고 항마다 약분하면 쉬워요.',
    { tex: '(6x^{2} + 4x) \\div 2x = \\dfrac{6x^{2}}{2x} + \\dfrac{4x}{2x} = 3x + 2' },
    '같은 것끼리 나누면 1이에요. $(6x^{2} + 2x) \\div 2x = 3x + 1$에서 1을 빠뜨리지 않아요.',
    '분수가 곱해진 식으로 나눌 때는 역수를 곱해요.',
    { tex: '(4x^{2} - 6x) \\div \\dfrac{2}{3}x = (4x^{2} - 6x) \\times \\dfrac{3}{2x} = 6x - 9' }
  ] }
]);
