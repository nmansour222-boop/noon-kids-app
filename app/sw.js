/* Service Worker — التطبيق يعمل أوفلاين بعد أول فتح */
const VERSION = 'noon-v20';
/* كاشات لا تُمسح عند تحديث الإصدار: التلاوة المنزّلة (~53 ميجا) وأصوات الكلمات */
const KEEP = [VERSION, 'noon-audio', 'noon-words'];
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
  e.waitUntil((async () => {
    try { const c = await caches.open(VERSION); await c.addAll(SHELL); } catch (err) {}
    // تخزين مسبق لتسجيلات الكلمات البشرية (~١ ميجا) حتى تكون الدروس مسموعة أوفلاين من أول مرة
    try {
      const r = await fetch('audio/manifest.json', { cache: 'no-cache' });
      const copy = r.clone();
      const j = await r.json();
      const words = await caches.open('noon-words');
      await words.put('audio/manifest.json', copy);
      const files = Object.keys(j.items || {}).map(k => j.items[k].file).filter(Boolean);
      for (let i = 0; i < files.length; i += 8) {
        await Promise.all(files.slice(i, i + 8).map(f =>
          fetch(f).then(res => { if (res && res.ok) return words.put(f, res); }).catch(() => {})
        ));
      }
    } catch (err) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => KEEP.indexOf(k) < 0).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* سفاري يشترط ردّ 206 على طلبات Range للصوت — نقتطع الجزء المطلوب من الملف المخزّن */
function rangeResponse(req, res) {
  const range = req.headers.get('range');
  if (!range || !res || res.status !== 200) return Promise.resolve(res);
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return Promise.resolve(res);
  return res.arrayBuffer().then(buf => {
    const size = buf.byteLength;
    const start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
    const end = (m[1] === '' || m[2] === '') ? size - 1 : Math.min(Number(m[2]), size - 1);
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    }
    return new Response(buf.slice(start, end + 1), {
      status: 206, statusText: 'Partial Content',
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'audio/mp4',
        'Content-Length': String(end - start + 1),
        'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
        'Accept-Ranges': 'bytes'
      }
    });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // تلاوة القرآن: تخزين عند الطلب ليعمل أوفلاين لاحقاً
  if (url.hostname === 'cdn.islamic.network') {
    e.respondWith(
      caches.open('noon-audio').then(c =>
        c.match(req.url, { ignoreVary: true }).then(hit =>
          hit || fetch(req).then(res => {
            // ردود الـ CDN بلا CORS → نوعها opaque و ok=false، لكن يمكن تخزينها
            if (res && (res.ok || res.type === 'opaque')) c.put(req.url, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  // أصوات الدروس: مخزّنة مسبقاً عند التثبيت، وتُكمَّل عند الطلب
  if (url.origin === location.origin && url.pathname.indexOf('/audio/') >= 0) {
    e.respondWith((async () => {
      const c = await caches.open('noon-words');
      let hit = await c.match(req.url);
      if (!hit) {
        try {
          const full = await fetch(req.url);          // الملف كاملاً (بدون Range) ليُخزَّن كاملاً
          if (!full || !full.ok) return full;
          c.put(req.url, full.clone());
          hit = full;
        } catch (err) { return Response.error(); }
      }
      return rangeResponse(req, hit);
    })());
    return;
  }

  if (url.origin !== location.origin) return; // خطوط جوجل وغيرها: شبكة فقط

  // استراتيجية: نعرض المخزّن فوراً ونجدّده في الخلفية (stale-while-revalidate)
  // حتى يستلم المستخدمون أي تحديث تلقائياً دون انتظار إصدار جديد.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
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
