import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      message: "Validation error",
      errors: error.issues,
    });
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
}
