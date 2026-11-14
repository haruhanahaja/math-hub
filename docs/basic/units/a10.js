/* A10 분수의 덧셈과 뺄셈 — 분모가 같은 경우 → 다른 경우 → 대분수
   유형(쉬운 것부터): A10.same 분모가 같은 덧셈·뺄셈 · A10.add 분모가 다른 덧셈 · A10.sub 분모가 다른 뺄셈
                     · A10.mixed-add 대분수의 덧셈 · A10.mixed-sub 대분수의 뺄셈
   문제는 모두 (w1 과 a/b) ± (w2 와 c/d) 꼴이다(w 가 0 이면 자연수 부분 없음). 답은 기약분수 { n, d }.
   값이 같으면 가분수로 써도 대분수로 써도 정답이고, 약분이 덜 됐으면 알려 주기만 한다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F, gcd = MH.gcd, lcm = MH.lcm;

  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  /** 대분수 꼴 수식: 자연수 w, 분자 n, 분모 d (w 가 0 이면 분수만, n 이 0 이면 자연수만) */
  var T = function (w, n, d) { return n === 0 ? String(w) : (w ? w : '') + frac(n, d); };
  /** 글로 읽는 분수: 4분의 3. 조사는 마지막에 읽는 분자에 맞춘다. */
  var read = function (n, d) { return d + '분의 ' + n; };
  var readJ = function (n, d, pair) { return d + '분의 ' + josa(n, pair); };

  /** 계산에 쓰는 수: 공통분모 l, 통분한 분자 x, y, 전체 분자 N(답 = N / l) */
  var calc = function (v) {
    var l = lcm(v.b, v.d), x = v.a * (l / v.b), y = v.c * (l / v.d), plus = v.op === '+';
    var p = v.w1 * l + x, q = v.w2 * l + y;
    return { l: l, x: x, y: y, plus: plus, same: v.b === v.d, mixed: v.w1 + v.w2 > 0, N: plus ? p + q : p - q,
      carry: plus && x + y > l, borrow: !plus && x < y, W: plus ? v.w1 + v.w2 : v.w1 - v.w2 };
  };
  var solve = function (v) { var c = calc(v), g = gcd(c.N, c.l); return { n: c.N / g, d: c.l / g }; };
  /** 오답 값: 분자 n, 분모 d (자연수 w 가 있으면 더한다). 만들 수 없는 값이면 null */
  var V = function (n, d, w) { return n > 0 && d > 0 && (w || 0) >= 0 ? { n: (w || 0) * d + n, d: d } : null; };

  /* ── 숫자 뽑기 ─────────────────────────────────────── */
  var sameD = function (lo, hi) { return { b: int(lo, hi), d: function (v) { return v.b; } }; };
  var freeD = function (lo, hi) { return { b: int(lo, hi), d: int(lo, hi) }; };
  /* 한 분모가 다른 분모의 배수: 작은 분모 s, 큰 분모 s × k. flip 이면 큰 분모가 앞에 온다. */
  var multD = { s: int(2, 6), k: int(2, 4), flip: pick([0, 1]), b: function (v) { return v.flip ? v.s * v.k : v.s; }, d: function (v) { return v.flip ? v.s : v.s * v.k; } };
  /* 공약수가 있지만 서로 배수는 아닌 분모 쌍(최소공배수가 두 수의 곱보다 작다). flip 이면 자리를 바꾼다. */
  var PAIRS = [[4, 6], [4, 10], [6, 8], [6, 9], [6, 10], [8, 10], [8, 12], [9, 12], [6, 15], [10, 15]];
  var pairD = { pair: pick(PAIRS), flip: pick([0, 1]), b: function (v) { return v.pair[v.flip]; }, d: function (v) { return v.pair[1 - v.flip]; } };
  var vars = function (op, mixed, denominators) {
    return Object.assign({ op: op, w1: mixed ? int(1, 5) : 0, w2: mixed ? int(1, 4) : 0 }, denominators,
      { a: function (v) { return int(1, v.b - 1); }, c: function (v) { return int(1, v.d - 1); } });
  };
  /* 답이 0 보다 크고 자연수가 아니어야 한다(분수로 답하는 문제) */
  var fine = function (v) { var c = calc(v); return c.N > 0 && c.N % c.l !== 0; };
  var reduced = function (v) { return gcd(v.a, v.b) === 1 && gcd(v.c, v.d) === 1; };
  var all = function () { var tests = [].slice.call(arguments); return function (v) { return tests.every(function (t) { return t(v); }); }; };
  var is = function (key, want) { return function (v) { return calc(v)[key] === want; }; };
  var smallL = function (v) { return calc(v).l <= 30; };   /* 대분수 계산은 공통분모가 30 이하인 것만 */
  var coprimeD = function (v) { return gcd(v.b, v.d) === 1; };
  var sharedD = function (v) { return gcd(v.b, v.d) > 1 && v.b % v.d !== 0 && v.d % v.b !== 0; };
  var unlikeLevels = function (op, min) {
    return [
      { name: '한 분모가 다른 분모의 배수', minDistinct: min[0], vars: vars(op, false, multD), where: all(fine, reduced) },
      { name: '공통인 약수가 없는 분모', minDistinct: min[1], vars: vars(op, false, freeD(2, 9)), where: all(fine, reduced, coprimeD) },
      { name: '최소공배수로 통분', minDistinct: min[2], vars: vars(op, false, pairD), where: all(fine, reduced, sharedD) }
    ];
  };

  /* ── 흔한 실수(유형마다 골라 쓴다) ────────────────────── */
  var changedSay = function (v, c) {
    var out = [];
    if (c.l !== v.b) out.push(readJ(v.a, v.b, '은/는') + ' ' + read(c.x, c.l));
    if (c.l !== v.d) out.push(readJ(v.c, v.d, '은/는') + ' ' + read(c.y, c.l));
    return out.join(', ');
  };
  var M = {
    /* 분모끼리도 더함(뺌) */
    'denominators-too': {
      wrong: function (v) {
        var c = calc(v);
        if (c.plus) return V(v.a + v.c, v.b + v.d, c.W);
        if (c.mixed) return null;
        return c.same ? V(v.a - v.c, v.b + v.d) : V(Math.abs(v.a - v.c), Math.abs(v.b - v.d));
      },
      explain: function (v) {
        var c = calc(v);
        if (c.plus) return '분모끼리도 더했어요. 분모는 조각의 크기를 나타내서 더하지 않아요. ' + (c.same ? '분모는 그대로 ' + josa(v.b, '으로/로') + ' 두고 분자만 더해요.' : '통분해서 분모를 같게 한 다음 분자만 더해요.');
        return c.same ? '분자는 뺐는데 분모는 더했어요. 분모는 조각의 크기를 나타내요. 그대로 ' + josa(v.b, '으로/로') + ' 두고 분자만 빼요.' : '분자는 분자끼리, 분모는 분모끼리 뺐어요. 분모가 다르면 통분해서 분모를 같게 한 다음 분자만 빼요.';
      } },
    /* 분모만 공통분모로 바꾸고 분자는 그대로 둠 */
    'numerators-kept': {
      wrong: function (v) { var c = calc(v); return c.same || (!c.plus && v.a <= v.c) ? null : V(c.plus ? v.a + v.c : v.a - v.c, c.l, c.W); },
      explain: function (v) { var c = calc(v); return '분모만 ' + josa(c.l, '으로/로') + ' 바꾸고 분자는 그대로 뒀어요. 통분할 때는 분자에도 같은 수를 곱해야 크기가 변하지 않아요: ' + changedSay(v, c) + '.'; } },
    /* 앞 분수만 통분하고 뒤 분수의 분자는 그대로 둠 */
    'half-converted': {
      wrong: function (v) { var c = calc(v); return c.mixed || c.l === v.b || c.l === v.d ? null : V(c.plus ? c.x + v.c : c.x - v.c, c.l); },
      explain: function (v) { var c = calc(v); return '앞 분수만 통분하고 뒤 분수의 분자는 그대로 뒀어요. ' + readJ(v.c, v.d, '은/는') + ' 분모와 분자에 ' + josa(c.l / v.d, '을/를') + ' 곱해 ' + readJ(c.y, c.l, '이/가') + ' 돼요.'; } },
    /* 덧셈과 뺄셈을 바꿔 함 */
    'wrong-operation': {
      wrong: function (v) { var c = calc(v), p = v.w1 * c.l + c.x, q = v.w2 * c.l + c.y; return V(c.plus ? Math.abs(p - q) : p + q, c.l); },
      explain: function (v) { return v.op === '+' ? '덧셈인데 뺄셈을 했어요. 기호를 다시 확인해요.' : '뺄셈인데 덧셈을 했어요. 기호를 다시 확인해요.'; } },
    /* 대분수로 바꾸면서 자연수 1 을 빠뜨림 */
    'dropped-whole': {
      wrong: function (v) { var c = calc(v); return c.carry && !c.mixed ? V(c.x + c.y - c.l, c.l) : null; },
      explain: function (v) { var c = calc(v), s = c.x + c.y; return '대분수로 바꾸면서 자연수 1을 빠뜨렸어요. ' + readJ(s, c.l, '은/는') + ' 1과 ' + readJ(s - c.l, c.l, '이에요/예요') + '.'; } },
    /* 분수 부분에서 올린 1 을 자연수에 더하지 않음 */
    'no-carry': {
      wrong: function (v) { var c = calc(v); return c.carry && c.mixed ? V(c.x + c.y - c.l, c.l, c.W) : null; },
      explain: function (v) { var c = calc(v); return '분수 부분에서 1을 올렸는데 자연수에 더하지 않았어요. 자연수는 ' + v.w1 + ' + ' + v.w2 + ' = ' + c.W + '에 올린 1을 더해 ' + josa(c.W + 1, '이에요/예요') + '.'; } },
    /* 분수 부분만 계산하고 자연수를 빠뜨림 */
    'fractions-only': {
      wrong: function (v) { var c = calc(v); return !c.mixed || (!c.plus && (c.borrow || c.W === 0)) ? null : V(c.plus ? c.x + c.y : c.x - c.y, c.l); },
      explain: function (v) { var c = calc(v); return '분수 부분만 계산하고 자연수를 빠뜨렸어요. 자연수끼리도 ' + (c.plus ? '더해요' : '빼요') + ': ' + v.w1 + (c.plus ? ' + ' : ' − ') + v.w2 + ' = ' + c.W + '.'; } },
    /* 분수 부분을 뺄 수 없어서 큰 쪽에서 작은 쪽을 뺌 */
    'flipped': {
      wrong: function (v) { var c = calc(v); return c.borrow ? V(c.y - c.x, c.l, c.W) : null; },
      explain: function (v) { var c = calc(v); return '분수 부분을 거꾸로(큰 쪽에서 작은 쪽을) 뺐어요. ' + read(c.x, c.l) + '에서 ' + readJ(c.y, c.l, '을/를') + ' 뺄 수 없으니 자연수 ' + v.w1 + '에서 1을 빌려 와야 해요.'; } },
    /* 1 을 빌려 왔는데 자연수를 줄이지 않음 */
    'no-decrement': {
      wrong: function (v) { var c = calc(v); return c.borrow ? V(c.N + c.l, c.l) : null; },
      explain: function (v) { var c = calc(v); return '분수 부분으로 1을 빌려 왔는데 자연수를 줄이지 않았어요. ' + josa(v.w1, '은/는') + ' 1을 빌려주고 ' + josa(v.w1 - 1, '이/가') + ' 돼요: ' + (v.w1 - 1) + ' − ' + v.w2 + ' = ' + (c.W - 1) + '.'; } }
  };
  /** 공통분모를 정하는 말: 한 분모가 다른 분모의 배수이면 큰 분모, 아니면 최소공배수 */
  var commonSay = function (v, l) {
    var big = Math.max(v.b, v.d), small = Math.min(v.b, v.d);
    return l === big ? josa(big, '은/는') + ' ' + small + '의 배수니까 ' + josa(big, '을/를') + ' 공통분모로 해서 통분해요.' : josa(v.b, '과/와') + ' ' + v.d + '의 최소공배수 ' + josa(l, '을/를') + ' 공통분모로 해서 통분해요.';
  };
  var commonHint = function (v, l) {
    var big = Math.max(v.b, v.d), small = Math.min(v.b, v.d);
    return l === big ? josa(big, '은/는') + ' ' + small + '의 배수니까 ' + josa(big, '을/를') + ' 공통분모로 하면 돼요.' : josa(v.b, '과/와') + ' ' + v.d + '의 최소공배수를 공통분모로 해요.';
  };
  var mistakes = function (ids) { return ids.map(function (id) { return { id: id, wrong: M[id].wrong, explain: M[id].explain }; }); };

  /* ── 힌트와 풀이(모든 유형이 함께 쓴다) ────────────────── */
  var hints = function (v) {
    var c = calc(v), word = c.plus ? '더해요' : '빼요';
    if (c.mixed) return [
      c.same ? '자연수는 자연수끼리, 분수는 분수끼리 ' + word + '.' : '분모가 다르니 먼저 분수 부분을 통분해요. ' + commonHint(v, c.l),
      c.same ? '분수 부분은 분모를 그대로 두고 분자끼리만 ' + word + '.' : '통분한 뒤에 자연수는 자연수끼리, 분수는 분수끼리 ' + word + '.',
      c.plus ? '분수 부분의 합이 1보다 크면(분자가 분모보다 크면) 1을 자연수로 올려요.' : '분수 부분을 뺄 수 없으면 자연수에서 1을 빌려 와요. 1은 분자와 분모가 같은 분수예요.'
    ];
    if (c.same) return [
      '분모가 같으면 조각의 크기가 같아요. 조각의 수(분자)만 ' + (c.plus ? '더하면' : '빼면') + ' 돼요.',
      '분모 ' + josa(v.b, '은/는') + ' 그대로 두세요. 분모끼리는 계산하지 않아요.',
      c.carry ? '분자가 분모보다 커지면 ' + readJ(v.b, v.b, '을/를') + ' 1로 바꿔 대분수로 쓸 수 있어요.' : '분자끼리 계산해요: ' + v.a + (c.plus ? ' + ' : ' − ') + v.c + '.'
    ];
    return [
      '분모가 다르면 조각의 크기가 달라서 바로 ' + (c.plus ? '더할' : '뺄') + ' 수 없어요. 먼저 통분해요.',
      commonHint(v, c.l) + ' 분모에 곱한 수를 분자에도 곱해요.',
      '분모가 같아지면 분모는 그대로 두고 분자끼리만 ' + word + '.'
    ];
  };
  var steps = function (v) {
    var c = calc(v), l = c.l, out = [], sign = c.plus ? ' + ' : ' - ', minus = c.plus ? ' + ' : ' − ';
    if (c.same) out.push({ say: '분모가 ' + josa(l, '으로/로') + ' 같아요. ' + (c.mixed ? '자연수는 자연수끼리, 분수는 분수끼리 계산해요.' : '조각의 크기가 같으니 분자끼리만 계산하면 돼요.') });
    else {
      var changed = [];
      if (l !== v.b) changed.push(T(v.w1, v.a, v.b) + ' = ' + T(v.w1, c.x, l));
      if (l !== v.d) changed.push(T(v.w2, v.c, v.d) + ' = ' + T(v.w2, c.y, l));
      out.push({ say: '분모가 달라요. ' + commonSay(v, l), tex: changed.join(',\\quad ') });
    }
    var w1 = v.w1, x = c.x;
    if (c.borrow) {
      out.push({ say: read(x, l) + '에서 ' + readJ(c.y, l, '을/를') + ' 뺄 수 없어요. 자연수 ' + w1 + '에서 1을 빌려 와요. 1은 ' + readJ(l, l, '이니까/니까') + ' 분자는 ' + x + ' + ' + l + ' = ' + (x + l) + ', 자연수는 ' + josa(w1 - 1, '이/가') + ' 돼요.', tex: T(w1, x, l) + ' = ' + T(w1 - 1, x + l, l) });
      w1 -= 1; x += l;
    }
    var W = c.plus ? w1 + v.w2 : w1 - v.w2, s = c.plus ? x + c.y : x - c.y;
    if (c.mixed) out.push({ say: '자연수끼리 ' + (c.plus ? '더하면 ' : '빼면 ') + w1 + minus + v.w2 + ' = ' + W + ', 분자끼리 ' + (c.plus ? '더하면 ' : '빼면 ') + x + minus + c.y + ' = ' + josa(s, '이에요/예요') + '. 분모는 그대로 ' + josa(l, '이에요/예요') + '.', tex: T(w1, x, l) + sign + T(v.w2, c.y, l) + ' = ' + T(W, s, l) });
    else out.push({ say: '분모는 그대로 두고 분자끼리 ' + (c.plus ? '더해요' : '빼요') + ': ' + x + minus + c.y + ' = ' + s + '.', tex: frac(x, l) + sign + frac(c.y, l) + ' = ' + frac(s, l) });
    if (c.carry) {
      out.push({ say: (c.mixed ? '분수 부분 ' + readJ(s, l, '이/가') + ' 1보다 커요. ' + readJ(l, l, '을/를') + ' 1로 바꿔 자연수에 올려요: 자연수는 ' + W + ' + 1 = ' + (W + 1) + ', ' : '분자가 분모보다 커요. ' + readJ(l, l, '이/가') + ' 1이니까 대분수로 바꿔요: ') + '분자는 ' + s + ' − ' + l + ' = ' + (s - l) + '.', tex: T(W, s, l) + ' = ' + T(W + 1, s - l, l) });
      W += 1; s -= l;
    }
    var g = gcd(s, l);
    if (g > 1) out.push({ say: '분자 ' + josa(s, '과/와') + ' 분모 ' + josa(l, '을/를') + ' ' + josa(g, '으로/로') + ' 나눠 약분해요.', tex: T(W, s, l) + ' = ' + T(W, s / g, l / g) });
    out[out.length - 1].value = solve(v);
    return out;
  };

  var define = function (id, title, whole, levels, ids) {
    MH.defineType({
      id: id, unit: 'A10', version: 1, title: title,
      answer: whole ? { kind: 'fraction', whole: true, show: 'mixed' } : { kind: 'fraction' },
      levels: levels,
      prompt: function (v) { return { tex: T(v.w1, v.a, v.b) + (v.op === '+' ? ' + ' : ' - ') + T(v.w2, v.c, v.d) }; },
      solve: solve,
      /* 검산: 정확한 분수 계산으로, 답에서 앞의 수를 빼면(뺄셈은 앞의 수에서 답을 빼면) 뒤의 수가 남는가 */
      verify: function (v, ans) {
        var first = F(v.w1 * v.b + v.a, v.b), second = F(v.w2 * v.d + v.c, v.d), a = F(ans.n, ans.d);
        return gcd(ans.n, ans.d) === 1 && (v.op === '+' ? a.sub(first) : first.sub(a)).equals(second);
      },
      hints: hints, steps: steps, mistakes: mistakes(ids)
    });
  };

  /* ── A10.same 분모가 같은 분수의 덧셈과 뺄셈 ───────────── */
  define('A10.same', '분모가 같은 덧셈과 뺄셈', true, [
    { name: '덧셈', minDistinct: 150, vars: vars('+', false, sameD(3, 12)), where: all(fine, is('carry', false)) },
    { name: '뺄셈', minDistinct: 150, vars: vars('-', false, sameD(3, 12)), where: fine },
    { name: '합이 1보다 큰 덧셈', minDistinct: 150, vars: vars('+', false, sameD(3, 12)), where: all(fine, is('carry', true)) }
  ], ['denominators-too', 'wrong-operation', 'dropped-whole']);

  /* ── A10.add 분모가 다른 분수의 덧셈 ──────────────────── */
  define('A10.add', '분모가 다른 덧셈', true, unlikeLevels('+', [240, 300, 230]), ['denominators-too', 'numerators-kept', 'half-converted', 'dropped-whole']);

  /* ── A10.sub 분모가 다른 분수의 뺄셈 ──────────────────── */
  define('A10.sub', '분모가 다른 뺄셈', false, unlikeLevels('-', [140, 190, 120])   /* 앞의 수가 더 커야 해서 덧셈보다 가짓수가 적다 */, ['denominators-too', 'numerators-kept', 'half-converted', 'wrong-operation']);

  /* ── A10.mixed-add 대분수의 덧셈 ─────────────────────── */
  define('A10.mixed-add', '대분수의 덧셈', true, [
    { name: '분모가 같고 받아올림이 없을 때', vars: vars('+', true, sameD(3, 9)), where: all(fine, is('carry', false)) },
    { name: '분수 부분의 합이 1보다 클 때', vars: vars('+', true, sameD(3, 9)), where: all(fine, is('carry', true)) },
    { name: '분모가 다를 때', vars: vars('+', true, freeD(2, 8)), where: all(fine, reduced, is('same', false), smallL) }
  ], ['no-carry', 'fractions-only', 'denominators-too', 'numerators-kept']);

  /* ── A10.mixed-sub 대분수의 뺄셈 ─────────────────────── */
  define('A10.mixed-sub', '대분수의 뺄셈', true, [
    { name: '분모가 같고 받아내림이 없을 때', vars: vars('-', true, sameD(3, 9)), where: all(fine, is('borrow', false), function (v) { return v.w1 > v.w2; }) },
    { name: '자연수에서 1을 빌려 올 때', vars: vars('-', true, sameD(3, 9)), where: all(fine, is('borrow', true)) },
    { name: '분모가 다를 때', vars: vars('-', true, freeD(2, 8)), where: all(fine, reduced, is('same', false), smallL) }
  ], ['flipped', 'no-decrement', 'wrong-operation', 'numerators-kept', 'fractions-only']);
})();
