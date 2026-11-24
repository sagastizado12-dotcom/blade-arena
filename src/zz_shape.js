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
  shapeCleanCoast();
  for(const s of SETS)if(s&&(s.citystate||s.moderno||s.island))shapeIsle(s.x|0,s.y|0,s.citystate||s.moderno?96:48);
  shapeWilds();
  if(typeof kingdomPrep!=="undefined")kingdomPrep.sure=null;
  if(typeof KGRID!=="undefined")KGRID=null;
}
function shapeCleanCoast(){
  const water=t=>t===DEEP||t===SHAL;
  const src=new Uint8Array(T);
  for(let y=2;y<WH-2;y++)for(let x=2;x<WW-2;x++){
    const i=y*WW+x,t=src[i],wet=water(t);
    let wn=0;
    if(water(src[i-1]))wn++;if(water(src[i+1]))wn++;if(water(src[i-WW]))wn++;if(water(src[i+WW]))wn++;
    if(!wet&&wn>=3)T[i]=DEEP;
    else if(wet&&wn<=1)T[i]=GRASS;
  }
  for(let y=2;y<WH-2;y++)for(let x=2;x<WW-2;x++){
    const i=y*WW+x,t=T[i];
    if(t===DEEP||t===SHAL||t===SAND)continue;
    if(t===MTN||t===CLIFF||t===ROCK||t===WALL)continue;
    const wet=T[i-1]===DEEP||T[i+1]===DEEP||T[i-WW]===DEEP||T[i+WW]===DEEP||T[i-1]===SHAL||T[i+1]===SHAL||T[i-WW]===SHAL||T[i+WW]===SHAL;
    if(wet)T[i]=SAND;
  }
  for(let y=2;y<WH-2;y++)for(let x=2;x<WW-2;x++){
    const i=y*WW+x;
    if(T[i]!==SHAL)continue;
    const land=T[i-1]===SAND||T[i+1]===SAND||T[i-WW]===SAND||T[i+WW]===SAND||T[i-1]===GRASS||T[i+1]===GRASS||T[i-WW]===GRASS||T[i+WW]===GRASS;
    if(!land)T[i]=DEEP;
  }
}
function shapeIsle(cx,cy,rad){
  const x0=Math.max(2,cx-rad-8),x1=Math.min(WW-3,cx+rad+8),y0=Math.max(2,cy-rad-8),y1=Math.min(WH-3,cy+rad+8);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const n=fbm(x,y,18),d=Math.hypot((x-cx)/(rad*1.05),(y-cy)/(rad*0.86));
    if(d>0.9+(n-0.5)*0.42)continue;
    const i=y*WW+x;
    if(d>0.78){if(T[i]===DEEP||T[i]===SHAL||T[i]===SAND)T[i]=SAND;continue;}
    let t=GRASS;const f=fbm(x+30,y,21),e=fbm(x,y+80,22);
    if(e>0.74&&e<0.86&&d<0.62){t=MTN;ELEV[i]=e>0.82?2:1;}
    else if(f>0.6)t=f>0.74?TREE:FOREST;
    else if(f<0.24&&d<0.5&&d>0.18)t=DEEP;
    if(t!==DEEP&&T[i]!==MTN)ELEV[i]=t===MTN?ELEV[i]:0;
    T[i]=t;
  }
}
function shapeWilds(){
  for(let y=4;y<WH-4;y+=4)for(let x=4;x<WW-4;x+=4){
    const i=y*WW+x,t=T[i];
    if(t!==GRASS&&t!==FLOWER&&t!==FOREST&&t!==SAND)continue;
    let town=false;
    for(const s of SETS)if(s&&Math.abs(x-s.x)<s.r+10&&Math.abs(y-s.y)<s.r+10){town=true;break;}
    if(town)continue;
    const f=fbm(x,y,23),e=fbm(x+220,y,24);
    let nt=t;
    if(e>0.76&&e<0.84){nt=MTN;ELEV[i]=1;}
    else if(f>0.64)nt=f>0.76?TREE:FOREST;
    else if(f<0.2)nt=DEEP;
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){const j=(y+dy)*WW+x+dx;if(T[j]===GRASS||T[j]===FLOWER||T[j]===SAND||T[j]===FOREST){T[j]=nt;if(nt===MTN)ELEV[j]=1;}}
  }
}
function shapeRiver(x0,a,b,amp){
  for(let y=4;y<WH-4;y++){
    const x=Math.round(x0+Math.sin(y*a)*amp+Math.sin(y*b)*amp*0.5);
    if(x<3||x>=WW-3)continue;
    const t=T[y*WW+x];
    if(t===DEEP&&y>120)break;
    for(let k=-3;k<=3;k++){const j=y*WW+x+k;const u=T[j];if(u===MTN||u===CLIFF||u===ROCK)continue;T[j]=Math.abs(k)<2?DEEP:Math.abs(k)<3?SHAL:SHAL;}
  }
}
function shapeDisk(x,y,tile,rad){
  const r2=rad*rad;
  for(let yy=Math.round(y-rad);yy<=Math.round(y+rad);yy++)for(let xx=Math.round(x-rad);xx<=Math.round(x+rad);xx++){
    const dx=xx-x,dy=yy-y;if(dx*dx+dy*dy>r2)continue;
    if(xx<2||yy<2||xx>=WW-2||yy>=WH-2)continue;
    const j=yy*WW+xx;
    if(OCC[j]>0||OCC[j]===-2||OCC[j]===-3)continue;
    const cur=T[j];
    if(cur===DEEP||cur===SHAL){if(tile===ROAD||tile===COBBLE)T[j]=typeof BRIDGE!=="undefined"?BRIDGE:PIER;}
    else if(cur!==CLIFF&&cur!==MTN&&cur!==ROCK&&cur!==WALL)T[j]=tile;
  }
}
function shapeCurve(a,b,bend,tile,rad){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
  const px=-dy/len,py=dx/len,mx=(a.x+b.x)/2+px*bend,my=(a.y+b.y)/2+py*bend;
  const steps=Math.max(4,len*2|0),wide=rad||(tile===ROAD?2.15:1.7);
  for(let i=0;i<=steps;i++){
    const t=i/steps,u=1-t;
    shapeDisk(u*u*a.x+2*u*t*mx+t*t*b.x,u*u*a.y+2*u*t*my+t*t*b.y,tile,wide);
  }
}
orgStreets=function(s){
  const cx=s.x|0,cy=s.y|0,R=s._orgR||16;
  shapeCurve({x:cx-R,y:cy},{x:cx+R,y:cy},6,COBBLE,1.8);
  shapeCurve({x:cx,y:cy-R},{x:cx,y:cy+R},-5,COBBLE,1.8);
  for(let y=cy-3;y<=cy+3;y++)for(let x=cx-4;x<=cx+4;x++)orgPave(x,y);
};
function shapeWall(s){
  if(!s||typeof WALLS==="undefined")return;
  const big=!!(s.citystate||s.moderno||/capital/.test(s.kind||"")||(typeof tierOf==="function"&&tierOf(s)>=2));
  if(!big&&!/town/.test(s.kind||""))return;
  const cx=s.x|0,cy=s.y|0;let far=s._orgR||16;
  for(const b of buildings)if(b&&b.s===s.id&&!b.cabin&&b.x>2&&b.y>2)far=Math.max(far,Math.hypot(b.x+2-cx,b.y+2-cy)+4);
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
    shapeCurve({x:b.x+1.5,y:b.y+(b.h||3)+0.5},{x:s.x,y:s.y},((b.x+b.y)%5)-2,COBBLE,1.15);}
}
function shapeBig(s){return !!(s&&(s.citystate||s.moderno||/capital/.test(s.kind||"")||(typeof tierOf==="function"&&tierOf(s)>=2)||(typeof orgBig==="function"&&orgBig(s))));}
function shapePack(){
  for(const s of SETS){if(!s||!orgIsTown(s))continue;
    const big=shapeBig(s),town=/town|capital/.test(s.kind||"");
    const cx=s.x|0,cy=s.y|0;
    const blocks=[];
    if(typeof orgManor==="function"&&(s.moderno||s.name==="Moderno")){const m=orgManor();if(m)blocks.push(m);}
    if(typeof CASTLES!=="undefined")for(const c of CASTLES)if(c&&c.s===s.id)blocks.push({x:c.x-1,y:c.y-1,w:(c.w||6)+2,h:(c.h||3)+2});
    if(s.id===0&&typeof castleObj!=="undefined"&&castleObj)blocks.push({x:castleObj.x-1,y:castleObj.y-1,w:(castleObj.w||6)+2,h:(castleObj.h||3)+2});
    const spots=[];
    const cols=big?4:town?3:2,rows=big?3:town?2:1;
    for(let j=-rows;j<=rows;j++)for(let i=-cols;i<=cols;i++){
      if(i===0||j===0)continue;
      const x=cx+i*5-2,y=cy+j*5-1;
      if(x<2||y<2||x>=WW-6||y>=WH-6)continue;
      if(blocks.some(b=>x<b.x+b.w&&x+4>b.x&&y<b.y+b.h&&y+4>b.y))continue;
      spots.push({x,y});
    }
    const mine=buildings.filter(b=>b&&b.s===s.id&&!b.cabin);
    while(mine.length<spots.length){
      const b={id:buildings.length,s:s.id,x:cx,y:cy,w:4,h:3,kind:"house",price:0,dmg:0,burn:0};
      buildings.push(b);mine.push(b);if(s.bIdx)s.bIdx.push(b.id);
    }
    const kinds=big?["guild","church","inn","shop","shop","shop","shop","forsale","forsale","forsale","forsale"]
      :town?["inn","shop","shop","forsale","forsale"]:["inn","shop","forsale"];
    for(let i=0;i<kinds.length&&i<mine.length;i++){mine[i].kind=kinds[i];if(kinds[i]==="forsale"&&typeof cityPrice==="function")mine[i].price=cityPrice(s);if(kinds[i]==="guild")mine[i].hall=1;}
    spots.sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));
    const use=Math.min(mine.length,spots.length);
    for(let n=0;n<use;n++)orgStamp(mine[n],spots[n].x,spots[n].y);
    for(let n=use;n<mine.length;n++)mine[n].spare=1;
    for(let n=0;n<use;n++){const b=mine[n];shapeCurve({x:b.x+1.5,y:b.y+3.2},{x:cx,y:b.y+3.2},0,COBBLE,0.8);}
    const reach=(Math.max(cols,rows)+1)*5;
    shapeCurve({x:cx-reach,y:cy},{x:cx+reach,y:cy},1.4,COBBLE,1.55);
    shapeCurve({x:cx,y:cy-reach},{x:cx,y:cy+reach},-1.2,COBBLE,1.55);
    for(const p of spots)shapeDisk(p.x+1.5,p.y+3.4,COBBLE,1.05);
  }
  const keep=[];
  for(const b of buildings){
    if(b&&b.spare){for(let y=b.y;y<b.y+(b.h||3);y++)for(let x=b.x;x<b.x+(b.w||4);x++){const i=y*WW+x;if(i>=0&&i<OCC.length&&OCC[i]===b.id+1)OCC[i]=0;}continue;}
    keep.push(b);
  }
  buildings.length=0;
  for(const b of keep){b.id=buildings.length;buildings.push(b);}
  for(let i=0;i<OCC.length;i++)if(OCC[i]>0)OCC[i]=0;
  for(const b of buildings){if(!b||b.x<2||b.y<2)continue;for(let y=b.y;y<b.y+(b.h||3);y++)for(let x=b.x;x<b.x+(b.w||4);x++){if(x>=0&&y>=0&&x<WW&&y<WH)OCC[y*WW+x]=b.id+1;}}
  for(const s of SETS)if(s)s.bIdx=buildings.filter(b=>b.s===s.id).map(b=>b.id);
  for(const b of buildings){if(!b||b.cabin)continue;for(let y=b.y;y<b.y+(b.h||3);y++)for(let x=b.x;x<b.x+(b.w||4);x++){const i=y*WW+x;if(i<0||i>=T.length)continue;if(T[i]===COBBLE||T[i]===ROAD)T[i]=SETS[b.s]&&SETS[b.s].demon?MUD:GRASS;}}
  if(typeof world!=="undefined"&&world)world.bld=buildings.map(()=>({dmg:0,burn:0}));
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
    const kinds=big?["guild","church","inn","shop","shop","shop","shop","harbor","forsale","forsale","forsale","forsale"].concat(Array(36).fill("house"))
      :town?["inn","shop","shop","forsale","forsale"].concat(Array(14).fill("house"))
      :["inn","shop","forsale"].concat(Array(6).fill("house"));
    for(const k of kinds){if(k==="harbor"&&!(s.port||s.harbor||s.citystate||s.moderno))continue;
      const b={id:buildings.length,s:s.id,x:s.x|0,y:s.y|0,w:4,h:3,kind:k,price:k==="forsale"&&typeof cityPrice==="function"?cityPrice(s):0,dmg:0,burn:0};
      buildings.push(b);s.bIdx.push(b.id);}
  }
  if(typeof world!=="undefined"&&world)world.bld=buildings.map(()=>({dmg:0,burn:0}));
}
let SHAPE_DONE=false;
const _shapeOrg=organizeAll;
organizeAll=function(){
  if(SHAPE_DONE)return window.__cityAudit;
  try{shapeLand();shapeSeed();}catch(e){console.warn("shape",e);}
  const r=_shapeOrg.apply(this,arguments);
  try{
    shapePack();
    for(const s of SETS)if(s&&orgIsTown(s))shapeWall(s);
    shapeRoads();
    for(let i=WALLS.length-1;i>=0;i--){const w=WALLS[i];const t=T[w.y*WW+w.x];if(t===COBBLE||t===ROAD){OCC[w.y*WW+w.x]=0;WALLIDX.delete(w.y*WW+w.x);WALLS.splice(i,1);}}
    for(const s of SETS)if(s&&s._gates)for(const g of s._gates)for(let k=-1;k<=6;k++)for(let d=-3;d<=3;d++){
      const x=g.x+g.o[0]*k+(g.o[1]?d:0),y=g.y+g.o[1]*k+(g.o[0]?d:0);
      if(x<2||y<2||x>=WW-2||y>=WH-2)continue;
      const i=y*WW+x;if(OCC[i]===-3){OCC[i]=0;WALLIDX.delete(i);}
      const t=T[i];if(t!==DEEP&&t!==SHAL&&t!==MTN&&OCC[i]<=0)T[i]=COBBLE;
    }
    let opened=0,skipped=0;
    for(const b of buildings){if(!b||b.cabin||b.spare||b.x<2)continue;for(const dx of [1,2]){const x=(b.x+dx)|0,y=(b.y+(b.h||3))|0;if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const i=y*WW+x;const o=OCC[i];
      if(o>0){const ob=buildings[o-1];if(ob&&ob!==b&&x>=ob.x&&x<ob.x+(ob.w||4)&&y>=ob.y&&y<ob.y+(ob.h||3)){skipped++;continue;}}
      if(o===-3&&typeof WALLIDX!=="undefined")WALLIDX.delete(i);OCC[i]=0;if(T[i]!==DEEP&&T[i]!==SHAL)T[i]=COBBLE;opened++;}}
    for(let i=WALLS.length-1;i>=0;i--){const w=WALLS[i];const i2=w.y*WW+w.x;if(T[i2]===COBBLE||T[i2]===ROAD||OCC[i2]!==-3){if(OCC[i2]===-3)OCC[i2]=0;if(typeof WALLIDX!=="undefined")WALLIDX.delete(i2);WALLS.splice(i,1);}}
    for(let i=0;i<WALLS.length;i++)WALLS[i].i=i;
    let bad=0,ex=null;
    for(const b of buildings){if(!b||b.cabin||b.x<2)continue;const x=(b.x+1)|0,y=(b.y+(b.h||3))|0;if(typeof solidTile==="function"&&(solidTile(x,y)||solidTile(x+1,y))){bad++;if(!ex)ex={x,y,t:T[y*WW+x],o:OCC[y*WW+x],t2:T[y*WW+x+1],o2:OCC[y*WW+x+1],id:b.id};}}
    window.__wallN=WALLS.length;window.__doors={opened,skipped,bad,ex};
    shapeOpenGates();
  }catch(e){console.warn("roads",e);}
  if(typeof chunkCache!=="undefined")chunkCache.clear();
  if(typeof MAP_SHEET!=="undefined")MAP_SHEET=null;
  if(typeof auditCities==="function"){try{window.__cityAudit=auditCities();}catch(e){}}
  SHAPE_DONE=true;
  return r;
};
buildKGrid=function(){
  const gw=Math.ceil(WW/KG),gh=Math.ceil(WH/KG);KGRID=new Uint8Array(gw*gh);
  const mark=new Uint8Array(gw*gh);
  for(let y=2;y<WH-2;y+=8)for(let x=2;x<WW-2;x+=8){
    const t=T[y*WW+x];
    const river=(t===DEEP||t===SHAL)&&(T[y*WW+x+4]>SHAL||T[(y+4)*WW+x]>SHAL);
    const ridge=ELEV[y*WW+x]>=2;
    if(!river&&!ridge)continue;
    const gx=x/KG|0,gy=y/KG|0;if(gx>=0&&gy>=0&&gx<gw&&gy<gh)mark[gy*gw+gx]=river?1:2;
  }
  for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){
    let tx=gx*KG+4,ty=gy*KG+4;
    let bx=0,by=0,bd=99;
    for(let oy=-5;oy<=5;oy++)for(let ox=-5;ox<=5;ox++){
      const xx=gx+ox,yy=gy+oy;if(xx<0||yy<0||xx>=gw||yy>=gh||!mark[yy*gw+xx])continue;
      const d=Math.abs(ox)+Math.abs(oy);if(d&&d<bd){bd=d;bx=ox;by=oy;}
    }
    if(bd<99){tx-=Math.sign(bx)*18;ty-=Math.sign(by)*18;}
    const wx=Math.round((fbm(tx,ty,61)-0.5)*130),wy=Math.round((fbm(tx+90,ty,62)-0.5)*130);
    let k=kingdomAt(tx+wx,ty+wy);
    if(k<0||k>255)k=0;KGRID[gy*gw+gx]=k;
  }
};
function shapeGateTiles(g){const out=[];for(let k=-2;k<=8;k++)for(let d=-1;d<=1;d++)out.push([g.x+g.o[0]*k+g.o[1]*d,g.y+g.o[1]*k+g.o[0]*d]);return out;}
function shapeHitsMouth(b,mouth){for(let y=b.y;y<b.y+(b.h||3);y++)for(let x=b.x;x<b.x+(b.w||4);x++)for(const [tx,ty] of mouth)if(x===tx&&y===ty)return true;return false;}
function shapeHitsBuilding(b,self){for(const o of buildings){if(!o||o===self||o.x<2)continue;if(b.x<o.x+(o.w||4)&&b.x+(b.w||4)>o.x&&b.y<o.y+(o.h||3)&&b.y+(b.h||3)>o.y)return true;}return false;}
function shapeOpenGates(){
  if(typeof SETS==="undefined"||typeof OCC==="undefined")return;
  for(const s of SETS)if(s&&s._gates)for(const g of s._gates){
    const mouth=shapeGateTiles(g);const ids=new Set();
    for(const [x,y] of mouth){if(x<0||y<0||x>=WW||y>=WH)continue;const o=OCC[y*WW+x];if(o>0)ids.add(o-1);}
    for(const id of ids){const b=buildings[id];if(!b)continue;
      for(let n=0;n<14&&shapeHitsMouth(b,mouth);n++){const ox=b.x,oy=b.y;b.x-=g.o[0];b.y-=g.o[1];if(b.x<2||b.y<2||shapeHitsBuilding(b,b)){b.x=ox-g.o[1];b.y=oy-g.o[0];if(shapeHitsBuilding(b,b)){b.x=ox;b.y=oy;break;}}}}
  }
  const doorBad=b=>{const y=(b.y+(b.h||3))|0;for(const dx of [1,2]){const x=(b.x+dx)|0;if(x<1||y<1||x>=WW-1||y>=WH-1)return true;const t=T[y*WW+x];if(t===TREE||t===BUSH||t===ROCK||t===WALL||t===CACTUS||t===DEADTREE||t===MESA||OCC[y*WW+x]<0)return true;for(const o of buildings)if(o&&o!==b&&o.x>1&&x>=o.x&&x<o.x+(o.w||4)&&y>=o.y&&y<o.y+(o.h||3))return true;}return false;};
  for(const b of buildings){if(!b||b.cabin||b.x<2)continue;for(let n=0;n<8&&doorBad(b);n++){const ox=b.x,oy=b.y;b.y--;if(b.y<2||shapeHitsBuilding(b,b)){b.y=oy;b.x--;if(b.x<2||shapeHitsBuilding(b,b)){b.x=ox;break;}}}}
  for(let i=0;i<OCC.length;i++)if(OCC[i]>0)OCC[i]=0;
  for(const b of buildings){if(!b||b.x<2||b.y<2)continue;for(let y=b.y;y<b.y+(b.h||3);y++)for(let x=b.x;x<b.x+(b.w||4);x++)if(x>0&&y>0&&x<WW&&y<WH)OCC[y*WW+x]=b.id+1;}
  const hard=t=>t===TREE||t===BUSH||t===ROCK||t===CACTUS||t===DEADTREE||t===MESA||t===WALL;
  for(const s of SETS)if(s&&s._gates)for(const g of s._gates)for(const [x,y] of shapeGateTiles(g)){
    if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const i=y*WW+x;const o=OCC[i];
    if(o>0)continue;
    if(o===-3&&typeof WALLIDX!=="undefined")WALLIDX.delete(i);
    if(o<0)OCC[i]=0;
    const t=T[i];if(t===DEEP||t===SHAL)continue;
    if(hard(t)||t===FOREST||t===GRASS||t===FLOWER||t===SAND||t===MUD)T[i]=ROAD;
  }
  for(const s of SETS)if(s){const cx=s.x|0,cy=s.y|0;for(let dy=0;dy<=1;dy++)for(let dx=0;dx<=1;dx++){const x=cx+dx,y=cy+dy;if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const i=y*WW+x;if(OCC[i]===-1)OCC[i]=0;}}
  if(typeof WALLS!=="undefined"){for(let i=WALLS.length-1;i>=0;i--){const w=WALLS[i],i2=w.y*WW+w.x;if(OCC[i2]!==-3){WALLS.splice(i,1);if(typeof WALLIDX!=="undefined")WALLIDX.delete(i2);}}for(let i=0;i<WALLS.length;i++)WALLS[i].i=i;}
  for(const b of buildings){if(!b||b.cabin||b.x<2)continue;for(const dx of [1,2]){const x=(b.x+dx)|0,y=(b.y+(b.h||3))|0;if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const i=y*WW+x;
    if(OCC[i]>0){const ob=buildings[OCC[i]-1];if(ob&&x>=ob.x&&x<ob.x+(ob.w||4)&&y>=ob.y&&y<ob.y+(ob.h||3))continue;}
    OCC[i]=0;if(T[i]!==DEEP&&T[i]!==SHAL)T[i]=COBBLE;}}
}
function shapeOwn(){try{shapeOpenGates();}catch(e){}}
if(typeof newWorld==="function"){const _shapeNw=newWorld;newWorld=function(){const r=_shapeNw.apply(this,arguments);try{shapeOwn();}catch(e){}return r;};}
if(typeof orgWallRing==="function")orgWallRing=function(){};
if(typeof orgRoadNet==="function")orgRoadNet=function(){};
if(typeof orgTrimRoads==="function")orgTrimRoads=function(){};
