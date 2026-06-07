import { Schema, model, type InferSchemaType } from 'mongoose';

/** Preferencias calculadas por el motor de aprendizaje a partir del historial. */
const preferenciaParSchema = new Schema(
  {
    skuSolicitado: String,
    skuPreferidoSustituto: String,
    nombreSustituto: String,
    aceptaciones: { type: Number, default: 0 },
    rechazos: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
  },
  { _id: false },
);

const productoSolicitadoSchema = new Schema(
  { sku: String, nombre: String, conteo: { type: Number, default: 0 } },
  { _id: false },
);

const customerPreferenceSchema = new Schema(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    tasaAceptacionGlobal: { type: Number, default: 0 },
    totalSustituciones: { type: Number, default: 0 },
    preferencias: { type: [preferenciaParSchema], default: [] },
    productosMasSolicitados: { type: [productoSolicitadoSchema], default: [] },
  },
  { timestamps: true, collection: 'customerpreferences' },
);

export type CustomerPreferenceDoc = InferSchemaType<typeof customerPreferenceSchema>;
export const CustomerPreference = model('CustomerPreference', customerPreferenceSchema);
