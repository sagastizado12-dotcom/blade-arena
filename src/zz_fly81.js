// ===== v81 FLIGHT =====
// Airborne pose uses the same chibi as walking: same palette, outfit, and
// size. A small lean follows travel, the body bobs, and the ground shadow
// shrinks with height. No second costume and no glow.
const FY={
  skin:"#f8d4b2",skinD:"#d8a888",hair:"#b04628",hairD:"#7a2c18",hairL:"#e07840",
  blue:"#3270c8",blueD:"#1c4684",blueL:"#78aaea",cape:"#c8323c",capeD:"#881824",
  pants:"#2a3148",boot:"#5c3c2a",eye:"#3c6ebe",white:"#fff6ee"
};
const flyCache=new Map();
function flyCanvas(w,h,paint){
  const c=mkCanvas(w,h),g=c.getContext("2d");g.imageSmoothingEnabled=false;paint(g);
  const im=g.getImageData(0,0,w,h),src=new Uint8ClampedArray(im.data);
  const A=(x,y)=>x<0||y<0||x>=w||y>=h?0:src[(y*w+x)*4+3];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(!src[i+3]&&(A(x-1,y)||A(x+1,y)||A(x,y-1)||A(x,y+1))){im.data[i]=20;im.data[i+1]=10;im.data[i+2]=16;im.data[i+3]=255;}}
  g.putImageData(im,0,0);return c;
}
const R=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
function paintFly(kind,frame){
  const c=flyCanvas(40,32,g=>{
    const F=FY;
    if(kind==="side"&&frame>=2){
      // idle hover: upright, one knee tucked, cape hanging
      R(g,16,2,8,6,F.skin);R(g,15,0,10,3,F.hair);R(g,14,1,3,3,F.hairL);R(g,24,1,3,3,F.hairD);
      R(g,20,5,2,2,F.eye);
      R(g,16,8,8,6,F.blue);R(g,16,8,8,1,F.blueL);
      R(g,14,9,3,4,F.blueD);R(g,14,13,2,2,F.skin);
      R(g,23,10,4,3,F.blue);R(g,26,12,2,2,F.skin);
      R(g,12,9,4,10,F.cape);R(g,12,17,4,2,F.capeD);
      R(g,16,14,3,5,F.pants);R(g,15,19,4,2,F.boot);
      R(g,20,14,4,2,F.pants);R(g,21,13,3,2,F.boot);
      return;
    }
    if(kind==="side"&&frame===1){
      // cruise: head leads up-right, cape and boots trail down-left
      R(g,1,18,10,3,F.cape);R(g,0,21,6,2,F.capeD);
      R(g,4,16,6,2,F.hairD);
      R(g,6,17,7,3,F.pants);R(g,4,20,4,2,F.boot);
      R(g,12,13,12,4,F.blue);R(g,12,13,12,1,F.blueL);R(g,12,16,12,1,F.blueD);
      R(g,20,15,6,2,F.skin);
      R(g,22,8,8,6,F.skin);R(g,20,6,9,3,F.hair);R(g,28,7,4,3,F.hairL);
      R(g,26,11,2,2,F.eye);
      R(g,28,12,6,2,F.skin);R(g,33,12,2,2,F.white);
      return;
    }
    if(kind==="side"){
      // dash: one flat streak. Head and fist lead right, cape and boots trail left.
      R(g,0,13,14,3,F.cape);R(g,0,16,8,2,F.capeD);
      R(g,8,12,6,2,F.hairD);
      R(g,8,15,8,2,F.pants);R(g,5,17,4,2,F.boot);R(g,11,16,3,2,F.boot);
      R(g,14,12,12,4,F.blue);R(g,14,12,12,1,F.blueL);R(g,14,15,12,1,F.blueD);
      R(g,15,16,6,2,F.skin);
      R(g,24,11,8,5,F.skin);R(g,22,10,8,2,F.hair);R(g,30,11,3,2,F.hairL);
      R(g,29,13,2,2,F.eye);R(g,27,15,3,1,F.skinD);
      R(g,32,13,5,2,F.skin);R(g,36,13,3,2,F.white);
      return;
    }
    if(kind==="front"&&frame>=2){
      R(g,12,1,10,7,F.skin);R(g,11,0,12,3,F.hair);R(g,10,0,3,4,F.hairL);R(g,21,0,3,4,F.hairD);
      R(g,14,4,2,2,F.eye);R(g,18,4,2,2,F.eye);R(g,15,7,4,1,F.skinD);
      R(g,11,8,12,6,F.blue);R(g,11,8,12,1,F.blueL);
      R(g,7,9,4,4,F.blueD);R(g,7,13,3,2,F.skin);
      R(g,23,10,4,3,F.blue);R(g,26,12,2,2,F.skin);
      R(g,8,10,3,8,F.cape);R(g,22,11,3,7,F.capeD);
      R(g,12,14,3,5,F.pants);R(g,11,19,4,2,F.boot);
      R(g,17,14,4,3,F.pants);R(g,18,17,3,2,F.boot);
      return;
    }
    if(kind==="front"&&frame===1){
      R(g,4,2,5,6,F.cape);R(g,25,2,5,6,F.capeD);
      R(g,13,4,4,4,F.pants);R(g,18,5,4,3,F.pants);R(g,12,8,3,2,F.boot);
      R(g,9,9,16,5,F.blue);R(g,9,9,16,1,F.blueL);
      R(g,5,11,4,3,F.skin);R(g,25,11,4,3,F.skin);
      R(g,11,13,12,7,F.skin);R(g,10,12,13,3,F.hair);
      R(g,14,16,2,2,F.eye);R(g,19,16,2,2,F.eye);
      return;
    }
    if(kind==="front"){
      // diving down the screen: legs and cape trail up, face leads
      R(g,3,0,4,8,F.cape);R(g,28,0,4,8,F.capeD);
      R(g,14,1,4,5,F.pants);R(g,19,2,4,4,F.pants);
      R(g,13,5,3,2,F.boot);R(g,20,6,3,2,F.boot);
      R(g,8,8,18,5,F.blue);R(g,8,8,18,1,F.blueL);R(g,8,12,18,1,F.blueD);
      R(g,2,9,6,2,F.skin);R(g,26,9,6,2,F.skin);
      R(g,11,13,12,8,F.skin);
      R(g,10,12,14,3,F.hair);R(g,8,13,3,3,F.hairL);R(g,23,13,3,3,F.hairD);
      R(g,14,17,2,2,F.eye);R(g,19,17,2,2,F.eye);R(g,15,20,4,1,F.skinD);
      return;
    }
    if(kind==="back"&&frame>=2){
      R(g,11,1,12,5,F.hair);R(g,9,2,3,4,F.hairD);R(g,22,2,3,4,F.hairL);
      R(g,11,6,12,5,F.blue);R(g,11,6,12,1,F.blueL);
      R(g,8,7,3,4,F.blueD);R(g,23,8,3,3,F.blue);
      R(g,8,7,18,9,F.cape);R(g,7,15,8,3,F.capeD);R(g,19,15,8,3,F.cape);
      R(g,12,14,3,5,F.pants);R(g,11,19,4,2,F.boot);
      R(g,18,14,4,3,F.pants);R(g,19,17,3,2,F.boot);
      return;
    }
    if(kind==="back"&&frame===1){
      R(g,12,2,12,4,F.hair);
      R(g,11,6,14,4,F.blue);R(g,11,6,14,1,F.blueL);
      R(g,8,10,18,6,F.cape);R(g,6,15,8,3,F.capeD);R(g,20,15,8,3,F.cape);
      R(g,10,16,4,4,F.pants);R(g,20,16,4,3,F.pants);
      R(g,9,20,4,2,F.boot);R(g,21,19,4,2,F.boot);
      return;
    }
    if(kind==="back"){
      // flying up the screen: hair leads, cape and kicked legs trail
      R(g,13,1,12,4,F.hair);R(g,11,2,3,3,F.hairD);R(g,24,2,3,3,F.hairL);
      R(g,12,5,14,4,F.blue);R(g,12,5,14,1,F.blueL);
      R(g,8,7,4,2,F.blueD);R(g,26,7,4,2,F.blue);
      R(g,9,9,20,4,F.cape);R(g,6,13,24,4,F.cape);R(g,4,17,10,3,F.capeD);R(g,22,17,10,3,F.cape);
      R(g,6,20,5,3,F.pants);R(g,25,20,5,3,F.pants);
      R(g,4,23,4,2,F.boot);R(g,27,22,4,2,F.boot);
      return;
    }
    if(kind==="takeoff"){
      R(g,12,6,10,6,F.skin);R(g,11,4,12,3,F.hair);
      R(g,14,9,2,2,F.eye);R(g,18,9,2,2,F.eye);
      R(g,11,12,12,5,F.blue);R(g,11,12,12,1,F.blueL);
      R(g,7,3,3,9,F.blue);R(g,6,2,2,2,F.skin);
      R(g,24,3,3,9,F.blue);R(g,26,2,2,2,F.skin);
      R(g,9,14,3,8,F.cape);R(g,22,14,3,8,F.capeD);
      R(g,12,17,3,4,F.pants);R(g,18,17,3,3,F.pants);
      R(g,11,21,4,2,F.boot);R(g,18,20,3,2,F.boot);
      return;
    }
    // landing: one leg reaching for the ground
    R(g,12,3,10,6,F.skin);R(g,11,1,12,3,F.hair);
    R(g,14,6,2,2,F.eye);R(g,18,6,2,2,F.eye);
    R(g,11,9,12,5,F.blue);R(g,11,9,12,1,F.blueL);
    R(g,7,11,4,2,F.blue);R(g,23,12,4,2,F.blueD);
    R(g,8,10,3,7,F.cape);R(g,22,11,3,6,F.capeD);
    R(g,12,14,3,4,F.pants);R(g,18,14,3,7,F.pants);
    R(g,11,18,4,2,F.boot);R(g,17,21,4,2,F.boot);
  });
  c.ax=kind==="side"?(frame>=2?18:frame===1?20:22):16;
  c.ay=kind==="land"?20:kind==="side"?(frame>=2?12:14):kind==="takeoff"?14:frame>=2?12:14;
  return c;
}
function flySheet(pose,facing,frame){
  const key=pose+":"+facing+":"+frame;
  let c=flyCache.get(key);if(c)return c;
  let kind="side",fr=0;
  if(pose==="hover"){kind=facing;fr=2;}
  else if(pose==="cruise"){kind=facing;fr=1;}
  else if(pose==="dash"){kind=facing;fr=0;}
  else if(pose==="takeoff"){kind="takeoff";fr=0;}
  else {kind="land";fr=0;}
  c=paintFly(kind,fr);flyCache.set(key,c);return c;
}
function flyMode(){
  const alt=P.fly||0,spd=Math.hypot(hero.vx||0,hero.vy||0);
  const prev=hero._falt==null?0:hero._falt,d=alt-prev;hero._falt=alt;
  if(d>0.3&&alt<8)return"takeoff";
  if(d<-0.3&&alt<12)return"land";
  if(spd<0.45)return"hover";
  if(spd<2.3)return"cruise";
  return"dash";
}
function flyFacing(){
  const d=hero.d8!=null?hero.d8:(hero.dir|0);
  if(d===3)return"back";
  if(d===0)return"front";
  return"side";
}
function flyTurn(){
  const d=hero.d8!=null?hero.d8:(hero.dir|0);
  // Side art faces right. Flip mirrors it. Rotation is applied before the flip,
  // so a leftward diagonal uses the opposite tilt of a rightward one.
  if(d===1)return{flip:1,rot:0};
  if(d===4)return{flip:0,rot:0.6};
  if(d===6)return{flip:0,rot:-0.6};
  if(d===5)return{flip:1,rot:0.6};
  if(d===7)return{flip:1,rot:-0.6};
  return{flip:0,rot:0};
}
function drawFlyShadow(){
  const alt=P.fly||0,a=Math.max(0.14,0.62-alt*0.01),rx=Math.max(2.4,9.2-alt*0.12);
  const spd=Math.hypot(hero.vx||0,hero.vy||0);
  let ox=0,oy=Math.min(4,alt*0.12);
  if(spd>0.3){ox=-(hero.vx||0)/spd*Math.min(18,alt*0.9);oy=-(hero.vy||0)/spd*Math.min(14,alt*0.65)+2;}
  ctx.fillStyle="rgba(10,8,16,"+a+")";ctx.beginPath();ctx.ellipse(hero.x+6+ox,hero.y+16+oy,rx,Math.max(1.15,rx*0.34),0,0,7);ctx.fill();
}
function drawSpeedLines(lift){
  const vx=hero.vx||0,vy=hero.vy||0,spd=Math.hypot(vx,vy);
  if(spd<2.2||P.fly<7||P.fly>=28)return;
  const ux=vx/spd,uy=vy/spd;
  ctx.save();ctx.strokeStyle="rgba(236,242,250,.55)";ctx.lineWidth=1;
  for(let i=0;i<4;i++){const back=14+i*5,side=(i-1.5)*3.2;
    const x=hero.x+6-ux*back+uy*side,y=hero.y+6-lift*0.35-uy*back-ux*side;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-ux*(8+i),y-uy*(5+i));ctx.stroke();}
  ctx.restore();
}
function flyAim(){
  const vx=hero.vx||0,vy=hero.vy||0;
  if(Math.hypot(vx,vy)<0.2)return{flip:0,rot:0};
  // Side art points right. Flip when traveling left so a 180° turn does not
  // put the hair under the body, then rotate onto the velocity.
  if(vx<0)return{flip:1,rot:Math.atan2(vy,-vx)};
  return{flip:0,rot:Math.atan2(vy,vx||0.0001)};
}
function drawFlyBody(){
  const dir=hero.d8!=null?hero.d8:(hero.dir|0);
  const spr=chibi(HERO_LOOK,dir,0);
  const vx=hero.vx||0,vy=hero.vy||0,spd=Math.hypot(vx,vy);
  const bob=Math.sin(frameN*0.12)*1.5;
  const lift=Math.min(16,3+P.fly*0.5)+bob;
  const tilt=spd>0.3?Math.max(-0.22,Math.min(0.22,vx/spd*0.2)):Math.sin(frameN*0.06)*0.02;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(hero.x+6),Math.round(hero.y+12-lift));
  ctx.rotate(tilt);
  ctx.drawImage(spr,-CW/2,-CHH+3);
  ctx.restore();
  if(P.king){ctx.fillStyle="#ffd84a";ctx.beginPath();const y=hero.y-lift-3;ctx.moveTo(hero.x+1,y);ctx.lineTo(hero.x+3,y-4);ctx.lineTo(hero.x+6,y-1);ctx.lineTo(hero.x+9,y-4);ctx.lineTo(hero.x+11,y);ctx.fill();}
}
function flySprite(){const pose=flyMode();const facing=pose==="takeoff"||pose==="land"?"front":flyFacing();return flySheet(pose,facing,(frameN>>3)&1);}
const _drawHeroFly=drawHeroFull;
drawHeroFull=function(){
  if(!(P&&P.fly>0)||hero.boat||hero.dead||room)return _drawHeroFly();
  if(hero.iframes>0&&Math.floor(hero.iframes/3)%2===0)return;
  if(!hero._airBody)drawFlyShadow();
  if(hero._deferBody)return;
  drawFlyBody();
};
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{
  if(!(P&&P.fly>20&&P.fly<28&&hero&&state==="play"&&!room))return r;
  ctx.save();ctx.setTransform(RS,0,0,RS,0,0);ctx.fillStyle="rgba(5,8,18,"+Math.min(0.8,(P.fly-20)/8)+")";ctx.fillRect(0,0,W,H);ctx.restore();
}catch(_){}return r;};}
window.__FLY81={sheet:flySheet,mode:flyMode};
