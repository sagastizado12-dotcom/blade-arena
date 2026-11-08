const {test,expect}=require("@playwright/test");
const boot=async page=>{
  await page.addInitScript(()=>{window.__FAST=true;localStorage.clear();localStorage.setItem("realmIntroSeen","1");});
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.__READY,{timeout:150000});
  await page.click("#startBtn");
  await page.waitForFunction(()=>window.__BA&&__BA.state==="play");
};
test("v75 cities, repair, quiet days, flight layer, no pencils",async({page})=>{
  test.setTimeout(240000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await boot(page);
  const o=await page.evaluate(()=>{
    const B=__BA,V=__V75;
    const rep=V.report();
    const id284=B.buildings[284]&&B.buildings[284].id;
    const cities={};
    for(const row of rep.rows)cities[row.name]={n:row.n,cities:row.cities};
    const gaps=Object.entries(rep.nn).map(([name,v])=>({name,d:v.d,who:v.who})).sort((a,b)=>a.d-b.d);
    const newGaps=V.cities.map(name=>({name,...rep.nn[name]}));
    const services={};
    for(const name of V.cities){
      const s=B.SETS.find(x=>x.name===name);
      const blds=B.buildings.filter(b=>b.s===s.id);
      const folks=B.npcs.filter(n=>n.s===s.id&&n.alive);
      services[name]={kind:s.kind,houses:blds.filter(b=>b.kind==="house"||b.kind==="forsale").length,inn:blds.some(b=>b.kind==="inn"),shop:blds.some(b=>b.kind==="shop"),guild:blds.some(b=>b.kind==="guild"),leader:folks.some(n=>n.role==="leader"),guard:folks.some(n=>n.role==="guard"),npcs:folks.length,roads:0};
    }
    const gold=B.P.gold,homes=(B.P.homes||[]).slice(),quests=B.P.jobs?B.P.jobs.length:0;
    B.world.intact75=0;
    B.world.sets[0].ruin={since:1,progress:0.2,bh:1};B.world.sets[0].dpct=0.95;
    if(B.world.bld[1])B.world.bld[1].dmg=1;
    if(B.world.walls){const k=Object.keys(B.world.walls)[0];if(k)B.world.walls[k]=0;}
    const fixed=V.restore();
    const again=V.restore();
    const ruinGone=!B.world.sets[0].ruin&&!(B.world.bld[1]&&B.world.bld[1].dmg>0);
    B.world.lives=B.world.lives||{graves:[],memory:[],obits:[]};
    B.world.lives.tombs75=0;
    B.world.lives.graves=[{id:90001,name:"Ada Stone",sx:"F",age:72,s:0,day:3,fam:"wife"}];
    const swept=V.tombs();
    const graves=B.world.lives.graves.length,obit=B.world.lives.obits.some(o=>o.name==="Ada Stone"),mem=B.world.lives.memory.some(m=>m.name==="Ada Stone");
    const farmer=B.npcs.find(n=>n.alive&&n.role==="farmer"&&n.age>=20);
    const fname=farmer&&farmer.name;
    if(farmer)V.pass(farmer);
    const stillDead=farmer&&!farmer.alive;
    const noNewGrave=B.world.lives.graves.length===0;
    const book=B.world.lives.obits.some(o=>o.name===fname);
    function clearWild(){for(let i=B.mobs.length-1;i>=0;i--)if(!B.mobs[i].persist)B.mobs.splice(i,1);}
    function burst(day,x,y){
      B.world.min=day?12*60:22*60;B.hero.x=x;B.hero.y=y;clearWild();
      let hostile=0,born=0;
      for(let i=0;i<24;i++){const n0=B.mobs.length;V.spawn();
        for(const m of B.mobs.slice(n0)){if(m.persist)continue;born++;if(m.def&&(m.def.beh==="agg"||m.def.wood))hostile++;}
        clearWild();}
      return {hostile,born};
    }
    const S=B.SETS.find(s=>s.name==="Aldmoor");
    const near=burst(true,(S.x+S.r+36)*B.TILE,S.y*B.TILE);
    const night=burst(false,(S.x+S.r+36)*B.TILE,S.y*B.TILE);
    let spot=null;
    outer:for(let y=80;y<V.WH-80;y+=40)for(let x=80;x<B.WW-80;x+=40){
      const t=V.tile(x,y);
      if(t!==V.FOREST&&t!==V.TREE)continue;
      let gap=1e9;for(const Q of B.SETS){const d=Math.hypot(x-Q.x,y-Q.y)-Q.r;if(d<gap)gap=d;}
      if(gap>180){spot={x,y,gap};break outer;}
    }
    const woods=spot?burst(true,spot.x*B.TILE,spot.y*B.TILE):{hostile:-1,born:-1,gap:-1};
    if(spot)woods.gap=Math.round(spot.gap);
    let tree=null;
    for(let y=S.y-50;y<S.y+70&&!tree;y++)for(let x=S.x+S.r+8;x<S.x+S.r+70;x++){if(V.tile(x,y)===V.TREE){tree={x,y};break;}}
    const fly={};
    if(tree){
      B.P.fly=0;B.hero.x=tree.x*B.TILE-24;B.hero.y=tree.y*B.TILE;B.hero.w=12;B.hero.h=12;
      for(let i=0;i<20;i++)V.slide(3,0);
      fly.walkX=Math.round(B.hero.x);
      fly.walkBlocked=B.hero.x<tree.x*B.TILE-2;
      B.P.fly=20;B.hero.x=tree.x*B.TILE-24;B.hero.y=tree.y*B.TILE;
      for(let i=0;i<20;i++)V.slide(3,0);
      fly.flyX=Math.round(B.hero.x);
      fly.flewOver=B.hero.x>tree.x*B.TILE;
    }
    const house=B.buildings.find(b=>b.s===0&&(b.kind==="house"||b.kind==="inn"));
    B.P.fly=0;B.hero.x=(house.x-1)*B.TILE;B.hero.y=(house.y+1)*B.TILE;
    for(let i=0;i<30;i++)V.slide(3,0);
    fly.walkHouse=Math.round(B.hero.x);
    B.P.fly=18;B.hero.x=(house.x-1)*B.TILE;B.hero.y=(house.y+1)*B.TILE;
    for(let i=0;i<30;i++)V.slide(3,0);
    fly.flyHouse=Math.round(B.hero.x);
    fly.overHouse=B.hero.x>(house.x+1)*B.TILE;
    B.P.fly=12;B.hero.x=house.x*B.TILE+4;B.hero.y=house.y*B.TILE+4;B.hero.swim=true;
    V.land();
    const lx=Math.floor((B.hero.x+6)/B.TILE),ly=Math.floor((B.hero.y+8)/B.TILE);
    const lt=V.tile(lx,ly);
    fly.landFly=B.P.fly;fly.landTile=lt;fly.landSolid=V.solid(lx,ly);fly.landSwim=!!B.hero.swim;
    B.P.fly=22;B.hero.x=S.x*B.TILE;B.hero.y=(S.y+3)*B.TILE;
    B.saveGame();
    const gx=B.hero.x,gfly=B.P.fly,gg=B.P.gold;
    B.P.fly=0;B.hero.x=8;
    const loaded=B.loadGame();
    fly.reloadFly=B.P.fly;fly.reloadX=Math.round(B.hero.x);fly.goldSame=B.P.gold===gg;fly.loaded=loaded;
    return {errsOk:true,rep:{sets:rep.sets,lookouts:rep.lookouts,pencils:rep.pencils,cones:rep.cones},cities,gaps:gaps.slice(0,4),newGaps,id284,services,goldSame:B.P.gold===gold,homesSame:JSON.stringify(B.P.homes||[])===JSON.stringify(homes),quests,fixed,again,ruinGone,swept,graves,obit,mem,stillDead,noNewGrave,book,near,night,woods,fly,legend:!!document.querySelector("#maplegend")&&!/Lookout|▲/.test(document.getElementById("maplegend").textContent)};
  });
  console.log(JSON.stringify(o,null,2));
  expect(errs).toEqual([]);
  expect(o.rep.sets).toBe(36);
  expect(o.rep.lookouts).toBe(0);
  expect(o.rep.pencils).toBe(0);
  expect(o.rep.cones).toBe(0);
  expect(o.id284).toBe(284);
  expect(o.legend).toBe(true);
  for(const row of Object.values(o.cities))expect(row.n).toBeGreaterThanOrEqual(3);
  for(const name of Object.keys(o.services)){
    const s=o.services[name];
    expect(s.inn).toBe(true);expect(s.shop).toBe(true);expect(s.guild).toBe(true);
    expect(s.leader).toBe(true);expect(s.guard).toBe(true);expect(s.npcs).toBeGreaterThan(4);
  }
  for(const g of o.newGaps)expect(g.d).toBeGreaterThan(450);
  expect(o.goldSame).toBe(true);
  expect(o.homesSame).toBe(true);
  expect(o.ruinGone).toBe(true);
  expect(o.again.skipped).toBe(1);
  expect(o.graves).toBe(0);
  expect(o.obit).toBe(true);
  expect(o.mem).toBe(true);
  expect(o.noNewGrave).toBe(true);
  expect(o.book).toBe(true);
  expect(o.near.hostile).toBeLessThan(o.night.hostile);
  expect(o.woods.hostile).toBeGreaterThan(o.near.hostile);
  expect(o.fly.walkBlocked).toBe(true);
  expect(o.fly.flewOver).toBe(true);
  expect(o.fly.overHouse).toBe(true);
  expect(o.fly.flyHouse).toBeGreaterThan(o.fly.walkHouse);
  expect(o.fly.landFly).toBe(0);
  expect([0,1].includes(o.fly.landTile)).toBe(false);
  expect(o.fly.landSolid).toBe(false);
  expect(o.fly.reloadFly).toBeGreaterThan(10);
  expect(o.fly.goldSame).toBe(true);
  await page.evaluate(()=>{
    const B=__BA,S=B.SETS.find(s=>s.name==="Briarford");
    B.hero.x=S.x*B.TILE;B.hero.y=(S.y+2)*B.TILE;B.P.fly=0;B.mobs.length=0;B.world.min=12*60;
    for(let i=0;i<3;i++)B.draw();
  });
  await page.screenshot({path:"/opt/cursor/artifacts/v75-city.png"});
  await page.evaluate(()=>{
    const B=__BA;B.P.fly=26;B.hero.dir=0;
    let tree=null;const S=B.SETS.find(s=>s.name==="Aldmoor");
    for(let y=S.y+S.r+6;y<S.y+S.r+40&&!tree;y++)for(let x=S.x-20;x<S.x+20;x++)if(__V75.tile(x,y)===__V75.TREE)tree={x,y};
    if(tree){B.hero.x=tree.x*B.TILE;B.hero.y=tree.y*B.TILE;}
    B.draw();
  });
  await page.screenshot({path:"/opt/cursor/artifacts/v75-flight-high.png"});
  const pix=await page.evaluate(()=>{
    const c=document.getElementById("game"),g=c.getContext("2d");
    const box=(fly)=>{__BA.P.fly=fly;__BA.draw();const d=g.getImageData((c.width/2-14)|0,(c.height/2-24)|0,28,32).data;let green=0,other=0;
      for(let i=0;i<d.length;i+=4){if(d[i+3]<20)continue;if(d[i+1]>d[i]+18&&d[i+1]>d[i+2]+8)green++;else other++;}
      return {green,other};};
    const low=box(6),high=box(26);
    __BA.P.fly=0;return {low,high};
  });
  console.log("pixels",JSON.stringify(pix));
  expect(pix.high.other).toBeGreaterThan(pix.low.other);
  await page.evaluate(()=>{
    const B=__BA;B.P.fly=0;B.world.min=14*60;B.forceUnlock();B.P.mag.mp=B.P.mag.max;
    B.hero.dir=0;B.castSpell("fireball");B.castSpell("frost");B.draw();
  });
  await page.screenshot({path:"/opt/cursor/artifacts/v75-spell.png"});
  expect(errs).toEqual([]);
});
