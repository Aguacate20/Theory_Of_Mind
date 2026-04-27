"use client";
import { useEffect, useState } from "react";
import { supabase, PlayerRow } from "@/lib/supabase";
import { ZONES, WORLD_H } from "@/lib/gameConstants";
import GameCanvas from "./GameCanvas";
import { CHARACTERS } from "@/lib/characters";

export default function TeacherPanel({ teacherName }: { teacherName: string }) {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [view, setView] = useState<"dashboard" | "play">("dashboard");
  const teacherId = "teacher_" + teacherName.toLowerCase().replace(/\s+/g, "_");

  useEffect(() => {
    fetchPlayers();
    const channel = supabase
      .channel("teacher_panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, fetchPlayers)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .not("id", "like", "teacher_%")
      .order("height", { ascending: false });
    if (data) setPlayers(data as PlayerRow[]);
  }

  async function clearSession() {
    if (!confirm("¿Borrar todos los datos de la sesión actual?")) return;
    await supabase.from("players").delete().not("id", "eq", "none");
    fetchPlayers();
  }

  const totalStudents = players.length;
  const avgHeight = totalStudents > 0
    ? Math.round(players.reduce((s, p) => s + p.height, 0) / totalStudents)
    : 0;
  const avgAccuracy = totalStudents > 0
    ? Math.round(players.filter(p => p.total > 0).reduce((s, p) => s + Math.round(p.correct / p.total * 100), 0) / Math.max(1, players.filter(p => p.total > 0).length))
    : 0;
  const totalAnswers = players.reduce((s, p) => s + p.total, 0);

  if (view === "play") {
    return (
      <div>
        <button onClick={() => setView("dashboard")}
          style={{ marginBottom: 12, padding: "6px 14px", fontSize: 12, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", cursor: "pointer", color: "var(--color-text-primary)" }}>
          ← Volver al panel
        </button>
        <GameCanvas
          playerName={`Prof. ${teacherName}`}
          sessionId={teacherId}
          character={CHARACTERS[2]}
          isTeacher={true}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500 }}>Panel del Profesor</h1>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Actualización en tiempo real · {totalStudents} estudiante{totalStudents !== 1 ? "s" : ""} conectado{totalStudents !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView("play")}
            style={{ padding: "8px 16px", fontSize: 12, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", cursor: "pointer", color: "var(--color-text-primary)" }}>
            Jugar con energía ilimitada
          </button>
          <button onClick={clearSession}
            style={{ padding: "8px 16px", fontSize: 12, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", cursor: "pointer", color: "#791F1F" }}>
            Limpiar sesión
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Estudiantes", val: totalStudents, bg: "#EEEDFE", c: "#3C3489" },
          { label: "Altura promedio", val: `${avgHeight}m`, bg: "#E1F5EE", c: "#085041" },
          { label: "Precisión promedio", val: `${avgAccuracy}%`, bg: "#FAEEDA", c: "#633806" },
          { label: "Total respuestas", val: totalAnswers, bg: "var(--color-background-secondary)", c: "var(--color-text-primary)" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: "var(--border-radius-lg)", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: s.c }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Zone distribution bar */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 12 }}>Distribución por zona</div>
        <div style={{ display: "flex", gap: 0, height: 28, borderRadius: 8, overflow: "hidden" }}>
          {ZONES.map((z, i) => {
            const count = players.filter(p => (p.zone ?? 0) === i).length;
            const pct = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
            const colors = ["#f0d090","#7caf52","#888888","#d6ecff","#3a3a7a"];
            return (
              <div key={z.name} style={{ width: `${pct}%`, background: colors[i], display: "flex", alignItems: "center", justifyContent: "center", transition: "width .5s", minWidth: count > 0 ? 40 : 0, overflow: "hidden" }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: i === 4 ? "#d6ecff" : "#333", whiteSpace: "nowrap" }}>
                  {count > 0 ? `${z.name} (${count})` : ""}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {ZONES.map((z, i) => {
            const colors = ["#f0d090","#7caf52","#888888","#d6ecff","#3a3a7a"];
            return (
              <div key={z.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[i], flexShrink: 0 }} />
                {z.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Student table */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              {["#","Nombre","Zona","Altura","Correctas","Total","Precisión","Energía"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "24px 14px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>Esperando que los estudiantes se conecten...</td></tr>
            )}
            {players.map((p, i) => {
              const acc = p.total > 0 ? Math.round((p.correct / p.total) * 100) : null;
              const accColor = acc === null ? "var(--color-text-tertiary)" : acc >= 70 ? "#085041" : acc >= 40 ? "#633806" : "#791F1F";
              return (
                <tr key={p.id} style={{ borderBottom: i < players.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none", background: i % 2 === 0 ? "transparent" : "var(--color-background-secondary)" }}>
                  <td style={{ padding: "9px 14px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>{i + 1}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 500, color: "var(--color-text-primary)" }}>{p.name}</td>
                  <td style={{ padding: "9px 14px", color: "var(--color-text-secondary)" }}>{ZONES[Math.min(p.zone ?? 0, 4)]?.name}</td>
                  <td style={{ padding: "9px 14px", color: "var(--color-text-primary)", fontWeight: 500 }}>{p.height}m</td>
                  <td style={{ padding: "9px 14px", color: "#085041" }}>{p.correct}</td>
                  <td style={{ padding: "9px 14px", color: "var(--color-text-secondary)" }}>{p.total}</td>
                  <td style={{ padding: "9px 14px", color: accColor, fontWeight: 500 }}>{acc !== null ? `${acc}%` : "—"}</td>
                  <td style={{ padding: "9px 14px" }}>
                    <div style={{ width: 60, height: 5, background: "var(--color-background-secondary)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, p.energy)}%`, height: "100%", background: p.energy > 50 ? "#5DCAA5" : p.energy > 20 ? "#EF9F27" : "#E24B4A", borderRadius: 3 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
