# Immersive Music Player

Reproductor de música inmersivo: un frontend React + TypeScript +
Tailwind que reproduce música con un visualizador de audio en tiempo
real (Web Audio API + canvas) y transiciones animadas con Framer
Motion, alimentado por funciones serverless de **Vercel** que consultan
la **API de HookSounds**.

## Estructura

```
immersive-music-app/
├── api/                      # Funciones serverless de Vercel
│   ├── playlist.ts           # GET /api/playlist → tracks de HookSounds
│   ├── health.ts             # GET /api/health
│   └── _lib/
│       ├── hooksounds.ts     # Cliente de la API de HookSounds + mapeo
│       ├── fallbackPlaylist.ts
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

Ya no hay un backend Express separado: las rutas `/api/playlist` y
`/api/health` ahora son [funciones serverless de
Vercel](https://vercel.com/docs/functions), y el cliente Vite se
publica como sitio estático. Ambos se despliegan juntos, en el mismo
dominio, con un solo proyecto de Vercel.

## 1. Cuenta y credenciales de HookSounds

`api/_lib/hooksounds.ts` llama a la [API REST de
HookSounds](https://docs.hooksounds.com/) (`edd-api/products`) para
traer tracks reales (con mp3 de preview, carátula, bpm, duración,
etc). Necesitas una API Key y un Token de tu cuenta de HookSounds
([docs de autenticación](https://docs.hooksounds.com/guides/auth/)).

Esas credenciales son secretas y **solo se usan server-side**, dentro
de la función `/api/playlist` — nunca viajan al bundle del cliente.

Copia el ejemplo y complétalo:

```bash
cp .env.example .env
# .env
HOOKSOUNDS_API_KEY=tu_api_key
HOOKSOUNDS_API_TOKEN=tu_token
```

Si estas variables no están configuradas (o la llamada a HookSounds
falla), `/api/playlist` no rompe: sirve automáticamente una playlist
de respaldo (tracks CORS-friendly de `mdn/webaudio-examples`) para que
la app siga siendo usable mientras terminas de configurar las
credenciales.

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

Si prefieres el hot-reload más rápido de Vite en un terminal aparte:

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
   `HOOKSOUNDS_API_KEY` y `HOOKSOUNDS_API_TOKEN` (Production, Preview y
   Development).
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
   y `https://tu-proyecto.vercel.app/api/playlist` sirve los tracks de
   HookSounds.

No hace falta configurar `VITE_API_URL` para el deploy normal — el
cliente usa rutas relativas (`/api/playlist`), que funcionan porque
frontend y funciones viven en el mismo dominio de Vercel. Esa variable
solo existe como escape hatch para casos avanzados (por ejemplo, un
cliente self-hosted apuntando a una API desplegada en otro dominio).

## Endpoint `/api/playlist`

Acepta dos query params opcionales, que se pasan directo a HookSounds:

- `?s=texto` — búsqueda de texto (parámetro `s` de HookSounds).
- `?limit=8` — cuántos tracks devolver (parámetro `number`, default 12).

Ejemplo: `/api/playlist?s=corporate&limit=6`.

La respuesta se cachea en el edge de Vercel por 1 hora
(`Cache-Control: s-maxage=3600, stale-while-revalidate=86400`) para no
golpear la API de HookSounds en cada carga de página.

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

## Nota sobre CORS en los mp3 de HookSounds

El `<audio crossOrigin="anonymous">` necesita que los archivos mp3
respondan con `Access-Control-Allow-Origin` para que la Web Audio API
pueda leer sus frecuencias sin marcar el nodo como "tainted". Si algún
track de HookSounds no lo cumple, la app lo captura y muestra un
mensaje de error de reproducción en vez de romperse en silencio (ver
`handleStart` en `MusicPlayer.tsx`).
