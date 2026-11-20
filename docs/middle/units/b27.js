/* B27 경우의 수와 확률 기초 — 사건과 경우의 수, 확률의 뜻과 기본 성질
   유형(쉬운 것부터): B27.count 사건과 경우의 수 · B27.rule 「또는」과 「동시에」 · B27.arrange 줄 세우기와 뽑기 (키패드, 자연수)
                     · B27.prob 확률의 뜻 (키패드, 분수) · B27.sense 확률의 성질 (4지선다) · B27.property 일어나지 않을 확률 (키패드, 분수)
   경우의 수는 조건에 맞는 것을 실제로 하나씩 세어 구한다(정수 계산). 확률은 [분자, 분모] 정수 쌍으로 다루고 약분해서 답한다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, abs = Math.abs, isInt = Number.isInteger, gcd = MH.gcd;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!(q && ok(q)) && ++i < 200); return q; };

  /* ── 틀: 보기 고르기. build(q) → { text, tex, ans, wrong: [[보기, 실수 id, 설명] × 3], hints, steps, check } ── */
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B27', version: 1, title: o.title,
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
  /* ── 틀: 자연수 하나(키패드). build(q) → { text, ans, hints, steps, wrong: { 실수 id: 자연수 }, check }
     틀린 답이 둘은 있어야 하고, 답이 20 이상인데 문제 글에 없는 그 수가 힌트에 나오면 거른다 ── */
  var numQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var leak = function (p) { var a = String(p.ans); return p.ans > 19 && nums(p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    var okW = function (p, x) { return isInt(x) && x >= 1 && x !== p.ans; };
    var count = function (p) { var seen = []; o.mistakes.forEach(function (m) { var x = p.wrong[m[0]]; if (okW(p, x) && seen.indexOf(x) < 0) seen.push(x); }); return seen.length; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && p.ans >= 1 && p.check === true && !leak(p) && count(p) >= 2; }; });
    MH.defineType({
      id: o.id, unit: 'B27', version: 1, title: o.title,
      answer: { kind: 'int' },
      levels: o.levels,
      prompt: function (v) { return { text: P(v).text }; },
      solve: function (v) { return P(v).ans; },
      verify: function (v, ans) { var p = P(v); return p.check === true && ans === p.ans; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: p.ans }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), x = p.wrong[m[0]], i;
            if (!okW(p, x)) return null;
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) if (p.wrong[o.mistakes[i][0]] === x) return null;
            return x;
          },
          explain: function () { return m[1]; } };
      })
    });
  };
  /* ── 틀: 분수 하나(키패드). build(q) → { text, ans: [분자, 분모], wrong: { 실수 id: [분자, 분모] }, hints, steps, check }
     답은 약분해서 내고, 0 과 1 사이의 분수만 낸다. 틀린 답은 정수가 아닌 것만 쓰고 둘은 있어야 한다 ── */
  var red = function (n, d) { var g = gcd(n, d) || 1; return [n / g, d / g]; };
  var fracQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { var p; if (v.q !== lastQ) { p = o.build(v.q); if (p) p.ans = red(p.ans[0], p.ans[1]); lastP = p; lastQ = v.q; } return lastP; };
    var same = function (x, y) { return x[0] * y[1] === y[0] * x[1]; };
    var okW = function (p, r) { return !!r && isInt(r[0]) && isInt(r[1]) && r[0] > 0 && r[1] >= 2 && r[0] % r[1] !== 0 && !same(r, p.ans); };
    o.levels.forEach(function (lv) {
      lv.where = function (v) {
        var p = P(v), ws = [];
        if (!p || p.check !== true || !(p.ans[0] >= 1 && p.ans[0] < p.ans[1])) return false;
        o.mistakes.forEach(function (m) { var r = p.wrong[m[0]]; if (okW(p, r) && !ws.some(function (w) { return same(w, r); })) ws.push(r); });
        return ws.length >= 2;
      };
    });
    MH.defineType({
      id: o.id, unit: 'B27', version: 1, title: o.title,
      answer: { kind: 'fraction' },
      levels: o.levels,
      prompt: function (v) { return { text: P(v).text }; },
      solve: function (v) { var a = P(v).ans; return { n: a[0], d: a[1] }; },
      verify: function (v, ans) { var p = P(v); return p.check === true && ans.n * p.ans[1] === p.ans[0] * ans.d && gcd(ans.n, ans.d) === 1; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: { n: p.ans[0], d: p.ans[1] } }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), r = p.wrong[m[0]], i, e;
            if (!okW(p, r)) return null;
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) { e = p.wrong[o.mistakes[i][0]]; if (okW(p, e) && same(e, r)) return null; }
            r = red(r[0], r[1]); return { n: r[0], d: r[1] };
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  /* ── 공통 도구 ───────────────────────────────────────── */
  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  var fr = function (a) { var r = red(a[0], a[1]); return frac(r[0], r[1]); };
  var E = function (n) { return pj(n, '이에요/예요'); };
  var fact = function (n) { return n <= 1 ? 1 : n * fact(n - 1); };
  var falling = function (n, k) { var p = 1, i; for (i = 0; i < k; i++) p *= n - i; return p; };
  var comb = function (n, k) { return falling(n, k) / fact(k); };
  var range = function (n) { var a = [], i; for (i = 1; i <= n; i++) a.push(i); return a; };
  var pow = function (b, e) { var p = 1; while (e-- > 0) p *= b; return p; };
  var fallTex = function (n, k) { var a = [], i; for (i = 0; i < k; i++) a.push(n - i); return a.join(' \\times '); };
  var isPrime = function (x) { var i; if (x < 2) return false; for (i = 2; i * i <= x; i++) if (x % i === 0) return false; return true; };

  /* 조건 { t, k }: 1 ~ n 의 수 가운데 조건에 맞는 수 */
  var condOk = function (c, x) {
    switch (c.t) {
      case 'even': return x % 2 === 0; case 'odd': return x % 2 === 1; case 'mult': return x % c.k === 0; case 'div': return c.k % x === 0;
      case 'ge': return x >= c.k; case 'le': return x <= c.k; case 'gt': return x > c.k; case 'lt': return x < c.k; default: return isPrime(x);
    }
  };
  var condList = function (c, n) { return range(n).filter(function (x) { return condOk(c, x); }); };
  var isRange = function (c) { return ['ge', 'le', 'gt', 'lt'].indexOf(c.t) >= 0; };
  var noun = function (c) { return { even: '짝수', odd: '홀수', mult: c.k + '의 배수', div: c.k + '의 약수', ge: c.k + ' 이상의 수', le: c.k + ' 이하의 수', gt: c.k + '보다 큰 수', lt: c.k + '보다 작은 수', prime: '소수' }[c.t]; };
  var tip = function (c) {
    var k = c.k;
    return { even: '짝수는 2로 나누어떨어지는 수예요.', odd: '홀수는 2로 나누면 1이 남는 수예요.',
      mult: k + '의 배수는 $' + k + ' \\times 1$, $' + k + ' \\times 2$처럼 ' + k + '에 자연수를 곱한 수예요.',
      div: k + '의 약수는 ' + k + pj(k, '을/를') + ' 나누어떨어지게 하는 수예요. 1과 ' + k + ' 자신도 약수예요.',
      ge: '「' + k + ' 이상」에는 ' + k + ' 자신도 들어가요.', le: '「' + k + ' 이하」에는 ' + k + ' 자신도 들어가요.',
      gt: '「' + k + '보다 큰」에는 ' + k + ' 자신이 들어가지 않아요.', lt: '「' + k + '보다 작은」에는 ' + k + ' 자신이 들어가지 않아요.',
      prime: '소수는 약수가 1과 자기 자신뿐인 수예요. 1은 소수가 아니에요.' }[c.t];
  };
  /* 상황 { kind: 'dice' | 'card' | 'ball', n } */
  var intro = function (s) {
    return s.kind === 'dice' ? '한 개의 주사위를 던질 때, '
      : s.kind === 'card' ? '1부터 ' + s.n + '까지의 자연수가 하나씩 적힌 카드 ' + s.n + '장 중에서 한 장을 뽑을 때, '
        : '1부터 ' + s.n + '까지의 번호가 하나씩 적힌 공 ' + s.n + '개가 든 주머니에서 공 한 개를 꺼낼 때, ';
  };
  var dicePhrase = function (c) { var w = noun(c); return isRange(c) ? w.replace(/ 수$/, ' 눈') : w + '의 눈'; };
  /** '짝수의 눈이 나오' · '3의 배수가 적힌 카드가 나오' (뒤에 '는' · '지 않을' · 'ㄹ' 을 붙여 쓴다) */
  var whatStem = function (s, c) { return s.kind === 'dice' ? dicePhrase(c) + '이 나오' : noun(c) + '가 적힌 ' + (s.kind === 'card' ? '카드가' : '공이') + ' 나오'; };
  /** 보기에 쓰는 문장 */
  var sentence = function (s, c) { return (s.kind === 'dice' ? dicePhrase(c) + '이' : noun(c) + '가') + ' 나온다'; };
  var sitOf = function (r, lo, hi, diceP) { var k = r.int(0, 99) < diceP ? 'dice' : r.pick(['card', 'ball']); return { kind: k, n: k === 'dice' ? 6 : r.int(lo, hi) }; };
  var condOf = function (r, n, types, lo, hi) {
    return until(function () {
      var t = r.pick(types), k = 0;
      if (t === 'mult') k = r.int(3, Math.max(3, n >> 1)); else if (t === 'div') k = r.int(4, n); else if (t === 'ge') k = r.int(2, n - 1); else if (t === 'le') k = r.int(1, n - 1); else if (t === 'gt') k = r.int(1, n - 2); else if (t === 'lt') k = r.int(3, n);
      return { t: t, k: k };
    }, function (c) { var l = condList(c, n).length; return l >= (lo || 1) && l <= Math.min(hi || 10, n - 1) && !(c.t === 'div' && isPrime(c.k)); });
  };
  /* 주사위 두 개: 조건에 맞는 순서쌍 */
  var PAIR = { sum: function (i, j) { return i + j; }, diff: function (i, j) { return abs(i - j); }, prod: function (i, j) { return i * j; } };
  var pairs = function (m, k) { var out = [], i, j; for (i = 1; i <= 6; i++) for (j = 1; j <= 6; j++) if (m === 'same' ? i === j : PAIR[m](i, j) === k) out.push([i, j]); return out; };
  var unordered = function (ps) { return ps.filter(function (p) { return p[0] <= p[1]; }).length; };
  var pairTex = function (ps) { return ps.map(function (p) { return '(' + p[0] + ', ' + p[1] + ')'; }).join(',\\ '); };
  var pairWord = function (m, k) { return m === 'same' ? '두 눈의 수가 같' : '두 눈의 수의 ' + { sum: '합이', diff: '차가', prod: '곱이' }[m] + ' ' + k; };
  var FACE = function (f) { return f === '앞' ? '앞면' : '뒷면'; };
  var DICE2 = '서로 다른 두 개의 주사위를 동시에 던질 때, ';
  var D_KEY = '주사위 두 개를 던지면 결과를 (첫째 눈, 둘째 눈)의 순서쌍으로 적어요. 두 주사위는 서로 다른 물건이라서 (1, 3)과 (3, 1)은 다른 경우예요. 빨간 주사위와 파란 주사위를 던진다고 생각하면 쉬워요. 그래서 모든 경우는 $6 \\times 6$가지예요.';
  var dice2Hint = function (m, k) { return '두 주사위를 A, B라고 불러요. A의 눈을 1로 놓고 B의 눈이 얼마여야 ' + (m === 'same' ? '두 눈이 같은지' : { sum: '합이', diff: '차가', prod: '곱이' }[m] + ' ' + k + '인지') + ' 찾아요. 찾았으면 (A의 눈, B의 눈)으로 적어요. 그다음 A의 눈을 2, 3, 4, 5, 6으로 차례로 바꾸면서 똑같이 찾아요. B의 눈도 1부터 6까지뿐이라는 것을 잊지 않아요.'; };
  /* 동전 m 개: 앞면이 k 개인 경우를 '앞뒤뒤' 꼴로 */
  var coinList = function (m, k, face) {
    var out = [], x, i, s, c;
    for (x = 0; x < (1 << m); x++) { s = ''; c = 0; for (i = m - 1; i >= 0; i--) { if (x >> i & 1) { s += '뒤'; } else { s += '앞'; c++; } } if ((face === '앞' ? c : m - c) === k) out.push(s); }
    return out;
  };

  /* ── B27.count 사건과 경우의 수 ─────────────────────────── */
  var C_KEY = '사건은 실험이나 관찰에서 일어나는 결과를 말해요. 경우의 수는 그 사건이 일어나는 가짓수예요. 차림표에서 매운 음식이 몇 가지인지 세는 것과 같아요. 조건에 맞는 것을 하나씩 적고, 빠뜨리거나 두 번 센 것이 없는지 확인한 다음 개수를 세요.';
  var C_LAST = '수를 하나씩 짚으면서 조건에 맞으면 동그라미를 쳐요. 끝까지 다 본 다음 동그라미의 개수를 세요. 경우의 수는 수의 크기가 아니라 조건에 맞는 것의 개수예요.';
  var countBuild = function (q) {
    var s = q.sit, c = q.c, n, L, ans, wrong = {}, ps, cl;
    if (q.t === 'single') {
      n = s.n; L = condList(c, n); ans = L.length;
      wrong.boundary = c.t === 'ge' || c.t === 'le' ? ans - 1 : c.t === 'gt' || c.t === 'lt' ? ans + 1 : null;
      wrong['one-prime'] = c.t === 'prime' ? ans + 1 : null;
      wrong['mixed-up'] = c.t === 'mult' ? condList({ t: 'div', k: c.k }, n).length : c.t === 'div' ? condList({ t: 'mult', k: c.k }, n).length : null;
      wrong.complement = n - ans; wrong.total = n; wrong['named-one'] = L[0];
      return { text: intro(s) + whatStem(s, c) + '는 경우의 수를 구하세요.', ans: ans, wrong: wrong, check: L.every(function (x) { return condOk(c, x); }),
        hints: [C_KEY, '① 나올 수 있는 수는 1부터 ' + n + '까지 모두 ' + n + '가지예요. ② 이 가운데 ' + noun(c) + '만 골라 작은 수부터 차례로 적어요. ' + tip(c) + ' ③ 적은 수가 모두 몇 개인지 세요.', C_LAST],
        steps: [{ say: '1부터 ' + n + '까지의 수 가운데 ' + noun(c) + '를 빠짐없이 적어요.', tex: L.join(',\\ ') }, { say: '적은 수의 개수가 경우의 수예요.', tex: String(ans) }] };
    }
    if (q.t === 'dice2') {
      ps = pairs(q.m, q.k); ans = ps.length;
      wrong.unordered = unordered(ps); wrong['over-six'] = q.m === 'sum' && q.k > 7 ? q.k - 1 : null; wrong.total = 36;
      return { text: DICE2 + '나오는 ' + pairWord(q.m, q.k) + '인 경우의 수를 구하세요.', ans: ans, wrong: wrong, check: ps.length >= 1,
        hints: [D_KEY, dice2Hint(q.m, q.k), '(1, 2)와 (2, 1)처럼 순서만 바뀐 것도 따로 세요. A의 눈을 1부터 6까지 차례로 바꾸면서 순서쌍을 모두 적은 다음, 적은 순서쌍의 개수를 세요.'],
        steps: [{ say: '조건에 맞는 (첫째 눈, 둘째 눈)을 빠짐없이 적어요.', tex: pairTex(ps) }, { say: '순서쌍의 개수가 경우의 수예요.', tex: String(ans) }] };
    }
    cl = coinList(q.m, q.k, q.face); ans = cl.length;
    wrong.unordered = 1; wrong.total = pow(2, q.m); wrong['named-one'] = q.k;
    return { text: '서로 다른 동전 ' + q.m + '개를 동시에 던질 때, ' + FACE(q.face) + '이 ' + q.k + '개 나오는 경우의 수를 구하세요.', ans: ans, wrong: wrong, check: true,
      hints: ['동전 여러 개를 던지면 동전마다 앞면인지 뒷면인지를 차례로 적어요. 동전은 서로 다른 물건이라서 (앞, 뒤)와 (뒤, 앞)은 다른 경우예요. 100원짜리와 500원짜리를 던진다고 생각하면 쉬워요.',
        '동전에 첫째, 둘째' + (q.m > 2 ? ', 셋째' : '') + (q.m > 3 ? ', 넷째' : '') + '라고 이름을 붙여요. ' + FACE(q.face) + '이 나올 동전 ' + q.k + '개를 어느 것으로 정할지 하나씩 바꿔 가며 적어요. 예를 들어 첫째 동전부터 차례로 「' + cl[0] + '」처럼 적어요.',
        '「' + cl[0] + '」에서 ' + FACE(q.face) + '의 자리를 옮겨 가며 다른 경우를 모두 적어요. 같은 것을 두 번 적지 않았는지, 빠뜨린 자리가 없는지 확인한 다음 개수를 세요.'],
      steps: [{ say: '앞면을 「앞」, 뒷면을 「뒤」로 적으면 모든 경우는 ' + pow(2, q.m) + '가지예요.', tex: new Array(q.m + 1).join('2').split('').join(' \\times ') + ' = ' + pow(2, q.m) }, { say: FACE(q.face) + '이 ' + q.k + '개인 경우는 ' + josa(cl.join(', '), '이에요/예요') + '. 개수를 세요.', tex: String(ans) }] };
  };
  var PROD_K = [4, 6, 8, 10, 12, 15, 18, 20, 24, 30];
  var dice2Q = function (r, withSame) {
    var m = r.pick(['sum', 'sum', 'diff', 'prod'].concat(withSame ? ['same'] : []));
    return { t: 'dice2', m: m, k: m === 'sum' ? r.int(3, 11) : m === 'diff' ? r.int(1, 5) : m === 'prod' ? r.pick(PROD_K) : 0 };
  };
  var coinQ = function (r) { var m = r.int(2, 4); return { t: 'coin', m: m, k: r.int(1, m - 1), face: r.pick(['앞', '뒤']) }; };
  numQ({
    id: 'B27.count', title: '사건과 경우의 수', build: countBuild,
    mistakes: [['boundary', '경계가 되는 수를 잘못 다뤘어요. 「이상」과 「이하」는 그 수를 포함하고, 「보다 큰」과 「보다 작은」은 그 수를 포함하지 않아요.'],
      ['one-prime', '1을 소수로 세었어요. 소수는 약수가 2개뿐인 수예요. 1은 약수가 1 하나뿐이라서 소수가 아니에요.'],
      ['mixed-up', '약수와 배수를 바꿔 세었어요. 약수는 그 수를 나누어떨어지게 하는 수이고, 배수는 그 수에 자연수를 곱한 수예요.'],
      ['unordered', '순서만 바뀐 경우를 하나로 세었어요. 두 주사위나 동전은 서로 다른 물건이라서 (1, 2)와 (2, 1)은 다른 경우예요.'],
      ['over-six', '주사위에 없는 눈까지 세었어요. 주사위의 눈은 1부터 6까지뿐이에요. 7 이상의 눈이 들어간 짝은 빼요.'],
      ['complement', '조건에 맞지 않는 쪽을 세었어요. 문제가 묻는 조건을 다시 읽고, 그 조건에 맞는 것만 골라 세요.'],
      ['total', '일어날 수 있는 모든 경우를 세었어요. 그 가운데 조건에 맞는 것만 골라 세야 해요.'],
      ['named-one', '문제에 나온 수나 조건에 맞는 수 하나를 답했어요. 경우의 수는 조건에 맞는 것이 모두 몇 가지인지예요.']],
    levels: [
      { name: '주사위와 카드', minDistinct: 80, vars: { q: sampler(function (r) { var s = sitOf(r, 8, 12, 25); return { t: 'single', sit: s, c: condOf(r, s.n, ['even', 'odd', 'mult', 'ge', 'le']) }; }) } },
      { name: '약수 · 소수 · 보다 큰 수', minDistinct: 150, vars: { q: sampler(function (r) { var s = sitOf(r, 10, 20, 12); return { t: 'single', sit: s, c: condOf(r, s.n, ['div', 'prime', 'gt', 'lt', 'mult']) }; }) } },
      { name: '주사위 두 개 · 동전 여러 개', minDistinct: 25, vars: { q: sampler(function (r) { return r.int(0, 3) ? dice2Q(r, false) : coinQ(r); }) } }
    ]
  });

  /* ── B27.rule 「또는」과 「동시에」 ───────────────────────── */
  var OR_CTX = [
    { x: '버스', y: '지하철', text: function (a, b) { return '집에서 도서관까지 가는 버스 노선이 ' + a + '가지, 지하철 노선이 ' + b + '가지 있어요. 버스나 지하철 가운데 하나를 타고 도서관까지 가는 경우의 수를 구하세요.'; } },
    { x: '김밥', y: '라면', text: function (a, b) { return '분식집 차림표에 김밥이 ' + a + '종류, 라면이 ' + b + '종류 있어요. 이 가운데 한 가지만 골라 주문하는 경우의 수를 구하세요.'; } },
    { x: '소설책', y: '시집', text: function (a, b) { return '책꽂이에 서로 다른 소설책 ' + a + '권과 서로 다른 시집 ' + b + '권이 있어요. 이 가운데 한 권만 골라 읽는 경우의 수를 구하세요.'; } },
    { x: '빵', y: '과자', text: function (a, b) { return '서로 다른 빵 ' + a + '개와 서로 다른 과자 ' + b + '개가 있어요. 이 가운데 한 개만 골라 먹는 경우의 수를 구하세요.'; } }];
  var AND_CTX = [
    { x: '티셔츠', y: '바지', text: function (a, b) { return '티셔츠 ' + a + '벌과 바지 ' + b + '벌이 있어요. 티셔츠와 바지를 하나씩 골라 입는 경우의 수를 구하세요.'; } },
    { x: 'A 마을에서 B 마을로 가는 길', y: 'B 마을에서 C 마을로 가는 길', text: function (a, b) { return 'A 마을에서 B 마을로 가는 길이 ' + a + '가지, B 마을에서 C 마을로 가는 길이 ' + b + '가지 있어요. A 마을에서 B 마을을 거쳐 C 마을까지 가는 경우의 수를 구하세요.'; } },
    { x: '김밥', y: '음료', text: function (a, b) { return '분식집 차림표에 김밥이 ' + a + '종류, 음료가 ' + b + '종류 있어요. 김밥과 음료를 하나씩 골라 주문하는 경우의 수를 구하세요.'; } },
    { x: '자음 카드', y: '모음 카드', text: function (a, b) { return '서로 다른 자음 카드 ' + a + '장과 서로 다른 모음 카드 ' + b + '장이 있어요. 자음 카드와 모음 카드를 한 장씩 뽑아 글자를 만드는 경우의 수를 구하세요.'; } }];
  var OR_KEY = '두 가지가 한꺼번에 일어날 수 없을 때, 둘 중 하나가 일어나는 경우의 수는 더해요. 식당에 밥 종류가 3가지, 면 종류가 2가지 있는데 딱 하나만 먹는다면, 고를 수 있는 음식을 한 줄로 늘어놓고 세면 돼요. 밥 3가지 뒤에 면 2가지를 이어 붙인 것이에요.';
  var OR_LAST = '「또는」, 「~이나」, 「하나만」이라는 말이 보이면 더하기를 떠올려요. 곱하면 둘을 함께 고르는 경우의 수가 돼요. 앞의 가짓수 뒤에 뒤의 가짓수를 이어서 번호를 매기면 마지막 번호가 답이에요.';
  var AND_KEY = '한 가지를 고르고 이어서 또 한 가지를 고를 때는 경우의 수를 곱해요. 윗옷 2벌과 바지 3벌이 있으면, 윗옷 하나마다 바지를 3가지로 짝지을 수 있어요. 윗옷이 2벌이니 3가지씩 2묶음이에요. 나뭇가지처럼 갈라지는 그림(수형도)을 그려 보면 잘 보여요.';
  var AND_LAST = '「동시에」, 「그리고」, 「하나씩」, 「거쳐서」라는 말이 보이면 곱하기를 떠올려요. 더하면 둘 중 하나만 고르는 경우의 수가 돼요. 둘을 모두 골라야 하니 두 가짓수를 곱해요.';
  var ruleBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, C, ans, wrong = {}, ca, cb, pa, pb, faces, tx, m;
    if (q.t === 'or') {
      C = OR_CTX[q.ctx]; wrong.multiplied = a * b; wrong['one-side'] = b;
      return { text: C.text(a, b), ans: a + b, wrong: wrong, check: true,
        hints: [OR_KEY, '① ' + josa(C.x, '을/를') + ' 고르는 경우는 ' + a + '가지예요. ② ' + josa(C.y, '을/를') + ' 고르는 경우는 ' + b + '가지예요. ③ 둘을 한꺼번에 고르지는 않아요. 하나만 고르니, ' + a + '가지 뒤에 ' + b + '가지를 이어 붙여 한 줄로 세요.', OR_LAST],
        steps: [{ say: josa(C.x, '과/와') + ' ' + josa(C.y, '을/를') + ' 함께 고르지 않고 하나만 골라요. 두 경우의 수를 더해요.', tex: a + ' + ' + b }, { say: '계산해요.', tex: a + ' + ' + b + ' = ' + (a + b) }] };
    }
    if (q.t === 'or-card') {
      ca = Math.floor(q.n / a); cb = Math.floor(q.n / b); wrong.multiplied = ca * cb; wrong['one-side'] = cb;
      return { text: intro(q.sit) + a + '의 배수 또는 ' + b + '의 배수가 적힌 ' + (q.sit.kind === 'card' ? '카드가' : '공이') + ' 나오는 경우의 수를 구하세요.', ans: ca + cb, wrong: wrong, check: a * b / gcd(a, b) > q.n && ca >= 1 && cb >= 1,
        hints: [OR_KEY, '① 1부터 ' + q.n + '까지의 수 가운데 ' + a + '의 배수를 모두 적고 개수를 세요. ② 같은 방법으로 ' + b + '의 배수를 모두 적고 개수를 세요. ③ 두 쪽에 모두 들어 있는 수가 있는지 확인해요. 없으면 한 번에 둘 다 일어날 수 없으니 두 개수를 이어 붙여 세요.', OR_LAST],
        steps: [{ say: a + '의 배수는 ' + ca + '개예요.', tex: range(ca).map(function (i) { return i * a; }).join(',\\ ') }, { say: b + '의 배수는 ' + cb + '개예요.', tex: range(cb).map(function (i) { return i * b; }).join(',\\ ') }, { say: '겹치는 수가 없으니 두 경우의 수를 더해요.', tex: ca + ' + ' + cb + ' = ' + (ca + cb) }] };
    }
    if (q.t === 'or-dice') {
      pa = pairs('sum', a); pb = pairs('sum', b); wrong.multiplied = pa.length * pb.length; wrong.unordered = unordered(pa) + unordered(pb); wrong['one-side'] = pb.length;
      return { text: DICE2 + '나오는 두 눈의 수의 합이 ' + a + '이거나 ' + b + '인 경우의 수를 구하세요.', ans: pa.length + pb.length, wrong: wrong, check: a !== b,
        hints: [D_KEY, '① 합이 ' + a + '인 경우를 (첫째 눈, 둘째 눈)으로 모두 적어요. 첫째 눈을 1부터 6까지 차례로 바꿔 가며 찾아요. ② 같은 방법으로 합이 ' + b + '인 경우를 모두 적어요. ③ 합이 ' + a + '이면서 ' + b + '일 수는 없어요. 그러니 두 쪽의 개수를 이어 붙여 세요.', OR_LAST],
        steps: [{ say: '합이 ' + a + '인 경우는 ' + pa.length + '가지예요.', tex: pairTex(pa) }, { say: '합이 ' + b + '인 경우는 ' + pb.length + '가지예요.', tex: pairTex(pb) }, { say: '두 사건은 동시에 일어나지 않으니 더해요.', tex: pa.length + ' + ' + pb.length + ' = ' + (pa.length + pb.length) }] };
    }
    if (q.t === 'and') {
      C = AND_CTX[q.ctx]; wrong.added = a + b; wrong['one-side'] = b;
      return { text: C.text(a, b), ans: a * b, wrong: wrong, check: true,
        hints: [AND_KEY, '① ' + josa(C.x, '을/를') + ' 하나 정해요. 거기에 ' + josa(C.y, '을/를') + ' ' + b + '가지로 짝지을 수 있어요. ② ' + josa(C.x, '은/는') + ' 모두 ' + a + '가지예요. ③ 그러니 ' + b + '가지씩 ' + a + '묶음이 생겨요. 똑같은 묶음이 여러 개일 때 쓰는 계산을 해요.', AND_LAST],
        steps: [{ say: josa(C.x, '을/를') + ' 고르는 ' + a + '가지마다 ' + josa(C.y, '을/를') + ' 고르는 ' + b + '가지가 있어요. 두 경우의 수를 곱해요.', tex: a + ' \\times ' + b }, { say: '계산해요.', tex: a + ' \\times ' + b + ' = ' + a * b }] };
    }
    if (q.t === 'toss') {
      /* 동전 q.m 개(0 이면 없음)와 주사위 q.d 개 */
      faces = []; for (m = 0; m < q.m; m++) faces.push(2); for (m = 0; m < q.d; m++) faces.push(6);
      ans = faces.reduce(function (x, y) { return x * y; }, 1); wrong.added = faces.reduce(function (x, y) { return x + y; }, 0); wrong['one-side'] = faces[faces.length - 1];
      tx = (q.m === 1 ? '동전 한 개' : q.m ? '서로 다른 동전 ' + q.m + '개' : '') + (q.m && q.d ? '와 ' : '') + (q.d === 1 ? '주사위 한 개' : q.d ? '서로 다른 주사위 두 개' : '');
      return { text: tx + '를 동시에 던질 때, 일어나는 모든 경우의 수를 구하세요.', ans: ans, wrong: wrong, check: faces.length >= 2,
        hints: [AND_KEY, '① 동전 한 개는 앞면과 뒷면 2가지, 주사위 한 개는 1부터 6까지 6가지가 나와요. ② 던지는 물건마다 나올 수 있는 가짓수를 차례로 적어요. 이 문제에서는 ' + faces.join(', ') + E(faces[faces.length - 1]) + '. ③ 물건마다 결과가 하나씩 함께 나오니, 적은 수를 모두 곱해요.', AND_LAST],
        steps: [{ say: '던지는 물건마다 나올 수 있는 가짓수를 적어요.', tex: faces.join(',\\ ') }, { say: '결과가 동시에 하나씩 나오니 모두 곱해요.', tex: faces.join(' \\times ') + ' = ' + ans }] };
    }
    if (q.t === 'path') {
      wrong['all-added'] = a + b + c; wrong['all-multiplied'] = a * b * c; wrong['forgot-direct'] = a * b;
      return { text: 'A 마을에서 B 마을로 가는 길이 ' + a + '가지, B 마을에서 C 마을로 가는 길이 ' + b + '가지 있고, A 마을에서 C 마을로 바로 가는 길이 ' + c + '가지 있어요. A 마을에서 C 마을까지 가는 경우의 수를 구하세요. (한 번 지난 마을은 다시 지나지 않아요.)', ans: a * b + c, wrong: wrong, check: true,
        hints: ['가는 방법이 두 갈래예요. B 마을을 거쳐 가는 방법과 바로 가는 방법이에요. 한 번 갈 때 두 갈래를 함께 탈 수는 없으니, 갈래마다 경우의 수를 구한 다음 더해요. 갈래 안에서 길을 이어서 고를 때는 곱해요.',
          '① B 마을을 거쳐 가는 갈래: A에서 B로 가는 길 ' + a + '가지마다 B에서 C로 가는 길이 ' + b + '가지씩 있어요. 이어서 고르니 곱해요. ② 바로 가는 갈래: ' + c + '가지예요. ③ 두 갈래 가운데 하나만 고르니, ①과 ②의 값을 더해요.',
          '식으로 쓰면 (A에서 B) × (B에서 C) + (바로 가는 길)이에요. 곱셈을 먼저 하고 덧셈을 나중에 해요. 세 수를 모두 더하거나 모두 곱하지 않도록 조심해요.'],
        steps: [{ say: 'B 마을을 거쳐 가는 경우의 수는 곱해서 구해요.', tex: a + ' \\times ' + b + ' = ' + a * b }, { say: '바로 가는 길 ' + c + '가지를 더해요.', tex: a * b + ' + ' + c + ' = ' + (a * b + c) }] };
    }
    if (q.t === 'three') {
      C = [['모자', '티셔츠', '바지', '모자 ' + a + '개, 티셔츠 ' + b + '벌, 바지 ' + c + '벌이 있어요. 모자, 티셔츠, 바지를 하나씩 골라 입는 경우의 수를 구하세요.'],
        ['김밥', '라면', '음료', '분식집 차림표에 김밥이 ' + a + '종류, 라면이 ' + b + '종류, 음료가 ' + c + '종류 있어요. 김밥, 라면, 음료를 하나씩 골라 주문하는 경우의 수를 구하세요.']][q.ctx];
      wrong['all-added'] = a + b + c; wrong['two-only'] = a * b;
      return { text: C[3], ans: a * b * c, wrong: wrong, check: true,
        hints: [AND_KEY, '① ' + josa(C[0], '과/와') + ' ' + josa(C[1], '을/를') + ' 하나씩 고르는 경우부터 생각해요. ' + C[0] + ' ' + a + '가지마다 ' + C[1] + ' ' + b + '가지를 짝지어요. ② 그렇게 만든 짝 하나마다 ' + josa(C[2], '을/를') + ' ' + c + '가지로 또 짝지을 수 있어요. ③ 세 가지를 이어서 모두 고르니, 세 가짓수를 차례로 곱해요.', '고르는 것이 세 가지로 늘어도 방법은 같아요. 하나씩 모두 고를 때는 곱해요. 두 수만 곱하고 멈추지 않았는지, 더하지 않았는지 확인해요.'],
        steps: [{ say: '세 가지를 하나씩 모두 고르니 세 경우의 수를 곱해요.', tex: a + ' \\times ' + b + ' \\times ' + c }, { say: '앞에서부터 차례로 계산해요.', tex: a * b + ' \\times ' + c + ' = ' + a * b * c }] };
    }
    if (q.t === 'round') {
      wrong['same-allowed'] = a * a; wrong.added = a + a - 1;
      return { text: '산꼭대기까지 올라가는 등산로가 ' + a + '가지 있어요. 올라갈 때와 다른 길로 내려오려고 해요. 올라갔다가 내려오는 경우의 수를 구하세요.', ans: a * (a - 1), wrong: wrong, check: true,
        hints: [AND_KEY, '① 올라가는 길을 고르는 경우는 ' + a + '가지예요. ② 내려올 때는 올라간 길을 빼고 골라요. 그래서 한 가지가 줄어요. ③ 올라가는 일과 내려오는 일이 이어서 일어나니 두 가짓수를 곱해요.', '내려오는 길의 가짓수를 ' + a + '가지 그대로 두지 않았는지 확인해요. 올라갈 때 쓴 길 하나는 쓸 수 없어요. (올라가는 가짓수) × (내려오는 가짓수)로 계산해요.'],
        steps: [{ say: '올라가는 길은 ' + a + '가지, 내려오는 길은 올라간 길을 뺀 ' + (a - 1) + '가지예요.', tex: a + ' \\times ' + (a - 1) }, { say: '계산해요.', tex: a + ' \\times ' + (a - 1) + ' = ' + a * (a - 1) }] };
    }
    wrong['all-added'] = a + b + c; wrong['all-multiplied'] = a * b * c; wrong['half-multiplied'] = a + b * c;
    return { text: '분식집 차림표에 김밥이 ' + a + '종류, 라면이 ' + b + '종류, 음료가 ' + c + '종류 있어요. 김밥과 라면 가운데 한 가지를 고르고, 음료도 한 가지 골라 주문하는 경우의 수를 구하세요.', ans: (a + b) * c, wrong: wrong, check: true,
      hints: ['더하기와 곱하기가 함께 나오는 문제예요. 둘 중 하나만 고르는 곳에서는 더하고, 이어서 또 고르는 곳에서는 곱해요. 먼저 음식을 고르는 경우의 수를 구하고, 그다음 음료를 짝지어요.',
        '① 음식은 김밥 ' + a + '종류와 라면 ' + b + '종류 가운데 하나만 골라요. 하나만 고르니 두 수를 더해요. ② 음료는 ' + c + '종류 가운데 하나를 골라요. ③ 음식 하나마다 음료 ' + c + '가지를 짝지으니, ①에서 구한 값에 ' + c + pj(c, '을/를') + ' 곱해요.',
        '식으로 쓰면 (김밥 + 라면) × (음료)예요. 괄호 안의 덧셈을 먼저 해요. 라면과 음료만 곱하고 김밥을 따로 더하면 김밥을 고를 때 음료를 고르지 않은 것이 돼요.'],
      steps: [{ say: '음식을 고르는 경우의 수는 더해서 구해요.', tex: a + ' + ' + b + ' = ' + (a + b) }, { say: '음식 하나마다 음료 ' + c + '가지를 짝지으니 곱해요.', tex: (a + b) + ' \\times ' + c + ' = ' + (a + b) * c }] };
  };
  var two = function (r, lo, hi) { var a = r.int(lo, hi), b; do { b = r.int(lo, hi); } while (b === a); return [a, b]; };
  var TOSS = [[1, 1], [3, 0], [4, 0], [0, 2], [2, 1], [3, 1]];
  numQ({
    id: 'B27.rule', title: '「또는」과 「동시에」', build: ruleBuild,
    mistakes: [['multiplied', '두 경우의 수를 곱했어요. 둘 중 하나만 일어날 때는 더해요. 곱하는 것은 둘을 이어서 모두 고를 때예요.'],
      ['added', '경우의 수를 더했어요. 이어서 모두 고를 때는 곱해요. 앞의 것 하나마다 뒤의 것을 짝지을 수 있기 때문이에요.'],
      ['unordered', '순서만 바뀐 경우를 하나로 세었어요. 두 주사위는 서로 다른 물건이라서 (1, 2)와 (2, 1)은 다른 경우예요.'],
      ['all-added', '세 수를 모두 더했어요. 이어서 함께 고르는 것끼리는 곱해야 해요. 어디가 「하나만」이고 어디가 「이어서」인지 나눠 봐요.'],
      ['all-multiplied', '세 수를 모두 곱했어요. 둘 중 하나만 고르는 것끼리는 더해야 해요. 어디가 「하나만」이고 어디가 「이어서」인지 나눠 봐요.'],
      ['forgot-direct', '바로 가는 길을 빼먹었어요. 거쳐 가는 경우의 수를 구한 다음, 바로 가는 길의 가짓수를 더해요.'],
      ['two-only', '두 가지만 곱하고 멈췄어요. 고르는 것이 세 가지이니 세 번째 가짓수까지 곱해요.'],
      ['same-allowed', '올라간 길로 다시 내려오는 경우까지 세었어요. 다른 길로 내려오니 내려오는 길은 한 가지가 적어요.'],
      ['half-multiplied', '한쪽 음식에만 음료를 짝지었어요. 김밥을 고르든 라면을 고르든 음료를 골라요. 음식의 가짓수를 먼저 더한 다음 곱해요.'],
      ['one-side', '한쪽의 가짓수만 답했어요. 문제에 나온 것을 모두 따져야 해요. 하나만 고르면 더하고, 이어서 고르면 곱해요.']],
    levels: [
      { name: '또는 (더하기)', minDistinct: 150, vars: { q: sampler(function (r) {
        var k = r.int(0, 9), p, s, n;
        if (k < 7) { p = two(r, 2, 9); return { t: 'or', ctx: r.int(0, 3), a: p[0], b: p[1] }; }
        if (k < 9) { s = sitOf(r, 10, 20, 0); n = s.n; return until(function () { var x = two(r, 3, 9); return { t: 'or-card', sit: s, n: n, a: Math.min(x[0], x[1]), b: Math.max(x[0], x[1]) }; }, function (o) { return o.a * o.b / gcd(o.a, o.b) > n && o.b <= n; }); }
        p = two(r, 2, 12); return { t: 'or-dice', a: Math.min(p[0], p[1]), b: Math.max(p[0], p[1]) };
      }) } },
      { name: '동시에 (곱하기)', minDistinct: 150, vars: { q: sampler(function (r) {
        var p, t;
        if (r.int(0, 5)) { p = two(r, 2, 9); return { t: 'and', ctx: r.int(0, 3), a: p[0], b: p[1] }; }
        t = r.pick(TOSS); return { t: 'toss', m: t[0], d: t[1] };
      }) } },
      { name: '더하기와 곱하기 함께', minDistinct: 150, vars: { q: sampler(function (r) {
        var k = r.int(0, 9);
        if (k < 3) return { t: 'path', a: r.int(2, 5), b: r.int(2, 5), c: r.int(1, 4) };
        if (k < 6) return { t: 'three', ctx: r.int(0, 1), a: r.int(2, 5), b: r.int(2, 5), c: r.int(2, 5) };
        if (k < 7) return { t: 'round', a: r.int(3, 9) };
        return { t: 'mix', a: r.int(2, 6), b: r.int(2, 6), c: r.int(2, 5) };
      }) } }
    ]
  });

  /* ── B27.arrange 줄 세우기와 뽑기 ───────────────────────── */
  var ALL_CTX = [function (n) { return n + '명의 학생을 한 줄로 세우는 경우의 수를 구하세요.'; }, function (n) { return '서로 다른 책 ' + n + '권을 책꽂이에 한 줄로 꽂는 경우의 수를 구하세요.'; },
    function (n) { return n + '명이 이어달리기를 할 때, 달리는 차례를 정하는 경우의 수를 구하세요.'; }, function (n) { return '서로 다른 그림 ' + n + '점을 벽에 한 줄로 거는 경우의 수를 구하세요.'; }];
  var PICK_CTX = [function (n, k) { return n + '명의 학생 중에서 ' + k + '명을 뽑아 한 줄로 세우는 경우의 수를 구하세요.'; }, function (n, k) { return '서로 다른 책 ' + n + '권 중에서 ' + k + '권을 골라 책꽂이에 한 줄로 꽂는 경우의 수를 구하세요.'; },
    function (n, k) { return n + '명의 선수 중에서 ' + k + '명을 뽑아 달리는 차례를 정하는 경우의 수를 구하세요.'; }];
  var A_KEY = '한 줄로 세울 때는 자리를 하나씩 채운다고 생각해요. 의자가 나란히 놓여 있다면, 첫째 의자에는 누구나 앉을 수 있어요. 둘째 의자에는 이미 앉은 사람을 뺀 나머지 가운데 한 명이 앉아요. 앞자리를 채울 때마다 뒷자리에 올 수 있는 사람이 한 명씩 줄어요.';
  var N_KEY = '카드로 수를 만들 때도 자리를 하나씩 채워요. 앞자리에 놓은 카드는 뒷자리에 다시 쓸 수 없어요. 그래서 뒤로 갈수록 고를 수 있는 카드가 한 장씩 줄어요. 하나 더 조심할 것이 있어요. 0은 맨 앞자리에 올 수 없어요. 03은 두 자리 수가 아니에요.';
  var R_KEY = '뽑는 문제는 먼저 뽑힌 사람의 자리가 서로 다른지 같은지를 봐요. 회장과 부회장처럼 자리가 다르면, A가 회장이고 B가 부회장인 것과 그 반대는 다른 경우예요. 대표 2명처럼 자리가 같으면 A, B를 뽑은 것과 B, A를 뽑은 것은 같은 경우예요.';
  var PLACE = ['', '', '십의 자리', '백의 자리'];
  var addAll = function (n, k) { var s = 0, i; for (i = 0; i < k; i++) s += n - i; return s; };
  var arrBuild = function (q) {
    var n = q.n, k = q.k, ans, wrong = {}, zero, ds, text, R, same, h2;
    if (q.t === 'all' || q.t === 'pick') {
      if (q.t === 'all') k = n;
      ans = falling(n, k); wrong.added = addAll(n, k); wrong.power = pow(n, k) <= 9999 ? pow(n, k) : null; wrong['n-times-k'] = n * k; wrong['not-ordered'] = q.t === 'pick' ? comb(n, k) : null;
      return { text: q.t === 'all' ? ALL_CTX[q.ctx](n) : PICK_CTX[q.ctx](n, k), ans: ans, wrong: wrong, check: true,
        hints: [A_KEY, '① 첫째 자리에 올 수 있는 것은 ' + n + '가지예요. ② 하나를 놓았으니 둘째 자리에는 ' + (n - 1) + '가지가 남아요. ③ 이렇게 한 자리를 채울 때마다 1씩 줄어요. ' + (q.t === 'all' ? '마지막 자리에는 1가지만 남아요.' : '자리는 모두 ' + k + '개이니 수를 ' + k + '개만 적어요.') + ' ④ 자리를 이어서 채우니 적은 수를 모두 곱해요.',
          '곱할 수를 큰 것부터 차례로 적어요. ' + n + '에서 시작해 1씩 줄여 가며 ' + k + '개를 적고 모두 곱해요. 더하면 안 되고, 같은 수를 여러 번 곱해도 안 돼요.'],
        steps: [{ say: '자리마다 올 수 있는 가짓수를 앞에서부터 적어요. 한 자리를 채울 때마다 1씩 줄어요.', tex: range(k).map(function (i) { return n - i + 1; }).join(',\\ ') }, { say: '자리를 이어서 채우니 모두 곱해요.', tex: fallTex(n, k) + ' = ' + ans }] };
    }
    if (q.t === 'num') {
      ds = q.ds; n = ds.length; zero = ds[0] === 0; ans = zero ? (n - 1) * falling(n - 1, k - 1) : falling(n, k);
      wrong['zero-first'] = zero ? falling(n, k) : null; wrong.power = zero ? (n - 1) * pow(n, k - 1) : pow(n, k); wrong.added = addAll(n, k); wrong['not-ordered'] = comb(n, k);
      text = '$' + ds.join(',\\ ') + '$의 숫자가 하나씩 적힌 카드 ' + n + '장 중에서 ' + k + '장을 뽑아 만들 수 있는 ' + (k === 2 ? '두' : '세') + ' 자리 자연수의 개수를 구하세요.';
      h2 = zero ? '① 맨 앞자리인 ' + PLACE[k] + '에는 0을 뺀 ' + (n - 1) + '장만 올 수 있어요. ② 다음 자리에는 앞에서 쓴 카드 한 장을 빼요. 이번에는 0도 쓸 수 있으니 ' + (n - 1) + '장이 올 수 있어요.' + (k === 3 ? ' ③ 마지막 자리에는 앞에서 쓴 두 장을 뺀 ' + (n - 2) + '장이 올 수 있어요.' : '') + ' ' + (k === 3 ? '④' : '③') + ' 자리마다 올 수 있는 장수를 모두 곱해요.'
        : '① 맨 앞자리인 ' + PLACE[k] + '에는 ' + n + '장이 모두 올 수 있어요. ② 다음 자리에는 앞에서 쓴 카드를 뺀 ' + (n - 1) + '장이 올 수 있어요.' + (k === 3 ? ' ③ 마지막 자리에는 앞에서 쓴 두 장을 뺀 ' + (n - 2) + '장이 올 수 있어요.' : '') + ' ' + (k === 3 ? '④' : '③') + ' 자리마다 올 수 있는 장수를 모두 곱해요.';
      return { text: text, ans: ans, wrong: wrong, check: true,
        hints: [N_KEY, h2, '빈칸 ' + k + '개를 나란히 그리고, 칸마다 올 수 있는 카드의 장수를 적어요. ' + (zero ? '맨 앞 칸에는 0이 올 수 없다는 것을 먼저 따져요. ' : '') + '같은 카드를 두 번 쓰지 않으니 칸마다 장수가 달라져요. 적은 수를 곱하면 돼요.'],
        steps: [{ say: '자리마다 올 수 있는 카드의 장수를 앞에서부터 적어요.' + (zero ? ' 맨 앞에는 0이 올 수 없어요.' : ''), tex: (zero ? [n - 1].concat(range(k - 1).map(function (i) { return n - i; })) : range(k).map(function (i) { return n - i + 1; })).join(',\\ ') },
          { say: '자리를 이어서 채우니 모두 곱해요.', tex: (zero ? (n - 1) + (k > 1 ? ' \\times ' + fallTex(n - 1, k - 1) : '') : fallTex(n, k)) + ' = ' + ans }] };
    }
    /* 대표 뽑기: q.kind */
    R = { roles2: [2, false, n + '명의 후보 중에서 회장 1명과 부회장 1명을 뽑는 경우의 수를 구하세요.', ['회장', '부회장', '맡을']], same2: [2, true, n + '명의 후보 중에서 대표 2명을 뽑는 경우의 수를 구하세요.'],
      prize: [2, false, n + '명의 참가자 중에서 금상 1명과 은상 1명을 뽑는 경우의 수를 구하세요.', ['금상', '은상', '받을']], duty: [2, true, n + '명의 학생 중에서 청소 당번 2명을 뽑는 경우의 수를 구하세요.'],
      games: [2, true, n + '개의 팀이 다른 모든 팀과 한 번씩 경기를 할 때, 치러야 하는 경기의 수를 구하세요.'], shake: [2, true, n + '명이 서로 한 번씩 악수를 할 때, 악수를 하는 횟수를 구하세요.'],
      segs: [2, true, '원 위에 서로 다른 점이 ' + n + '개 있어요. 이 가운데 두 점을 이어 만들 수 있는 선분의 개수를 구하세요.'] }[q.kind];
    k = R[0]; same = R[1]; ans = same ? comb(n, k) : falling(n, k);
    wrong['not-ordered'] = same ? null : comb(n, k); wrong.ordered = same ? falling(n, k) : null;
    wrong.power = same ? null : pow(n, k); wrong.added = addAll(n, k); wrong['n-times-k'] = n * k;
    h2 = '① 먼저 순서를 따져서 세요. 첫 번째로 고르는 경우는 ' + n + '가지, 두 번째는 ' + (n - 1) + '가지' + (k === 3 ? ', 세 번째는 ' + (n - 2) + '가지' : '') + '예요. 이어서 고르니 곱해요. ② ' +
      (same ? '그런데 이 문제에서 고른 ' + (k === 2 ? '둘' : '셋') + '은 자리가 서로 같아요. 고른 차례만 다른 것은 같은 경우예요. 같은 ' + (k === 2 ? '둘' : '셋') + '을 고르는 차례는 $' + fallTex(k, k) + '$가지씩 있어요. ③ 같은 경우를 그만큼씩 겹쳐 세었으니, ①의 값을 그 수로 나눠요.'
        : '이 문제는 뽑힌 사람의 자리가 서로 달라요. 누가 어느 자리를 맡는지에 따라 다른 경우예요. ③ 그러니 ①에서 곱한 값을 그대로 써요. 더 나누지 않아요.');
    return { text: R[2], ans: ans, wrong: wrong, check: true,
      hints: [R_KEY, h2, same ? '수가 적으니 하나씩 적어서 세어도 돼요. A, B, C 같은 이름을 붙여요. A와 짝이 되는 것은 ' + (n - 1) + '가지예요. B와 새로 짝이 되는 것은 A를 뺀 ' + (n - 2) + '가지예요. 이렇게 1씩 줄여 가며 1가지가 될 때까지 적고, 적은 수를 모두 더해요. ②에서 나눠서 구한 값과 같아요.' : '수가 적으니 하나씩 적어서 세어도 돼요. A, B, C 같은 이름을 붙여요. A가 ' + R[3][0] + '이고 B가 ' + R[3][1] + '인 것과, B가 ' + R[3][0] + '이고 A가 ' + R[3][1] + '인 것은 다른 경우예요. ' + R[3][0] + '을 ' + R[3][2] + ' 사람 한 명마다 ' + R[3][1] + '을 ' + R[3][2] + ' 수 있는 사람이 몇 명인지 세어요.'],
      steps: same ? [{ say: '순서를 따져서 고르는 경우의 수를 먼저 구해요.', tex: fallTex(n, k) + ' = ' + falling(n, k) }, { say: '고른 차례만 다른 것은 같은 경우예요. 같은 것을 ' + fact(k) + '번씩 세었으니 ' + fact(k) + pj(fact(k), '으로/로') + ' 나눠요.', tex: falling(n, k) + ' \\div ' + fact(k) + ' = ' + ans }]
        : [{ say: '자리마다 올 수 있는 사람의 수를 차례로 적어요.', tex: range(k).map(function (i) { return n - i + 1; }).join(',\\ ') }, { say: '자리가 서로 다르니 그대로 곱해요.', tex: fallTex(n, k) + ' = ' + ans }] };
  };
  var digitsOf = function (r, n, zero) { var d = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, zero ? n - 1 : n).sort(function (x, y) { return x - y; }); return zero ? [0].concat(d) : d; };
  numQ({
    id: 'B27.arrange', title: '줄 세우기와 뽑기', build: arrBuild,
    mistakes: [['zero-first', '0이 맨 앞에 오는 것까지 세었어요. 0이 맨 앞에 오면 자릿수가 하나 줄어요. 맨 앞자리에는 0을 뺀 카드만 올 수 있어요.'],
      ['not-ordered', '순서를 구분하지 않고 세었어요. 줄을 세우거나 자리가 다르면, 같은 것을 골라도 차례가 다르면 다른 경우예요.'],
      ['ordered', '자리가 같은데 순서를 구분해서 세었어요. A, B를 뽑은 것과 B, A를 뽑은 것은 같은 경우예요. 겹쳐 센 횟수로 나눠요.'],
      ['power', '같은 것을 다시 쓸 수 있는 것처럼 세었어요. 한 번 쓴 것은 다시 쓸 수 없으니 자리마다 가짓수가 1씩 줄어요.'],
      ['added', '자리마다의 가짓수를 더했어요. 자리를 이어서 채우는 것이니 가짓수를 곱해야 해요.'],
      ['n-times-k', '전체 개수와 고르는 개수를 곱했어요. 자리마다 올 수 있는 가짓수를 차례로 적고, 그 수들을 곱해야 해요.']],
    levels: [
      /* 교육과정: 순열 · 조합을 써야 쉬운 복잡한 경우의 수는 다루지 않는다. 직접 적어서 셀 수 있는 크기만 낸다(2개 고르기, 답 42 이하. 모두 세우기는 5명까지) */
      { name: '한 줄로 세우기', minDistinct: 22, vars: { q: sampler(function (r) {
        if (r.int(0, 2) === 0) return { t: 'all', ctx: r.int(0, 3), n: r.int(3, 5) };
        return { t: 'pick', ctx: r.int(0, 2), k: 2, n: r.int(4, 7) };
      }) } },
      { name: '카드로 수 만들기', minDistinct: 200, vars: { q: sampler(function (r) { var n = r.int(3, 5); return { t: 'num', ds: digitsOf(r, n, r.int(0, 1) === 1), k: n === 5 ? 2 : r.int(2, 3) }; }) } },
      { name: '대표 뽑기', minDistinct: 28, vars: { q: sampler(function (r) {
        var kind = r.pick(['roles2', 'same2', 'prize', 'duty', 'games', 'shake', 'segs']);
        return { t: 'rep', kind: kind, n: r.int(/games|shake|segs/.test(kind) ? 4 : 3, 7) };
      }) } }
    ]
  });

  /* ── B27.prob 확률의 뜻 ────────────────────────────────── */
  var ptex = function (c, n) { var r = red(c, n); return r[0] === c ? frac(c, n) : frac(c, n) + ' = ' + frac(r[0], r[1]); };
  var P_KEY = '확률은 어떤 사건이 일어날 가능성을 0부터 1까지의 수로 나타낸 것이에요. 모든 경우가 똑같이 일어날 수 있을 때, (그 사건이 일어나는 경우의 수) ÷ (일어날 수 있는 모든 경우의 수)로 구해요. 제비 10개 가운데 당첨 제비가 3개이면, 당첨될 가능성은 10개 중 3개만큼이에요.';
  var P_LAST = function (n) { return '분모는 「전체」, 분자는 「바라는 것」이에요. 분모에 모든 경우의 수 ' + n + pj(n, '을/를') + ' 쓰고, 분자에 조건에 맞는 경우의 수를 써요. 분자와 분모가 같은 수로 나누어떨어지면 그 수로 나눠서 간단히 해요.'; };
  var COLORS = ['빨간', '파란', '노란'];
  var twoDigit = function (ds, ok) { var c = 0, i, j; for (i = 0; i < ds.length; i++) for (j = 0; j < ds.length; j++) if (i !== j && ok(10 * ds[i] + ds[j])) c++; return c; };
  var probBuild = function (q) {
    var s = q.sit, c = q.c, n, L, cnt, wrong = {}, ps, u, tot, cs, cl, ds, ok, word, x, a, b, T;
    if (q.t === 'single') {
      n = s.n; L = condList(c, n); cnt = L.length;
      wrong.boundary = c.t === 'ge' || c.t === 'le' ? [cnt - 1, n] : c.t === 'gt' || c.t === 'lt' ? [cnt + 1, n] : null;
      wrong['one-prime'] = c.t === 'prime' ? [cnt + 1, n] : null;
      wrong['mixed-up'] = c.t === 'mult' ? [condList({ t: 'div', k: c.k }, n).length, n] : c.t === 'div' ? [condList({ t: 'mult', k: c.k }, n).length, n] : null;
      wrong.complement = [n - cnt, n]; wrong.ratio = [cnt, n - cnt]; wrong.inverted = [n, cnt];
      return { text: intro(s) + whatStem(s, c).replace(/오$/, '올') + ' 확률을 구하세요.', ans: [cnt, n], wrong: wrong, check: true,
        hints: [P_KEY, '① 일어날 수 있는 모든 경우는 1부터 ' + n + '까지 ' + n + '가지예요. 이것이 분모예요. ② 이 가운데 ' + noun(c) + '를 모두 찾아 개수를 세요. 이것이 분자예요. ' + tip(c) + ' ③ 분수로 쓰고, 약분할 수 있으면 약분해요.', P_LAST(n)],
        steps: [{ say: '일어날 수 있는 모든 경우의 수예요.', tex: String(n) }, { say: noun(c) + '를 빠짐없이 적으면 ' + cnt + '개예요.', tex: L.join(',\\ ') }, { say: '(조건에 맞는 경우의 수) ÷ (모든 경우의 수)예요.', tex: ptex(cnt, n) }] };
    }
    if (q.t === 'color') {
      cs = q.cs; tot = cs.reduce(function (p, y) { return p + y; }, 0); cnt = cs[q.which];
      wrong.complement = [tot - cnt, tot]; wrong.ratio = [cnt, tot - cnt]; wrong['one-over-kinds'] = [1, cs.length]; wrong.inverted = [tot, cnt];
      return { text: cs.map(function (y, i) { return COLORS[i] + ' 공 ' + y + '개'; }).join(', ') + '가 들어 있는 주머니에서 공 한 개를 꺼낼 때, ' + COLORS[q.which] + ' 공이 나올 확률을 구하세요.', ans: [cnt, tot], wrong: wrong, check: true,
        hints: [P_KEY, '① 주머니 속의 공을 모두 더해요. ' + cs.join(', ') + '개를 더한 수가 모든 경우의 수이고, 분모예요. 공 하나하나가 뽑힐 가능성이 같기 때문이에요. ② ' + COLORS[q.which] + ' 공은 ' + cnt + '개예요. 이것이 분자예요. ③ 분수로 쓰고, 약분할 수 있으면 약분해요.',
          '색이 ' + cs.length + '가지라고 해서 확률이 똑같이 나뉘지는 않아요. 개수가 많은 색이 더 잘 나와요. 분모에는 공 전체의 개수를, 분자에는 ' + COLORS[q.which] + ' 공의 개수를 써요.'],
        steps: [{ say: '공은 모두 몇 개인지 구해요.', tex: cs.join(' + ') + ' = ' + tot }, { say: COLORS[q.which] + ' 공은 ' + cnt + '개예요. (그 색 공의 개수) ÷ (전체 공의 개수)예요.', tex: ptex(cnt, tot) }] };
    }
    if (q.t === 'dice2') {
      ps = pairs(q.m, q.k); cnt = ps.length; u = unordered(ps);
      wrong.unordered = [u, 36]; wrong['unordered-total'] = [u, 21]; wrong['total-added'] = [cnt, 12]; wrong['one-over-kinds'] = q.m === 'sum' ? [1, 11] : q.m === 'same' ? [1, 2] : null;
      return { text: DICE2 + '나오는 ' + pairWord(q.m, q.k) + (q.m === 'same' ? '을' : '일') + ' 확률을 구하세요.', ans: [cnt, 36], wrong: wrong, check: cnt >= 1,
        hints: [D_KEY, '① 모든 경우의 수는 $6 \\times 6$가지예요. 이것이 분모예요. ② ' + dice2Hint(q.m, q.k) + ' ③ 찾은 순서쌍의 개수가 분자예요.', '분모를 $6 + 6$으로 하지 않도록 조심해요. 첫째 주사위의 눈 6가지마다 둘째 주사위의 눈이 6가지씩 있으니 곱해요. 분수를 쓴 다음에는 약분해요.'],
        steps: [{ say: '모든 경우의 수예요.', tex: '6 \\times 6 = 36' }, { say: '조건에 맞는 (첫째 눈, 둘째 눈)은 ' + cnt + '가지예요.', tex: pairTex(ps) }, { say: '(조건에 맞는 경우의 수) ÷ (모든 경우의 수)예요.', tex: ptex(cnt, 36) }] };
    }
    if (q.t === 'coin') {
      cl = coinList(q.m, q.k, q.face); cnt = cl.length; tot = pow(2, q.m);
      wrong['one-over-kinds'] = [1, q.m + 1]; wrong.unordered = [1, tot]; wrong['total-added'] = [cnt, 2 * q.m];
      return { text: '서로 다른 동전 ' + q.m + '개를 동시에 던질 때, ' + FACE(q.face) + '이 ' + q.k + '개 나올 확률을 구하세요.', ans: [cnt, tot], wrong: wrong, check: true,
        hints: ['동전 여러 개를 던지면 동전마다 앞면인지 뒷면인지를 차례로 적어요. 동전은 서로 다른 물건이라서 (앞, 뒤)와 (뒤, 앞)은 다른 경우예요. 모든 경우를 빠짐없이 적어야 가능성이 똑같은 것끼리 비교할 수 있어요.',
          '① 동전 한 개마다 2가지가 나오니, 모든 경우의 수는 2를 ' + q.m + '번 곱한 수예요. 이것이 분모예요. ② ' + FACE(q.face) + '이 ' + q.k + '개인 경우를 「' + cl[0] + '」처럼 하나씩 적어요. ' + FACE(q.face) + '의 자리를 옮겨 가며 모두 찾아요. ③ 찾은 개수가 분자예요.',
          FACE(q.face) + '의 개수는 0개부터 ' + q.m + '개까지 ' + (q.m + 1) + '가지이지만, 이 ' + (q.m + 1) + '가지가 똑같이 잘 나오는 것은 아니에요. 그래서 동전마다 앞뒤를 적은 것을 한 가지 경우로 세야 해요.'],
        steps: [{ say: '모든 경우의 수예요.', tex: new Array(q.m + 1).join('2').split('').join(' \\times ') + ' = ' + tot }, { say: FACE(q.face) + '이 ' + q.k + '개인 경우는 ' + josa(cl.join(', '), '이에요/예요') + '. ' + cnt + '가지예요.', tex: String(cnt) }, { say: '(조건에 맞는 경우의 수) ÷ (모든 경우의 수)예요.', tex: ptex(cnt, tot) }] };
    }
    if (q.t === 'num2') {
      ds = q.ds; n = ds.length; tot = n * (n - 1); x = q.x;
      ok = q.ev === 'even' ? function (v) { return v % 2 === 0; } : q.ev === 'odd' ? function (v) { return v % 2 === 1; } : function (v) { return v > 10 * x; };
      cnt = twoDigit(ds, ok); word = q.ev === 'even' ? '짝수일' : q.ev === 'odd' ? '홀수일' : 10 * x + '보다 클';
      wrong.complement = [tot - cnt, tot]; wrong.half = q.ev === 'gt' ? null : [1, 2]; wrong['total-squared'] = [cnt, n * n]; wrong.boundary = q.ev === 'gt' ? [cnt - (n - 1), tot] : null;
      return { text: '$' + ds.join(',\\ ') + '$의 숫자가 하나씩 적힌 카드 ' + n + '장 중에서 2장을 뽑아 두 자리 자연수를 만들 때, 그 수가 ' + word + ' 확률을 구하세요.', ans: [cnt, tot], wrong: wrong, check: cnt >= 1 && cnt < tot,
        hints: ['확률은 (바라는 경우의 수) ÷ (모든 경우의 수)예요. 이 문제는 두 수를 모두 직접 구해야 해요. 수를 만들 때는 자리를 하나씩 채워요. 한 번 쓴 카드는 다시 쓸 수 없으니, 십의 자리에 놓은 카드는 일의 자리에 올 수 없어요.',
          '① 모든 경우: 십의 자리에 ' + n + '장, 일의 자리에 남은 ' + (n - 1) + '장이 올 수 있어요. 두 수를 곱한 것이 분모예요. ② ' + (q.ev === 'gt' ? 10 * x + '보다 큰 수는 십의 자리가 ' + x + ' 이상인 수예요. 십의 자리가 ' + x + '인 수도 일의 자리가 0이 아니라서 ' + 10 * x + '보다 커요. 십의 자리에 올 수 있는 카드를 세고, 그때마다 일의 자리에 남은 카드 ' + (n - 1) + '장을 놓아요.'
            : (q.ev === 'even' ? '짝수' : '홀수') + '는 일의 자리가 ' + (q.ev === 'even' ? '짝수' : '홀수') + '인 수예요. 일의 자리에 올 카드를 먼저 정하고, 그때마다 십의 자리에 남은 카드 ' + (n - 1) + '장을 놓아요.') + ' ③ 그렇게 센 수가 분자예요.',
          '조건이 걸린 자리를 먼저 채우는 것이 요령이에요. 그 자리에 올 수 있는 카드가 몇 장인지 세고, 나머지 자리에 올 수 있는 장수를 곱해요. 분모와 분자를 다 구했으면 분수로 쓰고 약분해요.'],
        steps: [{ say: '만들 수 있는 두 자리 수는 모두 몇 개인지 구해요.', tex: n + ' \\times ' + (n - 1) + ' = ' + tot }, { say: '그 가운데 조건에 맞는 수의 개수를 세요. 조건이 걸린 자리에 올 카드 ' + cnt / (n - 1) + '장마다 나머지 자리에 ' + (n - 1) + '장이 올 수 있어요.', tex: cnt / (n - 1) + ' \\times ' + (n - 1) + ' = ' + cnt }, { say: '(조건에 맞는 경우의 수) ÷ (모든 경우의 수)예요.', tex: ptex(cnt, tot) }] };
    }
    if (q.t === 'rep1') {
      n = q.n; T = comb(n, 2); cnt = n - 1;
      wrong['one-over'] = [1, n]; wrong.complement = [T - cnt, T]; wrong.ratio = [cnt, T - cnt];
      return { text: 'A를 포함한 ' + n + '명의 후보 중에서 대표 2명을 뽑을 때, A가 대표로 뽑힐 확률을 구하세요.', ans: [cnt, T], wrong: wrong, check: true,
        hints: [R_KEY, '① 모든 경우: ' + n + '명 중에서 대표 2명을 뽑는 경우의 수예요. 순서를 따져 세면 $' + n + ' \\times ' + (n - 1) + '$가지이고, 자리가 같으니 2로 나눠요. 이것이 분모예요. ② A가 뽑히는 경우: A는 이미 정해졌으니, 나머지 ' + (n - 1) + '명 가운데 함께 뽑힐 한 명만 고르면 돼요. 이것이 분자예요. ③ 분수로 쓰고 약분해요.',
          '대표가 2명이니 A가 뽑힐 기회도 그만큼 많아요. 한 명만 뽑을 때의 확률과 같다고 생각하지 않도록 조심해요. A와 짝이 될 수 있는 사람을 하나씩 적어 보면 분자가 보여요.'],
        steps: [{ say: '대표 2명을 뽑는 모든 경우의 수예요.', tex: n + ' \\times ' + (n - 1) + ' \\div 2 = ' + T }, { say: 'A와 함께 뽑힐 사람을 나머지 가운데 고르는 경우의 수예요.', tex: String(cnt) }, { say: '(조건에 맞는 경우의 수) ÷ (모든 경우의 수)예요.', tex: ptex(cnt, T) }] };
    }
    a = q.a; b = q.b; T = comb(a + b, 2); cnt = comb(b, 2); word = q.who ? ['여학생', '남학생'] : ['남학생', '여학생'];
    wrong['single-ratio'] = [b, a + b]; wrong.squared = [b * b, (a + b) * (a + b)]; wrong.complement = [T - cnt, T];
    return { text: word[0] + ' ' + a + '명과 ' + word[1] + ' ' + b + '명 중에서 대표 2명을 뽑을 때, 2명 모두 ' + word[1] + '이 뽑힐 확률을 구하세요.', ans: [cnt, T], wrong: wrong, check: true,
      hints: [R_KEY, '① 모든 경우: 전체 ' + (a + b) + '명 중에서 대표 2명을 뽑는 경우의 수예요. 순서를 따져 세면 $' + (a + b) + ' \\times ' + (a + b - 1) + '$가지이고, 자리가 같으니 2로 나눠요. 이것이 분모예요. ② 바라는 경우: ' + word[1] + ' ' + b + '명 중에서만 2명을 뽑는 경우의 수예요. 같은 방법으로 $' + b + ' \\times ' + (b - 1) + '$의 값을 2로 나눠요. 이것이 분자예요. ③ 분수로 쓰고 약분해요.',
        '분자를 셀 때는 ' + word[0] + '을 아예 빼고 생각해요. ' + word[1] + '끼리만 모아 놓고 그 안에서 2명을 뽑는 것이에요. 한 명을 뽑고 나면 남은 사람이 한 명 줄어든다는 것도 잊지 않아요.'],
      steps: [{ say: '전체 ' + (a + b) + '명 중에서 대표 2명을 뽑는 경우의 수예요.', tex: (a + b) + ' \\times ' + (a + b - 1) + ' \\div 2 = ' + T }, { say: word[1] + ' ' + b + '명 중에서 2명을 뽑는 경우의 수예요.', tex: b + ' \\times ' + (b - 1) + ' \\div 2 = ' + cnt }, { say: '(조건에 맞는 경우의 수) ÷ (모든 경우의 수)예요.', tex: ptex(cnt, T) }] };
  };
  var colorQ = function (r) { var k = r.int(2, 3), cs = [], i; for (i = 0; i < k; i++) cs.push(r.int(1, 7)); return { t: 'color', cs: cs, which: r.int(0, k - 1) }; };
  var P_MIS = [['boundary', '경계가 되는 수를 잘못 다뤘어요. 「이상」과 「이하」는 그 수를 포함하고, 「보다 큰」과 「보다 작은」은 그 수를 포함하지 않아요.'],
    ['one-prime', '1을 소수로 세었어요. 소수는 약수가 2개뿐인 수예요. 1은 약수가 1 하나뿐이라서 소수가 아니에요.'],
    ['mixed-up', '약수와 배수를 바꿔 세었어요. 약수는 그 수를 나누어떨어지게 하는 수이고, 배수는 그 수에 자연수를 곱한 수예요.'],
    ['one-over-kinds', '결과의 종류가 몇 가지인지만 보고 똑같이 나눴어요. 종류마다 일어나는 경우의 수가 달라요. 가능성이 똑같은 경우를 하나하나 세어야 해요.'],
    ['unordered-total', '순서만 바뀐 경우를 하나로 세었어요. 두 주사위는 서로 다른 물건이라서 (1, 2)와 (2, 1)은 다른 경우예요. 모든 경우의 수는 $6 \\times 6$가지예요.'],
    ['unordered', '분자를 셀 때 순서만 바뀐 경우를 하나로 세었어요. 서로 다른 물건을 던지니 (1, 2)와 (2, 1)처럼 차례가 다르면 다른 경우예요.'],
    ['total-added', '모든 경우의 수를 더해서 구했어요. 여러 개를 동시에 던지면 하나의 결과마다 다른 것의 결과가 짝지어지니 곱해야 해요.'],
    ['half', '짝수 아니면 홀수라서 반반이라고 생각했어요. 카드에 짝수와 홀수가 같은 개수로 있지 않으면 확률도 반반이 아니에요.'],
    ['total-squared', '같은 카드를 두 번 쓸 수 있는 것처럼 모든 경우를 세었어요. 십의 자리에 쓴 카드는 일의 자리에 다시 쓸 수 없어요.'],
    ['one-over', '한 명만 뽑을 때의 확률을 답했어요. 대표가 2명이니, A와 함께 뽑힐 사람을 고르는 경우를 모두 세어야 해요.'],
    ['single-ratio', '한 명만 뽑을 때의 확률을 답했어요. 2명을 뽑으니, 2명을 뽑는 경우의 수끼리 나눠야 해요.'],
    ['squared', '같은 사람을 두 번 뽑을 수 있는 것처럼 계산했어요. 한 명을 뽑으면 남은 사람이 한 명 줄어요.'],
    ['complement', '그 사건이 일어나지 않을 확률을 답했어요. 분자에는 문제가 묻는 조건에 맞는 경우의 수를 써요.'],
    ['ratio', '조건에 맞는 것과 맞지 않는 것의 비를 답했어요. 확률의 분모는 나머지가 아니라 모든 경우의 수예요.'],
    ['inverted', '분자와 분모를 거꾸로 썼어요. 모든 경우의 수가 분모이고, 조건에 맞는 경우의 수가 분자예요. 확률은 1보다 클 수 없어요.']];
  fracQ({
    id: 'B27.prob', title: '확률의 뜻', build: probBuild, mistakes: P_MIS,
    levels: [
      { name: '주사위 · 카드 · 주머니', minDistinct: 200, vars: { q: sampler(function (r) { var s; if (r.int(0, 3) === 0) return colorQ(r); s = sitOf(r, 8, 20, 20); return { t: 'single', sit: s, c: condOf(r, s.n, ['even', 'odd', 'mult', 'div', 'ge', 'le', 'gt', 'lt', 'prime']) }; }) } },
      { name: '주사위 두 개 · 동전 여러 개', minDistinct: 25, vars: { q: sampler(function (r) { var q = r.int(0, 3) ? dice2Q(r, true) : coinQ(r); return q; }) } },
      { name: '수 만들기 · 대표 뽑기', minDistinct: 150, vars: { q: sampler(function (r) {
        var k = r.int(0, 9), ds, ev;
        if (k < 6) { ds = digitsOf(r, r.int(3, 5), false); ev = r.pick(['even', 'odd', 'gt']); return { t: 'num2', ds: ds, ev: ev, x: ev === 'gt' ? ds[r.int(1, ds.length - 1)] : 0 }; }
        if (k < 7) return { t: 'rep1', n: r.int(4, 7) };
        return { t: 'rep2', a: r.int(1, 4), b: r.int(2, 4), who: r.int(0, 1) };
      }) } }
    ]
  });

  /* ── B27.sense 확률의 성질 (보기 고르기) ───────────────── */
  var S_KEY = '확률은 0부터 1까지의 수예요. 절대 일어나지 않는 사건의 확률은 0이고, 반드시 일어나는 사건의 확률은 1이에요. 해가 서쪽에서 뜰 확률은 0, 내일도 해가 뜰 확률은 1인 것과 같아요. 일어날 수도 있고 일어나지 않을 수도 있는 사건의 확률은 그 사이의 수예요.';
  var senseBuild = function (q) {
    var s = q.sit, n = s && s.n, o = q.o, ans, wrong, opts, cs, big, cnt;
    if (q.t === 'sure') {
      if (q.want === 1) {
        ans = sentence(s, q.one);
        wrong = [[sentence(s, q.zero), 'never', '이 사건은 절대 일어나지 않아요. 절대 일어나지 않는 사건의 확률은 0이에요. 확률이 1인 것은 반드시 일어나는 사건이에요.'],
          [sentence(s, q.mid), 'sometimes', '이 사건은 일어날 수도 있고 일어나지 않을 수도 있어요. 그런 사건의 확률은 0보다 크고 1보다 작아요.'],
          [sentence(s, q.edge), 'almost', '이 사건은 자주 일어나지만 일어나지 않는 경우가 하나 있어요. 하나라도 빠지면 확률은 1보다 작아요.']];
      } else {
        ans = sentence(s, q.zero);
        wrong = [[sentence(s, q.one), 'always', '이 사건은 반드시 일어나요. 반드시 일어나는 사건의 확률은 1이에요. 확률이 0인 것은 절대 일어나지 않는 사건이에요.'],
          [sentence(s, q.mid), 'sometimes', '이 사건은 일어날 수도 있고 일어나지 않을 수도 있어요. 그런 사건의 확률은 0보다 크고 1보다 작아요.'],
          [sentence(s, q.edge), 'rarely', '이 사건은 드물지만 일어나는 경우가 하나 있어요. 하나라도 있으면 확률은 0보다 커요.']];
      }
      return { text: intro(s) + '다음 중 확률이 ' + q.want + '인 사건은 어느 것인가요?', ans: ans, wrong: wrong,
        check: condList(q.one, n).length === n && condList(q.zero, n).length === 0 && condList(q.edge, n).length === (q.want === 1 ? n - 1 : 1) && condList(q.mid, n).length > 1 && condList(q.mid, n).length < n - 1,
        hints: [S_KEY, '① 나올 수 있는 수는 1부터 ' + n + '까지예요. ② 보기마다 조건에 맞는 수가 몇 개인지 세요. ③ ' + n + '개가 모두 맞으면 반드시 일어나는 사건이고, 하나도 맞지 않으면 절대 일어나지 않는 사건이에요.',
          q.want === 1 ? '확률이 1이라는 것은 무엇이 나와도 그 사건이 일어난다는 뜻이에요. 1부터 ' + n + '까지의 수를 하나씩 넣어 보면서, 조건에 맞지 않는 수가 하나라도 있는 보기를 지워요.' : '확률이 0이라는 것은 무엇이 나와도 그 사건이 일어나지 않는다는 뜻이에요. 1부터 ' + n + '까지의 수를 하나씩 넣어 보면서, 조건에 맞는 수가 하나라도 있는 보기를 지워요.'],
        steps: [{ say: '나올 수 있는 수를 모두 떠올려요.', tex: '1,\\ 2,\\ \\cdots,\\ ' + n }, { say: q.want === 1 ? '어떤 수가 나와도 일어나는 사건을 찾아요. 그 사건의 확률이 1이에요.' : '어떤 수가 나와도 일어나지 않는 사건을 찾아요. 그 사건의 확률이 0이에요.', tex: ans }] };
    }
    if (q.t === 'value') {
      ans = q.bad;
      wrong = [['0', 'zero-ok', '0은 확률이 될 수 있어요. 절대 일어나지 않는 사건의 확률이 0이에요.'], ['1', 'one-ok', '1은 확률이 될 수 있어요. 반드시 일어나는 사건의 확률이 1이에요.'],
        [q.mid, 'between-ok', '이 수는 0보다 크고 1보다 작아요. 일어날 수도 있고 일어나지 않을 수도 있는 사건의 확률이 될 수 있어요.']];
      opts = [ans].concat(wrong.map(function (w) { return w[0]; }));
      return { text: '다음 네 수 ' + o.map(function (i) { return '$' + opts[i] + '$'; }).join(', ') + ' 가운데 어떤 사건의 확률이 될 수 없는 수는 어느 것인가요?', ans: ans, wrong: wrong, check: true,
        hints: [S_KEY, '① 확률은 (그 사건의 경우의 수) ÷ (모든 경우의 수)예요. 분자는 0개부터 전체 개수까지만 될 수 있어요. ② 그래서 확률은 0보다 작을 수 없고 1보다 클 수도 없어요. ③ 0과 1은 그 자체로 확률이 될 수 있다는 것도 기억해요.',
          '네 수를 수직선 위에 놓아 봐요. 0과 1 사이에 있거나 0, 1과 같은 수는 확률이 될 수 있어요. 0의 왼쪽이나 1의 오른쪽으로 벗어난 수를 찾아요. 분수는 분자가 분모보다 큰지 살펴봐요.'],
        steps: [{ say: '확률은 0 이상 1 이하의 수예요.', tex: '0 \\le (\\text{확률}) \\le 1' }, { say: '이 범위를 벗어난 수를 찾아요.', tex: ans }] };
    }
    /* 확률이 가장 큰(작은) 사건: q.cs 는 경우의 수가 서로 다른 조건 4개 */
    cs = q.cs.slice().sort(function (x, y) { return (condList(y, n).length - condList(x, n).length) * (q.big ? 1 : -1); }); big = q.big;
    cnt = function (c) { return condList(c, n).length; };
    wrong = [['next', 1], ['middle', 2], ['opposite', 3]].map(function (w) {
      return [sentence(s, cs[w[1]]), w[0], '이 사건은 ' + n + '가지 가운데 ' + cnt(cs[w[1]]) + '가지예요. 경우의 수가 더 ' + (big ? '많은' : '적은') + ' 사건이 있어요. 보기마다 조건에 맞는 수를 세어 비교해요.'];
    });
    return { text: intro(s) + '다음 중 일어날 확률이 가장 ' + (big ? '큰' : '작은') + ' 사건은 어느 것인가요?', ans: sentence(s, cs[0]), wrong: wrong, check: cs.every(function (c, i) { return i === 0 || cnt(c) !== cnt(cs[i - 1]); }),
      hints: ['모든 경우의 수가 같으면 확률의 분모가 같아요. 분모가 같은 분수는 분자가 클수록 커요. 그래서 그 사건이 일어나는 경우의 수가 많을수록 확률이 커요. 제비뽑기에서 당첨 제비가 많을수록 당첨되기 쉬운 것과 같아요.',
        '① 나올 수 있는 수는 1부터 ' + n + '까지 ' + n + '가지예요. 네 사건의 분모는 모두 ' + n + E(n) + '. ② 보기마다 조건에 맞는 수를 모두 적고 개수를 세요. ③ 개수가 가장 ' + (big ? '많은' : '적은') + ' 보기를 골라요.',
        '보기 옆에 조건에 맞는 수를 직접 적어 봐요. 「이상」과 「이하」는 그 수를 포함하고, 1은 소수가 아니라는 것에 조심해요. 네 보기의 개수를 나란히 적으면 가장 ' + (big ? '큰' : '작은') + ' 것이 보여요.'],
      steps: [{ say: '보기마다 조건에 맞는 수의 개수를 세요. 분모는 모두 ' + n + E(n) + '.', tex: cs.map(function (c) { return frac(cnt(c), n); }).join(',\\quad ') }, { say: '분자가 가장 ' + (big ? '큰' : '작은') + ' 사건을 골라요.', tex: sentence(s, cs[0]) }] };
  };
  var o4 = function (r) { return r.shuffle([0, 1, 2, 3]); };
  var sureQ = function (r) {
    var s = sitOf(r, 8, 20, 30), n = s.n, want = r.int(0, 1);
    return { t: 'sure', sit: s, want: want, o: o4(r),
      one: r.pick([{ t: 'le', k: n }, { t: 'ge', k: 1 }, { t: 'lt', k: n + 1 }, { t: 'gt', k: 0 }]), zero: r.pick([{ t: 'gt', k: n }, { t: 'ge', k: n + 1 }, { t: 'lt', k: 1 }, { t: 'le', k: 0 }]),
      edge: want === 1 ? r.pick([{ t: 'ge', k: 2 }, { t: 'le', k: n - 1 }, { t: 'lt', k: n }, { t: 'gt', k: 1 }]) : r.pick([{ t: 'ge', k: n }, { t: 'le', k: 1 }, { t: 'lt', k: 2 }, { t: 'gt', k: n - 1 }]),
      mid: condOf(r, n, ['even', 'odd', 'mult', 'div', 'prime', 'ge', 'le'], 2, n - 2) };
  };
  var properOf = function (r) { var b = r.int(2, 9), a; do { a = r.int(1, b - 1); } while (gcd(a, b) !== 1); return [a, b]; };
  var valueQ = function (r) {
    var k = r.int(0, 3), p = properOf(r), bad = k === 0 ? frac(p[0] + p[1], p[1]) : k === 1 ? '1.' + r.int(1, 9) : k === 2 ? '-' + frac(p[0], p[1]) : '-0.' + r.int(1, 9), m = properOf(r);
    return { t: 'value', o: o4(r), bad: bad, mid: r.int(0, 2) ? frac(m[0], m[1]) : '0.' + r.int(1, 9) };
  };
  var mostQ = function (r) {
    var s = sitOf(r, 8, 20, 25), n = s.n;
    return until(function () { var cs = [], i; for (i = 0; i < 4; i++) cs.push(condOf(r, n, ['even', 'odd', 'mult', 'div', 'prime', 'ge', 'le', 'gt', 'lt'], 1, n - 1)); return { t: 'most', sit: s, o: o4(r), big: r.int(0, 1) === 1, cs: cs }; },
      function (q) { var l = q.cs.map(function (c) { return condList(c, n).length; }); return l.every(function (x, i) { return l.indexOf(x) === i; }); });
  };
  choiceQ({
    id: 'B27.sense', title: '확률의 성질', build: senseBuild, ids: ['never', 'always', 'sometimes', 'almost', 'rarely', 'zero-ok', 'one-ok', 'between-ok', 'next', 'middle', 'opposite'],
    levels: [
      /* 문제 글은 상황과 묻는 말뿐이라 가짓수가 적다. 보기는 문제마다 달라진다 */
      { name: '확률이 0인 사건 · 1인 사건', minDistinct: 40, vars: { q: sampler(sureQ) } },
      { name: '확률이 될 수 없는 수', minDistinct: 300, vars: { q: sampler(valueQ) } },
      { name: '확률이 가장 큰 사건 · 작은 사건', minDistinct: 40, vars: { q: sampler(mostQ) } }
    ]
  });

  /* ── B27.property 일어나지 않을 확률 ───────────────────── */
  var NOT_CTX = [
    function (p) { return ['내일 비가 올 확률이 $' + p + '$일 때, 내일 비가 오지 않을 확률을 구하세요.', '비가 오는 것']; },
    function (p) { return ['어떤 시험에 합격할 확률이 $' + p + '$일 때, 이 시험에 합격하지 못할 확률을 구하세요.', '합격하는 것']; },
    function (p) { return ['제비 한 개를 뽑을 때 당첨될 확률이 $' + p + '$인 제비뽑기가 있어요. 제비 한 개를 뽑을 때 당첨되지 않을 확률을 구하세요.', '당첨되는 것']; },
    function (p) { return ['어떤 선수가 자유투를 성공할 확률이 $' + p + '$일 때, 이 선수가 자유투를 성공하지 못할 확률을 구하세요.', '성공하는 것']; },
    function (p) { return ['두 팀 A, B가 경기를 하는데 비기는 경우는 없어요. A 팀이 이길 확률이 $' + p + '$일 때, B 팀이 이길 확률을 구하세요.', 'A 팀이 이기는 것']; },
    function (p) { return ['어떤 문제를 맞힐 확률이 $' + p + '$일 때, 이 문제를 틀릴 확률을 구하세요.', '맞히는 것']; }];
  var N_KEY2 = '어떤 사건은 일어나거나 일어나지 않거나 둘 중 하나예요. 그래서 (일어날 확률) + (일어나지 않을 확률) = 1이에요. 제비 10개 중 당첨이 3개이면 꽝은 7개예요. 당첨될 확률과 꽝이 나올 확률을 더하면 10개 전체, 곧 1이 돼요.';
  var ATL_KEY = '「적어도 하나」는 하나일 때, 둘일 때, 그보다 많을 때를 모두 합친 것이라서 직접 세기 번거로워요. 반대쪽을 보면 쉬워요. 「적어도 하나는 있다」의 반대는 「하나도 없다」예요. 「하나도 없다」는 모양이 한 가지뿐이라 세기 쉬워요. 그래서 1에서 「하나도 없을 확률」을 빼요.';
  var ATL_LAST = '전체에서 「하나도 없는 경우」만 지우면 나머지는 모두 「적어도 하나는 있는 경우」예요. 분모는 그대로 두고, 분자를 (모든 경우의 수) − (하나도 없는 경우의 수)로 바꾸면 돼요. 마지막에 약분해요.';
  var propBuild = function (q) {
    var a = q.a, b = q.b, s = q.sit, c = q.c, n, cnt, wrong = {}, C, ps, cs, tot, none, T, word, m, k;
    if (q.t === 'given') {
      C = NOT_CTX[q.ctx](frac(a, b));
      wrong.same = [a, b]; wrong.inverted = [b, a]; wrong['top-minus-one'] = [a - 1, b]; wrong['bottom-minus'] = [a, b - a];
      return { text: C[0], ans: [b - a, b], wrong: wrong, check: gcd(a, b) === 1,
        hints: [N_KEY2, '① 일어나지 않을 확률은 1에서 일어날 확률을 뺀 것이에요. ② 1을 분모가 ' + b + '인 분수로 바꿔요. 분자와 분모가 같은 분수가 1이에요. ③ 분모는 그대로 두고 분자끼리 빼요.',
          '전체를 ' + b + '칸으로 나눈 띠를 떠올려요. 그 가운데 ' + a + '칸이 ' + C[1] + '이에요. 색칠하지 않은 나머지 칸이 몇 칸인지 세면 분자가 나와요. 분모는 그대로 ' + b + E(b) + '.'],
        steps: [{ say: '(일어나지 않을 확률) = 1 − (일어날 확률)이에요.', tex: '1 - ' + frac(a, b) }, { say: '1을 분모가 ' + b + '인 분수로 바꿔서 빼요.', tex: frac(b, b) + ' - ' + frac(a, b) + ' = ' + frac(b - a, b) }] };
    }
    if (q.t === 'not-single') {
      n = s.n; cnt = condList(c, n).length;
      wrong['not-complemented'] = [cnt, n]; wrong.ratio = [cnt, n - cnt]; wrong.inverted = [n, n - cnt];
      return { text: intro(s) + whatStem(s, c) + '지 않을 확률을 구하세요.', ans: [n - cnt, n], wrong: wrong, check: true,
        hints: [N_KEY2, '① 먼저 ' + noun(c) + '가 나올 확률을 구해요. 모든 경우는 ' + n + '가지이고, ' + noun(c) + '를 모두 찾아 개수를 세요. ' + tip(c) + ' ② 나오지 않을 확률은 1에서 ①의 확률을 뺀 것이에요. ③ 1을 분모가 ' + n + '인 분수로 바꿔서 빼요.',
          '다른 방법도 있어요. 1부터 ' + n + '까지의 수 가운데 ' + noun(c) + '가 아닌 수를 직접 세어 분자에 써도 돼요. 두 방법의 답이 같은지 견줘 보면 실수를 줄일 수 있어요. 마지막에 약분해요.'],
        steps: [{ say: noun(c) + '가 나올 확률을 먼저 구해요. 조건에 맞는 수는 ' + cnt + '개예요.', tex: frac(cnt, n) }, { say: '1에서 그 확률을 빼요.', tex: '1 - ' + frac(cnt, n) + ' = ' + ptex(n - cnt, n) }] };
    }
    if (q.t === 'not-color') {
      cs = q.cs; tot = cs.reduce(function (p, y) { return p + y; }, 0); cnt = cs[q.which];
      wrong['not-complemented'] = [cnt, tot]; wrong.ratio = [cnt, tot - cnt]; wrong.inverted = [tot, tot - cnt];
      return { text: cs.map(function (y, i) { return COLORS[i] + ' 공 ' + y + '개'; }).join(', ') + '가 들어 있는 주머니에서 공 한 개를 꺼낼 때, ' + COLORS[q.which] + ' 공이 나오지 않을 확률을 구하세요.', ans: [tot - cnt, tot], wrong: wrong, check: true,
        hints: [N_KEY2, '① 먼저 ' + COLORS[q.which] + ' 공이 나올 확률을 구해요. 공 전체의 개수가 분모이고, ' + COLORS[q.which] + ' 공의 개수 ' + cnt + pj(cnt, '이/가') + ' 분자예요. ② 나오지 않을 확률은 1에서 ①의 확률을 뺀 것이에요. ③ 1을 분모가 같은 분수로 바꿔서 빼요.',
          '다른 방법도 있어요. ' + COLORS[q.which] + ' 공이 아닌 공을 모두 더해서 분자에 써도 돼요. 두 방법의 답이 같은지 견줘 보면 실수를 줄일 수 있어요. 마지막에 약분해요.'],
        steps: [{ say: COLORS[q.which] + ' 공이 나올 확률을 먼저 구해요. 공은 모두 ' + tot + '개예요.', tex: frac(cnt, tot) }, { say: '1에서 그 확률을 빼요.', tex: '1 - ' + frac(cnt, tot) + ' = ' + ptex(tot - cnt, tot) }] };
    }
    if (q.t === 'not-dice') {
      ps = pairs(q.m, q.k); cnt = ps.length;
      wrong['not-complemented'] = [cnt, 36]; wrong.ratio = [cnt, 36 - cnt]; wrong['total-added'] = [12 - cnt, 12];
      return { text: DICE2 + '나오는 ' + (q.m === 'same' ? '두 눈의 수가 서로 다를' : pairWord(q.m, q.k) + pj(q.k, '이/가') + ' 아닐') + ' 확률을 구하세요.', ans: [36 - cnt, 36], wrong: wrong, check: cnt >= 1,
        hints: [N_KEY2, '① 반대쪽이 세기 쉬워요. 먼저 ' + pairWord(q.m, q.k) + (q.m === 'same' ? '은' : '인') + ' 경우를 (첫째 눈, 둘째 눈)으로 모두 적고 개수를 세요. ② 모든 경우의 수는 $6 \\times 6$가지예요. ①의 개수를 분자로 해서 확률을 구해요. ③ 1에서 그 확률을 빼요.',
          '조건에 맞지 않는 쪽을 직접 세려면 순서쌍을 아주 많이 적어야 해요. 적은 쪽을 세고 전체에서 빼는 것이 빠르고 틀리지 않아요. 분모는 $6 \\times 6$ 그대로 두고 분자만 빼요.'],
        steps: [{ say: pairWord(q.m, q.k) + (q.m === 'same' ? '은' : '인') + ' 경우는 ' + cnt + '가지예요.', tex: pairTex(ps) }, { say: '그 확률을 구해요.', tex: frac(cnt, 36) }, { say: '1에서 그 확률을 빼요.', tex: '1 - ' + frac(cnt, 36) + ' = ' + ptex(36 - cnt, 36) }] };
    }
    if (q.t === 'atl-coin') {
      m = q.m; tot = pow(2, m); word = q.ox ? '맞는 문제' : FACE(q.face);
      wrong.none = [1, tot]; wrong['exactly-one'] = [m, tot]; wrong.half = [1, 2];
      return { text: q.ox ? '○, × 가운데 하나를 고르는 문제 ' + m + '개에 무작정 답을 적을 때, 적어도 한 문제는 맞힐 확률을 구하세요.' : '서로 다른 동전 ' + m + '개를 동시에 던질 때, 적어도 한 개는 ' + FACE(q.face) + '이 나올 확률을 구하세요.', ans: [tot - 1, tot], wrong: wrong, check: true,
        hints: [ATL_KEY, '① 모든 경우의 수: ' + (q.ox ? '문제' : '동전') + ' 하나마다 2가지이니 2를 ' + m + '번 곱해요. ② ' + josa(word, '이/가') + ' 하나도 없는 경우는 ' + (q.ox ? '모두 틀리는' : '모두 ' + (q.face === '앞' ? '뒷' : '앞') + '면이 나오는') + ' 한 가지뿐이에요. ③ 1에서 「하나도 없을 확률」을 빼요.', ATL_LAST],
        steps: [{ say: '모든 경우의 수예요.', tex: new Array(m + 1).join('2').split('').join(' \\times ') + ' = ' + tot }, { say: josa(word, '이/가') + ' 하나도 없는 경우는 1가지예요. 그 확률이에요.', tex: frac(1, tot) }, { say: '1에서 그 확률을 빼요.', tex: '1 - ' + frac(1, tot) + ' = ' + frac(tot - 1, tot) }] };
    }
    if (q.t === 'atl-dice') {
      k = condList(c, 6).length; none = (6 - k) * (6 - k);
      wrong.none = [none, 36]; wrong.both = [k * k, 36]; wrong['exactly-one'] = [2 * k * (6 - k), 36]; wrong.added = k < 3 ? [2 * k, 6] : null;
      return { text: DICE2 + '적어도 한 개는 ' + dicePhrase(c) + '이 나올 확률을 구하세요.', ans: [36 - none, 36], wrong: wrong, check: k >= 1 && k <= 5,
        hints: [ATL_KEY, '① 모든 경우의 수는 $6 \\times 6$가지예요. ② 반대쪽은 「두 주사위 모두 ' + dicePhrase(c) + '이 나오지 않는다」예요. 주사위 한 개에서 ' + dicePhrase(c) + '이 아닌 눈은 ' + (6 - k) + '가지예요. 두 주사위가 모두 그래야 하니 $' + (6 - k) + ' \\times ' + (6 - k) + '$가지예요. ③ 1에서 그 확률을 빼요.', ATL_LAST],
        steps: [{ say: '모든 경우의 수예요.', tex: '6 \\times 6 = 36' }, { say: '두 주사위 모두 ' + dicePhrase(c) + '이 나오지 않는 경우의 수예요.', tex: (6 - k) + ' \\times ' + (6 - k) + ' = ' + none }, { say: '1에서 그 확률을 빼요.', tex: '1 - ' + frac(none, 36) + ' = ' + ptex(36 - none, 36) }] };
    }
    T = comb(a + b, 2); none = comb(a, 2); word = q.who ? ['여학생', '남학생'] : ['남학생', '여학생'];
    wrong.none = [none, T]; wrong.both = [comb(b, 2), T]; wrong['exactly-one'] = [a * b, T]; wrong['single-ratio'] = [b, a + b];
    return { text: word[0] + ' ' + a + '명과 ' + word[1] + ' ' + b + '명 중에서 대표 2명을 뽑을 때, 적어도 한 명은 ' + word[1] + '이 뽑힐 확률을 구하세요.', ans: [T - none, T], wrong: wrong, check: true,
      hints: [ATL_KEY, '① 모든 경우: 전체 ' + (a + b) + '명 중에서 대표 2명을 뽑는 경우의 수예요. $' + (a + b) + ' \\times ' + (a + b - 1) + '$의 값을 2로 나눠요. ② 반대쪽은 「' + word[1] + '이 한 명도 없다」, 곧 2명 모두 ' + word[0] + '인 경우예요. ' + word[0] + ' ' + a + '명 중에서 2명을 뽑으니 $' + a + ' \\times ' + (a - 1) + '$의 값을 2로 나눠요. ③ 1에서 그 확률을 빼요.', ATL_LAST],
      steps: [{ say: '대표 2명을 뽑는 모든 경우의 수예요.', tex: (a + b) + ' \\times ' + (a + b - 1) + ' \\div 2 = ' + T }, { say: '2명 모두 ' + word[0] + '인 경우의 수예요.', tex: a + ' \\times ' + (a - 1) + ' \\div 2 = ' + none }, { say: '1에서 그 확률을 빼요.', tex: '1 - ' + frac(none, T) + ' = ' + ptex(T - none, T) }] };
  };
  fracQ({
    id: 'B27.property', title: '일어나지 않을 확률', build: propBuild,
    mistakes: [['not-complemented', '그 사건이 일어날 확률을 답했어요. 문제는 일어나지 않을 확률을 물어요. 1에서 그 확률을 빼요.'],
      ['none', '하나도 없을 확률을 답했어요. 여기서 멈추지 말고, 1에서 그 확률을 빼야 「적어도 하나」의 확률이 돼요.'],
      ['exactly-one', '딱 하나만인 경우만 세었어요. 「적어도 하나」에는 둘 이상인 경우도 들어가요. 1에서 「하나도 없을 확률」을 빼면 모두 셀 수 있어요.'],
      ['both', '모두 그런 경우만 세었어요. 「적어도 하나」는 하나만 그래도 돼요. 1에서 「하나도 없을 확률」을 빼요.'],
      ['added', '주사위 한 개의 확률을 두 번 더했어요. 두 주사위 모두 조건에 맞는 경우를 두 번 세게 돼요. 1에서 「하나도 없을 확률」을 빼요.'],
      ['half', '있거나 없거나 둘 중 하나라서 반반이라고 생각했어요. 두 쪽의 경우의 수가 달라요. 「하나도 없는 경우」는 한 가지뿐이에요.'],
      ['single-ratio', '한 명만 뽑을 때의 확률을 답했어요. 2명을 뽑으니, 2명을 뽑는 경우의 수로 따져야 해요.'],
      ['same', '주어진 확률을 그대로 답했어요. 문제는 그 반대쪽의 확률을 물어요. 1에서 주어진 확률을 빼요.'],
      ['top-minus-one', '분자에서 1을 뺐어요. 1을 분모가 같은 분수로 바꾼 다음에 빼야 해요. 1은 분자와 분모가 같은 분수예요.'],
      ['bottom-minus', '분모에서 분자를 뺐어요. 분모는 전체를 나눈 칸 수라서 바뀌지 않아요. 분자끼리만 빼요.'],
      ['total-added', '모든 경우의 수를 $6 + 6$으로 구했어요. 두 주사위를 동시에 던지니 $6 \\times 6$가지예요.'],
      ['ratio', '일어나는 것과 일어나지 않는 것의 비를 답했어요. 확률의 분모는 모든 경우의 수예요.'],
      ['inverted', '분자와 분모를 거꾸로 썼어요. 모든 경우의 수가 분모예요. 확률은 1보다 클 수 없어요.']],
    levels: [
      { name: '확률이 주어졌을 때', minDistinct: 150, vars: { q: sampler(function (r) { var b = r.int(3, 12), a; do { a = r.int(1, b - 1); } while (gcd(a, b) !== 1); return { t: 'given', ctx: r.int(0, 5), a: a, b: b }; }) } },
      { name: '~이 아닐 확률', minDistinct: 150, vars: { q: sampler(function (r) {
        var k = r.int(0, 9), s, q;
        if (k < 5) { s = sitOf(r, 8, 20, 20); return { t: 'not-single', sit: s, c: condOf(r, s.n, ['even', 'odd', 'mult', 'div', 'ge', 'le', 'gt', 'lt', 'prime']) }; }
        if (k < 8) { q = colorQ(r); q.t = 'not-color'; return q; }
        q = dice2Q(r, true); q.t = 'not-dice'; return q;
      }) } },
      { name: '적어도 하나', minDistinct: 30, vars: { q: sampler(function (r) {
        var k = r.int(0, 9), ox;
        if (k < 3) { ox = r.int(0, 1) === 1; return { t: 'atl-coin', ox: ox, m: r.int(2, ox ? 5 : 4), face: r.pick(['앞', '뒤']) }; }
        if (k < 6) return { t: 'atl-dice', c: condOf(r, 6, ['even', 'odd', 'mult', 'div', 'ge', 'le', 'gt', 'lt', 'prime']) };
        return { t: 'atl-rep', a: r.int(2, 4), b: r.int(1, 4), who: r.int(0, 1) };
      }) } }
    ]
  });

  /* ── 개념 카드 ─────────────────────────────────────────── */
  var treeFig = (function () {
    var it = [['text', 100, 14, '첫째 동전'], ['text', 185, 14, '둘째 동전'], ['text', 258, 14, '결과'], ['text', 100, 62, '앞'], ['text', 100, 132, '뒤'], ['seg', 40, 97, 86, 64], ['seg', 40, 97, 86, 130]];
    [[62, 44, '앞', '(앞, 앞)'], [62, 80, '뒤', '(앞, 뒤)'], [132, 114, '앞', '(뒤, 앞)'], [132, 150, '뒤', '(뒤, 뒤)']].forEach(function (b) {
      it.push(['seg', 114, b[0], 171, b[1]], ['text', 185, b[1], b[2]], ['seg', 199, b[1], 226, b[1], true], ['text', 258, b[1], b[3]]);
    });
    return { type: 'geo', h: 166, alt: '동전 두 개를 던질 때의 수형도. 첫째 동전이 앞, 뒤로 갈라지고, 그 각각에서 둘째 동전이 다시 앞, 뒤로 갈라져서 (앞, 앞), (앞, 뒤), (뒤, 앞), (뒤, 뒤)의 네 가지 결과가 된다.', items: it };
  })();
  MH.defineConcept('B27', [
    { title: '사건과 경우의 수', body: [
      '주사위를 던지거나 카드를 뽑는 것처럼 같은 조건에서 되풀이할 수 있는 일의 결과를 사건이라고 해요. 그 사건이 일어나는 가짓수가 경우의 수예요.',
      '주사위 한 개를 던지면 나올 수 있는 눈은 1, 2, 3, 4, 5, 6의 6가지예요. 이 가운데 조건에 맞는 것을 하나씩 적고 세면 돼요.',
      { ex: [['2,\\ 4,\\ 6', '짝수의 눈이 나오는 경우 — 3가지'], ['3,\\ 6', '3의 배수의 눈이 나오는 경우 — 2가지'], ['5,\\ 6', '5 이상의 눈이 나오는 경우 — 2가지']] },
      '빠뜨리지 않고 두 번 세지 않는 것이 전부예요. 작은 수부터 차례로 적는 습관을 들이면 실수가 줄어요.'
    ] },
    { title: '「또는」은 더하기', body: [
      '두 사건이 한꺼번에 일어날 수 없을 때, 둘 중 하나가 일어나는 경우의 수는 두 경우의 수를 더한 것이에요.',
      '분식집에 김밥이 3종류, 라면이 2종류 있어요. 이 가운데 하나만 주문한다면 고를 수 있는 것은 차림표에 한 줄로 적힌 다섯 가지예요.',
      { ex: [['3 + 2 = 5', '김밥 또는 라면 가운데 하나만 고르기'], ['2 + 4 = 6', '주사위 두 개의 눈의 합이 3 또는 5']] },
      '「또는」, 「~이나」, 「하나만」이라는 말이 보이면 더하기를 떠올려요.'
    ] },
    { title: '「동시에」는 곱하기', body: [
      '한 가지를 고르고 이어서 또 한 가지를 고를 때는 두 경우의 수를 곱해요. 앞의 것 하나마다 뒤의 것을 모두 짝지을 수 있기 때문이에요.',
      { figure: treeFig },
      '이렇게 나뭇가지처럼 갈라지는 그림을 수형도라고 해요. 첫째 동전 2가지마다 둘째 동전이 2가지씩 갈라져서 모두 4가지가 돼요.',
      { ex: [['2 \\times 2 = 4', '동전 두 개를 동시에 던지기'], ['6 \\times 6 = 36', '주사위 두 개를 동시에 던지기'], ['3 \\times 4 = 12', '티셔츠 3벌과 바지 4벌을 하나씩 골라 입기']] },
      '두 동전은 서로 다른 물건이에요. 그래서 (앞, 뒤)와 (뒤, 앞)은 다른 경우예요.'
    ] },
    { title: '줄 세우기와 뽑기', body: [
      '한 줄로 세울 때는 자리를 하나씩 채워요. 앞자리에 한 명을 세우면 뒷자리에 올 수 있는 사람이 한 명 줄어요.',
      { ex: [['3 \\times 2 \\times 1 = 6', '3명을 한 줄로 세우기'], ['4 \\times 3 = 12', '4명 중 회장 1명, 부회장 1명 뽑기'], ['4 \\times 3 \\div 2 = 6', '4명 중 대표 2명 뽑기']] },
      '회장과 부회장은 자리가 달라요. 누가 어느 자리를 맡는지에 따라 다른 경우예요. 대표 2명은 자리가 같아요. A, B를 뽑은 것과 B, A를 뽑은 것이 같은 경우라서 2로 나눠요.',
      '수가 적을 때는 A, B, C, D로 이름을 붙여 하나씩 적어 봐도 돼요. 4명 중 대표 2명은 AB, AC, AD, BC, BD, CD로 6가지예요.',
      '카드로 수를 만들 때는 0이 맨 앞자리에 올 수 없다는 것도 따져요.'
    ] },
    { title: '확률의 뜻', body: [
      '확률은 어떤 사건이 일어날 가능성을 수로 나타낸 것이에요. 모든 경우가 똑같이 일어날 수 있을 때 이렇게 구해요.',
      { ex: [['\\dfrac{(\\text{그 사건이 일어나는 경우의 수})}{(\\text{모든 경우의 수})}', '확률'], ['\\dfrac{3}{6} = \\dfrac{1}{2}', '주사위 한 개에서 짝수의 눈이 나올 확률'], ['\\dfrac{2}{36} = \\dfrac{1}{18}', '주사위 두 개의 눈의 합이 3일 확률']] },
      '제비 10개 가운데 당첨 제비가 3개이면 당첨될 확률은 10개 중 3개만큼이에요. 분모는 「전체」, 분자는 「바라는 것」이에요.',
      '주사위 두 개의 눈의 합은 2부터 12까지 11가지이지만, 11가지가 똑같이 잘 나오지는 않아요. 그래서 가능성이 같은 36가지 순서쌍으로 세어야 해요.'
    ] },
    { title: '확률의 성질', body: [
      '확률은 0부터 1까지의 수예요. 절대 일어나지 않는 사건의 확률은 0이고, 반드시 일어나는 사건의 확률은 1이에요.',
      { ex: [['0', '주사위 한 개에서 7의 눈이 나올 확률'], ['1', '주사위 한 개에서 6 이하의 눈이 나올 확률'], ['1 - \\dfrac{3}{10} = \\dfrac{7}{10}', '당첨 확률이 10분의 3일 때 당첨되지 않을 확률']] },
      '어떤 사건은 일어나거나 일어나지 않거나 둘 중 하나예요. 그래서 일어나지 않을 확률은 1에서 일어날 확률을 뺀 것이에요.',
      '「적어도 하나」를 물으면 반대쪽인 「하나도 없다」의 확률을 구해서 1에서 빼요. 동전 두 개에서 적어도 한 개가 앞면일 확률은 모두 뒷면일 확률을 1에서 뺀 것이에요.',
      { ex: [['1 - \\dfrac{1}{4} = \\dfrac{3}{4}', '동전 두 개에서 적어도 한 개가 앞면일 확률'], ['0 \\le (\\text{확률}) \\le 1', '확률의 범위']] }
    ] }
  ]);
})();
