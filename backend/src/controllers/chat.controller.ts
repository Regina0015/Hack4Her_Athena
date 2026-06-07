import type { Request, Response } from 'express';
import { z } from 'zod';
import { chatWithPythia } from '../services/chat.service.js';

const chatSchema = z.object({
  message: z.string().min(1).max(500),
  mode: z.enum(['admin', 'cliente']).default('admin'),
});

export async function chatHandler(req: Request, res: Response) {
  const { message, mode } = chatSchema.parse(req.body);
  const data = await chatWithPythia(message, mode);
  res.json({ data });
}
