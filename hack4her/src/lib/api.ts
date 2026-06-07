import axios from 'axios';
import type {
  DashboardKpis, Alert, OrderSummary, OrderDetail, Recommendation,
  CustomerProfile, InventoryItem,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const http = axios.create({ baseURL: BASE_URL });

/** Extrae el campo `data` del envoltorio { data, meta } del backend. */
async function get<T>(url: string): Promise<T> {
  const res = await http.get(url);
  return res.data.data as T;
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.post(url, body);
  return res.data.data as T;
}

export const api = {
  dashboardKpis: () => get<DashboardKpis>('/dashboard/kpis'),
  dashboardAlerts: () => get<Alert[]>('/dashboard/alerts'),
  orders: (risk?: string) => get<OrderSummary[]>(`/orders${risk ? `?risk=${risk}` : ''}`),
  order: (idPedido: string) => get<OrderDetail>(`/orders/${idPedido}`),
  recommendations: (idPedido: string) => get<Recommendation[]>(`/orders/${idPedido}/recommendations`),
  approve: (idPedido: string, idLinea: string, skuSustituto: string, nombreSustituto: string) =>
    post(`/orders/${idPedido}/substitutions/${idLinea}/approve`, { skuSustituto, nombreSustituto }),
  reject: (idPedido: string, idLinea: string) =>
    post(`/orders/${idPedido}/substitutions/${idLinea}/reject`),
  customerProfile: (customerId: string) => get<CustomerProfile>(`/customers/${customerId}/profile`),
  inventory: () => get<InventoryItem[]>('/inventory'),
  inventoryCritical: () => get<InventoryItem[]>('/inventory/critical'),
  portalPending: (customerId: string) => get(`/portal/${customerId}/pending`),
  savePreferences: (customerId: string, preferencias: unknown[]) =>
    post(`/portal/${customerId}/preferences`, { preferencias }),
};
