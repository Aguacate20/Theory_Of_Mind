"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import CharacterSelector from "@/components/CharacterSelector";
import { CharacterDef } from "@/lib/characters";

const LearnWorld = dynamic(() => import("@/components/learn/LearnWorld"), { ssr: false });

function generateId() { return "l_" + Math.random().toString(36).slice(2, 10); }

type Stage = "group" | "name" | "character" | "playing";

export default function LearnPage() {
  const [stage, setStage] = useState<Stage>("group");
  const [group, setGroup] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [character, setCharacter] = useState<CharacterDef | null>(null);
  const [sessionId] = useState(generateId);

  const groups = [
    { g: 1 as const, label: "Grupo 1 — Teoría-Teoría", desc: "Wellman & Leslie", color: "#7F77DD", articles: ["Why the Child's Theory of Mind Really Is a Theory", "Pretending and Believing: Issues in the Theory of ToMM"] },
    { g: 2 as const, label: "Grupo 2 — Simulación & Interacción", desc: "Goldman & Gallagher", color: "#1D9E75", articles: ["Simulation Theory", "The Practice of Mind: Theory, Simulation or Primary Interaction?", "Beyond Simulation-Theory and Theory-Theory"] },
    { g: 3 as const, label: "Grupo 3 — Modularidad & Integración", desc: "Scholl, Leslie & Bohl", color: "#EF9F27", articles: ["Modularity, Development and Theory of Mind", "Toward an Integrative Account of Social Cognition"] },
  ];

  if (stage === "group") return (
    <main style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ width:"100%", maxWidth:520 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🗺️</div>
          <h1 style={{ fontSize:22, fontWeight:500, marginBottom:6 }}>El Archivo de la Mente</h1>
          <p style={{ fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.6 }}>
            Explora el museo, recoge artefactos de tu lectura y construye el mapa conceptual colectivo junto a tus compañeros.
          </p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {groups.map(gi => (
            <button key={gi.g} onClick={() => { setGroup(gi.g); setStage("name"); }}
              style={{ padding:"16px 18px", border:`0.5px solid ${gi.color}`, borderRadius:"var(--border-radius-lg)", background:"var(--color-background-primary)", cursor:"pointer", textAlign:"left", transition:"all .12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = gi.color + "11")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--color-background-primary)")}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:gi.color, flexShrink:0 }} />
                <span style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)" }}>{gi.label}</span>
              </div>
              <div style={{ fontSize:11, color:"var(--color-text-tertiary)", paddingLeft:20 }}>{gi.desc}</div>
              <div style={{ marginTop:8, paddingLeft:20 }}>
                {gi.articles.map(a => (
                  <div key={a} style={{ fontSize:10, color:"var(--color-text-tertiary)", marginBottom:2 }}>— {a}</div>
                ))}
              </div>
            </button>
          ))}
        </div>
        <div style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:"10px 14px", fontSize:11, color:"var(--color-text-tertiary)" }}>
          WASD / flechas mover · E recoger/depositar artefacto · M ver mapa conceptual
        </div>
      </div>
    </main>
  );

  if (stage === "name") return (
    <main style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ width:"100%", maxWidth:380, background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"2rem" }}>
        <button onClick={() => setStage("group")} style={{ fontSize:12, color:"var(--color-text-tertiary)", background:"none", border:"none", cursor:"pointer", marginBottom:16, padding:0 }}>← Volver</button>
        <h2 style={{ fontSize:18, fontWeight:500, marginBottom:16 }}>¿Cómo te llamas?</h2>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && setStage("character")}
          placeholder="Tu nombre..." maxLength={20} autoFocus
          style={{ width:"100%", padding:"9px 12px", fontSize:14, border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", marginBottom:12 }} />
        <button onClick={() => name.trim() && setStage("character")} disabled={!name.trim()}
          style={{ width:"100%", padding:"10px 0", fontSize:14, background: name.trim() ? groups.find(g=>g.g===group)!.color : "var(--color-background-secondary)", color: name.trim() ? "#fff" : "var(--color-text-tertiary)", border:"none", borderRadius:"var(--border-radius-md)", cursor: name.trim() ? "pointer" : "default", fontFamily:"inherit" }}>
          Siguiente →
        </button>
      </div>
    </main>
  );

  if (stage === "character") return (
    <main style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ width:"100%", maxWidth:680, background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"2rem" }}>
        <button onClick={() => setStage("name")} style={{ fontSize:12, color:"var(--color-text-tertiary)", background:"none", border:"none", cursor:"pointer", marginBottom:16, padding:0 }}>← Volver</button>
        <h2 style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>Elige tu explorador</h2>
        <p style={{ fontSize:13, color:"var(--color-text-secondary)", marginBottom:20 }}>Hola <strong>{name}</strong>, ¿con quién vas a explorar el archivo?</p>
        <CharacterSelector onSelect={char => { setCharacter(char); setStage("playing"); }} />
      </div>
    </main>
  );

  if (stage === "playing" && character) return (
    <main style={{ padding:"1rem 1.5rem", maxWidth:1200, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div>
          <span style={{ fontSize:16, fontWeight:500 }}>El Archivo de la Mente</span>
          <span style={{ fontSize:12, color:"var(--color-text-secondary)", marginLeft:10 }}>
            {name} · {groups.find(g => g.g === group)!.label}
          </span>
        </div>
        <a href="/" style={{ fontSize:11, color:"var(--color-text-tertiary)", textDecoration:"none" }}>← Volver al inicio</a>
      </div>
      <LearnWorld playerName={name} sessionId={sessionId} group={group} character={character} />
    </main>
  );

  return null;
}
