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
      const shades = ground === "forest"
        ? ["#2f6a2c", "#316c2e", "#2e682c", "#336e30"]
        : ["#4a9e42", "#4c9e44", "#489c40", "#4ea246"];
      g.fillStyle = shades[v % 4];
      g.fillRect(0, 0, 16, 16);
    } else if (ground === "dirt") {
      g.fillStyle = "#c9a56e"; g.fillRect(0, 0, 16, 16);
      for (let i = 0; i < 14; i++) {
        g.fillStyle = (hash(v, i, 1) & 1) ? "#dfc48a" : "#a68452";
        g.fillRect(hash(v, i, 2) % 16, hash(v, i, 3) % 16, 1 + (i & 1), 1);
      }
      g.fillStyle = "#8a6840"; g.fillRect(0, 15, 16, 1);
    } else if (ground === "bridge") {
      g.fillStyle = "#2a6cb8"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#e8f4ff"; g.fillRect(2, 3, 3, 1); g.fillRect(9, 10, 4, 1);
      g.fillStyle = "#a87440"; g.fillRect(0, 2, 16, 12);
      g.fillStyle = "#c89458"; for (let i = 0; i < 4; i++) g.fillRect(i * 4, 2, 3, 12);
      g.fillStyle = "#6a4428"; g.fillRect(0, 2, 16, 1); g.fillRect(0, 13, 16, 1);
    } else if (ground === "stream") {
      g.fillStyle = "#1e62b4"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#3a86d4"; g.fillRect(0, 4, 16, 3); g.fillRect(0, 11, 16, 2);
      g.fillStyle = "#f4fbff"; g.fillRect(4, 5, 3, 1); g.fillRect(10, 12, 2, 1);
    } else if (ground === "emberstone") {
      g.fillStyle = "#7a4038"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#a84838"; g.fillRect(1, 2, 6, 4); g.fillRect(8, 8, 6, 4);
      g.fillStyle = "#e07030"; g.fillRect(3, 3, 2, 1); g.fillRect(10, 9, 2, 1);
    } else if (ground === "lava") {
      g.fillStyle = "#6a2018"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#e04820"; g.fillRect(1, 4, 14, 3); g.fillRect(2, 9, 12, 2);
      g.fillStyle = "#ffd080"; g.fillRect(4, 5, 3, 1); g.fillRect(9, 10, 2, 1);
    } else if (ground === "quay") {
      g.fillStyle = "#8a8478"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#6a645c"; g.fillRect(0, 0, 16, 2); g.fillRect(0, 8, 16, 2);
      g.fillStyle = "#b0aa9c"; g.fillRect(2, 3, 5, 4); g.fillRect(9, 10, 5, 4);
    } else if (ground === "cobble") {
      g.fillStyle = "#8a7c6c"; g.fillRect(0, 0, 16, 16);
      const stones = [[1, 1, 6, 5], [8, 1, 7, 5], [1, 7, 7, 5], [9, 7, 6, 5], [0, 13, 8, 3], [9, 13, 7, 3]];
      for (let i = 0; i < stones.length; i++) {
        const s = stones[i];
        g.fillStyle = (hash(v, i, 2) % 2) ? "#c8b49a" : "#b6a288";
        g.fillRect(s[0], s[1], s[2], s[3]);
        g.fillStyle = "#e4d4bc"; g.fillRect(s[0] + 1, s[1] + 1, 2, 1);
      }
    } else if (ground === "ocean") {
      const deep = v === 2 ? "#0e3278" : v === 0 ? "#3a92d8" : "#1a62b8";
      const band = v === 2 ? "#16448e" : v === 0 ? "#6eb4e6" : "#2a78c8";
      g.fillStyle = deep; g.fillRect(0, 0, 16, 16);
      g.fillStyle = band; g.fillRect(0, 5, 16, 4); g.fillRect(0, 12, 16, 2);
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
      g.fillStyle = "#8a8470"; g.fillRect(0, 0, 16, 5);
      g.fillStyle = "#5a564c"; g.fillRect(0, 5, 16, 11);
      g.fillStyle = "#3e3a34"; g.fillRect(0, 5, 16, 2);
      g.fillStyle = "#7a7468"; for (let i = 0; i < 4; i++) g.fillRect(1 + i * 4, 8, 2, 6);
      g.fillStyle = "#c8b888"; g.fillRect(2, 1, 3, 2); g.fillRect(10, 2, 2, 1);
    } else if (ground === "stair") {
      speckle(g, 0, 0, "#cbb892", "#ddc8a4", "#a89068", 4, v);
      g.fillStyle = "#efe0c4"; g.fillRect(0, 3, 16, 1); g.fillRect(0, 8, 16, 1); g.fillRect(0, 13, 16, 1);
    } else if (ground === "pier") {
      g.fillStyle = "#1a62b8"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#a87440"; g.fillRect(0, 1, 16, 14);
      g.fillStyle = "#c89458"; g.fillRect(0, 2, 16, 3); g.fillRect(0, 7, 16, 3); g.fillRect(0, 12, 16, 2);
      g.fillStyle = "#6a4428"; g.fillRect(0, 1, 16, 1); g.fillRect(3, 0, 2, 16); g.fillRect(11, 0, 2, 16);
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
export function buildingSprite(kind, town, variant = 0, bw, bh) {
  const k = kind + town.roof + town.wall + variant + ":" + (bw || 0) + "x" + (bh || 0) + ":v2";
  if (buildings.has(k)) return buildings.get(k);
  const wide = kind === "castle" || kind === "manor" || kind === "keep";
  const fw = (bw || (wide ? 10 : 4)) * 16;
  const fh = (bh || (wide ? 5 : 3)) * 16;
  const overhang = 6;
  const sw = fw + overhang * 2;
  const roofH = Math.max(22, Math.round(fh * 0.68));
  const wallH = Math.max(14, fh - roofH + 8);
  const sh = roofH + wallH + 4;
  const c = canv(sw, sh, g => {
    const roofs = [["#c4483a", "#8a2c22", "#e07060"], ["#e0b050", "#a07830", "#f0d488"], ["#3a68a8", "#243e70", "#6890c8"], ["#4e8a48", "#2c5c28", "#78b070"], ["#c08048", "#7a4c28", "#e0a870"]];
    const walls = [["#f4e2c4", "#d4bc96", "#6a4428"], ["#efe4d4", "#c8b498", "#4a3424"], ["#f7efe2", "#e0d0b4", "#5c4030"], ["#e7d3b4", "#c4a888", "#5a4030"]];
    const look = roofs[(town.id === "emberreach" || town.id === "varnhold" || town.id === "moderno") ? 0 : variant % roofs.length];
    const plaster = walls[variant % walls.length];
    const wall = kind === "keep" || kind === "barrack" ? "#7a6e68" : (town.wall || plaster[0]);
    const wallD = kind === "keep" || kind === "barrack" ? "#4a403c" : plaster[1];
    const timber = plaster[2];
    const roof = (kind === "castle" || kind === "manor" || kind === "keep") ? town.roof : look[0];
    const roofD = (kind === "castle" || kind === "manor" || kind === "keep") ? town.roofDk : look[1];
    const hi = look[2];
    const eaveY = roofH;
    const wallY = eaveY - 1;
    g.fillStyle = "#b7a48a";
    g.fillRect(overhang, wallY, fw, wallH + 2);
    g.fillStyle = "#8d7d6a";
    g.fillRect(overhang, wallY + wallH, fw, 2);
    g.fillStyle = wall;
    g.fillRect(overhang + 2, wallY + 2, fw - 4, wallH - 2);
    g.fillStyle = wallD;
    g.fillRect(overhang + fw - 8, wallY + 2, 6, wallH - 2);
    g.fillStyle = timber;
    g.fillRect(overhang + 2, wallY + 2, fw - 4, 2);
    g.fillRect(overhang + 2, wallY + wallH - 3, fw - 4, 2);
    g.fillRect(overhang + 2, wallY + 2, 2, wallH - 2);
    g.fillRect(overhang + fw - 4, wallY + 2, 2, wallH - 2);
    const posts = Math.max(2, (fw / 16) | 0);
    for (let i = 1; i < posts; i++) g.fillRect(overhang + 2 + ((fw - 6) * i / posts) | 0, wallY + 2, 2, wallH - 4);
    const glass = kind === "keep" || kind === "barrack" ? "#6a5048" : "#f4e2a4";
    const frame = "#4a3018";
    const wins = Math.max(1, ((fw - 20) / 16) | 0);
    for (let i = 0; i < wins; i++) {
      const wx = overhang + 8 + i * 16;
      if (wx > overhang + fw - 18) break;
      g.fillStyle = frame; g.fillRect(wx - 1, wallY + 5, 10, 8);
      g.fillStyle = glass; g.fillRect(wx, wallY + 6, 8, 6);
      g.fillStyle = "#fff6d0"; g.fillRect(wx + 1, wallY + 7, 2, 2);
      g.fillStyle = frame; g.fillRect(wx + 3, wallY + 6, 1, 6);
    }
    const dw = 8;
    const doorX = overhang + ((fw - dw) / 2 | 0);
    g.fillStyle = "#4a3018";
    g.fillRect(doorX, wallY + wallH - 14, dw, 14);
    g.fillStyle = "#8a5a32";
    g.fillRect(doorX + 1, wallY + wallH - 13, dw - 2, 4);
    g.fillStyle = "#ead090";
    g.fillRect(doorX + dw - 3, wallY + wallH - 8, 2, 2);
    g.fillStyle = "#9a9084";
    g.fillRect(doorX - 2, wallY + wallH - 2, dw + 4, 3);
    const peakX = sw / 2;
    const peakY = wide ? 2 : 3;
    for (let y = peakY; y <= eaveY; y++) {
      const u = (y - peakY) / Math.max(1, eaveY - peakY);
      const half = 3 + u * (sw / 2 - 3);
      const x0 = peakX - half;
      g.fillStyle = roofD;
      g.fillRect(x0, y, half * 2, 1);
      g.fillStyle = roof;
      g.fillRect(x0, y, half, 1);
      if ((y - peakY) % 3 === 2) {
        g.fillStyle = hi;
        g.fillRect(x0 + 1, y, half * 2 - 2, 1);
      }
    }
    g.fillStyle = "rgba(42,24,12,0.38)";
    g.fillRect(overhang, eaveY, fw, 3);
    g.fillStyle = "#6a4038";
    g.fillRect(peakX + 8, peakY + 4, 5, 12);
    g.fillStyle = roofD;
    g.fillRect(peakX + 6, peakY + 2, 9, 3);
    if (kind === "shop") {
      g.fillStyle = "#8a2c22"; g.fillRect(overhang, eaveY - 2, fw, 6);
      g.fillStyle = "#c4483a"; g.fillRect(overhang, eaveY - 2, fw, 3);
    }
    if (kind === "inn") {
      g.fillStyle = "#5c3a22"; g.fillRect(overhang + 6, eaveY - 10, 2, 10);
      g.fillStyle = "#e6c878"; g.fillRect(overhang + 8, eaveY - 12, 16, 7);
      g.fillStyle = "#6a4428"; g.fillRect(overhang + 10, eaveY - 10, 10, 1);
    }
    if (kind === "mill") {
      g.fillStyle = "#6a4428"; g.fillRect(overhang + fw - 16, wallY + 4, 14, 14);
      g.fillStyle = "#e6d2a8"; g.fillRect(overhang + fw - 14, wallY + 8, 10, 2); g.fillRect(overhang + fw - 10, wallY + 4, 2, 10);
    }
    if (wide) {
      g.fillStyle = wallD; g.fillRect(overhang + 8, peakY + 6, 7, 16); g.fillRect(overhang + fw - 16, peakY + 6, 7, 16);
      g.fillStyle = roof; g.fillRect(overhang + 6, peakY + 4, 11, 4); g.fillRect(overhang + fw - 18, peakY + 4, 11, 4);
    }
  });
  c.fw = fw; c.fh = fh; c.ox = overhang;

  buildings.set(k, c);
  return c;
}

const sheets = new Map();
function paintChibi(g, dir, frame, p, pose) {
  const y = frame === 2 ? 1 : 2;
  const step = pose === "fly" ? 0 : frame === 1 ? -2 : frame === 3 ? 2 : 0;
  const face = dir === 3 ? 2 : dir;
  const flip = dir === 3;
  const ink = "#3a2418";
  g.save();
  if (flip) { g.translate(18, 0); g.scale(-1, 1); }
  g.fillStyle = ink;
  g.fillRect(3, y + 1, 12, 26);
  g.fillStyle = p.hairDk;
  g.fillRect(3, y + 1, 12, 6);
  g.fillStyle = p.hair;
  g.fillRect(4, y + 2, 10, 4);
  g.fillStyle = p.skinDk;
  g.fillRect(4, y + 6, 10, 8);
  g.fillStyle = p.skin;
  g.fillRect(5, y + 7, 8, 6);
  g.fillStyle = p.eye || ink;
  if (face === 0) {
    g.fillRect(6, y + 9, 2, 2); g.fillRect(10, y + 9, 2, 2);
    g.fillStyle = "#fff8ee"; g.fillRect(6, y + 9, 1, 1); g.fillRect(10, y + 9, 1, 1);
  } else if (face === 2) {
    g.fillRect(5, y + 9, 2, 2);
    g.fillStyle = "#fff8ee"; g.fillRect(5, y + 9, 1, 1);
  }
  g.fillStyle = p.clothDk;
  g.fillRect(4, y + 14, 10, 9);
  g.fillStyle = p.cloth;
  g.fillRect(5, y + 15, 8, 7);
  g.fillStyle = "#fff6e0";
  g.fillRect(6, y + 16, 2, 2);
  if (pose === "fly") {
    g.fillStyle = p.cloth; g.fillRect(0, y + 16, 4, 2); g.fillRect(14, y + 16, 4, 2);
    g.fillStyle = p.clothDk; g.fillRect(0, y + 18, 4, 1);
  }
  g.fillStyle = p.skin;
  g.fillRect(4, y + 18, 2, 4); g.fillRect(12, y + 18, 2, 4);
  g.fillStyle = p.shoe;
  const ly = y + 22;
  g.fillRect(4 + (pose === "fly" ? 0 : step), ly, 3, 5);
  g.fillRect(11 - (pose === "fly" ? 0 : step), ly, 3, 5);
  g.fillStyle = ink;
  g.fillRect(4 + step, ly + 4, 3, 1); g.fillRect(11 - step, ly + 4, 3, 1);
  g.restore();
}

export function actorSprite(pal, dir, frame, pose) {
  const k = pal.id + ":" + dir + ":" + frame + ":" + (pose || "") + ":tall";
  if (sheets.has(k)) return sheets.get(k);
  const c = canv(18, 32, g => paintChibi(g, dir, frame, pal, pose));
  sheets.set(k, c);
  return c;
}

const bosses = new Map();
export function bossSprite(kind, frame) {
  const k = kind + ":" + (frame & 1);
  if (bosses.has(k)) return bosses.get(k);
  const bob = frame & 1 ? 1 : 0;
  const c = canv(56, 64, g => {
    g.fillStyle = "rgba(20,14,10,0.35)";
    g.fillRect(10, 58, 36, 4);
    if (kind === "grove") {
      g.fillStyle = "#4a3018"; g.fillRect(20, 28 + bob, 16, 28);
      g.fillStyle = "#6a4428"; g.fillRect(22, 30 + bob, 4, 22);
      g.fillStyle = "#2f6a32"; g.fillRect(8, 10 + bob, 40, 22);
      g.fillStyle = "#4e8a40"; g.fillRect(12, 8 + bob, 16, 12); g.fillRect(28, 6 + bob, 16, 14);
      g.fillStyle = "#c8e070"; g.fillRect(16, 12 + bob, 4, 3); g.fillRect(34, 14 + bob, 4, 3);
      g.fillStyle = "#f4e6a0"; g.fillRect(18, 22 + bob, 5, 4); g.fillRect(32, 22 + bob, 5, 4);
      g.fillStyle = "#3a2414"; g.fillRect(12, 50 + bob, 8, 4); g.fillRect(36, 50 + bob, 8, 4);
    } else if (kind === "ice") {
      g.fillStyle = "#8eb4d0"; g.fillRect(16, 16 + bob, 24, 36);
      g.fillStyle = "#d7eef8"; g.fillRect(22, 8 + bob, 12, 16); g.fillRect(10, 22 + bob, 8, 18); g.fillRect(38, 20 + bob, 8, 16);
      g.fillStyle = "#f7fbff"; g.fillRect(24, 10 + bob, 3, 8); g.fillRect(12, 24 + bob, 3, 8);
      g.fillStyle = "#2a4a68"; g.fillRect(22, 28 + bob, 4, 4); g.fillRect(30, 28 + bob, 4, 4);
      g.fillStyle = "#e8f4ff"; g.fillRect(18, 46 + bob, 20, 6);
    } else if (kind === "flood") {
      g.fillStyle = "#1e5878"; g.fillRect(6, 26 + bob, 44, 14);
      g.fillStyle = "#3a88a8"; g.fillRect(8, 28 + bob, 36, 6);
      g.fillStyle = "#14506a"; g.fillRect(4, 22 + bob, 10, 8); g.fillRect(40, 34 + bob, 12, 8);
      g.fillStyle = "#e8f4c8"; g.fillRect(10, 24 + bob, 4, 3); g.fillRect(16, 24 + bob, 3, 3);
      g.fillStyle = "#7ec8a0"; g.fillRect(18, 18 + bob, 4, 10); g.fillRect(28, 16 + bob, 3, 12);
    } else if (kind === "ash") {
      g.fillStyle = "#3a2824"; g.fillRect(8, 28 + bob, 40, 16);
      g.fillStyle = "#e07030"; g.fillRect(12, 34 + bob, 28, 4); g.fillRect(18, 24 + bob, 6, 6);
      g.fillStyle = "#ffd080"; g.fillRect(20, 26 + bob, 2, 2);
      g.fillStyle = "#2a1c18"; g.fillRect(10, 42 + bob, 6, 10); g.fillRect(22, 42 + bob, 6, 10); g.fillRect(34, 42 + bob, 6, 10);
      g.fillStyle = "#c4483a"; g.fillRect(36, 22 + bob, 10, 8);
      g.fillStyle = "#f4e6a0"; g.fillRect(40, 24 + bob, 2, 2);
    } else if (kind === "sky") {
      g.fillStyle = "#c8b878"; g.fillRect(4, 22 + bob, 22, 8); g.fillRect(30, 22 + bob, 22, 8);
      g.fillStyle = "#e6d8a0"; g.fillRect(6, 20 + bob, 16, 4); g.fillRect(34, 20 + bob, 16, 4);
      g.fillStyle = "#8a6840"; g.fillRect(22, 24 + bob, 12, 16);
      g.fillStyle = "#f4e6c0"; g.fillRect(24, 18 + bob, 10, 8);
      g.fillStyle = "#5a4030"; g.fillRect(34, 20 + bob, 8, 3);
      g.fillStyle = "#2a2418"; g.fillRect(26, 22 + bob, 2, 2); g.fillRect(30, 22 + bob, 2, 2);
    } else {
      g.fillStyle = "#2a2430"; g.fillRect(16, 12 + bob, 24, 40);
      g.fillStyle = "#3a3040"; g.fillRect(12, 16 + bob, 8, 18); g.fillRect(36, 16 + bob, 8, 18);
      g.fillStyle = "#7dba6a"; g.fillRect(14, 28 + bob, 4, 6); g.fillRect(38, 28 + bob, 4, 6);
      g.fillStyle = "#d8d0c0"; g.fillRect(22, 18 + bob, 12, 10);
      g.fillStyle = "#1a140e"; g.fillRect(24, 22 + bob, 3, 3); g.fillRect(30, 22 + bob, 3, 3);
      g.fillStyle = "#6a5838"; g.fillRect(20, 48 + bob, 6, 8); g.fillRect(30, 48 + bob, 6, 8);
    }
  });
  bosses.set(k, c);
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
  const c = canv(72, 84, g => {
    g.fillStyle = "rgba(40,28,12,0.3)";
    g.fillRect(24, 78, 22, 4);
    g.fillStyle = "#6b4428";
    g.fillRect(34, 48, 5, 30);
    g.fillStyle = "#4a2e18";
    g.fillRect(34, 48, 2, 30);
    g.fillStyle = "#8a6840";
    g.fillRect(36, 52, 1, 18);
    const leaf = ["#d8b04a", "#7a9a32", "#e0c868", "#4e7a32", "#c49840", "#f0d888", "#3a6828", "#a8c858"];
    const blobs = [[36, 18, 16], [22, 28, 14], [48, 26, 15], [30, 38, 18], [50, 40, 12], [18, 42, 11], [40, 10, 10]];
    for (let i = 0; i < blobs.length; i++) {
      const [cx, cy, r] = blobs[i];
      const col = leaf[(s + i) % leaf.length];
      const shade = leaf[(s + i + 2) % leaf.length];
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
        if (xx * xx + yy * yy > r * r) continue;
        if (((xx + yy + i) & 1) && xx * xx + yy * yy > (r - 2) * (r - 2)) continue;
        g.fillStyle = yy > 2 ? shade : col;
        g.fillRect(cx + xx, cy + yy, 1, 1);
      }
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
    } else if (kind === "hearth") {
      g.fillStyle = "#6a5348"; g.fillRect(2, 8, 26, 16);
      g.fillStyle = "#3a241c"; g.fillRect(6, 12, 16, 10);
      g.fillStyle = "#e07030"; g.fillRect(10, 16, 8, 4);
      g.fillStyle = "#f0d080"; g.fillRect(12, 14, 4, 3);
    } else if (kind === "plant") {
      g.fillStyle = "#8a4030"; g.fillRect(10, 14, 8, 8);
      g.fillStyle = "#3a8a40"; g.fillRect(8, 6, 6, 8); g.fillRect(14, 4, 6, 8);
      g.fillStyle = "#e87890"; g.fillRect(12, 4, 2, 2);
    } else if (kind === "pot") {
      g.fillStyle = "#a86830"; g.fillRect(8, 10, 12, 10);
      g.fillStyle = "#e8d8a0"; g.fillRect(10, 8, 8, 4);
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
