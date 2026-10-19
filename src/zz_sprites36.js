// ===== v36 MALE BASE (original pixel art; proportions only inspired by a reference sheet): slimmer figure, neck, longer legs,
// round soft-shaded head, 4-tone light-from-top-left, dark outline; 4 directions x 4-frame walk. Always fully clothed. =====
{const _old=chibi;chibi=function(L,dir,frame){if(!L||L.fem||L.king||L.cls==="child"||(L.race&&L.race!=="human")||window.__oldSprites)return _old(L,dir,frame);
  const key="m36|"+JSON.stringify(L)+"|"+dir+"|"+frame;let c=chibiCache.get(key);if(c)return c;
  const img={w:CW,h:CHH,data:new Uint8ClampedArray(CW*CHH*4)};const P2=(x,y,col)=>{if(col)px(img,x,y,col);},R=(x,y,w,h,col)=>{if(col&&w>0&&h>0)fillRect(img,x,y,w,h,col);};
  const SB=(x,y,w,h,t)=>{R(x,y,w,h,t[1]);R(x,y,1,h,t[0]);R(x+w-1,y,1,h,t[2]);R(x,y+h-1,w,1,t[2]);P2(x+w-1,y+h-1,t[3]);};
  const C=CLS[L.cls]||CLS.villager,eld=!!L.elder;const cl=T4(L.cloth&&!C.armor?L.cloth:C.cloth),sk=T4(L.skin||[240,200,170]),hr=T4(L.hair||[80,50,30]);
  const side=dir===1||dir===2,back=dir===3,front=dir===0,L2=dir===1;const X=x=>L2?CW-1-x:x; // left = mirrored geometry, but drawn natively
  const ph=frame>=10&&frame<18?frame-10:-1;const q=ph>=0?Math.floor(ph/2):frame===1?0:frame===2?2:-1;
  const sit=frame===3,atk=frame===4,drink=frame===5,cast=frame===6,hurt=frame===7;
  const hy=1+(eld?1:0)+(hurt?1:0),by=11+(eld?1:0),ly=by+8;const metal=T4(METAL),boot=T4(C.boots||[86,56,38]);
  const pantBase=C.armor?[118,118,138]:[[78,66,92],[70,80,100],[96,78,58],[60,70,60]][((L.cloth?L.cloth[0]:0)+(L.hair?L.hair[0]:0))%4];const pant=T4(pantBase);
  const RX=(x,y,w,h,col)=>R(L2?CW-x-w:x,y,w,h,col),SBX=(x,y,w,h,t)=>{if(L2){x=CW-x-w;}SB(x,y,w,h,t);},PX=(x,y,col)=>P2(X(x),y,col);
  const capeC=C.cape||C.cloak;
  if(capeC&&(back||side)){const t=T4(capeC);const len=C.cape?13:10;if(back){}else SBX(5,by+1,4,len-1,t);}
  // legs: longer, separated, boots; 4-frame stride
  if(sit){SB(6,ly,8,2,pant);R(6,ly+2,3,3,pant[1]);R(11,ly+2,3,3,pant[1]);SB(5,ly+5,4,2,boot);SB(11,ly+5,4,2,boot);}
  else if(C.robe){const t=cl;for(let i=0;i<9;i++){const w=10+(i>>2);SB(10-(w>>1),by+7+i,w,1,t);}const fo=side?(q===0?2:q===2?-2:0):0;SBX(7+fo,by+16,3,2,boot);SBX(10-fo,by+16,3,2,boot);}
  else if(side){const st=q===0||q===2,fx=q===0?3:q===2?-3:0;
    // far leg (darker) then near leg; knees bend on stride
    SBX(9-fx,ly,3,6,T4(pant[2]));SBX(9-fx+(fx>0?-1:fx<0?1:0),ly+6,4,2,T4(boot[2]));
    SBX(9+fx,ly,3,6,pant);SBX(9+fx+(fx>0?1:fx<0?0:0),ly+6,4,2,boot);if(st)PX(9+fx+(fx>0?3:0),ly+7,boot[3]);}
  else{const lL=q===0?1:0,lR=q===2?1:0;SB(6,ly,3,6-lL,pant);SB(11,ly,3,6-lR,pant);R(9,ly,2,2,pant[2]);SB(5,ly+6-lL,4,2,lL?T4(boot[2]):boot);SB(11,ly+6-lR,4,2,lR?T4(boot[2]):boot);}
  // torso: shoulders taper to waist, collar, sleeves
  const tor=C.armor?metal:cl;
  if(side){SBX(7,by,7,8,tor);RX(8,by,4,1,tor[0]);}else{SB(5,by,10,3,tor);SB(6,by+3,8,5,tor);R(6,by,8,1,tor[0]);}
  if(!C.armor&&!back&&!C.robe){if(front){R(8,by,4,1,sk[1]);P2(9,by+1,sk[2]);P2(10,by+1,sk[2]);R(9,by+2,2,3,cl[2]);}else RX(12,by,2,1,sk[1]);}
  if(C.armor&&front){R(7,by+1,6,1,metal[0]);R(9,by+2,2,4,T4(C.cloth)[1]);}
  if(C.apron&&!back){const t=T4([244,240,228]);if(front)SB(7,by+3,6,8,t);else SBX(11,by+3,3,8,t);}
  if(C.trim&&front){R(9,by,2,C.robe?15:8,T4(C.trim)[1]);}
  if(C.fur){const t=T4(C.fur);R(4,by,12,2,t[1]);R(4,by,12,1,t[0]);}
  R(side?7:6,by+7,side?7:8,1,[86,56,30]);if(front&&!C.robe)P2(9,by+7,[226,196,90]);
  if(C.pauld){SB(3,by,3,2,metal);SB(14,by,3,2,metal);}
  // arms with sleeves + hands; swing opposite to legs
  const armC=C.bare?sk:C.armor?metal:cl;let hand=null;
  if(side){const sw=q===0?-2:q===2?2:0;
    if(atk){SBX(11,by+2,6,2,armC);RX(17,by+2,2,2,sk[1]);hand=[X(18),by+2,"fwd"];}
    else if(cast){SBX(10,by-4,2,6,armC);RX(10,by-5,2,1,sk[1]);hand=[X(10),by-5,"up"];}
    else if(drink){SBX(10,by+1,2,4,armC);RX(11,by-1,2,2,sk[1]);hand=[X(12),by-1,"mouth"];}
    else{SBX(10+sw,by+1,3,7,armC);RX(10+sw,by+8,3,1,sk[1]);hand=[X(11+sw),by+8,"down"];}
    if(C.shield&&!back){const t=T4([150,60,40]);SBX(5,by+2,4,6,t);}}
  else{const sL=q===0?1:q===2?-1:0;
    if(cast){SB(2,by-4,2,6,armC);SB(16,by-4,2,6,armC);R(2,by-5,2,1,sk[1]);R(16,by-5,2,1,sk[1]);hand=[16,by-5,"up"];}
    else{SB(3,by+1,2,7-(sL>0?1:0),armC);R(3,by+8-(sL>0?1:0),2,1,sk[1]);
      if(atk&&!back){SB(15,by-3,2,5,armC);R(15,by-4,2,1,sk[1]);hand=[16,by-4,"up"];}
      else if(drink){SB(14,by+1,2,3,armC);R(13,by,2,2,sk[1]);hand=[14,by-1,"mouth"];}
      else{SB(15,by+1,2,7-(sL<0?1:0),armC);R(15,by+8-(sL<0?1:0),2,1,sk[1]);hand=[16,by+8,"down"];}}
    if(C.shield&&front){const t=T4([150,60,40]);SB(1,by+2,4,6,t);}}
  if(back&&capeC){const t=T4(capeC);const len=C.cape?14:10;SB(4,by,12,len,t);R(5,by,10,1,t[0]);R(9,by+2,1,len-3,t[2]);}
  // neck + round head with soft shading
  R(side?X(9)-(L2?1:0):8,by-1,side?3:4,1,sk[2]);
  const hw=side?8:9,hx=side?(L2?CW-6-hw:6):5;R(hx+1,hy,hw-2,1,sk[1]);R(hx,hy+1,hw,7,sk[1]);R(hx+1,hy+8,hw-2,1,sk[2]);R(hx,hy+1,1,6,sk[0]);R(hx+hw-1,hy+2,1,6,sk[2]);R(hx+1,hy+1,3,2,sk[0]);
  if(!back){const ey=hy+4;
    if(front){if(hurt){P2(7,ey+1,[30,20,30]);P2(12,ey+1,[30,20,30]);}else{R(7,ey,2,2,[250,250,250]);R(11,ey,2,2,[250,250,250]);R(8,ey,1,2,[24,16,28]);R(11,ey,1,2,[24,16,28]);P2(8,ey+1,L.eye||[60,110,190]);P2(11,ey+1,L.eye||[60,110,190]);}
      R(7,ey-1,2,1,hr[2]);R(11,ey-1,2,1,hr[2]);P2(9,ey+2,sk[2]);R(9,ey+3,2,1,shade(sk[2],.85));if(eld){R(7,ey+2,1,1,sk[2]);R(12,ey+2,1,1,sk[2]);}
      P2(5,ey+1,sk[2]);P2(14,ey+1,sk[2]);}
    else{const ex=X(12);if(!hurt){RX(12,ey,2,2,[250,250,250]);PX(13,ey,[24,16,28]);PX(13,ey+1,L.eye||[60,110,190]);}RX(12,ey-1,2,1,hr[2]);PX(14,ey+2,sk[2]);RX(13,ey+3,1,1,shade(sk[2],.85));SBX(9,ey,2,3,sk);PX(9,ey+1,sk[2]);}
    if(L.beard){if(front){SB(6,hy+6,8,3,hr);R(8,hy+7,4,1,sk[2]);}else SBX(10,hy+6,4,3,hr);}}
  // hair
  const st=L.style,hood=C.hood,helm=C.helm;
  if(!helm&&!hood&&!(st==="bald"&&!back)){
    if(back){SB(4,hy,12,8,hr);R(5,hy+1,4,1,hr[0]);}
    else if(side){SBX(5,hy-1,9,3,hr);SBX(5,hy+1,4,5,hr);RX(6,hy-1,4,1,hr[0]);}
    else{SB(4,hy-1,12,3,hr);R(5,hy-1,6,1,hr[0]);R(4,hy+2,1,4,hr[1]);R(15,hy+2,1,4,hr[2]);R(5,hy+2,3,1,hr[1]);R(11,hy+2,3,1,hr[1]);}
    if(st==="hero"){for(const [x,y] of [[4,-3],[7,-4],[10,-4],[13,-3],[15,-1],[3,-1]])RX(x,hy+y,2,3,hr[1]),PX(x,hy+y,hr[0]);if(front){R(8,hy+2,3,2,hr[1]);}}
    if(st==="spiky")for(const x of [4,7,10,13])RX(x,hy-3,2,2,hr[1]);
    if(st==="long"){if(side)SBX(5,hy+2,3,9,hr);else{SB(3,hy+1,2,9,hr);SB(15,hy+1,2,9,hr);if(back)SB(4,hy+7,12,4,hr);}}
    if(st==="pony"){if(side)SBX(3,hy+1,3,7,hr);else if(back)SB(8,hy+3,4,9,hr);}
    if(st==="bun"){SB(7,hy-4,6,3,hr);}}
  if(hood){const t=T4(C.cloak||C.cloth);SB(4,hy-2,12,5,t);if(!back){SB(3,hy+1,2,9,t);SB(15,hy+1,2,9,t);if(side)SBX(4,hy+1,4,8,t);}else SB(4,hy+1,12,9,t);}
  if(helm){SB(4,hy-2,12,6,metal);R(5,hy-1,10,1,metal[0]);RX(9,hy-4,2,2,[200,50,50]);if(front)R(9,hy+3,2,3,metal[2]);if(back)SB(4,hy+3,12,4,metal);}
  if(C.band&&!helm&&!hood){R(4,hy+1,12,1,T4(C.band)[1]);if(back||side)RX(back?9:4,hy+2,2,3,T4(C.band)[2]);}
  const hat=C.hat;
  if(hat&&hat.length===3){const t=T4(hat);SB(2,hy,16,2,t);SB(5,hy-3,10,3,t);SB(7,hy-5,6,2,t);RX(9,hy-7,3,2,t[1]);R(5,hy-1,10,1,[230,190,70]);}
  if(hat==="straw"){const t=T4([232,200,110]);SB(1,hy-1,18,2,t);SB(5,hy-3,10,3,t);R(5,hy-1,10,1,[190,60,50]);}
  if(hat==="cap"){const t=T4([50,90,150]);SB(4,hy-2,12,3,t);if(front)R(5,hy+1,10,1,t[2]);if(side)RX(13,hy,4,1,t[2]);}
  if(hat==="mitre"){const t=T4([245,240,225]);SB(6,hy-5,8,5,t);R(9,hy-5,2,5,[230,190,70]);}
  if(eld&&front&&L.cls!=="noble"&&!C.prop&&!L.noArm){R(17,by+2,1,15,[120,80,40]);}
  const pr=L.noArm?null:C.prop;if(pr&&hand&&!back){const [x,y,m]=hand;const blade=[[230,236,248],[180,190,210]],wood=[130,85,40],s=L2?-1:1;
    if(pr==="sword"){if(m==="fwd"){R(L2?x-5:x,y,6,1,blade[0]);R(L2?x-5:x,y+1,6,1,blade[1]);}else{R(x,y-8,1,8,blade[0]);R(x+s,y-8,1,8,blade[1]);R(x-1,y,3,1,[200,160,60]);}}
    if(pr==="dagger"){R(x,y-4,1,4,blade[0]);R(x-1,y,3,1,[120,80,40]);}
    if(pr==="staff"){R(x,y-12,1,17,wood);R(x-1,y-14,3,3,[120,220,255]);}
    if(pr==="spear"){R(x,y-13,1,18,wood);R(x-1,y-15,3,2,blade[0]);}
    if(pr==="axe"){R(x,y-8,1,10,wood);SB(L2?x-4:x+1,y-9,4,5,T4([200,205,215]));}
    if(pr==="hammer"){R(x,y-5,1,7,wood);SB(x-1,y-8,4,3,T4([150,150,160]));}
    if(pr==="bow"){for(let i=0;i<11;i++)P2(x+s*(1+(i>1&&i<9?1:0)),y-8+i,[140,90,40]);}
    if(pr==="mug"){SB(x-1,y-2,3,3,T4([150,100,50]));R(x-1,y-3,3,1,[255,250,230]);}
    if(pr==="club"){R(x,y-7,2,8,[120,80,40]);SB(x-1,y-10,4,4,T4([100,65,30]));}}
  if(pr==="sword"&&back){R(12,by-2,1,10,[200,206,220]);R(11,by+1,3,1,[200,160,60]);}
  const src=new Uint8ClampedArray(img.data);const A=(x,y)=>x<0||y<0||x>=CW||y>=CHH?0:src[(y*CW+x)*4+3];
  for(let y=0;y<CHH;y++)for(let x=0;x<CW;x++){const i=(y*CW+x)*4;if(!src[i+3]&&(A(x-1,y)||A(x+1,y)||A(x,y-1)||A(x,y+1))){img.data[i]=26;img.data[i+1]=14;img.data[i+2]=22;img.data[i+3]=255;}}
  c=mkCanvas(CW,CHH);c.getContext("2d").putImageData(new ImageData(img.data,CW,CHH),0,0);chibiCache.set(key,c);return c;};}
