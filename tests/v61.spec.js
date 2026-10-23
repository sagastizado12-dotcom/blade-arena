const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
const shot=async(page,name)=>{await page.screenshot({path:"/workspace/shots-blade/"+name});};
const labels=page=>page.locator("#menu button").evaluateAll(els=>els.map(e=>e.textContent.trim()));

test("v61 fronts stay off water, and the Wars menu can start and end a land-only war demo",async({page})=>{
  test.setTimeout(180000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await boot(page);
  const sweep=await page.evaluate(()=>{
    const B=__BA,W=__WAR61,o={rawWet:0,n:0,bad:[],sample:null};
    for(let a=0;a<B.KINGDOMS.length;a++)for(let b=a+1;b<B.KINGDOMS.length;b++){
      for(const p of [-0.95,-0.35,0,0.35,0.95]){
        const s=W.sampleFront(a,b,p);o.n++;if(s.rawWet)o.rawWet++;
        if(s.frontWet||s.kingWet||s.slotWet)o.bad.push({a,b,p,front:s.front,king:s.king,frontWet:s.frontWet,kingWet:s.kingWet,slotWet:s.slotWet});
        if(p===0&&s.rawWet&&!o.sample)o.sample={a,b,town:s.town,other:s.other,raw:s.raw,front:s.front};
      }
    }
    let water=null;for(let y=8;y<B.WH&&!water;y+=5)for(let x=8;x<B.WW;x+=5){if(B.tAt(x,y)===B.DEEP){water=[x,y];break;}}
    const n=water&&W.nearestFight(water[0],water[1],80);
    o.water=water;o.snapped=n;o.snapOk=!!(n&&W.fightTile(n[0],n[1]));
    o.bridgeOk=typeof B.tAt==="function";
    return o;
  });
  console.log(JSON.stringify({n:sweep.n,rawWet:sweep.rawWet,bad:sweep.bad.slice(0,4),sample:sweep.sample,water:sweep.water,snapped:sweep.snapped}));
  expect(sweep.n).toBeGreaterThan(20);
  expect(sweep.rawWet).toBeGreaterThan(0);
  expect(sweep.bad).toEqual([]);
  expect(sweep.snapOk).toBe(true);

  const before=await page.evaluate(()=>{
    const B=__BA,M=__MIND59;B.closeMenu();B.world.cq=[];
    const real=B.startWar(0,2,"a border dispute");if(!real)return{ok:false};
    M.kingThink();B.world.cq=[];B.closeMenu();
    const owners=B.SETS.map(s=>s.id+":"+B.kOf(s.id)).join(",");
    window.__snap61={
      owners,
      treaties:JSON.stringify(B.world.treaties||[]),
      warIds:(B.world.wars||[]).filter(w=>!w.over).map(w=>w.id),
      crowns:JSON.parse(JSON.stringify(B.world.crown||{})),
      real:[real.a,real.b,real.id]
    };
    B.showMenu("Paused","The world waits for you.",[{l:"Resume"}]);
    return{ok:true,wars:document.getElementById("menu").innerText};
  });
  expect(before.ok).toBe(true);
  expect(before.wars).toMatch(/Wars/);
  await page.locator("#menu button",{hasText:"⚔ Wars"}).first().click();
  let labs=await labels(page);
  console.log("menu before demo",labs.join(" | "));
  expect(labs).toContain("⚔ War demo");
  expect(labs).not.toContain("End demo");
  const demoAt=labs.indexOf("⚔ War demo");
  expect(labs[demoAt+1]).not.toBe("End demo");

  await page.getByRole("button",{name:"⚔ War demo",exact:true}).click();
  await page.waitForTimeout(900);
  const mid=await page.evaluate(()=>{
    const B=__BA,M=__MIND59,W=__WAR61,S=window.__snap61,w=W.demoWar();
    const o={demo:!!w};if(!w)return o;
    B.world.weather="clear";B.world.min=12*60;B.world.cq=[];B.closeMenu();
    w.p=0;M.battleReset(w);M.battleStep(w);
    const f=B.frontOf(w);o.town=f.s&&f.s.name;o.other=f.t&&f.t.name;
    o.frontLand=W.fightTile(f.x,f.y);o.front=[f.x,f.y];
    const gap=Math.hypot(f.s.x-f.t.x,f.s.y-f.t.y);o.nearTown=Math.min(Math.hypot(f.x-f.s.x,f.y-f.s.y),Math.hypot(f.x-f.t.x,f.y-f.t.y))<gap*0.65+12;
    const men=M.battleMen(w);o.flee=men.filter(m=>m.st==="flee").length;o.hold=men.filter(m=>m.st==="hold").length;
    o.menLand=men.every(m=>W.fightTile(Math.floor(m.x/B.TILE),Math.floor(m.y/B.TILE)));
    const C=B.world.crown[w.demoKing];o.order=C&&C.o;o.why=C&&C.why;o.kingLand=!!(C&&W.fightTile(C.x,C.y));
    o.kingNear=C?Math.hypot(C.x-f.x,C.y-f.y):99;
    o.line=M.orderLine(w.demoKing,C.o,C.why);
    o.caps={n:B.conflicts().length,k:B.countriesAtWar().size};
    o.realStill=(B.world.wars||[]).some(q=>q.id===S.real[2]&&!q.over);
    o.ownersSame=B.SETS.map(s=>s.id+":"+B.kOf(s.id)).join(",")===S.owners;
    o.noTreaty=(B.world.treaties||[]).length===JSON.parse(S.treaties).length;
    B.hero.x=f.x*B.TILE+2;B.hero.y=f.y*B.TILE+2;B.hero.boat=false;
    o.pair=[w.a,w.b,w.id];S.demoKings=[w.a,w.b];
    return o;
  });
  console.log(JSON.stringify(mid));
  expect(mid.demo).toBe(true);
  expect(mid.frontLand).toBe(true);
  expect(mid.nearTown).toBe(true);
  expect(mid.menLand).toBe(true);
  expect(mid.flee).toBeGreaterThan(0);
  expect(mid.hold).toBeGreaterThan(0);
  expect(mid.order).toBe("march");
  expect(mid.line).toMatch(/march|field|front|host/);
  expect(mid.kingLand).toBe(true);
  expect(mid.kingNear).toBeLessThan(16);
  expect(mid.caps.n).toBeLessThanOrEqual(4);
  expect(mid.caps.k).toBeLessThanOrEqual(3);
  expect(mid.realStill).toBe(true);
  expect(mid.ownersSame).toBe(true);
  expect(mid.noTreaty).toBe(true);
  expect(errs).toEqual([]);
  await page.waitForTimeout(400);
  await shot(page,"v61-land-front.png");

  await page.evaluate(()=>{__BA.world.cq=[];__BA.conflictsMenu();});
  labs=await labels(page);
  console.log("menu during demo",labs.join(" | "));
  expect(labs).toContain("⚔ War demo");
  expect(labs).toContain("End demo");
  const at=labs.indexOf("⚔ War demo");
  expect(labs[at+1]).toBe("End demo");
  expect(labs.some(l=>l.startsWith("⚔ War demo:"))).toBe(true);
  await shot(page,"v61-wars-menu.png");
  await page.locator("#menu button",{hasText:"⚔ War demo:"}).first().click();
  const detail=await page.locator("#menu").innerText();
  expect(detail).toMatch(/Practice/);
  expect(detail).toMatch(/stand/);
  expect(detail).toMatch(/flee/);
  expect(detail).toMatch(/Crown orders/);
  expect(detail).toMatch(/march|field|front|host/);
  const detailLabs=await labels(page);
  expect(detailLabs).toContain("End demo");
  await page.getByRole("button",{name:"Back",exact:true}).click();
  await page.getByRole("button",{name:"End demo",exact:true}).click();
  labs=await labels(page);
  console.log("menu after end",labs.join(" | "));
  expect(labs).toContain("⚔ War demo");
  expect(labs).not.toContain("End demo");

  const after=await page.evaluate(()=>{
    const B=__BA,W=__WAR61,S=window.__snap61,o={};
    o.demo=!!W.demoWar();
    o.wars=(B.world.wars||[]).filter(w=>!w.over).map(w=>({id:w.id,a:w.a,b:w.b,demo:!!w.demo}));
    o.realStill=o.wars.some(w=>w.id===S.real[2]);
    o.ownersSame=B.SETS.map(s=>s.id+":"+B.kOf(s.id)).join(",")===S.owners;
    o.treaties=JSON.stringify(B.world.treaties||[])===S.treaties;
    const C=B.world.crown||{},P=S.crowns||{},demo=new Set((S.demoKings||[]).map(String));
    o.crowns=true;o.crownDiff=[];
    for(const k of Object.keys(P)){const a=C[k],b=P[k];
      if(!a||!b||a.o!==b.o||a.why!==b.why||a.gx!==b.gx||a.gy!==b.gy){o.crowns=false;o.crownDiff.push(k+":order");continue;}
      if(demo.has(String(k))&&(a.x!==b.x||a.y!==b.y)){o.crowns=false;o.crownDiff.push(k+":pos");}}
    try{o.orphans=(B.world.wars||[]).filter(w=>w.demo&&!w.over).length;}catch(_){o.orphans=0;}
    B.closeMenu();B.world.cq=[];
    const sv=B.saveGame();o.saveOk=sv.ok;o.saveLen=sv.len;o.savedDemo=localStorage.getItem(B.SAVEKEY).includes('"demo":1');
    return o;
  });
  console.log(JSON.stringify(after));
  expect(after.demo).toBe(false);
  expect(after.realStill).toBe(true);
  expect(after.wars.every(w=>!w.demo)).toBe(true);
  expect(after.ownersSame).toBe(true);
  expect(after.treaties).toBe(true);
  expect(after.crowns).toBe(true);
  expect(after.orphans).toBe(0);
  expect(after.saveOk).toBe(true);
  expect(after.saveLen).toBeLessThan(4500000);
  expect(after.savedDemo).toBe(false);
  expect(errs).toEqual([]);
});
