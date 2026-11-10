// ===== v74: three times the v72 land area, three new kingdoms, a round world from orbit.
// Existing towns stay on the v72 scale. New land is appended to the east and south.
const REALM4=[
  {id:24,name:"Haldenford",kind:"capital town",x:4300,y:1500,r:22,roof:["#e0a040","#8a5a18"],wall:"#f6e6c4",gem:"#fc6",king:4},
  {id:25,name:"Millcross",kind:"town",x:5000,y:1100,r:18,roof:["#c4a05a","#7a5828"],wall:"#f4e4c0",gem:"#fd8",king:4},
  {id:26,name:"Saltcrown",kind:"capital town",x:5600,y:2300,r:22,roof:["#3aa0b8","#145868"],wall:"#f4f0e4",gem:"#9ef",king:5,harbor:true},
  {id:27,name:"Keelwick",kind:"town",x:5100,y:2900,r:18,roof:["#5a88a8","#2a4860"],wall:"#efe6d4",gem:"#adf",king:5,harbor:true},
  {id:28,name:"Yarrowkeep",kind:"capital town",x:3900,y:3600,r:22,roof:["#6aaa48","#2a5a18"],wall:"#f2ead0",gem:"#cf8",king:6},
  {id:29,name:"Pollenfield",kind:"village",x:4800,y:4100,r:18,roof:["#d8c060","#8a7420"],wall:"#f8f0d4",gem:"#fea",king:6}
];
const REALM4_K=[
  {id:4,name:"Halden",cap:24,col:"#e0a040",rgb:[224,160,64],ruler:"King Halric",fem:false},
  {id:5,name:"Brine",cap:26,col:"#3aa0b8",rgb:[58,160,184],ruler:"Queen Maren",fem:true},
  {id:6,name:"Yarrow",cap:28,col:"#6aaa48",rgb:[106,170,72],ruler:"Queen Yselle",fem:true}
];
for(const s of REALM4){s.deferLayout=1;SETS.push(s);KOF[s.id]=s.king;}
for(const k of REALM4_K){KINGDOMS.push(k);if(typeof RULER_LOOK!=="undefined"){const L=chibiLook(9000+k.id*77,"king","human");RULER_LOOK[k.id]=k.fem?{...L,cls:"king",fem:true,hair:[230,190,90],style:"long",beard:false,king:1,skin:[244,206,172]}:{...L,cls:"king",king:1};}}
LOBES.push(
  {x:3400,y:1600,rx:700,ry:320,k:"r4bridge"},
  {x:4700,y:1450,rx:1100,ry:560,k:"r4halden"},
  {x:5400,y:2500,rx:820,ry:520,k:"r4brine"},
  {x:5000,y:3300,rx:420,ry:280,k:"r4neck"},
  {x:4400,y:3850,rx:1050,ry:620,k:"r4yarrow"}
);
{const _ls=layoutSettlement;layoutSettlement=function(s){if(s&&s.deferLayout&&!s._layNow)return;return _ls.apply(this,arguments);};}
{const _gd=genDuneHomes;genDuneHomes=function(){const r=_gd.apply(this,arguments);for(const s of REALM4){s._layNow=1;layoutSettlement(s);}return r;};}
function stampRoad(a,b){
  a={x:a.x|0,y:a.y|0};b={x:b.x|0,y:b.y|0};
  if(Math.hypot(b.x-a.x,b.y-a.y)<160&&typeof routeRoad==="function"&&routeRoad(a,b))return;
  const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/120));
  let prev=a;
  for(let i=1;i<=n;i++){
    const p={x:Math.round(a.x+(b.x-a.x)*i/n),y:Math.round(a.y+(b.y-a.y)*i/n)};
    if(typeof routeRoad==="function"&&routeRoad(prev,p)){prev=p;continue;}
    let x=prev.x,y=prev.y,dx=Math.abs(p.x-x),dy=Math.abs(p.y-y),sx=x<p.x?1:-1,sy=y<p.y?1:-1,err=dx-dy,g=0;
    while(g++<5000){
      if(x>2&&y>2&&x<WW-3&&y<WH-3){const i2=y*WW+x,t=T[i2];if(t!==WALL&&t!==MTN&&t!==CLIFF)T[i2]=(t===DEEP||t===SHAL)?BRIDGE:ROAD;}
      if(x===p.x&&y===p.y)break;const e2=err*2;if(e2>-dy){err-=dy;x+=sx;}if(e2<dx){err+=dx;y+=sy;}
    }
    prev=p;
  }
}
{const _gw=genWorld;genWorld=async function(){const r=await _gw.apply(this,arguments);try{
  const link=[[24,20],[25,24],[26,24],[27,26],[28,23],[29,28],[28,24]];
  for(const [a,b] of link)if(SETS[a]&&SETS[b])stampRoad(SETS[a],SETS[b]);
}catch(e){console.warn("realm4 roads",e);}return r;};}
// border posts: sample, don't scan every tile of the larger map
findBorderPosts=function(){BORDER_POSTS=[];const step=3;for(let y=4;y<WH-4;y+=step)for(let x=4;x<WW-4;x+=step){const t=T[y*WW+x];if(t!==ROAD&&t!==BRIDGE)continue;const a=kAtTile(x,y),b=kAtTile(x+3,y),c=kAtTile(x,y+3);
  if(a===b&&a===c)continue;if(BORDER_POSTS.some(p=>Math.hypot(p.x-x,p.y-y)<36))continue;if(BORDER_POSTS.length>80)return;BORDER_POSTS.push({x,y,a,b:a!==b?b:c});}};
{const _nw=newWorld;newWorld=function(){const r=_nw.apply(this,arguments);try{if(world)world.area4=1;}catch(_){}return r;};}
// ---- round planet from the real map ----
drawSpace=function(){
  ctx.setTransform(RS,0,0,RS,0,0);ctx.imageSmoothingEnabled=false;
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#05060f");sky.addColorStop(1,"#10182c");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  for(let i=0;i<110;i++){const x=(hash2(i,3,9)*W)|0,y=(hash2(i,4,9)*H)|0,tw=0.45+0.55*Math.abs(Math.sin(frameN*0.02+i));ctx.fillStyle=i%6?"rgba(216,228,255,"+tw+")":"rgba(255,236,170,"+tw+")";ctx.fillRect(x,y,i%9?1:2,1);}
  const climb=clamp((P.fly-28)/40,0,1);
  const R=Math.min(W,H)*(0.46-climb*0.08);
  const cx=W*0.5,cy=H*(0.56+climb*0.03);
  if(!drawSpace.rgb){const step=40,cols=Math.ceil(WW/step),rows=Math.ceil(WH/step),rgb=[];
    for(let y=0;y<rows;y++){const row=[];for(let x=0;x<cols;x++){const t=tAt(Math.min(WW-1,x*step+step/2),Math.min(WH-1,y*step+step/2));
      row.push(t===DEEP||t===SHAL?[26,92,168]:t===SAND||t===DUNE?[214,186,96]:t===SNOW||t===ICE?[214,228,236]:t===MUD||t===REED?[92,106,58]:t===FOREST||t===TREE?[28,92,40]:[62,150,58]);}rgb.push(row);}
    drawSpace.rgb=rgb;}
  const g=drawSpace.rgb,cols=g[0].length,rows=g.length;
  const rot=(hero.x/PXW);
  const PR=96;
  if(!drawSpace.ball){drawSpace.ball=document.createElement("canvas");drawSpace.ball.width=PR*2;drawSpace.ball.height=PR*2;}
  const bg=drawSpace.ball.getContext("2d");
  const repaint=drawSpace._rot==null||Math.abs(drawSpace._rot-rot)>0.004||(frameN%3===0);
  if(repaint){drawSpace._rot=rot;bg.clearRect(0,0,PR*2,PR*2);
  for(let py=-PR;py<=PR;py+=2){const dy=py/PR;const half=Math.sqrt(Math.max(0,1-dy*dy))*PR;
    for(let px=-half;px<=half;px+=2){const dx=px/PR,dz=Math.sqrt(Math.max(0,1-dx*dx-dy*dy));
      const light=clamp(0.08+dz*dz*0.9+(dx<-0.2&&dy<-0.25&&dz>0.55?0.35:0),0.06,1.25);
      let lon=(Math.atan2(dx,dz)/Math.PI+1)/2;lon=(lon+rot)%1;if(lon<0)lon+=1;
      const lat=clamp((Math.asin(clamp(dy,-1,1))/Math.PI+0.5)*0.82+0.08,0,0.999);
      const c=g[(lat*(rows-1))|0][(lon*(cols-1))|0];
      const cloud=dz>0.62&&((px*3+py*5)&15)===0;
      const rr=cloud?Math.min(255,c[0]*light+50):c[0]*light,ggc=cloud?Math.min(255,c[1]*light+54):c[1]*light,bb=cloud?Math.min(255,c[2]*light+60):c[2]*light;
      bg.fillStyle="rgb("+(rr|0)+","+(ggc|0)+","+(bb|0)+")";bg.fillRect(PR+px,PR+py,2,2);}}}
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(cx,cy+R*0.78,R*0.7,R*0.14,0,0,7);ctx.fill();
  ctx.imageSmoothingEnabled=false;ctx.drawImage(drawSpace.ball,cx-R,cy-R,R*2,R*2);
  ctx.strokeStyle="rgba(150,210,255,.55)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R+1,0,7);ctx.stroke();
  ctx.strokeStyle="rgba(190,230,255,.28)";ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,R+3.5,0,7);ctx.stroke();
  const spr=(typeof flySprite==="function")?flySprite():chibi(HERO_LOOK,hero.d8!=null?hero.d8:hero.dir,6);
  ctx.drawImage(spr,cx-(spr.width||20)/2,cy-R-8-(spr.height||30),spr.width||20,spr.height||30);
  ctx.fillStyle="#f4f0e4";ctx.font="bold 8px system-ui";ctx.textAlign="center";
  ctx.fillText(P.fly>=60?"High orbit":"Above the sky",cx,16);
  ctx.fillText("ALT "+(P.fly|0),cx,28);
};
// altitude and the nearest town, only while still in the sky and not in orbit
{const _d=draw;draw=function(){const r=_d.apply(this,arguments);try{
  if(!(P&&P.fly>0&&P.fly<28&&hero&&state==="play"&&!room))return r;
  ctx.save();ctx.setTransform(RS,0,0,RS,0,0);ctx.font="bold 8px system-ui";ctx.textAlign="left";
  ctx.fillStyle="#1a120c";ctx.fillRect(8,8,78,22);ctx.fillStyle="#ffe6b0";ctx.fillText("ALT "+(P.fly|0),12,16);
  const spd=1+Math.min(5.5,P.fly/6);ctx.fillText("SPD x"+spd.toFixed(1),12,26);
  let best=null,bd=1e12;for(const s of SETS){if(s.island)continue;const d=Math.hypot(s.x*TILE-hero.x,s.y*TILE-hero.y);if(d<bd){bd=d;best=s;}}
  if(best&&bd>80){const a=Math.atan2(best.y*TILE-hero.y,best.x*TILE-hero.x);ctx.fillStyle="#ffe08a";ctx.beginPath();ctx.arc(W-28,28,10,0,7);ctx.fill();ctx.fillStyle="#3a2410";ctx.beginPath();ctx.moveTo(W-28+Math.cos(a)*7,28+Math.sin(a)*7);ctx.lineTo(W-28+Math.cos(a+2.4)*4,28+Math.sin(a+2.4)*4);ctx.lineTo(W-28+Math.cos(a-2.4)*4,28+Math.sin(a-2.4)*4);ctx.fill();
    ctx.fillStyle="#fff6d8";ctx.textAlign="right";ctx.fillText(best.name+" "+(bd/TILE|0)+"t",W-44,24);}
  ctx.restore();}catch(_){}return r;};}
window.__REALM4={towns:REALM4.map(s=>s.name),kingdoms:REALM4_K.map(k=>k.name),ww:WW,wh:WH,area:(WW*WH)/(V72_WW*V72_WH)};
