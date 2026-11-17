// Seeded land, coasts, and ridges. Town tiles come from the plan, not from noise.

import { WW, WH, hash, planAt, buildingAt, propAt, RIDGE, TOWNS, cityRoads, streamAt } from "./layout.js";

// Hand-drawn coasts. Noise shoves the test point so the shore is jagged, not an oval.
const CONTINENTS = [
  [[520, 1280], [980, 860], [1680, 980], [2400, 820], [3180, 1080], [3920, 1420], [4680, 1680], [5120, 2140], [4980, 2860], [4760, 3480], [5040, 4120], [4680, 4860], [3920, 5280], [3040, 4960], [2140, 5180], [1280, 4560], [760, 3720], [420, 2860], [380, 1960], [480, 1460]],
  [[3980, 260], [4520, 160], [5280, 300], [5980, 480], [6520, 820], [6380, 1280], [5860, 1680], [5140, 1820], [4480, 1540], [4080, 1080], [3920, 640]],
  [[4980, 1980], [5680, 1720], [6420, 1860], [7480, 2140], [7360, 2920], [6540, 3280], [5760, 3040], [5120, 2620], [5060, 2200]]
];

export const RIVERS = [
  [[2140, 1460], [1980, 1680], [1760, 1960], [1580, 2280], [1320, 2680], [1080, 3120], [860, 3480]],
  [[2860, 2360], [3120, 2680], [3380, 3040], [3520, 3480], [3680, 3920], [3900, 4360]],
  [[4560, 860], [4920, 1080], [5280, 1320], [5080, 1560]],
  [[6120, 2100], [6480, 2360], [6920, 2580], [7240, 2860]]
];

export const BLOBS = [];

function fade(t) { return t * t * (3 - 2 * t); }

function noise(x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const sx = fade(fx), sy = fade(fy);
  const a = hash(x0, y0, 1) / 4294967296;
  const b = hash(x0 + 1, y0, 1) / 4294967296;
  const c = hash(x0, y0 + 1, 1) / 4294967296;
  const d = hash(x0 + 1, y0 + 1, 1) / 4294967296;
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export function fbm(x, y) {
  return noise(x * 0.012, y * 0.012) * 0.62
    + noise(x * 0.028 + 4, y * 0.028) * 0.28
    + noise(x * 0.06 + 9, y * 0.06) * 0.10;
}

function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i][1], yj = poly[j][1];
    if ((yi > y) !== (yj > y)) {
      const xi = poly[i][0], xj = poly[j][0];
      if (x < (xj - xi) * (y - yi) / (yj - yi + 0.0001) + xi) c = !c;
    }
  }
  return c;
}

function islandHere(tx, ty) {
  for (let i = 0; i < TOWNS.length; i++) {
    const t = TOWNS[i];
    if (!t.island) continue;
    const dx = tx - t.x, dy = ty - t.y;
    const ang = Math.atan2(dy, dx);
    const lump = Math.sin(ang * 3 + t.x * 0.01) * 0.16 + Math.sin(ang * 5.3) * 0.07;
    const jag = (fbm(t.x + Math.cos(ang) * 48, t.y + Math.sin(ang) * 48) - 0.5) * 26;
    const r = Math.max(78, (t.landR || 100) * (1 + lump) + jag);
    if (dx * dx + dy * dy < r * r) return t;
  }
  return null;
}

export function isLand(tx, ty) {
  if (tx < 2 || ty < 2 || tx >= WW - 2 || ty >= WH - 2) return false;
  if (islandHere(tx, ty)) return true;
  for (let i = 0; i < TOWNS.length; i++) {
    const t = TOWNS[i];
    if (t.island) continue;
    if ((tx - t.x) ** 2 + (ty - t.y) ** 2 < 56 * 56) return true;
  }
  const wx = tx + (fbm(tx, ty) - 0.5) * 320 + Math.sin(ty * 0.007) * 180 + (noise(tx * 0.01, ty * 0.01) - 0.5) * 140;
  const wy = ty + (fbm(tx + 90, ty - 40) - 0.5) * 240 + Math.sin(tx * 0.006) * 160;
  for (let i = 0; i < CONTINENTS.length; i++) if (inside(CONTINENTS[i], wx, wy)) return true;
  return false;
}

function nearestTown(tx, ty, islandOnly) {
  let best = null, bd = 1e9;
  for (let i = 0; i < TOWNS.length; i++) {
    const t = TOWNS[i];
    if (islandOnly && !t.island) continue;
    if (!islandOnly && t.island) continue;
    const d = (tx - t.x) ** 2 + (ty - t.y) ** 2;
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}

export function riverAt(tx, ty) {
  for (let r = 0; r < RIVERS.length; r++) {
    const line = RIVERS[r];
    for (let i = 1; i < line.length; i++) {
      const x1 = line[i - 1][0], y1 = line[i - 1][1], x2 = line[i][0], y2 = line[i][1];
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx * dx + dy * dy || 1;
      let u = ((tx - x1) * dx + (ty - y1) * dy) / len2;
      if (u < 0) u = 0; else if (u > 1) u = 1;
      const px = x1 + dx * u, py = y1 + dy * u;
      if ((tx - px) ** 2 + (ty - py) ** 2 <= 4) return true;
    }
  }
  return false;
}

function biomeOf(tx, ty) {
  const isle = islandHere(tx, ty);
  const town = isle || nearestTown(tx, ty, false);
  const kingdom = town ? town.kingdom : null;
  let ground = "grass";
  if (kingdom === "frostreach") ground = "snow";
  else if (kingdom === "qadira") ground = "sand";
  else if (kingdom === "nethervale") ground = "mud";
  else if (kingdom === "mirewood") ground = (hash(tx, ty, 6) % 3) ? "marsh" : "grass";
  else if (fbm(tx * 1.6, ty * 1.6) > 0.58 || kingdom === "sylvara" && fbm(tx, ty) > 0.46) ground = "forest";
  return { ground, kingdom, coast: false };
}

export function inRange(tx, ty) {
  if (tx > 1680 && tx < 4200) {
    const spine = 1460 + Math.sin(tx * 0.0042) * 90;
    if (Math.abs(ty - spine) < 10 + (hash(tx, ty, 3) % 6)) return true;
  }
  if (tx > 4300 && tx < 6400) {
    const spine = 780 + Math.sin(tx * 0.005) * 50;
    if (Math.abs(ty - spine) < 8 + (hash(tx, ty, 4) % 5)) return true;
  }
  if (tx > 5600 && tx < 7200) {
    const spine = 2500 + Math.sin(tx * 0.006) * 40;
    if (Math.abs(ty - spine) < 7) return true;
  }
  return false;
}

export function inRidge(tx, ty) {
  const rx = tx - RIDGE.x, ry = ty - RIDGE.y;
  if (rx < 0 || ry < 0 || rx >= RIDGE.w || ry >= RIDGE.h) return false;
  const e = fbm(tx + 20, ty + 20);
  const edge = Math.min(rx, ry, RIDGE.w - 1 - rx, RIDGE.h - 1 - ry);
  return edge > 6 + e * 10;
}

export function stairHere(tx, ty) {
  if (!inRidge(tx, ty) && !(tx >= RIDGE.stairX && tx <= RIDGE.stairX + 1 && ty >= RIDGE.y + RIDGE.h - 2 && ty <= RIDGE.y + RIDGE.h + 8)) return false;
  return tx >= RIDGE.stairX && tx <= RIDGE.stairX + 1 && ty >= RIDGE.y + 16 && ty <= RIDGE.y + RIDGE.h + 8;
}

export const CAVE = {
  get x() { return RIDGE.stairX; },
  get y() { return RIDGE.y + 28; }
};

export function wildTree(tx, ty) {
  if (planAt(tx, ty)) return false;
  if (inRidge(tx, ty) || stairHere(tx, ty)) return false;
  if (tx === CAVE.x && ty === CAVE.y) return false;
  const b = biomeOf(tx, ty);
  if (b.ground !== "grass" && b.ground !== "forest") return false;
  const m = b.ground === "forest" ? 70 : 130;
  return hash(tx, ty, 9) % m === 0;
}

export function sample(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= WW || ty >= WH) return { ground: "void", solid: true };
  const plan = planAt(tx, ty);
  if (plan) {
    const k = tx + "," + ty;
    const prop = propAt(plan, tx, ty);
    if (prop && prop.kind !== "boat" && prop.kind !== "ship" && prop.kind !== "gull" && prop.kind !== "net") {
      const paved = plan.cobble && plan.cobble.has(k);
      const stone = plan.town && plan.town.id === "emberreach" ? "emberstone" : "cobble";
      if (prop.kind === "lamp") return { ground: paved ? stone : "dirt", solid: false, prop, plan };
      return { ground: paved ? stone : "dirt", solid: true, prop, plan };
    }
    if (buildingAt(plan, tx, ty)) {
      const stone = plan.town && plan.town.id === "emberreach" ? "emberstone" : "cobble";
      return { ground: stone, solid: true, plan };
    }
    if (plan.lava && plan.lava.has(k)) return { ground: "lava", solid: true, plan };
    if (plan.piers.has(k)) return { ground: "pier", solid: false, plan };
    if (plan.bridges && plan.bridges.has(k)) return { ground: "bridge", solid: false, plan };
    if (plan.quay && plan.quay.has(k)) return { ground: "quay", solid: false, plan };
    if (plan.water && plan.water.has(k)) return { ground: "stream", solid: true, plan };
    if (plan.roads.has(k)) {
      if (streamAt(tx, ty) || (plan.water && plan.water.has(k))) return { ground: "bridge", solid: false, plan };
      if (plan.cobble && plan.cobble.has(k)) return { ground: plan.town.id === "emberreach" ? "emberstone" : "cobble", solid: false, plan };
      return { ground: "dirt", solid: false, plan };
    }
  }
  const onRoad = cityRoads().has(tx + "," + ty);
  const wet = streamAt(tx, ty) || riverAt(tx, ty);
  if (wet && isLand(tx, ty)) return { ground: onRoad ? "bridge" : "stream", solid: !onRoad };
  if (onRoad && isLand(tx, ty)) return { ground: "dirt", solid: false };
  if (tx === CAVE.x && ty === CAVE.y) return { ground: "cave", solid: false };
  if (stairHere(tx, ty)) return { ground: "stair", solid: false };
  if (inRidge(tx, ty)) {
    const edge = Math.min(tx - RIDGE.x, ty - RIDGE.y, RIDGE.x + RIDGE.w - 1 - tx, RIDGE.y + RIDGE.h - 1 - ty);
    if (edge < 8) return { ground: "cliff", solid: true };
    return { ground: "moss", solid: false };
  }
  if (inRange(tx, ty) && isLand(tx, ty) && !planAt(tx, ty)) {
    return { ground: "cliff", solid: false, kingdom: biomeOf(tx, ty).kingdom };
  }
  if (!isLand(tx, ty)) return { ground: "ocean", solid: true };
  const b = biomeOf(tx, ty);
  return { ground: b.ground, solid: false, kingdom: b.kingdom };
}
