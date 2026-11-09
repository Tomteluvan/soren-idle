import { describe, expect, it } from "vitest";
import { PERK_BY_ID, riftScale, SAVE_VERSION, TASK_BY_ID } from "./data";
import { advance, build, newGame, startTask, taskDurationMs, xpForLevel } from "./engine";
import { migrateSave } from "./migrate";
import { buyPerk, canLaunch, launch, starlightGain } from "./prestige";
import { GameState } from "./types";

const ready = (patch: Partial<GameState> = {}): GameState => ({
  ...newGame(0),
  buildings: { rescue_ship: 1 },
  ...patch,
});

describe("rescue ship", () => {
  it("is built in Base and needs a lot", () => {
    expect(build(newGame(0), "rescue_ship").error).toMatch(/Requires/);
    expect(canLaunch(newGame(0))).toBe(false);
    expect(canLaunch(ready())).toBe(true);
  });
});

describe("launch", () => {
  it("refuses without the ship", () => {
    expect(launch(newGame(0)).error).toMatch(/Rescue Ship/);
  });

  it("is a hard reset that keeps Starlight, perks, stats and settings", () => {
    const s = ready({
      credits: 5000,
      inventory: { scrap_metal: 50 },
      xp: { ...newGame(0).xp, mining: xpForLevel(30) },
      perks: { xp: 2 },
      starlight: 7,
      settings: { eatBelow: 0.5, foodPriority: "strongest" },
    });
    s.stats.kills = 12;
    const { state, gain } = launch(s);
    expect(gain).toBe(starlightGain(s));
    expect(state.starlight).toBe(7 + (gain ?? 0));
    expect(state.launches).toBe(1);
    expect(state.perks).toEqual({ xp: 2 });
    expect(state.settings.foodPriority).toBe("strongest");
    expect(state.stats.kills).toBe(12);
    expect(state.credits).toBe(0);
    expect(state.inventory).toEqual({});
    expect(state.buildings).toEqual({});
    expect(state.xp.mining).toBe(0);
  });

  it("keeps a share of mastery with Muscle Memory, and a start fund with Salvage Fund", () => {
    const s = ready({ perks: { keep: 2, fund: 3 }, mastery: { mine_ferrite: 1000 }, masteryPool: { mining: 400 } });
    const { state } = launch(s);
    expect(state.mastery.mine_ferrite).toBeCloseTo(200);
    expect(state.masteryPool.mining).toBeCloseTo(80);
    expect(state.credits).toBe(3000);
  });

  it("earns more Starlight for levels and bosses", () => {
    const low = starlightGain(newGame(0));
    const levelled = {
      ...newGame(0),
      xp: Object.fromEntries(Object.keys(newGame(0).xp).map((k) => [k, xpForLevel(99)])),
    };
    expect(starlightGain(levelled as GameState)).toBeGreaterThan(low + 50);
    const boss = newGame(0);
    boss.stats.hunts.fight_matriarch = 1;
    expect(starlightGain(boss)).toBe(low + 2);
  });
});

describe("perks", () => {
  it("are bought with Starlight, one level at a time", () => {
    const s = { ...newGame(0), starlight: 7 };
    expect(buyPerk(s, "nope").error).toBeDefined();
    const one = buyPerk(s, "xp").state;
    expect(one.perks.xp).toBe(1);
    expect(one.starlight).toBe(7 - PERK_BY_ID.xp.cost);
    expect(buyPerk(one, "xp").error).toMatch(/Needs/);
    expect(buyPerk({ ...one, starlight: 9999, perks: { xp: 10 } }, "xp").error).toMatch(/max/);
  });

  it("speed up tasks and add XP", () => {
    const task = TASK_BY_ID.salvage_hull;
    const plain = newGame(0);
    const perked = { ...newGame(0), perks: { speed: 5, xp: 5 } };
    expect(taskDurationMs(perked, task)).toBeLessThan(taskDurationMs(plain, task));
    const run = (s: GameState) => advance(startTask(s, task.id).state, 60_000).state.xp.salvaging as number;
    expect(run(perked)).toBeGreaterThan(run(plain));
  });
});

describe("harder runs", () => {
  it("make creatures stronger and hauls bigger", () => {
    expect(riftScale(newGame(0))).toBe(1);
    expect(riftScale({ ...newGame(0), launches: 3 })).toBeCloseTo(1.3);
  });
});

describe("older saves", () => {
  it("get the new fields", () => {
    const old = { ...newGame(0), version: 4 } as Partial<GameState>;
    delete old.perks;
    delete old.starlight;
    delete old.launches;
    const s = migrateSave(old);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.perks).toEqual({});
    expect(s.starlight).toBe(0);
    expect(s.launches).toBe(0);
  });
});
