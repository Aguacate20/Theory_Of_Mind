"use client";
import { MAP_NODES, ARTIFACTS, ArtifactNode } from "@/lib/learn/artifacts";

type DepositedArtifact = { id: string; node: ArtifactNode; relation?: string };

export default function ConceptMap({ deposited }: { deposited: DepositedArtifact[] }) {
  const W = 340, H = 420;
  const depositedNodes = new Set(deposited.map(d => d.node));
  // Also unlock the target node of each deposited artifact
  for (const dep of deposited) {
    const art = ARTIFACTS.find(a => a.id === dep.id);
    if (art) depositedNodes.add(art.targetNode);
  }

  // Build edges from deposited artifact relations
  type Edge = { from: ArtifactNode; to: ArtifactNode; relation: string; color: string };
  const edges: Edge[] = [];
  for (const dep of deposited) {
    const art = ARTIFACTS.find(a => a.id === dep.id);
    if (!art || !dep.node) continue;
    for (const rel of art.relations) {
      if (depositedNodes.has(rel.toNode)) {
        edges.push({
          from: art.targetNode,
          to: rel.toNode,
          relation: rel.type,
          color: rel.type === "apoya" ? "#5DCAA5" : rel.type === "contradice" ? "#E24B4A" : rel.type === "matiza" ? "#EF9F27" : "#7F77DD",
        });
      }
    }
  }

  const nodePos = (n: typeof MAP_NODES[0]) => ({
    x: 20 + n.x * (W - 40),
    y: 20 + n.y * (H - 40),
  });

  const totalNodes = MAP_NODES.length;
  const unlockedCount = MAP_NODES.filter(n => depositedNodes.has(n.id)).length;
  const pct = Math.round((unlockedCount / totalNodes) * 100);

  return (
    <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:500, color:"var(--color-text-secondary)" }}>Mapa conceptual colectivo</div>
        <div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{pct}% completado</div>
      </div>

      <div style={{ height:4, background:"var(--color-background-secondary)", borderRadius:2, overflow:"hidden", marginBottom:12 }}>
        <div style={{ width:`${pct}%`, height:"100%", background:"#534AB7", borderRadius:2, transition:"width .5s" }} />
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
        {/* Edges */}
        {edges.map((edge, i) => {
          const fromNode = MAP_NODES.find(n => n.id === edge.from);
          const toNode = MAP_NODES.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          const fp = nodePos(fromNode);
          const tp = nodePos(toNode);
          return (
            <g key={i}>
              <line
                x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                stroke={edge.color} strokeWidth={1.5}
                strokeDasharray={edge.relation === "contradice" ? "4,3" : "none"}
                opacity={0.7}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {MAP_NODES.map(node => {
          const unlocked = depositedNodes.has(node.id);
          const p = nodePos(node);
          const r = 14;
          return (
            <g key={node.id}>
              <circle
                cx={p.x} cy={p.y} r={r}
                fill={unlocked ? node.color : "var(--color-background-secondary)"}
                stroke={unlocked ? node.color : "var(--color-border-tertiary)"}
                strokeWidth={unlocked ? 0 : 1}
                opacity={unlocked ? 1 : 0.4}
              />
              {!unlocked && (
                <text x={p.x} y={p.y+4} textAnchor="middle" fontSize={10} fill="var(--color-text-tertiary)">?</text>
              )}
              <text
                x={p.x} y={p.y + r + 10}
                textAnchor="middle"
                fontSize={8}
                fill={unlocked ? "var(--color-text-primary)" : "var(--color-text-tertiary)"}
                fontWeight={unlocked ? 500 : 400}
              >
                {node.label.split(" ").slice(0,2).join(" ")}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:10 }}>
        {[
          { color:"#5DCAA5", label:"Apoya" },
          { color:"#E24B4A", label:"Contradice" },
          { color:"#EF9F27", label:"Matiza" },
          { color:"#7F77DD", label:"Extiende" },
        ].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:"var(--color-text-tertiary)" }}>
            <div style={{ width:16, height:2, background:l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {unlockedCount === 0 && (
        <div style={{ fontSize:12, color:"var(--color-text-tertiary)", textAlign:"center", marginTop:12 }}>
          El mapa se construye cuando los grupos depositen artefactos
        </div>
      )}
    </div>
  );
}
