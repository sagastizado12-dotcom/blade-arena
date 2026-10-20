// ===== v55: every NPC is talkable + personal weekly schedules with days off =====
// ---- personal schedule (deterministic per NPC) ----
const HOBBIES=["fishing","the market","the tavern","prayer at the fountain shrine","visiting family","a quiet day at home","visiting friends"];
const WEEKDAYS=["Moonday","Tiwsday","Wodensday","Thunorsday","Freyday","Saturnday","Sunday"];
const sched=n=>{if(!n._sc){const r=(Math.imul(n.id+1,2654435761)>>>0)&0x7fffffff;n._sc={wake:5+(r%4),sleep:21+((r>>3)%3),hob:(r>>6)%HOBBIES.length,off1:(r>>9)%7,two:((r>>12)%3)===0,spot:(r>>14)%8};}return n._sc;};
const isWorker=n=>n&&n.alive&&!n.heroKid&&(n.age||0)>=16&&n.role!=="child"&&n.role!=="leader"&&!n.adv&&!n.soldierT&&!(P.knights||[]).includes(n.id)&&!n.manor;
function dayOff(n,d){d=d==null?world.day:d;const w=((d%7)+7)%7;if(!n)return false;if(n.role==="guard"&&n.post!=null)return guardOff(n,d);if(!isWorker(n))return false;const S=sched(n);return w===S.off1||(S.two&&w===(S.off1+3)%7);}
// shops/inns: substitute = an adult housemate, else closed
const subFor=n=>npcs.find(o=>o!==n&&o.alive&&o.home===n.home&&(o.age||0)>=16&&o.role!=="child"&&!dayOff(o));
function shopClosedToday(b){if(!b||!world)return null;const own=npcs.find(n=>n.alive&&n.work===b.id);if(!own||!dayOff(own))return null;const s=subFor(own);return s?{sub:s,own}:{closed:true,own};}
const SHORE={};function shoreOf(S){if(SHORE[S.id]!==undefined)return SHORE[S.id];let best=null,bd=1e9;for(let y=S.y-40;y<=S.y+40;y+=1)for(let x=S.x-40;x<=S.x+40;x+=1){const t=tAt(x,y);if(t!==SHAL&&t!==DEEP)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){if(!walk(x+dx,y+dy))continue;const d=Math.hypot(x-S.x,y-S.y);if(d<bd){bd=d;best=[x+dx,y+dy];}}}return SHORE[S.id]=best;}
function leisureTarget(n){const S=SETS[n.s],h=hour(),sc=sched(n),home=buildings[n.home];const inHome=home?{...doorOf(home),inside:true,b:n.home}:null;
  if(h<sc.wake+2||h>=sc.sleep)return inHome;const hob=HOBBIES[sc.hob];const inn=S.bIdx.find(b=>buildings[b].kind==="inn");const f=typeof fountainOf==="function"?fountainOf(S):null;
  const spot=k=>({x:((f?f.x:S.x)+((n.id*3+k)%7)-3)*TILE,y:((f?f.y:S.y)+2+((n.id+k)%3))*TILE});
  if(h>=18&&inn!=null&&(sc.hob===2||n.id%3===0))return{...doorOf(buildings[inn]),inside:true,b:inn};
  if(hob==="fishing"){const p=shoreOf(S);if(p&&h<17)return{x:p[0]*TILE+1,y:p[1]*TILE};}
  if(hob==="the tavern"&&inn!=null&&h>=12)return{...doorOf(buildings[inn]),inside:true,b:inn};
  if(hob==="visiting family"||hob==="visiting friends"){const o=npcs.find(o=>o!==n&&o.alive&&o.s===n.s&&o.home!==n.home&&(hob==="visiting family"?(o.parents||[]).includes(n.id)||(n.parents||[]).includes(o.id)||o.id===n.spouse:(n.rel&&n.rel[o.id]>0)||o.id%7===n.id%7));if(o&&buildings[o.home]&&h>=13&&h<17)return{...doorOf(buildings[o.home]),inside:true,b:o.home};}
  if(hob==="a quiet day at home")return inHome;if(hob==="prayer at the fountain shrine"&&h<12)return spot(0);
  return spot(1+Math.floor(h/3));}
{const _nt=npcTarget;npcTarget=function(n){try{if(n&&world&&!n.huddle&&!n.engage&&!n.down&&!(P.party||[]).includes(n.id)&&!n.duelist){const ws=world.sets[n.s];if(ws&&(ws.raid||ws.dragon||ws.festival))return _nt.apply(this,arguments);
  if(n.role==="guard"&&n.post!=null){if(!onShift(n)&&guardOff(n,world.day)&&!(hour()<6&&!guardOff(n,world.day-1)&&!n.relief&&n.shift===2))return leisureTarget(n)||_nt.apply(this,arguments);return _nt.apply(this,arguments);}
  if(isWorker(n)){if(dayOff(n))return leisureTarget(n)||_nt.apply(this,arguments);const sc=sched(n),h=hour();if((h<sc.wake||h>=sc.sleep+1)&&buildings[n.home]&&!(n.role==="innkeeper"&&h>=sc.sleep))return{...doorOf(buildings[n.home]),inside:true,b:n.home};}}}catch(_){}return _nt.apply(this,arguments);};}
// shop/inn: closed sign or a substitute at the counter
{const _dl=doorLocked;doorLocked=function(b){try{const c=shopClosedToday(b);if(c&&c.closed&&(b.kind==="shop"))return true;}catch(_){}return _dl.apply(this,arguments);};}
{const _eb=enterBuilding;enterBuilding=function(b){try{const c=shopClosedToday(b);if(c&&c.closed&&b.kind==="shop"){toast(`🔒 Closed today — it's ${c.own.name}'s day off. Back tomorrow!`);return;}}catch(_){}return _eb.apply(this,arguments);};}
{const _rn=roomNpcs;roomNpcs=function(){const L=_rn.apply(this,arguments);try{if(room&&room.b&&room.b.id>=0){const c=shopClosedToday(room.b);if(c&&c.sub){for(const r of L)if(r.pose==="work"&&r.n===c.own)r.n=c.sub;if(!L.some(r=>r.pose==="work")&&room.sp.work)L.push({n:c.sub,x:room.sp.work[0]*16,y:room.sp.work[1]*16,pose:"work"});}else if(c&&c.closed)return L.filter(r=>!(r.pose==="work"&&r.n===c.own));}}catch(_){}return L;};}
// talk lines reflect the schedule
{const _dl=dialogLines;dialogLines=function(n){const L=_dl.apply(this,arguments);try{if(Array.isArray(L)&&n&&world){const sc=sched(n);
  if(n.role==="child"){}else if(dayOff(n))L.splice(1,0,`It's my day off! ${["I'm off fishing.","Just browsing the market.","See you at the tavern later!","I'll say a prayer at the fountain shrine.","I'm visiting family today.","A quiet day at home, at last.","Off to see some friends."][sc.hob]}`);
  else if(n.role==="guard"&&n.post!=null)L.splice(1,0,onShift(n)?`On duty${n.relief?" as relief":""} — my post is the ${allPosts()[n.s][n.post]&&allPosts()[n.s][n.post].k==="tower"?"watchtower":"gate"}.`:`Off shift. Next day off: ${WEEKDAYS[[0,1,2,3,4,5,6].find(k=>guardOff(n,world.day+k))!=null?((world.day+[0,1,2,3,4,5,6].find(k=>guardOff(n,world.day+k)))%7):0]}.`);
  else if(isWorker(n))L.splice(1,0,`I'm up at ${sc.wake}:00 and in bed by ${sc.sleep}:00. My day off is ${WEEKDAYS[sc.off1]}${sc.two?" and "+WEEKDAYS[(sc.off1+3)%7]:""} — I love ${HOBBIES[sc.hob]}.`);}}catch(_){}return L;};}
const weekdayStr=()=>WEEKDAYS[((world.day%7)+7)%7];
// ---- Manor staff: real servants (talkable), working the estate by day ----
function staffManor(){if(!world||!roomBuilt("servants"))return 0;let have=npcs.filter(n=>n.alive&&n.manorStaff);let made=0;for(let i=have.length;i<4;i++){const n=makeNpc(MOD_ID,"servant",20+Math.floor(Math.random()*35));n.manorStaff=true;made++;}return made;}
{const _nt=npcTarget;npcTarget=function(n){try{if(n&&n.manorStaff&&world&&!dayOff(n)){const h=hour(),d=typeof manorDoor==="function"?manorDoor():doorOf(buildings[n.home]);if(h<6||h>=21)return{x:d.x,y:d.y,inside:true,b:"manor"};
  const k=(n.id+Math.floor(h/2))%4;return{x:(ESTATE.x+3+k*5)*TILE,y:(ESTATE.y+8+(n.id%2))*TILE};}}catch(_){}return _nt.apply(this,arguments);};}
{const _dl=dialogLines;dialogLines=function(n){const L=_dl.apply(this,arguments);try{if(n&&n.manorStaff&&Array.isArray(L))L.splice(1,0,pick(["The silver is polished and the hearth is lit, my lord.","The garden roses came in beautifully this year.","Shall I air out the guest rooms?","Everything is in order at the manor."]));}catch(_){}return L;};}
{const _ed=eDaily;eDaily=function(){const r=_ed.apply(this,arguments);try{staffManor();}catch(_){}return r;};}
// ---- tap/approach: sentries on towers and NPCs drawn in special places are talkable ----
{const _it=interact;interact=function(){try{if(!room&&hero&&!hero.boat){const hx=hero.x+6,hy=hero.y+8;
  for(const n of npcs){if(!n.alive||n.role!=="guard"||n.post==null||!n.inside||!onShift(n))continue;const q=postPx(n);if(!q||q.p.k!=="tower")continue;const t=TOWERS[q.p.tw];if(t&&Math.hypot(t.x*16+8-hx,t.y*16+8-hy)<34){talk(n);return true;}}
  for(const t of TOWERS){if(Math.hypot(t.x*16+8-hx,t.y*16+8-hy)>28)continue;const s=t.s!=null?t.s:(()=>{let b=0,bd=1e9;for(const S of SETS){const d=Math.hypot(S.x-t.x,S.y-t.y);if(d<bd){bd=d;b=S.id;}}return b;})();const g=npcs.find(n=>n.alive&&n.s===s&&n.role==="guard");if(g){talk(g);return true;}}}}catch(_){}return _it.apply(this,arguments);};}
{const _ld=loadGame;loadGame=function(){const r=_ld.apply(this,arguments);try{if(r&&world)staffManor();}catch(_){}return r;};}
