/* 문자가 든 식을 다루는 단원(B05 부터)의 공통 도구.
   · MH.alg.ev(tex, env)      화면에 그리는 식(KaTeX 글)을 읽어, 문자에 수를 넣은 값을 정확한 분수로 구한다
   · MH.alg.sameVal(a, b)     두 식이 같은 식인가(문자에 두 가지 수를 넣어 비교)
   · MH.alg.choiceType(o)     답이 식인 유형을 '보기 고르기'로 등록한다. 틀린 보기마다 실수 id 와 설명이 붙는다
   답이 수 하나이면 키패드로, 답이 식 · 범위 · 그래프이면 보기 고르기로 만든다(CLAUDE.md '정답 판정과 피드백'). */
(function () {
  'use strict';
  var MH = globalThis.MH, F = MH.F;

  /* ── 식 읽기: 문자에 수를 넣어 식의 값을 구한다(붙여 쓴 곱셈, 분수 꼴, 거듭제곱을 읽는다) ── */
  var ev = function (tex, env) {
    var s = tex.replace(/\\left|\\right/g, '').replace(/\^\{(\d+)\}/g, '^$1'), prev, i = 0;
    do { prev = s; s = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'); } while (s !== prev);
    s = s.replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\s/g, '');
    var atom = function () {
      var c = s[i] || '';
      if (c === '(') { i++; var x = expr(); if (s[i] !== ')') throw new Error('괄호: ' + tex); i++; return x; }
      var m = /^\d+(?:\.(\d+))?/.exec(s.slice(i));
      if (m) { i += m[0].length; return F(Number(m[0].replace('.', '')), MH.pow10((m[1] || '').length)); }
      if (/[a-z]/.test(c) && env[c] !== undefined) { i++; return env[c]; }
      throw new Error('읽을 수 없는 식: ' + tex);
    };
    var power = function () {
      var x = atom();
      if (s[i] !== '^') return x;
      var m = /^\^(\d+)/.exec(s.slice(i)), y = F(1);
      i += m[0].length;
      for (var k = 0; k < Number(m[1]); k++) y = y.mul(x);
      return y;
    };
    var factor = function () { var x = power(); while (i < s.length && /[a-z0-9(]/.test(s[i])) x = x.mul(power()); return x; };
    var unary = function () { if (s[i] === '-') { i++; return unary().neg(); } if (s[i] === '+') { i++; return unary(); } return factor(); };
    var term = function () { var x = unary(); while (s[i] === '*' || s[i] === '/') { var op = s[i++], y = unary(); x = op === '*' ? x.mul(y) : x.div(y); } return x; };
    var expr = function () { var x = term(); while (s[i] === '+' || s[i] === '-') { var op = s[i++], y = term(); x = op === '+' ? x.add(y) : x.sub(y); } return x; };
    var out = expr();
    if (i !== s.length) throw new Error('읽다 만 식: ' + tex);
    return out;
  };
  var E1 = {}, E2 = {};
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function (l, i) { E1[l] = F(2 * i + 3); E2[l] = F(-(i + 2), i + 7); });
  var val2 = function (tex) { try { return [ev(tex, E1), ev(tex, E2)]; } catch (e) { return null; } };
  /** 두 식이 같은 값인가(문자에 두 가지 수를 넣어 본다). 읽을 수 없는 식은 어떤 식과도 같지 않다 */
  var sameVal = function (a, b) { var x = val2(a), y = val2(b); return !!x && !!y && x[0].equals(y[0]) && x[1].equals(y[1]); };
  /* ── 보기 고르기 유형의 공통 틀 ──
     o = { id, unit, title, levels, ids: [실수 id …], build, prompt, hints, steps, explain: { 실수 id: (문제) → 설명 }, form }
     o.build(v.q) → { raw: 답과 값이 같아야 하는 원래 식, ans: 정답 보기, wrong: [[보기, 실수 id, 설명(없으면 o.explain[id])] …], … }
     보기는 [ans].concat(wrong 의 보기) 를 v.q.o([0, 1, 2, 3] 을 섞은 것) 순서로 놓는다.
     o.form 에 적은 실수 id 의 보기는 값이 답과 같아도 된다(쓰는 약속을 어긴 보기: 수를 문자 뒤에 씀 …). */
  var choiceType = function (o) {
    var FORM = o.form || {}, lastQ = null, lastP = null;
    /* 한 문제를 그리는 동안 여러 번 불리므로, 같은 문제(v.q)는 한 번만 만든다 */
    var P = function (v) { if (v.q !== lastQ) { lastP = o.build(v.q); lastQ = v.q; } return lastP; };
    var optionsOf = function (v) {
      var p = P(v), all = [p.ans].concat(p.wrong.map(function (w) { return w[0]; }));
      return v.q.o.filter(function (i) { return i < all.length; }).map(function (i) { return all[i]; });
    };
    var find = function (v, id) { return P(v).wrong.filter(function (w) { return w[1] === id; })[0]; };
    MH.defineType({
      id: o.id, unit: o.unit, version: o.version || 1, title: o.title,
      answer: { kind: 'choice', options: optionsOf },
      levels: o.levels,
      prompt: function (v) { return o.prompt(P(v)); },
      solve: function (v) { return P(v).ans; },
      /* 검산: 정답 보기는 원래 식과 값이 같고, 틀린 보기는 값이 다르거나 쓰는 약속을 어긴 것이다 */
      verify: function (v, ans) {
        var p = P(v), opts = optionsOf(v);
        return sameVal(p.raw, p.ans) && ans === p.ans && opts.indexOf(ans) >= 0 && opts.every(function (x, i) { return opts.indexOf(x) === i; })
          && p.wrong.every(function (w) { return w[0] !== p.ans && (FORM[w[1]] ? true : !sameVal(w[0], p.ans)); });
      },
      hints: function (v) { return o.hints(P(v)); },
      steps: function (v) { return o.steps(P(v)); },
      mistakes: o.ids.map(function (id) {
        return { id: id, wrong: function (v) { var w = find(v, id); return w ? w[0] : null; },
          explain: function (v) { var w = find(v, id); return w ? (w[2] || o.explain[id](P(v))) : ''; } };
      })
    });
  };
  MH.alg = { ev: ev, sameVal: sameVal, choiceType: choiceType, order4: function (r) { return r.shuffle([0, 1, 2, 3]); } };
})();
