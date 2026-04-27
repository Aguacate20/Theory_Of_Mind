// World dimensions for the top-down explorer
export const LEARN_W = 2400;
export const LEARN_H = 2400;
export const TILE = 48; // tile size in pixels
export const VIEW_W = 800;
export const VIEW_H = 560;
export const PLAYER_SPEED = 2.8;
export const PLAYER_SIZE = 28;

// Room layout in world coordinates (center x, center y, width, height)
export type Room = {
  id: "sur" | "oeste" | "este" | "norte" | "centro" | "entrada";
  label: string;
  x: number; y: number;
  w: number; h: number;
  color: string;
  floorColor: string;
  wallColor: string;
  description: string;
};

export const ROOMS: Room[] = [
  {
    id: "entrada",
    label: "Entrada",
    x: LEARN_W / 2, y: LEARN_H - 200,
    w: 400, h: 280,
    color: "#888780", floorColor: "#D3D1C7", wallColor: "#5F5E5A",
    description: "Punto de partida",
  },
  {
    id: "centro",
    label: "Sala Central — Mapa Conceptual",
    x: LEARN_W / 2, y: LEARN_H / 2,
    w: 480, h: 480,
    color: "#534AB7", floorColor: "#EEEDFE", wallColor: "#3C3489",
    description: "Deposita aquí los artefactos para construir el mapa colectivo",
  },
  {
    id: "sur",
    label: "Sala Sur — Teoría-Teoría",
    x: LEARN_W / 2, y: LEARN_H / 2 + 580,
    w: 520, h: 400,
    color: "#7F77DD", floorColor: "#EEEDFE", wallColor: "#534AB7",
    description: "Wellman, Gopnik, Leslie — La mente como teoría implícita",
  },
  {
    id: "este",
    label: "Sala Este — Simulación",
    x: LEARN_W / 2 + 620, y: LEARN_H / 2,
    w: 420, h: 480,
    color: "#1D9E75", floorColor: "#E1F5EE", wallColor: "#0F6E56",
    description: "Goldman, Gallagher — Simulación e interacción primaria",
  },
  {
    id: "oeste",
    label: "Sala Oeste — Modularidad",
    x: LEARN_W / 2 - 620, y: LEARN_H / 2,
    w: 420, h: 480,
    color: "#EF9F27", floorColor: "#FAEEDA", wallColor: "#BA7517",
    description: "Scholl & Leslie — ToM como módulo cognitivo",
  },
  {
    id: "norte",
    label: "Sala Norte — Integración",
    x: LEARN_W / 2, y: LEARN_H / 2 - 580,
    w: 520, h: 400,
    color: "#D4537E", floorColor: "#FBEAF0", wallColor: "#993556",
    description: "Apperly, Bohl — Neurociencia y modelos integradores",
  },
];

// Artifact positions within rooms (relative to room center)
export const ARTIFACT_POSITIONS: Record<string, { rx: number; ry: number }> = {
  tt_01:  { rx: -140, ry: -80  },
  tt_02:  { rx:  60,  ry: -100 },
  tt_03:  { rx: -60,  ry:  80  },
  tt_04:  { rx:  140, ry:  60  },
  tt_05:  { rx:  0,   ry:  0   },
  sim_01: { rx: -120, ry: -100 },
  sim_02: { rx:  80,  ry: -80  },
  sim_03: { rx: -80,  ry:  80  },
  int_01: { rx:  120, ry:  60  },
  int_02: { rx:  0,   ry:  -20 },
  int_03: { rx:  0,   ry:  120 },
  mod_01: { rx: -100, ry: -100 },
  mod_02: { rx:  100, ry: -60  },
  mod_03: { rx:  0,   ry:  100 },
  neu_01: { rx: -120, ry: -60  },
  neu_02: { rx:  100, ry: -80  },
  int2_01:{ rx: -60,  ry:  80  },
  int2_02:{ rx:  80,  ry:  100 },
};

export function getArtifactWorldPos(artifactId: string): { x: number; y: number } {
  const pos = ARTIFACT_POSITIONS[artifactId];
  if (!pos) return { x: LEARN_W / 2, y: LEARN_H / 2 };
  const room = ROOMS.find(r => {
    const { ARTIFACTS } = require("./artifacts");
    const art = ARTIFACTS.find((a: any) => a.id === artifactId);
    return art && r.id === art.room;
  });
  if (!room) return { x: LEARN_W / 2, y: LEARN_H / 2 };
  return { x: room.x + pos.rx, y: room.y + pos.ry };
}
