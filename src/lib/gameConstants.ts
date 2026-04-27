export const CANVAS_W = 480;
export const CANVAS_H = 600;
export const GRAVITY = 0.45;
export const JUMP_FORCE = -11;
export const MOVE_SPEED = 3.5;
export const ENERGY_MOVE_COST = 0.04;   // per frame while moving
export const ENERGY_JUMP_COST = 5;      // per jump
export const ENERGY_REGEN_CORRECT = 30;
export const ENERGY_PENALTY_WRONG = 8;

export type Zone = {
  name: string;
  yStart: number;   // world-y where zone begins (higher = further up, lower y value)
  yEnd: number;
  bgTop: string;
  bgBottom: string;
  groundColor: string;
  platformColors: string[];
  decorations: string[];
};

// World height: 6000px total. Zone 0 = bottom (beach), Zone 4 = space (top)
export const ZONES: Zone[] = [
  {
    name: "Playa",
    yStart: 3500, yEnd: 6000,
    bgTop: "#87CEEB", bgBottom: "#c9e8f5",
    groundColor: "#f5deb3",
    platformColors: ["#f5deb3", "#e8c87a", "#d4a84b"],
    decorations: ["umbrella", "ball", "shell", "bucket"],
  },
  {
    name: "Llanura",
    yStart: 2200, yEnd: 3500,
    bgTop: "#6aab5e", bgBottom: "#a8d5a2",
    groundColor: "#8B6914",
    platformColors: ["#7caf52", "#5a8a3c", "#8B4513"],
    decorations: ["tree", "flower", "rock", "bush"],
  },
  {
    name: "Montaña",
    yStart: 1100, yEnd: 2200,
    bgTop: "#9B8FA8", bgBottom: "#c7bdd1",
    groundColor: "#5a5a5a",
    platformColors: ["#888888", "#6b6b6b", "#4a6741"],
    decorations: ["pine", "boulder", "snow", "cave"],
  },
  {
    name: "Cielo",
    yStart: 300, yEnd: 1100,
    bgTop: "#1a3a6b", bgBottom: "#4a7fc1",
    groundColor: "#cce0ff",
    platformColors: ["#ffffff", "#d6ecff", "#a8c8e8"],
    decorations: ["cloud", "bird", "rainbow", "mist"],
  },
  {
    name: "Espacio",
    yStart: 0, yEnd: 300,
    bgTop: "#000010", bgBottom: "#0a0a30",
    groundColor: "#1a1a3a",
    platformColors: ["#2a2a5a", "#3a3a7a", "#4a3060"],
    decorations: ["star", "planet", "asteroid", "nebula"],
  },
];

export function getZone(worldY: number): number {
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (worldY >= ZONES[i].yStart) return i;
  }
  return ZONES.length - 1;
}

export type Platform = {
  x: number;
  y: number;       // world-y (0 = top of world)
  w: number;
  h: number;
  zone: number;
  type: "normal" | "narrow" | "wide" | "deco";
  decoType?: string;
};

// Generates platforms for the entire world
export function generatePlatforms(): Platform[] {
  const platforms: Platform[] = [];
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  // Ground floor (beach) — wide solid platform at bottom
  platforms.push({ x: 0, y: 5900, w: CANVAS_W, h: 100, zone: 0, type: "wide" });

  // Per-zone generation
  const zoneConfigs = [
    // Beach: medium gaps, mixed sizes, some decoration platforms
    { yTop: 3500, yBot: 5900, count: 28, minW: 60, maxW: 140, gap: 80 },
    // Meadow: wider gaps, more variation
    { yTop: 2200, yBot: 3500, count: 22, minW: 50, maxW: 120, gap: 90 },
    // Mountain: narrow ledges, bigger gaps
    { yTop: 1100, yBot: 2200, count: 20, minW: 40, maxW: 100, gap: 100 },
    // Sky: very narrow clouds, large gaps
    { yTop: 300, yBot: 1100, count: 18, minW: 35, maxW: 90, gap: 110 },
    // Space: tiny asteroids, maximum challenge
    { yTop: 0, yBot: 300, count: 10, minW: 30, maxW: 70, gap: 80 },
  ];

  for (let zi = 0; zi < zoneConfigs.length; zi++) {
    const cfg = zoneConfigs[zi];
    const step = (cfg.yBot - cfg.yTop) / cfg.count;

    for (let i = 0; i < cfg.count; i++) {
      const baseY = cfg.yBot - i * step - rand(10, step * 0.7);
      const w = rand(cfg.minW, cfg.maxW);
      const x = rand(10, CANVAS_W - w - 10);
      const h = zi >= 3 ? 14 : 18;
      const type = w < 55 ? "narrow" : w > 110 ? "wide" : "normal";
      platforms.push({ x, y: baseY, w, h, zone: zi, type });
    }

    // Checkpoints every zone boundary
    if (zi < zoneConfigs.length - 1) {
      platforms.push({
        x: CANVAS_W / 2 - 40,
        y: cfg.yTop + 30,
        w: 80, h: 20,
        zone: zi, type: "wide",
      });
    }
  }

  return platforms.sort((a, b) => b.y - a.y);
}

export const CHECKPOINTS = [5850, 3450, 2150, 1050, 250];
