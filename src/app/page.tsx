"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import CharacterSelector from "@/components/CharacterSelector";
import { CharacterDef } from "@/lib/characters";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), { ssr: false });
const TeacherPanel = dynamic(() => import("@/components/TeacherPanel"), { ssr: false });

type Role = "student" | "teacher";
type Stage = "role" | "name" | "character" | "playing" | "teacher_panel";

function generateId() { return Math.random().toString(36).slice(2, 10); }

export default function Home() {
  const [stage, setStage] = useState<Stage>("role");
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [character, setCharacter] = useState<CharacterDef | null>(null);
  const [sessionId] = useState(generateId);

  // ── Role selection ────────────────────────────────────────────────────────
  if (stage === "role") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 52, lineHeight: 1.1, marginBottom: 8 }}>🧠</div>
            <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 6 }}>ToM Runner</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              Escala desde la playa hasta el espacio aprendiendo sobre Teoría de la Mente.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => { setRole("student"); setStage("name"); }}
              style={{ padding: "20px 16px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", background: "var(--color-background-primary)", cursor: "pointer", textAlign: "center", transition: "all .12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-background-secondary)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--color-background-primary)")}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎮</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>Soy estudiante</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Escalar, competir y responder preguntas</div>
            </button>

            <button onClick={() => { setRole("teacher"); setStage("name"); }}
              style={{ padding: "20px 16px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", background: "var(--color-background-primary)", cursor: "pointer", textAlign: "center", transition: "all .12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-background-secondary)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--color-background-primary)")}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>Soy profesor</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Panel de monitoreo en tiempo real</div>
            </button>
          </div>

          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Controles del juego</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, fontSize: 11, color: "var(--color-text-tertiary)" }}>
              <span>A / ← → / D — mover</span>
              <span>W / Espacio — saltar</span>
              <span>Q — abrir pregunta</span>
              <span>R — volver al checkpoint</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Name entry ────────────────────────────────────────────────────────────
  if (stage === "name") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 400, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "2rem" }}>
          <button onClick={() => setStage("role")} style={{ fontSize: 12, color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>← Volver</button>
          <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>
            {role === "teacher" ? "Ingresa como profesor" : "¿Cómo te llamas?"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
            {role === "teacher"
              ? "Tu nombre aparecerá en el panel de monitoreo."
              : "Tu nombre aparecerá en la tabla de posiciones de todos."}
          </p>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && name.trim()) setStage(role === "teacher" ? "teacher_panel" : "character"); }}
            placeholder={role === "teacher" ? "Nombre del profesor..." : "Tu nombre..."}
            maxLength={20} autoFocus
            style={{ width: "100%", padding: "9px 12px", fontSize: 14, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", marginBottom: 12 }}
          />
          <button
            onClick={() => name.trim() && setStage(role === "teacher" ? "teacher_panel" : "character")}
            disabled={!name.trim()}
            style={{ width: "100%", padding: "10px 0", fontSize: 14, background: name.trim() ? "#534AB7" : "var(--color-background-secondary)", color: name.trim() ? "#fff" : "var(--color-text-tertiary)", border: "none", borderRadius: "var(--border-radius-md)", cursor: name.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
            {role === "teacher" ? "Entrar al panel →" : "Siguiente →"}
          </button>
        </div>
      </main>
    );
  }

  // ── Character selection (students only) ───────────────────────────────────
  if (stage === "character") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 680, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "2rem" }}>
          <button onClick={() => setStage("name")} style={{ fontSize: 12, color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>← Volver</button>
          <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Elige tu personaje</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20 }}>Hola, <strong>{name}</strong>. ¿Con quién vas a escalar?</p>
          <CharacterSelector onSelect={char => { setCharacter(char); setStage("playing"); }} />
        </div>
      </main>
    );
  }

  // ── Teacher panel ─────────────────────────────────────────────────────────
  if (stage === "teacher_panel") {
    return (
      <main style={{ padding: "1.5rem 2rem", minHeight: "100vh" }}>
        <TeacherPanel teacherName={name} />
      </main>
    );
  }

  // ── Game ──────────────────────────────────────────────────────────────────
  if (stage === "playing" && character) {
    return (
      <main style={{ padding: "1rem 1.5rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 500 }}>ToM Runner</span>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: 10 }}>
              jugando como <strong>{name}</strong> · personaje: <strong>{character.name}</strong>
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Teoría de la Mente · Psicología</span>
        </div>
        <GameCanvas playerName={name} sessionId={sessionId} character={character} isTeacher={false} />
      </main>
    );
  }

  return null;
}
