/* A04 나눗셈 ① 나누어떨어지는 나눗셈 — 곱셈구구 범위의 나눗셈, 곱셈과 나눗셈의 관계
   유형(쉬운 것부터): A04.low 2~5로 나누기 · A04.high 6~9로 나누기 · A04.relation 곱셈과 나눗셈의 관계 · A04.word 문장제
   a 는 나누는 수, q 는 몫, p = a × q 는 나누어지는 수. 문제 수가 정해져 있어서 단계마다 minDistinct 를 적는다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa;

  /** d씩 뛰어 세어 p 에 이를 때까지 센다. { k(센 횟수), seq(설명용 목록), exact(딱 맞게 끝났는가) } — 나눗셈을 쓰지 않는다. */
  function count(p, d) {
    var s = 0, k = 0, seq = [];
    while (s < p) { s += d; k++; seq.push(s + '(' + k + '번)'); }
    return { k: k, seq: seq, exact: s === p };
  }
  var product = function (v) { return v.a * v.q; };
  function five(d, p) {                                   /* 힌트: d × 5 와 견주어 범위를 좁힌다 */
    return p > d * 5 ? d + ' × 5 = ' + d * 5 + ' 예요. ' + josa(p, '은/는') + ' 그보다 크니까 답은 5보다 커요.'
      : p < d * 5 ? d + ' × 5 = ' + d * 5 + ' 예요. ' + josa(p, '은/는') + ' 그보다 작으니까 답은 5보다 작아요.'
        : d + '단을 처음부터 차례로 외워 보세요.';
  }

  /* ── 흔한 실수 (p ÷ a 꼴 공통) ────────────────────────
     ① 나누지 않고 뺌 · 곱함  ② 몫이 하나 작거나 큼  ③ 식에 있는 수를 그대로 씀 */
  var SUBTRACTED = { id: 'subtracted', wrong: function (v) { return v.p - v.a; },
    explain: function (v) { return v.p + '에서 ' + josa(v.a, '을/를') + ' 한 번만 뺐어요. 나눗셈은 ' + josa(v.a, '을/를') + ' 몇 번 덜어 낼 수 있는지 세는 거예요. 0이 될 때까지 덜어 낸 횟수가 답이에요.'; } };
  var MULTIPLIED = { id: 'multiplied', wrong: function (v) { return v.p * v.a; },
    explain: function (v) { return '두 수를 곱했어요. 기호가 ÷ 인지 확인해 보세요. ' + v.a + '에 몇을 곱하면 ' + josa(v.p, '이/가') + ' 되는지 찾아요.'; } };
  var ONE_LESS = { id: 'one-less', wrong: function (v) { return v.q >= 2 ? v.q - 1 : null; },
    explain: function (v) { return v.a + ' × ' + (v.q - 1) + ' = ' + josa(v.a * (v.q - 1), '이라서/라서') + ' ' + v.p + '보다 작아요. ' + v.a + '씩 한 번 더 뛰어 세어야 해요.'; } };
  var ONE_MORE = { id: 'one-more', wrong: function (v) { return v.q + 1; },
    explain: function (v) { return v.a + ' × ' + (v.q + 1) + ' = ' + josa(v.a * (v.q + 1), '이라서/라서') + ' ' + v.p + '보다 커요. ' + v.a + '씩 한 번 덜 뛰어 세어야 해요.'; } };
  var COPIED = { id: 'copied', match: function (v, raw) { var n = MH.kinds.int.parse(raw); return n === v.p || n === v.a; },
    explain: function (v) { return '식에 있는 수를 그대로 썼어요. 답은 ' + v.a + '에 곱해서 ' + josa(v.p, '이/가') + ' 되는 수예요.'; } };

  function divSteps(v) {
    var c = count(v.p, v.a);
    return [
      { say: v.p + ' ÷ ' + josa(v.a, '은/는') + ' "' + v.a + '에 몇을 곱하면 ' + josa(v.p, '이/가') + ' 되는지"를 찾는 거예요.', tex: v.a + ' \\times \\square = ' + v.p },
      { say: v.a + '씩 뛰어 세요: ' + c.seq.join(', ') + '.' },
      { say: c.k + '번째에 ' + josa(v.p, '이/가') + ' 나왔으니 답은 ' + josa(c.k, '이에요/예요') + '. 곱셈으로 확인해요: ' + v.a + ' × ' + c.k + ' = ' + v.p + '.', tex: v.p + ' \\div ' + v.a + ' = ' + c.k, value: c.k }
    ];
  }
  function defineDiv(id, title, levels) {
    MH.defineType({
      id: id, unit: 'A04', version: 1, title: title,
      answer: { kind: 'int', common: false },
      levels: levels,
      prompt: function (v) { return { tex: v.p + ' \\div ' + v.a, text: '계산하세요.' }; },
      solve: function (v) { return v.q; },
      /* 검산: 답만큼 a 를 뛰어 세면 정확히 p 가 되는가 */
      verify: function (v, ans) { var c = count(v.p, v.a); return c.exact && c.k === ans; },
      hints: function (v) {
        return [
          v.p + ' ÷ ' + josa(v.a, '은/는') + ' "' + v.a + '에 몇을 곱하면 ' + josa(v.p, '이/가') + ' 되는지"를 묻는 것과 같아요.',
          v.a + '단을 외우면서 ' + josa(v.p, '이/가') + ' 나오는 곳을 찾아보세요.',
          five(v.a, v.p)
        ];
      },
      steps: divSteps,
      mistakes: [SUBTRACTED, ONE_LESS, ONE_MORE, MULTIPLIED, COPIED]
    });
  }

  /* ── A04.low 2~5로 나누기 ───────────────────────────── */
  defineDiv('A04.low', '2~5로 나누기', [
    { name: '2 · 5로 나누기', minDistinct: 18, vars: { a: pick([2, 5]), q: int(1, 9), p: product } },
    { name: '3 · 4로 나누기', minDistinct: 18, vars: { a: pick([3, 4]), q: int(1, 9), p: product } },
    { name: '2~5로 나누기 섞어서', minDistinct: 30, vars: { a: int(2, 5), q: int(2, 9), p: product } }
  ]);

  /* ── A04.high 6~9로 나누기 ──────────────────────────── */
  defineDiv('A04.high', '6~9로 나누기', [
    { name: '6 · 7로 나누기', minDistinct: 18, vars: { a: pick([6, 7]), q: int(1, 9), p: product } },
    { name: '8 · 9로 나누기', minDistinct: 18, vars: { a: pick([8, 9]), q: int(1, 9), p: product } },
    { name: '6~9로 나누기 섞어서', minDistinct: 30, vars: { a: int(6, 9), q: int(2, 9), p: product } }
  ]);

  /* ── A04.relation 곱셈과 나눗셈의 관계 ────────────────
     form 0: p ÷ □ = q  (답 a)          form 1: □ ÷ a = q  (답 p)
     form 2: a × q = p 를 보고 p ÷ a = □ (답 q)    form 3: a × q = p 를 보고 p ÷ q = □ (답 a) */
  var REL = [
    { ans: function (v) { return v.a; }, given: function (v) { return v.q; },
      tex: function (v, box) { return v.p + ' \\div ' + box + ' = ' + v.q; }, text: '□에 알맞은 수를 구하세요.' },
    { ans: function (v) { return v.p; }, given: function (v) { return v.a; },
      tex: function (v, box) { return box + ' \\div ' + v.a + ' = ' + v.q; }, text: '□에 알맞은 수를 구하세요.' },
    { ans: function (v) { return v.q; }, given: function (v) { return v.a; },
      tex: function (v, box) { return '\\begin{gathered} ' + v.a + ' \\times ' + v.q + ' = ' + v.p + ' \\\\ ' + v.p + ' \\div ' + v.a + ' = ' + box + ' \\end{gathered}'; }, text: '곱셈식을 보고 나눗셈식의 □를 구하세요.' },
    { ans: function (v) { return v.a; }, given: function (v) { return v.q; },
      tex: function (v, box) { return '\\begin{gathered} ' + v.a + ' \\times ' + v.q + ' = ' + v.p + ' \\\\ ' + v.p + ' \\div ' + v.q + ' = ' + box + ' \\end{gathered}'; }, text: '곱셈식을 보고 나눗셈식의 □를 구하세요.' }
  ];
  function relVars(forms, lo, hi) { return { form: pick(forms), a: int(lo, hi), q: int(2, 9), p: product }; }
  /** 답이 될 수 x 와 식에 주어진 수 g 를 곱해 p 와 견준다(한 칸 옆의 수를 설명할 때) */
  function nearby(v, x) {
    var g = REL[v.form].given(v);
    return g + ' × ' + x + ' = ' + josa(g * x, '이라서/라서') + ' ' + v.p + (g * x < v.p ? '보다 작아요.' : '보다 커요.') + ' ' + g + '단에서 ' + josa(v.p, '이/가') + ' 나오는 곳을 다시 찾아보세요.';
  }
  MH.defineType({
    id: 'A04.relation', unit: 'A04', version: 1, title: '곱셈과 나눗셈의 관계',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '곱셈식을 나눗셈식으로', minDistinct: 110, vars: relVars([2, 3], 2, 9) },
      { name: '나눗셈식의 빈칸 (2~5)', minDistinct: 60, vars: relVars([0, 1], 2, 5) },
      { name: '나눗셈식의 빈칸 (2~9)', minDistinct: 120, vars: relVars([0, 1], 2, 9) }
    ],
    prompt: function (v) { return { tex: REL[v.form].tex(v, '\\square'), text: REL[v.form].text }; },
    solve: function (v) { return REL[v.form].ans(v); },
    /* 검산: 구한 수를 □ 에 넣으면 나눗셈식이 성립하는가(뛰어 세기로 확인) */
    verify: function (v, ans) {
      if (v.form === 1) { var c = count(ans, v.a); return c.exact && c.k === v.q; }
      var d = v.form === 2 ? v.a : v.form === 3 ? v.q : ans, want = v.form === 0 ? v.q : ans, c2 = count(v.p, d);
      return c2.exact && c2.k === want;
    },
    hints: function (v) {
      var g = REL[v.form].given(v);
      if (v.form === 1) return [
        '□ ÷ ' + v.a + ' = ' + v.q + ' 는 "□를 ' + v.a + '씩 묶으면 ' + v.q + '묶음"이라는 뜻이에요.',
        '나눗셈을 거꾸로 하면 곱셈이에요. □는 ' + v.a + ' × ' + v.q + ' 로 구해요.',
        v.a + '씩 ' + v.q + '번 뛰어 세어 보세요.'
      ];
      if (v.form === 0) return [
        v.p + ' ÷ □ = ' + v.q + ' 는 "□ × ' + v.q + ' = ' + v.p + '"와 같은 말이에요.',
        g + '단을 외우면서 ' + josa(v.p, '이/가') + ' 나오는 곳을 찾아보세요.',
        five(g, v.p)
      ];
      return [
        '곱셈식에 나온 세 수가 나눗셈식에도 그대로 나와요.',
        josa(v.p, '을/를') + ' 곱한 두 수 가운데 하나로 나누면 나머지 하나가 나와요.',
        '나눗셈식에서 ' + josa(v.p, '을/를') + ' 나누는 수가 ' + josa(g, '이에요/예요') + '. 곱셈식에서 ' + josa(g, '과/와') + ' 짝이 된 수를 찾아요.'
      ];
    },
    steps: function (v) {
      var f = REL[v.form], g = f.given(v), c;
      if (v.form === 1) {
        var seq = [], s = 0;
        for (var i = 0; i < v.q; i++) { s += v.a; seq.push(s); }
        return [
          { say: '나눗셈을 거꾸로 하면 곱셈이에요. ' + v.a + '씩 ' + v.q + '묶음이면 □가 돼요.', tex: '\\square = ' + v.a + ' \\times ' + v.q },
          { say: v.a + '씩 ' + v.q + '번 뛰어 세요: ' + seq.join(', ') + '.' },
          { say: '□ = ' + s + '. 식에 넣어 확인해요.', tex: f.tex(v, '\\boxed{' + s + '}'), value: s }
        ];
      }
      c = count(v.p, g);
      return [
        { say: v.form === 0 ? v.p + ' ÷ □ = ' + v.q + ' 는 "□ × ' + v.q + ' = ' + v.p + '"와 같은 말이에요.' : '곱셈식과 나눗셈식에는 같은 세 수가 나와요. ' + josa(v.p, '을/를') + ' ' + josa(g, '으로/로') + ' 나누면 ' + josa(g, '과/와') + ' 짝이 된 수가 나와요.', tex: f.tex(v, '\\square') },
        { say: g + '씩 뛰어 세요: ' + c.seq.join(', ') + '.' },
        { say: c.k + '번째에 ' + josa(v.p, '이/가') + ' 나왔으니 □ = ' + c.k + '. 식에 넣어 확인해요.', tex: f.tex(v, '\\boxed{' + c.k + '}'), value: c.k }
      ];
    },
    /* ① 거꾸로 계산함(곱할 것을 나누거나, 나눌 것을 곱함 · 더함 · 뺌)  ② 한 칸 옆의 수  ③ 식에 있는 수를 그대로 씀 */
    mistakes: [
      { id: 'multiplied', wrong: function (v) { return v.form === 0 ? v.p * v.q : null; },
        explain: function (v) { return '식에 보이는 두 수를 곱했어요. ' + josa(v.p, '은/는') + ' 이미 곱한 결과예요. □는 ' + v.q + '에 곱해서 ' + josa(v.p, '이/가') + ' 되는 수예요.'; } },
      { id: 'subtracted', wrong: function (v) { return v.form === 0 ? v.p - v.q : null; },
        explain: function (v) { return v.p + '에서 ' + josa(v.q, '을/를') + ' 뺐어요. 뺄셈식이 아니라 나눗셈식이에요. ' + v.q + '에 몇을 곱하면 ' + josa(v.p, '이/가') + ' 되는지 찾아요.'; } },
      { id: 'divided', wrong: function (v) { return v.form !== 1 ? null : v.a % v.q === 0 ? v.a / v.q : v.q % v.a === 0 ? v.q / v.a : null; },
        explain: function (v) { return '식에 보이는 두 수를 나눴어요. □는 나누어지는 수라서 두 수보다 커요. ' + v.a + ' × ' + v.q + ' 로 구해요.'; } },
      { id: 'added', wrong: function (v) { return v.form === 1 ? v.a + v.q : null; },
        explain: function (v) { return '식에 보이는 두 수를 더했어요. 나눗셈을 거꾸로 하면 덧셈이 아니라 곱셈이에요. ' + v.a + ' × ' + v.q + ' 로 구해요.'; } },
      { id: 'one-less', wrong: function (v) { return v.form === 1 ? v.a * (v.q - 1) : REL[v.form].ans(v) - 1; },
        explain: function (v) { return v.form === 1 ? v.a + ' × ' + (v.q - 1) + ' = ' + v.a * (v.q - 1) + ' 이에요. ' + v.a + '씩 한 번 덜 뛰어 셌어요. ' + v.q + '번을 세어야 해요.' : nearby(v, REL[v.form].ans(v) - 1); } },
      { id: 'one-more', wrong: function (v) { return v.form === 1 ? v.a * (v.q + 1) : REL[v.form].ans(v) + 1; },
        explain: function (v) { return v.form === 1 ? v.a + ' × ' + (v.q + 1) + ' = ' + v.a * (v.q + 1) + ' 이에요. ' + v.a + '씩 한 번 더 뛰어 셌어요. ' + v.q + '번만 세어야 해요.' : nearby(v, REL[v.form].ans(v) + 1); } },
      { id: 'copied', match: function (v, raw) { var n = MH.kinds.int.parse(raw); return n === v.p || n === v.a || n === v.q; },
        explain: function (v) {
          return v.form >= 2 ? '식에 있는 다른 수를 썼어요. ' + josa(v.p, '을/를') + ' ' + josa(REL[v.form].given(v), '으로/로') + ' 나누면, 곱셈식에서 그 수와 짝이 된 나머지 수가 나와요.'
            : '식에 있는 수를 그대로 썼어요. □에 넣었을 때 식이 맞는지 확인해 보세요.';
        } }
    ]
  });

  /* ── A04.word 문장제 ─────────────────────────────────
     똑같이 나누기(한 묶음의 크기를 묻는다)와 묶어 세기(묶음의 수를 묻는다) 두 가지 상황. 문제에는 p, a 순서로 나온다. */
  var CONTEXTS = [
    { id: 'share-fruit', kind: 'share', unit: '개', text: function (p, a) { return '귤 ' + p + '개를 ' + a + '명이 똑같이 나눠 가지려고 해요. 한 명이 몇 개씩 가질 수 있을까요?'; } },
    { id: 'share-pages', kind: 'share', unit: '쪽', text: function (p, a) { return p + '쪽짜리 책을 ' + a + '일 동안 매일 같은 쪽수씩 읽으려고 해요. 하루에 몇 쪽씩 읽어야 할까요?'; } },
    { id: 'share-bottles', kind: 'share', unit: '병', text: function (p, a) { return '물 ' + p + '병을 상자 ' + a + '개에 똑같이 나눠 담았어요. 한 상자에 몇 병씩 담았을까요?'; } },
    { id: 'group-bags', kind: 'group', unit: '개', text: function (p, a) { return '귤 ' + p + '개를 한 봉지에 ' + a + '개씩 담으려고 해요. 봉지는 몇 개 필요할까요?'; } },
    { id: 'group-tables', kind: 'group', unit: '개', text: function (p, a) { return p + '명이 한 탁자에 ' + a + '명씩 앉으려고 해요. 탁자는 몇 개 필요할까요?'; } },
    { id: 'group-days', kind: 'group', unit: '일', text: function (p, a) { return p + '쪽짜리 책을 하루에 ' + a + '쪽씩 읽으면 며칠 만에 다 읽을까요?'; } }
  ];
  MH.defineType({
    id: 'A04.word', unit: 'A04', version: 1, title: '나눗셈 문장제',
    answer: { kind: 'int', common: false, suffix: function (v, ctx) { return ctx.unit; } },
    contexts: CONTEXTS,
    levels: [
      { name: '2~5로 나누기', minDistinct: 150, vars: { a: int(2, 5), q: int(2, 9), p: product } },
      { name: '6~9로 나누기', minDistinct: 150, vars: { a: int(6, 9), q: int(2, 9), p: product } }
    ],
    prompt: function (v, ctx) { return { text: ctx.text(v.p, v.a) }; },
    solve: function (v) { return v.q; },
    verify: function (v, ans) { var c = count(v.p, v.a); return c.exact && c.k === ans; },
    hints: function (v, ctx) {
      return [
        ctx.kind === 'share' ? '전체를 똑같이 나누는 상황이에요. 나눗셈을 써요.' : '전체를 같은 수씩 묶는 상황이에요. 묶음이 몇 개인지는 나눗셈으로 구해요.',
        '식으로 쓰면 ' + v.p + ' ÷ ' + v.a + ' 예요.',
        v.a + '단을 외우면서 ' + josa(v.p, '이/가') + ' 나오는 곳을 찾아보세요.'
      ];
    },
    steps: function (v, ctx) {
      var inner = divSteps(v), last = inner[inner.length - 1];
      return [{ say: (ctx.kind === 'share' ? josa(v.p, '을/를') + ' ' + v.a + '곳에 똑같이 나누니까' : josa(v.p, '을/를') + ' ' + v.a + '씩 묶으니까') + ' 나눗셈식을 세워요.', tex: v.p + ' \\div ' + v.a }]
        .concat(inner.slice(0, -1), [{ say: last.value + '번째에 ' + josa(v.p, '이/가') + ' 나왔어요. 답은 ' + last.value + josa(ctx.unit, '이에요/예요') + '.', tex: last.tex, value: last.value }]);
    },
    mistakes: [
      { id: 'multiplied', wrong: MULTIPLIED.wrong,
        explain: function (v, ctx) { return '두 수를 곱했어요. ' + (ctx.kind === 'share' ? '똑같이 나누는' : '같은 수씩 묶는') + ' 상황이니까 ' + v.p + ' ÷ ' + v.a + ' 로 계산해요. 답은 ' + v.p + '보다 작아야 해요.'; } },
      SUBTRACTED, ONE_LESS, ONE_MORE, COPIED
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('A04', [
  { title: '나눗셈의 두 가지 뜻', body: [
    { tex: '12 \\div 3 = 4' },
    { ex: [['똑같이 나누기', '사탕 12개를 3명이 똑같이 나누면 한 사람에 4개'], ['묶어서 덜기', '사탕 12개를 3개씩 묶으면 4묶음']] },
    '두 경우 모두 식은 12 ÷ 3 = 4예요. 12는 나누어지는 수, 3은 나누는 수, 답 4는 몫이라고 해요.'
  ] },
  { title: '나눗셈은 곱셈을 거꾸로 한 것', body: [
    { tex: '\\begin{aligned} 3 \\times 4 = 12 \;&\\Longleftrightarrow\; 12 \\div 3 = 4 \\\\ &\\Longleftrightarrow\; 12 \\div 4 = 3 \\end{aligned}' },
    '그래서 나눗셈은 곱셈구구로 풀어요. 35 ÷ 7은 "7에 얼마를 곱하면 35가 될까?"를 찾는 것이에요. 7 × 5 = 35이니까 몫은 5예요.'
  ] },
  { title: '빈칸 찾기', body: [
    { tex: '15 \\div \\square = 5' },
    '15를 어떤 수로 나누었더니 5가 됐다는 뜻이에요. 곱셈으로 바꿔 생각하면 □ × 5 = 15이고, 3 × 5 = 15이니까 □는 3이에요.',
    '나눗셈이 막히면 언제든 곱셈식으로 바꿔 보세요.'
  ] }
]);
