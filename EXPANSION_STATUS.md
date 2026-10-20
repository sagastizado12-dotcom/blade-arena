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
## Phase 3 (v49) Wars, fronts, rebellions — TODO
Spec: 8 countries; max 3 countries at war; max 4 active conflicts total (wars + rebellions + sieges of Moderno), new conflicts queue; treaties/truces/alliances; conquest changes town owner/flag/guards, borders shift on map; forts/battle zones/sieges; rebellions driven by tax/unrest/war losses/bad ruler (incl. hero realms); crown marches troops, simulated outcome over days, either side wins (crown: unrest down + penalty; rebels: free city or join another country); hero can crush/negotiate/support/join either side; ruler menu shows unrest per town; war alerts with teleport. Tests for caps.
## Phase 4 (v50) Estate — TODO
## Phase 5 (v51) Legendary hunts + bestiary — TODO
## Phase 6 (v52) Spell combos (>=6) — TODO
## Phase 7 (v53) Seasons & life (frozen rivers, festivals, fishing, cooking, farm plot, pet breeding, bards) — TODO

