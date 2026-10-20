const {test}=require("@playwright/test");
test("v38 world art",async({page})=>{test.setTimeout(180000);await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const go=async(x,y,f)=>{await page.evaluate(([x,y])=>{const B=__BA;B.closeMenu();B.world.min=11*60;B.world.weather="clear";B.teleport(x,y);B.getMobs().length=0;},[x,y]);await page.waitForTimeout(1200);await page.screenshot({path:f});};
 const S=await page.evaluate(()=>__BA.SETS.map(s=>({x:s.x,y:s.y,k:s.kind,n:s.name,id:s.id})));
 const town=S.find(s=>s.n==="Willowmere")||S[1];await go(town.x,town.y+3,"/workspace/shots-blade/v38-world-town.png");
 const cap=S[0];await go(cap.x+1,cap.y+4,"/workspace/shots-blade/v38-world-capital.png");
 const spots=await page.evaluate(()=>{const B=__BA;B.waZones();const pick={tropical:5,tundra:6,swamp:8,desert:9,volcanic:16,highland:2,autumn:3,forest:12};const out={};
  for(const z in pick){const S=B.SETS[pick[z]];let best=null;for(let r=18;r<34&&!best;r+=2)for(let a=0;a<6.28&&!best;a+=0.4){const x=Math.round(S.x+Math.cos(a)*r),y=Math.round(S.y+Math.sin(a)*r);if(B.passable(x,y)&&!B.isWater(B.tAt(x,y))&&(z==="forest"||z==="autumn"||B.ZNAME[B.zoneAt(x,y)]===z))best=[x,y];}out[z]=best||[S.x,S.y+3];}return out;});
 console.log(JSON.stringify(spots));const names=[];for(const z in spots){const f=`/tmp/biome-${z}.png`;await go(spots[z][0],spots[z][1],f);names.push(z);}
 require("fs").writeFileSync("/tmp/biomes.json",JSON.stringify(names));
 await page.evaluate(()=>{__BA.WA.on=false;});});
