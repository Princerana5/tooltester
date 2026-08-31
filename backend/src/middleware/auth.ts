import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if (apiKey && env.apiKey && apiKey === env.apiKey) return next();
  const hdr = req.headers.authorization;
  if (!hdr || !hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try { (req as any).user = jwt.verify(hdr.slice(7), env.JWT_SECRET); next(); } catch { res.status(401).json({ error: 'Invalid token' }); }
}
export function signToken(payload: object) { return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as any); }
