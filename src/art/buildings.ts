import { BUILDING_BY_ID } from "../engine/data";
import { BuildingId } from "../engine/types";
import { GROUND, INK, Pt, poly, rect, renderScene, stroke } from "./terminal";

/**
 * Still-life art for every Base building, drawn in the terminal style (see terminal.ts).
 * A building that has not been built yet is shown dimmed, as a blueprint.
 */

type Draw = () => string;

const CX = 160;

const shadow = (w: number) => rect(CX - w / 2, GROUND + 2, w, 3, INK.dim);

const glint = (x: number, y: number, r = 4) =>
  poly(
    [
      [x, y - r],
      [x + r * 0.35, y - r * 0.35],
      [x + r, y],
      [x + r * 0.35, y + r * 0.35],
      [x, y + r],
      [x - r * 0.35, y + r * 0.35],
      [x - r, y],
      [x - r * 0.35, y - r * 0.35],
    ],
    INK.white,
    "none",
    0,
  );

/** Shrinks a drawing towards the middle of the floor, for buildings that would not otherwise fit. */
const scaled = (k: number, body: string) =>
  `<g transform="translate(${CX} ${GROUND}) scale(${k}) translate(${-CX} ${-GROUND})">${body}</g>`;

const circle = (x: number, y: number, r: number, fill: string, edge: string = INK.bg, w = 1.5) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${edge}" stroke-width="${w}"/>`;

/** The rotor arms and discs every drone hovers on. */
function rotors(y: number): string {
  return [-1, 1]
    .map(
      (side) =>
        stroke(`M${CX + side * 26} ${y + 6}L${CX + side * 62} ${y - 8}`, INK.white, 3) +
        rect(CX + side * 62 - 22, y - 12, 44, 4, INK.glow, INK.bg, 1),
    )
    .join("");
}

/** A hovering drone body with a lens, sitting over a landing pad. */
function drone(y: number, detail: string): string {
  return [
    shadow(120),
    poly(
      [
        [CX - 46, GROUND],
        [CX - 38, 150],
        [CX + 38, 150],
        [CX + 46, GROUND],
      ],
      INK.dim,
    ),
    rect(CX - 34, 152, 68, 2, INK.glow),
    rotors(y),
    poly(
      [
        [CX - 32, y + 6],
        [CX - 22, y - 12],
        [CX + 22, y - 12],
        [CX + 32, y + 6],
        [CX + 20, y + 22],
        [CX - 20, y + 22],
      ],
      INK.ore,
    ),
    circle(CX, y + 4, 8, "#000", INK.white),
    circle(CX, y + 4, 3, INK.glow, "none", 0),
    stroke(`M${CX - 22} ${y - 12}V${y + 22}M${CX + 22} ${y - 12}V${y + 22}`, INK.bg, 1),
    detail,
  ].join("");
}

const ART: Record<BuildingId, Draw> = {
  shelter: () =>
    [
      shadow(200),
      poly(
        [
          [84, GROUND],
          [90, 118],
          [116, 88],
          [160, 74],
          [204, 88],
          [230, 118],
          [236, GROUND],
        ],
        INK.ore,
      ),
      stroke("M116 88L124 158M160 74V158M204 88L196 158", INK.bg, 1),
      stroke("M90 118H230M100 98H220", INK.bg, 1),
      // door
      poly(
        [
          [140, GROUND],
          [140, 122],
          [150, 114],
          [170, 114],
          [180, 122],
          [180, GROUND],
        ],
        "#000",
        INK.white,
        1.5,
      ),
      rect(148, 120, 24, 34, INK.dim),
      // window and vent
      rect(190, 126, 22, 14, INK.glow, INK.bg, 1),
      rect(100, 130, 18, 10, INK.glow, INK.bg, 1),
      // roof beacon and antenna
      stroke("M160 74V50M152 56H168", INK.white, 2),
      rect(157, 44, 6, 6, INK.glow),
      glint(238, 70, 3),
      glint(82, 84, 3),
    ].join(""),

  generator: () => {
    let panels = "";
    for (const [x, tilt] of [
      [92, 0],
      [172, 0],
    ] as [number, number][]) {
      const p: Pt[] = [
        [x, 104 + tilt],
        [x + 68, 92 + tilt],
        [x + 80, 124 + tilt],
        [x + 10, 138 + tilt],
      ];
      panels += poly(p, INK.bg, INK.white, 2);
      for (let i = 1; i < 4; i++) {
        panels += stroke(
          `M${x + i * 17} ${104 - i * 3 + tilt}L${x + 10 + i * 17} ${138 - i * 3 + tilt}`,
          INK.ui,
          1,
        );
      }
      panels += stroke(`M${x + 5} 121L${x + 74} 108`, INK.ui, 1);
      panels += poly(
        [
          [x + 6, 106 + tilt],
          [x + 24, 102 + tilt],
          [x + 28, 112 + tilt],
          [x + 10, 117 + tilt],
        ],
        INK.glow,
        "none",
        0,
      );
      panels += stroke(`M${x + 40} 132L${x + 38} ${GROUND}`, INK.white, 3);
    }
    return [
      shadow(240),
      panels,
      // battery box
      poly(
        [
          [136, GROUND],
          [136, 124],
          [184, 124],
          [184, GROUND],
        ],
        INK.ore,
      ),
      rect(142, 130, 36, 6, INK.bg),
      rect(144, 132, 14, 2, INK.glow),
      rect(142, 142, 36, 10, "#000", INK.white, 1),
      rect(145, 145, 8, 4, INK.glow),
      rect(156, 145, 8, 4, INK.glow),
      rect(167, 145, 8, 4, INK.ui),
      // sun
      circle(160, 56, 10, INK.white, "none", 0),
      stroke("M160 34V42M160 70V78M138 56H146M174 56H182M144 40L150 46M176 40L170 46", INK.glow, 2),
    ].join("");
  },

  workshop: () =>
    [
      shadow(240),
      // shed
      poly(
        [
          [84, GROUND],
          [84, 94],
          [100, 80],
          [236, 80],
          [236, GROUND],
        ],
        INK.ore,
      ),
      poly(
        [
          [76, 94],
          [96, 70],
          [240, 70],
          [246, 94],
        ],
        INK.white,
      ),
      stroke("M84 94H236", INK.bg, 1.5),
      rect(98, 100, 124, 52, "#000", INK.white, 1.5),
      // bench and hologram
      rect(106, 134, 108, 8, INK.ore, INK.bg, 1),
      rect(112, 142, 6, 12, INK.ore, INK.bg, 1),
      rect(202, 142, 6, 12, INK.ore, INK.bg, 1),
      poly(
        [
          [140, 128],
          [160, 108],
          [180, 128],
          [160, 124],
        ],
        "none",
        INK.glow,
        1.5,
      ),
      stroke("M160 108V134", INK.glow, 1),
      // tool rack
      stroke("M110 108H152M110 108V118M124 108V122M138 108V116", INK.white, 2),
      rect(172, 106, 40, 4, INK.dim),
      rect(176, 112, 6, 14, INK.glow),
      rect(190, 112, 6, 10, INK.white),
      // chimney with smoke
      rect(214, 52, 14, 20, INK.white, INK.bg, 1.5),
      stroke("M221 44Q228 36 220 28M221 30Q214 22 222 14", INK.glow, 1.5),
      glint(92, 60, 3),
    ].join(""),

  salvage_drone: () =>
    drone(
      86,
      [
        // grabber arm holding a scrap plate
        stroke(`M${CX} ${108}V122`, INK.white, 3),
        poly(
          [
            [CX - 14, 122],
            [CX - 8, 134],
            [CX - 4, 134],
            [CX, 126],
            [CX + 4, 134],
            [CX + 8, 134],
            [CX + 14, 122],
          ],
          INK.white,
        ),
        poly(
          [
            [CX - 20, 142],
            [CX - 12, 132],
            [CX + 14, 134],
            [CX + 22, 144],
            [CX + 6, 148],
          ],
          INK.ore,
        ),
        stroke(`M${CX - 8} 138L${CX + 12} 140`, INK.bg, 1),
      ].join(""),
    ),

  mining_drone: () =>
    drone(
      80,
      [
        // drill head pointing at the ground
        rect(CX - 8, 102, 16, 10, INK.white, INK.bg, 1.5),
        poly(
          [
            [CX - 10, 112],
            [CX + 10, 112],
            [CX + 3, 140],
            [CX - 3, 140],
          ],
          INK.ore,
        ),
        stroke(
          `M${CX - 7} 116L${CX + 6} 120M${CX - 6} 124L${CX + 5} 128M${CX - 4} 132L${CX + 4} 135`,
          INK.bg,
          1,
        ),
        // ore chips
        rect(CX - 22, 144, 4, 4, INK.ore),
        rect(CX + 18, 142, 4, 4, INK.glow),
        rect(CX + 28, 148, 3, 3, INK.ore),
      ].join(""),
    ),

  hydroponic_bay: () => {
    // three racked trays with sprouts at different heights, a grow lamp over each
    const tray = (y: number, sprouts: number[]) =>
      [
        rect(96, y + 14, 128, 6, INK.ore, INK.bg, 1),
        rect(100, y + 20, 4, 14, INK.dim),
        rect(216, y + 20, 4, 14, INK.dim),
        ...sprouts.map((h, i) => {
          const x = 110 + i * 26;
          return (
            stroke(`M${x} ${y + 14}V${y + 14 - h}`, INK.glow, 2) +
            poly(
              [
                [x, y + 14 - h],
                [x - 7, y + 8 - h],
                [x - 2, y + 16 - h],
              ],
              INK.glow,
            ) +
            poly(
              [
                [x, y + 14 - h],
                [x + 7, y + 8 - h],
                [x + 2, y + 16 - h],
              ],
              INK.white,
            )
          );
        }),
        rect(96, y - 18, 128, 3, INK.white),
        poly(
          [
            [100, y - 15],
            [220, y - 15],
            [232, y - 4],
            [88, y - 4],
          ],
          INK.glow,
          "none",
          0,
        ),
      ].join("");
    return [
      shadow(160),
      rect(88, 40, 4, GROUND - 40, INK.dim),
      rect(228, 40, 4, GROUND - 40, INK.dim),
      tray(56, [6, 10, 14, 10, 6]),
      tray(98, [10, 14, 8, 14, 10]),
      tray(140, [4, 4, 6, 4, 4]),
    ].join("");
  },

  forager_drone: () =>
    drone(
      82,
      [
        // basket slung underneath, a glowcap inside and a cutter arm
        stroke(`M${CX - 16} 104L${CX - 24} 122M${CX + 16} 104L${CX + 24} 122`, INK.white, 2),
        poly(
          [
            [CX - 28, 122],
            [CX + 28, 122],
            [CX + 20, 144],
            [CX - 20, 144],
          ],
          INK.ore,
        ),
        stroke(`M${CX - 24} 130H${CX + 24}M${CX - 22} 137H${CX + 22}`, INK.bg, 1),
        poly(
          [
            [CX - 12, 122],
            [CX - 10, 112],
            [CX - 2, 108],
            [CX + 6, 112],
            [CX + 8, 122],
          ],
          INK.glow,
        ),
        rect(CX - 6, 114, 3, 3, INK.white),
        poly(
          [
            [CX + 12, 122],
            [CX + 14, 116],
            [CX + 20, 114],
            [CX + 22, 122],
          ],
          INK.white,
        ),
        // cutter arm
        stroke(`M${CX + 30} 90L${CX + 54} 112`, INK.white, 3),
        poly(
          [
            [CX + 52, 108],
            [CX + 64, 116],
            [CX + 56, 120],
          ],
          INK.glow,
        ),
      ].join(""),
    ),

  beacon: () => {
    let braces = "";
    for (let i = 0; i < 6; i++) {
      const y = 148 - i * 16;
      const half = 18 - i * 2.4;
      braces += stroke(
        `M${CX - half} ${y}L${CX + half - 2.4} ${y - 16}M${CX + half} ${y}L${CX - half + 2.4} ${y - 16}`,
        INK.bg,
        1,
      );
    }
    return scaled(
      0.85,
      [
        shadow(120),
        poly(
          [
            [CX - 40, GROUND],
            [CX - 30, 148],
            [CX + 30, 148],
            [CX + 40, GROUND],
          ],
          INK.dim,
        ),
        poly(
          [
            [CX - 18, 150],
            [CX - 4, 50],
            [CX + 4, 50],
            [CX + 18, 150],
          ],
          "none",
          INK.white,
          2.5,
        ),
        braces,
        // dish
        poly(
          [
            [CX - 22, 54],
            [CX - 4, 44],
            [CX + 4, 44],
            [CX + 22, 54],
            [CX + 12, 60],
            [CX - 12, 60],
          ],
          INK.ore,
        ),
        stroke(`M${CX} 44V24`, INK.white, 2),
        circle(CX, 22, 5, INK.glow, INK.white, 1.5),
        // signal arcs
        stroke(
          `M${CX - 20} 12Q${CX - 28} 22 ${CX - 20} 32M${CX + 20} 12Q${CX + 28} 22 ${CX + 20} 32`,
          INK.glow,
          2,
        ),
        stroke(
          `M${CX - 34} 6Q${CX - 48} 22 ${CX - 34} 38M${CX + 34} 6Q${CX + 48} 22 ${CX + 34} 38`,
          INK.ui,
          2,
        ),
        stroke(
          `M${CX - 48} 0Q${CX - 68} 22 ${CX - 48} 44M${CX + 48} 0Q${CX + 68} 22 ${CX + 48} 44`,
          INK.dim,
          2,
        ),
      ].join(""),
    );
  },

  translator: () => {
    let wave = "";
    const heights = [4, 10, 18, 8, 22, 12, 6, 16, 9, 3];
    heights.forEach((h, i) => {
      wave += rect(118 + i * 8, 100 - h / 2, 4, h, i % 3 ? INK.glow : INK.white);
    });
    return [
      shadow(180),
      poly(
        [
          [96, GROUND],
          [100, 74],
          [116, 64],
          [204, 64],
          [220, 74],
          [224, GROUND],
        ],
        INK.ore,
      ),
      rect(110, 76, 100, 48, "#000", INK.white, 1.5),
      wave,
      stroke("M116 112H204M116 82H150", INK.ui, 1),
      // speaker grille and buttons
      rect(112, 134, 40, 16, INK.bg, INK.white, 1),
      stroke("M118 138V146M124 138V146M130 138V146M136 138V146M142 138V146", INK.dim, 2),
      circle(176, 142, 6, INK.glow, INK.bg, 1.5),
      circle(196, 142, 6, INK.white, INK.bg, 1.5),
      // antenna
      stroke("M200 64L212 36M212 36H224", INK.white, 2),
      rect(222, 33, 6, 6, INK.glow),
      stroke("M232 28Q238 36 232 44", INK.glow, 1.5),
      glint(94, 56, 3),
    ].join("");
  },

  hub: () => {
    let stripes = "";
    for (let i = 0; i < 6; i++) {
      stripes += poly(
        [
          [90 + i * 23.3, 78],
          [90 + (i + 1) * 23.3, 78],
          [86 + (i + 1) * 24.6, 98],
          [86 + i * 24.6, 98],
        ],
        i % 2 ? INK.glow : INK.white,
        INK.bg,
        1,
      );
    }
    return [
      shadow(240),
      // posts
      rect(92, 98, 5, 60, INK.white, INK.bg, 1),
      rect(223, 98, 5, 60, INK.white, INK.bg, 1),
      // canopy
      stripes,
      poly(
        [
          [86, 78],
          [100, 62],
          [220, 62],
          [234, 78],
        ],
        INK.ore,
      ),
      stroke("M86 98H234", INK.bg, 1.5),
      // counter
      poly(
        [
          [90, 130],
          [230, 130],
          [236, 158],
          [84, 158],
        ],
        INK.ore,
      ),
      stroke("M94 140H226", INK.bg, 1),
      rect(100, 134, 26, 4, INK.glow),
      // goods
      rect(110, 114, 22, 16, INK.white, INK.bg, 1),
      rect(138, 108, 18, 22, INK.ore, INK.bg, 1),
      stroke("M110 122H132M138 118H156", INK.bg, 1),
      circle(184, 120, 10, INK.glow, INK.white, 1.5),
      glint(184, 120, 5),
      rect(200, 118, 18, 12, INK.white, INK.bg, 1),
      // credit sign
      rect(138, 44, 44, 14, "#000", INK.ui, 1.5),
      rect(146, 49, 8, 4, INK.glow),
      rect(158, 49, 8, 4, INK.glow),
      rect(170, 49, 6, 4, INK.white),
    ].join("");
  },
};

/** The still-life SVG for a building. `level` 0 shows it as an unbuilt, dimmed blueprint. */
export function buildingSvg(id: BuildingId, level: number): string {
  const def = BUILDING_BY_ID[id];
  const subject = () => (level > 0 ? ART[id]() : `<g opacity=".3">${ART[id]()}</g>`);
  const status = level > 0 ? `LEVEL ${level}/${def.maxLevel}` : "NOT BUILT";
  return renderScene({ title: def.name.toUpperCase(), status, subject }, 0);
}

export const BUILDING_ART_IDS = Object.keys(ART) as BuildingId[];
