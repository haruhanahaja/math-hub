/* A07 약수와 배수 — 단원 전용 검사.
   화면에 보이는 문제 글을 다시 읽어서, 엔진과 무관한 계산(BigInt, 하나씩 세기)으로 답을 확인한다. */
(function () {
  'use strict';
  var N = 1000;
  function each(id, fn) {
    MH.types[id].levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= N; seed++) { var p = MH.makeProblem(id, level, seed); fn(p, MH.types[id].prompt(p.v, p.ctx), level, id + ' ' + level + '단계 씨앗 ' + seed + ': '); }
    });
  }
  var nums = function (text) { return (text.match(/\d+/g) || []).map(Number); };
  var divides = function (d, n) { return BigInt(n) % BigInt(d) === 0n; };
  var divisorsOf = function (n) { var out = []; for (var d = 1; d <= n; d++) if (divides(d, n)) out.push(d); return out; };
  /** 최대공약수: 공통인 약수 가운데 가장 큰 것 · 최소공배수: 1, 2, 3 … 을 차례로 보다가 처음 만나는 공배수 */
  var gcdOf = function (a, b) { return divisorsOf(a).filter(function (d) { return divides(d, b); }).pop(); };
  var lcmOf = function (a, b) { for (var x = 1; ; x++) if (divides(a, x) && divides(b, x)) return x; };

  group('A07 — 보이는 문제와 답이 맞는가 (유형 · 단계마다 1,000문제)');
  var seenForms = {};
  each('A07.divisors', function (p, pr, level, where) {
    var n = nums(pr.text), d = divisorsOf(n[0]), count = /몇 개/.test(pr.text);
    ok(count ? n.length === 1 : n.length === 2, where + '문제 글 형식 ' + pr.text);
    eq(p.answer, count ? d.length : d[n[1] - 1], where + pr.text);
    ok(d.length >= 4 && n[0] <= [30, 50, 100][level], where + '수의 범위 ' + pr.text);
    if (!count) ok(n[1] >= 2 && n[1] <= d.length - 1, where + '순서의 범위 ' + pr.text);
    eq(MH.types['A07.divisors'].answer.suffix(p.v), count ? '개' : '', where + '답 칸의 단위');
    seenForms[level + (count ? 'c' : 'k')] = 1;
  });
  eq(Object.keys(seenForms).sort().join(' '), '0c 1k 2c 2k', '단계마다 정해진 꼴이 나옴');
  done('약수');
  each('A07.multiples', function (p, pr, level, where) {
    var n = nums(pr.text), i, c = 0;
    if (level === 0) {                                     /* a 의 배수 … k 번째 */
      ok(/번째/.test(pr.text) && n.length === 2, where + '문제 글 형식 ' + pr.text);
      eq(p.answer, Number(BigInt(n[0]) * BigInt(n[1])), where + pr.text);
    } else if (level === 1) {                              /* 1 부터 N 까지 … a 의 배수 */
      ok(/몇 개/.test(pr.text) && n.length === 3 && n[0] === 1, where + '문제 글 형식 ' + pr.text);
      for (i = 1; i <= n[1]; i++) if (divides(n[2], i)) c++;
      ok(p.answer === c && c >= 2, where + pr.text + ' → ' + p.answer + ' (세어 보면 ' + c + ')');
    } else {                                               /* N 보다 큰 a 의 배수 가운데 가장 작은 수 */
      ok(/보다 큰/.test(pr.text) && n.length === 2, where + '문제 글 형식 ' + pr.text);
      for (i = n[0] + 1; !divides(n[1], i); i++);
      ok(p.answer === i && !divides(n[1], n[0]), where + pr.text + ' → ' + p.answer + ' (찾아 보면 ' + i + ')');
    }
    eq(MH.types['A07.multiples'].answer.suffix(p.v), level === 1 ? '개' : '', where + '답 칸의 단위');
  });
  done('배수');
  each('A07.gcd', function (p, pr, level, where) {
    var n = nums(pr.text);
    if (!ok(n.length === 2 && /최대공약수/.test(pr.text) && n[0] < n[1], where + '문제 글 형식 ' + pr.text)) return;
    eq(p.answer, gcdOf(n[0], n[1]), where + pr.text);
    ok(p.answer >= 2 && n[1] <= (level ? 120 : 40) && (level === 0 || !divides(n[0], n[1])), where + '수의 범위 ' + pr.text);
  });
  done('최대공약수');
  each('A07.lcm', function (p, pr, level, where) {
    var n = nums(pr.text);
    if (!ok(n.length === 2 && /최소공배수/.test(pr.text) && n[0] < n[1], where + '문제 글 형식 ' + pr.text)) return;
    eq(p.answer, lcmOf(n[0], n[1]), where + pr.text);
    ok(p.answer <= (level ? 200 : 72), where + '답의 크기 ' + pr.text + ' → ' + p.answer);
  });
  done('최소공배수');
  var used = {};
  each('A07.word', function (p, pr, level, where) {
    var n = nums(pr.text);
    if (!ok(n.length === 2 && n[0] < n[1], where + '문제 글에 수가 두 개가 아님: ' + pr.text)) return;
    eq(p.answer, p.ctx.kind === 'gcd' ? gcdOf(n[0], n[1]) : lcmOf(n[0], n[1]), where + pr.text);
    ok(gcdOf(n[0], n[1]) >= 2 && !divides(n[0], n[1]), where + '두 수의 관계 ' + pr.text);
    ok(pr.text.indexOf(p.ctx.unit) >= 0, where + '단위가 문제에 없음');
    eq(MH.types['A07.word'].answer.suffix(p.v, p.ctx), p.ctx.unit, where + '답 칸의 단위');
    /* 최대공약수 문제의 힌트는 답을 그대로 말하지 않는다(답이 작아 자동 검사가 건너뛰는 부분) */
    if (p.ctx.kind === 'gcd') ok(nums(MH.types['A07.word'].hints(p.v, p.ctx).join(' ')).indexOf(p.answer) < 0 || n.indexOf(p.answer) >= 0, where + '힌트가 답을 말함');
    used[p.ctx.id] = 1;
  });
  eq(Object.keys(used).length, MH.types['A07.word'].contexts.length, '모든 상황이 쓰임');
  each('A07.gcd', function (p, pr, level, where) {
    ok(nums(MH.types['A07.gcd'].hints(p.v).join(' ')).indexOf(p.answer) < 0 || nums(pr.text).indexOf(p.answer) >= 0, where + '힌트가 답을 말함');
  });
  done('문장제 · 힌트가 답을 말하지 않음');

  group('A07 — 흔한 실수와 풀이의 구체적인 예');
  var prob = function (type, v, answer, ctx) { return { type: type, v: v, ctx: ctx || null, answer: answer }; };
  var J = function (p, raw) { var j = MH.judge(p, raw); return j.verdict + ':' + (j.mistake ? j.mistake.id : '-'); };
  var E = function (p, raw) { return MH.judge(p, raw).mistake.explain; };
  var dc = prob('A07.divisors', { form: 0, n: 24, k: 0 }, 8), dk = prob('A07.divisors', { form: 1, n: 24, k: 5 }, 6);
  eq(J(dc, '8'), 'correct:-', '24의 약수는 8개');
  eq(J(dc, '6'), 'wrong:missed-ends', '24의 약수 → 6개 (1과 24를 빠뜨림)');
  eq(J(dc, '7'), 'wrong:missed-one', '24의 약수 → 7개');
  eq(J(dc, '4'), 'wrong:pairs', '24의 약수 → 4개 (짝의 수)');
  eq(J(dk, '6'), 'correct:-', '24의 약수 5번째는 6');
  eq(J(dk, '8'), 'wrong:counted-from-two', '24의 약수 5번째 → 8');
  eq(J(dk, '4'), 'wrong:previous', '24의 약수 5번째 → 4');
  eq(J(dk, '120'), 'wrong:multiple', '24의 약수 5번째 → 120');
  eq(E(dk, '5'), '5는 24의 약수가 아니에요. 24를 5로 나누면 나누어떨어지지 않아요.', '약수가 아닌 수');
  eq(E(dk, '0'), '0은 24의 약수가 아니에요. 0으로는 나눌 수 없어요.', '0');
  var m0 = prob('A07.multiples', { form: 0, a: 7, k: 6, N: 0 }, 42), m1 = prob('A07.multiples', { form: 1, a: 7, k: 0, N: 50 }, 7), m2 = prob('A07.multiples', { form: 2, a: 7, k: 0, N: 50 }, 56);
  eq(J(m0, '35') + ' ' + J(m0, '49') + ' ' + J(m0, '13'), 'wrong:kth-previous wrong:kth-next wrong:kth-added', '7의 배수 6번째의 실수');
  eq(J(m1, '8') + ' ' + J(m1, '6') + ' ' + J(m1, '49'), 'wrong:count-one-more wrong:count-one-less wrong:count-largest', '50까지 7의 배수 개수의 실수');
  eq(J(m2, '49') + ' ' + J(m2, '63') + ' ' + J(m2, '57'), 'wrong:next-below wrong:next-skipped wrong:next-added', '50보다 큰 7의 배수의 실수');
  eq(E(m1, '6'), '7 × 7 = 49도 50을 넘지 않아요. 하나를 덜 셌어요.', '하나 덜 센 실수의 설명');
  var g = prob('A07.gcd', { a: 18, b: 24 }, 6), l = prob('A07.lcm', { a: 4, b: 6 }, 12);
  eq(J(g, '6'), 'correct:-', '18과 24의 최대공약수 6');
  eq(J(g, '72'), 'wrong:opposite', '→ 72 (최소공배수)');
  eq(J(g, '3') + ' ' + J(g, '2') + ' ' + J(g, '1'), 'wrong:common-not-best wrong:common-not-best wrong:common-not-best', '→ 3, 2, 1 (공약수지만 가장 크지 않음)');
  eq(J(g, '9') + ' ' + J(g, '8') + ' ' + J(g, '18'), 'wrong:not-common wrong:not-common wrong:not-common', '→ 9, 8, 18 (한 수의 약수일 뿐)');
  eq(J(g, '5'), 'wrong:unrelated', '→ 5 (어느 쪽의 약수도 아님)');
  eq(E(g, '8'), '8은 24의 약수이지만 18의 약수는 아니에요. 두 수 모두의 약수를 찾아야 해요.', '한 수의 약수일 뿐인 실수의 설명');
  eq(J(l, '12'), 'correct:-', '4와 6의 최소공배수 12');
  eq(J(l, '2'), 'wrong:opposite', '→ 2 (최대공약수)');
  eq(J(l, '24') + ' ' + J(l, '36'), 'wrong:common-not-best wrong:common-not-best', '→ 24, 36 (공배수지만 가장 작지 않음)');
  eq(J(l, '8') + ' ' + J(l, '18') + ' ' + J(l, '6'), 'wrong:not-common wrong:not-common wrong:not-common', '→ 8, 18, 6 (한 수의 배수일 뿐)');
  eq(J(l, '5'), 'wrong:unrelated', '→ 5');
  eq(E(l, '24'), '24는 두 수의 공배수가 맞아요. 하지만 가장 작은 공배수는 아니에요. 두 수를 곱하면 항상 공배수가 되지만, 가장 작다고는 할 수 없어요.', '두 수의 곱을 답한 실수의 설명');
  var W = MH.types['A07.word'].contexts, wv = { g: 6, m: 3, n: 4, a: 18, b: 24 };
  eq(J(prob('A07.word', wv, 6, W[0]), '72'), 'wrong:opposite', '나눠 주기(최대공약수) → 72');
  eq(J(prob('A07.word', wv, 72, W[3]), '6'), 'wrong:opposite', '버스(최소공배수) → 6');
  eq(J(prob('A07.word', wv, 72, W[3]), '432'), 'wrong:common-not-best', '버스 → 432 (두 수의 곱)');
  eq(J(prob('A07.word', wv, 72, W[3]), '72'), 'correct:-', '버스 → 72');

  var says = function (id, v, ctx) { return MH.types[id].steps(v, ctx).map(function (s) { return s.say; }).join(' | '); };
  eq(says('A07.divisors', dc.v), '곱해서 24가 되는 두 수를 작은 수부터 짝지어 찾아요: 1 × 24, 2 × 12, 3 × 8, 4 × 6. | 짝에 나온 수를 작은 수부터 늘어놓으면 24의 약수예요: 1, 2, 3, 4, 6, 8, 12, 24. | 세어 보면 모두 8개예요.', '24의 약수 풀이');
  eq(says('A07.divisors', { form: 1, n: 36, k: 5 }).split(' | ').slice(1).join(' | '), '짝에 나온 수를 작은 수부터 늘어놓으면 36의 약수예요: 1, 2, 3, 4, 6, 9, 12, 18, 36. | 5번째 수는 6이에요.', '36(같은 수끼리 곱한 짝이 있는 수)의 약수');
  eq(says('A07.multiples', m1.v), '7의 배수 가운데 50을 넘지 않는 가장 큰 수를 찾아요. 7 × 7 = 49, 7 × 8 = 56. 56은 50보다 커요. | 7 × 1부터 7 × 7까지가 50 이하의 배수예요. 모두 7개예요.', '배수의 개수 풀이');
  eq(says('A07.multiples', m2.v), '50 근처의 7의 배수를 찾아요. 7 × 7 = 49, 7 × 8 = 56. 56은 50보다 커요. | 49는 50보다 작으니, 50보다 큰 가장 작은 배수는 그다음 배수예요.', '다음 배수 풀이');
  eq(says('A07.gcd', g.v), '18의 약수: 1, 2, 3, 6, 9, 18. | 24의 약수: 1, 2, 3, 4, 6, 8, 12, 24. | 두 수에 공통으로 있는 약수(공약수): 1, 2, 3, 6. 이 가운데 가장 큰 수가 최대공약수예요. | 최대공약수는 6이에요. 확인: 18 = 6 × 3, 24 = 6 × 4.', '최대공약수 풀이');
  eq(says('A07.lcm', l.v).split(' | ').slice(1).join(' | '), '6의 배수를 차례로 보며 4로 나누어지는지 확인해요: 6(×), 12(○). | 최소공배수는 12예요. 확인: 12 = 4 × 3, 12 = 6 × 2.', '최소공배수 풀이');
  eq(says('A07.word', wv, W[3]).split(' | ').pop(), '최소공배수는 72예요. 확인: 72 = 18 × 4, 72 = 24 × 3. 답은 72분이에요.', '문장제 풀이의 마지막 줄');
  eq(MH.types['A07.gcd'].hints({ a: 18, b: 24 })[2], '두 수 모두 2로 나누어져요. 나눈 몫끼리 또 공통으로 나눌 수 있는지 살펴보세요.', '최대공약수 힌트');
  eq(MH.types['A07.gcd'].hints({ a: 44, b: 55 })[2], '두 수의 공약수는 1 말고 하나뿐이에요. 44의 약수 가운데 1이 아닌 것을 하나씩 확인해 보세요.', '최대공약수 힌트(공약수가 하나뿐일 때 답을 말하지 않음)');
  done('실수 · 풀이 예');
})();
