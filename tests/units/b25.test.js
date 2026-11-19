/* B25 삼각비 — 단원 전용 검사.
   문제 글에서 변의 길이 · 각 · 주어진 삼각비를 읽고, 답을 Math.sin · cos · tan 으로 다시 계산해 견준다(단원 파일의 정수 계산과 무관하다).
   근호가 든 보기는 수로 읽되 가장 간단한 꼴(근호 안에 제곱수 없음 · 약분됨)이 아니면 읽지 않는다. 틀린 보기는 값이 답과 달라야 한다.
   분수 답은 기약분수여야 하고, 약분하지 않은 입력도 정답으로 판정되어야 한다.
   그림은 직각 · 표시한 각(30° · 45° · 60° · 끼인각)이 좌표로 잰 값과 맞는지, 적힌 길이가 문제 글과 같은지 본다. */
(function () {
  'use strict';
  var N = 1000, noJosa = ALG.noJosa;
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
    if (p.seed <= 300) all.forEach(function (t) {
      var re = /(\d)\)?\}?\$?(이에요|예요|은 |는 |이 |가 |을 |를 |과 |와 |으로 |로 )/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        if (/\^\{\\circ\}\$?$/.test(t.slice(0, m.index + 1)) || /\^\{\d+$/.test(t.slice(0, m.index + 1))) continue;
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
      ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object/.test(t) && !/ $/.test(t), where + '글: ' + t);
    });
  };
  var RAD = Math.PI / 180, near = function (x, y) { return typeof x === 'number' && typeof y === 'number' && isFinite(x) && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y)); };
  var gcd = function (a, b) { while (b) { var t = a % b; a = b; b = t; } return a; };
  var TRIG = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
  /** 근호가 든 값 'k\sqrt{r}' · '\dfrac{k\sqrt{r}}{d}' · 정수 · 분수를 수로. 가장 간단한 꼴이 아니면 null */
  var valOf = function (s) {
    var m = /^\\dfrac\{(.*)\}\{(\d+)\}$/.exec(s), top = m ? m[1] : s, d = m ? Number(m[2]) : 1, t = /^(\d*)(?:\\sqrt\{(\d+)\})?$/.exec(top), k, r, i;
    if (!t || (t[1] === '' && t[2] === undefined) || (m && d < 2)) return null;
    k = t[1] === '' ? 1 : Number(t[1]); r = t[2] === undefined ? 1 : Number(t[2]);
    if (t[2] !== undefined) { if (r < 2 || t[1] === '1' || t[1] === '0') return null; for (i = 2; i * i <= r; i++) if (r % (i * i) === 0) return null; }
    if (gcd(k, d) !== 1 || k < 1) return null;
    return k * Math.sqrt(r) / d;
  };
  /** 단위가 붙은 보기를 수로. '(8\sqrt{3} + 1)\,\mathrm{m}' 꼴도 읽는다 */
  var unitVal = function (s, unit) {
    var tail = '\\,\\mathrm{' + (unit === 'cm2' ? 'cm}^{2}' : unit + '}'), body, m, v;
    if (s.slice(-tail.length) !== tail) return null;
    body = s.slice(0, -tail.length); m = /^\((.*) ([+-]) (\d+)\)$/.exec(body);
    if (m) { v = valOf(m[1]); return v === null || !/sqrt/.test(m[1]) ? null : v + (m[2] === '-' ? -1 : 1) * Number(m[3]); }
    return valOf(body);
  };
  var degs = function (t) { var out = [], re = /(\d+)\^\{\\circ\}/g, m; while ((m = re.exec(t))) out.push(Number(m[1])); return out; };
  var polys = function (f) { return f.items.filter(function (i) { return i[0] === 'poly'; }).map(function (it) { var out = [], k; for (k = 0; k < it[1].length; k += 2) out.push([it[1][k], it[1][k + 1]]); return out; }); };
  var angleAt = function (O, P, Q) { var u = [P[0] - O[0], P[1] - O[1]], v = [Q[0] - O[0], Q[1] - O[1]]; return Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.sqrt((u[0] * u[0] + u[1] * u[1]) * (v[0] * v[0] + v[1] * v[1]))) / RAD; };
  var labels = function (f) { return f.items.filter(function (i) { return i[0] === 'text'; }).map(function (i) { return i[3]; }); };
  /** 분수 답(키패드) 문제의 공통 검사 */
  var fracChecks = function (id, p, pr, where, bag) {
    var def = MH.types[id], kind = MH.kinds.fraction, a = p.answer, ms = MH.mistakesFor(p), steps = def.steps(p.v);
    ok(Number.isInteger(a.n) && Number.isInteger(a.d) && a.n >= 1 && a.d >= 2 && gcd(a.n, a.d) === 1, where + '답은 기약분수');
    ms.forEach(function (x) { bag[x.id] = 1; ok(x.value.n >= 1 && x.value.d >= 1 && x.value.n * a.d !== a.n * x.value.d, where + '실수 값: ' + x.id); });
    ok(ms.length >= 2 && ms.every(function (x, i) { return ms.every(function (y, j) { return i === j || x.value.n * y.value.d !== y.value.n * x.value.d; }); }), where + '실수가 둘은 있고 값이 서로 달라야 함');
    if (p.seed <= 60) {
      eq(J(p, kind.raw(a, def.answer)), 'correct:-', where + '정답 판정'); eq(MH.judge(p, (3 * a.n) + ',' + (3 * a.d)).verdict, 'correct-note', where + '약분하지 않은 답도 정답(약분 안내)');
      ms.forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); });
    }
    ok(steps.length >= 2, where + '풀이 줄 수');
    if (pr.figure) ok(pr.figure.type === 'geo' && geoOk(pr.figure), where + '그림 형식');
    detailed(id, p, where);
    return a.n / a.d;
  };
  /** 보기 고르기 문제의 공통 검사. read(보기) 로 값을 읽어 답과 다른지 본다. 답의 값을 돌려준다 */
  var choiceChecks = function (id, p, pr, where, bag, read) {
    var opts = MH.optionsOf(p), ms = MH.mistakesFor(p), steps = MH.types[id].steps(p.v), a = read(p.answer);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && ms.length === 3, where + '보기: ' + opts.join(' | '));
    ok(a !== null, where + '답을 읽을 수 없거나 가장 간단한 꼴이 아님: ' + p.answer);
    ms.forEach(function (x) { var w = read(x.value); bag[x.id] = 1; ok(w !== null && !near(w, a) && w > 0, where + '틀린 보기의 값: ' + x.value); });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    ok(steps.length >= 2 && steps[steps.length - 1].tex === p.answer, where + '풀이의 마지막 줄은 답');
    if (pr.figure) ok(pr.figure.type === 'geo' && geoOk(pr.figure), where + '그림 형식');
    return a;
  };

  group('B25 — 검사 도구 자체 검사');
  ok(near(valOf('\\dfrac{\\sqrt{3}}{2}'), Math.sqrt(3) / 2) && near(valOf('2\\sqrt{3}'), 2 * Math.sqrt(3)) && valOf('7') === 7 && near(valOf('\\dfrac{5\\sqrt{3}}{6}'), 5 * Math.sqrt(3) / 6) && near(valOf('\\dfrac{3}{2}'), 1.5), '값 읽기');
  ok(valOf('\\sqrt{12}') === null && valOf('\\dfrac{2\\sqrt{3}}{2}') === null && valOf('\\dfrac{4}{2}') === null && valOf('1\\sqrt{2}') === null && valOf('x') === null && valOf('') === null && valOf('\\dfrac{3}{1}') === null, '가장 간단한 꼴이 아니면 읽지 않는다');
  ok(near(unitVal('(8\\sqrt{3} + 1)\\,\\mathrm{m}', 'm'), 8 * Math.sqrt(3) + 1) && unitVal('12\\,\\mathrm{m}', 'm') === 12 && unitVal('12\\,\\mathrm{m}', 'cm') === null && near(unitVal('6\\sqrt{2}\\,\\mathrm{cm}^{2}', 'cm2'), 6 * Math.sqrt(2)) && unitVal('(8 + 1)\\,\\mathrm{m}', 'm') === null, '단위가 붙은 값 읽기');
  ok(near(angleAt([0, 0], [10, 0], [10, 10]), 45) && near(angleAt([0, 0], [1, 0], [0, 5]), 90), '각 재기');
  done('도구');

  group('B25 — 삼각비의 뜻 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B25.def', function (p, pr, level, where) {
    var v = fracChecks('B25.def', p, pr, where, bag), t = pr.text, f = pr.figure, s = {}, re = /\\overline\{(AB|BC|CA)\} = (\d+)\$/g, m, q, ang, T, arc, ls;
    while ((m = re.exec(t))) s[m[1]] = Number(m[2]);
    kinds[level + (Object.keys(s).length === 3 ? 'all' : 'two')] = 1;
    if (!s.AB) s.AB = Math.sqrt(s.BC * s.BC + s.CA * s.CA); if (!s.BC) s.BC = Math.sqrt(s.AB * s.AB - s.CA * s.CA); if (!s.CA) s.CA = Math.sqrt(s.AB * s.AB - s.BC * s.BC);
    ok(Number.isInteger(s.AB) && Number.isInteger(s.BC) && Number.isInteger(s.CA) && s.BC * s.BC + s.CA * s.CA === s.AB * s.AB && /\\angle C = 90/.test(t), where + '직각삼각형이 아님');
    q = /\$\\(sin|cos|tan) ([AB])\$의 값/.exec(t); ok(!!q, where + '묻는 삼각비: ' + t); if (!q) return;
    ang = q[2] === 'A' ? Math.atan2(s.BC, s.CA) : Math.atan2(s.CA, s.BC);   /* 각 A 의 맞은편은 BC, 각 B 의 맞은편은 CA */
    ok(near(v, TRIG[q[1]](ang)), where + '삼각비의 값');
    if (level === 0) ok(q[2] === 'B', where + '0단계는 각 B');
    /* 그림: 직각은 C(첫 꼭짓점), 각 표시는 묻는 꼭짓점에, 적힌 길이는 문제 글의 수 */
    T = polys(f)[0]; arc = f.items.filter(function (i) { return i[0] === 'arc'; })[0]; ls = labels(f).filter(function (x) { return /^\d+$/.test(x); }).map(Number);
    ok(T.length === 3 && near(angleAt(T[0], T[1], T[2]), 90) && arc[1] === T[q[2] === 'B' ? 1 : 2][0] && arc[2] === T[q[2] === 'B' ? 1 : 2][1], where + '그림의 직각 · 각 표시');
    ok(ls.length === (t.match(/overline/g) || []).length && ls.every(function (x) { return x === s.AB || x === s.BC || x === s.CA; }), where + '그림의 길이');
  });
  eq(Object.keys(kinds).sort().join(' '), '0all 1all 2two', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'as-cos as-sin as-tan inverted', '실수의 종류');
  done('삼각비의 뜻');

  group('B25 — 한 삼각비로 다른 삼각비 구하기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B25.relation', function (p, pr, level, where) {
    var v = fracChecks('B25.relation', p, pr, where, bag), t = pr.text, m = /\$\\(sin|cos|tan) A = \\dfrac\{(\d+)\}\{(\d+)\}\$일 때, \$\\(sin|cos|tan) A\$의 값/.exec(t), g, ang;
    ok(!!m && !pr.figure, where + '문제 글: ' + t); if (!m) return;
    g = Number(m[2]) / Number(m[3]); ang = m[1] === 'sin' ? Math.asin(g) : m[1] === 'cos' ? Math.acos(g) : Math.atan(g);
    ok(m[1] !== m[4] && gcd(Number(m[2]), Number(m[3])) === 1 && (m[1] === 'tan' || g < 1), where + '주어진 값');
    ok(near(v, TRIG[m[4]](ang)), where + '삼각비의 값');
    kinds[level + m[1] + '>' + m[4]] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0cos>sin 0sin>cos 1cos>tan 1sin>tan 2tan>cos 2tan>sin', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added inverted not-rooted one-minus other-ratio same', '실수의 종류');
  done('다른 삼각비');

  group('B25 — 30° · 45° · 60°의 삼각비 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B25.special', function (p, pr, level, where) {
    var x = pr.tex, isAngle = /x = /.test(x), read = isAngle ? function (s) { var m = /^(\d+)\^\{\\circ\}$/.exec(s); return m ? Number(m[1]) : null; } : valOf;
    var a = choiceChecks('B25.special', p, pr, where, bag, read), m, l, r, want;
    ok(!pr.figure, where + '그림이 없어야 함');
    if (isAngle) {
      m = /^\\(sin|cos|tan) x = (.*)$/.exec(x); kinds[level + 'angle'] = 1;
      ok(!!m && valOf(m[2]) !== null && [30, 45, 60].indexOf(a) >= 0 && near(TRIG[m[1]](a * RAD), valOf(m[2])), where + '각의 크기');
      MH.mistakesFor(p).forEach(function (w) { var d = read(w.value); ok(d === 90 || !near(TRIG[m[1]](d * RAD), valOf(m[2])), where + '틀린 각도 식을 만족시킴: ' + w.value); });
      return;
    }
    m = /^\\(sin|cos|tan) (\d+)\^\{\\circ\}(?: (\+|-|\\times|\\div) \\(sin|cos|tan) (\d+)\^\{\\circ\})?$/.exec(x);
    ok(!!m, where + '식을 읽을 수 없음: ' + x); if (!m) return;
    l = TRIG[m[1]](Number(m[2]) * RAD);
    if (!m[3]) { kinds[level + 'value'] = 1; want = l; }
    else { r = TRIG[m[4]](Number(m[5]) * RAD); kinds[level + 'calc' + m[3].replace('\\', '')] = 1; want = m[3] === '+' ? l + r : m[3] === '-' ? l - r : m[3] === '\\times' ? l * r : l / r; ok(!(m[1] === m[4] && m[2] === m[5]), where + '같은 것 둘'); }
    ok(near(a, want) && want > 1e-9, where + '값');
  });
  eq(Object.keys(kinds).sort().join(' '), '0value 1calc+ 1calc- 1calcdiv 1calctimes 2angle', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'both-swapped co-angle co-function deg-15 deg-30 deg-45 deg-60 deg-90 doubled first-swapped halved other-angle other-angle-2 other-function other-function-2 root-dropped second-swapped wrong-op', '실수의 종류');
  done('특수각');

  group('B25 — 삼각비로 변의 길이 구하기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  /** 각 B 가 b 도이고 직각이 C 인 삼각형에서 빗변 AB 가 1 일 때 세 변 */
  var unitSides = function (b) { return { AB: 1, AC: Math.sin(b * RAD), BC: Math.cos(b * RAD) }; };
  each('B25.length', function (p, pr, level, where) {
    var a = choiceChecks('B25.length', p, pr, where, bag, valOf), t = pr.text, f = pr.figure, m = /\\angle B = (\d+)\^\{\\circ\}\$이고 \$\\overline\{(AB|BC|AC)\} = (.*?)\$일 때, \$\\overline\{(AB|BC|AC)\}\$의 길이/.exec(t), u, g, T;
    ok(!!m && /\\angle C = 90/.test(t), where + '문제 글: ' + t); if (!m) return;
    u = unitSides(Number(m[1])); g = valOf(m[3]);
    ok(g !== null && m[2] !== m[4], where + '주어진 길이'); ok(near(a, g / u[m[2]] * u[m[4]]), where + '변의 길이');
    kinds[level + m[2] + '>' + m[4]] = 1;
    T = polys(f)[0]; ok(Math.abs(angleAt(T[0], T[1], T[2]) - Number(m[1])) <= 2 && near(angleAt(T[1], T[0], T[2]), 90) && labels(f).indexOf('x') >= 0 && labels(f).indexOf(m[1] + '°') >= 0, where + '그림의 각');
  });
  eq(Object.keys(kinds).sort().join(' '), '0AB>AC 0AB>BC 1AC>BC 1BC>AC 2AC>AB 2BC>AB', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'doubled halved inverse-op other-side same wrong-angle', '실수의 종류');
  done('변의 길이');

  group('B25 — 삼각비의 활용 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B25.apply', function (p, pr, level, where) {
    var a = choiceChecks('B25.apply', p, pr, where, bag, function (s) { return unitVal(s, 'm'); }), t = pr.text, d = degs(t)[0] * RAD, l = [], re = /(\d+)\\,\\mathrm\{m\}/g, m, want, k;
    while ((m = re.exec(t))) l.push(Number(m[1]));
    if (/눈의 높이가/.test(t)) { k = 'eye'; want = l[0] * Math.tan(d) + l[1]; ok(l.length === 2 && !pr.figure, where + '눈높이 문제'); }
    else if (/떨어진 땅 위의/.test(t)) { k = 'tree'; want = l[0] * Math.tan(d); }
    else if (/까지의 거리를/.test(t) && /높이가/.test(t)) { k = 'back'; want = l[0] / Math.tan(d); }
    else if (/닿은 곳의 높이/.test(t)) { k = 'ladder-h'; want = l[0] * Math.sin(d); }
    else if (/벽까지의 거리/.test(t)) { k = 'ladder-d'; want = l[0] * Math.cos(d); }
    else { k = 'kite'; ok(/연의 높이/.test(t), where + '모르는 문제: ' + t); want = l[0] * Math.sin(d); }
    kinds[level + k] = 1; ok(near(a, want), where + '값: ' + p.answer);
    if (k !== 'eye') ok(!!pr.figure && labels(pr.figure).indexOf('x') >= 0 && labels(pr.figure).indexOf(l[0] + ' m') >= 0 && Math.abs(angleAt(polys(pr.figure)[0][0], polys(pr.figure)[0][1], polys(pr.figure)[0][2]) - degs(t)[0]) <= 2, where + '그림');
  });
  eq(Object.keys(kinds).sort().join(' '), '0tree 1kite 1ladder-d 1ladder-h 2back 2eye', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'doubled eye-forgotten eye-subtracted halved inverse-op other-side same wrong-angle', '실수의 종류');
  done('활용');

  group('B25 — 삼각비와 넓이 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B25.area', function (p, pr, level, where) {
    var a = choiceChecks('B25.area', p, pr, where, bag, function (s) { return unitVal(s, 'cm2'); }), t = pr.text, C = degs(t)[0], l = [], re = /(\d+)\\,\\mathrm\{cm\}/g, m, para = /평행사변형/.test(t), f = pr.figure, T;
    while ((m = re.exec(t))) l.push(Number(m[1]));
    ok(l.length === 2 && /끼인각/.test(t), where + '문제 글');
    ok(near(a, (para ? 1 : 0.5) * l[0] * l[1] * Math.sin(C * RAD)), where + '넓이');
    kinds[level + (para ? 'para' : 'tri') + (C > 90 ? '-obtuse' : '')] = 1;
    T = polys(f)[0]; ok(!!f && T.length === (para ? 4 : 3) && Math.abs(angleAt(T[0], T[1], T[T.length - 1]) - C) <= 2 && labels(f).indexOf(l[0] + ' cm') >= 0 && labels(f).indexOf(l[1] + ' cm') >= 0 && labels(f).indexOf(C + '°') >= 0, where + '그림');
    if (para) ok(T[1][0] - T[0][0] === T[2][0] - T[3][0] && T[1][1] === T[0][1] && T[2][1] === T[3][1], where + '평행사변형 그림');
  });
  eq(Object.keys(kinds).sort().join(' '), '0tri 1para 2para-obtuse 2tri-obtuse', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'cos-used halved no-sine not-halved perimeter root-dropped tan-used', '실수의 종류');
  done('넓이');
})();
