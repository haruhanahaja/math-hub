/* 진도 · 복습 (plan/architecture.md 3장). 화면을 만지지 않는다 → 명령줄 테스트에서 그대로 돌아간다.
   기록은 localStorage 의 'mathhub.progress' 한 곳에 둔다. 문제 자체는 저장하지 않는다(씨앗만 저장). */
(function () {
  'use strict';
  var MH = globalThis.MH = globalThis.MH || {};
  var KEY = 'mathhub.progress';
  var WINDOW = 10, NEED = 9;                 /* 통과: 최근 10문제 중 9문제를 힌트 없이 정답 */
  var REVIEW_DAYS = [1, 3, 7];               /* 틀린 날부터 1일 · 3일 · 7일 뒤 복습 */
  var REVIEW_CAP = 10;                       /* 하루에 내는 복습 문제 수의 한도 */
  var MIX_EVERY = 5;                         /* 5문제에 1문제(20%)는 통과한 아래 단원에서 낸다 */
  var TEST_SIZE = 10;                        /* 바로 통과 시험의 문제 수 */
  var MIN_SOLVED = 100, MIN_FROM = 'A08';    /* A08 부터는 그 단원 문제를 100문제 이상 풀어야 통과(쉬운 단계부터 천천히 올라간다) */

  function blank() {
    return { v: 1, units: {}, types: {}, reviews: [], days: {}, current: null, test: null, settings: { goal: 15, timer: false } };
  }

  var P = {
    MIN_SOLVED: MIN_SOLVED, MIN_FROM: MIN_FROM,
    WINDOW: WINDOW, NEED: NEED, REVIEW_DAYS: REVIEW_DAYS, REVIEW_CAP: REVIEW_CAP, MIX_EVERY: MIX_EVERY, TEST_SIZE: TEST_SIZE,
    s: blank(),

    /* ── 저장 ─────────────────────────────────────────── */
    reset: function () { P.s = blank(); return P.s; },
    load: function () {
      var s = null;
      try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
      P.s = P.migrate(s);
      return P.s;
    },
    save: function () { try { localStorage.setItem(KEY, JSON.stringify(P.s)); } catch (e) { /* 저장 불가 환경 */ } },
    /** 옛 형식의 기록을 지금 형식으로 옮긴다. 빠진 칸은 기본값으로 채운다. */
    migrate: function (s) {
      var b = blank();
      if (!s || typeof s !== 'object' || s.v !== 1) return b;
      Object.keys(b).forEach(function (k) { if (s[k] === undefined || s[k] === null && k !== 'current' && k !== 'test') s[k] = b[k]; });
      if (!s.settings.goal) s.settings.goal = b.settings.goal;
      return s;
    },

    /* ── 읽기 ─────────────────────────────────────────── */
    unit: function (id) { return P.s.units[id] || (P.s.units[id] = { recent: '', passed: 0, n: 0, k: 0, lastType: '' }); },
    type: function (id) { return P.s.types[id] || (P.s.types[id] = { level: 0, run: 0, n: 0, ok: 0, last: 0, mistakes: {} }); },
    day: function (d) { return P.s.days[d] || (P.s.days[d] = { n: 0, ok: 0, rev: 0 }); },
    passed: function (id) { return !!(P.s.units[id] && P.s.units[id].passed); },

    /** 단원의 상태: 'soon' 준비 중 · 'locked' 잠김 · 'open' 열림 · 'passed' 통과 */
    status: function (id) {
      var u = MH.MAP.unit(id);
      if (!u.ready) return 'soon';
      if (P.passed(id)) return 'passed';
      return u.requires.every(P.passed) ? 'open' : 'locked';
    },
    /** 통과하려면 그 단원에서 풀어야 하는 최소 문제 수. 단원 지도에서 MIN_FROM 과 그 뒤의 단원은 MIN_SOLVED, 앞 단원은 0. */
    minSolved: function (id) {
      var ids = MH.MAP.units.map(function (u) { return u.id; }), from = ids.indexOf(P.MIN_FROM), at = ids.indexOf(id);
      return from >= 0 && at >= from ? P.MIN_SOLVED : 0;
    },
    /** 한 단계에서 맞혀야 하는 문제 수. 최소 문제 수가 있는 단원은 그 수를 (유형 × 단계) 칸에 고르게 나눠, 쉬운 단계부터 천천히 올라가게 한다. */
    stay: function (id) {
      var min = P.minSolved(id), slots = 0;
      if (!min) return 2;
      MH.MAP.unit(id).types.forEach(function (t) { slots += MH.lastLevel(t) + 1; });
      return Math.max(2, Math.floor(min / slots));
    },
    /** 바로 통과 시험을 볼 수 있는 단원인가(최소 문제 수가 있는 단원은 시험으로 건너뛸 수 없다) */
    testAllowed: function (id) { return !P.minSolved(id); },
    /** 최근 10문제 중 힌트 없이 맞힌 수 */
    cleanCount: function (id) { return (P.unit(id).recent.match(/1/g) || []).length; },
    /** 그 단원의 모든 유형이 마지막 단계에 올라와 있는가 */
    allAtLast: function (id) {
      return MH.MAP.unit(id).types.every(function (t) { return P.type(t).level >= MH.lastLevel(t); });
    },
    /** 구간에서 지금 공부할 단원: 열려 있고 아직 통과하지 않은 첫 단원. 없으면 null. */
    currentUnit: function (stageId) {
      var list = MH.MAP.unitsOf(stageId).filter(function (u) { return P.status(u.id) === 'open'; });
      return list.length ? list[0].id : null;
    },
    stageProgress: function (stageId) {
      var list = MH.MAP.unitsOf(stageId);
      return { done: list.filter(function (u) { return P.passed(u.id); }).length, total: list.length,
        ready: list.some(function (u) { return u.ready; }) };
    },
    /** 오늘 복습할 문제 수(유형이 등록돼 있는 것만) */
    dueReviews: function (today) {
      return P.s.reviews.filter(function (r) { return r.due <= today && MH.types[r.type]; })
        .sort(function (a, b) { return a.due - b.due || a.from - b.from; });
    },
    streak: function (today) {
      var has = function (d) { return P.s.days[d] && P.s.days[d].n > 0; };
      var d = has(today) ? today : today - 1, n = 0;
      while (has(d)) { n++; d--; }
      return n;
    },

    /* ── 다음에 낼 문제 고르기 ──────────────────────────
       순서: ① 오늘 날짜가 된 복습 ② 5문제에 1문제는 통과한 아래 단원 ③ 지금 단원의 새 문제
       rnd(): 0 ~ 2^32-1 의 정수를 주는 함수(문제의 씨앗과 동점일 때 고르는 데 쓴다). */
    nextTask: function (today, unitId, rnd) {
      var due = P.dueReviews(today);
      if (due.length && P.day(today).rev < REVIEW_CAP) {
        var r = due[0];
        return { mode: 'review', unit: unitId, type: r.type, level: Math.min(r.level, MH.lastLevel(r.type)), seed: rnd() };
      }
      var u = P.unit(unitId);
      u.k++;
      if (u.k % MIX_EVERY === 0) {
        var m = P.mixType(unitId);
        if (m) return { mode: 'mix', unit: unitId, type: m, level: Math.min(P.type(m).level, MH.lastLevel(m)), seed: rnd() };
      }
      var t = P.studyType(unitId, rnd);
      u.lastType = t;
      return { mode: 'study', unit: unitId, type: t, level: P.type(t).level, seed: rnd() };
    },
    /** 지금 단원에서 낼 유형: 단계가 가장 낮은 유형 → 덜 푼 유형. 같은 유형을 연달아 내지 않는다. */
    studyType: function (unitId, rnd) {
      var types = MH.MAP.unit(unitId).types, last = P.unit(unitId).lastType;
      var pool = types.length > 1 ? types.filter(function (t) { return t !== last; }) : types.slice();
      var key = function (t) { var s = P.type(t); return [s.level - MH.lastLevel(t), s.n]; };
      pool.sort(function (a, b) { var x = key(a), y = key(b); return x[0] - y[0] || x[1] - y[1]; });
      var best = pool.filter(function (t) { var x = key(t), y = key(pool[0]); return x[0] === y[0] && x[1] === y[1]; });
      return best[rnd() % best.length];
    },
    /** 섞어 낼 유형: 통과한 다른 단원에서 ① 지금 단원의 선수 단원 ② 푼 지 오래된 유형 ③ 정답률이 낮은 유형 */
    mixType: function (unitId) {
      var req = MH.MAP.unit(unitId).requires, list = [];
      MH.MAP.units.forEach(function (u) {
        if (u.id === unitId || !P.passed(u.id)) return;
        u.types.forEach(function (t) {
          if (!MH.types[t]) return;
          var s = P.type(t);
          list.push({ t: t, pre: req.indexOf(u.id) >= 0 ? 0 : 1, last: s.last, ok: s.ok, n: s.n });
        });
      });
      /* 정답률 비교는 나눗셈 없이: a.ok / a.n < b.ok / b.n  ⇔  a.ok * b.n < b.ok * a.n */
      list.sort(function (a, b) { return a.pre - b.pre || a.last - b.last || a.ok * Math.max(b.n, 1) - b.ok * Math.max(a.n, 1) || a.n - b.n; });
      return list.length ? list[0].t : null;
    },

    /* ── 기록 ───────────────────────────────────────────
       task: { mode: 'study' | 'review' | 'mix' | 'test', unit, type, level }
       res:  { correct, hinted(힌트를 봄), seen(답을 내기 전에 풀이를 봄), mistake(실수 id 또는 null) }
       돌려주는 것: { correct, passedNow(이번 문제로 단원 통과), goalNow(이번 문제로 하루 목표 달성) } */
    record: function (task, res, today) {
      var correct = !!res.correct && !res.seen;                 /* 풀이를 먼저 본 문제는 오답 */
      var day = P.day(today), t = P.type(task.type), last = MH.lastLevel(task.type), out = { correct: correct, passedNow: false, goalNow: false };
      day.n++; if (correct) day.ok++; if (task.mode === 'review') day.rev++;
      out.goalNow = day.n === P.s.settings.goal;
      t.n++; if (correct) t.ok++; t.last = today;
      if (!correct && res.mistake) t.mistakes[res.mistake] = (t.mistakes[res.mistake] || 0) + 1;

      if (task.mode === 'study') {
        var u = P.unit(task.unit);
        u.n++;
        /* 통과 기준에는 마지막 단계 문제만 넣는다. 1 힌트 없이 정답 · h 힌트 보고 정답 · 0 오답 */
        if (task.level >= last) u.recent = (u.recent + (correct ? (res.hinted ? 'h' : '1') : '0')).slice(-WINDOW);
        /* 단계: 연속 2번 맞히면 한 칸 위로, 연속 2번 틀리면 한 칸 아래로.
           최소 문제 수가 있는 단원은 그 단계에서 stay 문제를 맞힌 뒤에야 올라간다(at = 지금 단계에서 맞힌 수). */
        if (task.level === t.level) {
          var stay = P.stay(task.unit);
          if (correct) t.at = (t.at || 0) + 1;
          t.run = correct ? Math.max(t.run, 0) + 1 : Math.min(t.run, 0) - 1;
          if (t.run >= 2 && (stay <= 2 || t.at >= stay)) { if (t.level < last) { t.level++; t.at = 0; } t.run = 0; }
          else if (t.run <= -2) { if (t.level > 0) { t.level--; t.at = 0; } t.run = 0; }
        }
        if (!u.passed && u.n >= P.minSolved(task.unit) && P.allAtLast(task.unit) && P.cleanCount(task.unit) >= NEED) { u.passed = today; out.passedNow = true; }
      }

      /* 복습 예약: 유형마다 한 줄 */
      var i = -1;
      P.s.reviews.forEach(function (r, k) { if (r.type === task.type) i = k; });
      if (!correct) {
        var entry = { type: task.type, from: today, step: 0, due: today + REVIEW_DAYS[0], level: task.level, mistake: res.mistake || null };
        if (i >= 0) P.s.reviews[i] = entry; else P.s.reviews.push(entry);
      } else if (task.mode === 'review' && i >= 0) {
        var r = P.s.reviews[i];
        r.step++;
        if (r.step >= REVIEW_DAYS.length) P.s.reviews.splice(i, 1);
        else r.due = Math.max(r.from + REVIEW_DAYS[r.step], today + 1);     /* 늦게 풀었으면 적어도 내일 */
      }
      return out;
    },

    /* ── 바로 통과 시험 ─────────────────────────────────
       모든 유형의 마지막 단계 문제를 섞어 10문제. 힌트 · 풀이 없이 9문제 이상 맞히면 통과. */
    startTest: function (unitId, rnd) {
      var types = MH.MAP.unit(unitId).types, order = [], items = [];
      /* 유형이 고르게 나오도록 유형 목록을 되풀이해 10칸을 채운 뒤 섞는다 */
      for (var i = 0; i < TEST_SIZE; i++) order.push(types[i % types.length]);
      for (var j = order.length - 1; j > 0; j--) { var k = rnd() % (j + 1); var x = order[j]; order[j] = order[k]; order[k] = x; }
      order.forEach(function (t) { items.push({ type: t, level: MH.lastLevel(t), seed: rnd() }); });
      P.s.test = { unit: unitId, items: items, i: 0, res: '' };
      return P.s.test;
    },
    /** 시험 문제 하나의 결과를 적는다. 마지막 문제였으면 결과를 돌려준다(아니면 null). */
    answerTest: function (correct, mistake, today) {
      var T = P.s.test, item = T.items[T.i];
      P.record({ mode: 'test', unit: T.unit, type: item.type, level: item.level }, { correct: correct, mistake: mistake }, today);
      T.res += correct ? '1' : '0';
      T.i++;
      if (T.i < T.items.length) return null;
      var score = (T.res.match(/1/g) || []).length, pass = score >= NEED, u = P.unit(T.unit), wrong = [];
      MH.MAP.unit(T.unit).types.forEach(function (t) {
        var allOk = T.items.every(function (it, n) { return it.type !== t || T.res.charAt(n) === '1'; });
        if (!allOk) wrong.push(t);
        /* 시험에서 다 맞힌 유형은 마지막 단계에서 시작한다. 틀린 유형은 원래 단계부터 공부한다. */
        if (pass || allOk) { P.type(t).level = MH.lastLevel(t); P.type(t).run = 0; }
      });
      if (pass && !u.passed) { u.passed = today; u.recent = T.res; }
      var out = { unit: T.unit, score: score, total: T.items.length, passed: pass, wrongTypes: wrong };
      P.s.test = null;
      return out;
    }
  };

  MH.progress = P;
})();
