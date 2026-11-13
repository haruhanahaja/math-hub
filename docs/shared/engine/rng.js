/* 씨앗(seed)이 있는 난수와 숫자 추출기.
   유형 템플릿은 Math.random 을 쓰지 않고 여기 있는 것만 쓴다 → 같은 씨앗이면 항상 같은 문제가 나온다. */
(function () {
  'use strict';
  var MH = globalThis.MH = globalThis.MH || {};

  /** 문자열을 32비트 정수로(FNV-1a). 유형 id · 버전 · 단계 · 씨앗을 한 수로 섞는 데 쓴다. */
  MH.hash = function (str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  };

  /** 난수기(mulberry32). u32(): 0 ~ 2^32-1 의 정수. int(a, b): a 이상 b 이하의 정수. */
  MH.rng = function (seed) {
    var s = seed >>> 0;
    var r = {
      u32: function () {
        s = (s + 0x6D2B79F5) >>> 0;
        var t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return (t ^ (t >>> 14)) >>> 0;
      },
      int: function (a, b) { return a + r.u32() % (b - a + 1); },
      pick: function (list) { return list[r.u32() % list.length]; },
      shuffle: function (list) {
        var out = list.slice();
        for (var i = out.length - 1; i > 0; i--) { var j = r.u32() % (i + 1); var t = out[i]; out[i] = out[j]; out[j] = t; }
        return out;
      }
    };
    return r;
  };

  /* 추출기: 템플릿의 vars 에 적는다. 엔진이 문제를 만들 때 sample(난수기) 를 부른다. */
  function Sampler(fn) { this.sample = fn; }
  MH.Sampler = Sampler;
  /** a 이상 b 이하의 정수 */
  MH.int = function (a, b) {
    if (!(Number.isInteger(a) && Number.isInteger(b)) || a > b) throw new Error('int(' + a + ', ' + b + '): 범위가 잘못됐습니다');
    return new Sampler(function (r) { return r.int(a, b); });
  };
  /** 목록에서 하나 */
  MH.pick = function (list) {
    if (!list || !list.length) throw new Error('pick: 빈 목록');
    return new Sampler(function (r) { return r.pick(list); });
  };
})();
