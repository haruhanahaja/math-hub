/* B09 좌표평면과 정비례 · 반비례 — 순서쌍, 사분면, 그래프 읽기, y = ax, y = a/x
   유형(쉬운 것부터): B09.point 점의 좌표(보기 고르기) · B09.quadrant 사분면(보기 고르기) · B09.direct 정비례 y = ax(키패드)
                     · B09.inverse 반비례 y = a/x(키패드) · B09.graph 그래프와 식(보기 고르기)
   답이 수 하나이면 키패드(정비례는 a 가 분수일 수 있어 rational, 반비례는 signed), 답이 순서쌍 · 사분면 · 식이면 보기 고르기다.
   좌표평면 그림은 prompt 의 figure { type: 'plane', … } 로 그린다(ui.js 의 MH.figure). 그래프는 문제에 보여 주고 식을 고르게 한다.
   수는 정확한 분수 { n, d } 로 계산한다. 검산(check)은 화면에 보이는 식을 MH.alg.ev 로 다시 읽어 점의 좌표를 넣어 본다. */
(function () {
  'use strict';
  var MH = globalThis.MH, josa = MH.josa, A = MH.alg, order4 = A.order4, gcd = MH.gcd, abs = Math.abs, F = MH.F;
  var sampler = function (fn) { return new MH.Sampler(fn); };
  var nz = function (r, lo, hi) { var x; do { x = r.int(lo, hi); } while (x === 0); return x; };
  var pm = function (r, x) { return r.int(0, 1) ? x : -x; };
  /** 수 뒤에 붙일 조사만: pj(-3, '을/를') → '을' */
  var pj = function (n, pair) { var w = String(abs(n)); return josa(w, pair).slice(w.length); };
  /** 정확한 분수 { n, d } (d > 0, 약분됨). 분모가 0 이면 null */
  var rat = function (n, d) { if (!d) return null; if (d < 0) { n = -n; d = -d; } var g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
  var ratTex = function (r) { return (r.n < 0 ? '-' : '') + (r.d === 1 ? abs(r.n) : '\\dfrac{' + abs(r.n) + '}{' + r.d + '}'); };
  var par = function (n) { return n < 0 ? '(' + n + ')' : String(n); };
  /** 순서쌍 (3, −2) */
  var pt = function (x, y) { return '(' + x + ',\\ ' + y + ')'; };
  /** 정비례의 오른쪽: ax(1 은 쓰지 않는다) · 반비례의 오른쪽: a/x */
  var ax = function (r) { return (r.n < 0 ? '-' : '') + (r.d === 1 ? (abs(r.n) === 1 ? '' : abs(r.n)) : '\\dfrac{' + abs(r.n) + '}{' + r.d + '}') + 'x'; };
  var overx = function (a) { return (a < 0 ? '-' : '') + '\\dfrac{' + abs(a) + '}{x}'; };
  /** 식 'y = …' 의 오른쪽에 x 를 넣은 값(분수) */
  var at = function (eq, x) { return A.ev(eq.split(' = ')[1], { x: F(x.n, x.d) }); };
  var same = function (fr, r) { return fr.equals(F(r.n, r.d)); };
  var nums = function (t) { return t.match(/\d+/g) || []; };
  var QN = ['제1사분면', '제2사분면', '제3사분면', '제4사분면'];
  /** 부호(+1, −1) 두 개 → 사분면 번호 0 ~ 3 */
  var quad = function (sx, sy) { return sx > 0 ? (sy > 0 ? 0 : 3) : (sy > 0 ? 1 : 2); };
  var SG = function (s) { return s > 0 ? '+' : '−'; };

  /* ── 보기 고르기 유형의 공통 틀 ──
     o = { id, title, levels, ids: [실수 id …], build: (q) → 문제 | null }
     문제 = { text, tex, figure, ans, wrong: [[보기, 실수 id, 설명] …], options(정해진 보기 순서. 없으면 v.q.o 로 섞는다), hints, steps, check(직접 확인) } */
  var choiceQ = function (o) {
    var lastQ = null, lastP = null;
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var all = function (p) { return [p.ans].concat(p.wrong.map(function (w) { return w[0]; })); };
    var options = function (v) { var p = P(v), list = all(p); return p.options || v.q.o.map(function (i) { return list[i]; }); };
    var good = function (v) {
      var p = P(v), list;
      if (!p || p.check !== true || p.wrong.length !== 3) return false;
      list = all(p);
      return list.every(function (t, i) { return list.indexOf(t) === i; }) && (!p.options || (p.options.length === 4 && list.every(function (t) { return p.options.indexOf(t) >= 0; })));
    };
    o.levels.forEach(function (lv) { lv.where = good; });
    MH.defineType({
      id: o.id, unit: 'B09', version: 1, title: o.title,
      answer: { kind: 'choice', options: options },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; if (p.figure) out.figure = p.figure; return out; },
      solve: function (v) { return P(v).ans; },
      verify: function (v, ans) { return good(v) && ans === P(v).ans && options(v).indexOf(ans) >= 0; },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(); out[out.length - 1] = { say: out[out.length - 1].say, tex: out[out.length - 1].tex, value: p.ans }; return out; },
      mistakes: o.ids.map(function (id) {
        var find = function (v) { return P(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
        return { id: id, wrong: function (v) { var w = find(v); return w ? w[0] : null; }, explain: function (v) { var w = find(v); return w ? w[2] : ''; } };
      })
    });
  };
  /** 후보 [[보기, id, 설명] …] 가운데 정답과 다르고 서로 다른 것 셋 */
  var pick3 = function (ans, cands) {
    var out = [];
    cands.forEach(function (c) { if (c && out.length < 3 && c[0] !== ans && out.every(function (w) { return w[0] !== c[0]; })) out.push(c); });
    return out;
  };

  /* ── 답이 수 하나인 유형의 공통 틀 ──
     o = { id, title, kind: 'signed' | 'rational', levels, build: (q) → 문제 | null, mistakes: [[실수 id, (문제) → 설명] …] }
     문제 = { text, tex, figure, ans: { n, d }, hints, steps, wrong: { 실수 id: 수 | { n, d } }, check } */
  var valueQ = function (o) {
    var lastQ = null, lastP = null, rational = o.kind === 'rational';
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var val = function (r) { return rational ? { n: r.n, d: r.d } : { n: r.n, p: 0 }; };
    /* 힌트에 나온 수가 문제에 없는데 우연히 답과 같으면 답을 알려 주는 셈이다 */
    var leak = function (p) {
      if (p.ans.d !== 1 || p.ans.n < 0) return false;
      var a = String(p.ans.n);
      return nums((p.tex || '') + ' ' + p.text).indexOf(a) < 0 && nums(p.hints.join(' ')).indexOf(a) >= 0;
    };
    o.levels.forEach(function (lv) {
      lv.where = function (v) { var p = P(v); return !!p && !!p.ans && p.ans.n !== 0 && (rational || p.ans.d === 1) && p.check === true && !leak(p); };
    });
    MH.defineType({
      id: o.id, unit: 'B09', version: 1, title: o.title,
      answer: { kind: o.kind },
      levels: o.levels,
      prompt: function (v) { var p = P(v), out = { text: p.text }; if (p.tex) out.tex = p.tex; if (p.figure) out.figure = p.figure; return out; },
      solve: function (v) { return val(P(v).ans); },
      verify: function (v, ans) { var p = P(v), r = rat(ans.n, rational ? ans.d : 1); return p.check === true && r.n === p.ans.n && r.d === p.ans.d && (!rational || gcd(ans.n, ans.d) === 1); },
      hints: function (v) { return P(v).hints; },
      steps: function (v) { var p = P(v), out = p.steps.slice(), last = out[out.length - 1]; out[out.length - 1] = { say: last.say, tex: last.tex, value: val(p.ans) }; return out; },
      mistakes: o.mistakes.map(function (m) {
        return { id: m[0],
          wrong: function (v) {
            var p = P(v), r = p.wrong[m[0]];
            if (r === null || r === undefined) return null;
            if (typeof r === 'number') r = Number.isInteger(r) ? rat(r, 1) : null;
            if (!r || (r.n === p.ans.n && r.d === p.ans.d) || (!rational && r.d !== 1)) return null;
            return val(r);
          },
          explain: function (v) { return m[1](P(v)); } };
      })
    });
  };

  /* ── B09.point 점의 좌표 (보기 고르기) ─────────────────
     read  그림의 점 P 의 좌표 · axis  축 위의 점 · find  좌표에 맞는 점 고르기 · sym  대칭인 점 */
  var SEAT = '좌표는 점의 주소예요. 영화관에서 자리를 "몇 열 몇 번"으로 찾듯이, 좌표평면의 점은 "가로로 얼마, 세로로 얼마"로 나타내요. 가로 위치가 $x$좌표, 세로 위치가 $y$좌표이고, 괄호 안에 $x$좌표를 먼저, $y$좌표를 나중에 써요.';
  var side = function (x) { return x > 0 ? '오른쪽' : '왼쪽'; };
  var updown = function (y) { return y > 0 ? '위' : '아래'; };
  var coordOk = function (ans, x, y) { var m = /^\((-?\d+),\\ (-?\d+)\)$/.exec(ans); return !!m && Number(m[1]) === x && Number(m[2]) === y; };
  var POINT = {
    read: function (q) {
      var x = q.x, y = q.y, ans = pt(x, y);
      return { text: '점 P의 좌표를 고르세요.', figure: { type: 'plane', range: 5, points: [{ x: x, y: y, label: 'P' }] }, ans: ans, check: coordOk(ans, x, y),
        wrong: pick3(ans, [
          [pt(y, x), 'swapped', '$x$좌표와 $y$좌표의 순서가 바뀌었어요. 괄호 안에는 가로 위치($x$좌표)를 먼저, 세로 위치($y$좌표)를 나중에 써요.'],
          [pt(-x, y), 'x-sign', '$x$좌표의 부호가 틀렸어요. 점이 원점의 오른쪽에 있으면 $x$좌표가 양수, 왼쪽에 있으면 음수예요. 이 점은 원점의 ' + side(x) + '에 있어요.'],
          [pt(x, -y), 'y-sign', '$y$좌표의 부호가 틀렸어요. 점이 원점보다 위에 있으면 $y$좌표가 양수, 아래에 있으면 음수예요. 이 점은 원점보다 ' + updown(y) + '에 있어요.'],
          [pt(-x, -y), 'both-sign', '두 좌표의 부호가 모두 틀렸어요. 오른쪽과 위가 양수, 왼쪽과 아래가 음수예요. 이 점은 원점의 ' + side(x) + ', ' + updown(y) + '에 있어요.']]),
        hints: [SEAT,
          '① 점 P에서 $x$축(가로로 누운 축)까지 똑바로 내려가거나 올라가서 만나는 눈금을 읽어요. 그 수가 $x$좌표예요. 원점 O의 오른쪽 눈금은 양수, 왼쪽 눈금은 음수예요. 점 P는 원점의 ' + side(x) + '에 있어요.',
          '② 점 P에서 $y$축(세로로 선 축)까지 옆으로 똑바로 가서 만나는 눈금이 $y$좌표예요. 원점보다 위의 눈금은 양수, 아래의 눈금은 음수예요. 점 P는 원점보다 ' + updown(y) + '에 있어요. ③ 읽은 두 수를 ($x$좌표, $y$좌표) 순서로 써요.'],
        steps: [{ say: '$x$좌표를 읽어요. 점 P는 원점에서 ' + side(x) + '으로 ' + abs(x) + '칸 떨어져 있어요.', tex: 'x = ' + x },
          { say: '$y$좌표를 읽어요. 점 P는 원점에서 ' + updown(y) + '로 ' + abs(y) + '칸 떨어져 있어요.', tex: 'y = ' + y },
          { say: '$x$좌표를 먼저, $y$좌표를 나중에 써요.', tex: ans }] };
    },
    axis: function (q) {
      var onX = q.on === 'x', t = q.t, x = onX ? t : 0, y = onX ? 0 : t, ans = pt(x, y), name = onX ? '$x$축' : '$y$축', zero = onX ? '$y$좌표' : '$x$좌표';
      return { text: '점 P의 좌표를 고르세요.', figure: { type: 'plane', range: 5, points: [{ x: x, y: y, label: 'P' }] }, ans: ans, check: coordOk(ans, x, y),
        wrong: [[pt(y, x), 'axis-swap', '두 좌표의 자리가 바뀌었어요. 점 P는 ' + name + ' 위에 있어요. ' + name + ' 위의 점은 ' + zero + '가 0이에요.'],
          [pt(-x, -y), 'axis-sign', '부호가 틀렸어요. 오른쪽과 위가 양수, 왼쪽과 아래가 음수예요. 점 P는 원점의 ' + (onX ? side(t) : updown(t)) + '에 있어요.'],
          [pt(t, t), 'on-both', '0을 써야 할 자리에도 같은 수를 썼어요. 점 P는 ' + name + ' 위에 있어서 ' + (onX ? '위아래로는' : '좌우로는') + ' 조금도 움직이지 않았어요. 그래서 ' + zero + '는 0이에요.']],
        hints: [SEAT,
          '점 P는 축 위에 놓여 있어요. ' + name + ' 위에 있는 점은 원점에서 ' + (onX ? '좌우로만 움직이고 위아래로는' : '위아래로만 움직이고 좌우로는') + ' 움직이지 않은 점이에요. 움직이지 않은 방향의 좌표는 0이에요.',
          '① 점 P가 원점에서 ' + (onX ? side(t) + '으로' : updown(t) + '로') + ' 몇 칸 떨어져 있는지 세어요. ' + (onX ? '오른쪽은 양수, 왼쪽은 음수' : '위는 양수, 아래는 음수') + '예요. ② 그 수를 ' + (onX ? '$x$좌표' : '$y$좌표') + ' 자리에 쓰고, 나머지 자리에는 0을 써요. $x$좌표가 앞, $y$좌표가 뒤예요.'],
        steps: [{ say: '점 P는 ' + name + ' 위에 있어요. ' + name + ' 위의 점은 ' + zero + '가 0이에요.', tex: (onX ? 'y' : 'x') + ' = 0' },
          { say: '원점에서 ' + (onX ? side(t) + '으로 ' : updown(t) + '로 ') + abs(t) + '칸 떨어져 있어요.', tex: (onX ? 'x' : 'y') + ' = ' + t },
          { say: '$x$좌표를 먼저, $y$좌표를 나중에 써요.', tex: ans }] };
    },
    find: function (q) {
      var x = q.x, y = q.y, names = ['A', 'B', 'C', 'D'], cand = [[x, y], [y, x], [-x, y], [x, -y]], lab = q.lab.map(function (i) { return names[i]; });
      if (abs(x) === abs(y)) return null;
      return { text: '좌표가 $' + pt(x, y) + '$인 점을 고르세요.', figure: { type: 'plane', range: 5, points: cand.map(function (c, i) { return { x: c[0], y: c[1], label: lab[i] }; }).sort(function (a, b) { return a.label < b.label ? -1 : 1; }) },
        ans: lab[0], options: names, check: true,
        wrong: [[lab[1], 'swapped', '$x$좌표와 $y$좌표를 바꿔서 찾았어요. 앞의 수 ' + '$' + x + '$' + pj(x, '이/가') + ' 가로 위치, 뒤의 수 $' + y + '$' + pj(y, '이/가') + ' 세로 위치예요.'],
          [lab[2], 'x-sign', '좌우가 반대예요. $x$좌표가 $' + x + '$이니 원점에서 ' + side(x) + '으로 ' + abs(x) + '칸 가야 해요. 양수는 오른쪽, 음수는 왼쪽이에요.'],
          [lab[3], 'y-sign', '위아래가 반대예요. $y$좌표가 $' + y + '$이니 ' + updown(y) + '로 ' + abs(y) + '칸 가야 해요. 양수는 위, 음수는 아래예요.']],
        hints: [SEAT,
          '원점 O에서 출발해서 두 번에 나누어 움직여요. ① 먼저 앞의 수($x$좌표)만큼 좌우로 가요. $x$좌표가 $' + x + '$이니 ' + side(x) + '으로 ' + abs(x) + '칸이에요. 양수는 오른쪽, 음수는 왼쪽이에요.',
          '② 그 자리에서 뒤의 수($y$좌표)만큼 위아래로 가요. $y$좌표가 $' + y + '$이니 ' + updown(y) + '로 ' + abs(y) + '칸이에요. 양수는 위, 음수는 아래예요. ③ 도착한 곳에 있는 점의 이름을 골라요. 좌우를 먼저, 위아래를 나중에 움직이는 순서를 지켜요.'],
        steps: [{ say: '원점에서 ' + side(x) + '으로 ' + abs(x) + '칸 가요($x$좌표가 $' + x + '$).' }, { say: '그 자리에서 ' + updown(y) + '로 ' + abs(y) + '칸 가요($y$좌표가 $' + y + '$).' }, { say: '도착한 곳에 있는 점이 답이에요.', tex: lab[0] }] };
    },
    sym: function (q) {
      var x = q.x, y = q.y, S = { x: [x, -y], y: [-x, y], o: [-x, -y] }, a = S[q.ax], ans = pt(a[0], a[1]);
      var NAME = { x: '$x$축', y: '$y$축', o: '원점' }, WHY = { x: '$x$축을 거울로 삼으면 좌우 위치는 그대로이고 위아래만 뒤집혀요. 그래서 $y$좌표의 부호만 바뀌어요.', y: '$y$축을 거울로 삼으면 위아래 위치는 그대로이고 좌우만 뒤집혀요. 그래서 $x$좌표의 부호만 바뀌어요.', o: '원점에 대하여 대칭이면 원점을 가운데 두고 정반대쪽으로 가요. 좌우도 위아래도 뒤집혀서 두 좌표의 부호가 모두 바뀌어요.' };
      var other = ['x', 'y', 'o'].filter(function (k) { return k !== q.ax; });
      if (abs(x) === abs(y)) return null;
      return { text: '점 P$' + pt(x, y) + '$' + pj(y, '과/와') + ' ' + NAME[q.ax] + '에 대하여 대칭인 점의 좌표를 고르세요.', figure: { type: 'plane', range: 5, points: [{ x: x, y: y, label: 'P' }] }, ans: ans,
        check: q.ax === 'x' ? coordOk(ans, x, -y) : q.ax === 'y' ? coordOk(ans, -x, y) : coordOk(ans, -x, -y),
        wrong: other.map(function (k) { return [pt(S[k][0], S[k][1]), 'sym-' + k, NAME[k] + '에 대하여 대칭인 점을 구했어요. 문제는 ' + NAME[q.ax] + '에 대하여 대칭인 점을 물었어요. ' + WHY[q.ax]]; })
          .concat([[pt(y, x), 'swapped', '두 좌표의 자리를 바꿨어요. 대칭인 점은 수의 크기와 자리는 그대로이고 부호만 바뀌어요. ' + WHY[q.ax]]]),
        hints: ['대칭은 거울에 비친 모습이에요. 거울 앞에 서면 거울까지의 거리와 똑같은 거리만큼 거울 뒤에 내 모습이 보이죠. 대칭인 점도 기준에서 같은 거리만큼 반대쪽에 있어요. 그래서 좌표의 수(크기)는 그대로이고 부호만 달라져요.',
          WHY[q.ax] + ' 그림에서 점 P를 ' + (q.ax === 'o' ? '원점을 지나 똑같은 거리만큼 반대쪽으로' : NAME[q.ax] + '을 접는 선으로 해서 반대쪽으로') + ' 옮겨 보세요.',
          '점 P의 좌표는 $' + pt(x, y) + '$이에요. ① 바뀌는 좌표가 무엇인지 정해요($x$축 대칭은 $y$좌표, $y$축 대칭은 $x$좌표, 원점 대칭은 둘 다). ② 그 좌표의 부호만 반대로 바꿔요. 양수는 음수로, 음수는 양수로요. ③ 두 좌표의 순서는 바꾸지 않아요.'.replace('$이에요', '$' + pj(y, '이에요/예요'))],
        steps: [{ say: WHY[q.ax] }, { say: '점 P의 좌표에서 ' + (q.ax === 'x' ? '$y$좌표' : q.ax === 'y' ? '$x$좌표' : '두 좌표') + '의 부호를 바꿔요.', tex: pt(x, y) + ' \\to ' + ans }] };
    }
  };
  choiceQ({
    id: 'B09.point', title: '점의 좌표', build: function (q) { return POINT[q.k](q); },
    ids: ['swapped', 'x-sign', 'y-sign', 'both-sign', 'axis-swap', 'axis-sign', 'on-both', 'sym-x', 'sym-y', 'sym-o'],
    levels: [
      { name: '점의 좌표 읽기', minDistinct: 90, vars: { q: sampler(function (r) { return { k: 'read', x: nz(r, -5, 5), y: nz(r, -5, 5), o: order4(r) }; }) } },
      { name: '축 위의 점 · 좌표로 점 찾기', minDistinct: 150, vars: { q: sampler(function (r) {
          if (r.int(0, 2) === 0) return { k: 'axis', on: r.pick(['x', 'y']), t: nz(r, -5, 5), o: order4(r) };
          return { k: 'find', x: nz(r, -5, 5), y: nz(r, -5, 5), lab: order4(r) };
        }) } },
      { name: '대칭인 점', minDistinct: 150, vars: { q: sampler(function (r) { return { k: 'sym', x: nz(r, -5, 5), y: nz(r, -5, 5), ax: r.pick(['x', 'y', 'o']), o: order4(r) }; }) } }
    ]
  });

  /* ── B09.quadrant 사분면 (보기는 늘 네 사분면) ─────────
     num  수로 된 점 · sign  문자의 부호가 주어진 점 · given  점 (a, b) 가 놓인 사분면이 주어진 점 */
  var PAIRS = [['a', 'b'], ['p', 'q'], ['s', 't']];
  /** 좌표의 꼴(a, -a, b, -b, ab, -ab, a-b, b-a)의 식과 부호. 부호를 알 수 없으면 0 */
  var TERM = {
    a: function (L, sa) { return [L[0], sa]; }, '-a': function (L, sa) { return ['-' + L[0], -sa]; },
    b: function (L, sa, sb) { return [L[1], sb]; }, '-b': function (L, sa, sb) { return ['-' + L[1], -sb]; },
    ab: function (L, sa, sb) { return [L[0] + L[1], sa * sb]; }, '-ab': function (L, sa, sb) { return ['-' + L[0] + L[1], -sa * sb]; },
    'a-b': function (L, sa, sb) { return [L[0] + ' - ' + L[1], sa === sb ? 0 : sa]; }, 'b-a': function (L, sa, sb) { return [L[1] + ' - ' + L[0], sa === sb ? 0 : sb]; }
  };
  var FORMS1 = [['a', 'b'], ['-a', 'b'], ['a', '-b'], ['-a', '-b'], ['b', 'a'], ['-b', 'a'], ['b', '-a'], ['-b', '-a']];
  var FORMS2 = [['ab', 'a'], ['a', 'ab'], ['ab', 'b'], ['b', 'ab'], ['-ab', 'a'], ['b', '-ab'], ['a-b', 'ab'], ['ab', 'b-a'], ['a-b', 'b'], ['b-a', '-b'], ['-b', 'a'], ['b', '-a'], ['-a', '-b'], ['a-b', 'b-a']];
  var RULE_OF = function (key, L) {
    if (key === 'a' || key === 'b') return '';
    if (key === '-a' || key === '-b') return '앞에 −가 붙으면 부호가 반대가 돼요. 양수에 −를 붙이면 음수, 음수에 −를 붙이면 양수예요.';
    if (key === 'ab' || key === '-ab') return '$' + L[0] + L[1] + '$는 두 수의 곱이에요. 두 수의 부호가 같으면 곱은 양수, 다르면 음수예요.' + (key === '-ab' ? ' 그 앞에 −가 붙었으니 부호를 한 번 더 뒤집어요.' : '');
    return '뺄셈은 가진 돈과 빚으로 생각해요. (양수) − (음수)는 양수에서 빚을 덜어 내니 더 커져서 양수이고, (음수) − (양수)는 빚에서 또 빼니 음수예요.';
  };
  var signWord = function (s) { return s > 0 ? '양수' : '음수'; };
  var quadWrong = function (sx, sy) {
    return [[QN[quad(-sx, sy)], 'x-sign', '$x$좌표의 부호를 반대로 봤어요. $x$좌표가 양수이면 $y$축의 오른쪽, 음수이면 왼쪽이에요. 이 점의 $x$좌표는 ' + signWord(sx) + '예요.'],
      [QN[quad(sx, -sy)], 'y-sign', '$y$좌표의 부호를 반대로 봤어요. $y$좌표가 양수이면 $x$축의 위, 음수이면 아래예요. 이 점의 $y$좌표는 ' + signWord(sy) + '예요.'],
      [QN[quad(-sx, -sy)], 'both-sign', (sx !== sy ? '$x$좌표와 $y$좌표의 순서를 바꿔 봤거나, 두 좌표의 부호를 모두 반대로 봤어요. 앞의 것이 $x$좌표(좌우), 뒤의 것이 $y$좌표(위아래)예요.' : '두 좌표의 부호를 모두 반대로 봤어요. 이 점의 $x$좌표와 $y$좌표는 둘 다 ' + signWord(sx) + '예요. 둘 다 양수이면 오른쪽 위, 둘 다 음수이면 왼쪽 아래예요.')]];
  };
  var Q_INTRO = '좌표평면은 $x$축과 $y$축 때문에 네 구역으로 나뉘어요. 이 구역이 사분면이에요. 오른쪽 위가 제1사분면이고, 시계 반대 방향으로 돌면서 제2, 제3, 제4사분면이에요. 어느 사분면인지는 좌표의 부호만 보면 알 수 있어요. 수의 크기는 상관없어요.';
  var Q_TABLE = '두 좌표의 부호를 ($x$좌표, $y$좌표) 순서로 적어 보세요. (+, +)는 제1사분면, (−, +)는 제2사분면, (−, −)는 제3사분면, (+, −)는 제4사분면이에요. $x$좌표로 왼쪽 · 오른쪽을 먼저 정하고, $y$좌표로 위 · 아래를 정하면 돼요.';
  var QUAD = {
    num: function (q) {
      var x = q.x, y = q.y, sx = x > 0 ? 1 : -1, sy = y > 0 ? 1 : -1, ans = QN[quad(sx, sy)];
      return { tex: pt(x, y), text: '이 점은 어느 사분면 위에 있을까요?', ans: ans, options: QN, wrong: quadWrong(sx, sy),
        check: ans === (x > 0 && y > 0 ? '제1사분면' : x < 0 && y > 0 ? '제2사분면' : x < 0 && y < 0 ? '제3사분면' : '제4사분면'),
        hints: [Q_INTRO,
          '① 앞의 수가 $x$좌표예요. $x$좌표 $' + x + '$' + pj(x, '은/는') + ' ' + signWord(sx) + '예요. $x$좌표가 양수이면 $y$축의 오른쪽, 음수이면 왼쪽에 있어요. ② 뒤의 수가 $y$좌표예요. $y$좌표 $' + y + '$' + pj(y, '은/는') + ' ' + signWord(sy) + '예요. $y$좌표가 양수이면 $x$축의 위, 음수이면 아래에 있어요.',
          Q_TABLE],
        steps: [{ say: '$x$좌표의 부호를 봐요. ' + signWord(sx) + '이니 $y$축의 ' + side(sx) + '이에요.', tex: x + (sx > 0 ? ' > 0' : ' < 0') },
          { say: '$y$좌표의 부호를 봐요. ' + signWord(sy) + '이니 $x$축의 ' + updown(sy) + '예요.', tex: y + (sy > 0 ? ' > 0' : ' < 0') },
          { say: '부호가 (' + SG(sx) + ', ' + SG(sy) + ')인 점은 ' + ans + ' 위에 있어요.' }] };
    },
    letters: function (q, given) {
      var L = PAIRS[q.i], sa = q.sa, sb = q.sb, form = (given ? FORMS2 : FORMS1)[q.f], tx = TERM[form[0]](L, sa, sb), ty = TERM[form[1]](L, sa, sb), env = {}, ans, cx, cy;
      if (!tx[1] || !ty[1]) return null;
      ans = QN[quad(tx[1], ty[1])];
      /* 검산: 부호에 맞는 수를 실제로 넣어 좌표를 계산해 본다 */
      env[L[0]] = F(2 * sa); env[L[1]] = F(3 * sb); cx = A.ev(tx[0], env).compare(F(0)); cy = A.ev(ty[0], env).compare(F(0));
      var cond = given ? '점 $' + pt(L[0], L[1]) + '$가 ' + QN[quad(sa, sb)] + ' 위의 점일 때' : '$' + L[0] + (sa > 0 ? ' > 0' : ' < 0') + '$, $' + L[1] + (sb > 0 ? ' > 0' : ' < 0') + '$일 때';
      var rules = [RULE_OF(form[0], L), RULE_OF(form[1], L)].filter(function (t, i, list) { return t && list.indexOf(t) === i; });
      return { tex: pt(tx[0], ty[0]), text: cond + ', 이 점은 어느 사분면 위에 있을까요?', ans: ans, options: QN, wrong: quadWrong(tx[1], ty[1]),
        check: cx === tx[1] && cy === ty[1] && ans === QN[quad(cx, cy)],
        hints: [Q_INTRO,
          (given ? '먼저 주어진 조건을 부호로 바꿔요. 점 $' + pt(L[0], L[1]) + '$가 ' + QN[quad(sa, sb)] + ' 위에 있으니 $' + L[0] + '$는 ' + signWord(sa) + ', $' + L[1] + '$는 ' + signWord(sb) + '예요. ' : '$' + L[0] + '$는 ' + signWord(sa) + ', $' + L[1] + '$는 ' + signWord(sb) + '예요. ')
            + '이제 물어본 점의 $x$좌표 $' + tx[0] + '$와 $y$좌표 $' + ty[0] + '$의 부호를 하나씩 알아내요. ' + (rules.length ? rules.join(' ') : '문자의 자리가 바뀌었는지 잘 봐요. 앞에 쓴 것이 $x$좌표, 뒤에 쓴 것이 $y$좌표예요.') + ' 헷갈리면 조건에 맞는 쉬운 수를 직접 넣어 보세요.',
          Q_TABLE],
        steps: [{ say: '$x$좌표 $' + tx[0] + '$의 부호를 알아봐요. ' + (RULE_OF(form[0], L) || '조건에서 바로 알 수 있어요.'), tex: tx[0] + (tx[1] > 0 ? ' > 0' : ' < 0') },
          { say: '$y$좌표 $' + ty[0] + '$의 부호를 알아봐요. ' + (RULE_OF(form[1], L) || '조건에서 바로 알 수 있어요.'), tex: ty[0] + (ty[1] > 0 ? ' > 0' : ' < 0') },
          { say: '부호가 (' + SG(tx[1]) + ', ' + SG(ty[1]) + ')인 점은 ' + ans + ' 위에 있어요.' }] };
    }
  };
  choiceQ({
    id: 'B09.quadrant', title: '사분면', ids: ['x-sign', 'y-sign', 'both-sign'],
    build: function (q) { return q.k === 'num' ? QUAD.num(q) : QUAD.letters(q, q.k === 'given'); },
    levels: [
      { name: '수로 된 점', minDistinct: 200, vars: { q: sampler(function (r) { return { k: 'num', x: nz(r, -9, 9), y: nz(r, -9, 9) }; }) } },
      { name: '문자의 부호로 판단하기', minDistinct: 60, vars: { q: sampler(function (r) { return { k: 'sign', i: r.int(0, 2), sa: pm(r, 1), sb: pm(r, 1), f: r.int(0, FORMS1.length - 1) }; }) } },
      { name: '점이 놓인 사분면에서 알아내기', minDistinct: 80, vars: { q: sampler(function (r) { return { k: 'given', i: r.int(0, 2), sa: pm(r, 1), sb: pm(r, 1), f: r.int(0, FORMS2.length - 1) }; }) } }
    ]
  });

  /* ── B09.direct 정비례 y = ax ──────────────────────────
     val  식의 값(ask: y · x) · coef  지나는 점으로 a 구하기 · graph  그래프에서 a 구하기 · other  지나는 다른 점 */
  var SLOPES = [[1, 2], [3, 2], [1, 3], [2, 3], [1, 4], [3, 4], [5, 2], [4, 3]];
  var D_INTRO = '정비례는 한쪽이 2배, 3배가 되면 다른 쪽도 똑같이 2배, 3배가 되는 관계예요. 같은 물건을 2개 사면 값이 2배, 3개 사면 3배가 되는 것과 같아요. 식으로는 $y = ax$로 쓰고, $x$에 늘 같은 수 $a$를 곱하면 $y$가 나와요.';
  var DIRECT = {
    val: function (q) {
      var a = rat(q.an, q.ad), eq = 'y = ' + ax(a), x, y, askY = q.ask === 'y';
      if (a.d === 1 && abs(a.n) === 1) return null;
      if (askY) { x = q.t; y = rat(a.n * x, a.d); } else { y = rat(q.t, 1); x = rat(q.t * a.d, a.n); if (x.d !== 1) return null; x = x.n; }
      if (y.d !== 1 || !x || (askY && abs(x) === 1)) return null;
      y = y.n;
      var coefSay = a.d === 1 ? '$' + a.n + '$' : '$' + ratTex(a) + '$';
      return askY ? { tex: eq, text: '$x = ' + x + '$일 때, $y$의 값을 구하세요.', ans: rat(y, 1), check: same(at(eq, rat(x, 1)), rat(y, 1)),
          wrong: { added: rat(a.n + x * a.d, a.d), divided: rat(x * a.d, a.n) },
          hints: [D_INTRO,
            '식 $' + eq + '$에서 $x$가 있던 자리에 $' + x + '$' + pj(x, '을/를') + ' 넣어요. $' + ax(a) + '$는 ' + coefSay + pj(a.n, '과/와') + ' $x$를 곱한 것이에요(곱셈 기호가 생략되어 있어요). 그래서 덧셈이 아니라 곱셈을 해요. 음수를 넣을 때는 괄호로 묶어요.',
            '① 식으로 쓰면 $y = ' + ratTex(a) + ' \\times ' + par(x) + '$' + pj(x, '이에요/예요') + '. ② 부호를 먼저 정해요. 두 수의 부호가 같으면 양수, 다르면 음수예요. ③ 그다음 수끼리 곱해요.' + (a.d === 1 ? '' : ' 분수와 곱할 때는 분모와 약분되는지 먼저 봐요.')],
          steps: [{ say: '$x$가 있던 자리에 $' + x + '$' + pj(x, '을/를') + ' 넣어요. 음수는 괄호로 묶어요.', tex: 'y = ' + ratTex(a) + ' \\times ' + par(x) }, { say: '곱셈을 계산해요.', tex: 'y = ' + y }] }
        : { tex: eq, text: '$y = ' + y + '$일 때, $x$의 값을 구하세요.', ans: rat(x, 1), check: same(at(eq, rat(x, 1)), rat(y, 1)),
          wrong: { multiplied: rat(a.n * y, a.d), subtracted: rat(y * a.d - a.n, a.d) },
          hints: [D_INTRO,
            '이번에는 $y$의 값을 알고 $x$를 찾아요. 식 $' + eq + '$에서 $y$가 있던 자리에 $' + y + '$' + pj(y, '을/를') + ' 넣으면 $x$에 대한 방정식이 돼요. 저울의 한쪽에 ' + coefSay + pj(a.n, '을/를') + ' 곱한 $x$가, 다른 쪽에 $' + y + '$' + pj(y, '이/가') + ' 놓인 모습이에요.',
            '① 방정식은 $' + y + ' = ' + ax(a) + '$예요. ② $x$에 곱해진 수를 없애려면 양쪽을 그 수로 나눠요.' + (a.d === 1 ? '' : ' 분수로 나누는 것은 분자와 분모를 뒤집어서 곱하는 것과 같아요.') + ' ③ 부호를 먼저 정하고 계산해요. 구한 값을 식에 다시 넣어 맞는지 확인해요.'],
          steps: [{ say: '$y$가 있던 자리에 $' + y + '$' + pj(y, '을/를') + ' 넣어요.', tex: y + ' = ' + ax(a) }, { say: '양쪽을 $x$ 앞의 수로 나눠요.', tex: 'x = ' + par(y) + ' \\div ' + (a.d === 1 ? par(a.n) : (a.n < 0 ? '\\left(' + ratTex(a) + '\\right)' : ratTex(a))) }, { say: '계산해요.', tex: 'x = ' + x }] };
    },
    coef: function (q, fig) {
      var p = q.p, y = q.q, a = rat(y, p);
      return { tex: fig ? null : 'y = ax', text: fig ? '그림은 $y = ax$의 그래프예요. 그래프 위의 점 P를 보고 $a$의 값을 구하세요.' : '이 정비례 관계의 그래프가 점 $' + pt(p, y) + '$' + pj(y, '을/를') + ' 지날 때, $a$의 값을 구하세요.',
        figure: fig ? { type: 'plane', range: 5, line: [y, p], points: [{ x: p, y: y, label: 'P' }] } : null, ans: a, check: same(at('y = ' + ax(a), rat(p, 1)), rat(y, 1)),
        wrong: { flipped: rat(p, y), product: p * y, 'y-only': y },
        hints: [(fig ? '원점을 지나는 곧은 선은 정비례 $y = ax$의 그래프예요. ' : '') + '그래프가 어떤 점을 지난다는 것은, 그 점의 좌표를 식에 넣으면 식이 참이 된다는 뜻이에요. 열쇠가 자물쇠에 딱 맞는 것과 같아요. 좌표의 앞의 수는 $x$ 자리에, 뒤의 수는 $y$ 자리에 넣어요.',
          (fig ? '먼저 점 P의 좌표를 읽어요. 원점에서 ' + side(p) + '으로 ' + abs(p) + '칸, ' + updown(y) + '로 ' + abs(y) + '칸 간 곳이에요. ' : '점의 좌표는 $' + pt(p, y) + '$' + pj(y, '이에요/예요') + '. ') + '$x$좌표는 $' + p + '$, $y$좌표는 $' + y + '$' + pj(y, '이에요/예요') + '. 이 두 수를 $y = ax$에 넣으면 $' + y + ' = a \\times ' + par(p) + '$' + pj(p, '이/가') + ' 돼요. 어느 수가 $x$이고 어느 수가 $y$인지 바꾸지 않도록 조심해요.',
          '이제 $a$에 대한 방정식을 풀어요. $a$에 $' + p + '$' + pj(p, '이/가') + ' 곱해져 있으니 양쪽을 $' + p + '$' + pj(p, '으로/로') + ' 나눠요. 곧 $a$는 ($y$좌표) ÷ ($x$좌표)예요. 나누어떨어지지 않으면 분수로 쓰고 약분해요. 부호도 잊지 마세요. 두 좌표의 부호가 같으면 양수, 다르면 음수예요.'],
        steps: (fig ? [{ say: '점 P의 좌표를 읽어요.', tex: 'P' + pt(p, y) }] : []).concat([{ say: '$x$ 자리에 $' + p + '$, $y$ 자리에 $' + y + '$' + pj(y, '을/를') + ' 넣어요.', tex: y + ' = a \\times ' + par(p) },
          { say: '양쪽을 $' + p + '$' + pj(p, '으로/로') + ' 나눠요.', tex: 'a = \\dfrac{' + y + '}{' + p + '} = ' + ratTex(a) }]) };
    },
    other: function (q) {
      var p = q.p, y = q.q, r = q.r, a = rat(y, p), k = rat(y * r, p);
      if (r === p) return null;
      return { tex: 'y = ax', text: '이 정비례 관계의 그래프가 두 점 $' + pt(p, y) + '$, $' + pt(r, 'k') + '$를 지날 때, $k$의 값을 구하세요.', ans: k, check: same(at('y = ' + ax(a), rat(p, 1)), rat(y, 1)) && same(at('y = ' + ax(a), rat(r, 1)), k),
        wrong: { 'as-inverse': rat(p * y, r), 'a-only': a, shifted: y + (r - p) },
        hints: ['모르는 것이 $a$와 $k$ 두 개예요. 한꺼번에 구할 수 없으니 차례로 구해요. 두 좌표를 다 아는 점으로 먼저 $a$를 구하고, 그다음에 완성된 식으로 $k$를 구해요. 열쇠를 먼저 찾고 나서 문을 여는 것과 같아요.',
          '① 점 $' + pt(p, y) + '$' + pj(y, '을/를') + ' $y = ax$에 넣어요: $' + y + ' = a \\times ' + par(p) + '$. 양쪽을 $' + p + '$' + pj(p, '으로/로') + ' 나누면 $a$가 나와요. $a$는 ($y$좌표) ÷ ($x$좌표)예요.',
          '② 구한 $a$를 넣어 식을 완성해요. ③ 이 식의 $x$ 자리에 둘째 점의 $x$좌표 $' + r + '$' + pj(r, '을/를') + ' 넣어 계산한 값이 $k$예요. 정비례에서는 $x$가 몇 배가 되면 $y$도 똑같이 몇 배가 된다는 것으로 검산할 수 있어요.'],
        steps: [{ say: '점 $' + pt(p, y) + '$' + pj(y, '을/를') + ' 넣어 $a$를 구해요.', tex: 'a = \\dfrac{' + y + '}{' + p + '} = ' + ratTex(a) }, { say: '식을 완성해요.', tex: 'y = ' + ax(a) },
          { say: '$x$ 자리에 $' + r + '$' + pj(r, '을/를') + ' 넣어요.', tex: 'k = ' + ratTex(a) + ' \\times ' + par(r) + ' = ' + ratTex(k) }] };
    }
  };
  var slope = function (r) { var s = r.pick(SLOPES); return r.int(0, 1) ? [pm(r, r.int(1, 6)), 1] : [pm(r, s[0]), s[1]]; };
  valueQ({
    id: 'B09.direct', title: '정비례', kind: 'rational',
    build: function (q) { return q.k === 'val' ? DIRECT.val(q) : q.k === 'other' ? DIRECT.other(q) : DIRECT.coef(q, q.k === 'graph'); },
    levels: [
      { name: '식의 값 구하기', vars: { q: sampler(function (r) {
          var s = slope(r), ask = r.int(0, 2) ? 'y' : 'x';
          return { k: 'val', an: s[0], ad: s[1], ask: ask, t: ask === 'y' ? s[1] * nz(r, -6, 6) : s[0] * nz(r, -6, 6) };
        }) } },
      { name: '지나는 점으로 a 구하기', vars: { q: sampler(function (r) { return { k: 'coef', p: nz(r, -9, 9), q: nz(r, -12, 12) }; }) } },
      { name: '그래프와 다른 점', vars: { q: sampler(function (r) {
          var p = nz(r, -6, 6);
          if (r.int(0, 1)) return { k: 'graph', p: nz(r, -4, 4), q: nz(r, -4, 4) };
          return { k: 'other', p: p, q: nz(r, -12, 12), r: p * nz(r, -4, 4) / (r.int(0, 2) ? 1 : gcd(p, 2)) };
        }) } }
    ],
    mistakes: [
      ['added', function () { return '곱해야 하는데 더했어요. $ax$는 $a$와 $x$를 곱한 것이에요. 수와 문자 사이에 곱셈 기호가 생략되어 있어요.'; }],
      ['divided', function () { return '곱해야 하는데 나눴어요. $y = ax$에서 $y$는 $x$에 $a$를 곱한 값이에요. $x$의 값을 넣고 곱해요.'; }],
      ['multiplied', function () { return '나눠야 하는데 곱했어요. $y$의 값을 알 때는 $x$에 곱해진 수로 양쪽을 나눠야 $x$가 나와요.'; }],
      ['subtracted', function () { return '빼서 풀었어요. $ax$는 덧셈이 아니라 곱셈이에요. 곱해진 수는 뺄셈이 아니라 나눗셈으로 없애요.'; }],
      ['flipped', function () { return '분자와 분모가 바뀌었어요. $a$는 ($y$좌표) ÷ ($x$좌표)예요. 좌표의 뒤의 수가 분자(위), 앞의 수가 분모(아래)로 가요.'; }],
      ['product', function () { return '두 좌표를 곱했어요. 그것은 반비례 $y = \\dfrac{a}{x}$에서 $a$를 구하는 방법이에요. 정비례 $y = ax$에서는 $y$좌표를 $x$좌표로 나눠요.'; }],
      ['y-only', function () { return '$y$좌표를 그대로 답했어요. $y = ax$에 좌표를 넣으면 $a$에 $x$좌표가 곱해져 있어요. 양쪽을 $x$좌표로 나눠야 $a$가 나와요.'; }],
      ['as-inverse', function () { return '반비례처럼 계산했어요. 정비례에서는 $x$가 몇 배가 되면 $y$도 똑같이 몇 배가 돼요. 먼저 $a$를 구한 다음 $x$좌표에 곱해요.'; }],
      ['a-only', function () { return '$a$의 값까지만 구했어요. 문제가 묻는 것은 $k$예요. 완성한 식의 $x$ 자리에 둘째 점의 $x$좌표를 넣어야 해요.'; }],
      ['shifted', function () { return '$x$좌표가 달라진 만큼 $y$좌표에 더했어요. 정비례는 더하는 관계가 아니라 곱하는 관계예요. $x$가 몇 배가 되면 $y$도 몇 배가 돼요.'; }]
    ]
  });

  /* ── B09.inverse 반비례 y = a/x ────────────────────────
     val  식의 값(ask: y · x) · coef  지나는 점으로 a 구하기 · graph  그래프에서 a 구하기 · other  지나는 다른 점 */
  var I_INTRO = '반비례는 한쪽이 2배, 3배가 되면 다른 쪽은 반대로 절반, 삼분의 일로 줄어드는 관계예요. 피자 한 판을 나누어 먹을 때 사람이 2배로 늘면 한 사람 몫이 절반이 되는 것과 같아요. 식으로는 $y = \\dfrac{a}{x}$로 쓰고, $x$와 $y$를 곱하면 늘 같은 수 $a$가 돼요.';
  var INVERSE = {
    val: function (q) {
      var a = q.a, eq = 'y = ' + overx(a), t = q.t, u = a / t, askY = q.ask === 'y', x = askY ? t : u, y = askY ? u : t, known = askY ? 'x' : 'y', want = askY ? 'y' : 'x';
      if (!Number.isInteger(u) || abs(t) === 1 || abs(u) === 1) return null;
      return { tex: eq, text: '$' + known + ' = ' + t + '$일 때, $' + want + '$의 값을 구하세요.', ans: rat(u, 1), check: same(at(eq, rat(x, 1)), rat(y, 1)),
        wrong: { multiplied: a * t, subtracted: a - t },
        hints: [I_INTRO,
          askY ? '식 $' + eq + '$에서 $x$가 있던 자리에 $' + t + '$' + pj(t, '을/를') + ' 넣어요. 분수의 가로선은 나눗셈을 뜻해요. 그래서 분자를 분모로 나누면 돼요. $x$는 분모 자리에 있으니 곱하는 것이 아니라 나누는 것이에요.'
            : '반비례에서는 $x$와 $y$를 곱하면 늘 같은 수가 돼요. 식 $' + eq + '$의 양쪽에 $x$를 곱하면 $xy = ' + a + '$' + pj(a, '이에요/예요') + '. 여기에 $y = ' + t + '$' + pj(t, '을/를') + ' 넣으면 $x$에 $' + t + '$' + pj(t, '을/를') + ' 곱한 값이 $' + a + '$' + pj(a, '이라는/라는') + ' 뜻이에요.',
          '① ' + (askY ? '식으로 쓰면 $y = \\dfrac{' + a + '}{' + t + '}$' + pj(a, '이에요/예요') + '.' : '방정식은 $' + par(t) + ' \\times x = ' + a + '$' + pj(a, '이에요/예요') + '. 양쪽을 $' + t + '$' + pj(t, '으로/로') + ' 나눠요.') + ' ② 부호를 먼저 정해요. 나누는 두 수의 부호가 같으면 양수, 다르면 음수예요. ③ 그다음 수끼리 나눠요. 구한 값과 주어진 값을 곱해서 분자의 수가 나오는지 확인해요.'],
        steps: askY ? [{ say: '$x$가 있던 자리에 $' + t + '$' + pj(t, '을/를') + ' 넣어요.', tex: 'y = \\dfrac{' + a + '}{' + t + '}' }, { say: '분자를 분모로 나눠요. 부호를 먼저 정해요.', tex: 'y = ' + u }]
          : [{ say: '$x$와 $y$를 곱하면 늘 같은 수예요.', tex: 'xy = ' + a }, { say: '$y$ 자리에 $' + t + '$' + pj(t, '을/를') + ' 넣고, 양쪽을 그 수로 나눠요.', tex: 'x = \\dfrac{' + a + '}{' + t + '}' }, { say: '계산해요. 부호를 먼저 정해요.', tex: 'x = ' + u }] };
    },
    coef: function (q, fig) {
      var p = q.p, y = q.q, a = p * y;
      return { tex: fig ? null : 'y = \\dfrac{a}{x}', text: fig ? '그림은 $y = \\dfrac{a}{x}$의 그래프예요. 그래프 위의 점 P를 보고 $a$의 값을 구하세요.' : '이 반비례 관계의 그래프가 점 $' + pt(p, y) + '$' + pj(y, '을/를') + ' 지날 때, $a$의 값을 구하세요.',
        figure: fig ? { type: 'plane', range: 6, curve: a, points: [{ x: p, y: y, label: 'P' }] } : null, ans: rat(a, 1), check: same(at('y = ' + overx(a), rat(p, 1)), rat(y, 1)),
        wrong: { quotient: rat(y, p), sum: p + y, 'abs': abs(a) === a ? null : abs(a) },
        hints: [(fig ? '원점을 지나지 않고 휘어진 한 쌍의 곡선은 반비례 $y = \\dfrac{a}{x}$의 그래프예요. ' : '') + '그래프가 어떤 점을 지난다는 것은, 그 점의 좌표를 식에 넣으면 식이 참이 된다는 뜻이에요. 열쇠가 자물쇠에 딱 맞는 것과 같아요. 좌표의 앞의 수는 $x$ 자리에, 뒤의 수는 $y$ 자리에 넣어요.',
          (fig ? '먼저 점 P의 좌표를 읽어요. 원점에서 ' + side(p) + '으로 ' + abs(p) + '칸, ' + updown(y) + '로 ' + abs(y) + '칸 간 곳이에요. ' : '') + '$x$좌표는 $' + p + '$, $y$좌표는 $' + y + '$' + pj(y, '이에요/예요') + '. 이 두 수를 식에 넣으면 $' + y + ' = \\dfrac{a}{' + p + '}$' + pj(p, '이/가') + ' 돼요. $a$를 $' + p + '$' + pj(p, '으로/로') + ' 나눈 값이 $' + y + '$' + pj(y, '이라는/라는') + ' 뜻이에요.',
          '나눠진 수를 없애려면 양쪽에 그 수를 곱해요. 양쪽에 $' + p + '$' + pj(p, '을/를') + ' 곱하면 $a$만 남아요. 곧 $a$는 ($x$좌표) × ($y$좌표)예요. 반비례에서는 그래프 위의 어느 점을 골라도 두 좌표의 곱이 늘 $a$로 같아요. 곱할 때 부호도 잊지 마세요. 두 좌표의 부호가 같으면 양수, 다르면 음수예요.'],
        steps: (fig ? [{ say: '점 P의 좌표를 읽어요.', tex: 'P' + pt(p, y) }] : []).concat([{ say: '$x$ 자리에 $' + p + '$, $y$ 자리에 $' + y + '$' + pj(y, '을/를') + ' 넣어요.', tex: y + ' = \\dfrac{a}{' + p + '}' },
          { say: '양쪽에 $' + p + '$' + pj(p, '을/를') + ' 곱해요.', tex: 'a = ' + par(y) + ' \\times ' + par(p) + ' = ' + a }]) };
    },
    other: function (q) {
      var p = q.p, y = q.q, r = q.r, a = p * y, k = a / r;
      if (r === p || !Number.isInteger(k)) return null;
      return { tex: 'y = \\dfrac{a}{x}', text: '이 반비례 관계의 그래프가 두 점 $' + pt(p, y) + '$, $' + pt(r, 'k') + '$를 지날 때, $k$의 값을 구하세요.', ans: rat(k, 1), check: same(at('y = ' + overx(a), rat(p, 1)), rat(y, 1)) && same(at('y = ' + overx(a), rat(r, 1)), rat(k, 1)),
        wrong: { 'as-direct': rat(y * r, p), 'a-only': a },
        hints: ['모르는 것이 $a$와 $k$ 두 개예요. 한꺼번에 구할 수 없으니 차례로 구해요. 두 좌표를 다 아는 점으로 먼저 $a$를 구하고, 그다음에 완성된 식으로 $k$를 구해요. 열쇠를 먼저 찾고 나서 문을 여는 것과 같아요.',
          '① 반비례에서는 그래프 위의 어느 점이든 ($x$좌표) × ($y$좌표)가 $a$로 같아요. 점 $' + pt(p, y) + '$의 두 좌표를 곱하면 $a$가 나와요. 부호를 먼저 정하고 곱해요.',
          '② 구한 $a$를 넣어 식을 완성해요. ③ 둘째 점도 같은 그래프 위에 있으니 $' + par(r) + ' \\times k$도 $a$와 같아요. 그래서 $a$를 둘째 점의 $x$좌표 $' + r + '$' + pj(r, '으로/로') + ' 나눈 값이 $k$예요. 나눌 때도 부호를 먼저 정해요.'],
        steps: [{ say: '점 $' + pt(p, y) + '$의 두 좌표를 곱해 $a$를 구해요.', tex: 'a = ' + par(p) + ' \\times ' + par(y) + ' = ' + a }, { say: '식을 완성해요.', tex: 'y = ' + overx(a) },
          { say: '$x$ 자리에 $' + r + '$' + pj(r, '을/를') + ' 넣어요.', tex: 'k = \\dfrac{' + a + '}{' + r + '} = ' + k }] };
    }
  };
  var AS = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 48, 60];
  var divisorOf = function (r, a) { var ds = []; for (var d = 2; d < abs(a); d++) if (a % d === 0) ds.push(d); return pm(r, r.pick(ds)); };
  valueQ({
    id: 'B09.inverse', title: '반비례', kind: 'signed',
    build: function (q) { return q.k === 'val' ? INVERSE.val(q) : q.k === 'other' ? INVERSE.other(q) : INVERSE.coef(q, q.k === 'graph'); },
    levels: [
      { name: '식의 값 구하기', vars: { q: sampler(function (r) { var a = pm(r, r.pick(AS)); return { k: 'val', a: a, ask: r.int(0, 2) ? 'y' : 'x', t: divisorOf(r, a) }; }) } },
      { name: '지나는 점으로 a 구하기', minDistinct: 200, vars: { q: sampler(function (r) { return { k: 'coef', p: nz(r, -9, 9), q: nz(r, -9, 9) }; }) } },
      { name: '그래프와 다른 점', vars: { q: sampler(function (r) {
          var a = pm(r, r.pick(AS)), p = divisorOf(r, a), g;
          if (r.int(0, 2) === 0) { g = pm(r, r.pick([4, 6, 8, 10, 12])); p = divisorOf(r, g); return { k: 'graph', p: p, q: g / p }; }
          return { k: 'other', p: p, q: a / p, r: divisorOf(r, a) };
        }) } }
    ],
    mistakes: [
      ['multiplied', function () { return '나눠야 하는데 곱했어요. 반비례 식에서 $x$는 분모 자리에 있어요. 분수의 가로선은 나눗셈이에요. 분자의 수를 주어진 값으로 나눠요.'; }],
      ['subtracted', function () { return '뺄셈을 했어요. 분수 꼴은 뺄셈이 아니라 나눗셈이에요. 분자의 수를 주어진 값으로 나눠요.'; }],
      ['quotient', function () { return '$y$좌표를 $x$좌표로 나눴어요. 그것은 정비례 $y = ax$에서 $a$를 구하는 방법이에요. 반비례에서는 두 좌표를 곱해요.'; }],
      ['sum', function () { return '두 좌표를 더했어요. 반비례에서는 $x$와 $y$를 곱한 값이 $a$예요. 식의 양쪽에 $x$를 곱하면 $xy = a$가 돼요.'; }],
      ['abs', function () { return '부호를 빠뜨렸어요. 두 좌표의 부호가 다르면 곱은 음수예요. 곱하기 전에 부호부터 정해요.'; }],
      ['as-direct', function () { return '정비례처럼 계산했어요. 반비례에서는 $x$가 몇 배가 되면 $y$는 반대로 그만큼 줄어요. 두 좌표의 곱이 늘 같다는 것을 써요.'; }],
      ['a-only', function () { return '$a$의 값까지만 구했어요. 문제가 묻는 것은 $k$예요. $a$를 둘째 점의 $x$좌표로 나눠야 해요.'; }]
    ]
  });

  /* ── B09.graph 그래프와 식 (보기 고르기) ───────────────
     story  상황을 식으로 · line  직선 그래프의 식 · curve  곡선 그래프의 식 */
  var STORY = [
    { dir: 1, lo: 2, hi: 15, mul: 100, text: function (p) { return '한 개에 ' + p + '원인 지우개 $x$개의 값을 $y$원이라고 해요.'; }, one: function (p) { return '지우개가 1개이면 ' + p + '원, 2개이면 그 2배, 3개이면 그 3배예요. 개수가 늘어나는 대로 값도 똑같이 늘어나요.'; } },
    { dir: 1, lo: 2, hi: 12, mul: 1, text: function (p) { return '1분에 ' + p + ' L씩 물이 나오는 수도에서 $x$분 동안 받은 물의 양을 $y$ L라고 해요.'; }, one: function (p) { return '1분 동안 받으면 ' + p + ' L, 2분이면 그 2배, 3분이면 그 3배예요. 시간이 늘어나는 대로 물의 양도 똑같이 늘어나요.'; } },
    { dir: 1, lo: 3, hi: 9, mul: 10, text: function (p) { return '시속 ' + p + ' km로 $x$시간 동안 달린 거리를 $y$ km라고 해요.'; }, one: function (p) { return '1시간 동안 달리면 ' + p + ' km, 2시간이면 그 2배, 3시간이면 그 3배예요. 시간이 늘어나는 대로 거리도 똑같이 늘어나요.'; } },
    { dir: 1, lo: 2, hi: 15, mul: 1, text: function (p) { return '1 m의 무게가 ' + p + ' g인 철사 $x$ m의 무게를 $y$ g이라고 해요.'; }, one: function (p) { return '철사가 1 m이면 ' + p + ' g, 2 m이면 그 2배, 3 m이면 그 3배예요. 길이가 늘어나는 대로 무게도 똑같이 늘어나요.'; } },
    { dir: -1, lo: 2, hi: 10, mul: 6, text: function (p) { return '넓이가 ' + p + ' cm²인 직사각형의 가로의 길이를 $x$ cm, 세로의 길이를 $y$ cm라고 해요.'; }, one: function (p) { return '넓이는 (가로) × (세로)로 늘 ' + josa(p, '이에요/예요') + '. 가로가 2배로 길어지면 세로는 절반으로 줄어야 넓이가 그대로예요.'.replace(p + '이에요', josa(p, '이에요/예요')); } },
    { dir: -1, lo: 2, hi: 8, mul: 30, text: function (p) { return p + ' km 떨어진 곳까지 시속 $x$ km로 갈 때 걸리는 시간을 $y$시간이라고 해요.'; }, one: function () { return '가야 할 거리는 정해져 있어요. 속력이 2배로 빨라지면 걸리는 시간은 절반으로 줄어요. (속력) × (시간)이 늘 같은 거리가 돼요.'; } },
    { dir: -1, lo: 2, hi: 10, mul: 12, text: function (p) { return '사탕 ' + p + '개를 $x$명이 똑같이 나누어 가질 때, 한 명이 갖는 사탕의 수를 $y$개라고 해요.'; }, one: function () { return '사탕의 전체 수는 정해져 있어요. 사람이 2배로 늘면 한 명의 몫은 절반으로 줄어요. (사람 수) × (한 명의 몫)이 늘 전체 수가 돼요.'; } },
    { dir: -1, lo: 2, hi: 10, mul: 20, text: function (p) { return p + ' L들이 물통에 1분에 $x$ L씩 물을 넣을 때, 가득 차는 데 걸리는 시간을 $y$분이라고 해요.'; }, one: function () { return '물통의 크기는 정해져 있어요. 1분에 넣는 물이 2배로 늘면 걸리는 시간은 절반으로 줄어요. (1분에 넣는 양) × (시간)이 늘 물통의 크기가 돼요.'; } }
  ];
  var KIND_HINT = '식의 모양을 정하는 방법이에요. $x$가 2배, 3배가 될 때 $y$도 2배, 3배가 되면 정비례이고 식은 $y = ax$ 꼴이에요. $x$가 2배, 3배가 될 때 $y$가 거꾸로 절반, 삼분의 일이 되면 반비례이고 식은 $y = \\dfrac{a}{x}$ 꼴이에요.';
  var GRAPH = {
    story: function (q) {
      var c = STORY[q.i], p = q.p * c.mul, dir = c.dir > 0, eD = 'y = ' + p + 'x', eI = 'y = ' + overx(p), eA = 'y = x + ' + p, eF = 'y = \\dfrac{x}{' + p + '}', ans = dir ? eD : eI;
      var fn = function (x) { return dir ? F(p * x) : F(p, x); }, fits = function (e) { return [2, 3].every(function (x) { return at(e, rat(x, 1)).equals(fn(x)); }); };
      return { text: c.text(p) + ' $x$와 $y$ 사이의 관계를 나타낸 식을 고르세요.', ans: ans, check: fits(ans) && !fits(dir ? eI : eD) && !fits(eA) && !fits(eF),
        wrong: [dir ? [eI, 'as-inverse', '반비례 식을 골랐어요. 이 상황에서는 $x$가 2배가 되면 $y$도 2배가 돼요. 함께 늘어나는 관계는 정비례이고 $y = ax$ 꼴이에요.']
            : [eD, 'as-direct', '정비례 식을 골랐어요. 이 상황에서는 $x$가 2배가 되면 $y$는 절반으로 줄어요. 한쪽이 늘 때 다른 쪽이 줄어드는 이런 관계는 반비례이고 $y = \\dfrac{a}{x}$ 꼴이에요.'],
          [eA, 'added', '더하는 식을 골랐어요. $x$에 1, 2, 3을 넣어 보면 상황과 맞지 않아요. ' + (dir ? '같은 양이 여러 번 되풀이되는 것이니 곱셈이에요.' : '정해진 전체를 나누는 것이니 나눗셈이에요.')],
          [eF, 'flipped', '$x$를 ' + josa(p, '으로/로') + ' 나눈 식을 골랐어요. $x$에 1을 넣어 보세요. ' + (dir ? '$y$가 ' + p + '이 되어야 하는데 훨씬 작은 수가 나와요. ' + p + '은 $x$에 곱해야 해요.' : '$y$가 ' + p + '이 되어야 하는데 훨씬 작은 수가 나와요. ' + p + '을 $x$로 나눠야 해요.').replace(new RegExp(p + '이 되어야', 'g'), josa(p, '이/가') + ' 되어야').replace(p + '은 $x$에', josa(p, '은/는') + ' $x$에').replace(p + '을 $x$로', josa(p, '을/를') + ' $x$로')]],
        hints: [KIND_HINT, c.one(p) + ' 이것이 정비례인지 반비례인지 먼저 정해요.',
          '식의 모양을 정했으면 쉬운 수를 넣어 확인해요. ① $x$에 1을 넣었을 때 $y$가 얼마여야 하는지 상황에서 생각해요. ② 보기의 식에 $x = 1$을 넣어 그 값이 나오는지 봐요. ③ $x = 2$도 넣어 한 번 더 확인해요. 두 번 모두 맞는 식이 답이에요.'],
        steps: [{ say: c.one(p) }, { say: dir ? '$x$가 늘어나는 대로 $y$도 똑같이 늘어나니 정비례예요. $x$에 곱하는 수를 찾아요.' : '$x$가 늘어나면 $y$는 거꾸로 줄어드니 반비례예요. $x$와 $y$를 곱한 값이 늘 같아요.', tex: ans }] };
    },
    line: function (q) {
      var p = q.p, y = q.q, a = rat(y, p), ans = 'y = ' + ax(a), up = a.n > 0, two = rat(2 * p, 1);
      var on = function (e) { return same(at(e, rat(p, 1)), rat(y, 1)) && same(at(e, two), rat(2 * y, 1)); };
      var wrong = pick3(ans, [
        ['y = ' + ax(rat(p, y)), 'flipped', '$x$좌표를 $y$좌표로 나눴어요. $y = ax$에서 $a$는 ($y$좌표) ÷ ($x$좌표)예요. 점 P의 좌표를 식에 넣어 맞는지 확인해 보세요.'],
        ['y = ' + ax(rat(-y, p)), 'sign', '부호가 반대예요. 이 그래프는 오른쪽으로 갈수록 ' + (up ? '올라가요. 오른쪽 위로 올라가는 직선은 $a$가 양수예요.' : '내려가요. 오른쪽 아래로 내려가는 직선은 $a$가 음수예요.')],
        ['y = ' + overx(p * y), 'as-inverse', '반비례 식을 골랐어요. 반비례의 그래프는 휘어진 한 쌍의 곡선이에요. 원점을 지나는 곧은 선은 정비례 $y = ax$의 그래프예요.'],
        ['y = ' + ax(rat(y, 1)), 'y-only', '점 P의 $y$좌표를 그대로 $a$로 썼어요. $a$는 $y$좌표를 $x$좌표로 나눈 값이에요. $x$가 1일 때의 $y$값이 $a$예요.']]);
      return { text: '그림의 그래프가 나타내는 식을 고르세요.', figure: { type: 'plane', range: 5, line: [y, p], points: [{ x: p, y: y, label: 'P' }] }, ans: ans, wrong: wrong,
        check: on(ans) && same(at(ans, rat(0, 1)), rat(0, 1)) && wrong.every(function (w) { return !on(w[0]); }),
        hints: ['먼저 그래프의 모양을 봐요. 원점을 지나는 곧은 선이면 정비례 $y = ax$의 그래프이고, 원점을 지나지 않고 휘어진 한 쌍의 곡선이면 반비례 $y = \\dfrac{a}{x}$의 그래프예요. 이 그래프는 원점을 지나는 곧은 선이에요.',
          '식의 모양이 정해졌으니 $a$만 찾으면 돼요. 그래프 위에 표시된 점 P의 좌표를 읽어요. 원점에서 ' + side(p) + '으로 ' + abs(p) + '칸, ' + updown(y) + '로 ' + abs(y) + '칸 간 곳이에요. 그래프가 이 점을 지나니, 이 좌표를 식에 넣으면 참이 되어야 해요.',
          '① $y = ax$의 $x$ 자리에 점 P의 $x$좌표를, $y$ 자리에 $y$좌표를 넣어요. ② 양쪽을 $x$좌표로 나누면 $a$가 나와요. 곧 $a$는 ($y$좌표) ÷ ($x$좌표)예요. ③ 부호를 확인해요. 오른쪽 위로 올라가는 직선이면 $a$는 양수, 오른쪽 아래로 내려가는 직선이면 음수예요.'],
        steps: [{ say: '원점을 지나는 직선이니 정비례예요.', tex: 'y = ax' }, { say: '점 P의 좌표를 읽어요.', tex: 'P' + pt(p, y) }, { say: '좌표를 넣어 $a$를 구해요.', tex: 'a = \\dfrac{' + y + '}{' + p + '} = ' + ratTex(a) }, { say: '구한 $a$를 넣어 식을 써요.', tex: ans }] };
    },
    curve: function (q) {
      var p = q.p, y = q.q, a = p * y, ans = 'y = ' + overx(a), two = rat(2 * p, 1), half = rat(y, 2);
      var on = function (e) { return same(at(e, rat(p, 1)), rat(y, 1)) && same(at(e, two), half); };
      var wrong = pick3(ans, [
        ['y = ' + overx(-a), 'sign', '부호가 반대예요. 이 곡선은 ' + (a > 0 ? '제1사분면과 제3사분면에 있어요. 그러면 $a$는 양수예요.' : '제2사분면과 제4사분면에 있어요. 그러면 $a$는 음수예요.') + ' 점 P의 두 좌표를 곱할 때 부호를 확인해요.'],
        ['y = ' + ax(rat(y, p)), 'as-direct', '정비례 식을 골랐어요. 정비례의 그래프는 원점을 지나는 곧은 선이에요. 원점을 지나지 않고 휘어진 한 쌍의 곡선은 반비례 $y = \\dfrac{a}{x}$의 그래프예요.'],
        abs(p) === 1 ? null : ['y = ' + overx(y), 'y-only', '점 P의 $y$좌표를 그대로 $a$로 썼어요. 반비례에서 $a$는 $x$좌표와 $y$좌표를 곱한 값이에요.'],
        p + y === 0 ? null : ['y = ' + overx(p + y), 'sum', '점 P의 두 좌표를 더했어요. 반비례에서 $a$는 두 좌표를 더한 값이 아니라 곱한 값이에요.']]);
      return { text: '그림의 그래프가 나타내는 식을 고르세요.', figure: { type: 'plane', range: 6, curve: a, points: [{ x: p, y: y, label: 'P' }] }, ans: ans, wrong: wrong,
        check: on(ans) && wrong.every(function (w) { return !on(w[0]); }),
        hints: ['먼저 그래프의 모양을 봐요. 원점을 지나는 곧은 선이면 정비례 $y = ax$의 그래프이고, 원점을 지나지 않고 휘어진 한 쌍의 곡선이면 반비례 $y = \\dfrac{a}{x}$의 그래프예요. 이 그래프는 휘어진 한 쌍의 곡선이에요.',
          '식의 모양이 정해졌으니 $a$만 찾으면 돼요. 그래프 위에 표시된 점 P의 좌표를 읽어요. 원점에서 ' + side(p) + '으로 ' + abs(p) + '칸, ' + updown(y) + '로 ' + abs(y) + '칸 간 곳이에요. 그래프가 이 점을 지나니, 이 좌표를 식에 넣으면 참이 되어야 해요.',
          '① 반비례 식의 양쪽에 $x$를 곱하면 $xy = a$예요. 곧 $a$는 ($x$좌표) × ($y$좌표)예요. ② 점 P의 두 좌표를 곱해요. 부호가 같으면 양수, 다르면 음수예요. ③ 부호를 그림으로도 확인해요. 곡선이 오른쪽 위와 왼쪽 아래에 있으면 $a$는 양수, 왼쪽 위와 오른쪽 아래에 있으면 음수예요.'],
        steps: [{ say: '원점을 지나지 않는 한 쌍의 곡선이니 반비례예요.', tex: 'y = \\dfrac{a}{x}' }, { say: '점 P의 좌표를 읽어요.', tex: 'P' + pt(p, y) }, { say: '두 좌표를 곱해 $a$를 구해요.', tex: 'a = ' + par(p) + ' \\times ' + par(y) + ' = ' + a }, { say: '구한 $a$를 넣어 식을 써요.', tex: ans }] };
    }
  };
  choiceQ({
    id: 'B09.graph', title: '그래프와 식', build: function (q) { return GRAPH[q.k](q); },
    ids: ['as-inverse', 'as-direct', 'added', 'flipped', 'sign', 'y-only', 'sum'],
    levels: [
      { name: '상황을 식으로', minDistinct: 70, vars: { q: sampler(function (r) { var i = r.int(0, STORY.length - 1); return { k: 'story', i: i, p: r.int(STORY[i].lo, STORY[i].hi), o: order4(r) }; }) } },
      { name: '직선 그래프의 식', minDistinct: 60, vars: { q: sampler(function (r) { return { k: 'line', p: nz(r, -4, 4), q: nz(r, -4, 4), o: order4(r) }; }) } },
      { name: '곡선 그래프의 식', minDistinct: 60, vars: { q: sampler(function (r) {
          var a = pm(r, r.pick([2, 3, 4, 5, 6, 8, 10, 12])), ds = [], d;
          for (d = 1; d <= 6; d++) if (abs(a) % d === 0 && abs(a) / d <= 6) ds.push(d);
          d = pm(r, r.pick(ds));
          return { k: 'curve', p: d, q: a / d, o: order4(r) };
        }) } }
    ]
  });
})();

/* ── 개념 카드 ── */
MH.defineConcept('B09', [
  { title: '순서쌍과 좌표 — 점의 주소', body: [
    '가로로 누운 수직선($x$축)과 세로로 선 수직선($y$축)을 0에서 만나게 그린 것이 좌표평면이에요. 두 축이 만나는 점이 원점 O예요.',
    { figure: { type: 'plane', range: 5, points: [{ x: 3, y: 2, label: 'P' }] } },
    '점 P는 원점에서 오른쪽으로 3칸, 위로 2칸 간 곳이에요. 이것을 $(3,\\ 2)$로 쓰고 점 P의 좌표라고 해요. 영화관 자리를 "몇 열 몇 번"으로 찾는 것과 같아요.',
    { list: ['앞의 수가 $x$좌표(좌우), 뒤의 수가 $y$좌표(위아래)예요.', '오른쪽과 위가 양수, 왼쪽과 아래가 음수예요.', '순서가 중요해요. $(3,\\ 2)$와 $(2,\\ 3)$은 다른 점이에요.'] }
  ] },
  { title: '사분면', body: [
    '좌표평면은 두 축 때문에 네 구역으로 나뉘어요. 오른쪽 위부터 시계 반대 방향으로 제1, 제2, 제3, 제4사분면이라고 해요.',
    { ex: [['(+,\\ +)', '제1사분면 — 오른쪽 위'], ['(-,\\ +)', '제2사분면 — 왼쪽 위'], ['(-,\\ -)', '제3사분면 — 왼쪽 아래'], ['(+,\\ -)', '제4사분면 — 오른쪽 아래']] },
    '좌표의 부호만 보면 어느 사분면인지 알 수 있어요. $(-3,\\ 5)$는 부호가 (−, +)이니 제2사분면 위의 점이에요.',
    '축 위의 점은 어느 사분면에도 속하지 않아요. $x$축 위의 점은 $y$좌표가 0, $y$축 위의 점은 $x$좌표가 0이에요.'
  ] },
  { title: '정비례 y = ax', body: [
    '$x$가 2배, 3배가 될 때 $y$도 2배, 3배가 되는 관계가 정비례예요. 한 개에 500원인 물건을 2개 사면 값이 2배가 되는 것과 같아요.',
    { tex: 'y = ax \\quad (a \\neq 0)' },
    { figure: { type: 'plane', range: 5, line: [2, 1], points: [{ x: 2, y: 4, label: 'P' }] } },
    '그래프는 원점을 지나는 곧은 선이에요. 위 그림은 $y = 2x$의 그래프이고 점 $(2,\\ 4)$를 지나요. $a$는 그래프 위의 점에서 ($y$좌표) ÷ ($x$좌표)로 구해요.',
    '$a$가 양수이면 오른쪽 위로 올라가고(제1, 제3사분면), 음수이면 오른쪽 아래로 내려가요(제2, 제4사분면).'
  ] },
  { title: '반비례 y = a/x', body: [
    '$x$가 2배, 3배가 될 때 $y$는 거꾸로 절반, 삼분의 일이 되는 관계가 반비례예요. 피자 한 판을 나눌 때 사람이 2배로 늘면 한 사람 몫이 절반이 되는 것과 같아요.',
    { tex: 'y = \\dfrac{a}{x} \\quad (a \\neq 0)' },
    { figure: { type: 'plane', range: 6, curve: 6, points: [{ x: 2, y: 3, label: 'P' }] } },
    '그래프는 원점을 지나지 않는 한 쌍의 매끄러운 곡선이에요. 위 그림은 $y = \\dfrac{6}{x}$의 그래프예요. 그래프 위의 어느 점이든 ($x$좌표) × ($y$좌표)가 $a$로 같아요.',
    '$a$가 양수이면 곡선이 제1, 제3사분면에, 음수이면 제2, 제4사분면에 있어요.'
  ] },
  { title: '정비례와 반비례 구별하기', body: [
    '표나 상황을 보고 어느 쪽인지 정할 때는 $x$가 2배가 될 때 $y$가 어떻게 되는지를 봐요.',
    { ex: [['y = ax', '정비례 — 함께 늘어요. y ÷ x 가 늘 같아요.'], ['y = \\dfrac{a}{x}', '반비례 — 한쪽이 늘면 다른 쪽이 줄어요. x × y 가 늘 같아요.']] },
    { list: ['한 개에 500원인 물건 $x$개의 값 $y$원 → $y = 500x$ (정비례)', '넓이가 24인 직사각형의 가로 $x$, 세로 $y$ → $y = \\dfrac{24}{x}$ (반비례)'] },
    '그래프가 어떤 점을 지난다는 것은 그 점의 좌표를 식에 넣으면 참이 된다는 뜻이에요. 그래서 점 하나만 알면 $a$를 구할 수 있어요.'
  ] }
]);
