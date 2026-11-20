/* A05 나눗셈 ② 몫과 나머지 — 나머지가 있는 나눗셈, (두·세 자리)÷(한·두 자리), 검산
   유형(쉬운 것부터): A05.basic 곱셈구구 범위 · A05.long 한 자리 수로 나누기 · A05.two 두 자리 수로 나누기
                     · A05.check 검산으로 나누어지는 수 찾기 · A05.word 문장제
   a 는 나누는 수, q 는 몫, r 은 나머지, p = a × q + r 은 나누어지는 수. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, josa = MH.josa, QR = MH.kinds['quotient-remainder'];

  /** 세로 나눗셈을 그대로 따라 한다(높은 자리부터, 덜어 내기로). 나눗셈 연산자를 쓰지 않는다.
      { q, r, rows: [{ place(자리), digit(내린 수), prev(앞에서 남은 수), part(이번에 나눌 수), k(몫의 그 자리), sub, rest, lead(아직 몫이 시작 안 됨) }] } */
  function longDiv(p, a) {
    var ds = MH.digits(p).reverse(), cur = 0, q = 0, rows = [], started = false;
    ds.forEach(function (d, i) {
      var prev = cur, part = cur * 10 + d, k = 0;
      cur = part;
      while (cur >= a) { cur -= a; k++; }
      rows.push({ place: ds.length - 1 - i, digit: d, prev: prev, part: part, k: k, sub: a * k, rest: cur, lead: !started && k === 0, first: i === 0 });
      if (k > 0) started = true;
      q = q * 10 + k;
    });
    return { q: q, r: cur, rows: rows };
  }
  /** a × k 가 limit 를 넘지 않는 가장 큰 k */
  function maxQ(limit, a) { var k = 0; while (a * (k + 1) <= limit) k++; return k; }
  var dividend = function (v) { return v.a * v.q + v.r; };
  var rem0 = function (v) { return int(0, v.a - 1); }, rem1 = function (v) { return int(1, v.a - 1); };
  var answerQR = function (v) { return { q: v.q, r: v.r }; };
  /* 검산: 세로 나눗셈을 직접 해서 나온 몫 · 나머지와 같고, 나머지가 나누는 수보다 작은가 */
  var verifyQR = function (v, ans) { var L = longDiv(v.p, v.a); return L.q === ans.q && L.r === ans.r && ans.r < v.a; };
  var finalStep = function (v, L) {
    return { say: '몫은 ' + L.q + ', 나머지는 ' + josa(L.r, '이에요/예요') + '. 검산: ' + v.a + ' × ' + L.q + ' + ' + L.r + ' = ' + v.p + '.', tex: v.p + ' \\div ' + v.a + ' = ' + L.q + ' \\cdots ' + L.r, value: { q: L.q, r: L.r } };
  };

  /** 곱셈구구 범위의 풀이(한 번에 몫을 찾는다). 마지막 줄(답)은 빼고 돌려준다. */
  function onceSteps(v) {
    var L = longDiv(v.p, v.a), under = v.a * L.q, over = v.a * (L.q + 1);
    return [
      { say: v.a + '단에서 ' + josa(v.p, '을/를') + ' 넘지 않는 가장 큰 수를 찾아요. ' + v.a + ' × ' + L.q + ' = ' + under + ', ' + v.a + ' × ' + (L.q + 1) + ' = ' + over + '. ' + josa(over, '은/는') + ' ' + v.p + '보다 크니까 몫은 ' + josa(L.q, '이에요/예요') + '.', tex: v.a + ' \\times ' + L.q + ' = ' + under },
      { say: v.p + '에서 ' + josa(under, '을/를') + ' 빼고 남은 수가 나머지예요. 나머지는 나누는 수 ' + v.a + '보다 작아야 해요.', tex: v.p + ' - ' + under + ' = ' + L.r }
    ];
  }
  /** 세로셈 풀이(자리마다 한 줄). 마지막 줄(답)은 빼고 돌려준다. */
  function rowSteps(v) {
    var a = v.a;
    return longDiv(v.p, a).rows.map(function (w) {
      var pl = MH.place(w.place) + '의 자리', say;
      var head = w.first ? '높은 자리부터 봐요. ' : w.prev === 0 ? pl + ' 수 ' + josa(w.digit, '을/를') + ' 내려요. ' : w.prev + ' 옆에 ' + pl + ' 수 ' + josa(w.digit, '을/를') + ' 내려 쓰면 ' + josa(w.part, '이에요/예요') + '. ';
      if (w.lead) say = head + (w.first ? pl + ' 수 ' : '') + josa(w.part, '은/는') + ' ' + a + '보다 작아서 아직 나눌 수 없어요. 다음 자리와 함께 봐요.';
      else if (w.k === 0) say = head + josa(w.part, '은/는') + ' ' + a + '보다 작아서 나눌 수 없어요. 몫의 ' + pl + '에 0을 쓰고 넘어가요.';
      else say = head + w.part + ' ÷ ' + a + ': ' + a + ' × ' + w.k + ' = ' + w.sub + ', ' + a + ' × ' + (w.k + 1) + ' = ' + a * (w.k + 1) + '. ' + josa(a * (w.k + 1), '은/는') + ' ' + w.part + '보다 크니까 몫의 ' + pl + '에 ' + josa(w.k, '을/를') + ' 써요. ' + w.part + ' − ' + w.sub + ' = ' + w.rest + '.';
      return { say: say };
    });
  }

  /* ── 흔한 실수 (몫과 나머지를 쓰는 유형 공통) ──────────
     ① 나머지를 안 씀  ② 몫을 하나 크게 잡고 모자란 수를 나머지로 씀  ③ 몫과 나머지를 바꿔 씀  ④ 몫의 0 을 빠뜨림
     그 밖의 오답은 입력을 직접 검산해서 알려 준다: 나머지가 나누는 수 이상 · 몫은 맞고 나머지만 틀림 · 검산이 안 맞음 */
  var NO_REM = { id: 'no-remainder', wrong: function (v) { return { q: v.q, r: 0 }; },
    explain: function (v) { return '몫은 맞았어요. 그런데 ' + v.a + ' × ' + v.q + ' = ' + josa(v.a * v.q, '이라서/라서') + ' ' + v.p + '까지 ' + josa(v.r, '이/가') + ' 남아요. 남은 수를 나머지 칸에 써요.'; } };
  var OVER = { id: 'over', wrong: function (v) { return v.r >= 1 ? { q: v.q + 1, r: v.a - v.r } : null; },
    explain: function (v) { return v.a + ' × ' + (v.q + 1) + ' = ' + josa(v.a * (v.q + 1), '은/는') + ' ' + v.p + '보다 커요. 몫은 ' + josa(v.p, '을/를') + ' 넘지 않게 정해요. 모자란 수가 아니라 남는 수가 나머지예요.'; } };
  var SWAPPED = { id: 'swapped', wrong: function (v) { return v.q !== v.r && v.r >= 1 ? { q: v.r, r: v.q } : null; },
    explain: function (v) { return '몫과 나머지를 바꿔 썼어요. ' + josa(v.a, '이/가') + ' 몇 번 들어가는지가 몫이고, 그러고 남은 수가 나머지예요.'; } };
  var ZERO = { id: 'zero-missing',
    wrong: function (v) { var s = String(v.q).replace(/0/g, ''); return s !== '' && s !== String(v.q) ? { q: Number(s), r: v.r } : null; },
    explain: function (v) { return '몫에서 0을 빠뜨렸어요. 내려 쓴 수가 ' + v.a + '보다 작아 나눌 수 없을 때는 몫의 그 자리에 0을 써야 해요. 몫은 ' + ['한', '두', '세'][String(v.q).length - 1] + ' 자리 수예요.'; } };
  var BIG_REM = { id: 'big-remainder',
    match: function (v, raw) { var x = QR.parse(raw); return !!x && v.a * x.q + x.r === v.p && x.r >= v.a; },
    explain: function (v, ctx, x) { return '나머지 ' + josa(x.r, '이/가') + ' 나누는 수 ' + v.a + '보다 작지 않아요. ' + josa(v.a, '을/를') + ' 더 덜어 낼 수 있으니 몫을 키워야 해요. 나머지는 항상 나누는 수보다 작아요.'; } };
  var REM_WRONG = { id: 'remainder-wrong',
    match: function (v, raw) { var x = QR.parse(raw); return !!x && x.q === v.q && x.r !== v.r; },
    explain: function (v) { return '몫은 맞았어요. 나머지는 ' + v.p + '에서 ' + v.a + ' × ' + v.q + ' = ' + josa(v.a * v.q, '을/를') + ' 빼서 구해요. 뺄셈을 다시 해 보세요.'; } };
  var CHECK = { id: 'check-fail',
    match: function (v, raw) { return !!QR.parse(raw); },
    explain: function (v, ctx, x) {
      var got = v.a * x.q + x.r;
      return '검산해 보면 ' + v.a + ' × ' + x.q + ' + ' + x.r + ' = ' + josa(got, '이에요/예요') + '. ' + v.p + (got < v.p ? '보다 ' + (v.p - got) + '만큼 모자라요.' : '보다 ' + (got - v.p) + '만큼 넘쳐요.') + ' 몫부터 다시 구해 보세요.';
    } };

  function defineQR(id, title, levels, opts) {
    MH.defineType({
      id: id, unit: 'A05', version: 1, title: title,
      answer: { kind: 'quotient-remainder' },
      levels: levels,
      prompt: function (v) { return { tex: v.p + ' \\div ' + v.a, text: '몫과 나머지를 구하세요.' }; },
      solve: answerQR, verify: verifyQR,
      hints: opts.hints,
      steps: function (v) { return opts.steps(v).concat([finalStep(v, longDiv(v.p, v.a))]); },
      mistakes: opts.mistakes.concat([BIG_REM, REM_WRONG, CHECK])
    });
  }

  /* ── A05.basic 곱셈구구 범위의 나머지가 있는 나눗셈 ──── */
  defineQR('A05.basic', '나머지가 있는 나눗셈', [
    { name: '2~5로 나누기', minDistinct: 85, vars: { a: int(2, 5), q: int(1, 9), r: rem1, p: dividend } },
    { name: '6~9로 나누기', minDistinct: 200, vars: { a: int(6, 9), q: int(1, 9), r: rem1, p: dividend } }
  ], {
    hints: function (v) {
      return [
        v.a + '단에서 ' + v.p + '보다 크지 않은 수 가운데 가장 큰 수를 찾아보세요.',
        '그 수를 만들 때 ' + v.a + '에 곱한 수가 몫이에요. ' + v.p + '에서 그 수를 빼면 나머지예요.',
        '나머지는 나누는 수 ' + v.a + '보다 작아야 해요. 같거나 크면 몫을 하나 더 키울 수 있어요.'
      ];
    },
    steps: onceSteps,
    mistakes: [NO_REM, OVER, SWAPPED]
  });

  /* ── A05.long (두 · 세 자리) ÷ (한 자리) ───────────────── */
  var longHints = function (v) {
    var w = longDiv(v.p, v.a).rows.filter(function (x) { return !x.lead; })[0];
    return [
      '높은 자리부터 차례로 나눠요. 먼저 ' + josa(w.part, '을/를') + ' ' + josa(v.a, '으로/로') + ' 나눠 보세요.',
      '나누고 남은 수 옆에 다음 자리 수를 내려 써서 다시 나눠요. 내려 쓴 수가 ' + v.a + '보다 작으면 몫의 그 자리에 0을 써요.',
      '마지막에 남은 수가 나머지예요. (나누는 수) × (몫) + (나머지)가 ' + josa(v.p, '이/가') + ' 되는지 확인해 보세요.'
    ];
  };
  defineQR('A05.long', '한 자리 수로 나누기', [
    { name: '(두 자리) ÷ (한 자리)', minDistinct: 250, vars: { a: int(2, 8), q: function (v) { return int(11, maxQ(99, v.a)); }, r: rem0, p: dividend }, where: function (v) { return v.p <= 99; } },
    { name: '(세 자리) ÷ (한 자리), 몫이 두 자리', vars: { a: int(2, 9), q: int(11, 99), r: rem0, p: dividend }, where: function (v) { return v.p >= 100; } },
    { name: '(세 자리) ÷ (한 자리), 몫이 세 자리', vars: { a: int(2, 9), q: function (v) { return int(100, maxQ(999, v.a)); }, r: rem0, p: dividend }, where: function (v) { return v.p <= 999; } }
  ], { hints: longHints, steps: rowSteps, mistakes: [NO_REM, OVER, ZERO] });

  /* ── A05.two (두 · 세 자리) ÷ (두 자리) ────────────────── */
  defineQR('A05.two', '두 자리 수로 나누기', [
    { name: '(두 자리) ÷ (두 자리)', vars: { a: int(11, 45), q: function (v) { return int(2, Math.min(8, maxQ(99, v.a))); }, r: rem0, p: dividend }, where: function (v) { return v.p <= 99; } },
    { name: '(세 자리) ÷ (두 자리), 몫이 한 자리', vars: { a: int(12, 89), q: int(2, 9), r: rem0, p: dividend }, where: function (v) { return v.p >= 100 && v.p <= 999; } },
    { name: '(세 자리) ÷ (두 자리), 몫이 두 자리', vars: { a: int(11, 39), q: function (v) { return int(11, maxQ(999, v.a)); }, r: rem0, p: dividend }, where: function (v) { return v.p <= 999; } }
  ], {
    hints: function (v) {
      var near = v.a + 5 - (v.a + 5) % 10, w = longDiv(v.p, v.a).rows.filter(function (x) { return !x.lead; })[0];
      return [
        (near === v.a ? '' : josa(v.a, '을/를') + ' 약 ' + josa(near, '으로/로') + ' 보고 ') + w.part + ' 안에 ' + josa(v.a, '이/가') + ' 몇 번 들어가는지 어림해 보세요.',
        '어림한 수를 ' + v.a + '에 곱해 보세요. ' + w.part + '보다 크면 1 줄이고, 빼고 남은 수가 ' + v.a + ' 이상이면 1 늘려요.',
        '마지막에 남은 수가 나머지예요. (나누는 수) × (몫) + (나머지)가 ' + josa(v.p, '이/가') + ' 되는지 확인해 보세요.'
      ];
    },
    steps: rowSteps, mistakes: [NO_REM, OVER, ZERO]
  });

  /* ── A05.check 검산: □ ÷ a = q ⋯ r ─────────────────── */
  function mulSay(a, q) {                                 /* 한 자리 × 두 자리는 몇십과 몇으로 나눠 곱한다 */
    var big = a > q ? a : q, small = a > q ? q : a, ones = big % 10, tens = big - ones;
    if (big <= 9 || ones === 0) return a + ' × ' + q + ' = ' + a * q;
    return a + ' × ' + q + ' = ' + small + ' × ' + tens + ' + ' + small + ' × ' + ones + ' = ' + small * tens + ' + ' + small * ones + ' = ' + a * q;
  }
  MH.defineType({
    id: 'A05.check', unit: 'A05', version: 1, title: '검산으로 나누어지는 수 찾기',
    answer: { kind: 'int' },
    levels: [
      { name: '곱셈구구 범위', minDistinct: 250, vars: { a: int(2, 9), q: int(2, 9), r: rem1, p: dividend } },
      { name: '몫이 두 자리', vars: { a: int(2, 9), q: int(11, 40), r: rem1, p: dividend } },
      { name: '나누는 수가 두 자리', vars: { a: int(11, 25), q: int(2, 9), r: rem1, p: dividend } }
    ],
    prompt: function (v) { return { tex: '\\square \\div ' + v.a + ' = ' + v.q + ' \\cdots ' + v.r, text: '□에 알맞은 수를 구하세요. (⋯ 뒤의 수는 나머지예요.)' }; },
    solve: function (v) { return v.p; },
    /* 검산: 구한 수를 실제로 나눠 보면 그 몫과 나머지가 나오는가 */
    verify: function (v, ans) { var L = longDiv(ans, v.a); return L.q === v.q && L.r === v.r; },
    hints: function (v) {
      return [
        '나눗셈이 맞는지 확인하는 검산식을 떠올려 보세요: (나누는 수) × (몫) + (나머지) = (나누어지는 수).',
        '먼저 ' + v.a + ' × ' + josa(v.q, '을/를') + ' 계산해요.',
        '거기에 나머지 ' + josa(v.r, '을/를') + ' 더해요.'
      ];
    },
    steps: function (v) {
      return [
        { say: '□를 ' + v.a + '씩 묶으면 ' + v.q + '묶음이 되고 ' + josa(v.r, '이/가') + ' 남는다는 뜻이에요. 거꾸로 계산하면 □가 나와요.', tex: '\\square = ' + v.a + ' \\times ' + v.q + ' + ' + v.r },
        { say: '먼저 곱해요: ' + mulSay(v.a, v.q) + '.' },
        { say: '나머지를 더해요: ' + v.a * v.q + ' + ' + v.r + ' = ' + v.p + '.', tex: '\\boxed{' + v.p + '} \\div ' + v.a + ' = ' + v.q + ' \\cdots ' + v.r, value: v.p }
      ];
    },
    /* ① 나머지를 안 더함  ② 나머지를 뺌  ③ 나머지에 곱함 */
    mistakes: [
      { id: 'forgot-remainder', wrong: function (v) { return v.a * v.q; },
        explain: function (v) { return '나머지를 더하지 않았어요. ' + v.a + ' × ' + v.q + ' = ' + v.a * v.q + '에 나머지 ' + josa(v.r, '을/를') + ' 더해야 나누어지는 수가 돼요.'; } },
      { id: 'subtracted', wrong: function (v) { return v.a * v.q - v.r; },
        explain: function (v) { return '나머지를 뺐어요. 나머지는 나누고 남은 수라서, 거꾸로 갈 때는 더해야 해요: ' + v.a * v.q + ' + ' + v.r + '.'; } },
      { id: 'wrong-pair', wrong: function (v) { return v.a * v.r + v.q; },
        explain: function (v) { return '나머지에 곱했어요. 곱하는 짝은 나누는 수 ' + josa(v.a, '과/와') + ' 몫 ' + josa(v.q, '이에요/예요') + '. 나머지 ' + josa(v.r, '은/는') + ' 마지막에 더해요.'; } }
    ]
  });

  /* ── A05.word 문장제 ─────────────────────────────────
     left: 남는 수(나머지) · full: 가득 찬 묶음의 수(몫) · need: 모두 담는 데 필요한 묶음의 수(몫 + 1). 문제에는 p, a 순서로 나온다. */
  var CONTEXTS = [
    { id: 'left-candy', kind: 'left', unit: '개', text: function (p, a) { return '사탕 ' + p + '개를 한 봉지에 ' + a + '개씩 담으면 몇 개가 남을까요?'; } },
    { id: 'left-pencil', kind: 'left', unit: '자루', text: function (p, a) { return '연필 ' + p + '자루를 ' + a + '명이 똑같이, 되도록 많이 나눠 가지면 몇 자루가 남을까요?'; } },
    { id: 'full-egg', kind: 'full', unit: '판', text: function (p, a) { return '달걀 ' + p + '개를 한 판에 ' + a + '개씩 담아요. 가득 찬 판은 몇 판일까요?'; } },
    { id: 'full-string', kind: 'full', unit: '개', text: function (p, a) { return '끈 ' + p + ' cm를 ' + a + ' cm씩 잘라 팔찌를 만들어요. 팔찌는 몇 개까지 만들 수 있을까요?'; } },
    { id: 'need-boat', kind: 'need', unit: '대', text: function (p, a) { return p + '명이 한 대에 ' + a + '명까지 탈 수 있는 보트를 타려고 해요. 모두 타려면 보트는 적어도 몇 대 필요할까요?'; } },
    { id: 'need-box', kind: 'need', unit: '개', text: function (p, a) { return '책 ' + p + '권을 한 상자에 ' + a + '권씩 담아요. 책을 모두 담으려면 상자는 적어도 몇 개 필요할까요?'; } }
  ];
  var wordAnswer = function (kind, q, r) { return kind === 'left' ? r : kind === 'full' ? q : q + 1; };
  var onlyFor = function (kind, fn) { return function (v, ctx) { return ctx.kind === kind ? fn(v) : null; }; };
  MH.defineType({
    id: 'A05.word', unit: 'A05', version: 1, title: '나머지가 있는 나눗셈 문장제',
    answer: { kind: 'int', common: false, suffix: function (v, ctx) { return ctx.unit; } },
    contexts: CONTEXTS,
    levels: [
      { name: '곱셈구구 범위', vars: { a: int(2, 9), q: int(2, 9), r: rem1, p: dividend } },
      { name: '몫이 두 자리', vars: { a: int(2, 9), q: int(11, 30), r: rem1, p: dividend } },
      { name: '두 자리 수로 나누기', vars: { a: int(11, 25), q: int(2, 9), r: rem1, p: dividend } }
    ],
    prompt: function (v, ctx) { return { text: ctx.text(v.p, v.a) }; },
    solve: function (v, ctx) { return wordAnswer(ctx.kind, v.q, v.r); },
    verify: function (v, ans, ctx) { var L = longDiv(v.p, v.a); return L.r >= 1 && ans === wordAnswer(ctx.kind, L.q, L.r); },
    hints: function (v, ctx) {
      return [
        '식으로 쓰면 ' + v.p + ' ÷ ' + josa(v.a, '이에요/예요') + '. 몫과 나머지를 먼저 구해요.',
        '몫은 ' + v.a + '씩 묶은 묶음의 수이고, 나머지는 묶지 못하고 남은 수예요.',
        ctx.kind === 'left' ? '묻는 것은 남는 수예요. 몫과 나머지 가운데 어느 쪽인지 생각해 보세요.'
          : ctx.kind === 'full' ? '남은 것으로는 한 묶음을 다 채울 수 없어요. 다 채운 묶음만 세요.'
            : '남은 것도 빠짐없이 담아야 해요. 남은 것을 위한 자리가 하나 더 필요한지 생각해 보세요.'
      ];
    },
    steps: function (v, ctx) {
      var L = longDiv(v.p, v.a), ans = wordAnswer(ctx.kind, L.q, L.r), small = v.a <= 9 && L.q <= 9;
      var why = ctx.kind === 'left' ? '묻는 것은 남는 수이므로 나머지가 답이에요.'
        : ctx.kind === 'full' ? '남은 ' + josa(L.r, '으로/로') + '는 한 묶음을 채울 수 없으니 몫이 답이에요.'
          : '남은 ' + L.r + '도 담아야 하니 하나가 더 필요해요: ' + L.q + ' + 1 = ' + ans + '.';
      return [{ say: josa(v.p, '을/를') + ' ' + v.a + '씩 묶는 상황이에요. 나눗셈식을 세워요.', tex: v.p + ' \\div ' + v.a }]
        .concat(small ? onceSteps(v) : rowSteps(v), [
          { say: '몫은 ' + L.q + ', 나머지는 ' + josa(L.r, '이에요/예요') + '.', tex: v.p + ' \\div ' + v.a + ' = ' + L.q + ' \\cdots ' + L.r },
          { say: why + ' 답은 ' + ans + josa(ctx.unit, '이에요/예요') + '.', value: ans }
        ]);
    },
    /* ① 올려야 하는데 몫만 답함  ② 올리면 안 되는데 하나 더함  ③ 몫과 나머지를 바꿔 답함  ④ 남는 수가 나누는 수보다 큼 · 모자란 수를 답함 */
    mistakes: [
      { id: 'not-rounded-up', wrong: onlyFor('need', function (v) { return v.q; }),
        explain: function (v, ctx) { return v.q + ctx.unit + '에는 ' + v.a + ' × ' + v.q + ' = ' + v.a * v.q + '까지만 들어가요. 남은 ' + v.r + '도 담아야 하니 하나가 더 필요해요.'; } },
      { id: 'rounded-up', wrong: onlyFor('full', function (v) { return v.q + 1; }),
        explain: function (v) { return '하나를 더 셌어요. 남은 ' + josa(v.r, '은/는') + ' ' + v.a + '보다 작아서 한 묶음을 다 채울 수 없어요. 다 채운 묶음만 세요.'; } },
      { id: 'quotient-for-left', wrong: onlyFor('left', function (v) { return v.q; }),
        explain: function (v) { return '몫을 답했어요. ' + josa(v.q, '은/는') + ' 묶음의 수예요. 묻는 것은 묶고 남은 수, 곧 나머지예요.'; } },
      { id: 'remainder-for-count', wrong: function (v, ctx) { return ctx.kind === 'left' ? null : v.r; },
        explain: function (v) { return '나머지를 답했어요. ' + josa(v.r, '은/는') + ' 묶고 남은 수예요. 묻는 것은 묶음의 수예요.'; } },
      { id: 'big-left', wrong: onlyFor('left', function (v) { return v.r + v.a; }),
        explain: function (v) { return josa(v.r + v.a, '이/가') + ' 남았다면 ' + v.a + '씩 한 묶음을 더 만들 수 있어요. 남는 수는 ' + v.a + '보다 작아야 해요.'; } },
      { id: 'short', wrong: onlyFor('left', function (v) { return v.a - v.r; }),
        explain: function (v) { return '한 묶음을 더 채우는 데 모자란 수를 답했어요. 묻는 것은 ' + v.a + '씩 묶고 남은 수예요.'; } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('A05', [
  { title: '나머지 — 묶고 남은 것', body: [
    '사탕 17개를 5개씩 묶으면 3묶음이 되고 2개가 남아요. 이때 3을 몫, 2를 나머지라고 하고 이렇게 써요.',
    { tex: '17 \\div 5 = 3 \\cdots 2' },
    '나머지는 언제나 나누는 수보다 작아요. 나머지가 5이거나 5보다 크면 한 묶음을 더 만들 수 있기 때문이에요.'
  ] },
  { title: '검산 — 답이 맞는지 확인하기', body: [
    '묶음을 다시 합치고 남은 것을 더하면 처음 수가 되어야 해요.',
    { tex: '5 \\times 3 + 2 = 17' },
    '(나누는 수) × (몫) + (나머지) = (나누어지는 수)예요. 빈칸 문제 □ ÷ 25 = 3 ⋯ 2도 이 식으로 풀어요: 25 × 3 + 2 = 77.'
  ] },
  { title: '큰 수는 높은 자리부터 나눠요', body: [
    { tex: '86 \\div 4 = 21 \\cdots 2' },
    { list: ['① 십의 자리: 8 ÷ 4 = 2. 몫의 십의 자리에 2를 써요.', '② 일의 자리: 6 ÷ 4 = 1이고 2가 남아요. 몫의 일의 자리에 1을 써요.', '③ 몫은 21, 나머지는 2.'] },
    '윗자리에서 남은 수가 있으면 아랫자리 숫자와 붙여서 이어서 나눠요. 예를 들어 9 ÷ 4에서 1이 남으면 다음 자리 숫자 2와 합쳐 12로 만들어요.'
  ] },
  { title: '두 자리 수로 나누기 — 어림해서 맞춰 보기', body: [
    { tex: '189 \\div 22 = 8 \\cdots 13' },
    { list: ['① 22를 20쯤으로 보고 어림해요. 20 × 9 = 180이니 몫은 9 근처예요.', '② 곱해서 확인해요: 22 × 9 = 198. 189를 넘어서 안 돼요.', '③ 하나 줄여요: 22 × 8 = 176. 189 − 176 = 13이 남아요.', '④ 나머지 13이 22보다 작으니 끝. 몫은 8, 나머지는 13.'] }
  ] }
]);
