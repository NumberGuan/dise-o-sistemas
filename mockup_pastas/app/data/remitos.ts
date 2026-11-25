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

export const getCantidadTotalRemito = (detalle: DetalleRemitoProveedor[]) =>
  detalle.reduce((total, item) => total + item.cantidad, 0);
export function createSupplierRemits(REMITOS: RemitoProveedor[]) {
  const getRemitoPorId = (id: number) =>
    REMITOS.find((remito) => remito.id === id);
  return { getRemitoPorId };
}
