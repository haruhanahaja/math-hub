/* B17 제곱근과 실수 — 제곱근의 뜻, 무리수, 실수의 대소 관계
   유형(쉬운 것부터): B17.root 제곱근 구하기(보기 고르기) · B17.value 근호가 든 수의 값(키패드, 분수)
                     · B17.simplify 문자가 든 √(a²) 꼴 간단히 하기(보기 고르기) · B17.irrational 유리수와 무리수(보기 고르기)
                     · B17.between 제곱근의 어림(키패드, 자연수) · B17.compare 실수의 대소 관계(보기 고르기)
   답이 수 하나이면 키패드, 답이 ± 가 붙은 수 · 식 · 개념 판단이면 보기 고르기다.
   무리수의 값은 소수로 계산하지 않는다. 대소는 모두 제곱한 정수끼리 견줘서 정한다(부동소수점을 쓰지 않는다).
   검산: 답을 만든 계산과 따로, 제곱해서 원래 수가 되는지 · 식에 값을 넣어 같은지(MH.alg.ev)를 다시 본다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, order4 = A.order4, gcd = MH.gcd, abs = Math.abs, isInt = Number.isInteger;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!(q && ok(q)) && ++i < 150); return q; };
  var take = function (r, list, n) { var a = list.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(r.int(0, a.length - 1), 1)[0]); return out; };

  /* ── 분수 ── */
  var rat = function (n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(abs(n), d) || 1; return { n: n / g, d: d / g }; };
  var R = function (n) { return { n: n, d: 1 }; };
  var neg = function (a) { return { n: -a.n, d: a.d }; };
  var same = function (a, b) { return !!a && !!b && a.n === b.n && a.d === b.d; };
  var radd = function (a, b) { return rat(a.n * b.d + b.n * a.d, a.d * b.d); };
  var rmul = function (a, b) { return rat(a.n * b.n, a.d * b.d); };
  var rdiv = function (a, b) { return rat(a.n * b.d, a.d * b.n); };
  var fr = function (r) { return (r.n < 0 ? '-' : '') + (r.d === 1 ? String(abs(r.n)) : '\\dfrac{' + abs(r.n) + '}{' + r.d + '}'); };
  var frp = function (r) { return r.n < 0 ? '(' + fr(r) + ')' : fr(r); };
  /* ── 제곱근 ── */
  var isq = function (n) { var k = 0; while ((k + 1) * (k + 1) <= n) k++; return k; };   /* √n 의 정수 부분 */
  var sq = function (n) { var k = isq(n); return k * k === n; };
  var nonsq = function (r, lo, hi) { var n; do { n = r.int(lo, hi); } while (sq(n)); return n; };
  var sr = function (t) { return '\\sqrt{' + t + '}'; };
  var F = function (n, d) { return MH.F(n, d || 1); };

  /* ── 틀: 보기 고르기 / 수 하나 (B15 · B16 과 같은 틀) ── */
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return p.options || v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) {
      var p = P(v), list;
      if (!p || p.check !== true || p.wrong.length !== 3) return false;
      list = all(p);
      /* 답이 수 하나인 보기일 때: 문제에 없는 그 수를 힌트가 말하면 안 된다 */
      if (/^\d+$/.test(p.ans) && nums((p.tex || '') + ' ' + p.text).indexOf(p.ans) < 0 && nums(p.hints.join(' ')).indexOf(p.ans) >= 0) return false;
      return list.every(function (t, i) { return list.indexOf(t) === i && t.length <= 40; });
    };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B17', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; return out; },
      solve: function (v) { return P(v).ans; },
      verify: function (v, ans) { return good(v) && ans === P(v).ans && options(v).indexOf(ans) >= 0; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: p.ans }; return out; },
      mistakes: o.ids.map(function (id) {
        var find = function (v) { return P(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
        return { id: id, wrong: function (v) { var w = find(v); return w ? w[0] : null; }, explain: function (v) { var w = find(v); return w ? w[2] : ''; } };
      })
    });
  };
  /** o.kind: 'rational'(분수) | 'int'(자연수). build(q) → { text, tex, ans: { n, d }, hints, steps, wrong: { 실수 id: 수 | { n, d } }, check } */
  var valueQ = function (o) {
    var lastQ = null, lastP = null, K = o.kind;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (r) { return K === 'rational' ? { n: r.n, d: r.d } : r.n; };
    var leak = function (p) {
      if (p.ans.d !== 1 || p.ans.n < 0 || (K === 'int' && p.ans.n <= 19)) return false;
      var a = String(p.ans.n);
      return nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0;
    };
    o.levels.forEach(function (lv) {
      lv.where = function (v) { var p = P(v); return !!p && !!p.ans && p.ans.n !== 0 && (K === 'rational' || (p.ans.d === 1 && p.ans.n > 0)) && p.check === true && !leak(p); };
    });
    MH.defineType({
      id: o.id, unit: 'B17', version: 1, title: o.title,
      answer: { kind: K },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; return out; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v); return p.check === true && (K === 'rational' ? ans.n === p.ans.n && ans.d === p.ans.d && gcd(abs(ans.n), ans.d) === 1 : ans === p.ans.n); },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        var norm = function (x) { return x === null || x === undefined ? null : typeof x === 'number' ? (isInt(x) ? R(x) : null) : x; };
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), r = norm(p.wrong[m[0]]), i, e;
            if (!r || same(r, p.ans) || (K === 'rational' ? same(r, neg(p.ans)) : r.d !== 1 || r.n <= 0)) return null;   /* 부호만 반대인 답은 공통 실수(sign)가 맡는다 */
            for (i = 0; i < o.mistakes.length && o.mistakes[i][0] !== m[0]; i++) { e = norm(p.wrong[o.mistakes[i][0]]); if (same(e, r)) return null; }
            return val(r);
          },
          explain: function () { return m[1]; } };
      })
    });
  };

  /* ── B17.root 제곱근 구하기 ────────────────────────── */
  var ROOT = '어떤 수를 제곱해서 $a$가 될 때, 그 수를 $a$의 제곱근이라고 해요. 정사각형 타일의 넓이를 알 때 한 변의 길이를 거꾸로 찾는 것과 같아요. 다만 수에서는 음수도 제곱하면 양수가 돼요. 그래서 양수의 제곱근은 양수 하나와 음수 하나, 모두 두 개예요.';
  var rootBuild = function (q) {
    var k = q.k, N = k * k, PM = '\\pm ', shown, ans, wrong, text, h2, stepTex, chk = true, m, d1, d2, third;
    var W_POS = '양의 제곱근만 답했어요. 음수도 제곱하면 양수가 돼요. 양수의 제곱근은 양수와 음수, 두 개예요.';
    var W_NEG = '음의 제곱근만 답했어요. 양수를 제곱해도 같은 수가 돼요. 양수의 제곱근은 양수와 음수, 두 개예요.';
    var W_SQ = '제곱근을 구하지 않고 거꾸로 제곱했어요. 제곱근은 "제곱해서 이 수가 되는 수"예요. 제곱하기 전의 수를 찾아요.';
    var W_HALF = '2로 나눴어요. 제곱근은 반으로 나눈 수가 아니에요. 같은 수를 두 번 곱해서 이 수가 되는 수를 찾아요.';
    var W_ALL = '제곱근 두 개를 모두 답했어요. 이 문제는 그 가운데 하나만 묻고 있어요. "제곱근 $a$"는 $\\sqrt{a}$, 곧 양의 제곱근 하나를 뜻해요.';
    var W_SIGN = '부호가 반대예요. 양의 제곱근은 양수, 음의 제곱근은 음수예요. "제곱근 $a$"는 양의 제곱근이에요.';
    var half = function (sign, n) { return [sign + (n % 2 === 0 ? n / 2 : '\\dfrac{' + n + '}{2}'), 'halved', W_HALF]; };
    var other = function (sign, n) { return n / 2 !== k ? half(sign, n) : [sign + n * n, 'squared', W_SQ]; };
    if (q.kind === 'int') {
      shown = String(N); ans = PM + k; text = '$' + shown + '$의 제곱근을 고르세요.';
      wrong = [[String(k), 'positive-only', W_POS], other(PM, N), ['-' + k, 'negative-only', W_NEG]];
      stepTex = k + '^{2} = ' + N + ',\\quad (-' + k + ')^{2} = ' + N;
      h2 = '같은 수를 두 번 곱해서 $' + N + '$' + pj(N, '이/가') + ' 되는 수를 찾아요. 구구단을 떠올리거나, 작은 수부터 차례로 제곱해 봐요. 양수 하나를 찾았으면 끝이 아니에요. 그 수에 $-$를 붙인 음수도 제곱하면 똑같이 $' + N + '$' + pj(N, '이/가') + ' 돼요.';
    } else if (q.kind === 'frac') {
      d1 = q.p * q.p; d2 = q.q * q.q; shown = '\\dfrac{' + d1 + '}{' + d2 + '}'; ans = PM + '\\dfrac{' + q.p + '}{' + q.q + '}'; text = '$' + shown + '$의 제곱근을 고르세요.';
      wrong = [['\\dfrac{' + q.p + '}{' + q.q + '}', 'positive-only', W_POS], [PM + '\\dfrac{' + q.p + '}{' + d2 + '}', 'numer-only', '분모는 그대로 두었어요. 분수를 제곱하면 분자와 분모가 각각 제곱돼요. 그래서 제곱근도 분자와 분모에서 각각 구해요.'], ['-\\dfrac{' + q.p + '}{' + q.q + '}', 'negative-only', W_NEG]];
      stepTex = '\\left(\\dfrac{' + q.p + '}{' + q.q + '}\\right)^{2} = ' + shown;
      h2 = '분수를 제곱하면 분자는 분자끼리, 분모는 분모끼리 곱해져요. 그래서 거꾸로 갈 때도 따로 생각해요. 제곱해서 분자 $' + d1 + '$' + pj(d1, '이/가') + ' 되는 수와, 제곱해서 분모 $' + d2 + '$' + pj(d2, '이/가') + ' 되는 수를 각각 찾아 분수로 써요. 음수 쪽도 잊지 않아요.';
      chk = gcd(q.p, q.q) === 1 && q.q > 1;
    } else if (q.kind === 'dec') {
      shown = MH.decStr(N, 2); ans = PM + MH.decStr(k, 1); text = '$' + shown + '$의 제곱근을 고르세요.';
      wrong = [[MH.decStr(k, 1), 'positive-only', W_POS], [PM + MH.decStr(k, 2), 'point-wrong', '소수점의 자리가 틀렸어요. 소수 한 자리 수를 제곱하면 소수 두 자리 수가 돼요. 거꾸로, 소수 두 자리 수의 제곱근은 소수 한 자리 수예요.'], ['-' + MH.decStr(k, 1), 'negative-only', W_NEG]];
      stepTex = MH.decStr(k, 1) + '^{2} = ' + shown;
      h2 = '소수는 분수로 바꿔 생각하면 쉬워요. $' + shown + '$' + pj(N, '은/는') + ' 분모가 100인 분수예요. 분자 $' + N + '$' + pj(N, '과/와') + ' 분모 100의 제곱근을 각각 찾으면 분모가 10인 분수가 나와요. 그것을 다시 소수로 써요. 소수점의 자리에 주의해요.';
      chk = k % 10 !== 0;
    } else if (q.kind === 'sym') {
      shown = String(q.n); ans = PM + sr(q.n); text = '$' + shown + '$의 제곱근을 고르세요.';
      wrong = [[sr(q.n), 'positive-only', W_POS], half(PM, q.n), ['-' + sr(q.n), 'negative-only', W_NEG]];
      stepTex = '(' + sr(q.n) + ')^{2} = ' + q.n + ',\\quad (-' + sr(q.n) + ')^{2} = ' + q.n;
      h2 = '제곱해서 $' + q.n + '$' + pj(q.n, '이/가') + ' 되는 자연수는 없어요. 이럴 때 쓰려고 만든 기호가 근호 $\\sqrt{\\ }$예요. 양의 제곱근은 근호를 씌워서 쓰고, 음의 제곱근은 그 앞에 $-$를 붙여요. 둘을 한꺼번에 쓸 때는 $\\pm$ 기호를 써요.';
      chk = !sq(q.n);
    } else if (q.kind === 'of-root') {
      m = N; shown = sr(m * m); ans = PM + k; text = '$' + shown + '$의 제곱근을 고르세요.';
      wrong = [[PM + m, 'root-not-taken', '근호 안의 수의 제곱근을 답했어요. 먼저 $' + shown + '$의 값을 구해야 해요. 문제는 그 값의 제곱근을 묻고 있어요. 제곱근을 두 번 구하는 문제예요.'], [String(k), 'positive-only', W_POS], [String(m), 'value-only', '$' + shown + '$의 값만 답했어요. 문제는 그 값의 제곱근을 묻고 있어요. 한 번 더 제곱근을 구하고, 양수와 음수를 모두 써요.']];
      stepTex = shown + ' = ' + m + ',\\quad (\\pm ' + k + ')^{2} = ' + m;
      h2 = '두 걸음으로 나눠요. 먼저 $' + shown + '$의 값을 구해요. 근호는 양의 제곱근이니 양수 하나가 나와요. 그다음 그 값의 제곱근을 구해요. 이번에는 "제곱근"이라고 물었으니 양수와 음수 두 개예요. 근호 안의 수 $' + m * m + '$의 제곱근을 바로 답하면 안 돼요.';
    } else {
      /* named: "제곱근 N" · pos / neg: "N 의 양의(음의) 제곱근" → 하나만 답한다 */
      m = q.kind === 'neg' ? '-' : ''; shown = String(N); ans = m + k;
      text = q.kind === 'named' ? '제곱근 $' + N + '$의 값을 고르세요.' : '$' + N + '$의 ' + (q.kind === 'neg' ? '음' : '양') + '의 제곱근을 고르세요.';
      third = other(m, N);
      wrong = [[PM + k, 'all-roots', W_ALL], [(m ? '' : '-') + k, 'wrong-sign', W_SIGN], third];
      stepTex = (m ? '-' : '') + sr(N) + ' = ' + ans;
      h2 = (q.kind === 'named' ? '"$' + N + '$의 제곱근"과 "제곱근 $' + N + '$"은 다른 말이에요. 앞의 것은 제곱해서 $' + N + '$' + pj(N, '이/가') + ' 되는 수 모두(두 개)이고, 뒤의 것은 $' + sr(N) + '$, 곧 양의 제곱근 하나예요.' : '$' + N + '$의 제곱근은 양수와 음수 두 개가 있어요. 이 문제는 그 가운데 ' + (q.kind === 'neg' ? '음수' : '양수') + ' 쪽 하나만 묻고 있어요.') + ' 같은 수를 두 번 곱해 $' + N + '$' + pj(N, '이/가') + ' 되는 수를 찾은 다음, 부호를 문제에 맞게 정해요.';
    }
    return { text: text, ans: ans, wrong: wrong, check: chk && k >= 1,
      steps: [{ say: q.kind === 'of-root' ? '먼저 근호의 값을 구하고, 그 값의 제곱근을 찾아요.' : q.kind === 'sym' ? '제곱해서 이 수가 되는 자연수가 없으니 근호를 써서 나타내요.' : '제곱해서 $' + shown + '$' + (q.kind === 'frac' ? '이' : pj(N, '이/가')) + ' 되는 수를 찾아요.', tex: stepTex },
        { say: q.kind === 'named' || q.kind === 'pos' || q.kind === 'neg' ? '문제에서 묻는 한 개만 답해요.' : '양수와 음수 두 개를 $\\pm$ 기호로 한꺼번에 써요.', tex: ans }],
      hints: [ROOT, h2, '① 제곱해서 그 수가 되는 양수를 먼저 찾아요. ② 그 수에 $-$를 붙인 음수도 제곱근이에요. ③ "~의 제곱근"이라고 물으면 둘을 $\\pm$ 기호로 함께 답해요. ④ "제곱근 ~", "양의 제곱근", "음의 제곱근"처럼 하나만 물으면 그 하나만 답해요.'] };
  };
  var okRoot = function (q) { var p = rootBuild(q); return !!p && p.check; };
  choiceQ({
    id: 'B17.root', title: '제곱근 구하기', ids: ['positive-only', 'negative-only', 'halved', 'squared', 'numer-only', 'point-wrong', 'root-not-taken', 'value-only', 'all-roots', 'wrong-sign'], build: rootBuild,
    levels: [
      { name: '자연수의 제곱근', minDistinct: 15, vars: { q: sampler(function (r) { return { kind: 'int', k: r.int(2, 20), o: order4(r) }; }) } },
      { name: '분수 · 소수의 제곱근', minDistinct: 60, vars: { q: sampler(function (r) {
          return until(function () { return r.int(0, 3) ? { kind: 'frac', k: 1, p: r.int(1, 12), q: r.int(2, 12), o: order4(r) } : { kind: 'dec', k: r.int(1, 19), o: order4(r) }; }, okRoot);
        }) } },
      { name: '근호를 써서 나타내기 · 하나만 묻는 말', minDistinct: 100, vars: { q: sampler(function (r) {
          return until(function () { var t = r.pick(['sym', 'sym', 'of-root', 'named', 'pos', 'neg']); return t === 'sym' ? { kind: t, k: 1, n: nonsq(r, 2, 99), o: order4(r) } : { kind: t, k: t === 'of-root' ? r.int(2, 6) : r.int(2, 20), o: order4(r) }; }, okRoot);
        }) } }
    ]
  });

  /* ── B17.value 근호가 든 수의 값 ────────────────────── */
  var VALUE = '$\\sqrt{a}$는 "제곱해서 $a$가 되는 양수"예요. 넓이가 $a$인 정사각형의 한 변의 길이라고 생각하면 돼요. 길이이니 음수가 될 수 없어요. 음의 제곱근은 앞에 $-$를 따로 붙여 $-\\sqrt{a}$로 써요. 그래서 근호 기호 하나의 값은 언제나 0 이상이에요.';
  var atomTex = function (a) {
    var s = a.neg ? '-' : '';
    if (a.t === 'sq') return s + sr(a.k * a.k);
    if (a.t === 'fr') return s + sr('\\dfrac{' + a.p * a.p + '}{' + a.q * a.q + '}');
    if (a.t === 'pw') return s + '(' + (a.inn ? '-' : '') + sr(a.n) + ')^{2}';
    return s + sr(a.inn ? '(-' + a.n + ')^{2}' : a.n + '^{2}');
  };
  var signed = function (a, v) { return a.neg ? neg(v) : v; };
  var atomVal = function (a) { return signed(a, a.t === 'sq' ? R(a.k) : a.t === 'fr' ? rat(a.p, a.q) : R(a.n)); };
  /** 흔한 실수로 얻는 값: 근호를 그냥 떼거나(sq · fr), 한 번 더 제곱한다(pw · ab) */
  var atomAlt = function (a) { return signed(a, a.t === 'sq' ? R(a.k * a.k) : a.t === 'fr' ? rat(a.p * a.p, a.q * a.q) : R(a.n * a.n)); };
  var atomSay = function (a) {
    var N = a.k * a.k, out;
    if (a.t === 'sq') out = '$' + a.k + '^{2} = ' + N + '$이니, 제곱해서 $' + N + '$' + pj(N, '이/가') + ' 되는 양수는 $' + a.k + '$' + pj(a.k, '이에요/예요') + '.';
    else if (a.t === 'fr') out = '분자와 분모를 따로 봐요. 제곱해서 $' + a.p * a.p + '$' + pj(a.p * a.p, '이/가') + ' 되는 양수와 제곱해서 $' + a.q * a.q + '$' + pj(a.q * a.q, '이/가') + ' 되는 양수를 찾아요.';
    else if (a.t === 'pw') out = '제곱근을 제곱하면 근호 안의 수로 돌아와요.' + (a.inn ? ' 괄호 안의 $-$는 제곱하면 사라져요.' : '');
    else out = (a.inn ? '근호 안을 먼저 계산하면 음수의 제곱이라 양수예요. ' : '') + '제곱한 수에 근호를 씌우면 양수인 원래 크기가 나와요.';
    return out + (a.neg ? ' 맨 앞의 $-$는 그대로 붙여요.' : '');
  };
  var atomHint = function (a) {
    var N = a.k * a.k, P2 = a.p * a.p, Q2 = a.q * a.q, t = '$' + atomTex({ t: a.t, k: a.k, p: a.p, q: a.q, n: a.n, inn: a.inn }) + '$', out;
    if (a.t === 'sq') out = t + '의 값은 제곱해서 $' + N + '$' + pj(N, '이/가') + ' 되는 양수예요. 같은 수를 두 번 곱해 $' + N + '$' + pj(N, '이/가') + ' 되는 수를 구구단이나 제곱수에서 찾아요.';
    else if (a.t === 'fr') out = '분수의 제곱근은 분자와 분모를 따로 생각해요. 제곱해서 분자 $' + P2 + '$' + pj(P2, '이/가') + ' 되는 양수와, 제곱해서 분모 $' + Q2 + '$' + pj(Q2, '이/가') + ' 되는 양수를 각각 찾아 분수로 써요.';
    else if (a.t === 'pw') out = t + '처럼 제곱근을 제곱하면 원래 수가 돼요. $' + sr(a.n) + '$' + pj(a.n, '이/가') + ' 바로 "제곱하면 $' + a.n + '$' + pj(a.n, '이/가') + ' 되는 수"이기 때문이에요.' + (a.inn ? ' 괄호 안에 $-$가 있어도 음수를 제곱하면 양수예요.' : '');
    else out = t + '에서는 근호 안의 제곱을 먼저 계산해요. ' + (a.inn ? '음수 $-' + a.n + '$' + pj(a.n, '을/를') + ' 제곱하면 양수가 돼요. ' : '') + '그 양수의 양의 제곱근을 구하는 것이라, 근호 기호의 값은 음수가 될 수 없어요.' + (a.inn ? ' 근호 안의 $-$를 그대로 밖으로 꺼내면 안 돼요.' : '');
    return out + (a.neg ? ' 맨 앞에 $-$가 있으니, 구한 값에 마지막으로 $-$를 붙여요.' : '');
  };
  var OPS = { '+': [' + ', radd], '-': [' - ', function (a, b) { return radd(a, neg(b)); }], '*': [' \\times ', rmul], '/': [' \\div ', rdiv] };
  var valueBuild = function (q) {
    var a = q.atoms, v = a.map(atomVal), t = a.map(atomTex), two = a.length === 2, op = two ? OPS[q.op] : null, ans, tex, wrong = {}, steps, hints, i, alt, chk;
    var root = function (x) { return x.t === 'sq' ? x.k * x.k === x.k * x.k && x.k >= 1 : x.t === 'fr' ? gcd(x.p, x.q) === 1 && x.q > 1 : x.n >= 2 && !sq(x.n); };
    if (!two) {
      ans = v[0]; tex = t[0]; alt = atomAlt(a[0]);
      if (a[0].t === 'sq') { wrong['root-ignored'] = alt; if ((a[0].k * a[0].k) % 2 === 0) wrong.halved = signed(a[0], R(a[0].k * a[0].k / 2)); }
      else if (a[0].t === 'fr') { wrong['numer-only'] = signed(a[0], rat(a[0].p, a[0].q * a[0].q)); wrong['root-ignored'] = alt; }
      else wrong['squared-again'] = alt;
      steps = [{ say: atomSay(a[0]), tex: tex + ' = ' + fr(ans) }, { say: '이것이 구하는 값이에요.', tex: fr(ans) }];
      hints = [VALUE, atomHint(a[0])];
      chk = true;
    } else {
      ans = op[1](v[0], v[1]); tex = t[0] + op[0] + (t[1].charAt(0) === '-' ? '(' + t[1] + ')' : t[1]);
      wrong['first-sign'] = op[1](neg(v[0]), v[1]); wrong['second-sign'] = op[1](v[0], neg(v[1]));
      i = a[0].t === 'pw' || a[0].t === 'ab' ? 0 : a[1].t === 'pw' || a[1].t === 'ab' ? 1 : -1;
      if (i >= 0) wrong['squared-again'] = i === 0 ? op[1](atomAlt(a[0]), v[1]) : op[1](v[0], atomAlt(a[1]));
      i = a[0].t === 'sq' || a[0].t === 'fr' ? 0 : a[1].t === 'sq' || a[1].t === 'fr' ? 1 : -1;
      if (i >= 0) wrong['root-ignored'] = i === 0 ? op[1](atomAlt(a[0]), v[1]) : op[1](v[0], atomAlt(a[1]));
      steps = [{ say: '앞의 수: ' + atomSay(a[0]), tex: t[0] + ' = ' + fr(v[0]) }, { say: '뒤의 수: ' + atomSay(a[1]), tex: t[1] + ' = ' + fr(v[1]) },
        { say: '구한 두 값으로 계산해요. 음수는 괄호를 쳐서 부호를 챙겨요.', tex: fr(v[0]) + op[0] + frp(v[1]) + ' = ' + fr(ans) }];
      hints = [VALUE, '앞의 수부터 봐요. ' + atomHint(a[0]), '이제 뒤의 수예요. ' + atomHint(a[1])];
      /* 검산: 분수 라이브러리로 한 번 더 계산한다 */
      chk = (function () { var x = F(v[0].n, v[0].d), y = F(v[1].n, v[1].d), z = q.op === '+' ? x.add(y) : q.op === '-' ? x.sub(y) : q.op === '*' ? x.mul(y) : x.div(y); return z.equals(F(ans.n, ans.d)); })();
    }
    /* 검산: 구한 값을 제곱하면 근호 안의 수가 되어야 한다 */
    chk = chk && a.every(function (x, j) { var w = F(v[j].n, v[j].d), w2 = w.mul(w); return root(x) && (x.t === 'sq' ? w2.equals(F(x.k * x.k)) : x.t === 'fr' ? w2.equals(F(x.p * x.p, x.q * x.q)) : x.t === 'ab' ? w2.equals(F(x.n * x.n)) : w.abs().equals(F(x.n))); });
    return { tex: tex, text: two ? '다음을 계산하세요.' : '다음 값을 구하세요.', ans: ans, wrong: wrong, steps: steps, check: chk && abs(ans.n) <= 99 && ans.d <= 20,
      hints: hints.concat(['① 근호 기호 하나하나의 값을 먼저 구해요. 근호의 값은 음수가 될 수 없어요. ② 근호나 괄호 앞의 $-$는 값을 구한 뒤에 붙여요. ③ 분수이면 분자 칸과 분모 칸에 나눠 넣어요. ' + (two ? '④ 두 값을 구한 다음에 더하기 · 빼기 · 곱하기 · 나누기를 해요.' : '④ 답이 음수이면 $-$ 키를 눌러요.')]) };
  };
  var atomOf = function (r, types) {
    var t = r.pick(types), n = r.int(0, 1) === 1;
    return t === 'sq' ? { t: t, k: r.int(1, 15), neg: n } : t === 'fr' ? { t: t, p: r.int(1, 9), q: r.int(2, 9), neg: n } : { t: t, n: nonsq(r, 2, 30), inn: r.int(0, 1) === 1, neg: n };
  };
  var okV = function (q) { var p = valueBuild(q); return !!p && p.check; };
  valueQ({
    id: 'B17.value', title: '근호가 든 수의 값', kind: 'rational', build: valueBuild,
    mistakes: [['root-ignored', '근호를 그냥 떼어 냈어요. 근호는 떼는 기호가 아니에요. 제곱해서 근호 안의 수가 되는 양수를 찾아야 해요.'],
      ['halved', '근호 안의 수를 2로 나눴어요. 제곱근은 반으로 나눈 수가 아니에요. 같은 수를 두 번 곱해서 근호 안의 수가 되는 수예요.'],
      ['numer-only', '분모는 그대로 두었어요. 분수의 제곱근은 분자와 분모에서 각각 구해요. 분모도 제곱해서 그 수가 되는 수로 바꿔요.'],
      ['squared-again', '제곱을 한 번 더 했어요. 근호와 제곱은 서로를 지워요. 제곱근을 제곱하거나 제곱한 수에 근호를 씌우면 원래 크기로 돌아와요.'],
      ['first-sign', '앞의 수의 부호가 틀렸어요. 근호 기호의 값은 음수가 될 수 없어요. 근호 안이나 괄호 안의 $-$는 제곱하면 사라지고, 맨 앞의 $-$만 남아요.'],
      ['second-sign', '뒤의 수의 부호가 틀렸어요. 근호 기호의 값은 음수가 될 수 없어요. 근호 안이나 괄호 안의 $-$는 제곱하면 사라지고, 맨 앞의 $-$만 남아요.']],
    levels: [
      { name: '제곱수의 제곱근', minDistinct: 24, vars: { q: sampler(function (r) { return { atoms: [atomOf(r, ['sq'])] }; }) } },
      { name: '분수 · 제곱근의 성질', minDistinct: 150, vars: { q: sampler(function (r) { return until(function () { return { atoms: [atomOf(r, ['fr', 'fr', 'pw', 'ab'])] }; }, okV); }) } },
      { name: '두 수의 계산', vars: { q: sampler(function (r) { return until(function () { return { atoms: [atomOf(r, ['sq', 'fr', 'pw', 'ab', 'ab']), atomOf(r, ['sq', 'fr', 'pw', 'ab', 'ab'])], op: r.pick(['+', '-', '-', '*', '/']) }; }, okV); }) } }
    ]
  });

  /* ── B17.simplify 문자가 든 √(a²) 꼴 ─────────────────── */
  var simpBuild = function (q) {
    var L = q.L, T = q.terms, lo = q.lo, hi = q.hi, both = lo !== null && hi !== null, cond = both ? lo + ' < ' + L + ' < ' + hi : lo !== null ? L + ' > ' + lo : L + ' < ' + hi;
    var xs = both ? [F(3 * lo + hi, 4), F(lo + hi, 2), F(lo + 3 * hi, 4)] : lo !== null ? [F(2 * lo + 1, 2), F(lo + 2), F(lo + 7)] : [F(2 * hi - 1, 2), F(hi - 2), F(hi - 7)];
    var inner = function (t) { return poly([[t.c, L], [t.d, '']]); };
    var innerTex = function (t) { return t.d === 0 && t.c === 1 ? L + '^{2}' : '(' + inner(t) + ')^{2}'; };
    var sgn = T.map(function (t) { var s = xs.map(function (x) { return x.mul(t.c).add(t.d).s; }); return s[0] !== 0 && s[0] === s[1] && s[1] === s[2] ? Number(s[0]) : 0; });
    var tex = T.map(function (t, i) { return (i ? (t.s < 0 ? ' - ' : ' + ') : (t.s < 0 ? '-' : '')) + sr(innerTex(t)); }).join('');
    var sum = function (f) { var c = 0, d = 0; T.forEach(function (t, i) { var k = t.s * f(i); c += k * t.c; d += k * t.d; }); return [c, d]; };
    var show = function (cd) { return poly([[cd[0], L], [cd[1], '']]); };
    var truth = sum(function (i) { return sgn[i]; }), ans = show(truth), wrong, steps, env = function (x) { var e = {}; e[L] = x; return e; };
    var real = function (x) { var z = F(0); T.forEach(function (t) { z = z.add(x.mul(t.c).add(t.d).abs().mul(t.s)); }); return z; };
    var differs = function (o) { return /pm/.test(o) || xs.some(function (x) { return !A.ev(o, env(x)).equals(real(x)); }); };
    var W_SQ = '근호를 벗기지 않고 제곱만 남겼어요. 근호와 제곱은 서로를 지워요. 근호를 벗기면 제곱도 함께 사라져요.';
    if (sgn.indexOf(0) >= 0) return null;
    if (T.length === 1) {
      var t0 = T[0], W_OPP = sgn[0] > 0 ? '근호 안에서 제곱되는 식 $' + inner(t0) + '$의 값이 양수인데 부호를 바꿔 꺼냈어요. 양수는 그대로 꺼내요. 조건($' + cond + '$)을 다시 봐요.' : '근호 안에서 제곱되는 식 $' + inner(t0) + '$의 값이 음수인데 그대로 꺼냈어요. 근호의 값은 음수가 될 수 없어요. 음수는 $-$를 붙여 부호를 바꿔서 꺼내요.';
      wrong = [[show([-truth[0], -truth[1]]), 'opposite', W_OPP],
        t0.d === 0 ? [(t0.s < 0 ? '-' : '') + (t0.c * t0.c === 1 ? '' : t0.c * t0.c) + L + '^{2}', 'squared', W_SQ] : [(t0.s < 0 ? '-' : '') + innerTex(t0), 'squared', W_SQ],
        t0.d === 0 ? ['\\pm ' + poly([[abs(t0.c), L]]), 'pm', '$\\pm$ 기호를 붙였어요. 근호 기호는 양의 제곱근 하나만 뜻해요. 조건($' + cond + '$)을 보고 음수가 아닌 쪽 하나를 골라요.'] : [show([truth[0], -truth[1]]), 'const-sign', '상수항의 부호가 틀렸어요. 부호를 바꿔 꺼낼 때는 괄호 안의 두 항 모두의 부호를 바꿔요. 부호를 바꾸지 않을 때는 두 항 모두 그대로 둬요.']];
      steps = [{ say: '조건 $' + cond + '$에서 근호 안에서 제곱되는 식의 부호를 알아봐요.', tex: inner(t0) + (sgn[0] > 0 ? ' > 0' : ' < 0') },
        { say: (sgn[0] > 0 ? '양수이니 그대로 꺼내요.' : '음수이니 $-$를 붙여 부호를 바꿔 꺼내요.') + (t0.s < 0 ? ' 근호 앞의 $-$는 그대로 붙여요.' : ''), tex: tex + ' = ' + ans }];
    } else {
      wrong = [[show(sum(function () { return 1; })), 'both-positive', '두 근호를 모두 그대로 벗겼어요. 조건 $' + cond + '$에서 제곱되는 식이 음수인 쪽이 있어요. 그쪽은 $-$를 붙여 부호를 바꿔서 꺼내요.'],
        [show(sum(function () { return -1; })), 'both-negative', '두 근호를 모두 부호를 바꿔 벗겼어요. 조건 $' + cond + '$에서 제곱되는 식이 양수인 쪽이 있어요. 그쪽은 그대로 꺼내요.'],
        [show([-truth[0], -truth[1]]), 'opposite', '양수인 쪽과 음수인 쪽을 거꾸로 봤어요. 조건 $' + cond + '$에 맞는 수를 하나 넣어서 괄호 안의 부호를 확인해요.']];
      steps = T.map(function (t) { return { say: '조건 $' + cond + '$에서 $' + inner(t) + '$의 부호를 알아봐요. $' + L + '$가 $' + (-t.d) + '$보다 ' + (sgn[T.indexOf(t)] > 0 ? '크니 양수예요.' : '작으니 음수예요.'), tex: inner(t) + (sgn[T.indexOf(t)] > 0 ? ' > 0' : ' < 0') }; })
        .concat([{ say: '양수인 식은 그대로, 음수인 식은 부호를 바꿔 꺼내요.', tex: tex + ' = ' + T.map(function (t, i) { return (i ? (t.s < 0 ? ' - ' : ' + ') : (t.s < 0 ? '-' : '')) + '(' + show([sgn[i] * t.c, sgn[i] * t.d]) + ')'; }).join('') }, { say: '괄호를 풀고 동류항끼리 계산해요.', tex: ans }]);
    }
    return { tex: tex, text: '$' + cond + '$일 때, 다음 식을 간단히 한 것을 고르세요.', ans: ans, wrong: wrong, steps: steps,
      check: ans !== '0' && xs.every(function (x) { return A.ev(ans, env(x)).equals(real(x)); }) && wrong.every(function (w) { return differs(w[0]); }) && (!both || lo < hi),
      hints: ['$\\sqrt{' + L + '^{2}}$의 값은 "제곱해서 $' + L + '^{2}$이 되는 수 가운데 음수가 아닌 쪽"이에요. 그래서 결과는 절대로 음수가 될 수 없어요. $' + L + '$가 양수이면 그대로 $' + L + '$이고, $' + L + '$가 음수이면 부호를 바꾼 $-' + L + '$가 답이에요. $' + L + '$가 음수일 때 $-' + L + '$는 양수라는 점이 열쇠예요. 빚 3만 원의 크기가 3만 원인 것과 같아요.',
        (T.length === 1 ? '근호 안은 $' + inner(T[0]) + '$' + '의 제곱이에요. 근호를 벗기면 $' + inner(T[0]) + '$ 또는 그 부호를 바꾼 식 가운데 음수가 아닌 쪽이 나와요. 어느 쪽인지는 조건이 정해 줘요.' : '근호가 두 개예요. 하나씩 따로 벗겨요. 근호마다 그 안에서 제곱되는 식이 양수인지 음수인지를 조건으로 판단해요.') + ' 조건 $' + cond + '$에 맞는 수를 하나 골라 $' + L + '$ 자리에 넣어 보면 괄호 안이 양수인지 음수인지 바로 알 수 있어요.',
        '① 근호 안에서 제곱되는 식을 찾아요. ② 조건을 보고 그 식이 양수인지 음수인지 정해요. ③ 양수이면 그대로, 음수이면 모든 항의 부호를 바꿔서 꺼내요. ④ 근호 앞에 $-$가 있었으면 마지막에 붙이고, 동류항끼리 정리해요.'] };
  };
  var okS = function (q) { var p = simpBuild(q); return !!p && p.check; };
  var LET = ['a', 'b', 'x'];
  var simpQ = function (r, lv) {
    return until(function () {
      var L = r.pick(LET), k, p, s;
      if (lv < 2) return { L: L, lo: lv === 0 ? 0 : null, hi: lv === 0 ? null : 0, terms: [{ s: pm(r, 1), c: nz(r, -9, 9), d: 0 }], o: order4(r) };
      if (r.int(0, 1)) { k = nz(r, -9, 9); s = r.int(0, 1) === 1; return { L: L, lo: s ? k : null, hi: s ? null : k, terms: [{ s: pm(r, 1), c: 1, d: -k }], o: order4(r) }; }
      p = nz(r, -8, 7); k = p + r.int(1, 9); if (!k) return null;
      return { L: L, lo: p, hi: k, terms: [{ s: 1, c: 1, d: -p }, { s: pm(r, 1), c: 1, d: -k }], o: order4(r) };
    }, okS);
  };
  choiceQ({
    id: 'B17.simplify', title: '문자가 든 제곱근 간단히 하기', ids: ['opposite', 'squared', 'pm', 'const-sign', 'both-positive', 'both-negative'], build: simpBuild,
    levels: [
      { name: '문자가 양수일 때', minDistinct: 80, vars: { q: sampler(function (r) { return simpQ(r, 0); }) } },
      { name: '문자가 음수일 때', minDistinct: 80, vars: { q: sampler(function (r) { return simpQ(r, 1); }) } },
      { name: '범위가 주어진 식', minDistinct: 200, vars: { q: sampler(function (r) { return simpQ(r, 2); }) } }
    ]
  });

  /* ── B17.irrational 유리수와 무리수 ──────────────────── */
  var IRR = '유리수는 (정수)/(0이 아닌 정수) 꼴의 분수로 쓸 수 있는 수예요. 정수, 유한소수, 순환소수가 모두 유리수예요. 분수로 쓸 수 없는 수가 무리수예요. 무리수를 소수로 쓰면 같은 숫자 묶음이 되풀이되지 않고 끝없이 이어져요. 유리수와 무리수를 합쳐서 실수라고 해요.';
  var numOf = function (r, kind) {
    var k, n, p, q, s = r.int(0, 1) ? '-' : '', d;
    if (kind === 'sq') { k = r.int(2, 15); return { tex: s + sr(k * k), rat: true, why: '$' + sr(k * k) + ' = ' + k + '$' + pj(k, '이에요/예요') + '. 근호 안이 제곱수라서 근호가 벗겨져요.' }; }
    if (kind === 'int') { n = r.int(2, 30); return { tex: s + n, rat: true, why: '정수는 분모가 1인 분수로 쓸 수 있어요.' }; }
    if (kind === 'frac') { do { p = r.int(1, 12); q = r.int(2, 9); } while (gcd(p, q) !== 1); return { tex: s + '\\dfrac{' + p + '}{' + q + '}', rat: true, why: '(정수)/(0이 아닌 정수) 꼴의 분수예요.' }; }
    if (kind === 'rt') { n = nonsq(r, 2, 60); return { tex: s + sr(n), rat: false, why: '제곱해서 $' + n + '$' + pj(n, '이/가') + ' 되는 유리수는 없어요. 근호가 벗겨지지 않아요.' }; }
    if (kind === 'sqfr') { do { p = r.int(1, 9); q = r.int(2, 9); } while (gcd(p, q) !== 1); return { tex: sr('\\dfrac{' + p * p + '}{' + q * q + '}'), rat: true, why: '분자와 분모가 모두 제곱수라서 근호가 벗겨져 $\\dfrac{' + p + '}{' + q + '}$' + pj(p, '이/가') + ' 돼요.' }; }
    if (kind === 'rtfr') { do { p = r.int(1, 9); q = r.int(2, 9); } while (gcd(p, q) !== 1 || (sq(p) && sq(q))); return { tex: sr('\\dfrac{' + p + '}{' + q + '}'), rat: false, why: '분자와 분모가 둘 다 제곱수인 것이 아니라서 근호가 벗겨지지 않아요.' }; }
    if (kind === 'sqdec') { do { k = r.int(2, 15); } while (k % 10 === 0); return { tex: sr(MH.decStr(k * k, 2)), rat: true, why: '$' + MH.decStr(k, 1) + '$' + pj(k, '을/를') + ' 제곱하면 $' + MH.decStr(k * k, 2) + '$' + pj(k * k, '이에요/예요') + '. 근호가 벗겨져요.' }; }
    if (kind === 'rtdec') { d = r.int(1, 9); return { tex: sr('0.' + d), rat: false, why: '소수 한 자리 수는 분모가 10인 분수예요. 10은 제곱수가 아니라서 근호가 벗겨지지 않아요. $0.' + d + '$' + pj(d, '은/는') + ' 소수 한 자리 수를 제곱한 수가 아니에요.' }; }
    if (kind === 'dec') { do { n = r.int(11, 999); } while (n % 10 === 0); return { tex: MH.decStr(n, 2), rat: true, why: '유한소수는 분모가 10, 100, …인 분수로 쓸 수 있어요.' }; }
    if (kind === 'rep') { d = r.int(1, 8); k = r.int(0, 3); return { tex: k + '.\\dot{' + d + '}', rat: true, why: '순환소수는 분수로 고칠 수 있어요. 끝없이 이어져도 유리수예요.' }; }
    if (kind === 'pi') return { tex: '\\pi', rat: false, why: '원주율은 순환하지 않는 무한소수예요.' };
    if (kind === 'pik') { k = r.int(1, 9); return { tex: '\\pi' + (r.int(0, 1) ? ' + ' : ' - ') + k, rat: false, why: '무리수에 유리수를 더하거나 빼도 순환하지 않는 무한소수 그대로예요.' }; }
    if (kind === 'rtk') { n = nonsq(r, 2, 30); k = r.int(1, 9); return { tex: sr(n) + (r.int(0, 1) ? ' + ' : ' - ') + k, rat: false, why: '무리수에 유리수를 더하거나 빼도 순환하지 않는 무한소수 그대로예요.' }; }
    return { tex: '0.1010010001\\cdots', rat: false, why: '0이 하나씩 늘어나서 같은 숫자 묶음이 되풀이되지 않아요. 순환하지 않는 무한소수예요.' };
  };
  var RAT0 = ['sq', 'sq', 'int', 'frac'], IRR0 = ['rt'], RAT1 = ['sq', 'sqfr', 'sqdec', 'dec', 'rep', 'frac'], IRR1 = ['rt', 'rtfr', 'rtdec', 'pi', 'pik', 'rtk', 'nonrep'];
  var SAYS = { T: [
      function () { return ['순환소수는 모두 유리수이다', '순환소수는 분수로 고칠 수 있어요.']; },
      function () { return ['무리수는 순환하지 않는 무한소수이다', '무리수를 소수로 쓰면 되풀이되는 묶음 없이 끝없이 이어져요.']; },
      function () { return ['유리수와 무리수를 통틀어 실수라고 한다', '실수는 유리수와 무리수를 합친 것이에요.']; },
      function () { return ['모든 정수는 유리수이다', '정수는 분모가 1인 분수로 쓸 수 있어요.']; },
      function () { return ['유한소수는 모두 유리수이다', '유한소수는 분모가 10, 100, …인 분수로 쓸 수 있어요.']; },
      function () { return ['서로 다른 두 유리수 사이에는 무리수가 있다', '수직선에서 아무리 가까운 두 수 사이에도 유리수와 무리수가 끝없이 많이 있어요.']; },
      function (r) { var n = nonsq(r, 2, 40); return ['넓이가 ' + n + '인 정사각형의 한 변의 길이는 무리수이다', '한 변의 길이는 $' + sr(n) + '$인데, $' + n + '$' + pj(n, '은/는') + ' 제곱수가 아니라서 근호가 벗겨지지 않아요.', 1]; },
      function (r) { var k = r.int(2, 10); return ['넓이가 ' + k * k + '인 정사각형의 한 변의 길이는 유리수이다', '한 변의 길이는 $' + sr(k * k) + ' = ' + k + '$' + pj(k, '이에요/예요') + '. 근호가 벗겨져요.', 1]; }
    ], F: [
      function () { return ['무한소수는 모두 무리수이다', '무한소수 가운데 순환소수는 분수로 고칠 수 있는 유리수예요.']; },
      function () { return ['근호를 쓴 수는 모두 무리수이다', '근호 안이 제곱수이면 근호가 벗겨져요. 그런 수는 유리수예요.']; },
      function () { return ['유리수는 모두 유한소수이다', '순환소수처럼 끝없이 이어지는 유리수도 있어요.']; },
      function () { return ['무리수도 정수끼리의 분수로 쓸 수 있다', '분수로 쓸 수 없는 수가 무리수예요.']; },
      function () { return ['유리수도 무리수도 아닌 실수가 있다', '실수는 유리수이거나 무리수이거나 둘 중 하나예요.']; },
      function () { return ['원주율 π는 유리수이다', '원주율은 순환하지 않는 무한소수라서 무리수예요.']; },
      function () { return ['순환소수는 무리수이다', '순환소수는 분수로 고칠 수 있는 유리수예요.']; },
      function () { return ['수직선 위에 무리수를 나타내는 점은 없다', '수직선은 유리수와 무리수에 대응하는 점들로 빈틈없이 채워져 있어요.']; },
      function (r) { var n = nonsq(r, 2, 40); return ['넓이가 ' + n + '인 정사각형의 한 변의 길이는 유리수이다', '한 변의 길이는 $' + sr(n) + '$인데, $' + n + '$' + pj(n, '은/는') + ' 제곱수가 아니라서 근호가 벗겨지지 않아요.', 1]; },
      function (r) { var k = r.int(2, 10); return ['넓이가 ' + k * k + '인 정사각형의 한 변의 길이는 무리수이다', '한 변의 길이는 $' + sr(k * k) + ' = ' + k + '$' + pj(k, '이에요/예요') + '. 근호가 벗겨져요.', 1]; }
    ] };
  var irrBuild = function (q) {
    var it = q.items, a = it[0], rest = it.slice(1), st = q.kind === 'say';
    var head = function (x) { return st ? (x.rat ? '이 말은 옳아요. ' : '이 말은 틀려요. ') : (x.rat ? '이 수는 유리수예요. ' : '이 수는 무리수예요. '); };
    return { text: st ? '다음 중 옳' + (a.rat ? '은' : '지 않은') + ' 것을 고르세요.' : '다음 중 ' + (a.rat ? '유리수' : '무리수') + '인 것을 고르세요.', ans: a.tex,
      wrong: rest.map(function (x, i) { return [x.tex, 'pick-' + (i + 1), head(x) + x.why]; }),
      check: rest.length === 3 && rest.every(function (x) { return x.rat !== a.rat; }) && (!st || it.filter(function (x) { return x.area; }).length <= 1),
      steps: [{ say: head(a) + a.why, tex: st ? '\\text{' + (a.rat ? '옳다' : '옳지 않다') + '}' : a.tex + ' : \\text{' + (a.rat ? '유리수' : '무리수') + '}' },
        { say: st ? '나머지 세 문장은 모두 ' + (a.rat ? '틀린' : '옳은') + ' 말이에요. 보기를 눌러 하나씩 이유를 확인해요.' : '나머지 세 수는 모두 ' + (a.rat ? '무리수' : '유리수') + '예요.', tex: st ? '\\text{' + (a.rat ? '옳은 것' : '옳지 않은 것') + ' 하나}' : a.tex }],
      hints: [IRR, st ? '문장에 "모두"라는 말이 있으면 조심해요. 하나라도 어긋나는 예가 있으면 틀린 말이에요. 무한소수에는 순환소수(유리수)도 있고, 근호를 쓴 수에는 근호가 벗겨지는 수(유리수)도 있어요. 정사각형의 넓이가 나오면 한 변의 길이는 그 넓이의 양의 제곱근이에요. 넓이가 제곱수인지 확인해요.'
          : '근호가 있다고 모두 무리수인 것은 아니에요. 근호 안의 수가 어떤 수의 제곱이면 근호가 벗겨져서 유리수가 돼요. 분수는 분자와 분모가 모두 제곱수인지 봐요. 소수는 분수로 고쳐서 확인해요. 소수 두 자리 수는 분모가 100이라 분자만 제곱수이면 벗겨지지만, 소수 한 자리 수는 분모가 10이라 벗겨지지 않아요.',
        st ? '① 문장을 하나씩 읽어요. ② "모두 ~이다"라는 말은 어긋나는 예가 있는지 찾아봐요. ③ 유리수: 정수 · 유한소수 · 순환소수. 무리수: 순환하지 않는 무한소수. ④ 문제가 옳은 것을 묻는지, 옳지 않은 것을 묻는지 다시 확인해요.'
          : '① 근호가 있는 수는 근호가 벗겨지는지 확인해요. ② 벗겨지면 유리수, 벗겨지지 않으면 무리수예요. ③ 근호가 없는 수 가운데 정수 · 분수 · 유한소수 · 순환소수는 유리수예요. ④ 원주율과 순환하지 않는 무한소수는 무리수예요.'] };
  };
  var irrQ = function (r, lv) {
    return until(function () {
      var wantRat = r.int(0, 1) === 1, items, pool, i, t, ok = true;
      if (lv === 2) {
        pool = function (key, n) { return take(r, SAYS[key], n).map(function (f) { var x = f(r); return { tex: x[0], rat: key === 'T', why: x[1], area: !!x[2] }; }); };
        items = pool(wantRat ? 'T' : 'F', 1).concat(pool(wantRat ? 'F' : 'T', 3));
      } else {
        t = function (rational) { return numOf(r, r.pick(rational ? (lv === 0 ? RAT0 : RAT1) : (lv === 0 ? IRR0 : IRR1))); };
        items = [t(wantRat), t(!wantRat), t(!wantRat), t(!wantRat)];
      }
      for (i = 0; i < 4; i++) if (items.some(function (x, j) { return j < i && x.tex === items[i].tex; })) ok = false;
      return ok ? { kind: lv === 2 ? 'say' : 'num', items: items, o: order4(r) } : null;
    }, function (q) { var p = irrBuild(q); return !!p && p.check; });
  };
  choiceQ({
    id: 'B17.irrational', title: '유리수와 무리수', ids: ['pick-1', 'pick-2', 'pick-3'], build: irrBuild,
    levels: [
      { name: '근호가 벗겨지는 수와 벗겨지지 않는 수', minDistinct: 2, vars: { q: sampler(function (r) { return irrQ(r, 0); }) } },
      { name: '분수 · 소수 · 원주율이 섞인 수', minDistinct: 2, vars: { q: sampler(function (r) { return irrQ(r, 1); }) } },
      { name: '옳은 말 고르기', minDistinct: 2, vars: { q: sampler(function (r) { return irrQ(r, 2); }) } }
    ]
  });

  /* ── B17.between 제곱근의 어림 ──────────────────────── */
  var BETWEEN = '$\\sqrt{7}$ 같은 무리수는 딱 떨어지는 값이 없어요. 그래도 어느 두 자연수 사이에 있는지는 알 수 있어요. 방법은 제곱수 사이에 끼우는 것이에요. $4 < 7 < 9$이니 $\\sqrt{4} < \\sqrt{7} < \\sqrt{9}$, 곧 $\\sqrt{7}$은 2와 3 사이의 수예요. 넓이가 7인 정사각형의 한 변은 넓이가 4인 것보다 길고 9인 것보다 짧다는 뜻이에요.';
  var SQS = '제곱수는 차례로 $1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225$예요.';
  var sandwich = function (n) { var f = isq(n); return f + '^{2} = ' + f * f + ' < ' + n + ' < ' + (f + 1) * (f + 1) + ' = ' + (f + 1) + '^{2}'; };
  var betweenBuild = function (q) {
    var n = q.n, f = n ? isq(n) : 0, wrong = {}, ans, text, steps, h2, chk, g, p = q.p, c;
    if (q.kind === 'floor' || q.kind === 'ceil') {
      ans = q.kind === 'floor' ? f : f + 1;
      text = '$' + sr(n) + '$보다 ' + (q.kind === 'floor' ? '작은 자연수 가운데 가장 큰 수' : '큰 자연수 가운데 가장 작은 수') + '를 구하세요.';
      wrong['other-side'] = q.kind === 'floor' ? f + 1 : f; wrong.halved = n % 2 === 0 ? n / 2 : null; wrong['root-ignored'] = q.kind === 'floor' ? n - 1 : n + 1;
      steps = [{ say: '$' + n + '$' + pj(n, '을/를') + ' 사이에 둔 이웃한 두 제곱수를 찾아요.', tex: sandwich(n) }, { say: '양수는 제곱이 클수록 크니, 제곱근도 같은 차례예요.', tex: f + ' < ' + sr(n) + ' < ' + (f + 1) },
        { say: q.kind === 'floor' ? '$' + sr(n) + '$보다 작은 자연수 가운데 가장 큰 수는 왼쪽의 수예요.' : '$' + sr(n) + '$보다 큰 자연수 가운데 가장 작은 수는 오른쪽의 수예요.', tex: String(ans) }];
      h2 = '$' + n + '$보다 작은 제곱수 가운데 가장 큰 것과, $' + n + '$보다 큰 제곱수 가운데 가장 작은 것을 찾아요. ' + SQS + ' 그 두 제곱수의 양의 제곱근이 $' + sr(n) + '$' + pj(n, '을/를') + ' 사이에 둔 이웃한 두 자연수예요. 문제에서 묻는 쪽(작은 쪽인지 큰 쪽인지)을 골라요.';
      chk = !sq(n) && f * f < n && n < (f + 1) * (f + 1);
    } else if (q.kind === 'range') {
      /* p < √x < g 인 자연수 x 의 개수 */
      g = q.g; ans = g * g - p * p - 1;
      text = '$' + p + ' < \\sqrt{x} < ' + g + '$' + pj(g, '을/를') + ' 만족하는 자연수 $x$의 개수를 구하세요.';
      wrong['endpoints-included'] = ans + 2; wrong['difference-only'] = ans + 1; wrong['no-square'] = g - p - 1;
      steps = [{ say: '세 수가 모두 양수이니 각각 제곱해도 크기의 차례가 그대로예요.', tex: p + '^{2} < x < ' + g + '^{2}' }, { say: '제곱을 계산해요.', tex: p * p + ' < x < ' + g * g },
        { say: '$' + p * p + '$보다 크고 $' + g * g + '$보다 작은 자연수는 $' + (p * p + 1) + '$부터 $' + (g * g - 1) + '$까지예요. 양 끝의 수는 들어가지 않아요.', tex: (g * g - 1) + ' - ' + (p * p + 1) + ' + 1 = ' + ans }];
      h2 = '$\\sqrt{x}$가 $' + p + '$' + pj(p, '과/와') + ' $' + g + '$ 사이에 있어요. 근호를 없애려면 세 수를 모두 제곱해요. 양수끼리는 제곱해도 크기의 차례가 바뀌지 않아요. 그러면 $x$가 어떤 두 수 사이에 있는지 나와요. 그 사이의 자연수를 세면 돼요. 부등호에 등호가 없으니 양 끝의 수는 세지 않아요.';
      chk = p >= 1 && g > p;
    } else if (q.kind === 'ints') {
      /* √n < x < √m 인 자연수 x 의 개수 */
      g = isq(q.m); ans = g - f;
      text = '$' + sr(n) + ' < x < ' + sr(q.m) + '$' + pj(q.m, '을/를') + ' 만족하는 자연수 $x$의 개수를 구하세요.';
      wrong['one-more'] = ans + 1; wrong['one-less'] = ans - 1; wrong['radicand-count'] = q.m - n - 1;
      steps = [{ say: '$' + sr(n) + '$' + pj(n, '이/가') + ' 어느 두 자연수 사이에 있는지 찾아요.', tex: f + ' < ' + sr(n) + ' < ' + (f + 1) }, { say: '$' + sr(q.m) + '$도 같은 방법으로 찾아요.', tex: g + ' < ' + sr(q.m) + ' < ' + (g + 1) },
        { say: '그 사이의 자연수는 $' + (f + 1) + '$부터 $' + g + '$까지예요.', tex: g + ' - ' + (f + 1) + ' + 1 = ' + ans }];
      h2 = '양 끝의 두 무리수가 각각 어느 자연수 사이에 있는지 먼저 알아내요. ' + SQS + ' $' + n + '$' + pj(n, '과/와') + ' $' + q.m + '$' + pj(q.m, '을/를') + ' 각각 이웃한 두 제곱수 사이에 끼워요. 그러면 $x$가 될 수 있는 가장 작은 자연수와 가장 큰 자연수가 정해져요.';
      chk = !sq(n) && !sq(q.m) && n < q.m && ans >= 1;
    } else {
      /* sum: √n + k · diff: k − √n 보다 작은 자연수 가운데 가장 큰 수 */
      c = q.k; ans = q.kind === 'sum' ? f + c : c - f - 1;
      text = '$' + (q.kind === 'sum' ? sr(n) + ' + ' + c : c + ' - ' + sr(n)) + '$보다 작은 자연수 가운데 가장 큰 수를 구하세요.';
      wrong['root-only'] = f; wrong['other-side'] = q.kind === 'sum' ? f + c + 1 : c - f; wrong['one-off'] = q.kind === 'sum' ? f + c - 1 : c - f - 2;
      steps = [{ say: '먼저 $' + sr(n) + '$' + pj(n, '이/가') + ' 어느 두 자연수 사이에 있는지 찾아요.', tex: f + ' < ' + sr(n) + ' < ' + (f + 1) },
        q.kind === 'sum' ? { say: '세 수에 똑같이 $' + c + '$' + pj(c, '을/를') + ' 더해요.', tex: (f + c) + ' < ' + sr(n) + ' + ' + c + ' < ' + (f + 1 + c) }
          : { say: '$' + c + '$에서 빼면 크기의 차례가 뒤집혀요. 큰 수를 뺄수록 남는 수가 작아요.', tex: (c - f - 1) + ' < ' + c + ' - ' + sr(n) + ' < ' + (c - f) },
        { say: '왼쪽의 자연수가 답이에요.', tex: String(ans) }];
      h2 = '근호가 있는 부분만 먼저 생각해요. $' + sr(n) + '$' + pj(n, '이/가') + ' 어느 두 자연수 사이에 있는지 제곱수로 알아내요. ' + (q.kind === 'sum' ? '그다음 그 두 자연수에 똑같이 $' + c + '$' + pj(c, '을/를') + ' 더하면 돼요. 수직선에서 전체를 오른쪽으로 옮기는 것과 같아요.' : '그다음 $' + c + '$에서 그 두 자연수를 각각 빼요. 이때 조심해요. 큰 수를 빼면 남는 수가 작아지니, 크기의 차례가 뒤집혀요. 뺀 결과 두 수 가운데 작은 쪽이 답이에요.');
      chk = !sq(n) && c >= 1;
    }
    return { text: text, ans: R(ans), wrong: wrong, steps: steps, check: chk && ans >= 1,
      hints: [BETWEEN, h2, '① 근호 안의 수를 사이에 둔 이웃한 두 제곱수를 찾아요. ② 그 두 제곱수의 양의 제곱근이 무리수의 양옆 자연수예요. ③ 더하거나 빼는 수가 있으면 양옆 자연수에도 똑같이 해요(빼는 쪽이면 차례가 뒤집혀요). ④ 문제에서 묻는 것(작은 쪽 · 큰 쪽 · 개수)을 다시 확인해요.'] };
  };
  var okB = function (q) { var p = betweenBuild(q); return !!p && p.check; };
  valueQ({
    id: 'B17.between', title: '제곱근의 어림', kind: 'int', build: betweenBuild,
    mistakes: [['other-side', '반대쪽 자연수를 답했어요. 무리수의 양옆에 있는 두 자연수 가운데, 문제에서 묻는 쪽이 작은 쪽인지 큰 쪽인지 다시 확인해요. 빼는 식에서는 크기의 차례가 뒤집혀요.'],
      ['halved', '근호 안의 수를 2로 나눴어요. 제곱근은 반으로 나눈 수가 아니에요. 제곱해서 근호 안의 수에 가까워지는 자연수를 찾아요.'],
      ['root-ignored', '근호를 못 본 것 같아요. 근호 안의 수가 아니라 그 제곱근의 크기를 따져야 해요. 이웃한 두 제곱수 사이에 끼워요.'],
      ['endpoints-included', '양 끝의 수까지 셌어요. 부등호에 등호가 없으니 양 끝의 수는 들어가지 않아요.'],
      ['difference-only', '두 수의 차를 그대로 답했어요. 사이에 있는 자연수의 개수는 양 끝을 빼야 하니 차보다 1 작아요.'],
      ['no-square', '제곱하지 않고 그대로 셌어요. $\\sqrt{x}$의 범위를 $x$의 범위로 바꾸려면 세 수를 모두 제곱해야 해요.'],
      ['one-more', '하나 더 셌어요. 양 끝의 무리수가 어느 자연수 사이에 있는지 다시 확인하고, 그 사이의 자연수를 하나씩 써 봐요.'],
      ['one-less', '하나 덜 셌어요. 가장 작은 수부터 가장 큰 수까지 셀 때는 (큰 수) − (작은 수) + 1 이에요.'],
      ['radicand-count', '근호 안의 수 사이의 자연수를 셌어요. $x$는 근호 밖에 있어요. 양 끝의 무리수가 대략 얼마인지 먼저 알아내요.'],
      ['root-only', '근호가 있는 부분만 어림하고 더하거나 빼는 수를 잊었어요. 양옆의 자연수에도 똑같이 더하거나 빼요.'],
      ['one-off', '하나 차이가 나요. 무리수를 사이에 둔 두 자연수를 다시 확인해요. 더하거나 뺀 뒤의 두 수 가운데 작은 쪽이 답이에요.']],
    levels: [
      { name: '√n 의 양옆 자연수', vars: { q: sampler(function (r) { return until(function () { return { kind: r.pick(['floor', 'floor', 'ceil']), n: nonsq(r, 2, 220) }; }, okB); }) } },
      { name: '범위에 맞는 자연수의 개수', vars: { q: sampler(function (r) {
          return until(function () { var n; if (r.int(0, 3) === 0) { n = r.int(1, 9); return { kind: 'range', p: n, g: n + r.int(1, 2) }; } n = nonsq(r, 2, 120); return { kind: 'ints', n: n, m: nonsq(r, n + 1, n + 110) }; }, okB);
        }) } },
      { name: '√n 에 수를 더하거나 뺀 수', vars: { q: sampler(function (r) {
          return until(function () { var n = nonsq(r, 2, 99), s = r.int(0, 1) === 1; return { kind: s ? 'sum' : 'diff', n: n, k: s ? r.int(1, 9) : isq(n) + r.int(2, 9) }; }, okB);
        }) } }
    ]
  });

  /* ── B17.compare 실수의 대소 관계 ────────────────────── */
  var CMP = '양수 $a$, $b$에서 $a < b$이면 $\\sqrt{a} < \\sqrt{b}$예요. 정사각형의 넓이가 넓을수록 한 변도 길다는 뜻이에요. 그래서 근호가 있는 수와 없는 수를 견줄 때는 모양을 맞춰요. 모두 제곱하거나, 모두 근호 안에 넣어서 견주면 돼요.';
  /* 수 하나: { s: 부호, key: 절댓값의 제곱 × 4 (정수), tex }. 크기는 s × key 로 견준다 */
  var cItem = function (s, t, x) {
    var m = s < 0 ? '-' : '';
    return t === 'int' ? { s: s, key: 4 * x * x, tex: m + x, sqr: String(x * x), kn: x * x, plain: true } : t === 'rt' ? { s: s, key: 4 * x, tex: m + sr(x), sqr: String(x), kn: x }
      : { s: s, key: x * x, tex: m + '\\dfrac{' + x + '}{2}', sqr: '\\dfrac{' + x * x + '}{4}', kn: x * x, plain: true };
  };
  var listBuild = function (q) {
    var it = q.items, max = q.want === 'max', ord = function (x) { return x.s * x.key; }, sorted = it.slice().sort(function (x, y) { return ord(x) - ord(y); }), a = max ? sorted[3] : sorted[0], rest = it.filter(function (x) { return x !== a; }), negAll = it.every(function (x) { return x.s < 0; }), ex;
    var why = function (x) {
      var bigger = x.key > a.key;
      return (negAll ? '이 수의 절댓값을 제곱하면 $' : '이 수를 제곱하면 $') + x.sqr + '$' + pj(x.kn, '이에요/예요') + '. 답의 수는 $' + a.sqr + '$' + pj(a.kn, '이에요/예요') + '. ' + (negAll ? '음수끼리는 절댓값이 큰 수가 더 작아요. 그래서 이 수는 답보다 ' + (bigger ? '작아요.' : '커요.') : '양수끼리는 제곱이 큰 수가 더 커요. 그래서 이 수는 답보다 ' + (bigger ? '커요.' : '작아요.'));
    };
    ex = it.filter(function (x) { return x.plain && x !== a; })[0];
    return { text: '다음 중 가장 ' + (max ? '큰' : '작은') + ' 수를 고르세요.', ans: a.tex, wrong: rest.map(function (x, i) { return [x.tex, 'pick-' + (i + 1), why(x)]; }),
      check: sorted.every(function (x, i) { return !i || ord(sorted[i - 1]) < ord(x); }) && it.some(function (x) { return !x.plain; }) && it.some(function (x) { return x.plain; }),
      steps: [{ say: '근호가 없는 수를 근호 안에 넣어 모양을 맞춰요. 제곱한 수에 근호를 씌우면 돼요.', tex: it.filter(function (x) { return x.plain; }).map(function (x) { return x.tex + ' = ' + (x.s < 0 ? '-' : '') + sr(x.sqr); }).join(',\\quad ') },
        { say: negAll ? '근호 안의 수가 클수록 절댓값이 커요. 음수는 절댓값이 클수록 작으니, 차례가 거꾸로예요.' : '근호 안의 수가 클수록 커요. 작은 수부터 차례로 놓아요.', tex: sorted.map(function (x) { return x.tex; }).join(' < ') }, { say: '가장 ' + (max ? '큰 수는 맨 오른쪽' : '작은 수는 맨 왼쪽') + '의 수예요.', tex: a.tex }],
      hints: [CMP, '보기의 수를 모두 제곱해 봐요. 근호가 있는 수는 제곱하면 근호 안의 수가 그대로 나와요. 근호가 없는 수는 그냥 제곱하고, 분수는 분자와 분모를 각각 제곱해요.' + (ex ? ' 예를 들어 보기의 $' + ex.tex.replace('-', '') + '$' + '의 제곱은 $' + ex.sqr + '$' + pj(ex.kn, '이에요/예요') + '.' : '') + (negAll ? ' 이 문제의 수는 모두 음수예요. 음수는 수직선에서 왼쪽으로 갈수록 작아요. 그래서 $-$를 뗀 수(절댓값)가 클수록 실제로는 더 작아요. 빚이 많을수록 가진 돈이 적은 것과 같아요.' : ' 제곱한 값이 큰 수가 원래도 큰 수예요.'),
        '① 보기의 수를 모두 제곱해요(음수는 $-$를 떼고 제곱해요). ② 제곱한 값을 크기 순서로 놓아요. ③ 양수는 제곱이 클수록 크고, 음수는 제곱이 클수록 작아요. ④ 문제가 가장 큰 수를 묻는지 가장 작은 수를 묻는지 확인해요.'] };
  };
  /* 식 하나: s√n + k ○ c (또는 ○ s√m + k). 참 · 거짓은 정수끼리 견줘서 정한다 */
  var stmt = function (r) {
    var f = r.pick(['A', 'A', 'B', 'C', 'D', 'E', 'G']), d = r.int(1, 7), k = r.int(1, 6), n, m, lt, c, L, Rt, gt, why, D = d * d, op;
    do { n = r.int((d - 1) * (d - 1) + 1, (d + 1) * (d + 1) - 1); } while (n === D || n < 2);
    lt = n < D;   /* √n < d */
    var core = '$' + d + ' = ' + sr(D) + '$이고 $' + n + (lt ? ' < ' : ' > ') + D + '$이니 $' + sr(n) + (lt ? ' < ' : ' > ') + d + '$' + pj(d, '이에요/예요') + '.';
    if (f === 'A') { c = d + k; L = sr(n) + ' + ' + k; Rt = String(c); gt = !lt; why = '양쪽에서 $' + k + '$' + pj(k, '을/를') + ' 빼면 $' + sr(n) + '$' + pj(n, '과/와') + ' $' + d + '$' + pj(d, '을/를') + ' 견주는 문제가 돼요. ' + core; }
    else if (f === 'B') { if (d - k < 1 && r.int(0, 1)) return null; c = d - k; L = sr(n) + ' - ' + k; Rt = String(c); gt = !lt; why = '양쪽에 $' + k + '$' + pj(k, '을/를') + ' 더하면 $' + sr(n) + '$' + pj(n, '과/와') + ' $' + d + '$' + pj(d, '을/를') + ' 견주는 문제가 돼요. ' + core; }
    else if (f === 'C') { c = k; L = (d + k) + ' - ' + sr(n); Rt = String(c); gt = lt; why = '$' + (d + k) + ' - ' + d + ' = ' + k + '$' + pj(k, '이에요/예요') + '. 그러니 $' + (d + k) + '$에서 $' + d + '$보다 큰 수를 빼면 $' + k + '$보다 작아지고, 작은 수를 빼면 커져요. ' + core; }
    else if (f === 'D') { L = sr(n); Rt = String(d); gt = !lt; why = core; }
    else if (f === 'E') { L = '-' + sr(n); Rt = '-' + d; gt = lt; why = core + ' 음수끼리는 절댓값이 큰 수가 더 작아요.'; }
    else { m = nonsq(r, 2, 40); do { n = nonsq(r, 2, 40); } while (n === m); L = sr(n) + ' + ' + k; Rt = sr(m) + ' + ' + k; gt = n > m; why = '양쪽에서 같은 수 $' + k + '$' + pj(k, '을/를') + ' 빼면 $' + sr(n) + '$' + pj(n, '과/와') + ' $' + sr(m) + '$' + pj(m, '을/를') + ' 견주는 문제가 돼요. 근호 안의 수가 큰 쪽이 커요.'; }
    op = r.int(0, 1) ? '>' : '<';
    return { tex: L + ' ' + op + ' ' + Rt, ok: (op === '>') === gt, why: why, right: L + (gt ? ' > ' : ' < ') + Rt };
  };
  var stmtBuild = function (q) {
    var it = q.items, a = it[0], rest = it.slice(1);
    return { text: '다음 중 옳' + (a.ok ? '은' : '지 않은') + ' 것을 고르세요.', ans: a.tex, wrong: rest.map(function (x, i) { return [x.tex, 'pick-' + (i + 1), (x.ok ? '이 식은 옳아요. ' : '이 식은 틀려요. ') + x.why]; }),
      check: rest.length === 3 && rest.every(function (x) { return x.ok !== a.ok; }),
      steps: [{ say: (a.ok ? '이 식은 옳아요. ' : '이 식은 틀려요. ') + a.why, tex: a.right }, { say: '나머지 세 식은 모두 ' + (a.ok ? '틀린' : '옳은') + ' 식이에요. 보기를 눌러 하나씩 이유를 확인해요.', tex: a.tex }],
      hints: [CMP, '근호가 있는 수에 다른 수가 더해지거나 빼져 있으면, 양쪽에서 같은 수를 빼거나 더해서 근호가 있는 수만 남겨요. 양팔 저울의 양쪽에서 같은 무게를 덜어도 기운 쪽은 그대로인 것과 같아요. 그런 다음 근호가 없는 수를 제곱해서 근호 안의 수와 견줘요.',
        '① 식마다 양쪽에 같은 수를 더하거나 빼서 근호가 있는 수만 남겨요. ② 근호가 없는 수를 제곱해서 근호 안에 넣어요. ③ 근호 안의 수끼리 견줘요. 음수끼리는 차례가 거꾸로예요. ④ 부등호의 방향이 맞는지 보고, 옳은 것을 묻는지 옳지 않은 것을 묻는지 확인해요.'] };
  };
  var cmpBuild = function (q) { return q.kind === 'stmt' ? stmtBuild(q) : listBuild(q); };
  var okCmp = function (q) { var p = cmpBuild(q); return !!p && p.check; };
  var listQ = function (r, lv) {
    return until(function () {
      var c = r.int(2, 8), s = lv === 1 && r.int(0, 2) ? -1 : 1, half = lv === 1 && (s > 0 || r.int(0, 1) === 1), cand = [cItem(s, 'int', c), cItem(s, 'int', c + 1)], n, items, keys;
      for (n = Math.max(2, c * c - 4); n <= (c + 1) * (c + 1) + 4; n++) if (!sq(n)) cand.push(cItem(s, 'rt', n));
      if (half) { cand.push(cItem(s, 'half', 2 * c + 1)); cand.push(cItem(s, 'half', 2 * c - 1)); }
      items = take(r, cand, 4); keys = items.map(function (x) { return x.key; });
      if (keys.some(function (k, i) { return keys.indexOf(k) !== i; }) || (half && !items.some(function (x) { return /dfrac/.test(x.tex); }))) return null;
      return { kind: 'list', want: r.pick(['max', 'min']), items: items, o: order4(r) };
    }, okCmp);
  };
  choiceQ({
    id: 'B17.compare', title: '실수의 대소 관계', ids: ['pick-1', 'pick-2', 'pick-3'], build: cmpBuild,
    levels: [
      { name: '양수끼리 견주기', minDistinct: 2, vars: { q: sampler(function (r) { return listQ(r, 0); }) } },
      { name: '음수 · 분수가 섞인 수', minDistinct: 2, vars: { q: sampler(function (r) { return listQ(r, 1); }) } },
      { name: '옳은 부등식 고르기', minDistinct: 2, vars: { q: sampler(function (r) {
          return until(function () {
            var want = r.int(0, 1) === 1, items = [], x, guard = 0;
            while (items.length < 4 && guard++ < 80) { x = stmt(r); if (x && x.ok === (items.length === 0 ? want : !want) && !items.some(function (y) { return y.tex === x.tex; })) items.push(x); }
            return items.length === 4 ? { kind: 'stmt', items: items, o: order4(r) } : null;
          }, okCmp);
        }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B17', [
  { title: '제곱근이란', body: [
    '제곱해서 $a$가 되는 수를 $a$의 제곱근이라고 해요. 넓이가 9인 정사각형 타일의 한 변의 길이 3을 찾는 것과 같아요.',
    { tex: '3^{2} = 9,\\quad (-3)^{2} = 9' },
    '음수도 제곱하면 양수가 돼요. 그래서 9의 제곱근은 $3$과 $-3$, 두 개예요.',
    { list: ['양수의 제곱근: 양수 하나, 음수 하나(두 개)', '0의 제곱근: 0 하나', '음수의 제곱근: 없어요(제곱해서 음수가 되는 수는 없어요)'] }
  ] },
  { title: '근호 √', body: [
    '제곱해서 2가 되는 수는 자연수나 분수로 쓸 수 없어요. 그래서 새 기호 $\\sqrt{\\ }$(근호, 루트)를 써요.',
    { ex: [['\\sqrt{2}', '2의 양의 제곱근'], ['-\\sqrt{2}', '2의 음의 제곱근'], ['\\pm\\sqrt{2}', '둘을 한꺼번에 쓴 것']] },
    '말에 주의해요. "9의 제곱근"은 $\\pm 3$ 두 개이고, "제곱근 9"는 $\\sqrt{9} = 3$ 하나예요.',
    '근호 안이 제곱수이면 근호가 벗겨져요.',
    { tex: '\\sqrt{16} = 4,\\quad -\\sqrt{16} = -4,\\quad \\sqrt{\\dfrac{4}{9}} = \\dfrac{2}{3}' }
  ] },
  { title: '제곱근의 성질', body: [
    '근호와 제곱은 서로를 지워요. 다만 근호 기호의 값은 음수가 될 수 없어요.',
    { ex: [['(\\sqrt{5})^{2} = 5', '제곱근을 제곱하면 원래 수'], ['(-\\sqrt{5})^{2} = 5', '음수도 제곱하면 양수'], ['\\sqrt{5^{2}} = 5', '제곱한 수의 양의 제곱근'], ['\\sqrt{(-5)^{2}} = 5', '$-5$가 아니에요']] },
    '문자일 때는 부호를 따져요. $a$가 음수이면 $-a$가 양수예요.',
    { tex: '\\sqrt{a^{2}} = \\begin{cases} a & (a \\geq 0) \\\\ -a & (a < 0) \\end{cases}' }
  ] },
  { title: '무리수와 실수', body: [
    '분수로 쓸 수 없는 수를 무리수라고 해요. 소수로 쓰면 되풀이되는 묶음 없이 끝없이 이어져요.',
    { tex: '\\sqrt{2} = 1.41421356\\cdots,\\quad \\pi = 3.14159265\\cdots' },
    { list: ['유리수: 정수, 유한소수, 순환소수(분수로 쓸 수 있어요)', '무리수: 순환하지 않는 무한소수', '실수: 유리수와 무리수를 합친 것'] },
    '근호가 있다고 모두 무리수는 아니에요. $\\sqrt{9} = 3$은 유리수예요.'
  ] },
  { title: '크기를 어림하고 견주기', body: [
    '넓이가 넓은 정사각형일수록 한 변이 길어요. 그래서 근호 안의 수가 클수록 커요.',
    { tex: '4 < 7 < 9 \\;\\Rightarrow\\; 2 < \\sqrt{7} < 3' },
    '근호가 없는 수와 견줄 때는 제곱해서 모양을 맞춰요.',
    { ex: [['3 = \\sqrt{9} > \\sqrt{8}', '9가 8보다 커요'], ['-3 < -\\sqrt{8}', '음수는 거꾸로예요']] },
    '수직선은 유리수와 무리수에 대응하는 점으로 빈틈없이 채워져 있어요.'
  ] }
]);
