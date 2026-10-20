// ===== v47b MODERNO: the hero's independent city-state (3x the area of a capital), ringed by farmland =====
const MOD_ID=27;
SETS.push({id:27,name:"Moderno",kind:"free town",label:"free city-state",x:1560,y:262,r:38,free:true,roof:["#2a6ad0","#12347a"],wall:"#f6eedc",gem:"#9df"});
KOF.push(0);// never read: kOf() returns -1 for the free city
LOBES.push({x:1560,y:262,rx:112,ry:100,k:"moderno"});
EXTRA_ROADS.push([27,19],[27,24],[27,22],[27,20]);
{const _rk=regionKind;regionKind=function(x,y){if(Math.hypot(x-1560,y-262)<80)return null;return _rk(x,y);};}
const MODF={fields:[],orchards:[],pastures:[],barns:[],yard:[]};
// farmland ring outside the wall: fenced crop fields, orchards, pastures; barns + farmhouses get appended as buildings
function layoutModerno(){const s=SETS[MOD_ID];layoutSettlement(s);const R0=s.r+7,R1=s.r+30;MODF.fields=[];MODF.orchards=[];MODF.pastures=[];MODF.barns=[];
  const free=(x0,y0,w,h)=>{for(let y=y0-1;y<=y0+h;y++)for(let x=x0-1;x<=x0+w;x++){const i=y*WW+x,t=T[i];if(OCC[i]||t===ROAD||t===COBBLE||t===BRIDGE||t===DEEP||t===SHAL||t===WALL||t===RUIN||RIVERM[i])return false;}return true;};
  let n=0;for(let a=0;a<64;a++){const ang=a/64*6.283,rr=R0+((a*7)%3)*8+4;const x0=Math.round(s.x+Math.cos(ang)*rr)-5,y0=Math.round(s.y+Math.sin(ang)*rr*0.95)-3;
    const kind=["field","field","orchard","pasture","field","barn"][n%6];const w=kind==="barn"?4:kind==="pasture"?9:8,h=kind==="barn"?3:6;
    if(!free(x0,y0,w,h))continue;if([...MODF.fields,...MODF.orchards,...MODF.pastures,...MODF.barns].some(q=>x0<q.x+q.w+3&&x0+w+3>q.x&&y0<q.y+q.h+3&&y0+h+3>q.y))continue;n++;
    const q={x:x0,y:y0,w,h,i:n};
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
