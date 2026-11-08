// ===== v73 LOOK: original tiles in the spirit of readable town paths (clean contrast, one scale)
// and shaded wilds (layered grass, round canopies, a pitched roof with an eave). Not a palette swap.
function lookGrass(g,v,base,dark,mid,tip){
  pxR(g,0,0,16,16,base);
  for(let x=0;x<16;x++){
    if(((x*3+v)&3)===0)continue;
    const h=3+((hash2(x,v,11)*9)|0);
    const c=(x+v)%5===0?dark:(x%2?mid:base);
    pxR(g,x,16-h,1,h,c);
    if(h>4)pxR(g,x,16-h,1,1,tip);
  }
  for(let i=0;i<3;i++)pxR(g,(hash2(i,v,27)*14)|0,(hash2(i,v,28)*12)|0,2,2,i&1?dark:mid);
  if((v%4)===0){const x=2+((hash2(v,3,19)*10)|0),y=3+((hash2(v,4,19)*8)|0),fl=["#fff6c8","#ffd0dc","#ffe08a"][v%3];
    pxR(g,x,y,1,1,fl);pxR(g,x-1,y,1,1,fl);pxR(g,x+1,y,1,1,fl);pxR(g,x,y-1,1,1,"#3a8a28");}
}
function lookPath(g,v){
  pxR(g,0,0,16,16,"#e7c98a");
  for(let i=0;i<6;i++){const x=(hash2(i,v,71)*14)|0,y=(hash2(i,v,72)*14)|0;
    pxR(g,x,y,2,1,i&1?"#f6e4b4":"#c9a45e");}
  pxR(g,(hash2(v,8,74)*14)|0,(hash2(v,9,74)*14)|0,1,1,"#a88440");
}
function lookCanopy(c,v){
  if(!c||!c.getContext)return;
  const g=c.getContext("2d");g.setTransform(2,0,0,2,0,0);g.imageSmoothingEnabled=false;g.clearRect(0,0,24,22);
  pxDisc(g,12,17,6,"rgba(20,30,16,.35)");
  pxDisc(g,12,11,8,"#2c6e22","#102410");
  pxDisc(g,8,10,5,"#3c8c30");
  pxDisc(g,16,12,5,"#1f5818");
  pxDisc(g,12,7,4,"#7ec85a");
  pxR(g,9,5,4,1,"#dff6a8");
  if((v&1)===0){pxR(g,7,12,1,1,"#e6c050");pxR(g,15,9,1,1,"#f0d878");}
  pxR(g,11,16,2,3,"#6a4424");
}
function lookRepaint(t){
  if(!t)return;
  // Temperate ground only. Snow, dune, and swamp sets keep their own colors.
  polRepaint(t[GRASS],(g,v)=>lookGrass(g,v,"#2f7a2c","#1c541c","#46a238","#c6ee88"));
  polRepaint(t[FLOWER],(g,v)=>lookGrass(g,v,"#2f7a2c","#1c541c","#46a238","#c6ee88"));
  polRepaint(t[FOREST],(g,v)=>{lookGrass(g,v,"#245e28","#163e1c","#3a8a34","#9ed070");
    for(let i=0;i<5;i++)pxR(g,(hash2(i,v,41)*14)|0,(hash2(i,v,42)*14)|0,2,1,["#6a4428","#c47830","#3a6828"][i%3]);});
  if(t.canopy)t.canopy.forEach(lookCanopy);
  polRepaint(t[ROAD],lookPath);
  polRepaint(t[COBBLE],lookPath);
}
{const _mt=makeTiles;makeTiles=function(season){const t=_mt(season);try{lookRepaint(t);}catch(e){console.warn("look73",e);}return t;};}
// Pitched roof: a ridge at the top, widening to an eave. Replaces the flat roof block.
roofDraw=function(g,x,y,w,h,R,style){
  const OL="#241810",ridge=Math.max(8,Math.floor(w*0.22));
  for(let r=0;r<h;r++){
    const t=h<=1?1:r/(h-1),inset=Math.round((1-t)*(w-ridge)/2),ww=Math.max(2,w-inset*2);
    let col=R[0];
    if(r<2)col=R[2]||R[0];
    else if(style==="thatch")col=r%3?R[1]:R[0];
    else if(r%3===2)col=R[1]||R[0];
    pxR(g,x+inset,y+r,ww,1,col);
    pxR(g,x+inset,y+r,1,1,OL);pxR(g,x+inset+ww-1,y+r,1,1,OL);
    if(style!=="thatch"&&r%3===1)for(let k=inset+2;k<inset+ww-2;k+=5)pxR(g,x+k,y+r,2,1,R[1]||"#6a3020");
    if(style==="thatch"&&r%2===0)pxR(g,x+inset+1,y+r,Math.max(1,ww-2),1,r%4?R[2]:R[1]);
  }
  pxR(g,Math.max(0,x-1),y+h-1,w+2,2,"rgba(20,10,8,.45)");
  pxR(g,x+Math.floor((w-ridge)/2),y,ridge,2,R[2]||"#fff0c8");
};
