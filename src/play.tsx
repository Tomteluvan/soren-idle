import {
  Action,
  ActionPanel,
  Alert,
  Clipboard,
  Color,
  confirmAlert,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { artMarkdown, buildingMarkdown, FRAME_MS, preloadMarkdown } from "./art";
import {
  BUILDING_BY_ID,
  BUILDINGS,
  AREAS,
  CROP_BY_ID,
  ITEMS,
  SKILLS,
  SKILL_BY_ID,
  TASK_BY_ID,
  TASKS,
} from "./engine/data";
import {
  build,
  buildingCost,
  buildingCredits,
  buildingLevel,
  storageCap,
  contactRemainingMs,
  count,
  drink,
  eat,
  equip,
  isEquipped,
  unequip,
  firstContact,
  damageAgainst,
  fightDamage,
  hitDamage,
  isGear,
  levelOf,
  maxHp,
  modifiers,
  playerArmor,
  rareChanceMult,
  taskRates,
  powerCapacity,
  powerUsed,
  startTask,
  stopTask,
  taskDurationMs,
  xpForLevel,
} from "./engine/engine";
import {
  bar,
  formatBuffs,
  formatBundle,
  formatCredits,
  formatDuration,
  formatMarks,
  formatRates,
  formatReport,
} from "./engine/format";
import { dismissHint, nextHint } from "./engine/hints";
import { exportSave, importSave } from "./engine/migrate";
import { resetState, saveState, takeSaveNotice, update } from "./engine/storage";

import {
  buy,
  canTrade,
  keepCount,
  sell,
  sellEverything,
  sellPrice,
  sellableCount,
  setKeep,
} from "./engine/trade";
import { abandonBounty, acceptBounty, bountyTarget, rerollBoard } from "./engine/bounty";
import { Bounties } from "./bounties-view";
import { buyFromShop } from "./engine/shop";
import { BountyShop } from "./shop-view";
import { areaKills, areaOf, bossLockReason, counterTo, huntsOf, matchup } from "./engine/areas";
import { awayMarkdown, clearAway, topItems } from "./engine/away";
import { emptyReport, mergeReports } from "./engine/report";
import { harvest, harvestAll, plant, ripeCount } from "./engine/hydroponics";
import { Equipment, gearStats } from "./equipment-view";
import { Hydroponics } from "./hydroponics-view";
import { Stats } from "./stats-view";
import { Trade } from "./trade-view";
import {
  BuildingDef,
  BuildingId,
  FoodPriority,
  GameState,
  DamageType,
  ItemId,
  Report,
  SkillId,
  TaskDef,
} from "./engine/types";

type View =
  | "overview"
  | SkillId
  | "base"
  | "bounties"
  | "shop"
  | "equipment"
  | "trade"
  | "inventory"
  | "stats";

/** Auto-eat choices: share of max HP, with 0 meaning only when the next fight needs it. */
const EAT_LEVELS: [number, string][] = [
  [0, "Only When Needed"],
  [0.25, "Below 25% HP"],
  [0.5, "Below 50% HP"],
  [0.75, "Below 75% HP"],
];

const RUN_CHOICES = [1, 5, 10, 25, 100];

const SKILL_ICON: Record<SkillId, Icon> = {
  salvaging: Icon.Hammer,
  mining: Icon.Mountain,
  foraging: Icon.Leaf,
  cooking: Icon.MugSteam,
  engineering: Icon.Gear,
  combat: Icon.Shield,
  hydroponics: Icon.Raindrop,
  xenochemistry: Icon.Pill,
};

export default function Command() {
  const [state, setState] = useState<GameState>();
  const [view, setView] = useState<View>("overview");
  const [frame, setFrame] = useState(0);
  const [away, setAway] = useState<Report | null>(null);

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
      const isFirst = first;
      first = false;
      // Whatever the menu bar ticker collected while this window was closed counts as time away.
      let seen: Report | undefined;
      const { state, report } = await update((s, r) => {
        if (isFirst) seen = mergeReports(structuredClone(s.unseen ?? emptyReport()), r);
        return clearAway(s);
      });
      setState(state);
      // The first tick covers time spent away, so show it even when it is quiet.
      if (seen && seen.elapsedMs > 60_000) {
        setAway(seen);
        await showToast({
          style: Toast.Style.Success,
          title: `While you were away (${formatDuration(seen.elapsedMs)})`,
          message:
            [
              ...(Object.keys(seen.rare).length ? [`★ ${formatBundle(seen.rare)}`] : []),
              topItems(seen),
              ...seen.levelUps.map((u) => `${SKILL_BY_ID[u.skill].name} ${u.level}`),
            ]
              .filter(Boolean)
              .join(" · ") ||
            seen.stoppedReason ||
            "Nothing happened",
        });
      } else {
        notify(report);
      }
      const hint = nextHint(state);
      if (hint && !report.levelUps.length && !report.stoppedReason && !report.notices.length) {
        await showToast({ style: Toast.Style.Success, title: "Tip", message: hint.text });
        setState((await update((s) => dismissHint(s, hint.id))).state);
      }
    };
    takeSaveNotice().then((notice) => {
      if (notice)
        showToast({
          style: Toast.Style.Failure,
          title: "Your save could not be read",
          message: `${notice}. A copy was kept and a new game started.`,
        });
    });
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
          <List.Dropdown.Item title="Equipment" value="equipment" icon={Icon.Shield} />
          <List.Dropdown.Item title="Trade" value="trade" icon={Icon.Coins} />
          <List.Dropdown.Item title="Bounties" value="bounties" icon={Icon.Flag} />
          <List.Dropdown.Item title="Bounty Shop" value="shop" icon={Icon.Cart} />
          <List.Dropdown.Item title="Inventory" value="inventory" icon={Icon.Box} />
          <List.Dropdown.Item title="Stats" value="stats" icon={Icon.BarChart} />
        </List.Dropdown>
      }
    >
      {view === "overview" && (
        <Overview
          state={state}
          away={away}
          onDismissAway={() => setAway(null)}
          frame={frame}
          onStop={() => sync(stopTask)}
          onOpen={setView}
          onReset={reset}
          onExport={exportToClipboard}
          onImport={importFromClipboard}
          onSettings={(change) => sync(change)}
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
      {view === "bounties" && (
        <Bounties
          state={state}
          onAccept={(id, start) =>
            act(
              (s) => {
                const accepted = acceptBounty(s, id);
                const target = s.board.offers.find((o) => o.id === id);
                return start && !accepted.error && target
                  ? startTask(accepted.state, target.task)
                  : accepted;
              },
              () => "Bounty accepted",
            )
          }
          onAbandon={() =>
            act(
              (s) => abandonBounty(s),
              () => "Bounty abandoned",
            )
          }
          onReroll={() =>
            act(
              (s) => rerollBoard(s),
              () => "The board has new bounties",
            )
          }
          onHunt={(taskId) => act((s) => startTask(s, taskId))}
        />
      )}
      {view === "equipment" && (
        <Equipment
          state={state}
          onEquip={(id) =>
            act(
              (s) => equip(s, id),
              () => `Equipped ${ITEMS[id].name}`,
            )
          }
          onUnequip={(slot) => sync((s) => unequip(s, slot))}
        />
      )}
      {view === "shop" && (
        <BountyShop
          state={state}
          onBuy={(id) =>
            act(
              (s) => buyFromShop(s, id),
              (r) => `Bought ${ITEMS[id].name} for ${formatMarks(r.cost ?? 0)}`,
            )
          }
        />
      )}
      {view === "inventory" && (
        <Inventory
          state={state}
          onEat={(id) => act((s) => eat(s, id))}
          onEquip={(id) =>
            act(
              (s) => equip(s, id),
              () => `Equipped ${ITEMS[id].name}`,
            )
          }
          onDrink={(id) =>
            act(
              (s) => drink(s, id),
              () => `Drank ${ITEMS[id].name}`,
            )
          }
          onSell={(id, qty) =>
            act(
              (s) => sell(s, id, qty),
              (r) => `Sold ${r.amount}× ${ITEMS[id].name} for ${formatCredits(r.credits ?? 0)}`,
            )
          }
          onSellEverything={sellEverythingConfirmed}
          onKeep={(id, n) => sync((s) => setKeep(s, id, n))}
        />
      )}
      {view === "stats" && <Stats state={state} />}
      {view === "hydroponics" && (
        <Hydroponics
          state={state}
          onPlant={(index, crop) =>
            act(
              (s) => plant(s, index, crop),
              () => `Planted ${CROP_BY_ID[crop].name}`,
            )
          }
          onHarvest={(index) =>
            act(
              (s) => harvest(s, index),
              (r) => `Harvested ${formatBundle(r.report?.items)}`,
            )
          }
          onHarvestAll={() =>
            act(
              (s) => harvestAll(s),
              (r) => `Harvested ${formatBundle(r.items)}`,
            )
          }
        />
      )}
      {SKILLS.some((s) => s.id === view) && view !== "hydroponics" && (
        <Tasks
          state={state}
          skill={view as SkillId}
          frame={frame}
          onStart={(id, runs) => act((s) => startTask(s, id, runs))}
          onStop={() => sync(stopTask)}
        />
      )}
    </List>
  );

  async function exportToClipboard() {
    if (!state) return;
    await Clipboard.copy(exportSave(state));
    await showToast({ style: Toast.Style.Success, title: "Save copied to clipboard" });
  }

  async function importFromClipboard() {
    const { state: imported, error } = importSave((await Clipboard.readText()) ?? "");
    if (!imported) {
      await showToast({ style: Toast.Style.Failure, title: error ?? "Import failed" });
      return;
    }
    const ok = await confirmAlert({
      title: "Replace your current game?",
      message: "The save on the clipboard overwrites your progress.",
      primaryAction: { title: "Import", style: Alert.ActionStyle.Destructive },
    });
    if (!ok) return;
    await saveState(imported);
    await sync();
    setView("overview");
    await showToast({ style: Toast.Style.Success, title: "Save imported" });
  }

  async function sellEverythingConfirmed() {
    const ok = await confirmAlert({
      title: "Sell everything?",
      message: "Sells all items you have not set aside with Keep, materials for crafting included.",
      primaryAction: { title: "Sell Everything", style: Alert.ActionStyle.Destructive },
    });
    if (!ok) return;
    await act(
      (s) => sellEverything(s),
      (r) => `Sold everything for ${formatCredits(r.credits ?? 0)}`,
    );
  }

  async function reset() {
    await resetState();
    await sync();
    setView("overview");
  }
}

function notify(report: Report) {
  const found = Object.keys(report.rare).length > 0;
  const lines = [
    ...report.levelUps.map((u) => `${SKILL_BY_ID[u.skill].name} ${u.level}`),
    ...report.bounties.map((b) => `Bounty for ${b.poster}: +${b.marks} Marks`),
    ...(found ? [`Rare find: ${formatBundle(report.rare)}`] : []),
    ...report.notices,
    report.stoppedReason,
  ].filter(Boolean);
  const title = report.stoppedReason
    ? "Task stopped"
    : report.levelUps.length
      ? "Level up!"
      : report.bounties.length
        ? "Bounty complete"
        : found
          ? "Rare find!"
          : report.notices.length
            ? "Contact"
            : report.completed;
  if (!title) return;
  showToast({
    style: report.stoppedReason ? Toast.Style.Failure : Toast.Style.Success,
    title,
    message: lines.join(" · ") || undefined,
  });
}

// --- overview ---------------------------------------------------------------

function Overview(props: {
  state: GameState;
  away: Report | null;
  onDismissAway: () => void;
  frame: number;
  onStop: () => void;
  onOpen: (v: View) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
  onSettings: (change: (s: GameState) => GameState) => void;
}) {
  const { state } = props;
  const task = state.activeTask ? TASK_BY_ID[state.activeTask] : undefined;
  const hpFraction = state.hp / maxHp(state);

  return (
    <>
      {props.away && (
        <List.Section title="While you were away">
          <List.Item
            title={`Away for ${formatDuration(props.away.elapsedMs)}`}
            subtitle={
              props.away.cycles ? `${props.away.cycles.toLocaleString("en-US")} tasks` : undefined
            }
            icon={Icon.Clock}
            accessories={
              Object.keys(props.away.rare).length
                ? [{ tag: { value: "Rare find", color: Color.Orange } }]
                : []
            }
            detail={
              <List.Item.Detail
                markdown={awayMarkdown(
                  props.away,
                  ripeCount(state) > 0 ? [`Hydroponics: ${ripeCount(state)} ready to harvest`] : [],
                )}
              />
            }
            actions={
              <ActionPanel>
                <Action title="Dismiss" icon={Icon.Check} onAction={props.onDismissAway} />
              </ActionPanel>
            }
          />
        </List.Section>
      )}
      <List.Section title="Survivor">
        <List.Item
          title={task ? task.name : "Idle"}
          subtitle={
            task
              ? undefined
              : state.stats.cycles === 0
                ? "Start with Salvaging: Scavenge Hull Scrap"
                : "Pick a skill to get to work"
          }
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
                `Rations: **${count(state, "ration")}** · Credits: **${formatCredits(state.credits)}**${state.board.refreshAt ? ` · ${formatMarks(state.marks)}` : ""}`,
                ...formatBuffs(state).map((line) => `Buff: **${line}**`),
                ...(state.board.active
                  ? [
                      "",
                      `Bounty: hunt ${state.board.active.bounty.count}× ${bountyTarget(state.board.active.bounty).monster?.name} (${state.board.active.progress}/${state.board.active.bounty.count})`,
                    ]
                  : []),
                `Auto-eat: **${EAT_LEVELS.find(([v]) => v === state.settings.eatBelow)?.[1] ?? "Custom"}**, **${state.settings.foodPriority}** food first`,
                ...(task ? ["", preloadMarkdown(state.activeTask)] : []),
              ].join("\n")}
            />
          }
          actions={
            <ActionPanel>
              {task && <Action title="Stop Task" icon={Icon.Stop} onAction={props.onStop} />}
              <ActionPanel.Submenu title="Auto-Eat At" icon={Icon.Heart}>
                {EAT_LEVELS.map(([value, label]) => (
                  <Action
                    key={value}
                    title={label}
                    icon={state.settings.eatBelow === value ? Icon.CheckCircle : Icon.Circle}
                    onAction={() =>
                      props.onSettings((s) => ({
                        ...s,
                        settings: { ...s.settings, eatBelow: value },
                      }))
                    }
                  />
                ))}
              </ActionPanel.Submenu>
              <ActionPanel.Submenu title="Eat First" icon={Icon.Box}>
                {(["weakest", "strongest"] as FoodPriority[]).map((priority) => (
                  <Action
                    key={priority}
                    title={`${priority[0].toUpperCase()}${priority.slice(1)} Food`}
                    icon={state.settings.foodPriority === priority ? Icon.CheckCircle : Icon.Circle}
                    onAction={() =>
                      props.onSettings((s) => ({
                        ...s,
                        settings: { ...s.settings, foodPriority: priority },
                      }))
                    }
                  />
                ))}
              </ActionPanel.Submenu>
              <Action
                title="Copy Save to Clipboard"
                icon={Icon.CopyClipboard}
                onAction={props.onExport}
              />
              <Action
                title="Import Save from Clipboard"
                icon={Icon.Download}
                onAction={props.onImport}
              />
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
  const runs = state.taskRemaining;
  return [
    "```",
    `${bar(state.taskProgressMs / duration)} ${formatDuration(duration - state.taskProgressMs)} left`,
    ...(runs !== null && !task.once ? [`${runs} run${runs === 1 ? "" : "s"} to go`] : []),
    "```",
  ].join("\n");
}

function Tasks(props: {
  state: GameState;
  skill: SkillId;
  frame: number;
  onStart: (id: string, runs?: number) => void;
  onStop: () => void;
}) {
  const { state, skill } = props;
  const level = levelOf(state, skill);

  const item = (task: TaskDef) => {
    const levelLocked = level < task.levelReq;
    const bossLock = bossLockReason(state, task);
    const locked = levelLocked || !!bossLock;
    const active = state.activeTask === task.id;
    const owned =
      task.once &&
      task.outputs &&
      (Object.keys(task.outputs) as ItemId[]).every((id) => count(state, id) > 0);
    return (
      <List.Item
        key={task.id}
        title={task.name}
        icon={locked ? { source: Icon.Lock, tintColor: Color.SecondaryText } : SKILL_ICON[skill]}
        accessories={[
          ...(active ? [{ icon: { source: Icon.Play, tintColor: Color.Green } }] : []),
          ...(task.boss ? [{ tag: { value: "Boss", color: Color.Red } }] : []),
          ...(levelLocked ? [{ tag: `Lv ${task.levelReq}` }] : []),
          ...(bossLock && !levelLocked ? [{ tag: "Locked" }] : []),
          ...(owned ? [{ tag: { value: "Owned", color: Color.Green } }] : []),
        ]}
        detail={<List.Item.Detail markdown={taskMarkdown(state, task, active, props.frame)} />}
        actions={
          <ActionPanel>
            {active ? (
              <Action title="Stop Task" icon={Icon.Stop} onAction={props.onStop} />
            ) : (
              <Action title="Start Task" icon={Icon.Play} onAction={() => props.onStart(task.id)} />
            )}
            {!active && !task.once && (
              <ActionPanel.Submenu title="Run a Set Number" icon={Icon.Repeat}>
                {RUN_CHOICES.map((n) => (
                  <Action key={n} title={`${n}×`} onAction={() => props.onStart(task.id, n)} />
                ))}
              </ActionPanel.Submenu>
            )}
          </ActionPanel>
        }
      />
    );
  };

  if (skill === "combat") {
    return (
      <>
        {AREAS.map((area) => (
          <List.Section
            key={area.id}
            title={area.name}
            subtitle={`${areaKills(state, area)} defeated`}
          >
            {[...huntsOf(area), TASK_BY_ID[area.boss]].map(item)}
          </List.Section>
        ))}
      </>
    );
  }

  return (
    <List.Section title={SKILL_BY_ID[skill].name} subtitle={`Level ${level}`}>
      {TASKS.filter((t) => t.skill === skill).map(item)}
    </List.Section>
  );
}

/** Notes a combat-triangle advantage or disadvantage next to a stat. */
function matchupNote(
  attacker: DamageType | undefined,
  defender: DamageType | undefined,
  side: "deal" | "take",
) {
  const k = matchup(attacker, defender);
  if (k === 1) return "";
  const good = side === "deal" ? k > 1 : k < 1;
  return good ? " (good matchup)" : " (bad matchup)";
}

function taskMarkdown(state: GameState, task: TaskDef, active: boolean, frame: number): string {
  const lines = [artMarkdown(task.id, frame, active), `# ${task.name}`, task.description, ""];
  if (active) lines.push(taskProgress(state, task), "");
  lines.push(`- **Time:** ${formatDuration(taskDurationMs(state, task))}`, `- **XP:** ${task.xp}`);
  const rates = taskRates(state, task);
  lines.push(
    `- **Per hour:** ${formatRates(rates.itemsPerHour)} · ${Math.round(rates.xpPerHour).toLocaleString("en-US")} XP`,
  );
  if (task.monster) lines.push(`- **HP lost per hour:** ~${Math.round(rates.hpLossPerHour)}`);
  if (task.inputs) lines.push(`- **Uses per hour:** ${formatRates(rates.inputsPerHour)}`);
  if (rates.nextLevelMs !== null)
    lines.push(`- **Next level in:** ${formatDuration(rates.nextLevelMs)} nonstop`);
  if (task.rareDrops) {
    const mult = rareChanceMult(state);
    lines.push(
      `- **Rare finds:** ${task.rareDrops
        .map(
          (d) =>
            `${ITEMS[d.item].name} (${+(d.chance * mult * 100).toFixed(2)}% per ${task.monster ? "kill" : "cycle"})`,
        )
        .join(", ")}`,
    );
  }
  if (task.inputs) lines.push(`- **Needs:** ${formatBundle(task.inputs)}`);
  if (task.outputs) lines.push(`- **Makes:** ${formatBundle(task.outputs)}`);
  if (task.monster) {
    const m = task.monster;
    const area = areaOf(task.id);
    const mods = modifiers(state);
    const dealt = damageAgainst(state, task);
    const rounds = Math.ceil(m.hp / dealt);
    const bossLock = bossLockReason(state, task);
    lines.push(
      `- **Kill time:** ${formatDuration(taskDurationMs(state, task))} (${rounds} round${rounds === 1 ? "" : "s"}), then the next one steps up`,
      `- **Enemy:** ${m.name}, ${m.type} (${m.hp} HP, ${m.damage} dmg per hit)`,
      `- **Your damage:** ${dealt} per round${matchupNote(mods.weaponType, m.type, "deal")}`,
      `- **Armor:** ${playerArmor(state)}, hit for ${hitDamage(state, task)}${matchupNote(m.type, mods.armorType, "take")}`,
      `- **Best against it:** ${counterTo(m.type)} weapon and armor`,
      `- **Expected HP loss:** ~${fightDamage(state, task)}`,
      `- **Drops:** ${formatBundle(m.drops)}`,
    );
    if (task.boss) {
      lines.push(
        "",
        bossLock
          ? `**Locked.** ${bossLock}.`
          : "**Boss.** No eating once the fight starts, so heal first. It drops something unique.",
      );
    } else if (area) {
      lines.push(`- **Area:** ${area.name}`);
    }
  }
  if (active) lines.push("", preloadMarkdown(task.id));
  return lines.join("\n");
}

// --- inventory --------------------------------------------------------------

const KEEP_CHOICES = [0, 10, 25, 50, 100];

function Inventory(props: {
  state: GameState;
  onEat: (id: ItemId) => void;
  onDrink: (id: ItemId) => void;
  onEquip: (id: ItemId) => void;
  onSell: (id: ItemId, qty: number | "all") => void;
  onSellEverything: () => void;
  onKeep: (id: ItemId, n: number) => void;
}) {
  const { state } = props;
  const owned = (Object.keys(ITEMS) as ItemId[]).filter((id) => count(state, id) > 0);
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
    <List.Section
      title="Inventory"
      subtitle={`Each item holds up to ${storageCap(state).toLocaleString("en-US")}`}
    >
      {owned.map((id) => {
        const item = ITEMS[id];
        const keep = keepCount(state, id);
        const sellable = sellableCount(state, id);
        return (
          <List.Item
            key={id}
            title={item.name}
            icon={Icon.Box}
            accessories={[
              ...(isEquipped(state, id)
                ? [{ tag: { value: "Equipped", color: Color.Green } }]
                : []),
              ...(keep > 0 && !isGear(id) ? [{ tag: `Keep ${keep}` }] : []),
              {
                text: `×${Math.floor(count(state, id))}`,
                tooltip: isGear(id)
                  ? undefined
                  : `Holds up to ${storageCap(state).toLocaleString("en-US")}`,
              },
            ]}
            detail={
              <List.Item.Detail
                markdown={`# ${item.name}\n${item.description}${item.slot ? `\n\n**${gearStats(id)}**` : ""}${item.unsellable ? "\n\n_The locals will not buy this._" : `\n\nWorth **${formatCredits(sellPrice(state, id))}** each.`}`}
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
                {item.slot && !isEquipped(state, id) && (
                  <Action title="Equip" icon={Icon.Check} onAction={() => props.onEquip(id)} />
                )}
                {item.potion && (
                  <Action title="Drink" icon={Icon.Pill} onAction={() => props.onDrink(id)} />
                )}
                {canTrade(state) && sellable > 0 && (
                  <>
                    <Action title="Sell 1" icon={Icon.Coins} onAction={() => props.onSell(id, 1)} />
                    <Action
                      title={`Sell All (${sellable})`}
                      icon={Icon.Coins}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
                      onAction={() => props.onSell(id, "all")}
                    />
                  </>
                )}
                <ActionPanel.Submenu title="Keep When Selling" icon={Icon.Lock}>
                  {KEEP_CHOICES.map((n) => (
                    <Action
                      key={n}
                      title={n === 0 ? "Keep None" : `Keep ${n}`}
                      icon={(state.keep[id] ?? 0) === n ? Icon.CheckCircle : Icon.Circle}
                      onAction={() => props.onKeep(id, n)}
                    />
                  ))}
                </ActionPanel.Submenu>
                {canTrade(state) && (
                  <Action
                    title="Sell Everything"
                    icon={Icon.Coins}
                    style={Action.Style.Destructive}
                    onAction={props.onSellEverything}
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
        const credits = buildingCredits(state, def.id);
        const costLines = [
          ...(Object.entries(cost) as [ItemId, number][]).map(([id, n]) => {
            const have = Math.floor(count(state, id));
            return `- ${have >= n ? "✅" : "❌"} ${ITEMS[id].name}: ${have}/${n}`;
          }),
          ...(credits
            ? [
                `- ${state.credits >= credits ? "✅" : "❌"} Credits: ${Math.floor(state.credits)}/${credits}`,
              ]
            : []),
        ];
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
                  buildingMarkdown(def.id, level),
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
