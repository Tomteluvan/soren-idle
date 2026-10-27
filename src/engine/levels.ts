import { MAX_LEVEL } from "./data";

export function xpForLevel(level: number): number {
  return level <= 1 ? 0 : Math.floor(30 * (level - 1) ** 2);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}
