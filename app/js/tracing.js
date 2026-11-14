/* ============ محرّك الكتابة: تتبّع بإصبع مبني على نفس مسارات الحرف المعروض ============ */
(function () {
  'use strict';
  const MS = 220;          // دقة مصفوفة الحرف
  const TOL = 6;           // تسامح (خلايا) حول الحرف

  /** يرسم حرفاً على canvas بواسطة مساراته الحقيقية ويُرجع خريطة نقاطه */
  function rasterize(ch, marks, latin) {
    const c = document.createElement('canvas');
    c.width = c.height = MS;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#000'; g.fillRect(0, 0, MS, MS);
    g.fillStyle = '#fff';
    Glyph.drawOnCanvas(g, ch, { marks: marks, latin: latin }, MS, MS, 0.8);

    const d = g.getImageData(0, 0, MS, MS).data;
    const m = new Uint8Array(MS * MS);
    let total = 0, minX = MS, maxX = -1, minY = MS, maxY = -1;
    for (let i = 0; i < MS * MS; i++) {
      if (d[i * 4] > 120) {
        m[i] = 1; total++;
        const x = i % MS, y = (i / MS) | 0;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    const dil = new Uint8Array(MS * MS);
    for (let y = 0; y < MS; y++) {
      for (let x = 0; x < MS; x++) {
        if (!m[y * MS + x]) continue;
        for (let dy = -TOL; dy <= TOL; dy++) {
          const ny = y + dy; if (ny < 0 || ny >= MS) continue;
          for (let dx = -TOL; dx <= TOL; dx++) {
            if (dx * dx + dy * dy > TOL * TOL) continue;
            const nx = x + dx; if (nx < 0 || nx >= MS) continue;
            dil[ny * MS + nx] = 1;
          }
        }
      }
    }
    // نقطة البداية: أعلى اليمين (اتجاه الكتابة)
    let sx = -1, sy = -1;
    for (let y = minY; y <= maxY; y++) {
      for (let x = maxX; x >= minX; x--) {
        if (m[y * MS + x] && (x > sx)) { sx = x; sy = y; }
      }
    }
    if (sx < 0) { sx = MS / 2; sy = MS / 2; }
    return { mask: m, dil: dil, total: total, start: { x: sx, y: sy }, bbox: [minX, minY, maxX, maxY] };
  }

  class Tracer {
    constructor(canvas, ch, opts) {
      opts = opts || {};
      this.canvas = canvas;
      this.ch = ch;
      this.marks = opts.marks || [];
      this.latin = !!opts.latin;
      this.onProgress = opts.onProgress || function () {};
      this.g = rasterize(ch, this.marks, this.latin);
      this.covered = new Uint8Array(MS * MS);
      this.coveredCount = 0;
      this.points = [];
      this.drawing = false;
      this.attempts = 0;
      this.locked = false;
      this.fit();
      this.bind();
      this.render();
      this._onResize = () => { this.fit(); this.render(); };
      window.addEventListener('resize', this._onResize);
      this._anim = setInterval(() => { if (!this.points.length && !this.locked) this.render(); }, 380);
    }

    fit() {
      const box = this.canvas.parentElement.getBoundingClientRect();
      const cssW = Math.max(160, Math.round(box.width));
      const cssH = Math.max(160, Math.round(box.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(cssW * dpr);
      this.canvas.height = Math.round(cssH * dpr);
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.cssW = cssW; this.cssH = cssH; this.dpr = dpr;
    }

    toMask(x, y) {
      return {
        mx: Math.max(0, Math.min(MS - 1, (x / this.cssW) * MS)),
        my: Math.max(0, Math.min(MS - 1, (y / this.cssH) * MS))
      };
    }

    bind() {
      const pt = e => {
        const r = this.canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (this.cssW / r.width), y: (e.clientY - r.top) * (this.cssH / r.height) };
      };
      this._down = e => {
        if (this.locked) return;
        e.preventDefault();
        if (this.canvas.setPointerCapture) this.canvas.setPointerCapture(e.pointerId);
        this.drawing = true;
        const p = pt(e);
        this.points.push(p);
        this.stamp(p);
        this.render();
      };
      this._move = e => {
        if (!this.drawing || this.locked) return;
        e.preventDefault();
        const p = pt(e);
        const last = this.points[this.points.length - 1];
        this.points.push(p);
        this.stampLine(last, p);
        this.render();
        const now = Date.now();
        this._lastEmit = this._lastEmit || 0;
        if (now - this._lastEmit > 170) {
          this._lastEmit = now;
          this.onProgress({ coverage: this.coverage(), attempts: this.attempts });
        }
      };
      this._up = () => {
        if (!this.drawing) return;
        this.drawing = false;
        this.evaluate();
      };
      this.canvas.addEventListener('pointerdown', this._down);
      this.canvas.addEventListener('pointermove', this._move);
      this.canvas.addEventListener('pointerup', this._up);
      this.canvas.addEventListener('pointercancel', this._up);
      this.canvas.addEventListener('pointerleave', () => { if (this.drawing) { this.drawing = false; this.evaluate(); } });
    }

    markAt(x, y, r) {
      const c = this.toMask(x, y);
      const rr = Math.max(2, (r / this.cssW) * MS);
      const cx = Math.round(c.mx), cy = Math.round(c.my);
      const R = Math.ceil(rr);
      for (let dy = -R; dy <= R; dy++) {
        const ny = cy + dy; if (ny < 0 || ny >= MS) continue;
        for (let dx = -R; dx <= R; dx++) {
          const nx = cx + dx; if (nx < 0 || nx >= MS) continue;
          if (dx * dx + dy * dy > rr * rr) continue;
          const i = ny * MS + nx;
          if (this.g.mask[i] && !this.covered[i]) { this.covered[i] = 1; this.coveredCount++; }
        }
      }
    }
    stamp(p) { this.markAt(p.x, p.y, this.cssW * 0.08); }
    stampLine(a, b) {
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.ceil(d / 3));
      for (let i = 0; i <= steps; i++) {
        this.stamp({ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps });
      }
    }
    onTargetRatio() {
      if (!this.points.length) return 0;
      let on = 0;
      for (let i = 0; i < this.points.length; i++) {
        const c = this.toMask(this.points[i].x, this.points[i].y);
        if (this.g.dil[Math.round(c.my) * MS + Math.round(c.mx)]) on++;
      }
      return on / this.points.length;
    }
    coverage() { return this.coveredCount / Math.max(1, this.g.total); }

    evaluate() {
      const cov = this.coverage();
      const on = this.onTargetRatio();
      this.attempts++;
      this.onProgress({ coverage: cov, onTarget: on, attempts: this.attempts });
      return { coverage: cov, onTarget: on };
    }
    stars() {
      const cov = this.coverage();
      if (cov >= 0.82) return 3;
      if (cov >= 0.6) return 2;
      if (cov >= 0.35) return 1;
      return 0;
    }

    render() {
      const g = this.canvas.getContext('2d');
      const W = this.cssW, H = this.cssH;
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#FFFFFF';
      g.fillRect(0, 0, W, H);

      // الحرف كدليل: مسار مفرّغ (outline) واضح
      g.save();
      const shape = Glyph.layout(this.ch, this.marks, this.latin);
      const [x0, y0, x1, y1] = shape.box;
      const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
      const k = Math.min((W * 0.74) / w, (H * 0.74) / h);
      const tx = W / 2 - ((x0 + x1) / 2) * k;
      const ty = H / 2 + ((y0 + y1) / 2) * k;
      g.transform(k, 0, 0, -k, tx, ty);
      g.lineWidth = 7 / k;
      g.lineJoin = 'round';
      g.lineCap = 'round';
      g.strokeStyle = this.latin ? '#A9D8D0' : '#E4C3B2';
      g.fillStyle = this.latin ? '#F4FBF9' : '#FEF6F1';
      shape.paths.forEach(function (p) {
        const path = new Path2D(p.d);
        g.save(); g.translate(p.dx || 0, p.dy || 0);
        g.fill(path); g.stroke(path);
        g.restore();
      });
      g.restore();

      // نقطة البداية النابضة
      if (!this.points.length && !this.locked) {
        const sx = (this.g.start.x / MS) * W, sy = (this.g.start.y / MS) * H;
        const rr = Math.max(10, W * 0.032) * (1 + Math.sin(Date.now() / 320) * 0.15);
        g.beginPath(); g.arc(sx, sy, rr, 0, Math.PI * 2);
        g.fillStyle = this.latin ? '#12A594' : '#FF6B5A'; g.fill();
        g.beginPath(); g.arc(sx, sy, rr * 2.2, 0, Math.PI * 2);
        g.strokeStyle = this.latin ? 'rgba(18,165,148,.3)' : 'rgba(255,107,90,.3)';
        g.lineWidth = 3; g.stroke();
      }

      // خط إصبع الطفل
      if (this.points.length) {
        g.strokeStyle = this.latin ? '#12A594' : '#FF6B5A';
        g.lineWidth = Math.max(13, W * 0.08);
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.globalAlpha = 0.9;
        g.beginPath();
        g.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) g.lineTo(this.points[i].x, this.points[i].y);
        if (this.points.length === 1) g.lineTo(this.points[0].x + 0.1, this.points[0].y + 0.1);
        g.stroke();
        g.globalAlpha = 1;
      }
    }

    clear() {
      this.points = [];
      this.covered = new Uint8Array(MS * MS);
      this.coveredCount = 0;
      this.locked = false;
      this.render();
    }

    destroy() {
      clearInterval(this._anim);
      window.removeEventListener('resize', this._onResize);
      this.canvas.removeEventListener('pointerdown', this._down);
      this.canvas.removeEventListener('pointermove', this._move);
      this.canvas.removeEventListener('pointerup', this._up);
    }
  }

  window.Tracer = Tracer;
})();
