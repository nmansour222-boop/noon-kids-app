window.HUMAN_AUDIO = {};
(function(){
  'use strict';
  const map = window.HUMAN_AUDIO || {};
  let cur=null;
  function norm(t){ return String(t||'').replace(/[«».,!?]/g,' ').replace(/\s+/g,' ').trim(); }
  function find(t){
    const n=norm(t);
    if (map[n]) return map[n];
    const bare=n.replace(/[\u064B-\u0652\u0640]/g,'');
    if (map[bare]) return map[bare];
    if (map[bare.toLowerCase()]) return map[bare.toLowerCase()];
    const first=bare.split(' ')[0];
    if (map[first]) return map[first];
    return null;
  }
  function play(t){
    const p=find(t);
    if(!p) return Promise.resolve(false);
    return new Promise(function(res){
      try{
        if(cur){ try{cur.pause();}catch(e){} cur=null; }
        const a=new Audio(p); cur=a;
        a.onended=function(){ if(cur===a) cur=null; res(true); };
        a.onerror=function(){ if(cur===a) cur=null; res(false); };
        const pr=a.play(); if(pr&&pr.catch) pr.catch(function(){ res(false); });
      }catch(e){ res(false); }
    });
  }
  window.Human={ has:function(t){ return !!find(t); }, play:play, find:find, stop:function(){ if(cur){try{cur.pause();}catch(e){} cur=null;} } };
})();
