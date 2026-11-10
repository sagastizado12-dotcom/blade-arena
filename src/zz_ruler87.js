// ===== v87 RULERS ON THE FIELD =====
// While a country is at war its ruler leaves the castle, travels to the front,
// and holds a command tent behind the line. Defeat captures or sends them home.
// They are never removed from the realm.
function warOfKing(k){return (world.wars||[]).find(w=>w&&!w.over&&(w.a===k||w.b===k))||null;}
function rulerAway(k){const C=world.crown&&world.crown[k];const w=warOfKing(k);if(!w)return false;if(C&&C.captured)return true;return !!(C&&(C.o==="march"||C.o==="crush"));}
function campTile(k,w){let f;try{f=frontOf(w);}catch(_){return capitalAnchor(k);}
  const dir=w.a===k?-1:1;let x=Math.round(f.x+Math.cos(f.ang)*dir*9),y=Math.round(f.y+Math.sin(f.ang)*dir*9);
  if(typeof fightTile==="function"&&!fightTile(x,y)&&typeof nearestTile==="function"){const n=nearestTile(x,y,18,"f",fightTile);if(n){x=n[0];y=n[1];}}
  if(typeof brawlTown==="function"&&brawlTown(x*TILE,y*TILE)){x=f.x;y=f.y;}
  return {x,y};}
function rulersToWar(){if(!world||!world.crown)return;
  for(const K of KINGDOMS){if(!K||K.demon)continue;const C=world.crown[K.id];const w=warOfKing(K.id);
    if(C&&C.captured)continue;
    if(!w){if(C&&C.camp){const home=capitalAnchor(K.id);setKing(K.id,"court","peace",home);const H=world.crown[K.id];if(H){H.camp=0;H.warId=0;H.captured=0;H.hostile=0;H.hp=H.max||30;}}continue;}
    const camp=campTile(K.id,w);setKing(K.id,"march","war",camp);const N=world.crown[K.id];
    if(N){N.camp=1;N.warId=w.id;if(N.hp==null)N.hp=30;N.max=30;}}}
function rulerPx(k){const C=world.crown&&world.crown[k];if(!C)return null;return {x:C.x*TILE+8,y:C.y*TILE+4,C};}
function rulerNear(){if(!world||!world.crown||!hero||room)return -1;let best=-1,bd=30;
  for(const K of KINGDOMS){if(!K||K.demon)continue;const p=rulerPx(K.id);if(!p||!p.C.camp)continue;if(p.C.o!=="march"&&!p.C.captured)continue;
    const d=Math.hypot(hero.x+6-p.x,hero.y+6-p.y);if(d<bd){bd=d;best=K.id;}}return best;}
function sideOf(w,k){return w.a===k?"a":"b";}
function foeRuler(k){const w=warOfKing(k);if(!w)return false;const mine=sideOf(w,k);if(w.hero&&w.hero!==mine)return true;const C=world.crown[k];return !!(C&&C.hostile);}
function questOf(k){P.rulerQ87=P.rulerQ87||{};return P.rulerQ87[k]||null;}
function setQuest(k,kind){P.rulerQ87=P.rulerQ87||{};P.rulerQ87[k]={kind,have:0,done:0,x:0,y:0};
  const w=warOfKing(k);if(kind==="scout"&&w){const f=frontOf(w);const dir=w.a===k?1:-1;P.rulerQ87[k].x=Math.round(f.x+Math.cos(f.ang)*dir*12);P.rulerQ87[k].y=Math.round(f.y+Math.sin(f.ang)*dir*12);}
  return P.rulerQ87[k];}
function knightRuler(k){const K=KINGDOMS[k];P.titles=P.titles||[];const t=(K.fem?"Dame":"Knight")+" of "+K.name;if(!P.titles.includes(t))P.titles.push(t);
  try{kState().rep=Math.min(100,(kState().rep||50)+6);}catch(_){}P.gold+=60;toast(K.ruler+" names you "+t+". +60g.");}
function payQuest(k,why){const K=KINGDOMS[k];P.gold+=50;try{kState().rep=Math.min(100,(kState().rep||50)+4);}catch(_){}
  const q=questOf(k);if(q)q.done=1;toast(K.ruler+" is pleased. +50g. "+why);}
function fieldStatus(k){const K=KINGDOMS[k],w=warOfKing(k),C=world.crown[k];if(!w)return K.ruler+" is at peace.";
  const A=w.army;let line=K.name+" is at war with "+KINGDOMS[w.a===k?w.b:w.a].name+".";
  if(A)line+="\nArmies: "+KINGDOMS[w.a].name+" "+A.a+" vs "+KINGDOMS[w.b].name+" "+A.b+". Morale "+(w.a===k?A.morA:A.morB)+".";
  try{const f=frontOf(w);line+="\nThe line is by "+(f.s&&f.s.name)+" and "+(f.t&&f.t.name)+"."; }catch(_){}
  if(C&&C.captured)line+="\n"+K.ruler+" is captured, not slain.";
  const D=P&&P.deeds86;if(D&&D.fought===k)line+="\nYou have fought for "+K.name+" before.";
  if(w.hero===sideOf(w,k))line+="\nYou are pledged to this crown.";
  return line;}
function stewardMenu(k){const K=KINGDOMS[k],C=world.crown&&world.crown[k];
  const where=C&&C.captured?"in enemy hands at the front":"at the command tent on the front";
  showMenu("Empty throne",`The throne of ${K.name} is empty. A steward bows.\n\n"${K.ruler} is ${where}. I keep the hall until the crown returns."`,[
    {l:"Ask where the front is",f:()=>{const w=warOfKing(k);let f=null;try{f=w&&frontOf(w);}catch(_){}if(f)toast("The front lies near "+(f.s&&f.s.name)+".");else toast("The war has gone quiet.");}},
    {l:"Leave"}]);}
function fieldMenu(k){const K=KINGDOMS[k],C=world.crown[k],w=warOfKing(k);if(!C||!w)return;
  const mine=sideOf(w,k),enemy=mine==="a"?"b":"a",foe=foeRuler(k);
  const q=questOf(k);
  const lines=[fieldStatus(k),K.ruler+(C.captured?" kneels, alive, hands bound.":" stands by the command tent, armor on, crown covered for the field.")];
  const btns=[];
  if(C.captured){btns.push({l:"Pay the ransom (80g)",dis:P.gold<80,f:()=>{P.gold-=80;freeRuler(k,"ransomed");}});
    if(w.hero===mine)btns.push({l:"Cut the bonds",f:()=>freeRuler(k,"rescued")});
    if(foe||w.hero===enemy)btns.push({l:"Offer peace and send them home",f:()=>{freeRuler(k,"peace");try{endWar(w,"peace");}catch(_){}toast(K.ruler+" accepts the peace and leaves the field.");}});
    btns.push({l:"Leave"});showMenu(K.ruler,lines.join("\n\n"),btns);return;}
  if(!foe){btns.push({l:w.hero===mine?"You are pledged":"Pledge to "+K.name,f:()=>{w.hero=mine;C.hostile=0;if(P.deeds86)P.deeds86.fought=k;toast("You pledge your sword to "+K.name+".");fieldMenu(k);}});
    if(!q||q.done)btns.push({l:"Ask for a war task",f:()=>questMenu(k)});
    else btns.push({l:"Report the task",f:()=>reportQuest(k)});
    if((P.titles||[]).some(t=>t.indexOf(K.name)>=0))btns.push({l:"Your knight"});
    else if(q&&q.done)btns.push({l:"Ask to be knighted",f:()=>knightRuler(k)});
  }else{btns.push({l:"Cross blades",f:()=>{C.hostile=1;toast(K.ruler+" raises a blade. They can fall, but they will not die here.");}});
    btns.push({l:"Offer surrender and peace",f:()=>{try{endWar(w,"peace");}catch(_){}C.hostile=0;toast(K.ruler+" accepts terms. The war ends and the crown rides home.");}});}
  btns.push({l:"Leave"});showMenu(K.ruler+" at the front",lines.join("\n\n"),btns);}
function questMenu(k){const K=KINGDOMS[k];
  showMenu(K.ruler+"'s tasks","The crown needs one thing done. Rewards are coin and standing.",[
    {l:"Hold our flank",f:()=>{setQuest(k,"flank");toast("Stay on the line and break two enemy squads.");}},
    {l:"Escort supplies (25g or 2 herbs)",f:()=>{setQuest(k,"supplies");toast("Bring coin or herbs to the tent.");}},
    {l:"Scout the far side",f:()=>{setQuest(k,"scout");toast("Ride past the line and look at their camp.");}},
    {l:"Bring down their commander",f:()=>{setQuest(k,"commander");toast("Drop the enemy ruler. Capture, do not kill.");}},
    {l:"Back",f:()=>fieldMenu(k)}]);}
function reportQuest(k){const q=questOf(k),K=KINGDOMS[k];if(!q||q.done){toast("Nothing is owed.");return fieldMenu(k);}
  if(q.kind==="flank"&&q.have>=2)return payQuest(k,"The flank held.");
  if(q.kind==="supplies"){if(P.gold>=25){P.gold-=25;return payQuest(k,"The wagons roll.");}if((P.inv.herb||0)>=2){P.inv.herb-=2;return payQuest(k,"The healers have herbs.");}toast("You need 25 gold or 2 herbs.");return;}
  if(q.kind==="scout"){const d=Math.hypot(hero.x/TILE-q.x,hero.y/TILE-q.y);if(d<4)return payQuest(k,"A clear report.");toast("You have not reached the scout point.");return;}
  if(q.kind==="commander"){const w=warOfKing(k);const ek=w.a===k?w.b:w.a;const E=world.crown&&world.crown[ek];if(E&&E.captured)return payQuest(k,"Their crown is in your hands.");toast(KINGDOMS[ek].ruler+" is still standing.");return;}
  toast("Not yet.");}
function freeRuler(k,how){const C=world.crown[k];if(!C)return;C.captured=0;C.hp=C.max||30;C.hostile=0;
  const home=capitalAnchor(k);C.x=home.x;C.y=home.y;C.gx=home.x;C.gy=home.y;
  const msg=KINGDOMS[k].ruler+" is "+how+" and leaves the field alive.";try{jAdd(msg,"war");addNews(KINGDOMS[k].cap,msg);}catch(_){}toast(msg);}
function captureRuler(k){const C=world.crown[k];if(!C||C.captured)return;C.captured=1;C.hp=0;C.hostile=0;
  for(const w of world.wars||[]){if(w.over||!w.army)continue;if(w.a===k){w.army.cmdA=0;w.army.a=Math.min(w.army.a,Math.round(w.army.baseA*0.35));}
    if(w.b===k){w.army.cmdB=0;w.army.b=Math.min(w.army.b,Math.round(w.army.baseB*0.35));}
    try{if(typeof brawlMorale==="function")brawlMorale(w);}catch(_){}
    if(w.army&&w.army.surrendered&&!(typeof BRAWL!=="undefined"&&BRAWL.on&&BRAWL.war&&BRAWL.war.id===w.id)){try{brawlFinish(w,w.army.surrendered==="a"?1:0,"surrender");}catch(_){}}}
  const msg=KINGDOMS[k].ruler+" is captured, not slain. The line wavers.";try{jAdd(msg,"war");addNews(KINGDOMS[k].cap,msg);}catch(_){}toast("♛ "+msg);}
function rulerTick(){if(!world||!world.crown||!hero||state!=="play"||room)return;
  if(frameN%30===0){try{rulersToWar();}catch(e){console.warn("ruler",e);}}
  if(frameN%12===0){for(const K of KINGDOMS){if(!K||K.demon)continue;const C=world.crown[K.id];if(!C||C.captured||C.o!=="march")continue;
    if(!hero||Math.hypot(C.x*TILE-hero.x,C.y*TILE-hero.y)>480)continue;
    const gx=C.gx,gy=C.gy;let best=null,bd=Math.hypot(C.x-gx,C.y-gy);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=C.x+dx,y=C.y+dy;let t=0;try{t=tAt(x,y);}catch(_){}
      if(t!==ROAD&&t!==COBBLE&&t!==BRIDGE)continue;if(typeof fightTile==="function"&&!fightTile(x,y))continue;
      const d=Math.hypot(x-gx,y-gy);if(d<bd-0.2){bd=d;best=[x,y];}}
    if(best){C.x=best[0];C.y=best[1];}}}
  const hit=hero.swinging>=0&&hero.swingT>=2&&hero.swingT<=5&&!hero._ruHit;
  if(hero.swinging<0)hero._ruHit=0;
  for(const K of KINGDOMS){if(!K||K.demon)continue;const C=world.crown[K.id];if(!C||!C.camp||C.captured)continue;
    if(!foeRuler(K.id))continue;const p=rulerPx(K.id);if(!p)continue;const d=Math.hypot(hero.x+6-p.x,hero.y+6-p.y);
    if(hit&&d<26){hero._ruHit=1;C.hp=Math.max(0,(C.hp==null?30:C.hp)-4);brawlSpark&&brawlSpark(p.x,p.y-8,0,[255,220,140]);try{SFX.hit();}catch(_){}if(C.hp<=0)captureRuler(K.id);}
    if(d<22&&frameN%40===0&&C.hp>0){hurtHero(1,Math.atan2(hero.y-p.y,hero.x-p.x));try{SFX.swing();}catch(_){}C.swing=8;}}
  const qk=Object.keys(P.rulerQ87||{});
  for(const id of qk){const q=P.rulerQ87[id];if(!q||q.done||q.kind!=="flank")continue;const w=warOfKing(+id);if(w&&w.hero===sideOf(w,+id)&&BRAWL&&BRAWL.kills){const side=w.a===+id?1:0;if((BRAWL.kills[side]||0)>=2)q.have=2;}}}
function drawRulers(){if(!world||!world.crown||room)return;
  for(const K of KINGDOMS){if(!K||K.demon)continue;const C=world.crown[K.id];if(!C||!C.camp)continue;
    const x=C.x*TILE+8,y=C.y*TILE+4;if(x<camX-80||y<camY-80||x>camX+W+80||y>camY+H+80)continue;
    const at=Math.hypot(C.x-C.gx,C.y-C.gy)<=2;
    if(at){ctx.fillStyle="#6a4a28";ctx.fillRect(x-16,y-6,34,16);ctx.fillStyle="#c8a060";ctx.fillRect(x-18,y-18,38,8);ctx.fillStyle=K.col;ctx.fillRect(x-14,y-28,8,12);ctx.fillRect(x+8,y-28,8,12);ctx.fillStyle="#f4f0e4";ctx.fillRect(x-4,y-30,6,10);}
    for(const off of [-18,18]){try{drawChibi({...chibiLook(8800+K.id+off,"guard","human"),cloth:K.rgb},x+off,y+6,off<0?1:2,(frameN>>3)%2,0.85);}catch(_){}}
    if(C.captured){ctx.fillStyle="#f7f4ea";ctx.fillRect(x+6,y-26,8,5);ctx.fillStyle="#3a2a18";ctx.fillRect(x+5,y-26,1,14);ctx.fillStyle="#ddd";ctx.fillRect(x-3,y-2,8,2);}
    else if(C.swing>0){C.swing--;ctx.strokeStyle="#f4f4f4";ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x+12,y-20);ctx.stroke();}
    ctx.font="bold 8px system-ui";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#000";ctx.strokeText(K.ruler,x,y-36);ctx.fillStyle=K.col;ctx.fillText(K.ruler,x,y-36);}}
{const _kt=kingThink;kingThink=function(){const r=_kt.apply(this,arguments);try{rulersToWar();}catch(e){console.warn("ruler",e);}return r;};}
{const _cm=castleMenu;castleMenu=function(){try{if(room&&room.b&&room.b.kind==="castle"){const k=kOf(room.b.s);if(rulerAway(k))return stewardMenu(k);}}catch(_){}return _cm.apply(this,arguments);};}
{const _rn=roomNpcs;roomNpcs=function(){const L=_rn.apply(this,arguments);try{if(room&&room.b&&room.b.kind==="castle"){const k=kOf(room.b.s);if(rulerAway(k)){const look=chibiLook(7100+k,"guard","human");Object.assign(KING_LOOK,look);for(const e of L)if(e.king)e.name="Steward of "+KINGDOMS[k].name;}}}catch(_){}return L;};}
{const _i=interact;interact=function(){try{if(!(P&&P.fly>0)&&!room){const k=rulerNear();if(k>=0){fieldMenu(k);return true;}}}catch(e){console.warn("ruler",e);}return _i.apply(this,arguments);};}
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{rulerTick();}catch(e){console.warn("ruler",e);}return r;};}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(state==="play"&&!room&&!(P&&P.fly>=28)){ctx.save();
  const fz=(P&&P.fly>0&&P.fly<28)?(draw._fz!=null?draw._fz:1):1;
  ctx.setTransform(RS*fz,0,0,RS*fz,-camX*RS*fz,-camY*RS*fz);ctx.imageSmoothingEnabled=false;drawRulers();ctx.restore();}}catch(e){try{ctx.restore();}catch(_){}}return r;};}
window.__RULER87={away:rulerAway,camp:campTile,sync:rulersToWar,near:rulerNear,menu:fieldMenu,capture:captureRuler,free:freeRuler};
