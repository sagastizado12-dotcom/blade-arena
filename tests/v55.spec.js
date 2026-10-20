const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v55 every NPC type opens a talk menu; sentries on towers talkable by approach; weekly days off with posts and shops covered",async({page})=>{test.setTimeout(180000);const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(async()=>{const B=__BA,o={types:{},fail:[]},w=t=>new Promise(r=>setTimeout(r,t));B.closeMenu();
  // make the special kinds exist: manor staff, knights, regent-ish leader, kids, adventurers, soldiers
  B.P.gold=1e6;B.P.inv.wood=999;B.eRoomStart("hall");for(let i=0;i<3;i++){B.setDay(B.world.day+1);B.eDaily();}B.eRoomStart("servants");for(let i=0;i<3;i++){B.setDay(B.world.day+1);B.eDaily();}
  const typeOf=n=>n.manorStaff?"servant":n.adv?"adventurer":n.soldierT?"soldier":(B.P.knights||[]).includes(n.id)?"knight":n.manor?"manor":n.role+(n.post!=null?(n.relief?"-relief":"-post"):"");
  const seen=new Set();for(const n of B.npcs){if(!n.alive)continue;const t=typeOf(n);if(seen.has(t)&&o.types[t]>=3)continue;seen.add(t);o.types[t]=(o.types[t]||0)+1;
   try{B.talk(n);await w(5);const m=document.getElementById("menu");if(!m||!m.innerText.includes(n.name.split(" ")[0]))o.fail.push(t+":nomenu");}catch(e){o.fail.push(t+":"+e.message);}B.closeMenu();}
  // sentry on a tower: approach tower and press interact
  B.world.min=10*60;const S=B.SETS[0];const sen=B.npcs.find(n=>n.alive&&n.s===0&&n.role==="guard"&&n.post!=null&&B.onShift(n)&&B.postPx(n).p.k==="tower");o.sentry=!!sen;
  if(sen){const q=B.postPx(sen);const t=B.getTOWERS()[q.p.tw];sen.inside=true;B.hero.x=t.x*16+2;B.hero.y=t.y*16+16;B.closeMenu();const ok=B.interact();await w(20);o.sentryTalk=ok&&document.getElementById("menu").innerText.includes(sen.name.split(" ")[0]);B.closeMenu();}
  // week: every worker & post guard has >=1 day off; each post staffed every hour of every day
  const work=B.npcs.filter(n=>n.alive&&(n.role==="guard"&&n.post!=null||B.dayOff(n,0)||B.dayOff(n,1)||B.dayOff(n,2)||B.dayOff(n,3)||B.dayOff(n,4)||B.dayOff(n,5)||B.dayOff(n,6)||["farmer","shopkeeper","innkeeper","smith","merchant","woodcutter","baker","servant"].includes(n.role)));
  o.noOff=work.filter(n=>![0,1,2,3,4,5,6].some(d=>B.dayOff(n,B.world.day+d))).map(n=>[n.role,n.age,!!n.heroKid,!!n.adv,!!n.soldierT,!!n.manor,(B.P.knights||[]).includes(n.id)].join("/")).slice(0,5);o.nWork=work.length;
  let unst=0;const d0=B.world.day;for(let d=0;d<7;d++)for(let h=0;h<24;h++){B.setDay(d0+d);B.world.min=h*60+10;for(const s of B.SETS){const P2=B.allPosts()[s.id]||[];for(let p=0;p<P2.length;p++){if(!B.npcs.some(n=>n.alive&&n.s===s.id&&n.post===p&&B.onShift(n)))unst++;}}}o.unstaffed=unst;
  // off-day talk line + shop substitute/closed
  const off=work.find(n=>n.role!=="guard"&&B.dayOff(n,B.world.day))||work.find(n=>n.role!=="guard");let k=0;while(!B.dayOff(off,B.world.day)&&k++<7)B.setDay(B.world.day+1);o.offLine=B.dialogLines(off).join(" ");
  const shop=B.getBuildings().findIndex(b=>b.kind==="shop");const own=B.npcs.find(n=>n.alive&&n.work===shop);k=0;while(own&&!B.dayOff(own,B.world.day)&&k++<7)B.setDay(B.world.day+1);const c=B.shopClosedToday(B.getBuildings()[shop]);o.shopState=c?(c.sub?"sub":"closed"):"open";
  return o;});
 console.log(JSON.stringify(o).slice(0,1200));
 expect(o.fail).toEqual([]);for(const t of ["servant","guard-post","guard-relief","child","farmer"])expect(Object.keys(o.types)).toContain(t);expect(o.sentry).toBe(true);expect(o.sentryTalk).toBe(true);
 expect(o.noOff).toEqual([]);expect(o.nWork).toBeGreaterThan(100);expect(o.unstaffed).toBe(0);expect(o.offLine).toMatch(/day off/);expect(["sub","closed"]).toContain(o.shopState);expect(errs).toEqual([]);});
