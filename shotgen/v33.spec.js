const {test}=require("@playwright/test");
test("v33",async({page})=>{await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 await page.evaluate(()=>{const B=__BA;B.closeMenu();const ad=B.npcs.filter(n=>n.alive&&n.role!=="child"&&n.role!=="leader"&&n.s===0&&!n.adv);const w=ad.find(n=>B.sexOf(n)==="F");ad.splice(ad.indexOf(w),1);B.P.wives=[w.id];for(let i=1;i<7;i++){ad[i].age=90;B.passAway(ad[i],true);}w.age=95;B.passAway(w,true);
  const S=B.SETS[0],c=B.cemOf(S);B.teleport(c.x+3,c.y+3);});
 await page.waitForTimeout(800);await page.screenshot({path:"/workspace/shots-blade/v33-cemetery.png"});
 await page.evaluate(()=>__BA.familyMenu());await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v33-in-memory.png"});
 await page.evaluate(()=>{const B=__BA;B.closeMenu();const n=B.npcs.find(x=>x.alive&&x.role!=="child"&&x.role!=="leader"&&x.role!=="guard"&&x.s===0&&!x.adv);B.world.day=101*28;B.talk(n);});await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v33-talk-age.png"});
 await page.evaluate(()=>{const B=__BA;B.closeMenu();B.world.sets[2].raid={until:1e9,n:3};B.hourlyTick();B.toggleMap();});await page.waitForTimeout(600);await page.screenshot({path:"/workspace/shots-blade/v33-summons-map.png"});});
