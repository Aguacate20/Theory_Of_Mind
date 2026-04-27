# ToM Runner 🧠

Juego educativo de plataformas sobre **Teoría de la Mente**. Los estudiantes escalan desde la playa hasta el espacio respondiendo preguntas. Moverse y saltar gasta energía — responder correctamente la recarga. Competencia en tiempo real con tabla de posiciones global.

## Zonas del juego

| Zona | Dificultad | Tipo de plataforma |
|------|------------|-------------------|
| 🏖️ Playa | Fácil | Arena, sombrillas, bolas |
| 🌿 Llanura | Medio | Pasto, árboles, rocas |
| ⛰️ Montaña | Difícil | Piedra, nieve, grietas |
| ☁️ Cielo | Muy difícil | Nubes (pequeñas, móviles) |
| 🚀 Espacio | Extremo | Asteroides diminutos |

## Controles

- **A / ← →  / D** — mover
- **W / Espacio / ↑** — saltar
- **Q** — abrir pregunta (en cualquier momento)
- **R** — volver al último checkpoint

## Despliegue paso a paso

### Paso 1 — Crea tu repositorio en GitHub

1. Ve a [github.com](https://github.com) → **New repository**
2. Nombre: `tom-runner` · Público · Sin README
3. Sube estos archivos:
   ```bash
   git init
   git add .
   git commit -m "init: ToM Runner"
   git remote add origin https://github.com/TU_USUARIO/tom-runner.git
   git push -u origin main
   ```

### Paso 2 — Crea tu base de datos en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project** (es gratis)
2. Elige nombre, contraseña, región (South America si puedes)
3. Una vez creado, ve a **SQL Editor** y copia+pega todo el contenido de `supabase-schema.sql`
4. Clic en **Run**
5. Ve a **Project Settings → API** y copia:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Paso 3 — Despliega en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Selecciona tu repositorio `tom-runner` de GitHub
3. En **Environment Variables** agrega las dos variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL    = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   ```
4. Clic en **Deploy** → en ~2 minutos tienes tu URL pública

### Paso 4 — Comparte con los estudiantes

Tu URL será algo como: `https://tom-runner-xxxx.vercel.app`

Cada estudiante:
1. Abre la URL en su computador o celular
2. Escribe su nombre
3. Comienza a escalar
4. Ve la tabla de posiciones en tiempo real con todos sus compañeros

## ¿Cómo funciona el tiempo real?

```
Estudiante A          Supabase (DB)         Estudiante B
    │                      │                      │
    │── upsert height ────►│                      │
    │                      │── realtime event ───►│
    │                      │                      │── actualiza tabla
    │◄── evento otros ─────│                      │
    │── actualiza tabla    │                      │
```

- Cada 2 segundos, cada jugador envía su posición y stats a Supabase
- Supabase emite eventos en tiempo real (WebSocket) a todos los demás
- La tabla de posiciones se actualiza automáticamente en todos los dispositivos

## Métricas registradas por estudiante

- Altura máxima alcanzada (metros)
- Zona actual
- Total de preguntas respondidas
- Número de respuestas correctas
- Porcentaje de precisión

Puedes ver todo esto en **Supabase → Table Editor → players** en tiempo real durante la clase.

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx          ← pantalla de inicio + entrada de nombre
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── GameCanvas.tsx    ← juego completo (canvas + UI)
└── lib/
    ├── questions.ts      ← 20 preguntas sobre los 7 artículos
    ├── gameConstants.ts  ← zonas, plataformas, física
    └── supabase.ts       ← cliente de BD
```

## Personalizar preguntas

Edita `src/lib/questions.ts`. Cada pregunta tiene:
```ts
{
  id: number,
  group: 1 | 2 | 3,          // grupo responsable del artículo
  article: "Nombre del artículo",
  q: "¿Pregunta?",
  opts: ["A) ...", "B) ...", "C) ...", "D) ..."],
  ans: 0,                     // índice de la respuesta correcta (0-3)
  explanation: "Explicación que aparece al responder",
}
```
