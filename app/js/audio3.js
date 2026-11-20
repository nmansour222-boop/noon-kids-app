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

    // 'ar-SA' و'en-US' تُختزل إلى 'ar' و'en' حتى تلاقي تسجيلاتها
    key(word, lang) { return String(lang || '').toLowerCase().split('-')[0] + ':' + word; },

    /** المدخل: تسجيل الكلمة نفسها، وإلا المقطع المولَّد (#كلمة) */
    entry(word, lang) {
      return this.manifest[this.key(word, lang)] || this.manifest[this.key('#' + word, lang)] || null;
    },

    has(word, lang) {
      const it = this.entry(word, lang);
      return !!(it && it.file);
    },

    /** مسار الملف كما هو في الـmanifest ('audio/ar/x.m4a') — بلا أي بادئة إضافية */
    src(word, lang) {
      const it = this.entry(word, lang);
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
      this._halt();
      if (this.el) { try { this.el.currentTime = 0; } catch (e) {} }
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
        return this._play(file, opts.rate, word, lang);
      }
      this.badge.tts++;
      window.__audioFallback = true;
      return window.Audio2
        ? window.Audio2.say(word, lang === 'en' ? 'en-US' : 'ar-SA', opts.rate || 0.85)
        : Promise.resolve();
    },

    /** يوقف المقطع الجاري فوراً ويُنهي وعده بقيمة 'x' (= أُلغي) حتى لا تكمل السلاسل القديمة فوق الصوت الجديد */
    _halt() {
      if (this.el) { try { this.el.pause(); } catch (e) {} }
      const f = this._fin; this._fin = null;
      if (f) f('x');
    },

    _play(src, rate, word0, lang0) {
      const self = this;
      if (window.VoiceGate) window.VoiceGate.claim('a3');
      self._halt();
      return new Promise(function (resolve) {
        let done = false, safety = null;
        const finish = function (ok) {
          if (done) return;
          done = true; clearTimeout(safety);
          if (self._fin === finish) self._fin = null;
          resolve(ok);
        };
        self._fin = finish;
        try {
          const a = new Audio();
          a.preload = 'auto';
          a.src = src;
          self.el = a; self.lastSrc = src;
          if (rate && rate !== 1) a.playbackRate = Math.max(0.65, Math.min(1.15, rate));
          a.onended = function () { finish(true); };
          a.onloadedmetadata = function () {
            clearTimeout(safety);
            const d = isFinite(a.duration) ? a.duration / (a.playbackRate || 1) : 8;
            safety = setTimeout(function () { finish(true); }, Math.min(14000, d * 1000 + 1500));
          };
          a.onerror = function () {
            // ملف تالف/غير موجود: مرة واحدة نتراجع للصوت المؤقت بدل الصمت (بنص الكلمة نفسها لا باسم الملف)
            self.badge.miss++;
            const w = String(word0 || '');
            if (!w || w.charAt(0) === '@') { finish(false); return; }   // مقاطع أسماء/أصوات الحروف: لا نحوّلها لنطق آلي
            if (self._fin === finish) self._fin = null;
            if (window.Audio2) window.Audio2.say(w.replace(/^#/, ''), lang0 === 'en' ? 'en-US' : 'ar-SA', rate || 0.85).then(finish);
            else finish(false);
          };
          const p = a.play();
          if (p && p.catch) p.catch(function () { finish(false); });
          // حدّ أمان لو ended ما جاش: ١٢ ثانية كحد أقصى لحد ما نعرف المدة الفعلية
          safety = setTimeout(function () { finish(true); }, 12000);
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
          a.volume = 0; a.muted = true;
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
        return self.sayWord(words[i++], lang).then(function (r) {
          if (r === 'x') return;
          return new Promise(function (r2) { setTimeout(r2, 220); }).then(next);
        });
      };
      return next();
    },

    coverage() {
      const keys = Object.keys(this.manifest);
      const words = keys.filter(function (k) { return !/^(ar|en):[#@]/.test(k); }).length;
      const letters = keys.filter(function (k) { return /^ar:@/.test(k); }).length;
      const gen = keys.filter(function (k) { return /^(ar|en):#/.test(k); }).length;
      return { human: words, words: words, letters: letters, generated: gen, total: keys.length, used: this.badge, missed: this.badge.miss };
    }
  };

  if (window.VoiceGate) window.VoiceGate.reg('a3', function () { A3._halt(); });
  window.A3 = A3;
  A3.load();
})();
