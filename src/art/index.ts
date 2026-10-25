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
  let uri = cache.get(key);
  if (!uri) {
    uri = toDataUri(scene.svg(f));
    cache.set(key, uri);
  }
  return `![](${uri})`;
}

export { sceneFor };
