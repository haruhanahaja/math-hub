/* B05 문자의 사용과 식의 값 — 단원 전용 검사.
   화면에 보이는 식과 보기(KaTeX 글)를 여기서 따로 만든 계산기(BigInt 분수)로 다시 읽는다. 문자에는 수를 넣어 값을 비교한다. 엔진의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, SG = MH.kinds.signed;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  /* ── 식 읽기: 덧셈 · 뺄셈 < 곱셈 · 나눗셈 < 앞에 붙은 부호 < 붙여 쓴 곱 < 거듭제곱 < 괄호 · 수 · 문자 ── */
  var gcd = function (a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { var t = a % b; a = b; b = t; } return a; };
  var Q = function (n, d) { if (d === 0n) throw new Error('0 으로 나눔'); if (d < 0n) { n = -n; d = -d; } var g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
  var calc = function (tex, env) {
    var s = tex.replace(/\\left|\\right/g, '').replace(/\^\{(\d+)\}/g, '^$1'), before;
    do { before = s; s = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'); } while (s !== before);
    s = s.replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\quad/g, '').replace(/\s/g, '');
    var i = 0;
    var atom = function () {
      if (s[i] === '(') { i++; var x = expr(); if (s[i] !== ')') throw new Error('괄호 ' + tex); i++; return x; }
      var m = /^(\d+)(?:\.(\d+))?/.exec(s.slice(i));
      if (m) { i += m[0].length; return Q(BigInt(m[1] + (m[2] || '')), 10n ** BigInt((m[2] || '').length)); }
      if (/[a-z]/.test(s[i] || '') && env && env[s[i]]) return env[s[i++]];
      throw new Error('읽을 수 없음 ' + tex + ' @' + i);
    };
    var power = function () {
      var x = atom();
      if (s[i] !== '^') return x;
      var m = /^\^(\d+)/.exec(s.slice(i)); i += m[0].length;
      return Q(x.n ** BigInt(m[1]), x.d ** BigInt(m[1]));
    };
    var glued = function () { var x = power(); while (i < s.length && /[a-z0-9(]/.test(s[i])) { var y = power(); x = Q(x.n * y.n, x.d * y.d); } return x; };
    var unary = function () { if (s[i] === '-') { i++; var x = unary(); return Q(-x.n, x.d); } if (s[i] === '+') { i++; return unary(); } return glued(); };
    var term = function () {
      var x = unary();
      while (s[i] === '*' || s[i] === '/') { var op = s[i++], y = unary(); x = op === '*' ? Q(x.n * y.n, x.d * y.d) : Q(x.n * y.d, x.d * y.n); }
      return x;
    };
    var expr = function () {
      var x = term();
      while (s[i] === '+' || s[i] === '-') { var op = s[i++], y = term(); x = Q(op === '+' ? x.n * y.d + y.n * x.d : x.n * y.d - y.n * x.d, x.d * y.d); }
      return x;
    };
    var out = expr();
    if (i !== s.length) throw new Error('읽다 만 식 ' + tex + ' @' + i);
    return out;
  };
  /* 문자에 넣어 볼 수 세 벌(서로 다른 식이 우연히 같은 값이 되지 않게 소수, 음수, 분수를 섞는다) */
  var ENVS = [{}, {}, {}], PRIMES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n, 73n, 79n, 83n, 89n, 97n, 101n];
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function (l, k) {
    ENVS[0][l] = Q(PRIMES[k], 1n); ENVS[1][l] = Q(-PRIMES[(k + 7) % 26], 1n); ENVS[2][l] = Q(PRIMES[(k + 3) % 26], PRIMES[(k + 11) % 26]);
  });
  var str = function (x) { return x.n + '/' + x.d; };
  /** 식에 수를 넣은 값 세 개를 이은 글. 읽을 수 없는 식이면 null */
  var sig = function (tex) { try { return ENVS.map(function (e) { return str(calc(tex, e)); }).join(' '); } catch (e) { return null; } };
  /** 쓰는 약속을 지켰는가: 수가 맨 앞, 문자는 알파벳 순서로 한 번씩, 쓸모없는 1 이 없음(곱으로만 된 식을 본다) */
  var wellFormed = function (t) {
    var m = /^-?(\d+(?:\.\d+)?)?((?:[a-z](?:\^\{\d\})?)*)(\([a-z][+-][a-z]\))?$/.exec(t);
    if (!m) return false;
    var ls = (m[2].match(/[a-z]/g) || []);
    return m[1] !== '1' && (m[1] !== undefined || ls.length > 0 || !!m[3]) && ls.every(function (l, k) { return k === 0 || ls[k - 1] < l; });
  };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx);
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    /* 답이 문자 하나(1 × a = a)이면 '이 식의 문자: a' 와 겹치므로 보지 않는다 */
    if (typeof p.answer === 'string' && p.answer.length > 1) ok(h.join(' ').indexOf('$' + p.answer + '$') < 0, where + '힌트가 정답 보기를 그대로 말함');
  };
  /* 수식 속 문자 바로 뒤의 조사는 그 문자를 읽는 소리에 맞아야 한다(엘 · 엠 · 엔 · 알은 받침이 있다) */
  var noJosa = function (list, where) {
    var re = /([a-z])\$(이에요|예요|은 |는 |을 |를 |이 |가 |과 |와 |으로 |로 )/g, withFinal = ['이에요', '은 ', '을 ', '이 ', '과 ', '으로 '];
    list.forEach(function (t) {
      var m;
      while ((m = re.exec(t))) {
        var closed = 'lmnr'.indexOf(m[1]) >= 0, want = m[2] === '으로 ' || m[2] === '로 ' ? (m[1] === 'm' || m[1] === 'n') : closed;
        ok((withFinal.indexOf(m[2]) >= 0) === want, where + '문자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
    });
  };

  group('B05 — 계산기 자체 검사');
  var E = { a: Q(2n, 1n), b: Q(3n, 1n), x: Q(-3n, 1n), y: Q(5n, 1n) }, C = function (t) { return str(calc(t, E)); };
  eq([C('3ab'), C('ab^{2}'), C('-x^{2}'), C('(-3)^{2}'), C('\\frac{ab}{4}'), C('a \\div b \\times 6'), C('2(a+b)'), C('a5'), C('0.1a'), C('\\dfrac{6}{x} - y'), C('a+\\frac{b}{2}'), C('-2 \\times \\left(-\\dfrac{1}{2}\\right) - 6')].join(' '),
    '18/1 18/1 -9/1 9/1 3/2 4/1 10/1 10/1 1/5 -7/1 7/2 -5/1', '붙여 쓴 곱 · 거듭제곱 · 분수 꼴 · 왼쪽부터 · 괄호');
  eq(sig('0.a'), null, '0.a 는 읽을 수 없는 식');
  eq([wellFormed('3ab'), wellFormed('-a^{2}b'), wellFormed('-(a-b)'), wellFormed('0.1a'), wellFormed('3k(x+y)'), wellFormed('a3'), wellFormed('1a'), wellFormed('-1ab'), wellFormed('3aa'), wellFormed('ba'), wellFormed('a+3'), wellFormed('(x+y)4')].join(' '),
    'true true true true true false false false false false false false', '쓰는 약속 검사');
  done('식 읽기');

  group('B05 — 보이는 식과 보기가 맞는가 (유형 · 단계마다 1,000문제)');
  /* 보기 고르기: 정답 보기만 원래 식과 값이 같고 약속대로 쓴 것이다 */
  var choices = function (id, p, pr, where, source) {
    var opts = MH.optionsOf(p), want = sig(source);
    ok(want !== null, where + '식을 읽을 수 없음 ' + source);
    ok(opts.length === 4 && opts.every(function (o, k) { return opts.indexOf(o) === k; }), where + '보기는 서로 다른 네 개 ' + opts.join(' , '));
    ok(opts.indexOf(p.answer) >= 0 && sig(p.answer) === want, where + '정답 보기의 값 ' + source + ' → ' + p.answer);
    return opts.filter(function (o) { return o !== p.answer; }).map(function (o) { return { tex: o, same: sig(o) === want }; });
  };
  var seen = {};
  each('B05.omit', function (p, pr, level, where) {
    var wrong = choices('B05.omit', p, pr, where, pr.tex);
    ok(wellFormed(p.answer), where + '정답이 약속대로 쓴 꼴이 아님 ' + p.answer);
    wrong.forEach(function (w) { ok(!w.same || !wellFormed(w.tex), where + '틀린 보기가 사실은 맞음 ' + w.tex + ' (식 ' + pr.tex + ')'); });
    ok(!/\\div|[+-] [a-z0-9(]|^[^(]* [+-] [^)]*$/.test(pr.tex.replace(/\([a-z] [+-] [a-z]\)/, 'G')), where + '곱셈만 있는 식 ' + pr.tex);
    var parts = pr.tex.split(' \\times '), ls = parts.filter(function (x) { return /^[a-z]$/.test(x); }), rep = ls.some(function (l, k) { return ls.indexOf(l) !== k; });
    var one = parts.some(function (x) { return x === '1' || x === '(-1)'; }), grp = /\([a-z] /.test(pr.tex), dec = /0\./.test(pr.tex);
    ok(level === 0 ? !rep && !one && !grp && !dec : level === 1 ? (rep || one) && !grp && !dec : grp || dec || rep, where + '단계의 꼴 ' + pr.tex);
    seen['omit' + level + (rep ? 'r' : '') + (one ? '1' : '') + (grp ? 'g' : '') + (dec ? 'd' : '')] = 1;
    detailed('B05.omit', p, where);
    if (p.seed <= 60) noJosa(MH.types['B05.omit'].hints(p.v), where);
  });
  ok(seen.omit0 && seen.omit1r && seen.omit11 && seen.omit2g && seen.omit2d && seen.omit2r && seen.omit21g, '곱셈 기호 생략: 단계마다 나오는 꼴 ' + Object.keys(seen).join(' '));
  done('곱셈 기호 생략');
  var kinds = {};
  each('B05.div', function (p, pr, level, where) {
    var wrong = choices('B05.div', p, pr, where, pr.tex);
    wrong.forEach(function (w) { ok(!w.same, where + '틀린 보기가 사실은 맞음 ' + w.tex + ' (식 ' + pr.tex + ')'); });
    ok(/\\frac/.test(p.answer) && !/\\times|\\div/.test(p.answer), where + '정답은 기호가 없는 분수 꼴 ' + p.answer);
    var ops = (pr.tex.match(/\\times|\\div/g) || []).length, sum = / [+-] /.test(pr.tex), par = /\(/.test(pr.tex.replace(/\(-\d\)/, ''));
    ok(level === 0 ? ops === 1 && !sum && !par : level === 1 ? ops === 2 && !sum && !par : sum || par, where + '단계의 꼴 ' + pr.tex);
    ok((pr.text.indexOf('곱셈 기호') >= 0) === /\\times/.test(pr.tex), where + '문제 글이 식과 맞는가 ' + pr.tex);
    kinds[p.v.q.k + (p.v.q.ops ? p.v.q.ops.join('') : '') + (p.v.q.dir === undefined ? '' : p.v.q.dir)] = 1;
    detailed('B05.div', p, where);
    if (p.seed <= 60) noJosa(MH.types['B05.div'].hints(p.v), where);
  });
  eq(Object.keys(kinds).sort().join(' '), 'chain×÷ chain÷× chain÷÷ group0 group1 paren terms two', '나눗셈 기호 생략: 나오는 꼴');
  done('나눗셈 기호 생략');
  var topics = {};
  each('B05.word', function (p, pr, level, where) {
    var built = MH.types['B05.word'].steps(p.v), raw = built[1].tex;
    var wrong = choices('B05.word', p, pr, where, raw);
    wrong.forEach(function (w) { ok(!w.same, where + '틀린 보기가 사실은 맞음 ' + w.tex + ' (' + pr.text + ')'); });
    ok(!pr.tex && /\$[a-z]\$/.test(pr.text) && /고르세요\.$/.test(pr.text) && !/\d\/\d/.test(pr.text), where + '문제 글 ' + pr.text);
    ok(!/\\times|\\div/.test(p.answer), where + '정답에 기호가 남음 ' + p.answer);
    topics[level + p.v.q.k] = 1;
    detailed('B05.word', p, where);
    if (p.seed <= 100) noJosa(MH.types['B05.word'].hints(p.v).concat(MH.mistakesFor(p).map(function (m) { return m.explain; })), where);
  });
  eq(Object.keys(topics).sort().join(' '), '0age 0left 0price 0share 0square 1change 1dist 1read 1rect 1two 2digits 2mean 2percent', '문자를 사용한 식: 단계마다 나오는 상황');
  done('문자를 사용한 식');

  /* 식의 값: 문제 글의 "x = −3" 을 읽어 식에 넣는다 */
  var envOf = function (text) {
    var env = {}, re = /\$([a-z]) = (-?)(?:\\dfrac\{(\d+)\}\{(\d+)\}|(\d+))\$/g, m;
    while ((m = re.exec(text))) env[m[1]] = Q(BigInt((m[2] ? '-' : '') + (m[3] || m[5])), BigInt(m[4] || 1));
    return env;
  };
  var shapes = {};
  ['B05.value', 'B05.value2'].forEach(function (id) {
    each(id, function (p, pr, level, where) {
      var env = envOf(pr.text), names = Object.keys(env), got;
      ok(names.length === (pr.text.match(/=/g) || []).length && names.length >= 1, where + '넣을 수를 읽지 못함 ' + pr.text);
      try { got = calc(pr.tex, env); } catch (e) { ok(false, where + e.message); return; }
      ok(got.d === 1n && got.n === BigInt(p.answer.n) && p.answer.p === 0, where + pr.text + ' ' + pr.tex + ' → ' + SG.tex(p.answer));
      ok(names.every(function (l) { return pr.tex.indexOf(l) >= 0; }) && Math.abs(p.answer.n) <= 100, where + '식에 그 문자가 있고 답이 크지 않음 ' + pr.tex);
      var neg = names.some(function (l) { return env[l].n < 0n; }), frac = /frac/.test(pr.tex) || /frac/.test(pr.text), sq = /\^\{2\}/.test(pr.tex);
      if (id === 'B05.value') ok(names.length === 1 && !sq && (level === 0 ? !neg && !frac && p.answer.n >= 0 : level === 1 ? neg && !frac : frac), where + '단계의 꼴 ' + pr.text + ' ' + pr.tex);
      else ok(level === 0 ? names.length === 1 && sq : level === 1 ? names.length === 2 && neg && !sq && !frac : names.length === 2 && neg && (sq || frac), where + '단계의 꼴 ' + pr.text + ' ' + pr.tex);
      /* 풀이의 줄마다: '식 = 값' 은 양쪽이 같아야 한다(문자가 있는 줄은 수를 넣어 본다) */
      MH.types[id].steps(p.v).forEach(function (s) {
        if (!s.tex) return;
        s.tex.split(',\\quad ').forEach(function (part) {
          var side = part.split(' = ');
          if (!ok(side.length === 2, where + '풀이의 줄 ' + part)) return;
          var l = calc(side[0], env), r = calc(side[1], env);
          ok(l.n === r.n && l.d === r.d, where + '풀이의 줄이 틀림 ' + part);
        });
      });
      var last = MH.types[id].steps(p.v).pop().tex.split(' = ');
      ok(calc(last[last.length - 1], {}).n === BigInt(p.answer.n), where + '풀이의 마지막 줄이 답으로 끝남');
      /* 힌트에는 문제에 없는 숫자를 쓰지 않는다 */
      var shown = (JSON.stringify(pr).match(/\d+/g) || []), h = MH.types[id].hints(p.v);
      ok((h.join(' ').match(/\d+/g) || []).every(function (d) { return shown.indexOf(d) >= 0; }), where + '힌트에 문제에 없는 숫자: ' + h.join(' / '));
      shapes[id.slice(4) + ':' + level + (frac ? 'f' : '') + (/\\dfrac/.test(pr.text) ? 'F' : '')] = 1;
      detailed(id, p, where);
      if (p.seed <= 60) noJosa(h.concat(MH.mistakesFor(p).map(function (m) { return m.explain; })), where);
    });
    done(MH.types[id].title);
  });
  eq(Object.keys(shapes).sort().join(' '), 'value2:0 value2:1 value2:2 value2:2f value:0 value:1 value:2f value:2fF', '식의 값: 단계마다 나오는 꼴');

  group('B05 — 흔한 실수와 풀이 · 힌트의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var EX = function (p, raw) { return MH.judge(p, raw).mistake.explain; };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var H = function (p) { return MH.types[p.type].hints(p.v); };
  var O = [0, 1, 2, 3];
  var o1 = prob('B05.omit', { q: { it: ['x', -3], o: O } }), o2 = prob('B05.omit', { q: { it: ['a', 'b', 'a'], o: O } });
  var o3 = prob('B05.omit', { q: { it: ['(x + y)', -1], o: O } }), o4 = prob('B05.omit', { q: { it: ['a', '0.1'], o: O } }), o5 = prob('B05.omit', { q: { it: ['y', 'x', -3, 'x'], o: O } });
  eq(MH.types['B05.omit'].prompt(o1.v).tex + ' → ' + MH.optionsOf(o1).join(' , '), 'x \\times (-3) → -3x , x-3 , 3x , -3+x', 'x × (−3) 의 보기');
  eq([J(o1, '-3x'), J(o1, 'x-3'), J(o1, '3x'), J(o1, '-3+x')].join(' '), 'correct:- wrong:num-last wrong:sign wrong:added', 'x × (−3) 의 판정');
  eq(EX(o1, 'x-3'), '수를 문자 뒤에 써서 뺄셈이 되어 버렸어요. 문자 뒤에 −와 수를 쓰면 "그만큼 뺀다"는 뜻이에요. 음수는 부호와 함께 문자 앞에 써요.', '음수를 뒤에 쓴 실수의 설명');
  eq(MH.optionsOf(o2).join(' , ') + ' / ' + [J(o2, 'aab'), J(o2, '2ab'), J(o2, 'ab^{2}')].join(' '), 'a^{2}b , aab , 2ab , ab^{2} / wrong:no-power wrong:doubled wrong:pow-letter', 'a × b × a');
  eq(MH.optionsOf(o3).join(' , ') + ' / ' + [J(o3, '-x+y'), J(o3, '-1(x+y)'), J(o3, '-xy')].join(' '), '-(x+y) , -x+y , -1(x+y) , -xy / wrong:no-paren wrong:one wrong:into-product', '(x + y) × (−1)');
  eq(MH.optionsOf(o4).join(' , ') + ' / ' + J(o4, '0.a'), '0.1a , 0.a , a+0.1 , a0.1 / wrong:zero-point', 'a × 0.1');
  eq(MH.optionsOf(o5).join(' , '), '-3x^{2}y , -3xxy , -6xy , x^{2}y-3', 'y × x × (−3) × x');
  eq(says(o5), '수를 맨 앞으로, 문자를 알파벳 순서로 옮겨요. 곱셈은 순서를 바꿔도 값이 같아요. [(-3) \\times x \\times x \\times y] | × 기호를 지우고 붙여 써요. 같은 문자의 곱은 거듭제곱으로 써요. [y \\times x \\times (-3) \\times x = -3x^{2}y]', '곱셈 기호 생략의 풀이');
  eq(H(o1)[1], '이 식에 나오는 문자를 먼저 찾아요: $x$. 곱하는 수 $-3$은 음수예요. 괄호를 벗기고, 부호 −와 함께 맨 앞에 써요.', '곱셈 기호 생략의 둘째 힌트');

  var d1 = prob('B05.div', { q: { k: 'two', A: 'x', B: -3, o: O } }), d2 = prob('B05.div', { q: { k: 'chain', it: ['a', 'b', 'c'], ops: ['÷', '×'], o: O } });
  var d3 = prob('B05.div', { q: { k: 'chain', it: ['a', 'b', 'c'], ops: ['÷', '÷'], o: O } }), d4 = prob('B05.div', { q: { k: 'terms', t: [{ L: 'a', n: 2, op: '×' }, { L: 'b', n: 3, op: '÷' }], sg: '-', o: O } });
  var d5 = prob('B05.div', { q: { k: 'group', g: ['a', '+', 'b'], d: 3, dir: 0, o: O } }), d6 = prob('B05.div', { q: { k: 'paren', it: ['a', 'b', 'c'], o: O } });
  eq(MH.types['B05.div'].prompt(d1.v).tex + ' → ' + MH.optionsOf(d1).join(' , '), 'x \\div (-3) → -\\frac{x}{3} , -\\frac{3}{x} , -3x , x-3', 'x ÷ (−3) 의 보기');
  eq([J(d1, '-\\frac{x}{3}'), J(d1, '-\\frac{3}{x}'), J(d1, '-3x'), J(d1, 'x-3')].join(' '), 'correct:- wrong:flipped wrong:product wrong:subtracted', 'x ÷ (−3) 의 판정');
  eq(MH.optionsOf(d2).join(' , ') + ' / ' + J(d2, '\\frac{a}{bc}'), '\\frac{ac}{b} , \\frac{a}{bc} , \\frac{ab}{c} , \\frac{b}{ac} / wrong:right-first', 'a ÷ b × c');
  eq(MH.optionsOf(d3).join(' , ') + ' / ' + J(d3, '\\frac{ac}{b}'), '\\frac{a}{bc} , \\frac{ac}{b} , \\frac{ab}{c} , \\frac{bc}{a} / wrong:right-first', 'a ÷ b ÷ c');
  eq(MH.types['B05.div'].prompt(d4.v).tex + ' → ' + MH.optionsOf(d4).join(' , '), 'a \\times 2 - b \\div 3 → 2a-\\frac{b}{3} , \\frac{2a-b}{3} , 2a-3b , 2a-\\frac{3}{b}', 'a × 2 − b ÷ 3');
  eq(J(d4, '\\frac{2a-b}{3}') + ' ' + J(d5, 'a+\\frac{b}{3}') + ' ' + J(d6, '\\frac{ac}{b}'), 'wrong:one-fraction wrong:no-paren wrong:no-paren', '한 분수로 만든 실수 · 괄호를 무시한 실수');
  eq(says(d2), '왼쪽부터 차례로 해요. 먼저 앞의 두 개를 고쳐요. [a \\div b = \\dfrac{a}{b}] | 이어서 곱하는 것은 분자에 써요. [\\dfrac{a}{b} \\times c = \\dfrac{ac}{b}]', '섞인 식의 풀이');
  eq(H(d2)[1], '곱셈과 나눗셈이 섞여 있으면 왼쪽부터 차례로 해요. ① 먼저 앞의 두 개($a \\div b$)를 한 덩어리로 고쳐요. ② 그 덩어리에 이어서 뒤에 남은 계산($\\times c$)을 해요.', '섞인 식의 둘째 힌트');

  var w1 = prob('B05.word', { q: { k: 'price', i: 0, n: 3, L: 'x', o: O } }), w2 = prob('B05.word', { q: { k: 'change', i: 3, n: 4, M: 5000, L: 'a', o: O } });
  var w3 = prob('B05.word', { q: { k: 'percent', p: 30, i: 0, L: 'a', o: O } }), w4 = prob('B05.word', { q: { k: 'digits', L: ['a', 'b'], o: O } }), w5 = prob('B05.word', { q: { k: 'percent', p: 25, i: 1, L: 'x', o: O } });
  eq(MH.types['B05.word'].prompt(w1.v).text + ' → ' + MH.optionsOf(w1).join(' , '), '한 개에 $x$원인 빵 3개의 값(원)을 식으로 나타낸 것을 고르세요. → 3x , x+3 , \\frac{x}{3} , x^{3}', '빵 3개의 값');
  eq([J(w1, '3x'), J(w1, 'x+3'), J(w1, 'x^{3}')].join(' '), 'correct:- wrong:added wrong:power', '빵 3개의 값의 판정');
  eq(EX(w1, 'x^{3}'), '$x^{3}$은 x를 세 번 곱한 것이에요. 여기서는 x를 세 번 더한 것이라서 수를 문자 앞에 붙여 써요.', '거듭제곱으로 쓴 실수의 설명');
  eq(H(w1)[1], '한 개에 500원이라면 3개의 값은 500 × 3으로 계산하죠. 값이 500원이 아니라 $x$원이니, 500이 있던 자리에 $x$를 쓰면 돼요.', '아는 수를 넣어 보는 힌트');
  eq(MH.types['B05.word'].prompt(w2.v).text + ' → ' + MH.optionsOf(w2).join(' , '), '한 권에 $a$원인 공책 4권을 사고 5000원을 냈을 때, 거스름돈(원)을 식으로 나타낸 것을 고르세요. → 5000-4a , 4a-5000 , 5000-a , 5000+4a', '거스름돈');
  eq(EX(w2, '5000-a'), '한 권의 값만 뺐어요. 4권을 샀으니 한 권의 값에 4를 곱한 값을 빼야 해요.', '개수를 곱하지 않은 실수의 설명');
  eq(MH.optionsOf(w3).join(' , ') + ' / ' + MH.optionsOf(w5).join(' , ') + ' / ' + J(w3, '30a') + ' ' + J(w5, '2.5x'), '0.3a , 30a , 0.03a , a+0.3 / 0.25x , 25x , 2.5x , x+0.25 / wrong:percent wrong:point', '퍼센트');
  eq(MH.optionsOf(w4).join(' , ') + ' / ' + J(w4, 'ab'), '10a+b , ab , a+b , a+10b / wrong:mixup', '두 자리 수');
  eq(says(w4), '말로 식을 세워요: 10 × (십의 자리 숫자) + (일의 자리 숫자). | 식에 문자와 수를 넣어요. [10 \\times a + b] | ×는 생략하고(수는 문자 앞에), ÷는 분수 꼴로 써요. +와 −는 그대로 둬요. [10a+b]', '두 자리 수의 풀이');

  var Tm = function (c, px, py, d) { return { c: c, d: d || 1, px: px || 0, py: py || 0 }; };
  var v1 = prob('B05.value', { q: { L: ['x'], val: [3], t: [Tm(2, 1), Tm(5)] } }), v2 = prob('B05.value', { q: { L: ['x'], val: [-3], t: [Tm(5), Tm(-2, 1)] } });
  var v3 = prob('B05.value', { q: { L: ['a'], val: [[-2, 3]], t: [Tm(6, 1), Tm(1)] } }), v4 = prob('B05.value', { q: { L: ['x'], val: [-3], t: [Tm(12, -1), Tm(-1)] } });
  eq(MH.types['B05.value'].prompt(v1.v).text + ' ' + MH.types['B05.value'].prompt(v1.v).tex, '$x = 3$일 때, 다음 식의 값을 구하세요. 2x + 5', '식의 값 문제의 모양');
  eq([J(v1, '11'), J(v1, '28'), J(v1, '10'), J(v1, '-11'), J(v1, '9')].join(' '), 'correct:- wrong:glued wrong:added wrong:sign wrong:-', 'x = 3 일 때 2x + 5');
  eq(EX(v1, '28'), '$2x$의 x 자리에 3을 넣으면서 숫자를 나란히 붙여 23으로 읽었어요. $2x$ 속에는 수와 문자 사이에 ×가 생략되어 있어요. 이렇게 계산해요: $2 \\times 3$', '숫자를 붙여 읽은 실수의 설명');
  eq(MH.types['B05.value'].prompt(v2.v).tex + ' → ' + SG.tex(v2.answer) + ' ' + [J(v2, '11'), J(v2, '-1'), J(v2, '6')].join(' '), '5 - 2x → 11 correct:- wrong:sign-lost wrong:added', 'x = −3 일 때 5 − 2x');
  eq(says(v2), '문자 자리에 수를 넣어요. 생략된 ×를 다시 쓰고, 음수와 분수는 괄호에 넣어요. [5 - 2x = 5 - 2 \\times (-3)] | 곱셈부터 계산해요. 음수에 음수를 곱하면 양수예요. [-2 \\times (-3) = 6] | 구한 값으로 덧셈 · 뺄셈을 해요. 답은 11이에요. [5 + 6 = 11]', '음수를 넣는 풀이');
  eq(H(v2)[1], '수를 넣을 때 두 가지를 지켜요. ① 수와 문자 사이에 생략된 ×를 다시 써요. 그냥 나란히 붙이면 다른 수가 되어 버려요. ② 음수나 분수는 괄호에 넣어서 써요. 그러면 식이 이렇게 바뀌어요: $5 - 2 \\times (-3)$', '식의 값의 둘째 힌트');
  eq(MH.types['B05.value'].prompt(v3.v).text + ' ' + SG.tex(v3.answer) + ' / ' + says(v3).split(' | ')[0], '$a = -\\dfrac{2}{3}$일 때, 다음 식의 값을 구하세요. -3 / 문자 자리에 수를 넣어요. 생략된 ×를 다시 쓰고, 음수와 분수는 괄호에 넣어요. [6a + 1 = 6 \\times \\left(-\\dfrac{2}{3}\\right) + 1]', '분수를 넣기');
  eq(MH.types['B05.value'].prompt(v4.v).tex + ' → ' + SG.tex(v4.answer) + ' / ' + says(v4).split(' | ').slice(1).join(' | '), '\\dfrac{12}{x} - 1 → -5 / 분수 꼴(나눗셈)부터 계산해요. [\\dfrac{12}{-3} = -4] | 구한 값으로 덧셈 · 뺄셈을 해요. 답은 −5예요. [-4 - 1 = -5]', '분수 꼴의 식');

  var s1 = prob('B05.value2', { q: { L: ['x'], val: [-3], t: [Tm(-1, 2), Tm(4)] } }), s2 = prob('B05.value2', { q: { L: ['x', 'y'], val: [2, -1], t: [Tm(3, 1), Tm(-2, 0, 1)] } });
  var s3 = prob('B05.value2', { q: { L: ['a', 'b'], val: [-2, 3], t: [Tm(1, 2), Tm(-1, 1, 1)] } });
  eq(MH.types['B05.value2'].prompt(s1.v).tex + ' → ' + SG.tex(s1.answer) + ' ' + [J(s1, '-5'), J(s1, '13'), J(s1, '10')].join(' '), '-x^{2} + 4 → -5 correct:- wrong:pow-paren wrong:times', 'x = −3 일 때 −x² + 4');
  eq(EX(s1, '13'), '제곱의 부호를 잘못 정했어요. $x^{2}$에 음수를 넣으면 이렇게 돼요: $(-3)^{2}$. 부호 −까지 두 번 곱하니 양수예요. 식 앞에 따로 붙은 −는 제곱을 한 다음에 붙여요.', '제곱의 부호 실수의 설명');
  eq(EX(s1, '10'), '제곱을 두 배로 계산했어요. 지수는 곱하는 횟수예요. 이렇게 계산해요: $(-3)^{2} = (-3) \\times (-3)$', '제곱을 두 배로 한 실수의 설명');
  eq(MH.types['B05.value2'].prompt(s2.v).text + ' ' + MH.types['B05.value2'].prompt(s2.v).tex + ' → ' + SG.tex(s2.answer) + ' ' + J(s2, '4'), '$x = 2$, $y = -1$일 때, 다음 식의 값을 구하세요. 3x - 2y → 8 wrong:double-neg', 'x = 2, y = −1 일 때 3x − 2y');
  eq(says(s3), '문자 자리에 수를 넣어요. 생략된 ×를 다시 쓰고, 음수와 분수는 괄호에 넣어요. [a^{2} - ab = (-2)^{2} - (-2) \\times 3] | 거듭제곱과 곱셈부터 계산해요. 음수의 제곱은 양수예요. [(-2)^{2} = 4,\\quad -(-2) \\times 3 = 6] | 구한 값으로 덧셈 · 뺄셈을 해요. 답은 10이에요. [4 + 6 = 10]', '두 문자와 제곱의 풀이');
  done('실수 · 풀이 · 힌트 예');
})();
