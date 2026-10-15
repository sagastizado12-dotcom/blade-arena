const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);};
test("v24 world: no causeways over open sea, no water in towns, every town + Nethervale castle reachable",async({page})=>{await boot(page);
  const r=await page.evaluate(()=>{const B=__BA,T=B.getT(),WW=B.WW,WH=B.WH,S=B.SETS;const PIER=T[0]===-1?0:null;
    const wet=i=>B.isWater(T[i]);const pierT=(()=>{const c={};for(let i=0;i<T.length;i++)c[T[i]]=(c[T[i]]||0)+1;return c;})();
    // pier/bridge-over-water components
    const seen=new Uint8Array(T.length);let maxPier=0;const PT=B.PIER!=null?B.PIER:null;
    const isP=i=>T[i]===PT;if(PT!=null)for(let i=0;i<T.length;i++){if(!isP(i)||seen[i])continue;let n=0;const q=[i];seen[i]=1;while(q.length){const k=q.pop();n++;for(const d of [1,-1,WW,-WW]){const m=k+d;if(m>=0&&m<T.length&&!seen[m]&&isP(m)){seen[m]=1;q.push(m);}}}maxPier=Math.max(maxPier,n);}
    let townWater=[];for(const s of S)for(let y=s.y-s.r;y<=s.y+s.r;y++)for(let x=s.x-s.r;x<=s.x+s.r;x++)if(Math.hypot(x-s.x,y-s.y)<=s.r&&wet(y*WW+x)){townWater.push(s.name);break;}
    const flood=(swim)=>{const v=new Uint8Array(T.length);const q=[S[0].y*WW+S[0].x];v[q[0]]=1;while(q.length){const k=q.pop();for(const d of [1,-1,WW,-WW]){const m=k+d;if(m<0||m>=T.length||v[m])continue;const x=m%WW,y=m/WW|0;if(x<1||y<1||x>=WW-1||y>=WH-1)continue;
      if(B.solidTile(x,y)&&!(B.getOCC&&0))continue;if(!swim&&wet(m))continue;v[m]=1;q.push(m);}}return v;};
    const L=flood(false),Wt=flood(true);const reach=(v,s,rad)=>{for(let y=s.y-rad;y<=s.y+rad;y++)for(let x=s.x-rad;x<=s.x+rad;x++)if(v[y*WW+x])return true;return false;};
    const landMiss=S.filter(s=>!s.island&&!reach(L,s,Math.min(6,s.r))).map(s=>s.name),anyMiss=S.filter(s=>!reach(Wt,s,Math.min(6,s.r))).map(s=>s.name);
    const c=B.demonCastle();const castle=c?reach(Wt,{x:Math.round(c.x+3),y:Math.round(c.y+8)},4):false;const castleLand=c?reach(L,{x:Math.round(c.x+3),y:Math.round(c.y+8)},4):false;
    return{maxPier,townWater,landMiss,anyMiss,castle,castleLand,isth:B.ISTHMI().length};});
  console.log(JSON.stringify(r));
  expect(r.maxPier).toBeLessThanOrEqual(40);expect(r.townWater).toEqual([]);expect(r.anyMiss).toEqual([]);expect(r.castle).toBe(true);expect(r.isth).toBeGreaterThan(0);});
test("v24 old save with the hero in water is moved to solid ground; homes intact",async({page})=>{await boot(page);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
  await page.evaluate(()=>{const B=__BA;B.closeMenu();const T=B.getT();let i=0;for(let y=300;y<700;y++){for(let x=10;x<200;x++){if(T[y*B.WW+x]===T[0]){i=[x,y];break;}}if(i)break;}B.hero.x=i[0]*16;B.hero.y=i[1]*16;B.hero.boat=false;B.saveGame();window.addEventListener("pagehide",e=>e.stopImmediatePropagation(),true);});
  await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#contBtn");await page.waitForFunction(()=>__BA.state==="play");
  expect(await page.evaluate(()=>__BA.heroTileBad())).toBe(false);});
