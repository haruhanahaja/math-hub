/* A03 곱셈 — 단원 전용 검사.
   화면에 보이는 문제 글을 다시 읽어서, 엔진과 무관한 계산(BigInt)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var len = function (n) { return String(n).length; };
  /** 올림 없이 곱할 수 있는가(맨 윗자리 제외): 엔진과 따로 다시 센다 */
  var carryFree = function (a, d) { return String(a).slice(1).split('').every(function (c) { return Number(c) * d < 10; }); };
  function read(pr, where) {
    var m = /^(\d+) \\times (\d+)$/.exec(pr.tex);
    return ok(!!m, where + '문제 글 형식 ' + pr.tex) ? [Number(m[1]), Number(m[2])] : null;
  }

  group('A03 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  each('A03.tens', function (p, pr, level, where) {
    var n = read(pr, where); if (!n) return;
    ok(BigInt(n[0]) * BigInt(n[1]) === BigInt(p.answer), where + pr.tex + ' ≠ ' + p.answer);
    ok([/^[2-9]0$/, /^[2-9]00$/, /^[2-9]0$/][level].test(String(n[0])) && [/^[2-9]$/, /^[2-9]$/, /^[2-9]0$/][level].test(String(n[1])), where + '수의 모양 ' + pr.tex);
  });
  done('몇십 · 몇백 곱하기');
  each('A03.one', function (p, pr, level, where) {
    var n = read(pr, where); if (!n) return;
    ok(BigInt(n[0]) * BigInt(n[1]) === BigInt(p.answer), where + pr.tex + ' ≠ ' + p.answer);
    ok(len(n[0]) === (level === 2 ? 3 : 2) && n[1] >= 2 && n[1] <= 9, where + '자릿수 ' + pr.tex);
    ok(carryFree(n[0], n[1]) === (level === 0), where + (level === 0 ? '올림이 없어야 함 ' : '올림이 있어야 함 ') + pr.tex);
  });
  done('한 자리 수 곱하기');
  each('A03.two', function (p, pr, level, where) {
    var n = read(pr, where); if (!n) return;
    ok(BigInt(n[0]) * BigInt(n[1]) === BigInt(p.answer), where + pr.tex + ' ≠ ' + p.answer);
    ok(len(n[0]) === 2 && len(n[1]) === 2 && n[0] % 10 !== 0, where + '자릿수 ' + pr.tex);
    ok((n[1] % 10 === 0) === (level === 0), where + '곱하는 수의 모양 ' + pr.tex);
    var free = carryFree(n[0], n[1] % 10) && carryFree(n[0], Math.floor(n[1] / 10));
    if (level > 0) ok(free === (level === 1), where + (level === 1 ? '올림이 없어야 함 ' : '올림이 있어야 함 ') + pr.tex);
  });
  done('두 자리 수 곱하기');
  var used = {};
  each('A03.word', function (p, pr, level, where) {
    var nums = (pr.text.match(/\d+/g) || []).map(Number);
    if (!ok(nums.length === 2, where + '문제 글에 수가 두 개가 아님: ' + pr.text)) return;
    ok(nums[0] * nums[1] === p.answer, where + pr.text + ' → ' + p.answer);
    ok(len(nums[0]) === 2 && len(nums[1]) === (level ? 2 : 1), where + '자릿수 ' + pr.text);
    ok(pr.text.indexOf(nums[0] + p.ctx.unit + '씩') >= 0, where + '"몇씩"이 문제에 없음: ' + pr.text);
    eq(MH.types['A03.word'].answer.suffix(p.v, p.ctx), p.ctx.unit, where + '답 칸의 단위');
    used[p.ctx.id] = 1;
  });
  eq(Object.keys(used).length, MH.types['A03.word'].contexts.length, '모든 상황이 쓰임');
  done('문장제');

  group('A03 — 흔한 실수와 풀이의 구체적인 예');
  var prob = function (type, v, answer, ctx) { return { type: type, v: v, ctx: ctx || null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var one = prob('A03.one', { a: 47, b: 6 }, 282);
  eq(J(one, '282'), 'correct:-', '47 × 6 = 282');
  eq(J(one, '242'), 'wrong:no-carry', '47 × 6 → 242 (올린 수를 안 더함)');
  eq(J(one, '2442'), 'wrong:write-all', '47 × 6 → 2442 (이어 씀)');
  eq(J(one, '482'), 'wrong:carry-first', '47 × 6 → 482 (올린 수를 먼저 더함)');
  eq(J(one, '82'), 'wrong:ones-only-multiplied', '47 × 6 → 82 (일의 자리만 곱함)');
  eq(J(one, '53'), 'wrong:added', '47 × 6 → 53 (더함)');
  var two = prob('A03.two', { a: 47, b: 36 }, 1692);
  eq(J(two, '423'), 'wrong:no-shift', '47 × 36 → 423 (자리를 안 옮김)');
  eq(J(two, '1242'), 'wrong:digitwise', '47 × 36 → 1242 (같은 자리끼리만)');
  eq(J(two, '282'), 'wrong:one-partial', '47 × 36 → 282 (일의 자리만 곱함)');
  eq(J(two, '1410'), 'wrong:tens-partial', '47 × 36 → 1410 (십의 자리만 곱함)');
  eq(J(prob('A03.two', { a: 34, u: 2, b: 20 }, 680), '68'), 'wrong:no-shift', '34 × 20 → 68 (0을 안 붙임)');
  var t1 = prob('A03.tens', { t: 4, u: 7, za: 1, zb: 0, a: 40, b: 7 }, 280), t2 = prob('A03.tens', { t: 5, u: 6, za: 1, zb: 1, a: 50, b: 60 }, 3000);
  eq(J(t1, '28'), 'wrong:no-zeros', '40 × 7 → 28');
  eq(J(t1, '2800'), 'wrong:zero-extra', '40 × 7 → 2800');
  eq(J(t2, '30'), 'wrong:no-zeros', '50 × 60 → 30');
  eq(J(t2, '300'), 'wrong:zero-missing', '50 × 60 → 300 (0이 하나 모자람)');
  eq(MH.judge(t2, '300').mistake.explain, '0이 하나 모자라요. 떼어 놓은 0은 모두 2개예요. 5 × 6 = 30 에 원래 있는 0은 따로 세요.', '50 × 60 → 300 설명');

  var says = function (id, v, ctx) { return MH.types[id].steps(v, ctx).map(function (s) { return s.say; }).join(' | '); };
  eq(says('A03.one', { a: 47, b: 6 }), '자리를 맞춰 세로로 쓰고, 일의 자리부터 곱해요. | 일의 자리: 7 × 6 = 42. 2를 쓰고 4를 십의 자리로 올려요. | 십의 자리: 4 × 6 = 24, 올린 4를 더하면 28. 맨 윗자리이므로 28을 그대로 써요. | 답은 282예요.', '47 × 6 풀이');
  eq(says('A03.one', { a: 23, b: 3 }), '자리를 맞춰 세로로 쓰고, 일의 자리부터 곱해요. | 일의 자리: 3 × 3 = 9. 9를 써요. | 십의 자리: 2 × 3 = 6. 6을 써요. | 답은 69예요.', '23 × 3 풀이');
  eq(says('A03.two', { a: 47, b: 36 }), '36을 30과 6으로 나눠서 따로 곱한 뒤 더해요. | 일의 자리 6을 곱해요: 47 × 6 = 282. | 십의 자리 3은 30이에요: 47 × 3 = 141 에 0을 하나 붙여 1410. | 두 결과를 더해요: 282 + 1410 = 1692. 답은 1692예요.', '47 × 36 풀이');
  eq(says('A03.two', { a: 34, u: 2, b: 20 }), '20을 곱할 때는 먼저 2를 곱하고 0을 하나 붙여요. | 34 × 2 = 68. | 0을 하나 붙이면 680. 답은 680이에요.', '34 × 20 풀이');
  eq(says('A03.tens', { t: 5, u: 6, za: 1, zb: 1, a: 50, b: 60 }), '0을 떼어 놓고 곱셈구구로 계산해요: 5 × 6 = 30. | 떼어 놓은 0은 두 수에서 하나씩, 모두 2개예요. 30 뒤에 0을 2개 붙여요. | 답은 3000이에요. 30에 원래 있던 0과 붙인 0을 헷갈리지 마세요.', '50 × 60 풀이');
  eq(says('A03.word', { a: 47, b: 36 }, MH.types['A03.word'].contexts[0]).split(' | ').pop(), '두 결과를 더해요: 282 + 1410 = 1692. 답은 1692개예요.', '문장제 풀이의 마지막 줄');
  [[386, 4], [999, 9], [105, 7], [90, 9], [12, 9]].forEach(function (c) { var s = MH.types['A03.one'].steps({ a: c[0], b: c[1] }); eq(s[s.length - 1].value, c[0] * c[1], c[0] + ' × ' + c[1] + ' 풀이의 값'); });
  [[99, 99], [12, 13], [50, 46], [85, 70]].forEach(function (c) { var s = MH.types['A03.two'].steps({ a: c[0], b: c[1] }); eq(s[s.length - 1].value, c[0] * c[1], c[0] + ' × ' + c[1] + ' 풀이의 값'); });
  done('실수 · 풀이 예');
})();
