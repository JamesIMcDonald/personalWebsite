import type { AuthClaims } from "../middleware/requireAuth";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

export {};