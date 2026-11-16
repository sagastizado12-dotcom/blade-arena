// Fails the build if any town structure overlaps another, a road, or water.

import { worldPlan, TOWNS } from "./src/layout.js";
import { isLand, wildTree, sample } from "./src/terrain.js";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));
const bad = [];
const say = m => bad.push(m);
const plans = worldPlan();
const key = (x, y) => x + "," + y;

for (let i = 0; i < plans.length; i++) {
  const p = plans[i];
  const t = p.town;
  const seen = new Map();
  const claim = (x, y, what) => {
    const k = key(x, y);
    if (seen.has(k)) say(t.name + " " + what + " overlaps " + seen.get(k) + " at " + k);
    else seen.set(k, what);
  };
  for (const b of p.buildings) {
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
      claim(x, y, b.kind + ":" + b.id);
      if (p.roads.has(key(x, y))) say(t.name + " " + b.kind + " sits on a road at " + x + "," + y);
      if (p.piers.has(key(x, y))) say(t.name + " " + b.kind + " sits on a pier at " + x + "," + y);
      if (!isLand(x, y)) say(t.name + " " + b.kind + " is in the water at " + x + "," + y);
      const s = sample(x, y);
      if (!s.solid) say(t.name + " building tile is not solid " + x + "," + y);
    }
    if (!p.roads.has(key(b.doorX, b.doorY + 1))) say(t.name + " " + b.kind + " door does not face a road");
  }
  for (const prop of p.props) {
    for (let y = prop.y; y < prop.y + prop.h; y++) for (let x = prop.x; x < prop.x + prop.w; x++) {
      claim(x, y, prop.kind);
      if (p.roads.has(key(x, y))) say(t.name + " " + prop.kind + " sits on a road at " + x + "," + y);
      if (prop.kind === "well" && p.roads.has(key(x, y))) say(t.name + " well on road");
    }
  }
  for (const w of p.walls) claim(w.x, w.y, "wall");
  const keeps = p.buildings.filter(b => b.kind === "castle" || b.kind === "keep" || b.kind === "manor");
  if (keeps.length > 1) say(t.name + " has " + keeps.length + " keeps");
  if ((t.capital || t.manor || t.demon) && keeps.length !== 1) say(t.name + " is missing its one keep");
  if (!t.capital && !t.manor && !t.demon && keeps.length) say(t.name + " has an extra keep");
  if (t.demon && p.buildings.some(b => b.kind === "house" || b.kind === "inn" || b.kind === "temple" || b.kind === "hall")) {
    say(t.name + " has a cozy house");
  }
  const wells = p.props.filter(p0 => p0.kind === "well");
  if (wells.length !== 1) say(t.name + " wells " + wells.length);
  for (let y = p.minY; y <= p.maxY; y++) for (let x = p.minX; x <= p.maxX; x++) {
    if (wildTree(x, y)) say("wild tree inside " + t.name + " at " + x + "," + y);
  }
}

for (let i = 0; i < plans.length; i++) for (let j = i + 1; j < plans.length; j++) {
  const a = plans[i], b = plans[j];
  if (a.maxX + 40 >= b.minX && b.maxX + 40 >= a.minX && a.maxY + 40 >= b.minY && b.maxY + 40 >= a.minY) {
    say(a.town.name + " is too close to " + b.town.name);
  }
}

const forbidden = ["rock", "tomb", "grave", "lookout", "pencil", "boulder"];
for (const p of plans) for (const prop of p.props) {
  if (forbidden.includes(prop.kind)) say("forbidden prop " + prop.kind);
}

if (bad.length) {
  console.error(bad.slice(0, 40).join("\n"));
  console.error(bad.length + " layout problems");
  process.exit(1);
}

const ver = String(Math.floor(Date.now() / 1000));
writeFileSync(join(root, "version.json"), JSON.stringify({ v: ver }) + "\n");
const swPath = join(root, "sw.js");
let sw = readFileSync(swPath, "utf8");
if (!sw.includes("__VER__") && !sw.includes("blade-next-")) {
  console.error("sw.js has no version slot");
  process.exit(1);
}
sw = sw.replace(/__VER__/g, ver).replace(/blade-next-\d+/g, "blade-next-" + ver);
writeFileSync(swPath, sw);
console.log("layout ok", plans.length, "towns", plans.reduce((n, p) => n + p.buildings.length, 0), "buildings", "v" + ver);
