/* B27 경우의 수와 확률 기초 — 단원 전용 검사.
   문제 글에서 상황(주사위 · 카드 · 주머니 · 동전 · 후보)과 조건을 읽고, 답을 다시 구해 견준다. 단원 파일의 계산과 무관하게,
   경우의 수는 일어날 수 있는 경우를 하나하나 만들어 세고(주사위 36가지, 동전 2^m 가지, 줄 세우기 · 뽑기는 모두 늘어놓기),
   확률은 그렇게 센 두 수를 나눈 값과 견준다. 분수 답은 0 과 1 사이의 기약분수여야 하고, 약분하지 않은 입력도 정답이어야 한다.
   보기 문제는 보기 문장의 조건을 읽어 경우의 수를 세고, 답과 틀린 보기의 종류(절대 일어나지 않음 · 반드시 일어남 …)가 맞는지 본다. */
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
  var gcd = function (a, b) { return b ? gcd(b, a % b) : a; };
  var near = function (x, y) { return typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y) && Math.abs(x - y) <= 1e-9; };
  /** 키패드(자연수) 문제의 공통 검사 */
  var numChecks = function (id, p, pr, where, bag) {
    var def = MH.types[id], kind = MH.kinds.int, ans = p.answer, ms = MH.mistakesFor(p), steps = def.steps(p.v);
    ok(Number.isInteger(ans) && ans >= 1, where + '답은 자연수');
    ms.forEach(function (x) { bag[x.id] = 1; ok(Number.isInteger(x.value) && x.value >= 1 && x.value !== ans, where + '실수 값: ' + x.id); });
    ok(ms.length >= 2 && ms.every(function (x, i) { return ms.every(function (y, j) { return i === j || x.value !== y.value; }); }), where + '실수가 둘은 있고 값이 서로 달라야 함');
    if (p.seed <= 60) { eq(J(p, kind.raw(p.answer, def.answer)), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); }); }
    ok(steps.length >= 2 && !pr.figure, where + '풀이 줄 수');
    detailed(id, p, where);
    return ans;
  };
  /** 키패드(분수) 문제의 공통 검사. 답의 값을 돌려준다 */
  var fracChecks = function (id, p, pr, where, bag) {
    var def = MH.types[id], kind = MH.kinds.fraction, a = p.answer, ms = MH.mistakesFor(p), steps = def.steps(p.v);
    ok(Number.isInteger(a.n) && Number.isInteger(a.d) && a.n >= 1 && a.d >= 2 && a.n < a.d && gcd(a.n, a.d) === 1, where + '답은 0과 1 사이의 기약분수');
    ms.forEach(function (x) { bag[x.id] = 1; ok(x.value.n >= 1 && x.value.d >= 2 && gcd(x.value.n, x.value.d) === 1 && x.value.n * a.d !== a.n * x.value.d, where + '실수 값: ' + x.id); });
    ok(ms.length >= 2 && ms.every(function (x, i) { return ms.every(function (y, j) { return i === j || x.value.n * y.value.d !== y.value.n * x.value.d; }); }), where + '실수가 둘은 있고 값이 서로 달라야 함');
    if (p.seed <= 60) {
      eq(J(p, kind.raw(a, def.answer)), 'correct:-', where + '정답 판정'); eq(MH.judge(p, (3 * a.n) + ',' + (3 * a.d)).verdict, 'correct-note', where + '약분하지 않은 답도 정답(약분 안내)');
      ms.forEach(function (x) { eq(J(p, kind.raw(x.value, def.answer)), 'wrong:' + x.id, where + '실수 값 판정'); });
    }
    ok(steps.length >= 2 && !pr.figure, where + '풀이 줄 수');
    detailed(id, p, where);
    return a.n / a.d;
  };

  /* ── 문제 글 읽기(단원 파일과 무관하게 다시 만든 것) ── */
  /** 1 ~ n 가운데 하나가 나오는 상황의 n. 아니면 null */
  var sizeOf = function (t) { var m = /1부터 (\d+)까지의 (?:자연수|번호)가 하나씩 적힌 (?:카드|공) (\d+)(?:장|개)/.exec(t); if (m) return m[1] === m[2] ? Number(m[1]) : null; return /^한 개의 주사위를 던질 때/.test(t) ? 6 : null; };
  var primeQ = function (x) { var c = 0, i; for (i = 1; i <= x; i++) if (x % i === 0) c++; return c === 2; };
  /** 글 안의 조건 하나를 함수로. 조건이 없거나 둘 이상이면 null */
  var predOf = function (s) {
    var found = [], take = function (re, make) { var m = re.exec(s); if (m) found.push(make(Number(m[1]))); };
    if (/짝수/.test(s)) found.push(function (x) { return x % 2 === 0; });
    if (/홀수/.test(s)) found.push(function (x) { return x % 2 !== 0; });
    if (/소수/.test(s)) found.push(primeQ);
    take(/(\d+)의 배수/, function (k) { return function (x) { return x / k === Math.floor(x / k); }; });
    take(/(\d+)의 약수/, function (k) { return function (x) { return k / x === Math.floor(k / x); }; });
    take(/(\d+) 이상의/, function (k) { return function (x) { return x >= k; }; });
    take(/(\d+) 이하의/, function (k) { return function (x) { return x <= k; }; });
    take(/(\d+)보다 큰/, function (k) { return function (x) { return x > k; }; });
    take(/(\d+)보다 작은/, function (k) { return function (x) { return x < k; }; });
    return found.length === 1 ? found[0] : null;
  };
  var countIn = function (n, f) { var c = 0, x; for (x = 1; x <= n; x++) if (f(x)) c++; return c; };
  /** 주사위 두 개: 36가지 가운데 f(첫째, 둘째) 가 참인 것의 수 */
  var dice2 = function (f) { var c = 0, i, j; for (i = 1; i <= 6; i++) for (j = 1; j <= 6; j++) if (f(i, j)) c++; return c; };
  var pairPred = function (t) {
    var m = /두 눈의 수의 (합이|차가|곱이) (\d+)/.exec(t), k = m && Number(m[2]);
    if (m) return m[1] === '합이' ? function (i, j) { return i + j === k; } : m[1] === '차가' ? function (i, j) { return i - j === k || j - i === k; } : function (i, j) { return i * j === k; };
    return /두 눈의 수가 같/.test(t) ? function (i, j) { return i === j; } : null;
  };
  /** 동전 m 개: 2^m 가지 가운데 f(앞면의 수) 가 참인 것의 수 */
  var coins = function (m, f) { var c = 0, x, h, i; for (x = 0; x < Math.pow(2, m); x++) { h = 0; for (i = 0; i < m; i++) if (Math.floor(x / Math.pow(2, i)) % 2 === 1) h++; if (f(h)) c++; } return c; };
  /** n 개에서 k 개를 차례로 뽑아 늘어놓는 것을 모두 만들어 f(늘어놓은 것) 가 참인 것의 수 */
  var lineups = function (n, k, f) { var c = 0; (function go(cur) { var i; if (cur.length === k) { if (f(cur)) c++; return; } for (i = 0; i < n; i++) if (cur.indexOf(i) < 0) go(cur.concat([i])); })([]); return c; };
  /** 차례를 따지지 않고 뽑는 것(오름차순으로 늘어놓은 것만 센다) */
  var groups = function (n, k, f) { return lineups(n, k, function (c) { return c.every(function (x, i) { return i === 0 || c[i - 1] < x; }) && f(c); }); };
  var any = function () { return true; };
  var digitsIn = function (t) { var m = /^\$([\d,\\ ]+)\$의 숫자가 하나씩 적힌 카드 (\d+)장/.exec(t), ds = m && m[1].match(/\d/g).map(Number); return ds && ds.length === Number(m[2]) ? ds : null; };
  /** 카드로 만든 k 자리 자연수를 모두 만들어 f(수) 가 참인 것의 수 */
  var numbersFrom = function (ds, k, f) { return lineups(ds.length, k, function (c) { var v = 0; c.forEach(function (i) { v = v * 10 + ds[i]; }); return String(v).length === k && f(v); }); };
  var colorsOf = function (t) { var out = {}, re = /(빨간|파란|노란) 공 (\d+)개/g, m; while ((m = re.exec(t))) out[m[1]] = Number(m[2]); return out; };
  var sumOf = function (o) { return Object.keys(o).reduce(function (s, k) { return s + o[k]; }, 0); };
  var N_ = function (t) { return (t.match(/\d+/g) || []).map(Number); };

  group('B27 — 검사 도구 자체 검사');
  ok(sizeOf('한 개의 주사위를 던질 때, 짝수') === 6 && sizeOf('1부터 12까지의 자연수가 하나씩 적힌 카드 12장 중에서') === 12 && sizeOf('1부터 12까지의 번호가 하나씩 적힌 공 13개') === null && sizeOf('동전') === null, '상황 읽기');
  ok(countIn(10, predOf('소수가 적힌')) === 4 && countIn(12, predOf('12의 약수의 눈')) === 6 && countIn(20, predOf('7의 배수')) === 2 && countIn(9, predOf('4보다 큰 수')) === 5 && countIn(9, predOf('4 이상의 수')) === 6 && countIn(9, predOf('4 이하의 눈')) === 4 && countIn(9, predOf('4보다 작은')) === 3 && countIn(9, predOf('홀수')) === 5, '조건 읽기');
  ok(predOf('3의 배수 또는 5의 배수') !== null && predOf('아무 글') === null && predOf('짝수이고 소수') === null, '조건은 하나만');
  ok(dice2(pairPred('두 눈의 수의 합이 7인')) === 6 && dice2(pairPred('두 눈의 수의 차가 0')) === 6 && dice2(pairPred('두 눈의 수의 곱이 12일')) === 4 && dice2(pairPred('두 눈의 수가 같을')) === 6, '주사위 두 개');
  ok(coins(3, function (h) { return h === 2; }) === 3 && coins(4, function (h) { return h >= 1; }) === 15, '동전');
  ok(lineups(5, 3, any) === 60 && groups(5, 3, any) === 10 && numbersFrom([0, 1, 2, 3], 2, any) === 9 && numbersFrom([1, 2, 3], 2, function (v) { return v % 2 === 0; }) === 2, '늘어놓기 · 뽑기 · 수 만들기');
  eq(JSON.stringify(colorsOf('빨간 공 3개, 파란 공 4개가 들어 있는')), '{"빨간":3,"파란":4}', '주머니 읽기');
  done('도구');

  group('B27 — 사건과 경우의 수 (단계마다 1,000문제)');
  var bag = {}, kinds = {};
  each('B27.count', function (p, pr, level, where) {
    var a = numChecks('B27.count', p, pr, where, bag), t = pr.text, n = sizeOf(t), f, m, want, k;
    ok(/경우의 수를 구하세요\.$/.test(t), where + '문제 글: ' + t);
    if (n) { k = 'single'; f = predOf(t.split('때, ')[1]); ok(!!f, where + '조건을 읽을 수 없음: ' + t); want = f ? countIn(n, f) : -1; ok(want < n, where + '모든 경우가 답'); }
    else if (/두 개의 주사위/.test(t)) { k = 'dice2'; want = dice2(pairPred(t)); }
    else { k = 'coin'; m = /서로 다른 동전 (\d+)개를 동시에 던질 때, (앞|뒷)면이 (\d+)개 나오는/.exec(t); ok(!!m, where + '모르는 문제: ' + t); want = coins(Number(m[1]), function (h) { return (m[2] === '앞' ? h : m[1] - h) === Number(m[3]); }); }
    kinds[level + k] = 1; eq(a, want, where + '경우의 수');
  });
  eq(Object.keys(kinds).sort().join(' '), '0single 1single 2coin 2dice2', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'boundary complement mixed-up named-one one-prime over-six total unordered', '실수의 종류');
  done('세기');

  group('B27 — 「또는」과 「동시에」 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B27.rule', function (p, pr, level, where) {
    var a = numChecks('B27.rule', p, pr, where, bag), t = pr.text, v = N_(t), n = sizeOf(t), m, want, k, c, d;
    if (n) { k = 'or-card'; m = /때, (\d+)의 배수 또는 (\d+)의 배수가 적힌/.exec(t); ok(!!m, where + '문제 글: ' + t); want = countIn(n, function (x) { return x % m[1] === 0 || x % m[2] === 0; }); ok(countIn(n, function (x) { return x % m[1] === 0 && x % m[2] === 0; }) === 0, where + '두 사건이 겹침'); }
    else if ((m = /두 눈의 수의 합이 (\d+)이거나 (\d+)인 경우의 수/.exec(t))) { k = 'or-dice'; want = dice2(function (i, j) { return i + j === Number(m[1]) || i + j === Number(m[2]); }); }
    else if (/일어나는 모든 경우의 수를 구하세요\.$/.test(t)) {
      k = 'toss'; c = /동전 한 개/.test(t) ? 1 : (m = /동전 (\d+)개/.exec(t)) ? Number(m[1]) : 0; d = /주사위 한 개/.test(t) ? 1 : /주사위 두 개/.test(t) ? 2 : 0;
      ok(c + d >= 2, where + '던지는 것이 하나뿐'); want = Math.pow(2, c) * Math.pow(6, d);
    }
    else if (/바로 가는 길이/.test(t)) { k = 'path'; ok(v.length === 3, where + '수 셋'); want = v[0] * v[1] + v[2]; }
    else if (/올라갈 때와 다른 길로 내려오/.test(t)) { k = 'round'; ok(v.length === 1, where + '수 하나'); want = lineups(v[0], 2, any); }
    else if (/가운데 한 가지를 고르고, 음료도 한 가지 골라/.test(t)) { k = 'mix'; ok(v.length === 3, where + '수 셋'); want = (v[0] + v[1]) * v[2]; }
    else if (/가운데 (한 가지|한 권|한 개|하나를 타고)/.test(t)) { k = 'or'; ok(v.length === 2 && /가운데 (한 가지만|한 권만|한 개만|하나를 타고)/.test(t), where + '문제 글: ' + t); want = v[0] + v[1]; }
    else { k = v.length === 3 ? 'three' : 'and'; ok(/하나씩 골라|한 장씩 뽑아|거쳐/.test(t) && (v.length === 2 || v.length === 3), where + '모르는 문제: ' + t); want = v.reduce(function (x, y) { return x * y; }, 1); }
    kinds[level + k] = 1; eq(a, want, where + '경우의 수 ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0or 0or-card 0or-dice 1and 1toss 2mix 2path 2round 2three', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added all-added all-multiplied forgot-direct half-multiplied multiplied one-side same-allowed two-only unordered', '실수의 종류');
  done('또는 · 동시에');

  group('B27 — 줄 세우기와 뽑기 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B27.arrange', function (p, pr, level, where) {
    var a = numChecks('B27.arrange', p, pr, where, bag), t = pr.text, v = N_(t), ds = digitsIn(t), m, want, k;
    if (ds) { k = ds[0] === 0 ? 'num0' : 'num'; m = /장 중에서 (\d+)장을 뽑아 만들 수 있는 (두|세) 자리 자연수의 개수를 구하세요\.$/.exec(t); ok(!!m && Number(m[1]) === (m[2] === '두' ? 2 : 3) && ds.every(function (x, i) { return i === 0 || ds[i - 1] < x; }), where + '문제 글: ' + t); want = numbersFrom(ds, Number(m[1]), any); }
    else if (/한 줄로 (세우는|꽂는|거는)|달리는 차례를 정하는/.test(t)) { k = v.length === 1 ? 'all' : 'pick'; ok(v.length === 1 || (v.length === 2 && v[1] < v[0]), where + '수: ' + t); want = lineups(v[0], v[1] || v[0], any); }
    else if (/회장 1명과 부회장 1명을 뽑는|금상 1명과 은상 1명을 뽑는/.test(t)) { k = 'roles2'; eq(v.length, 3, where + '수: ' + t); want = lineups(v[0], 2, any); }
    else if ((m = /^(\d+)명의 (?:후보|학생) 중에서 (?:대표|청소 당번) 2명을 뽑는/.exec(t))) { k = 'same2'; want = groups(Number(m[1]), 2, any); }
    else { k = 'pairs'; ok(/한 번씩 경기를|한 번씩 악수를|두 점을 이어 만들 수 있는 선분/.test(t) && v.length === 1, where + '모르는 문제: ' + t); want = groups(v[0], 2, any); }
    kinds[level + k] = 1; eq(a, want, where + '경우의 수 ' + t);
    ok((k === 'all' ? v[0] <= 5 : a <= 42) && v[0] <= 7, where + '쉬운 크기(모두 세우기는 5까지, 나머지는 답 42 이하): ' + t);      /* 순열 · 조합이 필요한 복잡한 경우는 내지 않는다 */
  });
  eq(Object.keys(kinds).sort().join(' '), '0all 0pick 1num 1num0 2pairs 2roles2 2same2', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added n-times-k not-ordered ordered power zero-first', '실수의 종류');
  done('줄 세우기 · 뽑기');

  /** 대표 2명: '남학생 a명과 여학생 b명' 에서 f(남학생 수, 여학생 수) 가 참인 것 / 전체 */
  var repProb = function (t, f) {
    var m = /^(남학생|여학생) (\d+)명과 (남학생|여학생) (\d+)명 중에서 대표 2명을 뽑을 때/.exec(t), boys, girls, n;
    if (!m || m[1] === m[3]) return null;
    boys = Number(m[1] === '남학생' ? m[2] : m[4]); girls = Number(m[1] === '남학생' ? m[4] : m[2]); n = boys + girls;
    return groups(n, 2, function (c) { var b = c.filter(function (i) { return i < boys; }).length; return f(b, 2 - b); }) / groups(n, 2, any);
  };
  group('B27 — 확률의 뜻 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B27.prob', function (p, pr, level, where) {
    var a = fracChecks('B27.prob', p, pr, where, bag), t = pr.text, n = sizeOf(t), ds = digitsIn(t), cs = colorsOf(t), f, m, want, k;
    ok(/확률을 구하세요\.$/.test(t), where + '문제 글: ' + t);
    if (n) { k = 'single'; f = predOf(t.split('때, ')[1]); ok(!!f && /나올 확률/.test(t), where + '조건을 읽을 수 없음: ' + t); want = f ? countIn(n, f) / n : -1; }
    else if (sumOf(cs)) { k = 'color'; m = /때, (빨간|파란|노란) 공이 나올 확률/.exec(t); ok(!!m && cs[m[1]] >= 1, where + '문제 글: ' + t); want = cs[m[1]] / sumOf(cs); }
    else if (/두 개의 주사위/.test(t)) { k = 'dice2'; want = dice2(pairPred(t)) / 36; }
    else if ((m = /서로 다른 동전 (\d+)개를 동시에 던질 때, (앞|뒷)면이 (\d+)개 나올/.exec(t))) { k = 'coin'; want = coins(Number(m[1]), function (h) { return (m[2] === '앞' ? h : m[1] - h) === Number(m[3]); }) / Math.pow(2, m[1]); }
    else if (ds) {
      k = 'num2'; m = /2장을 뽑아 두 자리 자연수를 만들 때, 그 수가 (짝수일|홀수일|(\d+)보다 클) 확률/.exec(t); ok(!!m && ds[0] > 0, where + '문제 글: ' + t);
      want = numbersFrom(ds, 2, m[1] === '짝수일' ? function (x) { return x % 2 === 0; } : m[1] === '홀수일' ? function (x) { return x % 2 === 1; } : function (x) { return x > Number(m[2]); }) / numbersFrom(ds, 2, any);
    }
    else if ((m = /^A를 포함한 (\d+)명의 후보 중에서 대표 2명을 뽑을 때, A가 대표로 뽑힐/.exec(t))) { k = 'rep1'; want = groups(Number(m[1]), 2, function (c) { return c.indexOf(0) >= 0; }) / groups(Number(m[1]), 2, any); }
    else { k = 'rep2'; m = /2명 모두 (남학생|여학생)이 뽑힐/.exec(t); ok(!!m, where + '모르는 문제: ' + t); want = repProb(t, function (b, g) { return (m[1] === '남학생' ? b : g) === 2; }); }
    kinds[level + k] = 1; ok(near(a, want), where + '확률 ' + a + ' ≠ ' + want + ' — ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0color 0single 1coin 1dice2 2num2 2rep1 2rep2', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'boundary complement half inverted mixed-up one-over one-over-kinds one-prime ratio single-ratio squared total-added total-squared unordered unordered-total', '실수의 종류');
  done('확률의 뜻');

  group('B27 — 확률의 성질 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  /** 보기의 수 읽기: 0 · 1 · 소수 · 분수(음수 포함) */
  var valueOf = function (s) { var m = /^(-?)\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(s); if (m) return (m[1] ? -1 : 1) * m[2] / m[3]; return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null; };
  ok(valueOf('-\\dfrac{1}{4}') === -0.25 && valueOf('\\dfrac{7}{5}') === 1.4 && valueOf('0') === 0 && valueOf('-0.3') === -0.3 && valueOf('x') === null, '보기의 수 읽기');
  each('B27.sense', function (p, pr, level, where) {
    var t = pr.text, opts = MH.optionsOf(p), ms = MH.mistakesFor(p), steps = MH.types['B27.sense'].steps(p.v), n = sizeOf(t), cnt, m, vals, big, want;
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i && o.length <= 40; }) && opts.indexOf(p.answer) >= 0 && ms.length === 3, where + '보기: ' + opts.join(' | '));
    ms.forEach(function (x) { bag[x.id] = 1; ok(opts.indexOf(x.value) >= 0 && x.value !== p.answer, where + '틀린 보기: ' + x.value); });
    if (p.seed <= 60) { eq(J(p, p.answer), 'correct:-', where + '정답 판정'); ms.forEach(function (x) { eq(J(p, x.value), 'wrong:' + x.id, where + '틀린 보기 판정'); }); }
    detailed('B27.sense', p, where);
    ok(steps.length >= 2 && steps[steps.length - 1].tex === p.answer && !pr.figure, where + '풀이의 마지막 줄은 답');
    if (level === 1) {
      kinds['1value'] = 1; vals = opts.map(valueOf);
      ok(t === '다음 네 수 ' + opts.map(function (o) { return '$' + o + '$'; }).join(', ') + ' 가운데 어떤 사건의 확률이 될 수 없는 수는 어느 것인가요?' && !pr.tex, where + '문제 글과 보기');
      ok(vals.every(function (x) { return x !== null; }) && (valueOf(p.answer) < 0 || valueOf(p.answer) > 1), where + '답은 0과 1 사이를 벗어난 수: ' + p.answer);
      ms.forEach(function (x) { var w = valueOf(x.value); ok(w >= 0 && w <= 1 && (x.id === 'zero-ok') === (w === 0) && (x.id === 'one-ok') === (w === 1), where + '틀린 보기는 확률이 될 수 있는 수: ' + x.value); });
      return;
    }
    ok(!!n && !pr.tex && opts.every(function (o) { return predOf(o) !== null && /(이|가) 나온다$/.test(o) && /눈이 나온다$/.test(o) === (n === 6 && /주사위/.test(t)); }), where + '보기를 읽을 수 없음: ' + opts.join(' | '));
    cnt = function (o) { return countIn(n, predOf(o)); };
    if ((m = /다음 중 확률이 (0|1)인 사건은 어느 것인가요\?$/.exec(t))) {
      kinds[level + 'sure' + m[1]] = 1; want = m[1] === '1' ? n : 0;
      eq(cnt(p.answer), want, where + '답의 경우의 수');
      ms.forEach(function (x) { var c = cnt(x.value); ok(c !== want && { never: c === 0, always: c === n, almost: c === n - 1, rarely: c === 1, sometimes: c > 1 && c < n - 1 }[x.id] === true, where + '틀린 보기 ' + x.id + ': ' + x.value); });
    } else {
      m = /다음 중 일어날 확률이 가장 (큰|작은) 사건은 어느 것인가요\?$/.exec(t); ok(!!m, where + '모르는 문제: ' + t); big = m[1] === '큰'; kinds[level + 'most' + (big ? '+' : '-')] = 1;
      vals = opts.map(cnt); ok(vals.every(function (x, i) { return vals.indexOf(x) === i && x >= 1 && x < n; }), where + '보기의 경우의 수가 서로 달라야 함: ' + vals.join(', '));
      eq(cnt(p.answer), big ? Math.max.apply(null, vals) : Math.min.apply(null, vals), where + '답의 경우의 수');
      ms.forEach(function (x) { var order = vals.slice().sort(function (y, z) { return big ? z - y : y - z; }); eq(order.indexOf(cnt(x.value)), { next: 1, middle: 2, opposite: 3 }[x.id], where + '틀린 보기의 차례 ' + x.id); ok(x.explain.indexOf(n + '가지 가운데 ' + cnt(x.value) + '가지') >= 0, where + '설명의 경우의 수: ' + x.explain); });
    }
  });
  eq(Object.keys(kinds).sort().join(' '), '0sure0 0sure1 1value 2most+ 2most-', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'almost always between-ok middle never next one-ok opposite rarely sometimes zero-ok', '실수의 종류');
  done('확률의 성질');

  group('B27 — 일어나지 않을 확률 (단계마다 1,000문제)');
  bag = {}; kinds = {};
  each('B27.property', function (p, pr, level, where) {
    var a = fracChecks('B27.property', p, pr, where, bag), t = pr.text, n = sizeOf(t), cs = colorsOf(t), f, g, m, want, k;
    ok(/확률을 구하세요\.$/.test(t), where + '문제 글: ' + t);
    if ((m = /확률이 \$\\dfrac\{(\d+)\}\{(\d+)\}\$(?:일 때|인 제비뽑기)/.exec(t))) { k = 'given'; ok(/않을 확률|못할 확률|B 팀이 이길 확률|틀릴 확률/.test(t) && gcd(Number(m[1]), Number(m[2])) === 1 && Number(m[1]) < Number(m[2]), where + '문제 글: ' + t); want = 1 - m[1] / m[2]; }
    else if (n) { k = 'not-single'; f = predOf(t.split('때, ')[1]); ok(!!f && /나오지 않을 확률/.test(t), where + '조건을 읽을 수 없음: ' + t); want = f ? countIn(n, function (x) { return !f(x); }) / n : -1; }
    else if (sumOf(cs)) { k = 'not-color'; m = /때, (빨간|파란|노란) 공이 나오지 않을 확률/.exec(t); ok(!!m && cs[m[1]] >= 1, where + '문제 글: ' + t); want = (sumOf(cs) - cs[m[1]]) / sumOf(cs); }
    else if (/두 개의 주사위/.test(t) && !/적어도/.test(t)) {
      k = 'not-dice'; g = /두 눈의 수가 서로 다를 확률/.test(t) ? function (i, j) { return i === j; } : pairPred(t);
      ok(!!g && (/서로 다를 확률/.test(t) || /(\d+)(이|가) 아닐 확률/.test(t)), where + '문제 글: ' + t); want = dice2(function (i, j) { return !g(i, j); }) / 36;
    }
    else if ((m = /^서로 다른 동전 (\d+)개를 동시에 던질 때, 적어도 한 개는 (앞|뒷)면이 나올 확률/.exec(t))) { k = 'atl-coin'; want = coins(Number(m[1]), function (h) { return (m[2] === '앞' ? h : m[1] - h) >= 1; }) / Math.pow(2, m[1]); }
    else if ((m = /^○, × 가운데 하나를 고르는 문제 (\d+)개에 무작정 답을 적을 때, 적어도 한 문제는 맞힐 확률/.exec(t))) { k = 'atl-ox'; want = coins(Number(m[1]), function (h) { return h >= 1; }) / Math.pow(2, m[1]); }
    else if (/두 개의 주사위/.test(t)) { k = 'atl-dice'; f = predOf(t.split('적어도 한 개는 ')[1]); ok(!!f && /눈이 나올 확률/.test(t), where + '조건을 읽을 수 없음: ' + t); want = f ? dice2(function (i, j) { return f(i) || f(j); }) / 36 : -1; }
    else { k = 'atl-rep'; m = /적어도 한 명은 (남학생|여학생)이 뽑힐 확률/.exec(t); ok(!!m, where + '모르는 문제: ' + t); want = repProb(t, function (b, g2) { return (m[1] === '남학생' ? b : g2) >= 1; }); }
    kinds[level + k] = 1; ok(near(a, want), where + '확률 ' + a + ' ≠ ' + want + ' — ' + t);
  });
  eq(Object.keys(kinds).sort().join(' '), '0given 1not-color 1not-dice 1not-single 2atl-coin 2atl-dice 2atl-ox 2atl-rep', '문제의 종류');
  eq(Object.keys(bag).sort().join(' '), 'added both bottom-minus exactly-one half inverted none not-complemented ratio same single-ratio top-minus-one total-added', '실수의 종류');
  done('일어나지 않을 확률');

  group('B27 — 개념 카드');
  var cards = MH.concepts.B27, figs = [];
  ok(cards.length >= 3 && cards.length <= 6, '카드 3~6장');
  cards.forEach(function (c) { c.body.forEach(function (b) { if (b.figure) figs.push(b.figure); }); });
  ok(figs.length === 1 && figs[0].type === 'geo' && geoOk(figs[0]), '수형도 그림의 형식');
  eq(figs[0].items.filter(function (i) { return i[0] === 'text' && /^\(.*\)$/.test(i[3]); }).map(function (i) { return i[3]; }).join(' '), '(앞, 앞) (앞, 뒤) (뒤, 앞) (뒤, 뒤)', '수형도의 결과 네 가지');
  done('개념 카드');
})();
