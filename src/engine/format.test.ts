import { describe, expect, it } from "vitest";
import { ITEMS } from "./data";
import { describeItem, formatCredits, formatNumber, setCompactNumbers } from "./format";

describe("describeItem", () => {
  it("adds the Combat level from the item's data, so the text cannot drift from the rule", () => {
    expect(describeItem(ITEMS.arc_saber)).toMatch(/Needs Combat 34 to wield\.$/);
    expect(describeItem(ITEMS.ward_plate)).toMatch(/Needs Combat 43 to wear\.$/);
    expect(describeItem(ITEMS.ration)).toBe(ITEMS.ration.description);
  });

  it("is the only place a Combat level is written", () => {
    for (const item of Object.values(ITEMS)) expect(item.description).not.toMatch(/Needs Combat/);
  });
});

describe("formatNumber", () => {
  it("spells numbers out, or shortens them when compact", () => {
    expect(formatNumber(12_400)).toBe("12,400");
    expect(formatCredits(1_500_000)).toBe("1,500,000 cr");
    setCompactNumbers(true);
    try {
      expect(formatNumber(12_400)).toBe("12.4K");
      expect(formatCredits(1_500_000)).toBe("1.5M cr");
      expect(formatNumber(999)).toBe("999");
    } finally {
      setCompactNumbers(false);
    }
  });
});
