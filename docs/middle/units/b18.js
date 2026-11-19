/* B18 근호를 포함한 식의 계산 — 근호의 곱셈 · 나눗셈, 분모의 유리화, 덧셈 · 뺄셈
   유형(쉬운 것부터): B18.mul 근호의 곱셈 · 나눗셈(보기 고르기) · B18.simplify 근호 밖으로 꺼내기 · 안으로 넣기(보기 고르기)
                     · B18.coef 등식에 맞는 자연수(키패드) · B18.rational 분모의 유리화(보기 고르기)
                     · B18.add 근호의 덧셈 · 뺄셈(보기 고르기) · B18.mixed 분배법칙과 혼합 계산(보기 고르기)
   답이 근호가 든 식이면 보기 고르기, 답이 자연수 하나이면 키패드다.
   값은 { 근호 안의 수(제곱인수가 없는 자연수): 유리수 계수 } 로 다룬다(S). 2√3 + 1 은 { 3: 2, 1: 1 } 이다. 계산은 모두 정수의 분수 계산이다.
   검산: 문제의 식을 나무(ast)로도 만들어, √ 를 10^30 배 한 정수 제곱근으로 바꿔 답과 크기가 같은지 따로 본다(정수 계산. 부동소수점을 쓰지 않는다).
   틀린 보기끼리 · 답과 값이 같은 보기가 나오지 않게 하는 데도 같은 값을 쓴다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, order4 = A.order4, gcd = MH.gcd, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!(q && ok(q)) && ++i < 200); return q; };

  /* ── 분수 ── */
  var rat = function (n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(abs(n), d) || 1; return { n: n / g, d: d / g }; };
  var R = function (n) { return { n: n, d: 1 }; };
  var radd = function (a, b) { return rat(a.n * b.d + b.n * a.d, a.d * b.d); };
  var rmul = function (a, b) { return rat(a.n * b.n, a.d * b.d); };
  var sr = function (t) { return '\\sqrt{' + t + '}'; };
  /** k√n 을 글자로: 1√2 → √2, -1√2 → -√2 */
  var kt = function (k, n) { return (k === 1 ? '' : k === -1 ? '-' : k) + sr(n); };
  var paren = function (t) { return t.charAt(0) === '-' ? '(' + t + ')' : t; };
  var SF = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];   /* 제곱인수가 없는 수 */
  /** n = k² × m (m 은 제곱인수가 없다) → [k, m] */
  var sfree = function (n) { var k = 1, m = n, i; for (i = 2; i * i <= m; i++) while (m % (i * i) === 0) { m /= i * i; k *= i; } return [k, m]; };

  /* ── 식의 나무(ast): 검산용 ── */
  var num = function (p, d) { return { t: 'n', v: rat(p, d || 1) }; };
  var rt = function (p, d) { return { t: 'r', v: rat(p, d || 1) }; };
  var mul = function (a, b) { return { t: '*', a: a, b: b }; };
  var dv = function (a, b) { return { t: '/', a: a, b: b }; };
  var ad = function (a, b) { return { t: '+', a: a, b: b }; };
  var sb = function (a, b) { return { t: '-', a: a, b: b }; };
  var kr = function (k, n) { return k === 1 ? rt(n) : mul(num(k), rt(n)); };
  var B = BigInt, SC = B('1' + new Array(31).join('0')), EPS = B('1' + new Array(13).join('0'));   /* 10^30 배, 10^-18 까지 같으면 같은 값 */
  var bsq = function (n) { if (n < B(2)) return n; var x = n, y = (x + B(1)) / B(2); while (y < x) { x = y; y = (x + n / x) / B(2); } return x; };
  var approx = function (e) {
    return e.t === 'n' ? B(e.v.n) * SC / B(e.v.d) : e.t === 'r' ? bsq(B(e.v.n) * SC * SC / B(e.v.d)) : e.t === '*' ? approx(e.a) * approx(e.b) / SC : e.t === '/' ? approx(e.a) * SC / approx(e.b) : e.t === '+' ? approx(e.a) + approx(e.b) : approx(e.a) - approx(e.b);
  };
  var near = function (x, y) { var d = x - y; return (d < B(0) ? -d : d) < EPS; };

  /* ── 값 S: { 제곱인수가 없는 수: 계수 } ── */
  var S1 = function (q, n) { var o = {}, f = sfree(n), c = rmul(q, R(f[0])); if (c.n !== 0) o[f[1]] = c; return o; };
  var sk = function (k, n) { return S1(R(k), n); };
  var snum = function (p, d) { return S1(rat(p, d || 1), 1); };
  var keys = function (s) { return Object.keys(s).map(Number).sort(function (x, y) { return x - y; }); };
  var sadd = function (a, b) { var o = {}, k, c; for (k in a) o[k] = a[k]; for (k in b) { c = o[k] ? radd(o[k], b[k]) : b[k]; if (c.n === 0) delete o[k]; else o[k] = c; } return o; };
  var sneg = function (a) { var o = {}, k; for (k in a) o[k] = { n: -a[k].n, d: a[k].d }; return o; };
  var smul = function (a, b) { var o = {}; keys(a).forEach(function (x) { keys(b).forEach(function (y) { o = sadd(o, S1(rmul(a[x], b[y]), x * y)); }); }); return o; };
  /** 항이 하나인 값의 역수: 1 / (q√n) = √n / (q n) */
  var sinv = function (a) { var k = keys(a), q; if (k.length !== 1) return null; q = a[k[0]]; return S1(rat(q.d, q.n * k[0]), k[0]); };
  var seval = function (e) {
    var x, y;
    if (e.t === 'n') return S1(e.v, 1);
    if (e.t === 'r') return S1(rat(1, e.v.d), e.v.n * e.v.d);
    x = seval(e.a); y = seval(e.b);
    if (!x || !y) return null;
    return e.t === '*' ? smul(x, y) : e.t === '/' ? (sinv(y) ? smul(x, sinv(y)) : null) : e.t === '+' ? sadd(x, y) : sadd(x, sneg(y));
  };
  var sapprox = function (s) { var z = B(0); keys(s).forEach(function (n) { z += B(s[n].n) * bsq(B(n) * SC * SC) / B(s[n].d); }); return z; };
  var stex = function (s) {
    var k = keys(s), i, out = '';
    if (!k.length) return '0';
    if (s[k[0]].n < 0) for (i = 1; i < k.length; i++) if (s[k[i]].n > 0) { k.unshift(k.splice(i, 1)[0]); break; }   /* 될 수 있으면 양수인 항을 앞에 */
    k.forEach(function (n, j) {
      var q = s[n], a = abs(q.n), body = n === 1 ? String(a) : (a === 1 ? '' : a) + sr(n);
      out += (j ? (q.n < 0 ? ' - ' : ' + ') : (q.n < 0 ? '-' : '')) + (q.d === 1 ? body : '\\dfrac{' + body + '}{' + q.d + '}');
    });
    return out;
  };
  var raw = function (tex, ast) { return { tex: tex, ast: ast }; };
  /** 조각들을 문제에 나온 차례대로 이어 쓴다(√33 + √21). 근호 안의 수가 같은 조각이 있으면 합쳐서 쓴다 */
  var inOrder = function (list) {
    var sum = {}, ks = [], ok = true, tex = '';
    list.forEach(function (x) { var k = keys(x); if (k.length > 1 || ks.indexOf(k[0]) >= 0) ok = false; if (k.length) ks.push(k[0]); sum = sadd(sum, x); });
    if (!ok || !ks.length) return { tex: stex(sum), s: sum };
    list.forEach(function (x) { var k = keys(x), ng; if (!k.length) return; ng = x[k[0]].n < 0; tex += tex ? (ng ? ' - ' : ' + ') + stex(ng ? sneg(x) : x) : stex(x); });
    return { tex: tex, s: sum };
  };
  var optOf = function (v) { return v.s ? { tex: v.tex, val: sapprox(v.s) } : v.tex ? { tex: v.tex, val: approx(v.ast) } : { tex: stex(v), val: sapprox(v) }; };
  /** 틀린 보기 후보에서 글자도 값도 서로 다른 것 3개를 고른다. 후보: [값(S 또는 raw), 실수 id, 설명] */
  var pick3 = function (ans, cands) {
    var seen = [optOf(ans)], out = [];
    cands.forEach(function (c) {
      var o;
      if (!c || !c[0] || out.length >= 3 || out.some(function (w) { return w[1] === c[1]; }) || (!c[0].tex && !keys(c[0]).length)) return;
      o = optOf(c[0]);
      if (o.tex.length > 40 || seen.some(function (s) { return s.tex === o.tex || near(s.val, o.val); })) return;
      seen.push(o); out.push([o.tex, c[1], c[2]]);
    });
    return out;
  };
  /** 보기 고르기 문제를 마무리한다: 답의 글자, 틀린 보기 3개, 검산(문제의 식의 값 = 답의 값) */
  var finish = function (o) {
    var a = optOf(o.ans), wrong = pick3(o.ans, o.cands);
    return { tex: o.tex, text: o.text, ans: a.tex, wrong: wrong, steps: o.steps, hints: o.hints,
      check: wrong.length === 3 && a.tex.length <= 40 && near(approx(o.ast), a.val) && (o.ok === undefined || o.ok) };
  };

  /* ── 틀: 보기 고르기 / 자연수 하나 ── */
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) {
      var p = P(v), list;
      if (!p || p.check !== true || p.wrong.length !== 3) return false;
      list = all(p);
      if (/^\d+$/.test(p.ans) && nums((p.tex || '') + ' ' + p.text).indexOf(p.ans) < 0 && nums(p.hints.join(' ')).indexOf(p.ans) >= 0) return false;
      return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; });
    };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B18', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; return out; },
      solve: function (v) { return P(v).ans; },
      verify: function (v, ans) { return good(v) && ans === P(v).ans && options(v).indexOf(ans) >= 0; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: p.ans }; return out; },
      mistakes: o.ids.map(function (id) {
        var find = function (v) { return P(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
        return { id: id, wrong: function (v) { var w = find(v); return w ? w[0] : null; }, explain: function (v) { var w = find(v); return w ? w[2] : ''; } };
      })
    });
  };
  /** build(q) → { text, tex, ans: 자연수, hints, steps, wrong: { 실수 id: 자연수 }, check } */
  var intQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var leak = function (p) { var a = String(p.ans); return p.ans > 19 && nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && p.ans >= 1 && p.check === true && !leak(p); }; });
    MH.defineType({
      id: o.id, unit: 'B18', version: 1, title: o.title,
      answer: { kind: 'int' },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { text: p.text, tex: p.tex }; },
      solve: function (v) { return P(v).ans; },
      verify: function (v, ans) { var p = P(v); return p.check === true && ans === p.ans; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: p.ans }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), x = p.wrong[m[0]], i;
            if (!isInt(x) || x < 1 || x === p.ans) return null;
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) if (p.wrong[o.mistakes[i][0]] === x) return null;
            return x;
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  /* ── B18.mul 근호의 곱셈 · 나눗셈 ───────────────────── */
  var MUL = '근호끼리 곱하거나 나눌 때는 근호 안의 수끼리 계산해서 근호 하나에 담아요. 넓이로 생각하면 쉬워요. 한 변이 $\\sqrt{2}$인 정사각형과 한 변이 $\\sqrt{3}$인 정사각형의 변을 곱하는 것은, 넓이 2와 넓이 3을 곱한 넓이 6짜리 정사각형의 한 변을 구하는 것과 같아요. 근호 밖에 수가 있으면 밖의 수는 밖의 수끼리 따로 계산해요.';
  var WM = {
    added: '근호 안의 수를 더했어요. 곱셈에서는 근호 안의 수끼리 곱해요. 더하는 것이 아니에요.',
    dropped: '계산한 뒤에 근호를 빼먹었어요. 근호 안의 수끼리 계산한 결과에도 근호는 그대로 씌워 둬요.',
    half: '한쪽 수의 근호를 벗겨 밖에 썼어요. 근호 안의 수는 근호를 벗길 수 없어요. 두 수 모두 근호 안에서 곱해요.',
    coefAdded: '근호 밖의 수를 더했어요. 곱셈이니 밖의 수끼리도 곱해요.',
    sign: '부호가 틀렸어요. 근호 밖의 수끼리 계산할 때 부호를 정해요. 부호가 같으면 양수, 다르면 음수예요.',
    subtracted: '근호 안의 수를 뺐어요. 나눗셈에서는 근호 안의 수끼리 나눠요. 빼는 것이 아니에요.',
    multiplied: '나누지 않고 곱했어요. $\\div$ 기호를 다시 확인해요. 근호 안의 수끼리 나눠요.',
    coefSub: '근호 밖의 수를 뺐어요. 나눗셈이니 밖의 수끼리도 나눠요.',
    divIgnored: '나누는 수를 빠뜨렸어요. 곱한 다음에 $\\div$ 뒤의 수로 나눠야 해요.',
    coefLost: '근호 밖의 수를 빠뜨렸어요. 근호 밖의 수는 계산이 끝날 때까지 밖에 그대로 남아요.',
    numerOnly: '분자끼리만 곱했어요. 분수의 곱셈은 분자는 분자끼리, 분모는 분모끼리 곱하고 약분해요.',
    inverted: '분자와 분모가 뒤바뀌었어요. 약분할 때 어느 수가 분자에 남는지 다시 확인해요.'
  };
  var mulBuild = function (q) {
    var a = q.a, b = q.b, m = q.m, n = q.n, k = q.k, c = q.c, tex, ast, ans, cands, steps, h2, text = '다음을 계산하세요.';
    if (q.kind === 'mm' && q.op === '*') {
      tex = kt(m, a) + ' \\times ' + paren(kt(n, b)); ast = mul(kr(m, a), kr(n, b)); ans = sk(m * n, a * b);
      cands = [sfree(a + b)[1] !== 1 ? [raw(kt(m * n, a + b), kr(m * n, a + b)), 'added', WM.added] : null, [snum(m * n * a * b), 'root-dropped', WM.dropped],
        m * n !== 1 ? [sk(m + n, a * b), 'coef-added', WM.coefAdded] : null, m < 0 || n < 0 ? [sk(-m * n, a * b), 'sign', WM.sign] : null, [raw(kt(m * n * a, b), kr(m * n * a, b)), 'half-rooted', WM.half]];
      steps = [{ say: m * n === 1 ? '근호 안의 수끼리 곱해서 근호 하나에 담아요.' : '근호 밖의 수끼리, 근호 안의 수끼리 따로 곱해요.', tex: (m * n === 1 ? '' : '(' + m + ' \\times ' + paren(String(n)) + ')') + sr(a + ' \\times ' + b) }, { say: '곱셈을 계산해요.', tex: stex(ans) }];
      h2 = (m * n === 1 ? '' : '먼저 근호 밖의 수 $' + m + '$' + pj(m, '과/와') + ' $' + n + '$' + pj(n, '을/를') + ' 곱해요. 부호도 이때 정해요. ') + '근호 안의 수 $' + a + '$' + pj(a, '과/와') + ' $' + b + '$' + pj(b, '은/는') + ' 근호 하나 안에 넣어서 곱해요. 계산한 뒤에도 근호는 그대로 남아요. 더하는 것이 아니라 곱하는 것이라는 점에 주의해요.';
    } else if (q.kind === 'mm') {
      /* (m n)√(a b) ÷ n√b = m√a */
      tex = q.frac ? '\\dfrac{' + kt(m * n, a * b) + '}{' + kt(n, b) + '}' : kt(m * n, a * b) + ' \\div ' + paren(kt(n, b)); ast = dv(kr(m * n, a * b), kr(n, b)); ans = sk(m, a);
      cands = [sfree(a * b - b)[1] !== 1 ? [raw(kt(m, a * b - b), kr(m, a * b - b)), 'subtracted', WM.subtracted] : null, [snum(m * a), 'root-dropped', WM.dropped],
        n !== 1 ? [sk(m * n - n, a), 'coef-subtracted', WM.coefSub] : null, m < 0 || n < 0 ? [sk(-m, a), 'sign', WM.sign] : null, [raw(kt(m, a * b * b), kr(m, a * b * b)), 'multiplied', WM.multiplied]];
      steps = [{ say: n === 1 ? '근호 안의 수끼리 나눠서 근호 하나에 담아요.' : '근호 밖의 수끼리, 근호 안의 수끼리 따로 나눠요.', tex: (n === 1 ? '' : '(' + m * n + ' \\div ' + paren(String(n)) + ')') + sr(a * b + ' \\div ' + b) }, { say: '나눗셈을 계산해요.', tex: stex(ans) }];
      h2 = (q.frac ? '분수 꼴은 나눗셈과 같아요. 분자를 분모로 나누는 것이에요. ' : '') + (n === 1 ? '' : '먼저 근호 밖의 수 $' + m * n + '$' + pj(m * n, '을/를') + ' $' + n + '$' + pj(n, '으로/로') + ' 나눠요. 부호도 이때 정해요. ') + '근호 안의 수 $' + a * b + '$' + pj(a * b, '을/를') + ' $' + b + '$' + pj(b, '으로/로') + ' 나눈 몫을 근호 안에 써요. 빼는 것이 아니라 나누는 것이라는 점에 주의해요.';
    } else if (q.kind === 'three') {
      /* √(c x) × k√y ÷ √c = k√(x y) */
      tex = sr(c * a) + ' \\times ' + kt(k, b) + ' \\div ' + sr(c); ast = dv(mul(rt(c * a), kr(k, b)), rt(c)); ans = sk(k, a * b);
      cands = [[sk(k, c * a * b), 'divisor-ignored', WM.divIgnored], [snum(k * a * b), 'root-dropped', WM.dropped], k !== 1 ? [sk(1, a * b), 'coef-lost', WM.coefLost] : null,
        c * a + b - c > 1 ? [raw(kt(k, c * a + b - c), kr(k, c * a + b - c)), 'added', '근호 안의 수를 더하고 뺐어요. 곱셈과 나눗셈에서는 근호 안의 수끼리 곱하고 나눠요.'] : null, [sk(k, c * c * a * b), 'multiplied', WM.multiplied]];
      steps = [{ say: '근호 안의 수를 근호 하나에 모아요. 곱하는 수는 분자에, 나누는 수는 분모에 써요.', tex: (k === 1 ? '' : k) + sr('\\dfrac{' + c * a + ' \\times ' + b + '}{' + c + '}') }, { say: '약분하고 계산해요.', tex: stex(ans) }];
      h2 = '곱셈과 나눗셈이 섞여 있어도 방법은 같아요. 근호 안의 수 $' + c * a + '$, $' + b + '$, $' + c + '$' + pj(c, '을/를') + ' 근호 하나 안에 모아요. 곱하는 수는 분자에, $\\div$ 뒤의 수는 분모에 놓아요. 그러면 근호 안에 분수 하나가 생겨요. 그 분수를 약분해요.' + (k === 1 ? '' : ' 근호 밖의 $' + k + '$' + pj(k, '은/는') + ' 끝까지 밖에 그대로 둬요.');
    } else {
      /* √(a/b) × √(b n / a) = √n */
      tex = sr('\\dfrac{' + a + '}{' + b + '}') + ' \\times ' + sr('\\dfrac{' + b * n + '}{' + a + '}'); ast = mul(rt(a, b), rt(b * n, a)); ans = sk(1, n);
      cands = [[snum(n), 'root-dropped', WM.dropped], [raw(sr(a * b * n), rt(a * b * n)), 'numer-only', WM.numerOnly], [raw(sr('\\dfrac{1}{' + n + '}'), rt(1, n)), 'inverted', WM.inverted], [raw(sr('\\dfrac{' + (a + b * n) + '}{' + (a + b) + '}'), rt(a + b * n, a + b)), 'added', WM.added]];
      steps = [{ say: '근호 안의 분수끼리 곱해서 근호 하나에 담아요.', tex: sr('\\dfrac{' + a + '}{' + b + '} \\times \\dfrac{' + b * n + '}{' + a + '}') }, { say: '약분해요. 분자와 분모에 같은 수가 있으면 지워져요.', tex: stex(ans) }];
      h2 = '근호 안이 분수여도 똑같아요. 두 분수를 근호 하나 안에 넣어서 곱해요. 분수의 곱셈은 분자끼리, 분모끼리 곱하는 것이에요. 곱하기 전에 먼저 약분하면 편해요. 앞 분수의 분자 $' + a + '$' + pj(a, '과/와') + ' 뒤 분수의 분모 $' + a + '$' + pj(a, '이/가') + ' 서로 지워지는지 살펴봐요.';
    }
    return finish({ tex: tex, text: text, ast: ast, ans: ans, cands: cands, steps: steps,
      hints: [MUL, h2, '① 근호 밖의 수가 있으면 밖의 수끼리 먼저 계산해요. ② 근호 안의 수끼리 곱하거나 나눠서 근호 하나에 담아요. ③ 근호 안이 분수이면 약분해요. ④ 근호를 빼먹지 않았는지, 부호가 맞는지 확인해요.'] });
  };
  var okM = function (q) { var p = mulBuild(q); return !!p && p.check; };
  var coprimeSF = function (r, max) { var a, b; do { a = r.pick(SF); b = r.pick(SF); } while (gcd(a, b) !== 1 || a * b > max); return [a, b]; };
  choiceQ({
    id: 'B18.mul', title: '근호의 곱셈 · 나눗셈', ids: ['added', 'root-dropped', 'half-rooted', 'coef-added', 'sign', 'subtracted', 'multiplied', 'coef-subtracted', 'divisor-ignored', 'coef-lost', 'numer-only', 'inverted'], build: mulBuild,
    levels: [
      { name: '근호 안의 수끼리 곱하기 · 나누기', minDistinct: 60, vars: { q: sampler(function (r) { return until(function () { var p = coprimeSF(r, 110), op = r.pick(['*', '*', '/']); return { kind: 'mm', op: op, a: p[0], b: p[1], m: 1, n: 1, frac: op === '/' && r.int(0, 1) === 1, o: order4(r) }; }, okM); }) } },
      { name: '근호 밖에 수가 있는 식', vars: { q: sampler(function (r) { return until(function () { var p = coprimeSF(r, 110), op = r.pick(['*', '*', '/']); return { kind: 'mm', op: op, a: p[0], b: p[1], m: nz(r, -6, 6), n: op === '/' ? pm(r, r.int(2, 5)) : nz(r, -6, 6), frac: false, o: order4(r) }; }, function (q) { return okM(q) && q.m * q.n !== 1; }); }) } },
      { name: '세 수의 계산 · 근호 안이 분수인 식', vars: { q: sampler(function (r) {
          return until(function () {
            var p = coprimeSF(r, 110), c = r.int(2, 7), n;
            if (r.int(0, 1)) return { kind: 'three', a: p[0], b: p[1], c: c, k: r.pick([1, 2, 3, 4, 5]), o: order4(r) };
            n = r.pick(SF); return gcd(p[0], p[1] * n) !== 1 ? null : { kind: 'frac', a: p[0], b: p[1], n: n, o: order4(r) };
          }, okM);
        }) } }
    ]
  });

  /* ── B18.simplify 근호 밖으로 꺼내기 · 안으로 넣기 ─────── */
  var SIMP = '$\\sqrt{12}$ 안에는 제곱수 4가 숨어 있어요. $12 = 2^{2} \\times 3$이니까요. 근호 안에서 제곱으로 짝을 이룬 수는 근호 밖으로 나올 수 있어요. 신발이 한 켤레가 되면 상자 밖으로 하나로 나오는 것처럼, $2^{2}$은 2 하나가 되어 밖으로 나와요. 짝이 없는 3은 근호 안에 남아요. 거꾸로 밖의 수를 안으로 넣을 때는 제곱해서 넣어요.';
  var simpBuild = function (q) {
    var k = q.k, m = q.m, n, tex, ast, ans, cands, steps, h2, text, s, ak;
    if (q.kind === 'out') {
      n = k * k * m; tex = sr(n); ast = rt(n); ans = sk(k, m); text = '근호 안의 제곱수를 밖으로 꺼내 가장 간단히 나타낸 것을 고르세요.';
      cands = [[raw(kt(k * k, m), kr(k * k, m)), 'square-out', '제곱수 $' + k * k + '$' + pj(k * k, '을/를') + ' 그대로 꺼냈어요. 근호 밖으로 나올 때는 제곱근이 되어 나와요. $' + k * k + ' = ' + k + '^{2}$이니 $' + k + '$' + pj(k, '이/가') + ' 나와요.'],
        [raw(kt(m, k), kr(m, k)), 'swapped', '밖으로 꺼낼 수와 안에 남길 수를 바꿨어요. 제곱수의 제곱근이 밖으로 나오고, 짝이 없는 나머지 수가 안에 남아요.'],
        [raw(kt(k, k * m), kr(k, k * m)), 'half-out', '꺼낸 수를 근호 안에도 남겼어요. 제곱수가 통째로 밖으로 나오면 근호 안에는 나머지 수만 남아요.']];
      steps = [{ say: '근호 안의 수를 (제곱수) × (나머지)로 나눠요.', tex: sr(n) + ' = ' + sr(k + '^{2} \\times ' + m) }, { say: '제곱수는 제곱근이 되어 근호 밖으로 나와요.', tex: stex(ans) }];
      h2 = '$' + n + '$' + pj(n, '을/를') + ' 나눌 수 있는 제곱수($4, 9, 16, 25, 36, \\cdots$)를 큰 것부터 찾아봐요. 찾았으면 $' + n + ' = $ (제곱수) $\\times$ (나머지) 꼴로 써요. 제곱수는 제곱근이 되어 근호 밖으로 나오고, 나머지는 안에 남아요. 안에 남은 수에 제곱수가 또 숨어 있지 않은지 확인해요.';
    } else if (q.kind === 'in') {
      ak = abs(k); n = k * k * m; s = k < 0 ? '-' : ''; tex = kt(k, m); ast = kr(k, m); ans = raw(s + sr(n), k < 0 ? mul(num(-1), rt(n)) : rt(n)); text = '근호 밖의 수를 근호 안으로 넣어 나타낸 것을 고르세요.';
      var mk = function (x) { return raw(s + sr(x), k < 0 ? mul(num(-1), rt(x)) : rt(x)); };
      cands = [[mk(ak * m), 'not-squared', '밖의 수를 제곱하지 않고 그대로 넣었어요. 근호 안으로 들어갈 때는 제곱해서 들어가요. $' + ak + ' = ' + sr(ak + '^{2}') + '$이기 때문이에요.'],
        [mk(ak * m * m), 'wrong-squared', '근호 안에 있던 수를 제곱했어요. 제곱하는 것은 밖에서 안으로 들어가는 수예요.'],
        k < 0 ? [raw(sr(n), rt(n)), 'sign-lost', '$-$ 부호를 빠뜨렸어요. 음수 부호는 근호 안으로 들어갈 수 없어요. 근호 앞에 그대로 남겨 둬요.'] : null,
        [mk(k * k + m), 'added', '제곱한 수를 근호 안의 수에 더했어요. 근호 밖의 수와 근호는 곱셈으로 이어져 있으니 곱해요.']];
      steps = [{ say: '근호 밖의 수를 제곱해서 근호 안에 넣어요.' + (k < 0 ? ' $-$ 부호는 근호 앞에 남겨요.' : ''), tex: kt(k, m) + ' = ' + s + sr(ak + '^{2} \\times ' + m) }, { say: '근호 안을 계산해요.', tex: s + sr(n) }];
      h2 = '근호 밖의 $' + ak + '$' + pj(ak, '을/를') + ' 근호를 쓴 수로 바꾸면 $' + sr(ak + '^{2}') + '$이에요. 그래서 안으로 넣을 때는 제곱해서 넣어요. 그런 다음 근호 안에 원래 있던 $' + m + '$' + pj(m, '과/와') + ' 곱해요.' + (k < 0 ? ' $-$ 부호는 넣지 않아요. 근호 안은 음수가 될 수 없으니, 부호는 근호 앞에 그대로 둬요.' : ' 더하는 것이 아니라 곱하는 것이에요.');
    } else if (q.kind === 'frac') {
      tex = sr('\\dfrac{' + m + '}{' + k * k + '}'); ast = rt(m, k * k); ans = S1(rat(1, k), m); text = '근호 안의 제곱수를 밖으로 꺼내 간단히 나타낸 것을 고르세요.';
      cands = [[raw('\\dfrac{' + sr(m) + '}{' + k * k + '}', dv(rt(m), num(k * k))), 'denominator-kept', '분모의 근호만 지우고 수는 그대로 두었어요. 분모 $' + k * k + '$' + pj(k * k, '은/는') + ' 제곱근 $' + k + '$' + pj(k, '이/가') + ' 되어 나와요.'],
        [snum(m, k), 'root-dropped', '분자의 근호까지 지웠어요. 분자 $' + m + '$' + pj(m, '은/는') + ' 제곱수가 아니라서 근호가 벗겨지지 않아요.'],
        [snum(m, k * k), 'root-ignored', '근호를 그냥 지웠어요. 근호는 제곱수일 때만 벗겨져요. 분모만 제곱수예요.']];
      steps = [{ say: '분자와 분모에 근호를 따로 씌워요.', tex: tex + ' = \\dfrac{' + sr(m) + '}{' + sr(k * k) + '}' }, { say: '분모는 제곱수라서 근호가 벗겨져요.', tex: stex(ans) }];
      h2 = '분수에 씌운 근호는 분자와 분모에 따로 씌울 수 있어요. 분모 $' + k * k + '$' + pj(k * k, '은/는') + ' 제곱수라서 근호가 벗겨져요. 제곱해서 $' + k * k + '$' + pj(k * k, '이/가') + ' 되는 수를 분모에 써요. 분자 $' + m + '$' + pj(m, '은/는') + ' 제곱수가 아니니 근호를 씌운 채로 분자에 둬요.';
    } else {
      n = q.n; s = sfree(n); tex = sr(MH.decStr(n, 2)); ast = rt(n, 100); ans = seval(ast); text = '근호 안의 제곱수를 밖으로 꺼내 간단히 나타낸 것을 고르세요.';
      cands = [[raw('\\dfrac{' + sr(n) + '}{100}', dv(rt(n), num(100))), 'denominator-kept', '분모 100을 그대로 두었어요. $100 = 10^{2}$이니 근호 밖으로는 10이 나와요.'],
        [snum(n, 10), 'root-dropped', '분자의 근호까지 지웠어요. 분자는 제곱수가 아니라서 근호가 남아요.'],
        [seval(rt(n, 10)), 'one-place', '소수 두 자리 수를 분모가 10인 분수로 고쳤어요. 소수 두 자리 수는 분모가 100인 분수예요.'],
        s[0] > 1 ? [S1(rat(s[0] * s[0], 10), s[1]), 'square-out', '분자에서 제곱수를 그대로 꺼냈어요. 근호 밖으로는 제곱근이 나와요.'] : null];
      steps = [{ say: '소수를 분모가 100인 분수로 고쳐요.', tex: tex + ' = ' + sr('\\dfrac{' + n + '}{100}') }, { say: '분모 $100 = 10^{2}$은 근호 밖으로 10이 되어 나와요.' + (s[0] > 1 ? ' 분자에서도 제곱수를 꺼내요.' : ''), tex: '\\dfrac{' + kt(s[0], s[1]) + '}{10}' }, { say: s[0] > 1 && gcd(s[0], 10) > 1 ? '약분해요.' : '이것이 가장 간단한 꼴이에요.', tex: stex(ans) }];
      h2 = '소수는 분수로 고치면 길이 보여요. $' + MH.decStr(n, 2) + '$' + pj(n, '은/는') + ' 분모가 100인 분수예요. 분모 100은 10의 제곱이니, 근호 밖으로 10이 되어 나와요. 분자 $' + n + '$' + pj(n, '은/는') + ' 근호 안에 남는데, 그 안에 제곱수가 숨어 있으면 그것도 꺼내요. 마지막에 약분할 수 있는지 봐요.';
    }
    return finish({ tex: tex, text: text, ast: ast, ans: ans, cands: cands, steps: steps, ok: q.kind !== 'dec' || s[1] !== 1,
      hints: [SIMP, h2, '① 근호 안의 수에서 제곱수를 찾아요(분수 · 소수는 분모부터 봐요). ② 제곱수는 제곱근이 되어 근호 밖으로 나와요. ③ 밖의 수를 안으로 넣을 때는 반대로 제곱해서 넣어요. ④ $-$ 부호는 언제나 근호 밖에 둬요.'] });
  };
  var okSi = function (q) { var p = simpBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B18.simplify', title: '근호 밖으로 꺼내기 · 안으로 넣기', ids: ['square-out', 'swapped', 'half-out', 'not-squared', 'wrong-squared', 'sign-lost', 'added', 'denominator-kept', 'root-dropped', 'root-ignored', 'one-place'], build: simpBuild,
    levels: [
      { name: '제곱수를 근호 밖으로 꺼내기', minDistinct: 30, vars: { q: sampler(function (r) { return until(function () { return { kind: 'out', k: r.int(2, 7), m: r.pick(SF), o: order4(r) }; }, function (q) { return okSi(q) && q.k * q.k * q.m <= 200; }); }) } },
      { name: '근호 밖의 수를 안으로 넣기', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return { kind: 'in', k: pm(r, r.int(2, 7)), m: r.pick(SF), o: order4(r) }; }, okSi); }) } },
      { name: '근호 안이 분수 · 소수인 수', minDistinct: 80, vars: { q: sampler(function (r) {
          return until(function () { var k, m; if (r.int(0, 1)) { k = r.int(2, 9); m = r.pick(SF); return gcd(k, m) !== 1 ? null : { kind: 'frac', k: k, m: m, o: order4(r) }; } m = r.int(2, 99); return m % 10 === 0 ? null : { kind: 'dec', n: m, o: order4(r) }; }, okSi);
        }) } }
    ]
  });

  /* ── B18.coef 등식에 맞는 자연수 ────────────────────── */
  var coefBuild = function (q) {
    var k = q.k, m = q.m, n = k * k * m, tex, text = '다음 등식이 성립할 때, 자연수 $a$의 값을 구하세요.', ans, wrong = {}, steps, h2, chk, f1, f2;
    if (q.kind === 'out') {
      tex = sr(n) + ' = a' + sr(m); ans = k; wrong['square-out'] = k * k; wrong.halved = (k * k) % 2 === 0 ? k * k / 2 : null; wrong.radicand = m;
      steps = [{ say: '$' + n + '$' + pj(n, '을/를') + ' $' + m + '$' + pj(m, '으로/로') + ' 나눠서 (제곱수) × $' + m + '$ 꼴로 써요.', tex: sr(n) + ' = ' + sr(k + '^{2} \\times ' + m) }, { say: '제곱수는 제곱근이 되어 근호 밖으로 나와요.', tex: sr(n) + ' = ' + kt(k, m) }, { say: '근호 밖의 수가 $a$예요.', tex: 'a = ' + k }];
      h2 = '오른쪽 근호 안에 $' + m + '$' + pj(m, '이/가') + ' 남아 있어요. 그러니 왼쪽의 $' + n + '$' + pj(n, '을/를') + ' $' + m + '$' + pj(m, '으로/로') + ' 나눠 봐요. 그 몫이 제곱수예요. 제곱수는 근호 밖으로 나올 때 제곱근이 돼요. 몫을 그대로 답하지 말고, 제곱해서 그 몫이 되는 수를 답해요.';
      chk = near(approx(rt(n)), approx(kr(k, m)));
    } else if (q.kind === 'in') {
      tex = kt(k, m) + ' = ' + sr('a'); ans = n; wrong['not-squared'] = k * m; wrong['wrong-squared'] = k * m * m; wrong.added = k * k + m;
      steps = [{ say: '근호 밖의 수를 제곱해서 근호 안에 넣어요.', tex: kt(k, m) + ' = ' + sr(k + '^{2} \\times ' + m) }, { say: '근호 안을 계산해요.', tex: kt(k, m) + ' = ' + sr(n) }, { say: '근호 안의 수가 $a$예요.', tex: 'a = ' + n }];
      h2 = '근호 밖의 $' + k + '$' + pj(k, '을/를') + ' 근호 안으로 넣는 문제예요. 밖의 수는 제곱해서 안으로 들어가요. $' + k + '$' + pj(k, '을/를') + ' 제곱한 수와 원래 근호 안에 있던 $' + m + '$' + pj(m, '을/를') + ' 곱하면 $a$가 나와요. 제곱하는 것은 밖의 수이고, 더하지 않고 곱해요.';
      chk = near(approx(kr(k, m)), approx(rt(n)));
    } else {
      /* √p × √q = a√m */
      f1 = sfree(q.p); f2 = sfree(q.q); k = sfree(q.p * q.q)[0]; m = sfree(q.p * q.q)[1];
      tex = sr(q.p) + ' \\times ' + sr(q.q) + ' = a' + sr(m); ans = k; wrong['square-out'] = k * k; wrong['one-factor'] = f1[0] * f2[0]; wrong['product-kept'] = q.p * q.q;
      steps = [{ say: '근호 안의 수끼리 곱해요.', tex: sr(q.p) + ' \\times ' + sr(q.q) + ' = ' + sr(q.p * q.q) }, { say: '$' + q.p * q.q + '$' + pj(q.p * q.q, '을/를') + ' (제곱수) × $' + m + '$ 꼴로 써서 제곱수를 꺼내요.', tex: sr(q.p * q.q) + ' = ' + sr(k + '^{2} \\times ' + m) + ' = ' + kt(k, m) }, { say: '근호 밖의 수가 $a$예요.', tex: 'a = ' + k }];
      h2 = '두 걸음이에요. 먼저 근호 안의 수 $' + q.p + '$' + pj(q.p, '과/와') + ' $' + q.q + '$' + pj(q.q, '을/를') + ' 곱해서 근호 하나에 담아요. 그다음 그 수를 오른쪽 근호 안의 $' + m + '$' + pj(m, '으로/로') + ' 나눠요. 몫이 제곱수예요. 제곱해서 그 몫이 되는 수가 근호 밖으로 나오는 $a$예요.';
      chk = k >= 2 && m >= 2 && near(approx(mul(rt(q.p), rt(q.q))), approx(kr(k, m)));
    }
    return { tex: tex, text: text, ans: ans, wrong: wrong, steps: steps, check: chk && sfree(m)[0] === 1,
      hints: [SIMP, h2, '① 근호 안의 수를 (제곱수) × (나머지)로 나눠요. ② 제곱수는 제곱근이 되어 근호 밖으로 나와요. ③ 거꾸로 밖의 수는 제곱해서 안으로 들어가요. ④ 구한 값을 등식에 넣어 양쪽이 같은지 확인해요.'] };
  };
  var okCo = function (q) { var p = coefBuild(q); return !!p && p.check; };
  intQ({
    id: 'B18.coef', title: '등식에 맞는 자연수', build: coefBuild,
    mistakes: [['square-out', '제곱수를 그대로 답했어요. 근호 밖으로 나올 때는 제곱근이 되어 나와요. 제곱해서 그 수가 되는 수를 답해요.'],
      ['halved', '제곱수를 2로 나눴어요. 제곱근은 반으로 나눈 수가 아니에요. 같은 수를 두 번 곱해서 그 수가 되는 수예요.'],
      ['radicand', '근호 안에 남는 수를 답했어요. $a$는 근호 밖으로 나오는 수예요.'],
      ['not-squared', '밖의 수를 제곱하지 않고 곱했어요. 근호 안으로 들어갈 때는 제곱해서 들어가요.'],
      ['wrong-squared', '근호 안에 있던 수를 제곱했어요. 제곱하는 것은 밖에서 안으로 들어가는 수예요.'],
      ['added', '제곱한 수를 더했어요. 근호 밖의 수와 근호는 곱셈으로 이어져 있으니 곱해요.'],
      ['one-factor', '두 근호에서 따로 꺼낸 수만 곱했어요. 근호 안에 남은 수끼리 곱하면 제곱수가 또 생겨요. 먼저 근호 안의 수를 모두 곱한 다음에 꺼내요.'],
      ['product-kept', '근호 안의 수를 곱한 값을 그대로 답했어요. 그 수에서 제곱수를 찾아 제곱근을 밖으로 꺼내야 해요.']],
    levels: [
      { name: '√n = a√m', minDistinct: 50, vars: { q: sampler(function (r) { return until(function () { return { kind: 'out', k: r.int(2, 9), m: r.pick(SF) }; }, okCo); }) } },
      { name: 'k√m = √a', minDistinct: 50, vars: { q: sampler(function (r) { return until(function () { return { kind: 'in', k: r.int(2, 9), m: r.pick(SF) }; }, okCo); }) } },
      { name: '√p × √q = a√m', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { var p = r.int(2, 30), q = r.int(2, 30); return sfree(p)[1] === 1 || sfree(q)[1] === 1 || p === q ? null : { kind: 'prod', k: 1, m: 2, p: p, q: q }; }, function (q) { return okCo(q) && sfree(q.p * q.q)[0] <= 30; }); }) } }
    ]
  });

  /* ── B18.rational 분모의 유리화 ─────────────────────── */
  var RATL = '분모에 근호가 있으면 수의 크기를 가늠하기도, 다른 수와 더하기도 어려워요. 그래서 분모를 유리수로 바꾸는데, 이것을 분모의 유리화라고 해요. 방법은 분모와 분자에 똑같은 수를 곱하는 것이에요. 같은 수를 위아래에 곱하는 것은 1을 곱하는 것과 같아서 분수의 값은 변하지 않아요. $\\sqrt{2} \\times \\sqrt{2} = 2$처럼, 같은 근호끼리 곱하면 근호가 사라져요.';
  var ratBuild = function (q) {
    var a = q.a, b = q.b, k = q.k, tex, ast, ans, cands, steps, h2, f, x;
    var W_DEN = '분모에만 곱했어요. 분자에도 똑같은 수를 곱해야 분수의 값이 변하지 않아요.';
    var W_NUM = '분자에만 곱하고 분모의 근호는 그냥 지웠어요. 분모는 같은 근호끼리 곱해져서 근호 안의 수가 돼요. 그 수를 분모에 써요.';
    var W_SQ = '분모를 제곱한 수로 썼어요. 같은 근호끼리 곱하면 근호 안의 수 그대로가 돼요. $\\sqrt{b} \\times \\sqrt{b} = b$예요.';
    if (q.kind === 'n/r') {
      tex = '\\dfrac{' + a + '}{' + kt(k, b) + '}'; ast = dv(num(a), kr(k, b)); ans = seval(ast);
      cands = [[snum(a, k * b), 'denominator-only', W_DEN], [S1(rat(a, k), b), 'numerator-only', W_NUM], k > 1 ? [S1(rat(a, b), b), 'coef-lost', '분모의 근호 앞에 있던 $' + k + '$' + pj(k, '을/를') + ' 빠뜨렸어요. 근호가 사라져도 그 앞의 수는 분모에 그대로 남아요.'] : null, [S1(rat(a, k * b * b), b), 'denominator-squared', W_SQ]];
      steps = [{ say: '분모와 분자에 똑같이 $' + sr(b) + '$' + pj(b, '을/를') + ' 곱해요.', tex: tex + ' = \\dfrac{' + a + ' \\times ' + sr(b) + '}{' + kt(k, b) + ' \\times ' + sr(b) + '}' },
        { say: '분모에서 같은 근호끼리 곱하면 근호가 사라져요.', tex: '\\dfrac{' + kt(a, b) + '}{' + k * b + '}' }, { say: gcd(a, k * b) > 1 ? '분자와 분모를 약분해요.' : '더 약분되지 않아요. 이것이 답이에요.', tex: stex(ans) }];
      h2 = '분모의 근호 $' + sr(b) + '$' + pj(b, '을/를') + ' 없애려면 같은 $' + sr(b) + '$' + pj(b, '을/를') + ' 곱하면 돼요. 같은 근호끼리 곱하면 근호 안의 수 $' + b + '$' + pj(b, '이/가') + ' 되기 때문이에요. 분모에만 곱하면 값이 달라지니, 분자에도 똑같이 곱해요.' + (k > 1 ? ' 분모의 $' + k + '$' + pj(k, '은/는') + ' 유리수이니 곱할 필요가 없어요. 그대로 분모에 남겨요.' : '') + ' 마지막에 근호 밖의 수끼리 약분되는지 봐요.';
    } else if (q.kind === 'r/r') {
      tex = '\\dfrac{' + sr(a) + '}{' + sr(b) + '}'; ast = dv(rt(a), rt(b)); ans = seval(ast);
      cands = [[S1(rat(1, b), a), 'denominator-only', W_DEN], [sk(1, a * b), 'numerator-only', W_NUM], [snum(a, b), 'root-dropped', '근호를 모두 지웠어요. 근호는 같은 근호끼리 곱할 때만 사라져요. 분자의 근호는 남아요.'], [S1(rat(1, b * b), a * b), 'denominator-squared', W_SQ]];
      steps = [{ say: '분모와 분자에 똑같이 $' + sr(b) + '$' + pj(b, '을/를') + ' 곱해요.', tex: tex + ' = \\dfrac{' + sr(a) + ' \\times ' + sr(b) + '}{' + sr(b) + ' \\times ' + sr(b) + '}' },
        { say: '분자는 근호 안의 수끼리 곱하고, 분모는 근호가 사라져요.', tex: '\\dfrac{' + sr(a * b) + '}{' + b + '}' }, { say: sfree(a * b)[0] > 1 ? '분자의 근호에서 제곱수를 꺼내고 약분해요.' : '이것이 답이에요.', tex: stex(ans) }];
      h2 = '분모가 $' + sr(b) + '$' + pj(b, '이니/니') + ' 분모와 분자에 $' + sr(b) + '$' + pj(b, '을/를') + ' 곱해요. 분모는 같은 근호끼리 곱해져서 $' + b + '$' + pj(b, '이/가') + ' 돼요. 분자는 근호끼리의 곱셈이니 근호 안의 수 $' + a + '$' + pj(a, '과/와') + ' $' + b + '$' + pj(b, '을/를') + ' 곱해서 근호 하나에 담아요. 분자의 근호는 사라지지 않아요.';
    } else {
      /* simp: a / √n, n = k² m — 분모를 먼저 간단히 한다 */
      f = sfree(q.n); x = f[0]; b = f[1];
      tex = '\\dfrac{' + a + '}{' + sr(q.n) + '}'; ast = dv(num(a), rt(q.n)); ans = seval(ast);
      cands = [[snum(a, q.n), 'denominator-only', W_DEN], [seval(dv(num(a), kr(x * x, b))), 'square-out', '분모의 근호에서 제곱수를 그대로 꺼냈어요. 근호 밖으로는 제곱근이 나와요. 바르게 꺼내면 $' + sr(q.n) + ' = ' + kt(x, b) + '$' + pj(b, '이에요/예요') + '.'],
        [S1(rat(a, b), b), 'coef-lost', '분모에서 꺼낸 수 $' + x + '$' + pj(x, '을/를') + ' 빠뜨렸어요. 근호 밖으로 나온 수도 분모에 그대로 남아요.'], [sk(a, q.n), 'numerator-only', W_NUM], [S1(rat(a, q.n * q.n), q.n), 'denominator-squared', W_SQ]];
      steps = [{ say: '분모의 근호에서 제곱수를 먼저 꺼내요. 수가 작아져서 계산이 쉬워져요.', tex: tex + ' = \\dfrac{' + a + '}{' + kt(x, b) + '}' },
        { say: '분모와 분자에 똑같이 $' + sr(b) + '$' + pj(b, '을/를') + ' 곱해요.', tex: '\\dfrac{' + a + ' \\times ' + sr(b) + '}{' + kt(x, b) + ' \\times ' + sr(b) + '} = \\dfrac{' + kt(a, b) + '}{' + x * b + '}' }, { say: gcd(a, x * b) > 1 ? '분자와 분모를 약분해요.' : '더 약분되지 않아요.', tex: stex(ans) }];
      h2 = '바로 $' + sr(q.n) + '$' + pj(q.n, '을/를') + ' 곱해도 되지만 수가 커져요. 먼저 분모의 근호 안에서 제곱수를 꺼내요. $' + q.n + '$' + pj(q.n, '을/를') + ' (제곱수) $\\times$ (나머지)로 나누면 근호가 작아져요. 그다음 남은 작은 근호를 분모와 분자에 곱해요. 근호 밖으로 나온 수는 분모에 그대로 두고, 마지막에 약분해요.';
    }
    return finish({ tex: tex, text: '분모를 유리화한 것을 고르세요.', ast: ast, ans: ans, cands: cands, steps: steps, ok: keys(ans).length === 1 && keys(ans)[0] !== 1,
      hints: [RATL, h2, '① 분모의 근호에 제곱수가 숨어 있으면 먼저 꺼내요. ② 분모에 남은 근호와 같은 근호를 분모와 분자에 똑같이 곱해요. ③ 분모는 근호가 사라지고, 분자에는 근호가 생기거나 남아요. ④ 근호 밖의 수끼리 약분해요.'] });
  };
  var okRa = function (q) { var p = ratBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B18.rational', title: '분모의 유리화', ids: ['denominator-only', 'numerator-only', 'denominator-squared', 'coef-lost', 'root-dropped', 'square-out'], build: ratBuild,
    levels: [
      { name: '분모가 √b 인 분수', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return { kind: 'n/r', a: r.int(1, 15), b: r.pick(SF), k: 1, o: order4(r) }; }, okRa); }) } },
      { name: '분모가 k√b 이거나 분자에도 근호가 있는 분수', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () { var a, b; if (r.int(0, 1)) return { kind: 'n/r', a: r.int(1, 15), b: r.pick(SF), k: r.int(2, 6), o: order4(r) }; a = r.pick(SF); b = r.pick(SF); return a === b || gcd(a, b) !== 1 ? null : { kind: 'r/r', a: a, b: b, o: order4(r) }; }, okRa);
        }) } },
      { name: '분모를 먼저 간단히 하는 분수', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () { var a, b, k; if (r.int(0, 2)) { k = r.int(2, 5); return { kind: 'simp', a: r.int(1, 20), n: k * k * r.pick([2, 3, 5, 6, 7]), o: order4(r) }; } a = r.pick(SF); b = r.pick(SF); return a === b || gcd(a, b) === 1 || a % b === 0 ? null : { kind: 'r/r', a: a, b: b, o: order4(r) }; }, okRa);
        }) } }
    ]
  });

  /* ── B18.add 근호의 덧셈 · 뺄셈 ─────────────────────── */
  var ADD = '$\\sqrt{2}$를 사과, $\\sqrt{3}$을 귤이라고 생각해요. 사과 3개와 사과 5개는 사과 8개로 합칠 수 있지만, 사과와 귤은 하나로 합칠 수 없어요. 근호 안의 수가 같은 것끼리만 모아서, 근호 밖의 수(개수)를 더하고 빼요. 문자식에서 $3x + 5x = 8x$로 동류항을 계산하던 것과 똑같아요. 근호 안의 수는 더하지 않아요.';
  /** 항들 [[계수, 근호 안의 수]] 을 글자와 나무로 */
  var sumOf = function (terms) {
    var tex = '', ast = null;
    terms.forEach(function (t, i) { var e = t.ast || kr(abs(t[0]), t[1]), x = t.tex || kt(abs(t[0]), t[1]), neg = t.ast ? t.neg : t[0] < 0; tex += (i ? (neg ? ' - ' : ' + ') : (neg ? '-' : '')) + x; ast = i ? (neg ? sb(ast, e) : ad(ast, e)) : (neg ? mul(num(-1), e) : e); });
    return { tex: tex, ast: ast };
  };
  var signs = function (list) { return list.map(function (k, i) { return (i ? (k < 0 ? ' - ' : ' + ') : (k < 0 ? '-' : '')) + abs(k); }).join(''); };
  var addBuild = function (q) {
    var T = q.terms, a = q.a, b = q.b, e, ans, cands, steps, h2, all, ka, kb, ks, ns, tot, sq2;
    var W_RAD = '근호 안의 수까지 더했어요. 근호 안의 수는 사과 · 귤 같은 이름표예요. 이름표는 그대로 두고, 근호 밖의 수만 더하고 빼요.';
    var W_SIGN = '부호를 잘못 봤어요. 각 항 앞의 $+$, $-$는 그 항의 것이에요. 빼는 항은 근호 밖의 수를 빼요.';
    if (q.kind === 'same') {
      e = sumOf(T); ks = T.map(function (t) { return t[0]; }); tot = ks.reduce(function (x, y) { return x + y; }, 0); ans = sk(tot, a);
      cands = [[raw(kt(tot, a * T.length), kr(tot, a * T.length)), 'radicands-added', W_RAD], T.length === 2 ? [sk(ks[0] * ks[1], a), 'coef-multiplied', '근호 밖의 수를 곱했어요. 덧셈 · 뺄셈이니 근호 밖의 수를 더하고 빼요.'] : null,
        [sk(ks[0] - ks.slice(1).reduce(function (x, y) { return x + y; }, 0), a), 'sign', W_SIGN], [snum(tot * a), 'root-dropped', '근호를 빼먹고 근호 안의 수까지 곱했어요. 근호와 그 안의 수는 그대로 두고, 밖의 수만 계산해요.'], [sk(ks.reduce(function (x, y) { return x + abs(y); }, 0), a), 'sign', W_SIGN]];
      steps = [{ say: '근호 안의 수가 모두 $' + a + '$' + pj(a, '으로/로') + ' 같아요. 근호 밖의 수끼리 모아요.', tex: '(' + signs(ks) + ')' + sr(a) }, { say: '괄호 안을 계산해요.', tex: stex(ans) }];
      h2 = '모든 항의 근호 안의 수가 $' + a + '$' + pj(a, '으로/로') + ' 같아요. 그러니 $' + sr(a) + '$' + pj(a, '을/를') + ' 물건 하나로 보고 개수만 세면 돼요. 근호 밖의 수 $' + ks.join('$, $') + '$' + pj(ks[ks.length - 1], '을/를') + ' 부호대로 더하고 빼요. 근호 앞에 수가 안 보이면 1개(또는 $-1$개)예요. $' + sr(a) + '$ 자체는 변하지 않아요.';
    } else if (q.kind === 'two') {
      e = sumOf(T); ka = T.filter(function (t) { return t[1] === a; }).map(function (t) { return t[0]; }); kb = T.filter(function (t) { return t[1] === b; }).map(function (t) { return t[0]; }); all = ka.concat(kb).reduce(function (x, y) { return x + y; }, 0);
      var sa = ka[0] + ka[1], sbb = kb[0] + kb[1];
      ans = inOrder([sk(sa, a), sk(sbb, b)]);
      cands = [sfree(a + b)[1] === 1 ? null : [raw(kt(all, a + b), kr(all, a + b)), 'all-merged', '근호 안의 수가 다른 항까지 한데 모았어요. 사과와 귤은 합칠 수 없어요. 근호 안의 수가 같은 항끼리만 계산해요.'],
        [inOrder([sk(sbb, a), sk(sa, b)]), 'cross', '근호 안의 수가 다른 항의 계수를 더했어요. 근호 안의 수가 같은 항끼리 짝지어요.'],
        [inOrder([sk(ka[0] - ka[1], a), sk(sbb, b)]), 'sign', W_SIGN], [inOrder([sk(sa, a), sk(kb[0] - kb[1], b)]), 'sign', W_SIGN], [sk(all, a), 'all-merged', '근호 안의 수가 다른 항까지 한데 모았어요. 사과와 귤은 합칠 수 없어요. 근호 안의 수가 같은 항끼리만 계산해요.']];
      steps = [{ say: '근호 안의 수가 같은 항끼리 모아요.', tex: '(' + signs(ka) + ')' + sr(a) + ' + (' + signs(kb) + ')' + sr(b) }, { say: '괄호 안을 각각 계산해요. 근호 안의 수가 다른 항은 더 합칠 수 없어요.', tex: ans.tex }];
      h2 = '근호가 두 종류예요. $' + sr(a) + '$' + pj(a, '이/가') + ' 든 항과 $' + sr(b) + '$' + pj(b, '이/가') + ' 든 항을 따로 모아요. 과일 가게에서 사과는 사과끼리, 귤은 귤끼리 세는 것과 같아요. 항을 옮길 때는 앞의 부호를 함께 데려가요. 다 모으면 종류마다 근호 밖의 수를 더하고 빼요. 종류가 다른 두 항은 끝까지 따로 남아요.';
      if (sa === 0 || sbb === 0) return null;
    } else {
      /* simp: √n1 ± √n2 ( ± c/√a ) — 먼저 간단히 해서 같은 근호로 만든다 */
      ks = q.ks; ns = ks.map(function (k) { return k * k * a; });
      all = ks.map(function (k, i) { return [k < 0 ? -1 : 1, ns[i]]; });
      if (q.c) all.push({ tex: '\\dfrac{' + abs(q.c) * a + '}{' + sr(a) + '}', ast: dv(num(abs(q.c) * a), rt(a)), neg: q.c < 0 });
      e = sumOf(all); tot = ks.reduce(function (x, y) { return x + y; }, 0) + (q.c || 0); ans = sk(tot, a);
      sq2 = ns.reduce(function (x, n, i) { return x + (ks[i] < 0 ? -n : n); }, 0);
      cands = [!q.c && sq2 > 1 ? [raw(sr(sq2), rt(sq2)), 'radicands-added', '근호 안의 수끼리 더하고 뺐어요. 근호 안의 수는 그렇게 계산할 수 없어요. 먼저 각 근호에서 제곱수를 꺼내 같은 근호로 만들어요.'] : null,
        [sk(ks.reduce(function (x, k) { return x + (k < 0 ? -1 : 1) * k * k; }, 0) + (q.c || 0), a), 'square-out', '근호 안의 제곱수를 그대로 꺼냈어요. 근호 밖으로는 제곱근이 나와요.'],
        q.c ? [sadd(sk(tot - q.c, a), snum(q.c)), 'denominator-only', '분수의 분모에만 곱해서 근호를 없앴어요. 분자에도 똑같이 곱해야 해요. 유리화하면 근호가 분자로 올라와요.'] : null,
        q.c ? [sk(tot - q.c + q.c * a, a), 'numerator-only', '분자에만 곱하고 분모를 지웠어요. 분모는 같은 근호끼리 곱해져 근호 안의 수가 되고, 분자와 약분돼요.'] : null,
        [sk(ks.reduce(function (x, k) { return x + abs(k); }, 0) + abs(q.c || 0), a), 'sign', W_SIGN], [snum(tot * a), 'root-dropped', '근호를 빼먹고 근호 안의 수까지 곱했어요. 근호와 그 안의 수는 그대로 두고, 밖의 수만 계산해요.']];
      steps = [{ say: '각 근호에서 제곱수를 꺼내요.' + (q.c ? ' 분수는 분모를 유리화해요.' : ''), tex: e.tex + ' = ' + sumOf(ks.map(function (k) { return [k, a]; }).concat(q.c ? [[q.c, a]] : [])).tex },
        { say: '근호 안의 수가 모두 $' + a + '$' + pj(a, '으로/로') + ' 같아졌어요. 근호 밖의 수끼리 계산해요.', tex: '(' + signs(ks.concat(q.c ? [q.c] : [])) + ')' + sr(a) }, { say: '괄호 안을 계산해요.', tex: stex(ans) }];
      h2 = '지금은 근호 안의 수가 서로 달라 보여서 합칠 수 없을 것 같아요. 하지만 근호마다 제곱수를 꺼내면 모양이 바뀌어요. $' + ns.join('$, $') + '$' + pj(ns[ns.length - 1], '을/를') + (ns.length > 1 ? ' 각각' : '') + ' (제곱수) $\\times$ (나머지)로 나눠 봐요. 꺼내고 나면 근호 안에 같은 수가 남아요.' + (q.c ? ' 분수는 분모와 분자에 분모의 근호를 곱해 유리화해요. 그러면 같은 근호가 든 항이 돼요.' : '') + ' 그때 근호 밖의 수끼리 더하고 빼요.';
      if (ks.every(function (k) { return abs(k) === 1; })) return null;
    }
    return finish({ tex: e.tex, text: '다음을 계산하세요.', ast: e.ast, ans: ans, cands: cands, steps: steps, ok: keys(ans.s || ans).length >= 1,
      hints: [ADD, h2, '① 근호 안에 제곱수가 숨어 있으면 먼저 꺼내요. 분모에 근호가 있으면 유리화해요. ② 근호 안의 수가 같은 항끼리 모아요. ③ 근호 밖의 수만 부호대로 더하고 빼요. ④ 근호 안의 수가 다른 항은 합치지 않고 그대로 써요.'] });
  };
  var okAd = function (q) { var p = addBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B18.add', title: '근호의 덧셈 · 뺄셈', ids: ['radicands-added', 'coef-multiplied', 'sign', 'root-dropped', 'all-merged', 'cross', 'square-out', 'denominator-only', 'numerator-only'], build: addBuild,
    levels: [
      { name: '근호 안의 수가 같은 식', vars: { q: sampler(function (r) { return until(function () { var a = r.pick(SF), n = r.int(2, 3), t = []; while (t.length < n) t.push([nz(r, -9, 9), a]); return { kind: 'same', a: a, terms: t, o: order4(r) }; }, okAd); }) } },
      { name: '근호가 두 종류인 식', vars: { q: sampler(function (r) {
          return until(function () { var a = r.pick(SF), b = r.pick(SF); return a === b ? null : { kind: 'two', a: a, b: b, terms: [[nz(r, -7, 7), a], [nz(r, -7, 7), b], [nz(r, -7, 7), a], [nz(r, -7, 7), b]], o: order4(r) }; }, okAd);
        }) } },
      { name: '먼저 간단히 해야 하는 식', vars: { q: sampler(function (r) {
          return until(function () { var a = r.pick([2, 3, 5, 6, 7]), frac = r.int(0, 2) === 0, n = frac ? r.int(1, 2) : r.int(2, 3), ks = []; while (ks.length < n) ks.push(pm(r, r.int(1, 6))); if (ks[0] < 0 && r.int(0, 1)) ks[0] = -ks[0]; return { kind: 'simp', a: a, ks: ks, c: frac ? pm(r, r.int(1, 5)) : 0, o: order4(r) }; }, function (q) { return okAd(q) && q.ks.every(function (k) { return k * k * q.a <= 300; }); });
        }) } }
    ]
  });

  /* ── B18.mixed 분배법칙과 혼합 계산 ──────────────────── */
  var MIX = '괄호 밖의 수는 괄호 안의 모든 항에 하나씩 곱해요(분배법칙). 선물을 나눠 줄 때 방 안의 모든 사람에게 하나씩 주는 것과 같아요. 한 사람만 주고 나오면 안 돼요. 곱할 때는 근호 안의 수끼리 곱하고, 제곱수가 생기면 근호 밖으로 꺼내요. 마지막에 근호 안의 수가 같은 항이 있으면 합쳐요.';
  var mixBuild = function (q) {
    var o = q.out, T = q.inn, oT = kt(o[0], o[1]), oA = kr(o[0], o[1]), tA = function (t) { return t[1] === 1 ? num(abs(t[0])) : kr(abs(t[0]), t[1]); }, tT = function (t) { return t[1] === 1 ? String(abs(t[0])) : kt(abs(t[0]), t[1]); };
    var inner = tT(T[0]) + (T[1][0] < 0 ? ' - ' : ' + ') + tT(T[1]), innerA = (T[1][0] < 0 ? sb : ad)(tA(T[0]), tA(T[1])), s2 = T[1][0] < 0 ? -1 : 1;
    var tex, ast, ans, cands, steps, h2, p1, p2, tail = q.tail, div = q.kind === 'div', op = div ? dv : mul;
    var W_FIRST = '괄호 안의 첫 항에만 계산했어요. 괄호 밖의 수는 괄호 안의 모든 항에 하나씩 계산해 줘야 해요.';
    var W_SIGN = '둘째 항의 부호가 틀렸어요. 괄호 안의 $+$, $-$ 부호는 계산한 뒤에도 그대로 따라가요.';
    p1 = seval(op(tA(T[0]), oA)); p2 = seval(op(tA(T[1]), oA));
    if (!p1 || !p2) return null;
    if (div) { tex = '(' + inner + ') \\div ' + oT; ast = dv(innerA, oA); }
    else { tex = oT + '(' + inner + ')'; ast = mul(oA, innerA); }
    if (tail) { tex += (tail[0] < 0 ? ' - ' : ' + ') + kt(abs(tail[0]), tail[1]); ast = (tail[0] < 0 ? sb : ad)(ast, kr(abs(tail[0]), tail[1])); }
    ans = seval(ast);
    var tl = tail ? sk(tail[0], tail[1]) : {}, plus = function (x, y) { return inOrder(tail ? [x, y, tl] : [x, y]); }, sc = function (x) { return s2 < 0 ? sneg(x) : x; };
    var k1 = keys(p1)[0];
    cands = [[plus(p1, sc(seval(tA(T[1])))), 'first-only', W_FIRST], [plus(p1, sneg(sc(p2))), 'sign', W_SIGN],
      tail ? [inOrder([p1, sc(p2)]), 'tail-ignored', '괄호 뒤에 있는 항을 빠뜨렸어요. 괄호를 푼 다음, 뒤의 항까지 모아서 근호 안의 수가 같은 항끼리 계산해요.'] : null,
      div ? [plus(seval(mul(tA(T[0]), oA)), sc(seval(mul(tA(T[1]), oA)))), 'multiplied', '나누지 않고 곱했어요. $\\div$ 기호를 다시 확인해요. 괄호 안의 각 항을 나눠요.'] : null,
      k1 !== 1 ? [plus(S1(rmul(p1[k1], R(k1)), 1), sc(p2)), 'root-dropped', '첫 항에서 근호를 빼먹었어요. 근호 안의 수끼리 계산한 다음, 제곱수일 때만 근호를 벗겨요.'] : null,
      [plus(seval(tA(T[0])), sc(p2)), 'second-only', '괄호 안의 둘째 항에만 계산했어요. 괄호 밖의 수는 괄호 안의 모든 항에 하나씩 계산해 줘야 해요.']];
    steps = [{ say: div ? '괄호 안의 각 항을 $' + oT + '$' + pj(o[1], '으로/로') + ' 나눠요. 분수로 쓰면 편해요.' : '괄호 밖의 수를 괄호 안의 각 항에 곱해요(분배법칙).',
        tex: (div ? '\\dfrac{' + tT(T[0]) + '}{' + oT + '}' + (s2 < 0 ? ' - ' : ' + ') + '\\dfrac{' + tT(T[1]) + '}{' + oT + '}' : oT + ' \\times ' + tT(T[0]) + (s2 < 0 ? ' - ' : ' + ') + oT + ' \\times ' + tT(T[1])) + (tail ? (tail[0] < 0 ? ' - ' : ' + ') + kt(abs(tail[0]), tail[1]) : '') },
      { say: div ? '근호 안의 수끼리 나누고, 분모에 근호가 남으면 유리화해요.' : '근호 안의 수끼리 곱하고, 제곱수가 생기면 근호 밖으로 꺼내요.', tex: sumOf([{ tex: stex(p1), ast: num(0), neg: false }]).tex + (function () { var z = sc(p2), k = keys(z), ng = k.length === 1 && z[k[0]].n < 0; return (ng ? ' - ' : ' + ') + stex(ng ? sneg(z) : z); })() + (tail ? (tail[0] < 0 ? ' - ' : ' + ') + stex(sk(abs(tail[0]), tail[1])) : '') },
      { say: '근호 안의 수가 같은 항이 있으면 합쳐요. 없으면 그대로가 답이에요.', tex: plus(p1, sc(p2)).tex }];
    h2 = (div ? '괄호 전체를 $' + oT + '$' + pj(o[1], '으로/로') + ' 나누는 식이에요. 나눗셈도 괄호 안의 두 항에 각각 해 줘요. 항마다 분수로 써 놓고, 근호 안의 수끼리 나눠요. 나누어떨어지지 않아 분모에 근호가 남으면 유리화해요.' : '괄호 밖의 $' + oT + '$' + pj(o[1], '을/를') + ' 괄호 안의 두 항에 각각 곱해요. 첫 항에 한 번, 둘째 항에 한 번, 모두 두 번 곱하는 거예요. 곱할 때는 근호 밖의 수끼리, 근호 안의 수끼리 따로 곱해요. 근호 안에 제곱수가 생기면(예: 같은 수끼리 곱했을 때) 근호 밖으로 꺼내요.')
      + ' 괄호 안의 $' + (s2 < 0 ? '-' : '+') + '$ 부호는 그대로 가져가요.' + (tail ? ' 괄호를 다 풀고 나면 뒤에 있는 항과 근호 안의 수가 같은 항을 찾아 합쳐요.' : '');
    return finish({ tex: tex, text: '다음을 계산하세요.', ast: ast, ans: plus(p1, sc(p2)), cands: cands, steps: steps, ok: keys(ans).length >= 1 && !(keys(ans).length === 1 && keys(ans)[0] === 1) && keys(p1).length === 1 && keys(p2).length === 1 && Object.keys(ans).every(function (k) { return ans[k].d <= 9; }),
      hints: [MIX, h2, '① 괄호 밖의 수를 괄호 안의 모든 항에 하나씩 곱해요(나누는 식이면 하나씩 나눠요). ② 항마다 근호 안의 수끼리 계산해요. ③ 제곱수는 근호 밖으로 꺼내고, 분모의 근호는 유리화해요. ④ 근호 안의 수가 같은 항끼리 합쳐요.'] });
  };
  var okMx = function (q) { var p = mixBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B18.mixed', title: '분배법칙과 혼합 계산', ids: ['first-only', 'sign', 'root-dropped', 'tail-ignored', 'multiplied', 'second-only'], build: mixBuild,
    levels: [
      { name: '근호끼리의 분배법칙', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () { var a = r.pick([2, 3, 5, 7]), b = r.pick(SF), c = r.pick(SF); return b === c || gcd(a, b) !== 1 || gcd(a, c) !== 1 ? null : { kind: 'dist', out: [1, a], inn: [[1, b], [pm(r, 1), c]], o: order4(r) }; }, okMx);
        }) } },
      { name: '제곱수가 생기는 분배법칙', vars: { q: sampler(function (r) {
          return until(function () {
            var a = r.pick([2, 3, 5, 6, 7]), k = r.pick([1, 1, 2, 3]), t1 = r.int(0, 1) ? [r.int(1, 4), a * r.pick([1, 2, 3, 5])] : [r.int(1, 4), r.pick(SF)], t2 = r.int(0, 1) ? [pm(r, r.int(1, 9)), 1] : [pm(r, r.int(1, 4)), r.pick(SF)];
            return t1[1] === t2[1] || sfree(t1[1])[1] === 1 ? null : { kind: 'dist', out: [k, a], inn: [t1, t2], o: order4(r) };
          }, function (q) { var x = seval(mul(kr(q.out[0], q.out[1]), kr(q.inn[0][0], q.inn[0][1]))), y = q.inn[1][1] === 1 ? null : seval(mul(kr(q.out[0], q.out[1]), kr(abs(q.inn[1][0]), q.inn[1][1]))); return okMx(q) && (sfree(q.out[1] * q.inn[0][1])[0] > 1 || q.inn[1][1] === 1 || (y && sfree(q.out[1] * q.inn[1][1])[0] > 1)) && !!x; });
        }) } },
      { name: '괄호를 나누는 식 · 뒤에 항이 더 있는 식', vars: { q: sampler(function (r) {
          return until(function () {
            var c = r.pick([2, 3, 5, 6, 7]), x, y, a, b, d;
            if (r.int(0, 1)) { x = r.pick([2, 3, 5, 6, 7, 10]); y = r.int(0, 1) ? [pm(r, c * r.int(1, 4)), 1] : [pm(r, 1), c * r.pick([2, 3, 5, 6, 7])]; return y[1] === c * x || x === c || (y[1] !== 1 && sfree(y[1])[1] === 1) ? null : { kind: 'div', out: [1, c], inn: [[r.int(1, 3), c * x], y], o: order4(r) }; }
            a = r.pick([2, 3, 5]); b = r.pick(SF); d = r.pick(SF); if (b === d || gcd(a, b) !== 1) return null;
            return { kind: 'dist', out: [1, a], inn: [[1, b], [pm(r, 1), d]], tail: [pm(r, r.int(1, 4)), r.int(0, 1) ? a * b * r.pick([1, 4]) : sfree(a * d)[1] * r.pick([4, 9])], o: order4(r) };
          }, function (q) { return okMx(q) && (!q.tail || (q.tail[1] <= 200 && sfree(q.tail[1])[1] !== 1 && keys(seval(mul(kr(1, q.out[1]), ad(kr(1, q.inn[0][1]), kr(1, q.inn[1][1]))))).some(function (k) { return k === sfree(q.tail[1])[1]; }))); });
        }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B18', [
  { title: '근호끼리 곱하고 나누기', body: [
    '근호끼리 곱하거나 나눌 때는 근호 안의 수끼리 계산해서 근호 하나에 담아요.',
    { tex: '\\sqrt{2} \\times \\sqrt{3} = \\sqrt{6},\\quad \\sqrt{6} \\div \\sqrt{2} = \\sqrt{3}' },
    '근호 밖에 수가 있으면 밖의 수끼리, 안의 수끼리 따로 계산해요.',
    { tex: '2\\sqrt{3} \\times 4\\sqrt{5} = 8\\sqrt{15}' },
    '더하기는 이렇게 할 수 없어요. $\\sqrt{2} + \\sqrt{3}$은 $\\sqrt{5}$가 아니에요.'
  ] },
  { title: '근호 밖으로 꺼내기, 안으로 넣기', body: [
    '근호 안에 제곱수가 숨어 있으면 제곱근이 되어 밖으로 나와요. 신발 한 켤레가 하나로 묶여 나오는 것과 같아요.',
    { tex: '\\sqrt{12} = \\sqrt{2^{2} \\times 3} = 2\\sqrt{3}' },
    '거꾸로 밖의 수를 안으로 넣을 때는 제곱해서 넣어요.',
    { tex: '3\\sqrt{2} = \\sqrt{3^{2} \\times 2} = \\sqrt{18}' },
    { ex: [['\\sqrt{\\dfrac{3}{4}} = \\dfrac{\\sqrt{3}}{2}', '분모의 제곱수도 꺼내요'], ['-2\\sqrt{5} = -\\sqrt{20}', '$-$ 부호는 밖에 남겨요']] }
  ] },
  { title: '분모의 유리화', body: [
    '분모에 근호가 있으면 분모와 분자에 같은 근호를 곱해서 분모의 근호를 없애요.',
    { tex: '\\dfrac{1}{\\sqrt{2}} = \\dfrac{1 \\times \\sqrt{2}}{\\sqrt{2} \\times \\sqrt{2}} = \\dfrac{\\sqrt{2}}{2}' },
    '위아래에 같은 수를 곱하는 것은 1을 곱하는 것과 같아서 값이 변하지 않아요.',
    { ex: [['\\dfrac{6}{\\sqrt{3}} = \\dfrac{6\\sqrt{3}}{3} = 2\\sqrt{3}', '마지막에 약분해요'], ['\\dfrac{3}{\\sqrt{12}} = \\dfrac{3}{2\\sqrt{3}} = \\dfrac{\\sqrt{3}}{2}', '분모를 먼저 간단히 해요']] }
  ] },
  { title: '근호의 덧셈과 뺄셈', body: [
    '근호 안의 수가 같은 것끼리만 모아서 근호 밖의 수를 더하고 빼요. $3x + 5x = 8x$와 같은 방법이에요.',
    { tex: '3\\sqrt{2} + 5\\sqrt{2} = (3 + 5)\\sqrt{2} = 8\\sqrt{2}' },
    '근호 안의 수가 다르면 합칠 수 없어요. 사과와 귤을 한 가지로 셀 수 없는 것과 같아요.',
    { tex: '2\\sqrt{3} + \\sqrt{5} \\quad \\text{(더 간단히 할 수 없다)}' },
    '달라 보여도 제곱수를 꺼내면 같아질 수 있어요.',
    { tex: '\\sqrt{12} + \\sqrt{27} = 2\\sqrt{3} + 3\\sqrt{3} = 5\\sqrt{3}' }
  ] },
  { title: '분배법칙', body: [
    '괄호 밖의 수는 괄호 안의 모든 항에 하나씩 곱해요.',
    { tex: '\\sqrt{2}(\\sqrt{3} + \\sqrt{5}) = \\sqrt{6} + \\sqrt{10}' },
    '곱해서 제곱수가 생기면 근호 밖으로 꺼내요.',
    { tex: '\\sqrt{3}(\\sqrt{12} - 2) = \\sqrt{36} - 2\\sqrt{3} = 6 - 2\\sqrt{3}' }
  ] }
]);
