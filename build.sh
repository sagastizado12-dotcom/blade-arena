#!/bin/sh
cd "$(dirname "$0")"
{ echo "(function(){"; cat src/a_setup.js src/b_old.js src/b2_spawn.js src/c_world.js src/d_ents.js src/e_sim.js src/f_main.js src/g_loop.js src/h_magic.js src/i_audio.js src/j_anim.js; echo "})();"; } > game.js
cp src/shell.html index.html
V=$(date +%s); sed "s/__V__/$V/" src/sw.js > sw.js
