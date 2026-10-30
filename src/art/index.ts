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

function uriFor(scene: ReturnType<typeof sceneFor>, key: string, f: number): string {
  let uri = cache.get(key);
  if (!uri) {
    uri = toDataUri(scene.svg(f));
    cache.set(key, uri);
  }
  return uri;
}

export { sceneFor };
