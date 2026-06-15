import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";

function getUniqueFields(target: unknown) {
  if (Array.isArray(target)) {
    return target.filter((field): field is string => typeof field === "string");
  }

  if (typeof target === "string") {
    return [target];
  }

  return [];
}

function getUniqueConstraintResponse(fields: string[]) {
  if (fields.includes("rut")) {
    return {
      field: "rut",
      message: "El RUT ya se encuentra registrado.",
    };
  }

  if (fields.includes("email")) {
    return {
      field: "email",
      message: "El correo ya se encuentra registrado.",
    };
  }

  return {
    field: fields[0] || "unknown",
    message: "El registro ya existe.",
  };
}

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

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const uniqueFields = getUniqueFields(error.meta?.target);
    const uniqueConstraint = getUniqueConstraintResponse(uniqueFields);

    return res.status(409).json({
      ok: false,
      message: uniqueConstraint.message,
      field: uniqueConstraint.field,
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
