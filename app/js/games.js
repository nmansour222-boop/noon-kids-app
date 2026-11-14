/* ============ الألعاب ============ */
(function () {
  'use strict';

  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const pick = (arr, n) => shuffle(arr).slice(0, n);
  // يضمن استدعاء onDone مرّة واحدة فقط (الطفل ممكن يدوس كذا مرة)
  const once = f => { let d = false; return function () { if (d) return; d = true; return f.apply(null, arguments); }; };

  function speakTarget(item, track, container) {
    if (track === 'ar') window.Audio2.say(item.sound, 'ar-SA', 0.72);
    else window.Audio2.say(item.s, 'en-US', 0.8);
  }

  /* ---------- 1) صياد الحروف ---------- */
  function soundHunt(container, ctx) {
    const { item, track } = ctx;
    const onDone = once(ctx.onDone);
    const pool = track === 'ar'
      ? shuffle(window.CURRICULUM.letters.filter(l => l.ch !== item.ch)).slice(0, 3).map(l => l.ch)
      : shuffle(window.CURRICULUM.sounds.filter(s => s.s !== item.s)).slice(0, 3).map(s => s.s);
    let round = 0, wrong = 0;
    const total = 4;

    function nextRound() {
      if (round >= total) { onDone({ ok: wrong <= 2, done: true }); return; }
      round++; wrong = 0;
      const target = track === 'ar' ? item.ch : item.s;
      const options = shuffle([target].concat(pick(pool, round >= 3 ? 1 : 2)));
      container.innerHTML = '';
      const top = el('div', 'center');
      top.style.marginBottom = '8px';
      top.appendChild(el('div', 'section-title', 'دُوس على ' + (track === 'ar' ? 'حرف' : 'صوت') + ' <b style="color:var(--teal-dark);font-size:20px">' + target + '</b>'));
      container.appendChild(top);

      const hunt = el('div', 'hunt');
      const spots = [[10, 14], [52, 8], [22, 52], [56, 56], [6, 74], [40, 30]];
      const chosen = shuffle(spots).slice(0, options.length);
      options.forEach((op, i) => {
        const b = el('button', 'bubble-btn' + (track === 'en' ? ' latin' : ''), op);
        b.style.left = chosen[i][0] + '%';
        b.style.top = chosen[i][1] + '%';
        b.addEventListener('click', () => {
          if (op === target) {
            b.classList.add('hit');
            window.App.juice(2);
            window.Audio2.say(track === 'ar' ? 'برافو' : 'yes', track === 'ar' ? 'ar-SA' : 'en-US');
            setTimeout(nextRound, 700);
          } else {
            b.classList.add('wrong');
            setTimeout(() => b.classList.remove('wrong'), 420);
            wrong++;
            window.Audio2.say(track === 'ar' ? 'حاول كمان مرة' : 'try again', track === 'ar' ? 'ar-SA' : 'en-US');
          }
        });
        hunt.appendChild(b);
      });
      container.appendChild(hunt);
      setTimeout(() => speakTarget(item, track), 250);
    }
    nextRound();
  }

  /* ---------- 2) فين الصوت؟ ---------- */
  function pickPicture(container, ctx) {
    const { item, track } = ctx;
    const onDone = once(ctx.onDone);
    const others = track === 'ar'
      ? shuffle(window.CURRICULUM.letters.filter(l => l.id !== item.id)).slice(0, 2)
      : shuffle(window.CURRICULUM.sounds.filter(s => s.s !== item.s)).slice(0, 2);
    const correct = track === 'ar' ? item.words[0] : { w: item.w, e: item.e };
    const options = shuffle([{ w: correct.w, e: correct.e, ok: true }].concat(others.map(o => ({ w: track === 'ar' ? o.words[0].w : o.w, e: track === 'ar' ? o.words[0].e : o.e, ok: false }))));

    container.innerHTML = '';
    const head = el('div', 'center');
    head.appendChild(el('div', 'section-title', 'إيه اللي بيبدأ بـ «' + (track === 'ar' ? item.sound : item.s) + '»؟'));
    container.appendChild(head);

    const grid = el('div', 'grid-3');
    options.forEach(op => {
      const c = el('button', 'tap-card');
      c.style.display = 'flex';
      c.style.flexDirection = 'column';
      c.innerHTML = '<span style="font-size:42px;line-height:1.1">' + op.e + '</span>' +
                    '<span style="font-size:13px;color:var(--ink-soft);margin-top:4px">' + op.w + '</span>';
      c.setAttribute('aria-label', op.w);
      c.addEventListener('click', () => {
        if (op.ok) {
          if (c.dataset.done) return;
          c.dataset.done = '1';
          c.classList.add('right');
          window.App.juice(2);
          window.Audio2.say(op.w, track === 'ar' ? 'ar-SA' : 'en-US', 0.78);
          setTimeout(() => onDone({ ok: true, done: true }), 800);
        } else {
          c.classList.add('wrong');
          setTimeout(() => c.classList.remove('wrong'), 420);
          window.Audio2.say(track === 'ar' ? 'لا، جرب تاني' : 'no, try again', track === 'ar' ? 'ar-SA' : 'en-US');
        }
      });
      grid.appendChild(c);
    });
    container.appendChild(grid);
    setTimeout(() => speakTarget(item, track), 200);
  }

  /* ---------- 3) بناء الكلمة ---------- */
  function wordBuilder(container, ctx) {
    const { item, track } = ctx;
    const onDone = once(ctx.onDone);
    const raw = track === 'ar' ? item.words[0].w : item.w;
    const emoji = track === 'ar' ? item.words[0].e : item.e;
    const letters = Array.from(raw.replace(/[\u064B-\u0652\u0670]/g, ''));
    let pos = 0;
    const filled = [];

    container.innerHTML = '';
    const head = el('div', 'center');
    head.appendChild(el('div', '', '<div style="font-size:64px">' + emoji + '</div>'));
    head.appendChild(el('div', 'section-title', 'كوّن الكلمة: ' + raw));
    container.appendChild(head);

    const slots = el('div', 'slots');
    const slotEls = letters.map(() => { const s = el('div', 'slot'); slots.appendChild(s); return s; });
    container.appendChild(slots);

    const tiles = el('div', 'tiles');
    shuffle(letters.map((ch, i) => ({ ch, i }))).forEach(t => {
      const b = el('button', 'tile', t.ch);
      b.addEventListener('click', () => {
        if (b.classList.contains('used')) return;
        if (pos >= letters.length) return;
        b.classList.add('used');
        filled.push(t);
        slotEls[pos].textContent = t.ch;
        slotEls[pos].classList.add('filled');
        pos++;
        window.Audio2.say(t.ch, track === 'ar' ? 'ar-SA' : 'en-US', 0.7);
        if (pos === letters.length) checkOut();
      });
      tiles.appendChild(b);
    });
    container.appendChild(tiles);

    const actions = el('div', 'grid-2');
    actions.style.marginTop = '14px';
    const undo = el('button', 'btn ghost sm', '↩️ رجّع');
    undo.addEventListener('click', () => {
      if (!pos) return;
      pos--;
      const t = filled.pop();
      slotEls[pos].textContent = '';
      slotEls[pos].classList.remove('filled');
      const idx = Array.from(tiles.children).findIndex(c => c.textContent === t.ch && c.classList.contains('used'));
      if (idx >= 0) tiles.children[idx].classList.remove('used');
    });
    actions.appendChild(undo);
    const clean = el('button', 'btn ghost sm', '🧽 من الأول');
    clean.addEventListener('click', () => {
      pos = 0; filled.length = 0;
      slotEls.forEach(s => { s.textContent = ''; s.classList.remove('filled'); });
      Array.from(tiles.children).forEach(c => c.classList.remove('used'));
    });
    actions.appendChild(clean);
    container.appendChild(actions);

    function checkOut() {
      const out = filled.map(t => t.ch).join('');
      if (out === letters.join('')) {
        window.App.juice(3);
        window.Audio2.say(raw, track === 'ar' ? 'ar-SA' : 'en-US', 0.72);
        setTimeout(() => onDone({ ok: true, done: true }), 900);
      } else {
        container.classList.add('wrong');
        setTimeout(() => container.classList.remove('wrong'), 450);
        window.Audio2.say(track === 'ar' ? 'قربنا! جرب تاني' : 'almost! try again', track === 'ar' ? 'ar-SA' : 'en-US');
        setTimeout(() => {
          pos = 0; filled.length = 0;
          slotEls.forEach(s => { s.textContent = ''; s.classList.remove('filled'); });
          Array.from(tiles.children).forEach(c => c.classList.remove('used'));
        }, 700);
      }
    }
  }

  /* ---------- 4) ذاكرة الحروف ---------- */
  function memory(container, ctx) {
    const { item, track } = ctx;
    const onDone = once(ctx.onDone);
    const pairs = track === 'ar'
      ? [{ k: item.ch, v: item.words[0].e }, { k: item.words[1].w, v: item.words[1].e }, { k: item.words[0].w, v: item.words[0].e }]
      : [{ k: item.s, v: item.e }, { k: 'A a', v: '🍎' }, { k: 'S s', v: '☀️' }];
    const cards = [];
    pairs.forEach((p, i) => { cards.push({ id: i, face: p.k, kind: 'k' }); cards.push({ id: i, face: p.v, kind: 'v' }); });
    const deck = shuffle(cards);
    let open = [], done = 0, lock = false;

    container.innerHTML = '';
    container.appendChild(el('div', 'section-title center', 'اقلِب الكروت ووصل كل حرف بصورته'));
    const grid = el('div', 'mem');
    deck.forEach(c => {
      const b = el('button', 'mem-card', '؟');
      let opened = false;
      b.addEventListener('click', () => {
        if (lock || opened) return;
        opened = true;
        b.classList.add('open');
        b.textContent = c.face;
        window.Audio2.say(c.face, track === 'ar' ? 'ar-SA' : 'en-US', 0.8);
        open.push({ c, b, setOpen: v => { opened = v; } });
        if (open.length === 2) {
          lock = true;
          const [a, bb] = open;
          if (a.c.id === bb.c.id) {
            a.b.classList.add('done'); bb.b.classList.add('done');
            done++;
            open = []; lock = false;
            window.App.juice(1);
            if (done === pairs.length) setTimeout(() => onDone({ ok: true, done: true }), 700);
          } else {
            setTimeout(() => {
              a.b.classList.remove('open'); a.b.textContent = '؟'; a.setOpen(false);
              bb.b.classList.remove('open'); bb.b.textContent = '؟'; bb.setOpen(false);
              open = []; lock = false;
            }, 850);
          }
        }
      });
      grid.appendChild(b);
    });
    container.appendChild(grid);
  }

  /* ---------- 5) قطار الآيات ---------- */
  function ayahTrain(container, ctx) {
    const { chunks } = ctx;              // chunks: [{text}]
    const onDone = once(ctx.onDone);
    let next = 0, wrong = 0, solved = false, helps = 0;
    container.innerHTML = '';
    container.appendChild(el('div', 'section-title center', 'رتّب الآيات بالترتيب الصح'));
    const ordered = el('div', '');
    container.appendChild(ordered);
    const pool = el('div', '');
    container.appendChild(pool);

    const items = shuffle(chunks.map((c, i) => ({ c, i })));
    const btns = [];
    items.forEach(it => {
      const b = el('button', 'ayah-chip', it.c.text);
      b.__it = it;
      b.addEventListener('click', () => { if (!solved) place(b); });
      btns.push(b);
      pool.appendChild(b);
    });

    const help = el('button', 'btn ghost sm', '🙋 ساعدني');
    help.style.marginTop = '12px';
    help.addEventListener('click', hint);
    container.appendChild(help);

    function place(b) {
      if (b.classList.contains('picked')) return;
      const it = b.__it;
      if (it.i === next) {
        b.classList.add('picked');
        ordered.appendChild(el('div', 'ayah-chip ordered', it.c.text));
        next++;
        window.App.juice(1);
        if (next === chunks.length) { solved = true; setTimeout(() => onDone({ ok: true, done: true }), 600); }
      } else {
        b.classList.add('wrong');
        setTimeout(() => b.classList.remove('wrong'), 420);
        wrong++;
        window.Audio2.say('مش المكان ده', 'ar-SA');
        if (wrong >= 3) autoSolve();       // بعد ٣ محاولات نرتّبها مع بعض — الطفل ما يتعلّقش
      }
    }

    function hint() {
      helps++;
      if (helps >= 2) { autoSolve(); return; }
      const target = btns.find(b => b.__it.i === next && !b.classList.contains('picked'));
      if (!target) return;
      target.classList.add('hint');
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => target.classList.remove('hint'), 2200);
    }

    function autoSolve() {
      if (solved) return;
      window.Audio2.say('تعالى نرتّبها مع بعض', 'ar-SA');
      const stepIdx = () => {
        if (solved) return;
        const target = btns.find(b => b.__it.i === next && !b.classList.contains('picked'));
        if (!target) return;
        target.classList.add('hint');
        setTimeout(() => {
          target.classList.remove('hint');
          place(target);
          setTimeout(stepIdx, 700);
        }, 800);
      };
      stepIdx();
    }
  }

  /* ---------- 6) فجوة الصمت (تحفيظ) ---------- */
  function gapRecall(container, ctx) {
    const { ayahs } = ctx;           // ayahs: [{text, audio}]
    const onDone = once(ctx.onDone);
    let i = 0;
    container.innerHTML = '';
    const box = el('div', 'card center');
    container.appendChild(box);

    function step() {
      if (i >= ayahs.length) { onDone({ ok: true, done: true }); return; }
      const a = ayahs[i];
      box.innerHTML = '';
      box.appendChild(el('div', 'section-title', 'الآية ' + (i + 1) + ' من ' + ayahs.length));
      box.appendChild(el('div', 'ayah-line', a.text));
      const bListen = el('button', 'btn sun sm', '🔊 اسمع تاني');
      const bNext = el('button', 'btn ghost sm', '✅ خلصت');
      const box2 = el('div', 'grid-2');
      box2.style.width = '100%';
      box2.appendChild(bListen); box2.appendChild(bNext);
      box.appendChild(box2);
      bListen.addEventListener('click', () => window.Audio2.playAyah(a.audio, 'ar-SA', a.text));
      bNext.addEventListener('click', () => { i++; step(); });
      window.Audio2.playAyah(a.audio, 'ar-SA', a.text);
    }
    step();
  }

  window.Games = { soundHunt, pickPicture, wordBuilder, memory, ayahTrain, gapRecall, shuffle, el };
})();
