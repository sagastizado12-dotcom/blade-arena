const {test}=require("@playwright/test");
test("v48",async({page})=>{test.setTimeout(90000);await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const go=async(f,file,ms)=>{await page.evaluate(f);await page.waitForTimeout(ms||1400);await page.screenshot({path:"/workspace/shots-blade/"+file});};
 await go(()=>{const B=__BA;B.closeMenu();const ad=B.npcs.filter(n=>n.alive&&n.role!=="child"&&n.age>=20&&!n.adv&&n.s===0);const wife=ad.find(n=>B.sexOf(n)==="F");B.P.wives=[wife.id];wife.spouse=-1;
   const ks=ad.filter(n=>n!==wife).slice(0,5);ks.forEach((k,i)=>{if(i<2){k.heroKid=true;k.parents=[wife.id,-1];k.age=40+i;}else{k.parents=[ks[i%2].id,999];k.age=18+i;k.heroKid=false;}k.career=null;});B.legacyTick();for(const k of ks.slice(2)){k.trainLv=4;B.callToArms(k,true);}
   B.world.min=11*60;const s=B.SETS[0];B.teleport(s.x+20,s.y+30);for(let i=0;i<3;i++)B.spawnMob("slime",B.hero.x+60+i*12,B.hero.y+10);},"v48-knights-fight.png",2500);
 await go(()=>{__BA.familyTree();},"v48-family-tree.png",500);
 await go(()=>{const B=__BA;B.closeMenu();const L=B.world.lives||(B.world.lives={graves:[],base:{},tmem:{},summons:[],elderLog:[],memory:[],cultY:0});L.memory.push({id:1,name:"Elsa",rel:"wife",s:0,day:1});B.world.seek=B.world.seek||{gen:1,log:[]};B.world.seek.log.push({died:true,name:"Mira",gen:1});const s=B.SETS[0];B.teleport(s.x+6,s.y+6);},"v48-statues.png",1500);});
