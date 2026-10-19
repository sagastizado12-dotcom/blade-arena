const {test,expect}=require("@playwright/test");
test("v37: female base sprites new (clothed skirt), kids/queens unchanged; stamina gone, dash kept",async({page})=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(()=>{const B=__BA;B.closeMenu();const u=c=>c.toDataURL();const F={...B.chibiLook(12,"villager","human"),fem:1};
  window.__oldFem=true;const a=u(B.chibi(F,0,10));window.__oldFem=false;const b=u(B.chibi(F,0,10));
  const K={...B.chibiLook(5,"child","human"),cls:"child"};window.__oldSprites=true;const k1=u(B.chibi(K,0,10));window.__oldSprites=false;const k2=u(B.chibi(K,0,10));
  const dirs=new Set([0,1,2,3].map(d=>u(B.chibi(F,d,10)))).size;const fr=new Set([10,12,14,16].map(f=>u(B.chibi(F,0,f)))).size;
  return{fem:a!==b,kid:k1===k2,dirs,fr,stam:"stam" in B.hero,bar:!!document.getElementById("stam"),dash:typeof B.dashStrike==="function"};});
 expect(r.fem).toBe(true);expect(r.kid).toBe(true);expect(r.dirs).toBe(4);expect(r.fr).toBeGreaterThanOrEqual(3);expect(r.stam).toBe(false);expect(r.bar).toBe(false);expect(r.dash).toBe(true);});
