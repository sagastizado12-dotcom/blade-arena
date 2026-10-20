// ===== v42 CLEAN BRIDGES + DRY WALLED TOWNS =====
// (1) before walls: no water inside any town wall; rivers that ran through a town are re-routed around it outside the wall.
// (2) after walls/roads: every bridge is rebuilt as a clean straight span exactly road-wide (1-2 tiles), bank to bank; no strips over land.
// (3) art: plank deck with posts & rails, stone arch for wide spans near towns, log bridges for short stream crossings.
const wet42=t=>t===DEEP||t===SHAL;
const wallD=(s,x,y)=>Math.max(Math.abs(x-s.x-0.5),Math.abs(y-s.y-0.5))*0.55+Math.hypot(x-s.x-0.5,y-s.y-0.5)*0.45;
function dryTowns(){for(const s of SETS){const R=wallR(s);const inner=[];
  // river tiles near the ring, to reconnect around the outside
  const band=[];for(let y=s.y-R-7;y<=s.y+R+7;y++)for(let x=s.x-R-7;x<=s.x+R+7;x++){if(x<1||y<1||x>=WW-1||y>=WH-1)continue;const i=y*WW+x,d=wallD(s,x,y);
    if(d<=R+1.2){if(wet42(T[i])||T[i]===BRIDGE){const was=T[i];T[i]=was===BRIDGE?ROAD:(OCC[i]>0?COBBLE:GRASS);RIVERM[i]=0;LEGW[i]=0;inner.push(i);}}
    else if(d>R+1.6&&d<R+3.2&&RIVERM[i])band.push([Math.atan2(y-s.y,x-s.x),x,y]);}
  if(!inner.length||band.length<2)continue;
  // cluster band hits by angle; join consecutive clusters with an arc at R+4 (skip the largest gap = the dry side)
  band.sort((a,b)=>a[0]-b[0]);const cl=[];for(const b of band){const c=cl[cl.length-1];if(c&&b[0]-c.a1<0.35){c.a1=b[0];}else cl.push({a0:b[0],a1:b[0]});}
  if(cl.length>1&&cl[0].a0+Math.PI*2-cl[cl.length-1].a1<0.35){cl[0].a0=cl[cl.length-1].a0-Math.PI*2;cl.pop();}
  if(cl.length<2)continue;const mids=cl.map(c=>(c.a0+c.a1)/2);let gi=-1,gmax=-1;for(let i=0;i<mids.length;i++){const a=mids[i],b=i+1<mids.length?mids[i+1]:mids[0]+Math.PI*2;if(b-a>gmax){gmax=b-a;gi=i;}}
  for(let i=0;i<mids.length;i++){if(i===gi)continue;const a=mids[i],b=i+1<mids.length?mids[i+1]:mids[0]+Math.PI*2;
    for(let t=a;t<=b;t+=0.012){const rr=R+4.4;const cx=s.x+0.5+Math.cos(t)*rr/0.95,cy=s.y+0.5+Math.sin(t)*rr/0.95;
      for(let k=-1;k<=1;k++){const x=Math.round(cx+Math.cos(t)*k),y=Math.round(cy+Math.sin(t)*k);if(x<1||y<1||x>=WW-1||y>=WH-1)continue;const j=y*WW+x;if(wallD(s,x,y)<=R+1.6||OCC[j]>0)continue;if(SETS.some(q=>q!==s&&wallD(q,x,y)<=wallR(q)+1.6))continue;
        const was=T[j];RIVERM[j]=1;ELEV[j]=0;T[j]=(was===ROAD||was===COBBLE||was===BRIDGE)?BRIDGE:k===0?DEEP:SHAL;}}}}}
function roadish(t){return t===ROAD||t===COBBLE||t===STAIRS;}
function cleanBridges(){const N=WW*WH;const old=new Uint8Array(N);
  for(let i=0;i<N;i++)if(T[i]===BRIDGE)old[i]=1;
  // restore what is under each old bridge tile
  const snap=T.slice();
  for(let i=0;i<N;i++){if(!old[i])continue;const x=i%WW,y=(i/WW)|0;let w=0,l=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const t=snap[i+dy*WW+dx];if(t===BRIDGE)continue;if(wet42(t))w++;else l++;}
    const water=RIVERM[i]||LEGW[i]||w>l;if(water)T[i]=RIVERM[i]?DEEP:SHAL;else{let r=false;for(const d of [1,-1,WW,-WW])if(roadish(snap[i+d]))r=true;T[i]=r?ROAD:GRASS;}}
  // shallow edges for restored water next to land
  for(let i=0;i<N;i++){if(!old[i]||T[i]!==DEEP)continue;for(const d of [1,-1,WW,-WW])if(!wet42(T[i+d])){T[i]=SHAL;break;}}
  // find straight spans: wet runs bounded by road-ish land, that used to carry a bridge
  const spans=[];const scan=(horiz)=>{const A=horiz?WH:WW,B=horiz?WW:WH;for(let a=1;a<A-1;a++){let b=1;while(b<B-1){const at=c=>horiz?a*WW+c:c*WW+a;if(!wet42(T[at(b)])){b++;continue;}let e=b;while(e<B-1&&wet42(T[at(e)]))e++;
      const L=e-b;if(L<=50&&roadish(T[at(b-1)])&&roadish(T[at(e)])){let ob=0;for(let c=b;c<e;c++)if(old[at(c)])ob++;let land=0;for(let c=b;c<e;c++){for(const o of [-1,1]){const j=horiz?(a+o)*WW+c:c*WW+a+o;const t=T[j];if(!wet42(t)&&!old[j]&&t!==BRIDGE)land++;}}if(ob>=Math.max(1,L*0.5)&&land<=Math.max(2,L*0.5))spans.push({horiz,a,b,e,L,ob});}b=e+1;}}};
  scan(true);scan(false);
  // dedupe: neighbouring parallel spans over the same water -> keep at most 2 adjacent rows (road width)
  spans.sort((p,q)=>(p.horiz-q.horiz)||(p.b-q.b)||(p.a-q.a));const keep=[];
  for(const s of spans){const grp=keep.filter(k=>k.horiz===s.horiz&&Math.abs(k.a-s.a)<=3&&k.b<s.e&&s.b<k.e);
    if(!grp.length){keep.push(s);continue;}if(grp.length>=2)continue;const k=grp[0];if(Math.abs(k.a-s.a)===1)keep.push(s);else if(s.L<k.L){keep.splice(keep.indexOf(k),1,s);}}
  // crossing horizontal & vertical: keep the shorter
  const tilesOf=s=>{const o=[];for(let c=s.b;c<s.e;c++)o.push(s.horiz?s.a*WW+c:c*WW+s.a);return o;};const drop=new Set();
  for(const h of keep)if(h.horiz)for(const v of keep)if(!v.horiz&&!drop.has(h)&&!drop.has(v)){if(v.a>=h.b-1&&v.a<=h.e&&h.a>=v.b-1&&h.a<=v.e)drop.add(h.L<=v.L?v:h);}
  for(let i=keep.length-1;i>=0;i--)if(drop.has(keep[i]))keep.splice(i,1);
  const mark=new Map();for(const s of keep)for(let c=s.b;c<s.e;c++){const i=s.horiz?s.a*WW+c:c*WW+s.a;const o=mark.get(i);if(!o||s.L<o.L)mark.set(i,s);}
  for(const [i,s] of mark)T[i]=BRIDGE;
  // fallback: a road that lost its bridge (diagonal crossing) gets a straight 1-wide span to the nearest bank
  for(let i=0;i<N;i++){if(!roadish(T[i]))continue;let nearOld=false,hasNew=false;for(const d of [1,-1,WW,-WW]){if(old[i+d])nearOld=true;if(T[i+d]===BRIDGE)hasNew=true;}if(!nearOld||hasNew)continue;
    {let nb=false;const x0=i%WW,y0=(i/WW)|0;for(let dy=-3;dy<=3&&!nb;dy++)for(let dx=-3;dx<=3;dx++)if(T[(y0+dy)*WW+x0+dx]===BRIDGE){nb=true;break;}if(nb)continue;}
    let best=null;for(const d of [1,-1,WW,-WW]){if(!wet42(T[i+d]))continue;let j=i+d,L=0;while(wet42(T[j])&&L<14){j+=d;L++;}if(L<14&&!wet42(T[j])&&T[j]!==BRIDGE&&!solidTile(j%WW,(j/WW)|0)&&(!best||L<best.L))best={d,L};}
    if(best){let near=0;const px=Math.abs(best.d)===1?WW:1;let j0=i+best.d;for(let k=0;k<best.L;k++,j0+=best.d)for(const o of [px,-px,2*px,-2*px])if(T[j0+o]===BRIDGE)near++;if(near)continue;}
    if(best){let j=i+best.d;for(let k=0;k<best.L;k++){T[j]=BRIDGE;j+=best.d;}}}
  BR42=null;}
{const _gw=genWalls;genWalls=function(){dryTowns();const r=_gw.apply(this,arguments);cleanBridges();return r;};}
// ---------- bridge art ----------
let BR42=null;
function bridgeInfo(tx,ty){const i=ty*WW+tx;const isB=(x,y)=>tAt(x,y)===BRIDGE;let h=1,v=1;for(let x=tx-1;isB(x,ty);x--)h++;for(let x=tx+1;isB(x,ty);x++)h++;for(let y=ty-1;isB(tx,y);y--)v++;for(let y=ty+1;isB(tx,y);y++)v++;
  const horiz=h>=v;const along=horiz?h:v;let first=horiz?!isB(tx-1,ty):!isB(tx,ty-1),last=horiz?!isB(tx+1,ty):!isB(tx,ty+1);
  const sideA=horiz?!isB(tx,ty-1):!isB(tx-1,ty),sideB=horiz?!isB(tx,ty+1):!isB(tx+1,ty);const wide=horiz?(isB(tx,ty-1)||isB(tx,ty+1)):(isB(tx-1,ty)||isB(tx+1,ty));
  const nearTown=SETS.some(s=>Math.hypot(s.x-tx,s.y-ty)<wallR(s)+14);const style=along<=3?"log":(wide&&nearTown)||along>=10?"stone":"plank";return{horiz,first,last,sideA,sideB,style};}
function drawBridgeTile(g,X,Y,tx,ty){const b=bridgeInfo(tx,ty);const W0=TILESET[DEEP]||TILESET[SHAL];if(W0)g.drawImage(W0[0],X,Y,16,16);
  g.save();g.translate(X+8,Y+8);if(!b.horiz)g.rotate(Math.PI/2);g.translate(-8,-8);const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  // in local space the deck runs left->right; sideA = top edge, sideB = bottom edge
  if(b.style==="stone"){R(0,1,16,14,"#b8b0a4");for(let x=0;x<16;x+=4)R(x+((ty+tx)%2?2:0),1,1,14,"#9a9286");R(0,7,16,1,"#a49c90");
    if(b.sideA){R(0,0,16,3,"#d8d2c6");R(0,3,16,1,"#7a7268");}if(b.sideB){R(0,12,16,3,"#d8d2c6");R(0,15,16,1,"#5a544c");g.fillStyle="rgba(0,0,0,.25)";g.beginPath();g.arc(8,16,6,Math.PI,0);g.fill();}
    if(b.first){R(0,0,2,16,"#8a8276");}if(b.last){R(14,0,2,16,"#8a8276");}}
  else if(b.style==="log"){for(let y=1;y<15;y+=3){R(0,y,16,3,"#8a5a30");R(0,y,16,1,"#b07a44");R(0,y+2,16,1,"#5a3a1c");}if(b.first)R(0,0,2,16,"#6a4424");if(b.last)R(14,0,2,16,"#6a4424");}
  else{R(0,2,16,12,"#c88a50");for(let x=(tx*3)%4;x<16;x+=4)R(x,2,1,12,"#8a5a30");R(0,2,16,1,"#e0a868");
    if(b.sideA){R(0,0,16,2,"#6a4024");R(0,1,16,1,"#9a6434");for(let x=1;x<16;x+=5)R(x,-1<0?0:0,2,3,"#5a3418");}
    if(b.sideB){R(0,13,16,2,"#6a4024");R(0,14,16,1,"#4a2c14");for(let x=1;x<16;x+=5)R(x,12,2,4,"#5a3418");g.fillStyle="rgba(0,0,30,.25)";g.fillRect(0,15,16,1);}
    if(b.first){R(0,0,3,3,"#4a2c14");R(0,13,3,3,"#4a2c14");R(1,0,1,2,"#a06a3a");}if(b.last){R(13,0,3,3,"#4a2c14");R(13,13,3,3,"#4a2c14");R(14,0,1,2,"#a06a3a");}}
  g.restore();
  // rocks on the banks beside bridge ends
  if(b.first||b.last){for(const [dx,dy] of b.horiz?[[0,-1],[0,1]]:[[-1,0],[1,0]]){const nx=tx+dx,ny=ty+dy;if(wet42(tAt(nx,ny))&&hash2(nx,ny,4242)<0.5){const x=X+dx*16+5+((hash2(nx,ny,1)*6)|0),y=Y+dy*16+5+((hash2(nx,ny,2)*6)|0);g.fillStyle="#5a5a64";g.fillRect(x,y,5,4);g.fillStyle="#9a9aa6";g.fillRect(x+1,y,3,2);}}}}
{const _gc=getChunk;getChunk=function(cx,cy){const c=_gc(cx,cy);if(!c||c._br42)return c;c._br42=1;try{const g=c.getContext("2d");g.save();g.setTransform(RS,0,0,RS,0,0);g.imageSmoothingEnabled=false;
  for(let y=0;y<CH;y++)for(let x=0;x<CH;x++){const tx=cx*CH+x,ty=cy*CH+y;if(tAt(tx,ty)===BRIDGE)drawBridgeTile(g,x*TILE,y*TILE,tx,ty);}g.restore();}catch(_){}return c;};}
