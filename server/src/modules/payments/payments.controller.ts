// server/src/modules/payments/payments.controller.ts

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/errorHandler";
import { isValidCalendarDate } from "../appointments/appointments.validation";
import { listPayments, getPaymentById, markPaymentPaid, getBillingSummary } from "./payments.service";

function parseId(idParam: string): number {
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    throw new AppError(400, "Invalid payment id.");
  }
  return id;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
    const status = statusParam === "PAID" || statusParam === "UNPAID" || statusParam === "VOID"
      ? statusParam
      : undefined;

    if (from && !isValidCalendarDate(from)) {
      throw new AppError(400, "from must be a valid date in YYYY-MM-DD format.");
    }
    if (to && !isValidCalendarDate(to)) {
      throw new AppError(400, "to must be a valid date in YYYY-MM-DD format.");
    }
    if (from && to && from > to) {
      throw new AppError(400, "from must be on or before to.");
    }
    if (statusParam && !status) {
      throw new AppError(400, "status must be UNPAID, PAID, or VOID.");
    }

    const payments = await listPayments({ from, to, status });
    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await getPaymentById(parseId(req.params.id));
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

export async function markPaid(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await markPaymentPaid(parseId(req.params.id));
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

export async function billingSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    if (from && !isValidCalendarDate(from)) {
      throw new AppError(400, "from must be a valid date in YYYY-MM-DD format.");
    }
    if (to && !isValidCalendarDate(to)) {
      throw new AppError(400, "to must be a valid date in YYYY-MM-DD format.");
    }
    if (from && to && from > to) {
      throw new AppError(400, "from must be on or before to.");
    }
    const summary = await getBillingSummary(from, to);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}
