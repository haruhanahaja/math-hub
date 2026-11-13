/* 진도 · 복습 규칙 (plan/architecture.md 3장). 가짜 단원 지도로 규칙만 확인한다. */
(function () {
  'use strict';
  var P = MH.progress, realMap = MH.MAP, realTypes = MH.types;

  /* 가짜 지도: U1(유형 a 2단계, b 1단계) → U2(유형 a 1단계) → U3(준비 중). U0 은 선수 없는 다른 단원. */
  var units = [
    { id: 'U0', stage: 'U', requires: [], types: ['U0.a'], ready: true },
    { id: 'U1', stage: 'U', requires: [], types: ['U1.a', 'U1.b'], ready: true },
    { id: 'U2', stage: 'U', requires: ['U1'], types: ['U2.a'], ready: true },
    { id: 'U3', stage: 'U', requires: ['U2'], types: [], ready: false }
  ];
  MH.MAP = {
    units: units,
    unit: function (id) { return units.filter(function (u) { return u.id === id; })[0]; },
    unitsOf: function () { return units; }
  };
  MH.types = { 'U0.a': { unit: 'U0', levels: [{}] }, 'U1.a': { unit: 'U1', levels: [{}, {}] }, 'U1.b': { unit: 'U1', levels: [{}] }, 'U2.a': { unit: 'U2', levels: [{}] } };

  var seedN = 0, rnd = function () { return ++seedN; };
  var GOOD = { correct: true }, BAD = { correct: false, mistake: 'm1' }, HINT = { correct: true, hinted: true };
  var study = function (type, level) { return { mode: 'study', unit: type.split('.')[0], type: type, level: level }; };
  /** 단원을 평소 공부로 통과시킨다(모두 정답). 푼 문제 수를 돌려준다. */
  function passByStudy(unit, day) {
    for (var n = 1; n <= 200; n++) {
      var t = P.nextTask(day, unit, rnd);
      if (P.record(t, GOOD, day).passedNow) return n;
    }
    return -1;
  }

  group('진도: 단원 상태와 단계');
  P.reset();
  eq(P.status('U1'), 'open', '선수 단원이 없으면 열림');
  eq(P.status('U2'), 'locked', '선수 단원을 통과하지 않으면 잠김');
  eq(P.status('U3'), 'soon', '만들지 않은 단원은 준비 중');
  eq(P.currentUnit('U'), 'U0', '지금 공부할 단원은 열린 첫 단원');
  P.record(study('U1.a', 0), GOOD, 100);
  eq(P.type('U1.a').level, 0, '한 번 맞혀서는 단계가 오르지 않음');
  P.record(study('U1.a', 0), GOOD, 100);
  eq(P.type('U1.a').level, 1, '연속 2번 맞히면 한 단계 위로');
  eq(P.unit('U1').recent, '', '마지막 단계가 아닌 문제는 최근 10문제에 넣지 않음');
  P.record(study('U1.a', 1), BAD, 100);
  eq(P.type('U1.a').level, 1, '한 번 틀려서는 단계가 내려가지 않음');
  eq(P.unit('U1').recent, '0', '마지막 단계 문제는 최근 10문제에 넣음');
  P.record(study('U1.a', 1), BAD, 100);
  eq(P.type('U1.a').level, 0, '연속 2번 틀리면 한 단계 아래로');
  P.record(study('U1.a', 0), GOOD, 100); P.record(study('U1.a', 0), BAD, 100); P.record(study('U1.a', 0), GOOD, 100);
  eq(P.type('U1.a').level, 0, '맞고 틀리고 맞으면 연속이 아님');
  done('단계 오르내리기');

  group('진도: 단원 통과 (최근 10문제 중 9문제를 힌트 없이 정답)');
  P.reset();
  var n = passByStudy('U1', 100);
  ok(n > 0, '모두 맞히면 통과');
  eq(n, 11, '모두 맞힐 때 통과까지 푼 문제 수(유형 a 단계 올리기 2 + 마지막 단계 9)');
  eq(P.unit('U1').passed, 100, '통과한 날을 적음');
  eq(P.status('U1'), 'passed', '통과 상태');
  eq(P.status('U2'), 'open', '선수 단원을 통과하면 다음 단원이 열림');
  eq(P.s.reviews.length, 0, '모두 맞혔으면 복습 없음');

  P.reset();
  P.type('U1.a').level = 1;
  for (var i = 0; i < 10; i++) P.record(study(i % 2 ? 'U1.a' : 'U1.b', i % 2 ? 1 : 0), HINT, 100);
  eq(P.unit('U1').recent, 'hhhhhhhhhh', '힌트를 보고 맞힌 문제는 h 로 적음');
  eq(P.status('U1'), 'open', '힌트를 보고 맞힌 문제만으로는 통과하지 못함');
  eq(P.type('U1.b').ok, 5, '힌트를 보고 맞혀도 정답 수에는 들어감');
  eq(P.s.reviews.length, 0, '힌트를 보고 맞혀도 복습에 넣지 않음');
  for (i = 0; i < 8; i++) P.record(study('U1.b', 0), GOOD, 100);
  eq(P.status('U1'), 'open', '힌트 없이 8문제로는 부족');
  ok(P.record(study('U1.b', 0), GOOD, 100).passedNow, '힌트 없이 9문제째에 통과');

  P.reset();
  P.type('U1.a').level = 1;
  for (i = 0; i < 8; i++) P.record(study('U1.b', 0), GOOD, 100);
  P.record(study('U1.b', 0), BAD, 100); P.record(study('U1.b', 0), BAD, 100);
  eq(P.cleanCount('U1'), 8, '10문제 중 8문제 정답');
  eq(P.status('U1'), 'open', '8문제로는 통과하지 못함');
  P.record(study('U1.b', 0), GOOD, 100);
  eq(P.unit('U1').recent, '1111111001', '오래된 문제부터 밀려남');
  P.record(study('U1.b', 0), GOOD, 100); P.record(study('U1.b', 0), GOOD, 100);
  eq(P.status('U1'), 'open', '틀린 두 문제가 아직 10문제 안에 있음');
  for (i = 0; i < 5; i++) P.record(study('U1.b', 0), GOOD, 100);
  eq(P.status('U1'), 'open', '오답 하나가 밀려나기 전');
  ok(P.record(study('U1.b', 0), GOOD, 100).passedNow, '오답 하나가 밀려나 9문제가 되면 통과');

  P.reset();
  for (i = 0; i < 10; i++) P.record(study('U1.b', 0), GOOD, 100);
  eq(P.status('U1'), 'open', '마지막 단계에 못 오른 유형이 있으면 통과하지 못함');

  P.reset();
  var r = P.record(study('U1.b', 0), { correct: true, seen: true }, 100);
  eq(r.correct, false, '답을 내기 전에 풀이를 본 문제는 오답');
  eq(P.unit('U1').recent, '0', '풀이를 본 문제는 0 으로 적음');
  eq(P.s.reviews.length, 1, '풀이를 본 문제는 복습에 넣음');
  done('통과 기준');

  group('복습: 1일 · 3일 · 7일');
  P.reset();
  P.record(study('U1.b', 0), BAD, 100);
  var rv = P.s.reviews[0];
  eq(rv.due, 101, '틀리면 1일 뒤'); eq(rv.step, 0, '첫 단계'); eq(rv.mistake, 'm1', '실수 유형을 적음');
  eq(P.type('U1.b').mistakes.m1, 1, '실수 횟수');
  eq(P.nextTask(100, 'U1', rnd).mode, 'study', '틀린 날에는 복습이 나오지 않음');
  var t = P.nextTask(101, 'U1', rnd);
  eq(t.mode, 'review', '1일 뒤에는 복습이 먼저 나옴'); eq(t.type, 'U1.b', '틀린 유형');
  var before = P.unit('U1').recent;
  P.record(t, GOOD, 101);
  eq(P.unit('U1').recent, before, '복습 문제는 통과 기준에 넣지 않음');
  eq(P.s.reviews[0].due, 103, '맞히면 다음은 3일 뒤'); eq(P.s.reviews[0].step, 1, '둘째 단계');
  eq(P.nextTask(102, 'U1', rnd).mode, 'study', '아직 날짜가 안 됨');
  P.record(P.nextTask(103, 'U1', rnd), GOOD, 103);
  eq(P.s.reviews[0].due, 107, '그 다음은 7일 뒤');
  P.record(P.nextTask(107, 'U1', rnd), GOOD, 107);
  eq(P.s.reviews.length, 0, '세 번을 다 맞히면 복습에서 빠짐');

  P.reset();
  P.record(study('U1.b', 0), BAD, 100);
  P.record(P.nextTask(110, 'U1', rnd), GOOD, 110);
  eq(P.s.reviews[0].due, 111, '늦게 풀었으면 다음 복습은 적어도 내일');
  P.record(P.nextTask(111, 'U1', rnd), BAD, 111);
  eq(P.s.reviews.length, 1, '유형마다 한 줄');
  eq(P.s.reviews[0].step, 0, '복습에서 틀리면 처음으로'); eq(P.s.reviews[0].from, 111, '틀린 날을 다시 적음'); eq(P.s.reviews[0].due, 112, '다시 1일 뒤');
  P.record(study('U1.b', 0), GOOD, 111);
  eq(P.s.reviews[0].step, 0, '평소 공부에서 맞힌 것은 복습 단계를 올리지 않음');
  P.record(P.nextTask(112, 'U1', rnd), GOOD, 112);
  P.record(study('U1.b', 0), BAD, 112);
  eq(P.s.reviews[0].step, 0, '복습 중인 유형을 평소 공부에서 또 틀리면 처음으로');

  P.reset();
  for (i = 0; i < 12; i++) { MH.types['U9.' + i] = { unit: 'U1', levels: [{}] }; P.s.reviews.push({ type: 'U9.' + i, from: 90 + i, step: 0, due: 91 + i, level: 0, mistake: null }); }
  P.s.reviews.push({ type: 'GONE.x', from: 1, step: 0, due: 2, level: 0, mistake: null });
  eq(P.dueReviews(200).length, 12, '등록되지 않은 유형의 복습은 건너뜀');
  eq(P.nextTask(200, 'U1', rnd).type, 'U9.0', '오래된 복습부터');
  var revs = 0;
  for (i = 0; i < 14; i++) { t = P.nextTask(200, 'U1', rnd); if (t.mode === 'review') revs++; P.record(t, GOOD, 200); }
  eq(revs, 10, '복습은 하루 10문제까지');
  for (i = 0; i < 12; i++) delete MH.types['U9.' + i];
  done('복습 일정');

  group('아래 단원 섞기 (5문제에 1문제)');
  P.reset();
  P.unit('U0').passed = 90; P.unit('U1').passed = 95;
  P.type('U1.a').level = 1; P.type('U1.a').last = 95; P.type('U1.b').last = 94; P.type('U0.a').last = 80;
  var modes = [], mixed = [];
  for (i = 0; i < 20; i++) { t = P.nextTask(100, 'U2', rnd); modes.push(t.mode); if (t.mode === 'mix') mixed.push(t.type + '@' + t.level); P.record(t, t.mode === 'mix' && mixed.length === 4 ? BAD : GOOD, 100); }
  eq(modes.filter(function (m) { return m === 'mix'; }).length, 4, '20문제 중 4문제(20%)');
  eq(modes[4], 'mix', '5번째 문제가 섞은 문제');
  eq(mixed.join(' '), 'U1.b@0 U1.a@1 U1.a@1 U1.b@0', '선수 단원을 먼저, 푼 지 오래된 유형부터, 같으면 덜 푼 유형');
  eq(P.unit('U2').n, 16, '섞은 문제는 지금 단원의 문제 수에 넣지 않음');
  eq(P.unit('U2').recent.length, 10, '섞은 문제는 통과 기준에 넣지 않음');
  eq(P.s.reviews.length, 1, '섞은 문제를 틀리면 복습에 넣음');
  P.reset();
  for (i = 0; i < 10; i++) eq(P.nextTask(100, 'U1', rnd).mode, 'study', '통과한 단원이 없으면 섞지 않음');
  P.reset();
  var lastT = '', repeat = 0;
  for (i = 0; i < 30; i++) { t = P.nextTask(100, 'U1', rnd); if (t.type === lastT) repeat++; lastT = t.type; P.record(t, GOOD, 100); }
  eq(repeat, 0, '같은 유형을 연달아 내지 않음');
  done('섞기');

  group('바로 통과 시험');
  P.reset();
  var T1 = P.startTest('U1', rnd);
  eq(T1.items.length, 10, '10문제');
  eq(T1.items.filter(function (x) { return x.type === 'U1.a'; }).length, 5, '유형이 고르게 나옴');
  ok(T1.items.every(function (x) { return x.level === MH.lastLevel(x.type); }), '모두 마지막 단계');
  var res = null;
  for (i = 0; i < 10; i++) { ok(res === null, '끝나기 전에는 결과가 없음'); res = P.answerTest(i !== 3, i === 3 ? 'm1' : null, 100); }
  eq(res.score, 9, '점수'); eq(res.passed, true, '9문제면 통과');
  eq(P.status('U1'), 'passed', '시험으로 통과'); eq(P.status('U2'), 'open', '다음 단원이 열림');
  eq(P.type('U1.a').level, 1, '통과하면 모든 유형이 마지막 단계');
  eq(P.s.test, null, '시험이 끝나면 지움');
  eq(P.s.reviews.length, 1, '시험에서 틀린 유형도 복습에 넣음');
  eq(P.day(100).n, 10, '시험 문제도 오늘 푼 수에 들어감');

  P.reset();
  T1 = P.startTest('U1', rnd);
  var wrongLeft = 2;
  for (i = 0; i < 10; i++) { var bad = T1.items[i].type === 'U1.b' && wrongLeft > 0; if (bad) wrongLeft--; res = P.answerTest(!bad, null, 100); }
  eq(res.score, 8, '8문제'); eq(res.passed, false, '8문제면 통과하지 못함');
  eq(res.wrongTypes.join(), 'U1.b', '틀린 유형');
  eq(P.status('U1'), 'open', '떨어지면 그대로 열림');
  eq(P.type('U1.a').level, 1, '시험에서 다 맞힌 유형은 마지막 단계에서 시작');
  eq(P.unit('U1').recent, '', '떨어진 시험은 최근 10문제에 넣지 않음');
  done('시험');

  group('하루 기록과 저장');
  P.reset();
  var goal = 0;
  for (i = 0; i < 20; i++) if (P.record(study('U1.b', 0), GOOD, 100).goalNow) goal++;
  eq(goal, 1, '하루 목표(15문제) 달성은 한 번만 알림');
  eq(P.day(100).n, 20, '오늘 푼 수'); eq(P.s.settings.goal, 15, '기본 목표 15문제'); eq(P.s.settings.timer, false, '시간 제한은 기본 꺼짐');
  P.record(study('U1.b', 0), GOOD, 99); P.record(study('U1.b', 0), GOOD, 97);
  eq(P.streak(100), 2, '연속 일수'); eq(P.streak(101), 2, '오늘 아직 안 풀었어도 어제까지의 연속을 보여 줌'); eq(P.streak(102), 0, '하루를 건너뛰면 0');
  eq(P.migrate(null).v, 1, '기록이 없으면 새로 만듦');
  eq(P.migrate({ v: 99 }).units !== undefined, true, '모르는 형식이면 새로 만듦');
  var kept = P.migrate(JSON.parse(JSON.stringify({ v: 1, units: { U1: { recent: '1', passed: 5, n: 1, k: 1, lastType: '' } } })));
  eq(kept.units.U1.passed, 5, '있던 기록은 그대로'); eq(kept.reviews.length, 0, '빠진 칸은 채움'); eq(kept.settings.goal, 15, '빠진 설정은 기본값');
  done('기록');

  MH.MAP = realMap; MH.types = realTypes; P.reset();
})();
