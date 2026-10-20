// ===== v38 RIVER REROUTE (per the user's annotated map): remove the swamp river south of Bogsend and the southern E-W river;
// the north river now turns east near Bogsend, runs through the lake east of the swamp, past the two small lakes below
// Lakemere, and joins the eastern north-south river. Deterministic; towns stay dry; roads become bridges. =====
{const i=RIVERS2.findIndex(r=>r[0][0]===236&&r[0][1]===442);if(i>=0)RIVERS2.splice(i,1);}
const RIVER38=[[86,314],[100,322],[118,326],[134,323],[146,322],[156,332],[166,346],[178,360],[190,372],[198,382],[204,390],[209,396]];
// v41: link the north river to the southern segment around the west/south-west of Lakemere
const RIVER41=[[200,308],[197,318],[198,330],[204,340],[213,345],[221,342]];
function carve38(pts){const wet=t=>t===DEEP||t===SHAL;for(let i=0;i<pts.length-1;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1];const L=Math.ceil(Math.hypot(bx-ax,by-ay));for(let s=0;s<=L;s++){const u=s/L,w=Math.sin((i*20+s)*0.13)*1.2;const a=Math.atan2(by-ay,bx-ax),nx=-Math.sin(a),ny=Math.cos(a);const cx=Math.round(ax+(bx-ax)*u+nx*w),cy=Math.round(ay+(by-ay)*u+ny*w);
    for(let ky=-2;ky<=2;ky++)for(let kx=-2;kx<=2;kx++){if(kx*kx+ky*ky>5)continue;const tx=cx+kx,ty=cy+ky,j=ty*WW+tx;if(SETS.some(q=>Math.hypot(tx-q.x,ty-q.y)<q.r+5))continue;if(OCC[j]>0)continue;const was=T[j];if(wet(was)&&!RIVERM[j])continue;RIVERM[j]=1;ELEV[j]=0;
      if(was===ROAD||was===COBBLE||was===PIER||was===BRIDGE)T[j]=BRIDGE;else T[j]=kx*kx+ky*ky<=2?DEEP:SHAL;}
    if(s%37===5)FISH_SPOTS.push({x:cx,y:cy});}}}
function riverReroute(){const wet=t=>t===DEEP||t===SHAL;
  // (a) delete the swamp river channel from just below the turn down to the south coast
  for(let y=326;y<=446;y++){let x=60;while(x<=116){if(!wet(T[y*WW+x])||OCC[y*WW+x]>0){x++;continue;}let e=x;while(e<=118&&wet(T[y*WW+e]))e++;const w=e-x;
      // only river-width runs that are not ocean (land on both sides)
      if(w>=2&&w<=9&&!wet(T[y*WW+x-1])&&!wet(T[y*WW+e])){for(let k=x;k<e;k++){const i=y*WW+k;T[i]=y>360&&hash2(k,y,5)<0.2?MUD:GRASS;RIVERM[i]=0;}}x=e+1;}
    for(let x=55;x<=120;x++){const i=y*WW+x;if(T[i]===BRIDGE&&!wet(T[i-1])&&!wet(T[i+1])&&!wet(T[i-WW])&&!wet(T[i+WW]))T[i]=ROAD;}}
  // (b) the new eastward route
  carve38(RIVER38);carve38(RIVER41);
  // bridges span the full width where roads cross the new channel
  const BR0=[];for(let y=300;y<430;y++)for(let x=80;x<240;x++){const i=y*WW+x;if(T[i]===BRIDGE)BR0.push(i);}for(const i of BR0){const x=i%WW,y=(i/WW)|0;const ns=RIVERM[i-1]&&RIVERM[i+1];for(const d of (ns?[-1,1]:[-WW,WW])){let j=i+d,n=0;while(RIVERM[j]&&T[j]!==BRIDGE&&n<4){T[j]=BRIDGE;j+=d;n++;}}}}
{const _ft=finalizeTerrain;finalizeTerrain=function(){riverReroute();return _ft.apply(this,arguments);};}
