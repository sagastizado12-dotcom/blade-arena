// ===== v62 WEATHER THAT CHANGES HOW THE DAY PLAYS =====
// Blade Arena already keeps a 365-day calendar and four seasons. This layer
// makes the weather follow that clock instead of jumping at random: dawn and
// dusk bring fog, afternoons and autumn bring rain, a storm breaks back into
// rain, and winter turns rain into snow. Rain wets the ground (puddles that
// dry after it clears). Fog shortens what you can see. Storms flash and slow
// your steps. Snow slows you too. Cautious people and children stay by the
// door in thick fog. No new tile art — the v60 pixels stay as they are.
function nextWeather(cur,se,h){const dawn=h>=5&&h<8,dusk=h>=18&&h<21,afternoon=h>=13&&h<18;
  if(se===3){if(cur==="fog")return"snow";if(cur==="snow")return(dawn||dusk)?"fog":"clear";if(cur==="rain"||cur==="storm")return"snow";return(dawn||dusk)?"fog":"snow";}
  if(cur==="storm")return"rain";if(cur==="rain")return(afternoon&&se!==0)?"storm":"clear";if(cur==="fog"||cur==="snow")return"clear";
  if(dawn||dusk)return"fog";if(afternoon||se===2)return"rain";return"clear";}
function weatherSpd(){if(!world||!hero||hero.boat||hero.swim)return 1;const w=world.weather;let k=w==="storm"?0.82:w==="snow"?0.88:w==="rain"?0.94:1;if((world.wet||0)>0.7&&w!=="clear")k*=0.96;return k;}
{const _ht=hourlyTick;hourlyTick=function(){const until=world&&world.wUntil;const r=_ht.apply(this,arguments);try{if(world&&until!=null&&absMin()>=until){world.weather=nextWeather(world.weather,season(),hour());}}catch(e){console.warn("weather",e);}return r;};}
{const _am=advanceMinutes;advanceMinutes=function(m){const r=_am.apply(this,arguments);try{if(world){const w=world.weather;const target=(w==="rain"||w==="storm")?1:w==="fog"?0.2:0;const n=Math.max(1,m|0);let wet=world.wet||0;wet+=(target-wet)*Math.min(0.85,0.12*n);world.wet=Math.max(0,Math.min(1,wet));}}catch(_){}return r;};}
let BOLT=0;
function thunder62(){try{noiz(0.5,{f:160,fTo:50,v:0.22,a:0.01});tone(64,0.4,{to:36,v:0.16,a:0.02});}catch(_){}}
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{if(state==="play"&&world&&!room&&world.weather==="storm"&&frameN%340===20){BOLT=12;shake=Math.max(shake||0,5);thunder62();}}catch(_){}return r;};}
const _mind62=mindOf;mindOf=function(n,force){const d=_mind62.apply(this,arguments);try{if(!d||!n||!world||world.weather!=="fog"||(typeof mindSkip==="function"&&mindSkip(n)))return d;
  if(d.act==="stand"||d.why==="blackhole"||d.why==="siege"||d.why==="raid"||d.why==="rebellion"||d.why==="danger"||d.why==="family"||d.why==="storm")return d;
  const tr=mindTraits(n),kid=roleOf(n)==="child";if(!(kid||tr.caution>=50))return d;
  const next={act:"shelter",score:80,override:true,why:"fog",line:"The fog is too thick to be out. I'll stay by the door.",thought:"the fog",target:homeT(n)};n._md=next;return next;}catch(_){return d;}};
function drawWeather62(){if(!world||!hero||room||state!=="play")return;const w=world.weather,wet=world.wet||0;
  if(wet>0.18){const tx0=Math.floor(camX/TILE),ty0=Math.floor(camY/TILE),tx1=tx0+Math.ceil(W/TILE)+1,ty1=ty0+Math.ceil(H/TILE)+1;
    ctx.fillStyle=`rgba(28,42,64,${0.22*wet})`;
    for(let y=ty0;y<ty1;y++)for(let x=tx0;x<tx1;x++){if(((x*3+y)&3)!==0)continue;const t=tAt(x,y);if(t!==GRASS&&t!==ROAD&&t!==COBBLE&&t!==FARM&&t!==FLOWER&&t!==MUD)continue;ctx.fillRect(x*TILE-camX+3,y*TILE-camY+11,9,2);}}
  if(w==="rain"||w==="storm"){ctx.strokeStyle=w==="storm"?"rgba(190,210,255,.55)":"rgba(170,190,230,.4)";ctx.lineWidth=1;ctx.beginPath();const n=w==="storm"?70:40;
    for(let i=0;i<n;i++){const x=(hash2(i,frameN>>1,3)*W),y=(hash2(i,frameN>>1,5)*(H+16))-8;ctx.moveTo(x,y);ctx.lineTo(x-4,y+11);}ctx.stroke();
    ctx.fillStyle=w==="storm"?"rgba(18,24,48,.16)":"rgba(40,55,80,.08)";ctx.fillRect(0,0,W,H);}
  if(w==="snow"){ctx.fillStyle="rgba(230,236,245,.14)";ctx.fillRect(0,0,W,H);}
  if(w==="fog"){const hx=hero.x+6-camX,hy=hero.y+8-camY;const g=ctx.createRadialGradient(hx,hy,28,hx,hy,118);g.addColorStop(0,"rgba(214,220,228,0)");g.addColorStop(1,"rgba(206,212,220,.62)");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  if(BOLT>0){const a=BOLT/12;ctx.fillStyle=`rgba(255,255,245,${a*0.45})`;ctx.fillRect(0,0,W,H);ctx.strokeStyle=`rgba(255,250,220,${a})`;ctx.lineWidth=2;ctx.beginPath();const x=W*0.62;ctx.moveTo(x,0);ctx.lineTo(x-14,H*0.28);ctx.lineTo(x+8,H*0.46);ctx.lineTo(x-10,H*0.72);ctx.stroke();BOLT--;}}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(state==="play"&&world&&hero&&!room)drawWeather62();}catch(e){console.warn("wx",e);}return r;};}
try{if(window.__MIND59)window.__MIND59.mindOf=mindOf;}catch(_){}
window.__WEATHER62={nextWeather,weatherSpd,wet:()=>world&&world.wet||0};
