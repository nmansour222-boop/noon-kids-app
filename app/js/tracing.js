/* ============ محرّك الكتابة: تتبّع بإصبع مع تقييم حقيقي ============ */
(function () {
  'use strict';
  const MS = 200;          // دقة مصفوفة الحرف
  const TOL = 7;           // تسامح الخروج عن الخط (خلايا)

  const FAM_AR = '"Amiri","Noto Naskh Arabic","Scheherazade New","Traditional Arabic",serif';
  const FAM_EN = '"Comic Sans MS","Chalkboard SE",Arial,sans-serif';

  /** يرسم الحرف بحجم يناسب المساحة فعلياً (بدون قص) */
  function drawFitted(g, glyph, W, H, latin, box) {
    const fam = latin ? FAM_EN : FAM_AR;
    const scaleBox = box || 0.66;
    g.font = '600 120px ' + fam;
    const m = g.measureText(glyph);
    const asc = (m.actualBoundingBoxAscent || 90);
    const desc = (m.actualBoundingBoxDescent || 30);
    const left = (m.actualBoundingBoxLeft || 0);
    const right = (m.actualBoundingBoxRight || m.width || 80);
    const gw = Math.max(1, left + right);
    const gh = Math.max(1, asc + desc);
    const k = Math.min((W * scaleBox) / gw, (H * scaleBox) / gh);
    const size = 120 * k;
    g.font = '600 ' + size + 'px ' + fam;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const x = W / 2 + ((left - right) / 2) * k;
    const y = H / 2 + (asc - desc) / 2 * k;
    g.fillText(glyph, x, y);
  }

  function buildGlyph(glyph, latin) {
    const c = document.createElement('canvas');
    c.width = c.height = MS;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#000'; g.fillRect(0, 0, MS, MS);
    g.fillStyle = '#fff';
    drawFitted(g, glyph, MS, MS, latin);
    const d = g.getImageData(0, 0, MS, MS).data;
    const m = new Uint8Array(MS * MS);
    let total = 0;
    for (let i = 0; i < MS * MS; i++) {
      if (d[i * 4] > 120) { m[i] = 1; total++; }
    }
    // توسيع (dilation) للتسامح
    const dil = new Uint8Array(MS * MS);
    for (let y = 0; y < MS; y++) {
      for (let x = 0; x < MS; x++) {
        if (!m[y * MS + x]) continue;
        for (let dy = -TOL; dy <= TOL; dy++) {
          const ny = y + dy; if (ny < 0 || ny >= MS) continue;
          for (let dx = -TOL; dx <= TOL; dx++) {
            const nx = x + dx; if (nx < 0 || nx >= MS) continue;
            if (dx * dx + dy * dy > TOL * TOL) continue;
            dil[ny * MS + nx] = 1;
          }
        }
      }
    }
    return { mask: m, dil, total };
  }

  class Tracer {
    constructor(canvas, glyph, opts) {
      this.canvas = canvas;
      this.glyph = glyph;
      this.latin = !!(opts && opts.latin);
      this.onProgress = (opts && opts.onProgress) || function () {};
      this.g = buildGlyph(glyph, this.latin);
      this.covered = new Uint8Array(MS * MS);
      this.coveredCount = 0;
      this.points = [];
      this.drawing = false;
      this.attempts = 0;
      this.locked = false;

      this.fit();
      this.bind();
      this.render();
      window.addEventListener('resize', this._onResize = () => { this.fit(); this.render(); });
    }

    fit() {
      const cssW = this.canvas.parentElement.clientWidth || 320;
      const cssH = Math.round(cssW * 0.92);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(cssW * dpr);
      this.canvas.height = Math.round(cssH * dpr);
      this.canvas.style.width = cssW + 'px';
      this.canvas.style.height = cssH + 'px';
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
        this.canvas.setPointerCapture && this.canvas.setPointerCapture(e.pointerId);
        this.drawing = true;
        const p = pt(e);
        this.points.push(p);
        this.stamp(p);
        this.render();
      };
      this._move = e => {
        if (!this.drawing || this.locked) return;
        const p = pt(e);
        const last = this.points[this.points.length - 1];
        this.points.push(p);
        this.stampLine(last, p);
        this.render();
        this._lastEmit = this._lastEmit || 0;
        const now = Date.now();
        if (now - this._lastEmit > 180) {
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
    stamp(p) { this.markAt(p.x, p.y, this.cssW * 0.075); }
    stampLine(a, b) {
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.ceil(d / 4));
      for (let i = 0; i <= steps; i++) {
        this.stamp({ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps });
      }
    }
    onTargetRatio() {
      if (!this.points.length) return 0;
      let on = 0;
      for (const p of this.points) {
        const c = this.toMask(p.x, p.y);
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
      g.fillStyle = '#FFFDF8';
      g.fillRect(0, 0, W, H);

      // الحرف كدليل باهت (بحجم مناسب للمساحة، بلا قص)
      g.save();
      g.fillStyle = '#E7D3B6';
      drawFitted(g, this.glyph, W, H, this.latin, 0.72);
      g.restore();

      // مسار الطفل
      if (this.points.length) {
        g.strokeStyle = '#FF7A59';
        g.lineWidth = Math.max(14, W * 0.075);
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.globalAlpha = 0.92;
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
      window.removeEventListener('resize', this._onResize);
      this.canvas.removeEventListener('pointerdown', this._down);
      this.canvas.removeEventListener('pointermove', this._move);
      this.canvas.removeEventListener('pointerup', this._up);
    }
  }

  window.Tracer = Tracer;
})();
