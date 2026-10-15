const {test,expect}=require("@playwright/test");
test("pets & mounts: tame, fighter fights + obeys Command hold, mount speeds rider, levels, saved",async({page})=>{
 await page.addInitScript(()=>{window.__FAST=true;window.__TAME_SURE=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(async()=>{const B=__BA;B.closeMenu();const o={};const w=(n)=>new Promise(r=>setTimeout(r,n));
  B.spawnMob("wolfman",B.hero.x+30,B.hero.y);const e=B.mobs[B.mobs.length-1];o.p=B.tryTame(e);o.n=B.pets().length;await w(300);
  const pe=B.mobs.find(m=>m.pet);o.ent=!!pe;const hp0=pe.hp;B.hurtEnemy(pe,5,0,false);o.safe=pe.hp===hp0;
  B.command("hold");const x0=pe.x;B.hero.x+=60;await w(400);o.held=Math.abs(pe.x-x0)<1;B.CMD.k=null;await w(500);o.moved=Math.abs(pe.x-x0)>2;
  const p=B.pets()[0];B.petXp(p,25);o.lv=p.lv;
  B.spawnMob("manebeast",B.hero.x+30,B.hero.y);const m=B.mobs[B.mobs.length-1];B.tryTame(m);o.mount=!!B.activeMount()&&B.P.riding;
  B.saveGame();o.saved=JSON.parse(localStorage.getItem(B.SAVEKEY)).P.pets.length;return o;});
 expect(r.n).toBe(1);expect(r.ent).toBe(true);expect(r.safe).toBe(true);expect(r.held).toBe(true);expect(r.moved).toBe(true);expect(r.lv).toBe(2);expect(r.mount).toBe(true);expect(r.saved).toBe(2);
 // mount speed: rider covers more ground
 const sp=await page.evaluate(async()=>{const B=__BA;const run=async()=>{const x=B.hero.x;window.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyD"}));await new Promise(r=>setTimeout(r,600));window.dispatchEvent(new KeyboardEvent("keyup",{code:"KeyD"}));return B.hero.x-x;};
  const a=await run();B.P.riding=false;B.hero.x-=200;const b=await run();return {ride:a,walk:b};});expect(sp.ride).toBeGreaterThan(sp.walk*1.2);
 await page.evaluate(()=>__BA.familyMenu());await expect(page.locator("text=🐾 Pets & Mounts").first()).toBeVisible();});
