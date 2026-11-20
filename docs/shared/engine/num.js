/* 숫자 · 낱말 도구. 모든 계산은 정수와 분수로만 한다(소수점 계산 금지).
   분수는 fraction.js(shared/vendor/fraction) 로 정확하게 계산한다. */
(function () {
  'use strict';
  var MH = globalThis.MH = globalThis.MH || {};

  MH.gcd = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; };
  MH.lcm = function (a, b) { return a / MH.gcd(a, b) * b; };
  MH.coprime = function (a, b) { return MH.gcd(a, b) === 1; };

  /** 분수. F(3, 4) → 3/4 (fraction.js 의 Fraction: add · sub · mul · div · equals · compare, 값은 늘 기약분수로 n / d 에 들어 있다) */
  MH.F = function (n, d) { return new globalThis.Fraction(n, d === undefined ? 1 : d); };

  /* 소수는 { n, p } 로 다룬다: n ÷ 10^p (n 은 0 이상의 정수, p 는 소수점 아래 자릿수). 3.25 → { n: 325, p: 2 }.
     더하고 빼고 비교할 때는 자릿수를 맞춘 정수로 계산한다(부동소수점을 쓰지 않는다). */
  MH.pow10 = function (p) { var x = 1; while (p-- > 0) x *= 10; return x; };
  /** 소수 값을 만든다. 끝의 0 은 덜어 낸다: dec(350, 2) → { n: 35, p: 1 } */
  MH.dec = function (n, p) { p = p || 0; while (p > 0 && n % 10 === 0) { n /= 10; p--; } return { n: n, p: p }; };
  /** 소수를 글자로: decStr(325, 2) → '3.25', decStr(5, 2) → '0.05'. keep 이 참이면 끝의 0 을 남긴다: decStr(350, 2, true) → '3.50' */
  MH.decStr = function (n, p, keep) {
    var s = String(n);
    if (!p) return s;
    while (s.length <= p) s = '0' + s;
    s = s.slice(0, -p) + '.' + s.slice(-p);
    return keep ? s : s.replace(/0+$/, '').replace(/\.$/, '');
  };
  /** 소수점 아래 자리 이름: 1 → 소수 첫째 자리 */
  MH.decPlace = function (i) { return '소수 ' + ['첫째', '둘째', '셋째', '넷째'][i - 1] + ' 자리'; };

  /** 자연수의 자릿수 목록. 일의 자리가 맨 앞: digits(347) → [7, 4, 3] */
  MH.digits = function (n) {
    var out = [];
    do { out.push(n % 10); n = (n - n % 10) / 10; } while (n > 0);
    return out;
  };
  /** 자리 이름: 0 → 일, 1 → 십, 2 → 백 … */
  MH.place = function (i) { return ['일', '십', '백', '천', '만'][i]; };

  /* 한국어 조사. josa(347, '을/를') → '347을', josa('사과', '을/를') → '사과를', josa('(5 − 3)', '이에요/예요') → '(5 − 3)이에요'
     숫자는 읽었을 때 마지막 소리의 받침으로 정한다(0 → 십·백·천…, 1 → 일, 3 → 삼 …). */
  var DIGIT_FINAL = { 0: 'ㅂ', 1: 'ㄹ', 2: '', 3: 'ㅁ', 4: '', 5: '', 6: 'ㄱ', 7: 'ㄹ', 8: 'ㄹ', 9: '' };
  function finalOf(word) {
    /* 식 '(5 − 3)' · '$x + 3$' 처럼 닫는 괄호나 $ 로 끝나면, 그 앞의 마지막 글자를 읽은 소리를 따른다 */
    var s = String(word).replace(/[)\]}$ ]+$/, ''), c = s.charCodeAt(s.length - 1);
    if (c >= 0x30 && c <= 0x39) {
      if (c !== 0x30) return DIGIT_FINAL[c - 0x30];
      var zeros = s.length - s.replace(/0+$/, '').length;          /* 끝의 0 개수: 십(ㅂ) 백(ㄱ) 천 · 만(ㄴ) */
      return s.replace(/0+$/, '') === '' ? 'ㅇ' : zeros === 1 ? 'ㅂ' : zeros === 2 ? 'ㄱ' : 'ㄴ';
    }
    if (c >= 0xAC00 && c <= 0xD7A3) { var f = (c - 0xAC00) % 28; return f === 0 ? '' : f === 8 ? 'ㄹ' : 'ㅇ'; }
    return '';
  }
  MH.josa = function (word, pair) {
    var p = pair.split('/'), f = finalOf(word);
    /* '으로/로' 는 받침이 없거나 ㄹ 받침이면 '로' */
    var first = p[0] === '으로' ? (f !== '' && f !== 'ㄹ') : f !== '';
    return String(word) + (first ? p[0] : p[1]);
  };

  /* ── 도형 그림(figure 'geo')의 좌표를 정하는 도구 ──
     그리는 자리만 정한다. 화면 좌표는 소수로 계산해 정수로 반올림한다. 답 계산에는 쓰지 않는다.
     화면은 아래쪽이 +y 이고, 각도는 오른쪽(0°)에서 시계 반대 방향으로 잰다. */
  var RAD = Math.PI / 180;
  MH.geo = {
    /** 점 (x, y) 에서 deg 방향으로 r 만큼 간 점 */
    polar: function (x, y, r, deg) { return [Math.round(x + r * Math.cos(deg * RAD)), Math.round(y - r * Math.sin(deg * RAD))]; },
    /** 점 (x, y) 에서 deg 방향으로 가다가 위로 dy 만큼 올라간 곳의 점(dy 가 음수이면 내려간 곳) */
    reach: function (x, y, deg, dy) { return [Math.round(x + dy / Math.tan(deg * RAD)), Math.round(y - dy)]; },
    /** 밑변이 아래에 놓이고 두 밑각이 degA(왼쪽) · degB(오른쪽)인 삼각형을 상자 (x0, y0, w, h) 안에 맞춘다 → [A, B, C(위 꼭짓점)] */
    tri: function (degA, degB, x0, y0, w, h) {
      var cy = 1 / (1 / Math.tan(degA * RAD) + 1 / Math.tan(degB * RAD)), cx = cy / Math.tan(degA * RAD), lo = Math.min(0, cx), hi = Math.max(1, cx);
      var s = Math.min(w / (hi - lo), h / cy), ox = x0 + (w - s * (hi - lo)) / 2 - s * lo, oy = y0 + h - (h - s * cy) / 2;
      return [[Math.round(ox), Math.round(oy)], [Math.round(ox + s), Math.round(oy)], [Math.round(ox + s * cx), Math.round(oy - s * cy)]];
    }
  };
})();
