/* ============ الحالة والتقدّم: تكرار متباعد + مكافآت ============ */
(function () {
  'use strict';
  const KEY = 'noon_app_state_v1';
  const INTERVALS = [1, 3, 7, 14, 30]; // أيام حسب قوة العنصر (0..4)

  const DEFAULT = {
    childName: '',
    stars: 0,
    streak: 0,
    lastDay: null,
    days: {},              // '2025-01-01' -> seconds
    items: {},             // 'ar:seen' -> {lv, due, seen, ok, bad, last}
    surahs: {},            // 112 -> {done:true, at:ts, ayahsDone:n}
    sessions: 0,
    seconds: 0,
    settings: { tts: true, limitMin: 20, pin: '1234', showEnglish: true },
    friends: [],
    puzzle: 0,
    history: []            // [{at, track, item}]
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      const s = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), JSON.parse(raw));
      s.settings = Object.assign({}, DEFAULT.settings, s.settings || {});
      return s;
    } catch (e) { return JSON.parse(JSON.stringify(DEFAULT)); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dayDiff(a, b) {
    const da = new Date(a + 'T00:00:00'), db = new Date(b + 'T00:00:00');
    return Math.round((db - da) / 86400000);
  }

  const Store = {
    get() { return state; },
    save,

    /* ---- جلسة اليوم والستريك ---- */
    touchToday() {
      const t = today();
      if (state.lastDay !== t) {
        if (state.lastDay && dayDiff(state.lastDay, t) === 1) state.streak += 1;
        else if (state.lastDay && dayDiff(state.lastDay, t) > 1) state.streak = 1; // ما بتنكسرش للصفر
        else if (!state.lastDay) state.streak = 1;
        state.lastDay = t;
        save();
      }
      return state.streak;
    },
    secondsToday() { return state.days[today()] || 0; },
    addSeconds(n) {
      const t = today();
      state.days[t] = (state.days[t] || 0) + n;
      state.seconds += n;
      save();
    },
    limitReached() {
      if (!state.settings.limitMin) return false;
      return this.secondsToday() >= state.settings.limitMin * 60;
    },

    /* ---- عناصر التعلم ---- */
    keyOf(track, id) { return track + ':' + id; },
    item(track, id) {
      const k = this.keyOf(track, id);
      if (!state.items[k]) state.items[k] = { lv: 0, due: null, seen: 0, ok: 0, bad: 0, last: null };
      return state.items[k];
    },
    strength(track, id) { return this.item(track, id).lv; },
    mastered(track, id) { return this.item(track, id).lv >= 3; },

    /** تسجيل محاولة: النجاح يرفع المستوى، والخطأ ينزل بحد أدنى 1 */
    mark(track, id, ok) {
      const it = this.item(track, id);
      const t = today();
      it.seen += 1;
      it.last = Date.now();
      if (ok) {
        it.ok += 1;
        it.lv = Math.min(4, it.lv + 1);
      } else {
        it.bad += 1;
        it.lv = Math.max(1, it.lv - 1);
      }
      const days = INTERVALS[Math.min(it.lv, INTERVALS.length - 1)];
      const d = new Date(); d.setDate(d.getDate() + days);
      it.due = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      save();
      return it;
    },

    /** العناصر المستحقة للمراجعة (أو التي لم تُدرس) */
    due(track, list) {
      const t = today();
      return list.filter(x => {
        const it = state.items[this.keyOf(track, x.id)];
        if (!it) return true;              // جديد
        if (!it.due) return true;
        return it.due <= t;
      });
    },

    /* ---- اختيار درس اليوم ---- */
    nextLetter() {
      const L = window.CURRICULUM.letters;
      for (const l of L) if (!this.mastered('ar', l.id)) return l;
      return L[state.sessions % L.length]; // كله متقن → مراجعة دورية
    },
    nextSound() {
      const S = window.CURRICULUM.sounds;
      for (let i = 0; i < S.length; i++) if (!this.mastered('en', 's' + i)) return Object.assign({ idx: i, id: 's' + i }, S[i]);
      return Object.assign({ idx: 0, id: 's0' }, S[state.sessions % S.length]);
    },
    letterProgress() {
      const L = window.CURRICULUM.letters;
      return L.filter(l => this.mastered('ar', l.id)).length / L.length;
    },
    soundProgress() {
      const S = window.CURRICULUM.sounds;
      let n = 0; S.forEach((_, i) => { if (this.mastered('en', 's' + i)) n++; });
      return n / S.length;
    },
    quranProgress() {
      const total = window.QURAN ? window.QURAN.length : 49;
      return Object.keys(state.surahs).filter(k => state.surahs[k].done).length / total;
    },

    /* ---- القرآن ---- */
    surahDone(n) { return !!(state.surahs[n] && state.surahs[n].done); },
    markSurah(n, ayahsDone, totalAyahs) {
      if (!state.surahs[n]) state.surahs[n] = { done: false, ayahsDone: 0 };
      state.surahs[n].ayahsDone = Math.max(state.surahs[n].ayahsDone || 0, ayahsDone);
      if (totalAyahs && state.surahs[n].ayahsDone >= totalAyahs) {
        state.surahs[n].done = true;
        state.surahs[n].at = Date.now();
      }
      save();
      return state.surahs[n].done;
    },
    nextSurah() {
      const st = window.CURRICULUM.stations;
      for (const s of st) for (const n of s.surahs) if (!this.surahDone(n)) return n;
      return 1;
    },

    /* ---- مكافآت ---- */
    addStars(n) { state.stars += n; save(); return state.stars; },
    addPuzzle() { state.puzzle = (state.puzzle + 1) % 6; save(); return state.puzzle; },
    addFriend(f) { if (f && state.friends.indexOf(f) < 0) { state.friends.push(f); save(); } },

    /* ---- سجل ---- */
    logSession(track, label) {
      state.sessions += 1;
      state.history.unshift({ at: Date.now(), track, label });
      state.history = state.history.slice(0, 60);
      save();
    },

    reset() {
      state = JSON.parse(JSON.stringify(DEFAULT));
      save();
    }
  };

  window.Store = Store;
})();
