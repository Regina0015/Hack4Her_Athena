/**
 * Inserta pedidos DEMO EXTRA y VARIADOS en `orders` para que la demo muestre
 * datos diferentes (varios clientes, distintos estados, productos y montos).
 *
 * ⚠️ SEGURIDAD: solo opera sobre los id_pedido demo-extra listados aquí
 * (prefijo 90000000000000002/3/4). Para ser idempotente, borra SOLO esos IDs
 * exactos y los reinserta. NUNCA usa un filtro genérico ni toca datos reales,
 * y aborta si la colección no tiene los datos reales.
 *
 * Uso: npm run seed:demo:extra
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { Order } from '../models/Order.js';
import { customerRepository } from '../repositories/customer.repository.js';

/** Construye una línea de ProductosSolicitados. */
function linea(
  id_linea: number,
  sku: string,
  nombre: string,
  quantity: number,
  status: 'Registrado' | 'Entregado' | 'Rechazado',
) {
  return { id_linea, sku_solicitado: sku, nombre_sku_solicitado: nombre, Quantity: quantity, Status: status };
}

/** StatusSustitucion poblado con las claves que leen las agregaciones. */
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

// Clientes demo variados (aparecen como "Cliente <últimos 6 dígitos>").
const C2 = '9000000000000000002'; // Cliente 000002
const C3 = '9000000000000000003'; // Cliente 000003
const C4 = '9000000000000000004'; // Cliente 000004

const pedidos = [
  // ===== Cliente 000002 — casi todo entregado, 1 rechazo (score ~90%) =====
  {
    id_pedido: '9000000000000000201',
    customer_id: C2,
    fecha_entrega: '2026-06-03',
    Total: 2310.0,
    demo: true,
    ProductosSolicitados: [
      linea(900401, '3020', 'Sabritas Original 45 g', 30, 'Entregado'),
      linea(900402, '3021', 'Doritos Nacho 62 g', 24, 'Entregado'),
      linea(900403, '3022', 'Coca-Cola 600 ml', 36, 'Entregado'),
      linea(900404, '3023', 'Galletas Emperador Chocolate', 18, 'Entregado'),
      linea(900405, '3028', 'Chicles Trident Menta', 12, 'Entregado'),
      linea(900406, '3029', 'Paletas Payaso 24 pzas', 8, 'Entregado'),
      linea(900407, '3048', 'Mazapán De la Rosa 30 pzas', 10, 'Entregado'),
      linea(900408, '3049', 'Pingüinos Marinela 2 pzas', 14, 'Entregado'),
      linea(900409, '3050', 'Gansito Marinela', 9, 'Rechazado'),
    ],
    StatusSustitucion: sustitucion({
      id_linea: 900409,
      sku: '3050',
      nombre: 'Gansito Marinela',
      skuCambio: '3049',
      nombreCambio: 'Pingüinos Marinela 2 pzas',
    }),
  },
  // ===== Cliente 000002 — pendiente grande (varias líneas por surtir) =====
  {
    id_pedido: '9000000000000000202',
    customer_id: C2,
    fecha_entrega: '2026-06-07',
    Total: 1789.9,
    demo: true,
    ProductosSolicitados: [
      linea(900501, '3024', 'Agua Ciel 600 ml', 48, 'Registrado'),
      linea(900502, '3025', 'Jugo Del Valle Durazno 1 L', 12, 'Registrado'),
      linea(900503, '3026', 'Powerade Naranja 500 ml', 18, 'Registrado'),
    ],
    StatusSustitucion: sustitucion({
      id_linea: 900501,
      sku: '3024',
      nombre: 'Agua Ciel 600 ml',
      skuCambio: '3027',
      nombreCambio: 'Agua Ciel Mineralizada 600 ml',
    }),
  },

  // ===== Cliente 000003 — parcial (mitad entregado, mitad pendiente) =====
  {
    id_pedido: '9000000000000000301',
    customer_id: C3,
    fecha_entrega: '2026-06-05',
    Total: 3120.25,
    demo: true,
    ProductosSolicitados: [
      linea(900601, '3030', 'Leche Lala Entera 1 L', 24, 'Entregado'),
      linea(900602, '3031', 'Yoghurt Danone Fresa 1 kg', 12, 'Entregado'),
      linea(900603, '3032', 'Pan Bimbo Blanco Grande', 20, 'Registrado'),
      linea(900604, '3033', 'Huevo San Juan 18 pzas', 15, 'Registrado'),
    ],
    StatusSustitucion: sustitucion({
      id_linea: 900603,
      sku: '3032',
      nombre: 'Pan Bimbo Blanco Grande',
      skuCambio: '3034',
      nombreCambio: 'Pan Bimbo Integral Grande',
    }),
  },
  // ===== Cliente 000003 — con rechazo (producto no disponible) =====
  {
    id_pedido: '9000000000000000302',
    customer_id: C3,
    fecha_entrega: '2026-06-02',
    Total: 845.5,
    demo: true,
    ProductosSolicitados: [
      linea(900701, '3035', 'Cerveza Tecate Light 355 ml', 24, 'Entregado'),
      linea(900702, '3036', 'Botana Cacahuates Japonés 120 g', 10, 'Rechazado'),
    ],
    StatusSustitucion: sustitucion({
      id_linea: 900702,
      sku: '3036',
      nombre: 'Botana Cacahuates Japonés 120 g',
      skuCambio: '3037',
      nombreCambio: 'Cacahuates Enchilados 120 g',
    }),
  },

  // ===== Cliente 000004 — pedido grande con 1 rechazo (score ~85%) =====
  {
    id_pedido: '9000000000000000401',
    customer_id: C4,
    fecha_entrega: '2026-06-06',
    Total: 5420.0,
    demo: true,
    ProductosSolicitados: [
      linea(900801, '3040', 'Coca-Cola 2.5 L', 60, 'Entregado'),
      linea(900802, '3041', 'Sprite 2.5 L', 40, 'Entregado'),
      linea(900803, '3042', 'Fanta Naranja 2.5 L', 40, 'Entregado'),
      linea(900804, '3043', 'Agua Ciel 1 L', 80, 'Entregado'),
      linea(900805, '3044', 'Fuze Tea Limón 600 ml', 30, 'Entregado'),
      linea(900806, '3051', 'Jumex Mango 1 L', 24, 'Rechazado'),
    ],
    StatusSustitucion: sustitucion({
      id_linea: 900806,
      sku: '3051',
      nombre: 'Jumex Mango 1 L',
      skuCambio: '3025',
      nombreCambio: 'Jugo Del Valle Durazno 1 L',
    }),
  },
  // ===== Cliente 000004 — pendiente pequeño, dispara sugerencia de Pythia =====
  {
    id_pedido: '9000000000000000402',
    customer_id: C4,
    fecha_entrega: '2026-06-08',
    Total: 410.0,
    demo: true,
    ProductosSolicitados: [
      linea(900901, '3045', 'Sidral Mundet 2.5 L', 12, 'Registrado'),
      linea(900902, '3046', 'Delaware Punch 600 ml', 18, 'Registrado'),
    ],
    StatusSustitucion: sustitucion({
      id_linea: 900901,
      sku: '3045',
      nombre: 'Sidral Mundet 2.5 L',
      skuCambio: '3047',
      nombreCambio: 'Manzanita Sol 2.5 L',
    }),
  },
];

/**
 * Deriva y PERSISTE en `customerpreferences` las preferencias de cada cliente
 * DEMO a partir de sus propios pedidos (sus StatusSustitucion). Solo escribe
 * documentos de clientes demo — nunca toca preferencias de clientes reales.
 */
async function persistDemoPreferences() {
  // Agrupa por cliente demo sus pares (solicitado → sustituto).
  const porCliente = new Map<
    string,
    Map<string, { skuSolicitado: string; skuPreferidoSustituto: string; nombreSustituto: string; aceptaciones: number; rechazos: number; score: number }>
  >();
  const conteoPorCliente = new Map<string, Map<string, { sku: string; nombre: string; conteo: number }>>();

  for (const p of pedidos) {
    const cid = p.customer_id;
    // Productos más solicitados (para el doc de preferencias).
    const cont = conteoPorCliente.get(cid) ?? new Map();
    for (const l of p.ProductosSolicitados) {
      const e = cont.get(l.sku_solicitado) ?? { sku: l.sku_solicitado, nombre: l.nombre_sku_solicitado, conteo: 0 };
      e.conteo += l.Quantity || 1;
      cont.set(l.sku_solicitado, e);
    }
    conteoPorCliente.set(cid, cont);

    // Par de sustitución de este pedido.
    const ss = p.StatusSustitucion as Record<string, unknown>;
    const skuSol = String(ss?.sku_solicitado ?? '');
    const skuCambio = String(ss?.sku_solicitado_cambio ?? '');
    if (!skuSol || !skuCambio) continue;
    const pares = porCliente.get(cid) ?? new Map();
    const key = `${skuSol}->${skuCambio}`;
    const par = pares.get(key) ?? {
      skuSolicitado: skuSol,
      skuPreferidoSustituto: skuCambio,
      nombreSustituto: String(ss?.nombre_sku_solicitado_cambio ?? ''),
      aceptaciones: 0,
      rechazos: 0,
      score: 1,
    };
    par.aceptaciones += 1;
    pares.set(key, par);
    porCliente.set(cid, pares);
  }

  const clientes = new Set(pedidos.map((p) => p.customer_id));
  for (const cid of clientes) {
    const preferencias = [...(porCliente.get(cid)?.values() ?? [])];
    const productosMasSolicitados = [...(conteoPorCliente.get(cid)?.values() ?? [])]
      .sort((a, b) => b.conteo - a.conteo)
      .slice(0, 10);
    await customerRepository.upsertPreference(cid, {
      tasaAceptacionGlobal: 1,
      totalSustituciones: preferencias.reduce((s, p) => s + p.aceptaciones, 0),
      preferencias,
      productosMasSolicitados,
    });
  }
  console.log(`💾 Preferencias persistidas para ${clientes.size} clientes demo.`);
}

async function main() {
  await connectDB();

  // Guarda de seguridad: nunca operar si faltan los datos reales.
  const total = await Order.countDocuments();
  if (total < 1000) {
    console.error(`⛔ Abortado: la colección 'orders' solo tiene ${total} documentos. Restaura el backup primero.`);
    await disconnectDB();
    process.exit(1);
  }

  // Idempotente SEGURO: borra SOLO los IDs demo-extra de esta lista (nunca un
  // filtro genérico) y los reinserta con su contenido actualizado.
  const ids = pedidos.map((p) => p.id_pedido);
  const borrados = await Order.deleteMany({ id_pedido: { $in: ids } });
  if (borrados.deletedCount) console.log(`🔄 ${borrados.deletedCount} pedidos demo extra previos reemplazados`);
  await Order.insertMany(pedidos);
  console.log(`✅ ${pedidos.length} pedidos demo extra insertados.`);

  // Persiste las preferencias SOLO de los clientes demo.
  await persistDemoPreferences();

  console.log(`Total de pedidos ahora: ${await Order.countDocuments()}`);
  await disconnectDB();
}

main().catch(async (err) => {
  console.error('❌ Error en seed-demo-extra:', err);
  await disconnectDB();
  process.exit(1);
});
