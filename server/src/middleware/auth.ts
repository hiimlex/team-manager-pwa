import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  playerId: string;
  groupId: string;
  role: "admin" | "moderator" | "player";
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

// Never sign/verify tokens with a guessable fallback in production
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET não configurado");
  }
  return "dev-secret";
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, getJwtSecret()) as AuthPayload;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }

  try {
    req.auth = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export function requireRole(...roles: AuthPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: "Permissão negada" });
      return;
    }
    next();
  };
}

// Tokens are scoped to one group: reject routes addressing another group
export function requireOwnGroup(param = "groupId") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || req.params[param] !== req.auth.groupId) {
      res.status(403).json({ error: "Acesso negado a este grupo" });
      return;
    }
    next();
  };
}
