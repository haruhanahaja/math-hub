/* B16 일차함수와 일차방정식 — 직선의 방정식, 두 직선의 교점과 연립방정식의 해
   유형(쉬운 것부터): B16.form 일차방정식을 y = … 꼴로(보기 고르기) · B16.read 기울기 · 절편 · 지나는 점(키패드, 분수)
                     · B16.axis 축에 평행한 직선(보기 고르기. 그림) · B16.cross 두 직선의 교점(보기 고르기. 그림)
                     · B16.count 해의 개수와 위치 관계(보기 고르기) · B16.param 상수 구하기(키패드)
   답이 수 하나이면 키패드, 답이 식 · 순서쌍 · 개념 판단이면 보기 고르기다.
   일차방정식은 { a, b, c }(a x + b y = c)로 다루고, form 1 이면 a x + b y − c = 0 꼴로 보여 준다. 계산은 모두 정수의 분수 계산이다.
   검산: 답을 만든 계산과 따로, 화면에 보이는 식을 MH.alg.ev 로 읽어 점을 넣어 본다.
   그림은 figure { type: 'plane', line, line2, vline, hline } 로 그린다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, order4 = A.order4, gcd = MH.gcd, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!(q && ok(q)) && ++i < 150); return q; };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };

  /* ── 분수 ── */
  var rat = function (n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(abs(n), d) || 1; return { n: n / g, d: d / g }; };
  var R = function (n) { return { n: n, d: 1 }; };
  var neg = function (a) { return { n: -a.n, d: a.d }; };
  var same = function (a, b) { return !!a && !!b && a.n === b.n && a.d === b.d; };
  var fr = function (r) { return (r.n < 0 ? '-' : '') + (r.d === 1 ? String(abs(r.n)) : '\\dfrac{' + abs(r.n) + '}{' + r.d + '}'); };
  var rj = function (r, pair) { return r.d === 1 ? pj(r.n, pair) : pair.split('/')[1]; };
  var xTerm = function (m) { return m.d === 1 ? (m.n === 1 ? 'x' : m.n === -1 ? '-x' : m.n + 'x') : (m.n < 0 ? '-' : '') + '\\dfrac{' + abs(m.n) + '}{' + m.d + '}x'; };
  var tail = function (k) { return k.n === 0 ? '' : (k.n < 0 ? ' - ' : ' + ') + fr({ n: abs(k.n), d: k.d }); };
  var line = function (m, k) { return 'y = ' + (m.n === 0 ? fr(k) : xTerm(m) + tail(k)); };
  var pt = function (x, y) { return '(' + x + ',\\ ' + y + ')'; };
  var cases = function (list) { return '\\begin{cases} ' + list.join(' \\\\ ') + ' \\end{cases}'; };
  var NAME = ['첫째 식', '둘째 식'];

  /* ── 일차방정식 a x + b y = c ── */
  var E = function (a, b, c, form) { return { a: a, b: b, c: c, form: form || 0 }; };
  var gen = function (e) { return e.form === 2 ? line(rat(-e.a, e.b), rat(e.c, e.b)) : e.form === 1 && e.c !== 0 ? poly([[e.a, 'x'], [e.b, 'y'], [-e.c, '']]) + ' = 0' : poly([[e.a, 'x'], [e.b, 'y']]) + ' = ' + e.c; };
  var slopeE = function (e) { return rat(-e.a, e.b); };
  var cramer = function (e1, e2) {
    var D = e1.a * e2.b - e2.a * e1.b, p, q;
    if (!D) return null;
    p = (e1.c * e2.b - e2.c * e1.b) / D; q = (e1.a * e2.c - e2.a * e1.c) / D;
    return isInt(p) && isInt(q) ? { p: p, q: q } : null;
  };
  /** 화면에 보이는 등식에 x, y 를 넣으면 양쪽이 같은가 — 답을 만든 계산과 따로 하는 검산. 문자의 값은 분수 { n, d } */
  var F = function (r) { return MH.F(r.n, r.d); };
  var onEq = function (tex, x, y, more) {
    try { var env = { x: F(x), y: F(y) }, k, s = tex.split(' = '); for (k in more || {}) env[k] = F(more[k]); return s.length === 2 && A.ev(s[0], env).equals(A.ev(s[1], env)); } catch (e) { return false; }
  };
  var sub = function (e, x, y) { return e.form === 2 ? null : (e.a === 1 ? '' : e.a === -1 ? '-' : e.a + ' \\times ') + par(x) + (e.b < 0 ? ' - ' : ' + ') + (abs(e.b) === 1 ? '' : abs(e.b) + ' \\times ') + par(y); };

  /* ── 틀: 보기 고르기 / 수 하나 (B15 와 같은 틀) ── */
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return p.options || v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) {
      var p = P(v), list;
      if (!p || p.check !== true || p.wrong.length !== 3) return false;
      list = all(p);
      return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }) && (!p.options || (p.options.length === 4 && list.every(function (t) { return p.options.indexOf(t) >= 0; })));
    };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B16', version: 1, title: o.title,
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
  /** o.kind: 'signed'(정수) | 'rational'(분수). build(q) → { text, tex, ans: { n, d }, hints, steps, wrong: { 실수 id: 수 | { n, d } }, check } */
  var valueQ = function (o) {
    var lastQ = null, lastP = null, K = o.kind;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (r) { return K === 'rational' ? { n: r.n, d: r.d } : { n: r.n, p: 0 }; };
    var leak = function (p) {
      if (p.ans.d !== 1 || p.ans.n < 0) return false;
      var a = String(p.ans.n);
      return nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0;
    };
    o.levels.forEach(function (lv) {
      lv.where = function (v) { var p = P(v); return !!p && !!p.ans && p.ans.n !== 0 && (K === 'rational' || p.ans.d === 1) && p.check === true && !leak(p); };
    });
    MH.defineType({
      id: o.id, unit: 'B16', version: 1, title: o.title,
      answer: { kind: K },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; return out; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v); return p.check === true && (K === 'rational' ? ans.n === p.ans.n && ans.d === p.ans.d && gcd(abs(ans.n), ans.d) === 1 : ans.p === 0 && ans.n === p.ans.n); },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        var norm = function (x) { return x === null || x === undefined ? null : typeof x === 'number' ? (isInt(x) ? R(x) : null) : x; };
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), r = norm(p.wrong[m[0]]), i, e;
            if (!r || same(r, p.ans) || same(r, neg(p.ans)) || (K !== 'rational' && r.d !== 1)) return null;   /* 부호만 반대인 답은 공통 실수(sign)가 맡는다 */
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) { e = norm(p.wrong[o.mistakes[i][0]]); if (same(e, r)) return null; }
            return val(r);
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  /* ── B16.form 일차방정식을 y = … 꼴로 ───────────────── */
  var FORM = '$x$, $y$가 든 일차방정식 $ax + by + c = 0$의 해를 좌표평면에 모두 찍으면 직선이 돼요. 이 방정식을 $y$에 대해 풀어 $y = \\cdots$ 꼴로 고치면 일차함수의 식과 똑같아져요. 같은 직선을 두 가지 옷으로 입힌 것이에요. $y = \\cdots$ 꼴로 고쳐야 기울기와 $y$절편이 바로 보여요.';
  var formBuild = function (q) {
    var e = q.e, m = slopeE(e), k = rat(e.c, e.b), t = gen(e), ans = line(m, k), cands, wrong = [], seen = [ans], moved = poly([[e.b, 'y']]) + ' = ' + poly([[-e.a, 'x'], [e.c, '']]), steps;
    cands = [[rat(e.a, e.b), k, 'move-sign', '$x$가 있는 항을 이항하면서 부호를 바꾸지 않았어요. 등호를 건너가면 $+$는 $-$로, $-$는 $+$로 바뀌어요. 그래서 기울기의 부호가 반대로 나왔어요.'],
      [m, rat(-e.c, e.b), 'const-sign', '상수항의 부호가 틀렸어요. ' + (e.form === 1 ? '상수항도 등호를 건너가면 부호가 바뀌어요.' : '상수항은 이미 오른쪽에 있으니 부호가 그대로예요. 등호를 건너간 항만 부호가 바뀌어요.') + ' 나눌 때 $y$ 앞의 수의 부호도 함께 따져요.'],
      abs(e.b) !== 1 ? [R(-e.a), R(e.c), 'not-divided', '이항만 하고 $y$ 앞의 수 $' + e.b + '$' + pj(e.b, '으로/로') + ' 나누지 않았어요. $y$ 앞의 수가 1이 되어야 $y = \\cdots$ 꼴이에요. 오른쪽의 모든 항을 그 수로 나눠요.'] : null,
      [rat(e.a, e.b), rat(-e.c, e.b), 'both-sign', '기울기와 상수항의 부호가 모두 반대예요. ' + (e.b < 0 ? '$y$ 앞의 수가 음수예요. 음수로 나누면 오른쪽의 모든 항의 부호가 바뀌어요.' : '이항한 항의 부호를 하나씩 다시 확인해요.')]];
    cands.forEach(function (c) { var s; if (!c || wrong.length >= 3) return; s = line(c[0], c[1]); if (seen.indexOf(s) < 0) { seen.push(s); wrong.push([s, c[2], c[3]]); } });
    steps = [{ say: '$y$가 있는 항만 왼쪽에 남기고, 나머지 항을 오른쪽으로 이항해요. 이항하면 부호가 바뀌어요.', tex: moved }];
    if (e.b !== 1) steps.push({ say: '양쪽을 $y$ 앞의 수 $' + e.b + '$' + pj(e.b, '으로/로') + ' 나눠요. 오른쪽의 모든 항을 나눠요.' + (e.b < 0 ? ' 음수로 나누니 부호가 모두 바뀌어요.' : ''), tex: ans });
    else steps.unshift({ say: '$y$만 왼쪽에 남기는 것이 목표예요.', tex: t });
    return { tex: t, text: '이 일차방정식을 $y = ax + b$ 꼴로 고친 것을 고르세요.', ans: ans, wrong: wrong, steps: steps,
      check: [0, e.b, -e.b].every(function (x) { var y = A.ev(ans.slice(4), { x: MH.F(x, 1) }); return onEq(t, R(x), { n: Number(y.s * y.n), d: Number(y.d) }); }),
      hints: [FORM, '이 식에서 $y$가 있는 항은 $' + poly([[e.b, 'y']]) + '$' + (abs(e.b) === 1 ? '' : ' 하나') + '예요. 이 항만 왼쪽에 두고, $x$가 있는 항' + (e.form === 1 ? '과 상수항을' : '을') + ' 오른쪽으로 보내요. 등호를 건너가는 항은 부호가 바뀌어요. ' + (abs(e.b) === 1 && e.b > 0 ? '$y$ 앞의 수가 1이니 이항만 하면 끝나요.' : '그다음 양쪽을 $y$ 앞의 수 $' + e.b + '$' + pj(e.b, '으로/로') + ' 나눠요. 오른쪽의 항 하나하나를 모두 나눠야 해요.' + (e.b < 0 ? ' 음수로 나누면 부호가 모두 바뀌어요.' : '')),
        '① $y$가 있는 항만 왼쪽에 남겨요. ② 나머지 항을 오른쪽으로 이항하면서 부호를 바꿔요. ③ 양쪽을 $y$ 앞의 수로 나눠요. 나누어떨어지지 않으면 분수로 써요. ④ $x$가 있는 항을 앞에, 수를 뒤에 써서 $y = ax + b$ 꼴로 맞춰요.'] };
  };
  var formQ = function (r, lv) {
    return until(function () {
      var b = lv === 0 ? pm(r, 1) : pm(r, r.int(2, 5)), a = lv === 1 ? b * nz(r, -4, 4) : nz(r, -7, 7), c = lv === 2 ? nz(r, -12, 12) : b * nz(r, -6, 6);
      return lv === 2 && a % b === 0 ? null : { e: E(a, b, c, r.int(0, 1)), o: order4(r) };
    }, function (q) { var p = formBuild(q); return !!p && p.check && p.wrong.length === 3; });
  };
  choiceQ({
    id: 'B16.form', title: '일차방정식을 y = ax + b 꼴로', ids: ['move-sign', 'const-sign', 'not-divided', 'both-sign'], build: formBuild,
    levels: [
      { name: '이항만 하면 되는 식', vars: { q: sampler(function (r) { return formQ(r, 0); }) } },
      { name: 'y 앞의 수로 나누기', vars: { q: sampler(function (r) { return formQ(r, 1); }) } },
      { name: '분수가 나오는 식', vars: { q: sampler(function (r) { return formQ(r, 2); }) } }
    ]
  });

  /* ── B16.read 기울기 · 절편 · 지나는 점 ──────────────── */
  var READ = '일차방정식의 그래프도 직선이에요. 기울기와 절편을 알고 싶으면 두 가지 길이 있어요. 하나는 $y = ax + b$ 꼴로 고쳐서 $a$(기울기)와 $b$($y$절편)를 읽는 길이에요. 다른 하나는 절편의 뜻을 쓰는 길이에요. $y$절편은 $x$ 자리에 0을, $x$절편은 $y$ 자리에 0을 넣으면 바로 나와요.';
  var readBuild = function (q) {
    var e = q.e, t = gen(e), m = slopeE(e), k = rat(e.c, e.b), xi = rat(e.c, e.a), yf = line(m, k), wrong = {}, shown = e.form === 1 ? -e.c : e.c, n, d, ans, text, steps, h2;
    var toY = [{ say: '$y = ax + b$ 꼴로 고쳐요. $y$가 있는 항만 왼쪽에 남기고 $y$ 앞의 수로 나눠요.', tex: yf }];
    if (q.ask === 'm') {
      ans = m; text = '이 일차방정식의 그래프의 기울기를 구하세요.';
      wrong['coef-read'] = R(e.a); wrong['move-sign'] = rat(e.a, e.b); wrong.reciprocal = rat(-e.b, e.a);
      steps = toY.concat([{ say: '$x$ 앞의 수가 기울기예요.', tex: '(\\text{기울기}) = ' + fr(m) }]);
      h2 = '식에 보이는 $x$ 앞의 수 $' + e.a + '$' + pj(e.a, '이/가') + ' 기울기인 것은 아니에요. $y$ 앞의 수가 1이 아니거나 $x$가 있는 항이 $y$와 같은 쪽에 있기 때문이에요. 먼저 $y$가 있는 항만 왼쪽에 남기고(이항하면 부호가 바뀌어요), $y$ 앞의 수 $' + e.b + '$' + pj(e.b, '으로/로') + ' 나눠요. 그런 다음 $x$ 앞의 수를 읽어요.';
    } else if (q.ask === 'y' || q.ask === 'x') {
      ans = q.ask === 'y' ? k : xi; text = '이 일차방정식의 그래프의 $' + q.ask + '$절편을 구하세요.';
      wrong['other-intercept'] = q.ask === 'y' ? xi : k; wrong['const-read'] = R(shown); wrong['not-divided'] = R(e.c);
      n = q.ask === 'y' ? e.b : e.a; d = q.ask === 'y' ? 'y' : 'x';
      steps = [{ say: '$' + q.ask + '$절편은 $' + (q.ask === 'y' ? 'x' : 'y') + ' = 0$일 때의 $' + q.ask + '$의 값이에요. $' + (q.ask === 'y' ? 'x' : 'y') + '$ 자리에 0을 넣으면 그 항이 사라져요.', tex: e.form === 1 && e.c !== 0 ? poly([[n, d], [-e.c, '']]) + ' = 0' : poly([[n, d]]) + ' = ' + e.c }];
      if (e.form === 1 && e.c !== 0) steps.push({ say: '상수항을 이항해요.', tex: poly([[n, d]]) + ' = ' + e.c });
      if (n !== 1) steps.push({ say: '양쪽을 $' + d + '$ 앞의 수로 나눠요.', tex: d + ' = ' + fr(ans) });
      else if (steps.length === 1) steps.push({ say: '$' + d + '$ 앞의 수가 1이니 이것이 바로 $' + q.ask + '$절편이에요.', tex: '(' + d + '\\text{절편}) = ' + fr(ans) });
      h2 = '$' + q.ask + '$절편은 직선이 $' + q.ask + '$축과 만나는 점의 $' + q.ask + '$좌표예요. $' + q.ask + '$축 위의 점은 $' + (q.ask === 'y' ? 'x' : 'y') + '$좌표가 0이에요. 그래서 이 식의 $' + (q.ask === 'y' ? 'x' : 'y') + '$ 자리에 0을 넣어요. 그러면 $' + q.ask + '$만 남은 간단한 방정식이 돼요. ' + (e.form === 1 ? '상수항을 이항할 때 부호가 바뀌는 것에 주의해요. ' : '') + '식에 보이는 수를 그대로 답하지 말고 $' + q.ask + '$ 앞의 수로 나눠요.';
    } else if (q.ask === 'pt') {
      /* 점 (p, k) 를 지날 때 k */
      n = e.c - e.a * q.p; ans = rat(n, e.b); text = '이 일차방정식의 그래프가 점 $' + pt(q.p, 'k') + '$를 지날 때, $k$의 값을 구하세요.';
      wrong['swapped-xy'] = rat(e.c - e.b * q.p, e.a); wrong['move-sign'] = rat(e.c + e.a * q.p, e.b); wrong['not-divided'] = R(n);
      steps = [{ say: '직선이 점을 지나면 그 점의 좌표를 넣었을 때 등식이 성립해요. $x$ 자리에 $' + q.p + '$, $y$ 자리에 $k$를 넣어요.', tex: (e.a === 1 ? '' : e.a === -1 ? '-' : e.a + ' \\times ') + par(q.p) + (e.b < 0 ? ' - ' : ' + ') + (abs(e.b) === 1 ? '' : abs(e.b)) + 'k' + (e.form === 1 && e.c !== 0 ? (e.c > 0 ? ' - ' : ' + ') + abs(e.c) + ' = 0' : ' = ' + e.c) },
        { say: '수끼리 계산하고 $k$가 있는 항만 왼쪽에 남겨요.', tex: poly([[e.b, 'k']]) + ' = ' + n }, { say: '양쪽을 $k$ 앞의 수로 나눠요.', tex: 'k = ' + fr(ans) }];
      h2 = '"그래프가 점을 지난다"는 말은 그 점의 좌표가 방정식의 해라는 뜻이에요. 순서쌍 $' + pt(q.p, 'k') + '$에서 앞의 $' + q.p + '$' + pj(q.p, '이/가') + ' $x$좌표, 뒤의 $k$가 $y$좌표예요. 식의 $x$ 자리에 $' + q.p + '$' + pj(q.p, '을/를') + ', $y$ 자리에 $k$를 넣으면 $k$만 남은 방정식이 돼요. $x$와 $y$의 자리를 바꿔 넣지 않도록 조심해요.';
    } else {
      /* coef: a x + b y = c 가 점 (p, y0) 를 지날 때 상수 a (화면에는 a 를 문자로 보여 준다) */
      t = 'ax' + (e.b < 0 ? ' - ' : ' + ') + (abs(e.b) === 1 ? '' : abs(e.b)) + 'y' + (e.form === 1 ? (e.c > 0 ? ' - ' : ' + ') + abs(e.c) + ' = 0' : ' = ' + e.c);
      n = e.c - e.b * q.y0; ans = R(e.a); text = '이 일차방정식의 그래프가 점 $' + pt(q.p, q.y0) + '$' + pj(q.y0, '을/를') + ' 지날 때, 상수 $a$의 값을 구하세요.';
      wrong['swapped-xy'] = q.y0 ? rat(e.c - e.b * q.p, q.y0) : null; wrong['move-sign'] = rat(e.c + e.b * q.y0, q.p); wrong['not-divided'] = R(n);
      steps = [{ say: '점의 좌표를 넣어요. $x$ 자리에 $' + q.p + '$, $y$ 자리에 $' + q.y0 + '$' + pj(q.y0, '을/를') + ' 넣어요.', tex: 'a \\times ' + par(q.p) + (e.b < 0 ? ' - ' : ' + ') + (abs(e.b) === 1 ? '' : abs(e.b) + ' \\times ') + par(q.y0) + (e.form === 1 ? (e.c > 0 ? ' - ' : ' + ') + abs(e.c) + ' = 0' : ' = ' + e.c) },
        { say: '수끼리 계산하고 $a$가 있는 항만 왼쪽에 남겨요.', tex: poly([[q.p, 'a']]) + ' = ' + n }, { say: '양쪽을 $a$ 앞의 수로 나눠요.', tex: 'a = ' + e.a }];
      h2 = '그래프가 점 $' + pt(q.p, q.y0) + '$' + pj(q.y0, '을/를') + ' 지난다는 것은 이 점의 좌표를 식에 넣으면 등식이 성립한다는 뜻이에요. $x$ 자리에 $' + q.p + '$, $y$ 자리에 $' + q.y0 + '$' + pj(q.y0, '을/를') + ' 넣어요. 그러면 $x$, $y$는 사라지고 모르는 것은 $a$뿐이에요. $a$에 대한 일차방정식을 풀면 돼요.';
      return { tex: t, text: text, ans: ans, wrong: wrong, steps: steps, check: onEq(t, R(q.p), R(q.y0), { a: ans }) && q.p !== q.y0 && e.a * q.p + e.b * q.y0 === e.c,
        hints: [READ, h2, '① 점의 $x$좌표와 $y$좌표를 식의 $x$, $y$ 자리에 각각 넣어요. ② 수끼리 먼저 계산해요. 음수를 넣을 때는 괄호를 쳐요. ③ $a$가 있는 항만 왼쪽에 남기고 나머지를 이항해요. ④ $a$ 앞의 수로 나눠요.'] };
    }
    return { tex: t, text: text, ans: ans, wrong: wrong, steps: steps,
      check: q.ask === 'm' ? onEq(t, R(0), k) && onEq(t, R(e.b), rat(e.c - e.a * e.b, e.b)) : q.ask === 'y' ? onEq(t, R(0), ans) : q.ask === 'x' ? onEq(t, ans, R(0)) : onEq(t, R(q.p), ans),
      hints: [READ, h2, q.ask === 'm' ? '① $y$가 있는 항만 왼쪽에 남겨요. ② 이항한 항의 부호를 바꿔요. ③ 양쪽을 $y$ 앞의 수로 나눠요. ④ $x$ 앞의 수를 부호와 함께 읽어요. 분수이면 분자 칸과 분모 칸에 나눠 넣어요.'
        : q.ask === 'pt' ? '① 점의 $x$좌표를 식의 $x$ 자리에 넣고, $y$ 자리에는 $k$를 써요. ② 수끼리 먼저 계산해요. ③ $k$가 있는 항만 왼쪽에 남기고 이항해요. ④ $k$ 앞의 수로 나눠요.'
        : '① 구하는 절편이 $x$절편이면 $y$ 자리에, $y$절편이면 $x$ 자리에 0을 넣어요. ② 0을 넣은 항은 사라져요. ③ 남은 식에서 상수항을 이항해요. ④ 문자 앞의 수로 나눠요. 나누어떨어지지 않으면 분수로 답해요.'] };
  };
  var okR = function (q) { var p = readBuild(q); return !!p && p.check && abs(p.ans.n) <= 30 && p.ans.d <= 9; };
  var eqR = function (r, lim) { return E(nz(r, -lim, lim), nz(r, -lim, lim), nz(r, -12, 12), r.int(0, 1)); };
  valueQ({
    id: 'B16.read', title: '그래프의 기울기 · 절편 · 지나는 점', kind: 'rational', build: readBuild,
    mistakes: [['coef-read', '식에 보이는 $x$ 앞의 수를 그대로 답했어요. $y = ax + b$ 꼴로 고친 다음에 $x$ 앞의 수를 읽어야 해요. 이항하면 부호가 바뀌고, $y$ 앞의 수로도 나눠야 해요.'],
      ['move-sign', '항을 이항하면서 부호를 바꾸지 않았어요. 등호를 건너가면 $+$는 $-$로, $-$는 $+$로 바뀌어요.'],
      ['reciprocal', '나눗셈을 거꾸로 했어요. $y$ 앞의 수로 나누는 것이에요. $y$ 앞의 수가 분모로 가요.'],
      ['other-intercept', '다른 쪽 절편을 답했어요. $x$절편은 $y = 0$을 넣어 구하고, $y$절편은 $x = 0$을 넣어 구해요. 문제에서 묻는 쪽을 다시 확인해요.'],
      ['const-read', '식에 보이는 상수항을 그대로 답했어요. 절편은 0을 넣고 남은 방정식을 풀어야 나와요. 이항과 나눗셈이 남아 있어요.'],
      ['not-divided', '이항까지만 하고 문자 앞의 수로 나누지 않았어요. 마지막에 양쪽을 문자 앞의 수로 나눠야 해요.'],
      ['swapped-xy', '$x$좌표와 $y$좌표를 바꿔 넣었어요. 순서쌍에서 앞의 수가 $x$좌표, 뒤의 수가 $y$좌표예요.']],
    levels: [
      { name: '기울기와 y절편', vars: { q: sampler(function (r) { return until(function () { var e = eqR(r, 4); return (e.c % e.b === 0 && e.a % e.b === 0) ? { e: e, ask: r.pick(['m', 'y']) } : null; }, okR); }) } },
      { name: 'x절편 · 분수가 나오는 값', vars: { q: sampler(function (r) { return until(function () { return { e: eqR(r, 6), ask: r.pick(['m', 'y', 'x', 'x']) }; }, function (q) { return okR(q) && (q.ask === 'x' || readBuild(q).ans.d > 1); }); }) } },
      { name: '지나는 점', vars: { q: sampler(function (r) {
          return until(function () { var e = eqR(r, 5), p = nz(r, -5, 5), coef = r.int(0, 1) === 1, y0 = nz(r, -5, 5); if (coef) e.c = e.a * p + e.b * y0; return { e: e, ask: coef ? 'coef' : 'pt', p: p, y0: y0 }; }, function (q) { return okR(q) && readBuild(q).ans.d === 1 && abs(q.e.c) <= 30; });
        }) } }
    ]
  });

  /* ── B16.axis 축에 평행한 직선 ──────────────────────── */
  var AXIS = '$x = 3$은 "$x$좌표가 항상 3"이라는 뜻이에요. $y$는 무엇이든 돼요. 그런 점 $(3,\\ -1)$, $(3,\\ 0)$, $(3,\\ 2)$, …를 이으면 위아래로 곧게 선 직선이 돼요. $y$축과 나란하니 $y$축에 평행하다고 해요. 반대로 $y = 3$은 "높이가 항상 3"이에요. 건물의 3층 복도처럼 옆으로 누운 직선이고, $x$축에 평행해요.';
  var ax = function (v, p) { return (v ? 'x' : 'y') + ' = ' + p; };
  var axisBuild = function (q) {
    var v = q.v, p = q.p, ans = ax(v, p), text, tex, fig = null, wrong, steps, h2, chk = true, other = v ? q.y0 : q.x0;
    var W_AX = '축을 반대로 봤어요. $x = k$는 $x$좌표가 늘 $k$인 점들이라 위아래로 선 직선($y$축에 평행)이에요. $y = k$는 높이가 늘 $k$인 점들이라 옆으로 누운 직선($x$축에 평행)이에요.';
    if (q.kind === 'fig') {
      fig = { type: 'plane', range: 5 }; fig[v ? 'vline' : 'hline'] = p;
      text = '그림의 직선의 방정식을 고르세요.';
      wrong = [[ax(!v, p), 'axis-swapped', W_AX + ' 그림의 직선이 서 있는지 누워 있는지 다시 봐요.'], [ax(v, -p), 'sign', '부호가 반대예요. 직선이 ' + (v ? '$x$축과 만나는 점의 눈금' : '$y$축과 만나는 점의 눈금') + '을 다시 읽어요. 원점의 ' + (v ? '오른쪽은 양수, 왼쪽은 음수' : '위는 양수, 아래는 음수') + '예요.'], [ax(!v, -p), 'both', '축도 부호도 반대예요. 먼저 직선이 서 있는지 누워 있는지 보고, 그다음 축과 만나는 눈금을 읽어요.']];
      steps = [{ say: '직선이 ' + (v ? '위아래로 서 있어요. $y$축에 평행한 직선이고, 직선 위의 모든 점은 $x$좌표가 같아요.' : '옆으로 누워 있어요. $x$축에 평행한 직선이고, 직선 위의 모든 점은 $y$좌표가 같아요.'), tex: pt(v ? p : 0, v ? 0 : p) + ',\\ ' + pt(v ? p : 1, v ? 1 : p) + ',\\ ' + pt(v ? p : 2, v ? 2 : p) }, { say: '그 같은 좌표를 식으로 써요.', tex: ans }];
      h2 = '그림의 직선 위에서 점을 두세 개 골라 좌표를 읽어 봐요. 어느 좌표가 모두 같은지 찾는 것이 열쇠예요. $x$좌표가 모두 같으면 "$x = $ (그 수)", $y$좌표가 모두 같으면 "$y = $ (그 수)"가 직선의 방정식이에요.';
    } else if (q.kind === 'par') {
      /* 점 (x0, y0) 을 지나고 축에 평행 · 수직 */
      text = '점 $' + pt(q.x0, q.y0) + '$' + pj(q.y0, '을/를') + ' 지나고 $' + (q.perp ? (v ? 'x' : 'y') + '$축에 수직인' : (v ? 'y' : 'x') + '$축에 평행한') + ' 직선의 방정식을 고르세요.';
      wrong = [[ax(!v, other), 'axis-swapped', W_AX + (q.perp ? ' 한 축에 수직인 직선은 다른 축에 평행해요.' : '')], [ax(v, other), 'coord-swapped', '점의 좌표를 바꿔 썼어요. 순서쌍에서 앞의 수가 $x$좌표, 뒤의 수가 $y$좌표예요. ' + (v ? '$x = $ 뒤에는 $x$좌표를' : '$y = $ 뒤에는 $y$좌표를') + ' 써요.'], [ax(!v, p), 'both', '축과 좌표를 모두 바꿔 썼어요. 직선이 어느 축에 평행한지 먼저 정하고, 그 직선 위에서 변하지 않는 좌표를 써요.']];
      steps = [{ say: (q.perp ? '$' + (v ? 'x' : 'y') + '$축에 수직인 직선은 $' + (v ? 'y' : 'x') + '$축에 평행해요. ' : '') + '$' + (v ? 'y' : 'x') + '$축에 평행한 직선 위의 점은 모두 $' + (v ? 'x' : 'y') + '$좌표가 같아요.', tex: (v ? 'x' : 'y') + ' = k' }, { say: '점 $' + pt(q.x0, q.y0) + '$' + pj(q.y0, '을/를') + ' 지나니 그 $' + (v ? 'x' : 'y') + '$좌표는 $' + p + '$' + pj(p, '이에요/예요') + '.', tex: ans }];
      h2 = (q.perp ? '먼저 말을 바꿔요. 한 축에 수직인 직선은 다른 축에 평행해요. $' + (v ? 'x' : 'y') + '$축에 수직이면 $' + (v ? 'y' : 'x') + '$축에 평행해요. ' : '') + '$' + (v ? 'y' : 'x') + '$축에 평행한 직선을 머릿속에 그려 봐요. ' + (v ? '위아래로 선 직선이라 어디서든 $x$좌표가 같아요.' : '옆으로 누운 직선이라 어디서든 $y$좌표(높이)가 같아요.') + ' 이 직선이 점 $' + pt(q.x0, q.y0) + '$' + pj(q.y0, '을/를') + ' 지나니, 그 점의 좌표 두 개 가운데 변하지 않는 쪽을 골라 식으로 써요.';
      chk = q.x0 !== q.y0 && q.x0 !== -q.y0;
    } else if (q.kind === 'two') {
      /* 한 좌표가 같은 두 점 */
      var P1 = v ? pt(p, q.s) : pt(q.s, p), P2 = v ? pt(p, q.t) : pt(q.t, p);
      text = '두 점 $' + P1 + '$, $' + P2 + '$' + pj(v ? q.t : p, '을/를') + ' 지나는 직선의 방정식을 고르세요.';
      wrong = [[ax(!v, p), 'axis-swapped', W_AX + ' 두 점에서 같은 것은 $' + (v ? 'x' : 'y') + '$좌표예요.'], [ax(!v, q.s), 'coord-swapped', '두 점에서 서로 다른 좌표를 썼어요. 직선의 방정식에는 두 점에서 똑같은 좌표를 써요. 다른 좌표는 직선 위에서 계속 변하는 값이에요.'], [ax(v, q.s), 'both', '좌표를 잘못 골랐어요. 두 점의 $x$좌표끼리, $y$좌표끼리 견줘서 같은 쪽을 찾아요.']];
      steps = [{ say: '두 점의 좌표를 견줘요. $' + (v ? 'x' : 'y') + '$좌표가 $' + p + '$' + pj(p, '으로/로') + ' 같아요.', tex: P1 + ',\\ ' + P2 }, { say: '$' + (v ? 'x' : 'y') + '$좌표가 늘 같은 직선이에요.', tex: ans }];
      h2 = '두 점의 좌표를 나란히 놓고 견줘요. $x$좌표끼리 같은지, $y$좌표끼리 같은지 봐요. 이 두 점은 한쪽 좌표가 똑같아요. 그 좌표가 같은 점들을 모두 이은 것이 구하는 직선이에요. 기울기를 구하려고 하면 분모가 0이 되거나 기울기가 0이 나오는 특별한 경우예요.';
      chk = p !== q.s && p !== q.t && q.s !== q.t && p !== -q.s;
    } else {
      /* eq: a x = a p (또는 a y = a p) 꼴의 방정식을 간단히 */
      var a = q.a, L = (v ? 'x' : 'y');
      tex = q.form ? poly([[a, L], [-a * p, '']]) + ' = 0' : poly([[a, L]]) + ' = ' + a * p;
      text = '이 방정식의 그래프와 같은 직선을 고르세요.';
      wrong = [[ax(!v, p), 'axis-swapped', '문자를 바꿔 썼어요. 식에 있는 문자는 $' + L + '$예요. 양쪽을 $' + L + '$ 앞의 수로 나눠도 문자는 그대로 $' + L + '$예요.'], [ax(v, -p), 'sign', '부호가 반대예요. ' + (q.form ? '상수항을 이항하면 부호가 바뀌어요. 그다음 나눌 때 ' : '나눌 때 ') + '두 수의 부호가 같으면 양수, 다르면 음수예요.'], [ax(v, q.form ? -a * p : a * p), 'not-divided', '$' + L + '$ 앞의 수로 나누지 않았어요. $' + L + '$ 앞의 수가 1이 되도록 양쪽을 $' + a + '$' + pj(a, '으로/로') + ' 나눠요.']];
      if (q.form && wrong[2][0] === wrong[1][0]) wrong[2][0] = ax(v, a * p);
      steps = (q.form ? [{ say: '상수항을 이항해요.', tex: poly([[a, L]]) + ' = ' + a * p }] : [{ say: '$' + L + '$ 앞의 수가 1이 되게 만들어요.', tex: tex }]).concat([{ say: '양쪽을 $' + L + '$ 앞의 수 $' + a + '$' + pj(a, '으로/로') + ' 나눠요.', tex: ans }]);
      h2 = '이 식에는 문자가 $' + L + '$ 하나뿐이에요. $' + (v ? 'y' : 'x') + '$가 없다는 것은 $' + (v ? 'y' : 'x') + '$가 무엇이든 상관없다는 뜻이에요. 그러니 $' + L + '$에 대해 풀기만 하면 돼요. ' + (q.form ? '상수항을 오른쪽으로 이항하고, ' : '') + '양쪽을 $' + L + '$ 앞의 수 $' + a + '$' + pj(a, '으로/로') + ' 나눠요. 그러면 "$' + L + ' = $ (수)" 꼴이 되고, 이것은 $' + (v ? 'y' : 'x') + '$축에 평행한 직선이에요.';
      chk = abs(a) > 1 && onEq(tex, R(v ? p : 7), R(v ? 7 : p));
    }
    return { text: text, tex: tex, figure: fig, ans: ans, wrong: wrong, steps: steps, check: chk && p !== 0,
      hints: [AXIS, h2, '① 직선이 서 있는지($y$축에 평행) 누워 있는지($x$축에 평행) 정해요. ② 서 있으면 직선 위의 모든 점의 $x$좌표가 같으니 "$x = $ (수)" 꼴이에요. ③ 누워 있으면 $y$좌표가 같으니 "$y = $ (수)" 꼴이에요. ④ 그 수의 부호를 다시 확인해요.'] };
  };
  var okA = function (q) { var p = axisBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B16.axis', title: '축에 평행한 직선', ids: ['axis-swapped', 'sign', 'both', 'coord-swapped', 'not-divided'], build: axisBuild,
    levels: [
      { name: '그래프를 보고 식 고르기', minDistinct: 16, vars: { q: sampler(function (r) { return { kind: 'fig', v: r.int(0, 1) === 1, p: nz(r, -4, 4), o: order4(r) }; }) } },
      { name: '한 점을 지나고 축에 평행 · 수직', minDistinct: 200, vars: { q: sampler(function (r) {
          return until(function () { var v = r.int(0, 1) === 1, x0 = nz(r, -9, 9), y0 = nz(r, -9, 9); return { kind: 'par', v: v, perp: r.int(0, 1) === 1, x0: x0, y0: y0, p: v ? x0 : y0, o: order4(r) }; }, okA);
        }) } },
      { name: '두 점 · 방정식 간단히 하기', vars: { q: sampler(function (r) {
          return until(function () { var v = r.int(0, 1) === 1; return r.int(0, 1) ? { kind: 'two', v: v, p: nz(r, -9, 9), s: nz(r, -9, 9), t: nz(r, -9, 9), o: order4(r) } : { kind: 'eq', v: v, a: pm(r, r.int(2, 7)), p: nz(r, -9, 9), form: r.int(0, 1), o: order4(r) }; }, okA);
        }) } }
    ]
  });

  /* ── B16.cross 두 직선의 교점 ───────────────────────── */
  var CROSS = '일차방정식의 그래프(직선) 위의 점은 모두 그 방정식의 해예요. 그러면 두 직선이 만나는 점은 두 방정식을 동시에 만족하는 점이에요. 이것이 바로 연립방정식의 해예요. 두 사람이 각자 걸어온 길이 만나는 교차로와 같아요. 교차로는 두 길 모두 위에 있는 단 하나의 장소예요.';
  var crossBuild = function (q) {
    var e1 = q.e1, e2 = q.e2, s = cramer(e1, e2), t1 = gen(e1), t2 = gen(e2), fig = null, cands, wrong = [], seen, on, why, steps, p, v, sol;
    if (!s) return null;
    p = s.p; v = s.q; sol = function (x, y) { return onEq(t1, R(x), R(y)) && onEq(t2, R(x), R(y)); };
    on = function (x, y) { return [onEq(t1, R(x), R(y)), onEq(t2, R(x), R(y))]; };
    why = function (x, y, id) {
      var o = on(x, y), head = '점 $' + pt(x, y) + '$' + pj(y, '은/는') + ' ';
      if (id === 'swapped') return '$x$좌표와 $y$좌표의 순서를 바꿨어요. 순서쌍은 $x$좌표를 먼저, $y$좌표를 나중에 써요. ' + (q.fig ? '교점에서 아래(위)로 내려가 $x$축의 눈금을 먼저 읽어요.' : '구한 $x$, $y$의 값을 순서대로 써요.');
      if (o[0] || o[1]) return head + NAME[o[0] ? 0 : 1] + '의 그래프 위에만 있어요. ' + NAME[o[0] ? 1 : 0] + '에 넣으면 등식이 성립하지 않아요. 교점은 두 직선 모두 위에 있어야 해요.';
      return head + '두 직선 가운데 어느 것 위에도 있지 않아요. ' + (q.fig ? '좌표의 부호를 다시 읽어요. 원점의 오른쪽 · 위는 양수, 왼쪽 · 아래는 음수예요.' : '두 식에 넣어 등식이 성립하는지 확인해요.');
    };
    cands = q.fig ? [[v, p, 'swapped'], [-p, v, 'sign-x'], [p, -v, 'sign-y'], [-p, -v, 'near']]
      : [[p + e1.b * q.t, v - e1.a * q.t, 'first-only'], [p + e2.b * q.t, v - e2.a * q.t, 'second-only'], [v, p, 'swapped'], [p + 1, v - 1, 'near'], [p - 1, v, 'near-2']];
    seen = [pt(p, v)];
    cands.forEach(function (c) { var o = pt(c[0], c[1]); if (wrong.length < 3 && seen.indexOf(o) < 0 && !sol(c[0], c[1]) && abs(c[0]) <= 15 && abs(c[1]) <= 15) { seen.push(o); wrong.push([o, c[2], why(c[0], c[1], c[2])]); } });
    if (q.fig) fig = { type: 'plane', range: 5, line: q.fig[0], line2: q.fig[1] };
    var plug = function (e, i) { return e.form === 2 ? { say: NAME[i] + '에 넣어 확인해요.', tex: v + ' = ' + gen(e).slice(4).replace(/x/, ' \\times ' + par(p)).replace(/^ \\times /, '').replace(/^- \\times /, '-') } : { say: NAME[i] + '에 넣어 확인해요.', tex: sub(e, p, v) + (e.form === 1 && e.c !== 0 ? (e.c > 0 ? ' - ' : ' + ') + abs(e.c) + ' = 0' : ' = ' + e.c) }; };
    steps = (q.fig ? [{ say: '두 직선이 만나는 점을 찾아 좌표를 읽어요. $x$좌표를 먼저, $y$좌표를 나중에 써요.', tex: pt(p, v) }] : [{ say: '교점의 좌표는 연립방정식의 해예요. ' + (e1.form === 2 && e2.form === 2 ? '두 식이 모두 $y = \\cdots$ 꼴이니 오른쪽끼리 같다고 놓고 풀어요.' : e1.form === 2 || e2.form === 2 ? '$y = \\cdots$ 꼴의 식을 다른 식에 대입해서 풀어요.' : '가감법이나 대입법으로 풀어요.'), tex: 'x = ' + p + ',\\quad y = ' + v }])
      .concat([plug(e1, 0), plug(e2, 1), { say: '두 식에 모두 맞으니 이 점이 교점이에요.', tex: pt(p, v) }]);
    return { tex: cases([t1, t2]), figure: fig, text: q.fig ? '그림은 두 일차방정식의 그래프예요. 이 연립방정식의 해를 나타내는 점의 좌표를 고르세요.' : '두 일차방정식의 그래프의 교점의 좌표를 고르세요.', ans: pt(p, v), wrong: wrong, steps: steps,
      check: sol(p, v) && abs(p) <= (q.fig ? 4 : 9) && abs(v) <= (q.fig ? 4 : 9) && p !== v && p !== 0 && v !== 0,
      hints: [CROSS, q.fig ? '그림에서 두 직선이 서로 엇갈리는 점을 찾아요. 그 점에서 곧장 아래(또는 위)로 가서 $x$축의 눈금을 읽으면 $x$좌표예요. 옆으로 가서 $y$축의 눈금을 읽으면 $y$좌표예요. 읽은 좌표를 두 식에 넣어 보면 맞는지 확인할 수 있어요.'
          : '그림이 없어도 교점을 구할 수 있어요. 교점은 두 방정식을 동시에 만족하는 점이니, 두 식을 연립방정식으로 놓고 풀면 돼요. ' + (e1.form === 2 && e2.form === 2 ? '두 식 모두 왼쪽이 $y$예요. 같은 $y$이니 오른쪽의 두 식을 등호로 이으면 $x$만 남은 방정식이 돼요.' : e1.form === 2 || e2.form === 2 ? '한 식이 $y = \\cdots$ 꼴이니, 다른 식의 $y$ 자리에 그 식을 통째로(괄호를 쳐서) 넣는 대입법이 편해요.' : '없앨 문자의 계수의 크기를 맞춘 다음, 부호가 같으면 빼고 다르면 더하는 가감법으로 풀어요.'),
        q.fig ? '① 두 직선이 만나는 점을 찾아요. ② 그 점의 $x$좌표와 $y$좌표를 눈금에서 읽어요. 왼쪽 · 아래는 음수예요. ③ $(x좌표,\\ y좌표)$ 순서로 써요. ④ 두 식에 넣어 모두 성립하는지 확인해요.'
          : '① 두 식을 연립방정식으로 놓아요. ② 한 문자를 없애 다른 문자의 값을 구해요. ③ 그 값을 한 식에 넣어 나머지 문자의 값을 구해요. ④ $(x,\\ y)$ 순서로 쓰고, 두 식에 모두 넣어 확인해요.'] };
  };
  var okC = function (q) { var p = crossBuild(q); return !!p && p.check && p.wrong.length === 3; };
  var SL = [[1, 1], [-1, 1], [2, 1], [-2, 1], [1, 2], [-1, 2], [3, 1], [-3, 1], [1, 3], [-1, 3], [3, 2], [-3, 2], [2, 3], [-2, 3]];
  /** 기울기 n/d, 점 (p, v) 를 지나는 직선의 방정식(계수가 정수, x 의 계수가 양수) */
  var through = function (s, p, v, form) { var a = s[0], b = -s[1], c = s[0] * p - s[1] * v; if (a < 0) { a = -a; b = -b; c = -c; } return E(a, b, c, form); };
  choiceQ({
    id: 'B16.cross', title: '두 직선의 교점', ids: ['swapped', 'sign-x', 'sign-y', 'near', 'near-2', 'first-only', 'second-only'], build: crossBuild,
    levels: [
      { name: '그래프에서 교점 읽기', vars: { q: sampler(function (r) {
          return until(function () {
            var p = nz(r, -4, 4), v = nz(r, -4, 4), s1 = r.pick(SL), s2 = r.pick(SL), k1 = (s1[1] * v - s1[0] * p) / s1[1], k2 = (s2[1] * v - s2[0] * p) / s2[1];
            return s1 === s2 || abs(s1[0] * s2[1] - s2[0] * s1[1]) < s1[1] * s2[1] || !isInt(k1) || !isInt(k2) || abs(k1) > 5 || abs(k2) > 5 ? null : { e1: through(s1, p, v, 0), e2: through(s2, p, v, 0), fig: [[s1[0], s1[1], k1], [s2[0], s2[1], k2]], o: order4(r) };
          }, okC);
        }) } },
      { name: '연립방정식으로 교점 구하기', vars: { q: sampler(function (r) {
          return until(function () { var p = nz(r, -7, 7), v = nz(r, -7, 7), a1 = nz(r, -4, 4), b1 = nz(r, -4, 4), a2 = nz(r, -4, 4), b2 = nz(r, -4, 4); return { e1: E(a1, b1, a1 * p + b1 * v, 0), e2: E(a2, b2, a2 * p + b2 * v, 0), t: pm(r, 1), o: order4(r) }; }, function (q) { return okC(q) && abs(q.e1.c) <= 40 && abs(q.e2.c) <= 40; });
        }) } },
      { name: 'y = ax + b 꼴이 섞인 식', vars: { q: sampler(function (r) {
          return until(function () {
            var p = nz(r, -6, 6), v = nz(r, -6, 6), m1 = nz(r, -4, 4), m2 = nz(r, -4, 4), a = nz(r, -4, 4), b = nz(r, -4, 4), both = r.int(0, 1) === 1, y1 = E(-m1, 1, v - m1 * p, 2), o2 = both ? E(-m2, 1, v - m2 * p, 2) : E(a, b, a * p + b * v, r.int(0, 1));
            return { e1: r.int(0, 1) ? y1 : o2, e2: null, t: pm(r, 1), o: order4(r), y1: y1, o2: o2 };
          }, function (q) { q.e2 = q.e1 === q.y1 ? q.o2 : q.y1; return okC(q) && abs(q.e1.c) <= 30 && abs(q.e2.c) <= 30; });
        }) } }
    ]
  });

  /* ── B16.count 해의 개수와 위치 관계 ─────────────────── */
  var COUNT = '두 직선이 놓이는 모양은 세 가지뿐이에요. ① 한 점에서 만나요(기울기가 달라요). 해가 한 쌍이에요. ② 평행해서 만나지 않아요(기울기가 같고 $y$절편이 달라요). 기찻길의 두 레일처럼요. 해가 없어요. ③ 완전히 겹쳐요(기울기도 $y$절편도 같아요). 일치한다고 하고, 직선 위의 모든 점이 해라서 해가 무수히 많아요.';
  var OPT = ['한 점에서 만난다 (해가 한 쌍)', '평행하다 (해가 없다)', '일치한다 (해가 무수히 많다)', '두 점에서 만난다 (해가 두 쌍)'];
  var relOf = function (e1, e2) { return e1.a * e2.b !== e2.a * e1.b ? 0 : e1.a * e2.c === e2.a * e1.c && e1.b * e2.c === e2.b * e1.c ? 2 : 1; };
  /** 화면에 보이는 두 식을 점을 넣어 직접 견준다: 한 직선 위의 두 점이 다른 직선 위에 몇 개 있는가 → 0 한 점 · 1 평행 · 2 일치 */
  var relCheck = function (e1, e2) {
    var t1 = gen(e1), t2 = gen(e2), pts = [0, e1.b].map(function (x) { return [R(x), rat(e1.c - e1.a * x, e1.b)]; }), hit = pts.filter(function (p) { return onEq(t1, p[0], p[1]) && onEq(t2, p[0], p[1]); }).length;
    if (!pts.every(function (p) { return onEq(t1, p[0], p[1]); })) return -1;
    return hit === 2 ? 2 : same(slopeE(e1), slopeE(e2)) ? (hit === 0 ? 1 : -1) : 0;
  };
  var countBuild = function (q) {
    var e1 = q.e1, e2 = q.e2, rel, m1 = slopeE(e1), m2, k1 = rat(e1.c, e1.b), k2, y1 = line(m1, k1), y2, wrong, steps, said;
    if (q.kind === 'rel') {
      rel = relOf(e1, e2); m2 = slopeE(e2); k2 = rat(e2.c, e2.b); y2 = line(m2, k2);
      said = function (i) {
        if (i === 3) return '두 직선은 두 점에서 만날 수 없어요. 곧은 선 두 개는 한 점에서 만나거나, 만나지 않거나, 완전히 겹치거나 셋 중 하나예요.';
        if (i === 0) return '기울기가 서로 같아요($' + fr(m1) + '$). 기울기가 같은 두 직선은 한 점에서 만날 수 없어요. ' + (rel === 1 ? '$y$절편이 달라서 평행해요.' : '$y$절편까지 같아서 일치해요.');
        if (i === 1) return rel === 0 ? '기울기가 달라요($' + fr(m1) + '$' + rj(m1, '과/와') + ' $' + fr(m2) + '$). 기울기가 다른 두 직선은 반드시 한 점에서 만나요. 평행하려면 기울기가 같아야 해요.' : '$y$절편까지 같아요($' + fr(k1) + '$). 기울기도 $y$절편도 같으면 같은 직선이에요. 평행한 것이 아니라 일치해요.';
        return rel === 0 ? '기울기가 달라요($' + fr(m1) + '$' + rj(m1, '과/와') + ' $' + fr(m2) + '$). 일치하려면 기울기와 $y$절편이 모두 같아야 해요.' : '$y$절편이 달라요($' + fr(k1) + '$' + rj(k1, '과/와') + ' $' + fr(k2) + '$). 기울기만 같고 $y$절편이 다르면 평행해요. 겹치지 않아요.';
      };
      wrong = [0, 1, 2, 3].filter(function (i) { return i !== rel; }).map(function (i) { return [OPT[i], ['said-one', 'said-none', 'said-infinite', 'said-two'][i], said(i)]; });
      steps = (e1.form === 2 && e2.form === 2 ? [] : [{ say: '두 식을 각각 $y = ax + b$ 꼴로 고쳐요.', tex: cases([y1, y2]) }]).concat([
        { say: '기울기를 견줘요. ' + (rel === 0 ? '서로 달라요.' : '서로 같아요.'), tex: fr(m1) + (rel === 0 ? ' \\neq ' : ' = ') + fr(m2) }]);
      if (rel !== 0) steps.push({ say: '$y$절편을 견줘요. ' + (rel === 1 ? '서로 달라요.' : '서로 같아요.'), tex: fr(k1) + (rel === 1 ? ' \\neq ' : ' = ') + fr(k2) });
      steps.push({ say: rel === 0 ? '기울기가 다르면 한 점에서 만나요. 해가 한 쌍이에요.' : rel === 1 ? '기울기가 같고 $y$절편이 다르면 평행해요. 만나지 않으니 해가 없어요.' : '기울기도 $y$절편도 같으면 같은 직선이에요. 해가 무수히 많아요.', tex: rel === 0 ? '(\\text{해}) : 1\\text{쌍}' : rel === 1 ? '(\\text{해}) : \\text{없음}' : '(\\text{해}) : \\text{무수히 많음}' });
      return { tex: cases([gen(e1), gen(e2)]), text: '이 연립방정식에서 두 일차방정식의 그래프의 위치 관계를 고르세요.', ans: OPT[rel], options: OPT, wrong: wrong, steps: steps, check: relCheck(e1, e2) === rel,
        hints: [COUNT, (e1.form === 2 && e2.form === 2 ? '두 식이 이미 $y = ax + b$ 꼴이에요. ' : '먼저 두 식을 각각 $y = ax + b$ 꼴로 고쳐요. $y$가 있는 항만 왼쪽에 남기고 $y$ 앞의 수로 나눠요. ') + '그다음 $x$ 앞의 수(기울기)끼리 견줘요. 다르면 거기서 끝이에요. 한 점에서 만나요. 같으면 한 걸음 더 가서 뒤의 수($y$절편)끼리 견줘요.',
          '① 두 식을 $y = ax + b$ 꼴로 맞춰요. ② 기울기가 다르면 한 점에서 만나요(해 한 쌍). ③ 기울기가 같으면 $y$절편을 봐요. 다르면 평행(해 없음), 같으면 일치(해가 무수히 많음)예요. ④ 두 직선이 두 점에서 만나는 일은 없어요.'] };
    }
    /* pick: 주어진 식과 연립했을 때 해가 없는(무수히 많은) 식 고르기 */
    var want = q.want, list = [q.e2].concat(q.others), texs = list.map(gen), t0 = gen(e1);
    wrong = q.others.map(function (e, i) {
      var r2 = relOf(e1, e);
      return [texs[i + 1], r2 === 0 ? 'intersect-' + (i + 1) : r2 === 1 ? 'parallel' : 'same-line',
        r2 === 0 ? '이 식의 그래프는 기울기가 $' + fr(slopeE(e)) + '$' + rj(slopeE(e), '이라/라') + ' 주어진 직선(기울기 $' + fr(m1) + '$)과 한 점에서 만나요. 해가 한 쌍이에요.'
          : r2 === 1 ? '이 식의 그래프는 주어진 직선과 기울기만 같고 $y$절편이 달라요. 평행해서 해가 없어요. 문제에서 찾는 것은 해가 무수히 많은 경우(일치)예요.'
          : '이 식은 주어진 식의 양쪽에 같은 수를 곱한 것이라 같은 직선이에요. 일치해서 해가 무수히 많아요. 문제에서 찾는 것은 해가 없는 경우(평행)예요.'];
    });
    return { tex: t0, text: '다음 중 이 일차방정식과 연립했을 때 해가 ' + (want === 1 ? '없는' : '무수히 많은') + ' 것을 고르세요.', ans: texs[0], wrong: wrong,
      check: relCheck(e1, q.e2) === want && q.others.every(function (e) { return relCheck(e1, e) !== want && relCheck(e1, e) >= 0; }),
      steps: [{ say: '주어진 식을 $y = ax + b$ 꼴로 고쳐 기울기와 $y$절편을 알아 둬요.', tex: y1 },
        { say: want === 1 ? '해가 없으려면 평행해야 해요. 기울기는 같고 $y$절편은 다른 식을 찾아요.' : '해가 무수히 많으려면 일치해야 해요. 기울기도 $y$절편도 같은 식, 곧 주어진 식에 같은 수를 곱한 식을 찾아요.', tex: line(slopeE(q.e2), rat(q.e2.c, q.e2.b)) }, { say: '그 식이 답이에요.', tex: texs[0] }],
      hints: [COUNT, '해가 ' + (want === 1 ? '없다는 것은 두 직선이 평행하다는 뜻이에요. 기울기는 같고 $y$절편은 달라야 해요.' : '무수히 많다는 것은 두 직선이 일치한다는 뜻이에요. 기울기도 $y$절편도 같아야 해요.') + ' 빨리 찾는 방법이 있어요. 주어진 식의 $x$의 계수와 $y$의 계수에 같은 수를 곱한 식을 찾아요. 그런 식은 기울기가 같아요. 그때 상수항까지 같은 수가 곱해져 있으면 일치, 상수항만 다르면 평행이에요.',
        '① 주어진 식의 $x$, $y$의 계수를 봐요. ② 보기 가운데 두 계수가 똑같은 배수로 된 식을 찾아요(기울기가 같은 식). ③ 그 식의 상수항도 같은 배수인지 확인해요. 같은 배수이면 일치, 아니면 평행이에요. ④ 문제에서 묻는 쪽(해가 없는 것 / 무수히 많은 것)을 골라요.'] };
  };
  var okN = function (q) { var p = countBuild(q); return !!p && p.check; };
  var relQ = function (r, yform) {
    return until(function () {
      var rel = r.pick([0, 0, 1, 1, 2]), a = nz(r, -5, 5), b = yform ? 1 : nz(r, -4, 4), c = nz(r, -9, 9), t = yform ? 1 : pm(r, r.int(2, 3)), e1 = E(a, b, c, yform ? 2 : r.int(0, 1)), e2;
      if (rel === 0) e2 = E(nz(r, -5, 5), yform ? 1 : nz(r, -4, 4), r.int(0, 3) ? nz(r, -9, 9) : c, yform ? 2 : r.int(0, 1));
      else if (rel === 1) e2 = E(a * t, b * t, c * t + (yform ? nz(r, -6, 6) : t * nz(r, -3, 3) + r.int(0, 1)), yform ? 2 : r.int(0, 1));
      else { if (yform) return null; e2 = E(a * t, b * t, c * t, 1 - e1.form); }
      return { kind: 'rel', e1: r.int(0, 1) ? e1 : e2, e2: null, o: order4(r), a: e1, b: e2 };
    }, function (q) { q.e2 = q.e1 === q.a ? q.b : q.a; return okN(q) && abs(q.e1.c) <= 30 && abs(q.e2.c) <= 30; });
  };
  choiceQ({
    id: 'B16.count', title: '해의 개수와 두 직선의 위치 관계', ids: ['said-one', 'said-none', 'said-infinite', 'said-two', 'intersect-2', 'intersect-3', 'parallel', 'same-line'], build: countBuild,
    levels: [
      { name: 'y = ax + b 꼴의 두 식', vars: { q: sampler(function (r) {
          return until(function () {
            var rel = r.pick([0, 1, 1, 2]), a = nz(r, -6, 6), c = nz(r, -9, 9), e1 = E(-a, 1, c, 2), e2 = rel === 0 ? E(-nz(r, -6, 6), 1, r.int(0, 2) ? nz(r, -9, 9) : c, 2) : rel === 1 ? E(-a, 1, nz(r, -9, 9), 2) : E(-a * 2, 2, c * 2, r.int(0, 1));
            return { kind: 'rel', e1: e1, e2: e2, o: order4(r) };
          }, okN);
        }) } },
      { name: '일차방정식 꼴의 두 식', vars: { q: sampler(function (r) { return relQ(r, false); }) } },
      { name: '해가 없는 · 무수히 많은 식 고르기', vars: { q: sampler(function (r) {
          return until(function () {
            var want = r.int(1, 2), a = nz(r, -4, 4), b = nz(r, -4, 4), c = nz(r, -8, 8), t = pm(r, r.int(2, 3)), t2 = pm(r, r.int(2, 3)), e1 = E(a, b, c, 0);
            var par2 = E(a * t, b * t, c * t + nz(r, -4, 4), 0), sameL = E(a * t2, b * t2, c * t2, 0), x1 = E(b * t, a * t, c * t, 0), x2 = E(a * t, -b * t, c * t, 0), x3 = E(a, b + nz(r, -2, 2), c, 0);
            if (!x3.b) return null;
            return { kind: 'pick', want: want, e1: e1, e2: want === 1 ? par2 : sameL, others: [want === 1 ? sameL : par2, x1, r.int(0, 1) ? x2 : x3], o: order4(r) };
          }, function (q) { return okN(q) && q.others.filter(function (e) { return relOf(q.e1, e) === 0; }).length === 2 && [q.e2].concat(q.others).every(function (e) { return abs(e.c) <= 30; }); });
        }) } }
    ]
  });

  /* ── B16.param 상수 구하기 ─────────────────────────── */
  var PARAM = '교점은 두 직선 모두 위에 있는 점이에요. 그래서 교점의 좌표는 두 방정식에 넣어도 모두 성립해요. 모르는 상수가 든 식이 있어도, 교점의 좌표만 알면 그 식에 넣어서 상수를 구할 수 있어요. 약속 장소를 알면, 그곳을 지나는 길이 어떤 길인지 거꾸로 알아낼 수 있는 것과 같아요.';
  var aTex = function (e) { return 'ax' + (e.b < 0 ? ' - ' : ' + ') + (abs(e.b) === 1 ? '' : abs(e.b)) + 'y = ' + e.c; };
  var aSteps = function (e, p, v) {
    return [{ say: '$a$가 든 식에 $x = ' + p + '$, $y = ' + v + '$' + pj(v, '을/를') + ' 넣어요.', tex: 'a \\times ' + par(p) + (e.b < 0 ? ' - ' : ' + ') + (abs(e.b) === 1 ? '' : abs(e.b) + ' \\times ') + par(v) + ' = ' + e.c },
      { say: '수끼리 계산하고 $a$가 있는 항만 왼쪽에 남겨요.', tex: poly([[p, 'a']]) + ' = ' + (e.c - e.b * v) }, { say: '양쪽을 $a$ 앞의 수로 나눠요.', tex: 'a = ' + e.a }];
  };
  var paramBuild = function (q) {
    var eA = q.eA, e = q.e, p = q.p, v = q.q, tA = aTex(eA), wrong = {}, text, steps, h2, tex, chk, m;
    if (q.kind === 'none') {
      /* a x + b y = c 와 e 가 평행(해가 없다) → a = e.a · b / e.b */
      tex = cases(q.first ? [tA, gen(e)] : [gen(e), tA]); m = eA.b / e.b;
      wrong['ratio-inverted'] = rat(e.a * e.b, eA.b); wrong['coef-copied'] = R(e.a); wrong['const-ratio'] = rat(e.a * eA.c, e.c);
      return { tex: tex, text: '이 연립방정식의 해가 없을 때, 상수 $a$의 값을 구하세요.', ans: R(eA.a), wrong: wrong,
        check: relCheck(eA, e) === 1 && isInt(m) && abs(m) > 1,
        steps: [{ say: '해가 없으려면 두 직선이 평행해야 해요. 기울기가 같아야 하니, $x$의 계수와 $y$의 계수가 같은 배수여야 해요. $y$의 계수를 견줘 몇 배인지 찾아요.', tex: eA.b + ' = ' + e.b + ' \\times ' + par(m) },
          { say: '$x$의 계수도 같은 배수예요.', tex: 'a = ' + e.a + ' \\times ' + par(m) + ' = ' + eA.a }, { say: '상수항은 같은 배수가 아니라서(' + e.c + '의 ' + m + '배는 ' + e.c * m + ') 두 직선은 겹치지 않고 평행해요.', tex: 'a = ' + eA.a }],
        hints: [COUNT, '해가 없다는 것은 두 직선이 평행하다는 뜻이에요. 평행하면 기울기가 같아요. 기울기가 같으려면 한 식의 $x$, $y$의 계수가 다른 식의 $x$, $y$의 계수에 같은 수를 곱한 것이어야 해요. 두 식에서 $y$의 계수는 $' + eA.b + '$' + pj(eA.b, '과/와') + ' $' + e.b + '$' + pj(e.b, '이에요/예요') + '. 한쪽이 다른 쪽의 몇 배인지 먼저 알아내요.',
          '① 두 식의 $y$의 계수를 견줘 몇 배인지 구해요. ② $x$의 계수도 똑같은 배수가 되도록 $a$를 정해요. ③ 상수항이 같은 배수가 아닌지 확인해요. 같은 배수이면 일치해서 해가 무수히 많아져요. ④ 배수를 거꾸로 적용하지 않았는지 확인해요.'] };
    }
    /* a 가 든 직선이 다른 직선과 겹치면 교점이 하나로 정해지지 않는다 */
    chk = eA.a * p + eA.b * v === eA.c && onEq(tA, R(p), R(v), { a: R(eA.a) }) && eA.a * e.b !== e.a * eA.b && (q.kind !== 'three' || eA.a * q.e2.b !== q.e2.a * eA.b);
    wrong['swapped-xy'] = v ? rat(eA.c - eA.b * p, v) : null; wrong['move-sign'] = rat(eA.c + eA.b * v, p); wrong['not-divided'] = R(eA.c - eA.b * v);
    if (q.kind === 'pt') {
      tex = cases(q.first ? [tA, gen(e)] : [gen(e), tA]);
      text = '두 일차방정식의 그래프의 교점의 좌표가 $' + pt(p, v) + '$일 때, 상수 $a$의 값을 구하세요.';
      steps = aSteps(eA, p, v);
      h2 = '교점의 좌표 $' + pt(p, v) + '$' + pj(v, '은/는') + ' 두 식 모두의 해예요. 그 가운데 $a$가 든 식에 넣으면 돼요. $x$ 자리에 $' + p + '$, $y$ 자리에 $' + v + '$' + pj(v, '을/를') + ' 넣어요. 순서쌍의 앞의 수가 $x$좌표예요. 넣고 나면 문자는 $a$만 남아요.';
      chk = chk && onEq(gen(e), R(p), R(v));
    } else if (q.kind === 'xc') {
      /* 교점의 x 좌표만 안다 → e 로 y 를 먼저 구한다 */
      tex = cases(q.first ? [tA, gen(e)] : [gen(e), tA]);
      text = '두 일차방정식의 그래프의 교점의 $x$좌표가 $' + p + '$일 때, 상수 $a$의 값을 구하세요.';
      wrong['y-answered'] = R(v);
      steps = [{ say: '$a$가 없는 식에 $x = ' + p + '$' + pj(p, '을/를') + ' 넣어 교점의 $y$좌표를 먼저 구해요.', tex: (e.a === 1 ? '' : e.a === -1 ? '-' : e.a + ' \\times ') + par(p) + (e.b < 0 ? ' - ' : ' + ') + (abs(e.b) === 1 ? '' : abs(e.b)) + 'y = ' + e.c }, { say: '$y$의 값을 구해요.', tex: 'y = ' + v }].concat(aSteps(eA, p, v));
      h2 = '교점의 $x$좌표만 알려 줬어요. $y$좌표를 먼저 찾아야 해요. 교점은 $a$가 없는 직선 위에도 있으니, 그 식의 $x$ 자리에 $' + p + '$' + pj(p, '을/를') + ' 넣으면 $y$좌표가 나와요. 그러면 교점의 좌표를 모두 알게 돼요. 그 좌표를 $a$가 든 식에 넣어 $a$를 구해요.';
      chk = chk && onEq(gen(e), R(p), R(v)) && e.form === 0;
    } else {
      /* three: 세 직선이 한 점에서 만난다 → 앞의 두 식의 교점을 셋째 식에 넣는다 */
      tex = cases([gen(e), gen(q.e2), tA]);
      text = '세 일차방정식의 그래프가 한 점에서 만날 때, 상수 $a$의 값을 구하세요.';
      wrong['y-answered'] = R(v); wrong['x-answered'] = R(p);
      steps = [{ say: '$a$가 없는 두 식을 연립해서 풀어 교점을 구해요.', tex: 'x = ' + p + ',\\quad y = ' + v }].concat(aSteps(eA, p, v));
      h2 = '세 직선이 한 점에서 만난다는 것은, 두 직선의 교점을 나머지 한 직선도 지난다는 뜻이에요. $a$가 없는 두 식은 완전히 아는 직선이에요. 이 둘을 연립방정식으로 풀면 교점이 나와요. 셋째 직선도 그 점을 지나야 하니, 교점의 좌표를 $a$가 든 식에 넣어요.';
      m = cramer(e, q.e2);
      chk = chk && !!m && m.p === p && m.q === v && onEq(gen(e), R(p), R(v)) && onEq(gen(q.e2), R(p), R(v));
    }
    return { tex: tex, text: text, ans: R(eA.a), wrong: wrong, steps: steps, check: chk && p !== v && abs(eA.c) <= 40,
      hints: [PARAM, h2, '① 교점의 좌표를 알아내요(주어졌거나, $a$가 없는 식으로 구해요). ② $a$가 든 식의 $x$, $y$ 자리에 그 좌표를 넣어요. 음수는 괄호를 쳐서 넣어요. ③ 수끼리 계산하고 이항해서 $a$가 있는 항만 남겨요. ④ $a$ 앞의 수로 나눠요.'] };
  };
  var okP = function (q) { var b = paramBuild(q); return !!b && b.check && abs(b.ans.n) <= 12; };
  var paramQ = function (r, kind) {
    return until(function () {
      var p = nz(r, -6, 6), v = nz(r, -6, 6), a = nz(r, -6, 6), b = nz(r, -5, 5), a1 = nz(r, -5, 5), b1 = nz(r, -5, 5), a2 = nz(r, -5, 5), b2 = nz(r, -5, 5), t;
      if (kind === 'none') { t = pm(r, r.int(2, 3)); return { kind: kind, e: E(a1, b1, nz(r, -9, 9), 0), eA: E(a1 * t, b1 * t, nz(r, -20, 20), 0), first: r.int(0, 1) === 1 }; }
      return { kind: kind, p: p, q: v, eA: E(a, b, a * p + b * v, 0), e: E(a1, b1, a1 * p + b1 * v, 0), e2: E(a2, b2, a2 * p + b2 * v, 0), first: r.int(0, 1) === 1 };
    }, function (q) { return okP(q) && abs(q.e.c) <= 40 && (kind !== 'three' || abs(q.e2.c) <= 40); });
  };
  valueQ({
    id: 'B16.param', title: '상수 구하기', kind: 'signed', build: paramBuild,
    mistakes: [['y-answered', '교점의 $y$좌표를 답했어요. 교점은 맞게 구했을 수 있어요. 문제에서 묻는 것은 상수 $a$예요. 교점의 좌표를 $a$가 든 식에 넣어요.'],
      ['x-answered', '교점의 $x$좌표를 답했어요. 문제에서 묻는 것은 상수 $a$예요. 교점의 좌표를 $a$가 든 식에 넣어 $a$를 구해요.'],
      ['swapped-xy', '$x$좌표와 $y$좌표를 바꿔 넣었어요. 순서쌍에서 앞의 수가 $x$좌표, 뒤의 수가 $y$좌표예요.'],
      ['move-sign', '수를 이항하면서 부호를 바꾸지 않았어요. 등호를 건너가면 $+$는 $-$로, $-$는 $+$로 바뀌어요.'],
      ['not-divided', '이항까지만 하고 $a$ 앞의 수로 나누지 않았어요. 마지막에 양쪽을 $a$ 앞의 수로 나눠요.'],
      ['ratio-inverted', '배수를 거꾸로 적용했어요. $y$의 계수가 몇 배가 되었는지 구했으면, $x$의 계수도 같은 방향으로 그만큼 곱해요.'],
      ['coef-copied', '다른 식의 $x$의 계수를 그대로 썼어요. $y$의 계수가 서로 다르니 $x$의 계수도 그대로일 수 없어요. 같은 배수만큼 곱해야 기울기가 같아져요.'],
      ['const-ratio', '상수항의 비로 계산했어요. 평행한지는 $x$의 계수와 $y$의 계수로 정해져요. 상수항까지 같은 배수이면 오히려 일치해서 해가 무수히 많아져요.']],
    levels: [
      { name: '교점의 좌표를 알 때', vars: { q: sampler(function (r) { return paramQ(r, 'pt'); }) } },
      { name: '교점의 x좌표만 알 때', vars: { q: sampler(function (r) { return paramQ(r, 'xc'); }) } },
      { name: '해가 없을 때 · 세 직선이 한 점에서 만날 때', vars: { q: sampler(function (r) { return paramQ(r, r.pick(['none', 'three'])); }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B16', [
  { title: '일차방정식의 그래프', body: [
    '$x$, $y$가 든 일차방정식 $ax + by + c = 0$의 해를 좌표평면에 모두 찍으면 직선이 돼요.',
    '이 식을 $y$에 대해 풀면 일차함수의 식이 돼요. 같은 직선을 두 가지로 쓴 것이에요.',
    { tex: '2x + y - 4 = 0 \\;\\Rightarrow\\; y = -2x + 4' },
    '$y = \\cdots$ 꼴로 고치면 기울기($-2$)와 $y$절편($4$)이 바로 보여요.',
    { ex: [['x = 0 \\;\\Rightarrow\\; y = 4', '$y$절편은 $x$ 자리에 0을 넣어요'], ['y = 0 \\;\\Rightarrow\\; x = 2', '$x$절편은 $y$ 자리에 0을 넣어요']] }
  ] },
  { title: '축에 평행한 직선', body: [
    '$x = 3$은 $x$좌표가 늘 3인 점들이에요. 위아래로 선 직선이고 $y$축에 평행해요.',
    { figure: { type: 'plane', range: 5, vline: 3 } },
    '$y = -2$는 높이가 늘 $-2$인 점들이에요. 옆으로 누운 직선이고 $x$축에 평행해요.',
    { figure: { type: 'plane', range: 5, hline: -2 } },
    '$x = 0$은 $y$축, $y = 0$은 $x$축이에요.'
  ] },
  { title: '교점과 연립방정식의 해', body: [
    '두 일차방정식의 그래프가 만나는 점(교점)은 두 방정식을 동시에 만족해요. 그 좌표가 연립방정식의 해예요.',
    { tex: '\\begin{cases} x - y = -1 \\\\ x + y = 3 \\end{cases}' },
    { figure: { type: 'plane', range: 5, line: [1, 1, 1], line2: [-1, 1, 3] } },
    '두 직선이 점 $(1,\\ 2)$에서 만나요. 그래서 해는 $x = 1$, $y = 2$예요.',
    '거꾸로, 연립방정식을 풀면 그림 없이도 교점의 좌표를 구할 수 있어요.'
  ] },
  { title: '해의 개수와 두 직선', body: [
    '두 직선이 놓이는 모양은 세 가지예요. 두 식을 $y = ax + b$ 꼴로 고쳐서 견줘요.',
    { ex: [['\\text{기울기가 다르다}', '한 점에서 만나요. 해가 한 쌍이에요.'], ['\\text{기울기가 같고 } y\\text{절편이 다르다}', '평행해요. 해가 없어요.'], ['\\text{기울기도 } y\\text{절편도 같다}', '일치해요. 해가 무수히 많아요.']] },
    { tex: '\\begin{cases} x + 2y = 3 \\\\ 2x + 4y = 5 \\end{cases} \\;:\\; \\text{평행 (해가 없다)}' },
    '$x$, $y$의 계수가 똑같이 2배인데 상수항은 2배가 아니에요. 이럴 때 평행해요. 상수항까지 2배이면 일치해요.'
  ] }
]);
