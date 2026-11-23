/* C03 인수분해 — 세제곱 공식, 세 항의 제곱, 치환, 사차식, 인수정리를 이용한 고차식 인수분해
   유형(쉬운 것부터): C03.cube 세제곱 꼴 (a ± b)³ · C03.sumcube 세제곱의 합과 차 · C03.trisq 세 항의 제곱 (a + b + c)²
                     · C03.subst 공통부분을 한 덩어리로(치환) · C03.biquad 사차식 x⁴ + ax² + b · C03.theorem 인수정리와 조립제법 (여기까지 보기 고르기)
                     · C03.blank 인수분해한 식의 빈 계수 · C03.value 인수분해로 식의 값 구하기 (키패드, 부호 있는 정수)
   답이 식이면 보기 고르기, 답이 수 하나이면 키패드다.
   문자가 여럿인 식은 항의 목록으로, 한 문자의 다항식은 계수의 배열(높은 차수부터)로 다룬다. 계산은 모두 정수로 한다.
   틀린 보기는 '흔한 실수 하나를 저지른 인수분해'다. 검산은 문제의 식과 답을 MH.alg.sameVal 로 견준다.
   단, '끝까지 인수분해하지 않은 식'(not-finished)은 값이 답과 같고 글자만 다르다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, order4 = A.order4, sameVal = A.sameVal, abs = Math.abs, isInt = Number.isInteger, gcd = MH.gcd;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var sgn = function (x) { return x < 0 ? -1 : 1; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  /** 식 뒤의 조사: 거듭제곱으로 끝나면 "제곱", 수로 끝나면 그 수, 문자로 끝나면 받침 없는 소리를 따른다 */
  var jx = function (t, pair) {
    var s = t.replace(/\)+$/, ''), m;
    if (/\^\{\d+\}$/.test(s)) return josa('곱', pair).slice(1);
    if ((m = /(\d+)$/.exec(s))) return josa(m[1], pair).slice(m[1].length);
    return josa('가', pair).slice(1);
  };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  var perm6 = function (r) { return r.shuffle([0, 1, 2, 3, 4, 5]); };
  var wo = function (r, q) { q.perm = perm6(r); q.o = order4(r); return q; };
  /** 제곱수이면 그 제곱근, 아니면 -1 */
  var isq = function (n) { var s; for (s = 0; s * s <= n; s++) if (s * s === n) return s; return -1; };

  /* ── 항과 다항식 ── */
  var ORDER = ['a', 'b', 'p', 'q', 'x', 'y', 'z'];
  var T = function (c, e) { return { c: c, e: e || {} }; };
  var key = function (e) { return ORDER.filter(function (k) { return e[k]; }).map(function (k) { return k + (e[k] === 1 ? '' : '^{' + e[k] + '}'); }).join(''); };
  var mulT = function (a, b) { var e = {}; ORDER.forEach(function (k) { var x = (a.e[k] || 0) + (b.e[k] || 0); if (x) e[k] = x; }); return T(a.c * b.c, e); };
  var sq = function (t) { return mulT(t, t); };
  var neg = function (t) { return T(-t.c, t.e); };
  var mag = function (t) { return T(abs(t.c), t.e); };
  var scale = function (t, k) { return T(t.c * k, t.e); };
  var ptex = function (ts) { return poly(ts.map(function (t) { return [t.c, key(t.e)]; })); };
  var one = function (t) { return ptex([t]); };
  var bin = function (P) { return '(' + ptex(P) + ')'; };
  /** 거듭제곱을 쓴다: x → x^{3}, 3 → 3^{3}, 2x → (2x)^{3}, -3 → (-3)^{3} */
  var powTex = function (t, n) { var s = one(t); return (/^[a-z]$|^\d+$/.test(s) ? s : '(' + s + ')') + '^{' + n + '}'; };
  var wrap = function (t) { var s = one(t); return s.charAt(0) === '-' ? '(' + s + ')' : s; };
  var powNum = function (n, k) { return par(n) + '^{' + k + '}'; };

  /* ── 한 문자의 다항식: 계수의 배열(높은 차수부터). [2, 0, -3] 은 2x² − 3 ── */
  var D = function (cs) { var n = cs.length - 1; return cs.map(function (c, i) { return T(c, n - i ? { x: n - i } : {}); }).filter(function (t) { return t.c !== 0; }); };
  var dmul = function (p, q) { var out = [], i; for (i = 0; i < p.length + q.length - 1; i++) out.push(0); p.forEach(function (a, i2) { q.forEach(function (b, j) { out[i2 + j] += a * b; }); }); return out; };
  var ipow = function (a, n) { var x = 1, i; for (i = 0; i < n; i++) x *= a; return x; };
  var sg = function (n) { return (n < 0 ? '- ' : '+ ') + abs(n); };
  /** x 자리에 수(aTex)를 넣은 식: 2^{3} - 3 \times 2 + 1 */
  var numLine = function (cs, aTex) {
    var n = cs.length - 1, out = '', pw = function (d) { return d === 1 ? aTex : aTex + '^{' + d + '}'; };
    cs.forEach(function (c, i) {
      var d = n - i, ng = c < 0, body;
      if (c === 0) return;
      body = d === 0 ? String(abs(c)) : (abs(c) === 1 ? '' : abs(c) + ' \\times ') + pw(d);
      out += (out ? (ng ? ' - ' : ' + ') : (ng ? '-' : '')) + body;
    });
    return out;
  };
  /** 조립제법: 가운데 줄 m, 아랫줄 b */
  var synth = function (cs, r) { var b = [cs[0]], m = [null], i; for (i = 1; i < cs.length; i++) { m.push(r * b[i - 1]); b.push(cs[i] + m[i]); } return { m: m, b: b }; };
  var tableTex = function (cs, r) {
    var s = synth(cs, r);
    return '\\begin{array}{c|' + cs.map(function () { return 'c'; }).join('') + '} ' + r + ' & ' + cs.join(' & ') + ' \\\\ & & ' + s.m.slice(1).join(' & ') + ' \\\\ \\hline & ' + s.b.join(' & ') + ' \\end{array}';
  };

  /* ── 인수분해한 꼴 ── */
  /** 일차식 x + c */
  var lf = function (c) { return c === 0 ? 'x' : '(x ' + sg(c) + ')'; };
  /** 이차식 x² + bx + c 를 괄호로 */
  var Qd = function (b, c) { return bin(D([1, b, c])); };
  /** 일차식의 상수를 놓는 차례: 절댓값이 작은 것부터, 같으면 양수 먼저 */
  var sortC = function (p, q) { return abs(p) - abs(q) || q - p; };
  var constOf = function (t) { var m = /^\(x ([+-]) (\d+)\)$/.exec(t); return m ? (m[1] === '-' ? -1 : 1) * Number(m[2]) : 0; };
  /** 일차식을 앞에(상수의 차례대로), 이차식을 뒤에 */
  var parts = function (list) {
    return list.filter(function (t) { return t.indexOf('^') < 0; }).sort(function (s, t) { return sortC(constOf(s), constOf(t)); }).concat(list.filter(function (t) { return t.indexOf('^') >= 0; }));
  };
  /** 곱으로 쓴다. 같은 괄호는 거듭제곱으로 모은다: (x + 2)^{2}(x - 1) */
  var facs = function (list) {
    var seen = [], n = {};
    list.forEach(function (t) { if (n[t]) n[t]++; else { n[t] = 1; seen.push(t); } });
    return seen.map(function (t) { return n[t] === 1 ? t : t + '^{' + n[t] + '}'; }).join('');
  };
  var lfs = function (cs) { return facs(cs.slice().sort(sortC).map(lf)); };
  var irreducible = function (b, c) { var d = b * b - 4 * c; return d < 0 || isq(d) < 0; };
  /** x² + bx + c 를 정수 범위에서 인수분해한 조각들 */
  var quadF = function (b, c) { var d = b * b - 4 * c, s = d < 0 ? -1 : isq(d); return s < 0 ? [Qd(b, c)] : [lf((b + s) / 2), lf((b - s) / 2)]; };
  /** x² + m 을 인수분해한 조각들(제곱의 차일 때만 갈라진다) */
  var sqF = function (m) { var k = m < 0 ? isq(-m) : -1; return k > 0 ? [lf(k), lf(-k)] : [Qd(0, m)]; };

  /* ── 틀: 보기 고르기 ── */
  /** 틀린 보기 후보의 차례: first 는 늘 앞에, rest 는 문제마다 섞은 차례(perm)로 */
  var mixc = function (first, rest, perm) {
    return first.concat(rest.map(function (c, i) { return [perm[i % perm.length], i, c]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }).map(function (x) { return x[2]; }));
  };
  /** 보기 고르기 문제를 마무리한다: 글자도 값도 서로 다른 틀린 보기 3개(실수 id 는 한 번씩), 검산.
      c[3] 이 참인 후보는 '끝까지 인수분해하지 않은 식'이다: 값은 답과 같고 글자만 다르다 */
  var finish = function (o) {
    var ans = o.ans, seen = [ans], texts = [ans], wrong = [];
    o.cands.forEach(function (c) {
      var t;
      if (!c || !c[0] || wrong.length >= 3 || wrong.some(function (w) { return w[1] === c[1]; })) return;
      t = c[0];
      if (t.length > 40 || texts.indexOf(t) >= 0 || (c[3] ? !sameVal(t, ans) : seen.some(function (s) { return sameVal(s, t); }))) return;
      if (!c[3]) seen.push(t);
      texts.push(t); wrong.push([t, c[1], c[2]]);
    });
    return { tex: o.raw, text: '다음 식을 인수분해하세요.', ans: ans, wrong: wrong, hints: o.hints, steps: o.steps, check: wrong.length === 3 && ans.length <= 40 && sameVal(o.raw, ans) && o.ok !== false };
  };
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'C03', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { text: p.text, tex: p.tex }; },
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
  /* ── 틀: 부호 있는 정수 하나(키패드). build(q) → { text, tex, ans: 0 이 아닌 정수, hints, steps, wrong: { 실수 id: 정수 }, check }
     답이 문제에 없는 수인데 힌트에 그 수가 나오면 거른다 ── */
  var numQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (n) { return { n: n, p: 0 }; };
    var leak = function (p) { var a = String(abs(p.ans)); return nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    var okW = function (p, x) { return isInt(x) && x !== p.ans && x !== 0 && x !== -p.ans; };
    var count = function (p) { var seen = []; o.mistakes.forEach(function (m) { var x = p.wrong[m[0]]; if (okW(p, x) && seen.indexOf(x) < 0) seen.push(x); }); return seen.length; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && p.ans !== 0 && abs(p.ans) <= 9999999 && p.check === true && !leak(p) && count(p) >= 2; }; });
    MH.defineType({
      id: o.id, unit: 'C03', version: 1, title: o.title,
      answer: { kind: 'signed' },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { text: p.text, tex: p.tex }; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v); return p.check === true && ans.p === 0 && ans.n === p.ans; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), x = p.wrong[m[0]], i;
            if (!okW(p, x)) return null;                                        /* 부호만 반대인 답은 공통 실수(sign)가 맡는다 */
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) if (p.wrong[o.mistakes[i][0]] === x) return null;
            return val(x);
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  var UNDONE = '아직 인수분해가 끝나지 않았어요. 값은 처음 식과 같지만, 괄호 안의 식을 한 번 더 인수분해할 수 있어요. 더 쪼갤 수 없을 때까지 해요.';
  var CHECK = '다 쓴 다음에는 거꾸로 전개해서 확인해요. 전개한 식이 처음 식과 글자 하나 다르지 않고 같아야 해요. 전부 전개하기 힘들면 가장 높은 차수의 항과 상수항만 맞춰 봐도 실수를 많이 잡을 수 있어요.';
  /** 두 문자 x, y(또는 p, q)로 만든 두 항: a·x, b·y(또는 수 b) */
  var mk2 = function (q) { var v = q.v || 'x', w = v === 'x' ? 'y' : 'q', ea = {}, eb = {}; ea[v] = 1; if (q.y) eb[w] = 1; return [T(q.a, ea), T(q.b, eb)]; };

  /* ── C03.cube 세제곱 꼴 (a ± b)³ ───────────────────────── */
  var CU_KEY = '인수분해는 전개를 거꾸로 하는 것이에요. 전개 공식을 오른쪽에서 왼쪽으로 읽으면 인수분해 공식이 돼요. $a^{3} + 3a^{2}b + 3ab^{2} + b^{3} = (a + b)^{3}$, $a^{3} - 3a^{2}b + 3ab^{2} - b^{3} = (a - b)^{3}$. 쌓기나무로 만든 큰 정육면체를 보고 한 모서리의 길이를 알아내는 것과 같아요. 항이 네 개이고 양 끝이 세제곱 꼴이면 이 공식을 떠올려요.';
  var cubeBuild = function (q) {
    var ab = mk2(q), a = ab[0], b = ab[1], a2 = sq(a), b2 = sq(b), a3 = mulT(a2, a), b3 = mulT(b2, b), m1 = scale(mulT(a2, b), 3), m2 = scale(mulT(a, b2), 3);
    var raw = ptex([a3, m1, m2, b3]), cu = function (x, y) { return bin([x, y]) + '^{3}'; }, ans = cu(a, b), plus = q.b > 0, cands;
    cands = mixc([[cu(a, neg(b)), 'sign', '부호가 반대예요. 처음 식의 부호를 봐요. 네 항의 부호가 모두 +이면 $(a + b)^{3}$ 꼴이고, +와 −가 번갈아 나오면 $(a - b)^{3}$ 꼴이에요.']], [
      [bin([a, b]) + '^{2}', 'square', '세제곱이 아니라 제곱으로 썼어요. 처음 식은 가장 높은 차수가 3인 삼차식이에요. 제곱한 식은 전개해도 이차식이라서 처음 식이 나오지 않아요.'],
      [bin([a, b]) + bin([a2, neg(mulT(a, b)), b2]), 'sumcube', '세제곱의 합과 차 공식과 헷갈렸어요. 그 공식은 $a^{3} + b^{3}$처럼 항이 두 개일 때 써요. 항이 네 개이고 가운데에 두 항이 더 있으면 $(a + b)^{3}$ 꼴이에요.'],
      abs(q.b) >= 2 ? [cu(a, T(b3.c, b.e)), 'not-rooted', '끝 항의 수를 그대로 괄호 안에 넣었어요. 괄호 안에는 세 번 곱해서 끝 항이 되는 수가 들어가요. 8이면 2, 27이면 3, 64이면 4, 125이면 5예요.'] : null,
      q.a === 1 ? [cu(a, T(3 * q.b, b.e)), 'third', '둘째 항의 계수를 그대로 괄호 안에 넣었어요. 둘째 항의 계수는 공식의 $3a^{2}b$에서 나온 것이라 괄호 안의 수의 3배예요. 끝 항이 무엇의 세제곱인지로 찾아요.'] : null,
      q.a >= 2 ? [cu(T(a3.c, a.e), b), 'coef-kept', '첫 항의 계수를 그대로 괄호 안에 넣었어요. 계수도 세 번 곱해서 처음 수가 되는 수로 바꿔요. 8이면 2, 27이면 3이에요. $8x^{3} = (2x)^{3}$이에요.'] : null
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands, ok: gcd(q.a, q.b) === 1,
      steps: [{ say: '양 끝의 항이 무엇을 세 번 곱한 것인지 찾아요.', tex: one(a3) + ' = ' + powTex(a, 3) + ',\\quad ' + one(b3) + ' = ' + powTex(b, 3) },
        { say: '가운데 두 항이 공식의 $3a^{2}b$, $3ab^{2}$과 맞는지 계산해서 확인해요.', tex: one(m1) + ' = 3 \\times ' + powTex(a, 2) + ' \\times ' + wrap(b) + ',\\quad ' + one(m2) + ' = 3 \\times ' + wrap(a) + ' \\times ' + powTex(b, 2) },
        { say: '네 항이 모두 공식과 맞아요. 세제곱 꼴로 묶어요.', tex: ans }],
      hints: [CU_KEY,
        '① 첫 항 $' + one(a3) + '$' + jx(one(a3), '은/는') + ' 무엇을 세 번 곱한 것인지 찾아요. ② 끝 항 $' + one(b3) + '$' + jx(one(b3), '은/는') + ' 무엇을 세 번 곱한 것인지 찾아요. ' + (plus ? '끝 항이 양수이니 양수를 세 번 곱한 것이에요.' : '끝 항이 음수이니 음수를 세 번 곱한 것이에요.') + ' ③ 찾은 둘을 공식의 $a$, $b$ 자리에 놓고, 가운데 두 항이 $3a^{2}b$, $3ab^{2}$과 같은지 계산해 봐요.',
        '부호는 이렇게 정해요. 처음 식의 부호가 모두 +이면 괄호 안도 +예요. 부호가 +, −, +, −로 번갈아 나오면 괄호 안은 −예요. 괄호 밖의 지수는 3이에요. ' + CHECK] });
  };
  choiceQ({
    id: 'C03.cube', title: '세제곱 꼴로 인수분해', build: cubeBuild, ids: ['sign', 'square', 'sumcube', 'not-rooted', 'third', 'coef-kept'],
    levels: [
      { name: '(x ± b)³ 꼴', minDistinct: 20, vars: { q: sampler(function (r) { return wo(r, { v: r.pick(['x', 'p']), a: 1, b: nz(r, -6, 6), y: false }); }) } },
      { name: '문자가 둘', minDistinct: 18, vars: { q: sampler(function (r) { return wo(r, { v: r.pick(['x', 'p']), a: 1, b: nz(r, -5, 5), y: true }); }) } },
      { name: '첫 항에 계수가 있는 식', minDistinct: 30, vars: { q: sampler(function (r) { return wo(r, { v: r.pick(['x', 'p']), a: r.int(2, 3), b: nz(r, -4, 4), y: r.int(0, 1) === 1 }); }) } }
    ]
  });

  /* ── C03.sumcube 세제곱의 합과 차 ─────────────────────── */
  var SC_KEY = '세제곱인 두 항을 더하거나 뺀 식은 이렇게 인수분해해요. $a^{3} + b^{3} = (a + b)(a^{2} - ab + b^{2})$, $a^{3} - b^{3} = (a - b)(a^{2} + ab + b^{2})$. 첫째 괄호에는 세제곱하기 전의 두 수를 처음 식과 같은 부호로 써요. 둘째 괄호에는 두 수의 제곱을 양 끝에 놓고, 가운데에 두 수의 곱을 반대 부호로 써요. 제곱의 차 $a^{2} - b^{2} = (a + b)(a - b)$의 세제곱 판이라고 생각하면 돼요.';
  var LOST = '공통인수를 빠뜨렸어요. 처음에 묶어 낸 수는 끝까지 맨 앞에 남아 있어야 해요. 전개해서 처음 식과 같은지 확인해요.';
  var scBuild = function (q) {
    var ab = mk2(q), a = ab[0], b = ab[1], g = q.g || 1, a2 = sq(a), a3 = mulT(a2, a), b3 = mulT(sq(b), b), inner = [a3, b3], shown = inner.map(function (t) { return scale(t, g); }), raw = ptex(shown), pg = g === 1 ? '' : String(g);
    var second = function (y, k) { return bin([a2, scale(mulT(a, y), k), sq(y)]); }, form = function (y, k) { return pg + bin([a, y]) + second(y, k); };
    var ans = form(b, -1), plus = q.b > 0, cands, steps, MID = '둘째 괄호의 가운데 항의 부호가 틀렸어요. 가운데 항은 첫째 괄호와 반대 부호예요. 합이면 가운데는 −, 차이면 가운데는 +예요.';
    cands = mixc(g > 1 ? [[pg + bin(inner), 'not-finished', UNDONE, true]] : [[form(b, 1), 'mid-sign', MID]], [
      g > 1 ? [bin([a, b]) + second(b, -1), 'lost', LOST] : null,
      g > 1 ? [form(b, 1), 'mid-sign', MID] : null,
      [form(neg(b), -1), 'swapped', '합의 공식과 차의 공식을 바꿔 썼어요. 첫째 괄호의 부호는 처음 식의 부호와 같아야 해요. 처음 식이 더하기이면 첫째 괄호도 더하기예요.'],
      [form(b, -2), 'double', '둘째 괄호의 가운데 항을 2배로 썼어요. 완전제곱식의 $2ab$와 헷갈렸어요. 이 공식의 가운데 항은 두 수를 한 번만 곱한 $ab$예요.'],
      [pg + bin([a, b]) + '^{3}', 'as-cube', '합을 통째로 세제곱했어요. $a^{3} + b^{3}$과 $(a + b)^{3}$은 다른 식이에요. $(a + b)^{3}$을 전개하면 가운데에 항이 두 개 더 생겨요.'],
      abs(q.b) >= 2 ? [form(T(b3.c, b.e), -1), 'not-rooted', '둘째 항의 수를 그대로 괄호 안에 넣었어요. 괄호 안에는 세 번 곱해서 그 수가 되는 수가 들어가요. 8이면 2, 27이면 3, 64이면 4예요.'] : null
    ], q.perm);
    steps = (g > 1 ? [{ say: '두 항에 공통으로 들어 있는 수 $' + g + '$' + pj(g, '을/를') + ' 먼저 묶어 내요.', tex: raw + ' = ' + pg + bin(inner) }] : []).concat([
      { say: (g > 1 ? '괄호 안의 ' : '') + '두 항이 무엇을 세 번 곱한 것인지 찾아 세제곱 꼴로 써요.', tex: ptex(inner) + ' = ' + powTex(a, 3) + (plus ? ' + ' : ' - ') + powTex(mag(b), 3) },
      { say: plus ? '세제곱의 합이에요. 첫째 괄호는 더하기, 둘째 괄호의 가운데 항은 빼기예요.' : '세제곱의 차예요. 첫째 괄호는 빼기, 둘째 괄호의 가운데 항은 더하기예요.', tex: ans }]);
    return finish({ raw: raw, ans: ans, cands: cands, ok: gcd(q.a, q.b) === 1, steps: steps,
      hints: [SC_KEY,
        (g > 1 ? '① 두 항 $' + one(shown[0]) + '$, $' + one(shown[1]) + '$에 공통으로 들어 있는 가장 큰 수를 먼저 묶어 내요. ② 괄호 안에 남은 두 항이 각각 무엇을 세 번 곱한 것인지 찾아요.'
          : '① 첫 항 $' + one(a3) + '$' + jx(one(a3), '은/는') + ' 무엇을 세 번 곱한 것인지 찾아요. ② 둘째 항의 $' + one(mag(b3)) + '$' + jx(one(mag(b3)), '은/는') + ' 무엇을 세 번 곱한 것인지 찾아요.')
          + ' ③ 찾은 둘을 공식의 $a$, $b$ 자리에 넣어요. 이 식은 두 항을 ' + (plus ? '더한' : '뺀') + ' 꼴이니 ' + (plus ? '합' : '차') + '의 공식을 써요.',
        '부호가 가장 헷갈려요. 첫째 괄호의 부호는 처음 식과 같아요. 둘째 괄호에서는 가운데 항만 그 반대이고, 끝 항은 제곱이라서 늘 +예요. 가운데 항은 두 수를 한 번만 곱한 것이고 2배를 하지 않아요. ' + CHECK] });
  };
  choiceQ({
    id: 'C03.sumcube', title: '세제곱의 합과 차', build: scBuild, ids: ['mid-sign', 'swapped', 'double', 'as-cube', 'not-rooted', 'lost', 'not-finished'],
    levels: [
      { name: 'x³ ± b³ 꼴', minDistinct: 20, vars: { q: sampler(function (r) { return wo(r, { v: r.pick(['x', 'p']), a: 1, b: nz(r, -6, 6), y: false }); }) } },
      { name: '계수 · 문자가 있는 식', minDistinct: 55, vars: { q: sampler(function (r) {
        if (r.int(0, 2) === 0) return wo(r, { v: r.pick(['x', 'p']), a: 1, b: nz(r, -5, 5), y: true });
        return wo(r, { v: r.pick(['x', 'p']), a: r.int(2, 3), b: nz(r, -5, 5), y: r.int(0, 1) === 1 });
      }) } },
      { name: '공통인수를 먼저 묶기', minDistinct: 90, vars: { q: sampler(function (r) { return wo(r, { v: r.pick(['x', 'p']), g: r.int(2, 5), a: 1, b: nz(r, -4, 4), y: r.int(0, 1) === 1 }); }) } }
    ]
  });

  /* ── C03.trisq 세 항의 제곱 (a + b + c)² ───────────────────── */
  var TS_KEY = '항이 여섯 개이고 그 가운데 셋이 제곱 꼴이면 이 공식을 떠올려요. $a^{2} + b^{2} + c^{2} + 2ab + 2bc + 2ca = (a + b + c)^{2}$. 정사각형 모양의 땅을 가로와 세로로 세 구역씩 나누면 정사각형 땅 3개와, 같은 것이 2개씩 있는 직사각형 땅 3종류가 생겨요. 제곱인 항 셋이 정사각형, 나머지 셋이 직사각형이에요.';
  var tsBuild = function (q) {
    var a = T(q.a, { x: 1 }), b = T(q.b, { y: 1 }), c = T(q.c, q.z ? { z: 1 } : {}), dbl = function (s, t) { return scale(mulT(s, t), 2); };
    var raw = ptex([sq(a), sq(b), sq(c), dbl(a, b), dbl(b, c), dbl(c, a)]), f = function (x, y, z) { return bin([x, y, z]) + '^{2}'; }, ans = f(a, b, c), cands, kept;
    var SIGN = '괄호 안의 부호가 틀렸어요. 이 식을 전개하면 두 항을 곱한 항($2ab$, $2bc$, $2ca$ 꼴)의 부호가 처음 식과 달라져요. 곱한 항 세 개의 부호를 하나씩 맞춰 봐요.';
    kept = q.a >= 2 || abs(q.b) >= 2 || (q.z && abs(q.c) >= 2);
    cands = mixc([[f(a, neg(b), c), 'sign-b', SIGN]], [
      [f(a, b, neg(c)), 'sign-c', '끝 항의 부호가 틀렸어요. 처음 식에서 끝 항이 곱해진 두 항의 부호를 봐요. 그 부호가 괄호 안의 끝 항의 부호를 정해요. 전개해서 곱한 항의 부호를 견줘 봐요.'],
      [bin([a, b, c]), 'no-square', '괄호 밖의 제곱을 빠뜨렸어요. 처음 식은 이차식이에요. 일차식 하나만으로는 이차식이 될 수 없어요. 같은 괄호를 두 번 곱한 것이니 제곱을 붙여요.'],
      q.b < 0 || q.c < 0 ? [f(a, mag(b), mag(c)), 'all-plus', '부호를 모두 +로 썼어요. 처음 식에 −가 붙은 항이 있어요. 두 항을 곱한 항이 음수이면 그 두 항의 부호가 서로 달라요.'] : null,
      !q.z && abs(q.c) >= 2 ? [f(a, b, T(sgn(q.c) * q.c * q.c)), 'const-kept', '상수항을 그대로 괄호 안에 넣었어요. 괄호 안에는 제곱해서 그 수가 되는 수가 들어가요. 4이면 2, 9이면 3, 16이면 4, 25이면 5예요.'] : null,
      kept ? [f(T(q.a * q.a, a.e), T(sgn(q.b) * q.b * q.b, b.e), q.z ? T(sgn(q.c) * q.c * q.c, c.e) : c), 'coef-kept', '제곱인 항의 계수를 그대로 괄호 안에 넣었어요. $4y^{2}$은 $(2y)^{2}$이에요. 계수도 제곱해서 처음 수가 되는 수로 바꿔요.'] : null
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands, ok: gcd(gcd(q.a, q.b), q.c) === 1,
      steps: [{ say: '제곱인 항 세 개를 찾아 무엇의 제곱인지 써요. 부호는 아직 정하지 않아요.', tex: [a, b, c].map(function (t) { return one(sq(t)) + ' = ' + powTex(mag(t), 2); }).join(',\\quad ') },
        { say: '나머지 세 항의 부호를 보고 괄호 안의 부호를 정해요. 두 항을 곱한 항이 음수이면 그 두 항의 부호가 서로 달라요.', tex: one(dbl(a, b)) + ' = 2 \\times ' + wrap(a) + ' \\times ' + wrap(b) + ',\\quad ' + one(dbl(b, c)) + ' = 2 \\times ' + wrap(b) + ' \\times ' + wrap(c) + ',\\quad ' + one(dbl(c, a)) + ' = 2 \\times ' + wrap(c) + ' \\times ' + wrap(a) },
        { say: '세 항을 한 괄호에 넣고 제곱을 붙여요.', tex: ans }],
      hints: [TS_KEY,
        '① 제곱인 항 세 개 $' + one(sq(a)) + '$, $' + one(sq(b)) + '$, $' + one(sq(c)) + '$' + jx(one(sq(c)), '을/를') + ' 찾아요. 각각 무엇을 제곱한 것인지 써요. ② 그 셋이 공식의 $a$, $b$, $c$예요. ③ 나머지 세 항이 둘씩 곱한 것의 2배가 맞는지 확인하면서 부호를 정해요.',
        '부호는 곱한 항으로 정해요. 첫 항을 +로 놓고 시작해요. 첫 항과 곱해진 항이 +이면 그 항도 +, −이면 그 항은 −예요. 세 항의 부호를 모두 정한 다음, 남은 곱한 항 하나로 맞는지 검산해요. ' + CHECK] });
  };
  choiceQ({
    id: 'C03.trisq', title: '세 항의 제곱 꼴', build: tsBuild, ids: ['sign-b', 'sign-c', 'no-square', 'all-plus', 'const-kept', 'coef-kept'],
    levels: [
      { name: '모두 더하기', minDistinct: 30, vars: { q: sampler(function (r) { var z = r.int(0, 3) === 0; return wo(r, { a: r.int(1, 2), b: r.int(1, 3), c: z ? r.int(1, 2) : r.int(1, 5), z: z }); }) } },
      { name: '빼기가 섞인 식', minDistinct: 80, vars: { q: sampler(function (r) { var z = r.int(0, 3) === 0, s = r.pick([[1, -1], [-1, 1], [-1, -1]]); return wo(r, { a: r.int(1, 2), b: s[0] * r.int(1, 3), c: s[1] * (z ? r.int(1, 2) : r.int(1, 5)), z: z }); }) } },
      { name: '계수가 큰 식', minDistinct: 100, vars: { q: sampler(function (r) { var z = r.int(0, 1) === 1, a = r.int(1, 3); return wo(r, { a: a, b: pm(r, r.int(a === 1 ? 2 : 1, 4)), c: z ? nz(r, -3, 3) : nz(r, -6, 6), z: z }); }) } }
    ]
  });

  /* ── C03.subst 공통부분을 한 덩어리로 (치환) ──────────────── */
  var SB_KEY = '식 안에 똑같은 모양이 여러 번 나오면 그것을 한 덩어리로 봐요. 그 덩어리에 $X$라는 이름표를 붙이면 복잡한 식이 중학교에서 배운 $X^{2} + bX + c$ 꼴의 이차식이 돼요. 여러 물건을 상자 하나에 담아 놓고 상자째로 옮기는 것과 같아요. 다 옮긴 다음에는 상자를 열어 원래 물건을 꺼내야 해요. 이렇게 바꿔 놓는 것을 치환이라고 해요.';
  var withX = function (X, p, c) { return X + '^{2}' + (p === 0 ? '' : ' ' + (p < 0 ? '- ' : '+ ') + (abs(p) === 1 ? '' : abs(p)) + X) + ' ' + sg(c); };
  var subBuild = function (q) {
    var a = q.a, m = q.m, n = q.n, p = m + n, c = m * n, lin = q.t === 'lin', prod = q.t === 'prod', Xt = lin ? 'x ' + sg(a) : ptex(D([1, a, 0])), k = prod ? c - q.b * q.c : 0, raw, ans, back, red, cands, steps, XF = facs(['(X ' + sg(m) + ')', '(X ' + sg(n) + ')']);
    var two = function (u, v) { return lin ? lfs([a + u, a + v]) : facs(parts(quadF(a, u).concat(quadF(a, v)))); };
    var plain = function (u, v) { return lin ? '(x ' + sg(a) + ' ' + sg(u) + ')(x ' + sg(a) + ' ' + sg(v) + ')' : facs([Qd(a, u), Qd(a, v)]); };
    raw = prod ? Qd(a, q.b) + Qd(a, q.c) + ' ' + sg(k) : withX('(' + Xt + ')', p, c);
    ans = two(m, n); back = plain(m, n); red = !lin && ans !== back;
    var NR = '$X$를 원래 식으로 되돌리지 않았어요. $X$는 잠깐 붙인 이름표예요. 인수분해한 다음에는 $X$ 자리에 원래 식을 다시 넣어야 해요.';
    var SG = '괄호 안의 수의 부호가 반대예요. 곱해서 상수항이 되고 더해서 가운데 항의 계수가 되는 두 수를 찾아요. 합의 부호까지 맞는지 확인해요.';
    if (lin) cands = mixc([[lfs([m, n]), 'not-returned', NR]], [
      [lfs([a - m, a - n]), 'sign', SG],
      [lfs([a + m, n]), 'half-returned', '한쪽 괄호에서만 $X$를 되돌렸어요. $X$가 들어 있던 괄호 두 개 모두에 원래 식을 넣어요.'],
      [lfs([m - a, n - a]), 'a-sign', '$X$를 되돌릴 때 부호를 바꿔 넣었어요. $X$ 자리에는 원래 식을 부호 그대로 넣고, 그다음에 수끼리 계산해요.'],
      [lfs([a + p, a + c]), 'sum-product', '합과 곱을 그대로 괄호에 넣었어요. 괄호 안에는 「더해서 가운데 항의 계수, 곱해서 상수항」이 되는 두 수가 들어가요.']
    ], q.perm);
    else cands = mixc((red ? [[back, 'not-finished', UNDONE, true]] : []).concat([[lfs([m, n]), 'not-returned', NR]]), [
      [two(-m, -n), 'sign', SG],
      [facs([Qd(0, m), Qd(0, n)]), 'a-dropped', '$X$를 되돌릴 때 $x$가 든 항 하나를 빠뜨렸어요. $X$ 자리에는 원래 식을 통째로 넣어요.'],
      !prod && p !== 0 ? [plain(p, c), 'sum-product', '합과 곱을 그대로 괄호에 넣었어요. 괄호 안에는 「더해서 가운데 항의 계수, 곱해서 상수항」이 되는 두 수가 들어가요.'] : null,
      prod ? [facs(parts(quadF(a, q.b).concat(quadF(a, q.c)))), 'k-ignored', '뒤에 붙은 수를 빼놓고 앞의 곱만 인수분해했어요. 곱해진 두 괄호를 전개한 다음, 뒤의 수까지 합쳐서 정리하고 인수분해해요.'] : null,
      red ? [facs(parts(quadF(a, m).concat(quadF(a, n))).map(function (t) { return t.indexOf('^') < 0 ? lf(-constOf(t)) : t; })), 'split-sign', '마지막에 이차식을 인수분해할 때 부호가 틀렸어요. 곱해서 상수항, 더해서 일차항의 계수가 되는 두 수를 다시 찾아요.'] : null
    ], q.perm);
    steps = [prod ? { say: '두 괄호에 똑같이 들어 있는 $' + Xt + '$를 $X$로 놓아요. 곱을 전개하고 뒤의 수까지 합쳐서 정리해요.', tex: '(X ' + sg(q.b) + ')(X ' + sg(q.c) + ') ' + sg(k) + ' = ' + withX('X', p, c) }
      : { say: '두 번 나오는 $' + Xt + '$' + jx(Xt, '을/를') + ' 한 덩어리로 보고 $X$로 놓아요.', tex: withX('X', p, c) },
      { say: '곱해서 $' + c + '$, 더해서 $' + p + '$' + pj(p, '이/가') + ' 되는 두 수를 찾아 $X$에 대한 이차식을 인수분해해요.', tex: XF },
      { say: '$X$ 자리에 원래 식 $' + Xt + '$' + jx(Xt, '을/를') + ' 되돌려 넣어요.', tex: back }];
    if (back !== ans) steps.push({ say: lin ? '괄호 안의 수끼리 계산해요.' : '괄호 안의 이차식이 더 인수분해되는지 살펴요. 인수분해되는 것은 끝까지 해요.', tex: ans });
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps,
      ok: m !== 0 && n !== 0 && (lin ? p !== 0 && a + m !== 0 && a + n !== 0 : true) && (prod ? k !== 0 && abs(k) <= 40 && q.b !== 0 && q.c !== 0 && abs(q.c) <= 9 && q.b <= q.c : p !== 0),
      hints: [SB_KEY,
        prod ? '① 두 괄호에 똑같이 들어 있는 $' + Xt + '$를 찾아 $X$로 놓아요. ② $X$로 바꾼 두 괄호의 곱을 전개하고, 뒤에 붙은 수 $' + k + '$까지 합쳐서 $X$에 대한 이차식으로 정리해요. ③ 그 이차식을 인수분해한 다음 $X$ 자리에 원래 식을 되돌려 넣어요.'
          : '① 같은 모양으로 두 번 나오는 $' + Xt + '$' + jx(Xt, '을/를') + ' 찾아 $X$로 놓아요. ② 식이 $X$에 대한 이차식이 돼요. 곱해서 $' + c + '$, 더해서 $' + p + '$' + pj(p, '이/가') + ' 되는 두 수를 찾아 인수분해해요. ③ $X$ 자리에 원래 식을 되돌려 넣어요.',
        (lin ? '되돌려 넣은 다음에는 괄호 안에 수가 두 개씩 있어요. 수끼리 계산해서 괄호 안을 간단히 해요. 음수를 더할 때 부호를 조심해요. '
          : '되돌려 넣은 다음이 끝이 아닐 수 있어요. 괄호 안의 이차식마다 「곱해서 상수항, 더해서 일차항의 계수」가 되는 두 정수가 있는지 찾아봐요. 있으면 한 번 더 인수분해하고, 없으면 그대로 둬요. ') + CHECK] });
  };
  choiceQ({
    id: 'C03.subst', title: '공통부분을 한 덩어리로 (치환)', build: subBuild, ids: ['not-returned', 'sign', 'half-returned', 'a-sign', 'sum-product', 'not-finished', 'a-dropped', 'k-ignored', 'split-sign'],
    levels: [
      { name: '일차식이 공통부분', vars: { q: sampler(function (r) { return wo(r, { t: 'lin', a: nz(r, -5, 5), m: nz(r, -6, 6), n: nz(r, -6, 6) }); }) } },
      { name: '이차식이 공통부분', vars: { q: sampler(function (r) { return wo(r, { t: 'quad', a: nz(r, -4, 4), m: nz(r, -6, 6), n: nz(r, -6, 6) }); }) } },
      { name: '곱해진 괄호 속의 공통부분', vars: { q: sampler(function (r) { var m = nz(r, -6, 6), n = nz(r, -6, 6), b = nz(r, -6, 6); return wo(r, { t: 'prod', a: nz(r, -4, 4), m: m, n: n, b: b, c: m + n - b }); }) } }
    ]
  });

  /* ── C03.biquad 사차식 x⁴ + ax² + b ───────────────────── */
  var BQ_KEY = '$x^{4} + ax^{2} + b$처럼 $x^{4}$, $x^{2}$, 상수항만 있는 사차식은 $x^{2}$을 한 덩어리 $X$로 봐요. $x^{4}$은 $x^{2}$을 두 번 곱한 것이니 $X^{2}$이 돼요. 그러면 식이 $X^{2} + aX + b$ 꼴의 이차식으로 바뀌어요. 큰 상자 안에 작은 상자가 들어 있는 것처럼, 이차식 안에 이차식이 들어 있는 식이에요.';
  var BQ_KEY2 = '$x^{2}$을 $X$로 놓아도 인수분해되는 두 정수가 없을 때가 있어요. 그럴 때는 식을 (제곱) − (제곱) 꼴로 고쳐요. 양 끝의 $x^{4}$과 상수항으로 완전제곱식을 먼저 만들고, 가운데 항에서 남거나 모자라는 만큼을 따로 떼어 내요. 떼어 낸 것이 $x^{2}$, $4x^{2}$, $9x^{2}$처럼 제곱 꼴이면 합과 차의 곱으로 인수분해할 수 있어요.';
  var diffParts = function (m, k) {
    var P = [1, 0, 2 * m - k * k, 0, m * m];
    return { P: P, raw: ptex(D(P)), ans: facs([Qd(k, m), Qd(-k, m)]),
      s1: ptex(D(P)) + ' = (' + ptex(D([1, 0, 2 * m, 0, m * m])) + ') - ' + (k === 1 ? '' : k * k) + 'x^{2}',
      s2: '(x^{2} ' + sg(m) + ')^{2} - ' + (k === 1 ? 'x^{2}' : '(' + k + 'x)^{2}'),
      ok: m !== 0 && irreducible(k, m) && abs(2 * m - k * k) <= 30 };
  };
  var bqBuild = function (q) {
    var m = q.m, n = q.n, k = q.k, d, p, c, raw, plain, ans, red, cands, steps, i, r, other, extra;
    if (q.t === 'diff') {
      d = diffParts(m, k);
      cands = mixc([[Qd(k, m) + '^{2}', 'both-plus', '두 괄호를 똑같이 썼어요. (제곱) − (제곱)은 합과 차의 곱이에요. 한 괄호는 더하고 다른 괄호는 빼야 해요.']], [
        [Qd(0, m) + '^{2}', 'as-square', '완전제곱식으로만 썼어요. 전개하면 가운데 항이 처음 식과 달라요. 가운데 항에서 남거나 모자라는 만큼을 따로 떼어 내야 해요.'],
        m + k !== 0 && m - k !== 0 ? [facs([Qd(0, m + k), Qd(0, m - k)]), 'no-x', '떼어 낸 항의 $x$를 빠뜨렸어요. 떼어 낸 것은 수가 아니라 $x$가 든 항의 제곱이에요. 괄호 안에 $x$가 든 일차항이 들어가야 해요.'] : null,
        [facs([Qd(k, -m), Qd(-k, -m)]), 'sign-m', '괄호 안의 상수항의 부호가 틀렸어요. 두 괄호의 상수항을 곱하면 처음 식의 상수항이 되어야 하고, 완전제곱식의 가운데 항의 부호와도 맞아야 해요.'],
        k >= 2 ? [facs([Qd(k * k, m), Qd(-k * k, m)]), 'k-squared', '떼어 낸 항의 계수를 그대로 썼어요. $4x^{2}$은 $(2x)^{2}$이에요. 괄호 안에는 제곱하기 전의 수가 들어가요.'] : null
      ], q.perm);
      return finish({ raw: d.raw, ans: d.ans, cands: cands, ok: d.ok,
        steps: [{ say: '$x^{2}$을 $X$로 놓아도 맞는 두 정수가 없어요. 양 끝의 항으로 완전제곱식을 먼저 만들고, 가운데 항에서 남거나 모자라는 만큼을 따로 떼어 내요.', tex: d.s1 },
          { say: '앞의 괄호는 완전제곱식이에요. 그러면 (제곱) − (제곱) 꼴이 돼요.', tex: d.s2 },
          { say: '합과 차의 곱으로 인수분해하고, 괄호 안을 차수가 높은 항부터 정리해요.', tex: d.ans }],
        hints: [BQ_KEY2,
          '① 첫 항 $x^{4}$과 끝 항 $' + m * m + '$' + pj(m * m, '을/를') + ' 양 끝으로 하는 완전제곱식 $(x^{2} ' + sg(m) + ')^{2}$' + '을 떠올려요. ② 이것을 전개했을 때의 가운데 항과 처음 식의 가운데 항을 견줘요. 그 차이만큼을 뒤에 따로 빼 줘요. ③ 뺀 것이 $x$가 든 항의 제곱이 되면, (제곱) − (제곱)을 합과 차의 곱으로 바꿔요.',
          '완전제곱식의 상수항의 부호는 두 가지를 다 해 볼 수 있어요. 뒤에 빼는 것이 제곱 꼴이 되는 쪽을 골라요. 마지막 두 괄호는 가운데 항의 부호만 서로 달라요. ' + CHECK] });
    }
    p = m + n; c = m * n; raw = ptex(D([1, 0, p, 0, c])); plain = facs([Qd(0, m), Qd(0, n)]); ans = facs(parts(sqF(m).concat(sqF(n)))); red = ans !== plain;
    extra = [];
    for (i = 0; i < 2; i++) {
      r = [m, n][i]; other = [m, n][1 - i];
      if (r > 0 && isq(r) > 0) extra.push([facs(parts([lf(isq(r)), lf(-isq(r))].concat(sqF(other)))), 'sum-split', '제곱의 합을 인수분해했어요. $x^{2} + 4$처럼 더하기로 이어진 식은 정수 범위에서 더 인수분해되지 않아요. 합과 차의 곱이 되는 것은 제곱의 차뿐이에요.']);
      if (r < 0 && isq(-r) >= 2) extra.push([facs(parts([lf(r), lf(-r)].concat(sqF(other)))), 'not-rooted', '제곱의 차를 인수분해할 때 수를 그대로 썼어요. $x^{2} - 4$는 $(x + 2)(x - 2)$예요. 괄호 안에는 제곱해서 그 수가 되는 수가 들어가요.']);
    }
    cands = mixc((red ? [[plain, 'not-finished', UNDONE, true]] : []).concat([[lfs([m, n]), 'as-quadratic', '$X$를 $x^{2}$으로 되돌리지 않았어요. 처음 식은 사차식이에요. 일차식 두 개의 곱은 이차식이라서 처음 식이 될 수 없어요.']]), [
      [facs([Qd(0, -m), Qd(0, -n)]), 'sign', '괄호 안의 수의 부호가 반대예요. 곱해서 상수항이 되고 더해서 $x^{2}$의 계수가 되는 두 수를 찾아요. 합의 부호까지 맞는지 확인해요.'],
      [facs([Qd(0, m), Qd(0, -n)]), 'one-sign', '한쪽 괄호의 부호가 틀렸어요. 두 수를 곱하면 상수항이, 더하면 $x^{2}$의 계수가 나오는지 둘 다 확인해요.'],
      extra[0], extra[1],
      p !== 0 ? [facs([Qd(0, p), Qd(0, c)]), 'sum-product', '합과 곱을 그대로 괄호에 넣었어요. 괄호 안에는 「더해서 $x^{2}$의 계수, 곱해서 상수항」이 되는 두 수가 들어가요.'] : null
    ], q.perm);
    steps = [{ say: '$x^{2}$을 한 덩어리로 보고 $X$로 놓아요. $x^{4}$은 $X^{2}$이 돼요.', tex: withX('X', p, c) },
      { say: '곱해서 $' + c + '$, 더해서 $' + p + '$' + pj(p, '이/가') + ' 되는 두 수를 찾아 인수분해해요.', tex: facs(['(X ' + sg(m) + ')', '(X ' + sg(n) + ')']) },
      { say: '$X$ 자리에 $x^{2}$을 되돌려 넣어요.', tex: plain }];
    if (red) steps.push({ say: '괄호 안이 (제곱) − (제곱) 꼴이면 합과 차의 곱으로 한 번 더 인수분해해요. 더하기로 이어진 괄호는 그대로 둬요.', tex: ans });
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps, ok: m !== 0 && n !== 0 && m <= n && (q.t === 'plain') === !red,
      hints: [BQ_KEY,
        '① $x^{2}$을 $X$로 놓으면 $x^{4}$은 $X^{2}$이 돼요. ② $X$에 대한 이차식에서 곱해서 $' + c + '$, 더해서 $' + p + '$' + pj(p, '이/가') + ' 되는 두 수를 찾아 인수분해해요. ③ $X$ 자리에 $x^{2}$을 되돌려 넣어요. 그러면 $x^{2}$이 든 괄호 두 개의 곱이 돼요.',
        '되돌려 넣은 다음에 괄호를 하나씩 살펴봐요. $x^{2} - 1$, $x^{2} - 4$, $x^{2} - 9$처럼 (제곱) − (제곱) 꼴이면 합과 차의 곱으로 한 번 더 인수분해해요. $x^{2} + 4$처럼 더하기로 이어진 괄호는 더 인수분해되지 않아요. ' + CHECK] });
  };
  var BQ_POOL = [-7, -6, -5, -3, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  choiceQ({
    id: 'C03.biquad', title: '사차식 x⁴ + ax² + b', build: bqBuild, ids: ['as-quadratic', 'sign', 'one-sign', 'sum-product', 'sum-split', 'not-finished', 'not-rooted', 'both-plus', 'as-square', 'no-x', 'sign-m', 'k-squared'],
    levels: [
      { name: 'x²을 X로 놓기', minDistinct: 80, vars: { q: sampler(function (r) { var m = r.pick(BQ_POOL), n = r.pick(BQ_POOL); return wo(r, { t: 'plain', m: Math.min(m, n), n: Math.max(m, n) }); }) } },
      { name: '끝까지 인수분해하기', minDistinct: 50, vars: { q: sampler(function (r) { var m = r.pick([-1, -4, -9, -16]), n = nz(r, -9, 9); return wo(r, { t: 'more', m: Math.min(m, n), n: Math.max(m, n) }); }) } },
      { name: '(제곱) − (제곱) 꼴로 고치기', minDistinct: 22, vars: { q: sampler(function (r) { return wo(r, { t: 'diff', m: nz(r, -6, 6), k: r.int(1, 3) }); }) } }
    ]
  });

  /* ── C03.theorem 인수정리와 조립제법으로 인수분해 ─────────── */
  var TH_KEY = '공식에 맞지 않는 삼차식 · 사차식은 인수정리로 실마리를 찾아요. 식을 $P(x)$라고 할 때 $P(a) = 0$이면 $x - a$가 인수예요. 자물쇠에 열쇠를 하나씩 꽂아 보듯이 수를 넣어 보고, 0이 되는 수를 찾으면 인수 하나를 얻어요. 넣어 볼 수는 상수항의 약수면 충분해요. 인수 하나를 찾은 다음에는 조립제법으로 나눠서 나머지 부분(몫)을 구해요.';
  var splitOf = function (b, c) { var u, out = null; for (u = 1; u <= abs(c) && !out; u++) if (c % u === 0) [[u, c / u], [-u, -c / u]].forEach(function (pr) { if (!out && pr[0] + pr[1] !== b) out = pr; }); return out; };
  var thBuild = function (q) {
    var three = q.t === 'three', R = (three || q.t === 'four' ? q.r : [q.r]).slice().sort(sortC), b = q.b, c = q.c, quad = three ? '' : Qd(b, c), n = R.length;
    var P = R.reduce(function (p, x) { return dmul(p, [1, -x]); }, three ? [1] : [1, b, c]), deg = P.length - 1, r0 = R[0], Q1 = synth(P, r0).b.slice(0, deg), raw = ptex(D(P)), sp = three ? null : splitOf(b, c), top = D(P.slice(0, deg)), cands, steps, Q2;
    var F = function (roots, qt) { return facs(roots.map(function (x) { return -x; }).sort(sortC).map(lf).concat(qt ? [qt] : [])); };
    var ans = F(R, quad), flip = function (x) { return -x; };
    cands = mixc((n >= 2 ? [[lf(-r0) + bin(D(Q1)), 'not-finished', UNDONE, true]] : []).concat([[F(R.map(flip), quad), 'sign', '괄호 안의 부호가 모두 반대예요. $P(' + r0 + ') = 0$이면 인수는 $x ' + sg(-r0) + '$' + pj(r0, '이에요/예요') + '. 넣어서 0이 되는 수와 괄호 안의 수는 부호가 서로 반대예요.']]), [
      n >= 2 ? [F([-r0].concat(R.slice(1)), quad), 'one-sign', '처음 찾은 인수의 부호가 반대예요. $P(' + r0 + ') = 0$이면 인수는 $x ' + sg(-r0) + '$' + pj(r0, '이에요/예요') + '. 넣은 수의 부호를 바꿔서 괄호 안에 써요.'] : null,
      top.length >= 2 ? [lf(-r0) + bin(top), 'top-row', '몫의 자리에 처음 식의 계수를 그대로 썼어요. 몫의 계수는 조립제법의 맨 아랫줄에 있어요. 맨 윗줄은 나뉘는 식의 계수예요.'] : null,
      three ? [F(R.slice(0, 2), ''), 'two-only', '인수 하나를 빠뜨렸어요. 삼차식을 인수분해하면 인수의 차수를 모두 더해 3이 되어야 해요. 일차식 두 개만 곱하면 이차식이에요.'] : null,
      three ? [F([r0].concat(R.slice(1).map(flip)), ''), 'quotient-sign', '몫을 인수분해할 때 부호가 틀렸어요. 몫인 이차식에서 곱해서 상수항, 더해서 일차항의 계수가 되는 두 수를 다시 찾아요.'] : null,
      !three && b !== 0 ? [F(R, Qd(-b, c)), 'quotient-sign', '몫의 일차항의 부호가 반대예요. 조립제법에서 세로로 더할 때 부호를 다시 확인해요. 음수를 더하는 칸에서 자주 틀려요.'] : null,
      sp ? [facs(parts(R.map(function (x) { return lf(-x); }).concat([lf(sp[0]), lf(sp[1])]))), 'wrong-split', '몫인 이차식을 억지로 인수분해했어요. 곱해서 상수항이 되는 두 수는 찾았지만 더해서 일차항의 계수가 되지 않아요. 이 이차식은 더 인수분해되지 않으니 그대로 둬요.'] : null,
      !three && b !== 0 && b !== c ? [F(R, Qd(c, b)), 'coef-swapped', '몫의 계수의 자리를 바꿔 썼어요. 맨 아랫줄의 수를 왼쪽부터 차례로 $x^{2}$의 계수, $x$의 계수, 상수항으로 읽어요.'] : null
    ], q.perm);
    steps = [{ say: '이 식을 $P(x)$라고 해요. 상수항 $' + P[deg] + '$의 약수를 차례로 넣어 0이 되는 수를 찾아요. $' + r0 + '$' + pj(r0, '을/를') + ' 넣으면 0이 돼요.', tex: 'P(' + r0 + ') = ' + numLine(P, par(r0)) + ' = 0' },
      { say: '인수정리에 따라 $x ' + sg(-r0) + '$' + pj(r0, '이/가') + ' 인수예요. 조립제법으로 나눠 몫을 구해요. 맨 아랫줄의 마지막 수(나머지)는 0이에요.', tex: tableTex(P, r0) }];
    if (q.t === 'four') {
      Q2 = ptex(D(Q1));
      steps.push({ say: '몫 $' + Q2 + '$' + '에도' + ' 같은 방법을 써요. $' + R[1] + '$' + pj(R[1], '을/를') + ' 넣으면 0이 되니 한 번 더 나눠요.', tex: tableTex(Q1, R[1]) });
      steps.push({ say: '남은 몫 $' + ptex(D([1, b, c])) + '$' + jx(ptex(D([1, b, c])), '은/는') + ' 더 인수분해되지 않아요. 찾은 인수를 모두 곱으로 써요.', tex: ans });
    } else if (three) steps.push({ say: '몫 $' + ptex(D(Q1)) + '$' + jx(ptex(D(Q1)), '을/를') + ' 곱과 합으로 인수분해해서 마무리해요.', tex: ans });
    else steps.push({ say: '몫 $' + ptex(D(Q1)) + '$' + jx(ptex(D(Q1)), '은/는') + ' 곱해서 상수항, 더해서 일차항의 계수가 되는 두 정수가 없어요. 더 인수분해되지 않으니 그대로 곱으로 써요.', tex: ans });
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps, ok: abs(P[deg]) <= 36 && (three || (c !== 0 && irreducible(b, c))) && P.every(function (x) { return abs(x) <= 60; }),
      hints: [TH_KEY,
        '① 상수항 $' + P[deg] + '$의 약수 가운데에서 식을 0으로 만드는 수를 찾아요. 작은 수부터 양수와 음수를 번갈아 넣어 봐요. ② 찾은 수가 $a$이면 $x - a$가 인수예요. 조립제법으로 나눠 몫을 구해요. ③ 몫을 살펴요. ' + (q.t === 'four' ? '몫이 삼차식이면 같은 방법을 한 번 더 써요.' : '몫이 이차식이면 곱과 합으로 한 번 더 인수분해해 봐요.') + ' 더 안 되면 그대로 둬요.',
        '부호를 가장 많이 틀려요. 넣어서 0이 된 수가 양수이면 괄호 안은 빼기, 음수이면 괄호 안은 더하기예요. 조립제법에서 빠진 차수가 있으면 그 자리에 0을 써야 해요. ' + CHECK] });
  };
  choiceQ({
    id: 'C03.theorem', title: '인수정리로 인수분해', build: thBuild, ids: ['sign', 'one-sign', 'top-row', 'two-only', 'quotient-sign', 'wrong-split', 'coef-swapped', 'not-finished'],
    levels: [
      { name: '일차식 셋의 곱이 되는 삼차식', minDistinct: 60, vars: { q: sampler(function (r) { return wo(r, { t: 'three', r: [nz(r, -4, 4), nz(r, -4, 4), nz(r, -4, 4)] }); }) } },
      { name: '이차식이 남는 삼차식', minDistinct: 150, vars: { q: sampler(function (r) { return wo(r, { t: 'one', r: nz(r, -3, 3), b: r.int(-3, 3), c: nz(r, -5, 6) }); }) } },
      { name: '사차식 (두 번 나누기)', minDistinct: 150, vars: { q: sampler(function (r) { return wo(r, { t: 'four', r: [nz(r, -3, 3), nz(r, -3, 3)], b: r.int(-2, 2), c: r.int(1, 4) }); }) } }
    ]
  });

  /* ── C03.blank 인수분해한 식의 빈 계수 ───────────────────── */
  var BL_TEXT = '다음과 같이 인수분해될 때, ';
  var blBuild = function (q) {
    var r = q.r, a = q.a, b = q.b, ask = q.ask, P, tex, sol, wrong, p, v, plus, s, d, lhs, B;
    if (q.t === 'cubic') {
      P = dmul([1, -r], [1, a, b]); tex = ptex(D(P)) + ' = ' + lf(-r) + '(x^{2} + ax + b)'; sol = { a: a, b: b };
      wrong = ask === 'a' ? { 'top-row': P[1], subtracted: P[1] - r, other: b } : { 'top-row': P[2], subtracted: P[2] - r * a, other: a, 'const-kept': P[3] };
      return { tex: tex, text: BL_TEXT + '상수 $' + ask + '$의 값을 구하세요.', ans: sol[ask], wrong: wrong, check: a !== 0 && b !== 0 && a !== b,
        steps: [{ say: '오른쪽에 $x ' + sg(-r) + '$' + pj(r, '이/가') + ' 있으니, 왼쪽 식을 $x ' + sg(-r) + '$' + pj(r, '으로/로') + ' 나눈 몫이 둘째 괄호예요. 조립제법으로 나눠요.', tex: tableTex(P, r) },
          { say: '맨 아랫줄에서 나머지 0을 뺀 앞의 세 수가 몫의 계수예요.', tex: 'x^{2} + ax + b = ' + ptex(D([1, a, b])) },
          { say: '같은 자리의 계수끼리 견줘요.', tex: ask + ' = ' + sol[ask] }],
        hints: ['인수분해는 곱셈으로 쪼개는 것이에요. $12 = 3 \\times \\square$에서 빈칸을 찾으려면 12를 3으로 나누면 되지요. 다항식도 똑같아요. 인수 하나를 알면, 처음 식을 그 인수로 나눈 몫이 나머지 인수예요. 일차식으로 나눌 때는 조립제법이 가장 빨라요.',
          '① 오른쪽의 첫째 괄호 $x ' + sg(-r) + '$' + pj(r, '을/를') + ' 0으로 만드는 수를 찾아요. 괄호 안의 수와 부호가 반대예요. ② 그 수를 왼쪽에 쓰고, 왼쪽 식의 계수를 차례로 늘어놓아 조립제법을 해요. 대각선은 곱하기, 세로는 더하기예요. ③ 맨 아랫줄의 앞 세 수가 차례로 $x^{2}$의 계수, $x$의 계수, 상수항이에요.',
          '맨 아랫줄의 마지막 수가 0이 되는지 꼭 확인해요. 0이 아니면 중간에 계산을 틀린 것이에요. 구한 값을 넣은 두 괄호를 다시 곱해서 왼쪽 식이 나오는지 검산해도 좋아요. 상수항끼리만 곱해 봐도 금방 확인돼요.'] };
    }
    if (q.t === 'cube') {
      p = q.p; v = q.q; plus = q.plus; s = plus ? 1 : -1; sol = { a: p * p, b: -s * p * v, c: v * v };
      lhs = ptex(D([p * p * p, 0, 0, s * v * v * v])); tex = lhs + ' = ' + bin(D([p, s * v])) + '(ax^{2} + bx + c)';
      wrong = ask === 'a' ? { 'not-squared': p, cubed: p * p * p, doubled: 2 * p, other: sol.b } : ask === 'b' ? { double: 2 * sol.b, 'not-multiplied': -s * v, other: sol.c, 'coef-squared': -s * p * p * v } : { 'not-squared': v, cubed: v * v * v, doubled: 2 * v, other: sol.b };
      return { tex: tex, text: BL_TEXT + '상수 $' + ask + '$의 값을 구하세요.', ans: sol[ask], wrong: wrong, check: gcd(p, v) === 1,
        steps: [{ say: '왼쪽의 두 항을 세제곱 꼴로 써요.', tex: lhs + ' = ' + powTex(T(p, { x: 1 }), 3) + (plus ? ' + ' : ' - ') + powNum(v, 3) },
          { say: plus ? '세제곱의 합 공식에 넣어요. 둘째 괄호는 (앞의 제곱) − (두 수의 곱) + (뒤의 제곱)이에요.' : '세제곱의 차 공식에 넣어요. 둘째 괄호는 (앞의 제곱) + (두 수의 곱) + (뒤의 제곱)이에요.', tex: bin(D([p, s * v])) + bin(D([p * p, -s * p * v, v * v])) },
          { say: '둘째 괄호에서 같은 자리의 계수끼리 견줘요.', tex: ask + ' = ' + sol[ask] }],
        hints: ['세제곱인 두 항을 더하거나 뺀 식은 공식으로 인수분해해요. $A^{3} + B^{3} = (A + B)(A^{2} - AB + B^{2})$, $A^{3} - B^{3} = (A - B)(A^{2} + AB + B^{2})$. 첫째 괄호는 세제곱하기 전의 두 수이고, 둘째 괄호는 그 두 수의 제곱과 곱으로 만들어요. 문제의 $a$, $b$, $c$와 헷갈리지 않게 공식은 큰 글자로 썼어요.',
          '① 오른쪽의 첫째 괄호 $' + ptex(D([p, s * v])) + '$' + pj(v, '을/를') + ' 봐요. 앞의 항이 공식의 $A$, 뒤의 수가 $B$예요. ② 둘째 괄호의 첫 항은 $A$의 제곱, 끝 항은 $B$의 제곱이에요. 가운데 항은 $A$와 $B$를 한 번 곱한 것이에요. ③ 가운데 항의 부호는 첫째 괄호의 부호와 반대예요.',
          '제곱할 때는 계수도 함께 제곱해요. $A$가 $x$ 앞에 수가 붙은 항이면 그 수도 제곱해요. 가운데 항은 2배를 하지 않아요. 완전제곱식의 가운데 항과 헷갈리지 않도록 조심해요. 구한 값을 넣은 두 괄호를 곱해서 왼쪽 식이 나오는지 확인해요.'] };
    }
    d = diffParts(q.m, q.k); B = q.m;
    tex = d.raw + ' = (x^{2} + ax ' + sg(B) + ')(x^{2} - ax ' + sg(B) + ')';
    return { tex: tex, text: BL_TEXT + '양수 $a$의 값을 구하세요.', ans: q.k, check: d.ok,
      wrong: { 'not-rooted': q.k * q.k, 'coef-kept': 2 * B - q.k * q.k, 'two-m': 2 * B, 'const-root': B },
      steps: [{ say: '양 끝의 항으로 완전제곱식을 먼저 만들고, 가운데 항에서 남거나 모자라는 만큼을 따로 떼어 내요.', tex: d.s1 },
        { say: '(제곱) − (제곱) 꼴로 써요.', tex: d.s2 },
        { say: '합과 차의 곱으로 인수분해하고 차수가 높은 항부터 정리해요.', tex: d.ans },
        { say: '오른쪽 식과 견주면 $x$의 계수가 구하는 값이에요.', tex: 'a = ' + q.k }],
      hints: [BQ_KEY2,
        '① 오른쪽 두 괄호의 상수항 $' + B + '$' + pj(B, '을/를') + ' 써서 완전제곱식 $(x^{2} ' + sg(B) + ')^{2}$' + '을 전개해요. ② 전개한 식과 왼쪽 식을 견줘요. $x^{2}$이 든 항만 달라요. 그 차이만큼을 뒤에 따로 빼 줘요. ③ 뺀 항이 무엇의 제곱인지 찾아요. 그것이 두 괄호의 가운데 항이 돼요.',
        '뒤에 빼는 항은 $x^{2}$에 수가 곱해진 꼴이에요. 그 수를 그대로 답하면 안 돼요. 제곱해서 그 수가 되는 수가 $x$의 계수예요. 두 괄호는 가운데 항의 부호만 다르니, 양수 쪽을 답해요. 두 괄호를 곱해서 왼쪽 식이 나오는지 확인해요.'] };
  };
  numQ({
    id: 'C03.blank', title: '인수분해한 식의 빈 계수', build: blBuild,
    mistakes: [['top-row', '왼쪽 식의 계수를 그대로 답했어요. 몫의 계수는 조립제법의 맨 아랫줄에 있어요. 윗줄의 수에 가운데 줄의 수를 더해야 해요.'],
      ['subtracted', '조립제법에서 세로로 뺐어요. 조립제법은 세로로 놓인 두 수를 더해요. 빼는 것은 세로 나눗셈이에요.'],
      ['other', '다른 문자의 값을 답했어요. 문제에서 구하라고 한 문자가 무엇인지 다시 확인해요.'],
      ['const-kept', '왼쪽 식의 상수항을 그대로 답했어요. 왼쪽의 상수항은 두 괄호의 상수항을 곱한 것이에요. 첫째 괄호의 수로 나눠야 해요.'],
      ['not-squared', '제곱을 하지 않았어요. 둘째 괄호의 양 끝 항은 첫째 괄호의 두 항을 각각 제곱한 것이에요.'],
      ['cubed', '세제곱한 수를 그대로 답했어요. 둘째 괄호의 양 끝 항은 세제곱이 아니라 제곱이에요.'],
      ['doubled', '제곱 대신 2를 곱했어요. 제곱은 같은 수를 두 번 곱하는 것이에요. 3의 제곱은 6이 아니라 9예요.'],
      ['double', '가운데 항을 2배로 답했어요. 완전제곱식과 헷갈렸어요. 이 공식의 가운데 항은 두 수를 한 번만 곱해요.'],
      ['not-multiplied', '가운데 항에서 앞의 항의 계수를 곱하지 않았어요. 가운데 항은 첫째 괄호의 두 항을 곱한 것이에요.'],
      ['coef-squared', '가운데 항에서 앞의 항의 계수를 제곱했어요. 가운데 항은 두 항을 한 번씩만 곱한 것이에요.'],
      ['not-rooted', '따로 떼어 낸 항의 계수를 그대로 답했어요. 제곱해서 그 수가 되는 수가 $x$의 계수예요. 4이면 2, 9이면 3이에요.'],
      ['coef-kept', '왼쪽 식의 $x^{2}$의 계수를 그대로 답했어요. 완전제곱식을 만들고 남는 만큼을 떼어 내서 구해야 해요.'],
      ['two-m', '완전제곱식의 가운데 항의 계수를 답했어요. 구하는 것은 그 뒤에 따로 떼어 낸 항에서 나와요.'],
      ['const-root', '괄호 안의 상수항을 답했어요. 구하는 것은 $x$가 든 가운데 항의 계수예요.']],
    levels: [
      { name: '삼차식의 몫', vars: { q: sampler(function (r) { return { t: 'cubic', r: nz(r, -3, 3), a: nz(r, -5, 5), b: nz(r, -6, 6), ask: r.pick(['a', 'b']) }; }) } },
      { name: '세제곱의 합과 차', minDistinct: 50, vars: { q: sampler(function (r) { var p = r.int(1, 3); return { t: 'cube', p: p, q: r.int(1, 5), plus: r.int(0, 1) === 1, ask: r.pick(p === 1 ? ['b', 'c'] : ['a', 'b', 'c']) }; }) } },
      { name: '(제곱) − (제곱) 꼴 사차식', minDistinct: 22, vars: { q: sampler(function (r) { return { t: 'quartic', m: nz(r, -6, 6), k: r.int(1, 3) }; }) } }
    ]
  });

  /* ── C03.value 인수분해로 식의 값 구하기 ─────────────────── */
  var VL_KEY = '수를 바로 넣으면 계산이 길고 틀리기 쉬워요. 먼저 식을 인수분해해서 간단한 꼴로 바꾼 다음에 수를 넣어요. 물건을 하나씩 세지 않고 묶음으로 세는 것과 같아요. 인수분해하면 괄호 안이 10이나 20처럼 계산하기 쉬운 수가 되도록 문제가 만들어져 있어요.';
  var vlBuild = function (q) {
    var b = q.b, t = q.tt, x0, P, tex, a, plus, s, lit, x = q.x, y = q.y, z = q.z;
    if (q.t === 'cube') {
      x0 = t - b; P = [1, 3 * b, 3 * b * b, b * b * b]; tex = ptex(D(P));
      return { tex: tex, text: '$x = ' + x0 + '$일 때, 다음 식의 값을 구하세요.', ans: t * t * t, check: x0 !== 0,
        wrong: { squared: t * t, 'not-cubed': t, 'times-three': 3 * t, 'sign-b': ipow(x0 - b, 3), 'ends-only': ipow(x0, 3) + b * b * b },
        steps: [{ say: '항이 네 개이고 양 끝이 세제곱 꼴이에요. 먼저 세제곱 꼴로 인수분해해요.', tex: tex + ' = (x ' + sg(b) + ')^{3}' },
          { say: '$x$ 자리에 수를 넣어요. 괄호 안이 계산하기 쉬운 수가 돼요.', tex: '(' + x0 + ' ' + sg(b) + ')^{3} = ' + powNum(t, 3) },
          { say: t < 0 ? '세제곱을 계산해요. 음수를 세 번 곱하면 음수예요.' : '세제곱을 계산해요. 같은 수를 세 번 곱해요.', tex: powNum(t, 3) + ' = ' + t * t * t }],
        hints: [VL_KEY,
          '① 식의 양 끝을 봐요. 첫 항은 $x^{3}$이고 끝 항은 $' + P[3] + '$' + pj(P[3], '이에요/예요') + '. 끝 항이 무엇을 세 번 곱한 것인지 찾아요. ② 가운데 두 항까지 맞는지 확인하고 $(x + \\square)^{3}$ 또는 $(x - \\square)^{3}$ 꼴로 묶어요. ③ 묶은 식의 $x$ 자리에 $' + x0 + '$' + pj(x0, '을/를') + ' 넣어요.',
          '괄호 안을 먼저 계산하고 그다음에 세제곱해요. 10의 세제곱은 0이 세 개 붙고, 100의 세제곱은 0이 여섯 개 붙어요. 괄호 안이 음수이면 세 번 곱한 값도 음수예요. 부호를 마지막에 한 번 더 확인해요.'] };
    }
    if (q.t === 'frac') {
      a = q.a; b = q.b; plus = q.plus; s = plus ? '+' : '-';
      tex = '\\dfrac{' + a + '^{3} ' + s + ' ' + b + '^{3}}{' + a + '^{2} ' + (plus ? '-' : '+') + ' ' + a + ' \\times ' + b + ' + ' + b + '^{2}}';
      return { tex: tex, text: '다음 식의 값을 구하세요.', ans: plus ? a + b : a - b, check: a !== b && (plus || a > b),
        wrong: { 'other-sign': plus ? a - b : a + b, product: a * b, denominator: plus ? a * a - a * b + b * b : a * a + a * b + b * b },
        steps: [{ say: plus ? '분자를 세제곱의 합 공식으로 인수분해해요.' : '분자를 세제곱의 차 공식으로 인수분해해요.', tex: a + '^{3} ' + s + ' ' + b + '^{3} = (' + a + ' ' + s + ' ' + b + ')(' + a + '^{2} ' + (plus ? '-' : '+') + ' ' + a + ' \\times ' + b + ' + ' + b + '^{2})' },
          { say: '둘째 괄호가 분모와 똑같아요. 약분하면 첫째 괄호만 남아요.', tex: a + ' ' + s + ' ' + b + ' = ' + (plus ? a + b : a - b) }],
        hints: ['세제곱을 하나하나 계산하면 수가 아주 커져요. 그 대신 분자를 인수분해해요. $A^{3} + B^{3} = (A + B)(A^{2} - AB + B^{2})$, $A^{3} - B^{3} = (A - B)(A^{2} + AB + B^{2})$. 인수분해한 분자에 분모와 똑같은 식이 들어 있으면 약분할 수 있어요. 분수 $\\dfrac{6}{3}$에서 3을 약분하는 것과 같아요.',
          '① 분자의 두 수 $' + a + '$' + pj(a, '과/와') + ' $' + b + '$' + pj(b, '을/를') + ' 공식의 $A$, $B$ 자리에 놓아요. ② 분자는 두 수를 ' + (plus ? '더한' : '뺀') + ' 꼴이니 ' + (plus ? '합' : '차') + '의 공식으로 인수분해해요. ③ 둘째 괄호를 분모와 견줘요. 부호까지 똑같으면 통째로 약분해요.',
          '약분하고 나면 첫째 괄호만 남아요. 세제곱이나 제곱은 하나도 계산할 필요가 없어요. 분자의 부호와 첫째 괄호의 부호가 같다는 것을 기억해요. 분자가 더하기이면 더하고, 빼기이면 빼요.'] };
    }
    s = x + q.sy * y + q.sz * z;
    lit = '(x ' + (q.sy < 0 ? '-' : '+') + ' y ' + (q.sz < 0 ? '-' : '+') + ' z)^{2}';
    tex = 'x^{2} + y^{2} + z^{2} ' + (q.sy < 0 ? '-' : '+') + ' 2xy ' + (q.sy * q.sz < 0 ? '-' : '+') + ' 2yz ' + (q.sz < 0 ? '-' : '+') + ' 2zx';
    return { tex: tex, text: '$x = ' + x + '$, $y = ' + y + '$, $z = ' + z + '$일 때, 다음 식의 값을 구하세요.', ans: s * s, check: abs(s) >= 2 && abs(s) <= 30 && (abs(s) <= 12 || s % 5 === 0),
      wrong: { 'not-squared': s, 'all-plus': ipow(x + y + z, 2), 'squares-only': x * x + y * y + z * z, doubled: 2 * s },
      steps: [{ say: '제곱인 항 셋과 둘씩 곱한 항 셋이 있어요. 세 항의 제곱 꼴로 인수분해해요. 곱한 항의 부호로 괄호 안의 부호를 정해요.', tex: tex + ' = ' + lit },
        { say: '문자 자리에 수를 넣고 괄호 안을 먼저 계산해요.', tex: '(' + x + ' ' + (q.sy < 0 ? '-' : '+') + ' ' + y + ' ' + (q.sz < 0 ? '-' : '+') + ' ' + z + ')^{2} = ' + powNum(s, 2) },
        { say: '제곱을 계산해요.', tex: powNum(s, 2) + ' = ' + s * s }],
      hints: [VL_KEY,
        '① 이 식은 $a^{2} + b^{2} + c^{2} + 2ab + 2bc + 2ca = (a + b + c)^{2}$ 꼴이에요. 제곱인 항이 $x^{2}$, $y^{2}$, $z^{2}$이니 괄호 안에는 $x$, $y$, $z$가 들어가요. ② 둘씩 곱한 항의 부호를 봐요. 곱한 항이 −이면 그 두 문자의 부호가 서로 달라요. $x$를 +로 놓고 $y$와 $z$의 부호를 정해요. ③ 묶은 식에 수를 넣어요.',
        '수를 넣을 때는 괄호 안을 먼저 계산해요. 더하고 빼기만 하면 되니 금방이에요. 그다음에 한 번만 제곱해요. 제곱한 값은 괄호 안이 음수여도 양수예요. 처음 식에 수를 바로 넣어 여섯 항을 따로 계산하는 것보다 훨씬 빨라요.'] };
  };
  numQ({
    id: 'C03.value', title: '인수분해로 식의 값 구하기', build: vlBuild,
    mistakes: [['squared', '세제곱이 아니라 제곱을 했어요. 이 식은 삼차식이라서 인수분해하면 괄호의 세제곱이 돼요. 같은 수를 세 번 곱해요.'],
      ['not-cubed', '괄호 안만 계산하고 세제곱을 하지 않았어요. 괄호 밖의 지수만큼 거듭제곱해야 해요.'],
      ['times-three', '세제곱 대신 3을 곱했어요. 세제곱은 같은 수를 세 번 곱하는 것이에요. 10의 세제곱은 30이 아니라 1000이에요.'],
      ['sign-b', '괄호 안의 부호를 반대로 인수분해했어요. 처음 식의 부호가 모두 +이면 괄호 안도 +, 번갈아 나오면 −예요.'],
      ['ends-only', '양 끝의 항만 계산했어요. 가운데 두 항도 식의 일부예요. 인수분해한 식에 수를 넣으면 빠뜨리지 않아요.'],
      ['other-sign', '첫째 괄호의 부호를 반대로 했어요. 첫째 괄호의 부호는 분자의 부호와 같아요. 분자가 합이면 더하고, 차이면 빼요.'],
      ['product', '두 수를 곱했어요. 약분하고 남는 것은 첫째 괄호예요. 두 수를 더하거나 뺀 값이에요.'],
      ['denominator', '분모의 값을 답했어요. 분모는 분자의 둘째 괄호와 약분되어 사라져요. 남는 것은 첫째 괄호예요.'],
      ['not-squared', '괄호 안만 계산하고 제곱을 하지 않았어요. 인수분해한 식은 괄호의 제곱이에요. 마지막에 제곱해요.'],
      ['all-plus', '괄호 안의 부호를 모두 +로 했어요. 처음 식에서 곱한 항이 −이면 그 두 문자의 부호가 서로 달라요.'],
      ['squares-only', '제곱인 세 항만 계산했어요. 둘씩 곱한 세 항도 식의 일부예요. 인수분해한 식에 수를 넣으면 빠뜨리지 않아요.'],
      ['doubled', '제곱 대신 2를 곱했어요. 제곱은 같은 수를 두 번 곱하는 것이에요. 10의 제곱은 20이 아니라 100이에요.']],
    levels: [
      { name: '세제곱 꼴로 묶어 값 구하기', minDistinct: 55, vars: { q: sampler(function (r) { return { t: 'cube', b: nz(r, -4, 4), tt: r.pick([10, 20, 30, 40, 50, 100, -10, -20]) }; }) } },
      { name: '세제곱의 합과 차로 약분하기', vars: { q: sampler(function (r) { return { t: 'frac', a: r.int(3, 25), b: r.int(2, 15), plus: r.int(0, 1) === 1 }; }) } },
      { name: '세 항의 제곱 꼴로 묶어 값 구하기', vars: { q: sampler(function (r) { return { t: 'tri', x: r.int(2, 25), y: r.int(1, 15), z: r.int(1, 9), sy: pm(r, 1), sz: pm(r, 1) }; }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('C03', [
  { title: '인수분해, 공식이 늘어나요', body: [
    '인수분해는 전개를 거꾸로 하는 것이에요. 풀어 놓은 식을 다시 곱셈 꼴로 묶어요. $12 = 2 \\times 2 \\times 3$처럼 수를 쪼개듯이, 식을 더 쪼갤 수 없을 때까지 곱으로 써요.',
    '중학교에서는 공통인수 묶기, 완전제곱식, 제곱의 차, $x^{2} + bx + c$ 꼴을 배웠어요. 여기에 삼차식과 사차식을 다루는 방법이 더해져요.',
    { ex: [['a^{3} + 3a^{2}b + 3ab^{2} + b^{3} = (a + b)^{3}', '세제곱 꼴'], ['a^{3} + b^{3} = (a + b)(a^{2} - ab + b^{2})', '세제곱의 합'], ['a^{2} + b^{2} + c^{2} + 2ab + 2bc + 2ca = (a + b + c)^{2}', '세 항의 제곱']] },
    '모두 앞 단원에서 배운 곱셈 공식을 오른쪽에서 왼쪽으로 읽은 것이에요. 새로 외울 것은 없어요.'
  ] },
  { title: '세제곱 공식 두 가지', body: [
    '세제곱이 보이는 식은 항의 개수부터 세어 봐요. 항이 네 개이면 $(a \\pm b)^{3}$ 꼴, 항이 두 개이면 세제곱의 합과 차예요.',
    { ex: [['x^{3} + 6x^{2} + 12x + 8 = (x + 2)^{3}', '항이 네 개. 8은 2의 세제곱'], ['x^{3} + 8 = (x + 2)(x^{2} - 2x + 4)', '항이 두 개. 세제곱의 합'], ['x^{3} - 8 = (x - 2)(x^{2} + 2x + 4)', '항이 두 개. 세제곱의 차']] },
    '세제곱의 합과 차는 부호가 헷갈려요. 첫째 괄호는 처음 식과 같은 부호, 둘째 괄호의 가운데 항은 그 반대 부호, 끝 항은 늘 +예요.',
    '둘째 괄호의 가운데 항은 두 수를 한 번만 곱한 것이에요. 완전제곱식처럼 2배를 하지 않아요.'
  ] },
  { title: '세 항의 제곱 꼴', body: [
    '항이 여섯 개이고 그 가운데 셋이 제곱 꼴이면 세 항의 제곱을 떠올려요.',
    { tex: 'a^{2} + b^{2} + c^{2} + 2ab + 2bc + 2ca = (a + b + c)^{2}' },
    { ex: [['x^{2} + y^{2} + 9 + 2xy + 6y + 6x', '제곱인 항은 x², y², 9'], ['(x + y + 3)^{2}', '괄호 안에 x, y, 3을 넣어요']] },
    '부호는 둘씩 곱한 항으로 정해요. 곱한 항이 음수이면 그 두 항의 부호가 서로 달라요.',
    { ex: [['x^{2} + y^{2} + 9 - 2xy - 6y + 6x', 'xy와 y가 든 항이 음수예요'], ['(x - y + 3)^{2}', 'y만 부호가 달라요']] }
  ] },
  { title: '같은 모양은 한 덩어리로 (치환)', body: [
    '식 안에 똑같은 모양이 여러 번 나오면 그것에 $X$라는 이름표를 붙여요. 여러 물건을 상자 하나에 담아 상자째로 옮기는 것과 같아요.',
    { ex: [['(x^{2} + 3x)^{2} - 2(x^{2} + 3x) - 8', 'x² + 3x가 두 번 나와요'], ['X^{2} - 2X - 8 = (X + 2)(X - 4)', 'X로 놓고 인수분해해요'], ['(x^{2} + 3x + 2)(x^{2} + 3x - 4)', 'X를 원래 식으로 되돌려요'], ['(x + 1)(x + 2)(x - 1)(x + 4)', '괄호 안을 끝까지 인수분해해요']] },
    '잊기 쉬운 것이 두 가지 있어요. 하나는 $X$를 원래 식으로 되돌리는 것이고, 다른 하나는 되돌린 다음 괄호 안을 더 인수분해할 수 있는지 살피는 것이에요.'
  ] },
  { title: '사차식 인수분해', body: [
    '$x^{4}$, $x^{2}$, 상수항만 있는 사차식은 $x^{2}$을 $X$로 놓아요. $x^{4}$은 $X^{2}$이 되어 이차식처럼 인수분해할 수 있어요.',
    { ex: [['x^{4} - 5x^{2} + 4', 'x² 자리에 X를 쓰면 X² − 5X + 4'], ['(x^{2} - 1)(x^{2} - 4)', '(X − 1)(X − 4)에서 X를 되돌려요'], ['(x + 1)(x - 1)(x + 2)(x - 2)', '제곱의 차는 한 번 더 인수분해해요']] },
    '맞는 두 정수가 없을 때는 (제곱) − (제곱) 꼴로 고쳐요. 양 끝의 항으로 완전제곱식을 만들고, 가운데 항에서 남는 만큼을 떼어 내요.',
    { ex: [['x^{4} + x^{2} + 1', '곱해서 1, 더해서 1인 두 정수는 없어요'], ['(x^{4} + 2x^{2} + 1) - x^{2}', 'x² 하나를 더 더하고 다시 빼요'], ['(x^{2} + 1)^{2} - x^{2}', '(제곱) − (제곱) 꼴'], ['(x^{2} + x + 1)(x^{2} - x + 1)', '합과 차의 곱']] }
  ] },
  { title: '인수정리로 실마리 찾기', body: [
    '공식에 맞지 않는 삼차식과 사차식은 인수정리를 써요. 식을 $P(x)$라고 할 때 $P(a) = 0$이면 $x - a$가 인수예요. 넣어 볼 수는 상수항의 약수예요.',
    { ex: [['P(x) = x^{3} - 2x^{2} - 5x + 6', '상수항 6의 약수를 넣어 봐요'], ['P(1) = 1 - 2 - 5 + 6 = 0', '0이 되니 x − 1이 인수예요']] },
    '인수 하나를 찾았으면 조립제법으로 나눠 몫을 구해요. 대각선은 곱하기, 세로는 더하기예요.',
    { ex: [['\\begin{array}{c|cccc} 1 & 1 & -2 & -5 & 6 \\\\ & & 1 & -1 & -6 \\\\ \\hline & 1 & -1 & -6 & 0 \\end{array}', '몫은 x² − x − 6, 나머지는 0'], ['(x - 1)(x^{2} - x - 6)', '인수와 몫의 곱으로 써요'], ['(x - 1)(x + 2)(x - 3)', '몫을 한 번 더 인수분해해요']] },
    '몫이 더 인수분해되지 않으면 이차식을 그대로 둬요. 억지로 쪼개지 않아요.'
  ] }
]);
