import { Schema, model, type InferSchemaType } from 'mongoose';

const productoSolicitadoSchema = new Schema(
  {
    id_linea: { type: Schema.Types.Mixed, default: null },
    sku_solicitado: { type: Schema.Types.Mixed, default: null },
    nombre_sku_solicitado: { type: String, default: '' },
    Quantity: { type: Number, default: 0 },
    Status: { type: String, default: '' },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    id_pedido: { type: String, default: '' },
    customer_id: { type: String, default: '' },
    fecha_entrega: { type: String, default: '' },
    Total: { type: Number, default: 0 },
    ProductosSolicitados: { type: [productoSolicitadoSchema], default: [] },
    StatusSustitucion: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: false, collection: 'orders', strict: false },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;
export const Order = model('Order', orderSchema);
