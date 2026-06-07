import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  getPendingForCustomer,
  savePreferences,
  getCustomerInventory,
  getCustomerGrowth,
  saveSurvey,
} from '../services/portal.service.js';

export async function pendingHandler(req: Request, res: Response) {
  const data = await getPendingForCustomer(String(req.params.customerId));
  res.json({ data });
}

export async function inventoryHandler(req: Request, res: Response) {
  const data = await getCustomerInventory(String(req.params.customerId));
  res.json({ data });
}

export async function growthHandler(req: Request, res: Response) {
  const data = await getCustomerGrowth(String(req.params.customerId));
  res.json({ data });
}

const surveySchema = z.object({
  pedidoCompleto: z.boolean().nullable().default(null),
  sustitucionAdecuada: z.boolean().nullable().default(null),
  entregaATiempo: z.boolean().nullable().default(null),
  estrellas: z.number().min(0).max(5).default(0),
  comentario: z.string().default(''),
});

export async function surveyHandler(req: Request, res: Response) {
  const body = surveySchema.parse(req.body);
  const data = await saveSurvey(String(req.params.customerId), body);
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
