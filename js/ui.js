/* ============ عناصر الواجهة المشتركة: أيقونات، شخصية، تنبيهات ============ */
(function () {
  'use strict';

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  /** هروب HTML لأي نص جاي من المستخدم أو من ملف استعادة — لا يدخل innerHTML نص خام أبداً */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"'`]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c];
    });
  }

  const ICONS = {
    sound: '<path d="M4 9v6h3l4 3V6L7 9H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8.5 8.5 0 0 1 0 12"/>',
    play: '<path d="M7 5.5v13l11-6.5z"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    star: '<path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9z"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6.5 9.5V20h11V9.5"/>',
    map: '<path d="M3.5 6.5l6 2.5 5-2.5 6 2.5v11l-6-2.5-5 2.5-6-2.5z"/><path d="M9.5 9v11"/><path d="M14.5 6.5v11"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.8 20c1.2-3.6 4-5.4 7.2-5.4S18 16.4 19.2 20"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    forward: '<path d="M9 5l7 7-7 7"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3"/>',
    pencil: '<path d="M4 20l.9-4.2L16.3 4.4a2 2 0 0 1 2.8 0l.5.5a2 2 0 0 1 0 2.8L8.2 19.1z"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>',
    ear: '<path d="M8 9a4 4 0 1 1 8 0c0 2.5-2.2 3-2.2 5.2A2.8 2.8 0 0 1 11 17"/><path d="M11.5 9.5a1.6 1.6 0 0 1 3 0"/>',
    book: '<path d="M4 5.5c2.5-1 5.2-1 8 .5 2.8-1.5 5.5-1.5 8-.5v13c-2.5-1-5.2-1-8 .5-2.8-1.5-5.5-1.5-8-.5z"/><path d="M12 6v13"/>',
    sparkle: '<path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H5.5A3.5 3.5 0 0 0 9 9"/><path d="M16 5.5h2.5A3.5 3.5 0 0 1 15 9"/><path d="M12 13v3"/><path d="M8.5 20h7l-.7-4h-5.6z"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'
  };

  function icon(name, size, cls) {
    const p = ICONS[name] || '';
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) +
      '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  function iconBtn(name, label, cls, size) {
    const b = el('button', 'icon-btn ' + (cls || ''), icon(name, size || 22));
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.title = label;
    return b;
  }

  /* الشخصية المرشدة «نون» — بومة SVG بعيون بتطرف */
  function mascot(size, mood) {
    const s = size || 96;
    return '' +
      '<svg class="mascot mascot-' + (mood || 'happy') + '" viewBox="0 0 120 120" width="' + s + '" height="' + s + '" aria-hidden="true">' +
      '<defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FFD79A"/><stop offset="1" stop-color="#F6B86A"/></linearGradient></defs>' +
      '<ellipse cx="60" cy="104" rx="30" ry="6" fill="rgba(60,40,20,.10)"/>' +
      '<path d="M30 34c0-9 7-16 16-16h28c9 0 16 7 16 16v34c0 14-11 25-25 25h-10C41 93 30 82 30 68z" fill="url(#mg)" stroke="#E09A45" stroke-width="2"/>' +
      '<path d="M32 30l-6-13 17 6z" fill="#E9A54F"/>' +
      '<path d="M88 30l6-13-17 6z" fill="#E9A54F"/>' +
      '<g class="eyes">' +
      '<circle cx="47" cy="52" r="13" fill="#FFFDF7"/><circle cx="73" cy="52" r="13" fill="#FFFDF7"/>' +
      '<circle class="pupil" cx="49" cy="53" r="6" fill="#4A3A2A"/><circle class="pupil" cx="71" cy="53" r="6" fill="#4A3A2A"/>' +
      '<circle cx="51" cy="50" r="2" fill="#fff"/><circle cx="73" cy="50" r="2" fill="#fff"/>' +
      '</g>' +
      '<path d="M60 60l6 8h-12z" fill="#F08A3C"/>' +
      '<path d="M43 96c0 5 4 9 9 9M77 96c0 5-4 9-9 9" stroke="#E09A45" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  let toastTimer = null;
  function toast(msg, ms) {
    let t = document.getElementById('toast');
    if (!t) { t = el('div', 'toast'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = '';
    const sp = document.createElement('span');
    sp.textContent = String(msg == null ? '' : msg);
    t.appendChild(sp);
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms || 1800);
  }

  function burst(n) {
    const box = document.getElementById('confetti') || (() => { const b = el('div'); b.id = 'confetti'; document.body.appendChild(b); return b; })();
    const colors = ['#FF6B5A', '#FFB020', '#12A594', '#8B5CF6', '#2FA84F', '#3D8BFD'];
    for (let i = 0; i < (n || 14); i++) {
      const p = el('i', 'cf');
      p.style.background = colors[i % colors.length];
      p.style.left = (10 + Math.random() * 80) + '%';
      p.style.top = (14 + Math.random() * 26) + '%';
      p.style.borderRadius = Math.random() > .5 ? '50%' : '3px';
      p.style.animationDelay = (Math.random() * 0.18) + 's';
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--dy', (60 + Math.random() * 180) + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      box.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }
  }

  function starsFly(x, y) {
    burst(10);
  }

  window.UI = { el, esc, icon, iconBtn, mascot, toast, burst, starsFly };
})();
