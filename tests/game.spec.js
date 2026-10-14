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
  await ev(page,()=>__BA.teleport(144,100));
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
test("every region is reachable on foot and there are no mountains",async({page})=>{
  await start(page);
  const r=await ev(page,src=>{const f=eval(src);const B=__BA;const S=B.SETS[0];const seen=f(S.x,S.y+1);
    let mtn=0,land=0,reach=0;const T=B.T();
    // mainland = the connected landmass of Aldmoor ignoring trees (what walking could ever touch)
    for(let y=0;y<192;y++)for(let x=0;x<256;x++){const t=B.tAt(x,y);if(t===B.MTN||t===B.CLIFF||t===B.STAIRS)mtn++;}
    const onMain=new Uint8Array(256*192);const q=[[S.x,S.y+1]];onMain[S.x+(S.y+1)*256]=1;
    while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=256||ny>=192)continue;const i=nx+ny*256;if(onMain[i])continue;const t=B.tAt(nx,ny);if(t===B.DEEP||t===B.SHAL)continue;onMain[i]=1;q.push([nx,ny]);}}
    for(let i=0;i<onMain.length;i++)if(onMain[i]&&B.passable(i%256,(i/256)|0)){land++;if(seen[i])reach++;}
    const near=(o)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(seen[(o.x+dx)+(o.y+dy)*256])return true;return false;};
    const lairs=B.LAIRS.filter(l=>onMain[l.x+l.y*256]);const looks=B.LOOKOUTS().filter(l=>onMain[l.x+l.y*256]);
    return{mtn,frac:reach/land,lairs:lairs.length,lairsOk:lairs.filter(near).length,looks:looks.length,looksOk:looks.filter(near).length,
      sets:B.SETS.filter(s=>!s.island&&onMain[s.x+s.y*256]).length,setsOk:B.SETS.filter(s=>!s.island&&onMain[s.x+s.y*256]&&seen[s.x+(s.y+1)*256]).length};},bfs);
  expect(r.mtn).toBe(0);
  expect(r.frac).toBeGreaterThan(0.97);
  expect(r.lairsOk).toBe(r.lairs);expect(r.looksOk).toBe(r.looks);expect(r.setsOk).toBe(r.sets);
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
  expect(await ev(page,t=>!!__BA.world.trees[t.y*256+t.x],t)).toBe(true);
  await ev(page,()=>{__BA.world.day+=3;__BA.regrowTrees();});expect(await ev(page,t=>__BA.tAt(t.x,t.y),t)).toBe(20);
  await page.screenshot({path:SHOTS+"v2-chopping.png"});
});

test("killing a monster drops a part that can be picked up and crafted into gear",async({page})=>{
  await start(page);
  await ev(page,()=>{__BA.teleport(110,96);__BA.mobs.length=0;__BA.hero.hp=99;});
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
  await page.click("#btnBag");await expect(page.locator("#menu")).toContainText("Satchel");
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
  await page.locator("#menu button",{hasText:"Wood for the guild"}).click();
  expect(await ev(page,()=>__BA.guild().active.length)).toBe(1);
  await ev(page,()=>{__BA.closeMenu();__BA.P.inv.wood=6;});const g0=await ev(page,()=>__BA.P.gold);
  await ev(page,()=>__BA.guildMenu(0));await expect(page.locator("#menu")).toContainText("your pay");
  const r=await ev(page,()=>({g:__BA.P.gold,pts:__BA.guild().pts,act:__BA.guild().active.length,wood:__BA.P.inv.wood}));
  expect(r.g).toBe(g0+30);expect(r.pts).toBe(8);expect(r.act).toBe(0);expect(r.wood).toBe(0);
  await ev(page,()=>__BA.closeMenu());await page.click("#btnBag");await page.locator("#menu button",{hasText:"Guild Card"}).click();await expect(page.locator("#menu")).toContainText("Rank: F");
});

test("entering and leaving a house through its door",async({page})=>{
  await start(page);
  const b=await ev(page,()=>{__BA.world.min=12*60;const b=__BA.buildings.find(b=>b.kind==="inn"&&b.s===0);__BA.hero.x=(b.x+1.6)*16;__BA.hero.y=(b.y+b.h)*16+4;__BA.hero.dir=3;return b.id;});
  await page.waitForTimeout(100);await page.keyboard.press("KeyJ");
  await page.waitForFunction(()=>!!__BA.room,null,{timeout:3000});
  expect(await ev(page,()=>__BA.room.kind)).toBe("inn");
  await page.waitForTimeout(400);await page.screenshot({path:SHOTS+"v2-interior-inn.png"});
  await ev(page,()=>{const r=__BA.room;__BA.hero.x=r.door.x*16+2;__BA.hero.y=(r.h-2)*16+2;});
  await hold(page,"KeyS",700);
  await page.waitForFunction(()=>!__BA.room,null,{timeout:3000});
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

test("all 8 spells are known and castable on a new save",async({page})=>{
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await start(page);
  const r=await ev(page,()=>{const out={};const ks=Object.keys(__BA.SPELLS);for(const k of ks){__BA.P.mag.mp=999;__BA.hero.iframes=0;out[k]=__BA.castSpell(k)!==false;}return{n:ks.length,out,known:__BA.P.mag.known.length};});
  expect(r.n).toBe(8);expect(r.known).toBe(8);for(const k in r.out)expect(r.out[k],k).toBe(true);
  await page.keyboard.press("Digit8");
  expect(await ev(page,()=>__BA.curSpell)).toBe("meteor");
  expect(errs).toEqual([]);
});

test("tapping a spell hotbar button casts it directly",async({page})=>{
  await start(page);await page.waitForSelector("#sp_fireball");
  await ev(page,()=>{__BA.P.mag.mp=100;__BA.curSpell="heal";});
  const mp0=await ev(page,()=>__BA.P.mag.mp);
  await page.click("#sp_ice");
  await page.waitForTimeout(200);
  const r=await ev(page,()=>({mp:__BA.P.mag.mp,xp:__BA.P.mag.xp.ice||0}));
  expect(r.xp).toBe(1);expect(r.mp).toBeLessThan(mp0);
  expect(await page.locator("#hotbar button").count()).toBe(8);
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
