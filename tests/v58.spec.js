const {test,expect,devices}=require("@playwright/test");
test.use({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.tap("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
// put Black Hole in slot 4 (as a late-game player would), place the hero, return the slot button selector
const setup=(page,where)=>page.evaluate(where=>{const B=__BA,H=__BH57;B.closeMenu();const m=B.P.mag;m.known=Object.keys(B.SPELLS);B.forceUnlock();B.P.lv=42;m.max=99999;m.mp=99999;
  m.slots=m.slots&&m.slots.length===4?m.slots:null;const base=Object.keys(B.SPELLS).slice(0,4);B.spellsMenu&&0;
  const st=(B.P.mag.slots=(B.P.mag.slots||[]).length===4?B.P.mag.slots:null);
  const S=B.SETS.find(S=>S.id!==H.MOD_ID&&!S.demon&&H.townBlds(S.id).length>=6);const [x0,y0,x1,y1]=H.townBox57(S);
  const tx=where==="edge"?x1+9:where==="far"?x1+40:S.x+1,ty=where==="edge"?S.y:S.y+2;B.hero.x=tx*B.TILE;B.hero.y=ty*B.TILE;return {sid:S.id,name:S.name};},where);
async function slotBH(page){return page.evaluate(()=>{const B=__BA,H=__BH57;const ids=Object.keys(B.SPELLS).slice(0,4);
  B.P.mag.slots=null;const base=ids.slice(0,4);B.P.mag.slots=base.slice();B.P.mag.slots[base.length-1]="blackhole";try{refreshSpellButtons&&refreshSpellButtons();}catch(_){}
  return{ids,bh:"#sp_"+base[base.length-1],isBH:H.isBH57(base[base.length-1])};});}
async function hold(page,sel,ms){const b=await page.evaluate(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};},sel);const x=b.x+b.width/2,y=b.y+b.height/2;const c=await page.context().newCDPSession?null:null;
  await page.evaluate(([sel,x,y])=>{const el=document.querySelector(sel);const mk=ty=>{try{const t=new Touch({identifier:7,target:el,clientX:x,clientY:y});return new TouchEvent(ty,{bubbles:true,cancelable:true,touches:ty==="touchstart"?[t]:[],changedTouches:[t]});}catch(_){const e=new Event(ty,{bubbles:true,cancelable:true});e.touches=[];return e;}};window.__mk=mk;el.dispatchEvent(mk("touchstart"));},[sel,x,y]);
  await page.waitForTimeout(ms);const mid=await page.evaluate(sel=>{const el=document.querySelector(sel);return{max:!!el.querySelector(".max57"),toasts:document.getElementById("toasts").textContent};},sel);
  if(ms>=2000)await page.screenshot({path:"/workspace/shots-blade/v58-charge-max.png"});
  await page.evaluate(sel=>{const el=document.querySelector(sel);el.dispatchEvent(window.__mk("touchend"));},sel);return mid;}
test("v58 touch: holding the Black Hole slot button to MAX devours the town (inside town); cue + toast shown",async({page})=>{test.setTimeout(120000);const errs=[];page.on("pageerror",e=>errs.push(e.message));
 await boot(page);const T=await setup(page,"in");const s=await slotBH(page);
 const mid=await hold(page,s.bh,2400);await page.waitForTimeout(100);const o=await page.evaluate(()=>({sing:!!__BH57.sing(),last:window.__bhLast}));
 await page.waitForTimeout(2500);await page.evaluate(()=>{for(let i=0;i<400&&__BH57.sing();i++)__BA.update();});await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v58-touch-ruins.png"});
 const ruin=await page.evaluate(sid=>!!__BH57.ruinOf(sid),T.sid);console.log(JSON.stringify({T,s,mid,o,ruin}));
 expect(s.isBH).toBe(true);expect(mid.max).toBe(true);expect(mid.toasts).toMatch(/Singularity ready/);expect(o.last.full).toBe(true);expect(o.sing).toBe(true);expect(ruin).toBe(true);expect(errs).toEqual([]);});
test("v58 touch: from outside the walls (9 tiles past the edge) works; far away says No town in range; short hold does nothing",async({page})=>{test.setTimeout(120000);const errs=[];page.on("pageerror",e=>errs.push(e.message));
 await boot(page);let T=await setup(page,"far");const s=await slotBH(page);await hold(page,s.bh,2300);await page.waitForTimeout(150);
 const far=await page.evaluate(()=>({sing:!!__BH57.sing(),t:document.getElementById("toasts").textContent}));
 await page.evaluate(()=>{__BA.clearCD&&__BA.clearCD();__BA.P.mag.mp=99999;});T=await setup(page,"in");await hold(page,s.bh,700);await page.waitForTimeout(150);const short=await page.evaluate(sid=>({sing:!!__BH57.sing(),ruin:!!__BH57.ruinOf(sid)}),T.sid);
 await page.evaluate(()=>{__BA.clearCD&&__BA.clearCD();__BA.P.mag.mp=99999;});T=await setup(page,"edge");await hold(page,s.bh,2300);await page.waitForTimeout(150);const edge=await page.evaluate(()=>!!__BH57.sing());
 console.log(JSON.stringify({far,short,edge}));expect(far.sing).toBe(false);expect(far.t).toMatch(/No town in range/);expect(short.sing).toBe(false);expect(short.ruin).toBe(false);expect(edge).toBe(true);expect(errs).toEqual([]);});
