const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v49 wars & rebellions: fronts move, capture changes flag/owner, peace/truce/alliance, rebels win (free or join) or crown wins, caps, persists",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(async()=>{const B=__BA,o={},w=t=>new Promise(r=>setTimeout(r,t));B.closeMenu();const W=B.W49();W.wars=[];W.rebels=[];W.treaties=[];W.cq=[];
  const war=B.startWar(0,1,"test");o.war=!!war;o.dup=B.startWar(1,0);o.front=B.frontOf(war);
  // capture: a non-capital town of Varnhold flips to Aldmoria
  const t1=B.townsOf(1).filter(s=>!B.KINGDOMS.some(k=>k.cap===s.id));const before=t1.length;const S=B.capture(war,0,1);o.cap=S&&B.kOf(S.id);o.after=B.townsOf(1).length;o.before=before;
  // front moves over days
  o.dbg=JSON.stringify(B.conflicts())+B.countriesAtWar().size;const w2=B.startWar(0,2,"t");const p0=w2&&w2.p;for(let i=0;i<5;i++)B.wars49Daily();o.moved=w2&&(w2.over||w2.p!==p0);
  // caps: wars among 0,1,2 already use 3 countries, so a war that adds Nethervale is blocked
  o.countries=B.countriesAtWar().size;o.blocked=!B.startWar(2,3);
  B.endWar(war,"alliance");if(w2)B.endWar(w2,"truce");o.treaties=W.treaties.map(t=>t.kind).sort().join(",");o.noWarAllied=!B.startWar(0,1);
  // rebellions
  const town=B.SETS.find(s=>!s.island&&s.id!==B.MOD_ID&&B.kOf(s.id)===1&&!B.KINGDOMS.some(k=>k.cap===s.id));const r=B.startRebellion(town,"test");o.reb=!!r;
  o.crown=B.resolveRebellion(r,false);o.still=B.kOf(town.id);
  const r2=B.startRebellion(town,"again");o.rebWin=B.resolveRebellion(r2,true);o.newOwner=B.kOf(town.id);o.freeFlag=!!B.SETS[town.id].freeTown;
  // cap of 4 total
  W.rebels=[];W.wars=[];for(const s of B.SETS.filter(s=>!s.island&&s.id!==B.MOD_ID&&!B.KINGDOMS.some(k=>k.cap===s.id)).slice(0,8)){B.W49();B.startRebellion(s,"x");}o.total=B.conflicts().length;
  // persistence
  B.saveGame();o.owner=JSON.stringify(W.owner);
  B.conflictsMenu();await w(60);o.menu=document.getElementById("menu").innerText;B.closeMenu();return o;});
 console.log(JSON.stringify(o).slice(0,1500));
 expect(o.war).toBe(true);expect(o.dup).toBe(false);expect(o.cap).toBe(0);expect(o.moved).toBe(true);expect(o.countries).toBe(3);expect(o.blocked).toBe(true);
 expect(o.treaties).toBe("alliance,truce");expect(o.noWarAllied).toBe(true);expect(o.reb).toBe(true);expect(o.crown).toBe("crown");expect(o.still).toBe(1);
 expect(["free","join"]).toContain(o.rebWin);expect(o.newOwner).not.toBe(1);expect(o.total).toBeLessThanOrEqual(4);expect(o.menu).toMatch(/Wars & Rebellions/);
 await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");await page.waitForTimeout(1500);
 const o2=await page.evaluate(()=>({owner:JSON.stringify(__BA.W49().owner)}));expect(o2.owner).toBe(o.owner);expect(errs).toEqual([]);});
