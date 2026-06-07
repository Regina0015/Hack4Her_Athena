import { Schema, model, type InferSchemaType } from 'mongoose';

/** Respuesta de la encuesta de satisfacción del portal del cliente. */
const surveySchema = new Schema(
  {
    customerId: { type: String, required: true, index: true },
    pedidoCompleto: { type: Boolean, default: null },
    sustitucionAdecuada: { type: Boolean, default: null },
    entregaATiempo: { type: Boolean, default: null },
    estrellas: { type: Number, default: 0 },
    comentario: { type: String, default: '' },
  },
  { timestamps: true, collection: 'surveys' },
);

export type SurveyDoc = InferSchemaType<typeof surveySchema>;
export const Survey = model('Survey', surveySchema);
