import { ITEMS, SKILL_BY_ID } from "./data";
import { Bundle, ItemId, Report } from "./types";

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  if (m < 60) return `${m}m ${total % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function bar(fraction: number, width = 20): string {
  const filled = Math.round(Math.min(1, Math.max(0, fraction)) * width);
  return "▰".repeat(filled) + "▱".repeat(width - filled);
}

export function formatBundle(bundle: Bundle = {}): string {
  const parts = (Object.entries(bundle) as [ItemId, number][]).map(([id, n]) => `${n}× ${ITEMS[id].name}`);
  return parts.length ? parts.join(", ") : "nothing";
}

export function formatReport(r: Report): string {
  const parts: string[] = [];
  if (Object.keys(r.items).length) parts.push(`+${formatBundle(r.items)}`);
  for (const up of r.levelUps) parts.push(`${SKILL_BY_ID[up.skill].name} level ${up.level}!`);
  if (r.stoppedReason) parts.push(r.stoppedReason);
  return parts.join(" · ");
}
