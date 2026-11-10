// ===== save quota: keep one current save, drop old copies, compact and compress if the browser is full =====
// What was filling the device: every save also stored a full duplicate under
// realmTenWindsSave4_bak, New Game stored another under _prevlife, and older
// realm/blade save keys were never removed once a current save existed.
// A long game also grows (villager relationships, the history log, the journal).
// Two or three full copies cross the roughly 5MB localStorage cap, and some
// browsers refuse to replace a large value even when the new text fits.
function unwrapSave(raw){if(typeof raw==="string"&&raw.slice(0,4)==="LZ1:")return lzExpand(raw.slice(4));return raw;}
function lzPack(s){const n=s.length;if(n<80)return s;const H=65536,slot=new Int32Array(H);slot.fill(-1);const prev=new Int32Array(n);prev.fill(-1);const out=[];
  let i=0;while(i<n){let bestL=0,bestD=0;
    if(i+3<n){const h=((s.charCodeAt(i)&255)^((s.charCodeAt(i+1)&255)<<8))&(H-1);let j=slot[h],hops=0;
      while(j>=0&&i-j<32767&&hops<28){let L=0,lim=n-i;if(lim>258)lim=258;while(L<lim&&s.charCodeAt(j+L)===s.charCodeAt(i+L))L++;if(L>bestL){bestL=L;bestD=i-j;}j=prev[j];hops++;}
      prev[i]=slot[h];slot[h]=i;}
    if(bestL>=4){out.push(0xE000+(bestL-4));out.push(bestD);for(let k=1;k<bestL&&i+k+2<n;k+=3){const h=((s.charCodeAt(i+k)&255)^((s.charCodeAt(i+k+1)&255)<<8))&(H-1);prev[i+k]=slot[h];slot[h]=i+k;}i+=bestL;}
    else{let c=s.charCodeAt(i);if(c>=0xE000)c=0x20;out.push(c);i++;}}
  let str="";for(let p=0;p<out.length;p+=8192)str+=String.fromCharCode.apply(null,out.slice(p,p+8192));return str;}
function lzExpand(s){const out=[];for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);
  if(c>=0xE000){const L=(c-0xE000)+4,d=s.charCodeAt(++i),start=out.length-d;for(let k=0;k<L;k++)out.push(out[start+k]);}
  else out.push(c);}let str="";for(let p=0;p<out.length;p+=8192)str+=String.fromCharCode.apply(null,out.slice(p,p+8192));return str;}
function saveLooks(raw){try{const d=JSON.parse(unwrapSave(raw));if(!d||typeof d!=="object"||!d.world||!d.P)return null;const ts=+(d.P.lastSaved||0)||+(d.world.day||0);return {ts:ts,day:+(d.world.day||0)};}catch(e){return null;}}
function isSaveKey(k){if(!k)return false;if(k===SAVEKEY||k===SAVEKEY+"_bak"||k===SAVEKEY+"_prevlife")return true;
  if(/^realmTenWindsSave/i.test(k))return true;if(/save|snapshot|autosave/i.test(k)&&/realm|blade|arena|tenwinds/i.test(k))return true;return false;}
function dropKey(k){try{localStorage.removeItem(k);}catch(e){}}
function storageBytes(){let n=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i),v=localStorage.getItem(k)||"";n+=k.length+v.length;}return n;}
function pruneSaves(){const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
  const rows=[];
  for(const k of keys){if(!k)continue;const raw=localStorage.getItem(k)||"";
    if(!isSaveKey(k)){if(raw.length>50000&&/cache|worldpack|chunk|snapshot/i.test(k))dropKey(k);continue;}
    const info=saveLooks(raw);rows.push({k,len:raw.length,ts:info?info.ts:0,ok:!!info});}
  const valid=rows.filter(r=>r.ok).sort((a,b)=>b.ts-a.ts||b.len-a.len);
  window.__savePrune={before:rows.map(r=>({k:r.k,len:r.len,ok:r.ok,ts:r.ts}))};
  if(!valid.length){for(const r of rows)if(r.k!==SAVEKEY)dropKey(r.k);return;}
  const best=valid[0];
  const held=localStorage.getItem(best.k);if(!saveLooks(held))return;
  if(best.k!==SAVEKEY){try{localStorage.setItem(SAVEKEY,held);if(!saveLooks(localStorage.getItem(SAVEKEY)))return;}catch(e){return;}}
  const cur=localStorage.getItem(SAVEKEY)||"",bak=localStorage.getItem(SAVEKEY+"_bak")||"";
  const curInfo=saveLooks(cur),bakInfo=saveLooks(bak);
  const keepBak=!!(bakInfo&&curInfo&&bakInfo.ts<=curInfo.ts&&cur.length+bak.length<2500000);
  const left=[];for(let i=0;i<localStorage.length;i++)left.push(localStorage.key(i));
  for(const k of left){if(!isSaveKey(k)||k===SAVEKEY)continue;if(keepBak&&k===SAVEKEY+"_bak")continue;dropKey(k);}}
function slimDeltas(json){let d;try{d=JSON.parse(json);}catch(e){return json;}
  const w=d.world;if(w){
    if(Array.isArray(w.caravans))w.caravans=w.caravans.filter(c=>c&&!c.land&&!c.live82).map(c=>({from:c.from,to:c.to,t:c.t||0,hours:c.hours||8,seed:c.seed||0}));
    if(Array.isArray(w.bld)){const sp={};for(let i=0;i<w.bld.length;i++){const b=w.bld[i];if(b&&((b.dmg||0)>0.001||(b.burn||0)>0))sp[i]={dmg:+b.dmg||0,burn:+b.burn||0};}w.bld=sp;}
    delete w._bak75;delete w._sc;}
  if(Array.isArray(d.npcs))for(const n of d.npcs){if(!n)continue;delete n.inside;delete n._pos;delete n._pf;delete n._pt;delete n._mk;delete n._md;delete n._noLos;delete n.px;delete n.py;}
  try{return JSON.stringify(d);}catch(e){return json;}}
function restoreBld(){if(!world||!world.bld||Array.isArray(world.bld))return;const sp=world.bld;let n=buildings.length;for(const k in sp){const i=+k;if(i>=n)n=i+1;}
  const arr=[];for(let i=0;i<n;i++)arr[i]=sp[i]?{dmg:+sp[i].dmg||0,burn:+sp[i].burn||0}:{dmg:0,burn:0};world.bld=arr;}
function compactSave(json){let d;try{d=JSON.parse(json);}catch(e){return json;}
  if(d.P){if(Array.isArray(d.P.journal)&&d.P.journal.length>40)d.P.journal=d.P.journal.slice(-40);
    if(Array.isArray(d.P.news))d.P.news=d.P.news.slice(-10);if(d.P.mem&&Array.isArray(d.P.mem))d.P.mem=d.P.mem.slice(-10);}
  if(d.world){if(Array.isArray(d.world.news)&&d.world.news.length>15)d.world.news=d.world.news.slice(0,15);
    if(Array.isArray(d.world.hist)&&d.world.hist.length>40)d.world.hist=d.world.hist.slice(-40);
    if(Array.isArray(d.world.events)&&d.world.events.length>20)d.world.events=d.world.events.slice(-20);
    delete d.world._bak75;delete d.world._sc;}
  if(Array.isArray(d.npcs))for(const n of d.npcs){if(!n||typeof n!=="object")continue;delete n.px;delete n.py;delete n.px0;delete n.py0;delete n._ox;delete n._oy;delete n.inside;
    if(n.rel&&typeof n.rel==="object"){const top=Object.entries(n.rel).sort((a,b)=>b[1]-a[1]).slice(0,6);const o={};for(const [id,v] of top)o[id]=v;n.rel=o;}}
  try{return JSON.stringify(d);}catch(e){return json;}}
function safeWrite(key,text){try{localStorage.setItem(key,text);return saveLooks(text)?true:text.slice(0,4)==="LZ1:";}catch(e){
  if(!(e&&(e.name==="QuotaExceededError"||e.code===22||e.code===1014||/quota/i.test(e.message||""))))return false;
  const prev=localStorage.getItem(key);try{localStorage.removeItem(key);}catch(_){}
  try{localStorage.setItem(key,text);return true;}catch(e2){if(prev!=null){try{localStorage.setItem(key,prev);}catch(_){}}return false;}}}
function keepKey(k){return k===SAVEKEY||k==="realmIntroSeen"||k==="realmAudio"||k==="bladeArenaBlood";}
function purgeStale(){const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
  for(const k of keys){if(!k||keepKey(k))continue;const raw=localStorage.getItem(k)||"";if(isSaveKey(k)||(raw.length>20000&&/cache|worldpack|chunk|snapshot/i.test(k)))dropKey(k);}}
function purgeJunk(){const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));for(const k of keys)if(k&&!keepKey(k))dropKey(k);}
function idbSaveOpen(){return new Promise((res,rej)=>{const r=indexedDB.open("blade-saves",1);r.onupgradeneeded=()=>{r.result.createObjectStore("saves");};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function idbPutSave(text,gen){return idbSaveOpen().then(db=>new Promise((res,rej)=>{const tx=db.transaction("saves","readwrite");tx.objectStore("saves").put(text,SAVEKEY);tx.oncomplete=()=>{db.close();if(gen===window.__saveGen)window.__idbSave=text;res(true);};tx.onerror=()=>{db.close();rej(tx.error);};}));}
function idbGetSave(){return idbSaveOpen().then(db=>new Promise((res,rej)=>{const q=db.transaction("saves").objectStore("saves").get(SAVEKEY);q.onsuccess=()=>{db.close();res(q.result||"");};q.onerror=()=>{db.close();rej(q.error);};}));}
function maybeSmallBak(prev){if(!prev||prev.slice(0,5)==="IDB1:"||prev.length>180000){dropKey(SAVEKEY+"_bak");return;}try{localStorage.setItem(SAVEKEY+"_bak",prev);}catch(e){dropKey(SAVEKEY+"_bak");}}
function pointerFor(){return "IDB1:"+JSON.stringify({day:world&&world.day||0,gold:P&&P.gold||0,ts:P&&P.lastSaved||0});}
function saveNewest(text){window.__saveGen=(window.__saveGen||0)+1;const gen=window.__saveGen;let idbOk=false;
  const idbP=idbPutSave(text,gen).then(()=>{idbOk=true;return true;}).catch(()=>false);
  const prev=localStorage.getItem(SAVEKEY);purgeStale();
  if(safeWrite(SAVEKEY,text)&&saveLooks(localStorage.getItem(SAVEKEY))){maybeSmallBak(prev);window.__saveErr=null;window.__saveLen=text.length;window.__saveHow="local";return {ok:true,len:text.length,how:"local",idb:idbP};}
  purgeJunk();const slim=compactSave(text);
  if(safeWrite(SAVEKEY,slim)&&saveLooks(localStorage.getItem(SAVEKEY))){idbPutSave(slim,gen).catch(()=>{});maybeSmallBak(null);window.__saveErr=null;window.__saveLen=slim.length;window.__saveHow="compact";return {ok:true,len:slim.length,how:"compact",idb:idbP};}
  const packedBody=lzPack(slim);const packed=lzExpand(packedBody)===slim?"LZ1:"+packedBody:"";
  if(packed&&safeWrite(SAVEKEY,packed)&&saveLooks(localStorage.getItem(SAVEKEY))){idbPutSave(slim,gen).catch(()=>{});window.__saveErr=null;window.__saveLen=packed.length;window.__saveHow="lz";return {ok:true,len:packed.length,how:"lz",idb:idbP};}
  const ptr=pointerFor();
  try{localStorage.setItem(SAVEKEY,ptr);}catch(e){}
  if((localStorage.getItem(SAVEKEY)||"").slice(0,5)==="IDB1:"){window.__idbSave=text;window.__saveErr=null;window.__saveLen=text.length;window.__saveHow="idb";return {ok:true,len:text.length,how:"idb",idb:idbP};}
  if(prev!=null&&localStorage.getItem(SAVEKEY)!==prev){try{localStorage.setItem(SAVEKEY,prev);}catch(e){}}
  window.__saveErr="storage full";try{toast("Save failed. Your last save is still on this device.");}catch(e){}
  return {ok:false,err:"storage full",idb:idbP,idbOk};}
try{pruneSaves();}catch(e){console.warn("prune",e);}
window.__idbSave="";window.__idbReady=idbGetSave().then(t=>{window.__idbSave=t||"";return t;}).catch(()=>"");
{const _sg=saveGame;saveGame=function(){if(typeof AWAY_TICK!=="undefined"&&AWAY_TICK)return _sg.apply(this,arguments);
  if(!hero||!world)return {ok:false,err:"no game"};
  try{if(P&&state==="play")P.lastSaved=Date.now();}catch(e){}
  let raw;  try{raw=slimDeltas(saveBlob());JSON.parse(raw);}catch(e){window.__saveErr=e.message||"save";try{toast("Save failed.");}catch(_){}return {ok:false,err:e.message};}
  return saveNewest(raw);};}
{const _lg=loadGame;loadGame=function(){let raw="";try{raw=localStorage.getItem(SAVEKEY)||"";}catch(e){}
  let restore=null;if(raw.slice(0,5)==="IDB1:"){const full=window.__idbSave||"";if(!full)return false;const orig=Storage.prototype.getItem;restore=orig;
    Storage.prototype.getItem=function(k){if(k===SAVEKEY)return full;return orig.call(this,k);};}
  let r=false;try{r=_lg.apply(this,arguments);}finally{if(restore)Storage.prototype.getItem=restore;}
  try{if(r)restoreBld();}catch(e){}return r;};}
if(typeof saveCode==="function"){const _sc=saveCode;saveCode=function(){const raw=localStorage.getItem(SAVEKEY)||"";if(raw.slice(0,5)==="IDB1:"&&window.__idbSave){try{if(state==="play")saveGame();}catch(e){}return "BR1:"+btoa(unescape(encodeURIComponent(window.__idbSave)));}return _sc();};}
(function armContinue(){const btn=document.getElementById("contBtn");if(!btn||btn._idb)return;btn._idb=1;
  btn.addEventListener("click",function(e){const raw=localStorage.getItem(SAVEKEY)||"";if(raw.slice(0,5)!=="IDB1:"||window.__idbSave)return;
    e.stopImmediatePropagation();e.preventDefault();window.__idbReady.then(()=>{if(loadGame())beginPlay();else try{toast("Save failed.");}catch(_){}});},true);})();
if(typeof autoSave==="function"){autoSave=function(){if(typeof SAVING!=="undefined"&&SAVING||state!=="play"||!hero||hero.dead||document.hidden)return;SAVING=true;
  const run=()=>{try{const r=saveGame();if(r&&r.ok){AUTOSAVES++;LAST_AUTOSAVE=Date.now();if(typeof savedPip==="function")savedPip();}}catch(e){}finally{SAVING=false;}};
  if(window.requestIdleCallback)requestIdleCallback(run,{timeout:2000});else setTimeout(run,0);};}
window.__pruneSaves=pruneSaves;window.__saveBytes=storageBytes;
