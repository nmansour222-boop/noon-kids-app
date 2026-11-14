/* ============ «نون» — الموجّه والشاشات ============ */
(function () {
  'use strict';
  const el = UI.el;
  const $ = function (id) { return document.getElementById(id); };
  const SCREENS = { home: 's-home', track: 's-track', lesson: 's-lesson', parent: 's-parent' };

  let stack = ['home'];
  let current = null;

  function showScreen(name, dir) {
    if (current === name) return;
    const prev = current ? $(SCREENS[current]) : null;
    const next = $(SCREENS[name]);
    if (!next) return;
    next.hidden = false;
    next.classList.remove('enter-fwd', 'enter-back');
    void next.offsetWidth;
    next.classList.add(dir === 'back' ? 'enter-back' : 'enter-fwd');
    if (prev) prev.hidden = true;
    current = name;
  }

  function go(name, opts) {
    opts = opts || {};
    if (name !== 'parent') setZoom(false);
    if (opts.push !== false) stack.push(name);
    showScreen(name, opts.dir);
  }

  function back() {
    if (stack.length > 1) stack.pop();
    const name = stack[stack.length - 1] || 'home';
    if (name !== 'parent') setZoom(false);
    showScreen(name, 'back');
    if (name === 'home') renderHome();
    if (name === 'track') renderTrack(state.track);
  }

  const state = { track: 'ar', unit: null, qa: /[?&]qa=1/.test(location.search) };

  /* ================= الرئيسية ================= */
  function renderHome() {
    const s = Store.get();
    $('homeStarsN').textContent = s.stars;
    const st = Store.touchToday();
    $('homeStreak').hidden = st < 2;
    $('homeStreakN').textContent = st;
    $('heroOwl').innerHTML = '<div class="hero-ring">' +
      '<img class="hero-art" src="icons/icon-192.png" alt="نون" width="106" height="106">' +
      '</div>';

    // رف المكافأة: نجوم حتى الشارة التالية
    const shelf = document.getElementById('rewardShelf');
    if (shelf) {
      const per = 10, have = s.stars % per, next = per - have;
      shelf.innerHTML = '<span class="rs-ico">🏅</span><span class="rs-txt">فاضل ' + next + ' نجمة وتاخد شارة</span>' +
        '<span class="rs-bar"><i style="width:' + Math.round(have / per * 100) + '%"></i></span>';
    }

    // مراجعة تلقائية لما اتعلمه قبل كده
    const rev = document.getElementById('reviewSlot');
    if (rev) {
      rev.innerHTML = '';
      const learned = [];
      ['ar', 'en', 'num', 'qu'].forEach(function (t) {
        Store.trackUnits(t).forEach(function (u) { if (Store.unitDone(u.id)) learned.push(u); });
      });
      if (learned.length) {
        const pickU = learned[Math.floor(Math.random() * learned.length)];
        const card = el('button', 'review-card',
          '<span class="rc-ico">🔁</span><span><span class="rc-t">مراجعة سريعة</span><br>' +
          '<span class="rc-s">' + pickU.title + ' — نفتكرها مع بعض؟</span></span>');
        card.addEventListener('click', function () { SFX.tap(); openUnit(pickU); });
        rev.appendChild(card);
      }
    }

    /** عدّاد دقيق: الحروف ٢٨، الأصوات ٤٢، السور بعددها الحقيقي (لا الوحدات) */
    function unitCounts(k, units) {
      function doneU(u) { return Store.unitDone(u.id); }
      if (k === 'ar') {
        const L = units.filter(function (u) { return u.letter; });
        return { done: L.filter(doneU).length, total: L.length, noun: 'حرف' };
      }
      if (k === 'en') {
        const S2 = units.filter(function (u) { return u.sound; });
        return { done: S2.filter(doneU).length, total: S2.length, noun: 'صوت' };
      }
      if (k === 'qu') {
        const byS = {};
        units.forEach(function (u) {
          const n = u.surah && u.surah.n;
          if (n == null) return;
          byS[n] = byS[n] || { all: 0, done: 0 };
          byS[n].all++; if (doneU(u)) byS[n].done++;
        });
        const keys = Object.keys(byS);
        const full = keys.filter(function (n) { return byS[n].done >= byS[n].all; }).length;
        return { done: full, total: keys.length, noun: 'سورة' };
      }
      return { done: units.filter(doneU).length, total: units.length, noun: 'مرحلة' };
    }

    const host = $('trackCards');
    host.innerHTML = '';
    ['ar', 'en', 'qu', 'num'].forEach(function (k) {
      const t = SYLLABUS.tracks[k];
      const units = Store.trackUnits(k);
      const done = Store.trackDone(k);
      const pct = units.length ? Math.round(done / units.length * 100) : 0;
      const icon = k === 'ar' ? 'أ' : (k === 'en' ? 'A' : (k === 'num' ? '١٢٣' : UI.icon('book', 30)));
      const cnt = unitCounts(k, units);
      const meta = cnt.done + ' من ' + cnt.total + ' ' + cnt.noun;

      const card = el('button', 'track-card ' + k + '-theme');
      card.innerHTML =
        '<span class="tc-icon">' + icon + '</span>' +
        '<span class="tc-body">' +
          '<span class="tc-title">' + t.name + '</span>' +
          '<span class="tc-meta">' + meta + '</span>' +
          '<span class="bar"><i style="width:' + pct + '%"></i></span>' +
        '</span>' +
        '<span class="tc-go">' + (pct > 0 ? 'كمّل' : 'يلا') + '</span>';
      card.addEventListener('click', function () {
        SFX.tap();
        state.track = k;
        go('track');
        renderTrack(k);
      });
      host.appendChild(card);
    });
  }

  /* ================= مسار ================= */
  function renderTrack(track) {
    const t = SYLLABUS.tracks[track];
    const units = Store.trackUnits(track);
    const done = Store.trackDone(track);
    $('trackTitle').textContent = t.name;
    $('trackStarsN').textContent = Store.get().stars;
    $('trackBar').style.width = (units.length ? Math.round(done / units.length * 100) : 0) + '%';
    $('trackSub').textContent = track === 'qu'
      ? 'بنحفظ بالسهل الأول — خلصنا ' + done + ' من ' + units.length + ' سورة'
      : 'منهج متدرّج — خلصنا ' + done + ' من ' + units.length + (track === 'ar' ? ' حرف' : ' صوت');

    const path = $('trackPath');
    path.className = 'path ' + track + '-path';
    path.innerHTML = '';

    let lastStation = null;
    const nodes = [];   // تُضاف على دفعات: أولاً ما يراه الطفل، ثم الباقي في وقت الفراغ
    units.forEach(function (u, i) {
      const isDone = Store.unitDone(u.id);
      const unlocked = Store.unitUnlocked(u.id);
      const isCurrent = !isDone && unlocked;

      if (track === 'qu' && u.station && u.station !== lastStation) {
        lastStation = u.station;
        nodes.push(el('div', 'station-label', u.station));
      }

      const btn = el('button', 'unit' + (isDone ? ' done' : '') + (isCurrent ? ' current' : '') + (unlocked ? '' : ' locked') + (u.kind === 'review' ? ' review-unit' : '') + (u.kind === 'think' ? ' think-unit' : '') + (u.kind === 'haraka' ? ' haraka-unit' : ''));
      const prog = Math.round(Store.unitProgress(u.id) * 100);
      let nodeInner = '';
      if (u.kind === 'think') nodeInner = '<span style="font-size:22px">💡</span>';
      else if (u.kind === 'review') nodeInner = UI.icon('refresh', 24);
      else if (isDone) nodeInner = UI.icon('check', 26);
      else if (!unlocked) nodeInner = UI.icon('lock', 22);
      else if (u.kind === 'haraka') nodeInner = Glyph.svg('ب', [u.haraka.key], { size: 46, color: 'var(--coral)' });
      else if (track === 'ar') nodeInner = Glyph.svg(u.letter.ch, [], { size: 48, color: 'var(--coral)', emBox: true });
      else if (track === 'en') nodeInner = Glyph.svg(String(u.glyph).toLowerCase(), [], { size: 60, color: 'var(--teal)', latin: true, emBox: true });
      else nodeInner = UI.icon('book', 24);

      btn.innerHTML =
        '<span class="unit-node">' + nodeInner + '</span>' +
        '<span class="unit-body">' +
          '<span class="unit-title">' + u.title + '</span>' +
          '<span class="unit-sub">' + (isDone ? 'خلصناه ✓' : (unlocked ? u.sub : 'مقفول')) + '</span>' +
          (isCurrent || (isDone === false && prog > 0) ? '<span class="mini-bar"><i style="width:' + prog + '%"></i></span>' : '') +
        '</span>' +
        '<span class="unit-count">' + u.lessons.length + ' ' + (u.lessons.length > 2 ? 'خطوات' : 'خطوة') + '</span>';

      btn.addEventListener('click', function () {
        if (!unlocked) { SFX.wrong(); UI.toast('خلّص اللي قبله الأول'); return; }
        SFX.tap();
        openUnit(u);
      });
      nodes.push(btn);
    });

    // عرض فوري لأول ١٤ وحدة + الباقي على دفعات (يقلّل زمن أول رسم كثيرًا)
    let shown = 0;
    const FIRST = 14, CHUNK = 10;
    function flush(n) {
      const end = Math.min(nodes.length, shown + n);
      const frag = document.createDocumentFragment();
      for (; shown < end; shown++) frag.appendChild(nodes[shown]);
      path.appendChild(frag);
    }
    flush(FIRST);
    if (shown < nodes.length) {
      const idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 60); };
      (function step() {
        if (current !== 'track') return;
        idle(function () {
          flush(CHUNK);
          if (shown < nodes.length) step();
        }, { timeout: 400 });
      })();
    }
  }

  /* ================= الدرس ================= */
  const session = { unit: null, idx: 0, started: false };

  function openUnit(u) {
    if (Store.limitReached()) { showLimit(); return; }
    state.unit = u;
    // ابدأ من أول درس غير مكتمل، أو من الأول لو الوحدة مكتملة (مراجعة)
    let idx = 0;
    const st = Store.get();
    for (let i = 0; i < u.lessons.length; i++) {
      if (!st.lessons[u.lessons[i].id]) { idx = i; break; }
    }
    const allDone = u.lessons.every(function (l) { return !!st.lessons[l.id]; });
    session.unit = u;
    session.idx = allDone ? 0 : idx;
    session.started = false;
    go('lesson');
    runLesson();
  }

  function showLimit() {
    go('lesson');
    const host = $('lessonHost');
    host.innerHTML = '';
    $('lessonSegs').innerHTML = '';
    const s = el('div', 'l-screen');
    const c = el('div', 'l-center');
    c.innerHTML = '<div class="praise-art">' + UI.mascot(120, 'sleepy') + '</div>' +
      '<div class="l-eyebrow">وقت الراحة</div>' +
      '<div class="praise-text" style="color:var(--plum)">خلصنا النهارده!</div>' +
      '<div class="l-hint" style="font-size:17px">لعبنا وتعلمنا كتير — نكمل بكره إن شاء الله</div>';
    const b = el('button', 'btn ghost', 'رجوع للمسار');
    b.style.maxWidth = '280px';
    b.addEventListener('click', function () { SFX.click(); back(); });
    c.appendChild(b);
    s.appendChild(c);
    host.appendChild(s);
    Audio2.say('خلصنا النهارده! نكمل بكره', 'ar-SA', 0.8);
  }

  function drawSegments() {
    const segs = $('lessonSegs');
    segs.innerHTML = '';
    session.unit.lessons.forEach(function (l, i) {
      const done = Store.lessonDone(l.id);
      const cls = i < session.idx ? 'on' : (i === session.idx ? 'now' : '');
      segs.appendChild(el('i', (done && i < session.idx ? 'on ' : '') + cls));
    });
  }

  function runLesson() {
    const u = session.unit;
    const lesson = u.lessons[session.idx];
    if (!lesson) { finishUnit(); return; }
    drawSegments();
    if (!session.started) { session.started = true; Store.touchToday(); }

    const host = $('lessonHost');
    host.innerHTML = '';
    Lessons.run(host, lesson, u, function () {
      const first = !Store.lessonDone(lesson.id);
      Store.markLesson(lesson.id);
      Store.logSession(u.track, u.title);
      if (first) Store.addStars(1);
      session.idx++;
      session.done = (session.done || 0) + 1;
      if (session.done % 4 === 0 && session.idx < u.lessons.length) {
        Lessons.breakPrompt($('lessonHost'), function () { runLesson(); });
        return;
      }
      if (session.idx >= u.lessons.length) finishUnit();
      // حد الاستخدام يُفحص بين الدروس أيضًا، لا عند فتح الوحدة فقط
      else if (Store.limitReached()) showLimit();
      else runLesson();
    });
  }

  function finishUnit() {
    const u = session.unit;
    const host = $('lessonHost');
    host.innerHTML = '';
    const s = el('div', 'l-screen');
    const c = el('div', 'l-center praise');
    c.innerHTML = '<div class="praise-art">' + UI.mascot(120, 'celebrate') + '</div>' +
      '<div class="eyebrow l-eyebrow">' + (u.track === 'qu' ? 'سورة ' + u.surah.name : u.title) + '</div>' +
      '<div class="praise-text">' + (u.track === 'qu' ? 'ربنا يبارك فيك' : 'خلصنا!') + '</div>' +
      '<div class="l-hint" style="font-size:17px">' +
        (u.track === 'qu' ? 'سمّعها لبابا أو ماما' : 'اتعلمت ' + u.lessons.length + ' حاجات جديدة النهارده') +
      '</div>';
    const next = el('button', 'btn primary wide', 'كمان واحد؟');
    next.style.maxWidth = '300px';
    next.addEventListener('click', function () {
      SFX.tap();
      const units = Store.trackUnits(u.track);
      const i = units.findIndex(function (x) { return x.id === u.id; });
      const nx = units[i + 1];
      if (nx && Store.unitUnlocked(nx.id)) { openUnit(nx); return; }
      back();
    });
    const home = el('button', 'btn ghost sm', 'رجوع للمسار');
    home.addEventListener('click', function () { SFX.click(); back(); });
    c.appendChild(next);
    c.appendChild(home);
    s.appendChild(c);
    host.appendChild(s);
    Store.addStars(u.track === 'qu' ? 3 : 2);
    SFX.levelup();
    UI.burst(26);
    Store.logSession(u.track, u.title + ' (وحدة كاملة)');
  }

  $('lessonClose').innerHTML = UI.icon('close', 20);
  $('lessonClose').addEventListener('click', function () { SFX.click(); back(); });

  /* ================= ولي الأمر ================= */
  let parentUnlocked = false;
  let gateFails = 0;

  /* التكبير: مقفول في شاشات الطفل، مفتوح في شاشة ولي الأمر */
  function setZoom(allow) {
    let m = document.querySelector('meta[name=viewport]');
    if (!m) { m = document.createElement('meta'); m.name = 'viewport'; document.head.appendChild(m); }
    m.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover' +
      (allow ? ', maximum-scale=5, user-scalable=yes' : ', maximum-scale=1, user-scalable=no'));
  }

  function renderParent() {
    setZoom(true);
    const body = $('parentBody');
    const s = Store.get();
    if (!parentUnlocked) {
      body.innerHTML = '';
      const c = el('div', 'l-center');
      c.appendChild(el('div', 'l-eyebrow', 'سؤال لولي الأمر'));
      // سؤالان عشوائيان + خيارات مولّدة عشوائيًا (لا موضع ثابت للإجابة)
      const a = 11 + Math.floor(Math.random() * 39);
      const b2 = 6 + Math.floor(Math.random() * 29);
      const ans = a + b2;
      c.appendChild(el('div', 'gate-q', a + ' + ' + b2 + ' = ؟'));
      const grid = el('div', 'gate-grid');

      function fisher(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
      }
      const set = new Set([ans]);
      while (set.size < 4) {
        const d = ans + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 9));
        if (d > 0) set.add(d);
      }
      const opts = fisher(Array.from(set));
      let lock = false;
      opts.forEach(function (o) {
        const btn = el('button', 'gate-opt', String(o));
        btn.addEventListener('click', function () {
          if (lock) return;
          if (o === ans) { SFX.click(); parentUnlocked = true; renderParent(); return; }
          // غلط: قفل ١.٢ ثانية + سؤال جديد — لا يُسمح بالدخول بالتخمين
          lock = true; SFX.wrong();
          btn.classList.add('wrong');
          gateFails++;
          UI.toast(gateFails >= 2 ? 'سؤال جديد — جرّب تحسبها' : 'مش صح، حاول تاني');
          setTimeout(renderParent, 1200);
        });
        grid.appendChild(btn);
      });
      c.appendChild(grid);
      c.appendChild(el('div', 'l-hint', 'ده سؤال بسيط عشان الطفل ميدخلش لوحده'));
      body.appendChild(c);
      return;
    }

    body.innerHTML = '';
    const grid = el('div', 'stat-grid');
    [['ar', 'العربية'], ['en', 'الإنجليزية'], ['qu', 'القرآن'], ['num', 'الأرقام']].forEach(function (p) {
      const st = el('div', 'stat', '<b>' + Store.trackDone(p[0]) + '/' + Store.trackUnits(p[0]).length + '</b><span>' + p[1] + '</span>');
      grid.appendChild(st);
    });
    body.appendChild(grid);

    const g2 = el('div', 'stat-grid two');
    g2.style.marginTop = '12px';
    g2.appendChild(el('div', 'stat', '<b>' + Math.round(Store.secondsToday() / 60) + '</b><span>دقيقة النهارده</span>'));
    g2.appendChild(el('div', 'stat', '<b>' + s.stars + '</b><span>نجوم</span>'));
    body.appendChild(g2);

    const mastered = Pedagogy.Mastery.masteredCount('ar') + Pedagogy.Mastery.masteredCount('en') + Pedagogy.Mastery.masteredCount('qu');
    const due = Pedagogy.Review.due('ar').length + Pedagogy.Review.due('en').length + Pedagogy.Review.due('qu').length;
    const g3 = el('div', 'stat-grid two');
    g3.style.marginTop = '12px';
    g3.appendChild(el('div', 'stat', '<b>' + mastered + '</b><span>عنصر متقَن</span>'));
    g3.appendChild(el('div', 'stat', '<b>' + due + '</b><span>مستحق للمراجعة</span>'));
    body.appendChild(g3);

    // ---------- التلاوة بدون إنترنت ----------
    const off = el('div', 'off-card');
    off.appendChild(el('div', 'off-title', 'التلاوة بدون إنترنت'));
    const offStat = el('div', 'off-status', 'بنحسب…');
    off.appendChild(offStat);
    const bar = el('div', 'off-bar');
    const fill = el('i');
    bar.appendChild(fill);
    off.appendChild(bar);
    const offRow = el('div', 'off-actions');
    const dlBtn = el('button', 'btn primary sm', 'نزّل التلاوة');
    const rmBtn = el('button', 'btn ghost sm', 'حذف');
    offRow.appendChild(dlBtn); offRow.appendChild(rmBtn);
    off.appendChild(offRow);
    body.appendChild(off);

    let offBusy = false;
    function paintOff(st) {
      const pct = st.total ? Math.round(st.cached / st.total * 100) : 0;
      fill.style.width = pct + '%';
      if (!st.ok) { offStat.textContent = 'المتصفح لا يدعم التنزيل'; return; }
      if (st.cached >= st.total && st.total) {
        offStat.textContent = 'التلاوة كاملة على الجهاز ✓ (' + st.total + ' آية) — تشتغل بدون نت';
      } else if (st.cached === 0) {
        offStat.textContent = 'مش منزّلة — حوالي ' + st.estMb + ' ميجا (' + st.total + ' آية)';
      } else {
        offStat.textContent = 'منزّل ' + st.cached + ' من ' + st.total + ' آية (' + pct + '%)';
      }
    }
    function refreshOff() {
      if (!window.Offline) { offStat.textContent = 'غير متاح'; return; }
      window.Offline.status().then(paintOff).catch(function () { offStat.textContent = 'تعذّر الحساب'; });
    }
    refreshOff();

    dlBtn.addEventListener('click', function () {
      if (offBusy || !window.Offline) return;
      offBusy = true; dlBtn.disabled = true;
      offStat.textContent = 'بننزّل… سيبه مفتوح';
      window.Offline.start(function (pr) {
        fill.style.width = Math.round(pr.done / pr.total * 100) + '%';
        offStat.textContent = 'بننزّل ' + pr.done + ' من ' + pr.total + ' آية…';
      }).then(function (r) {
        offBusy = false; dlBtn.disabled = false;
        UI.toast(r.failed ? 'خلصنا مع ' + r.failed + ' آية فشلت — جرّب تاني' : 'التلاوة جاهزة أوفلاين');
        refreshOff();
      }).catch(function () {
        offBusy = false; dlBtn.disabled = false;
        offStat.textContent = 'التنزيل اتوقف — جرّب تاني';
      });
    });

    rmBtn.addEventListener('click', function () {
      if (offBusy || !window.Offline) return;
      offBusy = true;
      window.Offline.clear().then(function () { offBusy = false; UI.toast('اتحذفت التلاوة'); refreshOff(); });
    });

    // ---------- تشخيص الصوت ----------
    const diag = el('div', 'off-card');
    diag.style.marginTop = '12px';
    const nHuman = (window.A3 && A3.coverage) ? A3.coverage().human : 0;
    const arVoice = window.Audio2 && Audio2.hasArabicVoice ? Audio2.hasArabicVoice() : false;
    diag.innerHTML = '<div class="off-title">الصوت على هذا الجهاز</div>' +
      '<div class="off-status">تسجيلات بشرية جاهزة: <b>' + nHuman + '</b> كلمة — بتشتغل بدون إنترنت بعد أول مرة.<br>' +
      'نطق الحروف (صوت آلي) ' + (arVoice ? 'متاح على الجهاز ✓' : 'غير متاح — التطبيق هيعتمد على التسجيلات البشرية والصور بدل ما ينطق بلكنة غلط') + '.</div>';
    body.appendChild(diag);

    body.appendChild(el('div', 'parent-note',
      'بنستخدم التكرار المتباعد: كل ما الطفل يتقن حاجة بنعيدها بعد يوم، ٣ أيام، أسبوع، أسبوعين، شهر. ' +
      'كلمات المنهج كلها بتسجيلات بشرية (١١٥/١١٥)؛ الصوت المؤقت باقي في أصوات الحروف المجردة بس.'));

    // ---------- اسم الطفل (للتقارير والشهادات) ----------
    const nameRow = el('div', 'setting-row');
    nameRow.innerHTML = '<span class="sr-label">اسم الطفل</span>';
    const nameIn = document.createElement('input');
    nameIn.className = 'name-in';
    nameIn.type = 'text';
    nameIn.placeholder = 'اكتب الاسم';
    nameIn.value = s.childName || '';
    nameIn.setAttribute('aria-label', 'اسم الطفل');
    nameIn.addEventListener('change', function () {
      Store.get().childName = nameIn.value.trim().slice(0, 24);
      Store.save();
      UI.toast('تم الحفظ');
    });
    nameRow.appendChild(nameIn);
    body.appendChild(nameRow);

    // ---------- شهادات الإتمام ----------
    const doneTracks = ['ar', 'en', 'qu'].filter(function (k) {
      const t = Store.trackUnits(k).length;
      return t && Store.trackDone(k) >= t;
    });
    if (doneTracks.length) {
      const certWrap = el('div', 'cert-btns');
      doneTracks.forEach(function (k) {
        const label = { ar: 'شهادة العربية', en: 'شهادة الإنجليزية', qu: 'شهادة القرآن' }[k];
        const b = el('button', 'btn ghost sm', label);
        b.addEventListener('click', function () { openCert(k); });
        certWrap.appendChild(b);
      });
      body.appendChild(certWrap);
    }

    body.appendChild(el('div', 'setting-row',
      '<span class="sr-label">الصوت الآلي (احتياطي — مقفول)</span><div class="switch ' + (s.settings.tts ? 'on' : '') + '" data-set="tts"></div>'));
    body.appendChild(el('div', 'setting-row',
      '<span class="sr-label">حد الاستخدام اليومي</span><div style="display:flex;gap:6px">' +
      [10, 15, 20].map(function (m) {
        return '<button class="btn sm ' + (s.settings.limitMin === m ? 'primary' : 'ghost') + '" data-lim="' + m + '">' + m + ' د</button>';
      }).join('') + '</div>'));

    const priv = el('a', 'btn ghost wide', 'سياسة الخصوصية');
    priv.href = 'privacy.html';
    priv.target = '_blank';
    priv.style.marginTop = '12px';
    body.appendChild(priv);

    const reset = el('button', 'btn ghost wide', 'تصفير التقدّم');
    reset.style.marginTop = '16px';
    reset.addEventListener('click', function () {
      if (reset.dataset.confirm === '1') { Store.reset(); parentUnlocked = false; renderParent(); UI.toast('اتصفّر'); return; }
      reset.dataset.confirm = '1';
      reset.textContent = 'متأكد؟ دوس تاني';
    });
    body.appendChild(reset);

    /* ---- نسخة احتياطية / استعادة ---- */
    const tools = el('div', 'row-2');
    const bExp = el('button', 'btn ghost sm', 'نسخة احتياطية');
    bExp.addEventListener('click', function () {
      SFX.click();
      const data = JSON.stringify(Store.exportJSON());
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'noon-backup-' + Store.today() + '.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      UI.toast('اتحفظت النسخة');
    });
    const bImp = el('button', 'btn ghost sm', 'استعادة');
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json';
    file.style.display = 'none';
    file.addEventListener('change', function () {
      const f = file.files && file.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = function () {
        try {
          const ok = Store.importJSON(JSON.parse(fr.result));
          UI.toast(ok ? 'اترجعت البيانات' : 'ملف غير صالح');
          if (ok) { renderParent(); renderHome(); }
        } catch (e) { UI.toast('ملف غير صالح'); }
      };
      fr.readAsText(f);
    });
    tools.appendChild(bExp);
    tools.appendChild(bImp);
    body.appendChild(tools);
    body.appendChild(file);

    /* ---- تقرير أسبوعي قابل للطباعة ---- */
    const rep = el('button', 'btn primary wide', 'تقرير الأسبوع');
    rep.style.marginTop = '10px';
    rep.addEventListener('click', function () { SFX.click(); openReport(); });
    body.appendChild(rep);

    body.querySelector('[data-set="tts"]').addEventListener('click', function () {
      SFX.click();
      s.settings.tts = !s.settings.tts;
      Store.save();
      window.__ttsOff = !s.settings.tts;
      this.classList.toggle('on', s.settings.tts);
    });
    Array.prototype.forEach.call(body.querySelectorAll('[data-lim]'), function (b) {
      b.addEventListener('click', function () {
        SFX.click();
        s.settings.limitMin = parseInt(b.dataset.lim, 10);
        Store.save();
        renderParent();
      });
    });
  }

  /* ================= تقرير ولي الأمر ================= */
  function openReport() {
    const s = Store.get();
    const P = window.Pedagogy;
    const TR = { ar: 'العربية', en: 'الإنجليزية', qu: 'القرآن', num: 'الأرقام' };
    const wrap = el('div', 'report');
    const days = Object.keys(s.days || {}).sort().slice(-7);
    const mins = days.reduce(function (a, d) { return a + Math.round((s.days[d] || 0) / 60); }, 0);
    const mastered = P.Mastery.masteredCount('ar') + P.Mastery.masteredCount('en') + P.Mastery.masteredCount('qu');
    const name = (s.childName || '').trim();

    function pct(done, total) { return Math.round(done / Math.max(1, total) * 100); }

    // ---------- جدول التقدّم ----------
    const rows = [];
    let totalDue = 0;
    ['ar', 'en', 'qu', 'num'].forEach(function (k) {
      const done = Store.trackDone(k), total = Store.trackUnits(k).length;
      const due = P.Review.due(k).length; totalDue += due;
      const p = pct(done, total);
      rows.push('<tr><td class="rt-name">' + TR[k] + '</td>' +
        '<td><bdi>' + done + ' / ' + total + '</bdi></td>' +
        '<td><div class="rt-bar"><i style="width:' + p + '%"></i></div></td>' +
        '<td>' + p + '%</td>' +
        '<td>' + (due ? due : '—') + '</td></tr>');
    });

    // ---------- المستحق للمراجعة (أسماء) ----------
    function nameOf(track, id) {
      if (track === 'num') return 'مرحلة ' + id;
      if (track === 'qu') {
        const q = (window.QURAN || []).filter(function (x) { return String(x.n) === String(id); })[0];
        return q ? ('سورة ' + q.name) : id;
      }
      return id;
    }
    const dueAll = [];
    ['ar', 'en', 'qu', 'num'].forEach(function (k) {
      P.Review.due(k, 6).forEach(function (it) { dueAll.push({ t: k, n: nameOf(k, it.id), sc: it.score }); });
    });
    const dueHtml = dueAll.length
      ? '<ul class="rep-list">' + dueAll.map(function (d) {
          return '<li><span>' + d.n + '</span><em>' + TR[d.t] + '</em></li>';
        }).join('') + '</ul>'
      : '<p class="rep-note">مفيش عناصر مستحقة للمراجعة حاليًا.</p>';

    // ---------- التوصية ----------
    const rec = (function () {
      if (mins === 0) return 'لسه مفيش استخدام مسجّل الأسبوع ده. ابدأ بجلسة ١٠ دقايق ٣ مرات أسبوعياً.';
      if (mastered < 6) return 'الطفل في مرحلة التأسيس: ركّز على درس واحد يومياً + مراجعة الكروت القديمة قبل الجديد.';
      if (P.Mastery.masteredCount('ar') >= 10) return 'أساس الحروف ثابت. ابدأ إدخال قراءة الكلمات (بَاب / مَاء / نُور) وجلسة قرآن قصيرة.';
      return 'التقدّم منتظم. الأفضل تقسيم الجلسة: ٥ دقايق مراجعة + ١٠ دقايق درس جديد.';
    })();

    const av = (window.A3 && A3.coverage) ? A3.coverage() : { human: 0 };
    const cur = Store.currentLesson('ar');

    wrap.innerHTML =
      '<header class="rep-head">' +
        '<div class="rep-mark">نون</div>' +
        '<div class="rep-titles"><h1>تقرير التقدّم الأسبوعي</h1>' +
        '<p>' + (name ? 'الطفل: <b>' + name + '</b> · ' : '') + Store.today() + '</p></div>' +
      '</header>' +
      '<div class="rep-kpis">' +
        '<div><b>' + mins + '</b><span>دقيقة هذا الأسبوع</span></div>' +
        '<div><b>' + mastered + '</b><span>عنصر متقَن</span></div>' +
        '<div><b>' + totalDue + '</b><span>مستحق للمراجعة</span></div>' +
        '<div><b>' + s.stars + '</b><span>نجوم</span></div>' +
      '</div>' +
      '<h2>تقدّم المسارات</h2>' +
      '<table class="rep-table"><thead><tr><th>المسار</th><th>المكتمل</th><th>النسبة</th><th></th><th>مراجعة</th></tr></thead>' +
      '<tbody>' + rows.join('') + '</tbody></table>' +
      '<h2>مستحق للمراجعة</h2>' + dueHtml +
      '<h2>التوصية</h2><p class="rep-note">' + rec + '</p>' +
      '<h2>الدرس القادم</h2><p class="rep-note">' + (cur ? cur.title : '—') + '</p>' +
      '<h2>جودة الصوت</h2><p class="rep-note">كلمات المنهج كلها بتسجيلات بشرية (' + av.human +
        ' ملفًا). الصوت المؤقت (TTS) باقٍ في أصوات الحروف المجردة فقط. المصدر: Shtooka Project وLingua Libre عبر ويكيميديا كومنز — CC BY / CC BY-SA.</p>' +
      '<div class="rep-sign"><span>توقيع ولي الأمر</span><span class="rep-line"></span><span>التاريخ</span></div>' +
      '<p class="rep-foot">تقرير آلي من تطبيق «نون» — كل البيانات على الجهاز ولا يخرج منه شيء.</p>';

    // ---------- الشهادات (للمسارات المكتملة) ----------
    const certs = [];
    ['ar', 'en', 'qu', 'num'].forEach(function (k) {
      const done = Store.trackDone(k), total = Store.trackUnits(k).length;
      if (total && done >= total) certs.push(k);
    });
    certs.forEach(function (k) {
      wrap.appendChild(certNode(TR[k], name, s.stars));
    });

    mountReport(wrap);
  }

  /* شهادة إتمام — تُطبع كصفحة مستقلة */
  function certNode(trackName, name, stars) {
    const c = el('div', 'cert-page');
    c.innerHTML =
      '<div class="cert-frame">' +
        '<div class="cert-eyebrow">تطبيق نون · رحلة التعلّم</div>' +
        '<h2>شهادة إتمام</h2>' +
        '<p class="cert-to">تُمنح هذه الشهادة إلى</p>' +
        '<div class="cert-name">' + (name || '________________') + '</div>' +
        '<p class="cert-body">لإتمامه مسار <b>' + trackName + '</b> كاملًا، وإتقان دروسه ومراجعاته<br>' +
        'في القراءة والكتابة والفهم والاستنتاج.</p>' +
        '<div class="cert-stars">' + '★'.repeat(Math.min(5, Math.max(1, Math.round((stars || 0) / 20)))) + '</div>' +
        '<div class="cert-foot"><span>' + Store.today() + '</span><span class="cert-seal">نون</span><span>توقيع المعلم</span></div>' +
      '</div>';
    return c;
  }

  function mountReport(wrap) {
    const host = document.createElement('div');
    host.className = 'report-overlay';
    const bar = el('div', 'report-bar');
    const print = el('button', 'btn primary sm', 'طباعة / حفظ PDF');
    print.addEventListener('click', function () { window.print(); });
    const close = el('button', 'btn ghost sm', 'إغلاق');
    close.addEventListener('click', function () { host.remove(); });
    bar.appendChild(print); bar.appendChild(close);
    host.appendChild(bar);
    host.appendChild(wrap);
    document.body.appendChild(host);
    return host;
  }

  /* شهادة مسار واحد (زر منفصل) */
  function openCert(track) {
    const s = Store.get();
    const TR = { ar: 'العربية', en: 'الإنجليزية', qu: 'القرآن', num: 'الأرقام' };
    const wrap = el('div', 'report');
    wrap.appendChild(certNode(TR[track] || 'العربية', (s.childName || '').trim(), s.stars));
    mountReport(wrap);
  }

  /* ================= التهيئة ================= */
  $('btnParent').innerHTML = UI.icon('user', 20);
  $('btnParent2').addEventListener('click', function () { SFX.click(); go('parent'); renderParent(); });
  $('btnParent').addEventListener('click', function () { SFX.click(); go('parent'); renderParent(); });
  $('trackBack').innerHTML = UI.icon('back', 20);
  $('trackBack').addEventListener('click', function () { SFX.click(); back(); });
  $('parentBack').innerHTML = UI.icon('back', 20);
  $('parentBack').addEventListener('click', function () { SFX.click(); parentUnlocked = false; back(); });

  document.addEventListener('pointerdown', function once() {
    SFX.unlock(); Audio2.unlock(); if (window.A3 && A3.unlock) A3.unlock();
    document.removeEventListener('pointerdown', once);
  });

  // حساب وقت الاستخدام
  setInterval(function () { if (current === 'lesson') Store.addSeconds(5); }, 5000);

  window.addEventListener('popstate', function () { if (stack.length > 1) back(); });
  history.replaceState({ s: 'home' }, '');

  renderHome();
  showScreen('home');
  setTimeout(function () { Audio2.unlock(); }, 400);

  // خطّافات للاختبار الآلي
  window.__app = {
    go: go, back: back, state: state, session: session,
    openUnit: openUnit, renderHome: renderHome, renderTrack: renderTrack,
    parent: function () { parentUnlocked = true; go('parent'); renderParent(); },
    current: function () { return current; }
  };

  if (state.qa) window.__ready = true;
})();
