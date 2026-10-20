// ===== v47b MODERNO: the hero's independent city-state (3x the area of a capital), ringed by farmland =====
const MOD_ID=27;
SETS.push({id:27,name:"Moderno",kind:"free town",label:"free city-state",x:1560,y:262,r:38,free:true,roof:["#2a6ad0","#12347a"],wall:"#f6eedc",gem:"#9df"});
KOF.push(0);// never read: kOf() returns -1 for the free city
LOBES.push({x:1560,y:262,rx:112,ry:100,k:"moderno"});
EXTRA_ROADS.push([27,19],[27,24],[27,22],[27,20]);
{const _rk=regionKind;regionKind=function(x,y){if(Math.hypot(x-1560,y-262)<80)return null;return _rk(x,y);};}
const MODF={fields:[],orchards:[],pastures:[],barns:[],yard:[]};
const ESTATE={x:1514,y:196,w:24,h:14};// v50: the hero's manor plot, north of Moderno
// farmland ring outside the wall: fenced crop fields, orchards, pastures; barns + farmhouses get appended as buildings
function layoutModerno(){const s=SETS[MOD_ID];layoutSettlement(s);const R0=s.r+7,R1=s.r+30;MODF.fields=[];MODF.orchards=[];MODF.pastures=[];MODF.barns=[];
  const E=ESTATE;for(let y=E.y-1;y<=E.y+E.h;y++)for(let x=E.x-1;x<=E.x+E.w;x++){const i=y*WW+x;if(T[i]!==ROAD&&T[i]!==BRIDGE&&!RIVERM[i]){T[i]=GRASS;ELEV[i]=0;}}
  const free=(x0,y0,w,h)=>{if(x0<E.x+E.w+2&&x0+w+2>E.x&&y0<E.y+E.h+2&&y0+h+2>E.y)return false;for(let y=y0-1;y<=y0+h;y++)for(let x=x0-1;x<=x0+w;x++){const i=y*WW+x,t=T[i];if(OCC[i]||t===ROAD||t===COBBLE||t===BRIDGE||t===DEEP||t===SHAL||t===WALL||t===RUIN||RIVERM[i])return false;}return true;};
  // v47.2: tidy farmland ring on a grid OUTSIDE the square wall (max-norm 41): margin 5, gate roads kept clear, no overlaps
  const WRm=s.r+3,IN=WRm+5,OUT=WRm+30;let n=0;
  for(const g of [[0,-1],[0,1],[-1,0],[1,0]])for(let k=WRm;k<=OUT+2;k++)for(let w=-1;w<=2;w++){const x=g[0]?s.x+g[0]*k+(g[0]>0?1:0):s.x+w,y=g[1]?s.y+g[1]*k+(g[1]>0?1:0):s.y+w;const i=y*WW+x;if(T[i]!==DEEP&&T[i]!==SHAL&&!RIVERM[i]&&!OCC[i]){T[i]=ROAD;ELEV[i]=0;}}
  for(let gy=-8;gy<=8;gy++)for(let gx=-8;gx<=8;gx++){const kind=["field","field","orchard","field","pasture","barn"][(gx*3+gy*5+64)%6];const w=kind==="barn"?4:kind==="pasture"?9:8,h=kind==="barn"?3:6;
    const x0=s.x+gx*11-4,y0=s.y+gy*9-3;const cx=x0+w/2-s.x-0.5,cy=y0+h/2-s.y-0.5;
    const inner=Math.max(Math.abs(cx)-w/2,Math.abs(cy)-h/2),outer=Math.max(Math.abs(cx)+w/2,Math.abs(cy)+h/2);if(inner<IN||outer>OUT)continue;
    if(Math.abs(x0+w/2-s.x-0.5)<w/2+4||Math.abs(y0+h/2-s.y-0.5)<h/2+4)continue;// gate roads
    if(!free(x0,y0,w,h))continue;n++;const q={x:x0,y:y0,w,h,i:n};
    if(kind==="field"){for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){T[y*WW+x]=FARM;ELEV[y*WW+x]=0;}MODF.fields.push(q);}
    else if(kind==="orchard"){for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){T[y*WW+x]=(x-x0)%3===1&&(y-y0)%3===1?TREE:GRASS;ELEV[y*WW+x]=0;}MODF.orchards.push(q);}
    else if(kind==="pasture"){for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){T[y*WW+x]=GRASS;ELEV[y*WW+x]=0;}MODF.pastures.push(q);}
    else{const b={id:buildings.length,s:MOD_ID,x:x0,y:y0,w:4,h:3,kind:"house",farm:true,barn:n%2===0,dmg:0,burn:0,district:"farms"};
      for(let y=y0;y<y0+3;y++)for(let x=x0;x<x0+4;x++){T[y*WW+x]=COBBLE;OCC[y*WW+x]=b.id+1;}T[(y0+3)*WW+x0+1]=ROAD;T[(y0+3)*WW+x0+2]=ROAD;s.bIdx.push(b.id);buildings.push(b);MODF.barns.push({...q,b:b.id});}}
  s.farm=MODF.fields[0]?{x:MODF.fields[0].x,y:MODF.fields[0].y,w:4,h:3}:s.farm;
  // the hero's districts: tag buildings so the Lord menu can upgrade them
  const order=["market","smithy","inn","guild","temple","barracks","granary"];const own=s.bIdx.map(i=>buildings[i]).filter(b=>!b.farm);
  for(const b of own){if(b.kind==="inn")b.mk="inn";else if(b.kind==="shop")b.mk="market";else if(b.kind==="guild")b.mk="guild";}
  let oi=0;for(const k of ["smithy","temple","barracks","granary"]){const b=own.filter(q=>q.kind==="house"&&!q.mk)[oi*3+1];if(b)b.mk=k;oi++;}
  for(const b of own)if(!b.mk)b.mk="houses";for(const b of buildings)if(b.farm)b.mk="farms";}
// v47.1: no stray boulders on Nethervale's volcanic ground (their tile art is grass-backed)
function demonRocks(){let c=0;for(let y=380;y<WH;y++)for(let x=500;x<WW;x++){const i=y*WW+x;if(T[i]!==ROCK||OCC[i])continue;if(kingdomAt(x,y)!==3)continue;T[i]=MUD;c++;}return c;}
