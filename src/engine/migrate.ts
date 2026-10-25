import { newGame } from "./engine";
import { GameState } from "./types";

/** Brings a save written by an older build up to the current shape. */
export function migrateSave(saved: Partial<GameState>): GameState {
  const base = newGame(saved.lastTick ?? Date.now());
  const state: GameState = { ...base, ...saved, xp: { ...base.xp, ...saved.xp } } as GameState;
  // The beacon used to mean "rescued". Treat an existing one as contact already made.
  if ((state.buildings.beacon ?? 0) > 0 && saved.contactAt === undefined)
    state.contactAt = state.lastTick;
  return state;
}
