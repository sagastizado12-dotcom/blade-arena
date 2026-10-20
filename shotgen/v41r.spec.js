const {test}=require("@playwright/test");
test("v41 river map",async({page})=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{const B=__BA;B.closeMenu();B.teleport(201,318);B.toggleMap();B.getMapM().z=0;B.mapZoom(3);B.mapCenterMe();});await page.waitForTimeout(600);
 await page.screenshot({path:process.env.SHOT||"/tmp/river.png"});});
