/* B09 좌표평면과 정비례 · 반비례 — 단원 전용 검사.
   답을 만드는 코드와 따로, 화면에 보이는 것(문제 글 · 식 · 그림의 점과 그래프)만 읽어서 답을 다시 구해 견준다.
   계산은 tests/algcalc.js 의 계산기(BigInt 분수)로 한다. 엔진의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, Q = ALG.Q, calc = ALG.calc, noJosa = ALG.noJosa;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var right = function (p, raw) { return /^correct/.test(MH.judge(p, raw).verdict); };
  var B = function (n) { return Q(BigInt(n), 1n); };
  var same = function (a, b) { return a.n * b.d === b.n * a.d; };
  var sign = function (a) { return a.n === 0n ? 0 : (a.n > 0n) === (a.d > 0n) ? 1 : -1; };
  /** 식 'y = …' 에 x 를 넣은 값. 읽을 수 없거나 0 으로 나누면 null */
  var yAt = function (eq, x) { try { return calc(eq.split(' = ')[1], { x: B(x) }); } catch (e) { return null; } };
  /** 식이 점 (x, y) 를 지나는가. y 는 [분자, 분모] 로도 줄 수 있다 */
  var through = function (eq, x, y) { var v = yAt(eq, x); return !!v && same(v, Array.isArray(y) ? Q(BigInt(y[0]), BigInt(y[1])) : B(y)); };
  var pairs = function (t) { var re = /\((-?\d+),\\ (-?\d+|k)\)/g, m, out = []; while ((m = re.exec(t))) out.push([Number(m[1]), m[2] === 'k' ? 'k' : Number(m[2])]); return out; };
  var QUADS = ['제1사분면', '제2사분면', '제3사분면', '제4사분면'];
  var quadOf = function (sx, sy) { return sx > 0 && sy > 0 ? QUADS[0] : sx < 0 && sy > 0 ? QUADS[1] : sx < 0 && sy < 0 ? QUADS[2] : sx > 0 && sy < 0 ? QUADS[3] : null; };
  var labelled = function (fig, name) { return fig.points.filter(function (q) { return q.label === name; })[0]; };
  /** 그림이 그릴 수 있는 꼴인가: 점은 모눈 안의 정수 점, 표시된 점은 그래프 위에 있다 */
  var figOk = function (f) {
    if (!planeOk(f)) return false;
    return f.points.every(function (q) { return (!f.line || q.y * f.line[1] === q.x * f.line[0]) && (!f.curve || q.x * q.y === f.curve); });
  };
  var texts = function (id, p) { return MH.types[id].hints(p.v, p.ctx).concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.mistakesFor(p).map(function (m) { return m.explain; })); };
  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx), all = texts(id, p);
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    MH.mistakesFor(p).forEach(function (m) { ok(m.explain.length >= 25, where + '실수 설명이 짧음: ' + m.id); });
    if (p.seed <= 200) noJosa(all, where);
    /* 수식 끝의 숫자 바로 뒤에 오는 조사: 받침이 있는 숫자(0 1 3 6 7 8) 뒤에는 '은 · 이 · 을 · 과 · 이에요', 다만 ㄹ 받침(1 7 8) 뒤에는 '으로' 가 아니라 '로' */
    if (p.seed <= 300) all.forEach(function (t) {
      var re = /(\d)\$(이에요|예요|이라는|라는|은 |는 |이 |가 |을 |를 |과 |와 |으로 |로 )/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        ok((['이에요', '이라는', '은 ', '이 ', '을 ', '과 ', '으로 '].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
    });
  };
  var choiceOk = function (p, where) {
    var opts = MH.optionsOf(p);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i; }), where + '보기 4개가 서로 달라야 함: ' + opts.join(' | '));
    ok(opts.indexOf(p.answer) >= 0, where + '보기에 정답이 없음');
    ok(MH.mistakesFor(p).length === 3, where + '틀린 보기 셋에 모두 설명이 있어야 함');
    return opts;
  };
  var kindsSeen = function (seen, want, id) { eq(seen.map(function (s) { return Object.keys(s).sort().join(' '); }).join(' / '), want, id + ': 단계마다 나오는 문제 종류'); };

  group('B09 — 점의 좌표: 그림의 점과 답이 맞는가 (단계마다 1,000문제)');
  var seen = [{}, {}, {}], spots = {};
  each('B09.point', function (p, pr, level, where) {
    var k = p.v.q.k, fig = pr.figure, opts = choiceOk(p, where), P, ans, t;
    seen[level][k] = 1;
    ok(!!fig && figOk(fig), where + '그림 형식');
    if (k === 'read' || k === 'axis') {
      P = labelled(fig, 'P'); ans = pairs(p.answer)[0];
      ok(fig.points.length === 1 && !!ans && ans[0] === P.x && ans[1] === P.y, where + '그림의 점 P 와 답이 다름: ' + p.answer);
      ok(k === 'read' ? P.x !== 0 && P.y !== 0 : (P.x === 0) !== (P.y === 0), where + '점의 위치');
      spots[P.x + ',' + P.y] = 1;
    } else if (k === 'find') {
      t = pairs(pr.text)[0]; P = labelled(fig, p.answer);
      ok(fig.points.length === 4 && !!P && P.x === t[0] && P.y === t[1], where + '고른 점의 좌표가 문제와 다름');
      ok(fig.points.filter(function (q) { return q.x === t[0] && q.y === t[1]; }).length === 1, where + '같은 자리에 점이 둘');
      ok(fig.points.map(function (q) { return q.label; }).join('') === 'ABCD' && opts.join('') === 'ABCD', where + '점의 이름 순서');
    } else {
      t = pairs(pr.text)[0]; P = labelled(fig, 'P'); ans = pairs(p.answer)[0];
      var want = /\$x\$축에 대하여/.test(pr.text) ? [t[0], -t[1]] : /\$y\$축에 대하여/.test(pr.text) ? [-t[0], t[1]] : /원점에 대하여/.test(pr.text) ? [-t[0], -t[1]] : null;
      ok(P.x === t[0] && P.y === t[1], where + '그림의 점 P 가 문제 글과 다름');
      ok(!!want && ans[0] === want[0] && ans[1] === want[1], where + '대칭인 점: ' + pr.text + ' → ' + p.answer);
    }
    detailed('B09.point', p, where);
  });
  kindsSeen(seen, 'read / axis find / sym', 'B09.point');
  ok(Object.keys(spots).length >= 100, '점의 위치가 고루 나와야 함(' + Object.keys(spots).length + '곳)');
  done('점의 좌표');

  group('B09 — 사분면: 부호에 맞는 수를 넣어 본 결과와 답이 맞는가 (단계마다 1,000문제)');
  seen = [{}, {}, {}];
  var quadSeen = [{}, {}, {}];
  each('B09.quadrant', function (p, pr, level, where) {
    var k = p.v.q.k, opts = choiceOk(p, where), m, got;
    seen[level][k] = 1; quadSeen[level][p.answer] = 1;
    ok(opts.join(' ') === QUADS.join(' '), where + '보기는 늘 제1 ~ 제4사분면 순서');
    if (k === 'num') {
      m = pairs(pr.tex)[0];
      ok(quadOf(m[0], m[1]) === p.answer, where + pr.tex + ' → ' + p.answer);
    } else {
      /* 조건을 글에서 읽는다: 문자 두 개의 부호 */
      var L, s;
      if ((m = /^\$([a-z]) ([<>]) 0\$, \$([a-z]) ([<>]) 0\$일 때/.exec(pr.text))) { L = [m[1], m[3]]; s = [m[2] === '>' ? 1 : -1, m[4] === '>' ? 1 : -1]; }
      else if ((m = /^점 \$\(([a-z]),\\ ([a-z])\)\$가 (제\d사분면) 위의 점일 때/.exec(pr.text))) { L = [m[1], m[2]]; s = [[1, 1], [-1, 1], [-1, -1], [1, -1]][QUADS.indexOf(m[3])]; }
      ok(!!L, where + '조건을 읽을 수 없음: ' + pr.text);
      if (!L) return;
      var c = /^\((.+),\\ (.+)\)$/.exec(pr.tex);
      /* 크기를 여러 가지로 바꿔 넣어도 늘 같은 사분면이어야 한다(부호만으로 정해지는 문제여야 한다) */
      got = [[2, 3], [3, 2], [1, 7], [7, 1], [5, 5]].map(function (v) {
        var env = {}; env[L[0]] = B(s[0] * v[0]); env[L[1]] = B(s[1] * v[1]);
        return quadOf(sign(calc(c[1], env)), sign(calc(c[2], env)));
      });
      ok(got.every(function (g) { return g === p.answer; }), where + pr.text + ' ' + pr.tex + ' → ' + p.answer + ' (넣어 본 결과 ' + got.join(', ') + ')');
    }
    detailed('B09.quadrant', p, where);
  });
  kindsSeen(seen, 'num / sign / given', 'B09.quadrant');
  ok(quadSeen.every(function (s) { return Object.keys(s).length === 4; }), '단계마다 네 사분면이 모두 답으로 나와야 함');
  done('사분면');

  group('B09 — 정비례 · 반비례: 식에 넣어 본 값과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  [['B09.direct', 'val / coef / graph other', function (a) { return 'y = (' + a.n + ')x / (' + a.d + ')'; }],
    ['B09.inverse', 'val / coef / graph other', function (a) { return 'y = \\dfrac{' + a.n + '}{x}'; }]].forEach(function (row) {
    var id = row[0], direct = id === 'B09.direct', def = MH.types[id], fracs = 0, negs = 0;
    seen = [{}, {}, {}];
    each(id, function (p, pr, level, where) {
      var k = p.v.q.k, ans = direct ? p.answer : { n: p.answer.n, d: 1 }, A = Q(BigInt(ans.n), BigInt(ans.d)), m, pts, eqn, P;
      seen[level][k] = 1;
      if (ans.d !== 1) fracs++;
      if (ans.n < 0) negs++;
      ok(direct ? MH.gcd(ans.n, ans.d) === 1 && ans.d >= 1 : p.answer.p === 0, where + '답의 꼴');
      if (k === 'val') {
        m = /^\$([xy]) = (-?\d+)\$일 때, \$([xy])\$의 값을 구하세요\.$/.exec(pr.text);
        ok(!!m && m[1] !== m[3], where + '문제 글: ' + pr.text);
        /* 아는 값과 답을 식에 넣으면 참이어야 한다 */
        ok(ans.d === 1 && (m[1] === 'x' ? through(pr.tex, Number(m[2]), ans.n) : through(pr.tex, ans.n, Number(m[2]))), where + pr.tex + ', ' + pr.text + ' → ' + JSON.stringify(p.answer));
      } else if (k === 'coef' || k === 'graph') {
        if (k === 'graph') { P = labelled(pr.figure, 'P'); pts = [[P.x, P.y]]; ok(figOk(pr.figure) && !pr.tex && (direct ? !!pr.figure.line && !pr.figure.curve : !!pr.figure.curve && !pr.figure.line), where + '그림 형식'); }
        else { pts = pairs(pr.text); ok(pr.tex === (direct ? 'y = ax' : 'y = \\dfrac{a}{x}') && !pr.figure, where + '식'); }
        /* 답 a 를 넣은 식이 그 점을 지나야 한다. 그림이 있으면 그려진 그래프도 그 식이어야 한다 */
        eqn = direct ? null : row[2](ans);
        ok(pts.length === 1 && (direct ? same(Q(BigInt(pts[0][1]), BigInt(pts[0][0])), A) : through(eqn, pts[0][0], pts[0][1])), where + pr.text + ' → ' + JSON.stringify(p.answer));
        if (k === 'graph') ok(direct ? same(Q(BigInt(pr.figure.line[0]), BigInt(pr.figure.line[1])), A) : pr.figure.curve === ans.n, where + '그려진 그래프와 답이 다름');
      } else {
        pts = pairs(pr.text);
        ok(pts.length === 2 && pts[1][1] === 'k' && pts[0][0] !== pts[1][0], where + '문제 글: ' + pr.text);
        /* 정비례: y/x 가 같다 · 반비례: xy 가 같다 */
        ok(direct ? same(Q(BigInt(pts[0][1]), BigInt(pts[0][0])), Q(A.n, A.d * BigInt(pts[1][0]))) : pts[0][0] * pts[0][1] === pts[1][0] * ans.n, where + pr.text + ' → ' + JSON.stringify(p.answer));
      }
      /* 풀이의 마지막 줄은 답으로 끝난다 */
      var steps = def.steps(p.v), last = steps[steps.length - 1];
      ok(MH.kinds[def.answer.kind].equal(last.value, p.answer) && /= [^=]+$/.test(last.tex), where + '풀이의 마지막 줄');
      /* 판정: 정답은 맞고, 부호를 바꾼 답은 틀린다 */
      var kind = MH.kinds[def.answer.kind], raw = kind.raw(p.answer, def.answer), flipped = raw.charAt(0) === '-' ? raw.slice(1) : '-' + raw;
      if (p.seed <= 100) { ok(right(p, raw), where + '정답 판정 ' + raw); ok(!right(p, flipped), where + '부호가 반대인 답 ' + flipped); }
      detailed(id, p, where);
    });
    kindsSeen(seen, row[1], id);
    ok(negs >= 800 && negs <= 2200, id + ': 음수인 답 ' + negs + '개');
    ok(!direct || fracs >= 300, id + ': 분수인 답 ' + fracs + '개');
    done(def.title);
  });

  group('B09 — 그래프와 식: 정답만 상황 · 그래프에 맞는가 (단계마다 1,000문제)');
  /* 상황의 뜻을 여기서 따로 적는다: (글의 수 p, x) → y = [분자, 분모] */
  var STORIES = [
    [/^한 개에 (\d+)원인 지우개/, function (p, x) { return [p * x, 1]; }],
    [/^1분에 (\d+) L씩 물이 나오는/, function (p, x) { return [p * x, 1]; }],
    [/^시속 (\d+) km로 \$x\$시간/, function (p, x) { return [p * x, 1]; }],
    [/^1 m의 무게가 (\d+) g인/, function (p, x) { return [p * x, 1]; }],
    [/^넓이가 (\d+) cm²인 직사각형/, function (p, x) { return [p, x]; }],
    [/^(\d+) km 떨어진 곳까지 시속 \$x\$ km/, function (p, x) { return [p, x]; }],
    [/^사탕 (\d+)개를 \$x\$명이/, function (p, x) { return [p, x]; }],
    [/^(\d+) L들이 물통에 1분에 \$x\$ L씩/, function (p, x) { return [p, x]; }]
  ];
  seen = [{}, {}, {}];
  var storySeen = {}, ids = {};
  each('B09.graph', function (p, pr, level, where) {
    var k = p.v.q.k, opts = choiceOk(p, where), fits, good;
    seen[level][k] = 1;
    MH.mistakesFor(p).forEach(function (m) { ids[m.id] = 1; });
    if (k === 'story') {
      var hit = STORIES.map(function (s, i) { var m = s[0].exec(pr.text); return m ? [i, Number(m[1])] : null; }).filter(Boolean);
      ok(hit.length === 1 && !pr.figure, where + '상황을 알 수 없음: ' + pr.text);
      if (hit.length !== 1) return;
      storySeen[hit[0][0]] = 1;
      fits = function (o) { return [1, 2, 3, 4, 6].every(function (x) { return through(o, x, STORIES[hit[0][0]][1](hit[0][1], x)); }); };
    } else {
      var f = pr.figure, P = f && labelled(f, 'P');
      ok(!!f && figOk(f) && f.points.length === 1 && (k === 'line' ? !!f.line && !f.curve : !!f.curve && !f.line), where + '그림 형식');
      /* 그려진 그래프 위의 점 둘(표시된 점 P 와 다른 한 점)을 모두 지나야 한다 */
      fits = k === 'line' ? function (o) { return through(o, P.x, P.y) && through(o, f.line[1], f.line[0]) && through(o, 0, 0); }
        : function (o) { return through(o, P.x, P.y) && through(o, 1, f.curve) && through(o, -2, [f.curve, -2]); };
    }
    good = opts.filter(fits);
    ok(good.length === 1 && good[0] === p.answer, where + pr.text + ' → ' + p.answer + ' (맞는 보기: ' + good.join(' | ') + ')');
    var steps = MH.types['B09.graph'].steps(p.v);
    ok(steps[steps.length - 1].tex === p.answer, where + '풀이의 마지막 줄은 정답 식');
    detailed('B09.graph', p, where);
  });
  kindsSeen(seen, 'story / line / curve', 'B09.graph');
  eq(Object.keys(storySeen).length, STORIES.length, '상황 여덟 가지가 모두 나와야 함');
  eq(Object.keys(ids).sort().join(' '), 'added as-direct as-inverse flipped sign sum y-only', '틀린 보기의 실수 종류');
  done('그래프와 식');

  group('B09 — 흔한 실수와 풀이 · 힌트의 구체적인 예');
  var find = function (id, level, test) { for (var seed = 1; seed <= 3000; seed++) { var p = MH.makeProblem(id, level, seed); if (test(p, MH.types[id].prompt(p.v, p.ctx))) return p; } return null; };
  var wrongOf = function (p, id) { var m = MH.mistakesFor(p).filter(function (x) { return x.id === id; })[0]; return m ? m.value : null; };
  var p1 = find('B09.point', 0, function (p, pr) { var P = pr.figure.points[0]; return P.x === -2 && P.y === 3; });
  ok(!!p1 && p1.answer === '(-2,\\ 3)' && wrongOf(p1, 'swapped') === '(3,\\ -2)' && wrongOf(p1, 'x-sign') === '(2,\\ 3)' && wrongOf(p1, 'y-sign') === '(-2,\\ -3)', '점 (−2, 3) 읽기와 틀린 보기');
  var p2 = find('B09.point', 2, function (p, pr) { return /\(4,\\ -1\)\$과 원점에 대하여/.test(pr.text); });
  ok(!!p2 && p2.answer === '(-4,\\ 1)' && wrongOf(p2, 'sym-x') === '(4,\\ 1)' && wrongOf(p2, 'sym-y') === '(-4,\\ -1)', '(4, −1) 의 원점 대칭');
  var p3 = find('B09.quadrant', 0, function (p, pr) { return pr.tex === '(-3,\\ 5)'; });
  ok(!!p3 && p3.answer === '제2사분면' && wrongOf(p3, 'x-sign') === '제1사분면' && wrongOf(p3, 'y-sign') === '제3사분면' && wrongOf(p3, 'both-sign') === '제4사분면', '(−3, 5) 는 제2사분면');
  var p4 = find('B09.quadrant', 2, function (p, pr) { return /제2사분면 위의 점일 때/.test(pr.text) && /^\([a-z]{2},\\ [a-z] - [a-z]\)$/.test(pr.tex) && pr.tex.charAt(4) !== pr.tex.charAt(6); });
  ok(!!p4, '곱과 차로 된 점의 예');
  var p5 = find('B09.direct', 1, function (p, pr) { return /\(4,\\ -6\)/.test(pr.text); });
  ok(!!p5 && p5.answer.n === -3 && p5.answer.d === 2 && right(p5, '-6,4') && !!MH.judge(p5, '-6,4').note && !right(p5, '-2,3'), '(4, −6) 을 지나는 정비례: a = −3/2, 약분 안 한 답은 알려 주기');
  ok(!!p5 && /flipped/.test(MH.judge(p5, '-2,3').mistake ? MH.judge(p5, '-2,3').mistake.id : JSON.stringify(MH.judge(p5, '-2,3'))), '분자 · 분모를 바꾼 답의 실수 설명');
  var p6 = find('B09.inverse', 1, function (p, pr) { return /\(-3,\\ 4\)/.test(pr.text); });
  ok(!!p6 && p6.answer.n === -12 && right(p6, '-12') && !right(p6, '12'), '(−3, 4) 를 지나는 반비례: a = −12');
  var p7 = find('B09.inverse', 2, function (p, pr) { return /\(2,\\ 6\)\$, \$\(-4,\\ k\)/.test(pr.text); });
  ok(!!p7 && p7.answer.n === -3 && wrongOf(p7, 'as-direct') && wrongOf(p7, 'as-direct').n === -12 && wrongOf(p7, 'a-only').n === 12, '(2, 6), (−4, k): k = −3');
  var p8 = find('B09.graph', 0, function (p, pr) { return /^사탕 24개/.test(pr.text); });
  ok(!!p8 && p8.answer === 'y = \\dfrac{24}{x}' && wrongOf(p8, 'as-direct') === 'y = 24x' && wrongOf(p8, 'added') === 'y = x + 24' && wrongOf(p8, 'flipped') === 'y = \\dfrac{x}{24}', '사탕 24개 나누기는 반비례');
  var p9 = find('B09.graph', 1, function (p, pr) { var P = pr.figure.points[0]; return P.x === 2 && P.y === -3; });
  ok(!!p9 && p9.answer === 'y = -\\dfrac{3}{2}x' && wrongOf(p9, 'flipped') === 'y = -\\dfrac{2}{3}x' && wrongOf(p9, 'sign') === 'y = \\dfrac{3}{2}x' && wrongOf(p9, 'as-inverse') === 'y = -\\dfrac{6}{x}', '점 (2, −3) 을 지나는 직선');
  var p10 = find('B09.graph', 2, function (p, pr) { var P = pr.figure.points[0]; return P.x === -2 && P.y === 3; });
  ok(!!p10 && p10.answer === 'y = -\\dfrac{6}{x}' && wrongOf(p10, 'sign') === 'y = \\dfrac{6}{x}' && wrongOf(p10, 'as-direct') === 'y = -\\dfrac{3}{2}x', '점 (−2, 3) 을 지나는 곡선');
  done('실수 · 풀이 · 힌트 예');
})();
