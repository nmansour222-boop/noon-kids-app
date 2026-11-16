/* ============ الصوت: تلاوة مسجّلة + نطق مؤقت (TTS) ============
   ملاحظة مهمة: نطق الحروف والكلمات هنا مؤقت (صوت آلي) لحين تسجيل
   أصوات بشرية (مقرئ + متحدث أصلي). تلاوة القرآن مسجّلة بصوت بشري. */
(function () {
  'use strict';
  const synth = window.speechSynthesis || null;
  let voices = [];
  let currentAudio = null;
  let seqToken = 0;

  function refreshVoices() {
    if (!synth) return;
    voices = synth.getVoices() || [];
  }
  if (synth) {
    refreshVoices();
    if (typeof synth.onvoiceschanged !== 'undefined') synth.onvoiceschanged = refreshVoices;
  }

  // اختيار الصوت: اختيار ولي الأمر أولاً، وبعده أفضل صوت متاح (عصبي/محسّن أعلى من المضغوط)
  const VKEY = 'noon.voice.';
  function savedVoice(base) { try { return localStorage.getItem(VKEY + base) || ''; } catch (e) { return ''; } }
  function score(v, want) {
    const l = (v.lang || '').toLowerCase().replace('_', '-'), n = (v.name || '').toLowerCase();
    let sc = 0;
    if (l === want) sc += 30; else if (l.split('-')[0] === want.split('-')[0]) sc += 10;
    if (/neural|natural|online|enhanced|premium|siri|wavenet/.test(n)) sc += 40;
    if (/google/.test(n)) sc += 15;
    if (/compact|espeak|novelty/.test(n)) sc -= 20;
    if (v.localService === false) sc += 5;
    return sc;
  }
  function voicesFor(lang) {
    if (!voices.length) refreshVoices();
    const base = lang.toLowerCase().split('-')[0], want = lang.toLowerCase();
    return voices.filter(x => ((x.lang || '').toLowerCase().replace('_', '-')).split('-')[0] === base)
      .sort((a, b) => score(b, want) - score(a, want));
  }
  function pickVoice(lang) {
    const list = voicesFor(lang);
    const pref = savedVoice(lang.toLowerCase().split('-')[0]);
    if (pref) { const m = list.find(x => x.name === pref); if (m) return m; }
    return list[0] || null;
  }

  function say(text, lang, rate) {
    return new Promise(resolve => {
      if (!synth || !text || window.__ttsOff) return resolve(false);
      try {
        const u = new SpeechSynthesisUtterance(text);
        const v = pickVoice(lang || 'ar-SA');
        // لا ننطق العربية بلكنة أجنبية: لو مفيش صوت عربي على الجهاز نسكت بدل ما نخرّب النطق
        const base = (lang || 'ar-SA').toLowerCase().split('-')[0];
        if (!v && voices.length && base !== 'en') { window.__noArabicVoice = true; return resolve(false); }
        if (v) u.voice = v;
        u.lang = (v && v.lang) || lang || 'ar-SA';
        u.rate = rate || 0.86;
        u.pitch = 1.05;
        u.volume = 1;
        u.onend = () => resolve(true);
        u.onerror = () => resolve(false);
        synth.speak(u);
        // أمان: بعض المتصفحات لا تطلق onend
        setTimeout(() => resolve(true), Math.min(9000, 900 + text.length * 130));
      } catch (e) { resolve(false); }
    });
  }

  function play(url, rate) {
    return new Promise(resolve => {
      try {
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }
        const a = new Audio();
        a.preload = 'auto';
        a.src = url;
        if (rate && rate !== 1) { a.preservesPitch = true; a.playbackRate = rate; }
        currentAudio = a;
        const done = ok => { if (currentAudio === a) currentAudio = null; resolve(ok); };
        a.onended = () => done(true);
        a.onerror = () => done(false);
        a.onpause = () => {};
        const p = a.play();
        if (p && p.catch) p.catch(() => done(false));
        setTimeout(() => { if (currentAudio === a) done(true); }, 45000);
      } catch (e) { resolve(false); }
    });
  }

  let lastNotice = 0;
  function noticeAyahFail() {
    const t = Date.now();
    if (t - lastNotice < 20000) return;
    lastNotice = t;
    if (window.UI && UI.toast) UI.toast('التلاوة محتاجة إنترنت أول مرة (أو نزّلها من شاشة ولي الأمر)', 3200);
  }

  const Audio2 = {
    hasTTS() { return !!synth; },
    hasArabicVoice() { return !!pickVoice('ar-SA'); },
    /** أصوات الجهاز للغة (للاختيار من شاشة ولي الأمر) */
    voiceList(lang) { return voicesFor(lang).map(v => ({ name: v.name, lang: v.lang })); },
    currentVoice(lang) { const v = pickVoice(lang); return v ? v.name : ''; },
    setVoice(lang, name) { try { const k = VKEY + lang.toLowerCase().split('-')[0]; if (name) localStorage.setItem(k, name); else localStorage.removeItem(k); } catch (e) {} },
    unlock() {
      if (!synth) return;
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0; synth.speak(u);
      } catch (e) {}
    },
    stop() {
      seqToken++;
      if (synth) { try { synth.cancel(); } catch (e) {} }
      if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; }
    },
    say(text, lang, rate) {
      const my = ++seqToken;
      return say(text, lang, rate).then(r => (my === seqToken ? r : true));
    },
    /** تسلسل نطق مع فواصل */
    async speakSeq(lines, lang, gap) {
      const my = ++seqToken;
      for (const line of lines) {
        if (my !== seqToken) return;
        await say(line.t, line.lang || lang, line.rate);
        await new Promise(r => setTimeout(r, (line.gap != null ? line.gap : (gap || 260))));
      }
    },
    /** التلاوة بصوت المقرئ فقط — لا نقرأ القرآن بصوت آلي أبداً. عند تعذّر الملف نُبلغ ولي الأمر ونكمل. */
    playAyah(url) {
      return play(url).then(ok => { if (!ok) noticeAyahFail(); return ok; });
    },
    async playAyahs(urls, rate) {
      const my = ++seqToken;
      for (const u of urls) {
        if (my !== seqToken) return;
        const ok = await play(u, rate);
        if (!ok) { noticeAyahFail(); return; }
        await new Promise(r => setTimeout(r, 220));
      }
    },
    /** أنشودة الحرف: اسمه ثم صوته ثم كلمتين — بإيقاع مكرر */
    chant(item, track) {
      const my = ++seqToken;
      const lines = track === 'ar'
        ? [
            { t: item.name, gap: 380, rate: 0.8 },
            { t: item.sound + ' ' + item.sound, gap: 320, rate: 0.75 },
            { t: item.words[0].w, gap: 300, rate: 0.78 },
            { t: item.words[1].w, gap: 300, rate: 0.78 }
          ]
        : [
            { t: item.s, gap: 420, rate: 0.8 },
            { t: item.s + ', ' + item.s, gap: 360, rate: 0.75 },
            { t: item.w, gap: 420, rate: 0.8 }
          ];
      return (async () => {
        for (const l of lines) {
          if (my !== seqToken) return;
          await say(l.t, track === 'ar' ? 'ar-SA' : 'en-US', l.rate);
          await new Promise(r => setTimeout(r, l.gap));
        }
      })();
    }
  };

  window.Audio2 = Audio2;
})();
