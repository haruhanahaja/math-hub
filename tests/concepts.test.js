/* 개념 카드 검사 — 만들어진 모든 단원에 개념 카드가 있고, 글과 수식이 화면에 그릴 수 있는 꼴인지 본다.
   수식은 실제 KaTeX 로 그려 보고 오류가 없는지 확인한다(KaTeX 는 화면 없이도 돈다). */
(function () {
  'use strict';
/** 좌표평면 그림: 점이 모눈 안의 정수 점이고, 직선 · 곡선의 수가 0 이 아니다 */
function planeOk(f) {
  var R = f.range || 5;
  return R >= 3 && R <= 8 && (f.points || []).every(function (q) { return Number.isInteger(q.x) && Number.isInteger(q.y) && Math.abs(q.x) <= R && Math.abs(q.y) <= R; })
    && (!f.line || (Number.isInteger(f.line[0]) && Number.isInteger(f.line[1]) && f.line[0] !== 0 && f.line[1] !== 0)) && (!f.curve || (Number.isInteger(f.curve) && f.curve !== 0));
}
globalThis.planeOk = planeOk;
  load('docs/shared/vendor/katex/katex.min.js');
  var K = globalThis.katex;
  group('개념 카드');
  ok(!!K && typeof K.renderToString === 'function', 'KaTeX 를 불러옴');
  var texOk = function (src, where) {
    if (/[가-힣]/.test(src) && src.indexOf('\\') < 0) return true;             /* 한글 낱말은 글자 그대로 그린다(ui.js 의 tex 와 같은 규칙) */
    try { K.renderToString(src, { throwOnError: true }); return true; } catch (e) { return ok(false, where + '수식 오류 ' + src + ' — ' + e.message); }
  };
  var textOk = function (t, where) {
    ok(typeof t === 'string' && t.trim().length > 0, where + '빈 글');
    ok(!/undefined|NaN|null|\[object/.test(t), where + '잘못 이어 붙인 글: ' + t);
    var parts = t.split('$');
    ok(parts.length % 2 === 1, where + '$ 의 짝이 안 맞음: ' + t);
    parts.forEach(function (x, i) { if (i % 2) texOk(x, where); else ok(!/\\[a-z]|\d\/\d/.test(x), where + '$ 밖에 수식이나 3/4 꼴 분수가 있음: ' + x); });
  };
  var cards = 0, blocks = 0;
  MH.MAP.units.filter(function (u) { return u.ready; }).forEach(function (u) {
    var list = MH.concepts[u.id];
    if (!ok(Array.isArray(list), u.id + ' 단원에 개념 카드가 없음')) return;
    ok(list.length >= 3 && list.length <= 6, u.id + ': 카드는 3~6장 (지금 ' + list.length + '장)');
    list.forEach(function (c, i) {
      var where = u.id + ' ' + (i + 1) + '번 카드: ', letters = 0;
      cards++;
      textOk(c.title, where); ok(c.title.length <= 40, where + '제목이 너무 김');
      ok(c.body.length >= 2 && c.body.length <= 7, where + '조각은 2~7개 (지금 ' + c.body.length + '개)');
      c.body.forEach(function (b) {
        blocks++;
        if (typeof b === 'string') { textOk(b, where); letters += b.length; ok(b.length <= 260, where + '한 문단이 너무 김(' + b.length + '자)'); }
        else if (typeof b.tex === 'string') texOk(b.tex, where);
        else if (b.figure) {
          var f = b.figure;
          ok(f.type === 'bar' ? f.parts >= 1 && f.filled >= 0 : f.type === 'plane' ? planeOk(f) : f.type === 'line' && f.max > (f.min || 0) && f.parts >= 1 && (f.max - (f.min || 0)) * f.parts <= 20 && (!f.ray || (f.ray.at >= 0 && f.ray.at <= (f.max - (f.min || 0)) * f.parts && (f.ray.dir === 1 || f.ray.dir === -1) && typeof f.ray.open === 'boolean')), where + '그림 형식');
        }
        else if (b.list) { ok(b.list.length >= 2, where + '목록은 둘 이상'); b.list.forEach(function (t) { textOk(t, where); letters += t.length; }); }
        else if (b.ex) { ok(b.ex.length >= 2, where + '예시는 둘 이상'); b.ex.forEach(function (e) { ok(e.length === 2, where + '예시는 [수식, 설명]'); texOk(e[0], where); textOk(e[1], where); letters += e[1].length; }); }
        else ok(false, where + '모르는 조각');
      });
      ok(letters >= 40, where + '설명이 너무 짧음(' + letters + '자)');
    });
  });
  Object.keys(MH.concepts).forEach(function (id) { ok(!!MH.MAP.unit(id) && MH.MAP.unit(id).ready, '개념 카드의 단원 ' + id + ' 가 지도에 없거나 준비 중'); });
  /* 등록할 때의 검사 */
  var bad = function (fn) { try { fn(); return false; } catch (e) { return true; } };
  ok(bad(function () { MH.defineConcept('A01', [{ title: 'x', body: ['y'] }]); }), '같은 단원에 두 번 등록하면 오류');
  ok(bad(function () { MH.defineConcept('Z98', []); }) && bad(function () { MH.defineConcept('Z99', [{ title: 'x', body: [{ what: 1 }] }]); }) && !MH.concepts.Z98 && !MH.concepts.Z99, '빈 카드 · 모르는 조각은 오류');
  done('단원 ' + Object.keys(MH.concepts).length + '개, 카드 ' + cards + '장, 조각 ' + blocks + '개');
})();
