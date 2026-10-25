import { hash } from "./canvas";

/**
 * "Ship terminal" art style: a black CRT with one phosphor colour for the interface, flat amber for the
 * subject, no tonal shading at all (volume comes from outlines and negative space), and static on top.
 */

const W = 320;
const H = 200;

export const INK = {
  bg: "#010a05",
  green: "#3dff8a",
  dim: "#1a8f4c",
  amber: "#ffab2e",
  pale: "#d9ffe8",
  black: "#000000",
} as const;

const FONT = "Menlo, Monaco, 'Courier New', monospace";

// --- primitives ---------------------------------------------------------------

type Pt = [number, number];
const pts = (list: Pt[]) => list.map(([x, y]) => `${x},${y}`).join(" ");

/**
 * A brutalist block in oblique projection. The front is a flat solid; the top and side are
 * unlit outlines only, so the form reads without any tonal shading.
 */
export function slab(
  x: number,
  y: number,
  w: number,
  h: number,
  depth: [number, number] = [9, -7],
  fill: string = INK.amber,
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
  const edge = `fill="${INK.bg}" stroke="${fill}" stroke-width="1.5" stroke-linejoin="miter"`;
  return [
    `<polygon points="${pts(top)}" ${edge}/>`,
    `<polygon points="${pts(side)}" ${edge}/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${INK.bg}" stroke-width="1.5"/>`,
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

/** A recessed slit: black with an amber lip, like a window cut into poured concrete. */
const slit = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${INK.black}" stroke="${INK.bg}" stroke-width="1"/><path d="M${x} ${y + h + 1}H${x + w}" stroke="${INK.pale}" stroke-width="1" opacity=".7"/>`;

const crack = (d: string) =>
  `<path d="${d}" fill="none" stroke="${INK.bg}" stroke-width="2" stroke-linejoin="miter"/>`;

function text(
  x: number,
  y: number,
  size: number,
  content: string,
  fill: string = INK.green,
  extra = "",
): string {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${FONT}" font-size="${size}" font-weight="700" letter-spacing="1" ${extra}>${content}</text>`;
}

function bars(x: number, y: number, filled: number, total: number): string {
  let out = "";
  for (let i = 0; i < total; i++) {
    out += `<rect x="${x + i * 8}" y="${y}" width="6" height="8" ${i < filled ? `fill="${INK.green}"` : `fill="none" stroke="${INK.dim}"`}/>`;
  }
  return out;
}

// --- screen furniture ----------------------------------------------------------

function floorGrid(): string {
  let out = "";
  const horizon = 150;
  for (const y of [150, 154, 159, 165, 172])
    out += `<path d="M122 ${y}H304" stroke="${INK.dim}" stroke-width="1"/>`;
  for (let i = -6; i <= 6; i++) {
    out += `<path d="M${213 + i * 15} ${horizon}L${213 + i * 24} 172" stroke="${INK.dim}" stroke-width="1"/>`;
  }
  return out;
}

function corners(x: number, y: number, w: number, h: number, len = 8): string {
  const c = INK.green;
  return [
    `<path d="M${x} ${y + len}V${y}H${x + len}" fill="none" stroke="${c}" stroke-width="2"/>`,
    `<path d="M${x + w - len} ${y}H${x + w}V${y + len}" fill="none" stroke="${c}" stroke-width="2"/>`,
    `<path d="M${x} ${y + h - len}V${y + h}H${x + len}" fill="none" stroke="${c}" stroke-width="2"/>`,
    `<path d="M${x + w - len} ${y + h}H${x + w}V${y + h - len}" fill="none" stroke="${c}" stroke-width="2"/>`,
  ].join("");
}

/** Scanlines, static and a rolling bar. Deterministic per frame. */
function crt(frame: number): string {
  let out = `<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  for (let i = 0; i < 140; i++) {
    const x = hash(i, frame, 11) * W;
    const y = hash(i, frame, 12) * H;
    const w = 2 + hash(i, frame, 13) * 16;
    out += `<rect x="${x.toFixed(1)}" y="${Math.floor(y)}" width="${w.toFixed(1)}" height="1" fill="${INK.green}" opacity="${(0.1 + hash(i, frame, 14) * 0.25).toFixed(2)}"/>`;
  }
  for (let i = 0; i < 80; i++) {
    out += `<rect x="${Math.floor(hash(i, frame, 15) * W)}" y="${Math.floor(hash(i, frame, 16) * H)}" width="1" height="1" fill="${INK.pale}" opacity=".5"/>`;
  }
  const roll = (frame * 53 + 20) % (H + 20);
  out += `<rect x="0" y="${roll - 12}" width="${W}" height="12" fill="${INK.green}" opacity=".06"/>`;
  out += `<rect x="0" y="${roll}" width="${W}" height="1" fill="${INK.green}" opacity=".18"/>`;
  // an occasional torn line
  if (frame % 2 === 1) {
    const ty = 40 + Math.floor(hash(frame, 1, 17) * 120);
    out += `<rect x="${Math.floor(hash(frame, 2, 17) * 120)}" y="${ty}" width="${120 + Math.floor(hash(frame, 3, 17) * 160)}" height="${2 + (frame % 3)}" fill="${INK.green}" opacity=".22"/>`;
  }
  return out;
}

// --- ferrite ------------------------------------------------------------------

/** Pick pose per frame (rotation about the pivot, degrees): raised, swinging, hit, recoil. */
const PICK_ANGLE = [7, 0, -13, -6];
/** The hand moves a little as well: up on the wind-up, down on the hit. */
const PIVOT_DY = [-4, -1, 2, 0];
const PIVOT: Pt = [268, 56];
const REACH = 100;

function pick(frame: number): string {
  const r = REACH;
  const head: Pt[] = [
    [-r + 4, -5],
    [-r - 3, -12],
    [-r - 9, -23],
    [-r - 14, -22],
    [-r - 9, -9],
    [-r - 9, 9],
    [-r - 14, 22],
    [-r - 9, 23],
    [-r - 3, 12],
    [-r + 4, 5],
  ];
  return [
    `<g transform="translate(${PIVOT[0]} ${PIVOT[1] + PIVOT_DY[frame % 4]}) rotate(${PICK_ANGLE[frame % 4]})">`,
    `<rect x="${-r}" y="-4" width="${r + 12}" height="8" fill="${INK.green}" stroke="${INK.bg}" stroke-width="1.5"/>`,
    `<rect x="${-6}" y="-4" width="18" height="8" fill="${INK.pale}" stroke="${INK.bg}" stroke-width="1.5"/>`,
    `<polygon points="${pts(head)}" fill="${INK.pale}" stroke="${INK.bg}" stroke-width="1.5" stroke-linejoin="miter"/>`,
    `</g>`,
  ].join("");
}

function sparks(frame: number): string {
  if (frame < 2) return "";
  const [cx, cy] = [170, 79];
  const reach = frame === 2 ? 1 : 1.7;
  let out = "";
  for (let i = 0; i < 8; i++) {
    const a = (-150 + i * 34) * (Math.PI / 180);
    const d = (6 + hash(i, frame, 21) * 10) * reach;
    const s = hash(i, frame, 22) > 0.5 ? 3 : 2;
    out += `<rect x="${(cx + Math.cos(a) * d).toFixed(1)}" y="${(cy + Math.sin(a) * d).toFixed(1)}" width="${s}" height="${s}" fill="${i % 2 ? INK.amber : INK.pale}"/>`;
  }
  return out;
}

function ferriteOre(shake: number): string {
  return [
    `<g transform="translate(${shake} ${shake ? 0.5 : 0})">`,
    // leaning shard
    `<polygon points="${pts([
      [120, 150],
      [150, 150],
      [150, 122],
    ])}" fill="${INK.amber}" stroke="${INK.bg}" stroke-width="1.5"/>`,
    `<polygon points="${pts([
      [246, 150],
      [246, 124],
      [276, 150],
    ])}" fill="${INK.amber}" stroke="${INK.bg}" stroke-width="1.5"/>`,
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

export function ferriteTerminal(frame: number): string {
  const shake = frame === 2 ? 1.5 : 0;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">`,
    `<defs><clipPath id="panel"><rect x="118" y="30" width="188" height="142"/></clipPath><pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" y="2" fill="#000" opacity=".4"/></pattern></defs>`,
    `<rect width="${W}" height="${H}" fill="${INK.bg}"/>`,
    // frame and header
    `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="5" fill="none" stroke="${INK.green}" stroke-width="2"/>`,
    `<rect x="8" y="8" width="${W - 16}" height="16" fill="${INK.green}"/>`,
    text(14, 20, 10, "BRAVEN SURVEY // MINERALS", INK.bg),
    text(W - 14, 20, 10, "ENTRY 007", INK.bg, 'text-anchor="end"'),
    // data column
    text(14, 52, 20, "FERRITE"),
    `<path d="M14 58H108" stroke="${INK.green}" stroke-width="2"/>`,
    text(14, 74, 9, "CLASS ..... ORE", INK.green),
    text(14, 88, 9, "DENSITY ... 7.8", INK.green),
    text(14, 102, 9, "YIELD .. COMMON", INK.green),
    text(14, 116, 9, "HAZARD .... LOW", INK.green),
    text(14, 134, 9, "PURITY", INK.dim),
    bars(14, 139, 7, 10),
    text(14, 158, 9, "WORK-RATE", INK.dim),
    bars(14, 163, 4, 10),
    // subject panel
    `<rect x="118" y="30" width="188" height="142" fill="none" stroke="${INK.dim}" stroke-width="1"/>`,
    corners(118, 30, 188, 142),
    `<g clip-path="url(#panel)">${floorGrid()}</g>`,
    ferriteOre(shake),
    pick(frame),
    sparks(frame),
    // the header sits on top, so a raised pick disappears behind it
    `<rect x="8" y="8" width="${W - 16}" height="16" fill="${INK.green}"/>`,
    text(14, 20, 10, "BRAVEN SURVEY // MINERALS", INK.bg),
    text(W - 14, 20, 10, "ENTRY 007", INK.bg, 'text-anchor="end"'),
    // callouts
    `<path d="M270 106H284V120" fill="none" stroke="${INK.green}" stroke-width="1"/>`,
    text(300, 130, 8, "SEAM 07", INK.green, 'text-anchor="end"'),
    text(300, 140, 8, "FE 62%", INK.green, 'text-anchor="end"'),
    // status bar
    `<rect x="8" y="${H - 22}" width="${W - 16}" height="14" fill="none" stroke="${INK.green}" stroke-width="1"/>`,
    text(14, H - 12, 9, "&gt; MINE_FERRITE  [ACTIVE]"),
    `<rect x="${200 + (frame % 2) * 0}" y="${H - 19}" width="7" height="8" fill="${INK.green}" opacity="${frame % 2 ? 1 : 0.15}"/>`,
    text(236, H - 12, 9, "T+00:0" + (frame % 4), INK.dim),
    crt(frame),
    `</svg>`,
  ].join("");
}
