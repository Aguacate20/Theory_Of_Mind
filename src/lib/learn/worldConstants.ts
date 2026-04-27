// ── World dimensions ─────────────────────────────────────────────────────────
export const TILE_SIZE  = 32;          // pixels per tile
export const GRID_COLS  = 120;         // 120 × 32 = 3840 px
export const GRID_ROWS  = 120;
export const LEARN_W    = GRID_COLS * TILE_SIZE; // 3840
export const LEARN_H    = GRID_ROWS * TILE_SIZE; // 3840
export const VIEW_W     = 820;
export const VIEW_H     = 560;
export const PLAYER_SPEED = 3.2;
export const PLAYER_SIZE  = 20;

const CX = LEARN_W / 2;  // 1920
const CY = LEARN_H / 2;  // 1920

// ── Room type ─────────────────────────────────────────────────────────────────
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

// ── Corridors (pixel rectangles: x1 y1 → x2 y2) ──────────────────────────────
// Mínimo 64 px de ancho (2 tiles) para que el jugador pase limpio.
export const CORRIDORS = [
  // Sur: centro bottom → sur top
  { x1: CX - 64, y1: CY + 250, x2: CX + 64, y2: CY + 475 },
  // Norte: norte bottom → centro top
  { x1: CX - 64, y1: CY - 475, x2: CX + 64, y2: CY - 250 },
  // Este: centro right → este left
  { x1: CX + 250, y1: CY - 64, x2: CX + 500, y2: CY + 64 },
  // Oeste: oeste right → centro left
  { x1: CX - 500, y1: CY - 64, x2: CX - 250, y2: CY + 64 },
  // Entrada: sur bottom → entrada top
  { x1: CX - 64, y1: CY + 925, x2: CX + 64, y2: CY + 1025 },
];

// ── Tile map (generated once at load) ────────────────────────────────────────
//
//  GRID_COLS × GRID_ROWS Uint8Array.
//  0 = pared (no caminable)
//  1 = suelo (caminable)
//
//  isWalkable() verifica las 4 esquinas del jugador contra este grid.
//  Si cualquier esquina cae en tile 0 → movimiento bloqueado.
//  Ninguna esquina se puede "colar" por el hueco entre salas.

function buildTileMap(): Uint8Array {
  const map = new Uint8Array(GRID_COLS * GRID_ROWS); // todo 0 por defecto

  /** Marca como caminable un rectángulo en coordenadas de pixel (centro + tamaño). */
  const markCentered = (px: number, py: number, pw: number, ph: number) => {
    const tx1 = Math.max(0,           Math.floor((px - pw / 2) / TILE_SIZE));
    const ty1 = Math.max(0,           Math.floor((py - ph / 2) / TILE_SIZE));
    const tx2 = Math.min(GRID_COLS,   Math.ceil ((px + pw / 2) / TILE_SIZE));
    const ty2 = Math.min(GRID_ROWS,   Math.ceil ((py + ph / 2) / TILE_SIZE));
    for (let ty = ty1; ty < ty2; ty++)
      for (let tx = tx1; tx < tx2; tx++)
        map[ty * GRID_COLS + tx] = 1;
  };

  /** Marca como caminable un rectángulo en coordenadas de pixel (esquina superior-izquierda). */
  const markCorner = (x1: number, y1: number, x2: number, y2: number) => {
    const tx1 = Math.max(0,           Math.floor(x1 / TILE_SIZE));
    const ty1 = Math.max(0,           Math.floor(y1 / TILE_SIZE));
    const tx2 = Math.min(GRID_COLS,   Math.ceil (x2 / TILE_SIZE));
    const ty2 = Math.min(GRID_ROWS,   Math.ceil (y2 / TILE_SIZE));
    for (let ty = ty1; ty < ty2; ty++)
      for (let tx = tx1; tx < tx2; tx++)
        map[ty * GRID_COLS + tx] = 1;
  };

  for (const room of ROOMS)
    markCentered(room.x, room.y, room.w, room.h);

  for (const c of CORRIDORS)
    markCorner(c.x1, c.y1, c.x2, c.y2);

  return map;
}

/** Tile map global — 120×120 celdas, generado una sola vez. */
export const TILE_MAP: Uint8Array = buildTileMap();

/**
 * Devuelve true si la posición (x, y) es caminable.
 *
 * Verifica las 4 esquinas del bounding-box del jugador contra TILE_MAP.
 * Si cualquiera cae fuera del mapa o en un tile 0 → false.
 */
export function isWalkable(x: number, y: number): boolean {
  const r = PLAYER_SIZE / 2;

  const corners: [number, number][] = [
    [x - r, y - r], // superior-izquierda
    [x + r, y - r], // superior-derecha
    [x - r, y + r], // inferior-izquierda
    [x + r, y + r], // inferior-derecha
  ];

  for (const [cx, cy] of corners) {
    const tx = Math.floor(cx / TILE_SIZE);
    const ty = Math.floor(cy / TILE_SIZE);
    // Fuera del mapa → pared
    if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) return false;
    if (TILE_MAP[ty * GRID_COLS + tx] === 0) return false;
  }
  return true;
}

// ── Artifact world positions ──────────────────────────────────────────────────
export const ARTIFACT_WORLD_POS: Record<string, { x: number; y: number }> = {
  // Sur (CX, CY+700) — 600×450
  tt_01: { x: CX - 200, y: CY + 560 },
  tt_02: { x: CX + 200, y: CY + 580 },
  tt_03: { x: CX - 210, y: CY + 780 },
  tt_04: { x: CX + 210, y: CY + 800 },
  tt_05: { x: CX,       y: CY + 690 },

  // Este (CX+750, CY) — 500×500
  sim_01: { x: CX + 580, y: CY - 160 },
  sim_02: { x: CX + 900, y: CY - 170 },
  sim_03: { x: CX + 750, y: CY       },
  int_01: { x: CX + 590, y: CY + 160 },
  int_02: { x: CX + 900, y: CY + 170 },
  int_03: { x: CX + 750, y: CY - 60  },

  // Oeste (CX-750, CY) — 500×500
  mod_01: { x: CX - 900, y: CY - 120 },
  mod_02: { x: CX - 590, y: CY - 100 },
  mod_03: { x: CX - 750, y: CY + 130 },

  // Norte (CX, CY-700) — 600×450
  neu_01:  { x: CX - 200, y: CY - 790 },
  neu_02:  { x: CX + 200, y: CY - 810 },
  int2_01: { x: CX - 180, y: CY - 610 },
  int2_02: { x: CX + 180, y: CY - 600 },
};
