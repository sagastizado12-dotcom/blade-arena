// ===== v36a CHANGING NPC ROUTINES: weekday/season/weather/age/job/life-event schedules =====
const WDAYS=["Moonday","Tideday","Marketday","Hearthday","Fireday","Tavernday","Restday"];
const RT={wd:()=>world.day%7,market:d=>d===2||d===5,tavern:d=>d===4||d===5,rest:d=>d===6,
  rainy:()=>world.weather==="rain"||world.weather==="storm"};
const rh=(n,k)=>hash2(n.id,world.day,k);
const bOf=(S,kind)=>S.bIdx.filter(b=>buildings[b]&&buildings[b].kind===kind);
const isElder=n=>(n.age||30)>=60&&n.role!=="child";
const atB=b=>b==null?null:{...doorOf(buildings[b]),inside:true,b};
const outB=(b,n,r)=>{if(b==null)return null;const d=doorOf(buildings[b]);const a=(n.id*2.3+world.day)%6.28;return{x:d.x+Math.cos(a)*(r||18),y:d.y+12+Math.abs(Math.sin(a))*(r||14)};};
const fntSpot=(n,S,rad)=>{const f=fountainOf(S);const cx=f?f.x:S.x,cy=f?f.y:S.y;const a=n.id*1.13+(n.age||0)*0.07;return{x:(cx+Math.cos(a)*(rad||1.8))*TILE,y:(cy+0.4+Math.sin(a)*(rad||1.4))*TILE};};
// what is this NPC doing right now and why (also used for dialogue/tests)
function routineOf(n,hh){if(!world||!n||!n.alive)return null;const S=SETS[n.s];if(!S)return null;const h=hh==null?hour():hh,d=RT.wd(),sea=season();
  if(h>=22||h<6)return{k:"sleep",t:{...doorOf(buildings[n.home]),inside:true,b:n.home}};
  const inn=bOf(S,"inn")[0],shops=bOf(S,"shop").concat(bOf(S,"guild")),hall=bOf(S,"castle")[0]!=null?bOf(S,"castle")[0]:bOf(S,"guild")[0];
  const kid=n.role==="child"||(n.age||20)<14,guard=n.role==="guard"||jobOf(n)==="guard";
  if(guard)return null; // guards keep patrols
  if(RT.rainy()&&!(sea===1&&rh(n,3)<0.25)){ // rainy day: mostly indoors (summer showers tempt a few out)
    if(kid)return{k:"indoors (rain)",t:atB(n.home)};
    if(h>=17&&inn!=null&&rh(n,4)<0.4)return{k:"tavern (rain)",t:atB(inn)};
    return{k:"indoors (rain)",t:n.work!=null&&h>=8&&h<17?atB(n.work):atB(n.home)};}
  if(kid){if(d<5&&h>=8&&h<12)return{k:"school",t:outB(hall!=null?hall:inn,n,22)};
    if(h<18)return{k:"playing",t:rh(n,5)<0.5?fntSpot(n,S,4+rh(n,6)):{x:(S.x+Math.cos(n.id+frameN/900)*3)*TILE,y:(S.y+Math.sin(n.id*1.7+frameN/900)*2)*TILE}};
    return{k:"home for supper",t:atB(n.home)};}
  if(RT.rest(d)&&h>=9&&h<11)return{k:"church",t:fntSpot(n,S,4.2)};
  if(isElder(n)&&h>=9&&h<17&&!(h>=12&&h<13))return{k:"fountain",t:fntSpot(n,S,3.6)};
  if(RT.market(d)&&h>=9&&h<13&&rh(n,7)<0.7){const sb=shops.length?shops[(n.id+world.day)%shops.length]:null;return{k:"market",t:sb!=null?outB(sb,n,20):fntSpot(n,S,4.4)};}
  if(h>=18&&h<22&&inn!=null&&(RT.tavern(d)?rh(n,8)<0.75:rh(n,8)<0.2)&&(n.age||20)>=18)return{k:"tavern",t:atB(inn)};
  if(h>=14&&h<17){const r=rh(n,9);
    if(r<0.3){const f=Object.entries(n.rel||{}).sort((a,b)=>b[1]-a[1])[0];const fam=(n.parents||[]).concat(n.spouse>0?[n.spouse]:[]);const pick2=[f&&+f[0]].concat(fam).filter(Boolean).map(id=>npcs.find(m=>m.id===id&&m.alive&&m.s===n.s)).filter(Boolean);
      const m=pick2[(world.day+n.id)%Math.max(1,pick2.length)];if(m&&m.home!==n.home)return{k:"visiting "+m.name,t:outB(m.home,n,16)};}
    if(r<0.5&&shops.length){const sb=shops[(n.id*3+world.day)%shops.length];return{k:"errand",t:outB(sb,n,18)};}
    if(r<0.7){const a=world.day*0.9+n.id+frameN/1400;const R=Math.max(3,(S.r||8)-2);return{k:"walk",t:{x:(S.x+Math.cos(a)*R)*TILE,y:(S.y+Math.sin(a)*R*0.7)*TILE}};}}
  return null;}
{const _nt=npcTarget;npcTarget=function(n){const t=_nt(n);try{if(!world||!n||n.adv||n.engage||n.chasingHero||n.followT>0||n.duelWatch!=null||n.huddle||n.heroKid&&kidStage(n)==="baby")return t;
  const ws=world.sets[n.s];if(!ws||ws.raid||ws.dragon||ws.festival||(n.cheer&&absMin()<n.cheer)||n.role==="leader"||n.spouse===-1)return t;
  const r=routineOf(n);n.doing=r?r.k:null;if(r&&r.t)return r.t;}catch(_){}return t;};}
// routines shift over time: new jobs, moving house (daily small chance)
const NEWJOBS=["farmer","fisher","smith","shopkeeper","farmer"];
function routineLife(){if(!world||!npcs)return;for(const n of npcs){if(!n.alive||n.adv||n.role==="leader"||n.role==="guard"||n.role==="child"||n.spouse===-1||n.heroKid||(n.age||0)<18)continue;const S=SETS[n.s];
  const r=hash2(n.id,world.day,911);
  if(r<0.004){const nj=NEWJOBS[(n.id+world.day)%NEWJOBS.length];if(nj!==n.role){n.role=nj;n.job=null;n.wp=null;n.lifeEv=(n.lifeEv||[]).concat([{d:world.day,e:"job",v:nj}]);addNews(n.s,`${n.name} of ${S.name} has taken up work as a ${nj}.`);}}
  else if(r<0.007){const hs=bOf(S,"house").filter(b=>b!==n.home&&!npcs.some(m=>m.alive&&m.home===b));if(hs.length&&!(n.spouse>0)){n.home=hs[(n.id+world.day)%hs.length];n.lifeEv=(n.lifeEv||[]).concat([{d:world.day,e:"moved"}]);addNews(n.s,`${n.name} moved into a new house in ${S.name}.`);}}}}
{const _dt=dailyTick;dailyTick=function(){const r=_dt.apply(this,arguments);try{routineLife();}catch(_){}return r;};}
const dayName=()=>WDAYS[RT.wd()]+(RT.market(RT.wd())?" (market)":RT.rest(RT.wd())?" (rest & chapel)":RT.tavern(RT.wd())?" (tavern night)":"");
