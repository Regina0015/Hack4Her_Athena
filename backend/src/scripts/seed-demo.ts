/**
 * Inserta 3 pedidos DEMO "bonitos" en la colección `orders` para que la demo
 * se vea limpia, SIN borrar ni modificar los datos reales existentes.
 *
 * - Nombres de producto reales (nunca "NaN").
 * - Mezcla de Status (Entregado / Registrado / Rechazado) para cubrir los 3
 *   estados de la Gestión de pedidos.
 * - StatusSustitucion poblado (alimenta Dashboard, sustituciones reales y las
 *   sugerencias de Pythia/Gemini con historial).
 * - Los 3 comparten un customer_id demo → el Portal del cliente muestra
 *   inventario / crecer / encuesta con datos limpios.
 *
 * Idempotente: borra los demo previos (demo:true) antes de insertar.
 * Uso: npm run seed:demo
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { Order } from '../models/Order.js';

const CUSTOMER_DEMO = '9000000000000000001'; // "Cliente 000001" en el Portal

// IDs exactos de los pedidos demo. La limpieza idempotente borra SOLO estos IDs,
// nunca un filtro genérico que pudiera tocar los datos reales.
const DEMO_IDS = [
  '9000000000000000101',
  '9000000000000000102',
  '9000000000000000103',
];

/** Construye una línea de ProductosSolicitados. */
function linea(
  id_linea: number,
  sku: string,
  nombre: string,
  quantity: number,
  status: 'Registrado' | 'Entregado' | 'Rechazado',
) {
  return {
    id_linea,
    sku_solicitado: sku,
    nombre_sku_solicitado: nombre,
    Quantity: quantity,
    Status: status,
  };
}

/** Construye el objeto StatusSustitucion con las claves que leen las agregaciones. */
function sustitucion(opts: {
  id_linea: number;
  sku: string;
  nombre: string;
  skuCambio: string;
  nombreCambio: string;
}) {
  return {
    id_businessunit: 5,
    id_linea: opts.id_linea,
    sku_solicitado: opts.sku,
    sku_solicitado_hash: opts.sku,
    nombre_sku_solicitado: opts.nombre,
    sku_solicitado_cambio: opts.skuCambio,
    sku_solicitado_cambio_hash: opts.skuCambio,
    nombre_sku_solicitado_cambio: opts.nombreCambio,
  };
}

async function main() {
  await connectDB();

  // Guarda de seguridad: si la colección no tiene los datos reales (muchos más
  // que los 3 demo), abortamos para no operar sobre una base vacía/dañada.
  const totalActual = await Order.countDocuments();
  const noDemo = await Order.countDocuments({ id_pedido: { $nin: DEMO_IDS } });
  if (noDemo < 100) {
    console.error(
      `⛔ Abortado: la colección 'orders' solo tiene ${totalActual} documentos ` +
        `(${noDemo} no-demo). Parece que faltan los datos reales. ` +
        `Restaura el backup antes de correr el seed.`,
    );
    await disconnectDB();
    process.exit(1);
  }

  // Idempotencia SEGURA: borra SOLO los 3 IDs demo conocidos. Nunca usa un
  // filtro genérico (como { demo: true }) que pudiera afectar los datos reales.
  const borrados = await Order.deleteMany({ id_pedido: { $in: DEMO_IDS } });
  if (borrados.deletedCount) console.log(`🧹 ${borrados.deletedCount} pedidos demo previos eliminados`);

  const pedidos = [
    // #101 — parcial → entregado (entregadas + pendientes) + sustitución aplicada.
    {
      id_pedido: '9000000000000000101',
      customer_id: CUSTOMER_DEMO,
      fecha_entrega: '2026-06-05',
      Total: 1284.5,
      demo: true,
      ProductosSolicitados: [
        linea(900101, '3001', 'Coca-Cola Sin Azúcar 600 ml', 12, 'Entregado'),
        linea(900102, '3002', 'Ciel Agua Natural 1 L', 8, 'Entregado'),
        linea(900103, '3003', 'Fanta Naranja 600 ml', 6, 'Registrado'),
        linea(900104, '3004', 'Del Valle Néctar Mango 413 ml', 10, 'Registrado'),
      ],
      StatusSustitucion: sustitucion({
        id_linea: 900103,
        sku: '3003',
        nombre: 'Fanta Naranja 600 ml',
        skuCambio: '3010',
        nombreCambio: 'Sprite 600 ml',
      }),
    },
    // #102 — todo Registrado (pendiente puro) → genera sugerencia de Pythia/Gemini.
    {
      id_pedido: '9000000000000000102',
      customer_id: CUSTOMER_DEMO,
      fecha_entrega: '2026-06-06',
      Total: 968.0,
      demo: true,
      ProductosSolicitados: [
        linea(900201, '3003', 'Fanta Naranja 600 ml', 9, 'Registrado'),
        linea(900202, '3005', 'Powerade Mora Azul 500 ml', 6, 'Registrado'),
        linea(900203, '3006', 'Fuze Tea Durazno 600 ml', 12, 'Registrado'),
      ],
      // Misma sustitución Fanta→Sprite que #101: refuerza el patrón histórico.
      StatusSustitucion: sustitucion({
        id_linea: 900201,
        sku: '3003',
        nombre: 'Fanta Naranja 600 ml',
        skuCambio: '3010',
        nombreCambio: 'Sprite 600 ml',
      }),
    },
    // #103 — con una línea Rechazado + entregadas → cubre estado "rechazado".
    {
      id_pedido: '9000000000000000103',
      customer_id: CUSTOMER_DEMO,
      fecha_entrega: '2026-06-04',
      Total: 1550.75,
      demo: true,
      ProductosSolicitados: [
        linea(900301, '3001', 'Coca-Cola Sin Azúcar 600 ml', 24, 'Entregado'),
        linea(900302, '3007', 'Sidral Mundet Manzana 600 ml', 6, 'Entregado'),
        linea(900303, '3008', 'Topo Chico Agua Mineral 355 ml', 4, 'Rechazado'),
      ],
      StatusSustitucion: sustitucion({
        id_linea: 900303,
        sku: '3008',
        nombre: 'Topo Chico Agua Mineral 355 ml',
        skuCambio: '3002',
        nombreCambio: 'Ciel Agua Natural 1 L',
      }),
    },
  ];

  await Order.insertMany(pedidos);
  console.log(`✅ ${pedidos.length} pedidos demo insertados (customer_id ${CUSTOMER_DEMO})`);

  await disconnectDB();
}

main().catch(async (err) => {
  console.error('❌ Error en seed-demo:', err);
  await disconnectDB();
  process.exit(1);
});
