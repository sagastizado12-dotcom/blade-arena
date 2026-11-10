const {test,expect}=require("@playwright/test");
test("v78 living wilds: east and south are no longer desert, boot stays packed",async({page})=>{
  test.setTimeout(120000);
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  await page.addInitScript(()=>{localStorage.clear();localStorage.setItem("realmIntroSeen","1");});
  const t0=Date.now();
  await page.goto("/?v78="+Date.now(),{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.__READY,null,{timeout:30000});
  const boot=Date.now()-t0;
  await page.click("#startBtn");
  await page.waitForFunction(()=>__BA.state==="play",null,{timeout:30000});
  const o=await page.evaluate(()=>{
    const B=__BA,T=B.getT(),W=B.WW;
    const box=(x0,y0,x1,y1)=>{const c={};let n=0;for(let y=y0;y<y1;y+=4)for(let x=x0;x<x1;x+=4){const t=T[y*W+x];c[t]=(c[t]||0)+1;n++;}return c;};
    const pct=(c,t)=>Math.round(100*(c[t]||0)/Object.values(c).reduce((a,b)=>a+b,0));
    const halden=box(4800,400,6200,1800),yarrow=box(4000,5000,5200,6400),dune=box(1300,900,1700,1300),brine=box(6200,2000,7600,3200);
    const cities=B.SETS.filter(s=>/town/.test(s.kind||"")).map(s=>s.name+"@"+s.x+","+s.y);
    const road=(()=>{let n=0;const a=B.SETS.find(s=>s.name==="Bloomreach"),p=B.SETS.find(s=>s.name==="Lanternmere");
      for(let i=1;i<24;i++){const x=Math.round(a.x+(p.x-a.x)*i/24),y=Math.round(a.y+(p.y-a.y)*i/24);const t=T[y*W+x];if(t===7||t===12||t===21)n++;}return n;})();
    return {bootMs:B&&window.__BOOTMS,warm:window.__WARM,haldenD:pct(halden,23),yarrowD:pct(yarrow,23),brineD:pct(brine,23),duneD:pct(dune,23),
      haldenG:pct(halden,3)+pct(halden,4)+pct(halden,11),yarrowG:pct(yarrow,3)+pct(yarrow,4)+pct(yarrow,11),
      road,b284:B.buildings[284]&&B.buildings[284].id,nB:B.buildings.length,look:B.LOOKOUTS().length,
      idx:B.SETS[0].bIdx&&B.SETS[0].bIdx.length,cities};
  });
  console.log(JSON.stringify({boot,script:o.bootMs,...o,cities:undefined}));
  expect(errs).toEqual([]);
  expect(boot).toBeLessThan(8000);
  expect(o.warm).toBe(1);
  expect(o.haldenD).toBeLessThan(8);
  expect(o.yarrowD).toBeLessThan(8);
  expect(o.brineD).toBeLessThan(8);
  expect(o.haldenG).toBeGreaterThan(60);
  expect(o.yarrowG).toBeGreaterThan(60);
  expect(o.duneD).toBeGreaterThan(40);
  expect(o.road).toBeGreaterThan(3);
  expect(o.b284).toBe(284);
  expect(o.nB).toBe(1037);
  expect(o.look).toBe(0);
  expect(o.idx).toBeGreaterThan(5);
  for(const name of ["Goldwake@5160,340","Bloomreach@4540,5140","Millhaven@7140,2420","Aldmoor@479,507"])expect(o.cities.join(" ")).toContain(name);
});
