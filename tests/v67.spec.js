const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
const shot=async(page,name)=>{await page.screenshot({path:"/workspace/shots-blade/"+name});};
const place=async(page,patch)=>{
  await page.evaluate((patch)=>{
    const B=__BA,S=B.SETS.find(s=>s.name==="Saltmere");
    B.hero.x=S.x*B.TILE;B.hero.y=(S.y+1)*B.TILE;B.hero.boat=false;B.hero.swim=false;
    Object.assign(B.world,patch);
    B.world.wUntil=B.world.day*1440+B.world.min+90000;
    B.world.cq=[];B.closeMenu();
    const c=document.getElementById("half66map");if(c)c.remove();
  },patch);
  await page.waitForTimeout(400);
};

test("v67 pre-doubling world and v60 town graphics",async({page})=>{
  test.setTimeout(120000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await boot(page);
  const o=await page.evaluate(()=>{
    const B=__BA,deep=[];
    for(let y=0;y<400&&!deep.length;y+=3)for(let x=0;x<500;x+=3)if(B.tAt(x,y)===B.DEEP){deep.push([x,y]);break;}
    const counts={};for(const b of B.buildings)counts[b.s]=(counts[b.s]||0)+1;
    const seq=[];let cur=null,n=0;for(const b of B.buildings){const k=b.s+(b.dune?"d":b.farm?"f":"");if(k!==cur){if(cur!=null)seq.push(cur+"*"+n);cur=k;n=1;}else n++;}if(cur!=null)seq.push(cur+"*"+n);
    const towns={};for(const s of B.SETS)towns[s.name]=[s.x,s.y,s.r,s.id];
    const wx=window.__WX65||{};
    B.world.weather="snow";B.world.wUntil=B.world.day*1440+B.world.min+90000;B.closeMenu();
    const parts=B.particles();
    for(let i=parts.length-1;i>=0;i--)if(parts[i].kind==="snow")parts.splice(i,1);
    for(let i=0;i<30;i++)B.update();
    const snow=B.particles().filter(p=>p.kind==="snow").length;
    const half={world:{w2:1,half66:1,harvested:{[10*1024+50]:{r:1},[10*1024+700]:{r:2}},trees:{},crown:{0:{x:69,y:146,gx:69,gy:140}}},hero:{x:1104,y:2400},P:{respawn:{x:1104,y:2400},boat:{x:400,y:8}},npcs:[{s:0,x:1104,y:2400},{s:19,x:800,y:20}]};
    window.__PRE67.migrate(half);
    const wide={world:{w2:1,harvested:{[10*2048+100]:{r:3},[10*2048+1500]:{r:4}},trees:{[3*2048+5]:1},crown:{1:{x:1560,y:262,gx:1500,gy:200}}},hero:{x:20000,y:4000},npcs:[{s:1,x:4000,y:80},{s:22,x:3000,y:80}]};
    window.__PRE67.migrate(wide);
    const old={world:{harvested:{[10*1024+100]:{r:5}},trees:{}},hero:{x:2208,y:2300},npcs:[{s:0,x:2208,y:2300}]};
    window.__PRE67.migrate(old);
    const map=window.__HALF66.overview();
    return {
      ww:B.WW,wh:B.WH,tiles:B.WW*B.WH,sets:B.SETS.length,k:B.KINGDOMS.length,names:B.KINGDOMS.map(k=>k.name),
      towns,mod:!!B.SETS.find(s=>s.name==="Moderno"||s.id>=19),east:!!B.SETS.find(s=>s.name==="Eastwatch"),
      seq,nB:B.buildings.length,id0:B.buildings[0]&&B.buildings[0].id,id284:B.buildings[284]&&B.buildings[284].id,
      s284:B.buildings[284]&&B.buildings[284].s,dune284:!!(B.buildings[284]&&B.buildings[284].dune),
      salt:window.__SALT64&&window.__SALT64.town,lush:window.__LOOK63&&window.__LOOK63.lush,wx,snow,
      wet:deep.length?__WAR61.fightTile(deep[0][0],deep[0][1]):null,
      demo:typeof B.startWarDemo==="function",end:typeof B.endWarDemo==="function",
      pre:B.world.pre67,halfFlag:B.world.half66||0,map,
      halfHero:half.hero.x,halfNpc:half.npcs.length,halfKey:Object.keys(half.world.harvested).sort().join(","),halfCrown:half.world.crown[0].x,
      wideHero:wide.hero.x,wideNpc:wide.npcs.length,wideKey:Object.keys(wide.world.harvested).concat(Object.keys(wide.world.trees)).sort().join(","),wideCrown:wide.world.crown[1].x,
      oldHero:old.hero.x,oldKey:Object.keys(old.world.harvested)[0],
      paused:B.paused
    };
  });
  console.log(JSON.stringify({seq:o.seq,nB:o.nB,towns:{Aldmoor:o.towns.Aldmoor,Saltmere:o.towns.Saltmere,Ironford:o.towns.Ironford},k:o.k,sets:o.sets,halfHero:o.halfHero,wideHero:o.wideHero,errs}));
  expect(o.ww).toBe(1024);
  expect(o.wh).toBe(800);
  expect(o.tiles).toBe(819200);
  expect(o.sets).toBe(19);
  expect(o.k).toBe(4);
  expect(o.names).toEqual(["Aldmoria","Varnhold","Sylvara","Nethervale"]);
  expect(o.mod).toBe(false);
  expect(o.east).toBe(false);
  expect(o.towns.Aldmoor.slice(0,2)).toEqual([138,146]);
  expect(o.towns.Saltmere.slice(0,2)).toEqual([244,150]);
  expect(o.towns.Ironford.slice(0,2)).toEqual([892,270]);
  expect(o.towns.Varnhold[0]).toBe(760);
  expect(o.towns.Sylvaris[0]).toBe(252);
  expect(o.id0).toBe(0);
  expect(o.id284).toBe(284);
  expect(o.s284).toBe(9);
  expect(o.dune284).toBe(true);
  expect(o.seq.slice(0,10)).toEqual(["0*18","1*20","2*20","3*12","4*12","5*10","6*10","7*12","8*8","9*12"]);
  const i10=o.seq.indexOf("10*18");
  expect(o.seq.slice(i10,i10+9)).toEqual(["10*18","11*18","12*10","13*18","14*18","15*10","16*18","17*18","18*10"]);
  expect(o.seq).toContain("9d*5");
  expect(o.salt).toBe(false);
  expect(o.lush).toBe(false);
  expect(o.wx.rainStreaks).toBeLessThanOrEqual(8);
  expect(o.wx.stormStreaks).toBeLessThanOrEqual(10);
  expect(o.wx.snowFlakes).toBeLessThanOrEqual(6);
  expect(o.wx.puddles).toBeLessThanOrEqual(4);
  expect(o.wx.snowParticles).toBe(0);
  expect(o.snow).toBe(0);
  expect(o.wet).toBe(false);
  expect(o.demo).toBe(true);
  expect(o.end).toBe(true);
  expect(o.pre).toBe(1);
  expect(o.halfFlag).toBe(0);
  expect(o.map.mapW).toBe(1024);
  expect(o.map.mapH).toBe(800);
  expect(o.halfHero).toBe(2208);
  expect(o.halfNpc).toBe(1);
  expect(o.halfCrown).toBe(138);
  expect(o.halfKey).toBe(String(10*1024+100));
  expect(o.wideHero).toBe(138*16);
  expect(o.wideNpc).toBe(1);
  expect(o.wideCrown).toBe(138);
  expect(o.wideKey.split(",").sort()).toEqual([String(3*1024+5),String(10*1024+100)].sort());
  expect(o.oldHero).toBe(2208);
  expect(o.oldKey).toBe(String(10*1024+100));
  expect(o.paused).toBe(false);
  expect(errs).toEqual([]);
  await shot(page,"v67-map.png");
  await place(page,{weather:"clear",wet:0,min:12*60,day:80});
  await shot(page,"v67-town-day.png");
  await place(page,{weather:"rain",wet:1,min:12*60,day:80});
  await shot(page,"v67-town-rain.png");
  expect(errs).toEqual([]);
});
