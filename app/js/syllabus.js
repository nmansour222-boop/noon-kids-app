/* ============ المنهج الخطّي: وحدات مرتّبة، كل وحدة تعلّم قبل أن تختبر ============ */
(function () {
  'use strict';

  const C = window.CURRICULUM;
  const Q = window.QURAN || [];

  const TRACKS = {
    ar: { key: 'ar', name: 'العربية', short: 'عربي', color: 'coral', icon: 'book' },
    en: { key: 'en', name: 'الإنجليزية', short: 'إنجليزي', color: 'teal', icon: 'sparkle' },
    qu: { key: 'qu', name: 'القرآن', short: 'قرآن', color: 'leaf', icon: 'book' }
  };

  /* ---------------- وحدات الحركات (بعد ٤ حروف) ---------------- */
  const HARAKAT = [
    { key: 'fatha', ch: '\u064E', name: 'الفَتْحَة', sound: 'أَ', hint: 'شرطة صغيرة فوق الحرف' },
    { key: 'damma', ch: '\u064F', name: 'الضَّمَّة', sound: 'أُ', hint: 'واو صغيرة فوق الحرف' },
    { key: 'kasra', ch: '\u0650', name: 'الكَسْرَة', sound: 'إِ', hint: 'شرطة صغيرة تحت الحرف' },
    { key: 'sukun', ch: '\u0652', name: 'السُّكُون', sound: 'أْ', hint: 'دايرة صغيرة فوق الحرف' }
  ];

  const HARAKA_UNITS = HARAKAT.map(function (h, i) {
    return {
      id: 'ar.h.' + h.key,
      track: 'ar',
      kind: 'haraka',
      order: 100 + i,
      title: h.name,
      sub: h.hint,
      glyph: 'ـ' + h.ch,
      haraka: h,
      lessons: [
        { id: 'ar.h.' + h.key + '.1meet', type: 'arHMeet' },
        { id: 'ar.h.' + h.key + '.2ear', type: 'arHEar' },
        { id: 'ar.h.' + h.key + '.3pick', type: 'arHPick' }
      ]
    };
  });

  /* ---------------- العربية: وحدة لكل حرف ---------------- */
  const AR_LETTERS = C.letters.map(function (l, i) {
    return {
      id: 'ar.' + l.id,
      track: 'ar',
      order: i,
      title: 'حرف ' + l.ch,
      sub: 'اسمه ' + l.name,
      glyph: l.ch,
      letter: l,
      lessons: [
        { id: 'ar.' + l.id + '.1meet',  type: 'arMeet' },
        { id: 'ar.' + l.id + '.2find',  type: 'arFind' },
        { id: 'ar.' + l.id + '.3word',  type: 'arWord' },
        { id: 'ar.' + l.id + '.4write', type: 'arWrite' }
      ]
    };
  });

  /* ---------------- وحدات التفكير (فهم واستدلال) ---------------- */
  function thinkUnit(track, i) {
    return {
      id: track + '.think.' + i,
      track: track,
      kind: 'think',
      order: 700 + i,
      title: 'فكّر معايا',
      sub: 'فهم واستنتاج',
      glyph: '💡',
      think: true,
      lessons: [
        { id: track + '.think.' + i + '.1', type: 'thinkIt', qi: 0 },
        { id: track + '.think.' + i + '.2', type: 'thinkIt', qi: 1 },
        { id: track + '.think.' + i + '.3', type: 'thinkIt', qi: 2 }
      ]
    };
  }

  /* ---------------- تركيب المسار: حروف + حركات + مراجعة دورية ---------------- */
  function withReview(list, track, every, minIdx) {
    const out = [];
    let since = 0;
    let thinkN = 0;
    list.forEach(function (u, i) {
      out.push(u);
      since++;
      const enoughBefore = i >= minIdx;
      const atBoundary = since >= every;
      const last = i === list.length - 1;
      if (enoughBefore && atBoundary && !last) {
        since = 0;
        if (track !== 'qu' && thinkN < 12 && i > 3) out.push(thinkUnit(track, thinkN++));
        out.push({
          id: track + '.review.' + i,
          track: track,
          kind: 'review',
          order: 900 + i,
          title: 'مراجعة سريعة',
          sub: 'نثبّت اللي اتعلمناه',
          glyph: '✓',
          lessons: [{ id: track + '.review.' + i + '.mix', type: 'mixReview' }]
        });
      }
    });
    return out;
  }

  /* ---------------- العربية: قراءة كلمات (بعد الحروف) ---------------- */
  const READ_UNITS = [];
  for (let i = 0; i < 8; i++) {
    READ_UNITS.push({
      id: 'ar.read.' + i,
      track: 'ar',
      kind: 'read',
      order: 400 + i,
      title: 'نقرا كلمات',
      sub: 'من الحرف للكلمة',
      glyph: 'ق',
      readIdx: i,
      lessons: [
        { id: 'ar.read.' + i + '.1', type: 'arReadWord', ri: 0 },
        { id: 'ar.read.' + i + '.2', type: 'arReadWord', ri: 1 },
        { id: 'ar.read.' + i + '.3', type: 'arReadWord', ri: 2 }
      ]
    });
  }

  const AR_CORE = AR_LETTERS.slice(0, 4).concat(HARAKA_UNITS, AR_LETTERS.slice(4), READ_UNITS);
  const AR = withReview(AR_CORE, 'ar', 4, 7);

  /* ---------------- الإنجليزية: وحدة لكل صوت ---------------- */
  const EN = C.sounds.map(function (s, i) {
    const item = Object.assign({ idx: i, id: 's' + i }, s);
    return {
      id: 'en.' + i,
      track: 'en',
      order: i,
      title: 'الصوت ' + s.s,
      sub: s.w,
      glyph: s.s,
      sound: item,
      lessons: [
        { id: 'en.' + i + '.1meet',  type: 'enMeet' },
        { id: 'en.' + i + '.2word',  type: 'enWord' },
        { id: 'en.' + i + '.3blend', type: 'enBlend' },
        { id: 'en.' + i + '.4write', type: 'enWrite' }
      ]
    };
  });

  /* ---------------- القرآن: وحدة لكل سورة بترتيب المحطات ---------------- */
  const QU = [];
  const stationOf = {};
  C.stations.forEach(function (st) {
    st.surahs.forEach(function (n) { if (!stationOf[n]) stationOf[n] = st; });
  });
  const order = [];
  C.stations.forEach(function (st) { st.surahs.forEach(function (n) { if (order.indexOf(n) < 0) order.push(n); }); });

  order.forEach(function (n, idx) {
    const s = Q.find(function (x) { return x.n === n; });
    if (!s) return;
    const total = s.ayahs.length;
    const groupSize = total <= 4 ? total : 2;
    const lessons = [];
    for (let start = 0; start < total; start += groupSize) {
      const ayahs = s.ayahs.slice(start, start + groupSize);
      lessons.push({ id: 'qu.' + n + '.' + start + '.learn', type: 'qLearn', surah: s, ayahs: ayahs, start: start });
      lessons.push({ id: 'qu.' + n + '.' + start + '.recall', type: 'qRecall', surah: s, ayahs: ayahs, start: start });
    }
    QU.push({
      id: 'qu.' + n,
      track: 'qu',
      order: idx,
      title: 'سورة ' + s.name,
      sub: total + ' آية',
      glyph: '﷽',
      surah: s,
      station: stationOf[n] ? stationOf[n].title : '',
      lessons: lessons
    });
  });

  const EN2 = withReview(EN, 'en', 4, 3);
  const QU2 = withReview(QU, 'qu', 3, 2);

  const BY_TRACK = { ar: AR, en: EN2, qu: QU2 };
  const ALL = AR.concat(EN2, QU2);
  const BY_ID = {};
  ALL.forEach(function (u) { BY_ID[u.id] = u; });

  window.SYLLABUS = {
    tracks: TRACKS,
    forTrack: function (t) { return BY_TRACK[t] || []; },
    all: function () { return ALL; },
    harakat: HARAKAT,
    unit: function (id) { return BY_ID[id]; },
    /** الوحدة الحالية في مسار: أول وحدة فيها درس غير مكتمل */
    current: function (track) {
      const list = BY_TRACK[track] || [];
      for (let i = 0; i < list.length; i++) {
        if (!Store.unitDone(list[i].id)) return list[i];
      }
      return list[list.length - 1] || null;
    },
    indexOf: function (unit) {
      const list = BY_TRACK[unit.track] || [];
      return list.findIndex(function (u) { return u.id === unit.id; });
    }
  };

  /* حالة الوحدة (تُقرأ من المتجر) */
  Store.unitDone = function (unitId) {
    const u = BY_ID[unitId];
    if (!u) return false;
    const st = Store.get();
    return u.lessons.every(function (l) { return !!st.lessons[l.id]; });
  };
  Store.unitProgress = function (unitId) {
    const u = BY_ID[unitId];
    if (!u) return 0;
    const st = Store.get();
    let n = 0;
    u.lessons.forEach(function (l) { if (st.lessons[l.id]) n++; });
    return n / Math.max(1, u.lessons.length);
  };
  Store.unitUnlocked = function (unitId) {
    const u = BY_ID[unitId];
    if (!u) return false;
    const list = BY_TRACK[u.track] || [];
    const idx = list.findIndex(function (x) { return x.id === unitId; });
    if (idx <= 0) return true;
    return Store.unitDone(list[idx - 1].id);
  };
  Store.trackUnits = function (t) { return BY_TRACK[t] || []; };
  Store.trackDone = function (t) {
    return (BY_TRACK[t] || []).filter(function (u) { return Store.unitDone(u.id); }).length;
  };
  /** الحروف التي بدأها الطفل فعلاً (لتوليد بدائل عادلة في ألعاب التمييز) */
  Store.taughtLetters = function () {
    const st = Store.get();
    return C.letters.filter(function (l) { return !!st.lessons['ar.' + l.id + '.1meet']; });
  };
  Store.taughtSounds = function () {
    const st = Store.get();
    return C.sounds.map(function (s, i) { return Object.assign({ idx: i }, s); })
      .filter(function (s) { return !!st.lessons['en.' + s.idx + '.1meet']; });
  };
})();
