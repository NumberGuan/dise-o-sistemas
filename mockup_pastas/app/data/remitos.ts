export type DetalleRemitoProveedor = {
  idMateriaPrima: number;
  cantidad: number;
};

export type RemitoProveedor = {
  id: number;
  numero: string;
  idProveedor: number;
  idOrdenCompraProveedor: number | null;
  fecha: string;
  detalle: DetalleRemitoProveedor[];
};

export const REMITOS: RemitoProveedor[] = [
  {
    id: 1,
    numero: "RP-2026-0001",
    idProveedor: 1,
    idOrdenCompraProveedor: 1,
    fecha: "2026-08-25",
    detalle: [
      { idMateriaPrima: 1, cantidad: 50 },
      { idMateriaPrima: 2, cantidad: 30 },
    ],
  },
  {
    id: 2,
    numero: "RP-2026-0002",
    idProveedor: 2,
    idOrdenCompraProveedor: 2,
    fecha: "2026-09-05",
    detalle: [{ idMateriaPrima: 3, cantidad: 20 }],
  },
  {
    id: 3,
    numero: "RP-2026-0003",
    idProveedor: 1,
    idOrdenCompraProveedor: 4,
    fecha: "2026-09-20",
    detalle: [
      { idMateriaPrima: 2, cantidad: 45 },
      { idMateriaPrima: 3, cantidad: 10 },
      { idMateriaPrima: 5, cantidad: 100 },
    ],
  },
  {
    id: 4,
    numero: "RP-2026-0004",
    idProveedor: 3,
    idOrdenCompraProveedor: 3,
    fecha: "2026-09-22",
    detalle: [{ idMateriaPrima: 1, cantidad: 80 }],
  },
];

export const getRemitoPorId = (id: number) =>
  REMITOS.find((remito) => remito.id === id);

export const getCantidadTotalRemito = (detalle: DetalleRemitoProveedor[]) =>
  detalle.reduce((total, item) => total + item.cantidad, 0);