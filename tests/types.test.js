/* 등록된 모든 유형에 자동으로 거는 검사 (plan/architecture.md 4장).
   유형을 등록하기만 하면 단계마다 문제 1,000개를 만들어 아래를 확인한다. */
(function () {
  'use strict';
  var N = 1000;

  Object.keys(MH.types).forEach(function (id) {
    var def = MH.types[id], kind = MH.kinds[def.answer.kind], fired = {};
    group('유형 ' + id + ' — ' + def.title);

    def.levels.forEach(function (lv, level) {
      var seen = {}, made = 0, tries = 0, tag = id + ' ' + level + '단계';
      for (var seed = 1; seed <= N; seed++) {
        var p, where = tag + ' 씨앗 ' + seed + ': ';
        /* 생성: 다시 뽑기 한도 안에 만들어진다 */
        try { p = MH.makeProblem(id, level, seed); } catch (e) { ok(false, where + e.message); continue; }
        made++; tries += MH.lastTries;
        var v = p.v, ctx = p.ctx, prompt = def.prompt(v, ctx);
        seen[JSON.stringify(prompt)] = 1;

        /* 조건: 그 단계의 조건과 답 형식의 조건을 지킨다 */
        ok(!lv.where || lv.where(v, ctx), where + '단계 조건을 어김 ' + JSON.stringify(v));
        ok(kind.valid(p.answer), where + '답이 형식에 맞지 않음 ' + p.answer);
        ok(prompt && (prompt.tex || prompt.text), where + '문제 글이 비었음');

        /* 정답: solve 와 다른 방법(verify)으로 확인 */
        ok(def.verify(v, p.answer, ctx) === true, where + '검산 실패 ' + JSON.stringify(v) + ' → ' + p.answer);

        /* 판정: 정답을 입력하면 정답 */
        var right = MH.judge(p, kind.raw(p.answer, def.answer));
        ok(right.verdict === 'correct', where + '정답 ' + kind.raw(p.answer, def.answer) + ' 를 ' + right.verdict + ' 로 판정');
        ok(MH.judge(p, '').verdict === 'invalid', where + '빈 입력을 invalid 로 판정하지 않음');

        /* 실수: 각 실수의 오답을 입력하면 오답이고, 그 오답을 만드는 실수의 설명이 나온다 */
        var ms = MH.mistakesFor(p);
        ms.forEach(function (m) {
          var j = MH.judge(p, kind.raw(m.value, def.answer));
          var same = ms.filter(function (x) { return kind.equal(x.value, m.value); }).map(function (x) { return x.id; });
          ok(j.verdict === 'wrong' && j.mistake && same.indexOf(j.mistake.id) >= 0 && j.mistake.explain.length > 10,
            where + '실수 ' + m.id + ' 의 오답 ' + kind.raw(m.value, def.answer) + ' → ' + JSON.stringify(j));
          fired[m.id] = 1;
        });

        /* 풀이: 마지막 값이 정답과 같다 */
        var steps = def.steps(v, ctx);
        ok(steps.length >= 2 && steps.every(function (s) { return typeof s.say === 'string' && s.say.length > 0; }), where + '풀이 단계가 부족하거나 비었음');
        ok(steps.length && kind.equal(steps[steps.length - 1].value, p.answer), where + '풀이의 마지막 값 ' + (steps.length && steps[steps.length - 1].value) + ' ≠ 정답 ' + p.answer);
        ok(!/undefined|NaN|null/.test(JSON.stringify(steps)), where + '풀이에 undefined/NaN ' + JSON.stringify(steps));

        /* 힌트: 1개 이상이고 정답을 그대로 담지 않는다(문제에 이미 보이는 수는 예외) */
        var hints = def.hints(v, ctx), shown = (JSON.stringify(prompt).match(/\d+/g) || []);
        ok(hints.length >= 1 && hints.every(function (h) { return typeof h === 'string' && h.length > 0; }), where + '힌트가 없음');
        ok(!/undefined|NaN|null/.test(hints.join(' ')), where + '힌트에 undefined/NaN ' + hints.join(' / '));
        /* 19 이하의 작은 수는 한 자리 계산이나 '10을 빌려' 같은 말에 우연히 나올 수 있어 검사하지 않는다 */
        if (shown.indexOf(kind.tex(p.answer)) < 0 && !(def.answer.kind === 'int' && p.answer <= 19))
          ok((hints.join(' ').match(/\d+/g) || []).indexOf(kind.tex(p.answer)) < 0, where + '힌트가 정답 ' + p.answer + ' 을 말함: ' + hints.join(' / '));

        /* 재현: 같은 씨앗이면 같은 문제 */
        ok(JSON.stringify(MH.makeProblem(id, level, seed).v) === JSON.stringify(v), where + '같은 씨앗인데 다른 문제');
      }
      /* 조건이 너무 빡빡하지 않다: 문제 하나를 만드는 데 평균 50번 넘게 다시 뽑으면, 테스트하지 않은 씨앗에서 한도를 넘길 수 있다 */
      ok(made > 0 && tries / made <= 50, tag + ': 조건이 너무 빡빡함(문제 하나에 평균 ' + (made ? Math.round(tries / made) : '?') + '번 뽑음)');
      /* 다양성: 서로 다른 문제가 충분히 많다 */
      var distinct = Object.keys(seen).length;
      ok(distinct >= (lv.minDistinct || 300), tag + ': 서로 다른 문제가 ' + distinct + '개뿐');
      done(level + '단계 「' + lv.name + '」 ' + made + '문제, 서로 다른 문제 ' + distinct + '개');
    });

    /* 적어 둔 실수는 실제로 한 번은 쓰여야 한다(절대 일어나지 않는 실수는 잘못 적은 것) */
    def.mistakes.forEach(function (m) { ok(m.match || fired[m.id], id + ': 실수 ' + m.id + ' 가 한 번도 쓰이지 않음'); });
  });
})();
