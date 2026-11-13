/* Math Hub 공용 조각 — 허브 화면과 영역별 앱이 함께 쓴다.
   - 테마: 모든 화면이 같은 테마(시스템/라이트/다크)를 쓰도록 한 곳에 저장한다.
   - 요약: 각 영역 앱이 "다음 학습 · 진도 · 오늘 푼 수 · 복습"을 남겨 두면 허브가 읽어서 보여 준다.
   - 오프라인: 서비스워커 등록. */
(function () {
  'use strict';
  var THEME_KEY = 'mathhub.theme', SUM_KEY = 'mathhub.sum.';
  var MODES = ['auto', 'light', 'dark'];
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } };

  var MH = {
    MODES: MODES,
    mode: function () { var m = get(THEME_KEY); return MODES.indexOf(m) >= 0 ? m : 'auto'; },
    dark: function () { var m = MH.mode(); return m === 'auto' ? !!(mq && mq.matches) : m === 'dark'; },
    setMode: function (m) { if (MODES.indexOf(m) >= 0) set(THEME_KEY, m); },
    /** <html data-theme="light|dark"> 를 맞춘다. */
    apply: function () {
      var dark = MH.dark();
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      var meta = document.querySelector('meta[name=theme-color]');
      if (meta) meta.content = dark ? '#0C111B' : '#F6F8FB';
    },
    onSystemChange: function (fn) { if (mq && mq.addEventListener) mq.addEventListener('change', fn); },
    /** 날짜 번호(그 지역 날짜 기준). 하루가 지나면 1 커진다. */
    dnum: function (d) { d = d || new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); },
    /** 영역 앱이 허브에 보여 줄 요약을 남긴다:
        { next: '다음 학습 한 줄', done: 통과한 단원 수, total: 전체 단원 수,
          days: { 날짜번호: 그날 푼 문제 수 }, due: 오늘 복습할 문제 수 } */
    summary: function (area, data) { set(SUM_KEY + area, JSON.stringify(data)); },
    readSummary: function (area) { try { return JSON.parse(get(SUM_KEY + area)) || {}; } catch (e) { return {}; } }
  };
  window.MH = MH;

  /* 오프라인 지원 (https 또는 localhost 에서만). 서비스워커는 사이트 맨 위 폴더에 하나만 있다. */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    var root = (document.currentScript && document.currentScript.dataset.root) || './';
    addEventListener('load', function () { navigator.serviceWorker.register(root + 'sw.js', { scope: root }).catch(function () {}); });
  }
})();
