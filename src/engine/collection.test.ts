import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, checkAchievements, loggedItems, rollPet } from "./collection";
import { PET_CHANCE, TASK_BY_ID } from "./data";
import { advance, newGame, startTask } from "./engine";
import { importSave, exportSave } from "./migrate";
import { launch } from "./prestige";
import { emptyReport } from "./report";
import { GameState } from "./types";

describe("achievements", () => {
  it("pay their reward once, when earned", () => {
    const s: GameState = newGame(0);
    s.stats.kills = 1;
    const report = emptyReport();
    checkAchievements(s, report);
    expect(s.achievements).toEqual(["first_blood"]);
    expect(s.credits).toBe(100);
    expect(report.notices).toEqual(["Achievement: First Blood (+100 cr)"]);
    checkAchievements(s, emptyReport());
    expect(s.credits).toBe(100);
  });

  it("are earned while time passes", () => {
    const s = { ...startTask({ ...newGame(0), buildings: { storage: 5 } }, "mine_ferrite").state };
    const { state, report } = advance(s, 3_600_000);
    expect(state.achievements).toContain("apprentice");
    expect(report.notices.join("\n")).toMatch(/Achievement: Apprentice/);
  });

  it("have unique ids", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe("pets", () => {
  it("come rarely, once per skill, and give XP", () => {
    let found = 0;
    for (let cycles = 0; cycles < 200_000; cycles++) {
      const s = { ...newGame(12345), stats: { ...newGame(0).stats, cycles } };
      rollPet(s, "mining", emptyReport());
      found += s.pets.length;
    }
    expect(found / 200_000).toBeGreaterThan(PET_CHANCE / 2);
    expect(found / 200_000).toBeLessThan(PET_CHANCE * 2);

    const s = { ...newGame(0), pets: ["salvaging" as const] };
    const again = emptyReport();
    rollPet(s, "salvaging", again);
    expect(s.pets).toEqual(["salvaging"]);
    const xp = (g: GameState) => advance(startTask(g, TASK_BY_ID.salvage_hull.id).state, 60_000).state.xp.salvaging;
    expect(xp(s)).toBeGreaterThan(xp(newGame(0)));
  });

  it("do not disturb the game's random stream", () => {
    const s = newGame(0);
    const before = s.rng;
    rollPet(s, "mining", emptyReport());
    expect(s.rng).toBe(before);
  });
});

describe("collection log", () => {
  it("lists what was made or is held", () => {
    const s: GameState = { ...newGame(0), inventory: { ration: 1 } };
    s.stats.produced.scrap_metal = 3;
    expect(loggedItems(s).sort()).toEqual(["ration", "scrap_metal"]);
  });

  it("keeps achievements through a launch but not pets, and both through a save", () => {
    const s: GameState = { ...newGame(0), buildings: { rescue_ship: 1 }, achievements: ["boss"], pets: ["mining"] };
    const { state } = launch(s);
    expect(state.achievements).toEqual(["boss"]);
    expect(state.pets).toEqual([]);
    expect(importSave(exportSave(s)).state?.pets).toEqual(["mining"]);
  });
});
