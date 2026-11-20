/* A03 곱셈 — (두·세 자리)×(한 자리), (두 자리)×(두 자리)
   유형(쉬운 것부터): A03.tens 몇십·몇백 곱하기 · A03.one 한 자리 수 곱하기 · A03.two 두 자리 수 곱하기 · A03.word 문장제 */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, digits = MH.digits, place = MH.place, josa = MH.josa;

  /* ── 세로셈 도구 ─────────────────────────────────────── */
  function tensOf(n) { return (n - n % 10) / 10; }                       /* 십의 자리 위쪽: 47 → 4, 42 → 4 */
  function column(a, b, rows) {
    return '\\begin{array}{r} ' + a + ' \\\\ \\times\\enspace ' + b + ' \\\\ \\hline ' + (rows && rows.length ? rows.join(' \\\\ ') : '\\phantom{0}') + ' \\end{array}';
  }
  /** a × d (d 는 한 자리)를 세로로 곱할 때 윗자리로 올림이 일어나는 횟수(맨 윗자리 제외) */
  function carries(a, d) {
    var x = digits(a), c = 0, n = 0;
    for (var i = 0; i < x.length - 1; i++) { c = tensOf(x[i] * d + c); if (c) n++; }
    return n;
  }
  /** a × d 를 자리마다 계산한다. { value, lines(자리별 설명) } — a * d 를 쓰지 않고 답에 이른다. */
  function mulOne(a, d) {
    var x = digits(a), c = 0, s = '', lines = [];
    for (var i = 0; i < x.length; i++) {
      var r = x[i] * d + c, top = i === x.length - 1;
      var say = place(i) + '의 자리: ' + x[i] + ' × ' + d + ' = ' + x[i] * d + (c ? ', 올린 ' + josa(c, '을/를') + ' 더하면 ' + r : '') + '. ';
      if (top) say += (r >= 10 ? '맨 윗자리이므로 ' : '') + josa(r, '을/를') + (r >= 10 ? ' 그대로 써요.' : ' 써요.');
      else if (r >= 10) say += josa(r % 10, '을/를') + ' 쓰고 ' + josa(tensOf(r), '을/를') + ' ' + place(i + 1) + '의 자리로 올려요.';
      else say += josa(r, '을/를') + ' 써요.';
      lines.push(say);
      s = (top ? r : r % 10) + s; c = top ? 0 : tensOf(r);
    }
    return { value: Number(s), lines: lines };
  }

  /* ── 흔한 실수가 만드는 오답 ─────────────────────────── */
  /** 올린 수를 더하지 않음: 47 × 6 → 242 */
  function noCarry(a, d) {
    var x = digits(a), s = '';
    for (var i = 0; i < x.length; i++) s = (i === x.length - 1 ? x[i] * d : x[i] * d % 10) + s;
    return Number(s);
  }
  /** 자리마다 곱한 값을 그대로 이어 씀: 47 × 6 → 2442 */
  function writeAll(a, d) {
    var x = digits(a), s = '';
    for (var i = 0; i < x.length; i++) s = x[i] * d + s;
    return Number(s);
  }
  /** 올린 수를 먼저 더한 뒤 곱함: 47 × 6 → (4 + 4) × 6 = 48 → 482 */
  function carryFirst(a, d) {
    var x = digits(a), c = 0, s = '';
    for (var i = 0; i < x.length; i++) { var r = (x[i] + c) * d, top = i === x.length - 1; s = (top ? r : r % 10) + s; c = tensOf(r); }
    return Number(s);
  }
  /** 일의 자리만 곱하고 윗자리는 그대로 내려 씀: 47 × 6 → 40 + 42 = 82 */
  function onesOnly(a, d) { return a - a % 10 + a % 10 * d; }

  var ADDED = { id: 'added', wrong: function (v) { return v.a + v.b; },
    explain: function () { return '두 수를 더했어요. 기호가 × 인지 다시 확인해 보세요.'; } };
  var NO_CARRY = { id: 'no-carry', wrong: function (v) { return v.b < 10 ? noCarry(v.a, v.b) : null; },
    explain: function () { return '올린 수를 윗자리에 더하지 않았어요. 한 자리의 곱이 10을 넘으면 십의 자리 숫자를 윗자리로 올리고, 윗자리를 곱한 다음에 더해요.'; } };
  var WRITE_ALL = { id: 'write-all', wrong: function (v) { return v.b < 10 ? writeAll(v.a, v.b) : null; },
    explain: function () { return '자리마다 곱한 값을 그대로 이어 썼어요. 한 자리에는 숫자 하나만 쓸 수 있어요. 곱이 10을 넘으면 일의 자리 숫자만 쓰고 나머지는 윗자리로 올려요.'; } };
  var CARRY_FIRST = { id: 'carry-first', wrong: function (v) { return v.b < 10 ? carryFirst(v.a, v.b) : null; },
    explain: function () { return '올린 수를 먼저 더한 뒤에 곱했어요. 순서가 반대예요. 먼저 그 자리 숫자를 곱하고, 그 다음에 올린 수를 더해요.'; } };
  var ONES_ONLY = { id: 'ones-only-multiplied', wrong: function (v) { return v.b < 10 ? onesOnly(v.a, v.b) : null; },
    explain: function (v) { return '일의 자리만 곱하고 윗자리는 그대로 내려 썼어요. ' + josa(v.b, '은/는') + ' ' + v.a + '의 모든 자리에 곱해야 해요.'; } };
  /* 두 자리 수를 곱할 때 */
  var NO_SHIFT = { id: 'no-shift', wrong: function (v) { return v.b >= 10 ? v.a * (v.b % 10) + v.a * tensOf(v.b) : null; },
    explain: function (v) { return v.b + '의 ' + josa(tensOf(v.b), '은/는') + ' ' + tensOf(v.b) * 10 + '이에요. ' + v.a + ' × ' + tensOf(v.b) + ' 의 결과에 0을 하나 붙여야(한 자리 왼쪽으로 옮겨 써야) 해요.'; } };
  var DIGITWISE = { id: 'digitwise', wrong: function (v) { return v.b >= 10 && v.a >= 10 ? tensOf(v.a) * tensOf(v.b) * 100 + v.a % 10 * (v.b % 10) : null; },
    explain: function (v) { return '십의 자리끼리, 일의 자리끼리만 곱했어요. ' + v.a + '의 모든 자리에 ' + v.b + '의 일의 자리와 십의 자리를 각각 곱해야 해요.'; } };
  var ONE_PARTIAL = { id: 'one-partial', wrong: function (v) { return v.b >= 10 && v.b % 10 ? v.a * (v.b % 10) : null; },
    explain: function (v) { return v.b + '의 일의 자리 ' + (v.b % 10) + '만 곱했어요. 십의 자리 ' + tensOf(v.b) + '(' + tensOf(v.b) * 10 + ')도 곱해서 더해야 해요.'; } };
  var OTHER_PARTIAL = { id: 'tens-partial', wrong: function (v) { return v.b >= 10 && v.b % 10 ? v.a * (v.b - v.b % 10) : null; },
    explain: function (v) { return v.b + '의 십의 자리(' + tensOf(v.b) * 10 + ')만 곱했어요. 일의 자리 ' + (v.b % 10) + '도 곱해서 더해야 해요.'; } };

  /* ── 풀이 ───────────────────────────────────────────── */
  function oneSteps(a, d) {
    var m = mulOne(a, d);
    return [{ say: '자리를 맞춰 세로로 쓰고, 일의 자리부터 곱해요.', tex: column(a, d) }]
      .concat(m.lines.map(function (s) { return { say: s }; }),
        [{ say: '답은 ' + josa(m.value, '이에요/예요') + '.', tex: column(a, d, [m.value]), value: m.value }]);
  }
  function twoSteps(a, b) {
    var ones = b % 10, tens = tensOf(b), out = [{ say: josa(b, '을/를') + ' ' + josa(tens * 10, '과/와') + ' ' + josa(ones, '으로/로') + ' 나눠서 따로 곱한 뒤 더해요.', tex: column(a, b) }];
    var p2 = Number(String(mulOne(a, tens).value) + '0');                 /* a × (몇십): a × 몇 에 0 을 붙인다 */
    if (!ones) {
      return [{ say: tens * 10 + '을 곱할 때는 먼저 ' + josa(tens, '을/를') + ' 곱하고 0을 하나 붙여요.', tex: column(a, b) },
        { say: a + ' × ' + tens + ' = ' + mulOne(a, tens).value + '.' },
        { say: '0을 하나 붙이면 ' + p2 + '. 답은 ' + josa(p2, '이에요/예요') + '.', tex: column(a, b, [p2]), value: p2 }];
    }
    var p1 = mulOne(a, ones).value, value = p1 + p2;
    out.push({ say: '일의 자리 ' + josa(ones, '을/를') + ' 곱해요: ' + a + ' × ' + ones + ' = ' + p1 + '.' });
    out.push({ say: '십의 자리 ' + josa(tens, '은/는') + ' ' + tens * 10 + '이에요: ' + a + ' × ' + tens + ' = ' + mulOne(a, tens).value + ' 에 0을 하나 붙여 ' + p2 + '.' });
    out.push({ say: '두 결과를 더해요: ' + p1 + ' + ' + p2 + ' = ' + value + '. 답은 ' + josa(value, '이에요/예요') + '.', tex: column(a, b, [p1, p2 + ' \\\\ \\hline ' + value]), value: value });
    return out;
  }

  /* ── A03.tens 몇십 · 몇백 곱하기 ──────────────────────
     a = t × 10^za, b = u × 10^zb. 0 을 떼고 곱한 뒤 뗀 만큼 다시 붙인다. */
  function pow10(n) { var p = 1; while (n-- > 0) p *= 10; return p; }
  function tensVars(za, zb) {
    return { t: int(2, 9), u: int(2, 9), za: za, zb: zb, a: function (v) { return v.t * pow10(za); }, b: function (v) { return v.u * pow10(zb); } };
  }
  MH.defineType({
    id: 'A03.tens', unit: 'A03', version: 1, title: '몇십 · 몇백 곱하기',
    answer: { kind: 'int' },
    levels: [
      { name: '(몇십) × (한 자리)', minDistinct: 60, vars: tensVars(1, 0) },
      { name: '(몇백) × (한 자리)', minDistinct: 60, vars: tensVars(2, 0) },
      { name: '(몇십) × (몇십)', minDistinct: 60, vars: tensVars(1, 1) }
    ],
    prompt: function (v) { return { tex: v.a + ' \\times ' + v.b, text: '계산하세요.' }; },
    solve: function (v) { return v.a * v.b; },
    /* 검산: 답을 한쪽 수로 나누면 다른 쪽 수가 나오는가 */
    verify: function (v, ans) { return ans % v.b === 0 && ans / v.b === v.a && ans % v.a === 0 && ans / v.a === v.b; },
    hints: function (v) {
      var z = v.za + v.zb;
      return [
        '0을 잠깐 떼어 놓고 곱셈구구로 계산한 뒤, 떼어 놓은 0을 다시 붙여요.',
        '0을 떼면 ' + v.t + ' × ' + josa(v.u, '이/가') + ' 남아요. 곱셈구구로 구해 보세요.',
        '떼어 놓은 0은 모두 ' + z + '개예요. 곱셈구구의 답 뒤에 0을 ' + z + '개 붙여요.'
      ];
    },
    steps: function (v) {
      var z = v.za + v.zb, core = mulOne(v.t, v.u).value, value = Number(String(core) + String(pow10(z)).slice(1));
      return [
        { say: '0을 떼어 놓고 곱셈구구로 계산해요: ' + v.t + ' × ' + v.u + ' = ' + core + '.', tex: v.a + ' \\times ' + v.b },
        { say: '떼어 놓은 0은 ' + (v.zb ? '두 수에서 하나씩, ' : '') + '모두 ' + z + '개예요. ' + core + ' 뒤에 0을 ' + z + '개 붙여요.' },
        { say: '답은 ' + josa(value, '이에요/예요') + '.' + (core % 10 === 0 ? ' ' + core + '에 원래 있던 0과 붙인 0을 헷갈리지 마세요.' : ''), tex: v.a + ' \\times ' + v.b + ' = ' + value, value: value }
      ];
    },
    /* ① 0 을 덜 붙임  ② 0 을 더 붙임  ③ 곱하지 않고 더함 */
    mistakes: [
      { id: 'no-zeros', wrong: function (v) { return v.t * v.u; },
        explain: function (v) { return '곱셈구구 ' + v.t + ' × ' + v.u + ' 까지는 맞았어요. 떼어 놓은 0 ' + (v.za + v.zb) + '개를 다시 붙여야 해요.'; } },
      { id: 'zero-missing', wrong: function (v) { return v.a * v.b / 10; },
        explain: function (v) { return '0이 하나 모자라요. 떼어 놓은 0은 모두 ' + (v.za + v.zb) + '개예요. ' + (v.t * v.u % 10 === 0 ? v.t + ' × ' + v.u + ' = ' + v.t * v.u + ' 에 원래 있는 0은 따로 세요.' : '곱셈구구의 답 뒤에 그만큼 붙여요.'); } },
      { id: 'zero-extra', wrong: function (v) { return v.a * v.b * 10; },
        explain: function (v) { return '0이 하나 많아요. 떼어 놓은 0은 모두 ' + (v.za + v.zb) + '개예요. 그만큼만 붙여요.'; } },
      ADDED
    ]
  });

  /* ── A03.one 한 자리 수 곱하기 ────────────────────────── */
  MH.defineType({
    id: 'A03.one', unit: 'A03', version: 1, title: '(두 · 세 자리) × (한 자리)',
    answer: { kind: 'int' },
    levels: [
      { name: '(두 자리) × (한 자리), 올림 없음', minDistinct: 110,
        vars: { a: int(11, 99), b: int(2, 9) },
        where: function (v) { return v.a % 10 !== 0 && carries(v.a, v.b) === 0; } },
      { name: '(두 자리) × (한 자리), 올림 있음',
        vars: { a: int(12, 99), b: int(2, 9) },
        where: function (v) { return carries(v.a, v.b) === 1; } },
      { name: '(세 자리) × (한 자리)',
        vars: { a: int(101, 999), b: int(2, 9) },
        where: function (v) { return carries(v.a, v.b) >= 1; } }
    ],
    prompt: function (v) { return { tex: v.a + ' \\times ' + v.b, text: '계산하세요.' }; },
    solve: function (v) { return v.a * v.b; },
    verify: function (v, ans) { return ans % v.b === 0 && ans / v.b === v.a; },
    hints: function (v) {
      var d = v.a % 10;
      return [
        '일의 자리부터 한 자리씩 ' + josa(v.b, '을/를') + ' 곱해요. 머릿속으로 어렵다면 종이에 세로로 써 보세요.',
        d * v.b >= 10
          ? '일의 자리는 ' + d + ' × ' + v.b + ' = ' + d * v.b + '. ' + josa(d * v.b % 10, '을/를') + ' 쓰고 ' + josa(tensOf(d * v.b), '을/를') + ' 십의 자리로 올려요.'
          : '일의 자리는 ' + d + ' × ' + v.b + ' = ' + d * v.b + '. 곱이 10을 넘는 자리가 있으면 십의 자리 숫자를 윗자리로 올려요.',
        '올린 수는 윗자리를 곱한 다음에 더해요. 곱하기 전에 더하면 안 돼요.'
      ];
    },
    steps: function (v) { return oneSteps(v.a, v.b); },
    mistakes: [NO_CARRY, WRITE_ALL, CARRY_FIRST, ONES_ONLY, ADDED]
  });

  /* ── A03.two 두 자리 수 곱하기 ────────────────────────── */
  MH.defineType({
    id: 'A03.two', unit: 'A03', version: 1, title: '(두 자리) × (두 자리)',
    answer: { kind: 'int' },
    levels: [
      { name: '(두 자리) × (몇십)',
        vars: { a: int(12, 99), u: int(2, 9), b: function (v) { return v.u * 10; } },
        where: function (v) { return v.a % 10 !== 0; } },
      { name: '(두 자리) × (두 자리), 올림 없음', minDistinct: 200,
        vars: { a: int(11, 49), b: int(11, 49) },
        where: function (v) { return v.a % 10 !== 0 && v.b % 10 !== 0 && carries(v.a, v.b % 10) === 0 && carries(v.a, tensOf(v.b)) === 0; } },
      { name: '(두 자리) × (두 자리)',
        vars: { a: int(12, 99), b: int(12, 99) },
        where: function (v) { return v.a % 10 !== 0 && v.b % 10 !== 0 && carries(v.a, v.b % 10) + carries(v.a, tensOf(v.b)) >= 1; } }
    ],
    prompt: function (v) { return { tex: v.a + ' \\times ' + v.b, text: '계산하세요.' }; },
    solve: function (v) { return v.a * v.b; },
    verify: function (v, ans) { return ans % v.b === 0 && ans / v.b === v.a && ans % v.a === 0 && ans / v.a === v.b; },
    hints: function (v) {
      var ones = v.b % 10, tens = tensOf(v.b);
      return ones ? [
        josa(v.b, '을/를') + ' ' + josa(tens * 10, '과/와') + ' ' + josa(ones, '으로/로') + ' 나눠서 생각해요.',
        v.a + ' × ' + josa(ones, '과/와') + ' ' + v.a + ' × ' + josa(tens * 10, '을/를') + ' 따로 구해요.',
        v.a + ' × ' + josa(tens * 10, '은/는') + ' ' + v.a + ' × ' + tens + '의 결과에 0을 하나 붙인 수예요. 두 결과를 더하면 답이에요.'
      ] : [
        tens * 10 + '을 곱할 때는 0을 잠깐 떼어 놓아요.',
        '먼저 ' + v.a + ' × ' + josa(tens, '을/를') + ' 계산해요.',
        '그 결과 뒤에 떼어 놓은 0을 하나 붙여요.'
      ];
    },
    steps: function (v) { return twoSteps(v.a, v.b); },
    /* ① 십의 자리 곱을 자리 옮기지 않음(0 을 안 붙임)  ② 같은 자리끼리만 곱함  ③ 한쪽만 곱하고 끝냄 */
    mistakes: [NO_SHIFT, DIGITWISE, ONE_PARTIAL, OTHER_PARTIAL, ADDED]
  });

  /* ── A03.word 문장제 ─────────────────────────────────── */
  var CONTEXTS = [
    { id: 'apples', unit: '개', text: function (a, b) { return '한 상자에 사과가 ' + a + '개씩 들어 있어요. ' + b + '상자에 든 사과는 모두 몇 개일까요?'; } },
    { id: 'pages', unit: '쪽', text: function (a, b) { return '하루에 ' + a + '쪽씩 ' + b + '일 동안 책을 읽으면 모두 몇 쪽을 읽게 될까요?'; } },
    { id: 'seats', unit: '명', text: function (a, b) { return '한 줄에 ' + a + '명씩 ' + b + '줄로 앉았어요. 앉은 사람은 모두 몇 명일까요?'; } },
    { id: 'paper', unit: '장', text: function (a, b) { return '한 묶음에 종이가 ' + a + '장씩 들어 있어요. ' + b + '묶음에 든 종이는 모두 몇 장일까요?'; } },
    { id: 'study', unit: '분', text: function (a, b) { return '하루에 ' + a + '분씩 ' + b + '일 동안 공부했어요. 공부한 시간은 모두 몇 분일까요?'; } }
  ];
  MH.defineType({
    id: 'A03.word', unit: 'A03', version: 1, title: '곱셈 문장제',
    answer: { kind: 'int', suffix: function (v, ctx) { return ctx.unit; } },
    contexts: CONTEXTS,
    levels: [
      { name: '(두 자리) × (한 자리)',
        vars: { a: int(12, 99), b: int(2, 9) },
        where: function (v) { return carries(v.a, v.b) === 1; } },
      { name: '(두 자리) × (두 자리)',
        vars: { a: int(12, 99), b: int(12, 49) },
        where: function (v) { return v.a % 10 !== 0 && v.b % 10 !== 0; } }
    ],
    prompt: function (v, ctx) { return { text: ctx.text(v.a, v.b) }; },
    solve: function (v) { return v.a * v.b; },
    verify: function (v, ans) { return ans % v.b === 0 && ans / v.b === v.a; },
    hints: function (v, ctx) {
      return [
        '같은 수가 여러 묶음 있을 때는 곱셈을 써요.',
        v.a + ctx.unit + '씩 ' + v.b + '묶음이니까 식으로 쓰면 ' + v.a + ' × ' + josa(v.b, '이에요/예요') + '.',
        v.b < 10 ? '일의 자리부터 곱하고, 올린 수는 윗자리를 곱한 다음에 더해요.' : josa(v.b, '을/를') + ' 몇십과 몇으로 나눠 따로 곱한 뒤 더해요.'
      ];
    },
    steps: function (v, ctx) {
      var inner = v.b < 10 ? oneSteps(v.a, v.b) : twoSteps(v.a, v.b), last = inner[inner.length - 1];
      return [{ say: v.a + ctx.unit + '씩 ' + v.b + '묶음이에요. 같은 수를 여러 번 더하니까 곱셈식을 세워요.', tex: v.a + ' \\times ' + v.b }]
        .concat(inner.slice(v.b < 10 ? 1 : 0, -1), [{ say: last.say.replace(/답은 .*$/, '') + '답은 ' + last.value + josa(ctx.unit, '이에요/예요') + '.', tex: last.tex, value: last.value }]);
    },
    mistakes: [
      { id: 'added', wrong: ADDED.wrong,
        explain: function (v, ctx) { return '두 수를 더했어요. ' + v.a + ctx.unit + '씩 ' + v.b + '묶음은 ' + josa(v.a, '을/를') + ' ' + v.b + '번 더하는 것이라서 ' + v.a + ' × ' + josa(v.b, '으로/로') + ' 계산해요.'; } },
      NO_CARRY, ONES_ONLY, NO_SHIFT, DIGITWISE
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('A03', [
  { title: '몇십 · 몇백 곱하기 — 0은 나중에 붙여요', body: [
    '0이 붙은 수는 0을 잠깐 떼고 곱한 뒤, 뗀 0을 모두 다시 붙여요.',
    { tex: '80 \\times 60 = 4800' },
    { list: ['① 0을 떼고 곱해요: 8 × 6 = 48.', '② 뗀 0은 모두 두 개예요. 48 뒤에 0을 두 개 붙여요 → 4800.'] }
  ] },
  { title: '큰 수는 쪼개서 곱해요', body: [
    '23 × 4는 23을 20과 3으로 쪼개서 따로 곱한 뒤 더해요.',
    { tex: '\\begin{aligned} 23 \\times 4 &= 20 \\times 4 + 3 \\times 4 \\\\ &= 80 + 12 = 92 \\end{aligned}' },
    '세로셈은 이 계산을 줄여 쓰는 방법일 뿐이에요.'
  ] },
  { title: '세로셈과 올림', body: [
    { tex: '\\begin{array}{r} 47 \\\\ \\times\\,\\phantom{0}6 \\\\ \\hline 282 \\end{array}' },
    { list: ['① 일의 자리: 7 × 6 = 42. 2만 쓰고 4는 십의 자리로 올려요.', '② 십의 자리: 4 × 6 = 24에 올라온 4를 더해 28.', '③ 답은 282.'] },
    '올린 수는 곱한 다음에 더해요. 곱하기 전에 더하지 않도록 조심해요.'
  ] },
  { title: '(두 자리) × (두 자리)', body: [
    '곱하는 수도 십의 자리와 일의 자리로 쪼개요.',
    { tex: '\\begin{aligned} 23 \\times 17 &= 23 \\times 10 + 23 \\times 7 \\\\ &= 230 + 161 = 391 \\end{aligned}' },
    '몇십을 곱한 값(23 × 10 = 230)은 끝에 0이 붙는다는 점만 기억하면 돼요.'
  ] }
]);
