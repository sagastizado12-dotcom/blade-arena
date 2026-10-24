const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v47b Moderno is gone; conflict caps still hold on the four kingdoms",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(()=>{const B=__BA;B.closeMenu();const o={mod:!!B.SETS[B.MOD_ID],k:B.KINGDOMS.length,ald:B.SETS[0].x,salt:B.SETS[1].x};
  B.world.rebels=[{s:1},{s:2},{s:3},{s:4}];o.full=B.canStartConflict("war",[1]);
  B.world.rebels=[];B.world.wars=[{a:0,b:1,over:false},{a:0,b:2,over:false}];o.fourth=B.canStartConflict("war",[3]);o.same=B.canStartConflict("war",[1]);
  B.world.wars=[];B.world.rebels=[];return o;});
 expect(o.mod).toBe(false);expect(o.k).toBe(4);expect(o.ald).toBe(138);expect(o.salt).toBe(244);
 expect(o.full).toBe(false);expect(o.fourth).toBe(false);expect(o.same).toBe(true);expect(errs).toEqual([]);});
