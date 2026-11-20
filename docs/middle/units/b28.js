/* B28 대푯값과 산포도 — 평균 · 중앙값 · 최빈값, 편차, 분산, 표준편차
   유형(쉬운 것부터): B28.mean 평균 (키패드, 자연수) · B28.median 중앙값 (키패드, 소수) · B28.mode 최빈값과 알맞은 대푯값 (4지선다)
                     · B28.deviation 편차 (키패드, 부호가 있는 정수) · B28.variance 분산과 표준편차 (키패드, 자연수) · B28.spread 산포도 읽기 (4지선다)
   모든 계산은 정수로 한다. 중앙값은 10배 한 정수(7.5 → 75)로 다루고, 근호가 든 표준편차는 (밖의 수, 근호 안의 수) 정수 쌍으로 다룬다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, abs = Math.abs, isInt = Number.isInteger, gcd = MH.gcd;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!(q && ok(q)) && ++i < 200); return q; };

  /* ── 틀: 보기 고르기. build(q) → { text, tex, ans, wrong: [[보기, 실수 id, 설명] × 3], hints, steps, check } ── */
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) { var p = P(v), list; if (!p || p.check !== true || p.wrong.length !== 3) return false; list = all(p); return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; }); };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B28', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; return out; },
      solve: function (v) { return P(v).ans; },
      verify: function (v, ans) { return good(v) && ans === P(v).ans && options(v).indexOf(ans) >= 0; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: p.ans }; return out; },
      mistakes: o.ids.map(function (id) {
        var find = function (v) { return P(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
        return { id: id, wrong: function (v) { var w = find(v); return w ? w[0] : null; }, explain: function (v) { var w = find(v); return w ? w[2] : ''; } };
      })
    });
  };
  /* ── 틀: 수 하나(키패드). build(q) → { text, ans, hints, steps, wrong: { 실수 id: 수 }, check }
     o.kind: 'int'(자연수) | 'signed'(부호가 있는 정수) | 'decimal'(소수. ans 와 wrong 은 10배 한 정수)
     틀린 답이 둘은 있어야 하고, 문제 글에 없는 정답이 힌트에 수로 나오면 거른다(자연수 답은 10 이상일 때만) ── */
  var numQ = function (o) {
    var kind = o.kind || 'int', lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (x) { return kind === 'signed' ? { n: x, p: 0 } : kind === 'decimal' ? MH.dec(x, 1) : x; };
    var show = function (x) { return kind === 'decimal' ? MH.decStr(MH.dec(x, 1).n, MH.dec(x, 1).p) : String(abs(x)); };
    var leak = function (p) { var a = kind === 'decimal' ? show(p.ans) : String(p.ans); return /^\d+$/.test(a) && !(kind === 'int' && p.ans < 10) && nums(p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    var okA = function (x) { return isInt(x) && (kind === 'signed' || x >= 1); };
    var okW = function (p, x) { return isInt(x) && (kind === 'signed' || x >= 0) && x !== p.ans; };
    var count = function (p) { var seen = []; o.mistakes.forEach(function (m) { var x = p.wrong[m[0]]; if (okW(p, x) && seen.indexOf(x) < 0) seen.push(x); }); return seen.length; };
    o.levels.forEach(function (lv) { lv.where = function (v) { var p = P(v); return !!p && okA(p.ans) && p.check === true && !leak(p) && count(p) >= 2; }; });
    MH.defineType({
      id: o.id, unit: 'B28', version: 1, title: o.title,
      answer: { kind: kind },
      levels: o.levels,
      prompt: function (v) { return { text: P(v).text }; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v), w = val(p.ans); return p.check === true && (kind === 'int' ? ans === w : ans.n === w.n && ans.p === w.p); },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), x = p.wrong[m[0]], i;
            if (!okW(p, x)) return null;
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) if (p.wrong[o.mistakes[i][0]] === x) return null;
            return val(x);
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  /* ── 공통 도구 ───────────────────────────────────────── */
  var E = function (n) { return pj(n, '이에요/예요'); };
  var nj = function (n, pair) { return n + pj(n, pair); };
  var sum = function (a) { var s = 0; a.forEach(function (x) { s += x; }); return s; };
  var asc = function (a) { return a.slice().sort(function (x, y) { return x - y; }); };
  var o4 = function (r) { return r.shuffle([0, 1, 2, 3]); };
  var half10 = function (a, b) { return (a + b) * 5; };
  var d10 = function (x) { var d = MH.dec(x, 1); return MH.decStr(d.n, d.p); };
  /** 중앙값의 10배 */
  var med10 = function (a) { var s = asc(a), n = s.length; return n % 2 ? s[(n - 1) / 2] * 10 : half10(s[n / 2 - 1], s[n / 2]); };
  var mth = function (a) { return a.map(function (x) { return '$' + x + '$'; }); };
  var addTex = function (a) { return a.map(function (x, i) { return i && x < 0 ? '(' + x + ')' : String(x); }).join(' + '); };
  var CTX = [
    { who: '학생', what: '턱걸이 기록', unit: '회', lo: 1, hi: 15 },
    { who: '학생', what: '한 달 동안 읽은 책의 수', unit: '권', lo: 1, hi: 12 },
    { who: '학생', what: '하루 수면 시간', unit: '시간', lo: 4, hi: 10 },
    { who: '학생', what: '쪽지 시험 점수', unit: '점', lo: 2, hi: 10 },
    { who: '학생', what: '일주일 동안의 운동 시간', unit: '시간', lo: 1, hi: 14 },
    { who: '학생', what: '윗몸 일으키기 기록', unit: '회', lo: 18, hi: 40 },
    { who: '선수', what: '한 경기 득점', unit: '점', lo: 4, hi: 24 },
    { who: '학생', what: '수학 점수', unit: '점', lo: 60, hi: 98 }];
  var SMALL = [0, 1, 2, 3, 4], MOST = [0, 1, 2, 3, 4, 5, 6], ALL = [0, 1, 2, 3, 4, 5, 6, 7];
  var dataText = function (c, n, items, sorted) { return '다음은 ' + c.who + ' ' + n + '명의 ' + josa(c.what, '을/를') + (sorted ? ' 작은 값부터 차례로 적은' : ' 조사한') + ' 자료예요(단위: ' + c.unit + '). [ ' + items.join(', ') + ' ]'; };
  var withX = function (d, i) { return d.map(function (x, k) { return k === i ? '$x$' : x; }); };
  var without = function (d, i) { return d.filter(function (x, k) { return k !== i; }); };
  var draw = function (r, c, n, ok) { return until(function () { var a = [], i; for (i = 0; i < n; i++) a.push(r.int(c.lo, c.hi)); return a; }, ok); };
  var spreadOut = function (a) { var s = asc(a); return s[0] !== s[s.length - 1]; };

  /* ── B28.mean 평균 ─────────────────────────────────────── */
  var MEAN_KEY = '평균은 자료의 값을 모두 더한 다음 자료의 개수로 나눈 값이에요. 높이가 서로 다른 모래 더미를 평평하게 고르는 것과 같아요. 많은 쪽에서 덜어 적은 쪽에 채워 주면 모두 같은 높이가 돼요. 그 똑같은 높이가 평균이에요.';
  var BACK_KEY = '평균을 알면 거꾸로 전체 합을 알 수 있어요. 평균은 (합) ÷ (개수)이니까 (합) = (평균) × (개수)예요. 모두가 평균만큼씩 똑같이 가졌다고 생각하고, 그만큼을 사람 수만큼 더하면 전체 합이에요.';
  var meanBuild = function (q) {
    var c = CTX[q.c], u = c.unit, d = q.d, n, s, m, w = {}, srt, x, T, O, a, b, p, k, ans, rest, grp;
    if (q.t === 'basic') {
      n = d.length; s = sum(d); m = s / n; srt = asc(d);
      w.sum = s; w.median = med10(d) % 10 === 0 ? med10(d) / 10 : null;
      w['count-off'] = s % (n - 1) === 0 ? s / (n - 1) : s % (n + 1) === 0 ? s / (n + 1) : null;
      w['mid-range'] = (srt[0] + srt[n - 1]) % 2 === 0 ? (srt[0] + srt[n - 1]) / 2 : null;
      return { text: dataText(c, n, d) + ' 이 자료의 평균을 구하세요.', ans: m, wrong: w, check: isInt(m) && m * n === s && spreadOut(d),
        hints: [MEAN_KEY,
          '① 자료의 값을 하나도 빠뜨리지 않고 모두 더해요: $' + d.join(' + ') + '$. ② 자료가 몇 개인지 세요. ' + josa(c.who, '이/가') + ' ' + n + '명이니까 값도 ' + n + '개예요. ③ ①에서 구한 합을 ' + nj(n, '으로/로') + ' 나눠요.',
          '값을 모두 더하면 ' + s + E(s) + '. 이 합을 ' + n + '명이 똑같이 나누어 가진다고 생각해요. $' + n + ' \\times \\square = ' + s + '$에서 $\\square$에 들어갈 수가 평균이에요.'],
        steps: [{ say: '자료의 값을 모두 더해요.', tex: d.join(' + ') + ' = ' + s }, { say: '합을 자료의 개수 ' + nj(n, '으로/로') + ' 나눠요.', tex: s + ' \\div ' + n + ' = ' + m }] };
    }
    if (q.t === 'missing') {
      n = d.length; x = d[q.i]; T = sum(d); m = T / n; O = T - x; rest = without(d, q.i);
      w.total = T; w['mean-itself'] = m; w['others-mean'] = O % (n - 1) === 0 ? O / (n - 1) : null; w['count-off'] = m * (n - 1) - O;
      return { text: dataText(c, n, withX(d, q.i)) + ' 이 자료의 평균이 ' + m + u + '일 때, $x$의 값을 구하세요.', ans: x, wrong: w, check: isInt(m) && spreadOut(d),
        hints: [BACK_KEY,
          '① 전체 합을 구해요: $' + m + ' \\times ' + n + '$. 평균 ' + nj(m, '을/를') + ' ' + n + '번 더한 것과 같아요. ② $x$가 아닌 나머지 값을 모두 더해요: $' + rest.join(' + ') + '$. ③ 전체 합에서 ②의 합을 빼면 $x$가 남아요.',
          '전체 합은 $' + m + ' \\times ' + n + ' = ' + T + '$' + pj(T, '이고/고') + ', $x$가 아닌 값 ' + (n - 1) + '개의 합은 ' + O + E(O) + '. 전체에서 나머지를 덜어 내면 남는 것이 $x$예요. 구한 값을 자료에 넣고 평균을 다시 내 보면 맞는지 확인할 수 있어요.'],
        steps: [{ say: '평균에 개수를 곱해 전체 합을 구해요.', tex: m + ' \\times ' + n + ' = ' + T }, { say: '$x$가 아닌 값을 모두 더해요.', tex: rest.join(' + ') + ' = ' + O }, { say: '전체 합에서 나머지의 합을 빼요.', tex: 'x = ' + T + ' - ' + O + ' = ' + x }] };
    }
    if (q.t === 'add') {
      n = q.n; m = q.m; x = q.v; T = n * m + x; ans = T / (n + 1);
      w['simple-average'] = (m + x) % 2 === 0 ? (m + x) / 2 : null; w.unchanged = m; w['not-recounted'] = T % n === 0 ? T / n : null; w.total = T;
      return { text: c.who + ' ' + n + '명의 ' + c.what + '의 평균은 ' + m + josa(u, '이에요/예요') + '. 여기에 ' + josa(c.what, '이/가') + ' ' + x + u + '인 ' + c.who + ' 한 명이 더 들어왔어요. ' + (n + 1) + '명의 평균을 구하세요.', ans: ans, wrong: w, check: isInt(ans) && x >= 1 && x !== m,
        hints: ['사람이 늘면 합과 개수가 둘 다 바뀌어요. 그래서 평균 ' + m + '에 새 값을 바로 섞어서 계산할 수 없어요. 먼저 평균을 전체 합으로 되돌려요. ' + n + '명이 똑같이 ' + m + u + '씩이라고 생각하면 합은 $' + m + ' \\times ' + n + '$' + E(n) + '.',
          '① 처음 ' + n + '명의 합을 구해요: $' + m + ' \\times ' + n + '$. ② 새로 들어온 한 명의 값 ' + nj(x, '을/를') + ' 더해서 ' + (n + 1) + '명의 합을 만들어요. ③ 그 합을 새 인원수로 나눠요.',
          '처음 ' + n + '명의 합은 ' + (n * m) + E(n * m) + '. 여기에 ' + nj(x, '을/를') + ' 더한 것이 ' + (n + 1) + '명의 합이에요. 나누는 수는 ' + nj(n, '이/가') + ' 아니라 한 명 늘어난 인원수라는 것에 주의해요.'],
        steps: [{ say: '처음 ' + n + '명의 합을 구해요.', tex: m + ' \\times ' + n + ' = ' + (n * m) }, { say: '새 값을 더해요.', tex: (n * m) + ' + ' + x + ' = ' + T }, { say: (n + 1) + '명으로 나눠요.', tex: T + ' \\div ' + (n + 1) + ' = ' + ans }] };
    }
    if (q.t === 'merge') {
      a = q.a; b = q.b; p = q.p; k = q.q; T = a * p + b * k; ans = T / (a + b); grp = c.who === '선수' ? '팀' : '모둠';
      w['simple-average'] = (p + k) % 2 === 0 ? (p + k) / 2 : null; w.total = T; w['not-weighted'] = p + k; w['not-recounted'] = T % 2 === 0 ? T / 2 : null;
      return { text: 'A ' + grp + ' ' + a + '명의 ' + c.what + '의 평균은 ' + p + u + ', B ' + grp + ' ' + b + '명의 평균은 ' + k + josa(u, '이에요/예요') + '. 두 ' + josa(grp, '을/를') + ' 합친 ' + (a + b) + '명의 평균을 구하세요.', ans: ans, wrong: w, check: isInt(ans) && a !== b && p !== k,
        hints: ['두 평균 ' + nj(p, '과/와') + ' ' + nj(k, '을/를') + ' 더해서 2로 나누면 안 돼요. 두 ' + grp + '의 사람 수가 달라서, 사람이 많은 쪽의 평균이 더 큰 힘을 가져요. 물 ' + a + '컵과 ' + b + '컵을 섞을 때 양이 많은 쪽의 온도에 더 가까워지는 것과 같아요.',
          '① A ' + grp + '의 합을 구해요: $' + p + ' \\times ' + a + '$. ② B ' + grp + '의 합을 구해요: $' + k + ' \\times ' + b + '$. ③ 두 합을 더해요. ④ 그 합을 전체 인원 ' + nj(a + b, '으로/로') + ' 나눠요.',
          'A ' + grp + '의 합은 ' + (a * p) + ', B ' + grp + '의 합은 ' + (b * k) + E(b * k) + '. 두 합을 더한 것이 ' + (a + b) + '명 전체의 합이에요. 나누는 수는 2가 아니라 전체 인원이에요.'],
        steps: [{ say: '각 ' + grp + '의 합을 구해요.', tex: p + ' \\times ' + a + ' = ' + (a * p) + ',\\quad ' + k + ' \\times ' + b + ' = ' + (b * k) }, { say: '두 합을 더해요.', tex: (a * p) + ' + ' + (b * k) + ' = ' + T }, { say: '전체 인원 ' + nj(a + b, '으로/로') + ' 나눠요.', tex: T + ' \\div ' + (a + b) + ' = ' + ans }] };
    }
    n = q.n; m = q.m; x = q.v; k = q.w; ans = m + (x - k) / n; T = n * m;
    w['not-divided'] = m + (x - k); w.unchanged = m; w.reversed = m - (x - k) / n; w.total = T - k + x;
    return { text: c.who + ' ' + n + '명의 ' + c.what + '의 평균을 구했더니 ' + m + josa(u, '이었어요/였어요') + '. 그런데 한 명의 값을 잘못 적은 것을 알았어요. 잘못 적은 값은 ' + k + u + ', 바른 값은 ' + x + josa(u, '이에요/예요') + '. 바르게 고친 평균을 구하세요.', ans: ans, wrong: w, check: isInt(ans) && ans >= 1 && x >= 1 && k >= 1 && x !== k,
      hints: ['값 하나가 바뀌면 전체 합이 그만큼 바뀌어요. 평균은 그 바뀐 양을 모든 사람이 똑같이 나누어 가진 만큼만 움직여요. 그래서 먼저 평균을 전체 합으로 되돌린 다음, 합을 고치고, 다시 인원수로 나눠요.',
        '① 잘못 구한 합을 되살려요: $' + m + ' \\times ' + n + '$. ② 이 합에서 잘못 적은 값 ' + nj(k, '을/를') + ' 빼고 바른 값 ' + nj(x, '을/를') + ' 더해요. ③ 고친 합을 ' + nj(n, '으로/로') + ' 나눠요.',
        '잘못 구한 합은 ' + T + E(T) + '. 바른 값은 잘못 적은 값보다 ' + abs(x - k) + '만큼 ' + (x > k ? '커요' : '작아요') + '. 그래서 합도 그만큼 ' + (x > k ? '늘어요' : '줄어요') + '. 고친 합을 ' + n + '명이 똑같이 나누어 가지면 돼요.'],
      steps: [{ say: '잘못 구한 합을 되살려요.', tex: m + ' \\times ' + n + ' = ' + T }, { say: '잘못 적은 값을 빼고 바른 값을 더해요.', tex: T + ' - ' + k + ' + ' + x + ' = ' + (T - k + x) }, { say: n + '명으로 나눠요.', tex: (T - k + x) + ' \\div ' + n + ' = ' + ans }] };
  };
  var meanData = function (r, list, lo, hi) { var c = r.pick(list), n = r.int(lo, hi); return { c: c, d: draw(r, CTX[c], n, function (a) { return sum(a) % n === 0 && spreadOut(a); }) }; };
  var meanUse = function (r) {
    var t = r.pick(['add', 'merge', 'fix']), ci = r.pick(MOST), c = CTX[ci], n, m, k;
    if (t === 'add') { n = r.int(3, 9); m = r.int(c.lo + 2, c.hi); k = r.pick([-2, -1, 1, 2, 3]); return { t: t, c: ci, n: n, m: m, v: m + k * (n + 1) }; }
    if (t === 'merge') return until(function () { return { t: t, c: ci, a: r.int(2, 8), b: r.int(2, 8), p: r.int(c.lo + 1, c.hi), q: r.int(c.lo + 1, c.hi) }; }, function (q) { return q.a !== q.b && q.p !== q.q && (q.a * q.p + q.b * q.q) % (q.a + q.b) === 0; });
    n = r.int(4, 6); m = r.int(c.lo + 3, c.hi - 1); k = r.pick([-2, -1, -1, 1, 1, 2]); return until(function () { var wv = r.int(c.lo, c.hi); return { t: t, c: ci, n: n, m: m, w: wv, v: wv + k * n }; }, function (q) { return q.v >= c.lo && q.v <= c.hi + 2; });
  };
  numQ({
    id: 'B28.mean', title: '평균', build: meanBuild,
    mistakes: [['sum', '값을 모두 더하기만 했어요. 평균은 그 합을 자료의 개수로 나눈 값이에요. 더한 다음 개수로 나누는 것까지 해야 해요.'],
      ['count-off', '자료의 개수를 잘못 세었어요. 값을 하나씩 짚어 가며 개수를 다시 세고, 그 수로 나누거나 곱해요.'],
      ['median', '중앙값을 답했어요. 중앙값은 크기 순서로 가운데에 있는 값이에요. 평균은 값을 모두 더해서 개수로 나눈 값이에요.'],
      ['mid-range', '가장 큰 값과 가장 작은 값만 더해서 2로 나눴어요. 평균은 양 끝의 두 값만이 아니라 모든 값을 더해서 개수로 나눠요.'],
      ['total', '전체 합을 답했어요. 합은 맞게 구했어요. 문제가 묻는 것이 무엇인지 다시 읽고 남은 계산을 마저 해요.'],
      ['mean-itself', '평균을 그대로 답했어요. $x$는 평균이 아닐 수 있어요. (합) = (평균) × (개수)로 전체 합을 구하고 나머지 값을 빼요.'],
      ['others-mean', '$x$가 아닌 값들의 평균을 답했어요. 평균에 개수를 곱해 전체 합을 구한 다음, 나머지 값의 합을 빼야 $x$가 나와요.'],
      ['simple-average', '두 수를 더해서 2로 나눴어요. 사람 수가 다르면 그렇게 할 수 없어요. 각각의 합을 구해 더한 다음 전체 인원으로 나눠요.'],
      ['unchanged', '처음 평균을 그대로 답했어요. 값이 더해지거나 바뀌면 합이 달라지니까 평균도 달라져요. 합을 새로 구해서 나눠요.'],
      ['not-recounted', '나누는 수가 틀렸어요. 합은 맞게 구했어요. 그 합을 바뀐 뒤의 전체 인원수로 나눠야 해요.'],
      ['not-weighted', '두 평균을 더하기만 했어요. 평균끼리 더한 값은 아무 뜻이 없어요. 각각의 합을 구해 더한 다음 전체 인원으로 나눠요.'],
      ['not-divided', '값이 바뀐 양을 평균에 그대로 더했어요. 바뀐 양은 모든 사람이 똑같이 나누어 가져요. 인원수로 나눈 만큼만 평균이 움직여요.'],
      ['reversed', '평균을 반대쪽으로 고쳤어요. 바른 값이 더 크면 평균이 커지고, 바른 값이 더 작으면 평균이 작아져요.']],
    levels: [
      { name: '평균 구하기', vars: { q: sampler(function (r) { var q = meanData(r, SMALL, 4, 6); q.t = 'basic'; return q; }) } },
      { name: '평균을 알 때 빠진 값 구하기', vars: { q: sampler(function (r) { var q = meanData(r, MOST, 4, 6); q.t = 'missing'; q.i = r.int(0, q.d.length - 1); return q; }) } },
      { name: '값이 더해지거나 바뀔 때의 평균', vars: { q: sampler(meanUse) } }
    ]
  });

  /* ── B28.median 중앙값 ─────────────────────────────────── */
  var MED_KEY = '중앙값은 자료를 작은 값부터 차례로 줄 세웠을 때 한가운데에 있는 값이에요. 키 순서로 한 줄로 선 사람들 가운데 딱 중간에 선 사람을 찾는 것과 같아요. 자료가 홀수 개이면 가운데 값이 하나이고, 짝수 개이면 가운데 두 값의 평균이 중앙값이에요.';
  var medBuild = function (q) {
    var c = CTX[q.c], u = c.unit, d = q.d, n = d.length, srt = asc(d), odd = n % 2 === 1, w = {}, a, b, ans, xi, other, M, m, x, expr;
    if (q.t === 'find') {
      ans = med10(d); a = srt[(n >> 1) - 1]; b = srt[n >> 1];
      w['not-sorted'] = odd ? d[(n - 1) / 2] * 10 : half10(d[n / 2 - 1], d[n / 2]);
      if (odd) w.position = (n + 1) * 5; else { w['lower-middle'] = a * 10; w['upper-middle'] = b * 10; w['not-halved'] = (a + b) * 10; }
      w.mean = (sum(d) * 10) % n === 0 ? sum(d) * 10 / n : null; w['mid-range'] = half10(srt[0], srt[n - 1]);
      return { text: dataText(c, n, d) + ' 이 자료의 중앙값을 구하세요.', ans: ans, wrong: w, check: w['not-sorted'] !== ans,
        hints: [MED_KEY,
          odd ? '① 자료를 작은 값부터 차례로 다시 적어요. 같은 값이 여러 번 나오면 나온 만큼 모두 적어요. ② 자료는 ' + n + '개예요. 앞에서부터 세어 ' + ((n + 1) / 2) + '번째가 한가운데예요. 그 앞과 뒤에 ' + ((n - 1) / 2) + '개씩 있어요. ③ 그 자리에 있는 값을 읽어요.'
            : '① 자료를 작은 값부터 차례로 다시 적어요. 같은 값이 여러 번 나오면 나온 만큼 모두 적어요. ② 자료는 ' + n + '개, 곧 짝수 개라서 한가운데 값이 하나로 정해지지 않아요. ' + (n / 2) + '번째와 ' + (n / 2 + 1) + '번째, 두 값이 가운데예요. ③ 그 두 값을 더해서 2로 나눠요.',
          '작은 값부터 차례로 적으면 이렇게 돼요: ' + srt.join(', ') + '. 양쪽 끝에서 하나씩 짝지어 지워 나가요. ' + (odd ? '마지막에 하나만 남는 값이 중앙값이에요.' : '가운데에 두 값이 남아요. 그 두 값의 평균, 곧 두 값의 딱 중간에 있는 수가 중앙값이에요.')],
        steps: [{ say: '작은 값부터 차례로 적어요.', tex: srt.join(',\\ ') }, odd ? { say: ((n + 1) / 2) + '번째 값이 중앙값이에요.', tex: d10(ans) } : { say: '가운데 두 값 ' + nj(a, '과/와') + ' ' + b + '의 평균을 구해요.', tex: '\\dfrac{' + a + ' + ' + b + '}{2} = ' + d10(ans) }] };
    }
    if (q.t === 'given') {
      xi = q.i; other = srt[xi === n / 2 ? n / 2 - 1 : n / 2]; M = half10(srt[n / 2 - 1], srt[n / 2]); x = srt[xi]; expr = xi < n / 2 ? 'x + ' + other : other + ' + x';
      w['median-itself'] = M; w['other-middle'] = other * 10; w.doubled = 2 * M; w['neighbor-mean'] = half10(srt[xi - 1], srt[xi + 1]);
      return { text: dataText(c, n, withX(srt, xi), true) + ' 이 자료의 중앙값이 ' + d10(M) + u + '일 때, $x$의 값을 구하세요.', ans: x * 10, wrong: w, check: !odd && (xi === n / 2 || xi === n / 2 - 1),
        hints: ['이미 작은 값부터 차례로 적혀 있으니 가운데 자리만 찾으면 돼요. 자료가 ' + n + '개, 곧 짝수 개라서 중앙값은 가운데 두 값의 평균이에요. 두 값의 평균을 안다는 것은 두 값의 합을 안다는 뜻이에요. 합은 평균의 2배예요.',
          '① 가운데 두 자리는 ' + (n / 2) + '번째와 ' + (n / 2 + 1) + '번째예요. 그 자리에 있는 것을 읽어요. 하나는 $x$이고 다른 하나는 수예요. ② 두 값의 평균이 중앙값이니까 식으로 쓰면 이렇게 돼요: $\\dfrac{' + expr + '}{2} = ' + d10(M) + '$. ③ 이 식의 양쪽에 2를 곱해요.',
          '$' + expr + '$의 값은 $2 \\times ' + d10(M) + '$의 값과 같아요. 곱셈을 먼저 한 다음, 거기에서 $x$의 짝인 수를 빼면 $x$예요. 구한 $x$가 왼쪽 값보다 작지 않고 오른쪽 값보다 크지 않은지도 확인해요.'],
        steps: [{ say: '가운데 두 값의 평균이 중앙값이에요.', tex: '\\dfrac{' + expr + '}{2} = ' + d10(M) }, { say: '양쪽에 2를 곱해요.', tex: expr + ' = ' + (M / 5) }, { say: '$x$의 짝인 수를 빼요.', tex: 'x = ' + (M / 5) + ' - ' + other + ' = ' + x }] };
    }
    xi = q.i; x = d[xi]; m = sum(d) / n; ans = med10(d);
    w['x-itself'] = x * 10; w.mean = m * 10; w['not-sorted'] = d[(n - 1) / 2] * 10; w['without-x'] = med10(without(d, xi));
    return { text: dataText(c, n, withX(d, xi)) + ' 이 자료의 평균이 ' + m + u + '일 때, 중앙값을 구하세요.', ans: ans, wrong: w, check: odd && isInt(m),
      hints: ['중앙값을 구하려면 모든 값을 알아야 해요. 그래서 평균을 써서 $x$부터 구해요. 평균은 (합) ÷ (개수)이니까 (합) = (평균) × (개수)예요. $x$를 구한 다음에 줄을 세워요.',
        '① 전체 합을 구해요: $' + m + ' \\times ' + n + '$. ② 여기에서 $x$가 아닌 값 ' + without(d, xi).join(', ') + '의 합을 빼면 $x$예요. ③ $x$를 넣은 ' + n + '개의 값을 작은 값부터 다시 적어요. ④ ' + ((n + 1) / 2) + '번째 값이 중앙값이에요.',
        '$x$를 구했다고 끝이 아니에요. 문제가 묻는 것은 중앙값이에요. $x$까지 넣은 ' + n + '개의 값을 작은 값부터 줄 세워요. 양쪽 끝에서 하나씩 짝지어 지우면 가운데에 하나가 남아요.'],
      steps: [{ say: '평균에 개수를 곱해 전체 합을 구해요.', tex: m + ' \\times ' + n + ' = ' + (m * n) }, { say: '나머지 값의 합을 빼서 $x$를 구해요.', tex: 'x = ' + (m * n) + ' - ' + (m * n - x) + ' = ' + x }, { say: '작은 값부터 차례로 적어요.', tex: srt.join(',\\ ') }, { say: ((n + 1) / 2) + '번째 값이 중앙값이에요.', tex: d10(ans) }] };
  };
  var medData = function (r, list, ns) { var c = r.pick(list), n = r.pick(ns); return { t: 'find', c: c, d: draw(r, CTX[c], n, spreadOut) }; };
  numQ({
    id: 'B28.median', title: '중앙값', kind: 'decimal', build: medBuild,
    mistakes: [['not-sorted', '크기 순서로 줄 세우지 않고 적힌 순서에서 가운데를 골랐어요. 중앙값은 먼저 작은 값부터 차례로 다시 적은 다음에 찾아요.'],
      ['lower-middle', '가운데 두 값 가운데 작은 쪽만 답했어요. 자료가 짝수 개이면 가운데 두 값을 더해서 2로 나눈 값이 중앙값이에요.'],
      ['upper-middle', '가운데 두 값 가운데 큰 쪽만 답했어요. 자료가 짝수 개이면 가운데 두 값을 더해서 2로 나눈 값이 중앙값이에요.'],
      ['not-halved', '가운데 두 값을 더하기만 했어요. 두 값의 평균이 중앙값이니까, 더한 다음 2로 나눠야 해요.'],
      ['position', '가운데 자리가 몇 번째인지를 답했어요. 중앙값은 자리 번호가 아니라 그 자리에 있는 값이에요.'],
      ['median-itself', '중앙값을 그대로 답했어요. 중앙값은 가운데 두 값의 평균이에요. $x$와 그 짝인 수의 합이 중앙값의 2배가 되도록 $x$를 정해요.'],
      ['other-middle', '가운데 자리에 있는 다른 수를 답했어요. 그 수와 $x$의 평균이 중앙값이에요. 합이 중앙값의 2배가 되도록 $x$를 구해요.'],
      ['doubled', '중앙값을 2배 하고 멈췄어요. 그 값은 가운데 두 값의 합이에요. 거기에서 $x$의 짝인 수를 빼야 $x$가 나와요.'],
      ['neighbor-mean', '$x$의 양옆에 있는 값의 평균을 답했어요. $x$가 꼭 양옆의 한가운데일 필요는 없어요. 중앙값이 얼마인지를 써서 구해요.'],
      ['x-itself', '$x$의 값을 답했어요. $x$는 맞게 구했어요. 문제가 묻는 것은 중앙값이니까, $x$를 넣고 크기 순서로 줄 세워 가운데 값을 찾아요.'],
      ['without-x', '$x$를 빼고 나머지 값만으로 중앙값을 구했어요. $x$도 자료의 값이에요. $x$를 먼저 구해서 함께 줄 세워요.'],
      ['mean', '평균을 답했어요. 평균은 모두 더해서 개수로 나눈 값이고, 중앙값은 크기 순서로 줄 세웠을 때 가운데에 있는 값이에요.'],
      ['mid-range', '가장 큰 값과 가장 작은 값의 한가운데 수를 답했어요. 중앙값은 양 끝 값의 중간이 아니라, 줄 세웠을 때 가운데 자리에 있는 값이에요.']],
    levels: [
      { name: '자료가 홀수 개일 때', vars: { q: sampler(function (r) { return medData(r, SMALL, [5, 5, 7]); }) } },
      { name: '자료가 짝수 개일 때', vars: { q: sampler(function (r) { return medData(r, MOST, [4, 6, 6]); }) } },
      { name: '모르는 값이 든 자료', vars: { q: sampler(function (r) {
        var ci = r.pick(MOST), c = CTX[ci], n;
        if (r.int(0, 1)) { n = r.pick([4, 6]); return { t: 'given', c: ci, d: draw(r, c, n, spreadOut), i: n / 2 - r.int(0, 1) }; }
        return { t: 'via', c: ci, d: draw(r, c, 5, function (a) { return sum(a) % 5 === 0 && spreadOut(a); }), i: r.int(0, 4) };
      }) } }
    ]
  });

  /* ── B28.mode 최빈값과 알맞은 대푯값 ───────────────────── */
  var MODE_KEY = '최빈값은 자료에서 가장 여러 번 나온 값이에요. 반에서 가장 많은 학생이 고른 급식 메뉴를 찾는 것과 같아요. 값이 큰지 작은지는 상관없고, 몇 번 나왔는지만 봐요. 가장 많이 나온 값이 둘이면 둘 다 최빈값이에요.';
  /** 값마다 나온 횟수: [[값, 횟수] …] (값이 작은 것부터) */
  var tally = function (d) { var out = []; asc(d).forEach(function (x) { var l = out[out.length - 1]; if (l && l[0] === x) l[1]++; else out.push([x, 1]); }); return out; };
  var pick3 = function (cands, pri, ans) { var out = [], seen = [ans]; pri.forEach(function (i) { var c = cands[i]; if (out.length < 3 && c && c[0] !== null && seen.indexOf(c[0]) < 0) { seen.push(c[0]); out.push(c); } }); return out; };
  var CAT = [
    { q: '좋아하는 과일', items: ['사과', '배', '귤', '포도', '딸기', '수박'] },
    { q: '좋아하는 운동', items: ['축구', '농구', '야구', '수영', '탁구', '배드민턴'] },
    { q: '가고 싶은 여행지', items: ['바다', '산', '도시', '섬', '온천'] },
    { q: '좋아하는 계절', items: ['봄', '여름', '가을', '겨울'] },
    { q: '즐겨 마시는 음료', items: ['물', '우유', '주스', '녹차', '커피'] },
    { q: '좋아하는 색', items: ['빨강', '파랑', '노랑', '초록', '보라'] }];
  var SHOP = [
    { shop: '신발 가게', item: '운동화', cnt: '켤레', attr: '크기' }, { shop: '옷 가게', item: '티셔츠', cnt: '벌', attr: '치수' },
    { shop: '모자 가게', item: '모자', cnt: '개', attr: '크기' }, { shop: '장갑 가게', item: '장갑', cnt: '켤레', attr: '크기' }, { shop: '옷 가게', item: '바지', cnt: '벌', attr: '치수' }];
  var OUT = [
    { who: '직원', what: '월급', unit: '만 원', lo: 210, hi: 290, far: [1200, 2500] }, { who: '학생', what: '한 달 용돈', unit: '만 원', lo: 3, hi: 9, far: [40, 80] },
    { who: '학생', what: '통학 시간', unit: '분', lo: 8, hi: 25, far: [90, 150] }, { who: '주민', what: '한 달 동안 읽은 책의 수', unit: '권', lo: 1, hi: 6, far: [40, 70] },
    { who: '회원', what: '하루 걸음 수', unit: '백 걸음', lo: 40, hi: 80, far: [300, 450] }];
  var REP = ['평균', '중앙값', '최빈값', '가장 큰 값'], REP_ID = ['mean', 'median', 'mode', 'max'];
  var REP_KEY = '대푯값은 자료 전체를 수 하나로 대표하는 값이에요. 평균은 모두 더해서 똑같이 나눈 값, 중앙값은 크기 순서로 줄 세웠을 때 가운데 값, 최빈값은 가장 많이 나온 값이에요. 자료의 모양과 알고 싶은 것에 따라 알맞은 대푯값이 달라요.';
  var modeBuild = function (q) {
    var c, d, n, tl, maxc, modes, ans, cands, M, m, others, second, names, cnt, top, least, N, why, s, i, far, srt, md, mn;
    if (q.t === 'num') {
      c = CTX[q.c]; d = q.d; n = d.length; tl = tally(d); maxc = Math.max.apply(null, tl.map(function (t) { return t[1]; }));
      modes = tl.filter(function (t) { return t[1] === maxc; }).map(function (t) { return t[0]; }); ans = modes.join(',\\ ');
      others = tl.filter(function (t) { return t[1] < maxc; }).sort(function (x, y) { return y[1] - x[1]; }); second = others.length ? others[0][0] : null;
      M = asc(d)[n - 1]; m = med10(d); mn = sum(d) % n === 0 ? sum(d) / n : null;
      cands = [
        [modes.indexOf(M) >= 0 ? null : String(M), 'biggest', '가장 큰 값을 골랐어요. 최빈값은 값이 큰 것이 아니라 가장 여러 번 나온 값이에요. 값마다 몇 번 나왔는지 세요.'],
        [String(maxc), 'count', '가장 많이 나온 횟수를 골랐어요. ' + maxc + '번은 횟수예요. 최빈값은 횟수가 아니라 그만큼 여러 번 나온 값 자체예요.'],
        [d10(m), 'median', '중앙값을 골랐어요. 중앙값은 크기 순서로 가운데에 있는 값이에요. 최빈값은 가장 여러 번 나온 값이에요.'],
        modes.length === 2 ? [String(modes[q.k % 2]), 'one-of-two', '최빈값을 하나만 골랐어요. 가장 많이 나온 값이 둘이면 둘 다 최빈값이에요. 두 값 모두 ' + maxc + '번씩 나왔어요.']
          : [second === null || others[0][1] < 2 ? null : asc([modes[0], second]).join(',\\ '), 'second', '최빈값이 아닌 값까지 함께 골랐어요. 가장 많이 나온 값만 최빈값이에요. 두 번째로 많이 나온 값은 최빈값이 아니에요.'],
        [mn === null ? null : String(mn), 'mean', '평균을 골랐어요. 평균은 모두 더해서 개수로 나눈 값이에요. 최빈값은 가장 여러 번 나온 값이에요.'],
        [modes.indexOf(asc(d)[0]) >= 0 ? null : String(asc(d)[0]), 'smallest', '가장 작은 값을 골랐어요. 최빈값은 값이 작은 것이 아니라 가장 여러 번 나온 값이에요. 값마다 몇 번 나왔는지 세요.']];
      return { text: dataText(c, n, d) + ' 이 자료의 최빈값을 고르세요.', ans: ans, wrong: pick3(cands, q.pri, ans), check: maxc >= 2 && modes.length <= 2 && others.length >= 1,
        hints: [MODE_KEY,
          '① 같은 값끼리 모아요. 작은 값부터 차례로 다시 적으면 같은 값이 나란히 놓여서 세기 쉬워요. ② 값마다 몇 번 나왔는지 세어 값 옆에 적어요. ③ 횟수가 가장 큰 값을 찾아요. 횟수가 똑같이 가장 큰 값이 둘이면 둘 다 골라요.',
          '작은 값부터 차례로 적으면 이렇게 돼요: ' + asc(d).join(', ') + '. 나란히 놓인 같은 값의 묶음 가운데 가장 긴 묶음을 찾아요. 답은 묶음의 길이가 아니라 그 묶음에 적힌 값이에요.'],
        steps: [{ say: '작은 값부터 차례로 적고, 값마다 나온 횟수를 세요.', tex: asc(d).join(',\\ ') }, { say: '가장 많이 나온 횟수는 ' + maxc + '번이에요. 그만큼 나온 값이 최빈값이에요.', tex: ans }] };
    }
    if (q.t === 'cat') {
      c = CAT[q.c]; names = q.names; cnt = q.cnt; N = sum(cnt); maxc = Math.max.apply(null, cnt);
      top = names.filter(function (x, k) { return cnt[k] === maxc; }); ans = top.join(', ');
      i = cnt.indexOf(Math.min.apply(null, cnt)); least = names[i];
      s = cnt.map(function (x, k) { return k; }).filter(function (k) { return cnt[k] < maxc; }).sort(function (x, y) { return cnt[y] - cnt[x]; });
      second = names.filter(function (x, k) { return cnt[k] === maxc || k === s[0]; }).join(', ');
      cands = [
        [maxc + '명', 'count', '가장 많은 사람 수를 골랐어요. ' + maxc + '명은 횟수예요. 최빈값은 그만큼 많은 사람이 고른 것, 곧 자료의 값 자체예요.'],
        [least, 'least', '가장 적게 나온 것을 골랐어요. 최빈값은 가장 많이 나온 값이에요. 사람 수가 가장 큰 것을 찾아요.'],
        ['없다', 'none', '수가 아닌 자료에는 최빈값이 없다고 생각했어요. 최빈값은 더하거나 줄 세우지 않고 세기만 하면 돼요. 그래서 수가 아닌 자료에서도 구할 수 있어요.'],
        top.length === 2 ? [top[q.k % 2], 'one-of-two', '최빈값을 하나만 골랐어요. 가장 많이 나온 것이 둘이면 둘 다 최빈값이에요. 두 가지 모두 ' + maxc + '명씩이에요.']
          : [top.length === 1 && s.length ? second : null, 'second', '최빈값이 아닌 것까지 함께 골랐어요. 가장 많이 나온 것만 최빈값이에요. 두 번째로 많은 것은 최빈값이 아니에요.'],
        [N + '명', 'total', '조사한 사람 수를 모두 더했어요. 최빈값은 사람 수의 합이 아니라, 가장 많은 사람이 고른 것이에요.']];
      return { text: '학생 ' + N + '명에게 ' + josa(c.q, '을/를') + ' 하나씩 물었더니 ' + names.map(function (x, k) { return x + ' ' + cnt[k] + '명'; }).join(', ') + '이었어요. 이 자료의 최빈값을 고르세요.', ans: ans, wrong: pick3(cands, q.pri, ans), check: top.length <= 2 && s.length >= 1 && ans.length <= 12,
        hints: [MODE_KEY,
          '이 자료의 값은 수가 아니라 「' + names[0] + '」, 「' + names[1] + '」 같은 낱말이에요. ' + names[0] + ' ' + cnt[0] + '명은 「' + names[0] + '」' + josa(names[0], '이라는/라는').slice(names[0].length) + ' 값이 자료에 ' + cnt[0] + '번 나왔다는 뜻이에요. ① 낱말마다 적힌 사람 수를 비교해요. ② 사람 수가 가장 큰 낱말을 찾아요.',
          '사람 수 ' + cnt.join(', ') + ' 가운데 가장 큰 수를 찾아요. 그 수가 붙어 있는 낱말이 최빈값이에요. 가장 큰 수가 두 군데에 있으면 두 낱말 모두 최빈값이에요. 답은 사람 수가 아니라 낱말이에요.'],
        steps: [{ say: '사람 수를 비교해요. 가장 큰 수는 ' + maxc + E(maxc) + '.', tex: cnt.join(',\\ ') }, { say: '가장 많은 사람이 고른 것이 최빈값이에요. 답은 「' + ans + '」.', tex: '' }] };
    }
    if (q.t === 'outlier') {
      c = OUT[q.c]; d = q.d; n = d.length; srt = asc(d); far = srt[n - 1];
      ans = '중앙값'; why = [
        '평균을 골랐어요. ' + far + '처럼 혼자 멀리 떨어진 값이 있으면 평균이 그쪽으로 끌려가요. 그러면 평균이 나머지 ' + (n - 1) + '개의 값과 동떨어져서 자료를 대표하지 못해요.', '',
        '최빈값을 골랐어요. 이 자료는 모든 값이 한 번씩만 나와요. 가장 많이 나온 값이 따로 없어서 최빈값으로는 자료를 대표할 수 없어요.',
        '가장 큰 값을 골랐어요. ' + nj(far, '은/는') + ' 혼자 멀리 떨어진 값이에요. 나머지 값과 너무 달라서 자료 전체를 대표하지 못해요.'];
      return { text: dataText(c, n, d) + ' 이 자료의 대푯값으로 가장 알맞은 것을 고르세요.', ans: ans, wrong: [0, 2, 3].map(function (k) { return [REP[k], REP_ID[k], why[k]]; }), check: tally(d).length === n && far > 3 * srt[n - 2],
        hints: [REP_KEY,
          '① 자료를 작은 값부터 훑어봐요. 대부분의 값은 서로 비슷한데, 하나만 유난히 큰 값이 있어요. ② 그 값까지 넣어서 모두 더하고 나누면 결과가 어느 쪽으로 쏠릴지 생각해요. ③ 줄 세워서 가운데 값을 고르면 그 큰 값의 영향을 받는지 생각해요.',
          '10명이 사는 마을에 큰 부자 한 명이 이사 오면 마을의 평균 재산은 크게 뛰지만, 가운데 사람의 재산은 거의 그대로예요. 이 자료에서도 ' + far + ' 하나가 그런 값이에요. 그런 값에 휘둘리지 않는 대푯값을 골라요.'],
        steps: [{ say: '작은 값부터 적으면 ' + far + ' 하나만 다른 값과 멀리 떨어져 있어요.', tex: srt.join(',\\ ') }, { say: '평균은 그 값 쪽으로 끌려가요. 가운데 값은 거의 영향을 받지 않아요.', tex: '' }] };
    }
    if (q.t === 'popular') {
      c = SHOP[q.c]; ans = '최빈값'; why = [
        '평균을 골랐어요. ' + c.attr + '의 평균은 실제로는 한 번도 팔리지 않은 ' + c.attr + '일 수 있어요. 알고 싶은 것은 가장 많이 팔린 ' + c.attr + '예요.',
        '중앙값을 골랐어요. 크기 순서로 가운데에 있는 ' + josa(c.attr, '이/가') + ' 가장 많이 팔린 ' + josa(c.attr, '은/는') + ' 아니에요. 알고 싶은 것은 가장 많이 팔린 ' + c.attr + '예요.', '',
        '가장 큰 값을 골랐어요. ' + c.attr + '가 가장 큰 ' + josa(c.item, '이/가') + ' 가장 많이 팔리는 것은 아니에요. 알고 싶은 것은 가장 많이 팔린 ' + c.attr + '예요.'];
      return { text: '어느 ' + c.shop + '에서 지난달에 팔린 ' + c.item + ' ' + q.n + c.cnt + '의 ' + josa(c.attr, '을/를') + ' 조사했어요. 다음 달에 가장 많이 준비할 ' + josa(c.attr, '을/를') + ' 정하려고 해요. 이때 가장 알맞은 대푯값을 고르세요.', ans: ans, wrong: [0, 1, 3].map(function (k) { return [REP[k], REP_ID[k], why[k]]; }), check: true,
        hints: [REP_KEY,
          '① 가게 주인이 알고 싶은 것이 무엇인지 생각해요. 손님이 가장 많이 찾는 ' + c.attr + '예요. ② 「가장 많이」라는 말에 맞는 대푯값이 무엇인지 떠올려요. ③ ' + c.attr + '를 모두 더해서 나눈 값이 가게 주인에게 쓸모가 있을지도 생각해 봐요.',
          '팔린 ' + josa(c.item, '을/를') + ' ' + c.attr + '별로 쌓아 놓았다고 생각해요. 가장 높이 쌓인 더미의 ' + c.attr + '를 가장 많이 준비해야 해요. 가장 높은 더미, 곧 가장 여러 번 나온 값을 가리키는 대푯값을 골라요.'],
        steps: [{ say: '알고 싶은 것은 가장 많이 팔린 ' + c.attr + '예요.', tex: '' }, { say: '가장 여러 번 나온 값을 나타내는 대푯값을 골라요.', tex: '' }] };
    }
    if (q.t === 'words') {
      c = CAT[q.c]; ans = '최빈값'; why = [
        '평균을 골랐어요. 「' + q.names[0] + '」, 「' + q.names[1] + '」 같은 낱말은 더하거나 나눌 수 없어요. 그래서 평균을 구할 수 없어요. 셀 수만 있으면 되는 대푯값을 골라요.',
        '중앙값을 골랐어요. 「' + q.names[0] + '」, 「' + q.names[1] + '」 같은 낱말은 크기 순서로 줄 세울 수 없어요. 그래서 중앙값을 구할 수 없어요.', '',
        '가장 큰 값을 골랐어요. 「' + q.names[0] + '」, 「' + q.names[1] + '」 같은 낱말에는 크고 작음이 없어요. 셀 수만 있으면 되는 대푯값을 골라요.'];
      return { text: '학생 ' + sum(q.cnt) + '명에게 ' + josa(c.q, '을/를') + ' 하나씩 물었더니 ' + q.names.map(function (x, k) { return x + ' ' + q.cnt[k] + '명'; }).join(', ') + '이었어요. 이 자료에서 구할 수 있는 대푯값을 고르세요.', ans: ans, wrong: [0, 1, 3].map(function (k) { return [REP[k], REP_ID[k], why[k]]; }), check: true,
        hints: [REP_KEY,
          '① 이 자료의 값이 수인지 낱말인지 봐요. 값은 「' + q.names[0] + '」, 「' + q.names[1] + '」 같은 낱말이에요. ② 낱말끼리 더할 수 있는지, 크기 순서로 줄 세울 수 있는지 생각해요. ③ 더하지도 줄 세우지도 않고 구할 수 있는 대푯값을 찾아요.',
          '낱말로 된 자료에서 할 수 있는 일은 「몇 번 나왔는지 세기」뿐이에요. 세기만 해서 구하는 대푯값이 무엇인지 떠올려요. 낱말 옆에 적힌 사람 수는 자료의 값이 아니라 그 낱말이 나온 횟수예요: ' + q.cnt.join(', ') + '.'],
        steps: [{ say: '자료의 값이 낱말이라서 더하거나 줄 세울 수 없어요.', tex: '' }, { say: '몇 번 나왔는지 세기만 하면 되는 대푯값을 골라요.', tex: '' }] };
    }
    c = CTX[q.c]; d = q.d; n = d.length; ans = '평균'; why = ['',
      '중앙값을 골랐어요. 중앙값은 크기 순서로 가운데에 있는 값 하나만 봐요. 모든 값을 더해서 똑같이 나눈 값은 평균이에요.',
      '최빈값을 골랐어요. 최빈값은 가장 여러 번 나온 값이에요. 모든 값을 더해서 똑같이 나눈 값은 평균이에요.',
      '가장 큰 값을 골랐어요. 똑같이 나누면 많은 쪽은 줄고 적은 쪽은 늘어요. 그래서 가장 큰 값보다 작아져요. 그 값은 평균이에요.'];
    return { text: dataText(c, n, d) + ' ' + n + '명의 값을 모두 모아서 한 명 한 명에게 똑같이 다시 나누어 준다면 한 명의 몫은 얼마일까요? 이 몫을 나타내는 대푯값을 고르세요.', ans: ans, wrong: [1, 2, 3].map(function (k) { return [REP[k], REP_ID[k], why[k]]; }), check: spreadOut(d),
      hints: [REP_KEY,
        '① 「모두 모은다」는 것은 값을 전부 더한다는 뜻이에요. ② 「' + n + '명에게 똑같이 나누어 준다」는 것은 그 합을 ' + nj(n, '으로/로') + ' 나눈다는 뜻이에요. ③ 더한 다음 개수로 나누는 대푯값이 무엇인지 떠올려요.',
        '세 대푯값이 만들어지는 방법을 견줘 봐요. 하나는 줄을 세워서 가운데를 고르고, 하나는 가장 여러 번 나온 것을 고르고, 하나는 모두 더해서 개수로 나눠요. 문제의 「모아서 똑같이 나누기」와 같은 방법을 찾아요.'],
      steps: [{ say: '모두 모으면 합이에요.', tex: d.join(' + ') + ' = ' + sum(d) }, { say: '합을 ' + n + '명에게 똑같이 나누는 것은 합을 개수로 나누는 것이에요.', tex: '' }] };
  };
  var pri5 = function (r) { return r.shuffle([0, 1, 2, 3, 4]); }, pri6 = function (r) { return r.shuffle([0, 1, 2, 3, 4, 5]); };
  var catQ = function (r, t) {
    var ci = r.int(0, CAT.length - 1), names = r.shuffle(CAT[ci].items.slice()).slice(0, 4), cnt = [], i;
    for (i = 0; i < 4; i++) cnt.push(r.int(1, 9));
    if (r.int(0, 3) === 0) cnt[r.int(0, 3)] = Math.max.apply(null, cnt);
    return { t: t, c: ci, names: names, cnt: cnt, pri: pri5(r), k: r.int(0, 1), o: o4(r) };
  };
  choiceQ({
    id: 'B28.mode', title: '최빈값과 알맞은 대푯값', build: modeBuild,
    ids: ['biggest', 'count', 'median', 'one-of-two', 'second', 'mean', 'smallest', 'least', 'none', 'total', 'mode', 'max'],
    levels: [
      { name: '최빈값 구하기', vars: { q: sampler(function (r) { var ci = r.pick([1, 2, 3]), n = r.int(7, 9); return { t: 'num', c: ci, d: draw(r, CTX[ci], n, spreadOut), pri: pri6(r), k: r.int(0, 1), o: o4(r) }; }) } },
      { name: '수가 아닌 자료의 최빈값', vars: { q: sampler(function (r) { return catQ(r, 'cat'); }) } },
      { name: '알맞은 대푯값 고르기', vars: { q: sampler(function (r) {
        var t = r.pick(['outlier', 'outlier', 'popular', 'words', 'share', 'share']), ci, c, d, q;
        if (t === 'outlier') { ci = r.int(0, OUT.length - 1); c = OUT[ci]; d = draw(r, c, r.int(4, 6), function (a) { return tally(a).length === a.length; }); d[r.int(0, d.length - 1)] = r.int(c.far[0], c.far[1]); return { t: t, c: ci, d: d, o: o4(r) }; }
        if (t === 'popular') return { t: t, c: r.int(0, SHOP.length - 1), n: r.int(30, 200), o: o4(r) };
        if (t === 'words') { q = catQ(r, t); return q; }
        ci = r.pick(SMALL); return { t: t, c: ci, d: draw(r, CTX[ci], r.int(4, 6), spreadOut), o: o4(r) };
      }) } }
    ]
  });

  /* ── 편차 묶음 ───────────────────────────────────────────
     합이 0 이고 분산이 자연수인 편차 묶음(절댓값 6 이하)을 개수별로 한 번만 만들어 둔다 */
  var POOL = {};
  var isSq = function (x) { var k = 0; while (k * k < x) k++; return k * k === x; };
  var root = function (x) { var k = 0; while (k * k < x) k++; return k; };
  var KEEP = { any: function (V) { return V <= 20; }, sq: function (V) { return V >= 4 && V <= 25 && isSq(V); }, nonsq: function (V) { return V >= 2 && V <= 24 && !isSq(V); } };
  var devPool = function (n, key) {
    var id = n + key, out = [], cur = [], go;
    if (POOL[id]) return POOL[id];
    go = function (k, lo, s, ss) {
      var x;
      if (k === n) { if (s === 0 && ss > 0 && ss % n === 0 && KEEP[key](ss / n)) out.push(cur.slice()); return; }
      for (x = lo; x <= 6; x++) { cur.push(x); go(k + 1, x, s + x, ss + x * x); cur.pop(); }
    };
    go(0, -6, 0, 0);
    return (POOL[id] = out);
  };
  var devs = function (r, ns, key) { return r.shuffle(r.pick(devPool(r.pick(ns), key)).slice()); };
  /** 편차 묶음에 평균을 더해 자료로 만들 때 쓸 상황과 평균. 모든 값이 그 상황의 범위(lo ~ hi) 안에 들게 고른다 */
  var fit = function (r, d) {
    var mn = Math.min.apply(null, d), mx = Math.max.apply(null, d), ok = ALL.filter(function (i) { return CTX[i].hi - mx >= CTX[i].lo - mn; }), ci = r.pick(ok);
    return { c: ci, m: r.int(CTX[ci].lo - mn, CTX[ci].hi - mx) };
  };
  var sq = function (x) { return (x < 0 ? '(' + x + ')' : x) + '^{2}'; };
  var absSum = function (a) { return sum(a.map(abs)); };
  var devText = function (items) { return '다음은 어떤 자료의 편차를 모두 적은 것이에요. [ ' + items.join(', ') + ' ]'; };

  /* ── B28.deviation 편차 ────────────────────────────────── */
  var DEV_KEY = '편차는 변량에서 평균을 뺀 값이에요. 변량은 자료의 값 하나하나를 말해요. 평균을 기준선으로 삼아서 그 값이 기준선보다 얼마나 위에 있는지, 아래에 있는지를 나타내요. 바다의 수면을 기준으로 산의 높이는 +, 바닷속 깊이는 −로 적는 것과 같아요.';
  var ZERO_KEY = '편차를 모두 더하면 언제나 영이 돼요. 평균은 자료를 평평하게 고른 높이예요. 그래서 평균보다 높은 쪽에서 남는 양과 낮은 쪽에서 모자란 양이 정확히 같아요. 양수인 편차의 합과 음수인 편차의 합이 서로를 지워요.';
  var devBuild = function (q) {
    var c = CTX[q.c], u = c.unit, d = q.d, n = d ? d.length : 0, w = {}, v, m, s, x, S, rest, dv, big;
    if (q.t === 'given' || q.t === 'compute') {
      s = sum(d); m = s / n; v = d[q.i]; big = v > m;
      w.reversed = m - v; w['value-itself'] = v; w['mean-itself'] = m; w['median-based'] = q.t === 'compute' && (v * 10 - med10(d)) % 10 === 0 ? v - med10(d) / 10 : null;
      return { text: dataText(c, n, d) + (q.t === 'given' ? ' 이 자료의 평균은 ' + m + josa(u, '이에요/예요') + '.' : '') + ' 값이 ' + v + u + '인 변량의 편차를 구하세요.', ans: v - m, wrong: w, check: isInt(m) && v !== m,
        hints: q.t === 'given' ? [DEV_KEY,
          '① 편차를 구할 변량은 ' + v + ', 평균은 ' + m + E(m) + '. ② (편차) = (변량) − (평균)이에요. 이 차례대로 쓰면 $' + v + ' - ' + m + '$' + E(m) + '. 순서를 바꾸면 부호가 반대가 돼요. ③ 변량이 평균보다 ' + (big ? '크면 답은 양수' : '작으면 답은 음수') + '예요.',
          '수직선 위에서 평균 ' + m + '의 자리에 서서 ' + nj(v, '을/를') + ' 바라봐요. ' + nj(v, '은/는') + ' ' + m + '의 ' + (big ? '오른쪽, 곧 큰 쪽' : '왼쪽, 곧 작은 쪽') + '에 있어요. 그래서 편차의 부호는 ' + (big ? '+' : '−') + '예요. 편차의 크기는 두 수 사이의 거리예요.']
          : ['편차를 구하려면 평균부터 알아야 해요. 편차는 변량에서 평균을 뺀 값이에요. 평균을 기준선으로 삼아서 그 값이 기준선보다 위에 있으면 +, 아래에 있으면 −로 나타내요. 평균은 값을 모두 더해서 개수로 나눈 값이에요.',
            '① 값을 모두 더해요: $' + d.join(' + ') + '$. ② 그 합을 ' + nj(n, '으로/로') + ' 나눠서 평균을 구해요. ③ (편차) = (변량) − (평균)이에요. ' + v + '에서 평균을 빼요. 순서를 바꾸면 부호가 반대가 돼요.',
            '값을 모두 더하면 ' + s + E(s) + '. 이 합을 ' + n + '명이 똑같이 나눈 것이 평균이에요. 평균이 ' + v + '보다 크면 편차는 음수이고, ' + v + '보다 작으면 편차는 양수예요. 빼는 순서는 언제나 「변량 − 평균」이에요.'],
        steps: (q.t === 'compute' ? [{ say: '평균을 구해요.', tex: '(' + d.join(' + ') + ') \\div ' + n + ' = ' + m }] : []).concat([{ say: '(편차) = (변량) − (평균)이에요.', tex: v + ' - ' + m }, { say: '계산해요. 변량이 평균보다 ' + (big ? '커서 양수' : '작아서 음수') + '예요.', tex: String(v - m) }]) };
    }
    if (q.t === 'zero' || q.t === 'table') {
      x = d[q.i]; rest = without(d, q.i); S = sum(rest); m = q.m;
      if (q.t === 'zero') { w['not-negated'] = S; w['ignored-signs'] = -absSum(rest); w['abs-sum'] = absSum(rest); w.zero = 0; }
      else { w['deviation-itself'] = x; w.reversed = m - x; w['mean-itself'] = m; }
      return { text: '다음은 ' + c.who + ' ' + n + '명의 ' + c.what + '의 편차를 차례로 적은 것이에요(단위: ' + u + '). [ ' + mth(withX(d, q.i).map(function (t) { return t === '$x$' ? 'x' : t; })).join(', ') + ' ] ' + (q.t === 'zero' ? '$x$의 값을 구하세요.' : '평균이 ' + m + u + '일 때, 편차가 $x$' + u + '인 ' + c.who + '의 ' + josa(c.what, '을/를') + ' 구하세요.'),
        ans: q.t === 'zero' ? x : m + x, wrong: w, check: sum(d) === 0 && x !== 0 && (q.t === 'zero' || d.every(function (t) { return m + t >= 1; })),
        hints: [ZERO_KEY,
          '① $x$가 아닌 편차를 부호까지 그대로 모두 더해요: $' + addTex(rest) + '$. ② 그 합에 $x$를 더하면 영이 되어야 해요. ③ 그러니 $x$는 ①의 합과 크기가 같고 부호가 반대인 수예요.' + (q.t === 'table' ? ' ④ (변량) = (평균) + (편차)이니까 평균 ' + m + '에 $x$를 더해요.' : ''),
          q.t === 'zero' ? '나머지 편차를 더할 때는 양수는 양수끼리, 음수는 음수끼리 먼저 모으면 쉬워요. 그렇게 구한 합이 양수이면 $x$는 음수이고, 합이 음수이면 $x$는 양수예요. 크기는 같아요. 부호를 뒤집는 것을 잊지 않아요.'
            : '$x$를 구하고 멈추면 안 돼요. 문제가 묻는 것은 편차가 아니라 실제 값이에요. $x$가 양수이면 평균 ' + m + '보다 그만큼 큰 값이고, $x$가 음수이면 평균 ' + m + '보다 그만큼 작은 값이에요.'],
        steps: [{ say: '$x$가 아닌 편차를 모두 더해요.', tex: addTex(rest) + ' = ' + S }, { say: '편차의 합이 0이 되도록 $x$를 정해요. $x$는 나머지 편차의 합과 부호가 반대예요.', tex: 'x = ' + x }].concat(q.t === 'table' ? [{ say: '평균에 편차를 더해요.', tex: m + ' + ' + (x < 0 ? '(' + x + ')' : x) + ' = ' + (m + x) }] : []) };
    }
    m = q.m; dv = q.dv; big = dv > 0;
    w.reversed = m - dv; w['deviation-itself'] = dv; w['mean-itself'] = m;
    return { text: c.who + '들의 ' + c.what + '의 평균은 ' + m + josa(u, '이에요/예요') + '. 이 가운데 편차가 $' + dv + '$' + u + '인 ' + c.who + '의 ' + josa(c.what, '을/를') + ' 구하세요.', ans: m + dv, wrong: w, check: m + dv >= 1 && dv !== 0,
      hints: ['편차는 (변량) − (평균)이에요. 이 식을 거꾸로 쓰면 (변량) = (평균) + (편차)예요. 평균이라는 기준선에서 편차만큼 올라가거나 내려간 곳이 그 변량이에요. 편차가 양수이면 평균보다 큰 값이고, 음수이면 평균보다 작은 값이에요.',
        '① 평균은 ' + m + ', 편차는 $' + dv + '$' + E(dv) + '. ② 이번 편차는 ' + (big ? '양수' : '음수') + '예요. 그러니 답은 평균 ' + m + '보다 ' + (big ? '큰' : '작은') + ' 값이에요. ③ $' + m + ' + ' + (big ? dv : '(' + dv + ')') + '$의 값을 계산해요.',
        '수직선 위에서 평균 ' + m + '의 자리에 서요. 편차가 ' + (big ? '양수' : '음수') + '이니까 ' + (big ? '오른쪽, 곧 큰 쪽' : '왼쪽, 곧 작은 쪽') + '으로 ' + abs(dv) + '칸 움직여요. 도착한 곳의 수가 답이에요. 답에서 평균을 빼면 다시 편차가 나오는지 확인해요.'],
      steps: [{ say: '(변량) = (평균) + (편차)예요.', tex: m + ' + ' + (big ? dv : '(' + dv + ')') }, { say: '계산해요.', tex: String(m + dv) }] };
  };
  var looseDevs = function (r) {
    return until(function () { var n = r.int(4, 6), a = [], i; for (i = 1; i < n; i++) a.push(r.int(-5, 5)); a.push(-sum(a)); return r.shuffle(a); },
      function (a) { return a.every(function (x) { return abs(x) <= 6; }) && a.filter(function (x) { return x !== 0; }).length >= a.length - 1; });
  };
  var xAt = function (r, d) { var i = r.int(0, d.length - 1), k = 0; while (d[i] === 0 && k++ < 9) i = (i + 1) % d.length; return i; };
  numQ({
    id: 'B28.deviation', title: '편차', kind: 'signed', build: devBuild,
    mistakes: [['reversed', '빼는 순서가 반대예요. 편차는 (변량) − (평균)이에요. 평균보다 큰 값은 편차가 양수이고, 평균보다 작은 값은 편차가 음수예요.'],
      ['not-negated', '나머지 편차의 합을 그대로 답했어요. 편차를 모두 더하면 0이어야 해요. 그래서 $x$는 나머지 합과 크기가 같고 부호가 반대예요.'],
      ['ignored-signs', '편차의 부호를 떼고 더했어요. 편차는 부호까지 그대로 더해요. 양수와 음수가 서로 지워진 뒤에 남는 것으로 $x$를 정해요.'],
      ['abs-sum', '편차의 부호를 떼고 더했어요. 편차는 부호까지 그대로 더해요. 그렇게 구한 합과 부호가 반대인 수가 $x$예요.'],
      ['zero', '$x$를 0이라고 답했어요. 0이 되는 것은 $x$가 아니라 편차를 모두 더한 값이에요. 나머지 편차의 합을 지워 주는 수가 $x$예요.'],
      ['deviation-itself', '편차를 그대로 답했어요. 편차는 평균과의 차이일 뿐이에요. 실제 값은 평균에 편차를 더해야 나와요.'],
      ['value-itself', '변량을 그대로 답했어요. 편차는 그 값이 평균에서 얼마나 떨어져 있는지예요. 변량에서 평균을 빼요.'],
      ['mean-itself', '평균을 그대로 답했어요. 문제가 묻는 것은 평균이 아니에요. 변량과 평균과 편차 사이의 관계 (편차) = (변량) − (평균)을 써서 구해요.'],
      ['median-based', '평균 대신 중앙값을 빼서 구했어요. 편차의 기준은 언제나 평균이에요. 값을 모두 더해서 개수로 나눈 평균을 빼요.']],
    levels: [
      { name: '편차 구하기', vars: { q: sampler(function (r) {
        var ci = r.pick(MOST), c = CTX[ci], n = r.int(4, 6), d = draw(r, c, n, function (a) { return sum(a) % n === 0 && spreadOut(a); }), m = sum(d) / n, i = r.int(0, n - 1), k = 0;
        while (d[i] === m && k++ < 9) i = (i + 1) % n;
        return { t: r.int(0, 2) ? 'given' : 'compute', c: ci, d: d, i: i };
      }) } },
      { name: '편차의 합은 0', vars: { q: sampler(function (r) { var d = looseDevs(r); return { t: 'zero', c: fit(r, d).c, d: d, i: xAt(r, d) }; }) } },
      { name: '편차로 실제 값 구하기', vars: { q: sampler(function (r) {
        var ci = r.pick([0, 1, 4, 5, 6, 7]), c = CTX[ci], d, f;
        if (r.int(0, 1)) return { t: 'value', c: ci, m: r.int(c.lo + 6, c.hi - 5), dv: r.pick([-1, 1]) * r.int(1, 5) };
        d = looseDevs(r); f = fit(r, d); return { t: 'table', c: f.c, d: d, i: xAt(r, d), m: f.m };
      }) } }
    ]
  });

  /* ── B28.variance 분산과 표준편차 ──────────────────────── */
  var VAR_KEY = '분산은 자료가 평균에서 얼마나 흩어져 있는지를 나타내는 수예요. 편차를 그냥 더하면 양수와 음수가 서로 지워져서 아무것도 남지 않아요. 그래서 편차를 제곱해서 모두 양수로 만든 다음 평균을 내요. 곧 분산은 「편차의 제곱의 평균」이에요.';
  var SD_KEY = '표준편차는 분산의 양의 제곱근이에요. 분산은 편차를 제곱해서 구했기 때문에 원래 자료보다 훨씬 큰 수가 되어 버려요. 근호를 씌워서 원래 자료와 같은 눈금으로 되돌린 것이 표준편차예요. 제곱해서 분산이 되는 양수를 찾으면 돼요.';
  var varBuild = function (q) {
    var c = CTX[q.c || 0], d = q.d, n, SS, V, A, w = {}, ans, data, m, first;
    if (q.t === 'sd-var') {
      V = q.V; ans = root(V); w.variance = V; w.half = V % 2 === 0 ? V / 2 : null; w.squared = V * V; w.doubled = 2 * V;
      return { text: c.who + '들의 ' + c.what + '의 분산이 ' + V + '일 때, 표준편차를 구하세요.', ans: ans, wrong: w, check: isSq(V) && V >= 4,
        hints: [SD_KEY,
          '① 분산은 ' + V + E(V) + '. ② 제곱해서 ' + nj(V, '이/가') + ' 되는 양수를 찾아요: $\\square \\times \\square = ' + V + '$. ③ 같은 수를 두 번 곱한 값을 작은 수부터 차례로 떠올려 봐요.',
          '$\\sqrt{' + V + '}$의 값을 구하는 문제예요. 같은 수를 두 번 곱한 값을 차례로 계산해 보면서 ' + nj(V, '이/가') + ' 되는 수를 찾아요. 분산을 반으로 나누는 것이 아니라는 점에 주의해요.'],
        steps: [{ say: '표준편차는 분산의 양의 제곱근이에요.', tex: '\\sqrt{' + V + '}' }, { say: '제곱해서 ' + nj(V, '이/가') + ' 되는 양수를 찾아요.', tex: ans + ' \\times ' + ans + ' = ' + V }, { say: '표준편차를 적어요.', tex: String(ans) }] };
    }
    n = d.length; SS = sum(d.map(function (x) { return x * x; })); V = SS / n; A = absSum(d); ans = q.sd ? root(V) : V; first = d.filter(function (x) { return x < 0; })[0];
    w['not-divided'] = SS; w['abs-mean'] = A % n === 0 ? A / n : null; w['count-off'] = SS % (n - 1) === 0 ? SS / (n - 1) : null;
    if (q.sd) { w.variance = V; w.half = V % 2 === 0 ? V / 2 : null; } else w.zero = 0;
    if (q.t === 'devs') {
      return { text: devText(mth(d)) + ' 이 자료의 ' + (q.sd ? '표준편차를' : '분산을') + ' 구하세요.', ans: ans, wrong: w, check: sum(d) === 0 && isInt(V) && (!q.sd || isSq(V)),
        hints: [q.sd ? VAR_KEY + ' 그 분산의 양의 제곱근이 표준편차예요.' : VAR_KEY,
          '① 편차를 하나씩 제곱해요. 음수도 제곱하면 양수가 돼요: $' + d.map(sq).join(',\\ ') + '$. ② 제곱한 값을 모두 더해요. ③ 그 합을 편차의 개수 ' + nj(n, '으로/로') + ' 나눠요.' + (q.sd ? ' ④ 그렇게 구한 분산에 근호를 씌워요.' : ''),
          '제곱은 같은 수를 두 번 곱하는 것이에요. 예를 들어 $' + sq(first) + ' = ' + (first < 0 ? '(' + first + ')' : first) + ' \\times ' + (first < 0 ? '(' + first + ')' : first) + '$' + E(first) + '. 음수끼리 곱하면 양수가 돼요. 제곱한 값 ' + n + '개를 모두 더한 다음, 그 합을 다시 ' + nj(n, '으로/로') + ' 나누는 것까지 해야 분산이에요.' + (q.sd ? ' 분산이 나오면, 제곱해서 그 수가 되는 양수를 찾아요.' : ' 더하기만 하고 멈추지 않도록 주의해요.')],
        steps: [{ say: '편차를 제곱해서 모두 더해요.', tex: d.map(sq).join(' + ') + ' = ' + SS }, { say: '그 합을 개수 ' + nj(n, '으로/로') + ' 나누면 분산이에요.', tex: SS + ' \\div ' + n + ' = ' + V }].concat(q.sd ? [{ say: '분산의 양의 제곱근이 표준편차예요.', tex: '\\sqrt{' + V + '} = ' + ans }] : []) };
    }
    m = q.m; data = d.map(function (x) { return x + m; });
    w['raw-squares'] = q.sd ? null : V + m * m;
    return { text: dataText(c, n, data) + ' 이 자료의 ' + (q.sd ? '표준편차를' : '분산을') + ' 구하세요.', ans: ans, wrong: w, check: sum(d) === 0 && isInt(V) && (!q.sd || isSq(V)) && data.every(function (x) { return x >= 1; }),
      hints: ['자료에서 분산을 구할 때는 네 걸음을 차례로 밟아요. 평균 → 편차 → 편차의 제곱 → 그 제곱의 평균이에요. 평균은 기준선이고, 편차는 기준선에서 떨어진 거리예요. 그 거리를 제곱해서 평균을 낸 것이 분산이에요.' + (q.sd ? ' 분산의 양의 제곱근이 표준편차예요.' : ''),
        '① 값을 모두 더해서 ' + nj(n, '으로/로') + ' 나눠 평균을 구해요: $(' + data.join(' + ') + ') \\div ' + n + '$. ② 값마다 평균을 빼서 편차를 구해요. ③ 편차를 하나씩 제곱해요. ④ 제곱한 값을 모두 더해서 ' + nj(n, '으로/로') + ' 나눠요.' + (q.sd ? ' ⑤ 그 분산에 근호를 씌워요.' : ''),
        '평균은 ' + m + E(m) + '. 편차는 차례로 $' + d.join('$, $') + '$' + E(d[n - 1]) + '. 편차를 모두 더하면 0이 되는지 확인하면 계산 실수를 잡을 수 있어요. 이 편차들을 제곱해서 더한 다음 ' + nj(n, '으로/로') + ' 나눠요.' + (q.sd ? ' 마지막으로, 제곱해서 그 분산이 되는 양수를 찾아요.' : '')],
      steps: [{ say: '평균을 구해요.', tex: '(' + data.join(' + ') + ') \\div ' + n + ' = ' + m }, { say: '값마다 평균을 빼서 편차를 구해요.', tex: d.join(',\\ ') }, { say: '편차를 제곱해서 모두 더해요.', tex: d.map(sq).join(' + ') + ' = ' + SS }, { say: '그 합을 개수 ' + nj(n, '으로/로') + ' 나누면 분산이에요.', tex: SS + ' \\div ' + n + ' = ' + V }].concat(q.sd ? [{ say: '분산의 양의 제곱근이 표준편차예요.', tex: '\\sqrt{' + V + '} = ' + ans }] : []) };
  };
  var dataQ = function (r, key, sd) { var d = devs(r, [4, 5, 5, 6], key), f = fit(r, d); return { t: 'data', c: f.c, d: d, m: f.m, sd: sd }; };
  numQ({
    id: 'B28.variance', title: '분산과 표준편차', build: varBuild,
    mistakes: [['not-divided', '편차의 제곱을 더하기만 했어요. 분산은 그 합을 변량의 개수로 나눈 값이에요. 곧 편차의 제곱의 평균이에요.'],
      ['variance', '분산을 답했어요. 표준편차는 분산의 양의 제곱근이에요. 제곱해서 분산이 되는 양수를 찾아요.'],
      ['half', '분산을 2로 나눴어요. 제곱근은 반으로 나누는 것이 아니에요. 같은 수를 두 번 곱해서 분산이 되는 양수를 찾아요.'],
      ['squared', '분산을 제곱했어요. 표준편차는 분산을 제곱한 것이 아니라 분산에 근호를 씌운 것이에요. 분산보다 작은 수가 나와야 해요.'],
      ['doubled', '분산을 2배 했어요. 표준편차는 분산의 양의 제곱근이에요. 같은 수를 두 번 곱해서 분산이 되는 양수를 찾아요.'],
      ['abs-mean', '편차의 부호만 떼고 평균을 냈어요. 분산은 편차를 제곱한 값의 평균이에요. 편차를 하나씩 제곱한 다음 평균을 내요.'],
      ['count-off', '나누는 수가 틀렸어요. 편차의 제곱의 합은 맞게 구했어요. 그 합을 변량의 개수로 나눠요. 값을 하나씩 짚으며 개수를 다시 세요.'],
      ['raw-squares', '편차가 아니라 자료의 값을 그대로 제곱해서 평균을 냈어요. 먼저 값마다 평균을 빼서 편차를 구하고, 그 편차를 제곱해요.'],
      ['zero', '편차를 제곱하지 않고 그대로 더했어요. 편차의 합은 언제나 0이에요. 그래서 편차를 하나씩 제곱해서 양수로 만든 다음 평균을 내요.']],
    levels: [
      { name: '편차로 분산 구하기', vars: { q: sampler(function (r) { return { t: 'devs', d: devs(r, [4, 5, 5, 6], 'any'), sd: false }; }) } },
      { name: '자료로 분산 구하기', vars: { q: sampler(function (r) { return dataQ(r, 'any', false); }) } },
      { name: '표준편차 구하기', vars: { q: sampler(function (r) {
        var k = r.int(0, 5);
        if (k === 0) return { t: 'sd-var', c: r.pick(ALL), V: r.pick([4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]) };
        return k < 3 ? { t: 'devs', d: devs(r, [4, 5, 6, 6], 'sq'), sd: true } : dataQ(r, 'sq', true);
      }) } }
    ]
  });

  /* ── B28.spread 산포도 읽기 ────────────────────────────── */
  var simp = function (x) { var k = 1, i; for (i = 2; i * i <= x; i++) while (x % (i * i) === 0) { k *= i; x /= i * i; } return [k, x]; };
  var rt = function (x) { var s = simp(x); return s[1] === 1 ? String(s[0]) : (s[0] === 1 ? '' : s[0]) + '\\sqrt{' + s[1] + '}'; };
  var fracTex = function (a, b) { var g = gcd(a, b) || 1; return b / g === 1 ? String(a / g) : '\\dfrac{' + (a / g) + '}{' + (b / g) + '}'; };
  var CMP = [
    { intro: '네 반의 수학 점수의 평균과 표준편차', names: ['A반', 'B반', 'C반', 'D반'], unit: '점', m: [60, 80], s: [3, 12], even: '점수가 가장 고른 반', wide: '점수가 가장 넓게 흩어져 있는 반' },
    { intro: '기계 네 대가 만든 과자 한 봉지의 무게의 평균과 표준편차', names: ['A 기계', 'B 기계', 'C 기계', 'D 기계'], unit: 'g', m: [95, 105], s: [1, 8], even: '무게가 가장 고른 기계', wide: '무게가 가장 들쭉날쭉한 기계' },
    { intro: '버스 노선 네 개의 배차 간격의 평균과 표준편차', names: ['A 노선', 'B 노선', 'C 노선', 'D 노선'], unit: '분', m: [8, 20], s: [1, 7], even: '배차 간격이 가장 일정한 노선', wide: '배차 간격이 가장 들쭉날쭉한 노선' },
    { intro: '볼링 선수 네 명의 한 경기 점수의 평균과 표준편차', names: ['A 선수', 'B 선수', 'C 선수', 'D 선수'], unit: '점', m: [150, 190], s: [5, 30], even: '점수가 가장 고른 선수', wide: '점수의 기복이 가장 큰 선수' }];
  var argOf = function (a, f) { var b = 0; a.forEach(function (x, i) { if (f(x, a[b])) b = i; }); return b; };
  var SP_KEY = '표준편차는 자료가 평균에서 얼마나 흩어져 있는지를 나타내요. 표준편차가 작으면 값들이 평균 가까이에 모여 있어서 고르고, 크면 평균에서 멀리 퍼져 있어서 들쭉날쭉해요. 과녁에 화살이 한곳에 모여 꽂힌 것과 여기저기 흩어져 꽂힌 것의 차이예요.';
  var spreadBuild = function (q) {
    var c, d = q.d, n, SS, V, A, k, ans, cands, m, data, lo, hi, mh, ml, even, pickI, T, F, kp, kn, c0, R, Mx, ti;
    if (q.t === 'root') {
      n = d.length; SS = sum(d.map(function (x) { return x * x; })); V = SS / n; A = absSum(d); k = simp(V); ans = rt(V); m = q.m;
      cands = [
        [String(V), 'variance', '분산을 골랐어요. 표준편차는 분산의 양의 제곱근이에요. 분산 ' + V + '에 근호를 씌워야 해요.'],
        [rt(SS), 'not-divided', '편차의 제곱을 더하기만 하고 개수로 나누지 않았어요. 그 합 ' + nj(SS, '을/를') + ' ' + nj(n, '으로/로') + ' 나눈 값이 분산이고, 분산에 근호를 씌운 값이 표준편차예요.'],
        [fracTex(V, 2), 'half', '분산을 2로 나눴어요. 제곱근은 반으로 나누는 것이 아니에요. 제곱해서 분산이 되는 양수가 표준편차예요.'],
        [k[0] > 1 ? (k[0] * k[0]) + '\\sqrt{' + k[1] + '}' : null, 'pulled-whole', '근호 밖으로 수를 잘못 꺼냈어요. 근호 안의 제곱수 $' + k[0] + '^{2}$은 근호 밖으로 나오면서 ' + nj(k[0], '이/가') + ' 돼요.'],
        [fracTex(A, n), 'abs-mean', '편차의 부호만 떼고 평균을 냈어요. 표준편차는 편차를 제곱해서 평균을 낸 분산에 근호를 씌운 값이에요.']];
      data = m === undefined ? null : d.map(function (x) { return x + m; });
      return { text: (data ? dataText(CTX[q.c], n, data) : devText(mth(d))) + ' 이 자료의 표준편차를 고르세요.', ans: ans, wrong: pick3(cands, q.pri, ans), check: sum(d) === 0 && isInt(V) && !isSq(V),
        hints: [SD_KEY,
          (data ? '① 값을 모두 더해서 ' + nj(n, '으로/로') + ' 나눠 평균을 구하고, 값마다 평균을 빼서 편차를 구해요. ② 편차를 하나씩 제곱해요.' : '① 편차를 하나씩 제곱해요: $' + d.map(sq).join(',\\ ') + '$. ② 제곱한 값을 모두 더해요.') + ' ③ 제곱의 합을 ' + nj(n, '으로/로') + ' 나누면 분산이에요. ④ 분산에 근호를 씌워요. 근호 안에 제곱수가 숨어 있으면 밖으로 꺼내요.',
          (data ? '평균은 ' + m + E(m) + '. 편차는 차례로 $' + d.join('$, $') + '$' + E(d[n - 1]) + '. ' : '') + '편차의 제곱을 모두 더하면 ' + SS + E(SS) + '. 이 합을 ' + nj(n, '으로/로') + ' 나눈 값이 분산이에요. 표준편차는 그 분산에 근호를 씌운 값이에요. 분산을 그대로 고르거나 반으로 나누지 않도록 주의해요.'],
        steps: (data ? [{ say: '평균을 구하고, 값마다 평균을 빼서 편차를 구해요.', tex: d.join(',\\ ') }] : []).concat([{ say: '편차를 제곱해서 모두 더해요.', tex: d.map(sq).join(' + ') + ' = ' + SS }, { say: '그 합을 개수 ' + nj(n, '으로/로') + ' 나누면 분산이에요.', tex: SS + ' \\div ' + n + ' = ' + V }, { say: '분산의 양의 제곱근이 표준편차예요.', tex: '\\sqrt{' + V + '}' + (k[0] > 1 ? ' = ' + ans : '') }]) };
    }
    if (q.t === 'compare') {
      c = CMP[q.c]; lo = argOf(q.sds, function (x, y) { return x < y; }); hi = argOf(q.sds, function (x, y) { return x > y; }); mh = argOf(q.means, function (x, y) { return x > y; }); ml = argOf(q.means, function (x, y) { return x < y; });
      even = q.want === 'even'; pickI = even ? lo : hi;
      return { text: josa(c.intro, '이/가') + ' 다음과 같아요. ' + c.names.map(function (nm, i) { return nm + '(평균 ' + q.means[i] + c.unit + ', 표준편차 ' + q.sds[i] + c.unit + ')'; }).join(', ') + '. ' + josa(even ? c.even : c.wide, '을/를') + ' 고르세요.', ans: c.names[pickI],
        wrong: [[c.names[even ? hi : lo], 'opposite', '반대쪽을 골랐어요. 표준편차가 ' + (even ? '가장 큰 쪽은 가장 넓게 흩어져 있는 쪽이에요. 가장 고른 쪽은 표준편차가 가장 작아요.' : '가장 작은 쪽은 가장 고른 쪽이에요. 가장 넓게 흩어진 쪽은 표준편차가 가장 커요.')],
          [c.names[mh], 'mean-high', '평균이 가장 큰 쪽을 골랐어요. 평균은 자료의 중심이 어디인지만 알려 줘요. 고른지 흩어져 있는지는 표준편차로 판단해요.'],
          [c.names[ml], 'mean-low', '평균이 가장 작은 쪽을 골랐어요. 평균은 자료의 중심이 어디인지만 알려 줘요. 고른지 흩어져 있는지는 표준편차로 판단해요.']],
        check: [lo, hi, mh, ml].every(function (x, i, a) { return a.indexOf(x) === i; }) && asc(q.sds).every(function (x, i, a) { return !i || x !== a[i - 1]; }) && asc(q.means).every(function (x, i, a) { return !i || x !== a[i - 1]; }),
        hints: [SP_KEY,
          '① 묻는 것이 「평균이 높은가」인지 「고른가, 흩어져 있는가」인지 구별해요. 이 문제는 흩어진 정도를 물어요. ② 그러니 평균은 보지 않고 표준편차만 봐요. ③ 표준편차 네 개를 크기 순서로 견줘요: ' + q.sds.join(', ') + '.',
          '가장 고른 쪽을 찾을 때는 표준편차가 가장 작은 것을, 가장 흩어진 쪽을 찾을 때는 표준편차가 가장 큰 것을 골라요. 평균이 높다고 고른 것도 아니고, 평균이 낮다고 흩어진 것도 아니에요. 이 문제가 둘 중 어느 쪽을 묻는지 다시 읽어요.'],
        steps: [{ say: '평균은 보지 않고 표준편차만 크기 순서로 견줘요.', tex: asc(q.sds).join(' < ') }, { say: '표준편차가 가장 ' + (even ? '작은' : '큰') + ' 쪽을 골라요. 답은 「' + c.names[pickI] + '」.', tex: '' }] };
    }
    n = d.length; SS = sum(d.map(function (x) { return x * x; })); V = SS / n; A = absSum(d);
    kp = d.filter(function (x) { return x > 0; }).length; kn = d.filter(function (x) { return x < 0; }).length; c0 = n - kp - kn; Mx = Math.max.apply(null, d); R = Mx - Math.min.apply(null, d);
    T = [['평균보다 큰 변량은 ' + kp + '개이다', '평균보다 큰 변량은 편차가 양수예요. 양수인 편차의 개수를 세요.', d.filter(function (x) { return x > 0; }).join(',\\ ')],
      ['분산은 ' + V + '이다', '편차를 제곱해서 모두 더한 다음 개수로 나눠요.', SS + ' \\div ' + n + ' = ' + V],
      ['편차의 합은 0이다', '편차를 부호까지 그대로 모두 더하면 언제나 0이에요.', addTex(d) + ' = 0'],
      ['가장 큰 변량과 가장 작은 변량의 차는 ' + R + '이다', '두 변량의 차는 두 편차의 차와 같아요. 가장 큰 편차에서 가장 작은 편차를 빼요.', Mx + ' - (' + (Mx - R) + ') = ' + R],
      [c0 ? '평균과 같은 변량이 ' + c0 + '개 있다' : '평균과 같은 변량은 없다', '평균과 같은 변량은 편차가 0이에요. 편차 가운데 0이 몇 개인지 세요.', String(c0)]];
    F = [[kn !== kp ? '평균보다 큰 변량은 ' + kn + '개이다' : null, 'count-negative', '편차가 음수인 변량의 개수를 세었어요. 평균보다 큰 변량은 편차가 양수예요. 편차는 (변량) − (평균)이기 때문이에요.'],
      ['분산은 ' + SS + '이다', 'not-divided', '편차의 제곱을 더하기만 한 값이에요. 분산은 그 합을 변량의 개수 ' + nj(n, '으로/로') + ' 나눈 값이에요.'],
      ['편차의 합은 ' + A + '이다', 'sum-abs', '부호를 떼고 더한 값이에요. 편차는 부호를 그대로 두고 더해요. 그러면 양수와 음수가 서로 지워져서 합이 언제나 0이에요.'],
      [V >= 2 ? '표준편차는 ' + V + '이다' : null, 'sd-as-variance', '분산을 표준편차라고 했어요. ' + nj(V, '은/는') + ' 분산이에요. 표준편차는 분산에 근호를 씌운 값이에요.'],
      ['가장 큰 변량과 가장 작은 변량의 차는 ' + Mx + '이다', 'max-only', '가장 큰 편차만 본 값이에요. 두 변량의 차는 가장 큰 편차에서 가장 작은 편차를 뺀 값이에요. 음수를 빼면 더 커져요.'],
      [c0 ? '평균과 같은 변량은 없다' : '평균과 같은 변량이 1개 있다', 'zero-count', '편차가 0인 변량을 잘못 세었어요. 편차가 0이면 그 변량은 평균과 같아요. 편차 가운데 0이 몇 개인지 다시 세요.']];
    ti = q.ti % 5;
    return { text: devText(mth(d)) + ' 이 자료에 대한 설명으로 옳은 것을 고르세요.', ans: T[ti][0], wrong: pick3(F, q.pri, T[ti][0]), check: sum(d) === 0 && isInt(V),
      hints: ['편차 하나하나가 알려 주는 것을 떠올려요. 편차는 (변량) − (평균)이에요. 그래서 편차가 양수이면 평균보다 큰 값, 음수이면 평균보다 작은 값, 영이면 평균과 같은 값이에요. 편차를 부호 그대로 모두 더하면 언제나 영이고, 편차를 제곱해서 평균을 낸 것이 분산이에요.',
        '보기를 하나씩 직접 확인해요. ① 개수를 말하는 보기는 편차의 부호를 보고 세요. ② 「편차의 합」을 말하는 보기는 부호까지 그대로 더해 봐요. ③ 「분산」이나 「표준편차」를 말하는 보기는 편차를 제곱해서 더하고 ' + nj(n, '으로/로') + ' 나눠 봐요. ④ 「차」를 말하는 보기는 가장 큰 편차에서 가장 작은 편차를 빼 봐요.',
        '편차의 제곱은 차례로 $' + d.map(function (x) { return x * x; }).join('$, $') + '$' + E(d[n - 1] * d[n - 1]) + '. 이것을 더한 값과, 그 합을 개수로 나눈 값은 서로 다른 것을 뜻해요. 또, 음수를 뺄 때는 부호가 바뀌어 더하기가 된다는 것도 잊지 않아요.'],
      steps: [{ say: T[ti][1], tex: T[ti][2] }, { say: '옳은 설명은 「' + T[ti][0] + '」.', tex: '' }] };
  };
  choiceQ({
    id: 'B28.spread', title: '산포도 읽기', build: spreadBuild,
    ids: ['variance', 'not-divided', 'half', 'pulled-whole', 'abs-mean', 'opposite', 'mean-high', 'mean-low', 'count-negative', 'sum-abs', 'sd-as-variance', 'max-only', 'zero-count'],
    levels: [
      { name: '근호가 든 표준편차', vars: { q: sampler(function (r) {
        var d = devs(r, [4, 5, 5, 6], 'nonsq'), f = fit(r, d), q = { t: 'root', d: d, pri: pri5(r), o: o4(r) };
        if (r.int(0, 1)) { q.c = f.c; q.m = f.m; }
        return q;
      }) } },
      { name: '어느 쪽이 더 고른가', vars: { q: sampler(function (r) {
        var ci = r.int(0, CMP.length - 1), c = CMP[ci], f = function (a) { return [r.int(a[0], a[1]), r.int(a[0], a[1]), r.int(a[0], a[1]), r.int(a[0], a[1])]; };
        return { t: 'compare', c: ci, means: f(c.m), sds: f(c.s), want: r.pick(['even', 'wide']), o: o4(r) };
      }) } },
      { name: '편차를 보고 옳은 설명 고르기', vars: { q: sampler(function (r) { return { t: 'read', d: devs(r, [4, 5, 5, 6], 'any'), ti: r.int(0, 4), pri: pri6(r), o: o4(r) }; }) } }
    ]
  });

  /* ── 개념 카드 ─────────────────────────────────────────── */
  var devFig = (function () {
    var X = function (v) { return 30 + (v - 1) * 24; }, it = [['seg', 18, 70, 282, 70], ['seg', X(6), 30, X(6), 70, true], ['text', X(6), 18, '평균 6'], ['text', 20, 96, '변량'], ['text', 20, 124, '편차']], v;
    for (v = 1; v <= 11; v++) it.push(['seg', X(v), 66, X(v), 74]);
    [[2, '−4'], [5, '−1'], [6, '0'], [7, '+1'], [10, '+4']].forEach(function (p) { it.push(['dot', X(p[0]), 70], ['text', X(p[0]), 96, String(p[0])], ['text', X(p[0]), 124, p[1]]); });
    return { type: 'geo', h: 140, alt: '수직선 위에 변량 2, 5, 6, 7, 10이 점으로 찍혀 있고 평균 6의 자리에 점선이 서 있다. 각 변량 아래에 편차 −4, −1, 0, +1, +4가 적혀 있다. 평균의 왼쪽에 있는 변량은 편차가 음수, 오른쪽에 있는 변량은 편차가 양수이다.', items: it };
  })();
  var spreadFig = (function () {
    var X = function (v) { return 40 + (v - 1) * 22; }, it = [['seg', X(6), 26, X(6), 58, true], ['seg', X(6), 86, X(6), 108, true], ['text', X(6), 14, '평균 6'], ['text', 16, 58, 'A'], ['text', 16, 108, 'B'], ['seg', 30, 58, 280, 58], ['seg', 30, 108, 280, 108]];
    [4, 5, 6, 7, 8].forEach(function (v) { it.push(['dot', X(v), 58], ['text', X(v), 76, String(v)]); });
    [1, 3, 6, 9, 11].forEach(function (v) { it.push(['dot', X(v), 108], ['text', X(v), 126, String(v)]); });
    return { type: 'geo', h: 140, alt: '두 자료를 수직선 두 줄에 점으로 나타낸 그림. 자료 A는 4, 5, 6, 7, 8로 평균 6 가까이에 모여 있고, 자료 B는 1, 3, 6, 9, 11로 평균 6에서 멀리 흩어져 있다.', items: it };
  })();
  MH.defineConcept('B28', [
    { title: '대푯값과 평균', body: [
      '자료 전체의 특징을 수 하나로 나타낸 값을 대푯값이라고 해요. "우리 반 수학 점수는 대략 70점쯤이야"라고 말할 때의 70점이 대푯값이에요. 대푯값에는 평균, 중앙값, 최빈값이 있어요.',
      '자료의 값 하나하나를 변량이라고 해요. 평균은 변량을 모두 더한 다음 변량의 개수로 나눈 값이에요.',
      { ex: [['\\dfrac{(\\text{변량의 합})}{(\\text{변량의 개수})}', '평균'], ['\\dfrac{2 + 5 + 6 + 7 + 10}{5} = \\dfrac{30}{5} = 6', '2, 5, 6, 7, 10의 평균']] },
      '높이가 서로 다른 모래 더미를 평평하게 고르면 모두 같은 높이가 돼요. 그 높이가 평균이에요. 그래서 평균에 개수를 곱하면 다시 전체 합이 나와요.'
    ] },
    { title: '중앙값', body: [
      '중앙값은 자료를 작은 값부터 차례로 줄 세웠을 때 한가운데에 있는 값이에요. 반드시 먼저 줄을 세워야 해요.',
      { ex: [['3,\\ 5,\\ \\underline{6},\\ 8,\\ 9', '5개(홀수 개) — 가운데 값 6이 중앙값'], ['3,\\ \\underline{5,\\ 6},\\ 8', '4개(짝수 개) — 가운데 두 값의 평균 5.5가 중앙값']] },
      '직원 5명의 월급이 200, 210, 220, 230, 1500(만 원)이라면 평균은 472만 원이에요. 다섯 명 중 네 명이 그보다 훨씬 적게 받으니 평균은 이 자료를 잘 대표하지 못해요.',
      '이렇게 혼자 멀리 떨어진 값이 있을 때는 중앙값(220만 원)이 더 알맞아요. 중앙값은 가운데 자리만 보기 때문에 양 끝의 값에 휘둘리지 않아요.'
    ] },
    { title: '최빈값', body: [
      '최빈값은 자료에서 가장 여러 번 나온 값이에요. 「가장 빈번한 값」이라는 뜻이에요.',
      { ex: [['2,\\ 3,\\ 3,\\ 3,\\ 5,\\ 7', '3이 세 번으로 가장 많다 — 최빈값은 3'], ['1,\\ 4,\\ 4,\\ 6,\\ 6,\\ 9', '4와 6이 두 번씩 — 최빈값은 4, 6']] },
      '가장 많이 나온 값이 둘이면 둘 다 최빈값이에요. 답은 나온 횟수가 아니라 그 값 자체라는 것에 주의해요.',
      '최빈값은 세기만 하면 되기 때문에 「좋아하는 과일」처럼 수가 아닌 자료에서도 구할 수 있어요. 신발 가게에서 가장 많이 팔리는 크기를 알고 싶을 때도 최빈값을 써요.'
    ] },
    { title: '편차', body: [
      '대푯값이 같아도 자료가 흩어진 모양은 다를 수 있어요. 흩어진 정도를 수로 나타낸 것을 산포도라고 해요. 그 출발점이 편차예요.',
      '편차는 변량에서 평균을 뺀 값이에요. 평균을 기준선으로 삼아, 기준선보다 크면 양수이고 작으면 음수예요.',
      { figure: devFig },
      { ex: [['(\\text{편차}) = (\\text{변량}) - (\\text{평균})', '편차의 뜻'], ['10 - 6 = 4,\\quad 2 - 6 = -4', '평균이 6일 때 10과 2의 편차'], ['(-4) + (-1) + 0 + 1 + 4 = 0', '편차의 합은 언제나 0']] },
      '평균은 평평하게 고른 높이라서, 평균보다 높은 쪽에서 남는 양과 낮은 쪽에서 모자란 양이 정확히 같아요. 그래서 편차를 모두 더하면 언제나 0이에요.'
    ] },
    { title: '분산과 표준편차', body: [
      '편차를 그냥 더하면 0이 되어 흩어진 정도를 알 수 없어요. 그래서 편차를 제곱해서 모두 양수로 만든 다음 평균을 내요. 이것이 분산이에요.',
      { ex: [['(\\text{분산}) = \\dfrac{(\\text{편차})^{2}\\text{의 합}}{(\\text{변량의 개수})}', '분산 — 편차의 제곱의 평균'], ['(\\text{표준편차}) = \\sqrt{(\\text{분산})}', '표준편차 — 분산의 양의 제곱근']] },
      '2, 5, 6, 7, 10의 편차는 −4, −1, 0, 1, 4예요. 차례대로 따라가 봐요.',
      { ex: [['16 + 1 + 0 + 1 + 16 = 34', '① 편차를 제곱해서 더한다'], ['34 \\div 5 = \\dfrac{34}{5}', '② 개수로 나누면 분산'], ['\\sqrt{\\dfrac{34}{5}}', '③ 근호를 씌우면 표준편차']] },
      '차례는 언제나 평균 → 편차 → 편차의 제곱 → 그 평균(분산) → 제곱근(표준편차)이에요.'
    ] },
    { title: '산포도 읽기', body: [
      '분산과 표준편차가 작을수록 자료가 평균 가까이에 모여 있어요. 「고르다」고 말해요. 클수록 평균에서 멀리 흩어져 있어요.',
      { figure: spreadFig },
      '두 자료는 평균이 모두 6이지만 A는 평균 가까이에 모여 있고 B는 멀리 퍼져 있어요. A의 분산은 2, B의 분산은 13.6이에요.',
      '평균은 자료의 중심이 어디인지를 알려 주고, 표준편차는 그 중심에서 얼마나 흩어져 있는지를 알려 줘요. 「성적이 고른 반」을 찾을 때는 평균이 아니라 표준편차가 가장 작은 반을 골라요.'
    ] }
  ]);
})();
