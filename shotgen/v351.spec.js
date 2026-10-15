const {test}=require("@playwright/test");
test("v35.1",async({page})=>{await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{const B=__BA;B.closeMenu();B.P.gold=2000;const b=B.buildings[B.DUNE_HOMES[1]];B.buyHome(B.buildings[B.DUNE_HOMES[1]]);B.closeMenu();B.teleport(b.x+1,b.y+5);});await page.waitForTimeout(800);
 await page.screenshot({path:"/workspace/shots-blade/v35.1-dunerest-street.png"});
 await page.evaluate(()=>{__BA.toggleMap();});await page.waitForTimeout(300);for(let i=0;i<2;i++){await page.evaluate(()=>__BA.mapZoom(1));await page.waitForTimeout(150);}await page.evaluate(()=>__BA.mapCenterMe());await page.waitForTimeout(500);
 await page.screenshot({path:"/workspace/shots-blade/v35.1-dunerest-homes.png"});});
