const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v52 spell combos: >=6 combos, two spells within 3s fuse, effects apply, spellbook lists them, discovery persists",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(async()=>{const B=__BA,o={res:{}},w=t=>new Promise(r=>setTimeout(r,t));B.closeMenu();o.n=B.COMBOS.length;const m=B.P.mag;m.known=Object.keys(B.SPELLS);B.forceUnlock();
  const S=B.SETS[0];B.teleport(S.x+40,S.y+40);for(const c of B.COMBOS){if(!B.SPELLS[c.a]||!B.SPELLS[c.b]){o.res[c.k]="missing";continue;}B.mobs.length=0;const foes=[];for(let i=0;i<3;i++){const e=B.spawnMob("goblin",B.hero.x+30+i*10,B.hero.y);e.hp=e.maxHp=500;foes.push(e);}
   m.mp=999;B.ageLastCast(9999);B.clearCD();B.castSpell(c.a);const hp0=foes.reduce((a,e)=>a+e.hp,0);B.clearCD();m.mp=999;const n0=(B.P.combos||{})[c.k]||0;B.castSpell(c.b);await w(20);const n1=(B.P.combos||{})[c.k]||0;
   o.res[c.k]={fired:n1>n0,stun:foes.some(e=>e.stun>0),slow:foes.some(e=>e.slowT>0),burn:foes.some(e=>e.cburnT>0)};}
  // no combo if too slow
  B.mobs.length=0;const e=B.spawnMob("goblin",B.hero.x+30,B.hero.y);e.hp=e.maxHp=500;B.clearCD();m.mp=999;B.castSpell("frost");B.ageLastCast(4000);B.clearCD();const n0=B.P.combos.shatter;B.castSpell("thunder");o.slow=B.P.combos.shatter===n0;
  B.spellbookMenu();await w(50);o.sb=[...document.querySelectorAll("#menu button")].map(b=>b.textContent).find(t=>/Combos/.test(t));B.combosMenu();await w(50);o.list=document.getElementById("menu").innerText;B.closeMenu();B.saveGame();return o;});
 console.log(JSON.stringify(o).slice(0,900));expect(o.n).toBeGreaterThanOrEqual(6);
 const fired=Object.values(o.res).filter(r=>r.fired).length;expect(fired).toBeGreaterThanOrEqual(6);expect(o.res.shatter.stun).toBe(true);expect(o.res.steam.slow).toBe(true);expect(o.res.firestorm.burn).toBe(true);expect(o.slow).toBe(true);
 expect(o.sb).toMatch(/Combos \(\d+\/\d+\)/);expect(o.list).toMatch(/Shatterstorm/);expect(o.list).toMatch(/Discovered/);
 await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");await page.waitForFunction(()=>__BA.state==="play");expect(await page.evaluate(()=>Object.keys(__BA.P.combos||{}).length)).toBeGreaterThanOrEqual(6);expect(errs).toEqual([]);});
