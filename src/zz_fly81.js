// ===== v81 FLIGHT POSES =====
// The walker stays on the ground. In the air the hero uses a separate set of
// original sprites: upright hover, a lean, and a fast horizontal streak, for
// the four facings and the diagonals. The shadow stays on the ground and
// shrinks as he climbs. No glow on the body.
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
    const F=FY,fl=frame?1:0;
    if(kind==="side"&&frame>=2){
      // hover, upright, slight lean
      R(g,22,2,8,7,F.skin);R(g,21,0,9,3,F.hair);R(g,20,1,3,3,F.hairL);R(g,28,1,3,3,F.hairD);
      R(g,26,5,2,2,F.eye);R(g,25,7,3,1,F.skinD);
      R(g,18,9,10,7,F.blue);R(g,18,9,10,1,F.blueL);R(g,26,10,2,6,F.blueD);
      R(g,12,10,6,2,F.blue);R(g,11,11,2,2,F.skin);
      R(g,28,11,6,2,F.blue);R(g,33,12,2,2,F.skin);
      R(g,16,12,4,9,F.cape);R(g,16,19,4,2,F.capeD);
      R(g,18,16,3,5,F.pants);R(g,23,16,3,5,F.pants);
      R(g,17,21,4,2,F.boot);R(g,23,21,4,2,F.boot);
      return;
    }
    if(kind==="side"&&frame===1){
      // cruise: head leads up-right, legs and cape trail down-left
      R(g,26,4,9,7,F.skin);R(g,25,2,10,3,F.hair);R(g,33,3,4,3,F.hairL);R(g,22,5,5,2,F.hairD);
      R(g,31,7,2,2,F.eye);R(g,30,9,3,1,F.skinD);
      R(g,16,9,14,5,F.blue);R(g,16,9,14,1,F.blueL);R(g,16,13,14,1,F.blueD);
      R(g,28,11,8,2,F.skin);R(g,35,11,2,2,F.white);
      R(g,10,13,7,2,F.blueD);
      R(g,6,8,10,3,F.cape);R(g,2,11,7,2,F.capeD);
      R(g,8,15,10,3,F.pants);R(g,5,18,4,2,F.boot);
      return;
    }
    if(kind==="side"){
      // dash: flat streak. Head leads on the right, cape and boots trail left.
      R(g,0,11-fl,11,4,F.cape);R(g,0,15,8,2,F.capeD);
      R(g,6,14,8,2,F.hairD);
      R(g,8,12,16,5,F.blue);R(g,8,12,16,1,F.blueL);R(g,8,16,16,1,F.blueD);
      R(g,22,11,10,7,F.skin);R(g,22,9,10,3,F.hair);R(g,30,10,4,3,F.hairL);
      R(g,28,14,2,2,F.eye);R(g,27,16,3,1,F.skinD);
      R(g,31,13,7,2,F.skin);R(g,37,13,2,2,F.white);
      R(g,2,16,10,3,F.pants);R(g,0,18,5,2,F.boot);
      return;
    }
    if(kind==="front"&&frame>=2){
      R(g,9,1,10,8,F.skin);R(g,8,0,12,3,F.hair);R(g,7,0,3,4,F.hairL);R(g,12,0,2,3,F.hair);R(g,17,0,3,4,F.hairD);
      R(g,11,5,2,2,F.eye);R(g,15,5,2,2,F.eye);R(g,12,8,4,1,F.skinD);
      R(g,8,10,12,7,F.blue);R(g,8,10,12,1,F.blueL);
      R(g,3,11,5,2,F.blue);R(g,2,12,2,2,F.skin);R(g,20,11,5,2,F.blue);R(g,24,12,2,2,F.skin);
      R(g,7,13,3,8,F.cape);R(g,18,13,3,8,F.capeD);
      R(g,9,17,3,5,F.pants);R(g,15,17,3,5,F.pants);
      R(g,8,22,4,2,F.boot);R(g,15,22,4,2,F.boot);
      return;
    }
    if(kind==="front"){
      // diving toward the camera: wide shoulders, fists low, cape and legs up behind
      R(g,2,4,6,8,F.cape);R(g,20,4,6,8,F.capeD);R(g,8,2,12,4,F.hairD);
      R(g,6,10,16,5,F.blue);R(g,6,10,16,1,F.blueL);R(g,6,14,16,1,F.blueD);
      R(g,8,14,12,7,F.skin);R(g,7,16,14,3,F.hair);R(g,6,17,3,3,F.hairL);R(g,19,17,3,3,F.hairD);
      R(g,10,19,2,2,F.eye);R(g,16,19,2,2,F.eye);
      R(g,1,16,5,3,F.skin);R(g,22,16,5,3,F.skin);
      R(g,10,6,3,4,F.pants);R(g,15,6,3,4,F.pants);
      return;
    }
    if(kind==="back"&&frame>=2){
      R(g,8,1,12,8,F.hair);R(g,7,2,3,6,F.hairD);R(g,18,2,3,6,F.hairL);R(g,10,0,3,3,F.hair);R(g,15,0,3,3,F.hairL);
      R(g,8,9,12,7,F.blue);R(g,8,9,12,1,F.blueL);
      R(g,6,10,14,10,F.cape);R(g,6,10,14,2,F.cape);R(g,8,18,10,3,F.capeD);
      R(g,3,11,5,2,F.blueD);R(g,20,11,5,2,F.blueD);
      R(g,9,16,3,5,F.pants);R(g,15,16,3,5,F.pants);
      R(g,8,21,4,2,F.boot);R(g,15,21,4,2,F.boot);
      return;
    }
    if(kind==="back"){
      R(g,6,8,16,6,F.hair);R(g,4-fl,8,6,3,F.hairD);
      R(g,8,12,14,4,F.blue);R(g,8,12,14,1,F.blueL);
      R(g,2-fl,10,12,5,F.cape);R(g,0,14,8,3,F.capeD);
      R(g,6,16,12,3,F.pants);R(g,4,18,4,2,F.boot);
      return;
    }
    if(kind==="takeoff"){
      R(g,9,6,10,7,F.skin);R(g,8,4,12,3,F.hair);R(g,7,5,3,3,F.hairL);R(g,18,5,3,3,F.hairD);
      R(g,11,9,2,2,F.eye);R(g,15,9,2,2,F.eye);
      R(g,8,13,12,6,F.blue);R(g,8,13,12,1,F.blueL);
      R(g,6,4,3,8,F.blue);R(g,5,3,2,2,F.skin);R(g,19,4,3,8,F.blue);R(g,21,3,2,2,F.skin);
      R(g,7,16,4,8,F.cape);R(g,17,16,4,8,F.capeD);
      R(g,9,19,3,5,F.pants);R(g,15,19,3,5,F.pants);
      R(g,8,24,4,2,F.boot);R(g,15,24,4,2,F.boot);
      return;
    }
    // landing: one leg reaching for the ground
    R(g,9,4,10,7,F.skin);R(g,8,2,12,3,F.hair);R(g,11,7,2,2,F.eye);R(g,15,7,2,2,F.eye);
    R(g,8,11,12,6,F.blue);R(g,8,11,12,1,F.blueL);
    R(g,5,13,4,2,F.blue);R(g,19,14,4,2,F.blueD);
    R(g,6,12,4,7,F.cape);R(g,18,13,4,6,F.capeD);
    R(g,10,17,3,4,F.pants);R(g,14,18,3,7,F.pants);
    R(g,9,21,4,2,F.boot);    R(g,13,25,4,2,F.boot);
  });
  c.ax=kind==="side"?22:16;
  c.ay=(kind==="side"&&frame<2)?14:kind==="land"?20:16;
  return c;
}
function flySheet(pose,facing,frame){
  const key=pose+":"+facing+":"+frame;
  let c=flyCache.get(key);if(c)return c;
  let kind="side",fr=frame&1;
  if(pose==="hover"){kind=facing;fr=2;}
  else if(pose==="cruise"){kind=facing;fr=facing==="side"?1:0;}
  else if(pose==="dash"){kind=facing;fr=frame&1;}
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
  if(d===1||d===5||d===7)return"side";
  if(d===3||d===6)return"back";
  if(d===0||d===4)return"front";
  return"side";
}
function flyTurn(){
  const d=hero.d8!=null?hero.d8:(hero.dir|0);
  if(d===1)return{flip:1,rot:0};
  if(d===4)return{flip:0,rot:0.5};
  if(d===6)return{flip:0,rot:-0.48};
  if(d===5)return{flip:1,rot:-0.48};
  if(d===7)return{flip:1,rot:0.48};
  return{flip:0,rot:0};
}
function drawFlyShadow(){
  const alt=P.fly||0,a=Math.max(0.07,0.5-alt*0.011),rx=Math.max(2.1,7.4-alt*0.13);
  const spd=Math.hypot(hero.vx||0,hero.vy||0);
  let ox=0,oy=Math.min(5,alt*0.18);
  if(spd>0.3){ox=-(hero.vx||0)/spd*Math.min(16,alt*0.85);oy=-(hero.vy||0)/spd*Math.min(12,alt*0.6)+2;}
  ctx.fillStyle="rgba(10,8,16,"+a+")";ctx.beginPath();ctx.ellipse(hero.x+6+ox,hero.y+15+oy,rx,Math.max(1.15,rx*0.34),0,0,7);ctx.fill();
}
function drawSpeedLines(lift){
  const vx=hero.vx||0,vy=hero.vy||0,spd=Math.hypot(vx,vy);
  if(spd<2.2||P.fly<7||P.fly>=28)return;
  const ux=vx/spd,uy=vy/spd;
  ctx.save();ctx.strokeStyle="rgba(236,242,250,.72)";ctx.lineWidth=1;
  for(let i=0;i<4;i++){const back=12+i*5,side=(i-1.5)*3.2;
    const x=hero.x+6-ux*back+uy*side,y=hero.y+6-lift*0.35-uy*back-ux*side;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-ux*(7+i),y-uy*(4+i));ctx.stroke();}
  ctx.restore();
}
function drawFlyBody(){
  const pose=flyMode(),facing=pose==="takeoff"||pose==="land"?"front":flyFacing();
  const spr=flySheet(pose,facing,(frameN>>3)&1);
  const turn=flyTurn();
  const bob=pose==="hover"?Math.sin(frameN*0.14)*1.7:0;
  const lift=Math.min(16,3+P.fly*0.62)+bob;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(hero.x+6),Math.round(hero.y+10-lift));
  if(turn.flip)ctx.scale(-1,1);
  if(turn.rot)ctx.rotate(turn.rot);
  ctx.scale(1.25,1.25);
  ctx.drawImage(spr,-(spr.ax||spr.width/2),-(spr.ay||spr.height/2));
  ctx.restore();
  drawSpeedLines(lift);
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
