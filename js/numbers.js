/* ============ الأرقام ١–١٠٠: مراحل متدرّجة مع اختبار بوابة ============ */
(function () {
  'use strict';
  const STAGES = [];
  for (let s = 0; s < 10; s++) {
    const from = s * 10 + 1, to = s * 10 + 10;
    STAGES.push({ i: s, from: from, to: to });
  }
  const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function toAr(n) {
    return String(n).split('').map(function (d) {
      return /[0-9]/.test(d) ? AR_DIGITS[+d] : d;
    }).join('');
  }
  // فصحى موحّدة — بلا خلط مع العامية
  // العناوين تُبنى بعد تعريف toAr (تجنّب استخدامه قبل تهيئته)
  const NAMES = ['صِفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
    'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر', 'عشرون'];
  const TENS = { 2: 'عشرون', 3: 'ثلاثون', 4: 'أربعون', 5: 'خمسون', 6: 'ستون', 7: 'سبعون', 8: 'ثمانون', 9: 'تسعون' };

  STAGES.forEach(function (st) { st.title = 'من ' + toAr(st.from) + ' إلى ' + toAr(st.to); });

  window.NUMBERS = {
    stages: STAGES,
    toAr: toAr,
    name: function (n) {
      n = Math.round(Number(n) || 0);
      if (n === 100) return 'مئة';
      if (n > 100) return n === 200 ? 'مئتان' : n + '؟';
      if (n < 0) return '';
      if (n <= 20) return NAMES[n];
      const ones = n % 10, tens = Math.floor(n / 10);
      const tensName = TENS[tens];
      if (!tensName) return String(n);
      if (!ones) return tensName;
      return NAMES[ones] + ' و' + tensName;
    },
    /** ١٠٠٠ وأكثر لا تُدرَّس هنا */
    max: 100
  };
})();
