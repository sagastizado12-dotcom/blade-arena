const {test}=require("@playwright/test");
test("v42 shots",async({page})=>{test.setTimeout(150000);await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const pick=await page.evaluate(()=>{const B=__BA,T=B.getT(),W=B.WW;const by={};for(let i=0;i<T.length;i++){if(T[i]!==21)continue;const x=i%W,y=(i/W)|0;const f=B.bridgeInfo(x,y);if(!by[f.style])by[f.style]=[];if(f.first&&by[f.style].length<6)by[f.style].push([x,y]);}return by;});
 console.log(JSON.stringify(pick));
 const go=async(x,y,f)=>{await page.evaluate(([x,y])=>{const B=__BA;B.closeMenu();B.world.min=11*60;B.world.weather="clear";B.teleport(x,y);B.getMobs().length=0;},[x,y]);await page.waitForTimeout(1200);await page.screenshot({path:f});};
 for(const st of ["plank","stone","log"]){const p=(pick[st]||[])[1]||(pick[st]||[])[0];if(p)await go(p[0]-2,p[1]+2,`/workspace/shots-blade/v42-bridge-${st}.png`);}
 const S=await page.evaluate(()=>__BA.SETS.map(s=>({x:s.x,y:s.y,n:s.name,R:__BA.wallRf(s)})));
 for(const n of ["Lakemere","Reedwick","Saltmere"]){const s=S.find(q=>q.n===n);await go(s.x-s.R+3,s.y+2,`/workspace/shots-blade/v42-town-${n.toLowerCase()}.png`);}
 const L=S.find(q=>q.n==="Lakemere");await page.evaluate(([x,y])=>{const B=__BA;B.teleport(x,y);B.toggleMap();B.getMapM().z=0;B.mapZoom(3);B.mapCenterMe();},[L.x,L.y]);await page.waitForTimeout(600);await page.screenshot({path:"/workspace/shots-blade/v42-map-lakemere.png"});});
