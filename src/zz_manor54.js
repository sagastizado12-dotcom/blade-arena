// ===== v54 Manor interior: enterable manor with hall, dining, wives' bedrooms, kids' room, trophy hall; residents with routines =====
const MAN=()=>{world.manor=world.manor||{res:{}};return world.manor;};
const MANOR_B=()=>({kind:"manor",id:-77,s:MOD_ID,x:ESTATE.x+10.4,y:ESTATE.y+2,w:8,h:5});
const manorDoor=()=>doorOf(MANOR_B());
const WBEDS=[[2,2],[5,2],[2,9],[5,9]],KBEDS=[[19,2],[21,2],[23,2]];
const manorRes=()=>npcs.filter(n=>n.alive&&n.manor);
const wifeRes=()=>manorRes().filter(n=>isWife(n));
const kidsOf=w=>npcs.filter(n=>n.alive&&(n.parents||[]).includes(w.id)&&(n.age||0)<18);
function moveIn(w){if(!roomBuilt("hall")){toast("Build the Great Hall of your manor first.");return false;}if(!isWife(w))return false;const M=MAN();const used=new Set(Object.values(M.res));let bed=WBEDS.findIndex((_,i)=>!used.has(i));if(bed<0){toast("Every bedroom is taken.");return false;}
  w.manor=true;M.res[w.id]=bed;for(const k of kidsOf(w)){k.manor=true;}const m=`${w.name} moved into the manor${kidsOf(w).length?" with the children":""}.`;toast("🏰 "+m);try{jAdd(m,"family");}catch(_){}return true;}
function moveOut(w){w.manor=false;delete MAN().res[w.id];for(const k of kidsOf(w))k.manor=false;toast(`🏠 ${w.name} moved back home.`);}
function assignBed(w,i){const M=MAN();for(const id in M.res)if(M.res[id]===i&&+id!==w.id)M.res[id]=M.res[w.id];M.res[w.id]=i;}
function residentsMenu(){const R=wifeRes();const B=[];for(const w of R){const i=MAN().res[w.id];for(let j=0;j<WBEDS.length;j++)if(j!==i)B.push({l:`${w.name}: move to bedroom ${j+1}`,f:()=>{assignBed(w,j);residentsMenu();}});B.push({l:`${w.name}: move back home`,f:()=>{moveOut(w);residentsMenu();}});}
  B.push({l:"Back",f:estateMenu});const kids=manorRes().filter(n=>!isWife(n));showMenu("👥 Manor residents",(R.map(w=>`💞 ${w.name} — bedroom ${MAN().res[w.id]+1}`).join("\n")||"No one lives here yet. Ask a wife to move in from her talk menu.")+(kids.length?`\n🧒 Children: ${kids.map(k=>k.name).join(", ")} (kids' room)`:""),B);}
// routine: mornings and evenings at home, days in the garden or Moderno's market, back through the gate at night to sleep
{const _nt=npcTarget;npcTarget=function(n){try{if(n&&n.manor&&world&&roomBuilt("hall")&&!(P.party||[]).includes(n.id)){const h=hour(),d=manorDoor();
  if(h>=21||h<7)return{x:d.x,y:d.y,inside:true,b:"manor"};if(h<9||h>=18)return{x:d.x,y:d.y,inside:true,b:"manor"};
  if(n.id%2||(n.age||0)<18)return{x:(ESTATE.x+9+(n.id%6))*TILE,y:(ESTATE.y+11+(n.id%2))*TILE};const S=SETS[MOD_ID];return{x:(S.x-6+n.id%5)*TILE,y:(S.y+6)*TILE};}}catch(_){}return _nt.apply(this,arguments);};}
function buildManorRoom(){const w=26,h=16,F=[];const add=(type,x,y,fw,fh,solid=true,extra={})=>F.push({type,x,y,w:fw,h:fh,solid,...extra});
  // partitions (drawn as wall) with doorways at y 4 and 11
  for(let y=2;y<h-1;y++){if(y!==4&&y!==11){add("pwall",8,y,1,1);add("pwall",17,y,1,1);}}for(let x=1;x<8;x++)if(x!==4)add("pwall",x,7,1,1);for(let x=18;x<25;x++)if(x!==21)add("pwall",x,7,1,1);
  add("fire",12,1,2,1);add("window",10,0,2,1,false);add("window",14,0,2,1,false);add("table",10,5,6,1,true,{act:"dine"});for(let i=0;i<6;i++){add("chair",10+i,4,1,1,false);add("chair",10+i,6,1,1,false);}add("stove",9,2,1,1);add("bookshelf",16,2,1,1);
  add("carpet",12,8,2,7,false);add("rug2",10,9,6,3,false);add("plant",9,13,1,1);add("plant",16,13,1,1);add("lamp",9,9,1,1);add("lamp",16,9,1,1);add("painting",11,0,1,1,false);
  WBEDS.forEach(([x,y],i)=>add("bed",x,y,1,2,true,{wbed:i}));add("wardrobe",7,2,1,1);add("wardrobe",7,9,1,1);add("rug",2,4,4,2,false);add("rug",2,11,4,2,false);add("bed",3,13,2,1,true,{hbed:1});
  KBEDS.forEach(([x,y],i)=>add("bed",x,y,1,2,true,{kbed:i}));add("chest",24,5,1,1,true,{toys:1});add("rug2",19,4,4,2,false);
  for(const x of [19,21,23])add("heads",x,8,1,1,false,{act:"trophy"});add("trophy",18,13,1,1,true,{act:"trophy"});add("trophy",24,13,1,1,true,{act:"trophy"});add("banner",20,8,1,1,false);add("chest",24,11,1,1,true,{store:true});add("armchair",21,12,1,1,false);
  return{b:MANOR_B(),kind:"manor",w,h,F,sp:{beds:[],work:null,stove:null,spots:[]},door:{x:13,y:h-1}};}
let manorCd=0;
function enterManor(){if(!roomBuilt("hall"))return false;const d=manorDoor();fadeQuick(()=>{room=buildManorRoom();room.out={x:d.x-6,y:d.y+8};hero.x=room.door.x*16+2;hero.y=(room.h-2)*16;hero.dir=3;toast("Entered: your manor");});manorCd=90;return true;}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(manorCd>0)manorCd--;if(state!=="play"||room||!world||manorCd>0||!roomBuilt("hall"))return;const d=manorDoor();if(hero.dir===3&&Math.abs(hero.x+6-d.x)<10&&Math.abs(hero.y+8-d.y)<12&&(hero.vy<0||getMoveInput().my<0))enterManor();}catch(_){}};}
{const _lr=leaveRoom;leaveRoom=function(){if(room&&room.kind==="manor")manorCd=90;return _lr.apply(this,arguments);};}
{const _rn=roomNpcs;roomNpcs=function(){if(!room||room.kind!=="manor")return _rn.apply(this,arguments);const L=[],night=hour()>=22||hour()<7;let ki=0,si=0;
  for(const n of manorRes()){if(!n.inside||n.at!=="manor")continue;if(isWife(n)){const i=MAN().res[n.id];const p=WBEDS[i]||WBEDS[0];if(night)L.push({n,x:p[0]*16,y:(p[1]+0.4)*16,pose:"sleep"});else{const s=[[11,4.2],[13,4.2],[14,6.4],[12,10]][si++%4];L.push({n,x:s[0]*16,y:s[1]*16,pose:hour()<9||hour()>=18?"sit":"idle"});}}
   else{const p=KBEDS[ki++%KBEDS.length];if(night)L.push({n,x:p[0]*16,y:(p[1]+0.4)*16,pose:"sleep"});else L.push({n,x:(19+ki)*16+Math.sin(frameN*.02+n.id)*8,y:5*16,pose:"idle"});}}return L;};}
{const _ri=roomInteract;roomInteract=function(){if(!room||room.kind!=="manor")return _ri.apply(this,arguments);const hx=hero.x+6,hy=hero.y+6;
  for(const r of roomNpcs())if(Math.hypot(r.x+8-hx,r.y+8-hy)<24){if(r.pose==="sleep"){toast(r.n.name+" is fast asleep. Zzz...");return;}return talk(r.n);}
  for(const f of room.F){const cx=(f.x+f.w/2)*16,cy=(f.y+f.h/2)*16;if(Math.abs(cx-hx)>f.w*8+14||Math.abs(cy-hy)>f.h*8+14)continue;
    if(f.type==="bed"&&(f.hbed||f.wbed!=null))return sleep(MANOR_B());if(f.act==="trophy")return showMenu("🏆 Trophy hall",trophies().join("\n")||"The walls wait for your first great kill.",[{l:"Close"}]);if(f.act==="dine"){toast("🍽 You share a meal at the long table.");return;}if(f.store)return storageMenu();if(f.type==="fire"){toast("The great hearth crackles.");return;}}};}
// partitions + room labels on top of the generic interior renderer
{const _dr=drawRoom;drawRoom=function(){_dr.apply(this,arguments);try{if(!room||room.kind!=="manor")return;const R=room,Wp=R.w*16,Hp=R.h*16;const ox=Math.round(Math.max(0,(W-Wp)/2)-(Wp>W?clamp(hero.x+6-W/2,0,Wp-W):0)),oy=Math.round(Math.max(0,(H-Hp)/2)-(Hp>H?clamp(hero.y+6-H/2,0,Hp-H):0));
  ctx.save();ctx.translate(ox,oy);for(const f of R.F){if(f.type!=="pwall")continue;ctx.fillStyle="#d8bc88";ctx.fillRect(f.x*16,f.y*16-6,16,22);ctx.fillStyle="#6a4020";ctx.fillRect(f.x*16,f.y*16+10,16,6);ctx.strokeStyle="rgba(0,0,0,.3)";ctx.strokeRect(f.x*16+.5,f.y*16-5.5,15,21);}
  ctx.font="bold 7px system-ui";ctx.textAlign="center";ctx.fillStyle="#3a2010";const lab=(t,x,y)=>{ctx.fillStyle="rgba(255,240,210,.8)";ctx.fillRect(x-24,y-7,48,10);ctx.fillStyle="#3a2010";ctx.fillText(t,x,y);};
  lab("GREAT HALL",13*16,8*16+4);lab("DINING",13*16,3*16+12);const res=wifeRes();WBEDS.forEach((p,i)=>{const w=res.find(n=>MAN().res[n.id]===i);lab(w?w.name:"Bedroom "+(i+1),(p[0]+1.5)*16,(p[1]+3)*16+2);});lab("CHILDREN",21.5*16,6*16+6);lab("TROPHY HALL",21.5*16,10*16+4);ctx.restore();}catch(_){}};}
// talk menu: wives can move in / out
let TALK_N=null;{const _t=talk;talk=function(n){TALK_N=n;try{return _t.apply(this,arguments);}finally{setTimeout(()=>{TALK_N=null;},0);}};}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(Array.isArray(b)&&world){const n=TALK_N;
  if(n&&isWife(n)&&roomBuilt("hall")&&!b.some(o=>o&&o._man)){b=b.slice();b.splice(Math.max(0,b.length-1),0,n.manor?{_man:1,l:"🏠 Move back to your old home",f:()=>{moveOut(n);closeMenu();}}:{_man:1,l:"🏰 Move into the Manor",f:()=>{moveIn(n);closeMenu();}});}
  if(t==="🏰 Your manor"&&!b.some(o=>o&&o._mres)){b=[{_mres:1,l:`👥 Residents (${wifeRes().length})`,f:residentsMenu}].concat(b);if(roomBuilt("hall"))b.splice(1,0,{_mres:1,l:"🚪 Enter the manor",f:()=>{closeMenu();const d=manorDoor();hero.x=d.x-6;hero.y=d.y+4;enterManor();}});}
  if(t==="🌌 Teleport — where to?"&&roomBuilt("hall")&&!b.some(o=>o&&o._mtp)){const d=manorDoor();b=b.slice();b.splice(0,0,{_mtp:1,l:"🏰 Your manor (Moderno)",f:()=>warpTo(d.x-6,d.y+6,"your manor")});}}}catch(_){}return _sm.call(this,t,x,b);};}
// world map: manor marker
{const _df=drawFullMap;drawFullMap=function(){_df.apply(this,arguments);try{if(!world)return;const q=mapToScreen(ESTATE.x+12,ESTATE.y+6);const g=document.getElementById("mapc").getContext("2d");g.font="14px system-ui";g.textAlign="center";g.fillText(roomBuilt("hall")?"🏰":"▫",q.x,q.y+5);g.font="bold 9px system-ui";g.fillStyle="#000";g.fillText(roomBuilt("hall")?"Manor":"Manor plot",q.x+.6,q.y-8.4);g.fillStyle="#ffe6a8";g.fillText(roomBuilt("hall")?"Manor":"Manor plot",q.x,q.y-9);}catch(_){}};}
// away-life: meals at the manor
{const _am=awayMeals;awayMeals=function(hrs){const r=_am.apply(this,arguments);try{const w=wifeRes()[0];if(r&&w)return r.replace(/ in [^.]+\.$/," at the manor.").replace(/^I ate (\w+) at the inn at the manor\./,"I ate $1 at the manor.");}catch(_){}return r;};}
