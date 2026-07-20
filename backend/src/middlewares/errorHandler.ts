import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface AppError extends Error {
  status?: number;
  details?: any;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  
  // Handled structured Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "Validation failed.",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // General server errors
  console.error("Centralized Error:", err);
  
  return res.status(status).json({
    success: false,
    error: err.message || "An unexpected server error occurred.",
    details: err.details || null,
  });
}
