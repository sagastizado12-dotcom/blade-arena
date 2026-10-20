const {test}=require("@playwright/test");
test("v50",async({page})=>{test.setTimeout(90000);await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const go=async(f,file,ms)=>{await page.evaluate(f);await page.waitForTimeout(ms||1400);await page.screenshot({path:"/workspace/shots-blade/"+file});};
 await go(()=>{const B=__BA;B.closeMenu();B.world.min=11*60;B.P.gold=1e5;B.P.inv.wood=999;B.eRoomStart("hall");const E=B.ESTATE;B.teleport(E.x+12,E.y+10);},"v50-manor-building.png",3000);
 await go(()=>{const B=__BA;for(let i=0;i<3;i++){B.setDay(B.world.day+1);B.eDaily();}for(const k of ["servants","garden","stable","trophy","maproom"])B.eRoomStart(k);for(let i=0;i<3;i++){B.setDay(B.world.day+1);B.eDaily();}B.closeMenu();const E=B.ESTATE;B.teleport(E.x+12,E.y+10);},"v50-manor-built.png",4500);
 await go(()=>{__BA.estateMenu();},"v50-manor-menu.png",500);
 await go(()=>{__BA.missionMenu();},"v50-missions.png",500);});
