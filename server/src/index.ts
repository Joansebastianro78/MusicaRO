import express, { Request, Response } from 'express';
import cors from 'cors';
import { playlist } from './data/playlist';
import { Track } from './types/track';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
app.use(express.json());

app.get('/api/playlist', (_req: Request, res: Response<Track[]>) => {
  res.json(playlist);
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🎵 API listening on http://localhost:${PORT}`);
  console.log(`   CORS allowed origin: ${CLIENT_ORIGIN}`);
});
