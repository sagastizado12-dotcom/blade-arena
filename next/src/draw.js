// World, people, spells, and the map. Terrain is baked into chunks.

import { TILE, WW, WH, worldPlan, kingdom, hash, KINGDOMS, roadSegments, TOWNS } from "./layout.js";
import { sample, wildTree, isLand, RIVERS } from "./terrain.js";
import { tileSprite, buildingSprite, actorSprite, HERO, PALETTES, monsterSprite, treeSprite, swordSprite, furnSprite, bossSprite } from "./art.js";
import { wagonPos, shipPos } from "./realm.js";
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
    if (ground === "dirt" && (o.ground === "grass" || o.ground === "forest")) {
      g.fillStyle = o.ground === "forest" ? "#3d8240" : "#4ea044";
      for (let k = 0; k < 8; k++) if ((hash(tx, ty, k + i * 3) % 2) === 0) {
        const n = 1 + (hash(tx, ty, k) % 3);
        if (i === 0) g.fillRect(px + k * 2, py, 2, n);
        else if (i === 1) g.fillRect(px + k * 2, py + 16 - n, 2, n);
        else if (i === 2) g.fillRect(px, py + k * 2, n, 2);
        else g.fillRect(px + 16 - n, py + k * 2, n, 2);
      }
    }
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
    if (s.ground === "dirt" || s.ground === "bridge" || (hash(tx, ty, 5) % 3) === 0) edge(g, tx, ty, x * 16, y * 16, s.ground);
  }
  chunks.set(k, c);
  if (chunks.size > 160) chunks.delete(chunks.keys().next().value);
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
  const bias = { emberreach: 1, varnhold: 1, wheatmarch: 0, aldmoor: 0, oakenshore: 0, yarrowkeep: 0, frostmere: 2, tidewatch: 2, saltcrown: 2, sylvaris: 3, bellhollow: 3, mossdeep: 3, briarford: 4, sandhaven: 4, haldenford: 4, eastwatch: 1, moderno: 1, pandemora: 1 };
  let variant = hash(b.x, b.y, 1) % 5;
  if (bias[town.id] != null && (hash(b.x, b.y, 9) % 4) !== 0) variant = bias[town.id];
  const spr = buildingSprite(b.kind, town, variant, b.w, b.h);
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

  if (state.mode === "room") renderRoom(ctx, state, vw, vh);
  else if (state.mode === "dungeon") renderDungeon(ctx, state, camX, camY, vw, vh);
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
          ctx.drawImage(spr, prop.x * TILE - 28, prop.y * TILE - 58);
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
      } else if (prop.kind === "fence") {
        list.push({ y: prop.y * TILE + 12, draw: () => {
          ctx.fillStyle = "#6a4428"; ctx.fillRect(prop.x * TILE, prop.y * TILE + 6, 16, 2); ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 2, 2, 12); ctx.fillRect(prop.x * TILE + 12, prop.y * TILE + 2, 2, 12);
          ctx.fillStyle = "#a07848"; ctx.fillRect(prop.x * TILE, prop.y * TILE + 6, 16, 1);
        } });
      } else if (prop.kind === "barrel") {
        list.push({ y: prop.y * TILE + 14, draw: () => {
          ctx.fillStyle = "#6a3c20"; ctx.fillRect(prop.x * TILE + 4, prop.y * TILE + 4, 8, 10);
          ctx.fillStyle = "#c48a48"; ctx.fillRect(prop.x * TILE + 5, prop.y * TILE + 5, 6, 3);
          ctx.fillStyle = "#4a4038"; ctx.fillRect(prop.x * TILE + 4, prop.y * TILE + 8, 8, 1);
        } });
      } else if (prop.kind === "pot") {
        list.push({ y: prop.y * TILE + 12, draw: () => {
          ctx.fillStyle = "#8a4030"; ctx.fillRect(prop.x * TILE + 5, prop.y * TILE + 6, 6, 6);
          ctx.fillStyle = "#3a8a40"; ctx.fillRect(prop.x * TILE + 6, prop.y * TILE + 3, 2, 4); ctx.fillRect(prop.x * TILE + 8, prop.y * TILE + 2, 2, 3);
          ctx.fillStyle = "#e07088"; ctx.fillRect(prop.x * TILE + 7, prop.y * TILE + 1, 2, 2);
        } });
      } else if (prop.kind === "hedge") {
        list.push({ y: prop.y * TILE + 12, draw: () => {
          ctx.fillStyle = "#1e5a28"; ctx.fillRect(prop.x * TILE, prop.y * TILE + 6, 16, 8);
          ctx.fillStyle = "#3a8a40"; ctx.fillRect(prop.x * TILE, prop.y * TILE + 4, 16, 4);
          ctx.fillStyle = "#67a84a"; ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 3, 3, 2); ctx.fillRect(prop.x * TILE + 9, prop.y * TILE + 2, 3, 2);
        } });
      } else if (prop.kind === "flowers") {
        list.push({ y: prop.y * TILE + 10, draw: () => {
          ctx.fillStyle = "#2d6e28"; ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 8, 12, 4);
          ctx.fillStyle = "#e87890"; ctx.fillRect(prop.x * TILE + 3, prop.y * TILE + 5, 2, 2); ctx.fillRect(prop.x * TILE + 8, prop.y * TILE + 4, 2, 2);
          ctx.fillStyle = "#f0d060"; ctx.fillRect(prop.x * TILE + 6, prop.y * TILE + 6, 2, 2); ctx.fillRect(prop.x * TILE + 11, prop.y * TILE + 6, 2, 2);
        } });
      } else if (prop.kind === "crate") {
        list.push({ y: prop.y * TILE + 14, draw: () => {
          ctx.fillStyle = "#a87440"; ctx.fillRect(prop.x * TILE + 3, prop.y * TILE + 5, 10, 8);
          ctx.fillStyle = "#6a4428"; ctx.fillRect(prop.x * TILE + 3, prop.y * TILE + 8, 10, 1); ctx.fillRect(prop.x * TILE + 7, prop.y * TILE + 5, 1, 8);
        } });
      } else if (prop.kind === "boat") {
        list.push({ y: prop.y * TILE + 12, draw: () => {
          ctx.fillStyle = "#6a4428"; ctx.fillRect(prop.x * TILE + 1, prop.y * TILE + 7, 14, 5);
          ctx.fillStyle = "#8a5a30"; ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 6, 10, 2);
          ctx.fillStyle = "#f4efe4"; ctx.fillRect(prop.x * TILE + 7, prop.y * TILE + 1, 2, 8);
          ctx.fillStyle = "#c4483a"; ctx.fillRect(prop.x * TILE + 9, prop.y * TILE + 2, 5, 5);
        } });
      } else if (prop.kind === "wheat") {
        list.push({ y: prop.y * TILE + 10, draw: () => {
          ctx.fillStyle = "#c8a040"; ctx.fillRect(prop.x * TILE + 3, prop.y * TILE + 4, 2, 8); ctx.fillRect(prop.x * TILE + 7, prop.y * TILE + 3, 2, 9); ctx.fillRect(prop.x * TILE + 11, prop.y * TILE + 5, 2, 7);
          ctx.fillStyle = "#e6c878"; ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 3, 4, 2); ctx.fillRect(prop.x * TILE + 6, prop.y * TILE + 2, 4, 2); ctx.fillRect(prop.x * TILE + 10, prop.y * TILE + 4, 4, 2);
        } });
      } else if (prop.kind === "cwall") {
        list.push({ y: prop.y * TILE + 16, draw: () => {
          ctx.fillStyle = "#6a6458"; ctx.fillRect(prop.x * TILE, prop.y * TILE + 4, 16, 12);
          ctx.fillStyle = "#8a8478"; ctx.fillRect(prop.x * TILE, prop.y * TILE + 2, 16, 4);
          ctx.fillStyle = "#4a463e"; ctx.fillRect(prop.x * TILE, prop.y * TILE + 14, 16, 2);
          ctx.fillStyle = "#b0aa9c"; ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 6, 4, 3); ctx.fillRect(prop.x * TILE + 9, prop.y * TILE + 8, 4, 3);
        } });
      } else if (prop.kind === "lighthouse") {
        list.push({ y: prop.y * TILE + 16, draw: () => {
          ctx.fillStyle = "#d8d4cc"; ctx.fillRect(prop.x * TILE + 5, prop.y * TILE - 28, 6, 40);
          ctx.fillStyle = "#a84838"; ctx.fillRect(prop.x * TILE + 4, prop.y * TILE - 18, 8, 4); ctx.fillRect(prop.x * TILE + 4, prop.y * TILE - 6, 8, 4);
          ctx.fillStyle = "#f4e6a0"; ctx.fillRect(prop.x * TILE + 4, prop.y * TILE - 34, 8, 6);
          ctx.fillStyle = "#fff6c8"; ctx.fillRect(prop.x * TILE + 6, prop.y * TILE - 32, 4, 3);
          ctx.fillStyle = "#6a645c"; ctx.fillRect(prop.x * TILE + 3, prop.y * TILE + 8, 10, 6);
        } });
      } else if (prop.kind === "belltower") {
        list.push({ y: prop.y * TILE + 16, draw: () => {
          ctx.fillStyle = "#c8c0b0"; ctx.fillRect(prop.x * TILE + 4, prop.y * TILE - 26, 8, 38);
          ctx.fillStyle = "#8a4030"; ctx.fillRect(prop.x * TILE + 3, prop.y * TILE - 32, 10, 6);
          ctx.fillStyle = "#e6c040"; ctx.fillRect(prop.x * TILE + 6, prop.y * TILE - 16, 4, 4);
          ctx.fillStyle = "#5c564c"; ctx.fillRect(prop.x * TILE + 7, prop.y * TILE - 22, 2, 6);
        } });
      } else if (prop.kind === "oak") {
        list.push({ y: prop.y * TILE + 16, draw: () => {
          ctx.drawImage(treeSprite((prop.seed || 1) + 1), prop.x * TILE - 40, prop.y * TILE - 78);
          ctx.drawImage(treeSprite(prop.seed || 2), prop.x * TILE - 18, prop.y * TILE - 70);
        } });
      } else if (prop.kind === "net") {
        list.push({ y: prop.y * TILE + 14, draw: () => {
          ctx.fillStyle = "#6a4428"; ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 4, 2, 10); ctx.fillRect(prop.x * TILE + 12, prop.y * TILE + 4, 2, 10);
          ctx.fillStyle = "#c4a878"; ctx.fillRect(prop.x * TILE + 4, prop.y * TILE + 6, 8, 1); ctx.fillRect(prop.x * TILE + 4, prop.y * TILE + 9, 8, 1); ctx.fillRect(prop.x * TILE + 4, prop.y * TILE + 12, 8, 1);
        } });
      } else if (prop.kind === "gull") {
        list.push({ y: prop.y * TILE + 8, draw: () => {
          const flap = (Math.abs((prop.x + prop.y) % 3) - 1);
          ctx.fillStyle = "#f7f4ea"; ctx.fillRect(prop.x * TILE + 4, prop.y * TILE + 4, 6, 2);
          ctx.fillRect(prop.x * TILE + 1, prop.y * TILE + 3 + flap, 4, 2); ctx.fillRect(prop.x * TILE + 9, prop.y * TILE + 3 - flap, 4, 2);
          ctx.fillStyle = "#e0a040"; ctx.fillRect(prop.x * TILE + 10, prop.y * TILE + 4, 3, 1);
        } });
      } else if (prop.kind === "shipyard") {
        list.push({ y: prop.y * TILE + 16, draw: () => {
          ctx.fillStyle = "#6a4428"; ctx.fillRect(prop.x * TILE, prop.y * TILE + 6, 16, 8);
          ctx.fillStyle = "#a87440"; ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 2, 4, 10);
          ctx.fillStyle = "#c4483a"; ctx.fillRect(prop.x * TILE + 6, prop.y * TILE + 4, 8, 3);
        } });
      } else if (prop.kind === "stall") {
        list.push({ y: prop.y * TILE + 14, draw: () => {
          ctx.fillStyle = "#6a4428"; ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 8, 12, 6);
          ctx.fillStyle = "#c4483a"; ctx.fillRect(prop.x * TILE, prop.y * TILE + 4, 16, 4);
          ctx.fillStyle = "#f4e6c8"; ctx.fillRect(prop.x * TILE + 2, prop.y * TILE + 5, 3, 2); ctx.fillRect(prop.x * TILE + 8, prop.y * TILE + 5, 3, 2);
          ctx.fillStyle = "#e6c888"; ctx.fillRect(prop.x * TILE + 4, prop.y * TILE + 9, 3, 3);
        } });
      } else if (prop.kind === "sign") {
        list.push({ y: prop.y * TILE + 14, draw: () => {
          ctx.fillStyle = "#5c3a22"; ctx.fillRect(prop.x * TILE + 7, prop.y * TILE + 4, 2, 12);
          ctx.fillStyle = "#e6c888"; ctx.fillRect(prop.x * TILE + 1, prop.y * TILE + 2, 14, 6);
          ctx.fillStyle = "#6a4428"; ctx.fillRect(prop.x * TILE + 3, prop.y * TILE + 4, 8, 1);
        } });
      }
    }
  }
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (!wildTree(tx, ty)) continue;
    list.push({ y: ty * TILE + 16, draw: () => ctx.drawImage(treeSprite(hash(tx, ty, 1) % 6), tx * TILE - 28, ty * TILE - 58) });
    trees.push({ x: tx, y: ty, seed: hash(tx, ty, 1) % 6, wild: true });
  }
  for (const n of state.npcs) {
    if (n.inside) continue;
    if (Math.abs(n.x - p.x) > vw && Math.abs(n.y - p.y) > vh) continue;
    list.push({ y: n.y, draw: () => drawActor(ctx, n.x, n.y, 0, PALETTES[n.pal], n.dir, n.frame, n.child ? 0.82 : 1, "") });
  }
  for (const w of state.wars || []) {
    if (w.done) continue;
    const ka = kingdom(w.a), kb = kingdom(w.b);
    const troop = (n, side, id) => {
      const col = side < 0 ? ka : kb;
      const pal = { id, skin: "#f0c0a0", skinDk: "#c89878", hair: "#3a2418", hairDk: "#24160e", cloth: col.color, clothDk: col.dark, shoe: "#3a2418", eye: "#3a2418" };
      for (let i = 0; i < n; i++) {
        const x = w.fx + side * (i === 0 ? 22 : 46 + (i % 6) * 14);
        const y = w.fy + (i === 0 ? 0 : -36 + ((i / 6) | 0) * 16);
        drawActor(ctx, x, y, 0, pal, side < 0 ? 3 : 2, (state.min + i) & 1, i === 0 ? 1.12 : 0.86, "");
      }
    };
    troop(w.na, -1, "army-a");
    troop(w.nb, 1, "army-b");
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
        ctx.drawImage(spr, 0, 0, spr.width, 28, tr.x * TILE - 28, tr.y * TILE - 58, spr.width, 28);
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
  if (state.weather === "rain") {
    ctx.strokeStyle = "rgba(214,230,246,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 48; i++) {
      const x = camX + (hash(i, (state.min * 8) | 0, 11) % (vw | 0));
      const y = camY + (hash(i, (state.min * 8) | 0, 12) % (vh | 0));
      ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 7);
    }
    ctx.stroke();
  }
  for (const w of state.wagons || []) {
    const pos = wagonPos(state, w);
    if (pos.x < camX - 40 || pos.x > camX + vw + 40 || pos.y < camY - 40 || pos.y > camY + vh + 40) continue;
    ctx.fillStyle = "#6a4428"; ctx.fillRect(pos.x - 12, pos.y - 10, 20, 8);
    ctx.fillStyle = "#c4a06a"; ctx.fillRect(pos.x - 4, pos.y - 16, 12, 7);
    ctx.fillStyle = "#3a2418"; ctx.fillRect(pos.x - 10, pos.y - 2, 4, 4); ctx.fillRect(pos.x + 6, pos.y - 2, 4, 4);
    ctx.fillStyle = "#f0d8b0"; ctx.fillRect(pos.x + 2, pos.y - 20, 3, 5);
  }
  for (const s of state.ships || []) {
    const pos = shipPos(state, s);
    if (pos.x < camX - 30 || pos.x > camX + vw + 30 || pos.y < camY - 30 || pos.y > camY + vh + 30) continue;
    ctx.fillStyle = "#7a4e2c"; ctx.fillRect(pos.x - 8, pos.y - 4, 16, 5);
    ctx.fillStyle = "#f4efe4"; ctx.fillRect(pos.x, pos.y - 14, 2, 10);
    ctx.fillStyle = "#c4453a"; ctx.fillRect(pos.x + 2, pos.y - 13, 7, 6);
  }
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

const DUN_THEME = {
  grove: { a: "#2c4e28", b: "#3a6234", c: "#4e8a40", wall: "#4a3424", top: "#6a4c30", face: "#2e2016", water: "#2a6848", ice: "#d5efe4" },
  hollow: { a: "#3a3438", b: "#4a4044", c: "#6a5848", wall: "#2a2428", top: "#4a4048", face: "#1c181c", water: "#3a4860", ice: "#c8d0d8" },
  ice: { a: "#c5d6e4", b: "#d7e6f0", c: "#eef6fb", wall: "#6a8498", top: "#d5e4ee", face: "#4a6478", water: "#2f6eae", ice: "#f4fbff" },
  flood: { a: "#4a5a48", b: "#5c6c58", c: "#3a6a78", wall: "#3a4038", top: "#5a6458", face: "#242820", water: "#1e62b4", ice: "#d7eef8" },
  ash: { a: "#5a4038", b: "#6a4c40", c: "#e07030", wall: "#3a2824", top: "#6a4038", face: "#241816", water: "#6a4030", ice: "#e8d0c0" },
  sky: { a: "#c8c4b0", b: "#d8d4c4", c: "#f4f0e0", wall: "#8a8474", top: "#e8e4d4", face: "#6a6458", water: "#6a98c0", ice: "#f7fbff" },
  cave: { a: "#5a564e", b: "#6a6458", c: "#7a8a58", wall: "#3e3a34", top: "#6a655c", face: "#2a2622", water: "#3a5870", ice: "#d5e4ea" }
};

function renderDungeon(ctx, state, camX, camY, vw, vh) {
  const dun = state.dun;
  const f = dun.floors[dun.level];
  const theme = DUN_THEME[dun.def.id] || DUN_THEME.cave;
  const maxX = Math.max(0, f.w * TILE - vw), maxY = Math.max(0, f.h * TILE - vh);
  camX = Math.max(0, Math.min(maxX, camX));
  camY = Math.max(0, Math.min(maxY, camY));
  ctx.translate(-camX | 0, -camY | 0);
  const x0 = Math.max(0, camX / TILE | 0), y0 = Math.max(0, camY / TILE | 0);
  const x1 = Math.min(f.w - 1, (camX + vw) / TILE | 0), y1 = Math.min(f.h - 1, (camY + vh) / TILE | 0);
  const st = state.duns[dun.def.id] || { lit: {} };
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = f.g[y * f.w + x];
    if (t === 1) continue;
    const px = x * TILE, py = y * TILE;
    ctx.fillStyle = ((x + y) & 1) ? theme.a : theme.b;
    ctx.fillRect(px, py, 16, 16);
    if ((hash(x, y, 3) % 5) === 0) { ctx.fillStyle = theme.c; ctx.fillRect(px + (hash(x, y, 1) % 10), py + (hash(x, y, 2) % 10), 2, 3); }
    if ((dun.def.id === "grove" || dun.def.id === "hollow") && (hash(x, y, 6) % 6) === 0) {
      ctx.fillStyle = "#5a3820"; ctx.fillRect(px, py + 12, 10, 2); ctx.fillRect(px + 8, py + 8, 2, 6);
    }
    if (dun.def.id === "ice" && (hash(x, y, 8) % 7) === 0) {
      ctx.fillStyle = "#f7fbff"; ctx.fillRect(px + 6, py + 4, 2, 6); ctx.fillRect(px + 4, py + 6, 6, 2);
    }
    if (t === 2) { ctx.fillStyle = theme.water; ctx.fillRect(px, py, 16, 16); ctx.fillStyle = "#f4fbff"; ctx.fillRect(px + 3, py + 4, 4, 1); ctx.fillRect(px + 9, py + 10, 3, 1); }
    if (t === 12) { ctx.fillStyle = theme.ice; ctx.fillRect(px, py, 16, 16); ctx.fillStyle = "#ffffff"; ctx.fillRect(px + 2, py + 2, 5, 1); }
    if (t === 8) { ctx.fillStyle = "#1e4a24"; ctx.fillRect(px + 1, py, 4, 16); ctx.fillRect(px + 8, py + 2, 5, 14); ctx.fillStyle = "#3a8a40"; ctx.fillRect(px + 2, py + 3, 3, 4); ctx.fillRect(px + 9, py + 8, 3, 4); }
    if (t === 3) { ctx.fillStyle = "#8a6840"; ctx.fillRect(px + 2, py + 3, 12, 2); ctx.fillRect(px + 2, py + 7, 12, 2); ctx.fillRect(px + 2, py + 11, 12, 2); ctx.fillStyle = "#e6d2a8"; ctx.fillRect(px + 2, py + 3, 12, 1); }
    if (t === 4 || t === 13) { ctx.fillStyle = "#5c3a22"; ctx.fillRect(px + 2, py + 1, 12, 14); ctx.fillStyle = t === 13 ? "#e6c878" : "#c4a060"; ctx.fillRect(px + 6, py + 7, 3, 3); }
    if (t === 9) {
      const lit = st.lit && st.lit[x + "," + y];
      ctx.fillStyle = "#5c4030"; ctx.fillRect(px + 7, py + 6, 2, 8);
      ctx.fillStyle = lit ? "#ffb050" : "#6a5340"; ctx.fillRect(px + 5, py + 2, 6, 5);
      if (lit) { ctx.fillStyle = "#fff0c0"; ctx.fillRect(px + 7, py + 3, 2, 2); }
    }
    if (t === 10) { ctx.fillStyle = "#6a6458"; ctx.fillRect(px + 3, py + 6, 10, 6); ctx.fillStyle = "#e6d060"; ctx.fillRect(px + 6, py + 8, 4, 3); }
    if (t === 11) { ctx.fillStyle = "#7a746c"; ctx.fillRect(px + 2, py + 2, 12, 12); ctx.fillStyle = "#a8a298"; ctx.fillRect(px + 3, py + 3, 10, 3); }
    if (t === 5 || t === 16) { ctx.fillStyle = "#7a4e28"; ctx.fillRect(px + 2, py + 5, 12, 8); ctx.fillStyle = t === 16 ? "#c4a060" : "#e0b060"; ctx.fillRect(px + 2, py + 5, 12, 3); }
    if (t === 6) { ctx.fillStyle = "#e6c878"; ctx.fillRect(px + 6, py + 4, 4, 7); ctx.fillStyle = "#f4e6b0"; ctx.fillRect(px + 5, py + 3, 6, 2); }
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (f.g[y * f.w + x] !== 1) continue;
    const px = x * TILE, py = y * TILE;
    ctx.fillStyle = theme.top;
    ctx.fillRect(px, py - 7, 16, 8);
    ctx.fillStyle = theme.face;
    ctx.fillRect(px, py + 1, 16, 15);
    ctx.fillStyle = theme.wall;
    ctx.fillRect(px, py + 1, 16, 3);
    if ((hash(x, y, 4) % 3) === 0) { ctx.fillStyle = theme.top; ctx.fillRect(px + 2, py + 6, 3, 5); }
    if (dun.def.id === "grove") { ctx.fillStyle = "#6a4428"; ctx.fillRect(px, py + 8, 8, 2); }
    if (dun.def.id === "ice") { ctx.fillStyle = "#f4fbff"; ctx.fillRect(px + 4, py - 6, 2, 5); ctx.fillRect(px + 10, py - 4, 2, 4); }
  }
  for (const d of f.decor || []) {
    if (d.x < x0 || d.x > x1 || d.y < y0 || d.y > y1) continue;
    const px = d.x * TILE, py = d.y * TILE;
    if (d.kind === "shroom") { ctx.fillStyle = "#e8f8c8"; ctx.fillRect(px + 5, py + 6, 6, 3); ctx.fillStyle = "#f4f0c0"; ctx.fillRect(px + 6, py + 4, 4, 2); ctx.fillStyle = "#6a5030"; ctx.fillRect(px + 7, py + 9, 2, 4); }
    else if (d.kind === "crystal") { ctx.fillStyle = "#d7f4ff"; ctx.fillRect(px + 6, py + 3, 3, 8); ctx.fillRect(px + 3, py + 7, 3, 5); ctx.fillStyle = "#ffffff"; ctx.fillRect(px + 7, py + 4, 1, 2); }
    else if (d.kind === "root") { ctx.fillStyle = "#6a4428"; ctx.fillRect(px + 1, py + 11, 12, 2); ctx.fillRect(px + 8, py + 7, 2, 6); }
    else if (d.kind === "bone") { ctx.fillStyle = "#e6d8c0"; ctx.fillRect(px + 3, py + 8, 8, 2); ctx.fillRect(px + 4, py + 6, 2, 4); }
    else if (d.kind === "ember") { ctx.fillStyle = "#e07030"; ctx.fillRect(px + 6, py + 8, 3, 3); ctx.fillStyle = "#ffd080"; ctx.fillRect(px + 7, py + 6, 2, 2); }
    else if (d.kind === "cloud") { ctx.fillStyle = "#f7f4ea"; ctx.fillRect(px + 3, py + 7, 10, 4); ctx.fillRect(px + 5, py + 5, 5, 3); }
    else if (d.kind === "lily") { ctx.fillStyle = "#2f6a40"; ctx.fillRect(px + 3, py + 8, 8, 3); ctx.fillStyle = "#e8f0c8"; ctx.fillRect(px + 5, py + 6, 3, 2); }
    else { ctx.fillStyle = "#4a7a40"; ctx.fillRect(px + 4, py + 8, 8, 3); ctx.fillRect(px + 6, py + 5, 2, 4); }
  }
  for (const foe of state.dunFoes || []) {
    if (foe.hp <= 0) continue;
    if (foe.boss) {
      const spr = bossSprite(foe.kind, (state.min * 4) & 1);
      if (foe.hit > 0) ctx.globalAlpha = 0.6;
      ctx.drawImage(spr, foe.x - 28, foe.y - 52);
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(monsterSprite(foe.kind === "boar" ? "boar" : foe.kind === "lurker" ? "lurker" : "mite", (state.min * 4) & 1), foe.x - 12, foe.y - 16);
    }
  }
  for (const s of state.shots) {
    if (s.kind === "foe") {
      ctx.fillStyle = s.boss === "ice" ? "#d7f4ff" : s.boss === "ash" ? "#ffb060" : s.boss === "sky" ? "#e6e0ff" : s.boss === "flood" ? "#7ec8e8" : "#b8e080";
      ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
    } else if (s.kind === "fire") {
      ctx.fillStyle = "#ffb050"; ctx.fillRect(s.x - 5, s.y - 4, 10, 8);
      ctx.fillStyle = "#fff0c0"; ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    } else {
      ctx.fillStyle = "#e8fff4"; ctx.fillRect(s.x - 4, s.y - 2, 8, 3);
    }
  }
  const p = state.player;
  if (p.swing > 0.05) {
    if (!sword) sword = swordSprite();
    ctx.save();
    ctx.translate(p.x, p.y - 10);
    const ang = p.dir === 0 ? 1.2 : p.dir === 1 ? -1.2 : p.dir === 2 ? 3 : 0;
    ctx.rotate(ang + (0.26 - p.swing) * 6);
    ctx.drawImage(sword, 0, -3);
    ctx.restore();
  }
  drawActor(ctx, p.x, p.y, p.z, HERO, p.dir, p.frame, 1, "");
  state._cam = { x: camX, y: camY };
}

function renderRoom(ctx, state, vw, vh) {
  ctx.save();
  ctx.scale(2, 2);
  vw /= 2; vh /= 2;
  const r = state.room;
  const rw = r.w * TILE, rh = r.h * TILE;
  const ox = Math.max(8, (vw - rw) / 2), oy = Math.max(8, (vh - rh) / 2 - 10);
  ctx.fillStyle = "#07060c";
  ctx.fillRect(0, 0, vw, vh);
  // back wall with wainscot and windows, side walls, plank floor, open front
  ctx.fillStyle = "#6a4028";
  ctx.fillRect(ox, oy, rw, 28);
  ctx.fillStyle = "#e7d3a8";
  ctx.fillRect(ox + 4, oy + 4, rw - 8, 16);
  ctx.fillStyle = "#c4a878";
  ctx.fillRect(ox + 4, oy + 16, rw - 8, 6);
  ctx.fillStyle = "#5c3a22";
  for (let x = 16; x < rw - 20; x += 28) {
    ctx.fillStyle = "#8ec8e8";
    ctx.fillRect(ox + x, oy + 6, 12, 8);
    ctx.fillStyle = "#f4efe0";
    ctx.fillRect(ox + x + 5, oy + 6, 1, 8);
    ctx.fillRect(ox + x, oy + 9, 12, 1);
  }
  ctx.fillStyle = "#5a3a24";
  ctx.fillRect(ox, oy + 22, 8, rh - 22);
  ctx.fillRect(ox + rw - 8, oy + 22, 8, rh - 22);
  for (let y = 0; y < rh - 8; y += 4) {
    ctx.fillStyle = (y / 4) % 2 ? "#c49662" : "#b88858";
    ctx.fillRect(ox + 8, oy + 28 + y, rw - 16, 4);
    ctx.fillStyle = "#8a6844";
    ctx.fillRect(ox + 8, oy + 31 + y, rw - 16, 1);
  }
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
  ctx.restore();
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
  drawText(ctx, "mana ∞", 8, 24, "#9ad0ff", 1);
  drawText(ctx, p.gold + "g", 62, 8, "#ffe08a", 1);
  const lv = spellLevel(p.spells[p.spell].xp);
  drawText(ctx, p.spell + " " + lv, 8, 34, "#f4f0e4", 1);
  if (p.fly) drawText(ctx, "fly " + flyLevel(p.flyXp), 8, 44, "#d5ecff", 1);
  if (state.mode === "world") {
    let here = null, bd = 40 * TILE;
    for (const plan of state.plans) {
      const d = Math.hypot(p.x - plan.town.x * TILE, p.y - plan.town.y * TILE);
      if (d < bd) { bd = d; here = plan.town; }
    }
    if (here) drawText(ctx, here.name, 8, 52, "#fff6d8", 1);
  }
  if (state.mode === "dungeon" && state.dun) {
    const dun = state.dun;
    const floors = dun.def.id === "cave" ? 1 : 3;
    drawText(ctx, dun.def.name, 8, 48, "#f4f8ff", 1);
    drawText(ctx, "Floor " + (dun.level + 1) + "/" + floors, 8, 58, "#d5e4f4", 1);
    const boss = (state.dunFoes || []).find(f => f.boss && f.hp > 0);
    if (boss) {
      const bw = 140;
      const bx = (view.w - bw) / 2, by = 8;
      ctx.fillStyle = "#1a120e";
      ctx.fillRect(bx - 2, by - 2, bw + 4, 16);
      ctx.fillStyle = "#4a2828";
      ctx.fillRect(bx, by + 8, bw, 5);
      ctx.fillStyle = boss.weak === "fire" ? "#e07030" : boss.weak === "air" ? "#9ad8c8" : "#d8d0ff";
      ctx.fillRect(bx, by + 8, bw * Math.max(0, boss.hp / boss.max), 5);
      drawText(ctx, boss.name, bx, by - 1, "#fff6d8", 1);
    }
  }
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
const GROUND_COL = { ocean: "#164e9c", stream: "#2f74c4", dirt: "#c4a06a", bridge: "#8a5a32", sand: "#e6c888", snow: "#dceaf2", mud: "#5a4038", marsh: "#6a6840", forest: "#2c6a30", moss: "#6a7a48", cliff: "#6a645c", pier: "#8a6844", grass: "#3e8a38", stair: "#b8a078", cave: "#241c18" };
function ensureMap() {
  if (mapCanvas) return mapCanvas;
  const w = 340, h = 262;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const kids = new Uint8Array(w * h);
  const idOf = {};
  worldPlan().forEach((p, i) => { idOf[p.town.kingdom] = (i % 12) + 1; });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const tx = (x / w) * WW, ty = (y / h) * WH;
    const s = sample(tx | 0, ty | 0);
    let col = GROUND_COL[s.ground] || "#3e8a38";
    const k = s.kingdom && kingdom(s.kingdom);
    if (k && s.ground !== "ocean" && s.ground !== "stream") col = mix(col, k.color, s.ground === "snow" || s.ground === "sand" ? 0.12 : 0.2);
    kids[y * w + x] = s.kingdom ? (idOf[s.kingdom] || 1) : 0;
    g.fillStyle = col;
    g.fillRect(x, y, 1, 1);
  }
  const img = g.getImageData(0, 0, w, h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const id = kids[y * w + x];
    if (!id) continue;
    if (kids[y * w + x + 1] !== id || kids[(y + 1) * w + x] !== id) {
      const o = (y * w + x) * 4;
      img.data[o] = 20; img.data[o + 1] = 16; img.data[o + 2] = 12;
    }
  }
  g.putImageData(img, 0, 0);
  const plot = (x1, y1, x2, y2, color, mode) => {
    const steps = Math.max(8, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 8));
    g.fillStyle = color;
    for (let s = 0; s <= steps; s++) {
      const tx = x1 + (x2 - x1) * s / steps;
      const ty = y1 + (y2 - y1) * s / steps;
      const land = isLand(tx | 0, ty | 0);
      if (mode === "land" && !land) continue;
      if (mode === "sea" && land) continue;
      const px = (tx / WW) * w | 0, py = (ty / WH) * h | 0;
      g.fillRect(px, py, mode === "sea" ? 2 : 2, mode === "land" ? 2 : 1);
    }
  };
  for (const line of RIVERS) for (let i = 1; i < line.length; i++) plot(line[i - 1][0], line[i - 1][1], line[i][0], line[i][1], "#9fd8ff", "land");
  for (const seg of roadSegments()) plot(seg.x1, seg.y1, seg.x2, seg.y2, "#f0d8a8", "land");
  const spines = [[1680, 1460, 4200, 1500], [4300, 780, 6400, 860], [5600, 2480, 7200, 2600]];
  for (const s of spines) plot(s[0], s[1], s[2], s[3], "#d8d4c8", "land");
  const ports = TOWNS.filter(t => t.harbor);
  for (let i = 0; i < ports.length; i++) {
    let best = null, bd = 1e9;
    for (let j = 0; j < ports.length; j++) {
      if (i === j) continue;
      const d = Math.hypot(ports[j].x - ports[i].x, ports[j].y - ports[i].y);
      if (d < bd) { bd = d; best = ports[j]; }
    }
    if (best && bd < 3200) plot(ports[i].x, ports[i].y, best.x, best.y, "#d7f4ff", "sea");
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
    const k = kingdom((state.owner && state.owner[plan.town.id]) || plan.town.kingdom);
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
  drawText(ctx, "Legend", x, y + map.height + 8, "#f4f8ff", 1);
  KINGDOMS.forEach((k, i) => drawText(ctx, k.name, x + (i > 8 ? 150 : 0), y + map.height + 20 + (i % 9) * 9, k.color, 1));
  void pad;
}

export function warmMap() { ensureMap(); }
export function mapReady() { return !!mapCanvas; }
