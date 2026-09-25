export type DetallePresupuesto = {
  idMateriaPrima: number;
  cantidad: number;
  subtotal: number;
};

export type PresupuestoProveedor = {
  id: number;
  numero: string;
  idProveedor: number;
  fechaEmision: string;
  fechaVencimiento: string;
  detalle: DetallePresupuesto[];
};

export const PRESUPUESTOS_PROVEEDOR: PresupuestoProveedor[] = [
  {
    id: 1,
    numero: "PP-2024-001",
    idProveedor: 1,
    fechaEmision: "2026-09-20",
    fechaVencimiento: "2026-10-05",
    detalle: [
      { idMateriaPrima: 1, cantidad: 45, subtotal: 20250 },
      { idMateriaPrima: 2, cantidad: 25, subtotal: 13000 },
    ],
  },
  {
    id: 2,
    numero: "PP-2024-002",
    idProveedor: 2,
    fechaEmision: "2026-09-02",
    fechaVencimiento: "2026-09-15",
    detalle: [
      { idMateriaPrima: 3, cantidad: 18, subtotal: 10980 },
      { idMateriaPrima: 5, cantidad: 80, subtotal: 3200 },
    ],
  },
  {
    id: 3,
    numero: "PP-2024-003",
    idProveedor: 3,
    fechaEmision: "2026-08-25",
    fechaVencimiento: "2026-09-12",
    detalle: [{ idMateriaPrima: 1, cantidad: 60, subtotal: 27000 }],
  },
  {
    id: 4,
    numero: "PP-2024-004",
    idProveedor: 1,
    fechaEmision: "2026-09-15",
    fechaVencimiento: "2026-10-20",
    detalle: [
      { idMateriaPrima: 2, cantidad: 40, subtotal: 20800 },
      { idMateriaPrima: 3, cantidad: 12, subtotal: 7320 },
    ],
  },
  {
    id: 5,
    numero: "PP-2024-005",
    idProveedor: 2,
    fechaEmision: "2026-09-22",
    fechaVencimiento: "2026-10-01",
    detalle: [
      { idMateriaPrima: 4, cantidad: 30, subtotal: 5400 },
      { idMateriaPrima: 1, cantidad: 30, subtotal: 13500 },
    ],
  },
];

export const getMontoPresupuesto = (detalle: DetallePresupuesto[]) =>
  detalle.reduce(
    (total, item) =>
      total + (Number.isFinite(item.subtotal) ? item.subtotal : 0),
    0,
  );

export const getPresupuestoPorId = (id: number) =>
  PRESUPUESTOS_PROVEEDOR.find((presupuesto) => presupuesto.id === id);