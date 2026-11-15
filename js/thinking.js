/* ============ بنك التفكير: فهم · تصنيف · سبب ونتيجة · استنتاج · تتابع ============
   مبني على تسلسل بلوم للطفولة المبكرة: تذكّر → فهم → تطبيق → تحليل → تقويم → إبداع
   كل سؤال: نص منطوق + خيارات بصور وأسماء + تلميح عند التعثر + لا لوم.
*/
(function () {
  'use strict';

  /* ---------- ١) التصنيف: مين مش زي الباقي؟ ---------- */
  const ODD = [
    { q: 'أنهي واحد مش من الحيوانات؟', opts: [['🐱','قطة'],['🐶','كلب'],['🍎','تفاحة']], ok: 2, hint: 'التفاحة أكل مش حيوان' },
    { q: 'أنهي واحد مش من الأكل؟', opts: [['🍞','عيش'],['🚗','عربية'],['🧀','جبنة']], ok: 1, hint: 'العربية بنركبها مش بنوكلها' },
    { q: 'أنهي واحد مش بنلبسه؟', opts: [['👑','تاج'],['🎩','قبعة'],['🐟','سمكة']], ok: 2, hint: 'السمكة حيوان، مش حاجة بنلبسها' },
    { q: 'أنهي واحد مش طاير؟', opts: [['🐦','عصفورة'],['🦋','فراشة'],['🐢','سلحفاة']], ok: 2, hint: 'السلحفاة بتمشي على الأرض' },
    { q: 'أنهي واحد مش من البحر؟', opts: [['🐟','سمكة'],['🐙','أخطبوط'],['🦁','أسد']], ok: 2, hint: 'الأسد بيعيش على الأرض، مش في المية' },
    { q: 'أنهي واحد مش فاكهة؟', opts: [['🍌','موز'],['🥕','جزرة'],['🍇','عنب']], ok: 1, hint: 'الجزرة خضار' },
    { q: 'أنهي واحد مش لعبة؟', opts: [['⚽','كورة'],['🧸','دبدوب'],['🥄','معلقة']], ok: 2, hint: 'المعلقة بناكل بيها، مش بنلعب بيها' },
    { q: 'أنهي واحد مش بيمشي على عجل؟', opts: [['🚗','عربية'],['🚲','عجلة'],['⛵','مركب']], ok: 2, hint: 'المركب بتمشي على المية، مالهاش عجل' },
    { q: 'أنهي واحد مش من حاجات البيت؟', opts: [['🦒','زرافة'],['🛏️','سرير'],['🪑','كرسي']], ok: 0, hint: 'الزرافة حيوان، والسرير والكرسي من حاجات البيت' },
    { q: 'أنهي واحد مش من ملابس الشتا؟', opts: [['🧥','جاكت'],['🧣','سكارف'],['🩳','شورت']], ok: 2, hint: 'الشورت بنلبسه في الصيف' },
    { q: 'أنهي واحد مش بيكبر؟', opts: [['🌱','زرعة'],['🧱','طوبة'],['🐣','كتكوت']], ok: 1, hint: 'الطوبة فضلت زي ما هي' }
  ];

  /* ---------- ٢) الوظيفة: بنستخدمه في إيه؟ ---------- */
  const FUNC = [
    { q: 'اللي بنشرب بيه إيه؟', opts: [['🥤','كوباية'],['✏️','قلم'],['🧦','شراب']], ok: 0, hint: 'بنحط فيه الماية' },
    { q: 'اللي بنقص بيه الورق إيه؟', opts: [['🔑','مفتاح'],['✂️','مقص'],['🍌','موز']], ok: 1, hint: 'بيفتح وبيقفل' },
    { q: 'اللي بنفتح بيه الباب إيه؟', opts: [['🔑','مفتاح'],['🍎','تفاحة'],['🧸','دبدوب']], ok: 0, hint: 'بنحطه في الكالون' },
    { q: 'اللي بنكتب بيه إيه؟', opts: [['✏️','قلم'],['🥄','معلقة'],['🌂','شمسية']], ok: 0, hint: 'بيمسك بإيدك ويعمل خط' },
    { q: 'اللي بيحمينا من المطر إيه؟', opts: [['🌂','شمسية'],['🪑','كرسي'],['🧊','تلج']], ok: 0, hint: 'بنفتحها فوق دماغنا' },
    { q: 'اللي بنشوف بيه إيه؟', opts: [['👁️','عين'],['✋','إيد'],['👂','ودن']], ok: 0, hint: 'في وشنا' },
    { q: 'اللي بنسمع بيه إيه؟', opts: [['👂','ودن'],['👃','مناخير'],['🦶','رجل']], ok: 0, hint: 'على جنب دماغنا' },
    { q: 'بناكل الشوربة السخنة بإيه؟', opts: [['✋','إيدنا'],['🥄','معلقة'],['📖','كتاب']], ok: 1, hint: 'المعلقة بتشيل الشوربة من غير ما إيدنا تتحرق' }
  ];

  /* ---------- ٣) سبب ونتيجة (استنتاج) ---------- */
  const WHY = [
    { q: 'الشمس طلعت… إيه يحصل؟', opts: [['☀️','الدنيا بتنوّر'],['🌙','الدنيا بتبقى ليل'],['❄️','بيتلّج']], ok: 0, hint: 'الشمس بتدّي نور' },
    { q: 'كان عطشان وشرب مية… بقى إيه؟', opts: [['😊','مش عطشان'],['🥵','عطشان أكتر'],['🍔','جعان']], ok: 0, hint: 'المية بتشيل العطش' },
    { q: 'نزل مطر… الأرض بقت إيه؟', opts: [['🌵','ناشفة'],['💦','مبلولة'],['🔥','حرّانة']], ok: 1, hint: 'المية بتبلّل' },
    { q: 'سيبنا الموزة برّه كتير… بقت إيه؟', opts: [['🍌','باظت'],['⭐','بقت نجمة'],['❄️','بقت تلج']], ok: 0, hint: 'الأكل بتبوظ لو قعد كتير' },
    { q: 'شربنا مية ساقعة وإحنا حرّانين… إحساسنا إيه؟', opts: [['😊','ارتحنا'],['😢','عيّطنا'],['😡','زعلنا']], ok: 0, hint: 'المية الساقعة بترطّب' },
    { q: 'حطينا التلج في الشمس… بقى إيه؟', opts: [['💧','داب وبقى مية'],['🔥','ولّع نار'],['🌳','بقى شجرة']], ok: 0, hint: 'حرارة الشمس بتدوّب التلج' },
    { q: 'نور الأوضة اتطفي… إيه يحصل؟', opts: [['🌑','بقيت ضلمة'],['🌈','بقيت ملوّنة'],['🔊','بقيت صوت']], ok: 0, hint: 'النور لما يطفي بنشوف بصعوبة' },
    { q: 'وضعنا الماية في التلاجة… بقت إيه؟', opts: [['🧊','ساقعة'],['🔥','سخنة'],['🍞','عيش']], ok: 0, hint: 'التلاجة بتبرّد' },
    { q: 'لعبنا في الشمس كتير في الصيف… حسّينا بإيه؟', opts: [['🥵','حرّ'],['🥶','برد'],['❄️','تلج']], ok: 0, hint: 'شمس الصيف سخنة' }
  ];

  /* ---------- ٤) التتابع (أول / بعدين / آخر) ---------- */
  const SEQ = [
    { q: 'عشان تطلع شجرة… بنعمل إيه الأول؟', opts: [['🌱','نزرع البذرة'],['🌳','الشجرة تكبر'],['🍎','ناكل الفاكهة']], ok: 0, hint: 'الأول بنزرع البذرة، وبعدين تكبر' },
    { q: 'قبل الأكل بنعمل إيه؟', opts: [['🧼','نغسل إيدينا'],['😴','ننام'],['🛁','نستحمى في البانيو']], ok: 0, hint: 'بنغسل إيدينا قبل الأكل عشان تبقى نضيفة' },
    { q: 'قبل ما ننام بالليل بنعمل إيه؟', opts: [['🪥','نغسل سناننا'],['🌅','نصحى'],['🏫','نروح المدرسة']], ok: 0, hint: 'بنغسل سناننا قبل النوم' },
    { q: 'البيضة… بعدين بتبقى إيه؟', opts: [['🐣','كتكوت'],['🥚','بيضة تانية'],['🍳','بيضة مقلية']], ok: 0, hint: 'الكتكوت بيطلع من البيضة' },
    { q: 'إحنا في الشتا… نلبس إيه؟', opts: [['🧥','جاكت'],['🩳','شورت'],['🩱','مايوه']], ok: 0, hint: 'الشتا برد' }
  ];

  /* ---------- ٥) العكس (مقارنة) ---------- */
  const OPP = [
    { q: 'عكس «كبير» إيه؟', opts: [['🐘','فيل'],['🐜','نملة'],['🏠','بيت']], ok: 1, hint: 'حاجة صغيرة خالص' },
    { q: 'عكس «فوق» إيه؟', opts: [['⬆️','فوق'],['⬇️','تحت'],['➡️','جنب']], ok: 1, hint: 'عكس فوق: تحت' },
    { q: 'عكس «سعيد» إيه؟', opts: [['😊','مبسوط'],['😢','زعلان'],['😴','نعسان']], ok: 1, hint: 'وشه بيبقى حزين' },
    { q: 'عكس «ساخن» إيه؟', opts: [['🔥','سخن'],['🧊','بارد'],['☀️','شمس']], ok: 1, hint: 'زي التلج' }
  ];

  const BANKS = { odd: ODD, func: FUNC, why: WHY, seq: SEQ, opp: OPP };

  /* ---------- بنك إنجليزي كامل لمسار الإنجليزية: نفس المهارات، أسئلة وإجابات وتفسير بالإنجليزي ---------- */
  const EN_BANKS = {
    odd: [
      { q: 'Which one is not an animal?', opts: [['🐱','cat'],['🐶','dog'],['🍎','apple']], ok: 2, hint: 'An apple is food, not an animal.' },
      { q: 'Which one is not food?', opts: [['🍞','bread'],['🚗','car'],['🧀','cheese']], ok: 1, hint: 'We ride in a car. We do not eat it.' },
      { q: 'Which one cannot fly?', opts: [['🐦','bird'],['🦋','butterfly'],['🐢','turtle']], ok: 2, hint: 'A turtle walks. It cannot fly.' },
      { q: 'Which one does not live in the sea?', opts: [['🐟','fish'],['🐙','octopus'],['🦁','lion']], ok: 2, hint: 'A lion lives on land.' },
      { q: 'Which one is not a fruit?', opts: [['🍌','banana'],['🥕','carrot'],['🍇','grapes']], ok: 1, hint: 'A carrot is a vegetable.' },
      { q: 'Which one is not a toy?', opts: [['⚽','ball'],['🧸','teddy'],['🥄','spoon']], ok: 2, hint: 'We eat with a spoon.' }
    ],
    func: [
      { q: 'What do we drink from?', opts: [['🥤','cup'],['✏️','pencil'],['🧦','sock']], ok: 0, hint: 'We put water in a cup.' },
      { q: 'What do we cut paper with?', opts: [['🔑','key'],['✂️','scissors'],['🍌','banana']], ok: 1, hint: 'Scissors open and close to cut.' },
      { q: 'What opens a door?', opts: [['🔑','key'],['🍎','apple'],['🧸','teddy']], ok: 0, hint: 'A key opens the lock.' },
      { q: 'What do we write with?', opts: [['✏️','pencil'],['🥄','spoon'],['🌂','umbrella']], ok: 0, hint: 'A pencil makes lines on paper.' },
      { q: 'What keeps us dry in the rain?', opts: [['🌂','umbrella'],['🪑','chair'],['🧊','ice']], ok: 0, hint: 'We open an umbrella over our head.' },
      { q: 'What do we see with?', opts: [['👁️','eyes'],['✋','hand'],['👂','ear']], ok: 0, hint: 'Our eyes help us see.' }
    ],
    why: [
      { q: 'The sun comes up. What happens?', opts: [['☀️','it is light'],['🌙','it is night'],['❄️','it snows']], ok: 0, hint: 'The sun gives us light.' },
      { q: 'It rains. The ground gets…?', opts: [['🌵','dry'],['💦','wet'],['🔥','hot']], ok: 1, hint: 'Rain is water. Water makes things wet.' },
      { q: 'We put ice in the sun. What happens?', opts: [['💧','it melts'],['🌳','it grows'],['⭐','it shines']], ok: 0, hint: 'The sun is hot. Heat melts ice.' },
      { q: 'We put water in the freezer. It becomes…?', opts: [['🧊','ice'],['🔥','fire'],['🍞','bread']], ok: 0, hint: 'The freezer is very cold.' },
      { q: 'The light goes off. The room is…?', opts: [['🌑','dark'],['🌈','colorful'],['☀️','sunny']], ok: 0, hint: 'No light means dark.' },
      { q: 'You are thirsty and drink water. Now you are…?', opts: [['😊','not thirsty'],['🥵','more thirsty'],['😴','asleep']], ok: 0, hint: 'Water stops thirst.' }
    ],
    seq: [
      { q: 'To grow a tree, what comes first?', opts: [['🌱','plant a seed'],['🌳','a big tree'],['🍎','eat the fruit']], ok: 0, hint: 'First the seed, then the tree.' },
      { q: 'Before we eat, we…?', opts: [['🧼','wash hands'],['😴','sleep'],['🏫','go to school']], ok: 0, hint: 'Clean hands before food.' },
      { q: 'Before bed, we…?', opts: [['🪥','brush teeth'],['🌅','wake up'],['🏫','go to school']], ok: 0, hint: 'We brush our teeth before bed.' },
      { q: 'What comes out of an egg?', opts: [['🐣','a chick'],['🥚','an egg'],['🍳','a pan']], ok: 0, hint: 'A baby chick comes out of the egg.' },
      { q: 'It is cold. We put on a…?', opts: [['🧥','coat'],['🩳','shorts'],['🩱','swimsuit']], ok: 0, hint: 'A coat keeps us warm.' }
    ],
    opp: [
      { q: 'What is the opposite of big?', opts: [['🐘','elephant'],['🐜','ant'],['🏠','house']], ok: 1, hint: 'An ant is very small.' },
      { q: 'What is the opposite of up?', opts: [['⬆️','up'],['⬇️','down'],['➡️','right']], ok: 1, hint: 'Up and down.' },
      { q: 'What is the opposite of happy?', opts: [['😊','happy'],['😢','sad'],['😴','sleepy']], ok: 1, hint: 'Happy and sad.' },
      { q: 'What is the opposite of hot?', opts: [['🔥','hot'],['🧊','cold'],['☀️','sun']], ok: 1, hint: 'Ice is cold.' },
      { q: 'What is the opposite of day?', opts: [['🌙','night'],['☀️','sun'],['🌈','rainbow']], ok: 0, hint: 'Day and night.' }
    ]
  };

  /* ترتيب الصعوبة: تصنيف → وظيفة → عكس → تتابع → سبب ونتيجة */
  const TIERS = [
    ['odd', 'func', 'opp'],
    ['odd', 'opp', 'seq'],
    ['func', 'seq', 'why'],
    ['opp', 'why', 'odd'],
    ['seq', 'why', 'func'],
    ['why', 'odd', 'seq'],
    ['func', 'opp', 'why']
  ];

  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }

  /** يعيد سؤالاً من مستوى معيّن، بلا تكرار داخل نفس الجلسة */
  const used = {};
  function pick(type, seed, lang) {
    const en = lang === 'en';
    const bank = (en ? EN_BANKS : BANKS)[type];
    if (!bank || !bank.length) return null;
    const start = Math.abs(seed || 0) % bank.length;
    for (let k = 0; k < bank.length; k++) {
      const idx = (start + k) % bank.length;
      const key = (en ? 'en.' : '') + type + ':' + idx;
      if (!used[key]) {
        used[key] = 1;
        return build(bank[idx], type, key, lang);
      }
    }
    return build(bank[start], type, (en ? 'en.' : '') + type + ':' + start, lang);
  }
  function build(q, type, key, lang) {
    const order = shuffle(q.opts.map(function (o, i) { return { o: o, i: i }; }));
    return { type: type, q: q.q, opts: order.map(function (x) { return x.o; }),
      ok: order.findIndex(function (x) { return x.i === q.ok; }), hint: q.hint, key: key, lang: lang === 'en' ? 'en' : 'ar' };
  }

  /** مجموعة أسئلة لوحدة تفكير: ٣ أسئلة متدرجة — بلغة المسار */
  function setFor(unitOrder, lang) {
    const tier = TIERS[Math.abs(unitOrder) % TIERS.length];
    const out = [];
    tier.forEach(function (t, i) { const q = pick(t, unitOrder * 3 + i * 7, lang); if (q) out.push(q); });
    return out;
  }

  /* مجموعة ثابتة لكل وحدة (لا تتغير أثناء التقدّم أو عند الإعادة) */
  const setCache = {};
  function setForCached(unitId, order, lang) {
    if (!setCache[unitId]) setCache[unitId] = setFor(order, lang);
    return setCache[unitId];
  }

  window.Thinking = {
    BANKS: BANKS,
    EN_BANKS: EN_BANKS,
    pick: pick,
    setFor: setFor,
    setForCached: setForCached,
    resetUsed: function () { Object.keys(used).forEach(function (k) { delete used[k]; }); },
    total: ODD.length + FUNC.length + WHY.length + SEQ.length + OPP.length,
    totalEn: Object.keys(EN_BANKS).reduce(function (a, k) { return a + EN_BANKS[k].length; }, 0)
  };
})();
