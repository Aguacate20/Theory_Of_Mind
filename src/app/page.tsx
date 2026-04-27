"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), { ssr: false });

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Home() {
  const [name, setName] = useState("");
  const [sessionId] = useState(() => generateId());
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <main style={{ padding: "1rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 500 }}>ToM Runner</span>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: 10 }}>jugando como <strong>{name}</strong></span>
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Teoría de la Mente · Psicología</div>
        </div>
        <GameCanvas playerName={name} sessionId={sessionId} />
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "2rem",
        width: "100%",
        maxWidth: 400,
      }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>🧠</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>ToM Runner</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            Escala desde la playa hasta el espacio respondiendo preguntas sobre Teoría de la Mente. Tu energía te permite moverte — las respuestas correctas la recargan.
          </p>
        </div>

        {/* Zones preview */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: "1.5rem" }}>
          {["🏖️ Playa", "🌿 Llanura", "⛰️ Montaña", "☁️ Cielo", "🚀 Espacio"].map((z, i) => (
            <div key={i} style={{
              fontSize: 10, textAlign: "center", color: "var(--color-text-tertiary)",
              padding: "4px 2px",
            }}>{z}</div>
          ))}
        </div>

        {/* Name input */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
            Tu nombre (visible en la tabla de posiciones)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && name.trim()) setStarted(true); }}
            placeholder="Escribe tu nombre..."
            maxLength={20}
            style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}
            autoFocus
          />
        </div>

        <button
          onClick={() => name.trim() && setStarted(true)}
          disabled={!name.trim()}
          style={{
            width: "100%", padding: "10px 0", fontSize: 14,
            background: name.trim() ? "#534AB7" : "var(--color-background-secondary)",
            color: name.trim() ? "#fff" : "var(--color-text-tertiary)",
            border: "none", borderRadius: "var(--border-radius-md)", cursor: name.trim() ? "pointer" : "default",
            transition: "all .15s",
          }}>
          Comenzar a escalar →
        </button>

        <div style={{ marginTop: "1.5rem", padding: "12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Controles</div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <span>← A / D → · mover</span>
            <span>W / Espacio · saltar</span>
            <span>Q · abrir pregunta</span>
            <span>R · volver al checkpoint</span>
          </div>
        </div>
      </div>
    </main>
  );
}
