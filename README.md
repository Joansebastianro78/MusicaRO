# Immersive Music Player

Reproductor de música inmersivo: un frontend React + TypeScript +
Tailwind que reproduce música con un visualizador de audio en tiempo
real (Web Audio API + canvas) y transiciones animadas con Framer
Motion, alimentado por funciones serverless de **Vercel** que combinan
tracks de **Audius** y **Jamendo**.

## Estructura

```
immersive-music-app/
├── api/                      # Funciones serverless de Vercel
│   ├── playlist.ts           # GET /api/playlist → mezcla Audius + Jamendo
│   ├── health.ts             # GET /api/health
│   └── _lib/
│       ├── audius.ts         # Cliente de la API de Audius + mapeo
│       ├── jamendo.ts        # Cliente de la API de Jamendo + mapeo
│       ├── fallbackPlaylist.ts
│       ├── format.ts
│       └── track.ts
├── client/                   # React + TypeScript + Tailwind (Vite)
│   └── src/
│       ├── types/track.ts
│       ├── hooks/useAudioAnalyser.ts
│       ├── components/
│       │   ├── MusicPlayer.tsx
│       │   ├── StartOverlay.tsx
│       │   └── AudioVisualizer.tsx
│       ├── App.tsx
│       └── main.tsx
├── vercel.json
└── package.json              # orquesta el build del cliente para Vercel
```

No hay backend Express separado: `/api/playlist` y `/api/health` son
[funciones serverless de Vercel](https://vercel.com/docs/functions), y
el cliente Vite se publica como sitio estático. Ambos se despliegan
juntos, en el mismo dominio, con un solo proyecto de Vercel.

## 1. Las dos fuentes de música

`/api/playlist` pide tracks a dos catálogos en paralelo y los
intercala en una sola playlist:

- **[Audius](https://docs.audius.co/api)** — catálogo abierto y
  descentralizado. **No requiere ninguna credencial**: las lecturas
  (buscar, ver trending, reproducir) son públicas. Cada track ya trae
  una URL de streaming firmada lista para usar. Opcionalmente podés
  generar una API Key gratis en `audius.co/settings` → Developer Apps
  y ponerla en `AUDIUS_API_KEY` solo para subir tus límites de rate
  limit — la app funciona igual sin ella.
- **[Jamendo](https://developer.jamendo.com/v3.0/docs)** — catálogo de
  música independiente bajo licencias Creative Commons. Necesita un
  `client_id` gratuito: registrate en
  [devportal.jamendo.com](https://devportal.jamendo.com), creá una app
  y copiá el Client ID a `JAMENDO_CLIENT_ID`.

Si `JAMENDO_CLIENT_ID` no está configurado, `/api/playlist` no rompe:
sigue funcionando solo con Audius (que no necesita nada) y lo indica en
los logs. Si además Audius fallara, cae a una playlist de respaldo
(tracks CORS-friendly de `mdn/webaudio-examples`) para que la app
nunca quede en blanco.

Copiá el ejemplo y completá al menos el de Jamendo (Audius funciona
out-of-the-box):

```bash
cp .env.example .env
# .env
JAMENDO_CLIENT_ID=tu_client_id
AUDIUS_API_KEY=            # opcional
```

## 2. Desarrollo local con Vercel

La forma recomendada de correr todo junto (frontend + funciones) es la
[Vercel CLI](https://vercel.com/docs/cli):

```bash
npm install -g vercel   # si no la tienes
npm install              # deps de la raíz (@vercel/node, typescript)
vercel dev               # sirve client/ + api/ en un solo puerto (3000)
```

`vercel dev` lee tu `.env` automáticamente y sirve el sitio en
`http://localhost:3000`. El frontend hace `fetch('/api/playlist')` con
ruta relativa, así que todo funciona sin configurar CORS ni URLs.

### Alternativa: Vite con HMR + `vercel dev` por separado

Si preferís el hot-reload más rápido de Vite en un terminal aparte:

```bash
# terminal 1
vercel dev               # sirve /api en :3000

# terminal 2
cd client && npm install && npm run dev   # Vite en :5173, con proxy /api → :3000
```

`client/vite.config.ts` ya incluye un proxy de `/api` hacia
`http://localhost:3000` para este flujo.

## 3. Deploy en Vercel

1. Sube el repo a GitHub/GitLab/Bitbucket y [impórtalo en
   Vercel](https://vercel.com/new), o corre `vercel` desde la raíz del
   proyecto.
2. En **Project Settings → Environment Variables**, agrega
   `JAMENDO_CLIENT_ID` (y opcionalmente `AUDIUS_API_KEY`) para
   Production, Preview y Development.
3. Vercel detecta `vercel.json`:
   - `buildCommand: npm run build` → instala y compila `client/`
     (`client/dist`).
   - `outputDirectory: client/dist` → esto es lo que se sirve como
     sitio estático.
   - Todo archivo `.ts` dentro de `api/` se despliega automáticamente
     como función serverless en `/api/<nombre>`.
   - Un `rewrite` manda cualquier ruta que no empiece con `/api/` a
     `index.html`, para que el routing del lado del cliente (si algún
     día lo agregas) funcione.
4. Deploy. Listo: `https://tu-proyecto.vercel.app` sirve el reproductor
   y `https://tu-proyecto.vercel.app/api/playlist` sirve la playlist
   combinada de Audius + Jamendo.

No hace falta configurar `VITE_API_URL` para el deploy normal — el
cliente usa rutas relativas (`/api/playlist`), que funcionan porque
frontend y funciones viven en el mismo dominio de Vercel.

## Endpoint `/api/playlist`

Query params opcionales:

- `?s=texto` — búsqueda de texto (se pasa como `query` a Audius y como
  `search` a Jamendo).
- `?genre=Electronic` — filtra el trending de Audius por género
  (ignorado si además mandás `s`).
- `?limit=8` — cuántos tracks devolver en total (default 12). Con
  `source=all` se reparte a la mitad entre ambos proveedores.
- `?source=audius` o `?source=jamendo` — para pedir un solo catálogo en
  vez de la mezcla por defecto (`all`).

Ejemplos:

- `/api/playlist?s=lofi&limit=10`
- `/api/playlist?source=jamendo&s=jazz`
- `/api/playlist?genre=Ambient`

La respuesta trae un campo `source: "audius" | "jamendo" | "fallback"`
por track, y se cachea en el edge de Vercel por 30 minutos
(`Cache-Control: s-maxage=1800, stale-while-revalidate=86400`) para no
golpear ambas APIs en cada carga de página.

## Cómo funciona el visualizador (resumen técnico)

- `useAudioAnalyser` crea un `AudioContext`, un `AnalyserNode` (FFT de
  256 muestras) y conecta el `<audio>` mediante
  `createMediaElementSource`. Expone `getFrequencyData()`, que devuelve
  un snapshot `Uint8Array` de 0-255 por bin de frecuencia.
- `AudioVisualizer` corre su propio loop de `requestAnimationFrame`,
  independiente del ciclo de render de React, leyendo
  `getFrequencyData()` en cada frame para mover partículas y modular un
  resplandor central según los graves (bass) y medios (mid).
- Las políticas de autoplay de los navegadores exigen un gesto real del
  usuario antes de reproducir audio o iniciar un `AudioContext`. Por
  eso todo el arranque (`connectSource` → `resumeContext` →
  `audioEl.play()`) vive dentro del `onClick` del `StartOverlay`, no en
  un `useEffect` al montar.

## Nota sobre CORS en los streams de Audius/Jamendo

El `<audio crossOrigin="anonymous">` necesita que los archivos de audio
respondan con `Access-Control-Allow-Origin` para que la Web Audio API
pueda leer sus frecuencias sin marcar el nodo como "tainted". Las URLs
de streaming de Audius están pensadas para reproducirse embebidas en
sitios de terceros y funcionan bien con esto; si algún track puntual
(de cualquiera de los dos catálogos) fallara, la app lo captura y
muestra un error de reproducción en vez de romperse en silencio — solo
salta al siguiente track con ⏭ (ver `handleStart` en
`MusicPlayer.tsx`).
