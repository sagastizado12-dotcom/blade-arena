const CACHE="blade-realm-1791992999";
const FILES=["./","index.html","game.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png",
"assets/scorchrat.png","assets/thornback.png","assets/umbrawl.png","assets/voltusk.png","assets/gloomote.png","assets/fluffin.png","assets/puffalo.png","assets/mossnail.png","assets/lilyleap.png","assets/sprigling.png","assets/pondhop.png","assets/tidemaw.png","assets/grovegiant.png","assets/dragon_fire.png","assets/dragon_frost.png","assets/dragon_storm.png","assets/dragon_forest.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{const c=res.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return res;}).catch(()=>caches.match("index.html"))));});
