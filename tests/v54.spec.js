const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v54 manor: enterable through its door, rooms, wives move in via talk, bedrooms, night routine sleeps in her bed, teleport + map, away meal, persists",async({page})=>{test.setTimeout(120000);const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(async()=>{const B=__BA,o={},w=t=>new Promise(r=>setTimeout(r,t));B.closeMenu();
  const ad=B.npcs.filter(n=>n.alive&&n.role!=="child"&&n.age>=20&&n.age<50&&!n.adv&&n.s===0&&B.sexOf(n)==="F");const wife=ad[0],w2=ad[1];B.P.wives=[wife.id,w2.id];wife.spouse=-1;w2.spouse=-1;
  const kid=B.npcs.find(n=>n.alive&&n.role==="child"&&n.s===0);kid.parents=[wife.id,-1];kid.age=8;
  B.talk(wife);await w(60);o.noHallBtn=[...document.querySelectorAll("#menu button")].some(b=>/Manor/.test(b.textContent));B.closeMenu();
  B.P.gold=1e5;B.P.inv.wood=999;B.eRoomStart("hall");for(let i=0;i<3;i++){B.setDay(B.world.day+1);B.eDaily();}
  B.talk(wife);await w(60);const mb=[...document.querySelectorAll("#menu button")].find(b=>/Move into the Manor/.test(b.textContent));o.btn=!!mb;mb&&mb.click();await w(30);B.closeMenu();o.inW=wife.manor;o.kidIn=kid.manor;o.bed=B.MAN().res[wife.id];
  B.moveIn(w2);o.bed2=B.MAN().res[w2.id];B.assignBed(w2,3);o.bed2b=B.MAN().res[w2.id];
  // night: walk/snap home, sleep in assigned bedroom
  B.world.min=23*60;const d=B.manorDoor();B.hero.x=d.x-6;B.hero.y=d.y+30;for(let i=0;i<600&&!(wife.inside&&wife.at==="manor");i++)B.update();o.home=wife.inside&&wife.at==="manor";
  return o;});
 // walk into the door with the keyboard
 await page.keyboard.down("ArrowUp");await page.waitForFunction(()=>__BA.getRoom()&&__BA.getRoom().kind==="manor",null,{timeout:8000}).catch(()=>{});await page.keyboard.up("ArrowUp");await page.waitForTimeout(400);
 const p=await page.evaluate(async()=>{const B=__BA,o={},w=t=>new Promise(r=>setTimeout(r,t));const R=B.getRoom();o.room=R&&R.kind;o.beds=R?R.F.filter(f=>f.type==="bed").length:0;o.heads=R?R.F.some(f=>f.act==="trophy"):false;o.dine=R?R.F.some(f=>f.act==="dine"):false;
  const L=B.roomNpcs();const wife=B.wifeRes()[0];const me=L.find(r=>r.n===wife);o.pose=me&&me.pose;o.bedX=me&&me.x/16;o.kidSleep=L.some(r=>r.n.role==="child"&&r.pose==="sleep");
  B.closeMenu();B.teleportMenu();await w(50);o.tp=[...document.querySelectorAll("#menu button")].some(b=>/Your manor/.test(b.textContent));B.closeMenu();
  o.meal=B.awayMeals(12);B.saveGame();return o;});
 console.log(JSON.stringify({o,p}));
 expect(o.noHallBtn).toBe(false);expect(o.btn).toBe(true);expect(o.inW).toBe(true);expect(o.kidIn).toBe(true);expect(o.bed).toBe(0);expect(o.bed2).toBe(1);expect(o.bed2b).toBe(3);expect(o.home).toBe(true);
 expect(p.room).toBe("manor");expect(p.beds).toBeGreaterThanOrEqual(8);expect(p.heads).toBe(true);expect(p.dine).toBe(true);expect(p.pose).toBe("sleep");expect(p.bedX).toBe(2);expect(p.kidSleep).toBe(true);expect(p.tp).toBe(true);expect(p.meal).toMatch(/at the manor\.$/);
 await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");await page.waitForFunction(()=>__BA.state==="play");
 expect(await page.evaluate(()=>__BA.wifeRes().length)).toBe(2);expect(errs).toEqual([]);});
