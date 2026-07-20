import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    role: "patient" | "doctor" | "admin";
    phone?: string;
    city?: string;
    image?: string;
  };
  session?: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // Attach user and session details to request
    (req as AuthenticatedRequest).user = session.user as any;
    (req as AuthenticatedRequest).session = session.session as any;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ error: "Authentication check failed." });
  }
}

export function requireRole(role: "patient" | "doctor" | "admin") {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    if (authReq.user.role !== role && authReq.user.role !== "admin") {
      return res.status(403).json({
        error: `Forbidden. You do not have permission (${role} role required).`,
      });
    }

    next();
  };
}
