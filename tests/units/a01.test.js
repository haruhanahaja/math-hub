/* A01 덧셈과 뺄셈 점검 — 단원 전용 검사.
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

  group('A01 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  each('A01.add', function (p, pr, level, where) {
    var m = /^(\d+) \+ (\d+)$/.exec(pr.tex);
    if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
    ok(BigInt(m[1]) + BigInt(m[2]) === BigInt(p.answer), where + pr.tex + ' ≠ ' + p.answer);
    ok((Number(m[1]) % 10 + Number(m[2]) % 10 >= 10) || level > 0, where + '0단계는 일의 자리에서 받아올림이 있어야 함');
    ok(len(m[1]) === (level < 2 ? 2 : 3) && len(m[2]) === (level < 2 ? 2 : 3), where + '자릿수 ' + pr.tex);
    ok(level !== 0 || p.answer < 100, where + '0단계의 합은 두 자리');
    ok(level !== 1 || p.answer >= 100, where + '1단계의 합은 세 자리');
  });
  done('덧셈');
  each('A01.sub', function (p, pr, level, where) {
    var m = /^(\d+) - (\d+)$/.exec(pr.tex);
    if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
    ok(BigInt(m[1]) - BigInt(m[2]) === BigInt(p.answer) && p.answer > 0, where + pr.tex + ' ≠ ' + p.answer);
    ok(len(m[1]) === (level === 0 ? 2 : 3), where + '자릿수 ' + pr.tex);
    /* 받아내림이 있다 = 자리끼리 그냥 뺄 수 없는 자리가 있다 */
    var a = MH.digits(Number(m[1])), b = MH.digits(Number(m[2]));
    ok(a.some(function (d, i) { return d < (b[i] || 0); }), where + '받아내림이 없음 ' + pr.tex);
  });
  done('뺄셈');
  each('A01.blank', function (p, pr, level, where) {
    var m = /^(\S+) ([+-]) (\S+) = (\d+)$/.exec(pr.tex);
    if (!ok(!!m && (m[1] === '\\square') !== (m[3] === '\\square'), where + '문제 글 형식 ' + pr.tex)) return;
    var x = BigInt(m[1] === '\\square' ? p.answer : m[1]), y = BigInt(m[3] === '\\square' ? p.answer : m[3]);
    ok((m[2] === '+' ? x + y : x - y) === BigInt(m[4]), where + pr.tex + ' 에 ' + p.answer + ' 를 넣으면 성립하지 않음');
    ok(p.answer > 0 && len(p.answer) <= (level === 0 ? 2 : 3), where + '답의 크기 ' + p.answer);
  });
  done('빈칸 찾기');
  var used = {};
  each('A01.word', function (p, pr, level, where) {
    var nums = (pr.text.match(/\d+/g) || []).map(Number);
    if (!ok(nums.length === 2, where + '문제 글에 수가 두 개가 아님: ' + pr.text)) return;
    var expect = p.ctx.op === '+' ? nums[0] + nums[1] : nums[0] - nums[1];
    ok(expect === p.answer && p.answer > 0, where + pr.text + ' → ' + p.answer);
    ok(pr.text.indexOf(p.ctx.unit) >= 0, where + '단위가 문제에 없음');
    eq(MH.types['A01.word'].answer.suffix(p.v, p.ctx), p.ctx.unit, where + '답 칸의 단위');
    used[p.ctx.id] = 1;
  });
  eq(Object.keys(used).length, MH.types['A01.word'].contexts.length, '모든 상황이 쓰임');
  done('문장제');

  group('A01 — 흔한 실수와 풀이의 구체적인 예');
  var prob = function (type, v, answer, ctx) { return { type: type, v: v, ctx: ctx || null, answer: answer }; };
  var mid = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var add = prob('A01.add', { a: 47, b: 38 }, 85);
  eq(mid(add, '85'), 'correct:-', '47 + 38 = 85');
  eq(mid(add, '75'), 'wrong:no-carry', '47 + 38 → 75 (받아올림 빠뜨림)');
  eq(mid(add, '715'), 'wrong:write-all', '47 + 38 → 715 (이어 씀)');
  eq(mid(add, '9'), 'wrong:subtracted', '47 + 38 → 9 (뺌)');
  eq(mid(add, '95'), 'wrong:place-1', '47 + 38 → 95 (십의 자리 1 차이)');
  var sub = prob('A01.sub', { a: 52, b: 38 }, 14);
  eq(mid(sub, '26'), 'wrong:flip', '52 − 38 → 26 (큰 수에서 작은 수)');
  eq(mid(sub, '24'), 'wrong:no-decrement', '52 − 38 → 24 (윗자리를 안 줄임)');
  eq(mid(sub, '90'), 'wrong:added', '52 − 38 → 90 (더함)');
  var bl = prob('A01.blank', { form: 0, p: 57, q: 38, s: 95 }, 57);
  eq(mid(bl, '133'), 'wrong:wrong-way', '□ + 38 = 95 → 133 (더함)');
  eq(mid(prob('A01.blank', { form: 3, p: 38, q: 57, s: 95 }, 95), '19'), 'wrong:wrong-way', '□ − 38 = 57 → 19 (뺌)');

  var last = function (steps) { return steps[steps.length - 1].value; };
  var A = MH.types['A01.add'], S = MH.types['A01.sub'];
  [[47, 38], [85, 72], [999, 999], [199, 801], [105, 895]].forEach(function (c) { eq(last(A.steps({ a: c[0], b: c[1] })), c[0] + c[1], c[0] + ' + ' + c[1] + ' 풀이'); });
  [[52, 38], [403, 158], [500, 199], [123, 95], [700, 1], [301, 299]].forEach(function (c) { eq(last(S.steps({ a: c[0], b: c[1] })), c[0] - c[1], c[0] + ' − ' + c[1] + ' 풀이'); });
  var says = S.steps({ a: 403, b: 158 }).map(function (s) { return s.say; });
  eq(says[1], '일의 자리: 3에서 8을 뺄 수 없으니 십의 자리에서 10을 빌려 와요: 13 − 8 = 5.', '403 − 158 일의 자리');
  eq(says[2], '십의 자리: 아랫자리에 1을 빌려줘야 하는데 0이라 줄 수 없어요. 백의 자리에서 10을 빌려 와 1을 주면 9가 남아요: 9 − 5 = 4.', '403 − 158 십의 자리(0에서 빌려주기)');
  eq(says[3], '백의 자리: 아랫자리에 1을 빌려줘서 3이 됐어요. 3 − 1 = 2.', '403 − 158 백의 자리');
  eq(A.steps({ a: 47, b: 38 })[1].say, '일의 자리: 7 + 8 = 15. 5를 쓰고 1을 십의 자리로 받아올려요.', '47 + 38 일의 자리');
  eq(A.steps({ a: 85, b: 72 })[2].say, '십의 자리: 8 + 7 = 15. 맨 윗자리이므로 15를 그대로 써요.', '85 + 72 십의 자리');
  done('실수 · 풀이 예');
})();
