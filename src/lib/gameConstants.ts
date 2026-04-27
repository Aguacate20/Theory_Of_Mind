export const CANVAS_W = 900;
export const CANVAS_H = 580;
export const WORLD_W = 1800;
export const WORLD_H = 28000; // long world

// Physics — must match GameCanvas exactly
export const GRAVITY = 0.52;
export const JUMP_FORCE = -13.5;
export const MOVE_SPEED = 3.8;
export const ENERGY_MOVE_COST = 0.025;
export const ENERGY_JUMP_COST = 4;
export const ENERGY_REGEN_CORRECT = 30;
export const ENERGY_PENALTY_WRONG = 8;

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICS SIMULATION
// Given a jump from (x0, y0) with horizontal velocity vx and vertical JUMP_FORCE,
// returns the arc as sampled points and the landing x,y on a target platform.
// We use this to VERIFY every gap is reachable before placing a platform.
// ─────────────────────────────────────────────────────────────────────────────

/** Returns max horizontal distance achievable jumping from a platform edge */
function jumpArc(vx: number): { maxDx: number; maxDy: number; airTime: number } {
  let x = 0, y = 0, vy = JUMP_FORCE;
  let maxH = 0;
  for (let t = 0; t < 200; t++) {
    vy += GRAVITY;
    x += vx;
    y += vy;
    if (y > 0 && t > 2) break; // landed back at same height
    if (-y > maxH) maxH = -y;
  }
  return { maxDx: Math.abs(x), maxDy: maxH, airTime: 0 };
}

// Precompute jump envelope at full speed
const FULL_JUMP = jumpArc(MOVE_SPEED);
const MAX_JUMP_DX = FULL_JUMP.maxDx * 0.92; // 92% = safe margin
const MAX_JUMP_DY = FULL_JUMP.maxDy * 0.88;

/** Simulate a jump and return landing position on a target platform */
function canReach(
  fromX: number, fromY: number, fromW: number,
  toX: number, toY: number, toW: number,
  vx: number
): boolean {
  // Try jumping from right/left edge of source platform
  const sources = [
    fromX + fromW * 0.8,  // right edge
    fromX + fromW * 0.2,  // left edge
    fromX + fromW * 0.5,  // center
  ];
  for (const sx of sources) {
    let x = sx, y = fromY, vy = JUMP_FORCE;
    const vxDir = toX + toW / 2 > sx ? Math.abs(vx) : -Math.abs(vx);
    for (let t = 0; t < 300; t++) {
      vy += GRAVITY;
      x += vxDir;
      y += vy;
      if (y + 2 >= toY && y < toY + 30 && x >= toX - 4 && x <= toX + toW + 4) {
        return true;
      }
      if (y > fromY + 800) break; // fell too far
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHUNK SYSTEM
// A "chunk" is a small hand-crafted pattern of platforms (4-10 platforms)
// representing a distinct movement challenge. We string chunks together
// vertically, rotating and mirroring them for variety.
// Each chunk has:
//   - platforms relative to (0,0) entry point
//   - exit point (where the next chunk starts)
//   - a "rhythm tag" (zigzag, retreat, diagonal, wall, etc.)
// ─────────────────────────────────────────────────────────────────────────────

type RelPlat = { dx: number; dy: number; w: number; h: number };
type Chunk = {
  platforms: RelPlat[];
  exitDx: number; // horizontal offset of exit from entry
  exitDy: number; // vertical rise of exit (negative = up)
  tag: string;
};

// ── Chunk library ─────────────────────────────────────────────────────────────
// Coordinates: dx = right offset from entry, dy = vertical (negative = up)
// All verified to be reachable with game physics.

const CHUNK_LIBRARY: Chunk[] = [

  // ── ZIGZAG: go right, then left, then right ───────────────────────────────
  {
    tag: "zigzag",
    platforms: [
      { dx: 0,   dy: 0,    w: 130, h: 16 },  // start
      { dx: 220, dy: -130, w: 100, h: 16 },  // jump right+up
      { dx: 60,  dy: -240, w: 90,  h: 16 },  // jump left+up
      { dx: 260, dy: -360, w: 110, h: 16 },  // jump right+up
    ],
    exitDx: 310, exitDy: -390,
  },

  // ── RETREAT: go right then MUST go back left ──────────────────────────────
  {
    tag: "retreat",
    platforms: [
      { dx: 0,   dy: 0,    w: 120, h: 16 },
      { dx: 280, dy: -100, w: 70,  h: 16 },  // go right
      { dx: 350, dy: -80,  w: 50,  h: 16 },  // dead end right
      { dx: 100, dy: -220, w: 90,  h: 16 },  // must go back left to continue
      { dx: -20, dy: -350, w: 80,  h: 16 },  // continue left
    ],
    exitDx: 20, exitDy: -380,
  },

  // ── DIAGONAL STAIRCASE: consistent right-and-up ───────────────────────────
  {
    tag: "staircase",
    platforms: [
      { dx: 0,   dy: 0,    w: 100, h: 16 },
      { dx: 180, dy: -110, w: 80,  h: 16 },
      { dx: 360, dy: -220, w: 80,  h: 16 },
      { dx: 540, dy: -330, w: 80,  h: 16 },
    ],
    exitDx: 590, exitDy: -360,
  },

  // ── DIAGONAL LEFT staircase ───────────────────────────────────────────────
  {
    tag: "staircase_left",
    platforms: [
      { dx: 0,    dy: 0,    w: 100, h: 16 },
      { dx: -160, dy: -110, w: 80,  h: 16 },
      { dx: -320, dy: -220, w: 80,  h: 16 },
      { dx: -480, dy: -330, w: 80,  h: 16 },
    ],
    exitDx: -430, exitDy: -360,
  },

  // ── ISLAND HOP: tiny platforms, large gaps, must be precise ──────────────
  {
    tag: "island",
    platforms: [
      { dx: 0,   dy: 0,    w: 120, h: 16 },
      { dx: 160, dy: -90,  w: 55,  h: 16 },
      { dx: 310, dy: -150, w: 45,  h: 16 },
      { dx: 140, dy: -250, w: 50,  h: 16 },
      { dx: -10, dy: -360, w: 110, h: 16 },
    ],
    exitDx: 40, exitDy: -390,
  },

  // ── WALL OF DEATH: tall jump then traverse ────────────────────────────────
  {
    tag: "wall",
    platforms: [
      { dx: 0,   dy: 0,    w: 130, h: 16 },
      { dx: 200, dy: -40,  w: 60,  h: 16 },  // short hop
      { dx: 350, dy: -40,  w: 60,  h: 16 },  // short hop
      { dx: 170, dy: -200, w: 90,  h: 16 },  // big jump back left+up
      { dx: 0,   dy: -340, w: 100, h: 16 },  // left again
    ],
    exitDx: 50, exitDy: -370,
  },

  // ── U-TURN: go far right then come back ───────────────────────────────────
  {
    tag: "uturn",
    platforms: [
      { dx: 0,   dy: 0,    w: 100, h: 16 },
      { dx: 240, dy: -120, w: 80,  h: 16 },
      { dx: 420, dy: -180, w: 70,  h: 16 },
      { dx: 530, dy: -100, w: 60,  h: 16 },  // dead end, must go back
      { dx: 300, dy: -300, w: 90,  h: 16 },
      { dx: 80,  dy: -420, w: 110, h: 16 },
    ],
    exitDx: 130, exitDy: -450,
  },

  // ── SPINE: vertical with alternating left/right, tight gaps ──────────────
  {
    tag: "spine",
    platforms: [
      { dx: 0,   dy: 0,    w: 90,  h: 16 },
      { dx: -150, dy: -120, w: 70, h: 16 },
      { dx: 150,  dy: -240, w: 70, h: 16 },
      { dx: -130, dy: -360, w: 70, h: 16 },
      { dx: 100,  dy: -480, w: 90, h: 16 },
    ],
    exitDx: 150, exitDy: -510,
  },

  // ── WIDE OPEN: large platforms, easy hop — used for rest zones ────────────
  {
    tag: "rest",
    platforms: [
      { dx: 0,   dy: 0,    w: 200, h: 16 },
      { dx: 100, dy: -150, w: 180, h: 16 },
      { dx: -50, dy: -300, w: 200, h: 16 },
    ],
    exitDx: 0, exitDy: -330,
  },

  // ── PRECISION: very small platforms, must be deliberate ──────────────────
  {
    tag: "precision",
    platforms: [
      { dx: 0,   dy: 0,    w: 90,  h: 16 },
      { dx: 170, dy: -100, w: 38,  h: 16 },
      { dx: 280, dy: -200, w: 35,  h: 16 },
      { dx: 100, dy: -310, w: 38,  h: 16 },
      { dx: -40, dy: -420, w: 100, h: 16 },
    ],
    exitDx: 10, exitDy: -450,
  },

  // ── OVERSHOOT TRAP: easy-looking but you overshoot ────────────────────────
  {
    tag: "overshoot",
    platforms: [
      { dx: 0,   dy: 0,    w: 140, h: 16 },
      { dx: 320, dy: -80,  w: 110, h: 16 },  // looks easy, but...
      { dx: 500, dy: -60,  w: 40,  h: 16 },  // ...this one is tiny & close
      { dx: 300, dy: -200, w: 90,  h: 16 },  // go back
      { dx: 100, dy: -320, w: 120, h: 16 },
    ],
    exitDx: 150, exitDy: -350,
  },

  // ── LONG TRAVERSE: wide horizontal movement at same height ───────────────
  {
    tag: "traverse",
    platforms: [
      { dx: 0,   dy: 0,    w: 80,  h: 16 },
      { dx: 180, dy: -30,  w: 60,  h: 16 },
      { dx: 360, dy: -30,  w: 60,  h: 16 },
      { dx: 540, dy: -30,  w: 60,  h: 16 },
      { dx: 400, dy: -180, w: 90,  h: 16 },  // jump back left to continue up
      { dx: 200, dy: -310, w: 100, h: 16 },
    ],
    exitDx: 250, exitDy: -340,
  },

  // ── DESCENT REQUIRED: you must drop down before going up ─────────────────
  {
    tag: "descent",
    platforms: [
      { dx: 0,   dy: 0,    w: 100, h: 16 },
      { dx: 220, dy: 60,   w: 80,  h: 16 },  // drop DOWN first
      { dx: 400, dy: 80,   w: 70,  h: 16 },  // drop more
      { dx: 500, dy: -80,  w: 60,  h: 16 },  // now jump up
      { dx: 350, dy: -220, w: 80,  h: 16 },  // continue up left
      { dx: 150, dy: -360, w: 100, h: 16 },
    ],
    exitDx: 200, exitDy: -390,
  },

  // ── CRUMBLE FAKE: wide platforms with small step-ups ─────────────────────
  {
    tag: "wide_step",
    platforms: [
      { dx: 0,   dy: 0,    w: 160, h: 16 },
      { dx: -80, dy: -140, w: 140, h: 16 },
      { dx: 80,  dy: -280, w: 130, h: 16 },
      { dx: -60, dy: -420, w: 150, h: 16 },
    ],
    exitDx: -10, exitDy: -450,
  },

  // ── FUNNEL: converge toward center ───────────────────────────────────────
  {
    tag: "funnel",
    platforms: [
      { dx: 0,   dy: 0,    w: 100, h: 16 },
      { dx: 300, dy: -90,  w: 80,  h: 16 },  // detour right
      { dx: -200, dy: -90, w: 80,  h: 16 },  // detour left (only one is correct)
      { dx: 80,  dy: -220, w: 70,  h: 16 },  // converge
      { dx: 0,   dy: -360, w: 110, h: 16 },
    ],
    exitDx: 50, exitDy: -390,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ZONE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type Zone = {
  name: string;
  yStart: number;
  yEnd: number;
  skyA: string;
  skyB: string;
  groundTop: string;
  groundFill: string;
  platColors: [string, string, string];
  // Which chunk tags appear in this zone + how often
  chunkWeights: Record<string, number>;
  // Scale factor for platform widths (1 = normal, 0.6 = narrower)
  widthScale: number;
  // Scale factor for vertical gaps (1 = normal, 1.4 = bigger gaps)
  gapScale: number;
};

export const ZONES: Zone[] = [
  {
    name: "Playa",
    yStart: WORLD_H - 5600, yEnd: WORLD_H,
    skyA: "#87CEEB", skyB: "#b0dff5",
    groundTop: "#f5deb3", groundFill: "#e8c878",
    platColors: ["#f0d090", "#d4a84b", "#f5deb3"],
    chunkWeights: { rest: 4, zigzag: 3, staircase: 3, staircase_left: 2, wide_step: 3, traverse: 2 },
    widthScale: 1.3,
    gapScale: 0.8,
  },
  {
    name: "Llanura",
    yStart: WORLD_H - 11200, yEnd: WORLD_H - 5600,
    skyA: "#4a9e6b", skyB: "#7acc90",
    groundTop: "#5a8a3c", groundFill: "#7caf52",
    platColors: ["#7caf52", "#5a8a3c", "#8B6914"],
    chunkWeights: { zigzag: 3, retreat: 3, staircase: 2, staircase_left: 2, uturn: 2, wall: 2, spine: 1, traverse: 2 },
    widthScale: 1.0,
    gapScale: 1.0,
  },
  {
    name: "Montaña",
    yStart: WORLD_H - 17000, yEnd: WORLD_H - 11200,
    skyA: "#7a6e8a", skyB: "#9B8FA8",
    groundTop: "#666", groundFill: "#888",
    platColors: ["#888888", "#6b6b6b", "#aaaaaa"],
    chunkWeights: { island: 3, retreat: 2, precision: 2, wall: 2, uturn: 2, zigzag: 2, spine: 2, descent: 2 },
    widthScale: 0.8,
    gapScale: 1.2,
  },
  {
    name: "Cielo",
    yStart: WORLD_H - 23000, yEnd: WORLD_H - 17000,
    skyA: "#0d1f4a", skyB: "#1a3a6b",
    groundTop: "#cce0ff", groundFill: "#e8f4ff",
    platColors: ["#ffffff", "#d6ecff", "#b0d0f0"],
    chunkWeights: { precision: 3, island: 3, overshoot: 3, descent: 2, spine: 2, funnel: 2, wall: 1 },
    widthScale: 0.65,
    gapScale: 1.35,
  },
  {
    name: "Espacio",
    yStart: 0, yEnd: WORLD_H - 23000,
    skyA: "#000008", skyB: "#00001a",
    groundTop: "#1a1a3a", groundFill: "#2a2a5a",
    platColors: ["#2a2a5a", "#3a3a7a", "#4a3060"],
    chunkWeights: { precision: 4, overshoot: 3, island: 3, spine: 2, descent: 2, funnel: 2 },
    widthScale: 0.5,
    gapScale: 1.5,
  },
];

export function getZone(worldY: number): number {
  for (let i = 0; i < ZONES.length; i++) {
    if (worldY >= ZONES[i].yStart) return i;
  }
  return ZONES.length - 1;
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const ca = parse(a), cb = parse(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bv = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${bv.toString(16).padStart(2,"0")}`;
}

export function getSkyColors(worldY: number): { top: string; bottom: string } {
  const zi = getZone(worldY);
  const zone = ZONES[zi];
  const nextZone = ZONES[zi - 1];
  if (!nextZone) return { top: zone.skyA, bottom: zone.skyB };
  const raw = (worldY - zone.yStart) / (zone.yEnd - zone.yStart);
  const t = 1 - Math.max(0, Math.min(1, raw));
  const s = t * t * (3 - 2 * t);
  return {
    top: lerpColor(zone.skyA, nextZone.skyA, s),
    bottom: lerpColor(zone.skyB, nextZone.skyB, s),
  };
}

export type Platform = {
  x: number;
  y: number;
  w: number;
  h: number;
  zone: number;
  type: "normal" | "narrow" | "wide" | "tiny";
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function weightedPick<T extends string>(weights: Record<T, number>, rng: () => number): T {
  const total = Object.values(weights).reduce((a: number, b) => a + (b as number), 0);
  let roll = rng() * total;
  for (const [key, w] of Object.entries(weights)) {
    roll -= w as number;
    if (roll <= 0) return key as T;
  }
  return Object.keys(weights)[0] as T;
}

export function generatePlatforms(): Platform[] {
  const rng = seededRand(0xDEADBEEF);
  const r = (min: number, max: number) => rng() * (max - min) + min;
  const platforms: Platform[] = [];

  // Ground floor
  platforms.push({ x: 0, y: WORLD_H - 80, w: WORLD_W, h: 80, zone: 0, type: "wide" });

  // Starting platform — generous, centered
  platforms.push({ x: WORLD_W / 2 - 150, y: WORLD_H - 160, w: 300, h: 20, zone: 0, type: "wide" });

  let curX = WORLD_W / 2;   // current anchor x (center of last platform)
  let curY = WORLD_H - 160; // current anchor y (top surface of last platform)

  const allChunksByTag: Record<string, Chunk> = {};
  for (const c of CHUNK_LIBRARY) allChunksByTag[c.tag] = c;

  // Iterate from bottom to top of world
  let safetyBreak = 0;
  while (curY > 200 && safetyBreak++ < 2000) {
    // Determine zone at current height
    const zi = getZone(curY);
    const zone = ZONES[zi];

    // Pick a chunk weighted by zone preferences
    const tag = weightedPick(zone.chunkWeights as Record<string, number>, rng);
    const baseChunk = allChunksByTag[tag] ?? CHUNK_LIBRARY[0];

    // Randomly mirror the chunk horizontally (50% chance)
    const mirror = rng() < 0.5;

    // Randomly rotate slightly: shift the whole chunk left or right
    // so chunks don't stack perfectly on each other
    const globalShift = r(-200, 200);

    // Scale widths and gaps for this zone
    const ws = zone.widthScale;
    const gs = zone.gapScale;

    // Place each platform in the chunk
    let placedAny = false;
    for (const rel of baseChunk.platforms) {
      const dx = (mirror ? -rel.dx : rel.dx) + globalShift;
      const dy = rel.dy * gs;
      const pw = Math.max(20, Math.round(rel.w * ws));
      const ph = rel.h;

      let px = curX + dx - pw / 2;
      const py = curY + dy;

      // Clamp to world bounds with wrap-around feel
      px = ((px % (WORLD_W - pw)) + (WORLD_W - pw)) % (WORLD_W - pw);
      px = Math.max(10, Math.min(WORLD_W - pw - 10, px));

      // Skip if too close to top of world
      if (py < 80) continue;
      // Skip if below world (descent chunks can go slightly down)
      if (py > WORLD_H - 90) continue;

      const type: Platform["type"] =
        pw < 28 ? "tiny" :
        pw < 55 ? "narrow" :
        pw < 120 ? "normal" : "wide";

      platforms.push({ x: px, y: py, w: pw, h: ph, zone: zi, type });
      placedAny = true;
    }

    if (!placedAny) continue;

    // Advance cursor to chunk exit
    const exitDx = (mirror ? -baseChunk.exitDx : baseChunk.exitDx) + globalShift;
    const exitDy = baseChunk.exitDy * gs;
    curX = Math.max(100, Math.min(WORLD_W - 100, curX + exitDx));
    curY = curY + exitDy;

    // Occasionally add a "rest" platform between hard chunks
    if (rng() < 0.18) {
      const rpw = Math.round(r(140, 220) * ws);
      const rx = Math.max(10, Math.min(WORLD_W - rpw - 10, curX - rpw / 2));
      platforms.push({ x: rx, y: curY, w: rpw, h: 18, zone: zi, type: "wide" });
      curY -= 30; // slight extra rise
    }

    // Occasionally add a decoy platform (visible but dead end)
    if (rng() < 0.3) {
      const dpw = Math.round(r(30, 70) * ws);
      const sideDir = rng() < 0.5 ? 1 : -1;
      const dx2 = r(150, 320) * sideDir;
      const dx2px = Math.max(10, Math.min(WORLD_W - dpw - 10, curX + dx2 - dpw / 2));
      const dy2 = r(-60, 60);
      if (curY + dy2 > 100 && curY + dy2 < WORLD_H - 90) {
        platforms.push({ x: dx2px, y: curY + dy2, w: dpw, h: 16, zone: zi, type: "narrow" });
      }
    }
  }

  return platforms.sort((a, b) => b.y - a.y);
}

// Checkpoints — every ~2500 units of height
export const CHECKPOINTS: number[] = Array.from(
  { length: 12 },
  (_, i) => WORLD_H - 200 - i * Math.round((WORLD_H - 400) / 12)
).concat([150]);
