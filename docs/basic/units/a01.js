/* A01 덧셈과 뺄셈 점검 — 받아올림 · 받아내림이 있는 두~세 자리 덧셈 · 뺄셈
   유형: A01.add 덧셈 · A01.sub 뺄셈 · A01.blank 빈칸 찾기 · A01.word 문장제 */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, digits = MH.digits, place = MH.place, josa = MH.josa;

  /* ── 세로셈 도구 ─────────────────────────────────────── */
  /** a + b 를 세로로 더할 때 받아올림이 일어나는 횟수 */
  function carries(a, b) {
    var x = digits(a), y = digits(b), c = 0, n = 0;
    for (var i = 0; i < Math.max(x.length, y.length); i++) { c = (x[i] || 0) + (y[i] || 0) + c >= 10 ? 1 : 0; n += c; }
    return n;
  }
  /** a − b (a > b) 를 세로로 뺄 때 받아내림이 일어나는 횟수 */
  function borrows(a, b) {
    var x = digits(a), y = digits(b), c = 0, n = 0;
    for (var i = 0; i < x.length; i++) { c = x[i] - c < (y[i] || 0) ? 1 : 0; n += c; }
    return n;
  }
  function fromDigits(ds) { var n = 0; for (var i = ds.length - 1; i >= 0; i--) n = n * 10 + ds[i]; return n; }
  /** 세로셈 그림(KaTeX). res 를 주면 답까지 적는다. */
  function column(a, op, b, res) {
    return '\\begin{array}{r} ' + a + ' \\\\ ' + op + '\\enspace ' + b + ' \\\\ \\hline ' + (res === undefined ? '\\phantom{0}' : res) + ' \\end{array}';
  }

  /** 덧셈의 자리별 풀이. 자리마다 직접 계산하므로 solve(a + b)와 다른 길로 답에 이른다. */
  function addSteps(a, b) {
    var x = digits(a), y = digits(b), c = 0, out = [], res = [], n = Math.max(x.length, y.length);
    out.push({ say: '자리를 맞춰 세로로 쓰고, 일의 자리부터 더해요.', tex: column(a, '+', b) });
    for (var i = 0; i < n; i++) {
      var p = x[i] || 0, q = y[i] || 0, s = p + q + c, top = i === n - 1;
      var say = place(i) + '의 자리: ' + p + ' + ' + q + (c ? ' + 1(받아올림)' : '') + ' = ' + s + '. ';
      if (s >= 10 && !top) say += josa(s % 10, '을/를') + ' 쓰고 1을 ' + place(i + 1) + '의 자리로 받아올려요.';
      else if (s >= 10) say += '맨 윗자리이므로 ' + josa(s, '을/를') + ' 그대로 써요.';
      else say += josa(s, '을/를') + ' 써요.';
      out.push({ say: say });
      res.push(s % 10); c = s >= 10 ? 1 : 0;
    }
    if (c) res.push(1);
    var value = fromDigits(res);
    out.push({ say: '답은 ' + josa(value, '이에요/예요') + '.', tex: column(a, '+', b, value), value: value });
    return out;
  }
  /** 뺄셈의 자리별 풀이 */
  function subSteps(a, b) {
    var x = digits(a), y = digits(b), c = 0, out = [], res = [];
    out.push({ say: '자리를 맞춰 세로로 쓰고, 일의 자리부터 빼요.', tex: column(a, '-', b) });
    for (var i = 0; i < x.length; i++) {
      var p = x[i], q = y[i] || 0, have = p - c, say = place(i) + '의 자리: ', up = place(i + 1) + '의 자리에서 10을 빌려 ';
      if (have < q) {
        if (have < 0) say += '아랫자리에 1을 빌려줘야 하는데 0이라 줄 수 없어요. ' + up + '와 1을 주면 9가 남아요: 9 − ' + q + ' = ' + (9 - q) + '.';
        else say += (c ? '아랫자리에 1을 빌려줘서 ' + josa(have, '이/가') + ' 됐어요. ' : '')
          + have + '에서 ' + josa(q, '을/를') + ' 뺄 수 없으니 ' + up + '와요: ' + (have + 10) + ' − ' + q + ' = ' + (have + 10 - q) + '.';
        res.push(have + 10 - q); c = 1;
      } else {
        if (c) say += '아랫자리에 1을 빌려줘서 ' + josa(have, '이/가') + ' 됐어요. ' + (i >= y.length ? josa(have, '을/를') + ' 써요.' : have + ' − ' + q + ' = ' + (have - q) + '.');
        else if (i >= y.length) say += josa(p, '을/를') + ' 그대로 내려 써요.';
        else say += p + ' − ' + q + ' = ' + (p - q) + '.';
        res.push(have - q); c = 0;
      }
      out.push({ say: say });
    }
    while (res.length > 1 && res[res.length - 1] === 0) res.pop();
    var value = fromDigits(res);
    out.push({ say: '답은 ' + josa(value, '이에요/예요') + '.', tex: column(a, '-', b, value), value: value });
    return out;
  }

  /* ── 흔한 실수가 만드는 오답 ─────────────────────────── */
  /** 받아올린 1을 윗자리에 더하지 않음: 47 + 38 → 75 */
  function addNoCarry(a, b) {
    var x = digits(a), y = digits(b), n = Math.max(x.length, y.length), s = '';
    for (var i = 0; i < n; i++) { var t = (x[i] || 0) + (y[i] || 0); s = (i === n - 1 ? t : t % 10) + s; }
    return Number(s);
  }
  /** 자리마다 더한 값을 그대로 이어 씀: 47 + 38 → 715 */
  function addWriteAll(a, b) {
    var x = digits(a), y = digits(b), s = '';
    for (var i = 0; i < Math.max(x.length, y.length); i++) s = ((x[i] || 0) + (y[i] || 0)) + s;
    return Number(s);
  }
  /** 자리마다 큰 수에서 작은 수를 뺌: 52 − 38 → 26 */
  function subFlip(a, b) {
    var x = digits(a), y = digits(b), ds = [];
    for (var i = 0; i < x.length; i++) ds.push(Math.abs(x[i] - (y[i] || 0)));
    return fromDigits(ds);
  }
  /** 10을 빌려 오고도 윗자리에서 1을 줄이지 않음: 52 − 38 → 24 */
  function subNoDecrement(a, b) {
    var x = digits(a), y = digits(b), ds = [];
    for (var i = 0; i < x.length; i++) { var q = y[i] || 0; ds.push(x[i] < q ? x[i] + 10 - q : x[i] - q); }
    return fromDigits(ds);
  }

  /* ── A01.add 덧셈 ───────────────────────────────────── */
  MH.defineType({
    id: 'A01.add', unit: 'A01', version: 1, title: '받아올림이 있는 덧셈',
    answer: { kind: 'int' },
    levels: [
      { name: '두 자리 + 두 자리 (받아올림 한 번)',
        vars: { a: int(12, 79), b: int(12, 79) },
        where: function (v) { return v.a + v.b < 100 && carries(v.a, v.b) === 1; } },
      { name: '두 자리 + 두 자리 (합이 100 이상)',
        vars: { a: int(25, 99), b: int(25, 99) },
        where: function (v) { return v.a + v.b >= 100 && carries(v.a, v.b) >= 1; } },
      { name: '세 자리 + 세 자리 (받아올림 두 번 이상)',
        vars: { a: int(100, 999), b: int(100, 999) },
        where: function (v) { return carries(v.a, v.b) >= 2; } }
    ],
    prompt: function (v) { return { tex: v.a + ' + ' + v.b, text: '계산하세요.' }; },
    solve: function (v) { return v.a + v.b; },
    verify: function (v, ans) { return ans - v.b === v.a && ans - v.a === v.b; },
    hints: function (v) {
      var p = v.a % 10, q = v.b % 10;
      return [
        '일의 자리부터 차례로 더해요. 머릿속으로 어렵다면 종이에 세로로 써 보세요.',
        p + q >= 10
          ? '일의 자리는 ' + p + ' + ' + q + ' = ' + (p + q) + '. 10이 넘었으니 ' + josa((p + q) % 10, '을/를') + ' 쓰고 1을 십의 자리로 받아올려요.'
          : '일의 자리는 ' + p + ' + ' + q + ' = ' + (p + q) + '. 십의 자리의 합이 10을 넘으면 1을 백의 자리로 받아올려요.',
        '받아올린 1은 바로 윗자리를 더할 때 함께 더해야 해요.'
      ];
    },
    steps: function (v) { return addSteps(v.a, v.b); },
    mistakes: [
      { id: 'no-carry', wrong: function (v) { return addNoCarry(v.a, v.b); },
        explain: function () { return '받아올린 1을 윗자리에 더하지 않았어요. 한 자리의 합이 10을 넘으면 1을 윗자리로 올리고, 윗자리를 더할 때 그 1도 함께 더해요.'; } },
      { id: 'write-all', wrong: function (v) { return addWriteAll(v.a, v.b); },
        explain: function () { return '자리마다 더한 값을 그대로 이어 썼어요. 한 자리에는 숫자 하나만 쓸 수 있어요. 10이 넘으면 일의 자리 숫자만 쓰고 1은 윗자리로 올려요.'; } },
      { id: 'subtracted', wrong: function (v) { return Math.abs(v.a - v.b); },
        explain: function () { return '더해야 하는데 뺐어요. 기호가 + 인지 다시 확인해 보세요.'; } }
    ]
  });

  /* ── A01.sub 뺄셈 ───────────────────────────────────── */
  MH.defineType({
    id: 'A01.sub', unit: 'A01', version: 1, title: '받아내림이 있는 뺄셈',
    answer: { kind: 'int' },
    levels: [
      { name: '두 자리 − 두 자리 (받아내림 한 번)',
        vars: { a: int(21, 99), b: int(12, 89) },
        where: function (v) { return v.a > v.b && borrows(v.a, v.b) === 1; } },
      { name: '세 자리 − 두·세 자리 (받아내림 한 번)',
        vars: { a: int(100, 999), b: int(12, 899) },
        where: function (v) { return v.a > v.b && borrows(v.a, v.b) === 1; } },
      { name: '세 자리 − 세 자리 (받아내림 두 번)',
        vars: { a: int(200, 999), b: int(101, 899) },
        where: function (v) { return v.a > v.b && borrows(v.a, v.b) === 2; } }
    ],
    prompt: function (v) { return { tex: v.a + ' - ' + v.b, text: '계산하세요.' }; },
    solve: function (v) { return v.a - v.b; },
    verify: function (v, ans) { return ans + v.b === v.a && ans > 0; },
    hints: function (v) {
      var p = v.a % 10, q = v.b % 10;
      return [
        '일의 자리부터 차례로 빼요. 머릿속으로 어렵다면 종이에 세로로 써 보세요.',
        p < q
          ? '일의 자리에서 ' + p + '에서 ' + josa(q, '을/를') + ' 뺄 수 없어요. 십의 자리에서 10을 빌려 와 ' + (p + 10) + ' − ' + josa(q, '으로/로') + ' 계산해요.'
          : '윗수가 아랫수보다 작은 자리가 있으면 바로 윗자리에서 10을 빌려 와요.',
        '10을 빌려준 자리는 1이 줄어들어요. 그 자리를 계산할 때 잊지 마세요.'
      ];
    },
    steps: function (v) { return subSteps(v.a, v.b); },
    mistakes: [
      { id: 'flip', wrong: function (v) { return subFlip(v.a, v.b); },
        explain: function () { return '자리마다 큰 수에서 작은 수를 뺐어요. 뺄셈은 항상 윗수에서 아랫수를 빼요. 윗수가 작으면 윗자리에서 10을 빌려 와야 해요.'; } },
      { id: 'no-decrement', wrong: function (v) { return subNoDecrement(v.a, v.b); },
        explain: function () { return '10을 빌려 온 것은 맞는데, 빌려준 윗자리에서 1을 줄이지 않았어요. 빌려준 자리는 1이 작아져요.'; } },
      { id: 'added', wrong: function (v) { return v.a + v.b; },
        explain: function () { return '빼야 하는데 더했어요. 기호가 − 인지 다시 확인해 보세요.'; } }
    ]
  });

  /* ── A01.blank 빈칸 찾기 ─────────────────────────────
     p + q = s 인 세 수로 네 가지 꼴을 만든다.
     0: □ + q = s (답 p)   1: p + □ = s (답 q)   2: s − □ = q (답 p)   3: □ − p = q (답 s) */
  var BLANK = [
    { tex: function (v) { return '\\square + ' + v.q + ' = ' + v.s; }, ans: function (v) { return v.p; },
      other: function (v) { return v.s + v.q; }, calc: function (v) { return [v.s, '−', v.q]; },
      why: function (v) { return '어떤 수에 ' + josa(v.q, '을/를') + ' 더해서 ' + josa(v.s, '이/가') + ' 됐으니, □는 ' + v.s + '에서 ' + josa(v.q, '을/를') + ' 뺀 수예요.'; } },
    { tex: function (v) { return v.p + ' + \\square = ' + v.s; }, ans: function (v) { return v.q; },
      other: function (v) { return v.s + v.p; }, calc: function (v) { return [v.s, '−', v.p]; },
      why: function (v) { return v.p + '에 어떤 수를 더해서 ' + josa(v.s, '이/가') + ' 됐으니, □는 ' + v.s + '에서 ' + josa(v.p, '을/를') + ' 뺀 수예요.'; } },
    { tex: function (v) { return v.s + ' - \\square = ' + v.q; }, ans: function (v) { return v.p; },
      other: function (v) { return v.s + v.q; }, calc: function (v) { return [v.s, '−', v.q]; },
      why: function (v) { return v.s + '에서 어떤 수를 빼서 ' + josa(v.q, '이/가') + ' 남았으니, □는 ' + v.s + '에서 ' + josa(v.q, '을/를') + ' 뺀 수예요.'; } },
    { tex: function (v) { return '\\square - ' + v.p + ' = ' + v.q; }, ans: function (v) { return v.s; },
      other: function (v) { return Math.abs(v.q - v.p); }, calc: function (v) { return [v.q, '+', v.p]; },
      why: function (v) { return '어떤 수에서 ' + josa(v.p, '을/를') + ' 빼서 ' + josa(v.q, '이/가') + ' 남았으니, □는 ' + v.q + '에 ' + josa(v.p, '을/를') + ' 다시 더한 수예요.'; } }
  ];
  function blankVars(lo, hi) {
    return { form: int(0, 3), p: int(lo, hi), q: int(lo, hi), s: function (v) { return v.p + v.q; } };
  }
  MH.defineType({
    id: 'A01.blank', unit: 'A01', version: 1, title: '덧셈과 뺄셈의 빈칸 찾기',
    answer: { kind: 'int' },
    levels: [
      { name: '두 자리 수', vars: blankVars(11, 79),
        where: function (v) { return v.s < 100 && carries(v.p, v.q) >= 1; } },
      { name: '세 자리 수', vars: blankVars(101, 799),
        where: function (v) { return v.s < 1000 && carries(v.p, v.q) >= 1; } }
    ],
    prompt: function (v) { return { tex: BLANK[v.form].tex(v), text: '□에 알맞은 수를 구하세요.' }; },
    solve: function (v) { return BLANK[v.form].ans(v); },
    /* 검산: 구한 수를 □ 자리에 넣었을 때 식이 성립하는가 */
    verify: function (v, ans) {
      return [ans + v.q === v.s, v.p + ans === v.s, v.s - ans === v.q, ans - v.p === v.q][v.form];
    },
    hints: function (v) {
      var c = BLANK[v.form].calc(v);
      return [
        '덧셈과 뺄셈은 서로 거꾸로예요. 더해서 만든 수는 빼서 되돌리고, 빼서 만든 수는 더해서 되돌려요.',
        BLANK[v.form].why(v),
        c[0] + ' ' + c[1] + ' ' + josa(c[2], '을/를') + ' 계산해 보세요.'
      ];
    },
    steps: function (v) {
      var f = BLANK[v.form], c = f.calc(v), inner = c[1] === '+' ? addSteps(c[0], c[2]) : subSteps(c[0], c[2]);
      var value = inner[inner.length - 1].value;
      return [{ say: f.why(v), tex: f.tex(v) }].concat(inner.slice(0, -1), [
        { say: '□ = ' + value + '. 식에 넣어 확인해요.', tex: f.tex(v).replace('\\square', '\\boxed{' + value + '}'), value: value }
      ]);
    },
    mistakes: [
      { id: 'wrong-way', wrong: function (v) { return BLANK[v.form].other(v); },
        explain: function (v) {
          return v.form === 3
            ? '식에 보이는 두 수를 뺐어요. □에서 빼고 남은 수가 ' + josa(v.q, '이/가') + '니까, □는 두 수를 더해야 나와요.'
            : '식에 보이는 두 수를 더했어요. □를 구하려면 거꾸로 계산해야 해요. 결과에서 아는 수를 빼요.';
        } }
    ]
  });

  /* ── A01.word 문장제 ─────────────────────────────────
     상황(ctx)마다 더하는 상황인지 빼는 상황인지 정해져 있다. p + q = s 로 숫자를 만들어
     더하는 상황은 p, q 를 보여 주고 s 를 묻고, 빼는 상황은 s, p 를 보여 주고 q 를 묻는다. */
  var CONTEXTS = [
    { id: 'pages-add', op: '+', unit: '쪽', text: function (a, b) { return '책을 어제 ' + a + '쪽, 오늘 ' + b + '쪽 읽었어요. 이틀 동안 읽은 쪽수는 모두 몇 쪽일까요?'; } },
    { id: 'steps-add', op: '+', unit: '걸음', text: function (a, b) { return '오전에 ' + a + '걸음, 오후에 ' + b + '걸음을 걸었어요. 오늘 걸은 걸음 수는 모두 몇 걸음일까요?'; } },
    { id: 'points-add', op: '+', unit: '점', text: function (a, b) { return '포인트가 ' + a + '점 있었는데 ' + b + '점을 더 받았어요. 포인트는 모두 몇 점일까요?'; } },
    { id: 'boxes-add', op: '+', unit: '개', text: function (a, b) { return '창고에 상자가 ' + a + '개 있었는데 ' + b + '개가 더 들어왔어요. 상자는 모두 몇 개일까요?'; } },
    { id: 'pages-sub', op: '-', unit: '쪽', text: function (a, b) { return a + '쪽짜리 책을 ' + b + '쪽까지 읽었어요. 남은 쪽수는 몇 쪽일까요?'; } },
    { id: 'points-sub', op: '-', unit: '점', text: function (a, b) { return '포인트 ' + a + '점 가운데 ' + b + '점을 썼어요. 남은 포인트는 몇 점일까요?'; } },
    { id: 'boxes-sub', op: '-', unit: '개', text: function (a, b) { return '창고에 상자가 ' + a + '개 있었는데 ' + b + '개를 내보냈어요. 남은 상자는 몇 개일까요?'; } },
    { id: 'steps-diff', op: '-', unit: '걸음', text: function (a, b) { return '어제는 ' + a + '걸음, 오늘은 ' + b + '걸음을 걸었어요. 어제는 오늘보다 몇 걸음 더 걸었을까요?'; } }
  ];
  /** 문제에 보이는 두 수 [a, b] */
  function shown(v, ctx) { return ctx.op === '+' ? [v.p, v.q] : [v.s, v.p]; }
  MH.defineType({
    id: 'A01.word', unit: 'A01', version: 1, title: '덧셈과 뺄셈 문장제',
    answer: { kind: 'int', suffix: function (v, ctx) { return ctx.unit; } },
    contexts: CONTEXTS,
    levels: [
      { name: '두 자리 수', vars: { p: int(11, 79), q: int(11, 79), s: function (v) { return v.p + v.q; } },
        where: function (v) { return v.s < 100 && carries(v.p, v.q) >= 1; } },
      { name: '세 자리 수', vars: { p: int(101, 799), q: int(101, 799), s: function (v) { return v.p + v.q; } },
        where: function (v) { return v.s < 1000 && carries(v.p, v.q) >= 1; } }
    ],
    prompt: function (v, ctx) { var n = shown(v, ctx); return { text: ctx.text(n[0], n[1]) }; },
    solve: function (v, ctx) { return ctx.op === '+' ? v.s : v.q; },
    verify: function (v, ans, ctx) { var n = shown(v, ctx); return ctx.op === '+' ? ans - n[1] === n[0] : ans + n[1] === n[0]; },
    hints: function (v, ctx) {
      var n = shown(v, ctx);
      return [
        ctx.op === '+' ? '두 양을 합치는 상황이에요. "모두"를 묻고 있어요.' : '한 양에서 다른 양을 덜어 내거나, 두 양의 차이를 구하는 상황이에요.',
        '식으로 쓰면 ' + n[0] + (ctx.op === '+' ? ' + ' : ' − ') + josa(n[1], '이에요/예요') + '.',
        '일의 자리부터 계산하고, 받아올림과 받아내림을 잊지 마세요.'
      ];
    },
    steps: function (v, ctx) {
      var n = shown(v, ctx), inner = ctx.op === '+' ? addSteps(n[0], n[1]) : subSteps(n[0], n[1]);
      var value = inner[inner.length - 1].value;
      return [{ say: (ctx.op === '+' ? '두 양을 합치니까 덧셈이에요.' : '남은 양(또는 차이)을 구하니까 뺄셈이에요.') + ' 식을 세워요.', tex: n[0] + (ctx.op === '+' ? ' + ' : ' - ') + n[1] }]
        .concat(inner.slice(1, -1), [{ say: '답은 ' + value + josa(ctx.unit, '이에요/예요') + '.', tex: inner[inner.length - 1].tex, value: value }]);
    },
    mistakes: [
      { id: 'wrong-operation', wrong: function (v, ctx) { var n = shown(v, ctx); return ctx.op === '+' ? Math.abs(n[0] - n[1]) : n[0] + n[1]; },
        explain: function (v, ctx) {
          return ctx.op === '+'
            ? '두 수를 뺐어요. 이 문제는 두 양을 합쳐 "모두 얼마인지" 묻고 있으니 더해야 해요.'
            : '두 수를 더했어요. 이 문제는 남은 양(또는 차이)을 묻고 있으니 빼야 해요.';
        } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('A01', [
  { title: '자릿값 — 같은 자리끼리 계산해요', body: [
    '수는 자리에 따라 값이 달라요. 584에서 5는 500, 8은 80, 4는 4를 뜻해요.',
    { ex: [['5', '백의 자리. 100이 5개 → 500'], ['8', '십의 자리. 10이 8개 → 80'], ['4', '일의 자리. 1이 4개 → 4']] },
    '덧셈과 뺄셈은 일의 자리는 일의 자리끼리, 십의 자리는 십의 자리끼리 계산해요. 세로로 자리를 맞춰 쓰면 실수가 줄어요.'
  ] },
  { title: '받아올림 — 10이 모이면 윗자리로', body: [
    '한 자리에서 더한 값이 10이거나 10보다 크면, 10을 윗자리의 1로 올려 보내요. 10원짜리 10개를 100원짜리 1개로 바꾸는 것과 같아요.',
    { tex: '\\begin{array}{r} 47 \\\\ +\\,38 \\\\ \\hline 85 \\end{array}' },
    { list: ['① 일의 자리: 7 + 8 = 15. 5만 쓰고 1은 십의 자리로 올려요.', '② 십의 자리: 4 + 3에 올라온 1을 더해 8.', '③ 답은 85.'] }
  ] },
  { title: '받아내림 — 모자라면 윗자리에서 빌려요', body: [
    '위의 수에서 아래 수를 뺄 수 없으면, 윗자리에서 1을 빌려 와 10으로 바꿔 써요.',
    { tex: '\\begin{array}{r} 52 \\\\ -\\,27 \\\\ \\hline 25 \\end{array}' },
    { list: ['① 일의 자리: 2에서 7을 뺄 수 없어요. 십의 자리에서 1을 빌려 12 − 7 = 5.', '② 십의 자리: 5는 하나를 빌려줘서 4가 됐어요. 4 − 2 = 2.', '③ 답은 25.'] }
  ] },
  { title: '덧셈과 뺄셈은 서로 거꾸로', body: [
    '더한 것을 되돌리려면 빼고, 뺀 것을 되돌리려면 더해요.',
    { tex: '25 + 27 = 52 \\quad\\Longleftrightarrow\\quad 52 - 27 = 25' },
    '빈칸 문제는 이 관계로 풀어요. □ + 27 = 52에서 □는 52 − 27이에요.',
    '답이 맞는지 확인할 때도 써요. 52 − 27 = 25가 맞는지 보려면 25 + 27이 52가 되는지 더해 봐요.'
  ] }
]);
