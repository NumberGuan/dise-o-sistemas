import { useNavigate } from "react-router";

import {
  getCantidadTotalRemito,
  REMITOS,
} from "~/data/remitos";
import { formatFecha, getOrdenes, getProveedorPorId } from "~/data/ordenes";

export default function RemitosProveedorListPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Remitos de Proveedor
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Remitos con la mercadería recibida de los proveedores. Se reciben y
          almacenan, no se crean ni modifican en el sistema.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Remito</th>
                <th className="px-5 py-3 font-medium">Proveedor</th>
                <th className="px-5 py-3 font-medium">Orden de Compra</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Ítems</th>
                <th className="px-5 py-3 font-medium">Cantidad</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {REMITOS.map((remito) => {
                const proveedor = getProveedorPorId(remito.idProveedor);
                const ordenVinculada = remito.idOrdenCompraProveedor
                  ? getOrdenes().find(
                      (orden) => orden.id === remito.idOrdenCompraProveedor,
                    )?.numero
                  : undefined;
                return (
                  <tr key={remito.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {remito.numero}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {proveedor?.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <span
                        className={
                          ordenVinculada
                            ? "text-gray-600"
                            : "text-gray-400"
                        }
                      >
                        {ordenVinculada ?? "Sin vincular"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {formatFecha(remito.fecha)}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {remito.detalle.length}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {getCantidadTotalRemito(remito.detalle)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/compras/remito-proveedor/${remito.id}`)}
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

    </div>
  );
}
