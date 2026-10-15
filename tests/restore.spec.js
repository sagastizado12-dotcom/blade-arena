const {test,expect}=require("@playwright/test");
test("Restore Nethervale: cutscene heals land, demons peaceful, no raids, persists on load",async({page})=>{
 await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const a=await page.evaluate(()=>{const B=__BA;B.closeMenu();const o={};o.before=B.canRestore();B.demonFallG();o.can=B.canRestore();const S=B.SETS[16];let m=0;const T=B.getT();for(let y=S.y-30;y<S.y+30;y++)for(let x=S.x-30;x<S.x+30;x++)if(T[y*B.WW+x]===22)m++;o.mud=m;
  B.showMenu("Paused","",[{l:"Close"}]);o.btn=!!Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("Restore Nethervale"));B.restoreNethervale();return o;});
 expect(a.before).toBe(false);expect(a.can).toBe(true);expect(a.mud).toBeGreaterThan(50);expect(a.btn).toBe(true);
 await page.waitForFunction(()=>__BA.world.restored&&__BA.world.restored.done,null,{timeout:20000});
 const b=await page.evaluate(()=>{const B=__BA;const S=B.SETS[16];let m=0;const T=B.getT();for(let y=S.y-30;y<S.y+30;y++)for(let x=S.x-30;x<S.x+30;x++)if(T[y*B.WW+x]===22)m++;
  const d=B.npcs.filter(n=>n.demon&&n.alive);return {mud:m,peace:d.length>0&&d.every(n=>n.peaceful),raid:B.demonRaid(0),land:B.inDemonLand(),roof:S.roof[0]};});
 expect(b.mud).toBe(0);expect(b.peace).toBe(true);expect(b.raid).toBeNull();expect(b.land).toBe(false);expect(b.roof).not.toBe("#5a1838");
 await page.evaluate(()=>__BA.saveGame());await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");await page.waitForFunction(()=>__BA.state==="play");
 const c=await page.evaluate(()=>{const B=__BA;const S=B.SETS[16];let m=0;const T=B.getT();for(let y=S.y-30;y<S.y+30;y++)for(let x=S.x-30;x<S.x+30;x++)if(T[y*B.WW+x]===22)m++;return {mud:m,done:B.world.restored&&B.world.restored.done};});
 expect(c.done).toBe(true);expect(c.mud).toBe(0);});
