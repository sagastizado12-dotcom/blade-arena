// ===== v78 LIVING WILDS =====
// The v47 region test painted every tile east of x=1420 as dune. This pass
// turns that empty sand into country-themed land. It runs only while the map
// is being built, then the result is stored in worldpack.bin. Loading the
// pack does not scan the map again.
function desertPocket(x,y){
  const L=LOBES[1];
  if(L){const dx=(x-L.x)/L.rx,dy=(y-L.y)/L.ry;if(dx*dx+dy*dy<1.15)return true;}
  const N=LOBES[2];
  if(N&&x>636*GEO_K){const dx=(x-N.x)/N.rx,dy=(y-N.y)/N.ry;if(dx*dx+dy*dy<1.15)return true;}
  if(x>=1420&&x<2200&&y>600&&y<860)return true;
  const dx=x-6680,dy=y-1180;return (dx*dx)/(240*240)+(dy*dy)/(150*150)<1;
}
function enlivenWilds(){
  const t0=performance.now();
  if(typeof buildKGrid==="function"&&!KGRID)buildKGrid();
  const S=8,gw=(WW+S-1)/S|0,mask=new Uint8Array(gw*(((WH+S-1)/S)|0));
  for(const s of SETS){const rad=s.r+7,x0=Math.max(0,(s.x-rad)/S|0),x1=Math.min(gw-1,(s.x+rad)/S|0),y0=Math.max(0,(s.y-rad)/S|0),y1=Math.min(((WH+S-1)/S|0)-1,(s.y+rad)/S|0);
    for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){const cx=gx*S+S/2,cy=gy*S+S/2;if(Math.hypot(cx-s.x,cy-s.y)<=rad+S*0.8)mask[gy*gw+gx]=1;}}
  const kgw=Math.ceil(WW/8);
  const kid=(x,y)=>KGRID[(y>>3)*kgw+(x>>3)];
  const wet=(x,y)=>{const i=y*WW+x;const e=T[i+1],w=T[i-1],s=T[i+WW],n=T[i-WW];return e===DEEP||e===SHAL||w===DEEP||w===SHAL||s===DEEP||s===SHAL||n===DEEP||n===SHAL;};
  const nearBuilt=(x,y)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const t=T[(y+dy)*WW+x+dx];if(t===ROAD||t===COBBLE||t===BRIDGE||t===PIER||t===WALL)return true;}return false;};
  const field=(x,y)=>vnoise(x/56,y/56,79)*0.65+vnoise(x/24,y/24,80)*0.35;
  function pickTile(x,y){
    const k=kid(x,y),m=field(x,y);
    let kind="grass";
    if(k===4)kind=m>0.57?"forest":m<0.40?"flower":"grass";
    else if(k===5)kind=m>0.66?"forest":m<0.36?"flower":"grass";
    else if(k===6)kind=m>0.63?"forest":m>0.46&&m<0.58?"flower":"grass";
    else if(k===3)kind=m>0.48?"mud":"grass";
    else if(k===2)kind=m>0.46?"forest":m<0.34?"flower":"grass";
    else if(k===1)kind=m>0.60?"forest":m<0.42?"flower":"grass";
    else kind=m>0.58?"forest":m<0.38?"flower":"grass";
    let v=kind==="forest"?FOREST:kind==="flower"?FLOWER:kind==="mud"?MUD:GRASS;
    if(kind==="forest"&&(x%18===8)&&(y%18===8))v=TREE;
    else if(kind==="mud"&&(x%16===4)&&(y%16===4)&&hash2(x>>4,y>>4,83)>0.55)v=DEADTREE;
    else if(k===5&&kind==="grass"&&(x%14===3)&&(y%14===3)&&hash2(x>>4,y>>4,84)>0.72)v=REED;
    if(v===TREE||v===ROCK||v===DEADTREE){
      if(nearBuilt(x,y))v=kind==="mud"?MUD:GRASS;
      else{const i=y*WW+x;if(SOLID_T.has(T[i-1])||SOLID_T.has(T[i-WW])||SOLID_T.has(T[i-WW-1])||SOLID_T.has(T[i-WW+1]))v=kind==="mud"?MUD:GRASS;}
    }
    return v;
  }
  const bare=t=>t===DUNE||t===CACTUS||t===MESA||t===SAND;
  let changed=0;
  for(let y=2;y<WH-2;y++){
    const row=y*WW,my=(y/S|0)*gw;
    for(let x=2;x<WW-2;x++){
      const i=row+x,t=T[i];
      if(!bare(t)||OCC[i]||desertPocket(x,y))continue;
      if(wet(x,y)){if(t!==SAND){T[i]=SAND;changed++;}continue;}
      if(mask[my+(x/S|0)]){T[i]=GRASS;changed++;continue;}
      T[i]=pickTile(x,y);changed++;
    }
  }
  for(let y=2;y<420;y++)for(let x=2200;x<WW-2;x++){
    const i=y*WW+x,t=T[i];
    if((t!==SNOW&&t!==ICE)||OCC[i]||mask[(y/S|0)*gw+(x/S|0)])continue;
    T[i]=wet(x,y)?SAND:pickTile(x,y);changed++;
  }
  for(let y=360;y<560;y++)for(let x=2200;x<WW-2;x++){
    const i=y*WW+x,t=T[i];
    if(t!==MUD&&t!==REED&&t!==DEADTREE)continue;
    if(OCC[i]||kid(x,y)===3||mask[(y/S|0)*gw+(x/S|0)])continue;
    T[i]=pickTile(x,y);changed++;
  }
  const GROVES=[[5050,820,88,56],[4580,1320,64,44],[5720,1700,72,46],[6420,2900,66,42],[6880,2140,54,36],[4700,5740,96,60],[3920,5460,64,44],[3380,4580,50,36],[2500,560,44,32],[900,4380,70,48],[2700,2000,56,40]];
  for(const [cx,cy,rx,ry] of GROVES){
    if(SETS.some(s=>Math.hypot(s.x-cx,s.y-cy)<s.r+Math.max(rx,ry)*0.5))continue;
    for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){
      if(x<2||y<2||x>=WW-2||y>=WH-2)continue;
      const d=Math.hypot((x-cx)/rx,(y-cy)/ry);if(d>1)continue;
      const i=y*WW+x;if(OCC[i]||mask[(y/S|0)*gw+(x/S|0)]||desertPocket(x,y))continue;
      const t=T[i];if(t!==GRASS&&t!==FLOWER&&t!==SAND&&t!==DUNE)continue;
      let v=FOREST;
      if((((x-cx)&7)===4)&&(((y-cy)&7)===4)&&d<0.82&&!nearBuilt(x,y))v=TREE;
      else if(d>0.88&&hash2(x>>1,y>>1,86)>0.7)v=FLOWER;
      T[i]=v;changed++;
    }
  }
  function paintWater(x,y,deep){
    if(x<2||y<2||x>=WW-2||y>=WH-2)return;
    const i=y*WW+x;if(OCC[i]||mask[(y/S|0)*gw+(x/S|0)])return;
    const t=T[i];
    if(t===ROAD||t===COBBLE){T[i]=BRIDGE;RIVERM[i]=1;return;}
    if(t===WALL||t===RUIN||t===STAIRS||t===CAVE||t===PIER||t===BRIDGE)return;
    T[i]=deep?DEEP:SHAL;RIVERM[i]=1;
  }
  function lake(cx,cy,rx,ry){
    for(const s of SETS)if(Math.hypot(s.x-cx,s.y-cy)<s.r+Math.max(rx,ry)+22)return false;
    let roads=0,land=0;
    for(let y=(cy-ry)|0;y<=cy+ry;y+=2)for(let x=(cx-rx)|0;x<=cx+rx;x+=2){
      if(x<2||y<2||x>=WW-2||y>=WH-2)continue;const t=T[y*WW+x];
      if(t===ROAD||t===COBBLE||t===BRIDGE||t===WALL)roads++;if(t!==DEEP&&t!==SHAL)land++;}
    if(roads||land<16)return false;
    for(let y=Math.round(cy-ry-3);y<=cy+ry+3;y++)for(let x=Math.round(cx-rx-3);x<=cx+rx+3;x++){
      const d=Math.hypot((x-cx)/rx,(y-cy)/ry);if(d>1.22)continue;
      if(d<0.68)paintWater(x,y,true);else if(d<1)paintWater(x,y,false);
      else{const i=y*WW+x,t=T[i];if(!OCC[i]&&t!==ROAD&&t!==COBBLE&&t!==BRIDGE&&t!==WALL&&t!==DEEP&&t!==SHAL)T[i]=SAND;}
    }
    return true;
  }
  const lakes=[[5280,1320,30,20],[6680,2860,24,16],[4920,5860,28,18],[3720,4620,16,12],[2200,720,14,10],[720,4480,16,12]].filter(L=>lake(L[0],L[1],L[2],L[3]));
  function stream(x0,y0,x1,y1,amp){
    const n=Math.max(1,Math.hypot(x1-x0,y1-y0)|0),dx=(x1-x0)/n,dy=(y1-y0)/n,px=-dy,py=dx;
    for(let i=0;i<=n;i++){
      const w=Math.sin(i*0.045)*amp,x=Math.round(x0+dx*i+px*w),y=Math.round(y0+dy*i+py*w);
      for(let k=-2;k<=2;k++)paintWater(Math.round(x+px*k),Math.round(y+py*k),Math.abs(k)<=1);
      if(i%64===32&&x>2&&y>2&&x<WW-2&&y<WH-2){const t=T[y*WW+x];if(t===DEEP||t===SHAL||t===ROAD||t===COBBLE){T[y*WW+x]=BRIDGE;RIVERM[y*WW+x]=1;}}
    }
  }
  stream(5000,980,5280,1320,22);stream(5280,1320,5660,1560,18);
  stream(4540,5520,4920,5860,20);stream(4920,5860,5280,6120,16);
  stream(6460,2460,6680,2860,16);
  let farms=0;
  for(const s of SETS){
    if(!s.kind||s.kind.indexOf("town")<0||s.island)continue;
    for(const [dx,dy] of [[1,0.2],[-1,0.15],[0.25,1],[-0.2,-1]]){
      const cx=Math.round(s.x+(s.r+16)*dx),cy=Math.round(s.y+(s.r+14)*dy);
      let ok=0,bad=0;
      for(let y=cy-2;y<=cy+2;y++)for(let x=cx-3;x<=cx+3;x++){
        if(x<2||y<2||x>=WW-2||y>=WH-2){bad++;continue;}
        const t=T[y*WW+x];
        if(t===GRASS||t===FLOWER)ok++;
        else if(t!==FARM)bad++;
      }
      if(ok<24||bad>6)continue;
      for(let y=cy-2;y<=cy+2;y++)for(let x=cx-3;x<=cx+3;x++){const i=y*WW+x;if(T[i]===GRASS||T[i]===FLOWER){T[i]=FARM;farms++;}}
    }
  }
  window.__LIFE={ms:Math.round(performance.now()-t0),changed,lakes:lakes.length,farms};
}
window.__enliven=enlivenWilds;
window.__redrawMap=function(){if(typeof buildWorldMap==="function")buildWorldMap();if(typeof WA!=="undefined")WA.zone=null;if(typeof chunkCache!=="undefined")chunkCache.clear();};
