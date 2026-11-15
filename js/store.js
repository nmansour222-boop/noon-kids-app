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
    settings: { tts: true, limitMin: 10 },
    history: [],
    unitRewards: {}     // unitId -> timestamp: مكافأة إتمام الوحدة تُمنح مرة واحدة فقط
  };
  const LIMITS = [0, 10, 15, 20];
  const TRACK_KEYS = ['ar', 'en', 'qu', 'num', 'th'];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- التحقق من البيانات (للتحميل والاستعادة): أي قيمة غير متوقعة تُستبعد ---------- */
  function isObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function num(v, min, max) { v = Number(v); if (!isFinite(v)) return 0; return Math.max(min, Math.min(max, Math.round(v))); }
  function str(v, max) { return typeof v === 'string' ? v.replace(/[\u0000-\u001F<>]/g, '').slice(0, max) : ''; }
  const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
  const ID_RE = /^[^<>"'`&\s\u0000-\u001F]{1,80}$/;   // يسمح بالعربي (مثل ar:read.بَاب) ويمنع رموز HTML
  function sanitize(raw) {
    const s = clone(DEFAULT);
    if (!isObj(raw)) return s;
    s.childName = str(raw.childName, 24).trim();
    s.stars = num(raw.stars, 0, 1e6);
    s.streak = num(raw.streak, 0, 1e5);
    s.lastDay = (typeof raw.lastDay === 'string' && DAY_RE.test(raw.lastDay)) ? raw.lastDay : null;
    s.sessions = num(raw.sessions, 0, 1e7);
    s.seconds = num(raw.seconds, 0, 1e9);
    if (isObj(raw.days)) Object.keys(raw.days).forEach(function (d) { if (DAY_RE.test(d)) s.days[d] = num(raw.days[d], 0, 86400); });
    if (isObj(raw.lessons)) Object.keys(raw.lessons).forEach(function (k) { if (ID_RE.test(k)) s.lessons[k] = num(raw.lessons[k], 1, 9e15) || 1; });
    if (isObj(raw.unitRewards)) Object.keys(raw.unitRewards).forEach(function (k) { if (ID_RE.test(k)) s.unitRewards[k] = num(raw.unitRewards[k], 1, 9e15) || 1; });
    if (isObj(raw.items)) Object.keys(raw.items).forEach(function (k) {
      const t = k.split(':')[0];
      if (!ID_RE.test(k) || TRACK_KEYS.indexOf(t) < 0 || !isObj(raw.items[k])) return;
      const it = raw.items[k], o = { seen: num(it.seen, 0, 1e6), ok: num(it.ok, 0, 1e6), bad: num(it.bad, 0, 1e6) };
      ['streak', 'lvl'].forEach(function (f) { if (it[f] != null) o[f] = num(it[f], 0, 1000); });
      if (it.due != null) o.due = num(it.due, 0, 9e15);
      s.items[k] = o;
    });
    if (isObj(raw.surahs)) Object.keys(raw.surahs).forEach(function (k) {
      const n = parseInt(k, 10);
      if (!(n >= 1 && n <= 114) || String(n) !== k || !isObj(raw.surahs[k])) return;
      const v = raw.surahs[k], o = { ayahsDone: num(v.ayahsDone, 0, 300), done: v.done === true };
      if (v.at != null) o.at = num(v.at, 0, 9e15);
      if (v.heard != null) o.heard = num(v.heard, 0, 9e15);
      s.surahs[k] = o;
    });
    if (isObj(raw.settings)) {
      const st = raw.settings;
      s.settings.tts = st.tts !== false;
      if (st.ttsUser === true) s.settings.ttsUser = true;
      s.settings.limitMin = LIMITS.indexOf(Number(st.limitMin)) >= 0 ? Number(st.limitMin) : DEFAULT.settings.limitMin;
    }
    if (Array.isArray(raw.history)) s.history = raw.history.slice(0, 80).filter(isObj).map(function (h) {
      return { at: num(h.at, 0, 9e15), track: TRACK_KEYS.indexOf(h.track) >= 0 ? h.track : '', label: str(h.label, 80) };
    });
    return s;
  }

  let storageOk = true, lastSaveError = null, warned = false;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT);
      return sanitize(JSON.parse(raw));
    } catch (e) { return clone(DEFAULT); }
  }
  let state = load();
  /** الحفظ يُرجع true/false — الفشل (امتلاء/حظر التخزين) يظهر لولي الأمر بدل ما يضيع التقدّم بصمت */
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageOk = true; lastSaveError = null;
      return true;
    } catch (e) {
      storageOk = false; lastSaveError = (e && e.name) || 'Error';
      if (!warned && window.UI && UI.toast) {
        warned = true;
        UI.toast('تنبيه: التقدّم مش بيتحفظ على الجهاز (مساحة التخزين ممتلية أو محظورة)', 4200);
      }
      try { window.dispatchEvent(new CustomEvent('noon:storage-error', { detail: lastSaveError })); } catch (e2) {}
      return false;
    }
  }
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
    /** الوحدة الحالية والدرس التالي فيها (للتقرير): أول وحدة فيها درس غير مكتمل */
    currentLesson(track) {
      const units = window.SYLLABUS.forTrack(track);
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        for (let j = 0; j < u.lessons.length; j++) {
          if (!state.lessons[u.lessons[j].id]) return { unit: u, lesson: u.lessons[j], step: j + 1, steps: u.lessons.length, finished: false };
        }
      }
      const last = units[units.length - 1];
      return last ? { unit: last, lesson: null, step: last.lessons.length, steps: last.lessons.length, finished: true } : null;
    },
    storageOk() { return storageOk; },
    storageError() { return lastSaveError; },
    /** فحص فعلي للكتابة في التخزين */
    probeStorage() {
      try { localStorage.setItem('noon_probe', '1'); localStorage.removeItem('noon_probe'); return true; } catch (e) { return false; }
    },
    /** آخر ٧ أيام تقويمية من النهارده (أيام بلا استخدام = صفر) */
    lastDays(n) {
      const out = [];
      const base = new Date();
      for (let i = (n || 7) - 1; i >= 0; i--) {
        const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
        const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        out.push({ day: k, seconds: state.days[k] || 0 });
      }
      return out;
    },
    /** مكافأة إتمام الوحدة: true أول مرة فقط */
    claimUnitReward(unitId) {
      if (state.unitRewards[unitId]) return false;
      state.unitRewards[unitId] = Date.now(); save(); return true;
    },
    unitRewarded(unitId) { return !!state.unitRewards[unitId]; },

    record(track, id, ok) {
      const k = track + ':' + id;
      if (!state.items[k]) state.items[k] = { seen: 0, ok: 0, bad: 0 };
      state.items[k].seen += 1;
      if (ok) state.items[k].ok += 1; else state.items[k].bad += 1;
      save();
    },
    item(track, id) { return state.items[track + ':' + id] || { seen: 0, ok: 0, bad: 0 }; },

    surahDone(n) { return !!(state.surahs[n] && state.surahs[n].done); },
    /** ولي الأمر سمع السورة من الطفل فعلاً (تأكيد بشري — التطبيق لا يقيّم التلاوة صوتياً) */
    markSurahHeard(n) {
      if (!state.surahs[n]) state.surahs[n] = { ayahsDone: 0, done: false };
      state.surahs[n].heard = Date.now(); save();
    },
    surahsHeardCount() {
      return Object.keys(state.surahs).filter(function (k) { return state.surahs[k] && state.surahs[k].done && state.surahs[k].heard; }).length;
    },
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
      return { app: 'noon', version: 3, at: Date.now(), state: state };
    },
    /** استعادة بعد التحقق من المخطط: أي حقل غير متوقع يُستبعد، والنصوص تُنظَّف */
    importJSON(obj) {
      if (!isObj(obj) || obj.app !== 'noon' || !isObj(obj.state)) return false;
      if (obj.version != null && [2, 3].indexOf(Number(obj.version)) < 0) return false;
      state = sanitize(obj.state);
      const ok = save();
      Store.syncTts();
      return ok;
    },
    sanitize: sanitize,
    reset() { state = clone(DEFAULT); const ok = save(); Store.syncTts(); return ok; },

    /** الصوت الآلي لنطق التعليمات وأسماء الحروف: تلقائي (مفعّل) ما لم يغيّره ولي الأمر صراحةً.
     *  ملاحظة: التلاوة القرآنية لا تُنطق آلياً أبداً مهما كان هذا الإعداد. */
    ttsOn() { const s = state.settings; return s.ttsUser ? !!s.tts : true; },
    setTts(v) { state.settings.tts = !!v; state.settings.ttsUser = true; save(); Store.syncTts(); },
    syncTts() { window.__ttsOff = !Store.ttsOn(); }
  };

  window.Store = Store;
  Store.syncTts();
})();
