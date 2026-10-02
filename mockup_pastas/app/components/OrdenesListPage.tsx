import { useState } from "react";

import Modal from "~/components/Modal";
import OrdenCompraPage from "~/components/OrdenCompraPage";
import OrdenDetallePage from "~/components/OrdenDetallePage";
import {
  ORDENES,
  formatFecha,
  formatMoney,
  getMontoTotal,
  getOrdenPorId,
  getProveedorPorId,
} from "~/data/ordenes";

type ModalState =
  | { tipo: "nueva" }
  | { tipo: "detalle"; id: number }
  | null;

export default function OrdenesListPage() {
  const [modal, setModal] = useState<ModalState>(null);

  const ordenSeleccionada =
    modal?.tipo === "detalle" ? getOrdenPorId(modal.id) : undefined;
  const proveedorSeleccionado = ordenSeleccionada
    ? getProveedorPorId(ordenSeleccionada.idProveedor)
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Órdenes a Proveedores
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Consulta las órdenes de compra registradas y accede a su detalle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ tipo: "nueva" })}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          + Nueva Orden
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Orden</th>
                <th className="px-5 py-3 font-medium">Proveedor</th>
                <th className="px-5 py-3 font-medium">Fecha de emisión</th>
                <th className="px-5 py-3 font-medium">Ítems</th>
                <th className="px-5 py-3 font-medium">Monto total</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ORDENES.map((orden) => {
                const proveedor = getProveedorPorId(orden.idProveedor);
                return (
                  <tr key={orden.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900">
                        {orden.numero}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {proveedor?.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {formatFecha(orden.fechaEmision)}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {orden.detalle.length}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {formatMoney(getMontoTotal(orden.detalle))}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setModal({ tipo: "detalle", id: orden.id })}
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

      {modal?.tipo === "nueva" && (
        <Modal
          title="Nueva Orden de Compra"
          subtitle="Completa la cabecera y agrega los ítems para registrar la orden."
          onClose={() => setModal(null)}
          wide
        >
          <OrdenCompraPage onClose={() => setModal(null)} />
        </Modal>
      )}

      {ordenSeleccionada && (
        <Modal
          title={ordenSeleccionada.numero}
          subtitle={`Orden de compra al proveedor ${
            proveedorSeleccionado?.nombre ?? "—"
          }.`}
          onClose={() => setModal(null)}
          wide
        >
          <OrdenDetallePage
            ordenId={String(ordenSeleccionada.id)}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}