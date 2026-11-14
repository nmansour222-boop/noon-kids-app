window.HUMAN_AUDIO = {"ا":"audio/ar/alef.wav","ألف":"audio/ar/alef.wav","أَلِف":"audio/ar/alef.wav","أ":"audio/ar/alef.wav","باء":"audio/ar/ba.wav","بَاء":"audio/ar/ba.wav","ب":"audio/ar/ba.wav","تَاء":"audio/ar/ta.wav","ت":"audio/ar/ta.wav","تاء":"audio/ar/ta.wav","ثاء":"audio/ar/tha.wav","ثَاء":"audio/ar/tha.wav","ث":"audio/ar/tha.wav","جِيم":"audio/ar/jeem.wav","جيم":"audio/ar/jeem.wav","ج":"audio/ar/jeem.wav","حاء":"audio/ar/ha.wav","حَاء":"audio/ar/ha.wav","ح":"audio/ar/ha.wav","خَاء":"audio/ar/kha.wav","خاء":"audio/ar/kha.wav","خ":"audio/ar/kha.wav","د":"audio/ar/dal.wav","دال":"audio/ar/dal.wav","دَال":"audio/ar/dal.wav","ذال":"audio/ar/thal.wav","ذ":"audio/ar/thal.wav","ذَال":"audio/ar/thal.wav","ر":"audio/ar/ra.wav","راء":"audio/ar/ra.wav","رَاء":"audio/ar/ra.wav","زَاي":"audio/ar/zay.wav","ز":"audio/ar/zay.wav","زاي":"audio/ar/zay.wav","س":"audio/ar/seen.wav","سين":"audio/ar/seen.wav","سِين":"audio/ar/seen.wav","ش":"audio/ar/sheen.wav","شِين":"audio/ar/sheen.wav","شين":"audio/ar/sheen.wav","صَاد":"audio/ar/sad.wav","ص":"audio/ar/sad.wav","صاد":"audio/ar/sad.wav","ضاد":"audio/ar/dad.wav","ض":"audio/ar/dad.wav","ضَاد":"audio/ar/dad.wav","طاء":"audio/ar/taa.wav","ط":"audio/ar/taa.wav","طَاء":"audio/ar/taa.wav","ظ":"audio/ar/zaa.wav","ظَاء":"audio/ar/zaa.wav","ظاء":"audio/ar/zaa.wav","عَيْن":"audio/ar/ain.wav","عين":"audio/ar/ain.wav","ع":"audio/ar/ain.wav","غَيْن":"audio/ar/ghain.wav","غين":"audio/ar/ghain.wav","غ":"audio/ar/ghain.wav","ف":"audio/ar/fa.wav","فَاء":"audio/ar/fa.wav","فاء":"audio/ar/fa.wav","قَاف":"audio/ar/qaf.wav","قاف":"audio/ar/qaf.wav","ق":"audio/ar/qaf.wav","كَاف":"audio/ar/kaf.wav","كاف":"audio/ar/kaf.wav","ك":"audio/ar/kaf.wav","لام":"audio/ar/lam.wav","لَام":"audio/ar/lam.wav","ل":"audio/ar/lam.wav","م":"audio/ar/meem.wav","ميم":"audio/ar/meem.wav","مِيم":"audio/ar/meem.wav","ن":"audio/ar/noon.wav","نُون":"audio/ar/noon.wav","نون":"audio/ar/noon.wav","هَاء":"audio/ar/haa.wav","هاء":"audio/ar/haa.wav","ه":"audio/ar/haa.wav","و":"audio/ar/waw.wav","واو":"audio/ar/waw.wav","وَاو":"audio/ar/waw.wav","ياء":"audio/ar/ya.wav","يَاء":"audio/ar/ya.wav","ي":"audio/ar/ya.wav","أسد":"audio/words/أسد.wav","بطة":"audio/words/بطة.wav","ثعلب":"audio/words/ثعلب.wav","جمل":"audio/words/جمل.wav","حصان":"audio/words/حصان.wav","خبز":"audio/words/خبز.wav","ذئب":"audio/words/ذئب.wav","ريشة":"audio/words/ريشة.wav","زرافة":"audio/words/زرافة.wav","سمكة":"audio/words/سمكة.wav","شمس":"audio/words/شمس.wav","صقر":"audio/words/صقر.wav","ضفدع":"audio/words/ضفدع.wav","ظرف":"audio/words/ظرف.wav","غراب":"audio/words/غراب.wav","فيل":"audio/words/فيل.wav","قطة":"audio/words/قطة.wav","كتاب":"audio/words/كتاب.wav","ليمون":"audio/words/ليمون.wav","موز":"audio/words/موز.wav","نجمة":"audio/words/نجمة.wav","هاتف":"audio/words/هاتف.wav","وردة":"audio/words/وردة.wav","ant":"audio/en/ant.wav","bat":"audio/en/bat.wav","blue":"audio/en/blue.wav","book":"audio/en/book.wav","box":"audio/en/box.wav","car":"audio/en/car.wav","cat":"audio/en/cat.wav","chair":"audio/en/chair.wav","cloud":"audio/en/cloud.wav","dog":"audio/en/dog.wav","egg":"audio/en/egg.wav","fish":"audio/en/fish.wav","go":"audio/en/go.wav","goat":"audio/en/goat.wav","hat":"audio/en/hat.wav","her":"audio/en/her.wav","insect":"audio/en/insect.wav","jam":"audio/en/jam.wav","leg":"audio/en/leg.wav","map":"audio/en/map.wav","moon":"audio/en/moon.wav","net":"audio/en/net.wav","oil":"audio/en/oil.wav","pig":"audio/en/pig.wav","queen":"audio/en/queen.wav","rain":"audio/en/rain.wav","rat":"audio/en/rat.wav","ring":"audio/en/ring.wav","see":"audio/en/see.wav","ship":"audio/en/ship.wav","sun":"audio/en/sun.wav","tap":"audio/en/tap.wav","this":"audio/en/this.wav","three":"audio/en/three.wav","tie":"audio/en/tie.wav","tree":"audio/en/tree.wav","up":"audio/en/up.wav","van":"audio/en/van.wav","web":"audio/en/web.wav","yes":"audio/en/yes.wav","zebra":"audio/en/zebra.wav"};
(function(){
  'use strict';
  const map = window.HUMAN_AUDIO || {};
  let cur=null;
  function norm(t){
    return String(t||'').replace(/[«».,!?\u061F\u060C]/g,'').replace(/\s+/g,' ').trim();
  }
  function find(t){
    const n=norm(t);
    if (map[n]) return map[n];
    const bare=n.replace(/[\u064B-\u0652\u0640]/g,'');
    if (map[bare]) return map[bare];
    const first=bare.split(' ')[0];
    if (map[first]) return map[first];
    return null;
  }
  function play(t){
    const p=find(t);
    if(!p) return Promise.resolve(false);
    return new Promise(function(res){
      try{
        if(cur){ cur.pause(); cur=null; }
        const a=new Audio(p); cur=a;
        a.onended=function(){ if(cur===a) cur=null; res(true); };
        a.onerror=function(){ if(cur===a) cur=null; res(false); };
        const pr=a.play(); if(pr&&pr.catch) pr.catch(function(){ res(false); });
        setTimeout(function(){ if(cur===a){ cur=null; res(true); } }, 20000);
      }catch(e){ res(false); }
    });
  }
  window.Human={ has:function(t){ return !!find(t); }, play:play, find:find, stop:function(){ if(cur){cur.pause();cur=null;} } };
})();
