import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  listOrders,
  getOrderStats,
  getOrderDetail,
  approveSubstitution,
  rejectSubstitution,
} from '../services/order.service.js';
import { recommendForOrder } from '../services/recommendation.service.js';

export async function listOrdersHandler(req: Request, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 25);
  const risk = typeof req.query.risk === 'string' ? req.query.risk : undefined;
  const { orders, meta } = await listOrders(page, limit, risk);
  res.json({ data: orders, meta });
}

export async function getOrderStatsHandler(_req: Request, res: Response) {
  const data = await getOrderStats();
  res.json({ data });
}

export async function getOrderHandler(req: Request, res: Response) {
  const data = await getOrderDetail(String(req.params.idPedido));
  res.json({ data });
}

export async function getRecommendationsHandler(req: Request, res: Response) {
  const idPedido = String(req.params.idPedido);
  const recomendaciones = await recommendForOrder(idPedido);
  res.json({ data: recomendaciones });
}

const approveSchema = z.object({
  skuSustituto: z.string().min(1),
  nombreSustituto: z.string().default(''),
});

export async function approveHandler(req: Request, res: Response) {
  const body = approveSchema.parse(req.body);
  const data = await approveSubstitution(
    String(req.params.idPedido),
    String(req.params.idLinea),
    body.skuSustituto,
    body.nombreSustituto,
  );
  res.json({ data });
}

export async function rejectHandler(req: Request, res: Response) {
  const data = await rejectSubstitution(String(req.params.idPedido), String(req.params.idLinea));
  res.json({ data });
}
