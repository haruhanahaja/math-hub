/* Math Hub 오프라인 지원. 서비스워커는 사이트에 이 파일 하나뿐이고 허브 · 영역별 앱을 모두 맡는다.
   앱 파일은 "네트워크 먼저, 안 되면 저장본" — 새로 올린 내용이 바로 보이고, 인터넷이 없어도 열린다.
   CACHE 이름 뒤의 버전과 SHELL 목록은 tools/build_sw.py 가 채운다(직접 고치지 않는다). */
const PREFIX = 'mathhub-';
const CACHE = PREFIX + 'e9bde5f44c';
const SHELL = ['./', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'manifest.webmanifest', 'shared/hub.js'];

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
