const {test,expect}=require("@playwright/test");
// held-out phrasings written AFTER tuning; reported honestly, loose threshold
const H=[["sup dude","greet"],["hey hey","greet"],["evening!","greet"],["catch you later","bye"],["i must go now","bye"],["peace out bye","bye"],["you are a fool","insult"],["ur so dumb lol","insult"],["get lost","insult"],
["ur gorgeous","flirt"],["can i take you on a date","flirt"],["u r so cute","flirt"],["thanks a lot","compliment"],["you're brilliant","compliment"],["wheres the pub","where","place"],["where is the blacksmith","where"],["which way is lakemere","where","town"],
["how do i get to the docks","where","place"],["how much is a potion","buy"],["do u sell fish","buy"],["need a hand with anything?","quest"],["got a job for me","quest"],["whats new","rumor"],["heard anything interesting","rumor"],
["do u have a husband","family"],["any brothers or sisters","family"],["what's ur trade","job"],["whats ur age","age"],["who r u","name"],["is it snowing","weather"],["what hour is it","time"],["how r u","mood"],["you alright?","mood"],
["what r u up to","doing"],["tell me about the ancient relic","seeker"],["qwerty uiop","fallback"]];
test("v40 NLU held-out accuracy (reported)",async({page})=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(H=>{const B=__BA,n=B.npcs.find(m=>m.alive&&m.role!=="child"&&m.s===0);let ok=0;const bad=[];for(const [t,w,et] of H){const p=B.nlParse(t,n);const g=p.intents[0]||"fallback";if(g===w&&(!et||p.ents.some(e=>e.t===et)))ok++;else bad.push([t,w,g]);}return{acc:ok/H.length,n:H.length,bad};},H);
 console.log("HOLDOUT accuracy",(r.acc*100).toFixed(1)+"% on",r.n,JSON.stringify(r.bad));expect(r.acc).toBeGreaterThanOrEqual(0.75);});
