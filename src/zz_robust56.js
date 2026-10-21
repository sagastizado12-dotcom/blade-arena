// ===== v56 robustness: crash-proof frame loop, fade/warp guards, compact quota-safe saves that never lose the existing save =====
window.__frameErrs=[];let FRAME_ERR=0,ROOM_ERR=0;
function noteErr(where,e){FRAME_ERR++;const m=where+": "+(e&&e.message||e);if(window.__frameErrs.length<50)window.__frameErrs.push(m);if(FRAME_ERR<=5)console.error("[frame]",m,e&&e.stack);}
loop=function(now){try{audioUpdate();}catch(e){noteErr("audio",e);}
  const fd=Math.min(100,now-last);acc+=fd;last=now;try{framePace(fd);}catch(e){}let n=0;
  while(acc>=STEP&&n<5){try{snapPrev();update();}catch(e){noteErr("update",e);}acc-=STEP;n++;}if(n>=5)acc=0;
  let ok=true;try{interpOn(acc/STEP);if(window.__throwDraw>0){window.__throwDraw--;throw new Error("test draw fault");}draw();}catch(e){ok=false;noteErr("draw",e);try{ctx.restore();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";}catch(_){}}finally{try{interpOff();}catch(_){}}
  if(!ok&&room){ROOM_ERR++;if(ROOM_ERR>20){ROOM_ERR=0;try{const o=room.out;room=null;if(o){hero.x=o.x;hero.y=o.y;}toast("⚠ Something went wrong inside — you stepped back outside.");}catch(_){room=null;}}}else if(ok)ROOM_ERR=0;
  requestAnimationFrame(loop);};
// fade: a throwing callback must never leave the screen black/paused
{const _fq=fadeQuick;fadeQuick=function(cb){return _fq.call(this,()=>{try{cb&&cb();}catch(e){noteErr("fade",e);}});};}
// toast: drop an identical toast repeated within 1.5s
{const _t=toast;let lt="",lw=0;toast=function(t){const now=Date.now();if(t===lt&&now-lw<1500)return;lt=t;lw=now;return _t.apply(this,arguments);};}
// warp to the manor: don't auto-walk straight into the door on arrival (double fade)
{const _w=warpTo;warpTo=function(px,py,label,after){const r=_w.apply(this,arguments);if(r&&/manor/.test(label||""))manorCd=150;return r;};}
// ---- saves ----
const SAVE_DROP=new Set(["_sc","_pt","_ox","_oy","inside"]);
function saveBlob(){const alive=new Set(npcs.map(n=>n.id));
  const data={v:1,world,P,nextNpc,hero:{x:room&&room.out?room.out.x:hero.x,y:room&&room.out?room.out.y:hero.y,hp:hero.hp,maxHp:hero.maxHp},waystones:waystones.map(w=>w.found),npcs,T:Array.from(harvestedList())};
  const rep=function(k,v){if(typeof v==="number"&&!isFinite(v))return 0;if(this&&this.id!=null&&this.name!=null&&this.s!=null){if(SAVE_DROP.has(k))return undefined;
     if(k==="rel"&&v&&typeof v==="object"){const o={};for(const i in v)if(alive.has(+i))o[i]=v[i];return o;}if((k==="x"||k==="y")&&typeof v==="number")return Math.round(v*10)/10;}return v;};
  try{return JSON.stringify(data,rep);}catch(e){if(!/cycl|circular/i.test(e.message))throw e;const seen=new WeakSet();return JSON.stringify(data,function(k,v){v=rep.call(this,k,v);if(v&&typeof v==="object"){if(seen.has(v))return undefined;seen.add(v);}return v;});}}
const isQuota=e=>e&&(e.name==="QuotaExceededError"||e.code===22||e.code===1014||/quota/i.test(e.message||""));
function freeSpace(level){const ks=Object.keys(localStorage);for(const k of ks){if(k===SAVEKEY)continue;
  if(level>=1&&(k===SAVEKEY+"_prevlife"||(/^realm.*Save/i.test(k)&&!k.startsWith(SAVEKEY))))localStorage.removeItem(k);if(level>=2&&k===SAVEKEY+"_bak")localStorage.removeItem(k);}}
let SAVE_WARNED=0;
saveGame=function(){if(!hero||!world)return{ok:false,err:"no game"};let s;try{if(P&&state==="play")P.lastSaved=Date.now();}catch(_){}
  try{s=saveBlob();JSON.parse(s);}catch(e){window.__saveErr=e.message;console.error("save serialize",e);saveWarn("couldn't prepare the save ("+e.message+")");return{ok:false,err:e.message};}
  let cur=null;try{cur=localStorage.getItem(SAVEKEY);}catch(_){}
  for(let lv=0;lv<=2;lv++){try{if(lv)freeSpace(lv);localStorage.setItem(SAVEKEY,s);window.__saveErr=null;window.__saveLen=s.length;
      if(cur&&!saveGame._newLife&&cur!==s){try{localStorage.setItem(SAVEKEY+"_bak",cur);}catch(e){try{localStorage.removeItem(SAVEKEY+"_bak");}catch(_){}}}
      return{ok:true,len:s.length,freed:lv};}
    catch(e){if(!isQuota(e)){window.__saveErr=e.message;saveWarn(e.message);return{ok:false,err:e.message};}}}
  // still full: the previous save is untouched (setItem failed atomically); make sure it's still there
  try{if(cur&&localStorage.getItem(SAVEKEY)!==cur)localStorage.setItem(SAVEKEY,cur);}catch(_){}
  window.__saveErr="storage full";saveWarn("storage is full — your last save is kept. Export your save from the title screen.");return{ok:false,err:"storage full"};};
function saveWarn(m){const now=Date.now();if(now-SAVE_WARNED<20000)return;SAVE_WARNED=now;try{toast("⚠ Save failed: "+m);}catch(_){}}
// save button: never claim "Game saved." when it failed
{const _t2=toast;toast=function(t){if(t==="Game saved."&&window.__saveErr){SAVE_WARNED=0;return saveWarn(window.__saveErr);}return _t2.apply(this,arguments);};}
