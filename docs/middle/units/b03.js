/* B03 정수와 유리수의 덧셈·뺄셈 — 부호가 다른 수의 덧셈, 뺄셈을 덧셈으로
   유형(쉬운 것부터): B03.same 부호가 같은 두 수의 덧셈 · B03.diff 부호가 다른 두 수의 덧셈 · B03.sub 뺄셈
                     · B03.frac 분수의 덧셈과 뺄셈 · B03.mixed 덧셈과 뺄셈이 섞인 식
   정수 · 소수는 10^p 배 한 정수(부호 포함)로 다룬다: p 가 1 이면 -15 는 −1.5. 답 형식은 signed, 분수는 rational.
   힌트는 수직선 위의 이동(+ 는 오른쪽, − 는 왼쪽)과 차례(① ② ③)로 풀어 쓴다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F;
  var S = function (n, p) { return { n: n, p: p || 0 }; };
  var abs = Math.abs;
  /** 크기만: D(-15, 1) → '1.5' */
  var D = function (n, p) { return MH.decStr(abs(n), p || 0); };
  /** 부호가 있는 수를 글로: str(-15, 1) → '−1.5', str(7, 0, true) → '+7' */
  var str = function (n, p, plus) { return (n < 0 ? '−' : n > 0 && plus ? '+' : '') + D(n, p); };
  var stex = function (n, p, plus) { return str(n, p, plus).replace('−', '-'); };
  /** 괄호에 넣은 수: 수식 (+3), 글 (+3) */
  var par = function (n, p) { return '(' + stex(n, p, true) + ')'; };
  var parT = function (n, p) { return '(' + str(n, p, true) + ')'; };
  /** 괄호에 넣은 수 뒤에 조사를 붙인다(괄호 안의 수를 읽은 소리에 맞춘다): pj(-4, 0, '을/를') → '(−4)를' */
  var pj = function (n, p, pair) { var w = str(n, p, true); return '(' + w + ')' + josa(w, pair).slice(w.length); };
  var side = function (n) { return n < 0 ? '왼쪽' : '오른쪽'; };
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var notTen = function (lo, hi) { return sampler(function (r) { var x; do { x = r.int(lo, hi); } while (x % 10 === 0); return x; }); };

  /* ── 두 수의 덧셈 a + b 의 풀이와 힌트 (B03.same · B03.diff · B03.sub 공통) ── */
  function addSteps(a, b, p) {
    var x = D(a, p), y = D(b, p), sum = a + b;
    if (a * b > 0) return [
      { say: '두 수의 부호가 같아요. 부호를 떼고 두 수를 더해요.', tex: x + ' + ' + y + ' = ' + D(sum, p) },
      { say: '두 수가 함께 가진 부호 ' + (a < 0 ? '−' : '+') + '를 붙여요. 답은 ' + josa(str(sum, p), '이에요/예요') + '.', tex: par(a, p) + ' + ' + par(b, p) + ' = ' + stex(sum, p), value: S(sum, p) }
    ];
    if (sum === 0) return [
      { say: '두 수의 부호가 다르고, 부호를 뗀 크기(절댓값)는 ' + josa(x, '으로/로') + ' 같아요.' },
      { say: x + '만큼 갔다가 똑같이 ' + x + '만큼 되돌아오니 0이에요.', tex: par(a, p) + ' + ' + par(b, p) + ' = 0', value: S(0, 0) }
    ];
    var big = abs(a) > abs(b) ? a : b, small = abs(a) > abs(b) ? b : a;
    return [
      { say: '두 수의 부호가 달라요. 부호를 뗀 크기(절댓값)가 큰 쪽에서 작은 쪽을 빼요.', tex: D(big, p) + ' - ' + D(small, p) + ' = ' + D(sum, p) },
      { say: '답의 부호는 절댓값이 큰 수 ' + str(big, p, true) + '의 부호 ' + (big < 0 ? '−' : '+') + '를 따라요. 답은 ' + josa(str(sum, p), '이에요/예요') + '.', tex: par(a, p) + ' + ' + par(b, p) + ' = ' + stex(sum, p), value: S(sum, p) }
    ];
  }
  /** 수직선 위에서 a 만큼, 이어서 b 만큼 가는 이야기 */
  function walk(a, b, p) {
    /* 답이 0 인 문제에서는 힌트에 0 을 쓰지 않는다(답을 말하는 셈이 된다) */
    var first = (a + b === 0 ? '출발점에 서 있다가 ' : '0에서 출발해서 ') + side(a) + '으로 ' + D(a, p) + '만큼 간 다음, ';
    return a * b > 0 ? first + '같은 ' + side(b) + '으로 ' + D(b, p) + '만큼 더 가요. 같은 쪽으로 두 번 가니까 0에서 더 멀어져요.'
      : first + '방향을 바꿔 ' + side(b) + '으로 ' + D(b, p) + '만큼 가요. 서로 반대쪽으로 가니까 간 거리가 서로 깎여요.';
  }
  /** 덧셈 규칙을 차례로 풀어 쓴 힌트 두 개(규칙 · 이 문제에 맞춘 마지막 한 걸음). 답의 숫자는 말하지 않는다. */
  function ruleHints(a, b, p) {
    var x = D(a, p), y = D(b, p);
    if (a * b > 0) return [
      '부호가 같은 두 수의 덧셈은 이렇게 해요. ① 부호를 떼고 두 수를 더해요: ' + x + ' + ' + y + '. ② 그 앞에 두 수가 함께 가진 부호 ' + (a < 0 ? '−' : '+') + '를 붙여요.',
      a < 0 ? '빚이 ' + x + '만큼 있는데 빚이 ' + y + '만큼 더 생긴 것과 같아요. 빚끼리 모이면 빚이 더 커져요. 그래서 답은 음수이고, 숫자는 ' + x + ' + ' + josa(y, '을/를') + ' 계산한 값이에요.'
        : '둘 다 양수이면 초등학교에서 하던 덧셈과 똑같아요. 답도 양수이고, 숫자는 ' + x + ' + ' + josa(y, '을/를') + ' 계산한 값이에요.'
    ];
    var big = abs(a) >= abs(b) ? a : b, small = abs(a) >= abs(b) ? b : a;
    return [
      '부호가 다른 두 수의 덧셈은 이렇게 해요. ① 부호를 떼고 두 수의 크기(절댓값)를 비교해요: ' + josa(x, '과/와') + ' ' + y + '. ② 큰 쪽에서 작은 쪽을 빼요. ③ 답의 부호는 절댓값이 큰 수의 부호를 따라요.',
      a + b === 0 ? '두 수의 절댓값이 ' + josa(x, '으로/로') + ' 같아요. ' + side(a) + '으로 간 만큼 ' + side(b) + '으로 되돌아오면 어디에 서 있게 될까요?'
        : '절댓값이 큰 수는 ' + josa(str(big, p, true), '이에요/예요') + '(' + side(big) + '으로 더 많이 갔어요). 그래서 답의 부호는 ' + (big < 0 ? '−' : '+') + '이고, 숫자는 ' + D(big, p) + ' − ' + josa(D(small, p), '을/를') + ' 계산한 값이에요.'
    ];
  }
  var signedAnswer = { kind: 'signed', decimal: true };
  /** 단계 셋: 한 자리 정수 → 두 자리 정수 → 소수 */
  var sizes = function (make, where) {
    return [
      { name: '한 자리 수', minDistinct: 60, vars: make(0, int(1, 9), int(1, 9)), where: where },
      { name: '두 자리 수', vars: make(0, int(10, 60), int(2, 60)), where: where },
      { name: '소수', vars: make(1, notTen(1, 99), notTen(1, 99)), where: where }
    ];
  };

  /* ── B03.same 부호가 같은 두 수의 덧셈 ───────────────── */
  var A = function (v) { return v.sa * v.x; }, B = function (v) { return v.sb * v.y; };
  MH.defineType({
    id: 'B03.same', unit: 'B03', version: 1, title: '부호가 같은 두 수의 덧셈',
    answer: signedAnswer,
    levels: sizes(function (p, x, y) { return { p: p, sa: pick([-1, -1, -1, 1]), sb: function (v) { return v.sa; }, x: x, y: y }; }),
    prompt: function (v) { return { tex: par(A(v), v.p) + ' + ' + par(B(v), v.p), text: '계산하세요.' }; },
    solve: function (v) { return S(A(v) + B(v), v.p); },
    /* 검산: 답에서 뒤의 수를 빼면 앞의 수 */
    verify: function (v, ans) { return ans.p === v.p && ans.n - B(v) === A(v); },
    hints: function (v) { return ['수직선에서 생각해 보세요. +는 오른쪽으로, −는 왼쪽으로 가는 거예요. ' + walk(A(v), B(v), v.p)].concat(ruleHints(A(v), B(v), v.p)); },
    steps: function (v) { return addSteps(A(v), B(v), v.p); },
    /* ① 절댓값끼리 뺌 ② 음수끼리 더했는데 부호를 안 붙임 */
    mistakes: [
      { id: 'subtracted', wrong: function (v) { return v.x !== v.y ? S(v.sa * abs(v.x - v.y), v.p) : null; },
        explain: function (v) { return '두 수의 크기를 서로 뺐어요. 부호가 같으면 같은 쪽으로 두 번 가는 것이라서, 빼지 않고 더해요: ' + D(v.x, v.p) + ' + ' + D(v.y, v.p) + '.'; } },
      { id: 'lost-sign', wrong: function (v) { return v.sa < 0 ? S(v.x + v.y, v.p) : null; },
        explain: function () { return '숫자는 맞았어요. 그런데 두 수가 모두 음수라서 답도 음수예요. 앞에 −를 붙여요.'; } },
      { id: 'made-negative', wrong: function (v) { return v.sa > 0 ? S(-(v.x + v.y), v.p) : null; },
        explain: function () { return '숫자는 맞았어요. 그런데 두 수가 모두 양수라서 답도 양수예요. −를 붙이지 않아요.'; } }
    ]
  });

  /* ── B03.diff 부호가 다른 두 수의 덧셈 ───────────────── */
  MH.defineType({
    id: 'B03.diff', unit: 'B03', version: 1, title: '부호가 다른 두 수의 덧셈',
    answer: signedAnswer,
    levels: sizes(function (p, x, y) { return { p: p, sa: pick([-1, 1]), sb: function (v) { return -v.sa; }, x: x, y: y }; }),
    prompt: function (v) { return { tex: par(A(v), v.p) + ' + ' + par(B(v), v.p), text: '계산하세요.' }; },
    solve: function (v) { return S(A(v) + B(v), v.p); },
    verify: function (v, ans) { return ans.p === v.p && ans.n - B(v) === A(v); },
    hints: function (v) { return ['수직선에서 생각해 보세요. +는 오른쪽으로, −는 왼쪽으로 가는 거예요. ' + walk(A(v), B(v), v.p)].concat(ruleHints(A(v), B(v), v.p)); },
    steps: function (v) { return addSteps(A(v), B(v), v.p); },
    /* ① 절댓값을 더함(부호는 큰 쪽 · 작은 쪽) ② 숫자는 맞는데 부호가 반대 */
    mistakes: [
      { id: 'added', wrong: function (v) { return S((abs(A(v)) >= abs(B(v)) ? v.sa : v.sb) * (v.x + v.y), v.p); },
        explain: function (v) { return '두 수의 크기를 더했어요. 부호가 다르면 서로 반대쪽으로 가는 것이라서, 더하지 않고 큰 쪽에서 작은 쪽을 빼요: ' + D(Math.max(v.x, v.y), v.p) + ' − ' + D(Math.min(v.x, v.y), v.p) + '.'; } },
      { id: 'added-other', wrong: function (v) { return S((abs(A(v)) >= abs(B(v)) ? v.sb : v.sa) * (v.x + v.y), v.p); },
        explain: function (v) { return '두 수의 크기를 더했어요. 부호가 다르면 더하지 않고 큰 쪽에서 작은 쪽을 빼요: ' + D(Math.max(v.x, v.y), v.p) + ' − ' + D(Math.min(v.x, v.y), v.p) + '. 부호는 절댓값이 큰 수를 따라요.'; } },
      { id: 'wrong-sign', wrong: function (v) { return S(-(A(v) + B(v)), v.p); },
        explain: function (v) { var big = abs(A(v)) > abs(B(v)) ? A(v) : B(v); return '숫자는 맞았어요. 부호는 절댓값이 큰 수 ' + str(big, v.p, true) + '의 부호를 따라서 ' + (big < 0 ? '−' : '+') + '예요.'; } }
    ]
  });

  /* ── B03.sub 뺄셈 ──────────────────────────────────────
     a − b 를 a + (−b) 로 바꿔서 계산한다 */
  MH.defineType({
    id: 'B03.sub', unit: 'B03', version: 1, title: '뺄셈을 덧셈으로',
    answer: signedAnswer,
    levels: sizes(function (p, x, y) { return { p: p, sa: pick([-1, 1]), sb: pick([-1, 1]), x: x, y: y }; }, function (v) { return !(v.sa > 0 && v.sb > 0 && v.x > v.y); }),
    prompt: function (v) { return { tex: par(A(v), v.p) + ' - ' + par(B(v), v.p), text: '계산하세요.' }; },
    solve: function (v) { return S(A(v) - B(v), v.p); },
    /* 검산: 답에 빼는 수를 더하면 앞의 수 */
    verify: function (v, ans) { return ans.p === v.p && ans.n + B(v) === A(v); },
    hints: function (v) {
      var a = A(v), b = B(v), p = v.p;
      return [
        '뺄셈은 그대로 하지 말고 덧셈으로 바꿔서 해요. 어떤 수를 빼는 것은, 그 수의 부호를 바꾼 수를 더하는 것과 같아요. 빚을 없애 주는 것은 그만큼 돈을 주는 것과 같고, 가진 돈을 빼앗는 것은 그만큼 빚을 얹어 주는 것과 같아요.',
        '바꾸는 곳은 두 군데예요. ① 가운데 −를 +로 바꿔요. ② 빼는 수 ' + parT(b, p) + '의 부호를 반대로 바꿔 ' + pj(-b, p, '으로/로') + ' 써요. 앞의 수 ' + pj(a, p, '은/는') + ' 그대로 둬요.',
        '바꾸면 $' + par(a, p) + ' + ' + par(-b, p) + '$ 가 돼요. 이제 덧셈이에요.'
      ].concat(ruleHints(a, -b, p));
    },
    steps: function (v) {
      var a = A(v), b = B(v), p = v.p;
      return [{ say: '뺄셈을 덧셈으로 바꿔요. 가운데 −를 +로, 빼는 수 ' + parT(b, p) + '의 부호를 반대로 바꿔요.', tex: par(a, p) + ' - ' + par(b, p) + ' = ' + par(a, p) + ' + ' + par(-b, p) }].concat(addSteps(a, -b, p));
    },
    /* ① 빼는 수의 부호를 안 바꾸고 더함 ② 숫자는 맞는데 부호가 반대(순서를 바꿔 뺌) */
    mistakes: [
      { id: 'not-flipped', wrong: function (v) { return S(A(v) + B(v), v.p); },
        explain: function (v) { return '가운데 −만 +로 바꾸고, 빼는 수의 부호는 그대로 뒀어요. ' + parT(B(v), v.p) + '의 부호도 반대로 바꿔서 ' + parT(A(v), v.p) + ' + ' + pj(-B(v), v.p, '으로/로') + ' 계산해야 해요.'; } },
      { id: 'wrong-sign', wrong: function (v) { return S(B(v) - A(v), v.p); },
        explain: function (v) { return '숫자는 맞았어요. 그런데 부호가 반대예요. 덧셈으로 바꾼 식 ' + parT(A(v), v.p) + ' + ' + parT(-B(v), v.p) + '에서 답의 부호를 다시 정해 보세요.'; } }
    ]
  });

  /* ── B03.frac 분수의 덧셈과 뺄셈 ───────────────────────
     v.q = { a: [분자(부호 포함), 분모], b: [분자, 분모], op: '+' | '-' } */
  var ftex = function (n, d) { return (n < 0 ? '-' : '') + '\\dfrac{' + abs(n) + '}{' + d + '}'; };
  var fpar = function (x) { return '\\left(' + (x[0] > 0 ? '+' : '') + ftex(x[0], x[1]) + '\\right)'; };
  var small = function (n, d, plus) { return (n < 0 ? '-' : plus ? '+' : '') + '\\frac{' + abs(n) + '}{' + d + '}'; };
  /** 덧셈으로 바꾼 뒤 통분한 모습: { b2: 뒤의 수(뺄셈이면 부호를 바꾼 것), L: 공통분모, A, B: 분자(부호 포함) } */
  var common = function (q) {
    var b2 = [q.op === '-' ? -q.b[0] : q.b[0], q.b[1]], L = MH.lcm(q.a[1], q.b[1]);
    return { b2: b2, L: L, A: q.a[0] * L / q.a[1], B: b2[0] * L / b2[1] };
  };
  var fracValue = function (q) { var c = common(q), f = F(c.A + c.B, c.L); return { n: Number(f.s) * Number(f.n), d: Number(f.d) }; };
  var fracPair = function (dens) {
    return sampler(function (r) {
      var d = dens(r), one = function (den) { var n; do { n = r.int(1, den - 1); } while (MH.gcd(n, den) > 1); return [r.pick([-1, 1]) * n, den]; };
      return { a: one(d[0]), b: one(d[1]), op: d[2] };
    });
  };
  var fracOk = function (v) {
    var q = v.q, c = common(q), ans = fracValue(q);
    return ans.d > 1 && !(q.a[0] > 0 && c.B > 0) && c.L <= 36;                        /* 답이 정수가 아니고, 음수가 한 번은 나온다 */
  };
  MH.defineType({
    id: 'B03.frac', unit: 'B03', version: 1, title: '분수의 덧셈과 뺄셈',
    answer: { kind: 'rational' },
    levels: [
      { name: '분모가 같은 덧셈', minDistinct: 150, vars: { q: fracPair(function (r) { var d = r.int(3, 11); return [d, d, '+']; }) }, where: fracOk },
      { name: '한쪽 분모로 통분', vars: { q: fracPair(function (r) { var d = r.int(2, 6), e = d * r.int(2, 3); return r.int(0, 1) ? [d, e, r.pick(['+', '-'])] : [e, d, r.pick(['+', '-'])]; }) }, where: fracOk },
      { name: '두 분모를 모두 바꿔 통분', vars: { q: fracPair(function (r) { return [r.int(2, 9), r.int(2, 9), r.pick(['+', '-'])]; }) },
        where: function (v) { var a = v.q.a[1], b = v.q.b[1]; return a % b !== 0 && b % a !== 0 && fracOk(v); } }
    ],
    prompt: function (v) { return { tex: fpar(v.q.a) + ' ' + v.q.op + ' ' + fpar(v.q.b), text: '계산하세요.' }; },
    solve: function (v) { return fracValue(v.q); },
    /* 검산: 답에서 거꾸로 계산하면 앞의 수(정확한 분수 계산) */
    verify: function (v, ans) {
      var q = v.q, x = F(ans.n, ans.d), b = F(q.b[0], q.b[1]);
      return (q.op === '+' ? x.sub(b) : x.add(b)).equals(F(q.a[0], q.a[1])) && MH.gcd(ans.n, ans.d) === 1;
    },
    hints: function (v) {
      var q = v.q, c = common(q), out = [];
      if (q.op === '-') out.push('먼저 뺄셈을 덧셈으로 바꿔요. 가운데 −를 +로 바꾸고, 빼는 수의 부호를 반대로 바꿔요: $' + fpar(q.a).replace(/dfrac/g, 'frac') + ' + ' + fpar(c.b2).replace(/dfrac/g, 'frac') + '$. 앞의 수는 그대로 둬요.');
      out.push('분수라도 방법은 정수와 똑같아요. 다만 분모가 같아야 분자끼리 계산할 수 있어요. ' + (q.a[1] === q.b[1] ? '이 문제는 분모가 ' + josa(c.L, '으로/로') + ' 이미 같으니, 분자만 계산하면 돼요.'
        : '분모 ' + josa(q.a[1], '과/와') + ' ' + q.b[1] + '의 최소공배수 ' + josa(c.L, '으로/로') + ' 분모를 맞춰요(통분): '
          + [[q.a, c.A], [q.b, c.B]].filter(function (t) { return t[0][1] !== c.L; }).map(function (t) { return '$' + small(abs(t[0][0]), t[0][1]) + ' = ' + small(abs(t[1]), c.L) + '$'; }).join(', ')
          + '. 분모에 곱한 수를 분자에도 똑같이 곱해요. 부호는 그대로 둬요.'));
      out.push('이제 분모 ' + josa(c.L, '은/는') + ' 그대로 두고 분자끼리만 계산해요. 분자는 ' + parT(c.A) + ' + ' + pj(c.B, 0, '이에요/예요') + '. ' + (c.A * c.B > 0
        ? '두 수의 부호가 같으니 ' + abs(c.A) + ' + ' + josa(abs(c.B), '을/를') + ' 계산하고 그 부호를 붙여요.'
        : '두 수의 부호가 다르니 큰 쪽 ' + Math.max(abs(c.A), abs(c.B)) + '에서 작은 쪽 ' + josa(Math.min(abs(c.A), abs(c.B)), '을/를') + ' 빼고, 절댓값이 큰 수의 부호를 붙여요.'));
      out.push('계산이 끝나면 분자와 분모를 함께 나눌 수 있는 수가 있는지 보고, 있으면 약분해요. 답이 음수이면 − 키를 눌러 부호를 붙여요.');
      return out;
    },
    steps: function (v) {
      var q = v.q, c = common(q), ans = fracValue(q), sum = c.A + c.B, out = [];
      if (q.op === '-') out.push({ say: '뺄셈을 덧셈으로 바꿔요. 빼는 수의 부호를 반대로 바꿔요.', tex: fpar(q.a) + ' - ' + fpar(q.b) + ' = ' + fpar(q.a) + ' + ' + fpar(c.b2) });
      if (q.a[1] !== q.b[1]) out.push({ say: '분모 ' + josa(q.a[1], '과/와') + ' ' + q.b[1] + '의 최소공배수 ' + josa(c.L, '으로/로') + ' 분모를 맞춰요(통분). 부호는 그대로예요.',
        tex: fpar([c.A, c.L]) + ' + ' + fpar([c.B, c.L]) });
      out.push({ say: '분모는 그대로 두고 분자끼리 계산해요. ' + (c.A * c.B > 0 ? '부호가 같으니 ' + abs(c.A) + ' + ' + abs(c.B) + ' = ' + abs(sum) + '에 그 부호를 붙여요.'
          : '부호가 다르니 ' + Math.max(abs(c.A), abs(c.B)) + ' − ' + Math.min(abs(c.A), abs(c.B)) + ' = ' + abs(sum) + '에 절댓값이 큰 수의 부호를 붙여요.'),
        tex: '\\dfrac{' + par(c.A) + ' + ' + par(c.B) + '}{' + c.L + '} = ' + ftex(sum, c.L) });
      out.push(ans.d === c.L ? { say: '더 약분할 수 없으니 이것이 답이에요.', tex: ftex(ans.n, ans.d), value: ans }
        : { say: '분자와 분모를 ' + josa(c.L / ans.d, '으로/로') + ' 나누어 약분해요.', tex: ftex(sum, c.L) + ' = ' + ftex(ans.n, ans.d), value: ans });
      return out;
    },
    /* ① 빼는 수의 부호를 안 바꿈 ② 부호가 다른데 분자의 크기를 더함(또는 같은데 뺌) ③ 숫자는 맞는데 부호가 반대 */
    mistakes: [
      { id: 'not-flipped', wrong: function (v) { var q = v.q, c = common(q); return q.op === '-' ? { n: c.A - c.B, d: c.L } : null; },
        explain: function () { return '가운데 −만 +로 바꾸고, 빼는 수의 부호는 그대로 뒀어요. 뺄셈을 덧셈으로 바꿀 때는 빼는 수의 부호도 반대로 바꿔야 해요.'; } },
      { id: 'abs-mixup', wrong: function (v) {
          var c = common(v.q), big = abs(c.A) >= abs(c.B) ? c.A : c.B;
          var size = c.A * c.B > 0 ? abs(abs(c.A) - abs(c.B)) : abs(c.A) + abs(c.B);
          return size ? { n: (big < 0 ? -1 : 1) * size, d: c.L } : null;
        },
        explain: function (v) {
          var c = common(v.q);
          return c.A * c.B > 0 ? '분자의 크기를 서로 뺐어요. 분자 ' + parT(c.A) + ', ' + parT(c.B) + '의 부호가 같으니 더해야 해요: ' + abs(c.A) + ' + ' + abs(c.B) + '.'
            : '분자의 크기를 더했어요. 분자 ' + parT(c.A) + ', ' + parT(c.B) + '의 부호가 다르니 큰 쪽에서 작은 쪽을 빼야 해요: ' + Math.max(abs(c.A), abs(c.B)) + ' − ' + Math.min(abs(c.A), abs(c.B)) + '.';
        } },
      { id: 'wrong-sign', wrong: function (v) { var a = fracValue(v.q); return { n: -a.n, d: a.d }; },
        explain: function (v) { var c = common(v.q); return '숫자는 맞았어요. 그런데 부호가 반대예요. 통분한 분자 ' + parT(c.A) + ', ' + parT(c.B) + '에서 답의 부호를 다시 정해 보세요.'; } }
    ]
  });

  /* ── B03.mixed 덧셈과 뺄셈이 섞인 식 ───────────────────
     v.q = { form: 'paren' | 'plain', t: 수의 목록, ops: 괄호 꼴에서 수 사이의 기호('+' | '-') }
     paren: (−3) + (+5) − (−2) · plain: −3 + 5 − 9 (각 수 앞의 기호가 그 수의 부호) */
  /** 모두 덧셈으로 바꾼 뒤의 수들 */
  var terms = function (q) { return q.form === 'plain' ? q.t : q.t.map(function (x, i) { return i > 0 && q.ops[i - 1] === '-' ? -x : x; }); };
  var total = function (list) { return list.reduce(function (s, x) { return s + x; }, 0); };
  var exprTex = function (q) {
    if (q.form === 'paren') return q.t.map(function (x, i) { return (i ? q.ops[i - 1] + ' ' : '') + par(x); }).join(' ');
    return q.t.map(function (x, i) { return i ? (x < 0 ? '- ' : '+ ') + abs(x) : stex(x); }).join(' ');
  };
  var sumTex = function (list) { return list.map(function (x) { return par(x); }).join(' + '); };
  var listT = function (list) { return list.map(function (x) { return parT(x); }).join(', '); };
  var expr = function (count, max, forms) {
    return sampler(function (r) {
      var form = r.pick(forms), t = [], ops = [];
      for (var i = 0; i < count; i++) { t.push(r.pick([-1, 1]) * r.int(1, max)); if (i) ops.push(r.pick(['+', '-'])); }
      return { form: form, t: t, ops: ops };
    });
  };
  var exprOk = function (v) {
    var q = v.q, list = terms(q);
    return list.some(function (x) { return x > 0; }) && list.some(function (x) { return x < 0; }) && (q.form === 'plain' || q.ops.indexOf('-') >= 0);
  };
  MH.defineType({
    id: 'B03.mixed', unit: 'B03', version: 1, title: '덧셈과 뺄셈이 섞인 식',
    answer: { kind: 'signed' },
    levels: [
      { name: '괄호가 있는 세 수', vars: { q: expr(3, 9, ['paren']) }, where: exprOk },
      { name: '괄호가 없는 세 수', vars: { q: expr(3, 12, ['plain']) }, where: exprOk },
      { name: '네 수', vars: { q: expr(4, 20, ['paren', 'plain']) }, where: exprOk }
    ],
    prompt: function (v) { return { tex: exprTex(v.q), text: '계산하세요.' }; },
    solve: function (v) { var list = terms(v.q); return S(total(list.filter(function (x) { return x > 0; })) + total(list.filter(function (x) { return x < 0; })), 0); },
    /* 검산: 식에 적힌 순서대로 왼쪽부터 하나씩 더하고 뺀다 */
    verify: function (v, ans) {
      var q = v.q, x = q.t[0];
      for (var i = 1; i < q.t.length; i++) x = q.form === 'plain' || q.ops[i - 1] === '+' ? x + q.t[i] : x - q.t[i];
      return ans.p === 0 && ans.n === x;
    },
    hints: function (v) {
      var q = v.q, list = terms(q), pos = list.filter(function (x) { return x > 0; }), neg = list.filter(function (x) { return x < 0; });
      return [
        q.form === 'paren' ? '먼저 뺄셈을 모두 덧셈으로 바꿔요. − 바로 뒤에 오는 괄호 안의 수는 부호를 반대로 바꾸고, 그 −는 +로 바꿔요. + 뒤에 오는 수는 그대로 둬요.'
          : '괄호가 없는 식은 각 수 바로 앞의 기호를 그 수의 부호로 읽어요. 앞에 −가 있으면 음수, +가 있거나 아무것도 없으면 양수예요. 그러면 식 전체가 덧셈이 돼요.',
        '그렇게 읽으면 $' + sumTex(list) + '$ 예요. 덧셈만 남았으니 더하는 순서를 바꿔도 답이 같아요.',
        '양수는 양수끼리, 음수는 음수끼리 모으면 쉬워요. 양수: ' + listT(pos) + ' / 음수: ' + listT(neg) + '. ① 양수끼리 더해요. ② 음수끼리 더해요(크기를 더하고 −를 붙여요). ③ 두 결과를 더해요. 부호가 다르니 큰 쪽에서 작은 쪽을 빼고, 절댓값이 큰 쪽의 부호를 붙여요.'
      ];
    },
    steps: function (v) {
      var q = v.q, list = terms(q), pos = list.filter(function (x) { return x > 0; }), neg = list.filter(function (x) { return x < 0; }), P = total(pos), N = total(neg);
      var group = function (g, sum) { return g.length > 1 ? sumTex(g) + ' = ' + stex(sum, 0, true) : null; };
      var groups = [group(pos, P), group(neg, N)].filter(Boolean);
      return [
        { say: q.form === 'paren' ? '뺄셈을 덧셈으로 바꿔요. − 뒤의 수는 부호를 반대로 바꿔요.' : '각 수 앞의 기호를 그 수의 부호로 읽어요. 그러면 모두 덧셈이에요.', tex: exprTex(q) + ' = ' + sumTex(list) },
        groups.length ? { say: '양수는 양수끼리, 음수는 음수끼리 모아 더해요.', tex: groups.join(',\\quad ') } : { say: '양수는 ' + parT(P) + ', 음수는 ' + parT(N) + ' 하나씩이에요.' }
      ].concat(addSteps(P, N, 0).map(function (s, i) {
        return i === 0 ? { say: '이제 ' + parT(P) + ' + ' + pj(N, 0, '을/를') + ' 계산해요. ' + s.say, tex: s.tex } : s;
      }));
    },
    /* ① 빼는 수의 부호를 안 바꾸고 모두 더함 ② 맨 앞의 − 를 빠뜨림 ③ 숫자는 맞는데 부호가 반대 */
    mistakes: [
      { id: 'not-flipped', wrong: function (v) { return v.q.form === 'paren' ? S(total(v.q.t), 0) : null; },
        explain: function () { return '괄호 안의 수를 그대로 모두 더했어요. − 뒤에 오는 수는 부호를 반대로 바꿔서 더해야 해요.'; } },
      { id: 'first-positive', wrong: function (v) { var q = v.q; return q.form === 'plain' && q.t[0] < 0 ? S(total(q.t) - 2 * q.t[0], 0) : null; },
        explain: function (v) { return '맨 앞의 −를 빠뜨렸어요. 맨 앞의 수는 ' + josa(abs(v.q.t[0]), '이/가') + ' 아니라 ' + josa(str(v.q.t[0]), '이에요/예요') + '.'; } },
      { id: 'wrong-sign', wrong: function (v) { return S(-total(terms(v.q)), 0); },
        explain: function (v) {
          var list = terms(v.q), P = total(list.filter(function (x) { return x > 0; })), N = total(list.filter(function (x) { return x < 0; }));
          return '숫자는 맞았어요. 그런데 부호가 반대예요. 양수를 모으면 ' + parT(P) + ', 음수를 모으면 ' + pj(N, 0, '이에요/예요') + '. 절댓값이 큰 쪽의 부호가 답의 부호예요.';
        } }
    ]
  });
})();
