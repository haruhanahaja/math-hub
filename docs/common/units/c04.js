/* C04 복소수 — 허수단위 i, 복소수의 사칙연산, 켤레복소수
   유형(쉬운 것부터): C04.parts 실수부분과 허수부분 · C04.equal 복소수가 서로 같을 조건 (키패드, 부호 있는 정수)
                     · C04.addsub 덧셈과 뺄셈 · C04.mul 곱셈 · C04.conj 켤레복소수 (보기 고르기)
                     · C04.norm 켤레복소수의 합과 곱 (키패드) · C04.div 나눗셈 · C04.ipow i 의 거듭제곱 · C04.sqrtneg 음수의 제곱근 (보기 고르기)
   답이 복소수(식)이면 보기 고르기, 답이 실수 하나이면 키패드다.
   복소수는 정수 두 개의 쌍 [실수부분, 허수부분] 으로 다루고, 화면에는 늘 같은 꼴(3 + 2i, -i, 5)로 쓴다. 그래서 글이 다르면 값도 다르다.
   i 는 문자가 아니라서 MH.alg.sameVal 을 쓰지 않는다. 검산은 tests/units/c04.test.js 가 화면의 식을 따로 읽어서 한다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, order4 = MH.alg.order4, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  /** 복소수 뒤의 조사: 수로 끝나면 그 수, i 로 끝나면 받침 없는 소리("아이")를 따른다 */
  var jz = function (t, pair) { var m = /(\d+)$/.exec(t); return m ? josa(m[1], pair).slice(m[1].length) : josa('가', pair).slice(1); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  var sg = function (n) { return (n < 0 ? '- ' : '+ ') + abs(n); };
  var wo = function (r, q) { q.perm = r.shuffle([0, 1, 2, 3, 4, 5]); q.o = order4(r); return q; };

  /* ── 복소수: [실수부분, 허수부분] ── */
  var cx = function (a, b) {
    var im;
    if (b === 0) return String(a);
    im = (abs(b) === 1 ? '' : abs(b)) + 'i';
    if (a === 0) return (b < 0 ? '-' : '') + im;
    return a + (b < 0 ? ' - ' : ' + ') + im;
  };
  var tx = function (z) { return cx(z[0], z[1]); };
  var pz = function (z) { return '(' + tx(z) + ')'; };
  var add = function (z, w) { return [z[0] + w[0], z[1] + w[1]]; };
  var mul = function (z, w) { return [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]]; };
  var sc = function (z, k) { return [z[0] * k, z[1] * k]; };
  var conj = function (z) { return [z[0], -z[1]]; };
  var UNITS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  /** i 의 n 제곱 */
  var ipw = function (n) { return UNITS[((n % 4) + 4) % 4]; };
  /** 항을 차례로 이어 쓴다. 항은 [수, 붙는 글('' · 'i' · 'i^{2}')]. 0 인 항은 쓰지 않는다: 6 + 4i - 3i - 2i^{2} */
  var line = function (items) {
    var out = '';
    items.forEach(function (t) {
      var v = t[0], k = t[1] || '', body;
      if (v === 0) return;
      body = k ? (abs(v) === 1 ? '' : abs(v)) + k : String(abs(v));
      out += (out ? (v < 0 ? ' - ' : ' + ') : (v < 0 ? '-' : '')) + body;
    });
    return out || '0';
  };

  /* ── 틀: 보기 고르기 ── */
  /** 틀린 보기 후보의 차례: first 는 늘 앞에, rest 는 문제마다 섞은 차례(perm)로 */
  var mixc = function (first, rest, perm) {
    return first.concat(rest.map(function (c, i) { return [perm[i % perm.length], i, c]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }).map(function (x) { return x[2]; }));
  };
  /** 보기 고르기 문제를 마무리한다: 서로 다른 틀린 보기 3개(실수 id 는 한 번씩). 후보는 [복소수, 실수 id, 설명] */
  var finish = function (o) {
    var ans = tx(o.ans), texts = [ans], wrong = [];
    o.cands.forEach(function (c) {
      var t;
      if (!c || !c[0] || !isInt(c[0][0]) || !isInt(c[0][1]) || wrong.length >= 3 || wrong.some(function (w) { return w[1] === c[1]; })) return;
      t = tx(c[0]);
      if (texts.indexOf(t) >= 0) return;
      texts.push(t); wrong.push([t, c[1], c[2]]);
    });
    return { text: o.text, tex: o.tex, ans: ans, wrong: wrong, hints: o.hints, steps: o.steps, check: wrong.length === 3 && o.ok !== false };
  };
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'C04', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { text: p.text, tex: p.tex }; },
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
  /* ── 틀: 부호 있는 정수 하나(키패드). build(q) → { text, tex, ans: 정수, hints, steps, wrong: { 실수 id: 정수 }, check }
     답이 문제에 없는 수인데 힌트에 그 수가 나오면 거른다. 부호만 반대인 답은 공통 실수(sign)가 맡는다 ── */
  var numQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (n) { return { n: n, p: 0 }; };
    var leak = function (p) { var a = String(abs(p.ans)); return nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    var okW = function (p, x) { return isInt(x) && x !== p.ans && (p.ans === 0 || x !== -p.ans); };
    var count = function (p) { var seen = []; o.mistakes.forEach(function (m) { var x = p.wrong[m[0]]; if (okW(p, x) && seen.indexOf(x) < 0) seen.push(x); }); return seen.length; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && isInt(p.ans) && abs(p.ans) <= 9999999 && p.check === true && !leak(p) && count(p) >= 1; }; });
    MH.defineType({
      id: o.id, unit: 'C04', version: 1, title: o.title,
      answer: { kind: 'signed' },
      levels: o.levels,
      prompt: function (v) { var p = P(v); return { text: p.text, tex: p.tex }; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v); return p.check === true && ans.p === 0 && ans.n === p.ans; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), x = p.wrong[m[0]], i;
            if (!okW(p, x)) return null;
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) if (p.wrong[o.mistakes[i][0]] === x) return null;
            return val(x);
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  var IM_SIGN = '허수부분의 부호가 반대예요. $i$가 붙은 항끼리 부호를 살려서 다시 계산해요.';
  var RE_SIGN = '실수부분의 부호가 반대예요. 실수끼리 부호를 살려서 다시 계산해요.';

  /* ── C04.parts 실수부분과 허수부분 ─────────────────────── */
  var partsBuild = function (q) {
    var a = q.a, b = q.b, f = q.f, z = [a, b], im = q.ask === 'im', name = im ? '허수부분' : '실수부분', t, s1, ans = im ? b : a;
    t = f === 'swap' ? cx(0, b) + ' ' + sg(a) : tx(z);
    s1 = f === 'swap' ? t + ' = ' + tx(z) : f === 'real' ? a + ' = ' + a + ' + 0i' : f === 'pure' ? t + ' = 0 ' + (b < 0 ? '- ' : '+ ') + (abs(b) === 1 ? '' : abs(b)) + 'i'
      : f === 'unit' ? t + ' = ' + a + (b < 0 ? ' - ' : ' + ') + '1 \\times i' : t;
    return { text: '복소수 $' + t + '$의 ' + name + '을 구하세요.', ans: ans,
      check: (f === 'real' ? b === 0 && a !== 0 : f === 'pure' ? a === 0 && b !== 0 : a !== 0 && b !== 0) && (f !== 'unit' || abs(b) === 1) && (f !== 'std' || abs(b) >= 2),
      wrong: { other: im ? a : b, 'unit-zero': im && abs(b) === 1 ? 0 : null },
      steps: [{ say: '$a + bi$ 꼴로 보고, $i$가 붙지 않은 수와 $i$에 곱해진 수를 갈라요.', tex: s1 },
        { say: im ? '허수부분은 $i$에 곱해진 실수예요. $i$는 빼고 수만, 부호와 함께 답해요.' : '실수부분은 $i$가 붙지 않은 실수예요. 부호와 함께 답해요.', tex: String(ans) }],
      hints: ['복소수는 실수와 허수를 한 줄에 함께 쓴 수예요. $a + bi$ 꼴로 쓰고, $i$가 붙지 않은 실수 $a$를 실수부분, $i$에 곱해진 실수 $b$를 허수부분이라고 해요. 지갑 안의 지폐와 동전을 따로 세는 것처럼, $i$가 없는 수와 $i$가 붙은 수를 따로 봐요.',
        '① $' + t + '$' + jz(t, '을/를') + ' $i$가 없는 덩어리와 $i$가 붙은 덩어리로 갈라요. ② 순서가 바뀌어 있으면 $i$가 없는 수를 앞으로 옮겨 $a + bi$ 꼴로 고쳐 써요. ③ 구하는 것은 ' + name + '이에요. ' + (im ? '$i$가 붙은 덩어리를 봐요.' : '$i$가 없는 덩어리를 봐요.'),
        im ? '허수부분은 $i$까지 붙여서 답하지 않아요. $i$ 앞의 수만, 부호와 함께 답해요. $i$ 앞에 수가 보이지 않으면 문자식에서 $x$ 앞의 수를 줄여 쓰던 것을 떠올려요. $i$가 붙은 덩어리가 아예 없으면 $i$가 몇 개 있는 것인지 생각해요.'
          : '실수부분은 $i$가 붙지 않은 수예요. 빼기 기호가 앞에 있으면 그 부호까지 함께 답해요. $i$가 없는 덩어리가 아예 없으면, 그 자리에 어떤 수를 더해야 식의 값이 변하지 않는지 생각해요.'] };
  };
  numQ({
    id: 'C04.parts', title: '실수부분과 허수부분', build: partsBuild,
    mistakes: [['other', '다른 부분을 답했어요. $i$가 붙지 않은 수가 실수부분이고, $i$에 곱해진 수가 허수부분이에요. 문제에서 구하라고 한 것이 어느 쪽인지 다시 확인해요.'],
      ['unit-zero', '$i$ 앞에 수가 안 보인다고 0으로 답했어요. $i$는 $1 \\times i$를 줄여 쓴 것이에요. $x$가 $1x$인 것과 같아요. 빼기가 붙어 있으면 $-1$이에요.']],
    levels: [
      { name: 'a + bi 꼴', vars: { q: sampler(function (r) { return { f: 'std', a: nz(r, -9, 9), b: pm(r, r.int(2, 9)), ask: r.pick(['re', 'im']) }; }) } },
      { name: '계수가 1이거나 순서가 바뀐 식', vars: { q: sampler(function (r) {
        if (r.int(0, 2) === 0) return { f: 'unit', a: nz(r, -15, 15), b: pm(r, 1), ask: r.pick(['re', 'im', 'im']) };
        return { f: 'swap', a: nz(r, -9, 9), b: nz(r, -9, 9), ask: r.pick(['re', 'im']) };
      }) } },
      { name: '실수와 순허수', minDistinct: 200, vars: { q: sampler(function (r) {
        var k = r.int(0, 4);
        if (k <= 1) return { f: 'real', a: nz(r, -20, 20), b: 0, ask: r.pick(['re', 'im', 'im']) };
        if (k <= 3) return { f: 'pure', a: 0, b: nz(r, -12, 12), ask: r.pick(['re', 're', 'im']) };
        return { f: 'swap', a: nz(r, -12, 12), b: nz(r, -12, 12), ask: r.pick(['re', 'im']) };
      }) } }
    ]
  });

  /* ── C04.equal 복소수가 서로 같을 조건 ─────────────────── */
  var EQ_KEY = '두 복소수가 같다는 것은 실수부분끼리 같고 허수부분끼리도 같다는 뜻이에요. 실수와 허수는 서로 섞이지 않아서, 식 하나가 사실은 식 두 개예요. 양팔저울 두 대에 실수부분과 허수부분을 따로 올려놓고 각각 수평을 맞춘다고 생각해요. 문자가 실수라는 조건이 있어야 이렇게 가를 수 있어요.';
  var eqBuild = function (q) {
    var x = q.x, y = q.y, p = q.p, r = q.r, m = q.m, n = q.n, ax = q.ask === 'x', ans = ax ? x : y, A, B, c, d, tex, steps, wrong, hints, div = function (u, k) { return u % k === 0 ? u / k : null; };
    var text = '다음 등식을 만족시키는 실수 $' + q.ask + '$의 값을 구하세요. ($x$, $y$는 실수)';
    if (q.t === 'c') {
      A = 'x + ' + (m === 1 ? '' : m) + 'y'; B = 'x - y'; c = x + m * y; d = x - y;
      tex = '(' + A + ') + (' + B + ')i = ' + cx(c, d);
      steps = [{ say: '양쪽의 실수부분끼리, 허수부분끼리 같다고 놓아요. 식이 두 개 생겨요.', tex: A + ' = ' + c + ',\\quad ' + B + ' = ' + d },
        { say: '첫째 식에서 둘째 식을 빼면 $x$가 사라져요. 빼는 식은 모든 항의 부호가 바뀌어요.', tex: (m + 1) + 'y = ' + c + ' ' + sg(-d) + ' = ' + (c - d) },
        { say: '$y$에 곱해진 수로 나눠요.', tex: 'y = ' + y }];
      if (ax) steps.push({ say: '구한 $y$의 값을 둘째 식 $x - y = ' + d + '$에 넣어 $x$를 구해요.', tex: 'x = ' + d + ' ' + sg(y) + ' = ' + x });
      wrong = { other: ax ? y : x, rhs: ax ? c : d, 'not-divided': ax ? null : c - d };
      hints = [EQ_KEY,
        '① 실수부분끼리 같다고 놓으면 $' + A + ' = ' + c + '$, 허수부분끼리 같다고 놓으면 $' + B + ' = ' + d + '$' + pj(d, '이에요/예요') + '. ② 문자가 둘인 식이 두 개 생겼어요. 중학교에서 배운 연립방정식이에요. ③ 한 식에서 다른 식을 빼서 문자 하나를 없애요.',
        '두 식 모두 $x$의 계수가 같으니, 첫째 식에서 둘째 식을 빼면 $x$가 사라지고 $y$만 남아요. 뺄 때는 둘째 식의 모든 항의 부호가 바뀌어요. $y$를 구한 다음 둘째 식에 넣으면 $x$도 구할 수 있어요. 구한 두 값을 처음 식에 넣어 확인해요.'];
      return { text: text, tex: tex, ans: ans, wrong: wrong, steps: steps, hints: hints, check: c !== 0 && abs(d) >= 2 && x !== 0 && y !== 0 };
    }
    A = (m === 1 ? '' : m) + 'x ' + sg(p); B = (n === 1 ? '' : n) + 'y ' + sg(r); c = m * x + p; d = n * y + r;
    tex = '(' + A + ') + (' + B + ')i = ' + cx(c, d);
    var k = ax ? m : n, own = ax ? c : d, cross = ax ? d : c, off = ax ? p : r, L = ax ? 'x' : 'y';
    steps = [{ say: '양쪽의 실수부분끼리, 허수부분끼리 같다고 놓아요. 식이 두 개 생겨요.', tex: A + ' = ' + c + ',\\quad ' + B + ' = ' + d }];
    if (k === 1) steps.push({ say: '$' + L + '$가 든 식을 풀어요. 수를 반대쪽으로 옮기면 부호가 바뀌어요.', tex: L + ' = ' + own + ' ' + sg(-off) + ' = ' + ans });
    else { steps.push({ say: '$' + L + '$가 든 식에서 수를 반대쪽으로 옮겨요. 옮기면 부호가 바뀌어요.', tex: k + L + ' = ' + own + ' ' + sg(-off) + ' = ' + (own - off) }); steps.push({ say: '$' + L + '$에 곱해진 수로 나눠요.', tex: L + ' = ' + ans }); }
    wrong = k === 1 ? { other: ax ? y : x, cross: cross - off, 'sign-move': own + off, rhs: own }
      : { other: ax ? y : x, 'not-divided': own - off, 'sign-move': div(own + off, k), cross: div(cross - off, k) };
    hints = [EQ_KEY,
      '① 왼쪽에서 $i$가 붙지 않은 부분은 $' + A + '$, 오른쪽에서는 $' + c + '$' + pj(c, '이에요/예요') + '. ② $i$에 곱해진 부분은 왼쪽이 $' + B + '$, 오른쪽이 $' + d + '$' + pj(d, '이에요/예요') + '. ③ 구하는 문자는 $' + L + '$예요. $' + L + '$가 들어 있는 쪽끼리 같다고 놓고 식을 풀어요.',
      '등식에서 수를 반대쪽으로 옮기면 부호가 바뀌어요. 더해져 있던 수는 빼는 수가 되고, 빼져 있던 수는 더하는 수가 돼요. ' + (k === 1 ? '' : '문자에 곱해진 수는 맨 마지막에 나눠요. ') + '답을 구한 다음에는 처음 식의 문자 자리에 넣어서 양쪽이 같아지는지 확인해요. 실수부분을 허수부분과 견주지 않도록 조심해요.'];
    return { text: text, tex: tex, ans: ans, wrong: wrong, steps: steps, hints: hints, check: c !== 0 && abs(d) >= 2 && x !== 0 && y !== 0 && (q.t === 'a' ? m === 1 && n === 1 : m >= 2 && n >= 2) };
  };
  numQ({
    id: 'C04.equal', title: '복소수가 서로 같을 조건', build: eqBuild,
    mistakes: [['other', '다른 문자의 값을 답했어요. 문제에서 구하라고 한 문자가 무엇인지 다시 확인해요.'],
      ['cross', '실수부분을 허수부분과 견줬어요. 실수부분은 실수부분끼리, 허수부분은 허수부분끼리 같다고 놓아야 해요. $i$가 붙은 쪽과 안 붙은 쪽을 구별해요.'],
      ['sign-move', '수를 반대쪽으로 옮길 때 부호를 바꾸지 않았어요. 더해져 있던 수는 옮기면 빼는 수가 되고, 빼져 있던 수는 더하는 수가 돼요.'],
      ['rhs', '오른쪽의 수를 그대로 답했어요. 왼쪽의 괄호 안에는 문자 말고 다른 항도 있어요. 괄호 안의 식 전체가 오른쪽 수와 같다고 놓고 풀어요.'],
      ['not-divided', '문자에 곱해진 수로 나누지 않았어요. 문자 앞에 수가 곱해져 있으면 마지막에 그 수로 나눠야 문자 하나의 값이 돼요.']],
    levels: [
      { name: '부분끼리 바로 견주기', vars: { q: sampler(function (r) { return { t: 'a', m: 1, n: 1, x: nz(r, -9, 9), y: nz(r, -9, 9), p: nz(r, -9, 9), r: nz(r, -9, 9), ask: r.pick(['x', 'y']) }; }) } },
      { name: '문자에 계수가 있는 식', vars: { q: sampler(function (r) { return { t: 'b', m: r.int(2, 4), n: r.int(2, 4), x: nz(r, -6, 6), y: nz(r, -6, 6), p: nz(r, -9, 9), r: nz(r, -9, 9), ask: r.pick(['x', 'y']) }; }) } },
      { name: '연립해서 풀기', vars: { q: sampler(function (r) { return { t: 'c', m: r.int(1, 3), x: nz(r, -8, 8), y: nz(r, -8, 8), ask: r.pick(['x', 'y']) }; }) } }
    ]
  });

  /* ── C04.addsub 덧셈과 뺄셈 ───────────────────────────── */
  var AS_KEY = '복소수의 덧셈과 뺄셈은 문자식의 동류항 계산과 똑같아요. $i$를 문자 $x$처럼 생각해요. 실수는 실수끼리, $i$가 붙은 수는 $i$가 붙은 수끼리 모아서 계산해요. 사과와 귤을 따로 세는 것과 같아요. 사과 3개와 귤 2개에 사과 1개와 귤 5개를 더하면 사과 4개와 귤 7개예요.';
  var asBuild = function (q) {
    var ts = q.ts, ans = [0, 0], tex = '', items = [], res = [], ims = [], neg = false, coef = false, cands, sum = function (f) { var z = [0, 0]; ts.forEach(function (t, i) { z = add(z, f(t[0], t[1], i)); }); return z; };
    ts.forEach(function (t, i) {
      var k = t[0], z = t[1];
      ans = add(ans, sc(z, k)); if (k < 0) neg = true; if (abs(k) >= 2) coef = true;
      tex += (i ? (k < 0 ? ' - ' : ' + ') : (k < 0 ? '-' : '')) + (abs(k) === 1 ? '' : abs(k)) + pz(z);
      items.push([k * z[0], '']); items.push([k * z[1], 'i']); res.push([k * z[0], '']); ims.push([k * z[1], '']);
    });
    cands = mixc([], [
      neg ? [sum(function (k, z) { return k < 0 ? [k * z[0], -k * z[1]] : sc(z, k); }), 'minus-first', '빼는 괄호에서 첫 항의 부호만 바꿨어요. 괄호 앞에 빼기가 있으면 괄호 안의 모든 항의 부호가 바뀌어요. $i$가 붙은 항의 부호도 바꿔요.'] : null,
      coef ? [sum(function (k, z) { return [k * z[0], (k < 0 ? -1 : 1) * z[1]]; }), 'dist-first', '괄호 앞의 수를 첫 항에만 곱했어요. 괄호 앞의 수는 괄호 안의 모든 항에 곱해요. $i$가 붙은 항에도 곱해요.'] : null,
      [sum(function (k, z, i) { return sc(z, i === ts.length - 1 ? -k : k); }), 'op-swapped', '마지막 괄호의 더하기와 빼기를 바꿔 계산했어요. 괄호 사이의 기호를 다시 확인해요.'],
      ans[0] + ans[1] !== 0 ? [[0, ans[0] + ans[1]], 'lumped', '실수와 $i$가 붙은 수를 한데 합쳤어요. 사과와 귤을 한 가지로 셀 수 없듯이, 실수부분과 허수부분은 따로 계산해서 $a + bi$ 꼴로 써요.'] : null
    ], q.perm).concat([[conj(ans), 'im-sign', IM_SIGN], [[-ans[0], ans[1]], 're-sign', RE_SIGN]]);
    return finish({ text: '다음을 계산하세요.', tex: tex, ans: ans, cands: cands,
      ok: ans[0] !== 0 && ans[1] !== 0 && ts.every(function (t) { return t[1][0] !== 0 && t[1][1] !== 0; }),
      steps: [{ say: coef ? '괄호 앞의 수를 괄호 안의 두 항에 모두 곱하면서 괄호를 풀어요.' + (neg ? ' 빼는 괄호는 안의 부호가 모두 바뀌어요.' : '') : neg ? '괄호를 풀어요. 빼는 괄호는 안의 부호가 모두 바뀌어요.' : '괄호를 풀어요. 더하는 괄호는 부호가 그대로예요.', tex: line(items) },
        { say: '실수는 실수끼리, $i$가 붙은 수는 $i$가 붙은 수끼리 모아요.', tex: '(' + line(res) + ') + (' + line(ims) + ')i' },
        { say: '괄호 안을 각각 계산해요.', tex: tx(ans) }],
      hints: [AS_KEY,
        '① 괄호를 풀어요. ' + (coef ? '괄호 앞에 곱해진 수는 괄호 안의 두 항에 모두 곱해요. ' : '') + (neg ? '괄호 앞에 빼기가 있으면 괄호 안의 두 항의 부호가 모두 바뀌어요. ' : '더하는 괄호는 그냥 벗기면 돼요. ') + '② $i$가 없는 수끼리 모아서 계산해요. 이것이 실수부분이에요. ③ $i$가 붙은 수끼리 모아서 $i$ 앞의 수를 계산해요. 이것이 허수부분이에요.',
        '첫 괄호 $' + pz(ts[0][1]) + '$에서 실수부분과 허수부분을 가르는 것부터 시작해요. 부호는 항의 앞에 붙어 있는 것을 따라가요. 실수부분과 허수부분은 끝까지 합치지 않고 $a + bi$ 꼴로 나란히 써요. 계산한 다음에는 부호가 맞는지 실수부분과 허수부분을 따로 한 번씩 검산해요.'] });
  };
  var zr = function (r, n) { return [nz(r, -n, n), nz(r, -n, n)]; };
  choiceQ({
    id: 'C04.addsub', title: '복소수의 덧셈과 뺄셈', build: asBuild, ids: ['minus-first', 'dist-first', 'op-swapped', 'lumped', 'im-sign', 're-sign'],
    levels: [
      { name: '두 복소수', vars: { q: sampler(function (r) { return wo(r, { ts: [[1, zr(r, 9)], [pm(r, 1), zr(r, 9)]] }); }) } },
      { name: '세 복소수', vars: { q: sampler(function (r) { var s = r.pick([[-1, 1], [1, -1], [-1, -1]]); return wo(r, { ts: [[1, zr(r, 9)], [s[0], zr(r, 9)], [s[1], zr(r, 9)]] }); }) } },
      { name: '괄호 앞에 수가 곱해진 식', vars: { q: sampler(function (r) { return wo(r, { ts: [[r.int(2, 4), zr(r, 6)], [pm(r, r.int(2, 4)), zr(r, 6)]] }); }) } }
    ]
  });

  /* ── C04.mul 곱셈 ─────────────────────────────────── */
  var MU_KEY = '복소수의 곱셈은 문자식의 전개와 똑같이 해요. $i$를 문자처럼 보고 분배법칙으로 괄호를 풀어요. 다른 점은 하나뿐이에요. $i$가 두 번 곱해져서 $i^{2}$이 생기면 그것을 $-1$로 바꿔요. 그래서 $i$가 두 번 곱해진 항은 $i$가 사라지고 부호가 바뀐 실수가 돼요.';
  var MU_LAST = '$i^{2}$을 $-1$로 바꾼 다음, 실수는 실수끼리 $i$가 붙은 수는 $i$가 붙은 수끼리 모아요. 실수가 두 군데에서 나온다는 것을 잊지 않아요. 하나는 실수끼리 곱한 것이고, 다른 하나는 $i^{2}$이 바뀐 것이에요. 부호를 하나씩 확인해요.';
  var W_PLUS = '$i^{2}$을 1로 계산했어요. $i^{2} = -1$이에요. $i$가 두 번 곱해진 항은 부호가 바뀐 실수가 돼요.';
  var W_ASI = '$i \\times i$를 $i$로 썼어요. $i$를 두 번 곱하면 $i^{2}$이고, 이것은 $-1$이에요. $i$가 사라지고 실수가 돼요.';
  var muBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, d = q.d, k = q.k, z, w, ans, tex, cands, steps, hint2;
    if (q.t === 'mono') {
      z = [0, k]; w = [a, b]; ans = mul(z, w); tex = tx(z) + pz(w);
      cands = mixc([[[k * b, k * a], 'i2-plus', W_PLUS]], [
        [[0, k * a + k * b], 'i2-as-i', W_ASI],
        [[0, k * a + b], 'first-only', '괄호 앞의 수를 첫 항에만 곱했어요. 괄호 앞의 수는 괄호 안의 두 항에 모두 곱해요.'],
        [[k * a, k * b], 'i-lost', '괄호 앞의 $i$를 빼고 수만 곱했어요. $i$도 함께 곱해야 해요. 실수에 $i$를 곱하면 $i$가 붙고, $i$가 붙은 수에 곱하면 $i^{2}$이 생겨요.']
      ], q.perm).concat([[conj(ans), 'im-sign', IM_SIGN]]);
      steps = [{ say: '괄호 앞의 $' + tx(z) + '$를 괄호 안의 두 항에 각각 곱해요.', tex: line([[k * a, 'i'], [k * b, 'i^{2}']]) },
        { say: '$i^{2}$을 $-1$로 바꿔요. 부호가 바뀐 실수가 돼요.', tex: line([[k * a, 'i'], [-k * b, '']]) },
        { say: '실수부분을 앞에 써서 정리해요.', tex: tx(ans) }];
      hint2 = '① 괄호 앞의 $' + tx(z) + '$를 괄호 안의 두 항 $' + a + '$' + pj(a, '과/와') + ' $' + cx(0, b) + '$에 각각 곱해요. ② 실수에 곱하면 $i$가 붙은 수가 돼요. ③ $i$가 붙은 항에 곱하면 $i$가 두 번 곱해져서 $i^{2}$이 생겨요.';
    } else if (q.t === 'sq') {
      z = [a, b]; w = z; ans = mul(z, z); tex = pz(z) + '^{2}';
      cands = mixc([[[a * a + b * b, 2 * a * b], 'i2-plus', W_PLUS]], [
        [[a * a, b * b], 'termwise', '두 항을 각각 제곱하기만 했어요. $(A + B)^{2}$을 전개하면 가운데에 $2AB$가 생겨요. 그리고 $i$가 붙은 항을 제곱하면 $i^{2}$이 생겨 실수가 돼요.'],
        [[a * a - b * b, a * b], 'half-cross', '가운데 항을 2배 하지 않았어요. $(A + B)^{2} = A^{2} + 2AB + B^{2}$이에요. 두 항을 곱한 것이 두 번 나와요.'],
        [[a * a, 2 * a * b], 'i2-dropped', '$i$가 붙은 항을 제곱한 것을 빠뜨렸어요. $i^{2} = -1$이라서 이 항은 사라지지 않고 실수가 돼요. 실수부분에 합쳐요.']
      ], q.perm).concat([[conj(ans), 'im-sign', IM_SIGN]]);
      steps = [{ say: '완전제곱식의 공식 $(A + B)^{2} = A^{2} + 2AB + B^{2}$을 써요.', tex: par(a) + '^{2} + 2 \\times ' + par(a) + ' \\times ' + (b < 0 ? '(' + cx(0, b) + ')' : cx(0, b)) + ' + (' + cx(0, b) + ')^{2}' },
        { say: '항을 하나씩 계산해요. 끝 항에는 $i^{2}$이 생겨요.', tex: line([[a * a, ''], [2 * a * b, 'i'], [b * b, 'i^{2}']]) },
        { say: '$i^{2}$을 $-1$로 바꿔요.', tex: line([[a * a, ''], [2 * a * b, 'i'], [-b * b, '']]) },
        { say: '실수끼리 모아요.', tex: tx(ans) }];
      hint2 = '① 같은 괄호를 두 번 곱한 것이에요. 완전제곱식의 공식 $(A + B)^{2} = A^{2} + 2AB + B^{2}$을 써요. ② 이 문제에서는 $A = ' + a + '$, $B = ' + cx(0, b) + '$예요. 부호까지 넣어요. ③ $B^{2}$을 계산할 때 $i^{2}$이 생겨요.';
    } else {
      z = [a, b]; w = [c, d]; ans = mul(z, w); tex = pz(z) + pz(w);
      cands = mixc([[[a * c + b * d, a * d + b * c], 'i2-plus', W_PLUS]], [
        [[a * c, a * d + b * c], 'i2-dropped', '$i$끼리 곱한 항을 빠뜨렸어요. $i \\times i = i^{2} = -1$이라서 이 항은 사라지지 않고 실수가 돼요. 실수부분에 합쳐요.'],
        [[a * c, b * d], 'termwise', '실수끼리, 허수끼리만 곱했어요. 곱셈은 덧셈과 달라요. 괄호 안의 모든 항을 서로 한 번씩, 모두 네 번 곱해야 해요.'],
        [[a * c, a * d + b * c + b * d], 'i2-as-i', W_ASI]
      ], q.perm).concat([[conj(ans), 'im-sign', IM_SIGN]]);
      steps = [{ say: '분배법칙으로 네 항을 모두 곱해요.', tex: line([[a * c, ''], [a * d, 'i'], [b * c, 'i'], [b * d, 'i^{2}']]) },
        { say: '$i^{2}$을 $-1$로 바꿔요. 부호가 바뀐 실수가 돼요.', tex: line([[a * c, ''], [a * d, 'i'], [b * c, 'i'], [-b * d, '']]) },
        { say: '실수는 실수끼리, $i$가 붙은 수는 $i$가 붙은 수끼리 모아요.', tex: tx(ans) }];
      hint2 = '① $' + pz(z) + '$의 두 항을 $' + pz(w) + '$의 두 항에 각각 곱해요. 곱은 모두 네 개예요. ② 앞의 항끼리, 바깥 항끼리, 안쪽 항끼리, 뒤의 항끼리 차례로 곱하면 빠뜨리지 않아요. ③ 뒤의 항끼리 곱한 것에는 $i^{2}$이 생겨요.';
    }
    return finish({ text: '다음을 계산하세요.', tex: tex, ans: ans, cands: cands, ok: ans[1] !== 0, steps: steps, hints: [MU_KEY, hint2, MU_LAST] });
  };
  choiceQ({
    id: 'C04.mul', title: '복소수의 곱셈', build: muBuild, ids: ['i2-plus', 'i2-as-i', 'first-only', 'i-lost', 'i2-dropped', 'termwise', 'half-cross', 'im-sign'],
    levels: [
      { name: 'i가 붙은 수를 괄호에 곱하기', vars: { q: sampler(function (r) { return wo(r, { t: 'mono', k: nz(r, -5, 5), a: nz(r, -9, 9), b: nz(r, -9, 9) }); }) } },
      { name: '두 복소수의 곱', vars: { q: sampler(function (r) { return wo(r, { t: 'prod', a: nz(r, -6, 6), b: nz(r, -6, 6), c: nz(r, -6, 6), d: nz(r, -6, 6) }); }) } },
      { name: '복소수의 제곱', minDistinct: 150, vars: { q: sampler(function (r) { return wo(r, { t: 'sq', a: nz(r, -7, 7), b: nz(r, -7, 7) }); }) } }
    ]
  });

  /* ── C04.conj 켤레복소수 ──────────────────────────────── */
  var CJ_KEY = '켤레복소수는 허수부분의 부호만 반대로 바꾼 복소수예요. $a + bi$의 켤레복소수는 $a - bi$예요. 잔잔한 호수에 비친 산의 모습을 떠올려요. 좌우의 위치(실수부분)는 그대로이고 위아래(허수부분)만 뒤집혀요. 기호로는 복소수 위에 줄을 그어 $\\overline{z}$로 써요.';
  var W_RE = '실수부분의 부호를 바꿨어요. 켤레복소수는 허수부분의 부호만 바꿔요. 실수부분은 그대로 둬요.';
  var W_BOTH = '부호를 모두 바꿨어요. 켤레복소수는 허수부분의 부호만 바꿔요. 실수부분은 그대로 둬요.';
  var W_SAME = '처음 복소수와 값이 같아요. 켤레복소수는 $i$가 붙은 항의 부호를 반대로 바꾼 것이에요.';
  var W_SWAP = '실수부분과 허수부분의 자리를 바꿨어요. 켤레복소수는 자리를 바꾸는 것이 아니라 허수부분의 부호만 바꾸는 것이에요.';
  var cjBuild = function (q) {
    var a = q.a, b = q.b, z = [a, b], f = q.f, t, s, ans, z2, op, inner;
    if (f === 'diff') {
      ans = [0, 2 * b];
      return finish({ text: '$z = ' + tx(z) + '$일 때, 다음을 계산하세요.', tex: 'z - \\overline{z}', ans: ans, ok: a !== 0 && b !== 0,
        cands: mixc([], [
          [[0, 0], 'zero', '실수부분과 함께 허수부분도 지워진다고 봤어요. $z$와 $\\overline{z}$는 허수부분의 부호가 서로 반대예요. 빼면 지워지지 않고 두 배가 돼요.'],
          [[2 * a, 0], 're-twice', '$z + \\overline{z}$를 계산했어요. 더하면 실수부분이 두 배가 되지만, 빼면 실수부분은 지워지고 허수부분이 두 배가 돼요.'],
          [[0, b], 'not-doubled', '허수부분을 한 번만 썼어요. 부호가 반대인 것을 빼면 같은 것을 한 번 더 더하는 셈이라서 허수부분이 두 배가 돼요.'],
          [[0, -2 * b], 'both', '부호가 반대예요. $\\overline{z} - z$를 계산한 값이에요. 앞의 복소수에서 뒤의 복소수를 빼요.']
        ], q.perm),
        steps: [{ say: '먼저 켤레복소수를 구해요. 허수부분의 부호만 바꿔요.', tex: '\\overline{z} = ' + tx(conj(z)) },
          { say: '빼는 복소수를 괄호로 묶어서 써요.', tex: 'z - \\overline{z} = ' + pz(z) + ' - ' + pz(conj(z)) },
          { say: '괄호를 풀면 실수부분은 지워지고 허수부분은 두 배가 돼요.', tex: line([[a, ''], [b, 'i'], [-a, ''], [b, 'i']]) + ' = ' + tx(ans) }],
        hints: [CJ_KEY,
          '① 먼저 $\\overline{z}$를 구해요. $z = ' + tx(z) + '$의 허수부분의 부호만 바꿔요. ② $z$에서 $\\overline{z}$를 빼요. 빼는 복소수는 괄호로 묶어요. ③ 괄호를 풀고 실수부분끼리, 허수부분끼리 모아요.',
          '빼는 괄호를 풀 때는 괄호 안의 부호가 모두 바뀌어요. 실수부분은 같은 수를 빼니 사라져요. 허수부분은 부호가 반대인 것을 빼는 것이라, 같은 것을 한 번 더 더하는 셈이에요. 그래서 허수부분이 두 배가 돼요.'] });
    }
    if (f === 'sum') {
      z2 = [q.c, q.d]; op = q.op; s = add(z, sc(z2, op)); ans = conj(s); inner = pz(z) + (op < 0 ? ' - ' : ' + ') + pz(z2);
      return finish({ text: '다음을 계산하세요.', tex: '\\overline{' + inner + '}', ans: ans, ok: s[0] !== 0 && s[1] !== 0,
        cands: mixc([[s, 'same', '줄 아래의 식을 계산하기만 하고 켤레복소수로 바꾸지 않았어요. 위에 그은 줄은 켤레복소수를 뜻해요. 계산한 다음 허수부분의 부호를 바꿔요.']], [
          [[-s[0], s[1]], 're-sign', W_RE],
          [[-s[0], -s[1]], 'both', W_BOTH],
          [add(conj(z), sc(z2, op)), 'first-only', '앞의 괄호만 켤레복소수로 바꿨어요. 줄이 식 전체 위에 그어져 있으니, 전체를 계산한 결과의 허수부분 부호를 바꿔요.'],
          [[s[1], s[0]], 'swapped', W_SWAP]
        ], q.perm),
        steps: [{ say: '줄 아래의 식을 먼저 계산해요. 실수부분끼리, 허수부분끼리 모아요.', tex: inner + ' = ' + tx(s) },
          { say: '계산한 복소수에서 허수부분의 부호만 바꿔요.', tex: '\\overline{' + tx(s) + '} = ' + tx(ans) }],
        hints: [CJ_KEY,
          '① 줄(켤레 기호) 아래의 식 $' + inner + '$' + jz(tx(z2), '을/를') + ' 먼저 계산해서 복소수 하나로 만들어요. ② 실수부분끼리, 허수부분끼리 모아요. ' + (op < 0 ? '빼는 괄호는 안의 부호가 모두 바뀌어요. ' : '') + '③ 다 계산한 복소수에서 허수부분의 부호만 바꿔요.',
          '위에 그은 줄을 잊지 않도록 해요. 줄 아래를 계산한 것은 아직 답이 아니에요. 마지막에 $i$가 붙은 항의 부호를 반대로 바꿔야 해요. 실수부분의 부호는 건드리지 않아요. 더하기는 빼기로, 빼기는 더하기로 바꾸는 것은 $i$가 붙은 항 하나뿐이에요.'] });
    }
    t = f === 'swap' ? cx(0, b) + ' ' + sg(a) : tx(z); ans = conj(z);
    return finish({ text: '다음 복소수의 켤레복소수를 구하세요.', tex: t, ans: ans,
      ok: f === 'real' ? b === 0 && a !== 0 : f === 'pure' ? a === 0 && b !== 0 : a !== 0 && b !== 0,
      cands: f === 'real' ? [[[-a, 0], 're-sign', '부호를 바꿨어요. 실수는 허수부분이 없어서 바꿀 부호가 없어요. 실수의 켤레복소수는 자기 자신이에요.'], [[0, a], 'swapped', W_SWAP], [[0, -a], 'i-added', '없던 $i$를 붙였어요. 실수는 허수부분이 없는 복소수예요. 켤레복소수로 바꿔도 $i$가 생기지 않아요.']]
        : f === 'pure' ? [[z, 'same', W_SAME], [[b, 0], 'swapped', W_SWAP], [[-b, 0], 'i-dropped', '$i$를 떼어 버렸어요. 켤레복소수는 $i$가 붙은 항의 부호만 바꾸는 것이에요. $i$는 그대로 남아요.']]
          : mixc([], [[[-a, b], 're-sign', W_RE], [[-a, -b], 'both', W_BOTH], [z, 'same', W_SAME], [[b, a], 'swapped', W_SWAP]], q.perm),
      steps: [{ say: '$a + bi$ 꼴로 보고 실수부분과 허수부분을 찾아요.', tex: f === 'swap' ? t + ' = ' + tx(z) : t },
        { say: f === 'real' ? '허수부분이 없는 실수예요. 바꿀 부호가 없으니 켤레복소수는 자기 자신이에요.' : '$i$가 붙은 항의 부호만 반대로 바꿔요. 실수부분은 그대로 둬요.', tex: '\\overline{' + tx(z) + '} = ' + tx(ans) }],
      hints: [CJ_KEY,
        '① $' + t + '$에서 $i$가 붙지 않은 수(실수부분)와 $i$에 곱해진 수(허수부분)를 찾아요. ② 실수부분은 손대지 않아요. ③ $i$가 붙은 항의 부호만 반대로 바꿔요. 더하기는 빼기로, 빼기는 더하기로 바꿔요.',
        '헷갈리기 쉬운 경우가 있어요. $i$가 붙은 항이 아예 없는 실수는 바꿀 부호가 없으니 켤레복소수가 자기 자신이에요. 실수부분이 없고 $i$가 붙은 항만 있으면 그 항의 부호만 바꿔요. $i$가 붙은 항이 앞에 쓰여 있어도 바뀌는 것은 그 항의 부호예요.'] });
  };
  choiceQ({
    id: 'C04.conj', title: '켤레복소수', build: cjBuild, ids: ['re-sign', 'both', 'same', 'swapped', 'i-added', 'i-dropped', 'first-only', 'zero', 're-twice', 'not-doubled'],
    levels: [
      { name: 'a + bi 꼴', vars: { q: sampler(function (r) { return wo(r, { f: 'std', a: nz(r, -12, 12), b: nz(r, -12, 12) }); }) } },
      { name: '실수 · 순허수 · 순서가 바뀐 식', minDistinct: 250, vars: { q: sampler(function (r) {
        var k = r.int(0, 3);
        if (k === 0) return wo(r, { f: 'real', a: nz(r, -30, 30), b: 0 });
        if (k === 1) return wo(r, { f: 'pure', a: 0, b: nz(r, -15, 15) });
        return wo(r, { f: 'swap', a: nz(r, -12, 12), b: nz(r, -12, 12) });
      }) } },
      { name: '계산한 다음 켤레복소수', vars: { q: sampler(function (r) {
        if (r.int(0, 2) === 0) return wo(r, { f: 'diff', a: nz(r, -9, 9), b: nz(r, -9, 9) });
        return wo(r, { f: 'sum', a: nz(r, -9, 9), b: nz(r, -9, 9), c: nz(r, -9, 9), d: nz(r, -9, 9), op: pm(r, 1) });
      }) } }
    ]
  });

  /* ── C04.norm 켤레복소수의 합과 곱 ─────────────────────── */
  var NM_KEY = '복소수와 그 켤레복소수를 더하거나 곱하면 $i$가 사라지고 실수만 남아요. 더하면 부호가 반대인 허수부분이 서로 지워지고, 곱하면 합과 차의 곱 꼴이 되어 $i$가 제곱으로만 나와요. 켤레복소수는 허수를 없애 주는 짝꿍이에요.';
  var nmBuild = function (q) {
    var a = q.a, b = q.b, z = [a, b], zc = conj(z), f = q.f, N = a * a + b * b, s = q.s, given = '$z = ' + tx(z) + '$일 때, 다음 식의 값을 구하세요.', cstep = { say: '먼저 켤레복소수를 구해요. 허수부분의 부호만 바꿔요.', tex: '\\overline{z} = ' + tx(zc) };
    var sq = par(a) + '^{2} - (' + cx(0, abs(b)) + ')^{2}', prodHint = '$i^{2}$은 음수라서, 빼던 것이 더하는 것으로 바뀌어요. 결국 실수부분의 제곱과 허수부분의 제곱을 더한 값이 돼요. 빼지 않도록 조심해요. 허수부분이 음수여도 제곱하면 양수예요.';
    if (f === 'sum') return { text: given, tex: 'z + \\overline{z}', ans: 2 * a, check: true,
      wrong: { 'not-doubled': a, 'im-doubled': 2 * b, 'parts-sum': a + b },
      steps: [cstep, { say: '두 복소수를 더해요. 허수부분은 부호가 반대라서 서로 지워지고, 실수부분은 두 번 더해져요.', tex: pz(z) + ' + ' + pz(zc) + ' = ' + 2 * a }],
      hints: [NM_KEY,
        '① $z = ' + tx(z) + '$의 켤레복소수 $\\overline{z}$를 구해요. 허수부분의 부호만 바꿔요. ② 두 복소수를 더해요. 실수부분끼리, 허수부분끼리 모아요. ③ 허수부분은 크기가 같고 부호가 반대라서 더하면 사라져요.',
        '남는 것은 실수부분뿐이에요. 같은 실수부분이 두 번 더해진다는 것에 주의해요. 한 번만 쓰면 안 돼요. 허수부분의 수를 답에 넣지 않도록 조심해요. 실수부분이 음수이면 답도 음수예요.'] };
    if (f === 'mix') return { text: given, tex: s > 0 ? 'z\\overline{z} + z + \\overline{z}' : 'z\\overline{z} - (z + \\overline{z})', ans: N + s * 2 * a, check: N + s * 2 * a !== 0,
      wrong: { minus: a * a - b * b + s * 2 * a, 'half-sum': N + s * a, 'sign-sum': N - s * 2 * a },
      steps: [cstep, { say: '곱을 구해요. 실수부분의 제곱과 허수부분의 제곱을 더한 값이에요.', tex: 'z\\overline{z} = ' + a * a + ' + ' + b * b + ' = ' + N },
        { say: '합을 구해요. 실수부분을 두 번 더한 값이에요.', tex: 'z + \\overline{z} = ' + 2 * a },
        { say: s > 0 ? '두 값을 더해요.' : '곱에서 합을 빼요. 음수를 빼면 더하는 것이 돼요.', tex: N + (s > 0 ? ' + ' : ' - ') + par(2 * a) + ' = ' + (N + s * 2 * a) }],
      hints: [NM_KEY,
        '① $z\\overline{z}$와 $z + \\overline{z}$를 따로 구해요. 둘 다 실수가 돼요. ② $z\\overline{z}$는 실수부분의 제곱과 허수부분의 제곱을 더한 값이에요. ③ $z + \\overline{z}$는 실수부분을 두 번 더한 값이에요. 이 문제에서 $z = ' + tx(z) + '$예요.',
        '두 값을 구한 다음 문제의 식대로 더하거나 빼요. 실수부분이 음수이면 $z + \\overline{z}$도 음수예요. 음수를 빼면 더하는 것이 된다는 것을 기억해요. 부호를 마지막에 한 번 더 확인해요.'] };
    if (f === 'direct') return { text: '다음을 계산하세요.', tex: pz(z) + pz(zc), ans: N, check: abs(a) !== abs(b),
      wrong: { minus: a * a - b * b, 'sq-sum': (a + b) * (a + b), 're-only': a * a },
      steps: [{ say: '허수부분의 부호만 다른 두 복소수의 곱이에요. 합과 차의 곱 공식 $(A + B)(A - B) = A^{2} - B^{2}$을 써요.', tex: pz(z) + pz(zc) + ' = ' + sq },
        { say: '$i$가 붙은 항을 제곱하면 $i^{2}$이 생겨 음수가 돼요. 빼기가 더하기로 바뀌어요.', tex: a * a + ' + ' + b * b + ' = ' + N }],
      hints: [NM_KEY,
        '① 두 괄호를 견줘 봐요. 실수부분은 같고 $i$가 붙은 항의 부호만 달라요. 서로 켤레복소수예요. ② $(A + B)(A - B) = A^{2} - B^{2}$ 꼴이에요. ③ $B$ 자리에는 $i$가 붙은 항이 들어가요. 그 제곱에서 $i^{2}$이 나와요.', prodHint] };
    return { text: given, tex: 'z\\overline{z}', ans: N, check: abs(a) !== abs(b),
      wrong: { minus: a * a - b * b, 'sq-sum': (a + b) * (a + b), 're-only': a * a },
      steps: [cstep, { say: '두 복소수를 곱해요. 합과 차의 곱 공식 $(A + B)(A - B) = A^{2} - B^{2}$을 써요.', tex: pz(z) + pz(zc) + ' = ' + sq },
        { say: '$i$가 붙은 항을 제곱하면 $i^{2}$이 생겨 음수가 돼요. 빼기가 더하기로 바뀌어요.', tex: a * a + ' + ' + b * b + ' = ' + N }],
      hints: [NM_KEY,
        '① $z = ' + tx(z) + '$의 켤레복소수 $\\overline{z}$를 구해요. 허수부분의 부호만 바꿔요. ② 두 복소수를 곱해요. $(A + B)(A - B) = A^{2} - B^{2}$ 꼴이에요. ③ $B$ 자리에는 $i$가 붙은 항이 들어가요. 그 제곱에서 $i^{2}$이 나와요.', prodHint] };
  };
  numQ({
    id: 'C04.norm', title: '켤레복소수의 합과 곱', build: nmBuild,
    mistakes: [['not-doubled', '실수부분을 한 번만 썼어요. $z$와 $\\overline{z}$에 실수부분이 하나씩 있어서, 더하면 실수부분이 두 번 더해져요.'],
      ['im-doubled', '허수부분을 두 배 했어요. 더할 때 허수부분은 부호가 반대라서 서로 지워져요. 남는 것은 실수부분의 두 배예요.'],
      ['parts-sum', '실수부분과 허수부분을 더했어요. 더하는 것은 $z$와 그 켤레복소수예요. 허수부분은 서로 지워지고 실수부분만 두 번 더해져요.'],
      ['minus', '제곱을 서로 뺐어요. $i$가 붙은 항을 제곱하면 $i^{2} = -1$ 때문에 음수가 되고, 그것을 빼니 더하는 것이 돼요. 실수부분의 제곱과 허수부분의 제곱을 더해요.'],
      ['sq-sum', '실수부분과 허수부분을 더해서 제곱했어요. 각각 따로 제곱한 다음에 더해야 해요. 곱한 항은 서로 지워져서 남지 않아요.'],
      ['re-only', '실수부분의 제곱만 답했어요. $i$가 붙은 항의 제곱도 실수가 되어 남아요. 허수부분의 제곱을 더해요.'],
      ['half-sum', '$z + \\overline{z}$에서 실수부분을 한 번만 썼어요. 더하면 실수부분이 두 번 더해져요.'],
      ['sign-sum', '$z + \\overline{z}$를 더할 것을 빼거나, 뺄 것을 더했어요. 문제의 식에 쓰인 기호와 실수부분의 부호를 다시 확인해요.']],
    levels: [
      { name: '합 z + z̄', vars: { q: sampler(function (r) { return { f: 'sum', a: nz(r, -12, 12), b: nz(r, -12, 12) }; }) } },
      { name: '곱 z z̄', vars: { q: sampler(function (r) { return { f: r.pick(['prod', 'direct']), a: nz(r, -9, 9), b: nz(r, -9, 9) }; }) } },
      { name: '합과 곱이 섞인 식', vars: { q: sampler(function (r) { return { f: 'mix', a: nz(r, -8, 8), b: nz(r, -8, 8), s: pm(r, 1) }; }) } }
    ]
  });

  /* ── C04.div 나눗셈 ───────────────────────────────── */
  var DV_KEY = '복소수의 나눗셈은 분모에서 $i$를 없애는 것이 목표예요. 분모에 근호가 있을 때 유리화하던 것과 같은 생각이에요. 분모의 켤레복소수를 분모와 분자에 똑같이 곱해요. 같은 수를 위아래에 곱하는 것은 분수의 값을 바꾸지 않아요. 복소수와 켤레복소수를 곱하면 실수가 되니 분모에서 $i$가 사라져요.';
  var dvBuild = function (q) {
    var W = [q.p, q.q], D, N, n, Dc, tex, cands, steps, hints, top, div = function (u, k) { return k !== 0 && u % k === 0 ? u / k : NaN; };
    if (q.t === 'byi') {
      D = [0, q.k]; N = mul(W, D); tex = '\\dfrac{' + tx(N) + '}{' + tx(D) + '}'; top = mul(N, [0, 1]);
      cands = mixc([], [
        [[div(N[0], q.k), div(N[1], q.k)], 'ign-i', '분모의 $i$를 빼고 수로만 나눴어요. $i$로 나누는 것도 계산해야 해요. 분모와 분자에 $i$를 곱해서 분모를 실수로 만들어요.'],
        [[-W[0], -W[1]], 'den-sign', '부호가 모두 반대예요. 분모와 분자에 $i$를 곱하면 분모에 $i^{2}$이 생겨요. $i^{2} = -1$이라서 분모의 부호가 바뀌어요. 이 부호를 빠뜨렸어요.'],
        [conj(W), 'im-sign', '허수부분의 부호가 반대예요. 분자에 $i$를 곱할 때 $i^{2} = -1$로 바꾸는 것과, 분모의 부호로 나누는 것을 다시 확인해요.'],
        [[-W[0], W[1]], 're-sign', '실수부분의 부호가 반대예요. 분자에 $i$를 곱할 때 $i^{2} = -1$로 바꾸는 것과, 분모의 부호로 나누는 것을 다시 확인해요.']
      ], q.perm);
      steps = [{ say: '분모와 분자에 $i$를 곱해요. 분모에 $i^{2}$이 생겨 실수가 돼요.', tex: tex + ' = \\dfrac{' + pz(N) + ' \\times i}{' + tx(D) + ' \\times i} = \\dfrac{' + tx(top) + '}{' + (-q.k) + '}' },
        { say: '분자의 실수부분과 허수부분을 각각 분모로 나눠요.', tex: tx(W) }];
      hints = ['복소수의 나눗셈은 분모에서 $i$를 없애는 것이 목표예요. 분모에 근호가 있을 때 유리화하던 것과 같은 생각이에요. 분모가 $i$에 수가 곱해진 꼴이면 분모와 분자에 $i$를 한 번씩 곱해요. 같은 수를 위아래에 곱하는 것은 분수의 값을 바꾸지 않아요. $i$가 두 번 곱해지면 실수가 되니 분모에서 $i$가 사라져요.',
        '① 분모 $' + tx(D) + '$에 $i$를 곱하면 $i^{2}$이 생겨서 실수가 돼요. ② 분수의 값이 변하지 않도록 분자에도 $i$를 곱해요. 분자의 두 항에 모두 곱해요. ③ $i^{2}$은 모두 $-1$로 바꿔요.',
        '분모가 실수가 되면 분자의 실수부분과 허수부분을 각각 그 수로 나눠요. 분모가 음수가 되는 경우가 많으니 부호를 조심해요. 음수로 나누면 분자의 두 항의 부호가 모두 바뀌어요. 답에 처음의 분모를 곱해서 처음의 분자가 나오는지 확인해요.'];
      return finish({ text: '다음을 계산하세요.', tex: tex, ans: W, cands: cands, steps: steps, hints: hints, ok: W[0] !== 0 && W[1] !== 0 });
    }
    D = [q.c, q.d]; Dc = conj(D); n = q.c * q.c + q.d * q.d;
    if (q.t === 'real') W = sc(Dc, q.m);
    N = mul(W, D); tex = '\\dfrac{' + tx(N) + '}{' + tx(D) + '}'; top = mul(N, Dc);
    cands = mixc([[sc(W, n), 'not-divided', '분모와 분자에 켤레복소수를 곱한 다음, 분모에 생긴 실수로 나누지 않았어요. 분자의 실수부분과 허수부분을 각각 분모로 나눠요.']], [
      [conj(W), 'im-sign', '허수부분의 부호가 반대예요. 분모와 분자에 곱하는 수는 분모의 켤레복소수예요. 분모에서 허수부분의 부호만 바꾼 수를 곱했는지 확인해요.'],
      [[div(N[0], q.c), div(N[q.t === 'real' ? 0 : 1], q.d)], 'termwise', '분자를 분모의 실수부분과 허수부분으로 따로따로 나눴어요. 분모가 두 항의 합이면 그렇게 나눌 수 없어요. 분모의 켤레복소수를 위아래에 곱해서 분모를 실수 하나로 만들어요.'],
      [[-W[0], W[1]], 're-sign', '실수부분의 부호가 반대예요. 분자를 전개할 때 $i^{2}$이 든 항의 부호를 다시 확인해요. $i^{2} = -1$이에요.']
    ], q.perm).concat([[[-W[0], -W[1]], 'den-sign', '부호가 모두 반대예요. 분모는 실수부분의 제곱과 허수부분의 제곱을 더한 양수예요. 분모의 부호를 다시 확인해요.']]);
    steps = [{ say: '분모의 켤레복소수 $' + tx(Dc) + '$' + jz(tx(Dc), '을/를') + ' 분모와 분자에 곱해요.', tex: tex + ' = \\dfrac{' + (N[1] === 0 ? N[0] : pz(N)) + pz(Dc) + '}{' + pz(D) + pz(Dc) + '}' },
      { say: '분모는 합과 차의 곱이라 실수가 돼요. 분자는 전개하고 $i^{2}$을 $-1$로 바꿔요.', tex: '\\dfrac{' + tx(top) + '}{' + n + '}' },
      { say: '분자의 실수부분과 허수부분을 각각 분모로 나눠요.', tex: tx(W) }];
    hints = [DV_KEY,
      '① 분모 $' + tx(D) + '$의 켤레복소수는 $' + tx(Dc) + '$' + jz(tx(Dc), '이에요/예요') + '. 이것을 분모와 분자에 곱해요. ② 분모는 $(A + B)(A - B) = A^{2} - B^{2}$ 꼴이라, 실수부분의 제곱과 허수부분의 제곱을 더한 실수가 돼요. ③ 분자는 분배법칙으로 전개하고 $i^{2}$을 $-1$로 바꿔요.',
      '분모가 실수가 되면, 분자의 실수부분과 허수부분을 각각 그 수로 나눠요. 한쪽만 나누지 않도록 조심해요. 다 구한 다음 답에 처음의 분모를 곱해서 처음의 분자가 나오는지 확인해요.'];
    return finish({ text: '다음을 계산하세요.', tex: tex, ans: W, cands: cands, steps: steps, hints: hints,
      ok: W[0] !== 0 && W[1] !== 0 && abs(N[0]) <= 100 && abs(N[1]) <= 100 && (q.t === 'real' ? N[1] === 0 : N[0] !== 0 && N[1] !== 0) });
  };
  choiceQ({
    id: 'C04.div', title: '복소수의 나눗셈', build: dvBuild, ids: ['ign-i', 'den-sign', 'im-sign', 're-sign', 'not-divided', 'termwise'],
    levels: [
      { name: '분모가 i에 수를 곱한 꼴', vars: { q: sampler(function (r) { return wo(r, { t: 'byi', k: r.pick([1, -1, 2, -2, 3, -3, 4, 5]), p: nz(r, -9, 9), q: nz(r, -9, 9) }); }) } },
      { name: '분자가 실수', minDistinct: 250, vars: { q: sampler(function (r) { return wo(r, { t: 'real', c: nz(r, -4, 4), d: nz(r, -4, 4), m: nz(r, -5, 5) }); }) } },
      { name: '분자와 분모가 모두 복소수', vars: { q: sampler(function (r) { return wo(r, { t: 'full', c: nz(r, -3, 3), d: nz(r, -3, 3), p: nz(r, -5, 5), q: nz(r, -5, 5) }); }) } }
    ]
  });

  /* ── C04.ipow i 의 거듭제곱 ─────────────────────────────
     답이 1 이나 0 일 수 있어서 힌트에는 수 1, 0 을 쓰지 않는다(힌트가 답을 말하지 않게) */
  var IP_KEY = '$i$를 거듭 곱하면 네 가지 값이 차례로 되풀이돼요. $i$, $i^{2}$, $i^{3}$, $i^{4}$을 차례로 구해 보면, $i^{4}$에서 곱해도 값을 바꾸지 않는 수가 나와요. 그래서 $i^{5}$부터는 처음과 똑같이 되풀이돼요. 시계의 바늘이 한 바퀴 돌면 제자리로 오는 것처럼, 지수가 4만큼 늘 때마다 제자리로 돌아와요.';
  var IP_LAST = '$i^{2}$은 제곱해서 음수가 되는 수라는 약속에서 바로 나와요. $i^{3}$은 $i^{2}$에 $i$를 한 번 더 곱한 것이고, $i^{4}$은 $i^{2}$을 두 번 곱한 것이에요. 음수를 두 번 곱하면 양수가 된다는 것을 떠올려요. 부호를 하나씩 따라가며 계산해요.';
  var W_SIGN = '부호가 반대예요. $i^{2} = -1$이고 $i^{4} = 1$이에요. $i^{2}$을 1로 생각하면 부호가 뒤집혀요. $i$, $-1$, $-i$, $1$의 차례를 다시 따라가요.';
  var W_UP = '차례를 한 칸 더 갔어요. 지수를 4로 나눈 나머지를 다시 구해요. 나머지가 1이면 $i$, 2이면 $-1$, 3이면 $-i$, 나누어떨어지면 $1$이에요.';
  var W_DOWN = '차례를 한 칸 덜 갔어요. 지수를 4로 나눈 나머지를 다시 구해요. 나머지가 1이면 $i$, 2이면 $-1$, 3이면 $-i$, 나누어떨어지면 $1$이에요.';
  var pw = function (n) { return n === 0 ? '1' : n === 1 ? 'i' : 'i^{' + n + '}'; };
  var split4 = function (n) { var k = Math.floor(n / 4), r = n % 4; return n + ' = 4 \\times ' + k + (r ? ' + ' + r : ''); };
  var ipBuild = function (q) {
    var n = q.n, m = q.m, k = Math.floor(n / 4), r = n % 4, ans, x, y, steps, S = function (t) { var z = [0, 0], j; for (j = 1; j <= t; j++) z = add(z, ipw(j)); return z; }, tex, fours;
    if (q.t === 'run') {
      ans = S(n); tex = 'i + i^{2} + i^{3} + \\cdots + i^{' + n + '}';
      var COUNT = '남는 항의 개수를 잘못 셌어요. 네 개씩 묶으면 합이 0이라서 모두 지워져요. 항의 개수를 4로 나눈 나머지만큼만 앞에서부터 더해요.';
      return finish({ text: '다음을 간단히 하세요.', tex: tex, ans: ans,
        cands: [[S(n + 1), 'shift-up', COUNT], [S(n + 3), 'shift-down', COUNT], [S(n + 2), 'sign', COUNT]],
        steps: [{ say: '앞에서부터 네 개를 더하면 서로 지워져요.', tex: 'i + i^{2} + i^{3} + i^{4} = i - 1 - i + 1 = 0' },
          { say: '항은 모두 $' + n + '$개예요. 네 개씩 묶고 남는 항의 개수를 구해요.', tex: split4(n) },
          { say: r === 0 ? '남는 항이 없어요. 모두 지워져요.' : '남는 항 $' + r + '$개의 합은 앞에서부터 $' + r + '$개를 더한 것과 같아요.', tex: r === 0 ? '0' : r === 1 ? 'i' : r === 2 ? 'i + i^{2} = -1 + i' : 'i + i^{2} + i^{3} = i - 1 - i = -1' }],
        hints: ['$i$, $i^{2}$, $i^{3}$, $i^{4}$을 차례로 더하면 서로 지워져서 아무것도 남지 않아요. 부호가 반대인 것끼리 짝을 이루기 때문이에요. 그다음 네 개도 같은 값이 되풀이되니 똑같이 지워져요. 그래서 앞에서부터 네 개씩 묶어 버리고, 묶이지 않고 남는 항만 계산하면 돼요.',
          '① 더하는 항은 모두 $' + n + '$개예요. ② $' + n + '$' + pj(n, '을/를') + ' 4로 나눈 나머지가 남는 항의 개수예요. ③ 남는 항은 $i$부터 차례로 그 개수만큼 더한 것과 값이 같아요.',
          '남는 항을 계산할 때는 $i^{2}$과 $i^{3}$의 값을 정확히 써요. $i^{2}$은 음수인 실수이고, $i^{3}$은 거기에 $i$를 한 번 더 곱한 것이에요. 남는 항이 하나도 없으면 전체 합은 아무것도 남지 않은 값이에요.'] });
    }
    if (q.t === 'two') {
      x = ipw(m); y = ipw(n); ans = add(x, y); tex = 'i^{' + m + '} + i^{' + n + '}';
      return finish({ text: '다음을 간단히 하세요.', tex: tex, ans: ans, ok: ans[1] !== 0 && m !== n,
        cands: mixc([], [[add(sc(x, -1), y), 'sign', W_SIGN], [add(mul(x, [0, 1]), y), 'shift-up', W_UP], [add(x, mul(y, [0, -1])), 'shift-down', W_DOWN]], q.perm).concat([[sc(ans, -1), 'both', '두 항의 부호가 모두 반대예요. $i^{2} = -1$이고 $i^{4} = 1$이에요. $i$, $-1$, $-i$, $1$의 차례를 다시 따라가요.']]),
        steps: [{ say: '두 지수를 각각 4로 나눠 나머지를 구해요.', tex: split4(m) + ',\\quad ' + split4(n) },
          { say: '나머지로 각 항의 값을 구해요. 나머지가 1이면 $i$, 2이면 $-1$, 3이면 $-i$, 나누어떨어지면 $1$이에요.', tex: 'i^{' + m + '} = ' + tx(x) + ',\\quad i^{' + n + '} = ' + tx(y) },
          { say: '두 값을 더해요.', tex: tex + ' = ' + tx(ans) }],
        hints: [IP_KEY,
          '① 두 지수 $' + m + '$, $' + n + '$' + pj(n, '을/를') + ' 각각 4로 나눈 나머지를 구해요. ② 나머지가 같으면 값도 같아요. 나머지로 각 항의 값을 정해요. ③ 두 값을 더해요. 실수는 실수끼리, $i$가 붙은 수는 그것끼리 모아요.', IP_LAST] });
    }
    ans = ipw(n); tex = 'i^{' + n + '}'; fours = k === 1 ? 'i^{4}' : '(i^{4})^{' + k + '}';
    if (k === 0) steps = n === 2 ? [{ say: '$i$를 두 번 곱한 것이에요.', tex: 'i^{2} = i \\times i' }, { say: '$i$는 제곱하면 $-1$이 되는 수예요.', tex: 'i^{2} = -1' }]
      : [{ say: '$i$를 세 번 곱한 것이에요. $i^{2}$에 $i$를 한 번 더 곱해요.', tex: 'i^{3} = i^{2} \\times i' }, { say: '$i^{2} = -1$을 넣어요.', tex: 'i^{3} = -1 \\times i = -i' }];
    else {
      steps = [{ say: '지수를 4로 나눠 몫과 나머지를 구해요.', tex: split4(n) },
        { say: '$i^{4} = 1$이라서 네 개씩 묶인 부분은 1이에요. ' + (r ? '나머지만큼만 남아요.' : '나머지가 없으니 1만 남아요.'), tex: tex + ' = ' + fours + (r ? ' \\times ' + pw(r) : '') + ' = ' + pw(r) }];
      if (r === 2) steps.push({ say: '$i$는 제곱하면 $-1$이 되는 수예요.', tex: 'i^{2} = -1' });
      if (r === 3) steps.push({ say: '$i^{2} = -1$에 $i$를 한 번 더 곱해요.', tex: 'i^{3} = i^{2} \\times i = -i' });
    }
    return finish({ text: '다음을 간단히 하세요.', tex: tex, ans: ans, steps: steps,
      cands: mixc([], [[ipw(n + 2), 'sign', W_SIGN], [ipw(n + 1), 'shift-up', W_UP], [ipw(n + 3), 'shift-down', W_DOWN]], q.perm),
      hints: [IP_KEY,
        '① 지수 $' + n + '$' + pj(n, '을/를') + ' 4로 나눈 나머지를 구해요. ② 4개씩 묶인 부분은 곱해도 값을 바꾸지 않으니 버려요. ③ 나머지만큼만 $i$를 곱한 것과 같아요. 나머지가 없으면 $i^{4}$과 같아요.', IP_LAST] });
  };
  choiceQ({
    id: 'C04.ipow', title: 'i의 거듭제곱', build: ipBuild, ids: ['sign', 'shift-up', 'shift-down', 'both'],
    levels: [
      { name: '작은 지수', minDistinct: 19, vars: { q: sampler(function (r) { return wo(r, { t: 'one', n: r.int(2, 20) }); }) } },
      { name: '큰 지수', minDistinct: 170, vars: { q: sampler(function (r) { return wo(r, { t: 'one', n: r.int(21, 199) }); }) } },
      { name: '거듭제곱의 합', vars: { q: sampler(function (r) {
        if (r.int(0, 3) === 0) return wo(r, { t: 'run', n: r.int(5, 99) });
        return wo(r, { t: 'two', m: r.int(5, 60), n: r.int(5, 60) });
      }) } }
    ]
  });

  /* ── C04.sqrtneg 음수의 제곱근 ───────────────────────── */
  var SQ_KEY = '제곱해서 음수가 되는 실수는 없어요. 그래서 제곱하면 $-1$이 되는 새로운 수를 약속하고 $i$라고 불러요. $i = \\sqrt{-1}$이에요. 근호 안이 음수이면 그 음수를 $-1$과 양수의 곱으로 보고, $\\sqrt{-1}$을 $i$로 바꿔 써요. 예를 들어 $\\sqrt{-25}$는 $\\sqrt{25}$에 $i$를 붙인 수예요.';
  var rt = function (n) { return '\\sqrt{' + n + '}'; };
  var W_NOI = '근호 안의 빼기 기호를 무시했어요. 근호 안이 음수이면 실수가 아니에요. 빼기 기호를 떼어 내는 대신 $i$를 붙여요.';
  var W_NEG = '$i$를 쓰지 않고 음수로 답했어요. 근호 안의 빼기 기호는 근호 밖으로 나오면 $i$가 돼요. 음수의 제곱근은 음수가 아니라 허수예요.';
  var W_ROOT = '근호 안의 수를 그대로 썼어요. 근호를 풀어야 해요. 제곱해서 그 수가 되는 양수를 찾아 $i$ 앞에 써요. 9이면 3, 16이면 4예요.';
  var sqBuild = function (q) {
    var a = q.a, b = q.b, c = q.c, s = q.s, f = q.f, ans, tex, v;
    if (f === 'one') {
      v = s * a; ans = [0, v]; tex = (s < 0 ? '-' : '') + rt(-a * a);
      return finish({ text: '다음 수를 허수단위 $i$를 써서 나타내세요.', tex: tex, ans: ans,
        cands: mixc([], [[[-v, 0], 'real-neg', W_NEG], [[v, 0], 'no-i', W_NOI], a >= 2 ? [[0, s * a * a], 'not-rooted', W_ROOT] : null, [[0, -v], 'sign', '부호가 반대예요. 근호 앞에 빼기 기호가 있는지 확인해요. 근호 안의 빼기 기호는 $i$가 되고, 근호 앞의 빼기 기호는 그대로 남아요.']], q.perm),
        steps: [{ say: '근호 안의 음수를 $-1$과 양수의 곱으로 봐요. $\\sqrt{-1}$을 $i$로 바꿔요.', tex: tex + ' = ' + (s < 0 ? '-' : '') + rt(a * a) + '\\,i' },
          { say: '남은 근호를 풀어요. 제곱해서 $' + a * a + '$' + pj(a * a, '이/가') + ' 되는 양수를 써요.', tex: tx(ans) }],
        hints: [SQ_KEY,
          '① 근호 안의 수 $' + (-a * a) + '$에서 빼기 기호를 떼어 $i$로 바꿔요. ② 남은 양수 $' + a * a + '$의 제곱근을 구해요. 제곱해서 $' + a * a + '$' + pj(a * a, '이/가') + ' 되는 양수예요. ③ 그 수에 $i$를 붙여요. 근호 앞에 빼기 기호가 있으면 그대로 앞에 둬요.',
          '답에는 근호가 남지 않아요. 근호 안의 수를 그대로 $i$ 앞에 쓰지 않도록 조심해요. $i$를 빠뜨리고 음수로 쓰는 것도 흔한 실수예요. 근호 안의 빼기 기호는 수를 음수로 만드는 것이 아니라 $i$가 된다는 것을 기억해요.'] });
    }
    if (f === 'mul') {
      ans = [-a * b, s * c]; tex = rt(-a * a) + ' \\times ' + rt(-b * b) + (s < 0 ? ' - ' : ' + ') + rt(-c * c);
      return finish({ text: '다음을 계산하세요.', tex: tex, ans: ans,
        cands: mixc([[[a * b, s * c], 'neg-lost', '근호 안의 음수끼리 먼저 곱해서 양수로 만들었어요. $\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$는 근호 안이 양수일 때 쓰는 규칙이에요. 음수이면 $i$로 먼저 바꾸고 곱해요. $i \\times i = -1$이라서 곱은 음수예요.']], [
          [[a * b + s * c, 0], 'no-i', W_NOI],
          [[0, a * b + s * c], 'i2-as-i', '$i \\times i$를 $i$로 썼어요. $i$를 두 번 곱하면 $i^{2}$이고, 이것은 $-1$이에요. 곱한 항은 $i$가 사라지고 음수인 실수가 돼요.'],
          [[-a * b, -s * c], 'sign', '뒤의 항의 부호가 반대예요. 근호 앞에 놓인 더하기와 빼기 기호를 다시 확인해요.']
        ], q.perm),
        steps: [{ say: '곱하기 전에 근호를 하나씩 $i$가 붙은 수로 바꿔요.', tex: rt(-a * a) + ' = ' + cx(0, a) + ',\\quad ' + rt(-b * b) + ' = ' + cx(0, b) + ',\\quad ' + rt(-c * c) + ' = ' + cx(0, c) },
          { say: '곱셈을 먼저 해요. $i \\times i = i^{2} = -1$이라서 곱은 음수인 실수가 돼요.', tex: cx(0, a) + ' \\times ' + cx(0, b) + ' = ' + line([[a * b, 'i^{2}']]) + ' = ' + (-a * b) },
          { say: '뒤의 항을 이어서 써요. 실수와 $i$가 붙은 수는 합치지 않아요.', tex: tx(ans) }],
        hints: [SQ_KEY,
          '① 곱하기 전에 근호 안이 음수인 것을 모두 $i$가 붙은 수로 바꿔요. 첫째 근호 $' + rt(-a * a) + '$에서는 제곱해서 $' + a * a + '$' + pj(a * a, '이/가') + ' 되는 양수에 $i$를 붙여요. ② 그다음에 곱해요. $i$가 두 번 곱해지면 $i^{2}$이 되고, 이것은 $-1$이에요. ③ 곱한 결과는 실수가 돼요. 뒤의 항은 $i$가 붙은 수이니 따로 둬요.',
          '근호 안의 음수끼리 먼저 곱해서 양수로 만들면 틀려요. $\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$는 근호 안이 양수일 때 쓰는 규칙이에요. 근호 안이 둘 다 음수이면 반드시 $i$로 먼저 바꿔요. 그러면 곱의 부호가 음수가 돼요.'] });
    }
    if (f === 'mixed') {
      ans = [c, s * a]; tex = rt(c * c) + (s < 0 ? ' - ' : ' + ') + rt(-a * a);
      return finish({ text: '다음을 계산하세요.', tex: tex, ans: ans,
        cands: mixc([], [[[c + s * a, 0], 'no-i', W_NOI], [[c - s * a, 0], 'real-neg', W_NEG], a >= 2 ? [[c, s * a * a], 'not-rooted', W_ROOT] : null, [[0, c + s * a], 'lumped', '실수와 $i$가 붙은 수를 한데 합쳤어요. 근호 안이 양수인 것은 실수이고, 음수인 것만 $i$가 붙어요. 둘은 합치지 않고 나란히 써요.'], [[c, -s * a], 'sign', IM_SIGN]], q.perm),
        steps: [{ say: '근호를 하나씩 풀어요. 근호 안이 양수이면 실수, 음수이면 $i$가 붙은 수예요.', tex: rt(c * c) + ' = ' + c + ',\\quad ' + rt(-a * a) + ' = ' + cx(0, a) },
          { say: '실수와 $i$가 붙은 수는 합치지 않고 $a + bi$ 꼴로 나란히 써요.', tex: tx(ans) }],
        hints: [SQ_KEY,
          '① 근호를 하나씩 따로 봐요. $' + rt(c * c) + '$' + pj(c * c, '은/는') + ' 근호 안이 양수이니 실수예요. ② $' + rt(-a * a) + '$' + pj(a * a, '은/는') + ' 근호 안이 음수이니, 제곱해서 $' + a * a + '$' + pj(a * a, '이/가') + ' 되는 양수에 $i$를 붙여요. ③ 실수는 실수부분에, $i$가 붙은 수는 허수부분에 놓아요.',
          '근호 안의 수끼리 먼저 더하거나 빼면 안 돼요. 근호는 하나씩 따로 풀어야 해요. $i$가 붙은 수와 실수는 한데 합칠 수 없으니 따로 둬요. 빼기 기호가 근호 앞에 있는지 근호 안에 있는지도 구별해요.'] });
    }
    v = a + s * b; ans = [0, v]; tex = rt(-a * a) + (s < 0 ? ' - ' : ' + ') + rt(-b * b);
    return finish({ text: '다음을 계산하세요.', tex: tex, ans: ans, ok: v !== 0,
      cands: mixc([], [[[v, 0], 'no-i', W_NOI], [[-v, 0], 'real-neg', W_NEG], [[0, a * a + s * b * b], 'not-rooted', W_ROOT], [[0, a - s * b], 'op', '더하기와 빼기를 바꿔 계산했어요. 두 근호 사이의 기호를 다시 확인해요.'], [[0, -v], 'sign', IM_SIGN]], q.perm),
      steps: [{ say: '근호를 하나씩 $i$가 붙은 수로 바꿔요.', tex: rt(-a * a) + ' = ' + cx(0, a) + ',\\quad ' + rt(-b * b) + ' = ' + cx(0, b) },
        { say: '$i$가 붙은 수끼리 계산해요. $i$ 앞의 수끼리 더하거나 빼요.', tex: cx(0, a) + (s < 0 ? ' - ' : ' + ') + cx(0, b) + ' = ' + tx(ans) }],
      hints: [SQ_KEY,
        '① 근호를 하나씩 따로 봐요. 첫째 근호 $' + rt(-a * a) + '$에서는 제곱해서 $' + a * a + '$' + pj(a * a, '이/가') + ' 되는 양수에 $i$를 붙여요. ② 둘째 근호도 같은 방법으로 $i$가 붙은 수로 바꿔요. ③ 이제 동류항 계산이에요. $i$ 앞의 수끼리 더하거나 빼요.',
        '근호 안의 수끼리 먼저 더하거나 빼면 안 돼요. 근호는 하나씩 따로 풀어야 해요. 두 수 모두 $i$가 붙어 있으니 답에도 $i$가 붙어요. $i$를 빠뜨리지 않도록 조심해요. 빼기 기호가 근호 앞에 있는지 근호 안에 있는지도 구별해요.'] });
  };
  choiceQ({
    id: 'C04.sqrtneg', title: '음수의 제곱근', build: sqBuild, ids: ['real-neg', 'no-i', 'not-rooted', 'sign', 'op', 'lumped', 'neg-lost', 'i2-as-i'],
    levels: [
      { name: 'i를 써서 나타내기', minDistinct: 22, vars: { q: sampler(function (r) { return wo(r, { f: 'one', a: r.int(1, 12), s: pm(r, 1) }); }) } },
      { name: '덧셈과 뺄셈', vars: { q: sampler(function (r) {
        if (r.int(0, 1)) return wo(r, { f: 'mixed', c: r.int(2, 12), a: r.int(1, 12), s: pm(r, 1) });
        return wo(r, { f: 'sum', a: r.int(1, 12), b: r.int(1, 12), s: pm(r, 1) });
      }) } },
      { name: '음수의 제곱근끼리의 곱', vars: { q: sampler(function (r) { return wo(r, { f: 'mul', a: r.int(1, 9), b: r.int(1, 9), c: r.int(1, 9), s: pm(r, 1) }); }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('C04', [
  { title: '제곱해서 −1이 되는 수, i', body: [
    '실수는 제곱하면 0이거나 양수예요. 양수도 음수도 두 번 곱하면 양수가 되기 때문이에요. 그래서 $x^{2} = -1$을 만족하는 실수는 없어요.',
    '수학에서는 이럴 때 수의 범위를 넓혀 왔어요. 뺄셈을 하려고 음수를, 나눗셈을 하려고 분수를, 넓이가 2인 정사각형의 한 변을 재려고 $\\sqrt{2}$를 만들었어요. 이번에는 제곱해서 $-1$이 되는 수를 새로 약속해요.',
    { tex: 'i^{2} = -1,\\quad i = \\sqrt{-1}' },
    '이 수 $i$를 허수단위라고 해요. 수직선 위에는 없는 수이지만, 문자처럼 계산하면 돼요. 다른 점은 하나뿐이에요. $i^{2}$이 나오면 $-1$로 바꿔요.'
  ] },
  { title: '복소수 a + bi', body: [
    '실수 $a$, $b$로 $a + bi$ 꼴로 쓴 수를 복소수라고 해요. $a$를 실수부분, $b$를 허수부분이라고 해요. 허수부분은 $i$를 뺀 수만 말해요.',
    { ex: [['3 - 2i', '실수부분 3, 허수부분 −2'], ['5', '5 + 0i. 실수도 복소수예요'], ['-4i', '0 − 4i. 실수부분이 0인 순허수'], ['2 + i', '허수부분은 1 (i = 1 × i)']] },
    '두 복소수가 같다는 것은 실수부분끼리 같고 허수부분끼리도 같다는 뜻이에요. 실수와 허수는 서로 섞이지 않아요.',
    { ex: [['(x + 1) + (y - 2)i = 4 + 3i', 'x, y가 실수일 때'], ['x + 1 = 4,\\quad y - 2 = 3', '식 하나가 식 두 개가 돼요']] }
  ] },
  { title: '더하기, 빼기, 곱하기', body: [
    '덧셈과 뺄셈은 동류항 계산과 같아요. 실수는 실수끼리, $i$가 붙은 수는 $i$가 붙은 수끼리 모아요. 사과와 귤을 따로 세는 것과 같아요.',
    { ex: [['(3 + 2i) + (1 - 5i) = 4 - 3i', '3 + 1 = 4, 2 − 5 = −3'], ['(3 + 2i) - (1 - 5i) = 2 + 7i', '빼는 괄호는 부호가 모두 바뀌어요']] },
    '곱셈은 분배법칙으로 전개해요. $i^{2}$이 생기면 $-1$로 바꿔요.',
    { ex: [['(2 + 3i)(1 - 2i)', '네 항을 모두 곱해요'], ['2 - 4i + 3i - 6i^{2}', '끝 항에 i의 제곱이 생겨요'], ['2 - 4i + 3i + 6', 'i의 제곱은 −1이니 부호가 바뀌어 +6'], ['8 - i', '실수끼리, i가 붙은 수끼리 모아요']] }
  ] },
  { title: '켤레복소수', body: [
    '허수부분의 부호만 반대로 바꾼 복소수를 켤레복소수라고 해요. $z$의 켤레복소수는 위에 줄을 그어 $\\overline{z}$로 써요. 호수에 비친 산처럼, 위아래만 뒤집힌 짝이에요.',
    { ex: [['\\overline{3 + 2i} = 3 - 2i', 'i가 붙은 항의 부호만 바꿔요'], ['\\overline{-4i} = 4i', '순허수는 부호가 반대'], ['\\overline{5} = 5', '실수는 자기 자신']] },
    '복소수와 켤레복소수를 더하거나 곱하면 언제나 실수가 돼요.',
    { ex: [['(3 + 2i) + (3 - 2i) = 6', '허수부분이 지워져요'], ['(3 + 2i)(3 - 2i) = 9 - 4i^{2} = 13', '합과 차의 곱. 3² + 2²']] },
    '곱이 실수가 된다는 점이 나눗셈에서 쓰여요.'
  ] },
  { title: '나눗셈: 분모를 실수로', body: [
    '복소수의 나눗셈은 분모에서 $i$를 없애는 것이 목표예요. 분모에 근호가 있을 때 유리화하던 것과 같은 생각이에요.',
    '분모의 켤레복소수를 분모와 분자에 똑같이 곱해요. 위아래에 같은 수를 곱하면 값이 변하지 않고, 분모는 실수가 돼요.',
    { ex: [['\\dfrac{5 + 5i}{1 + 2i}', '분모의 켤레복소수는 1 − 2i'], ['\\dfrac{(5 + 5i)(1 - 2i)}{(1 + 2i)(1 - 2i)}', '위아래에 똑같이 곱해요'], ['\\dfrac{15 - 5i}{5}', '분모는 1² + 2² = 5'], ['3 - i', '실수부분과 허수부분을 각각 나눠요']] },
    '분모가 $2i$처럼 $i$에 수가 곱해진 꼴이면 위아래에 $i$만 곱해도 돼요. 분모에 $i^{2}$이 생겨 실수가 돼요.'
  ] },
  { title: 'i의 거듭제곱과 음수의 제곱근', body: [
    '$i$를 거듭 곱하면 네 가지 값이 차례로 되풀이돼요. 시계의 바늘처럼 네 번 만에 제자리로 돌아와요.',
    { ex: [['i^{1} = i', '나머지 1'], ['i^{2} = -1', '나머지 2'], ['i^{3} = -i', '나머지 3'], ['i^{4} = 1', '나누어떨어짐']] },
    '지수가 크면 4로 나눈 나머지만 보면 돼요. $i^{27}$은 $27 = 4 \\times 6 + 3$이니 $i^{3}$과 같아요.',
    '근호 안이 음수이면 $\\sqrt{-1}$을 $i$로 바꿔 써요.',
    { ex: [['\\sqrt{-9} = 3i', '제곱해서 9가 되는 양수에 i를 붙여요'], ['\\sqrt{-4} \\times \\sqrt{-9} = 2i \\times 3i = -6', 'i로 먼저 바꾸고 곱해요']] },
    '근호 안의 음수끼리 먼저 곱해 $\\sqrt{36} = 6$이라고 하면 틀려요. 음수의 제곱근은 반드시 $i$로 먼저 바꿔요.'
  ] }
]);
