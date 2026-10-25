import { hash } from "./util";

/**
 * "Ship terminal" art style: a black CRT with one phosphor blue, flat fills, and no tonal shading at all
 * (volume comes from outlines and negative space). Scanlines and static sit on top of everything.
 *
 * This file is the shared screen: palette, helpers, the tool library and the frame every scene is drawn in.
 * What is on the screen lives in subjects.ts, and which task shows what lives in scenes.ts.
 */

export const W = 320;
export const H = 200;
export const GROUND = 158;

export const INK = {
  bg: "#02060f",
  ui: "#3d8bff",
  dim: "#1b4f94",
  ore: "#8fd6ff",
  white: "#eaf6ff",
  glow: "#6ec8ff",
} as const;

const FONT = "Menlo, Monaco, 'Courier New', monospace";

export type Pt = [number, number];
export const pts = (list: Pt[]) => list.map(([x, y]) => `${x},${y}`).join(" ");

/** A flat polygon with a dark outline, the basic building block of every subject. */
export const poly = (points: Pt[], fill: string = INK.ore, stroke: string = INK.bg, width = 1.5) =>
  `<polygon points="${pts(points)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="miter"/>`;

export const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string = INK.ore,
  stroke = "none",
  width = 1.5,
) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;

export const stroke = (d: string, color: string = INK.bg, width = 2) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="miter"/>`;

export function text(
  x: number,
  y: number,
  size: number,
  content: string,
  fill: string = INK.ui,
  extra = "",
): string {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${FONT}" font-size="${size}" font-weight="700" letter-spacing="1" ${extra}>${content}</text>`;
}

// --- tools ----------------------------------------------------------------------

export type ToolKind = "pick" | "hammer" | "cutter" | "spade" | "ladle" | "blade" | "torch";

interface ToolDef {
  /** Where the working end is, in the tool's own coordinates (pointing right, grip at the origin). */
  tip: Pt;
  parts(): string;
}

const EDGE = `stroke="${INK.bg}" stroke-width="1.5" stroke-linejoin="miter"`;
const white = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${INK.white}" ${EDGE}/>`;

/** A ribbed haft with a grip, running from behind the origin out to `end`. */
function haft(end: number): string {
  let ribs = "";
  for (let x = -60; x < end - 80; x += 14) ribs += rect(x, -4, 3, 8, INK.dim);
  return white(-90, -3, end + 90, 6) + ribs + white(-12, -5, 42, 10);
}

/** The power housing most tools carry near the head: a chamfered block with a glowing cell. */
function housing(end: number): string {
  const p: Pt[] = [
    [end - 34, -9],
    [end - 62, -9],
    [end - 68, -5],
    [end - 68, 5],
    [end - 62, 9],
    [end - 34, 9],
  ];
  return (
    poly(p, INK.white) + rect(end - 62, -3, 22, 6, INK.glow) + rect(end - 59, -1, 16, 2, "#fff")
  );
}

/** An original design: no tool here is borrowed from another game or from a real-world pickaxe. */
const TOOL_DEFS: Record<ToolKind, ToolDef> = {
  // Pulse pick: hammer face on top of the head, long drill spike below.
  pick: {
    tip: [130, 36],
    parts: () => {
      const L = 130;
      const spike: Pt[] = [
        [L + 6, 8],
        [L - 6, 8],
        [L - 3, 26],
        [L + 1, 36],
        [L + 5, 26],
      ];
      return [
        haft(L),
        housing(L),
        white(L - 13, -17, 22, 26),
        rect(L + 4, -17, 5, 26, INK.dim),
        poly(spike, INK.white),
        stroke(`M${L} 10V32`, INK.glow),
      ].join("");
    },
  },
  // Impact hammer: a heavy block head with a glowing striking band.
  hammer: {
    tip: [120, 17],
    parts: () => {
      const L = 120;
      return [
        haft(L),
        housing(L),
        white(L - 16, -18, 32, 34),
        rect(L + 10, -18, 6, 34, INK.dim),
        rect(L - 16, 11, 32, 4, INK.glow),
      ].join("");
    },
  },
  // Sample cutter: a wide triangular blade with a glowing edge, for plants.
  cutter: {
    tip: [112, 36],
    parts: () => {
      const L = 112;
      return [
        haft(L),
        housing(L),
        white(L - 10, -8, 20, 14),
        poly(
          [
            [L - 12, 6],
            [L + 12, 6],
            [L + 3, 36],
          ],
          INK.white,
        ),
        stroke(`M${L + 10} 8L${L + 3} 33`, INK.glow),
      ].join("");
    },
  },
  // Spade: a wide scoop for digging.
  spade: {
    tip: [112, 40],
    parts: () => {
      const L = 112;
      return [
        haft(L),
        white(L - 8, -8, 16, 14),
        poly(
          [
            [L - 12, 6],
            [L + 14, 6],
            [L + 12, 30],
            [L + 1, 40],
            [L - 10, 30],
          ],
          INK.white,
        ),
        stroke(`M${L} 10V34`, INK.dim),
      ].join("");
    },
  },
  // Ladle: a long handle with a small bowl.
  ladle: {
    tip: [100, 22],
    parts: () => {
      const L = 100;
      return [
        haft(L),
        poly(
          [
            [L - 14, 6],
            [L + 14, 6],
            [L + 10, 20],
            [L, 25],
            [L - 10, 20],
          ],
          INK.white,
        ),
        stroke(`M${L - 10} 10H${L + 10}`, INK.glow),
      ].join("");
    },
  },
  // Energy blade: a hilt, a guard and a thin glowing blade.
  blade: {
    tip: [128, 0],
    parts: () => {
      const blade: Pt[] = [
        [14, -4],
        [112, -3],
        [128, 0],
        [112, 3],
        [14, 4],
      ];
      return [
        white(-40, -4, 46, 8),
        rect(-30, -4, 3, 8, INK.dim),
        rect(-18, -4, 3, 8, INK.dim),
        white(6, -10, 8, 20),
        poly(blade, INK.white),
        stroke("M18 0H118", INK.glow, 2),
      ].join("");
    },
  },
  // Cutting torch: a tank, a body and a nozzle. The beam is drawn by the scene.
  torch: {
    tip: [82, 0],
    parts: () => {
      const nozzle: Pt[] = [
        [62, -7],
        [82, -3],
        [82, 3],
        [62, 7],
      ];
      return [
        white(-40, -6, 104, 12),
        rect(-20, -6, 3, 12, INK.dim),
        rect(-8, -6, 3, 12, INK.dim),
        white(14, -17, 36, 11),
        rect(18, -14, 28, 2, INK.glow),
        poly(nozzle, INK.white),
        rect(60, -7, 3, 14, INK.glow),
      ].join("");
    },
  },
};

function rotate([x, y]: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/** Draws a tool whose working end lands on `at` when it is rotated by `hitAngle`, shown at `angle`. */
export function tool(kind: ToolKind, at: Pt, angle: number, hitAngle: number): string {
  const def = TOOL_DEFS[kind];
  const [rx, ry] = rotate(def.tip, hitAngle);
  return `<g transform="translate(${(at[0] - rx).toFixed(1)} ${(at[1] - ry).toFixed(1)}) rotate(${angle})">${def.parts()}</g>`;
}

// --- effects --------------------------------------------------------------------

export type Effect = "impact" | "sparks" | "slash" | "none";

/** Flying chips, optionally with a shock ring. Only drawn once the tool has landed. */
export function effect(kind: Effect, at: Pt, frame: number, color: string = INK.ore): string {
  if (kind === "none" || frame < 2) return "";
  const [cx, cy] = at;
  const grow = frame === 2 ? 1 : 1.9;
  let out = "";
  if (kind === "impact") {
    const r = 9 * grow;
    out += `<polygon points="${pts([
      [cx, cy - r],
      [cx + r, cy],
      [cx, cy + r],
      [cx - r, cy],
    ])}" fill="none" stroke="${INK.white}" stroke-width="${frame === 2 ? 2 : 1}"/>`;
  }
  if (kind === "slash") {
    const r = 26 * grow;
    out += stroke(
      `M${cx - r * 0.6} ${cy - r}Q${cx + r * 0.8} ${cy - r * 0.2} ${cx - r * 0.2} ${cy + r}`,
      INK.white,
      frame === 2 ? 3 : 1,
    );
  }
  const count = kind === "slash" ? 6 : 9;
  for (let i = 0; i < count; i++) {
    const a = (-175 + i * (kind === "sparks" ? 16 : 21)) * (Math.PI / 180);
    const d = (14 + hash(i, frame, 21) * 14) * grow;
    const s = hash(i, frame, 22) > 0.5 ? 3 : 2;
    out += rect(
      Number((cx + Math.cos(a) * d).toFixed(1)),
      Number((cy + Math.sin(a) * d).toFixed(1)),
      s,
      s,
      i % 3 ? color : INK.white,
    );
  }
  return out;
}

// --- screen furniture ----------------------------------------------------------

function floorGrid(): string {
  let out = "";
  for (const y of [GROUND, GROUND + 5, GROUND + 11, GROUND + 19, GROUND + 29]) {
    out += stroke(`M10 ${y}H310`, INK.dim, 1);
  }
  for (let i = -9; i <= 9; i++) {
    out += stroke(`M${160 + i * 18} ${GROUND}L${160 + i * 34} ${GROUND + 29}`, INK.dim, 1);
  }
  return out;
}

/** Scanlines, static and a rolling bar. Deterministic per frame. */
function crt(frame: number): string {
  let out = `<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  for (let i = 0; i < 140; i++) {
    const x = hash(i, frame, 11) * W;
    const y = hash(i, frame, 12) * H;
    const w = 2 + hash(i, frame, 13) * 16;
    out += `<rect x="${x.toFixed(1)}" y="${Math.floor(y)}" width="${w.toFixed(1)}" height="1" fill="${INK.ui}" opacity="${(0.1 + hash(i, frame, 14) * 0.25).toFixed(2)}"/>`;
  }
  for (let i = 0; i < 80; i++) {
    out += `<rect x="${Math.floor(hash(i, frame, 15) * W)}" y="${Math.floor(hash(i, frame, 16) * H)}" width="1" height="1" fill="${INK.white}" opacity=".5"/>`;
  }
  const roll = (frame * 53 + 20) % (H + 20);
  out += `<rect x="0" y="${roll - 12}" width="${W}" height="12" fill="${INK.ui}" opacity=".07"/>`;
  out += `<rect x="0" y="${roll}" width="${W}" height="1" fill="${INK.ui}" opacity=".2"/>`;
  // an occasional torn line
  if (frame % 2 === 1) {
    const ty = 30 + Math.floor(hash(frame, 1, 17) * 140);
    out += `<rect x="${Math.floor(hash(frame, 2, 17) * 120)}" y="${ty}" width="${120 + Math.floor(hash(frame, 3, 17) * 160)}" height="${2 + (frame % 3)}" fill="${INK.ui}" opacity=".22"/>`;
  }
  return out;
}

// --- scenes ---------------------------------------------------------------------

export interface TerminalScene {
  title: string;
  /** The command line at the bottom, e.g. "MINING". */
  status: string;
  /** Draws the subject for a frame (0 raised, 1 swinging, 2 hit, 3 recoil). */
  subject(frame: number): string;
  /** Where the tool lands. Without a tool, the scene is still life. */
  strike?: Pt;
  tool?: ToolKind;
  /** Tool rotation per frame in degrees, index 2 being the hit. */
  angles?: number[];
  effect?: Effect;
  /** Keeps the tool's working end this far left of `strike`, for tools that act at a distance. */
  reach?: number;
  /** Anything drawn over the tool, such as a torch beam. */
  overlay?(frame: number): string;
  /** Debris colour for the effect. */
  debris?: string;
}

const SWING = [-5, -1, 8, 2];

export function renderScene(scene: TerminalScene, frame: number): string {
  const f = frame % 4;
  const angles = scene.angles ?? SWING;
  const body = [
    floorGrid(),
    scene.subject(f),
    scene.tool && scene.strike
      ? tool(
          scene.tool,
          [scene.strike[0] - (scene.reach ?? 0), scene.strike[1]],
          angles[f],
          angles[2],
        )
      : "",
    scene.strike ? effect(scene.effect ?? "impact", scene.strike, f, scene.debris) : "",
    scene.overlay?.(f) ?? "",
  ].join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">`,
    `<defs><clipPath id="screen"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="4"/></clipPath><pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" y="2" fill="#000" opacity=".4"/></pattern></defs>`,
    `<rect width="${W}" height="${H}" fill="${INK.bg}"/>`,
    `<g clip-path="url(#screen)">${body}</g>`,
    `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="5" fill="none" stroke="${INK.ui}" stroke-width="2"/>`,
    text(W - 14, 24, 14, scene.title, INK.ui, 'text-anchor="end"'),
    text(14, H - 12, 9, `&gt; ${scene.status}`, INK.ui),
    `<rect x="${14 + (scene.status.length + 2) * 6.4}" y="${H - 20}" width="6" height="9" fill="${INK.ui}" opacity="${f % 2 ? 1 : 0.15}"/>`,
    crt(f),
    `</svg>`,
  ].join("");
}
