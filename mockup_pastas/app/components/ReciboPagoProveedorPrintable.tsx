import {
  EMPRESA,
  formatearCUIT,
  getComprobantePorId,
  getMedioPagoPorId,
  numeroALetras,
  type ReciboPagoProveedor,
} from "~/data/facturacion-proveedores";
import {
  formatFecha,
  formatMoney,
  getOrdenes,
  getProveedorPorId,
} from "~/data/ordenes";
import { getDomicilioPorId } from "~/data/proveedores";

export default function ReciboPagoProveedorPrintable({
  recibo,
}: {
  recibo: ReciboPagoProveedor;
}) {
  const comprobante = getComprobantePorId(recibo.idComprobanteVentaProveedor);
  const proveedor = comprobante
    ? getProveedorPorId(comprobante.idProveedor)
    : undefined;
  const domicilio = proveedor
    ? getDomicilioPorId(proveedor.idDomicilio)
    : undefined;
  const medio = getMedioPagoPorId(recibo.idMedioPago);
  const orden = comprobante
    ? getOrdenes().find((o) => o.id === comprobante.idOrdenCompraProveedor)
    : undefined;

  return (
    <article
      id="documento-imprimir"
      className="print-document mx-auto w-full max-w-[794px] bg-white p-8 text-sm text-gray-900"
    >
      <header className="flex items-start justify-between gap-6 border-b-2 border-gray-900 pb-4">
        <div className="min-w-0">
          <p className="text-base font-bold uppercase">
            {proveedor?.nombre ?? "Proveedor"}
          </p>
          <p className="mt-1 text-xs">
            {domicilio
              ? `${domicilio.calle} ${domicilio.altura}, ${domicilio.localidad}, ${domicilio.provincia}`
              : "Domicilio no disponible"}
          </p>
          <p className="text-xs">
            CUIT:{" "}
            {proveedor
              ? proveedor.idTipoDocumento === 1
                ? formatearCUIT(proveedor.nroDocumento)
                : String(proveedor.nroDocumento)
              : "—"}
          </p>
          <p className="mt-2 text-[11px] font-semibold tracking-wide">
            IVA RESPONSABLE INSCRITO
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Constancia de pago
          </p>
          <p className="text-xl font-bold">RECIBO {recibo.letra}</p>
          <p className="mt-1 text-xs font-semibold">
            N° {recibo.puntoVenta}-{recibo.numeroComprobante}
          </p>
          <p className="text-xs">Fecha: {formatFecha(recibo.fechaEmision)}</p>
        </div>
      </header>

      <p className="mt-5 border-y-2 border-gray-900 bg-gray-100 py-2 text-center text-xs font-bold uppercase tracking-[0.2em]">
        Documento no válido como factura
      </p>

      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Recibí de
        </p>
        <p className="mt-1 font-semibold">{EMPRESA.razonSocial}</p>
        <p className="text-xs">CUIT: {EMPRESA.cuit}</p>
        <p className="text-xs">{EMPRESA.domicilio}</p>
      </section>

      <section className="mt-6 rounded border border-gray-400 px-4 py-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              La suma de pesos (en letras)
            </p>
            <p className="mt-1 font-semibold uppercase break-words">
              {numeroALetras(recibo.montoPagado)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Importe (en números)
            </p>
            <p className="mt-1 text-xl font-bold">
              {formatMoney(recibo.montoPagado)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          En concepto de
        </p>
        <p className="mt-1">
          {comprobante
            ? `Pago de la factura ${comprobante.puntoVenta}-${comprobante.numeroComprobante} (${comprobante.numero})`
            : "Pago a cuenta"}{" "}
          {orden ? `correspondiente a la orden de compra ${orden.numero}` : ""}.
        </p>
      </section>

      <section className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Medio de pago
        </p>
        <p className="mt-1">
          {medio?.tipo ?? "—"}
          {medio?.observacion ? ` · ${medio.observacion}` : ""}
        </p>
      </section>

      <div className="mt-16 grid grid-cols-2 gap-8 text-xs">
        <div className="border-t border-gray-900 pt-2">Firma del proveedor</div>
        <div className="border-t border-gray-900 pt-2">Aclaración</div>
      </div>

      <footer className="mt-10 border-t border-gray-300 pt-3 text-[11px] text-gray-600">
        Recibo X — documento de uso interno que acredita el pago total o parcial
        de una operación facturada (RG 1702/04). Conserve este ejemplar para su
        registración contable.
      </footer>
    </article>
  );
}
