import { LocalStorage } from "@raycast/api";
import { advance, newGame } from "./engine";
import { migrateSave } from "./migrate";
import { GameState, Report } from "./types";

const KEY = "braven-idle-save";

export async function loadState(): Promise<GameState> {
  const raw = await LocalStorage.getItem<string>(KEY);
  if (!raw) return newGame();
  try {
    return migrateSave(JSON.parse(raw) as Partial<GameState>);
  } catch {
    return newGame();
  }
}

export const saveState = (s: GameState) => LocalStorage.setItem(KEY, JSON.stringify(s));

export const resetState = () => LocalStorage.removeItem(KEY);

/**
 * Load, catch up to the present, apply `change`, save. Every command goes through
 * this so the menu bar ticker and the play view never overwrite each other's progress.
 */
export async function update(
  change: (s: GameState) => GameState = (s) => s,
): Promise<{ state: GameState; report: Report }> {
  const { state, report } = advance(await loadState(), Date.now());
  const next = change(state);
  await saveState(next);
  return { state: next, report };
}
