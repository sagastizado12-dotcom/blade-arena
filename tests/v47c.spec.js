const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v47c Moderno wall and territory are not on the restored map",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(()=>{const B=__BA;B.closeMenu();const S=B.SETS.find(s=>s.id===B.MOD_ID||s.name==="Moderno");
  const walls=(typeof B.WALLS==="function"?B.WALLS():B.getWALLS()).filter(w=>w.s===B.MOD_ID);
  return {gone:!S,walls:walls.length,sets:B.SETS.length,iron:B.SETS[11].x};});
 expect(o.gone).toBe(true);expect(o.walls).toBe(0);expect(o.sets).toBe(19);expect(o.iron).toBe(892);expect(errs).toEqual([]);});
