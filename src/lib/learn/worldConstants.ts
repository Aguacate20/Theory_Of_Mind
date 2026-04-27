export const TILE = 32;
export const MAP_COLS = 120;
export const MAP_ROWS = 120;
export const LEARN_W = MAP_COLS * TILE;
export const LEARN_H = MAP_ROWS * TILE;
export const VIEW_W = 820;
export const VIEW_H = 560;
export const PLAYER_SPEED = 3.0;
export const PLAYER_SIZE = 14;

export type SpaceType = "hub" | "artifact" | "decoy" | "yard";

export type Space = {
  id: string;
  col: number; row: number;
  w: number; h: number;
  type: SpaceType;
  label: string;
  floorColor: string;
  wallColor: string;
  accentColor: string;
  pattern: "tile" | "wood" | "stone" | "marble" | "carpet" | "grass" | "dirt" | "cobble";
  artifactId?: string;
  theme: "tt" | "sim" | "mod" | "int" | "neutral";
};

export type Corridor = {
  fromId: string; toId: string;
  col: number; row: number; w: number; h: number;
  floorColor: string;
  pattern: "tile" | "cobble" | "dirt" | "grass" | "stone";
};

export function spaceCenter(s: Space): { x: number; y: number } {
  return { x: (s.col + s.w / 2) * TILE, y: (s.row + s.h / 2) * TILE };
}

export const SPACES: Space[] = [
  // Hub
  { id:"hub",          col:52, row:52, w:16, h:16, type:"hub",      label:"Gran Sala — Depósito",             floorColor:"#EEEDFE", wallColor:"#3C3489", accentColor:"#534AB7", pattern:"marble",  theme:"neutral" },
  { id:"entrance",     col:55, row:72, w:10, h:6,  type:"yard",     label:"Entrada Principal",                floorColor:"#D3D1C7", wallColor:"#5F5E5A", accentColor:"#888780", pattern:"cobble",  theme:"neutral" },
  // TT wing south
  { id:"tt_court",     col:50, row:68, w:20, h:4,  type:"yard",     label:"Patio de la Teoría",               floorColor:"#f0eaf8", wallColor:"#534AB7", accentColor:"#7F77DD", pattern:"cobble",  theme:"tt" },
  { id:"tt_01_room",   col:38, row:74, w:12, h:11, type:"artifact", label:"Estudio del Niño Científico",       floorColor:"#EEEDFE", wallColor:"#534AB7", accentColor:"#7F77DD", pattern:"carpet",  theme:"tt",  artifactId:"tt_01" },
  { id:"tt_02_room",   col:54, row:75, w:12, h:10, type:"artifact", label:"Lab. de Falsas Creencias",          floorColor:"#f0edfd", wallColor:"#534AB7", accentColor:"#AFA9EC", pattern:"carpet",  theme:"tt",  artifactId:"tt_02" },
  { id:"tt_03_room",   col:36, row:87, w:12, h:11, type:"artifact", label:"Archivo de Cambio Conceptual",      floorColor:"#EEEDFE", wallColor:"#3C3489", accentColor:"#7F77DD", pattern:"wood",    theme:"tt",  artifactId:"tt_03" },
  { id:"tt_04_room",   col:52, row:88, w:13, h:11, type:"artifact", label:"Taller de Juego Simbólico",         floorColor:"#ede9fc", wallColor:"#534AB7", accentColor:"#7F77DD", pattern:"carpet",  theme:"tt",  artifactId:"tt_04" },
  { id:"tt_05_room",   col:44, row:102,w:14, h:12, type:"artifact", label:"Cámara de Metarrepresentación",     floorColor:"#EEEDFE", wallColor:"#26215C", accentColor:"#534AB7", pattern:"marble",  theme:"tt",  artifactId:"tt_05" },
  { id:"decoy_s",      col:53, row:108,w:14, h:9,  type:"decoy",    label:"Bodega Abandonada",                 floorColor:"#c8c4b8", wallColor:"#444",    accentColor:"#888",    pattern:"dirt",    theme:"neutral" },
  // Sim/Int wing east
  { id:"sim_yard",     col:68, row:50, w:8,  h:22, type:"yard",     label:"Galería Este",                     floorColor:"#e8f5ee", wallColor:"#0F6E56", accentColor:"#1D9E75", pattern:"grass",   theme:"sim" },
  { id:"sim_01_room",  col:78, row:46, w:12, h:10, type:"artifact", label:"Sala del Espejo Mental",            floorColor:"#E1F5EE", wallColor:"#0F6E56", accentColor:"#1D9E75", pattern:"wood",    theme:"sim", artifactId:"sim_01" },
  { id:"sim_02_room",  col:78, row:58, w:12, h:11, type:"artifact", label:"Laboratorio Neural",                floorColor:"#d8f2e8", wallColor:"#085041", accentColor:"#1D9E75", pattern:"tile",    theme:"sim", artifactId:"sim_02" },
  { id:"sim_03_room",  col:92, row:44, w:13, h:12, type:"artifact", label:"Establo de la Memoria",             floorColor:"#E1F5EE", wallColor:"#0F6E56", accentColor:"#5DCAA5", pattern:"dirt",    theme:"sim", artifactId:"sim_03" },
  { id:"int_01_room",  col:92, row:58, w:12, h:11, type:"artifact", label:"Patio de Interacción Primaria",     floorColor:"#e4f8ef", wallColor:"#0F6E56", accentColor:"#1D9E75", pattern:"grass",   theme:"sim", artifactId:"int_01" },
  { id:"int_02_room",  col:107,row:44, w:10, h:13, type:"artifact", label:"Torre de la Segunda Persona",       floorColor:"#E1F5EE", wallColor:"#04342C", accentColor:"#1D9E75", pattern:"stone",   theme:"sim", artifactId:"int_02" },
  { id:"int_03_room",  col:107,row:60, w:10, h:11, type:"artifact", label:"Claustro Intersubjetivo",           floorColor:"#dff0e8", wallColor:"#085041", accentColor:"#0F6E56", pattern:"cobble",  theme:"sim", artifactId:"int_03" },
  { id:"decoy_ne",     col:107,row:28, w:10, h:12, type:"decoy",    label:"Ático del Noreste",                 floorColor:"#ccc",    wallColor:"#555",    accentColor:"#999",    pattern:"wood",    theme:"neutral" },
  { id:"decoy_se",     col:107,row:80, w:10, h:10, type:"decoy",    label:"Cobertizo Sureste",                 floorColor:"#bbb",    wallColor:"#555",    accentColor:"#888",    pattern:"wood",    theme:"neutral" },
  // Mod wing west
  { id:"mod_yard",     col:44, row:50, w:8,  h:22, type:"yard",     label:"Galería Oeste",                    floorColor:"#fdf0d8", wallColor:"#BA7517", accentColor:"#EF9F27", pattern:"dirt",    theme:"mod" },
  { id:"mod_01_room",  col:30, row:46, w:12, h:10, type:"artifact", label:"Forja del Módulo",                  floorColor:"#FAEEDA", wallColor:"#BA7517", accentColor:"#EF9F27", pattern:"stone",   theme:"mod", artifactId:"mod_01" },
  { id:"mod_02_room",  col:30, row:58, w:12, h:11, type:"artifact", label:"Almacén de Parametrización",        floorColor:"#fdf0d8", wallColor:"#854F0B", accentColor:"#EF9F27", pattern:"wood",    theme:"mod", artifactId:"mod_02" },
  { id:"mod_03_room",  col:16, row:50, w:12, h:12, type:"artifact", label:"Clínica del Autismo",               floorColor:"#FAEEDA", wallColor:"#633806", accentColor:"#BA7517", pattern:"tile",    theme:"mod", artifactId:"mod_03" },
  { id:"decoy_nw",     col:4,  row:30, w:10, h:12, type:"decoy",    label:"Capilla Noroeste",                  floorColor:"#d8d4cc", wallColor:"#4a4a4a", accentColor:"#888",    pattern:"stone",   theme:"neutral" },
  { id:"decoy_sw",     col:4,  row:76, w:10, h:10, type:"decoy",    label:"Granero Suroeste",                  floorColor:"#c4b89a", wallColor:"#5a4020", accentColor:"#8B6914", pattern:"dirt",    theme:"neutral" },
  // Int wing north
  { id:"int_court",    col:50, row:40, w:20, h:8,  type:"yard",     label:"Atrio de la Integración",          floorColor:"#fce8f0", wallColor:"#993556", accentColor:"#D4537E", pattern:"cobble",  theme:"int" },
  { id:"neu_01_room",  col:40, row:28, w:12, h:10, type:"artifact", label:"Gabinete de Neuroimagen",           floorColor:"#FBEAF0", wallColor:"#993556", accentColor:"#D4537E", pattern:"tile",    theme:"int", artifactId:"neu_01" },
  { id:"neu_02_room",  col:55, row:28, w:12, h:10, type:"artifact", label:"Archivo de Críticas",               floorColor:"#fce8f0", wallColor:"#72243E", accentColor:"#D4537E", pattern:"wood",    theme:"int", artifactId:"neu_02" },
  { id:"int2_01_room", col:38, row:14, w:14, h:12, type:"artifact", label:"Torre del Sistema Dual",            floorColor:"#FBEAF0", wallColor:"#993556", accentColor:"#ED93B1", pattern:"marble",  theme:"int", artifactId:"int2_01" },
  { id:"int2_02_room", col:56, row:14, w:12, h:12, type:"artifact", label:"Sala de Integración Final",         floorColor:"#fce8f0", wallColor:"#4B1528", accentColor:"#D4537E", pattern:"carpet",  theme:"int", artifactId:"int2_02" },
  { id:"decoy_n",      col:52, row:4,  w:16, h:8,  type:"decoy",    label:"Observatorio Vacío",                floorColor:"#e8e4dc", wallColor:"#666",    accentColor:"#999",    pattern:"tile",    theme:"neutral" },
];

export const CORRIDORS: Corridor[] = [
  // entrance ↔ hub
  { fromId:"entrance",    toId:"hub",          col:59, row:68, w:2, h:4,  floorColor:"#D3D1C7", pattern:"cobble" },
  // hub ↔ tt_court (S)
  { fromId:"hub",         toId:"tt_court",     col:59, row:68, w:2, h:4,  floorColor:"#e0dcf0", pattern:"cobble" },
  // tt_court ↔ tt_01
  { fromId:"tt_court",    toId:"tt_01_room",   col:48, row:72, w:2, h:2,  floorColor:"#e8e4f8", pattern:"cobble" },
  // tt_court ↔ tt_02
  { fromId:"tt_court",    toId:"tt_02_room",   col:60, row:72, w:2, h:3,  floorColor:"#e8e4f8", pattern:"cobble" },
  // tt_01 ↔ tt_03
  { fromId:"tt_01_room",  toId:"tt_03_room",   col:44, row:85, w:2, h:2,  floorColor:"#e0dcf0", pattern:"cobble" },
  // tt_02 ↔ tt_04
  { fromId:"tt_02_room",  toId:"tt_04_room",   col:58, row:85, w:2, h:3,  floorColor:"#e0dcf0", pattern:"cobble" },
  // tt_03 ↔ tt_05
  { fromId:"tt_03_room",  toId:"tt_05_room",   col:46, row:98, w:2, h:4,  floorColor:"#d8d4f0", pattern:"cobble" },
  // tt_04 ↔ tt_05
  { fromId:"tt_04_room",  toId:"tt_05_room",   col:58, row:99, w:2, h:3,  floorColor:"#d8d4f0", pattern:"cobble" },
  // tt_05 ↔ decoy_s
  { fromId:"tt_05_room",  toId:"decoy_s",      col:59, row:114,w:2, h:2,  floorColor:"#bbb",    pattern:"dirt"   },
  // hub ↔ sim_yard (E)
  { fromId:"hub",         toId:"sim_yard",     col:68, row:59, w:4, h:2,  floorColor:"#d8f0e8", pattern:"grass"  },
  // sim_yard ↔ sim_01
  { fromId:"sim_yard",    toId:"sim_01_room",  col:76, row:50, w:2, h:2,  floorColor:"#d8f0e8", pattern:"grass"  },
  // sim_yard ↔ sim_02
  { fromId:"sim_yard",    toId:"sim_02_room",  col:76, row:62, w:2, h:2,  floorColor:"#d8f0e8", pattern:"grass"  },
  // sim_01 ↔ sim_03
  { fromId:"sim_01_room", toId:"sim_03_room",  col:90, row:50, w:2, h:2,  floorColor:"#cceedd", pattern:"dirt"   },
  // sim_02 ↔ int_01
  { fromId:"sim_02_room", toId:"int_01_room",  col:90, row:63, w:2, h:2,  floorColor:"#cceedd", pattern:"dirt"   },
  // sim_03 ↔ int_02
  { fromId:"sim_03_room", toId:"int_02_room",  col:105,row:50, w:2, h:2,  floorColor:"#cceedd", pattern:"stone"  },
  // int_01 ↔ int_03
  { fromId:"int_01_room", toId:"int_03_room",  col:105,row:65, w:2, h:2,  floorColor:"#cceedd", pattern:"stone"  },
  // sim_03 ↔ decoy_ne
  { fromId:"sim_03_room", toId:"decoy_ne",     col:107,row:40, w:2, h:4,  floorColor:"#bbb",    pattern:"dirt"   },
  // int_03 ↔ decoy_se
  { fromId:"int_03_room", toId:"decoy_se",     col:107,row:75, w:2, h:5,  floorColor:"#bbb",    pattern:"dirt"   },
  // hub ↔ mod_yard (W)
  { fromId:"hub",         toId:"mod_yard",     col:44, row:59, w:4, h:2,  floorColor:"#f0e8d8", pattern:"dirt"   },
  // mod_yard ↔ mod_01
  { fromId:"mod_yard",    toId:"mod_01_room",  col:42, row:50, w:2, h:2,  floorColor:"#f0e8d8", pattern:"dirt"   },
  // mod_yard ↔ mod_02
  { fromId:"mod_yard",    toId:"mod_02_room",  col:42, row:62, w:2, h:2,  floorColor:"#f0e8d8", pattern:"dirt"   },
  // mod_01 ↔ mod_03
  { fromId:"mod_01_room", toId:"mod_03_room",  col:28, row:51, w:2, h:4,  floorColor:"#e8dcc8", pattern:"stone"  },
  // mod_03 ↔ decoy_nw
  { fromId:"mod_03_room", toId:"decoy_nw",     col:14, row:36, w:2, h:14, floorColor:"#bbb",    pattern:"dirt"   },
  // mod_02 ↔ decoy_sw
  { fromId:"mod_02_room", toId:"decoy_sw",     col:14, row:62, w:2, h:14, floorColor:"#bbb",    pattern:"dirt"   },
  // hub ↔ int_court (N)
  { fromId:"hub",         toId:"int_court",    col:59, row:48, w:2, h:4,  floorColor:"#f8e4ee", pattern:"cobble" },
  // int_court ↔ neu_01
  { fromId:"int_court",   toId:"neu_01_room",  col:50, row:38, w:2, h:2,  floorColor:"#f8e4ee", pattern:"cobble" },
  // int_court ↔ neu_02
  { fromId:"int_court",   toId:"neu_02_room",  col:62, row:38, w:2, h:2,  floorColor:"#f8e4ee", pattern:"cobble" },
  // neu_01 ↔ int2_01
  { fromId:"neu_01_room", toId:"int2_01_room", col:46, row:26, w:2, h:2,  floorColor:"#f0d8e8", pattern:"cobble" },
  // neu_02 ↔ int2_02
  { fromId:"neu_02_room", toId:"int2_02_room", col:62, row:26, w:2, h:2,  floorColor:"#f0d8e8", pattern:"cobble" },
  // int2_01 ↔ decoy_n
  { fromId:"int2_01_room",toId:"decoy_n",      col:59, row:12, w:2, h:2,  floorColor:"#bbb",    pattern:"cobble" },
];

// ── TILE MAP ──────────────────────────────────────────────────────────────────

let _tileMap: Uint8Array | null = null;

export function getTileMap(): Uint8Array {
  if (_tileMap) return _tileMap;
  _tileMap = new Uint8Array(MAP_COLS * MAP_ROWS);
  const fill = (col: number, row: number, w: number, h: number) => {
    for (let r = row; r < row + h; r++)
      for (let c = col; c < col + w; c++)
        if (c >= 0 && c < MAP_COLS && r >= 0 && r < MAP_ROWS)
          _tileMap![r * MAP_COLS + c] = 1;
  };
  for (const s of SPACES) fill(s.col, s.row, s.w, s.h);
  for (const c of CORRIDORS) fill(c.col, c.row, c.w, c.h);
  return _tileMap;
}

export function isWalkable(px: number, py: number): boolean {
  const map = getTileMap();
  const corners = [
    [px - PLAYER_SIZE, py - PLAYER_SIZE],
    [px + PLAYER_SIZE, py - PLAYER_SIZE],
    [px - PLAYER_SIZE, py + PLAYER_SIZE],
    [px + PLAYER_SIZE, py + PLAYER_SIZE],
  ];
  for (const [cx, cy] of corners) {
    const col = Math.floor(cx / TILE);
    const row = Math.floor(cy / TILE);
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
    if (map[row * MAP_COLS + col] === 0) return false;
  }
  return true;
}

// Artifact world positions — center of each artifact's room
export const ARTIFACT_WORLD_POS: Record<string, { x: number; y: number }> = (() => {
  const pos: Record<string, { x: number; y: number }> = {};
  for (const space of SPACES) {
    if (space.artifactId) {
      pos[space.artifactId] = spaceCenter(space);
    }
  }
  return pos;
})();

export const START_X = (55 + 5) * TILE;
export const START_Y = (72 + 3) * TILE;
