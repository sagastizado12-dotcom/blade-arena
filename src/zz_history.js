// ===== v34 HISTORY & LEGEND: capital libraries with era books auto-written from events; statues, plaques and bards =====
const ERA_Y=25;
const HI=()=>{world.hist=world.hist||[];return world.hist;};
{const _an=addNews;addNews=function(sid,t,...a){const r=_an(sid,t,...a);try{if(!/Welcome|Gossip|feuding|fast friends|packed up|gave up being/.test(t)){const H=HI();H.push({d:world.day,s:sid,t:String(t)});if(H.length>800)H.splice(0,H.length-800);}}catch(_){}return r;};}
const eraOf=d=>Math.floor(d/YEAR_DAYS/ERA_Y);
const ERA_NAMES=["Age of Arrival","Age of Crowns","Age of Ash","Age of Embers","Age of Tides","Age of Stars","Age of Whispers","Age of Iron","Age of Bells","Age of Lanterns"];
const eraName=e=>ERA_NAMES[e%ERA_NAMES.length]+(e>=ERA_NAMES.length?" "+(1+Math.floor(e/ERA_NAMES.length)):"");
// the hero as legend: distorted more the older the era is
function legendize(t,ageY){let s=String(t).replace(/\s*\((?:F|M)\)/g,"");const who=ageY<15?"the wanderer":ageY<40?"the Silver Wanderer, said to stand seven feet tall,":ageY<80?"the Undying Knight, who some say rode a dragon,":"the Undying One, a spirit sent by the old gods,";
  s=s.replace(/\b(the |a brave )?(wanderer|Demonslayer|DEMONSLAYER)\b/gi,who).replace(/\bI\b/g,who).replace(/\bmy\b/gi,"their");
  if(ageY>=30)s=s.replace(/(\d+)g\b/g,(m,n)=>Math.round(n*(1+ageY/20))+" gold crowns");if(ageY>=60)s=s.replace(/dragon/gi,"great wyrm of a thousand scales");return s.charAt(0).toUpperCase()+s.slice(1);}
function historyBook(e){const nowY=world.day/YEAR_DAYS,ageY=Math.max(0,nowY-(e+0.5)*ERA_Y);const lo=e*ERA_Y*YEAR_DAYS,hi=(e+1)*ERA_Y*YEAR_DAYS;
  const ev=HI().filter(h=>h.d>=lo&&h.d<hi).map(h=>({d:h.d,t:h.t})).concat((P.journal||[]).filter(j=>j.d>=lo&&j.d<hi&&(j.k==="deed"||j.k==="news")).map(j=>({d:j.d,t:j.t})));
  ev.sort((a,b)=>a.d-b.d);const seen=new Set();const out=[];for(const x of ev){const k=x.t.slice(0,40);if(seen.has(k))continue;seen.add(k);out.push(`Year ${Math.floor(x.d/YEAR_DAYS)+1}: ${legendize(x.t,ageY)}`);}
  return {title:`${eraName(e)} (Years ${e*ERA_Y+1}–${(e+1)*ERA_Y})`,lines:out.slice(-14),ageY};}
const libraryHere=()=>{const S=settlementAt(hero.x,hero.y);return S&&(KINGDOMS.some(k=>k.cap===S.id)||S.id===0)?S:null;};
function libraryMenu(){const S=libraryHere();if(!S){toast("Great libraries stand only in the capitals.");return;}const E=eraOf(world.day);const btn=[];
  for(let e=E;e>=0;e--)btn.push({l:"📖 "+eraName(e),f:()=>{const b=historyBook(e);showMenu("📖 "+b.title,(b.lines.length?b.lines.join("\n\n"):"The pages of this age are still being written.")+(b.ageY>=40?"\n\n(The scribe's notes: \"Accounts of this hero vary wildly. Some doubt he ever lived.\")":""),[{l:"Back",f:libraryMenu},{l:"Close"}]);}});
  showMenu(`📚 Royal Library of ${S.name}`,`"Every age is written down here, ${P.king?"Your Majesty":"traveler"}. The oldest books speak of a hero… though stories grow in the telling."`+(typeof loreHint==="function"?"\n\n"+loreHint():""),btn.concat([{l:"Close"}]));}
{const _sm=showMenu;showMenu=function(t,x,b){try{if(t==="Paused"&&Array.isArray(b)&&world&&libraryHere())b=[{l:"📚 Library",f:libraryMenu}].concat(b);}catch(_){}return _sm.call(this,t,x,b);};}
// statues: raised as fame and years grow; damaged when the town hates you or lies in ruin; rebuilt with reputation
const ST=()=>{world.statues=world.statues||{};return world.statues;};
function townHates(sid){const ws=world.sets[sid];return (ws.angryUntil&&ws.angryUntil>absMin())||(ws.bounty||0)>=3||ruinOf(sid);}
function statueTick(){const fame=P.fame||0,y=world.day/YEAR_DAYS;for(const S of SETS){if(!fountainOf(S))continue;const st=ST()[S.id];const need=S.id===0||KINGDOMS.some(k=>k.cap===S.id)?60:150;
  if(!st){if(fame+y*4>=need&&!townHates(S.id)){ST()[S.id]={built:world.day,dmg:false};addNews(S.id,`${S.name} raised a statue of the wanderer in the town square.`);}continue;}
  if(townHates(S.id)&&!st.dmg){st.dmg=true;addNews(S.id,`Someone defaced the wanderer's statue in ${S.name}.`);}else if(st.dmg&&!townHates(S.id)&&fame>=need){st.dmg=false;st.rebuilt=world.day;addNews(S.id,`${S.name} restored the wanderer's statue.`);}}}
{const _dt=dailyTick;dailyTick=function(){_dt.apply(this,arguments);try{statueTick();}catch(_){}};}
const statuePos=S=>{const f=fountainOf(S);return f?{x:(f.x+3)*TILE,y:(f.y-1)*TILE}:null;};
const BARD_SONGS=["🎵 Sing of the wanderer, blade of the dawn…","🎵 He came from nowhere and never grew old…","🎵 The dragon fell and the kingdoms knelt…","🎵 Raise a cup to the Undying One!"];
{const _d=draw;draw=function(){_d.apply(this,arguments);try{if(!world||state!=="play"||room)return;ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);
  for(const id in ST()){const S=SETS[id],st=ST()[id],p=statuePos(S);if(!p||Math.abs(p.x-hero.x)>260||Math.abs(p.y-hero.y)>260)continue;const x=p.x,y=p.y;
    ctx.fillStyle="#6a6470";ctx.fillRect(x-2,y+10,20,8);ctx.fillStyle="#8a8490";ctx.fillRect(x,y+8,16,4);
    if(!st.dmg){ctx.fillStyle="#b8b4c0";ctx.fillRect(x+5,y-10,6,18);ctx.beginPath();ctx.arc(x+8,y-13,4,0,7);ctx.fill();ctx.fillStyle="#d0ccd8";ctx.fillRect(x+12,y-18,2,16);ctx.fillRect(x+10,y-6,6,2);}
    else{ctx.fillStyle="#8a8490";ctx.fillRect(x+5,y,6,8);ctx.fillRect(x-4,y+14,6,4);ctx.fillRect(x+16,y+13,5,3);ctx.fillStyle="#c03030";ctx.font="6px sans-serif";ctx.fillText("✗",x+5,y-2);}
    if(!st.dmg){const bx=x+26,by=y+6;ctx.fillStyle="#3a7a3a";ctx.fillRect(bx,by,8,10);ctx.fillStyle="#f0c8a0";ctx.beginPath();ctx.arc(bx+4,by-3,4,0,7);ctx.fill();ctx.fillStyle="#c04040";ctx.fillRect(bx-1,by-8,10,3);ctx.fillStyle="#a07040";ctx.fillRect(bx+6,by+2,5,6);
      if(frameN%60<40){ctx.fillStyle="#fff";ctx.font="7px sans-serif";ctx.fillText("♪",bx+10,by-8-(frameN%40)/8);}
      if(Math.hypot(hero.x-bx,hero.y-by)<70){ctx.font="7px sans-serif";const t=BARD_SONGS[Math.floor(frameN/240)%BARD_SONGS.length];ctx.fillStyle="rgba(0,0,0,.6)";ctx.fillRect(bx-60,by-26,ctx.measureText(t).width+8,10);ctx.fillStyle="#ffe8a0";ctx.fillText(t,bx-56,by-18);window.__bard=frameN;}}}
  ctx.restore();}catch(_){}};}
let plaqueAt=0;
function plaqueText(sid){const st=ST()[sid],S=SETS[sid],age=(world.day-st.built)/YEAR_DAYS;return st.dmg?`The statue is broken and defaced. The plaque is scratched beyond reading.`:
  `"Raised in Year ${Math.floor(st.built/YEAR_DAYS)+1} by the people of ${S.name} in honor of ${legendize("the wanderer",age)}`.replace(/,$/,"")+`, who defended this land${(P.titles||[]).length?" — "+P.titles.join(", "):""}."${st.rebuilt?`\n(Restored Year ${Math.floor(st.rebuilt/YEAR_DAYS)+1}.)`:""}`;}
function readPlaque(sid){showMenu("🗿 Statue of the Wanderer",plaqueText(sid),[{l:"Close"}]);}
{const _u=update;update=function(){_u.apply(this,arguments);try{if(!hero||state!=="play"||room||frameN<plaqueAt||frameN%10)return;for(const id in ST()){const p=statuePos(SETS[id]);if(p&&Math.hypot(hero.x-p.x,hero.y-(p.y+18))<14){plaqueAt=frameN+400;readPlaque(+id);break;}}}catch(_){}};}
