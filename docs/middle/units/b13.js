/* B13 일차부등식 — 부등식의 성질(음수를 곱하거나 나누면 방향이 바뀐다), 풀이, 활용
   유형(쉬운 것부터): B13.prop 부등식의 성질(부등호 고르기) · B13.sol 부등식과 해(수직선 읽기 · 해 고르기 · 문장을 부등식으로)
                     · B13.basic 일차부등식의 풀이 · B13.paren 괄호 · 분수 · 소수가 있는 부등식 (여기까지 보기 고르기)
                     · B13.count 정수인 해 · 상수 구하기(키패드) · B13.word 부등식의 활용(키패드)
   답이 범위 · 부등호이면 보기 고르기, 답이 수 하나이면 키패드다.
   부등식의 양쪽은 항의 목록이다: [계수, 'x' | ''] · 묶음 ['g', 곱하는 수, [항 …]] · 분수 ['f', 부호, [분자의 항 …], 분모]
     · 분수 계수 ['q', 분자, 분모, 'x' | ''] · 소수 ['d', 10배 한 정수, 'x' | '']. 계산은 모두 정수로 한다.
   검산: 화면에 쓰는 부등식을 MH.alg.ev 로 다시 읽어, 경계의 앞뒤 수를 넣었을 때 참 · 거짓이 답의 범위와 같은지 본다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, poly = A.poly, body = A.body, order4 = A.order4, lcm = MH.lcm, gcd = MH.gcd, abs = Math.abs, F = MH.F;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var until = function (make, ok) { var q, i = 0; do { q = make(); } while (!ok(q) && ++i < 80); return q; };
  var won = function (n) { return String(n).replace(/\B(?=(\d{3})+$)/g, ','); };

  /* ── 부등호 ── */
  var OP = {
    lt: { t: '<', flip: 'gt', eq: 'le', strict: true, word: '작다' }, gt: { t: '>', flip: 'lt', eq: 'ge', strict: true, word: '크다' },
    le: { t: '\\leq', flip: 'ge', eq: 'lt', strict: false, word: '작거나 같다' }, ge: { t: '\\geq', flip: 'le', eq: 'gt', strict: false, word: '크거나 같다' }
  };
  var OPS = ['lt', 'gt', 'le', 'ge'];
  var cmpOk = function (op, c) { return op === 'lt' ? c < 0 : op === 'gt' ? c > 0 : op === 'le' ? c <= 0 : c >= 0; };
  var fmtK = function (k) { return k.d === 1 ? String(k.n) : (k.n < 0 ? '-' : '') + '\\dfrac{' + abs(k.n) + '}{' + k.d + '}'; };
  var rng = function (op, k) { return 'x ' + OP[op].t + ' ' + (typeof k === 'number' ? k : fmtK(k)); };
  var REL = / (<|>|\\leq|\\geq) /, OPOF = { '<': 'lt', '>': 'gt', '\\leq': 'le', '\\geq': 'ge' };
  /** 부등식(글)에 x 를 넣으면 참인가 */
  var holds = function (tex, x) { var m = tex.split(REL); return cmpOk(OPOF[m[1]], A.ev(m[0], { x: x }).compare(A.ev(m[2], { x: x }))); };
  /** 부등식 tex 의 해가 'x op k' 와 같은가: 경계와 그 앞뒤의 수를 넣어 본다 */
  var agree = function (tex, op, k) {
    var K = F(k.n, k.d);
    try { return [F(-1), F(-1, 2), F(0), F(1, 2), F(1), F(7, 3)].every(function (d) { var x = K.add(d); return holds(tex, x) === cmpOk(op, x.compare(K)); }); } catch (e) { return false; }
  };

  /* ── 부등식의 양쪽 ── */
  var xs = function (s) { return s.filter(function (t) { return t[1]; }); };
  var cs = function (s) { return s.filter(function (t) { return !t[1]; }); };
  var sum = function (s) { return s.reduce(function (a, t) { return a + t[0]; }, 0); };
  var neg = function (s) { return s.map(function (t) { return [-t[0], t[1]]; }); };
  var special = function (it) { return typeof it[0] === 'string'; };
  var sideTex = function (s) {
    var out = '';
    s.forEach(function (it, i) {
      var k = it[0], c = special(it) ? it[1] : it[0], b;
      if (k === 'g') b = (abs(c) === 1 ? '' : abs(c)) + '(' + poly(it[2]) + ')';
      else if (k === 'f') b = '\\dfrac{' + poly(it[2]) + '}{' + it[3] + '}';
      else if (k === 'q') b = '\\dfrac{' + (abs(c) === 1 && it[3] ? '' : abs(c)) + it[3] + '}{' + it[2] + '}';
      else if (k === 'd') b = MH.decStr(abs(c), 1) + it[2];
      else b = body(it);
      out += (i ? (c < 0 ? ' - ' : ' + ') : (c < 0 ? '-' : '')) + b;
    });
    return out || '0';
  };
  var I = function (L, R, op) { return sideTex(L) + ' ' + OP[op].t + ' ' + sideTex(R); };
  /** 양쪽에 곱해서 정수 계수로 만드는 수(분모의 최소공배수, 소수이면 10) */
  var scaleOf = function (L, R) {
    var m = 1;
    L.concat(R).forEach(function (it) { if (it[0] === 'f') m = lcm(m, it[3]); else if (it[0] === 'q') m = lcm(m, it[2]); else if (it[0] === 'd') m = lcm(m, 10); });
    return m;
  };
  var scale = function (s, m) {
    return s.map(function (it) {
      if (it[0] === 'g') return ['g', it[1] * m, it[2]];
      if (it[0] === 'f') return ['g', it[1] * m / it[3], it[2]];
      if (it[0] === 'q') return [it[1] * m / it[2], it[3]];
      if (it[0] === 'd') return [it[1] * m / 10, it[2]];
      return [it[0] * m, it[1]];
    });
  };
  var expand = function (s) {
    var out = [];
    s.forEach(function (it) { if (it[0] === 'g') it[2].forEach(function (t) { out.push([it[1] * t[0], t[1]]); }); else out.push(it); });
    return out;
  };
  /** 부등식 L op R 을 푼다 → { tex, steps, A, B, k: { n, d }, op: 답의 부등호, moving, M, … } (x 가 사라지면 null) */
  var solve = function (L, R, op) {
    var tex = I(L, R, op), steps = [], M = scaleOf(L, R), decimal = L.concat(R).some(function (it) { return it[0] === 'd'; }), L2 = M > 1 ? scale(L, M) : L, R2 = M > 1 ? scale(R, M) : R;
    if (M > 1) steps.push({ say: (decimal ? '양쪽에 ' + M + pj(M, '을/를') + ' 곱해서 소수를 정수로 바꿔요.' : '양쪽에 분모의 최소공배수 ' + M + pj(M, '을/를') + ' 곱해서 분모를 없애요.') + ' 양수를 곱하니 부등호의 방향은 그대로예요. 모든 항에 빠짐없이 곱해요.', tex: I(L2, R2, op) });
    var grouped = L2.concat(R2).some(function (it) { return it[0] === 'g'; }), eL = expand(L2), eR = expand(R2);
    var left = xs(eL).concat(neg(xs(eR))), right = cs(eR).concat(neg(cs(eL))), a = sum(left), b = sum(right), moving = xs(eR).concat(cs(eL)), g, k, ansOp;
    if (a === 0) return null;
    if (grouped) steps.push({ say: '괄호를 풀어요. 괄호 앞의 수를 괄호 안의 모든 항에 곱해요.', tex: poly(eL) + ' ' + OP[op].t + ' ' + poly(eR) });
    if (moving.length) steps.push({ say: '문자가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 이항해요. 부등호를 건너는 항은 부호가 바뀌어요. 이항으로는 부등호의 방향이 바뀌지 않아요.', tex: poly(left) + ' ' + OP[op].t + ' ' + poly(right) });
    if (left.length > 1 || right.length > 1) steps.push({ say: '양쪽을 각각 계산해요.', tex: poly([[a, 'x']]) + ' ' + OP[op].t + ' ' + b });
    g = gcd(abs(a), abs(b)) || 1; k = { n: (a < 0 ? -b : b) / g, d: abs(a) / g }; ansOp = a < 0 ? OP[op].flip : op;
    if (a < 0) steps.push({ say: '양쪽을 $x$ 앞의 수 $' + a + '$' + pj(a, '으로/로') + ' 나눠요. 음수로 나누면 부등호의 방향이 바뀌어요.', tex: rng(ansOp, k) });
    else if (a !== 1) steps.push({ say: '양쪽을 $x$ 앞의 수 $' + a + '$' + pj(a, '으로/로') + ' 나눠요. 양수로 나누니 부등호의 방향은 그대로예요.', tex: rng(ansOp, k) });
    return { tex: tex, steps: steps, A: a, B: b, k: k, op: ansOp, op0: op, moving: moving, M: M, decimal: decimal, grouped: grouped, eL: eL, eR: eR };
  };

  var SCALE = '부등식은 한쪽으로 기울어진 저울과 같아요. 양쪽에 같은 수를 더하거나 빼도, 같은 양수를 곱하거나 나눠도 기운 쪽은 그대로예요. 하지만 음수를 곱하거나 나누면 뒤집혀요. $2 < 5$이지만 $-2 > -5$예요. 빚 2만 원이 빚 5만 원보다 나은 것과 같아요. 수직선에서 보면 음수를 곱할 때 0을 기준으로 좌우가 뒤바뀌기 때문이에요.';

  /* ── 보기 고르기 유형의 틀 ── build(q) → { text, tex, figure, ans, wrong: [[보기, 실수 id, 설명] ×3], hints, steps, check } */
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var options = function (v) { var p = P(v), list = [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); return v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) {
      var p = P(v), all;
      if (!p || p.check !== true || p.wrong.length !== 3) return false;
      all = [p.ans].concat(p.wrong.map(function (w) { return w[0]; }));
      return all.every(function (x, i) { return all.indexOf(x) === i; });
    };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B13', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; if (p.figure) out.figure = p.figure; return out; },
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

  /* ── B13.prop 부등식의 성질 ────────────────────────────
     v.q = { rel: 주어진 부등호, ops: [['mul', m] | ['div', d] | ['add', c] …], L: [문자 둘], rev: 거꾸로(식의 대소 → 문자의 대소) } */
  var exprOf = function (L, n, d, c) {
    var t = d === 1 ? body([n, L]) : '\\dfrac{' + (abs(n) === 1 ? '' : abs(n)) + L + '}{' + d + '}';
    return (n < 0 ? '-' : '') + t + (c ? (c < 0 ? ' - ' : ' + ') + abs(c) : '');
  };
  var propBuild = function (q) {
    var L = q.L, states = [{ n: 1, d: 1, c: 0 }], negAt = [], i, s, g;
    q.ops.forEach(function (op) {
      s = states[states.length - 1];
      if (op[0] === 'add') { states.push({ n: s.n, d: s.d, c: s.c + op[1] }); negAt.push(false); return; }
      var n = op[0] === 'mul' ? s.n * op[1] : s.n * (op[1] < 0 ? -1 : 1), d = op[0] === 'mul' ? s.d : s.d * abs(op[1]);
      g = gcd(abs(n), d); states.push({ n: n / g, d: d / g, c: 0 }); negAt.push(op[1] < 0);
    });
    var last = states.length - 1, rels = [], from = q.rev ? last : 0, to = q.rev ? 0 : last, flips = negAt.filter(Boolean).length;
    rels[from] = q.rel;
    if (q.rev) for (i = last - 1; i >= 0; i--) rels[i] = negAt[i] ? OP[rels[i + 1]].flip : rels[i + 1];
    else for (i = 1; i <= last; i++) rels[i] = negAt[i - 1] ? OP[rels[i - 1]].flip : rels[i - 1];
    var ex = function (j, k) { var st = states[j]; return exprOf(L[k], st.n, st.d, st.c); };
    var line = function (j) { return ex(j, 0) + ' ' + OP[rels[j]].t + ' ' + ex(j, 1); };
    var ansOp = rels[to], ans = OP[ansOp].t, flipT = OP[OP[ansOp].flip].t, given = line(from);
    var did = q.ops.map(function (op) {
      var v = op[1];
      if (op[0] === 'add') return v > 0 ? '양쪽에 ' + v + pj(v, '을/를') + ' 더했어요' : '양쪽에서 ' + abs(v) + pj(v, '을/를') + ' 뺐어요';
      return op[0] === 'mul' ? '양쪽에 $' + v + '$' + pj(v, '을/를') + ' 곱했어요' : '양쪽을 $' + v + '$' + pj(v, '으로/로') + ' 나눴어요';
    });
    var undo = function (op) {
      var v = op[1], tail = v < 0 ? ' 음수라서 부등호의 방향이 바뀌어요.' : ' 양수라서 부등호의 방향은 그대로예요.';
      if (op[0] === 'add') return (v > 0 ? '양쪽에서 ' + v + pj(v, '을/를') + ' 빼요.' : '양쪽에 ' + abs(v) + pj(v, '을/를') + ' 더해요.') + ' 더하거나 빼는 것으로는 방향이 바뀌지 않아요.';
      return (op[0] === 'mul' ? '양쪽을 $' + v + '$' + pj(v, '으로/로') + ' 나눠요.' : '양쪽에 $' + v + '$' + pj(v, '을/를') + ' 곱해요.') + tail;
    };
    var doit = function (op) {
      var v = op[1], tail = v < 0 ? ' 음수라서 부등호의 방향이 바뀌어요.' : ' 양수라서 부등호의 방향은 그대로예요.';
      if (op[0] === 'add') return (v > 0 ? '양쪽에 ' + v + pj(v, '을/를') + ' 더해요.' : '양쪽에서 ' + abs(v) + pj(v, '을/를') + ' 빼요.') + ' 더하거나 빼는 것으로는 방향이 바뀌지 않아요.';
      return (op[0] === 'mul' ? '양쪽에 $' + v + '$' + pj(v, '을/를') + ' 곱해요.' : '양쪽을 $' + v + '$' + pj(v, '으로/로') + ' 나눠요.') + tail;
    };
    var steps = [{ say: '주어진 부등식에서 시작해요.', tex: given }];
    if (q.rev) for (i = last - 1; i >= 0; i--) steps.push({ say: undo(q.ops[i]), tex: line(i) });
    else for (i = 1; i <= last; i++) steps.push({ say: doit(q.ops[i - 1]), tex: line(i) });
    /* 틀린 보기: 등호가 없는 답이면 [방향 반대, 같다, 방향 반대 + 등호], 등호가 있는 답이면 [방향 반대, 등호 뺌, 방향 반대 + 등호 뺌] */
    var dirWhy = flips % 2 ? ['not-flipped', '부등호의 방향을 바꾸지 않았어요. 이 문제에서는 음수를 곱하거나 나누는 일이 한 번 있어요. 음수를 곱하거나 나누면 크기 순서가 뒤집혀요. $2 < 5$이지만 $-2 > -5$예요.']
      : ['flipped', '부등호의 방향을 바꿨어요. 방향이 바뀌는 것은 음수를 곱하거나 나눌 때뿐이에요. 더하거나 빼거나, 양수를 곱하거나 나눌 때는 그대로예요. 음수가 몇 번 나오는지 다시 세어 보세요.'];
    var wrong = [[flipT, dirWhy[0], dirWhy[1]]];
    if (OP[ansOp].strict) {
      wrong.push(['=', 'equal', '같다고 봤어요. 서로 다른 두 수에 똑같은 일을 하면 여전히 서로 달라요. 등호가 아니라 부등호가 들어가요.']);
      wrong.push([OP[OP[OP[ansOp].flip].eq].t, 'both', '방향도 맞지 않고, 없던 등호도 생겼어요. 주어진 부등식에 등호가 없으면 답에도 등호가 없어요. 방향은 음수를 곱하거나 나눈 횟수로 정해요.']);
    } else {
      wrong.push([OP[OP[ansOp].eq].t, 'strict', '등호를 뺐어요. 주어진 부등식에 등호(같을 수도 있다)가 있으면, 양쪽에 같은 일을 한 뒤에도 같을 수 있어요. 등호는 그대로 남아요.']);
      wrong.push([OP[OP[OP[ansOp].flip].eq].t, 'both', '방향도 맞지 않고, 있던 등호도 사라졌어요. 등호는 그대로 남고, 방향은 음수를 곱하거나 나눈 횟수로 정해요.']);
    }
    /* 검산: 조건에 맞는 두 수를 실제로 넣어 본다 */
    var pairs = [[1, 2], [-3, 5], [-7, -2], [2, 2]].map(function (p) { return q.rel === 'gt' || q.rel === 'ge' ? [p[1], p[0]] : p; }).filter(function (p) { return !OP[q.rel].strict || p[0] !== p[1]; });
    var val = function (j, x) { var st = states[j]; return F(st.n * x, st.d).add(st.c); };
    var truth = function (t, p) { var c = val(to, p[0]).compare(val(to, p[1])); return t === '=' ? c === 0 : cmpOk(OPOF[t], c); };
    /* 거꾸로 묻는 문제는 조건(식의 대소)에 맞는 수로 본다: 문자에 넣는 수의 순서를 뒤집힌 횟수만큼 바꾼다 */
    var use = q.rev && flips % 2 ? pairs.map(function (p) { return [p[1], p[0]]; }) : pairs;
    var check = use.every(function (p) { return truth(ans, p); }) && wrong.every(function (w) { return use.some(function (p) { return !truth(w[0], p); }); })
      && use.every(function (p) { var c = val(from, p[0]).compare(val(from, p[1])); return cmpOk(q.rel, c); });
    return {
      text: '$' + given + '$일 때, □ 안에 알맞은 부등호를 고르세요.', tex: ex(to, 0) + ' \\;\\square\\; ' + ex(to, 1), ans: ans, wrong: wrong, steps: steps, check: check,
      hints: [SCALE,
        q.rev ? '이 문제는 거꾸로 가는 문제예요. 복잡한 식에서 시작해서 한 단계씩 되돌려 문자만 남겨요. 주어진 식은 문자에 이런 일을 한 것이에요: ' + did.join(', 그다음 ') + '. 되돌릴 때는 마지막에 한 일부터 거꾸로 풀어요.'
          : '주어진 부등식의 양쪽에 똑같은 일을 해서 □가 있는 식을 만들어요. 이 문제에서 한 일을 차례로 보면: ' + did.join(', 그다음 ') + '. 단계마다 방향이 바뀌는지 하나씩 확인해요.',
        '① 한 단계씩 따로 봐요. ② 더하기 · 빼기 단계에서는 방향이 그대로예요. ③ 곱하기 · 나누기 단계에서는 그 수의 부호를 봐요. 양수이면 그대로, 음수이면 방향을 뒤집어요. ④ 등호가 있었으면 끝까지 등호가 남고, 없었으면 끝까지 없어요.']
    };
  };
  var LETS = [['a', 'b'], ['x', 'y'], ['p', 'q'], ['m', 'n']];
  choiceQ({
    id: 'B13.prop', title: '부등식의 성질', ids: ['not-flipped', 'flipped', 'equal', 'strict', 'both'], build: propBuild,
    levels: [
      { name: '더하기 · 빼기', minDistinct: 150, vars: { q: sampler(function (r) { return { rel: r.pick(OPS), ops: [['add', nz(r, -9, 9)]], L: r.pick(LETS), rev: false, o: order4(r) }; }) } },
      { name: '곱하기 · 나누기', minDistinct: 150, vars: { q: sampler(function (r) {
          return { rel: r.pick(OPS), ops: [r.int(0, 1) ? ['mul', r.pick([-9, -7, -5, -4, -3, -2, -1, 2, 3, 4, 5, 7])] : ['div', pm(r, r.int(2, 9))]], L: r.pick(LETS), rev: false, o: order4(r) };
        }) } },
      { name: '두 단계 · 거꾸로', vars: { q: sampler(function (r) {
          return { rel: r.pick(OPS), ops: [r.int(0, 2) ? ['mul', pm(r, r.int(2, 7))] : ['div', pm(r, r.int(2, 6))], ['add', nz(r, -9, 9)]], L: r.pick(LETS), rev: r.int(0, 2) === 0, o: order4(r) };
        }) } }
    ]
  });

  /* ── B13.sol 부등식과 해 ───────────────────────────── */
  var READ = '수직선에 범위를 그릴 때는 두 가지를 봐요. 첫째, 끝점의 모양이에요. 속이 빈 점(○)은 그 수가 들어가지 않는다는 뜻이고(크다 · 작다 · 초과 · 미만), 속이 찬 점(●)은 그 수도 들어간다는 뜻이에요(이상 · 이하). 둘째, 선이 뻗는 쪽이에요. 오른쪽은 더 큰 수들, 왼쪽은 더 작은 수들이에요.';
  var WORDS = '말을 부등호로 옮길 때는 "그 수도 들어가는가"를 봐요. 이상 · 이하 · 크지 않다 · 작지 않다는 그 수도 들어가서 등호가 있는 ≥, ≤를 써요. 크다 · 작다 · 초과 · 미만은 그 수가 들어가지 않아서 >, <를 써요. 키가 120 cm 이상이면 탈 수 있는 놀이 기구는 딱 120 cm인 사람도 탈 수 있어요.';
  var PHRASES = [['이상이다', 'ge'], ['이하이다', 'le'], ['보다 크다', 'gt'], ['보다 작다', 'lt'], ['초과이다', 'gt'], ['미만이다', 'lt'], ['보다 크지 않다', 'le'], ['보다 작지 않다', 'ge']];
  var threeWrong = function (make, op, why) {
    return [[make(OP[op].flip), 'direction', why.direction], [make(OP[op].eq), 'boundary', why.boundary], [make(OP[OP[op].flip].eq), 'both', why.both]];
  };
  var solBuild = function (q) {
    var k, op = q.op, lo, tex, a, b, c;
    if (q.kind === 'fig') {
      k = q.k; lo = k - q.left;
      return {
        text: '수직선에 나타낸 $x$의 값의 범위를 부등식으로 고르세요.', figure: { type: 'line', min: lo, max: lo + 8, parts: 1, ray: { at: q.left, dir: op === 'gt' || op === 'ge' ? 1 : -1, open: OP[op].strict } },
        ans: rng(op, k), check: q.left >= 1 && q.left <= 7,
        wrong: threeWrong(function (o) { return rng(o, k); }, op, {
          direction: '선이 뻗는 쪽을 반대로 읽었어요. 선이 오른쪽으로 뻗으면 그 수보다 큰 수들이고, 왼쪽으로 뻗으면 작은 수들이에요.',
          boundary: '끝점의 모양을 반대로 읽었어요. 속이 빈 점(○)은 그 수가 들어가지 않아서 등호가 없고, 속이 찬 점(●)은 그 수도 들어가서 등호가 있어요.',
          both: '선이 뻗는 쪽도, 끝점의 모양도 반대로 읽었어요. 오른쪽은 큰 수, 왼쪽은 작은 수예요. ○는 등호 없음, ●는 등호 있음이에요.' }),
        hints: [READ, '이 그림에서 먼저 점이 찍힌 눈금의 수를 읽어요. 그 수가 범위의 경계예요. 그다음 점의 속이 비었는지 찼는지, 선이 어느 쪽으로 뻗는지 차례로 봐요.',
          '① 경계의 수를 읽어요. ② 선이 오른쪽으로 뻗으면 $x$가 그 수보다 큰 쪽이니 >나 ≥, 왼쪽이면 <나 ≤예요. ③ 점의 속이 찼으면 등호가 있는 것(≥, ≤), 비었으면 등호가 없는 것(>, <)을 골라요.'],
        steps: [{ say: '점이 찍힌 눈금이 경계예요. 선이 ' + (op === 'gt' || op === 'ge' ? '오른쪽으로 뻗으니 경계보다 큰 수들이에요.' : '왼쪽으로 뻗으니 경계보다 작은 수들이에요.'), tex: 'x \\;\\square\\; ' + k },
          { say: OP[op].strict ? '점의 속이 비었으니(○) 경계의 수는 들어가지 않아요. 등호가 없어요.' : '점의 속이 찼으니(●) 경계의 수도 들어가요. 등호가 있어요.', tex: rng(op, k) }]
      };
    }
    if (q.kind === 'sub') {
      /* a x + b op c 의 해인 수 고르기 */
      a = q.a; b = q.b; k = q.k; c = a * k + b; tex = I([[a, 'x'], [b, '']], [[c, '']], op);
      var solOp = a < 0 ? OP[op].flip : op, side = solOp === 'gt' || solOp === 'ge' ? 1 : -1, strict = OP[op].strict;
      var ansV = k + side * q.far, outs = strict ? [k, k - side * q.w[0], k - side * (q.w[0] + q.w[1])] : [k - side * q.w[0], k - side * (q.w[0] + q.w[1]), k - side * (q.w[0] + q.w[1] + 1)];
      var sayV = function (v) { return a + ' \\times ' + (v < 0 ? '(' + v + ')' : v) + (b < 0 ? ' - ' : ' + ') + abs(b) + ' = ' + (a * v + b); };
      var hints = ['부등식의 해는 $x$ 자리에 넣었을 때 부등식이 참이 되는 수예요. 저울에 물건을 올려 보는 것처럼, 수를 직접 넣어서 확인하면 돼요. 부등식의 해는 하나가 아니라 여러 개일 수 있어요.',
        '보기의 수를 하나씩 $x$ 자리에 넣어서 왼쪽의 값을 계산해요. 음수를 넣을 때는 괄호를 쳐서 곱해요. 계산한 값을 오른쪽의 수와 견줘요.',
        '① 보기의 수를 넣어 왼쪽을 계산해요. ② 오른쪽의 수와 크기를 견줘요. ③ 부등호의 뜻과 맞는지 봐요. ' + (strict ? '이 부등호에는 등호가 없어요. 양쪽이 똑같아지는 수는 해가 아니에요.' : '이 부등호에는 등호가 있어요. 양쪽이 똑같아지는 수도 해예요.')];
      return {
        text: '다음 중 부등식의 해인 것을 고르세요.', tex: tex, ans: String(ansV), hints: hints,
        check: holds(tex, F(ansV)) && outs.every(function (v) { return !holds(tex, F(v)); }) && !(ansV > 0 && nums(tex).indexOf(String(ansV)) < 0 && nums(hints.join(' ')).indexOf(String(ansV)) >= 0),
        wrong: outs.map(function (v, i) {
          return v === k ? [String(v), 'boundary-value', '$x = ' + v + '$' + pj(v, '을/를') + ' 넣으면 왼쪽이 ' + c + pj(c, '이/가') + ' 되어 오른쪽과 똑같아져요. 이 부등호에는 등호가 없어서, 같은 것은 참이 아니에요.']
            : [String(v), 'not-solution-' + (i + 1), '$x = ' + v + '$' + pj(v, '을/를') + ' 넣으면 왼쪽은 $' + sayV(v) + '$' + pj(a * v + b, '이에요/예요') + '. 오른쪽의 수 ' + c + pj(c, '과/와') + ' 견주면 부등식이 거짓이에요.'];
        }),
        steps: [{ say: '$x$ 자리에 수를 넣어 왼쪽을 계산해요.', tex: sayV(ansV) }, { say: '오른쪽의 수와 견주면 부등식이 참이에요. 그래서 이 수가 해예요.', tex: (a * ansV + b) + ' ' + OP[op].t + ' ' + c }]
      };
    }
    /* 문장을 부등식으로 */
    var ph = PHRASES[q.ph], L, text; op = ph[1]; a = q.a; b = q.b; c = q.c;
    if (q.form === 0) { L = [[a, 'x'], [b, '']]; text = '어떤 수 $x$의 ' + a + '배에 ' + b + pj(b, '을/를') + ' 더한 수는 ' + c + (ph[0][0] === '보' ? '' : ' ') + ph[0] + '.'; }
    else if (q.form === 1) { L = [[a, 'x'], [-b, '']]; text = '어떤 수 $x$의 ' + a + '배에서 ' + b + pj(b, '을/를') + ' 뺀 수는 ' + c + (ph[0][0] === '보' ? '' : ' ') + ph[0] + '.'; }
    else { L = [['g', a, [[1, 'x'], [b, '']]]]; text = '어떤 수 $x$에 ' + b + pj(b, '을/를') + ' 더한 다음 ' + a + '배 한 수는 ' + c + (ph[0][0] === '보' ? '' : ' ') + ph[0] + '.'; }
    var mk = function (o) { return I(L, [[c, '']], o); };
    return {
      text: text + ' 이것을 부등식으로 나타낸 것을 고르세요.', ans: mk(op), check: true,
      wrong: threeWrong(mk, op, {
        direction: '부등호의 방향이 반대예요. 부등호는 벌어진 쪽이 큰 쪽이에요. 문장에서 어느 쪽이 더 크다고(또는 작다고) 했는지 다시 읽어 보세요.',
        boundary: '등호가 있고 없고가 틀렸어요. 이상 · 이하 · 크지 않다 · 작지 않다는 그 수도 들어가서 등호가 있어요. 크다 · 작다 · 초과 · 미만은 등호가 없어요.',
        both: '방향도, 등호도 틀렸어요. "크지 않다"는 "작거나 같다"와 같은 말이고, "작지 않다"는 "크거나 같다"와 같은 말이에요.' }),
      hints: [WORDS, '문장을 둘로 나눠요. "~한 수는"까지가 왼쪽에 쓸 식이고, 그 뒤의 수와 말이 오른쪽과 부등호예요. 이 문장의 끝말은 "' + ph[0] + '"예요. 이 말이 그 수도 들어가는 말인지 생각해 보세요.',
        '① 왼쪽의 식을 먼저 써요(보기의 왼쪽은 모두 같아요). ② 끝말이 "크다" 쪽인지 "작다" 쪽인지 정해요. "크지 않다"는 "작거나 같다", "작지 않다"는 "크거나 같다"와 같은 말이에요. ③ 그 수가 들어가면 등호가 있는 부등호를, 아니면 등호가 없는 부등호를 골라요.'],
      steps: [{ say: '"~한 수"를 식으로 써요.', tex: sideTex(L) }, { say: '끝말 "' + ph[0] + '"는 왼쪽이 오른쪽보다 ' + OP[op].word + '는 뜻이에요.', tex: mk(op) }]
    };
  };
  choiceQ({
    id: 'B13.sol', title: '부등식과 해', ids: ['direction', 'boundary', 'both', 'boundary-value', 'not-solution-1', 'not-solution-2', 'not-solution-3'], build: solBuild,
    levels: [
      { name: '수직선 읽기', minDistinct: 150, vars: { q: sampler(function (r) { return { kind: 'fig', k: r.int(-7, 7), op: r.pick(OPS), left: r.int(2, 6), o: order4(r) }; }) } },
      { name: '해 고르기', vars: { q: sampler(function (r) { return { kind: 'sub', a: nz(r, -5, 5), b: nz(r, -9, 9), k: r.int(-5, 5), op: r.pick(OPS), far: r.int(1, 3), w: [r.int(1, 2), r.int(1, 2)], o: order4(r) }; }) } },
      { name: '문장을 부등식으로', vars: { q: sampler(function (r) { return { kind: 'word', form: r.int(0, 2), a: r.int(2, 9), b: r.int(1, 9), c: r.int(10, 60), ph: r.int(0, PHRASES.length - 1), o: order4(r) }; }) } }
    ]
  });

  /* ── B13.basic · B13.paren 일차부등식의 풀이 ───────────────
     v.q = { L, R, op, o }. 답은 범위 'x > 3'. 틀린 보기: 방향 반대 · 경계의 수가 틀림 · 둘 다 */
  var termList = function (ts) { return ts.map(function (t) { return '$' + poly([t]) + '$'; }).join(', '); };
  var rangeBuild = function (q) {
    var s = solve(q.L, q.R, q.op), k, k2, id2, why2, b2, wrong, flipOp, h2 = [];
    if (!s || s.k.d !== 1 || s.k.n === 0 || abs(s.k.n) > 30 || !s.steps.length) return null;
    k = s.k.n; flipOp = OP[s.op].flip;
    /* 경계가 틀린 보기: 이항할 때 수의 부호를 바꾸지 않은 계산. 그런 수가 없으면 경계의 부호만 반대 */
    b2 = sum(cs(s.eR)) + sum(cs(s.eL));
    if (cs(s.eL).length && b2 !== s.B && b2 % s.A === 0 && b2 !== 0 && abs(b2 / s.A) <= 40) { k2 = b2 / s.A; id2 = 'move-sign'; why2 = '수를 이항할 때 부호를 바꾸지 않았어요. 부등호를 건너는 항은 부호가 바뀌어요(+는 −로, −는 +로). 이항하는 항: ' + termList(cs(s.eL)) + '.'; }
    else { k2 = -k; id2 = 'value-sign'; why2 = '경계가 되는 수의 부호가 틀렸어요. 나눗셈의 부호를 다시 확인해요. 부호가 같은 두 수를 나누면 양수, 부호가 다른 두 수를 나누면 음수예요.'; }
    wrong = [
      [rng(flipOp, k), s.A < 0 ? 'not-flipped' : 'flipped', s.A < 0 ? '마지막에 음수 $' + s.A + '$' + pj(s.A, '으로/로') + ' 나눌 때 부등호의 방향을 바꾸지 않았어요. 음수로 곱하거나 나누면 크기 순서가 뒤집혀요. $2 < 5$이지만 $-2 > -5$예요.'
        : '부등호의 방향을 바꿨어요. 방향이 바뀌는 것은 음수를 곱하거나 나눌 때뿐이에요. 이 풀이에서는 음수로 곱하거나 나누지 않았어요. 이항으로는 방향이 바뀌지 않아요.'],
      [rng(s.op, k2), id2, why2],
      [rng(flipOp, k2), id2 + '-flip', why2 + ' 부등호의 방향도 틀렸어요. 방향은 $x$ 앞의 수가 음수일 때만 바뀌어요.']
    ];
    if (s.M > 1) h2.push(s.decimal ? '소수가 있으면 계산이 번거로워요. 먼저 양쪽에 ' + s.M + pj(s.M, '을/를') + ' 곱해서 정수로 바꿔요.' : '분수가 있으면 계산이 번거로워요. 먼저 양쪽에 분모의 최소공배수 ' + s.M + pj(s.M, '을/를') + ' 곱해서 분모를 없애요.');
    if (s.M > 1) h2.push('양수를 곱하니 방향은 그대로예요. 수만 있는 항에도 빠짐없이 곱해요.');
    if (s.grouped) h2.push('괄호가 있으면 분배법칙으로 풀어요. 괄호 앞의 수를 괄호 안의 모든 항에 곱해요.');
    h2.push(s.moving.length ? '그다음 $x$가 있는 항은 왼쪽으로, 수만 있는 항은 오른쪽으로 모아요. ' + (s.M > 1 || s.grouped ? '부등호를 건너는 항은 부호가 바뀌어요.' : '이 식에서 부등호를 건너야 하는 항: ' + termList(s.moving) + '. 건너면 부호가 바뀌어요.') + ' 이항으로는 부등호의 방향이 바뀌지 않아요.'
      : '이 식은 이미 $x$가 있는 항이 왼쪽에, 수가 오른쪽에 있어요. $x$ 앞에 곱해진 수로 양쪽을 나누기만 하면 돼요.');
    return {
      text: '부등식을 풀어 $x$의 값의 범위를 고르세요.', tex: s.tex, ans: rng(s.op, k), wrong: wrong,
      steps: s.steps.length > 1 ? s.steps : [{ say: '왼쪽에 $x$만 남기는 것이 목표예요. 양쪽에 같은 일을 해요.', tex: s.tex }].concat(s.steps), check: agree(s.tex, s.op, s.k) && k2 !== k,
      hints: [SCALE, h2.join(' '),
        '① 방정식을 풀 때처럼 정리해서 ($x$가 있는 항) □ (수) 꼴로 만들어요. ② $x$ 앞의 수의 부호를 꼭 확인해요. 이 식을 정리하면 $x$ 앞의 수가 ' + (s.A < 0 ? '음수' : '양수') + '(' + s.A + ')가 돼요. ③ 양수로 나누면 방향 그대로, 음수로 나누면 방향을 뒤집어요. ④ 구한 범위 안의 수 하나를 원래 식에 넣어서 참인지 확인해요.']
    };
  };
  var RIDS = ['not-flipped', 'flipped', 'move-sign', 'move-sign-flip', 'value-sign', 'value-sign-flip'];
  var Qr = function (r, L, R) { return { L: L, R: R, op: r.pick(OPS), o: order4(r) }; };
  var okQ = function (q) { return !!rangeBuild(q) && rangeBuild(q).check; };
  choiceQ({
    id: 'B13.basic', title: '일차부등식의 풀이', ids: RIDS, build: rangeBuild,
    levels: [
      { name: '한 단계', vars: { q: sampler(function (r) {
          return until(function () {
            var f = r.int(0, 3), k = nz(r, -9, 9), a, b;
            if (f === 0) { b = nz(r, -9, 9); return Qr(r, [[1, 'x'], [b, '']], [[k + b, '']]); }
            if (f === 1) { a = r.int(2, 9); return Qr(r, [[a, 'x']], [[a * k, '']]); }
            a = f === 2 ? -r.int(2, 9) : -r.int(1, 6); return Qr(r, [[a, 'x']], [[a * k, '']]);
          }, okQ);
        }) } },
      { name: '두 단계', vars: { q: sampler(function (r) {
          return until(function () { var a = pm(r, r.int(2, 8)), b = nz(r, -12, 12), k = nz(r, -8, 8); return Qr(r, [[a, 'x'], [b, '']], [[a * k + b, '']]); }, okQ);
        }) } },
      { name: '양쪽에 x가 있는 부등식', vars: { q: sampler(function (r) {
          return until(function () {
            var a = nz(r, -8, 8), c = nz(r, -8, 8), b = nz(r, -12, 12), k = nz(r, -8, 8), d = (a - c) * k + b;
            return Qr(r, [[a, 'x'], [b, '']], r.int(0, 1) ? [[c, 'x'], [d, '']] : [[d, ''], [c, 'x']]);
          }, function (q) { var d = cs(q.R)[0][0]; return d !== 0 && abs(d) <= 40 && okQ(q); });
        }) } }
    ]
  });
  var DENS = [[2, 3], [3, 2], [2, 4], [4, 2], [3, 4], [4, 3], [2, 5], [5, 2], [3, 6], [6, 3]];
  choiceQ({
    id: 'B13.paren', title: '괄호 · 분수 · 소수가 있는 부등식', ids: RIDS, build: rangeBuild,
    levels: [
      { name: '괄호', vars: { q: sampler(function (r) {
          return until(function () {
            var m = pm(r, r.int(2, 6)), p = nz(r, -6, 6), c = nz(r, -6, 6), k = nz(r, -7, 7), n, q2, d;
            if (r.int(0, 2)) { d = m * (k + p) - c * k; return Qr(r, [['g', m, [[1, 'x'], [p, '']]]], [[c, 'x'], [d, '']]); }
            n = pm(r, r.int(2, 5)); q2 = nz(r, -6, 6); d = m * (k + p) - n * (k + q2);
            return Qr(r, [['g', m, [[1, 'x'], [p, '']]]], [['g', n, [[1, 'x'], [q2, '']]], [d, '']]);
          }, function (q) { var d = cs(q.R)[0][0]; return d !== 0 && abs(d) <= 40 && okQ(q); });
        }) } },
      { name: '분수 계수', vars: { q: sampler(function (r) {
          return until(function () {
            var ds = r.pick(DENS), d1 = ds[0], d2 = ds[1], k, t, u, p, q2, e, L, R, n1, n2, b, m;
            if (r.int(0, 1)) {
              /* (x + p)/d1 op (x + q)/d2 + e : x = k 에서 양쪽이 같아지게 맞춘다 */
              k = nz(r, -7, 7); t = nz(r, -3, 3); u = nz(r, -3, 3); p = d1 * t - k; q2 = d2 * u - k; e = t - u;
              L = [['f', 1, [[1, 'x'], [p, '']], d1]]; R = [['f', 1, [[1, 'x'], [q2, '']], d2]]; if (e) R.push([e, '']);
              return p && q2 && abs(p) <= 9 && abs(q2) <= 9 ? Qr(r, L, R) : null;
            }
            /* (n1/d1)x + b op (n2/d2)x + d */
            m = lcm(d1, d2); k = m * nz(r, -2, 2); n1 = pm(r, r.int(1, d1 > 2 ? 2 : 1)); n2 = pm(r, 1); b = nz(r, -6, 6); e = n1 * k / d1 + b - n2 * k / d2;
            return e ? Qr(r, [['q', n1, d1, 'x'], [b, '']], [['q', n2, d2, 'x'], [e, '']]) : null;
          }, function (q) { return !!q && okQ(q); });
        }) } },
      { name: '소수 계수', vars: { q: sampler(function (r) {
          return until(function () {
            var n = nz(r, -9, 9), c = nz(r, -9, 9), k = nz(r, -9, 9), b = nz(r, -30, 30), d = (n - c) * k + b;
            return d && abs(d) <= 60 && abs(n) !== 10 ? Qr(r, [['d', n, 'x'], ['d', b, '']], r.int(0, 2) ? [['d', c, 'x'], ['d', d, '']] : [['d', d, ''], ['d', c, 'x']]) : null;
          }, function (q) { return !!q && okQ(q); });
        }) } }
    ]
  });

  /* ── 답이 수 하나인 유형의 틀 ── build(q) → { text, tex, ans, unit, hints, steps, wrong: { 실수 id: 수 }, check } */
  var numQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var leak = function (p) { var a = String(abs(p.ans)); return p.ans > 0 && nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0; };
    var where = function (v) { var p = P(v); return !!p && p.check === true && Number.isInteger(p.ans) && !leak(p); };
    o.levels.forEach(function (lv) { lv.where = where; });
    var val = function (n) { return o.kind === 'signed' ? { n: n, p: 0 } : n; };
    MH.defineType({
      id: o.id, unit: 'B13', version: 1, title: o.title,
      answer: o.kind === 'signed' ? { kind: 'signed', suffix: function (v) { return P(v).unit || ''; } } : { kind: 'int', common: false, suffix: function (v) { return P(v).unit || ''; } },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; return out; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v); return p.check === true && (o.kind === 'signed' ? ans.p === 0 && ans.n === p.ans : ans === p.ans); },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) { var p = P(v), x = p.wrong[m[0]]; return x === undefined || x === null || x === p.ans || !Number.isInteger(x) || (o.kind !== 'signed' && x < 0) ? null : val(x); },
          explain: function (v) { return m[1](P(v)); } };
      })
    });
  };
  var floorK = function (k) { return Math.floor(k.n / k.d); }, ceilK = function (k) { return Math.ceil(k.n / k.d); };
  /** 범위 'x op k' 안의 가장 큰(작은) 정수 */
  var edgeInt = function (op, k) { return op === 'lt' ? ceilK(k) - 1 : op === 'le' ? floorK(k) : op === 'gt' ? floorK(k) + 1 : ceilK(k); };

  /* ── B13.count 정수인 해 · 상수 구하기 ───────────────── */
  var INTS = '부등식의 해는 범위라서 수가 아주 많아요. 그 가운데 정수만 고르려면 수직선에 범위를 그려 보면 쉬워요. 경계의 수가 범위에 들어가는지(등호가 있는지)를 꼭 확인해요. $x < 4$이면 4는 들어가지 않아서 가장 큰 정수는 그보다 하나 작은 수이고, $x \\leq 4$이면 4도 들어가요.';
  var countBuild = function (q) {
    var s, ans, big, text, wrong = {}, steps, m, c, sv, a;
    if (q.kind === 'param') {
      /* m x + sg·a op c 의 해가 x op s 일 때 a : sg = ±1, m > 0 */
      m = q.m; sv = q.s; c = q.c; a = q.sg > 0 ? c - m * sv : m * sv - c;
      var tex = m + 'x ' + (q.sg > 0 ? '+' : '-') + ' a ' + OP[q.op].t + ' ' + c, moved = c + (q.sg > 0 ? ' - a' : ' + a');
      if (a === 0 || abs(a) > 30) return null;
      return {
        text: '$x$에 대한 부등식의 해가 $' + rng(q.op, sv) + '$일 때, 상수 $a$의 값을 구하세요.', tex: tex, ans: a, wrong: { 'move-sign': q.sg > 0 ? c + m * sv : -(m * sv) - c, 'not-divided': q.sg > 0 ? c - sv : sv - c },
        check: agree(I([[m, 'x'], [q.sg * a, '']], [[c, '']], q.op), q.op, { n: sv, d: 1 }),
        hints: ['$a$는 아직 모르는 수이지만, 보통의 수처럼 다루면 돼요. 먼저 $a$를 그대로 둔 채 부등식을 $x$에 대해 풀어요. 그러면 해가 "$x$ □ ($a$가 든 식)" 꼴로 나와요. 이것이 문제에서 알려 준 해와 똑같아야 해요.',
          '이 식에서 $a$가 든 항을 오른쪽으로 이항하고(부호가 바뀌어요), 양쪽을 $x$ 앞의 수 ' + m + pj(m, '으로/로') + ' 나눠요. 양수로 나누니 부등호의 방향은 그대로예요.',
          '① $x$에 대해 풀면 오른쪽에 $a$가 든 분수가 생겨요. ② 그 분수가 문제에서 알려 준 경계의 수와 같다고 놓아요. 그러면 $a$에 대한 방정식이 돼요. ③ 그 방정식을 풀어요. ④ 구한 $a$를 원래 부등식에 넣고 풀어서 해가 맞는지 확인해요.'],
        steps: [{ say: '$a$가 든 항을 오른쪽으로 이항해요.', tex: m + 'x ' + OP[q.op].t + ' ' + moved }, { say: '양쪽을 ' + m + pj(m, '으로/로') + ' 나눠요.', tex: 'x ' + OP[q.op].t + ' \\dfrac{' + moved + '}{' + m + '}' },
          { say: '이것이 주어진 해와 같아야 하니, 경계의 수끼리 같다고 놓아요.', tex: '\\dfrac{' + moved + '}{' + m + '} = ' + sv }, { say: '양쪽에 ' + m + pj(m, '을/를') + ' 곱하고 $a$를 구해요.', tex: 'a = ' + a }]
      };
    }
    s = solve(q.L, q.R, q.op);
    if (!s) return null;
    big = s.op === 'lt' || s.op === 'le';
    if (q.kind === 'ext') {
      ans = edgeInt(s.op, s.k);
      text = '부등식을 만족하는 가장 ' + (big ? '큰' : '작은') + ' 정수 $x$의 값을 구하세요.';
      if (s.k.d === 1) wrong[OP[s.op].strict ? 'boundary-included' : 'boundary-excluded'] = OP[s.op].strict ? s.k.n : s.k.n + (big ? -1 : 1);
      else wrong['rounded-wrong'] = big ? ceilK(s.k) : floorK(s.k);
      wrong['not-flipped'] = s.A < 0 ? edgeInt(OP[s.op].flip, s.k) : null;
      steps = s.steps.concat([{ say: '이 범위에서 가장 ' + (big ? '큰' : '작은') + ' 정수를 찾아요. ' + (s.k.d !== 1 ? '경계가 정수가 아니니 수직선에서 그 ' + (big ? '왼쪽' : '오른쪽') + '의 첫 정수예요.' : OP[s.op].strict ? '등호가 없으니 경계의 수는 들어가지 않아요.' : '등호가 있으니 경계의 수도 들어가요.'), tex: 'x = ' + ans }]);
    } else {
      if (!big || s.k.n <= 0) return null;
      ans = edgeInt(s.op, s.k);
      if (ans < 1 || ans > 12) return null;
      text = '부등식을 만족하는 자연수 $x$는 모두 몇 개인지 구하세요.';
      if (s.k.d === 1) wrong[OP[s.op].strict ? 'boundary-included' : 'boundary-excluded'] = OP[s.op].strict ? ans + 1 : ans - 1;
      else wrong['zero-counted'] = ans + 1;
      wrong['not-flipped'] = null;
      steps = s.steps.concat([{ say: '자연수는 1부터 시작해요. 범위 안의 자연수를 1부터 차례로 세요.', tex: 'x = ' + (ans <= 4 ? Array.apply(null, { length: ans }).map(function (_, i) { return i + 1; }).join(',\\ ') : '1,\\ 2,\\ \\cdots,\\ ' + ans) }, { say: '개수를 세요.', tex: String(ans) }]);
    }
    return {
      text: text, tex: s.tex, ans: ans, unit: q.kind === 'cnt' ? '개' : '', wrong: wrong, steps: steps, check: agree(s.tex, s.op, s.k) && abs(ans) <= 40 && abs(s.k.n) <= 60,
      hints: [INTS, '먼저 부등식을 풀어서 $x$의 범위를 구해요. 방정식처럼 이항해서 정리하고, 마지막에 $x$ 앞의 수로 나눠요. 이 식을 정리하면 $x$ 앞의 수가 ' + (s.A < 0 ? '음수' : '양수') + '(' + s.A + ')가 돼요. 음수로 나눌 때는 부등호의 방향을 뒤집어요.',
        q.kind === 'ext' ? '① 구한 범위를 수직선에 그려요. ② 경계의 수가 범위에 들어가는지 봐요(등호가 있으면 들어가요). 경계가 분수이면 그 수는 정수가 아니니 건너뛰어요. ③ 범위 안에서 가장 ' + (big ? '오른쪽' : '왼쪽') + '에 있는 정수를 읽어요.'
          : '① 구한 범위를 수직선에 그려요. ② 자연수는 1, 2, 3, … 이에요. 0과 음수는 자연수가 아니에요. ③ 1부터 시작해서 범위 안에 있는 자연수를 차례로 세요. 경계의 수가 들어가는지(등호가 있는지) 꼭 확인해요.']
    };
  };
  numQ({
    id: 'B13.count', title: '정수인 해 · 상수 구하기', kind: 'signed', build: countBuild,
    mistakes: [
      ['boundary-included', function () { return '경계의 수를 넣어서 생각했어요. 부등호에 등호가 없으면(>, <) 경계의 수는 범위에 들어가지 않아요. 수직선에서 속이 빈 점(○)이에요.'; }],
      ['boundary-excluded', function () { return '경계의 수를 빼고 생각했어요. 부등호에 등호가 있으면(≥, ≤) 경계의 수도 범위에 들어가요. 수직선에서 속이 찬 점(●)이에요.'; }],
      ['rounded-wrong', function () { return '경계의 반대쪽에 있는 정수를 골랐어요. 경계가 분수일 때는 수직선에 그려서 범위 안쪽에 있는 첫 정수를 찾아요. 범위 밖의 정수는 해가 아니에요.'; }],
      ['zero-counted', function () { return '하나 더 셌어요. 자연수는 1부터 시작해요(0은 자연수가 아니에요). 그리고 경계가 분수이면 그보다 큰 정수는 범위 밖이에요.'; }],
      ['not-flipped', function () { return '음수로 나눌 때 부등호의 방향을 바꾸지 않아서 범위가 반대쪽이 됐어요. 음수로 곱하거나 나누면 방향이 뒤집혀요.'; }],
      ['move-sign', function () { return '이항할 때 부호를 바꾸지 않았어요. 부등호나 등호를 건너는 항은 부호가 바뀌어요(+는 −로, −는 +로).'; }],
      ['not-divided', function () { return '$x$ 앞의 수로 나누는 것을 빠뜨렸어요. 해의 경계는 이항한 다음 $x$ 앞의 수로 나눈 값이에요. 그 값이 주어진 해의 경계와 같아야 해요.'; }]
    ],
    levels: [
      { name: '가장 큰 정수 · 가장 작은 정수', vars: { q: sampler(function (r) {
          return until(function () { var a = nz(r, -7, 7), c = r.int(0, 1) ? nz(r, -6, 6) : 0, b = nz(r, -12, 12), d = r.int(-20, 20), R = c ? [[c, 'x']] : []; if (d || !c) R.push([d, '']); return { kind: 'ext', L: [[a, 'x'], [b, '']], R: R, op: r.pick(OPS) }; },
            function (q) { var p = countBuild(q); return !!p && p.check; });
        }) } },
      { name: '자연수인 해의 개수', vars: { q: sampler(function (r) {
          return until(function () { var a = nz(r, -6, 6), c = r.int(0, 1) ? nz(r, -5, 5) : 0, b = nz(r, -12, 12), d = r.int(-20, 30), R = c ? [[c, 'x']] : []; if (d || !c) R.push([d, '']); return { kind: 'cnt', L: [[a, 'x'], [b, '']], R: R, op: r.pick(OPS) }; },
            function (q) { var p = countBuild(q); return !!p && p.check; });
        }) } },
      { name: '해가 주어졌을 때 상수 구하기', vars: { q: sampler(function (r) {
          return until(function () { return { kind: 'param', m: r.int(2, 6), sg: pm(r, 1), s: nz(r, -7, 7), c: r.int(-12, 15), op: r.pick(OPS) }; }, function (q) { var p = countBuild(q); return !!p && p.check; });
        }) } }
    ]
  });

  /* ── B13.word 부등식의 활용 ─────────────────────────── */
  var PLAN = '활용 문제는 네 걸음으로 풀어요. ① 구하는 것을 $x$로 놓아요. ② 문장을 식으로 옮겨요. "이하 · 이내 · 넘지 않게"는 ≤, "이상"은 ≥, "~보다 많다 · 유리하다"는 >나 <예요. ③ 부등식을 풀어요. ④ 답이 될 수 있는 수인지 따져요. 개수나 개월 수는 자연수라서, 범위 안의 가장 큰(또는 가장 작은) 자연수를 골라요.';
  var THINGS = [['사과', '개', '상자'], ['빵', '개', '상자'], ['장미', '송이', '꽃바구니'], ['공책', '권', '가방'], ['초콜릿', '개', '선물 상자'], ['귤', '개', '바구니']];
  var GOODS = [['공책', '권'], ['볼펜', '자루'], ['음료수', '병'], ['과자', '봉지'], ['양말', '켤레']];
  var wordBuild = function (q) {
    var s, ans, th, text, unit, h2, h3, wrong = {}, fin, big, raw, x;
    if (q.kind === 'buy') {
      th = THINGS[q.t]; s = solve([[q.p, 'x'], [q.f, '']], [[q.M, '']], 'le'); unit = th[1];
      text = '한 ' + th[1] + '에 ' + won(q.p) + '원인 ' + th[0] + josa(th[0], '을/를').slice(th[0].length) + ' ' + won(q.f) + '원짜리 ' + th[2] + '에 담아서 사려고 해요. 전체 금액이 ' + won(q.M) + '원 이하가 되게 하려면 ' + th[0] + josa(th[0], '을/를').slice(th[0].length) + ' 최대 몇 ' + th[1] + '까지 살 수 있는지 구하세요.';
      h2 = th[0] + josa(th[0], '을/를').slice(th[0].length) + ' $x$' + th[1] + ' 산다고 해요. ' + th[0] + ' 값은 (한 ' + th[1] + '의 값) × $x$이고, 여기에 ' + th[2] + ' 값을 더한 것이 전체 금액이에요. 이것이 가진 돈을 넘지 않아야 하니 "전체 금액 ≤ ' + won(q.M) + '"으로 써요. ' + th[2] + ' 값은 한 번만 더해요.';
      wrong['fee-ignored'] = Math.floor(q.M / q.p); wrong['rounded-up'] = s.k.d !== 1 && ceilK(s.k) !== wrong['fee-ignored'] ? ceilK(s.k) : null;
    } else if (q.kind === 'avg') {
      s = solve([['f', 1, [[1, 'x'], [q.s1 + q.s2, '']], 3]], [[q.tg, '']], 'ge'); unit = '점';
      text = '수학 시험을 두 번 봐서 ' + q.s1 + '점과 ' + q.s2 + '점을 받았어요. 세 번의 시험 점수의 평균이 ' + q.tg + '점 이상이 되려면, 세 번째 시험에서 몇 점 이상을 받아야 하는지 구하세요.';
      h2 = '세 번째 점수를 $x$점이라고 해요. 평균은 (세 점수의 합) ÷ 3이에요. 세 점수의 합은 앞의 두 점수와 $x$를 더한 것이에요. 이 평균이 목표 점수보다 크거나 같아야 하니 ≥를 써요. 양쪽에 3을 곱하면 "세 점수의 합 ≥ 목표 점수의 3배"가 돼요.';
      wrong['target-only'] = q.tg; wrong['avg-two'] = (q.s1 + q.s2) % 2 === 0 ? (q.s1 + q.s2) / 2 : null;
    } else if (q.kind === 'better') {
      th = GOODS[q.t]; s = solve([[q.a, 'x']], [[q.b, 'x'], [q.f, '']], 'gt'); unit = th[1];
      text = '집 앞 가게에서는 ' + th[0] + ' 한 ' + th[1] + josa(th[1], '이/가').slice(th[1].length) + ' ' + won(q.a) + '원이고, 할인점에서는 ' + won(q.b) + '원이에요. 할인점에 다녀오려면 왕복 교통비 ' + won(q.f) + '원이 들어요. ' + th[0] + josa(th[0], '을/를').slice(th[0].length) + ' 몇 ' + th[1] + ' 이상 살 때 할인점에서 사는 것이 유리한지 구하세요.';
      h2 = th[0] + josa(th[0], '을/를').slice(th[0].length) + ' $x$' + th[1] + ' 산다고 해요. 집 앞 가게에서 드는 돈은 (한 ' + th[1] + '의 값) × $x$예요. 할인점에서 드는 돈은 (한 ' + th[1] + '의 값) × $x$에 교통비를 더한 것이에요. "유리하다"는 돈이 더 적게 든다는 뜻이니, (집 앞 가게) > (할인점)으로 써요. 두 곳의 돈이 똑같으면 유리한 것이 아니에요.';
      wrong['boundary-included'] = s.k.d === 1 ? s.k.n : null; wrong['rounded-down'] = s.k.d !== 1 ? floorK(s.k) : null;
    } else if (q.kind === 'save') {
      s = solve([[q.b, 'x'], [q.B, '']], [[q.a, 'x'], [q.A, '']], 'gt'); unit = '개월';
      text = '지금 형의 통장에는 ' + won(q.A) + '원, 동생의 통장에는 ' + won(q.B) + '원이 들어 있어요. 다음 달부터 매달 형은 ' + won(q.a) + '원씩, 동생은 ' + won(q.b) + '원씩 저금해요. 동생의 예금액이 형의 예금액보다 많아지는 것은 몇 개월 후부터인지 구하세요.';
      h2 = '$x$개월 후라고 해요. $x$개월 후의 예금액은 (지금 있는 돈) + (매달 넣는 돈) × $x$예요. 형과 동생의 예금액을 각각 이렇게 식으로 써요. 동생 쪽이 더 많아져야 하니 (동생의 예금액) > (형의 예금액)으로 써요. 똑같아지는 달은 아직 "많아진" 것이 아니에요.';
      wrong['boundary-included'] = s.k.d === 1 ? s.k.n : null; wrong['rounded-down'] = s.k.d !== 1 ? floorK(s.k) : null;
    } else {
      s = solve([['q', 1, q.u, 'x'], ['q', 1, q.v, 'x']], [[q.T, '']], 'le'); unit = 'km';
      text = '등산을 하는데 올라갈 때는 시속 ' + q.u + ' km로 걷고, 내려올 때는 같은 길을 시속 ' + q.v + ' km로 걸어요. 전체 걸리는 시간을 ' + q.T + '시간 이내로 하려면 최대 몇 km 지점까지 올라갔다 올 수 있는지 구하세요.';
      h2 = '올라가는 거리를 $x$ km라고 해요. 같은 길로 내려오니 내려오는 거리도 $x$ km예요. 시간은 (거리) ÷ (속력)이에요. 올라가는 시간과 내려오는 시간을 각각 분수로 쓰고 더해요. 이 합이 정해진 시간을 넘지 않아야 하니 ≤를 써요.';
      wrong['up-only'] = q.u * q.T; wrong['speed-added'] = q.T * (q.u + q.v);
    }
    if (!s) return null;
    big = s.op === 'lt' || s.op === 'le'; ans = edgeInt(s.op, s.k);
    fin = s.k.d === 1 && !OP[s.op].strict ? '등호가 있으니 경계의 수가 바로 답이에요.' : s.k.d === 1 ? '등호가 없으니 경계의 수는 답이 아니에요. 그다음 자연수가 답이에요.' : '경계가 자연수가 아니에요. 범위 안에 있는 가장 ' + (big ? '큰' : '작은') + ' 자연수를 골라요.';
    h3 = '① 위에서 말로 세운 식을 숫자와 $x$로 옮겨 부등식을 만들어요. ② 부등식을 풀어요. $x$가 있는 항은 왼쪽, 수는 오른쪽으로 모으고 $x$ 앞의 수로 나눠요. ③ 나온 범위에서 답을 골라요. ' + (q.kind === 'avg' || q.kind === 'dist' ? '등호가 있는 범위이면 경계의 수가 바로 답이 될 수 있어요.' : '답은 자연수여야 해요. "최대"이면 범위 안의 가장 큰 자연수, "~ 이상 · ~부터"이면 범위 안의 가장 작은 자연수예요. 경계의 수가 범위에 들어가는지 꼭 확인해요.');
    /* 상황대로 직접 확인: 답은 조건에 맞고, 한 걸음 더 간 수는 맞지 않는다 */
    raw = function (x) {
      if (q.kind === 'buy') return q.p * x + q.f <= q.M;
      if (q.kind === 'avg') return q.s1 + q.s2 + x >= 3 * q.tg;
      if (q.kind === 'better') return q.a * x > q.b * x + q.f;
      if (q.kind === 'save') return q.B + q.b * x > q.A + q.a * x;
      return x * q.v + x * q.u <= q.T * q.u * q.v;
    };
    x = big ? ans + 1 : ans - 1;
    return {
      text: text, ans: ans, unit: unit, wrong: wrong, hints: [PLAN, h2, h3],
      steps: [{ say: '구하는 것을 $x$로 놓고 부등식을 세워요.', tex: s.tex }].concat(s.steps).concat([{ say: fin, tex: 'x = ' + ans }]),
      check: agree(s.tex, s.op, s.k) && raw(ans) && !raw(x) && ans >= 2
    };
  };
  var okW = function (lim) { return function (q) { var p = wordBuild(q); return !!p && p.check && p.ans <= lim; }; };
  var UV = [[2, 3, [5, 10]], [3, 6, [2, 3, 4, 5]], [2, 4, [3, 6, 9]], [3, 4, [7]], [4, 6, [5]], [2, 6, [2, 4, 6]], [4, 12, [1, 2, 3]], [3, 5, [8]]];
  numQ({
    id: 'B13.word', title: '부등식의 활용', kind: 'int', build: wordBuild,
    mistakes: [
      ['fee-ignored', function () { return '담는 것의 값을 빼지 않았어요. 가진 돈에서 상자(포장) 값을 먼저 빼고, 남은 돈으로 살 수 있는 개수를 구해야 해요.'; }],
      ['rounded-up', function () { return '올림해서 하나 더 샀어요. 그러면 전체 금액이 가진 돈을 넘어요. "최대 몇 개"는 범위 안에서 가장 큰 자연수라서, 소수점 아래를 버려요.'; }],
      ['target-only', function () { return '목표 평균 점수를 그대로 답했어요. 앞의 두 점수가 목표보다 높거나 낮으면 세 번째 점수는 달라져요. 세 점수의 합이 목표 점수의 3배 이상이 되어야 해요.'; }],
      ['avg-two', function () { return '앞의 두 점수의 평균을 구했어요. 구하는 것은 세 번째 점수예요. 세 점수의 합이 목표 점수의 3배 이상이 되도록 식을 세워요.'; }],
      ['boundary-included', function () { return '두 쪽이 똑같아지는 수를 답했어요. 똑같을 때는 아직 "유리하다 · 많아진다"가 아니에요. 그다음 자연수부터가 답이에요.'; }],
      ['rounded-down', function () { return '소수점 아래를 버렸어요. 그 수는 아직 범위에 들어가지 않아요. "~ 이상 · ~부터"는 범위 안에서 가장 작은 자연수라서, 올림해요.'; }],
      ['up-only', function () { return '올라가는 데만 시간을 다 썼어요. 정해진 시간은 올라가는 시간과 내려오는 시간을 더한 것이에요. 두 시간을 각각 (거리) ÷ (속력)으로 써서 더해요.'; }],
      ['speed-added', function () { return '두 속력을 더해서 시간을 곱했어요. 올라갈 때와 내려올 때의 속력이 다르니, 시간을 따로따로 (거리) ÷ (속력)으로 구해서 더해야 해요.'; }]
    ],
    levels: [
      { name: '최대 개수', vars: { q: sampler(function (r) {
          return until(function () { return { kind: 'buy', t: r.int(0, THINGS.length - 1), p: r.int(3, 15) * 100, f: r.int(1, 6) * 500, M: r.int(5, 20) * 1000 }; }, okW(30));
        }) } },
      { name: '평균 · 유리한 선택', vars: { q: sampler(function (r) {
          return until(function () {
            var b;
            if (r.int(0, 1)) return { kind: 'avg', s1: r.int(60, 98), s2: r.int(60, 98), tg: r.int(70, 92) };
            b = r.int(4, 12) * 100; return { kind: 'better', t: r.int(0, GOODS.length - 1), a: b + r.int(1, 5) * 50, b: b, f: r.int(10, 40) * 100 };
          }, function (q) { var p = wordBuild(q); return !!p && p.check && (q.kind === 'avg' ? p.ans >= 50 && p.ans <= 100 && p.ans !== q.tg : p.ans <= 40); });
        }) } },
      { name: '예금 · 거리와 시간', vars: { q: sampler(function (r) {
          return until(function () {
            var uv, a;
            if (r.int(0, 1)) { a = r.int(2, 8) * 1000; return { kind: 'save', A: r.int(20, 60) * 1000, B: r.int(5, 30) * 1000, a: a, b: a + r.int(1, 6) * 500 }; }
            uv = r.pick(UV); return { kind: 'dist', u: uv[0], v: uv[1], T: r.pick(uv[2]) };
          }, function (q) { var p = wordBuild(q); return !!p && p.check && (q.kind !== 'save' || q.A > q.B) && p.ans <= 40; });
        }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B13', [
  { title: '부등식과 부등호', body: [
    '두 수나 식의 크기를 견주는 식이 부등식이에요. 부등호는 벌어진 쪽이 큰 쪽이에요.',
    { ex: [['x > 3', '3보다 크다(초과). 3은 들어가지 않아요.'], ['x \\geq 3', '3보다 크거나 같다(이상). 3도 들어가요.'], ['x < 3', '3보다 작다(미만). 3은 들어가지 않아요.'], ['x \\leq 3', '3보다 작거나 같다(이하). 3도 들어가요.']] },
    '"크지 않다"는 "작거나 같다(≤)", "작지 않다"는 "크거나 같다(≥)"와 같은 말이에요.'
  ] },
  { title: '해와 수직선', body: [
    '부등식을 참이 되게 하는 $x$의 값이 해예요. 방정식의 해는 보통 하나이지만, 부등식의 해는 범위라서 아주 많아요.',
    '해는 수직선에 그려요. 아래 그림은 $x \\geq -1$이에요. −1이 들어가니 속이 찬 점(●)을 찍고, 큰 쪽인 오른쪽으로 선을 그어요.',
    { figure: { type: 'line', min: -4, max: 4, parts: 1, ray: { at: 3, dir: 1, open: false } } },
    '아래 그림은 $x < 2$예요. 2는 들어가지 않으니 속이 빈 점(○)을 찍고, 작은 쪽인 왼쪽으로 선을 그어요.',
    { figure: { type: 'line', min: -4, max: 4, parts: 1, ray: { at: 6, dir: -1, open: true } } }
  ] },
  { title: '부등식의 성질', body: [
    '부등식은 기울어진 저울이에요. 양쪽에 같은 일을 해도 대부분 기운 쪽이 그대로예요.',
    { list: ['양쪽에 같은 수를 더하거나 빼도 방향은 그대로예요.', '양쪽에 같은 양수를 곱하거나 나눠도 방향은 그대로예요.', '양쪽에 같은 음수를 곱하거나 나누면 방향이 바뀌어요.'] },
    { ex: [['2 < 5', '처음'], ['2 + 3 < 5 + 3', '3을 더해도 그대로'], ['2 \\times 3 < 5 \\times 3', '양수 3을 곱해도 그대로'], ['2 \\times (-3) > 5 \\times (-3)', '음수 −3을 곱하면 −6 > −15, 방향이 바뀌어요']] },
    '빚 2만 원이 빚 5만 원보다 나은 것처럼, 음수의 세계에서는 크기 순서가 뒤집혀요.'
  ] },
  { title: '일차부등식 풀기', body: [
    '방정식을 풀 때와 똑같이 해요. 딱 하나, 음수로 곱하거나 나눌 때만 부등호의 방향을 뒤집어요.',
    { list: ['① 괄호가 있으면 풀고, 분수 · 소수가 있으면 양쪽에 알맞은 양수를 곱해서 정수로 바꿔요.', '② $x$가 있는 항은 왼쪽, 수는 오른쪽으로 이항해요(이항으로는 방향이 안 바뀌어요).', '③ 양쪽을 정리해서 $ax > b$ 꼴로 만들어요.', '④ $x$ 앞의 수로 나눠요. 그 수가 음수이면 방향을 뒤집어요.'] },
    { tex: '3x + 2 \\leq 5x - 6 \\;\\Rightarrow\\; -2x \\leq -8 \\;\\Rightarrow\\; x \\geq 4' }
  ] },
  { title: '부등식의 활용', body: [
    '문장으로 된 문제는 네 걸음으로 풀어요.',
    { list: ['① 구하는 것을 $x$로 놓아요.', '② 문장을 부등식으로 옮겨요. "이하 · 이내"는 ≤, "이상"은 ≥예요.', '③ 부등식을 풀어요.', '④ 답이 될 수 있는 수인지 따져요.'] },
    '개수는 자연수예요. 범위가 $x \\leq 3.5$로 나왔다면 살 수 있는 가장 많은 개수는 3개예요(4개는 돈이 모자라요).',
    '"몇 개 이상 사야 유리한가"처럼 가장 작은 수를 묻는데 범위가 $x > 7.5$라면 답은 8개예요.'
  ] }
]);
