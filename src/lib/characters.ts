export type CharacterDef = {
  id: number;
  name: string;
  bodyColor: string;
  headColor: string;
  eyeColor: string;
  accentColor: string;
  shape: "round" | "square" | "tall" | "wide";
  accessory: "none" | "hat" | "glasses" | "crown" | "antenna" | "bow";
};

export const CHARACTERS: CharacterDef[] = [
  {
    id: 0, name: "Nova",
    bodyColor: "#7F77DD", headColor: "#AFA9EC", eyeColor: "#26215C",
    accentColor: "#534AB7", shape: "round", accessory: "antenna",
  },
  {
    id: 1, name: "Rana",
    bodyColor: "#1D9E75", headColor: "#5DCAA5", eyeColor: "#085041",
    accentColor: "#0F6E56", shape: "wide", accessory: "none",
  },
  {
    id: 2, name: "Sol",
    bodyColor: "#EF9F27", headColor: "#FAC775", eyeColor: "#633806",
    accentColor: "#BA7517", shape: "round", accessory: "crown",
  },
  {
    id: 3, name: "Luna",
    bodyColor: "#D4537E", headColor: "#ED93B1", eyeColor: "#4B1528",
    accentColor: "#993556", shape: "tall", accessory: "bow",
  },
  {
    id: 4, name: "Roca",
    bodyColor: "#888780", headColor: "#B4B2A9", eyeColor: "#2C2C2A",
    accentColor: "#5F5E5A", shape: "square", accessory: "hat",
  },
  {
    id: 5, name: "Cielo",
    bodyColor: "#378ADD", headColor: "#85B7EB", eyeColor: "#042C53",
    accentColor: "#185FA5", shape: "tall", accessory: "glasses",
  },
  {
    id: 6, name: "Bosque",
    bodyColor: "#639922", headColor: "#97C459", eyeColor: "#173404",
    accentColor: "#3B6D11", shape: "wide", accessory: "hat",
  },
  {
    id: 7, name: "Coral",
    bodyColor: "#D85A30", headColor: "#F0997B", eyeColor: "#4A1B0C",
    accentColor: "#993C1D", shape: "round", accessory: "antenna",
  },
  {
    id: 8, name: "Nieve",
    bodyColor: "#B5D4F4", headColor: "#E6F1FB", eyeColor: "#0C447C",
    accentColor: "#378ADD", shape: "square", accessory: "crown",
  },
  {
    id: 9, name: "Noche",
    bodyColor: "#3C3489", headColor: "#7F77DD", eyeColor: "#EEEDFE",
    accentColor: "#26215C", shape: "tall", accessory: "glasses",
  },
];

// Draws a character on a canvas context at given position
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  char: CharacterDef,
  x: number,
  y: number,
  w: number,
  h: number,
  label?: string,
  facingLeft?: boolean
) {
  ctx.save();

  const cx = x + w / 2;
  const headR = w * 0.34;
  const headY = y + headR + 2;
  const bodyY = headY + headR;
  const bodyH = h - headR * 2 - 2;

  // Body
  ctx.fillStyle = char.bodyColor;
  if (char.shape === "round") {
    ctx.beginPath();
    ctx.ellipse(cx, bodyY + bodyH / 2, w * 0.4, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (char.shape === "tall") {
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.28, bodyY, w * 0.56, bodyH, 4);
    ctx.fill();
  } else if (char.shape === "wide") {
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.45, bodyY + bodyH * 0.1, w * 0.9, bodyH * 0.8, 4);
    ctx.fill();
  } else {
    ctx.fillRect(cx - w * 0.35, bodyY, w * 0.7, bodyH);
  }

  // Accent stripe on body
  ctx.fillStyle = char.accentColor;
  ctx.fillRect(cx - w * 0.12, bodyY + bodyH * 0.3, w * 0.24, bodyH * 0.2);

  // Head
  ctx.fillStyle = char.headColor;
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  const eyeOffset = facingLeft ? -3 : 3;
  ctx.fillStyle = char.eyeColor;
  ctx.beginPath();
  ctx.arc(cx - headR * 0.35 + eyeOffset * 0.3, headY - headR * 0.1, headR * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + headR * 0.35 + eyeOffset * 0.3, headY - headR * 0.1, headR * 0.22, 0, Math.PI * 2);
  ctx.fill();
  // Pupils
  ctx.fillStyle = "#ffffff88";
  ctx.beginPath();
  ctx.arc(cx - headR * 0.3 + eyeOffset * 0.3, headY - headR * 0.15, headR * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + headR * 0.4 + eyeOffset * 0.3, headY - headR * 0.15, headR * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = char.eyeColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, headY + headR * 0.1, headR * 0.3, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Accessory
  ctx.fillStyle = char.accentColor;
  if (char.accessory === "hat") {
    ctx.fillRect(cx - headR * 0.7, headY - headR - 10, headR * 1.4, 8);
    ctx.fillRect(cx - headR * 0.45, headY - headR - 18, headR * 0.9, 10);
  } else if (char.accessory === "crown") {
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.7, headY - headR + 2);
    ctx.lineTo(cx - headR * 0.5, headY - headR - 10);
    ctx.lineTo(cx, headY - headR - 6);
    ctx.lineTo(cx + headR * 0.5, headY - headR - 10);
    ctx.lineTo(cx + headR * 0.7, headY - headR + 2);
    ctx.closePath();
    ctx.fill();
  } else if (char.accessory === "glasses") {
    ctx.strokeStyle = char.accentColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - headR * 0.7, headY - headR * 0.25, headR * 0.55, headR * 0.4);
    ctx.strokeRect(cx + headR * 0.15, headY - headR * 0.25, headR * 0.55, headR * 0.4);
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.15, headY - headR * 0.1);
    ctx.lineTo(cx + headR * 0.15, headY - headR * 0.1);
    ctx.stroke();
  } else if (char.accessory === "antenna") {
    ctx.strokeStyle = char.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, headY - headR);
    ctx.lineTo(cx + headR * 0.2, headY - headR - 12);
    ctx.stroke();
    ctx.fillStyle = char.bodyColor;
    ctx.beginPath();
    ctx.arc(cx + headR * 0.2, headY - headR - 14, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (char.accessory === "bow") {
    ctx.fillStyle = "#E24B4A";
    ctx.beginPath();
    ctx.ellipse(cx - 6, headY - headR - 4, 6, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 6, headY - headR - 4, 6, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FF6B6B";
    ctx.beginPath();
    ctx.arc(cx, headY - headR - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Name label
  if (label) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = `${Math.max(9, w * 0.22)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(label.slice(0, 10), cx, y - 3);
  }

  ctx.restore();
}
