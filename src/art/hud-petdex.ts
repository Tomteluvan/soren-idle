import { BLUE, circle, line, P, path, poly, Pt, renderHud } from "./hud";
import { at, card, glow, rad, sparks, wave } from "./hud-kit";
import { PETS } from "../engine/data";

/**
 * The pets the Collection Log shows, one per skill. Each is drawn around the origin, about 120 wide
 * with its feet at y = 50, then set on a small stage with a callout naming it.
 */

const eye = (c: Pt, r = 3) => circle(c, r, "#ffffff", 1, "#ffffff");
const ell = (c: Pt, rx: number, ry: number, fill = "url(#hull)", stroke: string = BLUE.pale, w = 1.6, extra = "") =>
  `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
const hull = (pts: Pt[], fill = "url(#hull)", w = 1.6) => poly(pts, fill, BLUE.pale, w);
const leg = (from: Pt, to: Pt, w = 2.4) => line(from, to, BLUE.light, w);

const DRAW: Record<string, (f: number) => string> = {
  salvaging: (f) => {
    let out = "";
    for (const k of [-1, 1])
      for (const i of [0, 1, 2]) {
        const x = -26 + i * 26;
        out += leg([x, 30], [x + k * 22 + wave(f, i * 2 + (k > 0 ? 1 : 0)) * 6, 52], 2.2);
      }
    out += ell([0, 20], 54, 28);
    out += hull([
      [-30, 2],
      [-6, -8],
      [8, 4],
      [-10, 10],
    ]);
    out += path("M-8 -6L-2 4M-18 -2L-14 8", BLUE.mid, 1.2);
    out += hull([
      [48, 12],
      [70, 10],
      [72, 30],
      [50, 32],
    ]);
    out += eye([62, 18], 3.2);
    out += path(`M70 10Q${86 + wave(f) * 4} -8 ${96 + wave(f) * 5} -6`, BLUE.pale, 1.8);
    out += path(`M66 10Q${74 + wave(f, 2) * 4} -14 ${82 + wave(f, 2) * 5} -20`, BLUE.pale, 1.8);
    return out;
  },
  mining: (f) => {
    let out = "";
    for (const i of [0, 1, 2]) out += leg([-30 + i * 30, 34], [-38 + i * 30 + wave(f, i * 2) * 5, 52], 2.4);
    out += path("M-62 38Q-50 -34 8 -34Q56 -34 66 38Z", BLUE.pale, 1.6, "url(#rock)");
    for (const [x, h] of [
      [-30, 26],
      [-4, 36],
      [24, 28],
    ] as const)
      out += hull(
        [
          [x - 9, -18],
          [x, -18 - h],
          [x + 9, -18],
        ],
        "url(#crystal)",
        1.3,
      );
    out += path("M-62 38L66 38", BLUE.pale, 1.6);
    out += hull([
      [58, 8],
      [86, 14],
      [84, 36],
      [58, 36],
    ]);
    out += eye([76, 20], 3);
    out += sparks([-4, -44], 24, f, 5, 3);
    out += path(`M84 14Q96 ${-2 + wave(f) * 4} 104 ${-2 + wave(f) * 6}`, BLUE.pale, 1.8);
    return out;
  },
  foraging: (f) => {
    const sway = wave(f) * 8;
    let out = "";
    out += path(`M0 -34Q${sway} -54 ${sway * 1.4} -70`, BLUE.pale, 2.4);
    out += hull(
      [
        [sway * 1.4, -70],
        [sway * 1.4 + 22, -80],
        [sway * 1.4 + 30, -62],
        [sway * 1.4 + 6, -58],
      ],
      "url(#plate)",
    );
    out += hull(
      [
        [sway * 1.4, -70],
        [sway * 1.4 - 20, -82],
        [sway * 1.4 - 28, -64],
        [sway * 1.4 - 4, -58],
      ],
      "url(#plate)",
    );
    out += ell([0, 6], 42, 40);
    for (const k of [-1, 1])
      out += hull(
        [
          [k * 34, -14],
          [k * 62, -34 + wave(f, k) * 4],
          [k * 52, -4],
        ],
        "url(#crystal)",
        1.3,
      );
    out += eye([-14, 0], 4) + eye([14, 0], 4);
    out += path("M-8 14Q0 22 8 14", BLUE.pale, 1.8);
    out += leg([-14, 44], [-16, 52], 3) + leg([14, 44], [16, 52], 3);
    return out;
  },
  cooking: (f) => {
    let out = "";
    const flick = [1, 1.4, 0.9, 1.25][f];
    out += path("M-60 30Q-96 24 -104 -4Q-100 -20 -88 -6", BLUE.pale, 6);
    out += path("M-60 30Q-96 24 -104 -4Q-100 -20 -88 -6", "url(#hull)", 3.4);
    out += poly(
      [
        [-88, -8],
        [-96 + wave(f) * 3, -8 - 22 * flick],
        [-80, -8 - 10 * flick],
        [-76 + wave(f, 2) * 3, -8 - 28 * flick],
        [-70, -6],
      ],
      "url(#plate)",
      BLUE.pale,
      1.3,
    );
    out += ell([-6, 24], 62, 24);
    for (const x of [-40, -10, 22, 46]) out += leg([x, 40], [x + wave(f, x) * 5, 54], 3);
    out += hull([
      [48, 8],
      [86, 12],
      [90, 28],
      [50, 36],
    ]);
    out += eye([72, 17], 3.2);
    out += path("M-40 14Q-10 4 30 14", BLUE.mid, 1.2);
    return out;
  },
  engineering: (f) => {
    let out = "";
    out += path("M-60 30Q-96 40 -106 14", BLUE.pale, 5);
    out += path("M-60 30Q-96 40 -106 14", "url(#hull)", 2.6);
    for (const x of [-34, 26]) out += leg([x, 36], [x + wave(f, x) * 6, 54], 3);
    out += ell([-4, 22], 62, 22);
    out += hull([
      [50, 6],
      [90, 12],
      [92, 28],
      [52, 34],
    ]);
    out += eye([74, 16], 3.2);
    // the cog on its back turns a notch each frame
    let cog = "";
    for (let i = 0; i < 8; i++) {
      const a = rad(i * 45 + f * 11);
      const b = rad(i * 45 + 22 + f * 11);
      cog += `${P([Math.cos(a) * 26, Math.sin(a) * 26])} ${P([Math.cos(b) * 19, Math.sin(b) * 19])} `;
    }
    out += `<g transform="translate(-6 -8)"><polygon points="${cog}" fill="url(#plate)" stroke="${BLUE.pale}" stroke-width="1.4"/>${circle([0, 0], 7, BLUE.pale, 1.4, BLUE.bg)}</g>`;
    return out;
  },
  fabrication: (f) => {
    const flap = [-34, 4, 34, 4][f];
    let out = "";
    out += hull([
      [-44, 16],
      [-96, 6],
      [-90, 20],
      [-98, 32],
      [-44, 28],
    ]);
    out += leg([-8, 36], [-10, 54], 2.6) + leg([10, 36], [12, 54], 2.6);
    out += ell([0, 6], 48, 34);
    out += hull(
      [
        [-20, 4],
        [-56 + flap * 0.2, -22 + flap * 0.8],
        [-10, -4 + flap * 0.4],
        [16, 10],
      ],
      "url(#plate)",
    );
    out += hull([
      [42, -18],
      [58, -26],
      [74, -16],
      [62, -2],
      [44, -4],
    ]);
    out += hull([
      [74, -16],
      [96, -10],
      [74, -8],
    ]);
    out += eye([60, -14], 3);
    out += sparks([-4, -40], 30, f, 6, 5);
    return out;
  },
  combat: (f) => {
    const wag = wave(f) * 14;
    let out = "";
    out += path(`M-62 8Q-86 ${-6 + wag} -80 ${-30 + wag}`, BLUE.pale, 6);
    out += path(`M-62 8Q-86 ${-6 + wag} -80 ${-30 + wag}`, "url(#hull)", 3);
    for (const x of [-46, -22, 24, 48]) out += leg([x, 28], [x + wave(f, x) * 3, 54], 4);
    out += ell([-4, 12], 64, 26);
    for (const x of [-40, -16, 8, 32])
      out += hull(
        [
          [x, -12],
          [x + 12, -12],
          [x + 14, 12],
          [x - 2, 12],
        ],
        "url(#plate)",
        1.3,
      );
    out += hull([
      [48, -18],
      [88, -14],
      [96, 8],
      [86, 24],
      [50, 26],
    ]);
    out += hull(
      [
        [52, -18],
        [58, -44],
        [72, -20],
      ],
      "url(#plate)",
      1.3,
    );
    out += eye([76, -2], 3.4);
    out += circle([96, 8], 3.4, BLUE.pale, 1, BLUE.pale);
    out += path("M84 20L90 28L96 20", "#ffffff", 1.4);
    return out;
  },
  xenochemistry: (f) => {
    let out = "";
    // the vial
    out += hull(
      [
        [-22, -58],
        [22, -58],
        [22, -34],
        [50, 24],
        [50, 50],
        [-50, 50],
        [-50, 24],
        [-22, -34],
      ],
      "none",
    );
    out += path("M-36 4L36 4", BLUE.mid, 1);
    // the slime inside
    out += path(
      `M-46 50Q-46 ${8 + wave(f) * 3} 0 ${6 + wave(f, 2) * 3}Q46 ${8 + wave(f) * 3} 46 50Z`,
      BLUE.pale,
      1.4,
      "url(#plate)",
    );
    out += eye([-14, 28], 4) + eye([14, 28], 4);
    out += path("M-6 38Q0 42 6 38", BLUE.bg, 1.8);
    for (let i = 0; i < 4; i++) {
      const phase = ((f + i) % 4) / 4;
      out += circle(
        [-20 + i * 14, 2 - phase * 50],
        2.4 + i * 0.4,
        BLUE.pale,
        1,
        "none",
        `opacity="${(1 - phase).toFixed(2)}"`,
      );
    }
    out += hull(
      [
        [-14, -64],
        [14, -64],
        [14, -58],
        [-14, -58],
      ],
      "url(#plate)",
    );
    return out;
  },
  xenofishing: (f) => {
    const tail = wave(f) * 12;
    let out = "";
    out += hull(
      [
        [-52, 0],
        [-96, -26 + tail],
        [-86, 4],
        [-96, 30 + tail],
      ],
      "url(#plate)",
    );
    out += ell([0, 0], 56, 34);
    out += hull(
      [
        [-14, -30],
        [4, -50 - wave(f, 2) * 4],
        [26, -28],
      ],
      "url(#plate)",
      1.3,
    );
    out += hull(
      [
        [-6, 24],
        [10, 44 + wave(f, 3) * 3],
        [26, 22],
      ],
      "url(#plate)",
      1.3,
    );
    for (let i = 0; i < 3; i++) out += path(`M${-24 + i * 14} -14Q${-18 + i * 14} 0 ${-24 + i * 14} 14`, BLUE.mid, 1.1);
    out += eye([34, -6], 5) + circle([35, -6], 2, BLUE.bg, 1, BLUE.bg);
    out += path("M56 8Q44 12 40 6", BLUE.pale, 1.6);
    // the lure
    out += path("M30 -30Q56 -66 82 -48", BLUE.pale, 1.8);
    out += glow([82, -48], 22, 0.8) + circle([82, -48], 5, "#ffffff", 1, "#ffffff");
    return out;
  },
  smelting: (f) => {
    const arms = wave(f) * 8;
    let out = "";
    out += path("M-28 28Q-58 40 -50 14", BLUE.pale, 4);
    for (const k of [-1, 1]) {
      out += hull(
        [
          [k * 24, -34],
          [k * 38, -62],
          [k * 38, -30],
        ],
        "url(#plate)",
        1.3,
      );
      out += leg([k * 34, -4], [k * 62, -26 + arms * k], 4);
      out += leg([k * 16, 36], [k * 22, 54], 4);
    }
    out += ell([0, 12], 36, 32);
    out += ell([0, 16], 16, 14, "url(#flare)", BLUE.pale, 1.2, `opacity="${0.6 + 0.4 * ((f % 2) + 0.2)}"`);
    out += ell([0, -26], 32, 26);
    out += poly(
      [
        [-36, -30],
        [-24, -62],
        [-14, -34],
      ],
      "url(#plate)",
      BLUE.pale,
      1.3,
    );
    out += eye([-12, -28], 3.4) + eye([12, -28], 3.4);
    out += path(`M-14 -14Q0 ${-2 + wave(f) * 3} 14 -14Z`, BLUE.bg, 1.6);
    out += sparks([0, -70], 26, f, 4, 9);
    return out;
  },
  hacking: (f) => {
    let out = "";
    const glitch = f % 2 ? 6 : 0;
    for (const k of [-1, 1]) {
      const flap = [1, 0.7, 0.5, 0.8][f];
      for (const [rows, w] of [
        [0, 80],
        [1, 62],
      ] as const) {
        const y = -34 + rows * 36;
        out += hull(
          [
            [k * 8, y],
            [k * (8 + w * flap), y - 8],
            [k * (8 + w * flap), y + 28],
            [k * 8, y + 30],
          ],
          "url(#hull)",
          1.4,
        );
        for (let i = 1; i < 4; i++)
          out += line([k * (8 + (w * flap * i) / 4), y - 6 + i], [k * (8 + (w * flap * i) / 4), y + 28], BLUE.mid, 1);
      }
    }
    out += ell([0, 0], 10, 40);
    out += eye([0, -34], 3);
    out += path("M-4 -40L-16 -62M4 -40L16 -62", BLUE.pale, 1.8);
    out += circle([-16, -62], 2.4, "#ffffff", 1, "#ffffff") + circle([16, -62], 2.4, "#ffffff", 1, "#ffffff");
    // a torn slice of the picture
    out += poly(
      [
        [-70 + glitch, 6],
        [70 + glitch, 6],
        [70 + glitch, 12],
        [-70 + glitch, 12],
      ],
      BLUE.line,
      "none",
      0,
      'opacity=".5"',
    );
    return out;
  },
  exploration: (f) => {
    const hop = [0, -10, -16, -6][f];
    let out = "";
    for (let i = 0; i < 3; i++)
      out += line([-100 - i * 22, 52], [-86 - i * 22, 52], BLUE.mid, 2, `opacity="${0.8 - i * 0.25}"`);
    out += `<g transform="translate(0 ${hop})">`;
    out += ell([-56, 12], 14, 14, "url(#plate)");
    out += hull([
      [-40, 26],
      [-14, 50],
      [-60, 50],
    ]);
    out += ell([-6, 10], 54, 26);
    out += leg([30, 28], [58, 50], 4);
    out += hull([
      [40, -4],
      [74, -10],
      [84, 12],
      [46, 22],
    ]);
    for (const [x, tilt] of [
      [50, -8],
      [64, 4],
    ] as const)
      out += hull(
        [
          [x, -6],
          [x + tilt - 6, -38],
          [x + tilt + 8, -36],
          [x + 12, -8],
        ],
        "url(#crystal)",
        1.3,
      );
    out += eye([68, 2], 3);
    out += `</g>`;
    return out;
  },
  companions: (f) => {
    const spin = [1, 0.4, -1, -0.4][f];
    let out = "";
    out += line([0, -44], [0, -60], BLUE.pale, 2.4);
    out += path(`M${-34 * spin} -62L${34 * spin} -62`, "#ffffff", 3);
    out += ell([0, 0], 50, 44);
    out += path("M-50 0Q0 14 50 0", BLUE.mid, 1.2, "none", 'stroke-dasharray="4 4"');
    out += path("M0 -44Q10 0 0 44", BLUE.mid, 1.2, "none", 'stroke-dasharray="4 4"');
    out += circle([-18, -10], 7, BLUE.pale, 1.6, BLUE.bg) + circle([18, -10], 7, BLUE.pale, 1.6, BLUE.bg);
    out += line([-22, -14], [-14, -6], BLUE.pale, 1.2) + line([-22, -6], [-14, -14], BLUE.pale, 1.2);
    out += line([14, -14], [22, -6], BLUE.pale, 1.2) + line([14, -6], [22, -14], BLUE.pale, 1.2);
    out += path("M-8 14Q0 20 8 14", BLUE.pale, 1.8);
    for (const k of [-1, 1]) {
      out += hull(
        [
          [k * 46, 4],
          [k * 70, 8 + wave(f, k) * 5],
          [k * 62, 22],
          [k * 44, 18],
        ],
        "url(#plate)",
        1.3,
      );
      out += leg([k * 20, 42], [k * 22, 54], 4);
    }
    return out;
  },
  stargazing: (f) => {
    let out = "";
    // the comet tail streams behind
    for (let i = 0; i < 4; i++)
      out += path(
        `M-50 ${-6 + i * 12}Q${-110 - i * 10} ${-18 + i * 18 + wave(f, i) * 6} ${-150} ${-30 + i * 22}`,
        BLUE.light,
        1.6,
        "none",
        `opacity="${0.8 - i * 0.15}"`,
      );
    for (const x of [-34, -8, 22, 44]) out += leg([x, 32], [x + wave(f, x) * 3, 54], 4);
    out += ell([-4, 14], 58, 28);
    out += hull([
      [40, -10],
      [78, -8],
      [86, 14],
      [74, 28],
      [42, 28],
    ]);
    for (const x of [46, 70])
      out += hull(
        [
          [x, -10],
          [x + 4, -36],
          [x + 16, -10],
        ],
        "url(#plate)",
        1.3,
      );
    out += eye([68, 4], 3.2);
    // a star on the brow
    const star: Pt[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 4 : 9;
      star.push([58 + Math.cos(rad(i * 36 - 90)) * r, -6 + Math.sin(rad(i * 36 - 90)) * r]);
    }
    out += poly(star, "#ffffff", "#ffffff", 0.6);
    out += sparks([20, -34], 36, f, 5, 2);
    return out;
  },
};

/** The stage a pet stands on, with its name and the skill it came from. */
function stage(skill: string, f: number): string {
  const pet = PETS[skill as keyof typeof PETS]!;
  const bob = wave(f, 1) * 3;
  return (
    glow([320, 190], 150, 0.2) +
    circle([320, 190], 128, BLUE.dim, 1, "none", 'stroke-dasharray="3 7" opacity=".8"') +
    line([190, 292], [450, 292], BLUE.pale, 1.8) +
    line([220, 300], [420, 300], BLUE.mid, 1, 'opacity=".6"') +
    at(320, 206 + bob, 1.6, 0, DRAW[skill](f)) +
    card("", pet.name.toUpperCase(), [330, 100], f, 100, [440, 80])
  );
}

/** A frame of each pet's picture, by skill id. */
export const PET_ART: Record<string, (frame: number) => string> = Object.fromEntries(
  Object.keys(DRAW).map((skill, i) => [
    skill,
    (frame: number) => renderHud((f) => stage(skill, f), frame, 211 + i * 2),
  ]),
);
