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
function saveCompacted(){let s;try{s=saveBlob();}catch(e){return {ok:false,err:e.message};}
  pruneSaves();const slim=compactSave(s);dropKey(SAVEKEY+"_bak");dropKey(SAVEKEY+"_prevlife");
  if(safeWrite(SAVEKEY,slim)&&saveLooks(localStorage.getItem(SAVEKEY))){window.__saveErr=null;window.__saveLen=slim.length;window.__saveHow="compact";return {ok:true,len:slim.length,how:"compact"};}
  const packedBody=lzPack(slim);if(lzExpand(packedBody)!==slim){window.__saveErr="storage full";try{toast("⚠ Save failed: storage is full. Export your save from the title screen.");}catch(_){}return {ok:false,err:"storage full"};}
  const packed="LZ1:"+packedBody;
  if(safeWrite(SAVEKEY,packed)&&saveLooks(localStorage.getItem(SAVEKEY))){window.__saveErr=null;window.__saveLen=packed.length;window.__saveHow="lz";return {ok:true,len:packed.length,how:"lz"};}
  window.__saveErr="storage full";try{toast("⚠ Save failed: storage is full. Export your save from the title screen.");}catch(_){}
  return {ok:false,err:"storage full"};}
try{pruneSaves();}catch(e){console.warn("prune",e);}
{const _sg=saveGame;saveGame=function(){if(typeof AWAY_TICK!=="undefined"&&AWAY_TICK)return _sg.apply(this,arguments);
  try{pruneSaves();}catch(e){}
  let res;try{res=_sg.apply(this,arguments);}catch(e){res={ok:false,err:e&&e.message||"save"};}
  if(res&&res.ok)return res;
  const err=(res&&res.err)||window.__saveErr||"";
  if(err&&err!=="storage full"&&!/quota/i.test(err)&&err!=="no game")return res;
  return saveCompacted();};}
window.__pruneSaves=pruneSaves;window.__saveBytes=storageBytes;
