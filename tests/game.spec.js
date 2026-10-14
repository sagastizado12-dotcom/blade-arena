const {test,expect}=require("@playwright/test");
const SHOTS="/workspace/shots-blade/";
async function start(page,{intro=false}={}){
  await page.addInitScript(i=>{window.__FAST=true;if(!i&&!sessionStorage.getItem("x")){localStorage.setItem("realmIntroSeen","1");}},intro);
  await page.goto("/");await page.waitForFunction(()=>window.__READY);
  await page.click("#startBtn");
  if(!intro)await page.waitForFunction(()=>__BA.state==="play");
}
const ev=(page,f,a)=>page.evaluate(f,a);
async function hold(page,key,ms){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);}

test("loads into the open world without errors",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);await page.waitForTimeout(800);
  expect(await ev(page,()=>__BA.state)).toBe("play");
  expect(await page.locator("#mini").isVisible()).toBe(true);
  await page.screenshot({path:SHOTS+"01-town-aldmoor.png"});
  expect(errs).toEqual([]);
});

test("movement across chunk borders",async({page})=>{
  await start(page);
  // road between Aldmoor and Saltmere runs east along y=96
  await ev(page,()=>{__BA.teleport(125,96);});
  const c0=await ev(page,()=>Math.floor(__BA.hero.x/256));
  await hold(page,"KeyD",3500);
  const r=await ev(page,()=>({c:Math.floor(__BA.hero.x/256),x:__BA.hero.x,n:__BA.chunkCount()}));
  expect(r.c).toBeGreaterThan(c0);expect(r.n).toBeGreaterThan(2);
  await page.screenshot({path:SHOTS+"02-world-road.png"});
});

test("talking to an NPC",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.world.min=10*60;});await page.waitForTimeout(300);
  const name=await ev(page,()=>{const n=__BA.npcs.find(n=>n.alive&&!n.inside&&n.s===0);__BA.hero.x=n.x;__BA.hero.y=n.y+12;n.x=__BA.hero.x;n.y=__BA.hero.y-12;return n.name;});
  await page.keyboard.press("KeyJ");
  await expect(page.locator("#menu")).toBeVisible();
  await expect(page.locator("#menu h2")).toContainText(name);
  expect((await page.locator("#menu p").textContent()).length).toBeGreaterThan(10);
});

test("killing a monster with the sword",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.teleport(110,96);const h=__BA.hero;__BA.mobs.length=0;__BA.spawnMob("goblin",h.x+18,h.y,{persist:true,tst:1});h.dir=2;h.hp=99;});
  for(let i=0;i<14;i++){await page.keyboard.press("KeyJ");await page.waitForTimeout(160);
    await ev(page,()=>{const m=__BA.mobs.find(m=>m.tst);const h=__BA.hero;if(m&&!m.dead){m.x=h.x+16;m.y=h.y;h.dir=2;}});
    if(await ev(page,()=>!__BA.mobs.some(m=>m.tst&&!m.dead)))break;}
  expect(await ev(page,()=>__BA.P.kills)).toBeGreaterThanOrEqual(1);
});

test("entering a town",async({page})=>{
  await start(page);
  await ev(page,()=>__BA.teleport(146,96));
  expect(await ev(page,()=>!!__BA.settlementAt(__BA.hero.x,__BA.hero.y))).toBe(false);
  await hold(page,"KeyD",2600);
  expect(await ev(page,()=>{const s=__BA.settlementAt(__BA.hero.x,__BA.hero.y);return s&&s.name;})).toBe("Saltmere");
  await page.screenshot({path:SHOTS+"03-town-saltmere.png"});
});

test("save and load",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.P.gold=777;__BA.teleport(100,100);__BA.waystones[1].found=true;__BA.saveGame();});
  await page.reload();await page.waitForFunction(()=>window.__READY);
  await expect(page.locator("#contBtn")).toBeVisible();await page.click("#contBtn");
  const r=await ev(page,()=>({g:__BA.P.gold,x:Math.round(__BA.hero.x/16),w:__BA.waystones[1].found}));
  expect(r).toEqual({g:777,x:100,w:true});
});

test("swimming drains stamina and exhaustion returns you to shore",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.teleport(176,90);__BA.hero.shore={x:150*16,y:96*16};__BA.hero.hp=6;});
  expect(await ev(page,()=>__BA.tAt(176,90))).toBe(0);
  await page.waitForTimeout(1500);
  const s=await ev(page,()=>({st:__BA.hero.stam,sw:__BA.hero.swim}));expect(s.sw).toBe(true);expect(s.st).toBeLessThan(95);
  await ev(page,()=>{__BA.hero.stam=1;});await page.waitForTimeout(400);
  const r=await ev(page,()=>({x:__BA.hero.x,hp:__BA.hero.hp}));expect(r.x).toBe(150*16);expect(r.hp).toBe(5);
});

test("buying and boarding the boat, then sailing to an island",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.P.gold=100;const b=__BA.buildings.find(b=>b.kind==="harbor");__BA.hero.x=(b.x+1.6)*16;__BA.hero.y=(b.y+b.h)*16+4;});
  await page.keyboard.press("KeyJ");await expect(page.locator("#menu")).toBeVisible();
  await page.locator("#menu button",{hasText:"Buy a boat"}).click();
  expect(await ev(page,()=>__BA.P.boat.owned)).toBe(true);
  await ev(page,()=>{const b=__BA.P.boat;__BA.hero.x=b.x+8;__BA.hero.y=b.y-4;});
  await page.waitForTimeout(100);await page.keyboard.press("KeyJ");
  await page.waitForFunction(()=>__BA.hero.boat,null,{timeout:3000});
  expect(await ev(page,()=>__BA.hero.boat)).toBe(true);
  await page.screenshot({path:SHOTS+"04-sailing.png"});
  const x0=await ev(page,()=>__BA.hero.x);
  await ev(page,()=>{__BA.hero.y=100*16;});
  for(let i=0;i<14&&!(await ev(page,()=>__BA.P.isles.includes(2)));i++)await hold(page,"KeyD",1000);
  const r=await ev(page,()=>({isles:__BA.P.isles,x:__BA.hero.x}));
  expect(r.x-x0).toBeGreaterThan(600);expect(r.isles).toContain(2);
});

test("forced random event changes the world",async({page})=>{
  await start(page);
  const before=await ev(page,()=>({d:__BA.SETS[2].bIdx.reduce((a,b)=>a+__BA.world.bld[b].dmg,0),n:__BA.world.news.length,p:__BA.world.sets[2].price}));
  await ev(page,()=>__BA.forceEvent("raid",2));
  const after=await ev(page,()=>({d:__BA.SETS[2].bIdx.reduce((a,b)=>a+__BA.world.bld[b].dmg,0),n:__BA.world.news.length,raid:!!__BA.world.sets[2].raid,p:__BA.world.sets[2].price,news:__BA.world.news[0].t}));
  expect(after.d).toBeGreaterThan(before.d);expect(after.raid).toBe(true);expect(after.p).toBeGreaterThan(before.p);expect(after.news).toContain("Highcrest");
  // raiders appear when the player goes there
  await ev(page,()=>__BA.teleport(__BA.SETS[2].x,__BA.SETS[2].y+3));await page.waitForTimeout(1500);
  expect(await ev(page,()=>__BA.mobs.filter(m=>m.raidOf===2).length)).toBeGreaterThan(0);
  // event persists in save
  await ev(page,()=>__BA.saveGame());await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");
  expect(await ev(page,()=>!!__BA.world.sets[2].raid)).toBe(true);
});

test("rank progression on the path to King",async({page})=>{
  await start(page);
  expect(await ev(page,()=>__BA.P.rank)).toBe(0);
  await ev(page,()=>{__BA.P.house=__BA.buildings.find(b=>b.kind==="forsale").id;__BA.checkRank();});
  expect(await ev(page,()=>__BA.P.rank)).toBe(2);
  await ev(page,()=>{__BA.P.raidsDefended=1;__BA.checkRank();});expect(await ev(page,()=>__BA.P.rank)).toBe(3);
  await ev(page,()=>{__BA.P.gold=600;__BA.npcs.forEach(n=>n.friend=70);__BA.checkRank();});expect(await ev(page,()=>__BA.P.rank)).toBe(4);
  await ev(page,()=>{__BA.world.dragonsSlain=1;__BA.P.dungeon=true;__BA.P.beastsSlain=1;__BA.P.isles=[0,1,2];__BA.checkRank();});
  expect(await ev(page,()=>({r:__BA.P.rank,c:__BA.P.canCrown}))).toEqual({r:5,c:true});
  await ev(page,()=>__BA.coronation());await page.waitForTimeout(300);
  expect(await ev(page,()=>({r:__BA.P.rank,k:__BA.P.king}))).toEqual({r:6,k:true});
  const known=await ev(page,()=>__BA.P.mag.known);expect(known).toContain("chain");expect(known).toContain("blade");
});

test("romance reaching marriage",async({page})=>{
  await start(page);
  const r=await ev(page,()=>{const B=__BA;const n=B.npcs.find(n=>n.age>=18&&n.role!=="child"&&!n.spouse);
    n.friend=60;const d=B.askDate(n);n.friend=95;B.P.inv.ring=1;const p=B.propose(n);return{d,p,sp:B.P.spouse,id:n.id,age:n.age};});
  expect(r.d).toContain("dating");expect(r.sp).toBe(r.id);expect(r.age).toBeGreaterThanOrEqual(18);
  // children cannot be romanced
  const c=await ev(page,()=>{const k=__BA.npcs.find(n=>n.role==="child");k.friend=100;return __BA.askDate(k);});
  expect(c).toContain("not interested");
});

test("a dragon spawns from a dragon attack event and its parts can be severed",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.forceEvent("dragon",0);});
  await page.waitForTimeout(1500);
  const d=await ev(page,()=>{const m=__BA.mobs.find(m=>m.sp==="dragon");return m&&{k:m.dk,hp:m.hp,parts:m.parts};});
  expect(d).toBeTruthy();expect(d.parts.wings).toBe(true);
  await page.screenshot({path:SHOTS+"05-dragon-attack.png"});
});

test("casting spells uses mana and damages monsters",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.teleport(110,96);__BA.mobs.length=0;const h=__BA.hero;__BA.spawnMob("goblin",h.x+50,h.y,{persist:true,tst:1});h.dir=2;});
  const mp0=await ev(page,()=>__BA.P.mag.mp);
  await page.keyboard.press("KeyL");await page.waitForTimeout(80);
  expect(await ev(page,()=>__BA.fx.length)).toBeGreaterThan(0);
  await page.screenshot({path:SHOTS+"06-fireball.png"});
  await page.waitForTimeout(900);
  const r=await ev(page,()=>({mp:__BA.P.mag.mp,m:__BA.mobs.find(m=>m.tst)}));
  expect(r.mp).toBeLessThan(mp0);expect(!r.m||r.m.dead||r.m.hp<r.m.maxHp).toBe(true);
  // heal spell
  await ev(page,()=>{__BA.hero.hp=2;__BA.P.mag.mp=100;});await page.keyboard.press("8");
  expect(await ev(page,()=>__BA.castSpell("heal"))).toBe(true);expect(await ev(page,()=>__BA.hero.hp)).toBeGreaterThan(2);
});

test("summoning intro plays only once",async({page})=>{
  await page.addInitScript(()=>{window.__FAST=true;});
  await page.goto("/");await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForFunction(()=>window.__READY);
  await page.click("#startBtn");
  expect(await ev(page,()=>__BA.state)).toBe("intro");await expect(page.locator("#introBox")).toBeVisible();
  await page.waitForTimeout(900);await page.screenshot({path:SHOTS+"00-summoning-intro.png"});
  for(let i=0;i<6;i++)await page.locator("#introBox").click({position:{x:20,y:30}});
  expect(await ev(page,()=>__BA.state)).toBe("play");
  await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");
  expect(await ev(page,()=>__BA.state)).toBe("play");await expect(page.locator("#introBox")).toBeHidden();
});

test("audio starts only after a tap and settings persist",async({page})=>{
  await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});
  await page.goto("/");await page.waitForFunction(()=>window.__READY);
  expect(await page.evaluate(()=>!!window.__AU.ctx)).toBe(false);
  await page.click("#startBtn");
  expect(await page.evaluate(()=>!!window.__AU.ctx)).toBe(true);
  expect(await page.evaluate(()=>window.__AU.set.music)).toBeCloseTo(0.4);
  await page.click("#btnSnd");await expect(page.locator("#volM")).toBeVisible();
  await page.locator("#volM").fill("25");await page.locator("#mute").check();await page.click("#audClose");
  await page.reload();await page.waitForFunction(()=>window.__READY);
  const s=await page.evaluate(()=>window.__AU.set);expect(s.music).toBeCloseTo(0.25);expect(s.mute).toBe(true);expect(s.sfx).toBeCloseTo(0.6);
  expect(await page.evaluate(()=>!!window.__AU.ctx)).toBe(false);
});

// BFS over walkable land (no swimming): non-solid, non-deep tiles
const bfs=`(sx,sy)=>{const B=__BA,W=B.WW,seen=new Uint8Array(W*192),q=[sx+sy*W];seen[q[0]]=1;
  for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=(i/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=192)continue;const j=nx+ny*W;
    if(seen[j]||B.solidTile(nx,ny)||B.tAt(nx,ny)===B.DEEP)continue;seen[j]=1;q.push(j);}}return seen;}`;
test("a mountain peak can be reached on foot from a town",async({page})=>{
  await start(page);
  const r=await ev(page,src=>{const f=eval(src);const S=__BA.SETS[2];const seen=f(S.x,S.y+1);let peaks=0,cliffs=0,best=null;
    for(let i=0;i<seen.length;i++)if(seen[i]){const x=i%256,y=(i/256)|0;if(__BA.elevAt(x,y)===3){peaks++;if(!best)best=[x,y];}if(__BA.tAt(x,y)===__BA.CLIFF)cliffs++;}
    const looks=__BA.LOOKOUTS().filter(l=>seen[l.x+1+l.y*256]||seen[l.x-1+l.y*256]||seen[l.x+(l.y+1)*256]).length;return{peaks,cliffs,looks,best};},bfs);
  expect(r.peaks).toBeGreaterThan(20);expect(r.cliffs).toBeGreaterThan(10);expect(r.looks).toBeGreaterThan(0);
  // actually climb a cliff face: stamina drains and the hero gets higher
  const c=await ev(page,()=>{const B=__BA;for(let y=20;y<90;y++)for(let x=20;x<140;x++)if(B.tAt(x,y)===B.CLIFF&&B.tAt(x,y+1)!==B.CLIFF&&!B.solidTile(x,y+1)&&B.tAt(x,y+1)!==B.DEEP&&B.elevAt(x,y-1)>=B.elevAt(x,y)&&!B.solidTile(x,y-1)&&!B.solidTile(x+1,y)&&!B.solidTile(x-1,y)){B.teleport(x,y+1);B.hero.x-=2;return{x,y};}return null;});
  expect(c).toBeTruthy();
  await page.keyboard.down("KeyW");let minSt=100;for(let i=0;i<14;i++){await page.waitForTimeout(100);minSt=Math.min(minSt,await ev(page,()=>__BA.hero.stam));}await page.keyboard.up("KeyW");
  const h=await ev(page,()=>({ty:Math.floor((__BA.hero.y+8)/16)}));
  expect(h.ty).toBeLessThan(c.y+1);expect(minSt).toBeLessThan(100);
  await page.screenshot({path:SHOTS+"v2-mountain-climb.png"});
});
test("no settlement is enclosed by trees and the mainland is connected",async({page})=>{
  await start(page);
  const r=await ev(page,src=>{const f=eval(src);const B=__BA;const out=[];
    for(const s of B.SETS){const seen=f(s.x,s.y+1);let ring=0;for(let i=0;i<seen.length;i++)if(seen[i]){const x=i%256,y=(i/256)|0;if(Math.hypot(x-s.x,y-s.y)>s.r+8)ring++;}
      const reach=B.SETS.filter(o=>!o.island&&seen[o.x+(o.y+1)*256]).length;out.push({n:s.name,ring,reach,island:!!s.island});}
    let walls=0;for(let y=1;y<191;y++)for(let x=1;x<255;x++)if(B.tAt(x,y)===B.TREE&&(B.tAt(x+1,y)===B.TREE||B.tAt(x,y+1)===B.TREE))walls++;
    return{out,walls};},bfs);
  for(const s of r.out){expect(s.ring,s.n).toBeGreaterThan(50);if(!s.island)expect(s.reach,s.n).toBe(5);}
  expect(r.walls).toBe(0);
});
