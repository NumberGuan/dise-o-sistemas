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

export const getMontoPresupuesto = (detalle: DetallePresupuesto[]) =>
  detalle.reduce(
    (total, item) =>
      total + (Number.isFinite(item.subtotal) ? item.subtotal : 0),
    0,
  );
export function createSupplierBudgets(PRESUPUESTOS_PROVEEDOR: PresupuestoProveedor[]) {
  const getPresupuestoPorId = (id: number) =>
    PRESUPUESTOS_PROVEEDOR.find((presupuesto) => presupuesto.id === id);
  return { getPresupuestoPorId };
}
