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
  await ev(page,()=>{__BA.teleport(168,146);});
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
  await ev(page,()=>{__BA.teleport(170,146);const h=__BA.hero;__BA.mobs.length=0;__BA.spawnMob("goblin",h.x+18,h.y,{persist:true,tst:1});h.dir=2;h.hp=99;});
  for(let i=0;i<14;i++){await page.keyboard.press("KeyJ");await page.waitForTimeout(160);
    await ev(page,()=>{const m=__BA.mobs.find(m=>m.tst);const h=__BA.hero;if(m&&!m.dead){m.x=h.x+16;m.y=h.y;h.dir=2;}});
    if(await ev(page,()=>!__BA.mobs.some(m=>m.tst&&!m.dead)))break;}
  expect(await ev(page,()=>__BA.P.kills)).toBeGreaterThanOrEqual(1);
});

test("entering a town",async({page})=>{
  await start(page);
  await ev(page,()=>__BA.teleport(212,150));
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
  await ev(page,()=>{__BA.teleport(300,150);__BA.hero.shore={x:244*16,y:152*16};__BA.hero.hp=6;});
  expect(await ev(page,()=>__BA.tAt(300,150))).toBe(0);
  await page.waitForTimeout(1500);
  const s=await ev(page,()=>({st:__BA.hero.stam,sw:__BA.hero.swim}));expect(s.sw).toBe(true);expect(s.st).toBeLessThan(95);
  await ev(page,()=>{__BA.hero.stam=1;});await page.waitForTimeout(400);
  const r=await ev(page,()=>({x:__BA.hero.x,hp:__BA.hero.hp}));expect(r.x).toBe(244*16);expect(r.hp).toBe(5);
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
  for(let i=0;i<24&&!(await ev(page,()=>__BA.P.isles.includes(2)));i++)await hold(page,"KeyD",1000);
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
  await ev(page,()=>{__BA.world.dragonsSlain=1;__BA.P.dungeon=true;__BA.P.beastsSlain=1;__BA.P.isles=[0,1,2];__BA.P.titles=["Defender of Aldmoor"];__BA.checkRank();});
  expect(await ev(page,()=>({r:__BA.P.rank,c:__BA.P.canCrown}))).toEqual({r:5,c:true});
  await ev(page,()=>__BA.coronation());await page.waitForTimeout(300);
  expect(await ev(page,()=>({r:__BA.P.rank,k:__BA.P.king}))).toEqual({r:6,k:true});
  const known=await ev(page,()=>__BA.P.mag.known);expect(known).toContain("thunder");expect(known).toContain("air");
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
  await ev(page,()=>{__BA.teleport(170,146);__BA.mobs.length=0;const h=__BA.hero;__BA.spawnMob("goblin",h.x+50,h.y,{persist:true,tst:1});h.dir=2;});
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
  await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");
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
const bfs=`(sx,sy)=>{const B=__BA,W=B.WW,seen=new Uint8Array(W*B.WH),q=[sx+sy*W];seen[q[0]]=1;
  for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=(i/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=B.WH)continue;const j=nx+ny*W;
    if(seen[j]||B.solidTile(nx,ny)||B.tAt(nx,ny)===B.DEEP)continue;seen[j]=1;q.push(j);}}return seen;}`;
test("every region is reachable on foot and there are no mountains",async({page})=>{
  await start(page);
  const r=await ev(page,src=>{const f=eval(src);const B=__BA;const S=B.SETS[0];const seen=f(S.x,S.y+1);
    let mtn=0,land=0,reach=0;const T=B.T();
    // mainland = the connected landmass of Aldmoor ignoring trees (what walking could ever touch)
    for(let y=0;y<B.WH;y++)for(let x=0;x<B.WW;x++){const t=B.tAt(x,y);if(t===B.MTN||t===B.CLIFF||t===B.STAIRS)mtn++;}
    const onMain=new Uint8Array(B.WW*B.WH);const q=[[S.x,S.y+1]];onMain[S.x+(S.y+1)*B.WW]=1;
    while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=B.WW||ny>=B.WH)continue;const i=nx+ny*B.WW;if(onMain[i])continue;const t=B.tAt(nx,ny);if(t===B.DEEP||t===B.SHAL)continue;onMain[i]=1;q.push([nx,ny]);}}
    for(let i=0;i<onMain.length;i++)if(onMain[i]&&B.passable(i%B.WW,(i/B.WW)|0)){land++;if(seen[i])reach++;}
    const near=(o)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(seen[(o.x+dx)+(o.y+dy)*B.WW])return true;return false;};
    const lairs=B.LAIRS.filter(l=>onMain[l.x+l.y*B.WW]);const looks=B.LOOKOUTS().filter(l=>onMain[l.x+l.y*B.WW]);
    return{mtn,frac:reach/land,lairs:lairs.length,lairsOk:lairs.filter(near).length,looks:looks.length,looksOk:looks.filter(near).length,
      sets:B.SETS.filter(s=>!s.island&&onMain[s.x+s.y*B.WW]).length,setsOk:B.SETS.filter(s=>!s.island&&onMain[s.x+s.y*B.WW]&&seen[s.x+(s.y+1)*B.WW]).length};},bfs);
  expect(r.mtn).toBe(0);
  expect(r.frac).toBeGreaterThan(0.97);
  expect(r.lairsOk).toBe(r.lairs);expect(r.looksOk).toBe(r.looks);expect(r.setsOk).toBe(r.sets);
});
test("no settlement is enclosed by trees and the mainland is connected",async({page})=>{
  await start(page);
  const r=await ev(page,src=>{const f=eval(src);const B=__BA;const out=[];
    for(const s of B.SETS){const seen=f(s.x,s.y+1);let ring=0;for(let i=0;i<seen.length;i++)if(seen[i]){const x=i%B.WW,y=(i/B.WW)|0;if(Math.hypot(x-s.x,y-s.y)>s.r+8)ring++;}
      const reach=B.SETS.filter(o=>!o.island&&seen[o.x+(o.y+1)*B.WW]).length;out.push({n:s.name,ring,reach,island:!!s.island,need:B.SETS.filter(o=>!o.island).length});}
    let walls=0;for(let y=1;y<191;y++)for(let x=1;x<255;x++)if(B.tAt(x,y)===B.TREE&&(B.tAt(x+1,y)===B.TREE||B.tAt(x,y+1)===B.TREE))walls++;
    return{out,walls};},bfs);
  for(const s of r.out){expect(s.ring,s.n).toBeGreaterThan(50);if(!s.island)expect(s.reach,s.n).toBe(s.need);}
  expect(r.walls).toBe(0);
});

test("chopping a tree drops wood, leaves a stump, and town trees are protected",async({page})=>{
  await start(page);
  const t=await ev(page,()=>{const B=__BA;for(let y=30;y<170;y++)for(let x=20;x<170;x++)if(B.tAt(x,y)===B.TREE&&!B.townTree(x,y)&&!B.solidTile(x-1,y)&&B.tAt(x-1,y)!==B.DEEP&&B.tAt(x-1,y)!==B.CLIFF){B.teleport(x-1,y);B.hero.x=(x-1)*16+2;B.hero.dir=2;B.hero.hp=99;B.mobs.length=0;return{x,y};}return null;});
  expect(t).toBeTruthy();
  for(let i=0;i<8&&await ev(page,t=>__BA.tAt(t.x,t.y)===__BA.TREE,t);i++){await ev(page,()=>{__BA.hero.dir=2;});await page.keyboard.press("KeyJ");await page.waitForTimeout(350);}
  expect(await ev(page,t=>__BA.tAt(t.x,t.y),t)).toBe(19);
  await page.waitForTimeout(600);
  await ev(page,()=>{const p=__BA.pickups;for(const q of p){q.x=__BA.hero.x+6;q.y=__BA.hero.y+8;}});await page.waitForTimeout(300);
  expect(await ev(page,()=>__BA.P.inv.wood||0)).toBeGreaterThanOrEqual(2);
  // regrowth is tracked in the save
  expect(await ev(page,t=>!!__BA.world.trees[t.y*__BA.WW+t.x],t)).toBe(true);
  await ev(page,()=>{__BA.world.day+=3;__BA.regrowTrees();});expect(await ev(page,t=>__BA.tAt(t.x,t.y),t)).toBe(20);
  await page.screenshot({path:SHOTS+"v2-chopping.png"});
});

test("killing a monster drops a part that can be picked up and crafted into gear",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.teleport(170,146);__BA.mobs.length=0;__BA.hero.hp=99;});
  let fang=0;
  for(let k=0;k<16&&!fang;k++){
    await ev(page,()=>{const h=__BA.hero;__BA.spawnMob("viper",h.x+16,h.y,{persist:true,tst:1});h.dir=2;});
    for(let i=0;i<12;i++){await page.keyboard.press("KeyJ");await page.waitForTimeout(150);
      const alive=await ev(page,()=>{const m=__BA.mobs.find(m=>m.tst&&!m.dead);const h=__BA.hero;if(m){m.x=h.x+16;m.y=h.y;h.dir=2;}return !!m;});if(!alive)break;}
    await page.waitForTimeout(500);
    await ev(page,()=>{for(const q of __BA.pickups){q.x=__BA.hero.x+6;q.y=__BA.hero.y+8;}});await page.waitForTimeout(300);
    fang=await ev(page,()=>(__BA.P.inv.fang||0)+(__BA.P.inv["fang+"]||0));
  }
  expect(fang).toBeGreaterThanOrEqual(1);
  expect(await ev(page,()=>__BA.P.best.viper.kills)).toBeGreaterThanOrEqual(1);
  await ev(page,()=>{__BA.P.inv.wood=3;});
  expect(await ev(page,()=>__BA.craftGear("fangsword"))).toBe(true);
  expect(await ev(page,()=>__BA.swordDmg())).toBeGreaterThanOrEqual(2);
  await page.click("#btnBag");await page.locator("#menu button",{hasText:"More…"}).click();await expect(page.locator("#menu")).toContainText("Satchel");
  await page.locator("#menu button",{hasText:"Bestiary"}).click();await expect(page.locator("#menu")).toContainText("Grass Viper");
});

test("defeating a dragon attacking a town triggers heroic recognition",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.forceEvent("dragon",0);__BA.teleport(__BA.SETS[0].x,__BA.SETS[0].y+2);__BA.hero.hp=99;__BA.hero.maxHp=99;});
  await page.waitForFunction(()=>__BA.mobs.some(m=>m.sp==="dragon"),null,{timeout:5000});
  const before=await ev(page,()=>({g:__BA.P.gold,f:__BA.npcs.filter(n=>n.s===0).reduce((a,n)=>a+n.friend,0)}));
  await ev(page,()=>{const d=__BA.mobs.find(m=>m.sp==="dragon");d.hp=1;d.fly=0;d.iframes=0;__BA.hitDragon(d,0);});
  await page.waitForTimeout(400);
  const r=await ev(page,()=>({titles:__BA.P.titles,g:__BA.P.gold,f:__BA.npcs.filter(n=>n.s===0).reduce((a,n)=>a+n.friend,0),news:__BA.world.news.slice(0,4).map(n=>n.t).join("|"),cheer:__BA.npcs.filter(n=>n.s===0&&n.cheer).length,raids:__BA.P.raidsDefended}));
  expect(r.titles).toContain("Dragonslayer of Aldmoor");expect(r.g).toBeGreaterThan(before.g+100);expect(r.f).toBeGreaterThan(before.f);expect(r.news).toContain("Dragonslayer of Aldmoor");expect(r.cheer).toBeGreaterThan(2);expect(r.raids).toBeGreaterThan(0);
  await expect(page.locator("#menu")).toContainText("saved my home");
  await ev(page,()=>__BA.closeMenu());
  const n=await ev(page,()=>{const n=__BA.npcs.find(n=>n.s===0&&n.alive);__BA.talk(n);return document.querySelector("#menu").innerText;});
  expect(n).toContain("Dragonslayer");
});

test("guild: register, accept a job, complete it and get paid",async({page})=>{
  await start(page);
  await ev(page,()=>__BA.guildMenu(0));await page.locator("#menu button",{hasText:"Register"}).click();
  expect(await ev(page,()=>__BA.guild().reg)).toBe(true);
  await page.locator("#menu button",{hasText:"Wood for the guild"}).first().click();await page.locator("#menu button",{hasText:"Accept job"}).click();
  expect(await ev(page,()=>__BA.guild().active.length)).toBe(1);
  await ev(page,()=>{__BA.closeMenu();__BA.P.inv.wood=6;});const g0=await ev(page,()=>__BA.P.gold);
  await ev(page,()=>__BA.guildMenu(0));await expect(page.locator("#menu")).toContainText("your pay");
  const r=await ev(page,()=>({g:__BA.P.gold,pts:__BA.guild().pts,act:__BA.guild().active.length,wood:__BA.P.inv.wood}));
  expect(r.g).toBe(g0+30);expect(r.pts).toBe(8);expect(r.act).toBe(0);expect(r.wood).toBe(0);
  await ev(page,()=>__BA.closeMenu());await page.click("#btnBag");await page.locator("#menu button",{hasText:"More…"}).click();await page.locator("#menu button",{hasText:"Guild Card"}).click();await expect(page.locator("#menu")).toContainText("Rank: F");
});

test("entering and leaving a house through its door",async({page})=>{
  await start(page);
  const b=await ev(page,()=>{__BA.world.min=12*60;const b=__BA.buildings.find(b=>b.kind==="inn"&&b.s===0);__BA.hero.x=(b.x+1.6)*16;__BA.hero.y=(b.y+b.h)*16+4;__BA.hero.dir=3;return b.id;});
  await page.waitForTimeout(100);await page.keyboard.press("KeyJ");
  await page.waitForFunction(()=>!!__BA.room,null,{timeout:3000});
  expect(await ev(page,()=>__BA.room.kind)).toBe("inn");
  await page.waitForTimeout(400);await page.screenshot({path:SHOTS+"v2-interior-inn.png"});
  await ev(page,()=>{const r=__BA.room;__BA.hero.x=r.door.x*16+2;__BA.hero.y=(r.h-2)*16+2;});
  await page.keyboard.down("KeyS");
  await page.waitForFunction(()=>!__BA.room,null,{timeout:3000});await page.keyboard.up("KeyS");
  const p=await ev(page,b=>{const B=__BA.buildings[b];return Math.abs(__BA.hero.y-(B.y+B.h)*16)<30;},b);expect(p).toBe(true);
});

test("NPCs are inside their homes at night and sleep in beds",async({page})=>{
  await start(page);
  const id=await ev(page,()=>{__BA.world.min=23*60;const n=__BA.npcs.find(n=>n.alive&&__BA.buildings[n.home].kind==="house"&&n.s===0);n.friend=60;return n.id;});
  await page.waitForTimeout(400);
  const r=await ev(page,id=>{const n=__BA.npcs.find(n=>n.id===id);return{inside:n.inside,home:n.home};},id);
  expect(r.inside).toBe(true);
  // locked to strangers, open to friends
  expect(await ev(page,id=>{const n=__BA.npcs.find(n=>n.id===id);const others=__BA.npcs.filter(m=>m.home===n.home);others.forEach(m=>m.friend=0);const l=__BA.doorLocked(__BA.buildings[n.home]);n.friend=60;return l;},id)).toBe(true);
  await ev(page,h=>{const b=__BA.buildings[h];__BA.hero.x=(b.x+1.6)*16;__BA.hero.y=(b.y+b.h)*16+4;__BA.enterBuilding(b);},r.home);
  await page.waitForFunction(()=>!!__BA.room,null,{timeout:3000});
  const inside=await ev(page,id=>__BA.roomNpcs().find(x=>x.n&&x.n.id===id),id);
  expect(inside).toBeTruthy();expect(inside.pose).toBe("sleep");
  await page.waitForTimeout(300);await page.screenshot({path:SHOTS+"v2-interior-night.png"});
});

test("every settlement has 4 reachable gates and the wall blocks entry elsewhere",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const res=await ev(page,()=>{const B=__BA,out=[];B.repairWalls();
    const bfs=(sx,sy,lim,noGate)=>{const seen=new Set([sx+","+sy]),q=[[sx,sy]];while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+","+ny;if(seen.has(k)||Math.abs(nx-sx)>lim||Math.abs(ny-sy)>lim)continue;if(!B.passable(nx,ny))continue;if(noGate&&B.isGate(nx,ny))continue;seen.add(k);q.push([nx,ny]);}}return seen;};
    for(const s of B.SETS){const gates=B.GATES().filter(g=>g.s===s.id);const R=B.wallR(s);
      const inside=bfs(s.x,s.y,R+12,false);
      const reach=gates.filter(g=>{const ox=g.x+g.o[0]*2,oy=g.y+g.o[1]*2;return inside.has(ox+","+oy);}).map(g=>g.d);
      const sealed=bfs(s.x,s.y,R+12,true);let leak=0;for(const k of sealed){const [x,y]=k.split(",").map(Number);if(Math.max(Math.abs(x-s.x),Math.abs(y-s.y))>R+2)leak++;}
      out.push({name:s.name,n:gates.length,dirs:gates.map(g=>g.d).sort().join(""),reach:reach.length,leak});}
    return out;});
  for(const r of res){expect(r.n,r.name).toBe(4);expect(r.dirs,r.name).toBe("ENSW");expect(r.reach,r.name).toBe(4);expect(r.leak,r.name).toBe(0);}
  // a monster cannot walk through a closed gate; the hero is let in
  const blocked=await ev(page,()=>{__BA.world.min=23*60;const g=__BA.GATES()[0];return __BA.gateClosed(g);});
  expect(blocked).toBe(true);
  await page.screenshot({path:SHOTS+"v2-walls.png"});
  expect(errs).toEqual([]);
});

test("Healing Light raises player HP after damage",async({page})=>{
  await start(page);
  const r=await ev(page,()=>{const h=__BA.hero;h.hp=2;__BA.P.mag.mp=100;const before=h.hp;const ok=__BA.castSpell("heal");return{ok,before,after:h.hp,max:h.maxHp};});
  expect(r.ok).not.toBe(false);expect(r.after).toBeGreaterThan(r.before);expect(r.after).toBeLessThanOrEqual(r.max);
});

test("exactly 4 spells (Fire, Thunder Blast, Heal, Air Slash) are castable on a new save",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const r=await ev(page,()=>{const out={};const ks=Object.keys(__BA.SPELLS);for(const k of ks){__BA.P.mag.mp=999;__BA.hero.iframes=0;out[k]=__BA.castSpell(k)!==false;}return{n:ks.length,out,known:__BA.P.mag.known.length};});
  expect(r.n).toBe(4);expect(r.known).toBe(4);expect(Object.keys(r.out).sort().join()).toBe("air,fireball,heal,thunder");for(const k in r.out)expect(r.out[k],k).toBe(true);
  await page.keyboard.press("Digit4");
  expect(await ev(page,()=>__BA.curSpell)).toBe("air");
  expect(errs).toEqual([]);
});

test("tapping a spell hotbar button casts it directly",async({page})=>{
  await start(page);await page.waitForSelector("#sp_fireball");
  await ev(page,()=>{__BA.P.mag.mp=100;__BA.curSpell="heal";});
  const mp0=await ev(page,()=>__BA.P.mag.mp);
  await page.click("#sp_air");
  await page.waitForTimeout(200);
  const r=await ev(page,()=>({mp:__BA.P.mag.mp,xp:__BA.P.mag.xp.air||0}));
  expect(r.xp).toBe(1);expect(r.mp).toBeLessThan(mp0);
  expect(await page.locator(".sp4").count()).toBe(4);await expect(page.locator("#btnA")).toBeVisible();await expect(page.locator("#lvBadge")).toContainText("LV");
});

test("quest marker goes red on accept, green on complete, and disappears on turn-in",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const r1=await ev(page,()=>{const B=__BA;const ws=B.world.sets[0];ws.jobs=ws.jobs.filter(j=>j.taken);const j={id:9001,t:"gather",item:"herb",n:2,reward:20,s:0,text:"Gather 2 "};ws.jobs.push(j);B.P.jobs=[];B.takeJob(j);
    const q=B.quests().find(q=>q.id===9001);return{m:B.questMarkerOf(9001),giver:q&&q.giver,pos:!!(q&&q.pos)};});
  expect(r1.m).toBe("red");expect(r1.giver).not.toBeUndefined();expect(r1.pos).toBe(true);
  await page.waitForTimeout(300);await page.screenshot({path:SHOTS+"v2-quest-marker.png"});
  const m2=await ev(page,()=>{__BA.P.inv.herb=5;return __BA.questMarkerOf(9001);});
  expect(m2).toBe("green");
  // talking to someone other than the giver does not turn it in
  const m3=await ev(page,()=>{const B=__BA;const q=B.quests().find(q=>q.id===9001);const other=B.npcs.find(n=>n.alive&&n.s===0&&n.id!==q.giver&&!n.adv);B.talk(other);B.closeMenu();return B.questMarkerOf(9001);});
  expect(m3).toBe("green");
  const m4=await ev(page,()=>{const B=__BA;const q=B.quests().find(q=>q.id===9001);const g=B.npcs.find(n=>n.id===q.giver);B.talk(g);B.closeMenu();return B.questMarkerOf(9001);});
  expect(m4).toBeNull();
  // guild jobs use the same markers: receptionist + guild hall red, then green, then gone
  const g1=await ev(page,()=>{const B=__BA;const g=B.guild();g.reg=true;g.active=[{id:9002,t:"wood",n:2,min:0,gold:30,pts:5,txt:"Gather 2 wood",s:0}];B.P.inv.wood=0;
    const q=B.quests().find(q=>q.id===9002);return{m:B.questMarkerOf(9002),kind:q.kind,giver:q.giver,hall:!!q.hall};});
  expect(g1.m).toBe("red");expect(g1.kind).toBe("guild");expect(g1.hall).toBe(true);expect(g1.giver).not.toBeUndefined();
  const g2=await ev(page,()=>{__BA.P.inv.wood=5;return __BA.questMarkerOf(9002);});expect(g2).toBe("green");
  await ev(page,()=>__BA.questLog("guild"));await expect(page.locator("#menu h2")).toContainText("Guild");await expect(page.locator("#menu p")).toContainText("READY");await ev(page,()=>__BA.closeMenu());
  const g3=await ev(page,()=>{__BA.guildTurnIn();__BA.closeMenu();return __BA.questMarkerOf(9002);});expect(g3).toBeNull();
  expect(errs).toEqual([]);
});

test("opposing spell projectiles clash: fire vs ice cancel, stronger survives a mismatch",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const r=await ev(page,()=>{const B=__BA,h=B.hero;B.mobs.length=0;B.projectiles.length=0;const x=h.x+60,y=h.y-40;
    B.fx.push({k:"fireball",x:x-4,y,vx:3,vy:0,life:70,dmg:2,r:4});B.projectiles.push({x:x+4,y,vx:-2.4,vy:0,life:80,r:3,dmg:1,col:[160,230,255]});
    const c0=B.clashCount;B.updateClashes();const a={fx:B.fx.filter(f=>f.k==="fireball"&&f.life>0).length,pr:B.projectiles.length,c:B.clashCount-c0};
    B.fx.push({k:"fireball",x:x-4,y:y+30,vx:3,vy:0,life:70,dmg:3,r:4});B.projectiles.push({x:x+4,y:y+30,vx:-2.4,vy:0,life:80,r:3,dmg:1,col:[255,120,30]});B.updateClashes();
    const f=B.fx.find(f=>f.k==="fireball"&&f.life>0);return{a,surv:f?f.dmg:0,pr2:B.projectiles.length};});
  expect(r.a.fx).toBe(0);expect(r.a.pr).toBe(0);expect(r.a.c).toBeGreaterThan(0);
  expect(r.surv).toBe(2);expect(r.pr2).toBe(0);
  expect(errs).toEqual([]);
});

test("bigger world and towns: districts, town-hall guild, river with a bridge",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const r=await ev(page,()=>{const B=__BA;const per=B.SETS.map(s=>({n:s.name,town:s.kind.includes("town"),b:B.buildings.filter(b=>b.s===s.id).length,houses:B.buildings.filter(b=>b.s===s.id&&b.kind==="house").length,
      guild:B.buildings.filter(b=>b.s===s.id&&b.kind==="guild"),districts:[...new Set(B.buildings.filter(b=>b.s===s.id).map(b=>b.district))]}));
    let bridge=0,river=0;for(let y=0;y<B.WH;y++)for(let x=0;x<B.WW;x++){const t=B.tAt(x,y);if(t===21)bridge++;}
    return{area:B.WW*B.WH,isles:B.ISLES.length,pois:B.POIS.length,npcs:B.npcs.length,per:per.map(p=>({...p,guild:p.guild.length,hall:p.guild.every(g=>g.hall)})),bridge,bridgeWalk:(()=>{for(let y=0;y<B.WH;y++)for(let x=0;x<B.WW;x++)if(B.tAt(x,y)===21)return B.passable(x,y);return false;})()};});
  expect(r.area).toBeGreaterThanOrEqual(2*256*192);expect(r.isles).toBeGreaterThanOrEqual(5);expect(r.pois).toBeGreaterThanOrEqual(3);expect(r.npcs).toBeGreaterThan(100);
  for(const p of r.per){if(p.town){expect(p.b,p.n).toBeGreaterThanOrEqual(16);expect(p.guild,p.n).toBe(1);expect(p.hall,p.n).toBe(true);expect(p.districts.length,p.n).toBeGreaterThanOrEqual(2);}else expect(p.b,p.n).toBeGreaterThanOrEqual(8);}
  expect(r.bridge).toBeGreaterThan(0);expect(r.bridgeWalk).toBe(true);
  expect(errs).toEqual([]);
});

test("walls can be repaired with the player's wood",async({page})=>{
  await start(page);
  const r=await ev(page,()=>{const B=__BA;const w=B.WALLS().find(w=>w.s===0);B.damageWall(w.i,99);const broken=B.wallHp(w.i);B.hero.x=w.x*16+2;B.hero.y=w.y*16+18;B.P.inv.wood=5;const ok=B.wallRepairCheck();return{broken,ok,hp:B.wallHp(w.i),wood:B.P.inv.wood,solid:B.solidTile(w.x,w.y)};});
  expect(r.broken).toBe(0);expect(r.ok).toBe(true);expect(r.hp).toBe(10);expect(r.wood).toBe(3);expect(r.solid).toBe(true);
});

test("fluid controls: eased movement, 3-hit combo with hit-stop, dodge removed, casting keeps you moving",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.teleport(170,146);__BA.mobs.length=0;__BA.hero.hp=99;});
  await page.keyboard.down("KeyD");await page.waitForTimeout(60);
  const v1=await ev(page,()=>__BA.hero.vx);await page.waitForTimeout(400);const v2=await ev(page,()=>__BA.hero.vx);
  const x0=await ev(page,()=>__BA.hero.x);await ev(page,()=>{__BA.P.mag.mp=100;__BA.castSpell("air");});await page.waitForTimeout(300);const x1=await ev(page,()=>__BA.hero.x);
  await page.keyboard.up("KeyD");await page.waitForTimeout(50);const v3=await ev(page,()=>__BA.hero.vx);await page.waitForTimeout(500);const v4=await ev(page,()=>__BA.hero.vx);
  expect(v1).toBeGreaterThan(0);expect(v2).toBeGreaterThan(v1);expect(x1).toBeGreaterThan(x0+5);expect(v3).toBeGreaterThan(0);expect(v3).toBeLessThan(v2);expect(v4).toBe(0);
  // combo
  await ev(page,()=>{const h=__BA.hero;window.__mx={combo:0,stop:0};const m=__BA.spawnMob("stonegolem",h.x+16,h.y-4,{persist:true,tst:1});m.hp=m.maxHp=99;m.def={...m.def,beh:"pea"};h.dir=2;
    const id=setInterval(()=>{window.__mx.combo=Math.max(window.__mx.combo,__BA.hero.combo||0);window.__mx.stop=Math.max(window.__mx.stop,__BA.hitStop||0);},5);});
  for(let i=0;i<7;i++){await page.keyboard.press("KeyJ");await page.waitForTimeout(110);}
  const mx=await ev(page,()=>window.__mx);expect(mx.combo).toBe(2);expect(mx.stop).toBeGreaterThan(0);
  await page.waitForTimeout(300);await page.keyboard.press("KeyK");await page.waitForTimeout(30);
  expect(await ev(page,()=>__BA.hero.dodgeT||0)).toBe(0); // dodge input removed
  await page.screenshot({path:SHOTS+"v3-combat.png"});
});

test("Thunder Blast destroys enemy bolts; kills give EXP and level up the LV badge",async({page})=>{
  await start(page);
  const r=await ev(page,()=>{const B=__BA,h=B.hero;B.projectiles.length=0;B.projectiles.push({x:h.x+30,y:h.y,vx:-1,vy:0,life:80,r:3,dmg:1,col:[255,120,30]});B.P.mag.mp=100;B.castSpell("thunder");const left=B.projectiles.length;
    const lv0=B.P.lv||1;B.gainExp(500);return{left,lv0,lv:B.P.lv};});
  expect(r.left).toBe(0);expect(r.lv).toBeGreaterThan(r.lv0);
  await page.waitForTimeout(300);await expect(page.locator("#lvBadge")).toContainText("LV."+String(r.lv).padStart(2,"0"));
  await page.screenshot({path:SHOTS+"v3-hud.png"});
});

test.describe("touch menus",()=>{test.use({hasTouch:true,viewport:{width:844,height:390}});
test("long menus scroll with finger drag + wheel and the last item is tappable",async({page})=>{
  await start(page);
  await ev(page,()=>{window.__picked=null;__BA.showMenu("Long List","Many items",Array.from({length:40},(_,i)=>({l:"Item "+(i+1)+(i<39?" — a fairly long entry with a description that fills the row":""),f:()=>{window.__picked=i+1;}})));});
  const m=page.locator("#menu");await expect(m).toBeVisible();
  const box=await m.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(390);
  const cdp=await page.context().newCDPSession(page);const x=box.x+box.width/2;
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y:box.y+box.height-20}]});
  for(let i=1;i<=10;i++)await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:box.y+box.height-20-i*25}]});
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await page.waitForTimeout(400);
  const s1=await ev(page,()=>document.getElementById("menu").scrollTop);expect(s1).toBeGreaterThan(150);
  expect(await ev(page,()=>window.__picked)).toBe(null); // the drag did not tap anything
  await page.mouse.move(x,box.y+box.height/2);await page.mouse.wheel(0,5000);await page.waitForTimeout(300);
  const last=page.locator("#menu button",{hasText:/^Item 40$/});const lb=await last.boundingBox();expect(lb.y+lb.height).toBeLessThanOrEqual(box.y+box.height+1);
  await page.touchscreen.tap(lb.x+lb.width/2,lb.y+lb.height/2);
  await page.waitForFunction(()=>window.__picked===40,null,{timeout:2000});
  await expect(m).toBeHidden();
});});

test("property: wilderness cabins, buying one, entering, storage and sleeping",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const info=await ev(page,()=>({n:__BA.CABINS.length,isl:__BA.CABINS.some(c=>c.island),props:__BA.CABINS.length}));
  expect(info.n).toBeGreaterThanOrEqual(6);expect(info.n).toBeLessThanOrEqual(10);expect(info.isl).toBe(true);
  // buy at the For Sale sign
  await ev(page,()=>{const B=__BA,c=B.CABINS[1];B.P.gold=2000;B.hero.x=(c.x+2)*16;B.hero.y=(c.y+2)*16;B.snapPrev&&B.snapPrev();});
  await page.waitForTimeout(200);await page.keyboard.press("KeyJ");await page.waitForSelector("#menu:not(.hidden)",{timeout:4000});
  await page.locator("#menu button",{hasText:/^Buy for/}).click();
  const owned=await ev(page,()=>{const B=__BA,b=B.buildings[B.CABINS[1].b];return{own:B.owns(b),homes:B.P.homes.length,gold:B.P.gold};});
  expect(owned.own).toBe(true);expect(owned.homes).toBe(1);expect(owned.gold).toBeLessThan(2000);
  // enter through the door
  await ev(page,()=>{const B=__BA,b=B.buildings[B.CABINS[1].b];B.enterBuilding(b);});
  await page.waitForFunction(()=>__BA.room&&__BA.room.b.cabin,null,{timeout:3000});
  // store and retrieve wood in this home's chest
  const st=await ev(page,()=>{const B=__BA,b=B.room.b;B.P.inv.wood=7;B.homeStorage(b);const dep=[...document.querySelectorAll("#menu button")].find(x=>x.textContent.startsWith("Deposit Wood"));dep.click();
    const stored=B.P.homeStore[b.id].wood,inv1=B.P.inv.wood;B.homeStorage(b);[...document.querySelectorAll("#menu button")].find(x=>x.textContent.startsWith("Withdraw Wood")).click();return{stored,inv1,inv2:B.P.inv.wood,left:B.P.homeStore[b.id].wood};});
  expect(st.stored).toBe(7);expect(st.inv1).toBe(0);expect(st.inv2).toBe(7);expect(st.left).toBe(0);
  await ev(page,()=>__BA.closeMenu&&__BA.closeMenu());
  // walk to bed and sleep
  await ev(page,()=>{const B=__BA;B.world.min=22*60;B.hero.hp=1;B.P.mag.mp=3;B.hero.x=1.5*16-6;B.hero.y=4.3*16;B.hero.dir=3;});
  await ev(page,()=>__BA.roomInteract());
  await page.waitForFunction(()=>__BA.world.min%1440>=6*60&&__BA.world.min%1440<9*60,null,{timeout:4000});
  const r=await ev(page,()=>({hp:__BA.hero.hp,max:__BA.hero.maxHp,mp:__BA.P.mag.mp,mx:__BA.P.mag.max,saved:!!localStorage.getItem(__BA.SAVEKEY||"realmTenWindsSave3")}));
  expect(r.hp).toBe(r.max);expect(r.mp).toBe(r.mx);expect(r.saved).toBe(true);
  await page.waitForTimeout(500);await page.screenshot({path:SHOTS+"v3-cabin-inside.png"});
  expect(errs).toEqual([]);
});

test("shops list real estate with a preview",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.realEstate(0);});
  await expect(page.locator("#menu h2")).toContainText("Real Estate");
  await page.locator("#menu .mbtns button").first().click();
  await expect(page.locator("#menu img.homePrev")).toBeVisible();await expect(page.locator("#menu")).toContainText("Price:");
});

test.describe("touch guild",()=>{test.use({hasTouch:true});
test("guild board with 20+ jobs scrolls on a small phone and the last job can be accepted",async({page})=>{
  await page.setViewportSize({width:375,height:667});
  await start(page);
  await ev(page,()=>{const g=__BA.guildObj();g.reg=true;g.rank=5;g.active=[];const jobs=__BA.genGuildJobs();const base=jobs[0];jobs.length=0;
    for(let i=0;i<24;i++)jobs.push({...base,id:"T"+i,txt:"Test job number "+(i+1)+" — clear the road of bandits",min:0,claimed:null});__BA.guildMenu(0);});
  const m=page.locator("#menu");await expect(m).toBeVisible();
  const last=page.locator("#menu button",{hasText:"Test job number 24 "});
  await page.mouse.move(187,330);for(let i=0;i<12;i++){await page.mouse.wheel(0,600);await page.waitForTimeout(40);}await page.waitForTimeout(300);
  const box=await m.boundingBox();const lb=await last.boundingBox();expect(lb.y).toBeGreaterThanOrEqual(box.y-1);expect(lb.y+lb.height).toBeLessThanOrEqual(box.y+box.height+1);
  await page.touchscreen.tap(lb.x+lb.width/2,lb.y+lb.height/2);
  await expect(page.locator("#menu h2")).toContainText("Test job number 24");
  const acc=page.locator("#menu button",{hasText:"Accept job"});await acc.scrollIntoViewIfNeeded();const ab=await acc.boundingBox();
  expect(ab.y+ab.height).toBeLessThanOrEqual(667);
  await page.touchscreen.tap(ab.x+ab.width/2,ab.y+ab.height/2);
  await page.waitForFunction(()=>__BA.guildObj().active.some(a=>a.id==="T23"),null,{timeout:2000});
});});

test("spells tab: levels, XP, stats and perks unlock and persist",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.P.mag.xp.fireball=30;__BA.spellsMenu();});
  await expect(page.locator("#menu h2")).toHaveText("Spells");
  for(const n of ["Fire","Thunder Blast","Heal","Air Slash"])await expect(page.locator("#menu button",{hasText:n}).first()).toBeVisible();
  await page.locator("#menu button",{hasText:"Fire"}).first().click();
  const p=await page.locator("#menu p").textContent();
  for(const s of ["XP","Damage","Mana","Cooldown","Next level","Split Fire"])expect(p).toContain(s);
  await page.locator("#menu button",{hasText:"Unlock Split Fire"}).click();
  expect(await ev(page,()=>__BA.hasPerk("fireball","split"))).toBe(true);
  // locked perk stays locked
  await page.locator("#menu button",{hasText:"Unlock Inferno"}).click({force:true});
  expect(await ev(page,()=>__BA.hasPerk("fireball","inferno"))).toBe(false);
  // split fire produces 3 orbs
  const n=await ev(page,()=>{__BA.P.mag.mp=100;__BA.closeMenu&&__BA.closeMenu();const F=()=>typeof __BA.fx==="function"?__BA.fx():__BA.fx;__BA.castSpell("fireball");return F().filter(f=>f.k==="fireball").length;});
  expect(n).toBe(3);
  await ev(page,()=>__BA.saveGame());await page.reload();await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");await page.waitForFunction(()=>__BA.state==="play");
  expect(await ev(page,()=>__BA.hasPerk("fireball","split"))).toBe(true);
});

for(const vp of [{n:"iPhone SE",w:667,h:375},{n:"iPhone 15",w:852,h:393},{n:"iPhone 14 landscape",w:844,h:390},{n:"iPad",w:1180,h:820},{n:"iPad portrait",w:820,h:1180},{n:"iPhone 15 portrait",w:393,h:852},{n:"iPhone 14 portrait",w:390,h:844},{n:"iPhone SE portrait",w:375,h:667},{n:"iPhone Pro Max portrait",w:430,h:932}]){
test("HUD has no overlapping controls on "+vp.n,async({page})=>{
  await page.setViewportSize({width:vp.w,height:vp.h});await start(page);await page.waitForTimeout(300);
  const boxes=await ev(page,()=>{const sel=["#btnA","#btnB",".sp4","#tl","#hudR","#bars","#stickBase","#hudL"];const out=[];
    for(const s of sel)for(const el of document.querySelectorAll(s)){const r=el.getBoundingClientRect();if(r.width&&getComputedStyle(el).display!=="none")out.push({id:el.id||s,x:r.x,y:r.y,w:r.width,h:r.height});}return out;});
  expect(boxes.length).toBeGreaterThanOrEqual(9);
  const cv=await ev(page,()=>{const r=document.getElementById("game").getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
  if(vp.h>vp.w){expect(cv.w).toBeGreaterThanOrEqual(vp.w-1);expect(cv.h).toBeGreaterThan(vp.w*0.5);expect(cv.y).toBeGreaterThan(40);
    for(const b of boxes){const hit=b.x<cv.x+cv.w&&cv.x<b.x+b.w&&b.y<cv.y+cv.h&&cv.y<b.y+b.h;expect(hit,`${b.id} is drawn over the game window`).toBe(false);}}
  else{expect(cv.x).toBeLessThanOrEqual(0.5);expect(cv.y).toBeLessThanOrEqual(0.5);expect(cv.w).toBeGreaterThanOrEqual(vp.w-1);expect(cv.h).toBeGreaterThanOrEqual(vp.h-1);}
  for(const b of boxes){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(vp.w+.5);expect(b.y+b.h).toBeLessThanOrEqual(vp.h+.5);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];
    const ov=a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;expect(ov,`${a.id} overlaps ${b.id}`).toBe(false);}
  if(vp.n==="iPhone 15")await page.screenshot({path:SHOTS+"v6-hud.png"});
});}

test("guild board stays stocked: adventurers can't empty it, refills after a day, towns offer odd jobs",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const r=await ev(page,()=>{const B=__BA,g=B.guildObj();g.reg=true;B.world.min=10*60;
    const open=()=>B.genGuildJobs().filter(j=>!j.claimed&&j.min<=g.rank&&!g.active.some(a=>a.id===j.id));
    for(let i=0;i<60;i++)B.advHourly();const claimed=B.genGuildJobs().filter(j=>j.claimed).length;const o1=open().length;
    B.world.day++;for(let i=0;i<60;i++)B.advHourly();const o2=open();
    const types=new Set(B.genGuildJobs().map(j=>j.t));const above=B.genGuildJobs().filter(j=>j.min===g.rank+1&&!j.claimed).length;
    const odd=B.SETS.filter(s=>!s.island).map(s=>B.oddJobs(s.id).length);
    return{claimed,o1,o2:o2.length,reserved:o2.filter(j=>j.reserved).length,types:[...types],above,odd};});
  expect(r.claimed).toBeGreaterThan(0);
  expect(r.o1).toBeGreaterThanOrEqual(5);expect(r.o2).toBeGreaterThanOrEqual(5);expect(r.reserved).toBeGreaterThanOrEqual(3);
  expect(r.above).toBeGreaterThanOrEqual(2);
  for(const t of ["hunt","wood","part","escort"])expect(r.types).toContain(t);
  for(const n of r.odd)expect(n).toBeGreaterThanOrEqual(3);
  await ev(page,()=>__BA.guildMenu(0));
  expect(await page.locator("#menu button.job.ok").count()).toBeGreaterThanOrEqual(5);
  await ev(page,()=>__BA.oddJobsMenu(0));await expect(page.locator("#menu h2")).toContainText("Odd jobs");
  expect(errs).toEqual([]);
});

test("adventurer party walks out of town to the job, fights, returns carrying loot",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const r=await ev(page,()=>{const B=__BA;B.world.min=10*60;const R=Math.random;Math.random=()=>0.1;try{B.advHourly();}finally{Math.random=R;}
    const n=B.advs().find(n=>n.adv.state==="travel");if(!n)return null;const a=n.adv,T=16,home={x:a.from.x*T,y:a.from.y*T};const out=[];
    for(const p of [0.05,0.3,0.5,0.75,0.98]){B.world.min=(a.t0+(a.eta-a.t0)*p)-B.world.day*1440;const q=B.advWorldPos(n);out.push({p,d:Math.hypot(q.x-home.x,q.y-home.y)/T,ph:a.phase,carry:a.carry});}
    B.world.min=a.eta-B.world.day*1440+1;B.advHourly();return{out,back:n.adv.state,dist:Math.hypot(a.to?0:0,0)};});
  expect(r).not.toBeNull();
  expect(r.out[1].d).toBeGreaterThan(r.out[0].d);expect(r.out[1].d).toBeGreaterThan(6); // past the gate
  expect(r.out[2].ph).toBe("fight");expect(r.out[3].ph).toBe("back");expect(r.out[3].carry).toBe(true);
  expect(r.out[4].d).toBeLessThan(r.out[2].d);expect(r.back).toBe("town");
  expect(errs).toEqual([]);
});

test("new regions (lakes, swamp, desert) are reachable on foot, the tundra by boat",async({page})=>{
  await start(page);
  const r=await ev(page,()=>{const B=__BA,W=B.WW,seen=new Uint8Array(W*B.WH);const s0=B.SETS[0];const q=[s0.x+(s0.y+1)*W];seen[q[0]]=1;
    for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=(i/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=B.WH)continue;const j=nx+ny*W;if(seen[j]||!B.passable(nx,ny))continue;seen[j]=1;q.push(j);}}
    const at=n=>{const s=B.SETS.find(s=>s.name===n);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(seen[(s.x+dx)+(s.y+dy)*W])return true;return false;};
    const rime=B.SETS.find(s=>s.name==="Rimeholt");return{lake:at("Lakemere"),bog:at("Bogsend"),dune:at("Dunerest"),rimeIsland:!!rime.island,rimeHarbor:!!rime.harbor};});
  expect(r).toEqual({lake:true,bog:true,dune:true,rimeIsland:true,rimeHarbor:true});
});

test("sprint: Shift runs ~1.6x on land and swims ~1.8x, draining stamina that regenerates on release",async({page})=>{
  await start(page);
  const speed=async(sprint)=>{await ev(page,()=>{__BA.mobs.length=0;__BA.hero.stam=100;});if(sprint)await page.keyboard.down("ShiftLeft");await page.keyboard.down("KeyD");await page.waitForTimeout(500);
    const a=await ev(page,()=>__BA.hero.x);await page.waitForTimeout(600);const b=await ev(page,()=>({x:__BA.hero.x,st:__BA.hero.stam,sp:__BA.hero.sprinting}));await page.keyboard.up("KeyD");if(sprint)await page.keyboard.up("ShiftLeft");return{d:b.x-a,st:b.st,sp:b.sp};};
  const swimSpot=await ev(page,()=>{const B=__BA;for(let y=20;y<B.WH-20;y++)for(let x=20;x<B.WW-40;x++){let ok=true;for(let k=0;k<30&&ok;k++)ok=B.tAt(x+k,y)===B.DEEP&&B.tAt(x+k,y-1)===B.DEEP&&B.tAt(x+k,y+1)===B.DEEP;if(ok)return{x,y};}return null;});
  const put=async(p)=>{await ev(page,p=>{__BA.teleport(p.x,p.y);__BA.hero.boat=false;},p);await page.waitForTimeout(200);};
  await put({x:170,y:146});const w=await speed(false);await put({x:170,y:146});const r=await speed(true);
  expect(r.sp).toBe(true);expect(r.d/w.d).toBeGreaterThan(1.35);expect(r.st).toBeLessThan(100);
  await put(swimSpot);const s1=await speed(false);await put(swimSpot);const s2=await speed(true);
  expect(s2.d/s1.d).toBeGreaterThan(1.5);expect(s2.st).toBeLessThan(s1.st);
  await put({x:170,y:146});await ev(page,()=>{__BA.hero.stam=40;});await page.waitForTimeout(500);expect(await ev(page,()=>__BA.hero.stam)).toBeGreaterThan(40);
});

test("bag: select a potion, see details, use it — HP up, count down; quick slot works",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  await ev(page,()=>{const B=__BA;B.P.inv.potion=3;B.P.inv.mpot=1;B.hero.maxHp=8;B.hero.hp=2;B.bagMenu();});
  await expect(page.locator("#menu h2")).toHaveText("Bag");
  await page.locator("#menu button.item",{hasText:"Health Potion"}).click();
  await expect(page.locator("#menu button.item.sel")).toContainText("Health Potion");
  const p=await page.locator("#menu p").textContent();expect(p).toContain("Health Potion");expect(p).toContain("×3");expect(p).toContain("restores");
  await page.locator("#menu button",{hasText:/^Use$/}).click();
  const r=await ev(page,()=>({hp:__BA.hero.hp,n:__BA.P.inv.potion}));expect(r.hp).toBe(6);expect(r.n).toBe(2);
  await page.locator("#menu button",{hasText:"Set quick slot 1"}).click();await ev(page,()=>__BA.closeMenu());
  await ev(page,()=>{__BA.hero.hp=1;});await page.locator("#qs0").click();
  expect(await ev(page,()=>({hp:__BA.hero.hp,n:__BA.P.inv.potion}))).toEqual({hp:5,n:1});
  expect(errs).toEqual([]);
});

test("hunger: HUD bar, eating from the bag refills it, sprinting drains it, never kills",async({page})=>{
  await start(page);await page.waitForTimeout(300);
  await expect(page.locator("#hgFill")).toBeVisible();
  await ev(page,()=>{__BA.P.hunger=20;__BA.P.inv.bread=1;__BA.bagMenu("bread");});
  await page.locator("#menu button",{hasText:/^Eat$/}).click();
  expect(await ev(page,()=>__BA.P.hunger)).toBeGreaterThanOrEqual(59);
  await ev(page,()=>{__BA.closeMenu();__BA.P.hunger=0;__BA.hero.hp=1;__BA.world.min+=0;});
  await page.waitForTimeout(1500);expect(await ev(page,()=>__BA.hero.hp)).toBeGreaterThanOrEqual(1);expect(await ev(page,()=>__BA.hero.dead||false)).toBe(false);
});

test("rotating mid-game re-fits canvas and HUD (portrait handheld / landscape overlay) without losing state",async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page);
  await ev(page,()=>{__BA.P.gold=777;});
  const check=async(w,h)=>{await page.setViewportSize({width:w,height:h});await page.waitForTimeout(300);
    const r=await ev(page,()=>{const c=document.getElementById("game").getBoundingClientRect();const out=[];for(const s of ["#btnA","#btnB",".sp4","#tl","#hudR","#bars","#stickBase","#hudL"])for(const el of document.querySelectorAll(s)){const b=el.getBoundingClientRect();if(b.width)out.push({id:el.id||s,x:b.x,y:b.y,w:b.width,h:b.height});}
      return{c:{w:c.width,h:c.height,x:c.x,y:c.y},out,st:__BA.state,g:__BA.P.gold};});
    expect(r.st).toBe("play");expect(r.g).toBe(777);
    if(h>w){expect(r.c.w).toBeGreaterThanOrEqual(w-1);for(const b of r.out)expect(b.x<r.c.x+r.c.w&&r.c.x<b.x+b.w&&b.y<r.c.y+r.c.h&&r.c.y<b.y+b.h,`${b.id} over canvas`).toBe(false);}
    else{expect(r.c.x).toBeLessThanOrEqual(.5);expect(r.c.y).toBeLessThanOrEqual(.5);expect(r.c.w).toBeGreaterThanOrEqual(w-1);expect(r.c.h).toBeGreaterThanOrEqual(h-1);}
    for(const b of r.out){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(w+.5);expect(b.y+b.h).toBeLessThanOrEqual(h+.5);}
    for(let i=0;i<r.out.length;i++)for(let j=i+1;j<r.out.length;j++){const a=r.out[i],b=r.out[j];expect(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h,`${a.id} overlaps ${b.id} at ${w}x${h}`).toBe(false);}};
  await check(390,844);await check(844,390);await check(390,844);await check(667,375);
});

test.describe("menus fit short iPhone viewports",()=>{test.use({hasTouch:true,viewport:{width:390,height:664}});
test("every menu scrolls to its last item and closes with the X, backdrop or Escape",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  await ev(page,()=>{const B=__BA,g=B.guildObj();g.reg=true;g.rank=5;const J=B.genGuildJobs();for(let i=0;i<26;i++)J.push({...J[0],id:"M"+i,txt:"Padding job "+(i+1)+" — a long description that wraps onto two lines",min:0,claimed:null});
    for(const k of ["potion","mpot","tonic","bread","fish","berry","wood","herb","pie","antidote","stew","roast"])B.P.inv[k]=3;});
  const menus={guild:()=>__BA.guildMenu(0),bag:()=>__BA.bagMenu(),shop:()=>__BA.shopMenu(0),spells:()=>__BA.spellsMenu(),odd:()=>__BA.oddJobsMenu(0),quests:()=>__BA.questLog(),pause:()=>document.getElementById("btnPause").click()};
  for(const [name,fn] of Object.entries(menus)){
    await ev(page,`(${fn.toString()})()`);const m=page.locator("#menu");await expect(m).toBeVisible();
    const x=page.locator("#menu .mclose");await expect(x).toBeVisible();
    await page.mouse.move(195,330);for(let i=0;i<15;i++){await page.mouse.wheel(0,800);await page.waitForTimeout(30);}await page.waitForTimeout(250);
    const r=await ev(page,()=>{const m=document.getElementById("menu"),mb=m.getBoundingClientRect(),bs=[...m.querySelectorAll(".mbtns button")],l=bs[bs.length-1].getBoundingClientRect(),xb=m.querySelector(".mclose").getBoundingClientRect();
      return{mb:{t:mb.top,b:mb.bottom},l:{t:l.top,b:l.bottom},x:{t:xb.top,b:xb.bottom},vh:innerHeight};});
    expect(r.mb.b,name).toBeLessThanOrEqual(r.vh);expect(r.l.b,name+" last item").toBeLessThanOrEqual(r.mb.b);expect(r.l.t,name).toBeGreaterThanOrEqual(r.mb.t);
    expect(r.x.t,name+" X visible").toBeGreaterThanOrEqual(r.mb.t-1);
    await x.click();await expect(m,name).toBeHidden();
  }
  await ev(page,()=>__BA.bagMenu());await page.mouse.click(5,5);await expect(page.locator("#menu")).toBeHidden();
  await ev(page,()=>__BA.bagMenu());await page.keyboard.press("Escape");await expect(page.locator("#menu")).toBeHidden();
  expect(errs).toEqual([]);
});});

test("profanity setting (on by default, saved) changes NPC banter",async({page})=>{
  await start(page);
  const rough=/\b(damn|hell|shit|bastards?|ass)\b/i;
  const get=()=>ev(page,()=>{const B=__BA,n=B.npcs.find(n=>n.alive&&n.role==="guard")||B.npcs.find(n=>n.alive&&n.adv);return B.dialogLines(n).join(" ");});
  expect(await ev(page,()=>__BA.P.prof!==false)).toBe(true);
  expect(await get()).toMatch(rough);
  await page.locator("#btnPause").click();await page.locator("#menu button",{hasText:"Profanity: on"}).click();
  expect(await ev(page,()=>__BA.P.prof)).toBe(false);
  expect(await get()).not.toMatch(rough);
  expect(await ev(page,()=>JSON.parse(localStorage.getItem(__BA.SAVEKEY)).P?.prof??JSON.parse(localStorage.getItem(__BA.SAVEKEY)).prof)).toBe(false);
});

test("some adult townswomen flirt visibly as the hero walks by (cooldown, affection, never children)",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const r=await ev(page,()=>{const B=__BA;B.world.min=11*60;const f=B.npcs.filter(n=>B.isFlirty(n));const kids=B.npcs.filter(n=>n.age<18&&B.isFlirty(n)).length;
    const n=f.find(n=>!n.inside);n.inside=false;B.hero.x=n.x+20;B.hero.y=n.y+4;window.__fn=n;return{count:f.length,total:B.npcs.length,kids,f0:n.friend||0};});
  expect(r.count).toBeGreaterThan(0);expect(r.count).toBeLessThan(r.total/2);expect(r.kids).toBe(0);
  await page.waitForFunction(()=>__BA.bubbles().some(b=>b.n===window.__fn),null,{timeout:3000});
  const a=await ev(page,()=>({fx:__BA.flirtFx().some(f=>f.n===window.__fn),friend:window.__fn.friend||0,cd:window.__fn.flirtCd}));
  expect(a.fx).toBe(true);expect(a.friend).toBeGreaterThan(r.f0);
  await page.waitForTimeout(500);expect(await ev(page,()=>window.__fn.flirted)).toBe(1); // cooldown: no spam
  expect(errs).toEqual([]);
});

test("nights: torch-bearing guards and night owls outside, tavern busy with dancers and chatter",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  await ev(page,()=>{const B=__BA;B.world.min=22*60;const s=B.SETS[0];B.teleport(s.x,s.y+3);});await page.waitForTimeout(1200);
  const o=await ev(page,()=>({torches:__BA.npcs.filter(n=>n.torch&&n._nightOut&&!n.inside).length,owls:__BA.npcs.filter(n=>n._nightOut&&!n.torch).length}));
  expect(o.torches).toBeGreaterThan(0);expect(o.owls).toBeGreaterThan(0);
  await ev(page,()=>{const B=__BA;B.enterBuilding(B.buildings.find(b=>b.kind==="inn"&&b.s===0));});await page.waitForFunction(()=>__BA.room,null,{timeout:5000});await page.waitForTimeout(2500);
  const t=await ev(page,()=>{const L=__BA.roomNpcs();return{n:L.filter(r=>r.n).length,dance:L.filter(r=>r.pose==="dance").length,fx:__BA.tavFx().length};});
  expect(t.n).toBeGreaterThanOrEqual(6);expect(t.dance).toBeGreaterThanOrEqual(1);expect(t.fx).toBeGreaterThan(0);
  expect(errs).toEqual([]);
});

test("NPCs never walk faster than the hero's normal walk speed",async({page})=>{
  await start(page);
  for(const [min,dx,dy] of [[10*60,0,3],[22*60,0,3]]){
    await ev(page,([m,dx,dy])=>{const B=__BA,s=B.SETS[0];B.world.min=m;B.teleport(s.x+dx,s.y+dy);B.resetNpcMax();},[min,dx,dy]);
    await page.waitForTimeout(800);await ev(page,()=>__BA.resetNpcMax());
    const flirt=await ev(page,()=>{const B=__BA,n=B.npcs.find(n=>B.isFlirty(n)&&!n.inside);if(n){n.followT=200;n.flirtCd=0;B.hero.x=n.x+30;B.hero.y=n.y;}return!!n;});
    await page.waitForTimeout(2500);
    const r=await ev(page,()=>({max:__BA.npcMaxStep(),walk:__BA.HERO_WALK}));
    expect(r.max).toBeGreaterThan(0.05); // they do move
    expect(r.max).toBeLessThanOrEqual(r.walk+1e-6);
  }
  // the hero's own normal walk is at least that fast
  await ev(page,()=>{__BA.teleport(170,146);});await page.keyboard.down("KeyD");await page.waitForTimeout(500);const x0=await ev(page,()=>__BA.hero.x);await page.waitForTimeout(500);const x1=await ev(page,()=>__BA.hero.x);await page.keyboard.up("KeyD");
  expect((x1-x0)/30).toBeGreaterThanOrEqual(1.0);
});

test("spell visuals scale with rank: effect size and particle count grow from Lv1 to Lv5 to Lv10",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);await ev(page,()=>{__BA.teleport(170,146);__BA.mobs.length=0;});
  for(const k of ["fireball","thunder","heal","air"]){const out=[];
    for(const lv of [1,5,10]){out.push(await ev(page,([k,lv])=>{const B=__BA;B.P.mag.xp[k]=(lv-1)*8;B.P.mag.mp=999;for(const s in B.SPCD)B.SPCD[s]=0;B.particles().length=0;B.castSpell(k);return B.lastCastFx();},[k,lv]));await page.waitForTimeout(150);}
    expect(out.map(o=>o.lv)).toEqual([1,5,10]);expect(out.map(o=>o.tier)).toEqual([0,1,3]);
    expect(out[1].scale).toBeGreaterThan(out[0].scale);expect(out[2].scale).toBeGreaterThan(out[1].scale);
    expect(out[1].particles).toBeGreaterThan(out[0].particles);expect(out[2].particles).toBeGreaterThan(out[1].particles);
  }
  expect(await ev(page,()=>__BA.particles().length)).toBeLessThanOrEqual(650);
  expect(errs).toEqual([]);
});

test("guild buys monster parts: sell 1 raises gold and removes the part; sell all; guild beats shops",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));await start(page);
  const r=await ev(page,()=>{const B=__BA,P=B.P;P.inv.fang=3;P.inv.dheart=1;P.gold=0;const pf=B.guildPartPrice("fang"),pd=B.guildPartPrice("dheart");
    B.sellPart("fang",1);const a={g:P.gold,f:P.inv.fang};B.sellPart("fang",99);const b={g:P.gold,f:P.inv.fang||0};
    const g=B.guildObj();g.reg=true;B.guildMenu(0);const hasBtn=[...document.querySelectorAll("#menu button")].some(x=>/Sell Monster Parts/.test(x.textContent));
    B.boardMenu(0);const hasBoard=[...document.querySelectorAll("#menu button")].some(x=>/Sell Monster Parts/.test(x.textContent));
    B.partSellMenu(()=>{});const rows=[...document.querySelectorAll("#menu button")].map(x=>x.textContent);
    return{pf,pd,a,b,hasBtn,hasBoard,rows,shop:Math.round(9*0.5)};});
  expect(r.a).toEqual({g:r.pf,f:2});expect(r.b).toEqual({g:r.pf*3,f:0});
  expect(r.pd).toBeGreaterThan(r.pf*20);expect(r.pf).toBeGreaterThan(r.shop);
  expect(r.hasBtn).toBe(true);expect(r.hasBoard).toBe(true);expect(r.rows.some(t=>/Dragon Heart/.test(t))).toBe(true);
  expect(errs).toEqual([]);});

test("kill guild points scale with monster power and count toward rank; kills tracked on Guild Card",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));await start(page);
  const r=await ev(page,()=>{const B=__BA;const g=B.guildObj();g.reg=true;g.rank=0;g.pts=0;B.teleport(170,146);B.mobs.length=0;
    const gp=sp=>{const m=B.spawnMob(sp,B.hero.x+200,B.hero.y,{persist:true});return B.killGP(m);};
    const s=gp("slime"),o=gp("orc"),w=gp("warchief");const d=B.killGP({sp:"dragon",maxHp:200,def:{}});
    const m=B.spawnMob("orc",B.hero.x+200,B.hero.y,{persist:true});B.onKill(m);
    return{s,o,w,d,pts:g.pts,card:B.guildCard(),last:window.__lastGP};});
  expect(r.s).toBe(1);expect(r.o).toBeGreaterThan(r.s);expect(r.w).toBeGreaterThan(r.o);expect(r.d).toBeGreaterThanOrEqual(50);
  expect(r.pts).toBe(r.o);expect(r.last).toBe(r.o);expect(r.card).toMatch(/Kills by type: .*×1/);
  expect(errs).toEqual([]);});

test("Thunder Blast fires a bolt in the facing direction and chains to nearby monsters with falloff",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));await start(page);
  const r=await ev(page,()=>{const B=__BA,h=B.hero;B.teleport(170,146);B.mobs.length=0;h.dir=2;B.P.mag.mp=999;B.P.mag.xp.thunder=72;for(const s in B.SPCD)B.SPCD[s]=0;
    B.castSpell("thunder");const b=B.tbolts()[0];const x0=b.x;B.updateMagic();return{vx:b.vx,vy:b.vy,moved:b.x-x0};});
  expect(r.vx).toBeGreaterThan(5);expect(Math.abs(r.vy)).toBeLessThan(0.01);expect(r.moved).toBeGreaterThan(0);
  const c=await ev(page,()=>{const B=__BA,h=B.hero;B.mobs.length=0;B.tbolts().length=0;h.dir=1;B.P.mag.xp.thunder=72;for(const s in B.SPCD)B.SPCD[s]=0;
    const ms=[[-60,0],[-100,10],[-130,-20],[-160,5]].map(([dx,dy])=>{const m=B.spawnMob("orc",h.x+dx,h.y+dy,{persist:true});m.hp=m.maxHp=99;return m;});
    const far=B.spawnMob("orc",h.x+200,h.y+150,{persist:true});far.hp=far.maxHp=99;
    B.castSpell("thunder");for(let i=0;i<20;i++)B.updateMagic();return{hit:B.lastChain(),hurt:ms.map(m=>99-m.hp),far:99-far.hp};});
  expect(c.hit.hit).toBeGreaterThanOrEqual(4);for(const d of c.hurt)expect(d).toBeGreaterThan(0);expect(c.far).toBe(0);
  for(let i=1;i<c.hit.dmgs.length;i++)expect(c.hit.dmgs[i]).toBeLessThanOrEqual(c.hit.dmgs[i-1]);
  const lo=await ev(page,()=>{const B=__BA;B.P.mag.xp.thunder=0;for(const s in B.SPCD)B.SPCD[s]=0;B.castSpell("thunder");return B.tbolts().slice(-1)[0].jumps;});
  expect(lo).toBe(2);expect(errs).toEqual([]);});

test("a town guard spots a monster near town, shouts, runs to engage and swings at it",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));await start(page);
  const r=await ev(page,()=>{const B=__BA;const g=B.npcs.find(n=>n.alive&&n.role==="guard"&&!n.inside);if(!g)return null;
    B.teleport(Math.floor(g.x/16),Math.floor(g.y/16)+3);B.mobs.length=0;const m=B.spawnMob("orc",g.x+70,g.y,{persist:true});m.hp=m.maxHp=99;m.def={...m.def,beh:"agg"};
    const x0=g.x,y0=g.y;B.guardTick(g);const eng=!!g.engage;for(let i=0;i<4;i++)B.guardTick(g);const step=Math.hypot(g.x-x0,g.y-y0)/5;for(let i=0;i<200;i++)B.guardTick(g);return{eng,step,run:B.GUARD_RUN,dmg:99-m.hp,ghp:g.ghp};});
  expect(r).not.toBeNull();expect(r.eng).toBe(true);expect(r.step).toBeGreaterThan(1.15);expect(r.dmg).toBeGreaterThan(0);
  expect(errs).toEqual([]);});

test("max HP and max MP rise on level up and refill",async({page})=>{
  await start(page);
  const r=await ev(page,()=>{const B=__BA,P=B.P,h=B.hero;const h0=h.maxHp,m0=P.mag.max;h.hp=1;P.mag.mp=0;B.gainExpG(B.expNeed(P.lv||1));
    return{h0,m0,h:h.maxHp,m:P.mag.max,hp:h.hp,mp:P.mag.mp,hp10:B.hpForLv(10)-B.hpForLv(9),hp3:B.hpForLv(3)-B.hpForLv(2)};});
  expect(r.h).toBeGreaterThan(r.h0);expect(r.m).toBeGreaterThan(r.m0);expect(r.hp).toBe(r.h);expect(r.mp).toBe(r.m);expect(r.hp10).toBeGreaterThan(r.hp3);});

test("crowded town: NPCs spread out, no overlaps and idle NPCs never share a tile",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));await start(page);
  const r=await ev(page,()=>{const B=__BA,h=B.hero;B.mobs.length=0;const L=B.npcs.filter(n=>n.alive&&!n.inside&&n.s===0&&!n.adv).slice(0,14);
    const bx=h.x+20,by=h.y;L.forEach((n,i)=>{n.x=bx+(i%3);n.y=by+(i%2);n.pauseT=600;});
    for(let i=0;i<360;i++)B.update();
    let minD=1e9,shared=0;const cs=L.map(n=>[n.x+8,n.y+12,n._mv]);
    for(let i=0;i<cs.length;i++){for(let j=i+1;j<cs.length;j++){const d=Math.hypot(cs[i][0]-cs[j][0],cs[i][1]-cs[j][1]);minD=Math.min(minD,d);
      if(!cs[i][2]&&!cs[j][2]&&Math.floor(cs[i][0]/16)===Math.floor(cs[j][0]/16)&&Math.floor(cs[i][1]/16)===Math.floor(cs[j][1]/16))shared++;}}
    const hd=Math.min(...cs.map(c=>Math.hypot(c[0]-h.x-6,c[1]-h.y-6)));return{n:L.length,minD,shared,hd};});
  expect(r.n).toBeGreaterThan(6);expect(r.minD).toBeGreaterThan(7);expect(r.shared).toBe(0);expect(r.hd).toBeGreaterThan(8);expect(errs).toEqual([]);});
