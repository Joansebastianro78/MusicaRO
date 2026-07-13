import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    hooksoundsConfigured: Boolean(process.env.HOOKSOUNDS_API_KEY && process.env.HOOKSOUNDS_API_TOKEN)
  });
}
