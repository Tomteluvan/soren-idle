import { describe, expect, it } from "vitest";
import { TASKS } from "../engine/data";
import { SCENE_IDS, sceneFor } from "./scenes";

describe("terminal art", () => {
  it("has a scene for every task", () => {
    for (const task of TASKS) expect(SCENE_IDS, task.id).toContain(task.id);
  });

  it("renders every frame of every scene, and the idle camp", () => {
    for (const id of [...SCENE_IDS, null]) {
      const scene = sceneFor(id);
      expect(scene.frames).toBe(4);
      for (let frame = 0; frame < scene.frames; frame++) {
        const svg = scene.svg(frame);
        expect(svg.startsWith("<svg"), `${id} frame ${frame}`).toBe(true);
        expect(svg.endsWith("</svg>")).toBe(true);
        expect(svg).not.toMatch(/NaN|undefined|Infinity/);
        // data URIs are re-sent while a task animates, so keep frames small
        expect(svg.length).toBeLessThan(60_000);
      }
    }
  });

  it("is deterministic", () => {
    expect(sceneFor("mine_ferrite").svg(1)).toBe(sceneFor("mine_ferrite").svg(1));
  });

  it("animates", () => {
    const scene = sceneFor("mine_ferrite");
    expect(scene.svg(0)).not.toBe(scene.svg(2));
  });
});
