import type { NavItem } from "~/data/navigation";

export const SALES_PAGES = [
  { label: "Resumen", to: "/ventas" },
  { label: "Clientes", to: "/ventas/clientes" },
  { label: "Pedidos", to: "/ventas/pedidos" },
  { label: "Comprobantes", to: "/ventas/comprobantes" },
  { label: "Presupuestos", to: "/ventas/presupuestos" },
  { label: "Remitos", to: "/ventas/remitos" },
  { label: "Devoluciones", to: "/ventas/devoluciones" },
  { label: "Recibos", to: "/ventas/recibos" },
] as const satisfies readonly NavItem[];

export type ClientStatus = "Activo" | "Inactivo";

export type Client = {
  id: string;
  code: string;
  type: "Comercio" | "Distribuidor" | "Particular";
  name: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  locality: string;
  province: string;
  terms: string;
  status: ClientStatus;
  notes: string;
};

export const SAMPLE_CLIENTS: Client[] = [
  { id: "c-148", code: "CLI-00148", type: "Distribuidor", name: "Distribuidora El Sol", taxId: "30-71234567-8", phone: "11 4567-2300", email: "compras@distribuidoraelsol.com.ar", address: "Av. Rivadavia 2840", locality: "Morón", province: "Buenos Aires", terms: "Cuenta corriente · 15 días", status: "Activo", notes: "Entrega por la mañana. Contactar a Laura." },
  { id: "c-147", code: "CLI-00147", type: "Comercio", name: "Supermercados Andes", taxId: "30-69876543-2", phone: "11 4788-1200", email: "pedidos@andes.com.ar", address: "Belgrano 145", locality: "San Martín", province: "Buenos Aires", terms: "Cuenta corriente · 30 días", status: "Activo", notes: "" },
  { id: "c-146", code: "CLI-00146", type: "Comercio", name: "Almacén Don Pedro", taxId: "20-24567891-3", phone: "11 4455-7701", email: "donpedro@correo.com", address: "Italia 820", locality: "Haedo", province: "Buenos Aires", terms: "Contado", status: "Activo", notes: "Recibe pedidos los lunes y jueves." },
  { id: "c-145", code: "CLI-00145", type: "Comercio", name: "Mini Market Norte", taxId: "30-73456789-1", phone: "11 4766-0092", email: "administracion@mininorte.com.ar", address: "San Lorenzo 560", locality: "Villa Ballester", province: "Buenos Aires", terms: "Cuenta corriente · 7 días", status: "Activo", notes: "" },
  { id: "c-144", code: "CLI-00144", type: "Particular", name: "María Fernanda López", taxId: "27-28345678-4", phone: "11 6098-3321", email: "maria.lopez@email.com", address: "Las Heras 112", locality: "Castelar", province: "Buenos Aires", terms: "Contado", status: "Inactivo", notes: "Cliente sin actividad reciente." },
  { id: "c-143", code: "CLI-00143", type: "Distribuidor", name: "Alimentos La Estación", taxId: "30-72345678-9", phone: "11 4621-8800", email: "ventas@laestacion.com.ar", address: "Calle 25 de Mayo 1010", locality: "Ituzaingó", province: "Buenos Aires", terms: "Cuenta corriente · 15 días", status: "Activo", notes: "" },
];

export type ClientActivity = { type: string; code: string; date: string; summary: string; status: string; to: string };

export const SAMPLE_CLIENT_ACTIVITY: ClientActivity[] = [
  { type: "Pedido", code: "PC-000148", date: "24 sep 2026", summary: "Tallarines 500g y ravioles de verdura", status: "En preparación", to: "/ventas/pedidos" },
  { type: "Remito", code: "R-000092", date: "18 sep 2026", summary: "Entrega de 12 cajas", status: "Entregado", to: "/ventas/remitos" },
  { type: "Comprobante", code: "FC-000381", date: "18 sep 2026", summary: "Venta · $ 86.400", status: "Emitido", to: "/ventas/comprobantes" },
  { type: "Presupuesto", code: "PR-000064", date: "12 sep 2026", summary: "Pedido semanal · 8 productos", status: "Aceptado", to: "/ventas/presupuestos" },
  { type: "Recibo", code: "RC-000107", date: "10 sep 2026", summary: "Pago recibido · $ 86.400", status: "Registrado", to: "/ventas/recibos" },
  { type: "Devolución", code: "DV-000012", date: "03 sep 2026", summary: "1 caja de sorrentinos", status: "Resuelta", to: "/ventas/devoluciones" },
];
