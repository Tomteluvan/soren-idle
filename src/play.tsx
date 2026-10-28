import { Alert, Clipboard, confirmAlert, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { FRAME_MS } from "./art";
import { CROP_BY_ID, ITEMS, SKILLS, SKILL_BY_ID } from "./engine/data";
import { build, drink, eat, equip, unequip, startTask, stopTask } from "./engine/engine";
import { formatBundle, formatCredits, formatDuration, formatMarks } from "./engine/format";
import { dismissHint, nextHint } from "./engine/hints";
import { exportSave, importSave } from "./engine/migrate";
import { resetState, saveState, takeSaveNotice, update } from "./engine/storage";

import { buy, sell, sellEverything, setKeep } from "./engine/trade";
import { abandonBounty, acceptBounty, rerollBoard } from "./engine/bounty";
import { Bounties } from "./views/bounties";
import { buyFromShop } from "./engine/shop";
import { BountyShop } from "./views/shop";
import { clearAway, topItems } from "./engine/away";
import { emptyReport, mergeReports } from "./engine/report";
import { harvest, harvestAll, plant } from "./engine/hydroponics";
import { Equipment } from "./views/equipment";
import { Hydroponics } from "./views/hydroponics";
import { Stats } from "./views/stats";
import { Trade } from "./views/trade";
import { Base } from "./views/base";
import { SKILL_ICON, View } from "./views/constants";
import { Inventory } from "./views/inventory";
import { Overview } from "./views/overview";
import { Tasks } from "./views/tasks";
import { GameState, Report } from "./engine/types";

/** Auto-eat choices: share of max HP, with 0 meaning only when the next fight needs it. */

export default function Command() {
  const [state, setState] = useState<GameState>();
  const [view, setView] = useState<View>("overview");
  const [frame, setFrame] = useState(0);
  const [away, setAway] = useState<Report | null>(null);
  const [search, setSearch] = useState("");

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

  // Typing a search looks through every task, item and building, whatever section is open.
  const searching = search.trim().length > 0;
  const taskSkills = SKILLS.map((k) => k.id).filter((id) =>
    id === "hydroponics" ? false : searching || id === view,
  );

  return (
    <List
      isShowingDetail
      filtering={{ keepSectionOrder: true }}
      onSearchTextChange={setSearch}
      searchBarPlaceholder="Search tasks, items and buildings"
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
      {!searching && view === "overview" && (
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
      {(searching || view === "base") && (
        <Base state={state} onBuild={(id) => act((s) => build(s, id))} />
      )}
      {!searching && view === "trade" && (
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
      {!searching && view === "bounties" && (
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
      {!searching && view === "equipment" && (
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
      {!searching && view === "shop" && (
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
      {(searching || view === "inventory") && (
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
      {!searching && view === "stats" && <Stats state={state} />}
      {!searching && view === "hydroponics" && (
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
      {taskSkills.map((skill) => (
        <Tasks
          key={skill}
          state={state}
          skill={skill}
          frame={frame}
          onStart={(id, runs) => act((s) => startTask(s, id, runs))}
          onStop={() => sync(stopTask)}
        />
      ))}
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
