import { describe, expect, it } from "vitest";
import { newGame } from "./engine";
import { notificationFor } from "./notifications";
import { emptyReport } from "./report";

const { settings } = newGame(0);

describe("notificationFor", () => {
  it("says nothing for a quiet report", () => {
    expect(notificationFor(emptyReport(), settings)).toBeUndefined();
  });

  it("picks the stop reason first, then a finished run, a bounty and a rare find", () => {
    const r = { ...emptyReport(), stoppedReason: "Storage full", completed: "Finished Hull Scrap" };
    expect(notificationFor(r, settings)).toBe("Storage full");
    expect(notificationFor({ ...r, stoppedReason: undefined }, settings)).toBe("Finished Hull Scrap");
    const bounty = { ...emptyReport(), bounties: [{ poster: "Vek", marks: 12, level: 0 }], rare: { nav_core: 1 } };
    expect(notificationFor(bounty, settings)).toBe("Bounty complete: +12 Marks");
    expect(notificationFor({ ...bounty, bounties: [] }, settings)).toBe("Rare find: 1× Intact Nav Core");
  });

  it("skips the types that are switched off and falls through to the next", () => {
    const r = { ...emptyReport(), stoppedReason: "Storage full", completed: "Finished Hull Scrap" };
    expect(notificationFor(r, { ...settings, notifyStopped: false })).toBe("Finished Hull Scrap");
    expect(notificationFor(r, { ...settings, notifyStopped: false, notifyFinished: false })).toBeUndefined();
  });
});
