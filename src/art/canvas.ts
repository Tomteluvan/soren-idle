export const W = 64;
export const H = 40;
export const GROUND_Y = 30;
const SCALE = 5;

export interface Shade {
  light: string;
  mid: string;
  dark: string;
}

/** Deterministic noise in [0, 1) so scenery is stable between frames. */
export function hash(x: number, y = 0, seed = 0): number {
  let h = Math.imul(x + 374761393, 668265263) ^ Math.imul(y + 1274126177, 2246822519) ^ Math.imul(seed + 97, 3266489917);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class Canvas {
  private cells: (string | undefined)[] = new Array(W * H);

  set(x: number, y: number, color: string) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    this.cells[y * W + x] = color;
  }

  rect(x: number, y: number, w: number, h: number, color: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, color);
  }

  line(x0: number, y0: number, x1: number, y1: number, color: string) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  disc(cx: number, cy: number, r: number, color: string) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.5) this.set(cx + x, cy + y, color);
  }

  /** A lit voxel face: light on top and left, dark on bottom and right. */
  block(x: number, y: number, w: number, h: number, shade: Shade) {
    this.rect(x, y, w, h, shade.mid);
    this.rect(x, y, w, 1, shade.light);
    this.rect(x, y, 1, h, shade.light);
    this.rect(x, y + h - 1, w, 1, shade.dark);
    this.rect(x + w - 1, y, 1, h, shade.dark);
    this.set(x, y + h - 1, shade.mid);
    this.set(x + w - 1, y, shade.mid);
  }

  /** Draws a small sprite from rows of characters; '.' is transparent. */
  sprite(rows: string[], palette: Record<string, string>, ox: number, oy: number, flip = false) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const color = palette[row[i]];
        if (color) this.set(ox + (flip ? row.length - 1 - i : i), oy + j, color);
      }
    });
  }

  toSvg(): string {
    // Merge horizontal runs, then stack identical runs vertically.
    type Run = { x: number; y: number; w: number; h: number; c: string };
    const done: Run[] = [];
    let open = new Map<string, Run>();
    for (let y = 0; y < H; y++) {
      const next = new Map<string, Run>();
      let x = 0;
      while (x < W) {
        const c = this.cells[y * W + x];
        if (!c) {
          x++;
          continue;
        }
        let w = 1;
        while (x + w < W && this.cells[y * W + x + w] === c) w++;
        const key = `${x},${w},${c}`;
        const above = open.get(key);
        if (above) {
          above.h++;
          next.set(key, above);
          open.delete(key);
        } else {
          next.set(key, { x, y, w, h: 1, c });
        }
        x += w;
      }
      done.push(...open.values());
      open = next;
    }
    done.push(...open.values());
    const rects = done.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.c}"/>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * SCALE}" height="${H * SCALE}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${rects}</svg>`;
  }
}

export function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
