import { renderHud } from "./hud";
import { glowcap, hydroGlowcap, hydroLumina, hydroSweetroot, sweetroot } from "./hud-grow";
import { cargo, ferrite, mining, salvaging, wiring } from "./hud-scenes";

type SceneSvg = (frame: number) => string;

/** The HUD scene for each task that has one. Tasks not listed here still use the older art. */
export const HUD_SCENES: Record<string, SceneSvg> = {
  salvage_hull: (frame) => renderHud(salvaging, frame, 11),
  salvage_wiring: (frame) => renderHud(wiring, frame, 13),
  salvage_cargo: (frame) => renderHud(cargo, frame, 17),
  mine_ferrite: (frame) => renderHud(ferrite, frame, 19),
  mine_lumina: (frame) => renderHud(mining, frame, 23),
};

/** Drawn but not shown in the game yet, for review. Moves into HUD_SCENES once approved. */
export const PREVIEW_SCENES: Record<string, SceneSvg> = {
  forage_glowcap: (frame) => renderHud(glowcap, frame, 29),
  forage_sweetroot: (frame) => renderHud(sweetroot, frame, 31),
  hydro_glowcap_bed: (frame) => renderHud(hydroGlowcap, frame, 37),
  hydro_sweetroot_bed: (frame) => renderHud(hydroSweetroot, frame, 41),
  hydro_lumina_bloom: (frame) => renderHud(hydroLumina, frame, 43),
};
