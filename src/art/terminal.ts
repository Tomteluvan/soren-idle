import { hash } from "./canvas";

/**
 * "Ship terminal" art style: a black CRT with one phosphor blue, flat fills, and no tonal shading at all
 * (volume comes from outlines and negative space). Scanlines and static sit on top of everything.
 */

const W = 320;
const H = 200;

export const INK = {
  bg: "#02060f",
  ui: "#3d8bff",
  dim: "#1b4f94",
  ore: "#8fd6ff",
  white: "#eaf6ff",
  glow: "#6ec8ff",
} as const;

const FONT = "Menlo, Monaco, 'Courier New', monospace";

// --- primitives ---------------------------------------------------------------

type Pt = [number, number];
const pts = (list: Pt[]) => list.map(([x, y]) => `${x},${y}`).join(" ");

/**
 * A brutalist block in oblique projection. The front is a flat solid; the top and side are
 * unlit outlines only, so the form reads without any tonal shading.
 */
function slab(
  x: number,
  y: number,
  w: number,
  h: number,
  depth: [number, number] = [9, -7],
): string {
  const [dx, dy] = depth;
  const top: Pt[] = [
    [x, y],
    [x + dx, y + dy],
    [x + w + dx, y + dy],
    [x + w, y],
  ];
  const side: Pt[] = [
    [x + w, y],
    [x + w + dx, y + dy],
    [x + w + dx, y + h + dy],
    [x + w, y + h],
  ];
  const edge = `fill="${INK.bg}" stroke="${INK.ore}" stroke-width="1.5" stroke-linejoin="miter"`;
  return [
    `<polygon points="${pts(top)}" ${edge}/>`,
    `<polygon points="${pts(side)}" ${edge}/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${INK.ore}" stroke="${INK.bg}" stroke-width="1.5"/>`,
    formwork(x, y, w, h),
  ].join("");
}

/** Board-marked concrete: thin horizontal lines that break up the flat front without shading it. */
function formwork(x: number, y: number, w: number, h: number): string {
  let out = "";
  for (let yy = y + 7, i = 0; yy < y + h - 2; yy += 7, i++) {
    const start = x + Math.floor(hash(x, yy, 1) * 8);
    const end = x + w - Math.floor(hash(x, yy, 2) * 8);
    out += `<path d="M${start} ${yy}H${end}" stroke="${INK.bg}" stroke-width="1" opacity=".55"/>`;
    // tie holes, as on poured concrete
    if (i % 2 === 0)
      out += `<rect x="${x + 4 + hash(yy, x, 3) * (w - 10)}" y="${yy - 1}" width="2" height="2" fill="${INK.bg}"/>`;
  }
  return out;
}

/** A recessed slit, like a window cut into poured concrete. */
const slit = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000"/><path d="M${x} ${y + h + 1}H${x + w}" stroke="${INK.white}" stroke-width="1" opacity=".7"/>`;

const crack = (d: string) =>
  `<path d="${d}" fill="none" stroke="${INK.bg}" stroke-width="2" stroke-linejoin="miter"/>`;

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

// --- the subject ----------------------------------------------------------------

/** The ore is drawn in its own coordinates, then scaled up to fill the screen. */
const ORE_SCALE = 1.35;
const ORE_TX = -109;
const ORE_TY = -46;

function ferriteOre(shake: number): string {
  const fill = `fill="${INK.ore}" stroke="${INK.bg}" stroke-width="1.5"`;
  return [
    `<g transform="translate(${ORE_TX + shake} ${ORE_TY + (shake ? 1 : 0)}) scale(${ORE_SCALE})">`,
    // leaning shards
    `<polygon points="${pts([
      [120, 150],
      [150, 150],
      [150, 122],
    ])}" ${fill}/>`,
    `<polygon points="${pts([
      [246, 150],
      [246, 134],
      [264, 150],
    ])}" ${fill}/>`,
    slab(150, 118, 96, 32),
    slab(156, 84, 44, 34),
    slab(206, 96, 64, 22),
    slab(236, 76, 24, 20),
    crack("M170 118v10h8v10h-6v12"),
    crack("M176 84v12h10v10"),
    crack("M232 96v8h-6v14"),
    crack("M246 76v8h6v8"),
    slit(190, 132, 30, 5),
    slit(166, 100, 18, 4),
    slit(212, 104, 20, 4),
    slit(241, 84, 10, 4),
    `</g>`,
  ].join("");
}

// --- the pick -------------------------------------------------------------------

/**
 * A pulse pick: a ribbed haft, a power housing with a glowing cell, a blunt hammer face on one side of the
 * head and a long drill spike on the other. Drawn pointing left with its grip at the origin.
 */
const PICK_LEN = 190;
const SPIKE = 36;
/** Rotation per frame in degrees: raised, swinging, hit, recoil. */
const PICK_ANGLE = [-6, -10, -15, -11];
/** Where the spike tip lands on the hit frame, in screen coordinates. */
const STRIKE: Pt = [128, 70];

function rotate([x, y]: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/** The grip is off the top-right of the screen, placed so the spike tip lands on STRIKE at the hit frame. */
function pivot(): Pt {
  const [rx, ry] = rotate([-PICK_LEN, SPIKE], PICK_ANGLE[2]);
  return [STRIKE[0] - rx, STRIKE[1] - ry];
}

function pick(frame: number): string {
  const L = PICK_LEN;
  const [px, py] = pivot();
  const stroke = `stroke="${INK.bg}" stroke-width="1.5" stroke-linejoin="miter"`;
  let ribs = "";
  for (let x = -L + 80; x < -20; x += 14)
    ribs += `<rect x="${x}" y="-4" width="3" height="8" fill="${INK.dim}"/>`;
  const housing: Pt[] = [
    [-L + 34, -9],
    [-L + 62, -9],
    [-L + 68, -5],
    [-L + 68, 5],
    [-L + 62, 9],
    [-L + 34, 9],
  ];
  const spike: Pt[] = [
    [-L - 6, 8],
    [-L + 6, 8],
    [-L + 3, 26],
    [-L - 1, SPIKE],
    [-L - 5, 26],
  ];
  return [
    `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${PICK_ANGLE[frame % 4]})">`,
    `<rect x="${-L}" y="-3" width="${L + 12}" height="6" fill="${INK.white}" ${stroke}/>`,
    ribs,
    `<rect x="-30" y="-5" width="42" height="10" fill="${INK.white}" ${stroke}/>`,
    `<polygon points="${pts(housing)}" fill="${INK.white}" ${stroke}/>`,
    `<rect x="${-L + 40}" y="-3" width="22" height="6" fill="${INK.glow}"/>`,
    `<rect x="${-L + 43}" y="-1" width="16" height="2" fill="#fff"/>`,
    // head: hammer face on top, spike below
    `<rect x="${-L - 9}" y="-17" width="22" height="26" fill="${INK.white}" ${stroke}/>`,
    `<rect x="${-L - 9}" y="-17" width="5" height="26" fill="${INK.dim}"/>`,
    `<polygon points="${pts(spike)}" fill="${INK.white}" ${stroke}/>`,
    `<path d="M${-L} 10V${SPIKE - 4}" stroke="${INK.glow}" stroke-width="2"/>`,
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
  const ground = 156;
  let out = "";
  for (const y of [ground, ground + 5, ground + 11, ground + 19, ground + 29]) {
    out += `<path d="M10 ${y}H310" stroke="${INK.dim}" stroke-width="1"/>`;
  }
  for (let i = -9; i <= 9; i++) {
    out += `<path d="M${160 + i * 18} ${ground}L${160 + i * 34} ${ground + 29}" stroke="${INK.dim}" stroke-width="1"/>`;
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
  const shake = f === 2 ? 2 : 0;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">`,
    `<defs><clipPath id="screen"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="4"/></clipPath><pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" y="2" fill="#000" opacity=".4"/></pattern></defs>`,
    `<rect width="${W}" height="${H}" fill="${INK.bg}"/>`,
    `<g clip-path="url(#screen)">`,
    floorGrid(),
    ferriteOre(shake),
    pick(f),
    impact(f),
    `</g>`,
    `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="5" fill="none" stroke="${INK.ui}" stroke-width="2"/>`,
    text(14, 24, 14, "FERRITE"),
    text(14, H - 12, 9, "&gt; MINING", INK.ui),
    `<rect x="${14 + 11 * 6.4}" y="${H - 20}" width="6" height="9" fill="${INK.ui}" opacity="${f % 2 ? 1 : 0.15}"/>`,
    crt(f),
    `</svg>`,
  ].join("");
}
