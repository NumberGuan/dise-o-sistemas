import { useCatalogs } from "~/components/CatalogProvider";
import { PhoneDetails } from "~/components/PhoneFields";
import BackToListButton from "~/components/BackToListButton";
import { useNavigate } from "react-router";

import {
  getDomicilioPorId,
  getNombreCompletoProveedor,
  getProveedorPorId,
} from "~/data/proveedores";

const formatDocumento = (nro: number) =>
  nro.toLocaleString("es-AR", { useGrouping: true });

export default function ProveedorDetallePage({
  proveedorId,
  onClose,
}: {
  proveedorId: string;
  onClose?: () => void;
}) {
  const catalogs = useCatalogs();
  const TIPOS_DOCUMENTO = catalogs["tipos-documento"].map(item => ({ id: Number(item.id), nombre: item.name, active: item.active }));
  const getTipoDocumentoPorId = (id: number) => TIPOS_DOCUMENTO.find(item => item.id === id);
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/proveedores");
  const proveedor = getProveedorPorId(Number(proveedorId));

  if (!proveedor) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Proveedor no encontrado
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          No existe un proveedor con ese identificador.
        </p>
        <BackToListButton onClick={() => navigate("/compras/proveedores")} />
      </div>
    );
  }

  const tipoDocumento = getTipoDocumentoPorId(proveedor.idTipoDocumento);
  const domicilio = getDomicilioPorId(proveedor.idDomicilio);

  const contenido = (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Datos del Proveedor</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Nombre / Razón Social
            </dt>
            <dd className="mt-1 font-medium text-gray-900">{proveedor.nombre}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Apellido
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {proveedor.apellido || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Documento
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {tipoDocumento?.nombre ?? "—"}{" "}
              {formatDocumento(proveedor.nroDocumento)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              e-mail
            </dt>
            <dd className="mt-1 font-medium text-gray-900">{proveedor.email}</dd>
          </div>
          <PhoneDetails primary={proveedor.telefono} additional={proveedor.telefonosAdicionales} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Domicilio
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {domicilio
                ? `${domicilio.calle} ${domicilio.altura}, ${domicilio.localidad}, ${domicilio.provincia}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Estado
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {proveedor.estado}
            </dd>
          </div>
        </dl>
    </section>
  );

  if (onClose) {
    return contenido;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="sticky top-16 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 py-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {getNombreCompletoProveedor(proveedor)}
            </h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                proveedor.estado === "Activo"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {proveedor.estado}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Código de persona: {proveedor.idPersona}
          </p>
        </div>
        <BackToListButton onClick={irVolver} />
      </div>
      {contenido}
    </div>
  );
}
