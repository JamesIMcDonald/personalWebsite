import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type JwtClaims = {
  sub: number | string;
  typ?: string;
  iat: number;
  exp: number;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  const token =
    req.cookies?.["__Secure-access"] ||
    req.cookies?.["access"] ||
    (header?.startsWith("Bearer ") ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const claims = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as JwtClaims;

    if (claims.typ && claims.typ !== "access") {
      return res.status(401).json({ error: "Wrong token type" });
    }

    (req as any).auth = claims;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}