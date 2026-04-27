export const CANVAS_W = 900;
export const CANVAS_H = 580;
export const WORLD_W = 1800;
export const WORLD_H = 18000;   // 3x longer world

export const GRAVITY = 0.52;
export const JUMP_FORCE = -13.5;   // slightly stronger but gaps are wider
export const MOVE_SPEED = 3.8;
export const ENERGY_MOVE_COST = 0.025;
export const ENERGY_JUMP_COST = 4;
export const ENERGY_REGEN_CORRECT = 30;
export const ENERGY_PENALTY_WRONG = 8;

// Max horizontal distance reachable in one jump (pixels):
// approx = MOVE_SPEED * 2 * (JUMP_FORCE / GRAVITY) * -1
// = 3.8 * 2 * (13.5 / 0.52) ≈ 197px
// We'll use this as reference for gap sizing.
export const MAX_JUMP_DIST = 190;

export type Zone = {
  name: string;
  yStart: number;
  yEnd: number;
  skyA: string;
  skyB: string;
  groundTop: string;
  groundFill: string;
  platColors: [string, string, string];
};

export const ZONES: Zone[] = [
  {
    name: "Playa",
    yStart: WORLD_H - 3600, yEnd: WORLD_H,
    skyA: "#87CEEB", skyB: "#b0dff5",
    groundTop: "#f5deb3", groundFill: "#e8c878",
    platColors: ["#f0d090", "#d4a84b", "#f5deb3"],
  },
  {
    name: "Llanura",
    yStart: WORLD_H - 7200, yEnd: WORLD_H - 3600,
    skyA: "#4a9e6b", skyB: "#7acc90",
    groundTop: "#5a8a3c", groundFill: "#7caf52",
    platColors: ["#7caf52", "#5a8a3c", "#8B6914"],
  },
  {
    name: "Montaña",
    yStart: WORLD_H - 11000, yEnd: WORLD_H - 7200,
    skyA: "#7a6e8a", skyB: "#9B8FA8",
    groundTop: "#666", groundFill: "#888",
    platColors: ["#888888", "#6b6b6b", "#aaaaaa"],
  },
  {
    name: "Cielo",
    yStart: WORLD_H - 15000, yEnd: WORLD_H - 11000,
    skyA: "#0d1f4a", skyB: "#1a3a6b",
    groundTop: "#cce0ff", groundFill: "#e8f4ff",
    platColors: ["#ffffff", "#d6ecff", "#b0d0f0"],
  },
  {
    name: "Espacio",
    yStart: 0, yEnd: WORLD_H - 15000,
    skyA: "#000008", skyB: "#00001a",
    groundTop: "#1a1a3a", groundFill: "#2a2a5a",
    platColors: ["#2a2a5a", "#3a3a7a", "#4a3060"],
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
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bv.toString(16).padStart(2, "0")}`;
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
// JUMP KING-STYLE PLATFORM GENERATOR
//
// Core ideas:
//  1. Every platform is reachable from exactly one "source" platform —
//     we thread a chain of mandatory-path platforms from bottom to top.
//  2. Off the main chain we scatter optional "side" platforms that lead
//     to dead ends or rejoin higher up — these create detours.
//  3. Gaps are INTENTIONAL: some require moving left/right AND timing
//     the jump. Vertical-only spamming won't work because platforms are
//     offset horizontally and the vertical gap is large enough that you
//     need horizontal momentum to reach them.
//  4. Zone difficulty scales: beach = forgiving, space = punishing.
// ─────────────────────────────────────────────────────────────────────────────

type PlatformSeed = {
  x: number;
  y: number;
  w: number;
};

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generatePlatforms(): Platform[] {
  const rng = seededRand(1337);
  const r = (min: number, max: number) => rng() * (max - min) + min;
  const ri = (min: number, max: number) => Math.floor(r(min, max + 1));
  const pick = <T,>(arr: T[]) => arr[ri(0, arr.length - 1)];

  const platforms: Platform[] = [];

  // ── Solid ground ──────────────────────────────────────────────────────────
  platforms.push({ x: 0, y: WORLD_H - 80, w: WORLD_W, h: 80, zone: 0, type: "wide" });

  // ── Zone configs ──────────────────────────────────────────────────────────
  // Each zone defines how its "puzzle rooms" work.
  // A room = a vertical slice with 4-8 platforms forming a puzzle.
  type ZoneCfg = {
    zi: number;
    yBot: number;
    yTop: number;
    // Platform sizes
    wideW: [number, number];
    normalW: [number, number];
    narrowW: [number, number];
    tinyW: [number, number];
    platH: number;
    // Jump challenge params
    // vertStep: vertical rise between consecutive mandatory platforms
    vertStepMin: number;
    vertStepMax: number;
    // horizShift: how far left/right the next platform is (can be negative = same side)
    horizShiftMin: number;
    horizShiftMax: number;
    // How many rooms in this zone
    rooms: number;
    // Platforms per room
    platPerRoom: [number, number];
    // Chance of a "side branch" dead end platform
    branchChance: number;
  };

  const zoneCfgs: ZoneCfg[] = [
    // Beach — learning zone, forgiving gaps, big platforms
    {
      zi: 0, yBot: WORLD_H - 80, yTop: WORLD_H - 3600,
      wideW: [160, 240], normalW: [100, 160], narrowW: [60, 100], tinyW: [40, 60],
      platH: 18,
      vertStepMin: 80, vertStepMax: 160,
      horizShiftMin: -220, horizShiftMax: 220,
      rooms: 14, platPerRoom: [5, 8],
      branchChance: 0.25,
    },
    // Meadow — gaps wider, more horizontal travel required
    {
      zi: 1, yBot: WORLD_H - 3600, yTop: WORLD_H - 7200,
      wideW: [130, 200], normalW: [80, 130], narrowW: [45, 80], tinyW: [30, 50],
      platH: 16,
      vertStepMin: 120, vertStepMax: 220,
      horizShiftMin: -300, horizShiftMax: 300,
      rooms: 18, platPerRoom: [5, 7],
      branchChance: 0.35,
    },
    // Mountain — narrow ledges, big diagonal jumps
    {
      zi: 2, yBot: WORLD_H - 7200, yTop: WORLD_H - 11000,
      wideW: [100, 160], normalW: [60, 100], narrowW: [35, 60], tinyW: [22, 38],
      platH: 14,
      vertStepMin: 150, vertStepMax: 270,
      horizShiftMin: -350, horizShiftMax: 350,
      rooms: 18, platPerRoom: [4, 7],
      branchChance: 0.4,
    },
    // Sky — cloud hops, punishing falls, tiny platforms
    {
      zi: 3, yBot: WORLD_H - 11000, yTop: WORLD_H - 15000,
      wideW: [80, 130], normalW: [50, 80], narrowW: [28, 50], tinyW: [18, 32],
      platH: 13,
      vertStepMin: 170, vertStepMax: 310,
      horizShiftMin: -380, horizShiftMax: 380,
      rooms: 20, platPerRoom: [4, 6],
      branchChance: 0.45,
    },
    // Space — maximum challenge, asteroid hopping
    {
      zi: 4, yBot: WORLD_H - 15000, yTop: 100,
      wideW: [60, 100], normalW: [36, 60], narrowW: [20, 40], tinyW: [14, 26],
      platH: 12,
      vertStepMin: 190, vertStepMax: 340,
      horizShiftMin: -400, horizShiftMax: 400,
      rooms: 22, platPerRoom: [3, 6],
      branchChance: 0.5,
    },
  ];

  for (const cfg of zoneCfgs) {
    const zoneHeight = cfg.yBot - cfg.yTop;
    const roomHeight = zoneHeight / cfg.rooms;

    // Start position for the mandatory chain
    let chainX = r(100, WORLD_W - 300);
    let chainY = cfg.yBot - 30;

    // Mandatory chain: thread from bottom to top of zone
    // We generate a guaranteed path, then fill in extra challenge platforms around it
    const mandatory: PlatformSeed[] = [];

    for (let room = 0; room < cfg.rooms; room++) {
      const roomTop = cfg.yBot - (room + 1) * roomHeight;
      const roomBot = cfg.yBot - room * roomHeight;

      // How many platforms in this room
      const count = ri(...cfg.platPerRoom);
      const vertPerPlat = roomHeight / count;

      for (let p = 0; p < count; p++) {
        // Determine width category — weight toward smaller as zone progresses
        const sizeRoll = rng();
        let w: number;
        if (sizeRoll < 0.15) w = r(...cfg.tinyW);
        else if (sizeRoll < 0.4) w = r(...cfg.narrowW);
        else if (sizeRoll < 0.75) w = r(...cfg.normalW);
        else w = r(...cfg.wideW);
        w = Math.round(w);

        // Horizontal shift — key for Jump King feel:
        // We alternate between "go right", "go left", "go far right", etc.
        // The shift must keep the platform reachable (< MAX_JUMP_DIST horizontal)
        // but large enough that vertical-only movement doesn't work.
        let shift: number;
        const minHoriz = 80; // force at least this much horizontal movement
        do {
          shift = r(cfg.horizShiftMin, cfg.horizShiftMax);
        } while (Math.abs(shift) < minHoriz);

        const targetX = Math.max(20, Math.min(WORLD_W - w - 20, chainX + shift));
        const targetY = chainY - r(cfg.vertStepMin, cfg.vertStepMax);

        mandatory.push({ x: targetX, y: targetY, w });
        chainX = targetX + w / 2; // center of platform is new reference
        chainY = targetY;
      }
    }

    // Convert mandatory seeds to platforms
    for (const seed of mandatory) {
      const type: Platform["type"] =
        seed.w < 30 ? "tiny" :
        seed.w < 55 ? "narrow" :
        seed.w < 110 ? "normal" : "wide";
      platforms.push({ x: seed.x, y: seed.y, w: seed.w, h: cfg.platH, zone: cfg.zi, type });
    }

    // ── Side / branch platforms ───────────────────────────────────────────
    // For each mandatory platform, maybe spawn 1-2 side platforms nearby.
    // These can be: dead ends, tricky shortcuts, or red herrings.
    for (const seed of mandatory) {
      if (rng() > cfg.branchChance) continue;

      const branchCount = ri(1, 2);
      for (let b = 0; b < branchCount; b++) {
        // Side platform is offset from mandatory one — on the opposite side
        const sideDir = rng() < 0.5 ? -1 : 1;
        const sideDist = r(70, MAX_JUMP_DIST * 0.9);
        const sideX = Math.max(10, Math.min(WORLD_W - 60, seed.x + sideDir * sideDist));
        const sideY = seed.y + r(-40, 80); // roughly same height or slightly below
        const sideW = Math.round(r(...cfg.narrowW));
        const type: Platform["type"] = sideW < 55 ? "narrow" : "normal";
        platforms.push({ x: sideX, y: sideY, w: sideW, h: cfg.platH, zone: cfg.zi, type });
      }
    }

    // ── "Teaser" platforms visible below mandatory ones ───────────────────
    // Small platforms that are visible but lead nowhere useful — visual noise
    // that makes the world feel denser.
    for (let t = 0; t < cfg.rooms * 2; t++) {
      const tx = r(20, WORLD_W - 80);
      const ty = r(cfg.yTop, cfg.yBot);
      const tw = Math.round(r(...cfg.tinyW));
      platforms.push({ x: tx, y: ty, w: tw, h: cfg.platH, zone: cfg.zi, type: "tiny" });
    }
  }

  return platforms.sort((a, b) => b.y - a.y);
}

// Checkpoints — one every zone transition + some midpoints
export const CHECKPOINTS: number[] = [
  WORLD_H - 100,          // base beach
  WORLD_H - 1800,         // mid beach
  WORLD_H - 3550,         // top beach / llanura start
  WORLD_H - 5400,         // mid llanura
  WORLD_H - 7150,         // top llanura / montaña start
  WORLD_H - 9100,         // mid montaña
  WORLD_H - 10950,        // top montaña / cielo start
  WORLD_H - 13000,        // mid cielo
  WORLD_H - 14950,        // top cielo / espacio start
  WORLD_H - 16500,        // mid espacio
  200,                    // near top
];
