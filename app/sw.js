/* Service Worker — التطبيق يعمل أوفلاين بعد أول فتح */
const VERSION = 'noon-v11';
const SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/quran-data.js',
  './js/numbers.js',
  './js/glyphs.js',
  './js/glyph.js',
  './js/curriculum.js',
  './js/store.js',
  './js/pedagogy.js',
  './js/thinking.js',
  './js/syllabus.js',
  './js/sfx.js',
  './js/ui.js',
  './js/human.js',
  './js/audio.js',
  './js/audio3.js',
  './js/tracing.js',
  './js/lessons.js',
  './js/offline.js',
  './js/app.js',
  './fonts/baloo.woff2',
  './fonts/cairo.woff2',
  './fonts/naskh.woff2',
  './fonts/amiri.woff2',
  './fonts/quran.woff2',
  './fonts/emoji.woff2',
  './privacy.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
  './icons/apple-touch-icon.png'
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

  // أصوات الدروس: تخزين عند أول تشغيل لتعمل أوفلاين
  if (url.origin === location.origin && url.pathname.indexOf('/audio/') >= 0) {
    e.respondWith(
      caches.open('noon-words').then(c => c.match(req).then(hit => hit ||
        fetch(req).then(res => { if (res && res.ok) c.put(req, res.clone()); return res; })
      ))
    );
    return;
  }

  if (url.origin !== location.origin) return; // خطوط جوجل وغيرها: شبكة فقط

  // استراتيجية: نعرض المخزّن فوراً ونجدّده في الخلفية (stale-while-revalidate)
  // حتى يستلم المستخدمون أي تحديث تلقائياً دون انتظار إصدار جديد.
  e.respondWith(
    caches.match(req).then(hit => {
      const fresh = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit || caches.match('./index.html'));
      return hit || fresh;
    })
  );
});
