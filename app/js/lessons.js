/* ============ الدروس: كل درس يعلّم أولاً ثم يتدرّب — لا يفترض معرفة سابقة ============ */
(function () {
  'use strict';
  const el = UI.el;
  const AR = 'ar-SA', EN = 'en-US';

  /** الصوت: تسجيل بشري أولاً، والصوت الآلي اختياري (مقفول افتراضياً) */
  /* ترتيب الصوت: تسجيل بشري للكلمة → صوت آلي (لو الجهاز بيدعم لغة النص) */
  function say(t, lang, rate) {
    const L = lang || AR;
    const isEn = /^en/i.test(L);
    if (window.A3 && A3.has && A3.has(t, isEn ? 'en' : 'ar')) return A3.sayWord(t, isEn ? 'en' : 'ar', rate);
    let on = false;
    try { on = !!window.Store.get().settings.tts; } catch (e) {}
    if (!on) return Promise.resolve(false);
    return window.Audio2.say(t, L, rate);
  }
  /* سجل مؤقتات: يمنع استمرار التلاوة/الأصوات بعد مغادرة الدرس */
  const TIMERS = [];
  function later(fn, ms) { const id = setTimeout(fn, ms); TIMERS.push(id); return id; }
  function every(fn, ms) { const id = setInterval(fn, ms); TIMERS.push(id); return id; }
  function clearTimers() {
    while (TIMERS.length) { clearTimeout(TIMERS.pop()); }
    try { window.Audio2 && window.Audio2.stop && window.Audio2.stop(); } catch (e) {}
    try { window.A3 && window.A3.stop && window.A3.stop(); } catch (e) {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }

  function clear(host) { host.innerHTML = ''; return host; }
  /** يعرض الشاشة ويحوّل كل تعليمة نصية إلى زر صوت + نص صغير (الطفل لا يقرأ) */
  function show(host, node) {
    clearTimers();
    clear(host);
    node.classList.add('l-screen');
    host.appendChild(node);
    Array.prototype.forEach.call(node.querySelectorAll('.l-hint'), function (h) {
      if (h.dataset.spoken) return;
      h.dataset.spoken = '1';
      h.dataset.text = h.textContent.trim();
      const row = el('div', 'hint-row');
      const b = el('button', 'hint-spk', UI.icon('sound', 18));
      b.setAttribute('aria-label', 'اسمع التعليمة');
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        SFX.click();
        say(h.dataset.text.replace(/[«»]/g, ''), AR, 0.72);
      });
      h.parentNode.insertBefore(row, h);
      row.appendChild(b);
      row.appendChild(h);
      h.classList.add('muted');
    });
    // كل سؤال/تعليمة كبيرة تبقى قابلة للسمع بلمسة أيقونة
    Array.prototype.forEach.call(node.querySelectorAll('.l-eyebrow, .bubble'), function (t) {
      if (t.dataset.spoken) return;
      t.dataset.spoken = '1';
      const txt = t.textContent.trim();
      const wrap = el('div', 'prompt-row');
      const spk = el('button', 'hint-spk', UI.icon('sound', 18));
      spk.setAttribute('aria-label', 'اسمع');
      spk.addEventListener('click', function (e) { e.stopPropagation(); SFX.click(); say(txt.replace(/[«»]/g, ''), AR, 0.72); });
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(spk);
      wrap.appendChild(t);
    });

    const first = node.querySelector('.l-hint');
    if (first && first.dataset.text) setTimeout(function () { say(first.dataset.text.replace(/[«»]/g, ''), AR, 0.7); }, 220);
    return node;
  }
  function center(cls) { return el('div', 'l-center ' + (cls || '')); }

  function eyebrow(txt) { return el('div', 'l-eyebrow', txt); }

  function bigBtn(label, cls, onClick) {
    const b = el('button', 'btn ' + (cls || ''), label);
    b.addEventListener('click', function () { window.SFX.tap(); onClick(); });
    return b;
  }

  function ghostBtn(label, onClick) {
    const b = el('button', 'btn ghost sm', label);
    b.addEventListener('click', function () { window.SFX.click(); onClick(); });
    return b;
  }

  /* ---------- بطاقة صورة: صورة + كلمة مكتوبة + زر صوت ---------- */
  function picTile(word, emoji, lang, onPick, opts) {
    opts = opts || {};
    const b = el('button', 'pic-tile' + (opts.large ? ' large' : ''));
    const isEn = lang === EN;
    b.innerHTML =
      '<span class="pic-art">' + emoji + '</span>' +
      '<span class="pic-word' + (isEn ? ' latin' : '') + '">' + word + '</span>' +
      '<span class="pic-spk">' + UI.icon('sound', 15) + humanMark(word, lang) + '</span>';
    b.addEventListener('click', function () {
      window.SFX.click();
      speakWord(word, lang);
      if (onPick) onPick(b);
    });
    return b;
  }

  function speakWord(w, lang) {
    if (window.A3) return window.A3.sayWord(w, lang, { rate: lang === EN ? 0.95 : 0.9 });
    return say(w, lang, lang === EN ? 0.82 : 0.78);
  }
  function humanMark(w, lang) {
    const human = window.A3 && window.A3.has(w, lang);
    return '<span class="src-dot ' + (human ? 'human' : 'tmp') + '" title="' +
      (human ? 'تسجيل بشري' : 'صوت مؤقت') + '"></span>';
  }

  /* رسم الحرف من مساراته: حركات في مكانها دائماً */
  const MK = { fatha: '\u064E', damma: '\u064F', kasra: '\u0650', sukun: '\u0652', shadda: '\u0651', fathatan: '\u064B', dammatan: '\u064C', kasratan: '\u064D' };

  /** حرف + حركات كنصّ حقيقي: الخط يضع الحركات في مكانها الصحيح */
  function glyphEl(ch, marks, opts) {
    opts = opts || {};
    let txt = ch;
    if (marks && marks.length) {
      const upper = marks.filter(function (m) { return m === 'shadda'; });
      const vowel = marks.filter(function (m) { return m !== 'shadda'; });
      txt = ch + upper.map(function (m) { return MK[m]; }).join('') + vowel.map(function (m) { return MK[m]; }).join('');
    }
    const size = opts.size || 120;
    const style = 'font-size:' + size + 'px;' + (opts.color ? 'color:' + opts.color + ';' : '');
    return '<span class="gtext ' + (opts.latin ? 'latin ' : '') + (opts.cls || '') + '" style="' + style + '">' + txt + '</span>';
  }

  const MARK_OF = { '\u064E': 'fatha', '\u064F': 'damma', '\u0650': 'kasra', '\u0652': 'sukun', '\u0651': 'shadda', '\u064B': 'fathatan', '\u064C': 'dammatan', '\u064D': 'kasratan' };

  /** يفصل كلمة عربية إلى حروف مع حركاتها */
  function splitAr(word) {
    const out = [];
    Array.prototype.forEach.call(word, function (ch) {
      const mk = MARK_OF[ch];
      if (mk && out.length) out[out.length - 1].marks.push(mk);
      else out.push({ ch: ch, marks: [] });
    });
    return out;
  }

  /* ---------- تمييز حرف عربي ---------- */
  function pickDistractors(target, n) {
    const taught = window.Store.taughtLetters().filter(function (l) { return l.ch !== target.ch; });
    const pool = taught.length >= n ? taught : window.CURRICULUM.letters.filter(function (l) {
      return ['ا', 'م', 'و'].indexOf(l.ch) >= 0 && l.ch !== target.ch;
    });
    const out = [];
    const used = {};
    for (let i = 0; i < pool.length && out.length < n; i++) {
      const k = (i * 7 + 3) % pool.length;
      const l = pool[k];
      if (!used[l.ch] && l.ch !== target.ch) { used[l.ch] = 1; out.push(l); }
    }
    while (out.length < n) out.push(window.CURRICULUM.letters[out.length + 2]);
    return out;
  }

  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }

  function praise(host, text, onDone) {
    const s = center('praise');
    s.innerHTML = '<div class="praise-art">' + UI.mascot(96, 'happy') + '</div>' +
      '<div class="praise-text">' + text + '</div>';
    show(host, s);
    window.SFX.correct();
    window.UI.burst(12);
    say(text, AR, 0.85);
    setTimeout(function () { if (onDone) onDone(); }, 1150);
  }

  /* =======================================================
     العربية
     ======================================================= */

  function arMeet(host, lesson, unit, done) {
    const l = unit.letter;

    /* الخطوة ١: تعرّف على الحرف */
    function stepReveal() {
      const s = center();
      s.appendChild(el('div', 'bubble', 'أنا نون! هعلّمك حرف جديد'));
      s.appendChild(el('div', 'bubble-owl', UI.mascot(64, 'happy')));
      const g = el('button', 'glyph-tap');
      g.innerHTML = glyphEl(l.ch, [], { size: 132, color: 'var(--coral)' });
      s.appendChild(g);
      s.appendChild(el('div', 'glyph-name', l.name));
      s.appendChild(el('div', 'l-hint', 'دوس على الحرف عشان تسمع اسمه'));
      show(host, s);
      say('ده حرف ' + l.name, AR, 0.78);
      g.addEventListener('click', function () {
        SFX.pop();
        g.classList.add('tapped');
        say(l.name, AR, 0.72);
        setTimeout(function () { g.classList.remove('tapped'); }, 400);
        if (!stepReveal.done) {
          stepReveal.done = true;
          const n = bigBtn('يلا نعرف صوته', 'primary', function () { stepSound(); });
          s.appendChild(n);
        }
      });
    }

    /* الخطوة ٢: الحرف + الحركة = الصوت */
    function stepSound() {
      const s = center();
      s.appendChild(eyebrow('صوته إيه؟'));
      const eq = el('div', 'eq-row');
      const mk = splitAr(l.sound)[0];
      eq.appendChild(el('div', 'eq-card',
        glyphEl(l.ch, [], { size: 52, color: 'var(--ink)' }) + '<span class="eq-lbl">' + l.name + '</span>'));
      eq.appendChild(el('div', 'eq-op', '+'));
      const haraka = (mk && mk.marks[0]) || 'fatha';
      eq.appendChild(el('div', 'eq-card',
        '<span class="eq-haraka">' + Glyph.mark(haraka, { size: 62, color: 'var(--coral)' }) + '</span><span class="eq-lbl">' + harakaAr(haraka) + '</span>'));
      eq.appendChild(el('div', 'eq-op', '='));
      eq.appendChild(el('div', 'eq-card result',
        glyphEl(l.ch, [haraka], { size: 52, color: 'var(--coral-d)' }) + '<span class="eq-lbl">صوته</span>'));
      s.appendChild(eq);

      // أشكال الحرف: منفصل / أول / وسط / آخر
      const joins = 'اأإآدذرزوهـء'.indexOf(l.ch) < 0;
      const fr = el('div', 'forms-row');
      const forms = joins
        ? [[l.ch, 'منفصل'], [l.ch + 'ـ', 'أول'], ['ـ' + l.ch + 'ـ', 'وسط'], ['ـ' + l.ch, 'آخر']]
        : [[l.ch, 'منفصل'], ['ـ' + l.ch, 'آخر']];
      forms.forEach(function (f) {
        fr.appendChild(el('div', 'form-card',
          '<span class="form-glyph">' + f[0] + '</span><span class="form-lbl">' + f[1] + '</span>'));
      });
      s.appendChild(fr);

      const play = ghostBtn('اسمع تاني', function () {
        say(l.sound + '، ' + l.sound, AR, 0.68);
        setTimeout(function () { say(l.name + ' ' + harakaAr(haraka) + ' ' + l.sound, AR, 0.7); }, 900);
      });
      s.appendChild(play);
      const next = bigBtn('فهمته، يلا نلعب', 'primary', function () { done(); });
      s.appendChild(next);
      show(host, s);
      say(l.sound + '، ' + l.sound, AR, 0.66);
      setTimeout(function () { say(l.name + ' ' + harakaAr(haraka) + ' ' + l.sound, AR, 0.72); }, 1100);
    }

    stepReveal();
  }

  function harakaName(key) {
    const m = { fatha: '\u064E', damma: '\u064F', kasra: '\u0650', sukun: '\u0652', shadda: '\u0651' };
    return m[key] || '\u064E';
  }
  function harakaAr(key) {
    const m = { fatha: 'فَتْحَة', damma: 'ضَمَّة', kasra: 'كَسْرَة', sukun: 'سُكُون', shadda: 'شَدَّة' };
    return m[key] || 'فَتْحَة';
  }

  function arFind(host, lesson, unit, done) {
    const l = unit.letter;
    const others = pickDistractors(l, 2);
    const options = shuffle([l].concat(others));
    let wrong = 0, solved = false;

    const s = center();
    s.appendChild(eyebrow('فين حرف ' + l.name + '؟'));
    if (unit.order < 8) {
      s.appendChild(el('div', 'model-row',
        '<span class="model-label">زي ده</span>' + glyphEl(l.ch, [], { size: 34, color: 'var(--coral)' })));
    }
    const grid = el('div', 'letters-grid');
    s.appendChild(grid);

    options.forEach(function (o) {
      const b = el('button', 'letter-tile', glyphEl(o.ch, [], { size: 66, color: 'var(--ink)' }));
      b.dataset.ch = o.ch;
      b.addEventListener('click', function () {
        if (solved) return;
        if (o.ch === l.ch) {
          solved = true;
          b.classList.add('right');
          window.Store.record('ar', l.id, true); Pedagogy.Mastery.answer('ar', l.id, true);
          window.SFX.correct();
          say('أحسنت! ده ' + l.name, AR, 0.85);
          setTimeout(function () { praise(host, 'شاطر!', done); }, 700);
        } else {
          wrong++;
          b.classList.add('wrong');
          window.Store.record('ar', l.id, false); Pedagogy.Mastery.answer('ar', l.id, false);
          window.SFX.wrong();
          setTimeout(function () { b.classList.remove('wrong'); }, 450);
          if (wrong >= 2) {
            say('شوف، ' + l.name + ' هنا', AR, 0.85);
              Array.prototype.forEach.call(grid.children, function (c) {
              if (c.dataset.ch === l.ch) c.classList.add('hint');
            });
          }
        }
      });
      grid.appendChild(b);
    });

    show(host, s);
    say('فين حرف ' + l.name + '؟', AR, 0.8);
  }

  function arWord(host, lesson, unit, done) {
    const l = unit.letter;
    const correct = l.words[0];
    const others = l.words[1] ? [l.words[1]] : [];
    const pool = window.Store.taughtLetters().filter(function (x) { return x.ch !== l.ch; });
    const distractor = (pool.length ? pool[0].words[0] : { w: 'شمس', e: '☀️' });
    const opts = shuffle([{ w: correct.w, e: correct.e, ok: true }, { w: distractor.w, e: distractor.e, ok: false }]);
    let solved = false;

    const s = center();
    s.appendChild(eyebrow('مين بيبدأ بصوت «' + l.sound + '»؟'));
    const grid = el('div', 'pics-grid');
    s.appendChild(grid);
    s.appendChild(el('div', 'l-hint', 'دوس على الصورة واسمع اسمها'));

    opts.forEach(function (op) {
      const tile = picTile(op.w, op.e, AR, function (btn) {
        if (solved) return;
        if (op.ok) {
          solved = true;
          btn.classList.add('right');
          window.Store.record('ar', l.id, true); Pedagogy.Mastery.answer('ar', l.id, true);
          setTimeout(function () {
            const sp = center();
            sp.appendChild(eyebrow('أول حرف فيها'));
            sp.appendChild(el('div', 'word-big', op.w));
            sp.appendChild(el('div', 'word-arrow', '↓'));
            const first = splitAr(op.w)[0];
            const card = el('div', 'first-letter', glyphEl(first.ch, first.marks, { size: 60, color: 'var(--coral)' }));
            sp.appendChild(card);
            sp.appendChild(el('div', 'l-hint', '«' + op.w + '» بتبدأ بحرف ' + l.name));
            const n = bigBtn('تمام!', 'primary', function () { done(); });
            sp.appendChild(n);
            show(host, sp);
            say(op.w, AR, 0.72);
            setTimeout(function () { say('أول حرف ' + l.name, AR, 0.72); }, 1100);
          }, 620);
        } else {
          btn.classList.add('wrong');
          window.SFX.wrong();
          setTimeout(function () { btn.classList.remove('wrong'); }, 450);
        }
      });
      tile.dataset.ok = op.ok ? '1' : '0';
      tile.dataset.w = op.w;
      grid.appendChild(tile);
    });

    show(host, s);
    setTimeout(function () {
      say('اسمع... ' + opts[0].w + '، و' + opts[1].w, AR, 0.78);
      setTimeout(function () { say('مين فيهم بيبدأ بصوت ' + l.sound + '؟', AR, 0.78); }, 1700);
    }, 350);
  }

  function arWrite(host, lesson, unit, done) {
    traceLesson(host, unit.letter.base, [], false, unit, done, unit.letter.name);
  }

  /* =======================================================
     الإنجليزية
     ======================================================= */

  function enMeet(host, lesson, unit, done) {
    const s0 = unit.sound;
    const lc = s0.s.toLowerCase();

    function step1() {
      const s = center();
      s.appendChild(el('div', 'bubble', 'ده صوت جديد — اسمعه الأول'));
      s.appendChild(el('div', 'bubble-owl', UI.mascot(64, 'happy')));
      const g = el('button', 'glyph-tap');
      g.innerHTML = glyphEl(lc, [], { size: 132, color: 'var(--teal)', latin: true });
      s.appendChild(g);
      s.appendChild(el('div', 'l-hint', 'دوس على الحرف عشان تسمع صوته'));
      show(host, s);
      say(lc, EN, 0.75);

      g.addEventListener('click', function () {
        SFX.pop();
        g.classList.add('tapped');
        setTimeout(function () { g.classList.remove('tapped'); }, 380);
        say(lc + ', ' + lc, EN, 0.72);
        if (!step1.done) {
          step1.done = true;
          setTimeout(step2, 500);
        }
      });
    }

    function step2() {
      const s = center();
      s.appendChild(eyebrow('«' + lc + '» زي إيه؟'));
      const row = el('div', 'pics-grid one');
      row.appendChild(picTile(s0.w, s0.e, EN, null, { large: true }));
      s.appendChild(row);
      s.appendChild(el('div', 'l-hint', s0.w + ' بتبدأ بصوت «' + lc + '»'));
      const n = bigBtn('يلا نكمل', 'pk-teal', function () { done(); });
      s.appendChild(n);
      show(host, s);
      say(s0.w, EN, 0.78);
      setTimeout(function () { say(lc + '… ' + s0.w, EN, 0.72); }, 900);
    }

    step1();
  }

  function enWord(host, lesson, unit, done) {
    const s0 = unit.sound;
    const taught = window.Store.taughtSounds().filter(function (x) { return x.s !== s0.s; });
    const dis = taught.length ? taught[0] : { w: 'moon', e: '🌙' };
    const opts = shuffle([{ w: s0.w, e: s0.e, ok: true }, { w: dis.w, e: dis.e, ok: false }]);
    let solved = false;

    const s = center();
    s.appendChild(eyebrow('مين بيبدأ بصوت «' + s0.s.toUpperCase() + '»؟'));
    const grid = el('div', 'pics-grid');
    s.appendChild(grid);

    opts.forEach(function (op) {
      const tile = picTile(op.w, op.e, EN, function (btn) {
        if (solved) return;
        if (op.ok) {
          solved = true;
          btn.classList.add('right');
          window.Store.record('en', String(unit.order), true); Pedagogy.Mastery.answer('en', String(unit.order), true);
          setTimeout(function () { praise(host, 'Yes!', done); }, 650);
        } else {
          btn.classList.add('wrong');
          window.SFX.wrong();
          setTimeout(function () { btn.classList.remove('wrong'); }, 450);
        }
      });
      tile.dataset.ok = op.ok ? '1' : '0';
      tile.dataset.w = op.w;
      grid.appendChild(tile);
    });

    show(host, s);
    setTimeout(function () { say(s0.s + '... ' + s0.w, EN, 0.8); }, 300);
  }

  function enWrite(host, lesson, unit, done) {
    traceLesson(host, unit.sound.s.toLowerCase(), [], true, unit, done, unit.sound.s);
  }

  /* =======================================================
     الكتابة (مشتركة)
     ======================================================= */

  function traceLesson(host, ch, marks, latin, unit, done, label) {
    const s = center('write');
    s.appendChild(eyebrow('اكتب ' + (latin ? '«' + label + '»' : 'حرف ' + label) + ' بصباعك'));

    const wrap = el('div', 'trace-wrap');
    const L0 = Glyph.layout(ch, marks, latin);
    const ratio = Math.min(1.06, Math.max(0.66, (L0.box[2] - L0.box[0]) / Math.max(1, (L0.box[3] - L0.box[1])) * 1.12));
    wrap.style.aspectRatio = '1 / ' + (1 / ratio).toFixed(3);
    const canvas = el('canvas');
    canvas.id = 'traceCanvas';
    wrap.appendChild(canvas);
    const ring = el('div', 'ring', '0%');
    wrap.appendChild(ring);

    // دليل اتجاه الرسم: نقطة تتحرك على مسار الحرف
    try {
      const L = Glyph.layout(ch, marks || [], latin);
      const [x0, y0, x1, y1] = L.box;
      const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
      const fill = 0.78;
      const padX = w * (1 / fill - 1) / 2, padY = h * (1 / fill - 1) / 2;
      const base = L.paths.filter(function (p) { return p.part === 'base'; })[0] || L.paths[0];
      if (base) {
        const guide = el('div', 'trace-guide');
        guide.innerHTML =
          '<svg viewBox="' + (x0 - padX) + ' ' + (-(y1 + padY)) + ' ' + (w + padX * 2) + ' ' + (h + padY * 2) + '" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">' +
          '<g transform="scale(1,-1)">' +
            '<path id="guidePath" d="' + base.d + '" transform="translate(' + (base.dx || 0) + ',' + (base.dy || 0) + ')" fill="none" stroke="#FF6B5A" stroke-opacity=".55" stroke-width="' + Math.max(6, h * 0.012) + '" stroke-linecap="round" stroke-dasharray="14 12" class="guide-dash"/>' +
            '<circle r="' + Math.max(7, h * 0.016) + '" fill="#FF6B5A">' +
              '<animateMotion dur="3s" repeatCount="indefinite"><mpath href="#guidePath"/></animateMotion>' +
            '</circle>' +
          '</g></svg>';
        wrap.appendChild(guide);
        canvas.addEventListener('pointerdown', function hide() {
          guide.style.opacity = '0';
          setTimeout(function () { guide.remove(); }, 400);
          canvas.removeEventListener('pointerdown', hide);
        });
      }
    } catch (e) {}
    s.appendChild(wrap);

    const msg = el('div', 'l-hint', 'امشي بإصبعك على الحرف');
    s.appendChild(msg);

    const row = el('div', 'row-2');
    const bClear = ghostBtn('امسح', function () { if (tracer) { tracer.clear(); ring.textContent = '0%'; } });
    const bNext = el('button', 'btn primary', 'خلصت');
    bNext.disabled = true;
    bNext.addEventListener('click', function () { window.SFX.tap(); done(); });
    row.appendChild(bClear); row.appendChild(bNext);
    s.appendChild(row);

    show(host, s);

    let tracer = null, ready = false, succeeded = false, tries = 0;

    function success() {
      if (succeeded) return;
      succeeded = true;
      bNext.disabled = false;
      msg.innerHTML = '<b class="ok">برافو! كتبته بنفسك</b>';
      window.SFX.star();
      window.UI.burst(14);
      say('برافو عليك', AR, 0.85);
    }

    function build() {
      if (ready) return;
      ready = true;
      tracer = new window.Tracer(canvas, ch, {
        marks: marks,
        latin: latin,
        onProgress: function (p) {
          ring.textContent = Math.round(p.coverage * 100) + '%';
          // النجاح يحتاج تغطية الحرف **و** أن يكون الإصبع على الحرف — لا شخبطة عشوائية
          const onLetter = (p.onTarget == null ? 1 : p.onTarget);
          if (p.coverage >= 0.55 && onLetter >= 0.6) success();
          else if (p.coverage >= 0.30 && onLetter < 0.6) msg.textContent = 'إصبعك بعيد عن الحرف — جرّب فوق الحرف نفسه';
        }
      });
    }

    (window.Tracer.loadFonts ? window.Tracer.loadFonts() : Promise.resolve()).then(function () { setTimeout(build, 30); });
    setTimeout(build, 1800);

    // مساعدة تلقائية: بعد ٣ محاولات بدون نجاح نكمّل الحرف مع الطفل
    canvas.addEventListener('pointerup', function () {
      if (succeeded) return;
      tries++;
      if (tries >= 2) {
        // سقالة: نُظهر مسار الحرف أوضح ونرحّب بالمساعدة — لكن لا نمنح النجاح بلا كتابة
        wrap.classList.add('traced');
        msg.innerHTML = 'امشي بإصبعك على الخط الواضح — أنا معاك';
      }
    });
  }

  /* =======================================================
     القرآن
     ======================================================= */

  /** تشغيل متكرر بطيء (تحفيظ) */
  function slowPlay(ayahs, times) {
    const list = ayahs.map(function (a) { return a.audio; });
    let n = 0;
    function round() {
      if (n >= (times || 2)) return;
      n++;
      window.Audio2.playAyahs(list, 0.8).catch(function () {});
    }
    round();
    const id = every(function () { if (n >= (times || 2)) { clearInterval(id); return; } round(); }, 4200 * list.length);
    return id;
  }

  function ayahBlock(ayahs, opts) {
    opts = opts || {};
    const box = el('div', 'ayah-box');
    ayahs.forEach(function (a) {
      const row = el('div', 'ayah-row');
      row.appendChild(el('div', 'ayah-line q', a.text));
      if (opts.numbers) row.appendChild(el('span', 'ayah-num', a.n));
      box.appendChild(row);
    });
    return box;
  }

  function qLearn(host, lesson, unit, done) {
    const ayahs = lesson.ayahs;
    const surah = lesson.surah;
    let phase = 0;

    function step1() {
      const s = center();
      s.appendChild(eyebrow('سورة ' + surah.name + ' · اسمع'));
      s.appendChild(ayahBlock(ayahs, { numbers: true }));
      s.appendChild(el('div', 'l-hint', 'اسمع الآية كويس، وبعدين نردّد مع بعض'));
      const row = el('div', 'row-2');
      row.appendChild(ghostBtn('اسمع تاني', function () { slowPlay(ayahs, 1); }));
      row.appendChild(bigBtn('ردّد معايا', 'primary', function () { phase = 1; step2(); }));
      s.appendChild(row);
      show(host, s);
      setTimeout(function () { slowPlay(ayahs, 3); }, 400);
    }

    function step2() {
      const s = center();
      s.appendChild(eyebrow('ردّد معايا'));
      const line = el('div', 'ayah-box');
      const cur = el('div', 'ayah-line q current', ayahs[0].text);
      line.appendChild(cur);
      s.appendChild(line);
      const mic = el('div', 'mic-badge', '🎤');
      s.appendChild(mic);
      show(host, s);

      let i = 0;
      function runOne() {
        if (i >= ayahs.length) {
          const n = bigBtn('خلصت', 'primary', function () { done(); });
          s.appendChild(n);
          return;
        }
        cur.textContent = ayahs[i].text;
        cur.classList.add('current');
        mic.classList.remove('live');
        window.Audio2.playAyah(ayahs[i].audio, AR, ayahs[i].text).then(function () {
          mic.classList.add('live');
          setTimeout(function () { i++; runOne(); }, 2200);
        });
      }
      runOne();
    }

    step1();
  }

  function qRecall(host, lesson, unit, done) {
    const ayahs = lesson.ayahs;
    const surah = lesson.surah;

    // المرحلة ١: اسمع واقرأ
    function listen() {
      const s = center();
      s.appendChild(eyebrow('سورة ' + surah.name + ' · اسمع الأول'));
      const box = el('div', 'ayah-box');
      ayahs.forEach(function (a) { box.appendChild(el('div', 'ayah-line q', a.text)); });
      s.appendChild(box);
      s.appendChild(el('div', 'l-hint', 'اسمع الآية مرتين وبعدها نقولها مع بعض'));
      const play = ghostBtn('اسمع', function () {
        window.Audio2.playAyahs(ayahs.map(function (a) { return a.audio; })).catch(function () {});
      });
      s.appendChild(play);
      s.appendChild(bigBtn('دورك', 'primary', function () { recall(); }));
      show(host, s);
      later(function () { window.Audio2.playAyahs(ayahs.map(function (a) { return a.audio; })).catch(function () {}); }, 350);
    }

    // المرحلة ٢: حاول لوحدك (نص مخفي) — ثم فحص
    function recall() {
      const s = center();
      s.appendChild(eyebrow('قولها لوحدك'));
      const box = el('div', 'ayah-box blurred');
      ayahs.forEach(function (a) { box.appendChild(el('div', 'ayah-line q', a.text)); });
      s.appendChild(box);
      s.appendChild(el('div', 'l-hint', 'قولها بصوتك — وبعدين نختبر سمعك'));
      s.appendChild(bigBtn('جاهز للاختبار', 'primary', function () { check(); }));
      show(host, s);
    }

    // المرحلة ٣: فحص استرجاع — يسمع آية ويختارها من النص
    function check() {
      if (ayahs.length < 2) { verified(); return; }
      const targetIdx = Math.random() < 0.5 ? 0 : 1;
      const target = ayahs[targetIdx];
      const s = center();
      s.appendChild(eyebrow('اسمع واختار'));
      s.appendChild(el('div', 'l-hint', 'هسمعك آية — دوس على الآية اللي سمعتها'));

      const playAgain = ghostBtn('اسمع تاني', function () {
        window.Audio2.playAyahs([target.audio]).catch(function () {});
      });
      s.appendChild(playAgain);

      const grid = el('div', 'recall-grid');
      let answered = false;
      ayahs.forEach(function (a, i) {
        const b = el('button', 'ayah-choice q', a.text);
        b.addEventListener('click', function () {
          if (answered) return;
          if (i === targetIdx) {
            answered = true;
            b.classList.add('right'); SFX.correct();
            verified();
          } else {
            b.classList.add('wrong'); SFX.wrong();
            later(function () { b.classList.remove('wrong'); }, 500);
            window.Audio2.playAyahs([target.audio]).catch(function () {});
            s.querySelector('.l-hint').textContent = 'سمعها كويس… اختار تاني';
          }
        });
        grid.appendChild(b);
      });
      s.appendChild(grid);
      show(host, s);
      later(function () { window.Audio2.playAyahs([target.audio]).catch(function () {}); }, 400);
    }

    // بعد النجاح: تسجيل الحفظ
    function verified() {
      const s = center();
      s.appendChild(el('div', 'praise-art', UI.mascot(110, 'celebrate')));
      s.appendChild(el('div', 'praise-text', 'ما شاء الله'));
      s.appendChild(el('div', 'l-hint', 'سمّعها لبابا أو ماما عشان نثبّتها'));
      const b = bigBtn('كمل', 'primary', function () {
        window.Store.markSurah(surah.n, lesson.start + ayahs.length, surah.ayahs.length);
        SFX.levelup(); UI.burst(12);
        done();
      });
      s.appendChild(b);
      show(host, s);
      say('ما شاء الله', AR, 0.85);
    }

    listen();
  }

  /* =======================================================
     الحركات: تعليم مباشر + تمييز سمعي + تمييز بصري
     ======================================================= */

  function sampleLetter() {
    const t = Store.taughtLetters();
    return t.length ? t[0] : window.CURRICULUM.letters[0];
  }
  function otherHarakat(key) {
    return (SYLLABUS.harakat || []).filter(function (h) { return h.key !== key; });
  }

  function arHMeet(host, lesson, unit, done) {
    const h = unit.haraka;
    const L = sampleLetter();

    function step1() {
      const s = center();
      s.appendChild(el('div', 'bubble', 'دي ' + h.name + ' — علامة صغيرة بتغيّر الصوت'));
      s.appendChild(el('div', 'bubble-owl', UI.mascot(60, 'happy')));
      const g = el('button', 'glyph-tap');
      g.innerHTML = glyphEl(L.ch, [h.key], { size: 150, color: 'var(--coral)' });
      s.appendChild(g);
      s.appendChild(el('div', 'glyph-name', h.name));
      s.appendChild(el('div', 'l-hint', h.hint + ' — دوس واسمع'));
      show(host, s);
      say(h.name, AR, 0.72);
      g.addEventListener('click', function () {
        SFX.pop();
        say(h.sound + '، ' + h.name, AR, 0.7);
        if (!step1.done) {
          step1.done = true;
          const n = bigBtn('تمام', 'primary', function () { step2(); });
          s.appendChild(n);
        }
      });
    }

    function step2() {
      const s = center();
      s.appendChild(eyebrow('شوف الفرق'));
      const row = el('div', 'eq-row');
      row.appendChild(el('div', 'eq-card',
        glyphEl(L.ch, [], { size: 76, color: 'var(--ink-soft)' }) + '<span class="eq-lbl">من غير حركة</span>'));
      row.appendChild(el('div', 'eq-arrow', '→'));
      row.appendChild(el('div', 'eq-card result',
        glyphEl(L.ch, [h.key], { size: 76, color: 'var(--coral-d)' }) + '<span class="eq-lbl">' + h.name + '</span>'));
      s.appendChild(row);
      s.appendChild(el('div', 'l-hint', 'الصوت بقى «' + h.sound + '»'));
      const row2 = el('div', 'row-2');
      row2.appendChild(ghostBtn('اسمع تاني', function () { say(L.ch + ' ' + h.sound, AR, 0.68); }));
      row2.appendChild(bigBtn('خلصت', 'primary', function () { done(); }));
      s.appendChild(row2);
      show(host, s);
      say(L.ch + '، ' + h.sound, AR, 0.68);
    }

    step1();
  }

  function arHEar(host, lesson, unit, done) {
    const h = unit.haraka;
    const L = sampleLetter();
    const others = otherHarakat(h.key);
    const rival = others[Math.floor(Math.random() * Math.max(1, others.length))] || others[0];
    const opts = shuffle([{ key: h.key, ok: true }, { key: rival.key, ok: false }]);
    let solved = false;

    const s = center();
    s.appendChild(eyebrow('اسمع… أنهي واحد؟'));
    const grid = el('div', 'letters-grid two');
    s.appendChild(grid);

    opts.forEach(function (o) {
      const b = el('button', 'letter-tile', glyphEl(L.ch, [o.key], { size: 150, color: 'var(--ink)', emBox: true }));
      b.addEventListener('click', function () {
        if (solved) return;
        if (o.ok) {
          solved = true;
          b.classList.add('right');
          Pedagogy.Mastery.answer('ar', 'h.' + h.key, true);
          praise(host, 'سمعها صح!', done);
        } else {
          b.classList.add('wrong');
          SFX.wrong();
          Pedagogy.Mastery.answer('ar', 'h.' + h.key, false);
          setTimeout(function () { b.classList.remove('wrong'); }, 420);
          say('لأ… ' + h.sound + ' فيها ' + h.name, AR, 0.72);
        }
      });
      grid.appendChild(b);
    });

    show(host, s);
    playBoth();

    function playBoth() {
      const first = opts[0], second = opts[1];
      say(L.ch + ' ' + (first.ok ? h.sound : rival.sound), AR, 0.62);
      setTimeout(function () { say(L.ch + ' ' + (second.ok ? h.sound : rival.sound), AR, 0.62); }, 1200);
      setTimeout(function () { say('مين فيه ' + h.name + '؟', AR, 0.72); }, 2500);
    }
    s.appendChild(ghostBtn('اسمع تاني', playBoth));
  }

  function arHPick(host, lesson, unit, done) {
    const h = unit.haraka;
    const L = sampleLetter();
    const others = otherHarakat(h.key);
    const pool = shuffle(others).slice(0, 2);
    const opts = shuffle([{ key: h.key, ok: true }].concat(pool.map(function (o) { return { key: o.key, ok: false }; })));
    let solved = false;

    const s = center();
    s.appendChild(eyebrow('فين اللي عليه ' + h.name + '؟'));
    const grid = el('div', 'letters-grid');
    s.appendChild(grid);

    opts.forEach(function (o) {
      const b = el('button', 'letter-tile', glyphEl(L.ch, [o.key], { size: 150, color: 'var(--ink)', emBox: true }));
      b.addEventListener('click', function () {
        if (solved) return;
        if (o.ok) {
          solved = true;
          b.classList.add('right');
          Pedagogy.Mastery.answer('ar', 'h.' + h.key, true);
          praise(host, 'شاطر!', done);
        } else {
          b.classList.add('wrong');
          SFX.wrong();
          Pedagogy.Mastery.answer('ar', 'h.' + h.key, false);
          setTimeout(function () { b.classList.remove('wrong'); }, 420);
        }
      });
      grid.appendChild(b);
    });
    show(host, s);
    say('فين ' + h.name + '؟', AR, 0.72);
  }

  /* =======================================================
     الإنجليزي: التركيب والتقطيع (Blending & Segmenting)
     ======================================================= */

  function soundTilesFor(word) {
    // تقسيم الكلمة إلى أصوات مدرّسة (ثنائيات أولاً مثل sh, oo)
    const known = {};
    Store.taughtSounds().forEach(function (s) { String(s.s).split(' ').forEach(function (x) { known[x] = 1; }); });
    const out = [];
    let i = 0;
    while (i < word.length) {
      const two = word.slice(i, i + 2);
      if (known[two]) { out.push(two); i += 2; continue; }
      out.push(word[i]); i += 1;
    }
    return out;
  }

  function enBlend(host, lesson, unit, done) {
    const words = Pedagogy.blendableWords(3);
    if (!words.length) { enBlendFallback(host, done); return; }
    const w = words[0];
    const sounds = soundTilesFor(w.w);
    let idx = 0;

    const s = center();
    s.appendChild(eyebrow('ركّب الكلمة'));
    const row = el('div', 'pics-grid one');
    row.appendChild(picTile(w.w, w.e, EN, null, { large: true }));
    s.appendChild(row);
    s.appendChild(el('div', 'l-hint', 'دوس على الحروف بالترتيب — من الشمال لليمين'));
    const strip = el('div', 'blend-strip');
    s.appendChild(strip);

    const built = el('div', 'blend-built');
    s.appendChild(built);

    show(host, s);

    sounds.forEach(function (snd, i) {
      const b = el('button', 'blend-tile', glyphEl(snd.toLowerCase(), [], { size: 120, color: 'var(--teal)', latin: true, emBox: true }));
      b.dataset.i = i;
      b.addEventListener('click', function () {
        if (i !== idx) {
          b.classList.add('nudge');
          setTimeout(function () { b.classList.remove('nudge'); }, 380);
          say('ده مش دوره', AR, 0.72);
          return;
        }
        SFX.tap();
        b.classList.add('done');
        say(snd, EN, 0.72);
        built.textContent += snd;
        idx++;
        if (idx === sounds.length) {
          setTimeout(function () {
            say(w.w, EN, 0.7);
            SFX.correct();
            UI.burst(14);
            Pedagogy.Mastery.answer('en', 'blend.' + w.w, true);
            praise(host, w.w + '!', done);
          }, 500);
        }
      });
      strip.appendChild(b);
    });
  }

  function enBlendFallback(host, done) {
    const s = center();
    s.appendChild(eyebrow('نلعب بالأصوات'));
    s.appendChild(el('div', 'l-hint', 'لسه محتاجين حروف أكتر — نسمع أصواتنا اللي اتعلمناها'));
    const taught = Store.taughtSounds();
    const row = el('div', 'letters-grid');
    taught.slice(0, 3).forEach(function (t) {
      const b = el('button', 'letter-tile', glyphEl(String(t.s).toLowerCase(), [], { size: 130, color: 'var(--teal)', latin: true, emBox: true }));
      b.addEventListener('click', function () { SFX.tap(); say(t.s, EN, 0.7); });
      row.appendChild(b);
    });
    s.appendChild(row);
    const n = bigBtn('خلصت', 'primary', function () { done(); });
    s.appendChild(n);
    show(host, s);
    setTimeout(function () { say('اسمع وكرر معايا', AR, 0.75); }, 300);
  }

  /* =======================================================
     مراجعة مختلطة (تكرار متباعد + مزج)
     ======================================================= */

  function mixReview(host, lesson, unit, done) {
    const track = unit.track;
    if (track === 'ar') return reviewAr(host, done);
    if (track === 'en') return reviewEn(host, done);
    return reviewQu(host, done);
  }

  function reviewAr(host, done) {
    const picks = Pedagogy.reviewLetters(2);
    if (picks.length < 2) { done(); return; }
    let round = 0;

    function run() {
      if (round >= picks.length) { done(); return; }
      const l = picks[round];
      const pool = Store.taughtLetters().filter(function (x) { return x.ch !== l.ch; });
      const others = shuffle(pool).slice(0, 2);
      const opts = shuffle([l].concat(others));
      let solved = false;

      const s = center();
      s.appendChild(el('div', 'review-badge', 'مراجعة ' + (round + 1) + ' من ' + picks.length));
      s.appendChild(eyebrow('فين حرف ' + l.name + '؟'));
      const grid = el('div', 'letters-grid');
      s.appendChild(grid);

      opts.forEach(function (o) {
        const b = el('button', 'letter-tile', glyphEl(o.ch, [], { size: 150, color: 'var(--ink)', emBox: true }));
        b.dataset.ch = o.ch;
        b.addEventListener('click', function () {
          if (solved) return;
          if (o.ch === l.ch) {
            solved = true;
            b.classList.add('right');
            Pedagogy.Mastery.answer('ar', l.id, true);
            SFX.correct();
            round++;
            setTimeout(run, 800);
          } else {
            b.classList.add('wrong');
            SFX.wrong();
            Pedagogy.Mastery.answer('ar', l.id, false);
            setTimeout(function () { b.classList.remove('wrong'); }, 400);
          }
        });
        grid.appendChild(b);
      });
      show(host, s);
      say('فين حرف ' + l.name + '؟', AR, 0.76);
    }
    run();
  }

  function reviewEn(host, done) {
    const picks = Pedagogy.reviewSounds(2);
    if (!picks.length) { done(); return; }
    let round = 0;

    function run() {
      if (round >= picks.length) { done(); return; }
      const s0 = picks[round];
      const taught = Store.taughtSounds().filter(function (x) { return x.s !== s0.s; });
      const dis = taught.length ? taught[0] : { w: 'moon', e: '🌙' };
      const opts = shuffle([{ w: s0.w, e: s0.e, ok: true }, { w: dis.w, e: dis.e, ok: false }]);
      let solved = false;

      const s = center();
      s.appendChild(el('div', 'review-badge', 'مراجعة ' + (round + 1) + ' من ' + picks.length));
      s.appendChild(eyebrow('مين بيبدأ بصوت «' + String(s0.s).toUpperCase() + '»؟'));
      const grid = el('div', 'pics-grid');
      s.appendChild(grid);
      opts.forEach(function (op) {
        const tile = picTile(op.w, op.e, EN, function (btn) {
          if (solved) return;
          if (op.ok) {
            solved = true;
            btn.classList.add('right');
            Pedagogy.Mastery.answer('en', String(s0.idx), true);
            SFX.correct();
            round++;
            setTimeout(run, 750);
          } else {
            btn.classList.add('wrong');
            SFX.wrong();
            Pedagogy.Mastery.answer('en', String(s0.idx), false);
            setTimeout(function () { btn.classList.remove('wrong'); }, 420);
          }
        });
        grid.appendChild(tile);
      });
      show(host, s);
      setTimeout(function () { say(String(s0.s) + '… ' + s0.w, EN, 0.78); }, 300);
    }
    run();
  }

  function reviewQu(host, done) {
    const st = Store.get();
    const doneSurahs = Object.keys(st.surahs || {}).filter(function (k) { return st.surahs[k] && st.surahs[k].done; });
    const n = doneSurahs.length ? parseInt(doneSurahs[doneSurahs.length - 1], 10) : 1;
    const surah = (window.QURAN || []).find(function (x) { return x.n === n; });
    if (!surah) { done(); return; }
    const pool = surah.ayahs.slice(0, Math.min(3, surah.ayahs.length));
    const targetIdx = Math.floor(Math.random() * pool.length);
    const target = pool[targetIdx];

    function listenStep() {
      const s = center();
      s.appendChild(el('div', 'review-badge', 'مراجعة'));
      s.appendChild(eyebrow('سورة ' + surah.name + ' · اسمع'));
      const box = el('div', 'ayah-box');
      pool.forEach(function (a) { box.appendChild(el('div', 'ayah-line q', a.text)); });
      s.appendChild(box);
      s.appendChild(el('div', 'l-hint', 'اسمع الآية كويس — بعدها هنختبر سمعك'));
      s.appendChild(bigBtn('جاهز', 'primary', function () { checkStep(); }));
      show(host, s);
      later(function () { window.Audio2.playAyahs([target.audio]).catch(function () {}); }, 300);
    }

    function checkStep() {
      const s = center();
      s.appendChild(el('div', 'review-badge', 'مراجعة'));
      s.appendChild(eyebrow('اسمع واختار الآية'));
      s.appendChild(el('div', 'l-hint', 'هسمعك آية من السورة — دوس عليها'));
      s.appendChild(ghostBtn('اسمع تاني', function () {
        window.Audio2.playAyahs([target.audio]).catch(function () {});
      }));
      const grid = el('div', 'recall-grid');
      let answered = false;
      pool.forEach(function (a, i) {
        const b = el('button', 'ayah-choice q', a.text);
        b.addEventListener('click', function () {
          if (answered) return;
          if (i === targetIdx) {
            answered = true; b.classList.add('right'); SFX.correct();
            later(function () { done(); }, 600);
          } else {
            b.classList.add('wrong'); SFX.wrong();
            later(function () { b.classList.remove('wrong'); }, 500);
            window.Audio2.playAyahs([target.audio]).catch(function () {});
          }
        });
        grid.appendChild(b);
      });
      s.appendChild(grid);
      show(host, s);
      later(function () { window.Audio2.playAyahs([target.audio]).catch(function () {}); }, 350);
    }

    listenStep();
  }

  /* =======================================================
     التفكير: فهم · تصنيف · سبب ونتيجة · تتابع · استنتاج
     ======================================================= */
  function thinkLesson(host, lesson, unit, done) {
    const set = Thinking.setForCached(unit.id, unit.order || 0);
    const q = set[Math.min(lesson.qi || 0, set.length - 1)];
    if (!q) { done(); return; }

    let wrong = 0, solved = false, revealed = false;

    const s = center();
    s.appendChild(el('div', 'think-head',
      '<span class="think-owl">' + UI.mascot(46, 'happy') + '</span>' +
      '<span class="think-label">فكّر معايا</span>'));
    s.appendChild(el('div', 'think-prompt', q.q));
    const ask = ghostBtn('اسمع السؤال', function () { say(q.q, AR, 0.82); });
    ask.classList.add('think-ask');
    s.appendChild(ask);

    const grid = el('div', 'pics-grid three');
    s.appendChild(grid);

    show(host, s);
    setTimeout(function () { say(q.q, AR, 0.82); }, 320);

    q.opts.forEach(function (op, i) {
      const tile = picTile(op[1], op[0], AR, function (btn) {
        if (solved) return;
        if (i === q.ok) {
          solved = true;
          btn.classList.add('right');
          Pedagogy.Mastery.answer('th', q.key, true);
          const why = el('div', 'think-why', 'عشان كده: ' + q.hint);
          s.appendChild(why);
          setTimeout(function () { praise(host, 'ذكي!', done); }, 780);
          say('صح! ' + q.hint, AR, 0.8);
        } else {
          wrong++;
          btn.classList.add('wrong');
          SFX.wrong();
          Pedagogy.Mastery.answer('th', q.key, false);
          setTimeout(function () { btn.classList.remove('wrong'); }, 430);
          if (wrong === 1) say('قرّب… فكّر تاني', AR, 0.82);
          if (wrong >= 2 && !revealed) {
            revealed = true;
            // تسهيل بلا لوم: نشيل بديل غلط من الطريق
            const wrongTiles = Array.prototype.filter.call(grid.children, function (c, idx) {
              return idx !== q.ok && !c.classList.contains('gone');
            });
            if (wrongTiles[0]) {
              wrongTiles[0].classList.add('gone');
              UI.toast('شيلنا واحد — فضل واحد صح');
            }
            say('خلّينا أسهل: ' + q.hint, AR, 0.8);
          } else {
            say(q.hint, AR, 0.8);
          }
        }
      });
      grid.appendChild(tile);
    });
  }


  /* =======================================================
     قراءة الكلمات: من الحرف إلى الكلمة كاملة
     ======================================================= */
  const READ_BANK = (function () {
    const all = (window.CURRICULUM.letters || []).reduce(function (a, l) {
      (l.words || []).forEach(function (w) {
        const clean = String(w.w).replace(/[\u064B-\u0652]/g, '');
        if (clean.length >= 2 && clean.length <= 4) a.push({ w: w.w, e: w.e, n: clean.length });
      });
      return a;
    }, []);
    const seen = {};
    const uniq = all.filter(function (x) { if (seen[x.w]) return false; seen[x.w] = 1; return true; });
    uniq.sort(function (a, b) { return a.n - b.n; });
    return uniq;
  })();

  function readWordAt(idx) {
    if (!READ_BANK.length) return null;
    return READ_BANK[idx % READ_BANK.length];
  }

  function arReadWord(host, lesson, unit, done) {
    const base = (unit.readIdx || 0) * 3 + (lesson.ri || 0);
    const item = readWordAt(base);
    if (!item) { done(); return; }

    const s = center();
    s.appendChild(el('div', 'bubble', 'اقرا الكلمة — واحد واحد'));
    s.appendChild(el('div', 'bubble-owl', UI.mascot(58, 'happy')));

    // الكلمة مبنيّة من حروفها وحركاتها (نفس مسارات العرض)
    const box = el('div', 'read-word');
    const units = [];
    splitAr(item.w).forEach(function (u) {
      const g = el('span', 'read-letter', glyphEl(u.ch, u.marks, { size: 74, color: 'var(--coral)' }));
      box.appendChild(g); units.push(g);
    });
    s.appendChild(box);
    s.appendChild(el('div', 'l-hint', 'دوس على الحرف واسمع صوته'));

    const row0 = el('div', 'row-2');
    row0.appendChild(ghostBtn('اسمع الكلمة', function () { speakWord(item.w, AR); }));
    s.appendChild(row0);
    show(host, s);

    let heard = 0;
    units.forEach(function (g, i) {
      g.addEventListener('click', function () {
        SFX.pop();
        say(units.length && splitAr(item.w)[i] ? splitAr(item.w)[i].ch : '', AR, 0.7);
        g.classList.add('done');
        heard++;
        if (heard === units.length) revealNext();
      });
    });

    let revealed = false;
    function revealNext() {
      if (revealed) return;
      revealed = true;
      speakWord(item.w, AR);
      const n = bigBtn('قرأتها لوحدي', 'primary', function () {
        Pedagogy.Mastery.answer('ar', 'read.' + item.w, true);
        done();
      });
      s.appendChild(n);
    }

    setTimeout(function () { speakWord(item.w, AR); }, 500);
    // مسار سريع: بعد ١٢ ثانية نعرض الزر حتى لو لم يضغط كل الحروف
    setTimeout(revealNext, 12000);
  }


  /* =======================================================
     الأرقام ١–١٠٠
     ======================================================= */

  function numCount(host, lesson, unit, done) {
    const st = lesson.stage;
    const nums = lesson.nums;
    let i = 0;

    function one() {
      if (i >= nums.length) {
        const s = center();
        s.appendChild(el('div', 'praise-text', 'خلصنا العدّ!'));
        s.appendChild(bigBtn('يلا نكتب', 'primary', function () { done(); }));
        show(host, s);
        return;
      }
      const n = nums[i];
      const s = center();
      s.appendChild(eyebrow('عُدّ معايا'));
      const box = el('div', 'count-box');
      for (let k = 0; k < Math.min(n, 20); k++) box.appendChild(el('span', 'count-dot'));
      s.appendChild(box);
      s.appendChild(el('div', 'num-big', NUMBERS.toAr(n)));
      s.appendChild(el('div', 'l-hint', NUMBERS.name(n)));
      const nb = bigBtn('التالي', 'primary', function () {
        i++;
        if (n >= 10 && i % 5 === 0) { gentleBreak(host, function () { one(); }); return; }
        one();
      });
      s.appendChild(nb);
      show(host, s);
      say(NUMBERS.name(n), AR, 0.72);
      setTimeout(function () { say(NUMBERS.toAr(n), AR, 0.6); }, 900);
    }
    one();
  }

  function numWrite(host, lesson, unit, done) {
    const nums = lesson.nums;
    let i = 0;
    function one() {
      if (i >= nums.length) {
        const s = center();
        s.appendChild(el('div', 'praise-text', 'كتبت الأرقام كلها!'));
        s.appendChild(bigBtn('يلا للاختبار', 'primary', function () { done(); }));
        show(host, s);
        return;
      }
      const n = nums[i];
      traceLesson(host, NUMBERS.toAr(n), [], false, unit, function () { i++; one(); }, NUMBERS.name(n));
    }
    one();
  }

  function numTest(host, lesson, unit, done) {
    const nums = lesson.nums;
    const pick = shuffle(nums).slice(0, 4);
    let idx = 0, right = 0;

    function q() {
      if (idx >= pick.length) {
        const ok = right >= 3;
        const s = center();
        s.appendChild(el('div', 'praise-art', UI.mascot(100, ok ? 'celebrate' : 'happy')));
        s.appendChild(el('div', 'praise-text', ok ? 'نجحت! المرحلة اللي بعدها اتفتحت' : 'خلّينا نراجع شوية'));
        s.appendChild(bigBtn(ok ? 'يلا نكمل' : 'أعد المحاولة', 'primary', function () {
          if (!ok) { idx = 0; right = 0; q(); } else done();
        }));
        show(host, s);
        if (ok) { SFX.levelup(); UI.burst(20); }
        return;
      }
      const target = pick[idx];
      const s = center();
      s.appendChild(eyebrow('فين رقم ' + NUMBERS.name(target) + '؟'));
      const grid = el('div', 'nums-grid');
      const opts = shuffle([target].concat(shuffle(nums.filter(function (x) { return x !== target; })).slice(0, 2)));
      let firstTry = true, answered = false;
      opts.forEach(function (o) {
        const b = el('button', 'num-tile', NUMBERS.toAr(o));
        b.dataset.n = o;
        b.addEventListener('click', function () {
          if (answered) return;
          if (o === target) {
            answered = true;
            // تُحسب صحيحة فقط لو كانت المحاولة الأولى لهذا السؤال
            if (firstTry) right++;
            b.classList.add('right'); SFX.correct();
            say(NUMBERS.name(target), AR, 0.75);
            setTimeout(function () { idx++; q(); }, 600);
          } else {
            firstTry = false;               // الغلط يُسقط درجة السؤال
            b.classList.add('wrong'); SFX.wrong();
            setTimeout(function () { b.classList.remove('wrong'); }, 400);
            say('ده ' + NUMBERS.name(o) + '، دور على ' + NUMBERS.name(target), AR, 0.72);
          }
        });
        grid.appendChild(b);
      });
      s.appendChild(grid);
      show(host, s);
      say('فين رقم ' + NUMBERS.name(target) + '؟', AR, 0.72);
    }
    q();
  }

  /** استراحة قصيرة لطيفة */
  function gentleBreak(host, onContinue) {
    const s = center();
    s.appendChild(el('div', 'praise-art', UI.mascot(96, 'sleepy')));
    s.appendChild(el('div', 'l-eyebrow', 'استراحة قصيرة'));
    s.appendChild(el('div', 'l-hint', 'شرب مية وحرّك جسمك شوية، وبعدها نكمل'));
    const b = bigBtn('رجعت، يلا نكمل', 'primary', onContinue);
    s.appendChild(b);
    show(host, s);
    say('خلّينا نرتاح شوية. اشرب مية وارجع', AR, 0.72);
  }

  /* ---------- التوجيه ---------- */
  const MAP = {
    arMeet: arMeet, arFind: arFind, arWord: arWord, arWrite: arWrite,
    arHMeet: arHMeet, arHEar: arHEar, arHPick: arHPick,
    enMeet: enMeet, enWord: enWord, enWrite: enWrite, enBlend: enBlend,
    qLearn: qLearn, qRecall: qRecall,
    numCount: numCount, numWrite: numWrite, numTest: numTest,
    mixReview: mixReview, thinkIt: thinkLesson, arReadWord: arReadWord
  };

  window.Lessons = {
    breakPrompt: gentleBreak,
    run: function (host, lesson, unit, onDone) {
      const fn = MAP[lesson.type];
      if (!fn) { onDone(); return; }
      fn(host, lesson, unit, onDone);
    }
  };
})();
