// Seeded land, coasts, and ridges. Town tiles come from the plan, not from noise.

import { WW, WH, hash, planAt, buildingAt, propAt, RIDGE, TOWNS } from "./layout.js";

export const BLOBS = [
  { x: 2100, y: 1900, rx: 1500, ry: 1150, biome: "meadow", kingdom: "aldmoria" },
  { x: 3600, y: 2500, rx: 1200, ry: 980, biome: "forest", kingdom: "sylvara" },
  { x: 4700, y: 680, rx: 980, ry: 460, biome: "snow", kingdom: "frostreach" },
  { x: 5450, y: 1350, rx: 720, ry: 480, biome: "meadow", kingdom: "eastmarch" },
  { x: 5100, y: 980, rx: 380, ry: 240, biome: "meadow", kingdom: "eastmarch" },
  { x: 6460, y: 2360, rx: 860, ry: 520, biome: "desert", kingdom: "qadira" },
  { x: 2360, y: 4160, rx: 780, ry: 460, biome: "swamp", kingdom: "mirewood" },
  { x: 4300, y: 4280, rx: 860, ry: 560, biome: "nether", kingdom: "nethervale" }
];

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

export function isLand(tx, ty) {
  if (tx < 2 || ty < 2 || tx >= WW - 2 || ty >= WH - 2) return false;
  const e = fbm(tx, ty) - 0.5;
  for (let i = 0; i < BLOBS.length; i++) {
    const b = BLOBS[i];
    const nx = (tx - b.x) / b.rx, ny = (ty - b.y) / b.ry;
    if (nx * nx + ny * ny < 1 + e * 0.55) return true;
  }
  for (let i = 0; i < TOWNS.length; i++) {
    const t = TOWNS[i];
    const dx = tx - t.x, dy = ty - t.y;
    if (t.island) {
      const wob = (fbm(tx + 80, ty + 20) - 0.5) * 28;
      const r = (t.landR || 96) + wob;
      if (dx * dx + dy * dy < r * r) return true;
    } else if (dx * dx + dy * dy < 58 * 58) return true;
  }
  return false;
}

function biomeOf(tx, ty) {
  const e = fbm(tx, ty) - 0.5;
  let best = null, bestD = 1e9;
  for (let i = 0; i < BLOBS.length; i++) {
    const b = BLOBS[i];
    const nx = (tx - b.x) / b.rx, ny = (ty - b.y) / b.ry;
    const d = nx * nx + ny * ny - e * 0.55;
    if (d < bestD) { bestD = d; best = b; }
  }
  for (let i = 0; i < TOWNS.length; i++) {
    const t = TOWNS[i];
    if (!t.island) continue;
    const dx = tx - t.x, dy = ty - t.y;
    const r = (t.landR || 96) + (fbm(tx + 80, ty + 20) - 0.5) * 36;
    const d = (dx * dx + dy * dy) / (r * r);
    if (d < bestD) { bestD = d; best = { biome: "isle", kingdom: t.kingdom }; }
  }
  if (!best || bestD > 1) return { ground: "ocean", kingdom: null, coast: bestD < 1.08 };
  let ground = best.biome === "forest" ? "grass" : best.biome === "nether" ? "mud" : best.biome === "swamp" ? "marsh" : best.biome === "snow" ? "snow" : best.biome === "desert" ? "sand" : best.biome === "isle" ? "grass" : "grass";
  if (bestD > 0.86) ground = best.biome === "snow" ? "snow" : best.biome === "desert" ? "sand" : "sand";
  if (best.biome === "forest" && bestD < 0.7 && (hash(tx, ty, 6) % 5) === 0) ground = "forest";
  return { ground, kingdom: best.kingdom, coast: bestD > 0.86 };
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

export const CAVE = { x: RIDGE.stairX, y: RIDGE.y + 28 };

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
    if (prop && (prop.kind === "well" || prop.kind === "tree" || prop.kind === "brazier")) {
      return { ground: "grass", solid: true, prop, plan };
    }
    if (buildingAt(plan, tx, ty)) return { ground: "grass", solid: true, plan };
    if (plan.piers.has(k)) return { ground: "pier", solid: false, plan };
    if (plan.roads.has(k)) return { ground: plan.cobble.has(k) ? "cobble" : "dirt", solid: false, plan };
  }
  if (tx === CAVE.x && ty === CAVE.y) return { ground: "cave", solid: false };
  if (stairHere(tx, ty)) return { ground: "stair", solid: false };
  if (inRidge(tx, ty)) {
    const edge = Math.min(tx - RIDGE.x, ty - RIDGE.y, RIDGE.x + RIDGE.w - 1 - tx, RIDGE.y + RIDGE.h - 1 - ty);
    if (edge < 8) return { ground: "cliff", solid: true };
    return { ground: "moss", solid: false };
  }
  if (!isLand(tx, ty)) return { ground: "ocean", solid: true };
  const b = biomeOf(tx, ty);
  return { ground: b.ground, solid: false, kingdom: b.kingdom };
}
