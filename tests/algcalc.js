/* 문자가 든 식을 다루는 단원(B05 부터)의 검사가 함께 쓰는 도구. 엔진(engine/algebra.js)과 따로 만든 계산기라서 서로를 검산한다.
   ALG.calc(tex, env) 식 읽기 · ALG.sig(tex) 문자에 수 세 벌을 넣은 값(같은 식이면 같은 글) · ALG.noJosa(글들, 어디) 문자 뒤 조사 검사 */
(function () {
  'use strict';
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

  globalThis.ALG = { Q: Q, calc: calc, str: str, sig: sig, noJosa: noJosa, ENVS: ENVS };
})();
