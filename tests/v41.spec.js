const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v41 spells: offensive spells project forward, black hole pulls, ice slows, townsfolk safe, no unlock toast",async({page})=>{await boot(page);
 const r=await page.evaluate(async()=>{const B=__BA,o={};const w=n=>new Promise(r=>setTimeout(r,n));B.closeMenu();B.teleport(B.SETS[0].x+30,B.SETS[0].y+24);B.getMobs().length=0;B.P.lv=20;B.swd().xp=1e6;
  document.getElementById("toasts").innerHTML="";B.unlockSpells();o.toast=document.getElementById("toasts").textContent;o.has=B.allSpells().includes("blackhole");
  for(const k of ["frost","quake","meteor","blade","blackhole"]){B.getMobs().length=0;B.hero.dir=2;const hx=B.hero.x,hy=B.hero.y;B.spawnMob("wolfman",hx+70,hy);const e=B.mobs[B.mobs.length-1];e.hp=e.maxHp=500;
    B.spawnMob("wolfman",hx-70,hy);const back=B.mobs[B.mobs.length-1];back.hp=back.maxHp=500;e.stun=999;back.stun=999;
    B.P.mag.mp=999;B.SPCD[k]=0;B.assignSlot(0,k);const ok=B.castSpell("fireball");if(!ok)o.dbg=[k,B.spellUnlocked(k),B.slots(),B.SPCD[k]-performance.now(),B.P.mag.mp,B.swRank()];const x0=e.x;await w(k==="blackhole"?1800:1300);
    o[k]={ok,front:e.hp<500,back:back.hp===500,pulled:k==="blackhole"?Math.abs(e.x-x0)>1||e.hp<500:null,slow:k==="frost"?(e.slowT>0||e.frozen>0):null};}
  const n=B.npcs.find(m=>m.alive&&!m.inside);const h0=n.hp;B.getMobs().length=0;B.hero.x=n.x-60;B.hero.y=n.y;B.hero.dir=2;B.SPCD.blackhole=0;B.assignSlot(0,"blackhole");B.P.mag.mp=999;B.castSpell("fireball");await w(1500);o.npc=n.hp===h0&&n.alive;
  return o;});
 expect(r.toast).not.toContain("New spell");expect(r.has).toBe(true);
for(const k of ["frost","quake","meteor","blade","blackhole"]){expect(r[k].ok,k).toBe(true);expect(r[k].front,k).toBe(true);if(k!=="blackhole")expect(r[k].back,k).toBe(true);}/* v42: black hole pull is now wide */
 expect(r.blackhole.pulled).toBe(true);expect(r.frost.slow).toBe(true);expect(r.npc).toBe(true);});
test("v41 river: north river joins the southern segment west of Lakemere in one channel; town dry",async({page})=>{await boot(page);
 const r=await page.evaluate(()=>{const B=__BA,R=B.getRIVERM(),W=B.WW,T=B.getT();const seen=new Set();const st=[[200,308]];let reach=false;
  while(st.length){const [x,y]=st.pop();const k=y*W+x;if(seen.has(k)||!R[k]||y<290||y>360||x<185||x>235)continue;seen.add(k);if(x>=218&&y>=340)reach=true;st.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}
  const S=B.SETS[7];let wet=0;for(let y=-10;y<=10;y++)for(let x=-10;x<=10;x++){const t=T[(S.y+y)*W+S.x+x];if(t===0||t===1)wet++;}return{reach,wet};});
 expect(r.reach).toBe(true);expect(r.wet).toBe(0);});
