import { Schema, model, type InferSchemaType } from 'mongoose';

/** Línea de pedido (de OrderDetails.csv). */
const orderDetailSchema = new Schema(
  {
    idLinea: { type: String, required: true, index: true },
    idPedido: { type: String, required: true, index: true },
    skuSolicitado: { type: String, required: true, index: true },
    nombreSku: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    status: { type: String, default: '' },

    // Campos operativos para el flujo de aprobación (no vienen del CSV).
    skuSustituto: { type: String, default: null },
    nombreSkuSustituto: { type: String, default: null },
    substitutionStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
      index: true,
    },
  },
  { timestamps: true, collection: 'orderdetails' },
);

export type OrderDetailDoc = InferSchemaType<typeof orderDetailSchema>;
export const OrderDetail = model('OrderDetail', orderDetailSchema);
