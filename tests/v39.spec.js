const {test,expect}=require("@playwright/test");
test("v39 pets: trail at distance, catch-up teleport, summon/dismiss, release with confirm, quick button, saved",async({page})=>{
 await page.addInitScript(()=>{window.__FAST=true;window.__TAME_SURE=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(async()=>{const B=__BA;B.closeMenu();const o={};const w=n=>new Promise(r=>setTimeout(r,n));B.getMobs().length=0;
  B.spawnMob("wolfman",B.hero.x+30,B.hero.y);B.tryTame(B.mobs[B.mobs.length-1]);B.closeMenu();await w(2500);let pe=B.mobs.find(m=>m.pet);
  o.dist=Math.hypot(pe.x-B.hero.x,pe.y-B.hero.y)/16;
  B.hero.x+=20*16;await w(400);pe=B.mobs.find(m=>m.pet);o.after=Math.hypot(pe.x-B.hero.x,pe.y-B.hero.y)/16;
  o.btn=!!document.getElementById("btnPets");const p=B.pets()[0];B.petSet(p,false);o.dis=!B.mobs.some(m=>m.pet);B.petsMenu();o.menu=document.querySelector("#menu").textContent;
  B.spawnMob("manebeast",B.hero.x+30,B.hero.y);B.tryTame(B.mobs[B.mobs.length-1]);B.closeMenu();
  B.releasePet(B.pets()[0]);o.n=B.pets().length;B.saveGame();o.saved=JSON.parse(localStorage.getItem(B.SAVEKEY)).P.pets.length;return o;});
 expect(r.dist).toBeGreaterThan(2.2);expect(r.dist).toBeLessThan(6);expect(r.after).toBeLessThan(8);expect(r.btn).toBe(true);expect(r.dis).toBe(true);expect(r.menu).toMatch(/resting at (home|the stable)/);expect(r.menu).toContain("Release");
 expect(r.n).toBe(1);expect(r.saved).toBe(1);
 await page.evaluate(()=>{__BA.closeMenu();__BA.petsMenu();});await page.click("text=/Release /");await expect(page.locator("#menu h2")).toContainText("Release");await page.click("text=Yes, release");
 expect(await page.evaluate(()=>__BA.pets().length)).toBe(0);});
