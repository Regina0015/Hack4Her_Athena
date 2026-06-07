import type { Request, Response } from 'express';
import { getCustomerProfile } from '../services/customer.service.js';
import { getCustomerPrediction } from '../services/prediction.service.js';

export async function getProfileHandler(req: Request, res: Response) {
  const data = await getCustomerProfile(String(req.params.customerId));
  res.json({ data });
}

export async function getPredictionHandler(req: Request, res: Response) {
  const data = await getCustomerPrediction(String(req.params.customerId));
  res.json({ data });
}
