/* 답 읽기 · 판정 · 공통 실수 · 도구(난수, 조사) */
(function () {
  'use strict';
  var int = MH.kinds.int;

  group('답 형식 int');
  eq(int.parse('632'), 632, '숫자');
  eq(int.parse('0'), 0, '0');
  eq(int.parse('007'), 7, '앞의 0');
  eq(int.parse(' 42 '), 42, '공백');
  eq(int.parse(''), null, '빈칸');
  eq(int.parse('1.5'), null, '소수점');
  eq(int.parse('-3'), null, '음수');
  eq(int.parse('12a'), null, '글자');
  done('읽기');

  var p = MH.makeProblem('A01.add', 0, 1);            /* 어떤 문제든 정답만 알면 된다 */
  var fake = function (answer) { return { type: 'A01.add', v: { a: 1000, b: answer - 1000 }, ctx: null, answer: answer }; };
  eq(MH.judge(p, String(p.answer)).verdict, 'correct', '정답');
  eq(MH.judge(p, '0' + p.answer).verdict, 'correct', '앞에 0 을 붙여도 정답');
  eq(MH.judge(p, '').verdict, 'invalid', '빈 입력');
  eq(MH.judge(p, String(p.answer + 3)).verdict, 'wrong', '오답');
  eq(MH.judge(fake(5632), '5642').mistake.id, 'place-1', '십의 자리 1 차이');
  eq(MH.judge(fake(5632), '5532').mistake.id, 'place-2', '백의 자리 1 차이');
  eq(MH.judge(fake(5632), '5623').mistake.id, 'digit-order', '자리 바뀜');
  eq(MH.judge(fake(5632), '5637').mistake.id, 'ones-only', '일의 자리만 다름');
  eq(MH.judge(fake(5632), '1111').mistake, null, '설명할 수 없는 오답');
  done('판정과 공통 실수');

  group('도구');
  var a = MH.rng(7), b = MH.rng(7), same = true, inRange = true;
  for (var i = 0; i < 1000; i++) { var x = a.int(3, 9); if (x !== b.int(3, 9)) same = false; if (x < 3 || x > 9) inRange = false; }
  ok(same, '같은 씨앗이면 같은 난수');
  ok(inRange, 'int(3, 9) 가 범위 안');
  ok(MH.rng(1).u32() !== MH.rng(2).u32(), '씨앗이 다르면 다른 난수');
  eq(MH.digits(347).join(''), '743', 'digits');
  eq(MH.digits(0).join(''), '0', 'digits(0)');
  eq(MH.gcd(12, 18), 6, 'gcd'); eq(MH.lcm(4, 6), 12, 'lcm');
  [[347, '을/를', '347을'], [285, '을/를', '285를'], [10, '이/가', '10이'], [100, '을/를', '100을'], [2, '이/가', '2가'], [6, '이/가', '6이'],
    [9, '을/를', '9를'], [1, '으로/로', '1로'], [3, '으로/로', '3으로'], [20, '으로/로', '20으로'], [5, '으로/로', '5로'],
    ['쪽', '이에요/예요', '쪽이에요'], ['개', '이에요/예요', '개예요'], ['걸음', '이에요/예요', '걸음이에요'], [632, '이에요/예요', '632예요'], [57, '이에요/예요', '57이에요']
  ].forEach(function (c) { eq(MH.josa(c[0], c[1]), c[2], '조사 ' + c[0] + ' ' + c[1]); });
  done('난수 · 숫자 · 조사');
})();
