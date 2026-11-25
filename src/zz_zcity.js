// Crisp minimap, town dress, and walls that grow a segment at a time.
// Decor never occupies a tile. New wall segments skip roads, gates, and doors.

function fitMini(){
  if(typeof mini==="undefined"||!mini)return;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const cssW=mini.clientWidth||120,cssH=mini.clientHeight||90;
  const bw=Math.max(60,Math.round(cssW*dpr)),bh=Math.max(45,Math.round(cssH*dpr));
  if(mini.width!==bw||mini.height!==bh){mini.width=bw;mini.height=bh;}
  mini.style.imageRendering="pixelated";
  if(typeof mg!=="undefined")mg.imageSmoothingEnabled=false;
}
let MINI_BUF=null,MINI_CW=0,MINI_CH=0,MINI_CAN=null;
function paintCrispMini(x,y,tw,th){
  fitMini();
  const cols=Math.max(8,Math.round(tw)),rows=Math.max(6,Math.round(th));
  const dw=mini.width,dh=mini.height;
  const ppt=Math.max(1,Math.floor(Math.min(dw/cols,dh/rows)));
  const ox=((dw-ppt*cols)/2)|0,oy=((dh-ppt*rows)/2)|0;
  if(!MINI_CAN||MINI_CW!==cols||MINI_CH!==rows){
    MINI_CAN=document.createElement("canvas");MINI_CAN.width=cols;MINI_CAN.height=rows;
    MINI_BUF=MINI_CAN.getContext("2d").createImageData(cols,rows);
    MINI_CW=cols;MINI_CH=rows;
  }
  const d=MINI_BUF.data,x0=Math.floor(x),y0=Math.floor(y);
  const pal=(typeof MAPRGB!=="undefined")?MAPRGB:null;
  for(let yy=0;yy<rows;yy++){
    const ty=y0+yy;
    for(let xx=0;xx<cols;xx++){
      const tx=x0+xx,o=(yy*cols+xx)*4;
      let col;
      if(tx<0||ty<0||tx>=WW||ty>=WH)col=pal?pal[0]:[18,48,96];
      else{const t=T[ty*WW+tx];col=(pal&&pal[t])||[40,120,48];}
      d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255;
    }
  }
  const g=MINI_CAN.getContext("2d");g.putImageData(MINI_BUF,0,0);
  mg.imageSmoothingEnabled=false;
  mg.fillStyle="#123";mg.fillRect(0,0,dw,dh);
  mg.drawImage(MINI_CAN,ox,oy,cols*ppt,rows*ppt);
}
if(typeof blitMap==="function"){const _blitMini=blitMap;blitMap=function(g,x,y,w,h,dx,dy,dw,dh){
  if(g===mg){try{paintCrispMini(x,y,w,h);}catch(e){return _blitMini.apply(this,arguments);}return;}
  return _blitMini.apply(this,arguments);
};}
if(typeof blitBorders==="function"){const _bbMini=blitBorders;blitBorders=function(g){if(g===mg)return;return _bbMini.apply(this,arguments);};}
if(typeof drawMini==="function"){const _dmFit=drawMini;drawMini=function(){fitMini();return _dmFit.apply(this,arguments);};}

function dressTowns(){
  if(typeof PROPS==="undefined"||typeof SETS==="undefined")return;
  const occ=new Set();for(const p of PROPS)if(p)occ.add(p.x+","+p.y);
  const put=(type,x,y)=>{
    x|=0;y|=0;if(x<2||y<2||x>=WW-2||y>=WH-2||occ.has(x+","+y))return false;
    const i=y*WW+x,t=T[i];
    if(OCC[i]||t===ROAD||t===COBBLE||t===DEEP||t===SHAL||t===WALL||t===CLIFF)return false;
    if(typeof SOLID_T!=="undefined"&&SOLID_T.has(t))return false;
    occ.add(x+","+y);PROPS.push({type,x,y,deco:1});return true;
  };
  for(const s of SETS){
    if(!s||s.x<2)continue;
    const town=/town|capital|village/.test(s.kind||"")||s.citystate||s.moderno;
    if(!town)continue;
    put("well",(s.x|0)+3,(s.y|0)+2);
    put("lantern",(s.x|0)-2,(s.y|0)+3);
    put("garden",(s.x|0)+2,(s.y|0)-2);
    let n=0;const cap=(s.citystate||/capital/.test(s.kind||""))?16:8;
    for(const id of s.bIdx||[]){
      if(n>=cap)break;const b=buildings[id];if(!b||b.x<2||b.cabin)continue;
      const doorY=(b.y+(b.h||3))|0;
      if(b.kind==="shop"||b.kind==="inn"){put("lantern",b.x-1,doorY);put("garden",b.x+(b.w||4),doorY);n++;}
      else if(b.kind==="church"){put("garden",b.x-1,doorY);put("lantern",b.x+(b.w||4),doorY);put("garden",b.x+1,b.y-1);n++;}
      else if(b.kind==="guild"){put("lantern",b.x-1,doorY);put("lantern",b.x+(b.w||4),doorY);n++;}
      else if(b.kind==="house"||b.kind==="forsale"){
        if((b.id%3)!==2)put("garden",b.x+1,doorY);
        if((b.id%4)===0)put("fence2",b.x,doorY);
        if((b.id%5)===1)put("lantern",b.x+(b.w||4),b.y+1);
        n++;
      }
    }
  }
}

function growBig(s){return !!(s&&(s.citystate||s.moderno||/capital/.test(s.kind||"")||(typeof tierOf==="function"&&tierOf(s)>=2)));}
function growBlocked(x,y){
  if(x<2||y<2||x>=WW-2||y>=WH-2)return true;
  const i=y*WW+x,t=T[i];
  if(t===ROAD||t===COBBLE||t===DEEP||t===SHAL||t===PIER||t===BRIDGE)return true;
  if(OCC[i]>0||OCC[i]===-2)return true;
  return false;
}
function growReindex(){
  if(typeof WALLIDX!=="undefined")WALLIDX.clear();
  for(let i=0;i<WALLS.length;i++){const w=WALLS[i];w.i=i;if(typeof WALLIDX!=="undefined")WALLIDX.set(w.y*WW+w.x,i);}
  if(typeof drawWallsList==="function")drawWallsList.bins=null;
}
function growPlace(s,p,stone){
  if(!p||growBlocked(p.x,p.y))return false;
  const i=p.y*WW+p.x;
  if(typeof WALLIDX!=="undefined"&&WALLIDX.has(i)){const w=WALLS[WALLIDX.get(i)];if(w&&stone)w.stone=1;return true;}
  const w={x:p.x,y:p.y,s:s.id,i:WALLS.length,stone:stone?1:0};
  WALLS.push(w);if(typeof WALLIDX!=="undefined")WALLIDX.set(i,w.i);if(OCC[i]===0)OCC[i]=-3;
  if(typeof drawWallsList==="function")drawWallsList.bins=null;
  return true;
}
function growCapture(){
  if(typeof WALLS==="undefined"||typeof SETS==="undefined")return;
  for(const s of SETS){
    if(!s)continue;
    const mine=WALLS.filter(w=>w&&w.s===s.id);
    if(mine.length<8)continue;
    mine.sort((a,b)=>Math.atan2(a.y-s.y,a.x-s.x)-Math.atan2(b.y-s.y,b.x-s.x));
    s._plan=mine.map(w=>({x:w.x,y:w.y}));
    s._growBig=growBig(s);
    if(s._growBig){s._built=s._plan.length;s._stone=s._plan.length;for(const w of mine)w.stone=1;continue;}
    const start=Math.max(6,Math.floor(mine.length*0.32));
    s._built=start;s._stone=0;
    const drop=new Set(mine.slice(start).map(w=>w.y*WW+w.x));
    for(let i=WALLS.length-1;i>=0;i--){const w=WALLS[i];if(!w||w.s!==s.id)continue;const i2=w.y*WW+w.x;if(!drop.has(i2))continue;if(OCC[i2]===-3)OCC[i2]=0;WALLS.splice(i,1);}
  }
  growReindex();
  if(world&&world.wallProg)growRead();
}
function growStep(s){
  if(!s||!s._plan)return;
  if(s._built<s._plan.length){const p=s._plan[s._built++];growPlace(s,p,false);return;}
  if(s._stone<s._plan.length){const p=s._plan[s._stone++];const id=typeof WALLIDX!=="undefined"?WALLIDX.get(p.y*WW+p.x):-1;const w=id!=null&&WALLS[id];if(w)w.stone=1;}
}
function growWrite(){
  if(!world)return;const o={};
  for(const s of SETS)if(s&&s._plan)o[s.id]=[s._built|0,s._stone|0];
  world.wallProg=o;
}
function growRead(){
  const o=world&&world.wallProg;if(!o||typeof SETS==="undefined")return;
  for(const s of SETS){
    if(!s||!s._plan||!o[s.id])continue;
    const wantN=o[s.id][0]|0,wantS=o[s.id][1]|0;
    let guard=0;
    while(s._built<wantN&&s._built<s._plan.length&&guard++<400)growStep(s);
    while(s._stone<wantS&&s._stone<s._built&&s._stone<s._plan.length&&guard++<800){
      const p=s._plan[s._stone++];const id=typeof WALLIDX!=="undefined"?WALLIDX.get(p.y*WW+p.x):-1;const w=id!=null&&WALLS[id];if(w)w.stone=1;
    }
  }
  if(typeof drawWallsList==="function")drawWallsList.bins=null;
}
function growHot(s){
  const ws=world&&world.sets&&world.sets[s.id];
  if(ws&&(ws.raid||ws.dragon))return 3;
  if(world.wars&&world.wars.some(w=>w&&!w.over&&s.king!=null&&(w.a===s.king||w.b===s.king)))return 2;
  if((world.day%4)===(s.id%4))return 1;
  return 0;
}
function growDay(){
  if(!world)return;
  for(const s of SETS){
    if(!s||!s._plan)continue;
    if(s._built>=s._plan.length&&s._stone>=s._plan.length)continue;
    const n=growHot(s);for(let k=0;k<n;k++)growStep(s);
  }
  growWrite();
}
if(typeof buildWorldMap==="function"){const _growB=buildWorldMap;buildWorldMap=function(){const r=_growB.apply(this,arguments);try{if(!growCapture.ran){growCapture();dressTowns();growCapture.ran=1;}}catch(e){console.warn("grow",e);}return r;};}
if(typeof saveGame==="function"){const _growS=saveGame;saveGame=function(){try{growWrite();}catch(e){}return _growS.apply(this,arguments);};}
if(typeof loadGame==="function"){const _growL=loadGame;loadGame=function(){const r=_growL.apply(this,arguments);try{if(r)growRead();}catch(e){}return r;};}
if(typeof dailyTick==="function"){const _growD=dailyTick;dailyTick=function(){const r=_growD.apply(this,arguments);try{growDay();}catch(e){}return r;};}

function drawWork(s,p){
  const x=p.x*16,y=p.y*16;
  ctx.save();ctx.strokeStyle="#7a5228";ctx.lineWidth=1;
  ctx.strokeRect(x-2,y-16,20,26);
  ctx.beginPath();ctx.moveTo(x-2,y-16);ctx.lineTo(x+18,y+10);ctx.moveTo(x+18,y-16);ctx.lineTo(x-2,y+10);ctx.stroke();
  ctx.fillStyle="#e8c060";ctx.fillRect(x+16,y-22,2,8);ctx.fillRect(x+14,y-22,6,2);
  const ax=s.x*16+8,ay=s.y*16+8,bx=x+6,by=y+8;
  const walk=((frameN+s.id*17)%180)/180;
  const px=ax+(bx-ax)*walk,py=ay+(by-ay)*walk;
  if(typeof drawChibi==="function"&&typeof chibiLook==="function"){
    drawChibi(chibiLook(s.id*9+1,"guard","human"),bx-8,by,(frameN>>3)&1,(frameN>>3)&1);
    drawChibi(chibiLook(s.id*5+4,"farmer","human"),bx+10,by+2,1,(frameN>>4)&1);
    drawChibi(chibiLook(s.id*3+7,"farmer","human"),px,py,bx<ax?1:0,1);
  }
  ctx.fillStyle="#d8d4e0";ctx.fillRect(bx-2,by-12+((frameN>>3)&1)*3,6,2);ctx.fillStyle="#6a4224";ctx.fillRect(bx,by-10,2,6);
  ctx.restore();
}
if(typeof drawWallsList==="function"){const _growW=drawWallsList;drawWallsList=function(list,vis){_growW.apply(this,arguments);try{
  if(!vis||typeof SETS==="undefined")return;
  for(const s of SETS){
    if(!s||!s._plan||(s._built>=s._plan.length&&s._stone>=s._plan.length))continue;
    const idx=s._built<s._plan.length?s._built:Math.min(s._stone,s._plan.length-1);
    const p=s._plan[Math.max(0,Math.min(idx,s._plan.length-1))];
    if(!p||!vis(p.x*16,p.y*16,100))continue;
    list.push({y:p.y*16+22,f:()=>drawWork(s,p)});
  }
}catch(e){}};}
if(typeof drawCapCastle==="function"){const _pal=drawCapCastle;drawCapCastle=function(c){_pal.apply(this,arguments);try{
  const x=c.x*16,y=(c.y+(c.h||3))*16;
  ctx.fillStyle="#3a7a32";ctx.fillRect(x-8,y-6,10,4);ctx.fillRect(x+86,y-6,10,4);
  ctx.fillStyle="#ff5a7a";ctx.fillRect(x-6,y-8,2,2);ctx.fillRect(x+90,y-8,2,2);
  ctx.fillStyle="#e8c060";ctx.fillRect(x+20,y-78,2,14);ctx.fillRect(x+22,y-76,7,4);
  ctx.fillStyle="#c8483a";ctx.fillRect(x+70,y-78,2,14);ctx.fillRect(x+62,y-76,8,4);
}catch(e){}};}
window.__grow={step:growStep,sites:function(){const o=[];for(const s of SETS)if(s&&s._plan)o.push({name:s.name,built:s._built,stone:s._stone,n:s._plan.length,big:!!s._growBig});return o;}};
