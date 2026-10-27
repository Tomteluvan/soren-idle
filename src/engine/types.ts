export type SkillId =
  "salvaging" | "mining" | "foraging" | "cooking" | "engineering" | "combat" | "hydroponics";

export type ItemId =
  | "scrap_metal"
  | "circuit_scrap"
  | "ferrite_ore"
  | "lumina_crystal"
  | "glowcap"
  | "sweetroot"
  | "ration"
  | "alloy_plate"
  | "cutting_torch"
  | "plasma_drill"
  | "harvest_kit"
  | "pulse_blade"
  | "composite_armor"
  | "chitin_shard"
  | "xeno_core"
  | "glyph_tablet"
  | "resonance_coil"
  | "void_lens"
  | "star_honey"
  | "skyweave_thread"
  | "aether_cell"
  | "honey_ration"
  | "skyweave_suit";

export type Bundle = Partial<Record<ItemId, number>>;

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  /** What one unit is worth in Credits at the base sell rate. */
  value: number;
  /** Heals this much HP when eaten. */
  heal?: number;
  /** Owning this item makes tasks of `skill` take `speed` times as long (best one wins). */
  tool?: { skill: SkillId; speed: number };
  /** Owning this item adds this much damage per combat round. */
  weaponDamage?: number;
  /** Owning this item reduces damage taken per round. */
  armor?: number;
}

export interface SkillDef {
  id: SkillId;
  name: string;
  blurb: string;
}

export interface Monster {
  name: string;
  hp: number;
  damage: number;
  drops: Bundle;
}

export interface TaskDef {
  id: string;
  skill: SkillId;
  name: string;
  description: string;
  levelReq: number;
  durationMs: number;
  xp: number;
  inputs?: Bundle;
  outputs?: Bundle;
  /** Stops after one cycle (one-off crafts such as gear). */
  once?: boolean;
  monster?: Monster;
}

export type BuildingId =
  | "shelter"
  | "generator"
  | "workshop"
  | "salvage_drone"
  | "mining_drone"
  | "forager_drone"
  | "beacon"
  | "translator"
  | "hub"
  | "hydroponic_bay";

export interface BuildingDef {
  id: BuildingId;
  name: string;
  description: string;
  maxLevel: number;
  /** Cost of level 1. Each further level multiplies it by `costGrowth`. */
  baseCost: Bundle;
  costGrowth: number;
  /** Explicit cost per level (index 0 is level 1). Overrides baseCost and costGrowth. */
  levelCosts?: Bundle[];
  /** One line per level describing what that level gives you. */
  levelNotes?: string[];
  requires?: { skill: SkillId; level: number };
  /** The locals must have answered the beacon first. */
  requiresContact?: boolean;
  requiresBuilding?: { id: BuildingId; level: number };
  /** Power the building adds / draws per level. */
  powerProvided?: number;
  powerUse?: number;
  /** Per level, produces one `item` every `everyMs` while powered. */
  produces?: { item: ItemId; everyMs: number };
}

export interface CropDef {
  id: string;
  name: string;
  description: string;
  levelReq: number;
  growMs: number;
  xp: number;
  /** Seed stock planted into an empty plot. */
  seeds: Bundle;
  /** Collected at harvest. */
  yield: Bundle;
}

export interface Plot {
  crop: string;
  plantedAt: number;
}

export type FoodPriority = "weakest" | "strongest";

export interface Settings {
  /** Eat when HP drops below this share of max HP. 0 means only when the next fight needs it. */
  eatBelow: number;
  foodPriority: FoodPriority;
}

export interface StockItem {
  item: ItemId;
  /** Price per unit in Credits before discounts. */
  price: number;
  /** Translation Device level needed before the locals offer it. */
  tier: number;
}

export interface GameState {
  version: number;
  createdAt: number;
  lastTick: number;
  activeTask: string | null;
  /** Milliseconds already spent on the current cycle. */
  taskProgressMs: number;
  /** Cycles left in the current run, or null to repeat until it cannot continue. */
  taskRemaining: number | null;
  hp: number;
  xp: Record<SkillId, number>;
  inventory: Bundle;
  /** Currency earned by trading with the locals. */
  credits: number;
  /** When the locals answer the beacon, or null while no beacon has been built. */
  contactAt: number | null;
  buildings: Partial<Record<BuildingId, number>>;
  /** Fractional output of passive buildings, carried between ticks. */
  passive: Partial<Record<BuildingId, number>>;
  /** Items to keep back when selling, per item. */
  keep: Partial<Record<ItemId, number>>;
  settings: Settings;
  /** One entry per hydroponic plot; null is an empty plot. */
  plots: (Plot | null)[];
  /** Ids of first-run hints the player has already seen. */
  hints: string[];
  /** Lifetime counters, mostly for flavour. */
  stats: {
    cycles: number;
    kills: number;
    deaths: number;
    /** Everything ever gained, by item. */
    produced: Bundle;
    creditsEarned: number;
  };
}

export interface Report {
  elapsedMs: number;
  cycles: number;
  items: Bundle;
  xp: Partial<Record<SkillId, number>>;
  levelUps: { skill: SkillId; level: number }[];
  /** Story beats that happened while time passed. */
  notices: string[];
  stoppedReason?: string;
  /** Set when a fixed run or one-off craft finished by itself. */
  completed?: string;
}
