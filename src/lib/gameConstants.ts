export const CANVAS_W = 900;
export const CANVAS_H = 580;
export const WORLD_W = 1800;
export const WORLD_H = 6000;

export const GRAVITY = 0.48;
export const JUMP_FORCE = -12;
export const MOVE_SPEED = 4;
export const ENERGY_MOVE_COST = 0.03;
export const ENERGY_JUMP_COST = 5;
export const ENERGY_REGEN_CORRECT = 30;
export const ENERGY_PENALTY_WRONG = 8;

export type Zone = {
  name: string;
  yStart: number;
  yEnd: number;
  skyA: string;
  skyB: string;
  skyC: string;
  skyD: string;
  groundTop: string;
  groundFill: string;
  platColors: [string, string, string];
  fogColor: string;
};

export const ZONES: Zone[] = [
  {
    name: "Playa",
    yStart: 3600, yEnd: 6000,
    skyA: "#87CEEB", skyB: "#b0dff5",
    skyC: "#a8d8ea", skyD: "#d4eefc",
    groundTop: "#f5deb3", groundFill: "#e8c878",
    platColors: ["#f0d090", "#d4a84b", "#f5deb3"],
    fogColor: "rgba(200,235,255,0.0)",
  },
  {
    name: "Llanura",
    yStart: 2400, yEnd: 3600,
    skyA: "#4a9e6b", skyB: "#7acc90",
    skyC: "#87CEEB", skyD: "#b0dff5",
    groundTop: "#5a8a3c", groundFill: "#7caf52",
    platColors: ["#7caf52", "#5a8a3c", "#8B6914"],
    fogColor: "rgba(180,240,180,0.06)",
  },
  {
    name: "Montaña",
    yStart: 1300, yEnd: 2400,
    skyA: "#7a6e8a", skyB: "#9B8FA8",
    skyC: "#4a9e6b", skyD: "#7acc90",
    groundTop: "#666", groundFill: "#888",
    platColors: ["#888888", "#6b6b6b", "#aaaaaa"],
    fogColor: "rgba(200,190,220,0.07)",
  },
  {
    name: "Cielo",
    yStart: 400, yEnd: 1300,
    skyA: "#0d1f4a", skyB: "#1a3a6b",
    skyC: "#7a6e8a", skyD: "#9B8FA8",
    groundTop: "#cce0ff", groundFill: "#e8f4ff",
    platColors: ["#ffffff", "#d6ecff", "#b0d0f0"],
    fogColor: "rgba(100,160,255,0.05)",
  },
  {
    name: "Espacio",
    yStart: 0, yEnd: 400,
    skyA: "#000008", skyB: "#00001a",
    skyC: "#0d1f4a", skyD: "#1a3a6b",
    groundTop: "#1a1a3a", groundFill: "#2a2a5a",
    platColors: ["#2a2a5a", "#3a3a7a", "#4a3060"],
    fogColor: "rgba(60,0,120,0.08)",
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
    const n = parseInt(hex.replace("#",""), 16);
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
  type: "normal" | "narrow" | "wide";
};

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export function generatePlatforms(): Platform[] {
  const rand = seededRand(42);
  const rng = (min: number, max: number) => rand() * (max - min) + min;
  const platforms: Platform[] = [];

  platforms.push({ x: 0, y: WORLD_H - 80, w: WORLD_W, h: 80, zone: 0, type: "wide" });

  const zoneConfigs = [
    { yTop: 3600, yBot: WORLD_H - 80, count: 55, minW: 90, maxW: 220, maxGap: 160 },
    { yTop: 2400, yBot: 3600,         count: 48, minW: 70, maxW: 170, maxGap: 200 },
    { yTop: 1300, yBot: 2400,         count: 42, minW: 50, maxW: 130, maxGap: 230 },
    { yTop: 400,  yBot: 1300,         count: 35, minW: 40, maxW: 100, maxGap: 250 },
    { yTop: 20,   yBot: 400,          count: 18, minW: 30, maxW: 75,  maxGap: 220 },
  ];

  for (let zi = 0; zi < zoneConfigs.length; zi++) {
    const cfg = zoneConfigs[zi];
    const step = (cfg.yBot - cfg.yTop) / cfg.count;
    let lastX = WORLD_W / 2;

    for (let i = 0; i < cfg.count; i++) {
      const baseY = cfg.yBot - i * step - rng(step * 0.1, step * 0.85);
      const w = rng(cfg.minW, cfg.maxW);
      const h = zi >= 3 ? 13 : zi >= 2 ? 15 : 18;
      let x = rng(20, WORLD_W - w - 20);
      if (Math.abs(x + w / 2 - lastX) > cfg.maxGap) {
        x = Math.max(20, Math.min(WORLD_W - w - 20,
          lastX - cfg.maxGap / 2 + rng(0, cfg.maxGap - w)
        ));
      }
      lastX = x + w / 2;
      const type: Platform["type"] = w < 65 ? "narrow" : w > 140 ? "wide" : "normal";
      platforms.push({ x, y: baseY, w, h, zone: zi, type });
    }
  }

  return platforms.sort((a, b) => b.y - a.y);
}

export const CHECKPOINTS: number[] = [
  WORLD_H - 100,
  3550,
  2380,
  1280,
  380,
];
