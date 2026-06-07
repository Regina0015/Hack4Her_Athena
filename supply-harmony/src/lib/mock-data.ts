// Datos simulados para la plataforma Pythia · Arca Continental

export type Risk = "alto" | "medio" | "bajo";

export interface Product {
  id: string;
  name: string;
  size: string;
  emoji: string;
  risk: Risk;
  stock: number;
  daysLeft: number;
  dailyConsumption: number;
  trend: number[];
}

export const products: Product[] = [
  { id: "fanta-600", name: "Fanta", size: "600 ml", emoji: "🥤", risk: "alto", stock: 240, daysLeft: 0.2, dailyConsumption: 1180, trend: [60, 48, 40, 30, 22, 14, 8] },
  { id: "cocacola-600", name: "Coca-Cola", size: "600 ml", emoji: "🧴", risk: "medio", stock: 1820, daysLeft: 1.6, dailyConsumption: 1140, trend: [70, 66, 60, 54, 48, 44, 40] },
  { id: "sprite-600", name: "Sprite", size: "600 ml", emoji: "🟢", risk: "bajo", stock: 4200, daysLeft: 5.4, dailyConsumption: 780, trend: [40, 42, 45, 48, 50, 53, 55] },
  { id: "cocacola-zero", name: "Coca-Cola Zero", size: "600 ml", emoji: "⚫", risk: "bajo", stock: 3650, daysLeft: 6.1, dailyConsumption: 600, trend: [44, 46, 48, 50, 52, 54, 58] },
  { id: "fuze-tea", name: "Fuze Tea", size: "600 ml", emoji: "🍵", risk: "medio", stock: 980, daysLeft: 1.9, dailyConsumption: 520, trend: [55, 50, 46, 40, 36, 30, 28] },
  { id: "ciel-1l", name: "Ciel", size: "1 L", emoji: "💧", risk: "bajo", stock: 6100, daysLeft: 8.2, dailyConsumption: 740, trend: [48, 50, 52, 55, 56, 58, 60] },
];

export interface DistributionCenter {
  id: string;
  name: string;
  city: string;
  x: number;
  y: number;
  status: Risk;
  ordersAtRisk: number;
}

export const centers: DistributionCenter[] = [
  { id: "mty", name: "CEDIS Monterrey", city: "Nuevo León", x: 46, y: 34, status: "alto", ordersAtRisk: 12 },
  { id: "gdl", name: "CEDIS Guadalajara", city: "Jalisco", x: 34, y: 58, status: "medio", ordersAtRisk: 5 },
  { id: "cdmx", name: "CEDIS CDMX", city: "Ciudad de México", x: 50, y: 70, status: "bajo", ordersAtRisk: 1 },
  { id: "qro", name: "CEDIS Querétaro", city: "Querétaro", x: 47, y: 60, status: "bajo", ordersAtRisk: 0 },
  { id: "tij", name: "CEDIS Tijuana", city: "Baja California", x: 12, y: 20, status: "medio", ordersAtRisk: 4 },
];

export interface Alert {
  id: string;
  level: Risk;
  title: string;
  detail: string;
  time: string;
}

export const alerts: Alert[] = [
  { id: "a1", level: "alto", title: "Fanta 600 ml se agotará en ~4 horas", detail: "CEDIS Monterrey · antes del despacho de las 14:00", time: "hace 6 min" },
  { id: "a2", level: "medio", title: "12 pedidos afectados por faltante", detail: "Sustitución sugerida: Sprite 600 ml", time: "hace 12 min" },
  { id: "a3", level: "bajo", title: "95% de pedidos validados con éxito", detail: "Ruta norte lista para salir", time: "hace 20 min" },
];

export const kpis = [
  { id: "k1", label: "Pedidos en riesgo", value: 18, delta: "+3 hoy", tone: "alto" as Risk, icon: "alert" },
  { id: "k2", label: "Productos en riesgo", value: 4, delta: "2 críticos", tone: "medio" as Risk, icon: "box" },
  { id: "k3", label: "Sustituciones pendientes", value: 9, delta: "esperando cliente", tone: "medio" as Risk, icon: "swap" },
  { id: "k4", label: "Pedidos listos", value: 326, delta: "95% validados", tone: "bajo" as Risk, icon: "check" },
];

export interface OrderFlow {
  id: string;
  client: string;
  requested: string;
  suggested: string;
  acceptance: number;
  stage: number; // 0..4
}

export const orders: OrderFlow[] = [
  { id: "#48201", client: "Abarrotes La Esquina", requested: "Fanta 600 ml × 24", suggested: "Sprite 600 ml × 24", acceptance: 92, stage: 3 },
  { id: "#48207", client: "Súper El Ahorro", requested: "Fanta 600 ml × 36", suggested: "Coca-Cola 600 ml × 36", acceptance: 78, stage: 2 },
  { id: "#48214", client: "Tienda Doña Mary", requested: "Fuze Tea 600 ml × 12", suggested: "Coca-Cola Zero × 12", acceptance: 64, stage: 1 },
  { id: "#48220", client: "Minimarket Centro", requested: "Coca-Cola 600 ml × 48", suggested: "—", acceptance: 100, stage: 4 },
];

export const orderStages = ["Pedido", "Validación", "Detección", "Sugerencia", "Aprobación"];

export interface Client {
  id: string;
  name: string;
  segment: string;
  acceptanceScore: number;
  preferences: string[];
  insights: string[];
  history: number[];
}

export const clients: Client[] = [
  {
    id: "c1",
    name: "Abarrotes La Esquina",
    segment: "Tienda tradicional · Monterrey",
    acceptanceScore: 92,
    preferences: ["Sabores cítricos", "Formato 600 ml", "Marca Coca-Cola", "Compra semanal"],
    insights: [
      "Acepta sustituciones cuando el sabor es similar",
      "Rechaza cambios de formato (prefiere 600 ml)",
      "Alta sensibilidad a faltantes en fin de semana",
    ],
    history: [70, 74, 80, 78, 85, 88, 92],
  },
  {
    id: "c2",
    name: "Súper El Ahorro",
    segment: "Autoservicio · Guadalajara",
    acceptanceScore: 78,
    preferences: ["Bajo en azúcar", "Compra por volumen", "Promociones"],
    insights: ["Prefiere alternativas dentro de la misma marca", "Responde bien a descuentos por sustitución"],
    history: [60, 65, 68, 70, 72, 75, 78],
  },
];
