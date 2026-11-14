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

  function pickVoice(lang) {
    if (!voices.length) refreshVoices();
    const want = lang.toLowerCase();
    const base = want.split('-')[0];
    let v = voices.find(x => (x.lang || '').toLowerCase() === want);
    if (!v) v = voices.find(x => (x.lang || '').toLowerCase().startsWith(base));
    return v || null;
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

  const Audio2 = {
    hasTTS() { return !!synth; },
    hasArabicVoice() { return !!pickVoice('ar-SA'); },
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
    playAyah(url, lang, text) {
      return play(url).then(ok => {
        if (!ok && text) return say(text, 'ar-SA', 0.78);
        return ok;
      });
    },
    async playAyahs(urls, rate) {
      const my = ++seqToken;
      const el = document.getElementById('ayahAudio');
      for (const u of urls) {
        if (my !== seqToken) return;
        await play(u, rate);
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
