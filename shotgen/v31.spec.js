const {test}=require("@playwright/test");
test("v31",async({page})=>{await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{const B=__BA;B.closeMenu();Object.assign(B.P.inv,{emberheart:1,dscale:1,tidepearl:1,stormfang:2,core:1,voidshard:1});B.P.gold=600;B.forgeLegend("stormbrand");B.smithMenu();});
 await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v31-master-smith.png"});});
