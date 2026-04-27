"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { CharacterDef, drawCharacter } from "@/lib/characters";
import { ARTIFACTS, Artifact, ArtifactNode, DepositedArtifact } from "@/lib/learn/artifacts";
import {
  ROOMS, CORRIDORS, LEARN_W, LEARN_H, VIEW_W, VIEW_H,
  PLAYER_SPEED, PLAYER_SIZE, isWalkable, ARTIFACT_WORLD_POS, Room,
} from "@/lib/learn/worldConstants";
import { supabase } from "@/lib/supabase";
import ConceptMap from "./ConceptMap";
import ArtifactModal from "./ArtifactModal";

type Vec = { x: number; y: number };
type OtherPlayer = { id: string; name: string; x: number; y: number; group: number };

// ── Decorative elements per room ─────────────────────────────────────────────
type Deco = { x: number; y: number; type: string; color: string };

function getRoomDecos(room: Room): Deco[] {
  const decos: Deco[] = [];
  const hw = room.w / 2, hh = room.h / 2;
  // Bookshelves along walls
  const shelfColor = room.wallColor + "cc";
  // Left wall shelves
  for (let sy = room.y - hh + 40; sy < room.y + hh - 40; sy += 80) {
    decos.push({ x: room.x - hw + 18, y: sy, type: "shelf", color: shelfColor });
  }
  // Right wall shelves
  for (let sy = room.y - hh + 40; sy < room.y + hh - 40; sy += 80) {
    decos.push({ x: room.x + hw - 18, y: sy, type: "shelf", color: shelfColor });
  }
  // Potted plants in corners
  if (room.id !== "entrada") {
    decos.push({ x: room.x - hw + 30, y: room.y - hh + 30, type: "plant", color: "#5a8a3c" });
    decos.push({ x: room.x + hw - 30, y: room.y - hh + 30, type: "plant", color: "#5a8a3c" });
    decos.push({ x: room.x - hw + 30, y: room.y + hh - 30, type: "plant", color: "#5a8a3c" });
    decos.push({ x: room.x + hw - 30, y: room.y + hh - 30, type: "plant", color: "#5a8a3c" });
  }
  // Central table for centro
  if (room.id === "centro") {
    decos.push({ x: room.x, y: room.y, type: "table", color: room.accentColor });
  }
  // Rugs
  if (room.id !== "entrada" && room.id !== "centro") {
    decos.push({ x: room.x, y: room.y, type: "rug", color: room.accentColor + "44" });
  }
  return decos;
}

function drawFloorPattern(
  ctx: CanvasRenderingContext2D,
  room: Room,
  camX: number, camY: number
) {
  const hw = room.w / 2, hh = room.h / 2;
  const rx = room.x - hw - camX;
  const ry = room.y - hh - camY;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, room.w, room.h);
  ctx.clip();

  ctx.fillStyle = room.floorColor;
  ctx.fillRect(rx, ry, room.w, room.h);

  if (room.pattern === "tile") {
    ctx.strokeStyle = room.wallColor + "22";
    ctx.lineWidth = 0.5;
    const ts = 40;
    for (let tx = rx; tx < rx + room.w + ts; tx += ts) {
      ctx.beginPath(); ctx.moveTo(Math.round(tx), ry); ctx.lineTo(Math.round(tx), ry + room.h); ctx.stroke();
    }
    for (let ty = ry; ty < ry + room.h + ts; ty += ts) {
      ctx.beginPath(); ctx.moveTo(rx, Math.round(ty)); ctx.lineTo(rx + room.w, Math.round(ty)); ctx.stroke();
    }
  } else if (room.pattern === "wood") {
    ctx.strokeStyle = room.wallColor + "18";
    ctx.lineWidth = 2;
    for (let ty = ry; ty < ry + room.h + 28; ty += 28) {
      ctx.beginPath(); ctx.moveTo(rx, Math.round(ty)); ctx.lineTo(rx + room.w, Math.round(ty)); ctx.stroke();
    }
    // Wood grain dots
    ctx.fillStyle = room.wallColor + "10";
    for (let gx = rx + 10; gx < rx + room.w; gx += 60) {
      for (let gy = ry + 8; gy < ry + room.h; gy += 28) {
        ctx.beginPath(); ctx.arc(gx, gy, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (room.pattern === "stone") {
    ctx.strokeStyle = room.wallColor + "25";
    ctx.lineWidth = 1;
    let row = 0;
    for (let ty = ry; ty < ry + room.h + 50; ty += 50, row++) {
      const offset = (row % 2) * 60;
      for (let tx = rx - offset; tx < rx + room.w + 60; tx += 120) {
        ctx.strokeRect(tx + 2, ty + 2, 116, 46);
      }
    }
  } else if (room.pattern === "marble") {
    // Marble: diagonal lines
    ctx.strokeStyle = room.accentColor + "15";
    ctx.lineWidth = 1;
    for (let d = -room.h; d < room.w + room.h; d += 35) {
      ctx.beginPath();
      ctx.moveTo(rx + d, ry);
      ctx.lineTo(rx + d - room.h, ry + room.h);
      ctx.stroke();
    }
    // Diamond pattern overlay
    ctx.strokeStyle = room.accentColor + "20";
    ctx.lineWidth = 0.5;
    const ds = 60;
    for (let tx = rx; tx < rx + room.w + ds; tx += ds) {
      for (let ty = ry; ty < ry + room.h + ds; ty += ds) {
        ctx.beginPath();
        ctx.moveTo(tx, ty - ds/2);
        ctx.lineTo(tx + ds/2, ty);
        ctx.lineTo(tx, ty + ds/2);
        ctx.lineTo(tx - ds/2, ty);
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (room.pattern === "carpet") {
    // Carpet: subtle horizontal lines + border
    ctx.fillStyle = room.accentColor + "08";
    ctx.fillRect(rx + 15, ry + 15, room.w - 30, room.h - 30);
    ctx.strokeStyle = room.accentColor + "30";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 15, ry + 15, room.w - 30, room.h - 30);
    ctx.strokeRect(rx + 20, ry + 20, room.w - 40, room.h - 40);
    for (let ty = ry + 30; ty < ry + room.h - 15; ty += 18) {
      ctx.beginPath(); ctx.moveTo(rx + 20, ty); ctx.lineTo(rx + room.w - 20, ty); ctx.stroke();
    }
  }

  ctx.restore();
}

function drawDeco(ctx: CanvasRenderingContext2D, deco: Deco, camX: number, camY: number) {
  const sx = deco.x - camX, sy = deco.y - camY;
  ctx.save();
  if (deco.type === "shelf") {
    ctx.fillStyle = deco.color;
    ctx.fillRect(sx - 14, sy - 30, 28, 60);
    // Book spines
    const bookColors = ["#7F77DD","#1D9E75","#EF9F27","#D4537E","#E24B4A"];
    let bx = sx - 11;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = bookColors[i % bookColors.length];
      ctx.fillRect(bx, sy - 26, 4, 52 - i * 3);
      bx += 5;
    }
  } else if (deco.type === "plant") {
    // Pot
    ctx.fillStyle = "#993C1D";
    ctx.beginPath();
    ctx.roundRect?.(sx - 8, sy - 2, 16, 14, 2);
    ctx.fill();
    // Leaves
    ctx.fillStyle = deco.color;
    ctx.beginPath(); ctx.ellipse(sx, sy - 14, 10, 7, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + 7, sy - 10, 7, 5, 0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx - 7, sy - 10, 7, 5, -0.5, 0, Math.PI*2); ctx.fill();
  } else if (deco.type === "table") {
    // Central deposit table
    ctx.fillStyle = deco.color + "33";
    ctx.strokeStyle = deco.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 70, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(sx, sy, 80, 0, Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = deco.color;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("zona de depósito", sx, sy + 96);
  } else if (deco.type === "rug") {
    ctx.fillStyle = deco.color;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 120, 80, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCorridor(
  ctx: CanvasRenderingContext2D,
  c: typeof CORRIDORS[0],
  camX: number, camY: number
) {
  const rx = c.x1 - camX, ry = c.y1 - camY;
  const rw = c.x2 - c.x1, rh = c.y2 - c.y1;
  // Floor
  ctx.fillStyle = "#c8c4b8";
  ctx.fillRect(rx, ry, rw, rh);
  // Tiles in corridor
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  const isVertical = rh > rw;
  if (isVertical) {
    for (let ty = ry; ty < ry + rh; ty += 40) {
      ctx.beginPath(); ctx.moveTo(rx, ty); ctx.lineTo(rx + rw, ty); ctx.stroke();
    }
  } else {
    for (let tx = rx; tx < rx + rw; tx += 40) {
      ctx.beginPath(); ctx.moveTo(tx, ry); ctx.lineTo(tx, ry + rh); ctx.stroke();
    }
  }
  // Walls (thin border)
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, ry, rw, rh);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LearnWorld({
  playerName, sessionId, group, character,
}: {
  playerName: string;
  sessionId: string;
  group: 1 | 2 | 3;
  character: CharacterDef;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    pos: { x: LEARN_W / 2, y: LEARN_H / 2 + 1100 } as Vec,
    cam: { x: 0, y: 0 } as Vec,
    keys: {} as Record<string, boolean>,
    carried: null as string | null,
    otherPlayers: [] as OtherPlayer[],
    frame: 0,
    decos: ROOMS.map(getRoomDecos).flat(),
  });
  const animRef = useRef(0);
  const lastSyncRef = useRef(0);

  const [nearArtifact, setNearArtifact] = useState<Artifact | null>(null);
  const [nearDeposit, setNearDeposit] = useState(false);
  const [modalArtifact, setModalArtifact] = useState<Artifact | null>(null);
  const [carriedId, setCarriedId] = useState<string | null>(null);
  const [deposited, setDeposited] = useState<DepositedArtifact[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string>("entrada");

  useEffect(() => {
    fetchDeposited();
    const channel = supabase.channel("learn_world_" + sessionId.slice(0,4))
      .on("postgres_changes", { event: "*", schema: "public", table: "learn_artifacts" }, fetchDeposited)
      .on("postgres_changes", { event: "*", schema: "public", table: "learn_players" }, fetchOtherPlayers)
      .subscribe();
    fetchOtherPlayers();
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); supabase.removeChannel(channel); };
  }, []);

  async function fetchDeposited() {
    const { data } = await supabase.from("learn_artifacts").select("*");
    if (data) setDeposited(data as DepositedArtifact[]);
  }
  async function fetchOtherPlayers() {
    const { data } = await supabase.from("learn_players").select("*").neq("id", sessionId);
    if (data) stateRef.current.otherPlayers = data as OtherPlayer[];
  }

  function loop() { update(); draw(); animRef.current = requestAnimationFrame(loop); }

  function update() {
    const s = stateRef.current;
    s.frame++;
    let dx = 0, dy = 0;
    if (s.keys["ArrowLeft"]  || s.keys["a"]) dx -= PLAYER_SPEED;
    if (s.keys["ArrowRight"] || s.keys["d"]) dx += PLAYER_SPEED;
    if (s.keys["ArrowUp"]    || s.keys["w"]) dy -= PLAYER_SPEED;
    if (s.keys["ArrowDown"]  || s.keys["s"]) dy += PLAYER_SPEED;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }

    const nx = s.pos.x + dx;
    const ny = s.pos.y + dy;
    if (isWalkable(nx, s.pos.y)) s.pos.x = nx;
    if (isWalkable(s.pos.x, ny)) s.pos.y = ny;

    // Camera
    const targetCamX = Math.max(0, Math.min(LEARN_W - VIEW_W, s.pos.x - VIEW_W / 2));
    const targetCamY = Math.max(0, Math.min(LEARN_H - VIEW_H, s.pos.y - VIEW_H / 2));
    s.cam.x += (targetCamX - s.cam.x) * 0.1;
    s.cam.y += (targetCamY - s.cam.y) * 0.1;

    // Current room detection
    const room = ROOMS.find(r => {
      const hw = r.w/2, hh = r.h/2;
      return s.pos.x >= r.x-hw && s.pos.x <= r.x+hw && s.pos.y >= r.y-hh && s.pos.y <= r.y+hh;
    });
    if (room) setCurrentRoom(room.id);

    // Near artifact detection
    let nearArt: Artifact | null = null;
    if (!s.carried) {
      let minDist = 55;
      for (const art of ARTIFACTS) {
        if (deposited.find(d => d.id === art.id)) continue;
        const wp = ARTIFACT_WORLD_POS[art.id];
        if (!wp) continue;
        const dist = Math.hypot(s.pos.x - wp.x, s.pos.y - wp.y);
        if (dist < minDist) { minDist = dist; nearArt = art; }
      }
    }
    setNearArtifact(nearArt);

    // Near deposit zone
    const centro = ROOMS.find(r => r.id === "centro")!;
    const inDeposit = Math.hypot(s.pos.x - centro.x, s.pos.y - centro.y) < 85;
    setNearDeposit(!!s.carried && inDeposit);

    // Supabase sync
    if (Date.now() - lastSyncRef.current > 1800) {
      lastSyncRef.current = Date.now();
      supabase.from("learn_players").upsert({
        id: sessionId, name: playerName, group,
        x: Math.round(s.pos.x), y: Math.round(s.pos.y),
        updated_at: new Date().toISOString(),
      });
    }
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    const camX = s.cam.x, camY = s.cam.y;

    // Dark background (walls/void)
    ctx.fillStyle = "#1e1c17";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Subtle grid on void
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.5;
    for (let gx = -camX % 60; gx < VIEW_W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,VIEW_H); ctx.stroke(); }
    for (let gy = -camY % 60; gy < VIEW_H; gy += 60) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(VIEW_W,gy); ctx.stroke(); }

    // Corridors
    for (const c of CORRIDORS) drawCorridor(ctx, c, camX, camY);

    // Rooms — floor patterns first
    for (const room of ROOMS) drawFloorPattern(ctx, room, camX, camY);

    // Room walls
    for (const room of ROOMS) {
      const hw = room.w/2, hh = room.h/2;
      const rx = room.x - hw - camX, ry = room.y - hh - camY;
      ctx.strokeStyle = room.wallColor;
      ctx.lineWidth = 5;
      ctx.strokeRect(rx, ry, room.w, room.h);
      // Inner shadow
      ctx.strokeStyle = room.wallColor + "44";
      ctx.lineWidth = 2;
      ctx.strokeRect(rx + 5, ry + 5, room.w - 10, room.h - 10);
      // Room label at top
      ctx.fillStyle = room.wallColor;
      ctx.font = "500 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(room.label, room.x - camX, ry + 18);
    }

    // Decorations
    for (const deco of s.decos) {
      const sx = deco.x - camX, sy = deco.y - camY;
      if (sx < -60 || sx > VIEW_W + 60 || sy < -60 || sy > VIEW_H + 60) continue;
      drawDeco(ctx, deco, camX, camY);
    }

    // Artifacts
    for (const art of ARTIFACTS) {
      const isDeposited = !!deposited.find(d => d.id === art.id);
      const isCarried = s.carried === art.id;
      if (isDeposited || isCarried) continue;
      const wp = ARTIFACT_WORLD_POS[art.id];
      if (!wp) continue;
      const sx = wp.x - camX, sy = wp.y - camY;
      if (sx < -40 || sx > VIEW_W + 40 || sy < -40 || sy > VIEW_H + 40) continue;

      const isNear = nearArtifact?.id === art.id;
      const isPrimary = art.primaryGroup === group;
      const pulse = Math.sin(s.frame * 0.07) * 0.5 + 0.5;

      // Glow for primary group
      if (isPrimary) {
        ctx.fillStyle = art.color + Math.round(20 + pulse * 30).toString(16).padStart(2,"0");
        ctx.beginPath(); ctx.arc(sx, sy, 28 + pulse * 4, 0, Math.PI*2); ctx.fill();
      }

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath(); ctx.ellipse(sx + 2, sy + 3, 14, 8, 0, 0, Math.PI*2); ctx.fill();

      // Artifact box
      const boxSize = isNear ? 34 : 30;
      ctx.fillStyle = isNear ? art.color : art.color + "dd";
      ctx.strokeStyle = isNear ? "#fff" : art.color;
      ctx.lineWidth = isNear ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect?.(sx - boxSize/2, sy - boxSize/2, boxSize, boxSize, 6);
      ctx.fill(); ctx.stroke();

      // Icon
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${isNear ? 16 : 14}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(art.icon, sx, sy + 5);

      // Proximity prompt
      if (isNear) {
        ctx.fillStyle = "#fff";
        ctx.font = "500 10px sans-serif";
        ctx.fillText("E — recoger", sx, sy - 24);
      }

      // Primary star badge
      if (isPrimary) {
        ctx.fillStyle = "#FFD700";
        ctx.font = "9px sans-serif";
        ctx.fillText("★", sx + 16, sy - 14);
      }
    }

    // Deposited artifacts shown as glowing orbs in centro
    const centro = ROOMS.find(r => r.id === "centro")!;
    deposited.forEach((dep, i) => {
      const art = ARTIFACTS.find(a => a.id === dep.id);
      if (!art) return;
      const angle = (i / Math.max(deposited.length, 1)) * Math.PI * 2 - Math.PI/2;
      const radius = 45;
      const ox = centro.x + Math.cos(angle) * radius - camX;
      const oy = centro.y + Math.sin(angle) * radius - camY;
      const pulse2 = Math.sin(s.frame * 0.05 + i) * 2;
      ctx.fillStyle = art.color + "bb";
      ctx.beginPath(); ctx.arc(ox, oy, 8 + pulse2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 7px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(art.icon, ox, oy + 2);
    });

    // Other players
    for (const op of s.otherPlayers) {
      const ox = op.x - camX, oy = op.y - camY;
      if (ox < -30 || ox > VIEW_W+30 || oy < -30 || oy > VIEW_H+30) continue;
      const opColor = op.group === 1 ? "#7F77DD" : op.group === 2 ? "#1D9E75" : "#EF9F27";
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = opColor + "33";
      ctx.beginPath(); ctx.arc(ox, oy, PLAYER_SIZE, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(op.name.slice(0,8), ox, oy - PLAYER_SIZE - 4);
    }

    // Local player
    drawCharacter(ctx, character, s.pos.x - PLAYER_SIZE - camX, s.pos.y - PLAYER_SIZE*1.5 - camY, PLAYER_SIZE*2, PLAYER_SIZE*3, playerName);

    // Carried artifact floating above player
    if (s.carried) {
      const art = ARTIFACTS.find(a => a.id === s.carried);
      if (art) {
        const px = s.pos.x - camX, py = s.pos.y - camY;
        ctx.fillStyle = art.color;
        ctx.beginPath(); ctx.arc(px, py - PLAYER_SIZE*2 - 16, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(art.icon, px, py - PLAYER_SIZE*2 - 13);
      }
    }

    // Minimap (bottom-right)
    drawMinimap(ctx, s.pos, deposited);
  }

  function drawMinimap(ctx: CanvasRenderingContext2D, pos: Vec, dep: DepositedArtifact[]) {
    const mmX = VIEW_W - 130, mmY = VIEW_H - 110, mmW = 120, mmH = 100;
    const scale = mmW / LEARN_W;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath(); ctx.roundRect?.(mmX - 4, mmY - 4, mmW + 8, mmH + 8, 6); ctx.fill();

    for (const room of ROOMS) {
      const rx = mmX + (room.x - room.w/2) * scale;
      const ry = mmY + (room.y - room.h/2) * scale;
      ctx.fillStyle = room.accentColor + "88";
      ctx.fillRect(rx, ry, room.w * scale, room.h * scale);
    }
    for (const c of CORRIDORS) {
      ctx.fillStyle = "#888";
      ctx.fillRect(mmX + c.x1*scale, mmY + c.y1*scale, (c.x2-c.x1)*scale, (c.y2-c.y1)*scale);
    }

    // Player dot
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(mmX + pos.x * scale, mmY + pos.y * scale, 3, 0, Math.PI*2);
    ctx.fill();
  }

  // ── Interactions ──────────────────────────────────────────────────────────
  const pickUpArtifact = useCallback(() => {
    if (!nearArtifact || stateRef.current.carried) return;
    setModalArtifact(nearArtifact);
  }, [nearArtifact]);

  function onArtifactSolved(artifactId: string) {
    stateRef.current.carried = artifactId;
    setCarriedId(artifactId);
    setModalArtifact(null);
  }

  function depositArtifact() {
    const carried = stateRef.current.carried;
    if (!carried || !nearDeposit) return;
    const art = ARTIFACTS.find(a => a.id === carried);
    if (!art) return;
    setModalArtifact({ ...art, _depositMode: true } as any);
  }

  async function onDeposit(artifactId: string, node: ArtifactNode, relation: string) {
    await supabase.from("learn_artifacts").upsert({
      id: artifactId, node, relation,
      deposited_by: playerName, group,
      deposited_at: new Date().toISOString(),
    });
    stateRef.current.carried = null;
    setCarriedId(null);
    setModalArtifact(null);
    fetchDeposited();
  }

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
      if (e.key === "e" || e.key === "E") {
        if (nearArtifact && !stateRef.current.carried) pickUpArtifact();
        else if (nearDeposit && stateRef.current.carried) depositArtifact();
      }
      if (e.key === "m" || e.key === "M") setShowMap(v => !v);
    };
    const onUp = (e: KeyboardEvent) => { stateRef.current.keys[e.key] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [nearArtifact, nearDeposit, pickUpArtifact]);

  const groupColor = group === 1 ? "#7F77DD" : group === 2 ? "#1D9E75" : "#EF9F27";
  const groupLabel = group === 1 ? "TT — Wellman & Leslie" : group === 2 ? "Simulación & Interacción" : "Modularidad & Integración";
  const roomObj = ROOMS.find(r => r.id === currentRoom);

  return (
    <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
      <div style={{ flex:"0 0 auto" }}>
        {/* HUD */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, fontSize:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:groupColor }} />
            <span style={{ color:"var(--color-text-secondary)" }}>Grupo: <strong style={{ color:"var(--color-text-primary)" }}>{groupLabel}</strong></span>
          </div>
          <div style={{ display:"flex", gap:10, fontSize:11, color:"var(--color-text-secondary)" }}>
            {roomObj && <span style={{ color: roomObj.accentColor, fontWeight:500 }}>{roomObj.shortLabel}</span>}
            {carriedId && <span style={{ color:groupColor, fontWeight:500 }}>cargando artefacto</span>}
            <span>{deposited.length}/{ARTIFACTS.length} depositados</span>
          </div>
        </div>

        {/* Modal */}
        {modalArtifact && (
          <ArtifactModal
            artifact={modalArtifact}
            playerGroup={group}
            depositMode={(modalArtifact as any)._depositMode}
            depositedSoFar={deposited}
            onSolved={onArtifactSolved}
            onDeposit={onDeposit}
            onClose={() => setModalArtifact(null)}
          />
        )}

        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H}
          style={{ display:"block", borderRadius:"var(--border-radius-lg)", border:"0.5px solid var(--color-border-tertiary)" }} />

        <div style={{ fontSize:10, color:"var(--color-text-tertiary)", textAlign:"center", marginTop:4 }}>
          WASD / flechas — mover · E — recoger/depositar · M — mapa conceptual
        </div>

        <div style={{ display:"flex", gap:6, marginTop:6 }}>
          {nearArtifact && !carriedId && (
            <button onClick={pickUpArtifact}
              style={{ flex:1, padding:"7px 0", fontSize:12, border:`0.5px solid ${nearArtifact.color}`, borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", cursor:"pointer", color:nearArtifact.color, fontWeight:500 }}>
              E — Recoger "{nearArtifact.title}"
            </button>
          )}
          {carriedId && nearDeposit && (
            <button onClick={depositArtifact}
              style={{ flex:1, padding:"7px 0", fontSize:12, border:"0.5px solid #7F77DD", borderRadius:"var(--border-radius-md)", background:"#EEEDFE", cursor:"pointer", color:"#3C3489", fontWeight:500 }}>
              E — Depositar en el mapa
            </button>
          )}
          <button onClick={() => setShowMap(v => !v)}
            style={{ padding:"7px 14px", fontSize:12, border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", cursor:"pointer", color:"var(--color-text-primary)" }}>
            M — {showMap ? "Ocultar" : "Ver"} mapa
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12, minWidth:0 }}>
        {showMap ? <ConceptMap deposited={deposited} /> : (
          <>
            <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem" }}>
              <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:8 }}>Artefactos de tu grupo ★</div>
              {ARTIFACTS.filter(a => a.primaryGroup === group).map(art => {
                const dep = deposited.find(d => d.id === art.id);
                const isC = carriedId === art.id;
                return (
                  <div key={art.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"0.5px solid var(--color-border-tertiary)", fontSize:12 }}>
                    <div style={{ width:20, height:20, borderRadius:4, background: dep ? art.color : "var(--color-background-secondary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color: dep ? "#fff" : art.color, fontWeight:"bold", flexShrink:0 }}>
                      {dep ? "✓" : art.icon}
                    </div>
                    <span style={{ color: dep ? "var(--color-text-tertiary)" : "var(--color-text-primary)", textDecoration: dep ? "line-through" : "none", flex:1 }}>{art.title}</span>
                    {dep && <span style={{ fontSize:10, color:"#5DCAA5" }}>✓</span>}
                    {isC && <span style={{ fontSize:10, color:art.color }}>cargando</span>}
                  </div>
                );
              })}
            </div>

            <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem" }}>
              <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:8 }}>Progreso colectivo</div>
              {[
                { g:1, label:"Teoría-Teoría", color:"#7F77DD" },
                { g:2, label:"Simulación", color:"#1D9E75" },
                { g:3, label:"Modularidad", color:"#EF9F27" },
              ].map(gi => {
                const total = ARTIFACTS.filter(a => a.primaryGroup === gi.g).length;
                const done = deposited.filter(d => ARTIFACTS.find(a => a.id === d.id)?.primaryGroup === gi.g).length;
                return (
                  <div key={gi.g} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                      <span style={{ color:"var(--color-text-secondary)" }}>{gi.label}</span>
                      <span style={{ fontWeight:500, color:"var(--color-text-primary)" }}>{done}/{total}</span>
                    </div>
                    <div style={{ height:5, background:"var(--color-background-secondary)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${(done/total)*100}%`, height:"100%", background:gi.color, borderRadius:3, transition:"width .5s" }} />
                    </div>
                  </div>
                );
              })}
              {deposited.length === ARTIFACTS.length && (
                <div style={{ marginTop:10, fontSize:12, background:"#E1F5EE", color:"#085041", borderRadius:"var(--border-radius-md)", padding:"8px 12px", textAlign:"center" }}>
                  🎉 ¡Mapa completo! Bonus de energía para ToM Runner desbloqueado
                </div>
              )}
            </div>

            <div style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:"10px 12px" }}>
              <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:5 }}>Guía del mapa</div>
              <div style={{ fontSize:10, color:"var(--color-text-tertiary)", display:"flex", flexDirection:"column", gap:3 }}>
                <span>★ dorado = artefacto de tu lectura (más fácil)</span>
                <span>Halo brillante = artefacto de tu grupo</span>
                <span>Zona punteada en sala central = depósito</span>
                <span>Minimap esquina inferior derecha del juego</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
