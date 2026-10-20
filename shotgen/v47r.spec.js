const {test}=require("@playwright/test");
test("rocks gone",async({page})=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{__BA.closeMenu();__BA.teleport(660,480);});await page.waitForTimeout(1500);await page.screenshot({path:"/workspace/shots-blade/v47-rocks-fixed.png"});});
