/**
 * Balance simulation: how long does each skill take to level, and when does each task unlock?
 *
 *   npm run balance
 *
 * Assumes you do nothing but train one skill with its best repeatable task, bare-handed and with
 * every input already in the bag. Skills with no repeatable task (engineering crafts are one-offs,
 * hydroponics grows crops) show n/a. It is a pacing yardstick, not a play-through: real runs are slower
 * (gathering inputs, eating, trading) and faster (tools, potions, drones).
 */
import { MAX_LEVEL, SKILLS, TASKS } from "../src/engine/data";
import { newGame, taskRates } from "../src/engine/engine";
import { xpForLevel } from "../src/engine/levels";
import { GameState, SkillId, TaskDef } from "../src/engine/types";

const MILESTONES = [5, 10, 20, 30, 40, MAX_LEVEL];

const stateAt = (skill: SkillId, level: number): GameState => {
  const s = newGame(0);
  s.xp[skill] = xpForLevel(level);
  return s;
};

/** The repeatable task that gives the most XP per hour at this level, if any is open. */
function bestTask(skill: SkillId, level: number): TaskDef | undefined {
  const s = stateAt(skill, level);
  return TASKS.filter((t) => t.skill === skill && !t.once && t.levelReq <= level).sort(
    (a, b) => taskRates(s, b).xpPerHour - taskRates(s, a).xpPerHour,
  )[0];
}

/** Hours to climb from level 1 to each level in turn, index = level. */
function hoursToLevel(skill: SkillId): number[] {
  const hours = [0, 0];
  for (let level = 1; level < MAX_LEVEL; level++) {
    const task = bestTask(skill, level);
    const xpPerHour = task ? taskRates(stateAt(skill, level), task).xpPerHour : 0;
    const step = xpPerHour ? (xpForLevel(level + 1) - xpForLevel(level)) / xpPerHour : Infinity;
    hours.push(hours[level] + step);
  }
  return hours;
}

const fmt = (h: number) =>
  !isFinite(h)
    ? "n/a"
    : h < 1
      ? `${Math.round(h * 60)}m`
      : h < 100
        ? `${h.toFixed(1)}h`
        : `${Math.round(h)}h`;

const table = (rows: string[][]) => {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  for (const row of rows)
    console.log(
      row
        .map((c, i) => c.padEnd(widths[i]))
        .join("  ")
        .trimEnd(),
    );
};

const byHours = new Map(SKILLS.map((sk) => [sk.id, hoursToLevel(sk.id)]));

console.log("\nTime to reach a level, training the best open task nonstop\n");
table([
  ["skill", ...MILESTONES.map((l) => `lv ${l}`)],
  ...SKILLS.map((sk) => [sk.name, ...MILESTONES.map((l) => fmt(byHours.get(sk.id)![l]))]),
]);

console.log("\nTime to unlock each task, training its own skill nonstop\n");
table([
  ["task", "skill", "lv", "unlocks after", "xp/h when it opens"],
  ...TASKS.filter((t) => t.levelReq > 1 && Number.isFinite(byHours.get(t.skill)![t.levelReq]))
    .sort((a, b) => a.skill.localeCompare(b.skill) || a.levelReq - b.levelReq)
    .map((t) => [
      t.name,
      t.skill,
      String(t.levelReq),
      fmt(byHours.get(t.skill)![t.levelReq]),
      Math.round(taskRates(stateAt(t.skill, t.levelReq), t).xpPerHour).toLocaleString("en-US"),
    ]),
]);
