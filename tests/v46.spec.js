const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
test("v46 flirt: grown-up kids promoted; Flirt top-level for woodcutter/shopkeeper/adventurer/forgotten-town stranger; married disabled; kids never; no Say box",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(async()=>{const B=__BA,o={},w=t=>new Promise(r=>setTimeout(r,t));B.closeMenu();B.P.lv=30;
  // old-save state: an adult who never left the "child" role
  const g=B.npcs.find(n=>n.alive&&n.role==="child")||B.npcs.find(n=>n.alive&&n.age<18);g.age=24;g.role="child";g.name="Juna";g.job="woodcutter";g.spouse=0;g.friend=12;g.heroKid=false;g.parents=[];
  B.awayAdvance(B.MS_PER_GAME_MIN*1440*365*30);o.leftover=B.npcs.filter(n=>n.alive&&n.role==="child"&&n.age>=18).length;o.jRole=g.role;
  const btns=()=>[...document.querySelectorAll("#menu button")].map(b=>(b.disabled?"[x]":"")+b.textContent);
  const check=async(n,tag)=>{n.met=false;n.spouse=n.spouse>0?n.spouse:0;B.talk(n);await w(120);o[tag]=btns();o[tag+"Say"]=!!document.querySelector("#menu .saybox");const a0=n.aff||0;
    const f=[...document.querySelectorAll("#menu button")].find(b=>/^😉 Flirt$/.test(b.textContent.trim()));if(f){for(let i=0;i<6;i++){const ff=[...document.querySelectorAll("#menu button")].find(b=>/Flirt/.test(b.textContent)&&!b.disabled);if(ff)ff.click();}}o[tag+"Up"]=(n.aff||0)>a0;B.closeMenu();};
  await check(g,"juna");
  const shop=B.npcs.find(n=>n.alive&&n!==g&&n.role!=="child"&&n.role!=="leader"&&!n.adv&&n.age>=18&&B.sexOf(n)==="F"&&/shop|inn|merch|smith|baker/.test(n.role||""));if(shop){shop.spouse=0;await check(shop,"shop");}
  const adv=B.npcs.find(n=>n.alive&&n.adv&&B.sexOf(n)==="F");adv.spouse=0;await check(adv,"adv");
  const far=B.npcs.find(n=>n.alive&&n.s>0&&n!==shop&&n!==g&&!n.adv&&n.role!=="child"&&n.role!=="leader"&&n.age>=18&&B.sexOf(n)==="F");far.spouse=0;far.friend=0;far.aff=0;try{B.forgetHero&&B.forgetHero(far.s);}catch(_){}await check(far,"far");
  const m=B.npcs.find(n=>n.alive&&!n.adv&&n.role!=="child"&&n.role!=="leader"&&n.age>=18&&B.sexOf(n)==="F"&&n!==g&&n!==shop&&n!==far);const h=B.npcs.find(n=>n.alive&&B.sexOf(n)==="M"&&n.age>=18);m.spouse=h.id;B.talk(m);await w(120);o.married=btns();o.marTxt=document.getElementById("menu").innerText;B.closeMenu();
  const k=B.npcs.find(n=>n.alive&&n.role==="child"&&n.age<18);if(k){B.talk(k);await w(120);o.kid=btns();B.closeMenu();}
  return o;});
 console.log(JSON.stringify(o).slice(0,2500));
 expect(o.leftover).toBe(0);expect(o.jRole).not.toBe("child");
 for(const t of ["juna","adv","far"].concat(o.shop?["shop"]:[])){expect(o[t].some(s=>/^😉 Flirt$/.test(s.trim())),t).toBe(true);expect(o[t+"Up"],t).toBe(true);expect(o[t+"Say"],t).toBe(false);}
 expect(o.married.some(s=>/Flirt \(married\)/.test(s))).toBe(true);expect(o.marTxt).toMatch(/is married/);
 if(o.kid)expect(o.kid.some(s=>/Flirt/.test(s))).toBe(false);expect(errs).toEqual([]);});
