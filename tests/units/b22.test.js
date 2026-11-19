/* B22 이차함수와 그래프 — 단원 전용 검사.
   화면에 보이는 식(문제 · 보기 · 풀이의 줄)을 tests/algcalc.js 의 계산기(BigInt 분수)로 읽어 x 에 수를 넣은 값으로 견준다.
   꼭짓점은 식의 모양을 읽지 않고 성질로 확인한다: 점 (p, q) 가 꼭짓점이면 f(p − 1) = f(p + 1) 이고 f(p) = q 이다.
   평행이동한 식은 처음 식의 x 자리에 x − p 를 넣고 q 를 더한 식과 값이 같아야 하고, 고친 식은 처음 식과 값이 같아야 한다.
   그림 문제는 그림의 포물선 · 점과 답의 식이 서로 맞는지 본다. 틀린 보기는 그 조건을 채우지 못해야 한다. 단원 파일의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, sig = ALG.sig, noJosa = ALG.noJosa, Q = ALG.Q;
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
        if (/\}\}\$?$/.test(t.slice(0, m.index + 3)) || /\^\{\d+$/.test(t.slice(0, m.index + 1)) || /\d\)\^\{2\}\$$/.test(t.slice(0, m.index + 7))) continue;   /* 지수 뒤는 '제곱' 으로 읽는다 */
        ok((['이에요', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
      ok(t.split('$').length % 2 === 1 && !/undefined|NaN|null|object/.test(t) && !/ $/.test(t) && !/\^\{2\}\$ [을은의이에과]/.test(t), where + '글: ' + t);
    });
  };
  /* ── 식 읽기 ── */
  var rhs = function (tex) { return tex.slice(0, 4) === 'y = ' ? tex.slice(4) : null; };
  /** 식 y = … 에 x = k 를 넣은 값('분자/분모'). 읽을 수 없으면 null */
  var at = function (tex, k) { var r = rhs(tex), v; if (r === null) return null; try { v = ALG.calc(r, { x: Q(BigInt(k), 1n) }); return v.n + '/' + v.d; } catch (e) { return null; } };
  var I = function (n) { return n + '/1'; };
  var same = function (a, b) { var x = sig(rhs(a) || '?'), y = sig(rhs(b) || '?'); return !!x && x === y; };
  /** 절댓값 비교: |a| − |b| 의 부호 */
  var absCmp = function (a, b) { var f = function (s) { var t = s.split('/'), n = BigInt(t[0]); return [n < 0n ? -n : n, BigInt(t[1])]; }, x = f(a), y = f(b), d = x[0] * y[1] - y[0] * x[1]; return d > 0n ? 1 : d < 0n ? -1 : 0; };
  var ptOf = function (s) { var m = /^\((-?\d+),\\ (-?\d+)\)$/.exec(s); return m ? [Number(m[1]), Number(m[2])] : null; };
  /** 점 (p, q) 가 식의 그래프의 꼭짓점인가 */
  var isVertex = function (tex, pt) { return !!pt && at(tex, pt[0]) === I(pt[1]) && at(tex, pt[0] - 1) !== null && at(tex, pt[0] - 1) === at(tex, pt[0] + 1); };
  var STD = /^y = (-|-?\d+|-?\\dfrac\{\d+\}\{\d+\})?(x\^\{2\}|\(x [+-] \d+\)\^\{2\})( [+-] \d+)?$/;
  var GEN = /^y = -?\d*x\^\{2\} [+-] \d*x [+-] \d+$/;
  var AX2 = /^y = (-|-?\d+|-?\\dfrac\{\d+\}\{\d+\})?x\^\{2\}$/;

  /** 보기 고르기 문제의 공통 검사 */
  var choiceChecks = function (id, p, pr, where, bag) {
    var opts = MH.optionsOf(p), ms = MH.mistakesFor(p), steps = MH.types[id].steps(p.v);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && ms.length === 3, where + '보기: ' + opts.join(' | '));
    ms.forEach(function (x) { bag[x.id] = 1; });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed(id, p, where);
    ok(steps.length >= 2 && (/[가-힣]/.test(p.answer) || steps[steps.length - 1].tex === p.answer), where + '풀이의 마지막 줄은 답');   /* 답이 글인 보기는 수식 줄로 쓸 수 없다 */
    if (pr.figure) ok(pr.figure.type === 'plane' && planeOk(pr.figure) && !!pr.figure.parab, where + '그림 형식');
    return ms;
  };
  /** 키패드 문제의 공통 검사 */
  var numChecks = function (id, p, where, bag) {
    var def = MH.types[id], kind = MH.kinds.signed, ans = p.answer.n, ms = MH.mistakesFor(p);
    ok(p.answer.p === 0 && Number.isInteger(ans) && ans !== 0, where + '답은 0 이 아닌 정수');
    ms.forEach(function (x) { bag[x.id] = 1; ok(x.value.p === 0 && Number.isInteger(x.value.n) && x.value.n !== ans, where + '실수 값: ' + x.id); });
    ok(ms.length >= 2, where + '실수가 둘은 있어야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    detailed(id, p, where);
    return ans;
  };

  group('B22 — 검사 도구 자체 검사');
  ok(at('y = 2(x - 1)^{2} + 3', 3) === '11/1' && at('y = -\\dfrac{1}{2}x^{2}', 3) === '-9/2' && at('y = -(x + 3)^{2} - 1', -2) === '-2/1' && at('y = -x^{2} + 4x - 6', 2) === '-2/1' && at('x = 3', 1) === null, '식에 수 넣기');
  ok(same('y = 2(x - 1)^{2} + 3', 'y = 2x^{2} - 4x + 5') && !same('y = 2(x + 1)^{2} + 3', 'y = 2x^{2} - 4x + 5') && same('y = -(x - 2)^{2} - 2', 'y = -x^{2} + 4x - 6'), '같은 식');
  ok(isVertex('y = 2x^{2} - 4x + 5', [1, 3]) && !isVertex('y = 2x^{2} - 4x + 5', [-1, 3]) && !isVertex('y = 2x^{2} - 4x + 5', [1, 5]) && isVertex('y = -\\dfrac{1}{2}(x + 3)^{2} + 2', [-3, 2]), '꼭짓점');
  ok(absCmp('-3/1', '1/2') === 1 && absCmp('1/3', '-1/2') === -1 && absCmp('-2/1', '2/1') === 0, '절댓값 비교');
  ok(STD.test('y = -\\dfrac{1}{2}(x + 3)^{2} - 4') && STD.test('y = x^{2} + 7') && STD.test('y = -(x - 5)^{2}') && !STD.test('y = 2x^{2} - 4x + 5') && GEN.test('y = -x^{2} + 4x - 6') && !GEN.test('y = (x - 2)^{2}'), '식의 꼴');
  done('도구');

  group('B22 — 이차함수의 함숫값 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B22.value', function (p, pr, level, where) {
    var ans = numChecks('B22.value', p, where, bag), steps = MH.types['B22.value'].steps(p.v), m, want, k;
    if (pr.tex === 'y = ax^{2}') {
      k = 'find'; m = /^위 이차함수의 그래프가 점 \$\((-?\d+),\\ (-?\d+)\)\$[을를] 지날 때, 상수 \$a\$의 값을 구하세요\.$/.exec(pr.text);
      ok(!!m, where + '문제의 글: ' + pr.text); if (!m) return;
      want = Number(m[2]) / (Number(m[1]) * Number(m[1])); ok(at('y = ' + ans + 'x^{2}', Number(m[1])) === I(Number(m[2])), where + '구한 a 로 점을 지나야 함');
      ok(steps[steps.length - 1].tex === 'a = ' + ans, where + '풀이의 마지막 줄');
    } else {
      m = /^위 이차함수에서 \$x = (-?\d+)\$일 때, \$y\$의 값을 구하세요\.$/.exec(pr.text);
      ok(!!m && (AX2.test(pr.tex) || GEN.test(pr.tex)), where + '문제: ' + pr.tex + ' / ' + pr.text); if (!m) return;
      k = GEN.test(pr.tex) ? 'gen' : 'ax2'; want = Number(at(pr.tex, Number(m[1])).split('/')[0]);
      ok(at(pr.tex, Number(m[1])) === I(ans), where + '답: ' + pr.tex);
      steps.forEach(function (st) { ok(at(st.tex, 0) === I(ans), where + '풀이의 줄의 값이 답과 다름: ' + st.tex); });
    }
    kinds[level + k] = 1;
    eq(ans, want, where + '답: ' + pr.tex + ' / ' + pr.text);
  });
  eq(Object.keys(kinds).sort().join(' '), '0ax2 1gen 2find', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'coef-squared const-lost doubled mid-sign multiplied not-squared square-sign x-squared y-copied', '실수의 종류');
  done('함숫값');

  group('B22 — y = ax² 의 그래프 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B22.basic', function (p, pr, level, where) {
    var ms = choiceChecks('B22.basic', p, pr, where, bag), t = pr.text, a1, k, f, pt, m, cmp;
    if (t === '위 이차함수의 그래프의 모양으로 옳은 것을 고르세요.') {
      k = 'dir'; a1 = at(pr.tex, 1); ok(AX2.test(pr.tex) && !!a1, where + '문제의 식: ' + pr.tex);
      eq(p.answer, (a1.charAt(0) === '-' ? '위로 볼록' : '아래로 볼록') + '하고 원점을 지나요', where + '방향: ' + pr.tex);
      ok(at(pr.tex, 0) === '0/1' && ms.every(function (x) { return /^(위로|아래로) 볼록하고 원점을 (지나요|지나지 않아요)$/.test(x.value); }), where + '보기의 꼴');
    } else if ((m = /^위 이차함수의 그래프보다 폭이 (좁은|넓은) 그래프의 식을 고르세요\.$/.exec(t))) {
      k = m[1] === '좁은' ? 'narrow' : 'wide'; cmp = m[1] === '좁은' ? 1 : -1; a1 = at(pr.tex, 1);
      ok(AX2.test(pr.tex) && AX2.test(p.answer) && absCmp(at(p.answer, 1), a1) === cmp, where + '폭: ' + pr.tex + ' → ' + p.answer);
      ms.forEach(function (x) { ok(AX2.test(x.value) && absCmp(at(x.value, 1), a1) !== cmp, where + '틀린 보기가 조건에 맞음: ' + x.value); });
    } else if ((m = /^그림의 포물선은 꼭짓점이 원점이고 점 \$\((-?\d+),\\ (-?\d+)\)\$[을를] 지나요\. 이 그래프의 식을 고르세요\.$/.exec(t))) {
      k = 'fig'; f = pr.figure; pt = [Number(m[1]), Number(m[2])];
      ok(!pr.tex && !!f && f.parab[2] === 0 && f.parab[3] === 0 && f.points.length === 1 && f.points[0].x === pt[0] && f.points[0].y === pt[1] && pt[0] !== 0 && f.parab[1] * pt[1] === f.parab[0] * pt[0] * pt[0], where + '그림의 점이 포물선 위에 있어야 함');
      ok(AX2.test(p.answer) && at(p.answer, pt[0]) === I(pt[1]), where + '답의 그래프가 점을 지나야 함: ' + p.answer);
      ms.forEach(function (x) { ok(AX2.test(x.value) && at(x.value, pt[0]) !== I(pt[1]), where + '틀린 보기가 점을 지남: ' + x.value); });
    } else if (t === '위 이차함수의 그래프와 $x$축에 대하여 대칭인 그래프의 식을 고르세요.') {
      k = 'sym'; ok(AX2.test(pr.tex) && AX2.test(p.answer) && same(p.answer, 'y = -(' + rhs(pr.tex) + ')'), where + '대칭: ' + pr.tex + ' → ' + p.answer);
      ms.forEach(function (x) { ok(!!rhs(x.value) && !!sig(rhs(x.value)) && !same(x.value, p.answer), where + '틀린 보기가 답과 같은 식: ' + x.value); });
    } else if (t === '위 이차함수의 그래프가 지나는 점을 고르세요.') {
      k = 'point'; pt = ptOf(p.answer); ok(AX2.test(pr.tex) && !!pt && at(pr.tex, pt[0]) === I(pt[1]), where + '답이 그래프 위의 점이어야 함: ' + pr.tex + ' → ' + p.answer);
      ms.forEach(function (x) { var w = ptOf(x.value); ok(!!w && at(pr.tex, w[0]) !== I(w[1]), where + '틀린 보기가 그래프 위의 점: ' + x.value); });
    } else { ok(false, where + '문제의 글: ' + t); return; }
    kinds[level + k] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0dir 0narrow 0wide 1fig 2point 2sym', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'both-signs both-wrong direction doubled inverted linear linear-same narrower narrower-flipped neg-inverted no-origin not-squared same-width sign swapped unchanged wider wider-flipped y-as-coef', '실수의 종류');
  done('y = ax²');

  group('B22 — 그래프의 평행이동 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B22.shift', function (p, pr, level, where) {
    var ms = choiceChecks('B22.shift', p, pr, where, bag), t = pr.text, mx = /\$x\$축의 방향으로 \$(-?\d+)\$만큼/.exec(t), my = /\$y\$축의 방향으로 \$(-?\d+)\$만큼/.exec(t), px = mx ? Number(mx[1]) : 0, qy = my ? Number(my[1]) : 0, want;
    ok(AX2.test(pr.tex) && /^위 이차함수의 그래프를 .*만큼 평행이동한 그래프의 식을 고르세요\.$/.test(t) && (!!mx || !!my) && (!mx || px !== 0) && (!my || qy !== 0), where + '문제: ' + pr.tex + ' / ' + t);
    /* 처음 식의 x 자리에 x − p 를 넣고 q 를 더한다 */
    want = 'y = ' + rhs(pr.tex).replace('x^{2}', '(x - (' + px + '))^{2}') + ' + (' + qy + ')';
    ok(STD.test(p.answer) && same(p.answer, want), where + '평행이동한 식: ' + pr.tex + ' → ' + p.answer);
    ok(isVertex(p.answer, [px, qy]) && at(p.answer, px + 1) === at(pr.tex + ' + (' + qy + ')', 1), where + '꼭짓점이 (p, q) 로 옮겨 가고 폭은 그대로');
    ms.forEach(function (x) { ok(!!rhs(x.value) && !!sig(rhs(x.value)) && !same(x.value, p.answer), where + '틀린 보기가 답과 같은 식: ' + x.value); });
    kinds[level + (mx ? 'x' : '') + (my ? 'y' : '')] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0y 1x 2xy', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'both-signs bracket-plus coef-added into-bracket outside outside-sign swapped x-sign y-sign', '실수의 종류');
  done('평행이동');

  group('B22 — 꼭짓점과 축 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B22.vertex', function (p, pr, level, where) {
    var ms = choiceChecks('B22.vertex', p, pr, where, bag), t = pr.text, k, m, f, v, q1, good;
    if (t === '위 이차함수의 그래프의 꼭짓점의 좌표를 고르세요.') {
      v = ptOf(p.answer); ok(STD.test(pr.tex) && isVertex(pr.tex, v), where + '꼭짓점: ' + pr.tex + ' → ' + p.answer); if (!v) return;
      ms.forEach(function (x) { ok(!!ptOf(x.value) && !isVertex(pr.tex, ptOf(x.value)), where + '틀린 보기가 꼭짓점: ' + x.value); });
      k = v[0] !== 0 && v[1] !== 0 ? 'both' : v[0] === 0 ? 'one-q' : 'one-p'; ok(v[0] !== 0 || v[1] !== 0, where + '꼭짓점이 원점이면 안 됨');
    } else if (t === '위 이차함수의 그래프의 축의 방정식을 고르세요.') {
      k = 'axis'; m = /^x = (-?\d+)$/.exec(p.answer);
      ok(STD.test(pr.tex) && !!m && at(pr.tex, Number(m[1]) - 1) === at(pr.tex, Number(m[1]) + 1), where + '축: ' + pr.tex + ' → ' + p.answer);
      ms.forEach(function (x) { var w = /^([xy]) = (-?\d+)$/.exec(x.value); ok(!!w && (w[1] === 'y' || at(pr.tex, Number(w[2]) - 1) !== at(pr.tex, Number(w[2]) + 1)), where + '틀린 보기가 축: ' + x.value); });
    } else if ((m = /^그림의 포물선은 꼭짓점이 점 \$\((-?\d+),\\ (-?\d+)\)\$이고 점 \$\((-?\d+),\\ (-?\d+)\)\$[을를] 지나요\. 이 그래프의 식을 고르세요\.$/.exec(t))) {
      k = 'fig'; f = pr.figure; v = [Number(m[1]), Number(m[2])]; q1 = [Number(m[3]), Number(m[4])];
      ok(!pr.tex && !!f && f.parab[2] === v[0] && f.parab[3] === v[1] && f.points.length === 2 && f.points[0].x === v[0] && f.points[0].y === v[1] && f.points[1].x === q1[0] && f.points[1].y === q1[1] && q1[0] !== v[0]
        && f.parab[1] * (q1[1] - v[1]) === f.parab[0] * (q1[0] - v[0]) * (q1[0] - v[0]), where + '그림의 꼭짓점과 점이 포물선과 맞아야 함');
      good = function (tex) { return isVertex(tex, v) && at(tex, q1[0]) === I(q1[1]); };
      ok(STD.test(p.answer) && good(p.answer), where + '답의 그래프: ' + p.answer);
      ms.forEach(function (x) { ok(STD.test(x.value) && !good(x.value), where + '틀린 보기가 그림과 맞음: ' + x.value); });
    } else { ok(false, where + '문제의 글: ' + t); return; }
    kinds[level + k] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0one-p 0one-q 1both 2axis 2fig', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'axis-letter both-signs direction sign swapped swapped-sign vertex-y x-sign y-sign', '실수의 종류');
  done('꼭짓점과 축');

  group('B22 — 일반형을 표준형으로 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B22.standard', function (p, pr, level, where) {
    var ms = choiceChecks('B22.standard', p, pr, where, bag), t = pr.text, steps = MH.types['B22.standard'].steps(p.v), lead = at(pr.tex, 1) && at(pr.tex, 0) && at(pr.tex, -1), k;
    ok(GEN.test(pr.tex) && !!lead, where + '문제는 일반형: ' + pr.tex);
    steps.forEach(function (st) { if (st.tex.slice(0, 4) === 'y = ') ok(same(st.tex, pr.tex), where + '풀이의 줄이 처음 식과 다름: ' + st.tex); });
    ok(steps.filter(function (st) { return st.tex.slice(0, 4) === 'y = '; }).length >= 3, where + '풀이에 식을 고치는 줄이 셋은 있어야 함');
    if (t === '위 이차함수의 식을 $y = a(x - p)^{2} + q$ 꼴로 고친 것을 고르세요.') {
      k = 'form'; ok(STD.test(p.answer) && /\(/.test(p.answer) && same(p.answer, pr.tex), where + '고친 식: ' + pr.tex + ' → ' + p.answer);
      ms.forEach(function (x) { ok(STD.test(x.value) && !same(x.value, pr.tex), where + '틀린 보기가 같은 식: ' + x.value); });
      ok((/^y = x\^/.test(pr.tex)) === (level === 0), where + '단계에 맞는 식: ' + pr.tex);
    } else if (t === '위 이차함수의 그래프의 꼭짓점의 좌표를 고르세요.') {
      k = 'vertex'; ok(isVertex(pr.tex, ptOf(p.answer)), where + '꼭짓점: ' + pr.tex + ' → ' + p.answer);
      ms.forEach(function (x) { ok(!!ptOf(x.value) && !isVertex(pr.tex, ptOf(x.value)), where + '틀린 보기가 꼭짓점: ' + x.value); });
    } else { ok(false, where + '문제의 글: ' + t); return; }
    kinds[level + k] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0form 1form 2vertex', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'a-lost a-not-multiplied added coef-read const-kept not-halved swapped x-sign', '실수의 종류');
  done('표준형');

  group('B22 — 그래프에서 값 구하기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B22.read', function (p, pr, level, where) {
    var ans = numChecks('B22.read', p, where, bag), t = pr.text, steps = MH.types['B22.read'].steps(p.v), m, k, want, x0, hit = [], base;
    if (t === '위 이차함수의 그래프가 $y$축과 만나는 점의 $y$좌표를 구하세요.') {
      k = GEN.test(pr.tex) ? 'yint-gen' : 'yint-std'; ok(GEN.test(pr.tex) || (STD.test(pr.tex) && /\(/.test(pr.tex)), where + '문제의 식: ' + pr.tex);
      want = at(pr.tex, 0);
      steps.forEach(function (st) { st.tex.slice(4).split(' = ').forEach(function (part) { ok(at('y = ' + part, 0) === I(ans), where + '풀이의 줄의 값이 답과 다름: ' + st.tex); }); });
    } else if ((m = /^위 이차함수의 그래프가 점 \$\((-?\d+),\\ (-?\d+)\)\$[을를] 지날 때, 상수 \$q\$의 값을 구하세요\.$/.exec(t))) {
      k = 'pass'; ok(/ \+ q$/.test(pr.tex) && STD.test(pr.tex.replace(/ \+ q$/, '')), where + '문제의 식: ' + pr.tex);
      base = at(pr.tex.replace(/ \+ q$/, ''), Number(m[1])); want = I(Number(m[2]) - Number(base.split('/')[0]));
      ok(at(pr.tex.replace(/ \+ q$/, ' + (' + ans + ')'), Number(m[1])) === I(Number(m[2])), where + '구한 q 로 점을 지나야 함');
    } else if (t === '위 이차함수의 그래프의 꼭짓점의 $y$좌표를 구하세요.') {
      k = 'vy'; ok(GEN.test(pr.tex), where + '문제의 식: ' + pr.tex);
      for (x0 = -30; x0 <= 30; x0++) if (at(pr.tex, x0 - 1) === at(pr.tex, x0 + 1)) hit.push(x0);
      ok(hit.length === 1, where + '꼭짓점의 x좌표는 정수 하나'); want = at(pr.tex, hit[0]);
      ok(steps.some(function (st) { return STD.test(st.tex) && same(st.tex, pr.tex); }), where + '풀이에 고친 식이 있어야 함');
    } else { ok(false, where + '문제의 글: ' + t); return; }
    kinds[level + k] = 1;
    eq(I(ans), want, where + '답: ' + pr.tex + ' / ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0yint-gen 0yint-std 1pass 2vy', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'a-not-multiplied added bracket-sign const-kept lead not-squared one-plugged square-sign vertex-x vertex-y x-coef y-copied', '실수의 종류');
  done('값 구하기');
})();
