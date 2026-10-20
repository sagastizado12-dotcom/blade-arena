const {test}=require("@playwright/test");
test("v52",async({page})=>{test.setTimeout(90000);await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{const B=__BA;B.closeMenu();B.world.min=11*60;B.P.mag.known=Object.keys(B.SPELLS);B.forceUnlock();const S=B.SETS[0];B.teleport(S.x+40,S.y+40);B.mobs.length=0;for(let i=0;i<5;i++){const e=B.spawnMob("goblin",B.hero.x+40+i*12,B.hero.y+(i%2)*14);e.hp=e.maxHp=500;}B.P.mag.mp=999;B.clearCD();B.castSpell("fireball");B.clearCD();B.castSpell("air");});
 await page.waitForTimeout(350);await page.screenshot({path:"/workspace/shots-blade/v52-combo-firestorm.png"});
 await page.evaluate(()=>{const B=__BA;B.P.mag.mp=999;B.ageLastCast(9999);B.clearCD();B.castSpell("frost");B.clearCD();B.castSpell("thunder");});await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v52-combo-shatter.png"});
 await page.evaluate(()=>{__BA.spellbookMenu();});await page.waitForTimeout(400);await page.screenshot({path:"/workspace/shots-blade/v52-spellbook.png"});
 await page.evaluate(()=>{__BA.combosMenu();});await page.waitForTimeout(400);await page.screenshot({path:"/workspace/shots-blade/v52-combo-list.png"});});
