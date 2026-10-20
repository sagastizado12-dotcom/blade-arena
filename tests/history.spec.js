const {test,expect}=require("@playwright/test");
test("history library eras with legend distortion; statues raised, defaced, restored; plaques; bards",async({page})=>{
 await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(()=>{const B=__BA,o={};B.closeMenu();B.addNews(0,"A brave wanderer drove off the raiders at Aldmoor! +40g");B.world.day=90*365;B.addNews(0,"The wanderer slew a dragon near Aldmoor.");
  const b0=B.historyBook(0);o.old=b0.lines.join(" ");const b3=B.historyBook(3);o.recent=b3.lines.join(" ");
  B.P.fame=200;B.statueTick();o.statue=!!B.ST()[0];B.world.sets[0].bounty=5;B.statueTick();o.dmg=B.ST()[0].dmg;B.world.sets[0].bounty=0;B.statueTick();o.fixed=!B.ST()[0].dmg&&!!B.ST()[0].rebuilt;o.plaque=B.plaqueText(0);
  B.showMenu("Paused","",[{l:"Close"}]);o.lib=!!Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("Library"));return o;});
 expect(r.old).toMatch(/Undying|Silver|Knight/);expect(r.old).toMatch(/gold crowns/);expect(r.recent.toLowerCase()).toContain("the wanderer");expect(r.statue).toBe(true);expect(r.dmg).toBe(true);expect(r.fixed).toBe(true);expect(r.plaque).toMatch(/Raised in Year/);expect(r.lib).toBe(true);
 await page.locator("button:has-text('Library')").first().click();await expect(page.locator("text=Royal Library").first()).toBeVisible();
 const bard=await page.evaluate(async()=>{const B=__BA;B.closeMenu();const p=B.statuePos(B.SETS[0]);B.hero.x=p.x+30;B.hero.y=p.y+30;await new Promise(r=>setTimeout(r,500));return window.__bard>0;});expect(bard).toBe(true);});
