/* B15 일차함수와 그래프 — 함수의 뜻, 기울기, 절편, 직선의 식 구하기
   유형(쉬운 것부터): B15.fn 함수 · 일차함수 판단(보기 고르기) · B15.value 함숫값(키패드) · B15.slope 기울기(키패드, 분수)
                     · B15.intercept 절편과 평행이동(키패드, 분수) · B15.graph 그래프와 식(보기 고르기. 그림)
                     · B15.find 직선의 식 구하기(보기 고르기) · B15.word 활용(키패드)
   답이 수 하나이면 키패드, 답이 식 · 그래프 · 개념 판단이면 보기 고르기다.
   기울기와 절편은 분수 { n, d }(d > 0, 기약)로 다룬다. 계산은 모두 정수의 분수 계산이다.
   검산: 답을 만든 계산과 따로, 화면에 보이는 식을 MH.alg.ev 로 읽어 주어진 점 · 조건에 맞는지 본다.
   직선 그림은 figure { type: 'plane', line: [n, d, k] }(y = (n/d)x + k)로 그린다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, order4 = A.order4, gcd = MH.gcd, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var wj = function (w, pair) { return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!(q && ok(q)) && ++i < 150); return q; };
  var won = function (n) { return String(n).replace(/\B(?=(\d{3})+$)/g, ','); };

  /* ── 분수 ── */
  var rat = function (n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(abs(n), d) || 1; return { n: n / g, d: d / g }; };
  var R = function (n) { return { n: n, d: 1 }; };
  var radd = function (a, b) { return rat(a.n * b.d + b.n * a.d, a.d * b.d); };
  var rsub = function (a, b) { return rat(a.n * b.d - b.n * a.d, a.d * b.d); };
  var rmul = function (a, b) { return rat(a.n * b.n, a.d * b.d); };
  var rdiv = function (a, b) { return b.n ? rat(a.n * b.d, a.d * b.n) : null; };
  var neg = function (a) { return { n: -a.n, d: a.d }; };
  var same = function (a, b) { return !!a && !!b && a.n === b.n && a.d === b.d; };
  var fr = function (r) { return (r.n < 0 ? '-' : '') + (r.d === 1 ? String(abs(r.n)) : '\\dfrac{' + abs(r.n) + '}{' + r.d + '}'); };
  var frp = function (r) { return r.n < 0 ? '(' + fr(r) + ')' : fr(r); };
  /** 분수 뒤의 조사: 분수는 '분자'(자 → 받침 없음)로 끝나게 읽는다. 정수는 그 수로 읽는다 */
  var rj = function (r, pair) { return r.d === 1 ? pj(r.n, pair) : pair.split('/')[1]; };
  var xTerm = function (m) { return m.d === 1 ? (m.n === 1 ? 'x' : m.n === -1 ? '-x' : m.n + 'x') : (m.n < 0 ? '-' : '') + '\\dfrac{' + abs(m.n) + '}{' + m.d + '}x'; };
  var tail = function (k) { return k.n === 0 ? '' : (k.n < 0 ? ' - ' : ' + ') + fr({ n: abs(k.n), d: k.d }); };
  var rhs = function (m, k) { return xTerm(m) + tail(k); };
  var line = function (m, k) { return 'y = ' + rhs(m, k); };
  var pt = function (x, y) { return '(' + x + ',\\ ' + y + ')'; };
  /** 화면에 보이는 식(오른쪽)에 x 를 넣은 값이 y 와 같은가 — 답을 만든 계산과 따로 하는 검산 */
  var F = function (r) { return MH.F(r.n, r.d); };
  var evAt = function (tex, x) { return A.ev(tex.replace(/^(y|f\(x\)) = /, ''), { x: F(x) }); };
  var passes = function (tex, x, y) { try { return evAt(tex, x).equals(F(y)); } catch (e) { return false; } };
  var slopeOf = function (tex) { return evAt(tex, R(1)).sub(evAt(tex, R(0))); };

  /* ── 틀: 보기 고르기 ──
     build(q) → { text, tex, figure, ans, wrong: [[보기, 실수 id, 설명] × 3], options(정해진 순서. 없으면 q.o 로 섞는다), hints, steps, check } */
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
      id: o.id, unit: 'B15', version: 1, title: o.title,
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
  /* ── 틀: 수 하나 ──
     o.kind: 'signed'(정수) | 'rational'(분수) | 'int'(자연수 + 단위)
     build(q) → { text, tex, figure, ans: { n, d }, unit, hints, steps, wrong: { 실수 id: 수 | { n, d } }, check } */
  var valueQ = function (o) {
    var lastQ = null, lastP = null, K = o.kind;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (r) { return K === 'rational' ? { n: r.n, d: r.d } : K === 'signed' ? { n: r.n, p: 0 } : r.n; };
    /* 힌트에 나온 수가 문제에 없는데 우연히 답과 같으면 답을 알려 주는 셈이다 */
    var leak = function (p) {
      if (p.ans.d !== 1 || p.ans.n < 0) return false;
      var a = String(p.ans.n);
      return nums((p.tex || '') + ' ' + p.text.replace(/,/g, '')).indexOf(a) < 0 && nums(p.hints.join(' ').replace(/,/g, '')).indexOf(a) >= 0;
    };
    o.levels.forEach(function (lv) {
      lv.where = function (v) { var p = P(v); return !!p && !!p.ans && p.ans.n !== 0 && (K === 'rational' || p.ans.d === 1) && (K !== 'int' || p.ans.n > 0) && p.check === true && !leak(p); };
    });
    MH.defineType({
      id: o.id, unit: 'B15', version: 1, title: o.title,
      answer: K === 'int' ? { kind: 'int', common: false, suffix: function (v) { return P(v).unit || ''; } } : { kind: K },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; if (p.figure) out.figure = p.figure; return out; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) {
        var p = P(v);
        if (p.check !== true) return false;
        return K === 'rational' ? ans.n === p.ans.n && ans.d === p.ans.d && gcd(abs(ans.n), ans.d) === 1 : K === 'signed' ? ans.p === 0 && ans.n === p.ans.n : ans === p.ans.n;
      },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        var norm = function (x) { return x === null || x === undefined ? null : typeof x === 'number' ? (isInt(x) ? R(x) : null) : x; };
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), r = norm(p.wrong[m[0]]), i, e;
            if (!r || same(r, p.ans) || same(r, neg(p.ans)) || (K !== 'rational' && r.d !== 1) || (K === 'int' && r.n <= 0)) return null;   /* 부호만 반대인 답은 공통 실수(sign)가 맡는다 */
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) { e = norm(p.wrong[o.mistakes[i][0]]); if (same(e, r)) return null; }   /* 같은 값이면 앞의 실수만 */
            return val(r);
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  /* ── B15.fn 함수 · 일차함수 판단 ─────────────────────── */
  var FN_YES = [
    function (N) { return ['한 개에 ' + N * 100 + '원인 지우개 x개의 값 y원', 'x를 정하면 값은 ' + N * 100 + ' × x 하나로 정해져요.']; },
    function (N) { return ['자연수 x를 ' + N + pj(N, '으로/로') + ' 나눈 나머지 y', '나눗셈의 나머지는 하나뿐이에요. x를 정하면 y도 하나로 정해져요.']; },
    function () { return ['한 변의 길이가 x cm인 정사각형의 둘레 y cm', '둘레는 4 × x 하나로 정해져요.']; },
    function (N) { return ['시속 ' + N * 10 + ' km로 x시간 동안 간 거리 y km', '거리는 ' + N * 10 + ' × x 하나로 정해져요.']; },
    function () { return ['자연수 x의 약수의 개수 y', '약수는 여러 개여도 그 개수는 하나로 정해져요. 6의 약수는 1, 2, 3, 6이라 개수는 4 하나예요.']; },
    function (N) { return ['x보다 ' + N + '만큼 큰 수 y', 'y는 x + ' + N + ' 하나로 정해져요.']; },
    function (N) { return ['길이가 ' + N * 10 + ' cm인 끈에서 x cm를 쓰고 남은 길이 y cm', '남은 길이는 ' + N * 10 + ' − x 하나로 정해져요.']; },
    function () { return ['수 x의 절댓값 y', '어떤 수의 절댓값은 하나뿐이에요. x가 −3이면 y는 3 하나예요.']; }
  ];
  var FN_NO = [
    function () { return ['자연수 x의 약수 y', 'x가 6이면 y는 1, 2, 3, 6으로 여러 개예요.']; },
    function () { return ['자연수 x의 배수 y', 'x가 2이면 y는 2, 4, 6, …으로 끝없이 많아요.']; },
    function () { return ['절댓값이 x인 수 y', 'x가 3이면 y는 3과 −3 두 개예요.']; },
    function () { return ['자연수 x보다 작은 자연수 y', 'x가 4이면 y는 1, 2, 3으로 여러 개예요. x가 1이면 y가 아예 없어요.']; },
    function () { return ['키가 x cm인 사람의 몸무게 y kg', '키가 같아도 몸무게는 사람마다 달라요. y가 하나로 정해지지 않아요.']; },
    function () { return ['둘레가 x cm인 직사각형의 넓이 y cm²', '둘레가 12 cm여도 가로 1 · 세로 5이면 넓이 5, 가로 2 · 세로 4이면 넓이 8이에요.']; },
    function () { return ['자연수 x와 서로소인 자연수 y', 'x가 4이면 y는 1, 3, 5, 7, …로 끝없이 많아요.']; },
    function () { return ['나이가 x살인 사람의 키 y cm', '나이가 같아도 키는 사람마다 달라요. y가 하나로 정해지지 않아요.']; }
  ];
  var sg = function (n) { return (n < 0 ? ' - ' : ' + ') + abs(n); };
  var WHY = {
    lin: '$y = ax + b$ 꼴이고 $x$ 앞의 수가 0이 아니에요. 일차함수예요.',
    prop: '$y = ax$ 꼴(정비례)도 $b = 0$인 일차함수예요. $x$ 앞의 수만 0이 아니면 돼요.',
    cst: '$x$가 있는 항이 없어요. $y = ax + b$에서 $a = 0$인 셈이라 일차함수가 아니에요.',
    inv: '$x$가 분모에 있어요. $x$에 대한 일차식이 아니라서 일차함수가 아니에요.',
    quad: '$x^{2}$이 있어요. $x$에 대한 이차식이라서 일차함수가 아니에요.'
  };
  /** 식 보기 하나: { tex, lin, why }. simple: 바로 보이는 꼴, 아니면 정리해야 보이는 꼴 */
  var exprItem = function (r, lin, simple) {
    var a = nz(r, -6, 6), b = nz(r, -9, 9), c, d, k = r.int(0, 3), then = function (t) { return '정리하면 $' + t + '$ 꼴이 돼요. '; };
    if (simple) {
      if (lin) {
        if (k === 0) return { tex: line(R(a), R(0)), lin: true, why: WHY.prop };
        if (k === 1) { d = r.int(2, 5); c = nz(r, -4, 4); return gcd(abs(c), d) === 1 ? { tex: line(rat(c, d), R(b)), lin: true, why: WHY.lin } : null; }
        if (k === 2) return { tex: 'y = ' + b + (a < 0 ? ' - ' : ' + ') + (abs(a) === 1 ? '' : abs(a)) + 'x', lin: true, why: '항의 순서만 바뀌었어요. 순서를 바꿔 쓰면 $' + line(R(a), R(b)) + '$ 꼴이라 일차함수예요.' };
        return { tex: line(R(a), R(b)), lin: true, why: WHY.lin };
      }
      if (k === 0) return { tex: 'y = ' + b, lin: false, why: WHY.cst };
      if (k === 1) return { tex: 'y = ' + (a < 0 ? '-' : '') + '\\dfrac{' + abs(a) + '}{x}', lin: false, why: WHY.inv };
      if (k === 2) return { tex: 'y = ' + (abs(a) === 1 ? (a < 0 ? '-' : '') : a) + 'x^{2}' + sg(b), lin: false, why: WHY.quad };
      return { tex: 'y = x^{2}' + (b < 0 ? ' - ' : ' + ') + (abs(b) === 1 ? '' : abs(b)) + 'x', lin: false, why: WHY.quad };
    }
    if (lin) {
      if (k === 0) return { tex: 'y = x(x' + sg(a) + ') - x^{2}', lin: true, why: then(line(R(a), R(0))) + WHY.prop };
      if (k === 1) { c = nz(r, -5, 5); return c === a || abs(a) === 1 ? null : { tex: 'y = ' + a + '(x' + sg(b) + ')' + (c < 0 ? ' + ' : ' - ') + (abs(c) === 1 ? '' : abs(c)) + 'x', lin: true, why: then(line(R(a - c), R(a * b))) + WHY.lin }; }
      if (k === 2) { d = r.int(2, 4); c = d * nz(r, -3, 3); return { tex: 'y = \\dfrac{' + c + 'x' + sg(d * b) + '}{' + d + '}', lin: true, why: then(line(R(c / d), R(b))) + WHY.lin }; }
      return { tex: 'y = x^{2}' + sg(b) + ' - x(x' + sg(a) + ')', lin: true, why: then(line(R(-a), R(b))) + WHY.lin };
    }
    if (k === 0) return abs(a) === 1 ? null : { tex: 'y = ' + a + '(x' + sg(b) + ') ' + (a < 0 ? '+ ' : '- ') + abs(a) + 'x', lin: false, why: then('y = ' + a * b) + WHY.cst };
    if (k === 1) return { tex: 'y = x(x' + sg(a) + ')', lin: false, why: then('y = x^{2}' + (a < 0 ? ' - ' : ' + ') + (abs(a) === 1 ? '' : abs(a)) + 'x') + WHY.quad };
    if (k === 2) return { tex: 'y = x(x' + sg(a) + ')' + (a < 0 ? ' + ' : ' - ') + (abs(a) === 1 ? '' : abs(a)) + 'x', lin: false, why: then('y = x^{2}') + WHY.quad };
    return { tex: 'y = ' + (abs(a) === 1 ? (a < 0 ? '-' : '') : a) + 'x' + sg(b) + (a < 0 ? ' + ' : ' - ') + (abs(a) === 1 ? '' : abs(a)) + 'x', lin: false, why: then('y = ' + b) + WHY.cst };
  };
  /** 식이 일차함수인가: x = 1, 2, 3, 4 에서의 값이 같은 간격으로 변하고 그 간격이 0 이 아니다 */
  var isLinear = function (tex) {
    try {
      var v = [1, 2, 3, 4].map(function (x) { return evAt(tex, R(x)); }), d1 = v[1].sub(v[0]), d2 = v[2].sub(v[1]), d3 = v[3].sub(v[2]);
      return d1.equals(d2) && d2.equals(d3) && !d1.equals(MH.F(0, 1));
    } catch (e) { return null; }
  };
  var fnBuild = function (q) {
    var want = q.want, items = q.items, ans = items[0], rest = items.slice(1), isFn = q.kind === 'fn';
    var word = isFn ? '함수' : '일차함수', text = '다음 중 $y$가 $x$의 ' + word + (want ? '인 것' : wj(word, '이/가') + ' 아닌 것') + '을 고르세요.';
    return {
      text: text, ans: ans.tex,
      wrong: rest.map(function (it, i) { return [it.tex, 'pick-' + (i + 1), (isFn ? (want ? '이것은 함수가 아니에요. ' + it.why + ' $x$ 하나에 $y$가 여러 개이거나 정해지지 않으면 함수가 아니에요.' : '이것은 함수예요. ' + it.why + ' $x$ 하나에 $y$가 하나씩만 정해지면 함수예요.') : (want ? '이것은 일차함수가 아니에요. ' : '이것은 일차함수예요. ') + it.why)]; }),
      check: isFn ? ans.lin === want && rest.every(function (it) { return it.lin !== want; }) : isLinear(ans.tex) === want && rest.every(function (it) { return isLinear(it.tex) === !want; }),
      hints: isFn ? ['함수는 자판기와 같아요. 버튼($x$) 하나를 누르면 음료($y$)가 딱 하나 나와요. 같은 버튼을 눌렀는데 어떤 때는 콜라, 어떤 때는 사이다가 나오면 자판기라고 할 수 없어요. 이렇게 $x$의 값 하나에 $y$의 값이 오직 하나씩 정해질 때, $y$를 $x$의 함수라고 해요.',
          '보기마다 $x$에 쉬운 수를 하나 넣어 봐요. 예를 들어 $x$에 4나 6을 넣어요. 그때 $y$가 될 수 있는 수가 딱 하나인지, 여러 개인지, 아예 없는지를 세어 봐요.',
          '① 보기 하나를 골라 $x$에 수를 넣어요. ② $y$가 하나로 정해지면 함수, 둘 이상이거나 정해지지 않으면 함수가 아니에요. ③ 한 가지 수에서만 보지 말고 다른 수도 넣어 봐요. ④ 문제가 "함수인 것"을 묻는지 "함수가 아닌 것"을 묻는지 다시 확인해요.']
        : ['일차함수는 $y = ax + b$ 꼴로 쓸 수 있는 함수예요. 단, $x$ 앞의 수 $a$가 0이 아니어야 해요. $x$가 한 번만 곱해져 있고($x^{2}$이 없고), $x$가 분모에 있지 않아야 해요. 택시 요금처럼 "기본요금 + 거리마다 일정하게 더해지는 값" 꼴이에요.',
          q.simple ? '보기마다 세 가지를 확인해요. $x^{2}$이 있으면 이차식이라 안 돼요. $x$가 분모에 있으면 안 돼요. $x$가 아예 없으면($y = 5$ 같은 꼴) 안 돼요. $b$는 0이어도 괜찮아요. 항의 순서가 바뀌어 있어도 괜찮아요.'
            : '이 단계의 식은 겉모습만 봐서는 알 수 없어요. 먼저 괄호를 풀고 동류항끼리 정리해요. 정리하면 $x^{2}$이 사라져서 일차함수가 되기도 하고, $x$가 사라져서 일차함수가 아니게 되기도 해요.',
          '① ' + (q.simple ? '보기의 식을 $y = ax + b$와 견줘요.' : '보기의 식을 하나씩 정리해요. 괄호 앞의 수는 괄호 안의 모든 항에 곱해요.') + ' ② $x^{2}$이 남았는지, $x$가 분모에 있는지, $x$가 사라졌는지 확인해요. ③ $y = ax + b$ 꼴이고 $a$가 0이 아닌 것만 일차함수예요. ④ 문제가 "인 것"을 묻는지 "아닌 것"을 묻는지 다시 확인해요.'],
      steps: [{ say: isFn ? '$x$의 값 하나에 $y$의 값이 오직 하나씩 정해지면 함수예요. 보기마다 $x$에 수를 넣어 확인해요.' : '일차함수는 $y = ax + b$ 꼴이고 $a$가 0이 아니에요. 보기를 정리해서 이 꼴인지 확인해요.', tex: isFn ? 'x \\rightarrow y' : 'y = ax + b \\quad (a \\neq 0)' },
        { say: (isFn ? '' : (want ? '이 식은 일차함수예요. ' : '이 식은 일차함수가 아니에요. ')) + ans.why + (isFn ? (want ? ' 그래서 함수예요.' : ' 그래서 함수가 아니에요.') : ''), tex: isFn ? (want ? 'x \\rightarrow y \\ (\\text{하나})' : 'x \\rightarrow y \\ (\\text{하나가 아님})') : ans.tex }]
    };
  };
  var pickItems = function (r, want, make) {
    /* 답 하나(want 에 맞는 것) + 나머지 셋(반대) */
    var out = [], seen = {}, it, tries = 0;
    while (out.length < 4 && tries++ < 80) { it = make(out.length === 0 ? want : !want); if (it && !seen[it.tex]) { seen[it.tex] = 1; out.push(it); } }
    return out.length === 4 ? out : null;
  };
  var fnLevel = function (kind, simple) {
    return sampler(function (r) {
      return until(function () {
        var want = r.int(0, 1) === 1, used = {}, items = pickItems(r, want, function (yes) {
          if (kind !== 'fn') return exprItem(r, yes, simple);
          var pool = yes ? FN_YES : FN_NO, i = r.int(0, pool.length - 1), t = pool[i](r.int(2, 9));
          if (used[(yes ? 'y' : 'n') + i]) return null;
          used[(yes ? 'y' : 'n') + i] = 1; return { tex: t[0], lin: yes, why: t[1] };
        });
        return items ? { kind: kind, simple: simple, want: want, items: items, o: order4(r) } : null;
      }, function (q) { var b = fnBuild(q); return !!b && b.check; });
    });
  };
  choiceQ({
    id: 'B15.fn', title: '함수와 일차함수', ids: ['pick-1', 'pick-2', 'pick-3'], build: fnBuild,
    /* 문제 글은 두 가지뿐이고 보기가 문제마다 다르다(보기의 다양성은 tests/units/b15.test.js 에서 본다) */
    levels: [
      { name: '함수인지 판단하기', minDistinct: 2, vars: { q: fnLevel('fn', true) } },
      { name: '일차함수 고르기', minDistinct: 2, vars: { q: fnLevel('lin', true) } },
      { name: '정리해서 판단하기', minDistinct: 2, vars: { q: fnLevel('lin', false) } }
    ]
  });

  /* ── B15.value 함숫값 ─────────────────────────────── */
  var VALUE = '함수 $f(x)$는 수를 넣으면 계산해서 내놓는 기계예요. $f(3)$은 "$x$ 자리에 3을 넣었을 때 나오는 값"이라는 뜻이고, 이것을 함숫값이라고 해요. $f(x) = 2x + 1$이면 $f(3) = 2 \\times 3 + 1$처럼, 식의 $x$를 모두 그 수로 바꿔 계산해요.';
  var mxp = function (m, p) { return (m.n === 1 && m.d === 1 ? '' : m.n === -1 && m.d === 1 ? '-' : fr(m) + ' \\times ') + (m.d === 1 && abs(m.n) === 1 && p >= 0 ? p : '(' + p + ')').toString().replace(/^\((\d+)\)$/, '$1'); };
  var valueBuild = function (q) {
    var m = q.m, k = q.k, p = q.p, f = 'f(x) = ' + rhs(m, R(k)), mp = rmul(m, R(p)), c = radd(mp, R(k)), wrong = {}, a, t;
    if (q.kind === 'at') {
      wrong['intercept-ignored'] = mp; wrong['sign-slip'] = p < 0 || m.n < 0 ? radd(neg(mp), R(k)) : null; wrong.added = m.d === 1 ? R(m.n + p + k) : null;
      return { tex: f, text: '$f(' + p + ')$의 값을 구하세요.', ans: c, wrong: wrong, check: passes(f, R(p), c),
        hints: [VALUE, '이 문제는 $x$ 자리에 $' + p + '$' + pj(p, '을/를') + ' 넣어요. $x$ 앞의 수 $' + fr(m) + '$' + rj(m, '과/와') + ' 넣는 수를 곱하는 것이지 더하는 것이 아니에요. ' + (p < 0 ? '음수를 넣을 때는 괄호를 치고, 곱의 부호를 먼저 정해요. ' : '') + (m.d > 1 ? '분수와 정수의 곱은 먼저 약분하면 쉬워요. ' : '') + '곱한 다음에 뒤의 수를 더하거나 빼요.',
          '① 식의 $x$를 괄호로 바꾸고 그 안에 넣을 수를 써요. ② 곱셈을 먼저 해요. 부호가 같으면 양수, 다르면 음수예요. ③ 뒤의 수를 더하거나 빼요. ④ 곱하기만 하고 뒤의 수를 빼먹지 않았는지 확인해요.'],
        steps: [{ say: '$x$ 자리에 $' + p + '$' + pj(p, '을/를') + ' 넣어요.', tex: 'f(' + p + ') = ' + mxp(m, p) + tail(R(k)) }, { say: '곱셈을 먼저 해요.', tex: 'f(' + p + ') = ' + fr(mp) + tail(R(k)) }, { say: '덧셈 · 뺄셈을 해요.', tex: 'f(' + p + ') = ' + fr(c) }] };
    }
    if (q.kind === 'inv') {
      /* f(t) = c 일 때 t (= p) */
      wrong['value-plugged'] = radd(rmul(m, c), R(k)); wrong['move-sign'] = rdiv(radd(c, R(k)), m); wrong['not-divided'] = rsub(c, R(k));
      return { tex: f, text: '$f(k) = ' + fr(c) + '$일 때, $k$의 값을 구하세요.', ans: R(p), wrong: wrong, check: passes(f, R(p), c) && c.d === 1,
        hints: [VALUE + ' 이번에는 거꾸로예요. 나온 값을 알려 주고, 넣은 수를 찾아요.', '$f(k)$는 식의 $x$ 자리에 $k$를 넣은 것이에요. 그것이 $' + fr(c) + '$' + rj(c, '과/와') + ' 같다고 했으니, "$k$를 넣은 식 $= ' + fr(c) + '$"이라는 방정식이 생겨요. $' + fr(c) + '$' + rj(c, '을/를') + ' $x$ 자리에 넣는 것이 아니에요. 이 수는 나온 값이에요.',
          '① 식의 $x$를 $k$로 바꿔 쓰고 등호 뒤에 나온 값을 써요. ② 수만 있는 항을 오른쪽으로 이항해요. 이항하면 부호가 바뀌어요. ③ 양쪽을 $k$ 앞의 수로 나눠요. ④ 구한 $k$를 처음 식에 넣어 나온 값이 맞는지 확인해요.'],
        steps: [{ say: '$x$ 자리에 $k$를 넣은 식이 나온 값과 같아요.', tex: rhs(m, R(k)).replace('x', 'k') + ' = ' + fr(c) }, { say: '수만 있는 항을 오른쪽으로 이항해요.', tex: xTerm(m).replace('x', 'k') + ' = ' + fr(rsub(c, R(k))) }, { say: '양쪽을 $k$ 앞의 수로 나눠요.', tex: 'k = ' + p }] };
    }
    /* 상수 a 가 든 식: f(x) = ax + k */
    if (m.d !== 1) return null;
    a = m.n; f = 'f(x) = ax' + tail(R(k)); t = a * p + k;
    if (q.kind === 'coef') {
      wrong['move-sign'] = rat(t + k, p); wrong['not-divided'] = R(t - k); wrong['value-answered'] = R(t);
      return { tex: f, text: '$f(' + p + ') = ' + t + '$일 때, 상수 $a$의 값을 구하세요.', ans: R(a), wrong: wrong, check: passes('f(x) = ' + rhs(R(a), R(k)), R(p), R(t)),
        hints: [VALUE + ' 이 문제는 식 안에 모르는 수 $a$가 있어요.', '$f(' + p + ')$' + pj(p, '은/는') + ' $x$ 자리에 $' + p + '$' + pj(p, '을/를') + ' 넣은 것이에요. 넣으면 $x$는 사라지고 문자는 $a$만 남아요. 그 식이 $' + t + '$' + pj(t, '과/와') + ' 같다고 했으니 $a$에 대한 방정식이 돼요.',
          '① $x$ 자리에 수를 넣어 $a$만 남은 식을 써요. ② 수만 있는 항을 오른쪽으로 이항해요(부호가 바뀌어요). ③ 양쪽을 $a$ 앞의 수로 나눠요. ④ 구한 $a$를 넣어 다시 계산해 확인해요.'],
        steps: [{ say: '$x$ 자리에 $' + p + '$' + pj(p, '을/를') + ' 넣어요.', tex: 'a \\times ' + (p < 0 ? '(' + p + ')' : p) + tail(R(k)) + ' = ' + t }, { say: '수만 있는 항을 이항해요.', tex: (p === 1 ? '' : p === -1 ? '-' : p) + 'a = ' + (t - k) }, { say: '양쪽을 $a$ 앞의 수로 나눠요.', tex: 'a = ' + a }] };
    }
    /* two: f(p) = t 일 때 f(q.p2) */
    c = R(a * q.p2 + k); wrong['coef-answered'] = R(a); wrong['intercept-ignored'] = R(a * q.p2); wrong['first-value'] = R(t);
    return { tex: f, text: '$f(' + p + ') = ' + t + '$일 때, $f(' + q.p2 + ')$의 값을 구하세요.', ans: c, wrong: wrong, check: passes('f(x) = ' + rhs(R(a), R(k)), R(p), R(t)) && passes('f(x) = ' + rhs(R(a), R(k)), R(q.p2), c) && p !== q.p2,
      hints: [VALUE + ' 이 문제는 두 걸음이에요. 먼저 모르는 수 $a$를 찾고, 그다음 함숫값을 구해요.', '첫 걸음: $x$ 자리에 $' + p + '$' + pj(p, '을/를') + ' 넣은 식이 $' + t + '$' + pj(t, '과/와') + ' 같다는 조건으로 $a$를 구해요. 둘째 걸음: 구한 $a$를 식에 넣어 식을 완성하고, $x$ 자리에 $' + q.p2 + '$' + pj(q.p2, '을/를') + ' 넣어요. $a$를 구한 데서 멈추면 안 돼요.',
        '① $x$ 자리에 처음 수를 넣어 $a$에 대한 방정식을 세워요. ② 이항하고 나눠서 $a$를 구해요. ③ $a$를 넣어 $f(x)$의 식을 완성해요. ④ 그 식의 $x$ 자리에 문제에서 묻는 수를 넣어 계산해요.'],
      steps: [{ say: '$x$ 자리에 $' + p + '$' + pj(p, '을/를') + ' 넣어 $a$에 대한 식을 세워요.', tex: 'a \\times ' + (p < 0 ? '(' + p + ')' : p) + tail(R(k)) + ' = ' + t }, { say: '$a$의 값을 구해요.', tex: 'a = ' + a }, { say: '식을 완성해요.', tex: 'f(x) = ' + rhs(R(a), R(k)) },
        { say: '$x$ 자리에 $' + q.p2 + '$' + pj(q.p2, '을/를') + ' 넣어요.', tex: 'f(' + q.p2 + ') = ' + mxp(R(a), q.p2) + tail(R(k)) + ' = ' + c.n }] };
  };
  var okV = function (q) { var b = valueBuild(q); return !!b && b.check && b.ans.d === 1 && b.ans.n !== 0 && abs(b.ans.n) <= 60; };
  var slopeR = function (r, frac) { var d = frac ? r.int(2, 5) : 1, n = nz(r, frac ? -4 : -6, frac ? 4 : 6); return gcd(abs(n), d) === 1 ? rat(n, d) : null; };
  valueQ({
    id: 'B15.value', title: '함숫값', kind: 'signed', build: valueBuild,
    mistakes: [['intercept-ignored', '곱하기만 하고 뒤의 수를 더하거나 빼지 않았어요. $f(x) = ax + b$에서는 $a$와 $x$를 곱한 다음 $b$까지 계산해야 해요.'],
      ['sign-slip', '음수를 곱할 때 부호를 잘못 정했어요. 부호가 같은 두 수의 곱은 양수, 부호가 다른 두 수의 곱은 음수예요. 음수를 넣을 때는 괄호를 쳐서 써요.'],
      ['added', '$x$ 앞의 수와 넣는 수를 곱하지 않고 더했어요. $3x$는 $3 \\times x$라는 뜻이에요. $x$에 수를 넣으면 곱셈이 돼요.'],
      ['value-plugged', '주어진 값을 $x$ 자리에 넣었어요. $f(k) = c$에서 $c$는 나온 값이고, 넣은 수는 $k$예요. "$k$를 넣은 식 = $c$"로 방정식을 세워요.'],
      ['move-sign', '수를 이항할 때 부호를 바꾸지 않았어요. 등호를 건너가면 $+$는 $-$로, $-$는 $+$로 바뀌어요.'],
      ['not-divided', '이항까지만 하고 문자 앞의 수로 나누지 않았어요. 마지막에 양쪽을 문자 앞의 수로 나눠야 문자의 값이 나와요.'],
      ['value-answered', '문제에 나온 함숫값을 그대로 답했어요. 묻는 것은 상수 $a$예요. $x$ 자리에 수를 넣어 $a$에 대한 방정식을 풀어요.'],
      ['coef-answered', '상수 $a$의 값을 답했어요. $a$는 맞게 구했을 수 있어요. 문제에서 묻는 것은 그 $a$로 완성한 식의 함숫값이에요.'],
      ['first-value', '문제에 나온 함숫값을 그대로 답했어요. 그 값은 $a$를 구하는 데 쓰는 조건이에요. 묻는 것은 다른 수를 넣었을 때의 함숫값이에요.']],
    levels: [
      { name: '함숫값 구하기', vars: { q: sampler(function (r) { return until(function () { return { kind: 'at', m: slopeR(r, false), k: nz(r, -9, 9), p: nz(r, -6, 6) }; }, okV); }) } },
      { name: '분수 계수 · 거꾸로 구하기', vars: { q: sampler(function (r) {
          return until(function () { var inv = r.int(0, 1) === 1, m = slopeR(r, !inv || r.int(0, 1) === 1); return m ? { kind: inv ? 'inv' : 'at', m: m, k: nz(r, -9, 9), p: m.d * nz(r, -4, 4) } : null; }, okV);
        }) } },
      { name: '상수가 든 함수', vars: { q: sampler(function (r) {
          return until(function () { return { kind: r.pick(['coef', 'two']), m: R(nz(r, -6, 6)), k: nz(r, -9, 9), p: nz(r, -5, 5), p2: nz(r, -5, 5) }; }, function (q) { return okV(q) && abs(q.m.n * q.p + q.k) <= 40 && q.m.n * q.p + q.k !== 0; });
        }) } }
    ]
  });

  /* ── B15.slope 기울기 ─────────────────────────────── */
  var SLOPE = '기울기는 직선이 얼마나 가파른지를 나타내는 수예요. 계단을 떠올려요. 옆으로 1칸 갈 때 위로 몇 칸 올라가는지가 기울기예요. 식으로는 ($y$의 값의 증가량) ÷ ($x$의 값의 증가량)이에요. 오른쪽으로 갈 때 내려가는 직선은 기울기가 음수예요. 일차함수 $y = ax + b$에서는 $x$ 앞의 수 $a$가 바로 기울기예요.';
  var M_RECIP = ['reciprocal', '분자와 분모를 거꾸로 썼어요. 기울기는 ($y$의 값의 증가량)이 분자, ($x$의 값의 증가량)이 분모예요. "위로 간 만큼 ÷ 옆으로 간 만큼"으로 기억해요.'];
  var slopeBuild = function (q) {
    var m = q.m, k = q.k, wrong = {}, t, dy, dx, f;
    if (q.kind === 'read') {
      t = q.rev ? 'y = ' + k + (m.n < 0 ? ' - ' : ' + ') + xTerm({ n: abs(m.n), d: m.d }) : line(m, R(k));
      wrong['intercept-answered'] = R(k); wrong.reciprocal = abs(m.n) !== m.d ? rdiv(R(1), m) : null; wrong['number-only'] = q.rev ? null : null;
      return { tex: t, text: '이 일차함수의 그래프의 기울기를 구하세요.', ans: m, wrong: wrong, check: slopeOf(t).equals(F(m)),
        hints: [SLOPE, (q.rev ? '이 식은 항의 순서가 바뀌어 있어요. 앞에 있다고 기울기가 아니에요. $x$가 붙어 있는 항을 찾아요. ' : '') + '이 식에서 $x$에 곱해진 수를 찾아요. 부호까지 함께 읽어요. $x$ 앞에 $-$가 있으면 기울기는 음수예요. $x$가 붙지 않은 수는 기울기가 아니라 $y$절편이에요.',
          '① 식을 $y = ax + b$ 꼴과 견줘요. ② $x$에 곱해진 수 $a$를 부호와 함께 읽어요. ③ $x$만 있으면 $a = 1$, $-x$이면 $a = -1$이에요. ④ 분수이면 분자 칸과 분모 칸에 나눠 넣어요.'],
        steps: [{ say: '$y = ax + b$ 꼴에서 $x$에 곱해진 수가 기울기예요.' + (q.rev ? ' 항의 순서를 바꿔 써요.' : ''), tex: line(m, R(k)) }, { say: '$x$ 앞의 수를 부호와 함께 읽어요.', tex: '(\\text{기울기}) = ' + fr(m) }] };
    }
    if (q.kind === 'inc') {
      dy = rmul(m, R(q.dx)); t = line(m, R(k));
      wrong['slope-only'] = m; wrong.divided = rdiv(R(q.dx), m); wrong['intercept-added'] = radd(dy, R(k));
      return { tex: t, text: '$x$의 값이 ' + q.dx + '만큼 증가할 때, $y$의 값의 증가량을 구하세요.', ans: dy, wrong: wrong, check: evAt(t, R(q.dx + 2)).sub(evAt(t, R(2))).equals(F(dy)),
        hints: [SLOPE, '이 직선의 기울기는 $' + fr(m) + '$' + rj(m, '이에요/예요') + '. $x$가 1 늘 때마다 $y$가 그만큼씩 변한다는 뜻이에요. $x$가 ' + q.dx + '만큼 늘면 그 변화가 ' + q.dx + '번 쌓여요. $y$절편은 출발점일 뿐이라 증가량과는 상관없어요.',
          '① 식에서 기울기를 읽어요. ② ($y$의 값의 증가량) = (기울기) × ($x$의 값의 증가량)이에요. ③ 기울기가 음수이면 증가량도 음수예요. $y$가 줄어든다는 뜻이에요. ④ $y$절편은 더하지 않아요.'],
        steps: [{ say: '식에서 기울기를 읽어요.', tex: '(\\text{기울기}) = ' + fr(m) }, { say: '기울기에 $x$의 값의 증가량을 곱해요.', tex: fr(m) + ' \\times ' + q.dx + ' = ' + fr(dy) }] };
    }
    if (q.kind === 'pts' || q.kind === 'fig') {
      dy = q.y2 - q.y1; dx = q.x2 - q.x1;
      if (!dx || !dy) return null;
      m = rat(dy, dx); wrong.reciprocal = abs(m.n) !== m.d ? rat(dx, dy) : null;
      if (q.kind === 'pts') wrong['minus-negative'] = q.y1 < 0 ? rat(q.y2 + q.y1, dx) : q.x1 < 0 && q.x2 + q.x1 ? rat(dy, q.x2 + q.x1) : null;
      else wrong['intercept-answered'] = R(q.k);
      f = q.kind === 'fig' ? { type: 'plane', range: 5, line: [q.m.n, q.m.d, q.k], points: [{ x: q.x1, y: q.y1, label: 'A' }, { x: q.x2, y: q.y2, label: 'B' }] } : null;
      return { text: q.kind === 'fig' ? '그림의 직선은 두 점 A, B를 지나요. 이 직선의 기울기를 구하세요.' : '두 점 $' + pt(q.x1, q.y1) + '$, $' + pt(q.x2, q.y2) + '$' + pj(q.y2, '을/를') + ' 지나는 직선의 기울기를 구하세요.', figure: f, ans: m, wrong: wrong,
        check: q.kind === 'fig' ? same(m, q.m) && passes(line(q.m, R(q.k)), R(q.x1), R(q.y1)) && passes(line(q.m, R(q.k)), R(q.x2), R(q.y2)) : true,
        hints: [SLOPE, (q.kind === 'fig' ? '먼저 그림에서 두 점의 좌표를 읽어요. 점에서 아래(위)로 내려가 $x$축의 눈금을, 옆으로 가서 $y$축의 눈금을 읽어요. ' : '') + '한 점에서 다른 점으로 갈 때 $x$가 얼마나 변했는지, $y$가 얼마나 변했는지 각각 구해요. 둘 다 "나중 점의 좌표 − 처음 점의 좌표"로, 같은 순서로 빼야 해요. 음수를 뺄 때는 $-(-2) = +2$처럼 부호가 바뀌는 것에 주의해요.',
          '① 두 점 가운데 하나를 처음 점, 다른 하나를 나중 점으로 정해요. ② $y$좌표끼리 빼서 $y$의 값의 증가량을 구해요. ③ $x$좌표끼리 같은 순서로 빼서 $x$의 값의 증가량을 구해요. ④ ($y$의 증가량) ÷ ($x$의 증가량)을 분수로 쓰고 약분해요. $y$가 분자예요.'],
        steps: [{ say: (q.kind === 'fig' ? '그림에서 두 점의 좌표를 읽어요: A$' + pt(q.x1, q.y1) + '$, B$' + pt(q.x2, q.y2) + '$. ' : '') + '$y$좌표끼리, $x$좌표끼리 같은 순서로 빼요.', tex: '\\dfrac{' + q.y2 + ' - ' + (q.y1 < 0 ? '(' + q.y1 + ')' : q.y1) + '}{' + q.x2 + ' - ' + (q.x1 < 0 ? '(' + q.x1 + ')' : q.x1) + '} = \\dfrac{' + dy + '}{' + dx + '}' },
          { say: '약분하고 부호를 정리해요.', tex: '(\\text{기울기}) = ' + fr(m) }] };
    }
    /* three: 세 점이 한 직선 위 → 셋째 점의 y좌표 */
    dy = q.y2 - q.y1; dx = q.x2 - q.x1; m = rat(dy, dx); t = radd(R(q.y2), rmul(m, R(q.x3 - q.x2)));
    wrong['slope-answered'] = m; wrong.reciprocal = abs(m.n) !== m.d ? radd(R(q.y2), rmul(rat(dx, dy), R(q.x3 - q.x2))) : null; wrong['step-only'] = rmul(m, R(q.x3 - q.x2));
    return { text: '세 점 $' + pt(q.x1, q.y1) + '$, $' + pt(q.x2, q.y2) + '$, $' + pt(q.x3, 'k') + '$가 한 직선 위에 있을 때, $k$의 값을 구하세요.', ans: t, wrong: wrong, check: t.d === 1 && (t.n - q.y2) * dx === dy * (q.x3 - q.x2) && q.x3 !== q.x1 && q.x3 !== q.x2,
      hints: [SLOPE + ' 직선은 어디에서 재도 기울기가 같아요. 이것이 이 문제의 열쇠예요.', '세 점이 한 직선 위에 있으면, 어느 두 점을 골라 기울기를 구해도 같은 값이 나와요. 좌표를 모두 아는 앞의 두 점으로 기울기를 먼저 구해요. 그다음 둘째 점과 셋째 점 사이의 기울기도 그 값과 같다고 식을 세워요.',
        '① 앞의 두 점으로 기울기를 구해요. ② 둘째 점에서 셋째 점까지 $x$가 얼마나 변했는지 구해요. ③ $y$는 (기울기) × ($x$의 변화)만큼 변해요. ④ 둘째 점의 $y$좌표에 그 변화를 더하면 $k$예요.'],
      steps: [{ say: '앞의 두 점으로 기울기를 구해요.', tex: '\\dfrac{' + q.y2 + ' - ' + (q.y1 < 0 ? '(' + q.y1 + ')' : q.y1) + '}{' + q.x2 + ' - ' + (q.x1 < 0 ? '(' + q.x1 + ')' : q.x1) + '} = ' + fr(m) },
        { say: '둘째 점과 셋째 점 사이의 기울기도 같아요.', tex: '\\dfrac{k - ' + (q.y2 < 0 ? '(' + q.y2 + ')' : q.y2) + '}{' + q.x3 + ' - ' + (q.x2 < 0 ? '(' + q.x2 + ')' : q.x2) + '} = ' + fr(m) },
        { say: '$x$가 ' + (q.x3 - q.x2) + '만큼 변했으니 $y$는 기울기의 ' + (q.x3 - q.x2) + '배만큼 변해요.', tex: 'k = ' + q.y2 + ' + ' + frp(rmul(m, R(q.x3 - q.x2))) + ' = ' + fr(t) }] };
  };
  var okS = function (q) { var b = slopeBuild(q); return !!b && b.check && b.ans.n !== 0; };
  valueQ({
    id: 'B15.slope', title: '기울기', kind: 'rational', build: slopeBuild,
    mistakes: [M_RECIP, ['intercept-answered', '$y$절편을 답했어요. $x$가 붙지 않은 수(직선이 $y$축과 만나는 곳)는 $y$절편이에요. 기울기는 $x$에 곱해진 수, 곧 옆으로 1칸 갈 때 위로 가는 칸 수예요.'],
      ['slope-only', '기울기를 그대로 답했어요. 기울기는 $x$가 1 늘 때의 변화예요. $x$가 여러 칸 늘면 기울기에 그 칸 수를 곱해야 해요.'],
      ['divided', '곱해야 할 것을 나눴어요. ($y$의 값의 증가량) = (기울기) × ($x$의 값의 증가량)이에요.'],
      ['intercept-added', '증가량에 $y$절편까지 더했어요. $y$절편은 출발점일 뿐이에요. 얼마나 변했는지는 기울기와 $x$의 증가량만으로 정해져요.'],
      ['minus-negative', '음수를 뺄 때 부호를 바꾸지 않았어요. $5 - (-2)$는 $5 + 2$예요. 음수 좌표는 괄호를 쳐서 빼요.'],
      ['slope-answered', '기울기를 답했어요. 기울기는 맞게 구했을 수 있어요. 묻는 것은 셋째 점의 $y$좌표 $k$예요. 둘째 점에서 기울기만큼 더 가야 해요.'],
      ['step-only', '$y$가 변한 양만 답했어요. 그 변화를 둘째 점의 $y$좌표에 더해야 셋째 점의 $y$좌표가 돼요.']],
    levels: [
      { name: '식에서 읽기 · 증가량', vars: { q: sampler(function (r) {
          return until(function () { var m = slopeR(r, r.int(0, 2) === 0), inc = r.int(0, 1) === 1; return m ? { kind: inc ? 'inc' : 'read', m: m, k: nz(r, -9, 9), rev: !inc && r.int(0, 2) === 0, dx: m.d * r.int(2, 6) } : null; }, okS);
        }) } },
      { name: '두 점을 지나는 직선', vars: { q: sampler(function (r) {
          return until(function () { return { kind: 'pts', x1: r.int(-6, 6), y1: r.int(-8, 8), x2: r.int(-6, 6), y2: r.int(-8, 8) }; }, function (q) { return okS(q) && abs(q.x2 - q.x1) <= 8; });
        }) } },
      { name: '그래프에서 읽기 · 세 점', vars: { q: sampler(function (r) {
          return until(function () {
            var m = slopeR(r, r.int(0, 1) === 1), k, x1, t;
            if (!m || abs(m.n) > 3 || m.d > 3) return null;
            if (r.int(0, 1)) { k = r.int(-3, 3); x1 = m.d * r.int(-2, 1); t = r.int(1, 2); return { kind: 'fig', m: m, k: k, x1: x1, y1: m.n * x1 / m.d + k, x2: x1 + m.d * t, y2: m.n * (x1 + m.d * t) / m.d + k }; }
            k = r.int(-5, 5); x1 = m.d * r.int(-3, 2); t = x1 + m.d * r.int(1, 2);
            return { kind: 'three', x1: x1, y1: m.n * x1 / m.d + k, x2: t, y2: m.n * t / m.d + k, x3: t + m.d * nz(r, -3, 4) };
          }, function (q) { return okS(q) && [q.x1, q.x2, q.y1, q.y2].every(function (c) { return abs(c) <= 5; }) && (q.kind !== 'fig' || (q.x1 !== 0 || q.y1 !== 0) && (q.x2 !== 0 || q.y2 !== 0)); });
        }) } }
    ]
  });

  /* ── B15.intercept 절편과 평행이동 ───────────────────── */
  var ICPT = '절편은 직선이 축과 만나는 곳이에요. $y$절편은 $y$축과 만나는 점의 $y$좌표이고, 그 점에서는 $x = 0$이에요. $x$절편은 $x$축과 만나는 점의 $x$좌표이고, 그 점에서는 $y = 0$이에요. 택시로 치면 $y$절편은 출발할 때 이미 찍혀 있는 기본요금이에요.';
  var icptBuild = function (q) {
    var m = q.m, k = q.k, k2 = q.kind === 'shift' ? k + q.s : k, t = line(m, R(k)), xi = rdiv(R(-k2), m), wrong = {}, ask = q.ask, ans = ask === 'y' ? R(k2) : xi, final = line(m, R(k2));
    if (!k2 || !xi) return null;
    wrong['other-intercept'] = ask === 'y' ? xi : R(k2); wrong['slope-answered'] = m;
    if (ask === 'x') { wrong['x-inverted'] = rdiv(neg(m), R(k2)); }
    if (q.kind === 'shift') { wrong['shift-ignored'] = ask === 'y' ? R(k) : rdiv(R(-k), m); wrong['shift-opposite'] = ask === 'y' ? R(k - q.s) : rdiv(R(-(k - q.s)), m); wrong['shift-answered'] = R(q.s); }
    var steps = [], solveX = [{ say: '$x$절편은 $y = 0$일 때의 $x$의 값이에요. $y$ 자리에 0을 넣어요.', tex: '0 = ' + rhs(m, R(k2)) }, { say: '$x$가 있는 항과 수를 등호의 양쪽으로 나눠요. 이항하면 부호가 바뀌어요.', tex: m.n > 0 ? xTerm(m) + ' = ' + (-k2) : xTerm(neg(m)) + ' = ' + k2 }, { say: '양쪽을 $x$ 앞의 수로 나눠요.', tex: 'x = ' + fr(xi) }];
    if (q.kind === 'shift') steps.push({ say: '$y$축의 방향으로 $' + q.s + '$만큼 평행이동하면 식의 끝에 $' + q.s + '$' + pj(q.s, '을/를') + ' 더해요. 기울기는 그대로예요.', tex: 'y = ' + rhs(m, R(k)) + (q.s < 0 ? ' - ' : ' + ') + abs(q.s) });
    if (q.kind === 'shift') steps.push({ say: '수끼리 계산해서 정리해요.', tex: final });
    steps = steps.concat(ask === 'y' ? [{ say: '$y$절편은 $x = 0$일 때의 $y$의 값이에요. $x$ 자리에 0을 넣으면 뒤의 수만 남아요.', tex: 'y = ' + (m.d === 1 && abs(m.n) === 1 ? (m.n < 0 ? '-' : '') + '0' : fr(m) + ' \\times 0') + tail(R(k2)) }, { say: '그래서 $y$절편은 식의 맨 뒤의 수예요.', tex: '(y\\text{절편}) = ' + k2 }] : solveX);
    return { tex: t, text: q.kind === 'shift' ? '이 일차함수의 그래프를 $y$축의 방향으로 $' + q.s + '$만큼 평행이동한 그래프의 $' + ask + '$절편을 구하세요.' : '이 일차함수의 그래프의 $' + ask + '$절편을 구하세요.', ans: ans, wrong: wrong,
      check: ask === 'y' ? passes(final, R(0), ans) && evAt(final, R(0)).sub(evAt(t, R(0))).equals(MH.F(k2 - k, 1)) : passes(final, ans, R(0)),
      hints: [ICPT, (q.kind === 'shift' ? '먼저 평행이동한 그래프의 식을 구해요. $y$축의 방향으로 평행이동한다는 것은 직선을 기울이지 않고 그대로 위아래로 옮기는 거예요. 양수만큼이면 위로, 음수만큼이면 아래로 가요. 기울기는 변하지 않고, 식의 맨 뒤의 수에만 그만큼 더해져요. 그다음 ' : '') + (ask === 'y' ? '$y$절편은 $x$ 자리에 0을 넣은 값이에요. $x$가 있는 항이 0이 되어 사라지니, 뒤의 수만 부호와 함께 남아요.' : '$x$절편은 $y$ 자리에 0을 넣고 $x$를 구한 값이에요. "$0 = $ (식)"이라는 일차방정식을 풀어요. 식의 맨 뒤의 수를 그대로 답하면 그것은 $y$절편이에요.'),
        '① ' + (q.kind === 'shift' ? '원래 식의 끝에 평행이동한 만큼을 더해 새 식을 만들어요. ② ' : '') + (ask === 'y' ? '식의 $x$ 자리에 0을 넣어요. ' + (q.kind === 'shift' ? '③' : '②') + ' 남은 수를 부호와 함께 읽어요. ' + (q.kind === 'shift' ? '④' : '③') + ' $x$ 앞의 수(기울기)와 헷갈리지 않았는지 확인해요.' : '식의 $y$ 자리에 0을 넣어요. ' + (q.kind === 'shift' ? '③' : '②') + ' $x$가 있는 항과 수를 등호의 양쪽으로 나눠요. 이항하면 부호가 바뀌어요. ' + (q.kind === 'shift' ? '④' : '③') + ' $x$ 앞의 수로 나눠요. 나누어떨어지지 않으면 분수로 답해요.')],
      steps: steps };
  };
  var okI = function (q) { var b = icptBuild(q); return !!b && b.check; };
  valueQ({
    id: 'B15.intercept', title: '절편과 평행이동', kind: 'rational', build: icptBuild,
    mistakes: [['other-intercept', '다른 쪽 절편을 답했어요. $x$절편은 $y = 0$일 때의 $x$의 값이고, $y$절편은 $x = 0$일 때의 $y$의 값이에요. 문제에서 어느 쪽을 묻는지 다시 확인해요.'],
      ['slope-answered', '기울기를 답했어요. $x$ 앞의 수는 기울기예요. 절편은 직선이 축과 만나는 곳의 좌표예요.'],
      ['x-inverted', '나눗셈을 거꾸로 했어요. $ax = c$에서 $x$는 $c$를 $a$로 나눈 값이에요. $x$ 앞의 수가 분모로 가요.'],
      ['shift-ignored', '평행이동하기 전의 그래프의 절편을 답했어요. 먼저 식의 끝에 평행이동한 만큼을 더해서 새 식을 만들어요.'],
      ['shift-opposite', '평행이동의 방향을 반대로 계산했어요. $y$축의 방향으로 양수만큼이면 위로 가니 더하고, 음수만큼이면 아래로 가니 빼요.'],
      ['shift-answered', '평행이동한 양을 그대로 답했어요. 그 수는 원래 식의 끝에 더하는 수예요. 더해서 만든 새 식에서 절편을 구해요.']],
    levels: [
      { name: '절편이 정수', vars: { q: sampler(function (r) {
          return until(function () { var m = R(nz(r, -6, 6)), ask = r.pick(['x', 'y']); return { kind: 'plain', m: m, k: ask === 'x' ? m.n * nz(r, -6, 6) : nz(r, -12, 12), ask: ask }; }, okI);
        }) } },
      { name: '분수가 나오는 절편', vars: { q: sampler(function (r) {
          return until(function () { var m = slopeR(r, r.int(0, 1) === 1); return m ? { kind: 'plain', m: m, k: nz(r, -9, 9), ask: r.pick(['x', 'x', 'y']) } : null; }, function (q) { return okI(q) && (q.ask === 'y' ? q.m.d > 1 : q.m.d > 1 || q.k % q.m.n !== 0); });
        }) } },
      { name: '평행이동', vars: { q: sampler(function (r) {
          return until(function () { var m = slopeR(r, r.int(0, 2) === 0); return m ? { kind: 'shift', m: m, k: r.int(-8, 8), s: nz(r, -7, 7), ask: r.pick(['x', 'y']) } : null; }, okI);
        }) } }
    ]
  });

  /* ── B15.graph 그래프와 식 ─────────────────────────── */
  var QN = ['제1사분면', '제2사분면', '제3사분면', '제4사분면'];
  var missing = function (up, high) { return up ? (high ? 3 : 1) : (high ? 2 : 0); };
  var GRAPH = '일차함수 $y = ax + b$의 그래프는 두 수만 알면 그릴 수 있어요. $b$($y$절편)는 직선이 $y$축과 만나는 높이예요. $a$(기울기)는 방향과 가파르기예요. $a$가 양수이면 오른쪽 위로 올라가고(오르막), 음수이면 오른쪽 아래로 내려가요(내리막).';
  var W_SLOPE = '기울기의 부호가 반대예요. 오른쪽 위로 올라가는 직선은 기울기가 양수, 오른쪽 아래로 내려가는 직선은 기울기가 음수예요.';
  var W_ICPT = '$y$절편의 부호가 반대예요. 직선이 $y$축과 원점보다 위에서 만나면 $y$절편은 양수, 아래에서 만나면 음수예요.';
  var graphBuild = function (q) {
    var m = q.m, k = q.k, t = line(m, R(k)), wrong, up = m.n > 0, high = k > 0, x2, pts;
    if (q.kind === 'fig') {
      x2 = abs(m.n + k) <= 5 ? m.d : -m.d; pts = [{ x: 0, y: k }, { x: x2, y: m.n * x2 / m.d + k }];
      wrong = [[line(neg(m), R(k)), 'slope-sign', W_SLOPE + ' 그림의 직선이 오른쪽으로 갈 때 올라가는지 내려가는지 다시 봐요.'], [line(m, R(-k)), 'intercept-sign', W_ICPT + ' 그림에서 직선이 $y$축과 만나는 점의 눈금을 읽어요.'],
        abs(m.n) !== m.d ? [line(rdiv(R(1), m), R(k)), 'reciprocal', '기울기의 분자와 분모가 거꾸로예요. 기울기는 (위로 간 칸 수) ÷ (옆으로 간 칸 수)예요. 옆으로 간 칸 수가 분모예요.'] : [line(neg(m), R(-k)), 'both-sign', '기울기와 $y$절편의 부호가 모두 반대예요. 직선의 방향(오르막 · 내리막)과 $y$축과 만나는 높이를 하나씩 다시 읽어요.']];
      return { text: '그림의 직선을 그래프로 하는 일차함수의 식을 고르세요.', figure: { type: 'plane', range: 5, line: [m.n, m.d, k], points: pts }, ans: t, wrong: wrong, check: pts.every(function (p) { return passes(t, R(p.x), R(p.y)) && abs(p.y) <= 5; }) && wrong.every(function (w) { return !pts.every(function (p) { return passes(w[0], R(p.x), R(p.y)); }); }),
        hints: [GRAPH, '그림에서 두 가지를 읽어요. 첫째, 직선이 $y$축과 만나는 점의 눈금이 $y$절편이에요. 둘째, 직선 위에 찍힌 두 점 사이를 계단처럼 가 봐요. 한 점에서 다른 점까지 옆으로 몇 칸, 위(아래)로 몇 칸 가는지 세어요. 아래로 가면 음수로 세어요.',
          '① $y$축 위의 점을 찾아 $y$절편 $b$를 읽어요. ② 그 점에서 다른 점까지 옆으로 간 칸 수와 위로 간 칸 수를 세어요. ③ 기울기 $a$ = (위로 간 칸 수) ÷ (옆으로 간 칸 수)예요. ④ $y = ax + b$에 두 수를 넣은 보기를 골라요.'],
        steps: [{ say: '직선이 $y$축과 만나는 점은 $' + pt(0, k) + '$' + pj(k, '이에요/예요') + '. $y$절편을 읽어요.', tex: '(y\\text{절편}) = ' + k }, { say: '점 $' + pt(0, k) + '$에서 점 $' + pt(pts[1].x, pts[1].y) + '$까지 $x$는 $' + x2 + '$만큼, $y$는 $' + (pts[1].y - k) + '$만큼 변해요.', tex: '(\\text{기울기}) = \\dfrac{' + (pts[1].y - k) + '}{' + x2 + '} = ' + fr(m) }, { say: '$y = ax + b$에 넣어요.', tex: t }] };
    }
    if (q.kind === 'quad') {
      var ans = QN[missing(up, high)], seen = {}, far = R(100), mid = rdiv(R(-k), rmul(m, R(2))), quad = function (x) { var y = evAt(t, x), px = x.n > 0, py = y.compare(MH.F(0, 1)) > 0; return px ? (py ? 0 : 3) : (py ? 1 : 2); };
      [far, neg(far), mid].forEach(function (x) { seen[quad(x)] = 1; });
      wrong = [[QN[missing(!up, high)], 'slope-sign', '기울기의 부호를 반대로 봤어요. 이 식의 기울기는 $' + fr(m) + '$' + rj(m, '이라/라') + ' 직선은 오른쪽 ' + (up ? '위로 올라가요' : '아래로 내려가요') + '.'],
        [QN[missing(up, !high)], 'intercept-sign', '$y$절편의 부호를 반대로 봤어요. 이 식의 $y$절편은 $' + k + '$' + pj(k, '이라/라') + ' 직선은 $y$축과 원점보다 ' + (high ? '위' : '아래') + '에서 만나요.'],
        [QN[missing(!up, !high)], 'both-sign', '이 직선은 그 사분면을 지나요. $y$축과 원점보다 ' + (high ? '위' : '아래') + '에서 만나고 오른쪽 ' + (up ? '위로 올라가는' : '아래로 내려가는') + ' 직선을 직접 그려서 확인해요.']];
      return { tex: t, text: '이 일차함수의 그래프가 지나지 않는 사분면을 고르세요.', ans: ans, options: QN, wrong: wrong, check: Object.keys(seen).length === 3 && !seen[missing(up, high)],
        hints: [GRAPH + ' 좌표평면은 오른쪽 위가 제1사분면이고, 시계 반대 방향으로 제2, 제3, 제4사분면이에요.', '이 식의 기울기는 $' + fr(m) + '$, $y$절편은 $' + k + '$' + pj(k, '이에요/예요') + '. 먼저 $y$축 위에 $y$절편의 자리를 점으로 찍어요. 원점보다 위인지 아래인지가 중요해요. 그 점을 지나면서, 기울기의 부호에 맞게 오르막 또는 내리막 직선을 길게 그어요.',
          '① $y$절편의 부호로 $y$축 위의 점을 찍어요. ② 기울기의 부호로 직선의 방향을 정해 길게 그어요. ③ 직선이 양쪽으로 뻗어 나가며 지나는 사분면을 세어요. 원점을 지나지 않는 기울어진 직선은 사분면 세 개를 지나요. ④ 지나지 않는 나머지 하나를 골라요.'],
        steps: [{ say: '$y$절편이 $' + k + '$' + pj(k, '이라/라') + ' 직선은 $y$축과 원점보다 ' + (high ? '위' : '아래') + '에서 만나요.', tex: '(y\\text{절편}) = ' + k + (high ? ' > 0' : ' < 0') }, { say: '기울기가 $' + fr(m) + '$' + rj(m, '이라/라') + ' 직선은 오른쪽 ' + (up ? '위로 올라가요' : '아래로 내려가요') + '.', tex: '(\\text{기울기}) = ' + fr(m) + (up ? ' > 0' : ' < 0') },
          { say: '이런 직선은 ' + QN.filter(function (n) { return n !== ans; }).join(', ') + '을 지나고 ' + ans + '은 지나지 않아요.', tex: t }] };
    }
    /* par: 평행한 것 고르기 */
    var a = line(m, R(q.k2)), m2 = q.m2;
    wrong = [[line(m2, R(k)), 'same-intercept', '$y$절편이 같을 뿐 기울기가 달라요. 기울기가 다른 두 직선은 한 점에서 만나요. 이 직선은 $y$축 위의 점 $' + pt(0, k) + '$에서 만나요.'],
      [line(neg(m), R(q.k2)), 'slope-sign', '기울기의 부호가 반대예요. 숫자가 같아도 한쪽은 오르막, 한쪽은 내리막이라 서로 만나요. 평행하려면 기울기가 부호까지 같아야 해요.'],
      [line(neg(m), R(k)), 'mirror', '기울기의 부호가 반대라서 평행하지 않아요. $y$절편이 같아서 $y$축 위의 점 $' + pt(0, k) + '$에서 만나요.']];
    return { tex: t, text: '다음 중 그래프가 이 일차함수의 그래프와 평행한 것을 고르세요.', ans: a, wrong: wrong, check: slopeOf(a).equals(slopeOf(t)) && !evAt(a, R(0)).equals(evAt(t, R(0))) && wrong.every(function (w) { return !slopeOf(w[0]).equals(slopeOf(t)); }),
      hints: ['평행한 두 직선은 기찻길의 두 레일처럼 아무리 가도 만나지 않아요. 그러려면 가파르기와 방향이 똑같아야 해요. 곧 기울기가 같아야 해요. 그리고 $y$절편은 달라야 해요. $y$절편까지 같으면 완전히 겹친 한 직선(일치)이에요.',
        '문제의 식에서 기울기는 $' + fr(m) + '$, $y$절편은 $' + k + '$' + pj(k, '이에요/예요') + '. 보기마다 $x$ 앞의 수를 부호까지 읽어서 이 기울기와 같은지 견줘요. $y$절편이 같다고 평행한 것이 아니에요. 그런 직선은 $y$축 위의 같은 점에서 만나요.',
        '① 문제의 식에서 $x$ 앞의 수(기울기)를 부호와 함께 읽어요. ② 보기마다 기울기를 읽어요. ③ 기울기가 부호까지 같은 보기를 찾아요. ④ 그 보기의 $y$절편이 문제의 식과 다른지 확인해요.'],
      steps: [{ say: '문제의 식의 기울기를 읽어요.', tex: '(\\text{기울기}) = ' + fr(m) }, { say: '기울기가 같고 $y$절편이 다른 식이 평행한 직선이에요.', tex: a }] };
  };
  var okG = function (q) { var b = graphBuild(q); return !!b && b.check; };
  choiceQ({
    id: 'B15.graph', title: '그래프와 식', ids: ['slope-sign', 'intercept-sign', 'reciprocal', 'both-sign', 'same-intercept', 'mirror'], build: graphBuild,
    levels: [
      { name: '그래프를 보고 식 고르기', minDistinct: 80, vars: { q: sampler(function (r) {
          return until(function () { var m = slopeR(r, r.int(0, 1) === 1); return m && abs(m.n) <= 3 && m.d <= 3 ? { kind: 'fig', m: m, k: nz(r, -4, 4), o: order4(r) } : null; }, okG);
        }) } },
      { name: '지나지 않는 사분면', minDistinct: 200, vars: { q: sampler(function (r) {
          return until(function () { var m = slopeR(r, r.int(0, 1) === 1); return m ? { kind: 'quad', m: m, k: nz(r, -9, 9), o: order4(r) } : null; }, okG);
        }) } },
      { name: '평행한 직선', vars: { q: sampler(function (r) {
          return until(function () { var m = slopeR(r, r.int(0, 1) === 1), m2 = slopeR(r, r.int(0, 1) === 1), k = nz(r, -9, 9), k2 = nz(r, -9, 9); return m && m2 && k !== k2 && !same(m, m2) && !same(neg(m), m2) ? { kind: 'par', m: m, m2: m2, k: k, k2: k2, o: order4(r) } : null; }, okG);
        }) } }
    ]
  });

  /* ── B15.find 직선의 식 구하기 ──────────────────────── */
  var FIND = '직선의 식 $y = ax + b$를 구한다는 것은 두 수 $a$(기울기)와 $b$($y$절편)를 찾는 일이에요. 길 안내와 같아요. "어디서 출발해서($b$) 어느 방향으로 얼마나 가파르게 가는지($a$)"만 알면 길 전체가 정해져요. 문제의 조건에서 이 두 수를 하나씩 알아내요.';
  var E = {
    'slope-sign': '기울기의 부호가 반대예요. 기울기는 ($y$의 값의 증가량) ÷ ($x$의 값의 증가량)이고, 뺄 때 두 좌표를 같은 순서로 빼야 부호가 맞아요.',
    'intercept-sign': '$y$절편의 부호가 반대예요. $y$절편이 음수이면 식의 끝이 "$- $(수)" 꼴이 돼요.',
    'both-sign': '기울기와 $y$절편의 부호가 모두 반대예요. 문제에 나온 두 수를 부호와 함께 그대로 옮겨요.',
    swapped: '기울기와 $y$절편의 자리를 바꿔 썼어요. $y = ax + b$에서 $x$에 곱해진 수가 기울기이고, 따로 떨어진 수가 $y$절편이에요.',
    'b-sign': '$b$를 구할 때 이항하면서 부호를 바꾸지 않았어요. 점의 좌표를 넣은 다음, 수를 등호 건너로 옮기면 부호가 바뀌어요.',
    'b-is-y': '점의 $y$좌표를 그대로 $y$절편으로 썼어요. $y$절편은 $x = 0$일 때의 $y$의 값이에요. 지나는 점의 $x$좌표가 0이 아니면 식에 넣어 $b$를 계산해야 해요.',
    reciprocal: '기울기의 분자와 분모가 거꾸로예요. 기울기는 ($y$의 값의 증가량)이 분자, ($x$의 값의 증가량)이 분모예요.',
    'x-as-b': '$x$절편을 $y$절편 자리에 썼어요. $y = ax + b$의 $b$는 $y$절편이에요. $x$절편은 $y = 0$일 때의 $x$의 값이에요.',
    'kept-intercept': '평행한 직선의 식을 그대로 가져왔어요. 평행하면 기울기만 같고 $y$절편은 달라요. 지나는 점을 넣어 $b$를 새로 구해요.'
  };
  var findBuild = function (q) {
    var m = q.m, k, text, cands, wrong = [], seen, steps = [], h2, chk, bStep = function (p, y) {
      return [{ say: '$y = ax + b$에 기울기를 넣어요. $b$는 아직 몰라요.', tex: 'y = ' + xTerm(m) + ' + b' }, { say: '지나는 점 $' + pt(p, y) + '$의 좌표를 넣어요.', tex: y + ' = ' + (m.d === 1 && m.n === 1 ? '' : m.d === 1 && m.n === -1 ? '-' : fr(m) + ' \\times ') + (p < 0 ? '(' + p + ')' : p) + ' + b' },
        { say: '곱셈을 하고 수를 이항해서 $b$를 구해요.', tex: 'b = ' + y + (rmul(m, R(p)).n < 0 ? ' + ' : ' - ') + fr(rat(abs(rmul(m, R(p)).n), rmul(m, R(p)).d)) + ' = ' + k.n }];
    };
    if (q.kind === 'mk') {
      k = R(q.k); text = '기울기가 $' + fr(m) + '$이고 $y$절편이 $' + q.k + '$인 직선을 그래프로 하는 일차함수의 식을 고르세요.';
      cands = [[R(q.k), m, 'swapped'], [m, neg(k), 'intercept-sign'], [neg(m), k, 'slope-sign'], [neg(m), neg(k), 'both-sign']];
      steps = [{ say: '$y = ax + b$에서 $a$는 기울기, $b$는 $y$절편이에요.', tex: 'a = ' + fr(m) + ',\\quad b = ' + q.k }];
      h2 = '이 문제는 두 수를 모두 알려 줬어요. 기울기 $' + fr(m) + '$' + rj(m, '은/는') + ' $x$에 곱해지는 자리에, $y$절편 $' + q.k + '$' + pj(q.k, '은/는') + ' 따로 더해지는 자리에 써요. $y$절편이 음수이면 "$+ (-3)$"을 "$- 3$"으로 써요.';
      chk = function (t) { return slopeOf(t).equals(F(m)) && passes(t, R(0), k); };
    } else if (q.kind === 'mp' || q.kind === 'par') {
      k = rsub(R(q.y), rmul(m, R(q.p)));
      text = (q.kind === 'par' ? '일차함수 $' + line(m, R(q.c)) + '$의 그래프와 평행하고' : '기울기가 $' + fr(m) + '$이고') + ' 점 $' + pt(q.p, q.y) + '$' + pj(q.y, '을/를') + ' 지나는 직선을 그래프로 하는 일차함수의 식을 고르세요.';
      cands = (q.kind === 'par' ? [[m, R(q.c), 'kept-intercept']] : []).concat([[m, radd(R(q.y), rmul(m, R(q.p))), 'b-sign'], [m, R(q.y), 'b-is-y'], [neg(m), k, 'slope-sign'], [neg(m), radd(R(q.y), rmul(m, R(q.p))), 'both-sign']]);
      steps = (q.kind === 'par' ? [{ say: '평행한 두 직선은 기울기가 같아요. 주어진 식에서 기울기를 읽어요.', tex: '(\\text{기울기}) = ' + fr(m) }] : []).concat(bStep(q.p, q.y));
      h2 = (q.kind === 'par' ? '평행한 직선은 기울기가 같아요. 주어진 식의 $x$ 앞의 수가 구하는 직선의 기울기예요. $y$절편은 가져오면 안 돼요. ' : '기울기는 알려 줬으니 $a$는 정해졌어요. ') + '이제 $b$만 찾으면 돼요. 직선이 점 $' + pt(q.p, q.y) + '$' + pj(q.y, '을/를') + ' 지난다는 것은, 식의 $x$ 자리에 $' + q.p + '$, $y$ 자리에 $' + q.y + '$' + pj(q.y, '을/를') + ' 넣으면 등식이 성립한다는 뜻이에요. 넣으면 $b$만 남은 방정식이 돼요.';
      chk = function (t) { return slopeOf(t).equals(F(m)) && passes(t, R(q.p), R(q.y)); };
    } else if (q.kind === 'two') {
      m = rat(q.y2 - q.y1, q.x2 - q.x1); k = rsub(R(q.y1), rmul(m, R(q.x1)));
      text = '두 점 $' + pt(q.x1, q.y1) + '$, $' + pt(q.x2, q.y2) + '$' + pj(q.y2, '을/를') + ' 지나는 직선을 그래프로 하는 일차함수의 식을 고르세요.';
      cands = [[neg(m), k, 'slope-sign'], abs(m.n) !== m.d ? [rdiv(R(1), m), k, 'reciprocal'] : null, [m, radd(R(q.y1), rmul(m, R(q.x1))), 'b-sign'], [m, R(q.y1), 'b-is-y'], [neg(m), neg(k), 'both-sign']];
      steps = [{ say: '두 점으로 기울기를 먼저 구해요. $y$좌표끼리, $x$좌표끼리 같은 순서로 빼요.', tex: '\\dfrac{' + q.y2 + ' - ' + (q.y1 < 0 ? '(' + q.y1 + ')' : q.y1) + '}{' + q.x2 + ' - ' + (q.x1 < 0 ? '(' + q.x1 + ')' : q.x1) + '} = ' + fr(m) }].concat(bStep(q.x1, q.y1));
      h2 = '두 점을 알면 두 걸음으로 풀어요. 첫 걸음: 두 점 사이에서 $y$가 변한 양을 $x$가 변한 양으로 나눠 기울기를 구해요. 둘째 걸음: 구한 기울기를 $y = ax + b$에 넣고, 두 점 가운데 계산하기 쉬운 점 하나의 좌표를 넣어 $b$를 구해요. 어느 점을 넣어도 같은 $b$가 나와요.';
      chk = function (t) { return passes(t, R(q.x1), R(q.y1)) && passes(t, R(q.x2), R(q.y2)); };
    } else {
      /* xy: x절편 s, y절편 k */
      k = R(q.k); m = rat(-q.k, q.s);
      text = '$x$절편이 $' + q.s + '$이고 $y$절편이 $' + q.k + '$인 직선을 그래프로 하는 일차함수의 식을 고르세요.';
      cands = [[neg(m), k, 'slope-sign'], abs(q.k) !== abs(q.s) ? [rat(-q.s, q.k), k, 'reciprocal'] : null, [m, R(q.s), 'x-as-b'], [neg(m), neg(k), 'both-sign'], [m, neg(k), 'intercept-sign']];
      steps = [{ say: '$x$절편이 $' + q.s + '$이면 점 $' + pt(q.s, 0) + '$을, $y$절편이 $' + q.k + '$이면 점 $' + pt(0, q.k) + '$' + pj(q.k, '을/를') + ' 지나요. 두 점으로 기울기를 구해요.', tex: '\\dfrac{' + q.k + ' - 0}{0 - ' + (q.s < 0 ? '(' + q.s + ')' : q.s) + '} = ' + fr(m) }, { say: '$y$절편은 문제에 나와 있어요.', tex: 'b = ' + q.k }];
      h2 = '절편을 점으로 바꿔 생각해요. $x$절편이 $' + q.s + '$' + pj(q.s, '이라는/라는') + ' 것은 직선이 $x$축 위의 점 $' + pt(q.s, 0) + '$을 지난다는 뜻이에요. $y$절편이 $' + q.k + '$' + pj(q.k, '이라는/라는') + ' 것은 $y$축 위의 점 $' + pt(0, q.k) + '$' + pj(q.k, '을/를') + ' 지난다는 뜻이에요. 이 두 점으로 기울기를 구해요. $b$는 $y$절편 그대로예요.';
      chk = function (t) { return passes(t, R(q.s), R(0)) && passes(t, R(0), k); };
    }
    if (k.d !== 1) return null;
    seen = [line(m, k)];
    cands.forEach(function (c) { var t; if (!c || !c[0] || c[1].d !== 1 || wrong.length >= 3) return; t = line(c[0], c[1]); if (seen.indexOf(t) < 0 && !chk(t)) { seen.push(t); wrong.push([t, c[2], E[c[2]]]); } });
    steps.push({ say: '구한 기울기와 $y$절편을 $y = ax + b$에 넣어요.', tex: line(m, k) });
    return { text: text, ans: line(m, k), wrong: wrong, check: chk(line(m, k)) && abs(k.n) <= 20,
      hints: [FIND, h2, '① 조건에서 기울기 $a$를 알아내요(바로 주어지거나, 두 점으로 계산하거나, 평행한 직선에서 가져와요). ② $y = ax + b$에 $a$를 넣어요. ③ 직선이 지나는 점의 좌표를 $x$, $y$ 자리에 넣어 $b$를 구해요($y$절편이 주어졌으면 그대로 써요). ④ 완성한 식에 주어진 점을 넣어 등식이 맞는지 확인해요.'],
      steps: steps };
  };
  var okF = function (q) { var b = findBuild(q); return !!b && b.check && b.wrong.length === 3; };
  choiceQ({
    id: 'B15.find', title: '직선의 식 구하기', ids: Object.keys(E), build: findBuild,
    levels: [
      { name: '기울기와 y절편 · 기울기와 한 점', vars: { q: sampler(function (r) {
          return until(function () { var m = slopeR(r, r.int(0, 2) === 0); return !m ? null : r.int(0, 2) === 0 ? { kind: 'mk', m: m, k: nz(r, -9, 9), o: order4(r) } : { kind: 'mp', m: m, p: m.d * nz(r, -4, 4), y: r.int(-8, 8), o: order4(r) }; }, okF);
        }) } },
      { name: '두 점을 지나는 직선', vars: { q: sampler(function (r) {
          return until(function () { var m = slopeR(r, r.int(0, 1) === 1), k = r.int(-8, 8), x1, x2; if (!m) return null; x1 = m.d * r.int(-4, 4); x2 = m.d * r.int(-4, 4); return x1 === x2 ? null : { kind: 'two', x1: x1, y1: m.n * x1 / m.d + k, x2: x2, y2: m.n * x2 / m.d + k, o: order4(r) }; }, function (q) { return okF(q) && abs(q.y1) <= 12 && abs(q.y2) <= 12; });
        }) } },
      { name: '두 절편 · 평행한 직선', vars: { q: sampler(function (r) {
          return until(function () { var m = slopeR(r, r.int(0, 2) === 0); return r.int(0, 1) ? { kind: 'xy', s: nz(r, -8, 8), k: nz(r, -8, 8), o: order4(r) } : !m ? null : { kind: 'par', m: m, c: nz(r, -9, 9), p: m.d * nz(r, -4, 4), y: r.int(-8, 8), o: order4(r) }; }, function (q) { return okF(q) && (q.kind !== 'par' || findBuild(q).ans !== line(q.m, R(q.c))); });
        }) } }
    ]
  });

  /* ── B15.word 활용 ────────────────────────────────── */
  var WORD = '일정하게 늘거나 줄어드는 양은 일차함수로 나타낼 수 있어요. 택시 요금을 떠올려요. 타자마자 찍혀 있는 기본요금이 "처음 양"이고, 갈수록 일정하게 붙는 요금이 "한 번에 변하는 양"이에요. 식으로는 $y$ = (한 번에 변하는 양) × $x$ + (처음 양)이에요. 줄어드는 상황이면 한 번에 변하는 양이 음수예요.';
  var TH = [
    { up: true, xu: '분', yu: 'L', xn: '물을 넣은 시간', yn: '물의 양',
      intro: function (b, a) { return '물이 ' + b + ' L 들어 있는 물탱크에 1분에 ' + a + ' L씩 물을 넣어요.'; }, at: function (t) { return '물을 넣기 시작한 지 ' + t + '분 후에 물탱크에 들어 있는 물의 양은 몇 L인지 구하세요.'; },
      inv: function (y) { return '물탱크의 물의 양이 ' + y + ' L가 되는 것은 물을 넣기 시작한 지 몇 분 후인지 구하세요.'; },
      obs: function (t1, y1, t2, y2) { return '물이 들어 있는 물탱크에 일정한 빠르기로 물을 넣고 있어요. 물을 넣기 시작한 지 ' + t1 + '분 후의 물의 양은 ' + y1 + ' L, ' + t2 + '분 후의 물의 양은 ' + y2 + ' L였어요.'; },
      pred: function (t) { return '물을 넣기 시작한 지 ' + t + '분 후의 물의 양은 몇 L인지 구하세요.'; }, start: '처음에 물탱크에 들어 있던 물의 양은 몇 L인지 구하세요.' },
    { up: false, xu: '분', yu: 'mm', xn: '불을 붙인 뒤 지난 시간', yn: '양초의 길이',
      intro: function (b, a) { return '길이가 ' + b + ' mm인 양초에 불을 붙이면 1분에 ' + a + ' mm씩 짧아져요.'; }, at: function (t) { return '불을 붙인 지 ' + t + '분 후에 남은 양초의 길이는 몇 mm인지 구하세요.'; },
      inv: function (y) { return '남은 양초의 길이가 ' + y + ' mm가 되는 것은 불을 붙인 지 몇 분 후인지 구하세요.'; },
      obs: function (t1, y1, t2, y2) { return '양초에 불을 붙였더니 일정한 빠르기로 짧아졌어요. 불을 붙인 지 ' + t1 + '분 후의 양초의 길이는 ' + y1 + ' mm, ' + t2 + '분 후의 양초의 길이는 ' + y2 + ' mm였어요.'; },
      pred: function (t) { return '불을 붙인 지 ' + t + '분 후의 양초의 길이는 몇 mm인지 구하세요.'; }, start: '불을 붙이기 전 양초의 길이는 몇 mm인지 구하세요.' },
    { up: true, xu: '개', yu: 'cm', xn: '매단 추의 개수', yn: '용수철의 길이',
      intro: function (b, a) { return '길이가 ' + b + ' cm인 용수철에 추를 한 개 매달 때마다 길이가 ' + a + ' cm씩 늘어나요.'; }, at: function (t) { return '추를 ' + t + '개 매달았을 때 용수철의 길이는 몇 cm인지 구하세요.'; },
      inv: function (y) { return '용수철의 길이가 ' + y + ' cm가 되려면 추를 몇 개 매달아야 하는지 구하세요.'; },
      obs: function (t1, y1, t2, y2) { return '용수철에 무게가 같은 추를 매달면 추의 개수에 따라 길이가 일정하게 늘어나요. 추를 ' + t1 + '개 매달았을 때의 길이는 ' + y1 + ' cm, ' + t2 + '개 매달았을 때의 길이는 ' + y2 + ' cm였어요.'; },
      pred: function (t) { return '추를 ' + t + '개 매달았을 때 용수철의 길이는 몇 cm인지 구하세요.'; }, start: '추를 매달지 않았을 때 용수철의 길이는 몇 cm인지 구하세요.' },
    { up: false, xu: 'km', yu: 'L', xn: '달린 거리', yn: '남은 연료의 양', per: 10,
      intro: function (b, a) { return '연료가 ' + b + ' L 들어 있는 자동차가 10 km를 달릴 때마다 연료를 ' + a + ' L씩 써요.'; }, at: function (t) { return t + ' km를 달린 뒤에 남은 연료의 양은 몇 L인지 구하세요.'; },
      inv: function (y) { return '남은 연료의 양이 ' + y + ' L가 되는 것은 몇 km를 달린 뒤인지 구하세요.'; },
      obs: null }
  ];
  var wordBuild = function (q) {
    var th = TH[q.t], a = th.up ? q.a : -q.a, b = q.b, per = th.per || 1, m = rat(a, per), f = line(m, R(b)), wrong = {}, ans, text, unit, steps, h2, t = q.x, y = b + a * t / per, dirWord = th.up ? '늘어나요' : '줄어들어요';
    var setup = { say: '$x$: ' + th.xn + '(' + th.xu + '), $y$: ' + th.yn + '(' + th.yu + '). 처음 양은 ' + b + ', ' + (per > 1 ? per + ' ' + th.xu + '마다 ' : '한 번에 ') + q.a + '씩 ' + dirWord + '.', tex: f };
    if (q.kind === 'at') {
      ans = y; unit = th.yu; text = th.intro(b, q.a) + ' ' + th.at(t);
      wrong['rate-only'] = q.a * t / per; wrong.direction = b - a * t / per; wrong['start-ignored'] = null;
      steps = [setup, { say: '$x$ 자리에 $' + t + '$' + pj(t, '을/를') + ' 넣어요.', tex: 'y = ' + (per > 1 ? fr(m) + ' \\times ' + t : (a === 1 ? '' : a === -1 ? '-' : a + ' \\times ') + t) + ' + ' + b }, { say: '계산해요.', tex: 'y = ' + y }];
      h2 = '이 상황에서 처음 양은 ' + b + ' ' + th.yu + '이고, ' + (per > 1 ? per + ' ' + th.xu + '마다 ' : th.xu === '개' ? '추 한 개마다 ' : '1' + th.xu + '마다 ') + q.a + ' ' + th.yu + '씩 ' + dirWord + '. ' + t + (th.xu === '개' ? '개를 매달면' : ' ' + th.xu + (th.xu === '분' ? '이 지나면' : '를 달리면')) + ' 그 변화가 ' + (per > 1 ? t + ' ÷ ' + per + '번' : t + '번') + ' 쌓여요. 처음 양에서 그만큼 ' + (th.up ? '더해요' : '빼요') + '. 변한 양만 답하지 말고 처음 양을 꼭 넣어요.';
    } else if (q.kind === 'inv') {
      ans = t; unit = th.xu; text = th.intro(b, q.a) + ' ' + th.inv(y);
      wrong['no-start'] = rat(y * per, q.a).d === 1 ? y * per / q.a : null; wrong['value-plugged'] = null; wrong['change-only'] = abs(y - b);
      steps = [setup, { say: '$y$ 자리에 $' + y + '$' + pj(y, '을/를') + ' 넣어요.', tex: y + ' = ' + rhs(m, R(b)) }, { say: '$x$가 있는 항과 수를 등호의 양쪽으로 나눠요. 이항하면 부호가 바뀌어요.', tex: m.n > 0 ? xTerm(m) + ' = ' + (y - b) : xTerm(neg(m)) + ' = ' + (b - y) }, { say: '양쪽을 $x$ 앞의 수로 나눠요.', tex: 'x = ' + t }];
      h2 = '이번에는 결과(' + y + ' ' + th.yu + ')를 알려 주고 $x$를 물어요. 처음 양 ' + b + ' ' + th.yu + '에서 ' + y + ' ' + th.yu + '까지 얼마나 변했는지 먼저 구해요. 그 변화가 ' + (per > 1 ? per + ' ' + th.xu + '마다 ' : '한 번에 ') + q.a + ' ' + th.yu + '씩 쌓인 것이니, 변한 양을 ' + q.a + pj(q.a, '으로/로') + ' 나누면 몇 번 쌓였는지 알 수 있어요.' + (per > 1 ? ' 한 번이 ' + per + ' ' + th.xu + '라는 것도 잊지 않아요.' : '') + ' 식으로는 $y$ 자리에 ' + y + pj(y, '을/를') + ' 넣은 방정식을 풀어요.';
    } else {
      /* obs: 두 번의 관찰 → 식을 찾아 예측(pred)하거나 처음 양(start)을 구한다 */
      var y1 = b + a * q.t1, y2 = b + a * q.t2, y3 = b + a * q.t3;
      ans = q.kind === 'pred' ? y3 : b; unit = th.yu; text = th.obs(q.t1, y1, q.t2, y2) + ' ' + (q.kind === 'pred' ? th.pred(q.t3) : th.start);
      wrong.proportional = q.kind === 'pred' && (y2 * q.t3) % q.t2 === 0 ? y2 * q.t3 / q.t2 : null; wrong['rate-answered'] = q.a; wrong['first-observed'] = q.kind === 'start' ? y1 : null; wrong['start-answered'] = q.kind === 'pred' ? b : null;
      steps = [{ say: '$x$를 ' + th.xn + ', $y$를 ' + th.yn + wj(th.yn, '이라고/라고') + ' 하면 두 번의 관찰은 두 점 $' + pt(q.t1, y1) + '$, $' + pt(q.t2, y2) + '$' + pj(y2, '이에요/예요') + '. 기울기(한 번에 변하는 양)를 구해요.', tex: '\\dfrac{' + y2 + ' - ' + y1 + '}{' + q.t2 + ' - ' + q.t1 + '} = ' + a },
        { say: '$y = ' + xTerm(R(a)) + ' + b$에 점 $' + pt(q.t1, y1) + '$' + pj(y1, '을/를') + ' 넣어 처음 양 $b$를 구해요.', tex: 'b = ' + y1 + (a < 0 ? ' + ' : ' - ') + abs(a) + ' \\times ' + q.t1 + ' = ' + b }];
      steps.push(q.kind === 'pred' ? { say: '식 $' + f + '$의 $x$ 자리에 $' + q.t3 + '$' + pj(q.t3, '을/를') + ' 넣어요.', tex: 'y = ' + (a === 1 ? '' : a === -1 ? '-' : a + ' \\times ') + q.t3 + ' + ' + b + ' = ' + y3 } : { say: '처음 양은 $x = 0$일 때의 $y$의 값, 곧 $y$절편이에요.', tex: f });
      if (q.kind === 'start') steps.push({ say: '$y$절편을 읽어요.', tex: '(\\text{처음 양}) = ' + b });
      h2 = '이 문제는 처음 양도, 한 번에 변하는 양도 알려 주지 않았어요. 대신 두 번의 관찰이 있어요. ' + th.xn + wj(th.xn, '이/가') + ' ' + q.t1 + '에서 ' + q.t2 + pj(q.t2, '으로/로') + ' 변하는 동안 ' + th.yn + wj(th.yn, '이/가') + ' 얼마나 변했는지 구해서 나누면 한 번에 변하는 양이 나와요. 그다음 관찰 하나에서 거꾸로 따라가면 처음 양을 알 수 있어요. ' + th.yn + wj(th.yn, '은/는') + ' ' + th.xn + '에 정비례하지 않아요. 처음 양이 있기 때문이에요.';
      if (a * (q.t2 - q.t1) !== y2 - y1) return null;
    }
    return { text: text, ans: R(ans), unit: unit, wrong: wrong, steps: steps,
      check: isInt(y) && y > 0 && (q.kind === 'pred' || q.kind === 'start' ? passes(f, R(q.t1), R(b + a * q.t1)) && passes(f, R(q.t2), R(b + a * q.t2)) && passes(f, R(q.kind === 'pred' ? q.t3 : 0), R(ans)) && b + a * q.t3 > 0 : passes(f, R(t), R(y))),
      hints: [WORD, h2, '① 변하는 두 양을 $x$, $y$로 놓아요. ② 처음 양과 한 번에 변하는 양을 찾아 $y = ax + b$ 꼴의 식을 세워요. 줄어들면 $a$는 음수예요. ③ 문제에서 알려 준 값을 $x$ 또는 $y$ 자리에 넣어요. ④ 계산한 답이 상황에 맞는지(음수가 아닌지, 단위가 맞는지) 확인해요.'] };
  };
  var okW = function (q) { var b = wordBuild(q); return !!b && b.check && b.ans.n > 0; };
  var wordQ = function (r, kind) {
    var t = r.int(0, kind === 'obs' ? 2 : 3), th = TH[t], a = t === 3 ? r.int(1, 3) : t === 1 ? r.int(2, 5) : r.int(2, 9), q;
    if (kind === 'obs') {
      q = { kind: r.pick(['pred', 'start']), t: t, a: a, t1: r.int(2, 5) }; q.t2 = q.t1 + r.int(2, 5); q.t3 = q.t2 + r.int(2, 8);
      q.b = th.up ? r.int(5, 40) : a * (q.t3 + r.int(2, 10)) + r.int(0, 4); q.x = 0;
      return q;
    }
    q = { kind: kind, t: t, a: a, x: (th.per || 1) * r.int(2, 12) };
    q.b = th.up ? r.int(5, 60) : a * (q.x / (th.per || 1) + r.int(1, 10)) + (t === 3 ? 0 : r.int(0, 4));
    return q;
  };
  valueQ({
    id: 'B15.word', title: '일차함수의 활용', kind: 'int', build: wordBuild,
    mistakes: [['rate-only', '변한 양만 답했어요. 처음부터 있던 양을 빼먹었어요. $y$ = (한 번에 변하는 양) × $x$ + (처음 양)에서 처음 양까지 계산해야 해요.'],
      ['direction', '늘어나는지 줄어드는지를 반대로 계산했어요. 늘어나면 처음 양에 더하고, 줄어들면 처음 양에서 빼요. 문제의 낱말(넣어요, 짧아져요, 써요 …)을 다시 읽어요.'],
      ['no-start', '처음 양을 생각하지 않고 나눴어요. 먼저 처음 양에서 얼마나 변했는지를 구하고, 그 변한 양을 한 번에 변하는 양으로 나눠요.'],
      ['change-only', '변한 양까지만 구했어요. 그 변한 양을 한 번에 변하는 양으로 나눠야 몇 번(몇 분, 몇 개)인지 알 수 있어요.'],
      ['proportional', '정비례로 계산했어요. 처음 양이 0이 아니면 $x$가 2배가 되어도 $y$는 2배가 되지 않아요. 한 번에 변하는 양과 처음 양을 따로 구해요.'],
      ['rate-answered', '한 번에 변하는 양(기울기)을 답했어요. 그 값은 식을 세우는 데 쓰는 수예요. 문제에서 묻는 것을 다시 확인해요.'],
      ['first-observed', '첫 번째 관찰한 값을 그대로 답했어요. 그때는 이미 시간이 지난 뒤예요. 처음 양은 $x = 0$일 때의 값이라, 관찰한 값에서 거꾸로 따라가야 해요.'],
      ['start-answered', '처음 양($y$절편)을 답했어요. 처음 양은 맞게 구했을 수 있어요. 묻는 것은 식에 새로운 $x$의 값을 넣은 결과예요.']],
    levels: [
      { name: '식을 세워 값 구하기', vars: { q: sampler(function (r) { return until(function () { return wordQ(r, 'at'); }, okW); }) } },
      { name: '거꾸로 구하기', vars: { q: sampler(function (r) { return until(function () { return wordQ(r, 'inv'); }, okW); }) } },
      { name: '두 번의 관찰로 식 찾기', vars: { q: sampler(function (r) { return until(function () { return wordQ(r, 'obs'); }, okW); }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B15', [
  { title: '함수', body: [
    '두 양 $x$, $y$가 있을 때, $x$의 값 하나에 $y$의 값이 오직 하나씩 정해지면 $y$를 $x$의 함수라고 해요.',
    '자판기와 같아요. 버튼($x$) 하나를 누르면 음료($y$)가 딱 하나 나와요.',
    { ex: [['x \\rightarrow 2x', '2배 하는 규칙: $x$를 정하면 $y$가 하나로 정해져요. 함수예요.'], ['6 \\rightarrow 1,\\ 2,\\ 3,\\ 6', '"자연수 $x$의 약수 $y$": $y$가 여러 개예요. 함수가 아니에요.']] },
    '함수를 $y = f(x)$로 써요. $f(3)$은 $x$ 자리에 3을 넣은 값이고, 함숫값이라고 해요.',
    { tex: 'f(x) = 2x + 1 \\;\\Rightarrow\\; f(3) = 2 \\times 3 + 1 = 7' }
  ] },
  { title: '일차함수', body: [
    '$y = ax + b$ ($a \\neq 0$) 꼴로 쓸 수 있는 함수가 일차함수예요.',
    '택시 요금과 같아요. 기본요금($b$)에서 시작해 갈수록 일정하게($a$씩) 변해요.',
    { ex: [['y = 3x - 2', '일차함수'], ['y = -\\dfrac{1}{2}x', '일차함수($b = 0$이어도 돼요)'], ['y = 5', '일차함수가 아니에요($x$가 없어요)'], ['y = \\dfrac{4}{x}', '일차함수가 아니에요($x$가 분모에 있어요)'], ['y = x^{2} + 1', '일차함수가 아니에요($x^{2}$이 있어요)']] }
  ] },
  { title: '기울기', body: [
    '기울기는 $x$가 1 늘 때 $y$가 얼마나 변하는지예요. 계단에서 옆으로 1칸 갈 때 위로 가는 칸 수예요.',
    { tex: '(\\text{기울기}) = \\dfrac{(y\\text{의 값의 증가량})}{(x\\text{의 값의 증가량})} = a' },
    { figure: { type: 'plane', range: 5, line: [2, 1, -1], points: [{ x: 1, y: 1, label: 'A' }, { x: 2, y: 3, label: 'B' }] } },
    '그림의 직선 $y = 2x - 1$에서 A에서 B로 갈 때 옆으로 1칸, 위로 2칸 가요. 기울기는 2예요.',
    '기울기가 양수이면 오른쪽 위로 올라가고, 음수이면 오른쪽 아래로 내려가요.'
  ] },
  { title: '절편과 평행이동', body: [
    '$y$절편은 직선이 $y$축과 만나는 점의 $y$좌표예요. $x = 0$을 넣으면 나오고, $y = ax + b$에서는 $b$예요.',
    '$x$절편은 직선이 $x$축과 만나는 점의 $x$좌표예요. $y = 0$을 넣고 $x$를 구해요.',
    { tex: 'y = 2x - 4 \\;\\Rightarrow\\; (y\\text{절편}) = -4,\\quad 0 = 2x - 4 \\;\\Rightarrow\\; (x\\text{절편}) = 2' },
    '$y = ax + b$의 그래프는 $y = ax$의 그래프를 $y$축의 방향으로 $b$만큼 평행이동한 직선이에요. 기울기는 그대로이고 위아래로만 옮겨져요.',
    '기울기가 같고 $y$절편이 다른 두 직선은 평행해요.'
  ] },
  { title: '직선의 식 구하기', body: [
    '$y = ax + b$에서 $a$(기울기)와 $b$($y$절편)만 찾으면 돼요.',
    { list: ['기울기와 한 점을 알 때: $a$를 넣고, 점의 좌표를 넣어 $b$를 구해요.', '두 점을 알 때: 두 점으로 기울기를 먼저 구하고, 한 점을 넣어 $b$를 구해요.', '두 절편을 알 때: 절편을 점 $(x\\text{절편},\\ 0)$, $(0,\\ y\\text{절편})$으로 바꿔 생각해요.'] },
    { tex: '(1,\\ 3),\\ (3,\\ 7) \\;\\Rightarrow\\; a = \\dfrac{7 - 3}{3 - 1} = 2,\\quad 3 = 2 \\times 1 + b \\;\\Rightarrow\\; b = 1' },
    '그래서 구하는 식은 $y = 2x + 1$이에요.'
  ] },
  { title: '일차함수의 활용', body: [
    '일정하게 늘거나 줄어드는 양은 일차함수로 나타내요.',
    { tex: 'y = (\\text{한 번에 변하는 양}) \\times x + (\\text{처음 양})' },
    { ex: [['y = 3x + 20', '물 20 L가 든 물탱크에 1분에 3 L씩 넣을 때'], ['y = -2x + 150', '150 mm인 양초가 1분에 2 mm씩 짧아질 때']] },
    '식을 세운 다음 $x$ 또는 $y$ 자리에 알려 준 값을 넣어 나머지를 구해요.'
  ] }
]);
