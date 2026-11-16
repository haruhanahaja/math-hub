/* B05 문자의 사용과 식의 값 — 곱셈 · 나눗셈 기호 생략, 식의 값 대입
   유형(쉬운 것부터): B05.omit 곱셈 기호 생략 · B05.div 나눗셈 기호 생략 · B05.word 문자를 사용한 식
                     · B05.value 식의 값 · B05.value2 거듭제곱 · 두 문자의 식의 값
   앞의 세 유형은 보기 고르기(choice)다. 보기는 [정답].concat(틀린 보기) 를 v.q.o 순서로 섞는다.
   틀린 보기마다 실수 id 가 있어서, 고른 보기에 맞는 설명이 나온다.
   식의 값은 항의 목록으로 계산하고(solve), 검산은 화면의 식을 다시 읽는 계산기(ev)로 한다.
   식의 값 힌트에는 문제에 없는 숫자를 쓰지 않는다(답이 드러날 수 있다). */
(function () {
  'use strict';
  var MH = globalThis.MH, F = MH.F, josa = MH.josa;
  var abs = Math.abs;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var CNT = ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
  var isNum = function (x) { return typeof x === 'number'; };
  var isLetter = function (x) { return typeof x === 'string' && /^[a-z]$/.test(x); };

  /* ── 식 읽기: 문자에 수를 넣어 식의 값을 구한다(붙여 쓴 곱셈, 분수 꼴, 거듭제곱을 읽는다) ── */
  var ev = function (tex, env) {
    var s = tex.replace(/\\left|\\right/g, '').replace(/\^\{(\d+)\}/g, '^$1'), prev, i = 0;
    do { prev = s; s = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'); } while (s !== prev);
    s = s.replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\s/g, '');
    var atom = function () {
      var c = s[i] || '';
      if (c === '(') { i++; var x = expr(); if (s[i] !== ')') throw new Error('괄호: ' + tex); i++; return x; }
      var m = /^\d+(?:\.(\d+))?/.exec(s.slice(i));
      if (m) { i += m[0].length; return F(Number(m[0].replace('.', '')), MH.pow10((m[1] || '').length)); }
      if (/[a-z]/.test(c) && env[c] !== undefined) { i++; return env[c]; }
      throw new Error('읽을 수 없는 식: ' + tex);
    };
    var power = function () {
      var x = atom();
      if (s[i] !== '^') return x;
      var m = /^\^(\d+)/.exec(s.slice(i)), y = F(1);
      i += m[0].length;
      for (var k = 0; k < Number(m[1]); k++) y = y.mul(x);
      return y;
    };
    var factor = function () { var x = power(); while (i < s.length && /[a-z0-9(]/.test(s[i])) x = x.mul(power()); return x; };
    var unary = function () { if (s[i] === '-') { i++; return unary().neg(); } if (s[i] === '+') { i++; return unary(); } return factor(); };
    var term = function () { var x = unary(); while (s[i] === '*' || s[i] === '/') { var op = s[i++], y = unary(); x = op === '*' ? x.mul(y) : x.div(y); } return x; };
    var expr = function () { var x = term(); while (s[i] === '+' || s[i] === '-') { var op = s[i++], y = term(); x = op === '+' ? x.add(y) : x.sub(y); } return x; };
    var out = expr();
    if (i !== s.length) throw new Error('읽다 만 식: ' + tex);
    return out;
  };
  var E1 = {}, E2 = {};
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function (l, i) { E1[l] = F(2 * i + 3); E2[l] = F(-(i + 2), i + 7); });
  var val2 = function (tex) { try { return [ev(tex, E1), ev(tex, E2)]; } catch (e) { return null; } };
  /** 두 식이 같은 값인가(문자에 두 가지 수를 넣어 본다) */
  var sameVal = function (a, b) { var x = val2(a), y = val2(b); return !!x && !!y && x[0].equals(y[0]) && x[1].equals(y[1]); };
  /* 값은 같지만 쓰는 약속을 어긴 보기(수를 뒤에 씀, 1 을 씀, 같은 문자를 나란히 씀, 0.a) */
  var FORM = { 'num-last': 1, one: 1, 'no-power': 1, 'zero-point': 1 };

  /* ── 식을 약속대로 쓰기 ── */
  /** 문자들을 알파벳 순서로, 같은 문자는 거듭제곱으로: ['x', 'y', 'x'] → 'x^{2}y' */
  var lets = function (list) {
    var cnt = {};
    list.forEach(function (l) { cnt[l] = (cnt[l] || 0) + 1; });
    return Object.keys(cnt).sort().map(function (l) { return l + (cnt[l] > 1 ? '^{' + cnt[l] + '}' : ''); }).join('');
  };
  /** 수 n 과 문자들의 곱: mono(-1, ['a', 'b']) → '-ab', mono(3, ['x'], '(a+b)') → '3x(a+b)' */
  var mono = function (n, list, tail) {
    var body = lets(list) + (tail || '');
    return (n < 0 ? '-' : '') + (abs(n) !== 1 || !body ? abs(n) : '') + body;
  };
  /** 수와 문자가 섞인 목록의 곱(부호 없이): [3, 'a', 'b'] → '3ab' */
  var sideT = function (items) {
    var n = 1;
    items.filter(isNum).forEach(function (x) { n *= abs(x); });
    return mono(n, items.filter(isLetter));
  };
  var fr = function (neg, top, bot) { return (neg ? '-' : '') + '\\frac{' + sideT(top) + '}{' + sideT(bot) + '}'; };
  var numT = function (x) { return isNum(x) && x < 0 ? '(' + x + ')' : String(x); };
  var mulT = function (items) { return items.map(numT).join(' \\times '); };
  var big = function (t) { return t.replace(/\\frac/g, '\\dfrac'); };

  /* ── 보기 고르기 유형의 공통 틀 ──
     o.build(q) → { raw: 기호를 생략하기 전의 식, ans, wrong: [[보기, 실수 id, 설명(없으면 o.explain[id])] …], … } */
  var choiceType = function (o) {
    var P = function (v) { return o.build(v.q); };
    var optionsOf = function (v) {
      var p = P(v), all = [p.ans].concat(p.wrong.map(function (w) { return w[0]; }));
      return v.q.o.filter(function (i) { return i < all.length; }).map(function (i) { return all[i]; });
    };
    var find = function (v, id) { return P(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
    MH.defineType({
      id: o.id, unit: 'B05', version: 1, title: o.title,
      answer: { kind: 'choice', options: optionsOf },
      levels: o.levels,
      prompt: function (v) { return o.prompt(P(v)); },
      solve: function (v) { return P(v).ans; },
      /* 검산: 정답 보기는 원래 식과 값이 같고, 틀린 보기는 값이 다르거나 쓰는 약속을 어긴 것이다 */
      verify: function (v, ans) {
        var p = P(v), opts = optionsOf(v);
        return sameVal(p.raw, p.ans) && ans === p.ans && opts.indexOf(ans) >= 0 && opts.every(function (x, i) { return opts.indexOf(x) === i; })
          && p.wrong.every(function (w) { return w[0] !== p.ans && (FORM[w[1]] ? true : !sameVal(w[0], p.ans)); });
      },
      hints: function (v) { return o.hints(P(v)); },
      steps: function (v) { return o.steps(P(v)); },
      mistakes: o.ids.map(function (id) {
        return { id: id, wrong: function (v) { var w = find(v, id); return w ? w[0] : null; },
          explain: function (v) { var w = find(v, id); return w ? (w[2] || o.explain[id](P(v))) : ''; } };
      })
    });
  };
  var order4 = function (r) { return r.shuffle([0, 1, 2, 3]); };
  var PAIRS = [['a', 'b'], ['x', 'y'], ['a', 'x'], ['b', 'c'], ['y', 'z'], ['m', 'n'], ['p', 'q'], ['a', 'y'], ['b', 'x']];
  var ONES = ['a', 'b', 'x', 'y', 'm', 'n', 'p', 't'];
  var num29 = function (r, negRate) { var n = r.int(2, 9); return r.int(1, 100) <= negRate ? -n : n; };

  /* ── B05.omit 곱셈 기호 생략 ───────────────────────────
     v.q = { it: [식에 나오는 차례대로: 수 | 문자 | '0.1' | '(x + y)'], o: 보기 순서 } */
  var omitBuild = function (q) {
    var it = q.it, nums = it.filter(isNum), n = nums.length ? nums[0] : null;
    var dec = it.filter(function (x) { return typeof x === 'string' && /^0\./.test(x); })[0] || null;
    var grp = it.filter(function (x) { return typeof x === 'string' && x[0] === '('; })[0] || null;
    var L = it.filter(isLetter).sort(), uniq = L.filter(function (l, i) { return L.indexOf(l) === i; });
    var base = lets(L), rep = uniq.length < L.length, ans, wrong, k;
    if (dec) {
      k = 'dec'; ans = dec + base;
      wrong = [[dec.replace(/1$/, '') + base, 'zero-point'], [base + '+' + dec, 'added'], [base + dec, 'num-last']];
    } else if (grp) {
      var m = /^\((\w) ([+-]) (\w)\)$/.exec(grp), g = '(' + m[1] + m[2] + m[3] + ')';
      k = 'grp'; ans = mono(n, L, g);
      wrong = [[mono(n, L.concat([m[1]])) + m[2] + m[3], 'no-paren'],
        abs(n) === 1 ? [(n < 0 ? '-1' : '1') + base + g, 'one'] : [base + g + n, 'num-last'],
        [mono(n, L.concat([m[1], m[3]])), 'into-product']];
    } else if (rep) {
      var twice = uniq.filter(function (l) { return L.indexOf(l) !== L.lastIndexOf(l); })[0], times = L.filter(function (l) { return l === twice; }).length;
      var other = uniq.filter(function (l) { return l !== twice; })[0];
      k = 'rep'; ans = mono(n === null ? 1 : n, L);
      wrong = [[(n === null || abs(n) === 1 ? (n < 0 ? '-' : '') : String(n)) + L.join(''), 'no-power'], [mono((n === null ? 1 : n) * times, uniq), 'doubled']];
      if (n !== null && abs(n) !== 1) wrong.push([base + n, 'num-last']);
      else if (n !== null) wrong.push([(n < 0 ? '-1' : '1') + base, 'one']);
      else if (other) wrong.push([[twice, other + '^{' + times + '}'].sort().join(''), 'pow-letter']);
      else wrong.push([twice + '+' + times, 'added']);
    } else if (abs(n) === 1) {
      k = 'one'; ans = mono(n, L);
      wrong = n < 0 ? [['-1' + base, 'one'], [base + '-1', 'num-last'], [base, 'sign']] : [['1' + base, 'one'], [base + '+1', 'added'], [base + '1', 'num-last']];
    } else {
      k = 'num'; ans = mono(n, L);
      wrong = n < 0 ? [[base + n, 'num-last'], [mono(-n, L), 'sign'], [n + '+' + base, 'added']]
        : [[base + n, 'num-last'], [L.join('+') + '+' + n, 'added'], [L.slice(0, -1).join('') + L[L.length - 1] + '^{' + n + '}', 'power']];
    }
    var sorted = (dec ? [dec] : n !== null ? [n] : []).concat(L).concat(grp ? [grp] : []);
    return { raw: mulT(it), ans: ans, wrong: wrong, k: k, n: n, dec: dec, grp: grp, L: L, uniq: uniq, rep: rep, sorted: mulT(sorted), moved: mulT(sorted) !== mulT(it) };
  };
  var withLetters = function (r, count) { var p = r.pick(PAIRS); return count === 1 ? [r.pick(p)] : p.slice(); };
  choiceType({
    id: 'B05.omit', title: '곱셈 기호 생략', build: omitBuild,
    ids: ['num-last', 'added', 'power', 'sign', 'one', 'no-power', 'doubled', 'pow-letter', 'no-paren', 'into-product', 'zero-point'],
    levels: [
      { name: '수와 문자의 곱', minDistinct: 200, vars: { q: sampler(function (r) {
          return { it: r.shuffle(withLetters(r, r.int(1, 2)).concat([num29(r, 40)])), o: order4(r) };
        }) } },
      { name: '1, −1과 같은 문자의 곱', minDistinct: 200, vars: { q: sampler(function (r) {
          var p = r.pick(PAIRS), a = r.pick(p), b = p[0] === a ? p[1] : p[0], form = r.int(0, 4);
          var it = form === 0 ? withLetters(r, r.int(1, 2)).concat([r.pick([1, -1, -1])]) : form === 1 ? [a, a, num29(r, 40)] : form === 2 ? [a, a, a] : form === 3 ? [a, b, a] : [a, a, b, num29(r, 40)];
          return { it: form === 2 ? it : r.shuffle(it), o: order4(r) };
        }) } },
      { name: '괄호 · 소수가 있는 식', minDistinct: 200, vars: { q: sampler(function (r) {
          var p = r.pick(PAIRS), form = r.int(0, 3), it;
          if (form === 0) it = withLetters(r, r.int(1, 2)).concat([r.pick(['0.1', '0.1', '0.01'])]);
          else if (form === 3) { var a = r.pick(p), b = p[0] === a ? p[1] : p[0]; it = [a, a, b, r.pick([-1, num29(r, 60)])]; }
          else {
            var extra = r.int(0, 2) ? [] : [r.pick(['k', 't', 'h'])];
            it = extra.concat(['(' + p[0] + ' ' + r.pick(['+', '-']) + ' ' + p[1] + ')', r.pick([-1, num29(r, 40), num29(r, 40)])]);
          }
          return { it: r.shuffle(it), o: order4(r) };
        }) } }
    ],
    prompt: function (p) { return { tex: p.raw, text: '곱셈 기호 ×를 생략해서 나타낸 것을 고르세요.' }; },
    explain: {
      'num-last': function (p) {
        return p.n !== null && p.n < 0 ? '수를 문자 뒤에 써서 뺄셈이 되어 버렸어요. 문자 뒤에 −와 수를 쓰면 "그만큼 뺀다"는 뜻이에요. 음수는 부호와 함께 문자 앞에 써요.'
          : '수를 문자 뒤에 썼어요. 곱셈 기호를 생략할 때 수는 언제나 문자 앞에 써요.';
      },
      added: function () { return '곱셈을 덧셈으로 바꿨어요. ×를 생략한다는 것은 수와 문자를 붙여 쓴다는 뜻이에요. +로 이으면 "더하라"는 다른 식이 돼요.'; },
      power: function () { return '곱하는 수를 지수 자리에 썼어요. 지수는 같은 문자를 몇 번 곱했는지 나타낼 때만 써요. 곱하는 수는 문자 앞에 그대로 써요.'; },
      sign: function () { return '음수의 부호 −를 빠뜨렸어요. −도 수의 일부라서, 괄호만 벗기고 부호와 함께 맨 앞에 써요.'; },
      one: function () { return '1을 그대로 썼어요. 문자 앞의 1은 쓰지 않아요. $1 \\times a$는 $a$, $(-1) \\times a$는 $-a$로 써요.'; },
      'no-power': function () { return '같은 문자를 나란히 썼어요. 같은 문자를 여러 번 곱한 것은 거듭제곱으로 써요: $a \\times a = a^{2}$.'; },
      doubled: function () { return '같은 문자를 곱한 것을 더한 것처럼 썼어요. $a \\times a$는 $a^{2}$이고, $2a$는 $a + a$예요. 둘은 다른 식이에요.'; },
      'pow-letter': function () { return '지수를 다른 문자에 붙였어요. 식에서 두 번 곱한 문자가 어느 것인지 다시 확인해 보세요.'; },
      'no-paren': function () { return '괄호를 없앴어요. 괄호 안 전체에 곱한 것이라서 괄호는 그대로 둬야 해요. 괄호를 없애면 앞의 문자에만 곱한 다른 식이 돼요.'; },
      'into-product': function () { return '괄호 안의 +(−)까지 없앴어요. 생략할 수 있는 것은 × 기호뿐이에요. 괄호 안의 식은 그대로 두고 수만 괄호 앞에 써요.'; },
      'zero-point': function () { return '소수 속의 1까지 생략했어요. 생략하는 것은 곱하는 수가 1이나 −1일 때뿐이에요. $0.1 \\times a$는 $0.1a$로 써요.'; }
    },
    hints: function (p) {
      var who = p.uniq.map(function (l) { return '$' + l + '$'; }).join(', '), tips = [];
      if (p.dec) tips.push('곱하는 수 $' + p.dec + '$은 1이 아니라 소수예요. 소수는 모양을 바꾸지 않고 통째로 문자 앞에 써요.');
      else if (p.n !== null && abs(p.n) === 1) tips.push('곱하는 수가 ' + (p.n < 0 ? '−1' : '1') + '이에요. 1을 곱해도 값이 그대로라서 1은 쓰지 않아요.' + (p.n < 0 ? ' −1이면 부호 −만 남겨요.' : ''));
      else if (p.n !== null && p.n < 0) tips.push('곱하는 수 $' + p.n + '$은 음수예요. 괄호를 벗기고, 부호 −와 함께 맨 앞에 써요.');
      else if (p.n !== null) tips.push('곱하는 수 $' + p.n + '$을 맨 앞에 써요.');
      if (p.rep) tips.push('같은 문자가 여러 번 곱해져 있어요. 몇 번 곱했는지 세어서 지수로 써요.');
      if (p.grp) tips.push('괄호로 묶은 $' + p.grp + '$는 한 덩어리 문자처럼 생각해요. 괄호는 그대로 두고 수를 그 앞에 써요.');
      if (p.uniq.length > 1) tips.push('문자가 여러 개이면 알파벳 순서로 써요.');
      return [
        '문자가 있는 식에서는 곱셈 기호 ×를 쓰지 않고 붙여 써요. "삼 곱하기 에이"를 줄여서 "삼 에이"라고 부르는 셈이에요. 붙여 쓸 때의 약속은 네 가지예요. ① 수는 문자 앞에 ② 문자는 알파벳 순서로 ③ 같은 문자의 곱은 거듭제곱으로 ④ 1은 쓰지 않아요.',
        '이 식에 나오는 문자를 먼저 찾아요: ' + who + (p.grp ? ', 그리고 괄호 묶음' : '') + '. ' + tips.join(' '),
        '보기를 하나씩 따져 봐요. +나 −로 이어 쓴 보기는 곱셈이 아니라 덧셈 · 뺄셈이라서 다른 식이에요. 수가 맨 앞에 있는지, 같은 문자가 한 번씩만 보이는지, 쓸모없는 1이 남아 있지 않은지 확인해요.'
      ];
    },
    steps: function (p) {
      var how = [];
      if (p.rep) how.push('같은 문자의 곱은 거듭제곱으로 써요.');
      if (p.n !== null && abs(p.n) === 1) how.push('1은 쓰지 않아요' + (p.n < 0 ? '(−1은 −만 남겨요).' : '.'));
      if (p.grp) how.push('괄호는 그대로 둬요.');
      if (p.dec) how.push('소수는 그대로 써요.');
      return [
        { say: p.moved ? '수를 맨 앞으로, 문자를 알파벳 순서로 옮겨요. 곱셈은 순서를 바꿔도 값이 같아요.' : '수가 맨 앞에 있고 문자도 알파벳 순서예요. 순서는 그대로 둬요.', tex: p.sorted },
        { say: '× 기호를 지우고 붙여 써요. ' + how.join(' '), tex: p.raw + ' = ' + p.ans, value: p.ans }
      ];
    }
  });

  /* ── B05.div 나눗셈 기호 생략 ──────────────────────────
     v.q = { k: 'two' | 'chain' | 'paren' | 'group' | 'terms', …, o }
       two   { A, B }                A ÷ B
       chain { it: [A, B, C], ops }  A ÷ B × C 처럼 왼쪽부터
       paren { it: [A, B, C] }       A ÷ (B × C)
       group { g: [문자, '+'|'-', 문자], d, dir }   dir 0: (묶음) ÷ d · 1: d ÷ (묶음)
       terms { t: [{ L, n, op }, { L, n, op }], sg }   a × 2 − b ÷ 3 */
  var opT = function (op) { return op === '÷' ? ' \\div ' : ' \\times '; };
  var absI = function (x) { return isNum(x) ? abs(x) : x; };
  var termRaw = function (t) { return t.L + opT(t.op) + t.n; };
  var termAns = function (t) { return t.op === '÷' ? '\\frac{' + t.L + '}{' + t.n + '}' : t.n + t.L; };
  var divBuild = function (q) {
    var A, B, C, raw, ans, wrong, mid = null;
    if (q.k === 'two') {
      A = absI(q.A); B = absI(q.B);
      var neg = (isNum(q.A) && q.A < 0) !== (isNum(q.B) && q.B < 0);
      raw = numT(q.A) + ' \\div ' + numT(q.B); ans = fr(neg, [A], [B]);
      wrong = [[fr(neg, [B], [A]), 'flipped'], [(neg ? '-' : '') + sideT([A, B]), 'product'], [q.A + '-' + B, 'subtracted']];
    } else if (q.k === 'chain' || q.k === 'paren') {
      A = q.it[0]; B = q.it[1]; C = q.it[2];
      var ops = q.k === 'paren' ? 'paren' : q.ops.join('');
      var T = { '÷×': [[[A, C], [B]], ['right-first', [A], [B, C]], ['wrong-letter', [A, B], [C]], ['flipped', [B], [A, C]]],
        '÷÷': [[[A], [B, C]], ['right-first', [A, C], [B]], ['wrong-letter', [A, B], [C]], ['flipped', [B, C], [A]]],
        '×÷': [[[A, B], [C]], ['wrong-letter', [A, C], [B]], ['all-below', [A], [B, C]], ['flipped', [C], [A, B]]],
        paren: [[[A], [B, C]], ['no-paren', [A, C], [B]], ['wrong-letter', [A, B], [C]], ['flipped', [B, C], [A]]] }[ops];
      raw = q.k === 'paren' ? A + ' \\div (' + B + ' \\times ' + C + ')' : A + opT(q.ops[0]) + B + opT(q.ops[1]) + C;
      ans = fr(false, T[0][0], T[0][1]);
      wrong = T.slice(1).map(function (w) { return [fr(false, w[1], w[2]), w[0]]; });
      mid = q.k === 'paren' ? sideT([B, C]) : q.ops[0] === '÷' ? fr(false, [A], [B]) : sideT([A, B]);
    } else if (q.k === 'group') {
      var G = q.g[0] + q.g[1] + q.g[2], show = '(' + q.g.join(' ') + ')', d = q.d;
      raw = q.dir ? d + ' \\div ' + show : show + ' \\div ' + d;
      ans = q.dir ? '\\frac{' + d + '}{' + G + '}' : '\\frac{' + G + '}{' + d + '}';
      wrong = [[q.dir ? '\\frac{' + d + '}{' + q.g[0] + '}' + q.g[1] + q.g[2] : q.g[0] + q.g[1] + '\\frac{' + q.g[2] + '}{' + d + '}', 'no-paren'],
        [q.dir ? '\\frac{' + G + '}{' + d + '}' : '\\frac{' + d + '}{' + G + '}', 'flipped'], [d + '(' + G + ')', 'product']];
    } else {
      var t = q.t, j = t[0].op === '÷' ? 0 : 1, m = t[j].n;
      var alt = function (fn) { return t.map(function (x, i) { return i === j ? fn(x) : termAns(x); }).join(q.sg); };
      raw = termRaw(t[0]) + ' ' + q.sg + ' ' + termRaw(t[1]);
      ans = termAns(t[0]) + q.sg + termAns(t[1]);
      wrong = [['\\frac{' + t.map(function (x, i) { return i === j ? x.L : x.n + x.L; }).join(q.sg) + '}{' + m + '}', 'one-fraction'],
        [alt(function (x) { return m + x.L; }), 'product'], [alt(function (x) { return '\\frac{' + m + '}{' + x.L + '}'; }), 'flipped']];
    }
    return { raw: raw, ans: ans, wrong: wrong, q: q, mid: mid };
  };
  var TRIPLES = [['a', 'b', 'c'], ['x', 'y', 'z'], ['p', 'q', 'r'], ['a', 'b', 'x'], ['a', 'x', 'y']];
  var three = function (r) {
    var it = r.shuffle(r.pick(TRIPLES).slice());
    if (r.int(0, 2) === 0) it[r.int(0, 2)] = r.int(2, 9);
    return it;
  };
  choiceType({
    id: 'B05.div', title: '나눗셈 기호 생략', build: divBuild,
    ids: ['flipped', 'product', 'subtracted', 'right-first', 'wrong-letter', 'all-below', 'no-paren', 'one-fraction'],
    levels: [
      { name: '문자와 수의 나눗셈', minDistinct: 150, vars: { q: sampler(function (r) {
          var p = r.pick(PAIRS), l = r.pick(p), form = r.int(0, 4), n = r.int(2, 9);
          var AB = form === 0 ? [l, n] : form === 1 ? [n, l] : form === 2 ? r.shuffle(p.slice()) : form === 3 ? [l, -n] : [-n, l];
          return { k: 'two', A: AB[0], B: AB[1], o: order4(r) };
        }) } },
      { name: '곱셈과 나눗셈이 섞인 식', minDistinct: 200, vars: { q: sampler(function (r) {
          return { k: 'chain', it: three(r), ops: r.pick([['÷', '×'], ['÷', '÷'], ['×', '÷']]), o: order4(r) };
        }) } },
      { name: '괄호, 덧셈 · 뺄셈이 섞인 식', minDistinct: 200, vars: { q: sampler(function (r) {
          var form = r.int(0, 2), p = r.pick(PAIRS);
          if (form === 0) return { k: 'paren', it: three(r), o: order4(r) };
          if (form === 1) return { k: 'group', g: [p[0], r.pick(['+', '-']), p[1]], d: r.int(0, 1) ? r.int(2, 9) : r.pick(['k', 't', 'h']), dir: r.int(0, 1), o: order4(r) };
          var ops = r.pick([['×', '÷'], ['÷', '×']]), a, b;
          do { a = r.int(2, 9); b = r.int(2, 9); } while (a === b);
          return { k: 'terms', t: [{ L: p[0], n: a, op: ops[0] }, { L: p[1], n: b, op: ops[1] }], sg: r.pick(['+', '-']), o: order4(r) };
        }) } }
    ],
    prompt: function (p) { return { tex: p.raw, text: (/times/.test(p.raw) ? '곱셈 기호 ×와 나눗셈 기호 ÷를' : '나눗셈 기호 ÷를') + ' 생략해서 나타낸 것을 고르세요.' }; },
    explain: {
      flipped: function () { return '분자와 분모가 뒤바뀌었어요. ÷ 앞에 있는 것이 분자(위), ÷ 바로 뒤에 있는 것이 분모(아래)예요.'; },
      product: function () { return '나눗셈을 곱셈처럼 붙여 썼어요. 붙여 쓰는 것은 곱셈뿐이에요. 나눗셈은 분수 꼴로 써서 나누는 것을 분모에 둬요.'; },
      subtracted: function () { return '나눗셈을 뺄셈으로 바꿨어요. ÷는 분수의 가로선으로 바꿔 써요. −는 빼라는 뜻이라서 전혀 다른 계산이에요.'; },
      'right-first': function () { return '뒤쪽 계산을 먼저 했어요. 곱셈과 나눗셈이 섞여 있으면 왼쪽부터 차례로 계산해요. 맨 앞의 나눗셈부터 분수로 고친 다음 나머지를 이어서 계산해요.'; },
      'wrong-letter': function () { return '분모로 내려갈 것을 잘못 골랐어요. ÷ 바로 뒤에 있는 것이 분모로 가요. 식에서 ÷ 기호 바로 뒤를 다시 확인해 보세요.'; },
      'all-below': function () { return '×로 곱한 것까지 분모에 썼어요. 분모로 가는 것은 ÷ 바로 뒤에 있는 것뿐이에요. ×로 곱한 것은 분자에 남아요.'; },
      'no-paren': function () { return '괄호를 무시했어요. 괄호로 묶은 부분은 한 덩어리예요. 덩어리 전체가 함께 분자나 분모로 가야 해요.'; },
      'one-fraction': function () { return '식 전체를 하나의 분수로 만들었어요. ÷는 바로 앞뒤에 있는 것만 묶어요. +, −로 떨어져 있는 다른 항은 분수 밖에 그대로 둬요.'; }
    },
    hints: function (p) {
      var q = p.q, second, third;
      if (q.k === 'two') {
        second = '이 식을 ÷를 기준으로 둘로 나눠 봐요. ÷ 앞: $' + numT(q.A) + '$, ÷ 뒤: $' + numT(q.B) + '$. 앞의 것을 분수의 위에, 뒤의 것을 아래에 써요.'
          + (isNum(q.A) && q.A < 0 || isNum(q.B) && q.B < 0 ? ' 음수가 있으면 부호 −는 분수 전체의 앞에 써요.' : '');
        third = '보기를 따져 봐요. 붙여 쓴 것은 곱셈이고, −로 이은 것은 뺄셈이에요. 분수 꼴인 보기 가운데 위아래가 바뀌지 않은 것을 골라요.';
      } else if (q.k === 'chain') {
        second = '곱셈과 나눗셈이 섞여 있으면 왼쪽부터 차례로 해요. ① 먼저 앞의 두 개($' + q.it[0] + opT(q.ops[0]) + q.it[1] + '$)를 한 덩어리로 고쳐요. ② 그 덩어리에 이어서 뒤에 남은 계산($' + opT(q.ops[1]).trim() + ' ' + q.it[2] + '$)을 해요.';
        third = '쉽게 가려내는 방법이 있어요. ÷ 바로 뒤에 있는 것만 분모(아래)로 가고, 나머지는 모두 분자(위)에 남아요. 이 식에서 ÷ 바로 뒤에 무엇이 있는지 하나씩 짚어 봐요.';
      } else if (q.k === 'paren') {
        second = '괄호가 있으면 괄호 안을 먼저 계산해요. ① 괄호 안($' + q.it[1] + ' \\times ' + q.it[2] + '$)을 붙여 써서 한 덩어리로 만들어요. ② 맨 앞의 것($' + q.it[0] + '$)을 그 덩어리로 나눠요.';
        third = '나누는 것은 괄호 덩어리 전체예요. 그래서 괄호 안에 있던 것은 모두 분모(아래)로 가요. 괄호 안의 것 가운데 하나만 분모에 쓴 보기는 괄호를 무시한 것이에요.';
      } else if (q.k === 'group') {
        second = '괄호로 묶은 부분($(' + q.g.join(' ') + ')$)은 한 덩어리로 생각해요. 이 식은 ' + (q.dir ? '$' + q.d + '$ ÷ (덩어리) 꼴이에요. ÷ 뒤에 있는 덩어리 전체가 분모(아래)로 가요.' : '(덩어리) ÷ $' + q.d + '$ 꼴이에요. ÷ 앞에 있는 덩어리 전체가 분자(위)로 가요.');
        third = '분수의 가로선이 괄호 구실을 해요. 그래서 분수로 쓰면 괄호를 쓰지 않아도 돼요. 가로선이 덩어리 전체에 걸쳐 있는 보기를 골라요. 한쪽 문자에만 걸쳐 있으면 다른 식이에요.';
      } else {
        second = '+, −가 있으면 그것을 기준으로 식을 덩어리(항)로 잘라요. 이 식은 두 덩어리예요. 앞 덩어리: $' + termRaw(q.t[0]) + '$, 뒤 덩어리: $' + termRaw(q.t[1]) + '$. 덩어리마다 따로 기호를 생략해요.';
        third = '곱셈 덩어리는 수를 문자 앞에 붙여 쓰고, 나눗셈 덩어리는 분수로 써요. 그런 다음 두 덩어리를 원래 있던 ' + (q.sg === '+' ? '+' : '−') + '로 이어요. 분수의 가로선이 다른 덩어리까지 덮으면 안 돼요.';
      }
      return [
        '나눗셈 기호 ÷는 쓰지 않고 분수 꼴로 써요. 피자 한 판을 네 명이 나누면 한 사람 몫이 "사분의 일"이 되는 것처럼, "나누기"와 "분의"는 같은 말이에요. ÷ 앞에 있는 것이 분자(위), ÷ 바로 뒤에 있는 것이 분모(아래)로 가요.',
        second, third
      ];
    },
    steps: function (p) {
      var q = p.q;
      if (q.k === 'two') return [
        { say: '÷ 앞의 것을 분자에, ÷ 뒤의 것을 분모에 써요.', tex: absI(q.A) + ' \\div ' + absI(q.B) + ' = ' + big(fr(false, [absI(q.A)], [absI(q.B)])) },
        { say: /^-/.test(p.ans) ? '음수로 나누었으니(또는 음수를 나누었으니) 부호 −를 분수 앞에 써요.' : '나눗셈 기호가 없어졌어요. 이 분수가 답이에요.', tex: p.raw + ' = ' + big(p.ans), value: p.ans }
      ];
      if (q.k === 'chain') return [
        { say: '왼쪽부터 차례로 해요. 먼저 앞의 두 개를 고쳐요.', tex: q.it[0] + opT(q.ops[0]) + q.it[1] + ' = ' + big(p.mid) },
        { say: '이어서 ' + (q.ops[1] === '÷' ? '나누는 것은 분모에 써요.' : '곱하는 것은 분자에 써요.'), tex: big(p.mid) + opT(q.ops[1]) + q.it[2] + ' = ' + big(p.ans), value: p.ans }
      ];
      if (q.k === 'paren') return [
        { say: '괄호 안을 먼저 고쳐요. × 기호를 생략해요.', tex: q.it[1] + ' \\times ' + q.it[2] + ' = ' + p.mid },
        { say: '앞의 것을 괄호 덩어리 전체로 나눠요. 덩어리가 통째로 분모로 가요.', tex: p.raw + ' = ' + big(p.ans), value: p.ans }
      ];
      if (q.k === 'group') return [
        { say: '괄호로 묶은 부분은 한 덩어리예요. 덩어리 전체가 ' + (q.dir ? '분모' : '분자') + '로 가요.' },
        { say: '분수의 가로선이 괄호 구실을 하니 괄호는 쓰지 않아요.', tex: p.raw + ' = ' + big(p.ans), value: p.ans }
      ];
      return [
        { say: '+, −를 기준으로 두 덩어리로 나눠요. 앞의 덩어리부터 고쳐요.', tex: termRaw(q.t[0]) + ' = ' + big(termAns(q.t[0])) },
        { say: '뒤의 덩어리도 고쳐요.', tex: termRaw(q.t[1]) + ' = ' + big(termAns(q.t[1])) },
        { say: '두 덩어리를 원래의 ' + (q.sg === '+' ? '+' : '−') + '로 이어요.', tex: big(p.ans), value: p.ans }
      ];
    }
  });

  /* ── B05.word 문자를 사용한 식 ─────────────────────────
     v.q = { k: 상황, … 숫자와 문자, o }. 상황마다 { text, words(말로 세운 식), raw, ans, wrong, tip(아는 수를 넣어 보기) } */
  var GOODS = [['빵', '개'], ['지우개', '개'], ['음료수', '병'], ['공책', '권'], ['연필', '자루'], ['사과', '개']];
  var ask = function (what) { return what + '를 식으로 나타낸 것을 고르세요.'; };
  var WORD = {
    price: function (q) {
      var g = GOODS[q.i], L = q.L, n = q.n;
      return { text: '한 ' + g[1] + '에 $' + L + '$원인 ' + g[0] + ' ' + n + g[1] + '의 값(원)을 식으로 나타낸 것을 고르세요.',
        words: '(한 ' + g[1] + '의 값) × (' + g[1] + ' 수)', raw: L + ' \\times ' + n, ans: n + L,
        tip: '한 ' + g[1] + '에 500원이라면 ' + n + g[1] + '의 값은 500 × ' + josa(n, '으로/로') + ' 계산하죠. 값이 500원이 아니라 $' + L + '$원이니, 500이 있던 자리에 $' + L + '$를 쓰면 돼요.',
        wrong: [[L + '+' + n, 'added', '값과 개수를 더했어요. 같은 값을 여러 번 더하는 것이라서 곱셈이에요: (한 ' + g[1] + '의 값) × (' + g[1] + ' 수).'],
          ['\\frac{' + L + '}{' + n + '}', 'divided', '나눗셈을 했어요. 여러 ' + g[1] + '의 값은 한 ' + g[1] + '의 값에 ' + g[1] + ' 수를 곱해서 구해요.'],
          [L + '^{' + n + '}', 'power', '$' + L + '^{' + n + '}$은 ' + L + '를 ' + CNT[n] + ' 번 곱한 것이에요. 여기서는 ' + L + '를 ' + CNT[n] + ' 번 더한 것이라서 수를 문자 앞에 붙여 써요.']] };
    },
    age: function (q) {
      var L = q.L, n = q.n, later = q.dir > 0;
      return { text: '올해 $' + L + '$살인 사람의 ' + n + '년 ' + (later ? '뒤' : '전') + ' 나이(살)를 식으로 나타낸 것을 고르세요.',
        words: later ? '(올해 나이) + (지난 햇수)' : '(올해 나이) − (거슬러 간 햇수)', raw: L + (later ? ' + ' : ' - ') + n, ans: L + (later ? '+' : '-') + n,
        tip: '올해 20살이라면 ' + n + '년 ' + (later ? '뒤에는 (20 + ' : '전에는 (20 − ') + n + ')살이죠. 나이는 한 해에 한 살씩 달라지니까요. 20이 있던 자리에 $' + L + '$를 쓰면 돼요.',
        wrong: [[n + L, 'multiplied', '곱셈을 했어요. 나이는 한 해에 한 살씩 달라져요. ' + n + '년이 지나면 ' + n + '살이 ' + (later ? '늘어나니 더해요.' : '줄어드니 빼요.')],
          [L + (later ? '-' : '+') + n, 'reversed', later ? '뺄셈을 했어요. 시간이 지나면 나이는 늘어나요. 그래서 더해요.' : '덧셈을 했어요. 지난날의 나이는 지금보다 적어요. 그래서 빼요.'],
          later ? ['\\frac{' + L + '}{' + n + '}', 'divided', '나눗셈을 했어요. 나이는 한 해에 한 살씩 늘어나요. 지난 햇수만큼 더해요.']
            : [n + '-' + L, 'order', '빼는 순서가 바뀌었어요. 올해 나이에서 햇수를 빼야 해요. 뺄셈은 순서를 바꾸면 값이 달라져요.']] };
    },
    share: function (q) {
      var L = q.L, n = q.n;
      return { text: '$' + L + '$원을 ' + n + '명이 똑같이 나누어 낼 때, 한 명이 내는 돈(원)을 식으로 나타낸 것을 고르세요.',
        words: '(전체 금액) ÷ (사람 수)', raw: L + ' \\div ' + n, ans: '\\frac{' + L + '}{' + n + '}',
        tip: '전체가 6000원이라면 한 명은 (6000 ÷ ' + n + ')원을 내죠. 6000이 있던 자리에 $' + L + '$를 쓰고, 나눗셈은 분수 꼴로 고쳐 써요.',
        wrong: [[n + L, 'multiplied', '곱셈을 했어요. 여럿이 나누어 내면 한 명이 내는 돈은 줄어들어요. 전체 금액을 사람 수로 나눠요.'],
          [L + '-' + n, 'subtracted', '뺄셈을 했어요. 똑같이 나눈다는 말은 나눗셈을 뜻해요. 나눗셈은 분수 꼴로 써요.'],
          ['\\frac{' + n + '}{' + L + '}', 'flipped', '분자와 분모가 바뀌었어요. 나누어지는 전체 금액이 분자(위), 나누는 사람 수가 분모(아래)예요.']] };
    },
    square: function (q) {
      var L = q.L;
      return q.what ? { text: '한 변의 길이가 $' + L + '$ cm인 정사각형의 넓이(cm²)를 식으로 나타낸 것을 고르세요.',
          words: '(한 변의 길이) × (한 변의 길이)', raw: L + ' \\times ' + L, ans: L + '^{2}',
          tip: '한 변이 5 cm라면 넓이는 5 × 5로 계산하죠. 5가 있던 자리에 $' + L + '$를 쓰면 같은 문자를 두 번 곱한 식이 돼요. 같은 문자의 곱은 거듭제곱으로 써요.',
          wrong: [['4' + L, 'mixup', '둘레를 구했어요. 넓이는 (한 변) × (한 변)이에요.'], ['2' + L, 'doubled', '같은 문자를 두 번 곱한 것은 두 배가 아니에요. $' + L + ' \\times ' + L + '$는 거듭제곱으로 써요.'],
            [L + '+2', 'added', '덧셈을 했어요. 넓이는 가로와 세로를 곱해서 구해요. 정사각형은 가로와 세로가 같아요.']] }
        : { text: '한 변의 길이가 $' + L + '$ cm인 정사각형의 둘레(cm)를 식으로 나타낸 것을 고르세요.',
          words: '(한 변의 길이) × (변의 수)', raw: L + ' \\times 4', ans: '4' + L,
          tip: '한 변이 5 cm라면 둘레는 5 × 4로 계산하죠. 정사각형은 길이가 같은 변이 네 개니까요. 5가 있던 자리에 $' + L + '$를 쓰면 돼요.',
          wrong: [[L + '^{2}', 'mixup', '넓이를 구했어요. 둘레는 네 변의 길이를 모두 더한 것이에요.'], [L + '+4', 'added', '변의 길이에 4를 더했어요. 길이가 같은 변이 네 개라서 4를 곱해요.'],
            ['2' + L, 'count', '변을 두 개만 셌어요. 정사각형의 변은 네 개예요.']] };
    },
    left: function (q) {
      var L = q.L, n = q.n;
      return { text: '길이가 $' + L + '$ cm인 끈에서 ' + n + ' cm를 잘라 냈을 때, 남은 끈의 길이(cm)를 식으로 나타낸 것을 고르세요.',
        words: '(처음 길이) − (잘라 낸 길이)', raw: L + ' - ' + n, ans: L + '-' + n,
        tip: '처음 길이가 100 cm라면 남은 길이는 100 − ' + josa(n, '으로/로') + ' 계산하죠. 100이 있던 자리에 $' + L + '$를 쓰면 돼요. 뺄셈 기호는 생략할 수 없으니 그대로 써요.',
        wrong: [[n + '-' + L, 'order', '빼는 순서가 바뀌었어요. 처음 길이에서 잘라 낸 길이를 빼야 해요.'], [L + '+' + n, 'added', '덧셈을 했어요. 잘라 내면 길이가 줄어들어요. 그래서 빼요.'],
          ['\\frac{' + L + '}{' + n + '}', 'divided', '나눗셈을 했어요. 잘라 낸 만큼 길이가 줄어드니 뺄셈이에요.']] };
    },
    change: function (q) {
      var g = GOODS[q.i], L = q.L, n = q.n, M = q.M;
      return { text: '한 ' + g[1] + '에 $' + L + '$원인 ' + g[0] + ' ' + josa(n + g[1], '을/를') + ' 사고 ' + M + '원을 냈을 때, 거스름돈(원)을 식으로 나타낸 것을 고르세요.',
        words: '(낸 돈) − (한 ' + g[1] + '의 값) × (' + g[1] + ' 수)', raw: M + ' - ' + L + ' \\times ' + n, ans: M + '-' + n + L,
        tip: '두 단계로 생각해요. ① 물건값: 한 ' + g[1] + '에 $' + L + '$원씩 ' + n + g[1] + '이니 곱셈이에요. ② 거스름돈: 낸 돈 ' + M + '원에서 물건값을 빼요.',
        wrong: [[n + L + '-' + M, 'order', '빼는 순서가 바뀌었어요. 거스름돈은 낸 돈에서 물건값을 뺀 것이에요.'], [M + '-' + L, 'count', '한 ' + g[1] + '의 값만 뺐어요. ' + josa(n + g[1], '을/를') + ' 샀으니 한 ' + g[1] + '의 값에 ' + josa(n, '을/를') + ' 곱한 값을 빼야 해요.'],
          [M + '+' + n + L, 'added', '물건값을 더했어요. 거스름돈은 낸 돈에서 물건값을 빼고 남은 돈이에요.']] };
    },
    two: function (q) {
      var a = q.L[0], b = q.L[1], m = q.m, n = q.n;
      return { text: '한 자루에 $' + a + '$원인 연필 ' + m + '자루와 한 권에 $' + b + '$원인 공책 ' + n + '권의 값(원)을 식으로 나타낸 것을 고르세요.',
        words: '(연필 값) + (공책 값)', raw: a + ' \\times ' + m + ' + ' + b + ' \\times ' + n, ans: m + a + '+' + n + b,
        tip: '물건마다 따로 값을 구한 다음 더해요. ① 연필 값: 한 자루의 값 × 자루 수 ② 공책 값: 한 권의 값 × 권 수 ③ 두 값을 +로 이어요.',
        wrong: [[(m * n) + a + b, 'multiplied', '모두 곱해 버렸어요. 연필 값과 공책 값은 따로 구해서 더해야 해요.'], [a + '+' + b, 'count', '한 자루와 한 권의 값만 더했어요. 산 개수를 각각 곱해야 해요.'],
          [n + a + '+' + m + b, 'reversed', '개수를 서로 바꿔 곱했어요. 연필은 ' + m + '자루, 공책은 ' + n + '권이에요.']] };
    },
    rect: function (q) {
      var a = q.L[0], b = q.L[1];
      return q.what ? { text: '가로가 $' + a + '$ cm, 세로가 $' + b + '$ cm인 직사각형의 넓이(cm²)를 식으로 나타낸 것을 고르세요.',
          words: '(가로) × (세로)', raw: a + ' \\times ' + b, ans: a + b,
          tip: '가로가 5 cm, 세로가 3 cm라면 넓이는 5 × 3으로 계산하죠. 5와 3이 있던 자리에 문자를 쓰고, × 기호를 생략해 붙여 써요.',
          wrong: [['2(' + a + '+' + b + ')', 'mixup', '둘레를 구했어요. 넓이는 (가로) × (세로)예요.'], [a + '+' + b, 'added', '가로와 세로를 더했어요. 넓이는 가로와 세로를 곱해서 구해요.'],
            ['2' + a + b, 'doubled', '쓸데없이 2를 곱했어요. 넓이는 (가로) × (세로) 그대로예요.']] }
        : { text: '가로가 $' + a + '$ cm, 세로가 $' + b + '$ cm인 직사각형의 둘레(cm)를 식으로 나타낸 것을 고르세요.',
          words: '{(가로) + (세로)} × 2', raw: '(' + a + ' + ' + b + ') \\times 2', ans: '2(' + a + '+' + b + ')',
          tip: '직사각형에는 가로가 두 개, 세로가 두 개 있어요. 가로와 세로를 한 번씩 더한 다음 그것을 두 배 하면 둘레예요. 더한 것 전체를 두 배 하니 괄호가 필요해요.',
          wrong: [[a + b, 'mixup', '넓이를 구했어요. 둘레는 네 변의 길이를 모두 더한 것이에요.'], [a + '+' + b, 'count', '가로와 세로를 한 번씩만 더했어요. 가로도 두 개, 세로도 두 개예요.'],
            ['2' + a + '+' + b, 'no-paren', '괄호가 빠져서 가로만 두 배가 됐어요. 세로도 두 개라서 더한 것 전체를 두 배 해야 해요.']] };
    },
    dist: function (q) {
      var L = q.L, n = q.n;
      return q.what ? { text: '$' + L + '$ km를 시속 ' + n + ' km로 갈 때, 걸리는 시간(시간)을 식으로 나타낸 것을 고르세요.',
          words: '(거리) ÷ (속력)', raw: L + ' \\div ' + n, ans: '\\frac{' + L + '}{' + n + '}',
          tip: '시속 ' + n + ' km는 한 시간에 ' + n + ' km를 간다는 뜻이에요. 그 속력으로 갈 때 걸리는 시간은 거리를 ' + josa(n, '으로/로') + ' 나누어 구해요. 나눗셈은 분수 꼴로 써요.',
          wrong: [[n + L, 'multiplied', '곱셈을 했어요. 시간은 (거리) ÷ (속력)이에요. 거리에 속력을 곱하면 안 돼요.'], ['\\frac{' + n + '}{' + L + '}', 'flipped', '분자와 분모가 바뀌었어요. 거리가 분자(위), 속력이 분모(아래)예요.'],
            [L + '-' + n, 'subtracted', '뺄셈을 했어요. 걸리는 시간은 거리를 속력으로 나누어 구해요.']] }
        : { text: '시속 $' + L + '$ km로 ' + n + '시간 동안 간 거리(km)를 식으로 나타낸 것을 고르세요.',
          words: '(속력) × (시간)', raw: L + ' \\times ' + n, ans: n + L,
          tip: '시속 $' + L + '$ km는 한 시간에 $' + L + '$ km를 간다는 뜻이에요. ' + n + '시간 동안 가면 그 거리를 ' + CNT[n] + ' 번 더한 만큼 가요. 같은 것을 여러 번 더하는 것은 곱셈이에요.',
          wrong: [['\\frac{' + L + '}{' + n + '}', 'divided', '나눗셈을 했어요. 거리는 (속력) × (시간)이에요. 오래 갈수록 거리가 늘어나요.'], [L + '+' + n, 'added', '속력과 시간을 더했어요. 한 시간에 가는 거리를 시간만큼 곱해야 해요.'],
            ['\\frac{' + n + '}{' + L + '}', 'flipped', '시간을 속력으로 나눴어요. 거리는 (속력) × (시간)이에요.']] };
    },
    read: function (q) {
      var x = q.L[0], a = q.L[1], n = q.n;
      return { text: '$' + x + '$쪽인 책을 하루에 ' + n + '쪽씩 $' + a + '$일 동안 읽었을 때, 남은 쪽수를 식으로 나타낸 것을 고르세요.',
        words: '(전체 쪽수) − (하루에 읽는 쪽수) × (날수)', raw: x + ' - ' + n + ' \\times ' + a, ans: x + '-' + n + a,
        tip: '두 단계로 생각해요. ① 읽은 쪽수: 하루에 ' + n + '쪽씩 $' + a + '$일 동안 읽었으니 곱셈이에요. ② 남은 쪽수: 전체 $' + x + '$쪽에서 읽은 쪽수를 빼요.',
        wrong: [[n + a + '-' + x, 'order', '빼는 순서가 바뀌었어요. 전체 쪽수에서 읽은 쪽수를 빼야 해요.'], [x + '-' + n, 'count', '하루치만 뺐어요. $' + a + '$일 동안 읽었으니 하루에 읽는 쪽수에 날수를 곱해서 빼요.'],
          [x + '+' + n + a, 'added', '읽은 쪽수를 더했어요. 읽을수록 남은 쪽수는 줄어들어요.']] };
    },
    digits: function (q) {
      var L = q.L;
      return L.length === 2 ? { text: '십의 자리 숫자가 $' + L[0] + '$, 일의 자리 숫자가 $' + L[1] + '$인 두 자리 자연수를 식으로 나타낸 것을 고르세요.',
          words: '10 × (십의 자리 숫자) + (일의 자리 숫자)', raw: '10 \\times ' + L[0] + ' + ' + L[1], ans: '10' + L[0] + '+' + L[1],
          tip: '37이라는 수를 뜯어 보면 10이 3개, 1이 7개예요. 곧 10 × 3 + 7이죠. 십의 자리 숫자는 10을 곱해야 제 값이 돼요. 3과 7이 있던 자리에 문자를 써요.',
          wrong: [[L[0] + L[1], 'mixup', '문자를 붙여 쓰면 두 문자를 곱한다는 뜻이에요. 숫자처럼 나란히 쓴다고 두 자리 수가 되지 않아요.'], [L[0] + '+' + L[1], 'count', '두 숫자를 그냥 더했어요. 십의 자리 숫자는 10을 곱해야 제 값이 돼요.'],
            [L[0] + '+10' + L[1], 'reversed', '10을 일의 자리 숫자에 곱했어요. 10을 곱하는 것은 십의 자리 숫자예요.']] }
        : { text: '백의 자리 숫자가 $' + L[0] + '$, 십의 자리 숫자가 $' + L[1] + '$, 일의 자리 숫자가 $' + L[2] + '$인 세 자리 자연수를 식으로 나타낸 것을 고르세요.',
          words: '100 × (백의 자리 숫자) + 10 × (십의 자리 숫자) + (일의 자리 숫자)', raw: '100 \\times ' + L[0] + ' + 10 \\times ' + L[1] + ' + ' + L[2], ans: '100' + L[0] + '+10' + L[1] + '+' + L[2],
          tip: '254라는 수를 뜯어 보면 100이 2개, 10이 5개, 1이 4개예요. 곧 100 × 2 + 10 × 5 + 4죠. 자리마다 그 자리의 값을 곱해요. 숫자가 있던 자리에 문자를 써요.',
          wrong: [[L.join(''), 'mixup', '문자를 붙여 쓰면 세 문자를 곱한다는 뜻이에요. 숫자처럼 나란히 쓴다고 세 자리 수가 되지 않아요.'], [L.join('+'), 'count', '세 숫자를 그냥 더했어요. 백의 자리 숫자에는 100, 십의 자리 숫자에는 10을 곱해야 해요.'],
            ['100' + L[0] + '+' + L[1] + '+' + L[2], 'reversed', '십의 자리 숫자에 10을 곱하지 않았어요. 십의 자리 숫자는 10을 곱해야 제 값이 돼요.']] };
    },
    percent: function (q) {
      var L = q.L, p = q.p, unit = ['원', '명', ' g'][q.i], dec = p % 10 === 0 ? '0.' + p / 10 : '0.' + (p < 10 ? '0' : '') + p;
      var slip = p % 10 === 0 ? '0.0' + p / 10 : p < 10 ? '0.' + p : Math.floor(p / 10) + '.' + p % 10;
      return { text: '$' + L + '$' + unit + '의 ' + p + ' %를 식으로 나타낸 것을 고르세요.',
        words: '(전체) × (비율)', raw: L + ' \\times ' + dec, ans: dec + L,
        tip: '퍼센트(%)는 전체를 100으로 볼 때의 비율이에요. 그래서 ' + p + ' %를 수로 고치려면 ' + josa(p, '을/를') + ' 100으로 나눠요. 그 소수를 전체에 곱하면 돼요. 소수는 문자 앞에 써요.',
        wrong: [[p + L, 'percent', '퍼센트 수를 그대로 곱했어요. ' + p + ' %는 ' + p + '배가 아니에요. 100으로 나눈 소수를 곱해야 해요.'],
          [slip + L, 'point', '소수점의 자리가 틀렸어요. ' + p + ' %는 ' + josa(p, '을/를') + ' 100으로 나눈 수예요. 소수점을 왼쪽으로 두 칸 옮겨요.'],
          [L + '+' + dec, 'added', '비율을 더했어요. "~의 몇 %"는 전체에 비율을 곱해서 구해요.']] };
    },
    mean: function (q) {
      var L = q.L, sum = L.join('+'), n = L.length;
      return { text: (n === 2 ? '두' : '세') + ' 번 본 시험의 점수가 ' + L.map(function (l) { return '$' + l + '$점'; }).join(', ') + '일 때, 평균(점)을 식으로 나타낸 것을 고르세요.',
        words: '(점수를 모두 더한 값) ÷ (시험 횟수)', raw: '(' + L.join(' + ') + ') \\div ' + n, ans: '\\frac{' + sum + '}{' + n + '}',
        tip: '평균은 점수를 모두 더한 다음 횟수로 나눈 값이에요. 먼저 더하고 나중에 나누니, 더한 것 전체가 분수의 분자(위)에 들어가야 해요.',
        wrong: [[L.slice(0, -1).join('+') + '+\\frac{' + L[n - 1] + '}{' + n + '}', 'no-paren', '마지막 점수만 나눴어요. 더한 것 전체를 나눠야 하니 분수의 가로선이 모든 점수에 걸쳐 있어야 해요.'],
          [n + '(' + sum + ')', 'multiplied', '횟수를 곱했어요. 평균은 더한 값을 횟수로 나눈 것이에요.'], [sum, 'count', '점수를 더하기만 했어요. 평균은 더한 값을 시험 횟수로 나눠야 해요.']] };
    }
  };
  var VAR = ['x', 'a', 'k', 't'];
  choiceType({
    id: 'B05.word', title: '문자를 사용한 식',
    ids: ['added', 'divided', 'power', 'multiplied', 'reversed', 'order', 'subtracted', 'flipped', 'mixup', 'doubled', 'count', 'no-paren', 'percent', 'point'],
    build: function (q) { return WORD[q.k](q); },
    levels: [
      { name: '한 가지 계산', minDistinct: 150, vars: { q: sampler(function (r) {
          var k = r.pick(['price', 'price', 'age', 'share', 'square', 'left']), L = r.pick(VAR);
          return k === 'price' ? { k: k, i: r.int(0, 5), n: r.int(2, 9), L: L, o: order4(r) } : k === 'age' ? { k: k, n: r.int(2, 9), dir: r.pick([1, -1]), L: L, o: order4(r) }
            : k === 'share' ? { k: k, n: r.int(2, 9), L: L, o: order4(r) } : k === 'square' ? { k: k, what: r.int(0, 1), L: L, o: order4(r) } : { k: k, n: r.int(5, 60), L: L, o: order4(r) };
        }) } },
      { name: '두 가지 계산 · 두 문자', minDistinct: 150, vars: { q: sampler(function (r) {
          var k = r.pick(['change', 'two', 'rect', 'dist', 'read']), L = r.pick(VAR), p = r.pick(PAIRS), m, n;
          do { m = r.int(2, 6); n = r.int(2, 6); } while (m === n);
          return k === 'change' ? { k: k, i: r.int(0, 5), n: r.int(2, 6), M: r.pick([5000, 10000]), L: L, o: order4(r) } : k === 'two' ? { k: k, m: m, n: n, L: p, o: order4(r) }
            : k === 'rect' ? { k: k, what: r.int(0, 1), L: p, o: order4(r) } : k === 'dist' ? { k: k, what: r.int(0, 1), n: r.int(2, 9), L: L, o: order4(r) }
              : { k: k, n: r.pick([10, 15, 20, 25, 30]), L: r.pick([['x', 'a'], ['p', 'n'], ['y', 't'], ['m', 'k']]), o: order4(r) };
        }) } },
      { name: '자릿수 · 퍼센트 · 평균', minDistinct: 80, vars: { q: sampler(function (r) {
          var k = r.pick(['digits', 'percent', 'percent', 'mean']);
          return k === 'digits' ? { k: k, L: r.int(0, 2) ? r.pick(PAIRS) : r.pick(TRIPLES.slice(0, 3)), o: order4(r) }
            : k === 'percent' ? { k: k, p: r.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90]), i: r.int(0, 2), L: r.pick(VAR), o: order4(r) }
              : { k: k, L: r.int(0, 1) ? r.pick(PAIRS) : r.pick(TRIPLES.slice(0, 3)), o: order4(r) };
        }) } }
    ],
    prompt: function (p) { return { text: p.text }; },
    explain: {},
    hints: function (p) {
      return [
        '문자가 나와도 겁낼 것 없어요. 문자는 "아직 정해지지 않은 수가 들어갈 자리"일 뿐이에요. 먼저 문자를 잊고, 말로 식을 세워 봐요: ' + p.words + '.',
        p.tip,
        '말로 세운 식에 문자와 수를 넣으면 $' + p.raw + '$ 꼴이 돼요. 마지막으로 기호를 줄여 써요. ×는 지우고 수를 문자 앞에 붙여 쓰고, ÷는 분수 꼴로 써요. +와 −는 지울 수 없어요.'
      ];
    },
    steps: function (p) {
      return [
        { say: '말로 식을 세워요: ' + p.words + '.' },
        { say: '식에 문자와 수를 넣어요.', tex: p.raw },
        { say: '×는 생략하고(수는 문자 앞에), ÷는 분수 꼴로 써요. +와 −는 그대로 둬요.', tex: big(p.ans), value: p.ans }
      ];
    }
  });

  /* ── 식의 값 ───────────────────────────────────────────
     v.q = { L: ['x'] | ['x', 'y'], val: [넣을 수 …](정수, 또는 분수 [분자, 분모]), t: [항 …] }
     항 { c, d, px, py }: (c ÷ d) × x^px × y^py. px 가 −1 이면 c ÷ x */
  var T = function (c, px, py, d) { return { c: c, d: d || 1, px: px || 0, py: py || 0 }; };
  var isFrac = Array.isArray;
  var negV = function (x) { return isFrac(x) ? x[0] < 0 : x < 0; };
  var absV = function (x) { return isFrac(x) ? [abs(x[0]), x[1]] : abs(x); };
  var vF = function (x) { return isFrac(x) ? F(x[0], x[1]) : F(x); };
  var plainV = function (x, d) { return isFrac(x) ? (x[0] < 0 ? '-' : '') + '\\' + (d ? 'd' : '') + 'frac{' + abs(x[0]) + '}{' + x[1] + '}' : String(x); };
  /** 값 x 를 e 제곱한 모습. 음수와 분수는 괄호에 넣는다 */
  var powT = function (x, e) {
    var base = plainV(x), wrap = isFrac(x) ? '\\left(' + base + '\\right)' : '(' + base + ')';
    if (e === 1) return negV(x) ? wrap : base;
    return (negV(x) || isFrac(x) ? wrap : base) + '^{' + e + '}';
  };
  var termBody = function (t, L) {
    var c = abs(t.c);
    if (t.px === -1) return '\\frac{' + c + '}{' + L[0] + '}';
    var letters = (t.px ? L[0] + (t.px > 1 ? '^{' + t.px + '}' : '') : '') + (t.py ? L[1] + (t.py > 1 ? '^{' + t.py + '}' : '') : '');
    var top = (c !== 1 || !letters ? c : '') + letters;
    return t.d > 1 ? '\\frac{' + top + '}{' + t.d + '}' : top;
  };
  var subBody = function (t, val) {
    var c = abs(t.c), parts = [];
    if (t.px === -1) return '\\frac{' + c + '}{' + plainV(val[0]) + '}';
    if (c !== 1 || (!t.px && !t.py)) parts.push(String(c));
    if (t.px) parts.push(powT(val[0], t.px));
    if (t.py) parts.push(powT(val[1], t.py));
    if (t.d > 1) return '\\frac{' + (parts.length === 1 ? parts[0].replace(/^\((.*)\)$/, '$1') : parts.join(' \\times ')) + '}{' + t.d + '}';
    return parts.join(' \\times ');
  };
  var joinT = function (terms, body) { return terms.map(function (t, i) { return (i ? (t.c < 0 ? ' - ' : ' + ') : (t.c < 0 ? '-' : '')) + body(t); }).join(''); };
  var exprT = function (q) { return big(joinT(q.t, function (t) { return termBody(t, q.L); })); };
  var subT = function (q, val) { return big(joinT(q.t, function (t) { return subBody(t, val || q.val); })); };
  var oneSub = function (t, val) { return big((t.c < 0 ? '-' : '') + subBody(t, val)); };
  var hasLetter = function (t) { return !!(t.px || t.py); };
  /** 항 하나의 값. mode 는 실수의 종류. 돌려주는 것: { f, hit(그 실수가 이 항에서 일어났는가) } */
  var termF = function (t, val, mode) {
    var x = val[0], y = val.length > 1 ? val[1] : 1, sg = t.c < 0 ? -1 : 1, c = abs(t.c), hit = false, f;
    var simple = t.px === 1 && !t.py && t.d === 1 && c >= 2 && !isFrac(x);
    if (mode === 'glued' && simple && c <= 9 && x >= 1 && x <= 9) return { f: F(sg * (10 * c + x)), hit: true };
    if (mode === 'added' && simple) return { f: F(sg * (c + x)), hit: true };
    var pw = function (v, e) {
      if (mode === 'times' && e === 2) { hit = true; return vF(v).mul(2); }
      var out = F(1);
      for (var i = 0; i < e; i++) out = out.mul(vF(v));
      return out;
    };
    f = (t.px === -1 ? F(c).div(vF(x)) : F(c, t.d).mul(pw(x, t.px)).mul(pw(y, t.py))).mul(sg);
    if (mode === 'pow-paren' && ((t.px === 2 && negV(x)) || (t.py === 2 && negV(y)))) { hit = true; f = f.neg(); }
    if (mode === 'double-neg' && t.c < 0 && hasLetter(t) && f.compare(0) > 0) { hit = true; f = f.neg(); }
    return { f: f, hit: hit };
  };
  var toInt = function (f) { return Number(f.d) === 1 ? Number(f.s) * Number(f.n) : null; };
  /** 식의 값(정수가 아니면 null). mode 를 주면 그 실수를 했을 때의 값(그 실수가 일어날 곳이 없으면 null) */
  var total = function (q, mode) {
    var val = q.val, hit = !mode, sum = F(0);
    if (mode === 'sign-lost') { hit = val.some(negV); val = val.map(absV); }
    q.t.forEach(function (t) { var r = termF(t, val, mode); sum = sum.add(r.f); hit = hit || r.hit; });
    return hit ? toInt(sum) : null;
  };
  var termInts = function (q) { return q.t.map(function (t) { return toInt(termF(t, q.val).f); }); };
  var firstHit = function (q, mode) { return q.t.filter(function (t) { return termF(t, q.val, mode).hit; })[0]; };
  var soundValue = function (lo) {
    return function (v) {
      var ans = total(v.q);
      return termInts(v.q).every(function (x) { return x !== null && x !== 0; }) && ans !== null && ans >= lo && abs(ans) <= 100;
    };
  };
  var given = function (q) { return q.L.map(function (l, i) { return '$' + l + ' = ' + plainV(q.val[i], true) + '$'; }).join(', '); };
  var MISTAKE = {
    glued: function (q) {
      var t = firstHit(q, 'glued'), w = termBody(t, q.L);
      return '$' + w + '$의 ' + q.L[0] + ' 자리에 ' + josa(q.val[0], '을/를') + ' 넣으면서 숫자를 나란히 붙여 ' + josa(10 * abs(t.c) + q.val[0], '으로/로') + ' 읽었어요. $' + w + '$ 속에는 수와 문자 사이에 ×가 생략되어 있어요. 이렇게 계산해요: $' + subBody(t, q.val) + '$';
    },
    added: function (q) {
      var t = firstHit(q, 'added');
      return '곱해야 할 곳에서 더했어요. $' + termBody(t, q.L) + '$ 속에는 수와 문자 사이에 ×가 생략되어 있어요. 이렇게 계산해요: $' + subBody(t, q.val) + '$';
    },
    'sign-lost': function (q) { return '음수를 넣으면서 부호 −를 빠뜨렸어요. 문자 자리에는 부호까지 괄호에 넣어서 써요: $' + subT(q) + '$'; },
    'double-neg': function (q) { return '음수에 음수를 곱하면 양수예요. $' + oneSub(firstHit(q, 'double-neg'), q.val) + '$ 부분의 부호를 다시 확인해 보세요.'; },
    'pow-paren': function (q) {
      var t = firstHit(q, 'pow-paren'), i = t.px === 2 && negV(q.val[0]) ? 0 : 1;
      return '제곱의 부호를 잘못 정했어요. $' + q.L[i] + '^{2}$에 음수를 넣으면 이렇게 돼요: $' + powT(q.val[i], 2) + '$. 부호 −까지 두 번 곱하니 양수예요. 식 앞에 따로 붙은 −는 제곱을 한 다음에 붙여요.';
    },
    times: function (q) {
      var t = firstHit(q, 'times'), i = t.px === 2 ? 0 : 1, b = powT(q.val[i], 1);
      return '제곱을 두 배로 계산했어요. 지수는 곱하는 횟수예요. 이렇게 계산해요: $' + powT(q.val[i], 2) + ' = ' + b + ' \\times ' + b + '$';
    }
  };
  var valueType = function (id, title, levels, ids) {
    MH.defineType({
      id: id, unit: 'B05', version: 1, title: title,
      answer: { kind: 'signed' },
      levels: levels,
      prompt: function (v) { return { text: given(v.q) + '일 때, 다음 식의 값을 구하세요.', tex: exprT(v.q) }; },
      solve: function (v) { return { n: total(v.q), p: 0 }; },
      /* 검산: 화면에 보이는 식을 계산기로 다시 읽고 문자에 수를 넣는다 */
      verify: function (v, ans) {
        var env = {};
        v.q.L.forEach(function (l, i) { env[l] = vF(v.q.val[i]); });
        return ev(exprT(v.q), env).equals(F(ans.n)) && ev(subT(v.q), {}).equals(F(ans.n)) && ans.p === 0;
      },
      hints: function (v) {
        var q = v.q, care = [];
        var sq = q.t.some(function (t) { return (t.px === 2 && negV(q.val[0])) || (t.py === 2 && negV(q.val[1])); });
        if (sq) care.push('음수의 제곱은 부호 −까지 두 번 곱하니 양수예요. 식 앞에 따로 붙은 −는 제곱을 한 다음에 붙여요.');
        if (firstHit(q, 'double-neg')) care.push('음수에 음수를 곱하면 양수가 돼요: $' + oneSub(firstHit(q, 'double-neg'), q.val) + '$ 부분을 조심해요.');
        if (q.t.some(function (t) { return t.px === -1 || t.d > 1; })) care.push('분수 꼴은 분자를 분모로 나누는 나눗셈이에요. 부호가 다르면 몫은 음수예요.');
        if (q.val.some(isFrac)) care.push('분수를 곱할 때는 곱하는 수와 분모를 먼저 약분하면 쉬워요.');
        if (!care.length) care.push('곱셈을 한 다음, 그 값으로 덧셈이나 뺄셈을 해요. 곱셈과 덧셈의 순서를 바꾸면 값이 달라져요.');
        return [
          '문자는 수가 들어갈 빈 상자예요. "' + given(q) + '일 때"라는 말은 그 상자에 이 수를 넣으라는 뜻이에요. 식에서 문자가 보이는 자리마다 문자를 지우고 수를 써요. 이것을 "대입한다"고 해요.',
          '수를 넣을 때 두 가지를 지켜요. ① 수와 문자 사이에 생략된 ×를 다시 써요. 그냥 나란히 붙이면 다른 수가 되어 버려요. ② 음수나 분수는 괄호에 넣어서 써요. 그러면 식이 이렇게 바뀌어요: $' + subT(q) + '$',
          '이제 수만 남았으니 순서대로 계산해요. 거듭제곱 → 곱셈과 나눗셈 → 덧셈과 뺄셈 차례예요. ' + care.join(' ')
        ];
      },
      steps: function (v) {
        var q = v.q, ints = termInts(q), ans = total(q), out = [];
        var lettered = q.t.filter(hasLetter), value = { n: ans, p: 0 };
        out.push({ say: '문자 자리에 수를 넣어요. 생략된 ×를 다시 쓰고, 음수와 분수는 괄호에 넣어요.', tex: exprT(q) + ' = ' + subT(q) });
        var note = q.t.some(function (t) { return (t.px === 2 && negV(q.val[0])) || (t.py === 2 && negV(q.val[1])); }) ? ' 음수의 제곱은 양수예요.' : firstHit(q, 'double-neg') ? ' 음수에 음수를 곱하면 양수예요.' : '';
        var calc = lettered.map(function (t) { return oneSub(t, q.val) + ' = ' + ints[q.t.indexOf(t)]; }).join(',\\quad ');
        if (q.t.length === 1) { out.push({ say: '곱셈을 계산해요.' + note + ' 답은 ' + josa(String(ans).replace('-', '−'), '이에요/예요') + '.', tex: calc, value: value }); return out; }
        out.push({ say: (q.t.some(function (t) { return t.px === 2 || t.py === 2; }) ? '거듭제곱과 곱셈' : q.t.some(function (t) { return t.px === -1 || t.d > 1; }) ? '분수 꼴(나눗셈)' : '곱셈') + '부터 계산해요.' + note, tex: calc });
        out.push({ say: '구한 값으로 덧셈 · 뺄셈을 해요. 답은 ' + josa(String(ans).replace('-', '−'), '이에요/예요') + '.',
          tex: ints.map(function (x, i) { return i ? (x < 0 ? ' - ' + abs(x) : ' + ' + x) : String(x); }).join('') + ' = ' + ans, value: value });
        return out;
      },
      mistakes: ids.map(function (id) {
        return { id: id, wrong: function (v) { var w = total(v.q, id); return w === null ? null : { n: w, p: 0 }; }, explain: function (v) { return MISTAKE[id](v.q); } };
      })
    });
  };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var ONE = ['x', 'a', 'k', 't'];
  valueType('B05.value', '식의 값', [
    { name: '자연수를 넣기', vars: { q: sampler(function (r) {
        var x = r.int(2, 9), c = r.int(2, 9), form = r.int(0, 2);
        var t = form === 0 ? [T(c, 1), T(r.int(1, 20))] : form === 1 ? [T(c, 1), T(-r.int(1, c * x))] : [T(c * x + r.int(0, 20)), T(-c, 1)];
        return { L: [r.pick(ONE)], val: [x], t: t };
      }) }, where: soundValue(0) },
    { name: '음수를 넣기', vars: { q: sampler(function (r) {
        var x = -r.int(1, 9), c = r.int(2, 9), b = r.int(1, 20), form = r.int(0, 5);
        var t = form === 0 ? [T(c, 1), T(pm(r, b))] : form === 1 ? [T(-c, 1), T(pm(r, b))] : form === 2 ? [T(b), T(-c, 1)] : form === 3 ? [T(-1, 1), T(pm(r, b))] : form === 4 ? [T(b), T(-1, 1)] : [T(b), T(c, 1)];
        return { L: [r.pick(ONE)], val: [x], t: t };
      }) }, where: soundValue(-100) },
    { name: '분수 꼴의 식 · 분수를 넣기', vars: { q: sampler(function (r) {
        var form = r.int(0, 2), b = pm(r, r.int(1, 12)), d, x;
        if (form === 0) { d = r.int(2, 6); return { L: [r.pick(ONE)], val: [d * nz(r, -6, 6)], t: [T(pm(r, 1), 1, 0, d), T(b)] }; }
        if (form === 1) { x = pm(r, r.int(2, 6)); return { L: [r.pick(ONE)], val: [x], t: [T(pm(r, abs(x) * r.int(1, 6)), -1), T(b)] }; }
        do { d = r.int(2, 5); x = r.int(1, d - 1); } while (MH.gcd(x, d) > 1);
        return { L: [r.pick(ONE)], val: [[r.int(0, 2) ? -x : x, d]], t: [T(pm(r, d * r.int(1, 4)), 1), T(b)] };
      }) }, where: soundValue(-100) }
  ], ['glued', 'added', 'sign-lost', 'double-neg']);

  var TWO = [['x', 'y'], ['a', 'b'], ['p', 'q']];
  var twoVals = function (r) { var x, y; do { x = nz(r, -6, 6); y = nz(r, -6, 6); } while (x > 0 && y > 0); return [x, y]; };
  valueType('B05.value2', '거듭제곱 · 두 문자의 식의 값', [
    { name: '제곱이 있는 식', vars: { q: sampler(function (r) {
        var x = r.int(1, 10) <= 7 ? -r.int(2, 6) : r.int(2, 6), c = r.int(2, 4), b = r.int(1, 12), form = r.int(0, 5);
        var t = form === 0 ? [T(1, 2), T(pm(r, b))] : form === 1 ? [T(-1, 2), T(pm(r, b))] : form === 2 ? [T(c, 2), T(-b)] : form === 3 ? [T(1, 2), T(pm(r, c), 1)]
          : form === 4 ? [T(1, 2), T(-c, 1), T(b)] : [T(b), T(-1, 2)];
        return { L: [r.pick(ONE)], val: [x], t: t };
      }) }, where: soundValue(-100) },
    { name: '두 문자', vars: { q: sampler(function (r) {
        var c = r.int(2, 5), e = r.int(2, 5), b = r.int(1, 12), form = r.int(0, 4);
        var t = form === 0 ? [T(c, 1), T(e, 0, 1)] : form === 1 ? [T(c, 1), T(-e, 0, 1)] : form === 2 ? [T(pm(r, r.int(1, 3)), 1, 1), T(pm(r, b))] : form === 3 ? [T(-1, 1, 1), T(b)] : [T(pm(r, c), 1), T(-1, 0, 1)];
        return { L: r.pick(TWO), val: twoVals(r), t: t };
      }) }, where: soundValue(-100) },
    { name: '두 문자와 제곱 · 분수 꼴', vars: { q: sampler(function (r) {
        var c = r.int(2, 4), e = r.int(2, 4), b = r.int(1, 9), form = r.int(0, 5), val = twoVals(r);
        var t = form === 0 ? [T(1, 2), T(pm(r, e), 0, 1)] : form === 1 ? [T(1, 2), T(-1, 1, 1)] : form === 2 ? [T(pm(r, c), 1), T(-1, 0, 2)] : form === 3 ? [T(pm(r, 1), 2), T(1, 0, 2)]
          : form === 4 ? [T(abs(val[0]) * r.int(1, 6), -1), T(-1, 0, 1)] : [T(1, 1, 1, r.int(2, 6)), T(pm(r, b))];
        return { L: r.pick(TWO), val: val, t: t };
      }) }, where: function (v) { return soundValue(-100)(v) && (v.q.t[0].px !== -1 || abs(v.q.val[0]) > 1); } }
  ], ['pow-paren', 'times', 'double-neg', 'sign-lost']);
})();

/* ── 개념 카드 ── */
MH.defineConcept('B05', [
  { title: '문자를 쓰는 까닭', body: [
    '한 개에 500원인 빵을 살 때, 값은 몇 개를 사느냐에 따라 달라져요.',
    { ex: [['500 \\times 1', '1개의 값'], ['500 \\times 2', '2개의 값'], ['500 \\times 3', '3개의 값'], ['500 \\times x', 'x개의 값']] },
    '개수가 정해지지 않았을 때는 수 대신 문자 $x$를 써요. 문자는 "아직 정해지지 않은 수가 들어갈 자리"예요.',
    '이렇게 하면 몇 개를 사든 식 하나로 나타낼 수 있어요. 어려운 것이 아니라, 같은 말을 여러 번 쓰지 않으려는 줄임말이에요.'
  ] },
  { title: '곱셈 기호 ×는 생략해요', body: [
    '문자 $x$와 곱셈 기호 ×는 모양이 닮아서 헷갈려요. 그래서 문자가 있는 식에서는 ×를 쓰지 않고 붙여 써요.',
    { list: ['① 수는 문자 앞에 써요.', '② 문자는 알파벳 순서로 써요.', '③ 같은 문자의 곱은 거듭제곱으로 써요.', '④ 괄호가 있으면 수를 괄호 앞에 써요.'] },
    { ex: [['a \\times 5 = 5a', '수를 앞에'], ['b \\times 3 \\times a = 3ab', '알파벳 순서로'], ['a \\times a \\times 2 = 2a^{2}', '같은 문자는 거듭제곱'], ['(x + y) \\times 4 = 4(x + y)', '괄호는 그대로']] },
    '수끼리의 곱 $2 \\times 3$은 생략하지 않아요. 붙여 쓰면 23이 되어 버리니까요.'
  ] },
  { title: '1과 −1, 그리고 틀리기 쉬운 것', body: [
    '1을 곱해도 값이 그대로라서, 문자 앞의 1은 쓰지 않아요.',
    { ex: [['1 \\times a = a', '1은 쓰지 않아요'], ['(-1) \\times a = -a', '부호 −만 남겨요'], ['0.1 \\times a = 0.1a', '소수 속의 1은 그대로 써요'], ['x \\times (-3) = -3x', '음수도 문자 앞에']] },
    '$x \\times (-3)$을 $x - 3$으로 쓰면 안 돼요. $x - 3$은 "x에서 3을 뺀다"는 전혀 다른 식이에요.',
    '$a \\times a$는 $a^{2}$이고 $a + a$는 $2a$예요. 곱한 것과 더한 것을 구별해요.'
  ] },
  { title: '나눗셈 기호 ÷는 분수 꼴로', body: [
    '나눗셈 기호 ÷도 쓰지 않아요. 대신 분수로 써요. ÷ 앞의 것이 분자(위), ÷ 바로 뒤의 것이 분모(아래)예요.',
    { ex: [['a \\div 5 = \\dfrac{a}{5}', '5로 나눈다 = 5분의 a'], ['3 \\div x = \\dfrac{3}{x}', '문자도 분모에 올 수 있어요'], ['a \\div b \\times c = \\dfrac{ac}{b}', '왼쪽부터. ÷ 바로 뒤의 b만 분모'], ['a \\div b \\div c = \\dfrac{a}{bc}', '÷ 뒤의 b, c가 모두 분모']] },
    '덧셈 기호 +와 뺄셈 기호 −는 생략할 수 없어요. $a + 5$를 $5a$로 쓰면 곱셈이 되어 버려요.'
  ] },
  { title: '대입과 식의 값', body: [
    '문자 자리에 수를 넣는 것을 "대입"이라 하고, 넣어서 계산한 결과를 "식의 값"이라고 해요. 빈 상자에 수를 넣는 것과 같아요.',
    '$x = 3$일 때 $2x + 5$의 값을 구해 볼게요.',
    { tex: '\\begin{aligned} 2x + 5 &= 2 \\times 3 + 5 \\\\ &= 6 + 5 \\\\ &= 11 \\end{aligned}' },
    { list: ['① 생략된 ×를 다시 써요.', '② 문자 자리에 수를 넣어요.', '③ 곱셈을 먼저, 덧셈 · 뺄셈을 나중에 계산해요.'] },
    '$2x$에 3을 넣으면 23이 아니에요. $2x$는 $2 \\times x$라서 $2 \\times 3 = 6$이에요.'
  ] },
  { title: '음수를 넣을 때는 괄호', body: [
    '음수는 반드시 괄호에 넣어서 대입해요. 괄호가 없으면 부호를 놓치기 쉬워요. $x = -3$일 때를 볼게요.',
    { ex: [['2x', '$2 \\times (-3) = -6$'], ['-x', '$-(-3) = 3$. 음수의 반대라서 양수'], ['x^{2}', '$(-3)^{2} = 9$. −까지 두 번 곱해요'], ['-x^{2}', '$-(-3)^{2} = -9$. 제곱한 다음 −를 붙여요'], ['\\dfrac{6}{x}', '$6 \\div (-3) = -2$']] },
    '문자가 두 개이면 각각 제 자리에 넣어요. $x = 2$, $y = -1$일 때 $3x - 2y$의 값은 이렇게 구해요.',
    { tex: '\\begin{aligned} 3x - 2y &= 3 \\times 2 - 2 \\times (-1) \\\\ &= 6 + 2 = 8 \\end{aligned}' }
  ] }
]);
