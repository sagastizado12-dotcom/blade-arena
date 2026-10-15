const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");await page.evaluate(()=>__BA.closeMenu());};
test("kids grow baby→child→teen→adult on the calendar; teens learn spells, work, hunt; never hurt or romanced; houses stay mine",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
  const r=await page.evaluate(()=>{const B=__BA,w=B.world;const mom=B.npcs.find(n=>n.alive&&n.age>=20&&n.s===0&&n.role!=="leader");const k=B.babyFor(mom,null);k.heroKid=true;B.P.kids=[k.id];B.P.homes=[k.home];const homes0=JSON.stringify(B.P.homes);
    const st=[];w.day=56;k.born=w.day;B.familyDay();st.push(B.kidStage(k));k.born=w.day-5*28;B.familyDay();st.push(B.kidStage(k));k.born=w.day-14*28;B.familyDay();st.push(B.kidStage(k));
    const hurt=B.npcHurt(k,5,0);B.teenSpell(k);const spells=(k.spells||[]).length;B.teenJob(k);const g0=B.P.gold;w.day++;B.familyDay();const paid=B.P.gold-g0;
    B.teenHunt(k,true);const hunting=B.P.teenHunt.includes(k.id);
    k.born=w.day-18*28;B.familyDay();st.push(B.kidStage(k));const huntAfter=(B.P.teenHunt||[]).includes(k.id);
    return{st,hurt,spells,paid,hunting,huntAfter,homes:JSON.stringify(B.P.homes)===homes0,role:k.role,kid:k.id};});
  expect(r.st).toEqual(["baby","child","teen","adult"]);expect(r.hurt).toBe(false);expect(r.spells).toBe(1);expect(r.paid).toBeGreaterThan(0);expect(r.hunting).toBe(true);expect(r.huntAfter).toBe(false);expect(r.homes).toBe(true);
  // teen fights alongside me and is never romanceable
  const f=await page.evaluate(()=>{const B=__BA,w=B.world;const mom=B.npcs.find(n=>n.alive&&n.age>=20&&n.s===0&&n.role!=="leader");const t=B.babyFor(mom,null);t.heroKid=true;t.born=w.day-15*28;B.familyDay();B.teenHunt(t,true);
    const e=B.spawnMob("goblin",B.hero.x+20,B.hero.y+10);e._tid=1;e.hp=e.maxHp=50;const hp0=e.hp;B.hero.iframes=9999;return{id:t.id,hp0,prop:B.propose?B.propose(t):"n/a"};});
  await page.waitForTimeout(2500);const hp=await page.evaluate(()=>{const e=__BA.getMobs().find(m=>m._tid);return e?e.hp:-1;});expect(hp).toBeLessThan(f.hp0);expect(String(f.prop)).not.toMatch(/yes|accept/i);
  await page.evaluate(()=>__BA.familyMenu());await expect(page.locator("#menu")).toContainText("teen");expect(errs).toEqual([]);});
