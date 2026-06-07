import type { PipelineStage } from 'mongoose';
import { Order } from '../models/Order.js';

export const orderRepository = {
  findAll(filter: Record<string, unknown> = {}, skip = 0, limit = 50) {
    return Order.find(filter).skip(skip).limit(limit).lean();
  },

  count(filter: Record<string, unknown> = {}) {
    return Order.countDocuments(filter);
  },

  findById(id_pedido: string) {
    return Order.findOne({ id_pedido }).lean();
  },

  findByCustomer(customer_id: string, limit = 100) {
    return Order.find({ customer_id }).limit(limit).lean();
  },

  distinctCustomers() {
    return Order.distinct('customer_id');
  },

  /** Agregación arbitraria sobre la colección de pedidos. */
  aggregate(pipeline: PipelineStage[]) {
    return Order.aggregate(pipeline).allowDiskUse(true);
  },
};
