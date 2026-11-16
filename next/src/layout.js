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

export function tilesOf(b) {
  const parts = b.parts || [{ x: b.x, y: b.y, w: b.w, h: b.h }];
  const out = [];
  for (const p of parts) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) out.push([x, y]);
  return out;
}

function layoutTown(t) {
  const cx = t.x, cy = t.y;
  const occupied = new Set();
  const roads = new Set();
  const cobble = new Set();
  const piers = new Set();
  const water = new Set();
  const bridges = new Set();
  const buildings = [];
  const props = [];
  const walls = [];
  const occTiles = (tiles) => { for (const [x, y] of tiles) occupied.add(key(x, y)); };
  const hitTiles = (tiles) => tiles.some(([x, y]) => occupied.has(key(x, y)) || roads.has(key(x, y)) || water.has(key(x, y)) || bridges.has(key(x, y)));
  let seq = 0;
  const add = (kind, x, y, w, h, parts) => {
    const b = { id: t.id + ":" + (seq++), kind, x, y, w, h, town: t.id, doorX: x + (w >> 1), doorY: y + h - 1, parts: parts || null };
    const tiles = tilesOf(b);
    if (hitTiles(tiles)) return null;
    occTiles(tiles);
    if ((kind === "cottage" || kind === "hut" || kind === "tall" || kind === "ell") && (hash(x, y, 11) % 4) === 0) { b.sale = 1; b.price = 220 + (hash(x, y, 12) % 5) * 40; }
    buildings.push(b);
    return b;
  };
  const undo = (b) => {
    const i = buildings.indexOf(b);
    if (i >= 0) buildings.splice(i, 1);
    for (const [tx, ty] of tilesOf(b)) occupied.delete(key(tx, ty));
  };
  const paint = (x, y) => {
    const k = key(x, y);
    if (occupied.has(k) || water.has(k)) return false;
    roads.add(k);
    return true;
  };
  const big = !!(t.capital || t.manor);
  const catalog = t.demon
    ? [["barrack", 5, 3], ["trader", 5, 3], ["barrack", 4, 4], ["tall", 3, 5], ["barrack", 3, 3], ["trader", 4, 3], ["barrack", 4, 3]]
    : [["inn", 6, 4], ["shop", 5, 3], ["mill", 4, 4], ["temple", 5, 4], ["hall", 4, 3], ["hut", 3, 3], ["cottage", 5, 3], ["tall", 3, 5], ["ell", 5, 4], ["hut", 3, 3], ["cottage", 4, 3], ["shop", 4, 3], ["tall", 4, 4], ["hut", 4, 3], ["cottage", 4, 4]];

  const spots = [];
  const market = [];
  const wander = (x0, y0, steps, xMin, xMax, yMin, yMax, into) => {
    let x = x0, y = y0, dir = hash(x0, y0, 3) % 2 ? 1 : -1;
    for (let i = 0; i < steps; i++) {
      if (x < xMin || x > xMax || y < yMin || y > yMax) {
        dir = -dir;
        y += 2;
        if (y > yMax || y < yMin) break;
      }
      paint(x, y);
      const spot = { x, y };
      spots.push(spot);
      if (into) into.push(spot);
      const roll = hash(i, x + cx, y) % 8;
      if (roll === 0) y -= 1;
      else if (roll <= 2) y += 1;
      else x += dir;
      if (x >= xMax) { dir = -1; y += 2; x = xMax - 1; }
      if (x <= xMin) { dir = 1; y += 2; x = xMin + 1; }
    }
  };

  if (t.capital || t.manor || t.demon) {
    const kind = t.manor ? "manor" : t.demon ? "keep" : "castle";
    const py = big ? cy - 36 : cy - 16;
    let b = null;
    for (const [dx, dy] of [[-4, 0], [6, 1], [-12, 2], [2, -2], [8, 3]]) {
      b = add(kind, cx + dx, py + dy, 8, 5);
      if (b) break;
    }
    if (!b) b = add(kind, cx - 3, py + 4, 6, 4);
    if (b) for (let yy = b.y + b.h; yy <= (big ? cy - 24 : cy - 6); yy++) paint(b.doorX, yy);
  }

  if (big) {
    const lanes = [
      { y: cy - 18, x0: cx - 4, x1: cx + 16, market: true },
      { y: cy + 8, x0: cx - 20, x1: cx + 8, market: false },
      { y: cy + 30, x0: cx - 10, x1: cx + 18, market: false }
    ];
    let linkX = buildings[0] ? buildings[0].doorX : cx;
    let linkY = cy - 24;
    for (const lane of lanes) {
      let y = lane.y + ((hash(lane.y, cx, 2) % 3) - 1);
      const dir = lane.x0 < lane.x1 ? 1 : -1;
      for (let x = lane.x0; x !== lane.x1; x += dir) {
        if ((hash(x, lane.y, 3) % 8) === 0) y += (hash(x, y, 1) % 2) ? 1 : -1;
        if (y < lane.y - 1) y = lane.y - 1;
        if (y > lane.y + 1) y = lane.y + 1;
        paint(x, y);
        const spot = { x, y };
        spots.push(spot);
        if (lane.market) market.push(spot);
      }
      const xJoin = dir > 0 ? lane.x0 : lane.x0;
      for (let yy = Math.min(linkY, y); yy <= Math.max(linkY, y); yy++) paint(linkX, yy);
      for (let xx = Math.min(linkX, xJoin); xx <= Math.max(linkX, xJoin); xx++) paint(xx, y);
      linkX = dir > 0 ? lane.x1 - 1 : lane.x1 + 1;
      linkY = y;
    }
    const hy = cy + 42;
    for (let d = linkY; d <= hy; d++) paint(linkX, d);
    for (let sx = cx - 12; sx <= cx + 14; sx++) {
      const wobble = (hash(sx, cy, 4) % 3) - 1;
      for (let w = 0; w < 7; w++) {
        const sy = hy + w + wobble;
        const k = key(sx, sy);
        if (occupied.has(k)) continue;
        if (roads.has(k)) { bridges.add(k); piers.add(k); }
        else water.add(k);
      }
    }
    if (!t.demon && !buildings.some(b => b.kind === "temple")) {
      const ty = cy - 14;
      for (let x = cx - 20; x <= cx - 12; x++) paint(x, ty);
      const temple = add("temple", cx - 20, ty - 4, 6, 4);
      if (temple && !roads.has(key(temple.doorX, temple.doorY + 1))) undo(temple);
    }
    for (const px of [cx - 8, cx + 1, cx + 9]) {
      for (let d = 0; d < 8; d++) {
        const k = key(px, hy - 1 + d);
        if (occupied.has(k)) continue;
        roads.add(k);
        piers.add(k);
        if (water.has(k)) bridges.add(k);
      }
    }
  } else {
    let x = cx - 12, y = cy - 6, dir = hash(cx, cy, 3) % 2 ? 1 : -1;
    for (let i = 0; i < 96; i++) {
      paint(x, y);
      if ((hash(i, x, y) % 5) !== 0) spots.push({ x, y });
      const bend = hash(i, cx, cy) % 8 === 0;
      if (bend) { y += 3 + (hash(i, cy, 2) % 2); x += dir * 2; }
      else x += dir;
      if ((hash(i, y, 4) % 6) === 0) y += hash(i, x, 5) % 2 ? 1 : -1;
      if (x > cx + 14) { dir = -1; y += 3; x = cx + 14; }
      if (x < cx - 14) { dir = 1; y += 3; x = cx - 14; }
      if (y > cy + 22) break;
      if (y < cy - 8) y = cy - 6;
    }
    if (spots.length) {
      const start = spots[0];
      const keep = buildings[0];
      if (keep) {
        for (let yy = keep.doorY + 1; yy <= start.y; yy++) paint(keep.doorX, yy);
        for (let xx = Math.min(keep.doorX, start.x); xx <= Math.max(keep.doorX, start.x); xx++) paint(xx, start.y);
      }
    }
    const mid = spots[spots.length >> 1] || { x: cx, y: cy + 4 };
    for (let sx = cx - 18; sx <= cx + 18; sx++) {
      const sy = mid.y + Math.round(Math.sin((sx - cx) * 0.45));
      if (roads.has(key(sx, sy))) bridges.add(key(sx, sy));
      for (let w = 1; w <= 2; w++) {
        const k = key(sx, sy + w);
        if (!occupied.has(k) && !roads.has(k)) water.add(k);
      }
    }
  }

  const place = (kind, hx, hy, w, h) => {
    let b = null;
    if (kind === "ell") {
      const parts = [{ x: hx, y: hy, w: 3, h: 4 }, { x: hx + 3, y: hy + 2, w: 2, h: 2 }];
      b = add("ell", hx, hy, 5, 4, parts);
      if (b) { b.doorX = hx + 1; b.doorY = hy + 3; }
    } else b = add(kind, hx, hy, w, h);
    if (b && !roads.has(key(b.doorX, b.doorY + 1))) { undo(b); return null; }
    return b;
  };

  const atSpot = (kind, w, h, s) => {
    if (kind === "ell") return place("ell", s.x - 1, s.y - 4, 5, 4);
    return place(kind, s.x - (w >> 1), s.y - h, w, h);
  };
  const ensure = (kind, w, h) => {
    if (buildings.some(b => b.kind === kind)) return;
    for (let i = 0; i < spots.length; i += 2) if (atSpot(kind, w, h, spots[i])) return;
  };
  const ensureCount = (kind, w, h, n) => {
    let guard = 0;
    while (buildings.filter(b => b.kind === kind).length < n && guard++ < spots.length) {
      let ok = false;
      for (let i = guard; i < spots.length; i++) if (atSpot(kind, w, h, spots[i])) { ok = true; break; }
      if (!ok) break;
    }
  };
  if (!t.demon) {
    ensure("inn", 6, 4);
    ensure("shop", 5, 3);
    ensure("mill", 4, 4);
    if (big) {
      ensureCount("shop", 5, 3, 3);
      ensureCount("cottage", 4, 3, 6);
      ensureCount("temple", 5, 4, 1);
      if (!buildings.some(b => b.kind === "temple")) ensureCount("temple", 4, 3, 1);
    }
  } else ensure("trader", 5, 3);
  let ci = hash(cx, cy, 1) % catalog.length;
  for (let i = 1; i < spots.length;) {
    let placed = null;
    for (let attempt = 0; attempt < catalog.length && !placed; attempt++) {
      const [kind, w, h] = catalog[(ci + attempt) % catalog.length];
      const have = buildings.filter(b => b.kind === kind).length;
      const cap = !big ? (kind === "hut" || kind === "cottage" ? 3 : kind === "shop" ? 2 : 1)
        : t.demon ? (kind === "barrack" || kind === "trader" ? 6 : 2)
        : (kind === "hut" || kind === "cottage" ? 8 : kind === "shop" ? 4 : kind === "tall" || kind === "ell" ? 3 : 1);
      if (have >= cap) continue;
      placed = atSpot(kind, w, h, spots[i]);
      if (placed) ci += attempt + 1;
    }
    i += placed ? placed.w + 1 + (hash(i, cx, cy) % 3) : 2;
  }
  if (big && !t.demon) {
    let n = 0;
    for (const b of buildings) {
      if (n >= 4) break;
      if (b.kind === "cottage" || b.kind === "hut" || b.kind === "tall" || b.kind === "ell") {
        b.sale = 1; b.price = 240 + (hash(b.x, b.y, 12) % 5) * 40; n++;
      }
    }
  }

  if (!big && (t.island || t.harbor)) {
    for (let yy = cy + 6; yy < cy + Math.min(t.landR || 80, 70); yy++) {
      if (!occupied.has(key(cx, yy)) && !water.has(key(cx, yy))) { roads.add(key(cx, yy)); if (yy > cy + 16) piers.add(key(cx, yy)); }
      if (!occupied.has(key(cx + 1, yy)) && !water.has(key(cx + 1, yy))) { roads.add(key(cx + 1, yy)); if (yy > cy + 16) piers.add(key(cx + 1, yy)); }
    }
  }

  const span = big ? 44 : 26;
  const yard = (nx, ny) => {
    const nk = key(nx, ny);
    if (occupied.has(nk) || roads.has(nk) || water.has(nk) || piers.has(nk) || bridges.has(nk)) return false;
    if (Math.abs(nx - cx) > span || Math.abs(ny - cy) > span) return false;
    return true;
  };
  const putProp = (kind, nx, ny) => {
    if (!yard(nx, ny)) return false;
    props.push({ kind, x: nx, y: ny, w: 1, h: 1, town: t.id, seed: hash(nx, ny, 1) % 6 });
    occupied.add(key(nx, ny));
    return true;
  };
  let trees = 0, hedges = 0, flowers = 0, fences = 0, barrels = 0, crates = 0, stalls = 0;
  const wantTrees = t.demon ? 6 : t.id === "sylvaris" || t.id === "briarford" ? 28 : t.id === "emberreach" || t.id === "sandhaven" ? 8 : big ? 18 : 14;
  const treeSpan = big ? 34 : 18;
  for (let i = 0; i < 2400 && trees < wantTrees; i++) {
    const nx = cx - treeSpan + (hash(i, cx, 3) % (treeSpan * 2));
    const ny = cy - treeSpan + (hash(i, cy, 4) % (treeSpan * 2 + 6));
    if (props.some(p => p.kind === "tree" && Math.abs(p.x - nx) < 3 && Math.abs(p.y - ny) < 3)) continue;
    if (putProp("tree", nx, ny)) trees++;
  }
  const y0 = big ? cy - 30 : cy - 18, y1 = big ? cy + 20 : cy + 24;
  const x0 = big ? cx - 24 : cx - 18, x1 = big ? cx + 24 : cx + 18;
  const stallCap = big && !t.demon ? 8 : 2;
  for (let ny = y0; ny <= y1; ny++) for (let nx = x0; nx <= x1; nx++) {
    if (!yard(nx, ny)) continue;
    const h = hash(nx, ny, 15) % 19;
    if (h === 0 && hedges < (big ? 22 : 16) && t.id !== "emberreach") { if (putProp("hedge", nx, ny)) hedges++; }
    else if (h === 1 && flowers < (big ? 24 : 18)) { if (putProp("flowers", nx, ny)) flowers++; }
    else if (h === 2 && fences < (big ? 16 : 12)) { if (putProp("fence", nx, ny)) fences++; }
    else if (h === 3 && barrels < (big ? 10 : 7)) { if (putProp("barrel", nx, ny)) barrels++; }
    else if (h === 4 && crates < (big ? 8 : 6)) { if (putProp("crate", nx, ny)) crates++; }
    else if (h === 5 && stalls < stallCap && !t.demon) { if (putProp("stall", nx, ny)) stalls++; }
  }
  if (big) {
    for (const s of market) {
      if (stalls >= 12) break;
      if ((s.x + s.y) % 2 === 0 && putProp("stall", s.x, s.y + 1)) stalls++;
      else if (putProp("stall", s.x, s.y - 1)) stalls++;
    }
  }
  if (t.id === "wheatmarch") {
    let wheat = 0;
    for (let i = 0; i < 80 && wheat < 16; i++) if (putProp("wheat", cx - 16 + (hash(i, 2, cy) % 32), cy + 16 + (hash(i, 5, cx) % 10))) wheat++;
  }
  if (t.id === "emberreach" || t.demon) {
    let fires = 0;
    for (let i = 0; i < 40 && fires < 8; i++) if (putProp("brazier", cx - 16 + (hash(i, 8, cy) % 32), cy - 18 + (hash(i, 3, cx) % 30))) fires++;
  }
  if (big) {
    let boats = 0;
    for (const k of water) {
      if (boats >= 4) break;
      const [bx, by] = k.split(",").map(Number);
      if (piers.has(k) || bridges.has(k) || occupied.has(k)) continue;
      if ((hash(bx, by, 6) % 9) !== 0) continue;
      props.push({ kind: "boat", x: bx, y: by, w: 1, h: 1, town: t.id });
      occupied.add(k);
      boats++;
    }
  }
  for (let r = 2; r < 12 && !props.some(p => p.kind === "well"); r++) {
    for (let a = 0; a < 12; a++) {
      const wx = cx + ((hash(r, a, 1) % (r * 2 + 1)) - r);
      const wy = cy + ((hash(r, a, 2) % (r * 2 + 1)) - r);
      if (yard(wx, wy)) { props.push({ kind: "well", x: wx, y: wy, w: 1, h: 1, town: t.id }); occupied.add(key(wx, wy)); break; }
    }
  }
  if (!props.some(p => p.kind === "well")) {
    for (let ny = cy - 8; ny <= cy + 8 && !props.some(p => p.kind === "well"); ny++) {
      for (let nx = cx - 8; nx <= cx + 8; nx++) if (yard(nx, ny)) { props.push({ kind: "well", x: nx, y: ny, w: 1, h: 1, town: t.id }); occupied.add(key(nx, ny)); break; }
    }
  }
  if (t.demon && yard(cx + 6, cy - 6) && !props.some(p => p.kind === "brazier" && p.x === cx + 6 && p.y === cy - 6)) props.push({ kind: "brazier", x: cx + 6, y: cy - 6, w: 1, h: 1, town: t.id });
  const inn = buildings.find(b => b.kind === "inn" || b.kind === "shop");
  if (inn && yard(inn.doorX + 2, inn.doorY + 2)) props.push({ kind: "sign", x: inn.doorX + 2, y: inn.doorY + 2, w: 1, h: 1, town: t.id });
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const see = (x, y) => { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; };
  for (const b of buildings) for (const [x, y] of tilesOf(b)) see(x, y);
  for (const k of roads) { const [x, y] = k.split(",").map(Number); see(x, y); }
  for (const k of water) { const [x, y] = k.split(",").map(Number); see(x, y); }
  for (const k of piers) { const [x, y] = k.split(",").map(Number); see(x, y); }
  for (const p of props) see(p.x, p.y);
  return { town: t, buildings, roads, cobble, piers, props, walls, water, bridges, minX, minY, maxX, maxY };
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
    for (const [x, y] of tilesOf(b)) if (x === tx && y === ty) return b;
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

export const DUNGEONS = [
  { id: "grove", name: "Greenmere Grove", x: 2100, y: 1480, el: "fire" },
  { id: "flood", name: "Sunken Cloister", x: 4550, y: 980, el: "thunder" },
  { id: "ice", name: "Palevein Cavern", x: 5200, y: 2100, el: "air" },
  { id: "ash", name: "Cinder Vault", x: 3600, y: 4700, el: "air" },
  { id: "sky", name: "High Aerie", x: 6100, y: 980, el: "thunder" },
  { id: "hollow", name: "Hollow Crypt", x: 1600, y: 3600, el: "fire" }
];

let _links = null;
let _segs = null;
export function cityRoads() {
  if (_links) return _links;
  const plans = worldPlan();
  const roads = new Set();
  const segs = [];
  const seen = new Set();
  for (let i = 0; i < plans.length; i++) {
    const p = plans[i];
    let best = null, bd = 1e9, bj = -1;
    for (let j = 0; j < plans.length; j++) {
      if (i === j) continue;
      if (p.town.island || plans[j].town.island) continue;
      const d = Math.hypot(plans[j].town.x - p.town.x, plans[j].town.y - p.town.y);
      if (d < bd) { bd = d; best = plans[j]; bj = j; }
    }
    if (!best || bd > 1800) continue;
    const pair = i < bj ? i + ":" + bj : bj + ":" + i;
    if (!seen.has(pair)) { seen.add(pair); segs.push({ x1: p.town.x, y1: p.town.y, x2: best.town.x, y2: best.town.y }); }
    const steps = Math.ceil(bd);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(p.town.x + (best.town.x - p.town.x) * s / steps);
      const y = Math.round(p.town.y + (best.town.y - p.town.y) * s / steps);
      const plan = planAt(x, y);
      if (plan && (buildingAt(plan, x, y) || propAt(plan, x, y))) continue;
      roads.add(x + "," + y);
    }
  }
  _links = roads;
  _segs = segs;
  return roads;
}

export function roadSegments() {
  cityRoads();
  return _segs || [];
}

export function streamAt(tx, ty) {
  if (tx < 1500 || tx > 2100) return false;
  const y = 1868 + Math.round(Math.sin(tx * 0.02) * 5);
  return Math.abs(ty - y) <= 1;
}
