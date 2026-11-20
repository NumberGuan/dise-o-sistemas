import { Link, useNavigate } from "react-router";

import BackToListButton from "~/components/BackToListButton";
import FacturaProveedorPrintable from "~/components/FacturaProveedorPrintable";
import {
  getComprobantePorId,
  getEstadoPago,
  getMedioPagoPorId,
  getRecibosDelComprobante,
  getSaldoPendiente,
  getTotalComprobante,
  getTotalPagado,
  type EstadoPago,
} from "~/data/facturacion-proveedores";
import {
  formatFecha,
  formatMoney,
  getMateriaPrimaPorId,
  getOrdenes,
  getProveedorPorId,
} from "~/data/ordenes";

const estadoClasses: Record<EstadoPago, string> = {
  Pagado: "bg-emerald-100 text-emerald-700",
  Parcial: "bg-amber-100 text-amber-800",
  Pendiente: "bg-rose-100 text-rose-700",
};

export default function ComprobanteVentaProveedorDetallePage({
  comprobanteId,
  onClose,
}: {
  comprobanteId: string;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/factura-proveedor");
  const comprobante = getComprobantePorId(Number(comprobanteId));

  if (!comprobante) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Comprobante no encontrado
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          No existe un comprobante con ese identificador.
        </p>
        <BackToListButton onClick={irVolver} />
      </div>
    );
  }

  const proveedor = getProveedorPorId(comprobante.idProveedor);
  const orden = getOrdenes().find(
    (o) => o.id === comprobante.idOrdenCompraProveedor,
  );
  const recibos = getRecibosDelComprobante(comprobante.id);
  const total = getTotalComprobante(comprobante);
  const pagado = getTotalPagado(comprobante.id);
  const saldo = getSaldoPendiente(comprobante);
  const estado = getEstadoPago(comprobante);

  const contenido = (
    <>
      <section className="print-preview mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Vista previa de la factura
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Tal como se imprime. El diálogo del navegador permite guardarla
              como PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 active:translate-y-px"
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
              <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v7H6z" />
            </svg>
            Imprimir factura
          </button>
        </div>
        <div className="print-preview-frame overflow-x-auto bg-gray-50 p-4 sm:p-6">
          <FacturaProveedorPrintable comprobante={comprobante} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Cabecera</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Proveedor
            </dt>
            <dd className="mt-1 font-medium text-gray-900 break-words">
              {proveedor?.nombre ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Orden de compra vinculada
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {orden ? (
                <Link
                  to={`/compras/ordenes/${orden.id}`}
                  className="text-amber-800 underline underline-offset-2"
                >
                  {orden.numero}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Fecha de emisión
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatFecha(comprobante.fechaEmision)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Importe neto
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatMoney(comprobante.importeNeto)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Importe de IVA
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatMoney(comprobante.importeIVA)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total comprobante
            </dt>
            <dd className="mt-1 text-base font-bold text-gray-900">
              {formatMoney(total)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Detalle del Comprobante
          </h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3 font-medium">N°</th>
              <th className="px-5 py-3 font-medium">Materia Prima</th>
              <th className="px-5 py-3 font-medium">Marca</th>
              <th className="px-5 py-3 font-medium">Cantidad</th>
              <th className="px-5 py-3 font-medium">Precio unitario</th>
              <th className="px-5 py-3 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {comprobante.detalle.map((linea, index) => {
              const producto = getMateriaPrimaPorId(linea.idMateriaPrima);
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {producto?.nombre ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {producto?.marcas[0]?.nombre ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{linea.cantidad}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatMoney(linea.precioUnitario)}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatMoney(linea.subtotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50">
              <td
                colSpan={5}
                className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Importe neto
              </td>
              <td className="px-5 py-3 font-bold text-gray-900">
                {formatMoney(comprobante.importeNeto)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Recibos aplicados</h2>
        </div>
        {recibos.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">
            No hay recibos de pago registrados para este comprobante.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Recibo</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Medio de pago</th>
                <th className="px-5 py-3 font-medium">Monto abonado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recibos.map((recibo) => (
                <tr key={recibo.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <Link
                      to={`/compras/recibo-pago-proveedor/${recibo.id}`}
                      className="text-amber-800 underline underline-offset-2"
                    >
                      {recibo.numero}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatFecha(recibo.fechaEmision)}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {getMedioPagoPorId(recibo.idMedioPago)?.tipo ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatMoney(recibo.montoPagado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <dl className="grid gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Total pagado</dt>
            <dd className="font-semibold text-gray-900">
              {formatMoney(pagado)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Saldo pendiente</dt>
            <dd className="font-bold text-gray-900">{formatMoney(saldo)}</dd>
          </div>
        </dl>
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {comprobante.numero}
            </h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoClasses[estado]}`}
            >
              {estado}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Comprobante de venta emitido por {proveedor?.nombre ?? "el proveedor"}.
          </p>
        </div>
        <BackToListButton onClick={irVolver} />
      </div>
      {contenido}
    </div>
  );
}
