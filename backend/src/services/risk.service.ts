import type { RiskBand } from '../dtos/domain.js';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function bandFromScore(score: number): RiskBand {
  if (score < 33) return 'bajo';
  if (score < 66) return 'medio';
  return 'alto';
}

interface RiskInput {
  stockActual: number;
  stockMinimo: number;
  quantitySolicitada: number;
  /** Cuántas veces este SKU fue sustituido históricamente. */
  vecesSustituido: number;
}

/**
 * Calcula el riesgo de sustitución de una línea (0..100).
 *   base = 100 * (1 - stockRatio)
 *   stockRatio = stockActual / max(quantitySolicitada, stockMinimo, 1)
 * Se agrega un bonus por propensión histórica a sustitución (máx +20).
 */
export function calculateLineRisk(input: RiskInput): number {
  const denom = Math.max(input.quantitySolicitada, input.stockMinimo, 1);
  const stockRatio = clamp(input.stockActual / denom, 0, 1);
  const base = 100 * (1 - stockRatio);

  // Propensión: cada sustitución histórica suma, saturando en +20.
  const bonus = clamp(input.vecesSustituido * 4, 0, 20);

  return Math.round(clamp(base + bonus, 0, 100));
}
