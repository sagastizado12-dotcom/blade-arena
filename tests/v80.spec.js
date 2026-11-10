const {test,expect}=require("@playwright/test");
test("v80 regional weather stays cheap and differs across the map",async({page})=>{
  test.setTimeout(120000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await page.addInitScript(()=>{localStorage.clear();localStorage.setItem("realmIntroSeen","1");});
  const t0=Date.now();
  await page.goto("/?v80="+Date.now(),{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.__READY,null,{timeout:30000});
  const boot=Date.now()-t0;
  await page.click("#startBtn");
  await page.waitForFunction(()=>__BA.state==="play",null,{timeout:30000});
  const o=await page.evaluate(()=>{
    const B=__BA;
    function scan(day,min){
      B.world.day=day;B.world.min=min;__WX.sync();
      const counts={};const at={};
      for(let y=200;y<6700;y+=160)for(let x=200;x<8600;x+=160){
        const t=B.tAt(x,y);if(t===0||t===1)continue;
        const k=__WX.at(x,y).k;counts[k]=(counts[k]||0)+1;
        if(!at[k])at[k]=[x,y];
      }
      return {counts,at};
    }
    const summer=scan(160,12*60), winter=scan(15,12*60);
    function bench(fn,n){fn();for(let i=0;i<4;i++){B.update();B.draw();}const t=performance.now();for(let i=0;i<n;i++){B.update();B.draw();}return +((performance.now()-t)/n).toFixed(2);}
    const town=B.SETS.find(s=>s.name==="Aldmoor");
    const ms={};
    ms.town=bench(()=>{B.hero.x=town.x*B.TILE;B.hero.y=(town.y+2)*B.TILE;B.P.fly=0;B.world.day=160;B.world.min=12*60;B.mobs.length=0;},24);
    ms.wild=bench(()=>{B.hero.x=5088*B.TILE;B.hero.y=5282*B.TILE;B.P.fly=0;B.mobs.length=0;},24);
    ms.space=bench(()=>{B.P.fly=42;},24);
    return {summer,winter,ms,npcs:B.npcs.length};
  });
  console.log(JSON.stringify({boot,o},null,2));
  expect(errs).toEqual([]);
  expect(boot).toBeLessThan(8000);
  expect(o.summer.counts.rain||0).toBeGreaterThan(0);
  expect((o.summer.counts.clear||0)+(o.summer.counts.heat||0)).toBeGreaterThan(0);
  expect(o.summer.counts.heat||0).toBeGreaterThan(0);
  expect(o.winter.counts.snow||0).toBeGreaterThan(0);
  expect(o.ms.town).toBeLessThan(16);
  expect(o.ms.wild).toBeLessThan(12);
  const rain=o.summer.at.rain, heat=o.summer.at.heat, clear=o.summer.at.clear;
  async function ground(x,y,file){
    await page.evaluate(([x,y])=>{
      document.getElementById("mapov").classList.add("hidden");
      const el=document.getElementById("toasts");if(el)el.innerHTML="";
      const B=__BA;B.world.day=160;B.world.min=12*60;B.P.fly=0;B.hero.x=x*B.TILE+8;B.hero.y=y*B.TILE+8;B.mobs.length=0;
      __WX.sync();__WX.apply();
      for(let i=0;i<6;i++)B.draw();
    },[x,y]);
    await page.screenshot({path:file});
  }
  await ground(rain[0],rain[1],"/opt/cursor/artifacts/v80-rain.png");
  await ground((heat||clear)[0],(heat||clear)[1],"/opt/cursor/artifacts/v80-other.png");
  await page.evaluate(()=>{
    const B=__BA;B.world.day=160;B.world.min=12*60;B.P.fly=42;B.hero.x=4000*B.TILE;B.hero.y=2500*B.TILE;
    __WX.sync();for(let i=0;i<4;i++)B.draw();
  });
  await page.screenshot({path:"/opt/cursor/artifacts/v80-space.png"});
  await page.evaluate(()=>__V76.labels(0));
  await page.screenshot({path:"/opt/cursor/artifacts/v80-map.png"});
});
