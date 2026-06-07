import { Substitution } from '../models/Substitution.js';

/** Acceso a datos de sustituciones históricas. */
export const substitutionRepository = {
  findByCustomer(customerId: string) {
    return Substitution.find({ customerId }).lean();
  },

  findBySkuSolicitado(skuSolicitado: string) {
    return Substitution.find({ skuSolicitado }).lean();
  },

  /** Cuenta cuántas veces cada SKU fue sustituido (propensión a sustitución). */
  async countBySkuSolicitado(): Promise<Record<string, number>> {
    const rows = await Substitution.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$skuSolicitado', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, r.count]));
  },

  /** Tasa de aceptación de un par (solicitado -> entregado) entre todos los clientes. */
  async parAcceptanceRate(skuSolicitado: string, skuEntregado: string): Promise<number | null> {
    const rows = await Substitution.find({ skuSolicitado, skuEntregado }).lean();
    if (rows.length === 0) return null;
    const aceptadas = rows.filter((r) => r.aceptado).length;
    return aceptadas / rows.length;
  },

  count() {
    return Substitution.countDocuments();
  },
};
