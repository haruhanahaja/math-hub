/* A09 약분과 통분 — 답 형식 choice, 기약분수 요구(reduce: 'require')와 단원 전용 검사.
   화면에 보이는 문제 글을 다시 읽어서, 엔진과 무관한 계산(BigInt 의 곱셈 비교)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000, K = MH.kinds.fraction, C = MH.kinds.choice;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var B = function (x) { return BigInt(x); };
  /** n1/d1 과 n2/d2 가 같은 값인가(서로 곱해서 비교) */
  var same = function (n1, d1, n2, d2) { return B(n1) * B(d2) === B(n2) * B(d1); };
  var g = function (a, b) { a = B(a); b = B(b); while (b) { var t = a % b; a = b; b = t; } return a; };
  var FR = '\\\\dfrac\\{(\\d+|\\\\square|\\\\triangle|\\\\bigcirc)\\}\\{(\\d+|\\\\square|\\\\triangle|\\\\bigcirc)\\}';

  group('답 형식 choice');
  eq(C.parse('>') + C.parse(' = ') + C.parse('<'), '>=<', '보기 읽기');
  eq(C.parse(''), null, '빈 입력');
  eq(C.parse('   '), null, '공백뿐인 입력');
  ok(C.equal('>', '>') && !C.equal('>', '<') && !C.equal(undefined, undefined), '같은 보기만 같음');
  ok(C.valid('=') && !C.valid('') && !C.valid(null) && !C.valid(3), '쓸 수 있는 값');
  eq(C.raw('<') + C.tex('<') + C.say('<'), '<<<', '입력 문자열 · 표시');
  eq(MH.optionsOf(MH.makeProblem('A09.compare', 0, 1)).join(' '), '> = <', '문제의 보기 목록');
  done('읽기 · 비교 · 보기 목록');

  group('답 형식 fraction — 기약분수로 써야 하는 문제 (reduce: require)');
  var need = { reduce: 'require' };
  eq(K.redo(K.parse('2,3'), '2,3', need), null, '기약분수는 그대로 통과');
  eq(K.redo(K.parse('4,6'), '4,6', need), '값은 같지만 더 약분할 수 있어요. 분자와 분모를 함께 나눌 수 있는 수가 더 있는지 찾아보세요.', '덜 약분한 답은 다시 쓰게 함');
  eq(K.redo(K.parse('4,6'), '4,6', {}), null, '보통 문제에서는 다시 쓰게 하지 않음');
  eq(K.note(K.parse('4,6'), '4,6', {}), '약분하면 $\\frac{2}{3}$예요.', '보통 문제에서는 약분 안내만');
  done('덜 약분한 답 다시 쓰기');

  group('A09 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var forms = {};
  each('A09.equal', function (p, pr, level, where) {
    var m = new RegExp('^' + FR + ' = ' + FR + '$').exec(pr.tex);
    if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
    var q = m.slice(1), at = q.indexOf('\\square');
    if (!ok(at >= 2 && q.filter(function (x) { return x === '\\square'; }).length === 1, where + '□는 오른쪽 분수에 하나 ' + pr.tex)) return;
    q[at] = String(p.answer);
    ok(same(q[0], q[1], q[2], q[3]) && p.answer >= 1, where + pr.tex + ' 에 ' + p.answer + ' 를 넣으면 크기가 같지 않음');
    ok(q[1] !== q[3] && B(q[0]) < B(q[1]), where + '서로 다른 분모의 진분수여야 함 ' + pr.tex);
    var up = B(q[3]) > B(q[1]);
    ok(level === 0 ? up : level === 1 ? !up : true, where + '단계에 맞는 방향(곱하기/나누기) ' + pr.tex);
    ok(g(up ? q[0] : q[2], up ? q[1] : q[3]) === 1n, where + '작은 쪽 분수는 기약분수 ' + pr.tex);
    forms[level + ':' + at + (up ? 'x' : '/')] = 1;
  });
  eq(Object.keys(forms).sort().join(' '), '0:2x 0:3x 1:2/ 1:3/ 2:2/ 2:2x 2:3/ 2:3x', '□의 자리와 방향이 모두 나옴');
  done('크기가 같은 분수');
  each('A09.reduce', function (p, pr, level, where) {
    var m = new RegExp('^' + FR + '$').exec(pr.tex);
    if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
    var n = m[1], d = m[2], common = g(n, d);
    ok(same(p.answer.n, p.answer.d, n, d) && g(p.answer.n, p.answer.d) === 1n, where + pr.tex + ' → ' + p.answer.n + '/' + p.answer.d);
    ok(common > 1n && B(n) < B(d), where + '약분할 수 있는 진분수여야 함 ' + pr.tex);
    ok(level === 0 ? [2n, 3n, 5n].indexOf(common) >= 0 : level === 1 ? [4n, 6n, 8n, 9n, 10n, 12n].indexOf(common) >= 0 : common >= 6n, where + '최대공약수 ' + common + ' ' + pr.tex);
    /* 문제의 분수를 그대로, 또는 덜 약분해서 쓰면 틀렸다고 하지 않고 다시 쓰게 한다 */
    var j = MH.judge(p, n + ',' + d);
    ok(j.verdict === 'invalid' && !!j.note, where + '문제의 분수를 그대로 쓰면 다시 쓰게 해야 함');
    if (level > 0) {
      var f = 2n; while (common % f !== 0n) f++;
      if (f < common) {                                   /* 최대공약수가 소수이면 덜 약분한 꼴이 없다 */
        var half = MH.judge(p, (B(n) / f) + ',' + (B(d) / f));
        ok(half.verdict === 'invalid' && !!half.note, where + '덜 약분한 답은 다시 쓰게 해야 함');
      }
    }
  });
  done('기약분수로 나타내기');
  var boxes = {};
  each('A09.common', function (p, pr, level, where) {
    if (level === 0) {
      var m0 = new RegExp('^' + FR + ',\\\\quad ' + FR + '$').exec(pr.tex);
      if (!ok(!!m0, where + '문제 글 형식 ' + pr.tex)) return;
      var b = B(m0[2]), d = B(m0[4]), least = 1n;
      while (least % b !== 0n || least % d !== 0n) least++;
      ok(B(p.answer) === least, where + pr.tex + ' 의 가장 작은 공통분모는 ' + least + ', 답 ' + p.answer);
      ok(b !== d && g(m0[1], b) === 1n && g(m0[3], d) === 1n, where + '분모가 다른 기약분수 둘 ' + pr.tex);
      return;
    }
    var m = new RegExp('^\\\\begin\\{aligned\\}' + FR + ' &= ' + FR + ' \\\\\\\\\\[6pt\\] ' + FR + ' &= ' + FR + '\\\\end\\{aligned\\}$').exec(pr.tex);
    if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
    /* q: 앞 분수(0, 1) · 뒤 분수(2, 3) · 통분한 앞 분수(4, 5) · 통분한 뒤 분수(6, 7) */
    var q = [m[1], m[2], m[5], m[6], m[3], m[4], m[7], m[8]], at = q[4] === '\\square' ? 0 : q[6] === '\\square' ? 1 : -1;
    if (!ok(at >= 0 && q.filter(function (x) { return x === '\\square'; }).length === 1, where + '□는 통분한 분자 가운데 하나 ' + pr.tex)) return;
    var b1 = B(q[1]), d1 = B(q[3]), low = 1n;
    while (low % b1 !== 0n || low % d1 !== 0n) low++;
    ok(same(p.answer, low, q[at * 2], q[at * 2 + 1]), where + pr.tex + ' → ' + p.answer + ' (공통분모 ' + low + ')');
    if (level === 1) {
      ok(B(q[5]) === low && B(q[7]) === low, where + '보여 주는 공통분모가 가장 작은 공통분모여야 함 ' + pr.tex);
      ok(same(q[at ? 4 : 6], low, q[at ? 0 : 2], q[at ? 1 : 3]), where + '보여 주는 다른 분수가 원래 분수와 크기가 같아야 함 ' + pr.tex);
    } else {
      ok(q[5] === '\\triangle' && q[7] === '\\triangle' && q[at ? 4 : 6] === '\\bigcirc', where + '공통분모와 다른 분자는 가려야 함 ' + pr.tex);
      ok(low < b1 * d1, where + '두 분모의 곱보다 작은 공통분모가 있어야 함 ' + pr.tex);
    }
    ok(low > B(q[at * 2 + 1]), where + '□가 있는 분수의 분모가 바뀌어야 함 ' + pr.tex);
    boxes[level + ':' + at] = 1;
  });
  eq(Object.keys(boxes).sort().join(' '), '1:0 1:1 2:0 2:1', '□가 앞 · 뒤 분수에 모두 나옴');
  done('통분');
  var signs = {};
  each('A09.compare', function (p, pr, level, where) {
    var m = new RegExp('^' + FR + ' \\\\;\\\\bigcirc\\\\; ' + FR + '$').exec(pr.tex);
    if (!ok(!!m, where + '문제 글 형식 ' + pr.tex)) return;
    var a = B(m[1]), b = B(m[2]), c = B(m[3]), d = B(m[4]), l = a * d, r = c * b;
    eq(p.answer, l > r ? '>' : l < r ? '<' : '=', where + pr.tex);
    ok(a >= 1n && a < b && c >= 1n && c < d, where + '진분수 둘 ' + pr.tex);
    if (level === 0) ok((b === d) !== (a === c), where + '분모나 분자 가운데 하나만 같아야 함 ' + pr.tex);
    if (level === 1) ok(b !== d && (b % d === 0n || d % b === 0n), where + '한 분모가 다른 분모의 배수 ' + pr.tex);
    if (level === 2) ok(b % d !== 0n && d % b !== 0n, where + '서로 배수가 아닌 분모 ' + pr.tex);
    ok(MH.optionsOf(p).indexOf(p.answer) >= 0, where + '답이 보기에 있어야 함');
    signs[level + p.answer] = (signs[level + p.answer] || 0) + 1;
  });
  ok(signs['0>'] > 300 && signs['0<'] > 300 && !signs['0='], '0단계: > 와 < 가 고르게 나옴 ' + JSON.stringify(signs));
  ok(signs['1>'] > 200 && signs['1<'] > 200 && signs['1='] > 150, '1단계: >, <, = 가 모두 충분히 나옴 ' + JSON.stringify(signs));
  ok(signs['2>'] > 300 && signs['2<'] > 300, '2단계: > 와 < 가 고르게 나옴 ' + JSON.stringify(signs));
  done('분수의 크기 비교');

  group('A09 — 판정 · 흔한 실수 · 풀이의 구체적인 예');
  var prob = function (type, v) { return { type: type, v: v, ctx: null, answer: MH.types[type].solve(v, null) }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var says = function (id, v) { return MH.types[id].steps(v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };

  var e0 = prob('A09.equal', { form: 0, b: 4, a: 3, k: 3 });           /* 3/4 = □/12 */
  eq(e0.answer, 9, '3/4 = □/12 → 9');
  eq(J(e0, '9') + ' ' + J(e0, '11') + ' ' + J(e0, '3') + ' ' + J(e0, '7'), 'correct:- wrong:added wrong:unchanged wrong:-', '3/4 = □/12 의 실수');
  eq(MH.judge(e0, '11').mistake.explain, '분모에 8을 더한 것으로 보고 분자에도 더했어요. 같은 수를 더하거나 빼면 분수의 크기가 달라져요. 분자에도 똑같이 3을 곱해요: 3 × 3 = 9.', '차이만큼 더한 실수의 설명');
  var e3 = prob('A09.equal', { form: 3, b: 5, a: 2, k: 4 });           /* 8/20 = 2/□ */
  eq(e3.answer, 5, '8/20 = 2/□ → 5');
  eq(J(e3, '14') + ' ' + J(e3, '20') + ' ' + J(e3, '4'), 'wrong:added wrong:unchanged wrong:factor-only', '8/20 = 2/□ 의 실수');
  eq(says('A09.equal', e3.v), '분자 8이 2가 됐어요. 8 ÷ 2 = 4이니까 4로 나눈 거예요. | 크기가 같으려면 분모도 똑같이 4로 나눠요: 20 ÷ 4 = 5. [\\dfrac{8}{20} = \\dfrac{2}{5}]', '나누기 풀이');

  var r = prob('A09.reduce', { b: 3, a: 2, g: 6, n: 12, d: 18 });      /* 12/18 */
  eq(r.answer.n + '/' + r.answer.d, '2/3', '12/18 → 2/3');
  eq(J(r, '2,3'), 'correct:-', '2/3 정답');
  eq(J(r, '6,9') + ' ' + J(r, '4,6') + ' ' + J(r, '12,18'), 'invalid:- invalid:- invalid:-', '덜 약분한 답은 오답으로 기록하지 않음');
  ok(!!MH.judge(r, '6,9').note, '덜 약분한 답에는 안내가 붙음');
  eq(J(r, '2,18') + ' ' + J(r, '12,3') + ' ' + J(r, '10,16') + ' ' + J(r, '4,9') + ' ' + J(r, '6,18') + ' ' + J(r, '5,7'), 'wrong:numerator-only wrong:denominator-only wrong:subtracted wrong:different-divisors wrong:different-divisors wrong:-', '12/18 의 실수');
  eq(MH.judge(r, '9,15').mistake.explain, '분자와 분모에서 똑같이 3을 뺐어요. 같은 수를 빼면 분수의 크기가 달라져요. 약분은 분자와 분모를 같은 수로 나누는 거예요.', '같은 수를 뺀 실수의 설명(뺀 수를 읽어서 말함)');
  eq(MH.judge(r, '4,9').mistake.explain, '분자는 3으로, 분모는 2로 나눴어요. 분자와 분모를 같은 수로 나눠야 크기가 변하지 않아요. 12와 18을 함께 나눌 수 있는 수를 찾아보세요.', '서로 다른 수로 나눈 실수의 설명');
  eq(MH.judge(r, '6,18').mistake.explain.split('.')[0], '분자만 2로 나눴어요', '분자만 조금 나눈 실수의 설명');
  eq(says('A09.reduce', r.v), '12와 18은 둘 다 2로 나누어떨어져요. 분자와 분모를 2로 나눠요. [\\dfrac{12}{18} = \\dfrac{12 \\div 2}{18 \\div 2} = \\dfrac{6}{9}] | 6과 9는 둘 다 3으로 나누어떨어져요. 분자와 분모를 3으로 나눠요. [\\dfrac{6}{9} = \\dfrac{6 \\div 3}{9 \\div 3} = \\dfrac{2}{3}] | 2와 3을 함께 나눌 수 있는 수는 1뿐이에요. 기약분수는 3분의 2예요. (처음부터 최대공약수 6으로 한 번에 나눠도 돼요.) [\\dfrac{12}{18} = \\dfrac{2}{3}]', '약분 풀이');

  var c0 = prob('A09.common', { q: 0, which: 0, b: 4, d: 6, a: 3, c: 5 });   /* 3/4, 5/6 */
  eq(c0.answer, 12, '3/4, 5/6 의 가장 작은 공통분모 12');
  eq(J(c0, '12') + ' ' + J(c0, '24') + ' ' + J(c0, '2') + ' ' + J(c0, '10') + ' ' + J(c0, '6') + ' ' + J(c0, '36'), 'correct:- wrong:product wrong:gcd wrong:sum wrong:bigger wrong:-', '공통분모의 실수');
  eq(says('A09.common', c0.v), '공통분모는 두 분모의 공배수예요. 배수를 차례로 써 봐요. [\\begin{aligned}4&: 4, 8, 12, \\cdots \\\\ 6&: 6, 12, \\cdots\\end{aligned}] | 처음으로 똑같이 나오는 수는 12예요. 가장 작은 공통분모는 두 분모의 최소공배수 12예요. (두 분모의 곱 24보다 작아요.)', '공통분모 풀이');
  var c2 = prob('A09.common', { q: 2, which: 1, b: 4, d: 6, a: 3, c: 5 });   /* 5/6 → □/12 */
  eq(c2.answer, 10, '5/6 → 10/12');
  eq(J(c2, '10') + ' ' + J(c2, '5') + ' ' + J(c2, '2') + ' ' + J(c2, '15') + ' ' + J(c2, '11') + ' ' + J(c2, '20'), 'correct:- wrong:unchanged wrong:multiplier wrong:other-multiplier wrong:added wrong:product-denominator', '통분한 분자의 실수');
  eq(MH.types['A09.common'].hints({ q: 1, which: 0, b: 10, d: 3, a: 7, c: 2 })[2], '곱할 수는 30 ÷ 10이에요.', '통분 힌트의 조사');
  eq(MH.types['A09.common'].steps({ q: 1, which: 1, b: 10, d: 5, a: 9, c: 3 })[2].say, '□에 알맞은 수는 6이에요. 다른 분수는 분모가 이미 10이라서 그대로예요.', '다른 분수가 바뀌지 않을 때의 풀이');
  eq(says('A09.reduce', { b: 2, a: 1, g: 5, n: 5, d: 10 }).split(' | ')[1], '1과 2를 함께 나눌 수 있는 수는 1뿐이에요. 기약분수는 2분의 1이에요. [\\dfrac{5}{10} = \\dfrac{1}{2}]', '한 번에 끝나는 약분 풀이');
  eq(MH.types['A09.common'].prompt(c2.v).tex, '\\begin{aligned}\\dfrac{3}{4} &= \\dfrac{\\bigcirc}{\\triangle} \\\\[6pt] \\dfrac{5}{6} &= \\dfrac{\\square}{\\triangle}\\end{aligned}', '공통분모를 가린 문제');
  eq(MH.types['A09.common'].prompt({ q: 1, which: 0, b: 4, d: 6, a: 3, c: 5 }).tex, '\\begin{aligned}\\dfrac{3}{4} &= \\dfrac{\\square}{12} \\\\[6pt] \\dfrac{5}{6} &= \\dfrac{10}{12}\\end{aligned}', '공통분모를 보여 주는 문제');
  eq(says('A09.common', c2.v), '4와 6의 최소공배수는 12예요. 이것이 가장 작은 공통분모예요. | 12 ÷ 6 = 2니까 분모와 분자에 2를 곱해요. [\\dfrac{5}{6} = \\dfrac{5 \\times 2}{6 \\times 2} = \\dfrac{10}{12}] | □에 알맞은 수는 10이에요. 다른 분수는 12 ÷ 4 = 3을 곱해 12분의 9가 돼요. [\\begin{aligned}\\dfrac{3}{4} &= \\dfrac{9}{12} \\\\[6pt] \\dfrac{5}{6} &= \\dfrac{10}{12}\\end{aligned}]', '통분 풀이');

  var cmp = function (a, b, c, d) { return prob('A09.compare', { a: a, b: b, c: c, d: d }); };
  eq(cmp(3, 4, 5, 6).answer + cmp(5, 6, 3, 4).answer + cmp(2, 4, 3, 6).answer + cmp(3, 7, 5, 7).answer + cmp(2, 3, 2, 5).answer, '<>=<>', '크기 비교의 답');
  eq(J(cmp(3, 4, 5, 6), '<') + ' ' + J(cmp(3, 4, 5, 6), '>') + ' ' + J(cmp(3, 4, 5, 6), '='), 'correct:- wrong:opposite wrong:said-equal', '3/4 ○ 5/6');
  eq(J(cmp(2, 3, 2, 5), '<') + ' ' + J(cmp(2, 3, 2, 5), '='), 'wrong:bigger-denominator wrong:said-equal', '2/3 ○ 2/5 (분자가 같을 때)');
  eq(J(cmp(2, 3, 5, 9), '<') + ' ' + J(cmp(5, 9, 2, 3), '>'), 'wrong:bigger-numbers wrong:bigger-numbers', '2/3 ○ 5/9 (수가 큰 쪽을 고름)');
  eq(J(cmp(2, 4, 3, 6), '=') + ' ' + J(cmp(2, 4, 3, 6), '>') + ' ' + J(cmp(1, 2, 3, 6), '<'), 'correct:- wrong:missed-equal wrong:bigger-numbers', '2/4 ○ 3/6 (크기가 같을 때)');
  eq(J(cmp(3, 4, 5, 6), '') + ' ' + J(cmp(3, 4, 5, 6), '?'), 'invalid:- wrong:-', '고르지 않음 · 보기에 없는 글자');
  eq(MH.judge(cmp(3, 4, 5, 6), '>').mistake.explain, '부등호의 방향이 반대예요. 부등호는 벌어진 쪽이 큰 수예요. 분모를 12로 같게 하면(통분) 12분의 9와 12분의 10이에요. 분자 9가 10보다 작으니까 4분의 3이 6분의 5보다 작아요.', '방향이 반대인 실수의 설명');
  eq(MH.judge(cmp(2, 4, 3, 6), '>').mistake.explain, '두 분수는 모양이 달라도 크기가 같아요. 분모를 12로 같게 하면(통분) 12분의 6과 12분의 6이에요. 분자가 같으니까 4분의 2와 6분의 3은 크기가 같아요.', '크기가 같은 것을 놓친 실수의 설명');
  eq(says('A09.compare', cmp(3, 4, 5, 6).v), '분모가 달라서 그대로는 비교할 수 없어요. 공통분모를 12로 해서 통분해요. [\\dfrac{3}{4} = \\dfrac{9}{12},\\quad \\dfrac{5}{6} = \\dfrac{10}{12}] | 분모가 같아졌으니 분자를 비교해요. [\\dfrac{9}{12} \\;<\\; \\dfrac{10}{12}] | 9가 10보다 작으니까 4분의 3이 6분의 5보다 작아요. [\\dfrac{3}{4} \\;<\\; \\dfrac{5}{6}]', '통분해서 비교하는 풀이');
  eq(says('A09.compare', cmp(1, 3, 5, 12).v).split(' | ')[0], '분모가 달라서 그대로는 비교할 수 없어요. 공통분모를 12로 해서 통분해요. [\\dfrac{1}{3} = \\dfrac{4}{12}]', '한 분모가 배수이면 바뀌는 분수만 보여 줌');
  eq(says('A09.compare', cmp(2, 3, 2, 5).v), '분자가 2로 같아요. 조각 수가 같으니 조각 하나의 크기를 비교해요. | 분모가 작을수록 조각 하나가 커요. 분모 3이 5보다 작으니까 3분의 2가 5분의 2보다 커요. [\\dfrac{2}{3} \\;>\\; \\dfrac{2}{5}]', '분자가 같을 때의 풀이');
  eq(says('A09.compare', cmp(3, 7, 5, 7).v), '분모가 7로 같아요. 조각 하나의 크기가 같으니 분자만 비교하면 돼요. | 3이 5보다 작으니까 7분의 3이 7분의 5보다 작아요. [\\dfrac{3}{7} \\;<\\; \\dfrac{5}{7}]', '분모가 같을 때의 풀이');
  done('판정 · 실수 · 풀이 예');
})();
