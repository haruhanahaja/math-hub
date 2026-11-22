/* C02 항등식과 나머지정리 — 항등식(계수 비교, 수치 대입), 나머지정리, 인수정리, 조립제법
   유형(쉬운 것부터): C02.identity 항등식 가려내기(보기 고르기) · C02.coef 계수 비교법 · C02.subst 수치 대입법 · C02.remainder 나머지정리(키패드, 부호 있는 정수)
                     · C02.isfactor 인수 찾기(보기 고르기) · C02.factor 인수정리로 계수 구하기 · C02.synth 조립제법의 빈칸(키패드, 부호 있는 정수)
                     · C02.synthq 조립제법 읽기(보기 고르기)
   답이 식 · 개념 판단이면 보기 고르기, 답이 수 하나이면 키패드다.
   한 문자의 다항식은 계수의 배열(높은 차수부터)로 다룬다. 계산은 모두 정수로 한다(분수를 넣는 문제도 분자 · 분모를 정수로 따로 계산한다).
   틀린 답은 '흔한 실수 하나를 저지른 계산'을 실제로 해서 만든다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, order4 = A.order4, sameVal = A.sameVal, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var sgn = function (x) { return x < 0 ? -1 : 1; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  var perm6 = function (r) { return r.shuffle([0, 1, 2, 3, 4, 5]); };
  var ORD = ['첫째', '둘째', '셋째'];

  /* ── 항과 다항식 ── */
  var ORDER = ['a', 'b', 'c', 'x', 'y'];
  var T = function (c, e) { return { c: c, e: e || {} }; };
  var key = function (e) { return ORDER.filter(function (k) { return e[k]; }).map(function (k) { return k + (e[k] === 1 ? '' : '^{' + e[k] + '}'); }).join(''); };
  var deg = function (e) { return ORDER.reduce(function (s, k) { return s + (e[k] || 0); }, 0); };
  /** 차수가 높은 항부터, 같은 차수이면 앞 문자의 지수가 큰 항부터, 상수항은 맨 뒤 */
  var cmp = function (a, b) { var d = deg(b.e) - deg(a.e), i; for (i = 0; !d && i < ORDER.length; i++) d = (b.e[ORDER[i]] || 0) - (a.e[ORDER[i]] || 0); return d; };
  var mulT = function (a, b) { var e = {}; ORDER.forEach(function (k) { var x = (a.e[k] || 0) + (b.e[k] || 0); if (x) e[k] = x; }); return T(a.c * b.c, e); };
  var sq = function (t) { return mulT(t, t); };
  var neg = function (t) { return T(-t.c, t.e); };
  var mag = function (t) { return T(abs(t.c), t.e); };
  var scale = function (t, k) { return T(t.c * k, t.e); };
  var ptex = function (ts) { return poly(ts.map(function (t) { return [t.c, key(t.e)]; })); };
  var one = function (t) { return ptex([t]); };
  var pmul = function (P, Q) { var out = []; P.forEach(function (a) { Q.forEach(function (b) { out.push(mulT(a, b)); }); }); return out; };
  var comb = function (ts) {
    var g = {}, ks = [];
    ts.forEach(function (t) { var k = key(t.e); if (!g[k]) { g[k] = T(0, t.e); ks.push(k); } g[k].c += t.c; });
    return ks.map(function (k) { return g[k]; }).filter(function (t) { return t.c !== 0; }).sort(cmp);
  };
  var bin = function (P) { return '(' + ptex(P) + ')'; };
  /** 거듭제곱을 쓴다: x → x^{3}, 3 → 3^{3}, 2x → (2x)^{3} */
  var powTex = function (t, n) { var s = one(t); return (/^[a-z]$|^\d+$/.test(s) ? s : '(' + s + ')') + '^{' + n + '}'; };
  var wrap = function (t) { var s = one(t); return s.charAt(0) === '-' ? '(' + s + ')' : s; };
  var powNum = function (n, k) { return par(n) + '^{' + k + '}'; };

  /* ── 한 문자의 다항식: 계수의 배열(높은 차수부터). [2, 0, -3] 은 2x² − 3 ── */
  var D = function (cs) { var n = cs.length - 1; return cs.map(function (c, i) { return T(c, n - i ? { x: n - i } : {}); }).filter(function (t) { return t.c !== 0; }); };
  var dmul = function (p, q) { var out = [], i; for (i = 0; i < p.length + q.length - 1; i++) out.push(0); p.forEach(function (a, i2) { q.forEach(function (b, j) { out[i2 + j] += a * b; }); }); return out; };
  /** m·p + n·q (낮은 차수 쪽으로 줄을 맞춘다) */
  var dadd = function (p, q, m, n) { var L = Math.max(p.length, q.length), out = [], i; for (i = 0; i < L; i++) out.push(m * (p[i - (L - p.length)] || 0) + n * (q[i - (L - q.length)] || 0)); return out; };
  /** 나눗셈: 몫 q, 나머지 r, 한 번씩 나눈 기록 rounds. 계수가 정수로 나누어떨어지지 않으면 null */
  var ddiv = function (a, b) {
    var r = a.slice(), q = [], rounds = [], n = a.length - b.length, i, j, c, before;
    if (n < 0) return null;
    for (i = 0; i <= n; i++) {
      if (r[i] % b[0] !== 0) return null;
      c = r[i] / b[0] || 0; before = r.slice(i); q.push(c);
      for (j = 0; j < b.length; j++) r[i + j] -= c * b[j];
      if (c !== 0) rounds.push({ c: c, d: n - i, before: before, after: r.slice(i + 1) });
    }
    return { q: q, r: r.slice(n + 1), rounds: rounds };
  };
  var sameArr = function (x, y) { return x.length === y.length && x.every(function (v, i) { return v === y[i]; }); };

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
      if (t === '0' || t.length > 40 || seen.some(function (s) { return s === t || sameVal(s, t); })) return;
      seen.push(t); wrong.push([t, c[1], c[2]]);
    });
    return { tex: o.tex || o.raw, text: o.text || '다음 식을 전개하세요.', ans: ans, wrong: wrong, hints: o.hints, steps: o.steps,
      check: wrong.length === 3 && ans.length <= 40 && ans !== '0' && sameVal(o.raw, o.same || ans) && o.ok !== false };
  };
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'C02', version: 1, title: o.title,
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
     답이 문제에 없는 양수인데 힌트에 그 수가 나오면 거른다 ── */
  var numQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (n) { return { n: n, p: 0 }; };
    var leak = function (p) { var a = String(abs(p.ans)); return nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    var okW = function (p, x) { return isInt(x) && x !== p.ans && x !== 0 && x !== -p.ans; };
    var count = function (p) { var seen = []; o.mistakes.forEach(function (m) { var x = p.wrong[m[0]]; if (okW(p, x) && seen.indexOf(x) < 0) seen.push(x); }); return seen.length; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && p.ans !== 0 && abs(p.ans) <= 999 && p.check === true && !leak(p) && count(p) >= 2; }; });
    MH.defineType({
      id: o.id, unit: 'C02', version: 1, title: o.title,
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

  /* ── 이 단원의 도구 ── */
  var sg = function (n) { return (n < 0 ? '- ' : '+ ') + abs(n); };
  var xp = function (d) { return d === 0 ? '' : d === 1 ? 'x' : 'x^{' + d + '}'; };
  /** 문자 계수가 섞인 다항식: [[3, 2], ['k', 1], [-5, 0]] → 3x^{2} + kx - 5 */
  var pK = function (ts) {
    var out = '';
    ts.forEach(function (t) {
      var c = t[0], d = t[1], s = typeof c === 'string', ng = !s && c < 0, body;
      if (c === 0) return;
      body = s ? c + xp(d) : ((abs(c) !== 1 || d === 0 ? abs(c) : '') + xp(d));
      out += (out ? (ng ? ' - ' : ' + ') : (ng ? '-' : '')) + body;
    });
    return out;
  };
  var termsOf = function (cs) { var n = cs.length - 1; return cs.map(function (c, i) { return [c, n - i]; }); };
  /** x 자리에 수(aTex)를 넣은 식: 2^{3} - 3 \times 2 + 1 */
  var numLine = function (ts, aTex) {
    var out = '', pw = function (d) { return d === 1 ? aTex : aTex + '^{' + d + '}'; };
    ts.forEach(function (t) {
      var c = t[0], d = t[1], s = typeof c === 'string', ng = !s && c < 0, body;
      if (c === 0) return;
      body = s ? c + (d ? ' \\times ' + pw(d) : '') : d === 0 ? String(abs(c)) : (abs(c) === 1 ? '' : abs(c) + ' \\times ') + pw(d);
      out += (out ? (ng ? ' - ' : ' + ') : (ng ? '-' : '')) + body;
    });
    return out;
  };
  var horner = function (cs, a) { return cs.reduce(function (s, c) { return s * a + c; }, 0); };
  var ipow = function (a, n) { var x = 1, i; for (i = 0; i < n; i++) x *= a; return x; };
  var whole = function (n, d) { return d !== 0 && n % d === 0 ? n / d : null; };
  var vals = function (o) { return Object.keys(o).map(function (k) { return k + ' = ' + o[k]; }).join(',\\quad '); };
  var ID_TEXT = '다음 등식이 $x$에 대한 항등식일 때, ';

  /* ── C02.identity 항등식 가려내기 ───────────────────── */
  var ID_KEY = '등식에는 두 종류가 있어요. 방정식은 특별한 수를 넣을 때만 참이 되는 등식이에요($2x = 6$은 $x = 3$일 때만 참). 항등식은 어떤 수를 넣어도 늘 참인 등식이에요($2(x + 1) = 2x + 2$). 항등식은 같은 식을 모양만 바꿔 쓴 것이에요. 「2개씩 3묶음」과 「6개」가 같은 것을 다르게 부르는 것과 같아요.';
  var mkId = function (r, kind, good) {
    var k, a, b, p, q, o;
    if (kind === 'dist') { k = r.int(2, 5); a = nz(r, -6, 6); o = { lhs: k + '(x ' + sg(a) + ')', L: [k, k * a], bad: [k, a] }; }
    else if (kind === 'collect') { p = r.int(2, 6); q = nz(r, -5, 5); if (p + q === 0) q = 1; o = { lhs: p + 'x ' + (q < 0 ? '- ' : '+ ') + (abs(q) === 1 ? '' : abs(q)) + 'x', L: [p + q, 0], bad: [p + q] }; }
    else if (kind === 'sq') { a = nz(r, -6, 6); o = { lhs: '(x ' + sg(a) + ')^{2}', L: [1, 2 * a, a * a], bad: [1, 0, a * a] }; }
    else if (kind === 'conj') { a = r.int(1, 7); o = { lhs: '(x + ' + a + ')(x - ' + a + ')', L: [1, 0, -a * a], bad: [1, 0, a * a] }; }
    else if (kind === 'xab') { a = nz(r, -5, 5); do { b = nz(r, -5, 5); } while (b === a); o = { lhs: '(x ' + sg(a) + ')(x ' + sg(b) + ')', L: [1, a + b, a * b], bad: a * b === a + b ? [1, a + b, -a * b] : [1, a * b, a + b] }; }
    else if (kind === 'linear') { p = r.int(2, 5); q = nz(r, -9, 9); o = { lhs: ptex(D([p, q])), L: [p, q], bad: [nz(r, -9, 9)] }; }
    else { o = { lhs: 'x^{2}', L: [1, 0, 0], bad: [r.int(2, 6), 0] }; }
    return { kind: kind, lhs: o.lhs, L: o.L, R: good ? o.L : o.bad, good: !!good };
  };
  var idBuild = function (q) {
    var not = q.mode === 'not', opts = q.opts, tx = function (o) { return o.lhs + ' = ' + ptex(D(o.R)); }, ans = opts[0], wrong, texts = opts.map(tx);
    wrong = opts.slice(1).map(function (o) {
      var x0 = [1, 2, 0, -1, 3].filter(function (x) { return horner(o.L, x) !== horner(o.R, x); })[0];
      return [tx(o), (o.good ? 'id-' : 'eq-') + o.kind, o.good ? '이 등식은 왼쪽을 전개해서 정리하면 오른쪽과 똑같은 식이 돼요. $x$에 어떤 수를 넣어도 성립하니 항등식이에요. 항등식이 아닌 것을 골라야 해요.'
        : '$x = ' + x0 + '$' + pj(x0, '을/를') + ' 넣어 보면 왼쪽은 $' + horner(o.L, x0) + '$, 오른쪽은 $' + horner(o.R, x0) + '$. 두 값이 달라요. 항등식은 어떤 수를 넣어도 양쪽이 같아야 해요.'];
    });
    return { text: not ? '다음 중 $x$에 대한 항등식이 아닌 것을 고르세요.' : '다음 중 $x$에 대한 항등식을 고르세요.', ans: tx(ans), wrong: wrong,
      check: ans.good === !not && opts.slice(1).every(function (o) { return o.good === not; }) && opts.every(function (o) { return sameVal(o.lhs, ptex(D(o.R))) === o.good && sameVal(o.lhs, ptex(D(o.L))); })
        && texts.every(function (t, i) { return texts.indexOf(t) === i; }) && wrong.every(function (w, i) { return wrong.findIndex(function (u) { return u[1] === w[1]; }) === i; }),
      steps: not ? [{ say: '보기마다 왼쪽을 전개해서 오른쪽과 견줘요. 이 보기의 왼쪽을 바르게 전개하면 아래와 같아요.', tex: ans.lhs + ' = ' + ptex(D(ans.L)) }, { say: '등식의 오른쪽은 이것과 다른 식이에요. 그래서 이 등식은 항등식이 아니에요. 나머지 보기는 전개하면 양쪽이 똑같아요.', tex: tx(ans) }]
        : [{ say: '항등식은 문자에 어떤 수를 넣어도 성립하는 등식이에요. 왼쪽을 전개해서 오른쪽과 완전히 같은 식이 되는지 확인해요.', tex: ans.lhs + ' = ' + ptex(D(ans.L)) }, { say: '나머지 보기는 양쪽이 서로 다른 식이에요. 특별한 수를 넣을 때만 성립하거나 아예 성립하지 않아요. 그런 등식은 항등식이 아니에요.', tex: tx(ans) }],
      hints: [ID_KEY,
        '보기마다 왼쪽의 괄호를 풀어 정리해요. 그 결과가 오른쪽과 글자 하나 다르지 않고 똑같으면 항등식이에요. ① 괄호 앞의 수는 괄호 안의 모든 항에 곱해요. ② 제곱은 가운데 항(두 항의 곱의 2배)까지 써요. ③ 합과 차의 곱은 제곱의 차가 돼요.',
        '전개가 헷갈리면 수를 넣어 봐요. $x = 0$과 $x = 1$을 양쪽에 넣어서 값이 한 번이라도 다르면 항등식이 아니에요. 다만 수 몇 개에서 같다고 바로 항등식이라고 할 수는 없어요. 마지막에는 전개해서 확인해요.'] };
  };
  var idQ = function (level) {
    return sampler(function (r) {
      var a, rest;
      if (level === 0) { a = r.pick(['dist', 'collect']); rest = [a === 'dist' ? 'collect' : 'dist', 'linear', 'quad']; }
      else if (level === 1) { a = r.pick(['sq', 'conj', 'xab']); rest = r.shuffle(['sq', 'conj', 'xab', 'dist', 'linear'].filter(function (k) { return k !== a; })).slice(0, 3); }
      else { a = r.pick(['dist', 'sq', 'conj', 'xab', 'collect']); rest = r.shuffle(['dist', 'sq', 'conj', 'xab', 'collect'].filter(function (k) { return k !== a; })).slice(0, 3); }
      return { mode: level === 2 ? 'not' : 'is', opts: [mkId(r, a, level !== 2)].concat(rest.map(function (k) { return mkId(r, k, level === 2); })), o: order4(r) };
    });
  };
  choiceQ({
    id: 'C02.identity', title: '항등식 가려내기', build: idBuild,
    ids: ['eq-dist', 'eq-collect', 'eq-sq', 'eq-conj', 'eq-xab', 'eq-linear', 'eq-quad', 'id-dist', 'id-collect', 'id-sq', 'id-conj', 'id-xab'],
    /* 문제 글은 늘 같고 보기가 바뀐다(보기가 얼마나 다양한지는 단원 검사에서 본다) */
    levels: [{ name: '괄호를 풀면 보이는 항등식', minDistinct: 1, vars: { q: idQ(0) } }, { name: '곱셈 공식으로 만든 항등식', minDistinct: 1, vars: { q: idQ(1) } }, { name: '항등식이 아닌 것 찾기', minDistinct: 1, vars: { q: idQ(2) } }]
  });

  /* ── C02.coef 계수 비교법 ─────────────────────────── */
  var CO_KEY = '항등식에서는 양쪽이 완전히 같은 식이에요. 그래서 같은 차수의 항끼리 계수가 같아야 해요. $ax + b = 3x + 5$가 항등식이면 $a = 3$, $b = 5$예요. 저울 양쪽에 같은 물건이 같은 개수만큼 있어야 늘 수평인 것과 같아요. 이렇게 계수를 견주어 모르는 수를 찾는 방법을 계수 비교법이라고 해요.';
  var CO_LAST = '① 괄호가 있는 쪽을 모두 전개해요. ② $x^{2}$의 계수, $x$의 계수, 상수항을 따로 모아요. ③ 양쪽에서 같은 자리끼리 등호로 이어 식을 세워요. ④ 모르는 문자가 둘이면 연립방정식을 풀어요. 구한 값을 처음 식에 넣어 양쪽이 같아지는지 확인하면 실수를 잡을 수 있어요.';
  var lin = function (p, v, q) { return poly([[p, v], [q, '']]); };
  var coefBuild = function (q) {
    var p = q.p, k = q.k, h = q.h, a = q.a, b = q.b, c = q.c, ask = q.ask, m, n, tex, sol, wrong, expd, eqs, h2, A2, B2, C2, qq = q.q;
    if (q.t === 'shift') {
      m = a + p; n = b + qq; sol = { a: a, b: b };
      tex = '(a ' + sg(p) + ')x + b ' + sg(qq) + ' = ' + ptex(D([m, n]));
      wrong = ask === 'a' ? { 'not-moved': m, 'moved-wrong': m + p, other: b } : { 'not-moved': n, 'moved-wrong': n + qq, other: a };
      expd = tex; eqs = 'a ' + sg(p) + ' = ' + m + ',\\quad b ' + sg(qq) + ' = ' + n;
      h2 = '$x$의 계수끼리 견주면 $a ' + sg(p) + ' = ' + m + '$, 상수항끼리 견주면 $b ' + sg(qq) + ' = ' + n + '$' + pj(n, '이에요/예요') + '. 구하는 문자가 든 식을 일차방정식으로 풀어요. 수를 반대쪽으로 넘길 때 부호가 바뀌는 것에 주의해요.';
    } else if (q.t === 'expand1') {
      sol = { a: k, b: k * p + qq }; ask = 'b';
      tex = 'ax + b = ' + k + '(x ' + sg(p) + ') ' + sg(qq);
      wrong = { 'no-dist': p + qq, 'no-const': k * p, other: k, 'const-only': qq };
      expd = 'ax + b = ' + ptex(D([k, k * p + qq])); eqs = 'a = ' + k + ',\\quad b = ' + (k * p + qq);
      h2 = '오른쪽의 괄호를 먼저 풀어요. 괄호 앞의 ' + k + pj(k, '을/를') + ' 괄호 안의 두 항에 모두 곱한 다음, 상수항끼리 모아요. 그러면 오른쪽이 「(수)x + (수)」 꼴이 돼요. 왼쪽의 $a$는 $x$의 계수와, $b$는 상수항과 같아요.';
    } else if (q.t === 'two') {
      m = a + b; n = a * p + b * qq; sol = { a: a, b: b };
      tex = 'a(x ' + sg(p) + ') + b(x ' + sg(qq) + ') = ' + ptex(D([m, n]));
      wrong = ask === 'a' ? { other: b, sum: m, 'one-only': whole(n, p), 'half': whole(m, 2) } : { other: a, sum: m, 'one-only': whole(n, qq), 'half': whole(m, 2) };
      expd = '(a + b)x + ' + '(' + poly([[p, 'a'], [qq, 'b']]) + ') = ' + ptex(D([m, n])); eqs = 'a + b = ' + m + ',\\quad ' + poly([[p, 'a'], [qq, 'b']]) + ' = ' + n;
      h2 = '왼쪽을 전개하면 $x$가 붙은 항은 $ax$와 $bx$, 상수항은 $' + poly([[p, 'a'], [qq, 'b']]) + '$예요. $x$의 계수끼리 견주면 $a + b = ' + m + '$, 상수항끼리 견주면 $' + poly([[p, 'a'], [qq, 'b']]) + ' = ' + n + '$. 두 식을 연립해서 풀어요. 한 문자를 없애려면 한 식에 수를 곱해 계수를 맞춘 다음 빼요.';
    } else if (q.t === 'quad') {
      m = a + p; b = a * p; sol = { a: a, b: b };
      tex = '(x + a)(x ' + sg(p) + ') = x^{2} ' + sg(m) + 'x + b';
      wrong = ask === 'a' ? { 'not-moved': m, 'moved-wrong': m + p, other: b } : { 'sum-for-product': m, other: a, 'p-squared': p * p };
      expd = 'x^{2} + (a ' + sg(p) + ')x ' + (p < 0 ? '- ' : '+ ') + (abs(p) === 1 ? '' : abs(p)) + 'a = x^{2} ' + sg(m) + 'x + b'; eqs = 'a ' + sg(p) + ' = ' + m + ',\\quad ' + poly([[p, 'a']]) + ' = b';
      h2 = '왼쪽 $(x + a)(x ' + sg(p) + ')$' + pj(p, '을/를') + ' 전개하면 $x^{2} + (a ' + sg(p) + ')x ' + (p < 0 ? '- ' : '+ ') + (abs(p) === 1 ? '' : abs(p)) + 'a$가 돼요. $x$의 계수와 상수항을 오른쪽과 견줘요. 먼저 $x$의 계수에서 $a$를 구하고, 그 값을 상수항의 식에 넣어 $b$를 구해요.';
    } else {
      A2 = a; B2 = b - 2 * a * h; C2 = a * h * h - b * h + c; sol = { a: a, b: b, c: c };
      tex = 'a(x ' + sg(-h) + ')^{2} + b(x ' + sg(-h) + ') + c = ' + ptex(D([A2, B2, C2]));
      wrong = ask === 'b' ? { 'not-moved': B2, 'no-double': B2 + a * h, other: c, 'moved-wrong': B2 - 2 * a * h } : { 'not-moved': C2, 'b-ignored': C2 - a * h * h, other: b, 'moved-wrong': C2 + a * h * h + b * h };
      expd = 'ax^{2} + (' + poly([[-2 * h, 'a'], [1, 'b']]) + ')x + (' + poly([[h * h, 'a'], [-h, 'b'], [1, 'c']]) + ') = ' + ptex(D([A2, B2, C2]));
      eqs = 'a = ' + A2 + ',\\quad ' + poly([[-2 * h, 'a'], [1, 'b']]) + ' = ' + B2 + ',\\quad ' + poly([[h * h, 'a'], [-h, 'b'], [1, 'c']]) + ' = ' + C2;
      h2 = '왼쪽을 전개해요. $(x ' + sg(-h) + ')^{2}$을 먼저 전개하고 $a$를 곱해요. 그다음 $b(x ' + sg(-h) + ')$' + pj(h, '을/를') + ' 전개해서 더해요. $x^{2}$의 계수에서 $a$가 바로 나오고, $x$의 계수에서 $b$, 상수항에서 $c$가 차례로 나와요. 앞에서 구한 값을 다음 식에 넣어 가며 풀어요.';
    }
    return { tex: tex, text: ID_TEXT + '상수 $' + ask + '$의 값을 구하세요.', ans: sol[ask], wrong: wrong, check: Object.keys(sol).every(function (key2) { return sol[key2] !== 0; }),
      steps: [{ say: '괄호가 있는 쪽을 전개해서 $x$에 대하여 내림차순으로 정리해요.', tex: expd }, { say: '양쪽에서 같은 차수의 항끼리 계수가 같다고 놓아요.', tex: eqs },
        { say: '식을 풀어 문자의 값을 구해요.', tex: vals(sol) }, { say: '구하는 값이에요.', tex: String(sol[ask]) }],
      hints: [CO_KEY, h2, CO_LAST] };
  };
  var CO_MIS = [['not-moved', '오른쪽의 계수를 그대로 답했어요. 왼쪽의 같은 자리에는 문자 말고 다른 수도 함께 있어요. 그 수를 반대쪽으로 넘겨서 풀어요.'],
    ['moved-wrong', '수를 반대쪽으로 넘기면서 부호를 바꾸지 않았어요. 더해진 수는 빼고, 빼진 수는 더해서 넘겨요.'],
    ['other', '다른 문자의 값을 답했어요. 문제에서 구하라고 한 문자가 무엇인지 다시 확인해요.'],
    ['no-dist', '괄호 앞의 수를 괄호 안의 수에 곱하지 않았어요. 괄호 앞의 수는 괄호 안의 모든 항에 곱해요.'],
    ['no-const', '괄호를 풀기만 하고 뒤에 있는 수를 더하지 않았어요. 상수항끼리 모두 모아야 해요.'],
    ['const-only', '괄호 밖에 있는 수만 답했어요. 괄호를 풀 때 생기는 수도 상수항에 들어가요.'],
    ['sum', '두 문자의 합을 답했어요. $x$의 계수를 견준 식은 두 문자의 합만 알려 줘요. 상수항을 견준 식과 연립해서 풀어요.'],
    ['one-only', '상수항을 견줄 때 다른 문자가 든 항을 빠뜨렸어요. 두 괄호에서 나온 상수항을 모두 더해야 해요.'],
    ['half', '두 문자의 값이 같다고 생각해 합을 반으로 나눴어요. 두 문자는 서로 다른 수일 수 있어요. 식 두 개를 연립해서 풀어요.'],
    ['sum-for-product', '상수항 자리에 두 수의 합을 썼어요. $(x + a)(x + p)$의 상수항은 두 수의 곱이에요.'],
    ['p-squared', '괄호 안의 수를 제곱했어요. 상수항은 두 괄호의 상수끼리 곱한 값이에요.'],
    ['no-double', '제곱을 전개할 때 가운데 항의 2배를 빠뜨렸어요. $(x - h)^{2}$의 $x$의 계수는 $-2h$예요.'],
    ['b-ignored', '상수항에서 $b$가 든 항을 빠뜨렸어요. $b(x - h)$를 전개하면 상수항에 $-bh$가 생겨요.']];
  numQ({
    id: 'C02.coef', title: '계수 비교법', build: coefBuild, mistakes: CO_MIS,
    levels: [
      { name: '계수끼리 견주기', vars: { q: sampler(function (r) {
        if (r.int(0, 1)) return { t: 'shift', a: nz(r, -9, 9), b: nz(r, -9, 9), p: nz(r, -6, 6), q: nz(r, -6, 6), ask: r.pick(['a', 'b']) };
        return { t: 'expand1', k: pm(r, r.int(2, 6)), p: nz(r, -6, 6), q: nz(r, -9, 9) };
      }) } },
      { name: '문자가 둘 (연립해서 풀기)', vars: { q: sampler(function (r) { var p = nz(r, -4, 4), q; do { q = nz(r, -4, 4); } while (q === p); return { t: 'two', a: nz(r, -7, 7), b: nz(r, -7, 7), p: p, q: q, ask: r.pick(['a', 'b']) }; }) } },
      { name: '이차식의 항등식', vars: { q: sampler(function (r) {
        if (r.int(0, 1)) return { t: 'quad', a: nz(r, -7, 7), p: nz(r, -6, 6), ask: r.pick(['a', 'b']) };
        return { t: 'quad3', a: r.int(1, 3), b: nz(r, -6, 6), c: nz(r, -6, 6), h: nz(r, -3, 3), ask: r.pick(['b', 'c']) };
      }) } }
    ]
  });

  /* ── C02.subst 수치 대입법 ─────────────────────────── */
  var SB_KEY = '항등식은 $x$에 어떤 수를 넣어도 성립해요. 그러니 내가 계산하기 편한 수를 골라 넣어도 돼요. 괄호 하나가 0이 되는 수를 넣으면 그 괄호가 곱해진 항이 통째로 사라져서, 모르는 문자가 하나만 남아요. 자물쇠에 딱 맞는 열쇠를 고르는 것과 같아요. 이 방법을 수치 대입법이라고 해요.';
  var SB_LAST = '수를 넣을 때는 양쪽 모두에 넣어야 해요. 한쪽만 계산하고 끝내지 않도록 조심해요. 문자가 여러 개이면 넣는 수를 바꿔 가며 식을 하나씩 더 만들어요. 다 구한 뒤에는 쓰지 않은 다른 수를 넣어 양쪽이 같은지 확인해 봐요.';
  var LET = ['a', 'b', 'c', 'd', 'e'];
  var substBuild = function (q) {
    var p = q.p, qq = q.q, a = q.a, b = q.b, c = q.c, ask = q.ask, sol, R, tex, wrong, steps, n, s, d, names, target, ans, x0, lhsNum, h2, alt;
    var fp = '(x ' + sg(-p) + ')', fq = '(x ' + sg(-qq) + ')', ap = par(p), aq = par(qq);
    var sub = function (x) { return '$x = ' + x + '$' + pj(x, '을/를'); };
    if (q.t === 'q1' || q.t === 'q3') {
      if (q.t === 'q1') { R = [1, a - p - qq, p * qq - a * p + b]; sol = { a: a, b: b }; tex = ptex(D(R)) + ' = ' + fp + fq + ' + a' + fp + ' + b'; }
      else { R = [a, b - a * (p + qq), a * p * qq - b * p + c]; sol = { a: a, b: b, c: c }; tex = 'a' + fp + fq + ' + b' + fp + ' + c = ' + ptex(D(R)); }
      var last = q.t === 'q1' ? 'b' : 'c', mid = q.t === 'q1' ? 'a' : 'b', vp = horner(R, p), vq = horner(R, qq);
      wrong = ask === last ? { 'const-compared': R[2], other: sol[mid], 'sign-sub': horner(R, -p), 'other-root': vq }
        : { other: sol[last], 'no-divide': sol[mid] * (qq - p), 'last-forgotten': whole(vq, qq - p), 'sign-sub': whole(horner(R, -qq) - sol[last], -qq - p) };
      steps = [{ say: sub(p) + ' 넣어요. ' + '$' + fp + '$' + pj(p, '이/가') + ' 곱해진 항이 모두 0이 되어 $' + last + '$만 남아요.', tex: numLine(termsOf(R), ap) + ' = ' + last }];
      if (ask !== last) steps.push({ say: sub(qq) + ' 넣어요. 이번에는 $' + fq + '$' + pj(qq, '이/가') + ' 곱해진 항이 사라져요.', tex: numLine(termsOf(R), aq) + ' = ' + mid + ' \\times ' + par(qq - p) + ' + ' + last });
      steps.push({ say: '계산해서 문자의 값을 구해요.', tex: vals(ask === last ? (function () { var o = {}; o[last] = sol[last]; return o; })() : (function () { var o = {}; o[last] = sol[last]; o[mid] = sol[mid]; return o; })()) });
      steps.push({ say: '구하는 값이에요.', tex: String(sol[ask]) });
      h2 = '① ' + sub(p) + ' 넣어요. $' + fp + '$' + pj(p, '이/가') + ' 곱해진 항이 모두 0이 되어 맨 끝의 문자만 남아요. ② ' + sub(qq) + ' 넣어요. 이번에는 $' + fq + '$' + pj(qq, '이/가') + ' 곱해진 항이 사라져요. ①에서 구한 값을 넣으면 다음 문자가 나와요. ③ 음수를 넣을 때는 괄호로 묶어 계산해요.';
      return { tex: tex, text: ID_TEXT + '상수 $' + ask + '$의 값을 구하세요.', ans: sol[ask], wrong: wrong, steps: steps, hints: [SB_KEY, h2, SB_LAST],
        check: p !== qq && Object.keys(sol).every(function (k2) { return sol[k2] !== 0; }) && sameVal(tex.split(' = ')[0].replace(/a/g, '(' + a + ')').replace(/b/g, '(' + b + ')').replace(/c/g, '(' + c + ')'), tex.split(' = ')[1].replace(/a/g, '(' + a + ')').replace(/b/g, '(' + b + ')').replace(/c/g, '(' + c + ')')) };
    }
    /* 계수의 합: (px + q)^n = ax^n + … */
    n = q.n; names = LET.slice(0, n + 1); s = p + qq; d = p - qq;
    tex = '(' + ptex(D([p, qq])) + ')^{' + n + '} = ' + pK(names.map(function (l, i) { return [l, n - i]; }));
    if (ask === 'all') { target = names.join(' + '); ans = ipow(s, n); x0 = 1; wrong = { 'ends-only': ipow(p, n) + ipow(qq, n), 'no-power': s, 'times-n': n * s, 'alt-mixed': ipow(d, n) }; }
    else if (ask === 'alt') { target = names.map(function (l, i) { return (i ? (i % 2 ? ' - ' : ' + ') : '') + l; }).join(''); ans = ipow(d, n); x0 = -1; wrong = { 'all-mixed': ipow(s, n), 'no-power': d, 'times-n': n * d, 'ends-only': ipow(p, n) - ipow(qq, n) }; }
    else { target = names[n]; ans = ipow(qq, n); x0 = 0; wrong = { 'no-power': qq, 'times-n': n * qq, 'all-mixed': ipow(s, n), 'lead-mixed': ipow(p, n) }; }
    lhsNum = '(' + (x0 === 0 ? p + ' \\times 0' : x0 === 1 ? p + ' \\times 1' : p + ' \\times (-1)') + ' ' + sg(qq) + ')^{' + n + '}';
    alt = names.map(function (l, i) { return ((n - i) % 2 ? (i ? ' - ' : '-') : (i ? ' + ' : '')) + l; }).join('');
    steps = [{ say: (x0 === 1 ? '오른쪽에 $x = 1$을 넣으면 $x$의 거듭제곱이 모두 1이 되어 계수의 합만 남아요. 양쪽에 $x = 1$을 넣어요.' : x0 === -1 ? '부호가 번갈아 나오는 합은 $x = -1$을 넣으면 나와요. 양쪽에 $x = -1$을 넣어요.' : '상수항은 $x = 0$을 넣으면 나와요. 양쪽에 $x = 0$을 넣어요.'),
      tex: lhsNum + ' = ' + (x0 === 1 ? target : x0 === -1 ? alt : names[n]) }];
    if (x0 === -1 && n % 2 === 1) steps.push({ say: '오른쪽이 구하는 식과 부호가 정반대예요. 양쪽에 $-1$을 곱해요.', tex: target + ' = -' + powNum(qq - p, n) });
    steps.push({ say: '괄호 안을 먼저 계산하고 거듭제곱해요.', tex: (x0 === -1 && n % 2 === 1 ? '-' : '') + powNum(x0 === 1 ? s : x0 === -1 ? qq - p : qq, n) + ' = ' + ans });
    h2 = x0 === 1 ? '계수를 하나하나 구하지 않아도 돼요. 오른쪽에 $x = 1$을 넣으면 $x$의 거듭제곱이 모두 1이 되어 계수만 남아요. 그 합이 바로 구하는 값이에요. 왼쪽에도 똑같이 $x = 1$을 넣어 계산해요. 괄호 안을 먼저 계산하고 거듭제곱해요.'
      : x0 === -1 ? '부호가 번갈아 나오는 합은 $x = -1$을 넣으면 나와요. $-1$은 짝수 번 곱하면 $1$, 홀수 번 곱하면 $-1$이 되어 항마다 부호가 번갈아 바뀌어요. 오른쪽에 $x = -1$을 넣은 식이 구하는 식과 부호가 정반대이면 양쪽에 $-1$을 곱해요. 왼쪽에도 $x = -1$을 넣어요.'
        : '상수항은 $x = 0$을 넣으면 나와요. $x$가 붙은 항이 모두 0이 되어 상수항만 남기 때문이에요. 왼쪽에도 $x = 0$을 넣어요. 괄호 안에 남은 수를 지수만큼 거듭제곱해요. 음수를 거듭제곱할 때는 부호를 잘 따져요.';
    return { tex: tex, text: ID_TEXT + (ask === 'const' ? '상수 $' + target + '$의 값을 구하세요.' : '$' + target + '$의 값을 구하세요.'), ans: ans, wrong: wrong, steps: steps, hints: [SB_KEY, h2, SB_LAST], check: s !== 0 && d !== 0 };
  };
  numQ({
    id: 'C02.subst', title: '수치 대입법', build: substBuild,
    mistakes: [['const-compared', '오른쪽(또는 왼쪽)의 상수항을 그대로 답했어요. 괄호를 전개하면 상수항에 다른 수도 섞여요. 괄호가 0이 되는 수를 넣어서 구해요.'],
      ['other', '다른 문자의 값을 답했어요. 문제에서 구하라고 한 문자가 무엇인지 다시 확인해요.'],
      ['sign-sub', '넣는 수의 부호를 반대로 했어요. $(x - 2)$를 0으로 만드는 수는 2이고, $(x + 2)$를 0으로 만드는 수는 $-2$예요.'],
      ['other-root', '다른 괄호가 0이 되는 수를 넣은 값을 답했어요. 구하는 문자만 남으려면 그 문자 앞의 항들이 사라지는 수를 넣어야 해요.'],
      ['no-divide', '문자 앞에 곱해진 수로 나누지 않았어요. 수를 넣으면 문자에 수가 곱해진 꼴이 되니, 마지막에 그 수로 나눠요.'],
      ['last-forgotten', '먼저 구한 문자의 값을 빼지 않았어요. 두 번째 수를 넣은 식에는 앞에서 구한 문자도 들어 있어요.'],
      ['ends-only', '첫 항과 끝 항만 거듭제곱했어요. 수를 넣은 다음에는 괄호 안을 먼저 계산하고, 그 결과를 통째로 거듭제곱해요.'],
      ['no-power', '괄호 안만 계산하고 거듭제곱을 하지 않았어요. 괄호 밖의 지수만큼 거듭제곱해야 해요.'],
      ['times-n', '거듭제곱 대신 지수를 곱했어요. 거듭제곱은 같은 수를 여러 번 곱하는 것이에요.'],
      ['alt-mixed', '$x = -1$을 넣은 값을 답했어요. 모든 계수의 합은 $x = 1$을 넣어야 나와요.'],
      ['all-mixed', '$x = 1$을 넣은 값을 답했어요. $x = 1$을 넣으면 모든 계수의 합이 나와요. 구하는 식에 맞는 수를 넣어요.'],
      ['lead-mixed', '$x$의 계수를 거듭제곱했어요. 상수항은 $x = 0$을 넣어서, 괄호 안의 상수만 거듭제곱해요.']],
    levels: [
      { name: '괄호가 0이 되는 수 넣기', vars: { q: sampler(function (r) { var p = nz(r, -4, 4), q; do { q = nz(r, -4, 4); } while (q === p); return { t: 'q1', p: p, q: q, a: nz(r, -6, 6), b: nz(r, -9, 9), ask: 'b' }; }) } },
      { name: '수를 두 번 넣기', vars: { q: sampler(function (r) {
        var p = nz(r, -3, 3), q; do { q = nz(r, -3, 3); } while (q === p);
        if (r.int(0, 1)) return { t: 'q1', p: p, q: q, a: nz(r, -6, 6), b: nz(r, -9, 9), ask: 'a' };
        return { t: 'q3', p: p, q: q, a: r.int(1, 3), b: nz(r, -6, 6), c: nz(r, -9, 9), ask: r.pick(['b', 'c']) };
      }) } },
      { name: '계수의 합', minDistinct: 100, vars: { q: sampler(function (r) { return { t: 'sum', p: r.int(1, 3), q: nz(r, -5, 5), n: r.int(2, 4), ask: r.pick(['all', 'all', 'alt', 'const']) }; }) } }
    ]
  });

  /* ── C02.remainder 나머지정리 ───────────────────────── */
  var RM_KEY = '다항식 $P(x)$를 $x - a$로 나눈 나머지는 $P(a)$예요. 직접 나누지 않고 수를 한 번 넣기만 하면 돼요. 이유는 검산식에 있어요. $P(x) = (x - a)Q(x) + R$에 $x = a$를 넣으면 $(x - a)$가 0이 되어 $R$만 남아요. 이것을 나머지정리라고 해요.';
  var RM_LAST = '넣는 수의 부호를 가장 많이 틀려요. $x - 2$로 나누면 2를, $x + 2$로 나누면 $-2$를 넣어요. 「나누는 식을 0으로 만드는 수」라고 기억하면 헷갈리지 않아요. 음수를 홀수 번 곱하면 음수, 짝수 번 곱하면 양수예요.';
  /** 분수 num/den 을 넣은 값이 정수이면 그 값 */
  var evalRat = function (cs, num, den) { var n = cs.length - 1, N = 0; cs.forEach(function (c, i) { N += c * ipow(num, n - i) * ipow(den, i); }); return whole(N, ipow(den, n)); };
  var remBuild = function (q) {
    var r = q.r, P, R, Bt, fr, at, k, j, d, S, pw, ts, need;
    if (q.t === 'lin') {
      P = q.P; R = horner(P, r); Bt = 'x ' + sg(-r);
      return { tex: 'P(x) = ' + ptex(D(P)), text: '다항식 $P(x)$를 $' + Bt + '$' + pj(r, '으로/로') + ' 나누었을 때의 나머지를 구하세요.', ans: R, check: P[P.length - 1] !== 0,
        wrong: { 'sign-sub': horner(P, -r), 'const-kept': P[P.length - 1], 'coef-sum': horner(P, 1), 'lead-only': ipow(r, P.length - 1) * P[0] },
        steps: [{ say: '나누는 식 $' + Bt + '$' + pj(r, '을/를') + ' 0으로 만드는 수는 $' + r + '$' + pj(r, '이에요/예요') + '. 나머지정리에 따라 그 수를 $P(x)$에 넣어요.', tex: 'P(' + r + ') = ' + numLine(termsOf(P), par(r)) }, { say: '거듭제곱, 곱셈, 덧셈과 뺄셈의 차례로 계산해요.', tex: String(R) }],
        hints: [RM_KEY, '① 나누는 식 $' + Bt + '$' + pj(r, '을/를') + ' 0으로 만드는 수를 찾아요. $' + Bt + ' = 0$에서 $x = ' + r + '$' + pj(r, '이에요/예요') + '. 식에 보이는 부호와 반대가 되는 것에 주의해요. ② $P(x)$의 $x$ 자리마다 그 수를 넣어요. 음수는 괄호로 묶어요. ③ 거듭제곱 → 곱셈 → 덧셈과 뺄셈의 차례로 계산해요.', RM_LAST] };
    }
    if (q.t === 'frac') {
      P = dadd(dmul(q.B, q.Q), [q.R], 1, 1); R = q.R; Bt = ptex(D(q.B));
      fr = (-q.B[1] * q.B[0] < 0 ? '-' : '') + '\\dfrac{' + abs(q.B[1]) + '}{' + q.B[0] + '}'; at = '\\left(' + fr + '\\right)';
      return { tex: 'P(x) = ' + ptex(D(P)), text: '다항식 $P(x)$를 $' + Bt + '$' + pj(q.B[1], '으로/로') + ' 나누었을 때의 나머지를 구하세요.', ans: R, check: evalRat(P, -q.B[1], q.B[0]) === R && P[P.length - 1] !== 0,
        wrong: { 'not-divided': horner(P, -q.B[1]), 'sign-sub': evalRat(P, q.B[1], q.B[0]), 'const-kept': P[P.length - 1], 'b-direct': horner(P, q.B[1]) },
        steps: [{ say: '나누는 식이 0이 되는 수를 찾아요. 일차방정식을 풀면 분수가 나와요.', tex: Bt + ' = 0,\\quad x = ' + fr }, { say: '나머지정리에 따라 그 수를 $P(x)$에 넣어요.', tex: 'P' + at + ' = ' + numLine(termsOf(P), at) }, { say: '분수의 거듭제곱은 분자와 분모를 각각 거듭제곱해요. 약분하면서 계산해요.', tex: String(R) }],
        hints: [RM_KEY, '① 나누는 식이 0이 되는 수를 찾아요. $' + Bt + ' = 0$을 풀면 $x$는 분수가 돼요. 수를 반대쪽으로 넘기고 $x$ 앞의 수로 나눠요. ② 그 분수를 $P(x)$의 $x$ 자리마다 넣어요. ③ 분수의 거듭제곱은 분자와 분모를 각각 거듭제곱해요. 계수와 약분하면 계산이 쉬워져요.',
          '나누는 식의 $x$ 앞에 수가 있어도 방법은 같아요. 「나누는 식을 0으로 만드는 수」를 넣으면 돼요. $x$ 앞의 수로 나누는 것을 잊고 상수항의 부호만 바꿔서 넣는 실수가 많아요. 나머지는 분수를 넣어도 깔끔한 정수로 나와요.'] };
    }
    /* find: 나머지가 주어졌을 때 k 구하기 */
    P = q.P; j = q.j; k = P[j]; d = P.length - 1 - j; R = horner(P, r); pw = ipow(r, d); S = R - k * pw; Bt = 'x ' + sg(-r);
    ts = termsOf(P).map(function (t, i) { return i === j ? ['k', t[1]] : t; }); need = R - S;
    return { tex: 'P(x) = ' + pK(ts), text: '다항식 $P(x)$를 $' + Bt + '$' + pj(r, '으로/로') + ' 나누었을 때의 나머지가 $' + R + '$일 때, 상수 $k$의 값을 구하세요.', ans: k, check: d >= 1 && R !== 0,
      wrong: { 'sign-sub': whole(R - (horner(P, -r) - k * ipow(-r, d)), ipow(-r, d)), 'zero-remainder': whole(-S, pw), 'no-divide': abs(pw) !== 1 ? need : null, 'moved-wrong': whole(R + S, pw) },
      steps: [{ say: '나머지정리에 따라 $P(' + r + ')$의 값이 나머지와 같아요. $x$ 자리에 $' + r + '$' + pj(r, '을/를') + ' 넣어 식을 세워요.', tex: numLine(ts, par(r)) + ' = ' + R },
        { say: '수끼리 계산해서 정리해요.', tex: poly([[pw, 'k'], [S, '']]) + ' = ' + R }, { say: '$k$에 대한 일차방정식을 풀어요.', tex: 'k = ' + k }],
      hints: [RM_KEY, '① 나머지정리로 식을 세워요. 나누는 식 $' + Bt + '$' + pj(r, '을/를') + ' 0으로 만드는 수를 $P(x)$에 넣은 값이 나머지 $' + R + '$' + pj(R, '과/와') + ' 같아요. ② 수를 넣으면 $k$가 든 일차방정식이 돼요. ③ 수끼리 먼저 계산하고, $k$가 든 항만 남겨서 풀어요.', RM_LAST] };
  };
  numQ({
    id: 'C02.remainder', title: '나머지정리', build: remBuild,
    mistakes: [['sign-sub', '넣는 수의 부호를 반대로 했어요. 나누는 식을 0으로 만드는 수를 넣어야 해요. $x - 2$이면 2, $x + 2$이면 $-2$예요.'],
      ['const-kept', '상수항을 그대로 답했어요. 상수항은 $x = 0$을 넣은 값이에요. 나누는 식을 0으로 만드는 수를 넣어요.'],
      ['coef-sum', '계수를 모두 더했어요. 그것은 $x = 1$을 넣은 값이에요. 나누는 식을 0으로 만드는 수를 넣어요.'],
      ['lead-only', '가장 높은 차수의 항만 계산했어요. 모든 항에 수를 넣고 다 더해야 해요.'],
      ['not-divided', '$x$ 앞의 수로 나누지 않은 수를 넣었어요. $2x - 1 = 0$을 풀면 $x = 1$이 아니라 $x = \\dfrac{1}{2}$이에요.'],
      ['b-direct', '나누는 식의 상수항을 그대로 넣었어요. 나누는 식이 0이 되는 수를 방정식을 풀어 구해요.'],
      ['zero-remainder', '나머지를 0으로 놓았어요. 나누어떨어지는 것이 아니에요. 수를 넣은 값이 문제에 나온 나머지와 같다고 놓아요.'],
      ['no-divide', '마지막에 $k$ 앞의 수로 나누지 않았어요. $k$에 곱해진 수로 양쪽을 나눠야 $k$가 나와요.'],
      ['moved-wrong', '수를 반대쪽으로 넘기면서 부호를 바꾸지 않았어요. 더해진 수는 빼고, 빼진 수는 더해서 넘겨요.']],
    levels: [
      { name: '일차식 x − a로 나눈 나머지', vars: { q: sampler(function (r) { return { t: 'lin', r: nz(r, -3, 3), P: r.int(0, 1) ? [r.int(1, 3), nz(r, -6, 6), nz(r, -9, 9)] : [r.int(1, 2), r.int(-5, 5), r.int(-6, 6), nz(r, -9, 9)] }; }) } },
      { name: '일차식 ax + b로 나눈 나머지', vars: { q: sampler(function (r) { return { t: 'frac', B: r.pick([[2, 1], [2, -1], [2, 3], [2, -3], [3, 1], [3, -1], [3, 2], [3, -2]]), Q: r.int(0, 1) ? [r.int(1, 2), nz(r, -4, 4)] : [1, nz(r, -3, 3), nz(r, -4, 4)], R: nz(r, -9, 9) }; }) } },
      { name: '나머지로 모르는 계수 구하기', vars: { q: sampler(function (r) { var cubic = r.int(0, 1) === 1; return { t: 'find', r: nz(r, -3, 3), P: cubic ? [1, nz(r, -5, 5), nz(r, -6, 6), nz(r, -9, 9)] : [r.int(1, 3), nz(r, -6, 6), nz(r, -9, 9)], j: cubic ? r.int(1, 2) : 1 }; }) } }
    ]
  });

  /* ── C02.isfactor 인수 찾기 ─────────────────────────── */
  var F_KEY = '어떤 수가 12의 약수인지 알려면 12를 그 수로 나눠서 나머지가 0인지 보면 돼요. 다항식도 같아요. $P(x)$를 $x - a$로 나눈 나머지가 0이면 $x - a$는 $P(x)$의 인수예요. 그런데 나머지정리에서 그 나머지는 $P(a)$였어요. 그래서 $P(a) = 0$이면 $x - a$가 인수예요. 이것을 인수정리라고 해요.';
  var isfBuild = function (q) {
    var P = q.P, not = q.mode === 'not', cs = q.c, ot = function (c) { return 'x ' + sg(-c); }, pv = function (c) { return 'P(' + c + ') = ' + horner(P, c); }, ans = cs[0], wrong;
    wrong = cs.slice(1).map(function (c, i) {
      if (not) return [ot(c), 'is-factor-' + LET[i], '$' + pv(c) + '$. 값이 0이니 이 식은 인수가 맞아요. 인수가 아닌 것을 골라야 해요.'];
      if (c === -ans) return [ot(c), 'sign-flipped', '부호를 반대로 봤어요. $' + ot(c) + '$' + pj(c, '이/가') + ' 인수인지 보려면 $' + c + '$' + pj(c, '을/를') + ' 넣어야 해요. $' + pv(c) + '$. 값이 0이 아니에요.'];
      return [ot(c), 'not-zero-' + LET[i], '$' + pv(c) + '$. 값이 0이 아니에요. 넣은 값이 0이 될 때만 그 일차식이 인수예요.'];
    });
    return { tex: 'P(x) = ' + ptex(D(P)), text: not ? '다음 중 다항식 $P(x)$의 인수가 아닌 것을 고르세요.' : '다음 중 다항식 $P(x)$의 인수인 것을 고르세요.', ans: ot(ans), wrong: wrong,
      check: cs.every(function (c, i) { return c !== 0 && cs.indexOf(c) === i && (horner(P, c) === 0) === (i === 0 ? !not : not); }) && P[P.length - 1] !== 0 && D(P).length >= 2,
      steps: [{ say: '인수정리: $P(a) = 0$이면 $x - a$가 $P(x)$의 인수예요. 보기마다 그 식을 0으로 만드는 수를 넣어 봐요.', tex: [q.o.indexOf(0), q.o.indexOf(1)].sort().map(function (i) { return pv(cs[q.o[i]]); }).join(',\\quad ') },
        { say: '나머지 보기도 같은 방법으로 넣어 봐요.', tex: [q.o.indexOf(2), q.o.indexOf(3)].sort().map(function (i) { return pv(cs[q.o[i]]); }).join(',\\quad ') },
        { say: not ? '넣은 값이 0이 되지 않는 것은 하나뿐이에요. 그 식은 인수가 아니에요.' : '넣은 값이 0이 되는 것은 하나뿐이에요. 그 식이 인수예요.', tex: ot(ans) }],
      hints: [F_KEY,
        '보기마다 그 식을 0으로 만드는 수를 찾아요. $x - 2$이면 2, $x + 2$이면 $-2$예요. 그 수를 $P(x)$의 $x$ 자리마다 넣어서 계산해요. 값이 0이면 인수이고, 0이 아니면 인수가 아니에요. 음수는 괄호로 묶어서 넣어요.',
        '넣어 볼 수를 줄이는 요령이 있어요. $P(a) = 0$이 되는 정수 $a$는 상수항의 약수 가운데에 있어요. 이 문제의 상수항($' + P[P.length - 1] + '$)의 약수가 아닌 수는 넣어 볼 필요가 없어요. 넣을 때는 부호를 조심해요. 음수를 짝수 번 곱하면 양수, 홀수 번 곱하면 음수예요.'] };
  };
  var CAND = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5];
  var isfQ = function (level) {
    return sampler(function (r) {
      var root, P, pool, cs, roots;
      if (level === 2) {
        roots = r.shuffle([1, -1, 2, -2, 3, -3, 4, -4]).slice(0, 3); P = roots.reduce(function (p, x) { return dmul(p, [1, -x]); }, [1]);
        pool = r.shuffle(CAND.filter(function (c) { return roots.indexOf(c) < 0; }));
        return { mode: 'not', P: P, c: [pool[0]].concat(roots), o: order4(r) };
      }
      root = r.pick([1, -1, 2, -2, 3, -3, 4, -4]);
      P = dmul([1, -root], level === 0 ? [r.int(1, 2), nz(r, -5, 5)] : [1, nz(r, -4, 4), nz(r, -4, 4)]);
      pool = r.shuffle(CAND.filter(function (c) { return c !== root && c !== -root && horner(P, c) !== 0; }));
      cs = (r.int(0, 1) && horner(P, -root) !== 0 ? [-root] : []).concat(pool).slice(0, 3);
      return { mode: 'is', P: P, c: [root].concat(r.shuffle(cs)), o: order4(r) };
    });
  };
  choiceQ({
    id: 'C02.isfactor', title: '인수 찾기 (인수정리)', build: isfBuild,
    ids: ['sign-flipped', 'not-zero-a', 'not-zero-b', 'not-zero-c', 'is-factor-a', 'is-factor-b', 'is-factor-c'],
    levels: [{ name: '이차식의 인수', minDistinct: 80, vars: { q: isfQ(0) } }, { name: '삼차식의 인수', vars: { q: isfQ(1) } }, { name: '인수가 아닌 것 찾기', minDistinct: 45, vars: { q: isfQ(2) } }]
  });

  /* ── C02.factor 인수정리로 모르는 계수 구하기 ─────────────── */
  var FC_LAST = '식을 세운 다음에는 일차방정식일 뿐이에요. 거듭제곱을 먼저 계산하고, 수끼리 모으고, 마지막에 문자 앞의 수로 나눠요. 구한 값을 넣어 다시 계산했을 때 0이 나오는지 확인하면 틀릴 일이 없어요.';
  var facBuild = function (q) {
    var P = q.P, n = P.length - 1, r = q.r, j, d, k, pw, S, ts, Bt, r2, ia, ib, da, db, sol, eq, solve2, alt, one, ask;
    if (q.t === 'one') {
      j = q.j; d = n - j; k = P[j]; pw = ipow(r, d); S = -k * pw; Bt = 'x ' + sg(-r);
      ts = termsOf(P).map(function (t, i) { return i === j ? ['k', t[1]] : t; });
      return { tex: 'P(x) = ' + pK(ts), text: '다항식 $P(x)$가 $' + Bt + '$' + pj(r, '으로/로') + ' 나누어떨어질 때, 상수 $k$의 값을 구하세요.', ans: k, check: horner(P, r) === 0,
        wrong: { 'sign-sub': whole(-(horner(P, -r) - k * ipow(-r, d)), ipow(-r, d)), 'no-divide': abs(pw) !== 1 ? -S : null, 'power-ignored': d >= 2 ? whole(-S, r) : null, 'const-forgotten': j !== n ? whole(-(S - P[n]), pw) : null, 'one-remainder': whole(1 - S, pw) },
        steps: [{ say: '나누어떨어지면 나머지가 0이에요. 인수정리에 따라 $P(' + r + ') = 0$' + '. $x$ 자리에 $' + r + '$' + pj(r, '을/를') + ' 넣어 식을 세워요.', tex: numLine(ts, par(r)) + ' = 0' },
          { say: '수끼리 계산해서 정리해요.', tex: poly([[pw, 'k'], [S, '']]) + ' = 0' }, { say: '$k$에 대한 일차방정식을 풀어요.', tex: 'k = ' + k }],
        hints: [F_KEY, '① 「나누어떨어진다」는 나머지가 0이라는 뜻이에요. ② 나누는 식 $' + Bt + '$' + pj(r, '을/를') + ' 0으로 만드는 수를 $P(x)$에 넣고, 그 값이 0이라고 식을 세워요. 식에 보이는 부호와 반대인 수를 넣는 것에 주의해요. ③ $k$가 든 항만 남기고 수를 반대쪽으로 넘겨 풀어요.', FC_LAST] };
    }
    r2 = q.r2; ia = q.ia; ib = q.ib; da = n - ia; db = n - ib; sol = { a: P[ia], b: P[ib] }; ask = q.ask;
    ts = termsOf(P).map(function (t, i) { return i === ia ? ['a', t[1]] : i === ib ? ['b', t[1]] : t; });
    eq = function (x) { return [ipow(x, da), ipow(x, db), horner(P, x) - P[ia] * ipow(x, da) - P[ib] * ipow(x, db)]; };
    solve2 = function (x, y) { var e = eq(x), f = eq(y), det = e[0] * f[1] - f[0] * e[1], A2 = whole(-e[2] * f[1] + f[2] * e[1], det), B2 = whole(-e[0] * f[2] + f[0] * e[2], det); return A2 === null || B2 === null ? null : { a: A2, b: B2 }; };
    alt = solve2(-r, -r2); one = ask === 'a' ? whole(-eq(r)[2], eq(r)[0]) : whole(-eq(r)[2], eq(r)[1]);
    return { tex: 'P(x) = ' + pK(ts), text: '다항식 $P(x)$가 $x ' + sg(-r) + '$' + pj(r, '과/와') + ' $x ' + sg(-r2) + '$' + pj(r2, '으로/로') + ' 모두 나누어떨어질 때, 상수 $' + ask + '$의 값을 구하세요.', ans: sol[ask],
      check: horner(P, r) === 0 && horner(P, r2) === 0 && r !== r2 && sol.a !== 0 && sol.b !== 0 && !!solve2(r, r2) && solve2(r, r2).a === sol.a && solve2(r, r2).b === sol.b,
      wrong: { other: sol[ask === 'a' ? 'b' : 'a'], 'sign-sub': alt ? alt[ask] : null, 'one-root-only': one, 'both-added': sol.a + sol.b },
      steps: [{ say: '인수정리에 따라 $P(' + r + ') = 0$, $P(' + r2 + ') = 0$' + '. 두 수를 하나씩 넣어 식을 두 개 세워요.', tex: [r, r2].map(function (x) { var e = eq(x); return poly([[e[0], 'a'], [e[1], 'b'], [e[2], '']]) + ' = 0'; }).join(',\\quad ') },
        { say: '두 식을 연립해서 풀어요.', tex: vals(sol) }, { say: '구하는 값이에요.', tex: String(sol[ask]) }],
      hints: [F_KEY, '① 두 식으로 모두 나누어떨어지니, 두 식을 각각 0으로 만드는 수를 넣으면 둘 다 0이 돼요. 넣을 수는 $' + r + '$' + pj(r, '과/와') + ' $' + r2 + '$' + pj(r2, '이에요/예요') + '. ② 수를 하나씩 넣어 $a$와 $b$가 든 식을 두 개 세워요. ③ 두 식을 연립방정식으로 풀어요. 두 식을 빼면 한 문자가 없어지는 경우가 많아요.', FC_LAST] };
  };
  numQ({
    id: 'C02.factor', title: '인수정리로 계수 구하기', build: facBuild,
    mistakes: [['sign-sub', '넣는 수의 부호를 반대로 했어요. 나누는 식을 0으로 만드는 수를 넣어야 해요. $x - 2$이면 2, $x + 2$이면 $-2$예요.'],
      ['no-divide', '마지막에 문자 앞의 수로 나누지 않았어요. 문자에 곱해진 수로 양쪽을 나눠야 답이 나와요.'],
      ['power-ignored', '수를 넣을 때 거듭제곱을 하지 않았어요. $x^{2}$ 자리에는 넣는 수의 제곱이 들어가요.'],
      ['const-forgotten', '상수항을 빠뜨리고 계산했어요. 모든 항에 수를 넣고 상수항까지 더해야 해요.'],
      ['one-remainder', '넣은 값을 1로 놓았어요. 나누어떨어지면 나머지가 0이에요. 넣은 값을 0으로 놓고 풀어요.'],
      ['other', '다른 문자의 값을 답했어요. 문제에서 구하라고 한 문자가 무엇인지 다시 확인해요.'],
      ['one-root-only', '식 하나만 세우고, 다른 문자가 든 항을 빼고 풀었어요. 문자가 둘이니 수 두 개를 넣어 식을 두 개 세우고 연립해서 풀어요.'],
      ['both-added', '두 문자의 값을 더해서 답했어요. 문제에서 구하라고 한 문자 하나의 값만 답해요.']],
    levels: [
      { name: '이차식', minDistinct: 120, vars: { q: sampler(function (r) { var x = nz(r, -4, 4); return { t: 'one', r: x, P: dmul([1, -x], [r.int(1, 3), nz(r, -6, 6)]), j: r.int(1, 2) }; }) } },
      { name: '삼차식', vars: { q: sampler(function (r) { var x = nz(r, -3, 3); return { t: 'one', r: x, P: dmul([1, -x], [1, nz(r, -4, 4), nz(r, -5, 5)]), j: r.int(1, 3) }; }) } },
      { name: '문자가 둘 (두 식으로 나누어떨어짐)', vars: { q: sampler(function (r) {
        var x = nz(r, -3, 3), y, ij = r.pick([[1, 2], [1, 3], [2, 3]]); do { y = nz(r, -3, 3); } while (y === x);
        return { t: 'two', r: x, r2: y, P: dmul(dmul([1, -x], [1, -y]), [1, nz(r, -4, 4)]), ia: ij[0], ib: ij[1], ask: r.pick(['a', 'b']) };
      }) } }
    ]
  });

  /* ── C02.synth 조립제법의 빈칸, C02.synthq 조립제법 읽기 ─────── */
  var SY_KEY = '조립제법은 일차식 $x - a$로 나눌 때 계수만 가지고 하는 빠른 나눗셈이에요. 맨 윗줄에는 나뉘는 식의 계수를 차례로 쓰고, 왼쪽에는 나누는 식을 0으로 만드는 수 $a$를 써요. 규칙은 두 가지뿐이에요. 대각선으로 올라갈 때는 곱하고, 세로로 내려올 때는 더해요. 맨 아랫줄의 마지막 수가 나머지, 그 앞의 수들이 몫의 계수예요.';
  var synth = function (cs, r) { var b = [cs[0]], m = [null], i; for (i = 1; i < cs.length; i++) { m.push(r * b[i - 1]); b.push(cs[i] + m[i]); } return { m: m, b: b }; };
  var tableTex = function (cs, r, s, blank) {
    var cell = function (row, i, v) { return blank && blank[0] === row && blank[1] === i ? '\\square' : String(v); };
    return '\\begin{array}{c|' + cs.map(function () { return 'c'; }).join('') + '} ' + r + ' & ' + cs.join(' & ') + ' \\\\ & & ' + s.m.slice(1).map(function (v, i) { return cell('m', i + 1, v); }).join(' & ')
      + ' \\\\ \\hline & ' + s.b.map(function (v, i) { return cell('b', i, v); }).join(' & ') + ' \\end{array}';
  };
  var divText = function (cs, r) { return '$(' + ptex(D(cs)) + ') \\div (x ' + sg(-r) + ')$' + pj(r, '을/를'); };
  var synBuild = function (q) {
    var cs = q.cs, r = q.r, s = synth(cs, r), row = q.cell[0], i = q.cell[1], ans = row === 'm' ? s.m[i] : s.b[i];
    return { tex: tableTex(cs, r, s, q.cell), text: '위의 표는 ' + divText(cs, r) + ' 조립제법으로 계산하는 과정이에요. □에 알맞은 수를 구하세요.', ans: ans, check: cs[0] !== 0 && i >= 1,
      wrong: row === 'm' ? { added: r + s.b[i - 1], 'used-top': r * cs[i - 1], 'top-copied': cs[i], 'below-copied': s.b[i - 1] } : { subtracted: cs[i] - s.m[i], 'top-copied': cs[i], multiplied: cs[i] * s.m[i], 'middle-copied': s.m[i] },
      steps: [{ say: '조립제법의 규칙은 두 가지예요. 맨 앞의 수는 그대로 내려요. 그다음부터는 「왼쪽 수를 곱해서 대각선 위로 올리고, 세로로 더해서 내린다」를 되풀이해요.', tex: tableTex(cs, r, s, q.cell) },
        row === 'm' ? { say: '□는 가운데 줄에 있어요. 왼쪽 맨 끝의 수와, □의 왼쪽 아래에 있는 아랫줄의 수를 곱해요.', tex: par(r) + ' \\times ' + par(s.b[i - 1]) + ' = ' + ans }
          : { say: '□는 맨 아랫줄에 있어요. □ 바로 위에 세로로 놓인 두 수를 더해요.', tex: cs[i] + ' + ' + par(s.m[i]) + ' = ' + ans }],
      hints: [SY_KEY,
        row === 'm' ? '□는 가운데 줄에 있어요. 가운데 줄의 수는 곱해서 만들어요. 왼쪽 맨 끝의 수 $' + r + '$' + pj(r, '과/와') + ' □의 왼쪽 아래 대각선에 있는 아랫줄의 수 $' + s.b[i - 1] + '$' + pj(s.b[i - 1], '을/를') + ' 곱해요. 부호가 다른 두 수의 곱은 음수, 같은 두 수의 곱은 양수예요.'
          : '□는 맨 아랫줄에 있어요. 아랫줄의 수는 더해서 만들어요. □ 바로 위에 세로로 놓인 두 수 $' + cs[i] + '$' + pj(cs[i], '과/와') + ' $' + s.m[i] + '$' + pj(s.m[i], '을/를') + ' 더해요. 빼는 것이 아니라 더하는 것이에요. 음수를 더할 때 부호를 조심해요.',
        '표의 맨 윗줄에는 나뉘는 식의 계수가 차수가 높은 것부터 놓여 있어요. 빠진 차수의 자리에는 0이 들어가요. 왼쪽 맨 끝의 수는 나누는 식을 0으로 만드는 수라서, 나누는 식에 보이는 부호와 반대예요. 「대각선은 곱하기, 세로는 더하기」만 기억하면 어느 칸이든 채울 수 있어요.'] };
  };
  var withZero = function (r, cs) { var i = r.int(1, cs.length - 2); cs[i] = 0; return cs; };
  numQ({
    id: 'C02.synth', title: '조립제법의 빈칸', build: synBuild,
    mistakes: [['added', '왼쪽의 수를 곱하지 않고 더했어요. 대각선으로 올라가는 칸은 곱해서 만들어요.'],
      ['used-top', '맨 윗줄의 수와 곱했어요. 왼쪽의 수와 곱하는 것은 바로 앞 칸의 「아랫줄」 수예요.'],
      ['top-copied', '윗줄의 수를 그대로 썼어요. 맨 앞의 수만 그대로 내리고, 나머지 칸은 곱하거나 더해서 만들어요.'],
      ['below-copied', '아랫줄의 수를 그대로 올렸어요. 올릴 때는 왼쪽 맨 끝의 수를 곱해야 해요.'],
      ['subtracted', '세로로 뺐어요. 조립제법에서는 세로로 놓인 두 수를 더해요. 빼는 것은 세로 나눗셈이에요.'],
      ['multiplied', '세로로 놓인 두 수를 곱했어요. 세로로 내려올 때는 더해요. 곱하는 것은 대각선으로 올라갈 때예요.'],
      ['middle-copied', '가운데 줄의 수를 그대로 내렸어요. 윗줄의 수와 더해서 내려야 해요.']],
    levels: [
      { name: '마지막 칸 (나머지)', vars: { q: sampler(function (r) { return { cs: [r.int(1, 2), nz(r, -5, 5), nz(r, -6, 6), nz(r, -9, 9)], r: nz(r, -3, 3), cell: ['b', 3] }; }) } },
      { name: '가운데 칸', vars: { q: sampler(function (r) { var cs = [r.int(1, 2), nz(r, -5, 5), nz(r, -6, 6), nz(r, -9, 9)]; if (r.int(0, 1)) withZero(r, cs); return { cs: cs, r: nz(r, -3, 3), cell: [r.pick(['m', 'b']), r.int(1, 3)] }; }) } },
      { name: '사차식', vars: { q: sampler(function (r) { var cs = [1, nz(r, -4, 4), nz(r, -5, 5), nz(r, -5, 5), nz(r, -9, 9)]; if (r.int(0, 1)) withZero(r, cs); return { cs: cs, r: nz(r, -2, 2), cell: [r.pick(['m', 'b']), r.int(2, 4)] }; }) } }
    ]
  });
  var sqBuild = function (q) {
    var cs = q.cs, r = q.r, s = synth(cs, r), n = cs.length - 1, Qc = s.b.slice(0, n), R = s.b[n], At = ptex(D(cs)), cands;
    cands = mixc([[D(s.b), 'degree-kept', '맨 아랫줄의 수를 모두 몫의 계수로 썼어요. 마지막 수는 나머지예요. 몫은 그 앞의 수들만 써요.']], [
      [D(s.b.slice(1)), 'first-dropped', '맨 앞의 수를 빼고 읽었어요. 떼어 놓아야 하는 것은 맨 끝에 있는 나머지예요.'],
      [D(s.m.slice(1)), 'middle-row', '가운데 줄을 읽었어요. 몫의 계수는 맨 아랫줄에 있어요. 가운데 줄은 계산하는 도중에 쓰는 수예요.'],
      [D(cs.slice(0, n)), 'top-row', '맨 윗줄을 읽었어요. 윗줄은 나뉘는 식의 계수예요. 몫의 계수는 맨 아랫줄에 있어요.'],
      [D(Qc.concat([0])), 'degree-high', '차수를 낮추지 않았어요. 일차식으로 나누면 몫의 차수는 나뉘는 식보다 1 낮아요.'],
      [D(Qc.map(function (c, i) { return i === Qc.length - 1 ? c + R : c; })), 'remainder-added', '나머지를 몫의 마지막 항에 더했어요. 나머지는 몫과 따로 떼어 놓아요.']
    ], q.perm);
    return finish({ raw: At, same: '(x ' + sg(-r) + ')(' + ptex(D(Qc)) + ') + (' + R + ')', ans: D(Qc), cands: cands, ok: cs[0] !== 0 && D(Qc).length >= 2,
      tex: tableTex(cs, r, s, null), text: '위의 표는 ' + divText(cs, r) + ' 조립제법으로 계산한 것이에요. 몫을 고르세요.',
      steps: [{ say: '맨 아랫줄에서 마지막 수는 나머지예요. 그 앞의 수들이 몫의 계수예요.', tex: Qc.join(',\\ ') + '\\ \\mid\\ ' + R },
        { say: '나뉘는 식이 ' + n + '차식이니 몫은 ' + (n - 1) + '차식이에요. 차수가 높은 항부터 계수를 붙여요. 계수가 0인 항은 쓰지 않아요.', tex: ptex(D(Qc)) }],
      hints: [SY_KEY,
        '표를 읽는 차례예요. ① 맨 아랫줄만 봐요. ② 맨 끝의 수 하나는 나머지라서 따로 떼어 놓아요. ③ 남은 수가 몫의 계수예요. 나뉘는 식이 ' + n + '차식이니, 몫은 그보다 1 낮은 ' + (n - 1) + '차식이에요. 남은 수의 맨 앞부터 차수가 높은 항의 계수로 써요.',
        '아랫줄에 0이 있으면 그 차수의 항은 없는 것이에요. 건너뛰지 말고 자리를 지켜서 차수를 붙여요. 다 읽은 다음에는 검산식 (나누는 식) × (몫) + (나머지)를 떠올려 봐요. 가장 높은 차수의 항이 나뉘는 식과 맞는지만 봐도 실수를 잡을 수 있어요.'] });
  };
  choiceQ({
    id: 'C02.synthq', title: '조립제법 읽기', build: sqBuild, ids: ['degree-kept', 'first-dropped', 'middle-row', 'top-row', 'degree-high', 'remainder-added'],
    levels: [
      { name: '삼차식', vars: { q: sampler(function (r) { return withOrder(r, { cs: [r.int(1, 2), nz(r, -5, 5), nz(r, -6, 6), nz(r, -9, 9)], r: nz(r, -3, 3) }); }) } },
      { name: '빠진 항이 있는 식', vars: { q: sampler(function (r) { return withOrder(r, { cs: withZero(r, [r.int(1, 2), nz(r, -5, 5), nz(r, -6, 6), nz(r, -9, 9)]), r: nz(r, -3, 3) }); }) } },
      { name: '사차식', vars: { q: sampler(function (r) { var cs = [1, nz(r, -4, 4), nz(r, -5, 5), nz(r, -5, 5), nz(r, -9, 9)]; if (r.int(0, 1)) withZero(r, cs); return withOrder(r, { cs: cs, r: nz(r, -2, 2) }); }) } }
    ]
  });
  function withOrder(r, q) { q.perm = perm6(r); q.o = order4(r); return q; }
})();

/* ── 개념 카드 ── */
MH.defineConcept('C02', [
  { title: '항등식이란', body: [
    '등식에는 두 종류가 있어요. 방정식은 특별한 수를 넣을 때만 참이 되고, 항등식은 어떤 수를 넣어도 늘 참이에요.',
    { ex: [['2x = 6', '방정식. x가 3일 때만 참이에요'], ['2(x + 1) = 2x + 2', '항등식. x에 무엇을 넣어도 참이에요']] },
    '항등식은 같은 식을 모양만 바꿔 쓴 것이에요. 왼쪽을 전개했을 때 오른쪽과 똑같아지면 항등식이에요. 곱셈 공식은 모두 항등식이에요.',
    '「$x$에 대한 항등식」, 「$x$의 값에 관계없이 성립」, 「모든 실수 $x$에 대하여 성립」은 모두 같은 뜻이에요.'
  ] },
  { title: '계수 비교법', body: [
    '항등식은 양쪽이 같은 식이니, 같은 차수의 항끼리 계수가 같아요. 저울 양쪽에 같은 물건이 같은 개수만큼 있어야 늘 수평인 것과 같아요.',
    { ex: [['ax^{2} + bx + c = 2x^{2} - 3x + 5', 'x에 대한 항등식이면'], ['a = 2,\\quad b = -3,\\quad c = 5', '같은 차수의 계수끼리 같아요']] },
    '괄호가 있으면 먼저 전개해서 내림차순으로 정리한 다음에 견줘요.',
    { ex: [['a(x + 1) + b(x - 1) = 5x + 1', '왼쪽을 전개하면 (a + b)x + (a − b)'], ['a + b = 5,\\quad a - b = 1', '계수끼리 견줘서 연립해요'], ['a = 3,\\quad b = 2', '답']] }
  ] },
  { title: '수치 대입법', body: [
    '항등식은 어떤 수를 넣어도 성립하니, 계산하기 편한 수를 골라 넣어도 돼요. 괄호가 0이 되는 수를 넣으면 항이 통째로 사라져요.',
    { ex: [['a(x + 1) + b(x - 1) = 5x + 1', '같은 문제를 수를 넣어서 풀어요'], ['2a = 6', 'x = 1을 넣으면 b가 든 항이 사라져요'], ['-2b = -4', 'x = −1을 넣으면 a가 든 항이 사라져요']] },
    '전개하기 쉬우면 계수 비교법, 괄호가 여러 개 곱해져 있으면 수치 대입법이 편해요. 어느 방법으로 풀어도 답은 같아요.',
    '모든 계수의 합은 $x = 1$을, 상수항은 $x = 0$을 넣으면 한 번에 나와요.'
  ] },
  { title: '나머지정리', body: [
    '다항식 $P(x)$를 일차식 $x - a$로 나눈 나머지는 $P(a)$예요. 직접 나누지 않고 수를 한 번 넣기만 하면 돼요.',
    { ex: [['P(x) = (x - a)Q(x) + R', '검산식'], ['P(a) = 0 \\times Q(a) + R = R', 'x = a를 넣으면 나머지만 남아요']] },
    { ex: [['P(x) = x^{3} - 2x + 5', '이 식을 x − 2로 나눈 나머지는'], ['P(2) = 2^{3} - 2 \\times 2 + 5 = 9', '2를 넣은 값']] },
    '넣는 수는 나누는 식을 0으로 만드는 수예요. $x + 2$로 나누면 $-2$를, $2x - 1$로 나누면 $\\dfrac{1}{2}$을 넣어요.'
  ] },
  { title: '인수정리', body: [
    '나머지가 0이면 나누어떨어져요. 그래서 $P(a) = 0$이면 $x - a$는 $P(x)$의 인수예요. 거꾸로 $x - a$가 인수이면 $P(a) = 0$이에요.',
    { ex: [['P(x) = x^{2} - 5x + 6', '이 식에 2를 넣으면'], ['P(2) = 4 - 10 + 6 = 0', '0이니 x − 2는 인수예요'], ['P(1) = 1 - 5 + 6 = 2', '0이 아니니 x − 1은 인수가 아니에요']] },
    '12가 3으로 나누어떨어지면 3이 12의 약수인 것과 같은 이야기예요.',
    '「나누어떨어진다」, 「인수로 가진다」는 말이 나오면 넣은 값을 0으로 놓고 식을 세워요.'
  ] },
  { title: '조립제법', body: [
    '일차식 $x - a$로 나눌 때는 계수만 가지고 빠르게 나눌 수 있어요. $(x^{3} - 2x + 5) \\div (x - 2)$를 해 봐요. 빠진 $x^{2}$의 자리에는 0을 써요.',
    { ex: [['\\begin{array}{c|cccc} 2 & 1 & 0 & -2 & 5 \\\\ & & 2 & 4 & 4 \\\\ \\hline & 1 & 2 & 2 & 9 \\end{array}', '대각선은 곱하기, 세로는 더하기'], ['x^{2} + 2x + 2', '몫. 아랫줄의 앞 세 수가 계수예요']] },
    '맨 앞의 1은 그대로 내려요. 왼쪽의 2를 곱해 대각선 위에 쓰고($2 \\times 1 = 2$), 세로로 더해 내려요($0 + 2 = 2$). 이것을 끝까지 되풀이해요.',
    '맨 아랫줄의 마지막 수 9가 나머지예요. 나머지정리로 구한 $P(2) = 9$와 같아요.'
  ] }
]);
