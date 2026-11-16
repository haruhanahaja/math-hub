/* 풀이 공간의 모델 검사 — 획 더하기 · 지우개 · 되돌리기 · 문제가 바뀌면 비우기. 화면(캔버스) 없이 돈다. */
(function () {
  'use strict';
  load('docs/shared/engine/scratch.js');
  var M = MH.scratch.model, st = M.state;
  var line = function (x1, y1, x2, y2) { return { w: 2, pts: [x1, y1, 0.5, x2, y2, 0.5] }; };
  var n = function () { return st.strokes.length + '/' + st.hist.length; };

  group('풀이 공간');
  M.reset('A|0|1');
  eq(n(), '0/0', '처음에는 비어 있음');
  M.add(line(0, 0, 100, 0)); M.add(line(0, 50, 100, 50)); M.add({ w: 2, pts: [200, 200, 0.5] });
  eq(n(), '3/3', '획 세 개');
  eq([M.hit(st.strokes[0], 50, 5, 14), M.hit(st.strokes[0], 50, 20, 14), M.hit(st.strokes[0], 120, 0, 14), M.hit(st.strokes[2], 205, 205, 14), M.hit(st.strokes[2], 230, 200, 14)].join(' '),
    'true false false true false', '선분 가운데도, 점 하나짜리 획도 닿는지 본다');
  eq(M.eraseAt(50, 30, true) + ' ' + n(), 'false 3/3', '아무 획도 없는 곳을 지우면 그대로');
  eq(M.eraseAt(50, 3, true) + ' ' + M.eraseAt(60, 48, false) + ' ' + n(), 'true true 1/4', '지우개 한 번의 움직임으로 두 획을 지움(되돌리기는 한 번으로 기억)');
  eq(M.undo() + ' ' + n(), 'true 3/3', '되돌리면 지운 두 획이 함께 돌아옴');
  eq(M.clear() + ' ' + n() + ' ' + M.clear(), 'true 0/4 false', '모두 지우기(빈 곳에서는 하지 않음)');
  eq(M.undo() + ' ' + n(), 'true 3/3', '모두 지우기도 되돌릴 수 있음');
  M.undo(); M.undo(); M.undo();
  eq(M.undo() + ' ' + n(), 'false 0/0', '더 되돌릴 것이 없으면 그대로');
  M.add(line(0, 0, 10, 10)); st.tool = 'eraser';
  M.reset('A|0|1');
  eq(n() + ' ' + st.tool, '1/1 eraser', '같은 문제를 다시 그릴 때는 쓴 것이 남음');
  M.reset('A|0|2');
  eq(n() + ' ' + st.tool, '0/0 pen', '다른 문제로 가면 비우고 펜으로 돌아감');
  for (var i = 0; i < 100; i++) M.add(line(i, 0, i, 10));
  eq(n(), '100/60', '되돌리기 기록은 60번까지');
  ok(/id="sp-cv"/.test(MH.scratch.html()) && /data-act="sp-undo"/.test(MH.scratch.html()), '화면 조각에 캔버스와 단추가 있음');
  done('획 · 지우개 · 되돌리기');
})();
