/* B02 정수와 유리수의 뜻 — 음수, 수직선, 절댓값, 대소 관계
   유형(쉬운 것부터): B02.sign 부호를 붙여 나타내기 · B02.kind 수의 분류 · B02.line 수직선 위의 수
                     · B02.abs 절댓값 · B02.compare 대소 비교
   부호가 있는 답은 답 형식 signed({ n, p }: n ÷ 10^p, n 은 음수일 수 있다)로 쓴다.
   분류 · 비교 유형에서 수 하나는 { n, d, k }(값 n / d, k 는 쓰는 꼴: int 정수 · dec 소수 · frac 분수, plus 가 참이면 + 를 붙여 쓴다)다. */
(function () {
  'use strict';
  var MH = globalThis.MH, int = MH.int, pick = MH.pick, josa = MH.josa;
  var S = function (n, p) { return { n: n, p: p || 0 }; };
  /** 부호가 있는 수를 글로: str(-15, 1) → '−1.5', str(7, 0, true) → '+7' */
  var str = function (n, p, plus) { return (n < 0 ? '−' : n > 0 && plus ? '+' : '') + MH.decStr(Math.abs(n), p || 0); };
  var stex = function (n, p, plus) { return str(n, p, plus).replace('−', '-'); };
  var sampler = function (fn) { return new MH.Sampler(fn); };

  /* ── B02.sign 부호를 붙여 나타내기 ─────────────────────
     form 0: 서로 반대인 두 양(영상 · 영하 …)에서 한쪽의 부호가 주어지고 반대쪽을 나타낸다 · form 1: 0 보다 a 만큼 큰(작은) 수
     dir: 답의 부호(+1, −1). a: 답의 크기(10^p 배 한 정수), b: 보기로 준 양의 크기 */
  var CONTEXTS = [
    { id: 'temp', pos: '영상', neg: '영하', unit: '°C', say: function (w, x) { return w + ' ' + x + ' °C'; }, step: 1 },
    { id: 'sea', pos: '해발', neg: '해저', unit: 'm', say: function (w, x) { return w + ' ' + x + ' m'; }, step: 100 },
    { id: 'money', pos: '수입', neg: '지출', unit: '원', say: function (w, x) { return x + '원의 ' + w; }, step: 500 },
    { id: 'profit', pos: '이익', neg: '손해', unit: '원', say: function (w, x) { return x + '원의 ' + w; }, step: 1000 },
    { id: 'floor', pos: '지상', neg: '지하', unit: '층', say: function (w, x) { return w + ' ' + x + '층'; }, step: 1 },
    { id: 'time', pos: '후', neg: '전', unit: '분', say: function (w, x) { return x + '분 ' + w; }, step: 5 },
    { id: 'score', pos: '득점', neg: '실점', unit: '점', say: function (w, x) { return x + '점 ' + w; }, step: 1 },
    { id: 'east', pos: '동쪽', neg: '서쪽', unit: 'km', say: function (w, x) { return w + '으로 ' + x + ' km'; }, step: 1 }
  ];
  var word = function (ctx, dir) { return dir > 0 ? ctx.pos : ctx.neg; };
  /** 수 뒤에 단위를 붙인다. °C, m, km 는 띄우고 원 · 층 · 분 · 점은 붙여 쓴다 */
  var withUnit = function (ctx, x) { return x + (/^[가-힣]/.test(ctx.unit) ? '' : ' ') + ctx.unit; };
  var amount = function (max) { return function (v, ctx) { return sampler(function (r) { return ctx.step * r.int(1, max); }); }; };
  MH.defineType({
    id: 'B02.sign', unit: 'B02', version: 1, title: '부호를 붙여 나타내기',
    answer: { kind: 'signed', decimal: true, plus: 'notice', suffix: function (v, ctx) { return v.form === 0 ? ctx.unit : ''; } },
    contexts: CONTEXTS,
    levels: [
      { name: '반대인 양을 부호로', minDistinct: 200, vars: { form: 0, dir: pick([-1, -1, 1]), p: 0, a: amount(9), b: amount(9) }, where: function (v) { return v.a !== v.b; } },
      { name: '0보다 큰 수, 작은 수', minDistinct: 90, vars: { form: 1, dir: pick([-1, -1, 1]), p: 0, a: int(1, 50), b: 0 } },
      { name: '소수와 큰 수', vars: { form: pick([0, 1]), dir: pick([-1, 1]), p: function (v) { return v.form; }, a: function (v, ctx) { return v.form ? int(1, 99) : amount(30)(v, ctx); }, b: function (v, ctx) { return v.form ? 0 : amount(30)(v, ctx); } },
        where: function (v) { return v.form ? v.a % 10 !== 0 : v.a !== v.b; } }
    ],
    prompt: function (v, ctx) {
      if (v.form === 1) return { text: '0보다 ' + MH.decStr(v.a, v.p) + '만큼 ' + (v.dir > 0 ? '큰' : '작은') + ' 수를 부호를 붙여 나타내세요.' };
      var given = ctx.say(word(ctx, -v.dir), v.b), asked = ctx.say(word(ctx, v.dir), v.a);
      return { text: josa(given, '을/를') + ' ' + josa(withUnit(ctx, str(-v.dir * v.b, 0, true)), '으로/로') + ' 나타낼 때, ' + josa(asked, '을/를') + ' 부호를 붙여 나타내세요.' };
    },
    solve: function (v) { return S(v.dir * v.a, v.p); },
    /* 검산: 문제 글에서 묻는 쪽의 낱말을 다시 읽어 부호를 정하고, 크기가 같은지 본다 */
    verify: function (v, ans, ctx) {
      var text = MH.types['B02.sign'].prompt(v, ctx).text, asked = text.split('나타낼 때, ').pop();
      var neg = v.form === 1 ? asked.indexOf('작은') >= 0 : asked.indexOf(ctx.neg) >= 0 && asked.indexOf(ctx.pos) < 0;
      return (ans.n < 0) === neg && ans.n !== 0 && Math.abs(ans.n) === v.a && ans.p === v.p;
    },
    hints: function (v, ctx) {
      if (v.form === 1) return [
        '0보다 큰 수는 양수라서 +를, 0보다 작은 수는 음수라서 −를 붙여요.',
        '0에서 얼마나 떨어져 있는지가 숫자이고, 어느 쪽에 있는지가 부호예요.'
      ];
      return [
        '서로 반대되는 성질을 가진 양은 한쪽을 +로, 다른 쪽을 −로 나타내요.',
        '‘' + word(ctx, v.dir) + '’ 쪽은 ‘' + word(ctx, -v.dir) + '’ 쪽과 반대예요. ‘' + word(ctx, -v.dir) + '’에 붙인 부호와 반대인 부호를 붙이세요.'
      ];
    },
    steps: function (v, ctx) {
      var ans = S(v.dir * v.a, v.p), sign = v.dir > 0 ? '+' : '−';
      if (v.form === 1) return [
        { say: '0보다 ' + (v.dir > 0 ? '큰 수는 양수라서 +를' : '작은 수는 음수라서 −를') + ' 붙여요.' },
        { say: '0에서 ' + MH.decStr(v.a, v.p) + '만큼 떨어져 있으니 답은 ' + josa(str(ans.n, ans.p, true), '이에요/예요') + '.', value: ans }
      ];
      return [
        { say: '‘' + word(ctx, -v.dir) + '’ 쪽을 ' + (v.dir > 0 ? '−' : '+') + '로 나타냈으니, 반대인 ‘' + word(ctx, v.dir) + '’ 쪽은 ' + sign + '로 나타내요.' },
        { say: josa(ctx.say(word(ctx, v.dir), v.a), '은/는') + ' ' + josa(withUnit(ctx, str(ans.n, 0, true)), '이에요/예요') + '.', value: ans }
      ];
    },
    /* ① 부호를 반대로 붙임(음수인데 부호를 안 쓴 것도 여기) ② 보기로 준 수를 그대로 답함 */
    mistakes: [
      { id: 'flipped', wrong: function (v) { return S(-v.dir * v.a, v.p); },
        explain: function (v, ctx) {
          if (v.form === 1) return v.dir > 0 ? '0보다 큰 수는 양수예요. +를 붙여요.' : '0보다 작은 수는 음수예요. 수 앞에 −를 붙여요.';
          return '‘' + word(ctx, v.dir) + '’ 쪽은 ‘' + word(ctx, -v.dir) + '’ 쪽과 반대예요. ‘' + word(ctx, -v.dir) + '’ 쪽을 ' + (v.dir > 0 ? '−' : '+') + '로 나타냈으니, 여기에는 ' + (v.dir > 0 ? '+' : '−') + '를 붙여요.';
        } },
      { id: 'copied-example', wrong: function (v) { return v.form === 0 ? S(v.dir * v.b, 0) : null; },
        explain: function (v, ctx) { return '부호는 맞았어요. 그런데 숫자는 보기로 준 ' + josa(v.b, '이/가') + ' 아니라, 묻는 양 ‘' + ctx.say(word(ctx, v.dir), v.a) + '’의 ' + josa(v.a, '을/를') + ' 써야 해요.'; } }
    ]
  });

  /* ── B02.kind 수의 분류 ────────────────────────────────
     네 수 가운데 묻는 종류에 드는 수 하나를 고른다. v.opts: 수 네 개({ n, d, k, plus }), v.ask: 묻는 종류, 정답은 그 종류에 드는 단 하나의 수 */
  var isInt = function (x) { return x.n % x.d === 0; };
  var ASK = {
    'pos-int': { label: '양의 정수', test: function (x) { return isInt(x) && x.n > 0; } },
    'neg-int': { label: '음의 정수', test: function (x) { return isInt(x) && x.n < 0; } },
    'int': { label: '정수', test: isInt },
    'non-int': { label: '정수가 아닌 유리수', test: function (x) { return !isInt(x); } },
    'pos': { label: '양수', test: function (x) { return x.n > 0; } },
    'neg': { label: '음수', test: function (x) { return x.n < 0; } }
  };
  /** 수를 쓰는 꼴 그대로의 수식 */
  var numTex = function (x) {
    var a = Math.abs(x.n), sign = x.n < 0 ? '-' : x.plus && x.n > 0 ? '+' : '';
    return sign + (x.k === 'frac' ? '\\frac{' + a + '}{' + x.d + '}' : x.k === 'dec' ? MH.decStr(a, x.d === 100 ? 2 : 1) : String(a));
  };
  /** 수 하나를 뽑는다. kinds: 뽑을 꼴의 목록 */
  var MAKE = {
    int: function (r) { var s = r.pick([-1, 1]); return { n: s * r.int(1, 12), d: 1, k: 'int', plus: s > 0 && r.int(0, 1) === 1 }; },
    zero: function () { return { n: 0, d: 1, k: 'int', plus: false }; },
    dec: function (r) { var s = r.pick([-1, 1]), a = r.int(1, 59); if (a % 10 === 0) a += 5; return { n: s * a, d: 10, k: 'dec', plus: s > 0 && r.int(0, 1) === 1 }; },
    frac: function (r) { var s = r.pick([-1, 1]), d = r.int(2, 7), a = r.int(1, 2 * d); while (MH.gcd(a, d) > 1) a++; return { n: s * a, d: d, k: 'frac', plus: s > 0 && r.int(0, 1) === 1 }; },
    /* 분수 꼴이지만 약분하면 정수가 되는 수 */
    whole: function (r) { var s = r.pick([-1, 1]), d = r.int(2, 5); return { n: s * d * r.int(1, 4), d: d, k: 'frac', plus: false }; }
  };
  var same = function (x, y) { return x.n * y.d === y.n * x.d; };
  /** 수식으로 쓴 수 뒤에 조사를 붙인다(분수는 '4분의 3'처럼 분자로 끝나게 읽는다): tj(x, '은/는') → '$-\frac{3}{4}$은' */
  var tj = function (x, pair) {
    var w = x.k === 'frac' ? String(Math.abs(x.n)) : MH.decStr(Math.abs(x.n), x.k === 'dec' ? 1 : 0);
    return '$' + numTex(x) + '$' + josa(w, pair).slice(w.length);
  };
  /** { ask, opts }: 묻는 종류에 드는 수 하나 + 들지 않는 수 셋(값이 서로 다르다)을 섞어 뽑는다. must 꼴은 적어도 하나 들어간다. */
  var quiz = function (asks, kinds, must) {
    return sampler(function (r) {
      for (;;) {
        var ask = r.pick(asks), test = ASK[ask].test, opts = [], hit = 0, tries = 0;
        while (opts.length < 4 && tries++ < 200) {
          var x = MAKE[opts.length === 0 && must ? must : r.pick(kinds)](r), yes = test(x);
          if ((yes && hit) || (!yes && opts.length - hit >= 3) || opts.some(function (o) { return same(o, x); })) continue;
          opts.push(x); if (yes) hit++;
        }
        if (opts.length === 4 && hit === 1) return { ask: ask, opts: r.shuffle(opts) };
      }
    });
  };
  /** 그 수가 어떤 수인지 말해 준다(풀이 · 실수 설명) */
  var describe = function (x) {
    var t = tj(x, '은/는') + ' ', q = x.n / x.d;
    if (x.n === 0) return t + '양수도 음수도 아닌 정수예요.';
    if (isInt(x)) return x.k === 'frac' ? t + Math.abs(x.n) + ' ÷ ' + x.d + ' = ' + josa(Math.abs(q), '이라서/라서') + ' ' + josa(str(q, 0), '과/와') + ' 같아요. ' + (q > 0 ? '양' : '음') + '의 정수예요.'
      : t + (q > 0 ? '양의 정수(자연수)' : '음의 정수') + '예요.';
    return t + '정수가 아닌 유리수예요(' + (x.n > 0 ? '양수' : '음수') + ').';
  };
  var optionsOf = function (v) { return v.q.opts.map(numTex); };
  var answerOf = function (v) { return v.q.opts.filter(ASK[v.q.ask].test)[0]; };
  MH.defineType({
    id: 'B02.kind', unit: 'B02', version: 1, title: '수의 분류',
    answer: { kind: 'choice', options: optionsOf },
    levels: [
      { name: '양의 정수, 음의 정수', vars: { q: quiz(['pos-int', 'neg-int'], ['int', 'int', 'zero', 'dec']) } },
      { name: '정수와 정수가 아닌 유리수', vars: { q: quiz(['int', 'non-int', 'pos', 'neg'], ['int', 'zero', 'dec', 'frac']) } },
      { name: '약분하면 정수가 되는 분수', vars: { q: quiz(['int', 'non-int', 'pos-int', 'neg-int'], ['int', 'dec', 'frac', 'whole'], 'whole') } }
    ],
    prompt: function (v) {
      var label = ASK[v.q.ask].label;
      return { text: optionsOf(v).map(function (t) { return '$' + t.replace('\\frac', '\\dfrac') + '$'; }).join(',  ') + ' 가운데 ' + josa(label, '은/는') + ' 어느 것일까요?' };
    },
    solve: function (v) { return numTex(answerOf(v)); },
    /* 검산: 보기의 수식을 다시 읽어 값을 구하고, 묻는 종류에 드는 수가 하나뿐인지 본다 */
    verify: function (v, ans) {
      var read = function (t) {
        var m = /^([+-]?)(?:\\frac\{(\d+)\}\{(\d+)\}|(\d+)(?:\.(\d+))?)$/.exec(t), s = m[1] === '-' ? -1 : 1;
        return m[2] ? MH.F(s * Number(m[2]), Number(m[3])) : MH.F(s * Number(m[4] + (m[5] || '')), MH.pow10((m[5] || '').length));
      };
      var whole = function (f) { return Number(f.d) === 1; }, sgn = function (f) { return f.compare(0); };
      var test = { 'pos-int': function (f) { return whole(f) && sgn(f) > 0; }, 'neg-int': function (f) { return whole(f) && sgn(f) < 0; }, 'int': whole,
        'non-int': function (f) { return !whole(f); }, 'pos': function (f) { return sgn(f) > 0; }, 'neg': function (f) { return sgn(f) < 0; } }[v.q.ask];
      var hits = optionsOf(v).filter(function (t) { return test(read(t)); });
      return hits.length === 1 && hits[0] === ans;
    },
    hints: function (v) {
      var ask = v.q.ask, fracs = v.q.opts.some(function (x) { return x.k === 'frac'; });
      return [
        ask === 'pos' || ask === 'neg' ? '양수는 0보다 큰 수, 음수는 0보다 작은 수예요. 0은 양수도 음수도 아니에요. 정수가 아니어도 양수나 음수가 될 수 있어요.'
          : '정수는 양의 정수(자연수), 0, 음의 정수를 통틀어 말해요. 소수점 아래나 분수 부분이 남는 수는 정수가 아니에요.',
        '부호 +는 양수, −는 음수를 나타내요. 부호가 없는 수는 양수이고, 0만 예외예요.'
      ].concat(fracs ? ['분수는 분자를 분모로 나누어 보세요. 나누어떨어지면 그 분수는 정수와 같은 수예요.'] : []);
    },
    steps: function (v) {
      var ans = answerOf(v);
      return v.q.opts.map(function (x) { return { say: describe(x) }; })
        .concat([{ say: josa(ASK[v.q.ask].label, '은/는') + ' $' + numTex(ans) + '$ 하나뿐이에요.', value: numTex(ans) }]);
    },
    mistakes: [
      { id: 'picked-other', match: function (v, raw) { return optionsOf(v).indexOf(String(raw)) >= 0; },
        explain: function (v, ctx, x) {
          var opt = v.q.opts[optionsOf(v).indexOf(x)];
          return describe(opt) + ' ' + josa(ASK[v.q.ask].label, '이/가') + ' 아니에요.';
        } }
    ]
  });

  /* ── B02.line 수직선 위의 수 ───────────────────────────
     수직선은 min 부터 max 까지, 1 을 parts 칸으로 나눈다. mark 는 왼쪽 끝에서 몇 번째 눈금인지. 답은 정수 또는 소수 */
  var ticks = function (v) { return v.min * v.parts + v.mark; };                       /* 0 에서 몇 칸(왼쪽이면 음수) */
  var places = function (parts) { return parts === 1 ? 0 : parts === 4 ? 2 : 1; };
  var tickSize = function (parts) { return MH.pow10(places(parts)) / parts; };         /* 작은 눈금 한 칸(10^p 배 한 정수) */
  var lineValue = function (v) { return S(ticks(v) * tickSize(v.parts), places(v.parts)); };
  var markOf = function (v) { return int(0, (v.max - v.min) * v.parts); };
  MH.defineType({
    id: 'B02.line', unit: 'B02', version: 1, title: '수직선 위의 수',
    answer: { kind: 'signed', decimal: true },
    levels: [
      { name: '정수', minDistinct: 100, vars: { min: int(-6, -3), max: int(3, 6), parts: 1, mark: markOf }, where: function (v) { return ticks(v) !== 0; } },
      { name: '0.5 간격', minDistinct: 30, vars: { min: int(-3, -1), max: int(1, 3), parts: 2, mark: markOf }, where: function (v) { return v.mark % v.parts !== 0; } },
      { name: '0.25, 0.2 간격', minDistinct: 80, vars: { min: int(-2, -1), max: int(1, 2), parts: pick([4, 5]), mark: markOf }, where: function (v) { return v.mark % v.parts !== 0; } }
    ],
    prompt: function (v) {
      return { text: '수직선에서 □가 가리키는 수를 구하세요.' + (v.parts > 1 ? ' (소수로 써요.)' : ''), figure: { type: 'line', min: v.min, max: v.max, parts: v.parts, mark: v.mark } };
    },
    solve: lineValue,
    /* 검산: 왼쪽 끝에서부터 한 칸씩 걸어가며 값을 더한다 */
    verify: function (v, ans) {
      var p = places(v.parts), x = v.min * MH.pow10(p);
      for (var i = 0; i < v.mark; i++) x += tickSize(v.parts);
      return ans.p === p && ans.n === x;
    },
    hints: function (v) {
      var out = ['0의 오른쪽에 있는 수는 양수, 왼쪽에 있는 수는 음수예요. 음수에는 −를 붙여요.'];
      if (v.parts > 1) out.push('0과 1 사이를 똑같이 ' + v.parts + '칸으로 나누었어요. 작은 눈금 한 칸이 얼마인지 먼저 구하세요.');
      out.push('0에서 □까지 ' + (v.parts > 1 ? '작은 눈금으로 몇 칸인지 세어 보세요. 가까운 큰 눈금이 아니라 0에서부터 세요.' : '몇 칸인지 세어 보세요.'));
      return out;
    },
    steps: function (v) {
      var k = ticks(v), a = Math.abs(k), p = places(v.parts), u = tickSize(v.parts), ans = lineValue(v), left = k < 0;
      var out = [{ say: '□는 0의 ' + (left ? '왼쪽에 있으니 음수예요. 답에 −를 붙여요.' : '오른쪽에 있으니 양수예요.') }];
      if (v.parts > 1) out.push({ say: '0과 1 사이를 똑같이 ' + v.parts + '칸으로 나누었으니 작은 눈금 한 칸은 ' + josa(MH.decStr(u, p), '이에요/예요') + '.' });
      out.push({ say: '□는 0에서 ' + (left ? '왼쪽' : '오른쪽') + '으로 ' + a + '칸 떨어져 있어요. ' + (v.parts > 1 ? MH.decStr(u, p) + ' × ' + a + ' = ' + MH.decStr(a * u, p) + '이므로 ' : '') + '답은 ' + josa(str(ans.n, ans.p), '이에요/예요') + '.', value: ans });
      return out;
    },
    /* ① 부호가 반대(음수인데 − 를 안 붙임) ② 작은 눈금 한 칸을 1 로 셈 ③ 음수에서 왼쪽 큰 눈금에 소수 부분을 붙여 읽음(−1.5 를 −2.5 로) */
    mistakes: [
      { id: 'sign', wrong: function (v) { var a = lineValue(v); return S(-a.n, a.p); },
        explain: function (v) { return ticks(v) < 0 ? '0의 왼쪽에 있는 수는 음수예요. 수 앞에 −를 붙여요.' : '0의 오른쪽에 있는 수는 양수예요. −를 붙이지 않아요.'; } },
      { id: 'tick-as-one', wrong: function (v) { return v.parts > 1 ? S(ticks(v), 0) : null; },
        explain: function (v) { return '작은 눈금 한 칸을 1로 셌어요. 0과 1 사이가 ' + v.parts + '칸이라서 한 칸은 ' + josa(MH.decStr(tickSize(v.parts), places(v.parts)), '이에요/예요') + '.'; } },
      { id: 'from-left-tick', wrong: function (v) {
          var k = ticks(v), a = lineValue(v), one = MH.pow10(a.p);
          if (k >= 0 || v.mark % v.parts === 0) return null;
          var lower = Math.floor(k / v.parts) * one;                                   /* 바로 왼쪽의 큰 눈금 */
          return S(2 * lower - a.n, a.p);
        },
        explain: function (v) {
          var lower = Math.floor(ticks(v) / v.parts);
          return '왼쪽 큰 눈금 ' + str(lower) + '에 소수 부분을 붙여 읽었어요. □는 ' + str(lower) + '보다 오른쪽이라서 ' + str(lower) + '보다 큰 수예요. 0에서부터 왼쪽으로 몇 칸인지 세어 보세요.';
        } }
    ]
  });

  /* ── B02.abs 절댓값 ────────────────────────────────────
     form 0: |x| 의 값 · form 1: 절댓값이 a 인 수 가운데 음수(양수)
     form 2: 절댓값이 a 이하인 정수의 개수 · form 3: a 보다 작은 · form 4: a 이상 b 이하인 */
  var counting = function (v) { return v.form >= 2; };
  var inRange = function (v, x) { var d = Math.abs(x); return v.form === 2 ? d <= v.a : v.form === 3 ? d < v.a : d >= v.a && d <= v.b; };
  var listed = function (v) { var out = []; for (var x = -30; x <= 30; x++) if (inRange(v, x)) out.push(x); return out; };
  var rangeText = function (v) { return v.form === 2 ? v.a + ' 이하인' : v.form === 3 ? v.a + '보다 작은' : v.a + ' 이상 ' + v.b + ' 이하인'; };
  var onForms = function (forms, fn) { return function (v) { return forms.indexOf(v.form) >= 0 ? fn(v) : null; }; };
  MH.defineType({
    id: 'B02.abs', unit: 'B02', version: 1, title: '절댓값',
    answer: { kind: 'signed', decimal: true, common: false, suffix: function (v) { return counting(v) ? '개' : ''; } },
    levels: [
      { name: '정수의 절댓값', minDistinct: 38, vars: { form: 0, s: pick([-1, -1, 1]), p: 0, a: int(1, 20), b: 0 } },
      { name: '소수의 절댓값, 절댓값이 같은 두 수', minDistinct: 150, vars: { form: pick([0, 1]), s: pick([-1, 1]), p: function (v) { return 1 - v.form; }, a: function (v) { return v.form ? int(1, 30) : int(1, 99); }, b: 0 },
        where: function (v) { return v.form === 1 || v.a % 10 !== 0; } },
      { name: '절댓값의 범위에 드는 정수의 개수', minDistinct: 40, vars: { form: pick([2, 3, 4]), s: 1, p: 0, a: function (v) { return v.form === 4 ? int(1, 5) : int(2, 12); }, b: function (v) { return v.form === 4 ? int(v.a + 1, v.a + 5) : 0; } } }
    ],
    prompt: function (v) {
      if (v.form === 0) return { tex: '\\left| ' + stex(v.s * v.a, v.p, true) + ' \\right|', text: '절댓값을 구하세요.' };
      if (v.form === 1) return { text: '절댓값이 ' + v.a + '인 수 가운데 ' + (v.s < 0 ? '음수' : '양수') + '를 구하세요.' };
      return { text: '절댓값이 ' + rangeText(v) + ' 정수는 모두 몇 개일까요?' };
    },
    solve: function (v) {
      if (v.form === 0) return S(v.a, v.p);
      if (v.form === 1) return S(v.s * v.a, 0);
      return S(v.form === 2 ? 2 * v.a + 1 : v.form === 3 ? 2 * v.a - 1 : 2 * (v.b - v.a + 1), 0);
    },
    /* 검산: 절댓값은 0 이상이고 제곱이 같다 · 개수는 정수를 하나씩 확인하며 센다 */
    verify: function (v, ans) {
      if (v.form === 0) return ans.n >= 0 && ans.p === v.p && ans.n * ans.n === v.a * v.a;
      if (v.form === 1) return ans.n * ans.n === v.a * v.a && (ans.n < 0) === (v.s < 0);
      return listed(v).length === ans.n;
    },
    hints: function (v) {
      if (v.form === 0) return ['절댓값은 수직선에서 0과 그 수 사이의 거리예요. 거리는 음수가 될 수 없어요.', '수에서 부호 +, −를 떼어 낸 것이 절댓값이에요.'];
      if (v.form === 1) return [
        '절댓값이 ' + v.a + '인 수는 0에서 ' + v.a + '만큼 떨어진 수예요. 0의 오른쪽에 하나, 왼쪽에 하나, 모두 두 개가 있어요.',
        '그 가운데 0의 ' + (v.s < 0 ? '왼쪽' : '오른쪽') + '에 있는 수를 답하세요.'
      ];
      return [
        '절댓값은 0에서의 거리예요. 0에서의 거리가 ' + rangeText(v) + ' 정수를 수직선 위에서 모두 찾아보세요.',
        '양수만 세지 말고 음수도 세어야 해요. ' + (v.form === 4 ? '0처럼 절댓값이 ' + v.a + '보다 작은 수는 들어가지 않아요.' : '0도 정수이고, 0의 절댓값은 0이에요.'),
        v.form === 3 ? '‘' + v.a + '보다 작은’에는 절댓값이 꼭 ' + v.a + '인 수는 들어가지 않아요.' : '‘이하’, ‘이상’에는 그 수 자신도 들어가요.'
      ];
    },
    steps: function (v) {
      var x = str(v.s * v.a, v.p, true), a = MH.decStr(v.a, v.p);
      if (v.form === 0) return [
        { say: josa(x, '은/는') + ' 수직선에서 0으로부터 ' + a + '만큼 떨어져 있어요.' },
        { say: '절댓값은 그 거리예요. 부호를 떼어 내면 돼요.', tex: '\\left| ' + stex(v.s * v.a, v.p, true) + ' \\right| = ' + a, value: S(v.a, v.p) }
      ];
      if (v.form === 1) return [
        { say: '절댓값이 ' + v.a + '인 수는 0에서 ' + v.a + '만큼 떨어진 ' + josa('+' + v.a, '과/와') + ' −' + v.a + ', 두 개예요.' },
        { say: '이 가운데 ' + (v.s < 0 ? '음수' : '양수') + '는 ' + josa(str(v.s * v.a, 0, true), '이에요/예요') + '.', value: S(v.s * v.a, 0) }
      ];
      var list = listed(v);
      return [
        { say: '절댓값이 ' + rangeText(v) + ' 정수를 작은 수부터 모두 써요: ' + list.map(function (n) { return str(n); }).join(', ') + '.' },
        { say: '세어 보면 모두 ' + list.length + '개예요.', value: S(list.length, 0) }
      ];
    },
    /* 값: ① 음수의 부호를 그대로 둠 ② 양수에 − 를 붙임 · 두 수: ③ 반대쪽 수를 답함
       개수: ④ 음수 쪽을 안 셈 ⑤ 0 을 빠뜨림 ⑥ 경계(이하 · 미만)를 잘못 셈 ⑦ 사이의 수까지 모두 셈 */
    mistakes: [
      { id: 'kept-sign', wrong: onForms([0], function (v) { return v.s < 0 ? S(-v.a, v.p) : null; }),
        explain: function () { return '절댓값은 0으로부터의 거리라서 음수가 될 수 없어요. − 부호를 떼어 내요.'; } },
      { id: 'made-negative', wrong: onForms([0], function (v) { return v.s > 0 ? S(-v.a, v.p) : null; }),
        explain: function () { return '절댓값은 부호를 바꾸는 것이 아니에요. 0으로부터의 거리라서 양수의 절댓값은 그 수 자신이에요.'; } },
      { id: 'other-side', wrong: onForms([1], function (v) { return S(-v.s * v.a, 0); }),
        explain: function (v) { return '절댓값이 ' + v.a + '인 수는 ' + josa('+' + v.a, '과/와') + ' −' + v.a + ', 두 개예요. 그 가운데 ' + (v.s < 0 ? '음수를 물었으니 −를 붙여요.' : '양수를 물었어요.'); } },
      { id: 'no-negatives', wrong: onForms([2, 3, 4], function (v) { return S(listed(v).filter(function (x) { return x >= 0; }).length, 0); }),
        explain: function (v) { return '음수 쪽을 세지 않았어요. 절댓값은 0에서의 거리라서 −' + v.a + '처럼 0의 왼쪽에 있는 수도 세어야 해요.'; } },
      { id: 'no-zero', wrong: onForms([2, 3], function (v) { return S(listed(v).length - 1, 0); }),
        explain: function () { return '0을 빠뜨렸어요. 0도 정수이고, 0의 절댓값은 0이에요.'; } },
      { id: 'boundary', wrong: onForms([2, 3], function (v) { return S(v.form === 2 ? 2 * v.a - 1 : 2 * v.a + 1, 0); }),
        explain: function (v) {
          return v.form === 2 ? '‘' + v.a + ' 이하’에는 절댓값이 꼭 ' + v.a + '인 ' + josa('+' + v.a, '과/와') + ' −' + v.a + '도 들어가요.'
            : '‘' + v.a + '보다 작은’에는 절댓값이 꼭 ' + v.a + '인 ' + josa('+' + v.a, '과/와') + ' ' + josa('−' + v.a, '은/는') + ' 들어가지 않아요.';
        } },
      { id: 'filled-middle', wrong: onForms([4], function (v) { return S(2 * v.b + 1, 0); }),
        explain: function (v) { return '−' + v.b + '부터 ' + v.b + '까지의 정수를 모두 셌어요. 절댓값이 ' + v.a + '보다 작은 수(0에 가까운 수)는 빼야 해요.'; } }
    ]
  });

  /* ── B02.compare 대소 비교 ─────────────────────────────
     v.q = [X, Y]: 비교할 두 수({ n, d, k, plus }). 적어도 하나는 음수다. */
  var cmp = function (x, y) { var c = x.n * y.d - y.n * x.d; return c > 0 ? '>' : c < 0 ? '<' : '='; };
  var dec1 = function (n) { return n % 10 === 0 ? { n: n / 10, d: 1, k: 'int', plus: false } : { n: n, d: 10, k: 'dec', plus: false }; };
  var floorDiv = function (a, b) { return Math.floor(a / b); };
  var PAIR = [
    function (r) { return [{ n: r.int(-12, 12), d: 1, k: 'int', plus: false }, { n: r.int(-12, 12), d: 1, k: 'int', plus: false }]; },
    function (r) { var a = r.int(-50, 30); return [dec1(a), dec1(a + r.pick([-1, 1]) * r.int(1, 15))]; },
    function (r) {
      var s = r.pick([-1, -1, -1, 1]), d = r.int(2, 8), a = r.int(1, 2 * d), x = { n: s * a, d: d, k: 'frac', plus: false }, y;
      if (r.int(0, 1)) { var e = r.int(2, 8), t = s * a * e; y = { n: r.pick([-1, -1, -1, 1]) * Math.max(1, Math.abs(floorDiv(t, d)) + r.int(-1, 1)), d: e, k: 'frac', plus: false }; }
      else y = dec1(floorDiv(s * a * 10, d) + r.int(0, 1));
      return r.int(0, 1) ? [x, y] : [y, x];
    }
  ];
  var lowest = function (x) { return x.k !== 'frac' || (MH.gcd(Math.abs(x.n), x.d) === 1 && x.d > 1); };
  var pairOf = function (level) { return sampler(function (r) { return PAIR[level](r); }); };
  var soundPair = function (v) {
    var x = v.q[0], y = v.q[1];
    return (x.n < 0 || y.n < 0) && lowest(x) && lowest(y) && !(x.k === y.k && x.n === y.n && x.d === y.d) && !(x.k === 'frac' && y.k === 'frac' && x.d === y.d && x.n * y.n < 0);
  };
  var bigTex = function (x) { return numTex(x).replace('\\frac', '\\dfrac'); };
  var absTex = function (x) { return numTex({ n: Math.abs(x.n), d: x.d, k: x.k, plus: false }); };
  /** 두 수의 관계를 까닭과 함께 말해 준다: [앞 문장(들), 결론] */
  var reason = function (v) {
    var x = v.q[0], y = v.q[1], sign = cmp(x, y), big = sign === '>' ? x : y, small = sign === '>' ? y : x;
    var concl = sign === '=' ? '두 수는 같아요.' : tj(big, '이/가') + ' $' + numTex(small) + '$보다 커요.';
    if (sign === '=') return [(x.k === 'frac' ? tj(x, '을/를') + ' 소수로 바꾸면 ' + tj(y, '이에요/예요') : tj(y, '을/를') + ' 소수로 바꾸면 ' + tj(x, '이에요/예요')) + '(분자 ÷ 분모).', concl];
    if (x.n === 0 || y.n === 0) return [small.n < 0 ? '음수는 0보다 작아요.' : '양수는 0보다 커요.', concl];
    if (x.n * y.n < 0) return ['음수는 0보다 작고 양수는 0보다 커요. 그래서 양수는 음수보다 언제나 커요.', concl];
    /* 둘 다 음수: 절댓값을 비교한다(꼴이 다르면 분모를 같게 맞춰서) */
    var L = MH.lcm(x.d, y.d), ax = Math.abs(x.n) * L / x.d, ay = Math.abs(y.n) * L / y.d, far = ax > ay ? x : y, near = ax > ay ? y : x;
    var bridge = x.k === 'int' || y.k === 'int' || (x.k === 'dec' && y.k === 'dec') ? ''
      : ' (분모를 ' + josa(L, '으로/로') + ' 맞추면 $' + absTex(x) + ' = \\frac{' + ax + '}{' + L + '}$, $' + absTex(y) + ' = \\frac{' + ay + '}{' + L + '}$)';
    return ['둘 다 음수예요. 절댓값을 비교하면 ' + tj({ n: Math.abs(far.n), d: far.d, k: far.k }, '이/가') + ' $' + absTex(near) + '$보다 커요' + bridge + '.',
      '음수끼리는 절댓값이 큰 수가 0에서 더 멀리 왼쪽에 있어서 더 작아요. ' + concl];
  };
  var said = function (sign) {
    return { id: { '>': 'said-greater', '<': 'said-less', '=': 'said-equal' }[sign], wrong: function () { return sign; },
      explain: function (v) {
        var x = v.q[0], y = v.q[1], r = reason(v);
        if (sign === '=' && x.n * y.d === -y.n * x.d) return '절댓값은 같지만 부호가 달라요. ' + r.join(' ');
        if (x.n < 0 && y.n < 0 && cmp(x, y) !== '=' && sign !== '=') return '절댓값이 큰 쪽을 더 크다고 봤어요. 음수끼리는 반대예요. ' + r[1];
        return r.join(' ');
      } };
  };
  MH.defineType({
    id: 'B02.compare', unit: 'B02', version: 1, title: '대소 비교',
    answer: { kind: 'choice', options: ['>', '=', '<'] },
    levels: [
      { name: '정수', minDistinct: 250, vars: { q: pairOf(0) }, where: soundPair },
      { name: '소수', vars: { q: pairOf(1) }, where: function (v) { return soundPair(v) && (v.q[0].k === 'dec' || v.q[1].k === 'dec'); } },
      { name: '분수와 소수', vars: { q: pairOf(2) }, where: soundPair }
    ],
    prompt: function (v) { return { tex: bigTex(v.q[0]) + ' \\;\\bigcirc\\; ' + bigTex(v.q[1]), text: '○ 안에 알맞은 기호를 고르세요.' }; },
    solve: function (v) { return cmp(v.q[0], v.q[1]); },
    /* 검산: 정확한 분수 계산으로 비교 */
    verify: function (v, ans) {
      var c = MH.F(v.q[0].n, v.q[0].d).compare(MH.F(v.q[1].n, v.q[1].d));
      return ans === (c > 0 ? '>' : c < 0 ? '<' : '=');
    },
    hints: function (v) {
      var out = ['수직선에서 오른쪽에 있는 수가 더 커요. 양수는 0보다 크고, 음수는 0보다 작아요.',
        '음수끼리는 절댓값이 큰 수가 0에서 더 멀리 왼쪽에 있어요. 그래서 절댓값이 큰 음수가 더 작아요.'];
      if (v.q.some(function (x) { return x.k === 'frac'; })) out.push('분수가 있으면 분모를 같게 맞추거나 소수로 바꿔서 절댓값부터 비교하세요.');
      return out;
    },
    steps: function (v) {
      var r = reason(v), sign = cmp(v.q[0], v.q[1]);
      return [{ say: r[0] }, { say: r[1], tex: bigTex(v.q[0]) + ' ' + sign + ' ' + bigTex(v.q[1]), value: sign }];
    },
    mistakes: [said('>'), said('<'), said('=')]
  });
})();
