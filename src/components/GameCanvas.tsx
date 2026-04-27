"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  CANVAS_W, CANVAS_H, GRAVITY, JUMP_FORCE, MOVE_SPEED,
  ENERGY_MOVE_COST, ENERGY_JUMP_COST, ENERGY_REGEN_CORRECT, ENERGY_PENALTY_WRONG,
  ZONES, getZone, generatePlatforms, CHECKPOINTS, Platform,
} from "@/lib/gameConstants";
import { QUESTIONS, Question } from "@/lib/questions";
import { supabase, PlayerRow } from "@/lib/supabase";

type Player = {
  x: number; worldY: number;
  vx: number; vy: number;
  w: number; h: number;
  onGround: boolean;
};

type GameStats = { correct: number; total: number; answeredIds: Set<number> };

const PLAYER_W = 22, PLAYER_H = 28;
const WORLD_H = 6000;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GameCanvas({
  playerName, sessionId,
}: {
  playerName: string; sessionId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: { x: CANVAS_W / 2 - 11, worldY: 5860, vx: 0, vy: 0, w: PLAYER_W, h: PLAYER_H, onGround: false } as Player,
    energy: 100,
    camY: 0,
    platforms: [] as Platform[],
    keys: {} as Record<string, boolean>,
    checkpointY: 5860,
    questionOpen: false,
    gameOver: false,
    zone: 0,
    stats: { correct: 0, total: 0, answeredIds: new Set<number>() } as GameStats,
    questionQueue: [] as Question[],
  });
  const animRef = useRef<number>(0);
  const lastSyncRef = useRef(0);

  const [questionModal, setQuestionModal] = useState<Question | null>(null);
  const [answered, setAnswered] = useState<null | "correct" | "wrong">(null);
  const [explanation, setExplanation] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [energy, setEnergy] = useState(100);
  const [zone, setZone] = useState(0);
  const [height, setHeight] = useState(0);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [leaderboard, setLeaderboard] = useState<PlayerRow[]>([]);
  const [checkpoint, setCheckpoint] = useState(5860);

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    stateRef.current.platforms = generatePlatforms();
    stateRef.current.questionQueue = shuffleArray(QUESTIONS);

    // Subscribe to realtime leaderboard
    const channel = supabase
      .channel("leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    fetchLeaderboard();
    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("height", { ascending: true })
      .limit(10);
    if (data) setLeaderboard(data as PlayerRow[]);
  }

  async function syncToSupabase() {
    const s = stateRef.current;
    const worldYVal = s.player.worldY;
    const heightM = Math.round((WORLD_H - worldYVal) / 10);
    await supabase.from("players").upsert({
      id: sessionId,
      name: playerName,
      height: heightM,
      zone: s.zone,
      energy: Math.round(s.energy),
      correct: s.stats.correct,
      total: s.stats.total,
      updated_at: new Date().toISOString(),
    });
  }

  // ── question system ───────────────────────────────────────────────────────
  const openQuestion = useCallback(() => {
    const s = stateRef.current;
    if (s.questionOpen || s.gameOver) return;
    // Refill queue if exhausted
    if (s.questionQueue.length === 0) {
      s.questionQueue = shuffleArray(QUESTIONS);
    }
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
      s.energy = Math.min(100, s.energy + ENERGY_REGEN_CORRECT);
      s.stats.correct += 1;
    } else {
      s.energy = Math.max(0, s.energy - ENERGY_PENALTY_WRONG);
    }
    setStats({ correct: s.stats.correct, total: s.stats.total });
    setTimeout(() => {
      setQuestionModal(null);
      s.questionOpen = false;
      syncToSupabase();
    }, 2800);
  }

  function handleReturnToCheckpoint() {
    const s = stateRef.current;
    s.player.worldY = s.checkpointY;
    s.player.x = CANVAS_W / 2 - 11;
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
    if (s.questionOpen || s.gameOver) return;
    const p = s.player;

    // Movement
    const canMove = s.energy > 0;
    if (canMove) {
      if (s.keys["ArrowLeft"] || s.keys["a"]) {
        p.vx = -MOVE_SPEED;
        if (p.onGround) s.energy = Math.max(0, s.energy - ENERGY_MOVE_COST);
      } else if (s.keys["ArrowRight"] || s.keys["d"]) {
        p.vx = MOVE_SPEED;
        if (p.onGround) s.energy = Math.max(0, s.energy - ENERGY_MOVE_COST);
      } else {
        p.vx *= 0.75;
      }
      if ((s.keys["ArrowUp"] || s.keys["w"] || s.keys[" "]) && p.onGround) {
        p.vy = JUMP_FORCE;
        s.energy = Math.max(0, s.energy - ENERGY_JUMP_COST);
        p.onGround = false;
      }
    } else {
      p.vx *= 0.6;
    }

    p.vy += GRAVITY;
    p.x += p.vx;
    p.worldY += p.vy;

    // Wall wrap
    if (p.x < -p.w) p.x = CANVAS_W;
    if (p.x > CANVAS_W) p.x = -p.w;

    // Platform collision
    p.onGround = false;
    for (const plat of s.platforms) {
      const inX = p.x + p.w > plat.x && p.x < plat.x + plat.w;
      const wasAbove = (p.worldY + p.h - p.vy) <= plat.y + 2;
      const nowBelow = p.worldY + p.h >= plat.y;
      if (inX && wasAbove && nowBelow && p.vy >= 0) {
        p.worldY = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
        // Checkpoint update
        const cpIdx = CHECKPOINTS.findIndex(cy => Math.abs(plat.y - cy) < 60);
        if (cpIdx >= 0 && plat.y < s.checkpointY) {
          s.checkpointY = plat.y;
          setCheckpoint(plat.y);
        }
        break;
      }
    }

    // Fell below world
    if (p.worldY > WORLD_H + 200) {
      p.worldY = s.checkpointY;
      p.x = CANVAS_W / 2 - 11;
      p.vx = 0; p.vy = 0;
      s.energy = Math.max(0, s.energy - 15);
    }

    // Camera: keep player vertically centered
    const targetCamY = p.worldY - CANVAS_H * 0.6;
    s.camY += (targetCamY - s.camY) * 0.1;

    // Zone & UI sync
    const newZone = getZone(p.worldY);
    if (newZone !== s.zone) { s.zone = newZone; setZone(newZone); }
    setEnergy(Math.round(s.energy));
    setHeight(Math.round((WORLD_H - p.worldY) / 10));

    // Sync to supabase every 2s
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
    const p = s.player;
    const camY = s.camY;
    const z = ZONES[s.zone];

    // Background gradient per zone
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, z.bgTop);
    grad.addColorStop(1, z.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars in space zone
    if (s.zone >= 4) {
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 137 + 50) % CANVAS_W);
        const sy = ((i * 97 + 30) % CANVAS_H);
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8 + (i % 3) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(0, -camY);

    // Draw platforms
    for (const plat of s.platforms) {
      const screenY = plat.y - camY;
      if (screenY > CANVAS_H + 60 || screenY < -60) continue;
      drawPlatform(ctx, plat, s.zone);
    }

    // Draw checkpoints
    for (const cy of CHECKPOINTS) {
      const screenY = cy - camY;
      if (Math.abs(screenY) < CANVAS_H + 60) {
        ctx.save();
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("★ checkpoint", CANVAS_W - 8, cy - 5);
        ctx.strokeStyle = "#FFD70066";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(CANVAS_W, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // Draw player
    const pScreenY = p.worldY - camY;
    const pColor = s.energy > 20 ? "#7F77DD" : "#E24B4A";
    ctx.fillStyle = pColor;
    ctx.beginPath();
    (ctx as any).roundRect?.(p.x, pScreenY, p.w, p.h, 4) ||
      ctx.rect(p.x, pScreenY, p.w, p.h);
    ctx.fill();
    // Head
    ctx.fillStyle = "#AFA9EC";
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, pScreenY + 6, 6, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#26215C";
    ctx.fillRect(p.x + p.w / 2 - 4, pScreenY + 4, 3, 3);
    ctx.fillRect(p.x + p.w / 2 + 1, pScreenY + 4, 3, 3);
    // Name tag
    ctx.fillStyle = "#ffffffcc";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(playerName.slice(0, 10), p.x + p.w / 2, pScreenY - 5);

    ctx.restore();

    // No-energy overlay
    if (s.energy <= 0) {
      ctx.fillStyle = "rgba(226,75,74,0.15)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#F09595";
      ctx.font = "500 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sin energía — presiona Q para responder", CANVAS_W / 2, CANVAS_H / 2);
    }
  }

  function drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, currentZone: number) {
    const z = ZONES[plat.zone];
    const col = z.platformColors[plat.type === "narrow" ? 2 : plat.type === "wide" ? 0 : 1];
    ctx.fillStyle = col;

    if (plat.zone === 0) {
      // Beach: sandy with grain texture
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = "rgba(255,220,100,0.4)";
      for (let i = 0; i < plat.w; i += 8) {
        ctx.fillRect(plat.x + i, plat.y + 2, 4, 3);
      }
      // Top edge
      ctx.fillStyle = "#e8c878";
      ctx.fillRect(plat.x, plat.y, plat.w, 4);
    } else if (plat.zone === 1) {
      // Meadow: green with grass top
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = "#5a8a3c";
      ctx.fillRect(plat.x, plat.y, plat.w, 5);
      // Grass blades
      ctx.fillStyle = "#4a7a2c";
      for (let i = 2; i < plat.w - 4; i += 6) {
        ctx.fillRect(plat.x + i, plat.y - 4, 2, 5);
      }
    } else if (plat.zone === 2) {
      // Mountain: rocky gray
      ctx.fillStyle = "#777";
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = "#999";
      ctx.fillRect(plat.x, plat.y, plat.w, 3);
      // Snow caps on wide ones
      if (plat.w > 80) {
        ctx.fillStyle = "#eeeeff";
        ctx.fillRect(plat.x + plat.w * 0.2, plat.y, plat.w * 0.6, 4);
      }
    } else if (plat.zone === 3) {
      // Sky: white clouds
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.ellipse(plat.x + plat.w / 2, plat.y + plat.h / 2, plat.w / 2, plat.h * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(220,235,255,0.6)";
      ctx.beginPath();
      ctx.ellipse(plat.x + plat.w * 0.3, plat.y + plat.h * 0.3, plat.w * 0.25, plat.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Space: asteroid / metallic rock
      ctx.fillStyle = "#3a3a7a";
      ctx.beginPath();
      (ctx as any).roundRect?.(plat.x, plat.y, plat.w, plat.h, 6) ||
        ctx.rect(plat.x, plat.y, plat.w, plat.h);
      ctx.fill();
      ctx.fillStyle = "#5a5aaa";
      ctx.fillRect(plat.x + 3, plat.y + 2, plat.w - 6, 3);
    }
  }

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      stateRef.current.keys[e.key] = true;
      if (e.key === " " || e.key === "ArrowUp") e.preventDefault();
      if (e.key === "q" || e.key === "Q") openQuestion();
      if (e.key === "r" || e.key === "R") handleReturnToCheckpoint();
    }
    function onUp(e: KeyboardEvent) { stateRef.current.keys[e.key] = false; }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [openQuestion]);

  // ── render ────────────────────────────────────────────────────────────────
  const pct = energy;
  const energyColor = pct > 50 ? "#5DCAA5" : pct > 20 ? "#EF9F27" : "#E24B4A";
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", fontFamily: "var(--font-sans)" }}>
      {/* Game column */}
      <div style={{ flex: "0 0 auto" }}>
        {/* HUD */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--color-text-secondary)" }}>Energía</span>
            <div style={{ width: 100, height: 6, background: "#ddd", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: energyColor, transition: "width .3s, background .3s" }} />
            </div>
            <span style={{ fontWeight: 500, color: "var(--color-text-primary)", minWidth: 32 }}>{pct}%</span>
          </div>
          <div style={{ color: "var(--color-text-secondary)" }}>
            <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{ZONES[zone]?.name}</span>
            {" · "}
            <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{height}m</span>
          </div>
        </div>

        {/* Question modal */}
        {questionModal && (
          <div style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-lg)",
            padding: "1rem 1.25rem",
            marginBottom: 8,
            width: CANVAS_W,
          }}>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {questionModal.article}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-primary)", marginBottom: 12, lineHeight: 1.6 }}>
              {questionModal.q}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {questionModal.opts.map((opt, i) => {
                let bg = "var(--color-background-primary)";
                let border = "var(--color-border-secondary)";
                let color = "var(--color-text-secondary)";
                if (answered !== null) {
                  if (i === questionModal.ans) { bg = "#E1F5EE"; border = "#5DCAA5"; color = "#085041"; }
                  else if (i === selectedIdx && answered === "wrong") { bg = "#FCEBEB"; border = "#F09595"; color = "#791F1F"; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={answered !== null}
                    style={{ padding: "8px 10px", fontSize: 12, border: `0.5px solid ${border}`, borderRadius: "var(--border-radius-md)", background: bg, cursor: answered ? "default" : "pointer", color, textAlign: "left", lineHeight: 1.4 }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div style={{ marginTop: 10, fontSize: 12, color: answered === "correct" ? "#085041" : "#791F1F", background: answered === "correct" ? "#E1F5EE" : "#FCEBEB", borderRadius: "var(--border-radius-md)", padding: "6px 10px", lineHeight: 1.5 }}>
                {explanation}
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          style={{ display: "block", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)" }} />

        {/* Controls */}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={openQuestion}
            style={{ flex: 1, padding: "8px 0", fontSize: 12, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", cursor: "pointer", color: "var(--color-text-primary)" }}>
            Q — Responder pregunta
          </button>
          <button onClick={handleReturnToCheckpoint}
            style={{ flex: 1, padding: "8px 0", fontSize: 12, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", cursor: "pointer", color: "var(--color-text-secondary)" }}>
            R — Volver al checkpoint ★
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 4 }}>
          ← A/D mover · W/Espacio saltar · Q pregunta · R checkpoint
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Stats */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10 }}>Tus estadísticas</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Correctas", val: stats.correct, color: "#085041", bg: "#E1F5EE" },
              { label: "Total", val: stats.total, color: "var(--color-text-primary)", bg: "var(--color-background-secondary)" },
              { label: "Precisión", val: `${accuracy}%`, color: accuracy >= 70 ? "#085041" : accuracy >= 40 ? "#633806" : "#791F1F", bg: accuracy >= 70 ? "#E1F5EE" : accuracy >= 40 ? "#FAEEDA" : "#FCEBEB" },
              { label: "Altura", val: `${height}m`, color: "#3C3489", bg: "#EEEDFE" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: "var(--border-radius-md)", padding: "8px 10px" }}>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10 }}>Tabla de posiciones</div>
          {leaderboard.length === 0 && <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Esperando jugadores...</div>}
          {leaderboard.map((row, i) => (
            <div key={row.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "5px 0", borderBottom: i < leaderboard.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
              fontSize: 12,
            }}>
              <span style={{ color: i === 0 ? "#633806" : "var(--color-text-secondary)", fontWeight: i === 0 ? 500 : 400 }}>
                {i + 1}. {row.name} {row.id === sessionId ? "(tú)" : ""}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "var(--color-text-tertiary)" }}>{ZONES[Math.min(row.zone, 4)]?.name}</span>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{row.height}m</span>
                <span style={{ color: "#085041", fontSize: 11 }}>
                  {row.total > 0 ? `${Math.round((row.correct / row.total) * 100)}%` : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Zone progress */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10 }}>Zonas</div>
          {ZONES.slice().reverse().map((z, i) => {
            const zi = ZONES.length - 1 - i;
            const active = zi === zone;
            const passed = zi > zone;
            return (
              <div key={z.name} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "4px 0",
                fontSize: 12, opacity: zi < zone ? 0.4 : 1,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: active ? "#7F77DD" : passed ? "#5DCAA5" : "var(--color-border-tertiary)", flexShrink: 0 }} />
                <span style={{ color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: active ? 500 : 400 }}>{z.name}</span>
                {active && <span style={{ fontSize: 10, color: "#534AB7", background: "#EEEDFE", padding: "1px 6px", borderRadius: 8 }}>actual</span>}
                {passed && <span style={{ fontSize: 10, color: "#085041" }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
