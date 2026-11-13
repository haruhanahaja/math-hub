/* A02 곱셈구구 — 2~9단, 순서 섞어서, 빈칸 찾기
   유형(쉬운 것부터): A02.low 2~5단 · A02.high 6~9단 · A02.blank 빈칸 찾기 · A02.word 문장제
   a 는 단(몇 단인지), b 는 곱하는 수. 곱셈구구는 문제 수가 정해져 있어서 단계마다 minDistinct 를 적는다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa;

  /** a씩 n번 뛰어 센 수들: skip(7, 3) → [7, 14, 21]. 덧셈만 쓴다(풀이가 solve 와 다른 길로 답에 이르도록). */
  function skip(a, n) { var out = [], s = 0; for (var i = 0; i < n; i++) { s += a; out.push(s); } return out; }
  /** input 이 a단(1~9)의 다른 값이면 곱한 수 k 를, 아니면 0 을 돌려준다. */
  function inTable(a, input, not) { for (var k = 1; k <= 9; k++) if (k !== not && skip(a, k)[k - 1] === input) return k; return 0; }

  /* ── 흔한 실수 (a × b 꼴 공통) ────────────────────────
     ① 곱하지 않고 더함  ② 한 번 덜 · 더 뛰어 셈  ③ 같은 단의 다른 값과 헷갈림 */
  var ADDED = { id: 'added', wrong: function (v) { return v.a + v.b; },
    explain: function (v) { return '두 수를 더했어요. ' + v.a + ' × ' + josa(v.b, '은/는') + ' ' + josa(v.a, '을/를') + ' ' + v.b + '번 더한다는 뜻이에요. ' + v.a + ' + ' + v.b + ' 와는 달라요.'; } };
  var ONE_LESS = { id: 'one-less', wrong: function (v) { return v.b >= 2 ? v.a * (v.b - 1) : null; },
    explain: function (v) { return v.a * (v.b - 1) + '은 ' + v.a + ' × ' + (v.b - 1) + ' 이에요. ' + v.a + '씩 한 번 덜 뛰어 셌어요. 거기에 ' + josa(v.a, '을/를') + ' 한 번 더 더해야 ' + v.a + ' × ' + v.b + ' 의 답이 돼요.'; } };
  var ONE_MORE = { id: 'one-more', wrong: function (v) { return v.a * (v.b + 1); },
    explain: function (v) { return v.a * (v.b + 1) + '은 ' + v.a + ' × ' + (v.b + 1) + ' 이에요. ' + v.a + '씩 한 번 더 뛰어 셌어요. ' + v.b + '번만 세야 해요.'; } };
  var SAME_TABLE = { id: 'same-table',
    match: function (v, raw) { var n = MH.kinds.int.parse(raw); return n !== null && !!(inTable(v.a, n, v.b) || inTable(v.b, n, v.a)); },
    explain: function (v, ctx, n) {
      var k = inTable(v.a, n, v.b), a = k ? v.a : v.b;
      k = k || inTable(v.b, n, v.a);
      return josa(n, '은/는') + ' ' + a + ' × ' + k + ' 의 답이에요. ' + a + '단의 다른 값과 헷갈렸어요. ' + v.a + '씩 ' + v.b + '번을 처음부터 다시 뛰어 세어 보세요.';
    } };
  /* 설명의 '49은' 같은 조사를 숫자에 맞게 고친다 */
  [ONE_LESS, ONE_MORE].forEach(function (m) {
    var raw = m.explain;
    m.explain = function (v) { return raw(v).replace(/^(\d+)은/, function (x, d) { return josa(d, '은/는'); }); };
  });

  /* ── 풀이와 힌트 (a × b 꼴 공통) ─────────────────────── */
  function tableSteps(v) {
    var a = v.a, b = v.b, m = v.flip ? b : a, n = v.flip ? a : b, out = [], seq = skip(a, b), value = seq[b - 1];
    if (v.flip) out.push({ say: '곱하는 순서를 바꿔도 답은 같아요. ' + a + '단으로 생각해요.', tex: m + ' \\times ' + n + ' = ' + a + ' \\times ' + b });
    if (b === 1) out.push({ say: '어떤 수에 1을 곱하면 그 수 그대로예요.' });
    else {
      out.push({ say: a + ' × ' + josa(b, '은/는') + ' ' + josa(a, '을/를') + ' ' + b + '번 더한 수예요.', tex: seq.map(function () { return a; }).join(' + ') });
      out.push({ say: a + '씩 ' + b + '번 뛰어 세요: ' + seq.join(', ') + '.' });
    }
    if (b >= 7) out.push({ say: '빨리 세려면 ' + a + ' × 5 = ' + seq[4] + '에서 시작해 ' + josa(a, '을/를') + ' ' + (b - 5) + '번 더 더해요.' });
    out.push({ say: '답은 ' + josa(value, '이에요/예요') + '.', tex: m + ' \\times ' + n + ' = ' + value, value: value });
    return out;
  }
  function tableHints(v) {
    var a = v.a, b = v.b, out = [];
    if (b === 1) return ['어떤 수에 1을 곱하면 그 수 그대로예요.'];
    out.push((v.flip ? '곱하는 순서를 바꿔도 답은 같아요. ' + a + '단으로 생각하면 돼요. ' : '') + a + ' × ' + josa(b, '은/는') + ' ' + josa(a, '을/를') + ' ' + b + '번 더한 수예요.');
    out.push(a + '씩 뛰어 세어 보세요: ' + skip(a, Math.min(3, b - 1)).join(', ') + ', … 이렇게 ' + b + '번째 수까지 가요.');
    out.push(b > 5 ? a + ' × 5 = ' + josa(a * 5, '을/를') + ' 먼저 떠올리고, 거기서 ' + a + '씩 ' + (b - 5) + '번 더 가 보세요.' : '손가락을 하나씩 접으면서 ' + a + '씩 ' + b + '번 더해 보세요.');
    return out;
  }
  function tablePrompt(v) { return { tex: (v.flip ? v.b : v.a) + ' \\times ' + (v.flip ? v.a : v.b), text: '계산하세요.' }; }

  function defineTable(id, title, levels) {
    MH.defineType({
      id: id, unit: 'A02', version: 1, title: title,
      answer: { kind: 'int', common: false },
      levels: levels,
      prompt: tablePrompt,
      solve: function (v) { return v.a * v.b; },
      /* 검산: a씩 b번 뛰어 센 마지막 수와 같은가 (곱셈을 쓰지 않는다) */
      verify: function (v, ans) { return skip(v.a, v.b)[v.b - 1] === ans && skip(v.b, v.a)[v.a - 1] === ans; },
      hints: tableHints,
      steps: tableSteps,
      mistakes: [ADDED, ONE_LESS, ONE_MORE, SAME_TABLE]
    });
  }

  /* ── A02.low 2~5단 ──────────────────────────────────── */
  defineTable('A02.low', '곱셈구구 2~5단', [
    { name: '2단 · 5단', minDistinct: 18, vars: { a: pick([2, 5]), b: int(1, 9), flip: 0 } },
    { name: '3단 · 4단', minDistinct: 18, vars: { a: pick([3, 4]), b: int(1, 9), flip: 0 } },
    { name: '2~5단, 순서 섞어서', minDistinct: 45, vars: { a: int(2, 5), b: int(2, 9), flip: int(0, 1) } }
  ]);

  /* ── A02.high 6~9단 ─────────────────────────────────── */
  defineTable('A02.high', '곱셈구구 6~9단', [
    { name: '6단 · 7단', minDistinct: 18, vars: { a: pick([6, 7]), b: int(1, 9), flip: 0 } },
    { name: '8단 · 9단', minDistinct: 18, vars: { a: pick([8, 9]), b: int(1, 9), flip: 0 } },
    { name: '6~9단, 순서 섞어서', minDistinct: 45, vars: { a: int(6, 9), b: int(2, 9), flip: int(0, 1) } }
  ]);

  /* ── A02.blank 빈칸 찾기 ─────────────────────────────
     a × x = p 에서 x 를 묻는다.  form 0: □ × a = p   form 1: a × □ = p */
  function blankTex(v, fill) {
    var box = fill === undefined ? '\\square' : '\\boxed{' + fill + '}';
    return (v.form === 0 ? box + ' \\times ' + v.a : v.a + ' \\times ' + box) + ' = ' + v.p;
  }
  function blankVars(lo, hi) {
    return { form: int(0, 1), a: int(lo, hi), x: int(2, 9), p: function (v) { return skip(v.a, v.x)[v.x - 1]; } };
  }
  MH.defineType({
    id: 'A02.blank', unit: 'A02', version: 1, title: '곱셈구구 빈칸 찾기',
    answer: { kind: 'int', common: false },
    levels: [
      { name: '2~5단', minDistinct: 60, vars: blankVars(2, 5) },
      { name: '6~9단', minDistinct: 60, vars: blankVars(6, 9) },
      { name: '2~9단 섞어서', minDistinct: 120, vars: blankVars(2, 9) }
    ],
    prompt: function (v) { return { tex: blankTex(v), text: '□에 알맞은 수를 구하세요.' }; },
    solve: function (v) { return v.x; },
    /* 검산: 구한 수를 □ 에 넣으면 식이 성립하는가 */
    verify: function (v, ans) { return ans * v.a === v.p && ans >= 1 && ans <= 9; },
    hints: function (v) {
      return [
        v.a + '단에서 ' + josa(v.p, '이/가') + ' 나오는 곳을 찾는 문제예요. 곱하는 순서는 바뀌어도 답이 같아요.',
        v.a + '씩 뛰어 세면서 ' + josa(v.p, '이/가') + ' 나올 때까지 몇 번 셌는지 세어 보세요.',
        v.p > v.a * 5 ? v.a + ' × 5 = ' + v.a * 5 + ' 예요. ' + josa(v.p, '은/는') + ' 그보다 크니까 □는 5보다 커요.'
          : v.p < v.a * 5 ? v.a + ' × 5 = ' + v.a * 5 + ' 예요. ' + josa(v.p, '은/는') + ' 그보다 작으니까 □는 5보다 작아요.'
            : v.a + '단을 처음부터 차례로 외워 보세요.'
      ];
    },
    steps: function (v) {
      var seq = [], s = 0, k = 0;
      while (s < v.p) { s += v.a; k++; seq.push(s + '(' + k + '번)'); }
      return [
        { say: v.a + '단에서 ' + josa(v.p, '이/가') + ' 나오는 곳을 찾아요. 곱하는 순서는 바뀌어도 답이 같아요.', tex: blankTex(v) },
        { say: v.a + '씩 뛰어 세요: ' + seq.join(', ') + '.' },
        { say: k + '번째에 ' + josa(v.p, '이/가') + ' 나왔으니 □ = ' + k + '. 식에 넣어 확인해요.', tex: blankTex(v, k), value: k }
      ];
    },
    /* ① 식에 보이는 두 수를 곱함 · 뺌  ② 한 칸 옆의 수  ③ 식에 있는 수를 그대로 씀 */
    mistakes: [
      { id: 'multiplied', wrong: function (v) { return v.p * v.a; },
        explain: function (v) { return '식에 보이는 두 수를 곱했어요. ' + josa(v.p, '은/는') + ' 이미 곱한 결과예요. □는 "' + v.a + '에 몇을 곱하면 ' + josa(v.p, '이/가') + ' 되는지"를 묻고 있어요.'; } },
      { id: 'subtracted', wrong: function (v) { return v.p - v.a; },
        explain: function (v) { return v.p + '에서 ' + josa(v.a, '을/를') + ' 뺐어요. 덧셈식이 아니라 곱셈식이에요. ' + v.a + '씩 몇 번 뛰어 세면 ' + josa(v.p, '이/가') + ' 되는지 세어 보세요.'; } },
      { id: 'one-less', wrong: function (v) { return v.x - 1; },
        explain: function (v) { return v.a + ' × ' + (v.x - 1) + ' = ' + josa(v.a * (v.x - 1), '이라서/라서') + ' ' + v.p + '보다 작아요. 한 번 더 뛰어 세어야 해요.'; } },
      { id: 'one-more', wrong: function (v) { return v.x + 1; },
        explain: function (v) { return v.a + ' × ' + (v.x + 1) + ' = ' + josa(v.a * (v.x + 1), '이라서/라서') + ' ' + v.p + '보다 커요. 한 번 덜 뛰어 세어야 해요.'; } },
      { id: 'copied', match: function (v, raw) { var n = MH.kinds.int.parse(raw); return n === v.p || n === v.a; },
        explain: function (v) { return '식에 있는 수를 그대로 썼어요. □에는 ' + v.a + '에 곱해서 ' + josa(v.p, '이/가') + ' 되는 수가 들어가요.'; } }
    ]
  });

  /* ── A02.word 문장제 ─────────────────────────────────
     a개씩 b묶음 → a × b. 같은 수가 여러 묶음 있는 상황만 쓴다. */
  var CONTEXTS = [
    { id: 'tangerines', unit: '개', text: function (a, b) { return '한 봉지에 귤이 ' + a + '개씩 들어 있어요. ' + b + '봉지에 든 귤은 모두 몇 개일까요?'; } },
    { id: 'chairs', unit: '개', text: function (a, b) { return '의자를 한 줄에 ' + a + '개씩 ' + b + '줄로 놓았어요. 의자는 모두 몇 개일까요?'; } },
    { id: 'pages', unit: '쪽', text: function (a, b) { return '하루에 ' + a + '쪽씩 ' + b + '일 동안 책을 읽었어요. 읽은 쪽수는 모두 몇 쪽일까요?'; } },
    { id: 'tables', unit: '명', text: function (a, b) { return '한 탁자에 ' + a + '명씩 앉을 수 있어요. 탁자 ' + b + '개에는 모두 몇 명이 앉을 수 있을까요?'; } },
    { id: 'bottles', unit: '병', text: function (a, b) { return '한 상자에 물이 ' + a + '병씩 들어 있어요. ' + b + '상자에 든 물은 모두 몇 병일까요?'; } },
    { id: 'exercise', unit: '시간', text: function (a, b) { return '일주일에 ' + a + '시간씩 ' + b + '주 동안 운동했어요. 운동한 시간은 모두 몇 시간일까요?'; } }
  ];
  MH.defineType({
    id: 'A02.word', unit: 'A02', version: 1, title: '곱셈구구 문장제',
    answer: { kind: 'int', common: false, suffix: function (v, ctx) { return ctx.unit; } },
    contexts: CONTEXTS,
    levels: [
      { name: '2~5단', minDistinct: 150, vars: { a: int(2, 5), b: int(2, 9) } },
      { name: '6~9단', minDistinct: 150, vars: { a: int(6, 9), b: int(2, 9) } }
    ],
    prompt: function (v, ctx) { return { text: ctx.text(v.a, v.b) }; },
    solve: function (v) { return v.a * v.b; },
    verify: function (v, ans) { return skip(v.a, v.b)[v.b - 1] === ans; },
    hints: function (v) {
      return [
        '같은 수가 여러 묶음 있을 때는 곱셈을 써요.',
        v.a + '씩 ' + v.b + '묶음이니까 식으로 쓰면 ' + v.a + ' × ' + v.b + ' 예요.',
        v.a + '씩 ' + v.b + '번 뛰어 세어 보세요.'
      ];
    },
    steps: function (v, ctx) {
      var inner = tableSteps({ a: v.a, b: v.b, flip: 0 }), value = inner[inner.length - 1].value;
      return [{ say: v.a + ctx.unit + '씩 ' + v.b + '묶음이에요. 같은 수를 여러 번 더하니까 곱셈식을 세워요.', tex: v.a + ' \\times ' + v.b }]
        .concat(inner.slice(0, -1), [{ say: '답은 ' + value + josa(ctx.unit, '이에요/예요') + '.', tex: v.a + ' \\times ' + v.b + ' = ' + value, value: value }]);
    },
    mistakes: [
      { id: 'added', wrong: ADDED.wrong,
        explain: function (v, ctx) { return '두 수를 더했어요. ' + v.a + ctx.unit + '씩 ' + v.b + '묶음은 ' + josa(v.a, '을/를') + ' ' + v.b + '번 더하는 것이라서 ' + v.a + ' × ' + v.b + ' 로 계산해요.'; } },
      ONE_LESS, ONE_MORE, SAME_TABLE
    ]
  });
})();
