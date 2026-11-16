import { warmBootArt } from "./art.js";
import { render, prewarm, warmMap } from "./draw.js";
import { drawText, wrapText } from "./font.js";
import { CAVE } from "./terrain.js";
import { teleportTo, buyHouse, startWar, strikeWar, buyCargo, escortWagon, legendLines, enterDungeon, nearWagon, DUNGEONS, stepDungeonStairs, leaveDungeon, romance as romanceNpc } from "./realm.js";
import {
  createState, update, saveData, loadData, SAVE_KEY, talkTo, advanceDlg, pickChoice,
  nearNpc, nearestDoor, enterBuilding, leaveRoom, enterCave, useFurn, swing, castSpell,
  toggleFly, choicesFor, chestStore, chestTake, setSpellLevel, setFlyLevel, SPELLS, hourOf
} from "./sim.js";

const t0 = performance.now();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const fadeEl = document.getElementById("fade");
const dlgEl = document.getElementById("dlg");
const whoEl = document.getElementById("who");
const dlgC = document.getElementById("dlgC");
const choiceEl = document.getElementById("choices");

const keys = {};
const input = { x: 0, y: 0, jump: false, dash: false };
let stick = null;
const state = createState();
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) loadData(state, JSON.parse(raw));
} catch (e) { /* a bad save never blocks a new journey */ }

warmBootArt();
prewarm(state.player.x, state.player.y);

let scale = 2;
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  scale = 1;
  dlgC.width = Math.max(200, window.innerWidth - 48);
}
resize();
window.addEventListener("resize", resize);

const perf = { n: 0, acc: 0, max: 0 };
function frame(ms) {
  perf.n++; perf.acc += ms; if (ms > perf.max) perf.max = ms;
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = performance.now();
  readStick();
  update(state, dt, input);
  input.jump = false;
  if (!keys["shift"]) input.dash = false;
  render(ctx, { w: canvas.width, h: canvas.height, scale }, state, scale);
  paintDlg();
  frame(performance.now() - t);
  requestAnimationFrame(loop);
}

function fade(fn) {
  fadeEl.classList.add("on");
  setTimeout(() => { fn(); fadeEl.classList.remove("on"); }, 180);
}

function interact() {
  if (state.map) { state.map = false; return; }
  if (state.dlg && state.dlg.choices) return;
  if (state.dlg) { advanceDlg(state); return; }
  if (state.mode === "dungeon") {
    if (stepDungeonStairs(state, -1)) return;
    const id = state.dun && state.dun.def.id;
    if (id && state.duns[id] && state.duns[id].boss) leaveDungeon(state);
    return;
  }
  if (state.mode === "room") {
    const n = nearNpc(state);
    if (n) { talkTo(state, n); return; }
    if (useFurn(state)) return;
    if (state.player.y > (state.room.h - 2) * 16) leaveRoom(state);
    return;
  }
  const door = nearestDoor(state);
  if (door && Math.hypot(state.player.x - (door.doorX * 16 + 8), state.player.y - ((door.doorY + 1) * 16 + 8)) < 16) {
    fade(() => enterBuilding(state, door));
    return;
  }
  const n = nearNpc(state);
  if (n) { talkTo(state, n); return; }
  if (door) { fade(() => enterBuilding(state, door)); return; }
  const tx = state.player.x / 16 | 0, ty = state.player.y / 16 | 0;
  if (Math.abs(tx - CAVE.x) + Math.abs(ty - CAVE.y) <= 1) fade(() => enterCave(state));
}

function cycleSpell() {
  const i = SPELLS.indexOf(state.player.spell);
  state.player.spell = SPELLS[(i + 1) % SPELLS.length];
}

function act(name) {
  if (name === "swing") swing(state);
  else if (name === "cast") castSpell(state);
  else if (name === "jump") input.jump = true;
  else if (name === "dash") input.dash = true;
  else if (name === "fly") toggleFly(state);
  else if (name === "talk") interact();
  else if (name === "map") state.map = !state.map;
  else if (name === "cycle") cycleSpell();
}

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) e.preventDefault();
  const k = e.key.toLowerCase();
  if (k === "j" || k === " ") act("swing");
  else if (k === "q") act("cast");
  else if (k === "k") act("jump");
  else if (k === "shift") act("dash");
  else if (k === "f") act("fly");
  else if (k === "e" || k === "enter") act("talk");
  else if (k === "m") act("map");
  else if (k === "r") act("cycle");
});
window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === "Shift") input.dash = false;
});

function axes() {
  let x = 0, y = 0;
  if (keys["arrowleft"] || keys["a"]) x -= 1;
  if (keys["arrowright"] || keys["d"]) x += 1;
  if (keys["arrowup"] || keys["w"]) y -= 1;
  if (keys["arrowdown"] || keys["s"]) y += 1;
  if (stick) { x += stick.x; y += stick.y; }
  input.x = x; input.y = y;
  if (keys["shift"]) input.dash = true;
}

const stickEl = document.getElementById("stick");
const knob = document.getElementById("knob");
function setKnob(px, py) {
  const r = stickEl.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = px - cx, dy = py - cy;
  const m = Math.hypot(dx, dy) || 1;
  const lim = 36;
  const k = Math.min(lim, m);
  dx = dx / m * k; dy = dy / m * k;
  knob.style.left = (40 + dx) + "px";
  knob.style.top = (40 + dy) + "px";
  stick = { x: dx / lim, y: dy / lim };
}
function readStick() { axes(); }
stickEl.addEventListener("pointerdown", e => { stickEl.setPointerCapture(e.pointerId); setKnob(e.clientX, e.clientY); });
stickEl.addEventListener("pointermove", e => { if (stick) setKnob(e.clientX, e.clientY); });
function endStick() { stick = null; knob.style.left = "40px"; knob.style.top = "40px"; }
stickEl.addEventListener("pointerup", endStick);
stickEl.addEventListener("pointercancel", endStick);

document.querySelectorAll("[data-act]").forEach(b => {
  b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); act(b.dataset.act); });
});
document.getElementById("mapBtn").addEventListener("pointerdown", e => { e.preventDefault(); act("map"); });
document.getElementById("bookBtn").addEventListener("pointerdown", e => {
  e.preventDefault();
  const el = document.getElementById("book");
  el.classList.toggle("show");
  if (!el.classList.contains("show")) return;
  el.innerHTML = "";
  const add = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.addEventListener("pointerdown", ev => { ev.preventDefault(); fn(); }); el.appendChild(b); };
  add("Legend", () => { state.dlg = { npc: -1, name: "Legend", pages: legendLines(state), page: 0, choices: false }; });
  add("Call the banners", () => startWar(state));
  add("Buy this house", () => buyHouse(state));
  add("Buy wagon goods", () => buyCargo(state));
  add("Escort the wagon", () => escortWagon(state));
  for (const p of state.plans) add("To " + p.town.name, () => { teleportTo(state, p.town.id); el.classList.remove("show"); });
  for (const d of DUNGEONS) add(d.name, () => { enterDungeon(state, d.id); el.classList.remove("show"); });
});
canvas.addEventListener("pointerdown", e => {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  if (!state.map && x < 90 && y > 30 && y < 50) cycleSpell();
});

let dlgKey = "";
function paintDlg() {
  const d = state.dlg;
  if (!d) { dlgEl.classList.remove("show"); dlgKey = ""; return; }
  dlgEl.classList.add("show");
  whoEl.textContent = d.name;
  const g = dlgC.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, dlgC.width, dlgC.height);
  const text = d.pages[d.page] || "";
  const lines = wrapText(text, Math.max(12, (dlgC.width / 12) | 0));
  lines.slice(0, 4).forEach((ln, i) => drawText(g, ln, 2, 4 + i * 14, "#ffffff", 2));
  const key = d.page + ":" + (d.choices ? 1 : 0) + ":" + (d.chest ? 1 : 0) + ":" + text;
  if (key === dlgKey) return;
  dlgKey = key;
  choiceEl.innerHTML = "";
  if (!d.choices) return;
  const n = d.npc >= 0 ? state.npcs.find(q => q.id === d.npc) : null;
  const list = d.chest
    ? [{ id: "store-bread", label: "Store bread" }, { id: "take-bread", label: "Take bread" }, { id: "store-herb", label: "Store herb" }, { id: "take-herb", label: "Take herb" }, { id: "leave", label: "Close" }]
    : (n ? choicesFor(n) : [{ id: "leave", label: "Close" }]);
  for (const c of list) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.label;
    b.addEventListener("pointerdown", ev => {
      ev.preventDefault();
      if (c.id === "store-bread") chestStore(state, "bread");
      else if (c.id === "take-bread") chestTake(state, "bread");
      else if (c.id === "store-herb") chestStore(state, "herb");
      else if (c.id === "take-herb") chestTake(state, "herb");
      else pickChoice(state, c.id);
      dlgKey = "";
    });
    choiceEl.appendChild(b);
  }
}

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData(state))); } catch (e) {}
}
setInterval(persist, 15000);
window.addEventListener("pagehide", persist);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
}

window.__BA = {
  state,
  get player() { return state.player; },
  hour: () => hourOf(state),
  act, interact, cast: () => castSpell(state), swing: () => swing(state),
  fly: () => toggleFly(state),
  spellLevel: n => setSpellLevel(state, n),
  flyLevel: n => setFlyLevel(state, n),
  spell(id) { state.player.spell = id; },
  map(v) { state.map = v; },
  place(x, y) { state.player.x = x; state.player.y = y; state.player.fly = false; state.player.alt = 0; },
  enter(kind, town) {
    const plan = state.plans.find(p => p.town.id === (town || "aldmoor"));
    const b = plan.buildings.find(q => q.kind === (kind || "inn")) || plan.buildings.find(q => q.kind !== "castle" && q.kind !== "keep" && q.kind !== "manor") || plan.buildings[0];
    enterBuilding(state, b);
    return b && b.kind;
  },
  leave: () => leaveRoom(state),
  teleport: id => teleportTo(state, id),
  buy: () => buyHouse(state),
  war: () => startWar(state),
  strike: () => strikeWar(state),
  cargo: () => buyCargo(state),
  escort: () => escortWagon(state),
  romance() {
    const n = state.npcs.find(q => !q.child && q.age >= 18 && q.town !== "pandemora");
    if (!n) return false;
    n.mem.opinion = Math.max(60, n.mem.opinion || 0);
    return romanceNpc(state, n);
  },
  dun: id => enterDungeon(state, id),
  legend: () => legendLines(state),
  wagon: () => nearWagon(state),
  dungeons: DUNGEONS,
  save: persist,
  reload() { try { return loadData(state, JSON.parse(localStorage.getItem(SAVE_KEY))); } catch (e) { return false; } },
  spawn(kind, x, y) { state.monsters.push({ id: 9000 + state.monsters.length, kind, x, y, hp: kind === "boar" ? 8 : 4, max: 8, dir: 0, frame: 0, hit: 0, cool: 0, homeX: x, homeY: y }); },
};
window.__PERF = {
  boot: () => window.__BOOTMS,
  avg: () => perf.acc / Math.max(1, perf.n),
  max: () => perf.max,
  n: () => perf.n,
  reset() { perf.n = 0; perf.acc = 0; perf.max = 0; }
};
warmMap();
window.__BOOTMS = Math.round(performance.now() - t0);
window.__READY = true;
fadeEl.classList.add("on");
requestAnimationFrame(() => { fadeEl.classList.remove("on"); requestAnimationFrame(loop); });
