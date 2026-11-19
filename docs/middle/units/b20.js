/* B20 인수분해 — 공통인수, 인수분해 공식, x² + bx + c, ax² + bx + c
   유형(쉬운 것부터): B20.common 공통인수로 묶기 · B20.square 완전제곱식으로 인수분해 · B20.diff 제곱의 차
                     · B20.xbc x² + bx + c · B20.axbc ax² + bx + c (여기까지 보기 고르기) · B20.value 인수분해의 활용(키패드, 자연수)
   답이 식이면 보기 고르기, 답이 수 하나이면 키패드다.
   식은 항의 목록으로 다룬다. 항 = { c: 정수 계수, e: { x: 2, y: 1 } }. 계산은 모두 정수로 한다.
   인수분해한 꼴은 (앞에 묶어 낸 것) + (괄호들)의 글자로 쓴다(fac). 틀린 보기는 '흔한 실수 하나를 저지른 인수분해'다.
   검산: 문제의 식과 답을 MH.alg.sameVal 로 견준다(문자에 두 가지 수를 넣어 값을 비교). 틀린 보기는 답 · 다른 보기와 값이 달라야 한다.
   단, '끝까지 인수분해하지 않은 식'(not-finished, partial)은 값이 답과 같고 글자만 다르다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, order4 = A.order4, sameVal = A.sameVal, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var sgn = function (x) { return x < 0 ? -1 : 1; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!(q && ok(q)) && ++i < 200); return q; };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  var perm6 = function (r) { return r.shuffle([0, 1, 2, 3, 4, 5]); };

  /* ── 항과 다항식 ── */
  var ORDER = ['a', 'b', 'x', 'y'];
  var T = function (c, e) { return { c: c, e: e || {} }; };
  var V = function (c, v) { var e = {}; if (v) e[v] = 1; return T(c, e); };
  var key = function (e) { return ORDER.filter(function (k) { return e[k]; }).map(function (k) { return k + (e[k] === 1 ? '' : '^{' + e[k] + '}'); }).join(''); };
  var deg = function (e) { return ORDER.reduce(function (s, k) { return s + (e[k] || 0); }, 0); };
  /** 차수가 높은 항부터, 같은 차수이면 앞 문자의 지수가 큰 항부터, 상수항은 맨 뒤 */
  var cmp = function (a, b) { var d = deg(b.e) - deg(a.e), i; for (i = 0; !d && i < ORDER.length; i++) d = (b.e[ORDER[i]] || 0) - (a.e[ORDER[i]] || 0); return d; };
  var mulT = function (a, b) { var e = {}; ORDER.forEach(function (k) { var x = (a.e[k] || 0) + (b.e[k] || 0); if (x) e[k] = x; }); return T(a.c * b.c, e); };
  var sq = function (t) { return mulT(t, t); };
  var neg = function (t) { return T(-t.c, t.e); };
  var mag = function (t) { return T(abs(t.c), t.e); };
  var ptex = function (ts) { return poly(ts.map(function (t) { return [t.c, key(t.e)]; })); };
  var one = function (t) { return ptex([t]); };
  /** 두 다항식의 곱을 곱한 차례대로 늘어놓는다(동류항은 아직 모으지 않는다) */
  var pmul = function (P, Q) { var out = []; P.forEach(function (a) { Q.forEach(function (b) { out.push(mulT(a, b)); }); }); return out; };
  var comb = function (ts) {
    var g = {}, ks = [];
    ts.forEach(function (t) { var k = key(t.e); if (!g[k]) { g[k] = T(0, t.e); ks.push(k); } g[k].c += t.c; });
    return ks.map(function (k) { return g[k]; }).filter(function (t) { return t.c !== 0; }).sort(cmp);
  };
  var bin = function (P) { return '(' + ptex(P) + ')'; };
  /** 제곱을 쓴다: x → x^{2}, 3 → 3^{2}, 2x → (2x)^{2}, -x → (-x)^{2} */
  var sqTex = function (t) { var s = one(t); return /^[a-z]$|^\d+$/.test(s) ? s + '^{2}' : '(' + s + ')^{2}'; };
  var wrap = function (t) { var s = one(t); return s.charAt(0) === '-' ? '(' + s + ')' : s; };

  /* ── 틀: 보기 고르기 ── */
  var texOf = function (x) { return typeof x === 'string' ? x : ptex(x); };
  /** 틀린 보기 후보의 차례: first 는 늘 앞에, rest 는 문제마다 섞은 차례(perm)로 */
  var mixc = function (first, rest, perm) {
    return first.concat(rest.map(function (c, i) { return [perm[i % perm.length], i, c]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }).map(function (x) { return x[2]; }));
  };
  /** 보기 고르기 문제를 마무리한다: 답의 글자, 글자도 값도 서로 다른 틀린 보기 3개(실수 id 는 한 번씩), 검산 */
  var finish = function (o) {
    var ans = texOf(o.ans), seen = [ans], wrong = [];
    o.cands.forEach(function (c) {
      var t;
      if (!c || !c[0] || wrong.length >= 3 || wrong.some(function (w) { return w[1] === c[1]; })) return;
      t = texOf(c[0]);
      /* c[3] 이 참인 후보는 '끝까지 인수분해하지 않은 식'이다: 값은 답과 같고 글자만 다르다 */
      if (t === '0' || t.length > 40 || (c[3] ? t === ans || !sameVal(t, ans) || seen.indexOf(t) >= 0 : seen.some(function (s) { return s === t || sameVal(s, t); }))) return;
      if (!c[3]) seen.push(t);
      wrong.push([t, c[1], c[2]]);
    });
    return { tex: o.raw, text: o.text || '다음 식을 인수분해하세요.', ans: ans, wrong: wrong, hints: o.hints, steps: o.steps, check: wrong.length === 3 && ans.length <= 40 && sameVal(o.raw, ans) && o.ok !== false };
  };
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B20', version: 1, title: o.title,
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
  /* ── 틀: 수 하나(키패드). o.kind: 'int'(자연수) | 'signed'(부호 있는 정수)
     build(q) → { text, tex, ans: 정수, hints, steps, wrong: { 실수 id: 정수 }, check } ── */
  var numQ = function (o) {
    var lastQ = null, lastP = null, S = o.kind === 'signed';
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (n) { return S ? { n: n, p: 0 } : n; };
    var leak = function (p) { var a = String(p.ans); return p.ans > (S ? 0 : 19) && nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && (S ? p.ans !== 0 : p.ans >= 1) && p.check === true && !leak(p); }; });
    MH.defineType({
      id: o.id, unit: 'B20', version: 1, title: o.title,
      answer: { kind: o.kind },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { text: p.text, tex: p.tex }; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v); return p.check === true && (S ? ans.p === 0 && ans.n === p.ans : ans === p.ans); },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), x = p.wrong[m[0]], i;
            /* 부호만 반대인 답은 공통 실수(sign)가 맡는다 */
            if (!isInt(x) || x === p.ans || (S ? x === 0 || x === -p.ans : x < 1)) return null;
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) if (p.wrong[o.mistakes[i][0]] === x) return null;
            return val(x);
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  var gcd = MH.gcd;
  /** 괄호 앞에 쓰는 것: 수 1 은 쓰지 않는다. 2, 2xy, x … */
  var pre = function (c) { if (typeof c === 'number') return c === 1 ? '' : c === -1 ? '-' : String(c); return key(c.e) === '' && c.c === 1 ? '' : one(c); };
  /** 인수분해한 꼴을 쓴다: 2(x + 3)(x - 3), (x + 3)^{2}. 같은 괄호가 잇달아 나오면 제곱으로 쓴다 */
  var fac = function (c, list) {
    var t = list.map(bin), out = '', i;
    for (i = 0; i < t.length; i++) { if (t[i] === t[i + 1]) { out += t[i] + '^{2}'; i++; } else out += t[i]; }
    return pre(c) + out;
  };
  var scale = function (c, ts) { return ts.map(function (t) { return T(c * t.c, t.e); }); };
  var UNDONE = '아직 인수분해가 끝나지 않았어요. 공통인수만 묶어 내고 멈췄어요. 괄호 안의 식을 한 번 더 인수분해할 수 있어요.';
  var LOST = '공통인수를 빠뜨렸어요. 처음에 묶어 낸 수는 끝까지 맨 앞에 남아 있어야 해요. 전개해서 처음 식과 같은지 확인해요.';
  var CHECK = '④ 인수분해한 식을 다시 전개해서 처음 식이 나오는지 확인해요.';

  /* ── B20.common 공통인수로 묶기 ──────────────────── */
  var COM = '인수분해는 전개를 거꾸로 하는 것이에요. 풀어 놓은 식을 다시 곱셈 꼴로 묶어요. 가장 먼저 할 일은 공통인수 찾기예요. 선물 꾸러미마다 똑같은 물건이 하나씩 들어 있으면, 그 물건을 꺼내 한 번만 쓰고 나머지를 괄호로 묶을 수 있어요. $ma + mb = m(a + b)$에서 $m$이 모든 항에 들어 있는 공통인수예요.';
  var comBuild = function (q) {
    var g = q.g, rest = q.rest, terms = rest.map(function (t) { return mulT(g, t); }), raw = ptex(terms), ans = pre(g) + bin(rest), cands, gl = key(g.e), d, v, i, partial = null, dropped = null, kept = null;
    var rep = function (idx, t) { return rest.map(function (x, j) { return j === idx ? t : x; }); };
    /* 덜 묶은 것: 수만 묶거나, 더 작은 수만 묶는다 */
    if (gl && abs(g.c) > 1) partial = pre(T(g.c)) + bin(rest.map(function (t) { return mulT(T(1, g.e), t); }));
    else if (gl && deg(g.e) > 1) { v = Object.keys(g.e)[0]; partial = pre(V(g.c, v)) + bin(rest.map(function (t) { return mulT(T(1, mulT(g, T(1)).e), t); }).map(function (t) { var e = {}; Object.keys(t.e).forEach(function (k) { e[k] = t.e[k]; }); e[v] -= 1; if (!e[v]) delete e[v]; return T(t.c, e); })); }
    else for (d = 2; d < g.c; d++) if (g.c % d === 0) { partial = pre(T(d, g.e)) + bin(scale(g.c / d, rest)); break; }
    for (i = 0; i < rest.length; i++) if (key(rest[i].e) === '' && abs(rest[i].c) === 1 && rest.length === 3) dropped = pre(g) + bin(rest.filter(function (x, j) { return j !== i; }));
    if (gl) for (i = 0; i < rest.length && !kept; i++) { v = Object.keys(g.e).filter(function (k) { return rest[i].e[k]; })[0]; if (v) kept = pre(g) + bin(rep(i, mulT(rest[i], V(1, v)))); }
    cands = mixc([[pre(g) + bin(rep(1, mulT(g, rest[1]))), 'one-left', '둘째 항은 공통인수로 나누지 않고 그대로 썼어요. 공통인수를 묶어 내면 모든 항을 공통인수로 나눈 몫이 괄호 안에 남아요.']], [
      [pre(g) + bin(rep(1, neg(rest[1]))), 'sign', '괄호 안의 부호가 틀렸어요. 공통인수가 양수이면 괄호 안의 부호는 처음 식의 부호와 같아요.'],
      partial ? [partial, 'partial', '공통인수를 덜 묶었어요. 괄호 안의 항들에 아직 공통으로 들어 있는 수나 문자가 남아 있어요. 남김없이 묶어 내요.', true] : null,
      dropped ? [dropped, 'one-dropped', '공통인수와 똑같은 항을 묶을 때 1을 남기지 않았어요. 자기 자신으로 나누면 0이 아니라 1이에요.'] : null,
      kept ? [kept, 'exp-kept', '문자를 묶어 냈는데 괄호 안의 문자의 차수를 줄이지 않았어요. 묶어 낸 만큼 괄호 안에서는 빠져요.'] : null,
      abs(g.c) > 1 && gl ? [pre(g) + bin(rep(0, T(rest[0].c * g.c, rest[0].e))), 'coef-kept', '문자만 나누고 계수는 나누지 않았어요. 계수도 공통인수의 수로 나눈 몫을 써요.'] : null,
      [pre(g) + bin(rep(0, mulT(g, rest[0]))), 'first-left', '첫 항은 공통인수로 나누지 않고 그대로 썼어요. 모든 항을 공통인수로 나눈 몫이 괄호 안에 남아요.']
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands,
      steps: [{ say: '각 항을 (공통인수) × (나머지)로 써요.', tex: rest.map(function (t, j) { return (j ? (t.c < 0 ? ' - ' : ' + ') : (t.c < 0 ? '-' : '')) + one(g) + ' \\times ' + one(mag(t)); }).join('') }, { say: '공통인수를 괄호 앞으로 묶어 내요. 괄호 안에는 나머지만 남아요.', tex: ans }],
      hints: [COM, '항은 ' + terms.length + '개(' + terms.map(function (t) { return '$' + one(t) + '$'; }).join(', ') + ')예요. 먼저 계수들을 보고 모두를 나눌 수 있는 가장 큰 수(최대공약수)를 찾아요. 그다음 모든 항에 빠짐없이 들어 있는 문자를 찾아요. 같은 문자가 여러 번 곱해져 있으면 가장 적게 들어 있는 항만큼만 꺼낼 수 있어요. 수와 문자를 곱한 것이 공통인수예요.',
        '① 계수의 최대공약수를 찾아요. ② 모든 항에 들어 있는 문자를 찾아요. ③ 공통인수를 괄호 앞에 쓰고, 각 항을 공통인수로 나눈 몫을 괄호 안에 써요. 항이 공통인수와 같으면 1을 남겨요. ' + CHECK] });
  };
  var okCm = function (q) { var p = comBuild(q); return !!p && p.check; };
  var G2 = [{ x: 1 }, { y: 1 }, { x: 1, y: 1 }, { x: 2 }, { a: 1 }, { a: 1, b: 1 }];
  var restOf = function (r, e, three) {
    var hasAB = e.a || e.b, u = hasAB ? 'a' : 'x', w = hasAB ? 'b' : 'y', p = r.int(1, 5), m = nz(r, -7, 7), s = r.pick([1, -1, 1, 2, 3, -2, 5, -3]);
    if (three) return gcd(gcd(p, abs(m)), abs(s)) !== 1 ? null : [V(p, u), V(m, w), T(s)];
    return gcd(p, abs(m)) !== 1 ? null : [V(p, u), V(m, r.pick(['', w]))];
  };
  choiceQ({
    id: 'B20.common', title: '공통인수로 묶기', ids: ['one-left', 'sign', 'partial', 'one-dropped', 'exp-kept', 'coef-kept', 'first-left'], build: comBuild,
    levels: [
      { name: '수를 묶어 내기', vars: { q: sampler(function (r) { return until(function () { var rest = restOf(r, {}, false); return rest && { g: T(r.int(2, 9)), rest: rest, perm: perm6(r), o: order4(r) }; }, okCm); }) } },
      { name: '문자를 묶어 내기', vars: { q: sampler(function (r) { return until(function () { var e = r.pick(G2), rest = restOf(r, e, false); return rest && { g: T(r.pick([1, 1, 2, 3, 4, 5, 6]), e), rest: rest, perm: perm6(r), o: order4(r) }; }, okCm); }) } },
      { name: '항이 3개인 식', vars: { q: sampler(function (r) { return until(function () { var e = r.pick(G2), rest = restOf(r, e, true); return rest && { g: T(r.pick([1, 2, 2, 3, 4, 5, 6]), e), rest: rest, perm: perm6(r), o: order4(r) }; }, okCm); }) } }
    ]
  });

  /* ── B20.square 완전제곱식으로 인수분해 ─────────────── */
  var SQF = '$a^{2} + 2ab + b^{2}$ 꼴의 식은 $(a + b)^{2}$으로 묶여요. 곱셈 공식을 거꾸로 쓰는 것이에요. 알아보는 방법이 있어요. 첫 항과 끝 항이 둘 다 어떤 것의 제곱이고, 가운데 항이 그 둘을 곱한 것의 2배이면 완전제곱식이에요. 정사각형 타일 두 장과 똑같은 직사각형 타일 두 장으로 큰 정사각형 하나를 맞추는 것과 같아요.';
  var sqfBuild = function (q) {
    var c = q.c, f = V(q.p, q.v1), g = V(q.s * q.q, q.v2), G = mag(g), inner = [f, g], full = comb(pmul(inner, inner)), raw = ptex(scale(c, full)), ans = fac(c, [inner, inner]), fg = mulT(f, G), cands, steps;
    cands = mixc([c > 1 ? [pre(c) + bin(full), 'not-finished', UNDONE, true] : [fac(1, [[f, G], [f, neg(G)]]), 'conj', '합과 차의 곱으로 묶었어요. 그 꼴은 가운데 항이 없는 제곱의 차일 때 써요. 가운데 항이 있으면 완전제곱식이에요.']], [
      c > 1 ? [fac(c, [[f, G], [f, neg(G)]]), 'conj', '합과 차의 곱으로 묶었어요. 그 꼴은 가운데 항이 없는 제곱의 차일 때 써요. 가운데 항이 있으면 완전제곱식이에요.'] : null,
      [fac(c, [[f, neg(g)], [f, neg(g)]]), 'sign', '괄호 안의 부호가 틀렸어요. 괄호 안의 부호는 가운데 항의 부호를 따라가요.'],
      q.v2 === '' && q.q > 1 ? [fac(c, [[f, T(g.c * q.q)], [f, T(g.c * q.q)]]), 'not-rooted', '끝 항을 그대로 괄호 안에 넣었어요. 괄호 안에는 제곱해서 끝 항이 되는 수를 써요.'] : null,
      q.v2 === '' && 2 * q.p * q.q !== q.q ? [fac(c, [[f, T(q.s * 2 * q.p * q.q)], [f, T(q.s * 2 * q.p * q.q)]]), 'middle-used', '가운데 항의 계수를 그대로 괄호 안에 넣었어요. 가운데 항은 두 항을 곱한 것의 2배이니, 그 절반을 따져 봐야 해요.'] : null,
      q.p > 1 ? [fac(c, [[V(q.p * q.p, q.v1), g], [V(q.p * q.p, q.v1), g]]), 'coef-not-rooted', '첫 항의 계수를 그대로 괄호 안에 넣었어요. 괄호 안에는 제곱해서 첫 항이 되는 것을 써요.'] : null,
      c > 1 ? [fac(1, [inner, inner]), 'factor-lost', LOST] : null
    ], q.perm);
    steps = (c > 1 ? [{ say: '모든 항에 공통인수 $' + c + '$' + pj(c, '이/가') + ' 있어요. 먼저 묶어 내요.', tex: pre(c) + bin(full) }] : []).concat([
      { say: '첫 항과 끝 항을 제곱 꼴로, 가운데 항을 두 항의 곱의 2배로 써요.', tex: pre(c) + (c > 1 ? '(' : '') + sqTex(f) + (g.c < 0 ? ' - ' : ' + ') + '2 \\times ' + one(f) + ' \\times ' + one(G) + ' + ' + sqTex(G) + (c > 1 ? ')' : '') },
      { say: '완전제곱식으로 묶어요. 괄호 안의 부호는 가운데 항의 부호와 같아요.', tex: ans }]);
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps,
      hints: [SQF, (c > 1 ? '먼저 세 항의 계수를 봐요. 모두 $' + c + '$' + pj(c, '으로/로') + ' 나누어져요. 공통인수가 있으면 무조건 그것부터 묶어 내요. 그러면 괄호 안이 훨씬 간단해져요. 그다음, ' : '') + '첫 항과 끝 항이 각각 무엇의 제곱인지 찾아요. 그 둘을 곱해서 2배 한 것이 가운데 항과 크기가 같은지 확인해요. 같으면 완전제곱식이에요. 가운데 항이 더하기이면 괄호 안도 더하기, 빼기이면 괄호 안도 빼기예요.',
        '① 공통인수가 있으면 먼저 묶어 내요. ② 첫 항과 끝 항이 무엇의 제곱인지 찾아요. ③ 그 둘의 곱의 2배가 가운데 항인지 확인하고, 가운데 항의 부호로 괄호 안의 부호를 정해요. ' + CHECK] });
  };
  var okSf = function (q) { var p = sqfBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B20.square', title: '완전제곱식으로 인수분해', ids: ['conj', 'sign', 'not-rooted', 'middle-used', 'coef-not-rooted', 'not-finished', 'factor-lost'], build: sqfBuild,
    levels: [
      { name: 'x² ± 2ax + a²', minDistinct: 30, vars: { q: sampler(function (r) { return until(function () { return { c: 1, p: 1, v1: r.pick(['x', 'y', 'a']), q: r.int(1, 9), v2: '', s: pm(r, 1), perm: perm6(r), o: order4(r) }; }, okSf); }) } },
      { name: '계수가 있는 식', minDistinct: 60, vars: { q: sampler(function (r) {
          return until(function () { var p, m; if (r.int(0, 1)) { p = r.int(2, 5); m = r.int(1, 7); return gcd(p, m) !== 1 ? null : { c: 1, p: p, v1: r.pick(['x', 'a']), q: m, v2: '', s: pm(r, 1), perm: perm6(r), o: order4(r) }; } p = r.int(1, 3); m = r.int(2, 5); return gcd(p, m) !== 1 ? null : { c: 1, p: p, v1: 'x', q: m, v2: 'y', s: pm(r, 1), perm: perm6(r), o: order4(r) }; }, okSf);
        }) } },
      { name: '공통인수를 먼저 묶는 식', minDistinct: 60, vars: { q: sampler(function (r) { return until(function () { return { c: r.int(2, 5), p: 1, v1: r.pick(['x', 'a']), q: r.int(1, 6), v2: '', s: pm(r, 1), perm: perm6(r), o: order4(r) }; }, okSf); }) } }
    ]
  });

  /* ── B20.diff 제곱의 차 ─────────────────────────── */
  var DF = '$a^{2} - b^{2}$ 꼴, 곧 제곱에서 제곱을 뺀 식은 $(a + b)(a - b)$로 묶여요. 합과 차의 곱 공식을 거꾸로 쓴 것이에요. 알아보기 쉬워요. 항이 딱 두 개이고, 둘 다 어떤 것의 제곱이고, 그 사이가 빼기예요. 가운데 항이 없다는 것이 완전제곱식과 다른 점이에요. 사이가 더하기인 $a^{2} + b^{2}$은 이렇게 묶을 수 없어요.';
  var dfBuild = function (q) {
    var c = q.c, f = V(q.p, q.v1), g = V(q.q, q.v2), rev = q.rev, A1 = rev ? g : f, B1 = rev ? f : g, full = [sq(A1), neg(sq(B1))], raw = ptex(scale(c, full)), ans = fac(c, [[A1, B1], [A1, neg(B1)]]), cands, steps, CJ1 = '합과 차의 곱으로 묶어야 해요.';
    cands = mixc([c > 1 ? [pre(c) + bin(full), 'not-finished', UNDONE, true] : rev ? [fac(1, [[B1, A1], [B1, neg(A1)]]), 'reversed', '빼는 차례가 바뀌었어요. 전개하면 처음 식과 부호가 반대인 식이 나와요. 앞에 있는 제곱의 것이 두 괄호에서 앞에 와요.'] : [fac(1, [[A1, neg(B1)], [A1, neg(B1)]]), 'square', '완전제곱식으로 묶었어요. 전개하면 가운데 항이 생겨서 처음 식과 달라요. 제곱의 차는 ' + CJ1]], [
      c > 1 || rev ? [fac(c, [[A1, neg(B1)], [A1, neg(B1)]]), 'square', '완전제곱식으로 묶었어요. 전개하면 가운데 항이 생겨서 처음 식과 달라요. 제곱의 차는 ' + CJ1] : null,
      [fac(c, [[A1, B1], [A1, B1]]), 'plus-square', '두 괄호 모두 더하기로 썼어요. 한쪽은 더하기, 한쪽은 빼기여야 가운데 항이 지워져요.'],
      q.v2 === '' && q.q > 1 ? [fac(c, rev ? [[T(q.q * q.q), f], [T(q.q * q.q), neg(f)]] : [[f, T(q.q * q.q)], [f, neg(T(q.q * q.q))]]), 'not-rooted', '수를 그대로 괄호 안에 넣었어요. 괄호 안에는 제곱해서 그 수가 되는 수를 써요.'] : null,
      q.v2 === '' && q.q > 1 && (q.q * q.q) % 2 === 0 && q.q * q.q / 2 !== q.q ? [fac(c, rev ? [[T(q.q * q.q / 2), f], [T(q.q * q.q / 2), neg(f)]] : [[f, T(q.q * q.q / 2)], [f, neg(T(q.q * q.q / 2))]]), 'halved', '수를 반으로 나눠서 넣었어요. 제곱근은 반이 아니에요. 같은 수를 두 번 곱해서 그 수가 되는 수를 찾아요.'] : null,
      q.p > 1 ? [fac(c, rev ? [[g, V(q.p * q.p, q.v1)], [g, neg(V(q.p * q.p, q.v1))]] : [[V(q.p * q.p, q.v1), g], [V(q.p * q.p, q.v1), neg(g)]]), 'coef-not-rooted', '문자 앞의 계수를 그대로 괄호 안에 넣었어요. 괄호 안에는 제곱해서 그 항이 되는 것을 써요.'] : null,
      c > 1 ? [fac(1, [[A1, B1], [A1, neg(B1)]]), 'factor-lost', LOST] : null
    ], q.perm);
    steps = (c > 1 ? [{ say: '두 항에 공통인수 $' + c + '$' + pj(c, '이/가') + ' 있어요. 먼저 묶어 내요.', tex: pre(c) + bin(full) }] : []).concat([
      { say: '두 항을 각각 제곱 꼴로 써요.', tex: pre(c) + (c > 1 ? '(' : '') + sqTex(A1) + ' - ' + sqTex(B1) + (c > 1 ? ')' : '') }, { say: '제곱의 차는 합과 차의 곱으로 묶어요.', tex: ans }]);
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps,
      hints: [DF, (c > 1 ? '두 항의 계수가 모두 $' + c + '$' + pj(c, '으로/로') + ' 나누어져요. 공통인수가 있으면 그것부터 묶어 내요. 그러면 괄호 안에 제곱의 차가 보여요. 그다음, ' : '') + '앞의 항과 뒤의 항이 각각 무엇의 제곱인지 찾아요. 수는 제곱해서 그 수가 되는 수를, 문자가 든 항은 계수와 문자를 함께 생각해요. 찾은 두 가지를 한 번은 더하고 한 번은 빼서 두 괄호를 만들어요.' + (rev ? ' 수가 앞에 있는 식이니, 괄호 안에서도 수를 앞에 써요.' : ''),
        '① 공통인수가 있으면 먼저 묶어 내요. ② 두 항이 각각 무엇의 제곱인지 찾아요. ③ (앞의 것 + 뒤의 것)(앞의 것 − 뒤의 것)으로 써요. ' + CHECK] });
  };
  var okDf = function (q) { var p = dfBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B20.diff', title: '제곱의 차', ids: ['square', 'plus-square', 'not-rooted', 'halved', 'coef-not-rooted', 'reversed', 'not-finished', 'factor-lost'], build: dfBuild,
    levels: [
      { name: 'x² − a²', minDistinct: 30, vars: { q: sampler(function (r) { return until(function () { return { c: 1, p: 1, v1: r.pick(['x', 'y', 'a', 'b']), q: r.int(1, 12), v2: '', rev: false, perm: perm6(r), o: order4(r) }; }, okDf); }) } },
      { name: '계수가 있는 식', minDistinct: 60, vars: { q: sampler(function (r) {
          return until(function () { var p, m; if (r.int(0, 1)) { p = r.int(2, 7); m = r.int(1, 9); return gcd(p, m) !== 1 ? null : { c: 1, p: p, v1: r.pick(['x', 'a']), q: m, v2: '', rev: false, perm: perm6(r), o: order4(r) }; } p = r.int(1, 5); m = r.int(2, 7); return gcd(p, m) !== 1 ? null : { c: 1, p: p, v1: 'x', q: m, v2: 'y', rev: false, perm: perm6(r), o: order4(r) }; }, okDf);
        }) } },
      { name: '공통인수를 먼저 묶는 식 · 수가 앞에 있는 식', minDistinct: 60, vars: { q: sampler(function (r) {
          return until(function () { var p, m; if (r.int(0, 1)) return { c: r.int(2, 6), p: 1, v1: r.pick(['x', 'a']), q: r.int(1, 7), v2: '', rev: false, perm: perm6(r), o: order4(r) }; p = r.int(1, 4); m = r.int(1, 9); return gcd(p, m) !== 1 ? null : { c: 1, p: p, v1: r.pick(['x', 'a']), q: m, v2: '', rev: true, perm: perm6(r), o: order4(r) }; }, okDf);
        }) } }
    ]
  });

  /* ── B20.xbc x² + bx + c ───────────────────────── */
  var XBC = '$x^{2} + bx + c$를 인수분해하는 것은 숫자 퍼즐이에요. $(x + p)(x + q)$를 전개하면 $x$의 계수는 두 수의 합, 상수항은 두 수의 곱이었어요. 거꾸로 가면 "곱해서 상수항이 되고, 더해서 $x$의 계수가 되는 두 수"를 찾으면 돼요. 곱이 되는 쌍을 먼저 모두 적고, 그 가운데 합이 맞는 쌍을 고르는 것이 가장 빠른 길이에요.';
  var xbcBuild = function (q) {
    var c = q.c, p = q.p, m = q.q, w = q.v2, F1 = function (u, t) { return [[V(1, 'x'), V(u, w)], [V(1, 'x'), V(t, w)]]; }, full = comb(pmul(F1(p, m)[0], F1(p, m)[1])), raw = ptex(scale(c, full)), ans = fac(c, F1(p, m)), sum = p + m, prod = p * m, cands, steps, other = null, u;
    for (u = 1; u <= abs(prod) && !other; u++) if (prod % u === 0) { if (u + prod / u !== sum && u !== prod / u && u !== -prod / u) other = [u, prod / u]; else if (-u - prod / u !== sum && u !== prod / u && u !== -prod / u) other = [-u, -prod / u]; }
    var near = (p + 1) * (m - 1) !== prod && p + 1 !== 0 && m - 1 !== 0 && p + 1 !== m - 1 ? [p + 1, m - 1] : p - 1 !== 0 && m + 1 !== 0 ? [p - 1, m + 1] : null;
    cands = mixc([c > 1 ? [pre(c) + bin(full), 'not-finished', UNDONE, true] : [fac(1, F1(-p, -m)), 'signs-flipped', '두 수의 부호를 모두 반대로 썼어요. 곱은 맞지만 합의 부호가 반대가 돼요. 두 수를 더해서 가운데 항의 계수가 나오는지 확인해요.']], [
      c > 1 ? [fac(c, F1(-p, -m)), 'signs-flipped', '두 수의 부호를 모두 반대로 썼어요. 곱은 맞지만 합의 부호가 반대가 돼요. 두 수를 더해서 가운데 항의 계수가 나오는지 확인해요.'] : null,
      [fac(c, F1(p, -m)), 'one-sign', '한 수의 부호가 틀렸어요. 두 수의 곱이 끝 항과 부호까지 같은지, 합이 가운데 항의 계수와 같은지 둘 다 확인해요.'],
      other ? [fac(c, F1(other[0], other[1])), 'product-only', '곱은 맞지만 합이 맞지 않는 두 수를 골랐어요. 곱이 되는 쌍은 여러 개예요. 그 가운데 합이 가운데 항의 계수와 같은 쌍을 골라요.'] : null,
      near ? [fac(c, F1(near[0], near[1])), 'sum-only', '합은 맞지만 곱이 맞지 않는 두 수를 골랐어요. 두 수를 곱해서 끝 항이 나오는지도 확인해요.'] : null,
      w ? [fac(c, [[V(1, 'x'), T(p)], [V(1, 'x'), T(m)]]), 'letter-lost', '괄호 안에서 $y$를 빠뜨렸어요. 끝 항에 $y^{2}$이 있으니 두 괄호의 뒤쪽 항에 $y$가 하나씩 들어가야 해요.'] : null,
      c > 1 ? [fac(1, F1(p, m)), 'factor-lost', LOST] : null
    ], q.perm);
    steps = (c > 1 ? [{ say: '세 항에 공통인수 $' + c + '$' + pj(c, '이/가') + ' 있어요. 먼저 묶어 내요.', tex: pre(c) + bin(full) }] : []).concat([
      { say: '곱이 $' + prod + '$, 합이 $' + sum + '$인 두 수는 $' + p + '$' + pj(p, '과/와') + ' $' + m + '$' + pj(m, '이에요/예요') + '.', tex: pre(c) + (c > 1 ? '(' : '') + 'x^{2} + (' + p + ' + ' + par(m) + ')x' + w + ' + (' + par(p) + ' \\times ' + par(m) + ')' + (w ? w + '^{2}' : '') + (c > 1 ? ')' : '') },
      { say: '찾은 두 수를 괄호 안에 하나씩 넣어요.', tex: ans }]);
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps, ok: sum !== 0,
      hints: [XBC, (c > 1 ? '먼저 세 항의 계수가 모두 $' + c + '$' + pj(c, '으로/로') + ' 나누어지는지 봐요. 공통인수를 묶어 내면 괄호 안의 식이 간단해져요. 그 식에서 두 수를 찾아요. ' : '') + (w ? '$y$가 있어도 방법은 같아요. 수만 보고 두 수를 찾은 다음, 괄호 안에서 그 수 뒤에 $y$를 붙여요. ' : '') + '찾을 두 수는 곱이 $' + prod + '$, 합이 $' + sum + '$' + pj(sum, '이에요/예요') + '. ' + (prod > 0 ? '곱이 양수이니 두 수의 부호가 같아요. 합이 ' + (sum > 0 ? '양수이니 둘 다 양수예요.' : '음수이니 둘 다 음수예요.') : '곱이 음수이니 두 수의 부호가 서로 달라요. 합이 ' + (sum > 0 ? '양수이니 크기가 큰 쪽이 양수예요.' : '음수이니 크기가 큰 쪽이 음수예요.')) + ' 곱이 되는 쌍을 차례로 적어 보고 합을 확인해요.',
        '① 공통인수가 있으면 먼저 묶어 내요. ② 곱해서 끝 항이 되는 두 수의 쌍을 모두 적어요. ③ 그 가운데 더해서 가운데 항의 계수가 되는 쌍을 골라 괄호에 넣어요. ' + CHECK] });
  };
  var okXb = function (q) { var p = xbcBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B20.xbc', title: 'x² + bx + c 의 인수분해', ids: ['signs-flipped', 'one-sign', 'product-only', 'sum-only', 'letter-lost', 'not-finished', 'factor-lost'], build: xbcBuild,
    levels: [
      { name: '두 수가 모두 양수', minDistinct: 50, vars: { q: sampler(function (r) { return until(function () { var p = r.int(1, 12), m = r.int(1, 12); return p === m || p * m > 72 ? null : { c: 1, p: p, q: m, v2: '', perm: perm6(r), o: order4(r) }; }, okXb); }) } },
      { name: '음수가 있는 식', minDistinct: 90, vars: { q: sampler(function (r) { return until(function () { var p = nz(r, -9, 9), m = nz(r, -9, 9); return abs(p) === abs(m) || (p > 0 && m > 0) ? null : { c: 1, p: p, q: m, v2: '', perm: perm6(r), o: order4(r) }; }, okXb); }) } },
      { name: '문자가 두 개인 식 · 공통인수를 먼저 묶는 식', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () { var p = nz(r, -7, 7), m = nz(r, -7, 7), two = r.int(0, 1) === 1; return abs(p) === abs(m) ? null : { c: two ? 1 : r.int(2, 5), p: p, q: m, v2: two ? 'y' : '', perm: perm6(r), o: order4(r) }; }, okXb);
        }) } }
    ]
  });

  /* ── B20.axbc ax² + bx + c ─────────────────────── */
  var AX = '$x^{2}$ 앞에 계수가 있으면 한 가지를 더 맞춰야 해요. $(px + q)(rx + s)$를 전개하면 첫 항의 계수는 $p \\times r$, 끝 항은 $q \\times s$, 가운데 항의 계수는 엇갈려 곱한 $ps$와 $qr$의 합이에요. 그래서 첫 항의 계수를 두 수의 곱으로, 끝 항도 두 수의 곱으로 쪼갠 다음, X자로 엇갈려 곱해서 더한 값이 가운데 항의 계수가 되는 조합을 찾아요. 몇 번 시도해 보는 것이 정상이에요.';
  var axBuild = function (q) {
    var p = q.p, a = q.a, s = q.r, b = q.b, x = { x: 1 }, P1 = [T(p, x), T(a)], P2 = [T(s, x), T(b)], full = comb(pmul(P1, P2)), raw = ptex(full), ans = fac(1, [P1, P2]), mid = p * b + a * s, cands;
    var FF = function (p1, a1, s1, b1) { return fac(1, [[T(p1, x), T(a1)], [T(s1, x), T(b1)]]); };
    cands = mixc([[FF(p, b, s, a), 'inner-swapped', '끝 항을 쪼갠 두 수를 서로 바꿔 넣었어요. 첫 항과 끝 항은 맞지만, 엇갈려 곱해서 더한 값이 가운데 항의 계수와 달라요.']], [
      [FF(p, -a, s, -b), 'signs-flipped', '두 수의 부호를 모두 반대로 썼어요. 끝 항은 맞지만 가운데 항의 부호가 반대가 돼요.'],
      [FF(p, a, s, -b), 'one-sign', '한 수의 부호가 틀렸어요. 두 수의 곱이 끝 항과 부호까지 같은지 확인해요.'],
      [FF(1, a, 1, b), 'lead-lost', '$x^{2}$의 계수를 빠뜨렸어요. 두 괄호의 $x$의 계수를 곱하면 처음 식의 $x^{2}$의 계수가 되어야 해요.'],
      [FF(p, b, s, -a), 'swapped-sign', '두 수를 바꿔 넣고 부호도 틀렸어요. 전개해서 세 항이 모두 처음 식과 같은지 확인해요.'],
      p > 1 && s > 1 ? [FF(p * s, a, 1, b), 'lead-unsplit', '$x^{2}$의 계수를 쪼개지 않고 한 괄호에 모두 넣었어요. 이렇게 하면 가운데 항이 맞지 않아요. 다른 쪼개기를 시도해요.'] : [FF(p * s, b, 1, a), 'lead-unsplit', '$x$의 계수를 다른 괄호에 넣었어요. 엇갈려 곱해서 더한 값이 가운데 항의 계수와 같은지 확인해요.']
    ], q.perm);
    return finish({ raw: raw, ans: ans, cands: cands, ok: mid !== 0 && gcd(p, abs(a)) === 1 && gcd(s, abs(b)) === 1,
      steps: [{ say: '$x^{2}$의 계수 $' + p * s + '$' + pj(p * s, '을/를') + ' $' + p + ' \\times ' + s + '$' + pj(s, '으로/로') + ', 끝 항 $' + a * b + '$' + pj(a * b, '을/를') + ' $' + par(a) + ' \\times ' + par(b) + '$' + pj(b, '으로/로') + ' 쪼개요. 엇갈려 곱해서 더하면 가운데 항의 계수가 나와요.', tex: '(' + p + ' \\times ' + s + ')x^{2} + (' + p + ' \\times ' + par(b) + ' + ' + par(a) + ' \\times ' + s + ')x + ' + par(a) + ' \\times ' + par(b) },
        { say: '같은 줄에 놓인 수끼리 한 괄호에 넣어요.', tex: ans }],
      hints: [AX, '이 식에서 $x^{2}$의 계수는 $' + p * s + '$, 끝 항은 $' + a * b + '$, 가운데 항의 계수는 $' + mid + '$' + pj(mid, '이에요/예요') + '. 먼저 $' + p * s + '$' + pj(p * s, '을/를') + ' 두 자연수의 곱으로 쪼개요. 그다음 $' + a * b + '$' + pj(a * b, '을/를') + ' 두 정수의 곱으로 쪼개요(끝 항이 음수이면 두 수의 부호가 달라요). 위아래로 나란히 적고 X자로 엇갈려 곱한 두 값을 더해요. 그 합이 $' + mid + '$' + pj(mid, '이/가') + ' 되면 성공이고, 아니면 수의 자리나 쌍을 바꿔 다시 해 봐요.',
        '① $x^{2}$의 계수를 두 수의 곱으로 쪼개요. ② 끝 항을 두 수의 곱으로 쪼개요. ③ 엇갈려 곱해서 더한 값이 가운데 항의 계수인지 확인해요. 아니면 다른 조합으로 바꿔요. ' + CHECK] });
  };
  var okAx = function (q) { var p = axBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B20.axbc', title: 'ax² + bx + c 의 인수분해', ids: ['inner-swapped', 'signs-flipped', 'one-sign', 'lead-lost', 'swapped-sign', 'lead-unsplit'], build: axBuild,
    levels: [
      { name: 'x² 의 계수가 소수이고 모두 양수', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { var a = r.int(1, 7), b = r.int(1, 7); return { p: r.pick([2, 3, 5]), a: a, r: 1, b: b, perm: perm6(r), o: order4(r) }; }, okAx); }) } },
      { name: '음수가 있는 식', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { var a = nz(r, -7, 7), b = nz(r, -7, 7); return a > 0 && b > 0 ? null : { p: r.pick([2, 3, 5, 7]), a: a, r: 1, b: b, perm: perm6(r), o: order4(r) }; }, okAx); }) } },
      { name: 'x² 의 계수를 쪼개야 하는 식', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { var p = r.int(2, 4), s = r.int(2, 4), a = nz(r, -5, 5), b = nz(r, -5, 5); return p === s && abs(a) === abs(b) ? null : { p: p, a: a, r: s, b: b, perm: perm6(r), o: order4(r) }; }, okAx); }) } }
    ]
  });

  /* ── B20.value 인수분해의 활용 ────────────────────── */
  var VAL1 = '완전제곱식 $a^{2} + 2ab + b^{2}$에는 약속이 있어요. 가운데 항은 반드시 두 항 $a$와 $b$를 곱한 것의 2배예요. 그래서 세 항 가운데 하나가 비어 있어도 나머지 둘로 알아낼 수 있어요. 끝 항이 비었으면 가운데 항에서 $b$를 찾아 제곱하고, 가운데 항이 비었으면 첫 항과 끝 항에서 $a$와 $b$를 찾아 곱한 뒤 2배 해요.';
  var VAL2 = '인수분해는 수의 계산도 쉽게 만들어요. 큰 수를 제곱해서 빼는 대신, 식을 곱셈 꼴로 묶으면 계산하기 쉬운 수가 나타나요. $a^{2} - b^{2} = (a + b)(a - b)$를 쓰면 제곱 두 번이 덧셈 한 번, 뺄셈 한 번, 곱셈 한 번으로 바뀌어요. $a^{2} + 2ab + b^{2} = (a + b)^{2}$을 쓰면 세 항이 제곱 한 번으로 줄어요.';
  var valBuild = function (q) {
    var p = q.p, k = q.k, s = q.s, tex, text, ans, wrong = {}, steps, hints, a, b, lead = (p === 1 ? '' : p * p) + 'x^{2}', px = (p === 1 ? '' : p) + 'x', sg = s < 0 ? ' - ' : ' + ';
    var LAST = '① 식이 어떤 공식의 꼴인지 살펴봐요. ② 공식의 $a$와 $b$ 자리에 오는 것을 찾아요. ③ 공식에 맞춰 묶거나 빈칸을 채워요. ④ 계산한 뒤 처음 식에 넣어 맞는지 확인해요.';
    if (q.kind === 'const') {
      ans = k * k; tex = lead + sg + 2 * p * k + 'x + \\square'; text = '위 식이 완전제곱식이 되도록 $\\square$ 안에 알맞은 수를 구하세요.';
      wrong['half-only'] = p * k; wrong['not-squared'] = k; wrong['middle-squared'] = 4 * p * p * k * k;
      steps = [{ say: '가운데 항을 (2) × (첫 항의 뿌리) × (어떤 수)로 써요.', tex: 2 * p * k + 'x = 2 \\times ' + px + ' \\times ' + k }, { say: '그 수가 $b$예요. 완전제곱식의 끝 항은 $b$의 제곱이에요.', tex: '(' + px + sg + k + ')^{2} = ' + lead + sg + 2 * p * k + 'x + ' + k + '^{2}' }, { say: '제곱을 계산해요.', tex: String(ans) }];
      hints = [VAL1, '첫 항 $' + lead + '$' + '은 $' + px + '$의 제곱이에요. 그러니 $a$ 자리에 오는 것은 $' + px + '$예요. 가운데 항 $' + 2 * p * k + 'x$는 $2 \\times ' + px + ' \\times b$와 같아야 해요. 이 식에서 $b$가 얼마인지 찾아요. 가운데 항의 계수를 $2$로 ' + (p > 1 ? '나누고, 다시 $' + p + '$' + pj(p, '으로/로') + ' 나누면' : '나누면') + ' 돼요. 빈칸에는 $b$ 자체가 아니라 $b$를 제곱한 수가 들어가요.', LAST];
    } else if (q.kind === 'mid') {
      ans = 2 * p * k; tex = lead + ' + \\square x + ' + k * k; text = '위 식이 완전제곱식이 되도록 $\\square$ 안에 알맞은 양수를 구하세요.';
      wrong['no-double'] = p * k; wrong['squared-kept'] = k * k; wrong['root-only'] = k; wrong['roots-added'] = p + k;
      steps = [{ say: '첫 항과 끝 항이 각각 무엇의 제곱인지 찾아서 완전제곱식을 세워요.', tex: '(' + px + ' + ' + k + ')^{2} = ' + (p === 1 ? 'x^{2}' : '(' + px + ')^{2}') + ' + 2 \\times ' + px + ' \\times ' + k + ' + ' + k + '^{2}' }, { say: '가운데 항을 계산해요.', tex: '2 \\times ' + px + ' \\times ' + k + ' = ' + ans + 'x' }, { say: '$x$ 앞의 수가 빈칸에 들어가요.', tex: String(ans) }];
      hints = [VAL1, '첫 항 $' + lead + '$' + '은 $' + px + '$의 제곱이에요. 끝 항 $' + k * k + '$' + pj(k * k, '은/는') + ' 어떤 자연수의 제곱이에요. 그 자연수를 찾아요. 그러면 $a$와 $b$가 모두 정해져요. 가운데 항은 이 둘을 곱한 것의 2배예요. 곱하기만 하고 2배를 빠뜨리거나, 끝 항을 그대로 쓰지 않도록 조심해요.', LAST];
    } else if (q.kind === 'diff') {
      a = q.S / 2 + k; b = q.S / 2 - k; ans = q.S * 2 * k; tex = a + '^{2} - ' + b + '^{2}'; text = '인수분해 공식을 이용하여 계산하세요.';
      wrong['diff-squared'] = 4 * k * k; wrong.added = q.S + 2 * k; wrong['sum-only'] = q.S; wrong['sum-squared'] = q.S * q.S;
      steps = [{ say: '제곱의 차이니 합과 차의 곱으로 묶어요.', tex: tex + ' = (' + a + ' + ' + b + ')(' + a + ' - ' + b + ')' }, { say: '괄호 안을 각각 계산해요.', tex: q.S + ' \\times ' + 2 * k }, { say: '곱셈을 계산해요.', tex: String(ans) }];
      hints = [VAL2, '두 수 $' + a + '$' + pj(a, '과/와') + ' $' + b + '$' + pj(b, '을/를') + ' 따로 제곱하면 계산이 길어져요. 제곱의 차 공식으로 묶어요. 두 수를 더한 값과 두 수를 뺀 값을 구해서 곱하면 돼요. 이 문제는 두 수를 더하면 계산하기 좋은 수가 나오도록 되어 있어요. 더한 값과 뺀 값을 다시 더하는 것이 아니라 곱한다는 점에 주의해요.', LAST];
    } else {
      /* a² ± 2·a·k + k² = (a ± k)² = B² */
      a = q.B - s * k; ans = q.B * q.B; tex = a + '^{2}' + sg + '2 \\times ' + a + ' \\times ' + k + ' + ' + k + '^{2}'; text = '인수분해 공식을 이용하여 계산하세요.';
      wrong['base-only'] = q.B; wrong.doubled = 2 * q.B; wrong['sign-wrong'] = (a - s * k) * (a - s * k); wrong['no-middle'] = a * a + k * k;
      steps = [{ say: '세 항이 완전제곱식의 꼴이에요. 한 번에 묶어요.', tex: tex + ' = (' + a + sg + k + ')^{2}' }, { say: '괄호 안을 계산해요.', tex: q.B + '^{2}' }, { say: '제곱을 계산해요.', tex: String(ans) }];
      hints = [VAL2, '세 항을 하나씩 계산하지 않아도 돼요. 첫 항은 $' + a + '$의 제곱, 끝 항은 $' + k + '$의 제곱이고, 가운데 항은 그 두 수를 곱한 것의 2배예요. 완전제곱식의 모양 그대로예요. 그러니 두 수를 ' + (s < 0 ? '뺀' : '더한') + ' 값을 괄호에 넣고 제곱하면 돼요. 괄호 안을 먼저 계산하면 제곱하기 쉬운 수가 나와요. 가운데 항의 부호를 보고 더할지 뺄지 정해요.', LAST];
    }
    return { tex: tex, text: text, ans: ans, wrong: wrong, steps: steps, hints: hints, check: true };
  };
  var okV = function (q) { var p = valBuild(q); return p.ans >= 1; };
  numQ({
    id: 'B20.value', title: '인수분해의 활용', kind: 'int', build: valBuild,
    mistakes: [['half-only', '가운데 항의 계수를 반으로 나누기만 했어요. 그 수에서 $b$를 찾은 다음 제곱해야 끝 항이 돼요.'],
      ['not-squared', '$b$를 찾고 제곱하지 않았어요. 완전제곱식의 끝 항은 $b$가 아니라 $b$의 제곱이에요.'],
      ['middle-squared', '가운데 항의 계수를 그대로 제곱했어요. 먼저 2로 나눠서(첫 항에 계수가 있으면 그 뿌리로도 나눠서) $b$를 찾은 다음 제곱해요.'],
      ['no-double', '두 수를 곱하기만 하고 2배를 하지 않았어요. 완전제곱식의 가운데 항은 두 항을 곱한 것의 2배예요.'],
      ['squared-kept', '끝 항을 그대로 답했어요. 끝 항이 어떤 수의 제곱인지 찾아서, 그 수로 가운데 항을 만들어요.'],
      ['root-only', '끝 항의 뿌리만 답했어요. 가운데 항은 첫 항의 뿌리와 끝 항의 뿌리를 곱한 것의 2배예요.'],
      ['roots-added', '두 수를 더했어요. 가운데 항은 두 수를 더한 것이 아니라 곱한 것의 2배예요.'],
      ['diff-squared', '두 수의 차를 제곱했어요. 제곱의 차는 차의 제곱과 달라요. 합과 차를 곱해야 해요.'],
      ['added', '합과 차를 더했어요. 두 괄호는 곱셈으로 이어져 있으니 곱해요.'],
      ['sum-only', '두 수의 합만 구했어요. 합에 두 수의 차를 곱해야 해요.'],
      ['sum-squared', '두 수의 합을 제곱했어요. 제곱의 차는 합과 차의 곱이에요. 합을 두 번 곱하는 것이 아니에요.'],
      ['base-only', '괄호 안만 계산하고 제곱하지 않았어요. 묶은 식은 제곱 꼴이니 한 번 더 곱해요.'],
      ['doubled', '제곱하지 않고 2배 했어요. 제곱은 같은 수를 두 번 곱하는 것이에요.'],
      ['sign-wrong', '괄호 안의 부호를 반대로 썼어요. 가운데 항이 더하기이면 두 수를 더하고, 빼기이면 빼요.'],
      ['no-middle', '가운데 항을 빼고 계산했어요. 세 항을 모두 써서 완전제곱식으로 묶어요.']],
    levels: [
      { name: '완전제곱식이 되게 하는 끝 항', minDistinct: 40, vars: { q: sampler(function (r) { return until(function () { var p = r.pick([1, 1, 1, 2, 3]), k = r.int(2, 15); return gcd(p, k) !== 1 ? null : { kind: 'const', p: p, k: k, s: pm(r, 1) }; }, okV); }) } },
      { name: '완전제곱식이 되게 하는 가운데 항', minDistinct: 30, vars: { q: sampler(function (r) { return until(function () { var p = r.pick([1, 1, 2, 3, 4, 5]), k = r.int(2, 15); return gcd(p, k) !== 1 ? null : { kind: 'mid', p: p, k: k, s: 1 }; }, okV); }) } },
      { name: '수의 계산', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () {
            var k = r.int(1, 9);
            if (r.int(0, 1)) return { kind: 'diff', S: r.pick([20, 40, 60, 80, 100, 200]), k: k, p: 1, s: 1 };
            return { kind: 'sq3', B: r.pick([20, 30, 40, 50, 60, 70, 80, 90, 100, 200]), k: k, p: 1, s: pm(r, 1) };
          }, okV);
        }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B20', [
  { title: '인수분해: 전개를 거꾸로', body: [
    '다항식을 여러 식의 곱으로 나타내는 것을 인수분해라고 해요. 곱해진 식 하나하나를 인수라고 해요.',
    { tex: 'x^{2} + 5x + 6 \\;\\xrightarrow{\\text{인수분해}}\\; (x + 2)(x + 3)' },
    '전개는 괄호를 푸는 것, 인수분해는 다시 괄호로 묶는 것이에요. 12를 $2^{2} \\times 3$으로 소인수분해하던 것과 같은 생각이에요.',
    '인수분해한 식을 전개하면 처음 식이 나와요. 그래서 언제든 검산할 수 있어요.'
  ] },
  { title: '공통인수로 묶기', body: [
    '모든 항에 공통으로 들어 있는 인수를 괄호 앞으로 묶어 내요. 인수분해에서 가장 먼저 하는 일이에요.',
    { tex: 'ma + mb = m(a + b)' },
    { ex: [['6x + 9 = 3(2x + 3)', '계수의 최대공약수 3'], ['x^{2} + 3x = x(x + 3)', '공통인 문자 $x$'], ['2ab + 2a = 2a(b + 1)', '자기 자신을 묶으면 1이 남아요']] }
  ] },
  { title: '공식으로 묶기', body: [
    '곱셈 공식을 거꾸로 쓰면 인수분해 공식이 돼요.',
    { tex: 'a^{2} + 2ab + b^{2} = (a + b)^{2}' },
    { tex: 'a^{2} - 2ab + b^{2} = (a - b)^{2}' },
    { tex: 'a^{2} - b^{2} = (a + b)(a - b)' },
    '항이 세 개이고 양 끝이 제곱이면 완전제곱식, 항이 두 개이고 제곱끼리의 뺄셈이면 제곱의 차예요.',
    { ex: [['x^{2} + 6x + 9 = (x + 3)^{2}', '$6x = 2 \\times x \\times 3$'], ['4x^{2} - 25 = (2x + 5)(2x - 5)', '$(2x)^{2} - 5^{2}$']] }
  ] },
  { title: 'x² + bx + c: 합과 곱 퍼즐', body: [
    '곱해서 상수항, 더해서 $x$의 계수가 되는 두 수를 찾아요.',
    { tex: 'x^{2} + (p + q)x + pq = (x + p)(x + q)' },
    { ex: [['x^{2} + 7x + 10 = (x + 2)(x + 5)', '곱 10, 합 7'], ['x^{2} - x - 12 = (x + 3)(x - 4)', '곱 $-12$, 합 $-1$']] },
    '곱이 양수이면 두 수의 부호가 같고, 곱이 음수이면 부호가 달라요.'
  ] },
  { title: 'ax² + bx + c: 엇갈려 곱하기', body: [
    '$x^{2}$의 계수와 상수항을 각각 두 수의 곱으로 쪼개고, 엇갈려 곱해서 더한 값이 $x$의 계수가 되는 조합을 찾아요.',
    { tex: '2x^{2} + 7x + 3 = (2x + 1)(x + 3)' },
    '$2 = 2 \\times 1$, $3 = 1 \\times 3$으로 쪼개면 엇갈린 곱은 $2 \\times 3 = 6$과 $1 \\times 1 = 1$이고, 더하면 7이에요.',
    '한 번에 안 맞으면 수의 자리를 바꿔 다시 해 봐요. 공통인수가 있으면 언제나 그것부터 묶어요.'
  ] }
]);
