import {
  anvil,
  bench,
  camp,
  cargoPod,
  ferrite,
  glowcap,
  hullScrap,
  lumina,
  pot,
  skitter,
  stalker,
  sweetroot,
  wiring,
  wraith,
} from "./subjects";
import { INK, Pt, renderScene, TerminalScene, rect, stroke } from "./terminal";
import { hash } from "./util";

export interface Scene {
  frames: number;
  /** Frame shown when the task is not running. */
  poster: number;
  svg(frame: number): string;
}

/** A cutting torch: the beam runs from the nozzle to where it bites, with sparks flying off. */
function beam(strike: Pt, reach: number): (f: number) => string {
  return (f) => {
    const from: Pt = [strike[0] - reach + 6, strike[1] + 1];
    const to: Pt = [strike[0] - [0, 2, 1, 3][f], strike[1]];
    let sparks = "";
    for (let i = 0; i < 7; i++) {
      const a = (-110 + i * 24) * (Math.PI / 180);
      const d = 6 + hash(i, f, 51) * 16;
      sparks += rect(
        Number((to[0] + Math.cos(a) * d).toFixed(1)),
        Number((to[1] + Math.sin(a) * d).toFixed(1)),
        2,
        2,
        i % 2 ? INK.white : INK.glow,
      );
    }
    return [
      stroke(`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`, INK.glow, 6),
      stroke(`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`, INK.white, 2),
      sparks,
    ].join("");
  };
}

function salvage(title: string, subject: (f: number) => string, strike: Pt): TerminalScene {
  const reach = 40;
  return {
    title,
    status: "SALVAGING",
    subject,
    strike,
    tool: "torch",
    angles: [4, 4, 4, 4],
    effect: "none",
    reach,
    overlay: beam(strike, reach),
  };
}

function craft(
  title: string,
  status: string,
  subject: (f: number) => string,
  strike: Pt,
  kind: "hammer" | "ladle" = "hammer",
): TerminalScene {
  return {
    title,
    status,
    subject,
    strike,
    tool: kind,
    angles: kind === "ladle" ? [-6, -2, 4, -2] : [-9, -3, 6, 1],
    effect: kind === "ladle" ? "none" : "sparks",
    debris: INK.glow,
  };
}

function hunt(title: string, subject: (f: number) => string, strike: Pt): TerminalScene {
  return {
    title,
    status: "HUNTING",
    subject,
    strike,
    tool: "blade",
    angles: [-24, -8, 10, -2],
    effect: "slash",
  };
}

const SCENES: Record<string, TerminalScene> = {
  mine_ferrite: {
    title: "FERRITE",
    status: "MINING",
    subject: ferrite,
    strike: [166, 84],
    tool: "pick",
  },
  mine_lumina: {
    title: "LUMINA",
    status: "MINING",
    subject: lumina,
    strike: [180, 98],
    tool: "pick",
    debris: INK.glow,
  },
  salvage_hull: salvage("HULL SCRAP", hullScrap, [150, 104]),
  salvage_wiring: salvage("WIRING", wiring, [190, 108]),
  salvage_cargo: salvage("CARGO POD", cargoPod, [166, 100]),
  forage_glowcap: {
    title: "GLOWCAP",
    status: "FORAGING",
    subject: glowcap,
    strike: [204, 142],
    tool: "cutter",
    angles: [-5, -1, 6, 2],
    debris: INK.white,
  },
  forage_sweetroot: {
    title: "SWEETROOT",
    status: "FORAGING",
    subject: sweetroot,
    strike: [182, 142],
    tool: "spade",
    angles: [-5, -1, 6, 2],
    debris: INK.dim,
  },
  craft_ration: craft("RATION", "COOKING", pot, [212, 96], "ladle"),
  craft_honey_ration: craft("HONEY RATION", "COOKING", pot, [212, 96], "ladle"),
  craft_alloy: craft("ALLOY", "SMELTING", anvil, [214, 100]),
  craft_torch: craft("TORCH", "BUILDING", bench("torch"), [200, 118]),
  craft_harvest_kit: craft("HARVEST KIT", "BUILDING", bench("kit"), [200, 118]),
  craft_drill: craft("PLASMA DRILL", "BUILDING", bench("drill"), [200, 118]),
  craft_blade: craft("PULSE BLADE", "BUILDING", bench("blade"), [200, 118]),
  craft_armor: craft("COMP. ARMOR", "BUILDING", bench("armor"), [200, 118]),
  craft_skyweave: craft("SKYWEAVE SUIT", "BUILDING", bench("suit"), [200, 118]),
  fight_skitter: hunt("DUST SKITTER", skitter, [184, 112]),
  fight_stalker: hunt("CAVE STALKER", stalker, [160, 122]),
  fight_wraith: hunt("RIFT WRAITH", wraith, [204, 104]),
};

const IDLE: TerminalScene = { title: "CAMP", status: "IDLE", subject: camp };

function wrap(scene: TerminalScene, poster: number): Scene {
  return { frames: 4, poster, svg: (frame) => renderScene(scene, frame) };
}

export const sceneFor = (taskId: string | null | undefined): Scene =>
  taskId && SCENES[taskId] ? wrap(SCENES[taskId], 2) : wrap(IDLE, 0);

export const SCENE_IDS = [...Object.keys(SCENES)];
