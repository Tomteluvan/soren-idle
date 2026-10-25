import { GROUND, INK, Pt, poly, pts, rect, stroke } from "./terminal";
import { hash } from "./util";

/**
 * What each scene is about. Every function draws in screen coordinates and takes the frame
 * (0 raised, 1 swinging, 2 hit, 3 recoil) so the subject can react to the tool.
 */

/** Scales a drawing about a point, so small subjects can be sized up without redrawing them. */
const scaled = (k: number, cx: number, cy: number, body: string) =>
  `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">${body}</g>`;

const shakeOf = (f: number) => (f === 2 ? 2 : 0);
const wrap = (shake: number, body: string) =>
  `<g transform="translate(${shake} ${shake ? 1 : 0})">${body}</g>`;

// --- outcrops -------------------------------------------------------------------

interface Crystal {
  base: Pt;
  lean: number;
  h: number;
  w: number;
}

/** A hollow crystal shard with a glowing core. */
function crystal({ base: [x, y], lean, h, w }: Crystal, fill: string = INK.bg): string {
  const tip: Pt = [x + lean, y - h];
  const body: Pt[] = [
    [x - w / 2, y],
    [x - w / 2 + lean * 0.4, y - h * 0.72],
    tip,
    [x + w / 2 + lean * 0.4, y - h * 0.72],
    [x + w / 2, y],
  ];
  return [
    poly(body, fill, INK.white),
    stroke(`M${x} ${y - 3}L${x + lean * 0.8} ${y - h + 6}`, INK.glow),
  ].join("");
}

const FERRITE_OUTLINE: Pt[] = [
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

/** Raw ferrite: a lumpy outcrop split into plates, with strata, pockets, veins and a few crystal shards. */
export function ferrite(f: number): string {
  let strata = "";
  for (let i = 0; i < 6; i++) {
    const y = 84 + i * 13;
    const j = (k: number) => Math.round(hash(i, k, 31) * 8 - 4);
    strata += stroke(`M100 ${y + j(1)}Q150 ${y + j(2)} 200 ${y + j(3)}T310 ${y + j(4)}`, INK.bg, 1);
  }
  let rubble = "";
  for (const [x, w] of [
    [92, 8],
    [100, 6],
    [300, 9],
    [310, 5],
    [84, 5],
  ] as [number, number][]) {
    rubble += poly(
      [
        [x, GROUND],
        [x + w * 0.3, GROUND - w * 0.7],
        [x + w, GROUND - w * 0.3],
        [x + w, GROUND],
      ],
      INK.ore,
      "none",
      0,
    );
  }
  const facets = [
    "M156 82L176 106L168 132L144 144",
    "M176 106L212 102L226 126L212 156",
    "M212 60L212 102",
    "M226 126L258 120L266 86",
    "M258 120L276 146L288 156",
    "M168 132L196 144L212 156",
    "M134 108L156 120L168 132",
  ];
  const pockets: Pt[][] = [
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
  const crystals: Crystal[] = [
    { base: [226, 60], lean: -3, h: 34, w: 9 },
    { base: [240, 60], lean: 4, h: 24, w: 8 },
    { base: [150, 99], lean: -6, h: 20, w: 7 },
  ];
  return wrap(
    shakeOf(f),
    [
      rubble,
      `<clipPath id="rock-ferrite"><polygon points="${pts(FERRITE_OUTLINE)}"/></clipPath>`,
      `<polygon points="${pts(FERRITE_OUTLINE)}" fill="${INK.ore}" stroke="${INK.ore}" stroke-width="2" stroke-linejoin="round"/>`,
      `<g clip-path="url(#rock-ferrite)" opacity=".5">${strata}</g>`,
      ...facets.map((d) => stroke(d)),
      ...pockets.map((p) => poly(p, "#000", INK.white, 1)),
      stroke("M178 140L190 150L200 142L212 150", INK.ui, 3),
      stroke("M262 128L270 140L282 134L288 146", INK.ui, 3),
      ...crystals.map((c) => crystal(c)),
      f >= 2 ? stroke("M168 86L176 98L170 106M168 86L158 96") : "",
    ].join(""),
  );
}

/** Lumina: a low mound with tall glowing crystals that pulse. */
export function lumina(f: number): string {
  const mound: Pt[] = [
    [140, GROUND],
    [138, 146],
    [154, 134],
    [178, 130],
    [210, 128],
    [240, 132],
    [262, 142],
    [274, GROUND],
  ];
  const crystals: Crystal[] = [
    { base: [160, 140], lean: -14, h: 40, w: 12 },
    { base: [186, 130], lean: -6, h: 62, w: 16 },
    { base: [212, 128], lean: 2, h: 90, w: 20 },
    { base: [238, 132], lean: 8, h: 56, w: 16 },
    { base: [260, 142], lean: 14, h: 36, w: 12 },
  ];
  const pulse = f % 2 ? INK.glow : INK.white;
  return wrap(
    shakeOf(f),
    [
      poly(mound),
      stroke("M150 144L168 140M196 138L222 140M246 142L262 148", INK.bg, 1),
      ...crystals.map(
        (c) =>
          crystal(c, pulse) +
          stroke(`M${c.base[0]} ${c.base[1]}L${c.base[0] + c.lean} ${c.base[1] - c.h}`, INK.bg, 1),
      ),
      f >= 2 ? stroke("M186 92L190 104L184 112", INK.bg, 2) : "",
    ].join(""),
  );
}

// --- salvage --------------------------------------------------------------------

/** Torn hull plating with a hazard band and rivets. The cut grows down the left plate. */
export function hullScrap(f: number): string {
  const cut = [0, 8, 18, 28][f];
  let rivets = "";
  for (const [x, y] of [
    [158, 84],
    [158, 150],
    [210, 74],
    [210, 150],
    [226, 108],
    [264, 112],
    [226, 150],
    [270, 150],
  ]) {
    rivets += rect(x, y, 3, 3, INK.bg);
  }
  let hazard = "";
  for (let i = 0; i < 6; i++)
    hazard += poly(
      [
        [156 + i * 10, 128],
        [162 + i * 10, 128],
        [158 + i * 10, 138],
        [152 + i * 10, 138],
      ],
      INK.bg,
      "none",
      0,
    );
  return wrap(
    shakeOf(f) && 1,
    [
      poly([
        [150, GROUND],
        [150, 84],
        [162, 72],
        [212, 66],
        [220, 82],
        [218, GROUND],
      ]),
      poly([
        [220, GROUND],
        [220, 102],
        [236, 92],
        [272, 104],
        [284, 128],
        [278, GROUND],
      ]),
      poly(
        [
          [178, 100],
          [196, 96],
          [204, 110],
          [190, 118],
        ],
        "#000",
        INK.white,
        1,
      ),
      hazard,
      rivets,
      stroke("M232 118L246 112L252 126L262 120", INK.bg),
      // the cut: a glowing line growing down the left plate
      stroke(`M150 92V${92 + cut}`, INK.white, 3),
    ].join(""),
  );
}

/** A console with an opened hatch and cut cables. */
export function wiring(f: number): string {
  let screen = "";
  for (let i = 0; i < 5; i++)
    screen += rect(228, 84 + ((i * 6 + f * 2) % 28), 14 + (i % 3) * 6, 2, INK.glow);
  const sway = f % 2 ? 2 : -2;
  return wrap(
    shakeOf(f) && 1,
    [
      poly([
        [190, GROUND],
        [190, 66],
        [286, 66],
        [286, GROUND],
      ]),
      poly(
        [
          [190, 80],
          [214, 74],
          [214, 130],
          [190, 136],
        ],
        INK.bg,
        INK.white,
        1.5,
      ),
      rect(224, 80, 50, 36, "#000", INK.white, 1.5),
      screen,
      rect(224, 124, 8, 8, f % 2 ? INK.white : INK.dim),
      rect(238, 124, 8, 8, f % 2 ? INK.dim : INK.white),
      stroke(`M200 110Q${186 + sway} 130 ${176 + sway} 150`, INK.white, 2),
      stroke(`M204 112Q${196 + sway} 134 ${192 + sway * 2} 152`, INK.glow, 2),
      stroke(`M208 112Q${210 + sway} 132 ${214 - sway} 150`, INK.ui, 2),
      stroke("M232 138H280M232 146H268", INK.bg, 2),
    ].join(""),
  );
}

/** A cargo pod whose lid lifts as the seam is cut. */
export function cargoPod(f: number): string {
  const lift = [0, 1, 4, 7][f];
  return wrap(
    shakeOf(f) && 1,
    [
      poly([
        [168, GROUND],
        [160, 124],
        [172, 104],
        [268, 104],
        [280, 124],
        [272, GROUND],
      ]),
      rect(168, 134, 104, 4, INK.bg),
      stroke("M190 104V158M250 104V158", INK.bg, 2),
      // lid
      poly([
        [166, 104 - lift],
        [178, 84 - lift],
        [262, 84 - lift],
        [274, 104 - lift],
      ]),
      lift > 2 ? stroke("M184 100H258M190 94H252", INK.white, 2) : "",
      rect(214, 90 - lift, 12, 6, "#000", INK.white, 1),
      rect(204, 140, 32, 10, "#000", INK.white, 1),
    ].join(""),
  );
}

// --- foraging -------------------------------------------------------------------

function mushroom(
  x: number,
  stalkH: number,
  capW: number,
  capH: number,
  glow: boolean,
  drop = 0,
): string {
  const top = GROUND - stalkH;
  const cap: Pt[] = [
    [x - capW / 2, top],
    [x - capW / 2 + 7, top - capH],
    [x + capW / 2 - 7, top - capH],
    [x + capW / 2, top],
  ];
  return [
    poly(
      [
        [x - 5, GROUND],
        [x - 4, top],
        [x + 4, top],
        [x + 5, GROUND],
      ],
      INK.white,
    ),
    `<g transform="translate(${drop * 0.6} ${drop})">`,
    glow
      ? poly(
          cap.map(([a, b]) => [a + (a < x ? -3 : 3), b - 3] as Pt),
          "none",
          INK.glow,
          1.5,
        )
      : "",
    poly(cap),
    stroke(`M${x - capW / 2 + 6} ${top - 4}H${x + capW / 2 - 6}`, INK.bg, 1),
    rect(x - 3, top - capH + 4, 6, 3, INK.white),
    `</g>`,
  ].join("");
}

/** Glowcap: bioluminescent mushrooms. The big one is cut at the stalk and the cap topples. */
export function glowcap(f: number): string {
  const fall = [0, 0, 2, 12][f];
  let spores = "";
  for (let i = 0; i < 5; i++) {
    const y = 60 + ((i * 17 + f * 6) % 80);
    spores += poly(
      [
        [196 + i * 14, y - 3],
        [199 + i * 14, y],
        [196 + i * 14, y + 3],
        [193 + i * 14, y],
      ],
      i % 2 ? INK.glow : INK.white,
      "none",
      0,
    );
  }
  return scaled(
    1.5,
    225,
    GROUND,
    [
      mushroom(238, 22, 34, 18, f % 2 === 0),
      mushroom(204, 36, 52, 24, f % 2 === 1, fall),
      mushroom(268, 16, 24, 14, f % 2 === 0),
      mushroom(180, 12, 18, 10, f % 2 === 1),
      spores,
      f >= 2 ? stroke("M198 124H212", INK.white, 2) : "",
    ].join(""),
  );
}

/** Sweetroot: a faceted tuber in a mound of soil, with leaves on top. */
export function sweetroot(f: number): string {
  const dirt = f >= 2 ? 2 : 0;
  const leaves: Pt[][] = [
    [
      [200, 120],
      [188, 88],
      [206, 112],
    ],
    [
      [206, 118],
      [208, 80],
      [216, 114],
    ],
    [
      [214, 120],
      [236, 90],
      [224, 118],
    ],
    [
      [196, 122],
      [172, 104],
      [194, 114],
    ],
  ];
  return scaled(
    1.4,
    225,
    GROUND,
    wrap(
      shakeOf(f) && 1,
      [
        ...leaves.map((l) => poly(l, INK.white)),
        poly(
          [
            [170, GROUND],
            [178, 140 + dirt],
            [204, 132],
            [236, 134],
            [262, 144],
            [270, GROUND],
          ],
          INK.dim,
          INK.dim,
        ),
        poly([
          [188, 146],
          [190, 124],
          [210, 116],
          [230, 124],
          [234, 146],
          [212, 152],
        ]),
        stroke("M200 120L204 148M216 118L220 150M190 134L232 136", INK.bg, 1),
        poly([
          [240, 150],
          [248, 138],
          [262, 142],
          [258, 152],
        ]),
      ].join(""),
    ),
  );
}

// --- engineering -----------------------------------------------------------------

/** A stove with a pot on it. Flames flicker, steam drifts up. */
export function pot(f: number): string {
  const flames = ["#fff", INK.glow, "#fff"];
  let fire = "";
  for (let i = 0; i < 4; i++) {
    const h = 6 + ((i + f) % 3) * 4;
    fire += poly(
      [
        [196 + i * 16, 156],
        [200 + i * 16, 156 - h],
        [204 + i * 16, 156],
      ],
      flames[(i + f) % 3],
      "none",
      0,
    );
  }
  let steam = "";
  for (let i = 0; i < 3; i++) {
    const y = 78 - ((f * 5 + i * 9) % 26);
    steam += poly(
      [
        [214 + i * 18, y - 5],
        [219 + i * 18, y],
        [214 + i * 18, y + 5],
        [209 + i * 18, y],
      ],
      "none",
      INK.glow,
      1.2,
    );
  }
  return wrap(
    0,
    [
      poly([
        [176, GROUND],
        [182, 136],
        [270, 136],
        [276, GROUND],
      ]),
      rect(192, 142, 66, 16, "#000"),
      fire,
      poly([
        [184, 136],
        [176, 100],
        [188, 90],
        [260, 90],
        [272, 100],
        [264, 136],
      ]),
      rect(186, 92, 72, 4, INK.bg),
      rect(170, 104, 8, 4, INK.white),
      rect(270, 104, 8, 4, INK.white),
      steam,
    ].join(""),
  );
}

/** An anvil with a glowing bar of alloy on its face. */
export function anvil(f: number): string {
  const bar = f >= 2 ? INK.white : INK.glow;
  return wrap(
    shakeOf(f) && 1,
    [
      poly([
        [140, 116],
        [160, 110],
        [268, 110],
        [268, 124],
        [240, 126],
        [234, 144],
        [254, 148],
        [258, GROUND],
        [172, GROUND],
        [176, 148],
        [194, 144],
        [192, 126],
        [160, 124],
      ]),
      stroke("M200 124V144M230 126V144", INK.bg, 1),
      poly(
        [
          [190, 102],
          [238, 102],
          [242, 110],
          [186, 110],
        ],
        bar,
        INK.bg,
        1,
      ),
      rect(198, 104, 34, 2, INK.white),
    ].join(""),
  );
}

type Hologram = (f: number) => string;

const holo = (shapes: string, f: number) => {
  const sx = [1, 0.72, 0.4, 0.72][f];
  return `<g transform="translate(246 84) scale(${1.6 * sx} 1.6) translate(-214 -66)">${shapes}</g>`;
};
const out = (p: Pt[], color: string = INK.white) => poly(p, "none", color, 1.5);

/** Holograms of the thing being built; they turn slowly as the bench works. */
export const HOLOGRAMS: Record<string, Hologram> = {
  torch: (f) =>
    holo(
      [
        out([
          [184, 60],
          [232, 60],
          [232, 72],
          [184, 72],
        ]),
        out(
          [
            [232, 62],
            [246, 66],
            [232, 70],
          ],
          INK.glow,
        ),
        out(
          [
            [194, 50],
            [214, 50],
            [214, 60],
            [194, 60],
          ],
          INK.glow,
        ),
      ].join(""),
      f,
    ),
  kit: (f) =>
    holo(
      [
        out([
          [186, 52],
          [242, 52],
          [242, 82],
          [186, 82],
        ]),
        out(
          [
            [204, 52],
            [208, 44],
            [220, 44],
            [224, 52],
          ],
          INK.glow,
        ),
        stroke("M214 58V76M205 67H223", INK.glow, 2),
      ].join(""),
      f,
    ),
  drill: (f) =>
    holo(
      [
        out([
          [190, 46],
          [212, 46],
          [212, 66],
          [190, 66],
        ]),
        out(
          [
            [212, 50],
            [244, 56],
            [212, 62],
          ],
          INK.glow,
        ),
        out([
          [196, 66],
          [204, 82],
          [196, 82],
        ]),
      ].join(""),
      f,
    ),
  blade: (f) =>
    holo(
      [
        out([
          [186, 64],
          [240, 60],
          [252, 66],
          [240, 72],
          [186, 68],
        ]),
        out(
          [
            [184, 58],
            [190, 58],
            [190, 74],
            [184, 74],
          ],
          INK.glow,
        ),
      ].join(""),
      f,
    ),
  armor: (f) =>
    holo(
      [
        out([
          [190, 52],
          [206, 46],
          [222, 46],
          [238, 52],
          [244, 70],
          [232, 72],
          [230, 90],
          [198, 90],
          [196, 72],
          [184, 70],
        ]),
        stroke("M214 50V88", INK.glow, 2),
      ].join(""),
      f,
    ),
  suit: (f) =>
    holo(
      [
        out([
          [190, 52],
          [206, 46],
          [222, 46],
          [238, 52],
          [244, 70],
          [232, 72],
          [230, 90],
          [198, 90],
          [196, 72],
          [184, 70],
        ]),
        out(
          [
            [184, 70],
            [172, 88],
            [180, 92],
            [192, 76],
          ],
          INK.glow,
        ),
        out(
          [
            [244, 70],
            [256, 88],
            [248, 92],
            [236, 76],
          ],
          INK.glow,
        ),
        stroke("M214 50V88", INK.glow, 2),
      ].join(""),
      f,
    ),
  jar: (f) =>
    holo(
      [
        out([
          [194, 50],
          [234, 50],
          [234, 84],
          [194, 84],
        ]),
        out(
          [
            [190, 44],
            [238, 44],
            [238, 50],
            [190, 50],
          ],
          INK.glow,
        ),
        out(
          [
            [214, 60],
            [220, 68],
            [214, 76],
            [208, 68],
          ],
          INK.glow,
        ),
      ].join(""),
      f,
    ),
};

/** A workbench with a part on it and a hologram of the finished item floating above. */
export function bench(kind: keyof typeof HOLOGRAMS): (f: number) => string {
  return (f) =>
    wrap(
      shakeOf(f) && 1,
      [
        poly([
          [150, 130],
          [286, 130],
          [292, 140],
          [144, 140],
        ]),
        rect(158, 140, 8, 18, INK.ore),
        rect(268, 140, 8, 18, INK.ore),
        poly(
          [
            [188, 120],
            [212, 120],
            [216, 130],
            [184, 130],
          ],
          f >= 2 ? INK.white : INK.glow,
          INK.bg,
          1,
        ),
        HOLOGRAMS[kind](f),
      ].join(""),
    );
}

// --- monsters --------------------------------------------------------------------

const lunge = (f: number) => (f === 2 ? 4 : f === 3 ? -3 : 0);

function monsterFill(f: number) {
  return f === 2 ? INK.white : INK.ore;
}

/** Dust Skitter: a six-legged scuttler. */
export function skitter(f: number): string {
  const dx = lunge(f);
  let legs = "";
  for (let i = 0; i < 3; i++) {
    const lift = (i + f) % 2 ? 6 : 0;
    legs += stroke(
      `M${228 + i * 14} 136L${220 + i * 14} 148L${214 + i * 14} ${GROUND - lift}`,
      INK.ore,
      2,
    );
    legs += stroke(
      `M${232 + i * 14} 136L${242 + i * 14} 148L${250 + i * 14} ${GROUND - (lift ? 0 : 6)}`,
      INK.ore,
      2,
    );
  }
  return scaled(
    1.35,
    235,
    GROUND,
    `<g transform="translate(${dx} 0)">${legs}${poly(
      [
        [212, 126],
        [226, 112],
        [258, 112],
        [272, 126],
        [258, 142],
        [226, 142],
      ],
      monsterFill(f),
    )}${poly(
      [
        [198, 124],
        [212, 120],
        [212, 136],
        [198, 134],
      ],
      monsterFill(f),
    )}${rect(202, 124, 3, 3, INK.bg)}${rect(202, 130, 3, 3, INK.bg)}${stroke("M200 120L190 104M204 119L200 102", INK.ore, 1.5)}${stroke("M226 120L244 130M240 116L258 128", INK.bg, 1.5)}</g>`,
  );
}

/** Cave Stalker: a heavy four-legged hunter with a toothed jaw. */
export function stalker(f: number): string {
  const dx = lunge(f);
  const fill = monsterFill(f);
  let legs = "";
  for (const [i, x] of [210, 226, 256, 272].entries()) {
    const lift = (i + f) % 2 ? 5 : 0;
    legs += poly(
      [
        [x, 138],
        [x + 12, 138],
        [x + 10, GROUND - lift],
        [x + 1, GROUND - lift],
      ],
      fill,
    );
  }
  return `<g transform="translate(${dx} 0)">${legs}${stroke(`M290 118L304 ${96 - (f % 2) * 4}`, INK.ore, 3)}${poly(
    [
      [196, 108],
      [244, 96],
      [284, 104],
      [294, 128],
      [274, 142],
      [212, 144],
      [194, 130],
    ],
    fill,
  )}${poly(
    [
      [162, 112],
      [196, 104],
      [200, 130],
      [168, 136],
      [158, 126],
    ],
    fill,
  )}${poly(
    [
      [166, 130],
      [172, 140],
      [178, 132],
    ],
    INK.white,
    "none",
    0,
  )}${poly(
    [
      [180, 132],
      [186, 142],
      [192, 133],
    ],
    INK.white,
    "none",
    0,
  )}${rect(176, 114, 5, 4, INK.glow)}${rect(186, 112, 5, 4, INK.glow)}${stroke("M214 114L228 130M240 108L254 128", INK.bg, 1.5)}</g>`;
}

/** Rift Wraith: a hollow, drifting shape with a glowing core. */
export function wraith(f: number): string {
  const dx = lunge(f);
  const bob = f % 2 ? -3 : 0;
  const hem = f % 2 ? 4 : 0;
  const body: Pt[] = [
    [212, 60],
    [238, 50],
    [262, 62],
    [268, 94],
    [260, 126],
    [270, 152 + hem],
    [252, 142],
    [242, 158 - hem],
    [230, 142],
    [216, 156 + hem],
    [208, 128],
    [202, 94],
  ];
  return `<g transform="translate(${dx} ${bob})">${poly(body, f === 2 ? INK.white : INK.bg, INK.white, 2)}${poly(
    [
      [236, 86],
      [246, 98],
      [236, 110],
      [226, 98],
    ],
    INK.glow,
    "none",
    0,
  )}${poly(
    [
      [222, 72],
      [230, 76],
      [222, 80],
    ],
    INK.white,
    "none",
    0,
  )}${poly(
    [
      [252, 72],
      [244, 76],
      [252, 80],
    ],
    INK.white,
    "none",
    0,
  )}${stroke("M212 124L226 118M262 120L250 116", INK.dim, 1.5)}</g>`;
}

// --- camp -------------------------------------------------------------------------

/** Idle: a campfire in front of the wreck of the ship. */
export function camp(f: number): string {
  const flame = [INK.white, INK.glow, INK.white];
  let fire = "";
  for (let i = 0; i < 3; i++) {
    const h = 14 + ((i + f) % 3) * 6;
    fire += poly(
      [
        [150 + i * 10, 150],
        [155 + i * 10, 150 - h],
        [160 + i * 10, 150],
      ],
      flame[(i + f) % 3],
      "none",
      0,
    );
  }
  let embers = "";
  for (let i = 0; i < 4; i++)
    embers += rect(
      150 + hash(i, f, 41) * 24,
      100 + hash(i, f, 42) * 30,
      2,
      2,
      i % 2 ? INK.white : INK.glow,
    );
  return [
    // the wreck: outlines only, like a schematic
    poly(
      [
        [196, GROUND],
        [190, 112],
        [214, 84],
        [262, 76],
        [292, 104],
        [296, GROUND],
      ],
      "none",
      INK.dim,
      2,
    ),
    poly(
      [
        [214, 84],
        [226, 112],
        [262, 112],
        [262, 76],
      ],
      "none",
      INK.dim,
      1.5,
    ),
    stroke("M262 76L282 50M282 50L296 54", INK.dim, 2),
    poly(
      [
        [208, 138],
        [224, 128],
        [236, 140],
      ],
      "none",
      INK.dim,
      1.5,
    ),
    // the fire
    poly(
      [
        [140, GROUND],
        [146, 148],
        [186, 148],
        [190, GROUND],
      ],
      INK.dim,
    ),
    poly([
      [146, 152],
      [150, 146],
      [182, 146],
      [186, 152],
    ]),
    fire,
    embers,
  ].join("");
}
