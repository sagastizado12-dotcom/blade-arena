const {test,expect}=require("@playwright/test");
async function boot(page){await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");await page.evaluate(()=>__BA.closeMenu());}
test("sword skill ranks, unlocks, speed, tactician, command",async({page})=>{await boot(page);
 const r=await page.evaluate(async()=>{const B=__BA,o={};o.r0=B.swRank();const hb0=(()=>{B.hero.swinging=1;const b=B.swordHitbox();B.hero.swinging=-1;return b.w;})();
  B.spawnMob("goblin",B.hero.x+14,B.hero.y);const e=B.mobs[B.mobs.length-1];e.hp=99;e.iframes=0;B.hero.dir=2;B.hero.swinging=1;e.weakA=null;B.hurtEnemy(e,1,0,false);B.hero.swinging=-1;o.xp1=B.swd().xp;
  B.swd().xp=1000;o.r4=B.swRank();B.hero.swinging=1;o.hbGrow=B.swordHitbox().w-hb0;B.hero.swinging=-1;
  e.weakA=0;e.hp=50;const h0=e.hp;B.hero.swinging=1;B.hurtEnemy(e,1,0,false);B.hero.swinging=-1;o.crit=window.__lastCrit!=null;
  o.sprint=B.SPRINT_MUL*1.15;o.guard=2.1;o.maxMob=Math.max(...Object.values(B.MONDEF).map(d=>d.spd||0));
  e.hp=50;e.x=B.hero.x+30;e.y=B.hero.y;const hp1=e.hp;e.iframes=0;B.swThrust();o.thrust=e.hp<hp1;
  B.command("rally");o.cmd=B.CMD.k;return o;});
 expect(r.r0).toBe(0);expect(r.xp1).toBeGreaterThan(0);expect(r.r4).toBe(4);expect(r.hbGrow).toBe(12);expect(r.crit).toBe(true);
 expect(r.sprint).toBeGreaterThan(r.guard);expect(r.sprint).toBeGreaterThan(r.maxMob*1.5);expect(r.thrust).toBe(true);expect(r.cmd).toBe("rally");
 // skills tab in pause
 await page.evaluate(()=>__BA.showMenu("Paused","",[{l:"Close"}]));await expect(page.locator("text=⚔ Skills").first()).toBeVisible();
 await page.locator("text=⚔ Skills").first().click();await expect(page.locator("text=Grandmaster").first()).toBeVisible();
 // telegraph drawn while a mob is close
 const t=await page.evaluate(async()=>{__BA.closeMenu();window.__teleN=0;const B=__BA;B.spawnMob("goblin",B.hero.x+10,B.hero.y);await new Promise(r=>setTimeout(r,400));return window.__teleN;});expect(t).toBeGreaterThan(0);
 // save compatible
 const s=await page.evaluate(()=>{__BA.saveGame();const raw=JSON.parse(localStorage.getItem(__BA.SAVEKEY));return raw.P?raw.P.swd:raw.swd;});expect(s&&s.xp).toBeGreaterThan(0);});
