import type { Request, Response } from 'express';
import { z } from 'zod';
import { getPendingForCustomer, savePreferences } from '../services/portal.service.js';

export async function pendingHandler(req: Request, res: Response) {
  const data = await getPendingForCustomer(String(req.params.customerId));
  res.json({ data });
}

const preferencesSchema = z.object({
  preferencias: z
    .array(
      z.object({
        skuSolicitado: z.string().min(1),
        skuPreferidoSustituto: z.string().min(1),
        nombreSustituto: z.string().optional(),
      }),
    )
    .default([]),
});

export async function savePreferencesHandler(req: Request, res: Response) {
  const body = preferencesSchema.parse(req.body);
  const data = await savePreferences(String(req.params.customerId), body.preferencias);
  res.json({ data });
}
