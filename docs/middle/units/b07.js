/* B07 일차방정식 — 등식의 성질, 이항, 계수가 분수 · 소수인 방정식
   유형(쉬운 것부터): B07.basic 등식의 성질로 풀기 · B07.shift 이항(답이 식 → 보기 고르기) · B07.move 이항해서 풀기
                     · B07.paren 괄호가 있는 방정식 · B07.frac 계수가 소수 · 분수인 방정식
   해는 수 하나라서 키패드로 넣는다(B07.frac 만 분수 칸이 있는 rational, 나머지는 signed).
   방정식의 양쪽은 항의 목록 [[계수, 문자], …] 으로 다루고, 해는 { n, d } 로 정확히 계산한다.
   검산은 화면에 보이는 식을 MH.alg.ev 로 다시 읽어, 답을 넣었을 때 양쪽 값이 같은지 본다.
   힌트에는 문제에 보이는 수와 곱하는 수(10, 최소공배수)만 쓴다. 그 수가 우연히 답과 같은 문제는 내지 않는다(leak). */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, body = A.body, order4 = A.order4, gcd = MH.gcd, lcm = MH.lcm, abs = Math.abs;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var XS = ['x', 'x', 'x', 'a', 'y'];
  /** 정확한 분수 { n, d } (d > 0, 약분됨). 분모가 0 이면 null */
  var rat = function (n, d) { if (!d) return null; if (d < 0) { n = -n; d = -d; } var g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
  var ratTex = function (r) { return (r.n < 0 ? '-' : '') + (r.d === 1 ? abs(r.n) : '\\dfrac{' + abs(r.n) + '}{' + r.d + '}'); };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  /** 부호를 붙인 항: '+5', '-2x' */
  var sgn = function (t) { return (t[0] < 0 ? '-' : '+') + body(t); };
  /** 수 뒤에 붙일 조사만: pj(3, '을/를') → '을' */
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var xs = function (s) { return s.filter(function (t) { return t[1]; }); };
  var cs = function (s) { return s.filter(function (t) { return !t[1]; }); };
  var sum = function (s) { return s.reduce(function (a, t) { return a + t[0]; }, 0); };
  var neg = function (s) { return s.map(function (t) { return [-t[0], t[1]]; }); };

  /** 계수가 정수인 방정식 L = R 을 이항해서 푼다: left = right (문자 항 = 수) → A x = B → 해 */
  var lin = function (L, R) {
    var left = xs(L).concat(neg(xs(R))), right = cs(R).concat(neg(cs(L))), a = sum(left), b = sum(right);
    return { L: L, R: R, left: left, right: right, A: a, B: b, sol: rat(b, a), la: sum(xs(L)), ra: sum(xs(R)), lb: sum(cs(L)), rb: sum(cs(R)),
      moving: xs(R).concat(cs(L)), needTidy: left.length > 1 || right.length > 1 };
  };
  /** 이항 → 양쪽 계산 → 나누기의 풀이 줄 */
  var linSteps = function (m, x, value) {
    var out = [], s = m.sol, raw = m.A < 0 || gcd(m.B, m.A) > 1 ? '\\dfrac{' + m.B + '}{' + m.A + '} = ' : '';
    if (m.moving.length) out.push({ say: '문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요. 등호를 건너는 항은 부호가 바뀌어요.', tex: poly(m.left) + ' = ' + poly(m.right) });
    if (m.needTidy) out.push({ say: '양쪽을 각각 계산해요.', tex: poly([[m.A, x]]) + ' = ' + m.B });
    if (out.length === 0) out.push({ say: '이미 문자가 있는 항은 왼쪽에, 수는 오른쪽에 있어요.', tex: poly([[m.A, x]]) + ' = ' + m.B });
    out.push({ say: m.A === 1 ? '왼쪽에 문자만 남았어요. 이것이 해예요.' : m.A === -1 ? '양쪽에 −1을 곱해서 부호를 바꿔요.' : '양쪽을 문자 앞의 수 $' + m.A + '$' + pj(m.A, '으로/로') + ' 나눠요.' + (s.d !== 1 ? ' 나누어떨어지지 않으면 분수로 써요.' : ''),
      tex: x + ' = ' + (abs(m.A) === 1 ? '' : raw) + ratTex(s), value: value(s) });
    return out;
  };
  var MOVE_HINT = function (m, x) {
    return '① 문자 $' + x + '$가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 모아요. 이 식에서 등호를 건너야 하는 항: ' + m.moving.map(function (t) { return '$' + sgn(t) + '$'; }).join(', ') + '. 이 항들만 부호가 바뀌고, 제자리에 있는 항은 그대로예요.';
  };
  var DIVIDE_HINT = function (x) {
    return '② 양쪽을 각각 계산해서 (수) × $' + x + '$ = (수) 꼴로 만들어요. 왼쪽은 문자가 있는 항끼리, 오른쪽은 수끼리 계산해요. ③ 마지막으로 양쪽을 $' + x + '$ 앞의 수로 나눠요. 그 수가 음수이면 답의 부호가 바뀌는 것에 주의해요.';
  };

  /* ── 방정식을 푸는 유형의 공통 틀 ──
     o = { id, title, kind: 'signed' | 'rational', levels, build, hints, steps, mistakes: [{ id, wrong: (문제) → 수 | { n, d } | null, explain }] }
     o.build(v.q) → { x, lhs, rhs, sol: { n, d }, … } (만들 수 없는 문제이면 null). 단계의 where 는 만든 문제를 받는다. max 는 해의 크기 제한 */
  var eqType = function (o) {
    var lastQ = null, lastP = null, rational = o.kind === 'rational';
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (r) { return rational ? { n: r.n, d: r.d } : { n: r.n, p: 0 }; };
    var ask = function (p) { return '방정식을 풀어 $' + p.x + '$의 값을 구하세요.'; };
    /* 힌트에 쓴 수(10, 최소공배수 …)가 문제에 없는데 우연히 답과 같으면 답을 알려 주는 셈이다 */
    var leak = function (p) {
      if (p.sol.d !== 1 || p.sol.n < 0) return false;
      var a = String(p.sol.n);
      return ((p.lhs + ' ' + p.rhs).match(/\d+/g) || []).indexOf(a) < 0 && (o.hints(p).join(' ').match(/\d+/g) || []).indexOf(a) >= 0;
    };
    o.levels.forEach(function (lv) {
      var extra = lv.where, max = lv.max || 12;
      lv.where = function (v) {
        var p = P(v);
        return !!p && !!p.sol && p.sol.n !== 0 && (rational || p.sol.d === 1) && abs(p.sol.n) <= max && (!extra || extra(p)) && !leak(p);
      };
      delete lv.max;
    });
    MH.defineType({
      id: o.id, unit: 'B07', version: 1, title: o.title,
      answer: { kind: o.kind },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { tex: p.lhs + ' = ' + p.rhs, text: ask(p) }; },
      solve: function (v) { return val(P(v).sol); },
      /* 검산: 화면의 식에 답을 넣으면 양쪽 값이 같다(분수 답은 약분된 것) */
      verify: function (v, ans) {
        var p = P(v), env = {}, r = rat(ans.n, rational ? ans.d : 1);
        env[p.x] = MH.F(r.n, r.d);
        return A.ev(p.lhs, env).equals(A.ev(p.rhs, env)) && (!rational || (ans.d >= 1 && gcd(ans.n, ans.d) === 1));
      },
      hints: function (v) { return o.hints(P(v)); },
      steps: function (v) { return o.steps(P(v), val); },
      mistakes: o.mistakes.map(function (m) {
        return { id: m.id,
          wrong: function (v) {
            var p = P(v), r = m.wrong(p);
            if (r === null || r === undefined) return null;
            if (typeof r === 'number') r = rat(r, 1);
            if ((r.n === p.sol.n && r.d === p.sol.d) || (!rational && r.d !== 1)) return null;
            return val(r);
          },
          explain: function (v) { return m.explain(P(v)); } };
      })
    });
  };
  var HALF = { id: 'half', wrong: function (p) { return p.m && abs(p.m.A) !== 1 ? p.m.B : null; },
    explain: function (p) { return '마지막 단계를 하지 않았어요. (수) × $' + p.x + '$ = (수) 꼴까지 만든 다음, 양쪽을 $' + p.x + '$ 앞의 수로 나눠야 해가 나와요.'; } };

  /* ── B07.basic 등식의 성질로 풀기 ──────────────────────
     v.q = { k, x, a, b, c }
       add    x + a = b (flip 이면 a + x = b)     mul  ax = b     div  x/a = b
       two    ax + b = c                          divtwo  x/a + b = c */
  var basicBuild = function (q) {
    var x = q.x, a = q.a, b = q.b, c = q.c, k = q.k, lhs, sol, rhs = String(k === 'two' || k === 'divtwo' ? c : b);
    if (k === 'add') { lhs = q.flip ? a + ' + ' + x : poly([[1, x], [a, '']]); sol = rat(b - a, 1); }
    else if (k === 'mul') { lhs = poly([[a, x]]); sol = rat(b, a); }
    else if (k === 'div') { lhs = '\\dfrac{' + x + '}{' + a + '}'; sol = rat(a * b, 1); }
    else if (k === 'two') { lhs = poly([[a, x], [b, '']]); sol = rat(c - b, a); }
    else { lhs = '\\dfrac{' + x + '}{' + a + '}' + (b < 0 ? ' - ' : ' + ') + abs(b); sol = rat(a * (c - b), 1); }
    /* undo: 더해진(빼진) 수를 없애는 계산 */
    var u = k === 'add' ? a : b, undo = u === undefined ? null : { say: u > 0 ? '양쪽에서 ' + josa(String(u), '을/를') + ' 빼요' : '양쪽에 ' + josa(String(-u), '을/를') + ' 더해요', op: u > 0 ? ' - ' + u : ' + ' + (-u) };
    return { q: q, x: x, lhs: lhs, rhs: rhs, sol: sol, undo: undo };
  };
  eqType({
    id: 'B07.basic', title: '등식의 성질로 풀기', kind: 'signed', build: basicBuild,
    levels: [
      { name: '더하거나 빼서 풀기', max: 30, vars: { q: sampler(function (r) {
          var a = pm(r, r.int(1, 15));
          return { k: 'add', x: r.pick(XS), a: a, b: r.int(-12, 20), flip: a > 0 && r.int(0, 3) === 0 };
        }) } },
      { name: '곱하거나 나눠서 풀기', max: 81, vars: { q: sampler(function (r) {
          var a;
          if (r.int(0, 2) === 0) return { k: 'div', x: r.pick(XS), a: r.int(2, 9), b: nz(r, -9, 9) };
          a = r.int(0, 5) === 0 ? -1 : pm(r, r.int(2, 9));
          return { k: 'mul', x: r.pick(XS), a: a, b: a * nz(r, -9, 9) };
        }) } },
      { name: '두 번 써서 풀기', max: 36, vars: { q: sampler(function (r) {
          var a, b = nz(r, -15, 15);
          if (r.int(0, 3) === 0) { a = r.int(2, 6); return { k: 'divtwo', x: r.pick(XS), a: a, b: b, c: nz(r, -6, 6) + b }; }
          a = pm(r, r.int(2, 9));
          return { k: 'two', x: r.pick(XS), a: a, b: b, c: a * nz(r, -9, 9) + b };
        }) } }
    ],
    hints: function (p) {
      var q = p.q, x = p.x, a = q.a, k = q.k, second, third;
      var first = '등식은 양팔 저울과 같아요. 양쪽에 똑같은 수를 더하거나, 빼거나, 곱하거나, 0이 아닌 수로 나눠도 저울은 평형 그대로예요. 이 성질을 써서 한쪽에 $' + x + '$만 남기면, 반대쪽에 남은 수가 해예요.';
      if (k === 'add') {
        second = a > 0 ? '왼쪽을 보면 $' + x + '$에 ' + josa(String(a), '이/가') + ' 더해져 있어요. 더해진 수를 없애려면 반대 계산인 뺄셈을 해요. 저울 한쪽에서만 덜어 내면 기울어지니까, 양쪽에서 똑같이 ' + josa(String(a), '을/를') + ' 빼요.'
          : '왼쪽을 보면 $' + x + '$에서 ' + josa(String(-a), '이/가') + ' 빼져 있어요. 빼진 수를 없애려면 반대 계산인 덧셈을 해요. 저울 한쪽에만 올리면 기울어지니까, 양쪽에 똑같이 ' + josa(String(-a), '을/를') + ' 더해요.';
        third = '식으로 쓰면 이렇게 돼요: $' + p.lhs + p.undo.op + ' = ' + p.rhs + p.undo.op + '$. 왼쪽은 $' + x + '$만 남고, 오른쪽을 계산한 결과가 해예요. 오른쪽에도 왼쪽과 똑같은 계산을 해야 한다는 것에 주의해요.';
      } else if (k === 'mul') {
        second = a === -1 ? '$-' + x + '$는 (−1) × $' + x + '$를 줄여 쓴 것이에요. 양쪽에 똑같이 −1을 곱하면(양쪽의 부호를 바꾸면) 왼쪽이 $' + x + '$가 돼요.'
          : '$' + p.lhs + '$는 $' + par(a) + ' \\times ' + x + '$를 줄여 쓴 것이에요. 곱해진 수를 없애려면 반대 계산인 나눗셈을 해요. 양쪽을 똑같이 $' + a + '$' + pj(a, '으로/로') + ' 나눠요.';
        third = a === -1 ? '음수의 부호를 바꾸면 양수, 양수의 부호를 바꾸면 음수예요. 오른쪽 수의 부호만 바꾸면 그것이 해예요. 수의 크기는 변하지 않아요.'
          : '식으로 쓰면 이렇게 돼요: $\\dfrac{' + p.lhs + '}{' + a + '} = \\dfrac{' + p.rhs + '}{' + a + '}$. 왼쪽은 약분되어 $' + x + '$만 남아요. 오른쪽 나눗셈에서는 부호를 먼저 정해요: 두 수의 부호가 같으면 +, 다르면 −예요.';
      } else if (k === 'div') {
        second = '$' + p.lhs + '$는 $' + x + ' \\div ' + a + '$를 분수 꼴로 쓴 것이에요. 나눠진 수를 없애려면 반대 계산인 곱셈을 해요. 양쪽에 똑같이 ' + josa(String(a), '을/를') + ' 곱해요.';
        third = '식으로 쓰면 이렇게 돼요: $' + p.lhs + ' \\times ' + a + ' = ' + par(q.b) + ' \\times ' + a + '$. 왼쪽은 약분되어 $' + x + '$만 남고, 오른쪽 곱셈의 결과가 해예요. 나누는 것이 아니라 곱하는 것임에 주의해요.';
      } else {
        var mulSay = k === 'two' ? '먼저 $' + par(a) + '$' + pj(a, '이/가') + ' 곱해지고' : '먼저 ' + josa(String(a), '으로/로') + ' 나눠지고';
        second = '$' + x + '$에 두 가지 계산이 되어 있어요. ' + mulSay + ', 그다음 ' + (q.b > 0 ? josa(String(q.b), '이/가') + ' 더해졌어요' : josa(String(-q.b), '이/가') + ' 빼졌어요') + '. 풀 때는 거꾸로, 나중에 한 계산부터 없애요. 신발을 벗은 다음에 양말을 벗는 것과 같아요.';
        third = '① ' + p.undo.say + ': $' + (k === 'two' ? poly([[a, x]]) : '\\dfrac{' + x + '}{' + a + '}') + ' = ' + p.rhs + p.undo.op + '$. ② 오른쪽을 계산해요. ③ ' + (k === 'two' ? '양쪽을 $' + a + '$' + pj(a, '으로/로') + ' 나눠요.' : '양쪽에 ' + josa(String(a), '을/를') + ' 곱해요.') + ' 순서를 바꾸면 계산이 복잡해져요.';
      }
      return [first, second, third];
    },
    steps: function (p, val) {
      var q = p.q, x = p.x, a = q.a, k = q.k, s = p.sol, end = { tex: x + ' = ' + ratTex(s), value: val(s) }, mid;
      if (k === 'add') { end.say = '오른쪽을 계산하면 해가 나와요.'; return [{ say: p.undo.say + '.', tex: p.lhs + p.undo.op + ' = ' + p.rhs + p.undo.op }, end]; }
      if (k === 'mul') {
        end.say = a === -1 ? '오른쪽 수의 부호가 바뀌어요.' : '왼쪽은 약분되어 문자만 남아요. 오른쪽을 계산해요.';
        return [a === -1 ? { say: '양쪽에 −1을 곱해요.', tex: p.lhs + ' \\times (-1) = ' + par(q.b) + ' \\times (-1)' } : { say: '양쪽을 문자 앞의 수 $' + a + '$' + pj(a, '으로/로') + ' 나눠요.', tex: '\\dfrac{' + p.lhs + '}{' + a + '} = \\dfrac{' + p.rhs + '}{' + a + '}' }, end];
      }
      if (k === 'div') { end.say = '왼쪽은 약분되어 문자만 남아요. 오른쪽을 계산해요.'; return [{ say: '양쪽에 ' + josa(String(a), '을/를') + ' 곱해요.', tex: p.lhs + ' \\times ' + a + ' = ' + par(q.b) + ' \\times ' + a }, end]; }
      mid = k === 'two' ? poly([[a, x]]) : '\\dfrac{' + x + '}{' + a + '}';
      end.say = k === 'two' ? '양쪽을 문자 앞의 수 $' + a + '$' + pj(a, '으로/로') + ' 나눠요.' : '양쪽에 ' + josa(String(a), '을/를') + ' 곱해요.';
      return [{ say: p.undo.say + '.', tex: mid + ' = ' + p.rhs + p.undo.op }, { say: '오른쪽을 계산해요.', tex: mid + ' = ' + (q.c - q.b) }, end];
    },
    /* ① 반대 계산이 아니라 같은 계산을 함 ② 나눌 것을 곱함 · 뺌 ③ 곱할 것을 나눔 ④ 한 단계만 하고 멈춤 ⑤ 상수항을 없애지 않고 나눔 */
    mistakes: [
      { id: 'same-op', wrong: function (p) { var q = p.q; return q.k === 'add' ? q.b + q.a : q.k === 'two' ? rat(q.c + q.b, q.a) : q.k === 'divtwo' ? q.a * (q.c + q.b) : null; },
        explain: function (p) { var u = p.q.k === 'add' ? p.q.a : p.q.b; return '반대 계산을 해야 하는데 같은 계산을 했어요. 왼쪽에서 ' + (u > 0 ? josa(String(u), '이/가') + ' 더해져 있으니 양쪽에서 ' + josa(String(u), '을/를') + ' 빼야 해요.' : josa(String(-u), '이/가') + ' 빼져 있으니 양쪽에 ' + josa(String(-u), '을/를') + ' 더해야 해요.'); } },
      { id: 'times', wrong: function (p) { return p.q.k === 'mul' ? p.q.b * p.q.a : null; },
        explain: function (p) { return '나눠야 하는데 곱했어요. $' + p.lhs + '$는 문자에 수가 곱해진 것이에요. 곱해진 수를 없애려면 양쪽을 그 수로 나눠요.'; } },
      { id: 'minus', wrong: function (p) { return p.q.k === 'mul' ? p.q.b - p.q.a : null; },
        explain: function (p) { return '빼서 풀었어요. $' + p.lhs + '$는 수와 문자의 덧셈이 아니라 곱셈이에요. 곱해진 수는 뺄셈이 아니라 나눗셈으로 없애요.'; } },
      { id: 'divided', wrong: function (p) { return p.q.k === 'div' ? rat(p.q.b, p.q.a) : null; },
        explain: function (p) { return '곱해야 하는데 나눴어요. $' + p.lhs + '$는 문자를 수로 나눈 것이에요. 나눠진 수를 없애려면 양쪽에 그 수를 곱해요.'; } },
      { id: 'half', wrong: function (p) { var q = p.q; return q.k === 'two' || q.k === 'divtwo' ? q.c - q.b : null; },
        explain: function (p) { return '첫 단계까지만 했어요. 아직 $' + p.x + '$에 수가 ' + (p.q.k === 'two' ? '곱해져 있어요. 양쪽을 그 수로 나눠야' : '나눠져 있어요. 양쪽에 그 수를 곱해야') + ' 해가 나와요.'; } },
      { id: 'divide-first', wrong: function (p) { var q = p.q; return q.k === 'two' && q.c % q.a === 0 ? q.c / q.a - q.b : null; },
        explain: function () { return '상수항을 없애기 전에 나눴어요. 먼저 나누려면 왼쪽의 모든 항을 나눠야 해서 복잡해져요. 더해진(빼진) 수부터 없앤 다음에 나눠요.'; } }
    ]
  });

  /* ── B07.shift 이항 (보기 고르기) ──────────────────────
     v.q = { x, a, b, c, d, o } — ax + b = cx + d (b 나 c 가 0 이면 그 항이 없다) */
  var E = function (l, r) { return poly(l) + ' = ' + poly(r); };
  var shiftBuild = function (q) {
    var x = q.x, a = q.a, b = q.b, c = q.c, d = q.d, ax = [a, x], D = [d, ''], wrong;
    var ans = E([ax].concat(c ? [[-c, x]] : []), [D].concat(b ? [[-b, '']] : []));
    if (!c) wrong = [[E([ax], [D, [b, '']]), 'keep-sign'], [E([ax], [D]), 'dropped'], [E([ax], [[-d, ''], [-b, '']]), 'stay-flipped']];
    else if (!b) wrong = [[E([ax, [c, x]], [D]), 'keep-sign'], [E([ax], [D]), 'dropped'], [E([ax, [-c, x]], [[-d, '']]), 'stay-flipped']];
    else wrong = [[E([ax, [-c, x]], [D, [b, '']]), 'keep-const'], [E([ax, [c, x]], [D, [-b, '']]), 'keep-x'], [E([ax, [c, x]], [D, [b, '']]), 'keep-both']];
    return { q: q, x: x, lhs: poly([ax].concat(b ? [[b, '']] : [])), rhs: poly((c ? [[c, x]] : []).concat([D])), ans: ans, wrong: wrong, sol: rat(d - b, a - c),
      moving: (c ? [[c, x]] : []).concat(b ? [[b, '']] : []) };
  };
  var sLast = null, sP = null;
  var SP = function (v) { if (v.q !== sLast) { sP = shiftBuild(v.q); sLast = v.q; } return sP; };
  /** 식 '… = …' 에 해를 넣으면 참인가 */
  var holds = function (eq, p) { var s = eq.split(' = '), env = {}; env[p.x] = MH.F(p.sol.n, p.sol.d); return A.ev(s[0], env).equals(A.ev(s[1], env)); };
  var shiftOptions = function (v) { var p = SP(v), all = [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); return v.q.o.map(function (i) { return all[i]; }); };
  var shiftOk = function (v) {
    var p = SP(v), all = [p.ans].concat(p.wrong.map(function (w) { return w[0]; }));
    return !!p.sol && p.sol.n !== 0 && all.every(function (t, i) { return all.indexOf(t) === i; }) && p.wrong.every(function (w) { return !holds(w[0], p); });
  };
  var SHIFT = {
    'keep-sign': '항을 옮기면서 부호를 바꾸지 않았어요. 등호를 건너는 항은 +는 −로, −는 +로 바뀌어요. 양쪽에서 같은 수를 빼거나 더한 결과이기 때문이에요.',
    dropped: '항을 그냥 지워 버렸어요. 한쪽에서만 없애면 저울이 기울어요. 없앤 항은 부호를 바꿔서 반대쪽에 써야 해요.',
    'stay-flipped': '옮기지 않은 항의 부호까지 바꿨어요. 부호가 바뀌는 것은 등호를 건넌 항뿐이에요. 제자리에 있는 항은 그대로 둬요.',
    'keep-const': '수만 있는 항을 옮기면서 부호를 바꾸지 않았어요. 문자가 있는 항뿐 아니라 수도 등호를 건너면 부호가 바뀌어요.',
    'keep-x': '문자가 있는 항을 옮기면서 부호를 바꾸지 않았어요. 수뿐 아니라 문자가 있는 항도 등호를 건너면 부호가 바뀌어요.',
    'keep-both': '두 항 모두 부호를 바꾸지 않고 옮겼어요. 등호를 건너는 항은 +는 −로, −는 +로 바뀌어요.'
  };
  var shiftQ = function (r, hasB, hasC) {
    return { x: r.pick(XS), a: r.int(0, 4) ? pm(r, r.int(2, 9)) : 1, b: hasB ? nz(r, -12, 12) : 0, c: hasC ? nz(r, -9, 9) : 0, d: nz(r, -15, 15), o: order4(r) };
  };
  MH.defineType({
    id: 'B07.shift', unit: 'B07', version: 1, title: '이항',
    answer: { kind: 'choice', options: shiftOptions },
    levels: [
      { name: '수만 있는 항을 이항하기', vars: { q: sampler(function (r) { return shiftQ(r, true, false); }) }, where: shiftOk },
      { name: '문자가 있는 항을 이항하기', vars: { q: sampler(function (r) { return shiftQ(r, false, true); }) }, where: shiftOk },
      { name: '두 항을 함께 이항하기', vars: { q: sampler(function (r) { return shiftQ(r, true, true); }) }, where: shiftOk }
    ],
    prompt: function (v) { var p = SP(v); return { tex: p.lhs + ' = ' + p.rhs, text: '문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항한 식을 고르세요.' }; },
    solve: function (v) { return SP(v).ans; },
    /* 검산: 정답 보기만 원래 방정식과 해가 같다(해를 넣으면 참) */
    verify: function (v, ans) {
      var p = SP(v), opts = shiftOptions(v);
      return ans === p.ans && opts.length === 4 && opts.indexOf(ans) >= 0 && holds(p.lhs + ' = ' + p.rhs, p) && holds(p.ans, p) && p.wrong.every(function (w) { return !holds(w[0], p); });
    },
    hints: function (v) {
      var p = SP(v);
      return [
        '이항은 항을 등호의 반대쪽으로 옮기는 것이에요. 등식의 양쪽에서 같은 수를 빼면, 한쪽에 있던 항이 사라지고 반대쪽에 부호가 바뀌어 나타나요. 그래서 "등호를 건너면 부호가 바뀐다"고 기억해요.',
        '먼저 어느 항이 등호를 건너야 하는지 찾아요. 문자가 있는 항이 오른쪽에 있으면 왼쪽으로, 수만 있는 항이 왼쪽에 있으면 오른쪽으로 가야 해요. 이 식에서 건너야 하는 항: ' + p.moving.map(function (t) { return '$' + sgn(t) + '$'; }).join(', '),
        '등호를 건너는 항만 부호가 바뀌어요. +는 −로, −는 +로요. 제자리에 있는 항의 부호는 건드리지 않아요. 항을 그냥 지우는 것도 아니에요. 지운 항은 반드시 반대쪽에 다시 나타나야 해요.'
      ];
    },
    steps: function (v) {
      var p = SP(v);
      return [
        { say: '등호를 건너야 하는 항을 찾아요: ' + p.moving.map(function (t) { return '$' + sgn(t) + '$'; }).join(', ') },
        { say: '건너는 항만 부호를 바꿔서 옮겨요. 제자리에 있는 항은 그대로예요.', tex: p.ans, value: p.ans }
      ];
    },
    mistakes: Object.keys(SHIFT).map(function (id) {
      var find = function (v) { return SP(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
      return { id: id, wrong: function (v) { var w = find(v); return w ? w[0] : null; }, explain: function () { return SHIFT[id]; } };
    })
  });

  /* ── B07.move 이항해서 풀기 ────────────────────────────
     v.q = { x, L: [[계수, 문자] …], R: […] } */
  var moveBuild = function (q) {
    if (q.L.concat(q.R).some(function (t) { return t[0] === 0; })) return null;
    var m = lin(q.L, q.R);
    return m.sol ? { q: q, x: q.x, lhs: poly(q.L), rhs: poly(q.R), sol: m.sol, m: m } : null;
  };
  /** 해가 k 가 되도록 오른쪽에 넣을 상수항 */
  var fit = function (L, R, k) { var m = lin(L, R); return m.A * k - m.B; };
  var KEEP_CONST = { id: 'keep-const', wrong: function (p) { var m = p.m; return m.lb ? rat(m.rb + m.lb, m.A) : null; },
    explain: function () { return '수만 있는 항을 옮기면서 부호를 바꾸지 않았어요. 등호를 건너는 항은 +는 −로, −는 +로 바뀌어요.'; } };
  var KEEP_X = { id: 'keep-x', wrong: function (p) { var m = p.m; return m.ra ? rat(m.B, m.la + m.ra) : null; },
    explain: function () { return '문자가 있는 항을 옮기면서 부호를 바꾸지 않았어요. 문자가 있는 항도 등호를 건너면 부호가 바뀌어요.'; } };
  eqType({
    id: 'B07.move', title: '이항해서 풀기', kind: 'signed', build: moveBuild,
    levels: [
      { name: '문자가 있는 항을 한쪽으로', vars: { q: sampler(function (r) {
          var x = r.pick(XS), a = nz(r, -9, 9), c = nz(r, -9, 9), k = nz(r, -9, 9);
          return r.int(0, 2) ? { x: x, L: [[a, x]], R: [[c, x], [(a - c) * k, '']] } : { x: x, L: [[a, x], [(c - a) * k, '']], R: [[c, x]] };
        }) }, where: function (p) { return cs(p.q.L.concat(p.q.R)).every(function (t) { return abs(t[0]) <= 60; }); } },
      { name: '양쪽에 문자와 수가 있는 식', vars: { q: sampler(function (r) {
          var x = r.pick(XS), L = [[nz(r, -9, 9), x], [nz(r, -15, 15), '']], R = [[nz(r, -9, 9), x]];
          R.push([fit(L, R, nz(r, -9, 9)), '']);
          return { x: x, L: L, R: r.int(0, 3) ? R : [R[1], R[0]] };
        }) }, where: function (p) { return abs(cs(p.q.R)[0][0]) <= 40; } },
      { name: '항이 여러 개인 식', vars: { q: sampler(function (r) {
          var x = r.pick(XS), L = [[nz(r, -9, 9), x], [nz(r, -12, 12), '']], R = [[nz(r, -9, 9), x]], d;
          if (r.int(0, 1)) L.push([nz(r, -6, 6), x]); else R.push([nz(r, -9, 9), '']);
          if (r.int(0, 2) === 0) R.push([nz(r, -5, 5), x]);
          d = [fit(L, R, nz(r, -9, 9)), ''];
          return { x: x, L: r.shuffle(L), R: r.shuffle(R.concat([d])) };
        }) }, where: function (p) { return p.q.R.every(function (t) { return abs(t[0]) <= 40; }); } }
    ],
    hints: function (p) {
      return [
        '이항은 등식의 성질을 줄여 쓴 것이에요. 양쪽에서 같은 수를 빼면, 한쪽에 있던 항이 사라지고 반대쪽에 부호가 바뀌어 나타나요. 그래서 "항이 등호를 건너면 부호가 바뀐다"고 기억해요. +는 −로, −는 +로요.',
        MOVE_HINT(p.m, p.x), DIVIDE_HINT(p.x)
      ];
    },
    steps: function (p, val) { return linSteps(p.m, p.x, val); },
    mistakes: [KEEP_CONST, KEEP_X, HALF]
  });

  /* ── B07.paren 괄호가 있는 방정식 ──────────────────────
     v.q = { x, L, R } — 양쪽은 항 [계수, 문자] 또는 묶음 ['g', 곱하는 수, [항 …]] 의 목록 */
  var sideTex = function (s) {
    var out = '';
    s.forEach(function (it, i) {
      var c = it[0] === 'g' ? it[1] : it[0], sign = i ? (c < 0 ? ' - ' : ' + ') : (c < 0 ? '-' : '');
      out += sign + (it[0] === 'g' ? (abs(c) === 1 ? '' : abs(c)) + '(' + poly(it[2]) + ')' : body(it));
    });
    return out || '0';
  };
  /** 괄호를 푼다. mode: 'first-only' 첫 항에만 곱함 · 'minus-paren' 음수를 곱할 때 뒤의 항의 부호를 바꾸지 않음 */
  var expand = function (s, mode) {
    var out = [];
    s.forEach(function (it) {
      if (it[0] !== 'g') { out.push(it); return; }
      it[2].forEach(function (t, j) {
        var c = it[1] * t[0];
        if (j > 0 && mode === 'first-only') c = t[0];
        if (j > 0 && mode === 'minus-paren' && it[1] < 0) c = -c;
        out.push([c, t[1]]);
      });
    });
    return out;
  };
  var groups = function (p) { return p.q.L.concat(p.q.R).filter(function (it) { return it[0] === 'g'; }); };
  var parenBuild = function (q) {
    var flat = expand(q.L).concat(expand(q.R));
    if (flat.some(function (t) { return t[0] === 0; })) return null;
    var eL = expand(q.L), eR = expand(q.R), m = lin(eL, eR);
    return m.sol ? { q: q, x: q.x, lhs: sideTex(q.L), rhs: sideTex(q.R), sol: m.sol, m: m, open: poly(eL) + ' = ' + poly(eR) } : null;
  };
  var withMode = function (id, explain, only) {
    return { id: id, wrong: function (p) {
        if (only && !only(p)) return null;
        var m = lin(expand(p.q.L, id), expand(p.q.R, id));
        return m.sol;
      }, explain: explain };
  };
  var FIRST_ONLY = withMode('first-only', function () { return '괄호 안의 첫 항에만 곱했어요. 분배법칙은 괄호 안의 모든 항에 똑같이 곱하는 것이에요. 뒤의 항에도 곱해야 해요.'; });
  var MINUS_PAREN = function (has) { return withMode('minus-paren', function () { return '음수를 곱하면서 뒤의 항의 부호를 바꾸지 않았어요. 괄호 앞이 −이면 괄호 안의 모든 항의 부호가 바뀌어요. 음수 × 음수는 양수예요.'; }, has); };
  var inner = function (r, x, amax) { return [[r.int(0, 2) ? 1 : r.int(2, amax), x], [nz(r, -9, 9), '']]; };
  eqType({
    id: 'B07.paren', title: '괄호가 있는 방정식', kind: 'signed', build: parenBuild,
    levels: [
      { name: '괄호가 하나인 식', vars: { q: sampler(function (r) {
          var x = r.pick(XS), L = [['g', pm(r, r.int(2, 6)), inner(r, x, 3)]];
          return { x: x, L: L, R: [[fit(expand(L), [], nz(r, -9, 9)), '']] };
        }) }, where: function (p) { return abs(p.q.R[0][0]) <= 60; } },
      { name: '괄호를 풀고 이항하기', vars: { q: sampler(function (r) {
          var x = r.pick(XS), L = [['g', pm(r, r.int(2, 5)), inner(r, x, 3)]], R = [], k = nz(r, -9, 9);
          if (r.int(0, 1)) L.push([nz(r, -9, 9), '']); else R.push([nz(r, -6, 6), x]);
          R.push([fit(expand(L), R, k), '']);
          return { x: x, L: L, R: R };
        }) }, where: function (p) { return abs(cs(p.q.R)[0][0]) <= 50; } },
      { name: '괄호가 두 개인 식', vars: { q: sampler(function (r) {
          var x = r.pick(XS), g1 = ['g', r.int(2, 5), inner(r, x, 3)], g2 = ['g', r.int(2, 5), inner(r, x, 3)], L, R;
          if (r.int(0, 2) === 0) return { x: x, L: [g1], R: [g2] };
          g2[1] = r.int(0, 2) ? -g2[1] : g2[1]; L = [g1, g2]; R = [[fit(expand(L), [], nz(r, -9, 9)), '']];
          return { x: x, L: L, R: R };
        }) }, where: function (p) { return p.q.R[0][0] === 'g' || abs(p.q.R[0][0]) <= 60; } }
    ],
    hints: function (p) {
      var ms = groups(p).map(function (g) { return '$' + g[1] + '$'; });
      return [
        '괄호가 있으면 가장 먼저 괄호를 풀어요. 괄호 앞의 수를 괄호 안의 모든 항에 곱해요(분배법칙). 물건이 든 꾸러미를 여러 개 사면 꾸러미 안의 물건이 모두 그만큼 늘어나는 것과 같아요.',
        '① 괄호 풀기. 이 식에서 괄호에 곱해진 수: ' + ms.join(', ') + '. 첫 항에만 곱하지 말고 뒤의 항에도 곱해요. 곱하는 수가 음수이면 괄호 안의 모든 항의 부호가 바뀌어요(음수 × 음수 = 양수).',
        '② 괄호를 풀었으면 문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요. 등호를 건너는 항은 부호가 바뀌어요. ③ 양쪽을 각각 계산한 다음, $' + p.x + '$ 앞의 수로 양쪽을 나눠요.'
      ];
    },
    steps: function (p, val) {
      return [{ say: '분배법칙으로 괄호를 풀어요. 괄호 안의 모든 항에 곱해요.', tex: p.open }].concat(linSteps(p.m, p.x, val));
    },
    mistakes: [FIRST_ONLY, MINUS_PAREN(function (p) { return groups(p).some(function (g) { return g[1] < 0; }); }), HALF]
  });

  /* ── B07.frac 계수가 소수 · 분수인 방정식 ──────────────
     v.q = { k, x, L, R, … }
       dec  { p }  항의 계수는 10^p 을 곱한 정수(3 → 0.3)
       fr          양쪽은 항 [계수, 문자] 또는 분수 ['f', 부호, [분자의 항 …], 분모] 의 목록
       sol         계수가 정수이고 해가 분수인 식 */
  var decSide = function (s, p) {
    var out = '';
    s.forEach(function (t, i) {
      var str = MH.decStr(abs(t[0]), p);
      out += (i ? (t[0] < 0 ? ' - ' : ' + ') : (t[0] < 0 ? '-' : '')) + (str === '1' && t[1] ? '' : str) + t[1];
    });
    return out;
  };
  var fracSide = function (s) {
    var out = '';
    s.forEach(function (it, i) {
      var c = it[0] === 'f' ? it[1] : it[0], sign = i ? (c < 0 ? ' - ' : ' + ') : (c < 0 ? '-' : '');
      out += sign + (it[0] === 'f' ? '\\dfrac{' + poly(it[2]) + '}{' + it[3] + '}' : body(it));
    });
    return out || '0';
  };
  /** 양쪽에 n 을 곱한 모습(분자가 여러 항이면 괄호로 묶는다). mode 'int' 이면 정수 항에는 곱하지 않는다 */
  var times = function (s, n, mode) {
    return s.map(function (it) {
      if (it[0] !== 'f') return [mode === 'int' ? it[0] : it[0] * n, it[1]];
      var k = it[1] * n / it[3];
      return it[2].length === 1 ? [k * it[2][0][0], it[2][0][1]] : ['g', k, it[2]];
    });
  };
  var flatOne = function (s) { var out = []; s.forEach(function (it) { if (it[0] === 'g' && it[1] === 1) it[2].forEach(function (t) { out.push(t); }); else out.push(it); }); return out; };
  var fracBuild = function (q) {
    var x = q.x, m, n, L, R, base = { q: q, x: x };
    if (q.k === 'sol') {
      if (q.L.concat(q.R).some(function (t) { return t[0] === 0; })) return null;
      m = lin(q.L, q.R); if (!m.sol) return null;
      base.lhs = poly(q.L); base.rhs = poly(q.R);
    } else if (q.k === 'dec') {
      if (q.L.concat(q.R).some(function (t) { return t[0] === 0; })) return null;
      n = MH.pow10(q.p); m = lin(q.L, q.R); if (!m.sol) return null;
      base.lhs = decSide(q.L, q.p); base.rhs = decSide(q.R, q.p); base.n = n; base.scaled = poly(q.L) + ' = ' + poly(q.R);
      base.ints = q.L.concat(q.R).filter(function (t) { return t[0] % n === 0; }).length;
      base.intSol = lin(q.L.map(function (t) { return t[0] % n === 0 ? [t[0] / n, t[1]] : t; }), q.R.map(function (t) { return t[0] % n === 0 ? [t[0] / n, t[1]] : t; })).sol;
    } else {
      var all = q.L.concat(q.R), dens = all.filter(function (it) { return it[0] === 'f'; }).map(function (it) { return it[3]; });
      if (all.some(function (it) { return it[0] === 'f' ? it[2].some(function (t) { return t[0] === 0; }) : it[0] === 0; })) return null;
      n = dens.reduce(function (a, d) { return lcm(a, d); }, 1);
      L = flatOne(times(q.L, n)); R = flatOne(times(q.R, n)); m = lin(expand(L), expand(R)); if (!m.sol) return null;
      base.lhs = fracSide(q.L); base.rhs = fracSide(q.R); base.n = n; base.scaled = sideTex(L) + ' = ' + sideTex(R);
      base.dens = dens.filter(function (d, i) { return dens.indexOf(d) === i; }).sort(function (a, b) { return a - b; });
      base.hasGroup = L.concat(R).some(function (it) { return it[0] === 'g'; }); base.open = poly(expand(L)) + ' = ' + poly(expand(R));
      base.ints = all.filter(function (it) { return it[0] !== 'f'; }).length;
      base.intSol = lin(expand(flatOne(times(q.L, n, 'int'))), expand(flatOne(times(q.R, n, 'int')))).sol;
      base.minusSol = lin(expand(L, 'minus-paren'), expand(R, 'minus-paren')).sol;
      base.minus = L.concat(R).some(function (it) { return it[0] === 'g' && it[1] < 0; });
      base.numer = all.some(function (it) { return it[0] === 'f' && it[2].length > 1; });
    }
    base.sol = m.sol; base.m = m;
    return base;
  };
  /* 분수 계산(문제를 만들 때 해를 넣어 상수항을 맞춘다) */
  var radd = function (a, b) { return rat(a.n * b.d + b.n * a.d, a.d * b.d); };
  var at = function (s, k) {
    return s.reduce(function (acc, it) {
      var v = it[0] === 'f' ? rat(it[1] * it[2].reduce(function (t, y) { return t + y[0] * (y[1] ? k : 1); }, 0), it[3]) : rat(it[0] * (it[1] ? k : 1), 1);
      return radd(acc, v);
    }, rat(0, 1));
  };
  var DEN_PAIRS = [[2, 3], [2, 4], [3, 4], [2, 5], [3, 6], [2, 6], [4, 6], [3, 5]];
  var isInt = function (p) { return p.sol.d === 1; };
  eqType({
    id: 'B07.frac', title: '계수가 소수 · 분수인 방정식', kind: 'rational', build: fracBuild,
    levels: [
      { name: '계수가 소수인 식', vars: { q: sampler(function (r) {
          var x = r.pick(XS), p = r.int(0, 3) ? 1 : 2, unit = p === 1 ? 1 : 5, n = MH.pow10(p), L, R = [];
          L = [[pm(r, unit * r.int(1, 9)), x], [r.int(0, 2) ? pm(r, unit * r.int(1, 15)) : pm(r, n * r.int(1, 3)), '']];
          if (r.int(0, 1)) R.push([pm(r, unit * r.int(1, 9)), x]);
          R.push([fit(L, R, nz(r, -9, 9)), '']);
          return { k: 'dec', x: x, p: p, L: L, R: R };
        }) }, where: function (p) { var q = p.q, n = p.n; return isInt(p) && abs(cs(q.R)[0][0]) <= 60 * n / 10 && xs(q.L)[0][0] % n !== 0 && (q.p === 1 || q.L.concat(q.R).some(function (t) { return t[0] % 10 !== 0; })); } },
      { name: '계수가 분수인 식', vars: { q: sampler(function (r) {
          var x = r.pick(XS), d = r.shuffle(r.pick(DEN_PAIRS).slice()), k = nz(r, -12, 12), L, R = [], rest;
          var xf = function (den) { return ['f', pm(r, 1), [[den > 2 && r.int(0, 2) === 0 ? den - 1 : 1, x]], den]; };
          L = [xf(d[0])]; L[0][1] = 1;
          if (r.int(0, 1)) L.push(r.int(0, 1) ? [nz(r, -6, 6), ''] : ['f', pm(r, 1), [[1, '']], d[1]]);
          if (r.int(0, 1) || L.length === 1) R.push(xf(d[1]));
          rest = radd(at(L, k), rat(-at(R, k).n, at(R, k).d));
          R.push(rest.d === 1 ? [rest.n, ''] : ['f', rest.n < 0 ? -1 : 1, [[abs(rest.n), '']], rest.d]);
          if (R[0][0] === 'f' && R[0][1] < 0) R.reverse();
          return { k: 'fr', x: x, L: L, R: R };
        }) }, where: function (p) {
          return isInt(p) && p.n <= 30 && p.q.R.every(function (it) { return it[0] === 'f' ? it[3] <= 6 && abs(it[2][0][0]) <= 9 : abs(it[0]) <= 12; });
        } },
      { name: '분자가 식인 방정식', vars: { q: sampler(function (r) {
          var x = r.pick(XS), d = r.shuffle(r.pick(DEN_PAIRS).slice()), k = nz(r, -9, 9), a = r.int(1, 3), c = r.int(1, 3), t1 = nz(r, -4, 4), t2 = nz(r, -4, 4);
          var f1 = ['f', 1, [[a, x], [d[0] * t1 - a * k, '']], d[0]], f2 = ['f', 1, [[c, x], [d[1] * t2 - c * k, '']], d[1]], n;
          if (r.int(0, 1)) { f2[1] = pm(r, 1); n = t1 + f2[1] * t2; return { k: 'fr', x: x, L: [f1, f2], R: n ? [[n, '']] : [] }; }
          n = t1 - t2;
          return { k: 'fr', x: x, L: [f1], R: n && r.int(0, 2) ? [f2, [n, '']] : [f2] };
        }) }, where: function (p) {
          return isInt(p) && p.numer && p.q.L.concat(p.q.R).every(function (it) { return it[0] !== 'f' || abs(it[2][1][0]) <= 9; });
        } },
      { name: '해가 분수인 방정식', max: 40, vars: { q: sampler(function (r) {
          var x = r.pick(XS);
          return { k: 'sol', x: x, L: [[nz(r, -9, 9), x], [nz(r, -12, 12), '']], R: r.int(0, 2) ? [[nz(r, -9, 9), x], [nz(r, -12, 12), '']] : [[nz(r, -15, 15), '']] };
        }) }, where: function (p) { return p.sol.d !== 1 && abs(p.m.A) <= 9; } }
    ],
    hints: function (p) {
      var q = p.q, x = p.x, second, third;
      if (q.k === 'sol') return [
        '이 방정식은 해가 정수로 떨어지지 않아요. 그래도 푸는 방법은 똑같아요. 이항해서 (수) × $' + x + '$ = (수) 꼴로 만든 다음, 마지막 나눗셈의 결과를 분수로 쓰면 돼요.',
        MOVE_HINT(p.m, x),
        '② 양쪽을 각각 계산해요. ③ 양쪽을 $' + x + '$ 앞의 수로 나누면, 해는 (오른쪽 수)를 분자로, ($' + x + '$ 앞의 수)를 분모로 하는 분수예요. 분자 칸과 분모 칸에 따로 쓰고, 약분할 수 있으면 약분해요. 음수이면 − 키를 눌러요.'
      ];
      if (q.k === 'dec') {
        second = '소수점 아래 자리가 가장 긴 수에 맞춰요. 이 식에는 소수점 아래 ' + (q.p === 1 ? '한' : '두') + ' 자리까지 있으니 양쪽에 ' + p.n + '을 곱해요. 그러면 모든 수의 소수점이 오른쪽으로 ' + (q.p === 1 ? '한' : '두') + ' 칸씩 움직여서 정수가 돼요.';
        third = '곱할 때는 양쪽의 모든 항에 빠짐없이 곱해요. 소수가 아닌 정수 항이 있으면 그 항에도 똑같이 곱해야 저울이 기울지 않아요. 그다음은 앞에서 한 대로 ① 이항 ② 양쪽 계산 ③ $' + x + '$ 앞의 수로 나누기예요.';
      } else {
        second = '분모를 없애려면 ' + (p.dens.length > 1 ? '분모들의 최소공배수를 양쪽에 곱해요. 이 식의 분모는 ' + p.dens.join(', ') + '이고 최소공배수는 ' + josa(String(p.n), '이에요/예요') + '.' : '분모와 같은 수를 양쪽에 곱해요. 이 식의 분모는 ' + josa(String(p.n), '이에요/예요') + '.') + ' 양쪽의 모든 항에 ' + josa(String(p.n), '을/를') + ' 곱하면 분모가 약분되어 사라져요.';
        third = p.numer ? '분자가 여러 항이면 괄호로 묶어서 곱해요. 분수 앞에 −가 있으면 괄호를 풀 때 안의 모든 항의 부호가 바뀌어요. 분수가 아닌 정수 항에도 똑같이 곱하는 것을 잊지 마세요. 그다음은 ① 괄호 풀기 ② 이항 ③ $' + x + '$ 앞의 수로 나누기예요.'
          : '분수가 아닌 정수 항에도 똑같이 곱해야 해요. 가장 흔한 실수예요. 곱하고 나면 계수가 모두 정수가 되니, 앞에서 한 대로 ① 이항 ② 양쪽 계산 ③ $' + x + '$ 앞의 수로 나누기를 하면 돼요.';
      }
      return ['계수가 분수나 소수이면 계산이 번거로워요. 등식은 양쪽에 같은 수를 곱해도 성립하니까, 먼저 양쪽에 알맞은 수를 곱해서 모든 계수를 정수로 바꿔요. 그러면 앞에서 푼 방정식과 똑같아져요.', second, third];
    },
    steps: function (p, val) {
      var q = p.q, out = [];
      if (q.k === 'dec') out.push({ say: '양쪽의 모든 항에 ' + josa(String(p.n), '을/를') + ' 곱해서 계수를 정수로 바꿔요.', tex: p.scaled });
      if (q.k === 'fr') {
        out.push({ say: (p.dens.length > 1 ? '분모의 최소공배수 ' : '분모 ') + josa(String(p.n), '을/를') + ' 양쪽의 모든 항에 곱해요.' + (p.hasGroup ? ' 분자가 여러 항이면 괄호로 묶어요.' : ''), tex: p.scaled });
        if (p.hasGroup) out.push({ say: '괄호를 풀어요. 음수를 곱하면 괄호 안의 모든 항의 부호가 바뀌어요.', tex: p.open });
      }
      return out.concat(linSteps(p.m, p.x, val));
    },
    mistakes: [
      { id: 'int-not-multiplied', wrong: function (p) { return p.ints && p.intSol ? p.intSol : null; },
        explain: function (p) { return '정수 항에는 곱하지 않았어요. 양쪽에 ' + josa(String(p.n), '을/를') + ' 곱할 때는 분수나 소수가 아닌 항에도 똑같이 곱해야 해요. 한 항이라도 빠뜨리면 저울이 기울어요.'; } },
      { id: 'minus-paren', wrong: function (p) { return p.minus ? p.minusSol : null; },
        explain: function () { return '분수 앞의 −를 분자의 첫 항에만 적용했어요. 분자가 여러 항이면 괄호로 묶어서 곱하고, 괄호 앞이 −이면 안의 모든 항의 부호가 바뀌어요.'; } },
      { id: 'flipped', wrong: function (p) { return p.q.k === 'sol' ? rat(p.m.A, p.m.B) : null; },
        explain: function (p) { return '분자와 분모가 바뀌었어요. (수) × $' + p.x + '$ = (수) 꼴에서 해는 오른쪽 수를 $' + p.x + '$ 앞의 수로 나눈 것이에요. 오른쪽 수가 분자, 문자 앞의 수가 분모예요.'; } },
      KEEP_CONST, HALF
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B07', [
  { title: '등식, 방정식, 해', body: [
    '등호(=)로 양쪽이 같다고 쓴 식을 "등식"이라고 해요. 그 가운데 문자에 넣는 수에 따라 참이 되기도 하고 거짓이 되기도 하는 등식을 "방정식"이라고 해요.',
    { tex: '2x + 1 = 7' },
    { ex: [['x = 2', '2 × 2 + 1 = 5 → 거짓'], ['x = 3', '2 × 3 + 1 = 7 → 참']] },
    '방정식을 참이 되게 하는 문자의 값을 "해"라고 해요. 위 방정식의 해는 $x = 3$이에요. 해를 구하는 것을 "방정식을 푼다"고 해요.'
  ] },
  { title: '등식의 성질 — 양팔 저울', body: [
    '등식은 평형을 이룬 양팔 저울과 같아요. 양쪽에 똑같은 일을 하면 평형이 그대로예요.',
    { list: ['양쪽에 같은 수를 더해도 등식이에요.', '양쪽에서 같은 수를 빼도 등식이에요.', '양쪽에 같은 수를 곱해도 등식이에요.', '양쪽을 0이 아닌 같은 수로 나눠도 등식이에요.'] },
    { ex: [['x + 3 = 5', '양쪽에서 3을 빼면 x = 2'], ['3x = 12', '양쪽을 3으로 나누면 x = 4'], ['\\dfrac{x}{3} = 4', '양쪽에 3을 곱하면 x = 12']] },
    '더해진 수는 빼서, 곱해진 수는 나눠서 없애요. 반대 계산으로 문자만 남기는 것이에요.'
  ] },
  { title: '이항 — 등호를 건너면 부호가 바뀌어요', body: [
    '양쪽에서 같은 수를 빼면, 그 항이 반대쪽으로 부호가 바뀌어 옮겨 간 것처럼 보여요. 이것을 "이항"이라고 해요.',
    { tex: '\\begin{aligned} 3x + 5 &= 11 \\\\ 3x &= 11 - 5 \\end{aligned}' },
    { ex: [['+5', '건너가면 −5'], ['-5', '건너가면 +5'], ['+2x', '건너가면 −2x']] },
    '부호가 바뀌는 것은 등호를 건넌 항뿐이에요. 제자리에 있는 항은 그대로 둬요.'
  ] },
  { title: '일차방정식을 푸는 순서', body: [
    { list: ['① 문자가 있는 항은 왼쪽, 수만 있는 항은 오른쪽으로 이항해요.', '② 양쪽을 각각 계산해서 (수) × x = (수) 꼴로 만들어요.', '③ 양쪽을 x 앞의 수로 나눠요.'] },
    { tex: '\\begin{aligned} 5x + 3 &= 2x + 9 \\\\ 5x - 2x &= 9 - 3 \\\\ 3x &= 6 \\\\ x &= 2 \\end{aligned}' },
    '구한 해를 처음 식에 넣어 보면 맞았는지 확인할 수 있어요. 왼쪽은 5 × 2 + 3 = 13, 오른쪽은 2 × 2 + 9 = 13으로 같아요.'
  ] },
  { title: '괄호가 있으면 괄호부터', body: [
    '괄호가 있으면 분배법칙으로 괄호를 먼저 풀어요. 괄호 안의 모든 항에 곱해요.',
    { tex: '\\begin{aligned} 3(x - 2) &= x + 4 \\\\ 3x - 6 &= x + 4 \\\\ 3x - x &= 4 + 6 \\\\ 2x &= 10 \\\\ x &= 5 \\end{aligned}' },
    '괄호 앞이 음수이면 괄호 안의 모든 항의 부호가 바뀌어요. $-2(x - 3)$은 $-2x + 6$이에요.'
  ] },
  { title: '계수가 소수 · 분수이면 정수로 바꿔요', body: [
    '양쪽에 같은 수를 곱해서 계수를 정수로 만들면 쉬워져요. 소수는 10이나 100을, 분수는 분모의 최소공배수를 곱해요.',
    { tex: '\\begin{aligned} 0.3x + 0.5 &= 2 \\\\ 3x + 5 &= 20 \\end{aligned}' },
    { tex: '\\begin{aligned} \\dfrac{x}{2} - 1 &= \\dfrac{x}{3} \\\\ 3x - 6 &= 2x \\end{aligned}' },
    '모든 항에 빠짐없이 곱해요. 정수 항(위의 2와 1)에도 곱해야 해요. 가장 흔한 실수예요.'
  ] }
]);
