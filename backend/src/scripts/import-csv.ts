/**
 * ⚠️ IMPORTACIÓN DESHABILITADA.
 *
 * Los datos del hackathon ya están cargados en MongoDB Atlas
 * (base ArcaContinental_Hackathon, colección `orders`) por el equipo.
 *
 * Cada pedido trae embebidos `ProductosSolicitados` (líneas Registrado/Entregado)
 * y `StatusSustitucion` (el cambio que ocurrió). NO existe el esquema de 3 CSV
 * separados que este script asumía, por lo que importar borraría/duplicaría datos.
 *
 * Si en el futuro hace falta re-importar, hacerlo contra una base de staging,
 * nunca contra la base con los datos reales.
 */
console.error(
  '❌ La importación está deshabilitada: los datos ya existen en la base.\n' +
    '   No se ejecutó ninguna operación. Si realmente necesitas importar,\n' +
    '   hazlo manualmente contra una base de staging.',
);
process.exit(1);
