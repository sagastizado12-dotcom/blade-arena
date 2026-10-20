const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");await page.evaluate(()=>__BA.closeMenu());};
test("calendar schedules eclipse (Summer 7), harvest (Autumn 4), and events are announced",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
  const r=await page.evaluate(()=>{const B=__BA,w=B.world;const W=B.WEV();for(const k of Object.keys(W))delete W[k];w.day=170;B.dailyTick();w.day=171;B.dailyTick();const ecl=!!B.WEV().eclipse;w.day=265;B.dailyTick();const har=!!B.WEV().harvest;
    const news=document.getElementById("toasts").innerText;return{ecl,har,news,fest:B.SETS.filter(s=>!s.demon).every(s=>w.sets[s.id].festival>0)};});
  expect(r.ecl).toBe(true);expect(r.har).toBe(true);expect(r.fest).toBe(true);expect(r.news).toContain("Town crier");expect(errs).toEqual([]);});
test("eclipse makes demons stronger; festival games pay out; plague cure gives fame; dragon circles until slain; markers on map",async({page})=>{await boot(page);
  const r=await page.evaluate(()=>{const B=__BA;const W=B.WEV();for(const k of Object.keys(W))delete W[k];const hx=B.hero.x+300,hy=B.hero.y;
    const a=B.spawnMob("demon",hx,hy);const base=a.maxHp;a.dead=true;B.wevStart("eclipse");const b=B.spawnMob("demon",hx,hy);const boosted=b.maxHp>base&&b.eclipse;b.dead=true;
    B.wevStart("plague",0);B.P.inv.potion=3;const f0=B.P.fame||0;const cured=B.curePlague("potions");const fame=(B.P.fame||0)-f0;
    B.wevStart("dragon",1);const circ=!!B.world.sets[1].dragon&&B.world.sets[1].dragon.circling;B.world.sets[1].dragon.until;
    B.wevStart("plague",2);B.wevStart("harvest");B.toggleMap();B.getMapM().z=1;B.drawFullMap();const marks=window.__wevMarks.slice();B.toggleMap();
    B.world.sets[1].dragon=null;B.hourlyTick();const slain=!B.WEV().dragon;return{boosted,cured,fame,circ,marks,slain};});
  expect(r.boosted).toBe(true);expect(r.cured).toBe(true);expect(r.fame).toBe(15);expect(r.circ).toBe(true);expect(r.slain).toBe(true);
  for(const m of ["🎪","🐉","☣"])expect(r.marks).toContain(m);expect(r.marks.some(m=>m.includes("ECLIPSE"))).toBe(true);
  // festival games in Aldmoor
  await page.evaluate(()=>{__BA.festivalGames();});await expect(page.locator("#menu")).toContainText("Harvest Games");await page.click("#menu button:has-text('Apple bobbing')");await expect(page.locator("#menu")).toContainText(/apple|Splash/i);});
