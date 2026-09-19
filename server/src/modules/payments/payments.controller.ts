// server/src/modules/payments/payments.controller.ts

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/errorHandler";
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
    const status = req.query.status === "PAID" || req.query.status === "UNPAID" ? req.query.status : undefined;

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
    const summary = await getBillingSummary(from, to);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}
