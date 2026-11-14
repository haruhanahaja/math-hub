/* A08 분수의 뜻 — 답 형식 fraction 과 단원 전용 검사.
   화면에 보이는 문제 글 · 그림 자료를 다시 읽어서, 엔진과 무관한 계산(BigInt 의 곱셈 비교)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000, K = MH.kinds.fraction;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var nums = function (text) { return (text.match(/\d+/g) || []).map(Number); };
  /** 답 ans 가 분수 n/d 와 같은 값인가(서로 곱해서 비교) */
  var same = function (ans, n, d) { return BigInt(ans.n) * BigInt(d) === BigInt(n) * BigInt(ans.d); };
  var show = function (v) { return v && (v.n + '/' + v.d); };

  group('분수 도구 F (fraction.js)');
  ok(MH.F(1, 3).add(MH.F(1, 6)).equals(MH.F(1, 2)), '1/3 + 1/6 = 1/2');
  ok(MH.F(3, 4).sub(MH.F(1, 4)).equals(MH.F(2, 4)), '3/4 − 1/4 = 2/4');
  ok(MH.F(2, 3).mul(MH.F(3, 4)).equals(MH.F(1, 2)) && MH.F(1, 2).div(MH.F(1, 4)).equals(2), '곱셈 · 나눗셈');
  eq(MH.F(6, 8).n + '/' + MH.F(6, 8).d, '3/4', '값은 기약분수로 들어 있음');
  ok(MH.F(1, 10).add(MH.F(2, 10)).equals(MH.F(3, 10)), '1/10 + 2/10 = 3/10 (소수 계산이면 어긋나는 값)');
  eq(MH.F(7, 3).compare(MH.F(9, 4)) > 0, true, '7/3 > 9/4');
  done('정확한 분수 계산');

  group('답 형식 fraction');
  var P = function (raw) { var v = K.parse(raw); return v && [v.n, v.d, v.w, v.pn].join(' '); };
  eq(P('3,4'), '3 4  3', '분자,분모');
  eq(P(',3,4'), '3 4  3', '자연수 칸을 비움');
  eq(P('1,3,4'), '7 4 1 3', '대분수 1과 3/4 → 7/4');
  eq(P('2,,'), '2 1 2 ', '자연수만');
  eq(P('0,3,4'), '3 4 0 3', '자연수 칸에 0');
  eq(P('3/4') + ' | ' + P('5') + ' | ' + P('0.5') + ' | ' + P('1.25'), '3 4  3 | 5 1 5  | 5 10  5 | 125 100  125', '한 줄로 쓴 분수 · 자연수 · 소수(소수는 분모가 10, 100 … 인 분수로 읽는다)');
  [',,', '', ',3,', ',,4', '3,', ',4', '1,3,0', '3,0', 'a,b', '1,2,3,4', '-1,2', '1.5,2'].forEach(function (raw) { eq(K.parse(raw), null, '읽을 수 없는 입력 "' + raw + '"'); });
  ok(K.equal({ n: 1, d: 2 }, { n: 2, d: 4 }) && K.equal(K.parse('0.5'), { n: 1, d: 2 }) && K.equal(K.parse('1,1,2'), MH.F(3, 2)), '1/2 = 2/4 = 0.5, 1과 1/2 = 3/2');
  ok(!K.equal({ n: 1, d: 2 }, { n: 1, d: 3 }) && !K.equal({ n: 1, d: 2 }, undefined) && !K.equal({ n: 1, d: 0 }, { n: 1, d: 0 }), '다른 값 · 값이 아닌 것');
  ok(K.valid({ n: 0, d: 5 }) && K.valid(MH.F(3, 4)) && !K.valid({ n: 1, d: 0 }) && !K.valid({ n: -1, d: 2 }) && !K.valid(null), '쓸 수 있는 값');
  eq(K.tex({ n: 7, d: 4 }) + ' ' + K.tex({ n: 7, d: 4 }, { form: 'mixed' }) + ' ' + K.tex({ n: 6, d: 8 }) + ' ' + K.tex({ n: 8, d: 4 }) + ' ' + K.tex({ n: 3, d: 4 }, { form: 'mixed' }), '\\dfrac{7}{4} 1\\dfrac{3}{4} \\dfrac{6}{8} 2 \\dfrac{3}{4}', '수식 표시(약분하지 않은 그대로, 대분수 꼴)');
  eq(K.raw({ n: 7, d: 4 }) + ' | ' + K.raw({ n: 7, d: 4 }, { form: 'mixed' }) + ' | ' + K.raw({ n: 7, d: 4 }, { whole: true }) + ' | ' + K.raw({ n: 8, d: 4 }, { form: 'mixed' }) + ' | ' + K.raw({ n: 2, d: 1 }), '7,4 | 1,3,4 | ,7,4 | 2,, | 2,1', '입력 문자열');
  [[{ n: 7, d: 4 }, {}], [{ n: 7, d: 4 }, { form: 'mixed' }], [{ n: 3, d: 4 }, { form: 'mixed' }], [{ n: 8, d: 4 }, { form: 'mixed' }], [{ n: 7, d: 4 }, { whole: true }], [{ n: 5, d: 1 }, {}]].forEach(function (c) {
    ok(K.equal(K.parse(K.raw(c[0], c[1])), c[0]) && K.redo(K.parse(K.raw(c[0], c[1])), '', c[1]) === null, 'raw 를 다시 읽으면 같은 값이고 꼴도 맞음: ' + show(c[0]) + ' ' + JSON.stringify(c[1]));
  });
  eq(K.say(K.parse('1,3,4')) + ' | ' + K.say(K.parse('2,3,4')) + ' | ' + K.say(K.parse('7,4')) + ' | ' + K.say(K.parse('2,,')), '1과 3/4 | 2와 3/4 | 7/4 | 2', '내 답 표시');
  eq(K.fieldsOf({}).join(' ') + ' | ' + K.fieldsOf({ form: 'mixed' }).join(' ') + ' | ' + K.fieldsOf({ whole: true }).join(' '), '분자 분모 | 자연수 분자 분모 | 자연수 분자 분모', '입력 칸');
  eq(K.start({}) + ' ' + K.start({ form: 'mixed' }) + ' ' + K.start({ whole: true }), '0 0 1', '처음 커서: 분자 칸(대분수를 묻는 문제만 자연수 칸)');
  eq([K.next(['', ''], 0), K.next(['3', ''], 0), K.next(['3', '4'], 0), K.next(['', '4'], 1), K.next(['3', '4'], 1)].join(' '), '-1 1 -1 0 -1', '확인을 눌렀을 때 옮겨 갈 칸(두 칸)');
  eq([K.next(['1', '', ''], 0), K.next(['1', '', ''], 1), K.next(['1', '3', ''], 1), K.next(['1', '3', '4'], 2), K.next(['', '', '4'], 2), K.next(['', '', ''], 0)].join(' '), '1 -1 2 -1 1 -1', '확인을 눌렀을 때 옮겨 갈 칸(세 칸)');
  eq(K.note(K.parse('2,4'), '2,4', {}), '약분하면 1/2이에요.', '약분 안내');
  eq(K.note(K.parse('1,2,4'), '1,2,4', {}), '약분하면 1과 1/2이에요.', '대분수의 약분 안내');
  eq(K.note(K.parse('4,6'), '4,6', {}), '약분하면 2/3예요.', '약분 안내의 조사');
  eq(K.note(K.parse('1,2'), '1,2', {}), null, '기약분수는 안내 없음');
  eq(K.note(K.parse('2,4'), '2,4', { reduce: 'off' }), null, 'reduce: off 이면 안내 없음');
  eq(K.common(K.parse('4,3'), { n: 3, d: 4 }).id, 'swapped', '공통 실수: 분자와 분모가 바뀜');
  eq(K.common(K.parse('2,3'), { n: 3, d: 4 }), null, '설명할 수 없는 오답');
  done('읽기 · 비교 · 표시 · 입력 칸 · 약분 안내');

  group('A08 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  each('A08.part', function (p, pr, level, where) {
    var n = nums(pr.text), f = pr.figure;
    if (level === 1) {
      ok(n.length === 2 && !f && n[1] < n[0], where + '문제 글 형식 ' + pr.text);
      ok(same(p.answer, n[0] - n[1], n[0]) && p.answer.d === n[0], where + pr.text + ' → ' + show(p.answer));
      return;
    }
    if (!ok(!!f && f.type === 'bar', where + '그림이 없음')) return;
    var text = level === 0 ? [f.parts, f.filled] : [1, f.parts, f.filled];
    eq(n.join(','), text.join(','), where + '글과 그림의 수가 같아야 함 ' + pr.text);
    ok(same(p.answer, f.filled, f.parts) && p.answer.d === f.parts, where + JSON.stringify(f) + ' → ' + show(p.answer));
    ok(level === 0 ? f.filled >= 1 && f.filled < f.parts : f.filled > f.parts && f.filled % f.parts !== 0 && f.filled < 3 * f.parts, where + '색칠한 칸 수의 범위 ' + JSON.stringify(f));
  });
  done('전체와 부분');
  each('A08.line', function (p, pr, level, where) {
    var f = pr.figure;
    if (!ok(!!f && f.type === 'line' && f.parts >= 2, where + '그림이 없음')) return;
    ok(same(p.answer, f.mark, f.parts) && p.answer.d === f.parts, where + JSON.stringify(f) + ' → ' + show(p.answer));
    ok(f.mark >= 1 && f.mark < f.max * f.parts && f.mark % f.parts !== 0, where + '□가 자연수 눈금이 아닌 곳에 있어야 함 ' + JSON.stringify(f));
    ok(level === 0 ? f.max === 1 : f.max >= 2 && f.mark > f.parts && f.max * f.parts <= 18, where + '수직선의 범위 ' + JSON.stringify(f));
  });
  done('수직선 위의 분수');
  var stories = {};
  each('A08.quotient', function (p, pr, level, where) {
    var n = level === 2 ? nums(pr.text) : nums(pr.tex || '');
    if (!ok(n.length === 2 && (level === 2 ? !pr.tex : /^\d+ \\div \d+$/.test(pr.tex)), where + '문제 글 형식 ' + JSON.stringify(pr))) return;
    ok(same(p.answer, n[0], n[1]) && n[0] % n[1] !== 0, where + n[0] + ' ÷ ' + n[1] + ' → ' + show(p.answer));
    ok(level === 0 ? n[0] < n[1] : level === 1 ? n[0] > n[1] : true, where + '크기 ' + n.join(' ÷ '));
    var unit = MH.types['A08.quotient'].answer.suffix(p.v);
    ok(level === 2 ? unit !== '' && pr.text.indexOf('몇 ' + unit) >= 0 : unit === '', where + '답 칸의 단위 "' + unit + '"');
    if (level === 2) stories[unit] = 1;
  });
  eq(Object.keys(stories).length, 3, '이야기 세 가지가 모두 나옴');
  done('나눗셈의 몫을 분수로');
  each('A08.to-mixed', function (p, pr, level, where) {
    var m = /^\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(pr.tex);
    if (!ok(!!m && Number(m[1]) > Number(m[2]) && Number(m[1]) % Number(m[2]) !== 0, where + '가분수가 아님 ' + pr.tex)) return;
    ok(same(p.answer, m[1], m[2]), where + pr.tex + ' → ' + show(p.answer));
    var a = /^(\d+)\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(K.tex(p.answer, MH.types['A08.to-mixed'].answer));
    ok(!!a && Number(a[2]) < Number(a[3]) && BigInt(a[1]) * BigInt(a[3]) + BigInt(a[2]) === BigInt(m[1]) && a[3] === m[2], where + '정답 표시가 대분수가 아님 ' + (a && a[0]));
    ok(MH.judge(p, ',' + m[1] + ',' + m[2]).verdict === 'invalid' && !!MH.judge(p, ',' + m[1] + ',' + m[2]).note, where + '문제의 가분수를 그대로 쓰면 다시 쓰게 해야 함');
  });
  done('가분수를 대분수로');
  each('A08.to-improper', function (p, pr, level, where) {
    var m = /^(\d+)\\dfrac\{(\d+)\}\{(\d+)\}$/.exec(pr.tex);
    if (!ok(!!m && Number(m[2]) < Number(m[3]) && Number(m[1]) >= 1, where + '대분수가 아님 ' + pr.tex)) return;
    ok(same(p.answer, BigInt(m[1]) * BigInt(m[3]) + BigInt(m[2]), m[3]) && p.answer.d === Number(m[3]), where + pr.tex + ' → ' + show(p.answer));
    ok(MH.judge(p, m[1] + ',' + m[2] + ',' + m[3]).verdict === 'invalid' && !!MH.judge(p, m[1] + ',' + m[2] + ',' + m[3]).note, where + '문제의 대분수를 그대로 쓰면 다시 쓰게 해야 함');
  });
  done('대분수를 가분수로');

  group('A08 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, v, answer) { return { type: type, v: v, ctx: null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var part = prob('A08.part', { form: 0, s: 0, d: 8, n: 6 }, { n: 6, d: 8 });
  eq(J(part, '6,8'), 'correct:-', '8칸 중 6칸 → 6/8');
  eq(J(part, '3,4'), 'correct:-', '→ 3/4 (값이 같으면 정답)');
  eq(MH.judge(part, '6,8').note, null, '이 단원에서는 약분 안내를 하지 않음');
  eq(J(part, '8,6') + ' ' + J(part, '6,2') + ' ' + J(part, '2,8'), 'wrong:swapped wrong:part-over-rest wrong:other-part', '→ 8/6, 6/2, 2/8');
  eq(J(part, ',8') + ' ' + J(part, '6,0'), 'invalid:- invalid:-', '빈칸 · 분모 0');
  eq(J(prob('A08.part', { form: 2, s: 0, d: 4, n: 7 }, { n: 7, d: 4 }), '7,8'), 'wrong:all-cells', '띠 2개(4칸씩)에 7칸 → 7/8');
  var line = prob('A08.line', { max: 2, d: 3, k: 5 }, { n: 5, d: 3 });
  eq(J(line, '5,3') + ' ' + J(line, '6,3') + ' ' + J(line, '5,2') + ' ' + J(line, '5,6') + ' ' + J(line, '2,3') + ' ' + J(line, '3,5'), 'correct:- wrong:counted-lines wrong:ticks-between wrong:whole-line wrong:after-one wrong:swapped', '수직선 5/3 의 실수');
  var q = prob('A08.quotient', { s: 0, b: 2, a: 5 }, { n: 5, d: 2 });
  eq(J(q, '5,2') + ' ' + J(q, '2,5') + ' ' + J(q, '2,1') + ' ' + J(q, '1,2') + ' ' + J(q, '3,1'), 'correct:- wrong:swapped wrong:whole-only wrong:remainder-only wrong:difference', '5 ÷ 2 의 실수');
  var tm = prob('A08.to-mixed', { d: 4, w: 1, r: 3, n: 7 }, { n: 7, d: 4 }), ti = prob('A08.to-improper', { d: 4, w: 1, r: 3, n: 7 }, { n: 7, d: 4 });
  eq(J(tm, '1,3,4'), 'correct:-', '7/4 → 1과 3/4');
  eq(MH.judge(tm, ',7,4').note, '값은 맞아요. 자연수와 진분수로 이루어진 대분수로 써 보세요.', '7/4 를 그대로 씀 → 다시 쓰게 함');
  eq(MH.judge(tm, '0,7,4').note, '값은 맞아요. 그런데 분수 부분이 아직 가분수예요. 자연수를 더 덜어 내 보세요.', '0과 7/4 → 다시 쓰게 함');
  eq(J(tm, '1,7,4') + ' ' + J(tm, '3,1,4') + ' ' + J(tm, '1,,') + ' ' + J(tm, '2,1,4'), 'wrong:kept-numerator wrong:swapped-parts wrong:whole-only wrong:-', '7/4 → 대분수의 실수');
  eq(MH.judge(tm, '1,7,4').mistake.explain, '자연수 1을 덜어 냈는데 분자를 그대로 뒀어요. 덜어 낸 만큼 분자에서 빼야 해요: 7 − 4 × 1 = 3.', '분자를 그대로 둔 실수의 설명');
  eq(J(ti, '7,4') + ' ' + J(ti, '13,4') + ' ' + J(ti, '4,4') + ' ' + J(ti, '3,4'), 'correct:- wrong:concatenated wrong:added wrong:times-numerator', '1과 3/4 → 가분수의 실수');
  eq(J(prob('A08.to-improper', { d: 5, w: 2, r: 3, n: 13 }, { n: 13, d: 5 }), '10,5'), 'wrong:no-numerator', '2와 3/5 → 10/5');
  eq(MH.judge(ti, '1,3,4').note, '값은 맞아요. 자연수 부분 없이 가분수로 써 보세요.', '대분수를 그대로 씀 → 다시 쓰게 함');

  var says = function (id, v) { return MH.types[id].steps(v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  eq(says('A08.part', part.v), '전체를 똑같이 8칸으로 나눴으니 분모는 8이에요. | 색칠한 칸은 6칸이니 분자는 6이에요. | 색칠한 부분은 전체의 8분의 6이에요. [\\dfrac{6}{8}]', '전체와 부분 풀이');
  eq(says('A08.to-mixed', tm.v), '4분의 4가 1이에요. 7 안에 4가 몇 번 들어가는지 나눗셈으로 알아봐요. [7 \\div 4 = 1 \\cdots 3] | 몫 1이 자연수 부분, 나머지 3이 분자가 돼요. 분모는 그대로 4예요. [\\dfrac{7}{4} = 1\\dfrac{3}{4}]', '가분수 → 대분수 풀이');
  eq(says('A08.to-improper', ti.v), '1은 4분의 4와 같으니까, 자연수 1은 4분의 4예요 (1 × 4 = 4). [1 = \\dfrac{4}{4}] | 여기에 4분의 3을 더해요. 분자는 4 + 3 = 7, 분모는 그대로 4예요. [1\\dfrac{3}{4} = \\dfrac{7}{4}]', '대분수 → 가분수 풀이');
  eq(says('A08.quotient', { s: 1, b: 3, a: 2 }).split(' | ').pop(), '2 ÷ 3은 3분의 1이 2개 있는 것과 같아요. 나누어지는 수가 분자, 나누는 수가 분모가 돼요. 답은 3분의 2판이에요. [2 \\div 3 = \\dfrac{2}{3}]', '이야기 문제 풀이의 마지막 줄');
  eq(MH.types['A08.quotient'].hints({ s: 0, b: 7, a: 6 })[0], '1 ÷ 7은 1을 똑같이 7로 나눈 것 가운데 하나, 곧 7분의 1이에요.', '나눗셈의 몫 힌트');
  done('판정 · 실수 · 풀이 예');
})();
