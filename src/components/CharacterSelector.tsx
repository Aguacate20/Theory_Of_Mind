"use client";
import { useEffect, useRef, useState } from "react";
import { CHARACTERS, CharacterDef, drawCharacter } from "@/lib/characters";

function CharacterCard({ char, selected, onSelect }: {
  char: CharacterDef; selected: boolean; onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 64, 80);
    drawCharacter(ctx, char, 8, 10, 48, 60);
  }, [char]);

  return (
    <button onClick={onSelect} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "10px 8px",
      border: selected ? `2px solid ${char.accentColor}` : "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      background: selected ? char.headColor + "22" : "var(--color-background-primary)",
      cursor: "pointer", transition: "all .12s", minWidth: 72,
    }}>
      <canvas ref={canvasRef} width={64} height={80} style={{ display: "block" }} />
      <span style={{ fontSize: 11, fontWeight: selected ? 500 : 400, color: "var(--color-text-primary)" }}>{char.name}</span>
    </button>
  );
}

export default function CharacterSelector({
  onSelect,
}: {
  onSelect: (char: CharacterDef) => void;
}) {
  const [selected, setSelected] = useState<number>(0);

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 10 }}>
        Elige tu personaje
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {CHARACTERS.map(char => (
          <CharacterCard
            key={char.id}
            char={char}
            selected={selected === char.id}
            onSelect={() => setSelected(char.id)}
          />
        ))}
      </div>
      <button
        onClick={() => onSelect(CHARACTERS[selected])}
        style={{
          width: "100%", padding: "10px 0", fontSize: 14,
          background: CHARACTERS[selected].accentColor,
          color: "#fff", border: "none",
          borderRadius: "var(--border-radius-md)", cursor: "pointer",
          fontFamily: "var(--font-sans)", transition: "opacity .15s",
        }}>
        Jugar como {CHARACTERS[selected].name} →
      </button>
    </div>
  );
}
