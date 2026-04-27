import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ToM Runner — Teoría de la Mente",
  description: "Juego educativo de plataformas sobre Teoría de la Mente",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
