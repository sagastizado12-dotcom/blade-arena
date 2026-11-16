// Hand-planned town rules. Streets are the gaps between lots, so a building
// cannot sit on a road. One keep per capital. Deterministic, no randomness.

export const TILE = 16;
export const WW = 8768;
export const WH = 6752;

export function hash(x, y, s = 0) {
  let n = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 1440662689;
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

export const KINGDOMS = [
  { id: "aldmoria", name: "Aldmoria", color: "#3d6fd6", dark: "#1c3e86", ruler: "King Aldric" },
  { id: "varnhold", name: "Varnhold", color: "#c83a3a", dark: "#7a1818", ruler: "Queen Brunhild" },
  { id: "sylvara", name: "Sylvara", color: "#3aa860", dark: "#146838", ruler: "Queen Elowen" },
  { id: "nethervale", name: "Nethervale", color: "#8a2a9a", dark: "#4a1058", ruler: "Lord Malzareth", demon: true },
  { id: "eastmarch", name: "Eastmarch", color: "#d08a2a", dark: "#7a4a10", ruler: "King Osric" },
  { id: "frostreach", name: "Frostreach", color: "#5ab8d8", dark: "#1a5870", ruler: "Queen Sigrun" },
  { id: "qadira", name: "Qadira", color: "#e0c040", dark: "#7a6410", ruler: "Sultana Amira" },
  { id: "mirewood", name: "Mirewood", color: "#6a8a2a", dark: "#3a4e12", ruler: "Warden Fennick" },
  { id: "halden", name: "Halden", color: "#e0a040", dark: "#7a5410", ruler: "King Halric" },
  { id: "brine", name: "Brine", color: "#3aa0b8", dark: "#145868", ruler: "Queen Maren" },
  { id: "yarrow", name: "Yarrow", color: "#6aaa48", dark: "#2a5a18", ruler: "King Rowan Hale" },
  { id: "moderno", name: "Moderno", color: "#2a6ad0", dark: "#143878", ruler: "the house of Moderno", hold: true },
  { id: "tidewatch", name: "Tidewatch", color: "#3a90a8", dark: "#145060", ruler: "Queen Lira Tide", citystate: true },
  { id: "bellhollow", name: "Bellhollow", color: "#5aaa40", dark: "#245818", ruler: "Queen Ness Bell", citystate: true },
  { id: "emberreach", name: "Emberreach", color: "#c4483a", dark: "#6a2018", ruler: "King Cinder Voss", citystate: true },
  { id: "wheatmarch", name: "Wheatmarch", color: "#c8a040", dark: "#6a5410", ruler: "King Harlan Wheat", citystate: true },
  { id: "briarford", name: "Briarford", color: "#6a9a48", dark: "#2a4a18", ruler: "Queen Briar Holt", citystate: true },
  { id: "oakenshore", name: "Oakenshore", color: "#d0a050", dark: "#6a4e18", ruler: "King Oaken Marr", citystate: true }
];

const K = Object.fromEntries(KINGDOMS.map(k => [k.id, k]));
export const kingdom = id => K[id];

const autumn = (roof, roofDk, wall = "#f3ddb8", wallDk = "#d2b48c") => ({ roof, roofDk, wall, wallDk });

export const TOWNS = [
  { id: "aldmoor", name: "Aldmoor", x: 1700, y: 1700, kingdom: "aldmoria", capital: true, showcase: true, ...autumn("#d4533a", "#8e3424") },
  { id: "wayford", name: "Wayford", x: 1280, y: 2280, kingdom: "aldmoria", ...autumn("#d0a060", "#7a5828") },
  { id: "haldenford", name: "Haldenford", x: 2500, y: 2140, kingdom: "halden", capital: true, ...autumn("#e0a040", "#8a5414") },
  { id: "varnhold", name: "Varnhold", x: 3900, y: 1960, kingdom: "varnhold", capital: true, ...autumn("#c83a3a", "#6a1414", "#efe0c8", "#c8b49a") },
  { id: "sylvaris", name: "Sylvaris", x: 3280, y: 2680, kingdom: "sylvara", capital: true, ...autumn("#3aa860", "#146838") },
  { id: "yarrowkeep", name: "Yarrowkeep", x: 3680, y: 3120, kingdom: "yarrow", capital: true, ...autumn("#6aaa48", "#2a5a18") },
  { id: "mossdeep", name: "Mossdeep", x: 2360, y: 4120, kingdom: "mirewood", capital: true, ...autumn("#5a7a3a", "#2a3a1a", "#c8b48a", "#8a7048") },
  { id: "pandemora", name: "Pandemora", x: 4300, y: 4240, kingdom: "nethervale", capital: true, demon: true, ...autumn("#4a2848", "#241420", "#5a4a58", "#3a3038") },
  { id: "frostmere", name: "Frostmere", x: 4780, y: 640, kingdom: "frostreach", capital: true, ...autumn("#8eb4d0", "#3a5a78", "#eef3f6", "#c4d0da") },
  { id: "eastwatch", name: "Eastwatch", x: 5480, y: 1320, kingdom: "eastmarch", capital: true, ...autumn("#d08a2a", "#7a4a10") },
  { id: "saltcrown", name: "Saltcrown", x: 6240, y: 1680, kingdom: "brine", capital: true, island: true, landR: 88, harbor: true, ...autumn("#3aa0b8", "#145868", "#f4f0e4", "#d4c8b0") },
  { id: "sandhaven", name: "Sandhaven", x: 6460, y: 2360, kingdom: "qadira", capital: true, ...autumn("#e8a85a", "#9a5a1a", "#f6e2b8", "#d8bc8a") },
  { id: "tidewatch", name: "Tidewatch", x: 900, y: 3120, kingdom: "tidewatch", capital: true, island: true, landR: 100, showcase: true, harbor: true, ...autumn("#3a90a8", "#145060", "#f7f1e4", "#d8cbb4") },
  { id: "bellhollow", name: "Bellhollow", x: 760, y: 4680, kingdom: "bellhollow", capital: true, island: true, landR: 96, harbor: true, ...autumn("#6aaa48", "#2a5818") },
  { id: "briarford", name: "Briarford", x: 1280, y: 5680, kingdom: "briarford", capital: true, island: true, landR: 96, harbor: true, ...autumn("#6a9a48", "#2a4a18") },
  { id: "oakenshore", name: "Oakenshore", x: 2920, y: 5860, kingdom: "oakenshore", capital: true, island: true, landR: 96, harbor: true, ...autumn("#d0a050", "#7a5820") },
  { id: "emberreach", name: "Emberreach", x: 7480, y: 1280, kingdom: "emberreach", capital: true, island: true, landR: 100, showcase: true, harbor: true, ...autumn("#c4483a", "#6a2018", "#f0d8c0", "#c8aa88") },
  { id: "wheatmarch", name: "Wheatmarch", x: 7720, y: 2860, kingdom: "wheatmarch", capital: true, island: true, landR: 100, harbor: true, ...autumn("#c8a040", "#6a5410", "#f8f0d0", "#d8c8a0") },
  { id: "moderno", name: "Moderno", x: 7920, y: 5980, kingdom: "moderno", manor: true, island: true, landR: 112, showcase: true, harbor: true, ...autumn("#d4533a", "#8e3424", "#f7f3ea", "#d4cbb8") }
];

export const RIDGE = { x: 1960, y: 1280, w: 200, h: 240, stairX: 2024 };

const key = (x, y) => x + "," + y;

function layoutTown(t) {
  const SX = 6, SY = 5, BW = 4, BH = 3;
  const cols = 7, rows = 6;
  const ox = t.x - 3 * SX;
  const oy = t.y - 2 * SY;
  const occupied = new Set();
  const roads = new Set();
  const cobble = new Set();
  const piers = new Set();
  const buildings = [];
  const props = [];
  const walls = [];
  const occ = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) occupied.add(key(xx, yy));
  };
  const blocked = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (occupied.has(key(xx, yy))) return true;
    return false;
  };
  let seq = 0;
  const add = (kind, x, y, w, h) => {
    if (blocked(x, y, w, h)) throw new Error(t.name + " " + kind + " overlaps at " + x + "," + y);
    occ(x, y, w, h);
    const b = { id: t.id + ":" + (seq++), kind, x, y, w, h, town: t.id, doorX: x + ((w / 2) | 0), doorY: y + h - 1 };
    buildings.push(b);
    return b;
  };

  if (t.capital || t.manor || t.demon) {
    add(t.manor ? "manor" : t.demon ? "keep" : "castle", ox + 2 * SX, oy - 3, 16, 6);
  }

  const skip = new Set(["3,2"]);
  if (t.capital || t.manor || t.demon) ["2,0", "3,0", "4,0"].forEach(s => skip.add(s));
  const civic = new Map(t.demon
    ? [["5,2", "trader"], ["1,2", "trader"], ["5,4", "barrack"], ["1,4", "barrack"], ["0,2", "barrack"], ["6,3", "barrack"]]
    : [["5,2", "inn"], ["1,2", "shop"], ["4,2", "shop"], ["3,4", "temple"], ["3,1", "hall"], ["2,4", "shop"]]);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const id = c + "," + r;
    if (skip.has(id)) continue;
    const kind = civic.get(id) || (t.demon ? null : "house");
    if (!kind) continue;
    add(kind, ox + c * SX, oy + r * SY, BW, BH);
  }

  const x0 = ox - 2, x1 = ox + cols * SX + 1;
  const y0 = oy - 1, y1 = oy + rows * SY + 1;
  const pave = (x, y, stone) => {
    const k = key(x, y);
    if (occupied.has(k)) return;
    roads.add(k);
    if (stone) cobble.add(k);
  };
  for (let r = 0; r < rows; r++) {
    const y = oy + r * SY + BH;
    const stone = r === 2;
    for (let x = x0; x < x1; x++) { pave(x, y, stone); pave(x, y + 1, stone); }
  }
  for (let c = 0; c < cols; c++) {
    const x = ox + c * SX + BW;
    const stone = c === 3;
    for (let y = y0; y < y1; y++) { pave(x, y, stone); pave(x + 1, y, stone); }
  }
  for (let y = y0; y < y1; y++) { pave(ox - 2, y, false); pave(ox - 1, y, false); }

  const px = ox + 3 * SX, py = oy + 2 * SY;
  for (let y = py; y < py + BH; y++) for (let x = px; x < px + BW; x++) {
    if (x === px + 1 && y === py + 1) {
      props.push({ kind: "well", x, y, w: 1, h: 1, town: t.id });
      occ(x, y, 1, 1);
      continue;
    }
    pave(x, y, true);
  }

  if (t.island || t.harbor) {
    const end = t.y + (t.landR || 86) + 10;
    for (let y = oy + rows * SY; y < end; y++) {
      pave(t.x, y, false);
      pave(t.x + 1, y, false);
      if (y > t.y + 24) {
        piers.add(key(t.x, y));
        piers.add(key(t.x + 1, y));
      }
    }
  }

  for (const b of buildings) {
    const k = key(b.doorX, b.doorY + 1);
    if (!roads.has(k) && !occupied.has(k)) roads.add(k);
  }

  const wantTrees = t.demon ? 0 : t.showcase ? 14 : 7;
  let trees = 0;
  for (let i = 0; i < 1200 && trees < wantTrees; i++) {
    const x = ox - 10 + (hash(i, t.x, 3) % (cols * SX + 20));
    const y = oy - 10 + (hash(i, t.y, 4) % (rows * SY + 22));
    const k = key(x, y);
    if (occupied.has(k) || roads.has(k) || piers.has(k)) continue;
    if (props.some(p => Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3)) continue;
    props.push({ kind: "tree", x, y, w: 1, h: 1, town: t.id, seed: i + 1 });
    occ(x, y, 1, 1);
    trees++;
  }
  if (t.demon) {
    for (const [x, y] of [[ox + 2 * SX - 2, oy - 1], [ox + 2 * SX + 17, oy - 1]]) {
      const k = key(x, y);
      if (occupied.has(k) || roads.has(k)) continue;
      props.push({ kind: "brazier", x, y, w: 1, h: 1, town: t.id });
      occ(x, y, 1, 1);
    }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const see = (x, y) => { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; };
  for (const b of buildings) { see(b.x, b.y); see(b.x + b.w - 1, b.y + b.h - 1); }
  for (const k of roads) { const [x, y] = k.split(",").map(Number); see(x, y); }
  for (const k of piers) { const [x, y] = k.split(",").map(Number); see(x, y); }
  for (const p of props) see(p.x, p.y);
  return { town: t, buildings, roads, cobble, piers, props, walls, minX, minY, maxX, maxY };
}

let _plans = null;
export function worldPlan() {
  if (_plans) return _plans;
  _plans = TOWNS.map(layoutTown);
  return _plans;
}

export function planAt(tx, ty) {
  const plans = worldPlan();
  for (let i = 0; i < plans.length; i++) {
    const p = plans[i];
    if (tx < p.minX || tx > p.maxX || ty < p.minY || ty > p.maxY) continue;
    return p;
  }
  return null;
}

export function buildingAt(plan, tx, ty) {
  if (!plan) return null;
  for (let i = 0; i < plan.buildings.length; i++) {
    const b = plan.buildings[i];
    if (tx >= b.x && ty >= b.y && tx < b.x + b.w && ty < b.y + b.h) return b;
  }
  return null;
}

export function propAt(plan, tx, ty) {
  if (!plan) return null;
  for (let i = 0; i < plan.props.length; i++) {
    const p = plan.props[i];
    if (tx >= p.x && ty >= p.y && tx < p.x + p.w && ty < p.y + p.h) return p;
  }
  return null;
}

export const START_TOWN = "aldmoor";
