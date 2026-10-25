import { Canvas, GROUND_Y, H, hash, Shade, W } from "./canvas";

export interface Scene {
  frames: number;
  /** Frame shown when the task is not running. */
  poster: number;
  draw(c: Canvas, frame: number): void;
}

// --- palettes ---------------------------------------------------------------

const STEEL: Shade = { light: "#aab4c6", mid: "#707b91", dark: "#454d5f" };
const FERRITE: Shade = { light: "#8e96aa", mid: "#5a6277", dark: "#383e50" };
const LUMINA: Shade = { light: "#b8fbff", mid: "#4fd6e8", dark: "#1f8fa8" };
const CRATE: Shade = { light: "#e0b45c", mid: "#b98a3a", dark: "#7c5a24" };
const CAP_A: Shade = { light: "#ff9be6", mid: "#d94fb8", dark: "#8a2a7a" };
const CAP_B: Shade = { light: "#9bffe1", mid: "#2fd6a6", dark: "#1a8a72" };
const STALK: Shade = { light: "#e9e2c8", mid: "#c3b995", dark: "#8c8466" };
const LEAF: Shade = { light: "#8ee86a", mid: "#46b84a", dark: "#25702f" };
const TUBER: Shade = { light: "#ffb877", mid: "#e0743c", dark: "#9a4524" };
const BENCH: Shade = { light: "#7d8aa3", mid: "#56627a", dark: "#343c50" };
const IRON: Shade = { light: "#9aa3b5", mid: "#5d6578", dark: "#2f3544" };
const WOOD = "#8a5a32";
const SPARK = "#ffe27a";

const SKIN_SUIT = {
  H: "#dfe6ee",
  V: "#35d0e8",
  S: "#f08a3c",
  D: "#c0652a",
  B: "#3a3f4f",
  K: "#5b6272",
};
const SURVIVOR = [
  "..HHHHHH..",
  ".HHHHVVVH.",
  ".HHHHVVVH.",
  ".HHHHHHHH.",
  "..SSSSSS..",
  "KKSSSSSSS.",
  "KKSDSSDSS.",
  ".KSSSSSSS.",
  "..SSSSSS..",
  "..SS..SS..",
  "..SS..SS..",
  "..BB..BB..",
];
const SURVIVOR_H = SURVIVOR.length;

// --- backgrounds ------------------------------------------------------------

type Biome = "crash" | "canyon" | "jungle" | "base" | "badlands";

const BIOMES: Record<
  Biome,
  {
    top: string;
    bottom: string;
    ground: string;
    ground2: string;
    mountain: string;
    planet: string;
    ring: string;
  }
> = {
  crash: {
    top: "#0c0a22",
    bottom: "#4a2d63",
    ground: "#6b4a44",
    ground2: "#573a37",
    mountain: "#2a1d44",
    planet: "#e8a65c",
    ring: "#ffd9a0",
  },
  canyon: {
    top: "#080e24",
    bottom: "#27406a",
    ground: "#5d5a6a",
    ground2: "#484655",
    mountain: "#1b2848",
    planet: "#8fb8ff",
    ring: "#d0e4ff",
  },
  jungle: {
    top: "#06201f",
    bottom: "#1f6a5a",
    ground: "#2d5a3a",
    ground2: "#234830",
    mountain: "#0f3a37",
    planet: "#c0f06a",
    ring: "#e8ffb0",
  },
  base: {
    top: "#141a2a",
    bottom: "#141a2a",
    ground: "#2e374c",
    ground2: "#242c3e",
    mountain: "#1a2132",
    planet: "#8fb8ff",
    ring: "#d0e4ff",
  },
  badlands: {
    top: "#240a14",
    bottom: "#7a2f3a",
    ground: "#7a4a3a",
    ground2: "#623a30",
    mountain: "#3e1a26",
    planet: "#ffcf6a",
    ring: "#fff0b0",
  },
};

function mix(a: string, b: string, t: number): string {
  const p = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
  const ch = (i: number) =>
    Math.round(p(a, i) + (p(b, i) - p(a, i)) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

/** Hit flash: the same shades pulled halfway to white. */
function tint(s: Shade): Shade {
  return {
    light: mix(s.light, "#ffffff", 0.6),
    mid: mix(s.mid, "#ffffff", 0.5),
    dark: mix(s.dark, "#ffffff", 0.4),
  };
}

function background(c: Canvas, biome: Biome) {
  const p = BIOMES[biome];
  if (biome === "base") {
    c.rect(0, 0, W, GROUND_Y, p.top);
    for (let x = 0; x < W; x += 16) c.rect(x, 0, 1, GROUND_Y, "#0f1420");
    c.rect(0, 8, W, 1, "#0f1420");
    // window onto the alien sky
    c.rect(44, 4, 16, 12, "#2a3550");
    c.rect(45, 5, 14, 10, "#070a1a");
    for (let i = 0; i < 8; i++) c.set(45 + hash(i, 1) * 14, 5 + hash(i, 2) * 10, "#ffffff");
    c.disc(54, 10, 3, p.planet);
  } else {
    const bands = 8;
    for (let y = 0; y < GROUND_Y; y++) {
      const band = Math.floor((y / GROUND_Y) * bands) / (bands - 1);
      c.rect(0, y, W, 1, mix(p.top, p.bottom, band));
    }
    for (let i = 0; i < 40; i++) {
      const y = hash(i, 3) * 18;
      c.set(hash(i, 4) * W, y, hash(i, 5) > 0.7 ? "#ffffff" : "#8fa0c8");
    }
    // ringed planet
    c.disc(52, 8, 4, p.planet);
    for (let x = -8; x <= 8; x++) c.set(52 + x, 8 + Math.round(x * 0.2), p.ring);
    // distant ridge
    for (let x = 0; x < W; x++) {
      const h = Math.round(4 + 3 * Math.sin(x / 5) + 2 * Math.sin(x / 2.1 + 1));
      c.rect(x, GROUND_Y - h, 1, h, p.mountain);
    }
  }
  c.rect(0, GROUND_Y, W, H - GROUND_Y, p.ground);
  c.rect(0, GROUND_Y, W, 1, mix(p.ground, "#ffffff", 0.25));
  for (let i = 0; i < 26; i++) {
    c.set(hash(i, 9) * W, GROUND_Y + 2 + hash(i, 10) * (H - GROUND_Y - 3), p.ground2);
  }
}

// --- characters and tools ---------------------------------------------------

interface Pose {
  /** Body offset from its resting x. */
  dx?: number;
  /** Hand position relative to the survivor's top-left. */
  hand: [number, number];
}

function survivor(c: Canvas, x: number, pose: Pose): [number, number] {
  const sx = x + (pose.dx ?? 0);
  const top = GROUND_Y - SURVIVOR_H;
  c.sprite(SURVIVOR, SKIN_SUIT, sx, top);
  const hand: [number, number] = [sx + pose.hand[0], top + pose.hand[1]];
  c.line(sx + 8, top + 5, hand[0], hand[1], SKIN_SUIT.D);
  c.set(hand[0], hand[1], SKIN_SUIT.H);
  return hand;
}

type ToolKind = "pick" | "shovel" | "hammer" | "blade" | "knife" | "ladle";

function tool(c: Canvas, kind: ToolKind, [hx, hy]: [number, number], deg: number) {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const len = kind === "blade" ? 11 : kind === "knife" ? 6 : 9;
  const tx = hx + dx * len;
  const ty = hy + dy * len;
  if (kind === "blade") {
    c.line(hx, hy, tx, ty, "#bff6ff");
    c.line(hx + dx * 3, hy + dy * 3, tx, ty, "#ffffff");
    c.line(hx - dy * 2, hy + dx * 2, hx + dy * 2, hy - dx * 2, "#55657f");
    return;
  }
  c.line(hx, hy, tx, ty, WOOD);
  const nx = -dy;
  const ny = dx;
  switch (kind) {
    case "pick":
      c.line(tx - nx * 3, ty - ny * 3, tx + nx * 3, ty + ny * 3, "#c7cfdd");
      c.set(tx + dx, ty + dy, "#ffffff");
      c.set(tx - nx * 3, ty - ny * 3, "#8a93a6");
      c.set(tx + nx * 3, ty + ny * 3, "#8a93a6");
      break;
    case "shovel":
      c.rect(tx - 1, ty - 1, 3, 3, "#c7cfdd");
      c.set(tx + dx * 2, ty + dy * 2, "#c7cfdd");
      break;
    case "hammer":
      c.rect(tx - 2, ty - 1, 4, 3, "#aab4c6");
      c.rect(tx - 2, ty + 1, 4, 1, "#5d6578");
      break;
    case "knife":
      c.line(tx, ty, tx + dx * 4, ty + dy * 4, "#e8f0ff");
      break;
    case "ladle":
      c.disc(tx, ty, 1, "#c7cfdd");
      break;
  }
}

function sparks(c: Canvas, x: number, y: number, frame: number, color = SPARK) {
  const spots = [
    [-2, -3],
    [1, -4],
    [3, -2],
    [-3, 0],
    [2, 1],
    [0, -6],
  ];
  spots.forEach(([dx, dy], i) => {
    if (hash(i, frame, 7) > 0.35)
      c.set(x + dx * (1 + frame * 0.4), y + dy * (1 + frame * 0.3), i % 2 ? "#ffffff" : color);
  });
}

// --- scenes -----------------------------------------------------------------

const SX = 14;

/** Pose and tool angle for each frame of a swing: wind up, swing, hit, recover. */
const SWING: { dx: number; hand: [number, number]; deg: number }[] = [
  { dx: 0, hand: [9, 3], deg: -115 },
  { dx: 0, hand: [10, 4], deg: -50 },
  { dx: 1, hand: [10, 6], deg: -2 },
  { dx: 0, hand: [9, 5], deg: -28 },
];

function swingScene(
  biome: Biome,
  kind: ToolKind,
  target: (c: Canvas, f: number, hit: boolean) => void,
  effectColor = SPARK,
  x = SX,
): Scene {
  return {
    frames: 4,
    poster: 2,
    draw(c, f) {
      background(c, biome);
      const pose = SWING[f];
      target(c, f, f === 2);
      const hand = survivor(c, x, pose);
      tool(c, kind, hand, pose.deg);
      if (f >= 2) sparks(c, hand[0] + 9, hand[1], f - 2, effectColor);
    },
  };
}

function cube(c: Canvas, x: number, y: number, w: number, h: number, shade: Shade, vein?: string) {
  c.block(x, y, w, h, shade);
  if (!vein) return;
  for (let j = 1; j < h - 1; j++)
    for (let i = 1; i < w - 1; i++) if (hash(x + i, y + j) > 0.86) c.set(x + i, y + j, vein);
}

const miningFerrite = swingScene("canyon", "pick", (c, _f, hit) => {
  const o = hit ? 1 : 0;
  cube(c, 35 + o, 22, 11, 8, FERRITE, "#e0743c");
  cube(c, 46 + o, 24, 8, 6, FERRITE, "#e0743c");
  cube(c, 38 + o, 15, 8, 7, FERRITE, "#e0743c");
  cube(c, 54 + o, 26, 5, 4, FERRITE, "#e0743c");
});

const miningLumina = swingScene("canyon", "pick", (c, f, hit) => {
  const o = hit ? 1 : 0;
  cube(c, 36 + o, 14, 5, 16, LUMINA);
  cube(c, 42 + o, 8, 6, 22, LUMINA);
  cube(c, 49 + o, 17, 5, 13, LUMINA);
  c.set(38 + o, 13, LUMINA.light);
  c.set(45 + o, 7, LUMINA.light);
  // pulse
  const glow = f % 2 ? "#e8ffff" : "#7fe9f5";
  for (let i = 0; i < 12; i++) c.set(35 + hash(i, f % 2, 2) * 20, 8 + hash(i, 3) * 20, glow);
});

function salvageScene(target: (c: Canvas, f: number) => void): Scene {
  const flame = [4, 6, 5, 7];
  return {
    frames: 4,
    poster: 1,
    draw(c, f) {
      background(c, "crash");
      target(c, f);
      const hand = survivor(c, SX, { hand: [10, 7] });
      // short torch body then a flickering flame
      tool(c, "ladle", hand, 0);
      const fx = hand[0] + 9;
      c.line(fx, hand[1], fx + flame[f], hand[1], "#bfe9ff");
      c.line(fx, hand[1], fx + flame[f] - 2, hand[1], "#ffffff");
      c.set(fx + flame[f] + 1, hand[1], "#5ec8ff");
      sparks(c, fx + flame[f], hand[1], f % 3, "#ff9a3c");
    },
  };
}

const salvageHull = salvageScene((c) => {
  cube(c, 38, 12, 11, 18, STEEL);
  cube(c, 49, 16, 10, 14, STEEL);
  for (const [x, y] of [
    [40, 14],
    [46, 14],
    [40, 27],
    [46, 27],
    [52, 18],
    [56, 18],
    [52, 27],
    [56, 27],
  ])
    c.set(x, y, "#2c3240");
  for (let i = 0; i < 9; i++) c.set(39 + i, 21, i % 2 ? "#e8b923" : "#2c3240");
  c.rect(37, 24, 2, 1, "#ff9a3c");
});

const salvageWiring = salvageScene((c, f) => {
  cube(c, 38, 14, 16, 16, STEEL);
  c.rect(41, 17, 10, 6, "#0c2a1f");
  for (let i = 0; i < 4; i++) c.rect(42, 18 + i, 2 + ((i + f) % 4) * 2, 1, "#4cff9a");
  c.set(52, 17, f % 2 ? "#ff5a5a" : "#5a1a1a");
  c.line(39, 30, 36, 26, "#ff5a5a");
  c.line(41, 30, 38, 27, "#5ac8ff");
  c.line(44, 30, 43, 28, "#ffe27a");
});

const salvageCargo = salvageScene((c, f) => {
  const lid = f >= 2 ? 2 : 0;
  cube(c, 38, 20, 16, 10, CRATE);
  cube(c, 38, 17 - lid, 16, 4, CRATE);
  c.line(39, 21, 52, 29, CRATE.dark);
  c.line(52, 21, 39, 29, CRATE.dark);
  if (lid) c.rect(41, 19, 10, 1, "#fff3b0");
});

function forageScene(biome: Biome, target: (c: Canvas, f: number) => void, kind: ToolKind): Scene {
  return {
    frames: 4,
    poster: 1,
    draw(c, f) {
      background(c, biome);
      target(c, f);
      const pose = SWING[f];
      const hand = survivor(c, SX, pose);
      tool(c, kind, hand, kind === "knife" ? pose.deg * 0.5 : pose.deg);
      if (f === 2)
        sparks(
          c,
          hand[0] + (kind === "knife" ? 5 : 9),
          hand[1] + 1,
          0,
          kind === "knife" ? "#fff" : "#8a5a32",
        );
    },
  };
}

const forageGlowcap = forageScene(
  "jungle",
  (c, f) => {
    const pulse = f % 2;
    for (const [x, y, w, shade] of [
      [34, 20, 8, CAP_A],
      [43, 16, 10, CAP_B],
      [54, 22, 7, CAP_A],
    ] as [number, number, number, Shade][]) {
      cube(c, x + Math.floor(w / 2) - 1, y + 4, 3, GROUND_Y - y - 4, STALK);
      cube(c, x, y, w, 5, shade);
      const halo = pulse ? shade.light : shade.mid;
      for (let i = 0; i < 6; i++)
        c.set(x - 2 + hash(i, x, f % 2) * (w + 4), y - 3 + hash(i, y, 1) * 4, halo);
    }
  },
  "knife",
);

const forageSweetroot = forageScene(
  "jungle",
  (c, f) => {
    const dig = f >= 2 ? 1 : 0;
    cube(c, 38, 26 - dig, 9, 6, TUBER);
    cube(c, 48, 27 - dig, 7, 5, TUBER);
    for (const x of [37, 41, 45, 49, 53])
      c.line(x + 1, 26 - dig, x + (x % 2 ? -2 : 2), 18 + (x % 3), LEAF.mid);
    for (const [x, y] of [
      [35, 19],
      [43, 17],
      [51, 20],
    ])
      cube(c, x, y, 4, 3, LEAF);
    c.rect(36, GROUND_Y, 22, 2, "#4a3a2a");
  },
  "shovel",
);

function craftScene(target: (c: Canvas, f: number) => void, kind: ToolKind, ladle = false): Scene {
  const hammerPose = SWING;
  const ladleDeg = [-52, -44, -36, -44];
  return {
    frames: 4,
    poster: 2,
    draw(c, f) {
      background(c, "base");
      target(c, f);
      const pose = ladle ? { dx: 0, hand: [10, 7] as [number, number] } : hammerPose[f];
      const hand = survivor(c, 20, pose);
      tool(c, kind, hand, ladle ? ladleDeg[f] : hammerPose[f].deg);
      if (!ladle && f >= 2) sparks(c, hand[0] + 8, hand[1] - 1, f - 2);
    },
  };
}

const craftPot = craftScene(
  (c, f) => {
    cube(c, 36, 25, 14, 5, IRON);
    const flame = ["#ff7a2a", "#ffd23a", "#ff9a3c"];
    for (let i = 0; i < 6; i++) c.rect(37 + i * 2, 24 - ((i + f) % 2), 2, 1, flame[(i + f) % 3]);
    cube(c, 36, 17, 14, 7, STEEL);
    c.rect(37, 17, 12, 1, "#2a2f3c");
    for (let i = 0; i < 4; i++) {
      const t = (f + i) % 4;
      c.set(39 + i * 3 + (t % 2), 14 - t * 2 + 4, "#c9d3e6");
    }
  },
  "ladle",
  true,
);

const craftAnvil = craftScene((c, f) => {
  cube(c, 36, 28, 14, 2, IRON);
  cube(c, 39, 24, 8, 4, IRON);
  cube(c, 35, 21, 16, 3, IRON);
  c.rect(30, 22, 5, 1, IRON.mid);
  const glow = f >= 2 ? "#ffd23a" : "#ff7a2a";
  c.rect(40, 19, 7, 2, glow);
  c.rect(41, 19, 5, 1, "#fff2b0");
}, "hammer");

function craftBench(color: string): Scene {
  return craftScene((c, f) => {
    cube(c, 33, 22, 26, 3, BENCH);
    cube(c, 35, 25, 3, 5, BENCH);
    cube(c, 54, 25, 3, 5, BENCH);
    cube(c, 38, 19, 8, 3, IRON);
    // hologram of the item being built
    const s = f % 2 ? 7 : 6;
    const x = 46;
    const y = 8;
    c.rect(x, y, s, 1, color);
    c.rect(x, y + s - 1, s, 1, color);
    c.rect(x, y, 1, s, color);
    c.rect(x + s - 1, y, 1, s, color);
    c.line(x, y, x + s - 1, y + s - 1, color);
    c.line(x + s - 1, y, x, y + s - 1, color);
    c.line(50, y + s + 1, 50, 19, "#56627a");
    for (let i = 0; i < 5; i++)
      c.set(x - 2 + hash(i, f, 3) * 12, y - 2 + hash(i, f, 4) * 12, "#ffffff");
  }, "hammer");
}

function fightScene(
  monster: (c: Canvas, f: number, mx: number, flash: boolean) => void,
  mx = 42,
): Scene {
  const poses = [
    { dx: 0, hand: [10, 6] as [number, number], deg: -30 },
    { dx: -1, hand: [9, 4] as [number, number], deg: -75 },
    { dx: 4, hand: [10, 6] as [number, number], deg: 5 },
    { dx: 0, hand: [10, 6] as [number, number], deg: -30 },
  ];
  return {
    frames: 4,
    poster: 0,
    draw(c, f) {
      background(c, "badlands");
      const pose = poses[f];
      monster(c, f, mx + (f === 2 ? 2 : f === 3 ? -2 : 0), f === 2);
      const hand = survivor(c, SX, pose);
      tool(c, "blade", hand, pose.deg);
      if (f === 2) {
        // slash arc
        for (let i = 0; i < 9; i++) {
          const a = (-70 + i * 16) * (Math.PI / 180);
          c.set(hand[0] + 6 + Math.cos(a) * 9, hand[1] + Math.sin(a) * 9, "#ffffff");
        }
        sparks(c, mx - 1, hand[1], 0, "#ff5a5a");
      }
      if (f === 3) c.rect(SX + 2, GROUND_Y - SURVIVOR_H + 2, 6, 1, "#ff5a5a");
    },
  };
}

const SKITTER = { light: "#b86ae0", mid: "#7a3fa8", dark: "#46225f" };
const fightSkitter = fightScene((c, f, mx, flash) => {
  const shade = flash ? tint(SKITTER) : SKITTER;
  for (let i = 0; i < 3; i++) {
    const lift = (i + f) % 2;
    c.line(mx + 2 + i * 3, GROUND_Y - 6, mx + i * 3 - 1, GROUND_Y - lift, SKITTER.dark);
    c.line(mx + 3 + i * 3, GROUND_Y - 6, mx + 5 + i * 3, GROUND_Y - 1 + lift, SKITTER.dark);
  }
  cube(c, mx, GROUND_Y - 11, 12, 6, shade);
  cube(c, mx - 4, GROUND_Y - 10, 5, 5, shade);
  c.set(mx - 3, GROUND_Y - 9, "#ff4a4a");
  c.set(mx - 3, GROUND_Y - 7, "#ff4a4a");
  c.line(mx - 3, GROUND_Y - 11, mx - 6, GROUND_Y - 14, SKITTER.dark);
}, 40);

const STALKER = { light: "#e09a62", mid: "#a8603a", dark: "#5e3322" };
const fightStalker = fightScene((c, f, mx, flash) => {
  const shade = flash ? tint(STALKER) : STALKER;
  for (const [i, x] of [0, 4, 10, 14].entries())
    cube(c, mx + x, GROUND_Y - 6 + ((i + f) % 2), 3, 6 - ((i + f) % 2), STALKER);
  cube(c, mx, GROUND_Y - 15, 18, 9, shade);
  cube(c, mx - 7, GROUND_Y - 18, 9, 8, shade);
  c.set(mx - 5, GROUND_Y - 15, "#ffe23a");
  c.set(mx - 2, GROUND_Y - 15, "#ffe23a");
  c.rect(mx - 6, GROUND_Y - 11, 1, 2, "#ffffff");
  c.rect(mx - 3, GROUND_Y - 11, 1, 2, "#ffffff");
  c.line(mx + 18, GROUND_Y - 12, mx + 21, GROUND_Y - 18 - (f % 2), STALKER.dark);
  for (let i = 0; i < 3; i++) c.set(mx + 4 + i * 4, GROUND_Y - 15 + 1, STALKER.dark);
}, 38);

const WRAITH = [
  "...WWWW...",
  "..WWWWWW..",
  ".WWWWWWWW.",
  ".WEWWWWEW.",
  ".WWWWWWWW.",
  ".WWWCCWWW.",
  ".WWWCCWWW.",
  ".WWWWWWWW.",
  "..WWWWWW..",
  "..WWWWWW..",
];
const fightWraith = fightScene((c, f, mx, flash) => {
  const bob = f % 2 ? -1 : 0;
  const base = GROUND_Y - 22 + bob;
  const body = flash ? mix("#8d6bd6", "#ffffff", 0.6) : "#8d6bd6";
  const pal = { W: body, E: "#ffffff", C: "#ff4ad8" };
  c.sprite(WRAITH, pal, mx, base);
  // ragged hem
  for (let i = 0; i < 10; i += 2) c.rect(mx + i + (f % 2), base + 10, 1, 3 + ((i + f) % 3), body);
  for (let i = 0; i < 8; i++)
    c.set(mx - 3 + hash(i, f, 5) * 16, base - 2 + hash(i, f, 6) * 16, "#b9a0ff");
}, 42);

const camp: Scene = {
  frames: 4,
  poster: 0,
  draw(c, f) {
    background(c, "crash");
    // wrecked hull on the horizon
    cube(c, 44, 18, 12, 12, { light: "#3b3358", mid: "#2a2340", dark: "#1a1530" });
    cube(c, 38, 24, 8, 6, { light: "#3b3358", mid: "#2a2340", dark: "#1a1530" });
    c.line(44, 18, 50, 12, "#2a2340");
    // fire
    const flame = ["#ff7a2a", "#ffd23a", "#ff9a3c"];
    cube(c, 28, 28, 7, 2, { light: "#8a5a32", mid: "#6a4224", dark: "#3a2414" });
    for (let i = 0; i < 4; i++)
      c.rect(
        29 + i * 2 - (i === 3 ? 1 : 0),
        26 - ((i + f) % 3),
        2,
        2 + ((i + f) % 3),
        flame[(i + f) % 3],
      );
    c.set(30 + (f % 3), 21 - f, "#ffe27a");
    survivor(c, 12, { hand: [8, 7] });
  },
};

// --- lookup -----------------------------------------------------------------

const SCENES: Record<string, Scene> = {
  mine_ferrite: miningFerrite,
  mine_lumina: miningLumina,
  salvage_hull: salvageHull,
  salvage_wiring: salvageWiring,
  salvage_cargo: salvageCargo,
  forage_glowcap: forageGlowcap,
  forage_sweetroot: forageSweetroot,
  craft_ration: craftPot,
  craft_alloy: craftAnvil,
  craft_torch: craftBench("#ff9a3c"),
  craft_harvest_kit: craftBench("#7bf29a"),
  craft_drill: craftBench("#5ec8ff"),
  craft_blade: craftBench("#9ad0ff"),
  craft_armor: craftBench("#d0d8e8"),
  fight_skitter: fightSkitter,
  fight_stalker: fightStalker,
  fight_wraith: fightWraith,
};

export const sceneFor = (taskId: string | null | undefined): Scene =>
  (taskId && SCENES[taskId]) || camp;
