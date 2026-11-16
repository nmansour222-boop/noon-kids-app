/* تنزيل تلاوة المنهج للاستخدام بدون إنترنت — يخزّن كل آية في Cache Storage
   بنفس ذاكرة الـ Service Worker (noon-audio) فيعمل التشغيل أوفلاين بلا شبكة. */
(function () {
  const CACHE = 'noon-audio';
  const CONC = 4;
  const EST_MB = 53; // تقدير: ١٠٠٢ آية × ٥٤ ك.ب بمعدل 64kbps

  function urls() {
    const out = [];
    (window.QURAN || []).forEach(function (s) {
      s.ayahs.forEach(function (a) { if (a.audio) out.push(a.audio); });
    });
    return out;
  }

  function supported() {
    return typeof caches !== 'undefined' && typeof fetch === 'function';
  }

  async function status() {
    const list = urls();
    if (!supported()) return { total: list.length, cached: 0, failed: 0, ok: false };
    const c = await caches.open(CACHE);
    const keys = await c.keys();
    const have = new Set(keys.map(function (r) { return r.url; }));
    let n = 0;
    list.forEach(function (u) { if (have.has(u)) n++; });
    return { total: list.length, cached: n, ok: true, estMb: EST_MB };
  }

  /** يحمّل كل الآيات: onProgress({done,total,failed}) — يُرجِع ملخصًا */
  async function start(onProgress) {
    const list = urls();
    if (!supported()) return { done: 0, total: list.length, failed: list.length };
    const c = await caches.open(CACHE);
    let done = 0, failed = 0, i = 0;

    async function worker() {
      while (i < list.length) {
        const u = list[i++];
        try {
          const hit = await c.match(u, { ignoreVary: true });
          if (!hit) {
            const res = await fetch(u, { mode: 'no-cors', cache: 'force-cache' });
            if (res) await c.put(u, res);
          }
        } catch (e) { failed++; }
        done++;
        if (onProgress) onProgress({ done: done, total: list.length, failed: failed });
      }
    }

    await Promise.all(Array.from({ length: CONC }, worker));
    return { done: done, total: list.length, failed: failed };
  }

  async function clear() {
    if (!supported()) return 0;
    const c = await caches.open(CACHE);
    const list = urls();
    let n = 0;
    for (const u of list) { if (await c.delete(u)) n++; }
    return n;
  }

  window.Offline = { urls: urls, status: status, start: start, clear: clear, EST_MB: EST_MB, supported: supported };
})();
