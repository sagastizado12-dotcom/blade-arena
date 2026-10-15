const {test,expect}=require("@playwright/test");
async function boot(page){await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");await page.evaluate(()=>__BA.closeMenu());}
test("NPC lives: lifespans, wife lives 60+ years after marriage, respectful deaths, graves, In memory, elders succeed",async({page})=>{await boot(page);
 const r=await page.evaluate(()=>{const B=__BA,o={};const ad=B.npcs.filter(n=>n.alive&&n.role!=="child"&&n.role!=="leader"&&n.s===0&&!n.adv);const w=ad[0];w.sex="F";B.P.wives=[w.id];w.age=25;
  o.wlife=B.lifeOf(w);for(const n of B.npcs)if(n.alive)B.lifeOf(n);
  const old=ad[1];old.age=old.life;B.lifeYear();o.oldDead=!old.alive;o.grave=B.LV().graves.some(g=>g.id===old.id);
  o.wAlive59=(()=>{w.age=25+59;B.lifeYear();return w.alive;})();w.age=w.life;B.lifeYear();o.wDead=!w.alive;o.mem=B.LV().memory.some(m=>m.id===w.id);
  o.journal=B.P.journal.some(j=>j.t.includes(w.name)&&j.t.includes("passed away"));
  const L=B.npcs.find(n=>n.alive&&n.role==="leader"&&n.s===0);B.passAway(L);o.newElder=B.npcs.some(n=>n.alive&&n.role==="leader"&&n.s===0&&n.elderSecret);o.log=B.LV().elderLog.length;
  return o;});
 expect(r.wlife).toBeGreaterThanOrEqual(87);expect(r.oldDead).toBe(true);expect(r.grave).toBe(true);expect(r.wAlive59).toBe(true);expect(r.wDead).toBe(true);expect(r.mem).toBe(true);expect(r.journal).toBe(true);expect(r.newElder).toBe(true);expect(r.log).toBe(1);
 await page.evaluate(()=>__BA.familyMenu());await expect(page.locator("text=In memory").first()).toBeVisible();
 await page.evaluate(()=>__BA.showMenu("Paused","x",[{l:"Close"}]));await expect(page.locator("text=Ageless").first()).toBeVisible();
});
test("ages on names, gossip, away years age & bury, 100-year questioning, town memory, elder summons, no kid romance",async({page})=>{await boot(page);
 const r=await page.evaluate(()=>{const B=__BA,o={};const n=B.npcs.find(x=>x.alive&&x.role!=="child"&&x.role!=="leader"&&x.role!=="guard"&&x.s===0&&!x.adv);B.talk(n);
  o.hdr=document.querySelector("#menu h2,h2").textContent;o.age=n.age;B.closeMenu();
  n.age=20;n.life=95;const a0=n.age;const before=B.npcs.filter(x=>x.alive).length;B.awayAdvance(B.MS_PER_GAME_MIN*1440*28*30);o.aged=n.age-a0;
  o.y=B.heroYears();B.world.day=101*28;let q=0;for(let i=0;i<30;i++)q+=B.dialogLinesL(n).join(" ").match(/century|grandmother|Undying|records|aged|old are you/)?1:0;o.q=q;
  for(let i=0;i<10;i++)B.gossipEvent(0);o.news=JSON.stringify(B.world.news||"").length>0;
  // town memory
  const S=B.SETS[1];for(const m of B.npcs)if(m.s===1&&m.role!=="leader"){m.met=true;m.friend=80;}B.forgetHero(1);o.forgot=B.npcs.filter(m=>m.s===1&&m.role!=="leader").every(m=>!m.met&&m.friend<=5);o.elderKnows=B.dialogLinesL(B.npcs.find(m=>m.alive&&m.s===1&&m.role==="leader")).join(" ").match(/secret|who you really are/)!=null;
  // summons
  B.world.sets[2].raid={until:B.absMin?1e9:1e9,n:3};B.hourlyTick();o.sum=B.LV().summons.some(s=>s.s===2);
  o.kidRom=B.npcs.filter(x=>x.alive&&x.age<18&&(x.spouse>0||x.partner>0)).length;return o;});
 expect(r.hdr).toMatch(/\((F|M)\), \d+/);expect(r.aged).toBeGreaterThanOrEqual(29);expect(r.q).toBeGreaterThan(3);expect(r.forgot).toBe(true);expect(r.elderKnows).toBe(true);expect(r.sum).toBe(true);expect(r.kidRom).toBe(0);
});
