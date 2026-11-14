/* ============ الأرقام ١–١٠٠: مراحل متدرّجة مع اختبار بوابة ============ */
(function () {
  'use strict';
  const STAGES = [];
  for (let s = 0; s < 10; s++) {
    const from = s * 10 + 1, to = s * 10 + 10;
    STAGES.push({ i: s, from: from, to: to, title: 'من ' + from + ' إلى ' + to });
  }
  const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function toAr(n) {
    return String(n).split('').map(function (d) {
      return /[0-9]/.test(d) ? AR_DIGITS[+d] : d;
    }).join('');
  }
  const NAMES = ['صفر', 'واحد', 'اتنين', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'تمانينة', 'تسعة', 'عشرة',
    'حداشر', 'اتناشر', 'تلتاشر', 'أربعتاشر', 'خمستاشر', 'ستاشر', 'سبعتاشر', 'تمنتاشر', 'تسعتاشر', 'عشرين'];

  window.NUMBERS = {
    stages: STAGES,
    toAr: toAr,
    name: function (n) {
      if (n <= 20) return NAMES[n];
      const ones = n % 10, tens = Math.floor(n / 10);
      const tensName = { 2: 'عشرين', 3: 'تلاتين', 4: 'أربعين', 5: 'خمسين', 6: 'ستين', 7: 'سبعين', 8: 'تمانين', 9: 'تسعين' }[tens];
      if (!ones) return tensName;
      return NAMES[ones] + ' و' + tensName;
    }
  };
})();
