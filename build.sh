#!/bin/sh
cd "$(dirname "$0")"
{ echo "(function(){"; cat src/a_setup.js src/b_old.js src/b2_spawn.js src/c_world.js src/c2_layout.js src/d_ents.js src/e_sim.js src/f_main.js src/g_loop.js src/h_magic.js src/i_audio.js src/j_anim.js src/k_wood.js src/l_parts.js src/m_guild.js src/n_interior.js src/o_chibi.js src/o2_sfc.js src/p_foes.js src/q_adv.js src/r_style.js src/s_walls.js src/t_monsters.js src/u_quests.js src/v_pixel.js src/v2_regions.js src/w_clash.js src/x_nomtn.js src/y_feel.js src/yc_spells.js src/yd_jobs.js src/yf_life.js src/yg_guildhall.js src/yb_walk.js src/ya_homes.js src/yy_scroll.js src/yk_menu.js src/yl_royal.js src/yn_flirt.js src/yo_night.js src/yh_bag.js src/yz_hud.js src/yi_hunger.js src/yj_portrait.js src/z_boot.js; echo "})();"; } > game.js
cp src/shell.html index.html
V=$(date +%s); sed "s/__V__/$V/" src/sw.js > sw.js
