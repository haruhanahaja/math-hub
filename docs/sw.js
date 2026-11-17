/* Math Hub 오프라인 지원. 서비스워커는 사이트에 이 파일 하나뿐이고 허브 · 영역별 앱을 모두 맡는다.
   앱 파일은 "네트워크 먼저, 안 되면 저장본" — 새로 올린 내용이 바로 보이고, 인터넷이 없어도 열린다.
   CACHE 이름 뒤의 버전과 SHELL 목록은 tools/build_sw.py 가 채운다(직접 고치지 않는다). */
const PREFIX = 'mathhub-';
const CACHE = PREFIX + '10993f1146';
const SHELL = ['./', 'basic/', 'basic/units/a01.js', 'basic/units/a02.js', 'basic/units/a03.js', 'basic/units/a04.js', 'basic/units/a05.js', 'basic/units/a06.js', 'basic/units/a07.js', 'basic/units/a08.js', 'basic/units/a09.js', 'basic/units/a10.js', 'basic/units/a11.js', 'basic/units/a12.js', 'basic/units/a13.js', 'basic/units/a14.js', 'basic/units/a15.js', 'basic/units/a16.js', 'basic/units/a17.js', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'manifest.webmanifest', 'middle/', 'middle/units/b01.js', 'middle/units/b02.js', 'middle/units/b03.js', 'middle/units/b04.js', 'middle/units/b05.js', 'middle/units/b06.js', 'middle/units/b07.js', 'middle/units/b08.js', 'middle/units/b09.js', 'middle/units/b10.js', 'shared/app.css', 'shared/engine/algebra.js', 'shared/engine/answer.js', 'shared/engine/num.js', 'shared/engine/progress.js', 'shared/engine/rng.js', 'shared/engine/scratch.js', 'shared/engine/types.js', 'shared/engine/ui.js', 'shared/hub.js', 'shared/map.js', 'shared/vendor/fraction/LICENSE', 'shared/vendor/fraction/fraction.min.js', 'shared/vendor/katex/fonts/KaTeX_AMS-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2', 'shared/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2', 'shared/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Main-Bold.woff2', 'shared/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2', 'shared/vendor/katex/fonts/KaTeX_Main-Italic.woff2', 'shared/vendor/katex/fonts/KaTeX_Main-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2', 'shared/vendor/katex/fonts/KaTeX_Math-Italic.woff2', 'shared/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2', 'shared/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2', 'shared/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Script-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Size1-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Size2-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Size3-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Size4-Regular.woff2', 'shared/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2', 'shared/vendor/katex/katex.min.css', 'shared/vendor/katex/katex.min.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  /* 같은 주소(…github.io) 아래 다른 앱의 저장본은 건드리지 않고, 이 앱의 옛 저장본만 지운다. */
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  const put = (res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  };
  /* 'no-cache': 브라우저에 남은 옛 파일을 쓰지 않고 서버에 바뀌었는지 물어본다 → 새로 올린 내용이 다음에 열 때 바로 보인다. */
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(put).catch(() => caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? c.match('./') : undefined)))));
});
