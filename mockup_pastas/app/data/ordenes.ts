import { getProveedorPorId, useProveedores } from "./proveedores";
import { createStore, useStore } from "./store";

export { getProveedorPorId, useProveedores };

export type Marca = {
  id: number;
  nombre: string;
  precioUnitario: number;
};

export type MateriaPrima = {
  id: number;
  nombre: string;
  marcas: Marca[];
};

export type DetalleOrden = {
  idMateriaPrima: number;
  idMarca: number;
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

export type OrdenCompraInput = Omit<OrdenCompra, "id" | "numero">;

export const PRESUPUESTOS = [
  { id: 101, numero: "PP-2024-001", idProveedor: 1, total: 120000 },
  { id: 102, numero: "PP-2024-002", idProveedor: 1, total: 96000 },
  { id: 103, numero: "PP-2024-003", idProveedor: 2, total: 85000 },
];

export const MATERIAS_PRIMAS: MateriaPrima[] = [
  {
    id: 1,
    nombre: "Harina 000",
    marcas: [
      { id: 1, nombre: "Molino La Plata", precioUnitario: 450 },
      { id: 2, nombre: "AgroHarinas", precioUnitario: 430 },
    ],
  },
  {
    id: 2,
    nombre: "Harina 0000",
    marcas: [
      { id: 3, nombre: "Molino La Plata", precioUnitario: 520 },
      { id: 4, nombre: "AgroHarinas", precioUnitario: 500 },
    ],
  },
  {
    id: 3,
    nombre: "Sémola de trigo",
    marcas: [
      { id: 5, nombre: "AgroHarinas", precioUnitario: 610 },
      { id: 6, nombre: "Proveedora del Norte", precioUnitario: 590 },
    ],
  },
  {
    id: 4,
    nombre: "Huevos frescos",
    marcas: [
      { id: 7, nombre: "Granja Don Juan", precioUnitario: 180 },
      { id: 8, nombre: "Granja Santa Clara", precioUnitario: 170 },
    ],
  },
  {
    id: 5,
    nombre: "Sal",
    marcas: [{ id: 9, nombre: "Salinas del Sur", precioUnitario: 40 }],
  },
];

const INITIAL_ORDENES: OrdenCompra[] = [
  {
    id: 1,
    numero: "OC-2024-0001",
    idProveedor: 1,
    idPresupuestoProveedor: 101,
    fechaEmision: "2026-08-20",
    detalle: [
      { idMateriaPrima: 1, idMarca: 1, cantidad: 50, subtotal: 22500 },
      { idMateriaPrima: 2, idMarca: 3, cantidad: 30, subtotal: 15600 },
      { idMateriaPrima: 4, idMarca: 7, cantidad: 10, subtotal: 1800 },
    ],
  },
  {
    id: 2,
    numero: "OC-2024-0002",
    idProveedor: 2,
    idPresupuestoProveedor: 103,
    fechaEmision: "2026-09-01",
    detalle: [
      { idMateriaPrima: 3, idMarca: 5, cantidad: 20, subtotal: 12200 },
      { idMateriaPrima: 5, idMarca: 9, cantidad: 100, subtotal: 4000 },
    ],
  },
  {
    id: 3,
    numero: "OC-2024-0003",
    idProveedor: 3,
    idPresupuestoProveedor: null,
    fechaEmision: "2026-09-12",
    detalle: [{ idMateriaPrima: 1, idMarca: 1, cantidad: 80, subtotal: 36000 }],
  },
  {
    id: 4,
    numero: "OC-2024-0004",
    idProveedor: 1,
    idPresupuestoProveedor: 102,
    fechaEmision: "2026-09-18",
    detalle: [
      { idMateriaPrima: 2, idMarca: 3, cantidad: 45, subtotal: 23400 },
      { idMateriaPrima: 3, idMarca: 5, cantidad: 10, subtotal: 6100 },
    ],
  },
];

const store = createStore<OrdenCompra[]>(INITIAL_ORDENES);

export const useOrdenes = () => useStore(store);

export const getOrdenes = () => store.get();

export const getOrdenPorId = (id: number) =>
  store.get().find((orden) => orden.id === id);

export const getMateriaPrimaPorId = (id: number) =>
  MATERIAS_PRIMAS.find((materiaPrima) => materiaPrima.id === id);

export const getMarcaPorId = (
  id: number,
): { producto: MateriaPrima; marca: Marca } | undefined => {
  for (const producto of MATERIAS_PRIMAS) {
    const marca = producto.marcas.find((m) => m.id === id);
    if (marca) {
      return { producto, marca };
    }
  }
  return undefined;
};

export const getMontoTotal = (detalle: DetalleOrden[]) =>
  detalle.reduce(
    (total, item) => total + (Number.isFinite(item.subtotal) ? item.subtotal : 0),
    0,
  );

export const getProximoNumeroOrden = () => {
  const ordenes = store.get();
  const maxId = ordenes.length
    ? Math.max(...ordenes.map((orden) => orden.id))
    : 0;
  return `OC-2024-${String(maxId + 1).padStart(4, "0")}`;
};

export const createOrden = (input: OrdenCompraInput): OrdenCompra => {
  const ordenes = store.get();
  const id = ordenes.length
    ? Math.max(...ordenes.map((orden) => orden.id)) + 1
    : 1;
  const nueva: OrdenCompra = { ...input, id, numero: getProximoNumeroOrden() };
  store.set([...ordenes, nueva]);
  return nueva;
};

export const deleteOrden = (id: number): boolean => {
  const ordenes = store.get();
  const existe = ordenes.some((orden) => orden.id === id);
  if (!existe) {
    return false;
  }
  store.set(ordenes.filter((orden) => orden.id !== id));
  return true;
};

export const formatMoney = (value: number) =>
  value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });

export const formatFecha = (fecha: string) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR");