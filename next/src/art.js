// Original pixel art. Outlines are a darker shade of the local color, never black.

import { hash } from "./layout.js";

function canv(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  draw(g);
  return c;
}

const tiles = new Map();
function speckle(g, x, y, base, a, b, n, seed) {
  g.fillStyle = base;
  g.fillRect(x, y, 16, 16);
  for (let i = 0; i < n; i++) {
    const px = x + (hash(seed, i, 1) % 16);
    const py = y + (hash(seed, i, 2) % 16);
    g.fillStyle = (hash(seed, i, 3) & 1) ? a : b;
    g.fillRect(px, py, 1, 1);
  }
}

export function tileSprite(ground, v) {
  const k = ground + v;
  if (tiles.has(k)) return tiles.get(k);
  const c = canv(16, 16, g => {
    if (ground === "grass" || ground === "forest") {
      speckle(g, 0, 0, ground === "forest" ? "#3f7a2c" : "#5ea83a", ground === "forest" ? "#4e9238" : "#6cb848", ground === "forest" ? "#2f5e22" : "#4a922e", 10, v + 3);
      if (ground === "grass" && (v % 3) === 0) { g.fillStyle = "#d8e070"; g.fillRect(4, 11, 1, 2); g.fillStyle = "#e87898"; g.fillRect(11, 5, 1, 1); }
    } else if (ground === "dirt") {
      speckle(g, 0, 0, "#c4a06a", "#d4b480", "#a88450", 8, v + 9);
    } else if (ground === "cobble") {
      g.fillStyle = "#cbb89a"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#b49a78";
      for (let i = 0; i < 4; i++) g.fillRect((i * 4) % 14, 2 + (i % 3) * 4, 5, 3);
      g.fillStyle = "#ddcbb0"; g.fillRect(2, 3, 2, 1);
    } else if (ground === "ocean") {
      g.fillStyle = v ? "#1a5ec8" : "#164eae"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = v ? "#2a74dc" : "#1e66c4"; g.fillRect(0, 4, 16, 3); g.fillRect(0, 11, 16, 2);
      g.fillStyle = "#d7ecff"; g.fillRect(3, 5, 2, 1);
    } else if (ground === "sand") {
      speckle(g, 0, 0, "#e6c888", "#f0d8a4", "#c8a868", 6, v + 4);
    } else if (ground === "snow") {
      speckle(g, 0, 0, "#e7f2f8", "#f7fbfe", "#d4e2ec", 6, v + 6);
    } else if (ground === "mud" || ground === "marsh") {
      speckle(g, 0, 0, ground === "marsh" ? "#6a7044" : "#5c5348", "#6e6458", "#3e3830", 8, v + 2);
    } else if (ground === "moss") {
      speckle(g, 0, 0, "#6e8a48", "#86a45c", "#556e38", 8, v + 8);
      g.fillStyle = "#8a9470"; g.fillRect(0, 10, 16, 2);
    } else if (ground === "cliff") {
      g.fillStyle = "#6a645c"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#524c46"; g.fillRect(0, 0, 16, 4);
      g.fillStyle = "#7a746c"; for (let i = 0; i < 4; i++) g.fillRect(i * 4, 4, 1, 12);
    } else if (ground === "stair") {
      speckle(g, 0, 0, "#cbb892", "#ddc8a4", "#a89068", 4, v);
      g.fillStyle = "#efe0c4"; g.fillRect(0, 3, 16, 1); g.fillRect(0, 8, 16, 1); g.fillRect(0, 13, 16, 1);
    } else if (ground === "pier") {
      g.fillStyle = "#1a56b8"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#a07848"; g.fillRect(1, 2, 14, 3); g.fillRect(1, 7, 14, 3); g.fillRect(1, 12, 14, 3);
      g.fillStyle = "#7a5830"; g.fillRect(4, 0, 2, 16); g.fillRect(11, 0, 2, 16);
    } else if (ground === "cave") {
      speckle(g, 0, 0, "#6e8a48", "#86a45c", "#556e38", 4, 1);
      g.fillStyle = "#241c18"; g.fillRect(4, 4, 8, 10);
      g.fillStyle = "#3a3028"; g.fillRect(4, 4, 8, 2);
    } else {
      speckle(g, 0, 0, "#5ea83a", "#6cb848", "#4a922e", 6, v);
    }
  });
  tiles.set(k, c);
  return c;
}

const buildings = new Map();
export function buildingSprite(kind, town, variant = 0) {
  const k = kind + town.roof + town.wall + variant;
  if (buildings.has(k)) return buildings.get(k);
  const wide = kind === "castle" || kind === "manor" || kind === "keep";
  const fw = wide ? 16 * 16 : 64;
  const fh = wide ? 6 * 16 : 48;
  const sh = fh + 22;
  const c = canv(fw, sh, g => {
    const wall = town.wall, wallD = town.wallDk, roof = town.roof, roofD = town.roofDk;
    const dark = kind === "keep" || kind === "barrack" || kind === "trader";
    g.fillStyle = "rgba(50,32,16,0.28)";
    g.fillRect(4, sh - 5, fw - 8, 3);
    const frontW = fw - 14;
    const frontX = 2;
    const frontY = sh - fh + 4;
    const frontH = fh - 10;
    g.fillStyle = wall;
    g.fillRect(frontX, frontY, frontW, frontH);
    g.fillStyle = wallD;
    g.fillRect(frontX + frontW, frontY + 6, 10, frontH - 6);
    g.fillStyle = wallD;
    g.fillRect(frontX, frontY + frontH - 4, frontW, 4);
    g.fillStyle = dark ? "#5a4038" : "#c49a6a";
    g.fillRect(frontX + frontW, frontY + 8, 10, 3);
    const win = dark ? "#6a5048" : "#f4e2a4";
    const winD = dark ? "#3a2824" : "#d8b060";
    g.fillStyle = win;
    g.fillRect(frontX + 6, frontY + 8, 8, 7);
    if (variant !== 2) g.fillRect(frontX + frontW - 16, frontY + 8, 8, 7);
    g.fillStyle = winD;
    g.fillRect(frontX + 6, frontY + 11, 8, 2);
    g.fillStyle = dark ? "#2c1c18" : "#6a3c22";
    const dw = 10;
    const dx = frontX + ((frontW - dw) / 2 | 0);
    g.fillRect(dx, frontY + frontH - 16, dw, 16);
    g.fillStyle = dark ? "#5a4030" : "#c48848";
    g.fillRect(dx, frontY + frontH - 16, dw, 3);
    g.fillStyle = "#ead090";
    g.fillRect(dx + dw - 3, frontY + frontH - 9, 2, 2);
    const peakY = 6;
    g.fillStyle = roof;
    g.beginPath();
    g.moveTo(0, frontY + 2);
    g.lineTo(fw / 2 - 6, peakY);
    g.lineTo(frontW + 2, frontY + 2);
    g.fill();
    g.fillStyle = roofD;
    g.beginPath();
    g.moveTo(fw / 2 - 6, peakY);
    g.lineTo(frontW + 2, frontY + 2);
    g.lineTo(fw - 1, frontY + 8);
    g.lineTo(fw / 2 + 2, peakY + 5);
    g.fill();
    if (variant === 1 && !wide) {
      g.fillStyle = wallD;
      g.fillRect(fw / 2 - 8, peakY - 4, 5, 8);
      g.fillStyle = roofD;
      g.fillRect(fw / 2 - 10, peakY - 6, 9, 3);
    }
    if (kind === "hall" || kind === "inn") {
      g.fillStyle = wallD;
      g.fillRect(fw / 2 - 4, peakY - 6, 6, 10);
      g.fillStyle = "#f6e6b0";
      g.fillRect(fw / 2 - 2, peakY - 3, 3, 3);
    }
    if (wide) {
      g.fillStyle = wallD;
      g.fillRect(16, peakY, 8, 16);
      g.fillRect(fw - 28, peakY, 8, 16);
      g.fillStyle = roof;
      g.fillRect(14, peakY - 3, 12, 4);
      g.fillRect(fw - 30, peakY - 3, 12, 4);
    }
  });
  c.fw = fw; c.fh = fh;
  buildings.set(k, c);
  return c;
}

const sheets = new Map();
function paintChibi(g, dir, frame, p, pose) {
  const y = frame === 2 ? 5 : 6;
  const step = pose === "fly" ? 0 : frame === 1 ? -1 : frame === 3 ? 1 : 0;
  const face = dir === 3 ? 2 : dir;
  const flip = dir === 3;
  g.save();
  if (flip) { g.translate(22, 0); g.scale(-1, 1); }
  g.fillStyle = p.hairDk;
  if (face === 1) g.fillRect(5, y, 12, 5);
  g.fillStyle = p.skinDk;
  g.fillRect(5, y + 3, 12, 10);
  g.fillStyle = p.skin;
  g.fillRect(6, y + 4, 10, 8);
  if (face !== 1) {
    g.fillStyle = p.hair;
    g.fillRect(5, y + 2, 12, 4);
    g.fillStyle = p.hairDk;
    g.fillRect(5, y + 5, 12, 1);
  } else {
    g.fillStyle = p.hair;
    g.fillRect(6, y + 1, 10, 3);
  }
  g.fillStyle = p.eye || "#5a3828";
  if (face === 0) {
    g.fillRect(8, y + 8, 2, 2);
    g.fillRect(12, y + 8, 2, 2);
    g.fillStyle = "#fff8ee";
    g.fillRect(9, y + 8, 1, 1);
    g.fillRect(13, y + 8, 1, 1);
  } else if (face === 2) {
    g.fillRect(7, y + 8, 2, 2);
    g.fillStyle = "#fff8ee";
    g.fillRect(7, y + 8, 1, 1);
  }
  g.fillStyle = p.clothDk;
  g.fillRect(7, y + 13, 8, 8);
  g.fillStyle = p.cloth;
  g.fillRect(8, y + 13, 6, 7);
  if (pose === "fly") {
    g.fillStyle = p.cloth;
    g.fillRect(2, y + 14, 5, 2);
    g.fillRect(15, y + 15, 5, 2);
    g.fillStyle = p.clothDk;
    g.fillRect(2, y + 16, 5, 1);
  }
  g.fillStyle = p.shoe;
  const ly = pose === "fly" ? y + 19 : y + 20;
  g.fillRect(8 + (pose === "fly" ? 0 : step), ly, 2, pose === "fly" ? 3 : 4);
  g.fillRect(12 - (pose === "fly" ? 0 : step), ly, 2, pose === "fly" ? 3 : 4);
  g.restore();
}

export function actorSprite(pal, dir, frame, pose) {
  const k = pal.id + ":" + dir + ":" + frame + ":" + (pose || "");
  if (sheets.has(k)) return sheets.get(k);
  const c = canv(22, 30, g => paintChibi(g, dir, frame, pal, pose));
  sheets.set(k, c);
  return c;
}

export const HERO = {
  id: "hero", skin: "#f0c0a0", skinDk: "#c89878", hair: "#6b3a22", hairDk: "#4a2416",
  cloth: "#2f8a44", clothDk: "#1f5e30", shoe: "#4a3020", eye: "#4a3428"
};

export const PALETTES = [
  { id: "red", skin: "#f0c0a0", skinDk: "#c89878", hair: "#3a2418", hairDk: "#24160e", cloth: "#b44838", clothDk: "#7a2820", shoe: "#3a2418", eye: "#3a2418" },
  { id: "blue", skin: "#e8b898", skinDk: "#c09070", hair: "#d8c070", hairDk: "#a89040", cloth: "#3a68a8", clothDk: "#243e70", shoe: "#3a2a1c", eye: "#3a2418" },
  { id: "gold", skin: "#f4c8a8", skinDk: "#d0a080", hair: "#8a4a28", hairDk: "#5c3018", cloth: "#d0a040", clothDk: "#8a6818", shoe: "#4a3420", eye: "#3a2418" },
  { id: "plum", skin: "#e0b090", skinDk: "#b88868", hair: "#2a1814", hairDk: "#140c0a", cloth: "#7a4878", clothDk: "#4a2848", shoe: "#2a1c18", eye: "#2a1814" },
  { id: "leaf", skin: "#f0c0a0", skinDk: "#c89878", hair: "#c87848", hairDk: "#8a5028", cloth: "#3e8a48", clothDk: "#245830", shoe: "#3a2818", eye: "#3a2418" },
  { id: "sea", skin: "#f2c4a4", skinDk: "#cca080", hair: "#4a3428", hairDk: "#2c1c14", cloth: "#3a8a98", clothDk: "#1e5864", shoe: "#3a3024", eye: "#3a2418" }
];

const monsters = new Map();
export function monsterSprite(kind, frame) {
  const k = kind + frame;
  if (monsters.has(k)) return monsters.get(k);
  const c = canv(24, 18, g => {
    const bob = frame ? -1 : 0;
    if (kind === "boar") {
      g.fillStyle = "#6a4630"; g.fillRect(4, 6 + bob, 14, 8);
      g.fillStyle = "#8a5c3c"; g.fillRect(5, 5 + bob, 12, 6);
      g.fillStyle = "#4a3020"; g.fillRect(2, 7 + bob, 4, 4); g.fillRect(16, 8 + bob, 3, 2);
      g.fillStyle = "#e8d8c0"; g.fillRect(3, 10 + bob, 2, 2);
      g.fillStyle = "#3a2418"; g.fillRect(6, 7 + bob, 2, 2);
      g.fillStyle = "#5a4030"; g.fillRect(6, 14, 3, 3); g.fillRect(13, 14, 3, 3);
    } else if (kind === "lurker") {
      g.fillStyle = "#2f6e38"; g.fillRect(3, 8 + bob, 16, 7);
      g.fillStyle = "#46a04c"; g.fillRect(4, 6 + bob, 14, 6);
      g.fillStyle = "#1c4024"; g.fillRect(6, 8 + bob, 2, 2); g.fillRect(12, 8 + bob, 2, 2);
      g.fillStyle = "#d8e8b0"; g.fillRect(7, 11 + bob, 6, 2);
    } else {
      g.fillStyle = "#c45a28"; g.fillRect(6, 7 + bob, 10, 6);
      g.fillStyle = "#e88840"; g.fillRect(7, 6 + bob, 8, 4);
      g.fillStyle = "#7a3018"; g.fillRect(4, 8 + bob, 3, 2); g.fillRect(16, 8 + bob, 3, 2); g.fillRect(8, 13, 2, 3); g.fillRect(13, 13, 2, 3);
      g.fillStyle = "#2a140c"; g.fillRect(9, 8 + bob, 2, 2);
    }
  });
  monsters.set(k, c);
  return c;
}

const trees = new Map();
export function treeSprite(seed) {
  const s = seed % 6;
  if (trees.has(s)) return trees.get(s);
  const c = canv(30, 38, g => {
    g.fillStyle = "rgba(40,28,12,0.3)";
    g.fillRect(8, 34, 14, 3);
    g.fillStyle = "#6b4428";
    g.fillRect(13, 22, 4, 14);
    g.fillStyle = "#4a2e18";
    g.fillRect(13, 22, 1, 14);
    const greens = ["#3d8a34", "#4ea043", "#2f6c28", "#6aaa4a", "#367a30"];
    for (let i = 0; i < 8; i++) {
      const x = 2 + (hash(s, i, 1) % 14);
      const y = 2 + (hash(s, i, 2) % 14);
      const w = 7 + (hash(s, i, 3) % 8);
      const h = 5 + (hash(s, i, 4) % 6);
      g.fillStyle = greens[i % greens.length];
      g.fillRect(x, y, w, h);
    }
  });
  trees.set(s, c);
  return c;
}

export function swordSprite() {
  return canv(14, 6, g => {
    g.fillStyle = "#d8d2c6"; g.fillRect(3, 2, 9, 2);
    g.fillStyle = "#f4f0e6"; g.fillRect(3, 2, 9, 1);
    g.fillStyle = "#8a5a32"; g.fillRect(1, 1, 3, 4);
    g.fillStyle = "#c4a060"; g.fillRect(0, 2, 2, 2);
  });
}

const furnC = new Map();
export function furnSprite(kind) {
  if (furnC.has(kind)) return furnC.get(kind);
  const c = canv(32, 28, g => {
    if (kind === "bed") {
      g.fillStyle = "#8a5a32"; g.fillRect(2, 10, 26, 14);
      g.fillStyle = "#d4533a"; g.fillRect(4, 8, 22, 12);
      g.fillStyle = "#f3e6c8"; g.fillRect(6, 10, 8, 5);
    } else if (kind === "table") {
      g.fillStyle = "#a87440"; g.fillRect(2, 8, 28, 8);
      g.fillStyle = "#c49058"; g.fillRect(2, 8, 28, 3);
      g.fillStyle = "#7a5428"; g.fillRect(4, 16, 3, 8); g.fillRect(24, 16, 3, 8);
    } else if (kind === "chair") {
      g.fillStyle = "#8a5a32"; g.fillRect(6, 6, 12, 8); g.fillRect(8, 14, 3, 6); g.fillRect(14, 14, 3, 6);
      g.fillStyle = "#a87440"; g.fillRect(7, 7, 10, 4);
    } else if (kind === "chest") {
      g.fillStyle = "#7a4e28"; g.fillRect(4, 10, 22, 12);
      g.fillStyle = "#c4a060"; g.fillRect(4, 10, 22, 4);
      g.fillStyle = "#e8d090"; g.fillRect(13, 15, 3, 3);
    } else if (kind === "counter") {
      g.fillStyle = "#8a5a32"; g.fillRect(0, 10, 32, 12);
      g.fillStyle = "#d8b080"; g.fillRect(0, 8, 32, 4);
    } else if (kind === "altar" || kind === "throne") {
      g.fillStyle = kind === "throne" ? "#7a1e28" : "#d8d0c0";
      g.fillRect(6, 6, 18, 16);
      g.fillStyle = kind === "throne" ? "#e8c878" : "#f3e6c0";
      g.fillRect(8, 8, 14, 6);
    } else if (kind === "shelf") {
      g.fillStyle = "#6a4630"; g.fillRect(2, 4, 26, 16);
      g.fillStyle = "#c4483a"; g.fillRect(4, 6, 4, 5);
      g.fillStyle = "#3a68a8"; g.fillRect(10, 6, 4, 5);
      g.fillStyle = "#d0a040"; g.fillRect(16, 7, 4, 4);
    } else if (kind === "rug") {
      g.fillStyle = "#a84840"; g.fillRect(2, 8, 28, 14);
      g.fillStyle = "#e8c878"; g.fillRect(6, 11, 20, 8);
    } else {
      g.fillStyle = "#8a8478"; g.fillRect(10, 4, 6, 16);
      g.fillStyle = "#c45a28"; g.fillRect(8, 2, 10, 4);
    }
  });
  furnC.set(kind, c);
  return c;
}

export function warmBootArt() {
  tileSprite("grass", 0); tileSprite("dirt", 0); tileSprite("cobble", 0); tileSprite("ocean", 0);
  actorSprite(HERO, 0, 0, "");
  monsterSprite("boar", 0); monsterSprite("lurker", 0); monsterSprite("mite", 0);
  treeSprite(1); swordSprite();
}
