// ===== v80 REGIONAL WEATHER =====
// A handful of fronts drift east on the prevailing wind. Climate decides what
// each front is: snow in the north and in winter, fog at dawn on the coast,
// storms and rain inland, dry heat only on the desert patches. The hero's
// local kind is written to world.weather so the old rain, snow, fog, and
// storm behavior still applies. Particles stay inside the existing caps.
const WX_N=14;
const wxFronts=[];
for(let i=0;i<WX_N;i++)wxFronts.push({i,x:0,y:0,rx:280,ry:170,k:"clear",s:0.6});
function wxCoast(x,y){x|=0;y|=0;if(x<10||y<10||x>=WW-10||y>=WH-10)return false;const i=y*WW+x;
  const w=t=>t===DEEP||t===SHAL;const t=T[i];if(w(t))return true;
  return w(T[i+10])||w(T[i-10])||w(T[i+WW*10])||w(T[i-WW*10]);}
function wxKind(i,x,y){const se=season(),h=hour(),north=y<1000,cold=se===3||(north&&se!==1);
  const dawn=(h>=5&&h<8)||(h>=18&&h<21),coast=wxCoast(x,y);
  if(typeof desertPocket==="function"&&desertPocket(x,y)&&se!==3)return"heat";
  if(cold){if(dawn&&i%3===0)return"fog";return i%5===0?"clear":"snow";}
  if(coast&&dawn&&i%2===0)return"fog";
  if(i%7===0)return"storm";
  if(i%3!==2||se===2)return"rain";
  return"clear";}
function syncFronts(){if(!world)return;const t=(world.day|0)*1440+(world.min|0);
  for(let i=0;i<WX_N;i++){const f=wxFronts[i],speed=1.1+(i%4)*0.28;
    f.x=((i*640+t*speed)%(WW+700))-240;
    f.y=220+((i*947)%(WH-480))+Math.sin(t*0.0035+i)*150;
    f.rx=240+(i%5)*90;f.ry=150+(i%4)*46;
    f.k=wxKind(i,f.x,f.y);
    f.s=0.42+0.58*(0.5+0.5*Math.sin(t*0.008+i*1.7));}}
function weatherAt(tx,ty){let best="clear",score=0,edge=0;
  for(let i=0;i<WX_N;i++){const f=wxFronts[i];const dx=(tx-f.x)/f.rx,dy=(ty-f.y)/f.ry,d=dx*dx+dy*dy;if(d>=1)continue;
    const e=1-Math.sqrt(d);let k=f.k;
    if(typeof desertPocket==="function"&&desertPocket(tx,ty)&&(k==="rain"||k==="fog"||(k==="storm"&&e*f.s<0.55)))k="heat";
    else if(k==="rain"&&(season()===3||ty<780))k="snow";
    const rank=k==="storm"?4:k==="rain"||k==="snow"?3:k==="fog"||k==="heat"?2:1;
    const sc=e*rank*f.s;if(sc>score){score=sc;best=k;edge=e*f.s;}}
  const h=hour();const dawn=(h>=5&&h<8)||(h>=18&&h<21);
  if(best==="clear"&&dawn&&wxCoast(tx,ty)){best="fog";edge=Math.max(edge,0.35);}
  if(best==="clear"&&typeof desertPocket==="function"&&desertPocket(tx,ty)&&season()!==3){best="heat";edge=Math.max(edge,0.4);}
  return{k:best,s:edge};}
function applyLocalWx(){if(!world||!hero)return;const w=weatherAt(hero.x/TILE,hero.y/TILE);
  world.weather=w.k;world.wxS=w.s;
  const target=(w.k==="rain"||w.k==="storm")?Math.max(0.35,w.s):w.k==="fog"?0.18:0;
  let wet=world.wet||0;wet+=(target-wet)*0.04;world.wet=wet<0?0:wet>1?1:wet;}
let wxReady=false;
{const _u=update;update=function(){const r=_u.apply(this,arguments);try{if(world&&state==="play"&&(!wxReady||frameN%15===0)){wxReady=true;syncFronts();applyLocalWx();}}catch(e){console.warn("wx",e);}return r;};}
{const _ht=hourlyTick;hourlyTick=function(){const r=_ht.apply(this,arguments);try{syncFronts();applyLocalWx();}catch(_){}return r;};}
const _wxDraw=drawWx65;
drawWx65=function(){if(!world)return;const s=Math.max(0.3,Math.min(1,world.wxS||0.7));
  const a=WX65.rainStreaks,b=WX65.stormStreaks,c=WX65.snowFlakes;
  WX65.rainStreaks=Math.max(3,Math.round(a*s));WX65.stormStreaks=Math.max(4,Math.round(b*s));WX65.snowFlakes=Math.max(3,Math.round(c*s));
  _wxDraw();WX65.rainStreaks=a;WX65.stormStreaks=b;WX65.snowFlakes=c;
  if(world.weather==="hot"){ctx.fillStyle="rgba(255,214,120,.5)";for(let i=0;i<4;i++){const x=(hash2(i,frameN>>3,3)*W)|0,y=(hash2(i,frameN>>3,4)*H)|0;ctx.fillRect(x,y,2,1);}}};
function drawFlightClouds(){if(!P||P.fly<6||P.fly>=28||!hero)return;const lift=Math.min(1,(P.fly-6)/18);
  ctx.save();for(let i=0;i<WX_N;i++){const f=wxFronts[i];if(f.k==="clear"||f.k==="heat"||f.k==="fog")continue;
    const dx=f.x*TILE-hero.x,dy=f.y*TILE-hero.y;if(Math.abs(dx)>2200||Math.abs(dy)>1400)continue;
    const x=W/2+dx*(0.08+lift*0.05),y=H*0.28+dy*(0.06+lift*0.04);
    ctx.globalAlpha=(0.22+lift*0.4)*f.s;ctx.drawImage(cloudSpr,x-90,y-36,200+f.rx*0.15,96);}ctx.restore();}
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{if(state==="play"&&!room)drawFlightClouds();}catch(_){}return r;};}
function drawSpaceClouds(){if(!P||!hero)return;const climb=clamp((P.fly-28)/40,0,1);
  const R=Math.min(W,H)*(0.46-climb*0.08),cx=W*0.5,cy=H*(0.56+climb*0.03),rot=hero.x/(WW*TILE);
  ctx.save();for(let i=0;i<WX_N;i++){const f=wxFronts[i];if(f.k==="clear"||f.k==="heat")continue;
    const lat=(f.y/WH-0.5)*1.35;let ang=(f.x/WW-rot)*Math.PI*2;ang=((ang+Math.PI)%(Math.PI*2))-Math.PI;
    const face=Math.cos(ang);if(face<0.08)continue;
    const px=cx+Math.sin(ang)*R*0.9*Math.max(0.35,Math.cos(lat)),py=cy+lat*R*0.86;
    const rad=Math.max(10,(f.rx/WW)*R*2.2)*face;
    ctx.globalAlpha=(f.k==="fog"?0.35:0.62)*f.s*face;
    ctx.fillStyle=f.k==="snow"?"#e7f3ff":f.k==="storm"?"#5c668c":f.k==="fog"?"#d5d8df":"#c5d0e2";
    ctx.beginPath();ctx.ellipse(px,py,rad,rad*0.58,ang*0.2,0,7);ctx.fill();}ctx.restore();}
{const _sp=drawSpace;drawSpace=function(){const r=_sp.apply(this,arguments);try{syncFronts();drawSpaceClouds();}catch(e){console.warn("sky",e);}return r;};}
{const _map=drawFullMap;drawFullMap=function(){const r=_map.apply(this,arguments);try{if(!world)return r;syncFronts();const g=document.getElementById("mapc").getContext("2d");
  const dpr=Math.min(2,window.devicePixelRatio||1);g.setTransform(dpr,0,0,dpr,0,0);
  const s=mapScaleCss();for(let i=0;i<WX_N;i++){const f=wxFronts[i];if(f.k==="clear")continue;const p=mapToScreen(f.x,f.y);
    g.globalAlpha=f.k==="heat"?0.22:0.34;g.fillStyle=f.k==="snow"?"#eef6ff":f.k==="storm"?"#3c4c98":f.k==="fog"?"#d8dce4":f.k==="heat"?"#e4c56a":"#6aa4dc";
    g.beginPath();g.ellipse(p.x,p.y,Math.max(8,f.rx*s),Math.max(6,f.ry*s),0,0,7);g.fill();}g.globalAlpha=1;}catch(_){}return r;};}
window.__WX={at:weatherAt,fronts:()=>wxFronts,sync:syncFronts,apply:applyLocalWx};
