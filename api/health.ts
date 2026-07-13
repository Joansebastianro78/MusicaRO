import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    providers: {
      // Audius needs no credentials — it's always available.
      audius: true,
      jamendo: Boolean(process.env.JAMENDO_CLIENT_ID)
    }
  });
}
