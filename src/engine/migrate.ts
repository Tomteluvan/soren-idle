import { SAVE_VERSION, TASK_BY_ID } from "./data";
import { newGame } from "./engine";
import { HINTS } from "./hints";
import { GameState } from "./types";

/** Each step upgrades a save that is at version `key` to `key + 1`. */
const STEPS: Record<number, (s: GameState) => void> = {
  // v1 -> v2: the beacon used to mean "rescued"; an existing one now counts as contact made.
  // Hints arrived too, so skip the ones this save has clearly moved past.
  1: (s) => {
    if ((s.buildings.beacon ?? 0) > 0 && s.contactAt === null) s.contactAt = s.lastTick;
    s.hints = HINTS.filter((h) => h.id !== "low_hp" && h.when(s)).map((h) => h.id);
  },
};

/** Brings a save written by an older build up to the current shape. */
export function migrateSave(saved: Partial<GameState>): GameState {
  const base = newGame(saved.lastTick ?? Date.now());
  const state: GameState = {
    ...base,
    ...saved,
    xp: { ...base.xp, ...saved.xp },
    stats: { ...base.stats, ...saved.stats },
  };
  for (let v = saved.version ?? 1; v < SAVE_VERSION; v++) STEPS[v]?.(state);
  state.version = SAVE_VERSION;
  return state;
}

export const exportSave = (s: GameState) => JSON.stringify(s);

/** Parses save text from the clipboard. Never throws; failures come back as an error message. */
export function importSave(text: string): { state?: GameState; error?: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { error: "The clipboard does not contain a save" };
  }
  const o = raw as Partial<GameState> | null;
  const isObject = (v: unknown) => typeof v === "object" && v !== null && !Array.isArray(v);
  if (
    !isObject(o) ||
    !isObject(o?.xp) ||
    !isObject(o?.inventory) ||
    typeof o?.lastTick !== "number"
  )
    return { error: "The clipboard does not contain a save" };
  if ((o.version ?? 1) > SAVE_VERSION)
    return { error: "This save is from a newer version of Braven Idle" };
  const state = migrateSave(o);
  if (state.activeTask && !TASK_BY_ID[state.activeTask]) state.activeTask = null;
  return { state };
}
