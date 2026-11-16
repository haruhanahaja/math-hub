/* B01 소인수분해 — 답 형식 factors 와 단원 전용 검사.
   화면에 보이는 문제 글 · 식을 다시 읽어서, 엔진과 무관한 계산(BigInt, 하나씩 세기)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000, FAC = MH.kinds.factors;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var nums = function (text) { return (text.match(/\d+/g) || []).map(Number); };
  var divides = function (d, n) { return BigInt(n) % BigInt(d) === 0n; };
  var countDiv = function (n) { var c = 0; for (var d = 1; d <= n; d++) if (divides(d, n)) c++; return c; };
  var primeQ = function (n) { return countDiv(n) === 2; };
  var gcdOf = function (list) { for (var d = Math.min.apply(null, list); ; d--) if (list.every(function (n) { return divides(d, n); })) return d; };
  var lcmOf = function (list) { for (var x = 1; ; x++) if (list.every(function (n) { return divides(n, x); })) return x; };
  /** 수식 '2^{3} \times 3' 을 BigInt 로 계산한다 */
  var evalTex = function (tex) {
    return Number(tex.split('\\times').reduce(function (acc, part) {
      var m = /^\s*(\d+)(?:\^\{(\d+)\})?\s*$/.exec(part);
      if (!m) throw new Error('읽을 수 없는 식: ' + tex);
      return acc * BigInt(m[1]) ** BigInt(m[2] || 1);
    }, 1n));
  };

  group('답 형식 factors');
  var F = function (raw) { var v = FAC.parse(raw); return v && v.f.join(','); };
  eq(F('2×2×3×7'), '2,2,3,7', '곱으로 쓴 답');
  eq(F('2^2×3×7'), '2,2,3,7', '거듭제곱으로 쓴 답');
  eq(F('7×3×2^2'), '7,3,2,2', '순서를 바꿔 쓴 답');
  eq(F('2*2x3'), '2,2,3', '자판의 * 와 x');
  eq(F('2×3×'), '2,3', '끝에 남은 ×');
  eq(F('84'), '84', '수 하나');
  eq(F(''), null, '빈칸'); eq(F('×'), null, '× 만'); eq(F('2^'), null, '지수가 빔'); eq(F('2××3'), null, '× 두 번');
  eq(F('0×3'), null, '0'); eq(F('2^0'), null, '지수 0'); eq(F('2^3^2'), null, '지수 두 번'); eq(F('2.5'), null, '소수점');
  ok(FAC.equal(FAC.parse('3×2^2×7'), { f: [2, 2, 3, 7] }), '순서가 달라도 같은 값');
  ok(!FAC.equal(FAC.parse('2×3×7'), { f: [2, 2, 3, 7] }), '개수가 다르면 다른 값');
  ok(!FAC.equal(FAC.parse('4×3×7'), { f: [2, 2, 3, 7] }), '곱은 같아도 쓴 수가 다르면 다른 값');
  eq(FAC.tex({ f: [7, 2, 3, 2] }), '2^{2} \\times 3 \\times 7', '정답을 보여 줄 때는 작은 소수부터, 거듭제곱으로');
  eq(FAC.raw({ f: [2, 2, 3, 7] }), '2^2×3×7', 'raw');
  eq(FAC.sayTex(FAC.parse('7×2×2')), '7 \\times 2 \\times 2', '내 답은 쓴 그대로');
  eq(FAC.show('2^3×3^'), '2^{3} \\times 3^{\\square}', '입력 중인 지수 칸');
  eq(FAC.show('2^3×'), '2^{3} \\times ', '입력 중인 ×');
  var fp = { type: 'B01.factor', v: { e: 0, n: 84 }, ctx: null, answer: { f: [2, 2, 3, 7] } };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var E = function (p, raw) { return MH.judge(p, raw).mistake.explain; };
  eq(J(fp, '2^2×3×7'), 'correct:-', '84 = 2²×3×7');
  eq(J(fp, '3×7×2^2'), 'correct:-', '순서를 바꿔도 정답');
  eq(J(fp, '2×2×3×7'), 'correct-note:-', '거듭제곱으로 묶지 않으면 정답 + 안내');
  eq(MH.judge(fp, '2×2×3×7').note, '같은 수를 여러 번 곱할 때는 거듭제곱으로 써요: $2^{2} \\times 3 \\times 7$.', '거듭제곱 안내');
  eq(J(fp, ''), 'invalid:-', '빈칸');
  eq(J(fp, '2×42'), 'wrong:stopped-early', '84 → 2×42');
  eq(J(fp, '2×3×7'), 'wrong:distinct-only', '84 → 2×3×7');
  eq(J(fp, '4×3×7'), 'wrong:not-prime', '84 → 4×3×7');
  eq(J(fp, '84'), 'wrong:not-prime', '84 → 84');
  eq(J(fp, '1×2^2×3×7'), 'wrong:has-one', '84 → 1×2²×3×7');
  eq(J(fp, '2^3×3×7'), 'wrong:wrong-product', '84 → 2³×3×7');
  eq(E(fp, '4×3×7'), '4는 소수가 아니에요. 4를 더 작은 소수들의 곱으로 나누어 쓰세요.', '소수가 아닌 수를 쓴 실수의 설명');
  eq(E(fp, '2^3×3×7'), '쓴 수들을 모두 곱하면 168이 돼요. 84가 되어야 해요. 빠뜨리거나 더 쓴 수가 없는지, 지수는 맞는지 확인해 보세요.', '곱이 다른 실수의 설명');
  eq(E(fp, '2×42'), '42는 소수가 아니에요. 42도 더 나눌 수 있어요. 소수만 남을 때까지 계속 나눠요.', '일찍 멈춘 실수의 설명');
  done('읽기 · 판정 · 공통 실수');

  group('B01 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var seen = {};
  each('B01.prime', function (p, pr, level, where) {
    var n = nums(pr.text), opts = MH.optionsOf(p);
    if (level === 0) {
      if (!ok(n.length === 1 && n[0] >= 1 && n[0] <= 30, where + '문제 글 형식 ' + pr.text)) return;
      var c = countDiv(n[0]);
      eq(p.answer, c === 1 ? '둘 다 아님' : c === 2 ? '소수' : '합성수', where + pr.text);
      eq(opts.join('/'), '소수/합성수/둘 다 아님', where + '보기');
      seen[p.answer] = 1;
    } else {
      if (!ok(n.length === 4 && n.join() === n.slice().sort(function (a, b) { return a - b; }).join(), where + '문제 글 형식 ' + pr.text)) return;
      eq(opts.join(), n.join(), where + '보기가 문제 글의 수와 같음');
      var primes = n.filter(primeQ);
      ok(primes.length === 1 && String(primes[0]) === p.answer, where + pr.text + ' → ' + p.answer);
      ok(n.every(function (x) { return x % 2 === 1 && x <= 100; }) && (level === 1 ? primes[0] < 50 : primes[0] > 50), where + '수의 범위 ' + pr.text);
    }
    ok(opts.indexOf(p.answer) >= 0, where + '정답이 보기에 없음');
  });
  eq(Object.keys(seen).sort().join(' '), '둘 다 아님 소수 합성수', '세 가지 답이 모두 나옴');
  done('소수와 합성수');
  var forms = {};
  each('B01.power', function (p, pr, level, where) {
    var m, x;
    if ((m = /^(\d+)\^\{(\d+)\}$/.exec(pr.tex))) {                                   /* aⁿ 의 값 */
      eq(p.answer, Number(BigInt(m[1]) ** BigInt(m[2])), where + pr.tex);
      ok(level === 0 && p.answer <= 100000, where + '단계 · 크기 ' + pr.tex);
      forms.value = 1;
    } else if ((m = /^(\d+) = (\d+)\^\{\\square\}$/.exec(pr.tex))) {                 /* V = a^□ */
      eq(Number(BigInt(m[2]) ** BigInt(p.answer)), Number(m[1]), where + pr.tex + ' → ' + p.answer);
      ok(level === 1 && p.answer >= 2, where + '단계 ' + pr.tex);
      forms.exponent = 1;
    } else if ((m = /^((?:\d+ \\times )+\d+) = (\d+)\^\{\\square\}$/.exec(pr.tex))) { /* a × a × … = a^□ */
      x = m[1].split(' \\times ');
      ok(x.every(function (t) { return t === m[2]; }) && p.answer === x.length && level === 1, where + pr.tex + ' → ' + p.answer);
      forms.count = 1;
    } else {                                                                         /* aⁿ × bᵐ */
      eq(p.answer, evalTex(pr.tex), where + pr.tex);
      ok(level === 2 && pr.tex.split('\\times').length === 2 && /\^/.test(pr.tex) && p.answer <= 2000, where + '단계 · 꼴 ' + pr.tex);
      forms.product = 1;
    }
  });
  eq(Object.keys(forms).sort().join(' '), 'count exponent product value', '네 가지 꼴이 모두 나옴');
  done('거듭제곱');
  each('B01.factor', function (p, pr, level, where) {
    var n = nums(pr.text), x = 1n;
    if (!ok(n.length === 1 && /소인수분해/.test(pr.text), where + '문제 글 형식 ' + pr.text)) return;
    p.answer.f.forEach(function (q) { x *= BigInt(q); });
    ok(Number(x) === n[0] && p.answer.f.every(primeQ), where + pr.text + ' → ' + p.answer.f.join(' × '));
    ok(p.answer.f.length >= (level ? 3 : 2) && n[0] > [3, 60, 300][level] && n[0] <= [60, 400, 2000][level], where + '수의 범위 ' + pr.text);
    eq(evalTex(FAC.tex(p.answer)), n[0], where + '정답으로 보여 줄 식');
    /* 곱으로 풀어 쓴 답도 정답(같은 소수가 있으면 안내가 붙는다) */
    var repeated = p.answer.f.some(function (q, i) { return p.answer.f.indexOf(q) !== i; });
    eq(MH.judge(p, p.answer.f.join('×')).verdict, repeated ? 'correct-note' : 'correct', where + '풀어 쓴 답');
  });
  done('소인수분해');
  ['B01.gcd', 'B01.lcm'].forEach(function (id) {
    var isGcd = id === 'B01.gcd', word = isGcd ? '최대공약수' : '최소공배수', limit = isGcd ? [600, 200, 150] : [3000, 100, 60];
    each(id, function (p, pr, level, where) {
      var n = level === 0 ? pr.tex.split(',\\quad ').map(evalTex) : nums(pr.text);
      if (!ok(n.length === (level === 2 ? 3 : 2) && pr.text.indexOf(word) >= 0 && (level === 0) === !!pr.tex, where + '문제 형식 ' + (pr.tex || '') + ' ' + pr.text)) return;
      var g = gcdOf(n);
      eq(p.answer, isGcd ? g : lcmOf(n), where + (pr.tex || pr.text));
      ok(n.every(function (x) { return x <= limit[level] && !primeQ(x) && x !== g; }) && g > 1, where + '수의 범위 ' + n.join(', '));
      ok(level === 0 || n.join() === n.slice().sort(function (a, b) { return a - b; }).join(), where + '작은 수부터 나옴 ' + pr.text);
      if (isGcd) ok(!primeQ(g), where + '최대공약수가 소수(힌트가 답을 말하게 됨) ' + n.join(', '));
      else ok(p.answer <= (level ? 1000 : 1500), where + '답의 크기 ' + p.answer);
      /* 풀이에 나오는 소인수분해가 맞는가 */
      MH.types[id].steps(p.v).forEach(function (s) {
        var m = /^(\d+) = (.+)$/.exec(s.tex || '');
        if (m && !/=/.test(m[2])) eq(evalTex(m[2]), Number(m[1]), where + '풀이의 식 ' + s.tex);
      });
    });
    done(word);
  });

  group('B01 — 흔한 실수와 풀이의 구체적인 예');
  var prob = function (type, v, answer) { return { type: type, v: v, ctx: null, answer: answer }; };
  var p1 = prob('B01.prime', { form: 0, n: 1, opts: 0 }, '둘 다 아님'), p9 = prob('B01.prime', { form: 0, n: 9, opts: 0 }, '합성수'), p7 = prob('B01.prime', { form: 0, n: 7, opts: 0 }, '소수');
  eq(J(p1, '소수') + ' ' + J(p1, '합성수') + ' ' + J(p1, '둘 다 아님'), 'wrong:said-prime wrong:said-composite correct:-', '1은 소수도 합성수도 아님');
  eq(J(p9, '소수') + ' ' + J(p9, '둘 다 아님'), 'wrong:said-prime wrong:said-neither', '9는 합성수');
  eq(J(p7, '합성수'), 'wrong:said-composite', '7은 소수');
  eq(E(p9, '소수'), '9는 3으로 나누어떨어져요(9 = 3 × 3). 1과 9 말고도 약수가 있으니 소수가 아니에요.', '합성수를 소수라고 한 실수의 설명');
  eq(E(p1, '소수'), '1은 약수가 1 하나뿐이에요. 소수는 약수가 딱 2개여야 해서, 1은 소수가 아니에요.', '1을 소수라고 한 실수의 설명');
  var pk = prob('B01.prime', { form: 1, n: 53, opts: [51, 53, 57, 91] }, '53');
  eq(J(pk, '53') + ' ' + J(pk, '91'), 'correct:- wrong:picked-composite', '51, 53, 57, 91 가운데 소수');
  eq(E(pk, '91'), '91은 7로 나누어떨어져요(91 = 7 × 13). 1과 91 말고도 약수가 있으니 합성수예요.', '합성수를 고른 실수의 설명');
  var w0 = prob('B01.power', { form: 0, a: 2, n: 5, b: 0, m: 0 }, 32), w1 = prob('B01.power', { form: 1, a: 3, n: 4, b: 0, m: 0 }, 4);
  var w2 = prob('B01.power', { form: 2, a: 5, n: 4, b: 0, m: 0 }, 4), w3 = prob('B01.power', { form: 3, a: 2, n: 3, b: 3, m: 2 }, 72);
  eq([J(w0, '32'), J(w0, '10'), J(w0, '25'), J(w0, '16'), J(w0, '64')].join(' '), 'correct:- wrong:times wrong:swapped wrong:one-less wrong:one-more', '2⁵ 의 실수');
  eq([J(w1, '4'), J(w1, '3'), J(w1, '5'), J(w1, '27')].join(' '), 'correct:- wrong:counted-less wrong:counted-more wrong:divided', '81 = 3^□ 의 실수');
  eq(J(w2, '3'), 'wrong:counted-less', '5 × 5 × 5 × 5 = 5^□ → 3');
  eq(E(w2, '3'), '× 기호의 수를 셌어요. 지수는 곱해진 5의 개수예요. 5가 모두 몇 개인지 다시 세어 보세요.', '× 기호를 센 실수의 설명');
  eq([J(w3, '72'), J(w3, '36'), J(w3, '17')].join(' '), 'correct:- wrong:times-each wrong:added', '2³ × 3² 의 실수');
  eq(E(w0, '10'), '밑과 지수를 곱했어요(2 × 5). 2의 5제곱은 2를 5번 곱한 수예요: 2 × 2 × 2 × 2 × 2.', '밑 × 지수 실수의 설명');
  var g2 = prob('B01.gcd', { shown: false, E: [[3, 2, 0, 0], [3, 1, 1, 0]] }, 24), l2 = prob('B01.lcm', { shown: false, E: [[2, 1, 0, 0], [1, 2, 0, 0]] }, 36);
  eq([J(g2, '24'), J(g2, '360'), J(g2, '72'), J(g2, '6'), J(g2, '12'), J(g2, '9'), J(g2, '7')].join(' '),
    'correct:- wrong:opposite wrong:larger-exponent wrong:once-each wrong:common-not-best wrong:not-common wrong:-', '72와 120의 최대공약수');
  eq(E(g2, '9'), '9는 72의 약수이지만 120의 약수는 아니에요. 모든 수의 약수를 찾아야 해요.', '한 수의 약수일 뿐인 실수의 설명');
  eq([J(l2, '36'), J(l2, '6'), J(l2, '216'), J(l2, '72'), J(l2, '24'), J(l2, '5')].join(' '),
    'correct:- wrong:opposite wrong:product wrong:common-not-best wrong:not-common wrong:-', '12와 18의 최소공배수');
  var g3 = prob('B01.gcd', { shown: false, E: [[2, 1, 0, 0], [2, 2, 0, 0], [2, 1, 1, 0]] }, 12);
  eq(J(g3, '12') + ' ' + J(g3, '180') + ' ' + J(g3, '6'), 'correct:- wrong:opposite wrong:once-each', '12, 36, 60의 최대공약수');

  var says = function (id, v) { return MH.types[id].steps(v).map(function (s) { return s.say + (s.tex ? ' [' + s.tex + ']' : ''); }).join(' | '); };
  eq(says('B01.prime', p7.v), '7을 작은 소수로 나누어 봐요: 7 ÷ 2 = 3 … 1. 나누어떨어지는 것이 없어요. | 7의 약수는 1과 7, 2개뿐이에요. 그래서 7은 소수예요.', '소수 풀이');
  eq(says('B01.power', w0.v), '2의 5제곱은 2를 5번 곱한 수예요. [2^{5} = 2 \\times 2 \\times 2 \\times 2 \\times 2] | 앞에서부터 차례로 곱하면 2, 4, 8, 16, 32. 답은 32예요. [2^{5} = 32]', '거듭제곱 풀이');
  eq(says('B01.power', w3.v), '거듭제곱을 각각 먼저 계산해요. [2^{3} = 8,\\quad 3^{2} = 9] | 두 값을 곱해요. [8 \\times 9 = 72]', '거듭제곱의 곱 풀이');
  eq(says('B01.factor', fp.v), '작은 소수부터 차례로 나눠요: 84 ÷ 2 = 42, 42 ÷ 2 = 21, 21 ÷ 3 = 7. 몫 7은 소수라서 여기서 멈춰요. | 나눈 소수들과 마지막 몫을 모두 곱하면 처음 수가 돼요. [84 = 2 \\times 2 \\times 3 \\times 7] | 같은 소수를 여러 번 곱한 것은 거듭제곱으로 묶어 써요. [84 = 2^{2} \\times 3 \\times 7]', '소인수분해 풀이');
  eq(says('B01.gcd', g2.v), '72를 소인수분해해요. [72 = 2^{3} \\times 3^{2}] | 120을 소인수분해해요. [120 = 2^{3} \\times 3 \\times 5] | 모든 수에 공통으로 들어 있는 소인수는 2, 3이에요. 소인수마다 지수가 가장 작은 것을 골라요(지수가 안 쓰여 있으면 1). [2^{3} \\times 3] | 곱하면 최대공약수예요. [2^{3} \\times 3 = 24]', '최대공약수 풀이');
  eq(says('B01.lcm', l2.v).split(' | ').slice(2).join(' | '), '어느 한 수에라도 들어 있는 소인수는 2, 3이에요. 소인수마다 지수가 가장 큰 것을 골라요. [2^{2} \\times 3^{2}] | 곱하면 최소공배수예요. [2^{2} \\times 3^{2} = 36]', '최소공배수 풀이');
  eq(MH.types['B01.gcd'].hints(g2.v)[0], '먼저 각 수를 소인수분해해요. $72 = 2^{3} \\times 3^{2}$ 이에요. 다른 수도 같은 방법으로 해 보세요.', '최대공약수 힌트');
  eq(MH.types['B01.prime'].prompt(p7.v).text + ' / ' + MH.types['B01.gcd'].prompt(g3.v).text, '7은 소수일까요, 합성수일까요? / 12, 36, 60의 최대공약수를 구하세요.', '문제 글');
  done('실수 · 풀이 예');
})();
