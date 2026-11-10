const {test,expect}=require("@playwright/test");
test("v79 bigger countries gain spaced cities",async({page})=>{
  test.setTimeout(120000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await page.addInitScript(()=>{localStorage.clear();localStorage.setItem("realmIntroSeen","1");});
  const t0=Date.now();
  await page.goto("/?v79="+Date.now(),{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.__READY,null,{timeout:30000});
  const boot=Date.now()-t0;
  await page.click("#startBtn");
  await page.waitForFunction(()=>__BA.state==="play",null,{timeout:30000});
  const o=await page.evaluate(()=>__V79.report());
  console.log(JSON.stringify({boot,min:o.min,pair:o.pair,sets:o.sets,rows:o.rows.map(r=>({n:r.name,c:r.n}))},null,2));
  expect(errs).toEqual([]);
  expect(boot).toBeLessThan(8000);
  expect(o.sets).toBe(65);
  expect(o.min).toBeGreaterThanOrEqual(321);
  expect(o.lookouts).toBe(0);
  const want={Aldmoria:3,Varnhold:4,Sylvara:7,Nethervale:5,Halden:9,Brine:11,Yarrow:11};
  for(const row of o.rows)expect(row.n).toBe(want[row.name]);
  for(const c of o.fresh){
    expect(c.inn&&c.shop&&c.guild&&c.leader&&c.guard).toBe(true);
    expect(c.same+80).toBeLessThan(c.foreign);
    expect(c.same).toBeGreaterThanOrEqual(321);
  }
  const id=await page.evaluate(()=>({a:__BA.buildings[0].id,b:__BA.buildings[284].id,n:__BA.buildings.length}));
  expect(id.a).toBe(0);expect(id.b).toBe(284);expect(id.n).toBeGreaterThan(821);
  const labels=await page.evaluate(()=>__V76.labels(0));
  const zoomed=await page.evaluate(()=>__V79.cities.map(n=>({n,z0:__V76.labels(0).join(" ").includes(n),z2:__V76.focus(n,2).join(" ").includes(n)})));
  console.log("labels",labels.length,"zoom",JSON.stringify(zoomed));
  for(const z of zoomed)expect(z.z2).toBe(true);
  await page.evaluate(()=>__V76.labels(0));
  await page.screenshot({path:"/opt/cursor/artifacts/v79-overview.png"});
});
