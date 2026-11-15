/* ============ المنهج: العربية + الإنجليزية ============ */
(function () {
  'use strict';

  // ---------------- العربية: ٢٨ حرفاً بالترتيب الأبجدي المصري ----------------
  // الترتيب: الأبجدي المتعارف عليه في مصر
  const LETTERS = [
    { id: 'alef',  ch: 'أ', base: 'ا', name: 'أَلِف',  sound: 'أَ', words: [{ w: 'أَسَد', e: '🦁' }, { w: 'أَرْنَب', e: '🐰' }] },
    { id: 'ba',    ch: 'ب', base: 'ب', name: 'بَاء',  sound: 'بَ', words: [{ w: 'بَطَّة', e: '🦆' }, { w: 'بَاب', e: '🚪' }] },
    { id: 'ta',    ch: 'ت', base: 'ت', name: 'تَاء',  sound: 'تَ', words: [{ w: 'تُفَّاحَة', e: '🍎' }, { w: 'تَنُّورَة', e: '👗' }] },
    { id: 'tha',   ch: 'ث', base: 'ث', name: 'ثَاء',  sound: 'ثَ', words: [{ w: 'ثَعْلَب', e: '🦊' }, { w: 'ثَوْر', e: '🐂' }] },
    { id: 'jeem',  ch: 'ج', base: 'ج', name: 'جِيم',  sound: 'جَ', words: [{ w: 'جَمَل', e: '🐪' }, { w: 'جَبَل', e: '⛰️' }] },
    { id: 'ha',    ch: 'ح', base: 'ح', name: 'حَاء',  sound: 'حَ', words: [{ w: 'حِصَان', e: '🐴' }, { w: 'حُوت', e: '🐳' }] },
    { id: 'kha',   ch: 'خ', base: 'خ', name: 'خَاء',  sound: 'خَ', words: [{ w: 'خُبْز', e: '🍞' }, { w: 'خَرُوف', e: '🐑' }] },
    { id: 'dal',   ch: 'د', base: 'د', name: 'دَال',  sound: 'دَ', words: [{ w: 'دُبّ', e: '🐻' }, { w: 'دِيك', e: '🐓' }] },
    { id: 'thal',  ch: 'ذ', base: 'ذ', name: 'ذَال',  sound: 'ذَ', words: [{ w: 'ذِئْب', e: '🐺' }, { w: 'ذَهَب', e: '🥇' }] },
    { id: 'ra',    ch: 'ر', base: 'ر', name: 'رَاء',  sound: 'رَ', words: [{ w: 'رِيشَة', e: '🪶' }, { w: 'رَمْل', e: '🏖️' }] },
    { id: 'zay',   ch: 'ز', base: 'ز', name: 'زَاي',  sound: 'زَ', words: [{ w: 'زَرَافَة', e: '🦒' }, { w: 'زَهْرَة', e: '🌸' }] },
    { id: 'seen',  ch: 'س', base: 'س', name: 'سِين',  sound: 'سَ', words: [{ w: 'سَمَكَة', e: '🐟' }, { w: 'سَاعَة', e: '⌚' }] },
    { id: 'sheen', ch: 'ش', base: 'ش', name: 'شِين',  sound: 'شَ', words: [{ w: 'شَمْس', e: '☀️' }, { w: 'شَجَرَة', e: '🌳' }] },
    { id: 'sad',   ch: 'ص', base: 'ص', name: 'صَاد',  sound: 'صَ', words: [{ w: 'صَقْر', e: '🦅' }, { w: 'صَابُون', e: '🧼' }] },
    { id: 'dad',   ch: 'ض', base: 'ض', name: 'ضَاد',  sound: 'ضَ', words: [{ w: 'ضِفْدَع', e: '🐸' }, { w: 'ضَوْء', e: '💡' }] },
    { id: 'taa',   ch: 'ط', base: 'ط', name: 'طَاء',  sound: 'طَ', words: [{ w: 'طَائِر', e: '🐦' }, { w: 'طَمَاطِم', e: '🍅' }] },
    { id: 'zaa',   ch: 'ظ', base: 'ظ', name: 'ظَاء',  sound: 'ظَ', words: [{ w: 'ظَرْف', e: '✉️' }, { w: 'ظَبْي', e: '🦌' }] },
    { id: 'ain',   ch: 'ع', base: 'ع', name: 'عَيْن', sound: 'عَ', words: [{ w: 'عَيْن', e: '👁️' }, { w: 'عِنَب', e: '🍇' }] },
    { id: 'ghain', ch: 'غ', base: 'غ', name: 'غَيْن', sound: 'غَ', words: [{ w: 'غُرَاب', e: '🐦‍⬛' }, { w: 'غَيْمَة', e: '☁️' }] },
    { id: 'fa',    ch: 'ف', base: 'ف', name: 'فَاء',  sound: 'فَ', words: [{ w: 'فِيل', e: '🐘' }, { w: 'فَرَاشَة', e: '🦋' }] },
    { id: 'qaf',   ch: 'ق', base: 'ق', name: 'قَاف',  sound: 'قَ', words: [{ w: 'قِطّ', e: '🐱' }, { w: 'قَمَر', e: '🌙' }] },
    { id: 'kaf',   ch: 'ك', base: 'ك', name: 'كَاف',  sound: 'كَ', words: [{ w: 'كِتَاب', e: '📖' }, { w: 'كَلْب', e: '🐶' }] },
    { id: 'lam',   ch: 'ل', base: 'ل', name: 'لَام',  sound: 'لَ', words: [{ w: 'لَيْمُون', e: '🍋' }, { w: 'لُعْبَة', e: '🎠' }] },
    { id: 'meem',  ch: 'م', base: 'م', name: 'مِيم',  sound: 'مَ', words: [{ w: 'مَوْز', e: '🍌' }, { w: 'مِفْتَاح', e: '🔑' }] },
    { id: 'noon',  ch: 'ن', base: 'ن', name: 'نُون',  sound: 'نَ', words: [{ w: 'نَجْمَة', e: '⭐' }, { w: 'نَمِر', e: '🐯' }] },
    { id: 'haa',   ch: 'ه', base: 'ه', name: 'هَاء',  sound: 'هَ', words: [{ w: 'هَاتِف', e: '📱' }, { w: 'هَدِيَّة', e: '🎁' }] },
    { id: 'waw',   ch: 'و', base: 'و', name: 'وَاو',  sound: 'وَ', words: [{ w: 'وَرْدَة', e: '🌹' }, { w: 'وَلَد', e: '👦' }] },
    { id: 'ya',    ch: 'ي', base: 'ي', name: 'يَاء',  sound: 'يَ', words: [{ w: 'يَد', e: '✋' }, { w: 'يَاسَمِين', e: '🌼' }] }
  
  ];

  // ---------------- الإنجليزية: 42 صوتاً بترتيب Synthetic Phonics ----------------
  const SOUNDS = [
    { g: 1, s: 'a', ar: 'ا', w: 'apple',  e: '🍎' },
    { g: 3, s: 'b', ar: 'ب', w: 'bee',    e: '🐝' },
    { g: 2, s: 'c k', ar: 'ك', w: 'cat',  e: '🐱' },
    { g: 2, s: 'd', ar: 'د', w: 'dog',    e: '🐶' },
    { g: 2, s: 'e', ar: 'إ', w: 'egg',    e: '🥚' },
    { g: 3, s: 'f', ar: 'ف', w: 'fish',   e: '🐟' },
    { g: 3, s: 'g', ar: 'ج', w: 'goat',   e: '🐐' },
    { g: 2, s: 'h', ar: 'ه', w: 'house',  e: '🏠' },
    { g: 1, s: 'i', ar: 'إ', w: 'insect', e: '🐞' },
    { g: 4, s: 'j', ar: 'ج', w: 'juice',  e: '🧃' },
    { g: 3, s: 'l', ar: 'ل', w: 'lion',   e: '🦁' },
    { g: 2, s: 'm', ar: 'م', w: 'moon',   e: '🌙' },
    { g: 1, s: 'n', ar: 'ن', w: 'net',    e: '🥅' },
    { g: 3, s: 'o', ar: 'و', w: 'octopus',e: '🐙' },
    { g: 1, s: 'p', ar: 'ب', w: 'pig',    e: '🐷' },
    { g: 2, s: 'r', ar: 'ر', w: 'rabbit', e: '🐰' },
    { g: 1, s: 's', ar: 'س', w: 'sun',    e: '☀️' },
    { g: 1, s: 't', ar: 'ت', w: 'tiger',  e: '🐯' },
    { g: 3, s: 'u', ar: 'أ', w: 'umbrella', e: '☂️' },
    { g: 5, s: 'v', ar: 'ف', w: 'van',    e: '🚐' },
    { g: 5, s: 'w', ar: 'و', w: 'water',  e: '💧' },
    { g: 6, s: 'x', ar: 'كس', w: 'box',   e: '📦' },
    { g: 6, s: 'y', ar: 'ي', w: 'yellow', e: '🟡' },
    { g: 5, s: 'z', ar: 'ز', w: 'zebra',  e: '🦓' },
    { g: 5, s: 'OO', ar: 'أوو', w: 'moon', e: '🌕' },
    { g: 6, s: 'TH', ar: 'ذ', w: 'this',   e: '👉' },
    { g: 4, s: 'ai', ar: 'إي', w: 'rain',  e: '🌧️' },
    { g: 7, s: 'ar', ar: 'آر', w: 'star',  e: '⭐' },
    { g: 6, s: 'ch', ar: 'تش', w: 'cheese',e: '🧀' },
    { g: 4, s: 'ee', ar: 'إي', w: 'sheep', e: '🐑' },
    { g: 7, s: 'er', ar: 'ر', w: 'flower', e: '🌸' },
    { g: 4, s: 'ie', ar: 'آي', w: 'pie',   e: '🥧' },
    { g: 5, s: 'ng', ar: 'نغ', w: 'ring',  e: '💍' },
    { g: 4, s: 'oa', ar: 'أو', w: 'boat',  e: '⛵' },
    { g: 7, s: 'oi', ar: 'أوي', w: 'coin',  e: '🪙' },
    { g: 5, s: 'oo', ar: 'أو', w: 'book',  e: '📖' },
    { g: 4, s: 'or', ar: 'أو', w: 'orange',e: '🍊' },
    { g: 7, s: 'ou', ar: 'آو', w: 'mouse', e: '🐭' },
    { g: 7, s: 'qu', ar: 'كو', w: 'queen', e: '👸' },
    { g: 6, s: 'sh', ar: 'ش', w: 'shell',  e: '🐚' },
    { g: 6, s: 'th', ar: 'ث', w: 'three',  e: '3️⃣' },
    { g: 7, s: 'ue', ar: 'يو', w: 'blue',  e: '🔵' }
  
  ];

  const CVC = [
    { w: 'cat', e: '🐱' }, { w: 'sun', e: '☀️' }, { w: 'hat', e: '🎩' }, { w: 'pen', e: '🖊️' },
    { w: 'dog', e: '🐶' }, { w: 'net', e: '🥅' }, { w: 'pig', e: '🐷' }, { w: 'bus', e: '🚌' },
    { w: 'cup', e: '🥤' }, { w: 'box', e: '📦' }, { w: 'jam', e: '🍯' }, { w: 'map', e: '🗺️' },
    { w: 'bed', e: '🛏️' }, { w: 'top', e: '🎯' }, { w: 'fan', e: '🪭' },
    // مرحلة satpin — كلمات تُبنى من أول ٦ أصوات فقط (Synthetic Phonics)
    { w: 'pin', e: '📌' }, { w: 'pan', e: '🍳' }, { w: 'tap', e: '🚰' },
    { w: 'snap', e: '🫰' }, { w: 'tin', e: '🥫' }, { w: 'sit', e: '🪑' },
    { w: 'ant', e: '🐜' }, { w: 'tip', e: '👆' }, { w: 'sip', e: '🥤' },
    { w: 'pat', e: '🐾' }
  ];

  /* ترتيب Synthetic Phonics القياسي (Letters and Sounds):
     satpin → ck e h r m d → g o u l f b → ai j oa ie ee or → z w ng v oo → y x ch sh th → qu ou oi ue er ar.
     الترتيب في المصفوفة أعلاه أبجدي للقراءة فقط؛ التدريس يمشي بترتيب PHONICS. */
  const PHONICS_ORDER = [
    's', 'a', 't', 'p', 'i', 'n',
    'c k', 'e', 'h', 'r', 'm', 'd',
    'g', 'o', 'u', 'l', 'f', 'b',
    'ai', 'j', 'oa', 'ie', 'ee', 'or',
    'z', 'w', 'ng', 'v', 'oo', 'OO',
    'y', 'x', 'ch', 'sh', 'th', 'TH',
    'qu', 'ou', 'oi', 'ue', 'er', 'ar'
  ];
  /* oid = الرقم الأصلي للصوت (قبل إعادة الترتيب). نستخدمه في معرّفات الوحدات والإتقان
     حتى لا يضيع تقدّم من بدأ بالنسخة القديمة، ولا يتأثر لو أُعيد الترتيب مستقبلاً.
     المفاتيح حسّاسة لحالة الحرف: 'oo' (book) غير 'OO' (moon)، و'th' (three) غير 'TH' (this). */
  /* عرض الصوت: الرمز كما يُكتب فعلاً (حروف صغيرة) + وسم يميّز الأزواج المتشابهة كتابةً.
     لا نعتمد على حالة الحروف (oo/OO أو th/TH) للتمييز — الطفل يرى «oo · طويل» مقابل «oo · قصير»
     ويرى دائماً كلمة المثال بصورتها. */
  const TAGS = {
    'OO': { tag: 'طويل', ipa: '/uː/' }, 'oo': { tag: 'قصير', ipa: '/ʊ/' },
    'TH': { tag: 'مجهور', ipa: '/ð/' }, 'th': { tag: 'مهموس', ipa: '/θ/' }
  };
  SOUNDS.forEach(function (x) {
    x.disp = x.s === 'c k' ? 'c k' : x.s.toLowerCase();
    const t = TAGS[x.s];
    if (t) { x.tag = t.tag; x.ipa = t.ipa; }
    // هل كلمة المثال تبدأ بالصوت؟ (moon/book/box/ring… الصوت في النص مش في الأول)
    const parts = x.disp.split(' ');
    x.initial = parts.some(function (p) { return x.w.indexOf(p) === 0; });
  });

  (function sortSounds() {
    SOUNDS.forEach(function (s, i) { s.oid = i; });
    const rank = {};
    PHONICS_ORDER.forEach(function (k, i) { rank[k] = i; });
    SOUNDS.sort(function (x, y) {
      const ax = rank[x.s] == null ? 900 + x.oid : rank[x.s];
      const ay = rank[y.s] == null ? 900 + y.oid : rank[y.s];
      return ax - ay;
    });
  })();

  // ---------------- القرآن: ترتيب التحفيظ بالسهولة (داخل جزء عمّ) ----------------
  // 1=الفاتحة | 2..6 = محطات جزء عمّ | 7 = جزء تبارك
  const STATIONS = [
    { id: 0, title: 'المحطة ٠ · الفاتحة', surahs: [1] },
    { id: 1, title: 'المحطة ١ · أول نجاح', surahs: [112, 113, 114, 108, 110, 103] },
    { id: 2, title: 'المحطة ٢ · قصار السور', surahs: [102, 105, 106, 107, 109, 111] },
    { id: 3, title: 'المحطة ٣ · نكبر شوية', surahs: [104, 101, 100, 99, 98, 97] },
    { id: 4, title: 'المحطة ٤ · سور جميلة', surahs: [96, 95, 94, 93, 92, 91] },
    { id: 5, title: 'المحطة ٥ · نكمل جزء عمّ', surahs: [90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78] },
    { id: 6, title: 'المحطة ٦ · جزء تبارك', surahs: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77] }
  ];

  window.CURRICULUM = {
    letters: LETTERS,
    sounds: SOUNDS,
    cvc: CVC,
    stations: STATIONS,
    letterById(id) { return LETTERS.find(l => l.id === id); },
    soundIndex(s) { return SOUNDS.findIndex(x => x.s === s); }
  };
})();
