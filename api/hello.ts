import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ 
    message: "Hello from Vercel API!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}