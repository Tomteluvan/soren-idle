import { hash } from "./canvas";

/**
 * "Ship terminal" art style: a black CRT with one phosphor blue, flat fills, and no tonal shading at all
 * (volume comes from outlines and negative space). Scanlines and static sit on top of everything.
 */

const W = 320;
const H = 200;
const GROUND = 158;

export const INK = {
  bg: "#02060f",
  ui: "#3d8bff",
  dim: "#1b4f94",
  ore: "#8fd6ff",
  white: "#eaf6ff",
  glow: "#6ec8ff",
} as const;

const FONT = "Menlo, Monaco, 'Courier New', monospace";

type Pt = [number, number];
const pts = (list: Pt[]) => list.map(([x, y]) => `${x},${y}`).join(" ");

function text(
  x: number,
  y: number,
  size: number,
  content: string,
  fill: string = INK.ui,
  extra = "",
): string {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${FONT}" font-size="${size}" font-weight="700" letter-spacing="1" ${extra}>${content}</text>`;
}

// --- the ore --------------------------------------------------------------------

/** A rough outcrop: lumpy, with a broad base and a few ridges. */
const OUTLINE: Pt[] = [
  [112, GROUND],
  [106, 142],
  [118, 122],
  [134, 108],
  [148, 100],
  [156, 82],
  [176, 68],
  [196, 72],
  [212, 60],
  [236, 58],
  [254, 70],
  [266, 86],
  [286, 94],
  [300, 114],
  [304, 136],
  [296, 152],
  [290, GROUND],
];

/** Where one plate of rock ends and the next begins. */
const FACETS = [
  "M156 82L176 106L168 132L144 144",
  "M176 106L212 102L226 126L212 156",
  "M212 60L212 102",
  "M226 126L258 120L266 86",
  "M258 120L276 146L288 156",
  "M168 132L196 144L212 156",
  "M134 108L156 120L168 132",
];

/** Dark pockets cut into the face, outlined in ore so they read as depth rather than shade. */
const POCKETS: Pt[][] = [
  [
    [184, 120],
    [196, 112],
    [208, 120],
    [204, 130],
    [192, 128],
    [190, 134],
  ],
  [
    [234, 92],
    [246, 86],
    [254, 94],
    [250, 104],
    [240, 100],
  ],
  [
    [124, 130],
    [136, 122],
    [142, 130],
    [138, 140],
    [128, 138],
  ],
];

/** Crystal shards pushing out of the top: hollow, with a glowing core. */
const CRYSTALS: { base: Pt; lean: number; h: number; w: number }[] = [
  { base: [226, 60], lean: -3, h: 34, w: 9 },
  { base: [240, 60], lean: 4, h: 24, w: 8 },
  { base: [150, 99], lean: -6, h: 20, w: 7 },
];

function crystal({ base: [x, y], lean, h, w }: (typeof CRYSTALS)[number]): string {
  const tip: Pt = [x + lean, y - h];
  const body: Pt[] = [
    [x - w / 2, y],
    [x - w / 2 + lean * 0.4, y - h * 0.72],
    tip,
    [x + w / 2 + lean * 0.4, y - h * 0.72],
    [x + w / 2, y],
  ];
  return [
    `<polygon points="${pts(body)}" fill="${INK.bg}" stroke="${INK.white}" stroke-width="1.5" stroke-linejoin="miter"/>`,
    `<path d="M${x} ${y - 3}L${x + lean * 0.8} ${y - h + 6}" stroke="${INK.glow}" stroke-width="2"/>`,
  ].join("");
}

function ferriteOre(shake: number, struck: boolean): string {
  let strata = "";
  for (let i = 0; i < 6; i++) {
    const y = 84 + i * 13;
    const j = (k: number) => Math.round(hash(i, k, 31) * 8 - 4);
    strata += `<path d="M100 ${y + j(1)}Q150 ${y + j(2)} 200 ${y + j(3)}T310 ${y + j(4)}" fill="none" stroke="${INK.bg}" stroke-width="1" opacity=".5"/>`;
  }
  let rubble = "";
  for (const [x, w] of [
    [92, 8],
    [100, 6],
    [300, 9],
    [310, 5],
    [84, 5],
  ] as [number, number][]) {
    rubble += `<polygon points="${pts([
      [x, GROUND],
      [x + w * 0.3, GROUND - w * 0.7],
      [x + w, GROUND - w * 0.3],
      [x + w, GROUND],
    ])}" fill="${INK.ore}"/>`;
  }
  return [
    `<g transform="translate(${shake} ${shake ? 1 : 0})">`,
    rubble,
    `<clipPath id="rock"><polygon points="${pts(OUTLINE)}"/></clipPath>`,
    `<polygon points="${pts(OUTLINE)}" fill="${INK.ore}" stroke="${INK.ore}" stroke-width="2" stroke-linejoin="round"/>`,
    `<g clip-path="url(#rock)">${strata}</g>`,
    ...FACETS.map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${INK.bg}" stroke-width="2" stroke-linejoin="miter"/>`,
    ),
    ...POCKETS.map(
      (p) =>
        `<polygon points="${pts(p)}" fill="#000" stroke="${INK.white}" stroke-width="1" stroke-linejoin="miter"/>`,
    ),
    // a vein of raw ferrite
    `<path d="M178 140L190 150L200 142L212 150" fill="none" stroke="${INK.ui}" stroke-width="3" stroke-linejoin="miter"/>`,
    `<path d="M262 128L270 140L282 134L288 146" fill="none" stroke="${INK.ui}" stroke-width="3" stroke-linejoin="miter"/>`,
    ...CRYSTALS.map(crystal),
    // fresh cracks spreading from the strike
    struck
      ? `<path d="M168 86L176 98L170 106M168 86L158 96" fill="none" stroke="${INK.bg}" stroke-width="2"/>`
      : "",
    `</g>`,
  ].join("");
}

// --- the pick -------------------------------------------------------------------

/**
 * A pulse pick: a ribbed haft, a power housing with a glowing cell, a blunt hammer face on top of the head and
 * a long drill spike below it. Drawn pointing right with its grip at the origin, swung in from the left.
 */
const PICK_LEN = 130;
const SPIKE = 36;
/** Rotation per frame in degrees (positive swings the head down): raised, swinging, hit, recoil. */
const PICK_ANGLE = [-5, -1, 8, 2];
/** Where the spike tip lands on the hit frame. */
const STRIKE: Pt = [166, 84];

function rotate([x, y]: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/** Placed so the spike tip lands on STRIKE at the hit frame. */
function pivot(): Pt {
  const [rx, ry] = rotate([PICK_LEN, SPIKE], PICK_ANGLE[2]);
  return [STRIKE[0] - rx, STRIKE[1] - ry];
}

function pick(frame: number): string {
  const L = PICK_LEN;
  const [px, py] = pivot();
  const stroke = `stroke="${INK.bg}" stroke-width="1.5" stroke-linejoin="miter"`;
  let ribs = "";
  for (let x = -60; x < L - 80; x += 14)
    ribs += `<rect x="${x}" y="-4" width="3" height="8" fill="${INK.dim}"/>`;
  const housing: Pt[] = [
    [L - 34, -9],
    [L - 62, -9],
    [L - 68, -5],
    [L - 68, 5],
    [L - 62, 9],
    [L - 34, 9],
  ];
  const spike: Pt[] = [
    [L + 6, 8],
    [L - 6, 8],
    [L - 3, 26],
    [L + 1, SPIKE],
    [L + 5, 26],
  ];
  return [
    `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${PICK_ANGLE[frame % 4]})">`,
    `<rect x="-90" y="-3" width="${L + 90}" height="6" fill="${INK.white}" ${stroke}/>`,
    ribs,
    `<rect x="-12" y="-5" width="42" height="10" fill="${INK.white}" ${stroke}/>`,
    `<polygon points="${pts(housing)}" fill="${INK.white}" ${stroke}/>`,
    `<rect x="${L - 62}" y="-3" width="22" height="6" fill="${INK.glow}"/>`,
    `<rect x="${L - 59}" y="-1" width="16" height="2" fill="#fff"/>`,
    // head: hammer face on top, spike below
    `<rect x="${L - 13}" y="-17" width="22" height="26" fill="${INK.white}" ${stroke}/>`,
    `<rect x="${L + 4}" y="-17" width="5" height="26" fill="${INK.dim}"/>`,
    `<polygon points="${pts(spike)}" fill="${INK.white}" ${stroke}/>`,
    `<path d="M${L} 10V${SPIKE - 4}" stroke="${INK.glow}" stroke-width="2"/>`,
    `</g>`,
  ].join("");
}

/** A shock ring and flying debris where the spike lands. */
function impact(frame: number): string {
  if (frame < 2) return "";
  const [cx, cy] = STRIKE;
  const grow = frame === 2 ? 1 : 1.9;
  const r = 9 * grow;
  let out = `<polygon points="${pts([
    [cx, cy - r],
    [cx + r, cy],
    [cx, cy + r],
    [cx - r, cy],
  ])}" fill="none" stroke="${INK.white}" stroke-width="${frame === 2 ? 2 : 1}"/>`;
  for (let i = 0; i < 9; i++) {
    const a = (-175 + i * 21) * (Math.PI / 180);
    const d = (14 + hash(i, frame, 21) * 14) * grow;
    const s = hash(i, frame, 22) > 0.5 ? 3 : 2;
    out += `<rect x="${(cx + Math.cos(a) * d).toFixed(1)}" y="${(cy + Math.sin(a) * d).toFixed(1)}" width="${s}" height="${s}" fill="${i % 3 ? INK.ore : INK.white}"/>`;
  }
  return out;
}

// --- screen furniture ----------------------------------------------------------

function floorGrid(): string {
  let out = "";
  for (const y of [GROUND, GROUND + 5, GROUND + 11, GROUND + 19, GROUND + 29]) {
    out += `<path d="M10 ${y}H310" stroke="${INK.dim}" stroke-width="1"/>`;
  }
  for (let i = -9; i <= 9; i++) {
    out += `<path d="M${160 + i * 18} ${GROUND}L${160 + i * 34} ${GROUND + 29}" stroke="${INK.dim}" stroke-width="1"/>`;
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

export function ferriteTerminal(frame: number): string {
  const f = frame % 4;
  const struck = f >= 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">`,
    `<defs><clipPath id="screen"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="4"/></clipPath><pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" y="2" fill="#000" opacity=".4"/></pattern></defs>`,
    `<rect width="${W}" height="${H}" fill="${INK.bg}"/>`,
    `<g clip-path="url(#screen)">`,
    floorGrid(),
    ferriteOre(f === 2 ? 2 : 0, struck),
    pick(f),
    impact(f),
    `</g>`,
    `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="5" fill="none" stroke="${INK.ui}" stroke-width="2"/>`,
    text(W - 14, 24, 14, "FERRITE", INK.ui, 'text-anchor="end"'),
    text(14, H - 12, 9, "&gt; MINING", INK.ui),
    `<rect x="${14 + 11 * 6.4}" y="${H - 20}" width="6" height="9" fill="${INK.ui}" opacity="${f % 2 ? 1 : 0.15}"/>`,
    crt(f),
    `</svg>`,
  ].join("");
}
