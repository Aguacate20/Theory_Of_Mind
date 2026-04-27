export const LEARN_W = 3200;
export const LEARN_H = 3200;
export const VIEW_W = 820;
export const VIEW_H = 560;
export const PLAYER_SPEED = 3.2;
export const PLAYER_SIZE = 20;

const CX = LEARN_W / 2;  // 1600
const CY = LEARN_H / 2;  // 1600

export type Room = {
  id: "sur" | "oeste" | "este" | "norte" | "centro" | "entrada";
  label: string;
  shortLabel: string;
  x: number; y: number;
  w: number; h: number;
  floorColor: string;
  wallColor: string;
  accentColor: string;
  description: string;
  // Floor pattern: "tile" | "wood" | "stone" | "marble" | "carpet"
  pattern: "tile" | "wood" | "stone" | "marble" | "carpet";
};

export const ROOMS: Room[] = [
  {
    id: "entrada",
    label: "Entrada del Archivo",
    shortLabel: "Entrada",
    x: CX, y: CY + 1150,
    w: 360, h: 250,
    floorColor: "#D3D1C7", wallColor: "#5F5E5A", accentColor: "#888780",
    description: "Punto de partida",
    pattern: "tile",
  },
  {
    id: "centro",
    label: "Sala Central — Depósito",
    shortLabel: "Centro",
    x: CX, y: CY,
    w: 500, h: 500,
    floorColor: "#EEEDFE", wallColor: "#3C3489", accentColor: "#534AB7",
    description: "Deposita aquí los artefactos",
    pattern: "marble",
  },
  {
    id: "sur",
    label: "Sala Sur — Teoría-Teoría",
    shortLabel: "Sala Sur",
    x: CX, y: CY + 700,
    w: 600, h: 450,
    floorColor: "#EEEDFE", wallColor: "#534AB7", accentColor: "#7F77DD",
    description: "Wellman & Leslie",
    pattern: "carpet",
  },
  {
    id: "este",
    label: "Sala Este — Simulación",
    shortLabel: "Sala Este",
    x: CX + 750, y: CY,
    w: 500, h: 500,
    floorColor: "#E1F5EE", wallColor: "#0F6E56", accentColor: "#1D9E75",
    description: "Goldman & Gallagher",
    pattern: "wood",
  },
  {
    id: "oeste",
    label: "Sala Oeste — Modularidad",
    shortLabel: "Sala Oeste",
    x: CX - 750, y: CY,
    w: 500, h: 500,
    floorColor: "#FAEEDA", wallColor: "#BA7517", accentColor: "#EF9F27",
    description: "Scholl & Leslie",
    pattern: "stone",
  },
  {
    id: "norte",
    label: "Sala Norte — Integración",
    shortLabel: "Sala Norte",
    x: CX, y: CY - 700,
    w: 600, h: 450,
    floorColor: "#FBEAF0", wallColor: "#993556", accentColor: "#D4537E",
    description: "Apperly & Bohl",
    pattern: "tile",
  },
];

// Corridors as walkable rectangles: { x1, y1, x2, y2 }
export const CORRIDORS = [
  // South corridor: centro bottom → sur top
  { x1: CX - 65, y1: CY + 250, x2: CX + 65, y2: CY + 475 },
  // North corridor: norte bottom → centro top
  { x1: CX - 65, y1: CY - 475, x2: CX + 65, y2: CY - 250 },
  // East corridor: centro right → este left
  { x1: CX + 250, y1: CY - 65, x2: CX + 500, y2: CY + 65 },
  // West corridor: oeste right → centro left
  { x1: CX - 500, y1: CY - 65, x2: CX - 250, y2: CY + 65 },
  // Entrance corridor: sur bottom → entrada top
  { x1: CX - 65, y1: CY + 925, x2: CX + 65, y2: CY + 1025 },
];

/** Returns true if (x,y) is inside any walkable area */
export function isWalkable(x: number, y: number): boolean {
  const r = PLAYER_SIZE / 2;
  for (const room of ROOMS) {
    if (
      x - r >= room.x - room.w / 2 &&
      x + r <= room.x + room.w / 2 &&
      y - r >= room.y - room.h / 2 &&
      y + r <= room.y + room.h / 2
    ) return true;
  }
  for (const c of CORRIDORS) {
    if (x - r >= c.x1 && x + r <= c.x2 && y - r >= c.y1 && y + r <= c.y2) return true;
  }
  return false;
}

// ── Artifact world positions — well spread inside each room ──────────────────
// Each room is 500-600px wide so artifacts 150-200px apart

export const ARTIFACT_WORLD_POS: Record<string, { x: number; y: number }> = {
  // Sur room (CX, CY+700) — 600×450 — 5 artifacts
  tt_01: { x: CX - 200, y: CY + 560 },
  tt_02: { x: CX + 200, y: CY + 580 },
  tt_03: { x: CX - 210, y: CY + 780 },
  tt_04: { x: CX + 210, y: CY + 800 },
  tt_05: { x: CX,       y: CY + 690 },

  // Este room (CX+750, CY) — 500×500 — 6 artifacts
  sim_01: { x: CX + 580, y: CY - 160 },
  sim_02: { x: CX + 900, y: CY - 170 },
  sim_03: { x: CX + 750, y: CY      },
  int_01: { x: CX + 590, y: CY + 160 },
  int_02: { x: CX + 900, y: CY + 170 },
  int_03: { x: CX + 750, y: CY - 60  },

  // Oeste room (CX-750, CY) — 500×500 — 3 artifacts
  mod_01: { x: CX - 900, y: CY - 120 },
  mod_02: { x: CX - 590, y: CY - 100 },
  mod_03: { x: CX - 750, y: CY + 130 },

  // Norte room (CX, CY-700) — 600×450 — 4 artifacts
  neu_01:  { x: CX - 200, y: CY - 790 },
  neu_02:  { x: CX + 200, y: CY - 810 },
  int2_01: { x: CX - 180, y: CY - 610 },
  int2_02: { x: CX + 180, y: CY - 600 },
};
