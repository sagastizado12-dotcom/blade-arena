// Player, townspeople, monsters, spells, and flight. Off-screen people
// only update a few at a time.

import { TILE, worldPlan, START_TOWN, hash } from "./layout.js";
import { sample } from "./terrain.js";
import { initRealm, tickRealm, dungeonBlocked, dungeonPuzzle, dungeonHurt, stepDungeonStairs, romance, tickDungeonFoes, enterCaveDungeon } from "./realm.js";

export const SPELLS = ["fire", "thunder", "heal", "air"];
export const SPELL_INFO = {
  fire: { name: "Fire", mp: 12, dmg: lv => 2 + (lv / 2 | 0) },
  thunder: { name: "Thunder", mp: 22, dmg: lv => 2 + (lv / 2 | 0) },
  heal: { name: "Heal", mp: 20, heal: lv => 2 + (lv / 2 | 0) },
  air: { name: "Air", mp: 10, dmg: lv => 1 + (lv / 2 | 0) }
};
export function spellLevel(xp) { return Math.max(1, Math.min(5, 1 + ((xp | 0) / 6 | 0))); }
export function flyLevel(xp) { return Math.max(1, Math.min(5, 1 + ((xp | 0) / 8 | 0))); }
export const FLY = [
  { alt: 10, speed: 150, trails: 3, burst: 8 },
  { alt: 16, speed: 210, trails: 5, burst: 12 },
  { alt: 24, speed: 280, trails: 8, burst: 18 },
  { alt: 32, speed: 350, trails: 11, burst: 24 },
  { alt: 42, speed: 430, trails: 14, burst: 30 }
];
const FIRE = [
  { n: 8, r: 18, layers: 1, flash: 0, shake: 0 },
  { n: 14, r: 28, layers: 2, flash: 0, shake: 0 },
  { n: 22, r: 40, layers: 2, flash: 0, shake: 0 },
  { n: 34, r: 56, layers: 3, flash: 0.14, shake: 2 },
  { n: 48, r: 74, layers: 3, flash: 0.24, shake: 4 }
];
const HEAL_N = [8, 14, 20, 28, 36];
const AIR_N = [1, 2, 3, 4, 6];

const NAMES = ["Mara", "Bren", "Sela", "Tarin", "Nessa", "Olm", "Ida", "Cal", "Pia", "Jory", "Esme", "Ned", "Hana", "Torin", "Lark", "Wynn", "Bram", "Ivy", "Quill", "Soren"];
const KIDS = ["Pip", "Nell", "Tam", "Dot", "Bram", "Lark", "Wren", "Moss"];
const TRAITS = ["cheerful", "gruff", "shy", "calm", "proud"];

const ROOM = {
  house: { w: 11, h: 8, furn: [["bed", 1, 2], ["shelf", 4, 2], ["table", 6, 3], ["chair", 6, 4], ["hearth", 8, 2], ["rug", 4, 5], ["plant", 1, 5], ["pot", 2, 5], ["chest", 8, 5]] },
  inn: { w: 11, h: 8, furn: [["counter", 1, 2], ["shelf", 4, 2], ["hearth", 8, 2], ["table", 3, 4], ["table", 6, 4], ["chair", 3, 5], ["chair", 6, 5], ["bed", 8, 5], ["rug", 4, 6], ["plant", 1, 5], ["pot", 2, 6]] },
  shop: { w: 11, h: 8, furn: [["counter", 1, 2], ["shelf", 4, 2], ["shelf", 7, 2], ["pot", 1, 5], ["plant", 8, 5], ["rug", 4, 5], ["chest", 8, 4]] },
  temple: { w: 11, h: 8, furn: [["altar", 4, 2], ["chair", 2, 4], ["chair", 7, 4], ["rug", 4, 5], ["plant", 1, 5], ["pot", 8, 5]] },
  castle: { w: 11, h: 8, furn: [["throne", 4, 2], ["table", 1, 4], ["chair", 1, 5], ["rug", 4, 5], ["hearth", 8, 2], ["plant", 8, 5]] },
  manor: { w: 11, h: 8, furn: [["bed", 1, 2], ["bed", 8, 2], ["shelf", 4, 2], ["hearth", 6, 2], ["table", 3, 4], ["chair", 3, 5], ["rug", 4, 5], ["plant", 1, 5], ["pot", 8, 5], ["chest", 8, 4]] },
  keep: { w: 12, h: 9, furn: [["throne", 4, 2], ["brazier", 1, 3], ["brazier", 9, 3]] },
  hall: { w: 11, h: 9, furn: [["table", 3, 3], ["chair", 3, 5], ["shelf", 7, 2]] },
  trader: { w: 11, h: 9, furn: [["counter", 1, 2], ["shelf", 6, 2], ["brazier", 8, 6]] },
  barrack: { w: 11, h: 9, furn: [["bed", 2, 2], ["bed", 6, 2], ["table", 3, 5]] },
  cave: { w: 11, h: 8, furn: [["chest", 7, 3]] }
};

function tileOf(px, py) { return [px / TILE | 0, py / TILE | 0]; }

export function feetBlocked(px, py, flying) {
  if (flying) return false;
  const pts = [[px - 3, py - 1], [px + 3, py - 1], [px - 3, py + 2], [px + 3, py + 2]];
  for (let i = 0; i < 4; i++) {
    const s = sample(pts[i][0] / TILE | 0, pts[i][1] / TILE | 0);
    if (s.solid) return true;
  }
  return false;
}

function moveFeet(x, y, dx, dy, flying) {
  const dist = Math.max(Math.abs(dx), Math.abs(dy));
  const steps = Math.max(1, Math.ceil(dist / 3));
  const sx = dx / steps, sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    if (!feetBlocked(x + sx, y, flying)) x += sx;
    if (!feetBlocked(x, y + sy, flying)) y += sy;
  }
  return [x, y];
}

function planOfTown(id, plans) {
  for (let i = 0; i < plans.length; i++) if (plans[i].town.id === id) return plans[i];
  return plans[0];
}

function doorPx(b) { return [b.doorX * TILE + 8, (b.doorY + 1) * TILE + 8]; }

function makePeople(plans) {
  const npcs = [];
  let n = 0;
  for (const plan of plans) {
    const t = plan.town;
    const homes = plan.buildings.filter(b => b.kind === "house" || b.kind === "cottage" || b.kind === "hut" || b.kind === "tall" || b.kind === "ell" || b.kind === "barrack" || b.kind === "manor");
    const inn = plan.buildings.find(b => b.kind === "inn" || b.kind === "trader");
    const shops = plan.buildings.filter(b => b.kind === "shop" || b.kind === "trader");
    const temple = plan.buildings.find(b => b.kind === "temple");
    const hall = plan.buildings.find(b => b.kind === "hall" || b.kind === "castle" || b.kind === "keep" || b.kind === "manor");
    const cap = t.demon ? 16 : (t.capital || t.manor) ? 40 : 6;
    const jobs = [];
    if (hall && (t.capital || t.manor)) jobs.push({ job: "ruler", b: hall });
    if (inn) jobs.push({ job: t.demon ? "trader" : "innkeeper", b: inn });
    for (const s of shops) jobs.push({ job: "shopkeeper", b: s });
    if (temple) jobs.push({ job: "priest", b: temple });
    if (hall && !jobs.some(j => j.job === "ruler")) jobs.push({ job: "guard", b: hall });
    const want = Math.min(cap, Math.max(jobs.length, homes.length ? Math.min(homes.length + 2, cap) : jobs.length));
    for (let i = 0; i < want; i++) {
      const spec = jobs[i] || { job: t.harbor && i % 4 === 0 ? "fisher" : "villager", b: homes[i % Math.max(1, homes.length)] || hall || plan.buildings[0] };
      const child = !spec.job || spec.job === "villager" ? (hash(n, 3, 8) % 5 === 0) : false;
      const job = child ? "child" : spec.job;
      const home = spec.b;
      const [hx, hy] = doorPx(home);
      const adult = !child;
      npcs.push({
        id: n,
        name: child ? KIDS[hash(n, 1, 2) % KIDS.length] : NAMES[hash(n, 2, 2) % NAMES.length],
        trait: TRAITS[hash(n, 4, 2) % TRAITS.length],
        job, child, age: child ? 6 + (hash(n, 5, 2) % 6) : 22 + (hash(n, 6, 2) % 30),
        town: t.id, home: home.id, work: spec.b.id,
        x: hx, y: hy, dir: 0, frame: 0, inside: false,
        pal: (hash(n, 7, 2) % 6),
        hunger: 0.3 + (hash(n, 8, 1) % 20) / 100,
        rest: 0.2, social: 0.35 + (hash(n, 9, 1) % 30) / 100, safety: 1,
        mem: { talks: 0, opinion: adult ? 42 : 55 },
        friend: null,
        bubble: 0
      });
      n++;
    }
    const locals = npcs.filter(p => p.town === t.id);
    if ((t.capital || t.manor) && !t.demon) {
      const stalls = plan.props.filter(p => p.kind === "stall");
      const crowd = locals.filter(n => n.job !== "ruler");
      const mid = Math.max(0, (stalls.length >> 1) - 6);
      for (let i = 0; i < Math.min(12, stalls.length, crowd.length); i++) {
        const s = stalls[mid + i] || stalls[i];
        crowd[crowd.length - 1 - i].x = s.x * TILE + 8;
        crowd[crowd.length - 1 - i].y = (s.y + 1) * TILE + 6;
        const shop = plan.buildings.find(b => b.kind === "shop");
        if (shop) crowd[crowd.length - 1 - i].work = shop.id;
      }
      const keep = plan.buildings.find(b => b.kind === "castle" || b.kind === "keep" || b.kind === "manor");
      if (keep) {
        for (let i = 0; i < 4 && i < locals.length; i++) {
          locals[i].job = locals[i].child ? locals[i].job : "guard";
          locals[i].x = (keep.doorX - 1 + (i % 2) * 2) * TILE + 4;
          locals[i].y = (keep.doorY + 2) * TILE + (i > 1 ? 10 : 0);
          locals[i].work = keep.id;
        }
      }
    }
    if (!t.demon && locals.length && !locals.some(p => p.child)) {
      const p = locals[locals.length - 1];
      p.child = true; p.age = 8; p.job = "child"; p.mem.opinion = 70;
    }
    for (const p of locals) {
      const other = locals.find(o => o !== p && o.child === p.child);
      if (other) p.friend = other.id;
    }
  }
  return npcs;
}

export function createState() {
  const plans = worldPlan();
  const home = planOfTown(START_TOWN, plans);
  let sx = home.town.x * TILE + 8, sy = (home.town.y + 4) * TILE + 8;
  const inn = home.buildings.find(b => b.kind === "inn") || home.buildings.find(b => b.kind === "shop");
  if (inn) { sx = inn.doorX * TILE + 8; sy = (inn.doorY + 1) * TILE + 12; }
  const spells = {};
  for (const id of SPELLS) spells[id] = { xp: 0 };
  const state = {
    plans,
    mode: "world",
    room: null,
    player: {
      x: sx, y: sy, z: 0, vz: 0, dir: 0, frame: 0, walk: 0,
      hp: 10, maxHp: 10, mp: 40, maxMp: 40, gold: 40,
      inv: { bread: 1, herb: 1 },
      spells, spell: "fire",
      fly: false, flyXp: 0, alt: 0,
      swing: 0, swingHit: false, castCd: 0, iframes: 0, dash: 0
    },
    chest: { manor: {} },
    npcs: makePeople(plans),
    monsters: seedMonsters(home),
    particles: [],
    bolts: [],
    shots: [],
    rings: [],
    bubbles: [],
    toasts: [],
    flash: null,
    shake: 0,
    min: 8 * 60,
    dlg: null,
    notice: "",
    noticeT: 0,
    npcCursor: 0,
    ambient: 0,
    spawnT: 2,
    _flown: 0
  };
  initRealm(state);
  return state;
}

function seedMonsters(plan) {
  const out = [];
  const kinds = ["boar", "boar", "lurker", "mite"];
  for (let i = 0; i < kinds.length; i++) {
    const x = (plan.town.x - 8 + i * 5) * TILE;
    const y = (plan.maxY + 3) * TILE;
    out.push(makeMonster(kinds[i], x, y, i));
  }
  return out;
}

function makeMonster(kind, x, y, salt) {
  const hp = kind === "boar" ? 8 : kind === "lurker" ? 5 : 3;
  return { id: salt + (hash(x, y, 3) % 9000), kind, x, y, hp, max: hp, dir: 0, frame: 0, hit: 0, cool: 0, homeX: x, homeY: y };
}

export function hourOf(state) { return ((state.min / 60) | 0) % 24; }

function buildingById(state, id) {
  for (const p of state.plans) for (const b of p.buildings) if (b.id === id) return b;
  return null;
}

function waypoint(state, n) {
  const hour = hourOf(state);
  const home = buildingById(state, n.home);
  const work = buildingById(state, n.work);
  const plan = state.plans.find(p => p.town.id === n.town);
  const inn = plan && (plan.buildings.find(b => b.kind === "inn") || plan.buildings.find(b => b.kind === "trader") || home);
  let goal = "wander";
  if (n.child) goal = (hour < 7 || hour >= 20) ? "sleep" : n.hunger > 0.66 ? "eat" : "play";
  else if (hour < 6 || hour >= 21) goal = "sleep";
  else if (n.hunger > 0.64) goal = "eat";
  else if (hour >= 8 && hour < 17) goal = "work";
  else if (n.social > 0.58) goal = "chat";
  n.goal = goal;
  if (goal === "sleep" && home) return doorPx(home);
  if (goal === "eat" && inn) return doorPx(inn);
  if (goal === "work" && work) return doorPx(work);
  if (goal === "play" || goal === "chat") {
    if (goal === "chat" && n.friend != null) {
      const f = state.npcs[n.friend];
      if (f && !f.inside) return [f.x, f.y];
    }
    return [plan.town.x * TILE + 8, (plan.town.y + 1) * TILE + 8];
  }
  const spot = hash(n.id, hour, 5);
  if (!plan._roads) plan._roads = [...plan.roads];
  const k = plan._roads[spot % plan._roads.length];
  if (!k) return [n.x, n.y];
  const [x, y] = k.split(",").map(Number);
  return [x * TILE + 8, y * TILE + 8];
}

function say(state, n, text) {
  if (!text || n.inside || state.mode !== "world") return;
  if (state.bubbles.length >= 4) return;
  if (state.bubbles.some(b => b.id === n.id)) return;
  const last = state.bubbles[state.bubbles.length - 1];
  if (last && last.age < 0.35) return;
  state.bubbles.push({ id: n.id, text, life: 2.6, age: 0, x: n.x, y: n.y });
  n.bubble = 2.6;
}

function lineFor(n, hour) {
  if (n.child) {
    if (n.heroKid) return "I want to be strong like you, Dad!";
    const a = ["I'm playing until supper.", "The square is the best spot.", "Look, I can hop the crack!", "Mama said stay on the street."];
    return a[hash(n.id, hour, 2) % a.length];
  }
  if (n.job === "ruler") return hour < 12 ? "The realm is quiet this morning." : "Walk the streets. They are yours to know.";
  if (n.hunger > 0.7) return "I could eat a whole loaf.";
  if (n.rest > 0.75) return "My feet want a bed.";
  if (n.trait === "gruff") return n.job === "shopkeeper" ? "Goods are on the counter." : "Mind the road.";
  if (n.trait === "shy") return "Oh. Hello.";
  if (n.trait === "proud") return n.job === "guard" ? "The gate is watched." : "Fine day for a fine town.";
  if (n.trait === "calm") return "The light is kind.";
  if (n.job === "innkeeper") return "Stew's on, if you're hungry.";
  if (n.job === "shopkeeper" || n.job === "trader") return "Bread, herbs, and a fair price.";
  if (n.job === "priest") return "The hall is open if you need quiet.";
  if (n.job === "fisher") return "The water's bright past the pier.";
  const a = ["Nice bit of weather.", "Roads are dry.", "I saw the baker earlier.", "Hear the well? It runs clear."];
  return a[hash(n.id, hour, 4) % a.length];
}

function pagesFor(state, n) {
  const hour = hourOf(state);
  const back = n.mem.talks > 2 ? " You came back." : n.mem.talks > 0 ? " Good to see you." : "";
  const warm = !n.child && n.mem.opinion > 72 ? " You are welcome at my table." : "";
  let lead = lineFor(n, hour) + back + warm;
  if (n.child) lead = lineFor(n, hour) + (n.mem.talks > 1 ? " You came to the square again!" : "");
  const pages = [lead];
  if (n.job === "innkeeper") pages.push("A bed is 10 gold. You wake full of heart.");
  if (n.job === "shopkeeper" || n.job === "trader") pages.push("Bread is 8 gold. A herb is 12.");
  if (n.job === "priest") pages.push("Sit a moment. I can mend a little of what the road took.");
  if (n.job === "ruler") pages.push("I am " + (state.plans.find(p => p.town.id === n.town).town && "") + "here if the town needs a word.");
  return pages;
}

export function choicesFor(n) {
  if (n.job === "innkeeper") return [{ id: "rest", label: "Rest (10g)" }, { id: "leave", label: "Leave" }];
  if (n.job === "shopkeeper" || n.job === "trader") return [{ id: "bread", label: "Buy bread (8g)" }, { id: "herb", label: "Buy herb (12g)" }, { id: "leave", label: "Leave" }];
  if (n.job === "priest") return [{ id: "bless", label: "Accept a blessing" }, { id: "leave", label: "Leave" }];
  if (!n.child && (n.age || 18) >= 18 && (n.mem.opinion || 0) >= 40) return [{ id: "walk", label: "Walk with me" }, { id: "leave", label: "Close" }];
  if (n.home && n.home.indexOf("manor") === -1 && false) return [];
  return [{ id: "leave", label: "Close" }];
}

export function nearNpc(state) {
  if (state.mode !== "world") {
    if (!state.room) return null;
    let best = null, bd = 26;
    for (const n of state.room.people) {
      const d = Math.hypot(n.x - state.player.x, n.y - state.player.y);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  let best = null, bd = 22;
  for (const n of state.npcs) {
    if (n.inside || n.town !== townNear(state)) continue;
    const d = Math.hypot(n.x - state.player.x, n.y - state.player.y);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

function townNear(state) {
  const tx = state.player.x / TILE | 0, ty = state.player.y / TILE | 0;
  let best = null, bd = 48;
  for (const p of state.plans) {
    const d = Math.hypot(tx - p.town.x, ty - p.town.y);
    if (d < bd) { bd = d; best = p.town.id; }
  }
  return best;
}

export function talkTo(state, n) {
  if (!n) return;
  n.mem.talks++;
  if (!n.child) n.mem.opinion = Math.min(100, n.mem.opinion + 2);
  const dx = state.player.x - n.x, dy = state.player.y - n.y;
  n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
  state.player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : (dy > 0 ? 1 : 0);
  const pages = pagesFor(state, n);
  state.dlg = { npc: n.id, name: n.name, pages, page: 0, choices: false };
}

export function advanceDlg(state) {
  const d = state.dlg;
  if (!d) return;
  if (d.page < d.pages.length - 1) { d.page++; return; }
  const n = findNpc(state, d.npc);
  const ch = n && choicesFor(n);
  if (ch && ch.length > 1 && !d.choices) { d.choices = true; return; }
  state.dlg = null;
}

export function pickChoice(state, id) {
  const d = state.dlg;
  const n = d && findNpc(state, d.npc);
  const p = state.player;
  if (id === "rest") {
    if (p.gold < 10) note(state, "Not enough gold.");
    else { p.gold -= 10; p.hp = p.maxHp; p.mp = p.maxMp; if (n && !n.child) n.mem.opinion = Math.min(100, n.mem.opinion + 6); note(state, "You sleep and wake mended."); }
  } else if (id === "bread" || id === "herb") {
    const cost = id === "bread" ? 8 : 12;
    if (p.gold < cost) note(state, "Not enough gold.");
    else { p.gold -= cost; p.inv[id] = (p.inv[id] || 0) + 1; if (n) n.mem.opinion = Math.min(100, n.mem.opinion + 4); note(state, "You tuck the " + id + " away."); }
  } else if (id === "bless") {
    p.hp = Math.min(p.maxHp, p.hp + 3);
    note(state, "A quiet warmth settles. +3 heart.");
  } else if (id === "walk") {
    romance(state, n);
  }
  state.dlg = null;
}

function findNpc(state, id) {
  if (state.room) {
    const r = state.room.people.find(n => n.id === id);
    if (r) return r;
  }
  return state.npcs.find(n => n.id === id) || null;
}

function note(state, text) {
  state.notice = text;
  state.noticeT = 2.4;
}

export function nearestDoor(state) {
  const tx = state.player.x / TILE | 0, ty = state.player.y / TILE | 0;
  let best = null, bd = 1.4;
  for (const plan of state.plans) {
    if (Math.abs(plan.town.x - tx) > 40 || Math.abs(plan.town.y - ty) > 40) continue;
    for (const b of plan.buildings) {
      const d = Math.hypot(tx - b.doorX, ty - (b.doorY + 1));
      if (d < bd) { bd = d; best = b; }
    }
  }
  return best;
}

export function enterBuilding(state, b) {
  const spec = ROOM[b.kind] || ROOM.house;
  const fam = state.family || {};
  const rank = (n) => n.heroKid ? 0 : n.id === fam.spouse ? 1 : 2;
  const people = state.npcs.filter(n => n.home === b.id).sort((a, c) => rank(a) - rank(c)).slice(0, 3);
  for (const n of people) n.inside = true;
  const placed = people.map((n, i) => ({ ...n, x: (3 + i * 3) * TILE, y: 3 * TILE, dir: 0 }));
  state.room = {
    kind: b.kind, w: spec.w, h: spec.h, furn: spec.furn.map(([kind, x, y]) => ({ kind, x, y, w: kind === "rug" ? 2 : 1, h: 1, solid: kind !== "rug" && kind !== "chair" && kind !== "plant" && kind !== "pot" })),
    people: placed, from: { x: state.player.x, y: state.player.y }, building: b.id, name: b.kind
  };
  state.player.x = (spec.w / 2 | 0) * TILE + 8;
  state.player.y = (spec.h - 2) * TILE;
  state.player.z = 0; state.player.fly = false; state.player.alt = 0;
  state.mode = "room";
  state.dlg = null;
}

export function leaveRoom(state) {
  if (!state.room) return;
  if (state.room.building && state.room.building !== "cave") {
    for (const n of state.npcs) if (n.home === state.room.building && n.goal !== "sleep") n.inside = false;
  }
  state.player.x = state.room.from.x;
  state.player.y = state.room.from.y;
  state.mode = "world";
  state.room = null;
}

export function enterCave(state) {
  enterCaveDungeon(state);
}

function roomBlocked(state, px, py) {
  const r = state.room;
  const tx = px / TILE | 0, ty = py / TILE | 0;
  if (tx < 1 || tx >= r.w - 1 || ty < 1) return true;
  if (ty >= r.h - 1 && (tx < (r.w / 2 | 0) - 1 || tx > (r.w / 2 | 0) + 1)) return true;
  if (ty >= r.h) return false;
  for (const f of r.furn) if (f.solid && tx >= f.x && tx < f.x + f.w && ty >= f.y && ty < f.y + f.h) return true;
  return false;
}

function moveRoom(state, dx, dy) {
  const p = state.player;
  const tryOne = (nx, ny) => !roomBlocked(state, nx - 3, ny) && !roomBlocked(state, nx + 3, ny) && !roomBlocked(state, nx, ny + 2);
  if (tryOne(p.x + dx, p.y)) p.x += dx;
  if (tryOne(p.x, p.y + dy)) p.y += dy;
  if (p.y > state.room.h * TILE - 6) leaveRoom(state);
}

export function useFurn(state) {
  const r = state.room;
  if (!r) return false;
  const tx = state.player.x / TILE | 0, ty = state.player.y / TILE | 0;
  for (const f of r.furn) {
    if (Math.abs(tx - f.x) + Math.abs(ty - f.y) > 1.5) continue;
    if (f.kind === "chest") {
      state.dlg = {
        npc: -1, name: r.kind === "manor" ? "Manor chest" : "Chest",
        pages: [chestText(state)],
        page: 0, choices: true, chest: true
      };
      return true;
    }
    if (f.kind === "bed") { state.player.hp = state.player.maxHp; note(state, "You rest a little."); return true; }
  }
  return false;
}

function boxOf(state) {
  const r = state.room;
  if (!r) return {};
  if (r.kind === "manor") return state.chest.manor;
  state.chest[r.building] = state.chest[r.building] || {};
  return state.chest[r.building];
}
function chestText(state) {
  const src = boxOf(state);
  const bits = Object.keys(src).filter(k => src[k] > 0).map(k => k + " x" + src[k]);
  return bits.length ? "Inside: " + bits.join(", ") + "." : "The chest is empty. Store bread or a herb.";
}

export function chestStore(state, item) {
  if (!state.room) return;
  const box = boxOf(state);
  if ((state.player.inv[item] || 0) <= 0) { note(state, "You have no " + item + "."); return; }
  state.player.inv[item]--;
  box[item] = (box[item] || 0) + 1;
  note(state, "Stored " + item + ".");
  if (state.dlg) state.dlg.pages = [chestText(state)];
}
export function chestTake(state, item) {
  if (!state.room) return;
  const box = boxOf(state);
  if ((box[item] || 0) <= 0) return;
  box[item]--;
  state.player.inv[item] = (state.player.inv[item] || 0) + 1;
  note(state, "Took " + item + ".");
  if (state.dlg) state.dlg.pages = [chestText(state)];
}

function capParts(state) {
  if (state.particles.length > 80) state.particles.splice(0, state.particles.length - 80);
}

function burst(state, x, y, n, radius, colors, life) {
  for (let i = 0; i < n && state.particles.length < 80; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 3) * 0.2;
    const sp = radius * (0.6 + (i % 5) * 0.1);
    state.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.75,
      life, max: life, color: colors[i % colors.length], w: i % 4 === 0 ? 3 : 2, h: 2
    });
  }
  capParts(state);
}

export function castSpell(state, id) {
  const p = state.player;
  if (state.dlg || p.castCd > 0 || state.mode === "room" && state.room.kind === "cave") {
    if (state.mode === "room") note(state, "Not in here.");
    return;
  }
  if (id) p.spell = id;
  const spellId = p.spell;
  const info = SPELL_INFO[spellId];
  const lv = spellLevel(p.spells[spellId].xp);
  p.mp = p.maxMp;
  p.castCd = 0.32;
  const dirs = [[0, 1], [0, -1], [-1, 0], [1, 0]];
  const d = dirs[p.dir];
  const spec = FIRE[lv - 1];
  if (spellId === "heal") {
    const amt = info.heal(lv);
    p.hp = Math.min(p.maxHp, p.hp + amt);
    burst(state, p.x, p.y - 8, HEAL_N[lv - 1], 16 + lv * 6, ["#7dba6a", "#d8f0c8", "#3e8a48"], 0.45 + lv * 0.05);
    state.rings.push({ x: p.x, y: p.y, r: 4, max: 10 + lv * 8, life: 0.4, color: lv > 3 ? "#e8f6d8" : "#8ed07a" });
    if (lv >= 4) state.flash = { color: "#c8e8b0", a: lv === 5 ? 0.2 : 0.12, t: 0.1 };
    if (lv === 5) state.shake = Math.max(state.shake, 1);
    note(state, "Heal " + lv);
  } else if (spellId === "thunder") {
    const reach = 36 + lv * 18;
    const tx = p.x + d[0] * reach, ty = p.y + d[1] * reach;
    const bolt = { pts: jagged(p.x, p.y - 8, tx, ty, lv), life: 0.18 + lv * 0.03, lv, color: "#d8d0ff" };
    state.bolts.push(bolt);
    if (lv >= 3) state.bolts.push({ pts: jagged(p.x, p.y - 8, tx + 10, ty + 6, lv), life: 0.14, lv: Math.max(1, lv - 2), color: "#8aa0e8" });
    hurtArea(state, tx, ty, 10 + lv * 4, info.dmg(lv), false);
    burst(state, tx, ty, 6 + lv * 4, 20 + lv * 8, ["#f4f0ff", "#b0a4e8", "#6a78c8"], 0.3);
    if (lv >= 4) { state.flash = { color: "#e4e0ff", a: lv === 5 ? 0.28 : 0.14, t: 0.08 }; state.shake = Math.max(state.shake, lv === 5 ? 4 : 2); }
  } else if (spellId === "air") {
    for (let i = 0; i < AIR_N[lv - 1]; i++) {
      state.shots.push({
        kind: "air", x: p.x + d[0] * 8, y: p.y - 6 + (i - 1) * 4, vx: d[0] * (90 + lv * 16), vy: d[1] * (90 + lv * 16),
        life: 0.28 + lv * 0.04, lv, hit: new Set()
      });
    }
    if (lv >= 4) { state.flash = { color: "#e8fff4", a: 0.1, t: 0.08 }; if (lv === 5) state.shake = Math.max(state.shake, 2); }
  } else {
    state.shots.push({
      kind: "fire", x: p.x + d[0] * 10, y: p.y - 6, vx: d[0] * (70 + lv * 12), vy: d[1] * (70 + lv * 12),
      life: 0.5, lv, r: 4 + lv * 3, hit: false
    });
    burst(state, p.x + d[0] * 16, p.y - 6, Math.ceil(spec.n * 0.45), spec.r * 0.45, ["#fff0c8", "#ffb050", "#e04820"].slice(0, spec.layers), 0.32);
    if (spec.flash) state.flash = { color: "#ffb060", a: spec.flash, t: 0.1 };
    if (spec.shake) state.shake = Math.max(state.shake, spec.shake);
  }
  p.spells[spellId].xp++;
  const now = spellLevel(p.spells[spellId].xp);
  if (now > lv) note(state, info.name + " grows stronger.");
}

function jagged(x0, y0, x1, y1, lv) {
  const pts = [[x0, y0]];
  const n = 3 + lv;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    pts.push([x0 + (x1 - x0) * t + ((i % 2) ? 6 + lv : -6 - lv), y0 + (y1 - y0) * t + ((i % 3) - 1) * 4]);
  }
  pts.push([x1, y1]);
  return pts;
}

function hurtArea(state, x, y, rad, dmg) {
  for (const m of state.monsters) {
    if (m.hp <= 0) continue;
    if (Math.hypot(m.x - x, m.y - y) <= rad) hitMonster(state, m, dmg, Math.atan2(m.y - y, m.x - x));
  }
}

function hitMonster(state, m, dmg, ang) {
  m.hp -= dmg;
  m.hit = 0.12;
  m.x += Math.cos(ang) * 8;
  m.y += Math.sin(ang) * 8;
  if (m.hp <= 0) {
    state.legend[m.kind] = (state.legend[m.kind] || 0) + 1;
    state.player.gold += m.kind === "boar" ? 4 : 2;
    note(state, "The " + m.kind + " falls. +" + (m.kind === "boar" ? 4 : 2) + "g");
    burst(state, m.x, m.y, 8, 20, ["#e8d8c0", "#8a5c3c"], 0.3);
  }
}

export function swing(state) {
  const p = state.player;
  if (p.swing > 0 || state.dlg) return;
  p.swing = 0.26;
  p.swingHit = false;
}

function swordHit(state) {
  const p = state.player;
  if (state.mode === "dungeon") { dungeonHurt(state, 2, null); return; }
  const dirs = [[0, 1], [0, -1], [-1, 0], [1, 0]];
  const d = dirs[p.dir];
  const hx = p.x + d[0] * 12, hy = p.y + d[1] * 10;
  for (const m of state.monsters) {
    if (m.hp <= 0) continue;
    if (Math.abs(m.x - hx) < 14 && Math.abs(m.y - hy) < 12) hitMonster(state, m, 2, Math.atan2(m.y - p.y, m.x - p.x));
  }
}

export function toggleFly(state) {
  const p = state.player;
  if (state.mode !== "world") return;
  if (p.fly) {
    const [tx, ty] = tileOf(p.x, p.y);
    const g = sample(tx, ty);
    if (g.solid || g.ground === "ocean" || g.ground === "void") { note(state, "You can't land here."); return; }
    p.fly = false;
    burst(state, p.x, p.y, 6, 14, ["#e6d2b0", "#c4a06a"], 0.25);
    return;
  }
  const [tx, ty] = tileOf(p.x, p.y);
  if (sample(tx, ty).solid) { note(state, "You need open ground."); return; }
  p.fly = true;
  p.z = 0;
  const lv = flyLevel(p.flyXp);
  const spec = FLY[lv - 1];
  burst(state, p.x, p.y, spec.burst, 16 + lv * 8, ["#d7ecff", "#f4f0e4", "#c4a06a"], 0.4);
  if (lv >= 4) state.flash = { color: "#e8f4ff", a: 0.08, t: 0.08 };
}

export function setSpellLevel(state, lv) {
  const xp = (lv - 1) * 6;
  for (const id of SPELLS) state.player.spells[id].xp = xp;
}
export function setFlyLevel(state, lv) { state.player.flyXp = (lv - 1) * 8; }

function inTown(state, x, y) {
  const tx = x / TILE | 0, ty = y / TILE | 0;
  for (const p of state.plans) {
    if (tx < p.minX || tx > p.maxX || ty < p.minY || ty > p.maxY) continue;
    if (p.roads.has(tx + "," + ty) || p.buildings.some(b => tx >= b.x && ty >= b.y && tx < b.x + b.w && ty < b.y + b.h)) return true;
    if (Math.hypot(tx - p.town.x, ty - p.town.y) < 18) return true;
  }
  return false;
}

export function update(state, dt, input) {
  dt = Math.min(0.05, dt);
  const p = state.player;
  state.min += dt * 2;
  p.mp = p.maxMp;
  if (p.castCd > 0) p.castCd -= dt;
  if (p.iframes > 0) p.iframes -= dt;
  if (p.swing > 0) {
    p.swing -= dt;
    if (!p.swingHit && p.swing < 0.16) { p.swingHit = true; swordHit(state); }
  }
  if (p.dash > 0) p.dash -= dt;
  if (state.flash) { state.flash.t -= dt; if (state.flash.t <= 0) state.flash = null; }
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 8);
  if (state.noticeT > 0) state.noticeT -= dt;
  for (let i = state.bubbles.length - 1; i >= 0; i--) {
    const b = state.bubbles[i];
    b.life -= dt; b.age += dt;
    if (b.life <= 0) state.bubbles.splice(i, 1);
  }
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const q = state.particles[i];
    q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.kind === "rise" ? -40 : 20) * dt;
    if (q.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.bolts.length - 1; i >= 0; i--) { state.bolts[i].life -= dt; if (state.bolts[i].life <= 0) state.bolts.splice(i, 1); }
  for (let i = state.rings.length - 1; i >= 0; i--) {
    const r = state.rings[i]; r.life -= dt; r.r += dt * 40; if (r.life <= 0) state.rings.splice(i, 1);
  }
  for (let i = state.shots.length - 1; i >= 0; i--) {
    const s = state.shots[i];
    s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.kind === "fire") {
      if (state.particles.length < 80 && (hash(i, (state.min * 10) | 0, 1) % 2) === 0) {
        state.particles.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 8, vy: -10, life: 0.25, max: 0.25, color: s.lv > 2 ? "#ffd080" : "#e07040", w: 2, h: 2, kind: "rise" });
      }
      for (const m of state.monsters) {
        if (m.hp > 0 && !s.hit && Math.hypot(m.x - s.x, m.y - s.y) < 10 + s.lv) {
          s.hit = true; s.life = 0;
          hitMonster(state, m, SPELL_INFO.fire.dmg(s.lv), Math.atan2(m.y - s.y, m.x - s.x));
          const spec = FIRE[s.lv - 1];
          burst(state, s.x, s.y, spec.n, spec.r, ["#fff0c8", "#ffb050", "#e04820", "#ffd080"].slice(0, spec.layers + 1), 0.35 + s.lv * 0.04);
          if (spec.flash) state.flash = { color: "#ffb060", a: spec.flash, t: 0.1 };
          if (spec.shake) state.shake = Math.max(state.shake, spec.shake);
        }
      }
    } else if (s.kind === "air") {
      for (const m of state.monsters) {
        if (m.hp > 0 && !s.hit.has(m.id) && Math.hypot(m.x - s.x, m.y - s.y) < 12 + s.lv * 2) {
          s.hit.add(m.id);
          hitMonster(state, m, SPELL_INFO.air.dmg(s.lv), Math.atan2(s.vy, s.vx));
          m.x += Math.sign(s.vx || 1) * (4 + s.lv);
        }
      }
    }
    if (s.life <= 0) {
      if (s.kind === "fire" && !s.hit) {
        const spec = FIRE[s.lv - 1];
        burst(state, s.x, s.y, Math.ceil(spec.n * 0.7), spec.r * 0.6, ["#ffd090", "#e06030"], 0.3);
        if (spec.flash) state.flash = { color: "#ffb060", a: spec.flash * 0.7, t: 0.08 };
        if (spec.shake) state.shake = Math.max(state.shake, spec.shake);
      }
      state.shots.splice(i, 1);
    }
  }

  if (state.mode === "dungeon") {
    let mx = input.x, my = input.y;
    if (input.dash && p.dash <= 0 && (mx || my) && !p.fly) p.dash = 0.22;
    if (p.dash > 0) p.dash -= dt;
    if (!p.fly && (p.z > 0 || p.vz)) { p.vz -= 640 * dt; p.z += p.vz * dt; if (p.z <= 0) { p.z = 0; p.vz = 0; } }
    if (input.jump && p.z === 0 && !p.fly) { p.vz = 210; p.z = 0.1; }
    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len; my /= len;
      const sp = p.dash > 0.08 ? 210 : 112;
      const nx = p.x + mx * sp * dt, ny = p.y + my * sp * dt;
      if (!dungeonBlocked(state, nx, p.y)) p.x = nx;
      if (!dungeonBlocked(state, p.x, ny)) p.y = ny;
      p.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 2 : 3) : (my < 0 ? 1 : 0);
      p.walk += sp * dt * 0.18;
      p.frame = (p.walk | 0) % 4;
    } else p.frame = 0;
    dungeonPuzzle(state);
    for (const s of state.shots) dungeonHurt(state, s.kind === "air" ? 1 : 2, s.kind === "fire" ? "fire" : s.kind, s.x, s.y);
    for (const b of state.bolts) {
      const last = b.pts[b.pts.length - 1];
      dungeonHurt(state, 2, "thunder", last[0], last[1]);
    }
    if (input.upStairs) stepDungeonStairs(state, -1);
    if (input.downStairs) stepDungeonStairs(state, 1);
    tickDungeonFoes(state, dt);
    return;
  }

  if (state.dlg) return;

  if (state.mode === "room") {
    let mx = input.x, my = input.y;
    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      const sp = 90 * dt;
      moveRoom(state, mx / len * sp, my / len * sp);
      p.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 2 : 3) : (my < 0 ? 1 : 0);
      p.walk += dt * 8;
      p.frame = (p.walk | 0) % 4;
    } else p.frame = 0;
    return;
  }

  // world
  let mx = input.x, my = input.y;
  if (input.dash && p.dash <= 0 && (mx || my) && !p.fly) { p.dash = 0.22; burst(state, p.x, p.y, 4, 12, ["#e6d2b0"], 0.2); }
  const flying = p.fly;
  const flv = flyLevel(p.flyXp);
  const fspec = FLY[flv - 1];
  const targetAlt = flying ? fspec.alt : 0;
  p.alt += (targetAlt - p.alt) * Math.min(1, dt * 4);
  if (!flying && p.z > 0 || p.vz) {
    p.vz -= 640 * dt;
    p.z += p.vz * dt;
    if (p.z <= 0) { p.z = 0; p.vz = 0; }
  }
  if (input.jump && p.z === 0 && !flying) { p.vz = 210; p.z = 0.1; burst(state, p.x, p.y, 4, 10, ["#e6d2b0"], 0.2); }
  if (mx || my) {
    const len = Math.hypot(mx, my) || 1;
    mx /= len; my /= len;
    let sp = flying ? fspec.speed : (p.dash > 0.08 ? 210 : 112);
    const [nx, ny] = moveFeet(p.x, p.y, mx * sp * dt, my * sp * dt, flying);
    const moved = Math.hypot(nx - p.x, ny - p.y);
    p.x = nx; p.y = ny;
    p.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 2 : 3) : (my < 0 ? 1 : 0);
    p.walk += moved * 0.18;
    p.frame = (p.walk | 0) % 4;
    if (flying) {
      state._flown += moved;
      if (state._flown > 220) {
        state._flown = 0; p.flyXp++;
        const nl = flyLevel(p.flyXp);
        if (nl > flv) note(state, "The wind lifts you higher.");
      }
      if (state.particles.length < 70 && Math.random() < 0.5 + flv * 0.1) {
        state.particles.push({
          x: p.x - mx * 8, y: p.y - 4, vx: -mx * (20 + flv * 10), vy: -my * 10 + 4,
          life: 0.25 + flv * 0.04, max: 0.4, color: flv >= 4 ? "#f4fbff" : "#d5ecff", w: 6 + flv, h: 1, kind: "wind"
        });
      }
    }
  } else if (!flying) p.frame = 0;

  // people
  const hour = hourOf(state);
  for (let i = 0; i < state.npcs.length; i++) {
    const n = state.npcs[i];
    const near = Math.hypot(n.x - p.x, n.y - p.y) < 260 && !n.inside;
    if (!near && (i % 24) !== (state.npcCursor % 24)) continue;
    n.hunger = Math.min(1, n.hunger + dt * 0.004);
    n.social = Math.min(1, n.social + dt * 0.003);
    n.rest = Math.min(1, n.rest + dt * (hour >= 21 || hour < 6 ? -0.02 : 0.002));
    const [wx, wy] = waypoint(state, n);
    if (n.goal === "sleep" && Math.hypot(n.x - wx, n.y - wy) < 14) { n.inside = true; n.hunger = Math.max(0, n.hunger - dt * 0.02); continue; }
    if (n.goal !== "sleep") n.inside = false;
    if (n.inside) continue;
    const dx = wx - n.x, dy = wy - n.y, d = Math.hypot(dx, dy) || 1;
    if (d > 6) {
      const sp = near ? 32 : 80;
      if (near) {
        const mv = moveFeet(n.x, n.y, dx / d * sp * dt, dy / d * sp * dt, false);
        n.x = mv[0]; n.y = mv[1];
      } else {
        n.x += dx / d * sp * dt * 4;
        n.y += dy / d * sp * dt * 4;
      }
      n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
      n.frame = ((state.min * 4 + n.id) | 0) % 4;
    } else n.frame = 0;
  }
  state.npcCursor++;
  state.ambient -= dt;
  if (state.ambient <= 0) {
    state.ambient = 1.3;
    const visible = state.npcs.filter(n => !n.inside && Math.hypot(n.x - p.x, n.y - p.y) < 180);
    visible.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const speaker = visible[state.npcCursor % Math.max(1, visible.length)];
    if (speaker) {
      let text = lineFor(speaker, hour);
      if (speaker.friend != null) {
        const f = state.npcs[speaker.friend];
        if (f && !f.inside && Math.hypot(f.x - speaker.x, f.y - speaker.y) < 36) text = "Morning, " + f.name + ".";
      }
      say(state, speaker, text);
    }
  }

  // monsters
  for (let i = state.monsters.length - 1; i >= 0; i--) {
    const m = state.monsters[i];
    if (m.hp <= 0) { if ((m.dead = (m.dead || 0) + dt) > 6) state.monsters.splice(i, 1); continue; }
    if (m.hit > 0) m.hit -= dt;
    if (m.cool > 0) m.cool -= dt;
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
    const town = inTown(state, m.x, m.y);
    let tx = m.homeX, ty = m.homeY;
    if (!inTown(state, p.x, p.y) && d < 110) { tx = p.x; ty = p.y; }
    if (town) { tx = m.homeX; ty = m.homeY; }
    const mx = tx - m.x, my = ty - m.y, md = Math.hypot(mx, my) || 1;
    if (md > 4) {
      const sp = d < 110 && !town ? 38 : 16;
      const mv = moveFeet(m.x, m.y, mx / md * sp * dt, my / md * sp * dt, false);
      m.x = mv[0]; m.y = mv[1];
      m.frame ^= ((state.min * 6) | 0) & 1;
    }
    if (d < 14 && p.iframes <= 0 && m.cool <= 0 && !inTown(state, p.x, p.y)) {
      p.hp -= 1; p.iframes = 0.6; m.cool = 0.8;
      note(state, "The " + m.kind + " nips you.");
      if (p.hp <= 0) respawn(state);
    }
  }
  tickRealm(state, dt);
  state.spawnT -= dt;
  if (state.spawnT <= 0 && state.monsters.length < 4 && !inTown(state, p.x, p.y)) {
    state.spawnT = 8;
    const ang = hash(p.x | 0, p.y | 0, state.min | 0) % 628 / 100;
    const x = p.x + Math.cos(ang) * 120, y = p.y + Math.sin(ang) * 120;
    if (!sample(x / TILE | 0, y / TILE | 0).solid && !inTown(state, x, y)) {
      const kinds = ["boar", "lurker", "mite"];
      state.monsters.push(makeMonster(kinds[hash(x | 0, y | 0, 2) % 3], x, y, state.monsters.length + 3));
    }
  }
}

function respawn(state) {
  const home = planOfTown(START_TOWN, state.plans);
  state.player.hp = state.player.maxHp;
  state.player.x = home.town.x * TILE;
  state.player.y = (home.town.y + 2) * TILE;
  state.player.fly = false; state.player.alt = 0; state.player.z = 0;
  state.mode = "world"; state.room = null;
  note(state, "You wake in Aldmoor, sore but whole.");
}

export function saveData(state) {
  const p = state.player;
  return {
    v: 1,
    x: p.x, y: p.y, hp: p.hp, mp: p.mp, gold: p.gold, inv: p.inv,
    spells: p.spells, spell: p.spell, flyXp: p.flyXp, min: state.min,
    chest: state.chest,
    mem: state.npcs.map(n => [n.id, n.mem.talks, n.mem.opinion, n.heroKid ? 1 : 0]),
    owner: state.owner, prices: state.prices, legend: state.legend,
    family: state.family, weather: state.weather,
    wagons: state.wagons, ships: state.ships, duns: state.duns, wars: state.wars,
    owned: state.plans.flatMap(p => p.buildings.filter(b => b.owned).map(b => b.id))
  };
}

export function loadData(state, data) {
  if (!data || data.v !== 1) return false;
  const p = state.player;
  p.x = data.x; p.y = data.y; p.hp = data.hp; p.mp = data.mp; p.gold = data.gold;
  p.inv = data.inv || {}; p.spells = data.spells || p.spells; p.spell = data.spell || "fire";
  p.flyXp = data.flyXp || 0; state.min = data.min || state.min; state.chest = data.chest || {};
  if (data.mem) for (const row of data.mem) {
    const [id, talks, opinion, heroKid] = row;
    const n = state.npcs.find(q => q.id === id);
    if (n) { n.mem.talks = talks; n.mem.opinion = opinion; if (heroKid) n.heroKid = true; }
  }
  if (data.owner) state.owner = data.owner;
  if (data.prices) state.prices = data.prices;
  if (data.legend) state.legend = data.legend;
  if (data.family) state.family = data.family;
  if (data.weather) state.weather = data.weather;
  if (data.wagons) state.wagons = data.wagons;
  if (data.ships) state.ships = data.ships;
  if (data.duns) state.duns = data.duns;
  if (data.wars) state.wars = data.wars;
  if (data.owned) for (const id of data.owned) for (const plan of state.plans) for (const b of plan.buildings) if (b.id === id) { b.owned = 1; b.sale = 0; }
  return true;
}

export const SAVE_KEY = "bladeNextSave1";
