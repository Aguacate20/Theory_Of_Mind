"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { CharacterDef, drawCharacter } from "@/lib/characters";
import { ARTIFACTS, Artifact, MAP_NODES, ArtifactNode } from "@/lib/learn/artifacts";
import { ROOMS, LEARN_W, LEARN_H, VIEW_W, VIEW_H, PLAYER_SPEED, PLAYER_SIZE, Room } from "@/lib/learn/worldConstants";
import { supabase } from "@/lib/supabase";
import ConceptMap from "./ConceptMap";
import ArtifactModal from "./ArtifactModal";

type Vec = { x: number; y: number };
type OtherPlayer = { id: string; name: string; x: number; y: number; group: number };
type DepositedArtifact = { id: string; depositedBy: string; node: ArtifactNode; relation?: string };

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
    pos: { x: LEARN_W / 2, y: LEARN_H - 180 } as Vec,
    cam: { x: 0, y: 0 } as Vec,
    keys: {} as Record<string, boolean>,
    carried: null as string | null,       // artifact id being carried
    otherPlayers: [] as OtherPlayer[],
    frame: 0,
  });
  const animRef = useRef(0);
  const lastSyncRef = useRef(0);

  const [nearArtifact, setNearArtifact] = useState<Artifact | null>(null);
  const [nearDeposit, setNearDeposit] = useState(false);
  const [modalArtifact, setModalArtifact] = useState<Artifact | null>(null);
  const [carriedId, setCarriedId] = useState<string | null>(null);
  const [deposited, setDeposited] = useState<DepositedArtifact[]>([]);
  const [showMap, setShowMap] = useState(false);

  // Load deposited artifacts from supabase
  useEffect(() => {
    fetchDeposited();
    const channel = supabase.channel("learn_world")
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

  // ── Game loop ─────────────────────────────────────────────────────────────
  function loop() {
    update();
    draw();
    animRef.current = requestAnimationFrame(loop);
  }

  function update() {
    const s = stateRef.current;
    s.frame++;
    let dx = 0, dy = 0;
    if (s.keys["ArrowLeft"]  || s.keys["a"]) dx -= PLAYER_SPEED;
    if (s.keys["ArrowRight"] || s.keys["d"]) dx += PLAYER_SPEED;
    if (s.keys["ArrowUp"]    || s.keys["w"]) dy -= PLAYER_SPEED;
    if (s.keys["ArrowDown"]  || s.keys["s"]) dy += PLAYER_SPEED;

    // Normalize diagonal
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }

    const nx = Math.max(PLAYER_SIZE, Math.min(LEARN_W - PLAYER_SIZE, s.pos.x + dx));
    const ny = Math.max(PLAYER_SIZE, Math.min(LEARN_H - PLAYER_SIZE, s.pos.y + dy));

    // Wall collision — only move into rooms or corridors
    if (!isBlocked(nx, s.pos.y)) s.pos.x = nx;
    if (!isBlocked(s.pos.x, ny)) s.pos.y = ny;

    // Smooth camera
    s.cam.x += (Math.max(0, Math.min(LEARN_W - VIEW_W, s.pos.x - VIEW_W / 2)) - s.cam.x) * 0.12;
    s.cam.y += (Math.max(0, Math.min(LEARN_H - VIEW_H, s.pos.y - VIEW_H / 2)) - s.cam.y) * 0.12;

    // Proximity detection
    const carried = s.carried;
    let nearArt: Artifact | null = null;
    if (!carried) {
      for (const art of ARTIFACTS) {
        if (deposited.find(d => d.id === art.id)) continue;
        const wp = getArtWorldPos(art);
        const dist = Math.hypot(s.pos.x - wp.x, s.pos.y - wp.y);
        if (dist < 55) { nearArt = art; break; }
      }
    }
    setNearArtifact(nearArt);

    // Near deposit zone (center room)
    const centro = ROOMS.find(r => r.id === "centro")!;
    const inCentro = Math.abs(s.pos.x - centro.x) < 200 && Math.abs(s.pos.y - centro.y) < 200;
    setNearDeposit(!!carried && inCentro);

    // Sync position
    if (Date.now() - lastSyncRef.current > 1500) {
      lastSyncRef.current = Date.now();
      supabase.from("learn_players").upsert({
        id: sessionId, name: playerName, group,
        x: Math.round(s.pos.x), y: Math.round(s.pos.y),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Collision: blocked if not inside any room footprint
  function isBlocked(x: number, y: number): boolean {
    // Corridors connecting rooms to center
    const corridors = [
      // South corridor
      { x1: LEARN_W/2-60, x2: LEARN_W/2+60, y1: LEARN_H/2+240, y2: LEARN_H/2+380 },
      // East corridor
      { x1: LEARN_W/2+240, x2: LEARN_W/2+400, y1: LEARN_H/2-60, y2: LEARN_H/2+60 },
      // West corridor
      { x1: LEARN_W/2-400, x2: LEARN_W/2-240, y1: LEARN_H/2-60, y2: LEARN_H/2+60 },
      // North corridor
      { x1: LEARN_W/2-60, x2: LEARN_W/2+60, y1: LEARN_H/2-380, y2: LEARN_H/2-240 },
      // Entrance corridor
      { x1: LEARN_W/2-60, x2: LEARN_W/2+60, y1: LEARN_H-340, y2: LEARN_H/2+380 },
    ];
    for (const c of corridors) {
      if (x >= c.x1 && x <= c.x2 && y >= c.y1 && y <= c.y2) return false;
    }
    for (const room of ROOMS) {
      const hw = room.w / 2, hh = room.h / 2;
      if (x >= room.x - hw && x <= room.x + hw && y >= room.y - hh && y <= room.y + hh) return false;
    }
    return true;
  }

  function getArtWorldPos(art: Artifact): Vec {
    const room = ROOMS.find(r => r.id === art.room)!;
    const offsets: Record<string, Vec> = {
      tt_01: { x:-140,y:-80 }, tt_02: { x:60,y:-100 }, tt_03: { x:-60,y:80 },
      tt_04: { x:140,y:60 }, tt_05: { x:0,y:0 },
      sim_01:{ x:-120,y:-100 }, sim_02:{ x:80,y:-80 }, sim_03:{ x:-80,y:80 },
      int_01:{ x:120,y:60 }, int_02:{ x:0,y:-20 }, int_03:{ x:0,y:120 },
      mod_01:{ x:-100,y:-100 }, mod_02:{ x:100,y:-60 }, mod_03:{ x:0,y:100 },
      neu_01:{ x:-120,y:-60 }, neu_02:{ x:100,y:-80 },
      int2_01:{ x:-60,y:80 }, int2_02:{ x:80,y:100 },
    };
    const off = offsets[art.id] ?? { x:0, y:0 };
    return { x: room.x + off.x, y: room.y + off.y };
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    const cam = s.cam;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // Draw rooms
    for (const room of ROOMS) {
      const hw = room.w/2, hh = room.h/2;
      // Floor
      ctx.fillStyle = room.floorColor;
      ctx.fillRect(room.x-hw, room.y-hh, room.w, room.h);
      // Wall border
      ctx.strokeStyle = room.wallColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(room.x-hw, room.y-hh, room.w, room.h);
      // Room label
      ctx.fillStyle = room.wallColor;
      ctx.font = "500 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(room.label, room.x, room.y - hh + 20);
    }

    // Draw corridors
    ctx.fillStyle = "#2a2a2a";
    const corridors = [
      { x: LEARN_W/2-55, y: LEARN_H/2+240, w: 110, h: 140 },
      { x: LEARN_W/2+240, y: LEARN_H/2-55, w: 160, h: 110 },
      { x: LEARN_W/2-400, y: LEARN_H/2-55, w: 160, h: 110 },
      { x: LEARN_W/2-55, y: LEARN_H/2-380, w: 110, h: 140 },
      { x: LEARN_W/2-55, y: LEARN_H-340, w: 110, h: 300 },
    ];
    for (const c of corridors) ctx.fillRect(c.x, c.y, c.w, c.h);
    // Corridor floor tone
    ctx.fillStyle = "#333";
    for (const c of corridors) ctx.fillRect(c.x+8, c.y+8, c.w-16, c.h-16);

    // Draw deposit zone in centro
    const centro = ROOMS.find(r => r.id === "centro")!;
    ctx.fillStyle = "rgba(83,74,183,0.2)";
    ctx.beginPath();
    ctx.arc(centro.x, centro.y, 80, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = "#7F77DD";
    ctx.lineWidth = 2;
    ctx.setLineDash([8,6]);
    ctx.beginPath();
    ctx.arc(centro.x, centro.y, 80, 0, Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#534AB7";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("zona de depósito", centro.x, centro.y + 100);

    // Draw artifacts
    for (const art of ARTIFACTS) {
      const isDeposited = !!deposited.find(d => d.id === art.id);
      const isCarried = s.carried === art.id;
      if (isDeposited || isCarried) continue;
      const wp = getArtWorldPos(art);
      const isNear = nearArtifact?.id === art.id;
      const isPrimary = art.primaryGroup === group;

      // Glow for primary group
      if (isPrimary) {
        ctx.fillStyle = art.color + "33";
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 28 + Math.sin(s.frame * 0.08) * 3, 0, Math.PI*2);
        ctx.fill();
      }

      // Artifact body
      ctx.fillStyle = isNear ? art.color : art.color + "bb";
      ctx.strokeStyle = isNear ? "#fff" : art.color;
      ctx.lineWidth = isNear ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect?.(wp.x-16, wp.y-16, 32, 32, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(art.icon, wp.x, wp.y + 5);

      // Near indicator
      if (isNear) {
        ctx.fillStyle = "#fff";
        ctx.font = "10px sans-serif";
        ctx.fillText("E — recoger", wp.x, wp.y - 24);
      }

      // Primary group star
      if (isPrimary) {
        ctx.fillStyle = "#FFD700";
        ctx.font = "10px sans-serif";
        ctx.fillText("★ tu lectura", wp.x, wp.y + 30);
      }
    }

    // Deposited artifacts (shown as glowing orbs in centro)
    deposited.forEach((dep, i) => {
      const art = ARTIFACTS.find(a => a.id === dep.id);
      if (!art) return;
      const angle = (i / deposited.length) * Math.PI * 2;
      const r2 = 50;
      const ox = centro.x + Math.cos(angle) * r2;
      const oy = centro.y + Math.sin(angle) * r2;
      ctx.fillStyle = art.color;
      ctx.beginPath();
      ctx.arc(ox, oy, 10, 0, Math.PI*2);
      ctx.fill();
    });

    // Other players
    for (const op of s.otherPlayers) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = op.group === 1 ? "#7F77DD" : op.group === 2 ? "#1D9E75" : "#EF9F27";
      ctx.beginPath();
      ctx.arc(op.x, op.y, PLAYER_SIZE/2, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(op.name.slice(0,8), op.x, op.y - PLAYER_SIZE/2 - 4);
    }

    // Local player
    drawCharacter(ctx, character, s.pos.x - PLAYER_SIZE/2, s.pos.y - PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE*1.4, playerName);

    // Carried artifact indicator above player
    if (s.carried) {
      const art = ARTIFACTS.find(a => a.id === s.carried);
      if (art) {
        ctx.fillStyle = art.color;
        ctx.beginPath();
        ctx.arc(s.pos.x, s.pos.y - PLAYER_SIZE - 18, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(art.icon, s.pos.x, s.pos.y - PLAYER_SIZE - 15);
      }
    }

    ctx.restore();
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
      id: artifactId,
      node,
      relation,
      deposited_by: playerName,
      group,
      deposited_at: new Date().toISOString(),
    });
    stateRef.current.carried = null;
    setCarriedId(null);
    setModalArtifact(null);
    fetchDeposited();
  }

  // Keyboard
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

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ flex: "0 0 auto" }}>
        {/* HUD */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: groupColor }} />
            <span style={{ color: "var(--color-text-secondary)" }}>Grupo: <strong style={{ color: "var(--color-text-primary)" }}>{groupLabel}</strong></span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--color-text-secondary)" }}>
            {carriedId && <span style={{ color: groupColor, fontWeight: 500 }}>Cargando artefacto</span>}
            <span>{deposited.length}/{ARTIFACTS.length} depositados</span>
          </div>
        </div>

        {/* Artifact modal */}
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
          style={{ display: "block", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)" }} />

        <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 4 }}>
          WASD / flechas — mover · E — recoger / depositar artefacto · M — mapa conceptual
        </div>

        {/* Context actions */}
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {nearArtifact && !carriedId && (
            <button onClick={pickUpArtifact}
              style={{ flex:1, padding:"7px 0", fontSize:12, border:`0.5px solid ${nearArtifact.color}`, borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", cursor:"pointer", color: nearArtifact.color, fontWeight:500 }}>
              E — Recoger "{nearArtifact.title}"
            </button>
          )}
          {carriedId && nearDeposit && (
            <button onClick={depositArtifact}
              style={{ flex:1, padding:"7px 0", fontSize:12, border:"0.5px solid #7F77DD", borderRadius:"var(--border-radius-md)", background:"#EEEDFE", cursor:"pointer", color:"#3C3489", fontWeight:500 }}>
              E — Depositar en el mapa conceptual
            </button>
          )}
          <button onClick={() => setShowMap(v => !v)}
            style={{ padding:"7px 14px", fontSize:12, border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", cursor:"pointer", color:"var(--color-text-primary)" }}>
            M — {showMap ? "Ocultar" : "Ver"} mapa
          </button>
        </div>
      </div>

      {/* Side panel */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12, minWidth:0 }}>
        {showMap ? (
          <ConceptMap deposited={deposited} />
        ) : (
          <>
            {/* Artifact list */}
            <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem" }}>
              <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:8 }}>Artefactos de tu grupo</div>
              {ARTIFACTS.filter(a => a.primaryGroup === group).map(art => {
                const dep = deposited.find(d => d.id === art.id);
                const isCarried = carriedId === art.id;
                return (
                  <div key={art.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"0.5px solid var(--color-border-tertiary)", fontSize:12 }}>
                    <div style={{ width:20, height:20, borderRadius:4, background: dep ? art.color : isCarried ? art.color+"88" : "var(--color-background-secondary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:"bold", flexShrink:0 }}>
                      {dep ? "✓" : isCarried ? art.icon : art.icon}
                    </div>
                    <span style={{ color: dep ? "var(--color-text-tertiary)" : "var(--color-text-primary)", textDecoration: dep ? "line-through" : "none" }}>{art.title}</span>
                    {dep && <span style={{ fontSize:10, color:"#5DCAA5", marginLeft:"auto" }}>depositado</span>}
                    {isCarried && <span style={{ fontSize:10, color:art.color, marginLeft:"auto" }}>cargando</span>}
                  </div>
                );
              })}
            </div>

            {/* Progress */}
            <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem" }}>
              <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:8 }}>Progreso colectivo</div>
              {[{ g:1, label:"Teoría-Teoría", color:"#7F77DD" }, { g:2, label:"Simulación", color:"#1D9E75" }, { g:3, label:"Modularidad", color:"#EF9F27" }].map(gi => {
                const total = ARTIFACTS.filter(a => a.primaryGroup === gi.g).length;
                const done = deposited.filter(d => ARTIFACTS.find(a => a.id === d.id)?.primaryGroup === gi.g).length;
                return (
                  <div key={gi.g} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                      <span style={{ color:"var(--color-text-secondary)" }}>{gi.label}</span>
                      <span style={{ color:"var(--color-text-primary)", fontWeight:500 }}>{done}/{total}</span>
                    </div>
                    <div style={{ height:5, background:"var(--color-background-secondary)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${(done/total)*100}%`, height:"100%", background:gi.color, borderRadius:3, transition:"width .5s" }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop:10, fontSize:11, color:"var(--color-text-tertiary)", textAlign:"center" }}>
                {deposited.length === ARTIFACTS.length
                  ? "🎉 ¡Mapa completo! Bonus de energía desbloqueado para ToM Runner"
                  : `${ARTIFACTS.length - deposited.length} artefactos restantes`}
              </div>
            </div>

            {/* Legend */}
            <div style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:"10px 12px" }}>
              <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:6 }}>Leyenda</div>
              <div style={{ fontSize:10, color:"var(--color-text-tertiary)", display:"flex", flexDirection:"column", gap:3 }}>
                <span>★ dorado = artefacto de tu lectura (más fácil)</span>
                <span>Halo brillante = artefacto de tu grupo</span>
                <span>Zona punteada en centro = área de depósito</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
