/* ============ رسم الحروف من مسارات جاهزة: دقة كاملة + حركات لا تتلاصق ============ */
(function () {
  'use strict';
  const G = window.GLYPHS || { ar: {}, marks: {}, en: {}, em: 1000, enEm: 1000 };

  // ترتيب الحركات فوق الحرف (من الأسفل للأعلى) وتحتها
  const MK_SCALE = 0.72;          // تصغير الحركات لتناسب عين الطفل
  const MK_GAP = 0.018;           // فجوة بين الحركة والحرف (نسبة من em)
  const ABOVE = ['shadda', 'fatha', 'fathatan', 'damma', 'dammatan', 'sukun'];
  const BELOW = ['kasra', 'kasratan'];

  /* الحروف المهموزة تُركّب يدوياً: أساس + همزة بمقاس مضبوط (تمنع التلاصق والتباعد) */
  const COMPOSE = {
    '\u0623': { base: '\u0627', up: 'hamza' },   // أ
    '\u0625': { base: '\u0627', down: 'hamza' }, // إ
    '\u0622': { base: '\u0627', up: 'madda' },   // آ
    '\u0624': { base: '\u0648', up: 'hamza' },   // ؤ
    '\u0626': { base: '\u064A', up: 'hamza' }    // ئ
  };

  function glyphOf(ch, latin) {
    const set = latin ? G.en : G.ar;
    return set[ch] || null;
  }

  /** واجهة التخطيط: تركّب الحروف المهموزة ثم تحسب الحركات */
  function layout(ch, marks, latin) {
    const comp = !latin ? COMPOSE[ch] : null;
    if (comp) {
      const b0 = glyphOf(comp.base, false);
      if (b0) {
        const extra = [].concat(marks || []);
        const L = layoutBase(comp.base, extra, false);
        // اضبط موضع الهمزة/المدة فوق أو تحت الأساس
        const bx = (b0.b[0] + b0.b[2]) / 2;
        const mk = G.marks[comp.up || comp.down];
        if (mk && mk.b) {
          const mc = (mk.b[0] + mk.b[2]) / 2;
          const gap = L.em * 0.012;   // فجوة صغيرة: الهمزة قريبة من رأس الألف
          const isUp = !!comp.up;
          let cursor = isUp ? b0.b[3] + gap : b0.b[1] - gap;
          const sc = 0.78;
          const dy = (isUp ? cursor - mk.b[1] * sc : cursor - mk.b[3] * sc);
          const dx = bx - mc * sc;
          L.paths.push({ d: mk.d, dx: dx, dy: dy, s: sc, part: 'haraka' });
          L.box[3] = Math.max(L.box[3], mk.b[3] * sc + dy);
          L.box[1] = Math.min(L.box[1], mk.b[1] * sc + dy);
          L.box[0] = Math.min(L.box[0], mk.b[0] * sc + dx - L.em * 0.02);
          L.box[2] = Math.max(L.box[2], mk.b[2] * sc + dx + L.em * 0.02);
        }
        return L;
      }
    }
    return layoutBase(ch, marks, latin);
  }

  /** التخطيط الأساسي: حرف + حركاته */
  function layoutBase(ch, marks, latin) {
    const base = glyphOf(ch, latin);
    if (!base || !base.b) {
      return { paths: [], box: [0, -700, 500, 700], em: G.em, latin: latin };
    }
    const em = latin ? G.enEm : G.em;
    const b = base.b;                       // [xMin, yMin, xMax, yMax]
    const cx = (b[0] + b[2]) / 2;
    const gap = em * 0.035;
    const pad = em * 0.03;

    const paths = [{ d: base.d, dx: 0, dy: 0, part: 'base' }];
    let top = b[3], bottom = b[1], left = b[0], right = b[2];

    const above = (marks || []).filter(function (m) { return ABOVE.indexOf(m) >= 0; })
      .sort(function (a, c) { return ABOVE.indexOf(a) - ABOVE.indexOf(c); });
    const below = (marks || []).filter(function (m) { return BELOW.indexOf(m) >= 0; });

    const mgap = em * MK_GAP;
    let cursor = b[3] + mgap;
    above.forEach(function (name) {
      const m = G.marks[name];
      if (!m || !m.b) return;
      const mb = m.b, sc = MK_SCALE;
      const mc = (mb[0] + mb[2]) / 2;
      const dy = cursor - mb[1] * sc;       // أسفل الحركة (بعد التصغير) عند المؤشر
      const dx = cx - mc * sc;
      paths.push({ d: m.d, dx: dx, dy: dy, s: sc, part: 'mark' });
      top = Math.max(top, mb[3] * sc + dy);
      left = Math.min(left, mb[0] * sc + dx - pad);
      right = Math.max(right, mb[2] * sc + dx + pad);
      cursor = mb[3] * sc + dy + mgap * 0.8;
    });

    let cursorLow = b[1] - mgap;
    below.forEach(function (name) {
      const m = G.marks[name];
      if (!m || !m.b) return;
      const mb = m.b, sc = MK_SCALE;
      const mc = (mb[0] + mb[2]) / 2;
      const dy = cursorLow - mb[3] * sc;
      const dx = cx - mc * sc;
      paths.push({ d: m.d, dx: dx, dy: dy, s: sc, part: 'mark' });
      bottom = Math.min(bottom, mb[1] * sc + dy);
      left = Math.min(left, mb[0] * sc + dx - pad);
      right = Math.max(right, mb[2] * sc + dx + pad);
      cursorLow = mb[1] * sc + dy - mgap * 0.8;
    });

    const padY = em * 0.02;
    return {
      paths: paths,
      box: [left - pad, bottom - padY, right + pad, top + padY],
      em: em,
      latin: !!latin
    };
  }

  /* صندوق موحّد (em) لمقارنة الحروف بمقاساتها الحقيقية */
  const FIXED_AR = [-120, -310, 890, 1130];
  const FIXED_EN = [-40, -240, 700, 780];

  /** SVG جاهز للعرض */
  function svg(ch, opts) {
    opts = opts || {};
    const L = layout(ch, opts.marks || [], opts.latin);
    if (opts.emBox) {
      const fixed = opts.latin ? FIXED_EN : FIXED_AR;
      const fw = fixed[2] - fixed[0], fh = fixed[3] - fixed[1];
      const size = opts.size || 56;
      const body = L.paths.map(function (p) {
        const sc = p.s && p.s !== 1 ? ' scale(' + p.s + ')' : '';
        return '<path d="' + p.d + '" transform="translate(' + (p.dx || 0) + ',' + (p.dy || 0) + ')' + sc + '"/>';
      }).join('');
      return '<svg class="g-svg ' + (opts.cls || '') + '" width="' + Math.round(size * fw / fh) + '" height="' + size +
        '" viewBox="' + fixed[0] + ' ' + (-fixed[3]) + ' ' + fw + ' ' + fh + '" aria-hidden="true">' +
        '<g transform="scale(1,-1)" fill="' + (opts.color || 'currentColor') + '">' + body + '</g></svg>';
    }
    const [x0, y0, x1, y1] = L.box;
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    const size = opts.size || 120;
    const scale = size / Math.max(w, h);
    const vbW = w * scale, vbH = h * scale;
    const body = L.paths.map(function (p) {
      const sc = p.s && p.s !== 1 ? ' scale(' + p.s + ')' : '';
      return '<path d="' + p.d + '" transform="translate(' + (p.dx || 0) + ',' + (p.dy || 0) + ')' + sc + '"/>';
    }).join('');
    return '<svg class="g-svg ' + (opts.cls || '') + '" width="' + Math.round(vbW) + '" height="' + Math.round(vbH) +
      '" viewBox="' + x0 + ' ' + (-y1) + ' ' + w + ' ' + h + '" aria-hidden="true">' +
      '<g transform="scale(1,-1) translate(0,' + (-2 * 0) + ')" fill="' +
      (opts.color || 'currentColor') + '">' + body + '</g></svg>';
  }

  /** يرسم نفس المسارات على canvas (للكتابة) مع تحويل مقياس */
  function drawOnCanvas(ctx, ch, opts, W, H, box) {
    const L = layout(ch, opts.marks || [], opts.latin);
    const [x0, y0, x1, y1] = L.box;
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    const fill = box || 0.78;
    const k = Math.min((W * fill) / w, (H * fill) / h);
    const tx = W / 2 - ((x0 + x1) / 2) * k;
    const ty = H / 2 + ((y0 + y1) / 2) * k;
    ctx.save();
    ctx.transform(k, 0, 0, -k, tx, ty);
    L.paths.forEach(function (p) {
      const path = new Path2D(p.d);
      ctx.save();
      ctx.translate(p.dx || 0, p.dy || 0);
      if (p.s && p.s !== 1) ctx.scale(p.s, p.s);
      ctx.fill(path);
      ctx.restore();
    });
    ctx.restore();
    return { k: k, tx: tx, ty: ty, box: L.box };
  }

  /** حركة وحدها (للتعليم المباشر) */
  function mark(name, opts) {
    opts = opts || {};
    const m = G.marks[name];
    if (!m || !m.b) return '';
    const b = m.b;
    const w = b[2] - b[0], h = b[3] - b[1];
    const pad = Math.max(w, h) * 0.14;
    const size = opts.size || 60;
    const scale = size / (h + pad * 2);
    return '<svg class="g-svg ' + (opts.cls || '') + '" width="' + Math.round((w + pad * 2) * scale) + '" height="' + size +
      '" viewBox="' + (b[0] - pad) + ' ' + (-(b[3] + pad)) + ' ' + (w + pad * 2) + ' ' + (h + pad * 2) + '" aria-hidden="true">' +
      '<g transform="scale(1,-1)" fill="' + (opts.color || 'currentColor') + '"><path d="' + m.d + '"/></g></svg>';
  }

  window.Glyph = {
    mark: mark,
    svg: svg,
    layout: layout,
    drawOnCanvas: drawOnCanvas,
    has: function (ch, latin) { return !!glyphOf(ch, latin); }
  };
})();
