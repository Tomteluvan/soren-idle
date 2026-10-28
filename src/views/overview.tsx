import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { artMarkdown, preloadMarkdown } from "../art";
import { SKILLS, TASK_BY_ID } from "../engine/data";
import { count, levelOf, maxHp, xpForLevel } from "../engine/engine";
import { bar, formatBuffs, formatCredits, formatDuration, formatMarks } from "../engine/format";
import { bountyTarget } from "../engine/bounty";
import { awayMarkdown } from "../engine/away";
import { ripeCount } from "../engine/hydroponics";
import { FoodPriority, GameState, Report } from "../engine/types";
import { EAT_LEVELS, SKILL_ICON, View } from "./constants";
import { taskProgress } from "./tasks";

// --- overview ---------------------------------------------------------------

export function Overview(props: {
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
              <ActionPanel.Submenu title="Auto-Eat at" icon={Icon.Heart}>
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
