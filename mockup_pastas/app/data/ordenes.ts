import { createStore, useStore } from "./store";


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
export function createPurchaseOrders(initial: OrdenCompra[], MATERIAS_PRIMAS: MateriaPrima[]) {
  const store = createStore(initial);

  const useOrdenes = () => useStore(store);

  const getOrdenes = () => store.get();

  const getOrdenPorId = (id: number) =>
    store.get().find((orden) => orden.id === id);

  const getMateriaPrimaPorId = (id: number) =>
    MATERIAS_PRIMAS.find((materiaPrima) => materiaPrima.id === id);

  const getMarcaPorId = (
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

  const getProximoNumeroOrden = () => {
    const ordenes = store.get();
    const maxId = ordenes.length
      ? Math.max(...ordenes.map((orden) => orden.id))
      : 0;
    return `OC-2024-${String(maxId + 1).padStart(4, "0")}`;
  };

  const createOrden = (input: OrdenCompraInput): OrdenCompra => {
    const ordenes = store.get();
    const id = ordenes.length
      ? Math.max(...ordenes.map((orden) => orden.id)) + 1
      : 1;
    const nueva: OrdenCompra = { ...input, id, numero: getProximoNumeroOrden() };
    store.set([...ordenes, nueva]);
    return nueva;
  };

  const deleteOrden = (id: number): boolean => {
    const ordenes = store.get();
    const existe = ordenes.some((orden) => orden.id === id);
    if (!existe) {
      return false;
    }
    store.set(ordenes.filter((orden) => orden.id !== id));
    return true;
  };
  return { useOrdenes, getOrdenes, getOrdenPorId, getMateriaPrimaPorId, getMarcaPorId, getProximoNumeroOrden, createOrden, deleteOrden };
}
