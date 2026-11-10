// Terrain is deterministic. The first visit builds it; later visits in this
// browser read the finished map back from IndexedDB and skip that work.
const WORLD_REV="8768x6752-2";
function bootProgress(p,msg){const bar=document.getElementById("bootfill"),el=document.getElementById("bootmsg");
  if(bar)bar.style.width=Math.max(0,Math.min(100,p))+"%";if(el&&msg)el.textContent=msg;}
window.__bootProgress=bootProgress;
function rleEncode(src){let runs=0,last=src[0],n=1;for(let i=1;i<=src.length;i++){if(i<src.length&&src[i]===last&&n<65535)n++;else{runs++;if(i<src.length){last=src[i];n=1;}}}
  const out=new Uint8Array(runs*3);last=src[0];n=1;let o=0;const put=()=>{out[o++]=n&255;out[o++]=(n>>8)&255;out[o++]=last;};
  for(let i=1;i<=src.length;i++){if(i<src.length&&src[i]===last&&n<65535)n++;else{put();if(i<src.length){last=src[i];n=1;}}}return out;}
function rleDecode(src,dst){let o=0;for(let i=0;i<src.length;i+=3){const n=src[i]|src[i+1]<<8;const t=src[i+2];dst.fill(t,o,o+n);o+=n;}return o===dst.length;}
function sparsePack(arr,signed){let c=0;for(let i=0;i<arr.length;i++)if(arr[i])c++;const idx=new Uint32Array(c),val=signed?new Int16Array(c):new Uint8Array(c);let k=0;for(let i=0;i<arr.length;i++)if(arr[i]){idx[k]=i;val[k++]=arr[i];}return {idx,val};}
function sparseUnpack(dst,pack){dst.fill(0);const idx=pack.idx,val=pack.val;for(let i=0;i<idx.length;i++)dst[idx[i]]=val[i];}
function idbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open("blade-world",1);r.onupgradeneeded=()=>{r.result.createObjectStore("pack");};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function idbGet(db,key){return new Promise((res,rej)=>{const q=db.transaction("pack").objectStore("pack").get(key);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error);});}
function idbPut(db,key,val){return new Promise((res,rej)=>{const q=db.transaction("pack","readwrite").objectStore("pack").put(val,key);q.onsuccess=()=>res();q.onerror=()=>rej(q.error);});}
function refill(dst,src){if(!dst||!src)return;dst.length=0;for(let i=0;i<src.length;i++)dst.push(src[i]);}
function worldSnapshot(){const walls=typeof WALLS!=="undefined"?WALLS:[],gates=typeof GATES!=="undefined"?GATES:[],towers=typeof TOWERS!=="undefined"?TOWERS:[];
  return {rev:WORLD_REV,t:rleEncode(T),occ:sparsePack(OCC,1),riv:sparsePack(RIVERM,0),leg:sparsePack(LEGW,0),
    json:JSON.stringify({buildings,objects,waystones,piers,props:typeof PROPS!=="undefined"?PROPS:[],cabins:typeof CABINS!=="undefined"?CABINS:[],
      walls,gates,towers,castles:typeof CASTLES!=="undefined"?CASTLES:[],posts:typeof BORDER_POSTS!=="undefined"?BORDER_POSTS:[],
      dunes:typeof DUNE_HOMES!=="undefined"?DUNE_HOMES:[],isthmi:typeof ISTHMI!=="undefined"?ISTHMI:[],lookouts:typeof LOOKOUTS!=="undefined"?LOOKOUTS:[]})};}
function worldRestore(pack){if(!pack||pack.rev!==WORLD_REV||!rleDecode(pack.t,T))return false;sparseUnpack(OCC,pack.occ);sparseUnpack(RIVERM,pack.riv);sparseUnpack(LEGW,pack.leg);
  const j=JSON.parse(pack.json);
  buildings=j.buildings;objects=j.objects;waystones=j.waystones;piers=j.piers;
  if(typeof PROPS!=="undefined"){PROPS=j.props;}
  refill(CABINS,j.cabins);refill(WALLS,j.walls);refill(GATES,j.gates);refill(TOWERS,j.towers);refill(CASTLES,j.castles);
  if(typeof BORDER_POSTS!=="undefined")BORDER_POSTS=j.posts;
  refill(DUNE_HOMES,j.dunes);if(typeof ISTHMI!=="undefined")ISTHMI=j.isthmi;refill(LOOKOUTS,j.lookouts);
  if(typeof WALLIDX!=="undefined"){WALLIDX.clear();for(const w of WALLS)WALLIDX.set(w.y*WW+w.x,w.i);}
  if(typeof retargetBiomes==="function")retargetBiomes();
  if(typeof reindexSettlements==="function")reindexSettlements();
  if(typeof placeCastle==="function")placeCastle();
  window.__FROMCACHE=1;return true;}
function reindexSettlements(){const byId=new Map();for(const s of SETS){s.bIdx=[];byId.set(s.id,s);}
  for(const b of buildings){if(!b||b.s==null)continue;const s=byId.get(b.s);if(s)s.bIdx.push(b.id);}}
async function loadWorldPack(){const res=await fetch("worldpack.bin");if(!res.ok)return false;const buf=await res.arrayBuffer();const dv=new DataView(buf);
  if(dv.getUint32(0,true)!==0x42375736)return false;const rl=dv.getUint32(4,true);const t=new Uint8Array(buf,8,rl);const jl=dv.getUint32(8+rl,true);
  const meta=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,12+rl,jl)));
  if(meta.rev!==WORLD_REV)return false;
  return worldRestore({rev:meta.rev,t,occ:meta.occ,riv:meta.riv,leg:meta.leg,json:JSON.stringify(meta.world)});
}
async function worldCacheLoad(){try{const db=await idbOpen();const pack=await idbGet(db,"world");db.close();return worldRestore(pack);}catch(e){return false;}}
window.__worldSnapshot=()=>{const snap=worldSnapshot();const t=snap.t;let s="";const CH=0x8000;for(let i=0;i<t.length;i+=CH)s+=String.fromCharCode.apply(null,t.subarray(i,Math.min(t.length,i+CH)));
  const plain=a=>Array.from(a);
  const meta={rev:snap.rev,occ:{idx:plain(snap.occ.idx),val:plain(snap.occ.val)},riv:{idx:plain(snap.riv.idx),val:plain(snap.riv.val)},leg:{idx:plain(snap.leg.idx),val:plain(snap.leg.val)},world:JSON.parse(snap.json)};
  return {b64:btoa(s),meta:JSON.stringify(meta)};};
function worldCacheSave(){setTimeout(()=>{try{const pack=worldSnapshot();idbOpen().then(db=>idbPut(db,"world",pack).then(()=>{db.close();window.__CACHED=1;}).catch(()=>db.close()));}catch(e){console.warn("cache",e);}},400);}
