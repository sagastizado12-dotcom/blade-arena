const {test}=require("@playwright/test");
test("v43 hud",async({page})=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{__BA.closeMenu();__BA.world.day=6*365+109;__BA.world.weather="clear";__BA.updateHud();});await page.waitForTimeout(800);await page.screenshot({path:"/workspace/shots-blade/v43-hud-date.png"});
 await page.evaluate(()=>{__BA.world.day=1989*365+252;__BA.updateHud();});await page.waitForTimeout(500);await page.locator("#clock").screenshot({path:"/workspace/shots-blade/v43-hud-date-long.png"});});
