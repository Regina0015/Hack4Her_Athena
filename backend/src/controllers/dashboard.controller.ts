import type { Request, Response } from 'express';
import { getKpis, getAlerts } from '../services/dashboard.service.js';

export async function getKpisHandler(_req: Request, res: Response) {
  const data = await getKpis();
  res.json({ data });
}

export async function getAlertsHandler(_req: Request, res: Response) {
  const data = await getAlerts();
  res.json({ data });
}
