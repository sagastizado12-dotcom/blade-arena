const {test}=require("@playwright/test");
test("v51",async({page})=>{test.setTimeout(90000);await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const go=async(f,file,ms)=>{await page.evaluate(f);await page.waitForTimeout(ms||1400);await page.screenshot({path:"/workspace/shots-blade/"+file});};
 await go(()=>{__BA.closeMenu();__BA.huntsMenu();},"v51-hunts-board.png",500);
 await go(()=>{const B=__BA;B.closeMenu();B.world.min=11*60;B.HUNT().track="ironhide";const L=B.HLEG[0],S=B.SETS[L.s];B.teleport(S.x+L.dx-3,S.y+L.dy+3);B.huntTick();const e=B.mobs.find(m=>m.legendK);e.hp=40;},"v51-legend.png",3500);
 await go(()=>{const B=__BA;B.toggleMap&&B.toggleMap();},"v51-map-lair.png",1000);});
