# Immersive Music Player

Reproductor de música inmersivo: backend Express + TypeScript sirviendo
una playlist, y un frontend React + TypeScript + Tailwind que la
reproduce con un visualizador de audio en tiempo real (Web Audio API +
canvas) y transiciones animadas con Framer Motion.

## Estructura

```
immersive-music-app/
├── server/                  # API Express + TypeScript
│   └── src/
│       ├── types/track.ts
│       ├── data/playlist.ts
│       └── index.ts
└── client/                  # React + TypeScript + Tailwind
    └── src/
        ├── types/track.ts
        ├── hooks/useAudioAnalyser.ts
        ├── components/
        │   ├── MusicPlayer.tsx
        │   ├── StartOverlay.tsx
        │   └── AudioVisualizer.tsx
        ├── App.tsx
        └── main.tsx
```

## 1. Levantar el backend

```bash
cd server
npm install
npm run dev        # http://localhost:4000
```

Verifica que funciona: `curl http://localhost:4000/api/playlist`
debe devolver el array de tracks.

Por defecto el CORS solo permite `http://localhost:5173` (el puerto de
Vite). Si cambias el puerto del frontend, ajusta `CLIENT_ORIGIN` como
variable de entorno:

```bash
CLIENT_ORIGIN=http://localhost:3000 npm run dev
```

## 2. Levantar el frontend

```bash
cd client
npm install
cp .env.example .env    # define VITE_API_URL=http://localhost:4000
npm run dev              # http://localhost:5173
```

El componente `MusicPlayer` lee `VITE_API_URL` para hacer `fetch` al
endpoint `/api/playlist` del backend. Mientras ambos procesos corran en
paralelo (dos terminales), el frontend consume los datos del backend
automáticamente.

## Cómo conectan las dos partes

1. Al montar `MusicPlayer`, un `useEffect` hace `fetch(`${VITE_API_URL}/api/playlist`)`
   y guarda el resultado tipado como `Track[]` en estado.
2. El backend responde el array JSON tal cual gracias a `cors()`
   configurado con el origen del frontend — sin esto el navegador
   bloquea la respuesta.
3. El `<audio>` reproduce `track.audioUrl` directamente desde donde sea
   que lo sirvas (S3, un CDN, etc.), **no** desde el propio backend
   Express — el backend solo entrega los metadatos de la playlist.

## Nota importante sobre `audioUrl`

Los datos de ejemplo en `server/src/data/playlist.ts` usan URLs
placeholder (`cdn.example.com`) que no existen. Reemplázalas por
archivos de audio reales (mp3/ogg) alojados en un sitio que:

- Sirva el archivo con `Access-Control-Allow-Origin` habilitado (igual
  que el backend), porque el `<audio crossOrigin="anonymous">` lo
  necesita para que la Web Audio API pueda leer sus frecuencias sin que
  el navegador marque el nodo como "tainted".
- Use HTTPS si vas a desplegar el frontend en HTTPS.

Buenas fuentes rápidas para pruebas: tus propios archivos en un bucket
S3/Cloudflare R2 con CORS abierto, o pistas royalty-free de sitios como
Free Music Archive.

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

## Producción

```bash
# backend
cd server && npm run build && npm start

# frontend
cd client && npm run build   # genera client/dist, listo para servir estático
```

Recuerda apuntar `VITE_API_URL` (build-time) y `CLIENT_ORIGIN` del
backend a los dominios reales de producción.
