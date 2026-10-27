import {
  BuildingDef,
  BuildingId,
  CropDef,
  ItemDef,
  ItemId,
  ShopEntry,
  SkillDef,
  SkillId,
  StockItem,
  TaskDef,
} from "./types";

export const SKILLS: SkillDef[] = [
  {
    id: "salvaging",
    name: "Salvaging",
    blurb: "Pick the wreck of your ship apart for metal and electronics.",
  },
  { id: "mining", name: "Mining", blurb: "Crack open the alien rock for ore and crystals." },
  {
    id: "foraging",
    name: "Foraging",
    blurb: "Find out which local plants are food and which are lethal.",
  },
  {
    id: "cooking",
    name: "Cooking",
    blurb: "Turn whatever you foraged into something you can keep down.",
  },
  {
    id: "engineering",
    name: "Engineering",
    blurb: "Turn raw materials into tools and gear.",
  },
  {
    id: "combat",
    name: "Combat",
    blurb: "The wildlife disagrees with your presence. Disagree back.",
  },
  {
    id: "hydroponics",
    name: "Hydroponics",
    blurb: "Plant, wait, harvest. The crops grow whether or not you are watching.",
  },
];

export const ITEMS: Record<ItemId, ItemDef> = {
  scrap_metal: {
    id: "scrap_metal",
    name: "Scrap Metal",
    description: "Twisted hull plating. Mostly still metal.",
    value: 2,
  },
  circuit_scrap: {
    id: "circuit_scrap",
    name: "Circuit Scrap",
    description: "Fried boards with a few good components left.",
    value: 5,
  },
  ferrite_ore: {
    id: "ferrite_ore",
    name: "Ferrite Ore",
    description: "Dense, dark ore. Magnetic enough to annoy your compass.",
    value: 3,
  },
  lumina_crystal: {
    id: "lumina_crystal",
    name: "Lumina Crystal",
    description: "Glows faintly. Hums when you hold it.",
    value: 25,
  },
  glowcap: {
    id: "glowcap",
    name: "Glowcap",
    description: "Bioluminescent fungus. Your scanner says it is probably edible.",
    value: 2,
  },
  sweetroot: {
    id: "sweetroot",
    name: "Sweetroot",
    description: "A starchy tuber. Tastes like regret and sugar.",
    value: 4,
  },
  ration: {
    id: "ration",
    name: "Glowcap Ration",
    description: "Cooked, pressed and vaguely palatable.",
    value: 10,
    heal: 15,
  },
  alloy_plate: {
    id: "alloy_plate",
    name: "Alloy Plate",
    description: "Smelted plating, a building block for better gear.",
    value: 18,
  },
  cutting_torch: {
    id: "cutting_torch",
    name: "Cutting Torch",
    description: "Salvaging takes 20% less time.",
    value: 120,
    tool: { skill: "salvaging", speed: 0.8 },
  },
  plasma_drill: {
    id: "plasma_drill",
    name: "Plasma Drill",
    description: "Mining takes 20% less time.",
    value: 400,
    tool: { skill: "mining", speed: 0.8 },
  },
  harvest_kit: {
    id: "harvest_kit",
    name: "Harvest Kit",
    description: "Foraging takes 20% less time.",
    value: 200,
    tool: { skill: "foraging", speed: 0.8 },
  },
  pulse_blade: {
    id: "pulse_blade",
    name: "Pulse Blade",
    description: "+4 damage per combat round.",
    value: 350,
    weaponDamage: 4,
  },
  composite_armor: {
    id: "composite_armor",
    name: "Composite Armor",
    description: "Take 1 less damage per enemy hit.",
    value: 500,
    armor: 1,
  },
  chitin_shard: {
    id: "chitin_shard",
    name: "Chitin Shard",
    description: "Light, hard, and still slightly twitchy.",
    value: 6,
  },
  xeno_core: {
    id: "xeno_core",
    name: "Xeno Core",
    description: "A dense organ that pulses with strange energy.",
    value: 150,
  },
  glyph_tablet: {
    id: "glyph_tablet",
    name: "Glyph Tablet",
    description: "A clay tablet covered in the locals' writing. Needed to learn their language.",
    value: 20,
  },
  resonance_coil: {
    id: "resonance_coil",
    name: "Resonance Coil",
    description: "A coil of local make that hums at frequencies your electronics cannot produce.",
    value: 60,
  },
  void_lens: {
    id: "void_lens",
    name: "Void Lens",
    description: "A lens ground from something that is not quite glass.",
    value: 150,
  },
  star_honey: {
    id: "star_honey",
    name: "Star Honey",
    description: "Thick, sweet, faintly glowing. The locals cook with it.",
    value: 12,
  },
  skyweave_thread: {
    id: "skyweave_thread",
    name: "Skyweave Thread",
    description: "Light, strong thread spun by something that lives in the canopy.",
    value: 30,
  },
  aether_cell: {
    id: "aether_cell",
    name: "Aether Cell",
    description: "A sealed cell of stored energy. The locals do not explain how it works.",
    value: 250,
  },
  honey_ration: {
    id: "honey_ration",
    name: "Honey Ration",
    description: "A proper meal. Glowcap folded into Star Honey.",
    value: 30,
    heal: 40,
  },
  skyweave_suit: {
    id: "skyweave_suit",
    name: "Skyweave Suit",
    description: "Take 3 less damage per enemy hit. Light enough to forget you are wearing it.",
    value: 900,
    armor: 3,
  },
  veyari_lance: {
    id: "veyari_lance",
    name: "Veyari Lance",
    description:
      "+14 damage per combat round. A hunter's lance, made by the locals and given to those they trust.",
    value: 0,
    weaponDamage: 14,
    unsellable: true,
  },
  veyari_warplate: {
    id: "veyari_warplate",
    name: "Veyari Warplate",
    description: "Take 7 less damage per enemy hit. Grown, not forged.",
    value: 0,
    armor: 7,
    unsellable: true,
  },
  stim_pack: {
    id: "stim_pack",
    name: "Stim Pack",
    description: "A local battlefield remedy. Heals far more than a ration and tastes of copper.",
    value: 0,
    heal: 80,
    unsellable: true,
  },
  prism_geode: {
    id: "prism_geode",
    name: "Prism Geode",
    description: "Crack it open and the light inside splits into colours you have no names for.",
    value: 120,
  },
  star_sapphire: {
    id: "star_sapphire",
    name: "Star Sapphire",
    description: "A deep blue stone with a six-pointed glint that follows your eye.",
    value: 400,
  },
  nav_core: {
    id: "nav_core",
    name: "Intact Nav Core",
    description: "The navigation unit from a ship that was not yours. Still warm.",
    value: 250,
  },
  flight_recorder: {
    id: "flight_recorder",
    name: "Flight Recorder",
    description:
      "Sealed, scorched and still ticking. The locals pay well for other people's last words.",
    value: 500,
  },
  golden_spore: {
    id: "golden_spore",
    name: "Golden Spore",
    description: "A single spore the colour of old brass. It smells like the inside of a bell.",
    value: 100,
  },
  amber_bulb: {
    id: "amber_bulb",
    name: "Amber Bulb",
    description: "A sweetroot that grew around something and kept it. You can see it moving.",
    value: 180,
  },
  prospector_charm: {
    id: "prospector_charm",
    name: "Prospector's Charm",
    description: "Rare finds are 50% more likely. The locals say it is not luck, only attention.",
    value: 0,
    rareBonus: 1.5,
    unsellable: true,
  },
};

export const TASKS: TaskDef[] = [
  // Salvaging
  {
    id: "salvage_hull",
    skill: "salvaging",
    name: "Scavenge Hull Scrap",
    description: "Rip loose plating off the crash site.",
    levelReq: 1,
    durationMs: 3000,
    xp: 8,
    outputs: { scrap_metal: 1 },
  },
  {
    id: "salvage_wiring",
    skill: "salvaging",
    name: "Strip Wiring",
    description: "Pull boards and cables out of the dead consoles.",
    levelReq: 5,
    durationMs: 4000,
    xp: 16,
    outputs: { circuit_scrap: 1 },
    rareDrops: [{ item: "nav_core", chance: 0.004 }],
  },
  {
    id: "salvage_cargo",
    skill: "salvaging",
    name: "Breach Cargo Pod",
    description: "The pod survived the crash. Its contents partly did.",
    levelReq: 12,
    durationMs: 6000,
    xp: 40,
    outputs: { scrap_metal: 3, circuit_scrap: 1 },
    rareDrops: [{ item: "flight_recorder", chance: 0.003 }],
  },
  // Mining
  {
    id: "mine_ferrite",
    skill: "mining",
    name: "Mine Ferrite",
    description: "Chip dark ore out of the canyon wall.",
    levelReq: 1,
    durationMs: 3500,
    xp: 10,
    outputs: { ferrite_ore: 1 },
    rareDrops: [{ item: "prism_geode", chance: 0.004 }],
  },
  {
    id: "mine_lumina",
    skill: "mining",
    name: "Harvest Lumina Crystal",
    description: "Carefully. Very carefully.",
    levelReq: 8,
    durationMs: 5000,
    xp: 30,
    outputs: { lumina_crystal: 1 },
    rareDrops: [{ item: "star_sapphire", chance: 0.004 }],
  },
  // Foraging
  {
    id: "forage_glowcap",
    skill: "foraging",
    name: "Gather Glowcap",
    description: "Pick glowing mushrooms from the cave mouth.",
    levelReq: 1,
    durationMs: 3000,
    xp: 8,
    outputs: { glowcap: 1 },
    rareDrops: [{ item: "golden_spore", chance: 0.003 }],
  },
  {
    id: "forage_sweetroot",
    skill: "foraging",
    name: "Dig Sweetroot",
    description: "Dig up tubers while something watches from the ridge.",
    levelReq: 6,
    durationMs: 4500,
    xp: 22,
    outputs: { sweetroot: 1 },
    rareDrops: [{ item: "amber_bulb", chance: 0.004 }],
  },
  // Cooking
  {
    id: "craft_ration",
    skill: "cooking",
    name: "Cook Glowcap Ration",
    description: "Two glowcaps, one improvised stove.",
    levelReq: 1,
    durationMs: 3000,
    xp: 10,
    inputs: { glowcap: 2 },
    outputs: { ration: 1 },
  },
  {
    id: "craft_honey_ration",
    skill: "cooking",
    name: "Cook Honey Ration",
    description: "Star Honey from the locals makes this the best meal on the planet.",
    levelReq: 5,
    durationMs: 4000,
    xp: 28,
    inputs: { star_honey: 1, glowcap: 2 },
    outputs: { honey_ration: 1 },
  },
  // Engineering
  {
    id: "craft_alloy",
    skill: "engineering",
    name: "Smelt Alloy Plate",
    description: "Melt scrap and ore into something useful.",
    levelReq: 3,
    durationMs: 4000,
    xp: 18,
    inputs: { scrap_metal: 3, ferrite_ore: 1 },
    outputs: { alloy_plate: 1 },
  },
  {
    id: "craft_torch",
    skill: "engineering",
    name: "Build Cutting Torch",
    description: "A proper tool for salvaging.",
    levelReq: 4,
    durationMs: 6000,
    xp: 30,
    inputs: { alloy_plate: 2, circuit_scrap: 2 },
    outputs: { cutting_torch: 1 },
    once: true,
  },
  {
    id: "craft_harvest_kit",
    skill: "engineering",
    name: "Build Harvest Kit",
    description: "Blades, sample jars and a scanner for foraging.",
    levelReq: 6,
    durationMs: 6000,
    xp: 40,
    inputs: { alloy_plate: 2, circuit_scrap: 2, sweetroot: 3 },
    outputs: { harvest_kit: 1 },
    once: true,
  },
  {
    id: "craft_drill",
    skill: "engineering",
    name: "Build Plasma Drill",
    description: "Burns through rock like it owes you money.",
    levelReq: 9,
    durationMs: 8000,
    xp: 60,
    inputs: { alloy_plate: 4, circuit_scrap: 3, lumina_crystal: 2 },
    outputs: { plasma_drill: 1 },
    once: true,
  },
  {
    id: "craft_blade",
    skill: "engineering",
    name: "Forge Pulse Blade",
    description: "A vibrating blade powered by a Lumina crystal.",
    levelReq: 8,
    durationMs: 8000,
    xp: 55,
    inputs: { alloy_plate: 3, lumina_crystal: 1, circuit_scrap: 2 },
    outputs: { pulse_blade: 1 },
    once: true,
  },
  {
    id: "craft_armor",
    skill: "engineering",
    name: "Assemble Composite Armor",
    description: "Alloy plates bonded to chitin.",
    levelReq: 10,
    durationMs: 9000,
    xp: 70,
    inputs: { alloy_plate: 4, chitin_shard: 6 },
    outputs: { composite_armor: 1 },
    once: true,
  },
  {
    id: "craft_skyweave",
    skill: "engineering",
    name: "Weave Skyweave Suit",
    description: "Alloy plates and chitin over a base of the locals' thread.",
    levelReq: 16,
    durationMs: 10000,
    xp: 90,
    inputs: { alloy_plate: 4, skyweave_thread: 6, chitin_shard: 4 },
    outputs: { skyweave_suit: 1 },
    once: true,
  },
  // Combat
  {
    id: "fight_skitter",
    skill: "combat",
    name: "Hunt Dust Skitter",
    description: "Six legs, bad attitude.",
    levelReq: 1,
    durationMs: 4000,
    xp: 12,
    monster: { name: "Dust Skitter", hp: 20, damage: 3, drops: { chitin_shard: 1 } },
    rareDrops: [{ item: "xeno_core", chance: 0.002 }],
  },
  {
    id: "fight_stalker",
    skill: "combat",
    name: "Hunt Cave Stalker",
    description: "Hunts by heat. You are warm.",
    levelReq: 8,
    durationMs: 6000,
    xp: 40,
    monster: { name: "Cave Stalker", hp: 70, damage: 7, drops: { chitin_shard: 2 } },
    rareDrops: [{ item: "xeno_core", chance: 0.01 }],
  },
  {
    id: "fight_wraith",
    skill: "combat",
    name: "Hunt Rift Wraith",
    description: "It's not clear what it is made of. It is clear what it wants.",
    levelReq: 20,
    durationMs: 9000,
    xp: 120,
    monster: { name: "Rift Wraith", hp: 200, damage: 14, drops: { xeno_core: 1 } },
  },
];

/** What the Bounty Shop sells: things nobody can craft or trade for. */
export const BOUNTY_SHOP: ShopEntry[] = [
  { item: "stim_pack", cost: 8, levelReq: 2 },
  { item: "prospector_charm", cost: 400, levelReq: 3 },
  { item: "veyari_lance", cost: 600, levelReq: 4 },
  { item: "veyari_warplate", cost: 900, levelReq: 5 },
];

/** Bounty level needed before the board offers a tier (index 0 is tier 1). */
export const TIER_LEVELS = [1, 2, 4];

/** Share of an item's value the locals pay, by Trading Hub level. */
export const HUB_SELL_RATES = [0.6, 0.7, 0.8, 0.9, 1];
/** Discount on everything the locals sell, by Translation Device level. */
export const TRANSLATOR_DISCOUNTS = [0, 0, 0.05, 0.1, 0.15];

/** The locals' working name. Rename freely. */
export const LOCALS = "the Veyari";

/** What the locals sell: things you cannot get yourself. Expensive on purpose. */
export const STOCK: StockItem[] = [
  { item: "glyph_tablet", price: 60, tier: 1 },
  { item: "star_honey", price: 40, tier: 1 },
  { item: "resonance_coil", price: 180, tier: 2 },
  { item: "skyweave_thread", price: 90, tier: 2 },
  { item: "void_lens", price: 450, tier: 3 },
  { item: "aether_cell", price: 800, tier: 4 },
];

/** A line from the locals, by Translation Device level (0 means none yet). */
export const GREETINGS = [
  "They watch you and make soft, rolling sounds. You have no idea what they want.",
  '"Friend. Trade. Good." You are getting through, one word at a time.',
  '"You work hard, stranger. We will buy what you make."',
  '"Your people are strange, but your hands are honest. Welcome."',
  '"We have a word for those who fall from the sky and stay kind. It means family."',
  '"Everything we have is yours to ask for. Nothing is held back, friend."',
];

/** How many of one item you can hold, by Storage Depot level (index 0 is no depot). */
export const STORAGE_CAPS = [1000, 2000, 4000, 8000, 16000, 32000];
/** Extra offline hours the Stasis Pod adds per level. */
export const OFFLINE_BONUS_HOURS = 4;

export const BUILDINGS: BuildingDef[] = [
  {
    id: "shelter",
    name: "Shelter",
    description: "+10 max HP and faster healing per level.",
    maxLevel: 5,
    baseCost: { scrap_metal: 20, alloy_plate: 2 },
    costGrowth: 2,
  },
  {
    id: "generator",
    name: "Solar Generator",
    description: "Provides 3 power per level for your drones.",
    maxLevel: 5,
    baseCost: { scrap_metal: 15, alloy_plate: 3, circuit_scrap: 4 },
    costGrowth: 1.8,
    requires: { skill: "engineering", level: 5 },
    powerProvided: 3,
  },
  {
    id: "workshop",
    name: "Workshop",
    description: "Engineering tasks take 8% less time per level.",
    maxLevel: 5,
    baseCost: { alloy_plate: 6, circuit_scrap: 5 },
    costGrowth: 1.8,
    requires: { skill: "engineering", level: 4 },
  },
  {
    id: "salvage_drone",
    name: "Salvage Drone",
    description: "Brings back 1 Scrap Metal every 20s per level. Uses 1 power.",
    maxLevel: 10,
    baseCost: { alloy_plate: 3, circuit_scrap: 5 },
    costGrowth: 1.6,
    requires: { skill: "engineering", level: 7 },
    powerUse: 1,
    produces: { item: "scrap_metal", everyMs: 20_000 },
  },
  {
    id: "mining_drone",
    name: "Mining Drone",
    description: "Brings back 1 Ferrite Ore every 30s per level. Uses 1 power.",
    maxLevel: 10,
    baseCost: { alloy_plate: 4, circuit_scrap: 6, ferrite_ore: 10 },
    costGrowth: 1.6,
    requires: { skill: "engineering", level: 7 },
    powerUse: 1,
    produces: { item: "ferrite_ore", everyMs: 30_000 },
  },
  {
    id: "forager_drone",
    name: "Forager Drone",
    description: "Brings back 1 Glowcap every 20s per level. Uses 1 power.",
    maxLevel: 10,
    baseCost: { alloy_plate: 3, circuit_scrap: 4, glowcap: 10 },
    costGrowth: 1.6,
    requires: { skill: "engineering", level: 7 },
    powerUse: 1,
    produces: { item: "glowcap", everyMs: 20_000 },
  },
  {
    id: "translator",
    name: "Translation Device",
    description:
      "Turns the locals' speech into something you can understand. Each level teaches it more.",
    maxLevel: 5,
    baseCost: {},
    costGrowth: 1,
    levelCosts: [
      { alloy_plate: 10, circuit_scrap: 8, lumina_crystal: 3 },
      { alloy_plate: 15, circuit_scrap: 12, glyph_tablet: 3 },
      { alloy_plate: 20, lumina_crystal: 8, glyph_tablet: 6, resonance_coil: 1 },
      { alloy_plate: 30, glyph_tablet: 10, resonance_coil: 3, void_lens: 1 },
      { glyph_tablet: 15, resonance_coil: 6, void_lens: 3, aether_cell: 1 },
    ],
    levelNotes: [
      "Basic phrases. The locals will trade with you and sell their first goods.",
      "Simple conversation. More goods are offered.",
      "Bargaining. 5% off everything you buy, and rarer goods appear.",
      "Cultural exchange. 10% off, and the locals bring valuable things.",
      "Fluent. 15% off, and nothing is held back.",
    ],
    requires: { skill: "engineering", level: 14 },
    requiresContact: true,
  },
  {
    id: "hub",
    name: "Trading Hub",
    description: "A market where the locals buy what you make and sell what you cannot.",
    maxLevel: 5,
    baseCost: {},
    costGrowth: 1,
    levelCosts: [
      { alloy_plate: 20, circuit_scrap: 15, scrap_metal: 50 },
      { alloy_plate: 30, circuit_scrap: 20, glyph_tablet: 4 },
      { alloy_plate: 45, glyph_tablet: 8, resonance_coil: 2 },
      { alloy_plate: 60, resonance_coil: 4, void_lens: 2 },
      { resonance_coil: 8, void_lens: 4, aether_cell: 2 },
    ],
    levelNotes: HUB_SELL_RATES.map(
      (rate) => `The locals buy your goods at ${Math.round(rate * 100)}% of their worth.`,
    ),
    requires: { skill: "engineering", level: 16 },
    requiresContact: true,
    requiresBuilding: { id: "translator", level: 1 },
  },
  {
    id: "hydroponic_bay",
    name: "Hydroponic Bay",
    description: "Racks of nutrient trays. One plot per level, and crops grow while you are away.",
    maxLevel: 4,
    baseCost: { alloy_plate: 4, scrap_metal: 20, glowcap: 10 },
    costGrowth: 1.7,
    levelNotes: ["1 plot", "2 plots", "3 plots", "4 plots"],
    requires: { skill: "engineering", level: 6 },
    powerUse: 1,
  },
  {
    id: "storage",
    name: "Storage Depot",
    description: "Each item stack holds more. When a stack is full, the task feeding it stops.",
    maxLevel: 5,
    baseCost: {},
    costGrowth: 1,
    levelCosts: [
      { scrap_metal: 40, alloy_plate: 4 },
      { scrap_metal: 80, alloy_plate: 10, circuit_scrap: 6 },
      { alloy_plate: 20, circuit_scrap: 12 },
      { alloy_plate: 40, circuit_scrap: 20, resonance_coil: 1 },
      { alloy_plate: 60, resonance_coil: 3, void_lens: 1 },
    ],
    levelCredits: [0, 0, 300, 900, 2500],
    levelNotes: STORAGE_CAPS.slice(1).map(
      (n) => `Each item stack holds ${n.toLocaleString("en-US")}.`,
    ),
    requires: { skill: "engineering", level: 5 },
  },
  {
    id: "stasis_pod",
    name: "Stasis Pod",
    description:
      "Sleep through long absences. Your survivor keeps working for longer while you are away.",
    maxLevel: 5,
    baseCost: {},
    costGrowth: 1,
    levelCosts: [
      { alloy_plate: 10, circuit_scrap: 8, lumina_crystal: 2 },
      { alloy_plate: 15, circuit_scrap: 10, lumina_crystal: 4 },
      { alloy_plate: 25, lumina_crystal: 8, resonance_coil: 1 },
      { alloy_plate: 40, resonance_coil: 3, void_lens: 1 },
      { resonance_coil: 6, void_lens: 3, aether_cell: 1 },
    ],
    levelCredits: [0, 0, 400, 1200, 3000],
    levelNotes: [1, 2, 3, 4, 5].map(
      (l) => `Away progress counts for up to ${12 + l * OFFLINE_BONUS_HOURS} hours.`,
    ),
    requires: { skill: "engineering", level: 10 },
  },
  {
    id: "bounty_board",
    name: "Bounty Board",
    description: "Locals travel here to post requests for you, mostly about dangerous wildlife.",
    maxLevel: 3,
    baseCost: {},
    costGrowth: 1,
    levelCosts: [
      { alloy_plate: 12, circuit_scrap: 10, scrap_metal: 30 },
      { alloy_plate: 24, glyph_tablet: 5, resonance_coil: 1 },
      { alloy_plate: 40, glyph_tablet: 10, resonance_coil: 3, void_lens: 1 },
    ],
    levelNotes: [
      "3 bounties on offer.",
      "4 bounties on offer, and they pay 15% more Marks.",
      "5 bounties on offer, and they pay 30% more Marks.",
    ],
    requires: { skill: "engineering", level: 15 },
    requiresContact: true,
    requiresBuilding: { id: "translator", level: 1 },
  },
  {
    id: "beacon",
    name: "Signal Beacon",
    description: "Broadcasts a signal across the planet. Someone might be listening.",
    maxLevel: 1,
    baseCost: { alloy_plate: 15, circuit_scrap: 12, lumina_crystal: 5 },
    costGrowth: 1,
    requires: { skill: "engineering", level: 12 },
  },
];

export const CROPS: CropDef[] = [
  {
    id: "glowcap_bed",
    name: "Glowcap Bed",
    description: "Spores in a tray of warm nutrient gel. Hard to kill.",
    levelReq: 1,
    growMs: 5 * 60_000,
    xp: 30,
    seeds: { glowcap: 2 },
    yield: { glowcap: 8 },
  },
  {
    id: "sweetroot_bed",
    name: "Sweetroot Bed",
    description: "Sweetroot likes the dark and takes its time.",
    levelReq: 4,
    growMs: 10 * 60_000,
    xp: 80,
    seeds: { sweetroot: 2 },
    yield: { sweetroot: 8 },
  },
  {
    id: "lumina_bloom",
    name: "Lumina Bloom",
    description: "Seed a tray with crystal dust and something crystalline grows back.",
    levelReq: 8,
    growMs: 20 * 60_000,
    xp: 200,
    seeds: { lumina_crystal: 2 },
    yield: { lumina_crystal: 6 },
  },
];

export const CROP_BY_ID: Record<string, CropDef> = Object.fromEntries(CROPS.map((c) => [c.id, c]));

/** How often the unclaimed bounties on the board are replaced. */
export const BOARD_REFRESH_MS = 60 * 60 * 1000;
/** Marks per kill by bounty tier, and the extra the board pays per level (index 0 is level 1). */
export const MARKS_PER_KILL = [1, 2, 4];
export const BOARD_BONUS = [0, 0.15, 0.3];
export const REROLL_COST = 10;
export const ABANDON_COST = 5;

/** Locals who post bounties. */
export const POSTERS = [
  "Oru the herder",
  "Tessik of the lower terraces",
  "Marah Veln",
  "Old Dovu",
  "Kesh, a grain-warden",
  "Ilun the courier",
  "Sorrel of the ferry",
  "Brann Teyo",
];

/** Flavour for a request. `{m}` is the creature's name. */
export const BOUNTY_LINES = [
  "A {m} has been seen at the edge of the fields. We cannot sleep.",
  "The {m} keep coming back. Please. Thin them out.",
  "My brother went after a {m} alone. He is fine. His boots are not.",
  "Everything quiet has gone quiet. It is the {m}. It is always the {m}.",
  "We will pay what we can. The {m} must not reach the water.",
  "You fight well, sky-friend. Would you fight a {m} for us?",
];

export const BUILDING_BY_ID: Record<BuildingId, BuildingDef> = Object.fromEntries(
  BUILDINGS.map((b) => [b.id, b]),
) as Record<BuildingId, BuildingDef>;

export const TASK_BY_ID: Record<string, TaskDef> = Object.fromEntries(TASKS.map((t) => [t.id, t]));
export const SKILL_BY_ID: Record<SkillId, SkillDef> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
) as Record<SkillId, SkillDef>;

export const MAX_LEVEL = 50;
/** How long the locals take to answer once the Signal Beacon is built. */
export const CONTACT_DELAY_MS = 10 * 60 * 1000;
/** Offline progress is capped so a forgotten laptop does not trivialise the game. */
export const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000;

/** Bump when the save shape changes, and add a step to `migrate.ts`. */
export const SAVE_VERSION = 2;
