import { Schema, model, type InferSchemaType } from 'mongoose';

/** Catálogo de productos derivado de los SKU vistos en los CSV. Stock simulado para demo. */
const productSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, index: true },
    nombre: { type: String, default: '' },
    categoria: { type: String, default: '', index: true },
    businessUnit: { type: String, default: '' },
    stockActual: { type: Number, default: 0 },
    stockMinimo: { type: Number, default: 0 },
    consumoPromedioSemanal: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'products' },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;
export const Product = model('Product', productSchema);
