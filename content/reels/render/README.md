# Render pipeline — Reels GrowthStack OS

Genera los 7 reels finales (MP4 vertical 1080x1920, con narración en español) a partir de
`reels-data.json`. Usa el panel real (`panel-source/index.html`) como material de fondo
para las escenas "demo" y voz sintética (gTTS) para la narración.

## Cómo regenerar

```bash
cd content/reels/render
export NODE_PATH=/opt/node22/lib/node_modules   # solo si playwright no está en node_modules local
node scripts/capture_screens.mjs                # (solo si cambia el panel) recaptura los screenshots
node scripts/build_all.mjs                      # genera los 7 reels en output/
node scripts/build_all.mjs --only reel-3         # o solo uno, para iterar más rápido
```

## Los 7 formatos (cada reel es visualmente distinto)

Cada reel usa un formato dominante distinto para que la serie no se sienta repetida.
El campo `angle` de cada reel en `reels-data.json` documenta el formato + a quién filtra:

| Reel | Formato dominante | Ángulo / a quién atrae |
|------|-------------------|--------------------------|
| 1 | `stat` — reveal antes/después | Prueba social con cifra dura, para quien ya factura y quiere escalar |
| 2 | `chat` — mockup de DM de Instagram | Curiosidad táctica, para quien no tiene sistema de outbound |
| 3 | `shot` — tour de producto (screen demo) | Exclusividad/detrás de cámaras, para quien valora herramientas serias |
| 4 | `quote` — tarjetas de cita/historia personal | Filtro por mentalidad, aleja a quien busca trucos rápidos |
| 5 | `numbered` — countdown 01-07 con puntos de progreso | Framework replicable, para quien ya tiene audiencia pero no convierte |
| 6 | `checklist` — desglose de oferta con checks acumulativos | Escasez + calificación explícita por presupuesto/madurez |
| 7 | `compare` — split-screen "VS" (mito vs realidad) | Contraintuitivo, para quien ya tiene audiencia pero no convierte |

## Cómo funciona

1. **`reels-data.json`** — guion de cada reel dividido en "beats" (bloques). Cada beat trae
   `narration` (texto que se locuta), `caption` (texto que aparece en la barra inferior) y
   `visual` (el tipo de escena: `title`, `shot`, `stat`, `chat`, `quote`, `numbered`,
   `checklist` o `compare` — ver tabla de formatos arriba).
2. **`scripts/gen_tts.py`** — genera un mp3 por beat con gTTS (voz neutra en español).
3. **`scripts/build_all.mjs`** — orquesta todo:
   - Genera el audio de cada beat y mide su duración exacta con `ffprobe`.
   - Usa esa duración (+ una pausa de 0.28s) como la duración de la escena visual
     correspondiente — así el video **siempre** queda sincronizado con la narración,
     sin importar cuánto tarde la voz en leer cada línea.
   - Concatena todos los beats en un único `assets/audio/<reel>.mp3`.
   - Genera el HTML de la línea de tiempo (`scenes/<reel>.html`) con `scripts/render_html.mjs`
     y lo graba con Playwright/Chromium (`recordVideo`) para producir un webm silencioso.
   - Combina el webm con el audio final vía `ffmpeg` → `output/<reel>.mp4` (H.264 + AAC).

## Limitaciones conocidas (léelas antes de publicar)

- **Voz:** se eligió TTS sintético neutro (gTTS) porque es la única opción de voz que funciona
  en este entorno sin claves de API — servicios con voces más "humanas" (ElevenLabs, Azure
  Neural, edge-tts) requieren WebSocket o API key, y este entorno solo permite HTTPS simple.
  Si quieres una voz más cálida, puedes: (a) regrabar la narración con tu propia voz o la de
  un actor de voz y reemplazar `assets/audio/<reel>.mp3` (las duraciones por beat ya quedan
  guardadas en `reels-data.json` tras la primera corrida, así que puedes re-muxear sin
  volver a renderizar el video), o (b) pasar los guiones de `reels-data.json` a un servicio de
  voz premium y volver a mux-earlos con el mismo `output/<reel>.mp4` como referencia visual.
- **Tipografía:** usa la fuente del sistema (no Fraunces/Manrope del panel original) para evitar
  depender de Google Fonts durante la grabación automatizada — visualmente sigue la misma
  paleta de color, pero si quieres tipografía idéntica a la del panel, se puede ajustar
  `render_html.mjs` para cargar las fuentes localmente.
- **Duración:** cada reel ronda 40-55s, dentro del rango ideal para Reels/TikTok.
