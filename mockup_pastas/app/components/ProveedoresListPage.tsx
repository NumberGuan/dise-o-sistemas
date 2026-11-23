import { useCatalogs } from "~/components/CatalogProvider";
import { useNavigate } from "react-router";

import {
  getDomicilioPorId,
  useProveedores,
} from "~/data/proveedores";

const formatDocumento = (nro: number) =>
  nro.toLocaleString("es-AR", { useGrouping: true });

export default function ProveedoresListPage() {
  const catalogs = useCatalogs();
  const TIPOS_DOCUMENTO = catalogs["tipos-documento"].map(item => ({ id: Number(item.id), nombre: item.name, active: item.active }));
  const getTipoDocumentoPorId = (id: number) => TIPOS_DOCUMENTO.find(item => item.id === id);
  const navigate = useNavigate();

  const proveedores = useProveedores();

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
          onClick={() => navigate("/compras/proveedores/nueva")}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          + Nuevo Proveedor
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Nombre / Razón Social</th>
                <th className="px-5 py-3 font-medium">Documento</th>
                <th className="px-5 py-3 font-medium">e-mail</th>
                <th className="px-5 py-3 font-medium">Teléfono principal</th>
                <th className="px-5 py-3 font-medium">Domicilio</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proveedores.map((proveedor) => {
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
                    <td className="px-5 py-4 text-gray-600 break-all">
                      {proveedor.email}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {proveedor.telefono}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {domicilio
                        ? `${domicilio.calle} ${domicilio.altura}, ${domicilio.localidad}, ${domicilio.provincia}`
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
                        <button type="button" onClick={() => navigate(`/compras/proveedores/${proveedor.idPersona}`)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">
                          Ver detalle
                        </button>
                        <button type="button" onClick={() => navigate(`/compras/proveedores/${proveedor.idPersona}/modificar`)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">
                          Modificar
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

      {proveedores.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
          No hay proveedores registrados. Usá "+ Nuevo Proveedor" para
          cargar uno.
        </p>
      )}

    </div>
  );
}
