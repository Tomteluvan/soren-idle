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
  | "skyweave_suit"
  | "veyari_lance"
  | "veyari_warplate"
  | "stim_pack"
  | "prism_geode"
  | "star_sapphire"
  | "nav_core"
  | "flight_recorder"
  | "golden_spore"
  | "amber_bulb"
  | "prospector_charm";

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
  /** Owning this item multiplies the chance of rare drops by this much. */
  rareBonus?: number;
  /** The locals do not buy this: it cannot be sold. */
  unsellable?: boolean;
}

/** One thing the Bounty Shop sells. */
export interface ShopEntry {
  item: ItemId;
  /** Price in Bounty Marks. */
  cost: number;
  /** Bounty level needed before you can buy it. */
  levelReq: number;
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

/** A chance, rolled every cycle, of finding something on top of the usual output. */
export interface RareDrop {
  item: ItemId;
  chance: number;
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
  rareDrops?: RareDrop[];
  /** A boss fight, see `areas`. */
  boss?: boolean;
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
  | "hydroponic_bay"
  | "bounty_board"
  | "storage"
  | "stasis_pod";

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
  /** Credits each level costs on top of the materials (index 0 is level 1). */
  levelCredits?: number[];
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

/** A request posted on the Bounty Board: defeat `count` of the creature hunted by `task`. */
export interface Bounty {
  id: number;
  /** The local who posted it. */
  poster: string;
  /** A line of flavour from the poster. */
  line: string;
  /** The hunt that counts: only kills made while this task runs add progress. */
  task: string;
  count: number;
  tier: number;
  marks: number;
  xp: number;
}

export interface BountyBoard {
  offers: Bounty[];
  active: { bounty: Bounty; progress: number } | null;
  /** When the unclaimed offers are replaced, or 0 while no board has been built. */
  refreshAt: number;
  nextId: number;
}

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
  /** State of the seeded random number generator; every roll in the game advances it. */
  rng: number;
  /** Currency earned by trading with the locals. */
  credits: number;
  /** Currency earned by finishing bounties. */
  marks: number;
  bountyXp: number;
  board: BountyBoard;
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
    bounties: number;
  };
}

export interface Report {
  elapsedMs: number;
  cycles: number;
  items: Bundle;
  /** The part of `items` that came from rare drops. */
  rare: Bundle;
  xp: Partial<Record<SkillId, number>>;
  levelUps: { skill: SkillId; level: number }[];
  /** Story beats that happened while time passed. */
  notices: string[];
  /** Bounties finished while time passed. */
  bounties: { poster: string; marks: number; level?: number }[];
  stoppedReason?: string;
  /** Set when a fixed run or one-off craft finished by itself. */
  completed?: string;
}
