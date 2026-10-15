const {test}=require("@playwright/test");
test("v30",async({page})=>{await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{const B=__BA;B.closeMenu();B.demonFallG();const S=B.SETS[16];B.teleport(S.x,S.y+3);B.hero.iframes=1e6;for(const m of B.mobs)m.dead=true;});await page.waitForTimeout(1500);
 await page.screenshot({path:"/workspace/shots-blade/v30-nethervale-before.png"});
 await page.evaluate(()=>__BA.restoreNethervale());await page.waitForTimeout(1200);await page.screenshot({path:"/workspace/shots-blade/v30-renewal-wave.png"});
 await page.waitForFunction(()=>__BA.world.restored.done,null,{timeout:20000});await page.waitForTimeout(1500);await page.screenshot({path:"/workspace/shots-blade/v30-nethervale-after.png"});});
