/* B08 일차방정식의 활용 — 단원 전용 검사.
   ① 문제 글에 보이는 수만 읽어서, 답이 될 수 있는 자연수를 하나씩 넣어 보며 조건에 맞는 수를 찾는다(방정식을 쓰지 않는다). 그 수가 하나뿐이고 답과 같아야 한다.
   ② 풀이에 쓰는 방정식을 tests/algcalc.js 의 계산기(BigInt 분수)로 따로 풀어 답과 견준다. 엔진의 계산과 무관하다. */
(function () {
  'use strict';
  var N = 1000, Q = ALG.Q, calc = ALG.calc, noJosa = ALG.noJosa;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var gcdB = function (a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { var t = a % b; a = b; b = t; } return a; };
  var norm = function (n, d) { if (d < 0n) { n = -n; d = -d; } var g = gcdB(n, d) || 1n; return { n: n / g, d: d / g }; };
  var sub = function (a, b) { return norm(a.n * b.d - b.n * a.d, a.d * b.d); };
  var same = function (a, b) { return a.n * b.d === b.n * a.d; };
  var gap = function (tex, x) { var s = tex.split(' = '); return sub(calc(s[0], { x: x }), calc(s[1], { x: x })); };
  /** 일차방정식의 해: (왼쪽 − 오른쪽)이 일차식이므로 x = 0, 1 을 넣은 값으로 구한다. 해가 하나가 아니거나 일차식이 아니면 null */
  var root = function (tex) {
    var f0 = gap(tex, Q(0n, 1n)), f1 = gap(tex, Q(1n, 1n)), slope = sub(f1, f0);
    if (slope.n === 0n) return null;
    return same(sub(gap(tex, Q(2n, 1n)), f1), slope) ? norm(-f0.n * slope.d, f0.d * slope.n) : null;
  };
  /** 식 'A = B = C' 에 x 를 넣으면 모두 같은 값인가. 0 으로 나누게 되면 거짓 */
  var holds = function (tex, x) {
    var v;
    try { v = tex.split(' = ').map(function (t) { return calc(t, { x: x }); }); } catch (e) { return false; }
    return v.every(function (y) { return same(y, v[0]); });
  };
  var nums = function (t) { return (t.match(/\d+/g) || []).map(Number); };
  var isInt = Number.isInteger;

  /* ── 문제 글의 수와 낱말만으로 세운 조건: (글의 수들, 글) → (넣어 볼 수 c) → 참 · 거짓 ── */
  var plus = function (word) { return /더/.test(word) ? 1 : -1; };
  var RULE = {
    times: function (n, t) { var s = plus(/(더하면|빼면)/.exec(t)[1]); return function (c) { return n[0] * c + s * n[1] === n[2]; }; },
    both: function (n, t) { var s = plus(/(더한|뺀) 다음/.exec(t)[1]); return function (c) { return n[1] * (c + s * n[0]) === n[2]; }; },
    equal: function (n, t) {
      var w = t.match(/더한 수|뺀 수/g), s1 = plus(w[0]), s2 = plus(w[1]), k = n.length === 4 ? n[2] : 1, d = n[n.length - 1];
      return function (c) { return n[0] * c + s1 * n[1] === k * c + s2 * d; };
    },
    consec: function (n, t) {
      var st = /자연수/.test(t) ? 1 : 2, odd = /홀수/.test(t), ask = /가장 작은 수를/.test(t) ? 0 : /가운데 수를/.test(t) ? 1 : 2;
      return function (c) { var lo = c - ask * st; return lo >= 1 && 3 * lo + 3 * st === n[0] && (st === 1 || (lo % 2 === 1) === odd); };
    },
    diff: function (n, t) {
      var k = n.length === 3 ? n[0] : 1, d = n[n.length - 2], S = n[n.length - 1], big = /큰 수를 구하세요/.test(t);
      return function (c) { var small = big ? (c - d) / k : c; return isInt(small) && small >= 1 && small + (k * small + d) === S; };
    },
    swap: function (n, t) {
      var s = /커요/.test(t) ? 1 : -1;
      return function (c) { return c >= 10 && c <= 99 && Math.floor(c / 10) === n[0] && c % 10 > 0 && (c % 10) * 10 + n[0] - c === s * n[1]; };
    },
    sumtimes: function (n) {
      return function (c) { var tens = Math.floor(c / 10), ones = c % 10; return c >= 10 && c <= 99 && ones - tens === n[0] && c === n[1] * (tens + ones) + (n[2] || 0); };
    },
    buy: function (n) { return function (c) { return n[0] * c + n[1] === n[2]; }; },
    change: function (n) { return function (c) { return n[1] - n[0] * c === n[2]; }; },
    two: function (n, t) {
      var first = /원인 (.+?)[과와] 한 /.exec(t)[1], asked = /었어요\. (.+?)[은는] 몇/.exec(t)[1], p = asked === first ? n[0] : n[1], e = asked === first ? n[1] : n[0];
      return function (c) { return c < n[2] && p * c + e * (n[2] - c) === n[3]; };
    },
    share: function (n, t) {
      var people = /학생은 모두 몇 명/.test(t) || /학생 \$x\$명/.test(t);
      return function (c) { return people ? n[0] * c + n[1] === n[2] * c - n[3] : isInt((c - n[1]) / n[0]) && (c - n[1]) / n[0] >= 1 && (c - n[1]) * n[2] === (c + n[3]) * n[0]; };
    },
    age: function (n) { return function (c) { return n[0] + c === n[2] * (n[1] + c); }; },
    save: function (n, t) { var k = /같아지는/.test(t) ? 1 : n[4]; return function (c) { return n[0] + n[2] * c === k * (n[1] + n[3] * c); }; },
    basic: function (n, t) {
      if (/거리는 몇/.test(t)) return function (c) { return c === n[0] * n[1]; };
      return function (c) { return n[0] * c === n[1]; };                         /* 속력 × 시간 = 거리 */
    },
    chase: function (n) { return function (c) { return n[1] * (c + n[0]) === n[2] * c; }; },
    meet: function (n) { return function (c) { return (n[1] + n[2]) * c === n[0]; }; },
    track: function (n, t) { var sameWay = /같은 방향/.test(t); return function (c) { return (sameWay ? Math.abs(n[2] - n[1]) : n[1] + n[2]) * c === n[0]; }; },
    round: function (n) { return function (c) { return c * n[1] + c * n[0] === n[2] * n[0] * n[1]; }; },
    late: function (n) { return function (c) { return c * n[1] - c * n[0] === n[2] * n[0] * n[1]; }; },
    longer: function (n) { return function (c) { return c * n[2] + (c + n[1]) * n[0] === n[3] * n[0] * n[2]; }; },
    salt: function (n) { return function (c) { return 100 * c === n[0] * n[1]; }; },
    conc: function (n) { return function (c) { return c * (n[0] + n[1]) === 100 * n[1]; }; },
    whole: function (n) { return function (c) { return n[1] * c === 100 * n[0]; }; },
    water: function (n) { return function (c) { return n[0] * n[1] === n[2] * (n[1] + c); }; },
    evap: function (n) { return function (c) { return c < n[1] && n[0] * n[1] === n[2] * (n[1] - c); }; },
    more: function (n) { return function (c) { return n[0] * n[1] + 100 * c === n[2] * (n[1] + c); }; },
    mixx: function (n) { return function (c) { return n[0] * c + n[1] * n[2] === n[3] * (c + n[2]); }; },
    mixtotal: function (n) { var mine = n[4] === n[0] ? n[0] : n[1], other = n[4] === n[0] ? n[1] : n[0]; return function (c) { return c < n[3] && mine * c + other * (n[3] - c) === n[2] * n[3]; }; },
    mixconc: function (n) { return function (c) { return n[0] * n[1] + n[2] * n[3] === c * (n[1] + n[3]); }; }
  };
  /** 조건에 맞는 자연수를 1 부터 차례로 찾는다 */
  var search = function (rule, upto) { var out = []; for (var c = 1; c <= upto; c++) if (rule(c)) out.push(c); return out; };
  var COUNT = { times: 3, both: 3, consec: 1, swap: 2, buy: 3, change: 3, two: 4, share: 4, age: 3, chase: 3, meet: 3, track: 3, round: 3, late: 3, longer: 4, salt: 2, conc: 2, whole: 2, water: 3, evap: 3, more: 3, mixx: 5, mixtotal: 5, mixconc: 4 };

  var detailed = function (id, p, where) {
    var h = MH.types[id].hints(p.v, p.ctx);
    ok(h.length >= 3 && h.every(function (t) { return t.length >= 30; }) && h.join('').length >= 180, where + '힌트가 짧음: ' + h.join(' / '));
    if (p.seed <= 80) noJosa(h.concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.mistakesFor(p).map(function (m) { return m.explain; })), where);
    /* 수식 끝의 숫자 바로 뒤에 오는 조사: 받침이 있는 숫자(0 1 3 6 7 8) 뒤에는 '은 · 이 · 이에요', 다만 ㄹ 받침(1 7 8) 뒤에는 '으로' 가 아니라 '로' */
    if (p.seed <= 200) h.concat(MH.types[id].steps(p.v).map(function (s) { return s.say; })).concat(MH.mistakesFor(p).map(function (m) { return m.explain; })).forEach(function (t) {
      var re = /(\d)\$(이에요|예요|은 |는 |이 |가 |으로 |로 |으로도|로도|이고|고,)/g, m;
      while ((m = re.exec(t))) {
        var closed = '013678'.indexOf(m[1]) >= 0, ro = /로/.test(m[2]), wantFirst = ro ? '036'.indexOf(m[1]) >= 0 : closed;
        ok((['이에요', '은 ', '이 ', '으로 ', '으로도', '이고'].indexOf(m[2]) >= 0) === wantFirst, where + '숫자 ' + m[1] + ' 뒤의 조사: ' + t);
      }
    });
  };

  group('B08 — 계산기로 해 구하기 자체 검사');
  var show = function (r) { return r ? r.n + '/' + r.d : 'null'; };
  eq([show(root('800x + 1500 = 5500')), show(root('\\dfrac{x}{3} + \\dfrac{x}{6} = 3')), show(root('\\dfrac{10}{100} \\times 200 = \\dfrac{8}{100} \\times (200 + x)')), show(root('40 + x = 3(10 + x)')), show(root('x + (x + 1) + (x + 2) = 24')), show(root('2x + 1 = 2x + 3'))].join(' '),
    '5/1 6/1 50/1 5/1 7/1 null', '해 구하기');
  eq(search(RULE.times([3, 5, 20], '3배에 5를 더하면 20'), 100).join() + ' ' + search(RULE.share([4, 6, 6, 2], '공책은 모두 몇 권'), 100).join() + ' ' + search(RULE.swap([4, 45], '커요'), 100).join(), '5 22 49', '넣어 보며 찾기');
  done('해 구하기 · 넣어 보며 찾기');

  group('B08 — 문제 글과 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var LEVELS = {
    'B08.number': ['both equal times', 'consec diff', 'sumtimes swap'],
    'B08.count': ['buy change', 'share two', 'age save'],
    'B08.speed': ['basic', 'chase meet track', 'late longer round'],
    'B08.mix': ['conc salt whole', 'evap more water', 'mixconc mixtotal mixx']
  };
  var UNITS = { 'B08.number': [''], 'B08.count': ['개', '권', '자루', '병', '장', '송이', '명', '년', '개월'], 'B08.speed': ['km', 'm', '시간', '분'], 'B08.mix': ['g', '%'] };
  Object.keys(LEVELS).forEach(function (id) {
    var def = MH.types[id], seen = [{}, {}, {}], derived = 0;
    each(id, function (p, pr, level, where) {
      var m = def.model(p.v), text = pr.text, n = nums(text), ans = p.answer, found, r, x, unit = def.answer.suffix(p.v);
      seen[level][m.kind] = 1;
      ok(!pr.tex && /(구하세요\.|까요\?)$/.test(text) && text.indexOf('$') < 0, where + '문제의 모양 ' + text);
      ok(UNITS[id].indexOf(unit) >= 0 && (unit === '' || text.indexOf('몇 ' + unit) >= 0), where + '단위 ' + unit + ' 가 물음과 맞지 않음: ' + text);
      if (COUNT[m.kind]) ok(n.length === COUNT[m.kind] || (m.kind === 'sumtimes' && n.length === 2), where + '글에 보이는 수의 개수 ' + n.join(',') + ' — ' + text);
      /* ① 글의 수만으로 조건에 맞는 자연수를 찾으면 답 하나뿐이다 */
      found = search(RULE[m.kind](n, text), Math.max(3 * ans + 50, 300));
      ok(found.length === 1 && found[0] === ans, where + '글의 조건에 맞는 수 [' + found.join(',') + '] ≠ 답 ' + ans + ' — ' + text);
      /* ② 방정식을 따로 풀면 x, 구하는 것을 나타낸 식에 넣으면 답 */
      r = root(m.eq);
      ok(!!r && r.d === 1n && r.n > 0n, where + '방정식 ' + m.eq + ' 의 해 ' + show(r));
      if (!r) return;
      x = calc(m.ansTex, { x: r });
      ok(x.d === 1n && Number(x.n) === ans, where + m.eq + ' → ' + m.ansTex + ' = ' + show(x) + ' ≠ 답 ' + ans);
      if (m.ansTex !== 'x') derived++;
      /* 풀이의 식은 모두 x 의 값에서 성립하고, 방정식을 그대로 보여 준다 */
      var steps = def.steps(p.v);
      ok(steps[1].tex === m.eq, where + '풀이의 둘째 줄이 방정식이 아님');
      steps.forEach(function (s) { if (s.tex) ok(holds(s.tex, r), where + '풀이의 식이 해에서 성립하지 않음 ' + s.tex); });
      ok(/^x = /.test(steps[m.ansTex === 'x' ? steps.length - 1 : steps.length - 2].tex) && steps[steps.length - 1].tex.split(' = ').pop() === String(ans), where + '풀이의 끝이 x = … 와 답이 아님');
      /* 셋째 힌트는 방정식을 보여 주되 답은 말하지 않는다 */
      var h = def.hints(p.v);
      ok(h[2].indexOf('$' + m.eq + '$') >= 0 && h.join(' ').indexOf('x = ' + r.n + '$') < 0, where + '셋째 힌트에 방정식이 없거나 해를 말함');
      detailed(id, p, where);
    });
    eq(seen.map(function (s) { return Object.keys(s).sort().join(' '); }).join(' / '), LEVELS[id].join(' / '), id + ': 단계마다 나오는 상황');
    ok(id === 'B08.speed' || derived >= (id === 'B08.mix' ? 50 : 200), id + ': 구하는 것이 x 가 아닌 문제 ' + derived + '개');
    done(def.title);
  });

  group('B08 — 식 세우기의 보기 (단계마다 1,000문제)');
  var setSeen = [{}, {}, {}], ids = {};
  each('B08.setup', function (p, pr, level, where) {
    var k = p.v.q.k, text = pr.text, n = nums(text.replace(/\$x\$/g, '')), opts = MH.optionsOf(p), found, x;
    setSeen[level][k] = 1;
    ok(!pr.tex && text.indexOf('$x$') >= 0 && /방정식으로 나타낸 것을 고르세요\.$/.test(text), where + '문제의 모양 ' + text);
    /* 글의 조건에 맞는 x 는 하나뿐이고, 그 값을 넣었을 때 성립하는 보기는 정답 하나뿐이다 */
    found = search(RULE[k](n, text), 1200);
    ok(found.length === 1, where + '글의 조건에 맞는 수 [' + found.join(',') + '] — ' + text);
    if (found.length !== 1) return;
    x = Q(BigInt(found[0]), 1n);
    ok(opts.length === 4 && opts.every(function (o, i) { return opts.indexOf(o) === i; }) && opts.indexOf(p.answer) >= 0, where + '보기는 서로 다른 네 개 ' + opts.join(' , '));
    opts.forEach(function (o) {
      var j = MH.judge(p, o);
      ok(holds(o, x) === (o === p.answer), where + '보기 ' + o + ' 의 참 · 거짓 (x = ' + found[0] + ') — ' + text);
      if (o === p.answer) ok(j.verdict === 'correct', where + '정답 보기가 정답으로 판정되지 않음');
      else { ok(j.verdict === 'wrong' && j.mistake && j.mistake.explain.length >= 30, where + '틀린 보기에 설명이 없음 ' + o); if (j.mistake) ids[j.mistake.id] = 1; }
    });
    /* 정답 보기는 일차방정식이고 그 해가 글에서 찾은 x 다 */
    var r = root(p.answer);
    ok(!!r && same(r, x), where + '정답 보기 ' + p.answer + ' 의 해 ' + show(r) + ' ≠ ' + found[0]);
    ok(MH.types['B08.setup'].hints(p.v).join(' ').indexOf(p.answer) < 0, where + '힌트가 정답 보기를 그대로 말함');
    detailed('B08.setup', p, where);
  });
  eq(setSeen.map(function (s) { return Object.keys(s).sort().join(' '); }).join(' / '), 'both equal times / age buy change / chase round share', '식 세우기: 단계마다 나오는 상황');
  eq(Object.keys(ids).length, 18, '식 세우기: 틀린 보기의 실수 종류');
  done('식 세우기');

  group('B08 — 흔한 실수와 풀이 · 힌트의 구체적인 예');
  var prob = function (type, q) { var v = { q: q }; return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var T = function (p) { return MH.types[p.type].prompt(p.v).text; };
  var says = function (p) { return MH.types[p.type].steps(p.v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  var texs = function (p) { return MH.types[p.type].steps(p.v).filter(function (s) { return s.tex; }).map(function (s) { return s.tex; }).join(' → '); };
  var U = function (p) { return p.answer + MH.types[p.type].answer.suffix(p.v); };

  var n1 = prob('B08.number', { k: 'times', a: 5, b: 5, x: 4 }), n2 = prob('B08.number', { k: 'consec', x: 7, step: 1, ask: 2 }), n3 = prob('B08.number', { k: 'swap', a: 4, x: 9 });
  eq(T(n1) + ' → ' + U(n1) + ' / ' + [J(n1, '4'), J(n1, '6'), J(n1, '20'), J(n1, '0'), J(n1, '')].join(' '), '어떤 수의 5배에 5를 더하면 25가 돼요. 어떤 수를 구하세요. → 4 / correct:- wrong:same-op wrong:half wrong:group invalid:-', '어떤 수');
  eq(texs(n1), '5x + 5 = 25 → 5x = 25 - 5 → 5x = 20 → x = \\dfrac{20}{5} = 4', '어떤 수의 풀이');
  eq(T(n2) + ' → ' + U(n2) + ' / ' + [J(n2, '9'), J(n2, '7'), J(n2, '8')].join(' '), '연속하는 세 자연수의 합이 24예요. 세 수 가운데 가장 큰 수를 구하세요. → 9 / correct:- wrong:which wrong:middle', '연속하는 세 자연수');
  eq(texs(n2), 'x + (x + 1) + (x + 2) = 24 → x + x + 1 + x + 2 = 24 → x + x + x = 24 - 1 - 2 → 3x = 21 → x = \\dfrac{21}{3} = 7 → x + 2 = 9', '연속하는 세 자연수의 풀이');
  eq(T(n3) + ' → ' + U(n3) + ' / ' + [J(n3, '49'), J(n3, '9'), J(n3, '94')].join(' '), '십의 자리 숫자가 4인 두 자리 자연수가 있어요. 이 수의 십의 자리 숫자와 일의 자리 숫자를 서로 바꾼 수는 처음 수보다 45만큼 커요. 처음 수를 구하세요. → 49 / correct:- wrong:digit wrong:swapped', '자릿수');
  eq(texs(n3), '10x + 4 = 40 + x + 45 → 10x - x = 40 + 45 - 4 → 9x = 81 → x = \\dfrac{81}{9} = 9 → 40 + x = 49', '자릿수의 풀이');

  var c1 = prob('B08.count', { k: 'buy', i: 0, p: 800, e: 1600, x: 5 }), c2 = prob('B08.count', { k: 'share', i: 2, a: 4, b: 6, x: 4, r: 6, ask: 1 }), c3 = prob('B08.count', { k: 'age', i: 0, kk: 3, f: 15, x: 5 });
  eq(T(c1) + ' → ' + U(c1) + ' / ' + [J(c1, '5'), J(c1, '7'), J(c1, '4000')].join(' '), '한 개에 800원인 빵 몇 개와 1600원짜리 우유 한 팩을 샀더니 모두 5600원이었어요. 빵은 몇 개 샀을까요? → 5개 / correct:- wrong:ignore-extra wrong:half', '물건값');
  eq(T(c2) + ' → ' + U(c2) + ' / ' + [J(c2, '22'), J(c2, '4'), J(c2, '14')].join(' '), '학생들에게 공책을 나누어 주려고 해요. 한 명에게 4권씩 주면 6권이 남고, 6권씩 주면 2권이 모자라요. 공책은 모두 몇 권일까요? → 22권 / correct:- wrong:which wrong:lack-plus', '나누어 주기');
  eq(texs(c2), '4x + 6 = 6x - 2 → 4x - 6x = -2 - 6 → -2x = -8 → x = \\dfrac{-8}{-2} = 4 → 4x + 6 = 22', '나누어 주기의 풀이');
  eq(T(c3) + ' → ' + U(c3) + ' / ' + [J(c3, '5'), J(c3, '15'), J(c3, '99')].join(' '), '올해 어머니는 40살이고 아들은 10살이에요. 어머니의 나이가 아들의 나이의 3배가 되는 것은 몇 년 뒤일까요? → 5년 / correct:- wrong:age-of wrong:-', '나이');
  eq(texs(c3), '40 + x = 3(10 + x) → 40 + x = 30 + 3x → x - 3x = 30 - 40 → -2x = -10 → x = \\dfrac{-10}{-2} = 5', '나이의 풀이');

  var s1 = prob('B08.speed', { k: 'round', i: 0, a: 3, b: 6, x: 6 }), s2 = prob('B08.speed', { k: 'chase', a: 60, b: 80, t: 10 }), s3 = prob('B08.speed', { k: 'basic', i: 0, ask: 'time', a: 60, t: 3 });
  eq(T(s1) + ' → ' + U(s1) + ' / ' + [J(s1, '6'), J(s1, '12')].join(' '), '집에서 공원까지 같은 길을 갈 때는 시속 3 km로, 올 때는 시속 6 km로 걸어서 다녀왔더니 모두 3시간이 걸렸어요. 집에서 공원까지의 거리는 몇 km일까요? → 6km / correct:- wrong:total', '갈 때와 올 때');
  eq(texs(s1), '\\dfrac{x}{3} + \\dfrac{x}{6} = 3 → 2x + x = 18 → 3x = 18 → x = \\dfrac{18}{3} = 6', '갈 때와 올 때의 풀이');
  eq(T(s2) + ' → ' + U(s2) + ' / ' + [J(s2, '30'), J(s2, '40')].join(' ') + ' / ' + texs(s2),
    '동생이 집을 나선 지 10분 뒤에 형이 같은 길로 동생을 따라나섰어요. 동생은 분속 60 m로 걷고 형은 분속 80 m로 따라가요. 형은 집을 나선 지 몇 분 뒤에 동생을 만날까요? → 30분 / correct:- wrong:from-first / 80x = 60(x + 10) → 80x = 60x + 600 → 80x - 60x = 600 → 20x = 600 → x = \\dfrac{600}{20} = 30', '따라잡기');
  eq(T(s3) + ' → ' + U(s3) + ' / ' + [J(s3, '3'), J(s3, '120')].join(' '), '자동차가 시속 60 km로 180 km를 달렸어요. 걸린 시간은 몇 시간일까요? → 3시간 / correct:- wrong:subtracted', '걸린 시간');

  var m1 = prob('B08.mix', { k: 'water', s: 0, a: 10, b: 8, M: 200 }), m2 = prob('B08.mix', { k: 'mixconc', s: 1, a: 10, b: 20, M: 300, N: 200 }), m3 = prob('B08.mix', { k: 'conc', s: 0, c: 10, M: 200 });
  eq(T(m1) + ' → ' + U(m1) + ' / ' + [J(m1, '50'), J(m1, '250'), J(m1, '20')].join(' '), '10 %의 소금물 200 g에 물을 더 넣어 8 %의 소금물을 만들려고 해요. 물을 몇 g 더 넣어야 할까요? → 50g / correct:- wrong:total wrong:salt', '물을 더 넣기');
  eq(texs(m1), '\\dfrac{10}{100} \\times 200 = \\dfrac{8}{100} \\times (200 + x) → 2000 = 8(200 + x) → 2000 = 1600 + 8x → -8x = 1600 - 2000 → -8x = -400 → x = \\dfrac{-400}{-8} = 50', '물을 더 넣기의 풀이');
  eq(T(m2) + ' → ' + U(m2) + ' / ' + [J(m2, '14'), J(m2, '15'), J(m2, '30')].join(' '), '10 %의 설탕물 300 g과 20 %의 설탕물 200 g을 섞으면 몇 %의 설탕물이 될까요? → 14% / correct:- wrong:avg wrong:sum', '섞은 뒤의 농도');
  eq(texs(m2).split(' → ').slice(1).join(' → '), '500x = 3000 + 4000 → 500x = 7000 → x = \\dfrac{7000}{500} = 14', '섞은 뒤의 농도의 풀이');
  eq(T(m3) + ' → ' + U(m3) + ' / ' + says(m3).split(' | ').slice(1).join(' | '), '물 180 g에 소금 20 g을 녹였어요. 이 소금물의 농도는 몇 %일까요? → 10% / 같은 양을 등호로 이어 방정식을 세워요. (농도) = (소금의 양) ÷ (소금물의 양) × 100 [x = \\dfrac{20}{180 + 20} \\times 100] | 소금물의 양은 물과 소금을 더한 것이에요. [x = \\dfrac{20}{200} \\times 100] | 분수를 계산해요. [x = 10]', '농도 구하기');

  var O = [0, 1, 2, 3];
  var e1 = prob('B08.setup', { k: 'age', i: 0, kk: 3, f: 15, x: 5, o: O }), e2 = prob('B08.setup', { k: 'round', a: 3, b: 6, x: 6, o: O });
  eq(T(e1) + ' → ' + MH.optionsOf(e1).join(' , ') + ' / ' + MH.optionsOf(e1).map(function (o) { return J(e1, o); }).join(' '),
    '올해 어머니는 40살, 아들은 10살이에요. $x$년 뒤에 어머니의 나이가 아들의 나이의 3배가 돼요. 이 관계를 방정식으로 나타낸 것을 고르세요. → 40 + x = 3(10 + x) , 40 + x = 30 + x , 40 = 3(10 + x) , 3(40 + x) = 10 + x / correct:- wrong:no-paren wrong:one-side wrong:reversed', '나이의 식 세우기');
  eq(MH.optionsOf(e2).join(' , '), '\\dfrac{x}{3} + \\dfrac{x}{6} = 3 , 3x + 6x = 3 , \\dfrac{2x}{3 + 6} = 3 , \\dfrac{3}{x} + \\dfrac{6}{x} = 3', '갈 때와 올 때의 식 세우기');
  eq(MH.judge(e2, '3x + 6x = 3').mistake.explain, '거리에 속력을 곱했어요. 시간은 (거리) ÷ (속력)이에요. 거리 $x$를 속력으로 나눈 분수 꼴로 써야 해요.', '틀린 보기의 설명');
  done('실수 · 풀이 · 힌트 예');
})();
