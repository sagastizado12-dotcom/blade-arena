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
  },patch);
  await page.waitForTimeout(550);
};

test("v64 Saltmere town look: bright day, vertical rain, night lamps",async({page})=>{
  test.setTimeout(120000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await boot(page);
  const o=await page.evaluate(()=>{
    const B=__BA,deep=[];
    for(let y=0;y<400&&!deep.length;y+=3)for(let x=0;x<500;x+=3)if(B.tAt(x,y)===B.DEEP){deep.push([x,y]);break;}
    return {salt:!!window.__SALT64,id0:B.buildings[0]&&B.buildings[0].id,id284:B.buildings[284]&&B.buildings[284].id,wet:deep.length?__WAR61.fightTile(deep[0][0],deep[0][1]):null,demo:typeof B.startWarDemo==="function"};
  });
  expect(o.salt).toBe(true);
  expect(o.id0).toBe(0);
  expect(o.id284).toBe(284);
  expect(o.wet).toBe(false);
  expect(o.demo).toBe(true);
  expect(errs).toEqual([]);
  await place(page,{weather:"clear",wet:0,min:12*60,day:80});
  await shot(page,"v64-town.png");
  await place(page,{weather:"rain",wet:1,min:12*60,day:80});
  await shot(page,"v64-rain.png");
  await place(page,{weather:"clear",wet:0,min:22*60,day:80});
  await shot(page,"v64-night.png");
  expect(errs).toEqual([]);
});
