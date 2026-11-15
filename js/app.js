/* ============ «نون» — الموجّه والشاشات ============ */
(function () {
  'use strict';
  const el = UI.el;
  const esc = UI.esc;
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
    // مغادرة لوحة ولي الأمر بأي طريقة (زر داخلي، رجوع النظام/المتصفح) تقفلها من جديد
    if (current === 'parent' && name !== 'parent') { parentUnlocked = false; closeOverlays(); }
    current = name;
    activeTick();
  }
  function closeOverlays() {
    Array.prototype.forEach.call(document.querySelectorAll('.report-overlay'), function (o) { o.remove(); });
  }

  function go(name, opts) {
    opts = opts || {};
    if (opts.push !== false && stack[stack.length - 1] !== name) {
      stack.push(name);
      try { history.pushState({ s: name, d: stack.length }, ''); } catch (e) {}
    }
    showScreen(name, opts.dir);
  }

  function internalBack() {
    try { window.Lessons && Lessons.stopAll && Lessons.stopAll(); } catch (e) {}
    if (stack.length > 1) stack.pop();
    const name = stack[stack.length - 1] || 'home';
    showScreen(name, 'back');
    if (name === 'home') renderHome();
    if (name === 'track') renderTrack(state.track);
  }

  /* التنقّل: مكدّس داخلي + سجلّ المتصفح (history) حتى يعمل زر الرجوع في أندرويد داخل التطبيق
     بدل ما يقفله. نفس الشاشة لا تُدفع مرتين (كان يتطلب ضغطتين على X بعد «كمان واحد؟»). */
  let pendingBack = null;

  function back() {
    const before = stack.length;
    if (before > 1 && history.state && history.state.d === before) {
      pendingBack = before;
      history.back();                       // popstate يكمل الباقي
      setTimeout(function () {              // أمان: لو لم يصل popstate
        if (pendingBack === before && stack.length === before) { pendingBack = null; internalBack(); }
      }, 250);
    } else {
      internalBack();
    }
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
          '<span class="rc-s">' + esc(pickU.title) + ' — نفتكرها مع بعض؟</span></span>');
        card.addEventListener('click', function () { SFX.tap(); openUnit(pickU); });
        rev.appendChild(card);
      }
    }

    const host = $('trackCards');
    host.innerHTML = '';
    ['ar', 'en', 'qu', 'num'].forEach(function (k) {
      const t = SYLLABUS.tracks[k];
      const cnt = trackCounts(k);
      const pct = cnt.pct;
      const icon = k === 'ar' ? 'أ' : (k === 'en' ? 'A' : (k === 'num' ? '١٢٣' : UI.icon('book', 30)));
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

  /** عدّاد موحّد لكل الشاشات: المحتوى الحقيقي (٢٨ حرف / ٤٢ صوت / ٤٩ سورة / ١٠ مراحل)
   *  منفصل عن عدد وحدات المنهج (اللي فيها حركات وقراءة وتفكير ومراجعة). */
  function trackCounts(k) {
    const units = Store.trackUnits(k);
    function doneU(u) { return Store.unitDone(u.id); }
    let core;
    if (k === 'ar') core = { list: units.filter(function (u) { return u.letter; }), noun: 'حرف' };
    else if (k === 'en') core = { list: units.filter(function (u) { return u.sound; }), noun: 'صوت' };
    else if (k === 'qu') core = { list: units.filter(function (u) { return u.surah; }), noun: 'سورة' };
    else core = { list: units, noun: 'مرحلة' };
    const unitsDone = units.filter(doneU).length;
    return {
      done: core.list.filter(doneU).length, total: core.list.length, noun: core.noun,
      unitsDone: unitsDone, unitsTotal: units.length,
      pct: units.length ? Math.round(unitsDone / units.length * 100) : 0
    };
  }

  /* ================= مسار ================= */
  function renderTrack(track) {
    const t = SYLLABUS.tracks[track];
    const units = Store.trackUnits(track);
    const cnt = trackCounts(track);
    $('trackTitle').textContent = t.name;
    $('trackStarsN').textContent = Store.get().stars;
    $('trackBar').style.width = cnt.pct + '%';
    $('trackSub').textContent = (track === 'qu' ? 'بنحفظ بالسهل الأول — ' : 'منهج متدرّج — ') +
      'خلصنا ' + cnt.done + ' من ' + cnt.total + ' ' + cnt.noun +
      (cnt.unitsTotal !== cnt.total ? ' · ' + cnt.unitsDone + ' من ' + cnt.unitsTotal + ' وحدة' : '');

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
      else if (track === 'en') nodeInner = Glyph.svg(String(u.sound.disp).split(' ')[0], [], { size: 60, color: 'var(--teal)', latin: true, emBox: true }) +
        (u.sound.tag ? '<span class="snd-tag">' + esc(u.sound.tag) + '</span>' : '');
      else nodeInner = UI.icon('book', 24);

      btn.innerHTML =
        '<span class="unit-node">' + nodeInner + '</span>' +
        '<span class="unit-body">' +
          '<span class="unit-title">' + esc(u.title) + '</span>' +
          '<span class="unit-sub">' + (isDone ? 'خلصناه ✓' : (unlocked ? esc(u.sub) : 'مقفول')) + '</span>' +
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
    try { window.Lessons && Lessons.stopAll && Lessons.stopAll(); } catch (e) {}
    if (Store.limitReached()) { showLimit(); return; }
    state.unit = u;
    // ابدأ من أول درس غير مكتمل، أو من الأول لو الوحدة مكتملة (مراجعة)
    let idx = 0;
    const st = Store.get();
    for (let i = 0; i < u.lessons.length; i++) {
      if (!st.lessons[u.lessons[i].id]) { idx = i; break; }
    }
    const allDone = u.lessons.every(function (l) { return !!st.lessons[l.id]; });
    // وحدة اتقفلت قبل نظام المكافأة الواحدة: نعتبر مكافأتها اتاخدت (إعادة التدريب بلا نجوم إضافية)
    if (allDone && !Store.unitRewarded(u.id)) Store.claimUnitReward(u.id);
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
    // مكافأة إتمام الوحدة مرة واحدة فقط — إعادة التدريب لا تضيف نجوماً
    const firstTime = Store.claimUnitReward(u.id);
    const bonus = firstTime ? (u.track === 'qu' ? 3 : 2) : 0;
    c.innerHTML = '<div class="praise-art">' + UI.mascot(120, 'celebrate') + '</div>' +
      '<div class="eyebrow l-eyebrow">' + esc(u.track === 'qu' ? 'سورة ' + u.surah.name : u.title) + '</div>' +
      '<div class="praise-text">' + (u.track === 'qu' ? 'ربنا يبارك فيك' : 'خلصنا!') + '</div>' +
      '<div class="l-hint" style="font-size:17px">' +
        (u.track === 'qu' ? 'سمّعها لبابا أو ماما' : (firstTime ? 'اتعلمت ' + u.lessons.length + ' حاجات جديدة النهارده' : 'راجعناها تاني — برافو عليك')) +
      '</div>' +
      (bonus ? '<div class="unit-bonus" data-bonus="' + bonus + '">+' + bonus + ' ⭐</div>' : '');
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
    if (bonus) Store.addStars(bonus);
    SFX.levelup();
    UI.burst(26);
    Store.logSession(u.track, u.title + ' (وحدة كاملة)');
  }

  $('lessonClose').innerHTML = UI.icon('close', 20);
  $('lessonClose').addEventListener('click', function () { SFX.click(); back(); });

  /* ================= ولي الأمر ================= */
  let parentUnlocked = false;
  let gateFails = 0;

  function renderParent() {
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
    if (!Store.storageOk() || !Store.probeStorage()) {
      body.appendChild(el('div', 'storage-warn',
        '⚠️ التقدّم مش بيتحفظ على الجهاز دلوقتي (مساحة التخزين ممتلية أو المتصفح مانعها — مثلاً وضع التصفح الخفي). ' +
        'اعمل «نسخة احتياطية» من تحت، وفضّي مساحة أو افتح التطبيق في وضع عادي.'));
    }
    const grid = el('div', 'stat-grid');
    [['ar', 'العربية'], ['en', 'الإنجليزية'], ['qu', 'القرآن'], ['num', 'الأرقام']].forEach(function (p) {
      const c = trackCounts(p[0]);
      const st = el('div', 'stat', '<b><bdi>' + c.done + '/' + c.total + '</bdi></b><span>' + p[1] + ' · ' + c.noun + '</span>' +
        '<small class="stat-sub">' + c.unitsDone + ' من ' + c.unitsTotal + ' وحدة</small>');
      st.dataset.track = p[0];
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
      'كلمات المنهج بتسجيلات بشرية، وأسماء وأصوات الحروف العربية الـ٢٨ كمان. أصوات الإنجليزي المجرّدة (الفونيمات) لسه مش مسجّلة — ' +
      'عشان كده التطبيق بيسمّع الطفل كلمة المثال بصوت بشري بدل ما ينطق رمز الحرف بصوت آلي. ' +
      'خطوة «قولها لوحدك» في القرآن ما فيهاش تقييم صوتي: الاختبار بيقيس إن الطفل يميّز الآية بالسمع، والتسميع الحقيقي بيكون لولي الأمر.'));

    // ---------- اسم الطفل (للتقارير والشهادات) ----------
    const nameRow = el('div', 'setting-row');
    nameRow.innerHTML = '<span class="sr-label">اسم الطفل</span>';
    const nameIn = document.createElement('input');
    nameIn.className = 'name-in';
    nameIn.type = 'text';
    nameIn.placeholder = 'اكتب الاسم';
    nameIn.value = s.childName || '';
    nameIn.setAttribute('aria-label', 'اسم الطفل');
    nameIn.maxLength = 24;
    nameIn.addEventListener('change', function () {
      // نص عادي فقط: بنشيل علامات HTML، والعرض نفسه بيعمل escape كمان
      const clean = nameIn.value.replace(/[<>"'`&\u0000-\u001F]/g, '').trim().slice(0, 24);
      Store.get().childName = clean;
      nameIn.value = clean;
      UI.toast(Store.save() ? 'تم الحفظ' : 'مقدرناش نحفظ — التخزين ممتلي أو محظور');
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
      '<span class="sr-label" id="ttsLbl">الصوت الآلي لنطق التعليمات وأسماء الحروف</span>' +
      '<button type="button" class="switch ' + (Store.ttsOn() ? 'on' : '') + '" data-set="tts" role="switch" aria-labelledby="ttsLbl" aria-checked="' + Store.ttsOn() + '"></button>'));
    (function voiceRow() {
      if (!window.Audio2 || !Audio2.hasTTS()) return;
      const row = el('div', 'setting-row', '<span class="sr-label">صوت الجهاز العربي</span>');
      const box = document.createElement('div'); box.style.cssText = 'display:flex;gap:8px;align-items:center;width:100%';
      const list = Audio2.voiceList('ar-SA');
      if (!list.length) {
        box.innerHTML = '<span style="font-size:.8rem;opacity:.7">مفيش صوت عربي على الجهاز — الحروف والكلمات المسجّلة شغّالة عادي. ثبّت صوت عربي من إعدادات الجهاز (Text-to-speech).</span>';
      } else {
        const sel = document.createElement('select'); sel.setAttribute('aria-label', 'اختيار الصوت العربي'); sel.style.cssText = 'flex:1;min-width:0;padding:10px;border-radius:12px;font-family:inherit;font-size:.85rem';
        const cur = Audio2.currentVoice('ar-SA');
        list.forEach(function (v) { const o = document.createElement('option'); o.value = v.name; o.textContent = v.name + ' (' + v.lang + ')'; if (v.name === cur) o.selected = true; sel.appendChild(o); });
        const t = el('button', 'btn ghost sm', 'جرّب');
        sel.addEventListener('change', function () { Audio2.setVoice('ar-SA', sel.value); });
        t.addEventListener('click', function () { SFX.click(); Audio2.setVoice('ar-SA', sel.value); Audio2.say('مَرْحَبًا يا بَطَل، أَنَا نُون', 'ar-SA', 0.86); });
        box.appendChild(sel); box.appendChild(t);
      }
      row.style.flexWrap = 'wrap'; row.appendChild(box); body.appendChild(row);
    })();
    body.appendChild(el('div', 'setting-row',
      '<span class="sr-label">حد الاستخدام اليومي</span><div style="display:flex;gap:6px">' +
      [10, 15, 20].map(function (m) {
        return '<button type="button" class="btn sm ' + (s.settings.limitMin === m ? 'primary' : 'ghost') + '" data-lim="' + m + '" aria-pressed="' + (s.settings.limitMin === m) + '">' + m + ' د</button>';
      }).join('') + '</div>'));

    const priv = el('a', 'btn ghost wide', 'سياسة الخصوصية');
    priv.href = 'privacy.html';
    priv.target = '_blank';
    priv.style.marginTop = '12px';
    body.appendChild(priv);

    const reset = el('button', 'btn ghost wide', 'تصفير التقدّم');
    reset.style.marginTop = '16px';
    reset.addEventListener('click', function () {
      if (reset.dataset.confirm === '1') { const ok = Store.reset(); parentUnlocked = false; renderParent(); renderHome(); UI.toast(ok ? 'اتصفّر' : 'اتصفّر هنا بس مقدرناش نحفظ على الجهاز'); return; }
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
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      UI.toast('اتعمل ملف النسخة — اتأكد إنه نزل في التنزيلات (فيه اسم الطفل وسجلّه)', 3600);
    });
    const bImp = el('button', 'btn ghost sm', 'استعادة');
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json,.json';
    file.style.display = 'none';
    file.addEventListener('change', function () {
      const f = file.files && file.files[0];
      file.value = '';
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) { UI.toast('الملف كبير قوي — ده مش ملف نسخة «نون»'); return; }
      const fr = new FileReader();
      fr.onload = function () {
        let obj = null;
        try { obj = JSON.parse(fr.result); } catch (e) { UI.toast('ملف غير صالح'); return; }
        const ok = Store.importJSON(obj);
        UI.toast(ok ? 'اترجعت البيانات' : (obj && obj.app === 'noon' && Store.storageOk() === false ? 'مقدرناش نحفظ — التخزين ممتلي أو محظور' : 'ملف غير صالح'));
        if (ok) { renderParent(); renderHome(); }
      };
      fr.onerror = function () { UI.toast('مقدرناش نقرا الملف'); };
      fr.readAsText(f);
    });
    bImp.addEventListener('click', function () { SFX.click(); file.click(); });   // كان الزر بلا أي فعل
    tools.appendChild(bExp);
    tools.appendChild(bImp);
    body.appendChild(tools);
    body.appendChild(file);

    /* ---- تقرير أسبوعي قابل للطباعة ---- */
    const rep = el('button', 'btn primary wide', 'تقرير الأسبوع');
    rep.style.marginTop = '10px';
    rep.addEventListener('click', function () { SFX.click(); openReport(); });
    body.appendChild(rep);

    // زر حقيقي: يشتغل باللمس وبلوحة المفاتيح (Enter / Space) وقارئ الشاشة يقرا حالته
    body.querySelector('[data-set="tts"]').addEventListener('click', function () {
      SFX.click();
      Store.setTts(!Store.ttsOn());
      this.classList.toggle('on', Store.ttsOn());
      this.setAttribute('aria-checked', String(Store.ttsOn()));
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
    // آخر ٧ أيام تقويمية من النهارده — الأيام القديمة لا تدخل في «هذا الأسبوع»
    const week = Store.lastDays(7);
    const mins = Math.round(week.reduce(function (a, d) { return a + d.seconds; }, 0) / 60);
    const mastered = P.Mastery.masteredCount('ar') + P.Mastery.masteredCount('en') + P.Mastery.masteredCount('qu');
    const name = (s.childName || '').trim();

    function pct(done, total) { return Math.round(done / Math.max(1, total) * 100); }

    // ---------- جدول التقدّم: المحتوى الحقيقي + الوحدات بشكل منفصل ----------
    const rows = [];
    let totalDue = 0;
    ['ar', 'en', 'qu', 'num'].forEach(function (k) {
      const c = trackCounts(k);
      const due = P.Review.due(k).length; totalDue += due;
      rows.push('<tr data-track="' + k + '"><td class="rt-name">' + TR[k] + '</td>' +
        '<td><bdi>' + c.done + ' / ' + c.total + '</bdi> ' + c.noun + '</td>' +
        '<td><bdi>' + c.unitsDone + ' / ' + c.unitsTotal + '</bdi></td>' +
        '<td><div class="rt-bar"><i style="width:' + c.pct + '%"></i></div> ' + c.pct + '%</td>' +
        '<td>' + (due ? due : '—') + '</td></tr>');
    });

    // ---------- أيام الأسبوع ----------
    const weekHtml = '<div class="rep-week">' + week.map(function (d) {
      return '<span data-day="' + d.day + '"><b>' + Math.round(d.seconds / 60) + '</b><em>' + d.day.slice(5) + '</em></span>';
    }).join('') + '</div>';

    // ---------- المستحق للمراجعة (أسماء مفهومة) ----------
    function nameOf(track, id) {
      if (track === 'num') return 'مرحلة ' + id;
      if (track === 'qu') {
        const q = (window.QURAN || []).filter(function (x) { return String(x.n) === String(id); })[0];
        return q ? ('سورة ' + q.name) : id;
      }
      if (track === 'ar') {
        const l = CURRICULUM.letterById(id);
        if (l) return 'حرف ' + l.ch;
        if (/^h\./.test(id)) { const h = (SYLLABUS.harakat || []).filter(function (x) { return 'h.' + x.key === id; })[0]; if (h) return h.name; }
        if (/^read\./.test(id)) return 'قراءة «' + id.slice(5) + '»';
      }
      if (track === 'en') {
        const sd = CURRICULUM.sounds.filter(function (x) { return String(x.oid) === String(id); })[0];
        if (sd) return 'صوت ' + sd.disp + (sd.tag ? ' (' + sd.tag + ')' : '') + ' — ' + sd.w;
        if (/^blend\./.test(id)) return 'تركيب ' + id.slice(6);
      }
      return id;
    }
    const dueAll = [];
    ['ar', 'en', 'qu', 'num'].forEach(function (k) {
      P.Review.due(k, 6).forEach(function (it) { dueAll.push({ t: k, n: nameOf(k, it.id), sc: it.score }); });
    });
    const dueHtml = dueAll.length
      ? '<ul class="rep-list">' + dueAll.map(function (d) {
          return '<li><span>' + esc(d.n) + '</span><em>' + TR[d.t] + '</em></li>';
        }).join('') + '</ul>'
      : '<p class="rep-note">مفيش عناصر مستحقة للمراجعة حاليًا.</p>';

    // ---------- الدرس القادم: الوحدة الحقيقية والخطوة فيها لكل مسار ----------
    const nextHtml = '<ul class="rep-list rep-next">' + ['ar', 'en', 'qu', 'num'].map(function (k) {
      const c = Store.currentLesson(k);
      if (!c) return '';
      const txt = c.finished ? 'المسار خلص ✓' : (c.unit.title + ' — خطوة ' + c.step + ' من ' + c.steps);
      return '<li data-track="' + k + '"><span>' + esc(txt) + '</span><em>' + TR[k] + '</em></li>';
    }).join('') + '</ul>';

    // ---------- التوصية ----------
    const rec = (function () {
      if (mins === 0) return 'لسه مفيش استخدام مسجّل آخر ٧ أيام. ابدأ بجلسة ١٠ دقايق ٣ مرات أسبوعياً.';
      if (mastered < 6) return 'الطفل في مرحلة التأسيس: ركّز على درس واحد يومياً + مراجعة الكروت القديمة قبل الجديد.';
      if (P.Mastery.masteredCount('ar') >= 10) return 'أساس الحروف ثابت. ابدأ إدخال قراءة الكلمات (بَاب / مَاء / نُور) وجلسة قرآن قصيرة.';
      return 'التقدّم منتظم. الأفضل تقسيم الجلسة: ٥ دقايق مراجعة + ١٠ دقايق درس جديد.';
    })();

    const quDone = Store.surahsDoneCount(), quHeard = Store.surahsHeardCount();

    wrap.innerHTML =
      '<header class="rep-head">' +
        '<div class="rep-mark">نون</div>' +
        '<div class="rep-titles"><h1>تقرير التقدّم الأسبوعي</h1>' +
        '<p>' + (name ? 'الطفل: <b class="rep-child">' + esc(name) + '</b> · ' : '') + Store.today() + '</p></div>' +
      '</header>' +
      '<div class="rep-kpis">' +
        '<div><b class="rep-mins">' + mins + '</b><span>دقيقة آخر ٧ أيام</span></div>' +
        '<div><b>' + mastered + '</b><span>عنصر متقَن</span></div>' +
        '<div><b>' + totalDue + '</b><span>مستحق للمراجعة</span></div>' +
        '<div><b>' + s.stars + '</b><span>نجوم</span></div>' +
      '</div>' +
      '<h2>آخر ٧ أيام (دقايق)</h2>' + weekHtml +
      '<h2>تقدّم المسارات</h2>' +
      '<table class="rep-table"><thead><tr><th>المسار</th><th>المحتوى</th><th>الوحدات</th><th>النسبة</th><th>مراجعة</th></tr></thead>' +
      '<tbody>' + rows.join('') + '</tbody></table>' +
      '<h2>القرآن: إيه اللي اتقاس فعلاً</h2><p class="rep-note">' +
        'سور خلصها الطفل في التطبيق: <b>' + quDone + '</b> — منها <b>' + quHeard + '</b> سمّعها لولي الأمر وأكّد ولي الأمر إنها صح. ' +
        'التطبيق ما بيسمعش صوت الطفل ولا بيقيّم التلاوة؛ اختباره بيقيس تمييز الآية بالسمع والنص بس. التسميع والتصحيح مسؤولية ولي الأمر أو المحفّظ.</p>' +
      '<h2>مستحق للمراجعة</h2>' + dueHtml +
      '<h2>التوصية</h2><p class="rep-note">' + rec + '</p>' +
      '<h2>الدرس القادم</h2>' + nextHtml +
      '<h2>جودة الصوت</h2><p class="rep-note">كلمات المنهج وأسماء وأصوات الحروف العربية بتسجيلات بشرية. أصوات الإنجليزي المجرّدة لسه مش مسجّلة، فالتطبيق بيسمّع كلمة المثال بصوت بشري بدلها. ' +
        'المصادر: Shtooka Project وLingua Libre عبر ويكيميديا كومنز — CC BY / CC BY-SA. التلاوة: الشيخ مشاري العفاسي عبر cdn.islamic.network.</p>' +
      '<div class="rep-sign"><span>توقيع ولي الأمر</span><span class="rep-line"></span><span>التاريخ</span></div>' +
      '<p class="rep-foot">تقرير آلي من تطبيق «نون» — بيانات الطفل محفوظة على الجهاز فقط. (التلاوة بتتجاب من خدمة خارجية — التفاصيل في سياسة الخصوصية.)</p>';

    // ---------- الشهادات (للمسارات المكتملة) ----------
    ['ar', 'en', 'qu', 'num'].forEach(function (k) {
      const total = Store.trackUnits(k).length;
      if (total && Store.trackDone(k) >= total) wrap.appendChild(certNode(TR[k], name, s.stars));
    });

    mountReport(wrap);
  }

  /* شهادة إتمام — تُطبع كصفحة مستقلة. الاسم يُكتب كنص فقط (textContent) */
  function certNode(trackName, name, stars) {
    const c = el('div', 'cert-page');
    c.innerHTML =
      '<div class="cert-frame">' +
        '<div class="cert-eyebrow">تطبيق نون · رحلة التعلّم</div>' +
        '<h2>شهادة إتمام</h2>' +
        '<p class="cert-to">تُمنح هذه الشهادة إلى</p>' +
        '<div class="cert-name"></div>' +
        '<p class="cert-body">لإتمامه مسار <b class="cert-track"></b> كاملًا، وإتقان دروسه ومراجعاته<br>' +
        'في القراءة والكتابة والفهم والاستنتاج.</p>' +
        '<div class="cert-stars">' + '★'.repeat(Math.min(5, Math.max(1, Math.round((stars || 0) / 20)))) + '</div>' +
        '<div class="cert-foot"><span>' + Store.today() + '</span><span class="cert-seal">نون</span><span>توقيع المعلم</span></div>' +
      '</div>';
    c.querySelector('.cert-name').textContent = name || '________________';
    c.querySelector('.cert-track').textContent = trackName;
    return c;
  }

  /* نافذة التقرير/الشهادة: لها خانة في سجلّ المتصفح، فزر الرجوع يقفلها هي الأول */
  function mountReport(wrap) {
    closeOverlays();
    const host = document.createElement('div');
    host.className = 'report-overlay';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    const bar = el('div', 'report-bar');
    const print = el('button', 'btn primary sm', 'طباعة / حفظ PDF');
    print.addEventListener('click', function () { window.print(); });
    const close = el('button', 'btn ghost sm', 'إغلاق');
    close.addEventListener('click', function () {
      if (history.state && history.state.ov) history.back();   // popstate يقفلها
      else host.remove();
    });
    bar.appendChild(print); bar.appendChild(close);
    host.appendChild(bar);
    host.appendChild(wrap);
    document.body.appendChild(host);
    try { history.pushState({ s: current, d: stack.length, ov: 1 }, ''); } catch (e) {}
    close.focus();
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
  $('parentBack').addEventListener('click', function () { SFX.click(); parentUnlocked = false; closeOverlays(); back(); });

  document.addEventListener('pointerdown', function once() {
    SFX.unlock(); Audio2.unlock(); if (window.A3 && A3.unlock) A3.unlock();
    document.removeEventListener('pointerdown', once);
  });

  /* حساب وقت الاستخدام بالزمن الفعلي المنقضي (طوابع زمنية) — مش بعدّ نبضات setInterval.
     بيعدّ بس والطفل في درس والصفحة ظاهرة؛ الخلفية/قفل الشاشة بيوقف العدّ، والمؤقت البطيء ما بيقللش الوقت. */
  let tickFrom = 0, carry = 0;
  const MAX_GAP = 60000;   // فجوة أكبر من دقيقة بين قراءتين = الجهاز كان نايم → ما تتحسبش
  function counting() { return current === 'lesson' && document.visibilityState !== 'hidden'; }
  function flushTime() {
    const now = Date.now();
    if (tickFrom) {
      const gap = now - tickFrom;
      if (gap > 0 && gap <= MAX_GAP) carry += gap;
    }
    tickFrom = counting() ? now : 0;
    if (carry >= 1000) {
      const sec = Math.floor(carry / 1000);
      carry -= sec * 1000;
      Store.addSeconds(sec);
    }
  }
  function activeTick() { flushTime(); }
  setInterval(flushTime, 2000);
  document.addEventListener('visibilitychange', flushTime);
  window.addEventListener('pagehide', flushTime);

  window.addEventListener('popstate', function (e) {
    // نافذة تقرير مفتوحة؟ الرجوع يقفلها هي بس
    const ov = document.querySelector('.report-overlay');
    if (ov) {
      ov.remove();
      if (!e.state || !e.state.ov) { const d0 = (e.state && e.state.d) || 1; if (d0 >= stack.length) return; }
      else return;
    }
    const d = (e.state && e.state.d) || 1;
    pendingBack = null;
    // نرجع لحد العمق المطلوب (رجوع النظام/المتصفح) — كل خروج من ولي الأمر بيقفله
    let guard = 10;
    while (stack.length > d && stack.length > 1 && guard--) internalBack();
  });
  try { history.replaceState({ s: 'home', d: 1 }, ''); } catch (e) {}

  // الأوفلاين: تسجيل الـ Service Worker (كان ناقصاً فلا يعمل التطبيق بلا إنترنت)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  renderHome();
  showScreen('home');
  setTimeout(function () { Audio2.unlock(); }, 400);

  // خطّافات للاختبار الآلي
  window.__app = {
    go: go, back: back, internalBack: internalBack, state: state, session: session,
    openUnit: openUnit, renderHome: renderHome, renderTrack: renderTrack,
    parent: function () { parentUnlocked = true; go('parent'); renderParent(); },
    isParentUnlocked: function () { return parentUnlocked; },
    trackCounts: trackCounts, openReport: openReport, flushTime: flushTime,
    current: function () { return current; }
  };

  if (state.qa) window.__ready = true;
})();
