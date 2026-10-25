import { ITEMS } from "./data";
import { count } from "./engine";
import { GameState, ItemId } from "./types";

/** Equipment keeps one copy: selling your only torch would silently slow you down. */
export function isGear(id: ItemId): boolean {
  const item = ITEMS[id];
  return !!(item.tool || item.weaponDamage || item.armor);
}

export function sellPrice(_s: GameState, id: ItemId): number {
  return Math.max(1, ITEMS[id].value);
}

export function sellableCount(s: GameState, id: ItemId): number {
  return Math.max(0, Math.floor(count(s, id)) - (isGear(id) ? 1 : 0));
}

export function sell(
  s: GameState,
  id: ItemId,
  qty: number | "all",
): { state: GameState; error?: string; credits?: number } {
  const available = sellableCount(s, id);
  const amount = qty === "all" ? available : Math.min(qty, available);
  if (amount < 1) return { state: s, error: isGear(id) && count(s, id) > 0 ? "Keeping your only one" : "Nothing to sell" };
  const credits = amount * sellPrice(s, id);
  const next = structuredClone(s);
  next.inventory[id] = count(s, id) - amount;
  next.credits += credits;
  return { state: next, credits };
}

export function spendCredits(s: GameState, amount: number): { state: GameState; error?: string } {
  if (s.credits < amount) return { state: s, error: "Not enough Credits" };
  return { state: { ...s, credits: s.credits - amount } };
}
