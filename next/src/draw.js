// World, people, spells, and the map. Terrain is baked into chunks.

import { TILE, WW, WH, worldPlan, kingdom, hash } from "./layout.js";
import { sample, wildTree, BLOBS, fbm } from "./terrain.js";
import { tileSprite, buildingSprite, actorSprite, HERO, PALETTES, monsterSprite, treeSprite, swordSprite, furnSprite } from "./art.js";
import { drawText } from "./font.js";
import { hourOf, spellLevel, flyLevel } from "./sim.js";

const CH = 16;
const chunks = new Map();
let sword;

function edge(g, tx, ty, px, py, ground) {
  const nb = [[0, -1, 0, 0, 16, 3], [0, 1, 0, 13, 16, 3], [-1, 0, 0, 0, 3, 16], [1, 0, 13, 0, 3, 16]];
  for (let i = 0; i < 4; i++) {
    const o = sample(tx + nb[i][0], ty + nb[i][1]);
    if (!o || o.ground === ground || o.ground === "void") continue;
    if (o.ground === "ocean" && ground !== "pier") {
      g.fillStyle = "rgba(232,244,255,0.85)";
      for (let k = 0; k < 8; k++) if ((hash(tx, ty, k + i) % 3) === 0) {
        if (i === 0) g.fillRect(px + k * 2, py, 2, 1);
        else if (i === 1) g.fillRect(px + k * 2, py + 15, 2, 1);
        else if (i === 2) g.fillRect(px, py + k * 2, 1, 2);
        else g.fillRect(px + 15, py + k * 2, 1, 2);
      }
    }
    const spr = tileSprite(o.ground === "pier" ? "ocean" : o.ground, 0);
    g.drawImage(spr, nb[i][2], nb[i][3], nb[i][4], nb[i][5], px + nb[i][2], py + nb[i][3], nb[i][4], nb[i][5]);
  }
}

function getChunk(cx, cy) {
  const k = cx + "," + cy;
  const hit = chunks.get(k);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = CH * 16; c.height = CH * 16;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) {
    const tx = cx * CH + x, ty = cy * CH + y;
    const s = sample(tx, ty);
    const spr = tileSprite(s.ground, hash(tx, ty, 2) % 3);
    g.drawImage(spr, x * 16, y * 16);
    if ((hash(tx, ty, 5) % 3) === 0) edge(g, tx, ty, x * 16, y * 16, s.ground);
  }
  chunks.set(k, c);
  if (chunks.size > 48) chunks.delete(chunks.keys().next().value);
  return c;
}

export function prewarm(px, py) {
  const cx = (px / TILE / CH) | 0, cy = (py / TILE / CH) | 0;
  for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 1; x <= cx + 1; x++) getChunk(x, y);
}

function shadow(ctx, x, y, sc) {
  ctx.fillStyle = "rgba(40,28,12,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y, 6 * sc, 2.4 * sc, 0, 0, 7);
  ctx.fill();
}

function buildingDraw(ctx, b, town, roofs) {
  const spr = buildingSprite(b.kind, town, hash(b.x, b.y, 1) % 3);
  const dx = b.x * TILE;
  const dy = (b.y + b.h) * TILE - spr.height;
  ctx.drawImage(spr, dx, dy);
  roofs.push({ spr, dx, dy, front: (b.y + b.h) * TILE, back: b.y * TILE });
}

export function render(ctx, view, state, scale) {
  const p = state.player;
  const vw = view.w / scale, vh = view.h / scale;
  let camX = p.x - vw / 2, camY = p.y - vh / 2;
  if (state.shake > 0) {
    camX += ((hash(state.min * 10 | 0, 1, 1) % 5) - 2);
    camY += ((hash(state.min * 10 | 0, 2, 1) % 5) - 2);
  }
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#07060c";
  ctx.fillRect(0, 0, vw, vh);

  if (state.mode === "room") { renderRoom(ctx, state, vw, vh); }
  else renderWorld(ctx, state, camX, camY, vw, vh);

  if (state.flash) {
    ctx.fillStyle = state.flash.color;
    ctx.globalAlpha = state.flash.a * Math.max(0, state.flash.t / 0.12);
    ctx.fillRect(camX, camY, vw, vh);
    ctx.globalAlpha = 1;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  hud(ctx, view, state);
  if (state.map) renderMap(ctx, view, state);
}

function renderWorld(ctx, state, camX, camY, vw, vh) {
  const p = state.player;
  camX = Math.max(0, Math.min(WW * TILE - vw, camX));
  camY = Math.max(0, Math.min(WH * TILE - vh, camY));
  ctx.translate(-camX | 0, -camY | 0);
  const x0 = Math.floor(camX / (CH * 16)), x1 = Math.floor((camX + vw) / (CH * 16));
  const y0 = Math.floor(camY / (CH * 16)), y1 = Math.floor((camY + vh) / (CH * 16));
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    ctx.drawImage(getChunk(cx, cy), cx * CH * 16, cy * CH * 16);
  }
  // glints on water in view
  ctx.fillStyle = "#f4fbff";
  const t = state.min;
  for (let i = 0; i < 14; i++) {
    const gx = camX + ((hash(i, (t / 2) | 0, 3) % (vw | 0)));
    const gy = camY + ((hash(i, (t / 2) | 0, 4) % (vh | 0)));
    if (sample(gx / TILE | 0, gy / TILE | 0).ground === "ocean") ctx.fillRect(gx | 0, gy | 0, 2, 1);
  }
  const list = [];
  const roofs = [];
  const trees = [];
  const tx0 = camX / TILE | 0, ty0 = camY / TILE | 0, tx1 = (camX + vw) / TILE | 0, ty1 = (camY + vh) / TILE | 0;
  for (const plan of state.plans) {
    if (plan.maxX * TILE < camX - 40 || plan.minX * TILE > camX + vw + 40) continue;
    if (plan.maxY * TILE < camY - 80 || plan.minY * TILE > camY + vh + 80) continue;
    for (const b of plan.buildings) {
      if ((b.x + b.w) * TILE < camX || b.x * TILE > camX + vw) continue;
      if ((b.y + b.h) * TILE < camY || b.y * TILE > camY + vh + 40) continue;
      list.push({ y: (b.y + b.h) * TILE, draw: () => buildingDraw(ctx, b, plan.town, roofs) });
    }
    for (const prop of plan.props) {
      if (prop.x * TILE < camX - 20 || prop.x * TILE > camX + vw + 20) continue;
      if (prop.kind === "tree") {
        trees.push(prop);
        list.push({ y: prop.y * TILE + 16, draw: () => {
          const spr = treeSprite(prop.seed || 1);
          ctx.drawImage(spr, prop.x * TILE - 8, prop.y * TILE - 22);
        } });
      } else if (prop.kind === "well") {
        list.push({ y: prop.y * TILE + 14, draw: () => {
          ctx.fillStyle = "#8a8078"; ctx.fillRect(prop.x * TILE + 3, prop.y * TILE + 4, 10, 8);
          ctx.fillStyle = "#3a6ea8"; ctx.fillRect(prop.x * TILE + 5, prop.y * TILE + 6, 6, 4);
          ctx.fillStyle = "#d8e8f4"; ctx.fillRect(prop.x * TILE + 6, prop.y * TILE + 7, 2, 1);
          ctx.fillStyle = "#6a5340"; ctx.fillRect(prop.x * TILE + 7, prop.y * TILE, 2, 6);
        } });
      } else if (prop.kind === "brazier") {
        list.push({ y: prop.y * TILE + 12, draw: () => {
          ctx.fillStyle = "#4a4038"; ctx.fillRect(prop.x * TILE + 5, prop.y * TILE + 6, 6, 6);
          ctx.fillStyle = "#e07030"; ctx.fillRect(prop.x * TILE + 6, prop.y * TILE + 3, 4, 4);
        } });
      }
    }
  }
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (!wildTree(tx, ty)) continue;
    list.push({ y: ty * TILE + 16, draw: () => ctx.drawImage(treeSprite(hash(tx, ty, 1) % 6), tx * TILE - 8, ty * TILE - 22) });
    trees.push({ x: tx, y: ty, seed: hash(tx, ty, 1) % 6, wild: true });
  }
  for (const n of state.npcs) {
    if (n.inside) continue;
    if (Math.abs(n.x - p.x) > vw && Math.abs(n.y - p.y) > vh) continue;
    list.push({ y: n.y, draw: () => drawActor(ctx, n.x, n.y, 0, PALETTES[n.pal], n.dir, n.frame, n.child ? 0.82 : 1, "") });
  }
  for (const m of state.monsters) {
    if (m.hp <= 0) continue;
    if (Math.abs(m.x - camX) > vw + 40) continue;
    list.push({ y: m.y, draw: () => {
      shadow(ctx, m.x, m.y, 1);
      if (m.hit > 0) ctx.globalAlpha = 0.55;
      ctx.drawImage(monsterSprite(m.kind, m.frame & 1), m.x - 12, m.y - 16);
      ctx.globalAlpha = 1;
    } });
  }
  const lift = p.z + p.alt;
  const sc = p.fly ? Math.max(0.35, 1 - p.alt / 70) : Math.max(0.55, 1 - p.z / 40);
  if (!p.fly) list.push({ y: p.y, draw: () => drawActor(ctx, p.x, p.y, lift, HERO, p.dir, p.z > 1 ? 0 : p.frame, 1, "") });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) it.draw();
  // roof and canopy edges over anyone standing just behind them
  if (!p.fly) {
    for (const r of roofs) {
      if (p.y < r.front - 2 && p.y > r.back - 6) ctx.drawImage(r.spr, 0, 0, r.spr.width, 22, r.dx, r.dy, r.spr.width, 22);
    }
    for (const tr of trees) {
      const base = tr.y * TILE + 14;
      if (p.y < base && p.y > base - 18) {
        const spr = treeSprite(tr.seed || 1);
        ctx.drawImage(spr, 0, 0, spr.width, 20, tr.x * TILE - 8, tr.y * TILE - 22, spr.width, 20);
      }
    }
  }
  if (p.fly) {
    const lv = flyLevel(p.flyXp);
    ctx.fillStyle = lv >= 4 ? "#f4fbff" : "#d5ecff";
    for (let i = 0; i < lv + 3; i++) {
      ctx.globalAlpha = 0.28 + (i % 2) * 0.15;
      ctx.fillRect(p.x - 14 - i * (6 + lv), p.y - lift - 6 + (i % 3) * 3, 10 + lv * 2, 1);
    }
    ctx.globalAlpha = 1;
    drawActor(ctx, p.x, p.y, lift, HERO, p.dir, 1, 1, "fly");
  }
  if (p.swing > 0.05) {
    if (!sword) sword = swordSprite();
    ctx.save();
    ctx.translate(p.x, p.y - 10 - lift);
    const ang = p.dir === 0 ? 1.2 : p.dir === 1 ? -1.2 : p.dir === 2 ? 3 : 0;
    ctx.rotate(ang + (0.26 - p.swing) * 6);
    ctx.drawImage(sword, 0, -3);
    ctx.restore();
  }
  for (const s of state.shots) {
    if (s.kind === "fire") {
      const cols = ["#fff6d0", "#ffd078", "#ff8a30", "#d84820"];
      const rad = 4 + s.lv * 4;
      for (let i = 0; i <= s.lv; i++) {
        ctx.fillStyle = cols[Math.min(cols.length - 1, i)];
        const r = rad - i * 3;
        ctx.fillRect(s.x - r, s.y - r * 0.7, r * 2, r * 1.3);
      }
    } else {
      ctx.strokeStyle = s.lv >= 4 ? "#f4fffb" : "#d8fff0";
      ctx.lineWidth = s.lv >= 3 ? 2 : 1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6 + s.lv * 2, -1, 1);
      ctx.stroke();
      if (s.lv >= 5) { ctx.strokeStyle = "#9ad8c0"; ctx.beginPath(); ctx.arc(s.x - 6, s.y, 10, -0.8, 0.8); ctx.stroke(); }
    }
  }
  for (const b of state.bolts) {
    ctx.strokeStyle = b.lv >= 4 ? "#f7f4ff" : "#c8c0f0";
    ctx.lineWidth = 1 + (b.lv > 3 ? 2 : 1);
    ctx.beginPath();
    ctx.moveTo(b.pts[0][0], b.pts[0][1]);
    for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
    ctx.stroke();
    if (b.lv >= 2) {
      ctx.strokeStyle = "#7a88d8";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  for (const r of state.rings) {
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, 7);
    ctx.stroke();
  }
  for (const q of state.particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    ctx.fillRect(q.x, q.y, q.w, q.h);
  }
  ctx.globalAlpha = 1;
  // motes
  ctx.fillStyle = "#f6e2b0";
  for (let i = 0; i < 10; i++) {
    const mx = camX + ((hash(i, 2, 7) + state.min * 8) % vw);
    const my = camY + ((hash(i, 3, 7) + state.min * 5) % vh);
    ctx.globalAlpha = 0.35 + (hash(i, (state.min) | 0, 1) % 4) * 0.1;
    ctx.fillRect(mx | 0, my | 0, 1, 1);
  }
  ctx.globalAlpha = 1;
  // bubbles in world space, drawn later in screen space by hud using stored
  state._cam = { x: camX, y: camY };
}

function drawActor(ctx, x, y, lift, pal, dir, frame, sc, pose) {
  shadow(ctx, x, y, sc * (pose === "fly" ? Math.max(0.35, 1 - lift / 70) : Math.max(0.55, 1 - lift / 40)));
  const spr = actorSprite(pal, dir, frame % 4, pose);
  ctx.save();
  ctx.translate(x | 0, (y - lift) | 0);
  ctx.scale(sc, sc);
  ctx.drawImage(spr, -11, -28);
  ctx.restore();
}

function renderRoom(ctx, state, vw, vh) {
  const r = state.room;
  const rw = r.w * TILE, rh = r.h * TILE;
  const ox = Math.max(8, (vw - rw) / 2), oy = Math.max(8, (vh - rh) / 2 - 10);
  ctx.fillStyle = "#14110e";
  ctx.fillRect(ox, oy, rw, rh);
  ctx.fillStyle = "#6a5340";
  ctx.fillRect(ox, oy, rw, 6);
  ctx.fillRect(ox, oy, 6, rh);
  ctx.fillRect(ox + rw - 6, oy, 6, rh);
  ctx.fillStyle = "#c4a878";
  ctx.fillRect(ox + 6, oy + 6, rw - 12, rh - 12);
  ctx.fillStyle = "#b49468";
  for (let y = 1; y < r.h - 1; y++) for (let x = 1; x < r.w - 1; x++) if (((x + y) & 1) === 0) ctx.fillRect(ox + x * TILE, oy + y * TILE, 16, 16);
  for (const f of r.furn) {
    const spr = furnSprite(f.kind);
    ctx.drawImage(spr, ox + f.x * TILE - 4, oy + f.y * TILE - 10);
  }
  for (const n of r.people) {
    drawActor(ctx, ox + n.x, oy + n.y, 0, PALETTES[n.pal], n.dir, 0, n.child ? 0.82 : 1, "");
  }
  const p = state.player;
  drawActor(ctx, ox + p.x, oy + p.y, p.z, HERO, p.dir, p.frame, 1, "");
  state._roomOrigin = { ox, oy };
}

function hud(ctx, view, state) {
  const p = state.player;
  for (let i = 0; i < p.maxHp / 2; i++) {
    const x = 8 + i * 14, y = 8;
    ctx.fillStyle = "#8a3030";
    ctx.fillRect(x, y + 2, 5, 4); ctx.fillRect(x + 4, y + 2, 5, 4);
    ctx.fillRect(x + 1, y + 6, 8, 3); ctx.fillRect(x + 3, y + 9, 4, 2);
    const full = p.hp >= (i + 1) * 2, half = !full && p.hp >= i * 2 + 1;
    ctx.fillStyle = full || half ? "#e05048" : "#4a2828";
    ctx.fillRect(x + 1, y + 3, 3, 2);
    if (full) ctx.fillRect(x + 5, y + 3, 3, 2);
    if (full || half) { ctx.fillStyle = "#ffb0a8"; ctx.fillRect(x + 1, y + 3, 1, 1); }
  }
  ctx.fillStyle = "#1a3358";
  ctx.fillRect(8, 24, 52, 5);
  ctx.fillStyle = "#7eb0e8";
  ctx.fillRect(9, 25, 50 * (p.mp / p.maxMp), 3);
  const lv = spellLevel(p.spells[p.spell].xp);
  drawText(ctx, p.spell + " " + lv, 8, 34, "#f4f0e4", 1);
  if (p.fly) drawText(ctx, "fly " + flyLevel(p.flyXp), 8, 44, "#d5ecff", 1);
  if (state.minimap !== false) {
    mini(ctx, view, state);
  }
  const cam = state._cam || { x: 0, y: 0 };
  const scale = view.scale;
  if (state.mode === "room") { /* bubbles belong to the street */ }
  else for (const b of state.bubbles) {
    const sx = (b.x - cam.x) * scale;
    const sy = (b.y - cam.y) * scale - 36;
    const msg = b.text.length > 28 ? b.text.slice(0, 28) : b.text;
    const w = 10 + msg.length * 6;
    ctx.fillStyle = "#0e1c3a";
    ctx.fillRect(sx - w / 2, sy - 14, w, 16);
    ctx.strokeStyle = "#9ad0ff";
    ctx.strokeRect(sx - w / 2 + 0.5, sy - 13.5, w - 1, 14);
    drawText(ctx, msg, sx - w / 2 + 4, sy - 11, "#ffffff", 1);
  }
  if (state.noticeT > 0 && state.notice) {
    drawText(ctx, state.notice.slice(0, 42), 8, view.h - 168, "#fff6d8", 1);
  }
  const hour = hourOf(state);
  drawText(ctx, (hour < 10 ? "0" : "") + hour + ":00", view.w - 78, 8, "#f4f0e4", 1);
}

let miniBuf = null, miniAt = -1;
function mini(ctx, view, state) {
  const s = 72, x = view.w - s - 8, y = 22;
  if (!miniBuf) { miniBuf = document.createElement("canvas"); miniBuf.width = s; miniBuf.height = s; }
  if (state.min - miniAt > 0.5) {
    miniAt = state.min;
    const g = miniBuf.getContext("2d");
    const p = state.player;
    const rad = 42;
    for (let iy = 0; iy < s; iy += 2) for (let ix = 0; ix < s; ix += 2) {
      const tx = (p.x / TILE | 0) + ((ix / s) - 0.5) * rad * 2;
      const ty = (p.y / TILE | 0) + ((iy / s) - 0.5) * rad * 2;
      const gr = sample(tx | 0, ty | 0).ground;
      g.fillStyle = gr === "ocean" ? "#1a56b4" : gr === "dirt" ? "#c4a06a" : gr === "cobble" ? "#ddd0b8" : gr === "sand" ? "#e6c888" : gr === "snow" ? "#e7f2f8" : gr === "mud" || gr === "marsh" ? "#5c5348" : gr === "cliff" || gr === "moss" ? "#7a8460" : "#5ea83a";
      g.fillRect(ix, iy, 2, 2);
    }
  }
  ctx.fillStyle = "#0e1c3a";
  ctx.fillRect(x - 2, y - 2, s + 4, s + 4);
  ctx.drawImage(miniBuf, x, y);
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(x + s / 2 - 1, y + s / 2 - 1, 3, 3);
}

let mapCanvas = null;
function ensureMap() {
  if (mapCanvas) return mapCanvas;
  const w = 360, h = 280;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const plans = worldPlan();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const tx = (x / w) * WW, ty = (y / h) * WH;
    const e = fbm(tx, ty) - 0.5;
    let land = null, best = 2;
    for (let i = 0; i < BLOBS.length; i++) {
      const b = BLOBS[i];
      const d = ((tx - b.x) / b.rx) ** 2 + ((ty - b.y) / b.ry) ** 2 - e * 0.45;
      if (d < best) { best = d; land = b; }
    }
    for (const plan of plans) {
      if (!plan.town.island) continue;
      const t = plan.town;
      const r = t.landR || 96;
      const d = ((tx - t.x) ** 2 + (ty - t.y) ** 2) / (r * r);
      if (d < best) { best = d; land = { biome: "isle", kingdom: t.kingdom }; }
    }
    let col = "#164ea8";
    if (land && best < 1) {
      col = land.biome === "snow" ? "#d5e6f0" : land.biome === "desert" ? "#e2c48a" : land.biome === "nether" ? "#4a3848" : land.biome === "swamp" ? "#6a7044" : land.biome === "forest" ? "#3f7a32" : "#5ea83a";
      if (best > 0.88) col = "#e6d2a4";
      const k = land.kingdom && kingdom(land.kingdom);
      if (k && best < 0.84) {
        col = mix(col, k.color, 0.22);
      }
    }
    g.fillStyle = col;
    g.fillRect(x, y, 1, 1);
  }
  mapCanvas = c;
  return c;
}

function mix(hex, tint, a) {
  const p = (h, i) => parseInt(h.slice(i, i + 2), 16);
  const r = p(hex, 1) * (1 - a) + p(tint, 1) * a;
  const g = p(hex, 3) * (1 - a) + p(tint, 3) * a;
  const b = p(hex, 5) * (1 - a) + p(tint, 5) * a;
  return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
}

function renderMap(ctx, view, state) {
  const pad = 16;
  ctx.fillStyle = "rgba(8,10,18,0.72)";
  ctx.fillRect(0, 0, view.w, view.h);
  const map = ensureMap();
  const x = (view.w - map.width) / 2, y = 48;
  ctx.fillStyle = "#0e1c3a";
  ctx.fillRect(x - 4, y - 4, map.width + 8, map.height + 8);
  ctx.strokeStyle = "#f4f8ff";
  ctx.strokeRect(x - 4.5, y - 4.5, map.width + 8, map.height + 8);
  ctx.strokeStyle = "#9ad0ff";
  ctx.strokeRect(x - 2.5, y - 2.5, map.width + 4, map.height + 4);
  ctx.drawImage(map, x, y);
  const plans = state.plans;
  const used = [];
  for (const plan of plans) {
    const px = x + (plan.town.x / WW) * map.width;
    const py = y + (plan.town.y / WH) * map.height;
    const k = kingdom(plan.town.kingdom);
    ctx.fillStyle = k.dark;
    ctx.fillRect(px - 2, py - 1, 5, 5);
    ctx.fillStyle = k.color;
    ctx.fillRect(px - 1, py, 3, 3);
    const name = plan.town.name;
    let lx = px + 5, ly = py - 8;
    const tw = name.length * 6;
    for (let n = 0; n < 8; n++) {
      if (!used.some(r => lx < r.x + r.w + 2 && lx + tw > r.x && ly < r.y + 8 && ly + 8 > r.y)) break;
      ly += 8;
    }
    used.push({ x: lx, y: ly, w: tw });
    drawText(ctx, name, lx + 1, ly + 1, k.dark, 1);
    drawText(ctx, name, lx, ly, k.color, 1);
  }
  const hx = x + (state.player.x / TILE / WW) * map.width;
  const hy = y + (state.player.y / TILE / WH) * map.height;
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(hx - 2, hy - 2, 4, 4);
  drawText(ctx, "The realm", x, y - 16, "#f4f8ff", 1);
  void pad;
}

export function mapReady() { return !!mapCanvas; }
