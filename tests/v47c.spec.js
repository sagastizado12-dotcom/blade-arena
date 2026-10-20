const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test.setTimeout(480000);
test("v47c Moderno square wall, gatehouses, farmland outside, territory, no monsters",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(()=>{const B=__BA,o={};B.closeMenu();const S=B.SETS[B.MOD_ID],R=B.wallR(S);const W=(typeof B.WALLS==="function"?B.WALLS():B.getWALLS()).filter(w=>w.s===B.MOD_ID);
  o.axis=W.every(w=>w.x===S.x-R||w.x===S.x+1+R||w.y===S.y-R||w.y===S.y+1+R);o.n=W.length;o.gates=B.getGATES2().filter(g=>g.s===B.MOD_ID).length;o.gh=B.MODGH.length;
  const fs=[...B.MODF.fields,...B.MODF.orchards,...B.MODF.pastures];o.inside=fs.filter(f=>{const m=Math.max(Math.abs(f.x+f.w/2-S.x),Math.abs(f.y+f.h/2-S.y));return m-Math.max(f.w,f.h)/2<R+2;}).length;
  B.hero.x=(S.x+R+10)*16;B.hero.y=(S.y+2)*16;o.info=B.mapInfo().kingdom;o.terr=B.modTerr();
  return o;});
 console.log(JSON.stringify(o));expect(o.axis).toBe(true);expect(o.n).toBeGreaterThan(300);expect(o.gates).toBe(4);expect(o.gh).toBe(8);expect(o.inside).toBe(0);expect(o.info).toBe("Moderno territory");
 expect(errs).toEqual([]);});
test("v47c NPCs never on solid tiles over a day; farmer field to home via gate; guards staffed 24h and seen off duty",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(()=>{const B=__BA,o={bad:[],unstaffed:0,offSeen:false,viaGate:false};B.closeMenu();const S=B.SETS[B.MOD_ID],R=B.wallR(S);
  B.hero.x=S.x*16;B.hero.y=(S.y+R-6)*16;const near=n=>n.alive&&!n.inside&&Math.abs(n.x-B.hero.x)<500&&Math.abs(n.y-B.hero.y)<380;
  const G=B.npcs.filter(n=>n.role==="guard"&&n.post!=null&&n.s===B.MOD_ID);o.guards=G.length;const watch=G[0];
  const farmer=B.npcs.find(n=>n.s===B.MOD_ID&&n.role==="farmer"&&B.buildings[n.home].farm&&n.id%7&&B.modField(n)&&B.modField(n).y>S.y);o.farmer=!!farmer;
  for(let h=0;h<24;h++){B.world.min=h*60+5;for(let f=0;f<150;f++)B.update();
   for(const n of B.npcs){if(!near(n))continue;const [tx,ty]=B.ntile(n);if(!B.walk(tx,ty))o.bad.push([n.role,h,tx,ty]);}
   // each post in Moderno has an on-shift guard
   const P=B.allPosts()[B.MOD_ID];for(let p=0;p<P.length;p++)if(!G.some(n=>n.post===p&&B.onShift(n)))o.unstaffed++;
   if(watch&&!B.onShift(watch)&&watch.inside)o.offSeen=true;}
  // farmer: put on their field at 16:50, then walk home at night; must cross the wall line only at a gate
  if(farmer){const F=B.modField(farmer);farmer.x=(F.x+1)*16;farmer.y=(F.y+1)*16;farmer.inside=false;B.world.min=21*60;B.hero.x=farmer.x;B.hero.y=farmer.y;let crossed=[];const home=B.buildings[farmer.home];o.homeOutside=Math.max(Math.abs(home.x-S.x),Math.abs(home.y-S.y))>R;
   let py=B.ntile(farmer);for(let f=0;f<9000&&!farmer.inside;f++){if(f%60===0){B.hero.x=farmer.x+120;B.hero.y=farmer.y-120;}B.update();const t=B.ntile(farmer);if(f%150===0)(o.tr=o.tr||[]).push(t.join(",")+">"+(()=>{const q=B.npcTarget(farmer);return Math.floor(q.x/16)+","+Math.floor(q.y/16)})()+":"+(farmer._pt?farmer._pt.i+"/"+(farmer._pt.pts?farmer._pt.pts.length:"L"):"-"));if(!B.walk(t[0],t[1]))o.bad.push(["farmer",t,B.tAt(t[0],t[1]),B.getOCC()[t[1]*2048+t[0]],f]);py=t;}
   const d=B.npcTarget(farmer);o.dbg=[farmer.s,farmer.role,farmer.age,farmer.spouse,farmer.partner,!!farmer.refugee,farmer.x|0,farmer.y|0,home.x,home.y,d.x|0,d.y|0,JSON.stringify(farmer._pt).slice(0,300),F.x,F.y];o.home=farmer.inside;}
  // second farmer lives inside the walls: walk field -> home must enter through a gate
  const f2=B.npcs.find(n=>n!==farmer&&n.id%7&&B.buildings[n.home].farm&&n.s===B.MOD_ID&&n.role==="farmer"&&n.alive);const inH=S.bIdx.find(i=>B.buildings[i].kind==="house"&&Math.max(Math.abs(B.buildings[i].x-S.x),Math.abs(B.buildings[i].y-S.y))<R-8);
  if(f2&&inH!=null){f2.home=inH;f2._mf=null;const F=B.modField(f2);f2.x=(F.x+1)*16;f2.y=(F.y+1)*16;f2.inside=false;B.world.min=19*60+30;const mn=t=>Math.max(Math.abs(t[0]-S.x-0.5),Math.abs(t[1]-S.y-0.5));let prev=B.ntile(f2);o.cross=[];
   for(let f=0;f<14000&&!f2.inside;f++){if(f%60===0){B.hero.x=f2.x+120;B.hero.y=f2.y-120;}B.update();const t=B.ntile(f2);if(!B.walk(t[0],t[1]))o.bad.push(["f2",t]);if(mn(prev)>R-0.5!==mn(t)>R-0.5)o.cross.push(t);if(Math.abs(t[0]-prev[0])+Math.abs(t[1]-prev[1])>2)(o.jump=o.jump||[]).push([f,prev,t]);prev=t;}o.f2end=[B.ntile(f2),B.buildings[inH].x,B.buildings[inH].y,JSON.stringify(f2._pt).slice(0,200)];
   o.home2=f2.inside;o.viaGate=o.cross.length>0&&o.cross.every(t=>Math.abs(t[0]-S.x-0.5)<=1.5||Math.abs(t[1]-S.y-0.5)<=1.5);}
  delete o.tr;o.bad=o.bad.slice(0,10);return o;});
 console.log(JSON.stringify(o));expect(o.guards).toBeGreaterThanOrEqual(18);expect(o.bad).toEqual([]);expect(o.unstaffed).toBe(0);expect(o.offSeen).toBe(true);expect(o.farmer).toBe(true);expect(o.home).toBe(true);expect(o.home2).toBe(true);expect(o.viaGate).toBe(true);
 expect(errs).toEqual([]);});
test("v47c Moderno territory is exclusive: no tile claimed by a kingdom and Moderno",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(()=>{const B=__BA,o={both:0,inT:0,kIn:0};B.closeMenu();const S=B.SETS[B.MOD_ID];const run=()=>{let both=0,inT=0;const R=B.modTerr();
   for(let y=S.y-R-8;y<=S.y+R+8;y+=2)for(let x=S.x-R-8;x<=S.x+R+8;x+=2){const k=B.kAtTile(x,y),mod=Math.hypot(x-S.x,y-S.y)<R-6;if(mod){inT++;if(k!==255)both++;}}return{both,inT};};
  Object.assign(o,run());B.hero.x=S.x*16;B.hero.y=(S.y+B.modTerr()-10)*16;o.info=B.mapInfo().kingdom;
  B.P.gold=1e6;B.world.mod.terr=90;B.modTerrChanged();const r2=run();o.both2=r2.both;o.inT2=r2.inT;return o;});
 console.log(JSON.stringify(o));expect(o.inT).toBeGreaterThan(100);expect(o.both).toBe(0);expect(o.both2).toBe(0);expect(o.inT2).toBeGreaterThan(o.inT);expect(o.info).toMatch(/^Moderno/);expect(errs).toEqual([]);});
