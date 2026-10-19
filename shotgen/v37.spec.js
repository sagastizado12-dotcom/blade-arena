const {test}=require("@playwright/test");
test("v37 shots",async({page})=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{__BA.closeMenu();__BA.P.lv=20;__BA.unlockSpells&&__BA.unlockSpells();__BA.assignSlot(1,"meteor");__BA.spellbookMenu();});await page.waitForTimeout(400);await page.screenshot({path:"/workspace/shots-blade/v37-spellbook.png"});
 await page.evaluate(()=>{__BA.closeMenu();const n=__BA.npcs.find(n=>n.alive&&n.role!=="child"&&n.role!=="leader"&&!n.adv);__BA.talk(n);});await page.waitForSelector("#menu .saybox input");
 await page.fill("#menu .saybox input","where is the inn?");await page.press("#menu .saybox input","Enter");await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v37-saytalk.png"});
 await page.evaluate(()=>{__BA.closeMenu();__BA.world.weather="clear";});await page.waitForTimeout(2500);await page.screenshot({path:"/workspace/shots-blade/v37-routines.png"});
 await page.evaluate(()=>__BA.toast(__BA.dayName()));await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v37-hud.png"});});
