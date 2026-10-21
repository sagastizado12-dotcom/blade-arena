const {test,expect}=require("@playwright/test");
const boot=async page=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");};
const dayOf=(m,d)=>[31,28,31,30,31,30,31,31,30,31,30,31].slice(0,m).reduce((a,b)=>a+b,0)+d-1;
test("v53 seasons & life: frozen rivers walkable, festivals, harvest market, seasonal monsters, farm plot, pet breeding, bards",async({page})=>{const errs=[];page.on("pageerror",e=>errs.push(e.message));await boot(page);
 const o=await page.evaluate(async([jan15,jun14,oct1,mar1])=>{const B=__BA,o={},w=t=>new Promise(r=>setTimeout(r,t));B.closeMenu();const Y=365*Math.ceil(B.world.day/365+1);
  // find a frozen-able river tile
  const T=B.getT?B.getT():null;let riv=null;for(let y=100;y<700&&!riv;y+=3)for(let x=100;x<1900;x+=3){if(B.tAt(x,y)===0&&B.riverTile(x,y)){riv=[x,y];break;}}o.riv=!!riv;
  B.setDay(Y+jun14);o.iceSummer=B.iceAt(riv[0],riv[1]);B.setDay(Y+jan15-3);o.iceWinter=B.iceAt(riv[0],riv[1]);B.teleport(riv[0],riv[1]);B.hero.x=riv[0]*16;B.hero.y=riv[1]*16-2;for(let i=0;i<5;i++)B.update();o.swim=B.hero.swim;o.npcWalk=B.walk(riv[0],riv[1]);
  // festival on the 15th of the season's middle month
  for(let i=0;i<3;i++){B.setDay(B.world.day+1);B.dailyTick();}o.fest=B.festNow()&&B.festNow().k;o.townsFest=B.world.sets.filter(s=>s.festival>0).length;
  const g0=B.P.gold;o.join=B.joinFest();await w(50);o.song=document.getElementById("menu").innerText;B.closeMenu();o.again=B.joinFest();B.closeMenu();
  // farm plot: needs a home; frozen in winter
  const h=B.getBuildings().findIndex(b=>b.kind==="house"&&b.s===0);B.P.homes=[h];B.P.gold=1000;o.winterPlant=B.plant(0,"wheat");B.setDay(Y+oct1-1);B.dailyTick();o.season=B.season();o.plant=B.plant(0,"pumpkin");o.notYet=B.harvestBed(0);
  for(let i=0;i<6;i++){B.setDay(B.world.day+1);B.dailyTick();}o.got=B.harvestBed(0);o.pumpkins=B.P.inv.pumpkin;
  // harvest market double in autumn
  o.priceAut=B.cropPrice("pumpkin");B.setDay(Y+mar1);o.priceSpr=B.cropPrice("pumpkin");
  // seasonal monster (spring = Bloomling) away from towns
  const S=B.SETS[0];B.teleport(S.x+60,S.y+60);B.mobs.length=0;const m=B.seasonSpawn(true);o.mon=m&&m.name;o.monSeasonal=m&&m.seasonal;if(m){for(let i=0;i<50&&!m.dead;i++){m.iframes=0;B.hurtEnemy(m,5,0,false);}}o.drop=B.P.inv.blossom||0;
  // pet breeding
  B.P.pets=[{id:1,sp:"slime",name:"A",lv:3,xp:0},{id:2,sp:"slime",name:"B",lv:4,xp:0}];o.pairs=B.breedPairs();o.breed=B.breed("slime");for(let i=0;i<3;i++){B.setDay(B.world.day+1);B.dailyTick();}o.pets=B.P.pets.length;
  // life menu in pause
  B.lifeMenu();await w(50);o.life=document.getElementById("menu").innerText;B.closeMenu();B.saveGame();return o;},[dayOf(0,15),dayOf(5,14),dayOf(9,1),dayOf(2,1)]);
 console.log(JSON.stringify(o).slice(0,1200));
 expect(o.riv).toBe(true);expect(o.iceSummer).toBe(false);expect(o.iceWinter).toBe(true);expect(o.swim).toBe(false);expect(o.npcWalk).toBe(true);
 expect(o.fest).toBe("lantern");expect(o.townsFest).toBeGreaterThan(10);expect(o.join).toBe(true);expect(o.song).toMatch(/bard/);expect(o.again).toBe(false);
 expect(o.winterPlant).toBe(false);expect(o.season).toBe(2);expect(o.plant).toBe(true);expect(o.notYet).toBe(0);expect(o.got).toBeGreaterThanOrEqual(4);expect(o.priceAut).toBe(o.priceSpr*2);
 expect(o.mon).toBe("Bloomling");expect(o.drop).toBeGreaterThanOrEqual(1);expect(o.pairs).toEqual(["slime"]);expect(o.breed).toBe(true);expect(o.pets).toBe(3);expect(o.life).toMatch(/Festivals/);expect(errs).toEqual([]);});
