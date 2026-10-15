// ===== v35 HIDDEN LORE & THE SEEKER: tablet fragments in every region, the truth of the ageless hero, a climactic sanctum; Seekers across generations =====
const LORE_TXT=[
 "Fragment I — \"We, the Circle of the Ten Winds, could no longer hold the Hollow King beneath the world. Our own lives were too short for the binding.\"",
 "Fragment II — \"So we reached past the edge of the realm and called a soul with no ties here: a wanderer from another world, willing and unknowing.\"",
 "Fragment III — \"His life we tied to the Windstone itself. While the seal holds, time cannot touch him. He will not grow old. He cannot die of years.\"",
 "Fragment IV — \"The price: all he loves here will age and pass, and he will remain. We wept when we wrote this. Forgive us, wanderer.\"",
 "Fragment V — \"Each century the seal weakens. Whispers will follow him; people will fear what they cannot understand. Let the elders guard his secret.\"",
 "Fragment VI — \"The Hollow King feeds on forgetting. Every town that forgets the wanderer loosens a thread of the seal.\"",
 "Fragment VII — \"Our last apprentice will carry the search. Let a Seeker walk beside him in every age, so he is never wholly alone.\"",
 "Fragment VIII — \"If he gathers every word, let him come to the Windstone Sanctum on Stormcrag. There he may choose what the binding means.\""];
function loreSites(){if(loreSites.c)return loreSites.c;const near=(x,y)=>{for(let r=0;r<14;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const tx=x+dx,ty=y+dy;if(!solidTile(tx,ty)&&!isWater(T[ty*WW+tx]))return{x:tx,y:ty};}return{x,y};};
  const a=[...POIS.slice(0,5).map(p=>({...near(p.x+6,p.y+2),r:p.name})),{...near(ISLES[0].x,ISLES[0].y),r:ISLES[0].name},{...near(ISLES[1].x,ISLES[1].y),r:ISLES[1].name},{...near(SETS[18].x,SETS[18].y-12),r:"Nethervale"}];
  a.forEach((s,i)=>s.i=i);loreSites.c=a;return a;}
const SANCT=()=>{if(SANCT.c)return SANCT.c;const I=ISLES[2];for(let r=0;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=I.x+dx,y=I.y+dy;if(!solidTile(x,y)&&!isWater(T[y*WW+x]))return SANCT.c={x,y};}return SANCT.c={x:I.x,y:I.y};};
const LR=()=>{P.lore=P.lore||{found:[],done:false};return P.lore;};
const SK=()=>{world.seek=world.seek||{gen:0,id:null,deadDay:null,log:[]};return world.seek;};
function seeker(){const s=SK();return s.id!=null?npcs.find(n=>n.id===s.id&&n.alive):null;}
const SEEK_NAMES=["Lyra","Maren","Isolde","Wren","Selka","Ottilie","Brisa","Corin","Amara","Tamsin"];
function spawnSeeker(heir){const s=SK();const sid=KINGDOMS[0].cap;let n;const base=heir&&heir.alive?heir:null;
  n=makeNpc(sid,"seeker",base?Math.max(22,base.age):24+Math.floor(Math.random()*6));n.sex="F";n.name=(base?base.name:SEEK_NAMES[s.gen%SEEK_NAMES.length]);if(base){base.alive=false;base.passed={day:world.day,age:base.age,became:"seeker"};n.look=base.look;}
  n.seeker=++s.gen;n.met=false;n.life=Math.max(n.age+50,75);s.id=n.id;s.deadDay=null;const S=SETS[sid];
  const m=s.gen===1?`A woman named ${n.name} arrived in ${S.name}, asking strange questions about old ruins — and about you.`:`${n.name}, ${base?"granddaughter":"apprentice"} of the last Seeker, has taken up the search in ${S.name}.`;
  s.log.push({d:world.day,gen:s.gen,name:n.name,from:base?"descendant":"apprentice"});addNews(sid,m);jAdd(m,"news");return n;}
function seekerYear(){const s=SK();const n=seeker();if(n)return;if(s.id!=null&&s.deadDay==null){const old=npcs.find(m=>m.id===s.id);s.deadDay=world.day;s.log.push({d:world.day,gen:s.gen,name:old?old.name:"?",died:true});addNews(KINGDOMS[0].cap,`The Seeker ${old?old.name:""} has died. Her notes are left in the Royal Library.`);jAdd(`The Seeker ${old?old.name:""} died. Her search waits for someone new.`,"family");}
  if(s.id==null||(world.day-s.deadDay)/YEAR_DAYS>=10){const old=s.id!=null?npcs.find(m=>m.id===s.id):null;const heir=old?npcs.find(k=>k.alive&&k.parents&&k.parents.includes(old.id)&&k.age>=20&&sexOf(k)==="F"):null;spawnSeeker(heir);}}
{const _dt=dailyTick;dailyTick=function(){_dt.apply(this,arguments);try{if(world.day%YEAR_DAYS===0||SK().id==null)seekerYear();else if(SK().id!=null&&!seeker()&&SK().deadDay==null)seekerYear();}catch(e){console.warn(e);}};}
{const _ay=awayYears;awayYears=function(y){_ay(y);try{seekerYear();}catch(_){}};}
const nextSite=()=>loreSites().find(s=>!LR().found.includes(s.i));
function loreHint(){const s=nextSite();return s?`A dusty note in the margin: "Another word-stone lies somewhere in ${s.r}."`:"All the word-stones have been found.";}
{const _dl=dialogLines;dialogLines=function(n){let L;if(n&&n.seeker){const r0=n.role;n.role="farmer";try{L=_dl(n);}finally{n.role=r0;}}else L=_dl(n);try{const s=nextSite();if(n.seeker){L.length=0;L.push(n.met?"Back again? Good. I've been reading the stones.":"You're the one from the old stories, aren't you? I'm "+n.name+". I study the word-stones of the Ten Winds.");
    L.push(s?`My notes point to ${s.r}. Come with me — I think the stones are about you.`:LR().done?"We know the truth now. I'm glad I walked it with you.":"Every stone is found. The Sanctum on Stormcrag waits.");if(LR().found.length)L.push(`(${LR().found.length}/8 fragments deciphered.)`);}
  else if(s&&Math.random()<0.15)L.push(`They say a strange carved stone stands somewhere in ${s.r}.`);}catch(_){}return L;};}
function findFragment(i){const L=LR();if(L.found.includes(i))return;L.found.push(i);const sk=seeker();const site=loreSites()[i];
  const m=`I found a word-stone in ${site.r}${sk?`; ${sk.name} helped me read it`:""}. ${LORE_TXT[i]}`;jAdd(m,"deed");addNews(-1,`The wanderer uncovered an ancient tablet in ${site.r}.`);toast(`🗿 Tablet fragment ${L.found.length}/8 found!`);
  if(sk){sk.friend=Math.min(100,(sk.friend||0)+8);}if(L.found.length===8){toast("🌀 All 8 fragments! The Windstone Sanctum on Stormcrag has opened.");jAdd("Every fragment is found. The Windstone Sanctum on Stormcrag has opened.","deed");}
  showMenu("🗿 Word-stone ("+L.found.length+"/8)",LORE_TXT[i]+(sk?`\n\n${sk.name}: "${["This changes everything.","So that's why you never age…","They knew. They always knew.","We're close now."][L.found.length%4]}"`:""),[{l:"Close"}]);}
function loreMenu(){const L=LR();showMenu("🗿 Lore of the Ten Winds",`${L.found.length}/8 fragments\n\n`+LORE_TXT.map((t,i)=>L.found.includes(i)?t:`Fragment ${["I","II","III","IV","V","VI","VII","VIII"][i]} — ??? (rumored in ${loreSites()[i].r})`).join("\n\n")+
  (L.done?`\n\n✦ The truth: ${L.choice==="renew"?"You renewed the seal and remain the realm's ageless guardian by choice.":"You released the Circle's spirits; the seal is now held by your will alone."}`:"")+`\n\nSeekers: `+(SK().log.filter(x=>!x.died).map(x=>`${x.name} (gen ${x.gen}, ${x.from})`).join(" · ")||"none yet"),[{l:"Close"}]);}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&world)b=[{l:"🗿 Lore"+(LR().found.length?` ${LR().found.length}/8`:""),f:loreMenu}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
// climax: the Sanctum
let sanctPrompt=0;
function sanctumClimax(){const S=SANCT();const b=spawnMob("demonlord",(S.x+2)*TILE,(S.y-2)*TILE,{persist:true});if(b){b.hollowKing=true;b.name="The Hollow King";b.hp=b.maxHp=Math.round(b.maxHp*1.5);}LR().fight=true;toast("👑 The Hollow King rises from the Windstone!");}
function sanctumChoice(){const sk=seeker();showMenu("🌀 The Windstone",`${sk?sk.name+": \"":""}The Circle bound your life to this stone so the Hollow King would sleep. You were never cursed — you were chosen. Now the choice is yours.${sk?"\"":""}`,
  [{l:"Renew the seal — remain the ageless guardian",f:()=>loreEnd("renew")},{l:"Release the Circle's spirits — hold the seal by your own will",f:()=>loreEnd("release")}]);}
function loreEnd(c){const L=LR();L.done=true;L.choice=c;closeMenu();const m=c==="renew"?"At the Windstone I renewed the Circle's seal. I will guard this realm, ageless, as long as it needs me.":"At the Windstone I released the Circle's spirits. The seal is mine now, held by choice, not by a spell.";
  jAdd(m,"deed");addNews(-1,"Light rose from Stormcrag. The bards say the Undying One faced the Hollow King and chose the realm.");P.fame=(P.fame||0)+300;toast("✦ "+m);try{saveGame();}catch(_){}}
{const _ok=onKill;onKill=function(e){const r=_ok.apply(this,arguments);try{if(e&&e.hollowKing){LR().fight=false;setTimeout(sanctumChoice,400);}}catch(_){}return r;};}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(!hero||state!=="play"||room||frameN%10)return;const tx=(hero.x+6)/TILE,ty=(hero.y+8)/TILE;
  for(const s of loreSites())if(!LR().found.includes(s.i)&&Math.abs(s.x+.5-tx)<1.4&&Math.abs(s.y+.5-ty)<1.4){findFragment(s.i);break;}
  const S=SANCT();if(LR().found.length===8&&!LR().done&&!LR().fight&&frameN>sanctPrompt&&Math.abs(S.x+.5-tx)<1.5&&Math.abs(S.y+.5-ty)<1.5){sanctPrompt=frameN+600;
    showMenu("🌀 Windstone Sanctum","The eight words glow on the stone. Something vast stirs beneath it.",[{l:"Speak the words",f:()=>{closeMenu();sanctumClimax();}},{l:"Not yet",f:closeMenu}]);}}catch(_){}};}
{const _d=draw;draw=function(){_d.apply(this,arguments);try{if(!world||state!=="play"||room)return;ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);const L=LR();
  const stone=(x,y,lit,big)=>{if(Math.abs(x-hero.x)>260||Math.abs(y-hero.y)>260)return;const h=big?22:14;ctx.fillStyle="rgba(0,0,0,.3)";ctx.fillRect(x+2,y+13,12,3);ctx.fillStyle=lit?"#7a8aa8":"#6a6670";ctx.fillRect(x+3,y+14-h,10,h);ctx.fillStyle=lit?"#9fe8ff":"#4a4650";for(let k=0;k<3;k++)ctx.fillRect(x+5,y+16-h+k*4,6,1);
    ctx.globalAlpha=.35+.25*Math.sin(frameN*.08);ctx.fillStyle=lit?"#9fe8ff":"#c8a8ff";ctx.beginPath();ctx.arc(x+8,y+8-h/2,big?14:9,0,7);ctx.fill();ctx.globalAlpha=1;};
  for(const s of loreSites())stone(s.x*TILE,s.y*TILE,L.found.includes(s.i),false);if(L.found.length===8)stone(SANCT().x*TILE,SANCT().y*TILE,true,true);ctx.restore();}catch(_){}};}
{const _drm=drawRuinMap;drawRuinMap=function(g,P2,txt,z){_drm(g,P2,txt,z);try{const L=LR();let n=0;for(const s of loreSites())if(L.found.includes(s.i)){const [x,y]=P2(s.x,s.y);txt("🗿 Tablet",x,y-10,"#9fe8ff",10);n++;}
  if(L.found.length===8&&!L.done){const [x,y]=P2(SANCT().x,SANCT().y);txt("🌀 Sanctum",x,y-10,"#c8a8ff",11);}window.__loreMarks=n;}catch(_){}};}
