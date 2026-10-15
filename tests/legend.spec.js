const {test,expect}=require("@playwright/test");
test("legendary gear: rare part drop, master smith forges, effects apply, saved",async({page})=>{
 await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(()=>{const B=__BA;B.closeMenu();const o={};B.spawnMob("goblin",B.hero.x+40,B.hero.y);const e=B.mobs[B.mobs.length-1];e.depBoss=true;e.maxHp=40;e.dead=true;B.onKill(e);o.part=B.P.inv.voidshard;
  B.P.inv.gem=2;B.P.gold=500;const d0=B.swordDmg();o.forged=B.forgeLegend("voidreaver");o.dmg=B.swordDmg()-d0;o.legend=B.P.legend;
  B.showMenu("Paused","",[{l:"Close"}]);o.smith=!!Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("Master Smith"));
  B.P.legend="titanmaul";B.spawnMob("goblin",B.hero.x+20,B.hero.y);const m=B.mobs[B.mobs.length-1];m.hp=99;m.iframes=0;B.swordDmg();B.hurtEnemy(m,1,0,false);o.knock=m.knockVx>3;
  B.saveGame();o.saved=JSON.parse(localStorage.getItem(B.SAVEKEY)).P.legends;return o;});
 expect(r.part).toBe(1);expect(r.forged).toBe(true);expect(r.dmg).toBe(4);expect(r.legend).toBe("voidreaver");expect(r.smith).toBe(true);expect(r.knock).toBe(true);expect(r.saved).toContain("voidreaver");});
