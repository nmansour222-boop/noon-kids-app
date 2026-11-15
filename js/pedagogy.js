/* ============ محرّك التعلّم: إتقان + مراجعة متباعدة + مزج ============
   مبني على مبادئ مثبتة في تعليم الطفولة المبكرة:
   - التعلّم للإتقان (Mastery Learning): لا ننتقل قبل ٢ إجابة صحيحة متتالية.
   - التكرار المتباعد (Spaced Repetition): مراجعة بعد ١ / ٣ / ٧ / ١٤ / ٣٠ يوم.
   - المزج والتشابك (Interleaving): مراجعة مختلطة بدل التكرار الكتلي.
   - التعلّم بلا خطأ (Errorless): نسهّل قبل أن نصحّح، بلا لوم.
   - الحمل المعرفي (Cognitive Load): ٣ بدائل كحد أقصى في عمر ٤–٥.
*/
(function () {
  'use strict';
  const DAY = 86400000;
  const INTERVALS = [1, 3, 7, 14, 30];   // أيام
  const MASTERY_STREAK = 2;

  function now() { return Date.now(); }
  function itemsOf() { return Store.get().items || {}; }

  /* ---------- سجلّ الإتقان ---------- */
  const Mastery = {
    /** 0..1 — نسبة الإتقان الحالية لعنصر */
    score(track, id) {
      const it = Store.item(track, id);
      if (!it || !it.seen) return 0;
      return Math.max(0, (it.ok - it.bad * 0.5)) / Math.max(1, it.seen);
    },
    isMastered(track, id) {
      const it = Store.item(track, id);
      if (!it) return false;
      return it.streak >= MASTERY_STREAK || (it.ok >= 2 && it.ok >= it.bad * 2);
    },
    /** تسجيل إجابة مع تحديث السلسلة وموعد المراجعة */
    answer(track, id, ok) {
      const st = Store.get();
      const k = track + ':' + id;
      if (!st.items[k]) st.items[k] = { seen: 0, ok: 0, bad: 0, streak: 0, due: 0, lvl: 0 };
      const it = st.items[k];
      it.seen++;
      if (ok) {
        it.ok++;
        it.streak = (it.streak || 0) + 1;
        if (it.streak >= MASTERY_STREAK) {
          it.lvl = Math.min(INTERVALS.length - 1, (it.lvl || 0) + 1);
          it.due = now() + INTERVALS[it.lvl] * DAY;
        } else {
          it.due = now() + DAY;
        }
      } else {
        it.bad++;
        it.streak = 0;
        it.lvl = Math.max(0, (it.lvl || 0) - 1);
        it.due = now() + 0.5 * DAY;   // نراجعها قريباً
      }
      Store.save();
      return it;
    },
    masteredCount(track) {
      const st = Store.get();
      let n = 0;
      Object.keys(st.items).forEach(function (k) {
        if (k.indexOf(track + ':') === 0 && Mastery.isMastered(track, k.slice(track.length + 1))) n++;
      });
      return n;
    }
  };

  /* ---------- المراجعة المتباعدة ---------- */
  const Review = {
    /** العناصر المستحقة الآن في مسار، الأضعف أولاً (٣ كحد أقصى للأطفال) */
    due(track, limit) {
      const st = Store.get();
      const out = [];
      Object.keys(st.items).forEach(function (k) {
        if (k.indexOf(track + ':') !== 0) return;
        const id = k.slice(track.length + 1);
        const it = st.items[k];
        if (!it || !it.seen) return;
        if ((it.due || 0) <= now()) out.push({ track: track, id: id, score: Mastery.score(track, id) });
      });
      out.sort(function (a, b) { return a.score - b.score; });
      return limit ? out.slice(0, limit) : out;
    },
    hasDue(track) { return this.due(track).length > 0; }
  };

  /* ---------- اختيار عناصر المراجعة المختلطة ---------- */
  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }

  const Pedagogy = {
    Mastery: Mastery,
    Review: Review,
    INTERVALS: INTERVALS,

    /** إجابات صحيحة مطلوبة للإتقان */
    MASTERY_STREAK: MASTERY_STREAK,

    /** حروف عربية سبق تقديمها، الأضعف أولاً */
    reviewLetters(n) {
      const taught = Store.taughtLetters();
      return shuffle(taught.map(function (l) {
        return { letter: l, score: Mastery.score('ar', l.id) };
      }).sort(function (a, b) { return a.score - b.score; }).slice(0, Math.max(n, 4)).map(function (x) { return x.letter; })
      ).slice(0, n);
    },

    /** أصوات إنجليزية سبق تقديمها */
    reviewSounds(n) {
      const taught = Store.taughtSounds();
      return shuffle(taught.map(function (s) {
        return { sound: s, score: Mastery.score('en', String(s.idx)) };
      }).sort(function (a, b) { return a.score - b.score; }).slice(0, Math.max(n, 4)).map(function (x) { return x.sound; })
      ).slice(0, n);
    },

    /** كلمات CVC قابلة للتركيب من الأصوات المدرّسة فقط */
    blendableWords(n) {
      const known = {};
      Store.taughtSounds().forEach(function (s) { String(s.s).split(' ').forEach(function (x) { known[x] = 1; }); });
      const out = [];
      (window.CURRICULUM.cvc || []).forEach(function (c) {
        const w = c.w;
        let ok = true, i = 0;
        while (i < w.length) {
          const two = w.slice(i, i + 2);
          if (known[two]) { i += 2; continue; }
          if (known[w[i]]) { i += 1; continue; }
          ok = false; break;
        }
        if (ok) out.push(c);
      });
      return shuffle(out).slice(0, n);
    },

    /** هل نستطيع تدريس التركيب الآن؟ (٣ أصوات مدرّسة على الأقل) */
    canBlend() { return Store.taughtSounds().length >= 3; },

    /* ---- تقييم تكيّفي: صعوبة البدائل ---- */
    distractorCount() {
      const streak = Store.get().streak || 1;
      return streak > 5 ? 3 : 2;   // زيادة تدريجية بلا إرباك
    }
  };

  window.Pedagogy = Pedagogy;
})();
