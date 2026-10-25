import { BuildingId } from "../engine/types";
import { buildingSvg } from "./buildings";
import { sceneFor } from "./scenes";
import { toDataUri } from "./util";

const cache = new Map<string, string>();

export const FRAME_MS = 250;

/** Markdown image for a frame of a task's scene. A null task is the idle camp. */
export function artMarkdown(
  taskId: string | null | undefined,
  frame: number,
  animate: boolean,
): string {
  const scene = sceneFor(taskId);
  const f = animate ? frame % scene.frames : scene.poster;
  const key = `${taskId ?? "camp"}:${f}`;
  return `![](${uriFor(scene, key, f)})`;
}

/** Markdown image for a Base building at a level (0 is the dimmed blueprint). Static. */
export function buildingMarkdown(id: BuildingId, level: number): string {
  const key = `building:${id}:${level}`;
  let uri = cache.get(key);
  if (!uri) {
    uri = toDataUri(buildingSvg(id, level));
    cache.set(key, uri);
  }
  return `![](${uri})`;
}

/**
 * Every frame of a scene as full-size images. Put this at the very end of the markdown, below
 * the fold: Raycast flashes the pane the first time it shows an image it has not loaded yet, so
 * having all frames present from the first render means the swaps are already cached.
 */
export function preloadMarkdown(taskId: string | null | undefined): string {
  const scene = sceneFor(taskId);
  return Array.from(
    { length: scene.frames },
    (_, i) => `![](${uriFor(scene, `${taskId ?? "camp"}:${i}`, i)})`,
  ).join("\n\n");
}

function uriFor(scene: ReturnType<typeof sceneFor>, key: string, f: number): string {
  let uri = cache.get(key);
  if (!uri) {
    uri = toDataUri(scene.svg(f));
    cache.set(key, uri);
  }
  return uri;
}

export { sceneFor };
