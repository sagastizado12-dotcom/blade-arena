// ===== v42 GRAND CHARGED SPELLS: rune circles + converging element motes while charging; on release a flash,
// screen shake, a burst, bigger projectiles scaled by charge and a lingering aftermath where they land. Capped for iPhone. =====
const EL42={fireball:"fire",meteor:"fire",fire:"fire",thunder:"bolt",frost:"ice",ice:"ice",quake:"earth",blackhole:"void",blade:"spirit",air:"wind",heal:"life"};
const ELC42={fire:[255,130,50],bolt:[255,235,110],ice:[150,225,255],earth:[200,150,90],void:[170,90,255],spirit:[215,200,255],wind:[190,255,220],life:[140,255,150]};
const el42=k=>EL42[k]||"spirit";
let FLASH42=null;const AFT42=[];const TRK42=[];
function burst42(x,y,c,n,sp){for(let i=0;i<n&&particles.length<320;i++){const a=Math.random()*6.283,v=(0.5+Math.random())*sp;particles.push({x,y,z:4,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:.4+Math.random()*.8,life:24+Math.random()*20|0,max:44,col:c,size:1.6+Math.random()*1.8,kind:"magic"});}}
function impact42(x,y,k,tier){const c=ELC42[el42(k)];burst42(x,y,c,10+tier*10,1.6+tier*.6);shake=Math.max(shake,2+tier*2);
  if(AFT42.length>=12)AFT42.shift();AFT42.push({x,y,k,e:el42(k),tier,t:0,life:150+tier*90,r:12+tier*9});}
{const _cc=castCharged;castCharged=function(k,tier){const n0=fx.length,s0=SP41.length,b0=typeof tbolts!=="undefined"?tbolts.length:0;const r=_cc.apply(this,arguments);tier=Math.max(0,Math.min(3,tier|0));
  if(!r||!tier)return r;const c=ELC42[el42(k)],M=[1,1.5,2.2,3][tier];
  for(let i=s0;i<SP41.length;i++){const p=SP41[i];if(p.charged)continue;p.charged=tier;if(p.dmg!=null)p.dmg=Math.round(p.dmg*M*10)/10;if(p.r!=null)p.r*=1+.3*tier;if(p.life)p.life=Math.round(p.life*(1+.15*tier));TRK42.push({o:p,a:"sp",k:p.k==="crescent"?"blade":k,tier});}
  for(let i=n0;i<fx.length;i++){const f=fx[i];if(f.k==="ring")continue;if(f.r!=null)f.r*=1+.2*tier;TRK42.push({o:f,a:"fx",k,tier});}
  if(typeof tbolts!=="undefined")for(let i=b0;i<tbolts.length;i++)TRK42.push({o:tbolts[i],a:"tb",k,tier});
  FLASH42={c,t:0,max:10+tier*6,a:.18+tier*.12};shake=Math.max(shake,3+tier*2.5);
  const hx=hero.x+6,hy=hero.y+6;burst42(hx,hy,c,14+tier*12,1.4+tier*.5);
  if(k==="heal"){impact42(hx,hy,k,tier);}
  return r;};}
const pos42=o=>o.pts&&o.pts.length?o.pts[o.pts.length-1]:[o.x,o.y];
{const _u=update;update=function(){_u.apply(this,arguments);try{
  for(let i=TRK42.length-1;i>=0;i--){const T=TRK42[i];const arr=T.a==="sp"?SP41:T.a==="fx"?fx:tbolts;const alive=arr.includes(T.o)&&!(T.o.life<=0);
    const [x,y]=pos42(T.o);if(x!=null){T.x=x;T.y=y;}
    if(!alive){if(T.x!=null)impact42(T.x,T.y,T.k,T.tier);TRK42.splice(i,1);continue;}
    if(T.x!=null&&frameN%2===0&&particles.length<300){const c=ELC42[el42(T.k)];particles.push({x:T.x+(Math.random()-.5)*8,y:T.y+(Math.random()-.5)*8,z:4,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,vz:.3,life:20,max:20,col:c,size:1.5+T.tier*.5,kind:"magic"});}}
  for(let i=AFT42.length-1;i>=0;i--){const A=AFT42[i];A.t++;if(A.t>=A.life)AFT42.splice(i,1);else if(frameN%6===0&&particles.length<280){const a=Math.random()*6.283,rr=Math.random()*A.r;particles.push({x:A.x+Math.cos(a)*rr,y:A.y+Math.sin(a)*rr,z:2,vx:0,vy:0,vz:.5,life:26,max:26,col:ELC42[A.e],size:1.4,kind:"magic"});}}
  if(FLASH42&&++FLASH42.t>=FLASH42.max)FLASH42=null;
  // converging element motes while charging
  if(CHG&&hero&&particles.length<300){const tier=chargeTier(),c=ELC42[el42(CHG.k)];for(let j=0;j<1+tier;j++){const a=Math.random()*6.283,R=34+tier*10;particles.push({x:hero.x+6+Math.cos(a)*R,y:hero.y+6+Math.sin(a)*R,z:4,vx:-Math.cos(a)*R/22,vy:-Math.sin(a)*R/22,vz:0,life:20,max:20,col:c,size:1.4+tier*.5,kind:"magic"});}}
}catch(_){}};}
function runeRing42(x,y,r,rot,n,col,al){ctx.strokeStyle=`rgba(${col},${al})`;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.stroke();ctx.beginPath();ctx.arc(x,y,r-3,0,6.283);ctx.stroke();
  for(let i=0;i<n;i++){const a=rot+i*6.283/n,cx=x+Math.cos(a)*(r-1.5),cy=y+Math.sin(a)*(r-1.5);ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.beginPath();const g=i%3;if(g===0){ctx.moveTo(-1.5,-1.5);ctx.lineTo(1.5,1.5);ctx.moveTo(1.5,-1.5);ctx.lineTo(-1.5,1.5);}else if(g===1){ctx.moveTo(0,-2);ctx.lineTo(1.6,1.4);ctx.lineTo(-1.6,1.4);ctx.closePath();}else{ctx.moveTo(-2,0);ctx.lineTo(2,0);ctx.moveTo(0,-2);ctx.lineTo(0,2);}ctx.stroke();ctx.restore();}}
{const _d=draw;draw=function(){_d.apply(this,arguments);if(!hero||room)return;try{ctx.save();ctx.setTransform(RS,0,0,RS,-camX*RS,-camY*RS);ctx.globalCompositeOperation="lighter";
  for(const A of AFT42){const f=1-A.t/A.life,col=ELC42[A.e].join(",");ctx.globalCompositeOperation="source-over";
    ctx.fillStyle=A.e==="ice"?`rgba(220,245,255,${.35*f})`:A.e==="life"?`rgba(120,255,140,${.18*f})`:`rgba(30,15,10,${.32*f})`;ctx.beginPath();ctx.ellipse(A.x,A.y+2,A.r,A.r*.6,0,0,6.283);ctx.fill();
    ctx.globalCompositeOperation="lighter";const g=ctx.createRadialGradient(A.x,A.y,1,A.x,A.y,A.r*1.2);g.addColorStop(0,`rgba(${col},${.45*f})`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(A.x,A.y,A.r*1.2,0,6.283);ctx.fill();
    if(A.t<30){ctx.strokeStyle=`rgba(${col},${1-A.t/30})`;ctx.lineWidth=2+A.tier;ctx.beginPath();ctx.arc(A.x,A.y,A.r*(.4+A.t/14),0,6.283);ctx.stroke();}
    if(A.e==="earth"||A.e==="fire"){ctx.strokeStyle=`rgba(${A.e==="fire"?"255,120,40":"120,80,40"},${.7*f})`;ctx.lineWidth=1;for(let i=0;i<5+A.tier;i++){const a=i*2.4+A.x*.1;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(A.x+Math.cos(a)*A.r*.9,A.y+Math.sin(a)*A.r*.55);ctx.stroke();}}}
  for(const T of TRK42){if(T.x==null)continue;const col=ELC42[el42(T.k)].join(","),R=6+T.tier*5+Math.sin(frameN*.5)*1.5;const g=ctx.createRadialGradient(T.x,T.y,1,T.x,T.y,R);g.addColorStop(0,`rgba(255,255,255,.7)`);g.addColorStop(.35,`rgba(${col},.55)`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(T.x,T.y,R,0,6.283);ctx.fill();}
  if(CHG){const tier=chargeTier(),t=Math.min(1,(performance.now()-CHG.t0)/CH_T[3]),col=ELC42[el42(CHG.k)].join(","),x=hero.x+6,y=hero.y+10,rot=frameN*.04;
    ctx.save();ctx.translate(x,y);ctx.scale(1,.55);runeRing42(0,0,14+tier*5,rot,6+tier*2,col,.45+t*.4);if(tier>=2)runeRing42(0,0,24+tier*4,-rot*1.4,10,col,.35+t*.3);if(tier>=3)runeRing42(0,0,36,rot*.7,14,"255,230,150",.5);ctx.restore();
    if(tier>=1){ctx.strokeStyle=`rgba(${col},${.25+t*.4})`;ctx.lineWidth=1;for(let i=0;i<tier*2;i++){const a=rot*3+i*6.283/(tier*2);ctx.beginPath();ctx.moveTo(x+Math.cos(a)*(30+tier*6),y-4+Math.sin(a)*(16+tier*3));ctx.lineTo(x,y-26-tier*4);ctx.stroke();}}}
  ctx.restore();
  if(FLASH42){const f=1-FLASH42.t/FLASH42.max;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=`rgba(${FLASH42.c.join(",")},${FLASH42.a*f})`;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore();}
}catch(_){try{ctx.restore();}catch(__){}}};}
