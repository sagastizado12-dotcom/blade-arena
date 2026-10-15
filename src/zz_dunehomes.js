// ===== v35.1 Dunerest homes: 4 desert town houses + a wilderness cabin, APPENDED after every other building (ids of existing buildings never shift) =====
const DUNE_HOMES=[];
function genDuneHomes(){const S=SETS[9];const free=(x0,y0,w,h,m)=>{for(let y=y0-m;y<y0+h+m;y++)for(let x=x0-m;x<x0+w+m;x++){const i=y*WW+x,t=T[i];if(OCC[i]||!(t===SAND||t===GRASS||t===COBBLE||t===ROAD||t===FLOWER)||RIVERM[i])return false;if(t===ROAD&&y>=y0&&y<y0+h&&x>=x0&&x<x0+w)return false;}return true;};
  const cand=[];for(let y=S.y-S.r-2;y<=S.y+S.r+2;y++)for(let x=S.x-S.r-2;x<=S.x+S.r+2;x++){const d=Math.hypot(x+2-S.x,y+1-S.y);if(d<5||d>S.r-1)continue;if(free(x,y,4,3,1))cand.push({x,y,d:hash2(x,y,951)});}
  cand.sort((a,b)=>a.d-b.d);const picked=[];for(const c of cand){if(picked.length>=4)break;if(picked.some(p=>Math.abs(p.x-c.x)<7&&Math.abs(p.y-c.y)<6))continue;picked.push(c);}
  const prices=[180,240,320,420];picked.forEach((c,i)=>{const b={id:buildings.length,s:9,x:c.x,y:c.y,w:4,h:3,kind:"forsale",price:prices[i],dmg:0,burn:0,dune:true,district:"desert"};
    for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)OCC[y*WW+x]=b.id+1;T[(b.y+b.h)*WW+b.x+1]=COBBLE;T[(b.y+b.h)*WW+b.x+2]=COBBLE;buildings.push(b);DUNE_HOMES.push(b.id);});
  const freeW=(x0,y0,w,h)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const i=y*WW+x,t=T[i];if(OCC[i]||RIVERM[i]||t===DEEP||t===SHAL||t===WALL||t===MTN||t===CLIFF||t===ROAD||t===STAIRS||t===PIER)return false;}return true;};
  // wilderness cabin: solid land a short walk outside the walls, next to a road
  let best=null;for(let y=S.y-S.r-16;y<=S.y+S.r+16;y++)for(let x=S.x-S.r-16;x<=S.x+S.r+16;x++){const d=Math.hypot(x-S.x,y-S.y);if(d<S.r+7||d>S.r+20)continue;if(!freeW(x-5,y-4,11,9))continue;
    let road=99;for(let k=5;k<14&&road===99;k++)for(const [dx,dy] of [[k,0],[-k,0],[0,k],[0,-k]])if(T[(y+dy)*WW+x+dx]===ROAD){road=k;break;}if(road===99)continue;const sc=road+d*0.2+hash2(x,y,952);if(!best||sc<best.sc)best={x,y,sc};}
  if(best){const c={x:best.x,y:best.y,name:"Sandglass Rest",s:9,dune:true};for(let y=c.y-4;y<=c.y+4;y++)for(let x=c.x-5;x<=c.x+5;x++)T[y*WW+x]=SAND;
    const b={id:buildings.length,s:9,x:c.x-2,y:c.y-2,w:4,h:3,kind:"forsale",cabin:true,cabinName:c.name,price:460,dmg:0,burn:0,district:"wild",dune:true};
    for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)OCC[y*WW+x]=b.id+1;c.b=b.id;buildings.push(b);for(let y=c.y+2;y<=c.y+5;y++)T[y*WW+c.x]=ROAD;CABINS.push(c);DUNE_HOMES.push(b.id);}}
{const _hs=homeSpots;homeSpots=function(){const o=_hs();for(const id of DUNE_HOMES){const b=buildings[id];if(!b||b.cabin||owns(b))continue;o.push({b,mine:false,x:b.x+b.w/2,y:b.y+b.h/2,name:`Dunerest house — ${homePrice(b)}g`});}return o;};}
// desert style: sandstone walls, flat parapet roof, arched door, striped awning, sale/home sign
const duneCache=new Map();
{const _bs=buildingSprite;buildingSprite=function(b){if(!b||!b.dune)return _bs(b);const own=owns(b);const key=b.id+":"+own;let c=duneCache.get(key);if(c)return c;
  const w=b.w*16,h=b.h*16+30;c=mkCanvas(w*2,h*2);const g=c.getContext("2d");g.scale(2,2);c.lw=w;c.lh=h;const R=(x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(x,y,ww,hh);};
  const top=h-48,base=h-4;R(2,base,w-4,4,"rgba(0,0,0,.25)");R(3,top+10,w-6,base-top-10,"#2a1a10");R(4,top+11,w-8,base-top-12,"#e8c890");
  for(let y=top+14;y<base-2;y+=5)for(let x=5+((y/5|0)%2)*4;x<w-6;x+=8)R(x,y,6,1,"#d4ac70");
  R(2,top+4,w-4,8,"#2a1a10");R(3,top+5,w-6,6,"#f0d8a8");for(let x=3;x<w-4;x+=6)R(x,top+1,4,4,"#2a1a10"),R(x+1,top+2,2,3,"#f0d8a8");
  const dx=(w>>1)-5;R(dx,base-16,10,16,"#2a1a10");g.fillStyle="#7a4a24";g.beginPath();g.moveTo(dx+1,base);g.lineTo(dx+1,base-11);g.arc(dx+5,base-11,4,Math.PI,0);g.lineTo(dx+9,base);g.fill();
  for(const wx of [8,w-16]){R(wx,top+16,8,9,"#2a1a10");R(wx+1,top+17,6,7,"#3a6aa0");g.fillStyle="#2a1a10";g.fillRect(wx+3,top+17,2,7);}
  for(let x=dx-6;x<dx+16;x+=4)R(x,base-21,4,4,((x-dx)/4|0)%2?"#d04030":"#f0e8d0");
  R(w-14,top-8,12,9,"#2a1a10");R(w-13,top-7,10,7,own?"#5ac85a":"#f0e0b0");g.fillStyle="#2a1a10";g.font="bold 5px monospace";g.fillText(own?"HOME":homePrice(b)+"g",w-13,top-2);
  if(b.cabin){R(4,top-6,16,6,"#2a1a10");g.fillStyle="#ffe8a0";g.font="bold 5px monospace";g.fillText("REST",5,top-1);}
  duneCache.set(key,c);return c;};}
