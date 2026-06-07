import { Product } from '../models/Product.js';

/** Acceso a datos del catálogo de productos. */
export const productRepository = {
  findAll() {
    return Product.find().lean();
  },

  findBySku(sku: string) {
    return Product.findOne({ sku }).lean();
  },

  findBySkus(skus: string[]) {
    return Product.find({ sku: { $in: skus } }).lean();
  },

  /** Productos con stock por debajo del mínimo. */
  findCritical() {
    return Product.find({ $expr: { $lte: ['$stockActual', '$stockMinimo'] } }).lean();
  },

  /** Candidatos a sustituto: misma categoría/BU, con stock, distintos del solicitado. */
  findSubstituteCandidates(categoria: string, businessUnit: string, excludeSku: string) {
    return Product.find({
      sku: { $ne: excludeSku },
      stockActual: { $gt: 0 },
      $or: [{ categoria }, { businessUnit }],
    })
      .limit(10)
      .lean();
  },

  count() {
    return Product.countDocuments();
  },
};
