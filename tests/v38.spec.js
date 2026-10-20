const {test,expect}=require("@playwright/test");
test("v38 world art: biome zones, draw-only (collision/buildings unchanged), renders without errors",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(()=>{const B=__BA;B.closeMenu();B.waZones();const z=new Set();for(let y=10;y<B.WH;y+=8)for(let x=10;x<B.WW;x+=8)z.add(B.zoneAt(x,y));
  const towns={coral:B.ZNAME[B.zoneAt(330,66)],rime:B.ZNAME[B.zoneAt(446,78)],bog:B.ZNAME[B.zoneAt(70,338)],dune:B.ZNAME[B.zoneAt(430,318)],pand:B.ZNAME[B.zoneAt(780,606)]};
  return{n:z.size,towns,nb:B.buildings.length,on:B.WA.on};});
 expect(r.n).toBeGreaterThanOrEqual(7);expect(r.towns).toEqual({coral:"tropical",rime:"tundra",bog:"swamp",dune:"desert",pand:"volcanic"});expect(r.nb).toBe(285);expect(r.on).toBe(true);
 await page.waitForTimeout(1500);expect(errs).toEqual([]);});
test("v38 rivers rerouted: old channels gone, new east route, towns dry and land-connected",async({page})=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(()=>{const B=__BA,T=B.getT(),W=B.WW,R=B.getRIVERM();const wet=(x,y)=>{const t=T[y*W+x];return t===0||t===1;};
  let oldSw=0;for(let y=360;y<430;y++)for(let x=70;x<105;x++)if(wet(x,y)&&!wet(x-4,y)&&!wet(x+4,y))oldSw++;
  let oldS=0;for(let x=130;x<190;x++)for(let y=440;y<465;y++)if(R[y*W+x])oldS++;
  let newR=0;for(let x=150;x<200;x++)for(let y=320;y<395;y++)if(R[y*W+x])newR++;
  const dry=B.SETS.every(s=>!wet(s.x,s.y));
  const ok=(x,y)=>B.passable(x,y)&&!wet(x,y);const seen=new Uint8Array(W*B.WH);const st=[[B.SETS[0].x,B.SETS[0].y+2]];seen[st[0][1]*W+st[0][0]]=1;
  while(st.length){const [x,y]=st.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,i=b*W+a;if(a<1||b<1||a>=W-1||b>=B.WH-1||seen[i])continue;const t=T[i];if(!(ok(a,b)||t===21))continue;seen[i]=1;st.push([a,b]);}}
  const reach=[4,7,8].map(k=>{const s=B.SETS[k];for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(seen[(s.y+dy)*W+s.x+dx])return true;return false;});
  return{oldSw,oldS,newR,dry,reach};});
 expect(r.oldSw).toBeLessThan(15);expect(r.oldS).toBe(0);expect(r.newR).toBeGreaterThan(150);expect(r.dry).toBe(true);expect(r.reach).toEqual([true,true,true]);});
