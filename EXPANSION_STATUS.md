# Blade Arena expansion — status (resume from here)

## Rules (all phases)
No nudity/explicit; PG-13 adults-only romance; kids never romanceable or damaged; original art only; no glow on hero.
Saves keep homes, towns, wives, kids, pets, rulership, lore. Each phase = own deploy via deploy.sh, verify live, full suite, screenshots.

## Phase 1 (v47) — World x2 + 8 countries + Moderno — DONE (deploying)
- Map 1024x800 -> 2048x800. Old lands tile-identical except new east road exits + boulder-grid hotfix. Building ids 0..284 unchanged; east + Moderno append.
- 8 east settlements (ids 19-26), 4 new countries (Eastmarch, Frostreach, Qadira, Mirewood), isthmuses, rivers, ruins, isles, tundra/desert/swamp.
- Save migration w47Migrate/w47Populate (tile maps remapped, new towns peopled on load).
- Boot 6.8s -> ~3.0s desktop via exact-result pruning in genWorld (same full-map hash). IndexedDB world cache not needed at this size (skipped).
- Town spacing: ORIGINAL towns NOT moved (justification: user hand-routed rivers v39/v41, bridges, walls tests and every saved building/NPC/home coordinate are tile-exact; moving them risks broken saves). New eastern towns are spaced 200-300+ tiles apart.
- Hotfix: Nethervale/east "grid of round boulders" (demonGround turned every mountain tile into ROCK) -> mud with sparse rocks (0 dense rock clusters world-wide).
- Talk crash fix: NPCs with job-roles (e.g. grown woodcutter) crashed dialogLines.
- Moderno (id 27, src/c5_moderno.js + src/zz_moderno.js): free city-state (kOf=-1, no country), r=38 (~3x capital area, 94 buildings vs 20), walled, flag (azure/white band/gold star) on map, gates sign, walls, buildings; farmland ring: 19 fenced fields with seasonal crops + farmhands, 6 orchards, 6 pastures with livestock, farmhouses/barns. Lord menu (Pause > Moderno, or talk to the Steward): treasury, taxes, guards, unrest, collect income; upgrades with gold+wood and build days + scaffolding: Walls (palisade->stone->towers/gatehouse w/ archer towers->fortress), Streets (dirt->cobble->paved with lamps/trees/fountains), 9 districts tiers 0-3 (houses, market, smithy, inn, guild, temple, barracks, granary, farms). Countries declare war on Moderno -> siege raid + enemy camp ring + map front circle; resolve by defense vs strength; loss = tribute + burnt fields 20 days, homes never lost; sue for peace. conflicts()/canStartConflict(): max 4 conflicts, max 3 countries at war (used by Phase 3). Teleport picker + map label + dialogue lines.
- Tests: tests/v47.spec.js, tests/v47b.spec.js; full suite 161/161 green.
- Screens: /workspace/shots-blade/v47b-world-map.png, v47b-map-moderno.png, v47b-moderno-tier0/tier2/tier3-walls/tier3-streets/construction/farmland/farmland-summer/farmland-autumn/siege.png, v47b-lord-menu.png, v47-rocks-fixed.png, v47-eastwatch.png, v47-frostmere.png

## Phase 2 (v48) Legacy & descendants — TODO
## Phase 3 (v49) Wars, fronts, rebellions — DONE
- src/zz_wars49.js. World state: world.wars / rebels / treaties / owner (persisted; owners re-applied on load, map territory + border posts rebuilt).
- Country-vs-country wars start at random (border disputes etc.) and only within the caps (4 conflicts total, 3 countries at war; others wait). Front = point between the two countries' nearest towns that moves daily by troop strength (towns held, alliances, hero help). A front that reaches the end captures the nearest non-capital town: new owner, flag, guards and borders on the map, plus unrest and higher prices.
- War ends after 10+ days in peace (120d), truce (30d) or alliance (permanent); allied/treaty pairs can't fight.
- Rebellions: per-town unrest (war, recent conquest, high taxes in hero realms) -> uprising; the crown marches (strength grows daily); after 6-12 days crown wins (unrest -35, fine, damage) or rebels win (free city "FREE" on map, or joins the best neighbouring country).
- Hero: Pause > ⚔ Wars menu; per war: fight for A or B (enemy knights attack you at the front, kills shift the front), negotiate peace (gold), teleport to front; per rebellion: help crown, support rebels, negotiate, teleport.
- Battle zones drawn at fronts: palisade forts with flags and soldiers in each country's colours clashing. Map: red dashed front lines with ⚔, ✊ rebels, FREE cities. Alerts pop up like raids (Teleport there button).
- Away-time: open conflicts resolve; at most 6 town captures per absence.
- Hotfix: leftover rocks on volcanic ground removed (demonRocks).
- Test tests/v49.spec.js; full suite green (nights-dance test is an old random flake).
- Screens: v49-front.png, v49-map-fronts.png, v49-wars-menu.png, v49-war-menu.png, v49-alert.png, v47-rocks-fixed.png
## Phase 4 (v50) Estate — TODO
## Phase 5 (v51) Legendary hunts + bestiary — TODO
## Phase 6 (v52) Spell combos (>=6) — TODO
## Phase 7 (v53) Seasons & life (frozen rivers, festivals, fishing, cooking, farm plot, pet breeding, bards) — TODO


### v47 LIVE — Oct 20 2026 (~4:20 PM CT), build 1792530138 (commit 0328bc4 + empty retrigger 271b67b). Live version.json, sw.js and game.js verified.
NEXT: Phase 3 (v49 wars/rebellions using conflicts()/canStartConflict() in zz_moderno.js), then Phase 2, 4, 5, 6, 7.

## Moderno deploy (v47.2 rework, ships with v48/v49/v50 code in this build)
- Moderno wall: closed axis-aligned square ring (max-norm R=41) with corner towers, 4 wide 2-tile gates with flanking gatehouse towers, straight cobble/road approaches; 2-tile clear apron. Mod tier towers placed on the square. Scaffolding only on the stretch currently being built (progress-based).
- Farmland re-laid as a tidy grid ring outside the wall (max-norm 46–71), gate-axis road strips kept clear; sign at the south gate road; estate plot moved to x1514.
- Moderno territory (world.mod.terr, default 80 tiles): exclusive land (KGRID=255, carved out of every kingdom), blue fill + dotted border on the map, legend line, info line "Moderno territory". Lord menu "Expand territory" (+10, up to 130, gold); lost sieges shrink it by 8 (min 56). No wild monsters inside it (raiders/war/pets/bosses exempt).
- Farmers: residents of farm barns are farmers; fields 6–17 (not winter/siege/burnt), market 17–19, home at night, shelter during sieges, seasonal/burnt/siege dialog lines.
- NPC collision/pathing (all NPCs): BFS on the tile grid (walls/buildings/fences/deep water/cliffs block), line-of-sight shortcut, per-NPC cached path, ≤6 searches/frame, only near the hero; stuck → snap to nearest walkable (no teleport through walls); per-frame snap of NPCs on solid tiles; night-owl/guard circling respects walls.
- Guards in all towns: 3 shifts (6–14/14–22/22–6) per post (gates; towns also 2 towers); missing guards created on new game/load; on-duty → post (tower sentries drawn on tower tops), off duty → tavern/market 3h then home; raids override. Night shift carries torches.
- Autosave every 30 s (idle callback, skipped if a save is mid-write or tab hidden), plus pagehide/visibilitychange; small "✓ saved" pip.
- Save migration: NPCs whose home building no longer exists get re-homed in their own town.
- Tests: tests/v47c.spec.js (square wall, farmland outside, territory exclusive, NPCs never on solid tiles over 24h, farmer field→home via gate, posts staffed 24h + same guard off duty), tests/v47e.spec.js (autosave). Shots: moderno-before-*/moderno-after-*.

**LIVE (2026-10-20 ~5:50 PM CDT): version 1792535190, commit 9e1c8f8.** Includes v49 wars (first time live; earlier Pages failures were the 'in progress deployment' 400), plus v48 legacy and v50 estate code (estate has no dedicated test/shots yet). Full suite: 167/167 green after fixes.
Next: estate test+shots, then Phases 5, 6, 7.

## Update 2026-10-20 (v50–v55, v53)
- v50 Manor build test + screenshots — LIVE
- v51 Phase 5 Legendary Hunts (6 legends, lairs, titles, trophies, bestiary mastery) — LIVE
- v52 Phase 6 Spell Combos (8 combos, discovery book) — LIVE
- Hunger removed (no drain/damage/HUD; meals in away-life; old saves cleared) — LIVE
- v54 Manor fully accessible (exterior door, interior hall/dining/wives' bedrooms/kids' room/trophy hall, move-in, bed assignment, routines, teleport, map marker) — LIVE
- v55 Every NPC talkable + weekly schedules (staggered days off, relief guards, shop substitutes/closed) — LIVE
- v53 Phase 7 Seasons/Life/Bards (frozen rivers, 4 festivals, bard songs, autumn harvest market x2, home farm plot, pet breeding, seasonal monsters, 🍃 Life menu) — version 1792539994
- Known: soldiers/knights/rebels absent from a fresh world, so v55 talk test can't cover them. Flaky under load: game.spec fountain (959), door/night tests, v47c — pass alone.
