const {test}=require("@playwright/test");
test("v29",async({page})=>{await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{const B=__BA;B.closeMenu();B.swd().xp=1000;B.hero.iframes=99999;for(let i=0;i<3;i++){B.spawnMob("goblin",B.hero.x+16+i*12,B.hero.y-12+i*12);const e=B.mobs[B.mobs.length-1];e.hp=e.maxHp=999;}B.hero.dir=2;B.hero.swinging=1;B.hero.swingT=3;});
 await page.waitForTimeout(120);await page.screenshot({path:"/workspace/shots-blade/v29-sword-tactics.png"});
 await page.evaluate(()=>__BA.skillsMenu());await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v29-skills.png"});});
