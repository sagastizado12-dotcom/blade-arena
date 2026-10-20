const {test}=require("@playwright/test");
test("v41 spell shots",async({page})=>{test.setTimeout(120000);await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{const B=__BA;B.closeMenu();B.world.min=11*60;B.world.weather="clear";B.P.lv=20;B.swd().xp=1e6;B.unlockSpells();B.teleport(B.SETS[0].x+30,B.SETS[0].y+24);});
 for(const [k,t] of [["frost",250],["quake",700],["meteor",450],["blade",250],["blackhole",1600]]){
  await page.evaluate(k=>{const B=__BA;B.closeMenu();B.getMobs().length=0;B.hero.dir=2;for(let i=0;i<3;i++){B.spawnMob("wolfman",B.hero.x+70+i*22,B.hero.y-20+i*20);const e=B.mobs[B.mobs.length-1];e.hp=e.maxHp=500;}B.P.mag.mp=999;B.SPCD[k]=0;B.assignSlot(0,k);B.castSpell("fireball");},k);
  await page.waitForTimeout(t);await page.screenshot({path:`/workspace/shots-blade/v41-spell-${k}.png`});await page.waitForTimeout(1500);}});
