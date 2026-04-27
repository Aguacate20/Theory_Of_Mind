"use client";
import { useState, useEffect } from "react";
import { Artifact, ArtifactNode, MAP_NODES, DepositedArtifact, Relation } from "@/lib/learn/artifacts";

type Props = {
  artifact: Artifact;
  playerGroup: 1 | 2 | 3;
  depositMode: boolean;
  depositedSoFar: { id: string; node: ArtifactNode }[];
  onSolved: (id: string) => void;
  onDeposit: (id: string, node: ArtifactNode, relation: string) => void;
  onClose: () => void;
};

export default function ArtifactModal({ artifact, playerGroup, depositMode, depositedSoFar, onSolved, onDeposit, onClose }: Props) {
  const isPrimary = artifact.primaryGroup === playerGroup;
  const totalBlanks = artifact.blanks.length;
  const blanksToShow = isPrimary ? 1 : totalBlanks; // advantage: primary sees 1 blank, others see all
  const timeLimit = isPrimary ? 60 : 35;

  const [phase, setPhase] = useState<"decrypt" | "classify" | "deposit">(depositMode ? "deposit" : "decrypt");
  const [answers, setAnswers] = useState<string[]>(Array(totalBlanks).fill(""));
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [selectedNode, setSelectedNode] = useState<ArtifactNode | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(null);
  const [classifyResult, setClassifyResult] = useState<"correct" | "wrong" | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== "decrypt" || result) return;
    if (timeLeft <= 0) { handleSubmitDecrypt(true); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, result]);

  // Build the displayed text with blanks
  function renderFragment() {
    let text = artifact.fragmentBlanks;
    const parts = text.split("[BLANK]");
    if (isPrimary) {
      // Show first blank only, rest already filled
      return parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            i === 0 ? (
              <input
                value={answers[i] || ""}
                onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }}
                style={{ width: 90, padding:"2px 6px", fontSize:13, border:"0.5px solid var(--color-border-secondary)", borderRadius:4, background:"var(--color-background-primary)", color:"var(--color-text-primary)" }}
                placeholder="..."
                disabled={!!result}
              />
            ) : (
              <span style={{ color: artifact.color, fontWeight: 500 }}> [{artifact.blanks[i]}] </span>
            )
          )}
        </span>
      ));
    }
    // All blanks shown as inputs
    return parts.map((part, i) => (
      <span key={i}>
        {part}
        {i < parts.length - 1 && (
          <input
            value={answers[i] || ""}
            onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }}
            style={{ width: 90, padding:"2px 6px", fontSize:13, border:"0.5px solid var(--color-border-secondary)", borderRadius:4, background:"var(--color-background-primary)", color:"var(--color-text-primary)" }}
            placeholder="..."
            disabled={!!result}
          />
        )}
      </span>
    ));
  }

  function handleSubmitDecrypt(timedOut = false) {
    if (timedOut) {
      setResult("wrong");
      setTimeout(() => onClose(), 2000);
      return;
    }
    // Check answers (case-insensitive, trimmed)
    const blanksToCheck = isPrimary ? [0] : answers.map((_, i) => i);
    const allCorrect = blanksToCheck.every(i => {
      const userAns = (answers[i] || "").trim().toLowerCase();
      const correctAns = artifact.blanks[i].toLowerCase();
      return userAns === correctAns || correctAns.includes(userAns) || userAns.includes(correctAns.slice(0, 4));
    });
    setResult(allCorrect ? "correct" : "wrong");
    if (allCorrect) {
      setTimeout(() => setPhase("classify"), 1800);
    } else {
      setTimeout(() => onClose(), 2200);
    }
  }

  function handleClassify() {
    if (!selectedNode) return;
    const correct = selectedNode === artifact.targetNode;
    setClassifyResult(correct ? "correct" : "wrong");
    if (correct) {
      setTimeout(() => onSolved(artifact.id), 1600);
    } else {
      setTimeout(() => {
        setClassifyResult(null);
        setSelectedNode(null);
      }, 1400);
    }
  }

  function handleDeposit() {
    if (!selectedNode || !selectedRelation) return;
    onDeposit(artifact.id, selectedNode, selectedRelation);
  }

  const depositedNodes = depositedSoFar.map(d => d.node);
  const relations: { value: Relation; label: string; desc: string }[] = [
    { value: "apoya", label: "Apoya", desc: "refuerza o confirma el concepto" },
    { value: "contradice", label: "Contradice", desc: "se opone o refuta el concepto" },
    { value: "matiza", label: "Matiza", desc: "añade complejidad o excepciones" },
    { value: "extiende", label: "Extiende", desc: "amplía o especifica el concepto" },
  ];

  return (
    <div style={{ background:"var(--color-background-primary)", border:`0.5px solid ${artifact.color}`, borderRadius:"var(--border-radius-lg)", padding:"1.25rem", marginBottom:8, width:800 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, color:"var(--color-text-tertiary)", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>
            {artifact.reading}
          </div>
          <div style={{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)" }}>{artifact.title}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {isPrimary && phase === "decrypt" && (
            <span style={{ fontSize:11, background: artifact.color+"22", color: artifact.color, padding:"3px 10px", borderRadius:12 }}>★ Tu lectura — ventaja</span>
          )}
          {phase === "decrypt" && !result && (
            <div style={{ fontSize:13, fontWeight:500, color: timeLeft < 10 ? "#E24B4A" : "var(--color-text-primary)", minWidth:32, textAlign:"center" }}>
              {timeLeft}s
            </div>
          )}
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", fontSize:16 }}>✕</button>
        </div>
      </div>

      {/* Phase: decrypt */}
      {phase === "decrypt" && (
        <>
          <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:8 }}>
            {isPrimary ? "Completa la palabra que falta:" : "Completa los espacios en blanco:"}
          </div>
          <div style={{ fontSize:13, lineHeight:2, color:"var(--color-text-primary)", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:"10px 14px", marginBottom:12 }}>
            {renderFragment()}
          </div>
          {result && (
            <div style={{ padding:"8px 12px", borderRadius:"var(--border-radius-md)", background: result === "correct" ? "#E1F5EE" : "#FCEBEB", color: result === "correct" ? "#085041" : "#791F1F", fontSize:13, marginBottom:10 }}>
              {result === "correct" ? "✓ Correcto — puedes llevarte el artefacto" : "✗ Incorrecto — el artefacto queda en el suelo"}
            </div>
          )}
          {!result && (
            <button onClick={() => handleSubmitDecrypt(false)}
              style={{ width:"100%", padding:"9px 0", fontSize:13, background: artifact.color, color:"#fff", border:"none", borderRadius:"var(--border-radius-md)", cursor:"pointer", fontFamily:"inherit" }}>
              Confirmar respuesta
            </button>
          )}
        </>
      )}

      {/* Phase: classify */}
      {phase === "classify" && (
        <>
          <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:8 }}>
            Paso 2 — ¿En qué nodo del mapa conceptual encaja este artefacto?
          </div>
          <div style={{ fontSize:12, color:"var(--color-text-secondary)", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:"8px 12px", marginBottom:12, lineHeight:1.5 }}>
            "{artifact.fragmentFull.slice(0, 140)}..."
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 }}>
            {MAP_NODES.map(node => (
              <button key={node.id} onClick={() => setSelectedNode(node.id)}
                style={{ padding:"7px 10px", fontSize:11, border:`0.5px solid ${selectedNode === node.id ? node.color : "var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", background: selectedNode === node.id ? node.color+"22" : "var(--color-background-primary)", cursor:"pointer", color: selectedNode === node.id ? node.color : "var(--color-text-secondary)", textAlign:"left", transition:"all .1s" }}>
                <div style={{ fontWeight: selectedNode === node.id ? 500 : 400 }}>{node.label}</div>
                <div style={{ fontSize:10, opacity:0.7, marginTop:1 }}>{node.description.slice(0,45)}...</div>
              </button>
            ))}
          </div>
          {classifyResult && (
            <div style={{ padding:"8px 12px", borderRadius:"var(--border-radius-md)", background: classifyResult === "correct" ? "#E1F5EE" : "#FCEBEB", color: classifyResult === "correct" ? "#085041" : "#791F1F", fontSize:13, marginBottom:10 }}>
              {classifyResult === "correct" ? "✓ ¡Correcto! Ahora lleva el artefacto al centro" : "✗ No es ese nodo — intenta de nuevo"}
            </div>
          )}
          {!classifyResult && (
            <button onClick={handleClassify} disabled={!selectedNode}
              style={{ width:"100%", padding:"9px 0", fontSize:13, background: selectedNode ? artifact.color : "var(--color-background-secondary)", color: selectedNode ? "#fff" : "var(--color-text-tertiary)", border:"none", borderRadius:"var(--border-radius-md)", cursor: selectedNode ? "pointer" : "default", fontFamily:"inherit" }}>
              Confirmar nodo
            </button>
          )}
        </>
      )}

      {/* Phase: deposit (when in centro) */}
      {phase === "deposit" && (
        <>
          <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:8 }}>
            Paso 3 — ¿Cómo se relaciona este artefacto con los conceptos ya en el mapa?
          </div>
          <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:10 }}>
            Conecta con un nodo ya depositado:
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, marginBottom:12 }}>
            {MAP_NODES.filter(n => depositedNodes.includes(n.id) || n.id === artifact.targetNode).map(node => (
              <button key={node.id} onClick={() => setSelectedNode(node.id)}
                style={{ padding:"6px 10px", fontSize:11, border:`0.5px solid ${selectedNode === node.id ? node.color : "var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", background: selectedNode === node.id ? node.color+"22" : "var(--color-background-primary)", cursor:"pointer", color: selectedNode === node.id ? node.color : "var(--color-text-secondary)", textAlign:"left" }}>
                {node.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:6 }}>¿Qué tipo de relación?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, marginBottom:12 }}>
            {relations.map(rel => (
              <button key={rel.value} onClick={() => setSelectedRelation(rel.value)}
                style={{ padding:"7px 10px", fontSize:11, border:`0.5px solid ${selectedRelation === rel.value ? "#534AB7" : "var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", background: selectedRelation === rel.value ? "#EEEDFE" : "var(--color-background-primary)", cursor:"pointer", color: selectedRelation === rel.value ? "#3C3489" : "var(--color-text-secondary)", textAlign:"left" }}>
                <div style={{ fontWeight:500 }}>{rel.label}</div>
                <div style={{ fontSize:10, opacity:0.7 }}>{rel.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={handleDeposit} disabled={!selectedNode || !selectedRelation}
            style={{ width:"100%", padding:"9px 0", fontSize:13, background: selectedNode && selectedRelation ? "#534AB7" : "var(--color-background-secondary)", color: selectedNode && selectedRelation ? "#fff" : "var(--color-text-tertiary)", border:"none", borderRadius:"var(--border-radius-md)", cursor: selectedNode && selectedRelation ? "pointer" : "default", fontFamily:"inherit" }}>
            Depositar en el mapa conceptual →
          </button>
        </>
      )}
    </div>
  );
}
