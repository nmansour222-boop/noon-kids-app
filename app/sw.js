/* Service Worker — التطبيق يعمل أوفلاين بعد أول فتح */
const VERSION = 'noon-v2';
const SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/quran-data.js',
  './js/curriculum.js',
  './js/store.js',
  './js/audio.js',
  './js/tracing.js',
  './js/games.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // تلاوة القرآن: تخزين عند الطلب ليعمل أوفلاين لاحقاً
  if (url.hostname === 'cdn.islamic.network') {
    e.respondWith(
      caches.open('noon-audio').then(c =>
        c.match(req, { ignoreVary: true }).then(hit =>
          hit || fetch(req).then(res => {
            // ردود الـ CDN بلا CORS → نوعها opaque و ok=false، لكن يمكن تخزينها
            if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
            return res;
          }).catch(() => hit)
        )
      )
    );
    return;
  }

  if (url.origin !== location.origin) return; // خطوط جوجل وغيرها: شبكة فقط

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
