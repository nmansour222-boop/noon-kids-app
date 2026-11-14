/* ============ حالة التطبيق: تقدّم خطّي + مكافآت + إعدادات ============ */
(function () {
  'use strict';
  const KEY = 'noon_state_v2';

  const DEFAULT = {
    childName: '',
    stars: 0,
    streak: 0,
    lastDay: null,
    days: {},
    lessons: {},        // lessonId -> timestamp
    items: {},          // 'ar:ba' -> {seen, ok, bad}
    surahs: {},         // surahNumber -> {ayahsDone, done}
    sessions: 0,
    seconds: 0,
    settings: { tts: false, limitMin: 20, pin: '1234' },
    history: []
  };

  let state = load();

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT);
      const s = Object.assign(clone(DEFAULT), JSON.parse(raw));
      s.settings = Object.assign({}, DEFAULT.settings, s.settings || {});
      return s;
    } catch (e) { return clone(DEFAULT); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dayDiff(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }

  const Store = {
    get() { return state; },
    save,
    today,

    touchToday() {
      const t = today();
      if (state.lastDay !== t) {
        if (!state.lastDay) state.streak = 1;
        else if (dayDiff(state.lastDay, t) === 1) state.streak += 1;
        else state.streak = 1;
        state.lastDay = t;
        save();
      }
      return state.streak;
    },
    secondsToday() { return state.days[today()] || 0; },
    addSeconds(n) { state.days[today()] = (state.days[today()] || 0) + n; state.seconds += n; save(); },
    limitReached() {
      const lim = state.settings.limitMin;
      return !!lim && this.secondsToday() >= lim * 60;
    },

    lessonDone(id) { return !!state.lessons[id]; },
    markLesson(id) {
      if (!state.lessons[id]) { state.lessons[id] = Date.now(); save(); }
    },
    doneCount(track) {
      const list = window.SYLLABUS.forTrack(track);
      let n = 0;
      list.forEach(function (l) { if (state.lessons[l.id]) n++; });
      return n;
    },
    trackTotal(track) { return window.SYLLABUS.forTrack(track).length; },
    trackProgress(track) { return this.doneCount(track) / Math.max(1, this.trackTotal(track)); },
    currentLesson(track) {
      const list = window.SYLLABUS.forTrack(track);
      for (let i = 0; i < list.length; i++) if (!state.lessons[list[i].id]) return list[i];
      return list[list.length - 1] || null;
    },
    isUnlocked(track, lessonId) {
      const list = window.SYLLABUS.forTrack(track);
      const idx = list.findIndex(function (l) { return l.id === lessonId; });
      if (idx < 0) return false;
      if (idx === 0) return true;
      return !!state.lessons[list[idx - 1].id];
    },

    record(track, id, ok) {
      const k = track + ':' + id;
      if (!state.items[k]) state.items[k] = { seen: 0, ok: 0, bad: 0 };
      state.items[k].seen += 1;
      if (ok) state.items[k].ok += 1; else state.items[k].bad += 1;
      save();
    },
    item(track, id) { return state.items[track + ':' + id] || { seen: 0, ok: 0, bad: 0 }; },

    surahDone(n) { return !!(state.surahs[n] && state.surahs[n].done); },
    markSurah(n, ayahsDone, total) {
      if (!state.surahs[n]) state.surahs[n] = { ayahsDone: 0, done: false };
      state.surahs[n].ayahsDone = Math.max(state.surahs[n].ayahsDone || 0, ayahsDone);
      if (total && state.surahs[n].ayahsDone >= total) {
        state.surahs[n].done = true;
        state.surahs[n].at = Date.now();
      }
      save();
      return state.surahs[n].done;
    },
    surahsDoneCount() {
      return Object.keys(state.surahs).filter(function (k) { return state.surahs[k] && state.surahs[k].done; }).length;
    },

    addStars(n) { state.stars += n; save(); return state.stars; },
    logSession(track, label) {
      state.sessions += 1;
      state.history.unshift({ at: Date.now(), track: track, label: label });
      state.history = state.history.slice(0, 80);
      save();
    },

    /** نسخة احتياطية قابلة للاستعادة */
    exportJSON() {
      return { app: 'noon', version: 2, at: Date.now(), state: state };
    },
    importJSON(obj) {
      if (!obj || !obj.state || obj.app !== 'noon') return false;
      const s = Object.assign(clone(DEFAULT), obj.state);
      s.settings = Object.assign({}, DEFAULT.settings, s.settings || {});
      state = s;
      save();
      return true;
    },
    save: save,
    reset() { state = clone(DEFAULT); save(); }
  };

  window.Store = Store;
})();
