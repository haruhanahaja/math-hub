/* A04 나눗셈 ① — 단원 전용 검사.
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
  /** x ÷ y 가 나누어떨어지고 몫이 z 인가 */
  var divides = function (x, y, z) { return BigInt(y) > 0n && BigInt(x) % BigInt(y) === 0n && BigInt(x) / BigInt(y) === BigInt(z); };

  group('A04 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  [['A04.low', [[2, 5], [3, 4], [2, 3, 4, 5]]], ['A04.high', [[6, 7], [8, 9], [6, 7, 8, 9]]]].forEach(function (spec) {
    var facts = [{}, {}, {}];
    each(spec[0], function (p, pr, level, where) {
      var m = /^(\d+) \\div (\d)$/.exec(pr.tex);
      if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
      ok(divides(m[1], m[2], p.answer), where + pr.tex + ' ≠ ' + p.answer + ' (또는 나누어떨어지지 않음)');
      ok(spec[1][level].indexOf(Number(m[2])) >= 0 && inRange(p.answer, level === 2 ? 2 : 1, 9), where + '범위 ' + pr.tex);
      facts[level][pr.tex] = 1;
    });
    eq(Object.keys(facts[0]).length, 18, spec[0] + ' 0단계: 18문제가 모두 나옴');
    eq(Object.keys(facts[1]).length, 18, spec[0] + ' 1단계: 18문제가 모두 나옴');
    eq(Object.keys(facts[2]).length, 32, spec[0] + ' 2단계: 32문제가 모두 나옴');
    done(spec[0]);
  });
  var forms = {};
  each('A04.relation', function (p, pr, level, where) {
    var lines = pr.tex.replace(/\\begin\{gathered\} | \\end\{gathered\}/g, '').split(' \\\\ '), fill = function (s) { return s === '\\square' ? String(p.answer) : s; };
    var m = /^(\S+) \\div (\S+) = (\S+)$/.exec(lines[lines.length - 1]);
    if (!ok(!!m && [m[1], m[2], m[3]].filter(function (s) { return s === '\\square'; }).length === 1, where + '문제 글 형식 ' + pr.tex)) return;
    ok(divides(fill(m[1]), fill(m[2]), fill(m[3])), where + pr.tex + ' 에 ' + p.answer + ' 를 넣으면 성립하지 않음');
    eq(lines.length, level === 0 ? 2 : 1, where + '줄 수');
    if (lines.length === 2) {
      var k = /^(\d) \\times (\d) = (\d+)$/.exec(lines[0]);
      ok(!!k && BigInt(k[1]) * BigInt(k[2]) === BigInt(k[3]) && k[3] === m[1], where + '곱셈식이 틀리거나 나눗셈식과 안 맞음 ' + pr.tex);
    }
    forms[p.v.form] = 1;
  });
  eq(Object.keys(forms).length, 4, '네 가지 꼴이 모두 나옴');
  done('곱셈과 나눗셈의 관계');
  var used = {};
  each('A04.word', function (p, pr, level, where) {
    var nums = (pr.text.match(/\d+/g) || []).map(Number);
    if (!ok(nums.length === 2, where + '문제 글에 수가 두 개가 아님: ' + pr.text)) return;
    ok(divides(nums[0], nums[1], p.answer), where + pr.text + ' → ' + p.answer);
    ok(inRange(nums[1], level ? 6 : 2, level ? 9 : 5) && inRange(p.answer, 2, 9), where + '범위 ' + pr.text);
    eq(MH.types['A04.word'].answer.suffix(p.v, p.ctx), p.ctx.unit, where + '답 칸의 단위');
    used[p.ctx.id] = 1;
  });
  eq(Object.keys(used).length, MH.types['A04.word'].contexts.length, '모든 상황이 쓰임');
  done('문장제');

  group('A04 — 흔한 실수와 풀이의 구체적인 예');
  var prob = function (type, v, answer, ctx) { return { type: type, v: v, ctx: ctx || null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var d = prob('A04.high', { a: 7, q: 8, p: 56 }, 8);
  eq(J(d, '8'), 'correct:-', '56 ÷ 7 = 8');
  eq(J(d, '49'), 'wrong:subtracted', '56 ÷ 7 → 49 (뺌)');
  eq(J(d, '7'), 'wrong:one-less', '56 ÷ 7 → 7 (몫이 하나 작음)');
  eq(J(d, '9'), 'wrong:one-more', '56 ÷ 7 → 9 (몫이 하나 큼)');
  eq(J(d, '392'), 'wrong:multiplied', '56 ÷ 7 → 392 (곱함)');
  eq(J(d, '56'), 'wrong:copied', '56 ÷ 7 → 56 (식의 수를 그대로)');
  eq(J(d, '3'), 'wrong:-', '56 ÷ 7 → 3 (설명할 수 없는 오답)');
  eq(MH.judge(d, '7').mistake.explain, '7 × 7 = 49라서 56보다 작아요. 7씩 한 번 더 뛰어 세어야 해요.', '몫이 하나 작음 설명');
  var r0 = prob('A04.relation', { form: 0, a: 7, q: 8, p: 56 }, 7), r1 = prob('A04.relation', { form: 1, a: 4, q: 8, p: 32 }, 32), r2 = prob('A04.relation', { form: 2, a: 7, q: 8, p: 56 }, 8);
  eq(J(r0, '448'), 'wrong:multiplied', '56 ÷ □ = 8 → 448');
  eq(J(r0, '48'), 'wrong:subtracted', '56 ÷ □ = 8 → 48');
  eq(J(r0, '6'), 'wrong:one-less', '56 ÷ □ = 8 → 6');
  eq(MH.judge(r0, '6').mistake.explain, '8 × 6 = 48이라서 56보다 작아요. 8단에서 56이 나오는 곳을 다시 찾아보세요.', '한 칸 옆 설명');
  eq(J(r0, '8'), 'wrong:one-more', '56 ÷ □ = 8 → 8 (한 칸 옆이 먼저 잡힘)');
  eq(J(r1, '2'), 'wrong:divided', '□ ÷ 4 = 8 → 2 (나눔)');
  eq(J(r1, '12'), 'wrong:added', '□ ÷ 4 = 8 → 12 (더함)');
  eq(J(r1, '28'), 'wrong:one-less', '□ ÷ 4 = 8 → 28');
  eq(J(r1, '4'), 'wrong:copied', '□ ÷ 4 = 8 → 4');
  eq(J(r2, '56'), 'wrong:copied', '7 × 8 = 56, 56 ÷ 7 = □ → 56');
  var w = MH.types['A04.word'].contexts;
  eq(J(prob('A04.word', { a: 6, q: 4, p: 24 }, 4, w[0]), '144'), 'wrong:multiplied', '귤 24개를 6명이 → 144 (곱함)');
  eq(J(prob('A04.word', { a: 6, q: 4, p: 24 }, 4, w[3]), '18'), 'wrong:subtracted', '귤 24개를 6개씩 → 18 (뺌)');

  var says = function (id, v, ctx) { return MH.types[id].steps(v, ctx).map(function (s) { return s.say; }).join(' | '); };
  eq(says('A04.low', { a: 4, q: 3, p: 12 }), '12 ÷ 4는 "4에 몇을 곱하면 12가 되는지"를 찾는 거예요. | 4씩 뛰어 세요: 4(1번), 8(2번), 12(3번). | 3번째에 12가 나왔으니 답은 3이에요. 곱셈으로 확인해요: 4 × 3 = 12.', '12 ÷ 4 풀이');
  eq(says('A04.relation', { form: 1, a: 4, q: 3, p: 12 }), '나눗셈을 거꾸로 하면 곱셈이에요. 4씩 3묶음이면 □가 돼요. | 4씩 3번 뛰어 세요: 4, 8, 12. | □ = 12. 식에 넣어 확인해요.', '□ ÷ 4 = 3 풀이');
  eq(says('A04.relation', { form: 0, a: 4, q: 3, p: 12 }), '12 ÷ □ = 3 는 "□ × 3 = 12"와 같은 말이에요. | 3씩 뛰어 세요: 3(1번), 6(2번), 9(3번), 12(4번). | 4번째에 12가 나왔으니 □ = 4. 식에 넣어 확인해요.', '12 ÷ □ = 3 풀이');
  eq(says('A04.relation', { form: 3, a: 4, q: 3, p: 12 }).split(' | ')[0], '곱셈식과 나눗셈식에는 같은 세 수가 나와요. 12를 3으로 나누면 3과 짝이 된 수가 나와요.', '곱셈식을 나눗셈식으로 풀이의 첫 줄');
  eq(says('A04.word', { a: 6, q: 4, p: 24 }, w[5]).split(' | ').pop(), '4번째에 24가 나왔어요. 답은 4일이에요.', '문장제 풀이의 마지막 줄');
  eq(MH.types['A04.relation'].hints({ form: 2, a: 7, q: 8, p: 56 })[2], '나눗셈식에서 56을 나누는 수가 7이에요. 곱셈식에서 7과 짝이 된 수를 찾아요.', '곱셈식을 나눗셈식으로 힌트');
  done('실수 · 풀이 예');
})();
