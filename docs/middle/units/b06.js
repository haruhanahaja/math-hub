/* B06 일차식의 계산 — 항 · 계수 · 차수, 동류항, 분배법칙
   유형(쉬운 것부터): B06.coef 항 · 계수 · 차수(답이 수 → 키패드) · B06.like 동류항 정리 · B06.scale 일차식과 수의 곱셈 · 나눗셈
                     · B06.addsub 일차식의 덧셈과 뺄셈 · B06.frac 분수 꼴 일차식의 계산 (답이 식 → 보기 고르기)
   식은 항의 목록 [[계수, 문자], …] 으로 다룬다(문자 '' 는 상수항). 보기 유형은 engine/algebra.js 의 choiceType 을 쓴다.
   틀린 보기는 흔한 실수로 만든 식 가운데 답과 값이 다르고 서로도 다른 것 셋을 고른다(모자라면 계산 실수 꼴로 채운다).
   B06.coef 의 힌트에는 문제에 없는 숫자를 쓰지 않는다(답이 드러날 수 있다). */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, sameVal = A.sameVal, order4 = A.order4;
  var abs = Math.abs;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var CNT = ['영', '한', '두', '세', '네', '다섯'];
  var big = function (t) { return t.replace(/\\frac/g, '\\dfrac'); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var VARS = ['x', 'a', 'y', 'b'];
  var PAIRS = [['x', 'y'], ['a', 'b'], ['p', 'q']];

  /* ── 항의 목록 ── */
  /** 항 하나(부호 없이): [3, 'x'] → '3x', [-1, 'x'] → 'x', [5, ''] → '5' */
  var body = function (t) { return (abs(t[0]) !== 1 || !t[1] ? abs(t[0]) : '') + t[1]; };
  /** 식: [[3, 'x'], [-5, '']] → '3x - 5'. tight 이면 띄우지 않는다(보기용 '3x-5'). 계수가 0 인 항은 쓰지 않는다 */
  var poly = function (terms, tight) {
    var out = '';
    terms.filter(function (t) { return t[0] !== 0; }).forEach(function (t) {
      out += (out ? (t[0] < 0 ? (tight ? '-' : ' - ') : (tight ? '+' : ' + ')) : (t[0] < 0 ? '-' : '')) + body(t);
    });
    return out || '0';
  };
  var opt = function (terms) { return poly(terms, true); };
  /** 동류항끼리 모은다. 문자는 알파벳 순서, 상수항은 맨 뒤 */
  var combine = function (terms) {
    var sum = {}, keys = [];
    terms.forEach(function (t) { if (sum[t[1]] === undefined) { sum[t[1]] = 0; keys.push(t[1]); } sum[t[1]] += t[0]; });
    keys.sort(function (a, b) { return a === '' ? 1 : b === '' ? -1 : a < b ? -1 : 1; });
    return keys.map(function (k) { return [sum[k], k]; });
  };
  /** 틀린 보기 셋을 고른다: 후보 [[보기, id] …] 가운데 답과 값이 다르고 서로 다른 것을 앞에서부터 */
  var choose = function (ans, cands) {
    var out = [];
    cands.forEach(function (c) {
      if (out.length >= 3 || !c || sameVal(c[0], ans)) return;
      if (out.some(function (w) { return w[1] === c[1] || w[0] === c[0] || sameVal(w[0], c[0]); })) return;   /* 실수 id 하나에 보기 하나 */
      out.push(c);
    });
    return out;
  };
  var full = function (build) { return function (v) { return build(v.q).wrong.length === 3; }; };
  var choiceType = function (o) { o.unit = 'B06'; A.choiceType(o); };

  /* ── B06.coef 항 · 계수 · 차수 ─────────────────────────
     v.q = { t: [[계수, 문자 | 'x^{2}' | ''] …], ask: 'coef' | 'const' | 'count' | 'degree', of: 계수를 묻는 문자 } */
  var degOf = function (sym) { var m = /\^\{(\d)\}/.exec(sym); return m ? Number(m[1]) : sym ? 1 : 0; };
  var cTerm = function (q, sym) { return q.t.filter(function (t) { return t[1] === sym; })[0]; };
  var cAns = function (q) {
    return q.ask === 'coef' ? cTerm(q, q.of)[0] : q.ask === 'const' ? cTerm(q, '')[0] : q.ask === 'count' ? q.t.length : Math.max.apply(null, q.t.map(function (t) { return degOf(t[1]); }));
  };
  var cList = function (q) { return q.t.map(function (t) { return '$' + (t[0] < 0 ? '-' : '') + body(t) + '$'; }).join(', '); };
  var cAsk = function (q) {
    return q.ask === 'coef' ? '$' + q.of + '$의 계수를 구하세요.' : q.ask === 'const' ? '상수항을 구하세요.' : q.ask === 'count' ? '항은 모두 몇 개일까요?' : '다항식의 차수를 구하세요.';
  };
  var mix = function (r, terms) { return r.int(0, 2) ? terms : r.shuffle(terms); };
  MH.defineType({
    id: 'B06.coef', unit: 'B06', version: 1, title: '항 · 계수 · 차수',
    answer: { kind: 'signed', common: false },
    levels: [
      { name: '계수와 상수항', vars: { q: sampler(function (r) {
          var x = r.pick(VARS), a = r.int(0, 3) ? pm(r, r.int(2, 9)) : pm(r, 1);
          return { t: mix(r, [[a, x], [nz(r, -9, 9), '']]), ask: r.pick(['coef', 'coef', 'const']), of: x };
        }) } },
      { name: '항이 여러 개인 식', vars: { q: sampler(function (r) {
          var p = r.pick(PAIRS), t = [[r.int(0, 2) ? nz(r, -9, 9) : pm(r, 1), p[0]], [r.int(0, 2) ? nz(r, -9, 9) : pm(r, 1), p[1]]];
          if (r.int(0, 3)) t.push([nz(r, -12, 12), '']);
          if (r.int(0, 3) === 0) t.unshift([nz(r, -5, 5), r.pick(['z', 'c', 'k'])]);
          var ask = r.pick(['coef', 'coef', 'count', 'count', 'const']);
          return { t: mix(r, t), ask: ask === 'const' && !t.some(function (x) { return x[1] === ''; }) ? 'count' : ask, of: r.pick(p) };
        }) } },
      { name: '차수와 이차식', vars: { q: sampler(function (r) {
          var x = r.pick(VARS), top = r.int(0, 3) ? 2 : r.int(0, 1) ? 3 : 1, t = [];
          if (top === 3) t.push([nz(r, -4, 4), x + '^{3}']);
          if (top >= 2 && (top === 2 || r.int(0, 1))) t.push([r.int(0, 2) ? nz(r, -6, 6) : pm(r, 1), x + '^{2}']);
          if (top === 1 || r.int(0, 3)) t.push([r.int(0, 2) ? nz(r, -9, 9) : pm(r, 1), x]);
          if (t.length < 2 || r.int(0, 2)) t.push([nz(r, -9, 9), '']);
          var ask = r.pick(['degree', 'degree', 'coef', 'count']), has = t.filter(function (y) { return y[1]; });
          return { t: r.int(0, 3) ? t : r.shuffle(t), ask: ask, of: r.pick(has)[1] };
        }) } }
    ],
    prompt: function (v) { return { tex: poly(v.q.t), text: cAsk(v.q) }; },
    solve: function (v) { return { n: cAns(v.q), p: 0 }; },
    /* 검산: 계수와 상수항은 문자에 수를 넣어서 가려낸다(다른 문자는 0, 그 문자는 1 → 그 항의 계수만 남는다). 개수와 차수는 식의 글자에서 센다 */
    verify: function (v, ans) {
      var q = v.q, tex = poly(q.t), env = {};
      'abckpqxyz'.split('').forEach(function (l) { env[l] = MH.F(0); });
      if (q.ask === 'const') return A.ev(tex, env).equals(MH.F(ans.n));
      if (q.ask === 'count') return tex.replace(/^-/, '').split(/ [+-] /).length === ans.n;
      if (q.ask === 'degree') return Math.max.apply(null, (tex.match(/[a-z](\^\{\d\})?/g) || []).map(degOf)) === ans.n;
      /* 계수: 그 항만 떼어 낸 뒤 문자에 1 을 넣는다 */
      var parts = tex.replace(/ - /g, ' + -').split(' + ').filter(function (s) { return s.replace(/^-?\d*/, '') === q.of; });
      env[q.of.charAt(0)] = MH.F(1);
      return parts.length === 1 && A.ev(parts[0], env).equals(MH.F(ans.n));
    },
    hints: function (v) {
      var q = v.q, third;
      if (q.ask === 'coef') third = '$' + q.of + '$의 계수를 물었으니, 문자 부분이 $' + q.of + '$인 항을 찾아요. 그 항에서 문자를 손으로 가렸을 때 남는 수가 계수예요. 부호 −도 수의 일부라서 함께 읽어요. 문자 앞에 수가 보이지 않으면 곱해진 수가 생략된 것이에요(문자 하나는 그 문자의 한 배).';
      else if (q.ask === 'const') third = '상수항은 문자 없이 수만 있는 항이에요. 문자에 어떤 수를 넣어도 변하지 않아서 "늘 같은 수"라는 뜻으로 상수라고 불러요. 앞에 붙은 부호까지 함께 읽어요.';
      else if (q.ask === 'count') third = '나눠 놓은 항을 하나씩 세면 돼요. 수만 있는 상수항도 항 하나로 세고, 문자 앞에 수가 없는 항도 항 하나예요. 곱셈으로 붙어 있는 것은 한 덩어리로 세요.';
      else third = '항마다 문자가 몇 번 곱해졌는지 봐요. 문자 위에 작은 숫자(지수)가 있으면 그만큼, 없으면 한 번, 수만 있는 항은 영 번이에요. 그 가운데 가장 큰 것이 다항식의 차수예요. 계수의 크기와는 상관없어요.';
      return [
        '식을 +, −가 있는 곳에서 자르면 덩어리로 나뉘어요. 이 덩어리 하나하나를 "항"이라고 해요. 장바구니에 든 물건을 종류별로 나눠 놓는 것과 같아요.',
        '자를 때 −는 바로 뒤의 항에 붙여서 가져가요. 이 식을 항으로 나누면 이렇게 돼요: ' + cList(q),
        third
      ];
    },
    steps: function (v) {
      var q = v.q, ans = cAns(q), shown = String(ans).replace('-', '−'), t, say;
      if (q.ask === 'coef') { t = cTerm(q, q.of); say = '문자 부분이 $' + q.of + '$인 항을 찾아요: $' + (t[0] < 0 ? '-' : '') + body(t) + '$. ' + (abs(t[0]) === 1 ? '문자 앞에 수가 없으니 ' + (t[0] < 0 ? '−1' : '1') + '이 생략된 것이에요. ' : '문자 앞의 수를 부호와 함께 읽어요. ') + '계수는 ' + josa(shown, '이에요/예요') + '.'; }
      else if (q.ask === 'const') say = '문자 없이 수만 있는 항을 부호와 함께 읽어요. 상수항은 ' + josa(shown, '이에요/예요') + '.';
      else if (q.ask === 'count') say = '항을 세면 모두 ' + shown + '개예요. 상수항도 항이에요.';
      else say = '항마다 문자가 곱해진 횟수는 차례로 ' + q.t.map(function (x) { return degOf(x[1]); }).join(', ') + '이에요. 가장 큰 것이 차수라서, 차수는 ' + josa(shown, '이에요/예요') + '.';
      return [{ say: '식을 항으로 나눠요(−는 뒤의 항에 붙여요): ' + cList(q) }, { say: say, value: { n: ans, p: 0 } }];
    },
    /* ① 부호를 빠뜨림 ② 생략된 1 을 못 봄 ③ 다른 항을 읽음 ④ 상수항을 항으로 세지 않음 ⑤ 차수 대신 계수나 항의 개수를 답함 */
    mistakes: [
      { id: 'sign', wrong: function (v) { var q = v.q; return q.ask === 'coef' || q.ask === 'const' ? { n: -cAns(q), p: 0 } : null; },
        explain: function (v) { return v.q.ask === 'coef' ? '부호가 달라요. 계수는 문자 앞의 수를 부호까지 함께 읽은 것이에요. 식에서 그 항 바로 앞의 부호를 확인해 보세요.' : '부호가 달라요. 상수항도 바로 앞의 부호까지 함께 읽어요.'; } },
      { id: 'no-one', wrong: function (v) { var q = v.q; return q.ask === 'coef' && abs(cAns(q)) === 1 ? { n: 0, p: 0 } : null; },
        explain: function (v) { return '문자 앞에 수가 보이지 않는다고 계수가 0인 것은 아니에요. 문자만 있는 항은 그 문자의 한 배이고, 앞에 −가 있으면 −한 배예요. 곱해진 수 1이 생략되어 있을 뿐이에요.'; } },
      { id: 'other-term', wrong: function (v) {
          var q = v.q, c = cTerm(q, ''), first = q.t.filter(function (t) { return t[1]; })[0];
          return q.ask === 'coef' ? (c ? { n: c[0], p: 0 } : null) : q.ask === 'const' ? { n: first[0], p: 0 } : null;
        },
        explain: function (v) { return v.q.ask === 'coef' ? '상수항을 읽었어요. 계수는 문자에 곱해진 수예요. 문자 부분이 $' + v.q.of + '$인 항에서 찾아요.' : '문자가 있는 항의 계수를 읽었어요. 상수항은 문자 없이 수만 있는 항이에요.'; } },
      { id: 'const-not-term', wrong: function (v) { var q = v.q; return q.ask === 'count' && cTerm(q, '') ? { n: q.t.length - 1, p: 0 } : null; },
        explain: function () { return '상수항을 세지 않았어요. 문자가 없이 수만 있는 것도 항이에요. +, −로 나뉜 덩어리를 모두 세요.'; } },
      { id: 'degree-coef', wrong: function (v) {
          var q = v.q; if (q.ask !== 'degree') return null;
          var d = cAns(q), top = q.t.filter(function (t) { return degOf(t[1]) === d; })[0];
          return { n: abs(top[0]), p: 0 };
        },
        explain: function () { return '계수를 답했어요. 차수는 문자 앞의 수가 아니라, 문자가 곱해진 횟수(지수) 가운데 가장 큰 것이에요.'; } },
      { id: 'degree-count', wrong: function (v) { var q = v.q; return q.ask === 'degree' ? { n: q.t.length, p: 0 } : null; },
        explain: function () { return '항의 개수를 답했어요. 차수는 항이 몇 개인지가 아니라, 문자가 곱해진 횟수(지수) 가운데 가장 큰 것이에요.'; } }
    ]
  });

  /* 보기 유형이 함께 쓰는 실수 설명 */
  var EXPLAIN = {
    unlike: function () { return '종류가 다른 항까지 합쳤어요. 문자가 있는 항과 수만 있는 항, 문자가 서로 다른 항은 합칠 수 없어요. 사과 3개와 귤 2개를 "사과귤 5개"라고 할 수 없는 것과 같아요.'; },
    sign: function () { return '부호를 놓친 항이 있어요. −는 바로 뒤의 항에 붙어 있어요. 항을 옮기거나 모을 때 부호까지 함께 가져가요.'; },
    'no-one': function () { return '수가 보이지 않는 항을 빠뜨렸어요. 문자 하나만 있는 항은 계수가 1(앞에 −가 있으면 −1)이에요. 그 1도 함께 계산해요.'; },
    squared: function () { return '문자까지 곱해 버렸어요. 동류항을 더할 때는 계수끼리만 계산하고 문자는 그대로 둬요. 사과 3개 + 사과 4개는 사과 7개이지 "사과의 제곱"이 아니에요.'; },
    slip: function () { return '방법은 맞았는데 계수의 계산이 틀렸어요. 부호가 있는 수의 덧셈 · 뺄셈을 한 번 더 확인해 보세요.'; },
    added: function () { return '곱해야 할 것을 더했어요. 수와 식이 붙어 있으면 곱셈이에요. 계수에 그 수를 곱해요.'; },
    'no-letter': function () { return '문자를 빠뜨렸어요. 수끼리 계산한 다음 문자는 그대로 붙여 써요.'; },
    'wrong-op': function () { return '곱셈과 나눗셈을 바꿔 계산했어요. 식에 쓰인 기호가 ×인지 ÷인지 다시 확인해 보세요.'; },
    'first-only': function () { return '괄호 안의 첫 항에만 계산했어요. 분배법칙은 괄호 안의 모든 항에 똑같이 곱하는(나누는) 것이에요. 뒤의 항에도 해 줘야 해요.'; },
    'sign-second': function () { return '뒤의 항의 부호가 틀렸어요. 음수를 곱하면 괄호 안의 모든 항의 부호가 바뀌어요. 음수 × 음수는 양수예요.'; },
    'no-change': function () { return '괄호만 없앴어요. 괄호 앞의 −는 −1을 곱한다는 뜻이에요. 괄호 안의 모든 항의 부호를 바꿔야 해요.'; },
    'minus-first-only': function () { return '빼는 식의 첫 항만 부호를 바꿨어요. 괄호 앞에 −가 있으면 괄호 안의 모든 항의 부호가 바뀌어요.'; },
    'added-op': function () { return '뺄셈을 덧셈으로 계산했어요. 두 식 사이의 기호가 −예요. 뒤의 식의 모든 항의 부호를 바꿔서 더해요.'; },
    'no-common': function () { return '분자는 분자끼리, 분모는 분모끼리 계산했어요. 분수의 덧셈 · 뺄셈은 분모를 같게 만든(통분) 다음 분자만 계산해요. 분모는 그대로 둬요.'; },
    'numer-only': function () { return '통분하면서 분자에는 곱하지 않았어요. 분모에 곱한 수를 분자의 모든 항에도 똑같이 곱해야 값이 변하지 않아요.'; },
    'dropped-den': function () { return '분모를 없애 버렸어요. 분모를 없애는 것은 방정식에서 양쪽에 같은 수를 곱할 때뿐이에요. 식을 계산할 때는 분모를 끝까지 써야 해요.'; }
  };
  EXPLAIN.slip2 = EXPLAIN.slip3 = EXPLAIN.slip;
  /** 계산 실수 꼴의 보기(채우기용): 첫 계수를 하나 크게 · 작게, 마지막 항의 부호를 반대로 */
  var slips = function (terms) {
    var a = terms.map(function (t) { return t.slice(); }), b = terms.map(function (t) { return t.slice(); }), c = terms.map(function (t) { return t.slice(); });
    a[0][0] += a[0][0] === -1 ? -1 : 1; b[0][0] -= b[0][0] === 1 ? -2 : 1; c[c.length - 1][0] *= -1;
    return [[opt(a), 'slip'], [opt(c), 'slip2'], [opt(b), 'slip3']];
  };

  /* ── B06.like 동류항 정리 ──────────────────────────────
     v.q = { t: [[계수, 문자] …](식에 쓰인 차례), o } */
  var likeBuild = function (q) {
    var t = q.t, done = combine(t), ans = opt(done), syms = done.map(function (x) { return x[1]; });
    var total = t.reduce(function (s, x) { return s + x[0]; }, 0), cands = [];
    var negAt = -1;
    t.forEach(function (x, i) { if (i > 0 && x[0] < 0 && negAt < 0) negAt = i; });
    if (syms.length === 1) cands.push([opt([[done[0][0], syms[0] + '^{' + t.length + '}']]), 'squared']);
    else cands.push([opt([[total, syms.join('')]]), 'unlike']);
    if (negAt >= 0) cands.push([opt(combine(t.map(function (x, i) { return i === negAt ? [-x[0], x[1]] : x; }))), 'sign']);
    if (t.some(function (x) { return abs(x[0]) === 1 && x[1]; })) cands.push([opt(combine(t.map(function (x) { return abs(x[0]) === 1 && x[1] ? [0, x[1]] : x; }))), 'no-one']);
    if (t[0][0] < 0) cands.push([opt(combine(t.map(function (x, i) { return i === 0 ? [-x[0], x[1]] : x; }))), 'sign']);
    cands = cands.concat(slips(done));
    var sorted = [];
    syms.forEach(function (s) { t.forEach(function (x) { if (x[1] === s) sorted.push(x); }); });
    return { raw: poly(t), ans: ans, wrong: choose(ans, cands), t: t, done: done, sorted: sorted, syms: syms };
  };
  /** 계수끼리의 계산을 괄호에 넣어 보여 준다: 3x + 5 − x + 2 → (3 − 1)x + (5 + 2) */
  var groupTex = function (p) {
    return p.syms.map(function (s, i) {
      var mine = p.t.filter(function (x) { return x[1] === s; });
      if (mine.length === 1) return (i ? (mine[0][0] < 0 ? ' - ' : ' + ') : (mine[0][0] < 0 ? '-' : '')) + body(mine[0]);
      var nums = mine.map(function (x, k) { return (k ? (x[0] < 0 ? ' - ' : ' + ') : (x[0] < 0 ? '-' : '')) + abs(x[0]); }).join('');
      return (i ? ' + ' : '') + '(' + nums + ')' + s;
    }).join('');
  };
  var likeTerms = function (r, sym, n) { var out = []; for (var i = 0; i < n; i++) out.push([r.int(0, 3) ? nz(r, -9, 9) : pm(r, 1), sym]); return out; };
  var likeOk = function (v) { var p = likeBuild(v.q); return p.wrong.length === 3 && p.done.every(function (x) { return x[0] !== 0; }); };
  choiceType({
    id: 'B06.like', title: '동류항 정리', build: likeBuild,
    ids: ['squared', 'unlike', 'sign', 'no-one', 'slip', 'slip2'], explain: EXPLAIN,
    levels: [
      { name: '같은 문자의 항', vars: { q: sampler(function (r) { return { t: likeTerms(r, r.pick(VARS), r.int(0, 2) ? 2 : 3), o: order4(r) }; }) }, where: likeOk },
      { name: '문자가 있는 항과 상수항', vars: { q: sampler(function (r) {
          var x = r.pick(VARS);
          return { t: r.shuffle(likeTerms(r, x, 2).concat([[nz(r, -9, 9), ''], [nz(r, -9, 9), '']])), o: order4(r) };
        }) }, where: likeOk },
      { name: '문자가 두 가지인 식', vars: { q: sampler(function (r) {
          var p = r.pick(PAIRS), t = likeTerms(r, p[0], 2).concat(likeTerms(r, p[1], 2));
          if (r.int(0, 2) === 0) t.push([nz(r, -9, 9), '']);
          return { t: r.shuffle(t), o: order4(r) };
        }) }, where: likeOk }
    ],
    prompt: function (p) { return { tex: p.raw, text: '동류항끼리 모아서 간단히 한 것을 고르세요.' }; },
    hints: function (p) {
      var kinds = p.syms.map(function (s) { return s ? '문자 $' + s + '$가 있는 항' : '수만 있는 항(상수항)'; });
      return [
        '문자와 차수가 같은 항을 "동류항"이라고 해요. 같은 종류의 물건인 셈이에요. 사과 3개와 사과 4개는 합쳐서 사과 7개라고 할 수 있지만, 사과와 귤은 합쳐서 셀 수 없죠. 식에서도 같은 종류끼리만 합쳐요.',
        '이 식에는 ' + kinds.join(', ') + '이 있어요. ① 같은 종류끼리 모아요. 이때 항 앞의 부호(+, −)를 꼭 함께 가져가요. 모으면 이렇게 돼요: $' + poly(p.sorted) + '$',
        '② 같은 종류끼리는 계수만 계산하고 문자는 그대로 붙여요. 문자 앞에 수가 보이지 않는 항은 계수가 1(또는 −1)이에요. ' + (p.syms.length > 1 ? '③ 종류가 다른 항은 더 합치지 않고 +, −로 이어 둬요.' : '③ 문자에는 손대지 않아요. 지수가 생기지 않아요.')
      ];
    },
    steps: function (p) {
      return [
        { say: '같은 종류의 항끼리 모아요. 부호를 함께 옮겨요.', tex: poly(p.sorted) },
        { say: '계수끼리 계산하고 문자는 그대로 붙여요.', tex: groupTex(p) },
        { say: p.syms.length > 1 ? '종류가 다른 항은 더 합칠 수 없어요. 이것이 답이에요.' : '이것이 답이에요.', tex: p.raw + ' = ' + poly(p.done), value: p.ans }
      ];
    }
  });

  /* ── B06.scale 일차식과 수의 곱셈 · 나눗셈 ─────────────
     v.q = { k, x, …, o }
       mono    { a, n, op: '×' | '÷', flip }     ax × n (flip 이면 n × ax) · ax ÷ n
       dist    { n, a, b, flip }                 n(ax + b) (flip 이면 (ax + b) × n)
       neg     { a, b }                          −(ax + b)
       div     { n, a, b }                       (ax + b) ÷ n
       fracmul { n: [분자, 분모], a, b }          (분자/분모)(ax + b) */
  var parNum = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  var fracT = function (n) { return (n[0] < 0 ? '-' : '') + '\\dfrac{' + abs(n[0]) + '}{' + n[1] + '}'; };
  var scaleBuild = function (q) {
    var x = q.x, raw, res, cands = [], inner = q.k === 'mono' ? null : poly([[q.a, x], [q.b, '']]), spread = null;
    if (q.k === 'mono') {
      var mono = (q.a < 0 ? '(' : '') + poly([[q.a, x]]) + (q.a < 0 ? ')' : '');
      raw = q.op === '÷' ? mono + ' \\div ' + parNum(q.n) : q.flip ? q.n + ' \\times ' + mono : mono + ' \\times ' + parNum(q.n);
      var val = q.op === '÷' ? q.a / q.n : q.a * q.n, other = q.op === '÷' ? q.a * q.n : null;
      res = [[val, x]];
      cands = [[opt([[val, '']]), 'no-letter'], [opt([[-val, x]]), 'sign'], q.op === '÷' ? [opt([[other, x]]), 'wrong-op'] : [opt([[q.a + q.n, x]]), 'added'],
        [opt([[q.a + q.n, x]]), 'added'], [opt([[val + (val > 0 ? 1 : -1), x]]), 'slip'], [opt([[val + (val > 0 ? 2 : -2), x]]), 'slip2']];
    } else {
      var f = q.k === 'neg' ? -1 : q.k === 'fracmul' ? q.n[0] / q.n[1] : q.k === 'div' ? 1 / q.n : q.n;
      var A1 = q.k === 'div' ? q.a / q.n : q.k === 'fracmul' ? q.a / q.n[1] * q.n[0] : q.a * f, B1 = q.k === 'div' ? q.b / q.n : q.k === 'fracmul' ? q.b / q.n[1] * q.n[0] : q.b * f;
      res = [[A1, x], [B1, '']];
      raw = q.k === 'neg' ? '-(' + inner + ')' : q.k === 'div' ? '(' + inner + ') \\div ' + parNum(q.n) : q.k === 'fracmul' ? fracT(q.n) + '(' + inner + ')' : q.flip ? '(' + inner + ') \\times ' + parNum(q.n) : q.n + '(' + inner + ')';
      cands.push([opt([[A1, x], [q.b, '']]), 'first-only']);
      if (q.k === 'neg') cands.push([opt([[q.a, x], [q.b, '']]), 'no-change']);
      cands.push([opt([[A1, x], [-B1, '']]), 'sign-second']);
      if (q.k === 'div') cands.push([opt([[q.a * q.n, x], [q.b * q.n, '']]), 'wrong-op']);
      if (q.k === 'dist') cands.push([opt([[q.a + q.n, x], [q.b + q.n, '']]), 'added']);
      cands.push([opt([[-A1, x], [B1, '']]), 'sign']);
      cands = cands.concat(slips(res));
      var fT = q.k === 'neg' ? '(-1)' : q.k === 'fracmul' ? (q.n[0] < 0 ? '\\left(' + fracT(q.n) + '\\right)' : fracT(q.n)) : parNum(q.n);
      var tx = (q.a < 0 ? '(' : '') + poly([[q.a, x]]) + (q.a < 0 ? ')' : '');
      spread = q.k === 'div' ? tx + ' \\div ' + fT + ' + ' + parNum(q.b) + ' \\div ' + fT : fT + ' \\times ' + tx + ' + ' + fT + ' \\times ' + parNum(q.b);
    }
    var ans = opt(res);
    return { raw: raw, ans: ans, wrong: choose(ans, cands), q: q, res: res, spread: spread, inner: inner };
  };
  var scaleOk = full(scaleBuild);
  choiceType({
    id: 'B06.scale', title: '일차식과 수의 곱셈 · 나눗셈', build: scaleBuild,
    ids: ['no-letter', 'sign', 'wrong-op', 'added', 'first-only', 'no-change', 'sign-second', 'slip'],
    explain: EXPLAIN,
    levels: [
      { name: '문자가 있는 항과 수', vars: { q: sampler(function (r) {
          var div = r.int(0, 2) === 0, n = pm(r, r.int(2, 9)), k = nz(r, -9, 9);
          return div ? { k: 'mono', x: r.pick(VARS), a: n * k, n: n, op: '÷', o: order4(r) } : { k: 'mono', x: r.pick(VARS), a: k, n: n, op: '×', flip: n > 0 && r.int(0, 1) === 1, o: order4(r) };
        }) }, where: function (v) { return scaleOk(v) && abs(v.q.a) !== 1; } },
      { name: '괄호가 있는 식에 수를 곱하기', vars: { q: sampler(function (r) {
          var n = r.int(0, 2) ? r.int(2, 6) : -r.int(2, 6);
          return { k: 'dist', x: r.pick(VARS), n: n, a: nz(r, -5, 5), b: nz(r, -9, 9), flip: r.int(0, 3) === 0, o: order4(r) };
        }) }, where: scaleOk },
      { name: '괄호 앞의 −, 나눗셈, 분수 곱하기', vars: { q: sampler(function (r) {
          var form = r.int(0, 2), x = r.pick(VARS), n, d;
          if (form === 0) return { k: 'neg', x: x, a: nz(r, -9, 9), b: nz(r, -9, 9), o: order4(r) };
          if (form === 1) { n = pm(r, r.int(2, 6)); return { k: 'div', x: x, n: n, a: n * nz(r, -4, 4), b: n * nz(r, -5, 5), o: order4(r) }; }
          d = r.int(2, 4); n = d === 2 || r.int(0, 1) ? 1 : d - 1;
          return { k: 'fracmul', x: x, n: [pm(r, n), d], a: d * nz(r, -3, 3), b: d * nz(r, -4, 4), o: order4(r) };
        }) }, where: scaleOk }
    ],
    prompt: function (p) { return { tex: p.raw, text: '계산해서 간단히 한 것을 고르세요.' }; },
    hints: function (p) {
      var q = p.q;
      if (q.k === 'mono') return [
        '문자가 있는 항에 수를 곱하거나 나눌 때는 수끼리만 계산하고 문자는 그대로 둬요. 한 봉지에 사과가 몇 개씩 든 봉지를 여러 개 사도, 봉지 수만 달라질 뿐 "사과"라는 종류는 그대로인 것과 같아요.',
        '차례는 이래요. ① 부호를 먼저 정해요: 두 수의 부호가 같으면 +, 다르면 −. ② 부호를 떼고 수끼리 ' + (q.op === '÷' ? '나눠요' : '곱해요') + '. ③ 그 뒤에 문자 $' + q.x + '$를 붙여요.',
        '이 식에서 계산할 두 수는 문자 앞의 수와 ' + (q.op === '÷' ? '나누는' : '곱하는') + ' 수예요. 문자 앞에 수가 보이지 않으면 1이 생략된 것이에요. 더하는 것이 아니라 ' + (q.op === '÷' ? '나누는' : '곱하는') + ' 것임을 잊지 마세요. 문자를 빠뜨린 보기도 답이 아니에요.'
      ];
      return [
        '괄호로 묶인 식에 수를 곱하면 괄호 안의 모든 항에 똑같이 곱해요. 이것을 "분배법칙"이라고 해요. 연필과 지우개가 한 세트로 든 꾸러미를 세 개 사면 연필도 세 배, 지우개도 세 배가 되는 것과 같아요.',
        q.k === 'neg' ? '괄호 앞에 −만 있으면 −1을 곱한다는 뜻이에요. 그래서 괄호 안의 모든 항의 부호가 반대로 바뀌어요. +였던 항은 −로, −였던 항은 +로 바꿔 써요.'
          : q.k === 'div' ? '나눗셈도 똑같아요. 괄호 안의 모든 항을 그 수로 나눠요. 이 식을 항마다 나눠 쓰면 이래요: $' + p.spread + '$'
            : '이 식을 항마다 곱하는 모습으로 풀어 쓰면 이래요: $' + p.spread + '$',
        '틀리기 쉬운 곳은 두 가지예요. ① 첫 항에만 계산하고 뒤의 항은 그대로 두는 것 ② 음수를 곱하거나 나눌 때 뒤의 항의 부호를 바꾸지 않는 것. 음수 × 음수는 양수라는 것도 기억해요.' + (q.k === 'fracmul' ? ' 분수를 곱할 때는 계수와 분모를 먼저 약분하면 쉬워요.' : '')
      ];
    },
    steps: function (p) {
      var q = p.q;
      if (q.k === 'mono') return [
        { say: '수끼리 ' + (q.op === '÷' ? '나누고' : '곱하고') + ' 문자는 그대로 둬요. 부호가 같으면 +, 다르면 −예요.', tex: parNum(q.a) + (q.op === '÷' ? ' \\div ' : ' \\times ') + parNum(q.n) + ' = ' + p.res[0][0] },
        { say: '계산한 수 뒤에 문자를 붙여요.', tex: p.raw + ' = ' + poly(p.res), value: p.ans }
      ];
      return [
        { say: q.k === 'neg' ? '괄호 앞의 −는 −1을 곱한다는 뜻이에요. 괄호 안의 모든 항에 곱해요.' : q.k === 'div' ? '괄호 안의 모든 항을 나눠요.' : '괄호 안의 모든 항에 곱해요(분배법칙).', tex: p.spread },
        { say: '항마다 계산해요. 부호에 주의해요.', tex: p.raw + ' = ' + poly(p.res), value: p.ans }
      ];
    }
  });

  /* ── B06.addsub 일차식의 덧셈과 뺄셈 ───────────────────
     v.q = { x, p: [[m, a, b], [m, a, b]], op: '+' | '-', o } — m(ax + b) ± m(ax + b). m 이 1 이면 괄호만 */
  var groupT = function (g, x) { return (g[0] === 1 ? '' : g[0]) + '(' + poly([[g[1], x], [g[2], '']]) + ')'; };
  var addBuild = function (q) {
    var x = q.x, g = q.p, s = q.op === '-' ? -1 : 1, m1 = g[0][0], m2 = g[1][0];
    var open = [[m1 * g[0][1], x], [m1 * g[0][2], ''], [s * m2 * g[1][1], x], [s * m2 * g[1][2], '']];
    var res = combine(open), ans = opt(res), cands = [];
    var alt = function (list) { return opt(combine(list)); };
    if (q.op === '-') {
      cands.push([alt([open[0], open[1], open[2], [m2 * g[1][2], '']]), 'minus-first-only']);
      cands.push([alt([open[0], open[1], [m2 * g[1][1], x], [m2 * g[1][2], '']]), 'added-op']);
    }
    if (m1 !== 1 || m2 !== 1) cands.push([alt([[m1 * g[0][1], x], [g[0][2], ''], [s * m2 * g[1][1], x], [s * g[1][2], '']]), 'first-only']);
    cands.push([opt([[res.reduce(function (t, y) { return t + y[0]; }, 0), x]]), 'unlike']);
    if (q.op === '+') cands.push([alt([open[0], open[1], open[2], [-open[3][0], '']]), 'sign']);
    cands.push([alt([open[0], [-open[1][0], ''], open[2], open[3]]), 'sign']);
    cands = cands.concat(slips(res));
    return { raw: groupT(g[0], x) + (q.op === '-' ? ' - ' : ' + ') + groupT(g[1], x), ans: ans, wrong: choose(ans, cands), q: q, open: open, res: res,
      sorted: [open[0], open[2], open[1], open[3]] };
  };
  var addOk = function (v) { var p = addBuild(v.q); return p.wrong.length === 3 && p.res.length === 2 && p.res[0][0] !== 0 && p.res[1][0] !== 0; };
  var pair = function (r, m) { return [m, r.int(0, 3) ? nz(r, -6, 6) : pm(r, 1), nz(r, -9, 9)]; };
  choiceType({
    id: 'B06.addsub', title: '일차식의 덧셈과 뺄셈', build: addBuild,
    ids: ['minus-first-only', 'added-op', 'first-only', 'unlike', 'sign', 'slip'], explain: EXPLAIN,
    levels: [
      { name: '덧셈', vars: { q: sampler(function (r) { return { x: r.pick(VARS), p: [pair(r, 1), pair(r, 1)], op: '+', o: order4(r) }; }) }, where: addOk },
      { name: '뺄셈', vars: { q: sampler(function (r) { return { x: r.pick(VARS), p: [pair(r, 1), pair(r, 1)], op: '-', o: order4(r) }; }) }, where: addOk },
      { name: '수를 곱한 식의 덧셈과 뺄셈', vars: { q: sampler(function (r) {
          var m1 = r.int(1, 4), m2 = r.int(2, 4);
          return { x: r.pick(VARS), p: [pair(r, m1), pair(r, m2)], op: r.pick(['+', '-', '-']), o: order4(r) };
        }) }, where: function (v) { return addOk(v) && abs(v.q.p[0][1]) <= 4 && abs(v.q.p[1][1]) <= 4; } }
    ],
    prompt: function (p) { return { tex: p.raw, text: '계산해서 간단히 한 것을 고르세요.' }; },
    hints: function (p) {
      var q = p.q, mult = q.p[0][0] !== 1 || q.p[1][0] !== 1;
      return [
        '일차식끼리 더하거나 뺄 때는 두 단계로 해요. ① 괄호를 풀어요. ② 동류항끼리 모아서 계산해요. 두 장바구니를 한데 쏟은 다음, 같은 종류끼리 다시 세는 것과 같아요.',
        (mult ? '괄호 앞에 수가 있으면 그 수를 괄호 안의 모든 항에 곱해요(분배법칙). ' : '') + (q.op === '-' ? '괄호 앞에 −가 있으면 괄호 안의 모든 항의 부호를 바꿔요. 빚을 없애 주면 이익이 되듯, −를 빼면 +가 돼요. 첫 항만 바꾸고 뒤의 항을 그대로 두는 실수가 가장 많아요.' : '괄호 앞에 +가 있으면 괄호 안의 부호는 그대로예요. 괄호만 지우면 돼요.')
          + ' 이 식의 괄호를 풀면 이렇게 돼요: $' + poly(p.open) + '$',
        '이제 같은 종류끼리 모아요. 문자 $' + q.x + '$가 있는 항끼리, 수만 있는 항끼리 따로 계산해요: $' + poly(p.sorted) + '$. 문자가 있는 항과 수만 있는 항은 서로 합치지 않아요.'
      ];
    },
    steps: function (p) {
      var q = p.q;
      return [
        { say: (q.p[0][0] !== 1 || q.p[1][0] !== 1 ? '괄호 앞의 수를 괄호 안의 모든 항에 곱하면서 괄호를 풀어요. ' : '괄호를 풀어요. ') + (q.op === '-' ? '−가 붙은 괄호는 안의 모든 항의 부호가 바뀌어요.' : '+가 붙은 괄호는 부호가 그대로예요.'), tex: p.raw + ' = ' + poly(p.open) },
        { say: '동류항끼리 모아요.', tex: poly(p.sorted) },
        { say: '같은 종류끼리 계수를 계산해요.', tex: poly(p.res), value: p.ans }
      ];
    }
  });

  /* ── B06.frac 분수 꼴 일차식의 계산 ────────────────────
     v.q = { x, f: [[a, b, d], [a, b, d]], op, o } — (ax + b)/d ± (ax + b)/d */
  var gcd = MH.gcd;
  var fT = function (top, d, tight) { return '\\frac{' + (tight ? opt(top) : poly(top)) + '}{' + d + '}'; };
  var fracBuild = function (q) {
    var x = q.x, f = q.f, s = q.op === '-' ? -1 : 1, d1 = f[0][2], d2 = f[1][2], L = d1 * d2 / gcd(d1, d2), k1 = L / d1, k2 = L / d2;
    var open = [[k1 * f[0][0], x], [k1 * f[0][1], ''], [s * k2 * f[1][0], x], [s * k2 * f[1][1], '']], top = combine(open);
    var ans = fT(top, L, true), cands = [];
    var frac = function (list, den) { return fT(combine(list), den, true); };
    if (q.op === '-') cands.push([frac([open[0], open[1], open[2], [k2 * f[1][1], '']], L), 'minus-first-only']);
    cands.push([frac([[f[0][0], x], [f[0][1], ''], [s * f[1][0], x], [s * f[1][1], '']], d1 + d2), 'no-common']);
    if (d1 !== d2) cands.push([frac([[f[0][0], x], [f[0][1], ''], [s * f[1][0], x], [s * f[1][1], '']], L), 'numer-only']);
    cands.push([opt(top), 'dropped-den']);
    slips(top).forEach(function (w) { cands.push(['\\frac{' + w[0] + '}{' + L + '}', 'slip']); });
    var t1 = [[f[0][0], x], [f[0][1], '']], t2 = [[f[1][0], x], [f[1][1], '']];
    var wrap = function (k, t) { return k === 1 ? poly(t) : k + '(' + poly(t) + ')'; };
    return { raw: big(fT(t1, d1)) + (s < 0 ? ' - ' : ' + ') + big(fT(t2, d2)), ans: ans, wrong: choose(ans, cands), q: q, L: L, k: [k1, k2], top: top, open: open,
      same: d1 === d2, common: '\\dfrac{' + wrap(k1, t1) + '}{' + L + '}' + (s < 0 ? ' - ' : ' + ') + '\\dfrac{' + wrap(k2, t2) + '}{' + L + '}',
      one: '\\dfrac{' + wrap(k1, t1) + (s < 0 ? ' - ' : ' + ') + (s < 0 || k2 !== 1 ? (k2 === 1 ? '' : k2) + '(' + poly(t2) + ')' : poly(t2)) + '}{' + L + '}' };
  };
  var fracOk = function (v) {
    var p = fracBuild(v.q), a = p.top[0][0], b = p.top[1] ? p.top[1][0] : 0;
    var f = v.q.f, s = v.q.op === '-' ? -1 : 1;
    /* 통분하지 않고 계산했을 때에도 문자가 남아야 한다(틀린 보기가 1/6 같은 수가 되지 않게) */
    return p.wrong.length === 3 && p.top.length === 2 && a !== 0 && b !== 0 && gcd(gcd(abs(a), abs(b)), p.L) === 1 && f[0][0] + s * f[1][0] !== 0 && f[0][1] + s * f[1][1] !== 0;
  };
  var numer = function (r, d) { return [r.int(1, 3), nz(r, -5, 5), d]; };
  var DENS = [[2, 3], [2, 4], [3, 4], [2, 5], [3, 6], [2, 6], [4, 6], [3, 5]];
  choiceType({
    id: 'B06.frac', title: '분수 꼴 일차식의 계산', build: fracBuild,
    ids: ['minus-first-only', 'no-common', 'numer-only', 'dropped-den', 'slip'], explain: EXPLAIN,
    levels: [
      { name: '분모가 같은 식', vars: { q: sampler(function (r) { var d = r.int(2, 7); return { x: r.pick(VARS), f: [numer(r, d), numer(r, d)], op: r.pick(['+', '-']), o: order4(r) }; }) }, where: fracOk },
      { name: '분모가 다른 식의 덧셈', vars: { q: sampler(function (r) { var d = r.shuffle(r.pick(DENS).slice()); return { x: r.pick(VARS), f: [numer(r, d[0]), numer(r, d[1])], op: '+', o: order4(r) }; }) }, where: fracOk },
      { name: '분모가 다른 식의 뺄셈', vars: { q: sampler(function (r) { var d = r.shuffle(r.pick(DENS).slice()); return { x: r.pick(VARS), f: [numer(r, d[0]), numer(r, d[1])], op: '-', o: order4(r) }; }) }, where: fracOk }
    ],
    prompt: function (p) { return { tex: p.raw, text: '계산해서 하나의 분수로 나타낸 것을 고르세요.' }; },
    hints: function (p) {
      var q = p.q, minus = q.op === '-';
      return [
        '분자에 문자가 있어도 분수의 덧셈 · 뺄셈 방법은 수일 때와 똑같아요. 조각의 크기(분모)가 같아야 개수(분자)를 더하거나 뺄 수 있어요. 그래서 먼저 분모를 같게 만들어요(통분).',
        p.same ? '이 식은 두 분모가 이미 같아요. 분모는 그대로 두고 분자끼리 계산해요. 분자가 여러 항으로 된 식이니, 분자 전체를 괄호로 묶어서 생각해요: $' + p.one + '$'
          : '두 분모의 최소공배수를 공통분모로 삼아요. 분모에 곱한 수를 분자에도 똑같이 곱하는데, 분자가 여러 항이니 괄호로 묶어서 분자 전체에 곱해요: $' + p.common + '$',
        (minus ? '빼는 분수의 분자는 괄호째 빼는 것이에요. 그래서 그 분자의 모든 항의 부호가 바뀌어요. 첫 항만 바꾸는 실수가 가장 많아요. ' : '괄호를 풀 때는 곱하는 수를 분자의 모든 항에 곱해요. ') + '그다음 분자에서 동류항끼리 모아 계산해요. 분모는 끝까지 지우지 않아요. 분모를 없애는 것은 방정식을 풀 때만 하는 일이에요.'
      ];
    },
    steps: function (p) {
      var out = [];
      if (!p.same) out.push({ say: '분모의 최소공배수 ' + josa(p.L, '으로/로') + ' 통분해요. 분모에 곱한 수를 분자 전체에 곱해요.', tex: p.common });
      out.push({ say: '분모는 그대로 두고 분자끼리 한 분수로 써요. 분자는 괄호로 묶어 둬요.', tex: p.one });
      out.push({ say: '분자의 괄호를 풀어요.' + (p.q.op === '-' ? ' − 뒤의 괄호는 모든 항의 부호가 바뀌어요.' : ''), tex: '\\dfrac{' + poly(p.open) + '}{' + p.L + '}' });
      out.push({ say: '분자에서 동류항끼리 계산해요.', tex: big(fT(p.top, p.L)), value: p.ans });
      return out;
    }
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B06', [
  { title: '항, 상수항, 계수', body: [
    '식을 +, −가 있는 곳에서 자르면 덩어리로 나뉘어요. 이 덩어리를 "항"이라고 해요. 자를 때 −는 뒤의 항에 붙여요.',
    { tex: '3x - 2y + 5' },
    { ex: [['3x,\\; -2y,\\; 5', '항. 모두 세 개예요'], ['5', '상수항. 문자 없이 수만 있는 항'], ['3', 'x의 계수. 문자에 곱해진 수'], ['-2', 'y의 계수. 부호까지 함께 읽어요']] },
    '문자 앞에 수가 없으면 1이 생략된 것이에요. $x$의 계수는 1, $-x$의 계수는 −1이에요.'
  ] },
  { title: '차수와 일차식', body: [
    '항에서 문자가 곱해진 횟수를 그 항의 "차수"라고 해요. 식 전체의 차수는 가장 높은 항의 차수예요.',
    { ex: [['5', '문자가 없어요 → 차수 0'], ['3x', 'x가 한 번 → 차수 1'], ['2x^{2}', 'x가 두 번 → 차수 2'], ['x^{2} - 4x + 1', '가장 높은 것이 2 → 이차식']] },
    '차수가 1인 식을 "일차식"이라고 해요. $3x - 5$, $-x$, $\\dfrac{x}{2} + 1$은 모두 일차식이에요.',
    '차수는 계수의 크기와 상관없어요. $100x$도 차수는 1이에요.'
  ] },
  { title: '동류항 — 같은 종류끼리만 합쳐요', body: [
    '문자와 차수가 같은 항을 "동류항"이라고 해요. 같은 종류의 물건인 셈이에요.',
    { list: ['사과 3개 + 사과 4개 = 사과 7개 → 합칠 수 있어요.', '사과 3개 + 귤 2개 → 합쳐서 셀 수 없어요.'] },
    { ex: [['3x + 4x = 7x', '계수끼리 더하고 문자는 그대로'], ['5a - 8a = -3a', '계수끼리 빼요'], ['3x + 2', '더 합칠 수 없어요. 5x가 아니에요'], ['x + x = 2x', 'x의 제곱이 아니에요']] },
    '상수항끼리도 동류항이에요. $3x + 5 - x + 2$는 $(3 - 1)x + (5 + 2) = 2x + 7$이에요.'
  ] },
  { title: '분배법칙 — 괄호 안의 모든 항에', body: [
    '괄호로 묶인 식에 수를 곱하면 괄호 안의 모든 항에 똑같이 곱해요. 연필과 지우개가 든 꾸러미 3개를 사면 연필도 3배, 지우개도 3배가 되는 것과 같아요.',
    { tex: '\\begin{aligned} 3(2x - 5) &= 3 \\times 2x + 3 \\times (-5) \\\\ &= 6x - 15 \\end{aligned}' },
    { ex: [['-2(x - 3) = -2x + 6', '음수 × 음수 = 양수'], ['(6x - 9) \\div 3 = 2x - 3', '나눗셈도 모든 항을 나눠요'], ['4 \\times 3x = 12x', '수끼리 곱하고 문자는 그대로']] },
    '가장 흔한 실수는 첫 항에만 곱하는 것이에요. $3(2x - 5)$를 $6x - 5$로 쓰면 안 돼요.'
  ] },
  { title: '괄호 풀기 — 앞의 부호를 보세요', body: [
    '일차식의 덧셈과 뺄셈은 ① 괄호를 풀고 ② 동류항끼리 계산해요. 괄호 앞의 부호에 따라 푸는 방법이 달라요.',
    { ex: [['+(x - 5) = x - 5', '+이면 부호 그대로'], ['-(x - 5) = -x + 5', '−이면 모든 항의 부호를 반대로']] },
    { tex: '\\begin{aligned} (3x + 2) - (x - 5) &= 3x + 2 - x + 5 \\\\ &= 2x + 7 \\end{aligned}' },
    '괄호 앞의 −는 −1을 곱한다는 뜻이에요. 그래서 첫 항뿐 아니라 뒤의 항도 부호가 바뀌어요.'
  ] },
  { title: '분수 꼴의 식 — 통분하고 분자는 괄호로', body: [
    '분자에 문자가 있어도 방법은 분수의 덧셈 · 뺄셈과 같아요. 통분한 다음 분자끼리 계산해요.',
    { tex: '\\begin{aligned} \\dfrac{x + 1}{2} - \\dfrac{x - 3}{3} &= \\dfrac{3(x + 1) - 2(x - 3)}{6} \\\\ &= \\dfrac{3x + 3 - 2x + 6}{6} \\\\ &= \\dfrac{x + 9}{6} \\end{aligned}' },
    { list: ['① 분모에 곱한 수를 분자 전체에 곱해요(괄호로 묶어서).', '② − 뒤의 괄호는 모든 항의 부호가 바뀌어요.', '③ 분모는 끝까지 지우지 않아요.'] }
  ] }
]);
