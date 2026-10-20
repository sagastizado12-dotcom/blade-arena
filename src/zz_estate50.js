// ===== v50 ESTATE: build a manor north of Moderno room by room — servants, garden, stable, trophy hall, map room missions =====
const EROOMS=[{k:"hall",n:"🏰 Great Hall",g:600,w:60,d:3,dx:8,dy:2,w2:8,h2:5,need:null,desc:"The heart of the manor."},
 {k:"servants",n:"🧹 Servants' quarters",g:300,w:30,d:2,dx:2,dy:4,w2:5,h2:3,need:"hall",desc:"Servants keep the manor and earn 20g a day from the estate's trade."},
 {k:"garden",n:"🌷 Garden",g:200,w:10,d:2,dx:8,dy:9,w2:8,h2:4,need:"hall",desc:"Hedges, roses and a fountain. Resting here fully heals you."},
 {k:"stable",n:"🐴 Stable",g:350,w:40,d:2,dx:17,dy:4,w2:5,h2:3,need:"hall",desc:"Horses and stalls; your mount is always fed."},
 {k:"trophy",n:"🏆 Trophy hall",g:500,w:30,d:3,dx:2,dy:0,w2:5,h2:3,need:"hall",desc:"Mounts the heads and relics of every great foe you've slain."},
 {k:"maproom",n:"🗺 Map room",g:450,w:20,d:3,dx:17,dy:0,w2:5,h2:3,need:"hall",desc:"A war table: send guards on timed missions for rewards."}];
const MISSIONS=[{k:"bandits",n:"Clear a bandit camp",d:2,g:2,rew:{gold:[120,220]},risk:0.15},{k:"caravan",n:"Escort a merchant caravan",d:3,g:2,rew:{gold:[200,320]},risk:0.1},
 {k:"ruins",n:"Explore old ruins",d:5,g:3,rew:{gold:[150,300],gem:[1,3]},risk:0.25},{k:"beast",n:"Hunt a dire beast",d:4,g:3,rew:{gold:[180,260],pelt:[2,4]},risk:0.3},{k:"timber",n:"Fell timber in the wilds",d:2,g:1,rew:{wood:[20,40]},risk:0.05}];
const EST=()=>{world.estate=world.estate||{rooms:{},q:[],missions:[],log:[]};return world.estate;};
const roomBuilt=k=>!!EST().rooms[k];
function eRoomStart(k){const R=EROOMS.find(r=>r.k===k);const E=EST();if(roomBuilt(k)||E.q.some(q=>q.k===k))return false;if(R.need&&!roomBuilt(R.need)){toast("Build the Great Hall first.");return false;}
  const M=MODS();const tre=M?M.treasury:0;if((P.gold||0)+tre<R.g){toast("🏰 Not enough gold.");return false;}if((P.inv.wood||0)<R.w){toast(`🏰 Need ${R.w} wood.`);return false;}
  const t=Math.min(tre,R.g);if(M)M.treasury-=t;P.gold-=R.g-t;P.inv.wood-=R.w;E.q.push({k,done:world.day+R.d});toast(`🏗 Building the ${R.n.slice(2)} (${R.d} days)`);try{jAdd(`I began building the ${R.n.slice(2)} at my manor.`,"home");}catch(_){}eApply();return true;}
function eApply(){const E=EST();for(const R of EROOMS){const on=roomBuilt(R.k);for(let y=0;y<R.h2;y++)for(let x=0;x<R.w2;x++){const i=(ESTATE.y+R.dy+y)*WW+ESTATE.x+R.dx+x;if(R.k==="garden")continue;if(on&&OCC[i]<=0)OCC[i]=-2;else if(!on&&OCC[i]===-2)OCC[i]=0;}}}
function eDaily(){const E=EST();for(let i=E.q.length-1;i>=0;i--)if(world.day>=E.q[i].done){const q=E.q.splice(i,1)[0];E.rooms[q.k]=world.day;const R=EROOMS.find(r=>r.k===q.k);const m=`My manor's ${R.n.slice(2)} is finished!`;toast("🏰 "+m);try{jAdd(m,"home");}catch(_){}eApply();}
  if(roomBuilt("servants"))P.gold+=20;
  for(let i=E.missions.length-1;i>=0;i--){const m=E.missions[i];if(world.day<m.done)continue;E.missions.splice(i,1);const D=MISSIONS.find(x=>x.k===m.k);const M=MODS();if(M)M.guards+=m.g;
    const ok=Math.random()>D.risk/(1+m.g*0.2);let txt;if(ok){const got=[];for(const [it,[a,b]] of Object.entries(D.rew)){const v=a+Math.floor(Math.random()*(b-a+1));if(it==="gold")P.gold+=v;else P.inv[it]=(P.inv[it]||0)+v;got.push(`${v} ${it}`);}txt=`Mission "${D.n}" succeeded: ${got.join(", ")}.`;}
    else{if(M&&Math.random()<0.5){M.guards=Math.max(0,M.guards-1);txt=`Mission "${D.n}" failed; one guard was wounded and retired.`;}else txt=`Mission "${D.n}" failed; the guards came back empty-handed.`;}
    E.log.unshift({d:world.day,t:txt});E.log=E.log.slice(0,12);toast("🗺 "+txt);try{jAdd(txt,"home");}catch(_){}}}
function trophies(){const L=[];const K=(()=>{try{return kState();}catch(_){return{};}})();const dr=world.dragonsSlain||0;if(dr)L.push(`🐉 ${dr} dragon head${dr>1?"s":""}`);if(K.demonFallen)L.push("😈 The horns of Demon Lord Malzareth");
  try{if((P.beastsSlain||0))L.push(`🐗 ${P.beastsSlain} great beasts`);}catch(_){}try{for(const b of (world.legend&&world.legend.slain)||[])L.push("👑 "+b);}catch(_){}if(P.raidsDefended)L.push(`🛡 Banners of ${P.raidsDefended} broken raids`);try{if((P.kills||0)>100)L.push(`⚔ A wall of ${P.kills} trophies from the hunt`);}catch(_){}return L;}
function missionMenu(){const E=EST(),M=MODS();const free=M?M.guards:0;const B=MISSIONS.map(D=>({l:`${D.n} (${D.g} guards, ${D.d}d)`,dis:free<D.g,f:()=>{if(M.guards<D.g)return;M.guards-=D.g;E.missions.push({k:D.k,g:D.g,done:world.day+D.d});toast(`🗺 ${D.g} guards set out: ${D.n}.`);missionMenu();}}));
  B.push({l:"Back",f:estateMenu});showMenu("🗺 Map room — missions",`Guards at hand: ${free} (from Moderno's garrison)\n`+(E.missions.map(m=>`⏳ ${MISSIONS.find(x=>x.k===m.k).n}: back in ${Math.max(0,m.done-world.day)}d`).join("\n")||"No guards out.")+(E.log.length?"\n\nReports:\n"+E.log.slice(0,4).map(l=>"· "+l.t).join("\n"):""),B);}
function estateMenu(){const E=EST();const B=[];for(const R of EROOMS){if(roomBuilt(R.k))continue;const q=E.q.find(x=>x.k===R.k);B.push(q?{l:`${R.n}: building… ${Math.max(0,q.done-world.day)}d`,dis:true}:{l:`Build ${R.n} (${R.g}g, ${R.w} wood, ${R.d}d)`,dis:!!(R.need&&!roomBuilt(R.need)),f:()=>{eRoomStart(R.k);estateMenu();}});}
  if(roomBuilt("maproom"))B.unshift({l:"🗺 Map table: missions",f:missionMenu});if(roomBuilt("trophy"))B.unshift({l:"🏆 Trophy hall",f:()=>showMenu("🏆 Trophy hall",trophies().join("\n")||"The walls wait for your first great kill.",[{l:"Back",f:estateMenu}])});
  if(roomBuilt("garden"))B.unshift({l:"🌷 Rest in the garden",f:()=>{P.hp=P.maxHp||P.hp;try{hero.hp=P.maxHp;}catch(_){}toast("🌷 You rest among the roses. Fully healed.");}});
  B.push({l:"🌌 Go to the manor",f:()=>warpTo((ESTATE.x+12)*TILE,(ESTATE.y+ESTATE.h+1)*TILE,"your manor")},{l:"Close"});
  showMenu("🏰 Your manor",EROOMS.map(R=>`${roomBuilt(R.k)?"✅":E.q.some(q=>q.k===R.k)?"🏗":"▫"} ${R.n} — ${R.desc}`).join("\n")+`\nServants: ${roomBuilt("servants")?4:0} · Missions out: ${E.missions.length}`,B);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(Array.isArray(b)&&world){if(t==="Paused")b=[{l:"🏰 Manor",f:estateMenu}].concat(b);else if(t==="🏙 Lord of Moderno"&&!b.some(o=>o&&o._est)){b=b.slice();b.splice(1,0,{_est:1,l:"🏰 Manor & estate",f:estateMenu});}}}catch(_){}return _sm.call(this,t,x,b);};}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{eDaily();}catch(e){console.warn(e);}return r;};}
{const _ay=awayYears;awayYears=function(y){const r=_ay.apply(this,arguments);try{const E=EST();for(const q of E.q)q.done=world.day;for(const m of E.missions)m.done=world.day;eDaily();}catch(_){}return r;};}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);try{if(r)eApply();}catch(_){}return r;};}
// prompt when walking up to the manor door
let eNear=false;{const _u=update;update=function(){_u.apply(this,arguments);try{if(state!=="play"||room||!world||frameN%20)return;const d=Math.hypot(hero.x/TILE-(ESTATE.x+12),hero.y/TILE-(ESTATE.y+8));const n=d<4&&roomBuilt("hall");if(n&&!eNear)toast("🏰 Your manor — walk up to the door to enter; Pause › Manor to manage it.");eNear=n;}catch(_){}};}
// drawing: plot, rooms, scaffolding, servants, garden, horses, trophy banners, war table
function eDrawRoom(R,built,q){const x=(ESTATE.x+R.dx)*16,y=(ESTATE.y+R.dy)*16,w=R.w2*16,h=R.h2*16;
  if(!built){ctx.fillStyle="rgba(120,90,60,.35)";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#8a6a40";ctx.setLineDash([4,3]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);if(q)scaffold(x+4,y-12,w-8,h+8);return;}
  if(R.k==="garden"){ctx.fillStyle="#3a9a3a";ctx.fillRect(x,y,w,h);ctx.fillStyle="#2a7a2a";ctx.fillRect(x,y,w,6);ctx.fillRect(x,y+h-6,w,6);ctx.fillRect(x,y,6,h);ctx.fillRect(x+w-6,y,6,h);
    for(let i=0;i<10;i++){ctx.fillStyle=["#ff5a7a","#ffd23a","#fff","#c86aff"][i%4];ctx.fillRect(x+12+((i*37)%(w-24)),y+12+((i*23)%(h-24)),3,3);}ctx.fillStyle="#b8b0a8";ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,10,6,0,0,7);ctx.fill();ctx.fillStyle="#5ab8ff";ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,8,4,0,0,7);ctx.fill();return;}
  const big=R.k==="hall";const roof=big?"#2a4a8a":R.k==="stable"?"#8a4a2a":R.k==="trophy"?"#7a2a3a":R.k==="maproom"?"#3a5a3a":"#6a5a8a";
  ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(x+3,y+h-2,w,5);ctx.fillStyle=big?"#e8dcc4":"#d8ccb4";ctx.fillRect(x,y+h*0.35,w,h*0.65);ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.strokeRect(x,y+h*0.35,w,h*0.65);
  ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(x-4,y+h*0.38);ctx.lineTo(x+w/2,y-(big?26:12));ctx.lineTo(x+w+4,y+h*0.38);ctx.closePath();ctx.fill();ctx.stroke();
  for(let i=0;i<Math.floor(w/20);i++){ctx.fillStyle="#3a6aa8";ctx.fillRect(x+8+i*20,y+h*0.5,7,8);ctx.strokeRect(x+8+i*20,y+h*0.5,7,8);}
  ctx.fillStyle="#6a4422";ctx.fillRect(x+w/2-5,y+h-14,10,14);
  if(big){ctx.fillStyle="#5a3a1a";ctx.fillRect(x+w/2-1,y-48,2,24);ctx.fillStyle=MOD_FLAG.field;ctx.fillRect(x+w/2+1,y-48,14,9);ctx.fillStyle=MOD_FLAG.star;ctx.fillRect(x+w/2+6,y-45,3,3);for(const tx of [x-6,x+w-6]){ctx.fillStyle="#c8c0b8";ctx.fillRect(tx,y-6,12,h*0.65+6+h*0.35);ctx.strokeRect(tx,y-6,12,h+6);ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(tx-2,y-6);ctx.lineTo(tx+6,y-20);ctx.lineTo(tx+14,y-6);ctx.fill();}}
  if(R.k==="stable"){for(let i=0;i<2;i++){const hx=x+10+i*30,hy=y+h+2;ctx.fillStyle=i?"#6a4a2a":"#c8a070";ctx.fillRect(hx,hy,14,7);ctx.fillRect(hx+12,hy-5,4,7);ctx.fillRect(hx+1,hy+7,2,5);ctx.fillRect(hx+11,hy+7,2,5);}}
  if(R.k==="trophy"){ctx.fillStyle="#d84a3a";ctx.fillRect(x+6,y+h*0.4,5,10);ctx.fillStyle="#3a7ad8";ctx.fillRect(x+w-11,y+h*0.4,5,10);ctx.font="10px system-ui";ctx.textAlign="center";ctx.fillText(trophies().length?"🐉":"",x+w/2,y+h*0.45);}
  if(R.k==="maproom"){ctx.fillStyle="#8a6a3a";ctx.fillRect(x+w/2-12,y+h+3,24,10);ctx.fillStyle="#d8c890";ctx.fillRect(x+w/2-10,y+h+4,20,7);ctx.fillStyle="#d84a3a";ctx.fillRect(x+w/2-4,y+h+6,2,2);ctx.fillRect(x+w/2+4,y+h+7,2,2);}}
{const _dw=drawWallsList;drawWallsList=function(list,vis){_dw.apply(this,arguments);try{if(!world||!vis(ESTATE.x*16,ESTATE.y*16,ESTATE.w*16+60))return;const E=EST();
  list.push({y:ESTATE.y*16,f:()=>{ctx.strokeStyle="#8a5a2a";ctx.lineWidth=1.6;ctx.strokeRect(ESTATE.x*16-4,ESTATE.y*16-20,ESTATE.w*16+8,ESTATE.h*16+24);ctx.fillStyle="#3a2010";ctx.font="bold 7px system-ui";ctx.textAlign="center";ctx.fillText(roomBuilt("hall")?"THE LORD'S MANOR":"MANOR PLOT",(ESTATE.x+12)*16,(ESTATE.y+ESTATE.h)*16+12);}});
  for(const R of EROOMS){const b=roomBuilt(R.k),q=E.q.find(x=>x.k===R.k);list.push({y:(ESTATE.y+R.dy+R.h2)*16+(R.k==="garden"?-R.h2*16:0),f:()=>eDrawRoom(R,b,q)});}
  if(roomBuilt("servants"))for(let i=0;i<4;i++){const t=frameN*0.4+i*90,px=(ESTATE.x+3)*16+((t%(ESTATE.w*16-60))),py=(ESTATE.y+8+i%2*2)*16;list.push({y:py+10,f:()=>{drawChibi(chibiLook(5000+i,"villager","human"),px,py,(Math.floor(t/40))%2?2:1,(frameN>>3)%2);}});}}catch(_){}};}
