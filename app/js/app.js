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
    if (opts.push !== false) stack.push(name);
    showScreen(name, opts.dir);
  }

  function back() {
    if (stack.length > 1) stack.pop();
    const name = stack[stack.length - 1] || 'home';
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

    const host = $('trackCards');
    host.innerHTML = '';
    ['ar', 'en', 'qu'].forEach(function (k) {
      const t = SYLLABUS.tracks[k];
      const units = Store.trackUnits(k);
      const done = Store.trackDone(k);
      const pct = units.length ? Math.round(done / units.length * 100) : 0;
      const icon = k === 'ar' ? 'أ' : (k === 'en' ? 'A' : UI.icon('book', 30));
      const meta = k === 'qu'
        ? done + ' من ' + units.length + ' سورة'
        : done + ' من ' + units.length + (k === 'ar' ? ' حرف' : ' صوت');

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
    units.forEach(function (u, i) {
      const isDone = Store.unitDone(u.id);
      const unlocked = Store.unitUnlocked(u.id);
      const isCurrent = !isDone && unlocked;

      if (track === 'qu' && u.station && u.station !== lastStation) {
        lastStation = u.station;
        path.appendChild(el('div', 'station-label', u.station));
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
      path.appendChild(btn);
    });
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
      if (session.idx >= u.lessons.length) finishUnit();
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

  function renderParent() {
    const body = $('parentBody');
    const s = Store.get();
    if (!parentUnlocked) {
      body.innerHTML = '';
      const c = el('div', 'l-center');
      c.appendChild(el('div', 'l-eyebrow', 'اكتب الرمز السري'));
      const dots = el('div', 'pin-dots');
      for (let i = 0; i < 4; i++) dots.appendChild(el('i'));
      c.appendChild(dots);
      const pad = el('div', 'pinpad');
      let buf = '';
      '123456789'.split('').concat(['', '0', '⌫']).forEach(function (k) {
        const b = el('button', 'pin-key', k);
        if (!k) { b.style.visibility = 'hidden'; }
        b.addEventListener('click', function () {
          SFX.click();
          if (k === '⌫') buf = buf.slice(0, -1);
          else if (buf.length < 4) buf += k;
          Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i < buf.length); });
          if (buf.length === 4) {
            setTimeout(function () {
              if (buf === (Store.get().settings.pin || '1234')) { parentUnlocked = true; renderParent(); }
              else { SFX.wrong(); UI.toast('الرمز غلط'); buf = ''; Array.prototype.forEach.call(dots.children, function (d) { d.classList.remove('on'); }); }
            }, 160);
          }
        });
        pad.appendChild(b);
      });
      c.appendChild(pad);
      body.appendChild(c);
      return;
    }

    body.innerHTML = '';
    const grid = el('div', 'stat-grid');
    [['ar', 'العربية'], ['en', 'الإنجليزية'], ['qu', 'القرآن']].forEach(function (p) {
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

    body.appendChild(el('div', 'parent-note',
      'بنستخدم التكرار المتباعد: كل ما الطفل يتقن حاجة بنعيدها بعد يوم، ٣ أيام، أسبوع، أسبوعين، شهر. ' +
      'الصوت الحالي مؤقت (TTS) ولازم يتستبدل بتسجيلات بشرية قبل الاستخدام الطويل.'));

    body.appendChild(el('div', 'setting-row',
      '<span class="sr-label">صوت الحروف (مؤقت)</span><div class="switch ' + (s.settings.tts ? 'on' : '') + '" data-set="tts"></div>'));
    body.appendChild(el('div', 'setting-row',
      '<span class="sr-label">حد الاستخدام اليومي</span><div style="display:flex;gap:6px">' +
      [15, 20, 25].map(function (m) {
        return '<button class="btn sm ' + (s.settings.limitMin === m ? 'primary' : 'ghost') + '" data-lim="' + m + '">' + m + ' د</button>';
      }).join('') + '</div>'));

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
    const wrap = el('div', 'report');
    const days = Object.keys(s.days || {}).sort().slice(-7);
    const mins = days.reduce(function (a, d) { return a + Math.round((s.days[d] || 0) / 60); }, 0);
    const lines = [];
    ['ar', 'en', 'qu'].forEach(function (k) {
      const name = { ar: 'العربية', en: 'الإنجليزية', qu: 'القرآن' }[k];
      const done = Store.trackDone(k), total = Store.trackUnits(k).length;
      const due = P.Review.due(k).length;
      lines.push('<tr><td>' + name + '</td><td>' + done + ' / ' + total + '</td><td>' +
        Math.round(done / Math.max(1, total) * 100) + '%</td><td>' + due + '</td></tr>');
    });
    const mastered = P.Mastery.masteredCount('ar') + P.Mastery.masteredCount('en') + P.Mastery.masteredCount('qu');
    const cur = Store.currentLesson('ar');
    const rec = (function () {
      if (mins === 0) return 'لسه مفيش استخدام مسجّل الأسبوع ده. ابدأ بجلسة ١٠ دقايق ٣ مرات أسبوعياً.';
      if (mastered < 6) return 'الطفل في مرحلة التأسيس: ركّز على درس واحد يومياً + مراجعة الكروت القديمة قبل الجديد.';
      if (P.Mastery.masteredCount('ar') >= 10) return 'أساس الحروف ثابت. ابدأ إدخال قراءة الكلمات (بَاب / مَاء / نُور) وجلسة قرآن قصيرة.';
      return 'التقدّم منتظم. الأفضل تقسيم الجلسة: ٥ دقايق مراجعة + ١٠ دقايق درس جديد.';
    })();

    const av = (window.A3 && A3.coverage) ? A3.coverage() : { human: 0 };
    wrap.innerHTML =
      '<h2>تقرير «نون» الأسبوعي</h2>' +
      '<p class="rep-meta">' + Store.today() + ' · وقت الأسبوع: ' + mins + ' دقيقة · عناصر متقنة: ' + mastered + '</p>' +
      '<table class="rep-table"><thead><tr><th>المسار</th><th>المكتمل</th><th>النسبة</th><th>مستحق للمراجعة</th></tr></thead><tbody>' +
      lines.join('') + '</tbody></table>' +
      '<h3>التوصية</h3><p class="rep-note">' + rec + '</p>' +
      '<h3>الدرس القادم</h3><p class="rep-note">' + (cur ? cur.title : '—') + '</p>' +
      '<h3>الأصوات</h3><p class="rep-note">تسجيلات بشرية متاحة: ' + av.human +
      ' — الباقي صوت مؤقت (TTS) لحين استبداله. المصدر: Wikimedia Commons / Lingua Libre (CC BY-SA 4.0).</p>' +
      '<p class="rep-foot">تقرير آلي من تطبيق «نون» — لا يخرج أي شيء من الجهاز.</p>';

    const host = document.createElement('div');
    host.className = 'report-overlay';
    const close = el('button', 'btn ghost sm', 'إغلاق');
    close.addEventListener('click', function () { host.remove(); });
    const print = el('button', 'btn primary sm', 'طباعة / PDF');
    print.addEventListener('click', function () { window.print(); });
    const bar = el('div', 'report-bar');
    bar.appendChild(print); bar.appendChild(close);
    host.appendChild(bar);
    host.appendChild(wrap);
    document.body.appendChild(host);
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
    SFX.unlock(); Audio2.unlock(); document.removeEventListener('pointerdown', once);
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
