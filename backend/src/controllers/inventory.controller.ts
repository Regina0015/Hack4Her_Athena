import type { Request, Response } from 'express';
import { getInventory, getCriticalInventory } from '../services/inventory.service.js';

export async function listInventoryHandler(_req: Request, res: Response) {
  const data = await getInventory();
  res.json({ data });
}

export async function criticalInventoryHandler(_req: Request, res: Response) {
  const data = await getCriticalInventory();
  res.json({ data });
}
