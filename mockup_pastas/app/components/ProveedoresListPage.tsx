import { useState } from "react";

import Modal from "~/components/Modal";
import ProveedorDetallePage from "~/components/ProveedorDetallePage";
import ProveedorFormPage from "~/components/ProveedorFormPage";
import {
  PROVEEDORES,
  getDomicilioPorId,
  getNombreCompletoProveedor,
  getProveedorPorId,
  getTipoDocumentoPorId,
} from "~/data/proveedores";

const formatDocumento = (nro: number) =>
  nro.toLocaleString("es-AR", { useGrouping: true });

type ModalState =
  | { tipo: "nueva" }
  | { tipo: "modificar"; id: number }
  | { tipo: "detalle"; id: number }
  | null;

export default function ProveedoresListPage() {
  const [modal, setModal] = useState<ModalState>(null);

  const proveedorSeleccionado =
    modal && modal.tipo !== "nueva" ? getProveedorPorId(modal.id) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de los proveedores registrados en el sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ tipo: "nueva" })}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          + Nuevo Proveedor
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Nombre / Razón Social</th>
                <th className="px-5 py-3 font-medium">Documento</th>
                <th className="px-5 py-3 font-medium">e-mail</th>
                <th className="px-5 py-3 font-medium">Teléfono</th>
                <th className="px-5 py-3 font-medium">Domicilio</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PROVEEDORES.map((proveedor) => {
                const tipoDocumento = getTipoDocumentoPorId(
                  proveedor.idTipoDocumento,
                );
                const domicilio = getDomicilioPorId(proveedor.idDomicilio);
                return (
                  <tr key={proveedor.idPersona} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {proveedor.nombre}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {tipoDocumento?.nombre ?? "—"}{" "}
                      {formatDocumento(proveedor.nroDocumento)}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {proveedor.email}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {proveedor.telefono}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {domicilio
                        ? `${domicilio.calle}, ${domicilio.localidad}, ${domicilio.provincia}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          proveedor.estado === "Activo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {proveedor.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setModal({
                              tipo: "modificar",
                              id: proveedor.idPersona,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
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
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                          </svg>
                          Modificar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setModal({
                              tipo: "detalle",
                              id: proveedor.idPersona,
                            })
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
                      </div>
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
          title="Nuevo Proveedor"
          subtitle="Registra un nuevo proveedor en el sistema."
          onClose={() => setModal(null)}
          wide
        >
          <ProveedorFormPage onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?.tipo === "modificar" && proveedorSeleccionado && (
        <Modal
          title="Modificar Proveedor"
          subtitle="Actualiza los datos del proveedor y guarda los cambios."
          onClose={() => setModal(null)}
          wide
        >
          <ProveedorFormPage
            proveedorId={String(modal.id)}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.tipo === "detalle" && proveedorSeleccionado && (
        <Modal
          title={getNombreCompletoProveedor(proveedorSeleccionado)}
          subtitle={`Código de persona: ${proveedorSeleccionado.idPersona} · ${proveedorSeleccionado.estado}`}
          onClose={() => setModal(null)}
          wide
        >
          <ProveedorDetallePage
            proveedorId={String(modal.id)}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}