/* B10 유리수와 순환소수 — 유한소수가 되는 조건, 순환소수를 분수로
   유형(쉬운 것부터): B10.finite 유한소수 판별(보기 고르기) · B10.make 유한소수가 되게 하는 수(키패드) · B10.cycle 순환마디와 자리의 숫자(키패드)
                     · B10.dots 순환소수의 표현(보기 고르기) · B10.tofrac 순환소수를 분수로(분수 칸)
   순환소수는 { w: 정수 부분, pre: 되풀이되지 않는 숫자들(글자), rep: 순환마디(글자) } 로 다룬다. 0.1666… → { w: 0, pre: '1', rep: '6' }
   소수점 계산은 쓰지 않는다. 분수를 소수로 고칠 때는 정수 나눗셈(나머지가 되풀이될 때까지)으로 숫자를 하나씩 구한다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, gcd = MH.gcd, pow10 = MH.pow10, F = MH.F, order4 = MH.alg.order4;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  /** 수 뒤에 붙일 조사만: pj(3, '을/를') → '을' */
  var pj = function (n, pair) { var w = String(Math.abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var rept = function (s, n) { var out = ''; while (n-- > 0) out += s; return out; };
  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };

  /* ── 소인수분해 ── */
  var pf = function (n) { var out = [], p = 2, e; while (n > 1) { e = 0; while (n % p === 0) { n /= p; e++; } if (e) out.push([p, e]); p++; } return out; };
  var fac = function (n) { return pf(n).map(function (x) { return x[1] > 1 ? x[0] + '^{' + x[1] + '}' : String(x[0]); }).join(' \\times '); };
  /** 소인수분해한 식 뒤의 조사: 끝이 거듭제곱이면 '제곱' 으로 읽는다 */
  var facJ = function (n, pair) { var last = pf(n).pop(); return last[1] > 1 ? josa('곱', pair).slice(1) : pj(last[0], pair); };
  var isPrime = function (n) { var f = pf(n); return f.length === 1 && f[0][1] === 1; };
  /** 2 와 5 를 뺀 나머지 부분: 60 → 3 */
  var rest = function (n) { while (n % 2 === 0) n /= 2; while (n % 5 === 0) n /= 5; return n; };
  var finite = function (n, d) { return rest(d / gcd(n, d)) === 1; };
  var others = function (d) { return pf(rest(d)).map(function (x) { return x[0]; }); };

  /* ── 순환소수 ── */
  /** 분수 n/d 를 정수 나눗셈으로 소수로 고친다: { w, pre, rep } (유한소수이면 rep 가 '') */
  var expand = function (n, d) {
    var w = Math.floor(n / d), r = n % d, seen = {}, digits = '', at = 0;
    while (r !== 0 && seen[r] === undefined) { seen[r] = at++; r *= 10; digits += Math.floor(r / d); r %= d; }
    return r === 0 ? { w: w, pre: digits, rep: '' } : { w: w, pre: digits.slice(0, seen[r]), rep: digits.slice(seen[r]) };
  };
  /** 점을 찍어 쓴 꼴: 0.1\dot{2}3\dot{4} */
  var dots = function (w, pre, rep) {
    return w + '.' + pre + (rep.length === 1 ? '\\dot{' + rep + '}' : '\\dot{' + rep.charAt(0) + '}' + rep.slice(1, -1) + '\\dot{' + rep.charAt(rep.length - 1) + '}');
  };
  /** 길게 늘여 쓴 꼴: 0.1232323⋯ */
  var longer = function (w, pre, rep) { return w + '.' + pre + rept(rep, rep.length === 1 ? 5 : 3) + '\\cdots'; };
  /** 순환마디가 더 짧은 토막의 되풀이가 아니다('2727' 은 안 된다) */
  var prim = function (rep) { for (var k = 1; k < rep.length; k++) if (rep.length % k === 0 && rept(rep.slice(0, k), rep.length / k) === rep) return false; return true; };
  /** 쓴 꼴이 하나뿐인 순환소수인가: 순환마디가 가장 짧고, 되풀이가 처음 시작되는 자리부터 잡았다. 0.999… 꼴은 뺀다 */
  var proper = function (pre, rep) { return rep.length >= 1 && prim(rep) && rep !== '0' && rep !== '9' && (pre === '' || pre.charAt(pre.length - 1) !== rep.charAt(rep.length - 1)); };
  var digs = function (r, len, first) { var s = ''; for (var i = 0; i < len; i++) s += r.int(i === 0 && first ? 1 : 0, 9); return s; };
  /** d 와 서로소인 분자(1 ~ d − 1, 너무 크지 않게 max 까지) */
  var cop = function (r, d, max) { var n; do { n = r.int(1, Math.min(d - 1, max || d)); } while (gcd(n, d) !== 1); return n; };

  /* ── 보기 고르기 유형의 공통 틀 ──
     o = { id, title, levels, ids: [실수 id …], build: (q) → 문제 | null }
     문제 = { text, tex, ans, wrong: [[보기, 실수 id, 설명] × 3], hints, steps, check(직접 확인) }. 보기 순서는 v.q.o 로 섞는다 */
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var list = all(P(v)); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) {
      var p = P(v), list;
      if (!p || p.check !== true || p.wrong.length !== 3) return false;
      list = all(p);
      return list.every(function (t, i) { return list.indexOf(t) === i; });
    };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B10', version: 1, title: o.title,
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
  /** 후보 [[보기, id, 설명] …] 를 from 번째부터 돌아가며, 정답과 다르고 서로 다른 것 셋 */
  var pick3 = function (ans, cands, from) {
    var out = [], list = cands.filter(Boolean), i, c;
    for (i = 0; i < list.length && out.length < 3; i++) {
      c = list[(i + (from || 0)) % list.length];
      if (c[0] !== ans && out.every(function (w) { return w[0] !== c[0]; })) out.push(c);
    }
    return out;
  };

  /* ── 답이 수 하나인 유형의 공통 틀 ──
     o = { id, title, kind: 'int' | 'fraction', levels, build: (q) → 문제 | null, mistakes: [[실수 id, (문제) → 설명] …] }
     문제 = { text, tex, ans: 수 | { n, d }, hints, steps, wrong: { 실수 id: 수 | { n, d } }, check } */
  var numQ = function (o) {
    var lastQ = null, lastP = null, isFrac = o.kind === 'fraction';
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var same = function (a, b) { return isFrac ? a.n * b.d === b.n * a.d : a === b; };
    /* 힌트에 나온 수가 문제에 없는데 우연히 답과 같으면 답을 알려 주는 셈이다 */
    var leak = function (p) {
      if (isFrac || p.ans <= 19) return false;
      var a = String(p.ans);
      return nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0;
    };
    o.levels.forEach(function (lv) {
      lv.where = function (v) { var p = P(v); return !!p && p.check === true && (isFrac ? p.ans.n > 0 && gcd(p.ans.n, p.ans.d) === 1 : Number.isInteger(p.ans) && p.ans >= 0) && !leak(p); };
    });
    MH.defineType({
      id: o.id, unit: 'B10', version: 1, title: o.title,
      answer: isFrac ? { kind: 'fraction' } : { kind: 'int', common: false },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; return out; },
      solve: function (v) { var a = P(v).ans; return isFrac ? { n: a.n, d: a.d } : a; },
      verify: function (v, ans) { var p = P(v); return p.check === true && same(ans, p.ans) && (!isFrac || gcd(ans.n, ans.d) === 1); },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: isFrac ? { n: p.ans.n, d: p.ans.d } : p.ans }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), r = p.wrong[m[0]];
            if (r === null || r === undefined || same(r, p.ans)) return null;
            if (isFrac ? !(r.n > 0 && r.d >= 1) : !(Number.isInteger(r) && r >= 0)) return null;
            return isFrac ? { n: r.n, d: r.d } : r;
          },
          explain: function (v) { return m[1](P(v)); } };
      })
    });
  };

  /* ── B10.finite 유한소수 판별 (보기 고르기) ────────────
     q.items = [[분자, 분모, 종류] × 4], 첫째가 정답. q.want: 'fin' 유한소수를 찾는다 · 'inf' 순환소수를 찾는다 */
  var FIN_D = [2, 4, 5, 8, 10, 16, 20, 25, 40, 50], WITH2 = [6, 12, 14, 18, 22, 24, 28, 36], WITH5 = [15, 35, 45, 55, 75], NONE = [3, 7, 9, 11, 13, 21, 27, 33];
  /** 분수 하나를 살펴본 말: 약분 → 분모의 소인수 → 유한소수 · 순환소수 */
  var analyse = function (n, d) {
    var g = gcd(n, d), n0 = n / g, d0 = d / g, e = expand(n0, d0), bad = others(d0);
    return (g > 1 ? '약분하면 $' + frac(n0, d0) + '$' + pj(n0, '이에요/예요') + '. ' : '')
      + (isPrime(d0) ? '분모 ' + d0 + '의 소인수는 ' + d0 + '뿐이에요. ' : '분모를 소인수분해하면 $' + d0 + ' = ' + fac(d0) + '$' + facJ(d0, '이에요/예요') + '. ')
      + (bad.length ? '2도 5도 아닌 소인수 ' + bad[0] + josa(String(bad[0]), '이/가').slice(String(bad[0]).length) + ' 있어서 순환소수가 돼요.' : '소인수가 2나 5뿐이라 유한소수가 돼요. 실제로 나누어 보면 $' + e.w + '.' + e.pre + '$' + pj(Number(e.pre.slice(-1)), '이에요/예요') + '.');
  };
  var WHY = {
    'with-2': '분모에 2가 들어 있다고 해서 유한소수가 되는 것은 아니에요. ', 'with-5': '분모에 5가 들어 있다고 해서 유한소수가 되는 것은 아니에요. ',
    'no-2-5': '이 분수는 유한소수로 나타낼 수 없어요. ', pow2: '이 분수는 유한소수예요. ', 'two-five': '이 분수는 유한소수예요. ', cancels: '약분하기 전의 분모만 보고 판단했어요. '
  };
  var FIN_INTRO = '분수를 소수로 고치면 두 가지 가운데 하나가 돼요. 0.25처럼 끝이 있는 유한소수이거나, 0.333…처럼 같은 숫자가 끝없이 되풀이되는 순환소수예요. 어느 쪽인지는 나눗셈을 끝까지 해 보지 않아도 분모만 보면 알 수 있어요.';
  var FIN_RULE = '소수는 분모가 10, 100, 1000인 분수예요. 그리고 10은 $2 \\times 5$예요. 그래서 분모의 소인수가 2나 5뿐이면 분모를 10, 100, 1000으로 만들 수 있고, 유한소수가 돼요. 3, 7, 11 같은 다른 소인수가 하나라도 있으면 아무리 곱해도 10, 100, 1000이 되지 않아서 순환소수가 돼요.';
  choiceQ({
    id: 'B10.finite', title: '유한소수 판별', ids: ['with-2', 'with-5', 'no-2-5', 'pow2', 'two-five', 'cancels'],
    build: function (q) {
      /* 보기 단추의 분수는 \frac(작게), 문제 · 풀이의 분수는 \dfrac(크게)로 쓴다 */
      var items = q.items, fin = q.want === 'fin', tex = function (it) { return '\\frac{' + it[0] + '}{' + it[1] + '}'; }, show = function (it) { return frac(it[0], it[1]); }, ord = q.o.map(function (i) { return items[i]; });
      var reduced = items.every(function (it) { return gcd(it[0], it[1]) === 1; });
      return { tex: ord.map(show).join(',\\quad '), text: fin ? '다음 중 유한소수로 나타낼 수 있는 분수를 고르세요.' : '다음 중 순환소수가 되는 분수(유한소수로 나타낼 수 없는 분수)를 고르세요.',
        ans: tex(items[0]), wrong: items.slice(1).map(function (it) { return [tex(it), it[2], WHY[it[2]] + analyse(it[0], it[1])]; }),
        check: finite(items[0][0], items[0][1]) === fin && items.slice(1).every(function (it) { return finite(it[0], it[1]) !== fin; }),
        hints: [FIN_INTRO,
          FIN_RULE + (reduced ? ' 보기의 분수는 모두 더 약분할 수 없는 기약분수예요.' : ' 단, 이 규칙은 기약분수에만 쓸 수 있어요. 약분이 되는 분수는 먼저 약분하고 나서 분모를 봐요.'),
          '① 보기의 분수를 하나씩 봐요. ' + (reduced ? '' : '약분이 되면 먼저 약분해요. ') + '② 분모를 소인수분해해요. 보기의 분모는 차례로 ' + ord.map(function (it) { return it[1]; }).join(', ') + pj(ord[3][1], '이에요/예요') + '. ③ 소인수에 2와 5 말고 다른 수가 있는지 확인해요. '
            + (fin ? '다른 수가 하나도 없는 분수가 유한소수예요.' : '다른 수가 남아 있는 분수가 순환소수예요.')],
        steps: ord.map(function (it) { return { say: '$' + show(it) + '$ — ' + analyse(it[0], it[1]) }; }).concat([{ say: fin ? '유한소수가 되는 분수는 하나뿐이에요.' : '순환소수가 되는 분수는 하나뿐이에요.', tex: tex(items[0]) }]) };
    },
    levels: [
      { name: '기약분수에서 고르기', vars: { q: sampler(function (r) {
          var mk = function (pool, cat) { var d = r.pick(pool); return [cop(r, d), d, cat]; };
          return { want: 'fin', items: [mk(FIN_D, 'ok'), mk(WITH2, 'with-2'), mk(WITH5, 'with-5'), mk(NONE, 'no-2-5')], o: order4(r) };
        }) } },
      { name: '약분해야 보이는 분수', vars: { q: sampler(function (r) {
          var mk = function (pool, cat, gs) { var d, g; do { d = r.pick(pool); g = r.pick(gs); } while (d * g > 90); return [cop(r, d) * g, d * g, cat]; };
          return { want: 'fin', items: [mk([2, 4, 5, 8, 10, 20, 25], 'ok', [3, 6, 7, 9]), mk(WITH2, 'with-2', [1, 2, 3, 5]), mk(WITH5, 'with-5', [1, 2, 3]), mk(NONE, 'no-2-5', [2, 4, 5, 10])], o: order4(r) };
        }) } },
      { name: '순환소수가 되는 분수 고르기', vars: { q: sampler(function (r) {
          var mk = function (pool, cat, gs) { var d, g; do { d = r.pick(pool); g = r.pick(gs); } while (d * g > 90); return [cop(r, d) * g, d * g, cat]; };
          return { want: 'inf', items: [mk(r.pick([WITH2, WITH5, NONE]), 'ok', [1, 1, 2, 3, 5]), mk([4, 8, 16], 'pow2', [1]), mk([5, 10, 20, 25, 40, 50], 'two-five', [1]), mk([2, 4, 5, 10, 20, 25], 'cancels', [3, 7, 9, 11])], o: order4(r) };
        }) } }
    ]
  });

  /* ── B10.make 유한소수가 되게 하는 수 ───────────────────
     ten   분모를 10 의 거듭제곱으로 고칠 때 곱하는 수 · mult  n/d × a 가 유한소수가 되는 가장 작은 a(기약분수) · mult2  약분이 되는 분수 */
  var MAKE_INTRO = '분수를 유한소수로 쓸 수 있는지는 분모가 정해요. 기약분수의 분모를 소인수분해했을 때 소인수가 2나 5뿐이면 유한소수가 돼요. 10이 $2 \\times 5$라서, 2와 5만 있으면 분모를 10, 100, 1000으로 만들 수 있기 때문이에요.';
  var MAKE = {
    ten: function (q) {
      var a = q.a, b = q.b, d = Math.pow(2, a) * Math.pow(5, b), n = q.n, need = a > b ? 5 : 2, cnt = Math.abs(a - b), m = Math.pow(need, cnt), T = Math.max(a, b), isTen = function (x) { while (x % 10 === 0) x /= 10; return x === 1; }, k, least = 0;
      for (k = 1; k <= 1000 && !least; k++) if (isTen(d * k)) least = k;
      return { tex: frac(n, d), text: '이 분수의 분모를 10의 거듭제곱(10, 100, 1000 …)으로 고치려고 해요. 분자와 분모에 똑같이 곱해야 하는 가장 작은 자연수를 구하세요.', ans: m, check: least === m && gcd(n, d) === 1,
        wrong: { 'other-prime': Math.pow(need === 5 ? 2 : 5, cnt), 'new-den': pow10(T), 'new-num': n * m },
        hints: ['소수는 분모가 10, 100, 1000인 분수를 다르게 쓴 것이에요. 분모가 10이면 소수 한 자리, 100이면 소수 두 자리 수가 돼요. 그래서 분모를 10의 거듭제곱으로 바꿀 수만 있으면 유한소수로 쓸 수 있어요.',
          '10은 $2 \\times 5$예요. 10을 여러 번 곱한 수에는 2와 5가 똑같은 개수만큼 짝을 지어 들어 있어요. 분모 ' + d + josa(String(d), '을/를').slice(String(d).length) + ' 소인수분해하면 $' + fac(d) + '$' + facJ(d, '이에요/예요') + '. 여기에 ' + (a ? '2는 ' + a + '개' : '2는 하나도 없고') + ', ' + (b ? '5는 ' + b + '개 있어요' : '5는 하나도 없어요') + '. 짝이 맞지 않아요.',
          '① 2와 5 가운데 개수가 모자란 쪽을 찾아요. ② 모자란 개수만큼 그 수를 곱해서 2와 5의 개수를 똑같이 맞춰요. 한 개 모자라면 한 번, 두 개 모자라면 두 번 곱해요. ③ 분모에만 곱하면 분수의 크기가 달라지니, 분자에도 똑같은 수를 곱해요. 문제가 묻는 것은 바뀐 분모나 분자가 아니라 곱한 수예요.'],
        steps: [{ say: '분모를 소인수분해해요.', tex: d + ' = ' + fac(d) }, { say: '2와 5의 개수를 ' + T + '개씩으로 맞추려면 ' + need + josa(String(need), '을/를').slice(1) + ' ' + cnt + '번 곱해야 해요.', tex: frac(n, d) + ' = ' + frac(n + ' \\times ' + m, d + ' \\times ' + m) + ' = ' + frac(n * m, pow10(T)) },
          { say: '분자와 분모에 곱한 수예요.', tex: cnt > 1 ? need + '^{' + cnt + '} = ' + m : String(m) }] };
    },
    mult: function (q) {
      var n = q.n, d = q.s * q.m, g = gcd(n, d), n0 = n / g, d0 = d / g, m = rest(d0), k, least = 0, part = pf(m);
      if (m < 2 || n >= d || (q.reduce ? g < 2 : g !== 1)) return null;
      for (k = 1; k <= d && !least; k++) if (finite(n * k, d)) least = k;
      var prod = part.length === 1 && part[0][1] === 1 ? String(m) : fac(m) + ' = ' + m;
      return { tex: frac(n, d) + ' \\times a', text: '이 수가 유한소수가 되게 하는 가장 작은 자연수 $a$의 값을 구하세요.', ans: m, check: least === m,
        wrong: { 'whole-den': d, 'part-only': part.length > 1 || part[0][1] > 1 ? part[0][0] : null, 'two-five': d0 / m > 1 ? d0 / m : null, 'no-reduce': g > 1 ? rest(d) : null, cancelled: g > 1 ? g : null },
        hints: [MAKE_INTRO,
          g > 1 ? '이 분수는 아직 기약분수가 아니에요. 분자 ' + n + josa(String(n), '과/와').slice(String(n).length) + ' 분모 ' + d + josa(String(d), '을/를').slice(String(d).length) + ' 함께 나눌 수 있는 수가 있어요. 약분하면 분모의 소인수 일부가 벌써 사라지니, 꼭 약분부터 해요. 약분하면 $' + frac(n0, d0) + '$' + pj(n0, '이/가') + ' 돼요.'
            : '분모 ' + d + josa(String(d), '을/를').slice(String(d).length) + ' 소인수분해하면 $' + fac(d) + '$' + facJ(d, '이에요/예요') + '. 이 가운데 2와 5는 그대로 두어도 괜찮아요. 문제가 되는 것은 2도 5도 아닌 소인수예요. 이것이 분모에 남아 있으면 순환소수가 돼요.',
          (g > 1 ? '약분한 분모 ' + d0 + josa(String(d0), '을/를').slice(String(d0).length) + ' 소인수분해하면 $' + fac(d0) + '$' + facJ(d0, '이에요/예요') + '. ' : '')
            + '① 분모에서 2와 5가 아닌 소인수를 모두 찾아요. 같은 수가 두 번 곱해져 있으면 두 번 다 세요. ② $a$를 곱해서 그 소인수들을 약분으로 없애요. 초대하지 않은 손님만 내보내면 되니, 없애야 할 수들만 곱한 것이 가장 작은 $a$예요. 분모 전체를 없앨 필요는 없어요.'],
        steps: (g > 1 ? [{ say: '먼저 약분해서 기약분수로 만들어요.', tex: frac(n, d) + ' = ' + frac(n0, d0) }] : []).concat([
          { say: '분모를 소인수분해해요.', tex: d0 + ' = ' + fac(d0) },
          { say: '2와 5가 아닌 소인수를 $a$로 약분해서 없애면 분모에 2와 5만 남아요.', tex: frac(n0, d0) + ' \\times ' + m + ' = ' + frac(n0, d0 / m) },
          { say: '없애야 할 소인수만 곱한 수가 가장 작은 $a$예요.', tex: 'a = ' + prod }]) };
    }
  };
  var TENS = [[1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [2, 1], [3, 1], [3, 2], [1, 2], [1, 3], [4, 1], [4, 2]];
  numQ({
    id: 'B10.make', title: '유한소수가 되게 하는 수', kind: 'int',
    build: function (q) { return q.k === 'ten' ? MAKE.ten(q) : MAKE.mult(q); },
    levels: [
      { name: '분모를 10의 거듭제곱으로', minDistinct: 150, vars: { q: sampler(function (r) { var e = r.pick(TENS), d = Math.pow(2, e[0]) * Math.pow(5, e[1]); return { k: 'ten', a: e[0], b: e[1], n: cop(r, d, 40) }; }) } },
      { name: '곱해서 유한소수 만들기', vars: { q: sampler(function (r) { var s = r.pick([2, 4, 5, 8, 10, 20, 25, 40, 50]), m = r.pick([3, 3, 7, 9, 11, 13, 21]); return { k: 'mult', s: s, m: m, n: cop(r, s * m, 30) }; }) } },
      { name: '약분이 되는 분수', vars: { q: sampler(function (r) {
          var s = r.pick([2, 4, 5, 8, 10, 20, 25, 40]), c = r.pick([[9, 3], [21, 3], [21, 7], [27, 3], [27, 9], [33, 3], [33, 11], [63, 3], [63, 7], [63, 9], [39, 3], [39, 13], [49, 7]]), d = s * c[0];
          return { k: 'mult', reduce: true, s: s, m: c[0], n: c[1] * cop(r, d / c[1], 12) };
        }) } }
    ],
    mistakes: [
      ['other-prime', function () { return '곱할 수를 반대로 골랐어요. 분모에서 개수가 모자란 쪽을 채워야 해요. 2가 더 많으면 5를, 5가 더 많으면 2를 곱해서 개수를 맞춰요.'; }],
      ['new-den', function () { return '바뀐 분모를 답했어요. 문제가 묻는 것은 분모가 10의 거듭제곱이 되도록 분자와 분모에 곱한 수예요.'; }],
      ['new-num', function () { return '바뀐 분자를 답했어요. 문제가 묻는 것은 분자와 분모에 똑같이 곱한 수예요.'; }],
      ['whole-den', function () { return '분모 전체를 곱했어요. 그러면 유한소수가 되기는 하지만 가장 작은 수가 아니에요. 2와 5는 분모에 남아 있어도 괜찮으니, 2도 5도 아닌 소인수만 없애면 돼요.'; }],
      ['part-only', function () { return '없애야 할 소인수를 일부만 곱했어요. 2도 5도 아닌 소인수가 분모에 하나라도 남으면 순환소수가 돼요. 같은 수가 두 번 곱해져 있으면 두 번 다 없애야 해요.'; }],
      ['two-five', function () { return '2와 5로 이루어진 부분을 답했어요. 2와 5는 분모에 있어도 괜찮아요. 없애야 하는 것은 2도 5도 아닌 소인수예요.'; }],
      ['no-reduce', function () { return '약분하지 않고 구했어요. 분자와 약분되는 소인수는 벌써 사라지니 다시 곱할 필요가 없어요. 먼저 기약분수로 만들고 나서 분모를 봐요.'; }],
      ['cancelled', function () { return '분자와 약분되어 사라지는 수를 답했어요. 그 수는 약분하면 없어져요. 약분한 뒤에도 분모에 남아 있는, 2도 5도 아닌 소인수를 곱해요.'; }]
    ]
  });

  /* ── B10.cycle 순환마디와 자리의 숫자 ───────────────────
     unit  순환마디 구하기 · nth  소수점 아래 n 번째 자리의 숫자 */
  var CYCLE = {
    unit: function (q) {
      var w = q.w, pre = q.pre, rep = q.rep, L = rep.length;
      if (!proper(pre, rep) || rep.charAt(0) === '0') return null;
      return { tex: longer(w, pre, rep), text: '이 순환소수의 순환마디를 구하세요.', ans: Number(rep), check: String(Number(rep)) === rep,
        wrong: { twice: Number(rep + rep), 'with-pre': pre ? Number(pre + rep) : null, shifted: L >= 2 && rep.charAt(1) !== '0' ? Number(rep.slice(1) + rep.charAt(0)) : null,
          'with-whole': w > 0 && !pre ? Number(w + rep) : null, 'first-only': L >= 2 ? Number(rep.charAt(0)) : null },
        hints: ['순환소수는 소수점 아래에서 같은 숫자들이 똑같은 순서로 끝없이 되풀이되는 소수예요. 노래의 후렴처럼 똑같이 되풀이되는 한 토막을 순환마디라고 해요. 순환마디는 되풀이되는 부분 가운데 가장 짧은 한 토막이에요.',
          '① 소수점 아래의 숫자만 봐요. 소수점 앞의 정수 부분은 순환마디에 넣지 않아요. ② 소수점 바로 뒤부터 숫자를 하나씩 읽으면서, 어디서부터 같은 숫자들이 다시 나오는지 찾아요.' + (pre ? ' 이 수는 소수점 바로 뒤의 숫자 ' + pre.length + '개가 되풀이되지 않아요. 되풀이는 그 뒤에서 시작해요.' : ' 이 수는 소수점 바로 뒤부터 되풀이가 시작돼요.'),
          '③ 되풀이되는 한 토막의 숫자가 몇 개인지 세어요. 이 수는 숫자 ' + L + '개가 한 토막이에요. ④ 그 토막을 처음 나오는 순서 그대로 써요. 같은 토막을 두 번 이어 쓰거나, 토막의 중간에서 시작하면 안 돼요.'],
        steps: [{ say: '소수점 아래를 되풀이되는 토막으로 끊어 봐요.' + (pre ? ' 앞의 ' + pre + josa(pre, '은/는').slice(pre.length) + ' 되풀이되지 않아요.' : ''), tex: w + '.' + pre + '\\,|\\,' + rep + '\\,|\\,' + rep + '\\,|\\,' + rep + '\\,|\\cdots' },
          { say: '되풀이되는 가장 짧은 토막이 순환마디예요.', tex: rep }] };
    },
    nth: function (q) {
      var w = q.w, pre = q.pre, rep = q.rep, n = q.n, L = rep.length, k = pre.length, m = n - k, r = m % L, quo = (m - r) / L, s = pre, ans = Number(rep.charAt((m - 1) % L));
      if (!proper(pre, rep) || L < 2 || m <= L) return null;
      while (s.length < n) s += rep;
      return { tex: dots(w, pre, rep), text: '이 순환소수의 소수점 아래 ' + n + '번째 자리의 숫자를 구하세요.', ans: ans, check: Number(s.charAt(n - 1)) === ans,
        wrong: { remainder: r, 'off-one': Number(rep.charAt(m % L)), 'ignore-pre': k ? Number(rep.charAt((n - 1) % L)) : null, 'zero-first': r === 0 ? Number(rep.charAt(0)) : null },
        hints: ['순환소수는 순환마디가 끝없이 되풀이돼요. 달력의 요일이 7일마다 되돌아오는 것처럼, 숫자도 순환마디의 길이마다 처음으로 되돌아와요. 그래서 숫자를 ' + n + '개나 직접 쓰지 않아도, 나눗셈의 나머지만 알면 답을 찾을 수 있어요.',
          '① 점이 찍힌 곳을 보고 순환마디를 찾아요. 점이 두 개이면 두 점 사이의 숫자가 모두 순환마디예요. 이 수의 순환마디는 숫자 ' + L + '개예요. '
            + (k ? '② 소수점 바로 뒤의 숫자 ' + k + '개는 되풀이되지 않아요. 그러니 이 숫자들을 먼저 빼요. ' + n + '번째 자리는 되풀이되는 부분에서 세면 $' + n + ' - ' + k + '$번째예요.' : '② 이 수는 소수점 바로 뒤부터 되풀이되니 ' + n + '번째를 그대로 써요.'),
          '③ $' + m + ' \\div ' + L + '$의 나머지를 구해요. 나머지가 1이면 순환마디의 첫째 숫자, 2이면 둘째 숫자예요. 나머지가 0이면 딱 나누어떨어진 것이니 순환마디의 마지막 숫자예요. ④ 나머지 자체가 답이 아니에요. 순환마디에서 그 차례에 있는 숫자가 답이에요.'],
        steps: [{ say: '순환마디는 숫자 ' + L + '개예요.', tex: rep }].concat(k ? [{ say: '되풀이되지 않는 숫자 ' + k + '개를 빼요.', tex: n + ' - ' + k + ' = ' + m }] : []).concat([
          { say: '순환마디의 길이로 나눠 나머지를 구해요.', tex: m + ' \\div ' + L + ' = ' + quo + ' \\cdots ' + r },
          { say: r ? '나머지가 ' + r + josa(String(r), '이니/니').slice(1) + ' 순환마디의 ' + ['', '첫째', '둘째', '셋째', '넷째', '다섯째'][r] + ' 숫자예요.' : '나누어떨어지니 순환마디의 마지막 숫자예요.', tex: String(ans) }]) };
    }
  };
  numQ({
    id: 'B10.cycle', title: '순환마디와 자리의 숫자', kind: 'int',
    build: function (q) { return CYCLE[q.k](q); },
    levels: [
      { name: '순환마디 찾기', vars: { q: sampler(function (r) { var mixed = r.int(0, 2) === 0; return { k: 'unit', w: r.int(0, 3), pre: mixed ? digs(r, r.int(1, 2)) : '', rep: digs(r, r.pick([1, 2, 2, 3]), true) }; }) } },
      { name: '소수점 아래 n번째 자리의 숫자', vars: { q: sampler(function (r) { return { k: 'nth', w: r.int(0, 2), pre: '', rep: digs(r, r.pick([2, 3, 3, 4, 6])), n: r.int(15, 100) }; }) } },
      { name: '되풀이되지 않는 숫자가 있을 때', vars: { q: sampler(function (r) { return { k: 'nth', w: r.int(0, 2), pre: digs(r, r.int(1, 2)), rep: digs(r, r.pick([2, 3, 3, 4])), n: r.int(15, 100) }; }) } }
    ],
    mistakes: [
      ['twice', function () { return '순환마디를 두 번 이어 썼어요. 순환마디는 되풀이되는 부분 가운데 가장 짧은 한 토막이에요.'; }],
      ['with-pre', function () { return '되풀이되지 않는 앞의 숫자까지 넣었어요. 순환마디는 똑같이 되풀이되는 부분만이에요. 소수점 바로 뒤의 숫자가 다시 나오는지 확인해 보세요.'; }],
      ['shifted', function () { return '순환마디를 한 칸 늦게 잡았어요. 숫자는 맞지만 순서가 달라요. 되풀이가 처음 시작되는 자리부터 읽어요.'; }],
      ['with-whole', function () { return '소수점 앞의 정수 부분까지 넣었어요. 순환마디는 소수점 아래에서 되풀이되는 부분이에요.'; }],
      ['first-only', function () { return '순환마디의 첫 숫자만 썼어요. 되풀이되는 한 토막의 숫자를 모두 써야 해요.'; }],
      ['remainder', function () { return '나눗셈의 나머지를 그대로 답했어요. 나머지는 순환마디에서 몇 번째 숫자인지를 알려 줄 뿐이에요. 그 차례에 있는 숫자가 답이에요.'; }],
      ['off-one', function () { return '한 칸 뒤의 숫자를 골랐어요. 나머지가 1이면 순환마디의 첫째 숫자, 2이면 둘째 숫자예요. 나머지가 0이면 마지막 숫자예요.'; }],
      ['ignore-pre', function () { return '되풀이되지 않는 앞의 숫자를 빼지 않았어요. 그 숫자들은 순환마디가 아니에요. 자리의 번호에서 그 개수만큼 먼저 빼고 나서 나눠요.'; }],
      ['zero-first', function () { return '나머지가 0일 때 첫째 숫자를 골랐어요. 나누어떨어졌다는 것은 순환마디가 딱 끝나는 자리라는 뜻이에요. 그래서 순환마디의 마지막 숫자예요.'; }]
    ]
  });

  /* ── B10.dots 순환소수의 표현 (보기 고르기) ─────────────
     write  길게 쓴 순환소수를 점을 찍어 쓰기 · conv  분수를 순환소수로 */
  var DOT_INTRO = '순환소수는 끝없이 이어져서 다 쓸 수 없어요. 그래서 되풀이되는 한 토막(순환마디)을 한 번만 쓰고, 그 위에 점을 찍어 "여기가 끝없이 되풀이돼요"라고 표시해요. 악보의 도돌이표와 같아요.';
  var DOTS = {
    write: function (q) {
      var w = q.w, pre = q.pre, rep = q.rep, L = rep.length, ans = dots(w, pre, rep), all = rep.split('').map(function (c) { return '\\dot{' + c + '}'; }).join('');
      if (!proper(pre, rep)) return null;
      return { tex: longer(w, pre, rep), text: '이 순환소수를 순환마디에 점을 찍어 간단히 나타낸 것을 고르세요.', ans: ans, check: true,
        wrong: pick3(ans, [
          [w + '.' + pre + rep, 'no-dot', '점을 찍지 않았어요. 점이 없으면 거기서 끝나는 유한소수예요. 되풀이되는 부분에 점을 찍어야 순환소수가 돼요.'],
          L >= 2 ? [w + '.' + pre + '\\dot{' + rep.charAt(0) + '}' + rep.slice(1), 'first-only', '순환마디의 첫 숫자에만 점을 찍었어요. 순환마디가 숫자 둘 이상이면 처음 숫자와 끝 숫자, 두 곳에 점을 찍어요.'] : null,
          L >= 3 ? [w + '.' + pre + all, 'all-dots', '순환마디의 모든 숫자에 점을 찍었어요. 점은 순환마디의 처음 숫자와 끝 숫자에만 찍어요.'] : null,
          [dots(w, pre, rep + rep), 'twice', '순환마디를 두 번 이어 썼어요. 순환마디는 되풀이되는 가장 짧은 한 토막이에요. 한 번만 써요.'],
          [dots(w, pre + rep.charAt(0), rep.slice(1) + rep.charAt(0)), 'shifted', '순환마디를 한 칸 늦게 잡았어요. 되풀이가 처음 시작되는 자리부터 순환마디로 잡아요.'],
          pre ? [dots(w, '', pre + rep), 'with-pre', '되풀이되지 않는 숫자까지 순환마디에 넣었어요. 이렇게 쓰면 그 숫자도 함께 되풀이된다는 뜻이 돼요. 되풀이되지 않는 숫자에는 점을 찍지 않아요.'] : null], q.c),
        hints: [DOT_INTRO,
          '① 먼저 순환마디를 찾아요. 소수점 아래를 왼쪽부터 읽으면서 같은 숫자들이 다시 나오는 곳을 찾아요. ' + (pre ? '이 수는 소수점 바로 뒤의 숫자 ' + pre.length + '개가 되풀이되지 않고, 그 뒤부터 숫자 ' + L + '개가 되풀이돼요.' : '이 수는 소수점 바로 뒤부터 숫자 ' + L + '개가 되풀이돼요.') + ' 순환마디는 가장 짧은 한 토막이에요.',
          '② 순환마디를 한 번만 써요. ③ 순환마디가 숫자 하나이면 그 숫자 위에 점을 하나 찍어요. 숫자가 둘 이상이면 처음 숫자와 끝 숫자 위에만 점을 찍어요. 가운데 숫자에는 찍지 않아요. ④ 되풀이되지 않는 숫자와 정수 부분은 점 없이 그대로 써요.'],
        steps: [{ say: '소수점 아래를 되풀이되는 토막으로 끊어 순환마디를 찾아요.', tex: w + '.' + pre + '\\,|\\,' + rep + '\\,|\\,' + rep + '\\,|\\,' + rep + '\\,|\\cdots' },
          { say: L === 1 ? '순환마디가 숫자 하나이니 그 위에 점을 하나 찍어요.' : '순환마디의 처음 숫자와 끝 숫자 위에 점을 찍어요.', tex: ans }] };
    },
    conv: function (q) {
      var n = q.n, d = q.d, e = expand(n, d), w = e.w, pre = e.pre, rep = e.rep, L = rep.length, ans, rev = rep.split('').reverse().join('');
      if (gcd(n, d) !== 1 || !rep || !proper(pre, rep)) return null;
      ans = dots(w, pre, rep);
      return { tex: frac(n, d), text: '이 분수를 소수로 나타낸 것을 고르세요.', ans: ans, check: F(w).add(F(Number(pre || 0), pow10(pre.length))).add(F(Number(rep), (pow10(L) - 1) * pow10(pre.length))).equals(F(n, d)),
        wrong: pick3(ans, [
          [w + '.' + pre + rep, 'no-dot', '나눗셈을 중간에서 멈췄어요. 이 나눗셈은 나머지가 0이 되지 않고 같은 나머지가 다시 나와요. 그래서 몫이 끝없이 되풀이돼요. 되풀이되는 부분에 점을 찍어야 해요.'],
          pre ? [dots(w, '', pre + rep), 'with-pre', '되풀이되지 않는 숫자까지 순환마디에 넣었어요. 나눗셈을 더 해 보면 소수점 바로 뒤의 숫자는 다시 나오지 않아요. 되풀이되는 숫자에만 점을 찍어요.'] : null,
          pre ? [dots(w, '', rep), 'pre-dropped', '소수점 바로 뒤의, 되풀이되지 않는 숫자를 빠뜨렸어요. 그 숫자도 몫의 일부이니 그대로 써야 해요.'] : null,
          L >= 2 ? [dots(w, pre + rep.slice(0, -1), rep.slice(-1)), 'last-only', '마지막 숫자 하나만 되풀이된다고 봤어요. 나눗셈을 더 해 보면 숫자 ' + L + '개가 함께 되풀이돼요.'] : null,
          L >= 2 && rev !== rep ? [dots(w, pre, rev), 'reversed', '순환마디의 숫자 순서가 바뀌었어요. 나눗셈에서 몫이 나온 순서 그대로 써요.'] : null], q.c),
        hints: ['분수는 나눗셈이에요. $' + frac(n, d) + '$' + pj(n, '은/는') + ' $' + n + ' \\div ' + d + '$' + pj(d, '이에요/예요') + '. 세로셈으로 나누면서 0을 내려 가며 소수점 아래의 몫을 하나씩 구해요. 나머지가 0이 되면 유한소수이고, 0이 되지 않으면 순환소수예요.',
          '나눗셈을 하다가 전에 나왔던 나머지가 다시 나오면, 그 뒤의 계산은 앞과 똑같이 되풀이돼요. 같은 길을 다시 걷는 것과 같아요. 그래서 몫의 숫자도 그때부터 되풀이돼요. 나머지를 옆에 적어 가면서 같은 나머지가 나올 때까지 나눠요.',
          '① 같은 나머지가 다시 나올 때까지 몫을 구해요. 이 나눗셈은 소수점 아래 ' + (pre.length + L + 1) + '자리쯤까지 구하면 되풀이가 보여요. ② 되풀이되는 숫자들(순환마디)과 되풀이되지 않는 숫자를 나눠요. ③ 순환마디의 처음 숫자와 끝 숫자 위에만 점을 찍어요. 숫자가 하나이면 점도 하나예요.'],
        steps: [{ say: '분자를 분모로 나눠요.', tex: n + ' \\div ' + d + ' = ' + longer(w, pre, rep) },
          { say: (pre ? '소수점 바로 뒤의 ' + pre + josa(pre, '은/는').slice(pre.length) + ' 되풀이되지 않고, ' : '') + '순환마디는 ' + rep + josa(rep, '이에요/예요').slice(rep.length) + '.', tex: w + '.' + pre + '\\,|\\,' + rep + '\\,|\\,' + rep + '\\,|\\cdots' },
          { say: '순환마디에 점을 찍어 써요.', tex: ans }] };
    }
  };
  choiceQ({
    id: 'B10.dots', title: '순환소수의 표현', build: function (q) { return DOTS[q.k](q); },
    ids: ['no-dot', 'first-only', 'all-dots', 'twice', 'shifted', 'with-pre', 'pre-dropped', 'last-only', 'reversed'],
    levels: [
      { name: '점을 찍어 나타내기', vars: { q: sampler(function (r) { return { k: 'write', w: r.int(0, 9), pre: '', rep: digs(r, r.pick([1, 2, 2, 3])), c: r.int(0, 4), o: order4(r) }; }) } },
      { name: '되풀이되지 않는 숫자가 있을 때', vars: { q: sampler(function (r) { return { k: 'write', w: r.int(0, 9), pre: digs(r, r.pick([1, 1, 2])), rep: digs(r, r.pick([1, 2, 2, 3])), c: r.int(0, 5), o: order4(r) }; }) } },
      { name: '분수를 순환소수로', minDistinct: 150, vars: { q: sampler(function (r) { var d = r.pick([6, 7, 11, 12, 15, 18, 22, 27, 30, 33, 37, 45, 55, 66, 90]); return { k: 'conv', d: d, n: cop(r, d), c: r.int(0, 4), o: order4(r) }; }) } }
    ]
  });

  /* ── B10.tofrac 순환소수를 분수로 ───────────────────────
     x = (순환소수) 로 놓고, 소수점 아래가 같은 두 수를 빼서 꼬리를 없앤다 */
  var TAIL = '순환소수는 꼬리가 끝없이 이어져서 그대로는 분수로 쓸 수 없어요. 그런데 꼬리가 똑같은 두 수를 빼면 꼬리가 한꺼번에 사라져요. 이것이 순환소수를 분수로 고치는 방법이에요.';
  var TOFRAC = function (q) {
    var w = q.w, pre = q.pre, rep = q.rep, L = rep.length, k = pre.length;
    if (!proper(pre, rep)) return null;
    var A = Number(w + pre + rep), B = Number(w + pre), num = A - B, den = (pow10(L) - 1) * pow10(k), g = gcd(num, den), big = pow10(k + L), small = pow10(k);
    var cx = function (c) { return c === 1 ? 'x' : c + 'x'; }, ex = function (int, tail) { return int + '.' + tail + rept(rep, L === 1 ? 5 : 3) + '\\cdots'; };
    var value = F(w).add(F(Number(pre || 0), small)).add(F(Number(rep), den));
    var moved = k ? '① 먼저 되풀이되지 않는 숫자 ' + k + '개를 소수점 앞으로 넘겨요. $x$에 ' + small + josa(String(small), '을/를').slice(String(small).length) + ' 곱하면 $' + cx(small) + ' = ' + ex(B, '') + '$' + '가 돼요. ② 여기서 순환마디 한 토막(숫자 ' + L + '개)만큼 소수점을 더 옮겨요. $x$에 ' + big + josa(String(big), '을/를').slice(String(big).length) + ' 곱하면 $' + cx(big) + ' = ' + ex(A, '') + '$가 돼요. 두 수는 소수점 아래가 똑같아요.'
      : '① 소수점을 순환마디 한 토막만큼 오른쪽으로 옮겨요. 순환마디가 숫자 ' + L + '개이니 $x$에 ' + big + josa(String(big), '을/를').slice(String(big).length) + ' 곱해요. 그러면 $' + cx(big) + ' = ' + ex(A, '') + '$가 돼요. ② 처음의 $x = ' + ex(w, '') + '$와 견주어 보세요. 소수점 아래가 똑같아요.';
    return { tex: dots(w, pre, rep), text: '이 순환소수를 분수로 나타내세요.' + (num > den ? ' (1보다 큰 수는 가분수로 써요.)' : ''), ans: { n: num / g, d: den / g }, check: value.equals(F(num, den)) && num > 0,
      wrong: { 'as-finite': { n: A, d: big }, 'no-subtract': B > 0 ? { n: A, d: den } : null, 'frac-only': w > 0 && !k ? { n: Number(rep), d: den } : null,
        'all-nines': k ? { n: num, d: big - 1 } : null, 'wrong-nines': !k ? { n: num, d: L === 1 ? 99 : 9 } : null, 'sub-whole': k && w > 0 ? { n: A - w, d: den } : null },
      hints: [TAIL + ' 먼저 이 순환소수를 $x$라고 놓고 길게 풀어 써요: $x = ' + ex(w, pre) + '$.',
        moved,
        '③ 큰 쪽에서 작은 쪽을 빼요. 소수점 아래가 똑같으니 모두 지워지고 정수만 남아요. 왼쪽은 $' + cx(big) + ' - ' + cx(small) + '$, 오른쪽은 $' + (B ? A + ' - ' + B : A) + '$' + pj(B || A, '이에요/예요') + '. ④ 계산해서 (수)$x$ = (수) 꼴로 만든 다음, 양쪽을 $x$ 앞의 수로 나눠요. ⑤ 약분할 수 있으면 약분해요.'],
      steps: [{ say: '순환소수를 $x$라고 놓아요.', tex: 'x = ' + ex(w, pre) }]
        .concat(k ? [{ say: '되풀이되지 않는 숫자를 소수점 앞으로 넘겨요.', tex: cx(small) + ' = ' + ex(B, '') }] : [])
        .concat([{ say: '순환마디 한 토막만큼 소수점을 더 옮겨요.', tex: cx(big) + ' = ' + ex(A, '') },
          { say: '두 식을 빼면 소수점 아래가 사라져요.', tex: cx(big) + ' - ' + cx(small) + ' = ' + (B ? A + ' - ' + B : A) },
          { say: '양쪽을 계산해요.', tex: (big - small) + 'x = ' + num },
          { say: '양쪽을 ' + den + josa(String(den), '으로/로').slice(String(den).length) + ' 나눠요.' + (g > 1 ? ' 약분도 해요.' : ''), tex: 'x = ' + frac(num, den) + (g > 1 ? ' = ' + (den / g === 1 ? num / g : frac(num / g, den / g)) : '') }]) };
  };
  numQ({
    id: 'B10.tofrac', title: '순환소수를 분수로', kind: 'fraction', build: TOFRAC,
    levels: [
      { name: '0.aaa… · 0.ababab…', minDistinct: 80, vars: { q: sampler(function (r) { return { w: 0, pre: '', rep: digs(r, r.pick([1, 2, 2, 2, 2, 2, 2])) }; }) } },
      { name: '정수 부분이 있을 때', vars: { q: sampler(function (r) { return { w: r.int(1, 9), pre: '', rep: digs(r, r.pick([1, 1, 2])) }; }) } },
      { name: '되풀이되지 않는 숫자가 있을 때', vars: { q: sampler(function (r) { var k = r.pick([1, 1, 1, 2]); return { w: r.pick([0, 0, 1, 2]), pre: digs(r, k), rep: digs(r, k === 2 ? 1 : r.pick([1, 1, 2])) }; }) } }
    ],
    mistakes: [
      ['as-finite', function () { return '유한소수처럼 분모를 10, 100, 1000으로 썼어요. 그것은 숫자가 거기서 끝날 때의 분수예요. 끝없이 되풀이되는 순환소수는 두 식을 빼서 꼬리를 없애야 하고, 그러면 분모에 9가 나와요.'; }],
      ['no-subtract', function () { return '빼는 것을 잊었어요. 두 식을 뺄 때 오른쪽도 큰 수에서 작은 수를 빼야 해요. 되풀이되지 않는 부분(정수 부분 포함)을 분자에서 빼요.'; }],
      ['frac-only', function () { return '정수 부분을 빠뜨렸어요. 소수점 아래만 분수로 고치면 정수 부분이 사라져요. $x$를 수 전체로 놓고 계산해요.'; }],
      ['all-nines', function () { return '분모를 9로만 썼어요. 되풀이되지 않는 숫자가 있으면 분모의 9 뒤에 그 개수만큼 0이 붙어요. 두 식을 빼 보면 $x$ 앞의 수가 그렇게 나와요.'; }],
      ['wrong-nines', function () { return '분모의 9의 개수가 틀렸어요. 순환마디가 숫자 하나이면 10을 곱해 빼니 분모가 9이고, 숫자 둘이면 100을 곱해 빼니 분모가 99예요.'; }],
      ['sub-whole', function () { return '정수 부분만 뺐어요. 빼는 수는 되풀이되지 않는 부분 전체예요. 정수 부분과, 소수점 아래에서 되풀이되지 않는 숫자까지 이어 쓴 수를 빼요.'; }]
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B10', [
  { title: '유한소수와 순환소수', body: [
    '분수를 소수로 고치려면 분자를 분모로 나눠요. 그러면 두 가지 가운데 하나가 돼요.',
    { ex: [['\\dfrac{1}{4} = 0.25', '유한소수 — 나눗셈이 끝나요. 소수점 아래 숫자가 몇 개뿐이에요.'], ['\\dfrac{1}{3} = 0.333\\cdots', '순환소수 — 나눗셈이 끝나지 않고 같은 숫자가 끝없이 되풀이돼요.']] },
    '나눗셈의 나머지는 분모보다 작은 수뿐이라, 계속 나누다 보면 0이 되거나 전에 나온 나머지가 다시 나와요. 같은 나머지가 나오면 그 뒤는 똑같이 되풀이돼요. 그래서 분수는 반드시 유한소수 아니면 순환소수예요.',
    '분수로 나타낼 수 있는 수를 유리수라고 해요. 유한소수와 순환소수는 모두 분수로 고칠 수 있으니 유리수예요.'
  ] },
  { title: '순환마디와 점 찍기', body: [
    '순환소수에서 똑같이 되풀이되는 가장 짧은 한 토막을 순환마디라고 해요. 노래의 후렴과 같아요.',
    { ex: [['0.333\\cdots = 0.\\dot{3}', '순환마디 3 — 숫자가 하나이면 점도 하나'], ['0.272727\\cdots = 0.\\dot{2}\\dot{7}', '순환마디 27 — 처음과 끝 숫자에 점'], ['0.1666\\cdots = 0.1\\dot{6}', '순환마디 6 — 되풀이되지 않는 1에는 점이 없어요'], ['1.234234\\cdots = 1.\\dot{2}3\\dot{4}', '순환마디 234 — 가운데 숫자에는 점이 없어요']] },
    '순환마디를 한 번만 쓰고 그 처음 숫자와 끝 숫자 위에 점을 찍어요. 악보의 도돌이표처럼 "여기가 끝없이 되풀이돼요"라는 표시예요.'
  ] },
  { title: '유한소수가 되는 분수', body: [
    '소수는 분모가 10, 100, 1000인 분수예요. 그리고 10은 $2 \\times 5$예요.',
    { tex: '\\dfrac{3}{20} = \\dfrac{3}{2^{2} \\times 5} = \\dfrac{3 \\times 5}{2^{2} \\times 5 \\times 5} = \\dfrac{15}{100} = 0.15' },
    '분모의 소인수가 2나 5뿐이면, 모자란 쪽을 곱해서 분모를 10, 100, 1000으로 만들 수 있어요. 그래서 유한소수가 돼요.',
    { list: ['분모에 3, 7, 11 같은 다른 소인수가 있으면 아무리 곱해도 10의 거듭제곱이 되지 않아요. 순환소수가 돼요.', '꼭 기약분수로 만든 다음에 분모를 봐요. $\\dfrac{3}{6}$은 분모에 3이 있지만 약분하면 $\\dfrac{1}{2}$이라 유한소수예요.'] }
  ] },
  { title: '순환소수를 분수로 — 꼬리 없애기', body: [
    '순환소수는 꼬리가 끝없이 이어져요. 꼬리가 똑같은 두 수를 빼면 꼬리가 한꺼번에 사라져요.',
    { list: ['① 순환소수를 $x$라고 놓아요: $x = 0.2727\\cdots$', '② 순환마디가 숫자 둘이니 100을 곱해요: $100x = 27.2727\\cdots$', '③ 두 식을 빼요: $100x - x = 27$, 곧 $99x = 27$', '④ 양쪽을 99로 나누고 약분해요: $x = \\dfrac{27}{99} = \\dfrac{3}{11}$'] },
    '순환마디가 숫자 하나이면 10을, 둘이면 100을, 셋이면 1000을 곱해요. 소수점을 순환마디 한 토막만큼 옮기는 거예요.'
  ] },
  { title: '되풀이되지 않는 숫자가 있을 때', body: [
    '$0.1\\dot{6}$처럼 소수점 바로 뒤에 되풀이되지 않는 숫자가 있으면, 그 숫자를 먼저 소수점 앞으로 넘겨요.',
    { list: ['① $x = 0.1666\\cdots$', '② 10을 곱해요: $10x = 1.666\\cdots$', '③ 한 번 더 옮겨요: $100x = 16.666\\cdots$', '④ 빼요: $100x - 10x = 16 - 1$, 곧 $90x = 15$', '⑤ $x = \\dfrac{15}{90} = \\dfrac{1}{6}$'] },
    '정리하면 분자는 (전체 숫자) − (되풀이되지 않는 부분)이고, 분모는 순환마디의 숫자 개수만큼 9를 쓰고 그 뒤에 되풀이되지 않는 숫자의 개수만큼 0을 붙인 수예요.',
    { tex: '0.1\\dot{6} = \\dfrac{16 - 1}{90}, \\qquad 1.\\dot{2}\\dot{7} = \\dfrac{127 - 1}{99}' }
  ] }
]);
