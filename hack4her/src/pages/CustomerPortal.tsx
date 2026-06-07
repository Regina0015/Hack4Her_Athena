import { useState } from 'react';
import { api } from '../lib/api';
import { Loading, ErrorBox } from '../components/shared';
import type { PendingSubstitution } from '../types';

export default function CustomerPortal() {
  const [input, setInput] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingSubstitution[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load(id?: string) {
    const cid = (id ?? input).trim();
    if (!cid) return;
    setLoading(true);
    setError(null);
    setCustomerId(cid);
    try {
      setPending((await api.portalPending(cid)) as PendingSubstitution[]);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function approve(p: PendingSubstitution) {
    await api.approve(
      p.idPedido,
      p.idLinea,
      p.skuSustituto ?? p.skuSolicitado,
      p.nombreSkuSustituto ?? '',
    );
    setMsg(`✅ Aprobaste la sustitución del pedido ${p.idPedido}`);
    load(customerId ?? undefined);
  }

  async function reject(p: PendingSubstitution) {
    await api.reject(p.idPedido, p.idLinea);
    setMsg(`❌ Rechazaste la sustitución del pedido ${p.idPedido}`);
    load(customerId ?? undefined);
  }

  return (
    <div>
      <h2>Portal del Cliente</h2>
      <div className="row" style={{ marginBottom: 16 }}>
        <input
          placeholder="customer_id"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          style={{ width: 280 }}
        />
        <button onClick={() => load()}>Ver mis sustituciones</button>
      </div>

      {loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {msg && <p>{msg}</p>}

      {pending && pending.length === 0 && (
        <p className="muted">No tienes sustituciones pendientes.</p>
      )}

      {pending &&
        pending.map((p) => (
          <div className="card" key={`${p.idPedido}-${p.idLinea}`}>
            <p>
              Pedido <strong>{p.idPedido}</strong>: tu producto{' '}
              <strong>{p.nombreSku || p.skuSolicitado}</strong> (x{p.quantity}) podría sustituirse
              {p.nombreSkuSustituto ? (
                <>
                  {' '}
                  por <strong>{p.nombreSkuSustituto}</strong>
                </>
              ) : null}
              .
            </p>
            <div className="row">
              <button onClick={() => approve(p)}>Aceptar</button>
              <button className="secondary" onClick={() => reject(p)}>
                Rechazar
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
