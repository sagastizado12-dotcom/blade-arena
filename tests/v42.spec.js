const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v42 towns: no water inside walls, walls closed except gates, all towns reachable",async({page})=>{await boot(page);
 const r=await page.evaluate(()=>{const B=__BA,T=B.getT(),W=B.WW,OCC=B.getOCC();const wall=new Set(B.getWALLS().map(w=>w.y*W+w.x));const gate=new Set();for(const g of B.getGATES())for(const [x,y] of g.tiles)gate.add(y*W+x);
  const D=(s,x,y)=>Math.max(Math.abs(x-s.x-0.5),Math.abs(y-s.y-0.5))*0.55+Math.hypot(x-s.x-0.5,y-s.y-0.5)*0.45;const out={wet:{},leak:{}};
  for(const s of B.SETS){const R=B.wallRf(s);let wet=0,leak=0;for(let y=s.y-R-1;y<=s.y+R+1;y++)for(let x=s.x-R-1;x<=s.x+R+1;x++){const i=y*W+x,d=D(s,x,y);const t=T[i];
      if(d<R-0.6&&(t===0||t===1||t===21))wet++;
      if(Math.abs(d-R)<=0.6&&!wall.has(i)&&!gate.has(i)&&!(OCC[i]>0)&&B.passable(x,y)){
        // a passable ring tile is a leak only if it actually connects inside to outside (not sealed by a neighbour wall)
        let inN=false,outN=false;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*W+xx;if(wall.has(j)||!B.passable(xx,yy))continue;const dd=D(s,xx,yy);if(dd<R-0.6)inN=true;if(dd>R+0.6)outN=true;}if(inN&&outN)leak++;}}
    if(wet)out.wet[s.name]=wet;if(leak)out.leak[s.name]=leak;}
  // reachability of every mainland town from the capital (land + bridges + gates)
  const seen=new Uint8Array(W*B.WH);const st=[[B.SETS[0].x,B.SETS[0].y]];seen[st[0][1]*W+st[0][0]]=1;while(st.length){const [x,y]=st.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,i=b*W+a;if(a<1||b<1||a>=W-1||b>=B.WH-1||seen[i])continue;const t=T[i];if(t===0||t===1)continue;if(!B.passable(a,b)&&t!==21)continue;seen[i]=1;st.push([a,b]);}}
  out.unreach=B.SETS.filter(s=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(seen[(s.y+dy)*W+s.x+dx])return false;return true;}).map(s=>s.name);
  // bridges: every bridge tile is part of a straight span that touches land at both ends, at most 2 wide
  let bad=0,n=0;for(let i=0;i<T.length;i++){if(T[i]!==21)continue;n++;const x=i%W,y=(i/W)|0;const info=B.bridgeInfo(x,y);let w=1;const isB=(a,b)=>T[b*W+a]===21;if(info.horiz){for(let k=1;isB(x,y-k);k++)w++;for(let k=1;isB(x,y+k);k++)w++;}else{for(let k=1;isB(x-k,y);k++)w++;for(let k=1;isB(x+k,y);k++)w++;}if(w>2){bad++;if(!out.bx)out.bx=[];if(out.bx.length<12)out.bx.push([x,y,info.horiz,w]);}}
  out.br={n,bad};return out;});
 console.log(JSON.stringify(r));
 expect(r.wet).toEqual({});expect(r.leak).toEqual({});expect(r.br.n).toBeGreaterThan(10);expect(r.br.bad).toBe(0);
 const isl=["Coralcove"];expect(r.unreach.filter(n=>!isl.includes(n))).toEqual([]);});
test("v42 no spell-unlock toast even for saves with pending unlocks",async({page})=>{await boot(page);
 const t=await page.evaluate(async()=>{const B=__BA;B.closeMenu();B.P.lv=30;B.P.mag.known=["fireball","thunder","heal","air"];B.saveGame();B.loadGame();document.getElementById("toasts").innerHTML="";B.unlockSpells();await new Promise(r=>setTimeout(r,1200));return document.getElementById("toasts").textContent+"|"+B.P.mag.known.length;});
 expect(t).not.toMatch(/New spell/);expect(t.split("|")[1]).not.toBe("4");});
test("v42 combat: chain Ice Beam/Earthquake, strong Black Hole, crescents, no cooldowns, infinite mana, townsfolk safe",async({page})=>{await boot(page);
 const r=await page.evaluate(async()=>{const B=__BA,o={};const w=n=>new Promise(r=>setTimeout(r,n));B.closeMenu();B.teleport(B.SETS[0].x+30,B.SETS[0].y+24);B.P.lv=20;B.swd().xp=1e6;B.unlockSpells();
  const pack=()=>{B.getMobs().length=0;const L=[];for(let i=0;i<5;i++){B.spawnMob("wolfman",B.hero.x+50+i*30,B.hero.y+(i%2?24:-24));const e=B.mobs[B.mobs.length-1];e.hp=e.maxHp=500;e.stun=999;L.push(e);}return L;};
  for(const k of ["frost","quake"]){const L=pack();B.hero.dir=2;B.assignSlot(0,k);B.castSpell("fireball");await w(1200);o[k]=L.filter(e=>e.hp<500).length;}
  {const L=pack();B.hero.dir=2;B.assignSlot(0,"blackhole");B.castSpell("fireball");await w(700);const V=B.getSP41().find(p=>p.k==="blackhole");const md=()=>L.reduce((a,e)=>a+Math.hypot(e.x+e.w/2-V.x,e.y+e.h/2-V.y),0)/L.length;const d0=md();await w(1500);o.bh={hurt:L.filter(e=>e.hp<500).length,shrink:md()<d0*0.75,d0,d1:md()};}
  {const L=pack();B.hero.dir=2;B.assignSlot(0,"blade");B.castSpell("fireball");await w(80);o.cres=B.getSP41().filter(p=>p.k==="crescent").length;await w(900);o.cresHit=L.filter(e=>e.hp<500).length;}
  B.P.mag.mp=1;B.assignSlot(0,"meteor");let ok=0;for(let i=0;i<5;i++)if(B.castSpell("fireball"))ok++;o.rapid=ok;o.mp=B.P.mag.mp===B.P.mag.max;await w(200);o.mpTxt=document.getElementById("mpNum").textContent;
  const n=B.npcs.find(m=>m.alive&&!m.inside);const h0=n.hp;B.getMobs().length=0;B.hero.x=n.x-60;B.hero.y=n.y;B.hero.dir=2;for(const k of ["frost","quake","blackhole","blade","meteor"]){B.assignSlot(0,k);B.castSpell("fireball");}await w(1500);o.npc=n.alive&&n.hp===h0;return o;});
 console.log(JSON.stringify(r));expect(r.frost).toBeGreaterThanOrEqual(4);expect(r.quake).toBeGreaterThanOrEqual(4);expect(r.bh.hurt).toBeGreaterThanOrEqual(3);expect(r.bh.shrink).toBe(true);expect(r.cres).toBe(3);expect(r.cresHit).toBeGreaterThanOrEqual(1);
 expect(r.rapid).toBe(5);expect(r.mp).toBe(true);expect(r.mpTxt).toBe("∞");expect(r.npc).toBe(true);});
test("v42 progression, calendar, age, charm, away rate & resume, no challengers",async({page})=>{await boot(page);
 const r=await page.evaluate(async()=>{const B=__BA,o={};B.closeMenu();B.P.lv=1;B.P.exp=0;B.gainExpG(10);o.exp=B.P.exp+(B.P.lv-1)*1000;
  B.P.lv=30;B.recomputeMax();o.hp30=B.hero.maxHp;o.mp30=B.P.mag.max;B.saveGame();B.loadGame();o.hpLoad=B.hero.maxHp;
  B.world.day=7*365+15;o.cal=B.calStr();o.age=B.ageStr();B.P.startAge=null;
  // 1 real week = 100 years
  o.yearsPerWeek=(7*86400000)/(B.MS_PER_GAME_MIN2()*1440*365);
  const d0=B.world.day;B.resumeAway(86400000);o.daysPerDay=(B.world.day-d0)/365;
  const kid=B.npcs.find(n=>n.alive&&n.role==="child");o.kidLine=B.charmLine(kid);const ad=B.npcs.find(n=>n.alive&&n.role!=="child"&&n.age>=18);o.adLine=B.charmLine(ad);o.charm=B.heroCharm();
  B.closeMenu();document.querySelector("#tl button, #btnPause")&&0;B.showMenu("Paused","",[{l:"x"}]);o.pause=document.querySelector("#menu").textContent;B.closeMenu();
  o.chal=B.issueChallenge(false);for(let i=0;i<200;i++)B.hourlyTick();o.pend=!!B.getChal()||!!B.getDPend()||!!(B.world.duelAmbush);return o;});
 console.log(JSON.stringify(r));
 expect(r.cal).toMatch(/^January 16, 8$/);expect(r.age).toBe("Age 27 (looks 20)");expect(r.yearsPerWeek).toBeCloseTo(100,0);expect(r.daysPerDay).toBeGreaterThan(13.5);
 expect(r.pause).toMatch(/Charm \d+/);expect(r.pause).toMatch(/Age \d+/);expect(r.kidLine).not.toMatch(/blush|handsome|staring|eyes/i);expect(r.charm).toBeGreaterThanOrEqual(90);
 expect(r.chal).toBeNull();expect(r.pend).toBe(false);expect(r.hpLoad).toBe(r.hp30);});
test("v42 grand charged spells: flash, shake, tracked projectile + aftermath for every spell",async({page})=>{await boot(page);const errs=[];page.on("pageerror",e=>errs.push(String(e)));
 const r=await page.evaluate(async()=>{const B=__BA,w=t=>new Promise(r=>setTimeout(r,t));B.closeMenu();B.teleport(B.SETS[0].x+30,B.SETS[0].y+24);B.P.lv=20;B.swd().xp=1e6;B.unlockSpells();const o={};
  for(const k of B.allSpells()){B.getMobs().length=0;for(let i=0;i<3;i++){B.spawnMob("wolfman",B.hero.x+60+i*25,B.hero.y);const e=B.mobs[B.mobs.length-1];e.hp=e.maxHp=900;e.stun=999;}B.hero.dir=2;B.hero.hp=1;
   const ok=B.castCharged(k,3);const fl=!!B.getFLASH42();await w(1600);o[k]={ok:!!ok,fl,aft:B.getAFT42().length+B.getTRK42().length>0};B.getAFT42().length=0;}return o;});
 console.log(JSON.stringify(r));expect(errs).toEqual([]);for(const k in r)if(r[k].ok){expect(r[k].fl).toBe(true);expect(r[k].aft).toBe(true);}
 expect(Object.values(r).filter(v=>v.ok).length).toBeGreaterThanOrEqual(6);});
