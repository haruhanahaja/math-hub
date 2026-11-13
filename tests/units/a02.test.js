/* A02 곱셈구구 — 단원 전용 검사.
   화면에 보이는 문제 글을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var inRange = function (n, lo, hi) { return n >= lo && n <= hi; };

  group('A02 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  [['A02.low', [[2, 5], [3, 4], [2, 3, 4, 5]]], ['A02.high', [[6, 7], [8, 9], [6, 7, 8, 9]]]].forEach(function (spec) {
    var facts = [{}, {}, {}], flipped = 0;
    each(spec[0], function (p, pr, level, where) {
      var m = /^(\d) \\times (\d)$/.exec(pr.tex);
      if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
      var x = Number(m[1]), y = Number(m[2]), table = spec[1][level];
      ok(BigInt(x) * BigInt(y) === BigInt(p.answer), where + pr.tex + ' ≠ ' + p.answer);
      /* 앞의 두 단계는 '몇 단'이 앞에 온다. 마지막 단계는 순서가 섞여도 둘 중 하나는 그 단이어야 한다. */
      ok(level < 2 ? table.indexOf(x) >= 0 && inRange(y, 1, 9) : (table.indexOf(x) >= 0 && inRange(y, 2, 9)) || (table.indexOf(y) >= 0 && inRange(x, 2, 9)), where + '단의 범위 ' + pr.tex);
      if (level === 2 && table.indexOf(x) < 0) flipped++;
      facts[level][pr.tex] = 1;
    });
    eq(Object.keys(facts[0]).length, 18, spec[0] + ' 0단계: 두 단의 18문제가 모두 나옴');
    eq(Object.keys(facts[1]).length, 18, spec[0] + ' 1단계: 두 단의 18문제가 모두 나옴');
    ok(flipped > 100, spec[0] + ' 2단계: 순서를 바꾼 문제가 나옴 (' + flipped + ')');
    done(spec[0]);
  });
  each('A02.blank', function (p, pr, level, where) {
    var m = /^(\S+) \\times (\S+) = (\d+)$/.exec(pr.tex);
    if (!ok(!!m && (m[1] === '\\square') !== (m[2] === '\\square'), where + '문제 글 형식 ' + pr.tex)) return;
    var known = Number(m[1] === '\\square' ? m[2] : m[1]);
    ok(BigInt(known) * BigInt(p.answer) === BigInt(m[3]), where + pr.tex + ' 에 ' + p.answer + ' 를 넣으면 성립하지 않음');
    ok(inRange(p.answer, 2, 9) && inRange(known, [2, 6, 2][level], [5, 9, 9][level]), where + '범위 ' + pr.tex);
  });
  done('빈칸 찾기');
  var used = {};
  each('A02.word', function (p, pr, level, where) {
    var nums = (pr.text.match(/\d+/g) || []).map(Number);
    if (!ok(nums.length === 2, where + '문제 글에 수가 두 개가 아님: ' + pr.text)) return;
    ok(nums[0] * nums[1] === p.answer, where + pr.text + ' → ' + p.answer);
    ok(inRange(nums[0], level ? 6 : 2, level ? 9 : 5) && inRange(nums[1], 2, 9), where + '범위 ' + pr.text);
    ok(pr.text.indexOf(nums[0] + p.ctx.unit + '씩') >= 0, where + '"몇씩"이 문제에 없음: ' + pr.text);
    eq(MH.types['A02.word'].answer.suffix(p.v, p.ctx), p.ctx.unit, where + '답 칸의 단위');
    used[p.ctx.id] = 1;
  });
  eq(Object.keys(used).length, MH.types['A02.word'].contexts.length, '모든 상황이 쓰임');
  done('문장제');

  group('A02 — 흔한 실수와 풀이의 구체적인 예');
  var prob = function (type, v, answer, ctx) { return { type: type, v: v, ctx: ctx || null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var why = function (p, raw) { return MH.judge(p, raw).mistake.explain; };
  var p78 = prob('A02.high', { a: 7, b: 8, flip: 0 }, 56);
  eq(J(p78, '56'), 'correct:-', '7 × 8 = 56');
  eq(J(p78, '15'), 'wrong:added', '7 × 8 → 15 (더함)');
  eq(J(p78, '49'), 'wrong:one-less', '7 × 8 → 49 (한 번 덜 셈)');
  eq(J(p78, '63'), 'wrong:one-more', '7 × 8 → 63 (한 번 더 셈)');
  eq(J(p78, '42'), 'wrong:same-table', '7 × 8 → 42 (7단의 다른 값)');
  eq(J(p78, '64'), 'wrong:same-table', '7 × 8 → 64 (8단의 다른 값)');
  eq(J(p78, '57'), 'wrong:-', '7 × 8 → 57 (설명할 수 없는 오답에는 자릿수 설명을 붙이지 않음)');
  eq(why(p78, '49'), '49는 7 × 7 이에요. 7씩 한 번 덜 뛰어 셌어요. 거기에 7을 한 번 더 더해야 7 × 8 의 답이 돼요.', '한 번 덜 셈 설명');
  eq(why(p78, '42'), '42는 7 × 6 의 답이에요. 7단의 다른 값과 헷갈렸어요. 7씩 8번을 처음부터 다시 뛰어 세어 보세요.', '같은 단 설명');
  eq(why(p78, '64'), '64는 8 × 8 의 답이에요. 8단의 다른 값과 헷갈렸어요. 7씩 8번을 처음부터 다시 뛰어 세어 보세요.', '다른 쪽 단 설명');
  eq(J(prob('A02.low', { a: 2, b: 1, flip: 0 }, 2), '3'), 'wrong:added', '2 × 1 → 3');
  var bl = prob('A02.blank', { form: 0, a: 7, x: 8, p: 56 }, 8);
  eq(J(bl, '8'), 'correct:-', '□ × 7 = 56 → 8');
  eq(J(bl, '392'), 'wrong:multiplied', '□ × 7 = 56 → 392 (곱함)');
  eq(J(bl, '49'), 'wrong:subtracted', '□ × 7 = 56 → 49 (뺌)');
  eq(J(bl, '7'), 'wrong:one-less', '□ × 7 = 56 → 7 (한 칸 옆)');
  eq(J(bl, '9'), 'wrong:one-more', '□ × 7 = 56 → 9 (한 칸 옆)');
  eq(J(bl, '56'), 'wrong:copied', '□ × 7 = 56 → 56 (식의 수를 그대로)');
  eq(J(prob('A02.word', { a: 6, b: 4 }, 24, MH.types['A02.word'].contexts[0]), '10'), 'wrong:added', '6개씩 4봉지 → 10 (더함)');

  var says = function (id, v, ctx) { return MH.types[id].steps(v, ctx).map(function (s) { return s.say; }); };
  eq(says('A02.high', { a: 7, b: 8, flip: 0 }).join(' | '),
    '7 × 8은 7을 8번 더한 수예요. | 7씩 8번 뛰어 세요: 7, 14, 21, 28, 35, 42, 49, 56. | 빨리 세려면 7 × 5 = 35에서 시작해 7을 3번 더 더해요. | 답은 56이에요.', '7 × 8 풀이');
  eq(says('A02.low', { a: 3, b: 9, flip: 1 })[0], '곱하는 순서를 바꿔도 답은 같아요. 3단으로 생각해요.', '9 × 3 풀이의 첫 줄');
  eq(says('A02.low', { a: 5, b: 1, flip: 0 }).join(' | '), '어떤 수에 1을 곱하면 그 수 그대로예요. | 답은 5예요.', '5 × 1 풀이');
  eq(says('A02.blank', { form: 1, a: 6, x: 3, p: 18 }).join(' | '),
    '6단에서 18이 나오는 곳을 찾아요. 곱하는 순서는 바뀌어도 답이 같아요. | 6씩 뛰어 세요: 6(1번), 12(2번), 18(3번). | 3번째에 18이 나왔으니 □ = 3. 식에 넣어 확인해요.', '6 × □ = 18 풀이');
  eq(MH.types['A02.high'].hints({ a: 7, b: 8, flip: 0 }).join(' | '),
    '7 × 8은 7을 8번 더한 수예요. | 7씩 뛰어 세어 보세요: 7, 14, 21, … 이렇게 8번째 수까지 가요. | 7 × 5 = 35를 먼저 떠올리고, 거기서 7씩 3번 더 가 보세요.', '7 × 8 힌트');
  done('실수 · 풀이 예');
})();
