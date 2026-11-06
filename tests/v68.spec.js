const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY,null,{timeout:60000});await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
const shot=async(page,name)=>{await page.screenshot({path:"/workspace/shots-blade/"+name});};

test("v68 shining look, stretched towns, and a quiet plaza",async({page})=>{
  test.setTimeout(120000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await boot(page);
  const o=await page.evaluate(()=>{
    const B=__BA,S=B.SETS.find(s=>s.name==="Aldmoor"),Sm=B.SETS.find(s=>s.name==="Saltmere"),R=B.SETS.find(s=>s.name==="Reedwick");
    const spd=1.15*60/16;
    const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    B.world.min=12*60;B.world.day=80;B.world.weather="clear";B.closeMenu();
    B.hero.x=S.x*B.TILE;B.hero.y=(S.y+1)*B.TILE;B.hero.vx=0;B.hero.vy=0;
    window.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyD"}));
    window.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyS"}));
    B.update();
    const go={vx:+B.hero.vx.toFixed(3),vy:+B.hero.vy.toFixed(3),d8:B.hero.d8};
    window.dispatchEvent(new KeyboardEvent("keyup",{code:"KeyD"}));
    window.dispatchEvent(new KeyboardEvent("keyup",{code:"KeyS"}));
    B.update();
    const stop={vx:B.hero.vx,vy:B.hero.vy};
    const e={x:0,y:0,dir:2};const fr=[];
    for(let i=0;i<40;i++)fr.push(B.walkState(e,1.15,true).fr);
    const idle=B.walkState(e,0,true).fr;
    const f=B.fountainOf(S);let plaza=0,leader=0,lots=0;
    const lot=(t)=>{const tx=t.x/B.TILE,ty=t.y/B.TILE;return B.buildings.some(b=>b.s===S.id&&tx>=b.x-3&&tx<=b.x+b.w+3&&ty>=b.y-2&&ty<=b.y+b.h+3);};
    for(const n of B.npcs){if(!n.alive||n.s!==S.id)continue;const t=B.npcTarget(n);if(!t||t.inside)continue;
      if(lot(t)){lots++;continue;}
      const d=Math.hypot(t.x/B.TILE-(f?f.x:S.x),t.y/B.TILE-(f?f.y:S.y));
      if(d<=6.5){plaza++;if(n.role==="leader")leader++;}}
    const bars=document.getElementById("bars");
    const safe=bars.style.opacity;
    const touch=!!document.getElementById("touch");
    const m=B.spawnMob("orc",B.hero.x+30,B.hero.y+10,{persist:true});m.def={...m.def,beh:"agg"};B.update();
    const fight=document.getElementById("bars").style.opacity;
    B.mobs.length=0;
    const old={world:{pre67:1,harvested:{[10*1024+50]:{r:1}},trees:{}},hero:{x:2208,y:2400},npcs:[{s:0,x:1104,y:800}]};
    window.__J68.migrate(old);
    for(let i=0;i<6;i++){B.update();B.draw();}
    const t0=performance.now();for(let i=0;i<40;i++)B.update();const townU=(performance.now()-t0)/40;
    B.hero.x=(S.x+100)*B.TILE;B.hero.y=(S.y+60)*B.TILE;
    for(let i=0;i<4;i++){B.update();B.draw();}
    const t1=performance.now();for(let i=0;i<40;i++)B.update();const wildU=(performance.now()-t1)/40;
    return {
      ww:B.WW,wh:B.WH,sets:B.SETS.length,mod:!!B.SETS.find(s=>s.name==="Moderno"),
      id0:B.buildings[0].id,id284:B.buildings[284].id,
      secSalt:+(gap(S,Sm)/spd).toFixed(1),secReed:+(gap(S,R)/spd).toFixed(1),
      go,stop,frames:[...new Set(fr)],idle,plaza,leader,lots,safe,fight,touch,
      migX:old.hero.x,migN:old.npcs[0].x,migKey:Object.keys(old.world.harvested)[0],
      townU:+townU.toFixed(2),wildU:+wildU.toFixed(2)
    };
  });
  console.log(JSON.stringify(o));
  expect(o.ww).toBe(2048);expect(o.wh).toBe(1600);expect(o.sets).toBe(19);expect(o.mod).toBe(false);
  expect(o.id0).toBe(0);expect(o.id284).toBe(284);
  expect(o.secSalt).toBeGreaterThan(40);expect(o.secReed).toBeGreaterThan(30);
  expect(o.go.d8).toBe(4);expect(o.go.vx).toBeGreaterThan(0.9);expect(o.go.vy).toBeGreaterThan(0.9);
  expect(o.stop).toEqual({vx:0,vy:0});
  expect(o.frames).toEqual([10,11,12,13]);expect(o.idle).toBe(0);
  expect(o.plaza).toBeLessThanOrEqual(3);expect(o.leader).toBeLessThanOrEqual(1);expect(o.lots).toBeGreaterThan(4);
  expect(o.safe).toBe("0");expect(o.fight).toBe("1");expect(o.touch).toBe(true);
  expect(o.migX).toBe(4416);expect(o.migN).toBe(2208);
  expect(o.townU).toBeLessThan(3);expect(o.wildU).toBeLessThan(3);
  expect(errs).toEqual([]);
  await page.evaluate(()=>{const B=__BA,S=B.SETS.find(s=>s.name==="Aldmoor");
    B.hero.x=S.x*B.TILE;B.hero.y=(S.y+1)*B.TILE;B.hero.vx=0;B.hero.vy=0;B.mobs.length=0;
    B.world.min=12*60;B.world.weather="clear";B.closeMenu();
    for(const n of B.npcs)if(n.s===S.id){n.pauseT=0;n._psig=null;n._pdest=null;}
    for(let i=0;i<1000;i++){B.update();B.world.min=12*60;}
    B.draw();});
  await shot(page,"v68-town-midday.png");
  await page.evaluate(()=>{const B=__BA,S=B.SETS.find(s=>s.name==="Aldmoor");
    B.hero.x=(S.x+70)*B.TILE;B.hero.y=(S.y+36)*B.TILE;B.hero.boat=false;B.mobs.length=0;B.draw();});
  await shot(page,"v68-wilds.png");
  await page.evaluate(()=>{const B=__BA,b=B.buildings.find(b=>b.kind==="inn"&&b.s===0);B.enterBuilding(b);B.draw();});
  await shot(page,"v68-interior.png");
  await page.evaluate(()=>{const B=__BA;B.exitRoom();const S=B.SETS.find(s=>s.name==="Saltmere");B.hero.x=S.x*B.TILE;B.hero.y=S.y*B.TILE;B.drawFullMap();});
  await shot(page,"v68-map.png");
  expect(errs).toEqual([]);
});
