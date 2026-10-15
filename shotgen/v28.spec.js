const {test}=require("@playwright/test");
test("v28",async({page})=>{await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{__BA.closeMenu();__BA.depEnter({x:200,y:72});});await page.waitForFunction(()=>__BA.inDepths());await page.waitForTimeout(800);
 await page.evaluate(()=>{const B=__BA,L=B.getDep();const r=L.rooms[1];B.hero.x=(r.cx)*16;B.hero.y=(r.cy)*16;for(const t of L.traps)t.seen=true;});await page.waitForTimeout(700);await page.screenshot({path:"/workspace/shots-blade/v28-depths.png"});
 await page.evaluate(()=>{const B=__BA,L=B.getDep();B.hero.x=(L.boss.cx-3)*16;B.hero.y=(L.boss.cy+2)*16;B.hero.iframes=9999;});await page.waitForTimeout(700);await page.screenshot({path:"/workspace/shots-blade/v28-boss.png"});});
