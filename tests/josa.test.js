/* 조사 검사 — 모든 유형의 문제 글 · 힌트 · 풀이 · 실수 설명 · 보기와 모든 개념 카드에 건다.
   수 · 식 뒤의 조사(은/는, 이/가, 을/를, 과/와, 으로/로, 이에요/예요)는 화면에 보이는 마지막 숫자가 아니라 읽는 소리로 정한다.
     · 분수 \dfrac{3}{4} 는 "4분의 3" 으로 읽으니 분자(3)를 따른다.
     · 거듭제곱 2^{3} 은 "2의 세제곱" 으로 읽으니 받침이 있다(단위 cm^{2} 는 "제곱센티미터" 라서 받침이 없다).
     · 각도 30° 는 "30도" 라서 받침이 없다.
     · 「단위(0.01)가」 처럼 한글 낱말 바로 뒤의 괄호는 덧붙인 말이라서, 조사는 괄호 앞의 낱말을 따른다.
     · 「7 × 6 가」 처럼 수와 조사 사이를 띄어 쓰지 않는다.
   한글 낱말 뒤의 조사(「사인는」)는 자주 쓰는 수학 용어만 본다. */
(function () {
  'use strict';
  var PAIR = { '은': '은/는', '는': '은/는', '이': '이/가', '가': '이/가', '을': '을/를', '를': '을/를', '과': '과/와', '와': '과/와', '으로': '으로/로', '로': '으로/로', '이에요': '이에요/예요', '예요': '이에요/예요' };
  var J = '(은|는|이|가|을|를|과|와|으로|로|이에요|예요)(?=[ ,.)」"]|$)';
  var want = function (word, j) { var w = String(word); return MH.josa(w, PAIR[j]).slice(w.length); };
  /* 자주 쓰는 용어: 조사가 틀리면 바로 눈에 띄는 낱말 */
  var TERMS = ['사인', '코사인', '탄젠트', '분자', '분모', '평균', '분산', '편차', '기울기', '절편', '반지름', '지름', '넓이', '높이', '빗변', '밑변', '계수', '상수항', '지수', '밑', '몫', '나머지', '약수', '배수', '소수', '합성수', '정수', '유리수', '무리수', '제곱근', '근호', '부등호', '등호', '괄호', '방정식', '부등식', '함수', '그래프', '직선', '포물선', '꼭짓점', '원주각', '중심각', '확률', '경우의 수', '중앙값', '최빈값', '표준편차', '사다리', '나무', '건물', '공책', '연필', '빵', '지우개', '사과', '배'];
  var termRe = new RegExp('(^|[^가-힣])(' + TERMS.join('|') + ')' + J, 'g');

  /** 글 하나에서 틀린 조사를 찾아 설명의 배열로 돌려준다 */
  globalThis.josaErrors = function (text) {
    var s = String(text), out = [], re = new RegExp(J, 'g'), m, pre, t, k, depth, i, j;
    var bad = function (why, at) { out.push(why + ' ‹' + s.slice(Math.max(0, at - 28), at + 8) + '›'); };
    while ((m = re.exec(s))) {
      pre = s.slice(0, m.index); j = m[1];
      if ((t = /(\d) $/.exec(pre)) && j !== '이' && !/[.,] *\d+ $/.test(pre)) { bad('수와 조사 사이를 띄어 씀', m.index); continue; }
      if (/\^\{\\circ\}\$?$/.test(pre) || /°$/.test(pre)) { if (want('도', j) !== j) bad('각도(도) 뒤의 조사', m.index); continue; }
      if (/\\mathrm\{[a-z]+\}\^\{?\d\}?\$?$/.test(pre) || /[a-z]{1,2}[²³]$/.test(pre)) { if (want('터', j) !== j) bad('단위 뒤의 조사', m.index); continue; }
      if (/\^\{[^{}]+\}\)?\$?$/.test(pre) || /\^\d\)?\$?$/.test(pre)) { if (want('곱', j) !== j) bad('거듭제곱(제곱) 뒤의 조사', m.index); continue; }
      if ((t = /\\d?frac\{([^{}]*)\}\{[^{}]*\}\)?\$?$/.exec(pre))) { if (/^\d+$/.test(t[1]) && want(t[1], j) !== j) bad('분수(분자 ' + t[1] + ') 뒤의 조사', m.index); continue; }
      if ((t = /(\d+(?:\.\d+)?)(\)?)\$?$/.exec(pre))) {
        if (/[A-Za-z_]$/.test(pre.slice(0, pre.length - t[0].length))) continue;                 /* x2, a_1 같은 이름 */
        if (t[2]) {                                                                              /* 닫는 괄호: 여는 괄호 바로 앞이 한글이면 덧붙인 말 */
          depth = 0; k = -1;
          for (i = pre.replace(/\$$/, '').length - 1; i >= 0; i--) { if (pre.charAt(i) === ')') depth++; else if (pre.charAt(i) === '(') { depth--; if (depth === 0) { k = i; break; } } }
          if (k > 0 && /[가-힣]/.test(pre.charAt(k - 1))) { if (want(pre.charAt(k - 1), j) !== j) bad('괄호 앞 낱말 뒤의 조사', m.index); continue; }
        }
        if (want(t[1], j) !== j) bad('수 ' + t[1] + ' 뒤의 조사', m.index);
      }
    }
    while ((m = termRe.exec(s))) if (want(m[2], m[3]) !== m[3]) bad('낱말 「' + m[2] + '」 뒤의 조사', m.index + m[1].length + m[2].length);
    return out;
  };

  var flat = function (x, out) {
    if (typeof x === 'string') out.push(x);
    else if (Array.isArray(x)) x.forEach(function (y) { flat(y, out); });
    else if (x && typeof x === 'object') Object.keys(x).forEach(function (k) { if (k !== 'items' && k !== 'type') flat(x[k], out); });
    return out;
  };
  var check = function (text, where) { var e = josaErrors(text); ok(e.length === 0, where + ' 조사: ' + e.join(' / ')); };

  group('조사 — 검사 도구 자체 검사');
  [['$\\dfrac{3}{4}$은 분수예요.', 0], ['$\\dfrac{3}{4}$는 분수예요.', 1], ['$2^{3}$은 8이에요.', 0], ['$2^{3}$는 8이에요.', 1], ['$30^{\\circ}$와 같아요.', 0], ['$30^{\\circ}$과 같아요.', 1],
    ['7 × 6이 남아요.', 0], ['7 × 6 가 남아요.', 1], ['7 × 6가 남아요.', 1], ['단위(0.01)가 8개', 0], ['양수(3)가 돼요.', 0], ['$10x + (x + 3)$예요.', 1], ['$10x + (x + 3)$이에요.', 0],
    ['넓이는 $9\\,\\mathrm{cm}^{2}$예요.', 0], ['사인는 높이예요.', 1], ['사인은 높이예요.', 0], ['답은 24이에요.', 1], ['답은 24예요.', 0], ['$-5$는 음수예요.', 0], ['$-5$은 음수예요.', 1], ['3으로 나눠요.', 0], ['3로 나눠요.', 1], ['1, 2, 3 가운데', 0]
  ].forEach(function (c) { ok((josaErrors(c[0]).length > 0) === !!c[1], '검사 도구: ' + c[0] + ' → ' + JSON.stringify(josaErrors(c[0]))); });
  done('도구');

  group('조사 — 모든 유형 (단계마다 300문제)');
  Object.keys(MH.types).forEach(function (id) {
    var def = MH.types[id];
    def.levels.forEach(function (lv, level) {
      for (var seed = 1; seed <= 300; seed++) {
        var p = MH.makeProblem(id, level, seed), pr = def.prompt(p.v, p.ctx), where = id + ' ' + level + '단계 씨앗 ' + seed;
        if (pr.text) check(pr.text, where + ' 문제');
        if (pr.figure && pr.figure.alt) check(pr.figure.alt, where + ' 그림 설명');
        def.hints(p.v, p.ctx).forEach(function (h) { check(h, where + ' 힌트'); });
        def.steps(p.v, p.ctx).forEach(function (st) { check(st.say, where + ' 풀이'); });
        MH.mistakesFor(p).forEach(function (mk) { check(mk.explain, where + ' 실수(' + mk.id + ')'); });
        if (def.answer.kind === 'choice') MH.optionsOf(p).forEach(function (o) { if (/[가-힣]/.test(o)) check(o, where + ' 보기'); });
      }
    });
  });
  done('유형 ' + Object.keys(MH.types).length + '개');

  group('조사 — 모든 개념 카드');
  var cards = 0;
  Object.keys(MH.concepts).forEach(function (u) { MH.concepts[u].forEach(function (c, i) { cards++; flat(c, []).forEach(function (t) { check(t, u + ' 개념 카드 ' + (i + 1)); }); }); });
  done('카드 ' + cards + '장');
})();
