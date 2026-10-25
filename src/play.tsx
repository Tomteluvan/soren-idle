import { Action, ActionPanel, Color, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { artMarkdown, FRAME_MS } from "./art";
import {
  BUILDING_BY_ID,
  BUILDINGS,
  ITEMS,
  SKILLS,
  SKILL_BY_ID,
  TASK_BY_ID,
  TASKS,
} from "./engine/data";
import {
  build,
  buildingCost,
  buildingLevel,
  contactRemainingMs,
  count,
  eat,
  firstContact,
  fightDamage,
  levelOf,
  maxHp,
  playerArmor,
  playerDamage,
  powerCapacity,
  powerUsed,
  startTask,
  stopTask,
  taskDurationMs,
  xpForLevel,
} from "./engine/engine";
import { bar, formatBundle, formatCredits, formatDuration, formatReport } from "./engine/format";
import { resetState, update } from "./engine/storage";
import { buy, sell, sellPrice } from "./engine/trade";
import { Trade } from "./trade-view";
import {
  BuildingDef,
  BuildingId,
  GameState,
  ItemId,
  Report,
  SkillId,
  TaskDef,
} from "./engine/types";

type View = "overview" | SkillId | "base" | "trade" | "inventory";

const SKILL_ICON: Record<SkillId, Icon> = {
  salvaging: Icon.Hammer,
  mining: Icon.Mountain,
  foraging: Icon.Leaf,
  engineering: Icon.Gear,
  combat: Icon.Shield,
};

export default function Command() {
  const [state, setState] = useState<GameState>();
  const [view, setView] = useState<View>("overview");
  const [frame, setFrame] = useState(0);

  async function sync(change?: (s: GameState) => GameState) {
    const { state, report } = await update(change);
    setState(state);
    notify(report);
  }

  async function act<R extends { state: GameState; error?: string }>(
    change: (s: GameState) => R,
    success?: (result: R) => string,
  ) {
    let result = undefined as R | undefined;
    await sync((s) => {
      result = change(s);
      return result.state;
    });
    if (result?.error) await showToast({ style: Toast.Style.Failure, title: result.error });
    else if (result && success)
      await showToast({ style: Toast.Style.Success, title: success(result) });
  }

  useEffect(() => {
    let first = true;
    const tick = async () => {
      const { state, report } = await update();
      setState(state);
      // The first tick covers time spent away, so show it even when it is quiet.
      if (first && report.elapsedMs > 60_000) {
        first = false;
        await showToast({
          style: Toast.Style.Success,
          title: `While you were away (${formatDuration(report.elapsedMs)})`,
          message: formatReport(report) || "Nothing happened",
        });
      } else {
        first = false;
        notify(report);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), FRAME_MS);
    return () => clearInterval(id);
  }, []);

  if (!state) return <List isLoading />;

  return (
    <List
      isShowingDetail
      searchBarPlaceholder="Search"
      searchBarAccessory={
        <List.Dropdown tooltip="Section" value={view} onChange={(v) => setView(v as View)}>
          <List.Dropdown.Item title="Overview" value="overview" />
          <List.Dropdown.Section title="Skills">
            {SKILLS.map((s) => (
              <List.Dropdown.Item key={s.id} title={s.name} value={s.id} icon={SKILL_ICON[s.id]} />
            ))}
          </List.Dropdown.Section>
          <List.Dropdown.Item title="Base" value="base" icon={Icon.House} />
          <List.Dropdown.Item title="Trade" value="trade" icon={Icon.Coins} />
          <List.Dropdown.Item title="Inventory" value="inventory" icon={Icon.Box} />
        </List.Dropdown>
      }
    >
      {view === "overview" && (
        <Overview
          state={state}
          frame={frame}
          onStop={() => sync(stopTask)}
          onOpen={setView}
          onReset={reset}
        />
      )}
      {view === "base" && <Base state={state} onBuild={(id) => act((s) => build(s, id))} />}
      {view === "trade" && (
        <Trade
          state={state}
          onSell={(id, qty) =>
            act(
              (s) => sell(s, id, qty),
              (r) => `Sold ${r.amount}× ${ITEMS[id].name} for ${formatCredits(r.credits ?? 0)}`,
            )
          }
          onBuy={(id, qty) =>
            act(
              (s) => buy(s, id, qty),
              (r) => `Bought ${qty}× ${ITEMS[id].name} for ${formatCredits(r.cost ?? 0)}`,
            )
          }
        />
      )}
      {view === "inventory" && <Inventory state={state} onEat={(id) => act((s) => eat(s, id))} />}
      {SKILLS.some((s) => s.id === view) && (
        <Tasks
          state={state}
          skill={view as SkillId}
          frame={frame}
          onStart={(id) => act((s) => startTask(s, id))}
          onStop={() => sync(stopTask)}
        />
      )}
    </List>
  );

  async function reset() {
    await resetState();
    await sync();
    setView("overview");
  }
}

function notify(report: Report) {
  if (report.notices.length) {
    showToast({ style: Toast.Style.Success, title: "Contact", message: report.notices.join(" ") });
  } else if (report.levelUps.length || report.stoppedReason) {
    showToast({
      style: report.stoppedReason ? Toast.Style.Failure : Toast.Style.Success,
      title: report.levelUps.length ? "Level up!" : "Task stopped",
      message: [
        ...report.levelUps.map((u) => `${SKILL_BY_ID[u.skill].name} ${u.level}`),
        report.stoppedReason,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
}

// --- overview ---------------------------------------------------------------

function Overview(props: {
  state: GameState;
  frame: number;
  onStop: () => void;
  onOpen: (v: View) => void;
  onReset: () => void;
}) {
  const { state } = props;
  const task = state.activeTask ? TASK_BY_ID[state.activeTask] : undefined;
  const hpFraction = state.hp / maxHp(state);

  return (
    <>
      <List.Section title="Survivor">
        <List.Item
          title={task ? task.name : "Idle"}
          subtitle={task ? undefined : "Pick a skill to get to work"}
          icon={task ? SKILL_ICON[task.skill] : Icon.Pause}
          accessories={[{ text: `${Math.floor(state.hp)}/${maxHp(state)} HP` }]}
          detail={
            <List.Item.Detail
              markdown={[
                artMarkdown(state.activeTask, props.frame, true),
                `# ${task ? task.name : "Idle"}`,
                task
                  ? taskProgress(state, task)
                  : "_You are stranded. Choose a skill from the dropdown._",
                "",
                "```",
                `HP  ${bar(hpFraction)} ${Math.floor(state.hp)}/${maxHp(state)}`,
                "```",
                `Rations: **${count(state, "ration")}** · Credits: **${formatCredits(state.credits)}**`,
              ].join("\n")}
            />
          }
          actions={
            <ActionPanel>
              {task && <Action title="Stop Task" icon={Icon.Stop} onAction={props.onStop} />}
              <Action
                title="Reset Game"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={props.onReset}
              />
            </ActionPanel>
          }
        />
      </List.Section>
      <List.Section title="Skills">
        {SKILLS.map((skill) => {
          const level = levelOf(state, skill.id);
          const xp = state.xp[skill.id];
          const floor = xpForLevel(level);
          const next = xpForLevel(level + 1);
          return (
            <List.Item
              key={skill.id}
              title={skill.name}
              icon={SKILL_ICON[skill.id]}
              accessories={[{ tag: { value: `Lv ${level}`, color: Color.Blue } }]}
              detail={
                <List.Item.Detail
                  markdown={[
                    `# ${skill.name}`,
                    skill.blurb,
                    "",
                    "```",
                    `Lv ${level}  ${bar(next > floor ? (xp - floor) / (next - floor) : 1)}  ${Math.floor(xp)} XP`,
                    "```",
                  ].join("\n")}
                />
              }
              actions={
                <ActionPanel>
                  <Action
                    title="Show Tasks"
                    icon={Icon.ArrowRight}
                    onAction={() => props.onOpen(skill.id)}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </>
  );
}

// --- tasks ------------------------------------------------------------------

function taskProgress(state: GameState, task: TaskDef): string {
  const duration = taskDurationMs(state, task);
  return [
    "```",
    `${bar(state.taskProgressMs / duration)} ${formatDuration(duration - state.taskProgressMs)} left`,
    "```",
  ].join("\n");
}

function Tasks(props: {
  state: GameState;
  skill: SkillId;
  frame: number;
  onStart: (id: string) => void;
  onStop: () => void;
}) {
  const { state, skill } = props;
  const level = levelOf(state, skill);

  return (
    <List.Section title={SKILL_BY_ID[skill].name} subtitle={`Level ${level}`}>
      {TASKS.filter((t) => t.skill === skill).map((task) => {
        const locked = level < task.levelReq;
        const active = state.activeTask === task.id;
        const owned =
          task.once &&
          task.outputs &&
          (Object.keys(task.outputs) as ItemId[]).every((id) => count(state, id) > 0);
        return (
          <List.Item
            key={task.id}
            title={task.name}
            icon={
              locked ? { source: Icon.Lock, tintColor: Color.SecondaryText } : SKILL_ICON[skill]
            }
            accessories={[
              ...(active ? [{ icon: { source: Icon.Play, tintColor: Color.Green } }] : []),
              ...(locked ? [{ tag: `Lv ${task.levelReq}` }] : []),
              ...(owned ? [{ tag: { value: "Owned", color: Color.Green } }] : []),
            ]}
            detail={<List.Item.Detail markdown={taskMarkdown(state, task, active, props.frame)} />}
            actions={
              <ActionPanel>
                {active ? (
                  <Action title="Stop Task" icon={Icon.Stop} onAction={props.onStop} />
                ) : (
                  <Action
                    title="Start Task"
                    icon={Icon.Play}
                    onAction={() => props.onStart(task.id)}
                  />
                )}
              </ActionPanel>
            }
          />
        );
      })}
    </List.Section>
  );
}

function taskMarkdown(state: GameState, task: TaskDef, active: boolean, frame: number): string {
  const lines = [artMarkdown(task.id, frame, active), `# ${task.name}`, task.description, ""];
  if (active) lines.push(taskProgress(state, task), "");
  lines.push(`- **Time:** ${formatDuration(taskDurationMs(state, task))}`, `- **XP:** ${task.xp}`);
  if (task.inputs) lines.push(`- **Needs:** ${formatBundle(task.inputs)}`);
  if (task.outputs) lines.push(`- **Makes:** ${formatBundle(task.outputs)}`);
  if (task.monster) {
    const m = task.monster;
    lines.push(
      `- **Enemy:** ${m.name} (${m.hp} HP, ${m.damage} dmg)`,
      `- **Your damage:** ${playerDamage(state)} per round, armor ${playerArmor(state)}`,
      `- **Expected HP loss:** ~${fightDamage(state, task)}`,
      `- **Drops:** ${formatBundle(m.drops)}`,
    );
  }
  return lines.join("\n");
}

// --- inventory --------------------------------------------------------------

function Inventory(props: { state: GameState; onEat: (id: ItemId) => void }) {
  const owned = (Object.keys(ITEMS) as ItemId[]).filter((id) => count(props.state, id) > 0);
  if (!owned.length) {
    return (
      <List.EmptyView
        title="Nothing yet"
        description="Salvage something from the wreck."
        icon={Icon.Box}
      />
    );
  }
  return (
    <List.Section title="Inventory">
      {owned.map((id) => {
        const item = ITEMS[id];
        return (
          <List.Item
            key={id}
            title={item.name}
            icon={Icon.Box}
            accessories={[{ text: `×${Math.floor(count(props.state, id))}` }]}
            detail={
              <List.Item.Detail
                markdown={`# ${item.name}\n${item.description}\n\nWorth **${formatCredits(sellPrice(props.state, id))}** each.`}
              />
            }
            actions={
              <ActionPanel>
                {item.heal && (
                  <Action
                    title={`Eat (+${item.heal} HP)`}
                    icon={Icon.Heart}
                    onAction={() => props.onEat(id)}
                  />
                )}
              </ActionPanel>
            }
          />
        );
      })}
    </List.Section>
  );
}

// --- base -------------------------------------------------------------------

function effectLine(def: BuildingDef, level: number, state: GameState): string {
  if (def.id === "beacon") {
    if (!level) return "Not built";
    const wait = contactRemainingMs(state);
    return wait === null
      ? "The locals have answered"
      : `Signal sent, answer expected in ${formatDuration(wait)}`;
  }
  if (def.id === "shelter") return `+${10 * level} max HP, +${(0.15 * level).toFixed(2)} HP/s`;
  if (def.levelNotes) return level ? `Level ${level}: ${def.levelNotes[level - 1]}` : "Not built";
  if (def.id === "workshop") return `Engineering ${8 * level}% faster`;
  if (def.powerProvided) return `${def.powerProvided * level} power`;
  if (def.produces)
    return `${level} × ${ITEMS[def.produces.item].name} per ${def.produces.everyMs / 1000}s`;
  return level ? "Built" : "Not built";
}

function Base(props: { state: GameState; onBuild: (id: BuildingId) => void }) {
  const { state } = props;
  const contact = firstContact(state);
  return (
    <List.Section title="Base" subtitle={`Power ${powerUsed(state)}/${powerCapacity(state)}`}>
      {BUILDINGS.map((def) => {
        const level = buildingLevel(state, def.id);
        const maxed = level >= def.maxLevel;
        const skillLocked =
          !!def.requires && levelOf(state, def.requires.skill) < def.requires.level;
        const needsContact = !!def.requiresContact && !contact;
        const needed = def.requiresBuilding;
        const needsBuilding = !!needed && buildingLevel(state, needed.id) < needed.level;
        const locked = skillLocked || needsContact || needsBuilding;
        const lockTag =
          skillLocked && def.requires
            ? `${SKILL_BY_ID[def.requires.skill].name} ${def.requires.level}`
            : needsContact
              ? "Needs contact"
              : needsBuilding && needed
                ? `${BUILDING_BY_ID[needed.id].name} ${needed.level}`
                : undefined;
        const cost = buildingCost(state, def.id);
        const costLines = (Object.entries(cost) as [ItemId, number][]).map(([id, n]) => {
          const have = Math.floor(count(state, id));
          return `- ${have >= n ? "✅" : "❌"} ${ITEMS[id].name}: ${have}/${n}`;
        });
        return (
          <List.Item
            key={def.id}
            title={def.name}
            icon={locked ? { source: Icon.Lock, tintColor: Color.SecondaryText } : Icon.House}
            accessories={[
              ...(lockTag ? [{ tag: lockTag }] : []),
              {
                tag: {
                  value: `Lv ${level}/${def.maxLevel}`,
                  color: level ? Color.Green : Color.SecondaryText,
                },
              },
            ]}
            detail={
              <List.Item.Detail
                markdown={[
                  `# ${def.name}`,
                  def.description,
                  "",
                  `**Now:** ${effectLine(def, level, state)}`,
                  ...(def.levelNotes
                    ? [
                        "",
                        ...def.levelNotes.map(
                          (note, i) =>
                            `${i + 1 === level ? "**▶" : "-"} Level ${i + 1}: ${note}${i + 1 === level ? "**" : ""}`,
                        ),
                      ]
                    : []),
                  ...(maxed ? ["", "_Fully built._"] : ["", `**Next level costs:**`, ...costLines]),
                  ...(def.id === "beacon" && contact
                    ? ["", "📡 **The locals have arrived. They are curious, and not hostile.**"]
                    : []),
                ].join("\n")}
              />
            }
            actions={
              <ActionPanel>
                {!maxed && (
                  <Action
                    title={level ? "Upgrade" : "Build"}
                    icon={Icon.Hammer}
                    onAction={() => props.onBuild(def.id)}
                  />
                )}
              </ActionPanel>
            }
          />
        );
      })}
    </List.Section>
  );
}
