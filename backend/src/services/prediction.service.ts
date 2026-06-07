/**
 * Predicción de reabasto por cliente — "Pythia anticipa".
 *
 * Honesto y basado en datos reales: los pedidos NO tienen fecha válida
 * (fecha_entrega es "00:00.0"/null), así que no se predicen fechas exactas.
 * En su lugar extrapolamos el CONSUMO histórico real del cliente:
 *
 *   consumoSemanal      = unidades históricas del producto / 12 semanas
 *   semanasParaReabasto = unidadesPendientes / consumoSemanal
 *
 * La "confianza" comunica cuánta evidencia respalda la estimación (más líneas
 * históricas del producto → más confianza), para no fingir certeza.
 */
import { aggregateCustomerProducts } from './portal.service.js';
import { nombreConPresentacion } from './presentation.js';
import type { CustomerPrediction, ReabastoPrediccion, RiskBand } from '../dtos/domain.js';

const SEMANAS_HISTORICO = 12; // misma ventana que inventory.service.ts

function urgenciaFromSemanas(semanas: number): RiskBand {
  if (semanas <= 1) return 'alto';
  if (semanas <= 3) return 'medio';
  return 'bajo';
}

export async function getCustomerPrediction(customerId: string): Promise<CustomerPrediction> {
  const productos = await aggregateCustomerProducts(customerId);

  const predicciones: ReabastoPrediccion[] = productos
    .map((p) => {
      const consumoSemanal = Math.max(1, Math.round(p.unidades / SEMANAS_HISTORICO));
      const semanasParaReabasto = Math.round((p.pendientes / consumoSemanal) * 10) / 10;
      // Confianza: cuánta evidencia histórica respalda la estimación. Combina
      // el nº de líneas observadas (satura ~8) con el volumen total de unidades
      // (satura ~60), con un piso del 40% para que sea legible en la UI.
      const lineas = p.pendientes + p.entregadas;
      const porLineas = Math.min(1, lineas / 8);
      const porVolumen = Math.min(1, p.unidades / 60);
      const confianza = Math.round((0.4 + 0.6 * ((porLineas + porVolumen) / 2)) * 100) / 100;
      return {
        sku: p.sku,
        nombre: nombreConPresentacion(p.sku, p.nombre),
        consumoSemanal,
        unidadesPendientes: p.pendientes,
        semanasParaReabasto,
        urgencia: urgenciaFromSemanas(semanasParaReabasto),
        confianza,
      };
    })
    // Solo tiene sentido predecir reabasto de lo que aún está pendiente.
    .filter((p) => p.unidadesPendientes > 0)
    .sort((a, b) => a.semanasParaReabasto - b.semanasParaReabasto);

  const productosUrgentes = predicciones.filter((p) => p.urgencia === 'alto').length;
  const proximoReabastoSemanas = predicciones.length ? predicciones[0].semanasParaReabasto : null;

  return {
    customerId,
    productos: predicciones,
    resumen: { productosUrgentes, proximoReabastoSemanas },
  };
}
