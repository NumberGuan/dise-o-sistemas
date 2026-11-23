import { SortableTable } from "~/components/SortableRows";
import ModulePageHeader from "~/components/ModulePageHeader";
import { Link, useNavigate } from "react-router";

import {
  RECIBOS_PAGO_PROVEEDOR,
  getComprobantePorId,
  getMedioPagoPorId,
} from "~/data/facturacion-proveedores";
import { formatFecha, formatMoney, getProveedorPorId } from "~/data/ordenes";

export default function RecibosPagoProveedorListPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ModulePageHeader className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Recibo de Pago Proveedor
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Constancias de los pagos realizados para saldar comprobantes de
          proveedores. Se consultan, no se crean ni modifican en el sistema.
        </p>
      </ModulePageHeader>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <SortableTable
          rows={RECIBOS_PAGO_PROVEEDOR}
          className="w-full text-left text-sm"
          headerRowClassName="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400"
          bodyClassName="divide-y divide-gray-100"
          newest="Fecha de emisión"
          tieBreaker={row => row.numero}
          columns={[
            [["Recibo", row => row.numero], "px-5 py-3 font-medium"],
            [["Comprobante saldado", row => getComprobantePorId(row.idComprobanteVentaProveedor)?.numero], "px-5 py-3 font-medium"],
            [["Proveedor", row => {
              const invoice = getComprobantePorId(row.idComprobanteVentaProveedor);
              return invoice ? getProveedorPorId(invoice.idProveedor)?.nombre : undefined;
            }], "px-5 py-3 font-medium"],
            [["Fecha de emisión", row => row.fechaEmision], "px-5 py-3 font-medium"],
            [["Medio de pago", row => getMedioPagoPorId(row.idMedioPago)?.tipo], "px-5 py-3 font-medium"],
            [["Monto abonado", row => row.montoPagado], "px-5 py-3 font-medium"],
            ["Acciones", "px-5 py-3 text-right font-medium"],
          ]}
        >
          {mapRows => mapRows((recibo) => {
            const comprobante = getComprobantePorId(
              recibo.idComprobanteVentaProveedor,
            );
            const proveedor = comprobante
              ? getProveedorPorId(comprobante.idProveedor)
              : undefined;
            return (
              <tr key={recibo.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-semibold text-gray-900">
                  {recibo.numero}
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {comprobante ? (
                    <Link
                      to={`/compras/factura-proveedor/${comprobante.id}`}
                      className="text-amber-800 underline underline-offset-2"
                    >
                      {comprobante.numero}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-4 text-gray-600 break-words">
                  {proveedor?.nombre ?? "—"}
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {formatFecha(recibo.fechaEmision)}
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {getMedioPagoPorId(recibo.idMedioPago)?.tipo ?? "—"}
                </td>
                <td className="px-5 py-4 font-medium text-gray-900">
                  {formatMoney(recibo.montoPagado)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/compras/recibo-pago-proveedor/${recibo.id}`)
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
        </SortableTable>
      </div>
    </div>
  );
}
