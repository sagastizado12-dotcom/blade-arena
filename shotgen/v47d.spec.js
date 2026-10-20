const {test}=require("@playwright/test");
const T=process.env.TAG||"before";
test("moderno wall "+T,async({page})=>{test.setTimeout(90000);await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const go=async(f,file,ms)=>{await page.evaluate(f);await page.waitForTimeout(ms||1500);await page.screenshot({path:"/workspace/shots-blade/"+file});};
 await go(()=>{const B=__BA;B.closeMenu();B.setDay(200);B.world.min=11*60;B.world.weather="clear";const M=B.MODS();M.siege=null;B.world.sets[B.MOD_ID].raid=null;M.peaceUntil=1e9;const s=B.SETS[B.MOD_ID];B.teleport(s.x+33,s.y+33);},`moderno-${T}-corner.png`);
 await go(()=>{const B=__BA;const s=B.SETS[B.MOD_ID];B.teleport(s.x+1,s.y+B.wallR(s)+3);},`moderno-${T}-gate.png`);
 await go(()=>{const B=__BA;B.toggleMap();const M=B.getMapM();M.z=3;M.cx=B.SETS[B.MOD_ID].x;M.cy=B.SETS[B.MOD_ID].y;B.drawFullMap();},`moderno-${T}-map.png`,800);});
