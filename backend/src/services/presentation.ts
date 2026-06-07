/**
 * Deriva una "presentación" (tamaño + tipo de envase) ESTABLE a partir del SKU.
 *
 * Los datos reales no guardan presentación: muchos SKU distintos comparten el
 * mismo nombre truncado (p. ej. varias "Coca - Cola"). Para diferenciarlos en
 * la UI, generamos una presentación determinística por SKU — el mismo SKU
 * siempre obtiene la misma etiqueta — y solo la añadimos cuando el nombre NO
 * incluye ya un tamaño (para no duplicar, p. ej. "Yogurt ... 180 Gr.").
 */

// Tamaños chicos → admiten lata; tamaños grandes → solo PET/vidrio (no lata).
const TAMANOS_CHICOS = ['355 ml', '500 ml', '600 ml'];
const TAMANOS_GRANDES = ['1 L', '1.5 L', '2 L', '2.5 L', '3 L'];
const ENVASES_CHICOS = ['PET', 'Lata', 'Vidrio Retornable', 'Vidrio Desechable'];
const ENVASES_GRANDES = ['PET', 'Vidrio Retornable', 'Vidrio Desechable'];

/** Hash entero simple y estable de un string (SKU). */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** ¿El nombre ya trae un tamaño/medida? (ml, l, gr, kg, pzas, packs, etc.) */
function tienePresentacion(nombre: string): boolean {
  // Medidas: "600 ml", "1.5 L", "180 Gr.", "63 Gr.", "18 pzas"…
  if (/\b\d+([.,]\d+)?\s?(ml|l|lt|lts|litro|litros|gr|g|kg|grs|pzas?|piezas?|u|unidades?)\b/i.test(nombre)) {
    return true;
  }
  // Packs: "(4x25u)", "12 Unidades", "Paquete"…
  if (/\(\s*\d+\s*x\s*\d+/i.test(nombre) || /\bpaquete\b/i.test(nombre)) return true;
  return false;
}

/** Presentación estable (tamaño + envase coherente) derivada del SKU. */
export function presentacionFromSku(sku: string): string {
  const h = hashStr(sku);
  // El bit de paridad decide chico vs. grande, manteniéndolo estable por SKU.
  const esChico = h % 2 === 0;
  const tamanos = esChico ? TAMANOS_CHICOS : TAMANOS_GRANDES;
  const envases = esChico ? ENVASES_CHICOS : ENVASES_GRANDES;
  const tam = tamanos[h % tamanos.length];
  const env = envases[Math.floor(h / tamanos.length) % envases.length];
  return `${tam} ${env}`;
}

/**
 * Devuelve el nombre con presentación. Si el nombre ya incluye un tamaño, se
 * deja igual; si no, se le añade la presentación derivada del SKU.
 */
export function nombreConPresentacion(sku: string, nombre: string): string {
  const limpio = String(nombre ?? '').replace(/\s+/g, ' ').trim();
  if (!limpio || limpio === 'NaN') return limpio;
  if (tienePresentacion(limpio)) return limpio;
  return `${limpio} ${presentacionFromSku(sku)}`;
}
