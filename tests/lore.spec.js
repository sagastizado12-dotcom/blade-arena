const {test,expect}=require("@playwright/test");
test("lore: 8 tablets in all regions, Lore tab, rumors, map marks, Sanctum boss + choice; Seeker generations",async({page})=>{
 await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(async()=>{const B=__BA,o={};B.closeMenu();const w=n=>new Promise(r=>setTimeout(r,n));B.dailyTick();const sk=B.seeker();o.sk=sk&&{sex:B.sexOf(sk),age:sk.age,rom:B.canRomance(sk)};
  const S=B.loreSites();o.n=S.length;o.regions=S.map(s=>s.r);for(const s of S)o.ok=(o.ok!==false)&&!B.solidTile(s.x,s.y);
  B.teleport(S[0].x,S[0].y);await w(400);o.f1=B.LR().found.length;B.closeMenu();for(const s of S.slice(1))B.findFragment(s.i);B.closeMenu();o.f8=B.LR().found.length;
  B.sanctumClimax();const hk=B.mobs.find(m=>m.hollowKing);o.boss=!!hk;hk.dead=true;B.onKill(hk);await w(600);o.choiceMenu=document.body.innerText.includes("Windstone");B.loreEnd("renew");o.done=B.LR().done;
  // seeker generations: dies, 10 years later new one continues
  const first=B.seeker();first.alive=false;B.seekerYear();o.dead=B.SK().deadDay!=null;B.world.day+=5*28;B.seekerYear();o.none5=!B.seeker();B.world.day+=6*28;B.seekerYear();const s2=B.seeker();o.gen2=s2&&B.SK().gen===2;o.keep=B.LR().found.length;
  return o;});
 expect(r.sk.sex).toBe("F");expect(r.sk.age).toBeGreaterThanOrEqual(18);expect(r.sk.rom).toBe(true);expect(r.n).toBe(8);expect(r.regions).toContain("Nethervale");expect(r.ok).toBe(true);
 expect(r.f1).toBe(1);expect(r.f8).toBe(8);expect(r.boss).toBe(true);expect(r.choiceMenu).toBe(true);expect(r.done).toBe(true);expect(r.dead).toBe(true);expect(r.none5).toBe(true);expect(r.gen2).toBe(true);expect(r.keep).toBe(8);
 await page.evaluate(()=>{__BA.closeMenu();__BA.loreMenu();});await expect(page.locator("text=Lore of the Ten Winds").first()).toBeVisible();});
