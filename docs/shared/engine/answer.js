/* 답 형식(kind)과 정답 판정 (plan/architecture.md 1.5절).
   kind 하나가 "읽기 · 비교 · 형태 확인 · 표시 · 공통 실수 찾기"를 맡는다.
   새 형식(fraction, decimal …)은 그 형식이 처음 필요한 단원에서 여기에 추가한다. */
(function () {
  'use strict';
  var MH = globalThis.MH = globalThis.MH || {};

  MH.kinds = {
    /* 자연수(0 포함). 입력은 숫자 키패드로 친 문자열. */
    int: {
      /** 입력을 값으로 읽는다. 읽을 수 없으면 null. */
      parse: function (raw) {
        var s = String(raw == null ? '' : raw).trim();
        if (!/^\d{1,15}$/.test(s)) return null;
        return Number(s);
      },
      equal: function (a, b) { return a === b; },
      /** 값은 맞는데 형태를 더 다듬을 수 있으면 알려 줄 말. 자연수는 해당 없음. */
      note: function () { return null; },
      tex: function (value) { return String(value); },
      /** raw: 그 값을 입력했을 때의 문자열(parse 의 반대) · say: '내 답: …' 에 쓰는 글 */
      raw: function (value) { return String(value); },
      say: function (value) { return String(value); },
      valid: function (value) { return Number.isSafeInteger(value) && value >= 0; },
      /** 유형에 적힌 실수로 설명이 안 될 때 보는 공통 실수 */
      common: function (input, answer) {
        var d = Math.abs(input - answer), a = String(answer), b = String(input);
        for (var k = 1, p = 10; p <= d; k++, p *= 10) {
          if (d === p) return { id: 'place-' + k, explain: MH.place(k) + '의 자리가 1만큼 달라요. ' + MH.place(k) + '의 자리로 받아올리거나 받아내린 수를 빠뜨리지 않았는지 확인해 보세요.' };
        }
        if (a.length === b.length && a.length > 1 && a.split('').sort().join('') === b.split('').sort().join(''))
          return { id: 'digit-order', explain: '숫자는 맞는데 자리가 바뀌었어요. 각 자리에 쓴 숫자의 순서를 확인해 보세요.' };
        if (a.length === b.length && a.slice(0, -1) === b.slice(0, -1))
          return { id: 'ones-only', explain: '일의 자리만 달라요. 일의 자리 계산을 다시 해 보세요.' };
        return null;
      }
    },
    /* 몫과 나머지. 값은 { q, r }. 입력은 두 칸(fields)이고, 판정에는 '몫,나머지' 문자열로 넘어온다. */
    'quotient-remainder': {
      fields: ['몫', '나머지'],
      /** '확인'을 눌렀을 때 옮겨 갈 칸(없으면 -1 → 판정). 지금 칸을 채웠고 빈칸이 남았으면 그 빈칸으로. */
      next: function (fields, at) { return fields[at] !== '' ? fields.indexOf('') : -1; },
      parse: function (raw) {
        var m = /^(\d{1,7}),(\d{1,7})$/.exec(String(raw == null ? '' : raw).replace(/\s/g, ''));
        return m ? { q: Number(m[1]), r: Number(m[2]) } : null;
      },
      equal: function (a, b) { return !!a && !!b && a.q === b.q && a.r === b.r; },
      note: function () { return null; },
      tex: function (value) { return value.q + ' \\cdots ' + value.r; },
      raw: function (value) { return value.q + ',' + value.r; },
      say: function (value) { return '몫 ' + value.q + ', 나머지 ' + value.r; },
      valid: function (value) { return !!value && Number.isSafeInteger(value.q) && Number.isSafeInteger(value.r) && value.q >= 0 && value.r >= 0; },
      common: function () { return null; }
    },
    /* 분수. 값은 { n, d }(분자, 분모. 약분하지 않은 그대로 둘 수 있다. MH.F 로 만든 Fraction 도 된다).
       입력은 분자 칸 / 분모 칸, answer.whole 이 참이면 그 앞에 대분수의 자연수 칸. 판정에는 '자연수,분자,분모' 또는 '분자,분모' 로 넘어온다.
       answer.form: 'mixed' 대분수로 써야 함 · 'improper' 자연수 부분 없이 써야 함 · 없으면 값만 같으면 됨
       answer.show: 'mixed' 이면 정답을 보여 줄 때만 대분수 꼴로 쓴다(답은 가분수로 써도 된다).
       answer.reduce: 'off' 이면 약분 안내를 하지 않는다(약분을 배우기 전 단원). 'require' 이면 기약분수로 써야 한다(덜 약분한 답은 다시 쓰게 한다). */
    fraction: {
      layout: 'fraction',
      hasWhole: function (spec) { return !!spec && (spec.whole === true || spec.form === 'mixed'); },
      fieldsOf: function (spec) { return this.hasWhole(spec) ? ['자연수', '분자', '분모'] : ['분자', '분모']; },
      /** 처음 커서가 놓일 칸: 대분수를 묻는 문제는 자연수 칸, 아니면 분자 칸 */
      start: function (spec) { return this.hasWhole(spec) && spec.form !== 'mixed' ? 1 : 0; },
      /** '확인': 자연수 칸에서는 분자 칸으로, 분자 · 분모 가운데 하나만 채웠으면 나머지 칸으로. 지금 칸이 비었으면 그대로 판정. */
      next: function (fields, at) {
        var ni = fields.length - 2, di = fields.length - 1;
        if (fields[at] === '') return -1;
        return fields[ni] === '' ? ni : fields[di] === '' ? di : -1;
      },
      /** 읽은 값: { n, d, w, pn } — n / d 가 전체 값(가분수 꼴), w 는 입력한 자연수 부분(없으면 null), pn 은 입력한 분자(없으면 null) */
      parse: function (raw) {
        var s = String(raw == null ? '' : raw).replace(/\s/g, ''), p = s.split(','), num = /^\d{1,7}$/, m;
        if (p.length === 1) {
          if (num.test(s)) return { n: Number(s), d: 1, w: Number(s), pn: null };
          if ((m = /^(\d{1,7})\/(\d{1,7})$/.exec(s))) p = [m[1], m[2]];
          else if ((m = /^(\d{1,7})\.(\d{1,6})$/.exec(s))) { var ten = 1; for (var i = 0; i < m[2].length; i++) ten *= 10; return { n: Number(m[1]) * ten + Number(m[2]), d: ten, w: null, pn: Number(m[1]) * ten + Number(m[2]) }; }
          else return null;
        }
        if (p.length === 2) p = [''].concat(p);
        if (p.length !== 3 || !p.every(function (x) { return x === '' || num.test(x); })) return null;
        var w = p[0] === '' ? null : Number(p[0]);
        if (p[1] === '' && p[2] === '') return w === null ? null : { n: w, d: 1, w: w, pn: null };
        if (p[1] === '' || p[2] === '' || Number(p[2]) === 0) return null;
        var pn = Number(p[1]), d = Number(p[2]);
        return { n: (w || 0) * d + pn, d: d, w: w, pn: pn };
      },
      valid: function (v) { return !!v && Number.isSafeInteger(v.n) && Number.isSafeInteger(v.d) && v.n >= 0 && v.d >= 1; },
      equal: function (a, b) { return this.valid(a) && this.valid(b) && MH.F(a.n, a.d).equals(MH.F(b.n, b.d)); },
      /** 값은 같은데 문제가 바라는 꼴이 아니면 다시 쓰게 할 말(기록하지 않는다) */
      redo: function (v, raw, spec) {
        var form = spec && spec.form;
        if (v.w !== null && v.pn !== null && v.pn >= v.d) return '값은 맞아요. 그런데 분수 부분이 아직 가분수예요. 자연수를 더 덜어 내 보세요.';
        if (form === 'mixed' && v.w === null && v.n >= v.d) return '값은 맞아요. 자연수와 진분수로 이루어진 대분수로 써 보세요.';
        if (form === 'improper' && v.w !== null && v.pn !== null) return '값은 맞아요. 자연수 부분 없이 가분수로 써 보세요.';
        if (spec && spec.reduce === 'require' && v.pn !== null && MH.gcd(v.pn, v.d) > 1) return '값은 같지만 더 약분할 수 있어요. 분자와 분모를 함께 나눌 수 있는 수가 더 있는지 찾아보세요.';
        return null;
      },
      /** 약분이 덜 됐으면 알려 줄 말. $ … $ 사이는 화면에서 수식으로 그린다. */
      note: function (v, raw, spec) {
        if ((spec && spec.reduce === 'off') || v.pn === null) return null;
        var g = MH.gcd(v.pn, v.d);
        return g > 1 ? '약분하면 $' + this.sayTex({ n: v.n / g, d: v.d / g, w: v.w, pn: v.pn / g }) + '$' + josaOf(v.pn / g) + '.' : null;
      },
      /** 대분수 꼴로 나눈다: { w, r } (n = w × d + r) */
      split: function (v) { var r = v.n % v.d; return { w: (v.n - r) / v.d, r: r }; },
      tex: function (v, spec) {
        var m = this.split(v);
        if (v.d === 1 || m.r === 0) return String(m.w);
        if (spec && (spec.form === 'mixed' || spec.show === 'mixed') && m.w > 0) return m.w + '\\dfrac{' + m.r + '}{' + v.d + '}';
        return '\\dfrac{' + v.n + '}{' + v.d + '}';
      },
      raw: function (v, spec) {
        var whole = this.hasWhole(spec), m = this.split(v);
        if (whole && (v.d === 1 || m.r === 0)) return m.w + ',,';
        if (spec && spec.form === 'mixed' && m.w > 0) return m.w + ',' + m.r + ',' + v.d;
        return (whole ? ',' : '') + (v.d === 1 ? v.n + ',1' : v.n + ',' + v.d);
      },
      /** '내 답' 을 책에 쓰는 모양(분자를 위, 분모를 아래)으로 보여 줄 수식. 입력한 그대로다. */
      sayTex: function (v) {
        if (v.pn === null || v.pn === undefined) return String(v.w !== undefined && v.w !== null ? v.w : v.n);
        return (v.w ? v.w : '') + '\\frac{' + v.pn + '}{' + v.d + '}';
      },
      /** '내 답' 을 글로(화면 읽기 프로그램 · 기록용): 1과 3/4, 7/4, 2 */
      say: function (v) {
        if (v.pn === null || v.pn === undefined) return v.w !== undefined && v.w !== null ? String(v.w) : v.n + '/' + v.d;
        return (v.w ? MH.josa(v.w, '과/와') + ' ' : '') + v.pn + '/' + v.d;
      },
      common: function (input, answer) {
        if (input.n > 0 && answer.n > 0 && input.n * answer.n === input.d * answer.d && input.n !== input.d)
          return { id: 'swapped', explain: '분자와 분모를 바꿔 썼어요. 분모(아래)는 전체를 똑같이 나눈 수, 분자(위)는 그 가운데 몇 개인지를 나타내요.' };
        return null;
      }
    }
  };
  /* 소수. 값은 { n, p }: n ÷ 10^p (MH.dec 참고). 입력은 숫자 키패드 + 소수점 키로 친 문자열('3.25').
     값이 같으면 정답(0.50 = 0.5). 끝에 0 을 붙여 썼으면 알려 주기만 한다(answer.zeros: 'off' 로 끌 수 있다). */
  MH.kinds.decimal = {
    layout: 'decimal',
    parse: function (raw) {
      var m = /^(\d{1,7})(?:\.(\d{0,4}))?$/.exec(String(raw == null ? '' : raw).trim());
      if (!m) return null;
      var f = m[2] || '';
      return { n: Number(m[1] + f), p: f.length };
    },
    valid: function (v) { return !!v && Number.isSafeInteger(v.n) && v.n >= 0 && Number.isInteger(v.p) && v.p >= 0 && v.p <= 6; },
    equal: function (a, b) { return this.valid(a) && this.valid(b) && a.n * MH.pow10(b.p) === b.n * MH.pow10(a.p); },
    note: function (v, raw, spec) {
      if ((spec && spec.zeros === 'off') || v.p === 0 || v.n % 10 !== 0) return null;
      var d = MH.dec(v.n, v.p);
      return '소수점 아래 끝의 0은 쓰지 않아도 돼요: ' + MH.decStr(d.n, d.p) + '.';
    },
    tex: function (v) { return MH.decStr(v.n, v.p); },
    raw: function (v) { return MH.decStr(v.n, v.p); },
    /** '내 답' 은 입력한 그대로(끝의 0 도) 보여 준다 */
    say: function (v) { return MH.decStr(v.n, v.p, true); },
    common: function (input, answer) {
      var P = Math.max(input.p, answer.p), A = input.n * MH.pow10(P - input.p), B = answer.n * MH.pow10(P - answer.p);
      if (A === 0 || B === 0) return null;
      for (var k = 1; k <= 4; k++) {
        if (A === B * MH.pow10(k) || A * MH.pow10(k) === B)
          return { id: 'point-shift', explain: '숫자는 맞는데 소수점의 자리가 달라요. 소수점을 어느 자리 뒤에 찍어야 하는지 다시 확인해 보세요.' };
      }
      var d = Math.abs(A - B);
      for (var i = 0, t = 1; t <= d; i++, t *= 10) {
        if (d === t) {
          var name = i >= P ? MH.place(i - P) + '의 자리' : MH.decPlace(P - i);
          return { id: 'place-diff', explain: name + '가 1만큼 달라요. 그 자리로 받아올리거나 받아내린 수를 빠뜨리지 않았는지 확인해 보세요.' };
        }
      }
      return null;
    }
  };
  /* 보기 고르기. 값은 보기의 글자 그대로('>', '=', '<' …). 보기 목록은 유형의 answer.options(배열, 또는 (v, ctx) 를 받는 함수)에 적는다.
     화면에는 숫자 키패드 대신 보기 단추가 나온다. */
  MH.kinds.choice = {
    layout: 'choice',
    parse: function (raw) { var s = String(raw == null ? '' : raw).trim(); return s === '' || s.length > 12 ? null : s; },
    equal: function (a, b) { return typeof a === 'string' && a === b; },
    note: function () { return null; },
    valid: function (value) { return typeof value === 'string' && value.length > 0; },
    tex: function (value) { return value; },
    raw: function (value) { return value; },
    say: function (value) { return value; },
    common: function () { return null; }
  };
  /* 소인수분해. 값은 { f: [2, 2, 3, 7] }(곱해진 수의 목록. 순서는 상관없다).
     입력은 숫자 키패드 + × 키 + 지수 키로 친 문자열: '2×2×3×7' 이나 '2^2×3×7'. 판정은 곱해진 수의 목록이 같은지로 한다.
     소수가 아닌 수(4, 1 …)가 섞인 답도 읽기는 하고 오답으로 판정해서, 어디가 틀렸는지 알려 준다.
     같은 수를 여러 번 곱해 썼으면(2×2×3) 정답으로 하고 거듭제곱으로 쓰는 법을 알려 준다(answer.powers: 'off' 로 끈다). */
  function groupFactors(f) {
    var out = [];
    f.slice().sort(function (a, b) { return a - b; }).forEach(function (x) {
      var last = out[out.length - 1];
      if (last && last[0] === x) last[1]++; else out.push([x, 1]);
    });
    return out;
  }
  function powersTex(pairs) { return pairs.map(function (t) { return t[1] === 1 ? String(t[0]) : t[0] + '^{' + t[1] + '}'; }).join(' \\times '); }
  function productOf(f) { var x = 1; for (var i = 0; i < f.length && x <= 1e12; i++) x *= f[i]; return x; }
  function isPrimeNumber(n) { if (n < 2) return false; for (var d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; }
  MH.kinds.factors = {
    layout: 'factors',
    placeholder: '× 와 지수 키로 써요',
    parse: function (raw) {
      var s = String(raw == null ? '' : raw).replace(/\s/g, '').replace(/[x*]/gi, '×').replace(/×+$/, '');
      if (s === '') return null;
      var parts = s.split('×'), f = [], t = [];
      for (var i = 0; i < parts.length; i++) {
        var m = /^(\d{1,6})(?:\^(\d{1,2}))?$/.exec(parts[i]);
        if (!m) return null;
        var base = Number(m[1]), e = m[2] === undefined ? 1 : Number(m[2]);
        if (base < 1 || e < 1 || e > 20 || f.length + e > 40) return null;
        t.push([base, e]);
        for (var k = 0; k < e; k++) f.push(base);
      }
      return { f: f, t: t };
    },
    valid: function (v) { return !!v && Array.isArray(v.f) && v.f.length >= 1 && v.f.every(function (x) { return Number.isSafeInteger(x) && x >= 1; }); },
    equal: function (a, b) {
      if (!this.valid(a) || !this.valid(b) || a.f.length !== b.f.length) return false;
      var x = a.f.slice().sort(function (p, q) { return p - q; }), y = b.f.slice().sort(function (p, q) { return p - q; });
      return x.every(function (n, i) { return n === y[i]; });
    },
    /** 같은 수를 따로따로 곱해 썼으면 거듭제곱으로 쓰는 법을 알려 준다 */
    note: function (v, raw, spec) {
      if ((spec && spec.powers === 'off') || !v.t) return null;
      var seen = {}, twice = v.t.some(function (t) { if (seen[t[0]]) return true; seen[t[0]] = 1; return false; });
      return twice ? '같은 수를 여러 번 곱할 때는 거듭제곱으로 써요: $' + this.tex(v) + '$.' : null;
    },
    tex: function (v) { return powersTex(groupFactors(v.f)); },
    raw: function (v) { return groupFactors(v.f).map(function (t) { return t[1] === 1 ? String(t[0]) : t[0] + '^' + t[1]; }).join('×'); },
    /** '내 답' 은 입력한 모양 그대로 */
    sayTex: function (v) { return v.t ? powersTex(v.t) : this.tex(v); },
    say: function (v) { return (v.t || groupFactors(v.f)).map(function (t) { return t[1] === 1 ? String(t[0]) : t[0] + '의 ' + t[1] + '제곱'; }).join(' × '); },
    /** 입력 중인 글자를 답 칸에 그릴 수식으로: '2^3×3^' → 2^{3} \times 3^{\square} */
    show: function (raw) {
      return String(raw).split('×').map(function (p) { var q = p.split('^'); return q.length > 1 ? q[0] + '^{' + (q[1] === '' ? '\\square' : q[1]) + '}' : p; }).join(' \\times ');
    },
    common: function (input, answer) {
      var want = productOf(answer.f), got = productOf(input.f), J = MH.josa;
      var bad = input.f.filter(function (x) { return x > 1 && !isPrimeNumber(x); })[0];
      if (got === want && input.f.indexOf(1) >= 0)
        return { id: 'has-one', explain: '1은 소수가 아니에요. 소인수분해에는 소수만 써요. 1은 빼고 쓰세요.' };
      if (got === want && bad)
        return { id: 'not-prime', explain: J(bad, '은/는') + ' 소수가 아니에요. ' + J(bad, '을/를') + ' 더 작은 소수들의 곱으로 나누어 쓰세요.' };
      if (got !== want && got <= 1e12)
        return { id: 'wrong-product', explain: '쓴 수들을 모두 곱하면 ' + J(got, '이/가') + ' 돼요. ' + J(want, '이/가') + ' 되어야 해요. 빠뜨리거나 더 쓴 수가 없는지, 지수는 맞는지 확인해 보세요.' };
      return null;
    }
  };
  /** 그 문제의 보기 목록 */
  MH.optionsOf = function (problem) {
    var o = MH.types[problem.type].answer.options;
    return typeof o === 'function' ? o(problem.v, problem.ctx) : o;
  };
  function josaOf(n) { return MH.josa(n, '이에요/예요').slice(String(n).length); }

  /** 그 문제에서 실제로 쓸 수 있는 실수 목록: [{ id, value, explain }]
      실수의 오답이 정답과 같거나 답이 될 수 없는 값이면 건너뛴다. */
  MH.mistakesFor = function (problem) {
    var def = MH.types[problem.type], kind = MH.kinds[def.answer.kind], out = [];
    def.mistakes.forEach(function (m) {
      if (!m.wrong) return;
      var w = m.wrong(problem.v, problem.ctx);
      if (w == null || !kind.valid(w) || kind.equal(w, problem.answer)) return;
      out.push({ id: m.id, value: w, explain: m.explain(problem.v, problem.ctx) });
    });
    return out;
  };

  /** 정답 판정. 결과: { verdict: 'correct' | 'correct-note' | 'wrong' | 'invalid', note, mistake: { id, explain } | null, value }
      invalid 에 note 가 있으면 "값은 맞지만 꼴을 바꿔 다시 쓰세요"라는 뜻이다. */
  MH.judge = function (problem, raw) {
    var def = MH.types[problem.type], kind = MH.kinds[def.answer.kind];
    var value = kind.parse(raw, def.answer);
    if (value === null) return { verdict: 'invalid', note: null, mistake: null, value: null };
    if (kind.equal(value, problem.answer)) {
      /* 값은 같지만 문제가 바라는 꼴이 아니면(대분수로 쓰라는데 가분수로 씀) 기록하지 않고 다시 쓰게 한다 */
      var redo = kind.redo ? kind.redo(value, raw, def.answer) : null;
      if (redo) return { verdict: 'invalid', note: redo, mistake: null, value: value };
      var note = kind.note(value, raw, def.answer);
      return { verdict: note ? 'correct-note' : 'correct', note: note, mistake: null, value: value };
    }
    var found = null, usable = {};
    MH.mistakesFor(problem).forEach(function (m) { usable[m.id] = m; });
    /* ① 그 유형의 흔한 실수를 적힌 순서대로 본다. wrong: 그 실수가 만드는 오답과 같은가 · match: 입력을 직접 보고 판단
       ② 없으면 답 형식의 공통 실수(유형이 answer.common: false 로 끌 수 있다) */
    def.mistakes.forEach(function (m) {
      if (found) return;
      if (m.match) { if (m.match(problem.v, raw, problem.ctx)) found = { id: m.id, explain: m.explain(problem.v, problem.ctx, value) }; }
      else if (usable[m.id] && kind.equal(usable[m.id].value, value)) found = { id: m.id, explain: usable[m.id].explain };
    });
    if (!found && def.answer.common !== false) found = kind.common(value, problem.answer);
    return { verdict: 'wrong', note: null, mistake: found, value: value };
  };
})();
