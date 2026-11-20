/* B28 대푯값과 산포도 — 단원 전용 검사.
   문제 글에서 자료 [ … ] 와 조건(평균 · 중앙값 · 편차 …)을 읽고, 단원 파일의 계산과 무관하게 답을 다시 구해 견준다.
   평균 · 중앙값 · 최빈값 · 분산은 여기서 따로 만든 함수로 계산한다. 모르는 값 x 를 구하는 문제는 답을 자료에 넣어 조건이 맞는지,
   답이 하나뿐인지 본다. 보기 문제는 보기의 값(수 · 분수 · 근호)이나 문장의 참 · 거짓을 읽어, 답만 맞고 틀린 보기는 모두 틀린지 본다. */
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

  var near = function (x, y) { return typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y) && Math.abs(x - y) <= 1e-9; };
  /* ── 공통 검사 ── */
  var valOf = function (kn, v) { return kn === 'int' ? v : v.n / Math.pow(10, v.p); };
  /** 키패드 문제(자연수 · 소수 · 부호가 있는 정수). 답의 값을 돌려준다 */
  var keyChecks = function (id, p, pr, where, bag) {
    var def = MH.types[id], kn = def.answer.kind, kind = MH.kinds[kn], a = valOf(kn, p.answer), ms = MH.mistakesFor(p), steps = def.steps(p.v);
    if (kn === 'int') ok(Number.isInteger(a) && a >= 1, where + '답은 자연수');
    else if (kn === 'decimal') ok(p.answer.n >= 1 && (p.answer.p === 0 || (p.answer.p === 1 && p.answer.n % 10 === 5)), where + '답은 자연수이거나 ○.5 꼴');
    else ok(p.answer.p === 0 && Number.isInteger(p.answer.n), where + '답은 정수');
    ms.forEach(function (x) { bag[x.id] = 1; ok(kn === 'int' ? Number.isInteger(x.value) && x.value >= 0 : kind.valid(x.value), where + '실수 값의 형식: ' + x.id); ok(valOf(kn, x.value) !== a, where + '실수 값이 정답과 같음: ' + x.id); });
    ok(ms.length >= 2 && ms.every(function (x, i) { return ms.every(function (y, j) { return i === j || valOf(kn, x.value) !== valOf(kn, y.value); }); }), where + '실수가 둘은 있고 값이 서로 달라야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    ok(steps.length >= 2 && !pr.figure && !pr.tex, where + '풀이 줄 수');
    detailed(id, p, where);
    return a;
  };
  /** 보기 문제 */
  var pickChecks = function (id, p, pr, where, bag) {
    var opts = MH.optionsOf(p), ms = MH.mistakesFor(p), steps = MH.types[id].steps(p.v);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && ms.length === 3, where + '보기: ' + opts.join(' | '));
    ms.forEach(function (x) { bag[x.id] = 1; ok(opts.indexOf(x.value) >= 0 && x.value !== p.answer, where + '틀린 보기: ' + x.value); });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    ok(steps.length >= 2 && !pr.figure && !pr.tex, where + '풀이 줄 수');
    detailed(id, p, where);
    return opts;
  };

  /* ── 문제 글 읽기와 다시 계산하기(단원 파일과 무관하게 만든 것) ── */
  /** 글 안의 [ … ] 목록. 수는 수로, 모르는 값은 'x' 로 */
  var listOf = function (t) {
    var m = /\[ (.*?) \]/.exec(t); if (!m) return null;
    return m[1].split(', ').map(function (s) { s = s.replace(/\$/g, ''); return s === 'x' ? 'x' : /^-?\d+$/.test(s) ? Number(s) : NaN; });
  };
  var total = function (a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return s; };
  var avg = function (a) { return total(a) / a.length; };
  var sorted = function (a) { var b = a.slice(), i, j, t; for (i = 0; i < b.length; i++) for (j = i + 1; j < b.length; j++) if (b[j] < b[i]) { t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
  var middle = function (a) { var b = sorted(a), n = b.length; return n % 2 === 1 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
  /** 가장 여러 번 나온 것들(나온 차례대로) */
  var mostOf = function (keys, counts) { var mx = -1, out = [], i; for (i = 0; i < keys.length; i++) if (counts[i] > mx) mx = counts[i]; for (i = 0; i < keys.length; i++) if (counts[i] === mx) out.push(keys[i]); return out; };
  var modesOf = function (a) { var ks = [], cs = [], i, k; for (i = 0; i < a.length; i++) { k = ks.indexOf(a[i]); if (k < 0) { ks.push(a[i]); cs.push(1); } else cs[k]++; } return sorted(mostOf(ks, cs)); };
  var sqSum = function (a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i] * a[i]; return s; };
  var varOf = function (a) { var m = avg(a), s = 0, i; for (i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return s / a.length; };
  var fill = function (a, x) { return a.map(function (v) { return v === 'x' ? x : v; }); };
  var rest = function (a) { return a.filter(function (v) { return v !== 'x'; }); };
  var oneX = function (a) { return !!a && a.filter(function (v) { return v === 'x'; }).length === 1 && rest(a).every(function (v) { return Number.isInteger(v); }); };
  var allNum = function (a) { return !!a && a.length >= 4 && a.every(function (v) { return Number.isInteger(v); }); };
  var UNIT = '(회|권|시간|점)';
  /** 보기의 값 읽기: 수 · 분수 · k√r */
  var texVal = function (s) {
    var m;
    if (/^\d+$/.test(s)) return Number(s);
    if ((m = /^\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(s))) return m[1] / m[2];
    if ((m = /^(\d*)\\sqrt\{(\d+)\}$/.exec(s))) return (m[1] === '' ? 1 : Number(m[1])) * Math.sqrt(Number(m[2]));
    return null;
  };

  group('B28 — 검사 도구 자체 검사');
  eq(listOf('가 [ 3, $x$, $-2$, 10 ] 나').join('|'), '3|x|-2|10', '목록 읽기');
  ok(middle([5, 1, 9]) === 5 && middle([4, 1, 9, 6]) === 5 && middle([7, 8]) === 7.5, '중앙값');
  eq(modesOf([3, 5, 3, 5, 1]).join(','), '3,5', '최빈값 둘'); eq(modesOf([2, 9, 9, 2, 9]).join(','), '9', '최빈값 하나');
  ok(varOf([2, 5, 6, 7, 10]) === 6.8 && varOf([4, 5, 6, 7, 8]) === 2 && avg([1, 3, 6, 9, 11]) === 6 && varOf([1, 3, 6, 9, 11]) === 13.6, '분산');
  ok(texVal('12') === 12 && texVal('\\dfrac{7}{2}') === 3.5 && near(texVal('2\\sqrt{3}'), Math.sqrt(12)) && near(texVal('\\sqrt{10}'), Math.sqrt(10)) && texVal('x') === null, '보기의 값 읽기');
  done('도구');

  var bag, kinds;

  group('B28 — 평균 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B28.mean', function (p, pr, level, where) {
    var t = pr.text, a = keyChecks('B28.mean', p, pr, where, bag), d = listOf(t), m, k, want;
    if (level === 0) { k = 'basic'; ok(allNum(d) && / 이 자료의 평균을 구하세요\.$/.test(t), where + '문제 글: ' + t); want = avg(d); }
    else if (level === 1) { k = 'missing'; m = new RegExp('이 자료의 평균이 (\\d+)' + UNIT + '일 때, \\$x\\$의 값을 구하세요\\.$').exec(t); ok(!!m && oneX(d), where + '문제 글: ' + t); want = m[1] * d.length - total(rest(d)); }
    else if ((m = new RegExp('^(?:학생|선수) (\\d+)명의 .+의 평균은 (\\d+)' + UNIT + '(?:이에요|예요)\\. 여기에 .+(?:이|가) (\\d+)' + UNIT + '인 (?:학생|선수) 한 명이 더 들어왔어요\\. (\\d+)명의 평균을 구하세요\\.$').exec(t))) {
      k = 'add'; ok(Number(m[6]) === Number(m[1]) + 1 && m[3] === m[5], where + '인원수: ' + t); want = (m[1] * m[2] + Number(m[4])) / (Number(m[1]) + 1);
    } else if ((m = new RegExp('^A (?:모둠|팀) (\\d+)명의 .+의 평균은 (\\d+)' + UNIT + ', B (?:모둠|팀) (\\d+)명의 평균은 (\\d+)' + UNIT + '(?:이에요|예요)\\. 두 (?:모둠을|팀을) 합친 (\\d+)명의 평균을 구하세요\\.$').exec(t))) {
      k = 'merge'; ok(Number(m[7]) === Number(m[1]) + Number(m[4]) && m[1] !== m[4], where + '인원수: ' + t); want = (m[1] * m[2] + m[4] * m[5]) / (Number(m[1]) + Number(m[4]));
    } else {
      k = 'fix'; m = new RegExp('^(?:학생|선수) (\\d+)명의 .+의 평균을 구했더니 (\\d+)' + UNIT + '(?:이었어요|였어요)\\. 그런데 한 명의 값을 잘못 적은 것을 알았어요\\. 잘못 적은 값은 (\\d+)' + UNIT + ', 바른 값은 (\\d+)' + UNIT + '(?:이에요|예요)\\. 바르게 고친 평균을 구하세요\\.$').exec(t);
      ok(!!m, where + '모르는 문제: ' + t); want = m ? (m[1] * m[2] - Number(m[4]) + Number(m[6])) / m[1] : -1;
    }
    kinds[level + k] = 1; ok(near(a, want), where + '답 ' + a + ' ≠ ' + want + ' — ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0basic 1missing 2add 2fix 2merge', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'count-off mean-itself median mid-range not-divided not-recounted not-weighted others-mean reversed simple-average sum total unchanged', '실수의 종류');
  done('평균');

  group('B28 — 중앙값 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B28.median', function (p, pr, level, where) {
    var t = pr.text, a = keyChecks('B28.median', p, pr, where, bag), d = listOf(t), m, k, f, x;
    if (level < 2) {
      k = 'find'; ok(allNum(d) && d.length % 2 === (level === 0 ? 1 : 0) && / 이 자료의 중앙값을 구하세요\.$/.test(t), where + '문제 글: ' + t);
      ok(near(a, middle(d)), where + '중앙값 ' + a + ' ≠ ' + middle(d) + ' — ' + t);
    } else if ((m = new RegExp('이 자료의 중앙값이 (\\d+(?:\\.5)?)' + UNIT + '일 때, \\$x\\$의 값을 구하세요\\.$').exec(t))) {
      k = 'given'; ok(oneX(d) && d.length % 2 === 0 && /작은 값부터 차례로 적은 자료/.test(t), where + '문제 글: ' + t);
      f = fill(d, a); ok(f.join() === sorted(f).join() && near(middle(f), Number(m[1])), where + 'x = ' + a + ' 를 넣으면 순서나 중앙값이 맞지 않음 — ' + t);
      /* 답은 하나뿐이어야 한다: 다른 정수를 넣으면 순서가 깨지거나 중앙값이 달라진다 */
      for (x = a - 30; x <= a + 30; x++) if (x !== a) { f = fill(d, x); ok(!(f.join() === sorted(f).join() && near(middle(f), Number(m[1]))), where + '답이 둘: ' + x); }
    } else {
      k = 'via'; m = new RegExp('이 자료의 평균이 (\\d+)' + UNIT + '일 때, 중앙값을 구하세요\\.$').exec(t); ok(!!m && oneX(d) && d.length % 2 === 1, where + '모르는 문제: ' + t);
      x = m[1] * d.length - total(rest(d)); ok(x >= 1 && near(a, middle(fill(d, x))), where + '중앙값 ' + a + ' — ' + t);
    }
    kinds[level + k] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0find 1find 2given 2via', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'doubled lower-middle mean median-itself mid-range neighbor-mean not-halved not-sorted other-middle position upper-middle without-x x-itself', '실수의 종류');
  done('중앙값');

  group('B28 — 최빈값과 알맞은 대푯값 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  var REPS = ['가장 큰 값', '중앙값', '최빈값', '평균'];
  each('B28.mode', function (p, pr, level, where) {
    var t = pr.text, opts = pickChecks('B28.mode', p, pr, where, bag), ms = MH.mistakesFor(p), d = listOf(t), re = /([가-힣]+) (\d+)명/g, m, names = [], cnt = [], top, k, s, want;
    if (level === 0) {
      k = 'num'; ok(allNum(d) && / 이 자료의 최빈값을 고르세요\.$/.test(t), where + '문제 글: ' + t); top = modesOf(d);
      eq(p.answer, top.join(',\\ '), where + '최빈값 — ' + t); ok(top.length <= 2, where + '최빈값이 셋 이상');
      ms.forEach(function (x) {
        var v = x.value.split(',\\ ').map(Number);
        if (x.id === 'biggest') ok(v[0] === sorted(d)[d.length - 1] && top.indexOf(v[0]) < 0, where + '가장 큰 값');
        if (x.id === 'smallest') ok(v[0] === sorted(d)[0] && top.indexOf(v[0]) < 0, where + '가장 작은 값');
        if (x.id === 'count') ok(v[0] === d.filter(function (y) { return y === top[0]; }).length, where + '횟수');
        if (x.id === 'median') ok(near(Number(x.value), middle(d)), where + '중앙값 보기');
        if (x.id === 'mean') ok(near(v[0], avg(d)), where + '평균 보기');
        if (x.id === 'one-of-two') ok(top.length === 2 && v.length === 1 && top.indexOf(v[0]) >= 0, where + '둘 중 하나');
        if (x.id === 'second') ok(top.length === 1 && v.length === 2 && v.indexOf(top[0]) >= 0, where + '둘째까지');
      });
    } else if (level === 1 || /구할 수 있는 대푯값을 고르세요\.$/.test(t)) {
      s = t.split('물었더니 ')[1] || ''; while ((m = re.exec(s))) { names.push(m[1]); cnt.push(Number(m[2])); }
      m = /^학생 (\d+)명에게 .+(?:을|를) 하나씩 물었더니 /.exec(t); ok(!!m && names.length === 4 && Number(m[1]) === total(cnt), where + '문제 글: ' + t);
      if (level === 1) {
        k = 'cat'; ok(/이었어요\. 이 자료의 최빈값을 고르세요\.$/.test(t), where + '문제 글: ' + t); top = mostOf(names, cnt);
        eq(p.answer, top.join(', '), where + '최빈값 — ' + t);
        ms.forEach(function (x) {
          if (x.id === 'count') eq(x.value, Math.max.apply(null, cnt) + '명', where + '사람 수 보기');
          if (x.id === 'total') eq(x.value, total(cnt) + '명', where + '전체 사람 수 보기');
          if (x.id === 'least') ok(cnt[names.indexOf(x.value)] === Math.min.apply(null, cnt), where + '가장 적은 것');
          if (x.id === 'none') eq(x.value, '없다', where + '없다 보기');
          if (x.id === 'one-of-two') ok(top.length === 2 && top.indexOf(x.value) >= 0, where + '둘 중 하나');
          if (x.id === 'second') ok(top.length === 1 && x.value.split(', ').length === 2 && x.value.split(', ').indexOf(top[0]) >= 0, where + '둘째까지');
        });
      } else { k = 'words'; want = '최빈값'; }
    } else if (/ 이 자료의 대푯값으로 가장 알맞은 것을 고르세요\.$/.test(t)) {
      k = 'outlier'; want = '중앙값'; s = sorted(d);
      ok(allNum(d) && s[s.length - 1] > 3 * s[s.length - 2] && s.every(function (v, i) { return !i || v !== s[i - 1]; }), where + '혼자 떨어진 값 하나와 서로 다른 값들 — ' + t);
    } else if (/다음 달에 가장 많이 준비할 .+ 정하려고 해요\. 이때 가장 알맞은 대푯값을 고르세요\.$/.test(t)) { k = 'popular'; want = '최빈값'; }
    else { k = 'share'; want = '평균'; ok(allNum(d) && /똑같이 다시 나누어 준다면 한 명의 몫은 얼마일까요\? 이 몫을 나타내는 대푯값을 고르세요\.$/.test(t), where + '모르는 문제: ' + t); }
    if (level === 2) { eq(opts.slice().sort().join('|'), REPS.join('|'), where + '보기 네 가지'); eq(p.answer, want, where + '알맞은 대푯값 — ' + t); ms.forEach(function (x) { eq(x.value, { mean: '평균', median: '중앙값', mode: '최빈값', max: '가장 큰 값' }[x.id], where + '틀린 보기의 종류'); }); }
    kinds[level + k] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0num 1cat 2outlier 2popular 2share 2words', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'biggest count least max mean median mode none one-of-two second smallest total', '실수의 종류');
  done('최빈값');

  group('B28 — 편차 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B28.deviation', function (p, pr, level, where) {
    var t = pr.text, a = keyChecks('B28.deviation', p, pr, where, bag), d = listOf(t), m, g, k, want;
    if (level === 0) {
      m = new RegExp(' 값이 (\\d+)' + UNIT + '인 변량의 편차를 구하세요\\.$').exec(t); g = new RegExp('이 자료의 평균은 (\\d+)' + UNIT + '(?:이에요|예요)\\.').exec(t); k = g ? 'given' : 'compute';
      ok(!!m && allNum(d) && d.indexOf(Number(m[1])) >= 0 && (!g || Number(g[1]) === avg(d)), where + '문제 글: ' + t); want = m[1] - avg(d);
    } else if (level === 1) { k = 'zero'; ok(oneX(d) && /편차를 차례로 적은 것이에요\(단위: .+\)\. \[ .+ \] \$x\$의 값을 구하세요\.$/.test(t), where + '문제 글: ' + t); want = -total(rest(d)); }
    else if ((m = new RegExp('^(?:학생|선수)들의 .+의 평균은 (\\d+)' + UNIT + '(?:이에요|예요)\\. 이 가운데 편차가 \\$(-?\\d+)\\$' + UNIT + '인 (?:학생|선수)의 .+(?:을|를) 구하세요\\.$').exec(t))) { k = 'value'; ok(m[2] === m[4], where + '단위'); want = Number(m[1]) + Number(m[3]); }
    else { k = 'table'; m = new RegExp('\\] 평균이 (\\d+)' + UNIT + '일 때, 편차가 \\$x\\$' + UNIT + '인 (?:학생|선수)의 .+(?:을|를) 구하세요\\.$').exec(t); ok(!!m && oneX(d), where + '모르는 문제: ' + t); want = m ? Number(m[1]) - total(rest(d)) : NaN; }
    kinds[level + k] = 1; ok(a === want && a !== 0, where + '답 ' + a + ' ≠ ' + want + ' — ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0compute 0given 1zero 2table 2value', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'abs-sum deviation-itself ignored-signs mean-itself median-based not-negated reversed value-itself zero', '실수의 종류');
  done('편차');

  group('B28 — 분산과 표준편차 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B28.variance', function (p, pr, level, where) {
    var t = pr.text, a = keyChecks('B28.variance', p, pr, where, bag), d = listOf(t), sd = /표준편차를 구하세요\.$/.test(t), m, k, V;
    ok(sd === (level === 2) && (sd || /분산을 구하세요\.$/.test(t)), where + '묻는 것: ' + t);
    if ((m = /^(?:학생|선수)들의 .+의 분산이 (\d+)일 때, 표준편차를 구하세요\.$/.exec(t))) { k = 'given'; V = Number(m[1]); }
    else if (/^다음은 어떤 자료의 편차를 모두 적은 것이에요\. /.test(t)) { k = 'devs'; ok(allNum(d) && total(d) === 0, where + '편차의 합은 0 — ' + t); V = sqSum(d) / d.length; }
    else { k = 'data'; ok(allNum(d) && d.every(function (v) { return v >= 1; }) && /조사한 자료예요/.test(t), where + '모르는 문제: ' + t); V = varOf(d); }
    kinds[level + k] = 1; ok(near(sd ? a * a : a, V), where + '답 ' + a + ', 분산 ' + V + ' — ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0devs 1data 2data 2devs 2given', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'abs-mean count-off doubled half not-divided raw-squares squared variance zero', '실수의 종류');
  done('분산과 표준편차');

  group('B28 — 산포도 읽기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  /** 편차 묶음에 대한 설명 한 줄이 참인지. 읽을 수 없으면 null */
  var truth = function (s, d) {
    var m, pos = d.filter(function (v) { return v > 0; }).length, zero = d.filter(function (v) { return v === 0; }).length, V = sqSum(d) / d.length, s2 = sorted(d);
    if ((m = /^평균보다 큰 변량은 (\d+)개이다$/.exec(s))) return Number(m[1]) === pos;
    if ((m = /^분산은 (\d+)이다$/.exec(s))) return Number(m[1]) === V;
    if ((m = /^표준편차는 (\d+)이다$/.exec(s))) return m[1] * m[1] === V;
    if ((m = /^편차의 합은 (\d+)이다$/.exec(s))) return Number(m[1]) === total(d);
    if ((m = /^가장 큰 변량과 가장 작은 변량의 차는 (\d+)이다$/.exec(s))) return Number(m[1]) === s2[s2.length - 1] - s2[0];
    if ((m = /^평균과 같은 변량이 (\d+)개 있다$/.exec(s))) return Number(m[1]) === zero;
    if (s === '평균과 같은 변량은 없다') return zero === 0;
    return null;
  };
  ok(truth('분산은 2이다', [-2, -1, 0, 1, 2]) === true && truth('표준편차는 2이다', [-2, -1, 0, 1, 2]) === false && truth('편차의 합은 0이다', [3, -3]) === true && truth('평균과 같은 변량은 없다', [3, -3]) === true && truth('가장 큰 변량과 가장 작은 변량의 차는 6이다', [3, -3]) === true && truth('뭐', [1]) === null, '설명 읽기');
  each('B28.spread', function (p, pr, level, where) {
    var t = pr.text, opts = pickChecks('B28.spread', p, pr, where, bag), ms = MH.mistakesFor(p), d = listOf(t), m, k, V, re, rows = [], big, pickRow, by;
    if (level === 0) {
      ok(allNum(d) && / 이 자료의 표준편차를 고르세요\.$/.test(t), where + '문제 글: ' + t);
      if (/^다음은 어떤 자료의 편차를 모두 적은 것이에요\. /.test(t)) { k = 'devs'; ok(total(d) === 0, where + '편차의 합은 0'); V = sqSum(d) / d.length; } else { k = 'data'; V = varOf(d); }
      m = /^(\d*)\\sqrt\{(\d+)\}$/.exec(p.answer); ok(!!m && near(texVal(p.answer), Math.sqrt(V)), where + '표준편차 ' + p.answer + ', 분산 ' + V);
      ok(!!m && [4, 9, 25].every(function (s) { return m[2] % s !== 0; }) && m[1] !== '1' && Number(m[2]) > 1, where + '근호 안을 가장 작게: ' + p.answer);
      ms.forEach(function (x) { var w = texVal(x.value); ok(w !== null && !near(w, Math.sqrt(V)), where + '틀린 보기의 값: ' + x.value); if (x.id === 'variance') ok(near(w, V), where + '분산 보기'); if (x.id === 'half') ok(near(w, V / 2), where + '반으로 나눈 보기'); if (x.id === 'not-divided') ok(near(w * w, V * d.length), where + '나누지 않은 보기'); });
    } else if (level === 1) {
      k = 'compare'; re = /([A-D](?:반| 기계| 노선| 선수))\(평균 (\d+)(?:점|g|분), 표준편차 (\d+)(?:점|g|분)\)/g;
      while ((m = re.exec(t))) rows.push({ name: m[1], mean: Number(m[2]), sd: Number(m[3]) });
      big = /(흩어져 있는|들쭉날쭉한|기복이 가장 큰) (반|기계|노선|선수)을? ?를? 고르세요\.$/.test(t);
      ok(rows.length === 4 && (big || /(가장 고른|가장 일정한) (반|기계|노선|선수)(을|를) 고르세요\.$/.test(t)), where + '문제 글: ' + t);
      by = function (key, sign) { return rows.slice().sort(function (x, y) { return sign * (x[key] - y[key]); })[0]; };
      pickRow = by('sd', big ? -1 : 1); eq(p.answer, pickRow.name, where + '답 — ' + t);
      ok(rows.filter(function (r) { return r.sd === pickRow.sd; }).length === 1, where + '표준편차가 같은 것이 있음');
      eq(opts.slice().sort().join('|'), rows.map(function (r) { return r.name; }).sort().join('|'), where + '보기는 네 이름');
      ms.forEach(function (x) { eq(x.value, (x.id === 'opposite' ? by('sd', big ? 1 : -1) : x.id === 'mean-high' ? by('mean', -1) : by('mean', 1)).name, where + '틀린 보기 ' + x.id); });
    } else {
      k = 'read'; ok(allNum(d) && total(d) === 0 && /^다음은 어떤 자료의 편차를 모두 적은 것이에요\. .+ 이 자료에 대한 설명으로 옳은 것을 고르세요\.$/.test(t), where + '문제 글: ' + t);
      opts.forEach(function (o) { eq(truth(o, d), o === p.answer, where + '설명의 참 · 거짓: ' + o + ' — ' + t); });
    }
    kinds[level + k] = 1;
  });
  eq(Object.keys(kinds).sort().join(' '), '0data 0devs 1compare 2read', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'abs-mean count-negative half max-only mean-high mean-low not-divided opposite pulled-whole sd-as-variance sum-abs variance zero-count', '실수의 종류');
  done('산포도 읽기');

  group('B28 — 개념 카드');
  var cards = MH.concepts.B28, figs = [];
  ok(cards.length >= 3 && cards.length <= 6, '카드 3~6장');
  cards.forEach(function (c) { c.body.forEach(function (b) { if (b.figure) figs.push(b.figure); }); });
  ok(figs.length === 2 && figs.every(function (f) { return f.type === 'geo' && geoOk(f); }), '그림 두 장의 형식');
  /* 편차 그림: 점 아래에 적힌 변량과 편차가 맞는지(평균 6) */
  var lab = function (f, y) { return f.items.filter(function (i) { return i[0] === 'text' && i[2] === y && i[1] > 30; }).map(function (i) { return Number(i[3].replace('−', '-')); }); };
  var vs = lab(figs[0], 96), ds = lab(figs[0], 124);
  ok(vs.length === 5 && avg(vs) === 6 && vs.every(function (v, i) { return v - 6 === ds[i]; }) && total(ds) === 0, '편차 그림의 변량과 편차');
  ok(avg(lab(figs[1], 76)) === 6 && avg(lab(figs[1], 126)) === 6 && varOf(lab(figs[1], 76)) === 2 && varOf(lab(figs[1], 126)) === 13.6, '산포도 그림의 두 자료(평균 6, 분산 2 와 13.6)');
  done('개념 카드');
})();
