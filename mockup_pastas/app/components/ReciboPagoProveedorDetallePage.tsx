import { Link, useNavigate } from "react-router";

import BackToListButton from "~/components/BackToListButton";
import ReciboPagoProveedorPrintable from "~/components/ReciboPagoProveedorPrintable";
import {
  getComprobantePorId,
  getMedioPagoPorId,
  getReciboPorId,
  getSaldoPendiente,
  getTotalComprobante,
  getTotalPagado,
} from "~/data/facturacion-proveedores";
import {
  formatFecha,
  formatMoney,
  getProveedorPorId,
} from "~/data/ordenes";

export default function ReciboPagoProveedorDetallePage({
  reciboId,
  onClose,
}: {
  reciboId: string;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/recibo-pago-proveedor");
  const recibo = getReciboPorId(Number(reciboId));

  if (!recibo) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Recibo no encontrado
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          No existe un recibo de pago con ese identificador.
        </p>
        <BackToListButton onClick={irVolver} />
      </div>
    );
  }

  const comprobante = getComprobantePorId(recibo.idComprobanteVentaProveedor);
  const proveedor = comprobante
    ? getProveedorPorId(comprobante.idProveedor)
    : undefined;
  const medio = getMedioPagoPorId(recibo.idMedioPago);

  const contenido = (
    <>
      <section className="print-preview mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Vista previa del recibo
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Tal como se imprime. El diálogo del navegador permite guardarlo
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
            Imprimir recibo
          </button>
        </div>
        <div className="print-preview-frame overflow-x-auto bg-gray-50 p-4 sm:p-6">
          <ReciboPagoProveedorPrintable recibo={recibo} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Cabecera</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Comprobante saldado
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
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
            </dd>
          </div>
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
              Fecha de emisión
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatFecha(recibo.fechaEmision)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Medio de pago
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {medio?.tipo ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Observación
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {medio?.observacion ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Monto abonado
            </dt>
            <dd className="mt-1 text-base font-bold text-gray-900">
              {formatMoney(recibo.montoPagado)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Comprobante aplicado</h2>
        {comprobante ? (
          <>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <dd className="mt-1 font-medium text-gray-900">
                  {formatMoney(getTotalComprobante(comprobante))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Saldo pendiente
                </dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {formatMoney(getSaldoPendiente(comprobante))}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-gray-500">
              Total pagado hasta el momento:{" "}
              {formatMoney(getTotalPagado(comprobante.id))}.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            El comprobante vinculado ya no está disponible.
          </p>
        )}
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
          <h1 className="text-2xl font-bold text-gray-900">{recibo.numero}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pago realizado a {proveedor?.nombre ?? "del proveedor"}.
          </p>
        </div>
        <BackToListButton onClick={irVolver} />
      </div>
      {contenido}
    </div>
  );
}
