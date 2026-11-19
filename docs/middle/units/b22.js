/* B22 이차함수와 그래프 — y = ax², 평행이동, 꼭짓점과 축, 일반형을 표준형으로
   유형(쉬운 것부터): B22.value 이차함수의 함숫값(키패드, 부호 있는 정수) · B22.basic y = ax² 의 그래프 · B22.shift 그래프의 평행이동
                     · B22.vertex 꼭짓점과 축 · B22.standard 일반형을 표준형으로 (보기 고르기) · B22.read 그래프에서 값 구하기(키패드, 부호 있는 정수)
   답이 식 · 좌표 · 그래프의 성질이면 보기 고르기, 답이 수 하나이면 키패드다.
   x² 의 계수는 유리수 [분자, 분모] 로 다루고 계산은 모두 정수로 한다(부동소수점을 쓰지 않는다).
   식은 표준형 std(a, p, q) = y = a(x − p)² + q, 일반형 gen(a, b, c), 좌표 pt(x, y) 로만 쓴다. 그래서 글자가 다르면 다른 식 · 다른 점이다.
   그림은 figure { type: 'plane', parab: [n, d, p, q], points } 로 그린다(포물선 y = (n/d)(x − p)² + q). */
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
      id: o.id, unit: 'B22', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; if (p.figure) out.figure = p.figure; return out; },
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
      id: o.id, unit: 'B22', version: 1, title: o.title,
      answer: { kind: o.kind },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; if (p.figure) out.figure = p.figure; return out; },
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

  var gcd = MH.gcd, X1 = { x: 1 }, X2 = { x: 2 };
  /* ── x² 의 계수는 유리수 [분자, 분모] 로 다룬다 ── */
  var R = function (n, d) { var g; if (d < 0) { n = -n; d = -d; } g = gcd(abs(n), d) || 1; return [n / g, d / g]; };
  var POOL = [[1, 1], [-1, 1], [2, 1], [-2, 1], [3, 1], [-3, 1], [1, 2], [-1, 2]];
  var WIDE = [[1, 3], [1, 2], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]];   /* 절댓값이 작은 것부터 */
  /** 수로 쓴다: 2, -\dfrac{1}{2} */
  var num = function (a) { return a[1] === 1 ? String(a[0]) : (a[0] < 0 ? '-' : '') + '\\dfrac{' + abs(a[0]) + '}{' + a[1] + '}'; };
  /** 식 앞에 붙이는 계수: 1 은 쓰지 않는다 */
  var ct = function (a) { return a[1] === 1 && abs(a[0]) === 1 ? (a[0] < 0 ? '-' : '') : num(a); };
  var sq = function (p) { return p === 0 ? 'x^{2}' : '(x ' + (p > 0 ? '- ' : '+ ') + abs(p) + ')^{2}'; };
  var tail = function (q) { return q === 0 ? '' : (q > 0 ? ' + ' : ' - ') + abs(q); };
  /** 표준형 y = a(x − p)² + q */
  var std = function (a, p, q) { return 'y = ' + ct(a) + sq(p) + tail(q); };
  var quad = function (a, b, c) { return ptex([T(a, X2), T(b, X1), T(c)].filter(function (t) { return t.c !== 0; })); };
  var gen = function (a, b, c) { return 'y = ' + quad(a, b, c); };
  var pt = function (x, y) { return '(' + x + ',\\ ' + y + ')'; };
  var mulA = function (a, rest) { return a === 1 ? rest : a === -1 ? '-' + rest : a + ' \\times ' + rest; };
  var sum = function (list) { return list.filter(function (x, i) { return i === 0 || x !== 0; }).map(function (x, i) { return i === 0 ? String(x) : (x < 0 ? ' - ' : ' + ') + abs(x); }).join(''); };
  /** 틀린 답 후보가 둘은 있는가(키패드 문제) */
  var enough = function (wrong, ans) { var ws = []; Object.keys(wrong).forEach(function (id) { var w = wrong[id]; if (isInt(w) && w !== 0 && abs(w) !== abs(ans) && ws.indexOf(w) < 0) ws.push(w); }); return ws.length >= 2; };
  /** 보기 고르기 문제를 마무리한다. 후보: [보기, 실수 id, 설명]. 글자가 서로 다른 보기 셋을 차례로 고른다 */
  var finish = function (o) {
    var seen = [o.ans], wrong = [];
    o.cands.forEach(function (c) {
      if (!c || !c[0] || wrong.length >= 3 || seen.indexOf(c[0]) >= 0 || wrong.some(function (w) { return w[1] === c[1]; })) return;
      seen.push(c[0]); wrong.push(c);
    });
    return { tex: o.tex, text: o.text, figure: o.figure, ans: o.ans, wrong: wrong, hints: o.hints, steps: o.steps, check: wrong.length === 3 && o.ok !== false };
  };
  var seed = function (r) { return { perm: perm6(r), o: order4(r) }; };
  var mk = function (r, q) { var s = seed(r); q.perm = s.perm; q.o = s.o; return q; };

  /* ── B22.value 이차함수의 함숫값 ─────────────────── */
  var MACHINE = '함수는 수를 넣으면 정해진 규칙대로 계산해서 수를 내놓는 기계와 같아요. 이차함수는 그 규칙 안에 "넣은 수를 제곱한다"가 들어 있어요. $x$의 값이 주어지면 식의 $x$ 자리에 그 수를 넣고 계산해요. 계산 순서가 중요해요. 제곱을 가장 먼저 하고, 그다음에 곱하고, 마지막에 더하거나 빼요. 음수를 넣을 때는 반드시 괄호를 쳐서 넣어요.';
  var valueBuild = function (q) {
    var a = q.a, k = q.k, b = q.b, c = q.c, m, tex, text, ans, wrong = {}, steps, h2, pk = par(k);
    if (q.kind === 'ax2') {
      tex = 'y = ' + ct([a, 1]) + 'x^{2}'; text = '위 이차함수에서 $x = ' + k + '$일 때, $y$의 값을 구하세요.'; ans = a * k * k;
      wrong['not-squared'] = a * k; wrong.doubled = a * 2 * k; wrong['coef-squared'] = a * k * a * k;
      steps = [{ say: '$x$ 자리에 $' + k + '$' + pj(k, '을/를') + ' 넣어요.' + (k < 0 ? ' 음수는 괄호를 쳐서 넣어요.' : ''), tex: 'y = ' + mulA(a, pk + '^{2}') }].concat(abs(a) > 1 ? [{ say: '제곱을 먼저 계산해요.', tex: 'y = ' + a + ' \\times ' + k * k }] : []).concat([{ say: abs(a) > 1 ? '곱해요.' : '제곱을 계산해요.' + (a < 0 ? ' 앞의 빼기 부호는 제곱한 뒤에 붙여요.' : ''), tex: 'y = ' + ans }]);
      h2 = '식의 $x$ 자리에 $' + k + '$' + pj(k, '을/를') + ' 넣어요. 그러면 $' + pk + '^{2}$을 먼저 계산해야 해요. 제곱은 같은 수를 두 번 곱하는 것이지, 2를 곱하는 것이 아니에요.' + (k < 0 ? ' 음수끼리 곱하면 양수가 되니, 음수를 제곱한 값은 양수예요.' : '') + (a === 1 ? ' $x^{2}$ 앞에 곱해진 수가 없으니, 제곱한 값이 그대로 $y$의 값이에요.' : a === -1 ? ' $x^{2}$ 앞에 빼기 부호가 있으니, 제곱을 먼저 한 다음 그 값에 빼기 부호를 붙이면 $y$의 값이 나와요.' : ' 제곱한 값에 $x^{2}$ 앞의 수 $' + a + '$' + pj(a, '을/를') + ' 곱하면 $y$의 값이 나와요. 앞의 수까지 함께 제곱하지 않도록 조심해요.');
    } else if (q.kind === 'gen') {
      tex = gen(a, b, c); text = '위 이차함수에서 $x = ' + k + '$일 때, $y$의 값을 구하세요.'; ans = a * k * k + b * k + c;
      wrong['square-sign'] = k < 0 ? -a * k * k + b * k + c : null; wrong['not-squared'] = a * k + b * k + c; wrong['const-lost'] = a * k * k + b * k; wrong['mid-sign'] = a * k * k - b * k + c;
      steps = [{ say: '$x$가 있는 자리마다 $' + k + '$' + pj(k, '을/를') + ' 넣어요.' + (k < 0 ? ' 음수는 괄호를 쳐서 넣어요.' : ''), tex: 'y = ' + mulA(a, pk + '^{2}') + (b < 0 ? ' - ' : ' + ') + (abs(b) === 1 ? '' : abs(b) + ' \\times ') + pk + tail(c) },
        { say: '제곱과 곱셈을 먼저 계산해요.', tex: 'y = ' + sum([a * k * k, b * k, c]) }, { say: '앞에서부터 차례로 더하고 빼요.', tex: 'y = ' + ans }];
      h2 = '$x$가 두 군데에 있어요. $x^{2}$ 자리와 $x$ 자리 모두에 $' + k + '$' + pj(k, '을/를') + ' 넣어요. 그다음 항을 하나씩 따로 계산해요. 첫째 항은 $' + pk + '^{2}$을 먼저 구한 뒤 앞의 수를 곱해요. 둘째 항은 $x$ 앞의 수에 $' + pk + '$' + pj(k, '을/를') + ' 곱해요.' + (k < 0 ? ' 음수를 제곱하면 양수, 음수에 음수를 곱해도 양수예요.' : '') + ' 셋째 항인 상수는 그대로 둬요. 세 값을 부호에 맞게 더하면 답이에요.';
    } else {
      m = a * k * k; tex = 'y = ax^{2}'; text = '위 이차함수의 그래프가 점 $' + pt(k, m) + '$' + pj(m, '을/를') + ' 지날 때, 상수 $a$의 값을 구하세요.'; ans = a;
      wrong['not-squared'] = a * k; wrong['y-copied'] = m; wrong.multiplied = m * k * k; wrong['x-squared'] = k * k;
      steps = [{ say: '그래프가 점을 지나면 그 점의 좌표를 넣었을 때 식이 맞아요. $x$ 자리에 $' + k + '$, $y$ 자리에 $' + m + '$' + pj(m, '을/를') + ' 넣어요.', tex: m + ' = a \\times ' + pk + '^{2}' }, { say: '제곱을 계산해요.', tex: m + ' = ' + k * k + 'a' }, { say: '양쪽을 $a$ 앞의 수로 나눠요.', tex: 'a = ' + ans }];
      h2 = '그래프가 어떤 점을 지난다는 것은 그 점의 좌표가 식을 참으로 만든다는 뜻이에요. 좌표에서 앞의 수 $' + k + '$' + pj(k, '은/는') + ' $x$, 뒤의 수 $' + m + '$' + pj(m, '은/는') + ' $y$예요. 이 둘을 식에 넣으면 문자가 $a$ 하나만 남아요. $' + pk + '^{2}$을 먼저 계산하면 "(수) × $a$ = (수)" 꼴의 간단한 방정식이 돼요. 양쪽을 $a$ 앞의 수로 나누면 돼요. 부호도 확인해요.';
    }
    return { tex: tex, text: text, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans),
      hints: [MACHINE, h2, '① 주어진 수를 문자 자리에 넣어요(음수는 괄호). ② 제곱을 먼저 계산해요. ③ 곱셈을 해요. ④ 더하기와 빼기를 해요. 구하는 것이 $y$의 값인지 상수인지 다시 확인해요.'] };
  };
  numQ({
    id: 'B22.value', title: '이차함수의 함숫값', kind: 'signed', build: valueBuild,
    mistakes: [['not-squared', '제곱하지 않고 그냥 곱했어요. $x^{2}$ 자리에는 넣은 수를 두 번 곱한 값이 들어가요.'],
      ['doubled', '제곱 대신 2를 곱했어요. $3^{2}$은 $3 \\times 2$가 아니라 $3 \\times 3$이에요.'],
      ['coef-squared', '$x^{2}$ 앞의 수까지 함께 제곱했어요. 제곱은 $x$에만 붙어 있어요. 넣은 수만 제곱하고, 그다음에 앞의 수를 곱해요.'],
      ['square-sign', '음수를 제곱할 때 부호가 틀렸어요. 음수를 제곱하면 양수예요. 괄호를 쳐서 넣으면 실수가 줄어요.'],
      ['const-lost', '마지막 상수항을 빠뜨렸어요. 상수항은 $x$가 없어서 그대로 더하거나 빼요.'],
      ['mid-sign', '$x$가 있는 일차항의 부호가 틀렸어요. $x$ 앞의 수와 넣은 수의 부호를 따져서 곱해요.'],
      ['y-copied', '점의 $y$좌표를 그대로 답했어요. 좌표를 식에 넣어서 $a$에 대한 방정식을 풀어야 해요.'],
      ['multiplied', '나눠야 할 때 곱했어요. $a$에 곱해진 수를 없애려면 양쪽을 그 수로 나눠요.'],
      ['x-squared', '$x$좌표를 제곱한 수를 답했어요. 그 수는 $a$ 앞에 곱해지는 수예요. $y$좌표를 그 수로 나눠야 $a$가 나와요.']],
    levels: [
      { name: 'y = ax² 의 함숫값', minDistinct: 60, vars: { q: sampler(function (r) { var k; do { k = nz(r, -6, 6); } while (abs(k) === 1); return { kind: 'ax2', a: nz(r, -5, 5), k: k }; }) } },
      { name: 'y = ax² + bx + c 의 함숫값', minDistinct: 250, vars: { q: sampler(function (r) { return { kind: 'gen', a: r.pick([1, -1, 2, -2, 3]), b: nz(r, -6, 6), c: nz(r, -9, 9), k: nz(r, -4, 4) }; }) } },
      { name: '지나는 점으로 a 구하기', minDistinct: 40, vars: { q: sampler(function (r) { var k; do { k = nz(r, -4, 4); } while (abs(k) === 1); return { kind: 'find', a: nz(r, -5, 5), k: k }; }) } }
    ]
  });

  /* ── B22.basic y = ax² 의 그래프 ──────────────────── */
  var BOWL = '$y = ax^{2}$의 그래프는 원점을 꼭짓점으로 하는 포물선이에요. $a$의 부호가 방향을 정해요. $a$가 양수이면 그릇처럼 아래로 볼록하고, $a$가 음수이면 엎어 놓은 그릇처럼 위로 볼록해요. $a$의 절댓값은 폭을 정해요. 절댓값이 클수록 $y$의 값이 빨리 커져서 그래프가 $y$축에 가까이 붙고 폭이 좁아져요. 절댓값이 작을수록 옆으로 퍼져서 폭이 넓어져요.';
  var shape = function (up, org) { return (up ? '아래로 볼록' : '위로 볼록') + '하고 ' + (org ? '원점을 지나요' : '원점을 지나지 않아요'); };
  var ax2 = function (a) { return 'y = ' + ct(a) + 'x^{2}'; };
  var basicBuild = function (q) {
    var a = q.a, up = !!a && a[0] > 0, k = q.k, y, tex, text, ans, cands, steps, h2, fig, s, big, small, i, narrow;
    if (q.kind === 'dir') {
      tex = ax2(a); text = '위 이차함수의 그래프의 모양으로 옳은 것을 고르세요.'; ans = shape(up, true);
      cands = [[shape(!up, true), 'direction', '볼록한 방향이 반대예요. $x^{2}$ 앞의 수가 양수이면 아래로 볼록, 음수이면 위로 볼록이에요.'],
        [shape(up, false), 'no-origin', '방향은 맞지만 원점을 지나요. $x = 0$을 넣으면 $y = 0$이니, $y = ax^{2}$의 그래프는 언제나 원점을 지나요.'],
        [shape(!up, false), 'both-wrong', '방향도 반대이고, 원점도 지나요. $x^{2}$ 앞의 수의 부호를 보고, $x = 0$을 넣어 확인해요.']];
      steps = [{ say: '$x^{2}$ 앞의 수의 부호를 봐요. ' + (up ? '양수이니 아래로 볼록해요.' : '음수이니 위로 볼록해요.'), tex: 'a = ' + num(a) + (up ? ' > 0' : ' < 0') }, { say: '$x = 0$을 넣으면 $y = 0$이에요. 원점을 지나요.', tex: '(0,\\ 0)' }];
      h2 = '두 가지를 따로 확인해요. 첫째, 방향이에요. $x^{2}$ 앞의 수가 양수인지 음수인지 봐요. 양수이면 $x$가 0에서 멀어질수록 $y$가 커지니 양쪽 끝이 위로 올라가요. 그래서 아래로 볼록해요. 음수이면 반대로 양쪽 끝이 내려가요. 둘째, 원점이에요. 식에 $x = 0$을 넣어서 $y$가 얼마인지 계산해 봐요. $y$가 0이면 그래프가 원점을 지나는 것이에요.';
    } else if (q.kind === 'width') {
      narrow = q.narrow; i = q.i; s = WIDE[i]; big = WIDE.slice(i + 1); small = WIDE.slice(0, i);
      tex = ax2([s[0] * q.sg, s[1]]); text = '위 이차함수의 그래프보다 폭이 ' + (narrow ? '좁은' : '넓은') + ' 그래프의 식을 고르세요.';
      var good = narrow ? big : small, bad = narrow ? small : big, g0 = good[q.j % good.length], b0 = bad[q.j % bad.length], b1 = bad[(q.j + 1) % bad.length];
      ans = ax2([g0[0] * q.sg2, g0[1]]);
      cands = [[ax2([-s[0] * q.sg, s[1]]), 'same-width', '폭이 같은 그래프예요. 부호만 반대이면 볼록한 방향만 뒤집히고 폭은 그대로예요.'],
        [ax2([b0[0] * q.sg, b0[1]]), narrow ? 'wider' : 'narrower', narrow ? '절댓값이 더 작아서 폭이 더 넓은 그래프예요. 폭이 좁으려면 $x^{2}$ 앞의 수의 절댓값이 더 커야 해요.' : '절댓값이 더 커서 폭이 더 좁은 그래프예요. 폭이 넓으려면 $x^{2}$ 앞의 수의 절댓값이 더 작아야 해요.'],
        [ax2([-b1[0] * q.sg, b1[1]]), narrow ? 'wider-flipped' : 'narrower-flipped', '방향이 반대일 뿐, 폭은 오히려 ' + (narrow ? '더 넓어요' : '더 좁아요') + '. 폭은 부호와 상관없이 절댓값의 크기만으로 정해져요.']];
      steps = [{ say: '폭은 $x^{2}$ 앞의 수의 절댓값으로 정해져요. 주어진 식의 절댓값을 구해요.', tex: '\\left|' + num([s[0] * q.sg, s[1]]) + '\\right| = ' + num(s) }, { say: '절댓값이 ' + (narrow ? '더 큰' : '더 작은') + ' 식을 찾아요. 부호는 상관없어요.', tex: '\\left|' + num([g0[0] * q.sg2, g0[1]]) + '\\right| = ' + num(g0) }, { say: '절댓값이 ' + (narrow ? '클수록 폭이 좁아요.' : '작을수록 폭이 넓어요.'), tex: ans }];
      h2 = '폭을 비교할 때는 부호를 떼고 생각해요. 보기마다 $x^{2}$ 앞의 수의 절댓값을 구해요. 음수는 빼기 부호를 떼면 돼요. 그 절댓값을 주어진 식의 절댓값과 견줘요. 절댓값이 클수록 그래프가 $y$축 쪽으로 오므라져서 폭이 좁고, 절댓값이 작을수록 옆으로 벌어져서 폭이 넓어요. 분수는 1보다 작다는 것을 떠올리면 비교하기 쉬워요. 부호만 반대인 식은 폭이 같아요.';
    } else if (q.kind === 'fig') {
      y = a[0] * k * k / a[1]; fig = { type: 'plane', range: 5, parab: [a[0], a[1], 0, 0], points: [{ x: k, y: y }] };
      text = '그림의 포물선은 꼭짓점이 원점이고 점 $' + pt(k, y) + '$' + pj(y, '을/를') + ' 지나요. 이 그래프의 식을 고르세요.'; ans = ax2(a);
      cands = mixc([[ax2([-a[0], a[1]]), 'direction', '볼록한 방향이 반대예요. 그림이 아래로 볼록하면 $x^{2}$ 앞의 수는 양수, 위로 볼록하면 음수예요.']], [
        abs(a[0]) !== a[1] ? [ax2(R(a[1] * sgn(a[0]), abs(a[0]))), 'inverted', '분자와 분모를 뒤바꿨어요. $y$좌표를 $x$좌표의 제곱으로 나눠야 해요. 거꾸로 나누지 않아요.'] : null,
        [ax2(R(a[0] * k, a[1])), 'not-squared', '$x$좌표를 제곱하지 않았어요. $y = ax^{2}$에 점을 넣으면 $a$에 곱해지는 수는 $x$좌표의 제곱이에요.'],
        [ax2([y, 1]), 'y-as-coef', '점의 $y$좌표를 그대로 $x^{2}$ 앞에 썼어요. 점의 좌표를 식에 넣어서 $a$를 계산해야 해요.'],
        [ax2(R(2 * a[0], a[1])), 'doubled', '$x^{2}$ 앞의 수가 2배가 됐어요. 표시된 점의 좌표를 식에 넣어서 맞는지 확인해요.']], q.perm);
      steps = [{ say: '꼭짓점이 원점이니 식은 $y = ax^{2}$ 꼴이에요. 표시된 점의 좌표를 넣어요.', tex: y + ' = a \\times ' + par(k) + '^{2}' }, { say: '제곱을 계산하고 $a$를 구해요.', tex: 'a = ' + num(a) }, { say: '구한 $a$를 식에 써요.', tex: ans }];
      h2 = '꼭짓점이 원점인 포물선의 식은 $y = ax^{2}$ 꼴이에요. 정해야 할 것은 $a$ 하나예요. 먼저 그림이 아래로 볼록한지 위로 볼록한지 봐서 $a$의 부호를 정해요. 그다음 표시된 점의 좌표를 식에 넣어요. $x$ 자리에 $' + k + '$, $y$ 자리에 $' + y + '$' + pj(y, '을/를') + ' 넣으면 $a$에 대한 간단한 방정식이 돼요. $x$좌표는 반드시 제곱해서 넣어야 해요.';
    } else if (q.kind === 'sym') {
      tex = ax2(a); text = '위 이차함수의 그래프와 $x$축에 대하여 대칭인 그래프의 식을 고르세요.'; ans = ax2([-a[0], a[1]]);
      cands = mixc([[ax2(a), 'unchanged', '처음 식 그대로예요. $x$축을 거울로 삼아 뒤집으면 볼록한 방향이 바뀌니 식도 달라져요.']], [
        abs(a[0]) !== a[1] ? [ax2(R(a[1] * sgn(a[0]), abs(a[0]))), 'inverted', '역수로 바꿨어요. 대칭이동은 폭을 바꾸지 않아요. 부호만 반대로 바꿔요.'] : null,
        abs(a[0]) !== a[1] ? [ax2(R(-a[1] * sgn(a[0]), abs(a[0]))), 'neg-inverted', '부호는 맞게 바꿨지만 역수로도 바꿨어요. 폭은 그대로여야 하니 절댓값은 바꾸지 않아요.'] : null,
        ['y = ' + ct([-a[0], a[1]]) + 'x', 'linear', '제곱이 사라져서 일차함수가 됐어요. 포물선을 뒤집어도 포물선이에요. $x^{2}$은 그대로 둬요.'],
        ['y = ' + ct(a) + 'x', 'linear-same', '제곱이 사라졌고 부호도 바꾸지 않았어요. $x^{2}$은 그대로 두고 앞의 수의 부호만 바꿔요.']], q.perm);
      steps = [{ say: '$x$축에 대하여 대칭이면 모든 점의 $y$좌표의 부호가 반대가 돼요. $y$ 자리에 $-y$를 넣어요.', tex: '-y = ' + ct(a) + 'x^{2}' }, { say: '양쪽에 $-1$을 곱해요. 폭은 그대로이고 방향만 뒤집혀요.', tex: ans }];
      h2 = '$x$축을 거울이라고 생각해요. 거울에 비친 그래프는 위아래가 뒤집혀요. 아래로 볼록하던 것은 위로 볼록해지고, 위로 볼록하던 것은 아래로 볼록해져요. 하지만 폭은 조금도 달라지지 않아요. 방향은 $x^{2}$ 앞의 수의 부호가 정하고, 폭은 절댓값이 정해요. 그러니 절댓값은 그대로 두고 부호만 반대로 바꾸면 돼요.';
    } else {
      y = a[0] * k * k; tex = ax2(a); text = '위 이차함수의 그래프가 지나는 점을 고르세요.'; ans = pt(k, y);
      cands = mixc([[pt(k, a[0] * k), 'not-squared', '$x$좌표를 제곱하지 않고 그냥 곱했어요. $x^{2}$ 자리에는 $x$좌표를 두 번 곱한 값이 들어가요.']], [
        [pt(k, -y), 'sign', '$y$좌표의 부호가 반대예요. 제곱한 값은 양수이고, 거기에 $x^{2}$ 앞의 수의 부호가 붙어요.'],
        [pt(y, k), 'swapped', '$x$좌표와 $y$좌표의 자리를 바꿨어요. 좌표는 ($x$, $y$) 차례로 써요.'],
        [pt(k, 2 * a[0] * k), 'doubled', '제곱 대신 2를 곱했어요. 제곱은 같은 수를 두 번 곱하는 것이에요.'],
        [pt(-k, -y), 'both-signs', '두 좌표의 부호를 모두 바꿨어요. $x$좌표의 부호를 바꿔도 제곱한 값은 같으니 $y$좌표는 그대로예요.']], q.perm);
      steps = [{ say: '보기의 $x$좌표를 식에 넣어 $y$의 값을 계산해요.', tex: 'y = ' + mulA(a[0], par(k) + '^{2}') + ' = ' + y }, { say: '계산한 값이 $y$좌표와 같은 점이 그래프 위의 점이에요.', tex: ans }];
      h2 = '점이 그래프 위에 있는지 알아보려면 좌표를 식에 넣어 보면 돼요. 보기마다 앞의 수($x$좌표)를 식의 $x$ 자리에 넣고 $y$의 값을 계산해요. 그 값이 뒤의 수($y$좌표)와 똑같으면 그 점은 그래프 위에 있어요. 다르면 그래프 밖의 점이에요. 계산할 때 제곱을 먼저 하고, 음수는 괄호를 쳐서 넣어요. 좌표의 차례가 ($x$, $y$)라는 것도 잊지 않아요.';
    }
    return finish({ tex: tex, text: text, figure: fig, ans: ans, cands: cands, steps: steps,
      hints: [BOWL, h2, '① $x^{2}$ 앞의 수의 부호로 볼록한 방향을 정해요. ② 절댓값으로 폭을 비교해요. ③ 점의 좌표는 식에 넣어서 확인해요($x$좌표는 제곱). ④ 고른 답을 식에 다시 넣어 검산해요.'] });
  };
  var okB = function (q) { var p = basicBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B22.basic', title: 'y = ax² 의 그래프', build: basicBuild,
    ids: ['direction', 'no-origin', 'both-wrong', 'same-width', 'wider', 'wider-flipped', 'narrower', 'narrower-flipped', 'inverted', 'not-squared', 'y-as-coef', 'doubled', 'unchanged', 'neg-inverted', 'linear', 'linear-same', 'sign', 'swapped', 'both-signs'],
    levels: [
      { name: '볼록한 방향과 폭', minDistinct: 30, vars: { q: sampler(function (r) {
          return until(function () {
            var narrow = r.int(0, 1), i;
            if (r.int(0, 2) === 0) return mk(r, { kind: 'dir', a: r.pick(WIDE.map(function (w) { return [pm(r, w[0]), w[1]]; })) });
            i = narrow ? r.int(2, 5) : r.int(1, 4);
            return mk(r, { kind: 'width', narrow: narrow, i: i, sg: pm(r, 1), sg2: pm(r, 1), j: r.int(0, 5) });
          }, okB);
        }) } },
      { name: '그림을 보고 식 고르기', minDistinct: 25, vars: { q: sampler(function (r) {
          return until(function () {
            var t = r.pick([[1, 1, 2], [1, 1, 1], [2, 1, 1], [3, 1, 1], [1, 2, 2], [1, 3, 3], [1, 4, 2], [1, 4, 4], [4, 1, 1], [1, 2, 2], [1, 1, 2]]);
            return mk(r, { kind: 'fig', a: [pm(r, t[0]), t[1]], k: pm(r, t[2]) });
          }, okB);
        }) } },
      { name: 'x축 대칭 · 지나는 점', minDistinct: 18, vars: { q: sampler(function (r) {
          return until(function () {
            var w;
            if (r.int(0, 1)) { w = r.pick(WIDE); return mk(r, { kind: 'sym', a: [pm(r, w[0]), w[1]] }); }
            return mk(r, { kind: 'point', a: [nz(r, -3, 3), 1], k: pm(r, r.int(2, 4)) });
          }, okB);
        }) } }
    ]
  });

  /* ── B22.shift 그래프의 평행이동 ──────────────────── */
  var SLIDE = '평행이동은 그래프의 모양을 바꾸지 않고 통째로 밀어서 옮기는 것이에요. 폭과 방향은 그대로이니 $x^{2}$ 앞의 수 $a$는 변하지 않아요. $y$축의 방향(위아래)으로 $q$만큼 옮기면 식 끝에 $q$를 더해요. $x$축의 방향(좌우)으로 $p$만큼 옮기면 $x$ 자리에 $x - p$를 넣어요. 좌우로 옮길 때는 부호가 거꾸로 보이는 점을 조심해요. 오른쪽으로 3만큼 옮기면 $(x - 3)^{2}$이에요.';
  var shiftBuild = function (q) {
    var a = q.a, p = q.p || 0, v = q.q || 0, tex = ax2(a), ans = std(a, p, v), text, cands, steps, h2;
    var W_X = '좌우로 옮길 때 괄호 안의 부호가 반대예요. $x$축의 방향으로 $p$만큼 옮기면 $x$ 자리에 $x - p$를 넣어요. 양수만큼 옮기면 괄호 안은 빼기예요.';
    var W_Y = '위아래로 옮길 때 부호가 반대예요. $y$축의 방향으로 옮긴 수는 부호 그대로 식 끝에 더해요.';
    if (q.kind === 'y') {
      text = '위 이차함수의 그래프를 $y$축의 방향으로 $' + v + '$만큼 평행이동한 그래프의 식을 고르세요.';
      cands = mixc([[std(a, 0, -v), 'y-sign', W_Y]], [[std(a, v, 0), 'into-bracket', '옮긴 수를 괄호 안에 넣었어요. 괄호 안이 바뀌는 것은 좌우($x$축의 방향)로 옮길 때예요. 위아래로 옮길 때는 식 끝에 더해요.'],
        [std(a, -v, 0), 'bracket-plus', '옮긴 수를 괄호 안에 더했어요. 위아래($y$축의 방향)로 옮길 때는 괄호를 만들지 않고 식 끝에 더해요.'],
        a[1] === 1 && a[0] + v !== 0 ? [ax2([a[0] + v, 1]), 'coef-added', '옮긴 수를 $x^{2}$ 앞의 수에 더했어요. 평행이동은 폭을 바꾸지 않으니 $x^{2}$ 앞의 수는 그대로예요.'] : null], q.perm);
      steps = [{ say: '처음 그래프의 꼭짓점은 원점이에요. ' + (v > 0 ? '위로' : '아래로') + ' 옮기면 꼭짓점이 $y$축을 따라 움직여요.', tex: '(0,\\ 0) \\rightarrow ' + pt(0, v) }, { say: '모든 점의 $y$좌표가 $' + v + '$만큼 달라지니, 식 끝에 그 수를 더해요. $x^{2}$ 앞의 수는 그대로예요.', tex: ans }];
      h2 = '$y$축의 방향은 위아래예요. 양수이면 위로, 음수이면 아래로 옮겨요. 여기서는 $' + v + '$만큼이니 ' + (v > 0 ? '위로' : '아래로') + ' 옮겨요. 그래프 위의 모든 점이 똑같이 움직이니, 같은 $x$에 대해 $y$의 값이 $' + v + '$만큼 달라져요. 그래서 원래 식의 끝에 그 수를 그대로 더하면 돼요. $x^{2}$ 앞의 수는 바꾸지 않고, 괄호도 만들지 않아요.';
    } else if (q.kind === 'x') {
      text = '위 이차함수의 그래프를 $x$축의 방향으로 $' + p + '$만큼 평행이동한 그래프의 식을 고르세요.';
      cands = mixc([[std(a, -p, 0), 'x-sign', W_X]], [[std(a, 0, p), 'outside', '옮긴 수를 식 끝에 더했어요. 식 끝이 바뀌는 것은 위아래($y$축의 방향)로 옮길 때예요. 좌우로 옮길 때는 $x$ 자리를 바꿔요.'],
        [std(a, 0, -p), 'outside-sign', '옮긴 수를 식 끝에서 뺐어요. 좌우($x$축의 방향)로 옮길 때는 식 끝이 아니라 $x$ 자리에 $x - p$를 넣어요.']], q.perm);
      steps = [{ say: '처음 그래프의 꼭짓점은 원점이에요. ' + (p > 0 ? '오른쪽으로' : '왼쪽으로') + ' 옮기면 꼭짓점이 $x$축을 따라 움직여요.', tex: '(0,\\ 0) \\rightarrow ' + pt(p, 0) }, { say: '$x$ 자리에 $x - ' + par(p) + '$' + pj(p, '을/를') + ' 넣어요. $x$가 $' + p + '$일 때 괄호 안이 0이 돼요.', tex: ans }];
      h2 = '$x$축의 방향은 좌우예요. 양수이면 오른쪽, 음수이면 왼쪽으로 옮겨요. 여기서는 $' + p + '$만큼이니 ' + (p > 0 ? '오른쪽으로' : '왼쪽으로') + ' 옮겨요. 꼭짓점이 원점에서 $x$좌표가 $' + p + '$인 곳으로 가요. 새 그래프에서는 $x$가 $' + p + '$일 때 괄호 안이 0이 되어야 해요. 그러려면 괄호 안은 $x$에서 $' + p + '$' + pj(p, '을/를') + ' 뺀 식이어야 해요. 그래서 부호가 거꾸로 보여요.';
    } else {
      text = '위 이차함수의 그래프를 $x$축의 방향으로 $' + p + '$만큼, $y$축의 방향으로 $' + v + '$만큼 평행이동한 그래프의 식을 고르세요.';
      cands = mixc([[std(a, -p, v), 'x-sign', W_X]], [[std(a, p, -v), 'y-sign', W_Y], [std(a, -p, -v), 'both-signs', '두 수의 부호를 모두 반대로 썼어요. 괄호 안은 $x - p$이고, 식 끝에는 $q$를 부호 그대로 더해요.'],
        [std(a, v, p), 'swapped', '두 수의 자리를 바꿨어요. $x$축의 방향으로 옮긴 수는 괄호 안에, $y$축의 방향으로 옮긴 수는 식 끝에 써요.']], q.perm);
      steps = [{ say: '$x$축의 방향으로 $' + p + '$만큼: $x$ 자리에 $x - ' + par(p) + '$' + pj(p, '을/를') + ' 넣어요.', tex: 'y = ' + ct(a) + sq(p) }, { say: '$y$축의 방향으로 $' + v + '$만큼: 식 끝에 그 수를 더해요.', tex: ans }];
      h2 = '두 번에 나눠서 옮겨요. 먼저 좌우예요. $x$축의 방향으로 $' + p + '$만큼 옮기면 $x$ 자리에 $x$에서 $' + p + '$' + pj(p, '을/를') + ' 뺀 식을 넣어요. 괄호 안의 부호가 옮긴 방향과 거꾸로 보여요. 다음은 위아래예요. $y$축의 방향으로 $' + v + '$만큼 옮기면 식 끝에 그 수를 부호 그대로 더해요. 꼭짓점은 원점에서 점 $' + pt(p, v) + '$ 자리로 옮겨 가요. $x^{2}$ 앞의 수는 끝까지 그대로예요.';
    }
    return finish({ tex: tex, text: text, ans: ans, cands: cands, steps: steps,
      hints: [SLIDE, h2, '① $x^{2}$ 앞의 수는 그대로 둬요. ② 좌우로 옮긴 수 $p$는 괄호 안에 $x - p$로 써요(부호가 거꾸로 보여요). ③ 위아래로 옮긴 수 $q$는 식 끝에 부호 그대로 더해요. ④ 새 꼭짓점 ($p$, $q$)를 식에 넣어 확인해요.'] });
  };
  var okS = function (q) { var p = shiftBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B22.shift', title: '그래프의 평행이동', build: shiftBuild,
    ids: ['y-sign', 'into-bracket', 'bracket-plus', 'coef-added', 'x-sign', 'outside', 'outside-sign', 'both-signs', 'swapped'],
    levels: [
      { name: 'y축의 방향으로', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return mk(r, { kind: 'y', a: r.pick(POOL), q: nz(r, -8, 8) }); }, okS); }) } },
      { name: 'x축의 방향으로', minDistinct: 80, vars: { q: sampler(function (r) { return until(function () { return mk(r, { kind: 'x', a: r.pick(POOL), p: nz(r, -8, 8) }); }, okS); }) } },
      { name: '두 방향으로', minDistinct: 250, vars: { q: sampler(function (r) { return until(function () { return mk(r, { kind: 'xy', a: r.pick(POOL), p: nz(r, -7, 7), q: nz(r, -7, 7) }); }, okS); }) } }
    ]
  });

  /* ── B22.vertex 꼭짓점과 축 ─────────────────────── */
  var VTX = '$y = a(x - p)^{2} + q$ 꼴의 식은 그래프의 주소를 그대로 보여 줘요. 이 그래프는 $y = ax^{2}$의 그래프를 좌우로 $p$, 위아래로 $q$만큼 옮긴 것이에요. 그래서 꼭짓점은 원점에서 점 ($p$, $q$)로 옮겨 가요. 포물선을 반으로 접는 선인 축은 꼭짓점을 지나는 세로선 $x = p$예요. 괄호 안은 $x - p$이니, 괄호 안의 부호와 꼭짓점의 $x$좌표의 부호는 반대예요. 식 끝의 $q$는 부호 그대로 읽어요.';
  var vertexBuild = function (q) {
    var a = q.a, p = q.p || 0, v = q.q || 0, tex = std(a, p, v), ans, text, cands, steps, h2, fig, dx, y1;
    var W_X = '$x$좌표의 부호가 반대예요. 괄호 안이 $x - p$ 꼴이니, 괄호 안을 0으로 만드는 $x$의 값이 꼭짓점의 $x$좌표예요.';
    var W_Y = '$y$좌표의 부호가 반대예요. 식 끝의 수는 부호 그대로 꼭짓점의 $y$좌표예요.';
    var zero = '괄호 안이 0이 되는 $x$의 값을 찾아요.';
    if (q.kind === 'one') {
      text = '위 이차함수의 그래프의 꼭짓점의 좌표를 고르세요.'; ans = pt(p, v);
      cands = p === 0 ? mixc([[pt(v, 0), 'swapped', '$x$좌표와 $y$좌표의 자리를 바꿨어요. 식 끝에 더한 수는 위아래로 옮긴 것이니 $y$좌표예요.']], [[pt(0, -v), 'sign', W_Y], [pt(-v, 0), 'swapped-sign', '자리도 바꾸고 부호도 바꿨어요. 식 끝의 수는 부호 그대로 꼭짓점의 $y$좌표예요. $x$좌표는 0이에요.']], q.perm)
        : mixc([[pt(-p, 0), 'sign', W_X]], [[pt(0, p), 'swapped', '$x$좌표와 $y$좌표의 자리를 바꿨어요. 괄호 안의 수는 좌우로 옮긴 것이니 $x$좌표와 관계가 있어요.'], [pt(0, -p), 'swapped-sign', '괄호 안의 수를 $y$좌표로 읽었어요. 괄호 안의 수는 좌우로 옮긴 것이에요. 괄호 안을 0으로 만드는 값이 $x$좌표예요.']], q.perm);
      steps = p === 0 ? [{ say: '괄호가 없으니 좌우로는 옮기지 않았어요. 꼭짓점의 $x$좌표는 0이에요.', tex: 'x = 0' }, { say: '식 끝의 수가 꼭짓점의 $y$좌표예요.', tex: ans }]
        : [{ say: zero, tex: 'x ' + (p > 0 ? '- ' : '+ ') + abs(p) + ' = 0,\\quad x = ' + p }, { say: '식 끝에 더한 수가 없으니 $y$좌표는 0이에요.', tex: ans }];
      h2 = p === 0 ? '이 식에는 괄호가 없어요. $y = ax^{2}$의 그래프를 위아래로만 옮긴 것이에요. 좌우로는 움직이지 않았으니 꼭짓점은 여전히 $y$축 위에 있고, $x$좌표는 0이에요. 식 끝의 수가 위아래로 옮긴 만큼이에요. 그 수가 부호 그대로 꼭짓점의 $y$좌표예요. $x = 0$을 식에 넣어 계산해 보면 바로 확인할 수 있어요.'
        : '이 식에는 식 끝에 더한 수가 없어요. $y = ax^{2}$의 그래프를 좌우로만 옮긴 것이에요. 위아래로는 움직이지 않았으니 꼭짓점은 여전히 $x$축 위에 있고, $y$좌표는 0이에요. 꼭짓점의 $x$좌표는 괄호 안을 0으로 만드는 값이에요. 괄호 안에 보이는 부호와 반대가 된다는 점을 조심해요. 구한 $x$의 값을 식에 넣으면 $y$가 0이 되는지 확인해요.';
    } else if (q.kind === 'both') {
      text = '위 이차함수의 그래프의 꼭짓점의 좌표를 고르세요.'; ans = pt(p, v);
      cands = mixc([[pt(-p, v), 'x-sign', W_X]], [[pt(p, -v), 'y-sign', W_Y], [pt(-p, -v), 'both-signs', '두 좌표의 부호가 모두 반대예요. $x$좌표는 괄호 안을 0으로 만드는 값이고, $y$좌표는 식 끝의 수 그대로예요.'], [pt(v, p), 'swapped', '$x$좌표와 $y$좌표의 자리를 바꿨어요. 괄호 안에서 $x$좌표를, 식 끝에서 $y$좌표를 읽어요.']], q.perm);
      steps = [{ say: zero + ' 그 값이 꼭짓점의 $x$좌표예요.', tex: 'x ' + (p > 0 ? '- ' : '+ ') + abs(p) + ' = 0,\\quad x = ' + p }, { say: '식 끝의 수가 꼭짓점의 $y$좌표예요.', tex: 'y = ' + v }, { say: '좌표로 써요.', tex: ans }];
      h2 = '꼭짓점의 좌표를 두 조각으로 나눠 읽어요. $x$좌표는 괄호 안에서 읽어요. 괄호 안의 식이 0이 되게 하는 $x$의 값이에요. 그래서 괄호 안에 보이는 부호와 반대가 돼요. $y$좌표는 식 끝에서 읽어요. 이 수는 부호를 바꾸지 않고 그대로 읽어요. 읽은 두 수를 ($x$좌표, $y$좌표) 차례로 써요. $x^{2}$ 앞의 수는 폭과 방향만 정할 뿐 꼭짓점과는 상관없어요.';
    } else if (q.kind === 'axis') {
      text = '위 이차함수의 그래프의 축의 방정식을 고르세요.'; ans = 'x = ' + p;
      cands = mixc([['x = ' + (-p), 'x-sign', '부호가 반대예요. 축은 꼭짓점을 지나요. 괄호 안을 0으로 만드는 $x$의 값을 써요.']], [['y = ' + v, 'vertex-y', '꼭짓점의 $y$좌표로 가로선을 썼어요. 축은 포물선을 좌우로 똑같이 나누는 세로선이라서 $x = $ (수) 꼴이에요.'],
        ['x = ' + v, 'swapped', '식 끝의 수를 썼어요. 그 수는 꼭짓점의 $y$좌표예요. 축은 꼭짓점의 $x$좌표로 정해져요.'], ['y = ' + p, 'axis-letter', '수는 맞지만 문자가 틀렸어요. 세로선은 그 위의 모든 점의 $x$좌표가 같으니 $x = $ (수) 꼴로 써요.']], q.perm);
      steps = [{ say: '꼭짓점의 좌표를 읽어요.', tex: pt(p, v) }, { say: '축은 꼭짓점을 지나는 세로선이에요. 꼭짓점의 $x$좌표를 써요.', tex: ans }];
      h2 = '축은 포물선을 반으로 접었을 때 접히는 선이에요. 포물선은 좌우가 똑같이 생겼으니, 축은 꼭짓점을 지나면서 위아래로 뻗은 세로선이에요. 세로선 위의 점들은 $x$좌표가 모두 같아요. 그래서 축의 방정식은 $x = $ (수) 꼴이고, 그 수는 꼭짓점의 $x$좌표예요. 먼저 괄호 안을 0으로 만드는 $x$의 값을 찾아요. 식 끝의 수는 축과 상관없어요.';
    } else {
      dx = a[1] === 1 ? 1 : 2; y1 = v + a[0] * dx * dx / a[1];
      fig = { type: 'plane', range: 5, parab: [a[0], a[1], p, v], points: [{ x: p, y: v }, { x: p + q.side * dx, y: y1 }] };
      tex = undefined; text = '그림의 포물선은 꼭짓점이 점 $' + pt(p, v) + '$이고 점 $' + pt(p + q.side * dx, y1) + '$' + pj(y1, '을/를') + ' 지나요. 이 그래프의 식을 고르세요.'; ans = std(a, p, v);
      cands = mixc([[std(a, -p, v), 'x-sign', '괄호 안의 부호가 반대예요. 꼭짓점의 $x$좌표가 $p$이면 괄호 안은 $x - p$예요.']], [[std([-a[0], a[1]], p, v), 'direction', '볼록한 방향이 반대예요. 그림이 아래로 볼록하면 $x^{2}$ 앞의 수는 양수, 위로 볼록하면 음수예요.'],
        [std(a, p, -v), 'y-sign', '식 끝의 수의 부호가 반대예요. 꼭짓점의 $y$좌표를 부호 그대로 식 끝에 써요.'], [std(a, v, p), 'swapped', '꼭짓점의 두 좌표의 자리를 바꿔 넣었어요. $x$좌표는 괄호 안에, $y$좌표는 식 끝에 써요.']], q.perm);
      steps = [{ say: '꼭짓점의 좌표를 $y = a(x - p)^{2} + q$에 넣어요.', tex: 'y = a' + sq(p) + tail(v) }, { say: '지나는 다른 한 점의 좌표를 넣어 $a$를 구해요.', tex: y1 + ' = a \\times ' + par(q.side * dx) + '^{2}' + tail(v) + ',\\quad a = ' + num(a) }, { say: '구한 $a$를 식에 써요.', tex: ans }];
      h2 = '식을 $y = a(x - p)^{2} + q$ 꼴로 세워요. 먼저 꼭짓점을 읽어요. 꼭짓점의 $x$좌표가 $p$, $y$좌표가 $q$예요. 괄호 안은 $x - p$이니 부호가 거꾸로 보이는 것에 주의해요. 다음은 $a$예요. 그림이 아래로 볼록한지 위로 볼록한지로 부호를 정하고, 표시된 다른 한 점의 좌표를 식에 넣어 값을 구해요. 꼭짓점에서 옆으로 한 칸 갔을 때 위아래로 몇 칸 움직였는지를 봐도 돼요.';
    }
    return finish({ tex: tex, text: text, figure: fig, ans: ans, cands: cands, steps: steps, ok: q.kind !== 'fig' || (abs(y1) <= 5 && abs(p + q.side * dx) <= 5),
      hints: [VTX, h2, '① 식을 $y = a(x - p)^{2} + q$와 나란히 놓고 견줘요. ② 괄호 안을 0으로 만드는 $x$의 값이 $p$예요. ③ 식 끝의 수가 $q$예요. ④ 꼭짓점은 ($p$, $q$), 축은 $x = p$예요.'] });
  };
  var okV = function (q) { var p = vertexBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B22.vertex', title: '꼭짓점과 축', build: vertexBuild,
    ids: ['sign', 'swapped', 'swapped-sign', 'x-sign', 'y-sign', 'both-signs', 'vertex-y', 'axis-letter', 'direction'],
    levels: [
      { name: 'y = ax² + q · y = a(x − p)² 의 꼭짓점', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { var t = nz(r, -8, 8); return mk(r, r.int(0, 1) ? { kind: 'one', a: r.pick(POOL), p: t } : { kind: 'one', a: r.pick(POOL), q: t }); }, okV); }) } },
      { name: 'y = a(x − p)² + q 의 꼭짓점', minDistinct: 250, vars: { q: sampler(function (r) { return until(function () { return mk(r, { kind: 'both', a: r.pick(POOL), p: nz(r, -7, 7), q: nz(r, -7, 7) }); }, okV); }) } },
      { name: '축의 방정식 · 그림을 보고 식 고르기', minDistinct: 200, vars: { q: sampler(function (r) {
          return until(function () {
            if (r.int(0, 1)) return mk(r, { kind: 'axis', a: r.pick(POOL), p: nz(r, -7, 7), q: nz(r, -7, 7) });
            return mk(r, { kind: 'fig', a: r.pick([[1, 1], [-1, 1], [2, 1], [-2, 1], [1, 2], [-1, 2]]), p: nz(r, -3, 3), q: nz(r, -4, 4), side: pm(r, 1) });
          }, okV);
        }) } }
    ]
  });

  /* ── B22.standard 일반형을 표준형으로 ────────────────── */
  var FOLD = '$y = ax^{2} + bx + c$ 꼴(일반형)은 꼭짓점이 바로 보이지 않아요. 그래서 $y = a(x - p)^{2} + q$ 꼴(표준형)로 고쳐요. 방법은 이차방정식에서 배운 완전제곱식 만들기와 같아요. $x$의 계수의 절반을 제곱한 수를 더해서 완전제곱식을 만들어요. 다만 이번에는 등식의 양쪽이 아니라 한쪽 식만 고치는 것이라서, 더한 수를 바로 다시 빼 줘야 식의 값이 변하지 않아요. 더하고 빼면 0이니까요.';
  var stdBuild = function (q) {
    var a = q.a, h = q.h, c = q.c, b = 2 * a * h, v = c - a * h * h, A1 = [a, 1], tex = gen(a, b, c), ans, text, cands, steps, h2, inner = quad(1, 2 * h, 0);
    var W_C = '상수항을 그대로 뒀어요. 완전제곱식을 만들려고 더한 수를 다시 빼 줘야 식의 값이 변하지 않아요.';
    var W_X = '괄호 안의 부호가 반대예요. 괄호 안에 들어가는 수는 $x$의 계수의 절반이고, 부호도 그대로 따라가요.';
    var W_A = '더한 수를 다시 뺄 때 $x^{2}$ 앞의 수를 곱하지 않았어요. 괄호 안에서 더한 수는 괄호 밖으로 나올 때 괄호 앞의 수가 곱해져요.';
    steps = (a === 1 ? [] : [{ say: '$x$가 든 두 항을 $x^{2}$의 계수 $' + a + '$' + pj(a, '으로/로') + ' 묶어요. 상수항은 밖에 둬요.', tex: 'y = ' + (a === -1 ? '-' : a) + '(' + inner + ')' + tail(c) }]).concat([
      { say: '$x$의 계수 $' + 2 * h + '$의 절반은 $' + h + '$' + pj(h, '이에요/예요') + '. 그 제곱 $' + h * h + '$' + pj(h * h, '을/를') + ' 더하고 바로 빼요.', tex: 'y = ' + (a === 1 ? quad(1, 2 * h, h * h) + ' - ' + h * h : (a === -1 ? '-' : a) + '(' + quad(1, 2 * h, h * h) + ' - ' + h * h + ')') + tail(c) },
      { say: '완전제곱식으로 묶어요.' + (a === 1 ? '' : ' 괄호 안에서 뺀 수는 $' + a + '$' + pj(a, '이/가') + ' 곱해져서 밖으로 나와요.'), tex: 'y = ' + ct(A1) + sq(-h) + tail(-a * h * h) + tail(c) },
      { say: '상수끼리 계산해요.', tex: std(A1, -h, v) }]);
    if (q.kind === 'form') {
      text = '위 이차함수의 식을 $y = a(x - p)^{2} + q$ 꼴로 고친 것을 고르세요.'; ans = std(A1, -h, v);
      cands = mixc(a === 1 ? [[std(A1, -h, c), 'const-kept', W_C]] : [[std(A1, -h, c - h * h), 'a-not-multiplied', W_A]], [
        a === 1 ? null : [std(A1, -h, c), 'const-kept', W_C],
        [std(A1, -h, c + a * h * h), 'added', '더한 수를 빼지 않고 한 번 더 더했어요. 완전제곱식을 만들려고 더한 만큼을 다시 빼야 해요.'],
        [std(A1, h, v), 'x-sign', W_X],
        [std(A1, -2 * h, c - 4 * a * h * h), 'not-halved', '$x$의 계수를 반으로 나누지 않았어요. 괄호 안에 들어가는 수는 $x$의 계수의 절반이에요.'],
        a === 1 ? null : [std([1, 1], -h, v), 'a-lost', '$x^{2}$ 앞의 수를 빠뜨렸어요. 묶어 낸 수는 괄호 앞에 그대로 남아 있어야 해요.']], q.perm);
    } else {
      text = '위 이차함수의 그래프의 꼭짓점의 좌표를 고르세요.'; ans = pt(-h, v);
      cands = mixc([[pt(h, v), 'x-sign', '$x$좌표의 부호가 반대예요. 괄호 안이 $x + 3$이면 꼭짓점의 $x$좌표는 $-3$이에요. 괄호 안을 0으로 만드는 값을 써요.']], [
        [pt(-h, c), 'const-kept', '상수항을 그대로 $y$좌표로 썼어요. 완전제곱식을 만들려고 더한 수를 다시 빼야 $y$좌표가 나와요.'],
        a === 1 ? null : [pt(-h, c - h * h), 'a-not-multiplied', W_A],
        [pt(b, c), 'coef-read', '$x$의 계수와 상수항을 그대로 읽었어요. 일반형에서는 꼭짓점이 보이지 않아요. 먼저 완전제곱식 꼴로 고쳐요.'],
        [pt(v, -h), 'swapped', '$x$좌표와 $y$좌표의 자리를 바꿨어요. 괄호 안에서 $x$좌표를, 식 끝에서 $y$좌표를 읽어요.']], q.perm);
      steps = steps.concat([{ say: '괄호 안을 0으로 만드는 값이 $x$좌표, 식 끝의 수가 $y$좌표예요.', tex: ans }]);
    }
    h2 = (a === 1 ? '$x^{2}$ 앞의 수가 1이니 바로 시작해요. ' : '$x^{2}$ 앞에 $' + a + '$' + pj(a, '이/가') + ' 있으니, 먼저 $x$가 든 두 항을 그 수로 묶어요. 상수항은 괄호 밖에 그대로 둬요. ') + '$x$의 계수를 반으로 나누고, 나눈 수를 제곱해요. 그 수를 더하면 완전제곱식이 만들어져요. 식의 값이 바뀌면 안 되니 더한 수를 바로 다시 빼요.' + (a === 1 ? '' : ' 이때 뺀 수는 괄호 안에 있으니, 괄호 밖으로 꺼낼 때 괄호 앞의 수를 곱해야 해요. 여기서 실수가 가장 많이 나와요.') + ' 마지막으로 상수끼리 계산해요.' + (q.kind === 'form' ? '' : ' 고친 식에서 꼭짓점을 읽어요.');
    return finish({ tex: tex, text: text, ans: ans, cands: cands, steps: steps, ok: v !== 0 && c - h * h !== 0,
      hints: [FOLD, h2, '① $x^{2}$의 계수로 $x$가 든 항을 묶어요. ② $x$의 계수의 절반을 제곱한 수를 더하고 빼요. ③ 완전제곱식으로 묶고, 뺀 수를 괄호 밖으로 꺼내요(괄호 앞의 수를 곱해요). ④ 고친 식을 전개해서 처음 식과 같은지 확인해요.'] });
  };
  var okD = function (q) { var p = stdBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B22.standard', title: '일반형을 표준형으로', build: stdBuild,
    ids: ['const-kept', 'a-not-multiplied', 'added', 'x-sign', 'not-halved', 'a-lost', 'coef-read', 'swapped'],
    levels: [
      { name: 'y = x² + bx + c', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { return mk(r, { kind: 'form', a: 1, h: nz(r, -6, 6), c: nz(r, -9, 9) }); }, okD); }) } },
      { name: 'x² 에 계수가 있는 식', minDistinct: 250, vars: { q: sampler(function (r) { return until(function () { return mk(r, { kind: 'form', a: r.pick([-1, 2, -2, 3, -3]), h: nz(r, -4, 4), c: nz(r, -9, 9) }); }, okD); }) } },
      { name: '일반형에서 꼭짓점 구하기', minDistinct: 250, vars: { q: sampler(function (r) { return until(function () { return mk(r, { kind: 'vertex', a: r.pick([1, -1, 2, -2]), h: nz(r, -5, 5), c: nz(r, -9, 9) }); }, okD); }) } }
    ]
  });

  /* ── B22.read 그래프에서 값 구하기 ─────────────────── */
  var READ = '그래프와 식은 같은 것을 두 가지 방법으로 나타낸 것이에요. 그래프 위의 점은 모두 식을 참으로 만들어요. 그래서 그래프에 대한 질문은 식에 수를 넣는 계산으로 바꿀 수 있어요. $y$축 위의 점은 $x$좌표가 0이니, $y$축과 만나는 점을 물으면 $x = 0$을 넣어요. 그래프가 어떤 점을 지난다고 하면 그 점의 좌표를 넣어요. 꼭짓점을 물으면 식을 완전제곱식 꼴로 고쳐서 읽어요.';
  var readBuild = function (q) {
    var a = q.a, p = q.p, v = q.q, h = q.h, c = q.c, k, m, d = q.d, tex, text, ans, wrong = {}, steps, h2;
    if (q.kind === 'yint-std') {
      tex = std([a, 1], p, v); text = '위 이차함수의 그래프가 $y$축과 만나는 점의 $y$좌표를 구하세요.'; ans = a * p * p + v;
      wrong['vertex-y'] = v; wrong['square-sign'] = -a * p * p + v; wrong['not-squared'] = -a * p + v; wrong['vertex-x'] = p;
      steps = [{ say: '$y$축 위의 점은 $x$좌표가 0이에요. $x = 0$을 넣어요.', tex: 'y = ' + mulA(a, '(0 ' + (p > 0 ? '- ' : '+ ') + abs(p) + ')^{2}') + tail(v) }, { say: '괄호 안을 계산하고 제곱해요.', tex: 'y = ' + mulA(a, par(-p) + '^{2}') + tail(v) + ' = ' + sum([a * p * p, v]) }, { say: '마저 계산해요.', tex: 'y = ' + ans }];
      h2 = '$y$축과 만나는 점은 $y$축 위에 있어요. $y$축 위의 점은 모두 $x$좌표가 0이에요. 그러니 식의 $x$ 자리에 0을 넣고 $y$의 값을 계산하면 돼요. 괄호 안을 먼저 계산하고, 그 결과를 제곱해요. 음수를 제곱하면 양수가 돼요. 거기에 괄호 앞의 수를 곱하고, 마지막에 식 끝의 수를 더해요. 식 끝의 수만 읽으면 안 돼요. 그 수는 꼭짓점의 $y$좌표예요.';
    } else if (q.kind === 'yint-gen') {
      tex = gen(a, q.b, c); text = '위 이차함수의 그래프가 $y$축과 만나는 점의 $y$좌표를 구하세요.'; ans = c;
      wrong['x-coef'] = q.b; wrong['one-plugged'] = a + q.b + c; wrong.lead = a;
      steps = [{ say: '$y$축 위의 점은 $x$좌표가 0이에요. $x = 0$을 넣어요.', tex: 'y = ' + mulA(a, '0^{2}') + (q.b < 0 ? ' - ' : ' + ') + (abs(q.b) === 1 ? '' : abs(q.b) + ' \\times ') + '0' + tail(c) }, { say: '$x$가 든 항은 모두 0이 되고 상수항만 남아요.', tex: 'y = ' + ans }];
      h2 = '$y$축과 만나는 점은 $y$축 위에 있어요. $y$축 위의 점은 모두 $x$좌표가 0이에요. 그러니 식의 $x$ 자리마다 0을 넣어요. 0은 제곱해도 0이고, 어떤 수를 곱해도 0이에요. 그래서 $x$가 들어 있는 항은 모두 사라져요. 끝까지 남는 항이 무엇인지 살펴봐요. 그 항을 부호까지 함께 읽으면 답이에요. $x$ 자리에 1을 넣지 않도록 조심해요.';
    } else if (q.kind === 'pass') {
      k = p + d; m = a * d * d + v; tex = 'y = ' + ct([a, 1]) + sq(p) + ' + q';
      text = '위 이차함수의 그래프가 점 $' + pt(k, m) + '$' + pj(m, '을/를') + ' 지날 때, 상수 $q$의 값을 구하세요.'; ans = v;
      wrong.added = m + a * d * d; wrong['not-squared'] = m - a * d; wrong['bracket-sign'] = m - a * (k + p) * (k + p); wrong['y-copied'] = m;
      steps = [{ say: '점의 좌표를 넣어요. $x$ 자리에 $' + k + '$, $y$ 자리에 $' + m + '$' + pj(m, '이에요/예요') + '.', tex: m + ' = ' + mulA(a, '(' + k + (p > 0 ? ' - ' : ' + ') + abs(p) + ')^{2}') + ' + q' }, { say: '괄호 안을 계산하고 제곱한 다음 곱해요.', tex: m + ' = ' + a * d * d + ' + q' }, { say: '수를 반대쪽으로 옮겨요.', tex: 'q = ' + ans }];
      h2 = '그래프가 점을 지나면 그 점의 좌표를 식에 넣었을 때 등식이 맞아요. 좌표의 앞의 수 $' + k + '$' + pj(k, '은/는') + ' $x$ 자리에, 뒤의 수 $' + m + '$' + pj(m, '은/는') + ' $y$ 자리에 넣어요. 그러면 문자는 $q$ 하나만 남아요. 괄호 안을 먼저 계산해요. 괄호 안의 부호를 식에 쓰인 그대로 지켜요. 그다음 제곱하고, 괄호 앞의 수를 곱해요. 마지막으로 그 수를 등호 반대쪽으로 옮기면 $q$가 나와요.';
    } else {
      tex = gen(a, 2 * a * h, c); text = '위 이차함수의 그래프의 꼭짓점의 $y$좌표를 구하세요.'; ans = c - a * h * h;
      wrong['const-kept'] = c; wrong['a-not-multiplied'] = c - h * h; wrong.added = c + a * h * h; wrong['vertex-x'] = -h;
      steps = [{ say: '완전제곱식 꼴로 고쳐요. $x$의 계수의 절반을 제곱한 수를 더하고 빼요.', tex: 'y = ' + (a === 1 ? quad(1, 2 * h, h * h) + ' - ' + h * h : (a === -1 ? '-' : a) + '(' + quad(1, 2 * h, h * h) + ' - ' + h * h + ')') + tail(c) }, { say: '완전제곱식으로 묶고 상수끼리 계산해요.', tex: std([a, 1], -h, ans) }, { say: '식 끝의 수가 꼭짓점의 $y$좌표예요.', tex: 'y = ' + ans }];
      h2 = '일반형에서는 꼭짓점이 바로 보이지 않아요. 식을 완전제곱식 꼴로 고쳐야 해요.' + (a === 1 ? '' : ' 먼저 $x$가 든 두 항을 $x^{2}$ 앞의 수로 묶어요.') + ' $x$의 계수를 반으로 나누고 제곱한 수를 더해서 완전제곱식을 만들고, 더한 만큼을 바로 다시 빼요.' + (a === 1 ? '' : ' 뺀 수를 괄호 밖으로 꺼낼 때는 괄호 앞의 수를 곱해요.') + ' 상수끼리 계산하고 나면 식 끝에 남는 수가 꼭짓점의 $y$좌표예요. 처음 식의 상수항을 그대로 읽으면 안 돼요.';
    }
    return { tex: tex, text: text, ans: ans, wrong: wrong, steps: steps, check: enough(wrong, ans),
      hints: [READ, h2, '① 묻는 것을 식의 말로 바꿔요($y$축과 만나는 점 → $x = 0$, 지나는 점 → 좌표를 넣기, 꼭짓점 → 완전제곱식 꼴). ② 괄호 안, 제곱, 곱셈, 덧셈의 차례로 계산해요. ③ 음수는 괄호를 쳐서 계산해요. ④ 구한 값을 식에 넣어 확인해요.'] };
  };
  numQ({
    id: 'B22.read', title: '그래프에서 값 구하기', kind: 'signed', build: readBuild,
    mistakes: [['vertex-y', '식 끝의 수를 그대로 답했어요. 그 수는 꼭짓점의 $y$좌표예요. $y$축과 만나는 점은 $x = 0$을 넣어 계산해요.'],
      ['square-sign', '음수를 제곱할 때 부호가 틀렸어요. 괄호 안이 음수여도 제곱하면 양수예요.'],
      ['not-squared', '괄호를 제곱하지 않고 그냥 곱했어요. 괄호 안을 계산한 값을 두 번 곱한 다음 앞의 수를 곱해요.'],
      ['vertex-x', '꼭짓점의 $x$좌표를 답했어요. 문제에서 묻는 것은 $y$좌표예요.'],
      ['x-coef', '$x$의 계수를 답했어요. $x = 0$을 넣으면 $x$가 든 항은 모두 0이 되고 상수항만 남아요.'],
      ['one-plugged', '$x$ 자리에 1을 넣었어요. $y$축 위의 점은 $x$좌표가 0이에요. 0을 넣어요.'],
      ['lead', '$x^{2}$의 계수를 답했어요. $x = 0$을 넣으면 $x$가 든 항은 모두 0이 되고 상수항만 남아요.'],
      ['added', '빼야 할 수를 더했어요. 계산한 수를 등호 반대쪽으로 옮기거나 더한 수를 되돌릴 때는 부호가 바뀌어요.'],
      ['bracket-sign', '괄호 안의 부호를 바꿔 계산했어요. 괄호 안은 식에 쓰인 부호 그대로 계산해요.'],
      ['y-copied', '점의 $y$좌표를 그대로 답했어요. 좌표를 식에 넣어서 $q$에 대한 방정식을 풀어야 해요.'],
      ['const-kept', '상수항을 그대로 답했어요. 상수항은 $y$축과 만나는 점의 $y$좌표예요. 꼭짓점은 완전제곱식 꼴로 고쳐야 보여요.'],
      ['a-not-multiplied', '더한 수를 다시 뺄 때 $x^{2}$ 앞의 수를 곱하지 않았어요. 괄호 안에서 뺀 수는 밖으로 나올 때 괄호 앞의 수가 곱해져요.']],
    levels: [
      { name: 'y축과 만나는 점', minDistinct: 150, vars: { q: sampler(function (r) { return r.int(0, 2) === 0 ? { kind: 'yint-gen', a: r.pick([1, -1, 2, -2, 3]), b: nz(r, -8, 8), c: nz(r, -9, 9) } : { kind: 'yint-std', a: r.pick([1, -1, 2, -2, 3]), p: nz(r, -4, 4), q: nz(r, -9, 9) }; }) } },
      { name: '지나는 점으로 상수 구하기', minDistinct: 250, vars: { q: sampler(function (r) { return { kind: 'pass', a: r.pick([1, -1, 2, -2, 3]), p: nz(r, -4, 4), d: nz(r, -3, 3), q: nz(r, -9, 9) }; }) } },
      { name: '일반형의 꼭짓점의 y좌표', minDistinct: 150, vars: { q: sampler(function (r) { return { kind: 'vy', a: r.pick([1, -1, 2, -2, 3]), h: nz(r, -4, 4), c: nz(r, -9, 9) }; }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B22', [
  { title: '이차함수', body: [
    '$y$가 $x$에 대한 이차식으로 나타나는 함수를 이차함수라고 해요.',
    { tex: 'y = ax^{2} + bx + c \\quad (a \\neq 0)' },
    '$x$의 값을 넣으면 $y$의 값이 하나로 정해져요. 제곱을 먼저 계산해요.',
    { ex: [['y = 2x^{2}', '$x = 3$이면 $y = 2 \\times 9 = 18$'], ['y = 2x^{2}', '$x = -3$이어도 $y = 2 \\times 9 = 18$']] },
    '$x$가 $3$일 때와 $-3$일 때 $y$의 값이 같아요. 그래서 그래프가 좌우로 똑같은 모양이 돼요.'
  ] },
  { title: 'y = x² 의 그래프', body: [
    '이차함수의 그래프는 공을 던졌을 때 그리는 길처럼 생긴 곡선이에요. 이 곡선을 포물선이라고 해요.',
    { figure: { type: 'plane', range: 5, parab: [1, 1, 0, 0], points: [{ x: 1, y: 1 }, { x: 2, y: 4 }, { x: -1, y: 1 }, { x: -2, y: 4 }] } },
    '포물선이 꺾이는 점을 꼭짓점, 포물선을 반으로 접는 선을 축이라고 해요. $y = x^{2}$의 꼭짓점은 원점이고 축은 $y$축이에요.'
  ] },
  { title: 'a 가 하는 일: 방향과 폭', body: [
    '$y = ax^{2}$에서 $a$의 부호는 방향을, $a$의 절댓값은 폭을 정해요.',
    { ex: [['a > 0', '아래로 볼록(그릇 모양)'], ['a < 0', '위로 볼록(엎은 그릇 모양)']] },
    { figure: { type: 'plane', range: 5, parab: [-2, 1, 0, 0] } },
    '위 그림은 $y = -2x^{2}$이에요. 절댓값이 클수록 폭이 좁고, 작을수록 폭이 넓어요. $y = 2x^{2}$과 $y = -2x^{2}$은 폭이 같고 $x$축에 대하여 대칭이에요.'
  ] },
  { title: '평행이동', body: [
    '그래프를 모양 그대로 밀어 옮기는 것이 평행이동이에요. $y = ax^{2}$의 그래프를 좌우로 $p$, 위아래로 $q$만큼 옮기면 식은 이렇게 돼요.',
    { tex: 'y = a(x - p)^{2} + q' },
    { figure: { type: 'plane', range: 5, parab: [1, 1, 2, -3], points: [{ x: 2, y: -3 }] } },
    '위 그림은 $y = x^{2}$의 그래프를 오른쪽으로 2, 아래로 3만큼 옮긴 $y = (x - 2)^{2} - 3$ 이에요. 오른쪽으로 옮겼는데 괄호 안은 빼기예요.'
  ] },
  { title: '꼭짓점과 축', body: [
    '$y = a(x - p)^{2} + q$ 꼴에서는 꼭짓점과 축이 바로 보여요.',
    { ex: [['\\text{꼭짓점}', '점 ($p$, $q$)'], ['\\text{축}', '직선 $x = p$']] },
    { ex: [['y = 2(x - 1)^{2} + 3', '꼭짓점 $(1,\\ 3)$, 축 $x = 1$'], ['y = -(x + 4)^{2} - 5', '꼭짓점 $(-4,\\ -5)$, 축 $x = -4$']] },
    '괄호 안을 0으로 만드는 $x$의 값이 꼭짓점의 $x$좌표예요. 식 끝의 수는 부호 그대로 $y$좌표예요.'
  ] },
  { title: '일반형을 표준형으로', body: [
    '$y = ax^{2} + bx + c$ 꼴은 완전제곱식을 만들어서 고쳐요. 더한 수는 바로 다시 빼요.',
    { tex: 'y = x^{2} + 6x + 2 = (x^{2} + 6x + 9) - 9 + 2 = (x + 3)^{2} - 7' },
    '$x^{2}$ 앞에 수가 있으면 먼저 그 수로 묶어요. 괄호 안에서 뺀 수는 밖으로 나올 때 그 수가 곱해져요.',
    { tex: 'y = 2x^{2} - 8x + 3 = 2(x^{2} - 4x + 4 - 4) + 3 = 2(x - 2)^{2} - 5' },
    '$x = 0$을 넣으면 상수항만 남아요. 그래서 상수항 $c$는 그래프가 $y$축과 만나는 점의 $y$좌표예요.'
  ] }
]);
