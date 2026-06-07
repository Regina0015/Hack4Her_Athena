import type { Request, Response } from 'express';
import { getCustomerProfile } from '../services/customer.service.js';

export async function getProfileHandler(req: Request, res: Response) {
  const data = await getCustomerProfile(String(req.params.customerId));
  res.json({ data });
}
