import { Request, Response, NextFunction } from "express";

/**
 * Lightweight auth middleware for the Express backend.
 *
 * The Next.js frontend authenticates users via NextAuth/Google OAuth.
 * After a successful session check it forwards the user's DB id in the
 * x-user-id header on every backend request.  The backend trusts this
 * value as an internal service-to-service contract.
 *
 * All requests missing this header are rejected with 401.
 */
export function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.headers["x-user-id"];

  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    res.status(401).json({ message: "Unauthorized: missing x-user-id header" });
    return;
  }

  res.locals.userId = userId.trim();
  next();
}
