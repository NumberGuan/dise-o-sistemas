import { SortableTable } from "~/components/SortableRows";
import ModulePageHeader from "~/components/ModulePageHeader";
import { useNavigate } from "react-router";

import {
  getMontoPresupuesto,
  PRESUPUESTOS_PROVEEDOR,
} from "~/data/presupuestos";
import {
  formatFecha,
  formatMoney,
  getProveedorPorId,
} from "~/data/ordenes";

export default function PresupuestosListPage() {
  const hoy = new Date().toISOString().slice(0, 10);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ModulePageHeader className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Presupuesto Proveedor
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Presupuestos recibidos por mensaje desde los proveedores. No se crean
          en el sistema.
        </p>
      </ModulePageHeader>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <SortableTable
            rows={PRESUPUESTOS_PROVEEDOR}
            className="w-full min-w-[820px] text-left text-sm"
            headerRowClassName="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400"
            bodyClassName="divide-y divide-gray-100"
            newest="Fecha de creación"
            tieBreaker={row => row.numero}
            columns={[
              [["Código", row => row.numero], "px-5 py-3 font-medium"],
              [["Proveedor", row => getProveedorPorId(row.idProveedor)?.nombre], "px-5 py-3 font-medium"],
              [["Fecha de creación", row => row.fechaEmision], "px-5 py-3 font-medium"],
              [["Vencimiento", row => row.fechaVencimiento], "px-5 py-3 font-medium"],
              [["Ítems", row => row.detalle.length], "px-5 py-3 font-medium"],
              [["Monto total", row => getMontoPresupuesto(row.detalle)], "px-5 py-3 font-medium"],
              [["Estado", row => row.fechaVencimiento < hoy ? 'Vencido' : 'Vigente'], "px-5 py-3 font-medium"],
              ["Acciones", "px-5 py-3 text-right font-medium"],
            ]}
          >
            {mapRows => mapRows((presupuesto) => {
              const proveedor = getProveedorPorId(presupuesto.idProveedor);
              const vencido = presupuesto.fechaVencimiento < hoy;
              return (
                <tr key={presupuesto.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {presupuesto.numero}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {proveedor?.nombre ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatFecha(presupuesto.fechaEmision)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatFecha(presupuesto.fechaVencimiento)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {presupuesto.detalle.length}
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {formatMoney(getMontoPresupuesto(presupuesto.detalle))}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        vencido
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {vencido ? "Vencido" : "Vigente"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/compras/presupuesto-proveedor/${presupuesto.id}`)}
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

    </div>
  );
}
