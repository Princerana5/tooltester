import { Request, Response, NextFunction } from 'express';
// Auth removed: open access. Everything passes through.
export function authMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next();
}
export function signToken(_payload: object) { return ''; }
