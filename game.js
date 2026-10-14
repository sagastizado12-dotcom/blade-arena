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
    tryDismember(e, ang);
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
        if(!hero.dead)hurtHero(e.dmg, ang);
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
    if(aabb({x:p.x-p.r,y:p.y-p.r,w:p.r*2,h:p.r*2}, hero) && !hero.dead){
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
const WW=256, WH=192, PXW=WW*TILE, PXH=WH*TILE;
const DEEP=0,SHAL=1,SAND=2,GRASS=3,FOREST=4,TREE=5,ROCK=6,ROAD=7,RUIN=8,WALL=9,PIER=10,FLOWER=11,COBBLE=12,FARM=13,CAVE=14,BUSH=15,CLIFF=16,MTN=17,STAIRS=18;
const T=new Uint8Array(WW*WH), OCC=new Int16Array(WW*WH), ELEV=new Uint8Array(WW*WH);
const elevAt=(x,y)=>x<0||y<0||x>=WW||y>=WH?0:ELEV[y*WW+x];
const tAt=(x,y)=>x<0||y<0||x>=WW||y>=WH?DEEP:T[y*WW+x];
const SETS=[
 {id:0,name:"Aldmoor",kind:"town",x:92,y:96,r:9,roof:["#3d6fd6","#1d3a8a"],wall:"#f2e2c0",gem:"#7ff"},
 {id:1,name:"Saltmere",kind:"harbor town",x:160,y:100,r:9,roof:["#1fb5a8","#0b6460"],wall:"#fbf6ea",gem:"#9ff",harbor:true},
 {id:2,name:"Highcrest",kind:"town",x:76,y:40,r:9,roof:["#8a5cc8","#3f2470"],wall:"#cfc6bf",gem:"#f8f"},
 {id:3,name:"Fernhollow",kind:"village",x:38,y:84,r:7,roof:["#5fae3c","#2c5e1a"],wall:"#b98a55",gem:"#bf6"},
 {id:4,name:"Reedwick",kind:"village",x:86,y:146,r:7,roof:["#e8b23c","#9a6414"],wall:"#ead7a8",gem:"#fd6"},
 {id:5,name:"Coralcove",kind:"island village",x:218,y:44,r:6,roof:["#ff7a8a","#b0304a"],wall:"#f5dcb0",gem:"#f9c",island:true},
];
const ISLES=[{x:220,y:46,r:16,name:"Coral Isle"},{x:226,y:150,r:14,name:"Isle of Bones"},{x:242,y:100,r:10,name:"Stormcrag"}];
const RUINS={x:132,y:44}, ISLE_RUIN={x:226,y:150}, CAVE_POS={x:242,y:100}, DUNGEON={x:4,y:4,w:30,h:18};
const LAKE={x:58,y:120};
let buildings=[], objects=[], waystones=[], piers=[];
function genWorld(){
  for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){
    const dx=(x-92)/80,dy=(y-96)/86;
    let lv=1-Math.hypot(dx,dy)+(fbm(x,y,7)-0.5)*0.7;
    for(const I of ISLES){lv=Math.max(lv,1-Math.hypot(x-I.x,y-I.y)/I.r+(fbm(x,y,9)-0.5)*0.5);}
    for(const s of SETS){const d=Math.hypot(x-s.x,y-s.y);if(d<s.r+3)lv=Math.max(lv,0.4);}
    let t;
    if(lv<0)t=DEEP;else if(lv<0.07)t=SHAL;else if(lv<0.13)t=SAND;else{
      const e=fbm(x+300,y,3)+(y<70&&x<125?0.22:0)-(Math.hypot(x-92,y-96)<20?0.3:0);
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
    const d=Math.hypot((x-LAKE.x)/11,(y-LAKE.y)/7);
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
  road(SETS[0],SETS[1]);road(SETS[0],SETS[2]);road(SETS[0],SETS[3]);road(SETS[0],SETS[4]);road(SETS[2],{x:RUINS.x,y:RUINS.y+7});road({x:RUINS.x,y:SETS[2].y},{x:RUINS.x,y:RUINS.y});
  // settlements
  buildings=[];objects=[];waystones=[];piers=[];
  for(const s of SETS){
    const r=s.r;
    for(let y=s.y-r;y<=s.y+r;y++)for(let x=s.x-r;x<=s.x+r;x++){const i=y*WW+x;
      if(Math.hypot(x-s.x,y-s.y)<=r+0.5&&T[i]!==DEEP&&T[i]!==SHAL&&T[i]!==PIER&&((ELEV[i]=0)||1))T[i]=(Math.abs(x-s.x)<=3&&Math.abs(y-s.y)<=2)||x===s.x||x===s.x+1||y===s.y?COBBLE:GRASS;}
    const big=s.kind.includes("town");
    const slots=big?[[-8,-7,"inn"],[-3,-8,"shop"],[2,-7,"house"],[5,-3,"house"],[-8,3,"forsale"],[-3,4,"house"],[2,4,"house"],[-8,-2,"house"]]
                   :[[-6,-6,"inn"],[-1,-6,"shop"],[3,-4,"house"],[-6,2,"house"],[2,3,"house"]];
    if(s.harbor)slots[3]=[5,-3,"harbor"];
    if(s.id===2)slots.push([5,-8,"house"]);
    s.bIdx=[];
    for(const [ox,oy,k] of slots){const b={id:buildings.length,s:s.id,x:s.x+ox,y:s.y+oy,w:4,h:3,kind:k,dmg:0,burn:0};
      for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){T[y*WW+x]=COBBLE;OCC[y*WW+x]=b.id+1;}
      T[(b.y+b.h)*WW+b.x+1]=COBBLE;T[(b.y+b.h)*WW+b.x+2]=COBBLE;
      s.bIdx.push(b.id);buildings.push(b);}
    // farms
    if(!big){const fx=s.x+(s.id===4?-14:4),fy=s.y+(s.id===4?-2:-2);
      s.farm={x:s.x+5,y:s.y+3,w:4,h:3};
      for(let y=s.farm.y;y<s.farm.y+s.farm.h;y++)for(let x=s.farm.x;x<s.farm.x+s.farm.w;x++)if(!OCC[y*WW+x])T[y*WW+x]=FARM;}
    const ws={s:s.id,x:s.x-2,y:s.y-1,found:false};waystones.push(ws);OCC[ws.y*WW+ws.x]=-1;
    objects.push({type:"board",s:s.id,x:s.x+3,y:s.y-2});OCC[(s.y-2)*WW+s.x+3]=-1;
  }
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
  objects.push({type:"chest",id:"dungeon",x:DUNGEON.x+26,y:DUNGEON.y+3,loot:{gold:150,gem:3,tome:"meteor"}});
  objects.push({type:"chest",id:"ruins",x:RUINS.x+5,y:RUINS.y-3,loot:{gold:40,gem:1}});
  objects.push({type:"chest",id:"coral",x:ISLES[0].x-4,y:ISLES[0].y+9,loot:{gold:30,pearl:2}});
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
  const x0=Math.floor(e.x/TILE),y0=Math.floor(e.y/TILE),x1=Math.floor((e.x+e.w-0.01)/TILE),y1=Math.floor((e.y+e.h-0.01)/TILE);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const t=tAt(tx,ty);
    if(e===hero&&hero.boat){if(!isWater(t))return true;continue;}
    if(solidTile(tx,ty))return true;
    if(e!==hero&&t===DEEP&&!e.swims)return true;
    if(e!==hero&&t===CLIFF)return true;
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
const GCLASS={[MTN]:5,[GRASS]:1,[FLOWER]:1,[TREE]:1,[BUSH]:2,[FOREST]:2,[SAND]:3,[ROAD]:4,[ROCK]:5,[COBBLE]:6,[RUIN]:7,[FARM]:8};
function blendEdges(g,tx,ty,t,px0,py0){const my=GCLASS[t];if(!my)return;
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
const MAPCOL={16:"#5a5068",17:"#9a90a8",18:"#c8a878",0:"#1a5ac8",1:"#3ad0d8",2:"#f0d48a",3:"#5cbc40",4:"#2d7a2c",5:"#1e6a26",6:"#8a80a0",7:"#d8a868",8:"#b0a898",9:"#5a5268",10:"#a0703a",11:"#7ad050",12:"#e0d0b8",13:"#8a5a30",14:"#000",15:"#2f8a2a"};
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
// ===== LAIRS =====
const LAIRS=[{sp:"fire",x:104,y:22,name:"Ember Peak"},{sp:"frost",x:40,y:32,name:"Rime Crag"},{sp:"forest",x:24,y:104,name:"Elder Grove"},{sp:"storm",x:232,y:153,name:"Thunder Shoal"}];
function genLairs(){for(const L of LAIRS)for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++){const d=Math.hypot(x,y);if(d>5.3)continue;const i=(L.y+y)*WW+L.x+x;
  T[i]=d>4.6?(hash2(x,y,51)<0.5?ROCK:RUIN):RUIN;if(L.sp==="fire"||L.sp==="frost")ELEV[i]=3;}
  // castle site (built on coronation) north of Aldmoor
}
// ===== IMAGES =====
const IMG={};
const IMGNAMES=["scorchrat","thornback","umbrawl","voltusk","gloomote","fluffin","puffalo","mossnail","lilyleap","sprigling","pondhop","tidemaw","grovegiant","dragon_fire","dragon_frost","dragon_storm","dragon_forest"];
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
  const sign={inn:"INN",shop:"SHOP",harbor:"⚓ DOCK",forsale:b.owned?"HOME":"FOR SALE",castle:"♛"}[b.kind];
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
function spawnMob(sp,x,y,extra){
  const d=SPECIES[sp];let e;
  if(d.base){e=spawnEnemy(d.base,x,y);if(d.base!=="boss")e.hp=e.maxHp=d.hp;}
  else{e={type:sp,x,y,w:d.w||12,h:d.h||10,vx:0,vy:0,hp:d.hp,maxHp:d.hp,dir:0,frame:0,anim:0,state:"wander",timer:0,atkCd:0,iframes:0,knockT:0,knockVx:0,knockVy:0,parts:{},dead:false,flash:0,spd:d.spd||.5,dmg:d.rare?2:1};
    if(d.img)e.img=IMG[sp];}
  e.sp=sp;e.def=d;e.hx=x;e.hy=y;e.swims=!!d.swims;e.wt=0;e.wx=x;e.wy=y;
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
 potion:{n:"Potion",p:15},flowers:{n:"Bouquet",p:8,gift:2},ring:{n:"Engagement Ring",p:120},amulet:{n:"Lost Amulet",p:0},pie:{n:"Berry Pie",p:12,food:60,gift:2}};
const SHOP_ITEMS=["bread","potion","flowers","pie","ring"];
const NAMES=["Ada","Bram","Cora","Dain","Elsa","Finn","Greta","Hugo","Iris","Joss","Kira","Lio","Mara","Nils","Opal","Pip","Quinn","Rhea","Sol","Tova","Ulf","Vera","Wren","Yara","Zed","Brin","Cass","Dex","Edda","Fen","Gale","Hal","Ivo","Juna","Kai","Lark","Moss","Nell","Oren","Poppy"];
const ROLES_T=["leader","innkeeper","shopkeeper","guard","smith","fisher","farmer","child"];
const ROLES_V=["leader","innkeeper","shopkeeper","farmer","farmer","child"];
const LEADER={town:"Mayor",village:"Elder","harbor town":"Harbormaster","island village":"Chief"};
const RANKS=["Wanderer","Citizen","Landowner","Knight","Lord","Champion","King"];
let world, P, npcs=[], nextNpc=1;
function newWorld(){
  world={day:0,min:8*60,weather:"clear",wUntil:240,news:[],regions:[],events:[],wrecks:[],caravans:[],bandits:[],beasts:[],migr:[],opened:{},harvested:{},nextJobId:1,
    sets:SETS.map(s=>({id:s.id,price:1,stock:{bread:10,potion:4,flowers:5,pie:3,ring:1},crop:0,festival:0,merchant:0,raid:null,dmgLog:0,jobs:[],safety:1})),
    bld:buildings.map(b=>({dmg:0,burn:0})),castle:false,dragonsSlain:0};
  for(let i=0;i<48;i++)world.regions.push(0.6+Math.random()*0.5);
  P={gold:20,inv:{bread:2},hunger:80,house:-1,rent:-1,rentUntil:-1,spouse:0,dating:[],ach:{},rank:0,king:false,dec:{tax:0,patrol:0},isles:[],found:[],jobs:[],
    respawn:{x:SETS[0].x*TILE,y:(SETS[0].y+2)*TILE},boat:{owned:false,x:0,y:0},boarded:false,raidsDefended:0,beastsSlain:0,dungeon:false,kills:0,crowned:false};
  npcs=[];nextNpc=1;
  for(const s of SETS){const roles=s.kind.includes("town")?ROLES_T:ROLES_V;roles.forEach((r,i)=>makeNpc(s.id,r));}
  for(const a of npcs)for(const b of npcs)if(a!==b&&a.s===b.s)a.rel[b.id]=Math.floor(Math.random()*50);
  addNews(-1,"Welcome to the Realm of Ten Winds. Live as you like.");
}
function makeNpc(sid,role,age){
  const s=SETS[sid];const houses=s.bIdx.filter(b=>buildings[b].kind==="house");
  const n={id:nextNpc++,name:pick(NAMES),s:sid,role,age:age!=null?age:role==="child"?6+Math.floor(Math.random()*9):19+Math.floor(Math.random()*50),
    home:houses.length?houses[npcs.length%houses.length]:s.bIdx[0],friend:0,met:false,last:-1,rel:{},spouse:0,partner:0,look:Math.floor(Math.random()*1e6),alive:true,x:0,y:0,dir:0,frame:0,anim:0,inside:false,gift:-1};
  if(role==="innkeeper")n.work=s.bIdx.find(b=>buildings[b].kind==="inn");
  else if(role==="shopkeeper")n.work=s.bIdx.find(b=>buildings[b].kind==="shop");
  const d=doorOf(buildings[n.home]);n.x=d.x;n.y=d.y;npcs.push(n);return n;
}
const doorOf=b=>({x:(b.x+1.6)*TILE,y:(b.y+b.h)*TILE+3});
const title=n=>n.role==="leader"?LEADER[SETS[n.s].kind]+" ":"";
function addNews(sid,t){world.news.unshift({d:world.day,s:sid,t});if(world.news.length>40)world.news.pop();}
function absMin(){return world.day*1440+world.min;}
const season=()=>Math.floor(world.day/7)%4;
const hour=()=>Math.floor(world.min/60);
function regionOf(px,py){return clamp(Math.floor(py/TILE/32),0,5)*8+clamp(Math.floor(px/TILE/32),0,7);}
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
  const chance=0.09+(P.king&&P.dec.festival?0.02:0);
  if(Math.random()<chance)forceEvent();
}
function dailyTick(){
  const se=season();
  for(const s of world.sets){
    for(const k of SHOP_ITEMS){s.stock[k]=Math.min(k==="ring"?2:12,(s.stock[k]||0)+(k==="ring"?1:2));}
    s.price=clamp(s.price+(1-s.price)*0.2+(Math.random()-0.5)*0.14,0.6,1.8);
    if(se<2&&s.crop<4)s.crop++;
    if(se===2&&s.crop>=3){s.crop=0;s.stock.bread+=8;addNews(s.id,`${SETS[s.id].name} brought in the harvest. Bread is plentiful.`);}
    if(se===3)s.crop=0;
    if(s.festival===0&&Math.random()<0.04)startFestival(s.id);
  }
  world.bld.forEach(b=>{if(b.burn<=0&&b.dmg>0)b.dmg=Math.max(0,b.dmg-0.15);});
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
  for(const s of world.sets)genJobs(s);
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
  case "beast":{const sp=Math.random()<0.5?"grovegiant":"tidemaw";const p=findTile(sp==="tidemaw"?[SAND,SHAL]:[FOREST,GRASS],S.x,S.y,30);
    world.beasts.push({sp,x:p.x,y:p.y,until:absMin()+2880,spawned:false,dead:false});addNews(sid,`A rare ${sp} was sighted near ${S.name}!`);break;}
  case "shipwreck":{const p=findTile([SAND],S.x,S.y,40);world.wrecks.push({x:p.x,y:p.y,looted:false,id:"w"+absMin()});addNews(sid,`A ship ran aground near ${S.name}. Loot may wash ashore.`);break;}
  case "migration":{const p=findTile([GRASS],S.x,S.y,30);world.migr.push({x:p.x,y:p.y,sp:pick(["voltusk","puffalo"]),until:absMin()+720,spawned:false});
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
  if(defended){P.raidsDefended++;P.gold+=40;for(const n of npcs)if(n.s===s.id)n.friend=Math.min(100,n.friend+8);addNews(s.id,`A brave wanderer drove off the raiders at ${S.name}!`);toast("Raid defended! +40g, the town is grateful.");}
  else{for(let k=0;k<2;k++){const b=pick(S.bIdx);world.bld[b].dmg=Math.min(1,world.bld[b].dmg+0.3);}addNews(s.id,`Raiders sacked parts of ${S.name}. Repairs have begun.`);}
  s.raid=null;mobs=mobs.filter(m=>m.raidOf!==s.id);checkRank();}
function findTile(types,cx,cy,r){for(let k=0;k<400;k++){const x=cx+Math.floor((Math.random()-0.5)*2*r),y=cy+Math.floor((Math.random()-0.5)*2*r);
  if(types.includes(tAt(x,y))&&!OCC[y*WW+x]&&!settlementAt(x*TILE,y*TILE))return{x:x*TILE,y:y*TILE};}return{x:cx*TILE,y:(cy+cy%3+8)*TILE};}
// ---- jobs (optional side work) ----
function genJobs(s){s.jobs=s.jobs.filter(j=>!j.taken);while(s.jobs.length<2){const t=pick(["gather","hunt","fish","deliver"]);const id=world.nextJobId++;
  if(t==="gather")s.jobs.push({id,t,item:pick(["herb","berry"]),n:3,reward:20,s:s.id,text:"Gather 3 "});
  else if(t==="fish")s.jobs.push({id,t,item:"fish",n:2,reward:22,s:s.id,text:"Bring 2 "});
  else if(t==="hunt")s.jobs.push({id,t,n:4,have:0,reward:35,s:s.id,text:"Cull 4 monsters around "+SETS[s.id].name});
  else{let to=s.id;while(to===s.id)to=Math.floor(Math.random()*5);s.jobs.push({id,t,to,reward:30,s:s.id,text:"Deliver a parcel to "+SETS[to].name});}}}
function jobText(j){return j.t==="gather"||j.t==="fish"?j.text+ITEMS[j.item].n:j.text;}
function takeJob(j){if(P.jobs.length>=3){toast("You can hold 3 jobs at once.");return;}j.taken=true;P.jobs.push(j);toast("Job accepted: "+jobText(j));}
function tryCompleteJobs(sid){let done=0;for(const j of P.jobs.slice()){let ok=false;
  if((j.t==="gather"||j.t==="fish")&&j.s===sid&&(P.inv[j.item]||0)>=j.n){P.inv[j.item]-=j.n;ok=true;}
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
  ];
}
function checkRank(){const a={};for(const x of achievements())a[x.k]=x.ok;
  let r=0;if(a.home||P.rent>=0||a.friends)r=1;if(r>=1&&a.home)r=2;if(r>=2&&(a.raid||a.beast))r=3;if(r>=3&&a.wealth&&a.rep)r=4;if(r>=4&&a.dragon&&a.dungeon)r=5;
  if(r>=5&&a.isles&&a.leaders)r=P.crowned?6:5;if(P.crowned)r=6;
  if(r>P.rank){P.rank=r;SFX.chime();if(P.mag)P.mag.max=100+r*15;toast("New rank: "+RANKS[r]+"!");addNews(-1,`The realm whispers of a new ${RANKS[r]}.`);}
  P.canCrown=!P.crowned&&a.home&&a.raid&&a.beast&&a.wealth&&a.rep&&a.dragon&&a.dungeon&&a.isles&&a.leaders;
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
const SAVEKEY="realmTenWindsSave1";
function saveGame(){if(!hero||!world)return;try{
  const data={v:1,world,P,nextNpc,hero:{x:hero.x,y:hero.y,hp:hero.hp,maxHp:hero.maxHp},waystones:waystones.map(w=>w.found),
    npcs:npcs.map(n=>{const o={...n};delete o.inside;return o;}),T:Array.from(harvestedList())};
  localStorage.setItem(SAVEKEY,JSON.stringify(data));}catch(e){console.warn(e);}}
function harvestedList(){return Object.keys(world.harvested).map(Number);}
function loadGame(){const raw=localStorage.getItem(SAVEKEY);if(!raw)return false;try{const d=JSON.parse(raw);
  world=d.world;P=d.P;nextNpc=d.nextNpc;npcs=d.npcs;resetHero();Object.assign(hero,d.hero);d.waystones.forEach((f,i)=>{if(waystones[i])waystones[i].found=f;});
  for(const k of Object.keys(world.harvested)){const i=+k;T[i]=world.harvested[k].r;}
  magicInit();return true;}catch(e){console.warn(e);return false;}}
let castleObj=null;
function placeCastle(){if(castleObj)return;const cx=SETS[0].x-3,cy=SETS[0].y-17;castleObj={x:cx,y:cy,w:6,h:3};
  for(let y=cy-1;y<cy+5;y++)for(let x=cx-1;x<cx+7;x++){T[y*WW+x]=COBBLE;invalidateTile(x,y);}
  for(let y=cy;y<cy+3;y++)for(let x=cx;x<cx+6;x++)OCC[y*WW+x]=-2;
  for(let y=cy+3;y<SETS[0].y;y++){T[y*WW+SETS[0].x]=ROAD;invalidateTile(SETS[0].x,y);}}
// ===== HERO =====

function resetHero(){hero={x:SETS[0].x*TILE,y:(SETS[0].y+2)*TILE,w:12,h:12,vx:0,vy:0,dir:0,frame:0,anim:0,hp:6,maxHp:6,swinging:-1,swingT:0,iframes:0,knockT:0,knockVx:0,knockVy:0,dodgeT:0,dodgeCd:0,dead:false,stam:100,boat:false,shore:{x:0,y:0}};
  hero.shore={x:hero.x,y:hero.y};}
let atkPressed=false,dodgePressed=false,camX=0,camY=0,frameN=0,banner=null,curSet=null,paused=false;
function getMoveInput(){let mx=0,my=0;if(keys.ArrowLeft||keys.KeyA)mx-=1;if(keys.ArrowRight||keys.KeyD)mx+=1;if(keys.ArrowUp||keys.KeyW)my-=1;if(keys.ArrowDown||keys.KeyS)my+=1;
  if(touch.active){const l=Math.hypot(touch.dx,touch.dy);if(l>8){mx+=touch.dx/l;my+=touch.dy/l;}}const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l;}return{mx,my};}
function wantAttack(){const k=keys.KeyJ||keys.Space||touch.a||latch.KeyJ||latch.Space;latch.KeyJ=latch.Space=false;if(k&&!atkPressed){atkPressed=true;return true;}if(!k)atkPressed=false;return false;}
function wantDodge(){const k=keys.KeyK||touch.b||latch.KeyK;latch.KeyK=false;if(k&&!dodgePressed){dodgePressed=true;return true;}if(!k)dodgePressed=false;return false;}
function hurtHero(dmg,ang){if(hero.iframes>0||hero.dodgeT>0||hero.dead)return;SFX.hurt();hero.hp-=dmg;hero.iframes=40;hero.knockT=10;hero.knockVx=Math.cos(ang)*3;hero.knockVy=Math.sin(ang)*3;shake=6;
  spray(hero.x+6,hero.y+6,bloodOn?6:4,ang,1);updateHearts();if(hero.hp<=0){hero.dead=true;hero.hp=0;setTimeout(respawn,900);}}
function respawn(){const lost=Math.floor(P.gold*0.1);P.gold-=lost;hero.dead=false;hero.hp=hero.maxHp;hero.boat=false;P.boarded=false;hero.x=P.respawn.x;hero.y=P.respawn.y;hero.iframes=90;hero.stam=100;
  updateHearts();toast(`You wake up safely. Lost ${lost}g.`);}
const heroTile=()=>({tx:Math.floor((hero.x+6)/TILE),ty:Math.floor((hero.y+8)/TILE)});
function facingPoint(d){const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];return{x:hero.x+6+dx*d,y:hero.y+6+dy*d};}
function updateHero(){
  if(hero.dead)return;
  if(hero.iframes>0)hero.iframes--;if(hero.dodgeCd>0)hero.dodgeCd--;
  const {tx,ty}=heroTile();const t=tAt(tx,ty);const swim=!hero.boat&&t===DEEP;hero.swim=swim;
  if(hero.knockT>0){moveEntity(hero,hero.knockVx,hero.knockVy);hero.knockVx*=.8;hero.knockVy*=.8;hero.knockT--;return;}
  if(hero.dodgeT>0){moveEntity(hero,hero.knockVx,hero.knockVy);hero.dodgeT--;return;}
  if(hero.swinging>=0){hero.swingT++;if(hero.swingT%3===0)hero.swinging++;if(hero.swinging>4){hero.swinging=-1;hero.swingT=0;}
    else{const hb=swordHitbox();if(hb)for(const e of mobs){if(e.dead||e.iframes>0)continue;if(aabb(hb,e)){if(e.sp==="dragon")hitDragon(e,hb.ang);else hurtEnemy(e,1,hb.ang,true);}}}}
  // swimming stamina
  if(swim){hero.stam-=world.weather==="storm"?0.2:0.12;if(hero.stam<=0){hero.stam=100;hero.iframes=0;hurtHero(1,0);hero.knockT=0;if(!hero.dead){hero.x=hero.shore.x;hero.y=hero.shore.y;toast("Exhausted! You wash up on shore.");}return;}}
  else if(t!==CLIFF){hero.stam=Math.min(100,hero.stam+0.8);if(!hero.boat&&!isWater(t)&&t!==PIER){hero.shore.x=hero.x;hero.shore.y=hero.y;}}
  const {mx,my}=getMoveInput();
  if(!swim&&!hero.boat&&wantDodge()&&hero.dodgeCd<=0&&hero.swinging<0){const dx=mx||[0,-1,1,0][hero.dir],dy=my||[1,0,0,-1][hero.dir],l=Math.hypot(dx,dy)||1;
    hero.dodgeT=8;hero.dodgeCd=40;hero.iframes=Math.max(hero.iframes,12);hero.knockVx=dx/l*3.2;hero.knockVy=dy/l*3.2;
    for(let i=0;i<5;i++)particles.push({x:hero.x+6,y:hero.y+10,z:0,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,vz:.5,life:15,max:15,col:C.dust,size:2,kind:"spark"});return;}
  if(wantAttack()&&hero.swinging<0){if(!interact()&&!swim&&!hero.boat){hero.swinging=0;hero.swingT=0;SFX.swing();}}
  let spd=hero.boat?2.3:swim?0.75:(t===ROAD||t===COBBLE||t===STAIRS?1.35:1.15);
  if(t===CLIFF&&!hero.boat){if(my<0){spd=0.45;hero.stam-=0.35;hero.climb=true;if(hero.stam<=0){hero.stam=0;hero.knockT=14;hero.knockVx=0;hero.knockVy=2.2;hero.jumpT=14;toast("You lose your grip and slide down!");return;}}
    else if(my>0){spd=2.2;if(!hero.jumpT){hero.jumpT=16;}}}else hero.climb=false;
  if(hero.jumpT>0)hero.jumpT--;
  if(mx||my){
    if(hero.boat){const nx=hero.x+mx*spd,ny=hero.y+my*spd;const ntx=Math.floor((nx+6+mx*6)/TILE),nty=Math.floor((ny+8+my*6)/TILE);const nt=tAt(ntx,nty);
      if(!isWater(nt)&&!solidTile(ntx,nty)){disembark(ntx,nty);}else moveEntity(hero,mx*spd,my*spd);P.boat.x=hero.x-8;P.boat.y=hero.y-6;}
    else moveEntity(hero,mx*spd,my*spd);
    hero.anim++;if(hero.anim%6===0){hero.frame^=1;if(hero.frame){if(hero.boat){if(hero.anim%24===0)SFX.boat();}else if(swim)SFX.swim();else SFX.step(t);}}if(Math.abs(mx)>Math.abs(my))hero.dir=mx<0?1:2;else hero.dir=my<0?3:0;
    if(swim&&frameN%12===0)particles.push({x:hero.x+6,y:hero.y+10,z:0,vx:0,vy:0,vz:0,life:20,max:20,col:[220,240,255],size:2,kind:"spark"});
  }
  // cave / dungeon
  if(t===CAVE&&!hero.boat){if(tx<60){hero.x=CAVE_POS.x*TILE+2;hero.y=(CAVE_POS.y+1)*TILE+4;toast("You climb back out into the daylight.");}
    else{hero.x=(DUNGEON.x+2)*TILE+2;hero.y=(DUNGEON.y+DUNGEON.h-3)*TILE;toast("You descend into the Stormcrag depths...");enterDungeon();}}
  // isles discovered
  ISLES.forEach((I,i)=>{if(!P.isles.includes(i)&&Math.hypot(tx-I.x,ty-I.y)<I.r){P.isles.push(i);toast("Discovered "+I.name+"!");addNews(-1,"The wanderer set foot on "+I.name+".");checkRank();}});
}
function hitDragon(e,ang){if(e.iframes>0)return;e.hp-=1;e.iframes=12;e.flash=6;shake=4;spray(e.x+e.w/2,e.y+e.h/2,bloodOn?8:5,ang,1.5);addSplat(e.x+e.w/2,e.y+e.h/2);
  if(e.fly>0)return;const r=Math.random();const order=["wings","tail","horns"];for(const p of order)if(e.parts[p]&&r<0.18){severDragon(e,p,ang);break;}
  if(e.hp<=0){e.dead=true;e.flash=12;kills++;onKill(e);for(let i=0;i<20;i++)spray(e.x+e.w/2,e.y+e.h/2,2,Math.random()*7,1);}}
function disembark(tx,ty){hero.boat=false;P.boarded=false;hero.x=tx*TILE+2;hero.y=ty*TILE+2;toast("You step ashore. The boat waits here.");}
function board(){hero.boat=true;P.boarded=true;hero.x=P.boat.x+8;hero.y=P.boat.y+6;toast("All aboard! Sail the seas.");}
let dungeonSpawned=false;
function enterDungeon(){if(dungeonSpawned||P.dungeon)return;dungeonSpawned=true;const D=DUNGEON;
  for(let i=0;i<4;i++)spawnMob("gloomote",(D.x+8+i*4)*TILE,(D.y+8)*TILE,{persist:true,dun:true});
  spawnMob("boss",(D.x+22)*TILE,(D.y+5)*TILE,{persist:true,dun:true,dunBoss:true});}
function onKill(e){
  rigDeath(e,Math.atan2(e.y-hero.y,e.x-hero.x));
  const d=e.def||{};P.kills++;if(d.gold){const g=d.gold[0]+Math.floor(Math.random()*(d.gold[1]-d.gold[0]+1));P.gold+=g;floatText(e.x,e.y,"+"+g+"g","#ffe060");}
  if(d.drop&&Math.random()<(d.dropP||0.7)){P.inv[d.drop]=(P.inv[d.drop]||0)+1;floatText(e.x,e.y-8,"+"+ITEMS[d.drop].n,"#fff");}
  const r=regionOf(e.x,e.y);world.regions[r]=Math.max(0.1,world.regions[r]-0.03);
  for(const j of P.jobs)if(j.t==="hunt"&&d.beh!=="pea"&&d.beh!=="flee"&&Math.hypot(e.x/TILE-SETS[j.s].x,e.y/TILE-SETS[j.s].y)<60)j.have=(j.have||0)+1;
  if(d.rare){P.beastsSlain++;addNews(-1,`The rare ${e.sp} has been slain!`);const b=world.beasts.find(b=>b.mob===e.uid);if(b)b.dead=true;}
  if(e.sp==="dragon"){world.dragonsSlain++;addNews(-1,`${e.name} the dragon has fallen! Bards are already singing.`);toast(`You slew ${e.name}!`);const L=LAIRS.find(l=>l.sp===e.dk);if(L)world["lair_"+L.sp]=world.day+14;
    for(const s of world.sets)if(s.dragon&&s.dragon.k===e.dk)s.dragon=null;}
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
  for(const b of buildings){const d=doorOf(b);if(near(d.x+4,d.y-2,16)){buildingMenu(b);return true;}}
  if(castleObj&&near((castleObj.x+3)*TILE,(castleObj.y+3)*TILE,24)){castleMenu();return true;}
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
  if(ws.raid)L.push("Monsters are attacking! Please, drive them off!");
  if(ws.dragon)L.push(`The dragon ${DRAGONS[ws.dragon.k].name}! Run, or fight it if you dare!`);
  if(ws.festival)L.push(pick(["Isn't the festival wonderful? Try the pies!","Music, lanterns, dancing... I love festival days."]));
  const rec=world.news.filter(x=>x.d>=world.day-3&&x.s!==n.s&&x.s>=0);if(rec.length&&Math.random()<0.7)L.push("Did you hear? "+pick(rec).t);
  const loc=world.news.find(x=>x.s===n.s&&x.d>=world.day-4);if(loc)L.push("Around here: "+loc.t);
  const role={leader:[`${S.name} needs capable folk. Check the notice board for work.`,"I keep this place running. It isn't easy."],innkeeper:["A warm bed and a hot meal, always ready.","Travelers bring the best stories."],
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
  if(n.role==="leader"){btns.push({l:"Ask for work",f:()=>boardMenu(n.s)});

    if(n.s===4&&P.inv.amulet){btns.push({l:"Return the amulet",f:()=>{P.inv.amulet=0;P.gold+=120;n.friend=Math.min(100,n.friend+20);addNews(4,"The Reedwick heirloom amulet was returned!");showMenu(n.name,"My family's amulet! Bless you. Take this: 120 gold.",[{l:"OK"}]);}});}}
  if(tryCompleteJobs(n.s))lines.push("Thanks for the work you did for us!");
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
function priceOf(sid,k,sell){const ws=world.sets[sid];let p=ITEMS[k].p*ws.price;if(ws.festival&&ITEMS[k].food)p*=0.7;if(ws.raid)p*=1.2;return Math.max(1,Math.round(sell?p*0.5:p));}
function buildingMenu(b){const sid=b.s,ws=world.sets[sid],S=SETS[sid];
  if(world.bld[b.id].burn>0)return showMenu("Fire!","The building is ablaze! Press A nearby to help douse it.",[{l:"OK"}]);
  if(b.kind==="inn")return showMenu(S.name+" Inn","Rest restores health and passes the night. A meal fills you up.",[
    {l:`Rest (${priceOf(sid,"bread")*2}g)`,f:()=>{const c=priceOf(sid,"bread")*2;if(P.gold<c)return toast("Not enough gold.");P.gold-=c;sleep(b);}},
    {l:`Hot meal (${priceOf(sid,"bread")}g)`,f:()=>{const c=priceOf(sid,"bread");if(P.gold<c)return toast("Not enough gold.");P.gold-=c;P.hunger=Math.min(100,P.hunger+60);toast("Delicious!");}},
    {l:"Odd jobs",f:()=>boardMenu(sid)},{l:"Leave"}]);
  if(b.kind==="shop")return shopMenu(sid);
  if(b.kind==="harbor")return showMenu("Saltmere Harbor","Boats for sale, sturdy and swift. Dock at any pier.",[
    {l:P.boat.owned?"Return my boat to this pier":`Buy a boat (60g)`,f:()=>{if(!P.boat.owned){if(P.gold<60)return toast("Not enough gold.");P.gold-=60;P.boat.owned=true;toast("You bought a boat! It's docked at the pier.");}
      const p=piers[0];P.boat.x=p.bx-14;P.boat.y=p.by-18;hero.boat=false;saveGame();}},{l:"Leave"}]);
  if(b.kind==="forsale"){const mine=P.house===b.id||P.rent===b.id;
    const btn=[];if(mine)btn.push({l:"Sleep",f:()=>sleep(b)});
    if(P.house!==b.id)btn.push({l:"Buy house (250g)",f:()=>{if(P.gold<250)return toast("Not enough gold.");P.gold-=250;P.house=b.id;b.owned=true;P.rent=-1;const sp=npcs.find(n=>n.id===P.spouse);if(sp)sp.home=b.id;
      addNews(sid,"The wanderer bought a house in "+S.name+".");checkRank();saveGame();toast("This house is yours!");}});
    if(!mine)btn.push({l:"Rent (15g / 3 days)",f:()=>{if(P.gold<15)return toast("Not enough gold.");P.gold-=15;P.rent=b.id;P.rentUntil=world.day+3;checkRank();toast("Rented for 3 days.");}});
    btn.push({l:"Leave"});return showMenu(mine?"Your Home":"House for sale",mine?"Home sweet home.":"A cozy house with a hearth and a garden.",btn);}
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
  showMenu("Sell",`You have ${P.gold}g.`,ks.map(k=>({l:`${ITEMS[k].n} x${P.inv[k]}: ${priceOf(sid,k,true)}g`,f:()=>{P.inv[k]--;P.gold+=priceOf(sid,k,true);sellMenu(sid);}})).concat([{l:"Sell all loot",f:()=>{for(const k of ["pelt","trinket","horn","gem","pearl","scale","meat"]){while(P.inv[k]>0){P.inv[k]--;P.gold+=priceOf(sid,k,true);}}sellMenu(sid);}},{l:"Done"}]));}
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
function invMenu(){const ks=Object.keys(P.inv).filter(k=>P.inv[k]>0);showMenu("Satchel",(ks.map(k=>ITEMS[k].n+" x"+P.inv[k]).join("\n")||"Empty")+"\n\nJobs:\n"+(P.jobs.map(j=>"• "+jobText(j)+(j.t==="hunt"?` (${j.have||0}/${j.n})`:"")).join("\n")||"none"),[{l:"Eat",f:eatFood},{l:"Crown",f:crownMenu},{l:"Close"}]);}

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
    if(s.raid&&!s.raid.spawned&&nearP(cx,cy,700)){s.raid.spawned=true;for(let i=0;i<s.raid.n;i++)spawnMob(i%3===2?"charger":"goblin",cx+(Math.random()-.5)*200,cy+(Math.random()-.5)*160,{persist:true,raidOf:s.id,def:{...SPECIES.goblin,aggro:200}});}
    if(s.dragon&&!s.dragon.spawned&&nearP(cx,cy,700)){s.dragon.spawned=true;spawnDragon(s.dragon.k,cx+60,cy-80,{town:s.id});SFX.roar();}
    if(s.dragon&&absMin()>s.dragon.until){if(!s.dragon.spawned)addNews(s.id,`${DRAGONS[s.dragon.k].name} flew off from ${S.name}, leaving scorched roofs.`);s.dragon=null;}}
  world.bandits.forEach((b,i)=>{if(!b.spawned&&nearP(b.x,b.y,500)){b.spawned=true;for(let k=0;k<b.n;k++)spawnMob("goblin",b.x+k*14,b.y+(k%2)*14,{persist:true,bandit:i+1});}});
  for(const b of world.beasts)if(!b.spawned&&!b.dead&&nearP(b.x,b.y,500)){b.spawned=true;const m=spawnMob(b.sp,b.x,b.y,{persist:true});m.uid=uidN++;b.mob=m.uid;}
  for(const m of world.migr)if(!m.spawned&&nearP(m.x,m.y,500)){m.spawned=true;for(let k=0;k<6;k++)spawnMob(m.sp,m.x+k*20,m.y+(k%3)*16,{migr:1,mdx:0.4});}
  for(const L of LAIRS)if((world["lair_"+L.sp]||0)<=world.day&&!mobs.some(m=>m.lair===L.sp)&&nearP(L.x*TILE,L.y*TILE,420))spawnDragon(L.sp,L.x*TILE,L.y*TILE,{lair:L.sp});
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
  let mode=d.beh;if(mode==="neu"&&e.provoked)mode="agg";if(mode==="pea"&&e.provoked)mode="flee";
  const heroSafe=hero.dead||(hero.boat&&!e.swims);
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
  if(ws.raid||ws.dragon)return{...home,inside:true};
  if(h>=22||h<6)return{...home,inside:true};
  const spot=k=>({x:(S.x+((n.id*7+k*3)%7)-3)*TILE,y:(S.y+((n.id*5+k)%5)-2)*TILE});
  if(ws.festival&&h>=10)return spot(Math.floor(frameN/1200));
  if(h<11){if(n.work!=null)return doorOf(buildings[n.work]);if(n.role==="farmer"&&S.farm)return{x:(S.farm.x+n.id%4)*TILE,y:(S.farm.y+1)*TILE};return spot(1);}
  if(h<13){const inn=S.bIdx.find(b=>buildings[b].kind==="inn");return doorOf(buildings[inn]);}
  if(h<18){if(n.work!=null)return doorOf(buildings[n.work]);return spot(2+(h%3));}
  if(h<21)return spot(5);return home;}
function updateNpc(n){
  const t=npcTarget(n);const far=Math.hypot(n.x-hero.x,n.y-hero.y)>500;
  if(far){n.x=t.x;n.y=t.y;n.inside=!!t.inside;return;}
  const dx=t.x-n.x,dy=t.y-n.y,l=Math.hypot(dx,dy);
  if(l<3){n.inside=!!t.inside;return;}n.inside=false;
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
  if(state!=="play"||paused)return;frameN++;if(shake>0)shake--;
  simAcc++;if(simAcc>=20){simAcc=0;advanceMinutes(1);}
  if(fishing)updateFishing();else updateHero();updateMagic();
  if(++spawnT>=45){spawnT=0;spawnTick();regrow();maybeFlyer();}
  for(const e of mobs){const dd=Math.hypot(e.x-hero.x,e.y-hero.y);if(dd<450||e.sp==="dragon"&&dd<700)updateMob(e);}
  mobs=mobs.filter(e=>{if(e.dead){e.flash--;return e.flash>0;}const dd=Math.hypot(e.x-hero.x,e.y-hero.y);return e.persist?dd<1600:dd<700;});
  for(const n of npcs)if(n.alive)updateNpc(n);
  updateParticles();
  for(const f of flyers){f.x+=f.vx;f.y+=f.vy;f.life--;}flyers=flyers.filter(f=>f.life>0);
  for(const f of floats){f.life--;f.y-=0.3;}floats=floats.filter(f=>f.life>0);
  if(toasts.length){toasts[0].life--;if(toasts[0].life<=0){toasts.shift();document.getElementById("toasts").innerHTML=toasts.map(x=>`<div>${x.t}</div>`).join("");}}
  // ambient particles
  const {tx,ty}=heroTile();const b=biomeAt(tx,ty);const night=hour()>=20||hour()<5;
  if(b==="forest"&&Math.random()<0.15)particles.push({x:camX+Math.random()*W,y:camY-4,z:20,vx:0.3+Math.random()*.3,vy:0.4,vz:-0.05,life:200,max:200,col:hexRGB(LEAFC[season()][Math.random()<.5?0:1]),size:2,kind:"leaf"});
  if(night&&(b==="meadow"||b==="forest")&&Math.random()<0.12)particles.push({x:camX+Math.random()*W,y:camY+Math.random()*H,z:8,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,vz:.26,life:120,max:120,col:[230,255,120],size:1.5,kind:"fly"});
  if(world.weather==="snow"&&Math.random()<0.6)particles.push({x:camX+Math.random()*W,y:camY+Math.random()*H*0.2,z:30,vx:.2,vy:.6,vz:-.0,life:150,max:150,col:[255,255,255],size:1.5,kind:"snow"});
  const s=settlementAt(hero.x,hero.y);curSet=s;if(s&&s!==lastSet){banner={t:s.name,sub:s.kind+(world.sets[s.id].festival?" · Festival!":""),life:150};tryCompleteJobs(s.id);}lastSet=s;
  if(frameN%15===0){updateHud();drawMini();}
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
  if(!world){ctx.fillStyle="#0a0a12";ctx.fillRect(0,0,W,H);return;}
  if(tileSeason!==season()){tileSeason=season();TILESET=makeTiles(tileSeason);chunkCache.clear();}
  camX=clamp(hero.x+6-W/2,0,PXW-W);camY=clamp(hero.y+6-H/2,0,PXH-H);camX=Math.round(camX);camY=Math.round(camY);
  ctx.save();if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);ctx.translate(-camX,-camY);
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
  for(const w of world.wrecks)if(!w.looted&&vis(w.x,w.y,60))list.push({y:w.y+20,f:()=>ctx.drawImage(SPR2.wreck,w.x,w.y)});
  for(const c of world.caravans){const A=SETS[c.from],B=SETS[c.to];const x=(A.x+(B.x-A.x)*c.t)*16,y=(A.y+(B.y-A.y)*c.t)*16;if(vis(x,y,40))list.push({y:y+16,f:()=>ctx.drawImage(SPR2.cart,x,y)});}
  if(P.boat.owned&&!hero.boat&&vis(P.boat.x,P.boat.y,40))list.push({y:P.boat.y+20,f:()=>ctx.drawImage(SPR2.boat,Math.floor(P.boat.x),Math.floor(P.boat.y+Math.sin(frameN*.06)))});
  for(const n of npcs)if(n.alive&&!n.inside&&vis(n.x,n.y,30))list.push({y:n.y+16,f:()=>drawNpc(n)});
  for(const e of mobs)if(vis(e.x,e.y,90))list.push({y:e.y+e.h,f:()=>drawMob(e)});
  list.push({y:hero.y+12,f:drawHeroFull});
  list.sort((a,b)=>a.y-b.y);for(const it of list)it.f();drawCanopies();drawTorches();
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
  else if(buildings.some(b=>{const d=doorOf(b);return near(d.x+4,d.y-2,16);}))h="A: Enter";else if(waystones.some(w=>near(w.x*TILE+8,w.y*TILE+8,22)))h="A: Waystone";
  else if(objects.some(o=>near(o.x*TILE+8,o.y*TILE+8,22)))h=objects.find(o=>near(o.x*TILE+8,o.y*TILE+8,22)).type==="lookout"?"A: Look out":"A: Open";else if(tAt(heroTile().tx,heroTile().ty)===CLIFF)h="↑ Climb (stamina) · ↓ Jump down";return interactHint.c=h;}
function darkness(){const h=world.min/60;if(h>=21||h<4)return .6;if(h>=19)return (h-19)/2*.6;if(h<6)return (6-h)/2*.6;return 0;}
function drawBuilding(b){const s0=buildingSprite(b);const s={width:s0.lw,height:s0.lh};const x=b.x*16,y=(b.y+b.h)*16-s.height;ctx.drawImage(s0,x,y,s.width,s.height);const st=world.bld[b.id];
  if(st.dmg>0.05){ctx.globalAlpha=Math.min(.8,st.dmg);ctx.fillStyle="#1a0e0a";for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(x+8+hash2(b.id,i,1)*48,y+8+hash2(b.id,i,2)*40,6,4,0,0,7);ctx.fill();}
    ctx.strokeStyle="#3a2010";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+10,y+20);ctx.lineTo(x+24,y+30);ctx.moveTo(x+44,y+14);ctx.lineTo(x+54,y+26);ctx.stroke();ctx.lineWidth=1;ctx.globalAlpha=1;}
  if(darkness()>0.15){ctx.globalCompositeOperation="lighter";ctx.fillStyle=`rgba(255,200,100,${darkness()*.6})`;ctx.fillRect(x+8,y+s.height-22,10,9);ctx.fillRect(x+s.width-18,y+s.height-22,10,9);ctx.globalCompositeOperation="source-over";}}
// ===== START =====
function beginPlay(){state="play";document.getElementById("overlay").classList.add("hidden");document.getElementById("hudWrap").classList.remove("hidden");
  magicInit();updateSpellBtn();for(const s of world.sets)if(!s.jobs.length)genJobs(s);if(P.house>=0)buildings[P.house].owned=true;
  if(P.boarded){hero.boat=true;}updateHearts();updateHud();drawMini();checkRank();}
function newGame(){newWorld();resetHero();magicInit();P.boat.x=piers[0].bx-14;P.boat.y=piers[0].by-18;if(!localStorage.getItem("realmIntroSeen"))startIntro();else{hero.x=(castleObj.x+2.6)*TILE;hero.y=(castleObj.y+3.4)*TILE;beginPlay();toast("A new life begins. Go wherever you like!");saveGame();}}
document.getElementById("startBtn").addEventListener("click",()=>newGame());
document.getElementById("contBtn").addEventListener("click",()=>{if(loadGame())beginPlay();});
let last=performance.now(),acc=0;const STEP=1000/60;
function loop(now){audioUpdate();acc+=Math.min(100,now-last);last=now;while(acc>=STEP){update();acc-=STEP;}draw();requestAnimationFrame(loop);}
window.addEventListener("pagehide",saveGame);document.addEventListener("visibilitychange",()=>{if(document.hidden)saveGame();});
// init
genWorld();genLairs();placeCastle();finalizeTerrain();buildWorldMap();makeMiscSprites();resetHero();
loadImages().then(()=>{document.getElementById("startBtn").disabled=false;if(localStorage.getItem(SAVEKEY))document.getElementById("contBtn").style.display="inline-block";window.__READY=true;});
requestAnimationFrame(loop);
document.addEventListener("touchmove",e=>{if(e.target.closest("#touch"))e.preventDefault();},{passive:false});
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("sw.js").catch(()=>{});
// test / debug hooks
window.__BA={get hero(){return hero},get mobs(){return mobs},get npcs(){return npcs},get world(){return world},get P(){return P},SETS,ISLES,LAIRS,piers,waystones,buildings,
  tAt,T:()=>T,WW,TILE,DEEP,SHAL,hurtEnemy,forceEvent,saveGame,loadGame,newGame,spawnMob,spawnDragon,interact,talk,askDate,propose,giveGift,checkRank,coronation,achievements,
  advance:advanceMinutes,board,chunkCount:()=>chunkCache.size,closeMenu,RANKS,teleport:(tx,ty)=>{hero.x=tx*TILE+2;hero.y=ty*TILE+2;hero.boat=false;P.boarded=false;},
  castSpell,get curSpell(){return curSpell},set curSpell(v){curSpell=v},get fx(){return fx},startIntro,advanceIntro,endIntro,get state(){return state},get paused(){return paused},settlementAt,regionOf,elevAt,solidTile,LOOKOUTS:()=>LOOKOUTS,CLIFF,STAIRS,MTN,TREE};
// ===== MAGIC =====
const SPELLS={
 fireball:{n:"Fireball",ic:"🔥",mp:12,col:[255,120,30]},
 ice:{n:"Ice Lance",ic:"❄",mp:10,col:[150,230,255],rank:1},
 heal:{n:"Healing Light",ic:"✚",mp:20,col:[255,240,140]},
 dash:{n:"Wind Dash",ic:"🌀",mp:8,col:[180,255,200]},
 wall:{n:"Earth Wall",ic:"⛰",mp:18,col:[190,140,80],rank:2},
 chain:{n:"Lightning Chain",ic:"⚡",mp:22,col:[200,180,255],rank:3},
 blade:{n:"Enchanted Blade",ic:"🗡",mp:25,col:[255,90,220],rank:4},
 meteor:{n:"Meteor (Ultimate)",ic:"☄",mp:60,col:[255,80,40],tome:1},
};
const SPELL_ORDER=Object.keys(SPELLS);
let fx=[],walls=[],curSpell="fireball",castPressed=false;
function magicInit(){if(!P.mag)P.mag={mp:100,max:100,known:["fireball","heal","dash"],lv:{},xp:{},blade:0};}
function unlockSpells(){const m=P.mag;for(const k of SPELL_ORDER){const s=SPELLS[k];if(m.known.includes(k))continue;
  if(s.rank!=null&&P.rank>=s.rank){m.known.push(k);toast("New spell learned: "+s.n+"!");}}}
function learnTome(k){if(!P.mag.known.includes(k)){P.mag.known.push(k);toast("Tome read! Learned "+SPELLS[k].n+"!");}}
const spellLv=k=>1+Math.floor((P.mag.xp[k]||0)/8);
function wantCast(){const k=keys.KeyL||touch.c||latch.KeyL;latch.KeyL=false;if(k&&!castPressed){castPressed=true;return true;}if(!k)castPressed=false;return false;}
function spellHit(e,dmg,ang){if(e.dead)return;for(let i=0;i<dmg;i++){e.iframes=0;if(e.sp==="dragon"){e.fly=Math.min(e.fly,0)||e.fly;hitDragon(e,ang);}else hurtEnemy(e,1,ang,true);if(e.dead)break;}}
function burst(x,y,col,n,sp,size){for(let i=0;i<n;i++){const a=Math.random()*7,s=Math.random()*sp;particles.push({x,y,z:4+Math.random()*6,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:Math.random()*2,life:20+Math.random()*25,max:45,col:[clamp(col[0]+(Math.random()-.5)*60,0,255),clamp(col[1]+(Math.random()-.5)*60,0,255),clamp(col[2]+(Math.random()-.5)*60,0,255)],size:size||2,kind:"magic"});}}
function castSpell(k){
  if(hero)hero.castT=20;
  k=k||curSpell;const s=SPELLS[k],m=P.mag;if(!m.known.includes(k))return false;if(m.mp<s.mp){toast("Not enough mana.");return false;}
  m.mp-=s.mp;m.xp[k]=(m.xp[k]||0)+1;const lv=spellLv(k);if((m.xp[k])%8===0)toast(s.n+" reached level "+lv+"!");
  const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];const cx=hero.x+6,cy=hero.y+6;const ang=Math.atan2(dy,dx);
  // aim at nearest hostile if any
  let tgt=null,bd=200;for(const e of mobs)if(!e.dead&&e.def&&e.def.beh!=="pea"&&e.def.beh!=="flee"){const d=Math.hypot(e.x+e.w/2-cx,e.y+e.h/2-cy);if(d<bd){bd=d;tgt=e;}}
  const aim=tgt?Math.atan2(tgt.y+tgt.h/2-cy,tgt.x+tgt.w/2-cx):ang;
  switch(k){
  case "fireball":fx.push({k,x:cx,y:cy,vx:Math.cos(aim)*3.2,vy:Math.sin(aim)*3.2,life:70,dmg:2+Math.floor(lv/2),r:4+lv*.5});break;
  case "ice":fx.push({k,x:cx,y:cy,vx:Math.cos(aim)*5,vy:Math.sin(aim)*5,life:50,dmg:2+Math.floor(lv/3),pierce:true,hit:new Set(),ang:aim});break;
  case "heal":hero.hp=Math.min(hero.maxHp,hero.hp+2+Math.floor(lv/2));updateHearts();burst(cx,cy,s.col,40,1.5,2);fx.push({k:"ring",x:cx,y:cy,r:2,max:30,life:30,col:s.col});break;
  case "dash":{const l=Math.hypot(...[getMoveInput().mx||dx,getMoveInput().my||dy])||1;const mx=(getMoveInput().mx||dx)/l,my=(getMoveInput().my||dy)/l;
    hero.dodgeT=10+lv;hero.iframes=Math.max(hero.iframes,20);hero.knockVx=mx*5;hero.knockVy=my*5;for(let i=0;i<20;i++)particles.push({x:cx,y:cy,z:4,vx:-mx*Math.random()*3+(Math.random()-.5),vy:-my*Math.random()*3+(Math.random()-.5),vz:.3,life:25,max:25,col:s.col,size:2,kind:"magic"});
    for(const e of mobs)if(!e.dead&&Math.hypot(e.x-cx,e.y-cy)<40&&e.def.beh==="agg"){e.knockT=10;e.knockVx=mx*3;e.knockVy=my*3;}break;}
  case "wall":{for(let i=-2;i<=2;i++){const wx=cx+dx*26+(dy?i*12:0),wy=cy+dy*26+(dx?i*12:0);walls.push({x:wx-6,y:wy-6,w:12,h:12,life:300+lv*60});burst(wx,wy,s.col,8,1.5,3);}break;}
  case "chain":{let from={x:cx,y:cy},hit=new Set(),jumps=3+lv;const segs=[];
    for(let j=0;j<jumps;j++){let best=null,bd2=130;for(const e of mobs){if(e.dead||hit.has(e)||e.def.beh==="pea"||e.def.beh==="flee")continue;const d=Math.hypot(e.x+e.w/2-from.x,e.y+e.h/2-from.y);if(d<bd2){bd2=d;best=e;}}
      if(!best)break;hit.add(best);const to={x:best.x+best.w/2,y:best.y+best.h/2};segs.push([from,to]);spellHit(best,2+Math.floor(lv/3),Math.atan2(to.y-from.y,to.x-from.x));burst(to.x,to.y,s.col,10,2,2);from=to;}
    if(!segs.length)segs.push([{x:cx,y:cy},{x:cx+dx*60,y:cy+dy*60}]);fx.push({k:"bolt",segs,life:14});shake=4;break;}
  case "blade":m.blade=600+lv*120;burst(cx,cy,s.col,30,1.2,2);toast("Your blade blazes with arcane fire!");break;
  case "meteor":{const tx=tgt?tgt.x+tgt.w/2:cx+dx*80,ty=tgt?tgt.y+tgt.h/2:cy+dy*80;fx.push({k:"meteor",tx,ty,h:220,life:60,dmg:8+lv*2});break;}
  }
  SFX.spell(k);return true;
}
function updateMagic(){const m=P.mag;if(!m)return;
  m.mp=Math.min(m.max,m.mp+0.07+(curSet?0.05:0));if(m.blade>0)m.blade--;
  if(!hero.dead&&!hero.boat&&!fishing&&wantCast())castSpell();
  // enchanted blade combo: swings release arcane crescents
  if(m.blade>0&&hero.swinging===1&&hero.swingT===3){const dirs=[[0,1],[-1,0],[1,0],[0,-1]];const [dx,dy]=dirs[hero.dir];
    fx.push({k:"crescent",x:hero.x+6,y:hero.y+6,vx:dx*3.5,vy:dy*3.5,life:30,dmg:1+Math.floor(spellLv("blade")/2),pierce:true,hit:new Set(),ang:Math.atan2(dy,dx)});}
  for(const f of fx){f.life--;
    if(f.vx!=null){f.x+=f.vx;f.y+=f.vy;const col=SPELLS[f.k]?SPELLS[f.k].col:[255,90,220];
      if(frameN%2===0)particles.push({x:f.x,y:f.y,z:6,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,vz:.2,life:18,max:18,col,size:f.k==="fireball"?3:2,kind:"magic"});
      if(blocked(f.x-2,f.y-2,4,4)&&f.k!=="crescent"){f.life=0;burst(f.x,f.y,col,14,2,2);continue;}
      for(const e of mobs){if(e.dead||(f.hit&&f.hit.has(e)))continue;if(f.x>e.x-4&&f.x<e.x+e.w+4&&f.y>e.y-6&&f.y<e.y+e.h+4){
        if(f.k==="fireball"){for(const o of mobs)if(!o.dead&&Math.hypot(o.x+o.w/2-f.x,o.y+o.h/2-f.y)<26+f.r*2)spellHit(o,f.dmg,Math.atan2(o.y-f.y,o.x-f.x));burst(f.x,f.y,[255,140,40],40,3,3);shake=5;f.life=0;break;}
        f.hit.add(e);spellHit(e,f.dmg,f.ang);if(f.k==="ice"){e.knockT=0;e.slow=120;}burst(f.x,f.y,col,10,2,2);}}}
    if(f.k==="meteor"){f.h-=220/60;if(f.life<=0){for(const o of mobs)if(!o.dead&&Math.hypot(o.x+o.w/2-f.tx,o.y+o.h/2-f.ty)<70)spellHit(o,f.dmg,Math.atan2(o.y-f.ty,o.x-f.tx));
      SFX.explode();burst(f.tx,f.ty,[255,120,40],80,4,3);burst(f.tx,f.ty,[255,230,120],40,2.5,2);fx.push({k:"ring",x:f.tx,y:f.ty,r:4,max:70,life:30,col:[255,160,60]});shake=14;}}
    if(f.k==="ring")f.r+=(f.max-f.r)*0.15;}
  fx=fx.filter(f=>f.life>0);for(const w of walls)w.life--;walls=walls.filter(w=>w.life>0);
  // walls block projectiles and enemies
  for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];if(walls.some(w=>p.x>w.x&&p.x<w.x+w.w&&p.y>w.y&&p.y<w.y+w.h)){burst(p.x,p.y,[190,140,80],5,1,2);projectiles.splice(i,1);}}
}
function drawMagic(){
  for(const w of walls){ctx.globalAlpha=Math.min(1,w.life/30);ctx.fillStyle="#7a5a34";ctx.fillRect(w.x,w.y-6,w.w,w.h+6);ctx.fillStyle="#a8844e";ctx.fillRect(w.x,w.y-6,w.w,5);ctx.fillStyle="#6ad04a";ctx.fillRect(w.x,w.y-7,w.w,2);ctx.strokeStyle="#e8c060";ctx.strokeRect(w.x+.5,w.y-5.5,w.w-1,w.h+5);}ctx.globalAlpha=1;
  ctx.globalCompositeOperation="lighter";
  for(const f of fx){
    if(f.k==="fireball"){const g=ctx.createRadialGradient(f.x,f.y-6,1,f.x,f.y-6,f.r*2.5);g.addColorStop(0,"rgba(255,255,200,1)");g.addColorStop(.4,"rgba(255,140,30,.9)");g.addColorStop(1,"rgba(255,40,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y-6,f.r*2.5,0,7);ctx.fill();}
    else if(f.k==="ice"||f.k==="crescent"){ctx.save();ctx.translate(f.x,f.y-6);ctx.rotate(f.ang);ctx.fillStyle=f.k==="ice"?"rgba(170,240,255,.95)":"rgba(255,100,230,.85)";ctx.beginPath();
      if(f.k==="ice"){ctx.moveTo(10,0);ctx.lineTo(-8,-3);ctx.lineTo(-8,3);}else{ctx.arc(0,0,10,-1.2,1.2);ctx.arc(-4,0,8,1.2,-1.2,true);}ctx.fill();ctx.restore();}
    else if(f.k==="bolt"){ctx.strokeStyle=`rgba(210,190,255,${f.life/14})`;ctx.lineWidth=2.5;ctx.beginPath();for(const [a,b] of f.segs){ctx.moveTo(a.x,a.y-6);for(let i=1;i<=5;i++){const t=i/5;ctx.lineTo(a.x+(b.x-a.x)*t+(i<5?(Math.random()-.5)*10:0),a.y+(b.y-a.y)*t-6+(i<5?(Math.random()-.5)*10:0));}}ctx.stroke();ctx.lineWidth=1;}
    else if(f.k==="meteor"){const x=f.tx+f.h*.5,y=f.ty-f.h;const g=ctx.createRadialGradient(x,y,1,x,y,16);g.addColorStop(0,"#fff6c0");g.addColorStop(.5,"rgba(255,110,30,.9)");g.addColorStop(1,"rgba(255,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,16,0,7);ctx.fill();
      for(let i=0;i<3;i++)particles.push({x:x+Math.random()*6,y:y+Math.random()*6,z:0,vx:1,vy:-1.5,vz:0,life:15,max:15,col:[255,150,50],size:3,kind:"magic"});
      ctx.strokeStyle="rgba(255,80,40,.6)";ctx.beginPath();ctx.ellipse(f.tx,f.ty,70*(1-f.life/60)+10,30*(1-f.life/60)+5,0,0,7);ctx.stroke();}
    else if(f.k==="ring"){ctx.strokeStyle=`rgba(${f.col[0]},${f.col[1]},${f.col[2]},${f.life/30})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*.55,0,0,7);ctx.stroke();ctx.lineWidth=1;}
  }
  if(P.mag&&P.mag.blade>0){ctx.fillStyle=`rgba(255,90,220,${.25+.15*Math.sin(frameN*.3)})`;ctx.beginPath();ctx.arc(hero.x+6,hero.y+4,10,0,7);ctx.fill();}
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
  const n=parseInt(e.key);if(n>=1&&n<=8&&state==="play"){const k=SPELL_ORDER[n-1];if(P.mag.known.includes(k)){curSpell=k;updateSpellBtn();}}});
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
  if(t>30){ctx.save();ctx.globalAlpha=Math.min(1,(t-30)/40);ctx.drawImage(heroSprites[3][0],cx-12,cy-26,24,24);ctx.restore();}
}
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
  e.parts[part]=false;toast(e.name+"'s "+part+" severed!");SFX.roar();
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
function drawMob(e){if(e.dead&&e.flash<=0)return;if(e.sp==="dragon"){if(e.uid0==null)e.uid0=(Math.random()*999)|0;return drawDragon(e);}if(e.img)return drawImgMob(e);drawEnemy(e);}
// ---- hero / NPC animation ----
function drawNpc(n){const s=npcSprites(n)[n.frame];const child=n.age<15;const t=frameN+n.id*13;const mv=Math.abs(n.x-(n.px||n.x))+Math.abs(n.y-(n.py||n.y))>0.05;n.px=n.x;n.py=n.y;
  drawShadow(n.x+8,n.y+15,5,2);ctx.save();ctx.translate(Math.floor(n.x+8),Math.floor(n.y+16));if(n.dir===1)ctx.scale(-1,1);
  const sc=child?0.72:1;const bob=mv?-Math.abs(Math.sin(t*.25))*1.4:0;const br=mv?0:Math.sin(t*.05)*.025;ctx.scale(sc,sc*(1+br));ctx.rotate(mv?Math.sin(t*.25)*.05:0);ctx.drawImage(s,-8,-16+bob);ctx.restore();
  if(n.spouse===-1||P.dating.includes(n.id)){ctx.fillStyle="#ff6a9a";ctx.font="7px system-ui";ctx.textAlign="center";ctx.fillText("♥",n.x+8,n.y-(child?0:2)+Math.sin(t*.08));}
  if(n.role==="leader"){ctx.fillStyle="#ffd84a";ctx.fillRect(n.x+6,n.y-1,4,2);}}
function drawHeroFull(){const t=frameN;const mv=Math.abs(hero.x-(hero.px||hero.x))+Math.abs(hero.y-(hero.py||hero.y))>0.05;hero.px=hero.x;hero.py=hero.y;
  if(hero.castT>0)hero.castT--;
  if(hero.boat){ctx.save();ctx.translate(hero.x-8+14,hero.y-6+20);ctx.rotate(Math.sin(t*.05)*.05);ctx.drawImage(SPR2.boat,-14,-20+Math.sin(t*.08));ctx.restore();
    if(mv&&t%6===0)particles.push({x:hero.x+6,y:hero.y+14,z:0,vx:-(hero.x-hero.px)*.3,vy:0,vz:0,life:30,max:30,col:[230,250,255],size:2,kind:"spark"});}
  if(hero.dead)return;if(hero.iframes>0&&Math.floor(hero.iframes/3)%2===0)return;
  let spr=hero.swinging>=0?heroSprites[hero.dir]["s"+Math.min(hero.swinging,4)]:heroSprites[hero.dir][hero.frame];
  const clipH=hero.swim?10:hero.boat?13:99;
  if(!hero.boat&&!hero.swim)drawShadow(hero.x+6,hero.y+12,6,2.5);
  ctx.save();if(clipH<99){ctx.beginPath();ctx.rect(hero.x-8,hero.y-10,30,clipH+10);ctx.clip();}
  const bob=(hero.jumpT>0?-Math.sin(hero.jumpT/16*Math.PI)*6:0)+(hero.swim?Math.sin(t*.12)*1.2:mv?-Math.abs(Math.sin(t*.22))*1.5:0);const br=mv?0:Math.sin(t*.06)*.03;
  ctx.translate(Math.floor(hero.x+6),Math.floor(hero.y+12));ctx.scale(1,1+br-(hero.castT>0?-.06:0));ctx.rotate(mv&&!hero.swim?Math.sin(t*.22)*.04:0);
  ctx.drawImage(spr,-8,-16+bob-(hero.castT>0?2:0));ctx.restore();
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
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){if(tAt(x,y)!==TREE)continue;const v=Math.floor(hash2(x,y,5)*4);const sw=(wv+Math.sin(frameN*.04+x*.7+y*.3))*.9;
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
})();
