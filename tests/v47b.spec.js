const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v47b Moderno: 3x city, free (no country), farmland, Lord menu tiers with construction, sieges + conflict caps, teleport",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(async()=>{const B=__BA,o={},w=t=>new Promise(r=>setTimeout(r,t));B.closeMenu();const S=B.SETS[B.MOD_ID];const cap=B.SETS[10];
  o.name=S.name;o.area=(S.r*S.r)/(cap.r*cap.r);o.free=B.kOf(S.id);o.bld=B.getBuildings().filter(b=>b.s===S.id).length;o.capBld=B.getBuildings().filter(b=>b.s===10).length;
  o.fields=B.MODF.fields.length;o.orch=B.MODF.orchards.length;o.past=B.MODF.pastures.length;o.farmers=B.npcs.filter(n=>n.s===S.id).length;
  const M=B.MODS();o.lead=B.npcs.some(n=>n.s===S.id&&n.role==="leader");
  // walls closed (gates only), streets dirt at tier 0
  o.road0=B.tAt(S.x+3,S.y)===7;
  // upgrade with gold+wood, takes days, then visibly changes
  B.P.gold=1e5;B.P.inv.wood=999;o.start=B.modStart("walls");o.q=M.q.length;o.again=B.modStart("walls");const d0=B.world.day;
  B.modStart("streets");B.modStart("bld:market");for(let i=0;i<8;i++){B.setDay(B.world.day+1);B.modDaily();}
  o.walls=M.walls;o.streets=M.streets;o.market=M.bld.market;o.cob=B.tAt(S.x+3,S.y)===12;
  for(let t=0;t<3;t++){B.P.inv.wood=999;B.modStart("walls");B.modStart("streets");for(let i=0;i<12;i++){B.setDay(B.world.day+1);B.modDaily();}}
  o.wallsMax=M.walls;o.streetsMax=M.streets;o.towers=B.getTOWERS().filter(t=>t.mod).length;o.def=B.modDefense();
  // Lord menu
  B.lordMenu();await w(60);o.menu=document.getElementById("menu").innerText;B.closeMenu();
  // siege by a country; counts as a conflict
  M.siege=null;o.dec=B.modDeclare(1,true);o.conf=B.conflicts().length;o.siege=!!M.siege;o.raid=!!B.world.sets[S.id].raid;
  // cap: with 4 conflicts no new war; with 3 countries at war a 4th country can't join
  B.world.rebels=[{s:2},{s:3},{s:4}];o.capOK=B.canStartConflict("war",[2]);B.world.rebels=[];B.world.wars=[{a:2,b:4}];o.three=B.canStartConflict("war",[5]);o.threeOk=B.canStartConflict("war",[2]);B.world.wars=[];
  // resolve siege: homes untouched
  const homes=JSON.stringify(B.P.homes||[]);M.siege.until=B.world.day;B.modDaily();o.over=!M.siege;o.homes=JSON.stringify(B.P.homes||[])===homes;
  // teleport picker + map label + paused button
  B.teleportMenu();await w(60);o.tp=[...document.querySelectorAll("#menu button")].map(b=>b.textContent).filter(t=>/Moderno/.test(t));B.closeMenu();
  B.hero.x=S.x*16;B.hero.y=(S.y+S.r+12)*16;o.info=B.mapInfo().kingdom;
  return o;});
 console.log(JSON.stringify(o).slice(0,1500));
 expect(o.name).toBe("Moderno");expect(o.area).toBeGreaterThanOrEqual(2.9);expect(o.free).toBe(-1);expect(o.bld).toBeGreaterThan(o.capBld*2);
 expect(o.fields).toBeGreaterThanOrEqual(6);expect(o.orch).toBeGreaterThanOrEqual(1);expect(o.past).toBeGreaterThanOrEqual(1);expect(o.lead).toBe(true);expect(o.road0).toBe(true);
 expect(o.start).toBe(true);expect(o.again).toBe(false);expect(o.walls).toBe(1);expect(o.streets).toBe(1);expect(o.market).toBe(1);expect(o.cob).toBe(true);
 expect(o.wallsMax).toBe(3);expect(o.streetsMax).toBe(2);expect(o.towers).toBeGreaterThan(0);expect(o.def).toBeGreaterThan(5);
 expect(o.menu).toMatch(/Lord of Moderno/);expect(o.menu).toMatch(/Treasury/);
 expect(o.dec).toBe(true);expect(o.siege).toBe(true);expect(o.raid).toBe(true);expect(o.conf).toBeGreaterThanOrEqual(1);
 expect(o.capOK).toBe(false);expect(o.three).toBe(false);expect(o.threeOk).toBe(true);expect(o.over).toBe(true);expect(o.homes).toBe(true);
 expect(o.tp.length).toBeGreaterThanOrEqual(1);expect(o.info).toMatch(/Moderno/);expect(errs).toEqual([]);});
