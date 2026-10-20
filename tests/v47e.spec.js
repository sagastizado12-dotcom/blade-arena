const {test,expect}=require("@playwright/test");
test("autosave every 30s (idle, no overlap) + save on hide",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await page.clock.install();
 await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.clock.runFor(100);await page.waitForFunction(()=>window.__READY,null,{timeout:60000}).catch(()=>{});
 await page.clock.resume();await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const a=await page.evaluate(()=>{const B=__BA;B.closeMenu();localStorage.removeItem("bladeSave_probe");const n0=B.autoSaves();B.P.gold=4321;return n0;});
 await page.clock.fastForward(31000);await page.waitForTimeout(2500);
 const b=await page.evaluate(()=>({n:__BA.autoSaves(),saving:__BA.isSaving(),pip:!!document.getElementById("savedPip"),gold:Object.keys(localStorage).some(k=>(localStorage.getItem(k)||"").includes("4321"))}));
 const c=await page.evaluate(()=>{__BA.P.gold=9876;window.dispatchEvent(new Event("pagehide"));return Object.keys(localStorage).some(k=>(localStorage.getItem(k)||"").includes("9876"));});
 console.log(JSON.stringify({a,b,c}));expect(b.n).toBeGreaterThan(a);expect(b.saving).toBe(false);expect(b.pip).toBe(true);expect(b.gold).toBe(true);expect(c).toBe(true);expect(errs).toEqual([]);});
