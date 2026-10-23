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

test("v66 half-width world, stable building ids, cheap weather",async({page})=>{
  test.setTimeout(120000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await boot(page);
  const o=await page.evaluate(()=>{
    const B=__BA,deep=[];
    for(let y=0;y<400&&!deep.length;y+=3)for(let x=0;x<500;x+=3)if(B.tAt(x,y)===B.DEEP){deep.push([x,y]);break;}
    const counts={};for(const b of B.buildings)counts[b.s]=(counts[b.s]||0)+1;
    const seq=[];let cur=null,n=0;for(const b of B.buildings){const k=b.s+(b.dune?"d":b.farm?"f":b.pad66?"p":"");if(k!==cur){if(cur!=null)seq.push(cur+"*"+n);cur=k;n=1;}else n++;}if(cur!=null)seq.push(cur+"*"+n);
    const early=[];for(let i=0;i<19;i++)early.push(counts[i]||0);
    const mod=B.SETS.find(s=>s.name==="Moderno");
    const radii=B.SETS.filter(s=>s.id!==mod.id).map(s=>s.r);
    const wx=window.__WX65||{};
    B.world.weather="snow";B.world.wUntil=B.world.day*1440+B.world.min+90000;B.closeMenu();
    const parts=B.particles();
    for(let i=parts.length-1;i>=0;i--)if(parts[i].kind==="snow")parts.splice(i,1);
    const t0=performance.now();
    for(let i=0;i<40;i++)B.update();
    const ms=(performance.now()-t0)/40;
    const snow=B.particles().filter(p=>p.kind==="snow").length;
    const mig={world:{w2:1,harvested:{},trees:{},crown:{0:{x:1560,y:262,gx:1560,gy:200}}},hero:{x:2496,y:80},P:{boat:{x:100,y:4},respawn:{x:2208,y:8}},npcs:[{x:400,y:12}]};
    const idx=262*2048+1560;mig.world.harvested[idx]={r:3};
    window.__HALF66.migrate(mig);
    const map=window.__HALF66.overview();
    return {
      ww:B.WW,wh:B.WH,tiles:B.WW*B.WH,map,seq,
      id0:B.buildings[0]&&B.buildings[0].id,id284:B.buildings[284]&&B.buildings[284].id,s284:B.buildings[284]&&B.buildings[284].s,dune284:!!(B.buildings[284]&&B.buildings[284].dune),
      nB:B.buildings.length,early,modR:mod.r,maxOther:Math.max(...radii),
      modX:mod.x,saltX:B.SETS.find(s=>s.name==="Saltmere").x,
      npcs:B.npcs.filter(n=>n.alive).length,wx,snow,ms:Math.round(ms*100)/100,
      wet:deep.length?__WAR61.fightTile(deep[0][0],deep[0][1]):null,
      demo:typeof B.startWarDemo==="function",end:typeof B.endWarDemo==="function",
      half:B.world.half66,migX:mig.hero.x,migCrown:mig.world.crown[0].x,migTile:Object.keys(mig.world.harvested)[0],
      paused:B.paused
    };
  });
  console.log(JSON.stringify({ww:o.ww,tiles:o.tiles,nB:o.nB,early:o.early,seq:o.seq,modR:o.modR,modX:o.modX,npcs:o.npcs,ms:o.ms}));
  expect(o.ww).toBe(1024);
  expect(o.wh).toBe(800);
  expect(o.tiles).toBe(819200);
  expect(o.map.mapW).toBe(1024);
  expect(o.map.mapH).toBe(800);
  expect(o.id0).toBe(0);
  expect(o.id284).toBe(284);
  expect(o.s284).toBe(9);
  expect(o.dune284).toBe(true);
  expect(o.seq.slice(0,10)).toEqual(["0*18","1*20","2*20","3*12","4*12","5*10","6*10","7*12","8*8","9*12"]);
  const i10=o.seq.indexOf("10*18");
  expect(o.seq.slice(i10,i10+9)).toEqual(["10*18","11*18","12*10","13*18","14*18","15*10","16*18","17*18","18*10"]);
  expect(o.seq).toContain("9d*5");
  expect(o.modR).toBeGreaterThan(o.maxOther);
  expect(o.modR).toBe(38);
  expect(o.wx.rainStreaks).toBeLessThanOrEqual(8);
  expect(o.wx.stormStreaks).toBeLessThanOrEqual(10);
  expect(o.wx.snowFlakes).toBeLessThanOrEqual(6);
  expect(o.wx.puddles).toBeLessThanOrEqual(4);
  expect(o.wx.snowParticles).toBe(0);
  expect(o.snow).toBe(0);
  expect(o.wet).toBe(false);
  expect(o.demo).toBe(true);
  expect(o.end).toBe(true);
  expect(o.half).toBe(1);
  expect(o.migX).toBe(1248);
  expect(o.migCrown).toBe(780);
  expect(o.migTile).toBe(String(262*1024+780));
  expect(o.paused).toBe(false);
  expect(errs).toEqual([]);
  await shot(page,"v66-map.png");
  await place(page,{weather:"clear",wet:0,min:12*60,day:80});
  await shot(page,"v66-town.png");
  await place(page,{weather:"rain",wet:1,min:12*60,day:80});
  await shot(page,"v66-rain.png");
  expect(errs).toEqual([]);
});
