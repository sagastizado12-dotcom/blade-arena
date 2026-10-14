(function(){
"use strict";
const TILE=16, RS=2;
let H=240, W=400;
const canvas=document.getElementById("game");
let ctx=canvas.getContext("2d");
function fit(){
  const vw=window.innerWidth, vh=window.innerHeight;
  W=Math.max(320,Math.min(520,Math.round(H*vw/vh)));
  if(canvas.width!==W*RS){canvas.width=W*RS;canvas.height=H*RS;}
  let s=Math.min(vw/W, vh/H); if(s<1)s=1;
  canvas.style.width=(W*s)+"px"; canvas.style.height=(H*s)+"px";
  ctx.imageSmoothingEnabled=false;
}
fit();
window.addEventListener("resize",fit);
window.addEventListener("orientationchange",()=>setTimeout(fit,150));

let bloodOn=localStorage.getItem("bladeArenaBlood")!=="0";
const bloodBtn=document.getElementById("bloodToggle");
function updateBloodBtn(){bloodBtn.textContent=bloodOn?"BLOOD: ON":"BLOOD: OFF";bloodBtn.className="hbtn"+(bloodOn?" on":"");}
updateBloodBtn();
bloodBtn.addEventListener("click",e=>{e.stopPropagation();bloodOn=!bloodOn;localStorage.setItem("bladeArenaBlood",bloodOn?"1":"0");updateBloodBtn();});

const keys={},latch={};
window.addEventListener("keydown",e=>{
  keys[e.code]=true;if(!e.repeat)latch[e.code]=true;
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();
  if(e.code==="KeyM"&&state==="play")toggleMap();
  if(e.code==="KeyE"&&state==="play")eatFood();
  if(e.code==="Escape")closeMenu();
});
window.addEventListener("keyup",e=>{keys[e.code]=false});
const touch={active:false,sx:0,sy:0,dx:0,dy:0,id:null,a:false,b:false,aId:null,bId:null};
const isTouch=("ontouchstart" in window)||navigator.maxTouchPoints>0;
if(isTouch)document.getElementById("touch").classList.add("show");
const stickKnob=document.getElementById("stickKnob"),stickBase=document.getElementById("stickBase"),stickZone=document.getElementById("stickZone");
const btnA=document.getElementById("btnA"),btnB=document.getElementById("btnB");
const RMAX=36;
function setKnob(dx,dy){const len=Math.hypot(dx,dy)||1;const c=Math.min(len,RMAX)/len;stickKnob.style.transform=`translate(${dx*c}px,${dy*c}px)`;}
stickZone.addEventListener("touchstart",e=>{e.preventDefault();const t=e.changedTouches[0];touch.active=true;touch.id=t.identifier;const r=stickBase.getBoundingClientRect();touch.sx=r.left+r.width/2;touch.sy=r.top+r.height/2;touch.dx=t.clientX-touch.sx;touch.dy=t.clientY-touch.sy;setKnob(touch.dx,touch.dy);},{passive:false});
stickZone.addEventListener("touchmove",e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===touch.id){touch.dx=t.clientX-touch.sx;touch.dy=t.clientY-touch.sy;setKnob(touch.dx,touch.dy);}},{passive:false});
function endStick(e){for(const t of e.changedTouches)if(t.identifier===touch.id){touch.active=false;touch.id=null;touch.dx=0;touch.dy=0;setKnob(0,0);}}
stickZone.addEventListener("touchend",endStick);stickZone.addEventListener("touchcancel",endStick);
btnA.addEventListener("touchstart",e=>{e.preventDefault();touch.a=true;btnA.classList.add("active");touch.aId=e.changedTouches[0].identifier},{passive:false});
btnB.addEventListener("touchstart",e=>{e.preventDefault();touch.b=true;btnB.classList.add("active");touch.bId=e.changedTouches[0].identifier},{passive:false});
function endBtn(e){for(const t of e.changedTouches){if(t.identifier===touch.aId){touch.a=false;btnA.classList.remove("active");touch.aId=null}if(t.identifier===touch.bId){touch.b=false;btnB.classList.remove("active");touch.bId=null}}}
window.addEventListener("touchend",endBtn);window.addEventListener("touchcancel",endBtn);
document.body.addEventListener("gesturestart",e=>e.preventDefault());

// painterly post-process for pixel sprites: soft top light + dark outline
function paintPass(img){
  const {w,h,data}=img, src=new Uint8ClampedArray(data);
  const A=(x,y)=>x<0||y<0||x>=w||y>=h?0:src[(y*w+x)*4+3];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    if(src[i+3]){
      const f=1.18-0.36*(y/h)+(A(x,y-1)?0:0.12)-(A(x+1,y)?0:0.08);
      data[i]=Math.min(255,src[i]*f*1.05);data[i+1]=Math.min(255,src[i+1]*f);data[i+2]=Math.min(255,src[i+2]*f*1.08);
    } else if(A(x-1,y)||A(x+1,y)||A(x,y-1)||A(x,y+1)){
      data[i]=34;data[i+1]=18;data[i+2]=30;data[i+3]=200;
    }
  }
}
function mkCanvas(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c;}
let rs=1;
function rnd(){rs|=0;rs=rs+0x6D2B79F5|0;let t=Math.imul(rs^rs>>>15,1|rs);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
function hash2(x,y,s){let h=(x*374761393+y*668265263+s*1442695041)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296;}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,s){return vnoise(x/32,y/32,s)*0.5+vnoise(x/16,y/16,s+1)*0.3+vnoise(x/6,y/6,s+2)*0.2;}
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
let state="title", particles=[], parts=[], projectiles=[], splats=[], shake=0, kills=0, score=0, hero;
// ---- Pixel helpers ----
function px(img,x,y,c){if(x<0||y<0||x>=img.w||y>=img.h)return; img.data[(y*img.w+x)*4]=c[0]; img.data[(y*img.w+x)*4+1]=c[1]; img.data[(y*img.w+x)*4+2]=c[2]; img.data[(y*img.w+x)*4+3]=c[3]??255}
function fillRect(img,x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)px(img,x+i,y+j,c)}
function makeImg(w,h,draw){
  const data=new Uint8ClampedArray(w*h*4);
  const img={w,h,data};
  draw(img); paintPass(img);
  const c=document.createElement("canvas");
  c.width=w;c.height=h;
  c.getContext("2d").putImageData(new ImageData(data,w,h),0,0);
  return c;
}

// Palette
const C={
  skin:[220,170,120], skinD:[180,130,90],
  tunic:[40,100,180], tunicD:[25,70,140],
  hair:[60,40,20],
  steel:[200,210,220], steelD:[120,130,150],
  wood:[140,90,40],
  grass:[50,110,50], grass2:[40,95,40], grass3:[60,125,55],
  dirt:[90,70,45], stone:[110,110,120], stoneD:[70,70,80], stoneL:[140,140,150],
  wall:[80,75,70], wallD:[50,48,45], wallT:[100,95,85],
  blood:[180,30,40], bloodD:[120,15,25],
  spark:[255,220,100], dust:[180,160,120],
  eye:[255,240,200], pupil:[20,20,30],
  green:[60,140,50], greenD:[40,100,35],
  purple:[120,60,160], purpleD:[80,40,110],
  orange:[200,100,40], orangeD:[150,70,25],
  red:[180,50,40], redD:[120,30,25],
  horn:[200,180,140], hornD:[160,140,100],
  boss:[90,50,120], bossD:[60,30,90],
  white:[240,240,245], black:[20,20,25],
  gold:[220,180,60]
};

// ---- Sprite factory ----
function heroFrame(dir,frame,swing){
  // dir: 0down 1left 2right 3up
  return makeImg(16,16,img=>{
    // legs
    const legOff=frame%2===0?0:1;
    fillRect(img,5,12,3,3,C.tunicD);
    fillRect(img,8,12,3,3,C.tunicD);
    if(dir!==3){
      fillRect(img,5+legOff,14,2,2,C.skinD);
      fillRect(img,9-legOff,14,2,2,C.skinD);
    }
    // body
    fillRect(img,5,6,6,7,C.tunic);
    fillRect(img,5,6,6,2,C.tunicD);
    // head
    fillRect(img,5,2,6,5,C.skin);
    fillRect(img,5,1,6,2,C.hair);
    fillRect(img,4,2,1,3,C.hair);
    fillRect(img,11,2,1,3,C.hair);
    // eyes
    if(dir===0){px(img,6,4,C.pupil);px(img,9,4,C.pupil)}
    else if(dir===1){px(img,5,4,C.pupil)}
    else if(dir===2){px(img,10,4,C.pupil)}
    // sword
    if(swing>=0){
      // swing arc positions relative to facing
      const arcs=[
        [[10,8],[12,6],[13,4],[12,2],[10,1]], // down-ish sweep
        [[4,8],[2,6],[1,4],[2,2],[4,1]],
        [[11,8],[13,7],[14,5],[13,3],[11,2]],
        [[5,5],[3,4],[2,2],[4,1],[7,0]]
      ];
      const a=arcs[dir]||arcs[0];
      const idx=Math.min(swing,a.length-1);
      const [sx,sy]=a[idx];
      fillRect(img,sx,sy,2,2,C.steel);
      fillRect(img,sx,sy+1,1,1,C.steelD);
    } else {
      // sheathed / held
      if(dir===2){fillRect(img,12,7,3,2,C.steel);px(img,11,7,C.wood)}
      else if(dir===1){fillRect(img,1,7,3,2,C.steel);px(img,4,7,C.wood)}
      else {fillRect(img,11,8,2,5,C.steel);px(img,11,7,C.wood)}
    }
  });
}

function makeEnemySprites(){
  const sprites={};
  // Grunt - melee with weapon arm
  sprites.grunt=makeImg(16,16,img=>{
    fillRect(img,5,11,3,4,C.greenD);
    fillRect(img,8,11,3,4,C.greenD);
    fillRect(img,4,5,8,7,C.green);
    fillRect(img,5,2,6,5,C.green);
    fillRect(img,5,1,6,2,C.greenD);
    px(img,6,3,C.eye);px(img,9,3,C.eye);px(img,6,3,C.pupil);px(img,9,3,C.pupil);
    // weapon arm
    fillRect(img,12,6,3,3,C.green);
    fillRect(img,14,4,2,5,C.steel);
    px(img,14,3,C.wood);
  });
  sprites.gruntNoArm=makeImg(16,16,img=>{
    fillRect(img,5,11,3,4,C.greenD);
    fillRect(img,8,11,3,4,C.greenD);
    fillRect(img,4,5,8,7,C.green);
    fillRect(img,5,2,6,5,C.green);
    fillRect(img,5,1,6,2,C.greenD);
    px(img,6,3,C.eye);px(img,9,3,C.eye);
    fillRect(img,11,7,2,2,C.blood); // stump
  });
  sprites.gruntCrawl=makeImg(16,12,img=>{
    fillRect(img,3,4,10,6,C.green);
    fillRect(img,4,1,8,5,C.green);
    px(img,6,3,C.eye);px(img,9,3,C.eye);
    fillRect(img,12,3,3,2,C.steel);
  });
  // Crawler - fast with tail
  sprites.crawler=makeImg(16,16,img=>{
    fillRect(img,4,6,8,6,C.purple);
    fillRect(img,5,3,6,5,C.purple);
    fillRect(img,6,2,4,2,C.purpleD);
    px(img,6,4,C.eye);px(img,9,4,C.eye);
    // legs
    fillRect(img,3,11,2,3,C.purpleD);
    fillRect(img,7,12,2,3,C.purpleD);
    fillRect(img,11,11,2,3,C.purpleD);
    // tail
    fillRect(img,1,8,4,3,C.purple);
    fillRect(img,0,7,2,2,C.purpleD);
    px(img,0,6,C.orange);
  });
  sprites.crawlerNoTail=makeImg(16,16,img=>{
    fillRect(img,4,6,8,6,C.purple);
    fillRect(img,5,3,6,5,C.purple);
    fillRect(img,6,2,4,2,C.purpleD);
    px(img,6,4,C.eye);px(img,9,4,C.eye);
    fillRect(img,3,11,2,3,C.purpleD);
    fillRect(img,7,12,2,3,C.purpleD);
    fillRect(img,11,11,2,3,C.purpleD);
    fillRect(img,3,8,2,2,C.blood);
  });
  // Spitter - ranged
  sprites.spitter=makeImg(16,16,img=>{
    fillRect(img,5,10,3,4,C.orangeD);
    fillRect(img,8,10,3,4,C.orangeD);
    fillRect(img,4,5,8,7,C.orange);
    fillRect(img,5,2,6,5,C.orange);
    fillRect(img,6,0,4,3,C.orangeD);
    px(img,6,4,C.eye);px(img,9,4,C.eye);
    // mouth
    fillRect(img,6,7,4,2,C.black);
    fillRect(img,7,8,2,1,[100,200,80]);
  });
  // Charger - horned
  sprites.charger=makeImg(16,16,img=>{
    fillRect(img,4,10,4,5,C.redD);
    fillRect(img,8,10,4,5,C.redD);
    fillRect(img,3,5,10,7,C.red);
    fillRect(img,4,2,8,5,C.red);
    // horns
    fillRect(img,3,0,2,4,C.horn);
    fillRect(img,11,0,2,4,C.horn);
    px(img,3,0,C.hornD);px(img,12,0,C.hornD);
    px(img,6,4,C.eye);px(img,9,4,C.eye);
    fillRect(img,6,7,4,2,C.black);
  });
  sprites.chargerNoHorn=makeImg(16,16,img=>{
    fillRect(img,4,10,4,5,C.redD);
    fillRect(img,8,10,4,5,C.redD);
    fillRect(img,3,5,10,7,C.red);
    fillRect(img,4,2,8,5,C.red);
    fillRect(img,4,1,2,2,C.blood);
    fillRect(img,10,1,2,2,C.blood);
    px(img,6,4,C.eye);px(img,9,4,C.eye);
  });
  // Boss
  sprites.boss=makeImg(24,24,img=>{
    fillRect(img,6,16,5,7,C.bossD);
    fillRect(img,13,16,5,7,C.bossD);
    fillRect(img,4,8,16,12,C.boss);
    fillRect(img,6,3,12,8,C.boss);
    // horns
    fillRect(img,4,0,3,6,C.horn);
    fillRect(img,17,0,3,6,C.horn);
    fillRect(img,3,0,2,3,C.hornD);
    fillRect(img,19,0,2,3,C.hornD);
    // arms
    fillRect(img,0,10,5,5,C.boss);
    fillRect(img,19,10,5,5,C.boss);
    fillRect(img,0,14,4,4,C.bossD);
    fillRect(img,20,14,4,4,C.bossD);
    // eyes
    fillRect(img,8,6,3,3,C.eye);
    fillRect(img,13,6,3,3,C.eye);
    px(img,9,7,C.pupil);px(img,14,7,C.pupil);
    // mouth
    fillRect(img,9,11,6,2,C.black);
  });
  sprites.bossNoArms=makeImg(24,24,img=>{
    fillRect(img,6,16,5,7,C.bossD);
    fillRect(img,13,16,5,7,C.bossD);
    fillRect(img,4,8,16,12,C.boss);
    fillRect(img,6,3,12,8,C.boss);
    fillRect(img,4,0,3,6,C.horn);
    fillRect(img,17,0,3,6,C.horn);
    fillRect(img,3,10,3,3,C.blood);
    fillRect(img,18,10,3,3,C.blood);
    fillRect(img,8,6,3,3,C.eye);
    fillRect(img,13,6,3,3,C.eye);
    px(img,9,7,C.pupil);px(img,14,7,C.pupil);
  });
  sprites.bossNoHorns=makeImg(24,24,img=>{
    fillRect(img,6,16,5,7,C.bossD);
    fillRect(img,13,16,5,7,C.bossD);
    fillRect(img,4,8,16,12,C.boss);
    fillRect(img,6,3,12,8,C.boss);
    fillRect(img,5,1,3,3,C.blood);
    fillRect(img,16,1,3,3,C.blood);
    fillRect(img,0,10,5,5,C.boss);
    fillRect(img,19,10,5,5,C.boss);
    fillRect(img,8,6,3,3,C.eye);
    fillRect(img,13,6,3,3,C.eye);
    px(img,9,7,C.pupil);px(img,14,7,C.pupil);
  });
  sprites.bossBare=makeImg(24,24,img=>{
    fillRect(img,6,16,5,7,C.bossD);
    fillRect(img,13,16,5,7,C.bossD);
    fillRect(img,4,8,16,12,C.boss);
    fillRect(img,6,3,12,8,C.boss);
    fillRect(img,5,1,3,3,C.blood);
    fillRect(img,16,1,3,3,C.blood);
    fillRect(img,3,10,3,3,C.blood);
    fillRect(img,18,10,3,3,C.blood);
    fillRect(img,8,6,3,3,C.eye);
    fillRect(img,13,6,3,3,C.eye);
    px(img,9,7,C.pupil);px(img,14,7,C.pupil);
  });
  // Parts
  sprites.partHead=makeImg(8,8,img=>{
    fillRect(img,1,1,6,6,C.green);
    fillRect(img,1,0,6,2,C.greenD);
    px(img,2,3,C.eye);px(img,5,3,C.eye);
  });
  sprites.partArm=makeImg(8,8,img=>{
    fillRect(img,2,1,4,6,C.green);
    fillRect(img,3,0,2,3,C.steel);
  });
  sprites.partLeg=makeImg(6,8,img=>{
    fillRect(img,1,0,4,8,C.greenD);
    fillRect(img,1,6,4,2,C.skinD);
  });
  sprites.partTail=makeImg(10,6,img=>{
    fillRect(img,0,1,8,4,C.purple);
    fillRect(img,7,0,3,3,C.purpleD);
    px(img,9,0,C.orange);
  });
  sprites.partHorn=makeImg(6,10,img=>{
    fillRect(img,1,0,3,10,C.horn);
    fillRect(img,2,0,2,4,C.hornD);
  });
  sprites.partBossArm=makeImg(10,10,img=>{
    fillRect(img,1,1,7,8,C.boss);
    fillRect(img,2,6,6,4,C.bossD);
  });
  sprites.partBossHead=makeImg(12,10,img=>{
    fillRect(img,1,1,10,8,C.boss);
    fillRect(img,3,3,2,2,C.eye);
    fillRect(img,7,3,2,2,C.eye);
  });
  return sprites;
}

const SPR=makeEnemySprites();
const heroSprites=[];
for(let d=0;d<4;d++){
  heroSprites[d]=[];
  for(let f=0;f<2;f++)heroSprites[d][f]=heroFrame(d,f,-1);
  for(let s=0;s<5;s++)heroSprites[d]["s"+s]=heroFrame(d,0,s);
}

const heartFull=makeImg(9,8,img=>{
  fillRect(img,1,1,3,3,C.blood);
  fillRect(img,5,1,3,3,C.blood);
  fillRect(img,0,2,9,3,C.blood);
  fillRect(img,1,5,7,2,C.blood);
  fillRect(img,3,7,3,1,C.blood);
  fillRect(img,2,2,2,2,C.bloodD);
});
const heartEmpty=makeImg(9,8,img=>{
  fillRect(img,1,1,3,3,[60,40,40]);
  fillRect(img,5,1,3,3,[60,40,40]);
  fillRect(img,0,2,9,3,[60,40,40]);
  fillRect(img,1,5,7,2,[60,40,40]);
  fillRect(img,3,7,3,1,[60,40,40]);
});
// ---- Particles / blood / parts ----
function spray(x,y,n,ang,spread){
  for(let i=0;i<n;i++){
    const a=ang+(Math.random()-0.5)*spread;
    const sp=1+Math.random()*2.5;
    if(bloodOn){
      particles.push({
        x,y,z:2+Math.random()*4,
        vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, vz:1+Math.random()*2,
        life:30+Math.random()*30, max:60,
        col:Math.random()<0.5?C.blood:C.bloodD, size:1+Math.random()*1.5, kind:"blood"
      });
    } else {
      particles.push({
        x,y,z:2+Math.random()*3,
        vx:Math.cos(a)*sp*0.7, vy:Math.sin(a)*sp*0.7, vz:1+Math.random()*1.5,
        life:20+Math.random()*20, max:40,
        col:Math.random()<0.5?C.spark:C.dust, size:1+Math.random(), kind:"spark"
      });
    }
  }
}

function addSplat(x,y){
  if(!bloodOn)return;
  splats.push({x,y, life:180+Math.random()*120, max:300, size:2+Math.random()*3, col:Math.random()<0.5?C.blood:C.bloodD});
}

function detachPart(e, partName, ang){
  let spr, ox=0, oy=0;
  if(partName==="head"){spr=e.type==="boss"?SPR.partBossHead:SPR.partHead;oy=-4}
  else if(partName==="arm"||partName==="arms"){spr=e.type==="boss"?SPR.partBossArm:SPR.partArm;ox=6}
  else if(partName==="leg"||partName==="legs"){spr=SPR.partLeg;oy=6}
  else if(partName==="tail"){spr=SPR.partTail;ox=-6}
  else if(partName==="horn"||partName==="horns"){spr=SPR.partHorn;oy=-6}
  else spr=SPR.partArm;
  const sp=2+Math.random()*3;
  if(!bloodOn){
    // poof
    for(let i=0;i<8;i++){
      const a=Math.random()*Math.PI*2;
      particles.push({x:e.x+e.w/2,y:e.y+e.h/2,z:4,vx:Math.cos(a)*2,vy:Math.sin(a)*2,vz:2,life:25,max:25,col:C.dust,size:2,kind:"spark"});
    }
    return;
  }
  parts.push({
    spr, x:e.x+e.w/2+ox, y:e.y+e.h/2+oy, z:6+Math.random()*4,
    vx:Math.cos(ang)*sp+(Math.random()-0.5), vy:Math.sin(ang)*sp+(Math.random()-0.5),
    vz:2.5+Math.random()*2, rot:Math.random()*Math.PI*2, spin:(Math.random()-0.5)*0.4,
    life:200+Math.random()*100, max:300, grounded:false
  });
  spray(e.x+e.w/2, e.y+e.h/2, 6, ang, 1.2);
}

function hurtEnemy(e, dmg, ang, canDismember){
  if(e.iframes>0||e.dead)return;
  e.hp-=dmg; e.provoked=true;
  e.iframes=10;
  e.flash=6;
  e.knockT=8;
  e.knockVx=Math.cos(ang)*2.5;
  e.knockVy=Math.sin(ang)*2.5;
  spray(e.x+e.w/2, e.y+e.h/2, bloodOn?8:5, ang, 1.5);
  addSplat(e.x+e.w/2, e.y+e.h/2);
  shake=4; SFX.hit(); if(bloodOn)SFX.blood();

  // Dismemberment chances based on remaining hp / type
  if(canDismember && e.hp>0){
    {const before=Object.keys(e.parts).filter(k=>e.parts[k]);tryDismember(e, ang);for(const k of before)if(!e.parts[k])onSever(e,k);}
  }
  if(e.hp<=0){
    killEnemy(e, ang);
  }
}

function tryDismember(e, ang){
  const roll=Math.random();
  if(e.type==="grunt"){
    if(e.parts.arm && roll<0.45){e.parts.arm=false; detachPart(e,"arm",ang); e.state="flee"}
    else if(e.parts.legs && roll<0.25){e.parts.legs=false; detachPart(e,"legs",ang)}
  } else if(e.type==="crawler"){
    if(e.parts.tail && roll<0.5){e.parts.tail=false; detachPart(e,"tail",ang)}
    else if(e.parts.legs && roll<0.3){e.parts.legs=false; detachPart(e,"legs",ang)}
  } else if(e.type==="charger"){
    if(e.parts.horns && roll<0.4){e.parts.horns=false; detachPart(e,"horns",ang); if(e.state==="charge")e.state="chase"}
  } else if(e.type==="boss"){
    if(e.parts.horns && roll<0.35){e.parts.horns=false; detachPart(e,"horns",ang)}
    else if(e.parts.arms && roll<0.35){e.parts.arms=false; detachPart(e,"arms",ang)}
  } else if(e.type==="spitter"){
    if(e.parts.legs && roll<0.3){e.parts.legs=false; detachPart(e,"legs",ang)}
  }
}

function killEnemy(e, ang){
  e.dead=true;
  kills++;
  score+=10; onKill(e);
  // always lose head on death
  if(e.parts.head){e.parts.head=false; detachPart(e,"head",ang)}
  // fling remaining parts
  if(e.parts.arm){e.parts.arm=false; detachPart(e,"arm",ang+0.5)}
  if(e.parts.arms){e.parts.arms=false; detachPart(e,"arms",ang-0.5)}
  if(e.parts.tail){e.parts.tail=false; detachPart(e,"tail",ang+1)}
  if(e.parts.horns){e.parts.horns=false; detachPart(e,"horns",ang-1)}
  if(e.parts.legs){e.parts.legs=false; detachPart(e,"legs",ang+0.3)}
  spray(e.x+e.w/2, e.y+e.h/2, bloodOn?14:8, ang, 2.5);
  addSplat(e.x+e.w/2, e.y+e.h/2);
  addSplat(e.x+e.w/2+4, e.y+e.h/2-2);
}

// ---- Combat helpers ----
function swordHitbox(){
  if(hero.swinging<0)return null;
  const cx=hero.x+hero.w/2, cy=hero.y+hero.h/2;
  const reach=18;
  const dirs=[[0,1],[-1,0],[1,0],[0,-1]];
  const [dx,dy]=dirs[hero.dir];
  // arc widens mid-swing
  const t=hero.swinging/4;
  return {x:cx+dx*10-10, y:cy+dy*10-10, w:20, h:20, ang:Math.atan2(dy,dx)};
}

function aabb(a,b){
  return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}

function moveEntity(ent, dx, dy){
  if(dx!==0){
    ent.x+=dx;
    if(blockedE(ent)){
      ent.x-=dx;
      // slide
      const step=Math.sign(dx)*0.5;
      for(let i=0;i<Math.abs(dx)*2;i++){
        ent.x+=step;
        if(blockedE(ent)){ent.x-=step;break}
      }
    }
  }
  if(dy!==0){
    ent.y+=dy;
    if(blockedE(ent)){
      ent.y-=dy;
      const step=Math.sign(dy)*0.5;
      for(let i=0;i<Math.abs(dy)*2;i++){
        ent.y+=step;
        if(blockedE(ent)){ent.y-=step;break}
      }
    }
  }
}
function combatAI(e){
  if(e.dead)return;
  if(e.iframes>0)e.iframes--;
  if(e.flash>0)e.flash--;
  if(e.atkCd>0)e.atkCd--;
  if(e.knockT>0){
    moveEntity(e, e.knockVx, e.knockVy);
    e.knockVx*=0.75; e.knockVy*=0.75;
    e.knockT--;
    return;
  }
  e.timer++;
  e.anim++;
  if(e.anim%8===0)e.frame^=1;

  const cx=e.x+e.w/2, cy=e.y+e.h/2;
  const hx=hero.x+hero.w/2, hy=hero.y+hero.h/2;
  const dx=hx-cx, dy=hy-cy;
  const dist=Math.hypot(dx,dy)||1;
  const ang=Math.atan2(dy,dx);

  // speed mods from missing parts
  let spd=e.spd;
  if(!e.parts.legs)spd*=0.35;
  if(e.type==="crawler" && !e.parts.tail)spd*=0.85;

  // Behavior
  if(e.type==="grunt"){
    if(!e.parts.arm){
      // flee or ram
      if(dist<50){moveEntity(e, -Math.cos(ang)*spd*1.2, -Math.sin(ang)*spd*1.2)}
      else { // occasional ram
        if(e.state!=="ram" && Math.random()<0.01){e.state="ram"; e.timer=0}
        if(e.state==="ram"){
          moveEntity(e, Math.cos(ang)*spd*1.8, Math.sin(ang)*spd*1.8);
          if(e.timer>40)e.state="flee";
          if(dist<14 && !hero.dead)hurtHero(e.dmg, ang);
        }
      }
    } else {
      moveEntity(e, Math.cos(ang)*spd, Math.sin(ang)*spd);
      if(dist<16 && e.atkCd<=0){
        e.atkCd=40;
        if(!hero.dead){hurtHero(e.dmg, ang);goblinSteal(e);}
      }
    }
  } else if(e.type==="crawler"){
    // erratic if no tail, otherwise weave
    let ox=Math.cos(ang)*spd, oy=Math.sin(ang)*spd;
    if(!e.parts.tail){
      ox+=Math.sin(e.timer*0.3)*1.2;
      oy+=Math.cos(e.timer*0.25)*1.2;
    } else {
      ox+=Math.sin(e.timer*0.15)*0.4;
      // tail whip at close range
      if(dist<18 && e.atkCd<=0){
        e.atkCd=35;
        if(!hero.dead)hurtHero(e.dmg, ang);
        spray(cx,cy,3,ang,1);
      }
    }
    moveEntity(e, ox, oy);
    if(dist<12 && e.atkCd<=0 && !e.parts.tail){
      e.atkCd=30;
      if(!hero.dead)hurtHero(e.dmg, ang);
    }
  } else if(e.type==="spitter"){
    if(dist<70){
      // kite
      moveEntity(e, -Math.cos(ang)*spd, -Math.sin(ang)*spd);
    } else if(dist>100){
      moveEntity(e, Math.cos(ang)*spd, Math.sin(ang)*spd);
    }
    // strafe
    moveEntity(e, -Math.sin(ang)*spd*0.5, Math.cos(ang)*spd*0.5);
    if(e.atkCd<=0 && dist<130){
      e.atkCd=70;
      projectiles.push({
        x:cx, y:cy, vx:Math.cos(ang)*2.2, vy:Math.sin(ang)*2.2,
        life:90, r:3, dmg:1, col:[100,200,80]
      });
    }
  } else if(e.type==="charger"){
    if(!e.parts.horns){
      // no charge — slow chase / bite
      moveEntity(e, Math.cos(ang)*spd*0.8, Math.sin(ang)*spd*0.8);
      if(dist<16 && e.atkCd<=0){e.atkCd=45; if(!hero.dead)hurtHero(e.dmg,ang)}
    } else {
      if(e.state==="windup"){
        e.timer++;
        if(e.timer>25){e.state="charge"; e.timer=0; e.chargeAng=ang}
      } else if(e.state==="charge"){
        moveEntity(e, Math.cos(e.chargeAng)*spd*3.2, Math.sin(e.chargeAng)*spd*3.2);
        e.timer++;
        if(dist<16){if(!hero.dead)hurtHero(e.dmg+1,e.chargeAng); e.state="chase"; e.atkCd=50}
        if(e.timer>35)e.state="chase";
      } else {
        moveEntity(e, Math.cos(ang)*spd, Math.sin(ang)*spd);
        if(dist<90 && dist>30 && e.atkCd<=0 && Math.random()<0.02){
          e.state="windup"; e.timer=0; e.atkCd=80;
        }
        if(dist<14 && e.atkCd<=0){e.atkCd=40; if(!hero.dead)hurtHero(e.dmg,ang)}
      }
    }
  } else if(e.type==="boss"){
    // phases based on parts
    if(e.state==="slam"){
      e.timer++;
      if(e.timer===15){
        // slam shockwave
        shake=8;
        if(dist<40 && !hero.dead)hurtHero(e.dmg, ang);
        for(let i=0;i<12;i++){
          const a=i/12*Math.PI*2;
          particles.push({x:cx,y:cy,z:0,vx:Math.cos(a)*3,vy:Math.sin(a)*3,vz:1,life:20,max:20,col:C.dust,size:3,kind:"spark"});
        }
      }
      if(e.timer>30)e.state="chase";
    } else if(e.state==="charge"){
      moveEntity(e, Math.cos(e.chargeAng)*spd*2.8, Math.sin(e.chargeAng)*spd*2.8);
      e.timer++;
      if(dist<20){if(!hero.dead)hurtHero(e.dmg+1,e.chargeAng); e.state="chase"; e.atkCd=40}
      if(e.timer>40)e.state="chase";
    } else {
      moveEntity(e, Math.cos(ang)*spd, Math.sin(ang)*spd);
      if(e.atkCd<=0){
        if(e.parts.arms && dist<50 && Math.random()<0.03){
          e.state="slam"; e.timer=0; e.atkCd=90;
        } else if(e.parts.horns && dist<100 && dist>40 && Math.random()<0.02){
          e.state="charge"; e.timer=0; e.chargeAng=ang; e.atkCd=100;
        } else if(dist<22){
          e.atkCd=50;
          if(!hero.dead)hurtHero(e.dmg, ang);
        }
      }
    }
  }

  // face
  if(Math.abs(dx)>Math.abs(dy))e.dir=dx<0?1:2;
  else e.dir=dy<0?3:0;
}

function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.z+=p.vz;
    p.vz-=0.25;
    if(p.z<=0){
      p.z=0; p.vz*=-0.3; p.vx*=0.6; p.vy*=0.6;
      if(p.kind==="blood" && Math.random()<0.3)addSplat(p.x,p.y);
      if(Math.abs(p.vz)<0.3){p.vx*=0.5;p.vy*=0.5}
    }
    p.life--;
    if(p.life<=0)particles.splice(i,1);
  }
  for(let i=splats.length-1;i>=0;i--){
    splats[i].life--;
    if(splats[i].life<=0)splats.splice(i,1);
  }
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];
    if(!p.grounded){
      p.x+=p.vx; p.y+=p.vy; p.z+=p.vz;
      p.vz-=0.3; p.rot+=p.spin;
      if(p.z<=0){
        p.z=0; p.vz*=-0.4; p.vx*=0.5; p.vy*=0.5; p.spin*=0.6;
        if(Math.abs(p.vz)<0.5){p.grounded=true; p.vx=0; p.vy=0}
      }
    }
    p.life--;
    if(p.life<=0)parts.splice(i,1);
  }
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    p.x+=p.vx; p.y+=p.vy; p.life--;
    if(blocked(p.x-2,p.y-2,4,4)){projectiles.splice(i,1);continue}
    if(!p.friendly&&aabb({x:p.x-p.r,y:p.y-p.r,w:p.r*2,h:p.r*2}, hero) && !hero.dead){
      hurtHero(p.dmg, Math.atan2(p.vy,p.vx));
      projectiles.splice(i,1);
      continue;
    }
    if(p.life<=0)projectiles.splice(i,1);
  }
}
function drawSplats(){
  for(const s of splats){
    const a=Math.min(1,s.life/60);
    ctx.globalAlpha=a*0.7;
    ctx.fillStyle=`rgb(${s.col[0]},${s.col[1]},${s.col[2]})`;
    ctx.beginPath();
    ctx.ellipse(s.x,s.y,s.size,s.size*0.6,0,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha=1;
}
function drawHero(){
  if(hero.dead)return;
  if(hero.iframes>0 && Math.floor(hero.iframes/3)%2===0)return;
  let spr;
  if(hero.swinging>=0)spr=heroSprites[hero.dir]["s"+Math.min(hero.swinging,4)];
  else spr=heroSprites[hero.dir][hero.frame];
  // shadow
  ctx.globalAlpha=0.25;
  ctx.fillStyle="#000";
  ctx.beginPath();ctx.ellipse(hero.x+8,hero.y+14,6,2.5,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  ctx.drawImage(spr, Math.floor(hero.x-2), Math.floor(hero.y-4));
  // sword arc trail
  if(hero.swinging>=0 && hero.swinging<4){
    const cx=hero.x+6, cy=hero.y+6;
    const dirs=[[0,1],[-1,0],[1,0],[0,-1]];
    const [dx,dy]=dirs[hero.dir];
    ctx.strokeStyle="rgba(200,220,255,0.45)";
    ctx.lineWidth=2;
    ctx.beginPath();
    const base=Math.atan2(dy,dx);
    ctx.arc(cx,cy,14, base-0.9+hero.swinging*0.35, base-0.3+hero.swinging*0.35);
    ctx.stroke();
  }
}

function enemySprite(e){
  if(e.img)return e.img;
  if(e.type==="grunt"){
    if(!e.parts.legs)return SPR.gruntCrawl;
    if(!e.parts.arm)return SPR.gruntNoArm;
    return SPR.grunt;
  }
  if(e.type==="crawler")return e.parts.tail?SPR.crawler:SPR.crawlerNoTail;
  if(e.type==="spitter")return SPR.spitter;
  if(e.type==="charger")return e.parts.horns?SPR.charger:SPR.chargerNoHorn;
  if(e.type==="boss"){
    if(!e.parts.arms && !e.parts.horns)return SPR.bossBare;
    if(!e.parts.arms)return SPR.bossNoArms;
    if(!e.parts.horns)return SPR.bossNoHorns;
    return SPR.boss;
  }
  return SPR.grunt;
}
function drawParts(){
  for(const p of parts){
    const a=Math.min(1, p.life/40);
    ctx.globalAlpha=a;
    // shadow
    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y+2, 4, 1.5, 0,0,Math.PI*2);
    ctx.fill();
    ctx.save();
    ctx.translate(p.x, p.y - p.z);
    ctx.rotate(p.rot);
    ctx.drawImage(p.spr, -p.spr.width/2, -p.spr.height/2);
    ctx.restore();
  }
  ctx.globalAlpha=1;
}

function drawParticles(){
  for(const p of particles){
    const a=Math.min(1,p.life/15);
    ctx.globalAlpha=a;
    ctx.fillStyle=`rgb(${p.col[0]},${p.col[1]},${p.col[2]})`;
    ctx.fillRect(p.x - p.size/2, p.y - p.z - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha=1;
}

function drawProjectiles(){
  for(const p of projectiles){
    ctx.fillStyle=`rgb(${p.col[0]},${p.col[1]},${p.col[2]})`;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle="rgba(200,255,150,0.5)";
    ctx.beginPath();
    ctx.arc(p.x-p.vx,p.y-p.vy,p.r*0.6,0,Math.PI*2);
    ctx.fill();
  }
}
function spawnEnemy(type,x,y){
  const e={
    type, x, y, w:12, h:12,
    vx:0,vy:0, hp:0, maxHp:0,
    dir:0, frame:0, anim:0, state:"chase",
    timer:0, atkCd:0, hurt:0, iframes:0,
    knockT:0, knockVx:0, knockVy:0,
    parts:{head:true,arm:true,legs:true,tail:true,horns:true,arms:true},
    dead:false, flash:0
  };
  if(type==="grunt"){e.hp=3;e.maxHp=3;e.spd=0.55;e.dmg=1}
  else if(type==="crawler"){e.hp=2;e.maxHp=2;e.spd=1.1;e.dmg=1;e.w=12;e.h=10}
  else if(type==="spitter"){e.hp=2;e.maxHp=2;e.spd=0.4;e.dmg=1}
  else if(type==="charger"){e.hp=4;e.maxHp=4;e.spd=0.5;e.dmg=1}
  else if(type==="boss"){e.hp=16;e.maxHp=16;e.spd=0.45;e.dmg=2;e.w=20;e.h=20;e.x=x-4;e.y=y-4}
  return e;
}
// ===== WORLD =====
const WW=384, WH=288, PXW=WW*TILE, PXH=WH*TILE;
const DEEP=0,SHAL=1,SAND=2,GRASS=3,FOREST=4,TREE=5,ROCK=6,ROAD=7,RUIN=8,WALL=9,PIER=10,FLOWER=11,COBBLE=12,FARM=13,CAVE=14,BUSH=15,CLIFF=16,MTN=17,STAIRS=18;
const T=new Uint8Array(WW*WH), OCC=new Int16Array(WW*WH), ELEV=new Uint8Array(WW*WH);
const elevAt=(x,y)=>x<0||y<0||x>=WW||y>=WH?0:ELEV[y*WW+x];
const tAt=(x,y)=>x<0||y<0||x>=WW||y>=WH?DEEP:T[y*WW+x];
const SETS=[
 {id:0,name:"Aldmoor",kind:"town",x:138,y:146,r:22,roof:["#3d6fd6","#1d3a8a"],wall:"#f2e2c0",gem:"#7ff"},
 {id:1,name:"Saltmere",kind:"harbor town",x:244,y:150,r:22,roof:["#1fb5a8","#0b6460"],wall:"#fbf6ea",gem:"#9ff",harbor:true},
 {id:2,name:"Highcrest",kind:"town",x:110,y:58,r:22,roof:["#8a5cc8","#3f2470"],wall:"#cfc6bf",gem:"#f8f"},
 {id:3,name:"Fernhollow",kind:"village",x:52,y:124,r:18,roof:["#5fae3c","#2c5e1a"],wall:"#b98a55",gem:"#bf6"},
 {id:4,name:"Reedwick",kind:"village",x:124,y:224,r:18,roof:["#e8b23c","#9a6414"],wall:"#ead7a8",gem:"#fd6"},
 {id:5,name:"Coralcove",kind:"island village",x:330,y:66,r:16,roof:["#ff7a8a","#b0304a"],wall:"#f5dcb0",gem:"#f9c",island:true},
];
const ISLES=[{x:332,y:68,r:30,name:"Coral Isle"},{x:338,y:228,r:21,name:"Isle of Bones"},{x:364,y:150,r:15,name:"Stormcrag"},{x:290,y:268,r:15,name:"Sunken Atoll"},{x:366,y:22,r:12,name:"Gull Rock"}];
const RUINS={x:198,y:62}, ISLE_RUIN={x:338,y:228}, CAVE_POS={x:364,y:150}, DUNGEON={x:4,y:4,w:30,h:18};
const POIS=[{x:44,y:196,name:"Sunken Chapel",loot:{gold:60,gem:2}},{x:204,y:218,name:"Watchtower Ruins",loot:{gold:70,dscale:1}},{x:176,y:28,name:"Old Shrine",loot:{gold:50,gem:1,pearl:1}},{x:290,y:268,name:"Atoll Grotto",loot:{gold:90,pearl:3}},{x:366,y:22,name:"Gull Nest",loot:{gold:40,gem:2}}];
const LAKE={x:84,y:180};
let buildings=[], objects=[], waystones=[], piers=[];
function genWorld(){
  for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){
    const dx=(x-140)/124,dy=(y-144)/132;
    let lv=1-Math.hypot(dx,dy)+(fbm(x,y,7)-0.5)*0.7;
    for(const I of ISLES){lv=Math.max(lv,1-Math.hypot(x-I.x,y-I.y)/I.r+(fbm(x,y,9)-0.5)*0.5);}
    for(const s of SETS){const d=Math.hypot(x-s.x,y-s.y);if(d<s.r+7)lv=Math.max(lv,0.4);}for(const q of POIS){if(Math.hypot(x-q.x,y-q.y)<9)lv=Math.max(lv,0.3);}
    let t;
    if(lv<0)t=DEEP;else if(lv<0.07)t=SHAL;else if(lv<0.13)t=SAND;else{
      const e=fbm(x+300,y,3)+0;
      const m=fbm(x,y+500,5);
      if(e>0.62){t=MTN;ELEV[y*WW+x]=e>0.78?3:e>0.7?2:1;if(hash2(x,y,14)<0.03)t=ROCK;}
      else if(m>0.55){const clear=fbm(x+900,y+900,15)<0.36;const dense=m>0.64?0.26:0.17;t=!clear&&hash2(x,y,11)<dense?TREE:FOREST;if(t===FOREST&&hash2(x,y,12)<0.03)t=BUSH;}
      else{t=GRASS;const h=hash2(x,y,13);if(h<0.035)t=FLOWER;else if(h<0.042)t=BUSH;else if(h<0.052)t=TREE;}
      if((t===TREE||t===BUSH)&&y>0&&x>0){const a=T[y*WW+x-1],b=T[(y-1)*WW+x],c=T[(y-1)*WW+x-1],d=T[(y-1)*WW+x+1];if([a,b,c,d].some(q=>q===TREE||q===BUSH))t=m>0.55?FOREST:GRASS;}
    }
    T[y*WW+x]=t;
  }
  // lake + river
  for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){
    const d=Math.hypot((x-LAKE.x)/15,(y-LAKE.y)/10);
    if(d<1)T[y*WW+x]=d<0.75?DEEP:SHAL;else if(d<1.18&&T[y*WW+x]!==DEEP&&T[y*WW+x]!==SHAL)T[y*WW+x]=SAND;
  }
  for(let y=LAKE.y+5;y<WH;y++){const cx=Math.round(LAKE.x+Math.sin(y*0.18)*4);
    if(T[y*WW+cx]===DEEP&&y>LAKE.y+12)break;
    for(let k=-2;k<=2;k++){const i=y*WW+cx+k;T[i]=Math.abs(k)<2?DEEP:SHAL;}}
  // mountain ruins
  for(let y=RUINS.y-6;y<=RUINS.y+6;y++)for(let x=RUINS.x-8;x<=RUINS.x+8;x++){
    const edge=Math.abs(y-RUINS.y)===6||Math.abs(x-RUINS.x)===8;
    T[y*WW+x]=edge?(hash2(x,y,21)<0.65?WALL:RUIN):(hash2(x,y,22)<0.06?WALL:RUIN);}
  // island ruins
  for(let y=ISLE_RUIN.y-4;y<=ISLE_RUIN.y+4;y++)for(let x=ISLE_RUIN.x-5;x<=ISLE_RUIN.x+5;x++){
    const edge=Math.abs(y-ISLE_RUIN.y)===4||Math.abs(x-ISLE_RUIN.x)===5;
    T[y*WW+x]=edge&&hash2(x,y,23)<0.5?WALL:RUIN;}
  // cave isle
  for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)T[(CAVE_POS.y+y)*WW+CAVE_POS.x+x]=Math.abs(x)+Math.abs(y)>2?ROCK:RUIN;
  T[CAVE_POS.y*WW+CAVE_POS.x]=CAVE; T[(CAVE_POS.y+1)*WW+CAVE_POS.x]=RUIN;T[(CAVE_POS.y+2)*WW+CAVE_POS.x]=RUIN;
  // dungeon (sealed chamber in the far ocean corner)
  const D=DUNGEON;
  for(let y=D.y;y<D.y+D.h;y++)for(let x=D.x;x<D.x+D.w;x++){
    const edge=y===D.y||x===D.x||y===D.y+D.h-1||x===D.x+D.w-1;
    T[y*WW+x]=edge?WALL:(hash2(x,y,31)<0.07&&y>D.y+2?WALL:RUIN);}
  T[(D.y+D.h-2)*WW+D.x+2]=CAVE; T[(D.y+D.h-3)*WW+D.x+2]=RUIN;
  // roads between settlements
  const road=(a,b)=>{let x=a.x,y=a.y;const step=(nx,ny)=>{x=nx;y=ny;for(let k=0;k<2;k++){const i=y*WW+x+k;const t=T[i];
      if(t===DEEP||t===SHAL)T[i]=PIER;else if(t===CLIFF)T[i]=STAIRS;else if(t!==COBBLE&&t!==RUIN&&t!==WALL&&t!==CAVE)T[i]=ROAD;}};
    while(x!==b.x)step(x+Math.sign(b.x-x),y);while(y!==b.y)step(x,y+Math.sign(b.y-y));};
  road(SETS[0],SETS[1]);road(SETS[0],SETS[2]);road(SETS[0],SETS[3]);road(SETS[0],SETS[4]);road(SETS[2],{x:RUINS.x,y:RUINS.y+7});road({x:RUINS.x,y:SETS[2].y},{x:RUINS.x,y:RUINS.y});road(SETS[3],{x:POIS[0].x,y:POIS[0].y-6});road(SETS[0],{x:POIS[1].x,y:POIS[1].y-6});road(SETS[2],{x:POIS[2].x,y:POIS[2].y+6});
  buildings=[];objects=[];waystones=[];piers=[];
  for(const s of SETS)layoutSettlement(s);
  genRiver();
  // piers
  const mkPier=(s,dir)=>{let x=s.x,y=s.y+1;while(T[y*WW+x]!==DEEP&&T[y*WW+x]!==SHAL||Math.abs(x-s.x)<s.r)x+=dir;
    for(let k=0;k<6;k++){T[y*WW+x]=PIER;T[(y+1)*WW+x]=PIER;x+=dir;}
    for(let k=0;k<3;k++)for(let j=-2;j<=3;j++){const i=(y+j)*WW+x+k*dir;if(T[i]!==PIER)T[i]=DEEP;}
    const p={s:s.id,x:x-dir,y:y,bx:(x+dir*0.5)*TILE,by:(y+2.2)*TILE,dir};piers.push(p);return p;};
  mkPier(SETS[1],1);mkPier(SETS[5],-1);
  // extra wild waystone at ruins & island
  waystones.push({s:-1,name:"Old Ruins",x:RUINS.x,y:RUINS.y+8,found:false});
  for(const w of waystones){T[w.y*WW+w.x]=COBBLE;OCC[w.y*WW+w.x]=-1;}
  objects.push({type:"chest",id:"isleruin",x:ISLE_RUIN.x,y:ISLE_RUIN.y,loot:{gold:80,amulet:1}});
  objects.push({type:"chest",id:"dungeon",x:DUNGEON.x+26,y:DUNGEON.y+3,loot:{gold:150,gem:3,dscale:1}});
  objects.push({type:"chest",id:"ruins",x:RUINS.x+5,y:RUINS.y-3,loot:{gold:40,gem:1}});
  objects.push({type:"chest",id:"coral",x:ISLES[0].x-4,y:ISLES[0].y+18,loot:{gold:30,pearl:2}});
  POIS.forEach((q,i)=>{for(let y=q.y-4;y<=q.y+4;y++)for(let x=q.x-6;x<=q.x+6;x++){const e=Math.abs(y-q.y)===4||Math.abs(x-q.x)===6;T[y*WW+x]=e&&hash2(x,y,61+i)<0.45&&!(x===q.x||y===q.y)?WALL:RUIN;}objects.push({type:"chest",id:"poi"+i,x:q.x+2,y:q.y-2,loot:q.loot});waystones.push({s:-1,name:q.name,x:q.x,y:q.y+5,found:false});});
  for(const o of objects){T[o.y*WW+o.x]=o.type==="chest"?(T[o.y*WW+o.x]===RUIN?RUIN:SAND):T[o.y*WW+o.x];if(o.type==="chest")OCC[o.y*WW+o.x]=-1;}
}
const SOLID_T=new Set([TREE,ROCK,WALL,BUSH]);
let LOOKOUTS=[];
function finalizeTerrain(){
  // cliffs where elevation drops to the south; stairs every 7 columns (switchbacks) and along roads
  for(let y=0;y<WH-1;y++)for(let x=0;x<WW;x++){const i=y*WW+x,e=ELEV[i];if(!e)continue;const t=T[i];if(t!==MTN&&t!==ROCK)continue;
    if(ELEV[i+WW]<e&&T[i+WW]!==DEEP){T[i]=(x%7===0||(x+y)%23===0)?STAIRS:CLIFF;}}
  // keep trees away from roads, doors, piers, waystones, objects; no enclosures
  const clearAround=(cx,cy,r)=>{for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){const i=y*WW+x;if(T[i]===TREE||T[i]===BUSH||T[i]===ROCK&&ELEV[i])T[i]=GRASS;}};
  for(let y=1;y<WH-1;y++)for(let x=1;x<WW-1;x++){const t=T[y*WW+x];if(t===ROAD||t===PIER||t===STAIRS)clearAround(x,y,1);}
  for(const b of buildings)clearAround(b.x+1,b.y+b.h+1,2);
  for(const w of waystones)clearAround(w.x,w.y+1,2);for(const o of objects)clearAround(o.x,o.y+1,1);for(const p of piers)clearAround(p.x,p.y,2);
  for(const s of SETS){for(let y=s.y-s.r-3;y<=s.y+s.r+3;y++)for(let x=s.x-s.r-3;x<=s.x+s.r+3;x++){const i=y*WW+x;if(Math.hypot(x-s.x,y-s.y)<=s.r+3&&(T[i]===TREE||T[i]===BUSH))T[i]=GRASS;}}
  for(const w of waystones){T[w.y*WW+w.x]=COBBLE;}
  // peaks: lookouts (with treasure on some)
  LOOKOUTS=[];for(let y=4;y<WH-4;y+=2)for(let x=4;x<WW-4;x+=2){const i=y*WW+x;if(ELEV[i]===3&&T[i]===MTN&&ELEV[i-WW]===3&&ELEV[i+1]===3&&!LOOKOUTS.some(l=>Math.hypot(l.x-x,l.y-y)<26)&&!LAIRS.some(l=>Math.hypot(l.x-x,l.y-y)<10)){
    LOOKOUTS.push({x,y});objects.push({type:"lookout",x,y,id:"look"+x+"_"+y});OCC[i]=-1;if(LOOKOUTS.length%2){objects.push({type:"chest",id:"peak"+x+"_"+y,x:x+2,y,loot:{gold:60,gem:2}});OCC[i+2]=-1;T[i+2]=MTN;}}}
}
function solidTile(tx,ty){if(tx<0||ty<0||tx>=WW||ty>=WH)return true;const i=ty*WW+tx;return SOLID_T.has(T[i])||OCC[i]!==0;}
function blocked(x,y,w,h){const x0=Math.floor(x/TILE),y0=Math.floor(y/TILE),x1=Math.floor((x+w-0.01)/TILE),y1=Math.floor((y+h-0.01)/TILE);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(solidTile(tx,ty))return true;return false;}
const isWater=t=>t===DEEP||t===SHAL;
function blockedE(e){
  if(room&&e===hero)return roomBlocked(e);
  const x0=Math.floor(e.x/TILE),y0=Math.floor(e.y/TILE),x1=Math.floor((e.x+e.w-0.01)/TILE),y1=Math.floor((e.y+e.h-0.01)/TILE);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const t=tAt(tx,ty);
    if(e===hero&&hero.boat){if(!isWater(t))return true;continue;}
    if(solidTile(tx,ty))return true;
    if(e!==hero&&t===DEEP&&!e.swims)return true;
    if(e!==hero&&t===CLIFF)return true;
    if(e!==hero&&!e.npc&&GATES.length){const g=gateAt(tx,ty);if(g&&gateClosed(g)&&!(g.hp<=0))return true;}
    if(e!==hero&&!e.npc&&walls.length&&walls.some(w=>aabb(e,w)))return true;
    if(e.npc&&(t!==COBBLE&&t!==GRASS&&t!==ROAD&&t!==FARM&&t!==PIER&&t!==SAND&&t!==FLOWER))return true;
  }
  return false;
}
// ===== PAINTED TILES =====
const SEASONS=["Spring","Summer","Autumn","Winter"];
const GRASSC=[["#4fb53a","#7fd24a","#2f8a2a","#ffe36a"],["#3fa534","#6cc63e","#23771f","#fff08a"],["#a8a43a","#d49a3a","#7a6a22","#e86a2a"],["#9fb8b0","#e8f2f4","#6f8c88","#ffffff"]];
const LEAFC=[["#2f9a3a","#5fd05a","#1a5e24","#ff9ad0"],["#22843a","#4fc04a","#124a20","#e8ff8a"],["#d2641e","#f2b23a","#8a2e14","#ffdf6a"],["#56786e","#eef6f8","#2e4a44","#ffffff"]];
function dabs(g,n,cols,s,r0,r1){for(let i=0;i<n;i++){g.globalAlpha=0.25+hash2(i,s,77)*0.45;g.fillStyle=cols[i%cols.length];
  g.beginPath();g.ellipse(hash2(i,s,1)*16,hash2(i,s,2)*16,r0+hash2(i,s,3)*(r1-r0),(r0+hash2(i,s,4)*(r1-r0))*0.7,hash2(i,s,5)*3,0,7);g.fill();}g.globalAlpha=1;}
function fine(g,v){for(let i=0;i<18;i++){g.globalAlpha=0.12+hash2(i,v,201)*0.12;g.fillStyle=i%2?"#fff":"#000";g.fillRect(hash2(i,v,202)*16,hash2(i,v,203)*16,0.5,0.5);}g.globalAlpha=1;}
function makeTiles(season){
  const tiles={};const G=GRASSC[season],L=LEAFC[season];
  const mk=(f,n=4)=>{const a=[];for(let v=0;v<n;v++){const c=mkCanvas(32,32),g=c.getContext("2d");g.scale(2,2);f(g,v);fine(g,v);a.push(c);}return a;};
  tiles[GRASS]=mk((g,v)=>{g.fillStyle=G[0];g.fillRect(0,0,16,16);dabs(g,14,[G[1],G[2],G[0]],v*13+season,1,3);
    g.strokeStyle=G[2];g.globalAlpha=.6;for(let i=0;i<5;i++){const x=hash2(i,v,8)*16,y=hash2(i,v,9)*16;g.beginPath();g.moveTo(x,y);g.lineTo(x+1,y-3);g.stroke();}g.globalAlpha=1;});
  tiles[FLOWER]=mk((g,v)=>{g.drawImage(tiles[GRASS][v],0,0,16,16);const fc=season===3?["#fff"]:["#ff5aa8","#ffd23a","#a46aff","#ff7a3a","#fff"];
    for(let i=0;i<5;i++){g.fillStyle=fc[(i+v)%fc.length];const x=2+hash2(i,v,40)*12,y=2+hash2(i,v,41)*12;g.beginPath();g.arc(x,y,1.4,0,7);g.fill();g.fillStyle="#fff6b0";g.fillRect(x-0.5,y-0.5,1,1);}});
  tiles[FOREST]=mk((g,v)=>{g.fillStyle=season===3?"#8aa8a2":season===2?"#6a6a24":"#2d7a2c";g.fillRect(0,0,16,16);dabs(g,16,[L[2],G[2],season===2?"#c8642a":"#3e9a34"],v*7+3,1,3.5);});
  tiles[SAND]=mk((g,v)=>{g.fillStyle="#f0d48a";g.fillRect(0,0,16,16);dabs(g,12,["#ffe8a8","#d8b060","#f8dc98"],v+50,1,2.5);g.fillStyle="#c89a50";g.fillRect(hash2(v,1,3)*14,hash2(v,2,3)*14,1,1);});
  tiles[SHAL]=mk((g,v)=>{const gr=g.createLinearGradient(0,0,16,16);gr.addColorStop(0,"#4fe0d8");gr.addColorStop(1,"#2ab0d0");g.fillStyle=gr;g.fillRect(0,0,16,16);dabs(g,8,["#8ff4ea","#22a0c8","#e8f8c0"],v+60,1,3);});
  tiles[DEEP]=mk((g,v)=>{const gr=g.createLinearGradient(0,0,0,16);gr.addColorStop(0,"#1a6ad8");gr.addColorStop(1,"#1450b0");g.fillStyle=gr;g.fillRect(0,0,16,16);dabs(g,8,["#2a8af0","#0e3a90","#3aa0ff"],v+70,1.5,4);
    g.strokeStyle="rgba(180,230,255,.45)";g.beginPath();const y=4+v*3;g.moveTo(2,y);g.quadraticCurveTo(6,y-2,10,y);g.stroke();});
  tiles[ROCK]=mk((g,v)=>{g.fillStyle="#7a6f8a";g.fillRect(0,0,16,16);dabs(g,10,["#a59ab8","#544a66","#8e84a2"],v+80,2,5);
    g.fillStyle=season===3?"#f4faff":"rgba(255,255,255,.25)";g.beginPath();g.moveTo(3,7);g.lineTo(8,1);g.lineTo(13,7);g.lineTo(10,6);g.lineTo(8,4);g.lineTo(6,6);g.fill();
    g.strokeStyle="#3a3048";g.beginPath();g.moveTo(4,14);g.lineTo(8,9);g.lineTo(12,15);g.stroke();});
  tiles[ROAD]=mk((g,v)=>{g.fillStyle="#c49a62";g.fillRect(0,0,16,16);dabs(g,12,["#dcb47a","#a87c48","#b88c58"],v+90,1,3);g.fillStyle="#8a6a44";for(let i=0;i<3;i++)g.fillRect(hash2(i,v,91)*15,hash2(i,v,92)*15,2,1);});
  tiles[COBBLE]=mk((g,v)=>{g.fillStyle="#8a7e78";g.fillRect(0,0,16,16);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const o=y%2?2:0;
      g.fillStyle=["#c8b8a8","#b0a094","#d8c8b0","#a89488"][(x+y+v)%4];g.beginPath();g.ellipse(x*4+o+2,y*4+2,1.8,1.5,0,0,7);g.fill();}
    g.fillStyle="rgba(255,240,200,.25)";g.fillRect(0,0,16,1);});
  tiles[RUIN]=mk((g,v)=>{g.fillStyle="#9a9488";g.fillRect(0,0,16,16);g.strokeStyle="#5e584e";g.strokeRect(0.5,0.5,8,8);g.strokeRect(8.5,8.5,7,7);
    dabs(g,6,["#b8b2a4","#6aa04a","#7a7468"],v+100,1,3);});
  tiles[WALL]=mk((g,v)=>{g.fillStyle="#6a6278";g.fillRect(0,0,16,16);g.fillStyle="#8e86a0";g.fillRect(1,1,14,10);g.fillStyle="#4a4458";g.fillRect(0,12,16,4);
    g.strokeStyle="#e8c060";g.lineWidth=1;g.beginPath();g.moveTo(2,6);g.bezierCurveTo(5,2,7,10,8,6);g.bezierCurveTo(9,2,11,10,14,6);g.stroke();
    g.fillStyle=["#3ff","#f5f","#ff5"][v%3];g.beginPath();g.arc(8,6,1.3,0,7);g.fill();},3);
  tiles[PIER]=mk((g,v)=>{g.drawImage(tiles[DEEP][v],0,0,16,16);g.fillStyle="#9a6a3a";g.fillRect(0,1,16,14);g.fillStyle="#b88450";for(let i=0;i<4;i++)g.fillRect(i*4,1,3,14);
    g.fillStyle="#5a3a1a";g.fillRect(0,1,16,1);g.fillRect(0,14,16,1);});
  tiles[FARM]=mk((g,v)=>{g.fillStyle="#7a4e2a";g.fillRect(0,0,16,16);g.fillStyle="#5a361a";for(let y=1;y<16;y+=4)g.fillRect(0,y,16,2);dabs(g,4,["#9a6a3a"],v+110,1,2);});
  tiles[CAVE]=mk((g,v)=>{g.fillStyle="#6a6070";g.fillRect(0,0,16,16);g.fillStyle="#120a18";g.beginPath();g.ellipse(8,10,6,7,0,Math.PI,0);g.fillRect(2,10,12,6);g.fill();
    g.fillStyle="#e8c060";g.fillRect(1,2,2,14);g.fillRect(13,2,2,14);g.fillStyle="#6ff";g.beginPath();g.arc(8,2,1.5,0,7);g.fill();},1);
  tiles[MTN]=mk((g,v)=>{g.fillStyle=season===3?"#b8c4cc":"#8f8a78";g.fillRect(0,0,16,16);dabs(g,12,season===3?["#e8f2f8","#9aa8b4"]:["#a8a088","#6e6a5a","#7f9a58"],v+130,1,3);
    g.fillStyle="rgba(60,50,70,.5)";g.fillRect(hash2(v,3,4)*12,hash2(v,4,4)*12,3,2);});
  tiles[CLIFF]=mk((g,v)=>{const gr=g.createLinearGradient(0,0,0,16);gr.addColorStop(0,"#b0a6c0");gr.addColorStop(.25,"#7a6e8a");gr.addColorStop(1,"#3e3450");g.fillStyle=gr;g.fillRect(0,0,16,16);
    g.strokeStyle="rgba(30,20,40,.6)";for(let i=0;i<4;i++){const x=2+i*4+hash2(i,v,6)*2;g.beginPath();g.moveTo(x,3);g.lineTo(x+hash2(i,v,7)*2-1,16);g.stroke();}
    g.fillStyle=season===3?"#f4faff":"#9ad06a";g.fillRect(0,0,16,2);g.fillStyle="rgba(255,255,255,.35)";g.fillRect(0,2,16,1);});
  tiles[19]=mk((g,v)=>{g.drawImage(tiles[GRASS][v],0,0,16,16);g.fillStyle="rgba(0,0,0,.2)";g.beginPath();g.ellipse(9,12,5,2,0,0,7);g.fill();g.fillStyle="#7a4a24";g.fillRect(5,7,7,5);g.fillStyle="#d8b070";g.beginPath();g.ellipse(8.5,7,3.5,1.6,0,0,7);g.fill();g.strokeStyle="#a07040";g.beginPath();g.ellipse(8.5,7,1.6,.7,0,0,7);g.stroke();});
  tiles[20]=mk((g,v)=>{g.drawImage(tiles[GRASS][v],0,0,16,16);g.fillStyle="#6a4024";g.fillRect(7.5,6,1,7);g.fillStyle=L[0];g.beginPath();g.arc(8,6,3.2,0,7);g.fill();g.fillStyle=L[1];g.beginPath();g.arc(7,5,1.6,0,7);g.fill();});
  tiles[STAIRS]=mk((g,v)=>{g.fillStyle="#6a5e78";g.fillRect(0,0,16,16);for(let i=0;i<4;i++){g.fillStyle="#c8b898";g.fillRect(2,i*4,12,3);g.fillStyle="#8a7a62";g.fillRect(2,i*4+3,12,1);}
    g.fillStyle="#e8c060";g.fillRect(1,0,1,16);g.fillRect(14,0,1,16);});
  const tree=(g,v,base)=>{g.drawImage(base,0,0,16,16);g.fillStyle="rgba(0,0,0,.25)";g.beginPath();g.ellipse(9,14,6,2,0,0,7);g.fill();
    g.fillStyle="#6a4024";g.fillRect(7,9,3,6);
  };
  tiles.canopy=[0,1,2,3].map(v=>{const c=mkCanvas(48,44),g=c.getContext("2d");g.scale(2,2);g.translate(4,4);
    const cs=[[8,9,7.5,L[2]],[5,7,5,L[0]],[11,6,5,L[0]],[8,4,4.8,L[1]],[6,3.5,2.5,L[1]]];for(const [x,y,r,c2] of cs){const gr=g.createRadialGradient(x-1.5,y-2,0.5,x,y,r);gr.addColorStop(0,c2);gr.addColorStop(1,L[2]);g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
    dabs(g,14,[L[1],L[3],L[0]],v+120,0.4,1.2);g.globalAlpha=1;return c;});
  tiles[TREE]=mk((g,v)=>tree(g,v,tiles[GRASS][v]));
  tiles[BUSH]=mk((g,v)=>{g.drawImage(tiles[GRASS][v],0,0,16,16);g.fillStyle=L[2];g.beginPath();g.ellipse(8,10,7,5,0,0,7);g.fill();g.fillStyle=L[0];g.beginPath();g.ellipse(7,8,5,4,0,0,7);g.fill();
    if(season<3){g.fillStyle="#e8204a";for(let i=0;i<4;i++){g.beginPath();g.arc(4+hash2(i,v,5)*8,7+hash2(i,v,6)*5,1.1,0,7);g.fill();}}});
  return tiles;
}
let TILESET=null, tileSeason=-1;
const GCLASS={19:1,20:1,[MTN]:5,[GRASS]:1,[FLOWER]:1,[TREE]:1,[BUSH]:2,[FOREST]:2,[SAND]:3,[ROAD]:4,[ROCK]:5,[COBBLE]:6,[RUIN]:7,[FARM]:8};
function blendEdgesBase(g,tx,ty,t,px0,py0){const my=GCLASS[t];if(!my)return;
  const nb=[[0,-1],[0,1],[-1,0],[1,0]];
  for(let k=0;k<4;k++){const [dx,dy]=nb[k];const n=tAt(tx+dx,ty+dy),nc=GCLASS[n];if(!nc||nc===my||nc>my&&!(my===1&&nc===2))continue;
    const src=TILESET[n===TREE?GRASS:n===BUSH?FOREST:n][0];
    for(let s=0;s<3;s++){g.globalAlpha=0.38-s*0.12;const w=2+s*2;
      if(dy<0)g.drawImage(src,0,0,32,w*2,px0,py0,16,w);if(dy>0)g.drawImage(src,0,32-w*2,32,w*2,px0,py0+16-w,16,w);
      if(dx<0)g.drawImage(src,0,0,w*2,32,px0,py0,w,16);if(dx>0)g.drawImage(src,32-w*2,0,w*2,32,px0+16-w,py0,w,16);}
    g.globalAlpha=1;}}
const chunkCache=new Map(); const CH=16;
function invalidateTile(x,y){chunkCache.delete((x>>4)+","+(y>>4));}
function getChunk(cx,cy){
  const k=cx+","+cy; let c=chunkCache.get(k); if(c)return c;
  c=mkCanvas(CH*TILE*RS,CH*TILE*RS); const g=c.getContext("2d"); g.scale(RS,RS);
  for(let y=0;y<CH;y++)for(let x=0;x<CH;x++){const tx=cx*CH+x,ty=cy*CH+y;const t=tAt(tx,ty);
    let set=TILESET[t]; const v=Math.floor(hash2(tx,ty,5)*set.length);
    g.drawImage(set[v],x*TILE,y*TILE,16,16);
    blendEdges(g,tx,ty,t,x*TILE,y*TILE);
    const ev=elevAt(tx,ty);if(ev&&t!==CLIFF){g.fillStyle=`rgba(255,250,230,${ev*0.07})`;g.fillRect(x*TILE,y*TILE,16,16);}
    if(tAt(tx,ty-1)===CLIFF&&t!==CLIFF){const gr=g.createLinearGradient(0,y*TILE,0,y*TILE+8);gr.addColorStop(0,"rgba(20,10,40,.45)");gr.addColorStop(1,"rgba(20,10,40,0)");g.fillStyle=gr;g.fillRect(x*TILE,y*TILE,16,8);}
    if(isWater(t)){ // shoreline foam
      g.strokeStyle="rgba(255,255,255,.55)";g.lineWidth=1.5;g.beginPath();
      if(!isWater(tAt(tx,ty-1))&&tAt(tx,ty-1)!==PIER){g.moveTo(x*16,y*16+1);g.lineTo(x*16+16,y*16+1);}
      if(!isWater(tAt(tx,ty+1))&&tAt(tx,ty+1)!==PIER){g.moveTo(x*16,y*16+15);g.lineTo(x*16+16,y*16+15);}
      if(!isWater(tAt(tx-1,ty))&&tAt(tx-1,ty)!==PIER){g.moveTo(x*16+1,y*16);g.lineTo(x*16+1,y*16+16);}
      if(!isWater(tAt(tx+1,ty))&&tAt(tx+1,ty)!==PIER){g.moveTo(x*16+15,y*16);g.lineTo(x*16+15,y*16+16);}
      g.stroke();
    }
  }
  chunkCache.set(k,c);
  if(chunkCache.size>30){chunkCache.delete(chunkCache.keys().next().value);}
  return c;
}
// world overview map (1px per tile)
let worldMapC=null;
const MAPCOL={21:"#a0703a",19:"#7a9a40",20:"#4aa040",16:"#5a5068",17:"#9a90a8",18:"#c8a878",0:"#1a5ac8",1:"#3ad0d8",2:"#f0d48a",3:"#5cbc40",4:"#2d7a2c",5:"#1e6a26",6:"#8a80a0",7:"#d8a868",8:"#b0a898",9:"#5a5268",10:"#a0703a",11:"#7ad050",12:"#e0d0b8",13:"#8a5a30",14:"#000",15:"#2f8a2a"};
function buildWorldMap(){worldMapC=mkCanvas(WW,WH);const g=worldMapC.getContext("2d");const id=g.createImageData(WW,WH);
  for(let i=0;i<WW*WH;i++){let t=T[i];const x=i%WW,y=(i/WW)|0;if(x<40&&y<26)t=DEEP;const c=MAPCOL[t];id.data[i*4]=parseInt(c.substr(1,2),16)||0;
    if(c.length===4){id.data[i*4]=parseInt(c[1]+c[1],16);id.data[i*4+1]=parseInt(c[2]+c[2],16);id.data[i*4+2]=parseInt(c[3]+c[3],16);}
    else{id.data[i*4+1]=parseInt(c.substr(3,2),16);id.data[i*4+2]=parseInt(c.substr(5,2),16);}
    if(OCC[i]>0){id.data[i*4]=200;id.data[i*4+1]=80;id.data[i*4+2]=60;}id.data[i*4+3]=255;}
  g.putImageData(id,0,0);}
function biomeAt(tx,ty){const t=tAt(tx,ty);if(t===RUIN||t===WALL)return"ruins";if(t===ROCK||t===MTN||t===CLIFF||t===STAIRS)return"mountain";
  if(t===FOREST||t===TREE||t===BUSH)return"forest";if(isWater(t))return"water";if(t===SAND)return"shore";
  if(ty<70&&tx<125&&fbm(tx+300,ty,3)>0.6)return"mountain";return"meadow";}
function settlementAt(px,py){const tx=px/TILE,ty=py/TILE;for(const s of SETS)if(Math.hypot(tx-s.x,ty-s.y)<s.r+1)return s;return null;}
// ===== BIG SETTLEMENT LAYOUT: street grid + districts =====
const BRIDGE=21;const RIVERM=new Uint8Array(WW*WH);
function layoutSettlement(s){const r=s.r,town=s.kind.includes("town");const land=i=>T[i]!==DEEP&&T[i]!==SHAL&&T[i]!==PIER;
  const SX=7,SY=6;const streetX=x=>{const d=x-s.x;return ((d%SX)+SX)%SX<2;},streetY=y=>{const d=y-s.y;return ((d%SY)+SY)%SY<2;};
  for(let y=s.y-r-2;y<=s.y+r+2;y++)for(let x=s.x-r-2;x<=s.x+r+2;x++){const i=y*WW+x;if(Math.hypot(x-s.x,y-s.y)>r+2.5||!land(i))continue;ELEV[i]=0;
    const plaza=Math.abs(x-s.x-0.5)<=5&&Math.abs(y-s.y-0.5)<=3.5;const main=(x===s.x||x===s.x+1||y===s.y||y===s.y+1);
    const market=town&&x>=s.x-6&&x<=s.x+7&&y>=s.y+2&&y<=s.y+5;
    T[i]=plaza||main||market?COBBLE:(streetX(x)||streetY(y))&&Math.hypot(x-s.x,y-s.y)<=r?(town?COBBLE:ROAD):(hash2(x,y,5)<0.05?FLOWER:GRASS);}
  s.bIdx=[];const slots=[];
  for(let bj=-5;bj<=4;bj++)for(let bk=-4;bk<=3;bk++){const bx=s.x+bk*SX+2,by=s.y+bj*SY+2;
    // footprint 4x3 + door row inside radius margin
    let ok=true;for(let y=by;y<=by+3&&ok;y++)for(let x=bx-1;x<bx+5;x++){const i=y*WW+x;if(Math.hypot(x-s.x,y-s.y)>r-1.5||!land(i)){ok=false;break;}}
    if(ok)slots.push({x:bx,y:by,d:Math.hypot(bx+2-s.x,by+1-s.y),bj,bk});}
  slots.sort((a,b)=>a.d-b.d);
  // districts: castle (north band of Aldmoor), market (near plaza), harbor (water side), residential elsewhere
  const castle=s.id===0;const waterDir=s.harbor?1:s.island?-1:0;
  const want=[];if(town){want.push("guild","inn","shop","shop");}else want.push("inn","shop");if(s.harbor)want.push("harbor");
  let forsale=town?3:1;
  for(const sl of slots){if(castle&&sl.bj<=-3&&Math.abs(sl.bk+0.5)<=1.5)continue;if(town&&sl.bj===0&&(sl.bk===0||sl.bk===-1))continue; // castle district kept clear
    let kind;if(want.length){kind=want.shift();if(kind==="harbor"){const hs=slots.filter(q=>q.bk*waterDir>0&&!q.used).sort((a,b)=>b.bk*waterDir-a.bk*waterDir)[0];if(hs&&hs!==sl){hs.used=true;hs.kind="harbor";kind=want.shift()||"house";}}}
    else kind=sl.kind||(forsale>0&&sl.d>r*0.55&&hash2(sl.x,sl.y,3)<0.35?(forsale--,"forsale"):"house");
    if(sl.used&&sl.kind!=="harbor")continue;sl.used=true;sl.kind=kind;}
  // town hall = guild (central slot north of plaza) for towns
  if(town){const hall=slots.filter(q=>q.used&&q.bj===-1&&(q.bk===0||q.bk===-1)).sort((a,b)=>a.d-b.d)[0];const g=slots.find(q=>q.kind==="guild");if(hall&&g&&hall!==g){const t=hall.kind;hall.kind="guild";g.kind=t;}}
  // farms for villages in outer residential blocks
  let farms=town?0:2;
  for(const sl of slots){if(!sl.used)continue;if(farms>0&&sl.kind==="house"&&sl.d>r*0.6){farms--;if(!s.farm)s.farm={x:sl.x,y:sl.y,w:4,h:3};for(let y=sl.y;y<sl.y+3;y++)for(let x=sl.x;x<sl.x+4;x++)T[y*WW+x]=FARM;continue;}
    const b={id:buildings.length,s:s.id,x:sl.x,y:sl.y,w:4,h:3,kind:sl.kind,dmg:0,burn:0,hall:town&&sl.kind==="guild",district:sl.kind==="harbor"?"harbor":sl.d<8?"market":castle&&sl.bj<=-2?"castle":"residential"};
    for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){T[y*WW+x]=COBBLE;OCC[y*WW+x]=b.id+1;}
    T[(b.y+b.h)*WW+b.x+1]=COBBLE;T[(b.y+b.h)*WW+b.x+2]=COBBLE;s.bIdx.push(b.id);buildings.push(b);}
  const ws={s:s.id,x:s.x-6,y:s.y-1,found:false};waystones.push(ws);OCC[ws.y*WW+ws.x]=-1;
  objects.push({type:"board",s:s.id,x:s.x+6,y:s.y-1});OCC[(s.y-1)*WW+s.x+6]=-1;}
// a winding river from the northern hills to the southern sea, bridged wherever a road crosses
function genRiver(){let prev=null;for(let y=2;y<WH-2;y++){const cx=Math.round(178+Math.sin(y*0.06)*9+Math.sin(y*0.021)*6+y*0.08);
    if(y>40&&T[y*WW+cx]===DEEP&&!RIVERM[y*WW+cx]&&T[(y+3)*WW+cx]===DEEP)break;
    for(let k=-2;k<=2;k++){const x=cx+k,i=y*WW+x;if(SETS.some(s=>Math.hypot(x-s.x,y-s.y)<s.r+5))continue;if(OCC[i]>0)continue;
      const was=T[i];const deep=Math.abs(k)<=1;RIVERM[i]=1;ELEV[i]=0;
      if(was===ROAD||was===COBBLE||was===PIER||was===BRIDGE)T[i]=BRIDGE;else T[i]=deep?DEEP:SHAL;}
    // fill diagonal steps so the river is continuous
    if(prev!=null&&Math.abs(prev-cx)>1)for(let x=Math.min(prev,cx);x<=Math.max(prev,cx);x++){const i=y*WW+x;if(!SETS.some(s=>Math.hypot(x-s.x,y-s.y)<s.r+5)&&OCC[i]<=0&&T[i]!==BRIDGE){RIVERM[i]=1;T[i]=T[i]===ROAD?BRIDGE:DEEP;}}
    prev=cx;}
  // bridge widening: make sure each bridge spans the full river width
  for(let y=1;y<WH-1;y++)for(let x=1;x<WW-1;x++){const i=y*WW+x;if(T[i]!==BRIDGE)continue;for(const d of [-1,1]){let j=i+d,n=0;while(RIVERM[j]&&T[j]!==BRIDGE&&n<4){T[j]=BRIDGE;j+=d;n++;}}}}
// ===== LAIRS =====
const LAIRS=[{sp:"fire",x:156,y:30,name:"Ember Hollow"},{sp:"frost",x:60,y:44,name:"Rime Glade"},{sp:"forest",x:34,y:160,name:"Elder Grove"},{sp:"storm",x:346,y:234,name:"Thunder Shoal"}];
function genLairs(){for(const L of LAIRS)for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++){const d=Math.hypot(x,y);if(d>5.3)continue;const i=(L.y+y)*WW+L.x+x;
  T[i]=d>4.6?(hash2(x,y,51)<0.5?ROCK:RUIN):RUIN;if(L.sp==="fire"||L.sp==="frost")ELEV[i]=3;}
  // castle site (built on coronation) north of Aldmoor
}
// ===== IMAGES =====
const IMG={};
const IMGNAMES=[];
function loadImages(){return Promise.all(IMGNAMES.map(n=>new Promise(r=>{const i=new Image();i.onload=()=>{IMG[n]=i;r()};i.onerror=()=>r();i.src="assets/"+n+".png";})));}
// ===== PROCEDURAL SPRITES =====
function personSprite(p,frame,child){
  return makeImg(16,16,img=>{
    const lo=frame?1:0;
    fillRect(img,5,12,3,3,p.leg);fillRect(img,8,12,3,3,p.leg);
    fillRect(img,5+lo,14,2,2,[60,40,30]);fillRect(img,9-lo,14,2,2,[60,40,30]);
    fillRect(img,4,6,8,7,p.cloth);fillRect(img,4,6,8,1,p.trim);fillRect(img,7,7,2,5,p.trim);
    fillRect(img,3,7,1,4,p.cloth);fillRect(img,12,7,1,4,p.cloth);
    fillRect(img,5,2,6,5,p.skin);fillRect(img,5,1,6,2,p.hair);
    if(p.long){fillRect(img,4,2,1,6,p.hair);fillRect(img,11,2,1,6,p.hair);}else{fillRect(img,4,2,1,3,p.hair);fillRect(img,11,2,1,3,p.hair);}
    if(p.hat){fillRect(img,4,0,8,2,p.hat);fillRect(img,3,2,10,1,p.hat);}
    px(img,6,4,C.pupil);px(img,9,4,C.pupil);px(img,7,6,[200,110,100]);px(img,8,6,[200,110,100]);
  });
}
const SKINS=[[240,200,160],[220,170,120],[180,125,85],[130,90,60],[250,215,185]];
const HAIRS=[[60,40,20],[30,25,25],[200,150,60],[160,60,30],[220,220,220],[90,60,120]];
const CLOTH=[[200,60,80],[60,120,200],[80,170,90],[220,170,50],[150,80,190],[40,160,170],[230,120,60],[120,90,60]];
function npcLook(seed){const h=k=>Math.floor(hash2(seed,k,91)*997);
  return{skin:SKINS[h(1)%5],hair:HAIRS[h(2)%6],cloth:CLOTH[h(3)%8],trim:[240,210,110],leg:[70,60,90],long:h(4)%2===0,hat:h(5)%4===0?CLOTH[h(6)%8]:null};}
const npcSprCache=new Map();
function npcSprites(n){let s=npcSprCache.get(n.look);if(!s){const L=npcLook(n.look);s=[personSprite(L,0),personSprite(L,1)];npcSprCache.set(n.look,s);}return s;}
const bldCache=new Map();
function buildingSprite(b){
  const key=b.id+":"+b.kind+":"+(b.owned?1:0);let c=bldCache.get(key);if(c)return c;
  const s=SETS[b.s]||{roof:["#c8a040","#6a4a20"],wall:"#e8e0d0",gem:"#ff6"};
  const w=b.w*16,h=b.h*16+16;c=mkCanvas(w*2,h*2);const g=c.getContext("2d");g.scale(2,2);c.lw=w;c.lh=h;
  const wy=h-30;
  g.fillStyle=s.wall;g.fillRect(2,wy,w-4,30);
  for(let i=0;i<18;i++){g.globalAlpha=.18;g.fillStyle=i%2?"#fff":"#a08060";g.beginPath();g.ellipse(4+hash2(i,b.id,1)*(w-8),wy+3+hash2(i,b.id,2)*24,3,2,0,0,7);g.fill();}g.globalAlpha=1;
  g.fillStyle="#5a3a22";g.fillRect(2,wy,w-4,2);g.fillRect(2,wy,2,30);g.fillRect(w-4,wy,2,30);g.fillRect(w/2-14,wy,2,30);g.fillRect(w/2+12,wy,2,30);
  const dx=w/2-6;g.fillStyle="#3a2412";g.beginPath();g.moveTo(dx,h);g.lineTo(dx,wy+12);g.arc(dx+6,wy+12,6,Math.PI,0);g.lineTo(dx+12,h);g.fill();
  g.fillStyle="#7a4a26";g.fillRect(dx+2,wy+12,8,18);g.fillStyle="#e8c060";g.fillRect(dx+8,wy+20,2,2);
  for(const wx of [8,w-18]){g.fillStyle="#3a2a1a";g.fillRect(wx-1,wy+7,12,11);g.fillStyle="#ffd878";g.fillRect(wx,wy+8,10,9);g.fillStyle="#ffefb0";g.fillRect(wx,wy+8,4,4);g.fillStyle="#3a2a1a";g.fillRect(wx+4,wy+8,1,9);g.fillRect(wx,wy+12,10,1);
    g.fillStyle="#d0405a";g.fillRect(wx,wy+18,10,2);}
  const gr=g.createLinearGradient(0,0,0,wy+4);gr.addColorStop(0,s.roof[0]);gr.addColorStop(1,s.roof[1]);
  g.fillStyle=gr;g.beginPath();g.moveTo(-0,wy+4);g.lineTo(10,2);g.lineTo(w-10,2);g.lineTo(w,wy+4);g.fill();
  g.strokeStyle="rgba(0,0,0,.25)";for(let y=8;y<wy;y+=5){g.beginPath();for(let x=4;x<w;x+=6)g.arc(x,y,3,0,Math.PI);g.stroke();}
  g.strokeStyle="rgba(255,255,255,.3)";g.beginPath();g.moveTo(12,4);g.lineTo(w-12,4);g.stroke();
  g.strokeStyle="#f0c850";g.lineWidth=1.5;g.beginPath();g.moveTo(0,wy+4);g.lineTo(10,2);g.lineTo(w-10,2);g.lineTo(w,wy+4);g.stroke();
  g.lineWidth=1;g.beginPath();for(let x=12;x<w-12;x+=8){g.moveTo(x,2);g.bezierCurveTo(x+2,-1,x+4,5,x+8,2);}g.stroke();
  g.fillStyle=s.gem;g.shadowColor=s.gem;g.shadowBlur=6;g.beginPath();g.arc(w/2,8,2.5,0,7);g.fill();g.shadowBlur=0;
  const sign={inn:"INN",shop:"SHOP",harbor:"⚓ DOCK",forsale:b.owned?"HOME":"FOR SALE",castle:"♛",guild:"GUILD"}[b.kind];
  if(sign){g.font="bold 7px system-ui";const tw=g.measureText(sign).width+6;g.fillStyle="#2a1a10";g.fillRect(w/2-tw/2,wy-9,tw,9);g.strokeStyle="#e8c060";g.strokeRect(w/2-tw/2+.5,wy-8.5,tw-1,8);
    g.fillStyle="#ffe8a0";g.textAlign="center";g.fillText(sign,w/2,wy-2);}
  bldCache.set(key,c);return c;
}
function castleSprite(){const c=mkCanvas(192,176),g=c.getContext("2d");g.scale(2,2);
  g.fillStyle="#d8d0e0";g.fillRect(8,30,80,58);for(let x=8;x<88;x+=10){g.fillRect(x,24,6,8);}
  g.fillStyle="#b8b0c8";g.fillRect(0,14,20,74);g.fillRect(76,14,20,74);g.fillStyle="#6a3ac8";
  for(const x of [0,76]){g.beginPath();g.moveTo(x-2,16);g.lineTo(x+10,-2);g.lineTo(x+22,16);g.fill();}
  g.fillStyle="#3a2412";g.beginPath();g.moveTo(38,88);g.lineTo(38,62);g.arc(48,62,10,Math.PI,0);g.lineTo(58,88);g.fill();
  g.strokeStyle="#f0c850";g.lineWidth=2;g.strokeRect(8,30,80,58);g.fillStyle="#f0c850";g.font="bold 16px serif";g.textAlign="center";g.fillText("♛",48,50);
  g.fillStyle="#ffd878";for(const [x,y] of [[6,40],[82,40],[22,44],[68,44]])g.fillRect(x,y,6,8);return c;}
const SPR2={};
function makeMiscSprites(){
  SPR2.boat=(()=>{const c=mkCanvas(28,26),g=c.getContext("2d");g.fillStyle="#7a4a22";g.beginPath();g.moveTo(1,16);g.lineTo(27,16);g.lineTo(22,25);g.lineTo(6,25);g.fill();
    g.fillStyle="#a8743a";g.fillRect(3,16,22,3);g.strokeStyle="#f0c850";g.beginPath();g.moveTo(3,19);g.lineTo(25,19);g.stroke();
    g.fillStyle="#5a3a1a";g.fillRect(13,1,2,16);g.fillStyle="#f4ecd8";g.beginPath();g.moveTo(15,2);g.lineTo(25,14);g.lineTo(15,14);g.fill();g.fillStyle="#d04060";g.fillRect(15,8,6,2);return c;})();
  SPR2.way=[false,true].map(on=>{const c=mkCanvas(12,24),g=c.getContext("2d");g.fillStyle="#5a5468";g.beginPath();g.moveTo(2,24);g.lineTo(3,6);g.lineTo(6,1);g.lineTo(9,6);g.lineTo(10,24);g.fill();
    g.strokeStyle="#e8c060";g.beginPath();g.moveTo(4,20);g.bezierCurveTo(2,14,10,14,8,8);g.stroke();g.fillStyle=on?"#5ff":"#2a4a5a";if(on){g.shadowColor="#5ff";g.shadowBlur=8;}g.beginPath();g.arc(6,10,2.4,0,7);g.fill();return c;});
  SPR2.board=(()=>{const c=mkCanvas(16,18),g=c.getContext("2d");g.fillStyle="#5a3a1a";g.fillRect(2,8,2,10);g.fillRect(12,8,2,10);g.fillStyle="#9a6a3a";g.fillRect(0,1,16,10);g.strokeStyle="#e8c060";g.strokeRect(.5,1.5,15,9);
    g.fillStyle="#f4ecd8";g.fillRect(2,3,5,6);g.fillRect(9,3,5,5);return c;})();
  SPR2.chest=[0,1].map(o=>{const c=mkCanvas(14,12),g=c.getContext("2d");g.fillStyle="#8a4a1a";g.fillRect(1,o?5:3,12,o?7:9);g.fillStyle="#e8c060";g.fillRect(1,6,12,1);g.fillRect(6,5,2,3);
    if(!o){g.fillStyle="#a8602a";g.fillRect(1,2,12,4);}else{g.fillStyle="#3a1a0a";g.fillRect(2,3,10,3);}return c;});
  SPR2.wreck=(()=>{const c=mkCanvas(40,22),g=c.getContext("2d");g.fillStyle="#5a3a1a";g.save();g.translate(20,14);g.rotate(-.25);g.fillRect(-18,-4,36,9);g.fillStyle="#7a5a32";g.fillRect(-14,-6,4,4);g.fillRect(4,-14,2,12);g.restore();
    g.fillStyle="#d8d0c0";g.beginPath();g.moveTo(26,2);g.lineTo(34,8);g.lineTo(25,9);g.fill();return c;})();
  SPR2.cart=(()=>{const c=mkCanvas(30,20),g=c.getContext("2d");g.fillStyle="#8a5a2a";g.fillRect(8,6,20,9);g.fillStyle="#e8d8b0";g.beginPath();g.ellipse(18,6,10,6,0,Math.PI,0);g.fill();
    g.fillStyle="#3a2a1a";g.beginPath();g.arc(12,16,3,0,7);g.arc(24,16,3,0,7);g.fill();g.fillStyle="#a07850";g.fillRect(0,8,8,6);g.fillRect(1,5,3,3);return c;})();
  SPR2.castle=castleSprite();
  SPR2.partChunk=makeImg(6,6,img=>{fillRect(img,1,1,4,4,[150,40,50]);px(img,2,2,[200,90,90]);});
}
// ===== SPECIES =====
const SPECIES={
 goblin:{base:"grunt",beh:"agg",hp:3,aggro:90,biome:["forest","meadow"],gold:[2,6],drop:"trinket"},
 crawler:{base:"crawler",beh:"agg",hp:2,aggro:100,biome:["forest"],gold:[1,4],drop:"pelt"},
 spitter:{base:"spitter",beh:"agg",hp:2,aggro:130,biome:["mountain","ruins"],gold:[2,5],drop:"gem",dropP:.15},
 charger:{base:"charger",beh:"agg",hp:4,aggro:110,biome:["mountain"],gold:[3,7],drop:"horn"},
 scorchrat:{img:1,beh:"agg",hp:2,spd:.8,aggro:80,biome:["meadow","shore"],gold:[1,3],drop:"pelt"},
 umbrawl:{img:1,beh:"agg",hp:3,spd:.7,aggro:110,biome:["forest","meadow"],night:1,gold:[3,6],drop:"pelt"},
 gloomote:{img:1,beh:"agg",hp:4,spd:.5,aggro:120,biome:["ruins"],gold:[4,9],drop:"gem",dropP:.3},
 thornback:{img:1,beh:"neu",hp:5,spd:.45,biome:["forest"],gold:[2,5],drop:"pelt"},
 voltusk:{img:1,beh:"neu",hp:6,spd:.5,biome:["meadow"],herd:1,gold:[2,5],drop:"meat"},
 puffalo:{img:1,beh:"pea",hp:3,spd:.35,biome:["meadow"],herd:1,drop:"meat"},
 fluffin:{img:1,beh:"flee",hp:1,spd:.8,biome:["meadow"],drop:"meat"},
 mossnail:{img:1,beh:"pea",hp:2,spd:.15,biome:["forest"],drop:"herb"},
 sprigling:{img:1,beh:"flee",hp:2,spd:.7,biome:["forest"],drop:"herb"},
 lilyleap:{img:1,beh:"flee",hp:1,spd:.7,biome:["shore"],drop:"meat"},
 pondhop:{img:1,beh:"pea",hp:1,spd:.5,biome:["shore","meadow"],drop:"meat"},
 grovegiant:{img:1,beh:"neu",hp:20,spd:.4,rare:1,gold:[30,50],drop:"gem",w:28,h:18},
 tidemaw:{img:1,beh:"agg",hp:20,spd:.6,aggro:150,rare:1,swims:1,gold:[30,50],drop:"pearl",w:30,h:18},
 boss:{base:"boss",beh:"agg",hp:16,aggro:130,gold:[40,60],drop:"gem"},
 dragon:{beh:"agg",hp:40,spd:.5,aggro:170,gold:[120,200],drop:"scale",w:44,h:26}
};
let mobs=[];
function spawnMob(sp,x,y,extra){if(P)bestiary(sp);
  const d=SPECIES[sp];let e;
  if(d.base){e=spawnEnemy(d.base,x,y);if(d.base!=="boss")e.hp=e.maxHp=d.hp;}
  else{e={type:sp,x,y,w:d.w||12,h:d.h||10,vx:0,vy:0,hp:d.hp,maxHp:d.hp,dir:0,frame:0,anim:0,state:"wander",timer:0,atkCd:0,iframes:0,knockT:0,knockVx:0,knockVy:0,parts:{},dead:false,flash:0,spd:d.spd||.5,dmg:d.rare?2:1};
    if(d.img)e.img=IMG[sp];}
  e.sp=sp;e.def=d;if(d.chibi)foeSetup(e,d);e.hx=x;e.hy=y;e.swims=!!d.swims;e.wt=0;e.wx=x;e.wy=y;
  Object.assign(e,extra||{});mobs.push(e);return e;
}
// ===== DRAGONS =====
const DRAGONS={fire:{name:"Blazewyrm",breath:[255,140,40]},frost:{name:"Rimefang",breath:[160,230,255]},storm:{name:"Stormcoil",breath:[200,170,255]},forest:{name:"Verdant Wyrm",breath:[120,240,90]}};
function spawnDragon(kind,x,y,extra){
  const e=spawnMob("dragon",x,y,extra);e.dk=kind;e.dmg=2;e.hp=e.maxHp=40;
  const src=IMG["dragon_"+kind];const c=mkCanvas(src?src.width:112,src?src.height:63);if(src)c.getContext("2d").drawImage(src,0,0);e.img=c;
  e.parts={wings:true,tail:true,horns:true};e.phase=1;e.fly=0;e.persist=true;e.name=DRAGONS[kind].name;return e;
}
function severDragon(e,part,ang){
  const g=e.img.getContext("2d");const W2=e.img.width,H2=e.img.height;
  const reg={wings:[W2*0.55,0,W2*0.45,H2*0.55],tail:[0,H2*0.6,W2*0.35,H2*0.4],horns:[W2*0.18,H2*0.05,W2*0.25,H2*0.25]}[part];
  const piece=mkCanvas(reg[2]|0,reg[3]|0);piece.getContext("2d").drawImage(e.img,reg[0],reg[1],reg[2],reg[3],0,0,reg[2],reg[3]);
  g.globalCompositeOperation="destination-out";g.beginPath();g.ellipse(reg[0]+reg[2]/2,reg[1]+reg[3]/2,reg[2]/2,reg[3]/2,0,0,7);g.fill();g.globalCompositeOperation="source-over";
  e.parts[part]=false;toast(e.name+"'s "+part+" severed!");
  if(bloodOn){const sm=mkCanvas(Math.max(8,piece.width/2|0),Math.max(6,piece.height/2|0));sm.getContext("2d").drawImage(piece,0,0,sm.width,sm.height);
    parts.push({spr:sm,x:e.x+e.w/2,y:e.y+e.h/2,z:12,vx:Math.cos(ang)*2.5,vy:Math.sin(ang)*2.5,vz:3,rot:0,spin:.2,life:400,max:400,grounded:false});
    spray(e.x+e.w/2,e.y+e.h/2,12,ang,2);}
  else for(let i=0;i<10;i++){const a=Math.random()*7;particles.push({x:e.x+e.w/2,y:e.y+e.h/2,z:6,vx:Math.cos(a)*2,vy:Math.sin(a)*2,vz:2,life:25,max:25,col:C.dust,size:2,kind:"spark"});}
  SFX.roar();if(part==="wings"){e.fly=0;}
}
function updateDragon(e,dist,ang){
  if(e.iframes>0)e.iframes--;if(e.flash>0)e.flash--;if(e.atkCd>0)e.atkCd--;e.timer++;
  const r=e.hp/e.maxHp;const np=r>0.66?1:r>0.33?2:3;
  if(np!==e.phase){e.phase=np;toast(e.name+(np===2?" takes to the sky!":" is enraged!"));if(np===2&&e.parts.wings)e.fly=240;shake=8;}
  if(e.knockT>0){moveEntity(e,e.knockVx*.4,e.knockVy*.4);e.knockT--;return;}
  const sp=e.spd*(e.phase===3?1.5:1)*(e.parts.tail?1:0.8);
  if(e.fly>0){e.fly--;e.iframes=Math.max(e.iframes,2);e.x+=Math.cos(ang+Math.sin(e.timer*.03))*1.6;e.y+=Math.sin(ang+Math.sin(e.timer*.03))*1.6;
    if(e.timer%50===0)breath(e,ang,6);return;}
  if(dist>40)moveEntity(e,Math.cos(ang)*sp,Math.sin(ang)*sp);
  if(e.atkCd<=0){
    if(dist<38){e.atkCd=50;hurtHero(e.dmg+(e.parts.horns?1:0),ang);}
    else if(dist<150){e.atkCd=e.phase===3?45:80;breath(e,ang,e.phase===3?10:7);}
  }
  if(e.parts.tail&&dist<50&&e.timer%120===0){hurtHero(1,ang);shake=5;}
  if(e.parts.wings&&e.phase>=2&&e.timer%600===0)e.fly=150;
}
function breath(e,ang,n){const col=DRAGONS[e.dk].breath;for(let i=0;i<n;i++){const a=ang+(i-(n-1)/2)*0.12;
  projectiles.push({x:e.x+e.w/2,y:e.y+e.h/2,vx:Math.cos(a)*2.4,vy:Math.sin(a)*2.4,life:80,r:3,dmg:1,col});}}
// overhead flying dragons (ambient)
let flyers=[];
function maybeFlyer(){if(flyers.length||Math.random()>0.0015)return;const k=pick(Object.keys(DRAGONS));const a=Math.random()*7;
  flyers.push({k,x:hero.x-Math.cos(a)*500,y:hero.y-Math.sin(a)*400,vx:Math.cos(a)*1.8,vy:Math.sin(a)*1.4,life:600});}
// ===== WORLD STATE / SIMULATION =====
const ITEMS={bread:{n:"Bread",p:4,food:40},meat:{n:"Raw Meat",p:5,food:25},fish:{n:"Fish",p:6,food:30},berry:{n:"Berries",p:2,food:10},herb:{n:"Herb",p:4},
 pelt:{n:"Pelt",p:8},trinket:{n:"Goblin Trinket",p:6},horn:{n:"Horn",p:10},gem:{n:"Gem",p:30},pearl:{n:"Pearl",p:25},scale:{n:"Dragon Scale",p:120},
 potion:{n:"Potion",p:15},flowers:{n:"Bouquet",p:8,gift:2},ring:{n:"Engagement Ring",p:120},amulet:{n:"Lost Amulet",p:0},pie:{n:"Berry Pie",p:12,food:60,gift:2},wood:{n:"Wood",p:3},axe:{n:"Axe",p:40}};
const SHOP_ITEMS=["bread","potion","flowers","pie","ring","axe"];
const NAMES=["Ada","Bram","Cora","Dain","Elsa","Finn","Greta","Hugo","Iris","Joss","Kira","Lio","Mara","Nils","Opal","Pip","Quinn","Rhea","Sol","Tova","Ulf","Vera","Wren","Yara","Zed","Brin","Cass","Dex","Edda","Fen","Gale","Hal","Ivo","Juna","Kai","Lark","Moss","Nell","Oren","Poppy"];
const ROLES_T=["leader","innkeeper","shopkeeper","guard","smith","fisher","farmer","child","receptionist"];
const ROLES_V=["leader","innkeeper","shopkeeper","farmer","farmer","child"];
const LEADER={town:"Mayor",village:"Elder","harbor town":"Harbormaster","island village":"Chief"};
const RANKS=["Wanderer","Citizen","Landowner","Knight","Lord","Champion","King"];
let world, P, npcs=[], nextNpc=1;
function newWorld(){
  world={trees:{},placed:[],day:0,min:8*60,weather:"clear",wUntil:240,news:[],regions:[],events:[],wrecks:[],caravans:[],bandits:[],beasts:[],migr:[],opened:{},harvested:{},nextJobId:1,
    sets:SETS.map(s=>({id:s.id,price:1,stock:{bread:10,potion:4,flowers:5,pie:3,ring:1,axe:2},crop:0,festival:0,merchant:0,raid:null,dmgLog:0,jobs:[],safety:1})),
    bld:buildings.map(b=>({dmg:0,burn:0})),castle:false,dragonsSlain:0};
  for(let i=0;i<120;i++)world.regions.push(0.6+Math.random()*0.5);
  P={gear:{sword:0,armor:0},best:{},gold:20,inv:{bread:2},hunger:80,house:-1,rent:-1,rentUntil:-1,spouse:0,dating:[],ach:{},rank:0,king:false,dec:{tax:0,patrol:0},isles:[],found:[],jobs:[],
    respawn:{x:SETS[0].x*TILE,y:(SETS[0].y+2)*TILE},boat:{owned:false,x:0,y:0},boarded:false,raidsDefended:0,beastsSlain:0,dungeon:false,kills:0,crowned:false};
  npcs=[];nextNpc=1;
  for(const s of SETS){const roles=s.kind.includes("town")?ROLES_T:ROLES_V;roles.forEach((r,i)=>makeNpc(s.id,r));
    const houses=s.bIdx.filter(b=>buildings[b].kind==="house");houses.forEach((h,i)=>{const n=makeNpc(s.id,pick(s.kind.includes("town")?["guard","smith","fisher","farmer","child","farmer"]:["farmer","fisher","child","farmer"]));n.home=h;const d=doorOf(buildings[h]);n.x=d.x;n.y=d.y;if(i%3===0){const m=makeNpc(s.id,"farmer");m.home=h;m.x=d.x;m.y=d.y;}});}
  initAdvs();
  for(const a of npcs)for(const b of npcs)if(a!==b&&a.s===b.s)a.rel[b.id]=Math.floor(Math.random()*50);
  addNews(-1,"Welcome to the Realm of Ten Winds. Live as you like.");
}
function makeNpc(sid,role,age){
  const s=SETS[sid];const houses=s.bIdx.filter(b=>buildings[b].kind==="house");
  const n={id:nextNpc++,name:pick(NAMES),s:sid,role,age:age!=null?age:role==="child"?6+Math.floor(Math.random()*9):19+Math.floor(Math.random()*50),
    home:houses.length?houses[npcs.length%houses.length]:s.bIdx[0],friend:0,met:false,last:-1,rel:{},spouse:0,partner:0,look:Math.floor(Math.random()*1e6),alive:true,x:0,y:0,dir:0,frame:0,anim:0,inside:false,gift:-1};
  if(role==="innkeeper")n.work=s.bIdx.find(b=>buildings[b].kind==="inn");
  else if(role==="shopkeeper")n.work=s.bIdx.find(b=>buildings[b].kind==="shop");
  else if(role==="receptionist"){n.work=s.bIdx.find(b=>buildings[b].kind==="guild");n.age=Math.max(n.age,20);}
  const d=doorOf(buildings[n.home]);n.x=d.x;n.y=d.y;npcs.push(n);return n;
}
const doorOf=b=>({x:(b.x+1.6)*TILE,y:(b.y+b.h)*TILE+3});
const title=n=>n.role==="leader"?LEADER[SETS[n.s].kind]+" ":n.role==="receptionist"?"Guild Receptionist ":"";
function addNews(sid,t){world.news.unshift({d:world.day,s:sid,t});if(world.news.length>40)world.news.pop();}
function absMin(){return world.day*1440+world.min;}
const season=()=>Math.floor(world.day/7)%4;
const hour=()=>Math.floor(world.min/60);
function regionOf(px,py){return clamp(Math.floor(py/TILE/32),0,8)*12+clamp(Math.floor(px/TILE/32),0,11);}
// ---- clock ----
let simAcc=0;
function advanceMinutes(m){for(let i=0;i<m;i++){world.min++;if(world.min>=1440){world.min=0;world.day++;dailyTick();}if(world.min%60===0)hourlyTick();
  P.hunger=Math.max(0,P.hunger-0.07);}}
function hourlyTick(){
  if(absMin()>=world.wUntil){const w={0:["clear","clear","rain","fog"],1:["clear","clear","clear","storm","rain"],2:["rain","fog","clear","clear","storm"],3:["snow","snow","clear","fog"]}[season()];
    world.weather=pick(w);world.wUntil=absMin()+180+Math.floor(Math.random()*300);}
  if(P.hunger<=0&&hero&&!hero.dead){hero.hp=Math.max(1,hero.hp-1);updateHearts();toast("You are starving! Eat something (E).");}
  for(const s of world.sets){
    if(s.raid&&absMin()>=s.raid.until)endRaid(s,false);
    if(s.festival&&absMin()>=s.festival){s.festival=0;}
    if(s.merchant&&absMin()>=s.merchant)s.merchant=0;
  }
  world.bld.forEach((b,i)=>{if(b.burn>0){b.burn--;b.dmg=Math.min(1,b.dmg+0.03);}});
  // caravans move
  for(const c of world.caravans){c.t+=1/c.hours;if(c.t>=1){c.done=true;const s=world.sets[c.to];s.price=Math.max(0.6,s.price-0.12);for(const k in s.stock)s.stock[k]+=3;
    addNews(c.to,`A caravan from ${SETS[c.from].name} arrived in ${SETS[c.to].name}. Prices dropped!`);}}
  world.caravans=world.caravans.filter(c=>!c.done);
  world.bandits=world.bandits.filter(b=>absMin()<b.until&&b.n>0);world.beasts=world.beasts.filter(b=>absMin()<b.until&&!b.dead);world.migr=world.migr.filter(m=>absMin()<m.until);
  // random events, independent of the player
  advHourly();wallHourly();
  const chance=0.09+(P.king&&P.dec.festival?0.02:0);
  if(Math.random()<chance)forceEvent();
}
function dailyTick(){
  const se=season();
  for(const s of world.sets){
    for(const k of SHOP_ITEMS){s.stock[k]=Math.min(k==="ring"||k==="axe"?2:12,(s.stock[k]||0)+(k==="ring"||k==="axe"?1:2));}
    s.price=clamp(s.price+(1-s.price)*0.2+(Math.random()-0.5)*0.14,0.6,1.8);s.demand={};for(const k of ["fang","claw","horn","hide","scale","wing","tail","eye","core","dscale","dhorn","dheart"])s.demand[k]=+(0.7+Math.random()*0.7).toFixed(2);
    if(se<2&&s.crop<4)s.crop++;
    if(se===2&&s.crop>=3){s.crop=0;s.stock.bread+=8;addNews(s.id,`${SETS[s.id].name} brought in the harvest. Bread is plentiful.`);}
    if(se===3)s.crop=0;
    if(s.festival===0&&Math.random()<0.04)startFestival(s.id);
  }
  world.bld.forEach(b=>{if(b.burn<=0&&b.dmg>0)b.dmg=Math.max(0,b.dmg-0.15);});regrowTrees();
  world.regions=world.regions.map(p=>clamp(p+(1-p)*0.1+(Math.random()-0.5)*0.16-(se===3?0.05:0)-(P.dec.patrol?0.06:0),0.15,1.6));
  // NPC life
  for(const n of npcs){if(!n.alive)continue;
    if(world.day%28===0)n.age++;
    for(const id in n.rel){n.rel[id]=clamp(n.rel[id]+(Math.random()-0.45)*6,0,100);}
    if(n.partner&&!n.spouse&&Math.random()<0.15){const m=npcs.find(x=>x.id===n.partner);if(m&&m.alive&&!m.spouse)npcWedding(n,m);}
  }
  for(const n of npcs.filter(n=>n.alive&&n.age>=18&&!n.partner&&!n.spouse&&n.id!==P.spouse&&!P.dating.includes(n.id))){
    const best=Object.entries(n.rel).map(([id,v])=>[npcs.find(x=>x.id==id),v]).filter(([m,v])=>m&&m.alive&&m.age>=18&&!m.partner&&!m.spouse&&m.id!==P.spouse&&v>75)[0];
    if(best&&Math.random()<0.3){n.partner=best[0].id;best[0].partner=n.id;addNews(n.s,`${n.name} and ${best[0].name} of ${SETS[n.s].name} have started courting.`);}
  }
  // taxes
  if(P.king&&P.dec.tax){const inc=P.dec.tax*25;P.gold+=inc;toast(`Royal taxes collected: +${inc}g`);for(const n of npcs)n.friend=Math.max(0,n.friend-P.dec.tax);}
  if(P.rent>=0&&world.day>P.rentUntil){P.rent=-1;toast("Your house rental has ended.");}
  for(const s of world.sets)genJobs(s);advDaily();wallDaily();
  checkRank();
  saveGame();
}
// ---- events ----
const EVENT_TYPES=["raid","merchant","caravan","festival","storm","fire","bandits","beast","shipwreck","migration","wedding","birth","death","move","dragon"];
function forceEvent(type,sid){
  type=type||pick(EVENT_TYPES);if(sid==null)sid=Math.floor(Math.random()*SETS.length);
  const S=SETS[sid],ws=world.sets[sid];let ev={type,s:sid,day:world.day};
  const bl=S.bIdx;
  switch(type){
  case "raid":{const d=P.dec.patrol?0.6:1;ws.raid={until:absMin()+360,spawned:false,n:Math.round(5*d)};const b=pick(bl);world.bld[b].dmg=Math.min(1,world.bld[b].dmg+0.25);ws.price=Math.min(1.8,ws.price+0.2);
    addNews(sid,`Monster raiders attack ${S.name}! The townsfolk beg for help.`);break;}
  case "merchant":ws.merchant=absMin()+600;addNews(sid,`A traveling merchant set up a stall in ${S.name} with rare goods.`);break;
  case "caravan":{let to=sid;while(to===sid||SETS[to].island)to=Math.floor(Math.random()*5);if(S.island)sid=ev.s=1;
    world.caravans.push({from:ev.s,to,t:0,hours:8});addNews(ev.s,`A caravan departs ${SETS[ev.s].name} bound for ${SETS[to].name}.`);break;}
  case "festival":startFestival(sid);break;
  case "storm":world.weather="storm";world.wUntil=absMin()+360;if(Math.random()<0.5){const b=pick(bl);world.bld[b].dmg=Math.min(1,world.bld[b].dmg+0.2);}
    addNews(-1,"A great storm rolls in from the sea. Swimmers beware!");break;
  case "fire":{const b=pick(bl);world.bld[b].burn=4;world.bld[b].dmg=Math.min(1,world.bld[b].dmg+0.35);ev.b=b;addNews(sid,`Fire! A ${buildings[b].kind} in ${S.name} is burning.`);break;}
  case "bandits":{const tx=Math.round((S.x+SETS[0].x)/2),ty=Math.round((S.y+SETS[0].y)/2);world.bandits.push({x:tx*TILE,y:ty*TILE,n:4,until:absMin()+1440,spawned:false});
    world.regions[regionOf(tx*TILE,ty*TILE)]+=0.2;addNews(sid,`Bandits were spotted on the road near ${S.name}.`);break;}
  case "beast":{const sp=pick(["treant","seaserpent","kingslime","cyclops","archfiend"]);const p=findTile(sp==="seaserpent"?[SAND,SHAL]:[FOREST,GRASS],S.x,S.y,30);
    world.beasts.push({sp,x:p.x,y:p.y,until:absMin()+2880,spawned:false,dead:false});addNews(sid,`A rare ${sp} was sighted near ${S.name}!`);break;}
  case "shipwreck":{const p=findTile([SAND],S.x,S.y,40);world.wrecks.push({x:p.x,y:p.y,looted:false,id:"w"+absMin()});addNews(sid,`A ship ran aground near ${S.name}. Loot may wash ashore.`);break;}
  case "migration":{const p=findTile([GRASS],S.x,S.y,30);world.migr.push({x:p.x,y:p.y,sp:pick(["meadowslime","slime"]),until:absMin()+720,spawned:false});
    world.regions[regionOf(p.x,p.y)]+=0.3;addNews(sid,`Great herds are migrating through the plains near ${S.name}.`);break;}
  case "wedding":{const c=npcs.filter(n=>n.alive&&n.s===sid&&n.age>=18&&!n.spouse&&n.id!==P.spouse&&!P.dating.includes(n.id));
    if(c.length>=2){const a=c.find(n=>n.partner)||c[0];const b=npcs.find(x=>x.id===a.partner)||c.find(x=>x!==a);npcWedding(a,b);}else ev.type="festival",startFestival(sid);break;}
  case "birth":{const m=npcs.find(n=>n.alive&&n.spouse&&n.s===sid)||npcs.find(n=>n.alive&&n.spouse);if(m){const b=makeNpc(m.s,"child",0);b.name=pick(NAMES);addNews(m.s,`${m.name} welcomed a baby, little ${b.name}!`);}
    else addNews(sid,`A litter of fluffins was born near ${S.name}.`);break;}
  case "death":{const o=npcs.filter(n=>n.alive&&n.age>55&&n.role!=="leader"&&n.id!==P.spouse);if(o.length){const n=pick(o);n.alive=false;addNews(n.s,`${n.name} of ${SETS[n.s].name} passed away peacefully at ${n.age}. They will be missed.`);}
    else addNews(sid,"The elders of "+S.name+" are in good health.");break;}
  case "move":{const c=npcs.filter(n=>n.alive&&n.role==="farmer"&&!n.spouse&&n.id!==P.spouse);if(c.length){const n=pick(c);const old=n.s;let to=old;while(to===old)to=Math.floor(Math.random()*SETS.length);
    n.s=to;const hs=SETS[to].bIdx.filter(b=>buildings[b].kind==="house");n.home=pick(hs);const d=doorOf(buildings[n.home]);n.x=d.x;n.y=d.y;
    addNews(to,`${n.name} moved from ${SETS[old].name} to ${SETS[to].name}.`);}break;}
  case "dragon":{const k=pick(Object.keys(DRAGONS));ws.dragon={k,until:absMin()+480,spawned:false};const b=pick(bl);world.bld[b].burn=3;world.bld[b].dmg=Math.min(1,world.bld[b].dmg+0.4);
    addNews(sid,`DRAGON ATTACK! ${DRAGONS[k].name} is ravaging ${S.name}!`);toast(`⚠ ${DRAGONS[k].name} attacks ${S.name}!`);break;}
  }
  world.events.unshift(ev);if(world.events.length>30)world.events.pop();
  return ev;
}
function startFestival(sid){world.sets[sid].festival=absMin()+720;addNews(sid,`${SETS[sid].name} is holding a festival today! Food is cheap and spirits are high.`);}
function npcWedding(a,b){a.spouse=b.id;b.spouse=a.id;a.partner=b.id;b.partner=a.id;if(b.s!==a.s){b.s=a.s;}b.home=a.home;addNews(a.s,`${a.name} and ${b.name} were married in ${SETS[a.s].name}! Everyone celebrated.`);
  if(!world.sets[a.s].festival)world.sets[a.s].festival=absMin()+300;}
function endRaid(s,defended){const S=SETS[s.id];
  if(defended){P.raidsDefended++;guildProgress("raid",s.id);setTimeout(()=>heroicDeed(s.id,"raid"),0);P.gold+=40;for(const n of npcs)if(n.s===s.id)n.friend=Math.min(100,n.friend+8);addNews(s.id,`A brave wanderer drove off the raiders at ${S.name}!`);toast("Raid defended! +40g, the town is grateful.");}
  else{for(let k=0;k<2;k++){const b=pick(S.bIdx);world.bld[b].dmg=Math.min(1,world.bld[b].dmg+0.3);}addNews(s.id,`Raiders sacked parts of ${S.name}. Repairs have begun.`);}
  s.raid=null;mobs=mobs.filter(m=>m.raidOf!==s.id);checkRank();}
function findTile(types,cx,cy,r){for(let k=0;k<400;k++){const x=cx+Math.floor((Math.random()-0.5)*2*r),y=cy+Math.floor((Math.random()-0.5)*2*r);
  if(types.includes(tAt(x,y))&&!OCC[y*WW+x]&&!settlementAt(x*TILE,y*TILE))return{x:x*TILE,y:y*TILE};}return{x:cx*TILE,y:(cy+cy%3+8)*TILE};}
// ---- jobs (optional side work) ----
function genJobs(s){s.jobs=s.jobs.filter(j=>!j.taken);while(s.jobs.length<2){const t=pick(["gather","hunt","fish","deliver"]);const id=world.nextJobId++;
  if(t==="gather"){const it=pick(["herb","berry","wood","wood","fang","hide","claw","eye","core"]);s.jobs.push({id,t,item:it,n:it==="wood"?5:3,reward:it==="wood"?30:20,s:s.id,text:it==="wood"?"Builders need 5 ":ITEMS[it].part?"Alchemist wants 3 ":"Gather 3 "});}
  else if(t==="fish")s.jobs.push({id,t,item:"fish",n:2,reward:22,s:s.id,text:"Bring 2 "});
  else if(t==="hunt")s.jobs.push({id,t,n:4,have:0,reward:35,s:s.id,text:"Cull 4 monsters around "+SETS[s.id].name});
  else{let to=s.id;while(to===s.id)to=Math.floor(Math.random()*5);s.jobs.push({id,t,to,reward:30,s:s.id,text:"Deliver a parcel to "+SETS[to].name});}}}
function jobText(j){return j.t==="gather"||j.t==="fish"?j.text+ITEMS[j.item].n:j.text;}
function takeJob(j){if(P.jobs.length>=3){toast("You can hold 3 jobs at once.");return;}j.taken=true;P.jobs.push(j);toast("Job accepted: "+jobText(j));}
function tryCompleteJobs(sid){let done=0;for(const j of P.jobs.slice()){let ok=false;
  if((j.t==="gather"||j.t==="fish")&&j.s===sid&&have(j.item)>=j.n){for(let i=0;i<j.n;i++){if((P.inv[j.item]||0)>0)P.inv[j.item]--;else P.inv[j.item+"+"]--;}ok=true;}
  if(j.t==="hunt"&&j.s===sid&&j.have>=j.n)ok=true;if(j.t==="deliver"&&j.to===sid)ok=true;
  if(ok){P.gold+=j.reward;P.jobs.splice(P.jobs.indexOf(j),1);done++;toast(`Job done! +${j.reward}g`);for(const n of npcs)if(n.s===j.s)n.friend=Math.min(100,n.friend+2);}}
  return done;}
// ---- ranks / achievements ----
function achievements(){
  const lead=npcs.filter(n=>n.role==="leader"&&n.alive);
  const towns=SETS.filter(s=>{const ns=npcs.filter(n=>n.s===s.id&&n.alive);return ns.length&&ns.reduce((a,n)=>a+n.friend,0)/ns.length>=25;}).length;
  return[
   {k:"wealth",n:"Wealth: hold 500 gold",ok:P.gold>=500},
   {k:"home",n:"Property: own a house",ok:P.house>=0},
   {k:"friends",n:"Friendship: 3 friends (40+)",ok:npcs.filter(n=>n.friend>=40).length>=3},
   {k:"rep",n:"Reputation: liked in 3 settlements",ok:towns>=3},
   {k:"raid",n:"Defend a settlement from raiders",ok:P.raidsDefended>0},
   {k:"dungeon",n:"Clear the Stormcrag dungeon",ok:P.dungeon},
   {k:"beast",n:"Slay a rare beast",ok:P.beastsSlain>0},
   {k:"isles",n:"Discover all 3 islands",ok:P.isles.length>=3},
   {k:"dragon",n:"Slay a dragon",ok:world.dragonsSlain>0},
   {k:"leaders",n:"Win support of 4 town leaders (60+)",ok:lead.filter(n=>n.friend>=60).length>=4},
   {k:"hero",n:"Earn a heroic title or reach guild rank B",ok:(P.titles||[]).length>0||(P.guild&&P.guild.rank>=4)},
  ];
}
function checkRank(){const a={};for(const x of achievements())a[x.k]=x.ok;
  let r=0;if(a.home||P.rent>=0||a.friends)r=1;if(r>=1&&a.home)r=2;if(r>=2&&(a.raid||a.beast))r=3;if(r>=3&&a.wealth&&(a.rep||a.estates))r=4;if(r>=1&&a.estates&&r<2)r=2;if(r>=4&&a.dragon&&a.dungeon)r=5;
  if(r>=5&&a.isles&&a.leaders)r=P.crowned?6:5;if(P.crowned)r=6;
  if(r>P.rank){P.rank=r;SFX.chime();if(P.mag)P.mag.max=100+r*15;toast("New rank: "+RANKS[r]+"!");addNews(-1,`The realm whispers of a new ${RANKS[r]}.`);}
  P.canCrown=!P.crowned&&a.hero&&a.home&&a.raid&&a.beast&&a.wealth&&a.rep&&a.dragon&&a.dungeon&&a.isles&&a.leaders;
  if(P.mag)unlockSpells();return P.rank;}
function coronation(){P.crowned=true;P.king=true;P.rank=6;world.castle=true;unlockSpells();for(const s of world.sets)s.festival=absMin()+1440;
  addNews(-1,"Old King Aldric named the summoned hero his successor. Long live the new King!");fadeBlack("King Aldric places the crown upon your head... Long live the King!",()=>toast("You are now King! Issue decrees from your castle."));saveGame();}
function decree(k){if(k==="tax")P.dec.tax=(P.dec.tax+1)%3;if(k==="patrol")P.dec.patrol=P.dec.patrol?0:1;
  if(k==="festival"){if(P.gold<100)return toast("A royal festival costs 100g.");P.gold-=100;for(const s of world.sets)startFestival(s.id);for(const n of npcs)n.friend=Math.min(100,n.friend+5);}
  addNews(-1,`Royal decree: ${k==="tax"?"taxes set to "+["none","fair","heavy"][P.dec.tax]:k==="patrol"?"patrols "+(P.dec.patrol?"ordered":"recalled"):"a realm-wide festival!"}`);}
// ---- romance (adults only; fade to black) ----
function canRomance(n){return n.alive&&n.age>=18&&n.role!=="child";}
function giveGift(n,item){if(!(P.inv[item]>0))return false;P.inv[item]--;const g=ITEMS[item].gift||1;n.friend=Math.min(100,n.friend+(item==="ring"?0:4*g+ (item===n.fav?6:0)));n.gift=world.day;return true;}
function askDate(n){if(!canRomance(n))return"They smile politely. \"I'm not interested in that.\"";
  if(n.spouse&&n.spouse!==-1)return`"I'm married to ${(npcs.find(x=>x.id===n.spouse)||{}).name||"someone"}, you know."`;
  if(n.friend<60)return`"Maybe once we know each other better."`;
  if(!P.dating.includes(n.id)){P.dating.push(n.id);if(n.partner){const m=npcs.find(x=>x.id===n.partner);if(m)m.partner=0;n.partner=0;}}
  n.friend=Math.min(100,n.friend+6);advanceMinutes(120);return`You spend a lovely evening walking together under the lanterns. ${n.name} is now dating you.`;}
function propose(n){if(!P.dating.includes(n.id))return`"Propose? We aren't even dating!"`;if(n.friend<90)return`"I... I need more time."`;
  if(!(P.inv.ring>0))return"You need an Engagement Ring (sold in shops).";if(P.spouse)return"You are already married.";
  P.inv.ring--;P.spouse=n.id;n.spouse=-1;n.partner=0;P.dating=P.dating.filter(i=>i!==n.id);if(P.house>=0)n.home=P.house;
  addNews(n.s,`The wanderer and ${n.name} were wed in ${SETS[n.s].name}! A festival follows.`);startFestival(n.s);checkRank();saveGame();return`"Yes! A thousand times yes!" You and ${n.name} are married.${P.house>=0?" They move into your home.":""}`;}
// ---- save/load ----
const SAVEKEY="realmTenWindsSave3";
function saveGame(){if(!hero||!world)return;try{
  const data={v:1,world,P,nextNpc,hero:{x:room?room.out.x:hero.x,y:room?room.out.y:hero.y,hp:hero.hp,maxHp:hero.maxHp},waystones:waystones.map(w=>w.found),
    npcs:npcs.map(n=>{const o={...n};delete o.inside;return o;}),T:Array.from(harvestedList())};
  localStorage.setItem(SAVEKEY,JSON.stringify(data));}catch(e){console.warn(e);}}
function harvestedList(){return Object.keys(world.harvested).map(Number);}
function loadGame(){const raw=localStorage.getItem(SAVEKEY);if(!raw)return false;try{const d=JSON.parse(raw);
  world=d.world;P=d.P;nextNpc=d.nextNpc;npcs=d.npcs;resetHero();Object.assign(hero,d.hero);d.waystones.forEach((f,i)=>{if(waystones[i])waystones[i].found=f;});
  for(const k of Object.keys(world.harvested)){const i=+k;T[i]=world.harvested[k].r;}
  applyWalls();if(!world.trees)world.trees={};if(!world.placed)world.placed=[];applyTrees();magicInit();return true;}catch(e){console.warn(e);return false;}}
let castleObj=null;
function placeCastle(){if(castleObj)return;const cx=SETS[0].x-3,cy=SETS[0].y-SETS[0].r+2;castleObj={x:cx,y:cy,w:6,h:3};
  for(let y=cy-1;y<cy+5;y++)for(let x=cx-1;x<cx+7;x++){T[y*WW+x]=COBBLE;invalidateTile(x,y);}
  for(let y=cy;y<cy+3;y++)for(let x=cx;x<cx+6;x++)OCC[y*WW+x]=-2;
  for(let y=cy+3;y<SETS[0].y;y++){if(!OCC[y*WW+SETS[0].x]){T[y*WW+SETS[0].x]=COBBLE;invalidateTile(SETS[0].x,y);}}}
// ===== HERO =====

function resetHero(){hero={x:SETS[0].x*TILE,y:(SETS[0].y+2)*TILE,w:12,h:12,vx:0,vy:0,dir:0,frame:0,anim:0,hp:6,maxHp:6,swinging:-1,swingT:0,iframes:0,knockT:0,knockVx:0,knockVy:0,dodgeT:0,dodgeCd:0,dead:false,stam:100,boat:false,shore:{x:0,y:0}};
  hero.shore={x:hero.x,y:hero.y};}
let atkPressed=false,dodgePressed=false,camX=0,camY=0,frameN=0,banner=null,curSet=null,paused=false;
function getMoveInput(){let mx=0,my=0;if(keys.ArrowLeft||keys.KeyA)mx-=1;if(keys.ArrowRight||keys.KeyD)mx+=1;if(keys.ArrowUp||keys.KeyW)my-=1;if(keys.ArrowDown||keys.KeyS)my+=1;
  if(touch.active){const l=Math.hypot(touch.dx,touch.dy);if(l>6){const mg=Math.min(1,0.25+(l-6)/36);mx+=touch.dx/l*mg;my+=touch.dy/l*mg;}}const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l;}return{mx,my};}
function wantAttack(){const k=keys.KeyJ||keys.Space||touch.a||latch.KeyJ||latch.Space;latch.KeyJ=latch.Space=false;if(k&&!atkPressed){atkPressed=true;return true;}if(!k)atkPressed=false;return false;}
function wantDodge(){const k=keys.KeyK||touch.b||latch.KeyK;latch.KeyK=false;if(k&&!dodgePressed){dodgePressed=true;return true;}if(!k)dodgePressed=false;return false;}
function hurtHero(dmg,ang){if(hero.iframes>0||hero.dodgeT>0||hero.dead)return;SFX.hurt();hero.hp-=dmg;hero.iframes=40;hero.knockT=10;hero.knockVx=Math.cos(ang)*3;hero.knockVy=Math.sin(ang)*3;shake=6;
  spray(hero.x+6,hero.y+6,bloodOn?6:4,ang,1);updateHearts();if(hero.hp<=0){hero.dead=true;hero.hp=0;setTimeout(respawn,900);}}
function respawn(){const lost=Math.floor(P.gold*0.1);P.gold-=lost;hero.dead=false;hero.hp=hero.maxHp;hero.boat=false;P.boarded=false;hero.x=P.respawn.x;hero.y=P.respawn.y;hero.iframes=90;hero.stam=100;
  updateHearts();toast(`You wake up safely. Lost ${lost}g.`);}
const heroTile=()=>({tx:Math.floor((hero.x+6)/TILE),ty:Math.floor((hero.y+8)/TILE)});
function facingPoint(d){const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];return{x:hero.x+6+dx*d,y:hero.y+6+dy*d};}
function updateHero(){
  if(hero.dead)return;if(room)return roomUpdate();
  if(hero.iframes>0)hero.iframes--;if(hero.dodgeCd>0)hero.dodgeCd--;
  const {tx,ty}=heroTile();const t=tAt(tx,ty);const swim=!hero.boat&&t===DEEP;hero.swim=swim;
  if(hero.knockT>0){moveEntity(hero,hero.knockVx,hero.knockVy);hero.knockVx*=.8;hero.knockVy*=.8;hero.knockT--;return;}
  if(hero.dodgeT>0){const f=0.35+0.9*(hero.dodgeT/(hero.dodgeMax||12));slideMove(hero,hero.knockVx*f,hero.knockVy*f);hero.dodgeT--;hero.vx=hero.knockVx*f*.5;hero.vy=hero.knockVy*f*.5;if(hero.atkBuf>0)hero.atkBuf--;return;}
  if(hero.atkBuf>0)hero.atkBuf--;if(hero.comboT>0)hero.comboT--;else hero.combo=0;
  if(hero.swinging>=0){hero.swingT++;if(hero.swingT%3===0)hero.swinging++;if(hero.swinging>4){hero.swinging=-1;hero.swingT=0;
      if(hero.atkBuf>0&&hero.combo<2){hero.atkBuf=0;hero.combo++;hero.comboT=30;hero.swinging=0;hero.swingT=0;hero.hitSet=new Set();SFX.swing();const d=[[0,1],[-1,0],[1,0],[0,-1]][hero.dir];if(hero.combo===2){hero.vx=d[0]*2.2;hero.vy=d[1]*2.2;}}else{hero.comboT=hero.combo<2?18:0;if(hero.combo>=2)hero.combo=0;}}
    else{if(hero.swinging===1&&hero.swingT===3)chopCheck();const hb=swordHitbox();if(hb)for(const e of mobs){if(e.dead||e.iframes>0)continue;if(aabb(hb,e)){const fin=hero.combo===2;if(e.sp==="dragon")hitDragon(e,hb.ang);else{hurtEnemy(e,swordDmg()+(fin?1:0),hb.ang,true);if(fin){e.knockVx*=1.6;e.knockVy*=1.6;}}hitStop=fin?6:3;shake=fin?3:1.5;}}}}
  // swimming stamina
  if(swim){hero.stam-=world.weather==="storm"?0.2:0.12;if(hero.stam<=0){hero.stam=100;hero.iframes=0;hurtHero(1,0);hero.knockT=0;if(!hero.dead){hero.x=hero.shore.x;hero.y=hero.shore.y;toast("Exhausted! You wash up on shore.");}return;}}
  else if(t!==CLIFF){hero.stam=Math.min(100,hero.stam+0.8);if(!hero.boat&&!isWater(t)&&t!==PIER){hero.shore.x=hero.x;hero.shore.y=hero.y;}}
  const {mx,my}=getMoveInput();
  if(!swim&&!hero.boat&&wantDodge()&&hero.dodgeCd<=0&&hero.swinging<0){const dx=mx||[0,-1,1,0][hero.dir],dy=my||[1,0,0,-1][hero.dir],l=Math.hypot(dx,dy)||1;
    hero.dodgeT=14;hero.dodgeMax=14;hero.dodgeCd=34;hero.iframes=Math.max(hero.iframes,16);hero.knockVx=dx/l*3;hero.knockVy=dy/l*3;hero.rollDir=dx<0?-1:1;
    for(let i=0;i<5;i++)particles.push({x:hero.x+6,y:hero.y+10,z:0,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,vz:.5,life:15,max:15,col:C.dust,size:2,kind:"spark"});return;}
  if(wantAttack()){if(hero.swinging<0){if(!interact()&&!swim&&!hero.boat){if(hero.comboT>0&&hero.combo<2)hero.combo++;else hero.combo=0;hero.comboT=30;hero.swinging=0;hero.swingT=0;SFX.swing();}}else hero.atkBuf=12;}
  let spd=hero.boat?(P.boat.raft?1.6:2.3):swim?0.75:(t===ROAD||t===COBBLE||t===STAIRS?1.35:1.15);if(P.gear&&P.gear.swift&&!hero.boat)spd*=1.12;
  if(t===CLIFF&&!hero.boat){if(my<0){spd=0.45;hero.stam-=0.35;hero.climb=true;if(hero.stam<=0){hero.stam=0;hero.knockT=14;hero.knockVx=0;hero.knockVy=2.2;hero.jumpT=14;toast("You lose your grip and slide down!");return;}}
    else if(my>0){spd=2.2;if(!hero.jumpT){hero.jumpT=16;}}}else hero.climb=false;
  if(hero.jumpT>0)hero.jumpT--;
  {const tvx=mx*spd,tvy=my*spd,k=(mx||my)?(hero.boat?0.08:0.25):(hero.boat?0.04:0.3);hero.vx=(hero.vx||0)+(tvx-(hero.vx||0))*k;hero.vy=(hero.vy||0)+(tvy-(hero.vy||0))*k;
    if(Math.abs(hero.vx)<0.02)hero.vx=0;if(Math.abs(hero.vy)<0.02)hero.vy=0;const vx=hero.vx,vy=hero.vy,moving=Math.hypot(vx,vy)>0.12;
    if(vx||vy){if(hero.boat){const nx=hero.x+vx,ny=hero.y+vy;const sx=Math.sign(vx),sy=Math.sign(vy);const ntx=Math.floor((nx+6+sx*6)/TILE),nty=Math.floor((ny+8+sy*6)/TILE);const nt=tAt(ntx,nty);
        if((mx||my)&&!isWater(nt)&&!solidTile(ntx,nty)){disembark(ntx,nty);hero.vx=hero.vy=0;}else moveEntity(hero,vx,vy);P.boat.x=hero.x-8;P.boat.y=hero.y-6;}
      else slideMove(hero,vx,vy);}
    if(moving){hero.anim++;if(hero.anim%6===0){hero.frame^=1;if(hero.frame){if(hero.boat){if(hero.anim%24===0)SFX.boat();}else if(swim)SFX.swim();else SFX.step(t);}}}
    if(mx||my){if(Math.abs(mx)>Math.abs(my))hero.dir=mx<0?1:2;else hero.dir=my<0?3:0;}
    if(swim&&moving&&frameN%12===0)particles.push({x:hero.x+6,y:hero.y+10,z:0,vx:0,vy:0,vz:0,life:20,max:20,col:[220,240,255],size:2,kind:"spark"});}
  // cave / dungeon
  if(t===CAVE&&!hero.boat){if(tx<60){hero.x=CAVE_POS.x*TILE+2;hero.y=(CAVE_POS.y+1)*TILE+4;toast("You climb back out into the daylight.");}
    else{hero.x=(DUNGEON.x+2)*TILE+2;hero.y=(DUNGEON.y+DUNGEON.h-3)*TILE;toast("You descend into the Stormcrag depths...");enterDungeon();}}
  // isles discovered
  ISLES.forEach((I,i)=>{if(!P.isles.includes(i)&&Math.hypot(tx-I.x,ty-I.y)<I.r){P.isles.push(i);toast("Discovered "+I.name+"!");addNews(-1,"The wanderer set foot on "+I.name+".");checkRank();}});
}
function hitDragon(e,ang){if(e.iframes>0)return;e.hp-=e._spell?1:swordDmg();e._spell=0;e.iframes=12;e.flash=6;shake=4;spray(e.x+e.w/2,e.y+e.h/2,bloodOn?8:5,ang,1.5);addSplat(e.x+e.w/2,e.y+e.h/2);
  if(e.fly>0)return;const r=Math.random();const order=["wings","tail","horns"];for(const p of order)if(e.parts[p]&&r<0.18){severDragon(e,p,ang);break;}
  if(e.hp<=0){e.dead=true;e.flash=12;kills++;onKill(e);for(let i=0;i<20;i++)spray(e.x+e.w/2,e.y+e.h/2,2,Math.random()*7,1);}}
function disembark(tx,ty){hero.boat=false;P.boarded=false;hero.x=tx*TILE+2;hero.y=ty*TILE+2;toast("You step ashore. The boat waits here.");}
function board(){hero.boat=true;P.boarded=true;hero.x=P.boat.x+8;hero.y=P.boat.y+6;toast("All aboard! Sail the seas.");}
let dungeonSpawned=false;
function enterDungeon(){if(dungeonSpawned||P.dungeon)return;dungeonSpawned=true;const D=DUNGEON;
  for(let i=0;i<4;i++)spawnMob(["mummy","skeleton","heximp","evileye"][i],(D.x+8+i*4)*TILE,(D.y+8)*TILE,{persist:true,dun:true});
  spawnMob("demonlord",(D.x+22)*TILE,(D.y+5)*TILE,{persist:true,dun:true,dunBoss:true});}
function onKill(e){
  rigDeath(e,Math.atan2(e.y-hero.y,e.x-hero.x));
  const d=e.def||{};P.kills++;if(d.gold){const g=d.gold[0]+Math.floor(Math.random()*(d.gold[1]-d.gold[0]+1));P.gold+=g;floatText(e.x,e.y,"+"+g+"g","#ffe060");}
  killDrops(e);try{for(const j of guild().active)if(j.t==="huntsp"&&j.sp===e.sp)j.have=(j.have||0)+1;}catch(_){}partyShare(d.gold?d.gold[0]:0);
  if(e.stolen){if(e.stolen==="gold")P.gold+=e.stolenGold;else P.inv[e.stolen]=(P.inv[e.stolen]||0)+1;toast("You got your stolen goods back!");}
  if(e.chiefOf){world["camp_"+e.chiefOf]=world.day+7;guildProgress("camp");addNews(-1,"An orc warchief has fallen! The war camp is broken.");}
  const r=regionOf(e.x,e.y);world.regions[r]=Math.max(0.1,world.regions[r]-0.03);
  for(const j of P.jobs)if(j.t==="hunt"&&d.beh!=="pea"&&d.beh!=="flee"&&Math.hypot(e.x/TILE-SETS[j.s].x,e.y/TILE-SETS[j.s].y)<60)j.have=(j.have||0)+1;
  if(d.rare){P.beastsSlain++;addNews(-1,`The rare ${e.sp} has been slain!`);const b=world.beasts.find(b=>b.mob===e.uid);if(b)b.dead=true;}
  if(e.sp==="dragon"){world.dragonsSlain++;addNews(-1,`${e.name} the dragon has fallen! Bards are already singing.`);toast(`You slew ${e.name}!`);const L=LAIRS.find(l=>l.sp===e.dk);if(L)world["lair_"+L.sp]=world.day+14;
    for(const s of world.sets)if(s.dragon&&s.dragon.k===e.dk)s.dragon=null;guildProgress("dragon");if(e.town!=null){P.raidsDefended++;heroicDeed(e.town,"dragon");}}
  if(d.beh==="agg")guildProgress("hunt");
  if(e.dunBoss){P.dungeon=true;addNews(-1,"The Stormcrag dungeon has been cleared!");toast("Dungeon cleared!");}
  if(e.bandit){const b=world.bandits[e.bandit-1];if(b)b.n--;}
  if(e.raidOf!=null){const s=world.sets[e.raidOf];if(s.raid){s.raid.n--;if(s.raid.n<=0)endRaid(s,true);}}
  checkRank();
}
// ===== INTERACTION =====
function near(px,py,r){return Math.hypot(hero.x+6-px,hero.y+6-py)<r;}
function interact(){
  if(hero.boat)return false;
  if(P.boat.owned&&near(P.boat.x+14,P.boat.y+18,26)){board();return true;}
  for(const n of npcs)if(n.alive&&!n.inside&&near(n.x+6,n.y+6,20)){talk(n);return true;}
  for(const b of buildings){const d=doorOf(b);if(near(d.x+4,d.y-2,16)){if(b.kind==="harbor"||world.bld[b.id].dmg>0.05&&b.kind==="house")buildingMenu(b);else enterBuilding(b);return true;}}
  {const cf=campfireNear();if(cf){showMenu("Campfire","The fire crackles warmly.",[{l:"Rest by the fire (2h)",f:()=>fadeBlack("You rest by the fire...",()=>{advanceMinutes(120);hero.hp=Math.min(hero.maxHp,hero.hp+2);updateHearts();P.respawn={x:cf.x,y:cf.y+8};})},
    {l:"Cook meat",dis:!(P.inv.meat>0),f:()=>{P.inv.meat--;P.inv.pie=(P.inv.pie||0)+0;P.hunger=Math.min(100,P.hunger+45);hero.hp=Math.min(hero.maxHp,hero.hp+1);updateHearts();toast("A hearty roast!");}},{l:"Leave"}]);return true;}}
  if(castleObj&&near((castleObj.x+3)*TILE,(castleObj.y+3)*TILE,24)){enterBuilding({kind:"castle",id:-5,s:0});return true;}
  for(const w of waystones)if(near(w.x*TILE+8,w.y*TILE+8,22)){waystoneMenu(w);return true;}
  for(const o of objects){if(!near(o.x*TILE+8,o.y*TILE+8,22))continue;if(o.type==="board"){boardMenu(o.s);return true;}
    if(o.type==="lookout"){if(!P.looks)P.looks=[];const fresh=!P.looks.includes(o.id);if(fresh)P.looks.push(o.id);
      const ws=waystones.slice().sort((a,b)=>Math.hypot(a.x-o.x,a.y-o.y)-Math.hypot(b.x-o.x,b.y-o.y)).slice(0,2);ws.forEach(w=>w.found=true);
      toast(fresh?"From the peak you see for miles! Nearby waystones attuned.":"A breathtaking view.");if(fresh){P.gold+=15;}toggleMap();return true;}
    if(o.type==="chest"){if(world.opened[o.id])toast("Empty.");else{world.opened[o.id]=1;let s=[];for(const k in o.loot){if(k==="tome"){learnTome(o.loot[k]);s.push("a spell tome");continue;}if(k==="gold")P.gold+=o.loot[k];else P.inv[k]=(P.inv[k]||0)+o.loot[k];s.push(o.loot[k]+" "+(k==="gold"?"gold":ITEMS[k].n));}
      toast("Treasure! "+s.join(", "));saveGame();}return true;}}
  for(const w of world.wrecks)if(!w.looted&&near(w.x+20,w.y+10,30)){w.looted=true;P.gold+=35;P.inv.pearl=(P.inv.pearl||0)+1;P.inv.fish=(P.inv.fish||0)+2;toast("Salvaged the wreck: 35g, a pearl and fish.");return true;}
  for(const s of world.sets)for(const b of SETS[s.id].bIdx)if(world.bld[b].burn>0){const B=buildings[b];if(near((B.x+2)*TILE,(B.y+2)*TILE,40)){world.bld[b].burn=0;for(const n of npcs)if(n.s===s.id)n.friend=Math.min(100,n.friend+3);addNews(s.id,"The wanderer helped put out a fire in "+SETS[s.id].name+".");toast("You doused the fire! The townsfolk cheer.");return true;}}
  const f=facingPoint(14),ftx=Math.floor(f.x/TILE),fty=Math.floor(f.y/TILE),ft=tAt(ftx,fty);
  if((ft===BUSH||ft===FLOWER)&&!hero.swim){const i=fty*WW+ftx;const got=ft===BUSH?(season()<3?"berry":"herb"):"herb";P.inv[got]=(P.inv[got]||0)+(ft===BUSH?2:1);
    world.harvested[i]={o:ft,r:ft===BUSH?FOREST:GRASS,until:world.day+3};T[i]=ft===BUSH?FOREST:GRASS;invalidateTile(ftx,fty);floatText(hero.x,hero.y-6,"+"+ITEMS[got].n,"#cfc");return true;}
  if(isWater(ft)&&!hero.swim&&!mobs.some(m=>!m.dead&&m.def.beh==="agg"&&Math.hypot(m.x-hero.x,m.y-hero.y)<100)){startFishing();return true;}
  return false;
}
let fishing=null;
function startFishing(){fishing={t:0,bite:60+Math.floor(Math.random()*120),done:false};toast("You cast your line... press A when it bites!");}
function updateFishing(){if(!fishing)return;fishing.t++;const a=keys.KeyJ||keys.Space||touch.a||latch.KeyJ||latch.Space;latch.KeyJ=latch.Space=false;
  if(fishing.t>5&&a&&!atkPressed){atkPressed=true;if(fishing.t>=fishing.bite&&fishing.t<fishing.bite+45){P.inv.fish=(P.inv.fish||0)+1;floatText(hero.x,hero.y-8,"+Fish!","#9ef");}else toast("Too soon... it got away.");fishing=null;return;}
  if(!a)atkPressed=false;if(fishing.t>fishing.bite+45){toast("The fish escaped.");fishing=null;}
  if(getMoveInput().mx||getMoveInput().my)fishing=null;}
function regrow(){for(const k in world.harvested){const h=world.harvested[k];if(world.day>=h.until){const i=+k;T[i]=h.o;invalidateTile(i%WW,(i/WW)|0);delete world.harvested[k];}}}
// ===== NPC TALK =====
function dialogLines(n){
  const S=SETS[n.s],ws=world.sets[n.s],name=P.king?"Your Majesty":P.rank>=3?RANKS[P.rank]:n.met?"friend":"traveler";const L=[];
  if(!n.met)L.push(`Hello, ${name}. I'm ${title(n)}${n.name} of ${S.name}.`);
  else if(n.friend>70)L.push(pick([`${name}! Always a joy to see you.`,`There you are! I was just thinking about you, ${name}.`]));
  else L.push(pick([`Good to see you again, ${name}.`,`Oh, it's you! How have you been?`,`Back again, ${name}?`]));
  if(P.titles&&P.titles.length){const mine=P.titles.find(t=>t.endsWith(S.name));L.push(mine?`You're the ${mine}! Our whole town owes you everything.`:`They say you're the ${pick(P.titles)}. Incredible!`);}
  if(P.guild&&P.guild.reg&&P.guild.rank>=3)L.push(`A ${GRANKS[P.guild.rank]}-rank adventurer! It's an honor.`);
  if(ws.raid)L.push("Monsters are attacking! Please, drive them off!");
  if(ws.dragon)L.push(`The dragon ${DRAGONS[ws.dragon.k].name}! Run, or fight it if you dare!`);
  if(ws.festival)L.push(pick(["Isn't the festival wonderful? Try the pies!","Music, lanterns, dancing... I love festival days."]));
  const rec=world.news.filter(x=>x.d>=world.day-3&&x.s!==n.s&&x.s>=0);if(rec.length&&Math.random()<0.7)L.push("Did you hear? "+pick(rec).t);
  const loc=world.news.find(x=>x.s===n.s&&x.d>=world.day-4);if(loc)L.push("Around here: "+loc.t);
  if(n.adv){const a=n.adv;L.splice(1,0,`I am a level ${a.lvl} ${a.cls}, ${GRANKS[a.rank]}-rank${a.team?" of the "+a.team:""}. ${a.state==="travel"?"Off on a job right now!":(P.party||[]).includes(n.id)?"Lead on, I have got your back.":"Looking for work... or a drink."}`);}
  const role={adventurer:["The guild board had a dragon job yesterday. Someone grabbed it fast.","Monster parts sell well in Saltmere."],leader:[`${S.name} needs capable folk. Check the notice board for work.`,"I keep this place running. It isn't easy."],innkeeper:["A warm bed and a hot meal, always ready.","Travelers bring the best stories."],
    shopkeeper:[`Prices are ${ws.price>1.15?"high lately, sorry":ws.price<0.9?"great this week":"fair as ever"}.`,"Bring me pelts and gems, I pay well."],guard:["Bandits on the roads lately. Stay sharp.","I patrol until sunset."],
    smith:["A good blade is worth more than gold.","Dragon scale... now that I'd love to work with."],fisher:["The fish bite best at dawn.","Cast near the shore and wait for the tug."],farmer:[["Spring planting is hard work!","The crops are growing tall.","Harvest time! Busy, busy.","Winter rest. The fields are sleeping."][season()]],child:["Wanna race? I'm super fast!","Mom says not to go near the ruins.","I saw a dragon shadow once!"]}[n.role];
  L.push(pick(role));
  L.push(pick([`${world.weather==="rain"?"This rain is good for the crops.":world.weather==="storm"?"What a storm!":world.weather==="snow"?"Snow again! I love it.":"Lovely weather today."}`,`${SEASONS[season()]} always feels short.`]));
  if(n.spouse>0){const m=npcs.find(x=>x.id===n.spouse);if(m)L.push(`My spouse ${m.name} sends their regards.`);}
  else if(n.partner){const m=npcs.find(x=>x.id===n.partner);if(m)L.push(`Between us... I've been seeing ${m.name}.`);}
  const f=Object.entries(n.rel).sort((a,b)=>b[1]-a[1])[0];if(f){const m=npcs.find(x=>x.id==f[0]);if(m&&m.alive&&Math.random()<0.4)L.push(`${m.name} is my dearest friend.`);}
  if(n.spouse===-1)L.push(pick(["I love you, dear.","Home is wherever you are.","Shall we have dinner together tonight?"]));
  else if(P.dating.includes(n.id))L.push("I had a wonderful time on our last date.");
  return L;
}
function talk(n){
  SFX.blip();
  const lines=dialogLines(n);
  if(n.last!==world.day){n.last=world.day;n.friend=Math.min(100,n.friend+(n.met?2:3));}n.met=true;
  const btns=[];
  const giftable=Object.keys(P.inv).filter(k=>P.inv[k]>0&&k!=="amulet"&&k!=="ring");
  if(giftable.length&&n.gift!==world.day)btns.push({l:"Give gift",f:()=>{showMenu("Gift for "+n.name,"",giftable.map(k=>({l:`${ITEMS[k].n} (${P.inv[k]})`,f:()=>{giveGift(n,k);showMenu(n.name,`"Oh, thank you!" (${heartsOf(n)})`,[{l:"OK"}]);}})).concat([{l:"Back"}]));}});
  if(canRomance(n)&&n.friend>=50&&n.spouse!==-1)btns.push({l:P.dating.includes(n.id)?"Go on a date":"Ask on a date",f:()=>{const r=askDate(n);fadeBlack("",()=>showMenu(n.name,r,[{l:"OK"}]));}});
  if(P.dating.includes(n.id))btns.push({l:"Propose 💍",f:()=>showMenu(n.name,propose(n),[{l:"OK"}])});
  if(n.spouse===-1)btns.push({l:"Spend the evening",f:()=>fadeBlack("You share a quiet, cozy evening together.",()=>{advanceMinutes(240);n.friend=Math.min(100,n.friend+3);})});
  if(n.adv){const inP=(P.party||[]).includes(n.id);btns.push(inP?{l:"Leave party",f:()=>dismissParty(n)}:{l:"Invite to party",f:()=>showMenu(n.name,inviteParty(n),[{l:"OK"}])});}
  if(n.role==="leader"){btns.push({l:"Ask for work",f:()=>boardMenu(n.s)});

    if(n.s===4&&P.inv.amulet){btns.push({l:"Return the amulet",f:()=>{P.inv.amulet=0;P.gold+=120;n.friend=Math.min(100,n.friend+20);addNews(4,"The Reedwick heirloom amulet was returned!");showMenu(n.name,"My family's amulet! Bless you. Take this: 120 gold.",[{l:"OK"}]);}});}}
  if(tryCompleteJobs(n.s,n))lines.push("Thanks for the work you did for us!");
  btns.push({l:"Bye"});
  showMenu(`${title(n)}${n.name} ${heartsOf(n)}`,lines.slice(0,4).join("\n\n"),btns);
}
const heartsOf=n=>"♥".repeat(Math.round(n.friend/20))+"♡".repeat(5-Math.round(n.friend/20));
// ===== MENUS =====
const menuEl=document.getElementById("menu");
function showMenu(t,text,btns){paused=true;SFX.ui();menuEl.innerHTML="";const h=document.createElement("h2");h.textContent=t;menuEl.appendChild(h);
  if(text){const p=document.createElement("p");p.textContent=text;menuEl.appendChild(p);}
  const wrap=document.createElement("div");wrap.className="mbtns";
  for(const b of btns){const e=document.createElement("button");e.type="button";e.textContent=b.l;if(b.dis)e.disabled=true;e.onclick=ev=>{ev.stopPropagation();closeMenu();if(b.f)b.f();updateHud();};wrap.appendChild(e);}
  menuEl.appendChild(wrap);menuEl.classList.remove("hidden");atkPressed=true;}
function closeMenu(){menuEl.classList.add("hidden");paused=false;atkPressed=!!(keys.KeyJ||keys.Space||touch.a);for(const k in latch)latch[k]=false;}
function fadeBlack(text,cb){const f=document.getElementById("fade");f.textContent=text||"";f.classList.add("on");paused=true;setTimeout(()=>{f.classList.remove("on");paused=false;cb&&cb();},window.__FAST?50:1600);}
function priceOf(sid,k,sell){const ws=world.sets[sid];let p=ITEMS[k].p*ws.price*((ws.demand&&ws.demand[k.replace("+","")])||1)*(sell?1:1-guildDiscount());if(ws.festival&&ITEMS[k].food)p*=0.7;if(ws.raid)p*=1.2;return Math.max(1,Math.round(sell?p*0.5:p));}
function buildingMenu(b,inside){const sid=b.s,ws=world.sets[sid],S=SETS[sid];
  if(world.bld[b.id].burn>0)return showMenu("Fire!","The building is ablaze! Press A nearby to help douse it.",[{l:"OK"}]);
  if(b.kind==="inn")return showMenu(S.name+" Inn","Rest restores health and passes the night. A meal fills you up.",[
    {l:`Rest (${priceOf(sid,"bread")*2}g)`,f:()=>{const c=priceOf(sid,"bread")*2;if(P.gold<c)return toast("Not enough gold.");P.gold-=c;sleep(b);}},
    {l:`Hot meal (${priceOf(sid,"bread")}g)`,f:()=>{const c=priceOf(sid,"bread");if(P.gold<c)return toast("Not enough gold.");P.gold-=c;P.hunger=Math.min(100,P.hunger+60);toast("Delicious!");}},
    {l:"Odd jobs",f:()=>boardMenu(sid)},{l:"Leave"}]);
  if(b.kind==="shop")return shopMenu(sid);
  if(b.kind==="guild")return guildMenu(sid);
  if(b.kind==="harbor")return showMenu("Saltmere Harbor","Boats for sale, sturdy and swift. Dock at any pier.",[
    {l:P.boat.owned?"Return my boat to this pier":`Buy a boat (60g)`,f:()=>{if(!P.boat.owned){if(P.gold<60)return toast("Not enough gold.");P.gold-=60;P.boat.owned=true;toast("You bought a boat! It's docked at the pier.");}
      const p=piers[0];P.boat.x=p.bx-14;P.boat.y=p.by-18;hero.boat=false;saveGame();}},{l:"Leave"}]);
  if(b.kind==="forsale"&&!inside){const mine=P.house===b.id||P.rent===b.id;
    const btn=[];if(mine)btn.push({l:"Go inside",f:()=>enterBuilding(b)});
    if(P.house!==b.id)btn.push({l:"Buy house (250g)",f:()=>{if(P.gold<250)return toast("Not enough gold.");P.gold-=250;P.house=b.id;b.owned=true;P.rent=-1;const sp=npcs.find(n=>n.id===P.spouse);if(sp)sp.home=b.id;
      addNews(sid,"The wanderer bought a house in "+S.name+".");checkRank();saveGame();toast("This house is yours!");}});
    if(!mine)btn.push({l:"Rent (15g / 3 days)",f:()=>{if(P.gold<15)return toast("Not enough gold.");P.gold-=15;P.rent=b.id;P.rentUntil=world.day+3;checkRank();toast("Rented for 3 days.");}});
    btn.push({l:"Leave"});return showMenu(mine?"Your Home":"House for sale",mine?"Home sweet home.":"A cozy house with a hearth and a garden.",btn);}
  if(world.bld[b.id].dmg>0.05)return showMenu("Damaged building","The builders could use wood for repairs.",[{l:"Go inside",f:()=>enterBuilding(b)},{l:"Donate 3 wood",dis:!((P.inv.wood||0)>=3),f:()=>{P.inv.wood-=3;world.bld[b.id].dmg=Math.max(0,world.bld[b.id].dmg-0.4);P.gold+=12;for(const n of npcs)if(n.s===sid)n.friend=Math.min(100,n.friend+3);addNews(sid,"The wanderer helped repair a building in "+S.name+".");toast("Repairs made! +12g, the town thanks you.");}},{l:"Leave"}]);
  const owner=npcs.filter(n=>n.home===b.id&&n.alive).map(n=>n.name).join(" & ");
  showMenu("A home in "+S.name,owner?`This is where ${owner} live${owner.includes("&")?"":"s"}. You knock, but it's a private home.`:"An empty house.",[{l:"OK"}]);
}
function sleep(b){fadeBlack("Zzz...",()=>{const toMorning=((24-hour()+7)%24||24)*60-world.min%60;advanceMinutes(toMorning);hero.hp=hero.maxHp;updateHearts();const d=doorOf(b);P.respawn={x:d.x,y:d.y+4};toast("You feel rested. Day "+(world.day+1));saveGame();});}
function shopMenu(sid){const ws=world.sets[sid];const btn=[];
  for(const k of SHOP_ITEMS)btn.push({l:`Buy ${ITEMS[k].n} ${priceOf(sid,k)}g (${ws.stock[k]||0})`,dis:!(ws.stock[k]>0),f:()=>{const c=priceOf(sid,k);if(P.gold<c)return toast("Not enough gold.");P.gold-=c;ws.stock[k]--;P.inv[k]=(P.inv[k]||0)+1;
    if(k==="potion"&&hero.hp<hero.maxHp){}shopMenu(sid);}});
  if(ws.merchant){btn.push({l:"Merchant: Heart Charm (+1 max ♥) 80g",f:()=>{if(P.gold<80)return toast("Not enough gold.");P.gold-=80;hero.maxHp=Math.min(12,hero.maxHp+1);hero.hp=hero.maxHp;updateHearts();}});}
  btn.push({l:"Sell items",f:()=>sellMenu(sid)});btn.push({l:"Leave"});
  showMenu(SETS[sid].name+" Shop",`Prices ${ws.price>1.1?"are up":ws.price<0.9?"are down":"are steady"} (x${ws.price.toFixed(2)}). You have ${P.gold}g.`,btn);}
function sellMenu(sid){const ks=Object.keys(P.inv).filter(k=>P.inv[k]>0&&ITEMS[k].p>0);
  showMenu("Sell",`You have ${P.gold}g.`,ks.map(k=>({l:`${ITEMS[k].n} x${P.inv[k]}: ${priceOf(sid,k,true)}g`,f:()=>{P.inv[k]--;P.gold+=priceOf(sid,k,true);sellMenu(sid);}})).concat([{l:"Sell all loot",f:()=>{for(const k of Object.keys(P.inv).filter(k=>ITEMS[k].part||["pelt","trinket","gem","pearl","meat"].includes(k))){while(P.inv[k]>0){P.inv[k]--;P.gold+=priceOf(sid,k,true);}}sellMenu(sid);}},{l:"Done"}]));}
function boardMenu(sid){const ws=world.sets[sid];const news=world.news.filter(n=>n.s===sid||n.s<0).slice(0,5).map(n=>`Day ${n.d+1}: ${n.t}`).join("\n");
  showMenu(SETS[sid].name+" Notice Board",(news||"No news.")+"\n\nJobs:",ws.jobs.filter(j=>!j.taken).map(j=>({l:`${jobText(j)} (${j.reward}g)`,f:()=>takeJob(j)})).concat([{l:"Close"}]));}
function waystoneMenu(w){if(!w.found){w.found=true;toast("Waystone attuned: "+wName(w));saveGame();}
  showMenu("Waystone: "+wName(w),"Travel instantly to any attuned waystone.",waystones.filter(x=>x.found&&x!==w).map(x=>({l:"→ "+wName(x),f:()=>travel(x)})).concat([{l:"Close"}]));}
const wName=w=>w.s>=0?SETS[w.s].name:w.name;
function travel(w){fadeBlack("",()=>{hero.boat=false;P.boarded=false;hero.x=w.x*TILE;hero.y=(w.y+1)*TILE+2;advanceMinutes(30);});}
function castleMenu(){if(!P.king)return kingAudience();showMenu("Royal Castle",`Decrees shape the realm.\nTaxes: ${["none","fair","heavy"][P.dec.tax]} | Patrols: ${P.dec.patrol?"on":"off"}`,[
  {l:"Change taxes",f:()=>{decree("tax");castleMenu();}},{l:"Toggle patrols",f:()=>{decree("patrol");castleMenu();}},{l:"Proclaim festival (100g)",f:()=>decree("festival")},{l:"Sleep in the royal chamber",f:()=>sleep({x:castleObj.x+1,y:castleObj.y,h:3})},{l:"Leave"}]);}
function eatFood(){for(const k of ["pie","bread","fish","meat","berry"])if(P.inv[k]>0){P.inv[k]--;P.hunger=Math.min(100,P.hunger+ITEMS[k].food);hero.hp=Math.min(hero.maxHp,hero.hp+(k==="pie"?2:1));updateHearts();toast("Ate "+ITEMS[k].n);return;}
  if(P.inv.potion>0){P.inv.potion--;hero.hp=hero.maxHp;updateHearts();toast("Drank a potion.");return;}toast("No food! Buy bread or catch fish.");}
function crownMenu(){checkRank();const a=achievements();showMenu("♛ Crown & Achievements",`Rank: ${RANKS[P.rank]}\nPath: ${RANKS.join(" → ")}\n\n`+a.map(x=>(x.ok?"✔ ":"○ ")+x.n).join("\n")+
  `\n\nGold ${P.gold} · Kills ${P.kills} · Dragons ${world.dragonsSlain} · Friends ${npcs.filter(n=>n.friend>=40).length}${P.spouse?" · Married to "+(npcs.find(n=>n.id===P.spouse)||{}).name:""}`+(P.canCrown?"\n\nKing Aldric awaits you in the castle to name his successor!":""),[{l:"Close"}]);}
function invMenu(){const ks=Object.keys(P.inv).filter(k=>P.inv[k]>0);showMenu("Satchel",(ks.map(k=>(ITEMS[k].ic||"•")+" "+ITEMS[k].n+" x"+P.inv[k]).join("\n")||"Empty")+"\n\nJobs:\n"+(P.jobs.map(j=>"• "+jobText(j)+(j.t==="hunt"?` (${j.have||0}/${j.n})`:"")).join("\n")||"none"),[{l:"Eat",f:eatFood},{l:"Craft",f:gearMenu},{l:"Guild Card",f:()=>showMenu("Guild Card",guildCard(),[{l:"Close"}])},{l:"Bestiary",f:bestiaryMenu},{l:"Quest Log",f:questLog},{l:"Crown",f:crownMenu},{l:"Close"}]);}

function royalRequest(){if(!P.royal||P.royal.day!==world.day){const opts=[{t:"pelt",n:3,reward:60,txt:"Bring me 3 Pelts for the royal tailors."},{t:"fish",n:4,reward:50,txt:"The royal kitchen needs 4 Fish."},{t:"gem",n:1,reward:90,txt:"A Gem for the treasury, if you find one."},{t:"herb",n:4,reward:45,txt:"The court healer needs 4 Herbs."}];
  P.royal={...opts[world.day%opts.length],day:world.day,done:false};}return P.royal;}
function kingAudience(){const r=royalRequest();const raid=world.sets.find(s=>s.raid);const btn=[];
  const lines=["KING ALDRIC: \"Ah, my summoned hero! How fares your new life?\""];
  if(raid)lines.push(`"Raiders threaten ${SETS[raid.id].name}. Should you choose to help, the crown would be grateful."`);
  if(!r.done){lines.push(`Optional request: ${r.txt} (${r.reward}g)`);btn.push({l:"Fulfil request",f:()=>{if((P.inv[r.t]||0)<r.n)return toast(`You need ${r.n} ${ITEMS[r.t].n}.`);P.inv[r.t]-=r.n;P.gold+=r.reward;r.done=true;
    for(const n of npcs)if(n.role==="leader")n.friend=Math.min(100,n.friend+3);toast(`The King rewards you ${r.reward}g.`);checkRank();}});}
  lines.push(`Your standing: ${RANKS[P.rank]}.`);
  if(P.canCrown){lines.push('"You have done everything a ruler could. I am old... I name YOU my successor!"');btn.push({l:"♛ Accept the crown",f:()=>coronation()});}
  btn.push({l:"Crown & achievements",f:crownMenu});btn.push({l:"Take your leave"});showMenu("Throne Room",lines.join("\n\n"),btn);}
// ===== MOB SPAWNING / AI =====
let uidN=1;
function inTown(px,py){return!!settlementAt(px,py);}
function spawnTick(){
  // materialize world events near the player
  const hx=hero.x,hy=hero.y,nearP=(x,y,r)=>Math.hypot(x-hx,y-hy)<r;
  for(const s of world.sets){const S=SETS[s.id],cx=S.x*TILE,cy=S.y*TILE;
    if(s.raid&&!s.raid.spawned&&nearP(cx,cy,700)){s.raid.spawned=true;for(let i=0;i<s.raid.n;i++){const a=Math.random()*7,rr=(S.r+4)*TILE;spawnMob(["goblin","goblin","gslinger","orc","shaman"][i%5],cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,{persist:true,raidOf:s.id,provoked:true,raider:1});}}
    if(s.dragon&&!s.dragon.spawned&&nearP(cx,cy,700)){s.dragon.spawned=true;spawnDragon(s.dragon.k,cx+60,cy-80,{town:s.id});SFX.roar();}
    if(s.dragon&&absMin()>s.dragon.until){if(!s.dragon.spawned)addNews(s.id,`${DRAGONS[s.dragon.k].name} flew off from ${S.name}, leaving scorched roofs.`);s.dragon=null;}}
  world.bandits.forEach((b,i)=>{if(!b.spawned&&nearP(b.x,b.y,500)){b.spawned=true;for(let k=0;k<b.n;k++)spawnMob("goblin",b.x+k*14,b.y+(k%2)*14,{persist:true,bandit:i+1});}});
  for(const b of world.beasts)if(!b.spawned&&!b.dead&&nearP(b.x,b.y,500)){b.spawned=true;const m=spawnMob(b.sp,b.x,b.y,{persist:true});m.uid=uidN++;b.mob=m.uid;}
  for(const m of world.migr)if(!m.spawned&&nearP(m.x,m.y,500)){m.spawned=true;for(let k=0;k<6;k++)spawnMob(m.sp,m.x+k*20,m.y+(k%3)*16,{migr:1,mdx:0.4});}
  for(const L of LAIRS)if((world["lair_"+L.sp]||0)<=world.day&&!mobs.some(m=>m.lair===L.sp)&&nearP(L.x*TILE,L.y*TILE,420))spawnDragon(L.sp,L.x*TILE,L.y*TILE,{lair:L.sp});
  campTick();
  if(Math.hypot(hx-RUINS.x*TILE,hy-RUINS.y*TILE)<400&&!mobs.some(m=>m.ruinBoss)&&(world.ruinBoss||0)<=world.day)spawnMob("boss",RUINS.x*TILE,(RUINS.y-2)*TILE,{persist:true,ruinBoss:true});
  // regular wildlife & monster herds by region population
  const wild=mobs.filter(m=>!m.persist&&!m.dead).length;if(wild>=14)return;
  const a=Math.random()*Math.PI*2,d=230+Math.random()*120,x=hx+Math.cos(a)*d,y=hy+Math.sin(a)*d;const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
  if(solidTile(tx,ty)||tAt(tx,ty)===DEEP||inTown(x,y)||tx<40&&ty<26)return;
  const b=biomeAt(tx,ty),pop=world.regions[regionOf(x,y)];const night=hour()>=20||hour()<5;
  const cand=Object.entries(SPECIES).filter(([k,s])=>s.biome&&s.biome.includes(b)&&(!s.night||night));if(!cand.length)return;
  const peaceful=cand.filter(([k,s])=>s.beh==="pea"||s.beh==="flee"),hostile=cand.filter(([k,s])=>!(s.beh==="pea"||s.beh==="flee"));
  const list=(Math.random()<pop*0.55&&hostile.length)?hostile:(peaceful.length?peaceful:hostile);
  const [sp,def]=pick(list);const n=def.herd?3+Math.floor(Math.random()*3):def.beh==="agg"?1+Math.floor(Math.random()*Math.min(3,1+pop*2)):1+Math.floor(Math.random()*2);
  for(let i=0;i<n;i++){const ex=x+(i%3)*16,ey=y+Math.floor(i/3)*16;if(!blocked(ex,ey,12,10))spawnMob(sp,ex,ey);}
}
function updateMob(e){
  const d=e.def;const cx=e.x+e.w/2,cy=e.y+e.h/2,hx=hero.x+6,hy=hero.y+6;const dx=hx-cx,dy=hy-cy,dist=Math.hypot(dx,dy)||1,ang=Math.atan2(dy,dx);
  if(e.dead)return;
  if(e.sp==="dragon")return updateDragon(e,dist,ang);
  if(e.mon&&monAI(e,dist,ang))return;
  let mode=d.beh;if(mode==="neu"&&e.provoked)mode="agg";if(mode==="pea"&&e.provoked)mode="flee";
  const heroSafe=hero.dead||(hero.boat&&!e.swims);
  if(e.raidOf!=null&&!e.dead&&raiderAI(e))return;
  if(mode==="agg"&&!heroSafe&&(dist<(d.aggro||90)||e.provoked)&&dist<300){
    if(d.base){combatAI(e);return;}
    if(e.iframes>0)e.iframes--;if(e.flash>0)e.flash--;if(e.atkCd>0)e.atkCd--;
    if(e.knockT>0){moveEntity(e,e.knockVx,e.knockVy);e.knockVx*=.75;e.knockVy*=.75;e.knockT--;return;}
    if(e.lunge>0)e.lunge--;if(e.wind>0){e.wind--;if(e.wind===0){e.lunge=10;moveEntity(e,Math.cos(ang)*4,Math.sin(ang)*4);if(dist<22+e.w/3)hurtHero(e.dmg,ang);e.atkCd=50;}return;}
    moveEntity(e,Math.cos(ang)*e.spd,Math.sin(ang)*e.spd);if(dist<18+e.w/3&&e.atkCd<=0){e.wind=16;}
    e.dir=dx<0?1:2;return;}
  if(e.iframes>0)e.iframes--;if(e.flash>0)e.flash--;
  if(e.knockT>0){moveEntity(e,e.knockVx,e.knockVy);e.knockVx*=.75;e.knockVy*=.75;e.knockT--;return;}
  if(mode==="flee"&&dist<70){moveEntity(e,-Math.cos(ang)*e.spd*1.5,-Math.sin(ang)*e.spd*1.5);e.dir=dx<0?2:1;return;}
  if(e.migr){moveEntity(e,e.mdx,Math.sin(frameN*0.01+e.x)*0.1);return;}
  e.wt--;if(e.wt<=0){e.wt=90+Math.random()*150;e.wx=e.hx+(Math.random()-.5)*120;e.wy=e.hy+(Math.random()-.5)*90;if(Math.random()<0.4){e.wx=e.x;e.wy=e.y;}}
  const wx=e.wx-e.x,wy=e.wy-e.y,wl=Math.hypot(wx,wy);if(wl>3){const s=(e.spd||.5)*0.45;moveEntity(e,wx/wl*s,wy/wl*s);e.dir=wx<0?1:2;e.anim++;}
}
// ===== NPC ROUTINES =====
function npcTarget(n){const S=SETS[n.s],h=hour(),ws=world.sets[n.s];const home=doorOf(buildings[n.home]);
  if(n.cheer&&absMin()<n.cheer&&curSet&&curSet.id===n.s){const a=n.id*1.7;return{x:hero.x+Math.cos(a)*26,y:hero.y+Math.sin(a)*18};}
  if(ws.raid||ws.dragon)return{...home,inside:true};
  if(h>=22||h<6)return{...home,inside:true};
  const spot=k=>({x:(S.x+((n.id*7+k*3)%7)-3)*TILE,y:(S.y+((n.id*5+k)%5)-2)*TILE});
  if(ws.festival&&h>=10)return spot(Math.floor(frameN/1200));
  if(h<11){if(n.work!=null)return{...doorOf(buildings[n.work]),inside:h>=7};if(n.role==="farmer"&&S.farm)return{x:(S.farm.x+n.id%4)*TILE,y:(S.farm.y+1)*TILE};return spot(1);}
  const inn=S.bIdx.find(b=>buildings[b].kind==="inn");
  if(h<13)return{...doorOf(buildings[inn]),inside:true,b:inn};
  if(h<20&&n.work!=null)return{...doorOf(buildings[n.work]),inside:true};
  if(h<18){return spot(2+(h%3));}
  if(h<21){if(n.adv){const gh=S.bIdx.find(b=>buildings[b].kind==="guild");if(gh!=null)return{...doorOf(buildings[gh]),inside:true,b:gh};}return n.id%2?{...doorOf(buildings[inn]),inside:true,b:inn}:spot(5);}return{...home,inside:true,b:n.home};}
function updateNpc(n){
  if(n.adv&&n.adv.state==="travel"){const p=advWorldPos(n);if(p){n.x=p.x;n.y=p.y;n.inside=false;if(Math.hypot(n.x-hero.x,n.y-hero.y)<400&&frameN%40===0){const m=mobs.find(m=>!m.dead&&m.def&&m.def.beh==="agg"&&Math.hypot(m.x-n.x,m.y-n.y)<70);if(m){n.gest=12;m.iframes=0;if(m.sp==="dragon")hitDragon(m,0);else hurtEnemy(m,1,Math.atan2(m.y-n.y,m.x-n.x),true);}}if(n.gest>0)n.gest--;return;}}
  const t=npcTarget(n);const far=Math.hypot(n.x-hero.x,n.y-hero.y)>500;
  if(far){n.x=t.x;n.y=t.y;n.inside=!!t.inside;n.at=t.b;return;}
  const dx=t.x-n.x,dy=t.y-n.y,l=Math.hypot(dx,dy);
  if(l<3){n.inside=!!t.inside;n.at=t.b;return;}n.inside=false;n.at=null;
  const sp=n.role==="child"?0.6:0.45;const ox=n.x,oy=n.y;const ent={x:n.x+2,y:n.y+4,w:10,h:8,npc:true};
  moveEntity(ent,dx/l*sp,dy/l*sp);n.x=ent.x-2;n.y=ent.y-4;
  if(Math.abs(n.x-ox)+Math.abs(n.y-oy)<0.1){n.stuck=(n.stuck||0)+1;if(n.stuck>40){n.x=t.x;n.y=t.y;n.stuck=0;}}else n.stuck=0;
  n.anim++;if(n.anim%10===0)n.frame^=1;n.dir=dx<0?1:2;
}
// ===== UI HELPERS =====
let toasts=[],floats=[];
function toast(t){toasts.push({t,life:180});if(toasts.length>4)toasts.shift();const el=document.getElementById("toasts");el.innerHTML=toasts.map(x=>`<div>${x.t.replace(/</g,"&lt;")}</div>`).join("");}
function floatText(x,y,t,c){if(/g$/.test(t))SFX.coin();floats.push({x,y,t,c,life:60});}
const hfURL=heartFull.toDataURL(),heURL=heartEmpty.toDataURL();
function updateHearts(){const el=document.getElementById("hearts");let s="";for(let i=0;i<hero.maxHp;i++)s+=`<img class="heart" src="${i<hero.hp?hfURL:heURL}" alt="">`;el.innerHTML=s;}
function updateHud(){if(!world)return;const h=hour(),m=world.min%60;
  document.getElementById("clock").textContent=`Day ${world.day+1} · ${SEASONS[season()]} · ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")} · ${world.weather}`;
  document.getElementById("gold").textContent=`${P.gold}g · ${RANKS[P.rank]}`;
  document.getElementById("hungerFill").style.width=P.hunger+"%";
  const st=document.getElementById("stam");st.style.display=hero.stam<100?"block":"none";document.getElementById("stamFill").style.width=hero.stam+"%";if(P.mag)document.getElementById("manaFill").style.width=(P.mag.mp/P.mag.max*100)+"%";}
// minimap
const mini=document.getElementById("mini"),mg=mini.getContext("2d");
function drawMini(){mg.imageSmoothingEnabled=false;const R=40;const tx=hero.x/TILE,ty=hero.y/TILE;
  mg.fillStyle="#123";mg.fillRect(0,0,mini.width,mini.height);mg.drawImage(worldMapC,tx-R,ty-R*0.75,R*2,R*1.5,0,0,mini.width,mini.height);
  const sx=mini.width/(R*2),sy=mini.height/(R*1.5),P2=(x,y)=>[(x-tx+R)*sx,(y-ty+R*0.75)*sy];
  for(const s of SETS){const [x,y]=P2(s.x,s.y);mg.fillStyle="#ffd84a";mg.fillRect(x-2,y-2,4,4);}
  for(const w of waystones)if(w.found){const [x,y]=P2(w.x,w.y);mg.fillStyle="#5ff";mg.fillRect(x-1,y-1,3,3);}
  if(P.boat.owned){const [x,y]=P2(P.boat.x/TILE,P.boat.y/TILE);mg.fillStyle="#fff";mg.fillRect(x-2,y-1,4,2);}
  for(const m of mobs)if(!m.dead&&(m.def.beh==="agg"||m.sp==="dragon")){const [x,y]=P2(m.x/TILE,m.y/TILE);mg.fillStyle=m.sp==="dragon"?"#f0f":"#f44";mg.fillRect(x-1,y-1,2,2);}
  mg.fillStyle="#fff";mg.beginPath();mg.arc(mini.width/2,mini.height/2,2.5,0,7);mg.fill();mg.strokeStyle="#e8c060";mg.strokeRect(.5,.5,mini.width-1,mini.height-1);}
// full world map with fast travel
const mapEl=document.getElementById("mapov"),mapC=document.getElementById("mapc");
function toggleMap(){if(!mapEl.classList.contains("hidden")){mapEl.classList.add("hidden");paused=false;return;}paused=true;mapEl.classList.remove("hidden");drawFullMap();}
function drawFullMap(){const g=mapC.getContext("2d");mapC.width=WW*3;mapC.height=WH*3;g.imageSmoothingEnabled=false;g.drawImage(worldMapC,0,0,WW*3,WH*3);
  g.font="bold 11px system-ui";g.textAlign="center";
  for(const s of SETS){g.fillStyle="#ffd84a";g.fillRect(s.x*3-4,s.y*3-4,8,8);g.fillStyle="#fff";g.strokeStyle="#000";g.lineWidth=3;g.strokeText(s.name,s.x*3,s.y*3-8);g.fillText(s.name,s.x*3,s.y*3-8);
    const ws=world.sets[s.id];if(ws.raid||ws.dragon){g.fillStyle="#f33";g.fillText("⚔",s.x*3+12,s.y*3+4);}if(ws.festival){g.fillStyle="#f9f";g.fillText("✦",s.x*3-12,s.y*3+4);}}
  ISLES.forEach((I,i)=>{g.fillStyle=P.isles.includes(i)?"#bff":"#79a";g.strokeText(P.isles.includes(i)?I.name:"???",I.x*3,(I.y+I.r)*3+10);g.fillText(P.isles.includes(i)?I.name:"???",I.x*3,(I.y+I.r)*3+10);});
  for(const L of LAIRS){g.fillStyle="#f6f";g.fillText("🐉",L.x*3,L.y*3);}
  g.fillStyle="#ccc";g.fillText("Ruins",RUINS.x*3,RUINS.y*3-20);
  for(const l of LOOKOUTS){g.fillStyle="#fff";g.fillText("▲",l.x*3,l.y*3+4);}
  for(const w of world.wrecks)if(!w.looted){g.fillStyle="#fc8";g.fillText("⚓",w.x/TILE*3,w.y/TILE*3);}
  for(const w of waystones){g.fillStyle=w.found?"#5ff":"#567";g.beginPath();g.arc(w.x*3,w.y*3,w.found?6:3,0,7);g.fill();}
  if(P.boat.owned){g.fillStyle="#fff";g.fillText("⛵",P.boat.x/TILE*3,P.boat.y/TILE*3);}
  g.fillStyle="#f22";g.beginPath();g.arc(hero.x/TILE*3,hero.y/TILE*3,5,0,7);g.fill();g.strokeStyle="#fff";g.lineWidth=2;g.stroke();}
mapC.addEventListener("click",e=>{const r=mapC.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*WW,y=(e.clientY-r.top)/r.height*WH;
  for(const w of waystones)if(w.found&&Math.hypot(w.x-x,w.y-y)<5){toggleMap();travel(w);return;}});
document.getElementById("mapClose").onclick=e=>{e.stopPropagation();toggleMap();};
document.getElementById("btnMap").onclick=e=>{e.stopPropagation();if(state==="play")toggleMap();};
document.getElementById("btnBag").onclick=e=>{e.stopPropagation();if(state==="play")invMenu();};
document.getElementById("btnCrown").onclick=e=>{e.stopPropagation();if(state==="play")crownMenu();};
// ===== UPDATE =====
let spawnT=0,saveT=0,lastSet=null;
function update(){
  if(state!=="play"||paused)return;if(hitStop>0){hitStop--;if(shake>0)shake-=0.5;return;}frameN++;if(shake>0)shake=Math.max(0,shake-0.6);
  simAcc++;if(simAcc>=20){simAcc=0;advanceMinutes(1);}
  if(fishing)updateFishing();else updateHero();updateMagic();
  if(room){for(const n of npcs)if(n.alive)updateNpc(n);updateParticles();if(frameN%15===0){updateHud();}for(const f of floats){f.life--;}floats=floats.filter(f=>f.life>0);return;}
  if(++spawnT>=45){spawnT=0;spawnTick();regrow();maybeFlyer();}
  for(const e of mobs){const dd=Math.hypot(e.x-hero.x,e.y-hero.y);if(dd<450||e.sp==="dragon"&&dd<700)updateMob(e);}
  towersTick();
  mobs=mobs.filter(e=>{if(e.dead){e.flash--;return e.flash>0;}const dd=Math.hypot(e.x-hero.x,e.y-hero.y);return e.persist?dd<1600:dd<700;});
  for(const n of npcs)if(n.alive&&!(n.adv&&(P.party||[]).includes(n.id)))updateNpc(n);updateParty();updateWood();
  updateParticles();
  for(const f of flyers){f.x+=f.vx;f.y+=f.vy;f.life--;}flyers=flyers.filter(f=>f.life>0);
  for(const f of floats){f.life--;f.y-=0.3;}floats=floats.filter(f=>f.life>0);
  if(toasts.length){toasts[0].life--;if(toasts[0].life<=0){toasts.shift();document.getElementById("toasts").innerHTML=toasts.map(x=>`<div>${x.t}</div>`).join("");}}
  // ambient particles
  const {tx,ty}=heroTile();const b=biomeAt(tx,ty);const night=hour()>=20||hour()<5;
  if(b==="forest"&&Math.random()<0.15)particles.push({x:camX+Math.random()*W,y:camY-4,z:20,vx:0.3+Math.random()*.3,vy:0.4,vz:-0.05,life:200,max:200,col:hexRGB(LEAFC[season()][Math.random()<.5?0:1]),size:2,kind:"leaf"});
  if(night&&(b==="meadow"||b==="forest")&&Math.random()<0.12)particles.push({x:camX+Math.random()*W,y:camY+Math.random()*H,z:8,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,vz:.26,life:120,max:120,col:[230,255,120],size:1.5,kind:"fly"});
  if(world.weather==="snow"&&Math.random()<0.6)particles.push({x:camX+Math.random()*W,y:camY+Math.random()*H*0.2,z:30,vx:.2,vy:.6,vz:-.0,life:150,max:150,col:[255,255,255],size:1.5,kind:"snow"});
  const s=settlementAt(hero.x,hero.y);curSet=s;if(s&&s!==lastSet){guildProgress("escort",s.id);banner={t:s.name,sub:s.kind+(world.sets[s.id].festival?" · Festival!":""),life:150};tryCompleteJobs(s.id);}lastSet=s;
  if(frameN%15===0){updateHud();drawMini();if(frameN%60===0)updatePartyHud();}
  if(++saveT>=900){saveT=0;saveGame();}
}
const hexRGB=h=>[parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)];
// ===== DRAW =====
function drawShadow(x,y,rx,ry){ctx.fillStyle="rgba(10,0,20,.28)";ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();}
function drawMob(e){if(e.dead&&e.flash<=0)return;
  if(e.sp==="dragon"){const im=e.img;const fly=e.fly>0?18+Math.sin(frameN*.1)*4:0;drawShadow(e.x+e.w/2,e.y+e.h,e.w*.7,6);
    if(e.flash>0)ctx.filter="brightness(2)";const flip=hero.x<e.x;ctx.save();ctx.translate(Math.floor(e.x+e.w/2),Math.floor(e.y+e.h-fly));if(!flip)ctx.scale(-1,1);ctx.drawImage(im,-im.width/2,-im.height+4);ctx.restore();ctx.filter="none";
    const bw=60;ctx.fillStyle="#200";ctx.fillRect(e.x+e.w/2-bw/2-1,e.y-48-fly,bw+2,5);ctx.fillStyle="#f43";ctx.fillRect(e.x+e.w/2-bw/2,e.y-47-fly,bw*e.hp/e.maxHp,3);
    ctx.font="bold 7px system-ui";ctx.textAlign="center";ctx.fillStyle="#ffe";ctx.fillText(e.name+" · phase "+e.phase,e.x+e.w/2,e.y-51-fly);return;}
  if(e.img){const im=e.img;drawShadow(e.x+e.w/2,e.y+e.h-1,im.width*.35,3);if(e.flash>0)ctx.filter="brightness(2)";
    const bob=Math.sin((e.anim||0)*0.25)*1;ctx.save();ctx.translate(Math.floor(e.x+e.w/2),Math.floor(e.y+e.h+bob));if(e.dir===2)ctx.scale(-1,1);ctx.drawImage(im,-im.width/2,-im.height);ctx.restore();ctx.filter="none";
    if(e.def.rare||e.provoked&&e.hp<e.maxHp){ctx.fillStyle="#300";ctx.fillRect(e.x,e.y-im.height+e.h-5,e.w,2);ctx.fillStyle="#e44";ctx.fillRect(e.x,e.y-im.height+e.h-5,e.w*e.hp/e.maxHp,2);}return;}
  drawEnemy(e);}
function drawEnemy(e){const spr=enemySprite(e);drawShadow(e.x+e.w/2,e.y+e.h-1,e.w*.4,2.5);if(e.flash>0)ctx.filter="brightness(2)";
  ctx.drawImage(spr,Math.floor(e.x-2),Math.floor(e.y-(e.type==="boss"?4:2)));ctx.filter="none";
  if(e.type==="boss"&&!e.dead){ctx.fillStyle="#200";ctx.fillRect(e.x-2,e.y-8,24,4);ctx.fillStyle="#c44";ctx.fillRect(e.x-1,e.y-7,22*(e.hp/e.maxHp),2);}}
function drawNpc(n){const s=npcSprites(n)[n.frame];const child=n.age<15;drawShadow(n.x+8,n.y+15,5,2);ctx.save();ctx.translate(Math.floor(n.x+8),Math.floor(n.y+16));if(n.dir===1)ctx.scale(-1,1);
  const sc=child?0.72:1;ctx.scale(sc,sc);ctx.drawImage(s,-8,-16);ctx.restore();
  if(n.spouse===-1||P.dating.includes(n.id)){ctx.fillStyle="#ff6a9a";ctx.font="7px system-ui";ctx.textAlign="center";ctx.fillText("♥",n.x+8,n.y-(child?0:2));}
  if(n.role==="leader"){ctx.fillStyle="#ffd84a";ctx.fillRect(n.x+6,n.y-1,4,2);}}
function drawHeroFull(){if(hero.boat){ctx.drawImage(SPR2.boat,Math.floor(hero.x-8),Math.floor(hero.y-6+Math.sin(frameN*.08)));}
  if(hero.swim){ctx.save();ctx.beginPath();ctx.rect(hero.x-4,hero.y-6,24,14);ctx.clip();drawHero();ctx.restore();
    ctx.strokeStyle="rgba(255,255,255,.7)";ctx.beginPath();ctx.ellipse(hero.x+6,hero.y+8,8+Math.sin(frameN*.2),3,0,0,7);ctx.stroke();return;}
  if(hero.boat){ctx.save();ctx.beginPath();ctx.rect(hero.x-4,hero.y-8,24,18);ctx.clip();drawHero();ctx.restore();return;}
  drawHero();if(P.king){ctx.fillStyle="#ffd84a";ctx.beginPath();ctx.moveTo(hero.x+1,hero.y-3);ctx.lineTo(hero.x+3,hero.y-7);ctx.lineTo(hero.x+6,hero.y-4);ctx.lineTo(hero.x+9,hero.y-7);ctx.lineTo(hero.x+11,hero.y-3);ctx.fill();}}
function draw(){
  ctx.setTransform(RS,0,0,RS,0,0);ctx.imageSmoothingEnabled=false;
  if(state==="intro"){drawIntro();return;}
  if(room&&world){drawRoom();return;}
  if(!world){ctx.fillStyle="#0a0a12";ctx.fillRect(0,0,W,H);return;}
  if(tileSeason!==season()){tileSeason=season();TILESET=makeTiles(tileSeason);chunkCache.clear();}
  {const now=performance.now(),dt=Math.min(50,now-(camT||now));camT=now;const tx=hero.x+6-W/2+(hero.vx||0)*16,ty=hero.y+6-H/2+(hero.vy||0)*11;
   if(camFX==null||Math.hypot(tx-camFX,ty-camFY)>260||window.__FAST){camFX=tx;camFY=ty;}else{const k=1-Math.pow(0.86,dt/16.7);camFX+=(tx-camFX)*k;camFY+=(ty-camFY)*k;}
   camX=clamp(camFX,0,PXW-W);camY=clamp(camFY,0,PXH-H);camX=Math.round(camX*RS)/RS;camY=Math.round(camY*RS)/RS;}
  ctx.save();if(shake>0)ctx.translate(Math.round((Math.random()-.5)*shake*RS)/RS,Math.round((Math.random()-.5)*shake*RS)/RS);ctx.translate(-camX,-camY);
  const c0=Math.floor(camX/256),c1=Math.floor((camX+W)/256),r0=Math.floor(camY/256),r1=Math.floor((camY+H)/256);
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++)ctx.drawImage(getChunk(cx,cy),cx*256,cy*256,256,256);drawGroundFX(tx0g(),ty0g());drawPeaks();
  // water shimmer & crops
  const tx0=Math.floor(camX/TILE),ty0=Math.floor(camY/TILE),tx1=tx0+Math.ceil(W/TILE)+1,ty1=ty0+Math.ceil(H/TILE)+1;
  ctx.fillStyle="rgba(255,255,255,.75)";
  for(let i=0;i<30;i++){const x=tx0+Math.floor(hash2(i,Math.floor(frameN/20),3)*(tx1-tx0)),y=ty0+Math.floor(hash2(i,Math.floor(frameN/20),4)*(ty1-ty0));if(isWater(tAt(x,y)))ctx.fillRect(x*16+hash2(i,y,1)*14,y*16+hash2(i,x,2)*14,2,1);}
  for(const S of SETS)if(S.farm&&S.farm.x+4>=tx0&&S.farm.x<=tx1&&S.farm.y+3>=ty0&&S.farm.y<=ty1){const st=world.sets[S.id].crop;if(!st)continue;
    for(let y=S.farm.y;y<S.farm.y+3;y++)for(let x=S.farm.x;x<S.farm.x+4;x++){if(tAt(x,y)!==FARM)continue;for(let k=0;k<3;k++){const px=x*16+3+k*5,py=y*16+12;ctx.fillStyle=st>=4?"#e8c040":"#5ac83a";ctx.fillRect(px,py-st*2.5,2,st*2.5);if(st>=3){ctx.fillStyle=st>=4?"#ffe070":"#8f6";ctx.fillRect(px-1,py-st*2.5-2,4,3);}}}}
  drawSplats();
  const list=[];const vis=(x,y,m)=>x>camX-m&&x<camX+W+m&&y>camY-m&&y<camY+H+m;
  for(const b of buildings)if(vis(b.x*16+32,b.y*16+24,80))list.push({y:(b.y+b.h)*16,f:()=>drawBuilding(b)});
  if(castleObj&&vis(castleObj.x*16+48,castleObj.y*16,140))list.push({y:(castleObj.y+3)*16,f:()=>ctx.drawImage(SPR2.castle,castleObj.x*16,(castleObj.y+3)*16-88,96,88)});
  for(const w of waystones)if(vis(w.x*16,w.y*16,40))list.push({y:w.y*16+16,f:()=>{ctx.drawImage(SPR2.way[w.found?1:0],w.x*16+2,w.y*16-8);if(w.found){ctx.globalCompositeOperation="lighter";ctx.fillStyle=`rgba(80,255,255,${.15+.1*Math.sin(frameN*.05)})`;ctx.beginPath();ctx.arc(w.x*16+8,w.y*16+2,8,0,7);ctx.fill();ctx.globalCompositeOperation="source-over";}}});
  for(const o of objects)if(vis(o.x*16,o.y*16,40))list.push({y:o.y*16+16,f:()=>{if(o.type==="lookout")return drawLookout(o);ctx.drawImage(o.type==="board"?SPR2.board:SPR2.chest[world.opened[o.id]?1:0],o.x*16,o.y*16);}});
  for(const p of PROPS)if(vis(p.x*16,p.y*16,70))list.push({y:p.y*16+14,f:()=>drawProp(p)});
  drawWallsList(list,vis);
  for(const w of world.wrecks)if(!w.looted&&vis(w.x,w.y,60))list.push({y:w.y+20,f:()=>ctx.drawImage(SPR2.wreck,w.x,w.y)});
  for(const c of world.caravans){const A=SETS[c.from],B=SETS[c.to];const x=(A.x+(B.x-A.x)*c.t)*16,y=(A.y+(B.y-A.y)*c.t)*16;if(vis(x,y,40))list.push({y:y+16,f:()=>ctx.drawImage(SPR2.cart,x,y)});}
  if(P.boat.owned&&!hero.boat&&vis(P.boat.x,P.boat.y,40))list.push({y:P.boat.y+20,f:()=>ctx.drawImage(SPR2.boat,Math.floor(P.boat.x),Math.floor(P.boat.y+Math.sin(frameN*.06)))});
  drawWoodList(list,vis);
  for(const n of npcs)if(n.alive&&!n.inside&&vis(n.x,n.y,30))list.push({y:n.y+16,f:()=>drawNpc(n)});
  for(const e of mobs)if(vis(e.x,e.y,90))list.push({y:e.y+e.h,f:()=>drawMob(e)});
  list.push({y:hero.y+12,f:drawHeroFull});
  list.sort((a,b)=>a.y-b.y);for(const it of list)it.f();drawCanopies();drawFallers();drawTorches();drawQuestMarkers();
  drawParts();drawProjectiles();drawMagic();
  for(const p of particles){ctx.globalAlpha=Math.min(1,p.life/15);if(p.kind==="fly"){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=.5+.5*Math.sin(p.life*.2);}
    ctx.fillStyle=`rgb(${p.col[0]},${p.col[1]},${p.col[2]})`;ctx.fillRect(p.x-p.size/2,p.y-p.z-p.size/2,p.size,p.size);ctx.globalCompositeOperation="source-over";
    if(p.kind==="leaf"||p.kind==="snow"){p.vx=p.kind==="leaf"?Math.sin(p.life*.05)*.5+.3:.2;if(p.z<1)p.z=1;}}
  ctx.globalAlpha=1;
  // fire on burning buildings
  for(const b of buildings)if(world.bld[b.id].burn>0&&vis(b.x*16,b.y*16,60)){for(let i=0;i<3;i++)particles.push({x:b.x*16+8+Math.random()*48,y:b.y*16+30,z:Math.random()*20,vx:(Math.random()-.5)*.3,vy:-.2,vz:.6,life:30,max:30,col:pick([[255,120,30],[255,200,60],[200,50,20]]),size:2+Math.random()*2,kind:"spark"});}
  // festival lanterns
  for(const S of SETS)if(world.sets[S.id].festival&&vis(S.x*16,S.y*16,200)){for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const x=S.x*16+8+Math.cos(a)*56,y=S.y*16+Math.sin(a)*36-10;
    ctx.fillStyle=["#f55","#fd4","#5df","#f7f"][i%4];ctx.beginPath();ctx.arc(x,y+Math.sin(frameN*.05+i)*1.5,2.5,0,7);ctx.fill();}}
  // flying dragon shadows overhead
  for(const f of flyers){const im=IMG["dragon_"+f.k];drawShadow(f.x,f.y+60,30,8);if(im){ctx.save();ctx.translate(f.x,f.y+Math.sin(frameN*.05)*4);if(f.vx>0)ctx.scale(-1,1);ctx.globalAlpha=.95;ctx.scale(1,1+Math.sin(frameN*.18)*.08);ctx.drawImage(im,-im.width/4,-im.height/4,im.width/2,im.height/2);ctx.restore();ctx.globalAlpha=1;}}
  for(const f of floats){ctx.globalAlpha=Math.min(1,f.life/20);ctx.font="bold 8px system-ui";ctx.textAlign="center";ctx.fillStyle="#000";ctx.fillText(f.t,f.x+7,f.y+1);ctx.fillStyle=f.c;ctx.fillText(f.t,f.x+6,f.y);}ctx.globalAlpha=1;
  // night lights (in world space)
  const dk=darkness();if(dk>0.15){ctx.globalCompositeOperation="lighter";for(const b of buildings)if(vis(b.x*16,b.y*16,60)){const x=b.x*16+32,y=(b.y+b.h)*16-14;const g=ctx.createRadialGradient(x,y,2,x,y,40);g.addColorStop(0,`rgba(255,190,90,${dk*.45})`);g.addColorStop(1,"rgba(255,150,50,0)");ctx.fillStyle=g;ctx.fillRect(x-40,y-40,80,80);}
    ctx.globalCompositeOperation="source-over";}
  ctx.restore();
  // screen space: tint, weather, vignette
  const h=world.min/60;let tint=null;
  if(h<5||h>=21)tint=`rgba(20,25,80,${0.5*dk/0.6})`;else if(h<7)tint=`rgba(255,140,80,${0.18*(7-h)/2})`;else if(h>=18)tint=h<20?`rgba(255,110,60,${0.12+0.1*(h-18)})`:`rgba(40,30,100,${dk*0.8})`;
  if(tint){ctx.fillStyle=tint;ctx.fillRect(0,0,W,H);}
  if(dk>0.15){ctx.globalCompositeOperation="lighter";const g=ctx.createRadialGradient(hero.x+6-camX,hero.y+6-camY,4,hero.x+6-camX,hero.y+6-camY,60);g.addColorStop(0,`rgba(255,220,150,${dk*.3})`);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation="source-over";}
  const wth=world.weather;if(wth==="rain"||wth==="storm"){ctx.strokeStyle="rgba(180,200,255,.45)";ctx.beginPath();for(let i=0;i<(wth==="storm"?90:50);i++){const x=(hash2(i,frameN>>1,8)*W),y=(hash2(i,frameN>>1,9)*H);ctx.moveTo(x,y);ctx.lineTo(x-3,y+8);}ctx.stroke();
    ctx.fillStyle="rgba(30,40,70,.18)";ctx.fillRect(0,0,W,H);if(wth==="storm"&&frameN%400<4){ctx.fillStyle="rgba(255,255,255,.6)";ctx.fillRect(0,0,W,H);}}
  drawClouds();
  if(wth==="fog"){ctx.fillStyle="rgba(220,225,235,.28)";ctx.fillRect(0,0,W,H);}
  const vg=ctx.createRadialGradient(W/2,H/2,H*0.45,W/2,H/2,W*0.7);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(20,0,30,.45)");ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  if(banner&&banner.life>0){banner.life--;ctx.globalAlpha=Math.min(1,banner.life/30);ctx.textAlign="center";ctx.font="bold 20px Georgia,serif";ctx.fillStyle="#2a1008";ctx.fillText(banner.t,W/2+1,52);ctx.fillStyle="#ffe08a";ctx.fillText(banner.t,W/2,51);
    ctx.font="italic 9px Georgia,serif";ctx.fillStyle="#fff4d0";ctx.fillText(banner.sub,W/2,63);ctx.strokeStyle="#e8c060";ctx.beginPath();ctx.moveTo(W/2-70,56);ctx.lineTo(W/2+70,56);ctx.stroke();ctx.globalAlpha=1;}
  if(fishing){ctx.font="bold 12px system-ui";ctx.textAlign="center";ctx.fillStyle=fishing.t>=fishing.bite?"#ff5":"#fff";ctx.fillText(fishing.t>=fishing.bite?"!!! BITE — press A":"~ fishing ~",hero.x+6-camX,hero.y-12-camY);}
  const hint=interactHint();if(hint){ctx.font="bold 8px system-ui";ctx.textAlign="center";const tw=ctx.measureText(hint).width+8;ctx.fillStyle="rgba(20,10,30,.7)";ctx.fillRect(hero.x+6-camX-tw/2,hero.y-camY-20,tw,11);ctx.fillStyle="#ffe8a0";ctx.fillText(hint,hero.x+6-camX,hero.y-camY-12);}
}
function interactHint(){if(frameN%10!==0&&interactHint.c!==undefined)return interactHint.c;let h=null;
  if(hero.boat)h=null;else if(npcs.some(n=>n.alive&&!n.inside&&near(n.x+6,n.y+6,20)))h="A: Talk";else if(P.boat.owned&&near(P.boat.x+14,P.boat.y+18,26))h="A: Board boat";
  else if(buildings.some(b=>{const d=doorOf(b);return near(d.x+4,d.y-2,16);}))h=doorLocked(buildings.find(b=>{const d=doorOf(b);return near(d.x+4,d.y-2,16);}))?"🔒 Locked":"A: Enter";else if(waystones.some(w=>near(w.x*TILE+8,w.y*TILE+8,22)))h="A: Waystone";
  else if(objects.some(o=>near(o.x*TILE+8,o.y*TILE+8,22)))h=objects.find(o=>near(o.x*TILE+8,o.y*TILE+8,22)).type==="lookout"?"A: Look out":"A: Open";else if(tAt(heroTile().tx,heroTile().ty)===CLIFF)h="↑ Climb (stamina) · ↓ Jump down";return interactHint.c=h;}
function darkness(){const h=world.min/60;if(h>=21||h<4)return .6;if(h>=19)return (h-19)/2*.6;if(h<6)return (6-h)/2*.6;return 0;}
function drawBuilding(b){ctx.fillStyle="rgba(30,15,10,.25)";ctx.beginPath();ctx.ellipse(b.x*16+32+4,(b.y+b.h)*16+2,36,7,0,0,7);ctx.fill();const s0=buildingSprite(b);const s={width:s0.lw,height:s0.lh};const x=b.x*16,y=(b.y+b.h)*16-s.height;ctx.drawImage(s0,x,y,s.width,s.height);const st=world.bld[b.id];
  if(st.dmg>0.05){ctx.globalAlpha=Math.min(.8,st.dmg);ctx.fillStyle="#1a0e0a";for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(x+8+hash2(b.id,i,1)*48,y+8+hash2(b.id,i,2)*40,6,4,0,0,7);ctx.fill();}
    ctx.strokeStyle="#3a2010";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+10,y+20);ctx.lineTo(x+24,y+30);ctx.moveTo(x+44,y+14);ctx.lineTo(x+54,y+26);ctx.stroke();ctx.lineWidth=1;ctx.globalAlpha=1;}
  if(darkness()>0.15){ctx.globalCompositeOperation="lighter";ctx.fillStyle=`rgba(255,200,100,${darkness()*.6})`;ctx.fillRect(x+8,y+s.height-22,10,9);ctx.fillRect(x+s.width-18,y+s.height-22,10,9);ctx.globalCompositeOperation="source-over";}}
// ===== START =====
function beginPlay(){state="play";document.getElementById("overlay").classList.add("hidden");document.getElementById("hudWrap").classList.remove("hidden");
  magicInit();updateSpellBtn();for(const s of world.sets)if(!s.jobs.length)genJobs(s);if(P.house>=0)buildings[P.house].owned=true;P.homes=P.homes||(P.house>=0?[P.house]:[]);for(const id of P.homes)if(buildings[id])buildings[id].owned=true;if(typeof applyOutfit==="function")applyOutfit();
  if(P.boarded){hero.boat=true;}updateHearts();updateHud();drawMini();checkRank();}
function newGame(){newWorld();resetHero();magicInit();P.boat.x=piers[0].bx-14;P.boat.y=piers[0].by-18;if(!localStorage.getItem("realmIntroSeen"))startIntro();else{hero.x=(castleObj.x+2.6)*TILE;hero.y=(castleObj.y+3.4)*TILE;beginPlay();toast("A new life begins. Go wherever you like!");saveGame();}}
document.getElementById("startBtn").addEventListener("click",()=>newGame());
document.getElementById("contBtn").addEventListener("click",()=>{if(loadGame())beginPlay();});
let last=performance.now(),acc=0;const STEP=1000/60;
function loop(now){audioUpdate();const fd=Math.min(100,now-last);acc+=fd;last=now;framePace(fd);let n=0;while(acc>=STEP&&n<5){snapPrev();update();acc-=STEP;n++;}if(n>=5)acc=0;interpOn(acc/STEP);try{draw();}finally{interpOff();}requestAnimationFrame(loop);}
window.addEventListener("pagehide",saveGame);document.addEventListener("visibilitychange",()=>{if(document.hidden)saveGame();});
// init
// ===== MAGIC =====
const SPELLS={
 fireball:{n:"Fire",ic:"🔥",mp:12,col:[255,120,30]},
 thunder:{n:"Thunder Blast",ic:"⚡",mp:22,col:[200,180,255]},
 heal:{n:"Heal",ic:"✚",mp:20,col:[120,255,140]},
 air:{n:"Air Slash",ic:"🌪",mp:10,col:[190,255,220]},
};
const SPELL_ORDER=Object.keys(SPELLS);
let fx=[],walls=[],curSpell="fireball",castPressed=false;
function magicInit(){if(!P.mag)P.mag={mp:100,max:100,known:[],lv:{},xp:{},blade:0};P.mag.known=SPELL_ORDER.slice();if(!P.mag.xp)P.mag.xp={};}
function unlockSpells(){const m=P.mag;m.known=SPELL_ORDER.slice();return;for(const k of SPELL_ORDER){const s=SPELLS[k];if(m.known.includes(k))continue;
  if(s.rank!=null&&P.rank>=s.rank){m.known.push(k);toast("New spell learned: "+s.n+"!");}}}
function learnTome(k){if(!P.mag.known.includes(k)){P.mag.known.push(k);toast("Tome read! Learned "+SPELLS[k].n+"!");}}
const spellLv=k=>1+Math.floor((P.mag.xp[k]||0)/8);
function wantCast(){const k=keys.KeyL||touch.c||latch.KeyL;latch.KeyL=false;if(k&&!castPressed){castPressed=true;return true;}if(!k)castPressed=false;return false;}
function spellHit(e,dmg,ang){if(e.dead)return;dmg+=(P.gear&&P.gear.focus)||0;e._spell=1;for(let i=0;i<dmg;i++){e.iframes=0;if(e.sp==="dragon"){e.fly=Math.min(e.fly,0)||e.fly;hitDragon(e,ang);}else hurtEnemy(e,1,ang,true);if(e.dead)break;}}
function burst(x,y,col,n,sp,size){for(let i=0;i<n;i++){const a=Math.random()*7,s=Math.random()*sp;particles.push({x,y,z:4+Math.random()*6,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:Math.random()*2,life:20+Math.random()*25,max:45,col:[clamp(col[0]+(Math.random()-.5)*60,0,255),clamp(col[1]+(Math.random()-.5)*60,0,255),clamp(col[2]+(Math.random()-.5)*60,0,255)],size:size||2,kind:"magic"});}}
function castSpell(k){
  if(hero)hero.castT=20;
  k=k||curSpell;const s=SPELLS[k],m=P.mag;SPCD[k]=SPCD[k]||0;if(SPCD[k]>performance.now())return false;SPCD[k]=performance.now()+SPCDMS(k);if(!m.known.includes(k))return false;if(m.mp<s.mp){toast("Not enough mana.");return false;}
  m.mp-=s.mp;m.xp[k]=(m.xp[k]||0)+1;const lv=spellLv(k);if((m.xp[k])%8===0)toast(s.n+" reached level "+lv+"!");
  const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];const cx=hero.x+6,cy=hero.y+6;const ang=Math.atan2(dy,dx);
  // aim at nearest hostile if any
  let tgt=null,bd=200;for(const e of mobs)if(!e.dead&&e.def&&e.def.beh!=="pea"&&e.def.beh!=="flee"){const d=Math.hypot(e.x+e.w/2-cx,e.y+e.h/2-cy);if(d<bd){bd=d;tgt=e;}}
  const aim=tgt?Math.atan2(tgt.y+tgt.h/2-cy,tgt.x+tgt.w/2-cx):ang;
  switch(k){
  case "fireball":fx.push({k,x:cx,y:cy,vx:Math.cos(aim)*3.2,vy:Math.sin(aim)*3.2,life:70,dmg:2+Math.floor(lv/2),r:4+lv*.5});break;
  case "heal":{const amt=2+Math.floor(lv/2);const before=Math.max(0,hero.hp);hero.hp=Math.min(hero.maxHp,before+amt);updateHearts();floatText(cx,cy-14,"+"+(hero.hp-before)+" HP","#7dff8a");SFX.chime();burst(cx,cy,[120,255,140],24,1.2,2);
    try{for(const n of (typeof partyMembers==="function"?partyMembers():[])){if(Math.hypot(n.x-hero.x,n.y-hero.y)<120){if(n.adv&&n.adv.hp!=null&&n.adv.maxHp)n.adv.hp=Math.min(n.adv.maxHp,n.adv.hp+amt*2);if(n.hp!=null&&n.maxHp)n.hp=Math.min(n.maxHp,n.hp+amt*2);burst(n.x+8,n.y+8,[255,230,120],14,1,2);floatText(n.x+8,n.y-8,"+HP","#7dff8a");}}}catch(_){}}burst(cx,cy,s.col,40,1.5,2);fx.push({k:"ring",x:cx,y:cy,r:2,max:30,life:30,col:s.col});break;
  case "thunder":{const R=70+lv*6,segs=[];for(const e of mobs){if(e.dead||e.def.beh==="pea"||e.def.beh==="flee")continue;const ex=e.x+e.w/2,ey=e.y+e.h/2;if(Math.hypot(ex-cx,ey-cy)>R)continue;segs.push([{x:cx,y:cy},{x:ex,y:ey}]);spellHit(e,2+Math.floor(lv/2),Math.atan2(ey-cy,ex-cx));burst(ex,ey,s.col,10,2,2);}
    for(const p of projectiles)if(!p.friendly&&Math.hypot(p.x-cx,p.y-cy)<R){p.dead=true;burst(p.x,p.y,s.col,8,1.5,2);if(typeof clashCount!=="undefined")clashCount++;}projectiles=projectiles.filter(p=>!p.dead);
    for(let i=0;i<6;i++){const a2=i/6*Math.PI*2;segs.push([{x:cx,y:cy},{x:cx+Math.cos(a2)*R*.8,y:cy+Math.sin(a2)*R*.5}]);}
    fx.push({k:"bolt",segs,life:16});fx.push({k:"ring",x:cx,y:cy,r:4,max:R,life:24,col:s.col});shake=5;break;}
  case "air":fx.push({k:"air",x:cx,y:cy,vx:Math.cos(aim)*4.6,vy:Math.sin(aim)*4.6,life:46,dmg:1+Math.floor(lv/2),pierce:true,hit:new Set(),ang:aim});break;
  }
  SFX.spell(k==="air"?"dash":k==="thunder"?"chain":k);return true;
}
function updateMagic(){const m=P.mag;if(!m)return;
  m.mp=Math.min(m.max,m.mp+0.07+(curSet?0.05:0));
  if(!hero.dead&&!hero.boat&&!fishing&&wantCast())castSpell();
  for(const f of fx){f.life--;
    if(f.vx!=null){f.x+=f.vx;f.y+=f.vy;const col=SPELLS[f.k]?SPELLS[f.k].col:[255,90,220];
      if(frameN%2===0)particles.push({x:f.x,y:f.y,z:6,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,vz:.2,life:18,max:18,col,size:f.k==="fireball"?3:2,kind:"magic"});
      if(blocked(f.x-2,f.y-2,4,4)&&f.k!=="air"){f.life=0;burst(f.x,f.y,col,14,2,2);continue;}
      for(const e of mobs){if(e.dead||(f.hit&&f.hit.has(e)))continue;if(f.x>e.x-4&&f.x<e.x+e.w+4&&f.y>e.y-6&&f.y<e.y+e.h+4){
        if(f.k==="fireball"){for(const o of mobs)if(!o.dead&&Math.hypot(o.x+o.w/2-f.x,o.y+o.h/2-f.y)<26+f.r*2)spellHit(o,f.dmg,Math.atan2(o.y-f.y,o.x-f.x));burst(f.x,f.y,[255,140,40],40,3,3);shake=5;f.life=0;break;}
        f.hit.add(e);spellHit(e,f.dmg,f.ang);burst(f.x,f.y,col,10,2,2);}}}
    if(f.k==="ring")f.r+=(f.max-f.r)*0.15;}
  fx=fx.filter(f=>f.life>0);
}
function drawMagic(){
  ctx.globalCompositeOperation="lighter";
  for(const f of fx){
    if(f.k==="fireball"){const g=ctx.createRadialGradient(f.x,f.y-6,1,f.x,f.y-6,f.r*2.5);g.addColorStop(0,"rgba(255,255,200,1)");g.addColorStop(.4,"rgba(255,140,30,.9)");g.addColorStop(1,"rgba(255,40,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y-6,f.r*2.5,0,7);ctx.fill();}
    else if(f.k==="air"){ctx.save();ctx.translate(f.x,f.y-6);ctx.rotate(f.ang);ctx.strokeStyle="rgba(200,255,230,.9)";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(-2,0,10,-1.1,1.1);ctx.stroke();ctx.strokeStyle="rgba(255,255,255,.7)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(-6,0,8,-1,1);ctx.stroke();ctx.restore();}
    else if(f.k==="bolt"){ctx.strokeStyle=`rgba(210,190,255,${f.life/14})`;ctx.lineWidth=2.5;ctx.beginPath();for(const [a,b] of f.segs){ctx.moveTo(a.x,a.y-6);for(let i=1;i<=5;i++){const t=i/5;ctx.lineTo(a.x+(b.x-a.x)*t+(i<5?(Math.random()-.5)*10:0),a.y+(b.y-a.y)*t-6+(i<5?(Math.random()-.5)*10:0));}}ctx.stroke();ctx.lineWidth=1;}
    else if(f.k==="ring"){ctx.strokeStyle=`rgba(${f.col[0]},${f.col[1]},${f.col[2]},${f.life/30})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*.55,0,0,7);ctx.stroke();ctx.lineWidth=1;}
  }
  if(false){ctx.fillStyle=`rgba(255,90,220,${.25+.15*Math.sin(frameN*.3)})`;ctx.beginPath();ctx.arc(hero.x+6,hero.y+4,10,0,7);ctx.fill();}
  ctx.globalCompositeOperation="source-over";
}
// spell wheel UI
const wheelEl=document.getElementById("wheel");
function openWheel(){if(state!=="play")return;paused=true;wheelEl.innerHTML="";const known=P.mag.known;
  SPELL_ORDER.forEach((k,i)=>{const s=SPELLS[k];const b=document.createElement("button");b.type="button";const a=i/SPELL_ORDER.length*Math.PI*2-Math.PI/2;
    b.style.left=`calc(50% + ${Math.cos(a)*110}px - 34px)`;b.style.top=`calc(50% + ${Math.sin(a)*110}px - 34px)`;b.className="sp"+(k===curSpell?" cur":"");
    b.disabled=!known.includes(k);b.innerHTML=`<span>${s.ic}</span><small>${known.includes(k)?s.n+" L"+spellLv(k):"Locked"}</small>`;b.onclick=e=>{e.stopPropagation();curSpell=k;closeWheel();};wheelEl.appendChild(b);});
  const c=document.createElement("div");c.className="wc";c.textContent=SPELLS[curSpell].ic;wheelEl.appendChild(c);wheelEl.classList.remove("hidden");}
function closeWheel(){wheelEl.classList.add("hidden");paused=false;updateSpellBtn();}
wheelEl.addEventListener("click",()=>closeWheel());
function updateSpellBtn(){document.getElementById("btnC").textContent=SPELLS[curSpell].ic;}
touch.c=false;
const btnC=document.getElementById("btnC");
btnC.addEventListener("touchstart",e=>{e.preventDefault();touch.c=true;btnC.classList.add("active");touch.cId=e.changedTouches[0].identifier},{passive:false});
window.addEventListener("touchend",e=>{for(const t of e.changedTouches)if(t.identifier===touch.cId){touch.c=false;btnC.classList.remove("active");}});
document.getElementById("btnW").addEventListener("click",e=>{e.stopPropagation();openWheel();});
document.getElementById("btnW").addEventListener("touchstart",e=>{e.preventDefault();openWheel();},{passive:false});
window.addEventListener("keydown",e=>{if(e.code==="KeyQ"&&state==="play"){wheelEl.classList.contains("hidden")?openWheel():closeWheel();}
  const n=parseInt(e.key);if(n>=1&&n<=4&&state==="play"){const k=SPELL_ORDER[n-1];curSpell=k;updateSpellBtn();if(!paused)castSpell(k);}});
// ===== SUMMONING INTRO =====
const INTRO=["A circle of light blazes across the marble floor...","KING ALDRIC: \"It worked! Welcome, hero from another world.\"","\"Forgive the abrupt summons. Our realm needed someone with your strength... and your magic.\"","\"But I will not chain you to a quest. Live as you wish: hunt, trade, love, explore.\"","\"Should you earn the people's trust, perhaps one day you will wear this crown after me.\"","\"My castle doors are always open. Now go, the Realm of Ten Winds awaits!\""];
let introStep=0,introT=0;
function startIntro(){state="intro";introStep=0;introT=0;document.getElementById("overlay").classList.add("hidden");document.getElementById("introBox").classList.remove("hidden");document.getElementById("introText").textContent=INTRO[0];}
function advanceIntro(){if(state!=="intro")return;introStep++;if(introStep>=INTRO.length){endIntro();return;}document.getElementById("introText").textContent=INTRO[introStep];}
function endIntro(){document.getElementById("introBox").classList.add("hidden");P.introDone=true;localStorage.setItem("realmIntroSeen","1");
  hero.x=(castleObj.x+2.6)*TILE;hero.y=(castleObj.y+3.4)*TILE;beginPlay();toast("You are free to go anywhere. Visit the castle for royal requests.");saveGame();}
document.getElementById("introBox").addEventListener("click",e=>{e.stopPropagation();advanceIntro();});
document.getElementById("introSkip").addEventListener("click",e=>{e.stopPropagation();endIntro();});
window.addEventListener("keydown",e=>{if(state==="intro"&&(e.code==="Enter"||e.code==="Space"||e.code==="KeyJ")){e.preventDefault();advanceIntro();}});
function drawIntro(){introT++;const t=introT;ctx.fillStyle="#2a0c18";ctx.fillRect(0,0,W,H);
  const fl=ctx.createLinearGradient(0,60,0,H);fl.addColorStop(0,"#5a3a48");fl.addColorStop(1,"#2a1a24");ctx.fillStyle=fl;ctx.fillRect(0,60,W,H);
  for(let x=0;x<W;x+=32){ctx.strokeStyle="rgba(255,220,180,.08)";ctx.beginPath();ctx.moveTo(x,60);ctx.lineTo(W/2+(x-W/2)*2,H);ctx.stroke();}
  ctx.fillStyle="#a01a2a";ctx.beginPath();ctx.moveTo(W/2-18,60);ctx.lineTo(W/2+18,60);ctx.lineTo(W/2+40,H);ctx.lineTo(W/2-40,H);ctx.fill();ctx.strokeStyle="#e8c060";ctx.stroke();
  for(const px of [40,W-56]){const g=ctx.createLinearGradient(px,0,px+16,0);g.addColorStop(0,"#b08a3a");g.addColorStop(.5,"#ffe08a");g.addColorStop(1,"#8a6a2a");ctx.fillStyle=g;ctx.fillRect(px,0,16,H);
    ctx.fillStyle="#5ff";ctx.beginPath();ctx.arc(px+8,40,3,0,7);ctx.fill();}
  ctx.fillStyle="#6a2a8a";ctx.fillRect(W/2-20,14,40,46);ctx.fillStyle="#e8c060";ctx.fillRect(W/2-24,10,48,6);ctx.fillRect(W/2-24,50,48,10);ctx.fillStyle="#f5f";ctx.beginPath();ctx.arc(W/2,22,3,0,7);ctx.fill();
  // king
  const k=personSprite({skin:[240,200,170],hair:[230,230,230],cloth:[150,30,60],trim:[255,215,90],leg:[80,30,60],long:true,hat:null},0);
  ctx.drawImage(k,W/2-12,26,24,24);ctx.fillStyle="#ffd84a";ctx.beginPath();ctx.moveTo(W/2-7,30);ctx.lineTo(W/2-5,22);ctx.lineTo(W/2,27);ctx.lineTo(W/2+5,22);ctx.lineTo(W/2+7,30);ctx.fill();
  // magic circle
  const cx=W/2,cy=H-70;ctx.save();ctx.globalCompositeOperation="lighter";for(let r=0;r<3;r++){ctx.strokeStyle=`rgba(${120+r*40},${200},255,${.6-r*.15})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy,50-r*12,20-r*5,0,0,7);ctx.stroke();}
  ctx.translate(cx,cy);ctx.scale(1,.4);ctx.rotate(t*.02);ctx.strokeStyle="rgba(200,255,255,.7)";ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*Math.PI*2,b=(i+2)/6*Math.PI*2;ctx.moveTo(Math.cos(a)*48,Math.sin(a)*48);ctx.lineTo(Math.cos(b)*48,Math.sin(b)*48);}ctx.stroke();
  ctx.fillStyle="rgba(180,255,255,.9)";ctx.font="10px serif";for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.fillText("ᚠᚢᚦᚨᚱᚲ"[i%6],Math.cos(a)*40-3,Math.sin(a)*40+3);}ctx.restore();
  const beam=introStep===0?Math.min(1,t/60):Math.max(0,1-(t-60)/80);if(beam>0){ctx.globalCompositeOperation="lighter";const g=ctx.createLinearGradient(cx-20,0,cx+20,0);g.addColorStop(0,"rgba(120,220,255,0)");g.addColorStop(.5,`rgba(220,255,255,${beam*.8})`);g.addColorStop(1,"rgba(120,220,255,0)");ctx.fillStyle=g;ctx.fillRect(cx-20,0,40,cy);ctx.globalCompositeOperation="source-over";}
  if(Math.random()<.5)particles.push({x:cx+(Math.random()-.5)*90,y:cy+(Math.random()-.5)*30,z:0,vx:0,vy:0,vz:.5,life:40,max:40,col:[150,240,255],size:2,kind:"magic"});
  for(const p of particles){p.z+=p.vz;p.life--;ctx.fillStyle=`rgba(${p.col[0]},${p.col[1]},${p.col[2]},${p.life/40})`;ctx.fillRect(p.x,p.y-p.z,p.size,p.size);}particles=particles.filter(p=>p.life>0);
  if(t>30){ctx.save();ctx.globalAlpha=Math.min(1,(t-30)/40);ctx.drawImage(chibi(HERO_LOOK,3,0),cx-15,cy-40,30,45);ctx.restore();}
}

const SPCD={};const SPCDMS=k=>k==="thunder"?1500:k==="heal"?1200:400;
function buildHotbar(){if(document.getElementById("hotbar"))return;const hb=document.createElement("div");hb.id="hotbar";
  const st=document.createElement("style");st.textContent="#hotbar{position:fixed;right:max(8px,env(safe-area-inset-right));bottom:calc(150px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(4,44px);gap:6px;z-index:20;touch-action:none}#hotbar button{position:relative;width:44px;height:44px;border-radius:12px;border:2px solid #2b1a12;background:rgba(60,40,90,.8);color:#fff;font-size:20px;padding:0;overflow:hidden}#hotbar button.low{opacity:.4}#hotbar .cd{position:absolute;inset:0;pointer-events:none}#hotbar small{position:absolute;left:3px;top:1px;font-size:9px;opacity:.8}@media (orientation:landscape){#hotbar{bottom:calc(130px + env(safe-area-inset-bottom));grid-template-columns:repeat(4,40px)}#hotbar button{width:40px;height:40px}}";
  document.head.appendChild(st);
  SPELL_ORDER.forEach((k,i)=>{const b=document.createElement("button");b.id="sp_"+k;b.title=SPELLS[k].n;b.innerHTML=`<small>${i+1}</small>${SPELLS[k].ic}<span class="cd"></span>`;
    const go=e=>{e.preventDefault();e.stopPropagation();if(state!=="play"||paused)return;curSpell=k;updateSpellBtn();castSpell(k);};
    b.addEventListener("touchstart",go,{passive:false});b.addEventListener("click",go);hb.appendChild(b);});document.body.appendChild(hb);}
function updateHotbar(){if(!P||!P.mag)return;const now=performance.now();for(const k of SPELL_ORDER){const b=document.getElementById("sp_"+k);if(!b)continue;
  b.classList.toggle("low",P.mag.mp<SPELLS[k].mp);const r=Math.max(0,((SPCD[k]||0)-now)/SPCDMS(k));b.lastChild.style.background=r>0?`conic-gradient(rgba(0,0,0,.6) ${r*360}deg,transparent 0)`:"";}}
setInterval(()=>{try{buildHotbar();updateHotbar();}catch(_){}} ,100);
// ===== AUDIO (WebAudio synthesis; soft envelopes, low-pass, master limiter) =====
const AU={ctx:null,set:Object.assign({music:0.4,sfx:0.6,mute:false},JSON.parse(localStorage.getItem("realmAudio")||"{}")),mood:"",nextT:0,step:0,amb:{}};
function saveAudio(){localStorage.setItem("realmAudio",JSON.stringify(AU.set));applyVol();}
function applyVol(){if(!AU.ctx)return;const t=AU.ctx.currentTime,m=AU.set.mute?0:1;
  AU.music.gain.setTargetAtTime(AU.set.music*m*0.5,t,0.3);AU.sfx.gain.setTargetAtTime(AU.set.sfx*m*0.7,t,0.1);AU.ambG.gain.setTargetAtTime(AU.set.sfx*m*0.5,t,0.3);}
function audioInit(){if(AU.ctx)return;const C2=window.AudioContext||window.webkitAudioContext;if(!C2)return;const c=new C2();AU.ctx=c;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=6;comp.attack.value=0.01;comp.release.value=0.25;
  const master=c.createGain();master.gain.value=0.8;const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=6000;
  master.connect(lp);lp.connect(comp);comp.connect(c.destination);AU.master=master;
  const mk=f=>{const g=c.createGain();const l=c.createBiquadFilter();l.type="lowpass";l.frequency.value=f;g.connect(l);l.connect(master);return g;};
  AU.music=mk(2200);AU.sfx=mk(4500);AU.ambG=mk(3000);
  const len=c.sampleRate*2,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);let b=0;for(let i=0;i<len;i++){b=(b+0.02*(Math.random()*2-1))/1.02;d[i]=(Math.random()*2-1)*0.5+b*3;}AU.noise=buf;
  // ambience beds: wind, waves, rain
  const bed=(f,type,q)=>{const s=c.createBufferSource();s.buffer=buf;s.loop=true;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q||0.7;const g=c.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(AU.ambG);s.start();return g;};
  AU.amb={wind:bed(380,"lowpass"),waves:bed(500,"lowpass"),rain:bed(2600,"bandpass",0.6)};
  applyVol();if(c.state==="suspended")c.resume();
}
["pointerdown","touchstart","keydown"].forEach(ev=>window.addEventListener(ev,()=>{audioInit();if(AU.ctx&&AU.ctx.state==="suspended")AU.ctx.resume();},{passive:true}));
function env(g,t,a,peak,dur){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(0.0001,t+a,dur/3);}
function tone(f,dur,o={}){if(!AU.ctx||AU.set.mute)return;const c=AU.ctx,t=c.currentTime+(o.delay||0);const os=c.createOscillator(),g=c.createGain();os.type=o.type||"sine";os.frequency.setValueAtTime(f,t);
  if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+dur);env(g,t,o.a||0.01,o.v||0.2,dur);os.connect(g);g.connect(o.bus||AU.sfx);os.start(t);os.stop(t+dur*2+0.1);}
function noiz(dur,o={}){if(!AU.ctx||AU.set.mute)return;const c=AU.ctx,t=c.currentTime+(o.delay||0);const s=c.createBufferSource();s.buffer=AU.noise;const f=c.createBiquadFilter();f.type=o.ft||"lowpass";f.frequency.setValueAtTime(o.f||1000,t);
  if(o.fTo)f.frequency.exponentialRampToValueAtTime(o.fTo,t+dur);f.Q.value=o.q||0.8;const g=c.createGain();env(g,t,o.a||0.005,o.v||0.2,dur);s.connect(f);f.connect(g);g.connect(o.bus||AU.sfx);s.start(t,Math.random());s.stop(t+dur*2+0.1);}
const SFX={
 swing:()=>noiz(0.16,{ft:"bandpass",f:600,fTo:1800,q:1.2,v:0.18,a:0.02}),
 hit:()=>{tone(150,0.12,{to:70,v:0.3});noiz(0.06,{f:900,v:0.12});},
 blood:()=>noiz(0.18,{f:500,v:0.12,a:0.01}),
 hurt:()=>{tone(220,0.2,{to:140,type:"triangle",v:0.18});},
 step:t=>{const m={7:[700,.05],12:[1500,.045],2:[500,.05],10:[0,0],1:[900,.06]}[t]||[1000,.04];if(t===10)tone(180+Math.random()*30,0.06,{v:0.08,type:"triangle"});else noiz(0.05,{f:m[0]*(0.9+Math.random()*0.2),v:m[1]});},
 swim:()=>noiz(0.3,{f:700,fTo:300,v:0.12,a:0.04}),
 boat:()=>noiz(0.6,{f:400,v:0.08,a:0.2}),
 ui:()=>tone(660,0.08,{v:0.08,type:"triangle"}),
 blip:()=>{for(let i=0;i<3;i++)tone(500+Math.random()*200,0.05,{v:0.05,type:"triangle",delay:i*0.07});},
 coin:()=>{tone(1320,0.12,{v:0.08});tone(1760,0.2,{v:0.07,delay:0.07});},
 chime:()=>{[784,988,1175].forEach((f,i)=>tone(f,0.5,{v:0.06,delay:i*0.09,a:0.02}));},
 spell:k=>{const m={fireball:()=>{noiz(0.5,{f:400,fTo:1500,v:0.2,a:0.05});tone(200,0.4,{to:90,v:0.12});},ice:()=>{tone(1400,0.3,{to:900,v:0.08});tone(2100,0.3,{v:0.04,delay:0.03});},
   heal:()=>[523,659,784,1047].forEach((f,i)=>tone(f,0.6,{v:0.07,delay:i*0.08,a:0.05})),dash:()=>noiz(0.3,{ft:"bandpass",f:400,fTo:2000,v:0.18,a:0.03}),
   wall:()=>{tone(90,0.5,{to:50,v:0.25,a:0.03});noiz(0.4,{f:300,v:0.15});},chain:()=>{for(let i=0;i<4;i++)noiz(0.08,{ft:"bandpass",f:1800,q:2,v:0.12,delay:i*0.05});},
   blade:()=>[440,554,659].forEach((f,i)=>tone(f,0.7,{v:0.06,delay:i*0.05,type:"triangle",a:0.06})),meteor:()=>{noiz(1.2,{f:200,fTo:1200,v:0.22,a:0.4});tone(70,1.4,{to:40,v:0.25,delay:0.9,a:0.02});}}[k];m&&m();},
 explode:()=>{tone(80,0.6,{to:40,v:0.3});noiz(0.6,{f:500,fTo:150,v:0.2});},
 roar:()=>{tone(110,1.0,{to:70,type:"sawtooth",v:0.06,a:0.15});noiz(0.9,{f:300,v:0.12,a:0.15});},
 bird:()=>{const f=2200+Math.random()*900;for(let i=0;i<2+Math.floor(Math.random()*3);i++)tone(f,0.07,{to:f*1.25,v:0.025,delay:i*0.11,bus:AU.ambG});},
};
// generative music by mood
const MOODS={town:{root:261.6,sc:[0,2,4,7,9],bpm:84,pad:"triangle",lead:"triangle",dens:0.45},forest:{root:220,sc:[0,2,3,5,7,9],bpm:72,pad:"sine",lead:"triangle",dens:0.35},
 ocean:{root:196,sc:[0,2,4,6,7,11],bpm:60,pad:"sine",lead:"sine",dens:0.25},night:{root:174.6,sc:[0,3,5,7,10],bpm:56,pad:"sine",lead:"sine",dens:0.2},
 dungeon:{root:146.8,sc:[0,1,3,5,7,8],bpm:66,pad:"sine",lead:"triangle",dens:0.25,drone:1},dragon:{root:164.8,sc:[0,2,3,5,7,8,10],bpm:104,pad:"triangle",lead:"triangle",dens:0.5,pulse:1},
 field:{root:246.9,sc:[0,2,4,7,9],bpm:78,pad:"sine",lead:"triangle",dens:0.3}};
const CHORDS=[0,5,3,4];
function musicTick(){if(!AU.ctx||state!=="play"&&state!=="intro"){return;}const c=AU.ctx;const M=MOODS[AU.mood]||MOODS.field;const beat=60/M.bpm/2;
  if(AU.nextT<c.currentTime)AU.nextT=c.currentTime+0.05;
  while(AU.nextT<c.currentTime+0.4){const t=AU.nextT-c.currentTime,s=AU.step++;const bar=Math.floor(s/16)%4;const deg=CHORDS[bar];
    const n=i=>M.root*Math.pow(2,(M.sc[(deg+i)%M.sc.length]+12*Math.floor((deg+i)/M.sc.length))/12);
    if(s%16===0)[0,2,4].forEach(i=>tone(n(i)/2,beat*14,{type:M.pad,v:0.05,a:beat*4,bus:AU.music,delay:t}));
    if(M.drone&&s%32===0)tone(M.root/4,beat*30,{v:0.06,a:2,bus:AU.music,delay:t});
    if(M.pulse&&s%2===0)tone(M.root/2,beat*0.8,{v:0.035,a:0.03,bus:AU.music,delay:t,type:"sine"});
    if(Math.random()<M.dens&&s%2===0)tone(n(Math.floor(Math.random()*5))*(Math.random()<0.3?2:1),beat*3,{type:M.lead,v:0.045,a:0.04,bus:AU.music,delay:t});
    AU.nextT+=beat;}}
let audT=0;
function audioUpdate(){if(!AU.ctx)return;musicTick();if(++audT%30)return;
  let mood="field";if(state==="intro")mood="town";else if(hero){const {tx,ty}=heroTile();const night=world&&(hour()>=20||hour()<5);
    if(mobs.some(m=>m.sp==="dragon"&&!m.dead&&Math.hypot(m.x-hero.x,m.y-hero.y)<300))mood="dragon";else if(tx<40&&ty<26)mood="dungeon";
    else if(hero.boat||hero.swim||isWater(tAt(tx,ty)))mood="ocean";else if(night)mood="night";else if(curSet)mood="town";else if(biomeAt(tx,ty)==="forest")mood="forest";}
  if(mood!==AU.mood){AU.mood=mood;}
  if(!world||!hero)return;const t=AU.ctx.currentTime;const {tx,ty}=heroTile();let water=0;for(let y=-6;y<=6;y+=3)for(let x=-8;x<=8;x+=4)if(isWater(tAt(tx+x,ty+y)))water++;
  const w=world.weather;AU.amb.waves.gain.setTargetAtTime(Math.min(0.35,water*0.02),t,1);AU.amb.rain.gain.setTargetAtTime(w==="rain"?0.12:w==="storm"?0.2:0,t,1.5);
  AU.amb.wind.gain.setTargetAtTime((biomeAt(tx,ty)==="mountain"?0.3:0.1)+(w==="storm"?0.15:0)+Math.sin(t*0.3)*0.04,t,1.5);
  const day=hour()>=6&&hour()<19;if(day&&state==="play"&&w!=="rain"&&w!=="storm"&&Math.random()<0.12&&["meadow","forest"].includes(biomeAt(tx,ty)))SFX.bird();}
function audioMenu(){paused=true;SFX.ui();menuEl.innerHTML=`<h2>Sound</h2><p>Music <input id="volM" type="range" min="0" max="100" value="${Math.round(AU.set.music*100)}" style="width:60%;touch-action:auto"></p>
 <p>Effects <input id="volS" type="range" min="0" max="100" value="${Math.round(AU.set.sfx*100)}" style="width:60%;touch-action:auto"></p><p><label><input id="mute" type="checkbox" ${AU.set.mute?"checked":""}> Mute all</label></p><div class="mbtns"><button id="audClose" type="button">Done</button></div>`;
  menuEl.classList.remove("hidden");
  document.getElementById("volM").oninput=e=>{AU.set.music=e.target.value/100;saveAudio();};document.getElementById("volS").oninput=e=>{AU.set.sfx=e.target.value/100;saveAudio();SFX.coin();};
  document.getElementById("mute").onchange=e=>{AU.set.mute=e.target.checked;saveAudio();};document.getElementById("audClose").onclick=e=>{e.stopPropagation();closeMenu();};}
document.getElementById("btnSnd").onclick=e=>{e.stopPropagation();audioInit();audioMenu();};
window.__AU=AU;window.__audioSet=(k,v)=>{AU.set[k]=v;saveAudio();};
// ===== ANIMATION RIGS & GRAPHICS POLISH =====
const tx0g=()=>Math.floor(camX/TILE),ty0g=()=>Math.floor(camY/TILE);
function sunVec(){if(!world)return{dx:2,dy:1,a:.28};const h=world.min/60;const t=clamp((h-6)/12,0,1);return{dx:(t-.5)*10,dy:1.5+Math.abs(t-.5)*3,a:darkness()>.3?.14:.28};}
function drawShadow(x,y,rx,ry){const s=sunVec();ctx.fillStyle=`rgba(20,0,30,${s.a})`;ctx.beginPath();ctx.ellipse(x+s.dx*rx/12,y+s.dy*.3,rx*(1+Math.abs(s.dx)/14),ry,0,0,7);ctx.fill();
  ctx.fillStyle=`rgba(20,0,30,${s.a*.6})`;ctx.beginPath();ctx.ellipse(x,y,rx*.6,ry*.7,0,0,7);ctx.fill();}
// ---- image monster rig: head / body / legs slices from the same sprite ----
const rigCache=new Map();
function sliceC(im,x,y,w,h){const c=mkCanvas(Math.max(1,w|0),Math.max(1,h|0));c.getContext("2d").drawImage(im,x,y,w,h,0,0,w,h);return c;}
function imgRig(im){let r=rigCache.get(im);if(r)return r;const W2=im.width,H2=im.height,ly=Math.round(H2*.7),hx=Math.round(W2*.38);
  r={W:W2/2,H:H2/2,legsL:sliceC(im,0,ly,W2/2,H2-ly),legsR:sliceC(im,W2/2,ly,W2/2,H2-ly),head:sliceC(im,0,0,hx,ly),body:sliceC(im,hx,0,W2-hx,ly),ly:ly/2,hx:hx/2};rigCache.set(im,r);return r;}
function drawImgMob(e){
  const r=imgRig(e.img);const t=frameN+(e.x|0);const moving=Math.abs(e.x-(e.px||e.x))+Math.abs(e.y-(e.py||e.y))>0.05;e.px=e.x;e.py=e.y;
  const ph=moving?t*0.35*(e.spd||.5)*2:0;const breathe=Math.sin(t*0.06)*0.03;
  const dying=e.dead?clamp(1-e.flash/30,0,1):0;
  drawShadow(e.x+e.w/2,e.y+e.h-1,r.W*.38*(1-dying*.2),3);
  let lean=0,lx=0;if(e.wind>0){lean=-0.12;lx=-2;}if(e.lunge>0){lean=0.12;lx=4*(e.lunge/10);}
  const flinch=e.iframes>0&&!e.dead?Math.sin(e.iframes*2)*1.5:0;
  ctx.save();ctx.translate(Math.floor(e.x+e.w/2)+flinch,Math.floor(e.y+e.h));
  if(e.dir===2)ctx.scale(-1,1);
  if(dying){ctx.rotate(dying*0.5);ctx.scale(1,1-dying*.55);ctx.globalAlpha=1-dying*.7;}
  ctx.translate(-lx,0);
  if(e.flash>0&&!e.dead)ctx.filter="brightness(2.2)";
  const bob=moving?Math.abs(Math.sin(ph))*-1.6:0;const L=Math.sin(ph)*1.8;
  ctx.drawImage(r.legsL,-r.W/2+L*.4,-r.H+r.ly+Math.max(0,L)*-.8,r.W/2,r.H-r.ly);
  ctx.drawImage(r.legsR,0-L*.4,-r.H+r.ly+Math.max(0,-L)*-.8,r.W/2,r.H-r.ly);
  ctx.save();ctx.translate(0,-r.H+r.ly+bob);ctx.rotate(lean);ctx.scale(1+breathe*.5,1+breathe);
  ctx.drawImage(r.body,-r.W/2+r.hx,-r.ly,r.W-r.hx,r.ly);
  if(!e.cutHead){const hb=Math.sin(ph+1)*0.8+Math.sin(t*0.05)*0.5;ctx.drawImage(r.head,-r.W/2,-r.ly+hb,r.hx,r.ly);}
  ctx.restore();ctx.filter="none";ctx.restore();ctx.globalAlpha=1;
  if(!e.dead&&(e.def.rare||e.provoked&&e.hp<e.maxHp)){const y=e.y+e.h-r.H-5;ctx.fillStyle="#300";ctx.fillRect(e.x,y,e.w,2);ctx.fillStyle="#e44";ctx.fillRect(e.x,y,e.w*e.hp/e.maxHp,2);}
}
function rigDeath(e,ang){if(!e.img||e.sp==="dragon")return;e.flash=30;const r=imgRig(e.img);
  if(bloodOn&&!e.cutHead){e.cutHead=true;const sm=mkCanvas(Math.ceil(r.hx),Math.ceil(r.ly));sm.getContext("2d").drawImage(r.head,0,0,sm.width,sm.height);
    parts.push({spr:sm,x:e.x+e.w/2,y:e.y,z:8,vx:Math.cos(ang)*2.2,vy:Math.sin(ang)*2.2,vz:2.5,rot:0,spin:(Math.random()-.5)*.4,life:260,max:260,grounded:false});}}
// ---- pixel monsters (goblins etc.): bob, squash, windup lunge, collapse ----
function drawEnemy(e){const spr=enemySprite(e);const t=frameN+(e.x|0);const moving=Math.abs(e.x-(e.px||e.x))+Math.abs(e.y-(e.py||e.y))>0.05;e.px=e.x;e.py=e.y;
  drawShadow(e.x+e.w/2,e.y+e.h-1,e.w*.4,2.5);const dying=e.dead?clamp(1-e.flash/6,0,1):0;
  ctx.save();ctx.translate(Math.floor(e.x+e.w/2),Math.floor(e.y+e.h+2));if(e.dir===1)ctx.scale(-1,1);
  const sq=moving?Math.abs(Math.sin(t*.3))*.08:Math.sin(t*.07)*.03;const win=e.state==="windup"||e.state==="slam"?.1:0;
  ctx.rotate(dying*1.2+(e.state==="charge"?.15:0));ctx.scale(1+sq-win*.5,1-sq+win);
  if(e.flash>0)ctx.filter="brightness(2)";if(e.state==="windup")ctx.filter="brightness(1.4) saturate(1.6)";
  const off=e.type==="boss"?24:16;ctx.drawImage(spr,-off/2-(e.type==="boss"?2:0),-off-(moving?Math.abs(Math.sin(t*.3))*1.5:0));ctx.filter="none";ctx.restore();
  if(e.type==="boss"&&!e.dead){ctx.fillStyle="#200";ctx.fillRect(e.x-2,e.y-8,24,4);ctx.fillStyle="#c44";ctx.fillRect(e.x-1,e.y-7,22*(e.hp/e.maxHp),2);}}
// ---- dragon rig: head, wings, tail, body from one image; severable ----
function spawnDragon(kind,x,y,extra){
  const e=spawnMob("dragon",x,y,extra);e.dk=kind;e.dmg=2;e.hp=e.maxHp=40;
  const src=IMG["dragon_"+kind];const W2=src?src.width:224,H2=src?src.height:126;const full=mkCanvas(W2,H2);if(src)full.getContext("2d").drawImage(src,0,0);
  const R2={head:[0,.04,.38,.55],wings:[.45,0,.55,.55],tail:[0,.58,.5,.42]};const rig={W:W2/2,H:H2/2,p:{},r:R2};
  const body=mkCanvas(W2,H2);const bg=body.getContext("2d");bg.drawImage(full,0,0);
  for(const k in R2){const [a,b,c,d]=R2[k];rig.p[k]=sliceC(full,a*W2,b*H2,c*W2,d*H2);bg.clearRect(a*W2,b*H2,c*W2,d*H2);}
  rig.body=body;e.rig=rig;e.img=full;
  e.parts={wings:true,tail:true,horns:true};e.phase=1;e.fly=0;e.persist=true;e.name=DRAGONS[kind].name;e.breathT=0;return e;
}
function severDragon(e,part,ang){
  const rig=e.rig;let piece;
  if(part==="horns"){const h=rig.p.head;piece=sliceC(h,0,0,h.width*.6,h.height*.35);h.getContext("2d").clearRect(0,0,h.width*.6,h.height*.35);}
  else piece=rig.p[part];
  e.parts[part]=false;toast(e.name+"'s "+part+" severed!");SFX.roar();onSever(e,part);
  if(bloodOn){const sm=mkCanvas(Math.ceil(piece.width/2),Math.ceil(piece.height/2));sm.getContext("2d").drawImage(piece,0,0,sm.width,sm.height);
    parts.push({spr:sm,x:e.x+e.w/2,y:e.y+e.h/2,z:14,vx:Math.cos(ang)*2.5,vy:Math.sin(ang)*2.5,vz:3,rot:0,spin:.15,life:420,max:420,grounded:false});spray(e.x+e.w/2,e.y+e.h/2,12,ang,2);}
  else for(let i=0;i<10;i++){const a=Math.random()*7;particles.push({x:e.x+e.w/2,y:e.y+e.h/2,z:6,vx:Math.cos(a)*2,vy:Math.sin(a)*2,vz:2,life:25,max:25,col:C.dust,size:2,kind:"spark"});}
  if(part==="wings")e.fly=0;
}
function breath(e,ang,n){e.breathT=34;e.breathAng=ang;const col=DRAGONS[e.dk].breath;setTimeout(()=>{for(let i=0;i<n;i++){const a=ang+(i-(n-1)/2)*0.12;
  projectiles.push({x:e.x+e.w/2+Math.cos(ang)*20,y:e.y+e.h/2+Math.sin(ang)*10,vx:Math.cos(a)*2.4,vy:Math.sin(a)*2.4,life:80,r:3,dmg:1,col});}},window.__FAST?0:300);}
function drawDragon(e){const rig=e.rig;if(!rig)return;const t=frameN+e.uid0;const fly=e.fly>0?18+Math.sin(frameN*.1)*4:0;const dying=e.dead?clamp(1-e.flash/12,0,1):0;
  drawShadow(e.x+e.w/2,e.y+e.h,rig.W*.4*(fly?0.8:1),6);
  const flip=hero.x>e.x;const W2=rig.W,H2=rig.H,R2=rig.r;
  ctx.save();ctx.translate(Math.floor(e.x+e.w/2),Math.floor(e.y+e.h-fly));if(flip)ctx.scale(-1,1);if(dying){ctx.rotate(dying*.4);ctx.globalAlpha=1-dying*.5;}
  if(e.flash>0&&!e.dead)ctx.filter="brightness(1.9)";
  const ox=-W2/2,oy=-H2+4,br=Math.sin(t*.05)*.02;
  const P=(k,dx,dy,rot,sx,sy,px,py)=>{const [a,b,c,d]=R2[k];const x=ox+a*W2,y=oy+b*H2,w=c*W2,h=d*H2;ctx.save();ctx.translate(x+px*w+dx,y+py*h+dy);ctx.rotate(rot);ctx.scale(sx,sy);ctx.drawImage(rig.p[k],-px*w,-py*h,w,h);ctx.restore();};
  if(e.parts.tail)P("tail",0,0,Math.sin(t*.04)*.12,1,1,.85,.2);
  ctx.save();ctx.scale(1+br,1-br);ctx.drawImage(rig.body,ox,oy,W2,H2);ctx.restore();
  const flapSp=fly?.3:.06;const flap=Math.sin(t*flapSp);
  if(e.parts.wings)P("wings",0,fly?flap*2:0,fly?flap*.1:flap*.03,1,fly?.75+.35*flap:.96+.04*flap,.1,.95);
  const bt=e.breathT>0?Math.sin((34-e.breathT)/34*Math.PI):0;
  P("head",-bt*3,Math.sin(t*.07)*1.5-bt*4,-bt*.18+Math.sin(t*.05)*.03,1,1,.85,.75);
  ctx.filter="none";
  if(e.breathT>0){e.breathT--;ctx.globalCompositeOperation="lighter";const col=DRAGONS[e.dk].breath;const mx=ox+W2*.05-bt*3,my=oy+H2*.3-bt*4;
    const g=ctx.createRadialGradient(mx,my,1,mx,my,14+bt*10);g.addColorStop(0,`rgba(255,255,220,${bt})`);g.addColorStop(.5,`rgba(${col[0]},${col[1]},${col[2]},${bt*.7})`);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(mx,my,24,0,7);ctx.fill();ctx.globalCompositeOperation="source-over";}
  ctx.restore();ctx.globalAlpha=1;
  if(!e.dead){const bw=60;ctx.fillStyle="#200";ctx.fillRect(e.x+e.w/2-bw/2-1,e.y-H2-fly+2,bw+2,5);ctx.fillStyle="#f43";ctx.fillRect(e.x+e.w/2-bw/2,e.y-H2-fly+3,bw*e.hp/e.maxHp,3);
    ctx.font="bold 7px system-ui";ctx.textAlign="center";ctx.fillStyle="#ffe";ctx.fillText(e.name+" · phase "+e.phase,e.x+e.w/2,e.y-H2-fly-1);}}
function drawMob(e){if(e.dead&&e.flash<=0)return;if(e.chibi)return drawFoe(e);if(e.sp==="dragon"){if(e.uid0==null)e.uid0=(Math.random()*999)|0;return drawDragon(e);}if(e.img)return drawImgMob(e);drawEnemy(e);}
// ---- hero / NPC animation ----
function drawNpc(n){const s=npcSprites(n)[n.frame];const child=n.age<15;const t=frameN+n.id*13;const mv=Math.abs(n.x-(n.px||n.x))+Math.abs(n.y-(n.py||n.y))>0.05;n.px=n.x;n.py=n.y;
  drawShadow(n.x+8,n.y+15,5,2);ctx.save();ctx.translate(Math.floor(n.x+8),Math.floor(n.y+16));if(n.dir===1)ctx.scale(-1,1);
  const sc=child?0.72:1;const bob=mv?-Math.abs(Math.sin(t*.25))*1.4:0;const br=mv?0:Math.sin(t*.05)*.025;ctx.scale(sc,sc*(1+br));ctx.rotate(mv?Math.sin(t*.25)*.05:0);ctx.drawImage(s,-8,-16+bob);ctx.restore();
  if(n.spouse===-1||P.dating.includes(n.id)){ctx.fillStyle="#ff6a9a";ctx.font="7px system-ui";ctx.textAlign="center";ctx.fillText("♥",n.x+8,n.y-(child?0:2)+Math.sin(t*.08));}
  if(n.role==="leader"){ctx.fillStyle="#ffd84a";ctx.fillRect(n.x+6,n.y-1,4,2);}
  if(n.cheer&&world&&absMin()<n.cheer){ctx.font="8px system-ui";ctx.textAlign="center";ctx.fillStyle="#ffe060";ctx.fillText(pick(["♪","!","★"]),n.x+8,n.y-6-Math.abs(Math.sin(frameN*.2+n.id))*4);}}
function drawHeroFull(){const t=frameN;const mv=Math.abs(hero.x-(hero.px||hero.x))+Math.abs(hero.y-(hero.py||hero.y))>0.05;hero.px=hero.x;hero.py=hero.y;
  if(hero.castT>0)hero.castT--;
  if(hero.boat){ctx.save();ctx.translate(hero.x-8+14,hero.y-6+20);ctx.rotate(Math.sin(t*.05)*.05);ctx.drawImage(SPR2.boat,-14,-20+Math.sin(t*.08));ctx.restore();
    if(mv&&t%6===0)particles.push({x:hero.x+6,y:hero.y+14,z:0,vx:-(hero.x-hero.px)*.3,vy:0,vz:0,life:30,max:30,col:[230,250,255],size:2,kind:"spark"});}
  if(hero.dead)return;if(hero.iframes>0&&Math.floor(hero.iframes/3)%2===0)return;
  const spr=chibi(HERO_LOOK,hero.dir,hero.swinging>=0||hero.castT>0?4:mv&&!hero.swim?(Math.floor(t/8)%2?1:2):0);
  const clipH=hero.swim?10:hero.boat?13:99;
  if(!hero.boat&&!hero.swim)drawShadow(hero.x+6,hero.y+12,6,2.5);
  ctx.save();if(clipH<99){ctx.beginPath();ctx.rect(hero.x-10,hero.y-26,34,clipH+26);ctx.clip();}
  const bob=(hero.jumpT>0?-Math.sin(hero.jumpT/16*Math.PI)*6:0)+(hero.swim?Math.sin(t*.12)*1.2:mv?-Math.abs(Math.sin(t*.22))*1.5:0);const br=mv?0:Math.sin(t*.06)*.03;
  ctx.translate(Math.floor(hero.x+6),Math.floor(hero.y+12));ctx.scale(1,1+br-(hero.castT>0?-.06:0));ctx.rotate(mv&&!hero.swim?Math.sin(t*.22)*.04:0);
  ctx.drawImage(spr,-CW/2,-CHH+2+bob-(hero.castT>0?2:0));ctx.restore();
  if(hero.swim){ctx.strokeStyle="rgba(255,255,255,.75)";const s=Math.sin(t*.15);ctx.beginPath();ctx.ellipse(hero.x+6,hero.y+8,8+s,3,0,0,7);ctx.stroke();
    ctx.strokeStyle="rgba(220,240,255,.8)";ctx.beginPath();ctx.arc(hero.x+6+s*6,hero.y+5,3,Math.PI,0);ctx.stroke();ctx.beginPath();ctx.arc(hero.x+6-s*6,hero.y+5,3,Math.PI,0);ctx.stroke();}
  if(hero.swinging>=0&&hero.swinging<4){const cx=hero.x+6,cy=hero.y+4;const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];const base=Math.atan2(dy,dx);
    ctx.globalCompositeOperation="lighter";const blade=P.mag&&P.mag.blade>0;for(let i=0;i<4;i++){ctx.strokeStyle=blade?`rgba(255,110,230,${.5-i*.11})`:`rgba(210,230,255,${.55-i*.12})`;ctx.lineWidth=3-i*.5;ctx.beginPath();
      ctx.arc(cx,cy,15-i*1.5,base-1.1+hero.swinging*.45-i*.12,base-0.3+hero.swinging*.45-i*.12);ctx.stroke();}ctx.lineWidth=1;ctx.globalCompositeOperation="source-over";}
  if(hero.castT>0){ctx.globalCompositeOperation="lighter";const c=SPELLS[curSpell].col,a=hero.castT/20;const g=ctx.createRadialGradient(hero.x+6,hero.y-4,1,hero.x+6,hero.y-4,14);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.4,`rgba(${c[0]},${c[1]},${c[2]},${a*.8})`);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(hero.x+6,hero.y-4,14,0,7);ctx.fill();
    ctx.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${a})`;ctx.beginPath();ctx.ellipse(hero.x+6,hero.y+12,10*(1.2-a*.2),4,0,0,7);ctx.stroke();ctx.globalCompositeOperation="source-over";}
  if(P.king){ctx.fillStyle="#ffd84a";ctx.beginPath();ctx.moveTo(hero.x+1,hero.y-3);ctx.lineTo(hero.x+3,hero.y-7);ctx.lineTo(hero.x+6,hero.y-4);ctx.lineTo(hero.x+9,hero.y-7);ctx.lineTo(hero.x+11,hero.y-3);ctx.fill();}}
// ---- ground FX: animated water, grass sway ----
const waveTex=(()=>{const c=mkCanvas(64,32),g=c.getContext("2d");g.strokeStyle="rgba(200,240,255,.55)";g.lineWidth=1.2;for(let i=0;i<5;i++){const y=4+i*6;g.beginPath();for(let x=0;x<=64;x+=2)g.lineTo(x,y+Math.sin(x/64*Math.PI*4+i)*1.6);g.stroke();}return c;})();
function wind(){return Math.sin(frameN*.013)*.6+Math.sin(frameN*.031)*.3+(world&&world.weather==="storm"?1:0);}
function drawGroundFX(tx0,ty0){const tx1=tx0+Math.ceil(W/TILE)+1,ty1=ty0+Math.ceil(H/TILE)+1;const wv=wind();const off=(frameN*.25)%32;
  ctx.globalAlpha=.35;ctx.globalCompositeOperation="lighter";
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){const t=tAt(x,y);if(t===DEEP||t===SHAL){const sx=((x*16+off+y*7)%48+48)%48;ctx.drawImage(waveTex,sx,(y%4)*6,16,16,x*16,y*16+Math.sin(frameN*.03+x)*1.2,16,16);}}
  ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
  const G=GRASSC[season()];ctx.strokeStyle=G[2];ctx.lineWidth=.8;ctx.beginPath();
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){const t=tAt(x,y);if(t!==GRASS&&t!==FLOWER)continue;for(let k=0;k<2;k++){const h=hash2(x,y,300+k);if(h>.55)continue;
    const bx=x*16+hash2(x,y,310+k)*16,by=y*16+hash2(x,y,320+k)*16;const sw=(wv+Math.sin(frameN*.05+bx*.1))*1.6;ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+sw*.4,by-2.5,bx+sw,by-5);ctx.moveTo(bx+2,by);ctx.quadraticCurveTo(bx+2+sw*.4,by-2,bx+2+sw*.8,by-4);}}
  ctx.stroke();ctx.strokeStyle=G[1];ctx.beginPath();
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){const t=tAt(x,y);if(t!==GRASS)continue;const h=hash2(x,y,340);if(h>.3)continue;const bx=x*16+8,by=y*16+12;const sw=(wv+Math.sin(frameN*.05+bx*.1))*1.4;ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+sw*.4,by-3,bx+sw,by-6);}
  ctx.stroke();ctx.lineWidth=1;}
function drawCanopies(){const tx0=tx0g()-1,ty0=ty0g()-1,tx1=tx0+Math.ceil(W/TILE)+3,ty1=ty0+Math.ceil(H/TILE)+3;const wv=wind();const cs=TILESET.canopy;
  const hx=hero.x+6,hy=hero.y+6;
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){if(tAt(x,y)!==TREE)continue;const v=Math.floor(hash2(x,y,5)*4);const sh=chopShake.get(y*WW+x)||0;const sw=(wv+Math.sin(frameN*.04+x*.7+y*.3))*.9+Math.sin(sh*1.8)*sh*.25;
    const cx=x*16-4+sw,cy=y*16-12;const behind=hy<y*16+4&&hy>y*16-18&&Math.abs(hx-(x*16+8))<12;if(behind)ctx.globalAlpha=.55;
    ctx.drawImage(cs[v],cx,cy,24,22);ctx.globalAlpha=1;}}
// ---- torches & glow ----
let torchList=null;
function drawTorches(){if(!torchList){torchList=[];for(const s of SETS)for(const [dx,dy] of [[-4,-3],[4,-3],[-4,3],[4,3]])torchList.push({x:(s.x+dx)*16+8,y:(s.y+dy)*16+8});if(castleObj)torchList.push({x:castleObj.x*16+30,y:(castleObj.y+3)*16},{x:castleObj.x*16+66,y:(castleObj.y+3)*16});}
  const dk=darkness();
  for(const t of torchList){if(t.x<camX-40||t.x>camX+W+40||t.y<camY-40||t.y>camY+H+40)continue;
    ctx.fillStyle="#4a3020";ctx.fillRect(t.x-1,t.y-10,2,10);ctx.fillStyle="#e8c060";ctx.fillRect(t.x-2,t.y-11,4,2);
    const f=Math.sin(frameN*.3+t.x)*.5+Math.random()*.4;ctx.globalCompositeOperation="lighter";
    ctx.fillStyle="#ff9a30";ctx.beginPath();ctx.ellipse(t.x,t.y-13-f,2,3.5+f,0,0,7);ctx.fill();ctx.fillStyle="#fff2a0";ctx.beginPath();ctx.ellipse(t.x,t.y-12.5,1,2,0,0,7);ctx.fill();
    if(dk>0.05){const r=46+f*4;const g=ctx.createRadialGradient(t.x,t.y-10,2,t.x,t.y-10,r);g.addColorStop(0,`rgba(255,170,80,${dk*.75})`);g.addColorStop(1,"rgba(255,120,40,0)");ctx.fillStyle=g;ctx.fillRect(t.x-r,t.y-10-r,r*2,r*2);}
    ctx.globalCompositeOperation="source-over";if(Math.random()<.05)particles.push({x:t.x,y:t.y,z:14,vx:(Math.random()-.5)*.2,vy:0,vz:.3,life:30,max:30,col:[255,200,90],size:1,kind:"spark"});}
  // gem bloom on buildings
  ctx.globalCompositeOperation="lighter";for(const b of buildings){const x=b.x*16+32,y=(b.y+b.h)*16-56;if(x<camX-40||x>camX+W+40||y<camY-40||y>camY+H+40)continue;
    const g=ctx.createRadialGradient(x,y+8,0,x,y+8,9);g.addColorStop(0,`rgba(255,255,255,${.35+.15*Math.sin(frameN*.05+b.id)})`);g.addColorStop(1,"rgba(150,200,255,0)");ctx.fillStyle=g;ctx.fillRect(x-9,y-1,18,18);}
  ctx.globalCompositeOperation="source-over";}
// ---- parallax clouds ----
const cloudSpr=(()=>{const c=mkCanvas(120,60),g=c.getContext("2d");for(let i=0;i<9;i++){const x=20+hash2(i,1,9)*80,y=20+hash2(i,2,9)*20,r=12+hash2(i,3,9)*14;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,"rgba(255,255,255,.9)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}return c;})();
function drawClouds(){const wth=world.weather;const n=wth==="clear"?4:7;const dk=darkness();
  for(let i=0;i<n;i++){const span=W+260;const sx=((hash2(i,7,1)*span+frameN*(.15+i*.03)-camX*.25)%span+span)%span-130;const sy=((hash2(i,8,1)*(H+120)-camY*.25)%(H+120)+H+120)%(H+120)-60;
    ctx.globalAlpha=.10;ctx.filter="none";ctx.drawImage(cloudSpr,sx+30,sy+40,160,80);// ground shadow tint
    ctx.globalAlpha=(wth==="clear"?.16:.28)*(1-dk);ctx.drawImage(cloudSpr,sx,sy,170,85);}ctx.globalAlpha=1;}
// ---- elevation parallax: peak highlights shift slightly with the camera; lookouts ----
function drawPeaks(){const tx0=tx0g(),ty0=ty0g(),tx1=tx0+Math.ceil(W/TILE)+1,ty1=ty0+Math.ceil(H/TILE)+1;const ccx=camX+W/2,ccy=camY+H/2;const snow=season()===3||true;
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){const e=elevAt(x,y);if(e<2)continue;const t=tAt(x,y);if(t!==MTN&&t!==ROCK)continue;
    const px=x*16+8,py=y*16+8;const ox=(px-ccx)*0.02*e,oy=(py-ccy)*0.02*e-e;
    ctx.fillStyle=e===3?"rgba(250,252,255,.55)":"rgba(255,245,220,.18)";ctx.beginPath();ctx.ellipse(px+ox,py+oy,6,4,0,0,7);ctx.fill();}}
function drawLookout(o){const x=o.x*16,y=o.y*16;drawShadow(x+8,y+15,6,2);ctx.fillStyle="#5a3a1a";ctx.fillRect(x+7,y+4,2,12);ctx.fillRect(x+3,y+14,10,2);
  ctx.save();ctx.translate(x+8,y+4);ctx.rotate(-.5+Math.sin(frameN*.01)*.2);ctx.fillStyle="#c8a040";ctx.fillRect(-2,-2,12,4);ctx.fillStyle="#7ff";ctx.fillRect(9,-1.5,2,3);ctx.restore();
  ctx.globalCompositeOperation="lighter";ctx.fillStyle=`rgba(120,255,255,${.25+.15*Math.sin(frameN*.06)})`;ctx.beginPath();ctx.arc(x+8,y+4,7,0,7);ctx.fill();ctx.globalCompositeOperation="source-over";}
function drawNpc(n){const t=frameN+n.id*13;const mv=Math.abs(n.x-(n.px||n.x))+Math.abs(n.y-(n.py||n.y))>0.05;n.vdir=dir4(n.x-(n.px||n.x),n.y-(n.py||n.y),n.vdir||0);n.px=n.x;n.py=n.y;
  const child=n.age<15;drawShadow(n.x+8,n.y+15,5,2);const fr=n.gest>0?4:mv?(Math.floor(t/9)%2?1:2):(n.cheer&&world&&absMin()<n.cheer?(Math.floor(t/12)%2?4:0):0);
  const bob=mv?-Math.abs(Math.sin(t*.25))*1:Math.sin(t*.05)*.4;drawChibi(npcLookC(n),n.x+8,n.y+16+bob,n.vdir,fr,child?0.75:1);
  if(n.spouse===-1||P.dating.includes(n.id)){ctx.fillStyle="#ff6a9a";ctx.font="7px system-ui";ctx.textAlign="center";ctx.fillText("♥",n.x+8,n.y-14+Math.sin(t*.08));}
  if(n.adv&&(P.party||[]).includes(n.id)){ctx.font="bold 6px system-ui";ctx.textAlign="center";ctx.fillStyle="#9ef";ctx.fillText(n.name,n.x+8,n.y-15);}
  if(n.cheer&&world&&absMin()<n.cheer){ctx.font="8px system-ui";ctx.textAlign="center";ctx.fillStyle="#ffe060";ctx.fillText("★",n.x+8,n.y-16-Math.abs(Math.sin(frameN*.2+n.id))*4);}}
// ===== WOODCUTTING & CRAFTING =====
const STUMP=19,SAPLING=20;
const treeHits=new Map(),chopShake=new Map();let fallers=[],pickups=[];
function townTree(tx,ty){for(const s of SETS)if(Math.hypot(tx-s.x,ty-s.y)<s.r+4)return true;if(castleObj&&Math.abs(tx-castleObj.x-3)<7&&Math.abs(ty-castleObj.y-2)<6)return true;return false;}
function chopCheck(){const f=facingPoint(12);const tx=Math.floor(f.x/TILE),ty=Math.floor(f.y/TILE);if(tAt(tx,ty)!==TREE)return false;
  const i=ty*WW+tx;const cx=tx*16+8,cy=ty*16+6;
  if(townTree(tx,ty)){if(!chopCheck.warned||frameN-chopCheck.warned>180){toast("Town trees are protected.");chopCheck.warned=frameN;}return false;}
  const need=P.gear&&P.gear.axe===2?1:P.inv.axe>0?2:4;const h=(treeHits.get(i)||0)+1;treeHits.set(i,h);chopShake.set(i,12);SFX.hit();
  const L=LEAFC[season()];for(let k=0;k<8;k++){const a=Math.random()*7;particles.push({x:cx,y:cy,z:10+Math.random()*8,vx:Math.cos(a)*1.2,vy:Math.sin(a)*.6,vz:.5,life:40,max:40,col:hexRGB(L[k%2]),size:2,kind:"leaf"});}
  for(let k=0;k<5;k++){const a=Math.random()*7;particles.push({x:cx,y:cy+4,z:4,vx:Math.cos(a)*1.6,vy:Math.sin(a)*1.6,vz:1.5,life:25,max:25,col:[200,150,90],size:1.5,kind:"spark"});}
  if(h>=need){treeHits.delete(i);chopShake.delete(i);T[i]=STUMP;invalidateTile(tx,ty);world.trees[i]={st:0,d:world.day};
    fallers.push({x:tx*16-4,y:ty*16-12,v:Math.floor(hash2(tx,ty,5)*4),dir:hero.x<cx?1:-1,t:0});noiz(0.5,{f:300,v:0.2,a:0.05});
    const n=2+Math.floor(Math.random()*2);for(let k=0;k<n;k++)pickups.push({x:cx-6+k*7,y:cy+10+Math.random()*4,item:"wood",t:0});
    toast("Timber! The tree falls.");}
  return true;}
function regrowTrees(){for(const k in world.trees){const r=world.trees[k],i=+k;const age=world.day-r.d;
  if(r.st===0&&age>=2){r.st=1;T[i]=SAPLING;invalidateTile(i%WW,(i/WW)|0);}else if(r.st===1&&age>=5){T[i]=TREE;delete world.trees[k];invalidateTile(i%WW,(i/WW)|0);}}}
function applyTrees(){for(const k in world.trees){const i=+k;T[i]=world.trees[k].st?SAPLING:STUMP;}}
function updateWood(){for(const [k,v] of chopShake){if(v<=1)chopShake.delete(k);else chopShake.set(k,v-1);}
  for(const f of fallers)f.t++;fallers=fallers.filter(f=>f.t<50);
  for(const p of pickups){p.t++;if(p.t>20&&Math.hypot(hero.x+6-p.x,hero.y+8-p.y)<14){p.got=true;P.inv[p.item]=(P.inv[p.item]||0)+1;floatText(p.x,p.y,"+"+(ITEMS[p.item].ic||"")+ITEMS[p.item].n,ITEMS[p.item].fine?"#ffd84a":"#e8c890");if(p.sp){const b=bestiary(p.sp);b.parts[p.item]=(b.parts[p.item]||0)+1;}SFX.coin();}}
  pickups=pickups.filter(p=>!p.got);
  for(const c of world.placed)if(c.type==="campfire"&&Math.random()<.3&&Math.hypot(c.x-hero.x,c.y-hero.y)<400)particles.push({x:c.x+(Math.random()-.5)*4,y:c.y,z:2,vx:(Math.random()-.5)*.2,vy:0,vz:.5+Math.random()*.4,life:25,max:25,col:pick([[255,140,40],[255,210,90]]),size:2,kind:"spark"});}
function drawWoodList(list,vis){
  for(const p of pickups)if(vis(p.x,p.y,20))list.push({y:p.y,f:()=>{const b=p.t<20?-Math.sin(p.t/20*Math.PI)*6:0;
    if(p.item!=="wood"){drawShadow(p.x,p.y+2,4,1.5);ctx.font="9px system-ui";ctx.textAlign="center";ctx.fillText(ITEMS[p.item].ic||"✦",p.x,p.y+b+1+Math.sin(frameN*.1)*1);if(ITEMS[p.item].fine){ctx.globalCompositeOperation="lighter";ctx.fillStyle="rgba(255,220,90,.35)";ctx.beginPath();ctx.arc(p.x,p.y-2+b,6,0,7);ctx.fill();ctx.globalCompositeOperation="source-over";}return;}ctx.fillStyle="#8a5a2a";ctx.fillRect(p.x-5,p.y-3+b,10,4);ctx.fillStyle="#d8b070";ctx.beginPath();ctx.arc(p.x+5,p.y-1+b,2,0,7);ctx.fill();}});
  for(const c of world.placed)if(vis(c.x,c.y,40))list.push({y:c.y+4,f:()=>{if(c.type==="campfire"){drawShadow(c.x,c.y+3,6,2);ctx.fillStyle="#6a4020";ctx.fillRect(c.x-6,c.y,12,3);ctx.fillRect(c.x-2,c.y-2,4,6);
      ctx.globalCompositeOperation="lighter";const f=Math.random()*.4;const g=ctx.createRadialGradient(c.x,c.y-2,1,c.x,c.y-2,30+darkness()*30);g.addColorStop(0,`rgba(255,170,70,${.35+darkness()*.5+f*.1})`);g.addColorStop(1,"rgba(255,120,40,0)");ctx.fillStyle=g;ctx.fillRect(c.x-60,c.y-62,120,120);ctx.globalCompositeOperation="source-over";}
    else{ctx.fillStyle="#9a6a3a";ctx.fillRect(c.x-8,c.y-8,2,10);ctx.fillRect(c.x+6,c.y-8,2,10);ctx.fillRect(c.x-8,c.y-6,16,2);ctx.fillRect(c.x-8,c.y-2,16,2);}}});}
function drawFallers(){for(const f of fallers){const a=Math.min(1,f.t/30)*Math.PI/2*f.dir;ctx.save();ctx.globalAlpha=f.t>35?(50-f.t)/15:1;ctx.translate(f.x+12,f.y+20);ctx.rotate(a);ctx.drawImage(TILESET.canopy[f.v],-12,-20,24,22);ctx.restore();}ctx.globalAlpha=1;}
function craftMenu(){const w=P.inv.wood||0;const ok=n=>w>=n;
  showMenu("Crafting",`Wood: ${w}${P.inv.axe?" · Axe equipped (fast chopping)":" · Tip: buy an axe in shops to chop faster"}`,[
   {l:"Campfire (3 wood)",dis:!ok(3),f:()=>{P.inv.wood-=3;world.placed.push({type:"campfire",x:hero.x+6,y:hero.y+20});toast("Campfire built. Rest beside it with A.");}},
   {l:"Fence (2 wood)",dis:!ok(2),f:()=>{P.inv.wood-=2;const fp=facingPoint(16);world.placed.push({type:"fence",x:fp.x,y:fp.y+6});}},
   {l:"Raft (8 wood)",dis:!ok(8)||P.boat.owned,f:()=>{const {tx,ty}=heroTile();let spot=null;for(let r=1;r<=3&&!spot;r++)for(let dy=-r;dy<=r&&!spot;dy++)for(let dx=-r;dx<=r;dx++)if(isWater(tAt(tx+dx,ty+dy))){spot=[tx+dx,ty+dy];break;}
     if(!spot)return toast("Build a raft at the water's edge.");P.inv.wood-=8;P.boat.owned=true;P.boat.raft=true;P.boat.x=spot[0]*16-6;P.boat.y=spot[1]*16-12;toast("You lash together a raft! Board it with A.");}},
   {l:"Furniture (4 wood)",dis:!ok(4)||P.house<0,f:()=>{P.inv.wood-=4;if(!P.decor)P.decor=[];const d=["plant","bookshelf","painting","rug2"][P.decor.length%4];P.decor.push(d);toast("Crafted a "+d.replace("2","")+" for your home!");}},
   {l:"Upgrade house (10 wood)",dis:!ok(10)||P.house<0,f:()=>{P.inv.wood-=10;P.houseLv=(P.houseLv||0)+1;hero.maxHp=Math.min(14,hero.maxHp+1);hero.hp=hero.maxHp;updateHearts();toast("House upgraded to level "+(P.houseLv+1)+"! (+1 max heart)");}},
   {l:"Close"}]);}
function campfireNear(){return world.placed.find(c=>c.type==="campfire"&&near(c.x,c.y,22));}
// ===== MONSTER PARTS, GEAR CRAFTING, BESTIARY =====
const PARTDEF={fang:["Fang","🦷",9],claw:["Claw","🐾",9],horn:["Horn","📯",12],hide:["Hide","🟫",8],scale:["Scale","🐚",14],wing:["Wing","🪶",16],tail:["Tail","〰️",11],
  eye:["Eye","👁️",13],core:["Core","🔮",22],dscale:["Dragon Scale","🐉",140],dhorn:["Dragon Horn","🔱",220],dheart:["Dragon Heart","❤️‍🔥",400]};
for(const k in PARTDEF){const [n,ic,p]=PARTDEF[k];if(!ITEMS[k])ITEMS[k]={n,p};ITEMS[k].ic=ic;ITEMS[k].part=1;ITEMS[k+"+"]={n:"Fine "+n,p:Math.round(p*2.2),ic,part:1,fine:1};}
ITEMS.horn.n="Horn";const ICONS={bread:"🍞",meat:"🍖",fish:"🐟",berry:"🫐",herb:"🌿",pelt:"🟫",trinket:"🪙",gem:"💎",pearl:"⚪",scale:"🐉",potion:"🧪",flowers:"💐",ring:"💍",amulet:"📿",pie:"🥧",wood:"🪵",axe:"🪓"};
for(const k in ICONS)if(ITEMS[k]&&!ITEMS[k].ic)ITEMS[k].ic=ICONS[k];
const PART_DROPS={goblin:["fang","fang","eye"],crawler:["claw","tail"],spitter:["eye","core"],charger:["horn","hide"],scorchrat:["fang","hide"],umbrawl:["claw","eye"],gloomote:["core","eye"],
 thornback:["hide","claw"],voltusk:["horn","hide"],puffalo:["hide"],fluffin:["hide"],mossnail:["core"],sprigling:["core"],lilyleap:["eye"],pondhop:["eye"],grovegiant:["core","gem"],tidemaw:["scale","fang"],boss:["horn","core","gem"],dragon:["dscale","dscale","dhorn"]};
const SEVER_PART={arm:"claw",arms:"claw",legs:"claw",tail:"tail",horns:"horn",head:"fang",wings:"wing"};
const BEST_DESC={goblin:"Cunning raiders of the woods.",crawler:"Skittering forest hunters with whip tails.",spitter:"Spits acid from range in rocky places.",charger:"Horned brutes that charge in straight lines.",
 scorchrat:"Ember-furred pests of the plains.",umbrawl:"Shadow prowlers that hunt at night.",gloomote:"Haunting spirits of the ruins.",thornback:"Calm unless provoked.",voltusk:"Migrating herds crackling with static.",
 puffalo:"Gentle grazers.",fluffin:"Timid fluffballs.",mossnail:"Slow and harmless.",sprigling:"Shy forest sprites.",lilyleap:"Shoreline hoppers.",pondhop:"Pond frogs with big eyes.",grovegiant:"Rare ancient forest giant.",
 tidemaw:"Rare sea terror of the coasts.",boss:"Ruin Warden, guardian of old stones.",dragon:"Apex wyrms. Rare parts of immense value."};
function bestiary(sp){if(!P.best)P.best={};if(!P.best[sp])P.best[sp]={seen:1,kills:0,parts:{}};return P.best[sp];}
function dropPart(e,item,fine){const k=fine?item+"+":item;pickups.push({x:e.x+e.w/2+(Math.random()-.5)*14,y:e.y+e.h+(Math.random()-.5)*6,item:k,t:0,sp:e.sp});}
function onSever(e,partName){const it=e.sp==="dragon"?(partName==="horns"?"dhorn":partName==="wings"?"wing":"tail"):SEVER_PART[partName];if(!it)return;
  dropPart(e,it,true);toast("Clean sever! A fine "+ITEMS[it].n.toLowerCase()+" drops.");}
function killDrops(e){const tbl=PART_DROPS[e.sp];if(!tbl)return;const b=bestiary(e.sp);b.kills++;
  dropPart(e,pick(tbl),false);if(Math.random()<0.3)dropPart(e,pick(tbl),false);
  if(e.sp==="dragon"){dropPart(e,"dscale",false);if(Math.random()<0.5)dropPart(e,"dheart",false);}}
let swordDmg=()=>1+((P.gear&&P.gear.sword)||0);
const RECIPES=[
 {id:"fangsword",n:"Fang Sword (sword +1)",need:{fang:1,wood:3},f:()=>{P.gear.sword=Math.max(P.gear.sword,1);}},
 {id:"drakeblade",n:"Drake Blade (sword +3)",need:{dscale:2,dhorn:1,wood:5},f:()=>{P.gear.sword=Math.max(P.gear.sword,3);}},
 {id:"hidearmor",n:"Hide Armor (+2 max ♥)",need:{hide:3,wood:2},f:()=>{if(P.gear.armor<1){hero.maxHp+=2-(P.gear.armor?0:0);P.gear.armor=1;}}},
 {id:"scalearmor",n:"Scale Armor (+4 max ♥)",need:{scale:3,core:1},f:()=>{if(P.gear.armor<2){hero.maxHp+=P.gear.armor===1?2:4;P.gear.armor=2;}}},
 {id:"hornaxe",n:"Horn Axe (1-hit chopping)",need:{horn:2,wood:3},f:()=>{P.gear.axe=2;P.inv.axe=(P.inv.axe||0)+1;}},
 {id:"focus",n:"Spell Focus (+30 mana, spells +1)",need:{core:2,eye:1,wood:2},f:()=>{if(!P.gear.focus){P.gear.focus=1;P.mag.max+=30;}}},
 {id:"swift",n:"Charm of Swiftness (+12% speed)",need:{claw:2,gem:1},f:()=>{P.gear.swift=1;}},
 {id:"heart",n:"Wyrmheart Charm (+3 max ♥)",need:{dheart:1},f:()=>{if(!P.gear.heart){P.gear.heart=1;hero.maxHp+=3;}}},
];
const have=k=>(P.inv[k]||0)+(ITEMS[k]&&ITEMS[k].part?(P.inv[k+"+"]||0):0);
function canCraft(r){return Object.entries(r.need).every(([k,n])=>have(k)>=n);}
function craftGear(id){const r=RECIPES.find(r=>r.id===id);if(!r||!canCraft(r))return false;if(!P.gear)P.gear={sword:0,armor:0};let fine=0,tot=0;
  for(const [k,n] of Object.entries(r.need))for(let i=0;i<n;i++){tot++;if(ITEMS[k].part&&(P.inv[k+"+"]||0)>0){P.inv[k+"+"]--;fine++;}else P.inv[k]--;}
  r.f();const master=fine>0&&fine>=tot-(r.need.wood||0);if(master){P.gear.master=(P.gear.master||0)+1;hero.maxHp+=1;}
  hero.hp=hero.maxHp;updateHearts();toast((master?"Masterwork! ":"Crafted: ")+r.n);SFX.chime();saveGame();return true;}
function gearMenu(){if(!P.gear)P.gear={sword:0,armor:0};showMenu("Forge & Workbench",`Sword +${P.gear.sword} · Armor ${P.gear.armor} · ${P.gear.focus?"Focus ":""}${P.gear.swift?"Swift ":""}${P.gear.heart?"Wyrmheart":""}\nFine parts make masterwork gear (+1 ♥).`,
  RECIPES.map(r=>({l:r.n+" — "+Object.entries(r.need).map(([k,n])=>`${n} ${ITEMS[k].ic||""}${ITEMS[k].n}`).join(", "),dis:!canCraft(r),f:()=>{craftGear(r.id);gearMenu();}})).concat([{l:"Wood crafts",f:craftMenu},{l:"Close"}]));}
function bestiaryMenu(){const ks=Object.keys(PART_DROPS);const b=P.best||{};
  showMenu("Bestiary",ks.map(k=>{const e=b[k];return e?`${monName(k)} · slain ${e.kills} · parts: ${PART_DROPS[k].filter((v,i,a)=>a.indexOf(v)===i).map(p=>ITEMS[p].ic).join(" ")}\n   ${BEST_DESC[k]||""}`:"??? (not yet encountered)";}).join("\n")+
  `\n\nDiscovered ${Object.keys(b).length}/${ks.length}`,[{l:"Close"}]);}
// ===== HEROIC RECOGNITION =====
function heroicDeed(sid,kind){const S=SETS[sid];const title=(kind==="dragon"?"Dragonslayer":"Defender")+" of "+S.name;
  if(!P.titles)P.titles=[];const fresh=!P.titles.includes(title);if(fresh)P.titles.push(title);P.deeds=(P.deeds||0)+1;
  const until=absMin()+90;for(const n of npcs)if(n.alive&&n.s===sid){n.friend=Math.min(100,n.friend+10);n.cheer=until;n.deed=title;}
  const dmgB=S.bIdx.filter(b=>world.bld[b].dmg>0.05||world.bld[b].burn>0);const owner=npcs.find(n=>n.alive&&n.s===sid&&dmgB.includes(n.home))||npcs.find(n=>n.alive&&n.s===sid&&n.role!=="child");
  const reward=kind==="dragon"?150:60;P.gold+=reward;if(kind==="dragon"){P.inv.dscale=(P.inv.dscale||0)+1;}
  world.sets[sid].safety=Math.min(2,(world.sets[sid].safety||1)+0.3);world.sets[sid].festival=absMin()+600;
  addNews(sid,`HERO! The wanderer ${kind==="dragon"?"slew the dragon":"drove off the raiders"} attacking ${S.name}. They are hailed as ${title}!`);
  SFX.chime();toast(`🏆 Title earned: ${title}!`);
  if(owner)setTimeout(()=>showMenu(`${owner.name} of ${S.name}`,`"You saved my home! I don't know how to thank you... please, take this: ${reward} gold${kind==="dragon"?" and a dragon scale":""}."\n\nThe townsfolk gather around you, cheering!`,[{l:"You're welcome"}]),window.__FAST?0:800);
  checkRank();saveGame();}
// ===== ADVENTURERS' GUILD =====
const GRANKS=["F","E","D","C","B","A","S"],GPTS=[0,30,80,160,300,500,800];
function guild(){if(!P.guild)P.guild={reg:false,rank:0,pts:0,active:[],done:0};return P.guild;}
function genGuildJobs(force){if(!force&&world.gday===world.day&&world.gjobs)return world.gjobs;world.gday=world.day;let id=1;const J=[];
  const add=(o)=>J.push({id:world.day*100+id++,...o});
  const pr=world.regions.map((p,i)=>[p,i]).sort((a,b)=>b[0]-a[0])[0];
  add({t:"hunt",n:5,have:0,min:0,gold:40,pts:10,txt:"Hunt 5 monsters (population is high in the wild)"});
  add({t:"wood",n:6,min:0,gold:30,pts:8,txt:"Gather 6 Wood for the guild hall"});
  const part=pick(["fang","hide","claw","eye","horn","core"]);add({t:"part",item:part,n:2,min:1,gold:55,pts:14,txt:`Deliver 2 ${ITEMS[part].n} to the alchemists`});
  const to=1+Math.floor(Math.random()*4);add({t:"escort",to,min:1,gold:60,pts:16,txt:`Escort a merchant to ${SETS[to].name}`});
  for(const s of world.sets)if(s.raid)add({t:"raid",s:s.id,min:2,gold:120,pts:30,txt:`Raid defense: protect ${SETS[s.id].name}`});
  if(!P.dungeon)add({t:"dungeon",min:3,gold:200,pts:50,txt:"Clear the Stormcrag dungeon"});
  {const pool=Object.keys(SPECIES).filter(k=>SPECIES[k].mon&&SPECIES[k].biome&&SPECIES[k].beh!=="pea");for(let q=0;q<2;q++){const sp=pool[(Math.random()*pool.length)|0];const d=SPECIES[sp];const tr=d.rare?4:(d.tier||1)-1;add({t:"huntsp",sp,n:d.rare?1:3,have:0,min:tr,gold:d.rare?200:30+tr*40,pts:d.rare?50:8+tr*10,txt:`Bounty: slay ${d.rare?"the":"3"} ${d.name}${d.rare?"":"s"}`});}}
  add({t:"camp",min:2,gold:150,pts:40,txt:"Clear an orc war camp (slay a warchief)"});
  add({t:"dragon",min:4,gold:400,pts:90,txt:"Dragon subjugation: slay any dragon"});
  add({t:"hunt",n:15,have:0,min:3,gold:150,pts:35,txt:"Elite hunt: cull 15 monsters"});
  world.gjobs=J;return J;}
function guildRankUp(){const g=guild();let r=g.rank;while(r<6&&g.pts>=GPTS[r+1])r++;if(r>g.rank){g.rank=r;toast(`Guild rank up! You are now ${GRANKS[r]}-rank.`);SFX.chime();addNews(-1,`The guild promoted the wanderer to ${GRANKS[r]}-rank.`);checkRank();}}
function guildProgress(type,sid){const g=guild();for(const j of g.active){if(j.t===type&&(j.t!=="raid"||j.s===sid)){if(j.t==="hunt")j.have=(j.have||0)+1;else if(j.t==="escort"){if(sid===j.to)j.ok=true;}else j.ok=true;}}}
function jobReady(j){if(j.t==="huntsp")return(j.have||0)>=j.n;if(j.t==="hunt")return(j.have||0)>=j.n;if(j.t==="wood")return(P.inv.wood||0)>=j.n;if(j.t==="part")return have(j.item)>=j.n;if(j.t==="dungeon")return P.dungeon;return!!j.ok;}
function guildTurnIn(){const g=guild();let paid=0;for(const j of g.active.slice()){if(!jobReady(j))continue;
  if(j.t==="wood")P.inv.wood-=j.n;if(j.t==="part")for(let i=0;i<j.n;i++){if((P.inv[j.item]||0)>0)P.inv[j.item]--;else P.inv[j.item+"+"]--;}
  P.gold+=j.gold;g.pts+=j.pts;g.done++;const bonus=pick(["fang","claw","hide","eye","core"]);P.inv[bonus]=(P.inv[bonus]||0)+1;paid+=j.gold;g.active.splice(g.active.indexOf(j),1);
  toast(`Job complete: +${j.gold}g, +${j.pts} GP, +1 ${ITEMS[bonus].n}`);}
  if(paid){SFX.coin();guildRankUp();saveGame();}return paid;}
function guildCard(){const g=guild();return g.reg?`ADVENTURER'S GUILD CARD\nRank: ${GRANKS[g.rank]}   Points: ${g.pts}${g.rank<6?" / "+GPTS[g.rank+1]:""}\nJobs completed: ${g.done}\nTitles: ${(P.titles||[]).join(", ")||"none"}\nActive: ${g.active.map(j=>j.txt+(j.t==="hunt"?` (${j.have||0}/${j.n})`:"")+(jobReady(j)?" ✔":"")).join("; ")||"none"}`:"Not registered. Visit a Guild Hall in Aldmoor, Saltmere or Highcrest.";}
function guildMenu(sid){const g=guild();
  if(!g.reg)return showMenu("Adventurers' Guild","RECEPTIONIST MIRA: \"Welcome! Register as an adventurer? Jobs, pay and glory await. Registration is free.\"",[{l:"Register",f:()=>{g.reg=true;toast("Registered! You are an F-rank adventurer.");addNews(sid,"A new adventurer registered at the guild.");guildMenu(sid);}},{l:"Leave"}]);
  const jobs=genGuildJobs();const paid=guildTurnIn();
  showMenu("Adventurers' Guild",`MIRA: "${paid?`Great work! Here's your pay: ${paid}g.`:g.rank>=4?"Our star adventurer returns!":"How can the guild help you today?"}"\n\n`+guildCard(),
   jobs.filter(j=>!g.active.some(a=>a.id===j.id)).map(j=>({l:`[${GRANKS[j.min]}] ${j.txt} — ${j.gold}g${j.claimed?" (claimed by "+j.claimed+")":""}`,dis:j.min>g.rank||g.active.length>=3||!!j.claimed,f:()=>{g.active.push({...j});toast("Guild job accepted: "+j.txt);guildMenu(sid);}})).concat([{l:"Leave"}]));}
const guildDiscount=()=>P&&P.guild&&P.guild.reg?P.guild.rank*0.03:0;
// ===== WALKABLE INTERIORS =====
let room=null;
const ROOMSZ={house:[10,7],inn:[14,9],shop:[12,8],guild:[18,11],forsale:[12,8],castle:[18,11]};
function buildRoom(b){const kind=b.kind==="castle"?"castle":b.kind;const [w,h]=ROOMSZ[kind]||[10,7];const F=[];const sp={beds:[],work:null,stove:null,spots:[]};
  const add=(type,x,y,fw,fh,solid=true,extra={})=>{F.push({type,x,y,w:fw,h:fh,solid,...extra});};
  add("fire",Math.floor(w/2)-1,1,2,1);add("window",2,0,2,1,false);add("window",w-4,0,2,1,false);add("rug",Math.floor(w/2)-2,Math.floor(h/2)-1,4,3,false);
  if(kind==="house"||kind==="forsale"){add("bed",1,2,1,2);add("bed",w-2,2,1,2);sp.beds=[[1,2.4],[w-2,2.4]];add("stove",w-3,1,1,1);sp.stove=[w-3,2.2];add("table",3,4,2,1);add("chair",2,4,1,1,false);add("chair",5,4,1,1,false);sp.spots=[[4,3],[6,5]];
    if(kind==="forsale"){add("chest",1,h-3,1,1,true,{store:true});const deco=P.decor||[];const slots=[[w-2,h-3],[3,2],[7,2],[w-4,h-2]];deco.slice(0,slots.length).forEach((d,i)=>add(d,slots[i][0],slots[i][1],1,1,d!=="rug2"&&d!=="painting"));}}
  if(kind==="inn"){add("counter",2,3,4,1,true,{act:"inn"});sp.work=[3.5,2.2];add("table",9,7,2,1);add("barrel",7,2,1,1);for(let i=0;i<3;i++){add("bed",w-2,2+i*2,1,2,true,{act:"innbed"});sp.beds.push([w-2,2.4+i*2]);}add("table",5,6,2,1);add("table",2,6,2,1);sp.spots=[[4,7],[7,5]];add("shelf",1,1,2,1);}
  if(kind==="shop"){add("counter",3,3,6,1,true,{act:"shop"});sp.work=[6,2.2];add("shelf",1,1,2,1);add("shelf",w-3,1,2,1);add("barrel",1,h-3,1,1);add("barrel",w-2,h-3,1,1);add("crate",w-3,h-3,1,1);sp.spots=[[4,6]];}
  if(kind==="guild"){add("counter",6,3,6,1,true,{act:"guild"});sp.work=[9,2.2];add("board",1,1,2,1,true,{act:"gboard"});add("ranks",w-4,1,2,1,true,{act:"granks"});add("banner",4,0,1,1,false);add("banner",w-6,0,1,1,false);
    /* tavern corner */add("table",2,7,3,1);add("table",2,9,3,1);add("barrel",w-2,6,1,1,true);add("barrel",w-2,7,1,1,true);add("table",w-6,7,3,1);sp.spots=[[2.5,6.3],[4,6.3],[2.5,8.3],[4,8.3],[w-6,6.3],[w-4.5,6.3],[9,6]];}
  if(kind==="castle"){F.length=0;add("window",2,0,2,1,false);add("window",w-4,0,2,1,false);add("carpet",Math.floor(w/2)-1,2,2,h-3,false);add("throne",Math.floor(w/2)-1,1,2,2,true,{act:"throne"});
    for(const x of [3,w-4])for(const y of [3,6])add("pillar",x,y,1,1);add("banner",5,0,1,1,false);add("banner",w-6,0,1,1,false);sp.spots=[[4,5],[w-5,5]];}
  return{b,kind,w,h,F,sp,door:{x:Math.floor(w/2),y:h-1}};}
function roomSolid(tx,ty){const R=room;if(tx<=0||tx>=R.w-1||ty<=1)return true;if(ty>=R.h-1)return tx!==R.door.x;for(const f of R.F)if(f.solid&&tx>=f.x&&tx<f.x+f.w&&ty>=f.y&&ty<f.y+f.h)return true;return false;}
function roomBlocked(e){const x0=Math.floor(e.x/TILE),y0=Math.floor(e.y/TILE),x1=Math.floor((e.x+e.w-0.01)/TILE),y1=Math.floor((e.y+e.h-0.01)/TILE);for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(roomSolid(tx,ty))return true;return false;}
function doorLocked(b){const h=hour();const night=h>=22||h<6;if(b.kind==="castle"||b.kind==="inn")return false;if(b.kind==="forsale")return!(P.house===b.id||P.rent===b.id);
  if(b.kind==="shop"||b.kind==="guild")return h<7||h>=20;if(!night)return false;
  const occ=npcs.filter(n=>n.alive&&n.home===b.id);if(P.spouse&&occ.some(n=>n.id===P.spouse))return false;return!occ.some(n=>n.friend>=40);}
function enterBuilding(b){if(doorLocked(b)){SFX.ui();toast(b.kind==="forsale"?"This house is for sale. Buy or rent it from the door sign.":b.kind==="shop"||b.kind==="guild"?"Closed for the night. Opens at 7:00.":"The door is locked for the night. (Friends are let in.)");
    if(b.kind==="forsale")buildingMenu(b);return;}
  fadeQuick(()=>{room=buildRoom(b);room.out={x:hero.x,y:hero.y};hero.x=room.door.x*16+2;hero.y=(room.h-2)*16;hero.dir=3;toast("Entered: "+roomName(b));});SFX.ui();}
function roomName(b){return b.kind==="castle"?"Throne Room":b.kind==="forsale"?(P.house===b.id?"Your Home":"Rented Home"):b.kind==="house"?((npcs.filter(n=>n.alive&&n.home===b.id).map(n=>n.name).join(" & ")||"Empty")+"'s home"):SETS[b.s].name+" "+b.kind[0].toUpperCase()+b.kind.slice(1);}
function leaveRoom(){const o=room.out;fadeQuick(()=>{room=null;hero.x=o.x;hero.y=o.y+6;hero.dir=0;});}
function roomNpcs(){if(!room)return[];const b=room.b,h=hour(),list=[];if(b.kind==="castle")return[{king:true,x:(room.w/2-.5)*16,y:1.6*16,name:"King Aldric",sleep:false}];
  let bi=0,si=0;for(const n of npcs){if(!n.alive)continue;
    if(n.work===b.id&&h>=7&&h<20&&room.sp.work){list.push({n,x:room.sp.work[0]*16,y:room.sp.work[1]*16,pose:"work"});continue;}
    if((b.kind==="inn"||b.kind==="guild")&&n.inside&&n.at===b.id&&n.work!==b.id){const seats=b.kind==="guild"?[[2.5,6.3],[4,6.3],[2.5,8.3],[4,8.3],[12,6.3],[13.5,6.3],[2.5,10],[4,10],[9,6.5],[10.5,6.5]]:[[2,5.4],[3.4,5.4],[5,5.4],[6.4,5.4],[2,7.3],[3.4,7.3],[5,7.3],[6.4,7.3],[9,6],[10.5,6]];const p=seats[list.filter(l=>l.pose==="sit").length%seats.length];list.push({n,x:p[0]*16,y:p[1]*16,pose:"sit"});continue;}
    if(n.home===b.id&&n.inside&&(n.at==null||n.at===b.id)){const night=h>=22||h<6;if(night&&room.sp.beds[bi]){const p=room.sp.beds[bi++];list.push({n,x:p[0]*16,y:p[1]*16,pose:"sleep"});}
      else if(room.sp.stove&&si===0&&h>=17){si++;list.push({n,x:room.sp.stove[0]*16,y:room.sp.stove[1]*16,pose:"cook"});}
      else{const p=room.sp.spots[si++%Math.max(1,room.sp.spots.length)]||[4,4];list.push({n,x:p[0]*16+Math.sin(frameN*.01+n.id)*10,y:p[1]*16,pose:"idle"});}}}
  if(P.spouse&&b.id===P.house){const s=npcs.find(n=>n.id===P.spouse);if(s&&!list.some(l=>l.n===s))list.push({n:s,x:5*16,y:4*16,pose:hour()>=22||hour()<6?"idle":"idle"});}
  return list;}
function roomUpdate(){if(hero.iframes>0)hero.iframes--;const {mx,my}=getMoveInput();const spd=1.1;
  if(mx||my){moveEntity(hero,mx*spd,my*spd);hero.anim++;if(hero.anim%6===0){hero.frame^=1;if(hero.frame)SFX.step(10);}if(Math.abs(mx)>Math.abs(my))hero.dir=mx<0?1:2;else hero.dir=my<0?3:0;}
  if(hero.y+12>=(room.h-1)*16&&Math.abs(hero.x+6-(room.door.x*16+8))<10&&my>0)return leaveRoom();
  if(wantAttack())roomInteract();wantDodge();}
function roomInteract(){const hx=hero.x+6,hy=hero.y+6;
  for(const r of roomNpcs()){if(Math.hypot(r.x+8-hx,r.y+8-hy)<24){if(r.king){castleMenu();return;}if(r.pose==="sleep"){toast(r.n.name+" is fast asleep. Zzz...");return;}
    if(r.pose==="work"){const k=room.b.kind;if(k==="shop")return shopMenu(room.b.s);if(k==="guild")return guildMenu(room.b.s);if(k==="inn")return buildingMenu(room.b,true);}return talk(r.n);}}
  for(const f of room.F){const cx=(f.x+f.w/2)*16,cy=(f.y+f.h/2)*16;if(Math.abs(cx-hx)>f.w*8+14||Math.abs(cy-hy)>f.h*8+14)continue;
    if(f.act==="throne")return castleMenu();
    if(f.act==="inn"||f.act==="shop"||f.act==="guild"){toast("Nobody is at the counter right now.");return;}
    if(f.act==="gboard")return guildMenu(room.b.s);
    if(f.act==="granks"){const g=guild();return showMenu("Guild Ranks",GRANKS.map((r,i)=>`${i===g.rank&&g.reg?"▶ ":"   "}${r}-rank — ${GPTS[i]} pts`).join("\n")+"\n\nTop adventurers:\n"+advs().filter(n=>n.alive).sort((a,b)=>b.adv.rank-a.adv.rank||b.adv.lvl-a.adv.lvl).slice(0,5).map(n=>`${GRANKS[n.adv.rank]}  ${n.name} (Lv ${n.adv.lvl} ${n.adv.cls})`).join("\n"),[{l:"Close"}]);}
    if(f.act==="innbed")return buildingMenu(room.b,true);
    if(f.type==="bed"&&room.b.kind==="forsale")return sleep(room.b);
    if(f.store)return storageMenu();
    if(f.type==="fire"){toast("The fire crackles warmly.");return;}}}
function storageMenu(){if(!P.storage)P.storage={};const inv=Object.keys(P.inv).filter(k=>P.inv[k]>0),st=Object.keys(P.storage).filter(k=>P.storage[k]>0);
  showMenu("Storage Chest",`Stored: ${st.map(k=>(ITEMS[k].ic||"")+ITEMS[k].n+" x"+P.storage[k]).join(", ")||"nothing"}`,
   inv.map(k=>({l:`Store all ${ITEMS[k].n} (${P.inv[k]})`,f:()=>{P.storage[k]=(P.storage[k]||0)+P.inv[k];P.inv[k]=0;storageMenu();}})).concat(st.map(k=>({l:`Take ${ITEMS[k].n} (${P.storage[k]})`,f:()=>{P.inv[k]=(P.inv[k]||0)+P.storage[k];P.storage[k]=0;storageMenu();}}))).concat([{l:"Close"}]));}
function skyCol(){const h=world.min/60;if(h<5||h>=21)return["#0a1238","#1a2458"];if(h<7)return["#f8a070","#ffd0a0"];if(h>=18)return["#e86a50","#ffb070"];return["#6ac8ff","#c8f0ff"];}
function drawRoom(){const R=room,Wp=R.w*16,Hp=R.h*16;const ox=Math.round(Math.max(0,(W-Wp)/2)-(Wp>W?clamp(hero.x+6-W/2,0,Wp-W):0)),oy=Math.round(Math.max(0,(H-Hp)/2)-(Hp>H?clamp(hero.y+6-H/2,0,Hp-H):0));
  ctx.fillStyle="#120a10";ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(ox,oy);
  const castle=R.kind==="castle";
  for(let y=2;y<R.h;y++)for(let x=0;x<R.w;x++){ctx.fillStyle=castle?((x+y)%2?"#d8d0e0":"#b8b0c8"):((y%2?x+1:x)%3?"#a8703c":"#946030");ctx.fillRect(x*16,y*16,16,16);if(!castle){ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(x*16,y*16+15,16,1);ctx.fillStyle="rgba(255,230,180,.12)";ctx.fillRect(x*16+((y*7)%16),y*16,1,16);}}
  const wg=ctx.createLinearGradient(0,0,0,32);wg.addColorStop(0,castle?"#8a7ab0":"#f0dcb0");wg.addColorStop(1,castle?"#6a5a90":"#d8bc88");ctx.fillStyle=wg;ctx.fillRect(0,0,Wp,32);
  ctx.fillStyle=castle?"#4a3a70":"#6a4020";ctx.fillRect(0,22,Wp,10);ctx.strokeStyle="#e8c060";ctx.beginPath();ctx.moveTo(0,22.5);ctx.lineTo(Wp,22.5);ctx.stroke();
  ctx.fillStyle="#3a2010";ctx.fillRect(0,0,6,Hp);ctx.fillRect(Wp-6,0,6,Hp);ctx.fillRect(0,Hp-6,Wp,6);ctx.fillStyle="#5a3a1a";ctx.fillRect(R.door.x*16,Hp-8,16,8);ctx.fillStyle="#ffe8a0";ctx.fillRect(R.door.x*16+4,Hp-3,8,2);
  const sky=skyCol();
  for(const f of R.F){const x=f.x*16,y=f.y*16,w=f.w*16,h=f.h*16;
    switch(f.type){
    case "window":{const g=ctx.createLinearGradient(0,y+3,0,y+19);g.addColorStop(0,sky[0]);g.addColorStop(1,sky[1]);ctx.fillStyle="#4a2a14";ctx.fillRect(x+3,y+2,w-6,18);ctx.fillStyle=g;ctx.fillRect(x+5,y+4,w-10,14);ctx.fillStyle="#4a2a14";ctx.fillRect(x+w/2-1,y+4,2,14);ctx.fillRect(x+5,y+10,w-10,2);
      if(darkness()>.3){ctx.fillStyle="#fff";ctx.fillRect(x+8,y+6,1,1);ctx.fillRect(x+w-10,y+8,1,1);}break;}
    case "fire":{ctx.fillStyle="#6a5a5a";ctx.fillRect(x,y-4,w,h+6);ctx.fillStyle="#2a1a1a";ctx.fillRect(x+6,y+2,w-12,h-2);ctx.globalCompositeOperation="lighter";for(let i=0;i<3;i++){const fl=Math.sin(frameN*.3+i)*2;ctx.fillStyle=["#ff6a20","#ffb040","#fff0a0"][i];ctx.beginPath();ctx.ellipse(x+w/2+(i-1)*3,y+h-2-fl,3-i*.5,6-i,0,0,7);ctx.fill();}
      const g=ctx.createRadialGradient(x+w/2,y+h,2,x+w/2,y+h,60);g.addColorStop(0,"rgba(255,160,60,.35)");g.addColorStop(1,"rgba(255,120,40,0)");ctx.fillStyle=g;ctx.fillRect(x+w/2-60,y+h-60,120,120);ctx.globalCompositeOperation="source-over";ctx.fillStyle="#e8c060";ctx.fillRect(x-2,y-6,w+4,3);break;}
    case "rug":case "rug2":{ctx.fillStyle="#a02a3a";ctx.fillRect(x+2,y+2,w-4,h-4);ctx.strokeStyle="#e8c060";ctx.strokeRect(x+4.5,y+4.5,w-9,h-9);ctx.fillStyle="#3a6ad0";ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/5,h/5,0,0,7);ctx.fill();break;}
    case "carpet":ctx.fillStyle="#b01a2a";ctx.fillRect(x+2,y,w-4,h);ctx.strokeStyle="#e8c060";ctx.strokeRect(x+3.5,y,w-7,h);break;
    case "bed":ctx.fillStyle="#5a3418";ctx.fillRect(x+1,y,w-2,h);ctx.fillStyle="#f4ecd8";ctx.fillRect(x+2,y+2,w-4,8);ctx.fillStyle=["#3a6ad0","#c03050","#4aa060"][f.x%3];ctx.fillRect(x+2,y+10,w-4,h-12);break;
    case "stove":ctx.fillStyle="#3a3a44";ctx.fillRect(x+1,y,w-2,h);ctx.fillStyle="#ff8a30";ctx.fillRect(x+4,y+9,w-8,3);break;
    case "table":ctx.fillStyle="#7a4a24";ctx.fillRect(x,y+2,w,h-4);ctx.fillStyle="#a06a3a";ctx.fillRect(x,y+2,w,3);ctx.fillStyle="#fff6e0";ctx.beginPath();ctx.ellipse(x+6,y+6,3,1.6,0,0,7);ctx.fill();ctx.fillStyle="#c86a2a";ctx.beginPath();ctx.arc(x+6,y+5.5,1.6,0,7);ctx.fill();ctx.fillStyle="#b07030";ctx.fillRect(x+w-7,y+3,3,4);ctx.strokeStyle=OL;ctx.lineWidth=.8;ctx.strokeRect(x+.5,y+2.5,w-1,h-5);break;
    case "chair":ctx.fillStyle="#6a3a1a";ctx.fillRect(x+4,y+4,8,8);break;
    case "counter":{const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,"#b07a40");g.addColorStop(1,"#6a4020");ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.strokeStyle="#e8c060";ctx.strokeRect(x+.5,y+.5,w-1,h-1);
      if(f.act==="shop"){ctx.fillStyle="#ff5a7a";ctx.fillRect(x+6,y+3,4,4);ctx.fillStyle="#5aff9a";ctx.fillRect(x+14,y+3,4,4);}break;}
    case "shelf":ctx.fillStyle="#5a3418";ctx.fillRect(x,y-8,w,h+8);for(let i=0;i<3;i++){ctx.fillStyle=["#c03050","#3a6ad0","#e8c060","#4aa060"][(i+f.x)%4];ctx.fillRect(x+3+i*9,y-6,6,6);ctx.fillRect(x+5+i*8,y+3,5,6);}break;
    case "barrel":ctx.fillStyle="#8a5a2a";ctx.beginPath();ctx.ellipse(x+8,y+8,6,7,0,0,7);ctx.fill();ctx.strokeStyle="#3a2010";ctx.beginPath();ctx.moveTo(x+2,y+6);ctx.lineTo(x+14,y+6);ctx.stroke();break;
    case "crate":ctx.fillStyle="#a07040";ctx.fillRect(x+2,y+2,12,12);ctx.strokeStyle="#5a3a1a";ctx.strokeRect(x+2.5,y+2.5,11,11);break;
    case "chest":ctx.drawImage(SPR2.chest[0],x+1,y+2);break;
    case "board":ctx.drawImage(SPR2.board,x+8,y-6,20,22);break;
    case "ranks":ctx.fillStyle="#2a1808";ctx.fillRect(x-1,y-5,34,20);ctx.fillStyle="#6a4a2a";ctx.fillRect(x,y-4,32,18);ctx.fillStyle="#f0d890";ctx.font="bold 5px monospace";ctx.fillText("RANKS",x+8,y+1);for(let i=0;i<7;i++){ctx.fillStyle=["#c0c0c0","#a0d0ff","#7ad860","#f0c040","#ff8a3a","#d050e0","#fff060"][i];ctx.fillRect(x+3+i*4,y+5,3,6);}break;
    case "bench":ctx.fillStyle="#2a1808";ctx.fillRect(x,y+2,w,h-2);ctx.fillStyle="#a8703a";ctx.fillRect(x+1,y+3,w-2,5);ctx.fillStyle="#c8c8d0";ctx.fillRect(x+4,y,4,4);ctx.fillStyle="#7a4a20";ctx.fillRect(x+14,y,8,3);break;
    case "trophy":ctx.fillStyle="#5a3a1a";ctx.fillRect(x,y+4,w,12);ctx.fillStyle="#8a5a2a";ctx.fillRect(x+1,y+5,w-2,10);{const n=(P.trophies||[]).length;for(let i=0;i<Math.min(4,n);i++){ctx.fillStyle=["#e84a2a","#8ad0ff","#ffe060","#6ad04a"][i];ctx.beginPath();ctx.moveTo(x+4+i*7,y+14);ctx.lineTo(x+7+i*7,y+6);ctx.lineTo(x+10+i*7,y+14);ctx.fill();}if(!n){ctx.fillStyle="#3a2210";for(let i=0;i<4;i++)ctx.fillRect(x+5+i*7,y+9,2,2);}}break;
    case "wardrobe":ctx.fillStyle="#2a1808";ctx.fillRect(x,y-6,w,h+6);ctx.fillStyle="#8a5a2a";ctx.fillRect(x+1,y-5,w-2,h+4);ctx.fillStyle="#6a3a1a";ctx.fillRect(x+7,y-5,1,h+4);ctx.fillStyle="#f0d060";ctx.fillRect(x+5,y+8,1,2);ctx.fillRect(x+9,y+8,1,2);break;
    case "lampsw":case "lamp":ctx.fillStyle="#2a1808";ctx.fillRect(x+7,y+2,2,13);ctx.fillRect(x+4,y+14,8,2);ctx.fillStyle=room&&room.dark?"#6a6040":"#ffe070";ctx.fillRect(x+3,y-4,10,7);break;
    case "armchair":ctx.fillStyle="#2a1808";ctx.fillRect(x+1,y,14,15);ctx.fillStyle="#a83a4a";ctx.fillRect(x+2,y+1,12,13);ctx.fillStyle="#c85a6a";ctx.fillRect(x+4,y+6,8,6);break;
    case "banner":ctx.fillStyle="#8a2ac8";ctx.fillRect(x+3,y+2,10,18);ctx.fillStyle="#e8c060";ctx.fillRect(x+6,y+8,4,4);break;
    case "pillar":{const g=ctx.createLinearGradient(x,0,x+16,0);g.addColorStop(0,"#b08a3a");g.addColorStop(.5,"#ffe08a");g.addColorStop(1,"#8a6a2a");ctx.fillStyle=g;ctx.fillRect(x+3,y-16,10,h+16);break;}
    case "throne":ctx.fillStyle="#6a2a8a";ctx.fillRect(x+4,y-10,w-8,h+6);ctx.fillStyle="#e8c060";ctx.fillRect(x+2,y-12,w-4,4);ctx.fillRect(x+2,y+h-6,w-4,4);ctx.fillStyle="#f5f";ctx.beginPath();ctx.arc(x+w/2,y-6,2.5,0,7);ctx.fill();break;
    case "_":break;
    case "plant":ctx.fillStyle="#8a4a2a";ctx.fillRect(x+5,y+9,6,6);ctx.fillStyle="#3aa040";ctx.beginPath();ctx.arc(x+8,y+6,5,0,7);ctx.fill();break;
    case "bookshelf":ctx.fillStyle="#5a3418";ctx.fillRect(x,y-6,16,20);for(let i=0;i<4;i++){ctx.fillStyle=["#c03050","#3a6ad0","#e8c060","#4aa060"][i];ctx.fillRect(x+2+i*3,y-4,2,7);ctx.fillRect(x+2+i*3,y+5,2,7);}break;
    case "painting":ctx.fillStyle="#e8c060";ctx.fillRect(x,y-2,16,12);ctx.fillStyle="#5ab0e0";ctx.fillRect(x+2,y,12,8);ctx.fillStyle="#3a9a3a";ctx.fillRect(x+2,y+5,12,3);break;
    }}
  const ents=roomNpcs().map(r=>({y:r.y,f:()=>{if(r.king){ctx.drawImage(personSprite({skin:[240,200,170],hair:[230,230,230],cloth:[150,30,60],trim:[255,215,90],leg:[80,30,60],long:true,hat:null},0),r.x,r.y-4);ctx.fillStyle="#ffd84a";ctx.fillRect(r.x+4,r.y-6,8,3);return;}
    const L=npcLookC(r.n);const ph=Math.floor((frameN+r.n.id*37)/50)%4;const fr=r.pose==="sit"?(ph===1?5:ph===3?4:3):r.pose==="work"?(ph===2?4:0):r.pose==="idle"?(ph%2?1:0):0;
    if(r.pose==="sleep"){ctx.save();ctx.translate(r.x+8,r.y+12);ctx.rotate(-Math.PI/2);ctx.drawImage(chibi(L,0,0),-10,-14,20,30);ctx.restore();ctx.fillStyle="#cfe";ctx.font="7px system-ui";ctx.fillText("z",r.x+14,r.y-2-((frameN/8)%8));return;}
    drawChibi(L,r.x+8,r.y+14+(r.pose==="cook"?Math.sin(frameN*.2):0),r.pose==="sit"?0:0,fr);
    if(r.pose==="sit"&&ph!==1){ctx.fillStyle="#b07030";ctx.fillRect(r.x+12,r.y+6,3,4);ctx.fillStyle="#fffbe8";ctx.fillRect(r.x+12,r.y+5,3,1);}if(r.pose==="cook"&&Math.random()<.2)particles.push({x:r.x+8,y:r.y-2,z:0,vx:0,vy:-.2,vz:.3,life:30,max:30,col:[230,230,230],size:2,kind:"spark"});}}));
  ents.push({y:hero.y,f:()=>{drawChibi(HERO_LOOK,hero.x+6,hero.y+14,hero.dir,hero.anim%24<12&&hero.frame?1:0);}});
  ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.f();
  if(darkness()>.2){ctx.fillStyle=`rgba(20,20,60,${darkness()*.35})`;ctx.fillRect(0,0,Wp,Hp);}
  ctx.restore();
  ctx.font="bold 9px Georgia,serif";ctx.textAlign="center";ctx.fillStyle="#ffe08a";ctx.fillText(roomName(R.b),W/2,12);
  const near=roomNpcs().find(r=>Math.hypot(r.x+8-hero.x-6,r.y+8-hero.y-6)<24);if(near){ctx.font="bold 8px system-ui";ctx.fillStyle="#ffe8a0";ctx.fillText(near.king?"A: Audience":near.pose==="sleep"?"Zzz":"A: Talk",hero.x+6+ox,hero.y-6+oy);}
}
// ===== CHIBI PIXEL CHARACTERS (original generator) =====
const CW=20,CHH=30;
const shade=(c,f)=>[clamp(c[0]*f,0,255)|0,clamp(c[1]*f,0,255)|0,clamp(c[2]*f,0,255)|0];
const RACES={human:{skins:[[247,210,175],[230,180,140],[196,140,100],[140,95,65],[255,224,200]]},elf:{skins:[[250,222,200],[236,205,185]],ears:1},orc:{skins:[[110,170,80],[90,150,70]],tusk:1},goblin:{skins:[[150,200,80],[130,185,70]],ears:2},dwarf:{skins:[[240,190,150],[220,165,125]],beard:1}};
const HAIRC=[[70,45,25],[30,24,24],[220,170,70],[180,70,30],[235,235,240],[120,80,160],[200,110,60],[60,60,70]];
const CLS={warrior:{cloth:[150,60,50],armor:1,prop:"sword"},knight:{cloth:[90,100,140],armor:1,helm:1,prop:"sword"},mage:{cloth:[70,60,170],robe:1,hat:[60,50,150],prop:"staff"},archer:{cloth:[60,130,60],cloak:[40,90,40],prop:"bow"},
 rogue:{cloth:[60,55,70],cloak:[40,35,50],hood:1,prop:"dagger"},cleric:{cloth:[235,230,215],robe:1,trim:[230,190,70],prop:"staff"},berserker:{cloth:[130,70,40],armor:0,prop:"axe"},gob:{cloth:[110,80,50],prop:"dagger"},gsling:{cloth:[90,70,40],prop:"sling"},shaman:{cloth:[90,40,110],hood:1,cloak:[70,30,90],prop:"staff"},orc:{cloth:[90,60,40],armor:0,prop:"axe"},orcclub:{cloth:[80,70,50],prop:"club"},chief:{cloth:[120,30,30],armor:1,helm:1,prop:"axe"},
 barmaid:{cloth:[180,60,80],apron:1,prop:"mug"},bartender:{cloth:[90,70,50],apron:1,prop:"mug"},shop:{cloth:[60,120,170],apron:1},farmer:{cloth:[170,140,70],hat:"straw"},guard:{cloth:[110,110,130],armor:1,helm:1,prop:"spear"},
 smith:{cloth:[90,60,40],apron:1,prop:"hammer"},fisher:{cloth:[60,140,170],hat:"cap"},noble:{cloth:[140,40,90],trim:[240,200,80],robe:1},villager:{cloth:[120,150,90]},child:{cloth:[230,140,60]},hero:{cloth:[50,110,200],cape:[200,50,60],prop:"sword"}};
function chibiLook(seed,cls,race){const h=k=>Math.floor(hash2(seed,k,77)*9973);race=race||"human";
  const R=RACES[race];return{race,cls,skin:R.skins[h(2)%R.skins.length],hair:HAIRC[h(4)%HAIRC.length],style:["short","long","spiky","bun","pony","bald"][h(5)%6],beard:R.beard||(race==="human"&&h(6)%3===0),eye:[[60,120,200],[60,140,70],[110,70,40],[150,60,160]][h(7)%4]};}
const chibiCache=new Map();
function chibi(L,dir,frame){const key=JSON.stringify([L.race,L.cls,L.skin,L.hair,L.style,L.beard,L.noArm,dir,frame]);let c=chibiCache.get(key);if(c)return c;
  const img={w:CW,h:CHH,data:new Uint8ClampedArray(CW*CHH*4)};const P2=(x,y,col)=>px(img,x,y,col),Rc=(x,y,w,h,col)=>fillRect(img,x,y,w,h,col);
  const C2=CLS[L.cls]||CLS.villager;const cl=C2.cloth,cd=shade(cl,.72),cli=shade(cl,1.18);const sk=L.skin,skd=shade(sk,.82);const hr=L.hair,hd=shade(hr,.7),hl=shade(hr,1.25);
  const oy=4;const walk=frame===1?1:frame===2?-1:0;const sit=frame===3,gest=frame===4,drink=frame===5;const side=dir===1||dir===2,back=dir===3;
  // cape
  if(C2.cape&&!back){Rc(4,oy+12,12,9,shade(C2.cape,.8));}
  if(C2.cape&&back){Rc(4,oy+12,12,10,C2.cape);Rc(4,oy+12,12,2,shade(C2.cape,1.2));}
  // legs/feet
  if(!sit){const lc=C2.armor?[110,110,125]:[70,60,80];if(C2.robe){Rc(5,oy+16,10,9,cl);Rc(5,oy+16,2,9,cli);Rc(13,oy+16,2,9,cd);Rc(7+walk,oy+24,2,2,[60,40,30]);Rc(11-walk,oy+24,2,2,[60,40,30]);}
    else if(side){Rc(8+walk,oy+19,3,5,lc);Rc(9-walk,oy+19,3,5,shade(lc,.8));Rc(8+walk*2,oy+24,4,2,[60,40,30]);}
    else{Rc(6,oy+19+(walk>0?-1:0),3,5,lc);Rc(11,oy+19+(walk<0?-1:0),3,5,shade(lc,.8));Rc(6,oy+24+(walk>0?-1:0),3,2,[60,40,30]);Rc(11,oy+24+(walk<0?-1:0),3,2,[60,40,30]);}}
  // body
  const by=oy+13+(sit?2:0);Rc(5,by,10,7,cl);Rc(5,by,10,1,cli);Rc(13,by+1,2,6,cd);
  if(C2.armor){Rc(5,by,10,6,[170,175,190]);Rc(5,by,10,1,[230,235,245]);Rc(9,by+1,2,5,[120,125,140]);Rc(4,by,2,2,[200,205,215]);Rc(14,by,2,2,[200,205,215]);}
  if(C2.apron&&!back){Rc(6,by+2,8,6,[240,236,225]);Rc(6,by+2,8,1,[255,255,255]);}
  if(C2.trim){Rc(9,by,2,7,C2.trim);}
  if(C2.cloak){Rc(4,by,2,8,C2.cloak);Rc(14,by,2,8,C2.cloak);}
  Rc(5,by+6,10,1,[90,60,30]);
  // arms
  const ay=by+1+(gest?-3:0);Rc(3,by+1,2,5,cl);P2(3,by+6,sk);P2(4,by+6,sk);
  if(L.noArm){Rc(15,by+1,2,2,[170,30,40]);}else if(!side||dir===2){Rc(15,ay,2,5,cl);Rc(15,ay+5,2,1,sk);}
  // prop in right hand
  const hx=16,hy=(drink?by-1:ay+5);const pr=L.noArm?null:C2.prop;
  if(pr==="sword"){Rc(hx,hy-8,1,8,[220,228,240]);P2(hx,hy-9,[255,255,255]);Rc(hx-1,hy-1,3,1,[200,160,60]);}
  if(pr==="dagger"){Rc(hx,hy-4,1,4,[220,228,240]);Rc(hx-1,hy,3,1,[120,80,40]);}
  if(pr==="staff"){Rc(hx,hy-12,1,16,[130,85,40]);Rc(hx-1,hy-14,3,3,[120,220,255]);P2(hx,hy-13,[255,255,255]);}
  if(pr==="spear"){Rc(hx,hy-12,1,16,[130,85,40]);Rc(hx-1,hy-14,3,2,[220,228,240]);}
  if(pr==="axe"){Rc(hx,hy-7,1,8,[130,85,40]);Rc(hx+1,hy-8,3,4,[200,205,215]);}
  if(pr==="hammer"){Rc(hx,hy-5,1,6,[130,85,40]);Rc(hx-1,hy-7,4,3,[150,150,160]);}
  if(pr==="bow"){for(let i=0;i<9;i++)P2(hx+1+(i>1&&i<7?1:0),hy-7+i,[140,90,40]);Rc(hx+1,hy-7,1,9,[230,230,230]);}
  if(pr==="club"&&!L.noArm){Rc(hx,hy-7,2,8,[120,80,40]);Rc(hx-1,hy-9,4,3,[100,65,30]);}
  if(pr==="sling"&&!L.noArm){Rc(hx,hy-3,1,4,[150,110,60]);P2(hx+1,hy-4,[120,120,120]);}
  if(pr==="mug"){Rc(hx,hy-2,3,3,[150,100,50]);Rc(hx,hy-3,3,1,[255,250,230]);P2(hx+3,hy-1,[150,100,50]);}
  // head (big)
  const hy0=oy+(sit?2:0)+(frame===0||frame>2?0:Math.abs(walk)?-0:0);Rc(4,hy0+2,12,11,sk);Rc(5,hy0+1,10,1,sk);Rc(14,hy0+3,2,9,skd);Rc(5,hy0+12,10,1,skd);
  const R=RACES[L.race];
  if(R.ears===1){Rc(2,hy0+6,2,2,sk);P2(1,hy0+5,sk);Rc(16,hy0+6,2,2,skd);P2(18,hy0+5,skd);}
  if(R.ears===2){Rc(1,hy0+5,3,3,sk);P2(0,hy0+4,sk);Rc(16,hy0+5,3,3,skd);P2(19,hy0+4,skd);}
  if(!back){const ey=hy0+7;
    if(dir===0){Rc(6,ey,2,3,[255,255,255]);Rc(12,ey,2,3,[255,255,255]);Rc(7,ey+1,1,2,L.eye);Rc(12,ey+1,1,2,L.eye);P2(7,ey+1,[20,20,30]);P2(12,ey+1,[20,20,30]);
      P2(9,ey+3,skd);if(gest)Rc(9,ey+4,2,1,[150,50,50]);else P2(10,ey+4,[160,80,70]);Rc(5,ey+3,1,1,[255,160,150]);Rc(14,ey+3,1,1,[255,160,150]);}
    else{const ex=dir===1?5:13;Rc(ex,ey,2,3,[255,255,255]);P2(dir===1?ex:ex+1,ey+1,L.eye);P2(dir===1?ex:ex+1,ey+2,[20,20,30]);}
    if(R.tusk&&dir===0){P2(7,hy0+11,[255,255,240]);P2(12,hy0+11,[255,255,240]);}
    if(L.beard){Rc(5,hy0+10,10,4,hr);Rc(6,hy0+14,8,2,hd);Rc(8,hy0+10,4,1,[150,60,60]);}}
  // hair
  if(L.style!=="bald"||back){Rc(4,hy0,12,4,hr);Rc(5,hy0-1,10,1,hr);Rc(5,hy0,6,1,hl);Rc(3,hy0+2,2,4,hr);Rc(15,hy0+2,2,4,hd);
    if(back)Rc(4,hy0,12,12,hr),Rc(4,hy0+10,12,2,hd);
    if(L.style==="long"){Rc(3,hy0+2,2,11,hr);Rc(15,hy0+2,2,11,hd);}
    if(L.style==="spiky"){P2(5,hy0-2,hr);P2(8,hy0-2,hr);P2(11,hy0-2,hr);P2(14,hy0-1,hr);}
    if(L.style==="bun"){Rc(8,hy0-3,4,3,hr);P2(9,hy0-3,hl);}
    if(L.style==="pony"){Rc(15,hy0+3,3,6,hr);}
    if(dir===0&&L.style!=="bald")Rc(5,hy0+3,4,1,hr);}
  // hats / helms / hoods
  if(C2.hat&&C2.hat.length===3){const hc=C2.hat;Rc(2,hy0+2,16,2,hc);Rc(5,hy0-1,10,3,hc);Rc(7,hy0-4,6,3,hc);Rc(8,hy0-6,4,2,hc);Rc(10,hy0-8,3,2,shade(hc,1.2));Rc(5,hy0+1,10,1,[230,190,70]);}
  if(C2.hat==="straw"){Rc(1,hy0+1,18,2,[230,200,110]);Rc(5,hy0-2,10,3,[220,185,95]);Rc(5,hy0,10,1,[190,60,50]);}
  if(C2.hat==="cap"){Rc(4,hy0-1,12,3,[50,90,150]);if(dir===0)Rc(5,hy0+2,10,1,[40,70,120]);}
  if(C2.helm){Rc(3,hy0-1,14,5,[170,175,190]);Rc(4,hy0-1,12,1,[230,235,245]);Rc(9,hy0-3,2,2,[200,60,60]);if(!back&&dir===0)Rc(9,hy0+4,2,4,[150,155,170]);}
  if(C2.hood){Rc(3,hy0-1,14,5,C2.cloak);Rc(2,hy0+3,2,9,C2.cloak);Rc(16,hy0+3,2,9,shade(C2.cloak,.8));if(back)Rc(3,hy0,14,12,C2.cloak);}
  // outline
  const src=new Uint8ClampedArray(img.data);const A=(x,y)=>x<0||y<0||x>=CW||y>=CHH?0:src[(y*CW+x)*4+3];
  for(let y=0;y<CHH;y++)for(let x=0;x<CW;x++){const i=(y*CW+x)*4;if(!src[i+3]&&(A(x-1,y)||A(x+1,y)||A(x,y-1)||A(x,y+1))){img.data[i]=28;img.data[i+1]=16;img.data[i+2]=26;img.data[i+3]=255;}}
  c=mkCanvas(CW,CHH);c.getContext("2d").putImageData(new ImageData(img.data,CW,CHH),0,0);chibiCache.set(key,c);return c;}
const ROLE_CLS={leader:"noble",innkeeper:"bartender",shopkeeper:"shop",guard:"guard",smith:"smith",fisher:"fisher",farmer:"farmer",child:"child",receptionist:"barmaid",adventurer:null};
function npcLookC(n){if(!n._look){const cls=n.adv?n.adv.cls:ROLE_CLS[n.role]||"villager";n._look=chibiLook(n.look,cls,"human");
  if(n.role==="innkeeper"&&n.look%2)n._look.cls="barmaid";}return n._look;}
const HERO_LOOK={race:"human",cls:"hero",skin:[247,210,175],hair:[90,55,30],style:"spiky",beard:false,eye:[60,120,200]};
function dir4(dx,dy,old){if(Math.abs(dx)+Math.abs(dy)<0.05)return old;return Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);}
function drawChibi(L,x,y,dir,frame,scale){const s=chibi(L,dir,frame);const sc=scale||1;ctx.drawImage(s,Math.round(x-CW*sc/2),Math.round(y-CHH*sc),CW*sc,CHH*sc);}
// ===== GOBLINS & ORCS (hostile) =====
Object.assign(PARTDEF,{ear:["Goblin Ear","👂",7],tusk:["Orc Tusk","🦷",18],crude:["Crude Weapon","🗡️",10]});
for(const k of ["ear","tusk","crude"]){const [n,ic,p]=PARTDEF[k];ITEMS[k]={n,p,ic,part:1};ITEMS[k+"+"]={n:"Fine "+n,p:Math.round(p*2.2),ic,part:1,fine:1};}
Object.assign(SPECIES,{
 goblin:{base:"grunt",beh:"agg",hp:3,aggro:110,biome:["forest","meadow"],gold:[2,6],chibi:"gob",race:"goblin",spdM:1.5,thief:1},
 gslinger:{base:"spitter",beh:"agg",hp:2,aggro:140,biome:["forest","meadow"],gold:[2,6],chibi:"gsling",race:"goblin"},
 shaman:{base:"spitter",beh:"agg",hp:4,aggro:150,biome:["forest","mountain"],gold:[6,12],chibi:"shaman",race:"goblin",magic:1},
 orc:{base:"grunt",beh:"agg",hp:7,aggro:110,biome:["mountain","forest"],gold:[5,10],chibi:"orc",race:"orc",scale:1.35,dmg:2},
 orcclub:{base:"charger",beh:"agg",hp:8,aggro:110,biome:["mountain"],gold:[5,10],chibi:"orcclub",race:"orc",scale:1.35},
 warchief:{base:"boss",beh:"agg",hp:22,aggro:150,gold:[50,80],chibi:"chief",race:"orc",scale:1.7,dmg:2,elite:1},
});
Object.assign(PART_DROPS,{goblin:["ear","ear","crude"],gslinger:["ear","crude"],shaman:["ear","core"],orc:["tusk","crude","hide"],orcclub:["tusk","crude"],warchief:["tusk","crude","gem"]});
Object.assign(BEST_DESC,{goblin:"Small, fast pack raiders with daggers. They steal!",gslinger:"Goblins that pelt you with sling stones.",shaman:"Goblin spellcasters crackling with dark magic.",orc:"Big brutes with axes.",orcclub:"Orc bruisers that charge with clubs.",warchief:"Elite orc leaders of war camps."});
const CAMPS=[{x:70,y:90,name:"Goblin Camp",chief:false},{x:180,y:96,name:"Orc Fort",chief:true},{x:44,y:236,name:"Thornwood Camp",chief:true},{x:200,y:180,name:"Ridge Camp",chief:false}];
function genCamps(){for(const c of CAMPS){for(let y=-4;y<=4;y++)for(let x=-5;x<=5;x++){const i=(c.y+y)*WW+c.x+x;if(Math.hypot(x,y*1.2)>5.2)continue;ELEV[i]=0;
    const edge=Math.hypot(x,y*1.2)>4.3;T[i]=edge&&!(y>=2&&Math.abs(x)<=1)&&!(y<=-2&&Math.abs(x)<=1)?WALL:ROAD;OCC[i]=0;}}}
function campTick(){for(const c of CAMPS){const k="camp_"+c.x;if((world[k]||0)>world.day)continue;if(mobs.some(m=>m.camp===c.x))continue;
  if(Math.hypot(hero.x-c.x*TILE,hero.y-c.y*TILE)>420)continue;const list=c.chief?["orc","orcclub","shaman","goblin","goblin"]:["goblin","goblin","gslinger","shaman","goblin"];
  list.forEach((sp,i)=>spawnMob(sp,(c.x-2+i)*TILE,(c.y-1+(i%2))*TILE,{persist:true,camp:c.x}));if(c.chief)spawnMob("warchief",c.x*TILE,(c.y-2)*TILE,{persist:true,camp:c.x,chiefOf:c.x});}}
function foeSetup(e,d){if(d.hp)e.hp=e.maxHp=d.hp;if(d.dmg)e.dmg=d.dmg;if(d.spdM)e.spd*=d.spdM;if(d.scale){e.w=Math.round(12*d.scale);e.h=Math.round(12*d.scale);}
  e.chibi={...chibiLook(e.x*7+e.y|0,d.chibi,d.race),skin:d.race==="orc"?[100,160,75]:[150,200,80],style:d.race==="orc"?"bald":"spiky",beard:false};e.cdir=0;}
function drawFoe(e){const d=e.def,sc=d.scale||1;const t=frameN+(e.x|0);const mv=Math.abs(e.x-(e.px||e.x))+Math.abs(e.y-(e.py||e.y))>0.05;e.cdir=dir4(e.x-(e.px||e.x),e.y-(e.py||e.y),e.cdir);e.px=e.x;e.py=e.y;
  const dying=e.dead?clamp(1-e.flash/(e.type==="boss"?12:8),0,1):0;drawShadow(e.x+e.w/2,e.y+e.h,6*sc,2.5*sc);
  const L=e.parts.arm===false||e.parts.arms===false?{...e.chibi,noArm:true}:e.chibi;
  let fr=mv?(Math.floor(t/8)%2?1:2):0;if(e.parts.legs===false)fr=3;if(e.state==="windup"||e.state==="slam"||e.atkCd>30)fr=4;
  ctx.save();ctx.translate(Math.floor(e.x+e.w/2),Math.floor(e.y+e.h+1));if(dying){ctx.rotate(dying*1.3);ctx.globalAlpha=1-dying*.6;}
  const bob=mv?-Math.abs(Math.sin(t*.3))*1.2:Math.sin(t*.07)*.5;if(e.flash>0&&!e.dead)ctx.filter="brightness(2.2)";
  const s=chibi(L,e.cdir,fr);ctx.drawImage(s,-CW*sc/2,-CHH*sc+bob,CW*sc,CHH*sc);ctx.filter="none";ctx.restore();ctx.globalAlpha=1;
  if(d.elite&&!e.dead){ctx.fillStyle="#200";ctx.fillRect(e.x-4,e.y-CHH*sc+e.h-6,e.w+8,4);ctx.fillStyle="#e33";ctx.fillRect(e.x-3,e.y-CHH*sc+e.h-5,(e.w+6)*e.hp/e.maxHp,2);}}
function goblinSteal(e){if(!e.def.thief||e.stolen)return;const ks=Object.keys(P.inv).filter(k=>P.inv[k]>0&&k!=="amulet");if(ks.length&&Math.random()<0.5){const k=pick(ks);P.inv[k]--;e.stolen=k;toast(`A goblin stole your ${ITEMS[k].n}! Get it back!`);}
  else if(P.gold>0){const g=Math.min(P.gold,5+Math.floor(Math.random()*10));P.gold-=g;e.stolenGold=g;e.stolen="gold";toast(`A goblin snatched ${g} gold!`);}e.state="flee";}
// ===== NPC ADVENTURERS & PARTY =====
const ADV_CLASSES=["warrior","mage","archer","rogue","cleric","berserker","knight"];
const RIVALS=["Iron Wolves","Silver Arrows","Crimson Oath","Dawn Blades"];
const CLS_ICON={warrior:"⚔",mage:"✦",archer:"🏹",rogue:"🗡",cleric:"✚",berserker:"🪓",knight:"🛡"};
function makeAdv(cls,sid){const n=makeNpc(sid==null?pick([0,1,2]):sid,"adventurer",20+Math.floor(Math.random()*25));n.adv={cls:cls||pick(ADV_CLASSES),race:"human",lvl:1+Math.floor(Math.random()*4),rank:Math.floor(Math.random()*3),xp:0,hp:10,state:"town",job:null,eta:0,from:null,to:null,gold:20,team:null,kills:0};
  n.adv.hp=n.adv.max=8+n.adv.lvl*2;return n;}
function initAdvs(){const list=[];for(let i=0;i<14;i++)list.push(makeAdv(ADV_CLASSES[i%ADV_CLASSES.length]));
  for(let t=0;t<3;t++){const team=RIVALS[t];list.slice(t*3,t*3+3).forEach(n=>n.adv.team=team);}}
const advs=()=>npcs.filter(n=>n.alive&&n.adv);
function advPower(n){return n.adv.lvl*2+n.adv.rank*3+(n.adv.cls==="berserker"||n.adv.cls==="knight"?2:0);}
function advDest(j){if(j.t==="dragon"){const L=pick(LAIRS);return{x:L.x,y:L.y};}if(j.t==="escort")return{x:SETS[j.to].x,y:SETS[j.to].y};if(j.t==="dungeon")return{x:CAVE_POS.x,y:CAVE_POS.y};
  if(j.t==="raid")return{x:SETS[j.s].x,y:SETS[j.s].y};const c=pick(CAMPS);return{x:c.x+Math.floor((Math.random()-.5)*20),y:c.y+Math.floor((Math.random()-.5)*20)};}
function advHourly(){const jobs=genGuildJobs();for(const n of advs()){const a=n.adv;if(P.party&&P.party.includes(n.id))continue;const h=hour();
  if(a.state==="town"&&h>=8&&h<16&&Math.random()<0.25){const ok=jobs.filter(j=>j.min<=a.rank&&!j.claimed);if(!ok.length)continue;const j=pick(ok);j.claimed=n.name+(a.team?` (${a.team})`:"");
    a.job={t:j.t,txt:j.txt,gold:j.gold,pts:j.pts,diff:j.min};a.from={x:SETS[n.s].x,y:SETS[n.s].y};a.to=advDest(j);a.state="travel";a.t0=absMin();a.eta=absMin()+120+Math.floor(Math.random()*240);
    if(a.team)for(const m of advs())if(m.adv.team===a.team&&m.adv.state==="town"&&m!==n&&!(P.party&&P.party.includes(m.id))){Object.assign(m.adv,{job:a.job,from:a.from,to:a.to,state:"travel",t0:a.t0,eta:a.eta});}}
  else if(a.state==="travel"&&absMin()>=a.eta){const pw=advPower(n)+(a.team?4:0),diff=a.job.diff*4+3+(a.job.t==="dragon"?8:0);const roll=pw+Math.random()*10-diff;
    if(roll>0){a.gold+=a.job.gold;a.xp+=a.job.pts;a.kills+=3;if(a.xp>=a.lvl*20){a.xp=0;a.lvl++;a.max+=2;addNews(n.s,`${n.name} the ${a.cls} reached level ${a.lvl}!`);}
      if(a.xp>0&&Math.random()<0.25&&a.rank<6){a.rank++;}
      addNews(n.s,`${n.name}${a.team?" of the "+a.team:""} completed a job: ${a.job.txt}.`);if(a.job.t==="dragon"){world.dragonsSlainByNpc=(world.dragonsSlainByNpc||0)+1;addNews(-1,`The ${a.team||n.name} brought down a dragon! The guild is abuzz.`);}}
    else if(roll<-8&&Math.random()<0.15){n.alive=false;addNews(n.s,`Tragedy: ${n.name} the ${a.cls} fell on a job (${a.job.txt}). The tavern raises a mug in their memory.`);}
    else addNews(n.s,`${n.name} returned injured from: ${a.job.txt}.`);
    a.state="town";a.job=null;}}}
function advDaily(){for(const n of advs()){if(n.age>58&&Math.random()<0.05&&!(P.party||[]).includes(n.id)){n.alive=false;addNews(n.s,`${n.name} the ${n.adv.cls} retired from adventuring.`);}}
  if(advs().length<14&&Math.random()<0.5){const n=makeAdv();addNews(n.s,`A new adventurer, ${n.name} the ${n.adv.cls}, registered at the guild.`);}}
function advWorldPos(n){const a=n.adv;if(a.state!=="travel")return null;const p=clamp((absMin()-a.t0)/Math.max(1,a.eta-a.t0),0,1);const k=p<0.5?p*2:(1-p)*2;return{x:(a.from.x+(a.to.x-a.from.x)*k)*TILE,y:(a.from.y+(a.to.y-a.from.y)*k)*TILE};}
// ---- party ----
function inviteParty(n){if(!P.party)P.party=[];if(P.party.includes(n.id))return"Already in your party.";if(P.party.length>=3)return"Your party is full (3).";
  if(n.friend<25)return`"I don't know you well enough yet."`;if(n.adv.team&&n.friend<50)return`"I ride with the ${n.adv.team}. Maybe when we're closer friends."`;
  P.party.push(n.id);n.adv.state="party";n.adv.job=null;n.x=hero.x-10;n.y=hero.y;n.inside=false;updatePartyHud();return`"Let's go! Lead the way."`;}
function dismissParty(n){P.party=(P.party||[]).filter(i=>i!==n.id);n.adv.state="town";updatePartyHud();}
function partyMembers(){return(P.party||[]).map(id=>npcs.find(n=>n.id===id)).filter(n=>n&&n.alive);}
function updateParty(){const ms=partyMembers();ms.forEach((n,i)=>{const a=n.adv;n.inside=false;if(a.cd>0)a.cd--;
  const fx0=hero.x-14+i*14,fy0=hero.y+14;let tgt=null,bd=140;for(const m of mobs){if(m.dead||!m.def||m.def.beh==="pea"||m.def.beh==="flee")continue;const d=Math.hypot(m.x-n.x,m.y-n.y);if(d<bd&&Math.hypot(m.x-hero.x,m.y-hero.y)<220){bd=d;tgt=m;}}
  if(Math.hypot(n.x-hero.x,n.y-hero.y)>300){n.x=fx0;n.y=fy0;}
  let gx=fx0,gy=fy0;const ranged=a.cls==="mage"||a.cls==="archer"||a.cls==="cleric";
  if(tgt){const ang=Math.atan2(tgt.y-n.y,tgt.x-n.x);if(ranged){gx=tgt.x-Math.cos(ang)*70;gy=tgt.y-Math.sin(ang)*70;}else{gx=tgt.x-Math.cos(ang)*12;gy=tgt.y-Math.sin(ang)*8;}
    if((a.cd||0)<=0){if(ranged&&bd<160){a.cd=a.cls==="archer"?45:70;fx.push({k:a.cls==="archer"?"ice":"fireball",x:n.x+8,y:n.y+6,vx:Math.cos(ang)*4,vy:Math.sin(ang)*4,life:50,dmg:1+Math.floor(a.lvl/3),r:3,pierce:a.cls==="archer",hit:new Set(),ang,ally:1});n.gest=12;}
      else if(!ranged&&bd<22){a.cd=36;n.gest=10;if(tgt.sp==="dragon"){tgt.iframes=0;tgt._spell=1;hitDragon(tgt,ang);}else{tgt.iframes=0;hurtEnemy(tgt,1+Math.floor(a.lvl/4),ang,true);}a.kills+=tgt.dead?1:0;}}}
  if(a.cls==="cleric"&&hero.hp<hero.maxHp/2&&(a.hcd||0)<=0){a.hcd=360;hero.hp=Math.min(hero.maxHp,hero.hp+2);updateHearts();burst(hero.x+6,hero.y+6,[255,240,140],20,1.2,2);toast(n.name+" heals you!");}if(a.hcd>0)a.hcd--;
  const dx=gx-n.x,dy=gy-n.y,l=Math.hypot(dx,dy);if(l>3){const sp=Math.min(l*0.1,1.6);const ent={x:n.x+2,y:n.y+4,w:10,h:8};moveEntity(ent,dx/l*sp,dy/l*sp);if(Math.abs(ent.x-2-n.x)+Math.abs(ent.y-4-n.y)<0.05&&l>40){n.x+=dx/l*sp;n.y+=dy/l*sp;}else{n.x=ent.x-2;n.y=ent.y-4;}}
  n.dir=dx<0?1:2;if(n.gest>0)n.gest--;});}
function partyShare(g){const ms=partyMembers();if(!ms.length||g<=0)return;const cut=Math.max(1,Math.floor(g*0.1));for(const n of ms){n.adv.gold+=cut;n.adv.xp+=1;n.friend=Math.min(100,n.friend+0.3);}}
function updatePartyHud(){const el=document.getElementById("party");if(!el)return;const ms=partyMembers();el.innerHTML=ms.map(n=>`<div class="pm"><b>${CLS_ICON[n.adv.cls]||"•"} ${n.name}</b> <small>Lv${n.adv.lvl} ${GRANKS[n.adv.rank]}</small><i style="width:${Math.round(100)}%"></i></div>`).join("");}
// ===== COZY CARTOON ART DIRECTION (original, code-drawn) =====
const OL="#2b1a12";
function olStroke(g,w){g.strokeStyle=OL;g.lineWidth=w||1;g.lineJoin="round";g.stroke();}
function blob(g,x,y,r,fill,hi){g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=fill;g.fill();if(hi){g.beginPath();g.arc(x-r*.3,y-r*.35,r*.45,0,7);g.fillStyle=hi;g.fill();}}
const GRASS2=[["#7ccf3c","#9be04e","#5aa82c","#ffe45a"],["#6fc438","#92d94a","#4f9c28","#fff07a"],["#b8b03c","#d8c050","#8c8226","#f0803a"],["#c8d8dc","#eef6f8","#9fb2b8","#ffffff"]];
const LEAF2=[["#4fae3a","#7fd650","#2e7a26","#ffb0d8"],["#3fa034","#6cc848","#25701f","#f6ff9a"],["#e07a24","#f8b840","#a8441a","#ffe070"],["#7a9a92","#f2f8fa","#4e6a64","#ffffff"]];
function makeTiles(season){
  const tiles={};const G=GRASS2[season],L=LEAF2[season];
  const mk=(f,n=4)=>{const a=[];for(let v=0;v<n;v++){const c=mkCanvas(32,32),g=c.getContext("2d");g.scale(2,2);f(g,v);a.push(c);}return a;};
  const grass=(g,v)=>{g.fillStyle=G[0];g.fillRect(0,0,16,16);for(let i=0;i<5;i++){g.fillStyle=G[2];g.globalAlpha=.35;g.beginPath();g.ellipse(hash2(i,v,1)*16,hash2(i,v,2)*16,2.5,1.5,0,0,7);g.fill();}
    g.globalAlpha=1;g.strokeStyle=G[2];g.lineWidth=.8;for(let i=0;i<4;i++){const x=hash2(i,v,8)*15,y=3+hash2(i,v,9)*12;g.beginPath();g.moveTo(x,y);g.lineTo(x+1,y-2.5);g.moveTo(x+2,y);g.lineTo(x+2,y-2);g.stroke();}
    g.fillStyle=G[1];for(let i=0;i<3;i++){g.globalAlpha=.6;g.beginPath();g.ellipse(hash2(i,v,4)*16,hash2(i,v,5)*16,1.8,1,0,0,7);g.fill();}g.globalAlpha=1;};
  tiles[GRASS]=mk(grass);
  tiles[FLOWER]=mk((g,v)=>{grass(g,v);const fc=season===3?["#fff"]:["#ff6aa8","#ffd23a","#a46aff","#ff8a3a","#ffffff"];for(let i=0;i<4;i++){const x=3+hash2(i,v,40)*10,y=3+hash2(i,v,41)*10;
    g.fillStyle=fc[(i+v)%fc.length];for(let k=0;k<4;k++){g.beginPath();g.arc(x+Math.cos(k*1.57)*1.2,y+Math.sin(k*1.57)*1.2,1,0,7);g.fill();}g.fillStyle="#ffe860";g.beginPath();g.arc(x,y,.8,0,7);g.fill();}});
  tiles[FOREST]=mk((g,v)=>{grass(g,v);g.fillStyle="rgba(40,90,30,.25)";g.fillRect(0,0,16,16);for(let i=0;i<3;i++){g.fillStyle=season===2?"#c8642a":"#3a8a2a";g.beginPath();g.ellipse(hash2(i,v,6)*16,hash2(i,v,7)*16,2,1.2,0,0,7);g.fill();}});
  tiles[SAND]=mk((g,v)=>{g.fillStyle="#f4d890";g.fillRect(0,0,16,16);g.fillStyle="#e4c070";for(let i=0;i<4;i++){g.beginPath();g.arc(hash2(i,v,3)*16,hash2(i,v,4)*16,.8,0,7);g.fill();}g.fillStyle="#fff0c0";g.fillRect(hash2(v,1,3)*14,hash2(v,2,3)*14,2,1);});
  tiles[SHAL]=mk((g,v)=>{g.fillStyle="#4ed8d8";g.fillRect(0,0,16,16);g.fillStyle="#7ef0e8";g.beginPath();g.ellipse(4+v*2,6,4,1.2,0,0,7);g.fill();g.fillStyle="rgba(240,230,170,.35)";g.beginPath();g.ellipse(10,12,4,2,0,0,7);g.fill();});
  tiles[DEEP]=mk((g,v)=>{g.fillStyle="#22b0c8";g.fillRect(0,0,16,16);g.strokeStyle="rgba(200,255,255,.6)";g.lineWidth=1;g.beginPath();const y=4+v*3;g.moveTo(2,y);g.quadraticCurveTo(5,y-2,8,y);g.quadraticCurveTo(11,y+2,14,y);g.stroke();
    g.fillStyle="rgba(10,120,150,.35)";g.beginPath();g.ellipse(hash2(v,1,1)*16,hash2(v,2,1)*16,3,1.5,0,0,7);g.fill();});
  tiles[ROCK]=mk((g,v)=>{grass(g,v);g.beginPath();g.moveTo(2,14);g.lineTo(3,7);g.lineTo(7,3);g.lineTo(12,4);g.lineTo(14,9);g.lineTo(13,14);g.closePath();g.fillStyle="#a8a0b0";g.fill();olStroke(g,1);
    g.fillStyle="#d0c8d8";g.beginPath();g.moveTo(4,8);g.lineTo(7,4);g.lineTo(10,5);g.lineTo(7,8);g.fill();});
  const cob=(g,v,base)=>{g.fillStyle=base||"#b8a890";g.fillRect(0,0,16,16);for(let y=0;y<3;y++)for(let x=0;x<3;x++){const o=y%2?2.5:0;const cx=x*5.5+o+2.5,cy=y*5.5+2.5;g.beginPath();g.ellipse(cx,cy,2.4,2.1,0,0,7);
    g.fillStyle=["#e2d6c0","#cfc0a6","#efe4cc","#d6c4a4"][(x+y+v)%4];g.fill();g.strokeStyle="rgba(60,40,25,.55)";g.lineWidth=.6;g.stroke();g.fillStyle="rgba(255,255,255,.4)";g.fillRect(cx-1.4,cy-1.4,1.2,.6);}};
  tiles[COBBLE]=mk((g,v)=>cob(g,v));
  tiles[ROAD]=mk((g,v)=>{g.fillStyle="#d8b47a";g.fillRect(0,0,16,16);for(let i=0;i<5;i++){g.fillStyle=i%2?"#c49a5e":"#e8c890";g.beginPath();g.ellipse(hash2(i,v,91)*16,hash2(i,v,92)*16,1.6,1.1,0,0,7);g.fill();}});
  tiles[RUIN]=mk((g,v)=>{cob(g,v,"#9a948a");g.fillStyle="rgba(100,170,70,.5)";g.beginPath();g.ellipse(hash2(v,3,3)*16,hash2(v,4,3)*16,3,1.5,0,0,7);g.fill();});
  tiles[WALL]=mk((g,v)=>{g.fillStyle="#8a7e8e";g.fillRect(0,0,16,16);for(let y=0;y<3;y++)for(let x=0;x<2;x++){g.fillStyle=["#b4aab8","#a49aa8"][(x+y+v)%2];g.fillRect(x*8+(y%2?4:0)-4+.5,y*5.3+.5,7,4.5);g.strokeStyle=OL;g.lineWidth=.6;g.strokeRect(x*8+(y%2?4:0)-4+.5,y*5.3+.5,7,4.5);}},3);
  tiles[PIER]=mk((g,v)=>{g.drawImage(tiles[DEEP][v],0,0,16,16);g.fillStyle="#b07a40";g.fillRect(0,1,16,14);for(let i=0;i<4;i++){g.fillStyle=i%2?"#c88c4c":"#a46c36";g.fillRect(i*4,1,4,14);g.strokeStyle=OL;g.lineWidth=.5;g.strokeRect(i*4+.25,1.25,4,13.5);}});
  tiles[FARM]=mk((g,v)=>{g.fillStyle="#8a5a2e";g.fillRect(0,0,16,16);for(let y=1;y<16;y+=4){g.fillStyle="#6a4020";g.fillRect(0,y,16,2);g.fillStyle="#a06a38";g.fillRect(0,y-1,16,1);}});
  tiles[CAVE]=mk((g,v)=>{g.fillStyle="#7a7080";g.fillRect(0,0,16,16);g.fillStyle="#1a1020";g.beginPath();g.ellipse(8,11,6,7,0,Math.PI,0);g.fillRect(2,11,12,5);g.fill();g.strokeStyle=OL;g.stroke();g.fillStyle="#6ff";g.beginPath();g.arc(8,2,1.5,0,7);g.fill();},1);
  tiles[MTN]=mk((g,v)=>{g.fillStyle=season===3?"#d8e2e8":"#b0a68a";g.fillRect(0,0,16,16);for(let i=0;i<4;i++){g.fillStyle=season===3?"#f4f9fb":i%2?"#c8be9c":"#94a860";g.beginPath();g.ellipse(hash2(i,v,130)*16,hash2(i,v,131)*16,2.5,1.5,0,0,7);g.fill();}});
  tiles[CLIFF]=mk((g,v)=>{g.fillStyle="#8a7a6a";g.fillRect(0,0,16,16);g.fillStyle="#6e5e50";g.fillRect(0,9,16,7);for(let i=0;i<3;i++){g.fillStyle="#a8988a";g.beginPath();g.ellipse(3+i*5,6,2.5,3,0,0,7);g.fill();g.strokeStyle=OL;g.lineWidth=.7;g.stroke();}
    g.fillStyle=season===3?"#f4faff":"#7ccf3c";g.fillRect(0,0,16,2.5);g.strokeStyle=OL;g.lineWidth=1;g.beginPath();g.moveTo(0,2.5);g.lineTo(16,2.5);g.stroke();});
  tiles[STAIRS]=mk((g,v)=>{g.fillStyle="#8a7a6a";g.fillRect(0,0,16,16);for(let i=0;i<4;i++){g.fillStyle="#e2d6c0";g.fillRect(2,i*4,12,3);g.strokeStyle=OL;g.lineWidth=.6;g.strokeRect(2.3,i*4+.3,11.4,2.6);}});
  tiles[19]=mk((g,v)=>{grass(g,v);g.fillStyle="#8a5228";g.fillRect(5,7,7,5);g.strokeStyle=OL;g.lineWidth=.8;g.strokeRect(5,7,7,5);g.fillStyle="#e8c888";g.beginPath();g.ellipse(8.5,7,3.5,1.6,0,0,7);g.fill();g.stroke();});
  tiles[20]=mk((g,v)=>{grass(g,v);g.fillStyle="#6a4024";g.fillRect(7.5,6,1,7);blob(g,8,6,3.2,L[0],L[1]);g.beginPath();g.arc(8,6,3.2,0,7);olStroke(g,.6);});
  tiles[BUSH]=mk((g,v)=>{grass(g,v);g.fillStyle="rgba(0,0,0,.2)";g.beginPath();g.ellipse(8.5,13,6,2,0,0,7);g.fill();g.beginPath();g.ellipse(8,9,6,5,0,0,7);g.fillStyle=L[0];g.fill();olStroke(g,1);
    g.fillStyle=L[1];g.beginPath();g.ellipse(6.5,7.5,3,2,0,0,7);g.fill();if(season<3){g.fillStyle="#e8204a";for(let i=0;i<3;i++){g.beginPath();g.arc(5+hash2(i,v,5)*7,8+hash2(i,v,6)*3,1,0,7);g.fill();}}});
  tiles[TREE]=mk((g,v)=>{grass(g,v);g.fillStyle="rgba(20,10,0,.28)";g.beginPath();g.ellipse(9,14,6,2.2,0,0,7);g.fill();g.fillStyle="#8a5228";g.beginPath();g.moveTo(6.5,15);g.lineTo(7.5,7);g.lineTo(9.5,7);g.lineTo(10.5,15);g.closePath();g.fill();olStroke(g,.8);});
  tiles.canopy=[0,1,2,3].map(v=>{const c=mkCanvas(48,44),g=c.getContext("2d");g.scale(2,2);g.translate(4,4);
    const cs=[[8,9,7],[4.5,7,5],[11.5,6.5,5],[8,3.5,5]];g.fillStyle=L[2];for(const [x,y,r] of cs){g.beginPath();g.arc(x,y+1,r+.8,0,7);g.fill();}
    g.beginPath();for(const [x,y,r] of cs){g.moveTo(x+r,y);g.arc(x,y,r,0,7);}g.fillStyle=L[0];g.fill();
    g.strokeStyle=OL;g.lineWidth=1.1;for(const [x,y,r] of cs){g.beginPath();g.arc(x,y,r,Math.PI*0.9,Math.PI*2.2);g.stroke();}
    g.fillStyle=L[1];for(const [x,y,r] of cs){g.beginPath();g.arc(x-r*.3,y-r*.35,r*.45,0,7);g.fill();}
    if(season===0||(v===1&&season===1)){g.fillStyle=L[3];for(let i=0;i<4;i++){g.beginPath();g.arc(2+hash2(i,v,9)*12,1+hash2(i,v,8)*10,.9,0,7);g.fill();}}
    if(v===2&&season<2){g.fillStyle="#ff8a20";for(let i=0;i<3;i++){g.beginPath();g.arc(4+i*4,6+(i%2)*3,1.2,0,7);g.fill();}}return c;});
  return tiles;}
// stone borders where paths meet grass
function blendEdges(g,tx,ty,t,px0,py0){if(t===COBBLE){const nb=[[0,-1],[0,1],[-1,0],[1,0]];for(const [dx,dy] of nb){const n=tAt(tx+dx,ty+dy);if(n===GRASS||n===FLOWER||n===FOREST||n===TREE||n===BUSH){
    g.fillStyle="#a8987e";g.strokeStyle=OL;g.lineWidth=.6;for(let k=0;k<4;k++){const ox=dx?(dx>0?14.5:1.5):k*4+2,oy=dy?(dy>0?14.5:1.5):k*4+2;g.beginPath();g.ellipse(px0+ox,py0+oy,dx?1.5:2,dy?1.5:2,0,0,7);g.fill();g.stroke();}}}return;}
  if(t===GRASS||t===FLOWER||t===FOREST||t===TREE||t===BUSH){return;}
  return blendEdgesBase(g,tx,ty,t,px0,py0);}
// ---- buildings: 3/4 view, roof + front, thick outline ----
function buildingSprite(b){const key=b.id+":"+b.kind+":"+(b.owned?1:0)+":v3";let c=bldCache.get(key);if(c)return c;
  const s=SETS[b.s]||{roof:["#c8402a","#8a2a1a"],wall:"#f4e6c8",gem:"#ff6"};const w=b.w*16,h=b.h*16+30;c=mkCanvas(w*2,h*2);const g=c.getContext("2d");g.scale(2,2);c.lw=w;c.lh=h;g.lineJoin="round";
  const tile=(b.s===0||b.kind==="inn")&&b.kind!=="guild";const rc=b.kind==="guild"?["#4a7ad8","#2a4a98"]:b.kind==="shop"?["#a8642e","#6e3c18"]:tile?["#d8503a","#98301e"]:b.s===4?["#e8c050","#a88020"]:s.roof;
  const base=h-6,wallTop=h-30;
  // stone base
  g.fillStyle="#a8a0a0";g.fillRect(3,base,w-6,6);for(let x=3;x<w-3;x+=6){g.fillStyle=(x/6)%2?"#c0b8b4":"#9a9290";g.fillRect(x+.5,base+.5,5,5);g.strokeStyle=OL;g.lineWidth=.5;g.strokeRect(x+.5,base+.5,5,5);}
  // wall with timber frame
  g.fillStyle=s.wall||"#f4e6c8";g.fillRect(4,wallTop,w-8,base-wallTop);g.fillStyle="rgba(0,0,0,.08)";g.fillRect(w-14,wallTop,10,base-wallTop);
  g.fillStyle="#7a4a24";g.fillRect(4,wallTop,w-8,2);g.fillRect(4,wallTop,2.5,base-wallTop);g.fillRect(w-6.5,wallTop,2.5,base-wallTop);g.fillRect(w/2-10,wallTop,2,base-wallTop);g.fillRect(w/2+8,wallTop,2,base-wallTop);
  g.strokeStyle="#7a4a24";g.lineWidth=1.5;g.beginPath();g.moveTo(6,wallTop+2);g.lineTo(w/2-10,base);g.moveTo(w-6,wallTop+2);g.lineTo(w/2+10,base);g.stroke();
  // windows with shutters
  for(const wx of [9,w-19]){g.fillStyle="#5a3a1a";g.fillRect(wx-3,wallTop+6,3,10);g.fillRect(wx+10,wallTop+6,3,10);g.fillStyle="#7ac8f0";g.fillRect(wx,wallTop+6,10,10);g.fillStyle="#c8ecff";g.fillRect(wx+1,wallTop+7,4,3);
    g.strokeStyle=OL;g.lineWidth=1;g.strokeRect(wx,wallTop+6,10,10);g.beginPath();g.moveTo(wx+5,wallTop+6);g.lineTo(wx+5,wallTop+16);g.moveTo(wx,wallTop+11);g.lineTo(wx+10,wallTop+11);g.stroke();
    g.fillStyle="#d04a5a";g.fillRect(wx-1,wallTop+17,12,2.5);g.fillStyle="#ff8ac0";g.fillRect(wx+1,wallTop+16,2,1.5);g.fillRect(wx+6,wallTop+16,2,1.5);}
  // door
  const dx=w/2-6;g.beginPath();g.moveTo(dx,base);g.lineTo(dx,wallTop+12);g.arc(dx+6,wallTop+12,6,Math.PI,0);g.lineTo(dx+12,base);g.closePath();g.fillStyle="#8a4e22";g.fill();g.strokeStyle=OL;g.lineWidth=1.2;g.stroke();
  g.strokeStyle="#5a3010";g.lineWidth=.7;g.beginPath();g.moveTo(dx+4,wallTop+9);g.lineTo(dx+4,base);g.moveTo(dx+8,wallTop+9);g.lineTo(dx+8,base);g.stroke();g.fillStyle="#f0c850";g.beginPath();g.arc(dx+9.5,wallTop+19,1,0,7);g.fill();
  g.fillStyle="#c0b8b4";g.fillRect(dx-2,base,16,3);g.strokeStyle=OL;g.lineWidth=.6;g.strokeRect(dx-2,base,16,3);
  // roof: big front slope with shingles
  const ry=2,rb=wallTop+3;g.beginPath();g.moveTo(-1,rb);g.lineTo(8,ry);g.lineTo(w-8,ry);g.lineTo(w+1,rb);g.closePath();const gr=g.createLinearGradient(0,ry,0,rb);gr.addColorStop(0,rc[0]);gr.addColorStop(1,rc[1]);g.fillStyle=gr;g.fill();
  g.save();g.clip();for(let y=ry+4,row=0;y<rb+4;y+=5,row++){g.fillStyle="rgba(0,0,0,.22)";g.fillRect(0,y,w,1);for(let x=(row%2)*4-4;x<w+4;x+=8){g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+4,y+3.5,x+8,y);g.strokeStyle="rgba(40,15,5,.45)";g.lineWidth=.6;g.stroke();
      g.fillStyle="rgba(255,255,255,.12)";g.fillRect(x+1.5,y-3.5,3,1);}}g.restore();
  g.beginPath();g.moveTo(-1,rb);g.lineTo(8,ry);g.lineTo(w-8,ry);g.lineTo(w+1,rb);g.closePath();olStroke(g,1.6);
  g.fillStyle=shadeHex(rc[0],1.25);g.fillRect(9,ry,w-18,2.5);g.strokeStyle=OL;g.lineWidth=1;g.strokeRect(9,ry,w-18,2.5);
  // chimney
  g.fillStyle="#b0a8a8";g.fillRect(w-20,ry-6,7,12);g.strokeStyle=OL;g.lineWidth=1;g.strokeRect(w-20,ry-6,7,12);g.fillStyle="#8a8080";g.fillRect(w-21,ry-8,9,3);g.strokeRect(w-21,ry-8,9,3);
  // kind extras
  if(b.kind==="shop"){for(let i=0;i<6;i++){g.fillStyle=i%2?"#fff6ea":"#e03a3a";g.beginPath();g.moveTo(8+i*(w-16)/6,wallTop-1);g.lineTo(8+(i+1)*(w-16)/6,wallTop-1);g.lineTo(8+(i+1)*(w-16)/6,wallTop+6);g.quadraticCurveTo(8+(i+.5)*(w-16)/6,wallTop+9,8+i*(w-16)/6,wallTop+6);g.fill();}
    g.strokeStyle=OL;g.lineWidth=1;g.strokeRect(8,wallTop-1,w-16,7);}
  if(b.kind==="guild"){g.fillStyle="#2a4a98";g.fillRect(w/2-4,wallTop-14,8,12);g.beginPath();g.moveTo(w/2-4,wallTop-2);g.lineTo(w/2,wallTop+1);g.lineTo(w/2+4,wallTop-2);g.fill();g.strokeStyle=OL;g.strokeRect(w/2-4,wallTop-14,8,12);g.fillStyle="#f0c850";g.fillRect(w/2-1.5,wallTop-11,3,5);}
  const sign={inn:"🍺",shop:"🛍",guild:"⚔",harbor:"⚓",forsale:b.owned?"🏠":"SALE"}[b.kind];
  if(sign){g.fillStyle="#7a4a24";g.fillRect(w-12,wallTop+2,1.5,8);g.fillStyle="#e8d0a0";g.fillRect(w-17,wallTop+9,12,8);g.strokeStyle=OL;g.lineWidth=.8;g.strokeRect(w-17,wallTop+9,12,8);g.font=(sign.length>2?"4px":"6px")+" system-ui";g.textAlign="center";g.fillStyle="#3a2010";g.fillText(sign,w-11,wallTop+15.5);}
  // whole silhouette outline
  g.strokeStyle=OL;g.lineWidth=1.6;g.strokeRect(4,wallTop,w-8,base-wallTop+6);
  bldCache.set(key,c);return c;}
function shadeHex(hx,f){const c=hexRGB(hx).map(v=>clamp(Math.round(v*f),0,255));return`rgb(${c[0]},${c[1]},${c[2]})`;}
// ---- settlement props ----
let PROPS=[];
function genProps(){PROPS=[];const doors=buildings.map(b=>({x:b.x+1.5,y:b.y+b.h}));const free=(x,y)=>!OCC[y*WW+x]&&!SOLID_T.has(T[y*WW+x])&&!doors.some(d=>Math.abs(d.x-x)<2&&Math.abs(d.y-y)<2)&&T[y*WW+x]!==DEEP;
  const put=(type,x,y,solid)=>{if(!free(x,y))return false;PROPS.push({type,x,y});if(solid)OCC[y*WW+x]=-1;return true;};
  for(const s of SETS){const town=s.kind.includes("town");
    put(town?"fountain":"well",s.x+2,s.y+1,true);
    for(const [dx,dy] of [[-4,-3],[4,-3],[-4,3],[4,3]])put("lamp",s.x+dx,s.y+dy,false);
    put("bench",s.x-2,s.y+2,false);put("bench",s.x+3,s.y-1,false);
    if(town){put("statue",s.x-5,s.y+1,true);put("stall",s.x+5,s.y+1,true);put("arch",s.x+s.r,s.y,false);}else{put("gazebo",s.x-4,s.y+3,true);}
    put("crates",s.x+6,s.y-2,false);put("logs",s.x-6,s.y-3,false);put("topiary",s.x-3,s.y-3,true);put("topiary",s.x+4,s.y+3,true);put("flowers",s.x+1,s.y+3,false);put("flowers",s.x-1,s.y-3,false);
    if(town){for(let k=0;k<5;k++)put("stall",s.x-5+k*3,s.y+3,true);put("crates",s.x-6,s.y+5,false);put("crates",s.x+7,s.y+5,false);put("logs",s.x+6,s.y+2,false);
      for(let gy=-3;gy<=3;gy++)for(let gx=-3;gx<=3;gx++){const lx=s.x+gx*7-1,ly=s.y+gy*6-1;if(Math.hypot(lx-s.x,ly-s.y)<s.r-2&&(gx||gy))put("lamp",lx,ly,false);}}
    else for(let gy=-2;gy<=2;gy++)for(let gx=-2;gx<=2;gx++){const lx=s.x+gx*7-1,ly=s.y+gy*6-1;if(Math.hypot(lx-s.x,ly-s.y)<s.r-3&&(gx||gy)&&hash2(gx,gy,s.id)<0.5)put(hash2(gx,gy,9)<0.5?"pumpkins":"logs",lx,ly,true);}
    if(s.farm){for(let x=s.farm.x-1;x<=s.farm.x+s.farm.w;x++){put("fence",x,s.farm.y-1,false);}put("pumpkins",s.farm.x+s.farm.w,s.farm.y+1,false);put("pumpkins",s.farm.x-1,s.farm.y+2,false);}}
  for(const c of CAMPS){for(let i=0;i<3;i++)PROPS.push({type:"tent",x:c.x-3+i*3,y:c.y-1});PROPS.push({type:"campfire",x:c.x,y:c.y+1});}}
function drawProp(p){const x=p.x*16,y=p.y*16;ctx.lineJoin="round";const ol=()=>{ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.stroke();};
  switch(p.type){
  case "fountain":drawShadow(x+8,y+14,11,4);ctx.beginPath();ctx.ellipse(x+8,y+11,11,5,0,0,7);ctx.fillStyle="#c8c0c8";ctx.fill();ol();ctx.beginPath();ctx.ellipse(x+8,y+10,9,3.6,0,0,7);ctx.fillStyle="#4ed0e0";ctx.fill();
    ctx.fillStyle="#b0a8b0";ctx.fillRect(x+6,y-2,4,12);ctx.strokeStyle=OL;ctx.strokeRect(x+6,y-2,4,12);ctx.beginPath();ctx.ellipse(x+8,y-2,5,2,0,0,7);ctx.fillStyle="#c8c0c8";ctx.fill();ol();
    ctx.fillStyle="rgba(220,255,255,.85)";for(let i=0;i<5;i++){const a=i/5*7+frameN*.05;ctx.fillRect(x+8+Math.cos(a)*(3+(frameN+i*7)%10*.4),y-3+((frameN+i*7)%10)*1.2,1.2,1.2);}break;
  case "well":drawShadow(x+8,y+14,8,3);ctx.fillStyle="#b0a8a8";ctx.fillRect(x+1,y+6,14,8);ctx.strokeStyle=OL;ctx.strokeRect(x+1,y+6,14,8);ctx.fillStyle="#2a5a8a";ctx.fillRect(x+3,y+6,10,2);ctx.fillStyle="#7a4a24";ctx.fillRect(x+2,y-4,2,10);ctx.fillRect(x+12,y-4,2,10);
    ctx.beginPath();ctx.moveTo(x-1,y-3);ctx.lineTo(x+8,y-9);ctx.lineTo(x+17,y-3);ctx.closePath();ctx.fillStyle="#a8642e";ctx.fill();ol();break;
  case "lamp":{drawShadow(x+8,y+15,4,1.5);ctx.fillStyle="#3a3040";ctx.fillRect(x+7,y-8,2,23);ctx.fillRect(x+5,y+13,6,2);ctx.fillStyle="#3a3040";ctx.fillRect(x+4,y-14,8,7);const lit=darkness()>.05;ctx.fillStyle=lit?"#fff2a0":"#f0e0a0";ctx.fillRect(x+5,y-13,6,5);
    ctx.strokeStyle=OL;ctx.strokeRect(x+4,y-14,8,7);ctx.beginPath();ctx.moveTo(x+3,y-14);ctx.lineTo(x+8,y-18);ctx.lineTo(x+13,y-14);ctx.closePath();ctx.fillStyle="#3a3040";ctx.fill();
    if(lit){ctx.globalCompositeOperation="lighter";const d=darkness();const g=ctx.createRadialGradient(x+8,y-10,2,x+8,y-10,52);g.addColorStop(0,`rgba(255,200,110,${d*.8})`);g.addColorStop(1,"rgba(255,160,60,0)");ctx.fillStyle=g;ctx.fillRect(x-44,y-62,104,104);ctx.globalCompositeOperation="source-over";}break;}
  case "bench":drawShadow(x+8,y+13,8,2);ctx.fillStyle="#a8642e";ctx.fillRect(x,y+4,16,3);ctx.fillRect(x,y+8,16,3);ctx.fillStyle="#6e3c18";ctx.fillRect(x+1,y+11,2,4);ctx.fillRect(x+13,y+11,2,4);ctx.strokeStyle=OL;ctx.strokeRect(x,y+4,16,7);break;
  case "statue":drawShadow(x+8,y+14,8,3);ctx.fillStyle="#d8d4dc";ctx.fillRect(x+2,y+6,12,8);ctx.strokeStyle=OL;ctx.strokeRect(x+2,y+6,12,8);ctx.fillStyle="#e8e4ec";ctx.fillRect(x+5,y-8,6,14);ctx.strokeRect(x+5,y-8,6,14);ctx.beginPath();ctx.arc(x+8,y-11,3.5,0,7);ctx.fill();ol();
    ctx.fillStyle="#c8c4cc";ctx.fillRect(x+11,y-14,1.5,18);break;
  case "stall":drawShadow(x+8,y+14,10,3);ctx.fillStyle="#8a5228";ctx.fillRect(x-2,y+4,20,9);ctx.strokeStyle=OL;ctx.strokeRect(x-2,y+4,20,9);ctx.fillStyle="#ff9a3a";ctx.fillRect(x,y+3,4,3);ctx.fillStyle="#7ad040";ctx.fillRect(x+6,y+3,4,3);ctx.fillStyle="#e83a3a";ctx.fillRect(x+12,y+3,4,3);
    ctx.fillStyle="#7a4a24";ctx.fillRect(x-2,y-10,2,14);ctx.fillRect(x+16,y-10,2,14);for(let i=0;i<5;i++){ctx.fillStyle=i%2?"#fff":"#3a7ae0";ctx.fillRect(x-3+i*4.4,y-12,4.4,6);}ctx.strokeRect(x-3,y-12,22,6);break;
  case "arch":ctx.fillStyle="#d8d0c8";ctx.fillRect(x-2,y-16,5,30);ctx.fillRect(x+15,y-16,5,30);ctx.strokeStyle=OL;ctx.strokeRect(x-2,y-16,5,30);ctx.strokeRect(x+15,y-16,5,30);ctx.beginPath();ctx.moveTo(x-3,y-14);ctx.quadraticCurveTo(x+9,y-28,x+21,y-14);ctx.lineTo(x+21,y-10);ctx.quadraticCurveTo(x+9,y-23,x-3,y-10);ctx.closePath();ctx.fillStyle="#e8e0d8";ctx.fill();ol();
    ctx.fillStyle="#f0c850";ctx.beginPath();ctx.arc(x+9,y-20,2,0,7);ctx.fill();break;
  case "gazebo":drawShadow(x+8,y+14,14,4);ctx.fillStyle="#7a4a24";for(const dx of [-6,20])ctx.fillRect(x+dx,y-6,2,20);ctx.beginPath();ctx.ellipse(x+8,y+12,14,4,0,0,7);ctx.fillStyle="#c8b8a0";ctx.fill();ol();
    ctx.beginPath();ctx.moveTo(x-10,y-4);ctx.lineTo(x+8,y-18);ctx.lineTo(x+26,y-4);ctx.closePath();ctx.fillStyle="#9a5a2a";ctx.fill();ol();break;
  case "crates":drawShadow(x+8,y+14,7,2);ctx.fillStyle="#c08a4a";ctx.fillRect(x+1,y+4,9,9);ctx.fillRect(x+8,y+7,7,7);ctx.strokeStyle=OL;ctx.strokeRect(x+1,y+4,9,9);ctx.strokeRect(x+8,y+7,7,7);ctx.beginPath();ctx.moveTo(x+1,y+4);ctx.lineTo(x+10,y+13);ctx.stroke();break;
  case "logs":drawShadow(x+8,y+14,8,2);for(const [lx,ly] of [[2,9],[8,9],[5,5]]){ctx.fillStyle="#8a5228";ctx.fillRect(x+lx,y+ly,6,4);ctx.strokeStyle=OL;ctx.strokeRect(x+lx,y+ly,6,4);ctx.fillStyle="#e8c888";ctx.beginPath();ctx.ellipse(x+lx+6,y+ly+2,1.4,2,0,0,7);ctx.fill();ctx.stroke();}break;
  case "topiary":{const L=LEAF2[season()];drawShadow(x+8,y+14,5,2);ctx.fillStyle="#8a5a3a";ctx.fillRect(x+5,y+10,6,4);ctx.strokeStyle=OL;ctx.strokeRect(x+5,y+10,6,4);ctx.beginPath();ctx.ellipse(x+8,y+2,5,9,0,0,7);ctx.fillStyle=L[0];ctx.fill();ol();ctx.fillStyle=L[1];ctx.beginPath();ctx.ellipse(x+6.5,y-1,2,4,0,0,7);ctx.fill();break;}
  case "flowers":for(let i=0;i<5;i++){ctx.fillStyle=["#ff6aa8","#ffd23a","#a46aff","#ff8a3a","#fff"][i];ctx.beginPath();ctx.arc(x+3+i*2.5,y+8+(i%2)*3,1.6,0,7);ctx.fill();}break;
  case "fence":ctx.fillStyle="#a8743e";ctx.fillRect(x,y+6,16,2);ctx.fillRect(x,y+10,16,2);ctx.fillRect(x+2,y+3,2,11);ctx.fillRect(x+12,y+3,2,11);ctx.strokeStyle=OL;ctx.lineWidth=.6;ctx.strokeRect(x+2,y+3,2,11);ctx.strokeRect(x+12,y+3,2,11);break;
  case "pumpkins":for(const [px2,py2,r] of [[5,10,3.5],[11,11,3],[8,6,2.6]]){drawShadow(x+px2,y+py2+3,r,1);ctx.beginPath();ctx.ellipse(x+px2,y+py2,r*1.2,r,0,0,7);ctx.fillStyle="#ff8a20";ctx.fill();ol();ctx.fillStyle="#3a7a20";ctx.fillRect(x+px2-.5,y+py2-r-1.5,1.5,2);}break;
  case "tent":drawShadow(x+8,y+14,9,3);ctx.beginPath();ctx.moveTo(x-2,y+14);ctx.lineTo(x+8,y-4);ctx.lineTo(x+18,y+14);ctx.closePath();ctx.fillStyle="#8a6a3a";ctx.fill();ol();ctx.beginPath();ctx.moveTo(x+6,y+14);ctx.lineTo(x+8,y+6);ctx.lineTo(x+10,y+14);ctx.fillStyle="#3a2010";ctx.fill();
    ctx.fillStyle="#a02020";ctx.fillRect(x+8,y-10,1,7);ctx.fillRect(x+9,y-10,5,3);break;
  case "campfire":ctx.fillStyle="#6a4020";ctx.fillRect(x+2,y+9,12,3);ctx.globalCompositeOperation="lighter";ctx.fillStyle="#ff8a30";ctx.beginPath();ctx.ellipse(x+8,y+6-Math.random(),3,5,0,0,7);ctx.fill();ctx.globalCompositeOperation="source-over";break;
  }}
function drawTorches(){/* replaced by lamp-post props */}
// ===== SETTLEMENT WALLS & GATES =====
let WALLS=[],GATES=[],TOWERS=[];const WALLIDX=new Map();
function wallR(s){return s.r+3;}
function gateTiles_unused(s){const R=wallR(s);return[{d:"N",t:[[s.x,s.y-R],[s.x+1,s.y-R]],o:[0,-1]},{d:"S",t:[[s.x,s.y+R],[s.x+1,s.y+R]],o:[0,1]},{d:"W",t:[[s.x-R,s.y],[s.x-R,s.y+1]],o:[-1,0]},{d:"E",t:[[s.x+R,s.y],[s.x+R,s.y+1]],o:[1,0]}];}
function genWalls(){WALLS=[];GATES=[];TOWERS=[];WALLIDX.clear();
  for(const s of SETS){const R=wallR(s);const ring=[];
    for(let y=s.y-R-1;y<=s.y+R+1;y++)for(let x=s.x-R-1;x<=s.x+R+1;x++){const d=Math.max(Math.abs(x-s.x-0.5),Math.abs(y-s.y-0.5))*0.55+Math.hypot(x-s.x-0.5,y-s.y-0.5)*0.45;
      if(Math.abs(d-R)>0.6)continue;const i=y*WW+x;if(T[i]===DEEP&&!(x===s.x||x===s.x+1||y===s.y||y===s.y+1))continue;if(OCC[i]>0)continue;ring.push([x,y]);}
    const gs=[{d:"N",f:([x,y])=>(x===s.x||x===s.x+1)&&y<s.y,o:[0,-1]},{d:"S",f:([x,y])=>(x===s.x||x===s.x+1)&&y>s.y,o:[0,1]},{d:"W",f:([x,y])=>(y===s.y||y===s.y+1)&&x<s.x,o:[-1,0]},{d:"E",f:([x,y])=>(y===s.y||y===s.y+1)&&x>s.x,o:[1,0]}];
    const gateSet=new Set();
    for(const g of gs){const t=ring.filter(g.f);t.sort((p,q)=>(p[0]-q[0])||(p[1]-q[1]));for(const [x,y] of t)gateSet.add(x+","+y);
      // outermost tile along the axis is the gate anchor
      const out=t.slice().sort((p,q)=>(q[0]*g.o[0]+q[1]*g.o[1])-(p[0]*g.o[0]+p[1]*g.o[1]));
      const gate={s:s.id,d:g.d,tiles:t,o:g.o,x:out[0][0],y:out[0][1]};GATES.push(gate);
      for(const [x,y] of t){const i=y*WW+x;OCC[i]=0;if(T[i]!==DEEP&&T[i]!==PIER&&T[i]!==SHAL)T[i]=ROAD;ELEV[i]=0;
        for(let k=-4;k<=7;k++){const cx=x+g.o[0]*k,cy=y+g.o[1]*k;if(cx<0||cy<0||cx>=WW||cy>=WH)continue;const j=cy*WW+cx;if(OCC[j]>0||gateSet.has(cx+","+cy))continue;if(ring.some(([a,b2])=>a===cx&&b2===cy)&&k!==0)continue;
          if(T[j]===DEEP||T[j]===SHAL||T[j]===PIER){if(k>0&&k<=3&&T[j]!==PIER)T[j]=PIER;continue;}if(T[j]===CLIFF)T[j]=STAIRS;else if(T[j]!==COBBLE&&T[j]!==PIER)T[j]=ROAD;if(OCC[j]<0)OCC[j]=0;ELEV[j]=ELEV[y*WW+x];}}}
    for(const [x,y] of ring){if(gateSet.has(x+","+y))continue;const i=y*WW+x;if(T[i]===DEEP)continue;
      if(T[i]===TREE||T[i]===BUSH||T[i]===ROCK)T[i]=GRASS;if(T[i]===CLIFF)T[i]=MTN;const w={x,y,s:s.id,i:WALLS.length};WALLS.push(w);WALLIDX.set(i,w.i);OCC[i]=-3;}
    // seal diagonal-only joints
    const isW=(x,y)=>WALLIDX.has(y*WW+x);
    for(const w of WALLS.filter(w=>w.s===s.id))for(const [dx,dy] of [[1,1],[1,-1]]){const x2=w.x+dx,y2=w.y+dy;if(!isW(x2,y2))continue;if(isW(w.x+dx,w.y)||isW(w.x,w.y+dy))continue;
      for(const [cx,cy] of [[w.x+dx,w.y],[w.x,w.y+dy]]){const i=cy*WW+cx;if(gateSet.has(cx+","+cy)||OCC[i]>0||T[i]===DEEP)continue;if(T[i]===TREE||T[i]===BUSH||T[i]===ROCK)T[i]=GRASS;const nw={x:cx,y:cy,s:s.id,i:WALLS.length};WALLS.push(nw);WALLIDX.set(i,nw.i);OCC[i]=-3;break;}}
    if(s.kind.includes("town"))for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const tx=Math.round(s.x+dx*R*0.78),ty=Math.round(s.y+dy*R*0.78);TOWERS.push({x:tx,y:ty,s:s.id,cd:0});}}
  // gate-to-gate roads between connected settlements
  const link=(a,b)=>{const ga=pickGate(a,b),gb=pickGate(b,a);let x=ga.x+ga.o[0]*3,y=ga.y+ga.o[1]*3;const ex=gb.x+gb.o[0]*3,ey=gb.y+gb.o[1]*3;
    const lay=(x,y)=>{for(let k=0;k<2;k++){const j=y*WW+x+k;if(OCC[j]||WALLIDX.has(j))continue;const t=T[j];if(t===DEEP||t===SHAL)T[j]=RIVERM[j]?BRIDGE:PIER;else if(t===CLIFF)T[j]=STAIRS;else if(t!==COBBLE&&t!==PIER)T[j]=ROAD;}};
    while(x!==ex){lay(x,y);x+=Math.sign(ex-x);}while(y!==ey){lay(x,y);y+=Math.sign(ey-y);}lay(x,y);};
  link(SETS[0],SETS[1]);link(SETS[0],SETS[2]);link(SETS[0],SETS[3]);link(SETS[0],SETS[4]);}
function pickGate(a,b){const dx=b.x-a.x,dy=b.y-a.y;const d=Math.abs(dx)>Math.abs(dy)?(dx>0?"E":"W"):(dy>0?"S":"N");return GATES.find(g=>g.s===a.id&&g.d===d);}
const wallHp=i=>world&&world.walls&&world.walls[i]!=null?world.walls[i]:10;
function applyWalls(){if(!world.walls)world.walls={};for(const w of WALLS){OCC[w.y*WW+w.x]=wallHp(w.i)>0?-3:0;}}
function gateClosed(g){const h=hour();return world.sets[g.s].raid||world.sets[g.s].dragon||h>=22||h<6;}
function gateAt(tx,ty){for(const g of GATES)for(const [x,y] of g.tiles)if(x===tx&&y===ty)return g;return null;}
function damageWall(i,n){if(!world.walls)world.walls={};const hp=wallHp(i)-n;world.walls[i]=Math.max(0,hp);if(hp<=0){const w=WALLS[i];OCC[w.y*WW+w.x]=0;invalidateTile(w.x,w.y);addNews(w.s,`Raiders broke through the wall of ${SETS[w.s].name}!`);}}
function wallDaily(){if(!world.walls)return;for(const k in world.walls){const hp=world.walls[k];if(hp<10){world.walls[k]=Math.min(10,hp+3);if(world.walls[k]>0){const w=WALLS[k];OCC[w.y*WW+w.x]=-3;}}}}
function wallHourly(){}
function raiderAI(e){const S=SETS[e.raidOf];if(!S)return false;const R=wallR(S);const tx=(e.x+e.w/2)/TILE,ty=(e.y+e.h/2)/TILE;const inside=Math.hypot(tx-S.x,ty-S.y)<R-0.5;if(inside)return false;
  // head for nearest gate; batter it if closed, else walk through
  let g=null,bd=1e9;for(const q of GATES)if(q.s===S.id){const d=Math.hypot(q.x-tx,q.y-ty);if(d<bd){bd=d;g=q;}}if(!g)return false;
  const gx=(g.x+0.5+g.o[0]*1.2)*TILE,gy=(g.y+0.5+g.o[1]*1.2)*TILE;const dx=gx-e.x,dy=gy-e.y,l=Math.hypot(dx,dy);
  if(l>10){moveEntity(e,dx/l*e.spd,dy/l*e.spd);if(e.atkCd>0)e.atkCd--;
    // blocked by a wall section? batter it
    if(Math.abs(e.x-(e.lx||0))+Math.abs(e.y-(e.ly||0))<0.05){for(const w of WALLS)if(w.s===S.id&&Math.hypot(w.x*16+8-e.x,w.y*16+8-e.y)<22&&wallHp(w.i)>0){if((e.atkCd||0)<=0){e.atkCd=60;damageWall(w.i,1);e.gest=10;shake=1;}break;}}
    e.lx=e.x;e.ly=e.y;return true;}
  if(gateClosed(g)){g.hp=(g.hp==null?12:g.hp);if((e.atkCd||0)<=0){e.atkCd=60;g.hp--;SFX.hit();if(g.hp<=0){g.broken=world.day;addNews(S.id,`Raiders smashed the ${g.d} gate of ${S.name}!`);}}else e.atkCd--;
    if(!(g.hp<=0))return true;}
  moveEntity(e,-g.o[0]*e.spd*1.2,-g.o[1]*e.spd*1.2);return true;}
function towersTick(){if(frameN%20)return;for(const t of TOWERS){if(Math.hypot(t.x*16-hero.x,t.y*16-hero.y)>420)continue;t.cd=(t.cd||0)-20;if(t.cd>0)continue;
  let tgt=null,bd=150;for(const m of mobs){if(m.dead||!m.def||m.def.beh!=="agg")continue;const d=Math.hypot(m.x-t.x*16,m.y-t.y*16);if(d<bd){bd=d;tgt=m;}}
  if(tgt){t.cd=90;const ang=Math.atan2(tgt.y-t.y*16+10,tgt.x-t.x*16);fx.push({k:"ice",x:t.x*16+8,y:t.y*16-10,vx:Math.cos(ang)*4.5,vy:Math.sin(ang)*4.5,life:50,dmg:1,pierce:false,hit:new Set(),ang,ally:1});}}}
function drawWallsList(list,vis){const town=new Set(SETS.filter(s=>s.kind.includes("town")).map(s=>s.id));
  for(const w of WALLS){if(!vis(w.x*16,w.y*16,40))continue;list.push({y:w.y*16+15,f:()=>{const x=w.x*16,y=w.y*16,hp=wallHp(w.i);
    if(hp<=0){ctx.fillStyle="#8a8078";for(let k=0;k<4;k++){ctx.beginPath();ctx.ellipse(x+3+k*3.5,y+12+(k%2)*2,2.5,1.8,0,0,7);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=.6;ctx.stroke();}return;}
    if(town.has(w.s)){ctx.fillStyle="rgba(30,15,10,.25)";ctx.fillRect(x+2,y+12,16,5);ctx.fillStyle="#b8b0b0";ctx.fillRect(x,y-8,16,22);for(let r=0;r<4;r++)for(let c=0;c<2;c++){ctx.fillStyle=(r+c)%2?"#cfc8c4":"#a8a09c";ctx.fillRect(x+c*8+(r%2?4:0)-(r%2?4:0)+.5,y-8+r*5.5+.5,7,5);}
      ctx.fillStyle="#d8d2ce";for(let c=0;c<3;c++)ctx.fillRect(x+c*6,y-12,4,4);ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.strokeRect(x,y-8,16,22);for(let c=0;c<3;c++)ctx.strokeRect(x+c*6,y-12,4,4);}
    else{ctx.fillStyle="rgba(30,15,10,.25)";ctx.fillRect(x+2,y+12,16,4);for(let k=0;k<4;k++){const sx=x+k*4;ctx.fillStyle=k%2?"#a8743e":"#946232";ctx.fillRect(sx,y-6,4,19);ctx.beginPath();ctx.moveTo(sx,y-6);ctx.lineTo(sx+2,y-10);ctx.lineTo(sx+4,y-6);ctx.fill();
      ctx.strokeStyle=OL;ctx.lineWidth=.7;ctx.strokeRect(sx,y-6,4,19);}ctx.fillStyle="#6e4422";ctx.fillRect(x,y+1,16,2);}
    if(hp<10){ctx.strokeStyle="#3a2010";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+3,y-4);ctx.lineTo(x+8,y+3);ctx.lineTo(x+6,y+8);ctx.stroke();}}});}
  for(const g of GATES){const x=g.tiles[0][0]*16,y=g.tiles[0][1]*16;if(!vis(x,y,50))continue;const horiz=g.d==="N"||g.d==="S";const town2=town.has(g.s);
    list.push({y:y+16+(horiz?0:16),f:()=>{const closed=gateClosed(g)&&!(g.hp<=0);ctx.lineJoin="round";
      const post=(px,py)=>{ctx.fillStyle=town2?"#c8c0bc":"#8a5a2e";ctx.fillRect(px,py-18,7,30);ctx.strokeStyle=OL;ctx.lineWidth=1;ctx.strokeRect(px,py-18,7,30);ctx.fillStyle=town2?"#5a4a8a":"#6e4422";ctx.beginPath();ctx.moveTo(px-2,py-18);ctx.lineTo(px+3.5,py-26);ctx.lineTo(px+9,py-18);ctx.closePath();ctx.fill();ctx.stroke();};
      if(horiz){post(x-6,y+2);post(x+31,y+2);ctx.fillStyle=town2?"#d8d0c8":"#a8743e";ctx.fillRect(x-4,y-18,40,6);ctx.strokeRect(x-4,y-18,40,6);
        if(closed){ctx.fillStyle="#8a4e22";ctx.fillRect(x+1,y-12,30,26);ctx.strokeRect(x+1,y-12,30,26);ctx.strokeStyle="#5a3010";for(let k=1;k<5;k++){ctx.beginPath();ctx.moveTo(x+1+k*6,y-12);ctx.lineTo(x+1+k*6,y+14);ctx.stroke();}ctx.fillStyle="#3a3040";ctx.fillRect(x+1,y-4,30,2);ctx.fillRect(x+1,y+6,30,2);}}
      else{post(x+4,y-6);post(x+4,y+33);if(closed){ctx.fillStyle="#8a4e22";ctx.fillRect(x+5,y-4,6,36);ctx.strokeStyle=OL;ctx.strokeRect(x+5,y-4,6,36);}}
      // gate guards
      const gl=chibiLook(g.s*13+(g.d.charCodeAt(0)),"guard","human");if(horiz){drawChibi(gl,x-10,y+18,0,0);drawChibi(gl,x+42,y+18,0,0);}else{drawChibi(gl,x+8+g.o[0]*14,y-6,0,0);drawChibi(gl,x+8+g.o[0]*14,y+40,0,0);}}});}
  for(const t of TOWERS){const x=t.x*16,y=t.y*16;if(!vis(x,y,60))continue;list.push({y:y+16,f:()=>{ctx.fillStyle="rgba(30,15,10,.28)";ctx.beginPath();ctx.ellipse(x+10,y+15,12,4,0,0,7);ctx.fill();
    ctx.fillStyle="#c0b8b4";ctx.fillRect(x-2,y-22,20,36);for(let r=0;r<6;r++){ctx.fillStyle=r%2?"#d0c8c4":"#aaa29e";ctx.fillRect(x-2,y-22+r*6,20,3);}ctx.strokeStyle=OL;ctx.lineWidth=1.2;ctx.strokeRect(x-2,y-22,20,36);
    ctx.beginPath();ctx.moveTo(x-5,y-22);ctx.lineTo(x+8,y-40);ctx.lineTo(x+21,y-22);ctx.closePath();ctx.fillStyle="#5a4a8a";ctx.fill();ctx.stroke();ctx.fillStyle="#2a1a3a";ctx.fillRect(x+5,y-12,6,8);
    drawChibi(chibiLook(t.x*7+t.y,"archer","human"),x+8,y-20,0,0,0.8);}});}}
// player repairs damaged walls and gates with wood
function wallRepairCheck(){if(room||!WALLS.length)return false;const hx=hero.x+6,hy=hero.y+8;let best=null,bd=26;
  for(const w of WALLS){if(wallHp(w.i)>=10)continue;const d=Math.hypot(w.x*16+8-hx,w.y*16+8-hy);if(d<bd){bd=d;best=w;}}
  let gate=null;for(const g of GATES){if(g.hp==null||g.hp>=12)continue;const d=Math.hypot(g.x*16+8-hx,g.y*16+8-hy);if(d<bd+6){gate=g;}}
  if(!best&&!gate)return false;const need=gate?3:2;
  if((P.inv.wood||0)<need){toast(`Repairing needs ${need} wood (you have ${P.inv.wood||0}). Chop some trees!`);return true;}
  P.inv.wood-=need;if(gate){gate.hp=12;gate.broken=0;}else{world.walls[best.i]=10;OCC[best.y*WW+best.x]=-3;invalidateTile(best.x,best.y);}
  SFX.hit();floatText(hx,hy-12,"Repaired!","#ffd860");burst(hx,hy,[200,160,100],12,1.4,2);
  const sid=gate?gate.s:best.s;for(const n of npcs)if(n.s===sid&&n.alive)n.friend=Math.min(100,n.friend+1);if(typeof gainExp==="function")gainExp(5);return true;}
const _interactW=interact;interact=function(){if(wallRepairCheck())return true;return _interactW.apply(this,arguments);};
// ===== ORIGINAL 16-BIT JRPG-STYLE MONSTER ROSTER =====
// Procedurally drawn, layered rigs (body/head/wings/tail/arm/legs) with bold outlines and 3-4 tone shading.
const MPAL={ // [dark, mid, light, highlight]
 blue:["#1c4aa8","#3a7ae8","#7ab8ff","#d8f0ff"],orange:["#a8401c","#e8782a","#ffb060","#fff0c8"],steel:["#4a5266","#8a94aa","#c8d0e0","#ffffff"],green:["#2a6a1c","#4aa83a","#8ae060","#e0ffc0"],
 purple:["#4a1c6a","#7a3aa8","#b070e0","#f0d0ff"],red:["#7a1020","#c02a3a","#ff6a6a","#ffd0d0"],gold:["#7a5410","#c8901c","#f0c850","#fff4c0"],teal:["#105a5a","#20a0a0","#60e0d0","#d0fff8"],
 brown:["#4a2c14","#7a4e28","#b07a48","#e8c090"],stone:["#3e3a3a","#6e6866","#a8a29c","#e0dad2"],bone:["#6a5a44","#b0a080","#e8dcc0","#ffffff"],wrap:["#6a5a3a","#a89870","#d8ccaa","#fffbe8"],
 pink:["#8a2a5a","#d8508a","#ff98c0","#ffe0f0"],black:["#14101e","#2e2840","#504866","#9088b0"],fire:["#a8200c","#f05a14","#ffb020","#fff8a0"],ice:["#2a5a9a","#5aa0e0","#a8e0ff","#ffffff"],
 lava:["#5a1408","#a8300c","#f07020","#ffd060"],moss:["#2a4a1c","#4a7a2a","#7ab048","#d0f090"],night:["#1c1440","#3a2a7a","#6a58c0","#c8c0ff"],crimson:["#4a0818","#8a1430","#d03050","#ff9aaa"]};
const MOL="#120a10";
const MONDEF={ // key: [name, shape, pal, size, opts]
 slime:["Blue Slime","slime","blue",30,{beh:"neu",hp:2,spd:.45,biome:["meadow","forest"],herd:1,parts:["core"],desc:"A wobbly, friendly-looking blob. Bites when bothered."}],
 meadowslime:["Meadow Slime","slime","green",28,{beh:"pea",hp:1,spd:.35,biome:["meadow"],herd:1,parts:["core"],desc:"Gentle grazing blobs that roam in herds."}],
 emberslime:["Ember Slime","slime","orange",32,{beh:"agg",hp:4,spd:.5,aggro:90,biome:["mountain","ruins"],tier:2,parts:["core","gem"],desc:"A hot-tempered slime swap with a fiery core."}],
 steelslime:["Steel Slime","slime","steel",30,{beh:"flee",hp:6,spd:1.1,biome:["mountain"],tier:3,gold:[20,40],parts:["gem","core"],desc:"Rare, armored and fast. Worth a fortune."}],
 kingslime:["Bubble King","slime","purple",72,{beh:"agg",hp:24,spd:.35,aggro:130,rare:1,biome:["meadow"],gold:[40,70],parts:["core","gem","gem"],desc:"A crowned giant of a slime. Rare."}],
 duskbat:["Dusk Bat","bat","night",34,{beh:"agg",hp:2,spd:.9,aggro:110,biome:["forest","ruins"],night:1,fly:1,parts:["wing","fang"],desc:"Flutters out at dusk in search of a bite."}],
 vampbat:["Crimson Bat","bat","crimson",38,{beh:"agg",hp:4,spd:1,aggro:130,biome:["ruins","mountain"],night:1,fly:1,tier:2,parts:["wing","fang","eye"],desc:"A blood-red swap of the dusk bat."}],
 imp:["Pip Imp","imp","red",34,{beh:"agg",hp:3,spd:.8,aggro:110,biome:["forest","ruins"],fly:1,parts:["horn","tail","wing"],desc:"A grinning little devil with a fork."}],
 heximp:["Hex Imp","imp","purple",36,{beh:"agg",hp:5,spd:.8,aggro:140,biome:["ruins","mountain"],fly:1,caster:[200,120,255],tier:2,parts:["horn","tail","core"],desc:"Casts crackling hexes from afar."}],
 viper:["Grass Viper","snake","green",34,{beh:"agg",hp:3,spd:.6,aggro:90,biome:["meadow","forest","shore"],parts:["fang","scale","tail"],desc:"Hides in tall grass. Quick to strike."}],
 cobra:["Sand Cobra","snake","gold",40,{beh:"agg",hp:5,spd:.6,aggro:110,biome:["shore","ruins"],tier:2,caster:[180,255,80],parts:["fang","scale","eye"],desc:"Hooded and venomous. Spits poison."}],
 snapbloom:["Snapbloom","plant","pink",36,{beh:"agg",hp:3,spd:.25,aggro:70,biome:["forest","meadow"],parts:["core","fang"],desc:"A pretty flower with very sharp teeth."}],
 venusmaw:["Gorge Maw","plant","purple",44,{beh:"agg",hp:6,spd:.25,aggro:90,biome:["forest"],tier:2,parts:["core","fang","eye"],desc:"Its bigger, hungrier cousin."}],
 treant:["Elder Treant","treant","moss",84,{beh:"neu",hp:22,spd:.35,rare:1,biome:["forest"],gold:[30,50],parts:["core","gem","wood"],desc:"An ancient walking tree. Rare and slow to anger."}],
 mudgolem:["Mud Golem","golem","brown",44,{beh:"agg",hp:7,spd:.35,aggro:90,biome:["meadow","shore"],parts:["core","hide"],desc:"Clumsy heaps of living mud."}],
 stonegolem:["Stone Golem","golem","stone",50,{beh:"agg",hp:10,spd:.35,aggro:100,biome:["mountain","ruins"],tier:2,parts:["core","gem"],desc:"Carved guardians that never tire."}],
 boss:["Ruin Colossus","golem","lava",88,{beh:"agg",hp:26,spd:.4,aggro:140,gold:[40,60],big:1,parts:["horn","core","gem"],desc:"A molten colossus that guards the old ruins."}],
 mummy:["Mummy","undead","wrap",38,{beh:"agg",hp:4,spd:.4,aggro:100,biome:["ruins"],parts:["hide","eye"],desc:"Shambling wrapped dead of the ruins."}],
 skeleton:["Bone Soldier","skeleton","bone",38,{beh:"agg",hp:4,spd:.6,aggro:110,biome:["ruins","mountain"],night:1,parts:["fang","crude"],desc:"Rattling soldiers that rise at night."}],
 wolfman:["Wolfman","beast","steel",42,{beh:"agg",hp:5,spd:.8,aggro:120,biome:["forest","meadow"],night:1,parts:["fang","claw","hide"],desc:"A howling beast-man of the woods."}],
 manebeast:["Mane Beast","lion","gold",48,{beh:"agg",hp:8,spd:.85,aggro:130,biome:["meadow","mountain"],tier:2,parts:["claw","fang","hide"],desc:"A lion-headed brute with a mighty roar."}],
 gazer:["Gazer","eye","pink",34,{beh:"agg",hp:3,spd:.5,aggro:120,biome:["ruins","forest"],fly:1,parts:["eye","core"],desc:"A floating eye that never blinks."}],
 evileye:["Evil Eye","eye","night",38,{beh:"agg",hp:5,spd:.5,aggro:150,biome:["ruins","mountain"],fly:1,caster:[255,80,200],tier:2,parts:["eye","eye","core"],desc:"Fires beams from its dreadful gaze."}],
 wisp:["Will-o'-Wisp","wisp","teal",30,{beh:"agg",hp:2,spd:.7,aggro:110,biome:["forest","shore"],night:1,fly:1,parts:["core"],desc:"A lantern-like spirit that lures travellers."}],
 firespirit:["Fire Spirit","wisp","fire",36,{beh:"agg",hp:4,spd:.7,aggro:130,biome:["mountain","ruins"],fly:1,caster:[255,140,40],tier:2,parts:["core","gem"],desc:"A living flame that hurls fireballs."}],
 knight:["Rust Knight","knight","steel",44,{beh:"agg",hp:8,spd:.5,aggro:110,biome:["ruins","meadow"],parts:["crude","core"],desc:"Empty armor that still swings its blade."}],
 dreadknight:["Dread Knight","knight","black",48,{beh:"agg",hp:12,spd:.55,aggro:130,biome:["mountain","ruins"],tier:3,parts:["crude","core","gem"],desc:"A black-armored swap. Deadly."}],
 cyclops:["Cyclops","cyclops","teal",80,{beh:"agg",hp:18,spd:.45,aggro:130,rare:1,biome:["mountain"],big:1,gold:[30,50],parts:["eye","horn","hide"],desc:"A one-eyed giant with a tree-trunk club."}],
 gargoyle:["Gargoyle","gargoyle","stone",48,{beh:"agg",hp:7,spd:.7,aggro:130,biome:["ruins","mountain"],fly:1,parts:["wing","horn","claw"],desc:"Stone statues that wake and swoop."}],
 seaserpent:["Tide Serpent","snake","teal",80,{beh:"agg",hp:20,spd:.6,aggro:150,rare:1,swims:1,big:1,gold:[30,50],parts:["scale","fang","pearl"],desc:"Rare sea terror of the coasts."}],
 demonlord:["Demon Lord Vorlag","demon","crimson",96,{beh:"agg",hp:34,spd:.4,aggro:160,big:1,boss:1,caster:[255,60,60],gold:[80,120],parts:["horn","core","gem","gem"],desc:"Lord of the deep dungeon. A true boss."}],
 archfiend:["Archfiend","demon","night",72,{beh:"agg",hp:20,spd:.45,aggro:150,biome:["mountain"],rare:1,big:1,caster:[160,120,255],tier:3,parts:["horn","wing","core"],desc:"A lesser demon lord that stalks the peaks."}]
};
// ---- tiny pixel painter helpers ----
function mcv(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");g.imageSmoothingEnabled=false;return [c,g];}
function shadeEll(g,x,y,rx,ry,p,rot){rot=rot||0;g.fillStyle=p[0];g.beginPath();g.ellipse(x,y,rx,ry,rot,0,7);g.fill();g.fillStyle=p[1];g.beginPath();g.ellipse(x-rx*.1,y-ry*.12,rx*.86,ry*.82,rot,0,7);g.fill();
  g.fillStyle=p[2];g.beginPath();g.ellipse(x-rx*.28,y-ry*.32,rx*.5,ry*.42,rot,0,7);g.fill();g.fillStyle=p[3];g.beginPath();g.ellipse(x-rx*.42,y-ry*.5,Math.max(1,rx*.16),Math.max(1,ry*.13),rot,0,7);g.fill();}
function shadeRect(g,x,y,w,h,p){g.fillStyle=p[0];g.fillRect(x,y,w,h);g.fillStyle=p[1];g.fillRect(x,y,w-Math.max(1,w*.18),h-Math.max(1,h*.12));g.fillStyle=p[2];g.fillRect(x+1,y+1,Math.max(1,w*.35),Math.max(1,h*.4));}
function poly(g,pts,col){g.fillStyle=col;g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fill();}
function eyes(g,x,y,sp,r,angry,col){for(const s of [-1,1]){const ex=x+s*sp;g.fillStyle="#fff";g.beginPath();g.ellipse(ex,y,r,r*1.2,0,0,7);g.fill();g.fillStyle=col||"#100810";g.beginPath();g.ellipse(ex+s*.3,y+r*.2,r*.55,r*.75,0,0,7);g.fill();g.fillStyle="#fff";g.fillRect(Math.round(ex-r*.3),Math.round(y-r*.5),1,1);
  if(angry){g.strokeStyle=MOL;g.lineWidth=1.2;g.beginPath();g.moveTo(ex-s*r*1.3,y-r*1.6);g.lineTo(ex+s*r*.9,y-r*.8);g.stroke();}}}
function mouth(g,x,y,w,fangs,open){g.fillStyle="#3a0810";g.beginPath();g.ellipse(x,y,w,open?w*.6:w*.3,0,0,Math.PI);g.fill();if(open){g.fillStyle="#e0405a";g.beginPath();g.ellipse(x,y+w*.35,w*.5,w*.2,0,0,7);g.fill();}
  if(fangs){g.fillStyle="#fff";poly(g,[x-w*.6,y,x-w*.35,y,x-w*.47,y+w*.45],"#fff");poly(g,[x+w*.35,y,x+w*.6,y,x+w*.47,y+w*.45],"#fff");}}
// binarize alpha, 4-tone posterize already by palette, then add a bold dark outline
function inkLayer(c){const g=c.getContext("2d");const W=c.width,H=c.height;const d=g.getImageData(0,0,W,H);const a=d.data;
  for(let i=3;i<a.length;i+=4)a[i]=a[i]>110?255:0;const o=new Uint8ClampedArray(a);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(a[i+3])continue;let n=0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H&&a[(yy*W+xx)*4+3])n++;}
    if(n){o[i]=18;o[i+1]=10;o[i+2]=16;o[i+3]=255;}}
  d.data.set(o);g.putImageData(d,0,0);return c;}
// ---- shape builders: each returns layer list drawn into same-size canvases ----
function buildMon(key){const [name,shape,pk,S,o]=MONDEF[key];const p=MPAL[pk];const W=S,H=S;const L={};
  const lay=(n,px,py,f)=>{const [c,g]=mcv(W,H);f(g);L[n]={c:inkLayer(c),px,py};};
  const u=S/40; // unit scale
  switch(shape){
  case "slime":lay("body",W/2,H,g=>{poly(g,[W*.5,H*.22,W*.62,H*.36,W*.9,H*.7,W*.88,H*.92,W*.12,H*.92,W*.1,H*.7,W*.38,H*.36],p[0]);shadeEll(g,W*.5,H*.7,W*.38,H*.24,p);poly(g,[W*.5,H*.24,W*.6,H*.48,W*.4,H*.48],p[1]);g.fillStyle=p[2];g.fillRect(W*.47,H*.3,2*u,4*u);
     eyes(g,W*.5,H*.66,W*.12,2.6*u,false);mouth(g,W*.5,H*.78,W*.12,false,true);if(key==="kingslime"){poly(g,[W*.32,H*.32,W*.36,H*.18,W*.43,H*.27,W*.5,H*.13,W*.57,H*.27,W*.64,H*.18,W*.68,H*.32],"#f0c850");g.fillStyle="#d02040";g.fillRect(W*.48,H*.22,3,3);}});break;
  case "bat":lay("wingL",W*.42,H*.5,g=>{poly(g,[W*.42,H*.45,W*.05,H*.25,W*.1,H*.5,W*.02,H*.62,W*.2,H*.6,W*.26,H*.72,W*.42,H*.58],p[0]);poly(g,[W*.4,H*.47,W*.12,H*.32,W*.16,H*.5,W*.4,H*.55],p[1]);});
     lay("wingR",W*.58,H*.5,g=>{poly(g,[W*.58,H*.45,W*.95,H*.25,W*.9,H*.5,W*.98,H*.62,W*.8,H*.6,W*.74,H*.72,W*.58,H*.58],p[0]);poly(g,[W*.6,H*.47,W*.88,H*.32,W*.84,H*.5,W*.6,H*.55],p[1]);});
     lay("body",W/2,H*.7,g=>{poly(g,[W*.36,H*.36,W*.38,H*.22,W*.45,H*.34],p[1]);poly(g,[W*.64,H*.36,W*.62,H*.22,W*.55,H*.34],p[1]);shadeEll(g,W*.5,H*.5,W*.17,H*.17,p);eyes(g,W*.5,H*.47,W*.07,2*u,true,"#e02020");mouth(g,W*.5,H*.56,W*.07,true,false);g.fillStyle=p[0];g.fillRect(W*.44,H*.66,2,4);g.fillRect(W*.54,H*.66,2,4);});break;
  case "imp":lay("wingL",W*.42,H*.45,g=>{poly(g,[W*.42,H*.42,W*.1,H*.2,W*.14,H*.5,W*.38,H*.56],"#4a1c3a");});lay("wingR",W*.58,H*.45,g=>{poly(g,[W*.58,H*.42,W*.9,H*.2,W*.86,H*.5,W*.62,H*.56],"#4a1c3a");});
     lay("tail",W*.55,H*.75,g=>{g.strokeStyle=p[0];g.lineWidth=2*u;g.beginPath();g.moveTo(W*.55,H*.75);g.quadraticCurveTo(W*.85,H*.85,W*.8,H*.6);g.stroke();poly(g,[W*.76,H*.6,W*.84,H*.6,W*.8,H*.5],p[1]);});
     lay("body",W/2,H*.92,g=>{shadeEll(g,W*.5,H*.7,W*.14,H*.16,p);g.fillStyle=p[0];g.fillRect(W*.42,H*.82,3*u,5*u);g.fillRect(W*.53,H*.82,3*u,5*u);});
     lay("head",W/2,H*.55,g=>{poly(g,[W*.34,H*.32,W*.3,H*.12,W*.42,H*.26],"#f0e0c0");poly(g,[W*.66,H*.32,W*.7,H*.12,W*.58,H*.26],"#f0e0c0");shadeEll(g,W*.5,H*.4,W*.19,H*.17,p);eyes(g,W*.5,H*.38,W*.08,2.2*u,true,"#f0d020");mouth(g,W*.5,H*.48,W*.09,true,false);});
     lay("arm",W*.66,H*.62,g=>{g.fillStyle="#8a6a3a";g.fillRect(W*.7,H*.25,1.5*u,H*.5);poly(g,[W*.66,H*.25,W*.78,H*.25,W*.76,H*.15,W*.73,H*.22,W*.72,H*.12,W*.7,H*.22,W*.67,H*.15],"#c8c8d8");shadeEll(g,W*.68,H*.64,W*.06,H*.05,p);});break;
  case "snake":lay("tail",W*.5,H*.85,g=>{shadeEll(g,W*.5,H*.82,W*.36,H*.12,p);g.fillStyle=p[2];for(let i=0;i<5;i++)g.fillRect(W*(.26+i*.11),H*.8,2*u,1.5*u);});
     lay("body",W*.5,H*.85,g=>{g.fillStyle=p[0];g.fillRect(W*.4,H*.38,W*.2,H*.42);g.fillStyle=p[1];g.fillRect(W*.42,H*.38,W*.13,H*.42);g.fillStyle="#f0e0a0";for(let i=0;i<5;i++)g.fillRect(W*.45,H*(.42+i*.08),W*.08,H*.04);});
     lay("head",W*.5,H*.42,g=>{if(key!=="viper")shadeEll(g,W*.5,H*.33,W*.26,H*.2,[p[0],p[1],p[2],p[3]]);shadeEll(g,W*.5,H*.28,W*.15,H*.13,p);eyes(g,W*.5,H*.25,W*.07,2*u,true,"#e02020");g.fillStyle="#e02040";g.fillRect(W*.495,H*.38,1,4*u);});break;
  case "plant":lay("arm",W*.5,H*.8,g=>{poly(g,[W*.5,H*.75,W*.12,H*.62,W*.22,H*.8],"#2a8a2a");poly(g,[W*.5,H*.75,W*.88,H*.62,W*.78,H*.8],"#2a8a2a");});
     lay("body",W*.5,H,g=>{g.fillStyle="#1c5a1c";g.fillRect(W*.46,H*.45,W*.08,H*.5);g.fillStyle="#3aa83a";g.fillRect(W*.47,H*.45,W*.04,H*.5);shadeEll(g,W*.5,H*.95,W*.22,H*.06,["#3a2a1a","#5a4028","#7a5a38","#a07a50"]);});
     lay("head",W*.5,H*.45,g=>{for(let i=0;i<6;i++){const a=i/6*Math.PI*2;shadeEll(g,W*.5+Math.cos(a)*W*.2,H*.32+Math.sin(a)*H*.17,W*.12,H*.1,p,a);}shadeEll(g,W*.5,H*.33,W*.17,H*.15,["#5a1020","#a02040","#e05070","#ffc0d0"]);mouth(g,W*.5,H*.33,W*.13,true,true);g.fillStyle="#ffe040";g.fillRect(W*.47,H*.2,2,2);});break;
  case "treant":lay("arm",W*.5,H*.5,g=>{g.strokeStyle=p[0];g.lineWidth=5*u;g.beginPath();g.moveTo(W*.3,H*.5);g.lineTo(W*.08,H*.35);g.lineTo(W*.04,H*.2);g.moveTo(W*.7,H*.5);g.lineTo(W*.92,H*.38);g.lineTo(W*.97,H*.22);g.stroke();});
     lay("body",W*.5,H,g=>{shadeRect(g,W*.3,H*.4,W*.4,H*.5,["#3a2410","#6a4422","#9a6a3a","#c89a60"]);poly(g,[W*.3,H*.9,W*.18,H*.98,W*.4,H*.92],"#4a2c14");poly(g,[W*.7,H*.9,W*.82,H*.98,W*.6,H*.92],"#4a2c14");
       eyes(g,W*.5,H*.55,W*.08,3*u,true,"#f0e020");mouth(g,W*.5,H*.7,W*.1,false,true);});
     lay("head",W*.5,H*.42,g=>{shadeEll(g,W*.5,H*.26,W*.4,H*.22,p);shadeEll(g,W*.3,H*.32,W*.18,H*.13,p);shadeEll(g,W*.7,H*.32,W*.18,H*.13,p);g.fillStyle="#ff6a8a";g.fillRect(W*.6,H*.18,2*u,2*u);g.fillRect(W*.34,H*.22,2*u,2*u);});break;
  case "golem":lay("legs",W*.5,H,g=>{shadeRect(g,W*.28,H*.74,W*.16,H*.22,p);shadeRect(g,W*.56,H*.74,W*.16,H*.22,p);});
     lay("body",W*.5,H*.8,g=>{shadeRect(g,W*.22,H*.38,W*.56,H*.4,p);g.fillStyle=p[0];g.fillRect(W*.3,H*.55,W*.12,1);g.fillRect(W*.55,H*.46,1,W*.1);if(pk==="lava"){g.fillStyle="#ffd060";g.fillRect(W*.45,H*.5,W*.1,H*.12);}});
     lay("head",W*.5,H*.4,g=>{shadeRect(g,W*.36,H*.18,W*.28,H*.22,p);g.fillStyle=pk==="lava"?"#fff060":"#60f0ff";g.fillRect(W*.41,H*.26,3*u,2*u);g.fillRect(W*.54,H*.26,3*u,2*u);if(key==="boss"){poly(g,[W*.36,H*.2,W*.3,H*.06,W*.42,H*.18],"#e8dcc0");poly(g,[W*.64,H*.2,W*.7,H*.06,W*.58,H*.18],"#e8dcc0");}});
     lay("arm",W*.76,H*.42,g=>{shadeRect(g,W*.74,H*.4,W*.16,H*.36,p);shadeRect(g,W*.1,H*.4,W*.16,H*.36,p);});break;
  case "undead":case "skeleton":{const sk=shape==="skeleton";
     lay("legs",W*.5,H,g=>{g.fillStyle=p[0];g.fillRect(W*.4,H*.7,3*u,H*.28);g.fillRect(W*.54,H*.7,3*u,H*.28);g.fillStyle=p[2];g.fillRect(W*.41,H*.7,1.5*u,H*.26);g.fillRect(W*.55,H*.7,1.5*u,H*.26);});
     lay("body",W*.5,H*.75,g=>{if(sk){g.fillStyle=p[2];for(let i=0;i<4;i++)g.fillRect(W*.38,H*(.42+i*.07),W*.24,2*u);g.fillStyle=p[1];g.fillRect(W*.48,H*.4,2*u,H*.32);}else{shadeRect(g,W*.36,H*.4,W*.28,H*.34,p);g.fillStyle=p[0];for(let i=0;i<5;i++)g.fillRect(W*.36,H*(.44+i*.06),W*.28,1);}});
     lay("head",W*.5,H*.42,g=>{shadeEll(g,W*.5,H*.3,W*.14,H*.13,p);if(sk){g.fillStyle=MOL;g.fillRect(W*.42,H*.27,3*u,3*u);g.fillRect(W*.53,H*.27,3*u,3*u);g.fillStyle="#f02020";g.fillRect(W*.43,H*.28,1,1);g.fillRect(W*.54,H*.28,1,1);g.fillStyle=MOL;for(let i=0;i<4;i++)g.fillRect(W*(.43+i*.04),H*.38,1,2);}
       else{g.fillStyle=p[0];g.fillRect(W*.36,H*.26,W*.28,1);g.fillRect(W*.36,H*.33,W*.28,1);g.fillStyle="#f0e040";g.fillRect(W*.44,H*.29,2*u,2*u);g.fillRect(W*.53,H*.29,2*u,2*u);}});
     lay("arm",W*.66,H*.45,g=>{g.fillStyle=p[1];g.fillRect(W*.64,H*.44,3*u,H*.24);if(sk){g.fillStyle="#c0c0d0";g.fillRect(W*.7,H*.2,2*u,H*.42);g.fillStyle="#7a5a2a";g.fillRect(W*.66,H*.58,W*.12,2*u);}else{g.fillRect(W*.64,H*.44,W*.2,3*u);}});break;}
  case "beast":case "lion":{const li=shape==="lion";
     lay("tail",W*.4,H*.75,g=>{g.strokeStyle=p[0];g.lineWidth=2.5*u;g.beginPath();g.moveTo(W*.4,H*.75);g.quadraticCurveTo(W*.1,H*.8,W*.12,H*.55);g.stroke();if(li)shadeEll(g,W*.12,H*.55,W*.05,H*.05,MPAL.brown);});
     lay("legs",W*.5,H,g=>{shadeRect(g,W*.36,H*.72,W*.11,H*.25,p);shadeRect(g,W*.54,H*.72,W*.11,H*.25,p);});
     lay("body",W*.5,H*.78,g=>{shadeEll(g,W*.5,H*.58,W*.2,H*.18,p);g.fillStyle=p[3];g.beginPath();g.ellipse(W*.5,H*.6,W*.09,H*.1,0,0,7);g.fill();});
     lay("head",W*.5,H*.42,g=>{if(li)shadeEll(g,W*.5,H*.3,W*.24,H*.2,MPAL.brown);else{poly(g,[W*.36,H*.22,W*.38,H*.08,W*.46,H*.2],p[0]);poly(g,[W*.64,H*.22,W*.62,H*.08,W*.54,H*.2],p[0]);}
       shadeEll(g,W*.5,H*.3,W*.15,H*.13,p);shadeEll(g,W*.5,H*.37,W*.08,H*.05,[p[1],p[2],p[3],"#fff"]);eyes(g,W*.5,H*.27,W*.07,2*u,true,"#f0c020");g.fillStyle=MOL;g.fillRect(W*.49,H*.35,2,1);mouth(g,W*.5,H*.4,W*.06,true,false);});
     lay("arm",W*.68,H*.5,g=>{shadeRect(g,W*.66,H*.48,W*.1,H*.22,p);g.fillStyle="#fff";g.fillRect(W*.66,H*.7,1,2);g.fillRect(W*.7,H*.7,1,2);g.fillRect(W*.74,H*.7,1,2);});break;}
  case "eye":lay("tail",W*.5,H*.6,g=>{g.strokeStyle=p[0];g.lineWidth=2*u;for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(W*.5+i*W*.06,H*.6);g.quadraticCurveTo(W*.5+i*W*.12,H*.8,W*.5+i*W*.08,H*.95);g.stroke();}});
     lay("body",W*.5,H*.6,g=>{shadeEll(g,W*.5,H*.42,W*.3,H*.28,p);g.fillStyle="#fff";g.beginPath();g.ellipse(W*.5,H*.44,W*.2,H*.18,0,0,7);g.fill();g.fillStyle="#d02040";g.beginPath();g.ellipse(W*.52,H*.46,W*.1,H*.11,0,0,7);g.fill();g.fillStyle=MOL;g.beginPath();g.ellipse(W*.53,H*.47,W*.05,H*.07,0,0,7);g.fill();g.fillStyle="#fff";g.fillRect(W*.47,H*.38,2*u,2*u);
       g.strokeStyle="#e04060";g.lineWidth=1;g.beginPath();g.moveTo(W*.32,H*.4);g.lineTo(W*.38,H*.44);g.moveTo(W*.68,H*.5);g.lineTo(W*.62,H*.48);g.stroke();});break;
  case "wisp":lay("body",W*.5,H*.8,g=>{poly(g,[W*.5,H*.05,W*.66,H*.32,W*.78,H*.62,W*.5,H*.85,W*.22,H*.62,W*.34,H*.32],p[0]);poly(g,[W*.5,H*.15,W*.62,H*.38,W*.7,H*.62,W*.5,H*.78,W*.3,H*.62,W*.38,H*.38],p[1]);shadeEll(g,W*.5,H*.6,W*.18,H*.16,[p[1],p[2],p[3],"#fff"]);
       eyes(g,W*.5,H*.56,W*.07,2*u,false);mouth(g,W*.5,H*.66,W*.06,false,true);});break;
  case "knight":lay("legs",W*.5,H,g=>{shadeRect(g,W*.38,H*.72,W*.1,H*.26,p);shadeRect(g,W*.52,H*.72,W*.1,H*.26,p);});
     lay("body",W*.5,H*.76,g=>{shadeRect(g,W*.32,H*.38,W*.36,H*.36,p);g.fillStyle=pk==="black"?"#a01830":"#2a5ab0";g.fillRect(W*.45,H*.4,W*.1,H*.32);shadeEll(g,W*.24,H*.56,W*.1,H*.14,MPAL[pk==="black"?"crimson":"blue"]);});
     lay("head",W*.5,H*.4,g=>{shadeRect(g,W*.38,H*.14,W*.24,H*.24,p);g.fillStyle=MOL;g.fillRect(W*.4,H*.24,W*.2,2*u);g.fillStyle="#ff3030";g.fillRect(W*.44,H*.245,1.5*u,1);g.fillRect(W*.54,H*.245,1.5*u,1);poly(g,[W*.5,H*.14,W*.56,H*.02,W*.52,H*.14],"#d02040");});
     lay("arm",W*.7,H*.45,g=>{shadeRect(g,W*.66,H*.42,W*.08,H*.2,p);g.fillStyle="#e0e8f0";g.fillRect(W*.72,H*.06,2*u,H*.44);g.fillStyle="#c8901c";g.fillRect(W*.67,H*.48,W*.12,2*u);});break;
  case "cyclops":lay("legs",W*.5,H,g=>{shadeRect(g,W*.32,H*.74,W*.13,H*.24,p);shadeRect(g,W*.55,H*.74,W*.13,H*.24,p);});
     lay("body",W*.5,H*.78,g=>{shadeEll(g,W*.5,H*.56,W*.24,H*.22,p);g.fillStyle="#7a4e28";g.fillRect(W*.28,H*.66,W*.44,H*.1);});
     lay("head",W*.5,H*.4,g=>{shadeEll(g,W*.5,H*.26,W*.16,H*.15,p);poly(g,[W*.5,H*.12,W*.53,H*.02,W*.47,H*.12],"#e8dcc0");g.fillStyle="#fff";g.beginPath();g.ellipse(W*.5,H*.25,W*.07,H*.06,0,0,7);g.fill();g.fillStyle="#d02020";g.fillRect(W*.49,H*.24,3*u,3*u);mouth(g,W*.5,H*.33,W*.08,true,false);});
     lay("arm",W*.74,H*.46,g=>{shadeRect(g,W*.7,H*.44,W*.1,H*.2,p);poly(g,[W*.72,H*.6,W*.82,H*.6,W*.92,H*.06,W*.78,H*.04],"#7a4e28");g.fillStyle="#b07a48";g.fillRect(W*.8,H*.1,2*u,H*.4);});break;
  case "gargoyle":lay("wingL",W*.4,H*.45,g=>{poly(g,[W*.4,H*.4,W*.04,H*.16,W*.1,H*.42,W*.04,H*.56,W*.38,H*.6],p[0]);poly(g,[W*.38,H*.43,W*.12,H*.26,W*.16,H*.48,W*.36,H*.55],p[1]);});
     lay("wingR",W*.6,H*.45,g=>{poly(g,[W*.6,H*.4,W*.96,H*.16,W*.9,H*.42,W*.96,H*.56,W*.62,H*.6],p[0]);poly(g,[W*.62,H*.43,W*.88,H*.26,W*.84,H*.48,W*.64,H*.55],p[1]);});
     lay("tail",W*.5,H*.8,g=>{g.strokeStyle=p[0];g.lineWidth=2*u;g.beginPath();g.moveTo(W*.5,H*.8);g.quadraticCurveTo(W*.8,H*.95,W*.84,H*.75);g.stroke();});
     lay("body",W*.5,H*.95,g=>{shadeEll(g,W*.5,H*.66,W*.15,H*.2,p);shadeRect(g,W*.4,H*.82,W*.08,H*.14,p);shadeRect(g,W*.52,H*.82,W*.08,H*.14,p);});
     lay("head",W*.5,H*.45,g=>{poly(g,[W*.38,H*.3,W*.34,H*.14,W*.44,H*.26],p[2]);poly(g,[W*.62,H*.3,W*.66,H*.14,W*.56,H*.26],p[2]);shadeEll(g,W*.5,H*.36,W*.14,H*.12,p);eyes(g,W*.5,H*.34,W*.06,1.8*u,true,"#f03030");mouth(g,W*.5,H*.42,W*.07,true,false);});break;
  case "demon":lay("wingL",W*.4,H*.4,g=>{poly(g,[W*.4,H*.36,W*.02,H*.08,W*.08,H*.36,W*.0,H*.5,W*.36,H*.56],"#3a0a1a");poly(g,[W*.38,H*.4,W*.1,H*.18,W*.14,H*.4,W*.36,H*.5],p[0]);});
     lay("wingR",W*.6,H*.4,g=>{poly(g,[W*.6,H*.36,W*.98,H*.08,W*.92,H*.36,W*1,H*.5,W*.64,H*.56],"#3a0a1a");poly(g,[W*.62,H*.4,W*.9,H*.18,W*.86,H*.4,W*.64,H*.5],p[0]);});
     lay("legs",W*.5,H,g=>{shadeRect(g,W*.38,H*.78,W*.1,H*.2,p);shadeRect(g,W*.52,H*.78,W*.1,H*.2,p);});
     lay("body",W*.5,H*.82,g=>{poly(g,[W*.32,H*.4,W*.68,H*.4,W*.76,H*.86,W*.24,H*.86],"#2a1a3a");poly(g,[W*.36,H*.42,W*.64,H*.42,W*.68,H*.84,W*.32,H*.84],"#4a2a6a");shadeEll(g,W*.5,H*.5,W*.14,H*.12,p);g.fillStyle="#f0c850";g.fillRect(W*.47,H*.56,W*.06,W*.06);});
     lay("head",W*.5,H*.4,g=>{poly(g,[W*.4,H*.26,W*.28,H*.06,W*.44,H*.2],"#e8dcc0");poly(g,[W*.6,H*.26,W*.72,H*.06,W*.56,H*.2],"#e8dcc0");shadeEll(g,W*.5,H*.3,W*.11,H*.11,p);eyes(g,W*.5,H*.28,W*.05,1.6*u,true,"#ffe020");mouth(g,W*.5,H*.35,W*.06,true,false);});
     lay("arm",W*.66,H*.46,g=>{shadeRect(g,W*.64,H*.44,W*.07,H*.2,p);g.fillStyle="#6a4a2a";g.fillRect(W*.7,H*.1,1.5*u,H*.56);shadeEll(g,W*.705,H*.1,W*.04,H*.04,MPAL.purple);});break;
  }
  return {W,H,L,name,shape};}
const MONCACHE={};function monRig(key){return MONCACHE[key]||(MONCACHE[key]=buildMon(key));}
// ---- register species ----
for(const k of ["crawler","spitter","charger","scorchrat","umbrawl","gloomote","thornback","voltusk","puffalo","fluffin","mossnail","sprigling","lilyleap","pondhop","grovegiant","tidemaw"]){delete SPECIES[k];delete PART_DROPS[k];delete BEST_DESC[k];}
for(const k in MONDEF){const [name,shape,pk,S,o]=MONDEF[k];const big=S>=64;
  SPECIES[k]={mon:1,name,shape,beh:o.beh,hp:o.hp,spd:o.spd,aggro:o.aggro,biome:o.biome,night:o.night,herd:o.herd,rare:o.rare,swims:o.swims,fly:o.fly,caster:o.caster,tier:o.tier||1,
    gold:o.gold||(o.beh==="pea"?null:[1+(o.tier||1)*2,3+(o.tier||1)*4]),w:Math.round(S*(big?.42:.4)),h:Math.round(S*(big?.22:.26)),S,dmg:big||o.tier>=3?2:1};
  PART_DROPS[k]=o.parts.filter(p=>typeof ITEMS==="undefined"||ITEMS[p]||PARTDEF[p]);BEST_DESC[k]=o.desc;}
SPECIES.boss.biome=null;SPECIES.demonlord.biome=null;
// ---- spawn hook: give new species their rig ----
const _spawnMob0=spawnMob;
spawnMob=function(sp,x,y,extra){const e=_spawnMob0(sp,x,y,extra);const d=SPECIES[sp];if(d&&d.mon){e.mon=monRig(sp);e.img=null;e.cut={};e.dmg=Math.max(e.dmg||1,d.dmg);e.uid0=(Math.random()*999)|0;if(d.fly)e.flyer=true;}return e;};
// ---- AI extras: casters fire bolts with a cast pose; flyers hover ----
function monAI(e,dist,ang){const d=e.def;if(e.castT>0){e.castT--;if(e.castT===8){const col=d.caster;const a=ang+(Math.random()-.5)*.15;
    projectiles.push({x:e.x+e.w/2,y:e.y+e.h/2-6,vx:Math.cos(a)*2.6,vy:Math.sin(a)*2.6,life:90,r:3.5,dmg:1,col});SFX.spell&&SFX.spell("fireball");}return true;}
  if(d.caster&&d.beh==="agg"&&dist<160&&dist>44&&(e.provoked||dist<(d.aggro||100))&&!heroSafeAt()){e.castCd=(e.castCd||60+Math.random()*60)-1;if(e.castCd<=0){e.castCd=110+Math.random()*60;e.castT=26;return true;}}
  return false;}
function heroSafeAt(){return !!(room||(typeof curSet!=="undefined"&&curSet&&!curSet.raid&&Math.hypot(hero.x/16-SETS[curSet.id].x,hero.y/16-SETS[curSet.id].y)<wallR(SETS[curSet.id])-1));}
// ---- severing: wings, tails, arms and heads come off the same rig ----
const SEVERABLE={wingL:"wing",wingR:"wing",tail:"tail",arm:"claw",head:"fang"};
function monSever(e,n,ang){const r=e.mon;if(!r.L[n]||e.cut[n])return false;e.cut[n]=true;const S=r.W;
  parts.push({spr:r.L[n].c,x:e.x+e.w/2,y:e.y+e.h-S*.5,z:8,vx:Math.cos(ang)*2+(Math.random()-.5),vy:Math.sin(ang)*2,vz:2.2,rot:0,spin:(Math.random()-.5)*.4,life:260,max:260,grounded:false});
  if(bloodOn)spray(e.x+e.w/2,e.y,10,ang,2);try{onSever(e,n==="wingL"||n==="wingR"?"wings":n==="arm"?"arm":n);}catch(_){}
  if(n==="wingL"||n==="wingR"){e.flyer=false;}if(n==="arm")e.dmg=Math.max(1,e.dmg-1);return true;}
const _hurtEnemy0=hurtEnemy;
hurtEnemy=function(e,dmg,ang,can){if(!e.mon)return _hurtEnemy0(e,dmg,ang,can);if(e.iframes>0||e.dead)return;const hp0=e.hp;_hurtEnemy0(e,dmg,ang,false);
  if(e.hp<hp0&&can&&e.hp>0&&Math.random()<0.28){const opts=Object.keys(SEVERABLE).filter(n=>n!=="head"&&e.mon.L[n]&&!e.cut[n]);if(opts.length)monSever(e,opts[(Math.random()*opts.length)|0],ang);}};
const _rigDeath0=rigDeath;
rigDeath=function(e,ang){if(!e.mon)return _rigDeath0(e,ang);e.flash=34;e.deathAng=ang;if(bloodOn&&e.mon.L.head)monSever(e,"head",ang);else burst(e.x+e.w/2,e.y,[255,255,255],14,1.2,2);};
// ---- animated drawing ----
function drawMon(e){const r=e.mon,d=e.def,S=r.W;const t=frameN+e.uid0;const mv=Math.abs(e.x-(e.px||e.x))+Math.abs(e.y-(e.py||e.y))>0.05;e.px=e.x;e.py=e.y;
  const dying=e.dead?clamp(1-e.flash/34,0,1):0;const flyH=e.flyer?8+Math.sin(t*.09)*3:0;const hop=r.shape==="slime"&&mv?Math.abs(Math.sin(t*.16))*6:0;
  drawShadow(e.x+e.w/2,e.y+e.h-1,S*.3*(1-flyH/30),Math.max(2,S*.07));
  const face=hero.x+6<e.x+e.w/2?1:-1;const wind=e.wind>0?e.wind/16:0,lunge=e.lunge>0?e.lunge/10:0,cast=e.castT>0?Math.sin((26-e.castT)/26*Math.PI):0;
  const rec=e.iframes>0&&!e.dead?e.iframes/10:0;
  ctx.save();ctx.translate(Math.floor(e.x+e.w/2+(rec?Math.cos(t*2)*1.5:0)),Math.floor(e.y+e.h-flyH-hop));if(face<0)ctx.scale(-1,1);
  if(dying){ctx.rotate(dying*(r.shape==="slime"?0:0.9)*(e.deathAng>Math.PI/2||e.deathAng<-Math.PI/2?-1:1));ctx.scale(1+dying*.3*(r.shape==="slime"?1:0),1-dying*.7);ctx.globalAlpha=1-dying*.8;}
  ctx.translate(-lunge*S*.12+wind*S*.05,0);
  if((e.flash>0&&!e.dead)||rec>.6)ctx.filter="brightness(2.6)";
  const br=Math.sin(t*.07)*.035;const sq=r.shape==="slime"?(mv?Math.sin(t*.16)*.12:br*2):br;
  const ox=-S/2,oy=-S;
  const D=(n,rot,dx,dy,sx,sy)=>{const l=r.L[n];if(!l||e.cut[n])return;ctx.save();ctx.translate(ox+l.px+(dx||0),oy+l.py+(dy||0));ctx.rotate(rot||0);ctx.scale(sx||1,sy||1);ctx.drawImage(l.c,-l.px,-l.py);ctx.restore();};
  const flap=Math.sin(t*(e.flyer?.45:.08))*(e.flyer?.55:.12);
  D("tail",Math.sin(t*.1)*.2);D("wingL",-flap-wind*.3,0,0);D("wingR",flap+wind*.3,0,0);
  const step=mv?Math.sin(t*.3):0;
  if(r.L.legs){ctx.save();ctx.beginPath();ctx.rect(ox,oy,S/2,S);ctx.clip();D("legs",0,0,step>0?-step*2:0);ctx.restore();ctx.save();ctx.beginPath();ctx.rect(0,oy,S/2,S);ctx.clip();D("legs",0,0,step<0?step*2:0);ctx.restore();}
  D("body",0,0,mv&&!e.flyer?-Math.abs(step)*1:0,1-sq*.6,1+sq);
  const armRot=cast?-1.6*cast:wind?-1.1*wind:lunge?1*lunge:Math.sin(t*(mv?.3:.06))*(mv?.25:.06);
  D("arm",armRot,0,0);
  D("head",(wind?-.12*wind:0)+(lunge?.12*lunge:0),Math.sin(t*.06+1)*.6,-sq*S*.3+(mv?-Math.abs(step)*1.2:0));
  ctx.filter="none";
  if(cast>0){ctx.globalCompositeOperation="lighter";const c=d.caster;ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${.5*cast})`;ctx.beginPath();ctx.arc(S*.2,oy+S*.25,3+cast*5,0,7);ctx.fill();ctx.globalCompositeOperation="source-over";}
  ctx.restore();ctx.globalAlpha=1;
  if(!e.dead&&(d.rare||d.big||(e.provoked&&e.hp<e.maxHp))){const y=e.y+e.h-S-4-flyH;ctx.fillStyle="#300";ctx.fillRect(e.x+e.w/2-12,y,24,3);ctx.fillStyle="#e44";ctx.fillRect(e.x+e.w/2-12,y,24*e.hp/e.maxHp,3);
    if(d.big||d.rare){ctx.font="bold 6px system-ui";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText(d.name,e.x+e.w/2,y-2);}}}
const _drawMob0=drawMob;drawMob=function(e){if(e.mon){if(e.dead&&e.flash<=0)return;return drawMon(e);}return _drawMob0(e);};
// ---- dragons redrawn in the same style (224x126 sheet; rig crops head/wings/tail) ----
function paintDragon(kind){const P2={fire:MPAL.red,frost:MPAL.ice,storm:MPAL.night,forest:MPAL.green}[kind];const belly={fire:MPAL.gold,frost:MPAL.steel,storm:MPAL.purple,forest:MPAL.moss}[kind];
  const W=112,H=63;const [c,g]=mcv(W,H);
  // tail (lower-left)
  g.strokeStyle=P2[0];g.lineWidth=8;g.lineCap="round";g.beginPath();g.moveTo(52,52);g.quadraticCurveTo(26,62,10,50);g.stroke();g.strokeStyle=P2[1];g.lineWidth=5;g.stroke();poly(g,[10,44,2,50,12,57],P2[2]);
  // wings (upper-right)
  poly(g,[62,30,80,2,110,6,104,18,110,28,96,26,98,36,84,32],P2[0]);poly(g,[64,30,80,8,104,10,98,20,90,22,88,30],P2[1]);g.strokeStyle=P2[0];g.lineWidth=1;for(const [a,b] of [[96,10],[92,20],[84,28]]){g.beginPath();g.moveTo(66,30);g.lineTo(a,b);g.stroke();}
  // body & legs
  shadeEll(g,62,44,22,14,P2);shadeEll(g,60,50,14,6,belly);shadeRect(g,46,50,8,10,P2);shadeRect(g,70,50,8,10,P2);g.fillStyle="#fff";for(const x of [46,49,70,73])g.fillRect(x,59,2,2);
  for(let i=0;i<5;i++)poly(g,[52+i*6,31,55+i*6,25,58+i*6,31],P2[2]);
  // neck + head (upper-left)
  g.strokeStyle=P2[0];g.lineWidth=10;g.beginPath();g.moveTo(48,40);g.quadraticCurveTo(36,30,28,22);g.stroke();g.strokeStyle=P2[1];g.lineWidth=7;g.stroke();
  shadeEll(g,22,18,13,10,P2);shadeEll(g,12,22,8,5,P2);poly(g,[26,10,36,2,30,12],"#f0e8d0");poly(g,[20,9,24,0,24,10],"#f0e8d0");
  eyes(g,20,15,0.01,2.2,true,"#f0c020");g.fillStyle="#3a0810";g.fillRect(5,24,12,2);g.fillStyle="#fff";g.fillRect(7,24,1,2);g.fillRect(11,24,1,2);g.fillStyle=MOL;g.fillRect(6,20,2,1);
  inkLayer(c);const [c2,g2]=mcv(W*2,H*2);g2.drawImage(c,0,0,W*2,H*2);return c2;}
// replace art once images have loaded
const _loadImages0=loadImages;loadImages=function(){return _loadImages0().then(()=>{for(const k of ["fire","frost","storm","forest"])IMG["dragon_"+k]=paintDragon(k);});};
// species name helper for bestiary
function monName(k){return (SPECIES[k]&&SPECIES[k].name)||k[0].toUpperCase()+k.slice(1);}
// lineup preview (for screenshot/testing)
function monLineup(){const ks=Object.keys(MONDEF);const cols=8;const cw=104,chh=104;const [c,g]=mcv(cols*cw,Math.ceil(ks.length/cols)*chh+20);g.fillStyle="#3a3e4a";g.fillRect(0,0,c.width,c.height);
  ks.forEach((k,i)=>{const r=monRig(k);const x=(i%cols)*cw,y=Math.floor(i/cols)*chh;const sc=Math.min(2,88/r.W);const ox=x+cw/2-r.W*sc/2,oy=y+90-r.H*sc;
    for(const n of ["tail","wingL","wingR","legs","body","arm","head"])if(r.L[n])g.drawImage(r.L[n].c,ox,oy,r.W*sc,r.H*sc);g.fillStyle="#fff";g.font="10px system-ui";g.textAlign="center";g.fillText(r.name,x+cw/2,y+101);});return c;}
// ===== QUEST MARKERS & QUEST LOG =====
// red = accepted, go do it; green = requirements met, return to the giver; yellow = objective location
function pickGiver(sid,pref){const c=npcs.filter(n=>n.alive&&n.s===sid&&!n.adv&&n.age>=16);return (c.find(n=>n.role===pref)||c[0]||{}).id;}
const _takeJob0=takeJob;
takeJob=function(j){const before=P.jobs.length;_takeJob0(j);if(P.jobs.length>before&&j.giver==null){j.giver=j.t==="deliver"?pickGiver(j.to,"shopkeeper"):pickGiver(j.s,j.t==="gather"||j.t==="fish"?"shopkeeper":"leader");}};
const _tcj0=tryCompleteJobs;
tryCompleteJobs=function(sid,n){const held=[];if(n)for(const j of P.jobs)if(j.giver!=null&&j.giver!==n.id&&npcs.some(q=>q.id===j.giver&&q.alive)){held.push(j);}
  P.jobs=P.jobs.filter(j=>!held.includes(j));const r=_tcj0(sid);P.jobs=P.jobs.concat(held);return r;};
function npcById(id){return npcs.find(n=>n.id===id&&n.alive);}
function questReady(q){const j=q.j;if(q.kind==="guild")return jobReady(j);
  if(j.t==="gather"||j.t==="fish")return have(j.item)>=j.n;if(j.t==="hunt")return(j.have||0)>=j.n;if(j.t==="deliver")return true;return false;}
function questTarget(q){const j=q.j,S=SETS[j.s]||SETS[0];
  switch(j.t){case "deliver":return null;
   case "gather":case "wood":case "part":{const want=j.item==="wood"||j.t==="wood"?[TREE]:j.item==="fish"?[SHAL]:[GRASS,FOREST];const p=findTile(want,S.x,S.y,40);return p&&{x:p.x/TILE,y:p.y/TILE};}
   case "fish":{const p=findTile([SHAL],S.x,S.y,40);return p&&{x:p.x/TILE,y:p.y/TILE};}
   case "hunt":case "huntsp":return{x:S.x+(S.x>128?-28:28),y:S.y+(S.y>96?-16:16)};
   case "camp":return CAMPS&&CAMPS[0]?{x:CAMPS[0].x,y:CAMPS[0].y}:null;
   case "dragon":return LAIRS[0]?{x:LAIRS[0].x,y:LAIRS[0].y}:null;
   case "dungeon":return{x:CAVE_POS.x,y:CAVE_POS.y};
   case "raid":return{x:S.x,y:S.y};case "escort":return j.to!=null&&SETS[j.to]?{x:SETS[j.to].x,y:SETS[j.to].y}:null;}
  return null;}
function quests(){const out=[];if(!P||!world)return out;
  for(const j of P.jobs||[])out.push({j,kind:"town",giver:npcById(j.giver),title:jobText(j)});
  try{const g=guild();for(const j of g.active||[]){if(j.giver==null){const rs=npcs.find(n=>n.alive&&n.role==="receptionist"&&n.s===(j.s!=null?j.s:0))||npcs.find(n=>n.alive&&n.role==="receptionist");j.giver=rs&&rs.id;}out.push({j,kind:"guild",giver:npcById(j.giver),title:j.txt});}}catch(_){}
  for(const q of out){q.ready=!!questReady(q);q.color=q.ready?"#3ee05a":"#ff3a3a";q.pos=q.giver?giverPos(q.giver):null;
    if(q.kind==="guild"){const sid=q.giver?q.giver.s:(q.j.s!=null?q.j.s:0);const gb=buildings.find(b=>b.kind==="guild"&&b.s===sid)||buildings.find(b=>b.kind==="guild");if(gb){const d=doorOf(gb);q.hall={x:d.x/TILE,y:d.y/TILE};if(!q.pos)q.pos=q.hall;}}}return out;}
function giverPos(n){if(n.inside){const b=n.at!=null?buildings[n.at]:n.home!=null?buildings[n.home]:null;if(b){const d=doorOf(b);return{x:d.x/TILE,y:d.y/TILE,inside:true};}}return{x:(n.x+8)/TILE,y:(n.y+8)/TILE};}
function questMarkerOf(id){const q=quests().find(q=>q.j.id===id);return q?(q.ready?"green":"red"):null;}
// world: marker above the giver's head (or their door if indoors), bouncing
function drawQuestMarkers(){const qs=quests();for(const q of qs){if(!q.pos)continue;const x=q.pos.x*TILE,y=q.pos.y*TILE-(q.pos.inside?26:30)+Math.sin(frameN*.12)*2;
  ctx.save();ctx.fillStyle=q.color;ctx.strokeStyle="#1a0a0a";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+5,y-1);ctx.lineTo(x,y+5);ctx.lineTo(x-5,y-1);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle="#fff";ctx.font="bold 7px system-ui";ctx.textAlign="center";ctx.fillText(q.ready?"?":"!",x,y+1.5);ctx.restore();}
  for(const q of qs){if(q.ready)continue;const t=questTarget(q);if(!t)continue;const x=t.x*TILE,y=t.y*TILE;if(Math.abs(x-hero.x)>300||Math.abs(y-hero.y)>200)continue;
    ctx.save();ctx.strokeStyle="#ffd84a";ctx.lineWidth=1.5;ctx.globalAlpha=.7+Math.sin(frameN*.1)*.3;ctx.beginPath();ctx.arc(x,y,10,0,7);ctx.stroke();ctx.restore();}}
function questDots(g,P2,r){const qs=quests();for(const q of qs){if(!q.ready){const t=questTarget(q);if(t){const [x,y]=P2(t.x,t.y);g.strokeStyle="#ffd84a";g.lineWidth=1.5;g.strokeRect(x-r,y-r,r*2,r*2);}}}
  for(const q of qs){if(q.hall){const [x,y]=P2(q.hall.x,q.hall.y);g.fillStyle="#000";g.fillRect(x-r-1.5,y-r-1.5,r*2+3,r*2+3);g.fillStyle=q.color;g.fillRect(x-r,y-r,r*2,r*2);}if(!q.pos)continue;const [x,y]=P2(q.pos.x,q.pos.y);g.fillStyle="#000";g.beginPath();g.arc(x,y,r+1.2,0,7);g.fill();g.fillStyle=q.color;g.beginPath();g.arc(x,y,r,0,7);g.fill();}}
const _drawMini0=drawMini;drawMini=function(){_drawMini0();if(room)return;const R=40;const tx=hero.x/TILE,ty=hero.y/TILE;const sx=mini.width/(R*2),sy=mini.height/(R*1.5);
  questDots(mg,(x,y)=>[clamp((x-tx+R)*sx,3,mini.width-3),clamp((y-ty+R*0.75)*sy,3,mini.height-3)],2.5);};
const _drawFullMap0=drawFullMap;drawFullMap=function(){_drawFullMap0();questDots(mapC.getContext("2d"),(x,y)=>[x*3,y*3],5);};
function questLog(tab){tab=tab||"town";const qs=quests().filter(q=>q.kind===tab);
  const fmt=q=>`${q.ready?"🟢 READY — return to "+(q.giver?q.giver.name:tab==="guild"?"the guild receptionist":"the giver")+"\n   ":"🔴 "}${q.title}${q.giver&&!q.ready?"\n   "+(tab==="guild"?"Turn in at the Guild Hall ("+SETS[q.giver.s].name+")":"Giver: "+q.giver.name+" ("+SETS[q.giver.s].name+")"):""}`;
  showMenu("Quest Log — "+(tab==="guild"?"Guild":"Town Tasks"),qs.length?qs.map(fmt).join("\n\n"):(tab==="guild"?"No active guild jobs. Visit a Guild Hall job board.":"No active town tasks. Check notice boards."),
    [{l:(tab==="town"?"▸ ":"")+"Town Tasks",f:()=>questLog("town")},{l:(tab==="guild"?"▸ ":"")+"Guild",f:()=>questLog("guild")},{l:"Close"}]);}
// ===== PIXEL TOWN ART DIRECTION (clean 16px top-down, 1px soft outlines, cheerful palette) =====
const POL="#2a2238";
function pxR(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
function pxDisc(g,cx,cy,r,c,ol){for(let y=-r-1;y<=r+1;y++)for(let x=-r-1;x<=r+1;x++){const d=Math.hypot(x+.5,y+.5);if(d<=r){g.fillStyle=c;g.fillRect(cx+x,cy+y,1,1);}else if(ol&&d<=r+1){g.fillStyle=ol;g.fillRect(cx+x,cy+y,1,1);}}}
const PGR=[["#5cc84a","#4cb03e","#82e060"],["#54c040","#44a834","#7ad858"],["#9cc048","#86a83a","#c0d860"],["#e8f0f4","#cdd8e0","#ffffff"]];
const PLEAF=[["#3eae3a","#2a8a2e","#6ad85a"],["#36a032","#25802a","#5ccc4c"],["#d8862a","#b0601e","#f0b040"],["#a8c0c8","#8aa0aa","#e8f4f8"]];
makeTiles=function(season){const tiles={};const G=PGR[season],L=PLEAF[season];
  const mk=(f,n=4)=>{const a=[];for(let v=0;v<n;v++){const c=mkCanvas(32,32),g=c.getContext("2d");g.imageSmoothingEnabled=false;g.scale(2,2);f(g,v);a.push(c);}return a;};
  const H=(i,v,k)=>hash2(i,v,k);
  const grass=(g,v,base)=>{pxR(g,0,0,16,16,base||G[0]);for(let i=0;i<6;i++){const x=(H(i,v,1)*15)|0,y=(H(i,v,2)*14)|0;pxR(g,x,y,1,2,G[1]);pxR(g,x+1,y+1,1,1,G[1]);}for(let i=0;i<3;i++)pxR(g,(H(i,v,3)*15)|0,(H(i,v,4)*15)|0,1,1,G[2]);};
  tiles[GRASS]=mk(grass);
  tiles[FLOWER]=mk((g,v)=>{grass(g,v);const fc=season===3?["#fff"]:["#ff5a6a","#ffffff","#ffd23a","#ff8ad0"];for(let i=0;i<3;i++){const x=2+((H(i,v,5)*11)|0),y=2+((H(i,v,6)*11)|0),c=fc[(i+v)%fc.length];pxR(g,x,y-1,1,1,c);pxR(g,x-1,y,3,1,c);pxR(g,x,y+1,1,1,c);pxR(g,x,y,1,1,"#ffe040");}
    if(v===3&&season<3){pxR(g,10,10,3,2,"#e8402a");pxR(g,11,10,1,1,"#fff");pxR(g,11,12,1,2,"#f4ecd8");}});
  tiles[FOREST]=mk((g,v)=>{grass(g,v,G[1]);for(let i=0;i<4;i++)pxR(g,(H(i,v,7)*15)|0,(H(i,v,8)*15)|0,2,1,"#3a9030");});
  tiles[SAND]=mk((g,v)=>{pxR(g,0,0,16,16,"#f4e2a8");for(let i=0;i<5;i++)pxR(g,(H(i,v,3)*15)|0,(H(i,v,4)*15)|0,1,1,"#dcc488");});
  const water=(g,v,base,hi)=>{pxR(g,0,0,16,16,base);const y=(3+v*3)%14;pxR(g,2+v,y,4,1,hi);pxR(g,9-v,(y+6)%15,5,1,hi);};
  tiles[DEEP]=mk((g,v)=>water(g,v,"#3a8ef0","#7ec0ff"));
  tiles[SHAL]=mk((g,v)=>{water(g,v,"#5cb4ff","#a8dcff");pxR(g,(H(v,1,1)*12)|0,(H(v,2,1)*12)|0,2,2,"#78c4ff");});
  tiles[ROAD]=mk((g,v)=>{pxR(g,0,0,16,16,"#eedcae");for(let i=0;i<5;i++)pxR(g,(H(i,v,3)*15)|0,(H(i,v,4)*15)|0,2,1,"#dcc690");pxR(g,(H(v,9,9)*14)|0,(H(v,8,9)*14)|0,1,1,"#c8b07a");});
  const cob=(g,v,base,line)=>{pxR(g,0,0,16,16,line||"#c4b496");for(let y=0;y<4;y++)for(let x=0;x<2;x++){const ox=y%2?4:0;const sx=(x*8+ox)%16;pxR(g,sx+1,y*4+1,7,3,base||["#ece2c8","#e2d6b8"][(x+y+v)%2]);if(sx+8>16)pxR(g,0,y*4+1,sx+8-16-1,3,base||"#e6dabe");pxR(g,sx+1,y*4+1,7,1,"#f6eedc");}};
  tiles[COBBLE]=mk((g,v)=>cob(g,v));
  tiles[RUIN]=mk((g,v)=>{cob(g,v,"#b0aab0","#7e7884");pxR(g,(H(v,3,3)*12)|0,(H(v,4,3)*12)|0,3,2,"#5cb84a");});
  tiles[WALL]=mk((g,v)=>{cob(g,v,"#b8b4c0","#6e6a78");});
  tiles[PIER]=mk((g,v)=>{water(g,v,"#3a8ef0","#7ec0ff");pxR(g,1,0,14,16,"#c88a50");for(let i=0;i<4;i++){pxR(g,1+i*3.5|0,0,1,16,"#8a5a30");}pxR(g,0,0,1,16,POL);pxR(g,15,0,1,16,POL);pxR(g,2,(v*4)%16,12,1,"#e0a868");});
  tiles[BRIDGE]=mk((g,v)=>{water(g,v,"#3a8ef0","#7ec0ff");pxR(g,0,1,16,14,"#c88a50");for(let i=0;i<4;i++)pxR(g,i*4,1,1,14,"#8a5a30");pxR(g,0,1,16,2,"#7a4a24");pxR(g,0,13,16,2,"#7a4a24");pxR(g,0,0,16,1,POL);pxR(g,0,15,16,1,POL);pxR(g,2+v,6,3,1,"#e0a868");});
  tiles[FARM]=mk((g,v)=>{pxR(g,0,0,16,16,"#a06a3a");for(let y=1;y<16;y+=4){pxR(g,0,y,16,2,"#7e4e28");pxR(g,0,y+2,16,1,"#b88050");if(season<3){pxR(g,2+v,y-1,1,1,"#6ad04a");pxR(g,9-v,y-1,1,1,"#6ad04a");}}});
  tiles[CAVE]=mk((g,v)=>{pxR(g,0,0,16,16,"#8a8494");pxDisc(g,8,11,6,"#1a1424",POL);pxR(g,2,11,12,5,"#1a1424");});
  tiles[MTN]=mk((g,v)=>{pxR(g,0,0,16,16,season===3?"#e4eaf0":"#bcae8a");for(let i=0;i<4;i++)pxR(g,(H(i,v,1)*14)|0,(H(i,v,2)*14)|0,2,1,season===3?"#fff":"#a89870");});
  tiles[CLIFF]=mk((g,v)=>{pxR(g,0,0,16,16,"#9a8a7a");pxR(g,0,9,16,7,"#7a6a5c");for(let i=0;i<3;i++)pxR(g,1+i*5,4+(i%2)*5,4,1,"#b8a898");pxR(g,0,0,16,2,season===3?"#fff":G[0]);pxR(g,0,2,16,1,POL);});
  tiles[STAIRS]=mk((g,v)=>{pxR(g,0,0,16,16,"#8a7a6a");for(let i=0;i<4;i++){pxR(g,2,i*4,12,3,"#e8dcc4");pxR(g,2,i*4+3,12,1,"#9a8a74");}});
  tiles[19]=mk((g,v)=>{grass(g,v);pxR(g,5,8,6,5,"#9a5e30");pxR(g,5,7,6,2,"#e8c890");pxR(g,7,7,2,1,"#c8a070");pxR(g,4,8,1,5,POL);pxR(g,11,8,1,5,POL);pxR(g,5,13,6,1,POL);});
  tiles[20]=mk((g,v)=>{grass(g,v);pxR(g,7,7,1,6,"#7a4a24");pxDisc(g,7,6,3,L[0],POL);pxR(g,6,4,2,1,L[2]);});
  tiles[BUSH]=mk((g,v)=>{grass(g,v);pxR(g,3,13,11,2,"rgba(0,0,0,.18)");pxDisc(g,8,9,5,L[0],POL);pxR(g,5,6,3,2,L[2]);pxR(g,8,11,4,2,L[1]);if(season<3){pxR(g,6,9,1,1,"#ff4a5a");pxR(g,10,8,1,1,"#ff4a5a");}});
  tiles[ROCK]=mk((g,v)=>{grass(g,v);pxR(g,3,13,11,2,"rgba(0,0,0,.18)");pxDisc(g,8,9,5,"#a8a4b4",POL);pxR(g,4,11,9,2,"#8a8698");pxR(g,5,6,4,2,"#d8d4e0");});
  tiles[TREE]=mk((g,v)=>{grass(g,v);pxR(g,3,13,11,2,"rgba(0,0,0,.2)");pxR(g,6,7,4,7,"#9a5e30");pxR(g,6,7,1,7,"#c07a40");pxR(g,5,7,1,7,POL);pxR(g,10,7,1,7,POL);pxR(g,5,13,6,1,"#7a4a24");});
  tiles.canopy=[0,1,2,3].map(v=>{const c=mkCanvas(48,44),g=c.getContext("2d");g.imageSmoothingEnabled=false;g.scale(2,2);
    if(v===3){ // pine
      const P=[[12,2,2],[12,6,4],[12,10,6],[12,14,8]];for(const [x,y,w] of P){for(let k=0;k<5;k++){pxR(g,x-w+Math.floor(k/2),y+k,w*2-Math.floor(k/2)*2,1,k<2?L[2]:k<4?L[0]:L[1]);}pxR(g,x-w-1,y+4,1,1,POL);pxR(g,x+w,y+4,1,1,POL);}
      pxR(g,11,1,2,1,POL);return c;}
    pxDisc(g,12,10,9,L[0],POL);pxDisc(g,9,7,4,L[2]);pxR(g,6,6,2,2,"#ffffff55");for(let i=0;i<3;i++){pxR(g,14+i*1,14-i,4,1,L[1]);}pxR(g,4,15,16,2,L[1]);pxDisc(g,12,10,9,"rgba(0,0,0,0)",POL);
    if(v===1&&season<2){for(let i=0;i<4;i++)pxR(g,6+((H(i,v,9)*12)|0),5+((H(i,v,8)*10)|0),2,2,"#ff5a5a");}
    if(v===2&&season===0){for(let i=0;i<5;i++)pxR(g,6+((H(i,v,9)*12)|0),4+((H(i,v,8)*10)|0),2,2,"#ffffff");}
    return c;});
  return tiles;};
// soft path edging instead of stone borders
blendEdges=function(g,tx,ty,t,px0,py0){if(t===ROAD||t===COBBLE){const nb=[[0,-1],[0,1],[-1,0],[1,0]];for(const [dx,dy] of nb){const n=tAt(tx+dx,ty+dy);if(n===GRASS||n===FLOWER||n===FOREST){g.fillStyle="rgba(70,140,50,.35)";
      if(dx)g.fillRect(px0+(dx>0?15:0),py0,1,16);else g.fillRect(px0,py0+(dy>0?15:0),16,1);}}return;}
  if(t===GRASS||t===FLOWER||t===FOREST||t===TREE||t===BUSH)return;return blendEdgesBase(g,tx,ty,t,px0,py0);};
// ---- buildings: 3/4 pixel view, steep roof + timber-frame front ----
const ROOFS={red:["#d8483a","#a83028","#f07a5a"],brown:["#9a6038","#6e4024","#c08050"],slate:["#5a6478","#3e4658","#8a96aa"],navy:["#34508e","#22386a","#5a7ac0"],green:["#3e9a5a","#2a6e40","#6ac87a"]};
function pxRoof(g,x,y,w,h,R,steep){ // roof with shingle rows and ridge
  for(let r=0;r<h;r++){const inset=steep?Math.floor((h-r)*0.0):0;pxR(g,x+inset,y+r,w-inset*2,1,r%3===0?R[1]:R[0]);if(r%3===1)for(let k=(r%6===1?0:3);k<w;k+=6)pxR(g,x+k,y+r,1,2,R[1]);}
  pxR(g,x,y,w,1,R[2]);pxR(g,x-1,y,1,h,POL);pxR(g,x+w,y,1,h,POL);pxR(g,x-1,y+h,w+2,1,POL);pxR(g,x,y-1,w,1,POL);}
function pxWall(g,x,y,w,h,wall){pxR(g,x,y,w,h,wall);pxR(g,x,y,w,1,"#7a4a28");pxR(g,x,y+h-1,w,1,"#7a4a28");for(let k=0;k<=w;k+=8)pxR(g,Math.min(x+k,x+w-1),y,1,h,"#7a4a28");pxR(g,x,y+Math.floor(h/2),w,1,"#7a4a28");
  for(let k=4;k<w-2;k+=8){pxR(g,x+k-2,y+1,1,Math.floor(h/2)-1,"#9a6a40");}pxR(g,x-1,y,1,h,POL);pxR(g,x+w,y,1,h,POL);}
function pxWin(g,x,y,lit){pxR(g,x-1,y-1,6,6,POL);pxR(g,x,y,4,4,lit?"#ffe080":"#8ad0f0");pxR(g,x+2,y,1,4,"#f4ecd8");pxR(g,x,y+2,4,1,"#f4ecd8");pxR(g,x-1,y+5,6,2,"#9a5e30");pxR(g,x,y+5,1,1,"#ff5a6a");pxR(g,x+2,y+5,1,1,"#ffd23a");pxR(g,x+4,y+5,1,1,"#ff5a6a");}
function pxDoor(g,x,y){pxR(g,x-1,y-1,8,12,POL);pxR(g,x,y,6,11,"#8a4e28");pxR(g,x+1,y+1,4,9,"#a8643a");pxR(g,x+4,y+5,1,1,"#ffd23a");pxR(g,x-2,y+11,10,1,"#b8b0a8");}
buildingSprite=function(b){const key=b.id+":"+b.kind+":"+(b.owned?1:0)+":px"+(b.hall?1:0);let c=bldCache.get(key);if(c)return c;
  const w=b.w*16,extra=b.hall?44:30,h=b.h*16+extra;c=mkCanvas(w*2,h*2);const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.scale(2,2);c.lw=w;c.lh=h;
  const s=SETS[b.s]||{};const lit=world&&(hour()>=19||hour()<6);
  const rk=b.hall?"red":b.kind==="guild"?"navy":b.kind==="shop"?"brown":b.kind==="inn"?"red":b.kind==="harbor"?"slate":["red","brown","slate","navy","green"][(b.id*7+(b.s||0))%5];const R=ROOFS[rk];
  const wall=b.kind==="harbor"?"#e8e0d0":["#f4e6c4","#f0dcb8","#ece4d4"][b.id%3];
  const baseY=h-2,wallH=b.hall?24:18,wallY=baseY-wallH,roofH=h-wallH-6;
  // shadow & stone foundation
  pxR(g,2,baseY-1,w-2,3,"rgba(0,0,0,.18)");pxR(g,1,baseY-3,w-2,3,"#a8a2a8");pxR(g,1,baseY-3,w-2,1,"#c8c2c8");pxR(g,0,baseY-3,1,3,POL);pxR(g,w-1,baseY-3,1,3,POL);pxR(g,1,baseY,w-2,1,POL);
  pxWall(g,2,wallY,w-4,wallH-3,wall);
  pxRoof(g,1,4,w-2,roofH,R,true);
  // chimney
  if(!b.hall&&b.kind!=="forsale"){const cx=w-14;pxR(g,cx-1,0,7,10,POL);pxR(g,cx,1,5,9,"#b06a50");pxR(g,cx,1,5,2,"#c88a70");}
  // dormer window in roof
  pxWin(g,(w/2|0)-2,6+Math.floor(roofH/3),lit);
  // windows + door
  const doorX=Math.floor(w/2)-3;pxDoor(g,doorX,baseY-14);
  for(const wx of [6,w-11])if(Math.abs(wx-doorX)>8)pxWin(g,wx,wallY+3,lit);
  if(b.hall){ // clock tower centerpiece
    const tx=Math.floor(w/2)-8;pxR(g,tx-1,0,18,roofH+6,POL);pxR(g,tx,1,16,roofH+4,"#f0e2c0");for(let k=0;k<roofH;k+=6)pxR(g,tx,1+k,16,1,"#c8b08a");pxDisc(g,tx+8,9,5,"#fffbe8",POL);pxR(g,tx+8,6,1,4,POL);pxR(g,tx+8,9,3,1,POL);
    pxRoof(g,tx-2,-2,20,4,ROOFS.red,true);pxR(g,tx+4,wallY+3,8,7,POL);pxR(g,tx+5,wallY+4,6,5,lit?"#ffe080":"#8ad0f0");
    // banner
    pxR(g,2,wallY+2,4,8,s.gem||"#ffd23a");pxR(g,w-6,wallY+2,4,8,s.gem||"#ffd23a");}
  if(b.kind==="shop"||b.kind==="inn"){const aw=b.kind==="shop"?["#e84a4a","#fff4e8"]:["#4a8ae8","#fff4e8"];for(let k=0;k<w-8;k++)pxR(g,4+k,wallY+1,1,4,aw[Math.floor(k/3)%2]);pxR(g,4,wallY+5,w-8,1,POL);for(let k=0;k<w-8;k+=3)pxR(g,4+k,wallY+5,2,1,aw[0]);}
  // sign
  const sign={inn:"INN",shop:"SHOP",harbor:"DOCK",forsale:b.owned?"HOME":"SALE",guild:"GUILD"}[b.kind]||(b.hall?"HALL":null);
  if(sign){const sw=sign.length*4+4;const sx=doorX+8;pxR(g,sx-1,baseY-21,sw+2,8,POL);pxR(g,sx,baseY-20,sw,6,"#c88a50");g.fillStyle="#fff8e0";g.font="bold 5px monospace";g.textBaseline="top";g.fillText(sign,sx+2,baseY-20);}
  if(b.kind==="harbor"){pxR(g,w-10,baseY-10,8,8,"#c88a50");pxR(g,w-10,baseY-10,8,1,POL);}
  bldCache.set(key,c);return c;};
// mark the town hall (building nearest each town's center)
function markHalls(){for(const s of SETS){if(!s.kind.includes("town"))continue;let best=null,bd=1e9;for(const b of buildings){if(b.s!==s.id||!(b.kind==="house"||b.kind==="forsale"))continue;if(b.kind==="forsale")continue;const d=Math.hypot(b.x+b.w/2-s.x,b.y+b.h/2-s.y);if(d<bd){bd=d;best=b;}}if(best)best.hall=true;}}
// ---- props in pixel style ----
const _drawProp0=drawProp;
drawProp=function(p){const x=p.x*16,y=p.y*16;const g=ctx;const S=(a,b2,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b2,w,h);};
  switch(p.type){
  case "lamp":S(5,15,6,1,"rgba(0,0,0,.2)");S(7,3,2,12,POL);S(6,13,4,2,POL);S(5,0,6,5,POL);S(6,1,4,3,world&&(hour()>=18||hour()<6)?"#ffe070":"#fff4c0");return;
  case "bench":S(1,13,14,2,"rgba(0,0,0,.18)");S(1,7,14,1,POL);S(1,8,14,2,"#c88a50");S(1,10,14,1,POL);S(1,4,14,3,"#a86a38");S(1,3,14,1,POL);S(2,11,1,3,POL);S(13,11,1,3,POL);return;
  case "crates":S(1,14,14,2,"rgba(0,0,0,.18)");for(const [a,b2] of [[1,6],[8,8]]){S(a-1,b2-1,8,8,POL);S(a,b2,6,6,"#d09a58");S(a,b2,6,1,"#e8b878");S(a+2,b2,1,6,"#a86a38");S(a,b2+3,6,1,"#a86a38");}return;
  case "logs":S(0,14,16,2,"rgba(0,0,0,.18)");for(const [a,b2] of [[1,9],[7,9],[4,4]]){S(a-1,b2-1,8,7,POL);S(a,b2,6,5,"#9a5e30");S(a+1,b2+1,3,3,"#e8c890");S(a+2,b2+2,1,1,"#a87a48");}return;
  case "pumpkins":S(1,14,14,2,"rgba(0,0,0,.18)");S(2,4,12,11,POL);S(3,5,10,9,"#f0c84a");S(3,5,10,2,"#ffe078");for(let k=0;k<4;k++)S(4+k*2,8+k%2,1,4,"#c89a2a");return; // haystack
  case "fence":S(0,7,16,1,POL);S(0,8,16,2,"#c88a50");S(0,10,16,1,POL);for(const a of [1,7,13]){S(a-1,3,4,11,POL);S(a,4,2,9,"#e0a868");}return;
  case "stall":{S(0,14,16,2,"rgba(0,0,0,.18)");S(0,0,16,7,POL);for(let k=0;k<14;k++)S(1+k,1,1,5,["#e84a4a","#fff4e8"][Math.floor(k/2)%2]);S(1,7,1,7,POL);S(14,7,1,7,POL);S(0,10,16,4,POL);S(1,10,14,3,"#c88a50");S(3,9,2,2,"#ff5a5a");S(7,9,2,2,"#ffd23a");S(11,9,2,2,"#6ad04a");return;}
  case "arch":S(7,4,2,11,POL);S(1,3,14,5,POL);S(2,4,12,3,"#e0a868");S(3,5,8,1,"#8a5a30");return; // signpost
  case "flowers":for(let i=0;i<5;i++){const c=["#ff5a6a","#ffd23a","#ffffff","#ff8ad0"][i%4];const a=2+i*3,b2=6+(i%2)*5;S(a,b2+1,1,2,"#3a9030");S(a-1,b2,3,1,c);S(a,b2-1,1,3,c);S(a,b2,1,1,"#ffe040");}return;
  case "statue":case "topiary":S(2,13,12,2,"rgba(0,0,0,.18)");S(3,1,10,14,POL);if(p.type==="topiary"){S(4,2,8,7,"#3eae3a");S(5,2,3,2,"#6ad85a");S(7,9,2,3,"#9a5e30");S(4,12,8,2,"#c86a50");}else{S(4,10,8,4,"#c0bcc8");S(5,2,6,8,"#d8d4e0");S(6,3,2,3,"#f4f0f8");}return;
  case "crate":break;}
  return _drawProp0(p);};
// ---- stone town walls & gates: low grey stone walls, pixel palisades for villages ----
drawWallsList=function(list,vis){const town=new Set(SETS.filter(s=>s.kind.includes("town")).map(s=>s.id));
  for(const w of WALLS){if(!vis(w.x*16,w.y*16,40))continue;list.push({y:w.y*16+15,f:()=>{const x=w.x*16,y=w.y*16,hp=wallHp(w.i);const S=(a,b2,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a,y+b2,ww,hh);};
    if(hp<=0){for(let k=0;k<3;k++){S(2+k*5,10+(k%2)*2,4,3,POL);S(3+k*5,11+(k%2)*2,2,1,"#b8b4c0");}return;}
    if(town.has(w.s)){S(0,14,16,3,"rgba(0,0,0,.18)");S(0,-3,16,17,POL);S(0,-2,16,15,"#a8a4b4");for(let r=0;r<3;r++)for(let k=0;k<2;k++){const ox=r%2?4:0;S((k*8+ox)%16,-2+r*5,1,4,"#7e7a8c");}S(0,2,16,1,"#7e7a8c");S(0,7,16,1,"#7e7a8c");S(0,-2,16,2,"#d0ccd8");S(0,12,16,1,"#7e7a8c");
      if(hp<10){S(5,1,1,4,POL);S(6,4,2,1,POL);}}
    else{S(0,13,16,3,"rgba(0,0,0,.18)");for(let k=0;k<4;k++){S(k*4,-5,4,18,POL);S(k*4+1,-4,2,16,k%2?"#c88a50":"#b07a40");S(k*4+1,-4,2,1,"#e0a868");}S(0,3,16,1,"#7a4a24");if(hp<10)S(6,0,3,1,POL);}}});}
  for(const g of GATES){const x=g.x*16,y=g.y*16;if(!vis(x,y,50))continue;const horiz=g.d==="N"||g.d==="S";const tw=town.has(g.s);const n=g.tiles.length;
    const xs=g.tiles.map(t=>t[0]),ys=g.tiles.map(t=>t[1]);const x0=Math.min(...xs)*16,y0=Math.min(...ys)*16,x1=(Math.max(...xs)+1)*16,y1=(Math.max(...ys)+1)*16;
    list.push({y:y1-1,f:()=>{const amt=gateOpenAmt(g),closed=amt>0.04;const S=(a,b2,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(a,b2,ww,hh);};
      const pil=(px,py)=>{S(px-1,py-12,10,24,POL);S(px,py-11,8,22,tw?"#c0bccc":"#b07a40");S(px,py-11,8,2,tw?"#e0dce8":"#e0a868");S(px-2,py-14,12,4,POL);S(px-1,py-13,10,2,tw?"#d8d4e0":"#c88a50");};
      if(horiz){pil(x0-10,y0+6);pil(x1+2,y0+6);if(closed){const lw=Math.max(1,Math.round((x1-x0)/2*amt));for(const lx of [x0,x1-lw]){S(lx-1,y0-6,lw+2,20,POL);S(lx,y0-5,lw,18,"#a8643a");for(let k=lx+3;k<lx+lw;k+=4)S(k,y0-5,1,18,"#7a4424");S(lx,y0,lw,1,"#5a5260");S(lx,y0+8,lw,1,"#5a5260");}}}
      else{pil(x0+4,y0-4);pil(x0+4,y1+8);if(closed){const lh=Math.max(1,Math.round((y1-y0+2)/2*amt));for(const ly of [y0-1,y1+1-lh]){S(x0+5,ly-1,6,lh+2,POL);S(x0+6,ly,4,lh,"#a8643a");}}}
      const gl=chibiLook(g.s*13+(g.d.charCodeAt(0)),"guard","human");if(horiz){drawChibi(gl,x0-14,y0+22,0,0);drawChibi(gl,x1+14,y0+22,0,0);}else{drawChibi(gl,x0+8+g.o[0]*16,y0-4,0,0);drawChibi(gl,x0+8+g.o[0]*16,y1+12,0,0);}}});}
  for(const t of TOWERS){const x=t.x*16,y=t.y*16;if(!vis(x,y,60))continue;list.push({y:y+16,f:()=>{const S=(a,b2,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a,y+b2,ww,hh);};
    S(-3,14,22,3,"rgba(0,0,0,.2)");S(-3,-18,22,33,POL);S(-2,-17,20,31,"#b4b0c0");for(let r=0;r<5;r++)S(-2,-14+r*6,20,1,"#8a8698");S(-2,-17,20,2,"#d8d4e0");S(5,-8,6,8,POL);S(6,-7,4,6,"#3a3448");
    for(let k=0;k<4;k++){S(-4+k*6,-24,5,7,POL);S(-3+k*6,-23,3,5,"#c8c4d4");}drawChibi(chibiLook(t.x*7+t.y,"archer","human"),x+8,y-20,0,0,0.8);}});}};
// ===== MAGIC CLASHES =====
function elemOfCol(c){if(!c)return"arcane";const [r,g,b]=c;if(b>200&&r>140&&g<200)return"lightning";if(b>=200&&r<200)return"ice";if(r>200&&g<200&&b<120)return"fire";if(g>r&&g>b)return"earth";return"arcane";}
const FX_EL={fireball:"fire",air:"air"};
function projPow(p){return p.pow!=null?p.pow:(p.dmg||1)*(p.lv||1);}
function fxPow(f){return f.pow!=null?f.pow:(f.dmg||1);}
function clashFX(x,y,col,steam){burst(x,y,col,18,1.8,2);fx.push({k:"ring",x,y,r:2,max:16,life:16,col});if(steam)for(let i=0;i<14;i++)particles.push({x:x+(Math.random()-.5)*8,y,z:6,vx:(Math.random()-.5)*.6,vy:-.2-Math.random()*.4,vz:.6,life:40,max:40,col:[235,240,245],size:3,kind:"magic"});
  if(SFX.clash)SFX.clash(steam);}
SFX.clash=(steam)=>{try{tone(steam?330:520,0.35,{v:0.05,a:0.01});tone(steam?247:780,0.4,{v:0.035,delay:0.05,a:0.02});}catch(_){}};
let clashCount=0;
function updateClashes(){if(!projectiles.length)return;
  for(const p of projectiles){if(p.dead)continue;for(const w of walls){if(p.x>w.x-2&&p.x<w.x+w.w+2&&p.y>w.y-2&&p.y<w.y+w.h+2){p.dead=true;const el=elemOfCol(p.col);clashFX(p.x,p.y,el==="lightning"?[200,180,255]:[190,140,80],false);clashCount++;break;}}}
  // projectile vs projectile
  for(const f of fx){if(f.life<=0||!FX_EL[f.k]&&!f.ally)continue;const fe=f.ally?"ice":FX_EL[f.k];
    for(const p of projectiles){if(p.dead||p.friendly)continue;if(Math.hypot(p.x-f.x,p.y-f.y)>(p.r||3)+6)continue;const pe=elemOfCol(p.col);
      const fp=fxPow(f),pp=projPow(p);
      if((fe==="fire"&&pe==="ice")||(fe==="ice"&&pe==="fire")){f.life=0;p.dead=true;clashFX((f.x+p.x)/2,(f.y+p.y)/2,[230,235,240],true);}
      else if(fp===pp){f.life=0;p.dead=true;clashFX((f.x+p.x)/2,(f.y+p.y)/2,[255,240,200],false);}
      else if(fp>pp){f.pow=fp-pp;f.dmg=Math.max(1,f.pow);p.dead=true;clashFX(p.x,p.y,[255,230,160],false);}
      else{p.pow=pp-fp;p.dmg=Math.max(1,Math.ceil(p.pow/(p.lv||1)));f.life=0;clashFX(f.x,f.y,[255,160,160],false);}
      clashCount++;if(f.life<=0)break;}}
  // reflected projectiles damage monsters
  for(const p of projectiles){if(!p.friendly||p.dead)continue;for(const e of mobs){if(e.dead)continue;if(Math.hypot(e.x+e.w/2-p.x,e.y+e.h/2-p.y)<e.w/2+4){p.dead=true;e.iframes=0;e._spell=1;if(e.sp==="dragon")hitDragon(e,0);else hurtEnemy(e,p.dmg||1,Math.atan2(p.vy,p.vx),true);break;}}}
  projectiles=projectiles.filter(p=>!p.dead);}
const _updateMagicC=updateMagic;updateMagic=function(){_updateMagicC();try{updateClashes();}catch(e){}};
// friendly (reflected) bolts must not hurt the hero: tag check in hero-hit
// ===== NO MOUNTAINS: former highlands become open, walkable forest =====
function removeMountains(){for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){const i=y*WW+x;const t=T[i];ELEV[i]=0;
    if(t===MTN||t===CLIFF||t===STAIRS){T[i]=hash2(x,y,77)<0.25?GRASS:FOREST;}}
  // scatter trees in the new forest: never adjacent (incl. diagonals), so trunks never form walls
  for(let y=1;y<WH-1;y++)for(let x=1;x<WW-1;x++){const i=y*WW+x;if(T[i]!==FOREST||OCC[i])continue;if(hash2(x,y,91)>0.22)continue;
    let ok=true;for(let dy=-1;dy<=1&&ok;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const n=T[(y+dy)*WW+x+dx];if(n===TREE||n===ROCK||n===BUSH||n===WALL){ok=false;break;}}
    if(ok)T[i]=TREE;}
  for(const k in SPECIES){const d=SPECIES[k];if(d.biome&&d.biome.includes("mountain"))d.biome=[...new Set(d.biome.map(b=>b==="mountain"?(d.fly?"ruins":"forest"):b))];}}
// ===== GAME FEEL: easing, sliding, camera, interpolation, hit-stop, pacing =====
let hitStop=0,camFX=null,camFY=null,camT=0;
// move with corner sliding: if an axis is blocked, nudge sideways around tile corners
function slideMove(e,dx,dy){const x0=e.x,y0=e.y;moveEntity(e,dx,dy);
  if(dx&&Math.abs(e.x-(x0+dx))>0.01&&Math.abs(dy)<Math.abs(dx)*0.6){for(const s of [1,-1])for(let k=1;k<=6;k++){const oy=e.y;e.y=oy+s*k;e.x+=Math.sign(dx)*0.6;const free=!blockedE(e);e.x-=Math.sign(dx)*0.6;e.y=oy;if(free){moveEntity(e,0,s*Math.min(k,Math.abs(dx)));return;}}}
  if(dy&&Math.abs(e.y-(y0+dy))>0.01&&Math.abs(dx)<Math.abs(dy)*0.6){for(const s of [1,-1])for(let k=1;k<=6;k++){const ox=e.x;e.x=ox+s*k;e.y+=Math.sign(dy)*0.6;const free=!blockedE(e);e.y-=Math.sign(dy)*0.6;e.x=ox;if(free){moveEntity(e,s*Math.min(k,Math.abs(dy)),0);return;}}}}
// fixed-step interpolation for rendering
let interpList=[];
function snapPrev(){if(!hero)return;hero._ox=hero.x;hero._oy=hero.y;for(const m of mobs){m._ox=m.x;m._oy=m.y;}for(const n of npcs){n._ox=n.x;n._oy=n.y;}}
function interpOn(a){interpList.length=0;if(!hero||state!=="play"||paused)return;const L=[hero,...mobs];if(npcs)for(const n of npcs)if(n.alive)L.push(n);
  for(const e of L){if(e._ox==null)continue;const dx=e.x-e._ox,dy=e.y-e._oy;if(!dx&&!dy)continue;if(Math.abs(dx)>24||Math.abs(dy)>24)continue;interpList.push(e,e.x,e.y);e.x=e._ox+dx*a;e.y=e._oy+dy*a;}}
function interpOff(){for(let i=0;i<interpList.length;i+=3){const e=interpList[i];e.x=interpList[i+1];e.y=interpList[i+2];}interpList.length=0;}
// frame pacing: watch frame times and trim effects on slow devices
let paceAvg=16.7,lowFX=false;
function framePace(fd){paceAvg=paceAvg*0.95+fd*0.05;const want=paceAvg>22;if(want!==lowFX){lowFX=want;}const cap=lowFX?140:420;if(particles.length>cap)particles.splice(0,particles.length-cap);}
// short fade for doors
function fadeQuick(cb){const f=document.getElementById("fade");f.textContent="";f.style.transition="opacity .18s";f.classList.add("on");paused=true;
  setTimeout(()=>{cb&&cb();camFX=null;setTimeout(()=>{f.classList.remove("on");paused=false;setTimeout(()=>{f.style.transition="";},200);},window.__FAST?10:60);},window.__FAST?20:180);}
// dodge roll rendering + combo swing variety
const _drawHeroFullF=drawHeroFull;
drawHeroFull=function(){if(hero.dodgeT>0&&!hero.boat&&!hero.swim){const p=1-hero.dodgeT/(hero.dodgeMax||12);ctx.save();ctx.translate(hero.x+6,hero.y+8);ctx.rotate(p*Math.PI*2*(hero.rollDir||1));ctx.scale(1,0.85+0.15*Math.cos(p*Math.PI*2));ctx.translate(-hero.x-6,-hero.y-8);_drawHeroFullF();ctx.restore();
    if(frameN%2===0)particles.push({x:hero.x+6,y:hero.y+12,z:0,vx:(Math.random()-.5),vy:(Math.random()-.5),vz:.3,life:14,max:14,col:[220,200,160],size:2,kind:"spark"});return;}
  if(hero.swinging>=0&&hero.combo){ctx.save();const d=[[0,1],[-1,0],[1,0],[0,-1]][hero.dir];ctx.translate(d[0]*hero.combo,d[1]*hero.combo);_drawHeroFullF();ctx.restore();
    if(hero.combo===2&&hero.swinging===2){ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle="rgba(255,240,180,.6)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(hero.x+6+d[0]*10,hero.y+8+d[1]*10,13,0,7);ctx.stroke();ctx.restore();}return;}
  _drawHeroFullF();};
// gates swing open/closed smoothly
function gateOpenAmt(g){const want=gateClosed(g)&&!(g.hp<=0)?1:0;g._cl=g._cl==null?want:g._cl+(want-g._cl)*0.08;return g._cl;}
// ===== PROPERTY: town houses for sale, wilderness cabins, owned-home life =====
const CABINS=[];
const owns=b=>!!P&&(P.homes||[]).includes(b.id);
function homePrice(b){return b.price||(b.cabin?400:250);}
function genCabins(){const land=(x,y)=>{const t=T[y*WW+x];return (t===GRASS||t===FOREST||t===TREE||t===FLOWER||t===BUSH||t===SAND)&&!OCC[y*WW+x]&&!RIVERM[y*WW+x];};
  const okPlot=(cx,cy)=>{for(let y=cy-4;y<=cy+4;y++)for(let x=cx-5;x<=cx+5;x++){if(x<2||y<2||x>=WW-2||y>=WH-2||!land(x,y))return false;}
    if(SETS.some(s=>Math.hypot(cx-s.x,cy-s.y)<s.r+16))return false;if(CABINS.some(c=>Math.hypot(cx-c.x,cy-c.y)<40))return false;if(LAIRS.some(L=>Math.hypot(cx-L.x,cy-L.y)<14))return false;if(CAMPS.some(L=>Math.hypot(cx-L.x,cy-L.y)<16))return false;return true;};
  const names=["Mossy Hollow","Fernbrook","Birchwatch","Owl's Rest","Pinecone Lodge","Foxglove Croft","Amberleaf","Stillwater","Thistledown","Gull's Perch"];
  // one on an island first
  for(const I of ISLES){if(CABINS.length)break;for(let k=0;k<200&&!CABINS.length;k++){const a=k*2.4,rr=(k%9)/9*I.r*0.8;const cx=Math.round(I.x+Math.cos(a)*rr),cy=Math.round(I.y+Math.sin(a)*rr);if(okPlot(cx,cy))CABINS.push({x:cx,y:cy,island:true});}}
  for(let k=0;k<4000&&CABINS.length<8;k++){const cx=6+Math.floor(hash2(k,7,301)*(WW-12)),cy=6+Math.floor(hash2(k,9,302)*(WH-12));if(okPlot(cx,cy))CABINS.push({x:cx,y:cy});}
  CABINS.forEach((c,i)=>{c.name=names[i];let sid=0,bd=1e9;for(const s of SETS){const d=Math.hypot(s.x-c.x,s.y-c.y);if(d<bd){bd=d;sid=s.id;}}c.s=sid;
    for(let y=c.y-4;y<=c.y+4;y++)for(let x=c.x-5;x<=c.x+5;x++){const i2=y*WW+x;T[i2]=GRASS;}
    for(let y=c.y+2;y<=c.y+5;y++)T[y*WW+c.x]=ROAD;T[(c.y+2)*WW+c.x-1]=ROAD;
    const b={id:buildings.length,s:sid,x:c.x-2,y:c.y-2,w:4,h:3,kind:"forsale",cabin:true,cabinName:c.name,price:380+i*40+(c.island?150:0),dmg:0,burn:0,district:"wild"};
    for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){OCC[y*WW+x]=b.id+1;}c.b=b.id;buildings.push(b);
    for(let y=c.y-1;y<=c.y;y++)for(let x=c.x+3;x<=c.x+4;x++)T[y*WW+x]=FARM;});
  for(const s of SETS)for(const id of s.bIdx||[]){const b=buildings[id];if(b.kind==="forsale"&&!b.price)b.price=s.kind.includes("town")?300:220;}}
function genCabinProps(){for(const c of CABINS){const put=(type,x,y,solid=true)=>{PROPS.push({type,x,y,cabin:c.b});if(solid)OCC[y*WW+x]=-1;};
    for(let x=c.x-5;x<=c.x+5;x++){put("fence",x,c.y-4);if(Math.abs(x-c.x)>1)put("fence",x,c.y+4);}
    for(let y=c.y-3;y<=c.y+3;y++){put("fencev",c.x-5,y);put("fencev",c.x+5,y);}
    put("well",c.x-4,c.y-1);put("block",c.x-3,c.y+2);put("logs",c.x-4,c.y+2);put("salesign",c.x+2,c.y+3);}}
// ---- drawing extras ----
const _drawPropH=drawProp;drawProp=function(p){const x=p.x*16,y=p.y*16,g=ctx;const S=(a,b2,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b2,w,h);};const POL2="#2a1a10";
  if(p.type==="fencev"){S(6,0,4,16,POL2);S(7,0,2,16,"#c88a50");S(5,2,6,3,POL2);S(6,3,4,1,"#e0a868");return;}
  if(p.type==="well"){S(1,14,14,2,"rgba(0,0,0,.2)");S(1,7,14,8,POL2);S(2,8,12,6,"#9aa0a8");S(2,8,12,1,"#c8ccd0");S(4,9,8,3,"#2a4a8a");S(2,1,2,8,POL2);S(12,1,2,8,POL2);S(1,0,14,3,POL2);S(2,0,12,2,"#b0503a");return;}
  if(p.type==="block"){S(2,13,12,2,"rgba(0,0,0,.2)");S(3,7,10,7,POL2);S(4,8,8,5,"#9a5e30");S(4,8,8,2,"#e8c890");S(9,1,2,8,POL2);S(7,1,6,3,"#a0a8b0");return;}
  if(p.type==="salesign"){const b=buildings[p.cabin];S(7,6,2,10,POL2);S(0,0,16,8,POL2);S(1,1,14,6,owns(b)?"#5ac85a":"#f0e0b0");g.fillStyle="#2a1a10";g.font="bold 5px monospace";g.fillText(owns(b)?"HOME":homePrice(b)+"g",x+2,y+6);return;}
  return _drawPropH(p);};
const _bsH=buildingSprite;buildingSprite=function(b){const c=_bsH(b);if(!b||!b.cabin||c._cab)return c;try{const g=c.getContext("2d");const w=c.width,h=c.height;
  g.globalCompositeOperation="source-atop";g.fillStyle="rgba(120,70,30,.28)";g.fillRect(0,h*0.55,w,h*0.45);g.strokeStyle="rgba(60,30,10,.5)";for(let yy=Math.round(h*0.58);yy<h-4;yy+=4){g.beginPath();g.moveTo(0,yy+.5);g.lineTo(w,yy+.5);g.stroke();}g.globalCompositeOperation="source-over";c._cab=1;}catch(_){}return c;};
// ---- buying ----
function buyHome(b){if(owns(b))return true;const pr=homePrice(b);if(P.gold<pr){toast("Not enough gold ("+pr+"g).");return false;}
  P.gold-=pr;P.homes=P.homes||[];P.homes.push(b.id);if(P.house<0)P.house=b.id;b.owned=true;if(P.rent===b.id)P.rent=-1;
  if(!P.homeStore)P.homeStore={};P.homeStore[b.id]=P.homeStore[b.id]||{};const sp=npcs.find(n=>n.id===P.spouse);if(sp&&P.homes.length===1)sp.home=b.id;
  addNews(b.s,`The wanderer bought ${b.cabin?b.cabinName+" cabin":"a house in "+SETS[b.s].name}.`);SFX.coin&&SFX.coin();checkRank();saveGame();toast((b.cabin?b.cabinName:"The house")+" is yours! Here are the keys.");return true;}
function homeLabel(b){return b.cabin?`${b.cabinName} cabin (wilds near ${SETS[b.s].name})`:`House in ${SETS[b.s].name} — ${b.district||"residential"} district`;}
function homePreview(b){try{const c=buildingSprite(b);return c.toDataURL();}catch(_){return null;}}
function homeOffer(b,back){const own=owns(b);const btn=[];
  if(own){btn.push({l:"Go inside",f:()=>enterBuilding(b)});}
  else{btn.push({l:`Buy for ${homePrice(b)}g`,dis:P.gold<homePrice(b),f:()=>{buyHome(b);}});if(!b.cabin&&P.rent!==b.id)btn.push({l:"Rent (15g / 3 days)",f:()=>{if(P.gold<15)return toast("Not enough gold.");P.gold-=15;P.rent=b.id;P.rentUntil=world.day+3;checkRank();toast("Rented for 3 days.");}});}
  if(back)btn.push({l:"Back",f:back});btn.push({l:"Close"});
  showMenu(own?"Your Home":(b.cabin?"Cabin for sale":"House for sale"),`${homeLabel(b)}\nSize: ${b.cabin?"12×8 log cabin, fenced yard, garden, well, chopping block":"12×8 timber house, hearth and garden"}\nRooms: bedroom, kitchen, workshop corner, storage\nPrice: ${homePrice(b)}g${own?" (owned)":""}`,btn);
  const src=homePreview(b);if(src){const im=document.createElement("img");im.src=src;im.className="homePrev";im.style.cssText="display:block;margin:4px auto 8px;width:128px;image-rendering:pixelated;border:2px solid #b08a3a;border-radius:4px;background:#4fb53a";const p=menuEl.querySelector("p");p&&p.after(im);}}
function realEstate(sid){const list=buildings.filter(b=>b.kind==="forsale"&&(b.s===sid));
  showMenu("Real Estate — "+SETS[sid].name,`Homes for sale near ${SETS[sid].name}. You own ${(P.homes||[]).length}.`,list.map(b=>({l:`${owns(b)?"🏠 ":""}${b.cabin?b.cabinName+" cabin":"Town house #"+b.id} — ${owns(b)?"owned":homePrice(b)+"g"}`,f:()=>homeOffer(b,()=>realEstate(sid))}))
    .concat([{l:"Furniture catalogue",f:()=>furnShop(sid)},{l:"Close"}]));}
const FURN={plant:{n:"Potted plant",p:25},bookshelf:{n:"Bookshelf",p:60},painting:{n:"Painting",p:45},rug2:{n:"Fancy rug",p:40},lamp:{n:"Floor lamp",p:35},armchair:{n:"Armchair",p:50}};
function furnShop(sid){showMenu("Furniture","Delivered to your furniture box. Place it inside any home you own.",Object.keys(FURN).map(k=>({l:`${FURN[k].n} — ${FURN[k].p}g`,dis:P.gold<FURN[k].p,f:()=>{P.gold-=FURN[k].p;P.decor=P.decor||[];P.decor.push(k);toast("Bought "+FURN[k].n+".");furnShop(sid);}})).concat([{l:"Back",f:()=>realEstate(sid)}]));}
const _shopMenuH=shopMenu;shopMenu=function(sid){_shopMenuH(sid);const w=menuEl.querySelector(".mbtns");if(w){const e=document.createElement("button");e.type="button";e.id="btnRealEstate";e.textContent="🏠 Real Estate / Buy a House";e.onclick=ev=>{ev.stopPropagation();closeMenu();realEstate(sid);};w.prepend(e);}};
const _bmH=buildingMenu;buildingMenu=function(b,inside){if(b&&b.kind==="forsale"&&!inside)return homeOffer(b);return _bmH.apply(this,arguments);};
const _dlH=doorLocked;doorLocked=function(b){if(b.kind==="forsale")return!(owns(b)||P.rent===b.id);return _dlH(b);};
const _rnH=roomName;roomName=function(b){if(b.kind==="forsale"&&owns(b))return b.cabin?b.cabinName+" Cabin":"Your Home";return _rnH(b);};
const _interactH=interact;interact=function(){if(!room){const hx=hero.x+6,hy=hero.y+8;for(const p of PROPS){if(p.type!=="salesign")continue;if(Math.abs(p.x*16+8-hx)<22&&Math.abs(p.y*16+8-hy)<22){homeOffer(buildings[p.cabin]);return true;}}}return _interactH.apply(this,arguments);};
// ---- home interior ----
const _brH=buildRoom;buildRoom=function(b){if(b.kind!=="forsale")return _brH(b);const w=12,h=8,F=[];const add=(type,x,y,fw,fh,solid=true,extra={})=>F.push({type,x,y,w:fw,h:fh,solid,...extra});
  add("window",2,0,2,1,false);add("window",w-4,0,2,1,false);add("fire",5,1,2,1,true,{act:"cook"});add("bed",1,2,1,2,true,{act:"sleep"});add("bed",2,2,1,2,true,{act:"sleep"});
  add("chest",1,h-3,1,1,true,{act:"store"});add("chest",2,h-3,1,1,true,{act:"store"});add("bench",w-3,h-3,2,1,true,{act:"craft"});add("stove",8,1,1,1,true,{act:"cook"});
  add("trophy",w-3,0,2,1,false,{act:"trophy"});add("wardrobe",w-2,2,1,2,true,{act:"wardrobe"});add("shelf",3,0,2,1,false,{act:"display"});add("lampsw",w-2,h-3,1,1,true,{act:"light"});
  add("rug",4,4,4,2,false);add("table",5,3,2,1);
  for(const d of homeDecor(b))add(d.t,d.x,d.y,1,1,d.t!=="rug2"&&d.t!=="painting",{decor:d});
  return{b,kind:"forsale",w,h,F,sp:{beds:[[1,2.4],[2,2.4]],work:null,stove:[8,2.2],spots:[[4,5],[7,5]]},door:{x:Math.floor(w/2),y:h-1}};};
function homeDecor(b){P.homeDecor=P.homeDecor||{};return P.homeDecor[b.id]=P.homeDecor[b.id]||[];}
const HOME_ACT={
  sleep:()=>sleep(room.b),
  store:()=>homeStorage(room.b),
  craft:()=>craftMenu(),
  cook:()=>cookMenu(),
  trophy:()=>{const t=(P.trophies||[]);showMenu("Trophy Wall",t.length?t.map(x=>"🏆 "+x).join("\n"):"Empty hooks wait for dragon horns and boss crowns. Slay a dragon or demon lord!",[{l:"Close"}]);},
  wardrobe:()=>{const O=[["Hero blue",[60,110,200]],["Forest green",[60,150,70]],["Royal red",[190,50,60]],["Night black",[50,50,70]],["Noble purple",[130,70,180]]];showMenu("Wardrobe","Pick an outfit.",O.map(([n,c])=>({l:n,f:()=>{P.outfit=c;applyOutfit();toast("You changed into "+n+".");}})).concat([{l:"Close"}]));},
  display:()=>{const parts=Object.keys(P.inv).filter(k=>P.inv[k]>0&&ITEMS[k]&&ITEMS[k].part);showMenu("Display Shelf",(P.shelf||[]).length?"On display: "+P.shelf.map(k=>ITEMS[k]?ITEMS[k].n:k).join(", "):"Nothing displayed yet.",parts.slice(0,8).map(k=>({l:"Display "+ITEMS[k].n,f:()=>{P.inv[k]--;(P.shelf=P.shelf||[]).push(k);toast("Displayed "+ITEMS[k].n+".");}})).concat([{l:"Close"}]));},
  light:()=>{room.dark=!room.dark;P.lightsOff=P.lightsOff||{};P.lightsOff[room.b.id]=room.dark;SFX.ui();toast(room.dark?"Lights off.":"Lights on.");},
};
function applyOutfit(){try{if(P.outfit&&typeof HERO_LOOK!=="undefined"){HERO_LOOK.shirt=P.outfit;if(typeof chibiCache!=="undefined")chibiCache.clear&&chibiCache.clear();}}catch(_){}}
function homeStorage(b){P.homeStore=P.homeStore||{};const st=P.homeStore[b.id]=P.homeStore[b.id]||{};if(!P.storage)P.storage={};
  const show=(box,label)=>{const inv=Object.keys(P.inv).filter(k=>P.inv[k]>0&&ITEMS[k]),s=Object.keys(box).filter(k=>box[k]>0&&ITEMS[k]);
    showMenu(label,`Stored: ${s.map(k=>ITEMS[k].n+" x"+box[k]).join(", ")||"nothing"}`,
      inv.map(k=>({l:`Deposit ${ITEMS[k].n} (${P.inv[k]})`,f:()=>{box[k]=(box[k]||0)+P.inv[k];P.inv[k]=0;show(box,label);}}))
      .concat(s.map(k=>({l:`Withdraw ${ITEMS[k].n} (${box[k]})`,f:()=>{P.inv[k]=(P.inv[k]||0)+box[k];box[k]=0;show(box,label);}})))
      .concat([{l:label.includes("Shared")?"This home's chest":"Shared storage (all homes)",f:()=>label.includes("Shared")?show(st,"Home Chest"):show(P.storage,"Shared Storage")},{l:"Close"}]));};
  show(st,"Home Chest");}
function cookMenu(){const R=[["Fish stew","fish",{hp:2,buff:"def"}],["Roast meat","meat",{hp:2,buff:"atk"}],["Berry tart","berry",{hp:1,buff:"mp"}]];
  showMenu("Cooking",`Cook food for a buff that lasts until evening.${P.buff?"\nActive buff: "+P.buff.k:""}`,R.map(([n,k,e])=>({l:`${n} (1 ${ITEMS[k].n})`,dis:!(P.inv[k]>0),f:()=>{P.inv[k]--;hero.hp=Math.min(hero.maxHp,hero.hp+e.hp);P.hunger=Math.min(100,P.hunger+40);P.buff={k:e.buff,until:world.day*1440+world.min+600};if(e.buff==="mp")P.mag.mp=P.mag.max;updateHearts();SFX.chime();toast(`You cook ${n}. ${e.buff==="atk"?"+1 sword damage":e.buff==="def"?"Toughened skin":"Mana restored"} until evening.`);}})).concat([{l:"Decorate",f:()=>decorMenu()},{l:"Close"}]));}
function decorMenu(){if(!room||room.b.kind!=="forsale")return;const b=room.b,D=homeDecor(b);const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];const tx=Math.floor((hero.x+6)/16)+dx,ty=Math.floor((hero.y+8)/16)+dy;
  const near=D.map((d,i)=>({d,i,dist:Math.hypot(d.x-tx,d.y-ty)})).sort((a,b2)=>a.dist-b2.dist)[0];const inv=P.decor||[];
  const free=!roomSolid(tx,ty)&&ty<room.h-1;
  showMenu("Decorate",`Furniture box: ${inv.map(k=>FURN[k]?FURN[k].n:k).join(", ")||"empty (craft or buy furniture)"}\nPlaced here: ${D.length}`,
    [...new Set(inv)].map(k=>({l:`Place ${FURN[k]?FURN[k].n:k} in front of you`,dis:!free,f:()=>{inv.splice(inv.indexOf(k),1);D.push({t:k,x:tx,y:ty});room=buildRoom(b);toast("Placed.");saveGame();}}))
    .concat(near&&near.dist<2.5?[{l:`Move ${near.d.t} here`,dis:!free,f:()=>{near.d.x=tx;near.d.y=ty;room=buildRoom(b);}},{l:`Remove ${near.d.t}`,f:()=>{D.splice(near.i,1);inv.push(near.d.t);room=buildRoom(b);}}]:[])
    .concat(partyMembers().filter(n=>n.home!==b.id).map(n=>({l:`Invite ${n.name} to live here`,f:()=>{n.home=b.id;toast(n.name+" moves in!");}})))
    .concat([{l:"Close"}]));}
const _riH=roomInteract;roomInteract=function(){if(room&&room.b.kind==="forsale"){const hx=hero.x+6,hy=hero.y+6;for(const f of room.F){if(!f.act||!HOME_ACT[f.act])continue;const cx=(f.x+f.w/2)*16,cy=(f.y+f.h/2)*16;if(Math.abs(cx-hx)>f.w*8+14||Math.abs(cy-hy)>f.h*8+14)continue;
    for(const r of roomNpcs())if(Math.hypot(r.x+8-hx,r.y+8-hy)<16)return talk(r.n);return HOME_ACT[f.act](f);}}return _riH();};
const _enterH=enterBuilding;enterBuilding=function(b){const r=_enterH(b);if(room&&b.kind==="forsale")room.dark=!!(P.lightsOff&&P.lightsOff[b.id]);return r;};
const _drawRoomH=drawRoom;drawRoom=function(){_drawRoomH();if(room&&room.dark){ctx.fillStyle="rgba(10,10,40,.55)";ctx.fillRect(0,0,W,H);}};
// sleeping in your own bed: morning, full HP and MP, save
sleep=function(b){fadeBlack("Zzz...",()=>{const toMorning=((24-hour()+7)%24||24)*60-world.min%60;advanceMinutes(toMorning);hero.hp=hero.maxHp;if(P.mag)P.mag.mp=P.mag.max;updateHearts();const d=doorOf(b);P.respawn={x:d.x,y:d.y+4};toast("You feel rested. Day "+(world.day+1));saveGame();});};
// ---- fast travel to owned homes ----
const _dfmH=drawFullMap;drawFullMap=function(){_dfmH();const g=mapC.getContext("2d");g.font="bold 14px system-ui";g.textAlign="center";for(const c of CABINS){const b=buildings[c.b];g.fillStyle=owns(b)?"#5aff6a":"#d8c090";g.fillText(owns(b)?"🏠":"⌂",c.x*3,c.y*3+5);}
  for(const id of P.homes||[]){const b=buildings[id];if(b.cabin)continue;g.fillStyle="#5aff6a";g.fillText("🏠",(b.x+2)*3,(b.y+1)*3);}};
mapC.addEventListener("click",e=>{const r=mapC.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*WW,y=(e.clientY-r.top)/r.height*WH;
  for(const id of P.homes||[]){const b=buildings[id];if(Math.hypot(b.x+2-x,b.y+1-y)<5){e.stopImmediatePropagation();travelHome(b);return;}}},true);
function travelHome(b){if(!owns(b))return false;mapEl.classList.add("hidden");paused=false;const d=doorOf(b);fadeQuick(()=>{hero.x=d.x;hero.y=d.y+6;hero.boat=false;hero.swim=false;snapPrev&&snapPrev();toast("You travel home to "+(b.cabin?b.cabinName:SETS[b.s].name)+".");});return true;}
// ---- cabin raids (random event) ----
function cabinRaidTick(){for(const id of P.homes||[]){const b=buildings[id];if(!b.cabin||Math.random()>0.12)continue;const d=doorOf(b);
  if(Math.hypot(d.x-hero.x,d.y-hero.y)<700){for(let i=0;i<3;i++)spawnMob(i?"goblin":"orc",d.x+(i-1)*30,d.y+60,{persist:true});toast("⚔ Raiders are attacking your cabin!");}
  else{world.bld[b.id].dmg=Math.min(1,(world.bld[b.id].dmg||0)+0.3);const st=(P.homeStore||{})[b.id];if(st){const k=Object.keys(st).find(k=>st[k]>0);if(k)st[k]=Math.max(0,st[k]-1);}}
  addNews(b.s,`Raiders struck ${b.cabinName} cabin in the wilds!`);}}
const _wallDailyH=wallDaily;wallDaily=function(){_wallDailyH();try{cabinRaidTick();}catch(_){}};
// ---- King path: estates ----
const _achH=achievements;achievements=function(){const a=_achH();const n=(P.homes||[]).length;const h=a.find(x=>x.k==="home");if(h)h.ok=n>0||P.house>=0;a.push({k:"estates",n:"Landowner: own 3 homes",ok:n>=3});return a;};
const _onKillHm=onKill;onKill=function(e){_onKillHm(e);try{const d=e.def||{};if(e.sp==="dragon"||d.boss||d.big&&d.rare){(P.trophies=P.trophies||[]).push((d.name||monName(e.sp)||e.sp)+(e.sp==="dragon"?" horn":" trophy"));}}catch(_){}};
const _swordDmgH=swordDmg;swordDmg=function(){const b=P.buff&&P.buff.until>world.day*1440+world.min?P.buff.k:null;return _swordDmgH()+(b==="atk"?1:0);};
// ===== Touch-scrollable menus: finger drag with momentum, visible scrollbar, wheel, tap-safe =====
(function(){const st=document.createElement("style");st.textContent=`
#menu{max-height:min(86vh,calc(100vh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom)))!important;overflow-y:auto!important;overscroll-behavior:contain;touch-action:none!important;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#e8c060 #2a1020}
#menu::-webkit-scrollbar{width:8px}#menu::-webkit-scrollbar-thumb{background:#e8c060;border-radius:4px}#menu::-webkit-scrollbar-track{background:#2a1020}
body.menuOpen #touch,body.menuOpen .rb,body.menuOpen #tl{pointer-events:none!important}
#menu .sbar{position:sticky;float:right;right:-10px;top:0;width:5px;margin-right:-10px;border-radius:3px;background:#ffd870cc;pointer-events:none;transition:opacity .4s}`;document.head.appendChild(st);})();
(function(){const m=document.getElementById("menu");let y0=0,s0=0,lastY=0,lastT=0,vel=0,moved=false,anim=0,tid=null;
  const bar=()=>{let b=m.querySelector(".sbar");if(!b){b=document.createElement("div");b.className="sbar";m.prepend(b);}const r=m.clientHeight/m.scrollHeight;b.style.display=r<0.99?"block":"none";b.style.height=Math.max(24,m.clientHeight*r)+"px";b.style.transform=`translateY(${m.scrollTop*(1-r)/r*r/(1-r||1)*0+m.scrollTop*(m.clientHeight-Math.max(24,m.clientHeight*r))/Math.max(1,m.scrollHeight-m.clientHeight)}px)`;};
  m.addEventListener("scroll",bar);new MutationObserver(()=>{m.scrollTop=0;bar();document.body.classList.toggle("menuOpen",!m.classList.contains("hidden"));}).observe(m,{childList:true,attributes:true,attributeFilter:["class"]});
  m.addEventListener("touchstart",e=>{e.stopPropagation();cancelAnimationFrame(anim);const t=e.changedTouches[0];tid=t.identifier;y0=lastY=t.clientY;s0=m.scrollTop;lastT=performance.now();vel=0;moved=false;},{passive:true});
  m.addEventListener("touchmove",e=>{e.stopPropagation();e.preventDefault();const t=[...e.changedTouches].find(t=>t.identifier===tid);if(!t)return;if(Math.abs(t.clientY-y0)>8)moved=true;
    const now=performance.now();vel=0.8*((lastY-t.clientY)/Math.max(1,now-lastT))+0.2*vel;lastY=t.clientY;lastT=now;m.scrollTop=s0+(y0-t.clientY);},{passive:false});
  m.addEventListener("touchend",e=>{e.stopPropagation();if(!moved)return;e.preventDefault();let v=vel*16;const step=()=>{if(Math.abs(v)<0.3)return;m.scrollTop+=v;v*=0.95;anim=requestAnimationFrame(step);};step();},{passive:false});
  // a drag must not fire the button under the finger; a clean tap still does
  m.addEventListener("click",e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false;}},true);
  m.addEventListener("wheel",e=>{e.stopPropagation();},{passive:true});
})();
// ===== ACTION-RPG HUD (original art): ring D-pad, big sword button + 4 spell arc, bars with LV badge =====
const RING_SVG=`data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><defs><radialGradient id='g' cx='50%' cy='45%'><stop offset='0' stop-color='#fff' stop-opacity='.10'/><stop offset='1' stop-color='#3a2a10' stop-opacity='.28'/></radialGradient><linearGradient id='au' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffe9a0'/><stop offset='.5' stop-color='#d4a040'/><stop offset='1' stop-color='#8a5a1a'/></linearGradient></defs><circle cx='64' cy='64' r='60' fill='url(#g)' stroke='url(#au)' stroke-width='4' opacity='.9'/><circle cx='64' cy='64' r='44' fill='none' stroke='#ffe6a0' stroke-opacity='.35' stroke-width='2'/>${[0,90,180,270].map(a=>`<g transform='rotate(${a} 64 64)'><path d='M64 8 L76 24 L64 40 L52 24 Z' fill='#7ac860' fill-opacity='.55' stroke='url(#au)' stroke-width='2.5'/><path d='M64 14 L70 24 L64 30 L58 24 Z' fill='#fff' fill-opacity='.35'/></g>`).join("")}<circle cx='64' cy='64' r='8' fill='none' stroke='url(#au)' stroke-width='2' opacity='.7'/></svg>`)}`;
(function(){const st=document.createElement("style");st.textContent=`
#touch{display:block!important}
#hearts,#btnC,#btnW,#hotbar{display:none!important}
#hudL{top:58px!important;left:10px!important;font-size:11px}
#hudL .bar:not(#stam){display:none}
#tl{position:fixed;top:calc(8px + env(safe-area-inset-top));left:calc(8px + env(safe-area-inset-left));display:flex;gap:8px;z-index:22}
#tl button{width:42px;height:42px;border-radius:50%;border:3px solid #c8902c;background:radial-gradient(circle at 45% 35%,#7a4a2a,#3a2010);color:#ffe9b0;font:bold 11px system-ui;box-shadow:0 2px 6px #0008,inset 0 0 0 1px #ffe08a;padding:0}
#bars{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(8px + env(safe-area-inset-bottom));width:min(46vw,440px);z-index:21;pointer-events:none}
#bars .row{display:flex;align-items:center;gap:0}
#bars .hp,#bars .mp{flex:1;height:12px;border:2px solid #2a1808;background:#2a1a14;position:relative;overflow:hidden}
#bars .hp{border-radius:7px 0 0 7px}#bars .mp{border-radius:0 7px 7px 0}
#bars .hp i{position:absolute;right:0;top:0;bottom:0;background:linear-gradient(#ff7a6a,#c8201a 60%,#8a1010);transition:width .25s}
#bars .mp i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#ffe880,#e0b020 45%,#4a7ae0 46%,#2a4ab0);transition:width .25s}
#bars .lv{min-width:58px;height:22px;margin:0 -2px;z-index:1;border-radius:6px;border:2px solid #d4a040;background:linear-gradient(#5a6a8a,#2a3048);color:#fff2c0;font:bold 12px Georgia,serif;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #2a1808,inset 0 1px 0 #ffffff55;letter-spacing:.5px}
#bars .xp{height:5px;margin:3px 10px 0;border:1px solid #102a10;background:#1a2a1a;border-radius:3px;overflow:hidden}#bars .xp i{display:block;height:100%;background:linear-gradient(#9cff7a,#38b030);transition:width .3s}
#bars .num{position:absolute;inset:0;font:bold 9px system-ui;color:#fff;text-shadow:0 1px 1px #000;display:flex;align-items:center;justify-content:center}
#stickBase{width:128px!important;height:128px!important;left:18px!important;bottom:18px!important;border:none!important;background:url("${RING_SVG}") center/contain no-repeat!important;border-radius:50%}
#stickKnob{width:46px!important;height:46px!important;background:radial-gradient(circle at 45% 35%,#fff8,#c8a05055)!important;border:2px solid #e8c070!important;left:59px!important;bottom:59px!important}
.rb{position:fixed;border-radius:50%;padding:0;pointer-events:auto;touch-action:none;border:4px solid #b8802c;box-shadow:0 0 0 2px #3a2008,0 3px 8px #0009,inset 0 0 0 2px #ffe08a;color:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;z-index:20}
#btnA.rb{width:88px;height:88px;right:calc(22px + env(safe-area-inset-right));bottom:calc(30px + env(safe-area-inset-bottom));font-size:34px;background:radial-gradient(circle at 45% 35%,#c8d0e0,#5a6a8a 60%,#2a3048)!important}
#btnA.rb.charge{box-shadow:0 0 0 2px #3a2008,0 0 18px 6px #ffd860,inset 0 0 0 2px #fff}
#btnB.rb{width:46px;height:46px;font-size:20px;background:radial-gradient(circle at 45% 35%,#e0c890,#8a6a3a)!important}
.sp4{width:54px;height:54px;font-size:22px}.sp4 .cd{position:absolute;inset:0;border-radius:50%;pointer-events:none}.sp4.low{filter:grayscale(.7) brightness(.6)}.sp4 small{position:absolute;bottom:2px;font:bold 8px system-ui;opacity:.85}
@media (orientation:portrait){#bars{width:70vw;bottom:calc(150px + env(safe-area-inset-bottom))}#stickBase{width:116px!important;height:116px!important}}
`;document.head.appendChild(st);})();
const SP_COL={fireball:"#e8501a",thunder:"#7a5ae0",heal:"#38b04a",air:"#3ab8a8"};
function buildHUD(){if(document.getElementById("bars"))return;
  const tl=document.createElement("div");tl.id="tl";tl.innerHTML=`<button id="btnPause" title="Pause">II</button><button id="btnSave" title="Save">💾</button><button id="btnShop" title="Shop">Shop</button>`;document.body.appendChild(tl);
  const bars=document.createElement("div");bars.id="bars";bars.innerHTML=`<div class="row"><div class="hp"><i id="hpFill"></i><span class="num" id="hpNum"></span></div><div class="lv" id="lvBadge">LV.01</div><div class="mp"><i id="mpFill"></i><span class="num" id="mpNum"></span></div></div><div class="xp"><i id="xpFill"></i></div>`;document.body.appendChild(bars);
  const A=document.getElementById("btnA"),B=document.getElementById("btnB");A.classList.add("rb");A.textContent="🗡";B.classList.add("rb");B.textContent="⟲";
  for(const el of [A,B])document.body.appendChild(el);
  // spell arc around the sword button
  const place=()=>{const port=innerHeight>innerWidth;const R=port?76:84,cr=22+44,cb=30+44;const angs=[180,145,110,75];
    SPELL_ORDER.forEach((k,i)=>{const b=document.getElementById("sp_"+k);if(!b)return;const a=angs[i]*Math.PI/180;b.style.right=(cr-Math.cos(a)*R-27)+"px";b.style.bottom=(cb+Math.sin(a)*R-27)+"px";});
    B.style.right=(cr-23-10)+"px";B.style.bottom=(cb+R+36)+"px";};
  SPELL_ORDER.forEach((k,i)=>{const b=document.createElement("button");b.id="sp_"+k;b.className="rb sp4";b.title=SPELLS[k].n;b.style.background=`radial-gradient(circle at 45% 35%,#ffffff88,${SP_COL[k]} 55%,#1a1020)`;
    b.innerHTML=`${SPELLS[k].ic}<small>${i+1}</small><span class="cd"></span>`;const go=e=>{e.preventDefault();e.stopPropagation();if(state!=="play"||paused)return;curSpell=k;castSpell(k);};
    b.addEventListener("touchstart",go,{passive:false});b.addEventListener("click",go);document.body.appendChild(b);});
  place();addEventListener("resize",place);
  document.getElementById("btnPause").onclick=e=>{e.stopPropagation();if(state!=="play")return;showMenu("Paused","The world waits for you.",[{l:"Resume"},{l:"Bag",f:()=>invMenu()},{l:"Quest Log",f:()=>questLog()},{l:"Map",f:()=>document.getElementById("btnMap").click()},{l:"Sound",f:()=>document.getElementById("btnSnd").click()}]);};
  document.getElementById("btnSave").onclick=e=>{e.stopPropagation();if(state!=="play")return;saveGame();toast("Game saved.");SFX.chime();};
  document.getElementById("btnShop").onclick=e=>{e.stopPropagation();if(state!=="play")return;if(curSet&&!SETS[curSet.id].island||curSet){shopMenu(curSet.id);}else toast("No shop nearby — visit a town or village.");};}
const _buildHotbarH=buildHotbar;buildHotbar=function(){buildHUD();};
updateHotbar=function(){if(!P||!P.mag||!hero)return;const now=performance.now();for(const k of SPELL_ORDER){const b=document.getElementById("sp_"+k);if(!b)continue;
    b.classList.toggle("low",P.mag.mp<SPELLS[k].mp);const r=Math.max(0,((SPCD[k]||0)-now)/SPCDMS(k));b.lastChild.style.background=r>0?`conic-gradient(rgba(0,0,0,.65) ${r*360}deg,transparent 0)`:"";}
  const hp=document.getElementById("hpFill");if(!hp)return;hp.style.width=Math.max(0,hero.hp/hero.maxHp*100)+"%";document.getElementById("hpNum").textContent=`${Math.max(0,Math.ceil(hero.hp))}/${hero.maxHp}`;
  document.getElementById("mpFill").style.width=(P.mag.mp/P.mag.max*100)+"%";document.getElementById("mpNum").textContent=`${Math.floor(P.mag.mp)}/${P.mag.max}`;
  document.getElementById("lvBadge").textContent="LV."+String(P.lv||1).padStart(2,"0");document.getElementById("xpFill").style.width=Math.min(100,(P.exp||0)/expNeed(P.lv||1)*100)+"%";
  document.getElementById("btnA").classList.toggle("charge",(hero.chargeT||0)>=CHARGE_T);};
// ---- player levels & EXP ----
const expNeed=lv=>Math.round(20*Math.pow(lv,1.5));
function gainExp(n,x,y){if(!P)return;P.lv=P.lv||1;P.exp=(P.exp||0)+n;if(x!=null)floatText(x,y-10,"+"+n+" EXP","#9cff7a");
  while(P.exp>=expNeed(P.lv)){P.exp-=expNeed(P.lv);P.lv++;if(P.lv%2===0)hero.maxHp=Math.min(20,hero.maxHp+1);hero.hp=hero.maxHp;if(P.mag){P.mag.max+=5;P.mag.mp=P.mag.max;}updateHearts();SFX.chime();toast("Level up! You are now level "+P.lv+".");burst(hero.x+6,hero.y+6,[255,240,140],30,1.6,2);}}
const _onKillX=onKill;onKill=function(e){_onKillX(e);try{const d=e.def||{};if(d.beh==="pea")return;gainExp(Math.max(2,Math.round((e.maxHp||2)*2+(d.rare||d.big?20:0)+(e.sp==="dragon"?80:0))),e.x+e.w/2,e.y);}catch(_){}};
const _tcjX=tryCompleteJobs;tryCompleteJobs=function(sid,n){const r=_tcjX(sid,n);if(r)gainExp(25*r);return r;};
const _gtiX=guildTurnIn;guildTurnIn=function(){const before=guild().done||0;const r=_gtiX.apply(this,arguments);const d=(guild().done||0)-before;if(d>0)gainExp(30*d);return r;};
// ---- sword: tap combos (existing) + hold-to-charge spin ----
const CHARGE_T=36;
function chargeTick(){if(!hero||hero.dead||room)return;const held=keys.KeyJ||keys.Space||touch.a;
  if(held&&!hero.boat&&!hero.swim){hero.chargeT=(hero.chargeT||0)+1;if(hero.chargeT===CHARGE_T){SFX.chime();burst(hero.x+6,hero.y+6,[255,230,140],12,1,2);}}
  else{if((hero.chargeT||0)>=CHARGE_T)spinAttack();hero.chargeT=0;}}
function spinAttack(){const cx=hero.x+6,cy=hero.y+6;hero.spinT=16;SFX.swing();shake=3;hitStop=4;
  for(const e of mobs){if(e.dead||(e.def&&e.def.beh==="pea"))continue;const d=Math.hypot(e.x+e.w/2-cx,e.y+e.h/2-cy);if(d>34+e.w/3)continue;e.iframes=0;const a=Math.atan2(e.y-cy,e.x-cx);
    if(e.sp==="dragon")hitDragon(e,a);else{hurtEnemy(e,swordDmg()+2,a,true);e.knockVx*=2;e.knockVy*=2;}}
  fx.push({k:"ring",x:cx,y:cy+2,r:4,max:36,life:18,col:[255,240,180]});burst(cx,cy,[255,240,180],20,2.4,2);}
const _updateMagicH=updateMagic;updateMagic=function(){_updateMagicH();chargeTick();if(hero.spinT>0){hero.spinT--;hero.dir=[0,2,3,1][Math.floor(hero.spinT/2)%4];}};
genWorld();genLairs();genCamps();placeCastle();finalizeTerrain();removeMountains();genCabins();genWalls();genProps();genCabinProps();markHalls();buildWorldMap();makeMiscSprites();resetHero();
loadImages().then(()=>{document.getElementById("startBtn").disabled=false;if(localStorage.getItem(SAVEKEY))document.getElementById("contBtn").style.display="inline-block";window.__READY=true;});
requestAnimationFrame(loop);
document.addEventListener("touchmove",e=>{if(e.target.closest("#touch"))e.preventDefault();},{passive:false});
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("sw.js").catch(()=>{});
// test / debug hooks
window.__BA={get hero(){return hero},get mobs(){return mobs},get npcs(){return npcs},get world(){return world},get P(){return P},SETS,ISLES,LAIRS,piers,waystones,buildings,
  tAt,T:()=>T,WW,TILE,DEEP,SHAL,hurtEnemy,forceEvent,saveGame,loadGame,newGame,spawnMob,spawnDragon,interact,talk,askDate,propose,giveGift,checkRank,coronation,achievements,
  advance:advanceMinutes,board,chunkCount:()=>chunkCache.size,closeMenu,RANKS,teleport:(tx,ty)=>{hero.x=tx*TILE+2;hero.y=ty*TILE+2;hero.boat=false;P.boarded=false;},
  castSpell,SPELLS,CABINS,buyHome,realEstate,homeStorage,travelHome,owns,enterBuilding:b=>enterBuilding(b),get room(){return room},roomInteract:()=>roomInteract(),showMenu,POIS,get hitStop(){return hitStop},WH,gainExp,spinAttack,expNeed,get projectiles(){return projectiles},get clashCount(){return clashCount},updateClashes,quests:()=>quests().map(q=>({id:q.j.id,kind:q.kind,ready:q.ready,color:q.ready?"green":"red",giver:q.giver&&q.giver.id,pos:q.pos,hall:q.hall})),questMarkerOf,takeJob,questLog,monLineup:()=>monLineup().toDataURL(),MONDEF,get curSpell(){return curSpell},set curSpell(v){curSpell=v},get fx(){return fx},startIntro,advanceIntro,endIntro,get state(){return state},get paused(){return paused},settlementAt,regionOf,elevAt,solidTile,LOOKOUTS:()=>LOOKOUTS,GATES:()=>GATES,passable:(x,y)=>{const t=tAt(x,y);return !solidTile(x,y)&&t!==DEEP;},isGate:(x,y)=>!!gateAt(x,y),WALLS:()=>WALLS,repairWalls:()=>{world.walls={};applyWalls();for(const g of GATES)g.hp=12;},wallR,gateClosed:g=>gateClosed(g),damageWall,wallRepairCheck,wallHp:i=>wallHp(i),partyMembers:()=>partyMembers(),inviteParty,get room(){return room},enterBuilding,roomNpcs:()=>roomNpcs(),doorLocked:b=>doorLocked(b),heroicDeed,guildMenu,genGuildJobs,guildTurnIn,guild:()=>guild(),hitDragon,craftGear,get RECIPES(){return RECIPES},swordDmg:()=>swordDmg(),chopCheck,get pickups(){return pickups},townTree,regrowTrees,STUMP:19,SAPLING:20,CLIFF,STAIRS,MTN,TREE};
})();
