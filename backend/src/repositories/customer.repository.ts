import { CustomerPreference } from '../models/CustomerPreference.js';

/** Datos planos para upsert (sin los tipos DocumentArray de Mongoose). */
export interface PreferenceInput {
  tasaAceptacionGlobal?: number;
  totalSustituciones?: number;
  preferencias?: {
    skuSolicitado: string;
    skuPreferidoSustituto: string;
    nombreSustituto?: string;
    aceptaciones: number;
    rechazos: number;
    score: number;
  }[];
  productosMasSolicitados?: { sku: string; nombre: string; conteo: number }[];
}

/** Acceso a datos de preferencias del cliente. */
export const customerRepository = {
  findPreference(customerId: string) {
    return CustomerPreference.findOne({ customerId }).lean();
  },

  upsertPreference(customerId: string, data: PreferenceInput) {
    return CustomerPreference.findOneAndUpdate(
      { customerId },
      { $set: { ...data, customerId } },
      { upsert: true, new: true },
    ).lean();
  },

  count() {
    return CustomerPreference.countDocuments();
  },
};
