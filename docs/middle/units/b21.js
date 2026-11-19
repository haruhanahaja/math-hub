/* B21 이차방정식 — 인수분해 · 제곱근 · 완전제곱식 풀이, 근의 공식, 활용
   유형(쉬운 것부터): B21.root 한 근이 주어진 이차방정식(키패드, 부호 있는 정수) · B21.factor 인수분해로 풀기 · B21.sqrt 제곱근으로 풀기
                     · B21.complete 완전제곱식으로 풀기 · B21.formula 근의 공식 (보기 고르기) · B21.apply 이차방정식의 활용(키패드, 자연수)
   답이 해(x = … 또는 x = …)이면 보기 고르기, 답이 수 하나이면 키패드다.
   해는 { tex, key } 로 다룬다. 유리수인 두 근(RS), 중근(rDbl), (m ± k√n) / d 꼴(IR). key 가 같으면 같은 해다.
   IR 는 근호 안의 제곱수를 꺼내고 약분해서 가장 간단한 꼴로 쓴다. 계산은 모두 정수로 한다(부동소수점을 쓰지 않는다).
   검산(solves): 유리수 근은 방정식에 넣어 0 이 되는지, 무리수 근은 두 근의 합 −b/a · 곱 c/a 가 맞는지 정수 계산으로 본다.
   틀린 보기는 어느 것도 방정식의 해 전체가 아니어야 한다. 단, '끝까지 간단히 하지 않은 해'(not-reduced)는 값이 답과 같고 글자만 다르다. */
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
  /** 틀린 보기 후보의 차례: first 는 늘 앞에, rest 는 문제마다 섞은 차례(perm)로 */
  var mixc = function (first, rest, perm) {
    return first.concat(rest.map(function (c, i) { return [perm[i % perm.length], i, c]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }).map(function (x) { return x[2]; }));
  };
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B21', version: 1, title: o.title,
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
  /* ── 틀: 수 하나(키패드). o.kind: 'int'(자연수) | 'signed'(부호 있는 정수)
     build(q) → { text, tex, ans: 정수, hints, steps, wrong: { 실수 id: 정수 }, check } ── */
  var numQ = function (o) {
    var lastQ = null, lastP = null, S = o.kind === 'signed';
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (n) { return S ? { n: n, p: 0 } : n; };
    var leak = function (p) { var a = String(p.ans); return p.ans > (S ? 0 : 19) && nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && (S ? p.ans !== 0 : p.ans >= 1) && p.check === true && !leak(p); }; });
    MH.defineType({
      id: o.id, unit: 'B21', version: 1, title: o.title,
      answer: { kind: o.kind },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; return out; },
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

  /** 괄호 앞에 쓰는 것: 수 1 은 쓰지 않는다. 2, 2xy, x … */
  var pre = function (c) { if (typeof c === 'number') return c === 1 ? '' : c === -1 ? '-' : String(c); return key(c.e) === '' && c.c === 1 ? '' : one(c); };
  /** 인수분해한 꼴을 쓴다: 2(x + 3)(x - 3), (x + 3)^{2}. 같은 괄호가 잇달아 나오면 제곱으로 쓴다 */
  var fac = function (c, list) {
    var t = list.map(bin), out = '', i;
    for (i = 0; i < t.length; i++) { if (t[i] === t[i + 1]) { out += t[i] + '^{2}'; i++; } else out += t[i]; }
    return pre(c) + out;
  };
  var gcd = MH.gcd, X1 = { x: 1 }, X2 = { x: 2 };
  /** n = k² × m (m 은 제곱인수가 없다) → [k, m] */
  var sfree = function (n) { var k = 1, m = n, i; for (i = 2; i * i <= m; i++) while (m % (i * i) === 0) { m /= i * i; k *= i; } return [k, m]; };
  var rat = function (n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(abs(n), d) || 1; return { n: n / g, d: d / g }; };
  var fr = function (r) { return r.d === 1 ? String(r.n) : (r.n < 0 ? '-' : '') + '\\dfrac{' + abs(r.n) + '}{' + r.d + '}'; };
  var rk = function (r) { return r.n + '/' + r.d; };
  var OR = ' \\text{ 또는 } ';
  /** 이차식 A x² + B x + C 를 쓴다 */
  var quad = function (a, b, c) { return ptex([T(a, X2), T(b, X1), T(c)].filter(function (t) { return t.c !== 0; })); };

  /* ── 해(보기): { tex, key, ... }. key 가 같으면 같은 해다 ── */
  /** 유리수인 두 근. 두 근이 r, −r 이면 x = ±r 로 쓴다 */
  var RS = function (r1, r2) {
    var a = r1, b = r2, t;
    if (a.n * b.d > b.n * a.d) { t = a; a = b; b = t; }
    if (a.n === b.n && a.d === b.d) return rDbl(a);
    return { tex: a.n === -b.n && a.d === b.d ? 'x = \\pm ' + fr(b) : 'x = ' + fr(a) + OR + 'x = ' + fr(b), key: 'R:' + rk(a) + ',' + rk(b), rs: [a, b] };
  };
  var rOne = function (r) { return { tex: 'x = ' + fr(r), key: 'S:' + rk(r) }; };
  var rDbl = function (r) { return { tex: 'x = ' + fr(r) + ' \\text{ (중근)}', key: 'D:' + rk(r), rs: [r, r] }; };
  var I = function (n) { return { n: n, d: 1 }; };
  /** (m ± k√n) / d. 근호 안의 제곱수를 꺼내고 약분한다. n 이 제곱수이면 유리수인 두 근이 된다. plus 이면 + 쪽 하나만 */
  var IR = function (m, k, n, d, plus) {
    var f, g, core, root;
    if (n <= 0 || k === 0) return null;
    f = sfree(n); k = abs(k) * f[0]; n = f[1];
    if (d < 0) { d = -d; m = -m; }
    if (n === 1) return plus ? rOne(rat(m + k, d)) : RS(rat(m + k, d), rat(m - k, d));
    g = gcd(gcd(abs(m), k), d); m /= g; k /= g; d /= g;
    root = (k === 1 ? '' : k) + '\\sqrt{' + n + '}';
    core = plus ? (m ? m + ' + ' : '') + root : (m ? m + ' \\pm ' : '\\pm ') + root;
    return { tex: 'x = ' + (d === 1 ? core : m === 0 && !plus ? '\\pm \\dfrac{' + root + '}{' + d + '}' : '\\dfrac{' + core + '}{' + d + '}'), key: 'I:' + [m, k, n, d, plus ? '+' : '±'].join(','), ir: plus ? null : [m, k, n, d] };
  };
  /** 해 s 가 A x² + B x + C = 0 의 해 전체인가(정수 계산) */
  var solves = function (s, A, B, C) {
    var z = function (r) { return A * r.n * r.n + B * r.n * r.d + C * r.d * r.d === 0; };
    if (!s) return false;
    if (s.rs) return z(s.rs[0]) && z(s.rs[1]) && (s.key.charAt(0) === 'D') === (B * B - 4 * A * C === 0);
    if (s.ir) return A * 2 * s.ir[0] + B * s.ir[3] === 0 && A * (s.ir[0] * s.ir[0] - s.ir[1] * s.ir[1] * s.ir[2]) - C * s.ir[3] * s.ir[3] === 0;
    return false;
  };
  /** 보기 고르기 문제를 마무리한다. 후보: [해, 실수 id, 설명, 값이 같아도 되는가(덜 정리한 꼴)] */
  var finish = function (o) {
    var keys = [o.ans.key], texs = [o.ans.tex], wrong = [];
    o.cands.forEach(function (c) {
      var s;
      if (!c || !c[0] || wrong.length >= 3 || wrong.some(function (w) { return w[1] === c[1]; })) return;
      s = c[0];
      if (s.tex.length > 40 || texs.indexOf(s.tex) >= 0 || (c[3] ? s.key !== o.ans.key : keys.indexOf(s.key) >= 0)) return;
      keys.push(s.key); texs.push(s.tex); wrong.push([s.tex, c[1], c[2]]);
    });
    return { tex: o.raw, text: o.text || '다음 이차방정식을 푸세요.', ans: o.ans.tex, wrong: wrong, hints: o.hints, steps: o.steps,
      check: wrong.length === 3 && o.ans.tex.length <= 40 && o.ok !== false && (o.eq ? solves(o.ans, o.eq[0], o.eq[1], o.eq[2]) && !o.cands.some(function (c) { return c && c[0] && !c[3] && c[0].key !== o.ans.key && solves(c[0], o.eq[0], o.eq[1], o.eq[2]); }) : true) };
  };
  var CHK = '④ 구한 해를 처음 방정식에 넣어 등식이 맞는지 확인해요.';

  /* ── B21.root 한 근이 주어진 이차방정식 ───────────────── */
  var KEY = '방정식의 해(근)는 그 방정식을 참으로 만드는 $x$의 값이에요. 자물쇠에 딱 맞는 열쇠와 같아요. 열쇠를 자물쇠에 꽂으면 열리듯이, 근을 $x$ 자리에 넣으면 등식이 반드시 성립해요. 그래서 "한 근이 주어졌다"는 말은 "그 수를 $x$ 자리에 넣어도 된다"는 뜻이에요. 넣고 나면 모르는 상수만 남은 쉬운 방정식이 돼요.';
  var rootBuild = function (q) {
    var r = q.r, s = q.s, b = -(r + s), c = r * s, tex, text, ans, wrong = {}, steps, h2, plug = par(r) + '^{2}';
    if (q.kind === 'a-mid') {
      tex = 'x^{2} + ax' + (c < 0 ? ' - ' : ' + ') + abs(c) + ' = 0'; ans = b; text = '위 이차방정식의 한 근이 $x = ' + r + '$일 때, 상수 $a$의 값을 구하세요.';
      wrong['not-divided'] = -(r * r + c); wrong['square-sign'] = r < 0 ? (r * r - c) % r === 0 ? (r * r - c) / r : null : null; wrong['other-root'] = s; wrong['root-copied'] = r;
      steps = [{ say: '$x$ 자리에 $' + r + '$' + pj(r, '을/를') + ' 넣어요. 음수는 괄호를 쳐서 넣어요.', tex: plug + ' + a \\times ' + par(r) + (c < 0 ? ' - ' : ' + ') + abs(c) + ' = 0' }, { say: '수끼리 계산해요.', tex: poly([[r, 'a'], [r * r + c, '']]) + ' = 0' }, { say: '$a$가 든 항만 남기고 나눠요.', tex: 'a = ' + ans }];
      h2 = '$x$가 있는 자리마다 $' + r + '$' + pj(r, '을/를') + ' 넣어요. $x^{2}$ 자리에는 $' + r + '$의 제곱이, $ax$ 자리에는 $a$에 $' + r + '$' + pj(r, '을/를') + ' 곱한 것이 들어가요.' + (r < 0 ? ' 음수를 제곱하면 양수가 된다는 점을 조심해요.' : '') + ' 그러면 $a$만 모르는 일차방정식이 돼요. 수끼리 먼저 계산하고, $a$가 든 항만 한쪽에 남긴 다음 $a$ 앞의 수로 나눠요.';
    } else if (q.kind === 'a-const') {
      tex = quad(1, b, 0) + ' + a = 0'; ans = c; text = '위 이차방정식의 한 근이 $x = ' + r + '$일 때, 상수 $a$의 값을 구하세요.';
      wrong['square-sign'] = r < 0 ? r * r - b * r : null; wrong['other-root'] = s; wrong['root-copied'] = r; wrong['half-plugged'] = -(r * r) - b;
      steps = [{ say: '$x$ 자리에 $' + r + '$' + pj(r, '을/를') + ' 넣어요. 음수는 괄호를 쳐서 넣어요.', tex: plug + (b < 0 ? ' - ' : ' + ') + abs(b) + ' \\times ' + par(r) + ' + a = 0' }, { say: '수끼리 계산해요.', tex: poly([[r * r + b * r, ''], [1, 'a']]) + ' = 0' }, { say: '수를 반대쪽으로 옮겨요. 부호가 바뀌어요.', tex: 'a = ' + ans }];
      h2 = '$x$가 있는 자리마다 $' + r + '$' + pj(r, '을/를') + ' 넣어요. $x^{2}$ 자리와 $x$ 자리 두 곳 모두에 넣어야 해요.' + (r < 0 ? ' 음수를 제곱하면 양수가 되고, 음수에 수를 곱할 때는 부호를 따져요.' : '') + ' 넣고 나면 수 두 개와 $a$만 남아요. 수끼리 계산한 다음, 그 수를 등호 반대쪽으로 옮기면 $a$의 값이 나와요. 옮길 때 부호가 바뀌는 것을 잊지 않아요.';
    } else {
      tex = 'x^{2} + ax' + (c < 0 ? ' - ' : ' + ') + abs(c) + ' = 0'; ans = s; text = '위 이차방정식의 한 근이 $x = ' + r + '$일 때, 다른 한 근을 구하세요. ($a$는 상수)';
      wrong['constant-a'] = b; wrong['root-negated'] = -r; wrong['sum-used'] = c - r;
      steps = [{ say: '먼저 $x$ 자리에 $' + r + '$' + pj(r, '을/를') + ' 넣어 $a$를 구해요.', tex: plug + ' + a \\times ' + par(r) + (c < 0 ? ' - ' : ' + ') + abs(c) + ' = 0,\\quad a = ' + b }, { say: '구한 $a$를 넣은 방정식을 인수분해해요.', tex: quad(1, b, c) + ' = 0,\\quad ' + bin([T(1, X1), T(-r)]) + bin([T(1, X1), T(-s)]) + ' = 0' }, { say: '주어진 근이 아닌 나머지 근이 답이에요.', tex: 'x = ' + s }];
      h2 = '두 걸음으로 풀어요. 먼저 $x$ 자리에 $' + r + '$' + pj(r, '을/를') + ' 넣어서 $a$의 값을 구해요. 그다음 그 $a$를 방정식에 넣으면 문자가 $x$뿐인 이차방정식이 돼요. 그 방정식을 인수분해하면 근이 두 개 나오는데, 하나는 이미 주어진 근이에요. 나머지 하나가 답이에요. $a$의 값을 답으로 쓰지 않도록 조심해요.';
    }
    var ws = []; Object.keys(wrong).forEach(function (id) { var w = wrong[id]; if (w !== null && w !== 0 && abs(w) !== abs(ans) && ws.indexOf(w) < 0) ws.push(w); });
    return { tex: tex, text: text, ans: ans, wrong: wrong, steps: steps, check: ws.length >= 2,
      hints: [KEY, h2, '① 주어진 근을 $x$ 자리에 모두 넣어요(음수는 괄호). ② 제곱과 곱셈을 먼저 계산해요. ③ 모르는 상수만 남은 방정식을 풀어요. ④ 문제에서 묻는 것이 상수인지 다른 근인지 확인하고 답해요.'] };
  };
  var rs2 = function (r) { var a, b; do { a = nz(r, -9, 9); b = nz(r, -9, 9); } while (a === b || a + b === 0 || abs(a) === 1); return { r: a, s: b }; };
  numQ({
    id: 'B21.root', title: '한 근이 주어진 이차방정식', kind: 'signed', build: rootBuild,
    mistakes: [['not-divided', '$a$ 앞에 곱해진 수로 나누지 않았어요. $a$에 근이 곱해져 있으니, 마지막에 그 수로 나눠야 해요.'],
      ['square-sign', '음수를 제곱할 때 부호가 틀렸어요. 음수를 제곱하면 양수예요. 괄호를 쳐서 넣으면 실수가 줄어요.'],
      ['other-root', '다른 한 근을 답했어요. 문제에서 묻는 것은 상수 $a$의 값이에요.'],
      ['root-copied', '주어진 근을 그대로 답했어요. 근을 $x$ 자리에 넣어서 $a$에 대한 식을 만들어 풀어야 해요.'],
      ['half-plugged', '$x^{2}$ 자리에만 근을 넣고 $x$ 자리에는 넣지 않았어요. $x$가 있는 곳마다 모두 넣어요.'],
      ['constant-a', '상수 $a$의 값을 답했어요. $a$는 맞게 구했을 수 있어요. 문제에서 묻는 것은 다른 한 근이에요.'],
      ['root-negated', '주어진 근의 부호만 바꿔 답했어요. 다른 근은 방정식을 다시 풀어야 알 수 있어요.'],
      ['sum-used', '상수항에서 주어진 근을 뺐어요. 두 근을 곱한 것이 상수항이에요. 방정식을 인수분해해서 구해요.']],
    levels: [
      { name: 'x 의 계수 구하기', minDistinct: 80, vars: { q: sampler(function (r) { var q = rs2(r); q.kind = 'a-mid'; return q; }) } },
      { name: '상수항 구하기', minDistinct: 80, vars: { q: sampler(function (r) { var q = rs2(r); q.kind = 'a-const'; return q; }) } },
      { name: '다른 한 근 구하기', minDistinct: 80, vars: { q: sampler(function (r) { var q = rs2(r); q.kind = 'other'; return q; }) } }
    ]
  });

  /* ── B21.factor 인수분해로 풀기 ───────────────────── */
  var ZERO = '두 수를 곱해서 0이 되려면 둘 가운데 적어도 하나는 0이어야 해요. 0이 아닌 수끼리는 아무리 곱해도 0이 안 되니까요. 그래서 $AB = 0$이면 $A = 0$ 또는 $B = 0$이에요. 이차방정식을 (일차식) × (일차식) = 0 꼴로 인수분해하면, 괄호 하나하나를 0으로 놓고 일차방정식 두 개를 풀면 돼요. 그래서 해가 보통 두 개예요.';
  var facBuild = function (q) {
    var P1, P2, r1, r2, raw, ans, cands, steps, eq, full, h2, k = q.kind, u, other = null, S, Pd;
    var W_KEEP = '괄호 안의 수를 부호 그대로 읽었어요. 괄호를 0으로 만드는 값이 해예요. $x - 2 = 0$이면 $x = 2$, $x + 3 = 0$이면 $x = -3$처럼 부호가 반대가 돼요.';
    var W_ONE = '해를 하나만 구했어요. 괄호가 두 개이니, 각 괄호를 0으로 만드는 값을 모두 구해요.';
    if (k === 'dbl') {
      P1 = P2 = [T(1, X1), T(-q.h)]; r1 = r2 = I(q.h); full = [1, -2 * q.h, q.h * q.h]; raw = quad(1, -2 * q.h, q.h * q.h) + ' = 0'; ans = rDbl(r1);
      cands = mixc([[RS(I(q.h), I(-q.h)), 'plus-minus', '해를 ± 로 썼어요. 완전제곱식이면 두 괄호가 똑같아서 해가 하나로 겹쳐요. 이런 해를 중근이라고 해요.']], [
        [rDbl(I(-q.h)), 'signs-kept', W_KEEP], abs(q.h) > 1 ? [rDbl(I(q.h * q.h)), 'not-rooted', '상수항을 그대로 해로 썼어요. 상수항은 괄호 안의 수를 제곱한 것이에요. 괄호 안의 수를 찾아요.'] : null,
        [rDbl(I(2 * q.h)), 'middle-used', '가운데 항의 계수를 해로 썼어요. 가운데 항은 괄호 안의 수의 2배예요. 절반을 따져요.'], [rDbl(I(-2 * q.h)), 'middle-kept', '가운데 항의 계수를 그대로 썼어요. 완전제곱식으로 인수분해한 다음 괄호를 0으로 만드는 값을 찾아요.']], q.perm);
      steps = [{ say: '왼쪽이 완전제곱식이에요. 인수분해해요.', tex: fac(1, [P1, P2]) + ' = 0' }, { say: '괄호 안이 0이 되는 값을 찾아요. 두 괄호가 같아서 해가 하나로 겹쳐요(중근).', tex: ans.tex }];
      h2 = '왼쪽의 세 항을 살펴봐요. 첫 항과 끝 항이 제곱이고, 가운데 항이 그 둘을 곱한 것의 2배예요. 그러니 완전제곱식으로 인수분해돼요. (식)$^{2} = 0$ 꼴이 되면 괄호 안의 식이 0이어야 해요. 똑같은 괄호가 두 번 곱해진 것이라서 두 해가 같아요. 이런 해를 중근이라고 불러요.';
    } else {
      if (k === 'prod') { P1 = q.P1; P2 = q.P2; } else if (k === 'lead') { P1 = [T(q.p, X1), T(q.a)]; P2 = [T(q.r, X1), T(q.b)]; } else { P1 = [T(1, X1), T(-q.r1)]; P2 = [T(1, X1), T(-q.r2)]; }
      r1 = rat(-(P1[1] ? P1[1].c : 0), P1[0].c); r2 = rat(-(P2[1] ? P2[1].c : 0), P2[0].c);
      u = comb(pmul(P1, P2)); full = [0, 0, 0]; u.forEach(function (t) { full[t.e.x === 2 ? 0 : t.e.x === 1 ? 1 : 2] = t.c; });
      S = -full[1]; Pd = full[2];
      var facTex = (P1.length === 1 ? one(P1[0]) : bin(P1)) + bin(P2);
      raw = k === 'prod' ? facTex + ' = 0' : k === 'arr' ? (q.form ? quad(1, -S, 0) + ' = ' + (-Pd) : 'x^{2} = ' + ptex([T(S, X1), T(-Pd)])) : quad(full[0], full[1], full[2]) + ' = 0';
      ans = RS(r1, r2);
      if (k === 'std' || k === 'arr') for (u = 1; u <= abs(Pd) && !other; u++) if (Pd % u === 0 && u !== Pd / u && u !== -Pd / u) { if (u + Pd / u !== S && u + Pd / u !== -S) other = [u, Pd / u]; else if (-u - Pd / u !== S && u + Pd / u !== S) other = [-u, -Pd / u]; }
      cands = mixc([[RS(rat(-r1.n, r1.d), rat(-r2.n, r2.d)), 'signs-kept', W_KEEP]], [
        r2.n !== 0 && r1.n !== 0 ? [RS(r1, rat(-r2.n, r2.d)), 'one-sign', '한 해의 부호가 틀렸어요. 괄호마다 따로 0으로 놓고 풀어요. 부호를 하나씩 확인해요.'] : null,
        [rOne(r1.n === 0 ? r2 : r2.n === 0 ? r1 : r1), 'one-only', r1.n === 0 || r2.n === 0 ? '$x = 0$을 빠뜨렸어요. 앞에 곱해진 $x$도 인수예요. $x = 0$일 때도 곱이 0이 돼요.' : W_ONE],
        P1[0].c > 1 || P2[0].c > 1 ? [RS(I(-(P1[1] ? P1[1].c : 0)), I(-P2[1].c)), 'coef-ignored', '$x$ 앞의 계수로 나누지 않았어요. $2x - 1 = 0$이면 $2x = 1$이고, 양쪽을 2로 나눠야 $x$의 값이 나와요.'] : null,
        other ? [RS(I(other[0]), I(other[1])), 'product-only', '곱은 맞지만 합이 맞지 않는 두 수로 인수분해했어요. 전개해서 가운데 항이 맞는지 확인해요.'] : null,
        k === 'arr' ? [RS(I(S), I(-Pd)), 'not-arranged', '한쪽을 0으로 만들지 않고 식에 보이는 수를 그대로 읽었어요. 먼저 모든 항을 왼쪽으로 옮겨 (식) = 0 꼴로 정리해요.'] : null,
        r1.d > 1 || r2.d > 1 ? [RS(r1.d > 1 ? rat(r1.d, r1.n || 1) : r1, r2.d > 1 ? rat(r2.d, r2.n || 1) : r2), 'inverted', '분자와 분모를 뒤바꿨어요. $2x = 1$이면 양쪽을 $x$ 앞의 수 2로 나누니, 2가 분모로 가요.'] : null
      ], q.perm);
      steps = (k === 'arr' ? [{ say: '모든 항을 왼쪽으로 옮겨 (식) = 0 꼴로 정리해요. 옮기는 항은 부호가 바뀌어요.', tex: quad(1, -S, Pd) + ' = 0' }] : []).concat(k === 'prod' ? [] : [{ say: '왼쪽을 인수분해해요.', tex: facTex + ' = 0' }]).concat([
        { say: '곱이 0이니 괄호 가운데 하나가 0이에요.', tex: ptex(P1) + ' = 0' + OR + ptex(P2) + ' = 0' }, { say: '일차방정식 두 개를 각각 풀어요.', tex: ans.tex }]);
      h2 = k === 'prod' ? '이미 곱셈 꼴로 인수분해되어 있어요. 왼쪽은 두 식 $' + ptex(P1) + '$, $' + ptex(P2) + '$의 곱이에요. 곱이 0이니 둘 가운데 하나가 0이에요. 그러니 두 식을 각각 0으로 놓고 일차방정식 두 개를 풀어요. 괄호 안의 수를 그대로 읽지 말고, 그 괄호를 0으로 만드는 $x$의 값을 찾아요.' + (P1[0].c > 1 || P2[0].c > 1 ? ' $x$ 앞에 계수가 있으면 마지막에 그 수로 나눠요.' : '')
        : (k === 'arr' ? '오른쪽이 0이 아니에요. 인수분해로 풀려면 반드시 한쪽이 0이어야 해요. 먼저 오른쪽의 항을 모두 왼쪽으로 옮겨요. 옮길 때 부호가 바뀌어요. 그다음, ' : '') + '왼쪽을 인수분해해요. ' + (k === 'lead' ? '$x^{2}$ 앞에 계수가 있으니 엇갈려 곱하는 방법을 써요. 첫 항의 계수 $' + full[0] + '$' + pj(full[0], '과/와') + ' 끝 항 $' + Pd + '$' + pj(Pd, '을/를') + ' 각각 두 수의 곱으로 쪼개요.' : '곱해서 끝 항이 되고 더해서 가운데 항의 계수가 되는 두 수를 찾아요.') + ' 인수분해가 끝나면 두 괄호를 각각 0으로 놓고 풀어요. 괄호 안의 수와 해는 부호가 반대예요.';
    }
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps, eq: full,
      hints: [ZERO, h2, '① 한쪽이 0이 되도록 모든 항을 한쪽으로 모아요. ② 왼쪽을 인수분해해요. ③ 괄호를 하나씩 0으로 놓고 풀어요. ' + CHK] });
  };
  var okF = function (q) { var p = facBuild(q); return !!p && p.check; };
  var two = function (r, lo, hi) { var a, b; do { a = nz(r, lo, hi); b = nz(r, lo, hi); } while (abs(a) === abs(b)); return [a, b]; };
  choiceQ({
    id: 'B21.factor', title: '인수분해로 풀기', ids: ['signs-kept', 'one-sign', 'one-only', 'coef-ignored', 'product-only', 'not-arranged', 'inverted', 'plus-minus', 'not-rooted', 'middle-used', 'middle-kept'], build: facBuild,
    levels: [
      { name: '(일차식)(일차식) = 0', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () {
            var t = r.int(0, 3), p, a, b = nz(r, -9, 9);
            if (t === 0) return { kind: 'prod', P1: [T(1, X1)], P2: [T(1, X1), T(b)], perm: perm6(r), o: order4(r) };
            if (t === 1) { p = r.int(2, 5); a = nz(r, -7, 7); return gcd(p, abs(a)) !== 1 ? null : { kind: 'prod', P1: [T(p, X1), T(a)], P2: [T(1, X1), T(b)], perm: perm6(r), o: order4(r) }; }
            a = nz(r, -9, 9); return abs(a) === abs(b) ? null : { kind: 'prod', P1: [T(1, X1), T(a)], P2: [T(1, X1), T(b)], perm: perm6(r), o: order4(r) };
          }, okF);
        }) } },
      { name: 'x² + bx + c = 0', minDistinct: 100, vars: { q: sampler(function (r) { return until(function () { var t = two(r, -9, 9); return { kind: 'std', r1: t[0], r2: t[1], perm: perm6(r), o: order4(r) }; }, okF); }) } },
      { name: '정리가 필요한 식 · x² 에 계수가 있는 식 · 중근', minDistinct: 150, vars: { q: sampler(function (r) {
          return until(function () {
            var k = r.int(0, 3), t = two(r, -8, 8), p, s, a, b;
            if (k === 0) return { kind: 'dbl', h: nz(r, -9, 9), perm: perm6(r), o: order4(r) };
            if (k === 1) return { kind: 'arr', r1: t[0], r2: t[1], form: r.int(0, 1), perm: perm6(r), o: order4(r) };
            p = r.pick([2, 3, 2, 5]); s = r.pick([1, 1, 1, 3]); a = nz(r, -7, 7); b = nz(r, -7, 7);
            return gcd(p, abs(a)) !== 1 || gcd(s, abs(b)) !== 1 || p * b + a * s === 0 || (p === s && a === b) ? null : { kind: 'lead', p: p, a: a, r: s, b: b, perm: perm6(r), o: order4(r) };
          }, okF);
        }) } }
    ]
  });

  /* ── B21.sqrt 제곱근으로 풀기 ─────────────────────── */
  var SQR = '$x^{2} = 9$를 풀라는 것은 "제곱해서 9가 되는 수를 모두 찾아라"는 뜻이에요. 곧 9의 제곱근을 찾는 것이에요. 제곱근은 양수와 음수 두 개가 있으니 $x = \\pm 3$이에요. 제곱수가 아니어도 똑같아요. $x^{2} = 5$이면 $x = \\pm\\sqrt{5}$예요. 괄호가 통째로 제곱된 $(x - 1)^{2} = 5$도 괄호를 한 덩어리로 보면 같은 방법으로 풀려요.';
  var sqBuild = function (q) {
    var p = q.p || 0, v = q.v, a = q.a || 1, F0 = q.form, lhs, raw, ans, cands, steps, eq, f = sfree(v), inner = p ? bin([T(1, X1), T(-p)]) + '^{2}' : 'x^{2}';
    lhs = (a === 1 ? '' : a) + inner;
    raw = F0 === 1 ? lhs + ' - ' + a * v + ' = 0' : lhs + ' = ' + a * v;
    eq = [a, -2 * a * p, a * (p * p - v)]; ans = IR(p, 1, v, 1);
    cands = mixc([[IR(p, 1, v, 1, true), 'positive-only', '양수 쪽 하나만 구했어요. 제곱해서 같은 수가 되는 수는 양수와 음수 두 개예요. $\\pm$ 기호를 빠뜨리지 않아요.']], [
      p ? [IR(-p, 1, v, 1), 'shift-sign', '괄호 안의 수를 옮길 때 부호를 바꾸지 않았어요. $x - 2 = \\pm\\sqrt{5}$이면 $-2$를 옮겨서 $x = 2 \\pm\\sqrt{5}$가 돼요.'] : null,
      v > 1 ? [IR(p, v, 1, 1), 'not-rooted', '오른쪽 수의 제곱근을 구하지 않고 수를 그대로 썼어요. 제곱을 없애려면 제곱근을 구해야 해요.'] : null,
      !p && v % 2 === 0 && v > 2 ? [IR(0, v / 2, 1, 1), 'halved', '오른쪽 수를 2로 나눴어요. 제곱의 반대는 2로 나누기가 아니라 제곱근 구하기예요.'] : null,
      f[0] > 1 && f[1] > 1 ? [IR(p, f[0] * f[0], f[1], 1), 'square-out', '근호 안의 제곱수를 그대로 밖으로 꺼냈어요. 근호 밖으로는 제곱근이 되어 나와요.'] : null,
      a > 1 ? [IR(p, 1, a * v, 1), 'not-divided', '제곱 앞에 곱해진 수로 먼저 나누지 않았어요. 양쪽을 그 수로 나눠서 (제곱) = (수) 꼴로 만든 다음 제곱근을 구해요.'] : null,
      p ? [IR(0, 1, v, 1), 'shift-lost', '괄호 안의 수를 빠뜨렸어요. 제곱근을 구한 다음, 괄호 안에 있던 수를 반대쪽으로 옮겨야 $x$만 남아요.'] : null,
      p && v + p > 0 ? [IR(0, 1, v + p, 1), 'moved-inside', '괄호 안의 수를 근호 안으로 옮겼어요. 먼저 제곱근을 구하고, 그다음에 괄호 안의 수를 옮겨요.'] : null
    ], q.perm);
    steps = (F0 === 1 ? [{ say: '수를 오른쪽으로 옮겨요.', tex: lhs + ' = ' + a * v }] : []).concat(a > 1 ? [{ say: '양쪽을 $' + a + '$' + pj(a, '으로/로') + ' 나눠요.', tex: inner + ' = ' + v }] : []).concat([
      { say: (p ? '괄호를 한 덩어리로 보고 ' : '') + '제곱근을 구해요. 양수와 음수 둘 다예요.', tex: (p ? ptex([T(1, X1), T(-p)]) : 'x') + ' = \\pm\\sqrt{' + v + '}' }]).concat(p || f[0] > 1 ? [
      { say: [f[0] > 1 ? (f[1] === 1 ? '$' + v + '$' + pj(v, '은/는') + ' $' + f[0] + '$의 제곱이에요.' : '근호를 간단히 해요.') : '', p ? '괄호 안에 있던 수를 반대쪽으로 옮겨요.' : ''].filter(Boolean).join(' '), tex: ans.tex }] : []);
    if (steps[steps.length - 1].tex !== ans.tex) steps.push({ say: '이것이 해예요.', tex: ans.tex });
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps, eq: eq,
      hints: [SQR, (F0 === 1 ? '먼저 수를 오른쪽으로 옮겨서 (제곱) = (수) 꼴로 만들어요. ' : '') + (a > 1 ? '제곱 앞에 $' + a + '$' + pj(a, '이/가') + ' 곱해져 있으니 양쪽을 그 수로 나눠요. ' : '') + (p ? '괄호 $' + bin([T(1, X1), T(-p)]) + '$ 전체를 한 덩어리로 봐요. "어떤 것을 제곱했더니 $' + v + '$' + pj(v, '이/가') + ' 되었다"이니, 그 어떤 것은 $' + v + '$의 양의 제곱근이거나 음의 제곱근이에요. 그다음 괄호 안에 있던 수를 반대쪽으로 옮겨요. 옮길 때 부호가 바뀌어요.' : '제곱해서 $' + v + '$' + pj(v, '이/가') + ' 되는 수를 모두 찾아요. 양수 하나, 음수 하나예요. $' + v + '$' + pj(v, '이/가') + ' 제곱수이면 근호 없이 쓰고, 아니면 근호를 써요.') + ' 근호 안에 제곱수가 숨어 있으면 밖으로 꺼내 간단히 해요.',
        '① (제곱) = (수) 꼴로 만들어요. ② 제곱근을 구해요. $\\pm$ 기호를 꼭 붙여요. ③ 괄호 안에 수가 있었으면 반대쪽으로 옮겨요. ' + CHK] });
  };
  var okQ = function (q) { var p = sqBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B21.sqrt', title: '제곱근으로 풀기', ids: ['positive-only', 'shift-sign', 'not-rooted', 'halved', 'square-out', 'not-divided', 'shift-lost', 'moved-inside'], build: sqBuild,
    levels: [
      { name: 'x² = k', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { var sq1 = r.int(0, 1), k = sq1 ? r.int(2, 12) : 0, f0 = r.int(0, 2); return { v: sq1 ? k * k : r.int(2, 60), a: f0 === 2 ? r.int(2, 5) : 1, form: f0 === 2 ? 0 : f0, perm: perm6(r), o: order4(r) }; }, function (q) { return okQ(q) && q.a * q.v <= 300; }); }) } },
      { name: '(x − p)² = q', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { var k = r.int(1, 7); return { p: nz(r, -9, 9), v: r.int(0, 2) === 0 ? k * k : r.int(2, 30), a: 1, form: 0, perm: perm6(r), o: order4(r) }; }, okQ); }) } },
      { name: '먼저 정리해야 하는 식', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { var f0 = r.int(0, 1); return { p: nz(r, -9, 9), v: r.int(2, 30), a: f0 ? 1 : r.int(2, 5), form: f0, perm: perm6(r), o: order4(r) }; }, okQ); }) } }
    ]
  });

  /* ── B21.complete 완전제곱식으로 풀기 ────────────────── */
  var CMP = '인수분해가 안 되는 이차방정식도 풀 수 있어요. 왼쪽을 억지로 완전제곱식으로 만드는 방법이에요. $x^{2} + 6x$에 $9$를 더하면 $(x + 3)^{2}$이 돼요. 더하는 수는 언제나 "$x$의 계수의 절반을 제곱한 수"예요. 한쪽에만 더하면 저울이 기울어지니 양쪽에 똑같이 더해요. 그러면 (괄호)$^{2}$ = (수) 꼴이 되어 제곱근으로 풀 수 있어요.';
  var cmpBuild = function (q) {
    var h = q.h, c = q.c, a = q.a || 1, v = h * h - c, raw = quad(a, 2 * a * h, a * c) + ' = 0', eq = [a, 2 * a * h, a * c], inner = bin([T(1, X1), T(h)]), ans, cands, steps, FM, text;
    if (v <= 0) return null;
    var W_MOVE = '상수항을 옮기기만 하고 양쪽에 수를 더하지 않았어요. 왼쪽을 완전제곱식으로 만들려고 더한 수를 오른쪽에도 똑같이 더해야 해요.';
    var W_C = '상수항을 옮길 때 부호를 바꾸지 않았어요. 등호를 넘어가면 부호가 바뀌어요.';
    var W_HALF = '$x$의 계수를 반으로 나누지 않았어요. 괄호 안에 들어가는 수는 $x$의 계수의 절반이에요.';
    steps = (a > 1 ? [{ say: '$x^{2}$의 계수가 1이 되도록 양쪽을 $' + a + '$' + pj(a, '으로/로') + ' 나눠요.', tex: quad(1, 2 * h, c) + ' = 0' }] : []).concat([
      { say: '상수항을 오른쪽으로 옮겨요.', tex: quad(1, 2 * h, 0) + ' = ' + (-c) },
      { say: '$x$의 계수 $' + 2 * h + '$의 절반은 $' + h + '$' + pj(h, '이에요/예요') + '. 그 제곱 $' + h * h + '$' + pj(h * h, '을/를') + ' 양쪽에 더해요.', tex: quad(1, 2 * h, h * h) + ' = ' + (-c) + ' + ' + h * h },
      { say: '왼쪽을 완전제곱식으로 묶고 오른쪽을 계산해요.', tex: inner + '^{2} = ' + v }]);
    if (q.kind === 'form') {
      FM = function (hh, vv) { return hh === 0 ? null : { tex: bin([T(1, X1), T(hh)]) + '^{2} = ' + vv, key: 'F:' + hh + ',' + vv }; };
      ans = FM(h, v); text = '다음 이차방정식을 $(x + p)^{2} = q$ 꼴로 고친 것을 고르세요.';
      cands = mixc([[FM(h, -c), 'only-moved', W_MOVE]], [[FM(h, h * h + c), 'const-sign', W_C], [FM(2 * h, 4 * h * h - c), 'not-halved', W_HALF],
        [FM(h, abs(h) - c), 'half-not-squared', '절반을 제곱하지 않고 그대로 더했어요. 양쪽에 더하는 수는 $x$의 계수의 절반을 제곱한 수예요.'], [FM(-h, v), 'inner-sign', '괄호 안의 부호가 틀렸어요. 괄호 안의 수는 $x$의 계수의 절반이고, 부호도 $x$의 계수와 같아요.'],
        [FM(h, -v), 'right-sign', '오른쪽의 부호가 틀렸어요. 옮긴 상수항과 더한 수를 부호에 맞게 계산해요.']], q.perm);
    } else {
      ans = IR(-h, 1, v, 1);
      cands = mixc([[IR(h, 1, v, 1), 'inner-sign', '괄호 안의 수를 옮길 때 부호를 바꾸지 않았어요. $x + 3 = \\pm\\sqrt{5}$이면 $x = -3 \\pm\\sqrt{5}$예요.']], [
        [IR(-h, 1, -c, 1), 'only-moved', W_MOVE], [IR(-h, 1, h * h + c, 1), 'const-sign', W_C], [IR(-2 * h, 1, 4 * h * h - c, 1), 'not-halved', W_HALF],
        [IR(-h, 1, v, 1, true), 'positive-only', '양수 쪽 하나만 구했어요. 제곱근은 양수와 음수 두 개예요. $\\pm$ 기호를 빠뜨리지 않아요.'],
        a > 1 ? [IR(-a * h, 1, a * a * h * h - a * c, 1), 'not-divided', '$x^{2}$의 계수로 먼저 나누지 않았어요. 완전제곱식을 만들려면 $x^{2}$의 계수가 1이어야 해요.'] : null,
        [IR(-h, v, 1, 1), 'not-rooted', '오른쪽 수의 제곱근을 구하지 않고 수를 그대로 썼어요. 제곱을 없애려면 제곱근을 구해야 해요.']], q.perm);
      steps = steps.concat([{ say: '제곱근을 구해요.', tex: ptex([T(1, X1), T(h)]) + ' = \\pm\\sqrt{' + v + '}' }, { say: '괄호 안에 있던 수를 반대쪽으로 옮겨요.' + (sfree(v)[0] > 1 ? ' 근호도 간단히 해요.' : ''), tex: ans.tex }]);
    }
    return finish({ raw: raw, text: text, ans: ans, cands: cands, steps: steps, eq: q.kind === 'form' ? null : eq, ok: v > 0 && (q.kind === 'form' || sfree(v)[1] > 1),
      hints: [CMP, (a > 1 ? '$x^{2}$ 앞에 $' + a + '$' + pj(a, '이/가') + ' 있으면 완전제곱식을 만들기 어려워요. 먼저 모든 항을 $' + a + '$' + pj(a, '으로/로') + ' 나눠요. ' : '') + '상수항을 오른쪽으로 옮겨서 왼쪽에 $x$가 든 항만 남겨요. 그다음 $x$의 계수를 봐요. 그 수를 반으로 나누고, 나눈 수를 제곱해요. 그 수를 양쪽에 똑같이 더해요. 그러면 왼쪽은 (' + '$x$ + 절반)$^{2}$ 꼴로 묶여요. 절반이 음수이면 괄호 안도 빼기가 돼요.' + (q.kind === 'form' ? '' : ' 마지막으로 제곱근을 구하고 괄호 안의 수를 옮겨요.'),
        '① $x^{2}$의 계수를 1로 만들고 상수항을 오른쪽으로 옮겨요. ② $x$의 계수의 절반을 제곱한 수를 양쪽에 더해요. ③ 왼쪽을 완전제곱식으로 묶어요. ' + (q.kind === 'form' ? '④ 괄호를 전개해서 처음 식과 같은지 확인해요.' : '④ 제곱근을 구하고($\\pm$), 괄호 안의 수를 옮겨요.')] });
  };
  var okP = function (q) { var p = cmpBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B21.complete', title: '완전제곱식으로 풀기', ids: ['only-moved', 'const-sign', 'not-halved', 'half-not-squared', 'inner-sign', 'right-sign', 'positive-only', 'not-divided', 'not-rooted'], build: cmpBuild,
    levels: [
      { name: '(x + p)² = q 꼴로 고치기', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { return { kind: 'form', h: nz(r, -7, 7), c: nz(r, -12, 12), perm: perm6(r), o: order4(r) }; }, okP); }) } },
      { name: '완전제곱식으로 풀기', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { return { kind: 'solve', h: nz(r, -7, 7), c: nz(r, -12, 12), perm: perm6(r), o: order4(r) }; }, okP); }) } },
      { name: 'x² 에 계수가 있는 식', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { return { kind: 'solve', a: r.int(2, 4), h: nz(r, -5, 5), c: nz(r, -9, 9), perm: perm6(r), o: order4(r) }; }, okP); }) } }
    ]
  });

  /* ── B21.formula 근의 공식 ─────────────────────── */
  var FML = '완전제곱식으로 푸는 과정을 문자 $a$, $b$, $c$로 미리 해 둔 것이 근의 공식이에요. 요리법처럼 재료 세 가지만 넣으면 해가 나와요. $ax^{2} + bx + c = 0$의 해는 $x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}$예요. 재료는 $x^{2}$의 계수 $a$, $x$의 계수 $b$, 상수항 $c$이고, 부호까지 함께 읽어야 해요. 인수분해가 되지 않는 방정식도 이 공식 하나로 풀 수 있어요.';
  var fmBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, D = b * b - 4 * a * c, raw = quad(a, b, c) + ' = 0', ans = IR(-b, 1, D, 2 * a), f = D > 0 ? sfree(D) : [1, 1], rawTex = 'x = \\dfrac{' + (-b) + ' \\pm \\sqrt{' + D + '}}{' + 2 * a + '}', g = gcd(abs(b), 2 * a), cands, steps, D2 = b * b + 4 * a * c;
    if (!ans || gcd(gcd(a, abs(b)), abs(c)) !== 1) return null;
    cands = mixc([[IR(b, 1, D, 2 * a), 'b-sign', '$-b$의 부호가 틀렸어요. 공식의 맨 앞은 $b$가 아니라 $-b$예요. $b$의 부호를 반대로 바꿔 넣어요.']], [
      [IR(-b, 1, D, a), 'two-lost', '분모의 2를 빠뜨렸어요. 분모는 $a$가 아니라 $2a$예요.'],
      a > 1 ? [IR(-b, 1, D, 2), 'a-lost', '분모의 $a$를 빠뜨렸어요. 분모는 2가 아니라 $2a$예요. $x^{2}$의 계수를 곱해요.'] : null,
      D2 > 0 && sfree(D2)[1] > 1 ? [IR(-b, 1, D2, 2 * a), 'ac-sign', '근호 안의 $-4ac$를 계산할 때 부호가 틀렸어요. $c$' + (c < 0 ? '가 음수이면 $-4ac$는 양수가 되어 더해져요.' : '가 양수이면 $4ac$를 빼야 해요.')] : null,
      ans.tex !== rawTex ? [{ tex: rawTex, key: ans.key }, 'not-reduced', '계산은 맞지만 끝까지 간단히 하지 않았어요. 근호 안의 제곱수를 밖으로 꺼내고, 분자와 분모를 약분해요.', true] : null,
      g > 1 && f[0] > 1 ? [IR(-b / g, f[0], f[1], 2 * a / g), 'partial-reduce', '분자의 한 항만 약분했어요. 분자가 두 항이면 두 항 모두 분모와 같은 수로 나눠야 약분할 수 있어요.'] : null,
      [IR(-b, 1, D, 2 * a, true), 'positive-only', '더하기 쪽 하나만 구했어요. 근의 공식에는 $\\pm$ 기호가 있어서 해가 두 개예요.'],
      sfree(abs(b * b - a * c) || 1)[1] > 1 && b * b - a * c > 0 ? [IR(-b, 1, b * b - a * c, 2 * a), 'four-lost', '근호 안의 4를 빠뜨렸어요. 근호 안은 $b^{2} - 4ac$예요.'] : null
    ], q.perm);
    steps = [{ say: '계수를 부호까지 읽어요.', tex: 'a = ' + a + ',\\quad b = ' + b + ',\\quad c = ' + c },
      { say: '근의 공식에 넣어요. 음수는 괄호를 쳐서 넣어요.', tex: 'x = \\dfrac{-' + par(b) + ' \\pm \\sqrt{' + par(b) + '^{2} - 4 \\times ' + a + ' \\times ' + par(c) + '}}{2 \\times ' + a + '}' },
      { say: '근호 안과 분모를 계산해요.', tex: rawTex }];
    if (ans.tex !== rawTex) steps.push({ say: (f[0] > 1 ? '근호 안의 제곱수를 꺼내고 ' : '') + '분자와 분모를 약분해요.', tex: ans.tex });
    return finish({ raw: raw, ans: ans, cands: cands, steps: steps, eq: [a, b, c], ok: D > 0 && f[1] > 1 && (q.plain ? ans.tex === rawTex : true) && (q.reduce ? ans.tex !== rawTex : true),
      hints: [FML, '이 방정식에서 $a = ' + a + '$, $b = ' + b + '$, $c = ' + c + '$' + pj(c, '이에요/예요') + '. 빼기가 붙은 항은 음수로 읽어요. 먼저 근호 안의 $b^{2} - 4ac$를 따로 계산해 두면 실수가 줄어요. $b$를 제곱하고, $4$와 $a$와 $c$를 곱한 것을 빼요.' + (c < 0 ? ' $c$가 음수이니 빼기와 음수가 만나 더하기가 돼요.' : '') + ' 그 값을 근호 안에 넣고, 분자 앞에는 $-b$, 분모에는 $2a$를 써요.' + (q.reduce ? ' 마지막에 근호를 간단히 하고 약분할 수 있는지 살펴봐요.' : ''),
        '① $a$, $b$, $c$를 부호까지 읽어요. ② $b^{2} - 4ac$를 먼저 계산해요. ③ 공식에 넣어요. 분자는 $-b \\pm$ (근호), 분모는 $2a$예요. ④ 근호를 간단히 하고, 분자의 두 항이 모두 나누어지면 약분해요.'] });
  };
  var okM = function (q) { var p = fmBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B21.formula', title: '근의 공식', ids: ['b-sign', 'two-lost', 'a-lost', 'ac-sign', 'not-reduced', 'partial-reduce', 'positive-only', 'four-lost'], build: fmBuild,
    levels: [
      { name: 'x² 의 계수가 1인 식', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return { a: 1, b: pm(r, r.pick([1, 3, 5, 7, 9])), c: nz(r, -9, 9), plain: true, perm: perm6(r), o: order4(r) }; }, okM); }) } },
      { name: 'x² 에 계수가 있는 식', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { return { a: r.int(2, 5), b: nz(r, -9, 9), c: nz(r, -7, 7), plain: true, perm: perm6(r), o: order4(r) }; }, okM); }) } },
      { name: '근호를 간단히 하고 약분하는 식', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { return { a: r.int(1, 4), b: pm(r, 2 * r.int(1, 5)), c: nz(r, -8, 8), reduce: true, perm: perm6(r), o: order4(r) }; }, okM); }) } }
    ]
  });

  /* ── B21.apply 이차방정식의 활용 ──────────────────── */
  var PLAN = '활용 문제는 네 걸음으로 풀어요. ① 구하려는 것을 $x$로 놓아요. ② 문장에서 "같다"는 관계를 찾아 방정식을 세워요. ③ 방정식을 풀어요. 이차방정식이라 해가 보통 두 개 나와요. ④ 두 해 가운데 문제의 뜻에 맞는 것만 골라요. 길이나 개수는 음수가 될 수 없고, 자연수를 찾는 문제에서는 자연수만 답이 돼요. 이 마지막 걸음이 이차방정식 활용의 핵심이에요.';
  var CM = '\\,\\mathrm{cm}', CM2 = '\\,\\mathrm{cm}^{2}', MM = '\\,\\mathrm{m}', MM2 = '\\,\\mathrm{m}^{2}';
  var applyBuild = function (q) {
    var n = q.n, k = q.k, N, text, ans, wrong = {}, good = true, steps, h2, b, c, t1 = q.t1, t2 = q.t2, v, H, A0 = q.A, B0 = q.B, x = q.x;
    var fx = function (r1, r2) { return bin([T(1, X1), T(-r1)]) + bin([T(1, X1), T(-r2)]) + ' = 0'; };
    var pick = function (good, bad, why) { return { say: '두 해는 $x = ' + good + '$ 또는 $x = ' + bad + '$' + pj(bad, '이에요/예요') + '. ' + why, tex: 'x = ' + good }; };
    if (q.kind === 'consec') {
      N = n * (n + 1); ans = n; text = '연속하는 두 자연수의 곱이 $' + N + '$일 때, 두 수 가운데 작은 수를 구하세요.';
      wrong.larger = n + 1; wrong['sum-given'] = 2 * n + 1;
      steps = [{ say: '작은 수를 $x$로 놓으면 큰 수는 $x + 1$이에요. 곱이 $' + N + '$' + pj(N, '이에요/예요') + '.', tex: 'x(x + 1) = ' + N }, { say: '전개하고 한쪽을 0으로 만들어요.', tex: quad(1, 1, -N) + ' = 0' }, { say: '인수분해해요.', tex: fx(n, -(n + 1)) }, pick(n, -(n + 1), '자연수이니 음수는 버려요.')];
      h2 = '연속하는 두 자연수는 1 차이가 나요. 작은 수를 $x$로 놓으면 큰 수는 $x + 1$이에요. 두 수를 곱한 것이 $' + N + '$' + pj(N, '이라는/라는') + ' 식을 세워요. 괄호를 풀고 $' + N + '$' + pj(N, '을/를') + ' 왼쪽으로 옮기면 이차방정식이 돼요. 인수분해하면 해가 두 개 나오는데, 하나는 음수예요. 자연수를 찾고 있으니 양수인 해만 골라요. 묻는 것이 작은 수라는 것도 확인해요.';
    } else if (q.kind === 'sqsum') {
      N = n * n + (n + 1) * (n + 1); ans = n; text = '연속하는 두 자연수의 제곱의 합이 $' + N + '$일 때, 두 수 가운데 작은 수를 구하세요.';
      wrong.larger = n + 1; wrong['sum-given'] = 2 * n + 1;
      steps = [{ say: '작은 수를 $x$로 놓으면 큰 수는 $x + 1$이에요. 각각 제곱해서 더해요.', tex: 'x^{2} + (x + 1)^{2} = ' + N }, { say: '전개해서 정리하고 양쪽을 2로 나눠요.', tex: quad(1, 1, -(N - 1) / 2) + ' = 0' }, { say: '인수분해해요.', tex: fx(n, -(n + 1)) }, pick(n, -(n + 1), '자연수이니 음수는 버려요.')];
      h2 = '작은 수를 $x$로 놓으면 큰 수는 $x + 1$이에요. 두 수를 각각 제곱해서 더한 것이 $' + N + '$' + pj(N, '이에요/예요') + '. $(x + 1)^{2}$은 곱셈 공식으로 전개해요. 가운데 항 $2x$를 빠뜨리지 않아요. 동류항을 모으고 $' + N + '$' + pj(N, '을/를') + ' 왼쪽으로 옮기면 모든 계수가 짝수예요. 2로 나누면 식이 간단해져요. 마지막에 자연수인 해만 골라요.';
    } else if (q.kind === 'kplus') {
      c = n * (n - k); ans = n; text = '어떤 자연수를 제곱한 수는 그 수의 $' + k + '$배보다 $' + c + '$만큼 커요. 이 자연수를 구하세요.';
      wrong['other-root'] = n - k; wrong['sign-moved'] = null; wrong['root-sum'] = k;
      steps = [{ say: '어떤 자연수를 $x$로 놓고 문장을 식으로 옮겨요.', tex: 'x^{2} = ' + k + 'x + ' + c }, { say: '모든 항을 왼쪽으로 옮겨요.', tex: quad(1, -k, -c) + ' = 0' }, { say: '인수분해해요.', tex: fx(n, k - n) }, pick(n, k - n, '자연수이니 음수는 버려요.')];
      h2 = '어떤 자연수를 $x$로 놓아요. "제곱한 수"는 $x^{2}$, "그 수의 $' + k + '$배"는 $' + k + 'x$예요. 제곱한 수가 $' + c + '$만큼 더 크니, 작은 쪽에 $' + c + '$' + pj(c, '을/를') + ' 더해야 같아져요. 식을 세운 다음 오른쪽의 항을 모두 왼쪽으로 옮겨요. 인수분해하면 해가 두 개인데 하나는 음수예요. 자연수인 해가 답이에요.';
    } else if (q.kind === 'rect') {
      N = n * (n + k); ans = n; text = '가로의 길이가 세로의 길이보다 $' + k + CM + '$ 더 긴 직사각형이 있어요. 넓이가 $' + N + CM2 + '$일 때, 세로의 길이는 몇 cm인가요?';
      wrong.larger = n + k; wrong['half-area'] = null; wrong.difference = k;
      steps = [{ say: '세로를 $x$로 놓으면 가로는 $x + ' + k + '$' + pj(k, '이에요/예요') + '. (가로) × (세로) = (넓이)예요.', tex: 'x(x + ' + k + ') = ' + N }, { say: '전개하고 한쪽을 0으로 만들어요.', tex: quad(1, k, -N) + ' = 0' }, { say: '인수분해해요.', tex: fx(n, -(n + k)) }, pick(n, -(n + k), '길이는 양수이니 음수는 버려요.')];
      h2 = '세로의 길이를 $x$로 놓아요. 가로는 세로보다 $' + k + '$만큼 더 기니 $x + ' + k + '$' + pj(k, '이에요/예요') + '. 직사각형의 넓이는 가로와 세로를 곱한 것이에요. 그 곱이 $' + N + '$' + pj(N, '이라는/라는') + ' 식을 세워요. 전개해서 정리한 다음 인수분해하면 해가 두 개 나와요. 길이는 음수가 될 수 없으니 양수만 골라요. 묻는 것이 세로인지 가로인지 다시 확인해요.';
    } else if (q.kind === 'square') {
      b = q.b; N = (n + k) * (n - b); ans = n; text = '정사각형의 가로를 $' + k + CM + '$ 늘이고 세로를 $' + b + CM + '$ 줄였더니 넓이가 $' + N + CM2 + '$인 직사각형이 되었어요. 처음 정사각형의 한 변의 길이는 몇 cm인가요?';
      c = b - k - n;   /* 다른 해(음수) */
      wrong['new-width'] = n + k; wrong['new-height'] = n - b; wrong['other-root'] = abs(c) !== n ? abs(c) : null; good = N !== n * n;
      steps = [{ say: '처음 한 변을 $x$로 놓으면 새 가로는 $x + ' + k + '$, 새 세로는 $x - ' + b + '$' + pj(b, '이에요/예요') + '.', tex: '(x + ' + k + ')(x - ' + b + ') = ' + N }, { say: '전개하고 한쪽을 0으로 만들어요.', tex: quad(1, k - b, -k * b - N) + ' = 0' }, { say: '인수분해해요.', tex: fx(n, c) }, pick(n, c, '길이는 양수이니 음수는 버려요.')];
      h2 = '처음 정사각형의 한 변을 $x$로 놓아요. 가로는 늘였으니 $x + ' + k + '$, 세로는 줄였으니 $x - ' + b + '$' + pj(b, '이에요/예요') + '. 새 직사각형의 넓이는 이 둘을 곱한 것이고, 그 값이 $' + N + '$' + pj(N, '이에요/예요') + '. 전개해서 $' + N + '$' + pj(N, '을/를') + ' 왼쪽으로 옮긴 다음 인수분해해요. 음수인 해는 길이가 될 수 없어요. 묻는 것은 바뀐 뒤의 길이가 아니라 처음 한 변이에요.';
    } else if (q.kind === 'peri') {
      /* 세로 n, 가로 n + k */
      N = n * (n + k); b = 2 * (2 * n + k); ans = n + k; text = '둘레의 길이가 $' + b + CM + '$이고 넓이가 $' + N + CM2 + '$인 직사각형이 있어요. 가로가 세로보다 길 때, 가로의 길이는 몇 cm인가요?';
      wrong.smaller = n; wrong['half-perimeter'] = b / 2; wrong.difference = k;
      steps = [{ say: '가로와 세로의 합은 둘레의 절반인 $' + b / 2 + '$' + pj(b / 2, '이에요/예요') + '. 가로를 $x$로 놓으면 세로는 $' + b / 2 + ' - x$예요.', tex: 'x(' + b / 2 + ' - x) = ' + N }, { say: '전개하고 정리해요.', tex: quad(1, -b / 2, N) + ' = 0' }, { say: '인수분해해요.', tex: fx(n + k, n) }, { say: '두 해는 $x = ' + (n + k) + '$ 또는 $x = ' + n + '$' + pj(n, '이에요/예요') + '. 가로가 더 기니 큰 쪽이 가로예요.', tex: 'x = ' + (n + k) }];
      h2 = '둘레는 가로와 세로를 두 번씩 더한 것이에요. 그러니 가로와 세로를 한 번씩 더하면 둘레의 절반이에요. 가로를 $x$로 놓으면 세로는 (둘레의 절반) $- x$로 쓸 수 있어요. 넓이는 가로와 세로의 곱이니 식을 세울 수 있어요. 이 방정식은 해가 둘 다 양수예요. 하나는 가로, 하나는 세로예요. 가로가 더 길다고 했으니 큰 쪽을 골라요.';
    } else if (q.kind === 'throw' || q.kind === 'ground') {
      v = 5 * (t1 + t2); H = 5 * t1 * t2;
      if (q.kind === 'throw') {
        ans = t1; text = '지면에서 초속 $' + v + MM + '$로 똑바로 위로 던진 공의 $x$초 후의 높이는 $(' + v + 'x - 5x^{2})' + MM + '$예요. 공의 높이가 처음으로 $' + H + MM + '$가 되는 것은 던진 지 몇 초 후인가요?';
        wrong['second-time'] = t2; wrong['time-sum'] = t1 + t2;
        steps = [{ say: '높이가 $' + H + '$' + pj(H, '이/가') + ' 된다는 것을 식으로 써요.', tex: v + 'x - 5x^{2} = ' + H }, { say: '모든 항을 한쪽으로 옮기고 5로 나눠요.', tex: quad(1, -(t1 + t2), t1 * t2) + ' = 0' }, { say: '인수분해해요.', tex: fx(t1, t2) }, { say: '두 해는 $x = ' + t1 + '$ 또는 $x = ' + t2 + '$' + pj(t2, '이에요/예요') + '. 올라갈 때 한 번, 내려올 때 한 번 그 높이를 지나요. 처음은 작은 쪽이에요.', tex: 'x = ' + t1 }];
        h2 = '높이를 나타내는 식 $' + v + 'x - 5x^{2}$이 $' + H + '$' + pj(H, '과/와') + ' 같다고 놓아요. 모든 항을 한쪽으로 모으면 계수가 모두 5의 배수예요. 5로 나누면 인수분해하기 쉬워져요. 이 방정식은 해가 둘 다 양수예요. 공은 올라가면서 한 번, 내려오면서 한 번 같은 높이를 지나기 때문이에요. "처음으로"라고 했으니 두 시각 가운데 앞선 것을 골라요.';
      } else {
        ans = t1 + t2; text = '지면에서 초속 $' + v + MM + '$로 똑바로 위로 던진 공의 $x$초 후의 높이는 $(' + v + 'x - 5x^{2})' + MM + '$예요. 공이 다시 지면에 떨어지는 것은 던진 지 몇 초 후인가요?';
        wrong['speed-copied'] = v; wrong['not-divided'] = null; wrong['peak-time'] = (t1 + t2) % 2 === 0 ? (t1 + t2) / 2 : null;
        steps = [{ say: '지면에서는 높이가 0이에요.', tex: v + 'x - 5x^{2} = 0' }, { say: '양쪽을 $-5$로 나누고 공통인수 $x$로 묶어요.', tex: 'x(x - ' + ans + ') = 0' }, { say: '두 해는 $x = 0$ 또는 $x = ' + ans + '$' + pj(ans, '이에요/예요') + '. $x = 0$은 던지는 순간이에요. 다시 떨어지는 때는 다른 쪽이에요.', tex: 'x = ' + ans }];
        h2 = '공이 지면에 있다는 것은 높이가 0이라는 뜻이에요. 높이를 나타내는 식 $' + v + 'x - 5x^{2}$을 0과 같다고 놓아요. 두 항에 공통으로 $x$가 들어 있으니 공통인수로 묶을 수 있어요. 해는 두 개예요. 하나는 $x = 0$인데, 이것은 공을 던지는 바로 그 순간이에요. "다시" 떨어지는 때를 물었으니 0이 아닌 해가 답이에요.';
      }
    } else {
      N = (A0 - x) * (B0 - x); ans = x; text = '가로 $' + A0 + MM + '$, 세로 $' + B0 + MM + '$인 직사각형 모양의 땅에 폭이 일정한 길을 가로 방향과 세로 방향으로 하나씩 냈어요. 길을 뺀 나머지 땅의 넓이가 $' + N + MM2 + '$일 때, 길의 폭은 몇 m인가요?';
      wrong['other-root'] = null; wrong['left-width'] = A0 - x; wrong['left-height'] = B0 - x;
      steps = [{ say: '길을 한쪽으로 밀어 붙이면 남은 땅은 가로 $' + A0 + ' - x$, 세로 $' + B0 + ' - x$인 직사각형이에요.', tex: '(' + A0 + ' - x)(' + B0 + ' - x) = ' + N }, { say: '전개하고 한쪽을 0으로 만들어요.', tex: quad(1, -(A0 + B0), A0 * B0 - N) + ' = 0' }, { say: '인수분해해요.', tex: fx(x, A0 + B0 - x) }, pick(x, A0 + B0 - x, '길의 폭이 땅의 세로보다 클 수는 없으니 작은 쪽이 답이에요.')];
      h2 = '길의 폭을 $x$로 놓아요. 요령이 있어요. 길 두 개를 땅의 가장자리로 밀어 붙여도 남은 땅의 넓이는 같아요. 그러면 남은 땅은 가로가 $' + A0 + ' - x$, 세로가 $' + B0 + ' - x$인 직사각형 하나가 돼요. 이 둘을 곱한 것이 $' + N + '$' + pj(N, '이에요/예요') + '. 전개해서 정리하고 인수분해하면 해가 두 개 나와요. 길의 폭이 땅보다 넓을 수는 없으니 작은 해만 뜻에 맞아요.';
    }
    return { text: text, ans: ans, wrong: wrong, steps: steps, check: good,
      hints: [PLAN, h2, '① 구하려는 것을 $x$로 놓고, 나머지를 $x$로 나타내요. ② 문장의 "같다"를 찾아 방정식을 세워요. ③ 한쪽을 0으로 만들어 인수분해로 풀어요. ④ 두 해 가운데 문제의 뜻(자연수, 양수, 처음, 더 긴 쪽 …)에 맞는 것을 골라요.'] };
  };
  numQ({
    id: 'B21.apply', title: '이차방정식의 활용', kind: 'int', build: applyBuild,
    mistakes: [['larger', '두 수(두 길이) 가운데 큰 쪽을 답했어요. 방정식은 맞게 풀었을 수 있어요. 문제에서 묻는 것이 어느 쪽인지 다시 확인해요.'],
      ['sum-given', '두 수의 합을 답했어요. 문제에서 묻는 것은 두 수 가운데 작은 수 하나예요.'],
      ['other-root', '뜻에 맞지 않는 해(음수인 해)의 크기를 답했어요. 두 해 가운데 양수인 해가 답이에요.'],
      ['root-sum', '문제에 나온 배수를 그대로 답했어요. 식을 세워 한쪽을 0으로 만든 다음 인수분해로 풀어요.'],
      ['difference', '두 길이의 차를 답했어요. 방정식을 세워서 실제 길이를 구해요.'],
      ['new-width', '늘인 뒤의 가로를 답했어요. 문제에서 묻는 것은 처음 정사각형의 한 변이에요.'],
      ['new-height', '줄인 뒤의 세로를 답했어요. 문제에서 묻는 것은 처음 정사각형의 한 변이에요.'],
      ['smaller', '세로의 길이를 답했어요. 두 해 가운데 큰 쪽이 가로예요.'],
      ['half-perimeter', '둘레의 절반을 답했어요. 그 값은 가로와 세로의 합이에요. 넓이의 조건까지 써서 방정식을 세워요.'],
      ['second-time', '내려오면서 그 높이를 지나는 시각을 답했어요. "처음으로"라고 했으니 두 해 가운데 작은 쪽이에요.'],
      ['time-sum', '두 시각을 더했어요. 그 값은 공이 지면에 떨어지는 때예요. 묻는 것은 그 높이를 처음 지나는 때예요.'],
      ['speed-copied', '처음 속력을 그대로 답했어요. 높이가 0이 되는 때를 방정식으로 구해야 해요.'],
      ['peak-time', '가장 높이 올라간 때를 답했어요. 지면에 다시 떨어지는 때는 그 두 배예요. 높이가 0이 되는 때를 구해요.'],
      ['left-width', '남은 땅의 가로를 답했어요. 문제에서 묻는 것은 길의 폭이에요.'],
      ['left-height', '남은 땅의 세로를 답했어요. 문제에서 묻는 것은 길의 폭이에요.']],
    levels: [
      { name: '수에 대한 문제', minDistinct: 60, vars: { q: sampler(function (r) { var k = r.int(0, 2), n; if (k === 0) return { kind: 'consec', n: r.int(3, 20) }; if (k === 1) return { kind: 'sqsum', n: r.int(2, 15) }; n = r.int(4, 15); return { kind: 'kplus', n: n, k: r.int(2, n - 2) }; }) } },
      { name: '도형에 대한 문제', minDistinct: 150, vars: { q: sampler(function (r) { var k = r.int(0, 2), n = r.int(3, 15); if (k === 0) return { kind: 'rect', n: n, k: r.int(1, 9) }; if (k === 1) return { kind: 'peri', n: n, k: r.int(1, 9) }; n = r.int(6, 15); return { kind: 'square', n: n, k: r.int(1, 6), b: r.int(1, 3) }; }) } },
      { name: '던진 공 · 길의 폭', minDistinct: 60, vars: { q: sampler(function (r) {
          var k = r.int(0, 2), t1, t2, A0, B0;
          if (k < 2) { t1 = r.int(1, 4); t2 = t1 + r.int(1, 4); return { kind: k ? 'ground' : 'throw', t1: t1, t2: t2 }; }
          B0 = r.int(8, 20); A0 = B0 + r.int(2, 12); return { kind: 'road', A: A0, B: B0, x: r.int(1, 4) };
        }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B21', [
  { title: '이차방정식과 그 해', body: [
    '모든 항을 왼쪽으로 옮겨 정리했을 때 (이차식) = 0 꼴이 되는 방정식을 이차방정식이라고 해요.',
    { tex: 'ax^{2} + bx + c = 0 \\quad (a \\neq 0)' },
    '방정식을 참으로 만드는 $x$의 값이 해(근)예요. 자물쇠에 맞는 열쇠처럼, 해를 넣으면 등식이 딱 맞아요.',
    { ex: [['x^{2} - 5x + 6 = 0', '$x = 2$를 넣으면 $4 - 10 + 6 = 0$. 해가 맞아요'], ['x^{2} - 5x + 6 = 0', '$x = 1$을 넣으면 $1 - 5 + 6 = 2$. 해가 아니에요']] },
    '이차방정식의 해는 보통 두 개예요.'
  ] },
  { title: '인수분해로 풀기', body: [
    '곱해서 0이면 둘 가운데 하나는 0이에요.',
    { tex: 'AB = 0 \\;\\Rightarrow\\; A = 0 \\text{ 또는 } B = 0' },
    '한쪽을 0으로 만들고, 다른 쪽을 인수분해해서 괄호를 하나씩 0으로 놓아요.',
    { tex: 'x^{2} - 5x + 6 = 0 \\;\\Rightarrow\\; (x - 2)(x - 3) = 0 \\;\\Rightarrow\\; x = 2 \\text{ 또는 } x = 3' },
    '괄호 안의 수와 해는 부호가 반대예요. $(x - 3)^{2} = 0$처럼 두 괄호가 같으면 해가 하나로 겹치고, 이것을 중근이라고 해요.'
  ] },
  { title: '제곱근으로 풀기', body: [
    '(제곱) = (수) 꼴이면 제곱근을 구해요. 양수와 음수 둘 다예요.',
    { tex: 'x^{2} = 5 \\;\\Rightarrow\\; x = \\pm\\sqrt{5}' },
    '괄호가 통째로 제곱되어 있어도 같아요.',
    { tex: '(x - 1)^{2} = 5 \\;\\Rightarrow\\; x - 1 = \\pm\\sqrt{5} \\;\\Rightarrow\\; x = 1 \\pm\\sqrt{5}' }
  ] },
  { title: '완전제곱식으로 풀기', body: [
    '인수분해가 안 되면 왼쪽을 완전제곱식으로 만들어요. $x$의 계수의 절반을 제곱한 수를 양쪽에 더해요.',
    { tex: 'x^{2} + 6x - 2 = 0 \\;\\Rightarrow\\; x^{2} + 6x = 2' },
    { tex: 'x^{2} + 6x + 9 = 2 + 9 \\;\\Rightarrow\\; (x + 3)^{2} = 11' },
    { tex: 'x = -3 \\pm\\sqrt{11}' },
    '6의 절반은 3이고, 3의 제곱은 9예요. 그래서 9를 양쪽에 더했어요.'
  ] },
  { title: '근의 공식', body: [
    '완전제곱식으로 푸는 과정을 미리 해 둔 것이 근의 공식이에요. 계수 세 개만 넣으면 돼요.',
    { tex: 'ax^{2} + bx + c = 0 \\;\\Rightarrow\\; x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}' },
    { ex: [['x^{2} + 3x - 1 = 0', '$a = 1$, $b = 3$, $c = -1$'], ['x = \\dfrac{-3 \\pm \\sqrt{13}}{2}', '$3^{2} - 4 \\times 1 \\times (-1) = 13$']] },
    '계수는 부호까지 함께 읽어요.'
  ] },
  { title: '활용: 뜻에 맞는 해 고르기', body: [
    '구하려는 것을 $x$로 놓고 방정식을 세워 풀어요. 해가 두 개 나오면 문제의 뜻에 맞는 것만 골라요.',
    { ex: [['x(x + 1) = 56', '연속하는 두 자연수의 곱이 56'], ['x = 7 \\text{ 또는 } x = -8', '자연수이니 $x = 7$']] },
    '길이 · 개수 · 시간은 음수가 될 수 없어요. 해를 구한 뒤 꼭 문제로 돌아가 확인해요.'
  ] }
]);
