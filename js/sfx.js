/* ============ مؤثرات صوتية مُولّدة (WebAudio) — بلا ملفات ============ */
(function () {
  'use strict';
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, gain, delay) {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain == null ? 0.09 : gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  window.SFX = {
    unlock() { const c = ac(); if (c && c.state === 'suspended') c.resume().catch(() => {}); },
    on(v) { enabled = v; },
    enabled() { return enabled; },
    tap() { tone(520, 0.07, 'sine', 0.05); },
    pop() { tone(760, 0.09, 'sine', 0.06); },
    correct() { tone(784, 0.12, 'sine', 0.08); tone(1046, 0.16, 'sine', 0.07, 0.09); },
    wrong() { tone(232, 0.16, 'triangle', 0.05); tone(196, 0.18, 'triangle', 0.04, 0.1); },
    star() { [880, 1108, 1318].forEach((f, i) => tone(f, 0.14, 'sine', 0.06, i * 0.07)); },
    levelup() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'sine', 0.07, i * 0.1)); },
    click() { tone(300, 0.05, 'sine', 0.04); }
  };
})();
