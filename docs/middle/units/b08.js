/* B08 일차방정식의 활용 — 문장을 식으로 옮기기(수, 가격 · 개수 · 나이, 거리 · 속력 · 시간, 농도)
   유형(쉬운 것부터): B08.setup 식 세우기(답이 식 → 보기 고르기) · B08.number 수에 관한 문제 · B08.count 개수 · 가격 · 나이
                     · B08.speed 거리 · 속력 · 시간 · B08.mix 농도
   답이 수 하나인 유형은 키패드로 넣는다(int, 단위는 답 칸 옆에). 유형마다 상황(kind)이 여럿이고, 상황 하나가
   문제 글 · 말로 세운 식 · 방정식 · 답 · 흔한 실수의 오답을 함께 만든다. 숫자는 답(x)에서 거꾸로 맞춰 항상 자연수 답이 나온다.
   방정식의 양쪽은 항 [계수, 'x' | ''] · 묶음 ['g', 곱하는 수, [항 …]] · 분수 ['f', 부호, [분자의 항 …], 분모] 의 목록이다.
   검산: ① 화면 풀이에 쓰는 방정식을 MH.alg.ev 로 다시 읽어 x 를 넣으면 양쪽이 같다 ② 방정식을 거치지 않고 상황대로 직접 계산한 확인(ok).
   힌트에는 문제에 보이는 수만 쓴다. 힌트에 나온 수가 우연히 답과 같은 문제는 내지 않는다(leak). */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, body = A.body, order4 = A.order4, lcm = MH.lcm, abs = Math.abs;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var isInt = Number.isInteger;
  /** 수 뒤에 붙일 조사만: pj(3, '으로/로') → '으로' */
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };

  /* ── 방정식 다루기 ── */
  var xs = function (s) { return s.filter(function (t) { return t[1]; }); };
  var cs = function (s) { return s.filter(function (t) { return !t[1]; }); };
  var sum = function (s) { return s.reduce(function (a, t) { return a + t[0]; }, 0); };
  var neg = function (s) { return s.map(function (t) { return [-t[0], t[1]]; }); };
  var isG = function (it) { return it[0] === 'g'; };
  var sideTex = function (s) {
    var out = '';
    s.forEach(function (it, i) {
      var special = it[0] === 'g' || it[0] === 'f', c = special ? it[1] : it[0], sign = i ? (c < 0 ? ' - ' : ' + ') : (c < 0 ? '-' : '');
      out += sign + (it[0] === 'g' ? (abs(c) === 1 ? '' : abs(c)) + '(' + poly(it[2]) + ')' : it[0] === 'f' ? '\\dfrac{' + poly(it[2]) + '}{' + it[3] + '}' : body(it));
    });
    return out || '0';
  };
  var E = function (L, R) { return sideTex(L) + ' = ' + sideTex(R); };
  var expand = function (s) {
    var out = [];
    s.forEach(function (it) { if (isG(it)) it[2].forEach(function (t) { out.push([it[1] * t[0], t[1]]); }); else out.push(it); });
    return out;
  };
  /** 계수가 정수인 방정식 L = R: 괄호 풀기 → 이항(문자 항 = 수) → A x = B */
  var lin = function (L, R) {
    var eL = expand(L), eR = expand(R), left = xs(eL).concat(neg(xs(eR))), right = cs(eR).concat(neg(cs(eL)));
    return { eL: eL, eR: eR, left: left, right: right, A: sum(left), B: sum(right), moving: xs(eR).concat(cs(eL)), tidy: left.length > 1 || right.length > 1, grouped: L.concat(R).some(isG) };
  };
  var solveSteps = function (m) {
    var out = [];
    if (m.grouped) out.push({ say: '괄호를 풀어요. 괄호 앞에 수가 있으면 괄호 안의 모든 항에 곱해요.', tex: poly(m.eL) + ' = ' + poly(m.eR) });
    if (m.moving.length) out.push({ say: '문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요. 등호를 건너는 항은 부호가 바뀌어요.', tex: poly(m.left) + ' = ' + poly(m.right) });
    if (m.tidy) out.push({ say: '양쪽을 각각 계산해요.', tex: poly([[m.A, 'x']]) + ' = ' + m.B });
    if (m.A === -1) out.push({ say: '양쪽에 −1을 곱해서 부호를 바꿔요.', tex: 'x = ' + (-m.B) });
    else if (m.A !== 1) out.push({ say: '양쪽을 $x$ 앞의 수 $' + m.A + '$' + pj(m.A, '으로/로') + ' 나눠요.', tex: 'x = \\dfrac{' + m.B + '}{' + m.A + '} = ' + m.B / m.A });
    return out;
  };
  /** 식 '… = …' 에 x 를 넣으면 참인가 */
  var holds = function (eq, x) {
    var env = { x: MH.F(x) }, v;
    try { v = eq.split(' = ').map(function (t) { return A.ev(t, env); }); } catch (e) { return false; }
    return v.every(function (y) { return y.equals(v[0]); });
  };
  var nums = function (t) { return t.match(/\d+/g) || []; };

  var HOW_PLAIN = '① 문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요(등호를 건너면 부호가 바뀌어요). ② 양쪽을 각각 계산해요. ③ 양쪽을 $x$ 앞의 수로 나눠요.';
  var HOW_GROUP = '① 괄호를 풀어요. 괄호 앞에 수가 있으면 괄호 안의 모든 항에 곱해요. ② 문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요. ③ 양쪽을 각각 계산한 다음 $x$ 앞의 수로 나눠요.';
  var HOW_FRAC = '① 양쪽의 모든 항에 분모의 최소공배수를 곱해서 분모를 없애요. ② 괄호가 생기면 풀고, 문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요. ③ 양쪽을 $x$ 앞의 수로 나눠요.';
  var HOW_100 = '① 양쪽의 모든 항에 100을 곱해서 분모를 없애요. ② 괄호가 있으면 풀고, 문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요. ③ 양쪽을 $x$ 앞의 수로 나눠요.';

  /* ── 답이 수 하나인 문장제 유형의 공통 틀 ──
     o = { id, title, intro(첫 힌트의 앞부분), levels, kinds: { 이름: (q) → 상황 | null }, mistakes: [[실수 id, (상황) → 설명] …] }
     상황 = { text, unit, x, let(무엇을 x 로 두는가), terms(x 로 나타낸 다른 양), words(말로 세운 식), tip(둘째 힌트), ok(직접 확인), wrong: { 실수 id: 오답 },
              L · R(정수 계수 방정식) 또는 eq + steps(직접 쓴 풀이), eq + pre(분모를 없애는 풀이 줄) + L · R, how(셋째 힌트의 푸는 차례),
              ans · ansTex · last · lastTip(구하는 것이 x 가 아닐 때) } */
  var wordType = function (o) {
    var lastQ = null, lastP = null;
    var finish = function (p) {
      if (!p) return null;
      if (p.L) {
        p.m = lin(p.L, p.R);
        if (!p.m.A || p.m.B / p.m.A !== p.x) return null;
        if (!p.eq) p.eq = E(p.L, p.R);
      }
      if (p.ans === undefined) p.ans = p.x;
      p.ansTex = p.ansTex || 'x';
      return p;
    };
    var P = function (v) { if (v.q !== lastQ) { lastP = finish(o.kinds[v.q.k](v.q)); lastQ = v.q; } return lastP; };
    var hints = function (p) {
      var how = p.how || (p.m && p.m.grouped ? HOW_GROUP : HOW_PLAIN);
      return [
        (p.intro || o.intro) + ' 이 문제에서는 ' + p.let + ' $x$라고 놓아요.' + (p.terms ? ' ' + p.terms : ''),
        p.tip,
        '말로 세운 식에 수와 $x$를 넣으면 이렇게 돼요: $' + p.eq + '$. ' + how + (p.ansTex !== 'x' ? ' ' + p.lastTip : ' 구한 값을 문제에 넣어 말이 되는지도 확인해요.')
      ];
    };
    /* 힌트에 나온 수가 문제에 없는데 우연히 답과 같으면 답을 알려 주는 셈이다 */
    var leak = function (p) { var a = String(p.ans); return nums(p.text).indexOf(a) < 0 && nums(hints(p).join(' ')).indexOf(a) >= 0; };
    o.levels.forEach(function (lv) {
      var extra = lv.where;
      lv.where = function (v) {
        var p = P(v);
        return !!p && isInt(p.x) && p.x > 0 && isInt(p.ans) && p.ans > 0 && p.ok === true && holds(p.eq, p.x) && (!extra || extra(p)) && !leak(p);
      };
    });
    MH.defineType({
      id: o.id, unit: 'B08', version: 1, title: o.title,
      answer: { kind: 'int', common: false, suffix: function (v) { return P(v).unit; } },
      levels: o.levels,
      prompt: function (v) { return { text: P(v).text }; },
      solve: function (v) { return P(v).ans; },
      /* 검산: 방정식에 x 를 넣으면 양쪽이 같고, 구하는 것을 x 로 나타낸 식의 값이 답이며, 상황대로 직접 계산해도 맞다 */
      verify: function (v, ans) {
        var p = P(v);
        return p.ok === true && ans === p.ans && holds(p.eq, p.x) && A.ev(p.ansTex, { x: MH.F(p.x) }).equals(MH.F(ans));
      },
      /* 테스트가 방정식을 따로 풀어 볼 수 있게 내놓는다 */
      model: function (v) { var p = P(v); return { eq: p.eq, ansTex: p.ansTex, kind: v.q.k }; },
      hints: function (v) { return hints(P(v)); },
      steps: function (v) {
        var p = P(v), out = [{ say: p.let + ' $x$라고 놓아요.' + (p.terms ? ' ' + p.terms : '') }, { say: '같은 양을 등호로 이어 방정식을 세워요. ' + p.words, tex: p.eq }];
        out = out.concat(p.pre || []).concat(p.steps || solveSteps(p.m));
        if (p.ansTex !== 'x') out.push({ say: p.last, tex: p.ansTex + ' = ' + p.ans });
        out[out.length - 1].value = p.ans;
        return out;
      },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0], wrong: function (v) { var w = P(v).wrong[m[0]]; return w === undefined ? null : w; }, explain: function (v) { return m[1](P(v)); } };
      })
    });
  };

  /* ── 문장 조각 ── */
  var OP = { 'if': ['더하면', '빼면'], adj: ['더한', '뺀'], then: ['더한 다음', '뺀 다음'] };
  /** op(5, 'if') → '에 5를 더하면', op(-5, 'adj') → '에서 5를 뺀' */
  var op = function (b, form) { return (b > 0 ? '에 ' + josa(b, '을/를') : '에서 ' + josa(-b, '을/를')) + ' ' + OP[form][b > 0 ? 0 : 1]; };
  var sg = function (b) { return (b > 0 ? '+ ' : '− ') + abs(b); };
  var timesOf = function (c) { return c === 1 ? '어떤 수' : '어떤 수의 ' + c + '배'; };

  /* ── B08.setup 식 세우기 (보기 고르기) ──────────────────
     v.q = { k, … 숫자, x(참인 값), o }. 상황 = { text, ans, wrong: [[보기, 실수 id, 설명] …], tip, words, ok } */
  var ASK = ' 이 관계를 방정식으로 나타낸 것을 고르세요.';
  var FOOD = [['빵', '개', '우유 한 팩'], ['공책', '권', '필통 한 개'], ['연필', '자루', '지우개 한 개'], ['사과', '개', '바구니 한 개'], ['음료수', '병', '과자 한 봉지']];
  var PENS = [['볼펜', '자루'], ['공책', '권'], ['지우개', '개'], ['스티커', '장'], ['엽서', '장']];
  var FAMILY = [['어머니', '아들'], ['아버지', '딸'], ['이모', '조카'], ['삼촌', '조카']];
  var GIFTS = [['귤', '개'], ['사탕', '개'], ['공책', '권'], ['색종이', '장']];
  var SET = {
    times: function (q) {
      var a = q.a, b = q.b, x = q.x, c = a * x + b;
      return { ok: c > 0, text: '어떤 수 $x$의 ' + a + '배' + op(b, 'if') + ' ' + josa(c, '이/가') + ' 돼요.' + ASK,
        ans: E([[a, 'x'], [b, '']], [[c, '']]),
        tip: '"어떤 수의 ' + a + '배"는 $x$를 ' + a + '번 더한 것이라서 $' + a + 'x$로 써요. 문장의 차례대로, $' + a + 'x$를 다 만든 뒤에 ' + josa(abs(b), '을/를') + ' ' + (b > 0 ? '더해요' : '빼요') + '. 곱셈은 덧셈 · 뺄셈보다 먼저 계산하니 괄호를 쓰지 않아도 그 순서가 돼요.',
        words: '(어떤 수의 ' + a + '배) ' + sg(b) + ' = ' + c,
        wrong: [[E([['g', a, [[1, 'x'], [b, '']]]], [[c, '']]), 'group', '괄호로 묶으면 "어떤 수' + op(b, 'then') + ' ' + a + '배 한다"는 다른 문장이 돼요. 이 문제는 먼저 ' + a + '배를 하고, 그다음에 ' + (b > 0 ? '더해요.' : '빼요.')],
          [E([[1, 'x'], [a, ''], [b, '']], [[c, '']]), 'times-as-add', '"' + a + '배"를 덧셈으로 썼어요. ' + a + '배는 ' + josa(a, '을/를') + ' 곱하는 것이라서 $' + a + 'x$로 써요. $x + ' + a + '$' + pj(a, '은/는') + ' $x$보다 ' + a + '만큼 큰 수예요.'],
          [E([[a, 'x'], [-b, '']], [[c, '']]), 'op-flip', b > 0 ? '더한다고 했는데 뺐어요. "' + josa(b, '을/를') + ' 더하면"은 $+ ' + b + '$' + pj(b, '으로/로') + ' 써요.' : '뺀다고 했는데 더했어요. "' + josa(-b, '을/를') + ' 빼면"은 $- ' + (-b) + '$' + pj(b, '으로/로') + ' 써요.']] };
    },
    both: function (q) {
      var a = q.a, b = q.b, x = q.x, c = a * (x + b);
      return { ok: c > 0, text: '어떤 수 $x$' + op(b, 'then') + ' ' + a + '배 하면 ' + josa(c, '이/가') + ' 돼요.' + ASK,
        ans: E([['g', a, [[1, 'x'], [b, '']]]], [[c, '']]),
        tip: '순서를 봐요. 먼저 $x$' + op(b, 'then') + ', 그 결과를 통째로 ' + a + '배 해요. 먼저 계산한 부분을 한 덩어리로 다루려면 괄호로 묶어야 해요. 괄호가 없으면 곱셈을 먼저 하기 때문에 다른 식이 돼요.',
        words: a + ' × (어떤 수 ' + sg(b) + ') = ' + c,
        wrong: [[E([[a, 'x'], [b, '']], [[c, '']]), 'no-paren', '괄호가 빠졌어요. 이 식은 $x$에만 ' + josa(a, '을/를') + ' 곱한 것이에요. ' + (b > 0 ? '더한' : '뺀') + ' 결과 전체를 ' + a + '배 하려면 괄호로 묶어야 해요.'],
          [E([[1, 'x'], [a * b, '']], [[c, '']]), 'last-only', '뒤의 수에만 ' + josa(a, '을/를') + ' 곱했어요. ' + a + '배 하는 것은 $x$' + op(b, 'adj') + ' 결과 전체예요. 괄호로 묶어서 곱해요.'],
          [E([['g', a, [[1, 'x'], [-b, '']]]], [[c, '']]), 'op-flip', b > 0 ? '더한다고 했는데 뺐어요. 괄호 안은 $x + ' + b + '$' + pj(b, '이/가') + ' 되어야 해요.' : '뺀다고 했는데 더했어요. 괄호 안은 $x - ' + (-b) + '$' + pj(b, '이/가') + ' 되어야 해요.']] };
    },
    equal: function (q) {
      var a = q.a, b = q.b, c = q.c, x = q.x, d = (a - c) * x + b;
      if (!d || abs(d) > 40) return null;
      return { ok: a * x + b === c * x + d, text: '어떤 수 $x$의 ' + a + '배' + op(b, 'adj') + ' 수는 ' + (c === 1 ? '$x$' : '$x$의 ' + c + '배') + op(d, 'adj') + ' 수와 같아요.' + ASK,
        ans: E([[a, 'x'], [b, '']], [[c, 'x'], [d, '']]),
        tip: '"~와 같아요"가 등호 자리예요. 그 앞에 나온 말이 등호의 왼쪽, 뒤에 나온 말이 오른쪽으로 가요. 왼쪽은 $x$의 ' + a + '배' + op(b, 'adj') + ' 수, 오른쪽은 ' + (c === 1 ? '$x$' : '$x$의 ' + c + '배') + op(d, 'adj') + ' 수예요. 양쪽 모두에 $x$가 들어가요.',
        words: '(어떤 수의 ' + a + '배) ' + sg(b) + ' = (' + timesOf(c) + ') ' + sg(d),
        wrong: [[E([['g', a, [[1, 'x'], [b, '']]]], [[c, 'x'], [d, '']]), 'group', '왼쪽을 괄호로 묶으면 "' + (b > 0 ? '더한' : '뺀') + ' 다음 ' + a + '배 한다"는 뜻이 돼요. 이 문제는 먼저 ' + a + '배를 하고 그다음에 ' + (b > 0 ? '더해요.' : '빼요.')],
          [E([[a, 'x'], [b, '']], [[d, '']]), 'dropped-x', '오른쪽에서 $x$가 빠졌어요. 오른쪽도 어떤 수' + (c === 1 ? '' : '의 ' + c + '배') + op(d, 'adj') + ' 수라서 $x$가 들어가야 해요.'],
          [E([[a, 'x'], [-b, '']], [[c, 'x'], [-d, '']]), 'op-flip', '더하기와 빼기가 반대로 쓰였어요. "더한"은 +, "뺀"은 −로 옮겨요. 문장을 한 덩어리씩 다시 읽어 보세요.']] };
    },
    buy: function (q) {
      var g = FOOD[q.i], p = q.p, e = q.e, x = q.x, T = p * x + e;
      return { ok: true, text: '한 ' + g[1] + '에 ' + p + '원인 ' + g[0] + ' $x$' + josa(g[1], '과/와') + ' ' + e + '원짜리 ' + josa(g[2], '을/를') + ' 샀더니 모두 ' + T + '원이었어요.' + ASK,
        ans: E([[p, 'x'], [e, '']], [[T, '']]),
        tip: g[0] + ' 한 ' + josa(g[1], '이/가') + ' ' + p + '원이니 $x$' + g[1] + '의 값은 $' + p + 'x$원이에요. ' + josa(g[2], '은/는') + ' 하나만 샀으니 ' + e + '원 그대로예요. 이 둘을 더한 것이 낸 돈 전체와 같아요.',
        words: '(' + g[0] + '의 값) + (' + g[2] + '의 값) = (전체 금액)',
        wrong: [['(' + p + ' + ' + e + ')x = ' + T, 'group', '괄호로 묶으면 ' + g[2].split(' ')[0] + '도 $x$개 산 것이 돼요. ' + e + '원짜리는 하나만 샀으니 $x$를 곱하지 않아요.'],
          [E([[p, ''], [e, 'x']], [[T, '']]), 'swapped', '$x$를 엉뚱한 값에 곱했어요. $x$' + josa(g[1], '을/를') + ' 산 것은 ' + p + '원짜리 ' + josa(g[0], '이에요/예요') + '. 그래서 $' + p + 'x$가 되어야 해요.'],
          [E([[p, 'x']], [[T, ''], [e, '']]), 'side', e + '원을 전체 금액에 더했어요. ' + g[0] + '의 값과 ' + e + '원을 더한 것이 전체 금액이니, ' + e + '원은 $' + p + 'x$와 같은 쪽에 있어야 해요.']] };
    },
    change: function (q) {
      var g = PENS[q.i], p = q.p, x = q.x, M = q.M, r = M - p * x;
      if (r <= 0) return null;
      return { ok: true, text: '한 ' + g[1] + '에 ' + p + '원인 ' + g[0] + ' $x$' + josa(g[1], '을/를') + ' 사고 ' + M + '원을 냈더니 ' + r + '원을 거슬러 받았어요.' + ASK,
        ans: E([[M, ''], [-p, 'x']], [[r, '']]),
        tip: g[0] + ' $x$' + g[1] + '의 값은 $' + p + 'x$원이에요. 거스름돈은 낸 돈에서 물건값을 빼고 남은 돈이에요. 큰 돈에서 작은 돈을 빼야 하니 빼는 순서에 주의해요.',
        words: '(낸 돈) − (물건값) = (거스름돈)',
        wrong: [[E([[p, 'x'], [-M, '']], [[r, '']]), 'order', '빼는 순서가 바뀌었어요. 거스름돈은 낸 돈에서 물건값을 뺀 것이에요. 물건값에서 낸 돈을 빼면 음수가 돼요.'],
          [E([[M, ''], [p, 'x']], [[r, '']]), 'added', '낸 돈과 물건값을 더했어요. 거스름돈은 낸 돈에서 물건값을 빼고 남은 돈이에요.'],
          [E([[p, 'x']], [[M, ''], [r, '']]), 'side', '물건값이 낸 돈보다 많아졌어요. 물건값은 낸 돈에서 거스름돈을 뺀 것이에요. 물건값에 거스름돈을 더해야 낸 돈이 돼요.']] };
    },
    age: function (q) {
      var f = FAMILY[q.i], k = q.kk, x = q.x, B = q.f - x, P = k * q.f - x;
      if (B < 1 || P - B < 18 || P - B > 45 || P > 85) return null;
      return { ok: P + x === k * (B + x), text: '올해 ' + josa(f[0], '은/는') + ' ' + P + '살, ' + josa(f[1], '은/는') + ' ' + B + '살이에요. $x$년 뒤에 ' + f[0] + '의 나이가 ' + f[1] + '의 나이의 ' + k + '배가 돼요.' + ASK,
        ans: E([[P, ''], [1, 'x']], [['g', k, [[B, ''], [1, 'x']]]]),
        tip: '나이는 누구나 똑같이 한 해에 한 살씩 늘어요. $x$년 뒤에는 두 사람 모두 $x$살을 더 먹어요. ' + josa(f[0], '은/는') + ' $(' + P + ' + x)$살, ' + josa(f[1], '은/는') + ' $(' + B + ' + x)$살이에요. ' + k + '배가 되는 것은 $x$년 뒤의 ' + f[1] + ' 나이 전체예요.',
        words: '(' + f[0] + '의 $x$년 뒤 나이) = ' + k + ' × (' + f[1] + '의 $x$년 뒤 나이)',
        wrong: [[E([[P, ''], [1, 'x']], [[k * B, ''], [1, 'x']]), 'no-paren', '올해 나이에만 ' + josa(k, '을/를') + ' 곱했어요. ' + k + '배가 되는 것은 $x$년 뒤의 나이 $(' + B + ' + x)$ 전체예요. 괄호로 묶어서 곱해요.'],
          [E([[P, '']], [['g', k, [[B, ''], [1, 'x']]]]), 'one-side', f[0] + '의 나이에 $x$를 더하지 않았어요. $x$년이 지나면 ' + f[1] + '뿐 아니라 ' + f[0] + '도 $x$살을 더 먹어요.'],
          [E([['g', k, [[P, ''], [1, 'x']]]], [[B, ''], [1, 'x']]), 'reversed', k + '배를 반대쪽에 곱했어요. 나이가 많은 쪽이 적은 쪽의 ' + k + '배예요. 그래서 적은 쪽 나이에 ' + josa(k, '을/를') + ' 곱해야 같아져요.']] };
    },
    round: function (q) {
      var a = q.a, b = q.b, x = q.x, T = x / a + x / b;
      if (!isInt(T) || T > 12) return null;
      return { ok: isInt(x / a) && isInt(x / b), text: '두 지점 사이를 갈 때는 시속 ' + a + ' km로, 올 때는 시속 ' + b + ' km로 다녀왔더니 모두 ' + T + '시간이 걸렸어요. 두 지점 사이의 거리를 $x$ km라고 할 때, 이 관계를 방정식으로 나타낸 것을 고르세요.',
        ans: '\\dfrac{x}{' + a + '} + \\dfrac{x}{' + b + '} = ' + T,
        tip: '문제에 나온 "' + T + '시간"은 시간이에요. 그래서 등호의 양쪽을 모두 시간으로 맞춰요. 시간은 거리를 속력으로 나눈 것이에요. 갈 때 걸린 시간과 올 때 걸린 시간을 각각 분수 꼴로 써요.',
        words: '(갈 때 걸린 시간) + (올 때 걸린 시간) = (전체 시간)',
        wrong: [[a + 'x + ' + b + 'x = ' + T, 'multiplied', '거리에 속력을 곱했어요. 시간은 (거리) ÷ (속력)이에요. 거리 $x$를 속력으로 나눈 분수 꼴로 써야 해요.'],
          ['\\dfrac{2x}{' + a + ' + ' + b + '} = ' + T, 'added-speed', '두 속력을 더해서 한꺼번에 나눴어요. 갈 때와 올 때는 속력이 다르니, 걸린 시간을 따로따로 구해서 더해야 해요.'],
          ['\\dfrac{' + a + '}{x} + \\dfrac{' + b + '}{x} = ' + T, 'flipped', '분자와 분모가 바뀌었어요. 시간은 (거리) ÷ (속력)이라서 거리 $x$가 분자(위), 속력이 분모(아래)예요.']] };
    },
    chase: function (q) {
      var a = q.a, b = q.b, t = q.t, x = q.x;
      return { ok: isInt(x) && a * (x + t) === b * x, text: '동생이 집을 나선 지 ' + t + '분 뒤에 형이 같은 길로 따라나섰어요. 동생은 분속 ' + a + ' m, 형은 분속 ' + b + ' m로 가요. 형은 집을 나선 지 $x$분 뒤에 동생을 만나요.' + ASK,
        ans: E([['g', a, [[1, 'x'], [t, '']]]], [[b, 'x']]),
        tip: '만나는 순간 두 사람이 집에서부터 간 거리는 같아요. 형이 $x$분 걸었다면 먼저 나선 동생은 그보다 ' + t + '분 더 걸었으니 $(x + ' + t + ')$분 걸었어요. 거리는 (속력) × (시간)이에요.',
        words: '(동생이 간 거리) = (형이 간 거리)',
        wrong: [[E([[a, 'x']], [['g', b, [[1, 'x'], [t, '']]]]), 'reversed', '더 오래 걸은 사람이 바뀌었어요. ' + t + '분 먼저 나선 사람은 동생이에요. 동생이 걸은 시간이 $(x + ' + t + ')$분이에요.'],
          [E([[a, 'x'], [t, '']], [[b, 'x']]), 'no-paren', '괄호가 빠졌어요. 동생이 걸은 시간 $(x + ' + t + ')$분 전체에 속력을 곱해야 거리가 돼요. 이 식은 거리에 시간 ' + josa(t, '을/를') + ' 더한 것이에요.'],
          [E([['g', a, [[1, 'x'], [-t, '']]]], [[b, 'x']]), 'minus', '동생이 걸은 시간을 형보다 짧게 썼어요. 동생은 먼저 나섰으니 형보다 ' + t + '분 더 걸었어요. 빼는 것이 아니라 더해요.']] };
    },
    share: function (q) {
      var g = GIFTS[q.i], a = q.a, b = q.b, x = q.x, r = q.r, s = (b - a) * x - r;
      if (s < 1 || s > 25) return null;
      return { ok: a * x + r === b * x - s, text: '학생 $x$명에게 ' + josa(g[0], '을/를') + ' 나누어 주려고 해요. 한 명에게 ' + a + g[1] + '씩 주면 ' + r + josa(g[1], '이/가') + ' 남고, ' + b + g[1] + '씩 주면 ' + s + josa(g[1], '이/가') + ' 모자라요.' + ASK,
        ans: E([[a, 'x'], [r, '']], [[b, 'x'], [-s, '']]),
        tip: '어떻게 나누어 주든 ' + g[0] + '의 전체 수는 변하지 않아요. ' + a + g[1] + '씩 주고 ' + r + josa(g[1], '이/가') + ' 남았다면 전체는 나누어 준 것보다 ' + r + g[1] + ' 많아요. ' + b + g[1] + '씩 주기에 ' + s + josa(g[1], '이/가') + ' 모자라다면 전체는 필요한 것보다 ' + s + g[1] + ' 적어요.',
        words: '(' + a + g[1] + '씩 줄 때의 전체 수) = (' + b + g[1] + '씩 줄 때의 전체 수)',
        wrong: [[E([[a, 'x'], [-r, '']], [[b, 'x'], [s, '']]), 'flip', '남는 것과 모자란 것의 부호가 반대예요. 남으면 전체가 나누어 준 것보다 많으니 +, 모자라면 전체가 필요한 것보다 적으니 −예요.'],
          [E([[a, 'x'], [r, '']], [[b, 'x'], [s, '']]), 'lack-plus', '모자란 수를 더했어요. ' + s + josa(g[1], '이/가') + ' 모자라다는 것은 전체가 필요한 수 $' + b + 'x$보다 ' + s + '만큼 적다는 뜻이에요. 그래서 빼요.'],
          [E([['g', a, [[1, 'x'], [r, '']]]], [['g', b, [[1, 'x'], [-s, '']]]]), 'group', '남거나 모자란 수를 학생 수에 더하고 뺐어요. ' + josa(r, '과/와') + ' ' + josa(s, '은/는') + ' 학생 수가 아니라 ' + g[0] + '의 수예요. 괄호 밖에 써야 해요.']] };
    }
  };
  var sLast = null, sP = null;
  var SP = function (v) { if (v.q !== sLast) { sP = SET[v.q.k](v.q); sLast = v.q; } return sP; };
  var setAll = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
  var setOk = function (v) {
    var p = SP(v), all;
    if (!p || p.ok !== true) return false;
    all = setAll(p);
    return holds(p.ans, v.q.x) && all.every(function (t, i) { return all.indexOf(t) === i; }) && p.wrong.every(function (w) { return !holds(w[0], v.q.x); });
  };
  var SET_IDS = ['group', 'times-as-add', 'op-flip', 'no-paren', 'last-only', 'dropped-x', 'swapped', 'side', 'order', 'added', 'one-side', 'reversed', 'multiplied', 'added-speed', 'flipped', 'minus', 'flip', 'lack-plus'];
  var WALK = [[2, 3], [3, 4], [3, 6], [4, 6], [2, 4], [3, 5], [4, 5], [2, 6], [5, 6]];
  var RIDE = [[10, 15], [12, 15], [10, 20], [12, 20], [15, 20], [12, 18], [15, 30], [20, 30], [12, 24], [18, 24]];
  var DRIVE = [[40, 60], [60, 80], [40, 80], [60, 90], [30, 60], [50, 75], [45, 90], [60, 120], [80, 120]];
  var pairOf = function (r) { var p = r.pick(r.pick([WALK, RIDE, DRIVE])); return r.int(0, 1) ? p : [p[1], p[0]]; };
  MH.defineType({
    id: 'B08.setup', unit: 'B08', version: 1, title: '식 세우기',
    answer: { kind: 'choice', options: function (v) { var all = setAll(SP(v)); return v.q.o.map(function (i) { return all[i]; }); } },
    levels: [
      { name: '어떤 수', vars: { q: sampler(function (r) {
          var k = r.pick(['times', 'both', 'equal']), a = r.int(2, 9);
          return { k: k, a: k === 'equal' ? r.int(3, 9) : a, b: pm(r, r.int(1, 12)), c: r.int(1, 2), x: r.int(2, 12), o: order4(r) };
        }) }, where: setOk },
      { name: '값 · 거스름돈 · 나이', vars: { q: sampler(function (r) {
          var k = r.pick(['buy', 'change', 'age']), p = 100 * r.int(3, 15), x = r.int(2, 9);
          if (k === 'buy') return { k: k, i: r.int(0, 4), p: p, e: 100 * r.int(5, 30), x: x, o: order4(r) };
          if (k === 'change') return { k: k, i: r.int(0, 4), p: p, x: x, M: [1000, 2000, 3000, 5000, 10000, 20000].filter(function (m) { return m > p * x; })[0], o: order4(r) };
          return { k: k, i: r.int(0, 3), kk: r.int(2, 4), f: r.int(8, 22), x: r.int(1, 12), o: order4(r) };
        }) }, where: setOk },
      { name: '거리 · 나누어 주기', vars: { q: sampler(function (r) {
          var k = r.pick(['round', 'chase', 'share']), pr, a;
          if (k === 'round') { pr = pairOf(r); return { k: k, a: pr[0], b: pr[1], x: lcm(pr[0], pr[1]) * r.int(1, 3), o: order4(r) }; }
          if (k === 'chase') { a = 10 * r.int(4, 8); pr = { k: k, a: a, b: a + 10 * r.int(1, 8), t: r.int(2, 15), o: order4(r) }; pr.x = pr.a * pr.t / (pr.b - pr.a); return pr; }
          a = r.int(2, 6);
          return { k: k, i: r.int(0, 3), a: a, b: a + r.int(1, 4), x: r.int(3, 15), r: r.int(1, 20), o: order4(r) };
        }) }, where: setOk }
    ],
    prompt: function (v) { return { text: SP(v).text }; },
    solve: function (v) { return SP(v).ans; },
    /* 검산: 참인 값(x)을 넣으면 정답 보기만 성립하고, 상황대로 직접 계산해도 맞다 */
    verify: function (v, ans) {
      var p = SP(v), all = setAll(p);
      return p.ok === true && ans === p.ans && all.length === 4 && holds(p.ans, v.q.x) && p.wrong.every(function (w) { return !holds(w[0], v.q.x); });
    },
    hints: function (v) {
      var p = SP(v);
      return [
        '문장을 방정식으로 옮기는 것은 우리말을 수학의 말로 번역하는 일이에요. 먼저 "같다"는 뜻의 말을 찾아요. "~이 돼요", "~와 같아요", "모두 ~이었어요"가 등호(=)가 들어갈 자리예요. 그 앞뒤의 양을 각각 $x$를 써서 나타내면 돼요.',
        p.tip,
        '말로 먼저 식을 세워 봐요: ' + p.words + '. 여기에 문제의 수와 $x$를 하나씩 넣어요. 보기를 고를 때는 괄호가 있어야 하는지, 더하기와 빼기가 맞는지, $x$가 알맞은 수에 곱해졌는지를 차례로 확인해요.'
      ];
    },
    steps: function (v) {
      var p = SP(v);
      return [{ say: p.tip }, { say: '말로 식을 세우면 ' + p.words + '. 여기에 수와 $x$를 넣어요.', tex: p.ans, value: p.ans }];
    },
    mistakes: SET_IDS.map(function (id) {
      var find = function (v) { return SP(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
      return { id: id, wrong: function (v) { var w = find(v); return w ? w[0] : null; }, explain: function (v) { var w = find(v); return w ? w[2] : ''; } };
    })
  });

  /* ── B08.number 수에 관한 문제 ─────────────────────────
     times  ax + b = c · both  a(x + b) = c · equal  ax + b = cx + d
     consec 연속하는 세 수(step 1: 자연수, 2: 짝수 · 홀수) · diff 합과 차가 주어진 두 수 · swap · sumtimes 자릿수 */
  var WHICH = ['가장 작은 수', '가운데 수', '가장 큰 수'];
  wordType({
    id: 'B08.number', title: '수에 관한 문제',
    intro: '문장으로 된 문제는 세 걸음으로 풀어요. ① 모르는 수를 $x$로 놓고 ② 문장을 식으로 옮겨 방정식을 세우고 ③ 그 방정식을 풀어요. 우리말을 수학의 말로 번역한다고 생각하면 돼요.',
    kinds: {
      times: function (q) {
        var a = q.a, b = q.b, x = q.x, c = a * x + b;
        return { x: x, unit: '', ok: c > 0 && (c - b) / a === x, text: '어떤 수의 ' + a + '배' + op(b, 'if') + ' ' + josa(c, '이/가') + ' 돼요. 어떤 수를 구하세요.',
          let: '어떤 수를', words: '(어떤 수의 ' + a + '배) ' + sg(b) + ' = ' + c, L: [[a, 'x'], [b, '']], R: [[c, '']],
          tip: '"어떤 수의 ' + a + '배"는 어떤 수를 ' + a + '번 더한 것이라서 $' + a + 'x$로 써요. 여기' + op(b, 'if') + ' ' + josa(c, '이/가') + ' 된다고 했어요. "~이 돼요"가 등호(=) 자리예요. 문장의 차례대로 옮기면 (어떤 수의 ' + a + '배) ' + sg(b) + ' = ' + josa(c, '이에요/예요') + '.',
          wrong: { 'same-op': (c + b) / a, group: c / a - b, half: c - b } };
      },
      both: function (q) {
        var a = q.a, b = q.b, x = q.x, c = a * (x + b);
        return { x: x, unit: '', ok: c > 0 && c / a - b === x, text: '어떤 수' + op(b, 'then') + ' ' + a + '배 하면 ' + josa(c, '이/가') + ' 돼요. 어떤 수를 구하세요.',
          let: '어떤 수를', words: a + ' × (어떤 수 ' + sg(b) + ') = ' + c, L: [['g', a, [[1, 'x'], [b, '']]]], R: [[c, '']],
          tip: '순서에 주의해요. 먼저 어떤 수' + op(b, 'then') + ', 그 결과를 통째로 ' + a + '배 해요. 먼저 계산하는 부분은 괄호로 묶어서 한 덩어리로 만들어요. 괄호가 없으면 $x$에만 ' + josa(a, '을/를') + ' 곱한 다른 식이 돼요. 말로 쓰면 ' + a + ' × (어떤 수 ' + sg(b) + ') = ' + josa(c, '이에요/예요') + '.',
          wrong: { 'no-paren': (c - b) / a, half: c / a } };
      },
      equal: function (q) {
        var a = q.a, b = q.b, c = q.c, x = q.x, d = (a - c) * x + b;
        if (!d || abs(d) > 40) return null;
        return { x: x, unit: '', ok: a * x + b === c * x + d, text: '어떤 수의 ' + a + '배' + op(b, 'adj') + ' 수는 ' + timesOf(c) + op(d, 'adj') + ' 수와 같아요. 어떤 수를 구하세요.',
          let: '어떤 수를', words: '(어떤 수의 ' + a + '배) ' + sg(b) + ' = (' + timesOf(c) + ') ' + sg(d), L: [[a, 'x'], [b, '']], R: [[c, 'x'], [d, '']],
          tip: '"~와 같아요"가 등호(=) 자리예요. 그 앞에 나온 말이 등호의 왼쪽, 뒤에 나온 말이 오른쪽으로 가요. 왼쪽은 어떤 수의 ' + a + '배' + op(b, 'adj') + ' 수, 오른쪽은 ' + timesOf(c) + op(d, 'adj') + ' 수예요. 양쪽 모두에 $x$가 들어가는 방정식이 돼요.',
          wrong: { 'keep-x': (d - b) / (a + c), 'keep-const': (d + b) / (a - c) } };
      },
      consec: function (q) {
        var x = q.x, st = q.step, S = 3 * x + 3 * st, name = st === 1 ? '자연수' : x % 2 ? '홀수' : '짝수', ask = q.ask, ans = x + ask * st, lo = ans - ask * st;
        return { x: x, ans: ans, ansTex: ask ? 'x + ' + ask * st : 'x', unit: '', ok: lo + (lo + st) + (lo + 2 * st) === S && (st === 1 || lo % 2 === x % 2),
          text: '연속하는 세 ' + name + '의 합이 ' + josa(S, '이에요/예요') + '. 세 수 가운데 ' + WHICH[ask] + '를 구하세요.',
          let: '세 수 가운데 가장 작은 수를', terms: '그러면 나머지 두 수는 $x + ' + st + '$, $x + ' + 2 * st + '$' + pj(2 * st, '으로/로') + ' 쓸 수 있어요.',
          words: '(세 수의 합) = ' + S, L: [[1, 'x'], ['g', 1, [[1, 'x'], [st, '']]], ['g', 1, [[1, 'x'], [2 * st, '']]]], R: [[S, '']],
          tip: st === 1 ? '연속하는 자연수는 달력에 나란히 적힌 날짜처럼 차례로 이어지는 수예요. 바로 다음 수는 앞의 수보다 하나 커요. 그래서 가장 작은 수 하나만 $x$로 정하면 나머지 두 수도 $x$로 나타낼 수 있어요. 세 수를 모두 더한 것이 ' + josa(S, '과/와') + ' 같다고 식을 세워요.'
            : '연속하는 ' + name + '는 하나 건너 하나씩 이어지는 수예요. 다음 ' + name + '는 앞의 수보다 둘 커요(하나만 크면 ' + (name === '짝수' ? '홀수' : '짝수') + '가 돼요). 그래서 가장 작은 수 하나만 $x$로 정하면 나머지 두 수도 $x$로 나타낼 수 있어요. 세 수를 모두 더한 것이 ' + josa(S, '과/와') + ' 같다고 식을 세워요.',
          last: '구하는 것은 ' + WHICH[ask] + '예요. 가장 작은 수 $x$에 ' + josa(ask * st, '을/를') + ' 더해요.', lastTip: '$x$는 가장 작은 수예요. 문제에서 묻는 것은 ' + WHICH[ask] + '이니, $x$를 구한 다음 한 번 더 계산해야 해요.',
          wrong: { which: ask ? x : undefined, middle: ask !== 1 ? S / 3 : undefined, gap: st === 2 ? x + 1 + ask : undefined } };
      },
      diff: function (q) {
        var x = q.x, d = q.d, k = q.kk, big = k * x + d, S = x + big, ask = q.ask, ans = ask ? big : x;
        return { x: x, ans: ans, ansTex: ask ? poly([[k, 'x'], [d, '']]) : 'x', unit: '', ok: (ask ? ans + (ans - d) / k : ans + k * ans + d) === S,
          text: '두 자연수가 있어요. 큰 수는 작은 수' + (k === 1 ? '' : '의 ' + k + '배') + '보다 ' + d + '만큼 크고, 두 수의 합은 ' + josa(S, '이에요/예요') + '. ' + (ask ? '큰 수' : '작은 수') + '를 구하세요.',
          let: '작은 수를', terms: '그러면 큰 수는 $' + poly([[k, 'x'], [d, '']]) + '$' + pj(d, '이에요/예요') + '.',
          words: '(작은 수) + (큰 수) = ' + S, L: [[1, 'x'], ['g', 1, [[k, 'x'], [d, '']]]], R: [[S, '']],
          tip: '모르는 수가 둘이지만 문자는 하나만 써요. 한 수를 $x$로 정하면 다른 수는 문제에 적힌 관계로 나타낼 수 있어요. 큰 수는 작은 수' + (k === 1 ? '' : '의 ' + k + '배') + '보다 ' + d + '만큼 크다고 했으니, 작은 수' + (k === 1 ? '' : '의 ' + k + '배') + '에 ' + josa(d, '을/를') + ' 더한 것이 큰 수예요. 그 두 수를 더한 것이 ' + josa(S, '이에요/예요') + '.',
          last: '구하는 것은 큰 수예요. 큰 수를 나타낸 식에 $x$의 값을 넣어요.', lastTip: '$x$는 작은 수예요. 문제에서 묻는 것은 큰 수이니, $x$를 구한 다음 큰 수를 나타낸 식에 넣어 한 번 더 계산해요.',
          wrong: { which: ask ? x : big, 'no-diff': ask ? undefined : S / (k + 1) } };
      },
      swap: function (q) {
        var a = q.a, x = q.x, k = 9 * (x - a), n = 10 * a + x;
        if (!k) return null;
        return { x: x, ans: n, ansTex: 10 * a + ' + x', unit: '', ok: Math.floor(n / 10) === a && (n % 10) * 10 + a - n === k,
          text: '십의 자리 숫자가 ' + a + '인 두 자리 자연수가 있어요. 이 수의 십의 자리 숫자와 일의 자리 숫자를 서로 바꾼 수는 처음 수보다 ' + abs(k) + '만큼 ' + (k > 0 ? '커요' : '작아요') + '. 처음 수를 구하세요.',
          let: '처음 수의 일의 자리 숫자를', terms: '그러면 처음 수는 $' + 10 * a + ' + x$, 자리를 바꾼 수는 $10x + ' + a + '$' + pj(a, '이에요/예요') + '.',
          words: '(바꾼 수) = (처음 수) ' + sg(k), L: [[10, 'x'], [a, '']], R: [[10 * a, ''], [1, 'x'], [k, '']],
          tip: '두 자리 수는 숫자 두 개를 나란히 쓴 것이 아니라, (십의 자리 숫자)를 열 배 한 것에 (일의 자리 숫자)를 더한 수예요. 십 원짜리 동전 몇 개와 일 원짜리 동전 몇 개를 합친 금액과 같아요. 자리를 바꾸면 열 배가 되는 숫자가 바뀌어요. 바꾼 수가 처음 수보다 ' + abs(k) + '만큼 ' + (k > 0 ? '크다' : '작다') + '는 것을 식으로 옮겨요.',
          last: '구하는 것은 처음 수예요. 십의 자리 숫자가 ' + a + ', 일의 자리 숫자가 $x$인 수예요.', lastTip: '$x$는 일의 자리 숫자 하나예요. 문제에서 묻는 것은 두 자리 수이니, 십의 자리 숫자와 합쳐서 답해요.',
          wrong: { digit: x, swapped: 10 * x + a } };
      },
      sumtimes: function (q) {
        var x = q.x, d = q.d, m = q.m, n = 11 * x + d, r = n - m * (2 * x + d);
        if (x + d > 9 || r < 0 || r > 30) return null;
        return { x: x, ans: n, ansTex: '10x + (x + ' + d + ')', unit: '', ok: n % 10 - Math.floor(n / 10) === d && n === m * (n % 10 + Math.floor(n / 10)) + r,
          text: '일의 자리 숫자가 십의 자리 숫자보다 ' + d + '만큼 큰 두 자리 자연수가 있어요. 이 수는 각 자리 숫자의 합의 ' + m + '배' + (r ? '보다 ' + r + '만큼 커요' : '와 같아요') + '. 이 자연수를 구하세요.',
          let: '십의 자리 숫자를', terms: '그러면 일의 자리 숫자는 $x + ' + d + '$' + pj(d, '이고/고') + ', 이 수는 $10x + (x + ' + d + ')$' + pj(d, '이에요/예요') + '.',
          words: '(두 자리 수) = ' + m + ' × (각 자리 숫자의 합)' + (r ? ' + ' + r : ''), L: [[10, 'x'], ['g', 1, [[1, 'x'], [d, '']]]], R: [['g', m, [[2, 'x'], [d, '']]]].concat(r ? [[r, '']] : []),
          tip: '두 자리 수는 (십의 자리 숫자)를 열 배 한 것에 (일의 자리 숫자)를 더한 수예요. 십 원짜리 동전과 일 원짜리 동전으로 금액을 만드는 것과 같아요. 각 자리 숫자의 합은 두 숫자를 그냥 더한 것이라서 $x + (x + ' + d + ')$, 정리하면 $2x + ' + d + '$' + pj(d, '이에요/예요') + '. 이 합의 ' + m + '배' + (r ? '에 ' + josa(r, '을/를') + ' 더한 것이' : '가') + ' 처음의 두 자리 수와 같아요.',
          last: '구하는 것은 두 자리 수예요. 수를 나타낸 식에 $x$의 값을 넣어요.', lastTip: '$x$는 십의 자리 숫자 하나예요. 문제에서 묻는 것은 두 자리 수이니, 수를 나타낸 식에 넣어 한 번 더 계산해요.',
          wrong: { digit: x, 'digit-sum': 2 * x + d } };
      }
    },
    levels: [
      { name: '어떤 수', vars: { q: sampler(function (r) {
          var k = r.pick(['times', 'times', 'both', 'equal']);
          return { k: k, a: k === 'equal' ? r.int(3, 9) : r.int(2, 9), b: pm(r, r.int(1, 15)), c: r.int(1, 2), x: r.int(2, 12) };
        }) } },
      { name: '연속하는 수 · 두 수', vars: { q: sampler(function (r) {
          if (r.int(0, 2)) return { k: 'consec', x: r.int(5, 45), step: r.pick([1, 1, 2]), ask: r.int(0, 2) };
          return { k: 'diff', x: r.int(3, 30), d: r.int(1, 12), ask: r.int(0, 1), kk: r.pick([1, 1, 2, 3]) };
        }) } },
      { name: '자릿수', minDistinct: 120, vars: { q: sampler(function (r) {
          var x = r.int(1, 8);
          if (r.int(0, 2) === 0) return { k: 'swap', a: r.int(1, 9), x: r.int(1, 9) };
          return { k: 'sumtimes', x: x, d: r.int(1, 9 - x), m: r.int(2, 5) };
        }) } }
    ],
    mistakes: [
      ['same-op', function () { return '반대 계산을 해야 하는데 같은 계산을 했어요. 더해진 수는 양쪽에서 빼고, 빼진 수는 양쪽에 더해야 없어져요. 이항하면 부호가 바뀐다고 기억해요.'; }],
      ['group', function () { return '먼저 나누고 나서 더하거나 뺐어요. 그것은 "더한(뺀) 다음 몇 배 한" 식의 풀이예요. 이 문제는 몇 배를 먼저 한 것이라서, 더하거나 뺀 수부터 없앤 다음에 나눠요.'; }],
      ['no-paren', function () { return '괄호 없이 풀었어요. 더하거나 뺀 결과 전체를 몇 배 한 것이라서 괄호로 묶어야 해요. 괄호 앞의 수는 괄호 안의 모든 항에 곱해져요.'; }],
      ['half', function () { return '풀다가 멈췄어요. 아직 $x$에 수가 곱해져 있거나 더해져 있어요. 왼쪽에 $x$만 남을 때까지 계산해야 해요.'; }],
      ['keep-x', function () { return '문자가 있는 항을 옮기면서 부호를 바꾸지 않았어요. 등호를 건너는 항은 +는 −로, −는 +로 바뀌어요.'; }],
      ['keep-const', function () { return '수만 있는 항을 옮기면서 부호를 바꾸지 않았어요. 등호를 건너는 항은 +는 −로, −는 +로 바뀌어요.'; }],
      ['which', function (p) { return '방정식은 맞게 풀었지만 묻는 수가 아니에요. $x$로 놓은 것이 무엇인지, 문제가 묻는 것이 무엇인지 다시 읽어 보세요. 구하는 것은 $' + p.ansTex + '$의 값이에요.'; }],
      ['middle', function () { return '합을 3으로 나누면 가운데 수가 나와요. 문제가 묻는 것은 가운데 수가 아니에요. 가운데 수에서 얼마를 더하거나 빼야 하는지 생각해 보세요.'; }],
      ['gap', function () { return '세 수를 하나씩 커지는 수로 놓았어요. 연속하는 짝수나 홀수는 둘씩 커져요. 가장 작은 수가 $x$이면 나머지는 $x + 2$, $x + 4$예요.'; }],
      ['no-diff', function () { return '합을 똑같이 나누기만 했어요. 두 수는 크기가 달라요. 큰 수를 작은 수 $x$로 나타낸 다음, 두 식을 더한 것이 합과 같다고 식을 세워요.'; }],
      ['digit', function () { return '$x$의 값(숫자 하나)을 답으로 썼어요. 문제가 묻는 것은 두 자리 수예요. 십의 자리 숫자와 일의 자리 숫자를 합쳐서 답해요.'; }],
      ['swapped', function () { return '자리를 바꾼 수를 답으로 썼어요. 문제가 묻는 것은 바꾸기 전의 처음 수예요. 십의 자리 숫자는 문제에 주어져 있어요.'; }],
      ['digit-sum', function () { return '각 자리 숫자의 합을 답으로 썼어요. 문제가 묻는 것은 두 자리 수예요. 십의 자리 숫자를 열 배 한 것에 일의 자리 숫자를 더해요.'; }]
    ]
  });

  /* ── B08.count 개수 · 가격 · 나이 ──────────────────────
     buy  px + e = T · change  px + r = M · two  px + e(N − x) = T · share  ax + r = bx − s
     age  P + x = k(B + x) · save  S + ax = k(B + bx) */
  var LATER = '나이나 저금처럼 시간이 지나면서 달라지는 양을 다루는 문제도 같은 차례로 풀어요. ① 구하는 것을 $x$로 놓고 ② 그때의 양을 $x$로 나타내 등호로 잇고 ③ 방정식을 풀어요. 달력을 앞으로 넘겨 가며 그날의 값을 식으로 적어 보는 것과 같아요.';
  var TWO = [['사과', '귤', '개'], ['볼펜', '연필', '자루'], ['어른 입장권', '어린이 입장권', '장'], ['장미', '튤립', '송이'], ['큰 화분', '작은 화분', '개']];
  wordType({
    id: 'B08.count', title: '개수 · 가격 · 나이',
    intro: '물건을 사거나 나누는 문제도 같은 차례로 풀어요. ① 구하는 것을 $x$로 놓고 ② 같은 양을 두 가지 방법으로 나타내 등호로 잇고 ③ 방정식을 풀어요. 영수증을 거꾸로 읽어 몇 개를 샀는지 알아내는 것과 같아요.',
    kinds: {
      buy: function (q) {
        var g = FOOD[q.i], p = q.p, e = q.e, x = q.x, T = p * x + e;
        return { x: x, unit: g[1], ok: (T - e) / p === x, text: '한 ' + g[1] + '에 ' + p + '원인 ' + g[0] + ' 몇 ' + josa(g[1], '과/와') + ' ' + e + '원짜리 ' + josa(g[2], '을/를') + ' 샀더니 모두 ' + T + '원이었어요. ' + josa(g[0], '은/는') + ' 몇 ' + g[1] + ' 샀을까요?',
          let: g[0] + '의 수를', words: '(' + g[0] + '의 값) + (' + g[2] + '의 값) = (전체 금액)', L: [[p, 'x'], [e, '']], R: [[T, '']],
          tip: g[0] + ' 한 ' + josa(g[1], '이/가') + ' ' + p + '원이니 $x$' + g[1] + '의 값은 ' + p + '원을 $x$번 더한 $' + p + 'x$원이에요. ' + josa(g[2], '은/는') + ' 하나만 샀으니 ' + e + '원 그대로예요. 이 둘을 더한 것이 낸 돈 ' + T + '원과 같아요. 말로 쓰면 (' + g[0] + '의 값) + (' + g[2] + '의 값) = (전체 금액)이에요.',
          wrong: { 'ignore-extra': T / p, 'same-op': (T + e) / p, half: T - e } };
      },
      change: function (q) {
        var g = PENS[q.i], p = q.p, x = q.x, M = q.M, r = M - p * x;
        if (!(r > 0)) return null;
        return { x: x, unit: g[1], ok: (M - r) / p === x, text: '한 ' + g[1] + '에 ' + p + '원인 ' + g[0] + ' 몇 ' + josa(g[1], '을/를') + ' 사고 ' + M + '원을 냈더니 ' + r + '원을 거슬러 받았어요. ' + josa(g[0], '은/는') + ' 몇 ' + g[1] + ' 샀을까요?',
          let: g[0] + '의 수를', words: '(물건값) + (거스름돈) = (낸 돈)', L: [[p, 'x'], [r, '']], R: [[M, '']],
          tip: g[0] + ' $x$' + g[1] + '의 값은 $' + p + 'x$원이에요. 낸 돈 ' + M + '원은 물건값과 거스름돈으로 나뉘어요. 가게 주인이 물건값만 갖고 나머지 ' + r + '원을 돌려준 것이니까요. 그래서 물건값에 거스름돈을 더하면 낸 돈이 돼요.',
          wrong: { added: (M + r) / p, 'no-change': M / p, half: M - r } };
      },
      two: function (q) {
        var g = TWO[q.i], p = q.p, e = q.e, N = q.N, x = q.x, T = p * x + e * (N - x), ask = q.ask, ans = ask ? N - x : x;
        if (p === e || x >= N || ((q.i === 2 || q.i === 4) && p < e)) return null;
        return { x: x, ans: ans, ansTex: ask ? N + ' - x' : 'x', unit: g[2], ok: (ask ? p * (N - ans) + e * ans : p * ans + e * (N - ans)) === T,
          text: '한 ' + g[2] + '에 ' + p + '원인 ' + josa(g[0], '과/와') + ' 한 ' + g[2] + '에 ' + e + '원인 ' + josa(g[1], '을/를') + ' 합해서 ' + N + g[2] + ' 샀더니 모두 ' + T + '원이었어요. ' + josa(g[ask], '은/는') + ' 몇 ' + g[2] + ' 샀을까요?',
          let: g[0] + '의 수를', terms: '그러면 ' + g[1] + '의 수는 $' + N + ' - x$예요.',
          words: '(' + g[0] + '의 값) + (' + g[1] + '의 값) = (전체 금액)', L: [[p, 'x'], ['g', e, [[N, ''], [-1, 'x']]]], R: [[T, '']],
          tip: '두 가지를 합해서 ' + N + josa(g[2], '이에요/예요') + '. ' + josa(g[0], '을/를') + ' $x$' + g[2] + ' 샀다면 ' + josa(g[1], '은/는') + ' 나머지인 $(' + N + ' - x)$' + josa(g[2], '이에요/예요') + '. ' + g[0] + '의 값은 $' + p + 'x$원, ' + g[1] + '의 값은 ' + e + '원에 $(' + N + ' - x)$를 곱한 것이에요. 이 둘을 더하면 전체 금액 ' + T + '원이 돼요.',
          last: '구하는 것은 ' + g[1] + '의 수예요. 전체 ' + N + g[2] + '에서 ' + g[0] + '의 수 $x$를 빼요.', lastTip: '$x$는 ' + g[0] + '의 수예요. 문제에서 묻는 것은 ' + g[1] + '의 수이니, $x$를 구한 다음 전체 수에서 빼요.',
          wrong: { which: ask ? x : N - x, 'same-count': T / (p + e) } };
      },
      share: function (q) {
        var g = GIFTS[q.i], a = q.a, b = q.b, x = q.x, r = q.r, s = (b - a) * x - r, ask = q.ask, all = a * x + r, ans = ask ? all : x, w = (r - s) / (b - a);
        if (s < 1 || s > 25) return null;
        return { x: x, ans: ans, ansTex: ask ? a + 'x + ' + r : 'x', unit: ask ? g[1] : '명', ok: ask ? (ans - r) / a === (ans + s) / b : a * ans + r === b * ans - s,
          text: '학생들에게 ' + josa(g[0], '을/를') + ' 나누어 주려고 해요. 한 명에게 ' + a + g[1] + '씩 주면 ' + r + josa(g[1], '이/가') + ' 남고, ' + b + g[1] + '씩 주면 ' + s + josa(g[1], '이/가') + ' 모자라요. ' + (ask ? josa(g[0], '은/는') + ' 모두 몇 ' + g[1] + '일까요?' : '학생은 모두 몇 명일까요?'),
          let: '학생 수를', terms: '그러면 ' + g[0] + '의 전체 수는 $' + a + 'x + ' + r + '$' + pj(r, '으로/로') + '도, $' + b + 'x - ' + s + '$' + pj(s, '으로/로') + '도 쓸 수 있어요.',
          words: '(' + a + g[1] + '씩 줄 때의 전체 수) = (' + b + g[1] + '씩 줄 때의 전체 수)', L: [[a, 'x'], [r, '']], R: [[b, 'x'], [-s, '']],
          tip: '어떻게 나누어 주든 ' + g[0] + '의 전체 수는 변하지 않아요. 이것이 등호로 이을 "같은 양"이에요. ' + a + g[1] + '씩 주고 ' + r + josa(g[1], '이/가') + ' 남았다면 전체는 나누어 준 것보다 ' + r + g[1] + ' 많아요(더하기). ' + b + g[1] + '씩 주기에 ' + s + josa(g[1], '이/가') + ' 모자라다면 전체는 필요한 것보다 ' + s + g[1] + ' 적어요(빼기).',
          last: '구하는 것은 ' + g[0] + '의 전체 수예요. 전체 수를 나타낸 식에 $x$의 값을 넣어요.', lastTip: '$x$는 학생 수예요. 문제에서 묻는 것은 ' + g[0] + '의 수이니, $x$를 구한 다음 전체 수를 나타낸 식에 넣어요.',
          wrong: { which: ask ? x : all, 'lack-plus': ask ? a * w + r : w } };
      },
      age: function (q) {
        var f = FAMILY[q.i], k = q.kk, x = q.x, B = q.f - x, P = k * q.f - x;
        if (B < 1 || P - B < 18 || P - B > 45 || P > 85) return null;
        return { x: x, unit: '년', intro: LATER, ok: P + x === k * (B + x), text: '올해 ' + josa(f[0], '은/는') + ' ' + P + '살이고 ' + josa(f[1], '은/는') + ' ' + B + '살이에요. ' + f[0] + '의 나이가 ' + f[1] + '의 나이의 ' + k + '배가 되는 것은 몇 년 뒤일까요?',
          let: '몇 년 뒤인지를', terms: '$x$년 뒤에 ' + josa(f[0], '은/는') + ' $(' + P + ' + x)$살, ' + josa(f[1], '은/는') + ' $(' + B + ' + x)$살이에요.',
          words: '(' + f[0] + '의 $x$년 뒤 나이) = ' + k + ' × (' + f[1] + '의 $x$년 뒤 나이)', L: [[P, ''], [1, 'x']], R: [['g', k, [[B, ''], [1, 'x']]]],
          tip: '나이는 누구나 똑같이 한 해에 한 살씩 늘어요. 그래서 $x$년이 지나면 두 사람 모두 $x$살을 더 먹어요. 한 사람만 나이를 먹는 것이 아니에요. ' + k + '배가 되는 것은 올해 나이가 아니라 $x$년 뒤의 나이이니, ' + f[1] + '의 $x$년 뒤 나이 전체를 괄호로 묶어 ' + josa(k, '을/를') + ' 곱해요.',
          wrong: { 'one-side': P / k - B, 'age-of': B + x } };
      },
      save: function (q) {
        var k = q.kk, x = q.x, a = q.a, b = q.b, B = q.B, S = k * (B + b * x) - a * x;
        if (S < 500 || S > 40000 || S === k * B || a === k * b) return null;
        return { x: x, unit: '개월', intro: LATER, ok: S + a * x === k * (B + b * x),
          text: '지금 형의 저금통에는 ' + S + '원, 동생의 저금통에는 ' + B + '원이 들어 있어요. 이제부터 매달 형은 ' + a + '원씩, 동생은 ' + b + '원씩 저금한다면, 형의 저금액이 동생의 저금액' + (k === 1 ? '과 같아지는' : '의 ' + k + '배가 되는') + ' 것은 몇 개월 뒤일까요?',
          let: '몇 개월 뒤인지를', terms: '$x$개월 뒤에 형의 저금액은 $(' + S + ' + ' + a + 'x)$원, 동생의 저금액은 $(' + B + ' + ' + b + 'x)$원이에요.',
          words: '(형의 $x$개월 뒤 저금액) = ' + (k === 1 ? '' : k + ' × ') + '(동생의 $x$개월 뒤 저금액)', L: [[S, ''], [a, 'x']], R: k === 1 ? [[B, ''], [b, 'x']] : [['g', k, [[B, ''], [b, 'x']]]],
          tip: '저금액은 (지금 있는 돈)에 (매달 넣는 돈) × (지난 달 수)를 더한 것이에요. 매달 ' + a + '원씩 $x$개월 동안 넣으면 $' + a + 'x$원이 늘어요. 형과 동생의 $x$개월 뒤 저금액을 각각 식으로 쓴 다음, ' + (k === 1 ? '둘이 같다고 등호로 이어요.' : '동생의 저금액 전체를 괄호로 묶어 ' + josa(k, '을/를') + ' 곱한 것이 형의 저금액과 같다고 식을 세워요.'),
          wrong: { 'first-only': k === 1 ? undefined : (k * B - S) / (a - b), 'one-side': (S - k * B) / (k * b) } };
      }
    },
    levels: [
      { name: '물건값과 거스름돈', vars: { q: sampler(function (r) {
          var p = 100 * r.int(3, 15), x = r.int(2, 9);
          if (r.int(0, 1)) return { k: 'buy', i: r.int(0, 4), p: p, e: 100 * r.int(5, 30), x: x };
          return { k: 'change', i: r.int(0, 4), p: p, x: x, M: [1000, 2000, 3000, 5000, 10000, 20000].filter(function (m) { return m > p * x; })[0] };
        }) } },
      { name: '합해서 몇 개 · 나누어 주기', vars: { q: sampler(function (r) {
          var a = r.int(2, 6), N = r.int(5, 15);
          if (r.int(0, 1)) return { k: 'two', i: r.int(0, 4), p: 100 * r.int(2, 15), e: 100 * r.int(2, 15), N: N, x: r.int(1, N - 1), ask: r.int(0, 2) ? 0 : 1 };
          return { k: 'share', i: r.int(0, 3), a: a, b: a + r.int(1, 4), x: r.int(3, 15), r: r.int(1, 20), ask: r.int(0, 2) ? 0 : 1 };
        }) } },
      { name: '나이 · 저금', vars: { q: sampler(function (r) {
          if (r.int(0, 1)) return { k: 'age', i: r.int(0, 3), kk: r.int(2, 4), f: r.int(8, 22), x: r.int(1, 12) };
          return { k: 'save', kk: r.pick([1, 1, 2, 3]), x: r.int(2, 12), a: 100 * r.int(2, 20), b: 100 * r.int(2, 20), B: 1000 * r.int(1, 12) };
        }) } }
    ],
    mistakes: [
      ['ignore-extra', function (p) { return '전체 금액을 그냥 한 ' + p.unit + '의 값으로 나눴어요. 전체 금액에는 따로 산 물건의 값도 들어 있어요. 그 값을 먼저 빼고 나서 나눠야 해요.'; }],
      ['same-op', function () { return '따로 산 물건의 값을 전체 금액에 더했어요. 그 값은 전체 금액 안에 들어 있으니, 이항할 때 빼야 해요. 등호를 건너면 +가 −로 바뀌어요.'; }],
      ['added', function () { return '낸 돈에 거스름돈을 더했어요. 거스름돈은 돌려받은 돈이에요. 물건값은 낸 돈에서 거스름돈을 뺀 것이에요.'; }],
      ['no-change', function () { return '낸 돈을 모두 물건값으로 계산했어요. 거스름돈을 돌려받았으니, 물건값은 낸 돈에서 거스름돈을 뺀 것이에요.'; }],
      ['half', function () { return '물건값 전체까지만 구했어요. 그것은 한 개의 값에 $x$를 곱한 값이에요. 한 개의 값으로 나눠야 몇 개인지 나와요.'; }],
      ['which', function (p) { return '방정식은 맞게 풀었지만 묻는 것이 아니에요. $x$로 놓은 것이 무엇인지, 문제가 묻는 것이 무엇인지 다시 읽어 보세요. 구하는 것은 $' + p.ansTex + '$의 값이에요.'; }],
      ['same-count', function () { return '두 가지를 같은 수만큼 샀다고 계산했어요. 한쪽을 $x$개 샀다면 다른 쪽은 전체 수에서 $x$를 뺀 만큼이에요. 두 수는 보통 달라요.'; }],
      ['lack-plus', function () { return '모자란 수를 더했어요. 모자라다는 것은 전체가 필요한 수보다 적다는 뜻이에요. 남는 수는 더하고, 모자란 수는 빼요.'; }],
      ['one-side', function () { return '한쪽에만 $x$를 넣었어요. 시간이 지나면 두 사람 모두 달라져요. 양쪽 모두에 $x$가 들어간 식을 세워야 해요.'; }],
      ['age-of', function () { return '그때의 나이를 답으로 썼어요. 문제가 묻는 것은 몇 년 뒤인지예요. $x$의 값을 그대로 답해요.'; }],
      ['first-only', function () { return '괄호 안의 첫 항에만 곱했어요. 몇 배가 되는 것은 $x$만큼 지난 뒤의 값 전체예요. 괄호로 묶고, 괄호 안의 모든 항에 곱해요.'; }]
    ]
  });

  /* ── B08.speed 거리 · 속력 · 시간 ──────────────────────
     basic 관계식(ask: dist · time · rate) · chase 따라잡기 · meet 마주 보고 걷기 · track 호수 둘레
     round  x/a + x/b = T · late  x/a − x/b = t · longer  x/a + (x + k)/b = T */
  var MOVE = [
    { who: '자동차가', verb: '달렸어요', did: '달린', sp: '시속', du: 'km', tu: '시간', one: '한 시간', a: [40, 50, 60, 70, 80, 90], t: [2, 5] },
    { who: '자전거를 타고', verb: '갔어요', did: '간', sp: '시속', du: 'km', tu: '시간', one: '한 시간', a: [12, 15, 16, 18, 20, 24], t: [2, 4] },
    { who: '기차가', verb: '달렸어요', did: '달린', sp: '시속', du: 'km', tu: '시간', one: '한 시간', a: [100, 120, 150, 180, 200], t: [2, 4] },
    { who: '걸어서', verb: '갔어요', did: '간', sp: '분속', du: 'm', tu: '분', one: '일 분', a: [50, 60, 70, 80, 90], t: [5, 30] },
    { who: '자전거를 타고', verb: '갔어요', did: '간', sp: '분속', du: 'm', tu: '분', one: '일 분', a: [200, 250, 300], t: [4, 20] }
  ];
  var PLACES = [['집', '공원'], ['집', '도서관'], ['학교', '박물관'], ['마을', '호수']];
  var byWhat = function (a) { return a < 10 ? '걸어서' : a < 35 ? '자전거를 타고' : '자동차를 타고'; };
  var FR = function (top, den) { return '\\dfrac{' + top + '}{' + den + '}'; };
  wordType({
    id: 'B08.speed', title: '거리 · 속력 · 시간',
    intro: '거리 · 속력 · 시간 문제는 관계 하나만 알면 돼요. (거리) = (속력) × (시간). 속력은 정해진 시간 동안 가는 거리예요. 같은 속력으로 시간이 두 배가 되면 간 거리도 두 배가 되니, 속력에 시간을 곱하면 거리가 나와요.',
    kinds: {
      basic: function (q) {
        var c = MOVE[q.i], a = q.a, t = q.t, d = a * t, sp = c.sp + ' ' + a + ' ' + c.du, base = '속력은 ' + c.one + '에 가는 거리예요. ' + c.sp + ' ' + a + ' ' + c.du + '는 ' + c.one + '마다 ' + a + ' ' + c.du + '씩 간다는 뜻이에요. ';
        if (q.ask === 'dist') return { x: d, unit: c.du, ok: d / t === a, text: c.who + ' ' + sp + '로 ' + t + c.tu + ' 동안 ' + c.verb + '. ' + c.did + ' 거리는 몇 ' + c.du + '일까요?',
          let: c.did + ' 거리를', words: '(거리) = (속력) × (시간)', eq: 'x = ' + a + ' \\times ' + t, steps: [{ say: '곱셈을 계산해요.', tex: 'x = ' + d }], how: '이 식은 오른쪽의 곱셈만 계산하면 바로 $x$의 값이 나와요.',
          tip: base + t + c.tu + ' 동안 갔으니 ' + a + ' ' + c.du + '를 ' + t + '번 더한 만큼 갔어요. 같은 수를 여러 번 더하는 것은 곱셈이에요. 그래서 거리는 (속력) × (시간)으로 구해요.',
          wrong: { divided: a / t, added: a + t } };
        if (q.ask === 'time') return { x: t, unit: c.tu, ok: d / a === t, text: c.who + ' ' + sp + '로 ' + d + ' ' + c.du + '를 ' + c.verb + '. 걸린 시간은 몇 ' + c.tu + '일까요?',
          let: '걸린 시간을', words: '(속력) × (시간) = (거리)', L: [[a, 'x']], R: [[d, '']],
          tip: base + '$x$' + c.tu + ' 동안 가면 ' + a + ' ' + c.du + '를 $x$번 더한 $' + a + 'x$ ' + c.du + '를 가요. 이것이 ' + d + ' ' + c.du + '와 같아요. ' + d + ' 안에 ' + josa(a, '이/가') + ' 몇 번 들어가는지 찾는 것이니, 거리를 속력으로 나누면 시간이 나와요.',
          wrong: { multiplied: d * a, subtracted: d - a } };
        return { x: a, unit: c.du, ok: d / t === a, text: c.who + ' ' + t + c.tu + ' 동안 ' + d + ' ' + c.du + '를 ' + c.verb + '. 일정한 빠르기였다면 ' + c.sp + ' 몇 ' + c.du + '일까요?',
          let: c.one + '에 간 거리(속력)를', words: '(속력) × (시간) = (거리)', L: [[t, 'x']], R: [[d, '']],
          tip: '속력은 ' + c.one + '에 가는 거리예요. ' + c.one + '에 $x$ ' + c.du + '씩 ' + t + c.tu + ' 동안 가면 $x$를 ' + t + '번 더한 $' + t + 'x$ ' + c.du + '를 가요. 이것이 ' + d + ' ' + c.du + '와 같아요. 전체 거리를 걸린 시간으로 똑같이 나누면 ' + c.one + '에 간 거리가 나와요.',
          wrong: { multiplied: d * t, subtracted: d - t } };
      },
      chase: function (q) {
        var a = q.a, b = q.b, t = q.t, x = a * t / (b - a);
        return { x: x, unit: '분', ok: a * (x + t) === b * x,
          text: '동생이 집을 나선 지 ' + t + '분 뒤에 형이 같은 길로 동생을 따라나섰어요. 동생은 분속 ' + a + ' m로 걷고 형은 분속 ' + b + ' m로 따라가요. 형은 집을 나선 지 몇 분 뒤에 동생을 만날까요?',
          let: '형이 집을 나선 뒤 동생을 만날 때까지 걸린 시간(분)을', terms: '동생은 ' + t + '분 먼저 나섰으니 $(x + ' + t + ')$분 동안 걸었어요.',
          words: '(형이 간 거리) = (동생이 간 거리)', L: [[b, 'x']], R: [['g', a, [[1, 'x'], [t, '']]]],
          tip: '두 사람은 같은 집에서 나와 같은 곳에서 만나요. 그래서 만나는 순간까지 두 사람이 간 거리는 같아요. 이것이 등호로 이을 "같은 양"이에요. 다른 것은 걸은 시간이에요. 동생이 ' + t + '분 먼저 나섰으니 동생이 걸은 시간이 형보다 ' + t + '분 길어요. 거리는 (속력) × (시간)이니 두 사람이 간 거리를 각각 식으로 써요.',
          wrong: { 'no-paren': t / (b - a), 'from-first': x + t } };
      },
      meet: function (q) {
        var a = q.a, b = q.b, x = q.x, d = (a + b) * x;
        return { x: x, unit: '분', ok: a * x + b * x === d,
          text: d + ' m 떨어진 두 지점에서 두 사람이 서로를 향해 동시에 출발했어요. 한 사람은 분속 ' + a + ' m로, 다른 사람은 분속 ' + b + ' m로 걸어요. 두 사람은 출발한 지 몇 분 뒤에 만날까요?',
          let: '만날 때까지 걸린 시간(분)을', words: '(한 사람이 간 거리) + (다른 사람이 간 거리) = (두 지점 사이의 거리)', L: [[a, 'x'], [b, 'x']], R: [[d, '']],
          tip: '서로를 향해 걸으면 두 사람 사이의 길을 양쪽에서 나누어 걷는 셈이에요. 만나는 순간, 두 사람이 걸은 거리를 이어 붙이면 처음에 떨어져 있던 ' + d + ' m가 돼요. 동시에 출발했으니 걸은 시간은 둘 다 $x$분이에요. 한 사람은 $' + a + 'x$ m, 다른 사람은 $' + b + 'x$ m를 걸었어요.',
          wrong: { diff: d / abs(b - a), 'one-person': d / a } };
      },
      track: function (q) {
        var a = q.a, b = q.b, x = q.x, same = q.dir === 1, L = (same ? b - a : a + b) * x;
        if (L <= 0 || L % 50) return null;
        return { x: x, unit: '분', ok: (same ? b * x - a * x : a * x + b * x) === L,
          text: '둘레의 길이가 ' + L + ' m인 호수 둘레를 두 사람이 같은 곳에서 동시에 출발해 ' + (same ? '같은' : '서로 반대') + ' 방향으로 걸어요. 한 사람은 분속 ' + a + ' m, 다른 사람은 분속 ' + b + ' m로 걸을 때, 두 사람은 출발한 지 몇 분 뒤에 처음으로 다시 만날까요?',
          let: '다시 만날 때까지 걸린 시간(분)을', words: same ? '(빠른 사람이 간 거리) − (느린 사람이 간 거리) = (호수의 둘레)' : '(한 사람이 간 거리) + (다른 사람이 간 거리) = (호수의 둘레)',
          L: same ? [[b, 'x'], [-a, 'x']] : [[a, 'x'], [b, 'x']], R: [[L, '']],
          tip: same ? '같은 방향으로 걸으면 빠른 사람이 점점 앞서 가요. 빠른 사람이 느린 사람보다 꼭 한 바퀴를 더 돌았을 때 뒤에서 따라잡아 다시 만나요. 그래서 두 사람이 걸은 거리의 차가 호수의 둘레 ' + L + ' m와 같아요. 걸은 시간은 둘 다 $x$분이니, 빠른 사람은 $' + b + 'x$ m, 느린 사람은 $' + a + 'x$ m를 걸었어요.'
            : '반대 방향으로 걸으면 두 사람이 호수를 양쪽에서 나누어 도는 셈이에요. 다시 만나는 순간, 두 사람이 걸은 거리를 이어 붙이면 호수 한 바퀴 ' + L + ' m가 돼요. 걸은 시간은 둘 다 $x$분이니, 한 사람은 $' + a + 'x$ m, 다른 사람은 $' + b + 'x$ m를 걸었어요.',
          wrong: same ? { sum: L / (a + b) } : { diff: L / abs(b - a) } };
      },
      round: function (q) {
        var a = q.a, b = q.b, x = q.x, T = x / a + x / b, n = lcm(a, b), pl = PLACES[q.i];
        if (!isInt(T) || T > 12) return null;
        return { x: x, unit: 'km', ok: isInt(x / a) && isInt(x / b) && x / a + x / b === T,
          text: pl[0] + '에서 ' + pl[1] + '까지 같은 길을 갈 때는 시속 ' + a + ' km로, 올 때는 시속 ' + b + ' km로 ' + byWhat(Math.min(a, b)) + ' 다녀왔더니 모두 ' + T + '시간이 걸렸어요. ' + pl[0] + '에서 ' + pl[1] + '까지의 거리는 몇 km일까요?',
          let: pl[0] + '에서 ' + pl[1] + '까지의 거리(km)를', words: '(갈 때 걸린 시간) + (올 때 걸린 시간) = (전체 시간)',
          eq: FR('x', a) + ' + ' + FR('x', b) + ' = ' + T, how: HOW_FRAC,
          pre: [{ say: '양쪽의 모든 항에 분모의 최소공배수 ' + josa(n, '을/를') + ' 곱해서 분모를 없애요.', tex: E([[n / a, 'x'], [n / b, 'x']], [[n * T, '']]) }],
          L: [[n / a, 'x'], [n / b, 'x']], R: [[n * T, '']],
          tip: '문제에 주어진 것이 "모두 ' + T + '시간"이니, 등호의 양쪽을 시간으로 맞춰요. 시간은 거리를 속력으로 나눈 것이에요: (시간) = (거리) ÷ (속력). 갈 때와 올 때는 같은 길이라 거리는 둘 다 $x$ km이지만 속력이 달라서 걸린 시간이 달라요. 갈 때 걸린 시간과 올 때 걸린 시간을 각각 분수 꼴로 쓴 다음 더해요.',
          wrong: { 'avg-speed': (a + b) * T / 4, total: 2 * x } };
      },
      late: function (q) {
        var a = q.a, b = q.b, x = q.x, t = x / a - x / b, n = lcm(a, b);
        if (!(a < b) || !isInt(t) || t > 9) return null;
        return { x: x, unit: 'km', ok: isInt(x / a) && isInt(x / b) && x / a - x / b === t,
          text: '집에서 역까지 시속 ' + a + ' km로 가면 시속 ' + b + ' km로 갈 때보다 ' + t + '시간이 더 걸려요. 집에서 역까지의 거리는 몇 km일까요?',
          let: '집에서 역까지의 거리(km)를', words: '(느리게 갈 때 걸린 시간) − (빠르게 갈 때 걸린 시간) = (시간의 차)',
          eq: FR('x', a) + ' - ' + FR('x', b) + ' = ' + t, how: HOW_FRAC,
          pre: [{ say: '양쪽의 모든 항에 분모의 최소공배수 ' + josa(n, '을/를') + ' 곱해서 분모를 없애요.', tex: E([[n / a, 'x'], [-n / b, 'x']], [[n * t, '']]) }],
          L: [[n / a, 'x'], [-n / b, 'x']], R: [[n * t, '']],
          tip: '문제에 주어진 것이 "' + t + '시간이 더 걸려요"이니, 등호의 양쪽을 시간으로 맞춰요. 시간은 거리를 속력으로 나눈 것이에요. 같은 거리 $x$ km를 느린 속력으로 가면 시간이 더 많이 걸려요. 느리게 갈 때 걸린 시간에서 빠르게 갈 때 걸린 시간을 빼면 그 차가 ' + t + '시간이에요.',
          wrong: { 'diff-speed': (b - a) * t } };
      },
      longer: function (q) {
        var a = q.a, b = q.b, x = q.x, k = q.d, T = x / a + (x + k) / b, n = lcm(a, b), pl = PLACES[q.i];
        if (!isInt(T) || T > 12) return null;
        return { x: x, unit: 'km', ok: isInt(x / a) && isInt((x + k) / b) && x / a + (x + k) / b === T,
          text: pl[0] + '에서 ' + pl[1] + '까지 갈 때는 시속 ' + a + ' km로 걷고, 올 때는 갈 때보다 ' + k + ' km 더 먼 길을 시속 ' + b + ' km로 걸었더니 모두 ' + T + '시간이 걸렸어요. 갈 때 걸은 거리는 몇 km일까요?',
          let: '갈 때 걸은 거리(km)를', terms: '올 때 걸은 거리는 그보다 ' + k + ' km 더 머니 $(x + ' + k + ')$ km예요.',
          words: '(갈 때 걸린 시간) + (올 때 걸린 시간) = (전체 시간)',
          eq: FR('x', a) + ' + ' + FR('x + ' + k, b) + ' = ' + T, how: HOW_FRAC,
          pre: [{ say: '양쪽의 모든 항에 분모의 최소공배수 ' + josa(n, '을/를') + ' 곱해서 분모를 없애요. 분자가 여러 항이면 괄호로 묶어요.', tex: E([[n / a, 'x'], ['g', n / b, [[1, 'x'], [k, '']]]], [[n * T, '']]) }],
          L: [[n / a, 'x'], ['g', n / b, [[1, 'x'], [k, '']]]], R: [[n * T, '']],
          tip: '문제에 주어진 것이 "모두 ' + T + '시간"이니, 등호의 양쪽을 시간으로 맞춰요. 시간은 거리를 속력으로 나눈 것이에요. 이번에는 갈 때와 올 때의 거리도 달라요. 갈 때는 $x$ km를 시속 ' + a + ' km로, 올 때는 $(x + ' + k + ')$ km를 시속 ' + b + ' km로 걸었어요. 올 때의 분자는 거리 전체라서 한 덩어리로 다뤄요.',
          wrong: { 'return': x + k, total: 2 * x + k } };
      }
    },
    levels: [
      { name: '거리 · 속력 · 시간의 관계', vars: { q: sampler(function (r) {
          var i = r.int(0, 4), c = MOVE[i];
          return { k: 'basic', i: i, ask: r.pick(['dist', 'time', 'rate']), a: r.pick(c.a), t: r.int(c.t[0], c.t[1]) };
        }) } },
      { name: '만나는 문제', vars: { q: sampler(function (r) {
          var k = r.pick(['chase', 'meet', 'track']), a = 10 * r.int(4, 9);
          if (k === 'chase') return { k: k, a: a, b: a + 10 * r.int(1, 8), t: r.int(2, 20) };
          if (k === 'meet') return { k: k, a: a, b: 10 * r.int(4, 9), x: r.int(3, 25) };
          return { k: k, a: a, b: a + 10 * r.int(1, 6), x: r.int(0, 1) ? 5 * r.int(1, 8) : r.int(4, 40), dir: r.int(0, 1) };
        }) }, where: function (p) { return p.x <= 60; } },
      { name: '시간으로 식 세우기', minDistinct: 150, vars: { q: sampler(function (r) {
          var k = r.pick(['round', 'round', 'late', 'longer']), pr = pairOf(r), n = lcm(pr[0], pr[1]);
          if (k === 'longer') { pr = r.pick(WALK); pr = r.int(0, 1) ? pr : [pr[1], pr[0]]; return { k: k, i: r.int(0, 3), a: pr[0], b: pr[1], x: pr[0] * r.int(1, 6), d: r.int(1, 6) }; }
          if (k === 'late') return { k: k, a: Math.min(pr[0], pr[1]), b: Math.max(pr[0], pr[1]), x: n * r.int(1, 4) };
          return { k: k, i: r.int(0, 3), a: pr[0], b: pr[1], x: n * r.int(1, 4) };
        }) } }
    ],
    mistakes: [
      ['divided', function () { return '속력을 시간으로 나눴어요. 거리는 (속력) × (시간)이에요. 시간이 길수록 더 멀리 가니 곱해야 해요.'; }],
      ['added', function () { return '속력과 시간을 더했어요. 같은 거리를 여러 번 되풀이해서 가는 것이니 곱셈이에요. 거리는 (속력) × (시간)으로 구해요.'; }],
      ['multiplied', function () { return '거리에 곱셈을 했어요. 구하는 것에 곱해서 거리가 나와야 해요: (속력) × (시간) = (거리). 그래서 거리를 나눠서 구해요.'; }],
      ['subtracted', function () { return '뺄셈을 했어요. (속력) × (시간) = (거리)에서 모르는 것을 구하려면 거리를 나눠요. 곱해진 수는 나눗셈으로 없애요.'; }],
      ['no-paren', function () { return '괄호 없이 풀었어요. 먼저 나선 사람이 걸은 시간 전체에 속력을 곱해야 거리가 돼요. 괄호 앞의 속력을 괄호 안의 모든 항에 곱해요.'; }],
      ['from-first', function () { return '먼저 나선 사람이 걸은 시간을 답으로 썼어요. 문제가 묻는 것은 나중에 나선 사람이 걸은 시간이에요. $x$의 값을 그대로 답해요.'; }],
      ['diff', function () { return '두 속력의 차로 나눴어요. 서로를 향해(반대 방향으로) 걸으면 두 사람이 걸은 거리를 더한 것이 전체 거리예요. 그래서 두 거리를 더해요.'; }],
      ['one-person', function () { return '한 사람만 걸은 것으로 계산했어요. 두 사람이 양쪽에서 함께 걸어오니, 두 사람이 걸은 거리를 더한 것이 전체 거리예요.'; }],
      ['sum', function () { return '두 거리를 더했어요. 같은 방향으로 걸으면 빠른 사람이 한 바퀴를 더 돌았을 때 만나요. 두 사람이 걸은 거리의 차가 호수의 둘레예요.'; }],
      ['avg-speed', function () { return '두 속력의 평균으로 계산했어요. 느리게 간 길에서 시간을 더 많이 쓰기 때문에 평균 속력으로는 맞지 않아요. 갈 때와 올 때의 시간을 따로 구해서 더해요.'; }],
      ['total', function () { return '갈 때와 올 때의 거리를 더한 값을 답으로 썼어요. 문제가 묻는 것은 한쪽 길의 거리예요. $x$의 값을 그대로 답해요.'; }],
      ['diff-speed', function () { return '속력의 차에 시간의 차를 곱했어요. 그렇게는 거리가 나오지 않아요. 걸린 시간을 각각 (거리) ÷ (속력)으로 쓰고, 그 차가 주어진 시간과 같다고 식을 세워요.'; }],
      ['return', function () { return '올 때 걸은 거리를 답으로 썼어요. 문제가 묻는 것은 갈 때 걸은 거리예요. $x$의 값을 그대로 답해요.'; }]
    ]
  });

  /* ── B08.mix 농도 ──────────────────────────────────────
     salt 녹아 있는 양 · conc 농도 · whole 전체의 양 · water 물을 더 넣기 · evap 물을 증발시키기 · more 더 녹이기
     mixx · mixtotal 두 용액을 섞을 때의 양 · mixconc 섞은 뒤의 농도 */
  var SOL = [{ s: '소금', w: '소금물' }, { s: '설탕', w: '설탕물' }];
  var pct = function (c) { return FR(c, 100); };
  var BASIC = '농도 문제에는 세 가지 양이 나와요. 물에 녹인 것(소금 · 설탕)의 양, 그것을 녹인 물까지 합친 전체의 양, 그리고 농도예요. 농도는 국이 얼마나 짠지를 나타내는 수라고 생각하면 돼요. 같은 양의 국이라면 소금이 많이 들어갈수록 짜고, 농도가 높아요.';
  var CONC = function (W) { return '농도는 ' + W.w + ' 전체를 백으로 볼 때 ' + W.s + '이 얼마나 들어 있는지를 나타낸 비율(%)이에요. '; };
  wordType({
    id: 'B08.mix', title: '농도',
    intro: '농도 문제에서는 녹아 있는 것(소금 · 설탕)의 양만 따라가면 돼요. 물을 더 넣어도, 물을 날려 보내도 녹아 있는 양은 그대로예요. 국에 물을 더 부으면 싱거워지지만 들어간 소금이 줄어든 것은 아닌 것과 같아요.',
    kinds: {
      salt: function (q) {
        var W = SOL[q.s], c = q.c, M = q.M, x = M * c / 100;
        return { x: x, unit: 'g', intro: BASIC, ok: x * 100 === M * c, text: c + ' %의 ' + W.w + ' ' + M + ' g에 들어 있는 ' + josa(W.s, '은/는') + ' 몇 g일까요?',
          let: '들어 있는 ' + W.s + '의 양(g)을', words: '(' + W.s + '의 양) = (' + W.w + '의 양) × (농도) ÷ 100',
          eq: 'x = ' + M + ' \\times ' + pct(c), steps: [{ say: '곱셈을 계산해요. 100으로 나누는 것은 소수점을 왼쪽으로 두 칸 옮기는 것과 같아요.', tex: 'x = ' + x }], how: '이 식은 오른쪽만 계산하면 바로 $x$의 값이 나와요. ' + M + '에 ' + josa(c, '을/를') + ' 곱한 다음 100으로 나눠요.',
          tip: CONC(W) + c + ' %는 ' + W.w + ' 100 g마다 ' + W.s + '이 ' + c + ' g씩 들어 있다는 뜻이에요. 그래서 ' + W.s + '의 양은 ' + W.w + '의 양에 농도를 곱하고 100으로 나눠서 구해요. 전체 ' + M + ' g 가운데 ' + c + ' %만큼이 ' + W.s + '이에요.',
          wrong: { 'no-100': M * c, divided: M / c, water: M - x } };
      },
      conc: function (q) {
        var W = SOL[q.s], T = q.M, s = T * q.c / 100, w = T - s;
        return { x: q.c, unit: '%', intro: BASIC, ok: isInt(s) && s % 5 === 0 && s * 100 === q.c * (w + s), text: '물 ' + w + ' g에 ' + W.s + ' ' + s + ' g을 녹였어요. 이 ' + W.w + '의 농도는 몇 %일까요?',
          let: W.w + '의 농도(%)를', words: '(농도) = (' + W.s + '의 양) ÷ (' + W.w + '의 양) × 100',
          eq: 'x = ' + FR(s, w + ' + ' + s) + ' \\times 100', steps: [{ say: W.w + '의 양은 물과 ' + W.s + '을 더한 것이에요.', tex: 'x = ' + FR(s, T) + ' \\times 100' }, { say: '분수를 계산해요.', tex: 'x = ' + q.c }],
          how: '① 분모의 덧셈을 먼저 해서 ' + W.w + ' 전체의 양을 구해요. ② ' + W.s + '의 양을 그 수로 나누고 100을 곱해요.',
          tip: CONC(W) + '여기서 조심할 것은 나누는 수예요. ' + josa(W.s, '을/를') + ' 물에 녹이면 ' + W.w + '의 양은 물과 ' + W.s + '을 더한 만큼이 돼요. 물의 양으로 나누는 것이 아니라 ' + W.w + ' 전체의 양으로 나눠요.',
          wrong: { 'water-only': s * 100 / w } };
      },
      whole: function (q) {
        var W = SOL[q.s], c = q.c, x = q.M, s = x * c / 100;
        return { x: x, unit: 'g', intro: BASIC, ok: isInt(s) && x * c === s * 100, text: W.s + ' ' + s + ' g을 물에 녹여 ' + c + ' %의 ' + josa(W.w, '을/를') + ' 만들었어요. 만든 ' + josa(W.w, '은/는') + ' 모두 몇 g일까요?',
          let: '만든 ' + W.w + '의 양(g)을', words: '(' + W.w + '의 양) × (농도) ÷ 100 = (' + W.s + '의 양)',
          eq: pct(c) + ' \\times x = ' + s, how: HOW_100,
          pre: [{ say: '양쪽에 100을 곱해서 분모를 없애요.', tex: E([[c, 'x']], [[100 * s, '']]) }], L: [[c, 'x']], R: [[100 * s, '']],
          tip: CONC(W) + W.w + ' $x$ g의 ' + c + ' %가 ' + W.s + '이에요. 그 양이 ' + s + ' g이라고 했어요. ' + W.w + '의 양에 농도를 곱하고 100으로 나눈 것이 ' + W.s + '의 양이라는 관계에, 모르는 ' + W.w + '의 양을 $x$로 넣어요.',
          wrong: { times: s * c, water: x - s } };
      },
      water: function (q) {
        var W = SOL[q.s], a = q.a, b = q.b, M = q.M, x = M * (a - b) / b;
        if (!(b < a)) return null;
        return { x: x, unit: 'g', ok: a * M === b * (M + x), text: a + ' %의 ' + W.w + ' ' + M + ' g에 물을 더 넣어 ' + b + ' %의 ' + josa(W.w, '을/를') + ' 만들려고 해요. 물을 몇 g 더 넣어야 할까요?',
          let: '더 넣는 물의 양(g)을', terms: '물을 넣은 뒤 ' + W.w + '의 양은 $(' + M + ' + x)$ g이에요.',
          words: '(물을 넣기 전 ' + W.s + '의 양) = (물을 넣은 뒤 ' + W.s + '의 양)',
          eq: pct(a) + ' \\times ' + M + ' = ' + pct(b) + ' \\times (' + M + ' + x)', how: HOW_100,
          pre: [{ say: '양쪽에 100을 곱해서 분모를 없애요. 왼쪽의 곱셈도 계산해요.', tex: E([[a * M, '']], [['g', b, [[M, ''], [1, 'x']]]]) }], L: [[a * M, '']], R: [['g', b, [[M, ''], [1, 'x']]]],
          tip: '물만 더 넣었으니 ' + W.s + '의 양은 넣기 전과 후가 같아요. 이것이 등호로 이을 "같은 양"이에요. 달라지는 것은 ' + W.w + '의 양과 농도예요. ' + W.w + '의 양은 넣은 물만큼 늘어나고, 농도는 ' + a + ' %에서 ' + b + ' %로 낮아져요. 앞뒤의 ' + W.s + '의 양을 각각 (' + W.w + '의 양) × (농도) ÷ 100으로 써요.',
          wrong: { total: M + x, salt: a * M / 100 } };
      },
      evap: function (q) {
        var W = SOL[q.s], a = q.a, b = q.b, M = q.M, x = M * (b - a) / b;
        if (!(b > a) || b > 30) return null;
        return { x: x, unit: 'g', ok: a * M === b * (M - x), text: a + ' %의 ' + W.w + ' ' + M + ' g에서 물을 증발시켜 ' + b + ' %의 ' + josa(W.w, '을/를') + ' 만들려고 해요. 물을 몇 g 증발시켜야 할까요?',
          let: '증발시키는 물의 양(g)을', terms: '물이 날아간 뒤 ' + W.w + '의 양은 $(' + M + ' - x)$ g이에요.',
          words: '(증발하기 전 ' + W.s + '의 양) = (증발한 뒤 ' + W.s + '의 양)',
          eq: pct(a) + ' \\times ' + M + ' = ' + pct(b) + ' \\times (' + M + ' - x)', how: HOW_100,
          pre: [{ say: '양쪽에 100을 곱해서 분모를 없애요. 왼쪽의 곱셈도 계산해요.', tex: E([[a * M, '']], [['g', b, [[M, ''], [-1, 'x']]]]) }], L: [[a * M, '']], R: [['g', b, [[M, ''], [-1, 'x']]]],
          tip: '증발하는 것은 물뿐이에요. 국을 오래 끓이면 물이 날아가 짜지지만 소금은 그대로 남는 것과 같아요. 그래서 ' + W.s + '의 양은 증발 전과 후가 같아요. ' + W.w + '의 양은 날아간 물만큼 줄어들고, 농도는 ' + a + ' %에서 ' + b + ' %로 높아져요. 앞뒤의 ' + W.s + '의 양을 각각 (' + W.w + '의 양) × (농도) ÷ 100으로 써요.',
          wrong: { total: M - x, salt: a * M / 100 } };
      },
      more: function (q) {
        var W = SOL[q.s], a = q.a, b = q.b, M = q.M, x = M * (b - a) / (100 - b);
        if (!(b > a)) return null;
        return { x: x, unit: 'g', ok: a * M + 100 * x === b * (M + x), text: a + ' %의 ' + W.w + ' ' + M + ' g에 ' + josa(W.s, '을/를') + ' 더 넣어 ' + b + ' %의 ' + josa(W.w, '을/를') + ' 만들려고 해요. ' + josa(W.s, '을/를') + ' 몇 g 더 넣어야 할까요?',
          let: '더 넣는 ' + W.s + '의 양(g)을', terms: W.s + '을 넣은 뒤 ' + W.w + '의 양은 $(' + M + ' + x)$ g이에요.',
          words: '(처음 ' + W.s + '의 양) + (더 넣은 ' + W.s + '의 양) = (나중 ' + W.s + '의 양)',
          eq: pct(a) + ' \\times ' + M + ' + x = ' + pct(b) + ' \\times (' + M + ' + x)', how: HOW_100,
          pre: [{ say: '양쪽의 모든 항에 100을 곱해서 분모를 없애요. 분수가 아닌 $x$에도 100을 곱해요.', tex: E([[a * M, ''], [100, 'x']], [['g', b, [[M, ''], [1, 'x']]]]) }], L: [[a * M, ''], [100, 'x']], R: [['g', b, [[M, ''], [1, 'x']]]],
          tip: '이번에는 ' + W.s + '의 양이 달라져요. 처음에 들어 있던 ' + W.s + '에 새로 넣은 $x$ g이 더해져요. 그리고 넣은 ' + W.s + '만큼 ' + W.w + ' 전체의 양도 함께 늘어나요. 이 두 가지를 모두 식에 넣어야 해요. 처음 ' + W.s + '의 양과 나중 ' + W.s + '의 양은 각각 (' + W.w + '의 양) × (농도) ÷ 100으로 써요.',
          wrong: { 'old-total': M * (b - a) / 100, total: M + x } };
      },
      mixx: function (q) {
        var W = SOL[q.s], a = q.a, b = q.b, c = q.c, N = q.M, x = N * (c - b) / (a - c);
        if (a === b || a === c || !((a < c && c < b) || (a > c && c > b))) return null;
        return { x: x, unit: 'g', ok: a * x + b * N === c * (x + N), text: a + ' %의 ' + josa(W.w, '과/와') + ' ' + b + ' %의 ' + W.w + ' ' + N + ' g을 섞어 ' + c + ' %의 ' + josa(W.w, '을/를') + ' 만들려고 해요. ' + a + ' %의 ' + josa(W.w, '은/는') + ' 몇 g 섞어야 할까요?',
          let: a + ' %의 ' + W.w + '의 양(g)을', terms: '섞은 뒤 ' + W.w + '의 양은 $(x + ' + N + ')$ g이에요.',
          words: '(첫째 ' + W.w + '의 ' + W.s + ') + (둘째 ' + W.w + '의 ' + W.s + ') = (섞은 ' + W.w + '의 ' + W.s + ')',
          eq: pct(a) + ' \\times x + ' + pct(b) + ' \\times ' + N + ' = ' + pct(c) + ' \\times (x + ' + N + ')', how: HOW_100,
          pre: [{ say: '양쪽의 모든 항에 100을 곱해서 분모를 없애요. 수끼리의 곱셈도 계산해요.', tex: E([[a, 'x'], [b * N, '']], [['g', c, [[1, 'x'], [N, '']]]]) }], L: [[a, 'x'], [b * N, '']], R: [['g', c, [[1, 'x'], [N, '']]]],
          tip: '두 ' + josa(W.w, '을/를') + ' 한 그릇에 부으면, 각각에 녹아 있던 ' + W.s + '이 모두 합쳐져요. 새로 생기거나 없어지는 ' + josa(W.s, '은/는') + ' 없어요. 그래서 섞기 전 두 ' + W.w + '의 ' + W.s + '의 양을 더하면 섞은 뒤의 ' + W.s + '의 양과 같아요. 세 가지 ' + W.w + ' 각각에서 ' + W.s + '의 양을 (' + W.w + '의 양) × (농도) ÷ 100으로 써요.',
          wrong: { total: x + N, 'same-amount': N } };
      },
      mixtotal: function (q) {
        var W = SOL[q.s], a = q.a, b = q.b, c = q.c, T = q.M, x = T * (c - b) / (a - b), ask = q.ask, ans = ask ? T - x : x;
        if (a === b || !((a < c && c < b) || (a > c && c > b))) return null;
        return { x: x, ans: ans, ansTex: ask ? T + ' - x' : 'x', unit: 'g', ok: (ask ? a * (T - ans) + b * ans : a * ans + b * (T - ans)) === c * T,
          text: a + ' %의 ' + josa(W.w, '과/와') + ' ' + b + ' %의 ' + josa(W.w, '을/를') + ' 섞어 ' + c + ' %의 ' + W.w + ' ' + T + ' g을 만들려고 해요. ' + (ask ? b : a) + ' %의 ' + josa(W.w, '은/는') + ' 몇 g 섞어야 할까요?',
          let: a + ' %의 ' + W.w + '의 양(g)을', terms: '합해서 ' + T + ' g이 되어야 하니 ' + b + ' %의 ' + josa(W.w, '은/는') + ' $(' + T + ' - x)$ g이에요.',
          words: '(첫째 ' + W.w + '의 ' + W.s + ') + (둘째 ' + W.w + '의 ' + W.s + ') = (섞은 ' + W.w + '의 ' + W.s + ')',
          eq: pct(a) + ' \\times x + ' + pct(b) + ' \\times (' + T + ' - x) = ' + pct(c) + ' \\times ' + T, how: HOW_100,
          pre: [{ say: '양쪽의 모든 항에 100을 곱해서 분모를 없애요. 오른쪽의 곱셈도 계산해요.', tex: E([[a, 'x'], ['g', b, [[T, ''], [-1, 'x']]]], [[c * T, '']]) }], L: [[a, 'x'], ['g', b, [[T, ''], [-1, 'x']]]], R: [[c * T, '']],
          tip: '두 ' + josa(W.w, '을/를') + ' 섞으면 녹아 있던 ' + W.s + '이 모두 합쳐져요. 그래서 섞기 전 두 ' + W.w + '의 ' + W.s + '의 양을 더하면 섞은 뒤의 ' + W.s + '의 양과 같아요. 섞은 뒤의 전체 양이 ' + T + ' g으로 정해져 있으니, 한쪽을 $x$ g 넣으면 다른 쪽은 나머지인 $(' + T + ' - x)$ g이에요.',
          last: '구하는 것은 ' + b + ' %의 ' + W.w + '의 양이에요. 전체 ' + T + ' g에서 $x$를 빼요.', lastTip: '$x$는 ' + a + ' %의 ' + W.w + '의 양이에요. 문제에서 묻는 것은 ' + b + ' %의 ' + W.w + '이니, $x$를 구한 다음 전체 양에서 빼요.',
          wrong: { which: ask ? x : T - x, 'half-each': T / 2 } };
      },
      mixconc: function (q) {
        var W = SOL[q.s], a = q.a, b = q.b, M = q.M, N = q.N, x = (a * M + b * N) / (M + N);
        if (a === b) return null;
        return { x: x, unit: '%', ok: a * M + b * N === x * (M + N), text: a + ' %의 ' + W.w + ' ' + M + ' g과 ' + b + ' %의 ' + W.w + ' ' + N + ' g을 섞으면 몇 %의 ' + josa(W.w, '이/가') + ' 될까요?',
          let: '섞은 ' + W.w + '의 농도(%)를', terms: '섞은 뒤 ' + W.w + '의 양은 $(' + M + ' + ' + N + ')$ g이에요.',
          words: '(첫째 ' + W.w + '의 ' + W.s + ') + (둘째 ' + W.w + '의 ' + W.s + ') = (섞은 ' + W.w + '의 ' + W.s + ')',
          eq: pct(a) + ' \\times ' + M + ' + ' + pct(b) + ' \\times ' + N + ' = ' + FR('x', 100) + ' \\times (' + M + ' + ' + N + ')',
          how: '① 양쪽의 모든 항에 100을 곱해서 분모를 없애요. ② 수끼리의 곱셈과 덧셈을 계산해요. ③ 양쪽을 $x$ 앞의 수로 나눠요.',
          pre: [{ say: '양쪽의 모든 항에 100을 곱해서 분모를 없애요. 수끼리 계산하고, 문자가 있는 쪽을 왼쪽에 써요.', tex: E([[M + N, 'x']], [[a * M, ''], [b * N, '']]) }], L: [[M + N, 'x']], R: [[a * M, ''], [b * N, '']],
          tip: '두 ' + josa(W.w, '을/를') + ' 섞으면 녹아 있던 ' + W.s + '이 모두 합쳐지고, ' + W.w + '의 양도 합쳐져요. 섞기 전 두 ' + W.w + '의 ' + W.s + '의 양을 더하면 섞은 뒤의 ' + W.s + '의 양과 같아요. 농도끼리 더하거나 평균을 내면 안 돼요. 양이 많은 쪽의 농도에 더 가까워지기 때문이에요.',
          wrong: { avg: (a + b) / 2, sum: a + b } };
      }
    },
    levels: [
      { name: '녹아 있는 양과 농도', vars: { q: sampler(function (r) {
          return { k: r.pick(['salt', 'conc', 'whole']), s: r.int(0, 1), c: r.int(2, 25), M: 50 * r.int(2, 16) };
        }) } },
      { name: '물을 넣거나 증발시키기', vars: { q: sampler(function (r) {
          var k = r.pick(['water', 'evap', 'more']);
          return { k: k, s: r.int(0, 1), a: r.int(2, 24), b: k === 'more' ? r.pick([10, 15, 20, 25, 28, 40, 50]) : r.int(2, 24), M: 50 * r.int(2, 12) };
        }) }, where: function (p) { return p.x <= 900 && p.x % 10 === 0; } },
      { name: '두 가지를 섞기', vars: { q: sampler(function (r) {
          var k = r.pick(['mixx', 'mixtotal', 'mixconc']);
          return { k: k, s: r.int(0, 1), a: r.int(2, 24), b: r.int(2, 24), c: r.int(3, 23), M: 50 * r.int(2, 12), N: 50 * r.int(2, 12), ask: r.int(0, 2) ? 0 : 1 };
        }) }, where: function (p) { return p.x <= 900 && (p.unit === '%' || p.x % 10 === 0); } }
    ],
    mistakes: [
      ['no-100', function () { return '100으로 나누지 않았어요. 농도(%)는 전체를 백으로 볼 때의 비율이라서, 농도를 곱한 다음 반드시 100으로 나눠야 해요.'; }],
      ['divided', function () { return '전체의 양을 농도로 나눴어요. 녹아 있는 양은 전체의 양에 농도를 곱하고 100으로 나눠서 구해요.'; }],
      ['water', function () { return '물의 양을 답으로 썼어요. 전체의 양에서 녹아 있는 양을 뺀 것이 물이에요. 문제가 묻는 것이 무엇인지 다시 읽어 보세요.'; }],
      ['water-only', function () { return '물의 양으로 나눴어요. 농도는 물이 아니라 물과 녹인 것을 합친 전체의 양으로 나눠서 구해요.'; }],
      ['times', function () { return '녹아 있는 양에 농도를 곱했어요. 전체의 양에 농도를 곱하고 100으로 나눈 것이 녹아 있는 양이에요. 전체의 양을 $x$로 놓고 식을 세워요.'; }],
      ['total', function () { return '섞거나 넣은 뒤의 전체 양을 답으로 썼어요. 문제가 묻는 것은 넣는(덜어 내는) 양이에요. $x$의 값을 그대로 답해요.'; }],
      ['salt', function () { return '녹아 있는 양을 답으로 썼어요. 그것은 식을 세우는 데 쓰는 값이에요. 문제가 묻는 것은 물의 양이에요.'; }],
      ['old-total', function () { return '전체의 양이 그대로라고 계산했어요. 더 넣은 만큼 전체의 양도 늘어나요. 나중의 전체 양은 처음 양에 $x$를 더한 것이에요.'; }],
      ['same-amount', function () { return '두 가지를 같은 양만큼 섞는다고 답했어요. 같은 양을 섞으면 농도가 두 농도의 한가운데가 돼요. 만들려는 농도가 한가운데가 아니면 양이 달라야 해요.'; }],
      ['which', function (p) { return '방정식은 맞게 풀었지만 묻는 쪽이 아니에요. $x$로 놓은 것이 어느 쪽인지 다시 확인해 보세요. 구하는 것은 $' + p.ansTex + '$의 값이에요.'; }],
      ['half-each', function () { return '전체를 반씩 나눠 섞는다고 답했어요. 같은 양을 섞으면 농도가 두 농도의 한가운데가 돼요. 만들려는 농도에 맞게 양을 식으로 구해야 해요.'; }],
      ['avg', function () { return '두 농도의 평균을 냈어요. 평균이 되는 것은 두 양이 같을 때뿐이에요. 양이 다르면 많은 쪽의 농도에 더 가까워져요. 녹아 있는 양을 따로 구해 더해야 해요.'; }],
      ['sum', function () { return '두 농도를 더했어요. 섞으면 농도는 두 농도 사이의 값이 돼요. 진한 것과 연한 것을 섞어 더 진해질 수는 없어요.'; }]
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B08', [
  { title: '문장제를 푸는 네 걸음', body: [
    '문장으로 된 문제도 방정식으로 바꾸면 B07에서 배운 대로 풀 수 있어요. 차례는 늘 같아요.',
    { list: ['① 구하려는 것을 $x$로 놓아요.', '② 같은 양을 두 가지로 나타내 등호로 이어요(방정식 세우기).', '③ 방정식을 풀어요.', '④ 구한 값이 문제의 뜻에 맞는지 확인해요.'] },
    '가장 어려운 것은 ②예요. "~이 돼요", "~와 같아요", "모두 ~원이었어요" 같은 말이 등호(=)가 들어갈 자리예요.',
    '④도 잊지 마세요. 사람 수나 물건 수가 음수나 분수로 나오면 식을 잘못 세운 것이에요.'
  ] },
  { title: '말을 식으로 옮기기', body: [
    '우리말을 수학의 말로 번역한다고 생각해요. 순서에 따라 괄호가 필요할 때가 있어요.',
    { ex: [['3x + 5', '어떤 수의 3배에 5를 더한 수'], ['3(x + 5)', '어떤 수에 5를 더한 다음 3배 한 수'], ['x,\\ x + 1,\\ x + 2', '연속하는 세 자연수'], ['10a + b', '십의 자리 숫자가 a, 일의 자리 숫자가 b인 수']] },
    '먼저 계산한 것을 한 덩어리로 다룰 때 괄호로 묶어요. 괄호가 있고 없고에 따라 전혀 다른 식이 돼요.',
    '구하는 것을 꼭 $x$로 놓지 않아도 돼요. 다만 $x$를 구한 뒤 문제가 묻는 것으로 한 번 더 계산해야 해요.'
  ] },
  { title: '값 · 개수 · 나이', body: [
    { list: ['(물건값) = (한 개의 값) × (개수)', '(거스름돈) = (낸 돈) − (물건값)', '합해서 10개이면 한쪽이 $x$개일 때 다른 쪽은 $(10 - x)$개'] },
    { ex: [['800x + 1500 = 5500', '800원짜리 x개와 1500원짜리 1개가 모두 5500원'], ['40 + x = 3(10 + x)', 'x년 뒤 40살인 사람이 10살인 사람의 3배']] },
    '나이 문제에서는 두 사람 모두 $x$살을 더 먹어요. 한쪽에만 $x$를 더하면 안 돼요.',
    '나누어 주는 문제에서는 물건의 전체 수가 변하지 않아요. 남으면 더하고, 모자라면 빼요.'
  ] },
  { title: '거리 · 속력 · 시간', body: [
    '속력은 정해진 시간 동안 가는 거리예요. 시속 60 km는 한 시간에 60 km를 간다는 뜻이에요.',
    { tex: '\\text{(거리)} = \\text{(속력)} \\times \\text{(시간)}' },
    { tex: '\\text{(시간)} = \\dfrac{\\text{(거리)}}{\\text{(속력)}} \\qquad \\text{(속력)} = \\dfrac{\\text{(거리)}}{\\text{(시간)}}' },
    { ex: [['60 \\times 2 = 120', '시속 60 km로 2시간 가면 120 km'], ['\\dfrac{x}{3} + \\dfrac{x}{6} = 3', '갈 때 시속 3 km, 올 때 시속 6 km로 모두 3시간']] },
    '문제에 시간이 주어지면 양쪽을 시간으로, 거리가 주어지면 양쪽을 거리로 맞춰서 식을 세워요.'
  ] },
  { title: '농도', body: [
    '농도는 소금물 전체를 100으로 볼 때 소금이 얼마나 들어 있는지를 나타낸 비율(%)이에요. 10 % 소금물 100 g에는 소금이 10 g 들어 있어요.',
    { tex: '\\text{(소금의 양)} = \\text{(소금물의 양)} \\times \\dfrac{\\text{(농도)}}{100}' },
    { ex: [['200 \\times \\dfrac{10}{100} = 20', '10 % 소금물 200 g 속의 소금은 20 g'], ['소금물', '물과 소금을 합친 것(물 180 g + 소금 20 g = 200 g)']] },
    '물을 더 넣거나 증발시켜도 소금의 양은 그대로예요. 국에 물을 부으면 싱거워지지만 소금이 줄어든 것은 아니에요. 그래서 "앞의 소금의 양 = 뒤의 소금의 양"으로 식을 세워요.',
    '두 소금물을 섞으면 소금도 합쳐지고 소금물도 합쳐져요. 농도끼리 더하거나 평균을 내면 안 돼요.'
  ] }
]);
