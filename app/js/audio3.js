/* ============ الأصوات: تسجيل بشري أولاً، ومؤقت فقط عند الغياب ============
   التسجيلات البشرية: Shtooka Project + Lingua Libre عبر ويكيميديا كومنز.
   الملف: audio/manifest.json + audio/CREDITS.md (إسناد إلزامي).
*/
(function () {
  'use strict';
  const A3 = {
    manifest: {}, ready: false, failed: false,
    el: null, lastSrc: '',
    badge: { human: 0, tts: 0, miss: 0 },

    key(word, lang) { return lang + ':' + word; },

    has(word, lang) {
      const it = this.manifest[this.key(word, lang)];
      return !!(it && it.file);
    },

    /** مسار الملف كما هو في الـmanifest ('audio/ar/x.m4a') — بلا أي بادئة إضافية */
    src(word, lang) {
      const it = this.manifest[this.key(word, lang)];
      return it && it.file ? it.file : '';
    },

    load() {
      if (this._p) return this._p;
      this._p = fetch('audio/manifest.json', { cache: 'force-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          A3.manifest = (j && j.items) || {};
          A3.ready = true;
          return A3.manifest;
        })
        .catch(function () { A3.failed = true; A3.ready = true; return {}; });
      return this._p;
    },

    stop() {
      if (this.el) { try { this.el.pause(); this.el.currentTime = 0; } catch (e) {} }
      if (window.Audio2) window.Audio2.stop();
    },

    /** يشغّل تسجيلاً بشرياً إن وُجد، وإلا يعود للصوت المؤقت */
    sayWord(word, lang, opts) {
      const self = this;
      opts = opts || {};
      if (!this.ready) {
        return this.load().then(function () { return self.sayWord(word, lang, opts); });
      }
      const file = this.src(word, lang);
      if (file) {
        this.badge.human++;
        return this._play(file, opts.rate);
      }
      this.badge.tts++;
      window.__audioFallback = true;
      return window.Audio2
        ? window.Audio2.say(word, lang === 'en' ? 'en-US' : 'ar-SA', opts.rate || 0.85)
        : Promise.resolve();
    },

    _play(src, rate) {
      const self = this;
      return new Promise(function (resolve) {
        let done = false;
        const finish = function (ok) { if (!done) { done = true; resolve(ok); } };
        try {
          if (self.el) { try { self.el.pause(); } catch (e) {} }
          const a = new Audio();
          a.preload = 'auto';
          a.src = src;
          self.el = a; self.lastSrc = src;
          if (rate && rate !== 1) a.playbackRate = Math.max(0.65, Math.min(1.15, rate));
          a.onended = function () { finish(true); };
          a.onerror = function () {
            // ملف تالف/غير موجود: مرة واحدة نتراجع للصوت المؤقت بدل الصمت
            self.badge.miss++;
            const lang = /\/en\//.test(src) ? 'en' : 'ar';
            const word = decodeURIComponent((src.split('/').pop() || '').replace(/\.m4a$/, ''));
            if (window.Audio2) window.Audio2.say(word, lang === 'en' ? 'en-US' : 'ar-SA', rate || 0.85).then(finish);
            else finish(false);
          };
          const p = a.play();
          if (p && p.catch) p.catch(function () { finish(false); });
          // حدّ أمان: لا نعلّق الدرس أكثر من ٦ ثوانٍ
          setTimeout(function () { finish(true); }, 6000);
        } catch (e) { finish(false); }
      });
    },

    /** فتح قناة الصوت بلمسة الطفل الأولى (شرط iOS قبل أي تشغيل لاحق) */
    unlock() {
      const self = this;
      return this.load().then(function () {
        if (self._unlocked) return;
        const first = Object.keys(self.manifest)[0];
        const f = first && self.manifest[first].file;
        if (!f) return;
        try {
          const a = new Audio(f);
          a.volume = 0;
          const p = a.play();
          if (p && p.then) p.then(function () { self._unlocked = true; a.pause(); }).catch(function () {});
          else self._unlocked = true;
        } catch (e) {}
      });
    },

    /** تحميل مسبق (يقلّل التأخير بين الكلمات) */
    prime(words, lang) {
      const self = this;
      return this.load().then(function () {
        (words || []).forEach(function (w) {
          const f = self.src(w, lang);
          if (f) { const a = new Audio(); a.preload = 'auto'; a.src = f; }
        });
      });
    },

    /** تشغيل كلمة ثم كلمة تالية بترتيب */
    seq(words, lang) {
      const self = this;
      let i = 0;
      const next = function () {
        if (i >= words.length) return Promise.resolve();
        return self.sayWord(words[i++], lang).then(function () {
          return new Promise(function (r) { setTimeout(r, 220); }).then(next);
        });
      };
      return next();
    },

    coverage() {
      const total = Object.keys(this.manifest).length;
      return { human: total, used: this.badge, missed: this.badge.miss };
    }
  };

  window.A3 = A3;
  A3.load();
})();
