/**
 * Ajusta el stock de algunos productos para forzar escenarios de riesgo en la demo,
 * y marca algunas líneas como sustitución "pending" para poblar el portal del cliente.
 *
 * Uso: npm run seed:stock
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';
import { OrderDetail } from '../models/OrderDetail.js';

async function main() {
  await connectDB();

  // Pone a la mitad de los productos en stock crítico (debajo del mínimo).
  const productos = await Product.find().lean();
  let criticos = 0;
  for (let i = 0; i < productos.length; i += 2) {
    await Product.updateOne(
      { _id: productos[i]._id },
      { $set: { stockActual: Math.floor(Math.random() * 20), stockMinimo: 30 } },
    );
    criticos++;
  }
  console.log(`✅ ${criticos} productos puestos en stock crítico`);

  // Marca como pending las primeras 10 líneas cuyo SKU quedó sin stock.
  const skusCriticos = (await Product.find({ stockActual: { $lte: 0 } }).select('sku nombre').lean());
  const skuSet = new Map(skusCriticos.map((p) => [p.sku, p.nombre]));
  const lineas = await OrderDetail.find({ skuSolicitado: { $in: [...skuSet.keys()] } }).limit(10);
  for (const l of lineas) {
    l.substitutionStatus = 'pending';
    await l.save();
  }
  console.log(`✅ ${lineas.length} líneas marcadas como sustitución pendiente`);

  await disconnectDB();
}

main().catch(async (err) => {
  console.error('❌ Error en seed:', err);
  await disconnectDB();
  process.exit(1);
});
