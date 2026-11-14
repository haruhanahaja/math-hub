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

  /** 자연수의 자릿수 목록. 일의 자리가 맨 앞: digits(347) → [7, 4, 3] */
  MH.digits = function (n) {
    var out = [];
    do { out.push(n % 10); n = (n - n % 10) / 10; } while (n > 0);
    return out;
  };
  /** 자리 이름: 0 → 일, 1 → 십, 2 → 백 … */
  MH.place = function (i) { return ['일', '십', '백', '천', '만'][i]; };

  /* 한국어 조사. josa(347, '을/를') → '347을', josa('사과', '을/를') → '사과를'
     숫자는 읽었을 때 마지막 소리의 받침으로 정한다(0 → 십·백·천…, 1 → 일, 3 → 삼 …). */
  var DIGIT_FINAL = { 0: 'ㅂ', 1: 'ㄹ', 2: '', 3: 'ㅁ', 4: '', 5: '', 6: 'ㄱ', 7: 'ㄹ', 8: 'ㄹ', 9: '' };
  function finalOf(word) {
    var s = String(word), c = s.charCodeAt(s.length - 1);
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
})();
