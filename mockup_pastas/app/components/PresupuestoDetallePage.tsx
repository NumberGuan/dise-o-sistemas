import { useNavigate } from "react-router";

import {
  getMontoPresupuesto,
  getPresupuestoPorId,
} from "~/data/presupuestos";
import {
  formatFecha,
  formatMoney,
  getMateriaPrimaPorId,
  getProveedorPorId,
} from "~/data/ordenes";

export default function PresupuestoDetallePage({
  presupuestoId,
  onClose,
}: {
  presupuestoId: string;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/presupuesto-proveedor");
  const presupuesto = getPresupuestoPorId(Number(presupuestoId));
  const hoy = new Date().toISOString().slice(0, 10);

  if (!presupuesto) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Presupuesto no encontrado
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          No existe un presupuesto con ese identificador.
        </p>
        <button
          type="button"
          onClick={irVolver}
          className="mt-6 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          Volver a Presupuestos
        </button>
      </div>
    );
  }

  const proveedor = getProveedorPorId(presupuesto.idProveedor);
  const vencido = presupuesto.fechaVencimiento < hoy;
  const montoTotal = getMontoPresupuesto(presupuesto.detalle);

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
              Fecha de creación
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatFecha(presupuesto.fechaEmision)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Vencimiento
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatFecha(presupuesto.fechaVencimiento)}
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
          <h2 className="font-semibold text-gray-900">
            Detalle del Presupuesto
          </h2>
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
              {presupuesto.detalle.map((linea, index) => {
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
                      {marca
                        ? formatMoney(marca.precioUnitario)
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
                <td colSpan={5} className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {presupuesto.numero}
            </h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                vencido
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {vencido ? "Vencido" : "Vigente"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Presupuesto recibido por mensaje desde {proveedor?.nombre ?? "el proveedor"}.
          </p>
        </div>
        <button
          type="button"
          onClick={irVolver}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          Volver a Presupuestos
        </button>
      </div>
      {contenido}
    </div>
  );
}