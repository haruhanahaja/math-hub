/* 단원 지도 검사: 선수 단원이 실제로 있고 앞에 나오는지(순환 없음), 지도의 유형과 등록된 유형이 맞는지 */
(function () {
  'use strict';
  group('단원 지도');
  var pos = {}, units = MH.MAP.units;
  units.forEach(function (u, i) { ok(pos[u.id] === undefined, '단원 ID 가 겹침: ' + u.id); pos[u.id] = i; });
  eq(units.length, 100, '단원 수');
  units.forEach(function (u) {
    ok(/^[A-F]\d\d[a-z]?$/.test(u.id), '단원 ID 형식: ' + u.id);
    ok(!!MH.MAP.stage(u.stage), u.id + ': 구간이 없음');
    ok(u.title && u.summary, u.id + ': 제목 · 내용이 비었음');
    u.requires.forEach(function (r) { ok(pos[r] !== undefined && pos[r] < pos[u.id], u.id + ': 선수 단원 ' + r + ' 이 없거나 뒤에 있음'); });
    ok(u.ready === (u.types.length > 0), u.id + ': ready 와 유형 목록이 안 맞음');
    u.types.forEach(function (t) { ok(MH.types[t] && MH.types[t].unit === u.id, u.id + ': 유형 ' + t + ' 이 등록되지 않음'); });
    /* 만들어진 단원의 선수 단원은 모두 만들어져 있어야 열 수 있다 */
    if (u.ready) u.requires.forEach(function (r) { ok(MH.MAP.unit(r).ready, u.id + ': 선수 단원 ' + r + ' 이 아직 준비 중'); });
  });
  Object.keys(MH.types).forEach(function (t) {
    var u = MH.MAP.unit(MH.types[t].unit);
    ok(u && u.types.indexOf(t) >= 0, '유형 ' + t + ' 이 지도에 없음');
  });
  eq(MH.MAP.file('A01'), 'basic/units/a01.js', '단원 파일 주소');
  done('단원 ' + units.length + '개, 유형 ' + Object.keys(MH.types).length + '개');
})();
