const {test,expect}=require("@playwright/test");
const CASES=[
["hello","greet"],["hi there!","greet"],["heyyy","greet"],["helo","greet"],["good morning","greet"],["howdy partner","greet"],["yo","greet"],["hiya","greet"],["greetings, friend","greet"],["well met","greet"],
["bye","bye"],["goodbye!","bye"],["cya","bye"],["see you later","bye"],["take care","bye"],["gotta go","bye"],["farewell friend","bye"],["l8r","bye"],["good night","bye"],["bai","bye"],
["you're stupid","insult"],["u r an idiot","insult"],["ur ugly","insult"],["shut up","insult"],["you suck","insult"],["stoopid villager","insult"],["what a moron","insult"],["i hate you","insult"],["go away loser","insult"],["you smell bad","insult"],
["you're beautiful","flirt"],["ur cute","flirt"],["will you marry me?","flirt"],["kiss me","flirt"],["you are gorgeous","flirt"],["wanna go on a date?","flirt"],["i love you","flirt"],["be mine","flirt"],["you're so pritty","flirt"],["handsome devil","flirt"],
["thank you","compliment"],["thx","compliment"],["you're awesome","compliment"],["nice work","compliment"],["you are kind","compliment"],["well done","compliment"],["great job","compliment"],["i appreciate it","compliment"],
["where is the inn?","where","place"],["wheres the tavern","where","place"],["wher is the shop","where","place"],["how do i get to Saltmere?","where","town"],["which way to the guild","where","place"],["where can i find a bed","where","place"],["is there a harbor here?","where","place"],["where's the castle","where","place"],["where is Highcrest","where","town"],["wat way to the market","where","place"],["where is the tavren","where","place"],["point me to the chapel","where","place"],
["what do you sell?","buy"],["i want to buy something","buy"],["how much for bread?","buy","item"],["show me your wares","buy"],["got anything for sale","buy"],["can i trade with you","buy"],
["any quests?","quest"],["do you need help?","quest"],["got any work for me","quest"],["any jobs around?","quest"],["can i help you with anything","quest"],["looking for work","quest"],["is there a bounty","quest"],
["any rumors?","rumor"],["what's the latest news","rumor"],["heard any gossip?","rumor"],["what's going on around here","rumor"],["anything new?","rumor"],["tell me a story","rumor"],
["do you have a family?","family"],["are you married?","family"],["got any kids","family"],["who is your wife","family"],["tell me about your parents","family"],["do you have children","family"],
["what do you do?","job"],["what's your job","job"],["what do you do for a living","job"],["what is your profession","job"],
["how old are you?","age"],["what's your age","age"],["hw old r u","age"],
["what's your name?","name"],["who are you?","name"],["wats ur name","name"],["introduce yourself","name"],
["how's the weather","weather"],["is it going to rain","weather"],["nice weather today","weather"],["cold out isn't it","weather"],["what season is it","weather"],
["what time is it","time"],["what day is it today","time"],["what's the date","time"],
["tell me about this town","town"],["what is this place","town"],["do you like living here","town"],
["how are you?","mood"],["hru","mood"],["how's it going","mood"],["you ok?","mood"],["how have you been","mood"],["what's up","mood"],
["what are you doing","doing"],["where are you going?","doing"],["what are you up to","doing"],["busy today?","doing"],
["have you heard of the seeker","seeker"],["tell me some ancient lore","seeker"],
["blorp zz","fallback"],["asdfgh","fallback"],["the purple banana","fallback"],
["hi! where is the inn?","greet"],["thanks, bye","compliment"],
];
test("v40 type-to-talk NLU: 100+ phrasings accuracy, entities, memory, yes/no, safety",async({page})=>{await page.addInitScript(()=>{window.__FAST=true;localStorage.setItem("realmIntroSeen","1");});await page.goto("/");await page.waitForFunction(()=>window.__READY);await page.click("#startBtn");await page.waitForFunction(()=>__BA.state==="play");
 const r=await page.evaluate(CASES=>{const B=__BA;B.closeMenu();const n=B.npcs.find(m=>m.alive&&m.role!=="child"&&m.role!=="leader"&&!m.adv&&m.s===0);const kid=B.npcs.find(m=>m.alive&&m.role==="child");
  let ok=0;const bad=[];for(const [t,want,et] of CASES){const p=B.nlParse(t,n);const got=p.intents[0]||"fallback";const eok=!et||p.ents.some(e=>e.t===et);if(got===want&&eok)ok++;else bad.push([t,want,got,p.ents.map(e=>e.t).join("/")]);}
  const o={n:CASES.length,acc:ok/CASES.length,bad};
  const multi=B.nlParse("hi! where is the inn?",n);o.multi=multi.intents.slice(0,2);
  const other=B.npcs.find(m=>m.alive&&m!==n&&m.s===0&&m.role!=="child");const fn=other.name.split(" ")[0];
  o.who=B.sayReply(n,"who is "+fn.toLowerCase()+"?").r;o.typo=B.sayReply(n,"wher is "+fn.slice(0,-1)+fn.slice(-1).repeat(2)).r;
  B.sayReply(n,"tell me about "+fn);o.carry=B.sayReply(n,"and where is "+(B.sexOf(other)==="F"?"she":"he")+"?").r;
  o.town=B.sayReply(n,"wheres saltmere").r;o.yes=B.sayReply(n,"yes").r;
  o.kid=B.sayReply(kid,"ur so hot, kiss me").r;o.slur=B.sayReply(n,"you f4ggot").k;o.name=other.name;
  return o;},CASES);
 console.log("NLU accuracy",(r.acc*100).toFixed(1)+"%","on",r.n,"phrasings; misses:",JSON.stringify(r.bad));
 expect(r.n).toBeGreaterThanOrEqual(100);expect(r.acc).toBeGreaterThanOrEqual(0.9);expect(r.multi).toEqual(["greet","where"]);
 expect(r.who).toContain(r.name);expect(r.typo).toContain(r.name.split(" ")[0]);expect(r.carry).toContain(r.name.split(" ")[0]);expect(r.town).toMatch(/Saltmere/);expect(r.yes).toMatch(/road|Safe/);
 expect(r.kid).not.toMatch(/blush|love|drink|heart/i);expect(r.slur).toBe("slur");});
