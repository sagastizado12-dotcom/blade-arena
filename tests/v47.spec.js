const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v47 world x2: 8 countries with capitals/castles, new towns peopled with elders and homes for sale, old saves migrate",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(()=>{const B=__BA,o={};B.closeMenu();o.ww=B.WW;o.k=B.KINGDOMS.length;o.caps=B.KINGDOMS.every(k=>B.SETS[k.cap]&&(k.cap===0||/capital/.test(B.SETS[k.cap].kind)));
  const bl=B.getBuildings();o.newTowns=B.SETS.filter(s=>s.id>=19&&!s.free).map(s=>({n:s.name,lead:B.npcs.some(n=>n.s===s.id&&n.role==="leader"),sale:bl.some(b=>b.s===s.id&&b.kind==="forsale"),own:B.kOf(s.id)}));
  // simulate a pre-v47 save: no east towns/people, tile maps on the old 1024-wide grid
  const home=bl.find(b=>b.s===0&&b.kind==="forsale");B.P.homes=[home.id];const wf=B.npcs.find(n=>n.alive&&n.s===2&&n.role!=="child"&&n.age>=18);wf.spouse=-1;B.P.wives=[wf.id];
  B.saveGame();const k=Object.keys(localStorage).find(k=>{try{return !!JSON.parse(localStorage.getItem(k)).world;}catch(_){return false;}});const s=JSON.parse(localStorage.getItem(k));
  s.world.sets=s.world.sets.slice(0,19);s.npcs=s.npcs.filter(n=>n.s<19);delete s.world.w2;s.world.harvested={[150*1024+140]:{o:4,r:4,until:99999}};s.world.bld=s.world.bld.slice(0,285);localStorage.setItem(k,JSON.stringify(s));
  const md={world:{harvested:{[150*1024+140]:1},trees:{[3*1024+5]:2}}};B.w47Migrate(md);o.harv=Object.keys(md.world.harvested).concat(Object.keys(md.world.trees));B.loadGame();o.sets=B.world.sets.length;o.people=B.npcs.filter(n=>n.s>=19).length;o.home=JSON.stringify(B.P.homes)===JSON.stringify([home.id]);o.wife=B.P.wives[0]===wf.id;o.bld=B.world.bld.length===bl.length;
  B.P.tpv=[0,19,22];B.teleportMenu();o.tp=document.getElementById("menu").innerText;B.closeMenu();return o;});
 console.log(JSON.stringify(o));
 expect(o.ww).toBe(2048);expect(o.k).toBe(8);expect(o.caps).toBe(true);for(const t of o.newTowns){expect(t.lead,t.n).toBe(true);}expect(o.newTowns.filter(t=>t.sale).length).toBeGreaterThanOrEqual(4);
 expect(new Set(o.newTowns.map(t=>t.own)).size).toBe(4);expect(o.sets).toBe(28);expect(o.people).toBeGreaterThan(40);expect(o.harv).toEqual([String(150*2048+140),String(3*2048+5)]);expect(o.home).toBe(true);expect(o.wife).toBe(true);expect(o.bld).toBe(true);
 expect(o.tp).toMatch(/Eastwatch/);expect(o.tp).toMatch(/Castle of Mirewood/);expect(errs).toEqual([]);});
