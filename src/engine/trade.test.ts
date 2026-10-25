import { describe, expect, it } from "vitest";
import { ITEMS } from "./data";
import { count, newGame } from "./engine";
import { sell, sellableCount, sellPrice, spendCredits } from "./trade";
import { GameState, ItemId } from "./types";

const withItems = (inventory: Partial<Record<ItemId, number>>): GameState => ({
  ...newGame(0),
  inventory,
});

describe("item values", () => {
  it("every item is worth something", () => {
    for (const item of Object.values(ITEMS)) expect(item.value).toBeGreaterThan(0);
  });
});

describe("selling", () => {
  it("pays the sell price per unit and removes the items", () => {
    const { state, credits } = sell(withItems({ scrap_metal: 10 }), "scrap_metal", 4);
    expect(credits).toBe(4 * sellPrice(state, "scrap_metal"));
    expect(state.credits).toBe(credits);
    expect(count(state, "scrap_metal")).toBe(6);
  });

  it("sells everything with 'all' and clamps oversized quantities", () => {
    expect(count(sell(withItems({ glowcap: 7 }), "glowcap", "all").state, "glowcap")).toBe(0);
    expect(count(sell(withItems({ glowcap: 7 }), "glowcap", 99).state, "glowcap")).toBe(0);
  });

  it("refuses when there is nothing to sell", () => {
    expect(sell(newGame(0), "scrap_metal", 1).error).toMatch(/Nothing/);
  });

  it("keeps one copy of equipment", () => {
    const s = withItems({ cutting_torch: 1, pulse_blade: 3 });
    expect(sellableCount(s, "cutting_torch")).toBe(0);
    expect(sell(s, "cutting_torch", 1).error).toMatch(/only one/);
    expect(sellableCount(s, "pulse_blade")).toBe(2);
  });

  it("does not mutate the original state", () => {
    const s = withItems({ scrap_metal: 5 });
    sell(s, "scrap_metal", 5);
    expect(count(s, "scrap_metal")).toBe(5);
    expect(s.credits).toBe(0);
  });
});

describe("spendCredits", () => {
  it("deducts or refuses", () => {
    const rich = { ...newGame(0), credits: 100 };
    expect(spendCredits(rich, 40).state.credits).toBe(60);
    expect(spendCredits(rich, 101).error).toMatch(/Not enough/);
  });
});
