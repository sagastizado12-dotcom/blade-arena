const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
const shot=async(page,name)=>{await page.screenshot({path:"/workspace/shots-blade/"+name});};

test("v62 weather follows the day, wets the ground, and changes sight and speed",async({page})=>{
  test.setTimeout(120000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await boot(page);
  const o=await page.evaluate(()=>{
    const B=__BA,W=__WEATHER62,M=__MIND59,o={};
    o.cycle={
      dawn:W.nextWeather("clear",0,6),
      winter:W.nextWeather("clear",3,12),
      storm:W.nextWeather("storm",1,15),
      rainAft:W.nextWeather("rain",1,15),
      autumn:W.nextWeather("clear",2,11),
      fog:W.nextWeather("fog",1,10)
    };
    o.spd={clear:1,storm:0,snow:0,rain:0};
    B.world.weather="clear";o.spd.clear=W.weatherSpd();
    B.world.weather="storm";B.world.wet=0;o.spd.storm=W.weatherSpd();
    B.world.weather="snow";o.spd.snow=W.weatherSpd();
    B.world.weather="rain";o.spd.rain=W.weatherSpd();
    B.world.wUntil=B.world.day*1440+B.world.min+5000;
    B.world.weather="rain";B.world.wet=0;B.advanceMinutes(20);o.wetRain=B.world.wet;
    B.world.weather="clear";const mid=B.world.wet;B.advanceMinutes(25);o.wetDry=B.world.wet;o.dried=o.wetDry<mid;
    B.world.min=10*60;B.world.weather="fog";
    const n=B.npcs.find(n=>n.alive&&n.role==="child");
    const d=M.mindOf(n,true);o.fog=d.act;o.fogWhy=d.why;o.fogLine=d.line;
    B.world.weather="clear";B.world.min=10*60;const back=M.mindOf(n,true);o.after=back.act;
    B.world.weather="storm";const shop=B.npcs.find(n=>n.alive&&n.role==="shopkeeper"&&!B.dayOff(n));o.storm=shop&&M.mindOf(shop,true).act;
    const S=B.SETS.find(s=>s.name==="Saltmere");o.salt=[S.x,S.y];
    B.hero.x=S.x*B.TILE;B.hero.y=(S.y+2)*B.TILE;B.hero.boat=false;
    B.world.weather="clear";B.world.min=12*60;B.world.wet=0;B.world.cq=[];B.closeMenu();
    return o;
  });
  console.log(JSON.stringify(o));
  expect(o.cycle).toEqual({dawn:"fog",winter:"snow",storm:"rain",rainAft:"storm",autumn:"rain",fog:"clear"});
  expect(o.spd.storm).toBeLessThan(o.spd.clear);
  expect(o.spd.snow).toBeLessThan(o.spd.clear);
  expect(o.spd.rain).toBeLessThan(o.spd.clear);
  expect(o.wetRain).toBeGreaterThan(0.5);
  expect(o.dried).toBe(true);
  expect(o.fog).toBe("shelter");
  expect(o.fogWhy).toBe("fog");
  expect(o.fogLine).toMatch(/fog/i);
  expect(o.after).not.toBe("shelter");
  expect(o.storm).toBe("shelter");
  expect(errs).toEqual([]);
  await page.waitForTimeout(350);
  await shot(page,"v62-clear.png");
  await page.evaluate(()=>{const B=__BA;B.world.weather="rain";B.world.wet=1;B.world.min=14*60;B.closeMenu();B.world.cq=[];});
  await page.waitForTimeout(350);
  await shot(page,"v62-rain.png");
  await page.evaluate(()=>{const B=__BA;B.world.weather="fog";B.world.wet=0.15;B.world.min=6*60;B.closeMenu();B.world.cq=[];});
  await page.waitForTimeout(350);
  await shot(page,"v62-fog.png");
  expect(errs).toEqual([]);
});
