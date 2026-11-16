/* A08 분수의 뜻 — 전체와 부분, 수직선, 나눗셈의 몫으로서의 분수, 진분수·가분수·대분수 바꾸기
   유형(쉬운 것부터): A08.part 전체와 부분 · A08.line 수직선 위의 분수 · A08.quotient 나눗셈의 몫
                     · A08.to-mixed 가분수를 대분수로 · A08.to-improper 대분수를 가분수로
   답은 { n: 분자, d: 분모 }. 약분은 다음 단원(A09)에서 배우므로 여기서는 약분 안내를 끈다(reduce: 'off'). */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa, F = MH.F;

  var fr = function (n, d) { return { n: n, d: d }; };
  var tex = function (n, d) { return '\\dfrac{' + n + '}{' + d + '}'; };
  /** 글로 읽는 분수: 4분의 3. 조사는 마지막에 읽는 분자에 맞춘다. */
  var read = function (n, d) { return d + '분의 ' + n; };
  var readJ = function (n, d, pair) { return d + '분의 ' + josa(n, pair); };
  /** 조건이 맞을 때만 오답 값을 만든다 */
  var when = function (test, make) { return function (v) { return test(v) ? make(v) : null; }; };
  var below = function (v) { return int(1, v.d - 1); };

  /* ── A08.part 전체와 부분 ─────────────────────────────
     form 0: 띠 그림에서 색칠한 부분 · form 1: 쓰고 남은 부분(글) · form 2: 띠 여러 개(띠 하나가 1) */
  var REST = [
    { text: function (d, n) { return '피자 한 판을 똑같이 ' + d + '조각으로 나눠 ' + n + '조각을 먹었어요. 남은 피자는 전체의 얼마일까요?'; }, piece: '조각', used: '먹은' },
    { text: function (d, n) { return '밭을 똑같이 ' + d + '칸으로 나눠 ' + n + '칸에 상추를 심었어요. 아무것도 심지 않은 부분은 전체의 얼마일까요?'; }, piece: '칸', used: '상추를 심은' },
    { text: function (d, n) { return '끈을 똑같이 ' + d + '도막으로 잘라 ' + n + '도막을 썼어요. 남은 끈은 전체의 얼마일까요?'; }, piece: '도막', used: '쓴' }
  ];
  var bars = function (v) { var k = 1; while (k * v.d < v.n) k++; return k; };
  MH.defineType({
    id: 'A08.part', unit: 'A08', version: 1, title: '전체와 부분',
    answer: { kind: 'fraction', reduce: 'off', common: false },
    levels: [
      { name: '색칠한 부분', minDistinct: 45, vars: { form: 0, s: 0, d: int(2, 10), n: below } },
      { name: '남은 부분', minDistinct: 150, vars: { form: 1, s: pick([0, 1, 2]), d: int(3, 12), n: below } },
      { name: '1보다 큰 분수', minDistinct: 50, vars: { form: 2, s: 0, d: int(2, 8), n: function (v) { return int(v.d + 1, 3 * v.d - 1); } }, where: function (v) { return v.n % v.d !== 0; } }
    ],
    prompt: function (v) {
      if (v.form === 1) return { text: REST[v.s].text(v.d, v.n) };
      return { text: v.form === 0 ? '띠를 똑같이 ' + v.d + '칸으로 나누고 ' + v.n + '칸을 색칠했어요. 색칠한 부분은 전체의 얼마일까요?'
        : '띠 하나가 1이에요. 띠 하나를 똑같이 ' + v.d + '칸으로 나누고 모두 ' + v.n + '칸을 색칠했어요. 색칠한 부분을 분수로 나타내세요.', figure: { type: 'bar', parts: v.d, filled: v.n } };
    },
    solve: function (v) { return fr(v.form === 1 ? v.d - v.n : v.n, v.d); },
    /* 검산: 답에 나머지 부분을 더하면 전체(1, 띠 여러 개면 띠의 수)가 되는가 */
    verify: function (v, ans) {
      var total = v.form === 2 ? bars(v) : 1, other = v.form === 1 ? v.n : total * v.d - v.n;
      return ans.d === v.d && F(ans.n, ans.d).add(F(other, v.d)).equals(total);
    },
    hints: function (v) {
      if (v.form === 1) return [
        '분모(아래)는 전체를 똑같이 나눈 수, 분자(위)는 그 가운데 묻는 부분의 수예요.',
        '전체는 ' + v.d + REST[v.s].piece + '이에요. 묻는 것은 ' + REST[v.s].used + ' 부분이 아니라 남은 부분이에요.',
        '남은 것은 ' + v.d + ' − ' + v.n + REST[v.s].piece + '이에요.'
      ];
      if (v.form === 2) return [
        '띠 하나가 1이니까, 분모(아래)는 띠 하나를 나눈 칸 수예요.',
        '한 칸은 ' + readJ(1, v.d, '이에요/예요') + '. 색칠한 칸이 몇 개인지 세어 보세요.',
        '색칠한 칸 수가 분자(위)예요. 띠 하나보다 많이 색칠했으니 분자가 분모보다 커요.'
      ];
      return [
        '분모(아래)는 전체를 똑같이 나눈 칸 수예요.',
        '분자(위)는 그 가운데 색칠한 칸 수예요.',
        '전체가 ' + v.d + '칸이니까 분모는 ' + josa(v.d, '이에요/예요') + '.'
      ];
    },
    steps: function (v) {
      if (v.form === 1) {
        var left = v.d - v.n, c = REST[v.s];
        return [
          { say: '전체를 똑같이 ' + v.d + c.piece + '으로 나눴으니 분모는 ' + josa(v.d, '이에요/예요') + '.' },
          { say: '남은 것은 ' + v.d + ' − ' + v.n + ' = ' + left + c.piece + '이에요. 이것이 분자예요.' },
          { say: '남은 부분은 전체의 ' + readJ(left, v.d, '이에요/예요') + '.', tex: tex(left, v.d), value: fr(left, v.d) }
        ];
      }
      if (v.form === 2) return [
        { say: '띠 하나가 1이고 똑같이 ' + v.d + '칸이니까, 한 칸은 ' + readJ(1, v.d, '이에요/예요') + '. 분모는 ' + josa(v.d, '이에요/예요') + '.' },
        { say: '색칠한 칸은 모두 ' + v.n + '칸이에요. 이것이 분자예요.' },
        { say: '색칠한 부분은 ' + readJ(v.n, v.d, '이에요/예요') + '. 분자가 분모보다 크니까 1보다 큰 분수(가분수)예요.', tex: tex(v.n, v.d), value: fr(v.n, v.d) }
      ];
      return [
        { say: '전체를 똑같이 ' + v.d + '칸으로 나눴으니 분모는 ' + josa(v.d, '이에요/예요') + '.' },
        { say: '색칠한 칸은 ' + v.n + '칸이니 분자는 ' + josa(v.n, '이에요/예요') + '.' },
        { say: '색칠한 부분은 전체의 ' + readJ(v.n, v.d, '이에요/예요') + '.', tex: tex(v.n, v.d), value: fr(v.n, v.d) }
      ];
    },
    /* ① 분자와 분모를 바꿈 ② 분모에 나머지 부분의 수를 씀 ③ 반대쪽 부분을 답함 ④ (띠 여러 개) 분모에 전체 칸 수를 씀 */
    mistakes: [
      { id: 'swapped', wrong: function (v) { return fr(v.d, v.form === 1 ? v.d - v.n : v.n); },
        explain: function (v) { return '분자와 분모를 바꿔 썼어요. 분모(아래)가 전체를 나눈 수 ' + v.d + ', 분자(위)가 묻는 부분의 수예요.'; } },
      { id: 'part-over-rest', wrong: when(function (v) { return v.form < 2; }, function (v) { return v.form === 0 ? fr(v.n, v.d - v.n) : fr(v.d - v.n, v.n); }),
        explain: function (v) { return '분모에 나머지 부분의 수를 썼어요. 분모는 나머지가 아니라 전체를 나눈 수 ' + josa(v.d, '이에요/예요') + '.'; } },
      { id: 'other-part', wrong: when(function (v) { return v.form < 2; }, function (v) { return v.form === 0 ? fr(v.d - v.n, v.d) : fr(v.n, v.d); }),
        explain: function (v) { return v.form === 0 ? '색칠하지 않은 부분을 답했어요. 묻는 것은 색칠한 ' + v.n + '칸이에요.' : REST[v.s].used + ' 부분을 답했어요. 묻는 것은 남은 부분이에요: ' + v.d + ' − ' + v.n + ' = ' + (v.d - v.n) + '.'; } },
      { id: 'all-cells', wrong: when(function (v) { return v.form === 2; }, function (v) { return fr(v.n, bars(v) * v.d); }),
        explain: function (v) { return '분모에 띠 ' + bars(v) + '개의 칸 수를 모두 썼어요. 띠 하나가 1이므로 분모는 띠 하나의 칸 수 ' + josa(v.d, '이에요/예요') + '.'; } }
    ]
  });

  /* ── A08.line 수직선 위의 분수 ────────────────────────
     0 부터 max 까지의 수직선. 1 을 똑같이 d 칸으로 나누고, 0 에서 k 번째 눈금에 □ 가 있다. */
  MH.defineType({
    id: 'A08.line', unit: 'A08', version: 1, title: '수직선 위의 분수',
    answer: { kind: 'fraction', reduce: 'off' },
    levels: [
      { name: '0과 1 사이', minDistinct: 45, vars: { max: 1, d: int(2, 10), k: below } },
      { name: '1보다 큰 수', minDistinct: 40, vars: { max: pick([2, 3]), d: int(2, 6), k: function (v) { return int(v.d + 1, v.max * v.d - 1); } }, where: function (v) { return v.k % v.d !== 0; } }
    ],
    prompt: function (v) {
      return { text: '수직선에서 □가 가리키는 수를 분수로 나타내세요.' + (v.max > 1 ? ' (분자가 분모보다 큰 가분수로 써요.)' : ''), figure: { type: 'line', max: v.max, parts: v.d, mark: v.k } };
    },
    solve: function (v) { return fr(v.k, v.d); },
    /* 검산: 답을 d 번 더하면(= d 배 하면) 0 에서 k 칸 간 것과 같은가 */
    verify: function (v, ans) { return F(ans.n, ans.d).mul(v.d).equals(v.k); },
    hints: function (v) {
      return [
        '0과 1 사이가 똑같이 몇 칸으로 나뉘었는지 세어 보세요. 눈금(선)이 아니라 칸을 세요.',
        '0과 1 사이가 ' + v.d + '칸이니까 한 칸은 ' + readJ(1, v.d, '이에요/예요') + '.',
        '□는 0에서 오른쪽으로 몇 칸 간 곳인지 세어 보세요. 그 수가 분자예요.'
      ];
    },
    steps: function (v) {
      return [
        { say: '0과 1 사이가 똑같이 ' + v.d + '칸이에요. 한 칸은 ' + readJ(1, v.d, '이에요/예요') + '. 분모는 ' + josa(v.d, '이에요/예요') + '.' },
        { say: '□는 0에서 오른쪽으로 ' + v.k + '칸 간 곳이에요. 분자는 ' + josa(v.k, '이에요/예요') + '.' },
        { say: '□가 가리키는 수는 ' + readJ(v.k, v.d, '이에요/예요') + '.' + (v.k > v.d ? ' 1보다 오른쪽에 있으니 분자가 분모보다 커요.' : ''), tex: tex(v.k, v.d), value: fr(v.k, v.d) }
      ];
    },
    /* ① 0 의 눈금부터 셈 ② 분모에 사이의 눈금 수를 씀 ③ 분모에 수직선 전체 칸 수를 씀 ④ 1 을 넘은 뒤의 칸만 셈 */
    mistakes: [
      { id: 'counted-lines', wrong: function (v) { return fr(v.k + 1, v.d); },
        explain: function (v) { return '0의 눈금까지 하나로 셌어요. 눈금이 아니라 0에서 몇 칸 갔는지를 세요. □는 ' + v.k + '칸 간 곳이에요.'; } },
      { id: 'ticks-between', wrong: function (v) { return fr(v.k, v.d - 1); },
        explain: function (v) { return '분모에 0과 1 사이의 눈금 수를 썼어요. 분모는 눈금 수가 아니라 칸 수예요. 0과 1 사이는 ' + v.d + '칸이에요.'; } },
      { id: 'whole-line', wrong: when(function (v) { return v.max > 1; }, function (v) { return fr(v.k, v.max * v.d); }),
        explain: function (v) { return '분모에 수직선 전체의 칸 수를 썼어요. 분모는 1을 나눈 칸 수예요. 0과 1 사이는 ' + v.d + '칸이에요.'; } },
      { id: 'after-one', wrong: when(function (v) { return v.max > 1; }, function (v) { return fr(v.k % v.d, v.d); }),
        explain: function (v) { return '자연수를 지난 뒤의 칸만 셌어요. 0에서부터 모두 세면 ' + v.k + '칸이에요.'; } }
    ]
  });

  /* ── A08.quotient 나눗셈의 몫으로서의 분수 ─────────────
     a ÷ b = a/b. s 가 0 이면 식, 1 이상이면 이야기(STORY[s − 1]). */
  var STORY = [
    { unit: '판', text: function (a, b) { return '피자 ' + a + '판을 ' + b + '명이 똑같이 나눠 먹어요. 한 사람이 먹는 양은 몇 판일까요?'; } },
    { unit: 'L', text: function (a, b) { return '주스 ' + a + ' L를 컵 ' + b + '개에 똑같이 나눠 담아요. 컵 하나에 담기는 주스는 몇 L일까요?'; } },
    { unit: 'm', text: function (a, b) { return '리본 ' + a + ' m를 똑같이 ' + b + '도막으로 잘라요. 한 도막의 길이는 몇 m일까요?'; } }
  ];
  var notMultiple = function (v) { return v.a % v.b !== 0; };
  var bigger = function (v) { return v.a > v.b; };
  MH.defineType({
    id: 'A08.quotient', unit: 'A08', version: 1, title: '나눗셈의 몫을 분수로',
    answer: { kind: 'fraction', reduce: 'off', common: false, suffix: function (v) { return v.s ? STORY[v.s - 1].unit : ''; } },
    levels: [
      { name: '몫이 1보다 작을 때', minDistinct: 36, vars: { s: 0, b: int(2, 9), a: function (v) { return int(1, v.b - 1); } } },
      { name: '몫이 1보다 클 때', minDistinct: 72, vars: { s: 0, b: int(2, 9), a: function (v) { return int(v.b + 1, 3 * v.b); } }, where: notMultiple },
      { name: '이야기 문제', vars: { s: pick([1, 2, 3]), b: int(2, 9), a: function (v) { return int(1, 3 * v.b); } }, where: notMultiple }
    ],
    prompt: function (v) { return v.s ? { text: STORY[v.s - 1].text(v.a, v.b) + ' (분수로 써요.)' } : { tex: v.a + ' \\div ' + v.b, text: '몫을 분수로 나타내세요.' }; },
    solve: function (v) { return fr(v.a, v.b); },
    /* 검산: 몫에 나누는 수를 곱하면 나누어지는 수가 되는가 */
    verify: function (v, ans) { return F(ans.n, ans.d).mul(v.b).equals(v.a); },
    hints: function (v) {
      return [
        (v.s ? '식으로 쓰면 ' + v.a + ' ÷ ' + v.b + ' 예요. ' : '') + '1 ÷ ' + josa(v.b, '은/는') + ' 1을 똑같이 ' + josa(v.b, '으로/로') + ' 나눈 것 가운데 하나, 곧 ' + readJ(1, v.b, '이에요/예요') + '.',
        v.a + ' ÷ ' + josa(v.b, '은/는') + ' 그것이 ' + v.a + '개 있는 것과 같아요.',
        '나누어지는 수가 분자(위), 나누는 수가 분모(아래)가 돼요.'
      ];
    },
    steps: function (v) {
      var unit = v.s ? STORY[v.s - 1].unit : '';
      return (v.s ? [{ say: '똑같이 나누는 상황이니까 나눗셈식을 세워요.', tex: v.a + ' \\div ' + v.b }] : []).concat([
        { say: '1 ÷ ' + josa(v.b, '은/는') + ' 1을 똑같이 ' + josa(v.b, '으로/로') + ' 나눈 것 가운데 하나예요.', tex: '1 \\div ' + v.b + ' = ' + tex(1, v.b) },
        { say: v.a + ' ÷ ' + josa(v.b, '은/는') + ' ' + readJ(1, v.b, '이/가') + ' ' + v.a + '개 있는 것과 같아요. 나누어지는 수가 분자, 나누는 수가 분모가 돼요.' + (unit ? ' 답은 ' + read(v.a, v.b) + josa(unit, '이에요/예요') + '.' : ''), tex: v.a + ' \\div ' + v.b + ' = ' + tex(v.a, v.b), value: fr(v.a, v.b) }
      ]);
    },
    /* ① 분자와 분모를 바꿈 ② 자연수 몫만 씀 ③ 나머지만 분수로 씀 ④ 두 수의 차를 답함 */
    mistakes: [
      { id: 'swapped', wrong: function (v) { return fr(v.b, v.a); },
        explain: function (v) { return '분자와 분모를 바꿔 썼어요. ' + v.a + ' ÷ ' + v.b + ' 에서 나누어지는 수 ' + josa(v.a, '이/가') + ' 분자(위), 나누는 수 ' + josa(v.b, '이/가') + ' 분모(아래)예요.'; } },
      { id: 'whole-only', wrong: when(bigger, function (v) { return fr((v.a - v.a % v.b) / v.b, 1); }),
        explain: function (v) { return '자연수 몫만 썼어요. 나누고 남은 ' + v.a % v.b + '도 ' + josa(v.b, '으로/로') + ' 똑같이 나눠야 해요. 분수로는 나누어지는 수 ' + josa(v.a, '을/를') + ' 분자로, 나누는 수 ' + josa(v.b, '을/를') + ' 분모로 써요.'; } },
      { id: 'remainder-only', wrong: when(bigger, function (v) { return fr(v.a % v.b, v.b); }),
        explain: function (v) { return '나머지 ' + v.a % v.b + '만 분수로 썼어요. 자연수 몫을 빠뜨렸어요. 분자는 나누어지는 수 ' + v.a + ' 전체예요.'; } },
      { id: 'difference', wrong: function (v) { return fr(v.a > v.b ? v.a - v.b : v.b - v.a, 1); },
        explain: function (v) { return '두 수의 차를 답했어요. 똑같이 나누는 것은 뺄셈이 아니라 나눗셈이에요. 몫은 ' + readJ(v.a, v.b, '이에요/예요') + '.'; } }
    ]
  });

  /* ── 가분수 ↔ 대분수 (n = w × d + r) ─────────────────── */
  var mixedLevels = [
    { name: '분모가 2~5', minDistinct: 30, vars: { d: int(2, 5), w: int(1, 3), r: below, n: function (v) { return v.w * v.d + v.r; } } },
    { name: '분모가 2~12', vars: { d: int(2, 12), w: int(1, 9), r: below, n: function (v) { return v.w * v.d + v.r; } } }
  ];
  var mixedTex = function (v) { return v.w + tex(v.r, v.d); };

  /* ── A08.to-mixed 가분수를 대분수로 ─────────────────── */
  MH.defineType({
    id: 'A08.to-mixed', unit: 'A08', version: 1, title: '가분수를 대분수로',
    answer: { kind: 'fraction', form: 'mixed', reduce: 'off', common: false },
    levels: mixedLevels,
    prompt: function (v) { return { tex: tex(v.n, v.d), text: '대분수로 나타내세요.' }; },
    solve: function (v) { return fr(v.n, v.d); },
    /* 검산: 답에서 자연수 부분을 빼면 진분수 r/d 가 남는가 */
    verify: function (v, ans) { return v.r < v.d && F(ans.n, ans.d).sub(v.w).equals(F(v.r, v.d)); },
    hints: function (v) {
      return [
        readJ(v.d, v.d, '은/는') + ' 1이에요. 분자 ' + v.n + ' 안에 분모 ' + josa(v.d, '이/가') + ' 몇 번 들어가는지 생각해 보세요.',
        v.n + ' ÷ ' + v.d + ' 의 몫과 나머지를 구해 보세요.',
        '몫이 자연수 부분, 나머지가 분자가 돼요. 분모는 바뀌지 않아요.'
      ];
    },
    steps: function (v) {
      return [
        { say: readJ(v.d, v.d, '이/가') + ' 1이에요. ' + v.n + ' 안에 ' + josa(v.d, '이/가') + ' 몇 번 들어가는지 나눗셈으로 알아봐요.', tex: v.n + ' \\div ' + v.d + ' = ' + v.w + ' \\cdots ' + v.r },
        { say: '몫 ' + josa(v.w, '이/가') + ' 자연수 부분, 나머지 ' + josa(v.r, '이/가') + ' 분자가 돼요. 분모는 그대로 ' + josa(v.d, '이에요/예요') + '.', tex: tex(v.n, v.d) + ' = ' + mixedTex(v), value: fr(v.n, v.d) }
      ];
    },
    /* ① 분자를 그대로 둠 ② 몫과 나머지의 자리를 바꿈 ③ 자연수만 씀 */
    mistakes: [
      { id: 'kept-numerator', wrong: function (v) { return fr(v.w * v.d + v.n, v.d); },
        explain: function (v) { return '자연수 ' + josa(v.w, '을/를') + ' 덜어 냈는데 분자를 그대로 뒀어요. 덜어 낸 만큼 분자에서 빼야 해요: ' + v.n + ' − ' + v.d + ' × ' + v.w + ' = ' + v.r + '.'; } },
      { id: 'swapped-parts', wrong: function (v) { return fr(v.r * v.d + v.w, v.d); },
        explain: function (v) { return '몫과 나머지의 자리를 바꿨어요. ' + v.n + ' ÷ ' + v.d + ' 의 몫 ' + josa(v.w, '이/가') + ' 자연수 부분, 나머지 ' + josa(v.r, '이/가') + ' 분자예요.'; } },
      { id: 'whole-only', wrong: function (v) { return fr(v.w, 1); },
        explain: function (v) { return '자연수 부분만 썼어요. ' + v.n + ' ÷ ' + v.d + ' 의 나머지 ' + josa(v.r, '을/를') + ' 분자로 하는 분수가 더 있어요.'; } }
    ]
  });

  /* ── A08.to-improper 대분수를 가분수로 ───────────────── */
  MH.defineType({
    id: 'A08.to-improper', unit: 'A08', version: 1, title: '대분수를 가분수로',
    answer: { kind: 'fraction', form: 'improper', reduce: 'off', common: false },
    levels: mixedLevels,
    prompt: function (v) { return { tex: mixedTex(v), text: '가분수로 나타내세요.' }; },
    solve: function (v) { return fr(v.n, v.d); },
    /* 검산: 답에서 분수 부분 r/d 를 빼면 자연수 w 가 남는가 */
    verify: function (v, ans) { return ans.d === v.d && F(ans.n, ans.d).sub(F(v.r, v.d)).equals(v.w); },
    hints: function (v) {
      return [
        '1은 ' + readJ(v.d, v.d, '과/와') + ' 같아요. 자연수 ' + josa(v.w, '을/를') + ' 분모가 ' + v.d + '인 분수로 바꿔 보세요.',
        '자연수 ' + josa(v.w, '은/는') + ' ' + v.d + '분의 (' + v.w + ' × ' + v.d + ')예요.',
        '거기에 원래 분자 ' + josa(v.r, '을/를') + ' 더하면 가분수의 분자예요. 분모는 바뀌지 않아요.'
      ];
    },
    steps: function (v) {
      return [
        { say: '1은 ' + readJ(v.d, v.d, '과/와') + ' 같으니까, 자연수 ' + josa(v.w, '은/는') + ' ' + readJ(v.w * v.d, v.d, '이에요/예요') + ' (' + v.w + ' × ' + v.d + ' = ' + v.w * v.d + ').', tex: v.w + ' = ' + tex(v.w * v.d, v.d) },
        { say: '여기에 ' + readJ(v.r, v.d, '을/를') + ' 더해요. 분자는 ' + v.w * v.d + ' + ' + v.r + ' = ' + v.n + ', 분모는 그대로 ' + josa(v.d, '이에요/예요') + '.', tex: mixedTex(v) + ' = ' + tex(v.n, v.d), value: fr(v.n, v.d) }
      ];
    },
    /* ① 자연수와 분자를 이어 씀 ② 자연수와 분자를 더함 ③ 분자를 안 더함 ④ 자연수와 분자를 곱함 */
    mistakes: [
      { id: 'concatenated', wrong: when(function (v) { return v.r <= 9; }, function (v) { return fr(v.w * 10 + v.r, v.d); }),
        explain: function (v) { return '자연수와 분자를 그냥 이어 썼어요. 자연수 ' + josa(v.w, '은/는') + ' ' + v.d + '분의 ' + v.w * v.d + '이므로 분자는 ' + v.w + ' × ' + v.d + ' + ' + v.r + ' = ' + josa(v.n, '이에요/예요') + '.'; } },
      { id: 'added', wrong: function (v) { return fr(v.w + v.r, v.d); },
        explain: function (v) { return '자연수와 분자를 더했어요. 자연수 ' + josa(v.w, '은/는') + ' 분자로 바꾸면 ' + v.w + ' × ' + v.d + ' = ' + josa(v.w * v.d, '이에요/예요') + '. 여기에 ' + josa(v.r, '을/를') + ' 더해요.'; } },
      { id: 'no-numerator', wrong: function (v) { return fr(v.w * v.d, v.d); },
        explain: function (v) { return v.w + ' × ' + v.d + ' = ' + v.w * v.d + '까지만 했어요. 원래 있던 분자 ' + josa(v.r, '을/를') + ' 더해야 해요.'; } },
      { id: 'times-numerator', wrong: function (v) { return fr(v.w * v.r, v.d); },
        explain: function (v) { return '자연수에 분자를 곱했어요. 자연수에는 분모 ' + josa(v.d, '을/를') + ' 곱하고(' + v.w + ' × ' + v.d + '), 분자 ' + josa(v.r, '은/는') + ' 더해요.'; } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('A08', [
  { title: '분수 — 똑같이 나눈 것 가운데 몇 개', body: [
    '전체를 똑같이 4칸으로 나눈 것 가운데 3칸을 $\\dfrac{3}{4}$이라 쓰고 "4분의 3"이라고 읽어요.',
    { figure: { type: 'bar', parts: 4, filled: 3 } },
    { ex: [['분모', '아래 수 4. 전체를 몇 칸으로 나누었는지'], ['분자', '위 수 3. 그 가운데 몇 칸인지']] },
    '분모가 클수록 한 칸은 작아져요. 피자를 8조각 낸 한 조각이 4조각 낸 한 조각보다 작은 것과 같아요.'
  ] },
  { title: '진분수 · 가분수 · 대분수', body: [
    { ex: [['\\dfrac{3}{4}', '진분수. 분자가 분모보다 작아요(1보다 작은 수)'], ['\\dfrac{5}{4}', '가분수. 분자가 분모와 같거나 커요(1이거나 1보다 큰 수)'], ['1\\dfrac{1}{4}', '대분수. 자연수와 진분수를 함께 쓴 수']] },
    { figure: { type: 'bar', parts: 4, filled: 5 } },
    '위 그림은 띠 하나가 1이에요. 한 띠를 다 채우고 한 칸이 더 있으니 $\\dfrac{5}{4}$이고, $1\\dfrac{1}{4}$과 같은 수예요.'
  ] },
  { title: '가분수 ↔ 대분수 바꾸기', body: [
    '가분수를 대분수로: 분자를 분모로 나눠요. 몫이 자연수, 나머지가 분자가 돼요.',
    { tex: '\\dfrac{7}{4} \;\\rightarrow\; 7 \\div 4 = 1 \\cdots 3 \;\\rightarrow\; 1\\dfrac{3}{4}' },
    '대분수를 가분수로: 자연수에 분모를 곱하고 분자를 더해요.',
    { tex: '1\\dfrac{3}{4} \;\\rightarrow\; 1 \\times 4 + 3 = 7 \;\\rightarrow\; \\dfrac{7}{4}' },
    '두 경우 모두 분모는 바뀌지 않아요.'
  ] },
  { title: '나눗셈의 몫도 분수로 쓸 수 있어요', body: [
    '피자 3판을 4명이 똑같이 나누면 한 사람 몫은 1판이 안 돼요. 이 몫을 분수로 써요.',
    { tex: '3 \\div 4 = \\dfrac{3}{4}' },
    '나누어지는 수가 분자, 나누는 수가 분모로 가요. 이제 나누어떨어지지 않는 나눗셈도 답을 정확히 쓸 수 있어요.'
  ] }
]);
