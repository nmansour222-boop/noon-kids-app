/* ============ «نون» — محرّك الشاشات والجلسة ============ */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const QURAN = window.QURAN || [];
  let S = null;             // حالة الجلسة
  let timerId = null;

  /* ---------------- أدوات ---------------- */
  function toast(msg, ms) {
    const t = $('#toast');
    $('#toastText').textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.add('hidden'), ms || 1700);
  }

  function confetti(n) {
    const box = $('#confetti');
    const colors = ['#FF7A59', '#FFC645', '#2FA3A8', '#8B6BC4', '#5FA85F'];
    for (let i = 0; i < (n || 18); i++) {
      const p = document.createElement('i');
      p.style.background = colors[i % colors.length];
      p.style.left = Math.random() * 100 + '%';
      p.style.top = '-14px';
      p.style.animationDelay = (Math.random() * 0.35) + 's';
      p.style.transform = 'rotate(' + Math.random() * 180 + 'deg)';
      box.appendChild(p);
      setTimeout(() => p.remove(), 1900);
    }
  }

  function juice(n) {
    confetti(n === 3 ? 24 : 10);
    if (navigator.vibrate) navigator.vibrate(18);
  }

  function show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const sc = document.getElementById('screen-' + name);
    if (sc) sc.classList.add('active');
    window.scrollTo(0, 0);
  }

  function refreshTop() {
    const st = window.Store.get();
    $('#starCount').textContent = st.stars;
    $('#streakCount').textContent = st.streak;
  }

  function trackLabel(t) { return t === 'ar' ? 'عربي' : t === 'en' ? 'إنجليزي' : 'قرآن'; }

  /* ---------------- عدّاد الوقت ---------------- */
  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      window.Store.addSeconds(5);
      if (window.Store.limitReached() && $('#screen-session').classList.contains('active')) {
        stopTimer();
        showSleep();
      }
    }, 5000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function showSleep() {
    window.Audio2.stop();
    show('session');
    $('#dots').innerHTML = '';
    $('#stage').innerHTML =
      '<div class="card center sleep">' +
      '<div class="zzz">🌙</div>' +
      '<h2 style="margin:6px 0 2px">خلاص كفاية النهاردة</h2>' +
      '<p style="color:var(--ink-soft);margin:0 0 6px">الوقت اللي حدده بابا/ماما خلص. نكمل بكرة إن شاء الله 💛</p>' +
      '</div>';
    const b = el('button', 'btn ghost', '🏠 رجوع للبيت');
    b.addEventListener('click', () => { goHome(); });
    $('#stage').appendChild(b);
    stopTimer();
  }

  /* ---------------- الرئيسية ---------------- */
  function renderHome() {
    const st = window.Store.get();
    const name = st.childName ? ' يا ' + st.childName : '';
    $('#homeBubble').innerHTML = st.sessions === 0
      ? 'أهلاً بيك' + name + '! أنا <b>نون</b> 🦉 يلا نلعب ونتعلّم حاجة جديدة النهاردة؟'
      : 'وحشتني' + name + '! تعالى نكمل المغامرة 💛';

    const arDone = Math.round(window.Store.letterProgress() * 28);
    const enDone = Math.round(window.Store.soundProgress() * 42);
    const qDone = Object.keys(st.surahs).filter(k => st.surahs[k].done).length;

    $('#wpAr').textContent = arDone + ' من 28 حرف';
    $('#wpEn').textContent = enDone + ' من 42 صوت';
    $('#wpQuran').textContent = qDone + ' من 49 سورة';
    $('#barAr').style.width = (arDone / 28 * 100) + '%';
    $('#barEn').style.width = (enDone / 42 * 100) + '%';
    $('#barQuran').style.width = (qDone / 49 * 100) + '%';
    refreshTop();
  }

  function goHome() {
    stopTimer();
    window.Audio2.stop();
    const pb = document.getElementById('parentBody');
    if (pb) pb.dataset.unlocked = '';
    renderHome();
    show('home');
    S = null;
  }

  /* ---------------- بناء جلسة اليوم ---------------- */
  function buildSession(trackOverride, opts) {
    const st = window.Store.get();
    const track = trackOverride || (st.sessions % 2 === 0 ? 'ar' : 'en');
    const item = track === 'ar' ? window.Store.nextLetter() : window.Store.nextSound();
    const surahN = (opts && opts.surah) || window.Store.nextSurah();
    const surah = QURAN.find(s => s.n === surahN) || QURAN[0];

    S = {
      track, item, surah,
      steps: (opts && opts.quranOnly) ? ['quran', 'reward']
        : (opts && opts.free) ? ['teach', 'game', 'write']
        : ['portal', 'warmup', 'teach', 'game', 'write', 'quran', 'reward'],
      i: 0, stars: 0, game: 0
    };
    show('session');
    renderStep();
    startTimer();
  }

  function renderDots() {
    const box = $('#dots');
    box.innerHTML = '';
    S.steps.forEach((s, i) => {
      const d = document.createElement('i');
      if (i < S.i) d.className = 'done';
      else if (i === S.i) d.className = 'on';
      box.appendChild(d);
    });
  }

  function advance() {
    if (!S) return;
    window.Audio2.stop();
    S.i++;
    if (S.i >= S.steps.length) { finishSession(); return; }
    renderStep();
  }

  function renderStep() {
    renderDots();
    const stage = $('#stage');
    stage.innerHTML = '';
    const step = S.steps[S.i];
    ({
      portal: stepPortal,
      warmup: stepWarmup,
      teach: stepTeach,
      game: stepGame,
      write: stepWrite,
      quran: stepQuran,
      reward: stepReward
    }[step] || stepTeach)();
  }

  /* ---------------- خطوات الجلسة ---------------- */
  function stepPortal() {
    const st = window.Store.get();
    const name = st.childName ? ' يا ' + st.childName : '';
    const stage = $('#stage');
    const c = el('div', 'card center');
    c.innerHTML =
      '<div style="font-size:64px" class="stars-fly">🦉</div>' +
      '<h2 style="margin:4px 0">صباح الخير' + name + '!</h2>' +
      '<p style="color:var(--ink-soft);margin:0">النهاردة هنتعلم حاجة جديدة ونفتح باب في الخريطة</p>';
    stage.appendChild(c);
    const b = el('button', 'btn big', '▶️ يلا بينا');
    b.addEventListener('click', advance);
    stage.appendChild(b);
    window.Audio2.say('يلا بينا' + (st.childName ? ' يا ' + st.childName : ''), 'ar-SA');
  }

  function stepWarmup() {
    // مراجعة سريعة بنجاح مضمون
    const st = window.Store.get();
    const pool = S.track === 'ar'
      ? window.CURRICULUM.letters.filter(l => window.Store.strength('ar', l.id) >= 1)
      : window.CURRICULUM.sounds.map((s, i) => Object.assign({ id: 's' + i }, s)).filter(o => window.Store.strength('en', o.id) >= 1);
    const reviewItem = pool.length ? pool[Math.floor(Math.random() * pool.length)] : S.item;
    const stage = $('#stage');
    stage.appendChild(el('div', 'section-title center', '🔥 إحماء سريع'));
    const holder = el('div', '');
    stage.appendChild(holder);
    window.Games.pickPicture(holder, {
      item: reviewItem, track: S.track,
      onDone: () => { if (S.track === 'ar') window.Store.mark('ar', reviewItem.id, true); else window.Store.mark('en', reviewItem.id, true); setTimeout(advance, 300); }
    });
  }

  function stepTeach() {
    const stage = $('#stage');
    const isAr = S.track === 'ar';
    const c = el('div', 'card center');

    if (isAr) {
      c.innerHTML =
        '<div class="section-title">حرف النهاردة</div>' +
        '<div class="glyph-huge">' + S.item.ch + '</div>' +
        '<div style="font-size:26px;font-weight:700">' + S.item.name + '</div>' +
        '<div style="color:var(--ink-soft);font-size:18px">صوته: <b style="color:var(--coral-dark);font-size:22px">' + S.item.sound + '</b></div>';
      const row = el('div', 'word-row');
      S.item.words.forEach(w => {
        const chip = el('button', 'word-chip', '<span class="we">' + w.e + '</span><div class="ww">' + w.w + '</div>');
        chip.addEventListener('click', () => window.Audio2.say(w.w, 'ar-SA', 0.75));
        row.appendChild(chip);
      });
      c.appendChild(row);
    } else {
      c.innerHTML =
        '<div class="section-title">صوت النهاردة</div>' +
        '<div class="glyph-huge latin">' + S.item.s + '</div>' +
        '<div style="font-size:15px;color:var(--ink-soft)">نطقه قريب من: ' + (S.item.ar || '') + '</div>';
      const row = el('div', 'word-row');
      const chip = el('button', 'word-chip', '<span class="we">' + S.item.e + '</span><div class="ww" style="direction:ltr">' + S.item.w + '</div>');
      chip.addEventListener('click', () => window.Audio2.say(S.item.w, 'en-US', 0.8));
      row.appendChild(chip);
      c.appendChild(row);
    }
    stage.appendChild(c);

    const actions = el('div', 'grid-2');
    const bSay = el('button', 'btn sun sm', '🔊 اسمع تاني');
    bSay.addEventListener('click', () => window.Audio2.chant(S.item, S.track));
    const bNext = el('button', 'btn sm', 'التالي ➡️');
    bNext.addEventListener('click', advance);
    actions.appendChild(bSay); actions.appendChild(bNext);
    stage.appendChild(actions);

    setTimeout(() => window.Audio2.chant(S.item, S.track), 380);
  }

  function stepGame() {
    const stage = $('#stage');
    const holder = el('div', '');
    stage.appendChild(holder);
    const games = ['soundHunt', 'pickPicture', 'wordBuilder', 'memory'];
    const g = games[S.i % games.length];
    const key = S.track === 'ar' ? S.item.id : S.item.id;
    window.Games[g](holder, {
      item: S.item, track: S.track,
      onDone: res => {
        window.Store.mark(S.track, key, true);
        S.stars += 1;
        setTimeout(advance, 550);
      }
    });
  }

  function stepWrite() {
    const stage = $('#stage');
    const isAr = S.track === 'ar';
    const glyph = isAr ? S.item.ch : (S.item.s[0] || 's').toUpperCase();
    stage.appendChild(el('div', 'section-title center', '✍️ اكتب الحرف بصباعك'));
    const wrap = el('div', 'trace-wrap');
    const canvas = document.createElement('canvas');
    canvas.id = 'traceCanvas';
    wrap.appendChild(canvas);
    const ring = el('div', 'ring', '0%');
    wrap.appendChild(ring);
    stage.appendChild(wrap);

    const msg = el('div', 'section-title center', 'امشي بإيدك على الخط الباهت');
    stage.appendChild(msg);

    const actions = el('div', 'grid-2');
    const bClear = el('button', 'btn ghost sm', '🧽 امسح');
    const bNext = el('button', 'btn sm', 'التالي ➡️');
    bNext.disabled = true;
    actions.appendChild(bClear); actions.appendChild(bNext);
    stage.appendChild(actions);

    let tracer = null;
    const success = () => {
      bNext.disabled = false;
      msg.innerHTML = '<b style="color:var(--leaf-dark)">برافو! كتبت الحرف بنفسك ⭐</b>';
      window.Store.mark(S.track, S.item.id, true);
      S.stars += 1;
      window.App.juice(3);
      window.Audio2.say('برافو عليك', 'ar-SA');
    };

    let tracerReady = false;
    const initTracer = () => {
      if (tracerReady) return;
      tracerReady = true;
      tracer = new window.Tracer(canvas, glyph, {
        latin: !isAr,
        onProgress: p => {
          ring.textContent = Math.round(p.coverage * 100) + '%';
          if (p.coverage >= 0.38 && bNext.disabled) success();
          else if (p.coverage < 0.38 && p.attempts > 0) {
            msg.textContent = 'قرّبنا… كمّل باقي الحرف 💪';
          }
        }
      });
    };
    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => setTimeout(initTracer, 40)).catch(() => setTimeout(initTracer, 40));
    setTimeout(initTracer, 1600); // شبكة آمنة لو فشل تحميل الخط

    bClear.addEventListener('click', () => { if (tracer) { tracer.clear(); ring.textContent = '0%'; } });
    bNext.addEventListener('click', advance);
  }

  /* ---------------- القرآن ---------------- */
  function stepQuran() {
    const surah = S.surah;
    const st = window.Store;
    const total = surah.ayahs.length;
    const start = 0;
    const count = Math.min(3, total);
    const ayahs = surah.ayahs.slice(start, start + count);
    let phase = 0;
    S.quranAyahs = ayahs;

    const stage = $('#stage');
    stage.innerHTML = '';
    const head = el('div', 'card center');
    head.innerHTML =
      '<div style="font-size:36px">📖</div>' +
      '<div style="font-size:22px;font-weight:700">سورة ' + surah.name + '</div>' +
      '<div style="font-size:13px;color:var(--ink-faint)">' + count + ' آية النهاردة · ' + total + ' آية في السورة</div>';
    stage.appendChild(head);
    const body = el('div', '');
    stage.appendChild(body);

    function render() {
      body.innerHTML = '';
      if (phase === 0) return listen();
      if (phase === 1) return repeatTogether();
      if (phase === 2) return repeatAlone();
      if (phase === 3) return arrange();
      return finish();
    }

    function listen() {
      body.appendChild(el('div', 'section-title center', '١) اسمع بصوت المقرئ'));
      ayahs.forEach(a => body.appendChild(el('div', 'ayah-line', a.text)));
      const b = el('button', 'btn sun', '👂 اسمع');
      b.addEventListener('click', () => window.Audio2.playAyahs(ayahs.map(a => a.audio)));
      body.appendChild(b);
      const n = el('button', 'btn ghost sm', 'التالي ➡️');
      n.style.marginTop = '10px';
      n.addEventListener('click', () => { phase = 1; render(); });
      body.appendChild(n);
    }

    function repeatTogether() {
      body.appendChild(el('div', 'section-title center', '٢) ردّد معايا'));
      ayahs.forEach(a => body.appendChild(el('div', 'ayah-line', a.text)));
      const b = el('button', 'btn teal', '🗣️ ردّد معايا');
      b.addEventListener('click', () => window.Audio2.playAyahs(ayahs.map(a => a.audio)));
      body.appendChild(b);
      const n = el('button', 'btn ghost sm', 'التالي ➡️');
      n.style.marginTop = '10px';
      n.addEventListener('click', () => { phase = 2; render(); });
      body.appendChild(n);
    }

    function repeatAlone() {
      body.appendChild(el('div', 'section-title center', '٣) دورك انت — قولها لوحدك'));
      const box = el('div', 'card center');
      box.innerHTML = '<div style="font-size:52px" class="stars-fly">🎤</div><div style="font-size:18px">الشاشة هتسكت… <b>قولها لوحدك</b></div>';
      body.appendChild(box);
      const b = el('button', 'btn leaf', '✅ خلصت');
      b.addEventListener('click', () => { phase = 3; render(); });
      body.appendChild(b);
      const again = el('button', 'btn ghost sm', '🔊 اسمع تاني الأول');
      again.style.marginTop = '10px';
      again.addEventListener('click', () => window.Audio2.playAyahs(ayahs.map(a => a.audio)));
      body.appendChild(again);
      const done = window.Store.markSurah(surah.n, Math.min(total, start + count), total);
    }

    function arrange() {
      if (ayahs.length < 2) { phase = 4; return render(); }
      body.appendChild(el('div', 'section-title center', '٤) رتّب الآيات'));
      const holder = el('div', '');
      body.appendChild(holder);
      window.Games.ayahTrain(holder, {
        chunks: ayahs.map(a => ({ text: a.text })),
        onDone: () => {
          window.App.juice(2);
          phase = 4;
          render();
        }
      });
    }

    function finish() {
      if (ayahs.length + start >= total) {
        window.Store.markSurah(surah.n, total, total);
        body.appendChild(el('div', 'card center', '<div style="font-size:56px" class="stars-fly">🏅</div><h3 style="margin:2px 0">تمّت سورة ' + surah.name + '</h3><div style="color:var(--ink-soft)">ربنا يجعله في ميزان حسناتك</div>'));
      } else {
        body.appendChild(el('div', 'card center', '<div style="font-size:56px" class="stars-fly">✨</div><h3 style="margin:2px 0">حفظت أول ' + count + ' آيات</h3><div style="color:var(--ink-soft)">هنكمل باقي السورة بكرة إن شاء الله</div>'));
      }
      window.App.juice(3);
      const b = el('button', 'btn', 'التالي ➡️');
      b.addEventListener('click', advance);
      body.appendChild(b);
    }

    render();
  }

  /* ---------------- المكافأة ---------------- */
  function stepReward() {
    const st = window.Store;
    st.addStars(2);
    st.addPuzzle();
    st.touchToday();
    st.logSession(S.track, S.track === 'ar' ? S.item.name : S.item.s);
    refreshTop();
    confetti(26);

    const stage = $('#stage');
    const c = el('div', 'card center');
    const nextItem = S.track === 'ar' ? st.nextLetter() : st.nextSound();
    const tease = S.track === 'ar' ? 'بكرة هنفتح حرف «' + nextItem.ch + '»' : 'بكرة هنفتح صوت «' + nextItem.s + '»';
    c.innerHTML =
      '<div style="font-size:62px" class="stars-fly">⭐</div>' +
      '<h2 style="margin:2px 0">عملت حاجة حلوة النهاردة!</h2>' +
      '<div class="stars-fly" style="font-size:34px">⭐⭐⭐</div>' +
      '<p style="color:var(--ink-soft);margin:8px 0 0">' + tease + ' — و«' + S.surah.name + '» مستنياك</p>';
    stage.appendChild(c);

    const b = el('button', 'btn big', '🏠 خلاص، أنا مبسوط');
    b.addEventListener('click', goHome);
    stage.appendChild(b);
    window.Audio2.say('برافو! عملت حاجة حلوة النهاردة', 'ar-SA');
  }

  /* ---------------- نهاية الجلسة ---------------- */
  function finishSession() {
    stopTimer();
    goHome();
  }

  /* ---------------- الخريطة / المكتبة ---------------- */
  function renderMap() {
    const body = $('#mapBody');
    body.innerHTML = '';

    // العربية
    body.appendChild(el('div', 'section-title', '🔤 الحروف العربية (28)'));
    const g1 = el('div', 'grid-3');
    g1.style.gridTemplateColumns = 'repeat(4,1fr)';
    g1.style.fontSize = '30px';
    window.CURRICULUM.letters.forEach(l => {
      const done = window.Store.mastered('ar', l.id);
      const b = el('button', 'tap-card letter', l.ch);
      b.style.minHeight = '64px';
      b.style.fontSize = '30px';
      if (done) b.style.borderColor = 'var(--leaf)';
      b.addEventListener('click', () => openFree('ar', l));
      g1.appendChild(b);
    });
    body.appendChild(g1);

    // الإنجليزية
    body.appendChild(el('div', 'section-title', '🔠 الأصوات الإنجليزية (42)'));
    const g2 = el('div', 'grid-3');
    g2.style.gridTemplateColumns = 'repeat(4,1fr)';
    window.CURRICULUM.sounds.forEach((s, i) => {
      const done = window.Store.mastered('en', 's' + i);
      const b = el('button', 'tap-card latin', s.s);
      b.style.minHeight = '64px';
      b.style.fontSize = '24px';
      if (done) b.style.borderColor = 'var(--leaf)';
      b.addEventListener('click', () => openFree('en', Object.assign({ id: 's' + i, idx: i }, s)));
      g2.appendChild(b);
    });
    body.appendChild(g2);

    // القرآن
    body.appendChild(el('div', 'section-title', '📖 القرآن — جزء عمّ وجزء تبارك'));
    window.CURRICULUM.stations.forEach(station => {
      const h = el('div', 'setting', '<b style="font-size:16px">' + station.title + '</b>');
      body.appendChild(h);
      station.surahs.forEach(n => {
        const s = QURAN.find(x => x.n === n);
        if (!s) return;
        const done = window.Store.surahDone(n);
        const row = el('div', 'surah-item');
        row.innerHTML = '<div class="num">' + n + '</div><div style="flex:1"><div class="nm">سورة ' + s.name + '</div><div class="sub">' + s.count + ' آية · ' + s.en + '</div></div><div class="tick">' + (done ? '✅' : '▶️') + '</div>';
        row.addEventListener('click', () => { buildSession('ar', { surah: n, quranOnly: true }); });
        body.appendChild(row);
      });
    });
  }

  function openFree(track, item) {
    // جلسة مصغّرة على عنصر مختار
    const surahN = window.Store.nextSurah();
    const surah = QURAN.find(s => s.n === surahN) || QURAN[0];
    S = { track, item, surah, steps: ['teach', 'game', 'write'], i: 0, stars: 0 };
    show('session');
    renderStep();
    startTimer();
  }

  /* ---------------- بيتي ---------------- */
  function renderTreasury() {
    const st = window.Store.get();
    const body = $('#treasuryBody');
    const surahsDone = Object.keys(st.surahs).filter(k => st.surahs[k].done);
    const lettersDone = window.CURRICULUM.letters.filter(l => window.Store.mastered('ar', l.id));
    const soundsDone = window.CURRICULUM.sounds.filter((s, i) => window.Store.mastered('en', 's' + i));
    $('#treasuryBubble').innerHTML = 'عندك <b>' + st.stars + '</b> نجمة و<b>' + surahsDone.length + '</b> سورة!';

    body.innerHTML = '';
    const big = el('div', 'center');
    big.innerHTML = '<div style="font-size:56px">⭐</div><div style="font-size:32px;font-weight:700">' + st.stars + '</div><div style="color:var(--ink-soft)">نجمة</div>';
    body.appendChild(big);

    body.appendChild(el('div', 'section-title', 'أحرف عرفتها (' + lettersDone.length + ')'));
    const chips1 = el('div', 'chips');
    (lettersDone.length ? lettersDone : []).forEach(l => chips1.appendChild(el('span', 'chip', l.ch + ' ' + l.name)));
    if (!lettersDone.length) chips1.appendChild(el('span', 'chip', 'نبدأ من أول حرف 💛'));
    body.appendChild(chips1);

    body.appendChild(el('div', 'section-title', 'أصوات إنجليزية (' + soundsDone.length + ')'));
    const chips2 = el('div', 'chips');
    soundsDone.forEach(s => { const c = el('span', 'chip', s.s + ' · ' + s.w); c.style.direction = 'ltr'; chips2.appendChild(c); });
    if (!soundsDone.length) chips2.appendChild(el('span', 'chip', 'لسه هنبدأ'));
    body.appendChild(chips2);

    body.appendChild(el('div', 'section-title', 'سور حفظتها (' + surahsDone.length + ')'));
    const chips3 = el('div', 'chips');
    surahsDone.sort((a, b) => a - b).forEach(n => {
      const s = QURAN.find(x => x.n == n);
      if (s) chips3.appendChild(el('span', 'chip', '📖 ' + s.name));
    });
    if (!surahsDone.length) chips3.appendChild(el('span', 'chip', 'الفاتحة مستنياك'));
    body.appendChild(chips3);

    body.appendChild(el('div', 'section-title', 'بازل الأسبوع'));
    const pz = el('div', 'badge-grid');
    for (let i = 0; i < 6; i++) pz.appendChild(el('div', 'badge' + (i < st.puzzle ? ' on' : ' off'), i < st.puzzle ? '🧩' : '·'));
    body.appendChild(pz);
  }

  /* ---------------- ولي الأمر ---------------- */
  function renderParent() {
    const body = $('#parentBody');
    const st = window.Store.get();
    if (!body.dataset.unlocked) {
      body.innerHTML = '<div class="center" style="margin-bottom:12px"><b>أدخل الرقم السري</b><div style="color:var(--ink-faint);font-size:13px">الرقم الافتراضي 1234</div></div>';
      const disp = el('div', 'center');
      disp.style.fontSize = '28px';
      disp.style.letterSpacing = '8px';
      disp.style.marginBottom = '12px';
      disp.textContent = '____';
      body.appendChild(disp);
      let buf = '';
      const show = () => { disp.textContent = (buf + '____').slice(0, 4); };
      const verify = () => {
        if (buf === st.settings.pin) {
          body.dataset.unlocked = '1';
          renderParent();
        } else {
          toast('الرقم مش صح');
          window.Audio2.say('الرقم مش صح', 'ar-SA');
          buf = '';
          show();
          disp.animate ? disp.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 260 }) : null;
        }
      };
      const pad = el('div', 'pinpad');
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach(k => {
        const b = el('button', 'btn ghost sm', k);
        b.addEventListener('click', () => {
          if (k === '⌫') { buf = buf.slice(0, -1); show(); return; }
          if (k === '✓') { verify(); return; }
          if (buf.length >= 4) buf = '';
          buf += k;
          show();
          if (buf.length === 4) setTimeout(verify, 180);
        });
        pad.appendChild(b);
      });
      body.appendChild(pad);
      return;
    }

    body.innerHTML = '';
    const mins = Math.round(window.Store.secondsToday() / 60);
    body.appendChild(el('div', 'section-title', 'النهاردة'));
    const s1 = el('div', 'setting', '<span>⏱️ وقت الاستخدام</span><b>' + mins + ' دقيقة</b>');
    body.appendChild(s1);
    body.appendChild(el('div', 'setting', '<span>🔥 أيام متتالية</span><b>' + st.streak + '</b>'));
    body.appendChild(el('div', 'setting', '<span>⭐ النجوم</span><b>' + st.stars + '</b>'));

    body.appendChild(el('div', 'section-title', 'إيه اللي اتعلمه'));
    const letters = window.CURRICULUM.letters;
    const rows = [
      { t: 'عربي — حروف متقنة', n: letters.filter(l => window.Store.mastered('ar', l.id)).length, tot: 28 },
      { t: 'إنجليزي — أصوات متقنة', n: window.CURRICULUM.sounds.filter((s, i) => window.Store.mastered('en', 's' + i)).length, tot: 42 },
      { t: 'قرآن — سور', n: Object.keys(st.surahs).filter(k => st.surahs[k].done).length, tot: 49 }
    ];
    rows.forEach(r => {
      const row = el('div', 'stat-row');
      row.innerHTML = '<span style="flex:1">' + r.t + '</span><span class="mini-bar" style="max-width:110px"><i style="width:' + (r.n / r.tot * 100) + '%"></i></span><b style="min-width:52px;text-align:left">' + r.n + '/' + r.tot + '</b>';
      body.appendChild(row);
    });

    const weak = letters.filter(l => { const it = st.items['ar:' + l.id]; return it && it.bad > 0 && it.lv < 3; }).slice(0, 5);
    if (weak.length) {
      body.appendChild(el('div', 'section-title', 'محتاج مراجعة'));
      const chips = el('div', 'chips');
      weak.forEach(l => chips.appendChild(el('span', 'chip', l.ch + ' ' + l.name)));
      body.appendChild(chips);
    }

    body.appendChild(el('div', 'section-title', 'الإعدادات'));
    const nameRow = el('div', 'setting', '<span>اسم الطفل</span>');
    const nameIn = document.createElement('input');
    nameIn.type = 'text'; nameIn.value = st.childName || ''; nameIn.placeholder = 'مثال: أحمد';
    nameIn.style.maxWidth = '180px';
    nameIn.addEventListener('change', () => { st.childName = nameIn.value.trim(); window.Store.save(); toast('اتحفظ'); });
    nameRow.appendChild(nameIn);
    body.appendChild(nameRow);

    const limitRow = el('div', 'setting', '<span>حد الوقت اليومي</span>');
    const sel = document.createElement('select');
    [[10, '10 دقائق'], [15, '15 دقيقة'], [20, '20 دقيقة'], [30, '30 دقيقة'], [0, 'بدون حد']].forEach(([v, l]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = l; if (st.settings.limitMin === v) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener('change', () => { st.settings.limitMin = parseInt(sel.value, 10); window.Store.save(); toast('اتحفظ'); });
    limitRow.appendChild(sel);
    body.appendChild(limitRow);

    const ttsRow = el('div', 'setting', '<span>الأصوات والنطق</span>');
    const sw = el('button', 'switch' + (st.settings.tts ? ' on' : ''), '<i></i>');
    sw.addEventListener('click', () => {
      st.settings.tts = !st.settings.tts; window.Store.save();
      window.__ttsOff = !st.settings.tts;
      sw.classList.toggle('on', st.settings.tts);
      toast(st.settings.tts ? 'الصوت مفتوح' : 'الصوت مقفول');
    });
    ttsRow.appendChild(sw);
    body.appendChild(ttsRow);

    const pinRow = el('div', 'setting', '<span>الرقم السري</span><b>' + st.settings.pin + '</b>');
    body.appendChild(pinRow);

    const reset = el('button', 'btn ghost sm', '🔄 تصفير تقدّم الطفل');
    reset.style.marginTop = '14px';
    reset.style.color = 'var(--coral-dark)';
    reset.addEventListener('click', () => {
      if (confirm('هل تريد تصفير كل التقدّم والنجوم؟ لا يمكن التراجع.')) {
        window.Store.reset();
        body.dataset.unlocked = '';
        toast('اتصفّر');
        renderHome();
        renderParent();
      }
    });
    body.appendChild(reset);

    const lock = el('button', 'btn ghost sm', '🔒 قفل');
    lock.style.marginTop = '8px';
    lock.addEventListener('click', () => { body.dataset.unlocked = ''; renderParent(); });
    body.appendChild(lock);

    const note = el('div', 'foot', 'تطبيق «نون» — نسخة تجريبية · الأصوات التعليمية مؤقتة (نطق آلي) لحين التسجيل البشري · تلاوة القرآن بصوت بشري مسجّل');
    body.appendChild(note);
  }

  /* ---------------- ربط الأزرار ---------------- */
  function bind() {
    $('#btnPlay').addEventListener('click', () => {
      window.Audio2.unlock();
      if (window.Store.limitReached()) { showSleep(); return; }
      buildSession(null, {});
    });
    $('#btnMap').addEventListener('click', () => { renderMap(); show('map'); });
    $('#btnTreasury').addEventListener('click', () => { renderTreasury(); show('treasury'); });
    $('#btnParent').addEventListener('click', () => { renderParent(); show('parent'); });
    $('#btnBackHome1').addEventListener('click', goHome);
    $('#btnBackHome2').addEventListener('click', goHome);
    $('#btnBackHome3').addEventListener('click', goHome);
    document.querySelectorAll('.world').forEach(w => {
      w.addEventListener('click', () => { renderMap(); show('map'); });
    });
    // إيقاف الصوت عند مغادرة الصفحة
    document.addEventListener('visibilitychange', () => { if (document.hidden) window.Audio2.stop(); });
  }

  /* ---------------- تشغيل ---------------- */
  window.App = { juice, toast, goHome, buildSession, show };
  // خطّاف اختبار داخلي (يعمل فقط مع ?qa=1) — لا يؤثر على الاستخدام العادي
  if (location.search.indexOf('qa=1') >= 0) {
    window.App.__advance = advance;
    window.App.__session = () => S;
    window.App.__store = () => window.Store;
  }
  document.addEventListener('DOMContentLoaded', () => {
    window.Store.touchToday();
    window.__ttsOff = !window.Store.get().settings.tts;
    bind();
    renderHome();
    show('home');
  });
})();
