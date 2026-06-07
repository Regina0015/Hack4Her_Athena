import { Schema, model, type InferSchemaType } from 'mongoose';

/** Sustitución histórica (de Resultados.csv). Corazón del aprendizaje de preferencias. */
const substitutionSchema = new Schema(
  {
    idBusinessUnit: { type: Number, default: 0 },
    idLinea: { type: String, default: '' },
    idPedido: { type: String, required: true, index: true },
    customerId: { type: String, default: '', index: true },
    skuSolicitado: { type: String, required: true, index: true },
    nombreSkuSolicitado: { type: String, default: '' },
    skuEntregado: { type: String, required: true, index: true },
    nombreSkuEntregado: { type: String, default: '' },
    aceptado: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'substitutions' },
);

export type SubstitutionDoc = InferSchemaType<typeof substitutionSchema>;
export const Substitution = model('Substitution', substitutionSchema);
