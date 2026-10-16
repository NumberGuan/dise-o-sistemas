import BackToListButton from "~/components/BackToListButton";
import { useNavigate } from "react-router";

import {
  PRESUPUESTOS,
  formatFecha,
  formatMoney,
  getMarcaPorId,
  getMontoTotal,
  getOrdenPorId,
  getProveedorPorId,
} from "~/data/ordenes";

export default function OrdenDetallePage({
  ordenId,
  onClose,
}: {
  ordenId: string;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const irVolver = () => (onClose ? onClose() : navigate("/compras/ordenes"));
  const orden = getOrdenPorId(Number(ordenId));

  if (!orden) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Orden no encontrada</h1>
        <p className="mt-2 text-sm text-gray-500">
          No existe una orden de compra con ese identificador.
        </p>
        <BackToListButton onClick={irVolver} />
      </div>
    );
  }

  const proveedor = getProveedorPorId(orden.idProveedor);
  const presupuesto = orden.idPresupuestoProveedor
    ? PRESUPUESTOS.find((p) => p.id === orden.idPresupuestoProveedor)
    : undefined;
  const montoTotal = getMontoTotal(orden.detalle);

  const contenido = (
    <>
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Cabecera</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Proveedor
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {proveedor?.nombre ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Presupuesto vinculado
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {presupuesto?.numero ?? "Sin vincular"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Fecha de emisión
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatFecha(orden.fechaEmision)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Monto total
            </dt>
            <dd className="mt-1 text-base font-bold text-gray-900">
              {formatMoney(montoTotal)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Detalle de la Orden</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">N°</th>
                <th className="px-5 py-3 font-medium">Materia Prima</th>
                <th className="px-5 py-3 font-medium">Marca</th>
                <th className="px-5 py-3 font-medium">Precio unitario</th>
                <th className="px-5 py-3 font-medium">Cantidad</th>
                <th className="px-5 py-3 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orden.detalle.map((linea, index) => {
                const productoMarca = getMarcaPorId(linea.idMarca);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {productoMarca?.producto.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {productoMarca?.marca.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {productoMarca
                        ? formatMoney(productoMarca.marca.precioUnitario)
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{linea.cantidad}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatMoney(linea.subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td
                  colSpan={5}
                  className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Total
                </td>
                <td className="px-5 py-3 font-bold text-gray-900">
                  {formatMoney(montoTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </>
  );

  if (onClose) {
    return contenido;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="sticky top-16 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 py-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{orden.numero}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Orden de compra al proveedor {proveedor?.nombre ?? "—"}.
          </p>
        </div>
        <BackToListButton onClick={irVolver} />
      </div>
      {contenido}
    </div>
  );
}