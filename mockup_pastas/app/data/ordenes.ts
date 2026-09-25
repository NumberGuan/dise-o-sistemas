export type DetalleOrden = {
  idMateriaPrima: number;
  cantidad: number;
  subtotal: number;
};

export type OrdenCompra = {
  id: number;
  numero: string;
  idProveedor: number;
  idPresupuestoProveedor: number | null;
  fechaEmision: string;
  detalle: DetalleOrden[];
};

export const PROVEEDORES = [
  { id: 1, nombre: "Molino La Plata S.A." },
  { id: 2, nombre: "AgroHarinas S.R.L." },
  { id: 3, nombre: "Proveedora del Norte" },
];

export const PRESUPUESTOS = [
  { id: 101, numero: "PP-2024-001", idProveedor: 1, total: 120000 },
  { id: 102, numero: "PP-2024-002", idProveedor: 1, total: 96000 },
  { id: 103, numero: "PP-2024-003", idProveedor: 2, total: 85000 },
];

export const MATERIAS_PRIMAS = [
  { id: 1, nombre: "Harina 000", marca: "Molino La Plata", precioUnitario: 450 },
  { id: 2, nombre: "Harina 0000", marca: "Molino La Plata", precioUnitario: 520 },
  { id: 3, nombre: "Sémola de trigo", marca: "AgroHarinas", precioUnitario: 610 },
  { id: 4, nombre: "Huevos frescos", marca: "Granja Don Juan", precioUnitario: 180 },
  { id: 5, nombre: "Sal", marca: "Salinas del Sur", precioUnitario: 40 },
];

export const ORDENES: OrdenCompra[] = [
  {
    id: 1,
    numero: "OC-2024-0001",
    idProveedor: 1,
    idPresupuestoProveedor: 101,
    fechaEmision: "2026-08-20",
    detalle: [
      { idMateriaPrima: 1, cantidad: 50, subtotal: 22500 },
      { idMateriaPrima: 2, cantidad: 30, subtotal: 15600 },
      { idMateriaPrima: 4, cantidad: 10, subtotal: 1800 },
    ],
  },
  {
    id: 2,
    numero: "OC-2024-0002",
    idProveedor: 2,
    idPresupuestoProveedor: 103,
    fechaEmision: "2026-09-01",
    detalle: [
      { idMateriaPrima: 3, cantidad: 20, subtotal: 12200 },
      { idMateriaPrima: 5, cantidad: 100, subtotal: 4000 },
    ],
  },
  {
    id: 3,
    numero: "OC-2024-0003",
    idProveedor: 3,
    idPresupuestoProveedor: null,
    fechaEmision: "2026-09-12",
    detalle: [{ idMateriaPrima: 1, cantidad: 80, subtotal: 36000 }],
  },
  {
    id: 4,
    numero: "OC-2024-0004",
    idProveedor: 1,
    idPresupuestoProveedor: 102,
    fechaEmision: "2026-09-18",
    detalle: [
      { idMateriaPrima: 2, cantidad: 45, subtotal: 23400 },
      { idMateriaPrima: 3, cantidad: 10, subtotal: 6100 },
    ],
  },
];

export const getOrdenPorId = (id: number) =>
  ORDENES.find((orden) => orden.id === id);

export const getProveedorPorId = (id: number) =>
  PROVEEDORES.find((proveedor) => proveedor.id === id);

export const getMateriaPrimaPorId = (id: number) =>
  MATERIAS_PRIMAS.find((materiaPrima) => materiaPrima.id === id);

export const getMontoTotal = (detalle: DetalleOrden[]) =>
  detalle.reduce(
    (total, item) => total + (Number.isFinite(item.subtotal) ? item.subtotal : 0),
    0,
  );

export const formatMoney = (value: number) =>
  value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });

export const formatFecha = (fecha: string) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR");