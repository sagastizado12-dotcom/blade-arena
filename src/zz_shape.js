// Organic coasts, town walls, and winding roads. Runs once when the map is drawn.
let SHAPED=false;
function shapeLand(){
  if(SHAPED||typeof T==="undefined"||typeof fbm!=="function")return;
  SHAPED=true;
  const src=new Uint8Array(T),ev=new Uint8Array(ELEV),amp=22,CW=48;
  const gw=Math.ceil(WW/CW),gh=Math.ceil(WH/CW),fx=new Int16Array(gw*gh),fy=new Int16Array(gw*gh);
  for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const x=gx*CW,y=gy*CW;fx[gy*gw+gx]=(fbm(x,y,71)-0.5)*amp*2;fy[gy*gw+gx]=(fbm(x+140,y,72)-0.5)*amp*2;}
  const warp=(x,y)=>{const gx=x/CW,gy=y/CW,x0=gx|0,y0=gy|0,x1=x0+1<gw?x0+1:x0,y1=y0+1<gh?y0+1:y0,tx=gx-x0,ty=gy-y0;
    const a=y0*gw+x0,b=y0*gw+x1,c=y1*gw+x0,d=y1*gw+x1;
    return [x+((fx[a]*(1-tx)+fx[b]*tx)*(1-ty)+(fx[c]*(1-tx)+fx[d]*tx)*ty)|0, y+((fy[a]*(1-tx)+fy[b]*tx)*(1-ty)+(fy[c]*(1-tx)+fy[d]*tx)*ty)|0];};
  for(let y=2;y<WH-2;y+=2)for(let x=2;x<WW-2;x+=2){
    let p=warp(x,y),sx=p[0],sy=p[1];
    if(sx<1)sx=1;else if(sx>=WW-1)sx=WW-2;
    if(sy<1)sy=1;else if(sy>=WH-1)sy=WH-2;
    const t=src[sy*WW+sx],e=ev[sy*WW+sx],i=y*WW+x;
    T[i]=t;ELEV[i]=e;
    if(x+1<WW){T[i+1]=t;ELEV[i+1]=e;}
    if(y+1<WH){T[i+WW]=t;ELEV[i+WW]=e;if(x+1<WW){T[i+WW+1]=t;ELEV[i+WW+1]=e;}}
  }
  for(let i=0;i<T.length;i++){const t=T[i];if(t===ROAD||t===COBBLE||(typeof BRIDGE!=="undefined"&&t===BRIDGE))T[i]=GRASS;else if(t===PIER)T[i]=SHAL;}
  shapeRiver(480,0.02,0.007,28);shapeRiver(2400,0.016,0.006,20);shapeRiver(5600,0.012,0.008,24);
  for(const s of SETS){if(!s)continue;const R=Math.max(11,(s.r|0)*0.42),cx=s.x|0,cy=s.y|0,fill=s.demon?MUD:GRASS;
    for(let y=cy-R;y<=cy+R;y++)for(let x=cx-R;x<=cx+R;x++){if(x<2||y<2||x>=WW-2||y>=WH-2||Math.hypot(x-cx,y-cy)>R)continue;const i=y*WW+x,t=T[i];if(t===DEEP||t===SHAL||t===SAND)T[i]=fill;}}
  if(typeof kingdomPrep!=="undefined")kingdomPrep.sure=null;
  if(typeof KGRID!=="undefined")KGRID=null;
}
function shapeRiver(x0,a,b,amp){
  for(let y=4;y<WH-4;y++){
    const x=Math.round(x0+Math.sin(y*a)*amp+Math.sin(y*b)*amp*0.5);
    if(x<3||x>=WW-3)continue;
    const t=T[y*WW+x];
    if(t===DEEP&&y>120)break;
    for(let k=-2;k<=2;k++){const j=y*WW+x+k;const u=T[j];if(u===MTN||u===CLIFF||u===ROCK)continue;T[j]=Math.abs(k)<2?DEEP:SHAL;}
  }
}
function shapeCurve(a,b,bend,tile){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
  const px=-dy/len,py=dx/len,mx=(a.x+b.x)/2+px*bend,my=(a.y+b.y)/2+py*bend;
  const steps=Math.max(2,len|0);
  for(let i=0;i<=steps;i++){
    const t=i/steps,u=1-t;
    const x=Math.round(u*u*a.x+2*u*t*mx+t*t*b.x),y=Math.round(u*u*a.y+2*u*t*my+t*t*b.y);
    for(let k=0;k<2;k++){
      const xx=x+(Math.abs(dx)>Math.abs(dy)?0:k),yy=y+(Math.abs(dx)>Math.abs(dy)?k:0);
      if(xx<2||yy<2||xx>=WW-2||yy>=WH-2)continue;
      const j=yy*WW+xx;
      if(OCC[j]>0||OCC[j]===-2||OCC[j]===-3)continue;
      const cur=T[j];
      if(cur===DEEP||cur===SHAL)T[j]=typeof BRIDGE!=="undefined"?BRIDGE:PIER;
      else if(cur!==CLIFF&&cur!==MTN&&cur!==ROCK)T[j]=tile;
    }
  }
}
orgStreets=function(s){
  const cx=s.x|0,cy=s.y|0,R=s._orgR||16;
  for(let y=cy-4;y<=cy+3;y++)for(let x=cx-5;x<=cx+5;x++)orgPave(x,y);
  for(let y=cy-R;y<=cy+R;y++){const x=cx+Math.round(Math.sin((y-cy)*0.16)*2);orgPave(x,y);orgPave(x+1,y);}
  for(let x=cx-R;x<=cx+R;x++){const y=cy+Math.round(Math.sin((x-cx)*0.14)*2);orgPave(x,y);orgPave(x,y+1);}
};
function shapeWall(s){
  if(!s||typeof WALLS==="undefined")return;
  const big=!!(s.citystate||s.moderno||/capital/.test(s.kind||"")||(typeof tierOf==="function"&&tierOf(s)>=2));
  if(!big&&!/town/.test(s.kind||""))return;
  const cx=s.x|0,cy=s.y|0;let far=s._orgR||16;
  for(const b of buildings)if(b&&b.s===s.id&&!b.cabin)far=Math.max(far,Math.hypot(b.x+2-cx,b.y+2-cy)+4);
  const N=big?28:18,ring=[];
  for(let i=0;i<N;i++){const a=i/N*6.2832,rad=far+2+Math.round((fbm(cx+Math.cos(a)*40,cy+Math.sin(a)*40,44)-0.5)*2);
    ring.push([Math.round(cx+Math.cos(a)*rad),Math.round(cy+Math.sin(a)*rad*0.92)]);}
  const gateAt=new Set(),gates=[];
  for(const dir of [[0,-1,"N"],[0,1,"S"],[-1,0,"W"],[1,0,"E"]]){
    let best=0,bd=-1e9;for(let i=0;i<N;i++){const d=(ring[i][0]-cx)*dir[0]+(ring[i][1]-cy)*dir[1];if(d>bd){bd=d;best=i;}}
    const p=ring[best],q=ring[(best+1)%N];
    gateAt.add(p[0]+","+p[1]);gateAt.add(q[0]+","+q[1]);
    gates.push({s:s.id,d:dir[2],x:p[0],y:p[1],o:[dir[0],dir[1]],tiles:[[p[0],p[1]],[q[0],q[1]]],hp:12});
  }
  const plot=(x,y)=>{
    if(gateAt.has(x+","+y)||x<2||y<2||x>=WW-2||y>=WH-2)return;
    const i=y*WW+x;if(WALLIDX.has(i))return;const t=T[i];
    if(OCC[i]>0||OCC[i]===-2||t===COBBLE||t===ROAD)return;
    if(t===DEEP||t===SHAL)T[i]=s.demon?MUD:GRASS;
    const w={x,y,s:s.id,i:WALLS.length};WALLS.push(w);WALLIDX.set(i,w.i);OCC[i]=-3;
  };
  const line=(x0,y0,x1,y1)=>{
    let x=x0,y=y0,n=0,dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=Math.sign(x1-x0),sy=Math.sign(y1-y0),err=dx-dy;
    while(n++<500){plot(x,y);if(x===x1&&y===y1)break;const e2=err*2;if(e2>-dy){err-=dy;x+=sx;}if(e2<dx){err+=dx;y+=sy;}}
  };
  for(let i=0;i<N;i++)line(ring[i][0],ring[i][1],ring[(i+1)%N][0],ring[(i+1)%N][1]);
  for(let i=WALLS.length-1;i>=0;i--){const w=WALLS[i];if(w.s===s.id&&gateAt.has(w.x+","+w.y)){OCC[w.y*WW+w.x]=0;WALLIDX.delete(w.y*WW+w.x);WALLS.splice(i,1);}}
  for(let i=0;i<WALLS.length;i++){WALLS[i].i=i;WALLIDX.set(WALLS[i].y*WW+WALLS[i].x,i);}
  for(const g of gates){GATES.push(g);
    for(const [x,y] of g.tiles)for(let d=-2;d<=2;d++){
      const xx=x+g.o[1]*d,yy=y+g.o[0]*d;if(xx<2||yy<2||xx>=WW-2||yy>=WH-2)continue;
      const i=yy*WW+xx;if(T[i]!==DEEP&&T[i]!==SHAL)T[i]=COBBLE;if(OCC[i]===-3){OCC[i]=0;WALLIDX.delete(i);}
    }
    for(let k=0;k<=3;k++){const xx=g.x+g.o[0]*k,yy=g.y+g.o[1]*k;if(xx<2||yy<2||xx>=WW-2||yy>=WH-2)continue;const i=yy*WW+xx;if(T[i]!==DEEP&&T[i]!==SHAL)T[i]=COBBLE;if(OCC[i]===-3){OCC[i]=0;WALLIDX.delete(i);}}
    shapeCurve({x:cx,y:cy},{x:g.x,y:g.y},(fbm(g.x,g.y,8)-0.5)*10,COBBLE);}
  if(big)for(let i=0;i<N;i+=5)TOWERS.push({x:ring[i][0],y:ring[i][1],s:s.id,cd:0});
  s._wallStone=!!big;s._gates=gates;
}
function shapeRoads(){
  const towns=SETS.filter(s=>s&&s._gates&&s._gates.length);
  const parent=towns.map((_,i)=>i);
  const find=i=>{while(parent[i]!==i)i=parent[i]=parent[parent[i]];return i;};
  const cand=[];
  for(let i=0;i<towns.length;i++)for(let j=i+1;j<towns.length;j++)cand.push([Math.hypot(towns[i].x-towns[j].x,towns[i].y-towns[j].y),i,j]);
  cand.sort((a,b)=>a[0]-b[0]);
  const wet=(A,B)=>{let w=0,x=A.x|0,y=A.y|0,n=0;const ex=B.x|0,ey=B.y|0;while((x!==ex||y!==ey)&&n++<8000){if(x!==ex)x+=Math.sign(ex-x);else y+=Math.sign(ey-y);const t=tAt(x,y);if(t===DEEP||t===SHAL)w++;}return w;};
  let built=0;
  for(const [,i,j] of cand){if(find(i)===find(j))continue;if(wet(towns[i],towns[j])>22)continue;parent[find(i)]=find(j);
    const A=towns[i],B=towns[j];
    const ga=A._gates.slice().sort((p,q)=>Math.hypot(p.x-B.x,p.y-B.y)-Math.hypot(q.x-B.x,q.y-B.y))[0];
    const gb=B._gates.slice().sort((p,q)=>Math.hypot(p.x-A.x,p.y-A.y)-Math.hypot(q.x-A.x,q.y-A.y))[0];
    shapeCurve({x:ga.x+ga.o[0]*2,y:ga.y+ga.o[1]*2},{x:gb.x+gb.o[0]*2,y:gb.y+gb.o[1]*2},(fbm(A.x,B.y,9)-0.5)*Math.min(70,Math.hypot(A.x-B.x,A.y-B.y)*0.28),ROAD);
    built++;}
  window.__roadEdges=built;
  shapeTrim();
}
function shapeTrim(){
  const isR=i=>i>=0&&i<T.length&&(T[i]===ROAD||(typeof BRIDGE!=="undefined"&&T[i]===BRIDGE));
  const roads=[];for(let i=0;i<T.length;i++)if(isR(i))roads.push(i);
  const idx=new Map();roads.forEach((i,n)=>idx.set(i,n));
  const seen=new Uint8Array(roads.length),keep=new Uint8Array(roads.length);
  const dirs=[-1,1,-WW,WW];
  for(let s=0;s<roads.length;s++){
    if(seen[s])continue;const comp=[s];seen[s]=1;const gates=new Set();let pier=false;
    for(let q=0;q<comp.length;q++){const i=roads[comp[q]],x=i%WW;
      for(const d of dirs){if(d===-1&&x===0||d===1&&x===WW-1)continue;const n=idx.get(i+d);if(n==null||seen[n])continue;seen[n]=1;comp.push(n);}
      const xx=i%WW,yy=(i/WW)|0;
      if(T[i]===PIER||tAt(xx+1,yy)===PIER||tAt(xx,yy+1)===PIER)pier=true;
    }
    for(const s2 of SETS)if(s2&&s2._gates)for(const g of s2._gates)for(const id of comp){const i=roads[id];if(Math.abs(i%WW-g.x)<4&&Math.abs((i/WW|0)-g.y)<4)gates.add(s2.id);}
    if(gates.size>=2||(gates.size>=1&&pier))for(const id of comp)keep[id]=1;
  }
  let cut=0;
  for(let n=0;n<roads.length;n++)if(!keep[n]){const i=roads[n];T[i]=T[i]===(typeof BRIDGE!=="undefined"?BRIDGE:-1)?DEEP:GRASS;cut++;}
  window.__roadsCut=cut;window.__wallN=WALLS.length;
}
function shapeDoorPaths(){
  for(const b of buildings){if(!b||b.cabin)continue;const s=SETS[b.s];if(!s)continue;
    let x=b.x+1,y=b.y+(b.h||3),cx=s.x|0,cy=s.y|0;
    for(let n=0;n<28;n++){x+=Math.sign(cx-x);y+=Math.sign(cy-y);if(x<2||y<2||x>=WW-2||y>=WH-2)break;const t=T[y*WW+x];if(t===COBBLE||t===ROAD)break;orgPave(x,y);orgPave(x+1,y);}
  }
}
function shapeUntangle(){
  const seen=new Map();
  const free=(x,y)=>{for(let yy=y;yy<y+3;yy++)for(let xx=x;xx<x+4;xx++){if(!orgLand(xx,yy))return false;const o=OCC[yy*WW+xx];if(o>0)return false;const t=T[yy*WW+xx];if(t===ROAD||t===COBBLE)return false;}return true;};
  for(const b of buildings){if(!b||b.cabin)continue;
    let bad=false;for(let y=b.y;y<b.y+(b.h||3)&&!bad;y++)for(let x=b.x;x<b.x+(b.w||4);x++){if(x<0||y<0||x>=WW||y>=WH){bad=true;break;}const k=x+","+y;if(seen.has(k))bad=true;if(OCC[y*WW+x]!==b.id+1)bad=true;const t=T[y*WW+x];if(t===ROAD||t===COBBLE||t===DEEP||t===SHAL)bad=true;}
    if(bad){const s=SETS[b.s];let placed=false;if(s){for(let rad=4;rad<40&&!placed;rad+=3)for(let a=0;a<12&&!placed;a++){const x=(s.x+Math.cos(a)*rad)|0,y=(s.y+Math.sin(a)*rad)|0;if(free(x,y)){orgStamp(b,x,y);placed=true;}}}
      if(!placed)continue;}
    for(let y=b.y;y<b.y+3;y++)for(let x=b.x;x<b.x+4;x++)seen.set(x+","+y,b.id);
  }
}
function shapeSeed(){
  const keep=[];
  for(const b of buildings){if(b&&b.cabin)keep.push(b);else if(b){for(let y=b.y;y<b.y+(b.h||3);y++)for(let x=b.x;x<b.x+(b.w||4);x++){const i=y*WW+x;if(i>=0&&i<OCC.length&&OCC[i]===b.id+1)OCC[i]=0;}}}
  buildings.length=0;
  for(const b of keep){b.id=buildings.length;buildings.push(b);for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)OCC[y*WW+x]=b.id+1;}
  for(const s of SETS)if(s)s.bIdx=[];
  for(const s of SETS){if(!s||!orgIsTown(s))continue;
    const big=!!(s.citystate||s.moderno||/capital/.test(s.kind||"")||(typeof tierOf==="function"&&tierOf(s)>=2));
    const town=/town|capital/.test(s.kind||"");
    const kinds=big?["guild","church","inn","shop","shop","shop","shop","harbor","house","house","house","house","house","house","house","house","forsale","forsale","forsale","forsale"]
      :town?["inn","shop","shop","house","house","house","house","house","house","forsale","forsale"]
      :["inn","shop","house","house","house","forsale"];
    for(const k of kinds){if(k==="harbor"&&!(s.port||s.harbor||s.citystate||s.moderno))continue;
      const b={id:buildings.length,s:s.id,x:s.x|0,y:s.y|0,w:4,h:3,kind:k,price:k==="forsale"&&typeof cityPrice==="function"?cityPrice(s):0,dmg:0,burn:0};
      buildings.push(b);s.bIdx.push(b.id);}
  }
  if(typeof world!=="undefined"&&world)world.bld=buildings.map(()=>({dmg:0,burn:0}));
}
const _shapeOrg=organizeAll;
organizeAll=function(){
  try{shapeLand();shapeSeed();}catch(e){console.warn("shape",e);}
  const r=_shapeOrg.apply(this,arguments);
  try{
    shapeUntangle();shapeDoorPaths();
    for(const s of SETS)if(s&&orgIsTown(s))shapeWall(s);
    shapeRoads();
    for(let i=WALLS.length-1;i>=0;i--){const w=WALLS[i];const t=T[w.y*WW+w.x];if(t===COBBLE||t===ROAD){OCC[w.y*WW+w.x]=0;WALLIDX.delete(w.y*WW+w.x);WALLS.splice(i,1);}}
    window.__wallN=WALLS.length;
  }catch(e){console.warn("roads",e);}
  if(typeof chunkCache!=="undefined")chunkCache.clear();
  if(typeof MAP_SHEET!=="undefined")MAP_SHEET=null;
  if(typeof auditCities==="function"){try{window.__cityAudit=auditCities();}catch(e){}}
  return r;
};
if(typeof orgWallRing==="function")orgWallRing=function(){};
if(typeof orgRoadNet==="function")orgRoadNet=function(){};
if(typeof orgTrimRoads==="function")orgTrimRoads=function(){};
