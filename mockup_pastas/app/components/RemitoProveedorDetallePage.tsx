import BackToListButton from "~/components/BackToListButton";
import { useNavigate } from "react-router";

import { formatFecha, getOrdenes, getProveedorPorId } from "~/data/ordenes";
import {
  getCantidadTotalRemito,
  getRemitoPorId,
} from "~/data/remitos";
import { getMateriaPrimaPorId } from "~/data/ordenes";

export default function RemitoProveedorDetallePage({
  remitoId,
  onClose,
}: {
  remitoId: string;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/remito-proveedor");
  const remito = getRemitoPorId(Number(remitoId));

  if (!remito) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Remito no encontrado
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          No existe un remito con ese identificador.
        </p>
        <BackToListButton onClick={irVolver} />
      </div>
    );
  }

  const proveedor = getProveedorPorId(remito.idProveedor);
  const orden = remito.idOrdenCompraProveedor
    ? getOrdenes().find((o) => o.id === remito.idOrdenCompraProveedor)
    : undefined;
  const cantidadTotal = getCantidadTotalRemito(remito.detalle);

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
              Orden de compra vinculada
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {orden?.numero ?? "Sin vincular"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Fecha
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatFecha(remito.fecha)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Cantidad total
            </dt>
            <dd className="mt-1 text-base font-bold text-gray-900">
              {cantidadTotal}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Detalle del Remito</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">N°</th>
                <th className="px-5 py-3 font-medium">Materia Prima</th>
                <th className="px-5 py-3 font-medium">Marca</th>
                <th className="px-5 py-3 font-medium">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {remito.detalle.map((linea, index) => {
                const producto = getMateriaPrimaPorId(linea.idMateriaPrima);
                const marca = producto?.marcas[0];
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {producto?.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {marca?.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {linea.cantidad}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td
                  colSpan={3}
                  className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Cantidad total
                </td>
                <td className="px-5 py-3 font-bold text-gray-900">
                  {cantidadTotal}
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
          <h1 className="text-2xl font-bold text-gray-900">{remito.numero}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Remito recibido del proveedor {proveedor?.nombre ?? "—"}.
          </p>
        </div>
        <BackToListButton onClick={irVolver} />
      </div>
      {contenido}
    </div>
  );
}