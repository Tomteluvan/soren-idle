import { GameState } from "../types";

export interface PerkDef {
  id: string;
  name: string;
  /** What one level gives. */
  description: string;
  maxLevel: number;
  /** Starlight the first level costs. Each level costs this much more than the one before. */
  cost: number;
}

/** What Starlight buys. Each perk is bought in levels and survives every launch. */
export const PERKS: PerkDef[] = [
  { id: "xp", name: "Veteran Instincts", description: "+3% XP in every skill.", maxLevel: 10, cost: 5 },
  { id: "speed", name: "Quick Hands", description: "Tasks take 2% less time.", maxLevel: 10, cost: 5 },
  {
    id: "keep",
    name: "Muscle Memory",
    description: "Keep 10% of every task's mastery and each skill's mastery pool after a launch.",
    maxLevel: 5,
    cost: 10,
  },
  { id: "fund", name: "Salvage Fund", description: "Start each run with 1,000 more Credits.", maxLevel: 10, cost: 2 },
];

export const PERK_BY_ID: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]));

/** Each launch makes every creature this much stronger, and every haul this much bigger. */
export const RIFT_STEP = 0.1;
export const RIFT_YIELD = 0.05;

export const perkLevel = (s: GameState, id: string) => s.perks[id] ?? 0;

/** Starlight the next level of a perk costs. */
export const perkCost = (s: GameState, perk: PerkDef) => perk.cost * (perkLevel(s, perk.id) + 1);

export const xpBonus = (s: GameState) => 1 + 0.03 * perkLevel(s, "xp");
export const speedBonus = (s: GameState) => 1 - 0.02 * perkLevel(s, "speed");

/** How much stronger the creatures are on this run. */
export const riftScale = (s: GameState) => 1 + RIFT_STEP * s.launches;
