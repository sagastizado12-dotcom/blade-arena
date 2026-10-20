const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v51 legendary hunts: board, tracking marks lair, legend spawns at lair, slaying rewards + title + trophy, bestiary mastery, persists",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(async()=>{const B=__BA,o={},w=t=>new Promise(r=>setTimeout(r,t));B.closeMenu();o.n=B.HLEG.length;
  B.huntsMenu();await w(50);const bt=[...document.querySelectorAll("#menu button")];o.btns=bt.filter(b=>/Track/.test(b.textContent)).length;bt.find(b=>/Ironhide/.test(b.textContent)).click();await w(50);B.closeMenu();o.track=B.HUNT().track;
  const L=B.HLEG[0],S=B.SETS[L.s];B.huntTick();o.early=B.mobs.some(m=>m.legendK);B.teleport(S.x+L.dx,S.y+L.dy+3);B.huntTick();o.dbg=[B.mobs.filter(m=>m.legendK).map(m=>[m.dead,m.sp,m.x|0,m.y|0]),B.hero.x/16|0,B.hero.y/16|0];for(let i=0;i<40;i++)B.update();o.dbg2=B.mobs.filter(m=>m.legendK).length;const e=B.mobs.find(m=>m.legendK==="ironhide"&&!m.dead);o.spawned=!!e;if(!e)return o;o.hp=e&&e.maxHp;
  const g0=B.P.gold;for(let i=0;i<200&&!e.dead;i++){e.iframes=0;B.hurtEnemy(e,5,0,false);}o.dead=e.dead;o.gold=B.P.gold-g0;o.slain=!!B.HUNT().slain.ironhide;o.title=B.P.huntTitle;o.tro=B.trophies().join("|");o.track2=B.HUNT().track;
  for(let i=0;i<40;i++)B.update();o.respawn=B.mobs.some(m=>m.legendK==="ironhide"&&!m.dead);
  // bestiary mastery
  B.P.best=B.P.best||{};B.P.best.goblin={seen:1,kills:9,parts:{}};const m=B.spawnMob("goblin",B.hero.x+40,B.hero.y);m.hp=m.maxHp=100;m.iframes=0;B.hurtEnemy(m,2,0,false);const d0=100-m.hp;B.P.best.goblin.kills=10;m.iframes=0;const h1=m.hp;B.hurtEnemy(m,2,0,false);o.d0=d0;o.d1=h1-m.hp;
  B.bestiaryMenu();await w(50);o.best=document.getElementById("menu").innerText;B.closeMenu();B.saveGame();return o;});
 console.log(JSON.stringify(o).slice(0,700));
 expect(o.n).toBeGreaterThanOrEqual(6);expect(o.btns).toBe(6);expect(o.track).toBe("ironhide");expect(o.early).toBe(false);expect(o.spawned).toBe(true);expect(o.hp).toBe(60);expect(o.dead).toBe(true);expect(o.gold).toBeGreaterThanOrEqual(400);expect(o.slain).toBe(true);expect(o.title).toBe("Hide-breaker");
 expect(o.tro).toMatch(/Ironhide/);expect(o.track2).toBe(null);expect(o.respawn).toBe(false);expect(o.d1).toBeGreaterThan(o.d0);expect(o.best).toMatch(/Legends: Ironhide/);
 await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");await page.waitForFunction(()=>__BA.state==="play");expect(await page.evaluate(()=>!!__BA.HUNT().slain.ironhide)).toBe(true);expect(errs).toEqual([]);});
