import {
  BUILDING_BY_ID,
  BUILDINGS,
  CONTACT_DELAY_MS,
  BOARD_REFRESH_MS,
  ITEMS,
  MAX_LEVEL,
  MAX_OFFLINE_MS,
  SAVE_VERSION,
  SKILLS,
  TASK_BY_ID,
} from "./data";
import { onKill, refillBoard, refreshBoardIfDue } from "./bounty";
import { levelFromXp, xpForLevel } from "./levels";
import {
  BuildingId,
  Bundle,
  FoodPriority,
  GameState,
  ItemId,
  Report,
  SkillId,
  TaskDef,
} from "./types";

const FOOD_HEAL_THRESHOLD = 0.5;
const REGEN_HP_PER_MS = 0.2 / 1000;
const SHELTER_REGEN_HP_PER_MS = 0.15 / 1000;

export function newGame(now = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastTick: now,
    activeTask: null,
    taskProgressMs: 0,
    taskRemaining: null,
    hp: maxHpFor(0),
    xp: Object.fromEntries(SKILLS.map((s) => [s.id, 0])) as Record<SkillId, number>,
    inventory: {},
    rng: (now ^ 0x9e3779b9) | 0,
    credits: 0,
    marks: 0,
    bountyXp: 0,
    board: { offers: [], active: null, refreshAt: 0, nextId: 1 },
    contactAt: null,
    buildings: {},
    passive: {},
    keep: {},
    settings: { eatBelow: 0, foodPriority: "weakest" },
    plots: [],
    hints: [],
    stats: { cycles: 0, kills: 0, deaths: 0, produced: {}, creditsEarned: 0, bounties: 0 },
  };
}

// --- levels -----------------------------------------------------------------

export { levelFromXp, xpForLevel };

export const levelOf = (s: GameState, skill: SkillId) => levelFromXp(s.xp[skill]);

export function maxHpFor(combatXp: number): number {
  return 30 + 5 * levelFromXp(combatXp);
}

export const maxHp = (s: GameState) => maxHpFor(s.xp.combat) + 10 * buildingLevel(s, "shelter");

// --- inventory --------------------------------------------------------------

export const count = (s: GameState, id: ItemId) => s.inventory[id] ?? 0;

export function canAfford(s: GameState, cost: Bundle = {}): boolean {
  return (Object.entries(cost) as [ItemId, number][]).every(([id, n]) => count(s, id) >= n);
}

function addItems(s: GameState, bundle: Bundle = {}, sign: 1 | -1 = 1, report?: Report) {
  for (const [id, n] of Object.entries(bundle) as [ItemId, number][]) {
    s.inventory[id] = Math.max(0, count(s, id) + sign * n);
    if (sign === 1 && report) report.items[id] = (report.items[id] ?? 0) + n;
  }
}

// --- base -------------------------------------------------------------------

export const buildingLevel = (s: GameState, id: BuildingId) => s.buildings[id] ?? 0;

/** Cost of the next level of a building. */
export function buildingCost(s: GameState, id: BuildingId): Bundle {
  const def = BUILDING_BY_ID[id];
  const level = buildingLevel(s, id);
  if (def.levelCosts) return def.levelCosts[Math.min(level, def.levelCosts.length - 1)];
  return Object.fromEntries(
    (Object.entries(def.baseCost) as [ItemId, number][]).map(([item, n]) => [
      item,
      Math.ceil(n * def.costGrowth ** level),
    ]),
  );
}

/** True once the locals have answered the beacon. */
export function firstContact(s: GameState): boolean {
  return s.contactAt !== null && s.lastTick >= s.contactAt;
}

/** Milliseconds until the locals arrive, or null if there is no pending signal. */
export function contactRemainingMs(s: GameState): number | null {
  return s.contactAt !== null && !firstContact(s) ? s.contactAt - s.lastTick : null;
}

export function powerCapacity(s: GameState): number {
  return BUILDINGS.reduce((sum, b) => sum + (b.powerProvided ?? 0) * buildingLevel(s, b.id), 0);
}

export function powerUsed(s: GameState): number {
  return BUILDINGS.reduce((sum, b) => sum + (b.powerUse ?? 0) * buildingLevel(s, b.id), 0);
}

export function build(s: GameState, id: BuildingId): { state: GameState; error?: string } {
  const def = BUILDING_BY_ID[id];
  const level = buildingLevel(s, id);
  if (level >= def.maxLevel) return { state: s, error: "Already at max level" };
  if (def.requires && levelOf(s, def.requires.skill) < def.requires.level) {
    return { state: s, error: `Requires ${def.requires.skill} level ${def.requires.level}` };
  }
  if (def.requiresContact && !firstContact(s))
    return { state: s, error: "There is nobody to talk to yet" };
  if (
    def.requiresBuilding &&
    buildingLevel(s, def.requiresBuilding.id) < def.requiresBuilding.level
  ) {
    const needed = BUILDING_BY_ID[def.requiresBuilding.id].name;
    return { state: s, error: `Requires ${needed} level ${def.requiresBuilding.level}` };
  }
  if (def.powerUse && powerCapacity(s) - powerUsed(s) < def.powerUse) {
    return { state: s, error: "Not enough power. Upgrade the Solar Generator" };
  }
  const cost = buildingCost(s, id);
  if (!canAfford(s, cost)) return { state: s, error: "Missing materials" };
  const next = structuredClone(s);
  addItems(next, cost, -1);
  next.buildings[id] = level + 1;
  if (id === "beacon") next.contactAt = s.lastTick + CONTACT_DELAY_MS;
  if (id === "bounty_board") {
    if (!next.board.refreshAt) next.board.refreshAt = s.lastTick + BOARD_REFRESH_MS;
    refillBoard(next);
  }
  return { state: next };
}

// --- derived stats ----------------------------------------------------------

export function taskDurationMs(s: GameState, task: TaskDef): number {
  let mult = 1;
  for (const item of Object.values(ITEMS)) {
    if (item.tool?.skill === task.skill && count(s, item.id) > 0)
      mult = Math.min(mult, item.tool.speed);
  }
  if (task.skill === "engineering") mult *= 1 - 0.08 * buildingLevel(s, "workshop");
  return Math.max(1000, Math.round(task.durationMs * mult));
}

export function playerDamage(s: GameState): number {
  const bonus = Object.values(ITEMS).reduce(
    (sum, i) => sum + (count(s, i.id) > 0 ? (i.weaponDamage ?? 0) : 0),
    0,
  );
  return 3 + levelOf(s, "combat") + bonus;
}

export function playerArmor(s: GameState): number {
  return Object.values(ITEMS).reduce(
    (sum, i) => sum + (count(s, i.id) > 0 ? (i.armor ?? 0) : 0),
    0,
  );
}

/** Expected damage taken in a fight against this task's monster. */
export function fightDamage(s: GameState, task: TaskDef): number {
  const m = task.monster;
  if (!m) return 0;
  const rounds = Math.ceil(m.hp / playerDamage(s));
  return Math.ceil(rounds * Math.max(1, m.damage - playerArmor(s)) * 0.4);
}

export interface TaskRates {
  xpPerHour: number;
  /** What one hour of this task makes (outputs, or monster drops). */
  itemsPerHour: Bundle;
  /** What one hour of this task uses up. */
  inputsPerHour: Bundle;
  /** Expected HP lost per hour in combat. */
  hpLossPerHour: number;
  /** Time to the next level at this rate, or null at the level cap. */
  nextLevelMs: number | null;
}

const scaleBundle = (bundle: Bundle = {}, k: number): Bundle =>
  Object.fromEntries(Object.entries(bundle).map(([id, n]) => [id, n * k]));

/** What doing this task nonstop would give per hour, at your current gear. */
export function taskRates(s: GameState, task: TaskDef): TaskRates {
  const perHour = 3_600_000 / taskDurationMs(s, task);
  const level = levelOf(s, task.skill);
  const xpPerHour = task.xp * perHour;
  return {
    xpPerHour,
    itemsPerHour: scaleBundle(task.monster ? task.monster.drops : task.outputs, perHour),
    inputsPerHour: scaleBundle(task.inputs, perHour),
    hpLossPerHour: task.monster ? fightDamage(s, task) * perHour : 0,
    nextLevelMs:
      level >= MAX_LEVEL
        ? null
        : Math.ceil(((xpForLevel(level + 1) - s.xp[task.skill]) / xpPerHour) * 3_600_000),
  };
}

// --- actions ----------------------------------------------------------------

export function startTask(
  s: GameState,
  taskId: string,
  runs?: number,
): { state: GameState; error?: string } {
  const task = TASK_BY_ID[taskId];
  if (!task) return { state: s, error: "Unknown task" };
  if (levelOf(s, task.skill) < task.levelReq)
    return { state: s, error: `Requires level ${task.levelReq}` };
  if (
    task.once &&
    task.outputs &&
    (Object.keys(task.outputs) as ItemId[]).every((id) => count(s, id) > 0)
  ) {
    return { state: s, error: "You already own this" };
  }
  if (!canAfford(s, task.inputs)) return { state: s, error: "Missing materials" };
  const limit = task.once ? 1 : runs && runs > 0 ? Math.floor(runs) : null;
  return { state: { ...s, activeTask: taskId, taskProgressMs: 0, taskRemaining: limit } };
}

export function stopTask(s: GameState): GameState {
  return { ...s, activeTask: null, taskProgressMs: 0, taskRemaining: null };
}

/** The food the survivor eats first: the weakest by default, so strong food is not wasted. */
export function foodOwned(
  s: GameState,
  priority: FoodPriority = s.settings.foodPriority,
): ItemId | undefined {
  const sign = priority === "weakest" ? 1 : -1;
  return Object.values(ITEMS)
    .filter((i) => i.heal && count(s, i.id) > 0)
    .sort((a, b) => sign * ((a.heal ?? 0) - (b.heal ?? 0)))[0]?.id;
}

export function eat(
  s: GameState,
  id: ItemId | undefined = foodOwned(s),
): { state: GameState; error?: string } {
  if (!id || count(s, id) < 1 || !ITEMS[id].heal) return { state: s, error: "No rations" };
  if (s.hp >= maxHp(s)) return { state: s, error: "Already at full health" };
  const next = structuredClone(s);
  next.inventory[id] = count(s, id) - 1;
  next.hp = Math.min(maxHp(s), s.hp + (ITEMS[id].heal ?? 0));
  return { state: next };
}

// --- simulation -------------------------------------------------------------

export function gainXp(s: GameState, skill: SkillId, amount: number, report: Report) {
  const before = levelFromXp(s.xp[skill]);
  s.xp[skill] += amount;
  report.xp[skill] = (report.xp[skill] ?? 0) + amount;
  const after = levelFromXp(s.xp[skill]);
  for (let level = before + 1; level <= after; level++) report.levelUps.push({ skill, level });
  if (skill === "combat" && after > before) s.hp = Math.min(maxHp(s), s.hp + 5 * (after - before));
}

/** Runs one cycle of a task. Returns a reason string if the task cannot continue. */
function runCycle(s: GameState, task: TaskDef, report: Report): string | undefined {
  if (task.monster) {
    const damage = fightDamage(s, task);
    const wantsFood = () =>
      s.hp <= damage * (1 + FOOD_HEAL_THRESHOLD) || s.hp < s.settings.eatBelow * maxHp(s);
    for (let food = foodOwned(s); food && wantsFood() && s.hp < maxHp(s); food = foodOwned(s)) {
      s.inventory[food] = count(s, food) - 1;
      s.hp = Math.min(maxHp(s), s.hp + (ITEMS[food].heal ?? 0));
    }
    if (s.hp <= damage)
      return `Retreated from ${task.monster.name}: too wounded and out of rations`;
    s.hp -= damage;
    s.stats.kills++;
    addItems(s, task.monster.drops, 1, report);
    onKill(s, task, report);
  } else {
    if (!canAfford(s, task.inputs)) return `Out of materials for ${task.name}`;
    addItems(s, task.inputs, -1);
    addItems(s, task.outputs, 1, report);
  }
  gainXp(s, task.skill, task.xp, report);
  s.stats.cycles++;
  report.cycles++;
  return undefined;
}

export function emptyReport(): Report {
  return { elapsedMs: 0, cycles: 0, items: {}, xp: {}, levelUps: [], notices: [], bounties: [] };
}

/** Advances the game to `now`, running as many task cycles as the elapsed time allows. */
export function advance(prev: GameState, now: number): { state: GameState; report: Report } {
  const s = structuredClone(prev);
  const report = emptyReport();
  const elapsed = Math.min(Math.max(0, now - s.lastTick), MAX_OFFLINE_MS);
  s.lastTick = now;
  report.elapsedMs = elapsed;
  if (!firstContact(prev) && firstContact(s)) {
    report.notices.push("Strangers are approaching your camp. The locals answered your signal.");
  }

  // Drones work whatever the survivor is doing, and their haul can feed the active task.
  for (const def of BUILDINGS) {
    const level = buildingLevel(s, def.id);
    if (!def.produces || level === 0) continue;
    const owed = (s.passive[def.id] ?? 0) + (elapsed * level) / def.produces.everyMs;
    const whole = Math.floor(owed);
    s.passive[def.id] = owed - whole;
    if (whole > 0) addItems(s, { [def.produces.item]: whole }, 1, report);
  }

  const task = s.activeTask ? TASK_BY_ID[s.activeTask] : undefined;
  const regen =
    (task?.skill === "combat" ? 0 : REGEN_HP_PER_MS) +
    SHELTER_REGEN_HP_PER_MS * buildingLevel(s, "shelter");
  s.hp = Math.min(maxHp(s), s.hp + elapsed * regen);
  if (!task) return finish(s, report);

  if (task.once && s.taskRemaining === null) s.taskRemaining = 1;
  let remaining = s.taskProgressMs + elapsed;
  // Tool crafted mid-run changes duration, so recompute each cycle.
  while (s.activeTask) {
    const duration = taskDurationMs(s, task);
    if (remaining < duration) break;
    const stopReason = runCycle(s, task, report);
    if (stopReason) {
      report.stoppedReason = stopReason;
      s.activeTask = null;
      break;
    }
    remaining -= duration;
    if (s.taskRemaining !== null && --s.taskRemaining <= 0) {
      report.completed = `Finished ${task.name}`;
      s.activeTask = null;
      break;
    }
  }
  s.taskProgressMs = s.activeTask ? remaining : 0;
  if (!s.activeTask) s.taskRemaining = null;
  return finish(s, report);
}

/** Folds what the report gained into the lifetime totals. */
function finish(s: GameState, report: Report): { state: GameState; report: Report } {
  refreshBoardIfDue(s);
  for (const [id, n] of Object.entries(report.items) as [ItemId, number][])
    s.stats.produced[id] = (s.stats.produced[id] ?? 0) + n;
  return { state: s, report };
}
