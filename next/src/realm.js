// Kingdoms, wars, trade, family, houses, dungeons, weather.
// Walk and flight speeds live in sim.js and are not changed here.

import { TILE, worldPlan, DUNGEONS, hash } from "./layout.js";
import { CAVE, isLand } from "./terrain.js";

export const HUNTS = [
  { id: "bristle", name: "Bristle the Road-Boar", kind: "boar", town: "aldmoor", hp: 28, gold: 80, title: "Road-breaker", lore: "A boar that charges anyone on the Aldmoor road." },
  { id: "reedwitch", name: "The Reed Witch", kind: "lurker", town: "tidewatch", hp: 24, gold: 90, title: "Reed-binder", lore: "It spits from the reeds just off Tidewatch." },
  { id: "ashjaw", name: "Ashjaw", kind: "boar", town: "emberreach", hp: 32, gold: 110, title: "Ash-quencher", lore: "A boar wreathed in cinders outside Emberreach." },
  { id: "bellswarm", name: "The Bell Swarm", kind: "mite", town: "bellhollow", hp: 18, gold: 70, title: "Swarm-breaker", lore: "Mites that bite only after you strike first." },
  { id: "oaktusks", name: "Old Tusks", kind: "boar", town: "oakenshore", hp: 30, gold: 100, title: "Tusk-taker", lore: "A charger in the oaks past the shipyard." },
  { id: "fieldlurker", name: "The Field Lurker", kind: "lurker", town: "wheatmarch", hp: 26, gold: 85, title: "Field-warden", lore: "It waits in the wheat and spits at anyone who comes close." }
];

export function huntLair(state, hunt) {
  const plan = state.plans.find(p => p.town.id === hunt.town);
  if (!plan) return null;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let k = 0; k < dirs.length; k++) {
    const [dx, dy] = dirs[k];
    for (let r = 8; r < 90; r += 2) {
      const x = dx > 0 ? plan.maxX + r : dx < 0 ? plan.minX - r : plan.town.x + (k * 3);
      const y = dy > 0 ? plan.maxY + r : dy < 0 ? plan.minY - r : plan.town.y + (k * 3);
      if (isLand(x, y)) return { x, y };
    }
  }
  return null;
}

const BEH = { boar: "charge", lurker: "cast", mite: "flee", grazer: "pea" };

export function tickHunts(state) {
  if (!state.hunts || !state.hunts.track || state.hunts.slain[state.hunts.track]) return;
  if (state.mode !== "world") return;
  if (state.monsters.some(m => m.legend === state.hunts.track && m.hp > 0)) return;
  const hunt = HUNTS.find(h => h.id === state.hunts.track);
  if (!hunt) return;
  const lair = huntLair(state, hunt);
  if (!lair) return;
  if (Math.hypot(state.player.x / TILE - lair.x, state.player.y / TILE - lair.y) > 28) return;
  state.monsters.push({
    id: 8000 + hunt.hp, kind: hunt.kind, name: hunt.name, legend: hunt.id, title: hunt.title,
    x: lair.x * TILE + 8, y: lair.y * TILE + 8, homeX: lair.x * TILE, homeY: lair.y * TILE,
    hp: hunt.hp, max: hunt.hp, gold: hunt.gold,
    beh: BEH[hunt.kind] || "charge", spd: 34, aggro: 170,
    dir: 0, frame: 0, hit: 0, cool: 0, mode: "wander", modeT: 0.2, vx: 0, vy: 0,
    provoked: hunt.kind !== "mite", castCd: 0.4
  });
  note(state, hunt.name + " comes out of its lair.");
}

export function huntLines(state) {
  const H = state.hunts || { slain: {} };
  return HUNTS.map(h => (H.slain[h.id] ? "Slain. " : H.track === h.id ? "Tracking. " : "") + h.name + " — " + h.lore);
}

export function initRealm(state) {
  state.hunts = { track: null, slain: {} };
  state.weather = "clear";
  state.wxT = 0;
  state.owner = {};
  for (const p of state.plans) state.owner[p.town.id] = p.town.kingdom;
  state.wars = [];
  state.prices = {};
  for (const p of state.plans) state.prices[p.town.id] = 1;
  state.wagons = [];
  state.ships = [];
  const towns = state.plans.filter(p => !p.town.demon);
  for (let i = 0; i < Math.min(8, towns.length); i++) {
    const a = towns[i], b = towns[(i + 3) % towns.length];
    state.wagons.push({ from: a.town.id, to: b.town.id, t: (i * 0.17) % 1, cargo: ["salt", "grain", "timber", "ore"][i % 4], escort: 0, escortLeft: 0 });
  }
  const ports = state.plans.filter(p => p.town.island || p.town.harbor);
  for (let i = 0; i < ports.length; i++) {
    const a = ports[i], b = ports[(i + 1) % ports.length];
    state.ships.push({ from: a.town.id, to: b.town.id, t: i / ports.length, cargo: "salt" });
  }
  state.legend = { boar: 0, lurker: 0, mite: 0 };
  state.family = { spouse: null };
  state.duns = {};
  state.dun = null;
  state.dunFoes = [];
}

export function wagonPos(state, w) {
  const A = state.plans.find(p => p.town.id === w.from).town;
  const B = state.plans.find(p => p.town.id === w.to).town;
  return { x: (A.x + (B.x - A.x) * w.t) * TILE + 8, y: (A.y + (B.y - A.y) * w.t) * TILE + 8, A, B };
}

export function shipPos(state, s) {
  const A = state.plans.find(p => p.town.id === s.from).town;
  const B = state.plans.find(p => p.town.id === s.to).town;
  const x = A.x + (B.x - A.x) * s.t;
  const y = A.y + (B.y - A.y) * s.t;
  const ox = -(B.y - A.y), oy = (B.x - A.x);
  const len = Math.hypot(ox, oy) || 1;
  return { x: (x + ox / len * 30) * TILE, y: (y + oy / len * 18) * TILE };
}

function note(state, text) { state.notice = text; state.noticeT = 2.4; }

export function tickRealm(state, dt) {
  state.wxT += dt;
  if (state.wxT > 28) {
    state.wxT = 0;
    const seq = ["clear", "clear", "rain", "wind", "clear"];
    state.weather = seq[(state.min / 20 | 0) % seq.length];
  }
  for (const w of state.wagons || []) {
    w.t += dt * 0.004;
    if (w.t >= 1) {
      w.t -= 1;
      state.prices[w.to] = Math.max(0.55, (state.prices[w.to] || 1) - 0.08);
      note(state, "A wagon of " + w.cargo + " rolls in. Prices ease.");
    }
    if (w.escort) {
      const p = wagonPos(state, w);
      if (Math.hypot(state.player.x - p.x, state.player.y - p.y) < 80) {
        w.escortLeft -= dt;
        if (w.escortLeft <= 0) { w.escort = 0; state.player.gold += 25; note(state, "The driver pays 25g for the escort."); }
      }
    }
  }
  for (const s of state.ships || []) {
    s.t += dt * 0.02;
    if (s.t >= 1) {
      s.t -= 1;
      state.prices[s.to] = Math.max(0.55, (state.prices[s.to] || 1) - 0.06);
    }
  }
}

export function teleportTo(state, id) {
  const p = state.plans.find(q => q.town.id === id);
  if (!p) return false;
  state.player.x = p.town.x * TILE + 8;
  state.player.y = (p.town.y + 2) * TILE + 8;
  state.player.fly = false; state.player.alt = 0; state.player.z = 0;
  state.mode = "world"; state.room = null; state.dun = null;
  note(state, "You arrive in " + p.town.name + ".");
  return true;
}

export function buyHouse(state) {
  const tx = state.player.x / TILE | 0, ty = state.player.y / TILE | 0;
  for (const plan of state.plans) {
    for (const b of plan.buildings) {
      if (!b.sale || b.owned) continue;
      if (Math.abs(tx - b.doorX) + Math.abs(ty - (b.doorY + 1)) > 2) continue;
      if (state.player.gold < b.price) { note(state, "Not enough gold."); return false; }
      state.player.gold -= b.price;
      b.owned = 1; b.sale = 0;
      note(state, "The house is yours.");
      return b;
    }
  }
  note(state, "No house for sale here.");
  return false;
}

export function romance(state, n) {
  if (!n || n.child || (n.age || 0) < 18) { note(state, "That isn't possible."); return false; }
  if ((n.mem.opinion || 0) < 50) { note(state, n.name + " is glad of the company, and nothing more."); return false; }
  state.family.spouse = n.id;
  n.mem.opinion = Math.min(100, n.mem.opinion + 10);
  const kid = state.npcs.find(k => k.child && k.town === n.town && !k.heroKid) || state.npcs.find(k => k.child && !k.heroKid);
  const manor = state.plans.find(p => p.town.manor);
  const hall = manor && manor.buildings.find(b => b.kind === "manor");
  if (hall) { n.home = hall.id; n.town = manor.town.id; }
  if (kid) { kid.heroKid = true; kid.parents = [n.id, -1]; if (hall) { kid.home = hall.id; kid.town = manor.town.id; } }
  note(state, n.name + " walks with you through the square.");
  return true;
}

export function startWar(state) {
  let w = state.wars.find(q => !q.done);
  if (w) return w;
  w = { a: "aldmoria", b: "varnhold", na: 30, nb: 26, done: 0, surrendered: null, fx: 2800 * TILE, fy: 1860 * TILE };
  state.wars.push(w);
  note(state, "Aldmoria and Varnhold meet in the field. The towns are not touched.");
  return w;
}

export function strikeWar(state) {
  const w = state.wars.find(q => !q.done);
  if (!w) return null;
  w.nb = Math.max(0, w.nb - 4);
  if (w.nb <= 8) {
    w.done = 1; w.surrendered = "b";
    state.owner.wayford = "aldmoria";
    note(state, "Varnhold lowers its banners. Wayford changes flag. Every roof still stands.");
  }
  return w;
}

export function nearWagon(state) {
  let best = null, bd = 36;
  for (const w of state.wagons || []) {
    const p = wagonPos(state, w);
    const d = Math.hypot(state.player.x - p.x, state.player.y - p.y);
    if (d < bd) { bd = d; best = w; }
  }
  return best;
}

export function buyCargo(state) {
  const w = nearWagon(state);
  if (!w) { note(state, "No wagon here."); return false; }
  const cost = Math.max(6, Math.round(12 * (state.prices[w.from] || 1)));
  if (state.player.gold < cost) { note(state, "Not enough gold."); return false; }
  state.player.gold -= cost;
  const item = { salt: "fish", grain: "bread", timber: "wood", ore: "ore" }[w.cargo] || "herb";
  state.player.inv[item] = (state.player.inv[item] || 0) + 1;
  note(state, "Bought " + w.cargo + " for " + cost + "g.");
  return true;
}

export function escortWagon(state) {
  const w = nearWagon(state);
  if (!w) { note(state, "No wagon here."); return false; }
  w.escort = 1; w.escortLeft = 2.4;
  note(state, "Stay with the wagon.");
  return true;
}

export function legendLines(state) {
  const L = state.legend || {};
  return ["Thicket boar: " + (L.boar || 0), "Reed lurker: " + (L.lurker || 0), "Cinder mite: " + (L.mite || 0)];
}

const BOSS = {
  grove: { name: "the Rootmother", weak: "fire" },
  ice: { name: "the Pale Wyrm", weak: "air" },
  flood: { name: "the Cloister Eel", weak: "thunder" },
  ash: { name: "the Cinder Hound", weak: "air" },
  sky: { name: "the Storm Roc", weak: "thunder" },
  hollow: { name: "the Crypt Warden", weak: "fire" }
};

function floorOf(dun) { return dun.floors[dun.level]; }
function cell(dun, x, y) {
  const f = floorOf(dun);
  if (!f || x < 0 || y < 0 || x >= f.w || y >= f.h) return 1;
  return f.g[y * f.w + x];
}
function setCell(dun, x, y, t) {
  const f = floorOf(dun);
  if (!f || x < 0 || y < 0 || x >= f.w || y >= f.h) return;
  f.g[y * f.w + x] = t;
}

function blankFloor(w, h) {
  const g = new Uint8Array(w * h);
  g.fill(1);
  return { w, h, g, decor: [], foes: [], spawn: { x: 4, y: h - 4 } };
}
function put(floor, x, y, t) {
  if (x > 0 && y > 0 && x < floor.w - 1 && y < floor.h - 1) floor.g[y * floor.w + x] = t;
}
function fill(floor, x0, y0, x1, y1, t) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(floor, x, y, t);
}

function scatter(floor, idn, level, kind, n) {
  for (let i = 0; i < n; i++) {
    const x = 3 + (hash(i, idn, level + 1) % (floor.w - 6));
    const y = 3 + (hash(i + 4, level, idn) % (floor.h - 6));
    if (floor.g[y * floor.w + x] === 0 && !floor.decor.some(d => d.x === x && d.y === y)) floor.decor.push({ x, y, kind });
  }
}

function buildFloor(id, level) {
  const idn = { grove: 1, ice: 2, flood: 3, ash: 4, sky: 5, hollow: 6 }[id] || 1;
  const floor = blankFloor(22, 36);
  const inset = (hash(idn, level, 2) % 3);
  fill(floor, 2, 26, 19, 33, 0);
  fill(floor, 2 + inset, 14, 19 - (inset % 2), 23, 0);
  fill(floor, 2, 2, 19, 11, 0);
  fill(floor, 9, 24, 12, 25, 0);
  fill(floor, 9, 12, 12, 13, 0);
  put(floor, 4, 29, 9);
  put(floor, 17, 29, 9);
  put(floor, 4, 17, 9);
  put(floor, 17, 7, 9);
  const deco = id === "grove" ? "shroom" : id === "hollow" ? "bone" : id === "ice" ? "crystal" : id === "ash" ? "ember" : id === "sky" ? "cloud" : "lily";
  scatter(floor, idn, level, deco, 14);
  if (id === "grove" || id === "hollow") scatter(floor, idn, level + 5, "root", 8);
  floor.spawn = { x: 6, y: 30 };
  if (level === 0) {
    if (id === "sky") {
      for (let x = 9; x <= 12; x++) put(floor, x, 24, 4);
      put(floor, 16, 31, 10);
    } else if (id === "ice" || id === "flood") {
      for (let y = 24; y <= 25; y++) for (let x = 8; x <= 13; x++) put(floor, x, y, 2);
    } else {
      for (let x = 9; x <= 12; x++) put(floor, x, 24, 8);
    }
    put(floor, 7, 18, 6);
    put(floor, 15, 6, 3);
    floor.foes.push({ x: 15 * TILE + 8, y: 18 * TILE + 8, max: 6, kind: id === "ice" ? "mite" : "lurker" });
    floor.foes.push({ x: 5 * TILE + 8, y: 16 * TILE + 8, max: 6, kind: "mite" });
  } else if (level === 1) {
    put(floor, 9, 24, 1);
    put(floor, 10, 24, 11);
    put(floor, 11, 24, 1);
    put(floor, 12, 24, 1);
    put(floor, 17, 31, 10);
    for (let x = 9; x <= 12; x++) put(floor, x, 12, 4);
    for (let y = 14; y <= 23; y++) put(floor, 15, y, 1);
    put(floor, 15, 17, 13);
    fill(floor, 16, 16, 19, 19, 0);
    put(floor, 17, 17, 5);
    put(floor, 6, 5, 3);
    floor.foes.push({ x: 8 * TILE + 8, y: 19 * TILE + 8, max: 8, kind: "boar" });
  } else {
    fill(floor, 3, 4, 18, 31, 0);
    put(floor, 7, 16, 1); put(floor, 8, 16, 1); put(floor, 14, 16, 1); put(floor, 15, 16, 1);
    put(floor, 6, 24, 1); put(floor, 16, 24, 1);
    const boss = BOSS[id];
    floor.foes.push({ boss: 1, name: boss.name, weak: boss.weak, kind: id, x: 11 * TILE + 8, y: 14 * TILE + 8, max: 24 });
    put(floor, 11, 30, 3);
    floor.spawn = { x: 11, y: 27 };
    scatter(floor, idn, 9, deco, 6);
  }
  return floor;
}

function makeCaveFloor() {
  const floor = blankFloor(22, 28);
  fill(floor, 2, 3, 19, 24, 0);
  put(floor, 6, 10, 1); put(floor, 7, 10, 1); put(floor, 15, 14, 1); put(floor, 14, 14, 1);
  put(floor, 8, 18, 1); put(floor, 12, 8, 1);
  put(floor, 16, 8, 5);
  put(floor, 11, 22, 3);
  put(floor, 4, 6, 9); put(floor, 17, 20, 9);
  floor.spawn = { x: 11, y: 8 };
  floor.foes.push({ x: 8 * TILE + 8, y: 16 * TILE + 8, max: 6, kind: "lurker" });
  scatter(floor, 7, 1, "crystal", 8);
  scatter(floor, 7, 2, "moss", 8);
  return floor;
}

function populate(state) {
  const floor = floorOf(state.dun);
  state.dunFoes = floor.foes.map(f => ({ ...f, hp: f.max, atk: 0.6, hit: 0 }));
}

function arrive(state) {
  const s = floorOf(state.dun).spawn;
  state.player.x = s.x * TILE + 8;
  state.player.y = s.y * TILE + 8;
  populate(state);
}

export function enterDungeon(state, id) {
  const def = DUNGEONS.find(d => d.id === id);
  if (!def) return false;
  state.duns[id] = state.duns[id] || { lit: {}, boss: 0, sealed: 0, keys: 0 };
  state.dun = { def, level: 0, floors: [0, 1, 2].map(f => buildFloor(id, f)) };
  state.mode = "dungeon";
  state.player.fly = false; state.player.alt = 0; state.player.z = 0;
  arrive(state);
  note(state, "You step into " + def.name + ".");
  return true;
}

export function enterCaveDungeon(state) {
  const back = { x: state.player.x, y: state.player.y };
  state.duns.cave = state.duns.cave || { lit: {}, boss: 0, sealed: 0, keys: 1 };
  state.dun = { def: { id: "cave", name: "Ridge Cave", el: "fire", x: CAVE.x, y: CAVE.y, back }, level: 0, floors: [makeCaveFloor()] };
  state.mode = "dungeon";
  state.player.fly = false; state.player.alt = 0; state.player.z = 0;
  arrive(state);
  note(state, "The cave mouth opens into a stone hall.");
  return true;
}

const SOLID = new Set([1, 2, 4, 8, 11, 13]);
export function dungeonBlocked(state, px, py) {
  const dun = state.dun;
  if (!dun) return true;
  const pts = [[px - 3, py - 1], [px + 3, py - 1], [px - 3, py + 2], [px + 3, py + 2]];
  for (const [x, y] of pts) if (SOLID.has(cell(dun, x / TILE | 0, y / TILE | 0))) return true;
  return false;
}

function takeKey(state, x, y) {
  const st = state.duns[state.dun.def.id];
  setCell(state.dun, x, y, 0);
  st.keys = (st.keys || 0) + 1;
  note(state, "A key. It fits a door deeper in.");
}

export function dungeonPuzzle(state) {
  const dun = state.dun;
  if (!dun) return;
  const st = state.duns[dun.def.id];
  const px = state.player.x / TILE | 0, py = state.player.y / TILE | 0;
  if (cell(dun, px, py) === 6) takeKey(state, px, py);
  for (const s of state.shots || []) {
    if (s.kind === "foe") continue;
    const tx = s.x / TILE | 0, ty = s.y / TILE | 0;
    const t = cell(dun, tx, ty);
    if (s.kind === "fire" && t === 8) { setCell(dun, tx, ty, 0); s.life = 0; note(state, "The vines burn away."); }
    else if (s.kind === "fire" && t === 9 && !st.lit[tx + "," + ty]) { st.lit[tx + "," + ty] = 1; s.life = 0; note(state, "The torch catches."); }
    else if (s.kind === "air" && t === 2) { setCell(dun, tx, ty, 12); note(state, "The cold air freezes a path."); }
    else if (s.kind === "air" && t === 11) {
      const dir = state.player.dir;
      const dx = dir === 2 ? -1 : dir === 3 ? 1 : 0;
      const dy = dir === 0 ? 1 : dir === 1 ? -1 : 0;
      if ((dx || dy) && cell(dun, tx + dx, ty + dy) === 0) { setCell(dun, tx, ty, 0); setCell(dun, tx + dx, ty + dy, 11); note(state, "The block slides."); }
      s.life = 0;
    }
  }
  for (const b of state.bolts || []) {
    const last = b.pts[b.pts.length - 1];
    const tx = last[0] / TILE | 0, ty = last[1] / TILE | 0;
    if (cell(dun, tx, ty) === 10) {
      const f = floorOf(dun);
      let n = 0;
      for (let i = 0; i < f.g.length; i++) if (f.g[i] === 4) { f.g[i] = 0; n++; }
      note(state, n ? "Thunder hits the switch. A door opens." : "The switch cracks and stays dead.");
      b.life = 0;
    }
  }
}

export function dungeonUse(state) {
  const dun = state.dun;
  if (!dun) return false;
  const st = state.duns[dun.def.id];
  const px = state.player.x / TILE | 0, py = state.player.y / TILE | 0;
  for (let y = py - 1; y <= py + 1; y++) for (let x = px - 1; x <= px + 1; x++) {
    const t = cell(dun, x, y);
    if (t === 6) { takeKey(state, x, y); return true; }
    if (t === 5) {
      setCell(dun, x, y, 16);
      state.player.gold += 20;
      note(state, "The chest holds 20 gold. The world outside is unchanged.");
      return true;
    }
    if (t === 13) {
      if ((st.keys || 0) < 1) { note(state, "The door wants a key."); return true; }
      st.keys--;
      setCell(dun, x, y, 0);
      note(state, "The key turns. The door opens.");
      return true;
    }
  }
  return false;
}

export function dungeonHurt(state, dmg, el, x, y) {
  let hit = false;
  const hx = x == null ? state.player.x : x, hy = y == null ? state.player.y : y;
  for (const f of state.dunFoes) {
    if (f.hp <= 0) continue;
    const reach = f.boss ? (el ? 48 : 36) : (el ? 28 : 20);
    if (Math.hypot(f.x - hx, f.y - hy) > reach) continue;
    const mul = el && f.weak === el ? 2 : 1;
    f.hp -= dmg * mul;
    f.hit = 0.12;
    hit = true;
    if (f.hp <= 0 && f.boss) {
      state.duns[state.dun.def.id].boss = 1;
      state.player.gold += 60;
      note(state, f.name + " stills. The lair seals. The world outside is unchanged.");
    }
  }
  return hit;
}

export function leaveDungeon(state) {
  const dun = state.dun;
  const def = dun && dun.def;
  state.mode = "world";
  state.dun = null;
  state.dunFoes = [];
  if (def && def.back) { state.player.x = def.back.x; state.player.y = def.back.y; }
  else if (def) { state.player.x = def.x * TILE; state.player.y = def.y * TILE; }
}

export function stepDungeonStairs(state, dir) {
  const dun = state.dun;
  if (!dun) return false;
  const tx = state.player.x / TILE | 0, ty = state.player.y / TILE | 0;
  const t = cell(dun, tx, ty);
  const st = state.duns[dun.def.id];
  if (t !== 3 && t !== 17) return false;
  if (dun.def.id === "cave" || (dun.level >= dun.floors.length - 1 && st.boss)) { leaveDungeon(state); return true; }
  if (t === 17 && dun.level > 0) { dun.level--; arrive(state); note(state, "You climb back a floor."); return true; }
  if (t === 3 && dun.level < dun.floors.length - 1) { dun.level++; arrive(state); note(state, "The stair drops into the next hall."); return true; }
  if (t === 3 && dun.level === 0 && dir > 0) { leaveDungeon(state); return true; }
  if (t === 3 && st.boss) { leaveDungeon(state); return true; }
  note(state, "The way on is still shut.");
  return false;
}

export function tickDungeonFoes(state, dt) {
  const p = state.player;
  for (const f of state.dunFoes) {
    if (f.hp <= 0) continue;
    if (f.hit > 0) f.hit -= dt;
    const dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy) || 1;
    const sp = f.boss ? 26 : 34;
    if (d > 14) {
      const nx = f.x + dx / d * sp * dt, ny = f.y + dy / d * sp * dt;
      if (!dungeonBlocked(state, nx, f.y)) f.x = nx;
      if (!dungeonBlocked(state, f.x, ny)) f.y = ny;
    } else if (p.iframes <= 0) { p.hp -= 1; p.iframes = 0.6; }
    if (!f.boss) continue;
    f.atk -= dt;
    if (f.atk > 0) continue;
    f.atk = f.hp < f.max * 0.5 ? 0.75 : 1.2;
    const n = f.hp < f.max * 0.5 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const ang = Math.atan2(dy, dx) + (i - (n - 1) / 2) * 0.45;
      state.shots.push({ kind: "foe", boss: f.kind, x: f.x, y: f.y - 10, vx: Math.cos(ang) * 78, vy: Math.sin(ang) * 78, life: 0.85, lv: 1, hit: false });
    }
  }
  for (const s of state.shots) {
    if (s.kind !== "foe" || p.iframes > 0) continue;
    if (Math.hypot(s.x - p.x, s.y - p.y) < 11) { p.hp -= 1; p.iframes = 0.45; s.life = 0; }
  }
  if (p.hp <= 0) {
    p.hp = p.maxHp;
    leaveDungeon(state);
    note(state, "You wake at the entrance, sore but whole.");
  }
}

export { DUNGEONS, cell as dunCell };
