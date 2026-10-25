import { Icon, launchCommand, LaunchType, MenuBarExtra } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { SKILL_BY_ID, TASK_BY_ID } from "./engine/data";
import { count, levelOf, maxHp, stopTask } from "./engine/engine";
import { formatReport } from "./engine/format";
import { update } from "./engine/storage";

export default function Command() {
  const { data, isLoading, revalidate } = usePromise(() => update());

  const state = data?.state;
  const task = state?.activeTask ? TASK_BY_ID[state.activeTask] : undefined;
  const title = state
    ? task
      ? `${SKILL_BY_ID[task.skill].name} ${levelOf(state, task.skill)}`
      : "Idle"
    : undefined;

  return (
    <MenuBarExtra isLoading={isLoading} icon="extension-icon.png" title={title} tooltip="Braven Idle">
      {state && (
        <>
          <MenuBarExtra.Section>
            <MenuBarExtra.Item title={task ? task.name : "Idle"} />
            <MenuBarExtra.Item title={`HP ${Math.floor(state.hp)}/${maxHp(state)}`} />
            <MenuBarExtra.Item title={`Rations ${count(state, "ration")}`} />
          </MenuBarExtra.Section>
          {data.report.stoppedReason && (
            <MenuBarExtra.Section>
              <MenuBarExtra.Item title={formatReport(data.report)} />
            </MenuBarExtra.Section>
          )}
          <MenuBarExtra.Section>
            <MenuBarExtra.Item
              title="Open Braven Idle"
              icon={Icon.Rocket}
              onAction={() => launchCommand({ name: "play", type: LaunchType.UserInitiated })}
            />
            {task && (
              <MenuBarExtra.Item
                title="Stop Task"
                icon={Icon.Stop}
                onAction={async () => {
                  await update(stopTask);
                  revalidate();
                }}
              />
            )}
          </MenuBarExtra.Section>
        </>
      )}
    </MenuBarExtra>
  );
}
