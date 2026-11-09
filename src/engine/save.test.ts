import { describe, expect, it } from "vitest";
import { SAVE_VERSION } from "./data";
import { advance, newGame, startTask, xpForLevel } from "./engine";
import { dismissHint, HINTS, nextHint } from "./hints";
import { exportSave, importSave, migrateSave } from "./migrate";
import { GameState } from "./types";

describe("save versioning", () => {
  it("stamps new games and migrated saves with the current version", () => {
    expect(newGame(0).version).toBe(SAVE_VERSION);
    const old = { ...newGame(0), version: 1 } as Partial<GameState>;
    expect(migrateSave(old).version).toBe(SAVE_VERSION);
  });

  it("treats a save with no version as version 1", () => {
    const old = { ...newGame(0), buildings: { beacon: 1 } } as Partial<GameState>;
    delete old.version;
    delete old.contactAt;
    expect(migrateSave(old).contactAt).not.toBeNull();
  });

  it("does not replay hints a veteran save has already moved past", () => {
    const veteran = {
      ...newGame(0),
      version: 1,
      stats: { cycles: 500, kills: 0, retreats: 0 },
      xp: { ...newGame().xp, engineering: xpForLevel(31) },
    } as Partial<GameState>;
    delete veteran.hints;
    const migrated = migrateSave(veteran);
    expect(migrated.hints).toContain("welcome");
    expect(migrated.hints).toContain("beacon");
    expect(nextHint(migrated)).toBeUndefined();
  });

  it("does not touch a save already at the current version", () => {
    const s = { ...newGame(0), hints: [] };
    expect(migrateSave(s).hints).toEqual([]);
  });
});

describe("export and import", () => {
  it("round-trips a game", () => {
    const s = startTask(newGame(1000), "mine_ferrite").state;
    const { state } = advance(s, 1000 + 60_000);
    expect(importSave(exportSave(state)).state).toEqual(state);
  });

  it("rejects text that is not a save", () => {
    for (const text of ["", "hello", "[]", "null", '{"lastTick":1}']) {
      const result = importSave(text);
      expect(result.state).toBeUndefined();
      expect(result.error).toBeTruthy();
    }
  });

  it("rejects a save from a newer build", () => {
    const text = JSON.stringify({ ...newGame(0), version: SAVE_VERSION + 1 });
    expect(importSave(text).error).toMatch(/newer/);
  });

  it("migrates an old save on import and drops unknown tasks", () => {
    const old = { ...newGame(0), version: 1, activeTask: "removed_task" };
    delete (old as Partial<GameState>).credits;
    const { state } = importSave(JSON.stringify(old));
    expect(state?.credits).toBe(0);
    expect(state?.activeTask).toBeNull();
  });
});

describe("hints", () => {
  it("starts a new game on the welcome hint pointing at the first task", () => {
    const hint = nextHint(newGame(0));
    expect(hint?.id).toBe("welcome");
    expect(hint?.text).toMatch(/Hull Scrap/);
  });

  it("shows each hint once, in order", () => {
    let s = newGame(0);
    s = dismissHint(s, "welcome");
    expect(nextHint(s)).toBeUndefined();
    s = { ...s, stats: { ...s.stats, cycles: 1 } };
    expect(nextHint(s)?.id).toBe("first_cycle");
    s = dismissHint(s, "first_cycle");
    expect(nextHint(s)).toBeUndefined();
    expect(dismissHint(s, "first_cycle")).toBe(s);
  });

  it("walks a new player from salvage to mining to their first craft", () => {
    let s: GameState = { ...newGame(0), hints: ["welcome", "first_cycle"], inventory: { scrap_metal: 3 } };
    expect(nextHint(s)?.id).toBe("first_ore");
    s = { ...s, hints: [...s.hints, "first_ore"], inventory: { scrap_metal: 3, ferrite_ore: 1 } };
    expect(nextHint(s)?.id).toBe("first_craft");
  });

  it("has unique ids", () => {
    expect(new Set(HINTS.map((h) => h.id)).size).toBe(HINTS.length);
  });
});

describe("fabrication split", () => {
  it("gives an older save the Engineering level in Fabrication, so no gear is locked", () => {
    const old = {
      ...newGame(0),
      version: 3,
      xp: { ...newGame(0).xp, engineering: xpForLevel(40) },
    } as Partial<GameState>;
    delete (old.xp as Partial<GameState["xp"]>).fabrication;
    expect(migrateSave(old).xp.fabrication).toBe(xpForLevel(40));
  });
});
