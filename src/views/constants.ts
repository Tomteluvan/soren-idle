import { Icon } from "@raycast/api";
import { SkillId } from "../engine/types";

export const EAT_LEVELS: [number, string][] = [
  [0, "Only When Needed"],
  [0.25, "Below 25% HP"],
  [0.5, "Below 50% HP"],
  [0.75, "Below 75% HP"],
];

export const RUN_CHOICES = [1, 5, 10, 25, 100];

export const SKILL_ICON: Record<SkillId, Icon> = {
  salvaging: Icon.Hammer,
  mining: Icon.Mountain,
  foraging: Icon.Leaf,
  cooking: Icon.MugSteam,
  engineering: Icon.Gear,
  combat: Icon.Shield,
  hydroponics: Icon.Raindrop,
  xenochemistry: Icon.Pill,
};

export type View =
  | "overview"
  | SkillId
  | "base"
  | "bounties"
  | "shop"
  | "equipment"
  | "trade"
  | "inventory"
  | "stats";
