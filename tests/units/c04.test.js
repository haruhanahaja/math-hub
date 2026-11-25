/* C04 복소수 — 단원 전용 검사.
   화면에 보이는 식을 여기서 따로 만든 복소수 계산기(BigInt 분수 두 개)로 읽어 답을 확인한다. 단원 파일의 계산과 무관하다.
   · 계산 문제: 문제의 식을 읽은 값 = 답 보기를 읽은 값. 틀린 보기는 값이 다르다.
   · 풀이의 줄: 등식은 양쪽 값이 같다.
   · 같을 조건: 등식을 여기서 직접 풀어(실수부분 · 허수부분의 연립일차방정식) 답과 견준다. */
(function () {
  'use strict';
  var N = 1000, Q = ALG.Q, noJosa = ALG.noJosa, isInt = Number.isInteger;
  /* ── 복소수 계산기: { r, i } (둘 다 분수) ── */
  var qi = function (n) { return Q(BigInt(n), 1n); };
  var qadd = function (a, b) { return Q(a.n * b.d + b.n * a.d, a.d * b.d); }, qsub = function (a, b) { return Q(a.n * b.d - b.n * a.d, a.d * b.d); };
  var qmul = function (a, b) { return Q(a.n * b.n, a.d * b.d); }, qdiv = function (a, b) { return Q(a.n * b.d, a.d * b.n); };
  var C = function (r, i) { return { r: r, i: i }; }, cre = function (n) { return C(qi(n), qi(0)); };
  var cadd = function (a, b) { return C(qadd(a.r, b.r), qadd(a.i, b.i)); }, csub = function (a, b) { return C(qsub(a.r, b.r), qsub(a.i, b.i)); };
  var cmul = function (a, b) { return C(qsub(qmul(a.r, b.r), qmul(a.i, b.i)), qadd(qmul(a.r, b.i), qmul(a.i, b.r))); };
  var cconj = function (a) { return C(a.r, Q(-a.i.n, a.i.d)); };
  var cdiv = function (a, b) { var n = qadd(qmul(b.r, b.r), qmul(b.i, b.i)), t = cmul(a, cconj(b)); return C(qdiv(t.r, n), qdiv(t.i, n)); };
  var key = function (z) { return z.r.n + '/' + z.r.d + ',' + z.i.n + '/' + z.i.d; };
  var isqrt = function (n) { var s = 0n; while (s * s < n) s++; if (s * s !== n) throw new Error('제곱수가 아님'); return s; };
  /** 식 읽기. env: { z: 복소수, x: …, y: … } */
  var cev = function (tex, env) {
    var s = tex.replace(/\\left|\\right|\\,|\\quad/g, '').replace(/\\times/g, '*').replace(/\\dfrac/g, 'F').replace(/\\sqrt/g, 'R').replace(/\\overline/g, 'O').replace(/\s/g, ''), i = 0;
    if (/\\/.test(s)) throw new Error('모르는 명령 ' + tex);
    var brace = function () { if (s[i] !== '{') throw new Error('{ ' + tex); i++; var x = expr(); if (s[i] !== '}') throw new Error('} ' + tex); i++; return x; };
    var atom = function () {
      var c = s[i] || '', m, x, y;
      if (c === '(') { i++; x = expr(); if (s[i] !== ')') throw new Error('괄호 ' + tex); i++; return x; }
      if ((m = /^\d+/.exec(s.slice(i)))) { i += m[0].length; return cre(Number(m[0])); }
      if (c === 'i') { i++; return C(qi(0), qi(1)); }
      if (c === 'F') { i++; x = brace(); y = brace(); return cdiv(x, y); }
      if (c === 'O') { i++; return cconj(brace()); }
      if (c === 'R') {
        i++; x = brace();
        if (x.i.n !== 0n || x.r.d !== 1n) throw new Error('근호 안 ' + tex);
        return x.r.n < 0n ? C(qi(0), Q(isqrt(-x.r.n), 1n)) : C(Q(isqrt(x.r.n), 1n), qi(0));
      }
      if (/[a-z]/.test(c) && env && env[c]) { i++; return env[c]; }
      throw new Error('읽을 수 없음 ' + tex + ' @' + i);
    };
    var power = function () {
      var x = atom(), m, k, y;
      if (s[i] !== '^') return x;
      m = /^\^\{(\d+)\}/.exec(s.slice(i)); if (!m) throw new Error('지수 ' + tex); i += m[0].length;
      y = cre(1); for (k = 0; k < Number(m[1]); k++) y = cmul(y, x);
      return y;
    };
    var glued = function () { var x = power(); while (i < s.length && /[0-9a-z(FRO]/.test(s[i])) x = cmul(x, power()); return x; };
    var unary = function () { if (s[i] === '-') { i++; return csub(cre(0), unary()); } return glued(); };
    var term = function () { var x = unary(); while (s[i] === '*') { i++; x = cmul(x, unary()); } return x; };
    var expr = function () { var x = term(), op; while (s[i] === '+' || s[i] === '-') { op = s[i++]; x = op === '+' ? cadd(x, term()) : csub(x, term()); } return x; };
    var out = expr();
    if (i !== s.length) throw new Error('읽다 만 식 ' + tex + ' @' + i);
    return out;
  };
  var val = function (tex, env) { try { return key(cev(tex, env)); } catch (e) { return null; } };
  /** 등식(여러 개는 ,\quad 로 이음)의 양쪽 값이 모두 같은가 */
  var chain = function (tex, env) {
    return tex.split(',\\quad ').every(function (e) { var v = e.split(' = ').map(function (x) { return val(x, env); }); return v.length >= 2 && v.every(function (x) { return !!x && x === v[0]; }); });
  };
  var CANON = /^(-?\d+|-?\d*i|-?\d+ [+-] \d*i)$/;
  var canon = function (t) { return CANON.test(t) && !/(^|[^\d])[01]i/.test(t) && !/^-?0 /.test(t) && t !== '-0'; };

  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx), all = h.concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.mistakesFor(p).map(function (m) { return m.explain; }));
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    MH.mistakesFor(p).forEach(function (m) { ok(m.explain.length >= 25, where + '실수 설명이 짧음: ' + m.id); });
    if (p.seed <= 200) noJosa(all, where);
    if (p.seed <= 300) all.forEach(function (t) { ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object/.test(t), where + '글: ' + t); });
    ok(!/undefined|NaN|null|object/.test(JSON.stringify(MH.types[id].steps(p.v))), where + '풀이에 undefined');
  };
  /** 보기 고르기 유형의 공통 검사. want: 답이어야 하는 값(여기서 따로 구한 것), env: 풀이의 줄을 읽을 때 쓰는 문자의 값,
      also: 식 하나뿐인 풀이 줄이 답 말고 가질 수 있는 값(켤레복소수 문제의 처음 복소수) */
  var choiceBase = function (id, p, want, where, env, also) {
    var opts = MH.optionsOf(p), a = val(p.answer), steps = MH.types[id].steps(p.v), last;
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && canon(o) && !!val(o); }) && opts.indexOf(p.answer) >= 0 && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    ok(!!a && !!want && a === want, where + '답: ' + p.answer + ' ≠ ' + want);
    ok(opts.map(function (o) { return val(o); }).every(function (v, i, list) { return list.indexOf(v) === i; }), where + '값이 같은 보기가 있음: ' + opts.join(' | '));
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    last = steps[steps.length - 1].tex.split(' = ').pop();
    eq(last, p.answer, where + '풀이의 마지막 줄');
    steps.forEach(function (s) {
      if (/\\cdots/.test(s.tex)) return;
      ok(s.tex.indexOf(' = ') >= 0 ? chain(s.tex, env) : val(s.tex, env) === a || (!!also && val(s.tex, env) === also), where + '풀이의 줄: ' + s.tex);
    });
    return opts;
  };
  var numChecks = function (id, p, want, where, env) {
    var def = MH.types[id], kind = MH.kinds[def.answer.kind], ans = p.answer.n, steps = def.steps(p.v);
    ok(p.answer.p === 0 && isInt(ans), where + '답은 정수');
    eq(ans, want, where + '답');
    MH.mistakesFor(p).forEach(function (x) { ok(isInt(x.value.n) && x.value.n !== ans && (ans === 0 || x.value.n !== -ans), where + '실수 값: ' + x.id + ' ' + x.value.n); });
    ok(MH.mistakesFor(p).length >= 1, where + '실수가 하나는 있어야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    detailed(id, p, where);
    ok(Number(steps[steps.length - 1].tex.split(' = ').pop()) === ans, where + '풀이의 마지막 줄: ' + steps[steps.length - 1].tex);
    steps.forEach(function (s) { if (s.tex.indexOf(' = ') >= 0) ok(chain(s.tex, env), where + '풀이의 줄: ' + s.tex); });
  };
  var num = function (q) { return q.d === 1n ? Number(q.n) : NaN; };

  group('C04 — 검사 도구 자체 검사');
  eq(val('(2 + 3i)(1 - 2i)'), val('8 - i'), '곱셈');
  eq(val('\\dfrac{5 + 5i}{1 + 2i}'), val('3 - i'), '나눗셈');
  eq(val('i^{27}'), val('-i'), '거듭제곱');
  eq(val('\\sqrt{-4} \\times \\sqrt{-9} + \\sqrt{-1}'), val('-6 + i'), '음수의 제곱근');
  eq(val('\\overline{(2 + i) - (1 - 4i)}'), val('1 - 5i'), '켤레복소수');
  eq(val('z\\overline{z} - (z + \\overline{z})', { z: cev('3 - 2i') }), val('7'), '문자 z');
  ok(val('3 + 2i') !== val('3 - 2i') && val('2i') !== val('2') && val('\\sqrt{-8}') === null && val('3 +') === null, '다른 값 · 읽을 수 없는 식을 가려냄');
  ok(chain('27 = 4 \\times 6 + 3,\\quad i^{27} = (i^{4})^{6} \\times i^{3} = i^{3}') && !chain('i^{2} = 1') && canon('-3 - i') && canon('-i') && canon('7') && !canon('3 + 1i') && !canon('0 + 2i') && !canon('2i + 3'), '등식 · 답의 꼴');
  done('도구');

  var kinds;
  group('C04 — 실수부분과 허수부분 (단계마다 1,000문제)');
  kinds = {};
  each('C04.parts', function (p, pr, level, where) {
    var m = /^복소수 \$(.+)\$의 (실수부분|허수부분)을 구하세요\.$/.exec(pr.text), z;
    ok(!!m && !pr.tex, where + '문제 글: ' + pr.text); if (!m) return;
    z = cev(m[1]);
    numChecks('C04.parts', p, num(m[2] === '실수부분' ? z.r : z.i), where);
    ok(level === 0 ? /^-?\d+ [+-] \d+i$/.test(m[1]) : level === 1 ? /^-?\d+ [+-] i$|^-?\d*i [+-] \d+$/.test(m[1]) : /^-?\d+$|^-?\d*i$|^-?\d*i [+-] \d+$/.test(m[1]), where + '단계에 맞는 꼴: ' + m[1]);
    kinds[level + (/^-?\d+$/.test(m[1]) ? 'R' : /^-?\d*i$/.test(m[1]) ? 'P' : /^-?\d*i /.test(m[1]) ? 'S' : / i$/.test(m[1]) ? 'U' : 'N') + (m[2] === '실수부분' ? 're' : 'im') + (p.answer.n === 0 ? '0' : '')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0Nim 0Nre 1Sim 1Sre 1Uim 1Ure 2Pim 2Pre0 2Rim0 2Rre 2Sim 2Sre', '문제의 종류');
  done('실수부분과 허수부분');

  group('C04 — 복소수가 서로 같을 조건 (단계마다 1,000문제)');
  kinds = {};
  each('C04.equal', function (p, pr, level, where) {
    var m = /^다음 등식을 만족시키는 실수 \$([xy])\$의 값을 구하세요\. \(\$x\$, \$y\$는 실수\)$/.exec(pr.text), sides = pr.tex.split(' = '), f, f0, fx, fy, det, sol, env;
    ok(!!m && sides.length === 2, where + '문제 글: ' + pr.text + ' / ' + pr.tex); if (!m) return;
    /* 왼쪽 − 오른쪽은 x, y 의 일차식이다. 세 점에서의 값으로 계수를 구해 연립방정식을 푼다 */
    f = function (x, y) { return csub(cev(sides[0], { x: cre(x), y: cre(y) }), cev(sides[1])); };
    f0 = f(0, 0); fx = csub(f(1, 0), f0); fy = csub(f(0, 1), f0);
    det = qsub(qmul(fx.r, fy.i), qmul(fy.r, fx.i));
    ok(det.n !== 0n, where + '해가 하나가 아님: ' + pr.tex); if (det.n === 0n) return;
    sol = { x: num(qdiv(qsub(qmul(fy.r, f0.i), qmul(f0.r, fy.i)), det)), y: num(qdiv(qsub(qmul(f0.r, fx.i), qmul(fx.r, f0.i)), det)) };
    ok(isInt(sol.x) && isInt(sol.y) && sol.x !== 0 && sol.y !== 0, where + '해는 0 이 아닌 정수: ' + JSON.stringify(sol));
    env = { x: cre(sol.x), y: cre(sol.y) };
    ok(chain(pr.tex, env), where + '해를 넣으면 등식이 성립: ' + pr.tex);
    numChecks('C04.equal', p, sol[m[1]], where, env);
    ok(level === 0 ? /^\(x [+-] \d\) \+ \(y [+-] \d\)i = /.test(pr.tex) : level === 1 ? /^\([234]x [+-] \d\) \+ \([234]y [+-] \d\)i = /.test(pr.tex) : /^\(x \+ [23]?y\) \+ \(x - y\)i = /.test(pr.tex), where + '단계에 맞는 꼴: ' + pr.tex);
    ok(/ = -?\d+ [+-] \d+i$/.test(pr.tex), where + '오른쪽은 a + bi 꼴: ' + pr.tex);
    kinds[level + m[1]] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0x 0y 1x 1y 2x 2y', '문제의 종류');
  done('복소수가 서로 같을 조건');

  group('C04 — 덧셈과 뺄셈 (단계마다 1,000문제)');
  kinds = {};
  each('C04.addsub', function (p, pr, level, where) {
    eq(pr.text, '다음을 계산하세요.', where + '문제 글');
    choiceBase('C04.addsub', p, val(pr.tex), where);
    var n = (pr.tex.match(/\(/g) || []).length;
    ok(level === 0 ? n === 2 && /^\([^()]+\) [+-] \([^()]+\)$/.test(pr.tex) : level === 1 ? n === 3 && / - /.test(pr.tex.replace(/\([^()]+\)/g, 'Z')) : /^[234]\([^()]+\) [+-] [234]\([^()]+\)$/.test(pr.tex), where + '단계에 맞는 꼴: ' + pr.tex);
    ok(/^-?\d+ [+-] \d*i$/.test(p.answer), where + '답은 두 부분이 모두 있는 꼴: ' + p.answer);
    kinds[level + (/\) - /.test(pr.tex) ? '-' : '+')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0+ 0- 1- 2+ 2-', '문제의 종류');
  done('덧셈과 뺄셈');

  group('C04 — 곱셈 (단계마다 1,000문제)');
  each('C04.mul', function (p, pr, level, where) {
    eq(pr.text, '다음을 계산하세요.', where + '문제 글');
    choiceBase('C04.mul', p, val(pr.tex), where);
    ok(level === 0 ? /^-?\d?i\([^()]+\)$/.test(pr.tex) : level === 1 ? /^\([^()]+\)\([^()]+\)$/.test(pr.tex) : /^\([^()]+\)\^\{2\}$/.test(pr.tex), where + '단계에 맞는 꼴: ' + pr.tex);
    ok(/i$/.test(p.answer), where + '답에 허수부분이 있음: ' + p.answer);
  });
  done('곱셈');

  group('C04 — 켤레복소수 (단계마다 1,000문제)');
  kinds = {};
  each('C04.conj', function (p, pr, level, where) {
    var m = /^\$z = (.+)\$일 때, 다음을 계산하세요\.$/.exec(pr.text), env = m ? { z: cev(m[1]) } : null, kind;
    if (m) { kind = 'diff'; eq(pr.tex, 'z - \\overline{z}', where + '문제의 식'); choiceBase('C04.conj', p, val(pr.tex, env), where, env); }
    else if (pr.text === '다음을 계산하세요.') { kind = 'sum'; ok(/^\\overline\{\([^()]+\) [+-] \([^()]+\)\}$/.test(pr.tex), where + '문제의 식: ' + pr.tex); choiceBase('C04.conj', p, val(pr.tex), where); }
    else {
      eq(pr.text, '다음 복소수의 켤레복소수를 구하세요.', where + '문제 글');
      choiceBase('C04.conj', p, key(cconj(cev(pr.tex))), where, null, val(pr.tex));
      kind = /^-?\d+$/.test(pr.tex) ? 'real' : /^-?\d*i$/.test(pr.tex) ? 'pure' : /^-?\d*i /.test(pr.tex) ? 'swap' : 'std';
      if (kind === 'real') eq(p.answer, pr.tex, where + '실수의 켤레복소수는 자기 자신');
    }
    ok(level === 0 ? kind === 'std' : level === 1 ? /real|pure|swap/.test(kind) : /sum|diff/.test(kind), where + '단계에 맞는 문제: ' + pr.tex);
    kinds[level + kind] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0std 1pure 1real 1swap 2diff 2sum', '문제의 종류');
  done('켤레복소수');

  group('C04 — 켤레복소수의 합과 곱 (단계마다 1,000문제)');
  kinds = {};
  each('C04.norm', function (p, pr, level, where) {
    var m = /^\$z = (-?\d+ [+-] \d*i)\$일 때, 다음 식의 값을 구하세요\.$/.exec(pr.text), env = m ? { z: cev(m[1]) } : {}, v;
    ok(!!m || pr.text === '다음을 계산하세요.', where + '문제 글: ' + pr.text);
    v = cev(pr.tex, env);
    ok(v.i.n === 0n, where + '값은 실수: ' + pr.tex);
    numChecks('C04.norm', p, num(v.r), where, env);
    ok(level === 0 ? pr.tex === 'z + \\overline{z}' : level === 1 ? pr.tex === 'z\\overline{z}' || (!m && /^\((-?\d+) ([+-]) (\d*i)\)\(\1 [+-] \3\)$/.test(pr.tex) && !/([+-]) \d*i\)\(-?\d+ \1/.test(pr.tex)) : pr.tex === 'z\\overline{z} + z + \\overline{z}' || pr.tex === 'z\\overline{z} - (z + \\overline{z})', where + '단계에 맞는 식: ' + pr.tex);
    kinds[level + (m ? 'z' : 'd') + (level === 2 ? (/ - /.test(pr.tex) ? '-' : '+') : '')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0z 1d 1z 2z+ 2z-', '문제의 종류');
  done('켤레복소수의 합과 곱');

  group('C04 — 나눗셈 (단계마다 1,000문제)');
  each('C04.div', function (p, pr, level, where) {
    var m = /^\\dfrac\{(.+)\}\{(.+)\}$/.exec(pr.tex), N, D;
    eq(pr.text, '다음을 계산하세요.', where + '문제 글');
    ok(!!m, where + '분수 꼴: ' + pr.tex); if (!m) return;
    choiceBase('C04.div', p, val(pr.tex), where);
    N = cev(m[1]); D = cev(m[2]);
    /* 답에 분모를 곱하면 분자가 된다 */
    eq(key(cmul(cev(p.answer), D)), key(N), where + '답 × 분모 = 분자: ' + pr.tex + ' → ' + p.answer);
    ok(level === 0 ? /^-?\d?i$/.test(m[2]) && canon(m[1]) : level === 1 ? /^-?\d+$/.test(m[1]) && /^-?\d+ [+-] \d*i$/.test(m[2]) : /^-?\d+ [+-] \d*i$/.test(m[1]) && /^-?\d+ [+-] \d*i$/.test(m[2]), where + '단계에 맞는 꼴: ' + pr.tex);
    ok(/^-?\d+ [+-] \d*i$/.test(p.answer), where + '답은 두 부분이 모두 있는 꼴: ' + p.answer);
  });
  done('나눗셈');

  group('C04 — i 의 거듭제곱 (단계마다 1,000문제)');
  kinds = {};
  each('C04.ipow', function (p, pr, level, where) {
    var run = /^i \+ i\^\{2\} \+ i\^\{3\} \+ \\cdots \+ i\^\{(\d+)\}$/.exec(pr.tex), want, z, t, k, opts, h;
    eq(pr.text, '다음을 간단히 하세요.', where + '문제 글');
    if (run) { z = cre(0); t = cre(1); for (k = 1; k <= Number(run[1]); k++) { t = cmul(t, cev('i')); z = cadd(z, t); } want = key(z); }
    else want = val(pr.tex);
    opts = choiceBase('C04.ipow', p, want, where);
    if (level < 2) { eq(opts.slice().sort().join(' '), '-1 -i 1 i', where + '보기는 늘 네 가지 값'); ok(/^i\^\{\d+\}$/.test(pr.tex), where + '문제의 꼴: ' + pr.tex); }
    else ok(!!run || /^i\^\{\d+\} \+ i\^\{\d+\}$/.test(pr.tex), where + '문제의 꼴: ' + pr.tex);
    /* 답이 1 · 0 일 수 있으니 힌트에 수 1, 0 을 쓰지 않는다 */
    h = MH.types['C04.ipow'].hints(p.v, p.ctx).join(' ').match(/\d+/g) || [];
    ok(h.indexOf('1') < 0 && h.indexOf('0') < 0, where + '힌트에 1 · 0 이 나옴');
    kinds[level + (run ? 'run' : '') + p.answer] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0-1 0-i 01 0i 1-1 1-i 11 1i 2-1 + i 2-1 - i 2-2i 21 + i 21 - i 22i 2run-1 2run-1 + i 2run0 2runi', '문제의 종류');
  done('i 의 거듭제곱');

  group('C04 — 음수의 제곱근 (단계마다 1,000문제)');
  kinds = {};
  each('C04.sqrtneg', function (p, pr, level, where) {
    eq(pr.text, level === 0 ? '다음 수를 허수단위 $i$를 써서 나타내세요.' : '다음을 계산하세요.', where + '문제 글');
    choiceBase('C04.sqrtneg', p, val(pr.tex), where);
    ok(level === 0 ? /^-?\\sqrt\{-\d+\}$/.test(pr.tex) : level === 1 ? /^\\sqrt\{-?\d+\} [+-] \\sqrt\{-\d+\}$/.test(pr.tex) : /^\\sqrt\{-\d+\} \\times \\sqrt\{-\d+\} [+-] \\sqrt\{-\d+\}$/.test(pr.tex), where + '단계에 맞는 꼴: ' + pr.tex);
    if (level === 2) ok(/^-\d+ [+-] \d*i$/.test(p.answer), where + '곱은 음수인 실수: ' + p.answer);
    kinds[level + (level === 1 ? (/^\\sqrt\{\d/.test(pr.tex) ? 'mixed' : 'sum') : '') + (/^-/.test(pr.tex) || / - /.test(pr.tex) ? '-' : '+')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0+ 0- 1mixed+ 1mixed- 1sum+ 1sum- 2+ 2-', '문제의 종류');
  done('음수의 제곱근');

  group('C04 — 개념 카드');
  ok(MH.concepts.C04 && MH.concepts.C04.length === 6, '개념 카드는 6장');
  done('개념 카드');
})();
