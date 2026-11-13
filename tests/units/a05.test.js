/* A05 나눗셈 ② 몫과 나머지 — 단원 전용 검사.
   화면에 보이는 문제 글을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000, QR = MH.kinds['quotient-remainder'];
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var len = function (n) { return String(n).length; };
  var quo = function (x, y) { return Number(BigInt(x) / BigInt(y)); }, rem = function (x, y) { return Number(BigInt(x) % BigInt(y)); };

  group('답 형식 quotient-remainder');
  eq(JSON.stringify(QR.parse('21,3')), '{"q":21,"r":3}', '몫,나머지');
  eq(JSON.stringify(QR.parse('021, 03')), '{"q":21,"r":3}', '앞의 0 과 공백');
  eq(QR.parse('21,'), null, '나머지 칸이 비었음');
  eq(QR.parse(',3'), null, '몫 칸이 비었음');
  eq(QR.parse('21'), null, '한 칸뿐');
  eq(QR.parse('2.1,3'), null, '소수점');
  ok(QR.equal({ q: 21, r: 3 }, QR.parse(QR.raw({ q: 21, r: 3 }))), 'raw 를 다시 읽으면 같은 값');
  ok(!QR.equal({ q: 21, r: 3 }, { q: 3, r: 21 }) && !QR.equal({ q: 21, r: 3 }, undefined), '다른 값');
  eq(QR.say({ q: 21, r: 3 }), '몫 21, 나머지 3', '내 답 표시');
  eq(QR.tex({ q: 21, r: 3 }), '21 \\cdots 3', '수식 표시');
  done('읽기 · 비교 · 표시');

  group('A05 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  /* 단계마다 [나누어지는 수의 자릿수, 나누는 수의 자릿수, 몫의 자릿수] */
  var shape = { 'A05.basic': [null, [1, 1], [1, 1]], 'A05.long': [[2, 1, 2], [3, 1, 2], [3, 1, 3]], 'A05.two': [[2, 2, 1], [3, 2, 1], [3, 2, 2]] };
  ['A05.basic', 'A05.long', 'A05.two'].forEach(function (id) {
    var zeroRem = 0, zeroInQ = 0;
    each(id, function (p, pr, level, where) {
      var m = /^(\d+) \\div (\d+)$/.exec(pr.tex);
      if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
      var x = Number(m[1]), y = Number(m[2]);
      ok(quo(x, y) === p.answer.q && rem(x, y) === p.answer.r, where + pr.tex + ' ≠ ' + QR.say(p.answer));
      ok(p.answer.r < y && p.answer.q >= 1, where + '나머지가 나누는 수보다 작아야 함');
      if (id === 'A05.basic') {
        ok(y >= (level ? 6 : 2) && y <= (level ? 9 : 5) && p.answer.q <= 9 && p.answer.r >= 1, where + '범위 ' + pr.tex);
      } else {
        var s = shape[id][level];
        ok(len(x) === s[0] && len(y) === s[1] && len(p.answer.q) === s[2], where + '자릿수 ' + pr.tex + ' → ' + QR.say(p.answer));
      }
      if (p.answer.r === 0) zeroRem++;
      if (/0/.test(String(p.answer.q))) zeroInQ++;
    });
    if (id !== 'A05.basic') ok(zeroRem > 0 && zeroInQ > 0, id + ': 나누어떨어지는 문제와 몫에 0 이 있는 문제도 나와야 함 (' + zeroRem + ', ' + zeroInQ + ')');
    done(id);
  });
  each('A05.check', function (p, pr, level, where) {
    var m = /^\\square \\div (\d+) = (\d+) \\cdots (\d+)$/.exec(pr.tex);
    if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
    var a = Number(m[1]), q = Number(m[2]), r = Number(m[3]);
    ok(quo(p.answer, a) === q && rem(p.answer, a) === r && r >= 1 && r < a, where + pr.tex + ' 에 ' + p.answer + ' 를 넣으면 성립하지 않음');
    ok(len(a) === (level === 2 ? 2 : 1) && len(q) === (level === 1 ? 2 : 1), where + '자릿수 ' + pr.tex);
  });
  done('검산으로 나누어지는 수 찾기');
  var used = {};
  each('A05.word', function (p, pr, level, where) {
    var nums = (pr.text.match(/\d+/g) || []).map(Number);
    if (!ok(nums.length === 2, where + '문제 글에 수가 두 개가 아님: ' + pr.text)) return;
    var q = quo(nums[0], nums[1]), r = rem(nums[0], nums[1]);
    ok(r >= 1, where + '나머지가 있어야 함 ' + pr.text);
    eq(p.answer, p.ctx.kind === 'left' ? r : p.ctx.kind === 'full' ? q : q + 1, where + pr.text);
    ok(len(nums[1]) === (level === 2 ? 2 : 1) && len(q) === (level === 1 ? 2 : 1), where + '자릿수 ' + pr.text);
    ok(pr.text.indexOf(p.ctx.unit) >= 0, where + '단위가 문제에 없음');
    eq(MH.types['A05.word'].answer.suffix(p.v, p.ctx), p.ctx.unit, where + '답 칸의 단위');
    used[p.ctx.id] = 1;
  });
  eq(Object.keys(used).length, MH.types['A05.word'].contexts.length, '모든 상황이 쓰임');
  done('문장제');

  group('A05 — 흔한 실수와 풀이의 구체적인 예');
  var prob = function (type, v, answer, ctx) { return { type: type, v: v, ctx: ctx || null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var b = prob('A05.basic', { a: 5, q: 3, r: 2, p: 17 }, { q: 3, r: 2 });
  eq(J(b, '3,2'), 'correct:-', '17 ÷ 5 = 3 ⋯ 2');
  eq(J(b, '3,'), 'invalid:-', '나머지 칸을 비움');
  eq(J(b, '3,0'), 'wrong:no-remainder', '17 ÷ 5 → 3 ⋯ 0 (나머지를 안 씀)');
  eq(J(b, '4,3'), 'wrong:over', '17 ÷ 5 → 4 ⋯ 3 (모자란 수를 나머지로)');
  eq(J(b, '2,3'), 'wrong:swapped', '17 ÷ 5 → 2 ⋯ 3 (바꿔 씀)');
  eq(J(b, '2,7'), 'wrong:big-remainder', '17 ÷ 5 → 2 ⋯ 7 (나머지가 나누는 수보다 큼)');
  eq(J(b, '3,1'), 'wrong:remainder-wrong', '17 ÷ 5 → 3 ⋯ 1 (나머지만 틀림)');
  eq(J(b, '4,1'), 'wrong:check-fail', '17 ÷ 5 → 4 ⋯ 1 (검산이 안 맞음)');
  eq(MH.judge(b, '2,7').mistake.explain, '나머지 7이 나누는 수 5보다 작지 않아요. 5를 더 덜어 낼 수 있으니 몫을 키워야 해요. 나머지는 항상 나누는 수보다 작아요.', '큰 나머지 설명');
  eq(MH.judge(b, '4,1').mistake.explain, '검산해 보면 5 × 4 + 1 = 21이에요. 17보다 4만큼 넘쳐요. 몫부터 다시 구해 보세요.', '검산 설명(넘침)');
  eq(MH.judge(b, '2,2').mistake.explain, '검산해 보면 5 × 2 + 2 = 12예요. 17보다 5만큼 모자라요. 몫부터 다시 구해 보세요.', '검산 설명(모자람)');
  eq(J(prob('A05.long', { a: 3, q: 204, r: 1, p: 613 }, { q: 204, r: 1 }), '24,1'), 'wrong:zero-missing', '613 ÷ 3 → 24 ⋯ 1 (몫의 0 을 빠뜨림)');
  eq(J(prob('A05.two', { a: 23, q: 30, r: 5, p: 695 }, { q: 30, r: 5 }), '3,5'), 'wrong:zero-missing', '695 ÷ 23 → 3 ⋯ 5 (몫의 0 을 빠뜨림)');
  eq(J(prob('A05.long', { a: 4, q: 64, r: 0, p: 256 }, { q: 64, r: 0 }), '64,0'), 'correct:-', '256 ÷ 4 = 64 ⋯ 0 (나누어떨어짐)');
  var c = prob('A05.check', { a: 7, q: 23, r: 4, p: 165 }, 165);
  eq(J(c, '161'), 'wrong:forgot-remainder', '□ ÷ 7 = 23 ⋯ 4 → 161');
  eq(J(c, '157'), 'wrong:subtracted', '□ ÷ 7 = 23 ⋯ 4 → 157');
  eq(J(c, '51'), 'wrong:wrong-pair', '□ ÷ 7 = 23 ⋯ 4 → 51');
  var W = MH.types['A05.word'].contexts, wv = { a: 6, q: 4, r: 3, p: 27 };
  eq(J(prob('A05.word', wv, 3, W[0]), '4'), 'wrong:quotient-for-left', '사탕 27개를 6개씩, 남는 수 → 4');
  eq(J(prob('A05.word', wv, 3, W[0]), '9'), 'wrong:big-left', '사탕 27개를 6개씩, 남는 수 → 9');
  eq(J(prob('A05.word', { a: 6, q: 4, r: 1, p: 25 }, 1, W[0]), '5'), 'wrong:short', '사탕 25개를 6개씩, 남는 수 → 5 (모자란 수)');
  eq(J(prob('A05.word', wv, 4, W[2]), '5'), 'wrong:rounded-up', '달걀 27개를 6개씩, 가득 찬 판 → 5');
  eq(J(prob('A05.word', wv, 4, W[2]), '3'), 'wrong:remainder-for-count', '달걀 27개를 6개씩, 가득 찬 판 → 3');
  eq(J(prob('A05.word', wv, 5, W[4]), '4'), 'wrong:not-rounded-up', '27명이 6명씩, 보트 → 4');
  eq(J(prob('A05.word', wv, 5, W[4]), '5'), 'correct:-', '27명이 6명씩, 보트 → 5');

  var says = function (id, v, ctx) { return MH.types[id].steps(v, ctx).map(function (s) { return s.say; }).join(' | '); };
  eq(says('A05.basic', { a: 5, q: 3, r: 2, p: 17 }), '5단에서 17을 넘지 않는 가장 큰 수를 찾아요. 5 × 3 = 15, 5 × 4 = 20. 20은 17보다 크니까 몫은 3이에요. | 17에서 15를 빼고 남은 수가 나머지예요. 나머지는 나누는 수 5보다 작아야 해요. | 몫은 3, 나머지는 2예요. 검산: 5 × 3 + 2 = 17.', '17 ÷ 5 풀이');
  eq(says('A05.long', { a: 3, q: 204, r: 1, p: 613 }), '높은 자리부터 봐요. 6 ÷ 3: 3 × 2 = 6, 3 × 3 = 9. 9는 6보다 크니까 몫의 백의 자리에 2를 써요. 6 − 6 = 0. | 십의 자리 수 1을 내려요. 1은 3보다 작아서 나눌 수 없어요. 몫의 십의 자리에 0을 쓰고 넘어가요. | 1 옆에 일의 자리 수 3을 내려 쓰면 13이에요. 13 ÷ 3: 3 × 4 = 12, 3 × 5 = 15. 15는 13보다 크니까 몫의 일의 자리에 4를 써요. 13 − 12 = 1. | 몫은 204, 나머지는 1이에요. 검산: 3 × 204 + 1 = 613.', '613 ÷ 3 풀이(몫에 0)');
  eq(says('A05.two', { a: 23, q: 3, r: 18, p: 87 }).split(' | ')[0], '높은 자리부터 봐요. 십의 자리 수 8은 23보다 작아서 아직 나눌 수 없어요. 다음 자리와 함께 봐요.', '87 ÷ 23 풀이의 첫 줄');
  eq(says('A05.check', { a: 7, q: 23, r: 4, p: 165 }).split(' | ')[1], '먼저 곱해요: 7 × 23 = 7 × 20 + 7 × 3 = 140 + 21 = 161.', '검산 풀이의 곱셈');
  eq(says('A05.word', { a: 6, q: 14, r: 3, p: 87 }, W[2]).split(' | ').pop(), '남은 3으로는 한 묶음을 채울 수 없으니 몫이 답이에요. 답은 14판이에요.', '문장제(가득 찬 묶음) 풀이의 마지막 줄');
  eq(says('A05.word', { a: 12, q: 4, r: 3, p: 51 }, W[4]).split(' | ').pop(), '남은 3도 담아야 하니 하나가 더 필요해요: 4 + 1 = 5. 답은 5대예요.', '문장제(올림) 풀이의 마지막 줄');
  eq(MH.types['A05.two'].hints({ a: 23, q: 30, r: 5, p: 695 })[0], '23을 약 20으로 보고 69 안에 23이 몇 번 들어가는지 어림해 보세요.', '두 자리 수로 나누기 힌트');
  done('실수 · 풀이 예');
})();
