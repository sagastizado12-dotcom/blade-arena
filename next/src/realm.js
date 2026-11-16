// Kingdoms, wars, trade, family, houses, dungeons, weather.
// Walk and flight speeds live in sim.js and are not changed here.

import { TILE, worldPlan, DUNGEONS, hash } from "./layout.js";

export function initRealm(state) {
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
  const kid = state.npcs.find(k => k.child && k.town === n.town && !k.heroKid);
  if (kid) { kid.heroKid = true; kid.parents = [n.id, -1]; }
  note(state, n.name + " walks with you through the square.");
  return true;
}

export function startWar(state) {
  let w = state.wars.find(q => !q.done);
  if (w) return w;
  w = { a: "aldmoria", b: "varnhold", na: 30, nb: 26, done: 0, surrendered: null, fx: 2800, fy: 1860 };
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

function floorOf(dun) { return dun.floors[dun.level]; }
function cell(dun, x, y) {
  const f = floorOf(dun);
  if (x < 0 || y < 0 || x >= f.w || y >= f.h) return 1;
  return f.g[y * f.w + x];
}
function setCell(dun, x, y, t) {
  const f = floorOf(dun);
  if (x < 0 || y < 0 || x >= f.w || y >= f.h) return;
  f.g[y * f.w + x] = t;
}

function makeFloor(def, level) {
  const w = 20, h = 14;
  const g = new Uint8Array(w * h);
  g.fill(1);
  const put = (x, y, t) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1) g[y * w + x] = t; };
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) put(x, y, 0);
  if (level === 0) {
    for (let x = 8; x <= 11; x++) put(x, 6, 8);
    put(15, 4, 9);
    if (def.el === "air") for (let x = 3; x <= 16; x++) put(x, 9, 2);
    put(10, 11, 3);
  } else if (level === 1) {
    put(6, 6, 11); put(7, 6, 0);
    put(14, 5, 10);
    put(16, 8, 4);
    put(10, 11, 3);
  } else {
    put(10, 4, 0);
    put(10, 11, 3);
  }
  return { w, h, g };
}

export function enterDungeon(state, id) {
  const def = DUNGEONS.find(d => d.id === id);
  if (!def) return false;
  state.duns[id] = state.duns[id] || { lit: {}, boss: 0, sealed: 0 };
  state.dun = { def, level: 0, floors: [0, 1, 2].map(f => makeFloor(def, f)) };
  state.dunFoes = [];
  state.mode = "dungeon";
  state.player.x = 5 * TILE; state.player.y = 10 * TILE;
  state.player.fly = false; state.player.alt = 0; state.player.z = 0;
  note(state, "You step into " + def.name + ".");
  return true;
}

export function dungeonBlocked(state, px, py) {
  const dun = state.dun;
  if (!dun) return true;
  const pts = [[px - 3, py - 1], [px + 3, py - 1], [px - 3, py + 2], [px + 3, py + 2]];
  for (const [x, y] of pts) {
    const t = cell(dun, x / TILE | 0, y / TILE | 0);
    if (t === 1 || t === 2 || t === 4 || t === 8 || t === 11) return true;
  }
  return false;
}

export function dungeonPuzzle(state) {
  const dun = state.dun;
  if (!dun) return;
  const st = state.duns[dun.def.id];
  for (const s of state.shots || []) {
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
    if (cell(dun, tx, ty) === 10) { setCell(dun, 16, 8, 0); note(state, "Thunder hits the switch. A door opens."); b.life = 0; }
  }
  if (dun.level === 2 && !state.dunFoes.some(f => f.boss && f.hp > 0) && !st.boss) {
    if (!state.dunFoes.some(f => f.boss)) state.dunFoes.push({ boss: 1, x: 10 * TILE, y: 5 * TILE, hp: 16, max: 16, weak: dun.def.el });
  }
}

export function dungeonHurt(state, dmg, el, x, y) {
  let hit = false;
  const hx = x == null ? state.player.x : x, hy = y == null ? state.player.y : y;
  for (const f of state.dunFoes) {
    if (f.hp <= 0) continue;
    if (Math.hypot(f.x - hx, f.y - hy) > (el ? 40 : 28)) continue;
    const mul = el && f.weak === el ? 2 : 1;
    f.hp -= dmg * mul;
    hit = true;
    if (f.hp <= 0 && f.boss) {
      state.duns[state.dun.def.id].boss = 1;
      state.player.gold += 60;
      note(state, state.dun.def.name + " is still. The lair seals. The world outside is unchanged.");
    }
  }
  return hit;
}

export function leaveDungeon(state) {
  const def = state.dun && state.dun.def;
  state.mode = "world";
  state.dun = null;
  state.dunFoes = [];
  if (def) { state.player.x = def.x * TILE; state.player.y = def.y * TILE; }
}

export function stepDungeonStairs(state, dir) {
  const dun = state.dun;
  const tx = state.player.x / TILE | 0, ty = state.player.y / TILE | 0;
  if (cell(dun, tx, ty) !== 3) return false;
  if (dir < 0 && dun.level < 2) { dun.level++; state.player.x = 5 * TILE; state.player.y = 10 * TILE; return true; }
  if (dir > 0 && dun.level > 0) { dun.level--; return true; }
  if (dir > 0 && dun.level === 0) { leaveDungeon(state); return true; }
  return false;
}

export { DUNGEONS, cell as dunCell };
