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
      const base = ground === "forest" ? ["#2f6a28", "#3d8240", "#24561c", "#6a9a3a"] : ["#3c8a34", "#4ea044", "#2d6e28", "#67a84a"];
      g.fillStyle = base[0]; g.fillRect(0, 0, 16, 16);
      for (let i = 0; i < 18; i++) {
        g.fillStyle = base[1 + (hash(v, i, 2) % 3)];
        g.fillRect(hash(v, i, 3) % 16, hash(v, i, 4) % 16, 1 + (hash(v, i, 5) & 1), 1 + (hash(v, i, 6) & 1));
      }
      g.fillStyle = base[2];
      for (let i = 0; i < 6; i++) {
        const x = hash(v, i, 7) % 14, y = 4 + (hash(v, i, 8) % 10);
        g.fillRect(x, y, 1, 3); g.fillRect(x + 1, y + 1, 1, 2);
      }
      if ((hash(v, 1, 9) % 3) === 0) { g.fillStyle = "#f0d060"; g.fillRect(3, 10, 2, 2); g.fillStyle = "#e87890"; g.fillRect(11, 5, 2, 2); g.fillStyle = "#3a8a40"; g.fillRect(4, 12, 1, 2); }
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
export function buildingSprite(kind, town, variant = 0, bw, bh) {
  const k = kind + town.roof + town.wall + variant + ":" + (bw || 0) + "x" + (bh || 0);
  if (buildings.has(k)) return buildings.get(k);
  const wide = kind === "castle" || kind === "manor" || kind === "keep";
  const fw = (bw || (wide ? 10 : 4)) * 16;
  const fh = (bh || (wide ? 5 : 3)) * 16;
  const sh = fh + 22;
  const c = canv(fw, sh, g => {
    const roofs = [["#e0b050", "#a07830", "#f0d488"], ["#c4483a", "#8a2c22", "#e07060"], ["#3a68a8", "#243e70", "#6890c8"], ["#4e8a48", "#2c5c28", "#78b070"], ["#c08048", "#7a4c28", "#e0a870"]];
    const walls = [["#f4e2c4", "#d4bc96", "#6a4428"], ["#f7efe2", "#e0d0b4", "#5c4030"], ["#efe4d4", "#c8b498", "#4a3424"], ["#f8f0dc", "#e4d4b0", "#6a5030"]];
    const look = roofs[variant % roofs.length];
    const plaster = walls[variant % walls.length];
    const wall = kind === "keep" || kind === "barrack" ? "#6a5a58" : plaster[0];
    const wallD = kind === "keep" || kind === "barrack" ? "#3e3434" : plaster[1];
    const timber = plaster[2];
    const roof = kind === "castle" || kind === "manor" ? town.roof : look[0];
    const roofD = kind === "castle" || kind === "manor" ? town.roofDk : look[1];
    const thatch = look[2];
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
    if (variant !== 2 && frontW > 28) g.fillRect(frontX + frontW - 16, frontY + 8, 8, 7);
    if (fh > 64) {
      g.fillRect(frontX + 6, frontY + 8 - 16, 8, 7);
      if (frontW > 28) g.fillRect(frontX + frontW - 16, frontY + 8 - 16, 8, 7);
    }
    g.fillStyle = "#3a8a40";
    g.fillRect(frontX + 5, frontY + 15, 10, 3);
    g.fillStyle = "#e87890";
    g.fillRect(frontX + 6, frontY + 14, 2, 2);
    g.fillRect(frontX + 10, frontY + 13, 2, 2);
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
    const peakY = kind === "hut" ? 8 : 4;
    g.fillStyle = roof;
    if (kind === "hut") {
      for (let row = 0; row < frontY; row++) {
        const u = row / frontY;
        const half = (2 + u * u * (fw * 0.5));
        g.fillRect(fw / 2 - half, row + 2, half * 2, 1);
      }
    } else {
      g.beginPath();
      g.moveTo(0, frontY + 2);
      g.lineTo(fw / 2 - 6, peakY);
      g.lineTo(frontW + 2, frontY + 2);
      g.fill();
    }
    const roofSpan = (row) => {
      const span = Math.max(1, frontY + 2 - peakY);
      const u = Math.max(0, Math.min(1, (row - peakY) / span));
      const half = 2 + u * (fw * 0.5 - 2);
      return [fw / 2 - half, half * 2];
    };
    const shingle = kind === "shop" || kind === "temple" || kind === "hall" || kind === "castle" || kind === "manor" || kind === "keep";
    if (kind === "hut") {
      for (let row = 4; row < frontY; row += 2) {
        const u = row / frontY;
        const half = 2 + u * u * (fw * 0.46);
        for (let x = fw / 2 - half; x < fw / 2 + half; x += 2) {
          if ((hash(x | 0, row, variant) % 3) === 0) continue;
          g.fillStyle = (x + row) & 2 ? thatch : roofD;
          g.fillRect(x | 0, row, 1, 2);
        }
      }
    } else for (let row = peakY + 1; row < frontY + 2; row += shingle ? 3 : 2) {
      const [x0, width] = roofSpan(row);
      if (width < 6) continue;
      if (shingle) {
        g.fillStyle = roofD;
        const off = ((row / 3) | 0) % 2 ? 4 : 1;
        for (let x = x0 + off; x < x0 + width - 3; x += 7) g.fillRect(x | 0, row, 5, 2);
        g.fillStyle = thatch;
        g.fillRect(x0 + 1, row, width - 2, 1);
      } else {
        g.fillStyle = roofD;
        g.fillRect(x0 + 1, row, width - 2, 1);
        for (let x = x0 + 1; x < x0 + width - 1; x += 2) {
          if ((hash(x | 0, row, variant) % 4) === 0) continue;
          g.fillStyle = (x + row) & 2 ? thatch : roofD;
          g.fillRect(x | 0, row, 1, 2 + ((x + row) & 1));
        }
      }
    }
    if (kind !== "hut") {
      g.fillStyle = timber;
      g.fillRect(frontX, frontY, frontW, 2);
      g.fillRect(frontX, frontY + frontH - 3, frontW, 2);
      if (kind !== "mill") for (let x = frontX; x < frontX + frontW; x += 10) g.fillRect(x, frontY, 2, frontH);
    } else {
      g.fillStyle = roofD;
      g.fillRect(frontX + 2, frontY, frontW - 4, 2);
    }
    if (kind !== "hut") {
      g.fillStyle = roofD;
      g.beginPath();
      g.moveTo(fw / 2 - 6, peakY);
      g.lineTo(frontW + 2, frontY + 2);
      g.lineTo(fw - 1, frontY + 8);
      g.lineTo(fw / 2 + 2, peakY + 5);
      g.fill();
    }
    if (kind === "ell") {
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "#fff";
      g.fillRect(fw * 0.58, 0, fw, frontY * 0.72);
      g.globalCompositeOperation = "source-over";
    }
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
    if (kind === "shop") {
      g.fillStyle = "#8a2c22";
      g.fillRect(0, frontY - 6, fw - 2, 8);
      g.fillStyle = "#c4483a";
      g.fillRect(0, frontY - 6, fw - 2, 5);
      g.fillStyle = "#f4e6c8";
      for (let i = 0; i < fw - 6; i += 4) g.fillRect(i, frontY - 5, 2, 4);
    }
    if (kind === "mill") {
      g.fillStyle = "#8a9098";
      g.fillRect(frontX, frontY, frontW, frontH);
      g.fillStyle = "#5c646c";
      g.fillRect(frontX, frontY + frontH - 4, frontW, 4);
      g.fillStyle = "#6a4428";
      g.fillRect(fw - 18, frontY + 2, 16, 16);
      g.fillStyle = "#e6d2a8";
      g.fillRect(fw - 16, frontY + 8, 12, 3);
      g.fillRect(fw - 12, frontY + 4, 3, 12);
      g.fillStyle = "#5c3a22";
      g.fillRect(fw - 11, frontY + 9, 2, 2);
    }
    if (kind === "granary" || kind === "warehouse") {
      g.fillStyle = "#c4a060";
      g.fillRect(frontX + 4, frontY - 8, frontW - 10, 10);
      g.fillStyle = "#8a6840";
      g.fillRect(frontX + 4, frontY - 2, frontW - 10, 3);
    }
    if (kind === "inn") {
      g.fillStyle = "#5c3a22";
      g.fillRect(8, frontY - 8, 2, 8);
      g.fillStyle = "#e6c878";
      g.fillRect(10, frontY - 10, 16, 7);
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
