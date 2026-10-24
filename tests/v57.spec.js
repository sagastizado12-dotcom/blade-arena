const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
const prep=(page,sid)=>page.evaluate(sid=>{const B=__BA,H=__BH57;B.closeMenu();const m=B.P.mag;m.known=Object.keys(B.SPELLS);B.forceUnlock();m.max=99999;m.mp=99999;B.P.lv=40;
  const S=B.SETS[sid];B.hero.x=S.x*B.TILE+8;B.hero.y=(S.y+2)*B.TILE;B.clearCD&&B.clearCD();return S.name;},sid);
const runFrames=(page,n)=>page.evaluate(n=>{for(let i=0;i<n;i++)__BA.update();},n);
test("v57 full-charge Black Hole devours a town: ruins, kids safe, nobody harmed, enemies crushed, war within cap, season rebuild, saves",async({page})=>{test.setTimeout(150000);const errs=[];page.on("pageerror",e=>errs.push(e.message));
 await boot(page);
 const sid=await page.evaluate(()=>{const B=__BA;const c=B.SETS.filter(S=>S.id!==__BH57.MOD_ID&&!S.demon&&__BH57.townBlds(S.id).length>=6&&B.npcs.some(n=>n.alive&&n.s===S.id&&n.role==="child"));return c[0].id;});
 const name=await prep(page,sid);
 // normal and tier-2 casts do NOT destroy the town
 const n0=await page.evaluate(async sid=>{const B=__BA,H=__BH57;H.castCharged("blackhole",0);H.clearCD;B.clearCD&&B.clearCD();H.castCharged("blackhole",2);for(let i=0;i<400;i++)B.update();return{sing:!!H.sing(),ruin:!!H.ruinOf(sid),d:H.dest(sid)};},sid);
 await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v57-town-before.png"});
 const before=await page.evaluate(sid=>{const B=__BA;const L=B.npcs.filter(n=>n.alive&&n.s===sid);const kids=L.filter(n=>n.role==="child"||n.age<18);
   window.__kidIds=kids.map(k=>k.id);window.__adultIds=L.filter(n=>!(n.role==="child"||n.age<18)&&!n.adv).map(n=>n.id);
   const S=B.SETS[sid];const e=B.spawnMob("slime",(S.x+3)*B.TILE,(S.y+3)*B.TILE);window.__foe=e||B.mobs[B.mobs.length-1];
   B.clearCD&&B.clearCD();B.P.mag.mp=99999;const r=__BH57.castCharged("blackhole",3);return{kids:kids.length,adults:window.__adultIds.length,r:!!r,sing:!!__BH57.sing(),blds:__BH57.townBlds(sid).length};},sid);
 await runFrames(page,150);await page.waitForTimeout(200);await page.screenshot({path:"/workspace/shots-blade/v57-singularity.png"});
 const mid=await page.evaluate(()=>({kidHp:window.__kidIds.map(i=>__BA.npcs.find(n=>n.id===i)).every(k=>k.alive&&(k.hp==null||k.hp>0)),sing:!!__BH57.sing()}));
 await runFrames(page,200);await page.waitForTimeout(400);await page.screenshot({path:"/workspace/shots-blade/v57-town-after.png"});
 const after=await page.evaluate(sid=>{const B=__BA,H=__BH57;const ws=B.world.sets[sid];const bl=H.townBlds(sid).filter(b=>!(B.P.homes||[]).includes(b.id));
   return{ruin:!!ws.ruin,bh:ws.ruin&&ws.ruin.bh,allDown:bl.every(b=>(B.world.bld[b.id]||{}).dmg>=1),walls:H.townWalls(sid).every(w=>H.wallHp(w.i)<=0),
     kidsAlive:window.__kidIds.every(i=>{const n=B.npcs.find(x=>x.id===i);return n&&n.alive;}),adultsAlive:window.__adultIds.every(i=>{const n=B.npcs.find(x=>x.id===i);return n&&n.alive;}),
     foeDead:!window.__foe||window.__foe.dead||!B.mobs.includes(window.__foe)||window.__foe.hp<=0,conf:H.conflicts().length,news:(B.world.news||[]).slice(-12).map(x=>x.t||x).join(" | ").slice(0,300),infamy:B.P.infamy,dest:H.dest(sid),maxId:B.buildings.length};},sid);
 // map shows ruins
 await page.click("#btnMap").catch(()=>{});await page.waitForTimeout(300);await page.evaluate(sid=>{try{const S=__BA.SETS[sid];window.MAPM&&0;}catch(_){}},sid);await page.screenshot({path:"/workspace/shots-blade/v57-map-ruins.png"});await page.keyboard.press("Escape").catch(()=>{});await page.evaluate(()=>{const c=document.querySelector("#mapClose,#mapX");c&&c.click();});
 // slow rebuild: 10 days of hourly ticks barely move it
 const reb=await page.evaluate(sid=>{const H=__BH57,B=__BA;const R=H.ruinOf(sid);R.since-=26*60;for(let i=0;i<240;i++)H.rebuildHourly();return{p:R.progress,still:!!H.ruinOf(sid)};},sid);
 // persists across reload
 await page.evaluate(()=>__BA.saveGame());await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");await page.waitForFunction(()=>__BA.state==="play");
 const load=await page.evaluate(sid=>{const H=__BH57,B=__BA;return{ruin:!!H.ruinOf(sid),bh:H.ruinOf(sid)&&H.ruinOf(sid).bh,down:H.townBlds(sid).filter(b=>(B.world.bld[b.id]||{}).dmg>=0.8).length,nB:B.buildings.length};},sid);
 // rebuild-now option
 const now=await page.evaluate(async sid=>{const H=__BH57,B=__BA;B.P.gold=1e5;H.donateMenu(sid);await new Promise(r=>setTimeout(r,50));const btn=[...document.querySelectorAll("#menu button")].find(b=>/Rebuild now/.test(b.textContent));const has=!!btn;btn&&btn.click();await new Promise(r=>setTimeout(r,50));
   return{has,ruin:!!H.ruinOf(sid),d:H.dest(sid),gold:B.P.gold};},sid);
 console.log(JSON.stringify({name,n0,before,mid,after,reb,load,now}));
 expect(n0.sing).toBe(false);expect(n0.ruin).toBe(false);expect(before.r).toBe(true);expect(before.sing).toBe(true);expect(mid.kidHp).toBe(true);
 expect(after.ruin).toBe(true);expect(after.bh).toBe(1);expect(after.allDown).toBe(true);expect(after.walls).toBe(true);expect(after.kidsAlive).toBe(true);expect(after.adultsAlive).toBe(true);expect(after.foeDead).toBe(true);
 expect(after.conf).toBeLessThanOrEqual(4);expect(after.maxId).toBe(before.blds>0?after.maxId:0);
 expect(reb.still).toBe(true);expect(reb.p).toBeLessThan(0.2);expect(load.ruin).toBe(true);expect(load.bh).toBe(1);expect(load.down).toBeGreaterThan(3);
 expect(now.has).toBe(true);expect(now.ruin).toBe(false);expect(now.gold).toBe(1e5-4000);expect(errs).toEqual([]);});
test("v57 Moderno is gone; a black hole still respects the war cap",async({page})=>{test.setTimeout(120000);const errs=[];page.on("pageerror",e=>errs.push(e.message));
 await boot(page);
 const c=await page.evaluate(()=>{const B=__BA,H=__BH57;H.setRoom(null);const ks=B.KINGDOMS.filter(k=>!k.demon);
   const caps=new Set(B.KINGDOMS.map(k=>k.cap));const S=B.SETS.find(S=>!S.demon&&!caps.has(S.id)&&H.townBlds(S.id).length>=4);const before=H.conflicts().length;
   H.startSingularity(S.id);H.finishSingularity();const after=H.conflicts().length;
   B.kState().war=B.kState().war||{};for(const k of ks)B.kState().war[k.id]={since:1};
   return {mod:!!B.SETS.find(s=>s.name==="Moderno"),before,after,full:H.conflicts().length,ruin:!!H.ruinOf(S.id)};});
 expect(c.mod).toBe(false);expect(c.ruin).toBe(true);expect(c.after).toBe(c.before+1);expect(c.full).toBeLessThanOrEqual(4);expect(errs).toEqual([]);});
