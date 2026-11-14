/* ============ الأصوات: تسجيل بشري أولاً، ومؤقت فقط عند الغياب ============
   التسجيلات من Wikimedia Commons (Lingua Libre) — مرخّصة CC BY-SA 4.0.
   الملف: audio/manifest.json + audio/CREDITS.md (إسناد إلزامي).
*/
(function () {
  'use strict';
  const BASE = 'audio/';
  const A3 = {
    manifest: {}, ready: false, failed: false,
    el: null,
    badge: { human: 0, tts: 0 },

    key(word, lang) { return lang + ':' + word; },

    has(word, lang) {
      const it = this.manifest[this.key(word, lang)];
      return !!(it && it.file);
    },

    load() {
      if (this._p) return this._p;
      this._p = fetch(BASE + 'manifest.json', { cache: 'force-cache' })
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
      Audio2.stop();
    },

    /** يشغّل تسجيلاً بشرياً إن وُجد، وإلا يعود للصوت المؤقت */
    sayWord(word, lang, opts) {
      opts = opts || {};
      const it = this.manifest[this.key(word, lang)];
      if (it && it.file) {
        this.badge.human++;
        return this._play(BASE + it.file, opts.rate);
      }
      this.badge.tts++;
      window.__audioFallback = true;
      return Audio2.say(word, lang === 'en' ? 'en-US' : 'ar-SA', opts.rate || 0.8);
    },

    _play(src, rate) {
      return new Promise(function (resolve) {
        try {
          if (A3.el) { A3.el.pause(); }
          const a = new Audio(src);
          A3.el = a;
          a.preload = 'auto';
          if (rate && rate !== 1) a.playbackRate = Math.max(0.6, Math.min(1.2, rate));
          a.onended = resolve;
          a.onerror = function () { resolve(); };
          const p = a.play();
          if (p && p.catch) p.catch(function () {
            // لم يُسمح بالتشغيل التلقائي: نكمل بلا صوت بدل التعليق
            resolve();
          });
          setTimeout(resolve, 4000);
        } catch (e) { resolve(); }
      });
    },

    /** تشغيل كلمة ثم كلمة تالية بترتيب (للتسلسل الصوتي) */
    seq(words, lang) {
      let i = 0;
      const next = () => {
        if (i >= words.length) return Promise.resolve();
        return A3.sayWord(words[i++], lang).then(function () {
          return new Promise(function (r) { setTimeout(r, 250); }).then(next);
        });
      };
      return next();
    },

    /** ملخص للوحة ولي الأمر */
    coverage() {
      const total = Object.keys(this.manifest).length;
      return { human: total, used: this.badge };
    }
  };

  window.A3 = A3;
  A3.load();
})();
