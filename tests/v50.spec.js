const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v50 manor plot is off the restored map and does not paint tiles",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(()=>{const B=__BA;B.closeMenu();const E=B.ESTATE;B.P.gold=1e5;B.P.inv.wood=999;
  return {off:E.x+E.w>=B.WW,start:B.eRoomStart("hall"),built:B.roomBuilt("hall"),mod:!!B.SETS.find(s=>s.name==="Moderno")};});
 expect(o.off).toBe(true);expect(o.start).toBe(false);expect(o.built).toBe(false);expect(o.mod).toBe(false);expect(errs).toEqual([]);});
