const {test}=require("@playwright/test");
test("v32",async({page})=>{await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>{window.__FAST=true;window.__TAME_SURE=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{const B=__BA;B.closeMenu();B.hero.y+=60;for(const sp of ["wolfman","manebeast"]){B.spawnMob(sp,B.hero.x+30,B.hero.y);B.tryTame(B.mobs[B.mobs.length-1]);}B.closeMenu();B.hero.iframes=1e6;});
 await page.waitForTimeout(900);await page.screenshot({path:"/workspace/shots-blade/v32-pet-mount.png"});
 await page.evaluate(()=>__BA.petsMenu());await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v32-pets-menu.png"});});
