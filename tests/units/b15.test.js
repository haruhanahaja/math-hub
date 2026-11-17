/* B15 일차함수와 그래프 — 단원 전용 검사.
   화면에 보이는 식을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어 x = 0, 1, 2 에서의 값으로 기울기 · y절편을 따로 구하고,
   문제 글에서 읽은 조건(지나는 점, 절편, 평행 …)에 답이 맞는지 본다. 활용 문제는 한 번씩 더하고 빼며 직접 따라가 본다.
   단원 파일의 계산(rat, rhs, line …)과 무관하다. */
(function () {
  'use strict';
  var N = 1000, noJosa = ALG.noJosa, calc = ALG.calc;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var rawOf = function (p, value) { var def = MH.types[p.type || p.id] || null; return null; };
  var wrongOf = function (p, id) { var m = MH.mistakesFor(p).filter(function (x) { return x.id === id; })[0]; return m ? m.value : null; };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx), all = h.concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.mistakesFor(p).map(function (m) { return m.explain; }));
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    MH.mistakesFor(p).forEach(function (m) { ok(m.explain.length >= 25, where + '실수 설명이 짧음: ' + m.id); });
    if (p.seed <= 200) noJosa(all, where);
    if (p.seed <= 300) all.forEach(function (t) {
      var re = /(\d)\)?\$?(이에요|예요|은 |는 |이 |가 |을 |를 |과 |와 |으로 |로 )/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        if (/\}\$?$/.test(t.slice(0, m.index + 1))) continue;
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
      ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null/.test(t), where + '글: ' + t);
    });
  };
  /* ── 분수 계산(BigInt) ── */
  var Q = function (n, d) { return ALG.Q(BigInt(n), BigInt(d === undefined ? 1 : d)); };
  var sub = function (a, b) { return { n: a.n * b.d - b.n * a.d, d: a.d * b.d }; };
  var add = function (a, b) { return { n: a.n * b.d + b.n * a.d, d: a.d * b.d }; };
  var mul = function (a, b) { return { n: a.n * b.n, d: a.d * b.d }; };
  var div = function (a, b) { return { n: a.n * b.d, d: a.d * b.n }; };
  var same = function (a, b) { return a.n * b.d === b.n * a.d; };
  var sgn = function (a) { return a.n === 0n ? 0 : (a.n > 0n) === (a.d > 0n) ? 1 : -1; };
  var show = function (a) { var d = a.d < 0n ? -a.d : a.d, n = a.d < 0n ? -a.n : a.n, g = function (x, y) { x = x < 0n ? -x : x; while (y) { var t = x % y; x = y; y = t; } return x; }, k = g(n, d) || 1n; return String(n / k) + (d / k === 1n ? '' : '/' + String(d / k)); };
  var body = function (tex) { return tex.replace(/^(y|f\(x\)) = /, ''); };
  var at = function (tex, x, more) { var e = { x: x }, k; for (k in more || {}) e[k] = more[k]; return calc(body(tex), e); };
  /** 식을 읽어 { m, k }(y = m x + k)를 얻는다. 일차식이 아니면 null */
  var lineOf = function (tex) {
    try { var f0 = at(tex, Q(0)), f1 = at(tex, Q(1)), f2 = at(tex, Q(2)), m = sub(f1, f0); return same(sub(f2, f1), m) && same(sub(at(tex, Q(5)), f2), mul(m, Q(3))) ? { m: m, k: f0 } : null; } catch (e) { return null; }
  };
  var isLin = function (tex) { try { var v = [1, 2, 3, 4].map(function (x) { return at(tex, Q(x)); }), d = sub(v[1], v[0]); return same(sub(v[2], v[1]), d) && same(sub(v[3], v[2]), d) && sgn(d) !== 0; } catch (e) { return null; } };
  var sig = function (tex) { try { return [1, 2, 3, 4].map(function (x) { return show(at(tex, Q(x))); }).join(' '); } catch (e) { return null; } };
  /** 풀이의 줄들이 주어진 값에서 성립하는가(글자 · 화살표가 든 줄, f(x) = … 은 건너뛴다) */
  var stepsHold = function (id, p, env, where) {
    var st = MH.types[id].steps(p.v);
    st.forEach(function (s, i) {
      var t = s.tex.replace(/^f\(-?\d+\) = /, ''), parts, v;
      if (/\\text|\\rightarrow|\\quad|^f\(x\)/.test(s.tex) || t.indexOf(' = ') < 0) return;
      try { parts = t.split(' = '); v = parts.map(function (x) { return calc(x, env); }); ok(v.every(function (x) { return same(x, v[0]); }), where + '풀이 ' + (i + 1) + '째 줄이 성립하지 않음: ' + s.tex); }
      catch (e) { ok(false, where + '풀이 ' + (i + 1) + '째 줄을 읽지 못함: ' + s.tex + ' (' + e + ')'); }
    });
    ok(st.length >= 2, where + '풀이 줄 수');
    return st;
  };
  /** 수 하나가 답인 유형의 공통 검사. want 는 분수 */
  var numChecks = function (id, p, want, where, bag) {
    var def = MH.types[id], kind = MH.kinds[def.answer.kind], a = p.answer, got = def.answer.kind === 'rational' ? Q(a.n, a.d) : def.answer.kind === 'signed' ? Q(a.n) : Q(a);
    ok(same(got, want), where + '답: 기대 ' + show(want) + ', 실제 ' + show(got));
    if (def.answer.kind === 'rational') ok(a.d >= 1 && MH.gcd(Math.abs(a.n), a.d) === 1, where + '답은 기약분수');
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) {
      eq(J(p, kind.raw(a, def.answer)), 'correct:-', where + '정답 판정');
      MH.mistakesFor(p).forEach(function (x) { var j = MH.judge(p, kind.raw(x.value, def.answer)); ok(j.verdict === 'wrong' && !!j.mistake, where + '실수 값 판정 ' + x.id); });
    }
    detailed(id, p, where);
  };
  var choiceChecks = function (id, p, where, bag) {
    var opts = MH.optionsOf(p);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i; }) && opts.indexOf(p.answer) >= 0 && MH.mistakesFor(p).length === 3, where + '보기: ' + opts.join(' | '));
    MH.mistakesFor(p).forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); MH.mistakesFor(p).forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    return opts;
  };
  var PT = '\\$\\((-?\\d+),\\\\ (-?\\d+)\\)\\$';

  group('B15 — 검사 도구 자체 검사');
  var L1 = lineOf('y = -\\dfrac{2}{3}x - 4'), L2 = lineOf('y = 5 - 2x');
  ok(!!L1 && show(L1.m) === '-2/3' && show(L1.k) === '-4' && !!L2 && show(L2.m) === '-2' && show(L2.k) === '5', '기울기와 y절편 읽기');
  ok(lineOf('y = x^{2} + 1') === null && lineOf('y = \\dfrac{4}{x}') === null, '일차식이 아닌 식');
  ok(isLin('y = x(x + 3) - x^{2}') === true && isLin('y = 2(x + 1) - 2x') === false && isLin('y = \\dfrac{6x - 8}{2}') === true && isLin('y = x(x - 2)') === false && isLin('y = 7') === false && isLin('y = -\\dfrac{3}{x}') === false && isLin('y = 3 - x') === true, '일차함수 판단');
  eq(sig('y = x^{2} + 2 - x(x - 4)'), sig('y = 4x + 2'), '같은 함수');
  done('도구');

  group('B15 — 함수와 일차함수: 보기를 하나하나 따로 판단한다 (단계마다 1,000문제)');
  var YES = /지우개|나눈 나머지|정사각형의 둘레|시속|약수의 개수|만큼 큰 수|끈에서|^수 x의 절댓값/, NO = /의 약수 y$|의 배수 y$|^절댓값이 x인|보다 작은 자연수|몸무게|직사각형의 넓이|서로소|사람의 키/;
  var bag = {}, sets = [{}, {}, {}], wants = {};
  each('B15.fn', function (p, pr, level, where) {
    var opts = choiceChecks('B15.fn', p, where, bag), m = /^다음 중 \$y\$가 \$x\$의 (함수|일차함수)(인 것|가 아닌 것)을 고르세요\.$/.exec(pr.text), want, cls;
    ok(!!m && (m[1] === '함수') === (level === 0) && !pr.tex && !pr.figure, where + '문제 글: ' + pr.text);
    if (!m) return;
    want = m[2] === '인 것'; wants[level + m[2]] = 1; sets[level][opts.slice().sort().join('|')] = 1;
    cls = function (o) { return level === 0 ? (YES.test(o) === NO.test(o) ? null : YES.test(o)) : isLin(o); };
    ok(opts.every(function (o) { return cls(o) !== null && (cls(o) === want) === (o === p.answer); }), where + '답만 조건에 맞아야 함: ' + opts.join(' | ') + ' → ' + p.answer);
    if (level === 0) ok(opts.every(function (o) { return !/[$\\]/.test(o) && o.length <= 40; }) && opts.map(function (o) { return o.replace(/\d+/g, 'N'); }).every(function (o, i, a) { return a.indexOf(o) === i; }), where + '같은 틀의 보기가 두 번 나옴: ' + opts.join(' | '));
    if (level === 1) ok(opts.every(function (o) { return !/\(/.test(o) && (o.match(/x/g) || []).length <= 2; }), where + '2단계는 바로 보이는 식');
    if (level === 2) ok(opts.every(function (o) { return /\(|dfrac\{[^}]*x|x.*x/.test(o); }), where + '3단계는 정리해야 보이는 식');
    /* 설명: 맞다 · 아니다가 실제와 같고, "정리하면 …" 의 식은 보기와 같은 함수다 */
    MH.mistakesFor(p).forEach(function (x) {
      var says = /^이것은 (함수|일차함수)(가 아니에요|예요)\./.exec(x.explain), t = /정리하면 \$(.+?)\$ 꼴이 돼요/.exec(x.explain);
      ok(!!says && (says[2] === '예요') === cls(x.value), where + '설명의 판단: ' + x.value + ' / ' + x.explain);
      if (t) eq(sig(t[1]), sig(x.value), where + '정리한 식: ' + x.value + ' → ' + t[1]);
    });
    var last = MH.types['B15.fn'].steps(p.v).slice(-1)[0], t2 = /정리하면 \$(.+?)\$ 꼴이 돼요/.exec(last.say);
    if (t2) eq(sig(t2[1]), sig(p.answer), where + '풀이의 정리한 식');
  });
  eq(Object.keys(wants).length, 6, '단계마다 "인 것" · "아닌 것"을 모두 묻는다');
  ok(sets.every(function (s) { return Object.keys(s).length >= 300; }), '보기의 조합이 다양하다: ' + sets.map(function (s) { return Object.keys(s).length; }).join(', '));
  eq(Object.keys(bag).sort().join(' '), 'pick-1 pick-2 pick-3', '실수의 종류');
  done('함수와 일차함수');

  group('B15 — 함숫값 (단계마다 1,000문제)');
  bag = {}; var kinds = {};
  each('B15.value', function (p, pr, level, where) {
    var m, want, a, f = pr.tex, env = {}, solveA = function (x, t) { var f0 = at(f, Q(x), { a: Q(0) }), f1 = at(f, Q(x), { a: Q(1) }); return div(sub(Q(t), f0), sub(f1, f0)); };
    ok(/^f\(x\) = /.test(f), where + '식: ' + f);
    if ((m = /^\$f\((-?\d+)\)\$의 값을 구하세요\.$/.exec(pr.text))) { kinds[level + 'at'] = 1; want = at(f, Q(m[1])); ok(level < 2 && !!lineOf(f), where + '식'); }
    else if ((m = /^\$f\(k\) = (-?\d+)\$일 때, \$k\$의 값을 구하세요\.$/.exec(pr.text))) { kinds[level + 'inv'] = 1; a = lineOf(f); want = div(sub(Q(m[1]), a.k), a.m); env.k = want; ok(same(at(f, want), Q(m[1])), where + '구한 k 를 넣으면 주어진 값'); }
    else if ((m = /^\$f\((-?\d+)\) = (-?\d+)\$일 때, 상수 \$a\$의 값을 구하세요\.$/.exec(pr.text))) { kinds[level + 'coef'] = 1; want = solveA(m[1], m[2]); env.a = want; ok(/^f\(x\) = ax [+-] \d+$/.test(f), where + '식'); }
    else if ((m = /^\$f\((-?\d+)\) = (-?\d+)\$일 때, \$f\((-?\d+)\)\$의 값을 구하세요\.$/.exec(pr.text))) { kinds[level + 'two'] = 1; a = solveA(m[1], m[2]); env.a = a; want = at(f, Q(m[3]), { a: a }); ok(m[1] !== m[3], where + '두 수가 달라야 함'); if (wrongOf(p, 'coef-answered')) ok(same(Q(wrongOf(p, 'coef-answered').n), a), where + 'coef-answered 는 a 의 값'); }
    else { ok(false, where + '문제 글: ' + pr.text); return; }
    ok(level !== 1 || /dfrac/.test(f) || /f\(k\)/.test(pr.text), where + '2단계는 분수 계수이거나 거꾸로 구하기');
    stepsHold('B15.value', p, env, where);
    numChecks('B15.value', p, want, where, bag);
  });
  eq(Object.keys(kinds).sort().join(' '), '0at 1at 1inv 2coef 2two', '단계마다 나오는 물음');
  eq(Object.keys(bag).sort().join(' '), 'added coef-answered first-value intercept-ignored move-sign not-divided sign-slip value-answered value-plugged', '실수의 종류');
  done('함숫값');

  group('B15 — 기울기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B15.slope', function (p, pr, level, where) {
    var m, want, L, env = {}, f = pr.figure, slope2 = function (x1, y1, x2, y2) { return div(Q(y2 - y1), Q(x2 - x1)); };
    if (pr.text === '이 일차함수의 그래프의 기울기를 구하세요.') { kinds[level + 'read'] = 1; L = lineOf(pr.tex); want = L.m; if (wrongOf(p, 'intercept-answered')) ok(same(Q(wrongOf(p, 'intercept-answered').n, wrongOf(p, 'intercept-answered').d), L.k), where + 'intercept-answered 는 y절편'); }
    else if ((m = /^\$x\$의 값이 (\d+)만큼 증가할 때, \$y\$의 값의 증가량을 구하세요\.$/.exec(pr.text))) { kinds[level + 'inc'] = 1; L = lineOf(pr.tex); want = sub(at(pr.tex, Q(Number(m[1]) + 3)), at(pr.tex, Q(3))); ok(same(want, mul(L.m, Q(m[1]))), where + '증가량'); }
    else if ((m = new RegExp('^두 점 ' + PT + ', ' + PT + '[을를] 지나는 직선의 기울기를 구하세요\\.$').exec(pr.text))) {
      kinds[level + 'pts'] = 1; m = m.slice(1).map(Number); want = slope2(m[0], m[1], m[2], m[3]); ok(m[0] !== m[2] && m[1] !== m[3] && !pr.tex && !f, where + '두 점');
      if (wrongOf(p, 'reciprocal')) ok(same(Q(wrongOf(p, 'reciprocal').n, wrongOf(p, 'reciprocal').d), div(Q(1), want)), where + 'reciprocal 은 역수');
    } else if (pr.text === '그림의 직선은 두 점 A, B를 지나요. 이 직선의 기울기를 구하세요.') {
      kinds[level + 'fig'] = 1;
      ok(!!f && f.type === 'plane' && planeOk(f) && f.line.length === 3 && f.points.length === 2 && f.points[0].label === 'A' && f.points[1].label === 'B', where + '그림: ' + JSON.stringify(f));
      want = slope2(f.points[0].x, f.points[0].y, f.points[1].x, f.points[1].y);
      ok(same(want, Q(f.line[0], f.line[1])) && f.points.every(function (q) { return same(add(mul(Q(f.line[0], f.line[1]), Q(q.x)), Q(f.line[2])), Q(q.y)); }), where + '두 점이 그려진 직선 위에 있다');
    } else if ((m = new RegExp('^세 점 ' + PT + ', ' + PT + ', \\$\\((-?\\d+),\\\\ k\\)\\$가 한 직선 위에 있을 때, \\$k\\$의 값을 구하세요\\.$').exec(pr.text))) {
      kinds[level + 'three'] = 1; m = m.slice(1).map(Number); want = add(Q(m[3]), mul(slope2(m[0], m[1], m[2], m[3]), Q(m[4] - m[2]))); env.k = want;
      ok(m[4] !== m[0] && m[4] !== m[2] && same(slope2(m[0], m[1], m[2], m[3]), div(sub(want, Q(m[1])), Q(m[4] - m[0]))), where + '세 점이 한 직선 위');
    } else { ok(false, where + '문제 글: ' + pr.text); return; }
    ok(sgn(want) !== 0, where + '답이 0');
    /* 풀이: y 가 든 줄(식을 고쳐 쓴 줄)은 기울기가 같은지로 본다 */
    MH.types['B15.slope'].steps(p.v).forEach(function (s) { if (/^y = /.test(s.tex)) ok(same(lineOf(s.tex).m, want) && sig(s.tex) === sig(pr.tex), where + '고쳐 쓴 식: ' + s.tex); });
    var st = MH.types['B15.slope'].steps(p.v).filter(function (s) { return !/^y = /.test(s.tex); }), keep = MH.types['B15.slope'].steps;
    st.forEach(function (s, i) { var t = s.tex, parts, v; if (/\\text/.test(t)) { ok(/= (-?\d+|-?\\dfrac\{\d+\}\{\d+\})$/.test(t), where + '기울기 줄: ' + t); return; } parts = t.split(' = '); v = parts.map(function (x) { return calc(x, env); }); ok(parts.length >= 2 && v.every(function (x) { return same(x, v[0]); }), where + '풀이 줄이 성립하지 않음: ' + t); });
    numChecks('B15.slope', p, want, where, bag);
  });
  eq(Object.keys(kinds).sort().join(' '), '0inc 0read 1pts 2fig 2three', '단계마다 나오는 물음');
  eq(Object.keys(bag).sort().join(' '), 'divided intercept-added intercept-answered minus-negative reciprocal slope-answered slope-only step-only', '실수의 종류');
  done('기울기');

  group('B15 — 절편과 평행이동 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B15.intercept', function (p, pr, level, where) {
    var L = lineOf(pr.tex), m = /^이 일차함수의 그래프(?:를 \$y\$축의 방향으로 \$(-?\d+)\$만큼 평행이동한 그래프)?의 \$(x|y)\$절편을 구하세요\.$/.exec(pr.text), s, k2, want, other, mv;
    ok(!!L && !!m && (m[1] !== undefined) === (level === 2), where + '문제: ' + pr.tex + ' ' + pr.text);
    if (!L || !m) return;
    s = Q(m[1] || 0); k2 = add(L.k, s); want = m[2] === 'y' ? k2 : div(sub(Q(0), k2), L.m); other = m[2] === 'y' ? div(sub(Q(0), k2), L.m) : k2; kinds[level + m[2]] = 1;
    ok(sgn(k2) !== 0 && sgn(want) !== 0, where + '절편이 0');
    /* 답이 정말 절편인가: 옮긴 직선 y = m x + k2 에 넣어 본다 */
    ok(m[2] === 'y' ? same(add(mul(L.m, Q(0)), k2), want) : sgn(add(mul(L.m, want), k2)) === 0, where + '절편을 넣으면 축 위의 점');
    if (level === 0) ok(want.n % want.d === 0n && show(L.m).indexOf('/') < 0, where + '1단계는 정수');
    if (level === 1) ok(show(want).indexOf('/') >= 0 || show(L.m).indexOf('/') >= 0, where + '2단계는 분수가 나온다');
    mv = function (id) { var w = wrongOf(p, id); return w ? Q(w.n, w.d) : null; };
    if (mv('other-intercept')) ok(same(mv('other-intercept'), other), where + '다른 쪽 절편');
    if (mv('slope-answered')) ok(same(mv('slope-answered'), L.m), where + '기울기');
    if (mv('shift-ignored')) ok(same(mv('shift-ignored'), m[2] === 'y' ? L.k : div(sub(Q(0), L.k), L.m)), where + '옮기기 전의 절편');
    if (mv('shift-answered')) ok(same(mv('shift-answered'), s), where + '옮긴 양');
    stepsHold('B15.intercept', p, m[2] === 'y' ? { x: Q(0), y: want } : { x: want, y: Q(0) }, where);
    numChecks('B15.intercept', p, want, where, bag);
  });
  eq(Object.keys(kinds).sort().join(' '), '0x 0y 1x 1y 2x 2y', '단계마다 x절편 · y절편을 모두 묻는다');
  eq(Object.keys(bag).sort().join(' '), 'other-intercept shift-answered shift-ignored shift-opposite slope-answered x-inverted', '실수의 종류');
  done('절편과 평행이동');

  group('B15 — 그래프와 식 (단계마다 1,000문제)');
  bag = {}; var QN = ['제1사분면', '제2사분면', '제3사분면', '제4사분면'], missed = {};
  each('B15.graph', function (p, pr, level, where) {
    var opts = choiceChecks('B15.graph', p, where, bag), f = pr.figure, L, A, pass, mv = function (id) { var w = wrongOf(p, id); return w ? lineOf(w) : null; }, pt;
    if (level === 0) {
      ok(!!f && planeOk(f) && f.line.length === 3 && f.line[2] !== 0 && f.points.length === 2 && f.points[0].x === 0 && f.points[0].y === f.line[2] && !pr.tex, where + '그림: ' + JSON.stringify(f));
      A = lineOf(p.answer);
      ok(!!A && same(A.m, Q(f.line[0], f.line[1])) && same(A.k, Q(f.line[2])), where + '그림의 직선과 답: ' + p.answer);
      ok(opts.every(function (o) { return (o === p.answer) === f.points.every(function (q) { return same(at(o, Q(q.x)), Q(q.y)); }); }), where + '그림의 두 점을 모두 지나는 보기는 답뿐');
      ok(f.points[1].x !== 0 && Math.abs(f.points[1].y) <= 5, where + '둘째 점');
      if (mv('slope-sign')) ok(same(mv('slope-sign').m, sub(Q(0), A.m)) && same(mv('slope-sign').k, A.k), where + 'slope-sign');
      if (mv('intercept-sign')) ok(same(mv('intercept-sign').m, A.m) && same(mv('intercept-sign').k, sub(Q(0), A.k)), where + 'intercept-sign');
      if (mv('reciprocal')) ok(same(mul(mv('reciprocal').m, A.m), Q(1)), where + 'reciprocal');
      pt = f.points[1]; stepsHold('B15.graph', p, { x: Q(pt.x), y: Q(pt.y) }, where);
    } else if (level === 1) {
      L = lineOf(pr.tex);
      ok(!!L && sgn(L.k) !== 0 && opts.join('|') === QN.join('|') && pr.text === '이 일차함수의 그래프가 지나지 않는 사분면을 고르세요.', where + '문제: ' + pr.tex);
      /* 사분면마다 지나는지: x 의 부호와 y 의 부호가 그렇게 되는 x 가 있는가 */
      pass = [sgn(L.m) > 0 || sgn(L.k) > 0, sgn(L.m) < 0 || sgn(L.k) > 0, sgn(L.m) > 0 || sgn(L.k) < 0, sgn(L.m) < 0 || sgn(L.k) < 0];
      ok(pass.filter(Boolean).length === 3 && pass[QN.indexOf(p.answer)] === false, where + pr.tex + ' → ' + p.answer);
      /* 실제로 점을 찍어 본다: 아주 먼 두 점과, 두 절편 사이의 점 */
      var seen = {}, xi = div(sub(Q(0), L.k), L.m);
      [Q(1000), Q(-1000), div(xi, Q(2))].forEach(function (x) { var y = at(pr.tex, x), sx = sgn(x), sy = sgn(y); seen[sx > 0 ? (sy > 0 ? 0 : 3) : (sy > 0 ? 1 : 2)] = 1; });
      ok(Object.keys(seen).length === 3 && !seen[QN.indexOf(p.answer)], where + '찍어 본 점의 사분면');
      missed[p.answer] = 1;
    } else {
      L = lineOf(pr.tex);
      ok(!!L && opts.every(function (o) { var X = lineOf(o); return !!X && (o === p.answer) === (same(X.m, L.m) && !same(X.k, L.k)); }), where + '평행한 보기는 답뿐: ' + pr.tex + ' / ' + opts.join(' | '));
      ok(opts.every(function (o) { var X = lineOf(o); return !(same(X.m, L.m) && same(X.k, L.k)); }), where + '일치하는 보기는 없다');
      if (mv('same-intercept')) ok(same(mv('same-intercept').k, L.k), where + 'same-intercept');
      if (mv('mirror')) ok(same(mv('mirror').k, L.k) && same(mv('mirror').m, sub(Q(0), L.m)), where + 'mirror');
    }
  });
  eq(Object.keys(missed).sort().join(' '), QN.join(' '), '네 사분면이 모두 답으로 나온다');
  eq(Object.keys(bag).sort().join(' '), 'both-sign intercept-sign mirror reciprocal same-intercept slope-sign', '실수의 종류');
  done('그래프와 식');

  group('B15 — 직선의 식 구하기: 답만 조건을 모두 만족한다 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B15.find', function (p, pr, level, where) {
    var opts = choiceChecks('B15.find', p, where, bag), m, conds = [], P0, fits, t = pr.text, tail = ' 직선을 그래프로 하는 일차함수의 식을 고르세요\\.$';
    var through = function (x, y) { return function (o) { return same(at(o, Q(x)), Q(y)); }; }, slopeIs = function (mm) { return function (o) { return same(lineOf(o).m, mm); }; };
    if ((m = new RegExp('^기울기가 \\$(.+?)\\$이고 \\$y\\$절편이 \\$(-?\\d+)\\$인' + tail).exec(t))) { kinds[level + 'mk'] = 1; conds = [slopeIs(calc(m[1], {})), through(0, Number(m[2]))]; P0 = [0, Number(m[2])]; }
    else if ((m = new RegExp('^기울기가 \\$(.+?)\\$이고 점 ' + PT + '[을를] 지나는' + tail).exec(t))) { kinds[level + 'mp'] = 1; conds = [slopeIs(calc(m[1], {})), through(Number(m[2]), Number(m[3]))]; P0 = [Number(m[2]), Number(m[3])]; }
    else if ((m = new RegExp('^일차함수 \\$(y = .+?)\\$의 그래프와 평행하고 점 ' + PT + '[을를] 지나는' + tail).exec(t))) {
      kinds[level + 'par'] = 1; conds = [slopeIs(lineOf(m[1]).m), through(Number(m[2]), Number(m[3]))]; P0 = [Number(m[2]), Number(m[3])];
      ok(!same(lineOf(m[1]).k, lineOf(p.answer).k), where + '평행한 두 직선은 y절편이 달라야 함');
      if (wrongOf(p, 'kept-intercept')) eq(wrongOf(p, 'kept-intercept'), m[1], where + 'kept-intercept 는 주어진 식 그대로');
    } else if ((m = new RegExp('^두 점 ' + PT + ', ' + PT + '[을를] 지나는' + tail).exec(t))) { kinds[level + 'two'] = 1; m = m.slice(1).map(Number); conds = [through(m[0], m[1]), through(m[2], m[3])]; P0 = [m[0], m[1]]; ok(m[0] !== m[2] && m[1] !== m[3], where + '두 점'); }
    else if ((m = new RegExp('^\\$x\\$절편이 \\$(-?\\d+)\\$이고 \\$y\\$절편이 \\$(-?\\d+)\\$인' + tail).exec(t))) { kinds[level + 'xy'] = 1; conds = [through(Number(m[1]), 0), through(0, Number(m[2]))]; P0 = [Number(m[1]), 0]; }
    else { ok(false, where + '문제 글: ' + t); return; }
    ok(opts.every(function (o) { return !!lineOf(o) && /^y = /.test(o); }), where + '보기는 모두 일차함수의 식');
    fits = function (o) { return conds.every(function (c) { return c(o); }); };
    ok(opts.every(function (o) { return fits(o) === (o === p.answer); }), where + t + ' → ' + p.answer + ' / ' + opts.join(' | '));
    ok(opts.map(function (o) { return sig(o); }).every(function (s, i, a) { return a.indexOf(s) === i; }), where + '같은 직선인 보기가 있음');
    var A = lineOf(p.answer);
    ok(A.k.n % A.k.d === 0n, where + 'y절편은 정수');
    stepsHold('B15.find', p, { x: Q(P0[0]), y: Q(P0[1]), b: A.k }, where);
  });
  eq(Object.keys(kinds).sort().join(' '), '0mk 0mp 1two 2par 2xy', '단계마다 나오는 조건');
  eq(Object.keys(bag).sort().join(' '), 'b-is-y b-sign both-sign intercept-sign kept-intercept reciprocal slope-sign swapped x-as-b', '실수의 종류');
  done('직선의 식 구하기');

  group('B15 — 활용: 한 번씩 더하고 빼며 따라가 본다 (단계마다 1,000문제)');
  bag = {}; kinds = [{}, {}, {}];
  var TH = [
    { re: /^물이 (\d+) L 들어 있는 물탱크에 1분에 (\d+) L씩 물을 넣어요\. (?:물을 넣기 시작한 지 (\d+)분 후에 물탱크에 들어 있는 물의 양은 몇 L인지|물탱크의 물의 양이 (\d+) L가 되는 것은 물을 넣기 시작한 지 몇 분 후인지) 구하세요\.$/, up: 1, per: 1, xu: '분', yu: 'L' },
    { re: /^길이가 (\d+) mm인 양초에 불을 붙이면 1분에 (\d+) mm씩 짧아져요\. (?:불을 붙인 지 (\d+)분 후에 남은 양초의 길이는 몇 mm인지|남은 양초의 길이가 (\d+) mm가 되는 것은 불을 붙인 지 몇 분 후인지) 구하세요\.$/, up: -1, per: 1, xu: '분', yu: 'mm' },
    { re: /^길이가 (\d+) cm인 용수철에 추를 한 개 매달 때마다 길이가 (\d+) cm씩 늘어나요\. (?:추를 (\d+)개 매달았을 때 용수철의 길이는 몇 cm인지|용수철의 길이가 (\d+) cm가 되려면 추를 몇 개 매달아야 하는지) 구하세요\.$/, up: 1, per: 1, xu: '개', yu: 'cm' },
    { re: /^연료가 (\d+) L 들어 있는 자동차가 10 km를 달릴 때마다 연료를 (\d+) L씩 써요\. (?:(\d+) km를 달린 뒤에 남은 연료의 양은 몇 L인지|남은 연료의 양이 (\d+) L가 되는 것은 몇 km를 달린 뒤인지) 구하세요\.$/, up: -1, per: 10, xu: 'km', yu: 'L' }
  ];
  var OBS = /(\d+)(?:분|개) (?:후의 [^,.]*?[은는]|매달았을 때의 길이는) (\d+) (L|mm|cm), (\d+)(?:분|개) (?:후의 [^,.]*?[은는]|매달았을 때의 길이는) (\d+) (?:L|mm|cm)였어요\. (.*)$/;
  each('B15.word', function (p, pr, level, where) {
    var t = pr.text, th = null, m = null, want, unit, y, x, i, n, rate, env, name;
    TH.forEach(function (T, k) { var r = T.re.exec(t); if (r) { th = T; m = r; name = k; } });
    if (th) {
      if (m[3] !== undefined) { ok(Number(m[3]) % th.per === 0, where + '거리는 10 km의 배수'); y = Number(m[1]); for (i = 0; i < Number(m[3]) / th.per; i++) y += th.up * Number(m[2]); want = y; unit = th.yu; x = Number(m[3]); kinds[level]['at' + name] = 1; eq(level, 0, where + '단계'); }
      else { y = Number(m[1]); n = 0; while (y !== Number(m[4]) && n < 500) { y += th.up * Number(m[2]); n++; } ok(n > 0 && n < 500, where + '그 값에 이르지 못함: ' + t); want = n * th.per; unit = th.xu; x = want; y = Number(m[4]); kinds[level]['inv' + name] = 1; eq(level, 1, where + '단계'); }
      env = { x: Q(x), y: Q(y) };
    } else if ((m = OBS.exec(t))) {
      eq(level, 2, where + '단계');
      var t1 = Number(m[1]), y1 = Number(m[2]), t2 = Number(m[4]), y2 = Number(m[5]), pred = /(\d+)(?:분 후의|개 매달았을 때)/.exec(m[6]);
      ok(t2 > t1 && (y2 - y1) % (t2 - t1) === 0 && y2 !== y1, where + '두 번의 관찰: ' + t);
      rate = (y2 - y1) / (t2 - t1); y = y1; for (i = t1; i > 0; i--) y -= rate;     /* 처음 양: 거꾸로 따라간다 */
      unit = m[3];
      if (pred) { ok(Number(pred[1]) > t2, where + '묻는 때는 관찰한 뒤'); n = y; for (i = 0; i < Number(pred[1]); i++) n += rate; want = n; kinds[level].pred = 1; env = { x: Q(pred[1]), y: Q(want), b: Q(y) }; if (wrongOf(p, 'start-answered')) eq(wrongOf(p, 'start-answered'), y, where + 'start-answered 는 처음 양'); }
      else { ok(/처음에|붙이기 전|매달지 않았을 때/.test(m[6]), where + '묻는 것: ' + m[6]); want = y; kinds[level].start = 1; env = { x: Q(0), y: Q(want), b: Q(y) }; eq(wrongOf(p, 'first-observed'), y1, where + 'first-observed 는 첫 관찰'); }
      ok(y > 0, where + '처음 양은 양수');
      eq(wrongOf(p, 'rate-answered'), Math.abs(rate) === want ? null : Math.abs(rate), where + 'rate-answered 는 한 번에 변하는 양');
    } else { ok(false, where + '문제 글: ' + t); return; }
    ok(want > 0 && !pr.tex && !/undefined|NaN/.test(t), where + '답은 자연수: ' + t);
    eq(MH.types['B15.word'].answer.suffix(p.v), unit, where + '단위');
    stepsHold('B15.word', p, env, where);
    MH.mistakesFor(p).forEach(function (w) { ok(w.value !== want && w.value > 0, where + '실수 ' + w.id + ' 의 값'); });
    if (p.seed <= 100) MH.mistakesFor(p).forEach(function (w) { eq(J(p, String(w.value)), 'wrong:' + w.id, where + '실수 판정 ' + w.id); });
    numChecks('B15.word', p, Q(want), where, bag);
  });
  eq(kinds.map(function (k) { return Object.keys(k).sort().join(' '); }).join(' / '), 'at0 at1 at2 at3 / inv0 inv1 inv2 inv3 / pred start', '단계마다 나오는 상황');
  eq(Object.keys(bag).sort().join(' '), 'change-only direction first-observed no-start proportional rate-answered rate-only start-answered', '실수의 종류');
  done('활용');

  group('B15 — 구체적인 예');
  var find = function (id, level, test) { for (var seed = 1; seed <= 6000; seed++) { var p = MH.makeProblem(id, level, seed); if (test(MH.types[id].prompt(p.v, p.ctx), p)) return p; } return null; };
  var p1 = find('B15.slope', 0, function (pr) { return /^y = -?\d+ [+-] /.test(pr.tex) && /기울기를/.test(pr.text); });
  ok(!!p1 && !!wrongOf(p1, 'intercept-answered'), '항의 순서가 바뀐 식에서 앞의 수는 기울기가 아니다');
  var p2 = find('B15.find', 1, function (pr) { return pr.text.indexOf('두 점 $(1,\\ 3)$, $(3,\\ 7)$') === 0 || pr.text.indexOf('두 점 $(3,\\ 7)$, $(1,\\ 3)$') === 0; });
  ok(!p2 || p2.answer === 'y = 2x + 1', '(1, 3), (3, 7)을 지나는 직선은 y = 2x + 1');
  var p3 = find('B15.graph', 1, function (pr) { return pr.tex === 'y = 2x - 3'; });
  ok(!!p3 && p3.answer === '제2사분면', 'y = 2x − 3 은 제2사분면을 지나지 않는다');
  var p4 = find('B15.intercept', 0, function (pr) { return pr.tex === 'y = 2x - 4' && /\$x\$절편/.test(pr.text); });
  ok(!!p4 && p4.answer.n === 2 && p4.answer.d === 1 && wrongOf(p4, 'other-intercept').n === -4, 'y = 2x − 4 의 x절편은 2');
  var p5 = find('B15.value', 0, function (pr) { return pr.tex === 'f(x) = 2x + 1' && /f\(3\)/.test(pr.text); });
  ok(!!p5 && p5.answer.n === 7, 'f(x) = 2x + 1 이면 f(3) = 7');
  ok(MH.judge(find('B15.slope', 1, function () { return true; }), '').verdict === 'invalid', '빈 답은 판정하지 않는다');
  done('예');
})();
