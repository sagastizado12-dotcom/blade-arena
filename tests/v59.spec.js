const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
const shot=async(page,name)=>{await page.screenshot({path:"/workspace/shots-blade/"+name});};

test("v59 NPCs override their schedule for storm, festival, siege, and black hole, then go back to work",async({page})=>{
  test.setTimeout(120000);const errs=[];page.on("pageerror",e=>errs.push(String(e)));await boot(page);
  const o=await page.evaluate(()=>{const B=__BA,M=__MIND59,o={};B.closeMenu();
    const worker=()=>{for(let k=0;k<8;k++){const n=B.npcs.find(n=>n.alive&&n.role==="shopkeeper"&&!B.dayOff(n)&&n.s!==B.MOD_ID);if(n)return n;B.setDay(B.world.day+1);}return B.npcs.find(n=>n.alive&&n.role==="shopkeeper");};
    const n=worker();o.name=n.name;o.role=n.role;o.s=n.s;
    const calm=()=>{B.world.weather="clear";B.world.min=10*60;const ws=B.world.sets[n.s];ws.festival=0;ws.raid=null;ws.dragon=null;if(ws.ruin)ws.ruin.bh=0;};
    calm();let d=M.mindOf(n,true);o.work=d.act;o.workOver=d.override;o.workLine=d.line;
    B.world.weather="storm";d=M.mindOf(n,true);o.storm=d.act;o.stormWhy=d.why;o.stormLine=d.line;o.stormOver=d.override;o.stormHome=d.target&&d.target.inside&&d.target.b===n.home;
    o.talk=B.dialogLines(n).join(" | ");
    calm();d=M.mindOf(n,true);o.back=d.act;
    B.world.min=14*60;B.world.sets[n.s].festival=B.world.day*1440+B.world.min+800;d=M.mindOf(n,true);o.fest=d.act;o.festLine=d.line;o.festOver=d.override;
    calm();d=M.mindOf(n,true);o.afterFest=d.act;
    B.world.sets[n.s].ruin={bh:1,progress:0.2,since:0};d=M.mindOf(n,true);o.hole=d.act;o.holeLine=d.line;delete B.world.sets[n.s].ruin;calm();d=M.mindOf(n,true);o.afterHole=d.act;
    const f=B.npcs.find(n=>n.alive&&n.s===B.MOD_ID&&n.role==="farmer");B.MODS().siege={k:1,day:B.world.day,until:B.world.day+4,str:2};B.world.weather="clear";B.world.min=11*60;
    d=M.mindOf(f,true);o.siege=d.act;o.siegeLine=d.line;B.MODS().siege=null;d=M.mindOf(f,true);o.afterSiege=d.act;
    const kid=B.npcs.find(n=>n.alive&&n.role==="child");B.world.weather="storm";B.world.min=10*60;d=M.mindOf(kid,true);o.kid=d.act;o.kidHome=d.target&&d.target.b===kid.home;o.kidHurt=B.npcHurt(kid,5,0);o.kidAlive=kid.alive;o.kidRom=B.canRomance(kid);
    const parent=B.npcs.find(p=>p.alive&&p.s===kid.s&&p.role==="farmer"&&(p.age||0)>=20)||B.npcs.find(p=>p.alive&&p.s===kid.s&&(p.age||0)>=20&&p.role!=="child"&&p.role!=="guard");
    kid.parents=[parent.id];kid.inside=false;kid.x=parent.x+36;kid.y=parent.y;d=M.mindOf(parent,true);o.help=d.act;o.helpLine=d.line;
    B.world.weather="storm";B.world.min=10*60;let left=0,held=0;for(const g of B.npcs){if(!g.alive||g.role!=="guard"||g.post==null||!B.onShift(g))continue;const a=M.mindOf(g,true).act;if(a==="stand")held++;else if(a==="shelter"||a==="hide"||a==="flee")left++;}
    o.guards={left,held};
    calm();B.hero.x=n.x;B.hero.y=n.y;B.world.weather="storm";const t=B.npcTarget(n);const gx=Math.floor((t.x+7)/B.TILE),gy=Math.floor((t.y+8)/B.TILE);o.stepWalk=B.passable(gx,gy);
    const sv=B.saveGame();o.saveOk=sv.ok;o.saveLen=sv.len;o.savedMind=localStorage.getItem(B.SAVEKEY).includes('"_md"');
    // pose a few townsfolk outside so the storm choice is on screen
    calm();const S=B.SETS[n.s];B.world.weather="storm";B.world.min=10*60;B.hero.x=S.x*B.TILE;B.hero.y=S.y*B.TILE;B.world.cq=[];let c=0;
    for(const p of B.npcs){if(p.s!==n.s||!p.alive||p.role==="child"||p.role==="leader")continue;p.inside=false;p.pauseT=99999;p.x=S.x*B.TILE+(c%4)*22-30;p.y=S.y*B.TILE+28+(c%3)*16;M.mindOf(p,true);if(++c>=8)break;}
    return o;});
  console.log(JSON.stringify(o));
  expect(o.work).toBe("work");expect(o.workOver).toBe(false);
  expect(o.storm).toBe("shelter");expect(o.stormWhy).toBe("storm");expect(o.stormOver).toBe(true);expect(o.stormHome).toBe(true);
  expect(o.stormLine).toMatch(/heading home early because of the storm/);expect(o.talk).toMatch(/storm/);
  expect(o.back).toBe("work");
  expect(o.fest).toBe("celebrate");expect(o.festLine).toMatch(/festival/i);expect(o.festOver).toBe(true);expect(o.afterFest).toBe("work");
  expect(o.hole).toBe("hide");expect(o.holeLine).toMatch(/black hole/i);expect(o.afterHole).toBe("work");
  expect(o.siege).toBe("hide");expect(o.siegeLine).toMatch(/army|hiding|walls/i);expect(["work","off"]).toContain(o.afterSiege);
  expect(o.kid).toBe("shelter");expect(o.kidHome).toBe(true);expect(o.kidHurt).toBe(false);expect(o.kidAlive).toBe(true);expect(o.kidRom).toBe(false);
  expect(o.help).toBe("help");expect(o.helpLine).toMatch(/fetching|home/);
  expect(o.guards.held).toBeGreaterThan(0);expect(o.guards.left).toBeGreaterThan(0);
  expect(o.stepWalk).toBe(true);expect(o.saveOk).toBe(true);expect(o.saveLen).toBeLessThan(4500000);expect(o.savedMind).toBe(false);
  await page.waitForTimeout(400);await shot(page,"v59-storm-minds.png");
  await page.evaluate(()=>{const B=__BA,M=__MIND59;const S=B.SETS[0];B.world.weather="clear";B.world.min=14*60;B.world.sets[0].festival=B.world.day*1440+B.world.min+900;B.hero.x=S.x*B.TILE;B.hero.y=S.y*B.TILE;let c=0;
    for(const p of B.npcs){if(p.s!==0||!p.alive||p.role==="child")continue;p.inside=false;p.pauseT=99999;p.x=S.x*B.TILE+(c%4)*22-30;p.y=S.y*B.TILE+26+(c%3)*16;M.mindOf(p,true);if(++c>=8)break;}B.closeMenu();});
  await page.waitForTimeout(400);await shot(page,"v59-festival-minds.png");
  expect(errs).toEqual([]);
});

test("v59 soldiers hold or flee by bravery, a rout shifts the front, and a king rallies one side",async({page})=>{
  test.setTimeout(120000);const errs=[];page.on("pageerror",e=>errs.push(String(e)));await boot(page);
  const o=await page.evaluate(()=>{const B=__BA,M=__MIND59,o={};B.closeMenu();B.world.cq=[];
    o.will={coward:M.soldierWill(10,0,false,false),veteran:M.soldierWill(80,0,false,false),rallied:M.soldierWill(10,0,true,false)};
    const w=B.startWar(0,1,"a border dispute");o.war=!!w;if(!w)return o;
    M.kingThink();const C=M.crown();o.aldric=C[0]&&C[0].o;o.brun=C[1]&&C[1].o;
    const f=B.frontOf(w);o.aldricNear=Math.hypot(C[0].gx-f.x,C[0].gy-f.y);o.news=B.world.news.map(n=>n.t).filter(t=>/Aldric|Brunhild/.test(t));
    // pull both crowns off the field so bravery, not the rally, decides the line
    for(const id of [0,1]){C[id].o="court";C[id].x=0;C[id].y=0;}
    M.battleReset(w);w.p=0;M.battleStep(w);const men=M.battleMen(w);
    o.flee=men.filter(m=>m.st==="flee").length;o.hold=men.filter(m=>m.st==="hold").length;
    o.match=men.every(m=>m.st===M.soldierWill(m.brv,0,false,m.cap));
    o.fleeBrave=men.filter(m=>m.st==="flee").every(m=>m.brv<=30);
    o.holdCoward=men.filter(m=>m.brv>=40).every(m=>m.st==="hold");
    const before=w.p=0.9;M.battleStep(w);o.shifted=w.p>before;o.p=w.p;w.p=0;
    M.battleReset(w);M.battleStep(w);
    C[1].o="march";C[1].x=f.x;C[1].y=f.y;M.battleStep(w);const men2=M.battleMen(w);
    o.rallyFlee=men2.filter(m=>m.side===1&&m.st==="flee").length;o.otherFlee=men2.filter(m=>m.side===0&&m.st==="flee").length;
    B.world.cq=[];B.closeMenu();B.warMenu(w);o.menu=document.getElementById("menu").innerText;B.closeMenu();B.world.cq=[];
    // draw the split line with both crowns off the field, so cowards are visibly running
    for(const id of [0,1]){const a=M.capitalAnchor(id);C[id].o="court";C[id].x=a.x;C[id].y=a.y;C[id].gx=a.x;C[id].gy=a.y;}
    M.battleReset(w);w.p=0;M.battleStep(w);B.hero.x=f.x*B.TILE;B.hero.y=f.y*B.TILE;B.world.cq=[];
    o.caps={n:B.conflicts().length,k:B.countriesAtWar().size};
    return o;});
  console.log(JSON.stringify({...o,menu:(o.menu||"").slice(0,400)}));
  expect(o.will).toEqual({coward:"flee",veteran:"hold",rallied:"hold"});
  expect(o.war).toBe(true);expect(o.aldric).toBe("march");expect(o.brun).toBe("march");expect(o.aldricNear).toBeLessThan(16);
  expect(o.news.join(" ")).toMatch(/Aldric/);expect(o.news.join(" ")).toMatch(/march|field|front|host/);
  expect(o.flee).toBeGreaterThan(0);expect(o.hold).toBeGreaterThan(0);expect(o.match).toBe(true);
  expect(o.fleeBrave).toBe(true);expect(o.holdCoward).toBe(true);expect(o.shifted).toBe(true);
  expect(o.rallyFlee).toBe(0);expect(o.otherFlee).toBeGreaterThan(0);
  expect(o.menu).toMatch(/stand/);expect(o.menu).toMatch(/flee/);expect(o.menu).toMatch(/Crown orders/);
  expect(o.caps.n).toBeLessThanOrEqual(4);expect(o.caps.k).toBeLessThanOrEqual(3);
  await page.waitForTimeout(500);await shot(page,"v59-battle-stand-flee.png");
  expect(errs).toEqual([]);
});

test("v59 a king marches, a cautious queen sues for peace, and a crown answers a rebellion",async({page})=>{
  test.setTimeout(120000);const errs=[];page.on("pageerror",e=>errs.push(String(e)));await boot(page);
  const o=await page.evaluate(()=>{const B=__BA,M=__MIND59,o={};B.closeMenu();B.world.cq=[];
    // clear anything the march test's world doesn't share — fresh life, so no wars yet
    const w=B.startWar(5,4,"a broken trade pact");o.started=!!w;if(!w)return o;
    w.p=-0.75;w.day=B.world.day-12;M.kingThink();
    o.over=w.over;o.sig=M.crown()[5];o.osric=M.crown()[4]&&M.crown()[4].o;
    o.news=B.world.news.map(n=>n.t).filter(t=>/Sigrun|peace|truce/.test(t));
    o.caps={n:B.conflicts().length,k:B.countriesAtWar().size};
    const town=B.townsOf(0).find(s=>s.id!==B.KINGDOMS[0].cap&&!s.island);o.town=town&&town.name;
    const r=B.startRebellion(town,"the war tithe");o.reb=!!r;
    if(r){M.kingThink();const C=M.crown()[0];o.order=C.o;o.why=C.why;o.kingNews=B.world.news.map(n=>n.t).filter(t=>/Aldric/.test(t));
      C.x=C.gx;C.y=C.gy;B.hero.x=C.x*B.TILE;B.hero.y=C.y*B.TILE;o.kx=C.x;o.ky=C.y;o.cap=[B.SETS[B.KINGDOMS[0].cap].x,B.SETS[B.KINGDOMS[0].cap].y];}
    B.world.cq=[];B.closeMenu();
    if(o.order){B.conflictsMenu();o.menu=document.getElementById("menu").innerText;B.closeMenu();B.world.cq=[];}
    o.caps2={n:B.conflicts().length,k:B.countriesAtWar().size};
    return o;});
  console.log(JSON.stringify({...o,menu:(o.menu||"").slice(0,500)}));
  expect(o.started).toBe(true);expect(o.over).toBe(true);expect(o.sig.o).toBe("parley");expect(o.sig.why).toBe("peace");
  expect(o.news.join(" ")).toMatch(/Sigrun/);expect(o.news.join(" ")).toMatch(/peace|truce/);
  expect(o.osric).toBe("court");
  expect(o.reb).toBe(true);expect(["crush","hold"]).toContain(o.order);
  expect(o.kingNews.join(" ")).toMatch(/Aldric/);
  expect(o.menu).toMatch(/Crown orders/);expect(o.menu).toMatch(/Aldric/);
  expect(o.caps.n).toBeLessThanOrEqual(4);expect(o.caps.k).toBeLessThanOrEqual(3);
  expect(o.caps2.n).toBeLessThanOrEqual(4);expect(o.caps2.k).toBeLessThanOrEqual(3);
  await page.waitForTimeout(400);await shot(page,"v59-king-front.png");
  await page.evaluate(()=>{const B=__BA;B.world.cq=[];B.conflictsMenu();});
  await page.waitForTimeout(200);await shot(page,"v59-king-menu.png");
  expect(errs).toEqual([]);
});
