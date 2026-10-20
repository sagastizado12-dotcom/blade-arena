const {test}=require("@playwright/test");
test("v49",async({page})=>{test.setTimeout(90000);await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const go=async(f,file,ms)=>{await page.evaluate(f);await page.waitForTimeout(ms||1400);await page.screenshot({path:"/workspace/shots-blade/"+file});};
 await go(()=>{const B=__BA;B.closeMenu();const W=B.W49();W.cq=[];const w=B.startWar(4,7,"a border dispute");W.cq=[];w.p=0.3;const t=B.SETS.find(s=>B.kOf(s.id)===2&&!B.KINGDOMS.some(k=>k.cap===s.id)&&!s.island);B.startRebellion(t,"high taxes");const t2=B.SETS.find(s=>B.kOf(s.id)===1&&!B.KINGDOMS.some(k=>k.cap===s.id)&&!s.island);const r=B.startRebellion(t2,"x");B.resolveRebellion(r,true);W.cq=[];B.world.min=11*60;const f=B.frontOf(w);B.teleport(f.x,f.y+2);},"v49-front.png");
 await go(()=>{const B=__BA;B.toggleMap();B.getMapM().z=0;B.drawFullMap();},"v49-map-fronts.png",800);
 await go(()=>{const B=__BA;B.toggleMap();B.conflictsMenu();},"v49-wars-menu.png",500);
 await go(()=>{const B=__BA;B.closeMenu();B.warMenu(B.W49().wars.find(w=>!w.over));},"v49-war-menu.png",500);
 await go(()=>{const B=__BA;B.closeMenu();const W=B.W49();const s=B.SETS.find(s=>B.kOf(s.id)===5&&!B.KINGDOMS.some(k=>k.cap===s.id)&&!s.island);W.cq=[];B.startRebellion(s,"anger over the war");},"v49-alert.png",1500);});
