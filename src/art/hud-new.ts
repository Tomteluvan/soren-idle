import { BLUE, circle, line, P, path, poly, Pt, reticle, text } from "./hud";
import { BENCH, bench, flame, pot, steam } from "./hud-lab";
import { arm, callout, crystal } from "./hud-scenes";
import { hash } from "./util";

const rad = (deg: number) => (deg * Math.PI) / 180;
const wave = (f: number, i: number) => Math.sin(rad(f * 90 + i * 50));

// --- xenofishing -------------------------------------------------------------------

/** A fish side-on at `c`, `s` long, facing right. Fins and a glowing eye grow with `tier`. */
function fish(c: Pt, s: number, tier: number, f: number): string {
  const [x, y] = c;
  const tail = wave(f, 2) * s * 0.08;
  let out = path(
    `M${x - s / 2} ${y}Q${x} ${y - s * 0.3} ${x + s / 2} ${y}Q${x} ${y + s * 0.3} ${x - s / 2} ${y}Z`,
    BLUE.pale,
    1.4,
    "url(#crystal)",
    'fill-opacity=".8"',
  );
  out += poly(
    [
      [x - s / 2, y],
      [x - s * 0.72, y - s * 0.16 + tail],
      [x - s * 0.72, y + s * 0.16 + tail],
    ],
    "url(#hull)",
    BLUE.light,
    1.2,
  );
  for (let i = 0; i <= tier; i++) {
    const fx = x - s * 0.2 + i * s * 0.12;
    out += line([fx, y - s * 0.2], [fx - s * 0.05, y - s * 0.3 - (i % 2) * 4], BLUE.light, 1);
  }
  out += circle([x + s * 0.3, y - s * 0.03], Math.max(2, s * 0.03), "#ffffff", 1, "#ffffff");
  return out;
}

const LAKE = 196;

function lake(f: number): string {
  let out = line([60, LAKE], [580, LAKE], BLUE.pale, 1.8);
  for (let i = 0; i < 6; i++) {
    const y = LAKE + 22 + i * 24;
    let d = `M${70 + i * 12} ${y}`;
    for (let x = 70 + i * 12; x < 560 - i * 14; x += 40) d += `q20 ${wave(f, x / 40 + i) * 6} 40 0`;
    out += path(d, BLUE.line, 1, "none", `opacity="${(0.7 - i * 0.09).toFixed(2)}"`);
  }
  return out;
}

const FISH_SIZE = [54, 66, 84, 112, 170];
const FISH_LABEL = ["MINNOW", "SPARK EEL", "GLOW RAY", "LURKER", "LEVIATHAN"];

export function fishing(tier: number, f: number): string {
  const size = FISH_SIZE[tier];
  const fx = 330 + wave(f, 0) * 16;
  const fy = 280 + wave(f, 3) * 4;
  const bob = wave(f, 1) * 3;
  const tip: Pt = [214, LAKE + bob];
  let out = lake(f);
  out += circle([fx, fy], size * 0.9, BLUE.pale, 0, "url(#flare)", `opacity="${tier >= 2 ? 0.4 : 0.15}"`);
  for (let i = 0; i < 3 + tier; i++) {
    out += fish([fx - 110 - i * 34, fy + (i % 2 ? 26 : -22)], 22 + i * 3, 0, f + i).replace(
      /<path/g,
      '<path opacity=".4"',
    );
  }
  out += fish([fx, fy], size, tier, f);
  // line and float
  out += path(`M470 80Q340 120 ${P(tip)}`, BLUE.pale, 1);
  out += circle([tip[0], tip[1] - 2], 5, BLUE.pale, 1.4, BLUE.bg);
  out += line([tip[0], tip[1] + 4], [fx + size * 0.4, fy - 4], BLUE.light, 0.9, 'stroke-dasharray="4 4"');
  out += arm([470, 80], true);
  out += reticle([fx, fy], size * 0.7 + (f % 2) * 2, f);
  out += callout([fx + size * 0.5, fy - 30], [430, 300], FISH_LABEL[tier]);
  return out;
}

export function fishCook(tier: number, f: number): string {
  const sizes = [26, 34, 44];
  return [
    bench(),
    flame(300, 262, f),
    pot(300, f, "#2d78dc"),
    steam(300, 200, f),
    fish([190, BENCH - 22], sizes[tier] * 1.5, tier, f),
    fish([430, BENCH - 22], sizes[tier] * 1.5, tier, f + 2),
    reticle([300, 246], 60 + (f % 2) * 2, f),
    callout([364, 226], [452, 124], "COOKING"),
  ].join("");
}

// --- smelting ----------------------------------------------------------------------

const INGOT = ["FERRITE", "STEEL", "LUMINA GLASS", "CHITIN ALLOY", "XENO ALLOY"];

function ingot(x: number, y: number, w: number, tier: number): string {
  const h = w * 0.34;
  const top = poly(
    [
      [x + 8, y - h],
      [x + w, y - h],
      [x + w - 8, y],
      [x, y],
    ],
    "url(#plate)",
    BLUE.pale,
    1.3,
  );
  const face = poly(
    [
      [x, y],
      [x + w - 8, y],
      [x + w - 8, y + h * 0.6],
      [x, y + h * 0.6],
    ],
    "url(#hull)",
    BLUE.light,
    1.2,
  );
  return top + face + (tier >= 2 ? line([x + w * 0.3, y - h], [x + w * 0.2, y], BLUE.deep, 1) : "");
}

export function smelting(tier: number, f: number): string {
  const cx = 250;
  const pour = 0.55 + 0.45 * ((f % 2) / 1);
  let out = bench();
  out += flame(cx, 262, f);
  out += poly(
    [
      [cx - 70, 190],
      [cx + 70, 190],
      [cx + 48, 262],
      [cx - 48, 262],
    ],
    "url(#hull)",
    BLUE.light,
    1.6,
  );
  out += `<ellipse cx="${cx}" cy="190" rx="70" ry="11" fill="url(#plate)" fill-opacity=".9" stroke="${BLUE.pale}" stroke-width="1.5"/>`;
  out += steam(cx, 176, f, 2 + (tier > 2 ? 1 : 0));
  // the pour: a stream from the crucible lip into the mould
  out += path(
    `M${cx + 70} 192Q${cx + 110} 200 ${cx + 118} ${BENCH - 30}`,
    "#ffffff",
    2.6,
    "none",
    `opacity="${pour.toFixed(2)}"`,
  );
  out += poly(
    [
      [cx + 92, BENCH - 30],
      [cx + 168, BENCH - 30],
      [cx + 160, BENCH],
      [cx + 100, BENCH],
    ],
    "url(#hull)",
    BLUE.pale,
    1.4,
  );
  const done = 2 + tier;
  for (let i = 0; i < done; i++) out += ingot(400 + (i % 3) * 52, BENCH - 6 - Math.floor(i / 3) * 22, 48, tier);
  if (tier === 2) out += crystal(cx - 20, 186, 26, 9, 0) + crystal(cx + 24, 186, 20, 8, 12);
  out += reticle([cx, 226], 62 + (f % 2) * 2, f);
  out += callout([cx - 70, 200], [80, 120], INGOT[tier]);
  return out;
}

// --- hacking -----------------------------------------------------------------------

const LOCK = ["CACHE LOCK", "VAULT DOOR", "ARCHIVE", "WARDEN CORE", "HEART VAULT"];

export function hacking(tier: number, f: number): string {
  const c: Pt = [320, 204];
  let out = "";
  for (let i = 0; i < 2 + tier; i++) {
    const r = 30 + i * 22;
    const dir = i % 2 ? -1 : 1;
    out += circle(
      c,
      r,
      i === 1 + tier ? BLUE.pale : BLUE.light,
      1.6,
      "none",
      `stroke-dasharray="${10 + i * 5} ${7 + i * 3}" stroke-dashoffset="${dir * f * (8 + i * 3)}"`,
    );
  }
  // the locked bolts around the door, opening one by one as the frames run
  const bolts = 6 + tier * 2;
  const outer = 30 + (1 + tier) * 22 + 20;
  for (let i = 0; i < bolts; i++) {
    const a = rad((360 / bolts) * i);
    const open = (i + f * 2) % bolts < 2 + (f % 3);
    out += circle(
      [c[0] + Math.cos(a) * outer, c[1] + Math.sin(a) * outer],
      4,
      BLUE.pale,
      1.2,
      open ? "#ffffff" : BLUE.bg,
    );
  }
  out += circle(c, 18, BLUE.pale, 1.6, "url(#flare)");
  // a stream of bits down the side
  for (let r = 0; r < 9; r++) {
    let s = "";
    for (let k = 0; k < 8; k++) s += hash(r * 7 + k, f, 13 + tier) > 0.5 ? "1" : "0";
    out += text(96, 92 + r * 13, 9, s, BLUE.mid, `opacity="${r === f * 2 ? 1 : 0.55}"`);
  }
  out += reticle(c, 40 + (f % 2) * 2, f);
  out += callout([c[0] + outer, c[1] - 10], [420, 330], LOCK[tier]);
  return out;
}

// --- exploration -------------------------------------------------------------------

const SURVEY = ["RIDGE", "CANYON", "CAVES", "LAKES", "DEEP WILD"];

export function exploring(tier: number, f: number): string {
  const c: Pt = [320, 204];
  let out = "";
  for (let i = 0; i < 5 + tier; i++) {
    const rx = 40 + i * 38;
    const ry = 22 + i * 21;
    let d = "";
    for (let k = 0; k <= 24; k++) {
      const a = rad(k * 15);
      const w = 1 + (hash(k % 24, i, 5 + tier) - 0.5) * 0.28;
      d += `${k ? "L" : "M"}${(c[0] + Math.cos(a) * rx * w).toFixed(1)} ${(c[1] + Math.sin(a) * ry * w).toFixed(1)}`;
    }
    out += path(
      d + "Z",
      i % 3 === 0 ? BLUE.light : BLUE.line,
      i % 3 === 0 ? 1.3 : 0.9,
      "none",
      `opacity="${(0.95 - i * 0.07).toFixed(2)}"`,
    );
  }
  // the route walked so far, one waypoint more every frame
  const stops: Pt[] = [
    [c[0] - 150, c[1] + 60],
    [c[0] - 70, c[1] + 10],
    [c[0] - 10, c[1] + 50],
    [c[0] + 60, c[1] - 20],
    [c[0] + 130, c[1] - 56],
  ];
  const shown = 2 + (f % 4);
  out += path(`M${stops.slice(0, shown).map(P).join("L")}`, BLUE.pale, 2, "none", 'stroke-dasharray="7 5"');
  stops
    .slice(0, shown)
    .forEach(
      (p, i) => (out += circle(p, i === shown - 1 ? 6 : 3.5, BLUE.pale, 1.4, i === shown - 1 ? "#ffffff" : BLUE.bg)),
    );
  // radar sweep
  const a = rad(f * 90 + 30);
  out += line(c, [c[0] + Math.cos(a) * 200, c[1] + Math.sin(a) * 120], BLUE.light, 1.4, 'opacity=".7"');
  out += reticle(stops[shown - 1], 22 + (f % 2) * 2, f);
  out += callout([c[0] + 90, c[1] + 70], [420, 330], SURVEY[tier]);
  return out;
}

// --- companions --------------------------------------------------------------------

const COMPANION = ["SCRAP HOUND", "SPARK WISP", "LANTERN MOTH", "WARD DRONE", "STAR FAMILIAR"];

function body(tier: number, c: Pt, f: number): string {
  const [x, y] = c;
  const bob = wave(f, 0) * 3;
  const by = y + bob;
  switch (tier) {
    case 0: {
      let out = poly(
        [
          [x - 52, by - 20],
          [x + 38, by - 20],
          [x + 38, by + 20],
          [x - 52, by + 20],
        ],
        "url(#hull)",
        BLUE.pale,
        1.6,
      );
      out += poly(
        [
          [x + 38, by - 14],
          [x + 70, by - 4],
          [x + 70, by + 14],
          [x + 38, by + 20],
        ],
        "url(#plate)",
        BLUE.pale,
        1.6,
      );
      for (const lx of [-40, -14, 14, 38])
        out += line([x + lx, by + 20], [x + lx + wave(f, lx) * 6, by + 54], BLUE.light, 2.4);
      return out + circle([x + 58, by - 2], 3, "#ffffff", 1, "#ffffff");
    }
    case 1: {
      let out = circle([x, by], 24, BLUE.pale, 1.6, "url(#flare)");
      for (let i = 0; i < 6; i++) {
        const a = rad(i * 60 + f * 40);
        out += path(`M${x} ${by}L${P([x + Math.cos(a) * 44, by + Math.sin(a) * 44])}`, "#ffffff", 1.3);
      }
      return out + circle([x, by], 38, BLUE.light, 1, "none", 'stroke-dasharray="6 5"');
    }
    case 2: {
      const flap = [0.4, 1, 0.4, 1][f];
      let out = "";
      for (const k of [-1, 1]) {
        out += poly(
          [
            [x, by],
            [x + k * 70, by - 46 * flap],
            [x + k * 60, by + 28],
            [x + k * 10, by + 20],
          ],
          "url(#crystal)",
          BLUE.pale,
          1.3,
        );
      }
      return (
        out +
        poly(
          [
            [x - 7, by - 22],
            [x + 7, by - 22],
            [x + 7, by + 24],
            [x - 7, by + 24],
          ],
          "url(#hull)",
          BLUE.pale,
          1.4,
        ) +
        circle([x, by + 30], 8, "#ffffff", 1, "url(#flare)")
      );
    }
    case 3: {
      const hex: Pt[] = Array.from({ length: 6 }, (_, i): Pt => [
        x + Math.cos(rad(i * 60 + 30)) * 50,
        by + Math.sin(rad(i * 60 + 30)) * 50,
      ]);
      return (
        poly(hex, "url(#hull)", BLUE.pale, 1.8) +
        poly(
          hex.map((p): Pt => [x + (p[0] - x) * 0.6, by + (p[1] - by) * 0.6]),
          "none",
          BLUE.light,
          1.1,
        ) +
        circle([x, by], 10, "#ffffff", 1.2, "url(#flare)")
      );
    }
    default: {
      let out = circle([x, by], 16, "#ffffff", 1.6, "url(#flare)");
      for (let i = 0; i < 3; i++) {
        out += `<ellipse cx="${x}" cy="${by}" rx="${46 + i * 8}" ry="${14 + i * 4}" fill="none" stroke="${BLUE.pale}" stroke-width="1.2" transform="rotate(${i * 60 + f * 15} ${x} ${by})"/>`;
      }
      return out;
    }
  }
}

export function companion(tier: number, f: number): string {
  const c: Pt = [300, 196];
  return [
    bench(),
    body(tier, c, f),
    arm([c[0] + 90, c[1] + 14], true),
    circle([c[0] + 90, c[1] + 14], 4, BLUE.pale, 1.4, BLUE.bg),
    reticle(c, 74 + (f % 2) * 2, f),
    callout([c[0] + 74, c[1] - 30], [440, 110], COMPANION[tier]),
  ].join("");
}

// --- stargazing --------------------------------------------------------------------

const DUST = ["STAR DUST", "COMET ICE", "NEBULA GAS", "PULSAR DUST"];
const STAR_CHARTS: Pt[][] = [
  [
    [190, 120],
    [250, 168],
    [310, 210],
    [372, 252],
    [420, 300],
  ],
  [
    [170, 300],
    [230, 220],
    [300, 250],
    [370, 160],
    [450, 200],
    [500, 120],
  ],
  [
    [240, 150],
    [290, 120],
    [350, 124],
    [396, 160],
    [380, 214],
    [320, 236],
    [262, 210],
  ],
  [
    [150, 110],
    [230, 170],
    [330, 150],
    [420, 220],
    [500, 180],
    [540, 280],
  ],
];
const CHART_LABEL = ["THE HUNTER", "THE LOOM", "THE CROWN", "THE FERRYMAN"];

function sky(seed: number, f: number): string {
  let out = "";
  for (let i = 0; i < 46; i++) {
    const x = 60 + hash(i, 1, seed) * 520;
    const y = 50 + hash(i, 2, seed) * 280;
    out += circle(
      [x, y],
      0.8 + hash(i, 3, seed) * 1.4,
      BLUE.pale,
      0,
      BLUE.pale,
      `opacity="${((i + f) % 3 ? 0.5 : 0.95).toFixed(2)}"`,
    );
  }
  return out;
}

export function observe(tier: number, f: number): string {
  let out = sky(7 + tier, f);
  for (let i = 0; i < 10 + tier * 2; i++) {
    const phase = ((f + hash(i, 4, tier) * 4) % 4) / 4;
    const x = 250 + hash(i, 5, tier) * 140 - phase * 20;
    const y = 80 + phase * 190;
    out += circle(
      [x, y],
      1.8 + tier * 0.6,
      "#ffffff",
      0.8,
      tier === 3 ? BLUE.pale : "#ffffff",
      `opacity="${(1 - phase * 0.4).toFixed(2)}"`,
    );
  }
  // the jar they fall into
  out += poly(
    [
      [262, 270],
      [378, 270],
      [366, 340],
      [274, 340],
    ],
    "url(#hull)",
    BLUE.pale,
    1.6,
  );
  out += path("M276 270h88", BLUE.pale, 3);
  out += `<rect x="274" y="${340 - 20 - tier * 12 - (f % 2) * 3}" width="92" height="${20 + tier * 12 + (f % 2) * 3}" fill="${BLUE.light}" opacity=".5"/>`;
  out += reticle([320, 300], 74 + (f % 2) * 2, f);
  out += callout([380, 300], [440, 200], DUST[tier]);
  return out;
}

export function chart(index: number, f: number): string {
  const pts = STAR_CHARTS[index];
  const shown = Math.min(pts.length, 2 + f + (pts.length > 5 ? 2 : 0));
  let out = sky(31 + index, f);
  out += path(`M${pts.slice(0, shown).map(P).join("L")}`, BLUE.pale, 1.6);
  pts.forEach((p, i) => {
    const lit = i < shown;
    out += circle(p, lit ? 6 : 3, BLUE.pale, 1.2, lit ? "url(#flare)" : BLUE.bg);
  });
  out += reticle(pts[shown - 1], 26 + (f % 2) * 2, f);
  out += callout([pts[0][0], pts[0][1] + 14], [96, 310], CHART_LABEL[index]);
  return out;
}

/** Every new task's scene, by task id. */
export const NEW_SCENES: Record<string, (f: number) => string> = {
  ...Object.fromEntries(
    ["fish_minnow", "fish_eel", "fish_ray", "fish_lurker", "fish_leviathan"].map((id, t) => [
      id,
      (f: number) => fishing(t, f),
    ]),
  ),
  ...Object.fromEntries(
    ["craft_fish_ration", "craft_eel_skewer", "craft_ray_stew"].map((id, t) => [id, (f: number) => fishCook(t, f)]),
  ),
  ...Object.fromEntries(
    ["smelt_ferrite", "smelt_steel", "smelt_glass", "smelt_chitin", "smelt_xeno"].map((id, t) => [
      id,
      (f: number) => smelting(t, f),
    ]),
  ),
  ...Object.fromEntries(
    ["hack_cache", "hack_door", "hack_archive", "hack_warden", "hack_heart"].map((id, t) => [
      id,
      (f: number) => hacking(t, f),
    ]),
  ),
  ...Object.fromEntries(
    ["explore_ridge", "explore_canyon", "explore_caves", "explore_lakes", "explore_deep"].map((id, t) => [
      id,
      (f: number) => exploring(t, f),
    ]),
  ),
  ...Object.fromEntries(
    ["build_hound", "build_wisp", "build_moth", "build_ward", "build_familiar"].map((id, t) => [
      id,
      (f: number) => companion(t, f),
    ]),
  ),
  ...Object.fromEntries(
    ["watch_stars", "watch_comets", "watch_nebula", "watch_pulsar"].map((id, t) => [id, (f: number) => observe(t, f)]),
  ),
  ...Object.fromEntries(
    ["chart_hunter", "chart_loom", "chart_crown", "chart_ferryman"].map((id, t) => [id, (f: number) => chart(t, f)]),
  ),
};
