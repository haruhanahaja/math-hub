/* A16 비와 비율 — 비, 비율, 백분율, 비례식
   유형(쉬운 것부터): A16.ratio 비율을 분수로 · A16.percent 비율을 백분율로 · A16.percent-of 전체의 몇 %
                     · A16.proportion 비례식의 빈칸 · A16.word 비례식 문장제(비례배분 포함)
   답이 항상 자연수나 깔끔한 분수가 되도록 숫자를 고른다. 계산은 정수와 분수(MH.F)로만 한다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F, gcd = MH.gcd, P10 = MH.pow10;

  var frac = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  var readJ = function (n, d, pair) { return d + '분의 ' + josa(n, pair); };
  var when = function (test, make) { return function (v) { return test(v) ? make(v) : null; }; };
  var V = function (n, d) { return n > 0 && d > 0 ? { n: n, d: d } : null; };
  var whole = function (x) { return Number.isInteger(x) && x > 0 ? x : null; };
  /** 낱말 뒤에 조사만 붙인다(낱말은 그대로) */
  var J = function (word, pair) { return josa(word, pair); };
  /** 단위를 붙인 수: 18 m / 18쪽 (영문 단위는 한 칸 띈다) */
  var withUnit = function (n, unit) { return n + (/^[a-zA-Z]+$/.test(unit) ? ' ' : '') + unit; };
  var isSay = function (n, unit) { return /^[a-zA-Z%]+$/.test(unit) ? withUnit(n, unit) + '예요' : n + josa(unit, '이에요/예요'); };

  /* ── A16.ratio 비율을 분수로 ───────────────────────────
     두 수 x, y. t: 0 → y 에 대한 x 의 비율(x/y) · 1 → x 에 대한 y 의 비율(y/x) · 2 → 전체(x+y)에 대한 x 의 비율
     form: 0 'x : y' · 1 'y에 대한 x의 비' · 2 'x의 y에 대한 비' · 3 'x와 y의 비' · 4 상황(s) */
  var PAIRS = [
    { x: '빨간 구슬', y: '파란 구슬', all: '전체 구슬', lead: function (x, y) { return '주머니에 빨간 구슬 ' + x + '개와 파란 구슬 ' + y + '개가 있어요.'; } },
    { x: '남자 회원', y: '여자 회원', all: '전체 회원', lead: function (x, y) { return '동호회에 남자 회원 ' + x + '명과 여자 회원 ' + y + '명이 있어요.'; } },
    { x: '사과', y: '배', all: '전체 과일', lead: function (x, y) { return '상자에 사과 ' + x + '개와 배 ' + y + '개가 들어 있어요.'; } },
    { x: '연필', y: '볼펜', all: '전체 필기구', lead: function (x, y) { return '필통에 연필 ' + x + '자루와 볼펜 ' + y + '자루가 있어요.'; } }
  ];
  var cmpOf = function (v) { return v.t === 1 ? v.y : v.x; };
  var baseOf = function (v) { return v.t === 0 ? v.y : v.t === 1 ? v.x : v.x + v.y; };
  var ratioOk = function (v) { return v.x !== v.y && cmpOf(v) % baseOf(v) !== 0; };
  var ratioWords = function (v) {
    var st = PAIRS[v.s];
    if (v.form === 1) return v.y + '에 대한 ' + v.x + '의 비율';
    if (v.form === 2) return v.x + '의 ' + v.y + '에 대한 비율';
    if (v.form === 3) return josa(v.x, '과/와') + ' ' + v.y + '의 비율';
    return (v.t === 0 ? st.y : v.t === 1 ? st.x : st.all) + ' 수에 대한 ' + (v.t === 1 ? st.y : st.x) + ' 수의 비율';
  };
  /** 기준량이 어느 것인지 알려 주는 말 */
  var baseWhy = function (v) {
    return v.form === 0 ? '기호 : 의 오른쪽에 있는 수가 기준량이에요.' : v.form === 3 ? "'~와(과) ~의 비'에서는 뒤에 나온 수가 기준량이에요." : "'~에 대한'이 붙은 쪽이 기준량이에요.";
  };
  MH.defineType({
    id: 'A16.ratio', unit: 'A16', version: 1, title: '비율을 분수로',
    answer: { kind: 'fraction' },
    levels: [
      { name: '비를 비율로', minDistinct: 30, vars: { form: 0, t: 0, s: 0, x: int(1, 9), y: int(2, 9) }, where: function (v) { return ratioOk(v) && gcd(v.x, v.y) === 1; } },
      { name: '기준량 찾기', vars: { form: pick([1, 2, 3]), t: 0, s: 0, x: int(2, 15), y: int(2, 15) }, where: ratioOk },
      { name: '상황 속의 비율', vars: { form: 4, t: pick([0, 1, 2]), s: pick([0, 1, 2, 3]), x: int(2, 15), y: int(2, 15) }, where: ratioOk }
    ],
    prompt: function (v) {
      if (v.form === 0) return { tex: v.x + ' : ' + v.y, text: '비율을 분수로 쓰세요.' };
      if (v.form === 4) return { text: PAIRS[v.s].lead(v.x, v.y) + ' ' + ratioWords(v) + '을 분수로 쓰세요.' };
      return { text: ratioWords(v) + '을 분수로 쓰세요.' };
    },
    solve: function (v) { var c = cmpOf(v), b = baseOf(v), g = gcd(c, b); return { n: c / g, d: b / g }; },
    /* 검산: 정확한 분수 계산으로 비교하는 양 ÷ 기준량 */
    verify: function (v, ans) { return F(ans.n, ans.d).equals(F(cmpOf(v), baseOf(v))); },
    hints: function (v) {
      return [
        '비율은 비교하는 양을 기준량으로 나눈 값이에요. 분수로 쓰면 기준량이 분모(아래), 비교하는 양이 분자(위)예요.',
        baseWhy(v),
        v.t === 2 ? '전체 수는 두 수를 더해서 구해요. 그 수가 분모예요.' : '기준량을 분모에, 나머지 수를 분자에 써요. 약분할 수 있으면 약분해요.'
      ];
    },
    steps: function (v) {
      var c = cmpOf(v), b = baseOf(v), g = gcd(c, b), out = [];
      if (v.t === 2) out.push({ say: PAIRS[v.s].all + ' 수는 ' + v.x + ' + ' + v.y + ' = ' + josa(b, '이에요/예요') + '. 이것이 기준량이에요.', tex: v.x + ' + ' + v.y + ' = ' + b });
      else out.push({ say: baseWhy(v) + ' 기준량은 ' + b + ', 비교하는 양은 ' + josa(c, '이에요/예요') + '.' });
      out.push({ say: '비율 = 비교하는 양 ÷ 기준량이에요. 기준량 ' + josa(b, '을/를') + ' 분모에, 비교하는 양 ' + josa(c, '을/를') + ' 분자에 써요.', tex: c + ' \\div ' + b + ' = ' + frac(c, b) });
      if (g > 1) out.push({ say: '분자와 분모를 최대공약수 ' + josa(g, '으로/로') + ' 나누어 약분해요.', tex: frac(c, b) + ' = ' + frac(c / g, b / g) });
      out[out.length - 1].value = { n: c / g, d: b / g };
      return out;
    },
    /* ① 기준량과 비교하는 양을 바꿈 ② 두 수의 합을 분모로 씀 ③ 전체가 기준량인데 다른 한쪽을 분모로 씀 */
    mistakes: [
      { id: 'reversed', wrong: function (v) { return V(baseOf(v), cmpOf(v)); },
        explain: function (v) { return '기준량과 비교하는 양의 자리를 바꿨어요. ' + (v.t === 2 ? '전체 수 ' + josa(v.x + v.y, '이/가') + ' 기준량이에요.' : baseWhy(v)) + ' 기준량 ' + josa(baseOf(v), '을/를') + ' 분모(아래)에 써요.'; } },
      { id: 'of-total', wrong: when(function (v) { return v.t !== 2; }, function (v) { return V(cmpOf(v), v.x + v.y); }),
        explain: function (v) { return '두 수를 더한 ' + josa(v.x + v.y, '을/를') + ' 분모로 썼어요. 전체에 대한 비율을 묻는 것이 아니에요. ' + baseWhy(v) + ' 분모는 ' + josa(baseOf(v), '이에요/예요') + '.'; } },
      { id: 'not-total', wrong: when(function (v) { return v.t === 2; }, function (v) { return V(v.x, v.y); }),
        explain: function (v) { var st = PAIRS[v.s]; return st.y + ' 수 ' + josa(v.y, '을/를') + ' 분모로 썼어요. 기준량은 ' + st.all + ' 수예요: ' + v.x + ' + ' + v.y + ' = ' + (v.x + v.y) + '.'; } }
    ]
  });

  /* ── A16.percent 비율을 백분율로 ───────────────────────
     비율 a/b 를 백분율로. k: 0 소수(b = 10^p) · 1 분수 · 2 상황(전체 b 가운데 a). 답은 a × 100 ÷ b. */
  var RATE = [
    function (b, a) { return '회원 ' + b + '명 가운데 ' + a + '명이 안경을 썼어요. 안경을 쓴 회원은 전체의 몇 %일까요?'; },
    function (b, a) { return '문제 ' + b + '개 가운데 ' + a + '개를 맞혔어요. 정답률은 몇 %일까요?'; },
    function (b, a) { return '씨앗 ' + b + '개를 심었더니 ' + a + '개에서 싹이 났어요. 싹이 난 씨앗은 전체의 몇 %일까요?'; },
    function (b, a) { return '공을 ' + b + '번 던져서 ' + a + '번 넣었어요. 성공률은 몇 %일까요?'; }
  ];
  var pct = function (v) { return v.a * 100 / v.b; };
  var placesOfB = function (v) { return String(v.b).length - 1; };
  var decText = function (v) { return MH.decStr(v.a, placesOfB(v), true); };
  MH.defineType({
    id: 'A16.percent', unit: 'A16', version: 1, title: '비율을 백분율로',
    answer: { kind: 'int', common: false, suffix: function () { return '%'; } },
    levels: [
      { name: '소수를 백분율로', minDistinct: 110, vars: { k: 0, s: 0, p: pick([1, 2, 2]), b: function (v) { return P10(v.p); }, a: function (v) { return v.p === 1 ? int(1, 19) : int(1, 150); } }, where: function (v) { return v.a % 10 !== 0; } },
      { name: '분수를 백분율로', minDistinct: 80, vars: { k: 1, s: 0, b: pick([2, 4, 5, 10, 20, 25, 50]), a: function (v) { return int(1, 2 * v.b - 1); } }, where: function (v) { return gcd(v.a, v.b) === 1; } },
      { name: '상황 속의 백분율', vars: { k: 2, s: pick([0, 1, 2, 3]), b: pick([20, 25, 40, 50, 200, 400, 500]), m: int(4, 96), a: function (v) { return v.m * v.b / 100; } }, where: function (v) { return Number.isInteger(v.a) && v.a !== v.m; } }
    ],
    prompt: function (v) {
      if (v.k === 2) return { text: RATE[v.s](v.b, v.a) };
      return { tex: v.k === 0 ? decText(v) : frac(v.a, v.b), text: '비율을 백분율로 나타내면 몇 %일까요?' };
    },
    solve: pct,
    /* 검산: 정확한 분수 계산으로 a/b × 100 */
    verify: function (v, ans) { return F(v.a, v.b).mul(100).equals(ans); },
    hints: function (v) {
      return [
        '백분율은 기준량을 100으로 볼 때의 비율이에요. 비율에 100을 곱하고 % 를 붙여요.',
        v.k === 0 ? '소수에 100을 곱하면 소수점이 오른쪽으로 두 칸 옮겨져요.' : v.k === 1 ? '분모를 100으로 만들면 분자가 바로 백분율이에요.' : '먼저 비율을 분수로 써요: 전체 ' + josa(v.b, '이/가') + ' 분모, 해당하는 수 ' + josa(v.a, '이/가') + ' 분자예요.',
        v.k === 0 ? '옮길 자리에 숫자가 없으면 0을 채워요.' : '분모 ' + josa(v.b, '을/를') + ' 100으로 만들려면 분모와 분자에 같은 수를 곱하거나 같은 수로 나눠요.'
      ];
    },
    steps: function (v) {
      var m = pct(v), out = [];
      if (v.k === 0) {
        out.push({ say: '비율에 100을 곱해요. 소수점을 오른쪽으로 두 칸 옮겨요.' + (v.p === 1 ? ' 빈 자리에는 0을 채워요.' : ''), tex: decText(v) + ' \\times 100 = ' + m });
      } else {
        if (v.k === 2) out.push({ say: '비율을 분수로 써요. 전체 ' + josa(v.b, '이/가') + ' 기준량(분모)이에요.', tex: frac(v.a, v.b) });
        if (100 % v.b === 0) out.push({ say: '분모를 100으로 만들어요. 분모와 분자에 ' + josa(100 / v.b, '을/를') + ' 곱해요.', tex: frac(v.a, v.b) + ' = ' + frac(v.a + ' \\times ' + 100 / v.b, v.b + ' \\times ' + 100 / v.b) + ' = ' + frac(m, 100) });
        else if (v.b % 100 === 0) out.push({ say: '분모를 100으로 만들어요. 분모와 분자를 ' + josa(v.b / 100, '으로/로') + ' 나눠요.', tex: frac(v.a, v.b) + ' = ' + frac(v.a + ' \\div ' + v.b / 100, v.b + ' \\div ' + v.b / 100) + ' = ' + frac(m, 100) });
        else out.push({ say: '비율에 100을 곱해요. 먼저 100과 분모 ' + josa(v.b, '을/를') + ' 약분하면 쉬워요.', tex: frac(v.a, v.b) + ' \\times 100 = ' + frac(v.a * 100, v.b) + ' = ' + m });
      }
      out.push({ say: (v.k === 0 || (100 % v.b !== 0 && v.b % 100 !== 0) ? '답은 ' + m + '%예요.' : readJ(m, 100, '은/는') + ' ' + m + '%예요.'), tex: (v.k === 0 ? decText(v) : frac(v.a, v.b)) + ' = ' + m + '\\%', value: m });
      return out;
    },
    /* ① 소수점만 떼고 씀 ② 0.05 를 50% 로 ③ 소수점을 세 칸 옮김 ④ 분자를 그대로 씀 ⑤ 분자와 분모를 이어 씀 ⑥ 분모에 곱한 수를 씀 ⑦ 개수를 그대로 % 로 ⑧ 나머지 쪽의 백분율 */
    mistakes: [
      { id: 'digits-only', wrong: when(function (v) { return v.k === 0; }, function (v) { return v.a; }),
        explain: function (v) { return '소수점만 떼고 썼어요. 백분율은 비율에 100을 곱한 값이에요. 소수점을 오른쪽으로 두 칸 옮기면 ' + decText(v) + ' × 100 = ' + josa(pct(v), '이에요/예요') + '.'; } },
      { id: 'zero-dropped', wrong: when(function (v) { return v.k === 0 && v.p === 2 && v.a < 10; }, function (v) { return v.a * 10; }),
        explain: function (v) { return '소수 첫째 자리의 0을 빠뜨렸어요. ' + josa(decText(v), '은/는') + ' 0.01이 ' + v.a + '개인 수라서 ' + v.a + '%예요.'; } },
      { id: 'three-places', wrong: when(function (v) { return v.k === 0; }, function (v) { return pct(v) * 10; }),
        explain: function (v) { return '소수점을 세 칸 옮겼어요. 100을 곱하는 것이니까 두 칸만 옮겨요: ' + decText(v) + ' × 100 = ' + pct(v) + '.'; } },
      { id: 'numerator-only', wrong: when(function (v) { return v.k === 1; }, function (v) { return v.a; }),
        explain: function (v) { return '분자 ' + josa(v.a, '을/를') + ' 그대로 썼어요. 분자가 바로 백분율이 되는 것은 분모가 100일 때뿐이에요. 분모 ' + josa(v.b, '을/를') + ' 100으로 만들면 분자는 ' + v.a + ' × ' + 100 / v.b + ' = ' + josa(pct(v), '이에요/예요') + '.'; } },
      { id: 'digits-joined', wrong: when(function (v) { return v.k === 1; }, function (v) { return Number(String(v.a) + v.b); }),
        explain: function (v) { return '분자와 분모의 숫자를 이어 썼어요. ' + readJ(v.a, v.b, '은/는') + ' ' + v.a + ' ÷ ' + josa(v.b, '이라는/라는') + ' 뜻이에요. 분모를 100으로 만들어서 분자를 읽어요.'; } },
      { id: 'multiplier-only', wrong: when(function (v) { return v.k === 1 && v.a > 1; }, function (v) { return whole(100 / v.b); }),
        explain: function (v) { return josa(100 / v.b, '은/는') + ' 분모에 곱한 수예요. 분자에도 똑같이 곱해야 해요: ' + v.a + ' × ' + 100 / v.b + ' = ' + pct(v) + '.'; } },
      { id: 'count-as-percent', wrong: when(function (v) { return v.k === 2; }, function (v) { return v.a; }),
        explain: function (v) { return '개수 ' + josa(v.a, '을/를') + ' 그대로 %로 썼어요. 전체가 100일 때만 그렇게 쓸 수 있어요. 전체는 ' + josa(v.b, '이니까/니까') + ' 비율 ' + readJ(v.a, v.b, '을/를') + ' 백분율로 바꿔요.'; } },
      { id: 'complement', wrong: when(function (v) { return v.k === 2; }, function (v) { return 100 - pct(v); }),
        explain: function (v) { return '해당하지 않는 나머지 쪽의 백분율을 답했어요. 묻는 것은 ' + v.b + ' 가운데 ' + v.a + '의 비율이에요: ' + pct(v) + '%.'; } }
    ]
  });

  /* ── A16.percent-of 전체의 몇 % ─────────────────────────
     N 의 r%. q: 0 → 그만큼 · 1 → 문장제(SALE[s]. sign 이 −1 이면 줄어든 뒤, +1 이면 늘어난 뒤의 양) */
  var SALE = [
    { sign: -1, unit: '원', part: '할인 금액', text: function (N, r) { return '정가가 ' + N + '원인 물건을 ' + r + '% 할인해서 팔아요. 판매 가격은 얼마일까요?'; } },
    { sign: 1, unit: '명', part: '늘어난 회원 수', text: function (N, r) { return '작년 회원이 ' + N + '명이었는데 올해는 ' + r + '% 늘었어요. 올해 회원은 몇 명일까요?'; } },
    { sign: -1, unit: 'mL', part: '마신 양', text: function (N, r) { return '주스 ' + N + ' mL 가운데 ' + r + '%를 마셨어요. 남은 주스는 몇 mL일까요?'; } },
    { sign: 1, unit: '원', part: '오른 금액', text: function (N, r) { return '한 달 요금 ' + N + '원이 ' + r + '% 올랐어요. 오른 뒤의 요금은 얼마일까요?'; } }
  ];
  var partOf = function (v) { return v.N * v.r / 100; };
  /** 푸는 길: frac 약분한 분수로(쉬운 백분율) · one 1% 를 거쳐 · mul 곱하고 100 으로 나누기 */
  var route = function (v) {
    var g = gcd(v.r, 100), a = v.r / g, b = 100 / g;
    if (b <= 10 && v.N % b === 0) return { kind: 'frac', a: a, b: b };
    if (v.N % 100 === 0) return { kind: 'one' };
    return v.N % b === 0 ? { kind: 'frac', a: a, b: b } : { kind: 'mul' };
  };
  var ofAns = function (v) { return v.q ? v.N + SALE[v.s].sign * partOf(v) : partOf(v); };
  var ofOk = function (v) { var a = ofAns(v), p = partOf(v); return Number.isInteger(p) && [1, 100].indexOf(a) < 0 && [1, 100].indexOf(p) < 0 && p !== v.r; };
  MH.defineType({
    id: 'A16.percent-of', unit: 'A16', version: 1, title: '전체의 몇 %',
    answer: { kind: 'int', common: false, suffix: function (v) { return v.q ? SALE[v.s].unit : ''; } },
    levels: [
      { name: '10%, 25%, 50% …', minDistinct: 100, vars: { q: 0, s: 0, r: pick([10, 20, 25, 50, 75]), h: int(1, 30), N: function (v) { return v.h * 20; } }, where: ofOk },
      { name: '여러 가지 백분율', vars: { q: 0, s: 0, r: int(2, 98), N: pick([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1500, 2000]) }, where: function (v) { return ofOk(v) && [10, 20, 25, 50, 75].indexOf(v.r) < 0; } },
      { name: '할인 · 인상 문장제', vars: { q: 1, s: pick([0, 1, 2, 3]), k: int(1, 12), r: function (v) { return v.k * 5; }, h: int(2, 60), N: function (v) { return v.h * 100; } }, where: ofOk }
    ],
    prompt: function (v) { return v.q ? { text: SALE[v.s].text(v.N, v.r) } : { text: v.N + '의 ' + v.r + '%는 얼마일까요?' }; },
    solve: ofAns,
    /* 검산: 정확한 분수 계산으로 N × r/100 (문장제는 N × (100 ± r)/100) */
    verify: function (v, ans) { return F(v.N).mul(F(v.q ? 100 + SALE[v.s].sign * v.r : v.r, 100)).equals(ans); },
    hints: function (v) {
      var rt = route(v), st = SALE[v.s];
      return [
        v.r + '%는 비율로 ' + readJ(v.r, 100, '이에요/예요') + '. 전체에 이 비율을 곱해요.',
        rt.kind === 'frac' ? readJ(v.r, 100, '을/를') + ' 약분해요. 그러면 전체를 몇으로 나누면 되는지 보여요.' : rt.kind === 'one' ? '전체의 1%는 전체를 100으로 나눈 값이에요. 먼저 ' + v.N + ' ÷ 100을 계산해요.' : '먼저 ' + v.N + ' × ' + josa(v.r, '을/를') + ' 계산하고, 그 값을 100으로 나눠요.',
        v.q ? '구한 ' + J(st.part, '을/를') + ' 처음 양' + (st.sign < 0 ? '에서 빼요.' : '에 더해요.') : rt.kind === 'frac' ? '전체를 약분한 분수의 분모로 나누고, 분자를 곱해요.' : rt.kind === 'one' ? '1%의 값에 ' + josa(v.r, '을/를') + ' 곱해요.' : '100으로 나누면 끝자리 0 두 개가 없어져요.'
      ];
    },
    steps: function (v) {
      var p = partOf(v), rt = route(v), st = SALE[v.s], out = [];
      if (rt.kind === 'frac') {
        var x = v.N / rt.b;
        out.push({ say: v.r + '%는 ' + readJ(v.r, 100, '이에요/예요') + '. 약분하면 ' + readJ(rt.a, rt.b, '이에요/예요') + '.', tex: v.r + '\\% = ' + frac(v.r, 100) + ' = ' + frac(rt.a, rt.b) });
        out.push({ say: v.N + '의 ' + readJ(1, rt.b, '은/는') + ' ' + v.N + ' ÷ ' + rt.b + ' = ' + josa(x, '이에요/예요') + '.', tex: v.N + ' \\div ' + rt.b + ' = ' + x });
        if (rt.a > 1) out.push({ say: readJ(rt.a, rt.b, '은/는') + ' 그것의 ' + rt.a + '배예요: ' + x + ' × ' + rt.a + ' = ' + p + '.', tex: v.N + ' \\times ' + frac(rt.a, rt.b) + ' = ' + p });
      } else if (rt.kind === 'one') {
        out.push({ say: v.N + '의 1%는 ' + v.N + ' ÷ 100 = ' + josa(v.N / 100, '이에요/예요') + '.', tex: v.N + ' \\div 100 = ' + v.N / 100 });
        out.push({ say: v.r + '%는 1%의 ' + v.r + '배예요: ' + v.N / 100 + ' × ' + v.r + ' = ' + p + '.', tex: v.N + ' \\times ' + frac(v.r, 100) + ' = ' + p });
      } else {
        out.push({ say: v.r + '%는 ' + readJ(v.r, 100, '이니까/니까') + ' ' + v.N + '에 ' + josa(v.r, '을/를') + ' 곱하고 100으로 나눠요. 먼저 곱해요.', tex: v.N + ' \\times ' + v.r + ' = ' + v.N * v.r });
        out.push({ say: '100으로 나눠요: ' + v.N * v.r + ' ÷ 100 = ' + p + '.', tex: v.N + ' \\times ' + frac(v.r, 100) + ' = ' + p });
      }
      if (v.q) out.push({ say: J(st.part, '은/는') + ' ' + josa(p, '이에요/예요') + '. 처음 양' + (st.sign < 0 ? '에서 빼요: ' + v.N + ' − ' : '에 더해요: ' + v.N + ' + ') + p + ' = ' + ofAns(v) + '. 답은 ' + isSay(ofAns(v), st.unit) + '.', tex: v.N + (st.sign < 0 ? ' - ' : ' + ') + p + ' = ' + ofAns(v) });
      out[out.length - 1].value = ofAns(v);
      return out;
    },
    /* ① 100 으로 나누지 않음 ② 1% 만 구함 ③ 10 으로 나눔 ④ 백분율로 나눔 ⑤ 줄어든(늘어난) 양만 답함 ⑥ 더할 것을 빼거나 뺄 것을 더함 ⑦ % 를 그대로 양으로 봄 */
    mistakes: [
      { id: 'not-divided', wrong: when(function (v) { return !v.q && v.N * v.r <= 9999999; }, function (v) { return v.N * v.r; }),
        explain: function (v) { return v.N + ' × ' + v.r + '까지만 계산했어요. ' + v.r + '%는 ' + readJ(v.r, 100, '이니까/니까') + ' 100으로 나누는 것도 해야 해요: ' + v.N * v.r + ' ÷ 100 = ' + partOf(v) + '.'; } },
      { id: 'one-percent', wrong: when(function (v) { return !v.q; }, function (v) { return whole(v.N / 100); }),
        explain: function (v) { return josa(v.N / 100, '은/는') + ' 1%의 값이에요. ' + v.r + '%는 그것의 ' + v.r + '배예요: ' + v.N / 100 + ' × ' + v.r + ' = ' + partOf(v) + '.'; } },
      { id: 'divided-by-ten', wrong: when(function (v) { return !v.q && v.r !== 10; }, function (v) { return whole(v.N * v.r / 10); }),
        explain: function (v) { return '10으로 나눴어요. %는 100을 기준으로 한 비율이라서 100으로 나눠요: ' + v.N + ' × ' + v.r + ' ÷ 100 = ' + partOf(v) + '.'; } },
      { id: 'divided-by-percent', wrong: when(function (v) { return !v.q; }, function (v) { return whole(v.N / v.r); }),
        explain: function (v) { return v.N + ' ÷ ' + josa(v.r, '을/를') + ' 계산했어요. ' + v.r + '%는 ' + readJ(v.r, 100, '을/를') + ' 곱하는 것이에요: ' + v.N + ' × ' + v.r + ' ÷ 100 = ' + partOf(v) + '.'; } },
      { id: 'part-only', wrong: when(function (v) { return v.q; }, partOf),
        explain: function (v) { var st = SALE[v.s]; return J(st.part, '을/를') + ' 답했어요. 묻는 것은 그만큼 ' + (st.sign < 0 ? '줄어든' : '늘어난') + ' 뒤의 양이에요: ' + v.N + (st.sign < 0 ? ' − ' : ' + ') + partOf(v) + ' = ' + ofAns(v) + '.'; } },
      { id: 'wrong-direction', wrong: when(function (v) { return v.q; }, function (v) { return v.N - SALE[v.s].sign * partOf(v); }),
        explain: function (v) { var st = SALE[v.s]; return (st.sign < 0 ? '빼야 하는데 더했어요.' : '더해야 하는데 뺐어요.') + ' ' + st.part + ' ' + josa(partOf(v), '을/를') + ' 처음 양' + (st.sign < 0 ? '에서 빼요: ' + v.N + ' − ' : '에 더해요: ' + v.N + ' + ') + partOf(v) + ' = ' + ofAns(v) + '.'; } },
      { id: 'percent-as-amount', wrong: when(function (v) { return v.q; }, function (v) { return v.N + SALE[v.s].sign * v.r; }),
        explain: function (v) { return v.r + '%를 그대로 ' + v.r + '만큼으로 계산했어요. ' + v.N + '의 ' + v.r + '%는 ' + v.N + ' × ' + v.r + ' ÷ 100 = ' + josa(partOf(v), '이에요/예요') + '.'; } }
    ]
  });

  /* ── A16.proportion 비례식의 빈칸 ──────────────────────
     p : q 의 m 배와 n 배: (p×m) : (q×m) = (p×n) : (q×n). pos 번째 항이 빈칸. */
  var termsOf = function (v) { return [v.p * v.m, v.q * v.m, v.p * v.n, v.q * v.n]; };
  /** 빈칸 i 와 짝이 되는 자리들: j 같은 자리(다른 비) · k 같은 비의 옆 항 · l 옆 항의 짝 */
  var around = function (v) { var t = termsOf(v), i = v.pos, j = (i + 2) % 4, k = i ^ 1, l = (k + 2) % 4; return { t: t, i: i, J: t[j], K: t[k], L: t[l] }; };
  var propTex = function (v, fill) { var t = termsOf(v).map(function (x, i) { return i === v.pos ? fill : x; }); return t[0] + ' : ' + t[1] + ' = ' + t[2] + ' : ' + t[3]; };
  var coprimePQ = function (v) { return v.p !== v.q && gcd(v.p, v.q) === 1; };
  var NAME = ['전항', '후항'];
  MH.defineType({
    id: 'A16.proportion', unit: 'A16', version: 1, title: '비례식의 빈칸',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '같은 수를 곱해서', minDistinct: 250, vars: { p: int(1, 9), q: int(1, 9), m: 1, n: int(2, 9), pos: pick([2, 3]) }, where: coprimePQ },
      { name: '같은 수로 나누거나 앞쪽이 빈칸', vars: { p: int(1, 9), q: int(1, 9), m: int(2, 9), n: 1, pos: pick([0, 1, 2, 3]) }, where: coprimePQ },
      { name: '외항의 곱과 내항의 곱', vars: { p: int(1, 7), q: int(1, 7), m: int(2, 6), n: int(2, 6), pos: pick([0, 1, 2, 3]) }, where: function (v) { return coprimePQ(v) && v.m % v.n !== 0 && v.n % v.m !== 0; } }
    ],
    prompt: function (v) { return { tex: propTex(v, '\\square'), text: '□에 알맞은 수를 쓰세요.' }; },
    solve: function (v) { return termsOf(v)[v.pos]; },
    /* 검산: 외항의 곱 = 내항의 곱 */
    verify: function (v, ans) { var t = termsOf(v); t[v.pos] = ans; return t[0] * t[3] === t[1] * t[2]; },
    hints: function (v) {
      var a = around(v);
      return [
        '비의 전항과 후항에 같은 수를 곱하거나, 같은 수로 나누어도 비율은 변하지 않아요.',
        a.K % a.L === 0 || a.L % a.K === 0 ? '두 비에서 같은 자리에 있는 ' + josa(a.L, '과/와') + ' ' + josa(a.K, '을/를') + ' 비교해요. 몇 배가 됐는지, 또는 몇으로 나눴는지 찾아요.' : '비례식에서 바깥쪽 두 수(외항)의 곱과 안쪽 두 수(내항)의 곱은 같아요.',
        a.K % a.L === 0 || a.L % a.K === 0 ? '같은 계산을 ' + a.J + '에도 해요.' : '□가 없는 쪽의 곱을 먼저 구하고, □와 곱해지는 수로 나눠요.'
      ];
    },
    steps: function (v) {
      var a = around(v), ans = a.t[a.i], which = NAME[a.i % 2], other = NAME[(a.i + 1) % 2];
      if (a.K % a.L === 0) {
        var f = a.K / a.L;
        return [
          { say: other + '끼리 비교해요. ' + a.L + '에 ' + josa(f, '을/를') + ' 곱하면 ' + josa(a.K, '이/가') + ' 돼요.', tex: a.L + ' \\times ' + f + ' = ' + a.K },
          { say: which + '에도 똑같이 ' + josa(f, '을/를') + ' 곱해요: ' + a.J + ' × ' + f + ' = ' + ans + '.', tex: propTex(v, ans), value: ans }
        ];
      }
      if (a.L % a.K === 0) {
        var g = a.L / a.K;
        return [
          { say: other + '끼리 비교해요. ' + josa(a.L, '을/를') + ' ' + josa(g, '으로/로') + ' 나누면 ' + josa(a.K, '이/가') + ' 돼요.', tex: a.L + ' \\div ' + g + ' = ' + a.K },
          { say: which + '도 똑같이 ' + josa(g, '으로/로') + ' 나눠요: ' + a.J + ' ÷ ' + g + ' = ' + ans + '.', tex: propTex(v, ans), value: ans }
        ];
      }
      var outer = a.i === 0 || a.i === 3, o = a.t[3 - a.i], x = outer ? a.t[1] : a.t[0], y = outer ? a.t[2] : a.t[3];
      return [
        { say: '외항의 곱과 내항의 곱은 같아요. □가 없는 ' + (outer ? '내항' : '외항') + '의 곱을 먼저 구해요.', tex: x + ' \\times ' + y + ' = ' + x * y },
        { say: '□ × ' + o + '도 ' + josa(x * y, '이/가') + ' 돼야 해요. ' + x * y + ' ÷ ' + o + ' = ' + ans + '.', tex: '\\square = ' + x * y + ' \\div ' + o + ' = ' + ans },
        { say: '답은 ' + josa(ans, '이에요/예요') + '.', tex: propTex(v, ans), value: ans }
      ];
    },
    /* ① 곱하지 않고 차이만큼 더함 ② 짝을 엇갈리게 지음 ③ 곱한(나눈) 수만 씀 ④ 식에 있는 수를 그대로 씀 */
    mistakes: [
      { id: 'added', wrong: function (v) { var a = around(v); return whole(a.J + a.K - a.L); },
        explain: function (v) { var a = around(v); return josa(a.L, '과/와') + ' ' + a.K + '의 차이만큼 ' + (a.K > a.L ? '더했어요' : '뺐어요') + '. 비는 더하거나 빼면 달라져요. 같은 수를 곱하거나 같은 수로 나눠야 해요.'; } },
      { id: 'crossed', wrong: function (v) { var a = around(v); return whole(a.K * a.L / a.J); },
        explain: function (v) { var a = around(v); return '짝을 엇갈리게 지었어요. 전항은 전항끼리, 후항은 후항끼리 짝이에요. □의 짝은 ' + josa(a.J, '이고/고') + ', ' + a.L + '의 짝은 ' + josa(a.K, '이에요/예요') + '.'; } },
      { id: 'factor-only', wrong: function (v) { var a = around(v); return a.K % a.L === 0 ? a.K / a.L : a.L % a.K === 0 ? a.L / a.K : null; },
        explain: function (v) { var a = around(v), up = a.K % a.L === 0, f = up ? a.K / a.L : a.L / a.K; return josa(f, '은/는') + ' ' + (up ? '곱한' : '나눈') + ' 수예요. □에는 ' + (up ? a.J + '에 ' + josa(f, '을/를') + ' 곱한' : josa(a.J, '을/를') + ' ' + josa(f, '으로/로') + ' 나눈') + ' 수를 써요.'; } },
      { id: 'copied', match: function (v, raw) { var n = MH.kinds.int.parse(raw), t = termsOf(v); return n !== t[v.pos] && t.some(function (x, i) { return i !== v.pos && x === n; }); },
        explain: function () { return '식에 있는 수를 그대로 썼어요. 두 비의 비율이 같아지도록 □를 계산해야 해요.'; } }
    ]
  });

  /* ── A16.word 비례식 문장제 ────────────────────────────
     k: 0 섞기(p : q, 한쪽이 p×n 일 때 다른 쪽) · 1 단가(p 개에 u×p → n 개) · 2 비례배분(전체 (p+q)×n 을 p : q 로) */
  var MIX = [
    { unit: 'mL', a: '원액', b: '물', text: function (p, q, x) { return '음료를 만들 때 원액과 물을 ' + p + ' : ' + q + '의 비로 섞어요. 원액을 ' + x + ' mL 넣으면 물은 몇 mL 넣어야 할까요?'; } },
    { unit: 'cm', a: '가로', b: '세로', text: function (p, q, x) { return '가로와 세로의 비가 ' + p + ' : ' + q + '인 직사각형 모양 사진이 있어요. 가로가 ' + x + ' cm이면 세로는 몇 cm일까요?'; } },
    { unit: 'mL', a: '빨간 물감', b: '흰 물감', text: function (p, q, x) { return '빨간 물감과 흰 물감을 ' + p + ' : ' + q + '의 비로 섞어요. 빨간 물감을 ' + x + ' mL 쓰면 흰 물감은 몇 mL 필요할까요?'; } },
    { unit: 'g', a: '밀가루', b: '설탕', text: function (p, q, x) { return '과자를 만들 때 밀가루와 설탕을 ' + p + ' : ' + q + '의 비로 넣어요. 밀가루를 ' + x + ' g 넣으면 설탕은 몇 g 넣어야 할까요?'; } }
  ];
  var UNIT = [
    { unit: '원', each: 100, one: '1개', cnt: '개', text: function (p, X, n) { return '사과 ' + p + '개의 값이 ' + X + '원이에요. 같은 사과 ' + n + '개의 값은 얼마일까요?'; } },
    { unit: 'L', each: 1, one: '1분', cnt: '분', text: function (p, X, n) { return p + '분 동안 물 ' + X + ' L가 나오는 수도가 있어요. ' + n + '분 동안에는 물이 몇 L 나올까요?'; } },
    { unit: 'm', each: 10, one: '1분', cnt: '분', text: function (p, X, n) { return '자전거로 ' + p + '분 동안 ' + X + ' m를 가요. 같은 빠르기로 ' + n + '분 동안에는 몇 m를 갈까요?'; } },
    { unit: '쪽', each: 1, one: '1일', cnt: '일', text: function (p, X, n) { return p + '일 동안 책을 ' + X + '쪽 읽었어요. 같은 빠르기로 ' + n + '일 동안에는 몇 쪽을 읽을까요?'; } }
  ];
  var SHARE = [
    { unit: '개', who: ['형', '동생'], text: function (N, p, q, w) { return '사탕 ' + N + '개를 형과 동생이 ' + p + ' : ' + q + '의 비로 나누어 가져요. ' + josa(['형', '동생'][w], '은/는') + ' 몇 개를 가질까요?'; } },
    { unit: '쪽', who: ['오전', '오후'], text: function (N, p, q, w) { return N + '쪽짜리 책을 오전과 오후에 ' + p + ' : ' + q + '의 비로 나누어 읽으려고 해요. ' + ['오전', '오후'][w] + '에는 몇 쪽을 읽을까요?'; } },
    { unit: 'cm', who: ['첫째 도막', '둘째 도막'], text: function (N, p, q, w) { return '끈 ' + N + ' cm를 ' + p + ' : ' + q + '의 비가 되게 두 도막으로 잘랐어요. ' + josa(['첫째 도막', '둘째 도막'][w], '은/는') + ' 몇 cm일까요?'; } },
    { unit: '원', who: ['언니', '동생'], text: function (N, p, q, w) { return '용돈 ' + N + '원을 언니와 동생이 ' + p + ' : ' + q + '의 비로 나누어 가져요. ' + josa(['언니', '동생'][w], '은/는') + ' 얼마를 가질까요?'; } }
  ];
  var each = function (v) { return v.u * UNIT[v.s].each; };                      /* 하나의 값 */
  var total = function (v) { return (v.p + v.q) * v.n * (v.s === 3 ? 100 : 1); };  /* 비례배분의 전체 */
  var shareUnit = function (v) { return v.n * (v.s === 3 ? 100 : 1); };         /* 비 1 에 해당하는 양 */
  var mine = function (v) { return v.w ? v.q : v.p; };
  var wordAns = function (v) { return v.k === 0 ? v.q * v.n : v.k === 1 ? each(v) * v.n : mine(v) * shareUnit(v); };
  var wordUnit = function (v) { return (v.k === 0 ? MIX : v.k === 1 ? UNIT : SHARE)[v.s].unit; };
  MH.defineType({
    id: 'A16.word', unit: 'A16', version: 1, title: '비례식 문장제',
    answer: { kind: 'int', common: false, suffix: wordUnit },
    levels: [
      { name: '비에 맞게 섞기', vars: { k: 0, s: pick([0, 1, 2, 3]), w: 0, u: 1, p: int(1, 7), q: int(1, 7), n: int(2, 9) }, where: coprimePQ },
      { name: '하나의 값을 거쳐', vars: { k: 1, s: pick([0, 1, 2, 3]), w: 0, q: 1, p: int(2, 6), n: int(3, 9), u: int(2, 9) }, where: function (v) { return v.n % v.p !== 0 && v.p !== v.n && v.u !== v.p && v.u !== v.n; } },
      { name: '비례배분', vars: { k: 2, s: pick([0, 1, 2, 3]), w: pick([0, 1]), u: 1, p: int(1, 7), q: int(1, 7), n: int(2, 9) }, where: function (v) { return coprimePQ(v) && shareUnit(v) !== v.p + v.q; } }
    ],
    prompt: function (v) {
      if (v.k === 0) return { text: MIX[v.s].text(v.p, v.q, v.p * v.n) };
      if (v.k === 1) return { text: UNIT[v.s].text(v.p, each(v) * v.p, v.n) };
      return { text: SHARE[v.s].text(total(v), v.p, v.q, v.w) };
    },
    solve: wordAns,
    /* 검산: 비율이 같은가(정확한 분수 계산) */
    verify: function (v, ans) {
      if (v.k === 0) return F(v.p * v.n, ans).equals(F(v.p, v.q));
      if (v.k === 1) return F(each(v) * v.p, v.p).equals(F(ans, v.n));
      return F(ans, total(v)).equals(F(mine(v), v.p + v.q));
    },
    hints: function (v) {
      if (v.k === 0) return [
        '비가 같도록 비례식을 세워요: ' + v.p + ' : ' + v.q + ' = ' + v.p * v.n + ' : □.',
        J(MIX[v.s].a, '이/가') + ' ' + v.p + '에서 ' + josa(v.p * v.n, '으로/로') + ' 몇 배가 됐는지 찾아요.',
        MIX[v.s].b + '에도 같은 수를 곱해요.'
      ];
      if (v.k === 1) return [
        '먼저 ' + UNIT[v.s].one + '에 해당하는 양을 구해요.',
        each(v) * v.p + ' ÷ ' + josa(v.p, '을/를') + ' 계산해요.',
        '그 값에 ' + josa(v.n, '을/를') + ' 곱해요.'
      ];
      return [
        '비의 두 수를 더한 만큼의 묶음으로 전체를 똑같이 나눈다고 생각해요: ' + v.p + ' + ' + v.q + '.',
        '한 묶음의 양은 전체를 묶음 수로 나눈 값이에요.',
        J(SHARE[v.s].who[v.w], '은/는') + ' 그 가운데 ' + mine(v) + '묶음이에요.'
      ];
    },
    steps: function (v) {
      var ans = wordAns(v), unit = wordUnit(v);
      if (v.k === 0) return [
        { say: '비례식을 세워요. ' + MIX[v.s].a + ' : ' + MIX[v.s].b + ' = ' + v.p + ' : ' + josa(v.q, '이에요/예요') + '.', tex: v.p + ' : ' + v.q + ' = ' + v.p * v.n + ' : \\square' },
        { say: '전항 ' + v.p + '에 ' + josa(v.n, '을/를') + ' 곱하면 ' + josa(v.p * v.n, '이/가') + ' 돼요.', tex: v.p + ' \\times ' + v.n + ' = ' + v.p * v.n },
        { say: '후항에도 똑같이 ' + josa(v.n, '을/를') + ' 곱해요: ' + v.q + ' × ' + v.n + ' = ' + ans + '. 답은 ' + isSay(ans, unit) + '.', tex: v.p + ' : ' + v.q + ' = ' + v.p * v.n + ' : ' + ans, value: ans }
      ];
      if (v.k === 1) return [
        { say: UNIT[v.s].one + '에 해당하는 양을 구해요: ' + each(v) * v.p + ' ÷ ' + v.p + ' = ' + each(v) + '.', tex: each(v) * v.p + ' \\div ' + v.p + ' = ' + each(v) },
        { say: '거기에 ' + josa(v.n, '을/를') + ' 곱해요: ' + each(v) + ' × ' + v.n + ' = ' + ans + '. 답은 ' + isSay(ans, unit) + '.', tex: each(v) + ' \\times ' + v.n + ' = ' + ans },
        { say: '비례식으로 확인해요. 외항의 곱과 내항의 곱이 같아요.', tex: v.p + ' : ' + each(v) * v.p + ' = ' + v.n + ' : ' + ans, value: ans }
      ];
      var sum = v.p + v.q, who = SHARE[v.s].who[v.w];
      return [
        { say: '전체를 ' + v.p + ' + ' + v.q + ' = ' + sum + '묶음으로 나눈다고 생각해요.', tex: v.p + ' + ' + v.q + ' = ' + sum },
        { say: '한 묶음은 ' + total(v) + ' ÷ ' + sum + ' = ' + josa(shareUnit(v), '이에요/예요') + '.', tex: total(v) + ' \\div ' + sum + ' = ' + shareUnit(v) },
        { say: J(who, '은/는') + ' ' + mine(v) + '묶음이에요: ' + shareUnit(v) + ' × ' + mine(v) + ' = ' + ans + '. 답은 ' + isSay(ans, unit) + '.', tex: total(v) + ' \\times ' + frac(mine(v), sum) + ' = ' + ans, value: ans }
      ];
    },
    /* ① 곱하지 않고 차이만큼 더함 ② 비의 순서를 거꾸로 씀 ③ 곱한 수만 답함 ④ 하나의 값만 답함 ⑤ 처음 값에 그대로 곱함 ⑥ 상대의 몫을 답함 ⑦ 한 묶음만 답함 ⑧ 전체를 자기 비로 나눔 */
    mistakes: [
      { id: 'added', wrong: when(function (v) { return v.k === 0; }, function (v) { return whole(v.p * v.n + v.q - v.p); }),
        explain: function (v) { return '비의 두 수 ' + josa(v.p, '과/와') + ' ' + v.q + '의 차이만큼 ' + (v.q > v.p ? '더했어요' : '뺐어요') + '. 비는 더하거나 빼면 달라져요. ' + v.p + '에 ' + josa(v.n, '을/를') + ' 곱했으니 ' + v.q + '에도 ' + josa(v.n, '을/를') + ' 곱해요.'; } },
      { id: 'reversed', wrong: when(function (v) { return v.k === 0; }, function (v) { return whole(v.p * v.n * v.p / v.q); }),
        explain: function (v) { var st = MIX[v.s]; return '비의 순서를 거꾸로 썼어요. ' + st.a + ' : ' + st.b + ' = ' + v.p + ' : ' + josa(v.q, '이니까/니까') + ' ' + st.a + ' ' + v.p * v.n + '에는 ' + st.b + ' ' + v.q + ' × ' + v.n + ' = ' + josa(v.q * v.n, '이/가') + ' 맞아요.'; } },
      { id: 'factor-only', wrong: when(function (v) { return v.k === 0; }, function (v) { return v.n; }),
        explain: function (v) { return josa(v.n, '은/는') + ' 몇 배인지를 나타내는 수예요. ' + MIX[v.s].b + '의 양은 ' + v.q + '에 ' + josa(v.n, '을/를') + ' 곱한 값이에요.'; } },
      { id: 'unit-only', wrong: when(function (v) { return v.k === 1; }, each),
        explain: function (v) { return josa(each(v), '은/는') + ' ' + UNIT[v.s].one + '에 해당하는 양이에요. 묻는 것은 ' + v.n + UNIT[v.s].cnt + '에 해당하는 양이니까 ' + josa(v.n, '을/를') + ' 곱해요: ' + each(v) + ' × ' + v.n + ' = ' + wordAns(v) + '.'; } },
      { id: 'not-divided', wrong: when(function (v) { return v.k === 1; }, function (v) { return each(v) * v.p * v.n; }),
        explain: function (v) { return each(v) * v.p + '에 바로 ' + josa(v.n, '을/를') + ' 곱했어요. ' + josa(each(v) * v.p, '은/는') + ' ' + v.p + UNIT[v.s].cnt + '에 해당하는 양이에요. 먼저 ' + josa(v.p, '으로/로') + ' 나눠서 ' + UNIT[v.s].one + '의 양을 구해요.'; } },
      { id: 'other-share', wrong: when(function (v) { return v.k === 2; }, function (v) { return (v.w ? v.p : v.q) * shareUnit(v); }),
        explain: function (v) { var who = SHARE[v.s].who; return who[1 - v.w] + '의 몫을 답했어요. 비 ' + v.p + ' : ' + v.q + '에서 ' + who[v.w] + '의 수는 ' + josa(mine(v), '이에요/예요') + ': ' + shareUnit(v) + ' × ' + mine(v) + ' = ' + wordAns(v) + '.'; } },
      { id: 'one-bundle', wrong: when(function (v) { return v.k === 2 && mine(v) > 1; }, shareUnit),
        explain: function (v) { return josa(shareUnit(v), '은/는') + ' 한 묶음의 양이에요. ' + SHARE[v.s].who[v.w] + '의 몫은 ' + mine(v) + '묶음이니까 ' + shareUnit(v) + ' × ' + mine(v) + ' = ' + josa(wordAns(v), '이에요/예요') + '.'; } },
      { id: 'divided-by-own', wrong: when(function (v) { return v.k === 2 && mine(v) > 1; }, function (v) { return whole(total(v) / mine(v)); }),
        explain: function (v) { return '전체를 ' + josa(mine(v), '으로/로') + ' 나눴어요. 전체는 ' + v.p + ' + ' + v.q + ' = ' + (v.p + v.q) + '묶음이에요. 먼저 ' + josa(v.p + v.q, '으로/로') + ' 나누고 ' + josa(mine(v), '을/를') + ' 곱해요.'; } }
    ]
  });
})();
