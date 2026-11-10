// ===== v90 FAST MAP, FAST CONTINUE, ONE AWAY NOTE =====
// Terrain is painted once into a small sheet. Panning reuses the last
// frame instead of laying out every label again. Coming back skips the
// minute-by-minute catch-up. Offline wars and rebellions become one note.
let MAP_SHEET=null;
let shot=null,shotX=0,shotY=0,shotZ=-1,shotS=1,shotAt=0;
let toastQ=[],toastArm=0;
let DEFER=[],DEFER_ON=false,awayHold=false;
function mapSheet(){return MAP_SHEET;}
function buildMapSheet(){if(MAP_SHEET||typeof worldMapC==="undefined"||!worldMapC)return MAP_SHEET;
  const maxW=2048,sc=Math.min(1,maxW/worldMapC.width);
  const c=document.createElement("canvas");c.width=Math.max(1,Math.round(worldMapC.width*sc));c.height=Math.max(1,Math.round(worldMapC.height*sc));
  const g=c.getContext("2d");g.imageSmoothingEnabled=true;g.drawImage(worldMapC,0,0,c.width,c.height);MAP_SHEET=c;return c;}
function blitMap(g,x,y,w,h,dx,dy,dw,dh){const src=MAP_SHEET||(typeof worldMapC!=="undefined"?worldMapC:null);if(!g||!src||!(w>0)||!(h>0))return;
  const sx=src.width/WW,sy=src.height/WH;try{g.drawImage(src,x*sx,y*sy,Math.max(1,w*sx),Math.max(1,h*sy),dx,dy,dw,dh);}catch(_){}}
(function armSheet(){if(window.__READY&&typeof worldMapC!=="undefined"&&worldMapC){try{buildMapSheet();}catch(e){console.warn(e);}return;}setTimeout(armSheet,200);})();
let ownerMapT=0;
function paintOwnerSheet(){if(typeof T==="undefined"||!T)return;const maxW=2048,sc=maxW/WW,w=Math.max(1,Math.round(WW*sc)),h=Math.max(1,Math.round(WH*sc));
  const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d"),img=g.createImageData(w,h),d=img.data;
  for(let y=0;y<h;y++){const ty=Math.min(WH-1,(y/sc)|0),row=ty*WW;for(let x=0;x<w;x++){const tx=Math.min(WW-1,(x/sc)|0),t=T[row+tx];
    const col=(typeof MAPRGB!=="undefined"&&MAPRGB[t])||[26,90,200];const o=(y*w+x)*4;
    let r=col[0],gch=col[1],b=col[2];
    if(typeof kAtTile==="function"&&t!==DEEP&&t!==SHAL){const k=kAtTile(tx,ty),kc=k===255?[42,106,208]:(KINGDOMS[k]&&KINGDOMS[k].rgb);if(kc){const a=0.16;r=r*(1-a)+kc[0]*a;gch=gch*(1-a)+kc[1]*a;b=b*(1-a)+kc[2]*a;}}
    d[o]=r;d[o+1]=gch;d[o+2]=b;d[o+3]=255;}}
  g.putImageData(img,0,0);MAP_SHEET=c;shot=null;}
function fastBorderPosts(){if(typeof T==="undefined"||typeof BORDER_POSTS==="undefined")return;const posts=[];const cw=Math.ceil(WW/40),taken=new Uint8Array(cw*Math.ceil(WH/40));
  for(let y=4;y<WH-4;y+=3){const row=y*WW;for(let x=4;x<WW-4;x+=3){const t=T[row+x];if(t!==ROAD&&t!==BRIDGE)continue;const a=kAtTile(x,y);if(a===kAtTile(x+3,y)&&a===kAtTile(x,y+3))continue;
    const id=((y/40)|0)*cw+((x/40)|0);if(taken[id])continue;taken[id]=1;posts.push({x,y,a,b:kAtTile(x+3,y)});}}
  BORDER_POSTS=posts;}
function scheduleOwnerMap(){if(ownerMapT)return;ownerMapT=setTimeout(()=>{ownerMapT=0;try{KGRID=null;buildKGrid();}catch(_){}try{fastBorderPosts();}catch(_){}try{syncWar();}catch(_){}try{paintOwnerSheet();}catch(_){}},DEFER_ON?500:60);}
function snapMap(c){if(!c||!c.width)return;if(!shot)shot=document.createElement("canvas");
  if(shot.width!==c.width||shot.height!==c.height){shot.width=c.width;shot.height=c.height;}
  shot.getContext("2d").drawImage(c,0,0);shotX=MAPM.cx;shotY=MAPM.cy;shotZ=MAPM.z;shotS=mapScaleCss();shotAt=performance.now();}
function fastPan(c){const dpr=Math.min(2,window.devicePixelRatio||1),cw=c.clientWidth,ch=c.clientHeight;
  if(c.width!==Math.round(cw*dpr)||c.height!==Math.round(ch*dpr)){c.width=Math.round(cw*dpr);c.height=Math.round(ch*dpr);}
  const g=c.getContext("2d");const s=mapScaleCss();const dx=(shotX-MAPM.cx)*s,dy=(shotY-MAPM.cy)*s;
  g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.fillStyle="#16305a";g.fillRect(0,0,c.width,c.height);
  g.drawImage(shot,Math.round(dx*dpr),Math.round(dy*dpr));
  g.setTransform(dpr,0,0,dpr,0,0);
  const x0=MAPM.cx-cw/2/s,y0=MAPM.cy-ch/2/s;
  if(dx<0){const gap=-dx;blitMap(g,x0+(cw-gap)/s,y0,gap/s,ch/s,cw-gap,0,gap,ch);}
  else if(dx>1)blitMap(g,x0,y0,dx/s,ch/s,0,0,dx,ch);
  if(dy<0){const gap=-dy;blitMap(g,x0,y0+(ch-gap)/s,cw/s,gap/s,0,ch-gap,cw,gap);}
  else if(dy>1)blitMap(g,x0,y0,cw/s,dy/s,0,0,cw,dy);
  return true;}
{const _df=drawFullMap;drawFullMap=function(){const c=document.getElementById("mapc");const now=performance.now();
  if(c&&shot&&c.width===shot.width&&c.height===shot.height&&MAPM.z===shotZ&&now-shotAt<240){const s=mapScaleCss();const dx=Math.abs(MAPM.cx-shotX)*s,dy=Math.abs(MAPM.cy-shotY)*s;
    if(dx<180&&dy<180)return fastPan(c);}
  if(!MAP_SHEET)try{buildMapSheet();}catch(_){}
  const r=_df.apply(this,arguments);
  try{if(c)snapMap(c);}catch(_){}
  return r;};}
function emptyDig(){return {war:0,peace:0,border:0,rebel:0,ruler:0,family:0,flags:[],seen:{},n:0};}
function noteAway(text){if(!AWAY_TICK)return false;const t=String(text||"").replace(/<[^>]*>/g,"").replace(/^[\s⚔♛👑✊🏳📜]+/,"").trim();if(t.length<4)return false;
  const D=window.__awayDig||(window.__awayDig=emptyDig());if(D.seen[t])return true;D.seen[t]=1;D.n++;
  if(/rebel/i.test(t))D.rebel++;
  else if(/peace|truce|surrender|lays down/i.test(t))D.peace++;
  else if(/ransom|ruler is captured|is captured, not slain/i.test(t))D.ruler++;
  else if(/flag|border|captured|free city|thrown off/i.test(t)){D.border++;try{for(const S of SETS)if(S&&S.name&&t.includes(S.name)&&D.flags.length<6&&!D.flags.includes(S.name))D.flags.push(S.name);}catch(_){}}
  else if(/\bwar\b|battle|\barmy\b|front|takes the field|marches/i.test(t))D.war++;
  else if(/born|wed|married|passed away|\bbaby\b/i.test(t))D.family++;
  return true;}
function digestLines(){const D=window.__awayDig;if(!D||!D.n)return [];const L=[];
  if(D.war)L.push(D.war===1?"A war shifted while you were away.":D.war+" wars shifted while you were away.");
  if(D.peace)L.push(D.peace===1?"A war ended.":D.peace+" wars ended.");
  if(D.border)L.push(D.border===1?"A border moved"+(D.flags[0]?" ("+D.flags[0]+")":"")+".":D.border+" borders moved"+(D.flags.length?": "+D.flags.slice(0,4).join(", "):"")+".");
  if(D.rebel)L.push(D.rebel===1?"A rebellion rose or was settled.":D.rebel+" rebellions rose or were settled.");
  if(D.ruler)L.push(D.ruler===1?"A ruler was captured or ransomed.":D.ruler+" rulers were captured or ransomed.");
  if(D.family)L.push(D.family===1?"One family note.":D.family+" family notes.");
  return L;}
function mergeDigest(){const lines=digestLines();window.__awayDig=null;if(!lines.length)return;
  if(typeof awayPending==="undefined"||!awayPending)awayPending={hrs:1,days:0,mins:0,lines:[],R:{gold:0,xp:0,gp:0,parts:{},love:[],kids:[]}};
  const rest=(awayPending.lines||[]).filter(l=>l&&!/^While you were away/.test(l)).slice(0,3);
  awayPending.lines=lines.concat(rest).slice(0,8);}
function queueDefer(fn){if(DEFER_ON){DEFER.push(fn);return true;}return false;}
function wrapDefer(fn){if(typeof fn!=="function")return fn;return function(){if(queueDefer(()=>fn.apply(this,arguments)))return null;return fn.apply(this,arguments);};}
if(typeof kingThink==="function")kingThink=wrapDefer(kingThink);
if(typeof bloodPass==="function")bloodPass=wrapDefer(bloodPass);
if(typeof legacyTick==="function")legacyTick=wrapDefer(legacyTick);
if(typeof staffGuards==="function")staffGuards=wrapDefer(staffGuards);
if(typeof modFarmers==="function")modFarmers=wrapDefer(modFarmers);
if(typeof growUp46==="function")growUp46=wrapDefer(growUp46);
if(typeof jBackfill==="function")jBackfill=wrapDefer(jBackfill);
if(typeof enforceWives==="function")enforceWives=wrapDefer(enforceWives);
if(typeof modTerrChanged==="function"){const _mt=modTerrChanged;modTerrChanged=function(){const run=()=>{const r=_mt.apply(this,arguments);MAP_SHEET=null;shot=null;try{buildMapSheet();}catch(_){}return r;};if(queueDefer(run))return null;return run();};}
awayAdvance=function(ms){const mins=Math.floor(ms/MS_PER_GAME_MIN);if(mins<=0||!world||!P)return 0;
  const was=AWAY_TICK;AWAY_TICK=true;if(!window.__awayDig)window.__awayDig=emptyDig();
  const hg=P.hunger,day0=world.day,ws=mobs?mobs.length:0,cq=world.cq?world.cq.length:0;
  try{
    const hours=Math.min(6,Math.floor(mins/60));
    for(let h=0;h<hours;h++){try{advanceMinutes(60);}catch(e){console.warn(e);}}
    let left=mins-hours*60,days=Math.floor(left/1440);
    if(days>0){const ticks=Math.min(3,days),step=Math.max(1,Math.floor(days/ticks));let jumped=0;
      for(let i=0;i<ticks;i++){world.day+=step;jumped+=step;try{dailyTick();}catch(e){console.warn(e);}}
      if(days>jumped){const more=days-jumped,y0=Math.floor(world.day/YEAR_DAYS);world.day+=more;
        const yrs=Math.floor(world.day/YEAR_DAYS)-y0;
        if(yrs>0)try{awayYears(Math.min(yrs,12));}catch(e){console.warn(e);}
        if(yrs>12)for(const n of npcs)if(n&&n.alive)n.age=(n.age||0)+(yrs-12);}
      left-=days*1440;}
    if(left>0){const sim=Math.min(left,180);try{advanceMinutes(sim);}catch(e){console.warn(e);}
      const skip=left-sim;if(skip){world.min+=skip;if(world.min>=1440){world.day+=Math.floor(world.min/1440);world.min%=1440;}}}
    if(mobs&&mobs.length>ws)mobs.length=ws;
  }catch(e){console.warn(e);}finally{if(P)P.hunger=hg;if(!DEFER_ON){AWAY_TICK=was;try{if(world&&world.cq&&world.cq.length>cq)world.cq.length=cq;}catch(_){}}}
  try{for(const s of world.sets)if(s&&s.raid)s.raid=null;}catch(_){}
  if(typeof awayPending!=="undefined"&&awayPending)awayPending.daysApplied=Math.max(0,(world.day||0)-day0);
  if(!DEFER_ON)try{mergeDigest();}catch(_){}
  return mins;};
{const _al=alert49;alert49=function(title,text,pos){if(AWAY_TICK){noteAway(text||title);try{addNews(-1,text);}catch(_){}try{jAdd(text,"war");}catch(_){}return;}return _al.apply(this,arguments);};}
{const _an=addNews;addNews=function(s,t){if(AWAY_TICK)noteAway(t);return _an.apply(this,arguments);};}
function flushToasts(){toastArm=0;if(!toastQ.length)return;const first=toastQ.shift(),_t=flushToasts._t;if(_t)try{_t(first);}catch(_){}
  if(toastQ.length>=3){const n=toastQ.length;toastQ.length=0;try{_t(n+" more notices.");}catch(_){}}
  else if(toastQ.length){toastArm=1;setTimeout(flushToasts,650);}}
{const _t=toast;flushToasts._t=_t;toast=function(t){if(AWAY_TICK){noteAway(t);return;}if(t==null||t==="")return;toastQ.push(String(t));if(!toastArm){toastArm=1;flushToasts();}};}
{const _sa=showAway;showAway=function(a){if(awayHold)return;if(document.getElementById("awayScroll"))return;return _sa.apply(this,arguments);};}
function finishAway(){AWAY_TICK=false;try{if(world&&world.cq)world.cq.length=0;}catch(_){}
  try{mergeDigest();}catch(_){}awayHold=false;try{if(typeof awayPending!=="undefined"&&awayPending)showAway();}catch(_){}}
{const _sg=saveGame;saveGame=function(){if(AWAY_TICK)return;return _sg.apply(this,arguments);};}
{const _lg=loadGame;loadGame=function(){DEFER_ON=true;DEFER.length=0;let last=0;
  try{last=(JSON.parse(localStorage.getItem(SAVEKEY)).P||{}).lastSaved||0;}catch(_){}
  const away=!!(last&&Date.now()-last>=60000);
  if(away){AWAY_TICK=true;window.__awayDig=emptyDig();awayHold=true;}
  let r;try{r=_lg.apply(this,arguments);}finally{DEFER_ON=false;}
  const q=DEFER.splice(0,DEFER.length);
  const done=()=>{if(away)AWAY_TICK=true;for(const fn of q){try{fn();}catch(e){console.warn(e);}}if(away)finishAway();};
  if(r){if(window.requestIdleCallback)requestIdleCallback(done,{timeout:450});else setTimeout(done,20);}
  else{awayHold=false;if(away)AWAY_TICK=false;}
  return r;};}
{const _bp=beginPlay;beginPlay=function(){if(!MAP_SHEET)try{buildMapSheet();}catch(_){}
  const _g=genJobs;const todo=[];genJobs=function(s){todo.push(s);};
  let r;try{r=_bp.apply(this,arguments);}finally{genJobs=_g;}
  if(todo.length){const job=()=>{for(const s of todo)if(s&&(!s.jobs||!s.jobs.length))try{_g(s);}catch(_){}};
    if(window.requestIdleCallback)requestIdleCallback(job,{timeout:900});else setTimeout(job,40);}
  return r;};}
