const {test}=require("@playwright/test");
test("v37 female sprites",async({page})=>{await page.setViewportSize({width:900,height:1000});await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);
 await page.evaluate(()=>{const B=__BA;const looks=[{...B.chibiLook(12,"villager","human"),fem:1},{...B.chibiLook(23,"farmer","human"),fem:1},{...B.chibiLook(34,"shopkeeper","human"),fem:1},{...B.chibiLook(45,"guard","human"),fem:1},{...B.chibiLook(56,"mage","human"),fem:1},{...B.chibiLook(67,"villager","human"),fem:1,elder:1,hair:[220,220,225]}];
  const cv=document.createElement("canvas");cv.width=900;cv.height=1000;cv.style.cssText="position:fixed;left:0;top:0;z-index:99999;background:#cfc8b8;image-rendering:pixelated";document.body.appendChild(cv);const g=cv.getContext("2d");g.imageSmoothingEnabled=false;g.fillStyle="#cfc8b8";g.fillRect(0,0,900,1000);
  g.font="16px sans-serif";g.fillStyle="#222";g.fillText("v36 (old)",20,22);g.fillText("v37 (new female base)",470,22);
  looks.forEach((L,r)=>{for(const old of [1,0]){window.__oldFem=!!old;for(let d=0;d<4;d++)for(let f=0;f<4;f++){const s=B.chibi(L,[0,1,2,3][d],10+f*2);g.drawImage(s,(old?10:460)+(d*4+f)*27,34+r*160+0,20*1.35|0,30*1.35|0);}
    for(let d=0;d<4;d++){const s=B.chibi(L,d,0);g.drawImage(s,(old?10:460)+d*100,34+r*160+50,60,90);}}});window.__oldFem=false;window.__sheet=cv.toDataURL();});
 const url=await page.evaluate(()=>window.__sheet);await page.setContent(`<body style="margin:0;background:#cfc8b8"><img src="${url}" style="image-rendering:pixelated"></body>`);
 await page.waitForTimeout(300);await page.screenshot({path:"/workspace/shots-blade/v37-female.png"});});
