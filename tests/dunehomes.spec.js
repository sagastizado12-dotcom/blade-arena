const {test,expect}=require("@playwright/test");
test("Dunerest: 4 desert homes + wilderness cabin appended, buyable, on map, wife can live there; Seeker header",async({page})=>{
 await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(()=>{const B=__BA,o={};B.closeMenu();const D=B.DUNE_HOMES.map(i=>B.buildings[i]);o.n=D.length;o.prices=D.map(b=>B.homePrice(b));o.cabin=D.filter(b=>b.cabin).length;o.tail=JSON.stringify(B.DUNE_HOMES)==="[280,281,282,283,284]"; /* v47: east-continent buildings append after */o.total=B.buildings.length;
  const S=B.SETS[9];o.inTown=D.filter(b=>!b.cabin).every(b=>Math.hypot(b.x+2-S.x,b.y+1-S.y)<S.r);const c=D.find(b=>b.cabin);o.cabOut=Math.hypot(c.x+2-S.x,c.y+1-S.y)>S.r+4;o.solid=!B.isWater(B.getT()[(c.y+4)*B.WW+c.x+2]);
  o.spots=B.homeSpots().filter(h=>B.DUNE_HOMES.includes(h.b.id)).length;B.P.gold=5000;const b=D[0];B.buyHome(b);o.owned=B.owns(b);
  const ad=B.npcs.find(n=>n.alive&&n.s===9&&n.role!=="child"&&n.role!=="leader");ad.sex="F";B.P.wives=[ad.id];B.assignWifeHome(ad,b.id);o.wifeHome=ad.wifeHome===b.id;
  B.dailyTick();const sk=B.seeker();B.talk(sk);o.hdr=document.querySelector("#menu h2,h2").textContent;return o;});
 expect(r.n).toBe(5);expect(r.cabin).toBe(1);expect(new Set(r.prices).size).toBe(5);expect(r.tail).toBe(true);expect(r.total).toBe(505);expect(r.inTown).toBe(true);expect(r.cabOut).toBe(true);expect(r.solid).toBe(true);
 expect(r.spots).toBe(5);expect(r.owned).toBe(true);expect(r.wifeHome).toBe(true);expect(r.hdr).toContain("Seeker");});
