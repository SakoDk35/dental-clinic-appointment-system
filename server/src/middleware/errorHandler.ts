// server/src/middleware/errorHandler.ts
//
// One consistent error shape for the whole API, per the approved rule:
// { "success": false, "message": "Human readable error message" }
//
// Route/service code throws AppError for anything expected (bad input,
// wrong password, not found, etc.) with the right HTTP status attached.
// Anything else (a real bug, a DB hiccup) falls through to the generic
// 500 branch below so we never leak internals to the client.

import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong on our end. Please try again.",
  });
}
