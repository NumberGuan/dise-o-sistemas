import { useNavigate } from "react-router";

import {
  COMPROBANTES_VENTA_PROVEEDOR,
  getEstadoPago,
  getTotalComprobante,
  type EstadoPago,
} from "~/data/facturacion-proveedores";
import {
  formatFecha,
  formatMoney,
  getOrdenes,
  getProveedorPorId,
} from "~/data/ordenes";

const estadoClasses: Record<EstadoPago, string> = {
  Pagado: "bg-emerald-100 text-emerald-700",
  Parcial: "bg-amber-100 text-amber-800",
  Pendiente: "bg-rose-100 text-rose-700",
};

export default function ComprobantesProveedorListPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Facturas de Proveedores
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Comprobantes de venta emitidos por los proveedores. Se consultan, no
          se crean ni modifican en el sistema.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3 font-medium">Comprobante</th>
              <th className="px-5 py-3 font-medium">Proveedor</th>
              <th className="px-5 py-3 font-medium">Orden de Compra</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Ítems</th>
              <th className="px-5 py-3 font-medium">Importe neto</th>
              <th className="px-5 py-3 font-medium">IVA</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Pago</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {COMPROBANTES_VENTA_PROVEEDOR.map((comprobante) => {
              const proveedor = getProveedorPorId(comprobante.idProveedor);
              const orden = getOrdenes().find(
                (o) => o.id === comprobante.idOrdenCompraProveedor,
              );
              const estado = getEstadoPago(comprobante);
              return (
                <tr key={comprobante.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {comprobante.numero}
                  </td>
                  <td className="px-5 py-4 text-gray-600 break-words">
                    {proveedor?.nombre ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {orden?.numero ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatFecha(comprobante.fechaEmision)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {comprobante.detalle.length}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatMoney(comprobante.importeNeto)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatMoney(comprobante.importeIVA)}
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {formatMoney(getTotalComprobante(comprobante))}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoClasses[estado]}`}
                    >
                      {estado}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/compras/factura-proveedor/${comprobante.id}`,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
                    >
                      Ver detalle
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
