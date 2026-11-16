/* Math Hub 테스트. Node 없이 macOS 내장 jsc 로 돌린다(저장소 맨 위 폴더에서):
     sh tests/run.sh
   ① 등록된 모든 유형을 단계마다 1,000문제씩 만들어 자동 검사  ② 단원 지도  ③ 판정  ④ 진도 · 복습 규칙 */
'use strict';
var ROOT = 'docs/';
['shared/vendor/fraction/fraction.min.js', 'shared/engine/rng.js', 'shared/engine/num.js', 'shared/engine/answer.js', 'shared/engine/types.js', 'shared/engine/algebra.js',
  'shared/map.js', 'shared/engine/progress.js'].forEach(function (f) { load(ROOT + f); });
MH.MAP.units.filter(function (u) { return u.ready; }).forEach(function (u) { load(ROOT + MH.MAP.file(u.id)); });

var T = { pass: 0, fail: 0, group: '' };
function group(name) { T.group = name; print('\n' + name); }
function ok(cond, msg) {
  if (cond) { T.pass++; return true; }
  T.fail++;
  if (T.fail <= 40) print('  ✗ ' + msg);
  return false;
}
function eq(a, b, msg) { return ok(a === b, msg + ' — 기대 ' + JSON.stringify(b) + ', 실제 ' + JSON.stringify(a)); }
function done(label) { print('  ✓ ' + label); }
globalThis.T = T; globalThis.group = group; globalThis.ok = ok; globalThis.eq = eq; globalThis.done = done;

load('tests/types.test.js');
load('tests/map.test.js');
load('tests/concepts.test.js');
load('tests/answer.test.js');
load('tests/progress.test.js');
load('tests/scratch.test.js');
load('tests/units/a01.test.js');
load('tests/units/a02.test.js');
load('tests/units/a03.test.js');
load('tests/units/a04.test.js');
load('tests/units/a05.test.js');
load('tests/units/a06.test.js');
load('tests/units/a07.test.js');
load('tests/units/a08.test.js');
load('tests/units/a09.test.js');
load('tests/units/a10.test.js');
load('tests/units/a11.test.js');
load('tests/units/a12.test.js');
load('tests/units/a13.test.js');
load('tests/units/a14.test.js');
load('tests/units/a15.test.js');
load('tests/units/a16.test.js');
load('tests/units/a17.test.js');
load('tests/units/b01.test.js');
load('tests/units/b02.test.js');
load('tests/units/b03.test.js');
load('tests/units/b04.test.js');
load('tests/algcalc.js');
load('tests/units/b05.test.js');
load('tests/units/b06.test.js');
load('tests/units/b07.test.js');
load('tests/units/b08.test.js');

print('\n' + (T.fail ? '실패 ' + T.fail + '개, ' : '') + '통과 ' + T.pass + '개');
if (T.fail) throw new Error('테스트 실패');
