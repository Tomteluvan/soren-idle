import { BUILDING_BY_ID, BUILDINGS, ITEMS, MAX_LEVEL, MAX_OFFLINE_MS, SKILLS, TASK_BY_ID } from "./data";
import { BuildingId, Bundle, GameState, ItemId, Report, SkillId, TaskDef } from "./types";

const FOOD_HEAL_THRESHOLD = 0.5;
const REGEN_HP_PER_MS = 0.2 / 1000;
const SHELTER_REGEN_HP_PER_MS = 0.15 / 1000;

export function newGame(now = Date.now()): GameState {
  return {
    version: 1,
    createdAt: now,
    lastTick: now,
    activeTask: null,
    taskProgressMs: 0,
    hp: maxHpFor(0),
    xp: Object.fromEntries(SKILLS.map((s) => [s.id, 0])) as Record<SkillId, number>,
    inventory: {},
    credits: 0,
    buildings: {},
    passive: {},
    stats: { cycles: 0, kills: 0, deaths: 0 },
  };
}

// --- levels -----------------------------------------------------------------

export function xpForLevel(level: number): number {
  return level <= 1 ? 0 : Math.floor(30 * (level - 1) ** 2);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

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
  return Object.fromEntries(
    (Object.entries(def.baseCost) as [ItemId, number][]).map(([item, n]) => [
      item,
      Math.ceil(n * def.costGrowth ** level),
    ]),
  );
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
  if (def.powerUse && powerCapacity(s) - powerUsed(s) < def.powerUse) {
    return { state: s, error: "Not enough power. Upgrade the Solar Generator" };
  }
  const cost = buildingCost(s, id);
  if (!canAfford(s, cost)) return { state: s, error: "Missing materials" };
  const next = structuredClone(s);
  addItems(next, cost, -1);
  next.buildings[id] = level + 1;
  return { state: next };
}

// --- derived stats ----------------------------------------------------------

export function taskDurationMs(s: GameState, task: TaskDef): number {
  let mult = 1;
  for (const item of Object.values(ITEMS)) {
    if (item.tool?.skill === task.skill && count(s, item.id) > 0) mult = Math.min(mult, item.tool.speed);
  }
  if (task.skill === "engineering") mult *= 1 - 0.08 * buildingLevel(s, "workshop");
  return Math.max(1000, Math.round(task.durationMs * mult));
}

export function playerDamage(s: GameState): number {
  const bonus = Object.values(ITEMS).reduce((sum, i) => sum + (count(s, i.id) > 0 ? (i.weaponDamage ?? 0) : 0), 0);
  return 3 + levelOf(s, "combat") + bonus;
}

export function playerArmor(s: GameState): number {
  return Object.values(ITEMS).reduce((sum, i) => sum + (count(s, i.id) > 0 ? (i.armor ?? 0) : 0), 0);
}

/** Expected damage taken in a fight against this task's monster. */
export function fightDamage(s: GameState, task: TaskDef): number {
  const m = task.monster;
  if (!m) return 0;
  const rounds = Math.ceil(m.hp / playerDamage(s));
  return Math.ceil(rounds * Math.max(1, m.damage - playerArmor(s)) * 0.4);
}

// --- actions ----------------------------------------------------------------

export function startTask(s: GameState, taskId: string): { state: GameState; error?: string } {
  const task = TASK_BY_ID[taskId];
  if (!task) return { state: s, error: "Unknown task" };
  if (levelOf(s, task.skill) < task.levelReq) return { state: s, error: `Requires level ${task.levelReq}` };
  if (task.once && task.outputs && (Object.keys(task.outputs) as ItemId[]).every((id) => count(s, id) > 0)) {
    return { state: s, error: "You already own this" };
  }
  if (!canAfford(s, task.inputs)) return { state: s, error: "Missing materials" };
  return { state: { ...s, activeTask: taskId, taskProgressMs: 0 } };
}

export function stopTask(s: GameState): GameState {
  return { ...s, activeTask: null, taskProgressMs: 0 };
}

export function eat(s: GameState): { state: GameState; error?: string } {
  if (count(s, "ration") < 1) return { state: s, error: "No rations" };
  if (s.hp >= maxHp(s)) return { state: s, error: "Already at full health" };
  const next = structuredClone(s);
  next.inventory.ration = count(s, "ration") - 1;
  next.hp = Math.min(maxHp(s), s.hp + (ITEMS.ration.heal ?? 0));
  return { state: next };
}

// --- simulation -------------------------------------------------------------

function gainXp(s: GameState, skill: SkillId, amount: number, report: Report) {
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
    while (s.hp <= damage * (1 + FOOD_HEAL_THRESHOLD) && count(s, "ration") > 0 && s.hp < maxHp(s)) {
      s.inventory.ration = count(s, "ration") - 1;
      s.hp = Math.min(maxHp(s), s.hp + (ITEMS.ration.heal ?? 0));
    }
    if (s.hp <= damage) return `Retreated from ${task.monster.name}: too wounded and out of rations`;
    s.hp -= damage;
    s.stats.kills++;
    addItems(s, task.monster.drops, 1, report);
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
  return { elapsedMs: 0, cycles: 0, items: {}, xp: {}, levelUps: [] };
}

/** Advances the game to `now`, running as many task cycles as the elapsed time allows. */
export function advance(prev: GameState, now: number): { state: GameState; report: Report } {
  const s = structuredClone(prev);
  const report = emptyReport();
  const elapsed = Math.min(Math.max(0, now - s.lastTick), MAX_OFFLINE_MS);
  s.lastTick = now;
  report.elapsedMs = elapsed;

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
  const regen = (task?.skill === "combat" ? 0 : REGEN_HP_PER_MS) + SHELTER_REGEN_HP_PER_MS * buildingLevel(s, "shelter");
  s.hp = Math.min(maxHp(s), s.hp + elapsed * regen);
  if (!task) return { state: s, report };

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
    if (task.once) {
      s.activeTask = null;
      break;
    }
  }
  s.taskProgressMs = s.activeTask ? remaining : 0;
  return { state: s, report };
}
