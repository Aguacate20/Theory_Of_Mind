"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  CANVAS_W, CANVAS_H, WORLD_W, WORLD_H,
  GRAVITY, JUMP_FORCE, MOVE_SPEED,
  ENERGY_MOVE_COST, ENERGY_JUMP_COST, ENERGY_REGEN_CORRECT, ENERGY_PENALTY_WRONG,
  ZONES, getZone, getSkyColors, generatePlatforms, CHECKPOINTS, Platform,
} from "@/lib/gameConstants";
import { QUESTIONS, Question } from "@/lib/questions";
import { supabase, PlayerRow } from "@/lib/supabase";
import { CharacterDef, drawCharacter } from "@/lib/characters";

type Player = {
  x: number; worldY: number;
  vx: number; vy: number;
  onGround: boolean;
  facingLeft: boolean;
};

type GameStats = { correct: number; total: number };
type Cam = { x: number; y: number };

const PW = 26, PH = 36;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pre-generate star positions (deterministic)
const STARS = Array.from({ length: 220 }, (_, i) => ({
  x: ((i * 2971 + 13) % WORLD_W),
  y: ((i * 1637 + 7) % 2200),   // top part of world
  r: 0.6 + (i % 4) * 0.35,
  twinkle: (i % 7) * 0.9,
}));

export default function GameCanvas({
  playerName, sessionId, character, isTeacher,
}: {
  playerName: string;
  sessionId: string;
  character: CharacterDef;
  isTeacher: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: {
      x: WORLD_W / 2 - PW / 2,
      worldY: WORLD_H - 150,
      vx: 0, vy: 0, onGround: false, facingLeft: false,
    } as Player,
    energy: isTeacher ? 999 : 100,
    cam: { x: 0, y: WORLD_H - CANVAS_H } as Cam,
    platforms: [] as Platform[],
    keys: {} as Record<string, boolean>,
    checkpointY: WORLD_H - 150,
    checkpointX: WORLD_W / 2 - PW / 2,
    questionOpen: false,
    zone: 0,
    stats: { correct: 0, total: 0 } as GameStats,
    questionQueue: [] as Question[],
    frame: 0,
    otherPlayers: [] as PlayerRow[],
  });
  const animRef = useRef<number>(0);
  const lastSyncRef = useRef(0);

  const [questionModal, setQuestionModal] = useState<Question | null>(null);
  const [answered, setAnswered] = useState<null | "correct" | "wrong">(null);
  const [explanation, setExplanation] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [energy, setEnergy] = useState(isTeacher ? 100 : 100);
  const [zone, setZone] = useState(0);
  const [height, setHeight] = useState(0);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [leaderboard, setLeaderboard] = useState<PlayerRow[]>([]);

  // Init
  useEffect(() => {
    stateRef.current.platforms = generatePlatforms();
    stateRef.current.questionQueue = shuffle(QUESTIONS);

    const channel = supabase
      .channel("lb_" + sessionId)
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    fetchLeaderboard();
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("height", { ascending: false })
      .limit(15);
    if (data) {
      setLeaderboard(data as PlayerRow[]);
      stateRef.current.otherPlayers = (data as PlayerRow[]).filter(p => p.id !== sessionId);
    }
  }

  async function syncToSupabase() {
    const s = stateRef.current;
    const h = Math.round((WORLD_H - s.player.worldY) / 10);
    await supabase.from("players").upsert({
      id: sessionId,
      name: playerName,
      height: h,
      zone: s.zone,
      energy: Math.round(Math.min(s.energy, 100)),
      correct: s.stats.correct,
      total: s.stats.total,
      updated_at: new Date().toISOString(),
    });
  }

  const openQuestion = useCallback(() => {
    const s = stateRef.current;
    if (s.questionOpen) return;
    if (s.questionQueue.length === 0) s.questionQueue = shuffle(QUESTIONS);
    const q = s.questionQueue.shift()!;
    s.questionOpen = true;
    setQuestionModal(q);
    setAnswered(null);
    setSelectedIdx(null);
    setExplanation("");
  }, []);

  function handleAnswer(idx: number) {
    if (answered !== null || !questionModal) return;
    const s = stateRef.current;
    const correct = idx === questionModal.ans;
    setSelectedIdx(idx);
    setAnswered(correct ? "correct" : "wrong");
    setExplanation(questionModal.explanation);
    s.stats.total += 1;
    if (correct) {
      s.energy = Math.min(isTeacher ? 999 : 100, s.energy + ENERGY_REGEN_CORRECT);
      s.stats.correct += 1;
    } else {
      s.energy = Math.max(0, s.energy - ENERGY_PENALTY_WRONG);
    }
    setStats({ ...s.stats });
    setTimeout(() => {
      setQuestionModal(null);
      s.questionOpen = false;
      syncToSupabase();
    }, 3000);
  }

  function handleReturnToCheckpoint() {
    const s = stateRef.current;
    s.player.worldY = s.checkpointY;
    s.player.x = s.checkpointX;
    s.player.vx = 0;
    s.player.vy = 0;
  }

  // ── game loop ─────────────────────────────────────────────────────────────
  function loop() {
    update();
    draw();
    animRef.current = requestAnimationFrame(loop);
  }

  function update() {
    const s = stateRef.current;
    if (s.questionOpen) return;
    const p = s.player;
    s.frame++;

    const canMove = isTeacher || s.energy > 0;

    if (canMove) {
      if (s.keys["ArrowLeft"] || s.keys["a"]) {
        p.vx = -MOVE_SPEED;
        p.facingLeft = true;
        if (p.onGround && !isTeacher) s.energy = Math.max(0, s.energy - ENERGY_MOVE_COST);
      } else if (s.keys["ArrowRight"] || s.keys["d"]) {
        p.vx = MOVE_SPEED;
        p.facingLeft = false;
        if (p.onGround && !isTeacher) s.energy = Math.max(0, s.energy - ENERGY_MOVE_COST);
      } else {
        p.vx *= 0.78;
      }
      if ((s.keys["ArrowUp"] || s.keys["w"] || s.keys[" "]) && p.onGround) {
        p.vy = JUMP_FORCE;
        if (!isTeacher) s.energy = Math.max(0, s.energy - ENERGY_JUMP_COST);
        p.onGround = false;
      }
    } else {
      p.vx *= 0.6;
    }

    p.vy += GRAVITY;
    p.x += p.vx;
    p.worldY += p.vy;

    // Horizontal wrap
    if (p.x + PW < 0) p.x = WORLD_W;
    if (p.x > WORLD_W) p.x = -PW;

    // Platform collision
    p.onGround = false;
    for (const plat of s.platforms) {
      if (p.x + PW <= plat.x || p.x >= plat.x + plat.w) continue;
      const prevBottom = p.worldY + PH - p.vy;
      const curBottom = p.worldY + PH;
      if (prevBottom <= plat.y + 2 && curBottom >= plat.y && p.vy >= 0) {
        p.worldY = plat.y - PH;
        p.vy = 0;
        p.onGround = true;
        // Checkpoint detection
        for (let ci = 0; ci < CHECKPOINTS.length; ci++) {
          if (Math.abs(plat.y - CHECKPOINTS[ci]) < 80 && plat.y < s.checkpointY) {
            s.checkpointY = plat.y;
            s.checkpointX = plat.x + plat.w / 2 - PW / 2;
          }
        }
        break;
      }
    }

    // Fell off world
    if (p.worldY > WORLD_H + 300) {
      p.worldY = s.checkpointY;
      p.x = s.checkpointX;
      p.vx = 0; p.vy = 0;
      if (!isTeacher) s.energy = Math.max(0, s.energy - 12);
    }

    // Smooth camera — follows player both axes
    const targetCamX = p.x + PW / 2 - CANVAS_W / 2;
    const targetCamY = p.worldY + PH / 2 - CANVAS_H * 0.55;
    s.cam.x += (Math.max(0, Math.min(WORLD_W - CANVAS_W, targetCamX)) - s.cam.x) * 0.1;
    s.cam.y += (Math.max(0, Math.min(WORLD_H - CANVAS_H, targetCamY)) - s.cam.y) * 0.1;

    const newZone = getZone(p.worldY);
    if (newZone !== s.zone) { s.zone = newZone; setZone(newZone); }

    setEnergy(Math.min(100, Math.round(s.energy)));
    setHeight(Math.round((WORLD_H - p.worldY) / 10));

    const now = Date.now();
    if (now - lastSyncRef.current > 2000) {
      lastSyncRef.current = now;
      syncToSupabase();
    }
  }

  // ── drawing ───────────────────────────────────────────────────────────────
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    const { cam, player: p, frame } = s;

    // --- Background sky (smooth gradient) ---
    const midWorldY = cam.y + CANVAS_H / 2;
    const sky = getSkyColors(midWorldY);
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, sky.top);
    grad.addColorStop(1, sky.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars (visible in mountain+ zones, fully visible in space)
    const starAlpha = Math.max(0, Math.min(1, (2400 - midWorldY) / 1000));
    if (starAlpha > 0.01) {
      ctx.fillStyle = "#ffffff";
      for (const star of STARS) {
        const sx = ((star.x - cam.x * 0.08) % WORLD_W + WORLD_W) % WORLD_W;
        const sy = star.y - cam.y * 0.04;
        if (sy < -10 || sy > CANVAS_H + 10) continue;
        const twinkle = starAlpha * (0.5 + 0.5 * Math.sin(frame * 0.04 + star.twinkle));
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Parallax clouds/mountains in background
    drawParallaxBg(ctx, cam, midWorldY, frame);

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // Draw platforms
    for (const plat of s.platforms) {
      if (plat.y > cam.y + CANVAS_H + 40 || plat.y < cam.y - 40) continue;
      if (plat.x + plat.w < cam.x - 20 || plat.x > cam.x + CANVAS_W + 20) continue;
      drawPlatform(ctx, plat, frame);
    }

    // Checkpoint flags
    for (let ci = 0; ci < CHECKPOINTS.length; ci++) {
      const cy = CHECKPOINTS[ci];
      if (cy < cam.y - 60 || cy > cam.y + CANVAS_H + 20) continue;
      drawCheckpointFlag(ctx, cy, s.checkpointY);
    }

    // Other players (ghosted)
    for (const other of s.otherPlayers) {
      const oy = WORLD_H - other.height * 10;
      const ox = WORLD_W / 2; // approximate, we don't track x of others
      if (oy < cam.y - 80 || oy > cam.y + CANVAS_H + 40) continue;
      ctx.globalAlpha = 0.45;
      drawCharacter(ctx, character, ox, oy, PW, PH, other.name, false);
      ctx.globalAlpha = 1;
    }

    // Draw player
    drawCharacter(ctx, character, p.x, p.worldY, PW, PH, playerName, p.facingLeft);

    // Teacher sparkle
    if (isTeacher) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x + PW / 2, p.worldY + PH / 2, PW * 0.8 + Math.sin(frame * 0.1) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Low energy overlay
    if (!isTeacher && s.energy <= 0) {
      ctx.fillStyle = "rgba(226,75,74,0.13)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#E24B4A";
      ctx.font = "500 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sin energía — presiona Q para responder una pregunta", CANVAS_W / 2, CANVAS_H - 24);
    }

    // Zone transition text (fades in/out)
    // (omitted for brevity — zone shown in HUD)
  }

  function drawParallaxBg(ctx: CanvasRenderingContext2D, cam: Cam, midY: number, frame: number) {
    const zi = getZone(midY);

    if (zi === 0) {
      // Beach: distant water horizon
      const wy = WORLD_H - cam.y - 60;
      if (wy > 0 && wy < CANVAS_H) {
        ctx.fillStyle = "#4a90d9";
        ctx.fillRect(0, wy, CANVAS_W, CANVAS_H - wy);
        // Wave shimmer
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        for (let wx = 0; wx < CANVAS_W; wx += 60) {
          const waveY = wy + 10 + Math.sin((wx + frame) * 0.05) * 4;
          ctx.fillRect(wx, waveY, 40, 3);
        }
      }
      // Distant palm silhouettes
      ctx.fillStyle = "rgba(30,60,20,0.25)";
      for (let px = 0; px < CANVAS_W; px += 280) {
        const py = WORLD_H - cam.y - 80 - ((px * 13) % 40);
        if (py < CANVAS_H) {
          ctx.fillRect(px + 40, py, 8, 50);
          ctx.beginPath();
          ctx.ellipse(px + 44, py, 30, 14, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (zi === 1) {
      // Meadow: rolling hills silhouette
      ctx.fillStyle = "rgba(50,100,40,0.2)";
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_H);
      for (let hx = 0; hx <= CANVAS_W; hx += 20) {
        const hy = CANVAS_H * 0.7 + Math.sin((hx + cam.x * 0.3) * 0.007) * 60;
        ctx.lineTo(hx, hy);
      }
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.closePath();
      ctx.fill();
    }

    if (zi === 2) {
      // Mountain: distant peaks
      ctx.fillStyle = "rgba(100,90,120,0.25)";
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_H);
      const peaks = [80, 200, 380, 520, 680, 820, 960];
      const heights = [0.45, 0.25, 0.35, 0.2, 0.3, 0.4, 0.28];
      for (let i = 0; i < peaks.length; i++) {
        const px = peaks[i] - (cam.x * 0.15) % 200;
        ctx.lineTo(px - 80, CANVAS_H * 0.85);
        ctx.lineTo(px, CANVAS_H * heights[i]);
        ctx.lineTo(px + 80, CANVAS_H * 0.85);
      }
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.closePath();
      ctx.fill();
    }

    if (zi >= 3) {
      // Sky/space: aurora / nebula streaks
      const alpha = Math.min(1, (zi - 2) * 0.4) * 0.12;
      ctx.fillStyle = `rgba(100,0,200,${alpha})`;
      for (let ai = 0; ai < 3; ai++) {
        const ax = ((ai * 300 + cam.x * 0.05) % CANVAS_W);
        ctx.beginPath();
        ctx.ellipse(ax, CANVAS_H * 0.3 + ai * 80, 180, 30, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, frame: number) {
    const z = ZONES[plat.zone];
    const col = z.platColors[plat.type === "narrow" ? 1 : plat.type === "wide" ? 2 : 0];

    if (plat.zone === 0) {
      // Beach: sandy with grain
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect?.(plat.x, plat.y, plat.w, plat.h, 3);
      ctx.fill();
      ctx.fillStyle = "#f5deb3";
      ctx.fillRect(plat.x + 2, plat.y, plat.w - 4, 5);
      // Grain dots
      ctx.fillStyle = "rgba(160,120,50,0.3)";
      for (let gx = plat.x + 6; gx < plat.x + plat.w - 4; gx += 10) {
        ctx.beginPath();
        ctx.arc(gx, plat.y + 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (plat.zone === 1) {
      // Meadow: dirt body, thick grass top
      ctx.fillStyle = "#8B6914";
      ctx.fillRect(plat.x, plat.y + 6, plat.w, plat.h - 6);
      ctx.fillStyle = "#5a8a3c";
      ctx.fillRect(plat.x, plat.y, plat.w, 8);
      // Grass blades
      ctx.fillStyle = "#4a7a2c";
      for (let gx = plat.x + 3; gx < plat.x + plat.w - 2; gx += 7) {
        ctx.fillRect(gx, plat.y - 5, 2, 6);
        ctx.fillRect(gx + 3, plat.y - 4, 2, 5);
      }
      // Flowers (on wide platforms)
      if (plat.w > 120) {
        for (let fx = plat.x + 20; fx < plat.x + plat.w - 20; fx += 40) {
          ctx.fillStyle = "#FFD700";
          ctx.beginPath();
          ctx.arc(fx, plat.y - 8, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

    } else if (plat.zone === 2) {
      // Mountain: rocky with crack lines
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect?.(plat.x, plat.y, plat.w, plat.h, 2);
      ctx.fill();
      ctx.fillStyle = "#aaaaaa";
      ctx.fillRect(plat.x + 2, plat.y, plat.w - 4, 4);
      // Snow cap on wide
      if (plat.w > 90) {
        ctx.fillStyle = "rgba(230,240,255,0.9)";
        ctx.beginPath();
        ctx.ellipse(plat.x + plat.w / 2, plat.y + 1, plat.w * 0.32, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Crack
      ctx.strokeStyle = "rgba(80,80,80,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plat.x + plat.w * 0.4, plat.y + 3);
      ctx.lineTo(plat.x + plat.w * 0.45, plat.y + plat.h);
      ctx.stroke();

    } else if (plat.zone === 3) {
      // Sky: fluffy cloud
      const cx = plat.x + plat.w / 2;
      const cy = plat.y + plat.h / 2;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, plat.w / 2, plat.h * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.ellipse(cx - plat.w * 0.22, cy, plat.w * 0.24, plat.h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + plat.w * 0.22, cy - 1, plat.w * 0.22, plat.h * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      // Soft shadow below
      ctx.fillStyle = "rgba(180,200,240,0.3)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + plat.h * 0.5, plat.w * 0.4, 4, 0, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Space: metallic asteroid
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect?.(plat.x, plat.y, plat.w, plat.h, 5);
      ctx.fill();
      // Shimmer
      ctx.fillStyle = "rgba(150,150,255,0.3)";
      ctx.fillRect(plat.x + 4, plat.y + 2, plat.w - 8, 3);
      // Crater
      ctx.fillStyle = "rgba(20,20,60,0.35)";
      ctx.beginPath();
      ctx.arc(plat.x + plat.w * 0.3, plat.y + plat.h / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCheckpointFlag(ctx: CanvasRenderingContext2D, cy: number, activeCheckpoint: number) {
    const reached = cy >= activeCheckpoint - 10;
    const flagColor = reached ? "#5DCAA5" : "#FFD700";
    ctx.strokeStyle = reached ? "#5DCAA5" : "#FFD70088";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, cy - PH);
    ctx.lineTo(WORLD_W, cy - PH);
    ctx.stroke();
    ctx.setLineDash([]);
    // Flag icon at left edge
    ctx.fillStyle = flagColor;
    ctx.fillRect(30, cy - PH - 14, 3, 14);
    ctx.beginPath();
    ctx.moveTo(33, cy - PH - 14);
    ctx.lineTo(46, cy - PH - 8);
    ctx.lineTo(33, cy - PH - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = reached ? "#085041" : "#633806";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(reached ? "★ checkpoint" : "checkpoint", 50, cy - PH - 5);
  }

  // Keyboard
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true;
      if (e.key === " " || e.key === "ArrowUp") e.preventDefault();
      if ((e.key === "q" || e.key === "Q") && !stateRef.current.questionOpen) openQuestion();
      if (e.key === "r" || e.key === "R") handleReturnToCheckpoint();
    };
    const onUp = (e: KeyboardEvent) => { stateRef.current.keys[e.key] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [openQuestion]);

  const pct = Math.min(100, energy);
  const energyColor = pct > 50 ? "#5DCAA5" : pct > 20 ? "#EF9F27" : "#E24B4A";
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const maxHeight = Math.round(WORLD_H / 10);
  const heightPct = Math.min(100, (height / maxHeight) * 100);
  const zoneColors = ["#f0d090","#7caf52","#888","#d6ecff","#3a3a7a"];
  const zoneEmoji = ["🏖️","🌿","⛰️","☁️","🚀"];

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {/* Game column */}
      <div style={{ flex: "0 0 auto" }}>
        {/* HUD */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            {isTeacher ? (
              <span style={{ fontWeight: 500, color: "#FFD700" }}>Profesor — energía ilimitada</span>
            ) : (
              <>
                <span style={{ color: "var(--color-text-secondary)" }}>Energía</span>
                <div style={{ width: 110, height: 7, background: "var(--color-background-secondary)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: energyColor, transition: "width .3s,background .3s", borderRadius: 4 }} />
                </div>
                <span style={{ fontWeight: 500, minWidth: 30, color: "var(--color-text-primary)" }}>{pct}%</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "4px 10px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: zoneColors[zone], flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{ZONES[zone]?.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1 }}>{height}</span>
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>m / {maxHeight}m</span>
            </div>
          </div>
        </div>

        {/* Question panel */}
        {questionModal && (
          <div style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-lg)",
            padding: "1rem 1.25rem",
            marginBottom: 8,
            width: CANVAS_W,
          }}>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {questionModal.article}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-primary)", marginBottom: 12, lineHeight: 1.6 }}>
              {questionModal.q}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {questionModal.opts.map((opt, i) => {
                let bg = "var(--color-background-primary)";
                let border = "var(--color-border-secondary)";
                let col = "var(--color-text-secondary)";
                if (answered !== null) {
                  if (i === questionModal.ans) { bg = "#E1F5EE"; border = "#5DCAA5"; col = "#085041"; }
                  else if (i === selectedIdx && answered === "wrong") { bg = "#FCEBEB"; border = "#F09595"; col = "#791F1F"; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={answered !== null}
                    style={{ padding: "8px 10px", fontSize: 12, border: `0.5px solid ${border}`, borderRadius: "var(--border-radius-md)", background: bg, cursor: answered ? "default" : "pointer", color: col, textAlign: "left", lineHeight: 1.45, transition: "all .12s" }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div style={{ marginTop: 10, fontSize: 12, padding: "6px 10px", borderRadius: "var(--border-radius-md)", background: answered === "correct" ? "#E1F5EE" : "#FCEBEB", color: answered === "correct" ? "#085041" : "#791F1F", lineHeight: 1.5 }}>
                {explanation}
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          style={{ display: "block", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)" }} />

        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={openQuestion}
            style={{ flex: 1, padding: "8px 0", fontSize: 12, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", cursor: "pointer", color: "var(--color-text-primary)" }}>
            Q — Responder pregunta
          </button>
          <button onClick={handleReturnToCheckpoint}
            style={{ flex: 1, padding: "8px 0", fontSize: 12, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", cursor: "pointer", color: "var(--color-text-secondary)" }}>
            R — Volver al checkpoint
          </button>
        </div>
        <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 4 }}>
          A/D o ← → mover · W o Espacio saltar · Q pregunta · R checkpoint
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>

        {/* ── HEIGHT TOWER ── */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10 }}>Altura actual</div>
          <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>

            {/* Vertical tower bar */}
            <div style={{ position: "relative", width: 18, flexShrink: 0 }}>
              {/* Zone segments (bottom to top) */}
              <div style={{ position: "absolute", inset: 0, borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column-reverse" }}>
                {ZONES.map((z, i) => (
                  <div key={z.name} style={{ flex: 1, background: zoneColors[i], opacity: i < zone ? 1 : i === zone ? 0.85 : 0.2 }} />
                ))}
              </div>
              {/* Player dot */}
              <div style={{
                position: "absolute",
                left: "50%", transform: "translateX(-50%)",
                bottom: `calc(${heightPct}% - 5px)`,
                width: 12, height: 12,
                borderRadius: "50%",
                background: "#7F77DD",
                border: "2px solid white",
                boxShadow: "0 0 0 1px #534AB7",
                transition: "bottom .4s ease",
                zIndex: 2,
              }} />
              {/* Leaderboard dots for other players */}
              {leaderboard.filter(r => r.id !== sessionId).map(r => {
                const rPct = Math.min(100, (r.height / maxHeight) * 100);
                return (
                  <div key={r.id} style={{
                    position: "absolute",
                    left: "50%", transform: "translateX(-50%)",
                    bottom: `calc(${rPct}% - 4px)`,
                    width: 8, height: 8,
                    borderRadius: "50%",
                    background: "#E24B4A",
                    opacity: 0.7,
                    transition: "bottom .8s ease",
                    zIndex: 1,
                  }} />
                );
              })}
            </div>

            {/* Zone labels + checkpoint markers */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column-reverse", gap: 0 }}>
              {ZONES.map((z, i) => {
                const active = i === zone;
                const passed = i > zone;
                return (
                  <div key={z.name} style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 6,
                    borderLeft: `2px solid ${active ? zoneColors[i] : "var(--color-border-tertiary)"}`,
                    paddingLeft: 8,
                    opacity: i < zone ? 0.35 : 1,
                    minHeight: 28,
                  }}>
                    <span style={{ fontSize: 13 }}>{zoneEmoji[i]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: active ? 500 : 400, color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                        {z.name}
                        {passed && <span style={{ marginLeft: 5, color: "#5DCAA5", fontSize: 10 }}>✓</span>}
                        {active && <span style={{ marginLeft: 5, fontSize: 9, background: "#EEEDFE", color: "#534AB7", padding: "1px 5px", borderRadius: 6 }}>aquí</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Height numbers */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
            <div>
              <span style={{ fontSize: 26, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1 }}>{height}</span>
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: 3 }}>m</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>de {maxHeight}m</span>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 6, height: 4, background: "var(--color-background-secondary)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${heightPct}%`, height: "100%", background: zoneColors[zone], transition: "width .4s", borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 3, textAlign: "right" }}>
            {heightPct.toFixed(1)}% completado
          </div>
        </div>

        {/* Stats */}
        {!isTeacher && (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8 }}>Estadísticas</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Correctas", val: stats.correct, c: "#085041", bg: "#E1F5EE" },
                { label: "Total", val: stats.total, c: "var(--color-text-primary)", bg: "var(--color-background-secondary)" },
                { label: "Precisión", val: `${accuracy}%`, c: accuracy >= 70 ? "#085041" : accuracy >= 40 ? "#633806" : "#791F1F", bg: accuracy >= 70 ? "#E1F5EE" : accuracy >= 40 ? "#FAEEDA" : "#FCEBEB" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: "var(--border-radius-md)", padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: s.c }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8 }}>Tabla de posiciones</div>
          {leaderboard.length === 0 && <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Esperando jugadores...</div>}
          {leaderboard.map((row, i) => {
            const rowPct = Math.min(100, (row.height / maxHeight) * 100);
            const isMe = row.id === sessionId;
            return (
              <div key={row.id} style={{
                padding: "5px 0",
                borderBottom: i < leaderboard.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                    <span style={{ color: i === 0 ? "#BA7517" : i === 1 ? "#5F5E5A" : i === 2 ? "#993C1D" : "var(--color-text-tertiary)", fontWeight: 500, minWidth: 16 }}>{i + 1}.</span>
                    <span style={{ color: isMe ? "#3C3489" : "var(--color-text-primary)", fontWeight: isMe ? 500 : 400 }}>
                      {row.name}{isMe ? " ★" : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11 }}>
                    <span style={{ color: "var(--color-text-tertiary)" }}>{ZONES[Math.min(row.zone ?? 0, 4)]?.name}</span>
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{row.height}m</span>
                    <span style={{ color: "#085041" }}>{row.total > 0 ? `${Math.round((row.correct / row.total) * 100)}%` : "—"}</span>
                  </div>
                </div>
                {/* Mini progress bar per player */}
                <div style={{ height: 3, background: "var(--color-background-secondary)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${rowPct}%`, height: "100%", background: isMe ? "#7F77DD" : "#E24B4A", borderRadius: 2, opacity: isMe ? 1 : 0.6, transition: "width .8s" }} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
