import { useInternalData } from "~/components/InternalDataProvider";
import {
  EMPRESA,
  formatearCUIT,
  getTotalComprobante,
  numeroALetras,
  type ComprobanteVentaProveedor,
} from "~/data/facturacion-proveedores";
import { formatFecha, formatMoney } from "~/data/ordenes";


export default function FacturaProveedorPrintable({
  comprobante,
}: {
  comprobante: ComprobanteVentaProveedor;
}) {
  const { getProveedorPorId, getDomicilioPorId, getMateriaPrimaPorId } = useInternalData("purchases");
  const proveedor = getProveedorPorId(comprobante.idProveedor);
  const domicilio = proveedor
    ? getDomicilioPorId(proveedor.idDomicilio)
    : undefined;
  const total = getTotalComprobante(comprobante);
  const alicuota = comprobante.importeNeto
    ? Math.round((comprobante.importeIVA / comprobante.importeNeto) * 100)
    : 21;

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
              ? `${domicilio.calle}, ${domicilio.localidad}, ${domicilio.provincia}`
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
            Comprobante de venta
          </p>
          <p className="text-xl font-bold">FACTURA {comprobante.letra}</p>
          <p className="mt-1 text-xs font-semibold">
            N° {comprobante.puntoVenta}-{comprobante.numeroComprobante}
          </p>
          <p className="text-xs">Fecha: {formatFecha(comprobante.fechaEmision)}</p>
        </div>
      </header>

      <section className="mt-4 rounded border border-gray-300 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Receptor
        </p>
        <p className="font-semibold">{EMPRESA.razonSocial}</p>
        <p className="text-xs">CUIT: {EMPRESA.cuit}</p>
        <p className="text-xs">{EMPRESA.domicilio}</p>
        <p className="mt-1 text-[11px] font-semibold">{EMPRESA.condicionIVA}</p>
      </section>

      <table className="mt-6 w-full text-left text-xs">
        <thead>
          <tr className="border-y border-gray-900 uppercase tracking-wide">
            <th className="py-2 font-semibold">Cant.</th>
            <th className="py-2 font-semibold">Descripción</th>
            <th className="py-2 text-right font-semibold">Precio unit.</th>
            <th className="py-2 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {comprobante.detalle.map((linea, index) => {
            const producto = getMateriaPrimaPorId(linea.idMateriaPrima);
            return (
              <tr key={index}>
                <td className="py-2">{linea.cantidad}</td>
                <td className="py-2">
                  {producto?.nombre ?? "Materia prima"}
                  {producto?.marcas[0] ? ` · ${producto.marcas[0].nombre}` : ""}
                </td>
                <td className="py-2 text-right">
                  {formatMoney(linea.precioUnitario)}
                </td>
                <td className="py-2 text-right">
                  {formatMoney(linea.subtotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-full max-w-[280px] text-xs">
        <div className="flex justify-between border-t border-gray-300 py-1">
          <span>Subtotal neto</span>
          <span>{formatMoney(comprobante.importeNeto)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>IVA {alicuota}%</span>
          <span>{formatMoney(comprobante.importeIVA)}</span>
        </div>
        <div className="flex justify-between border-t-2 border-gray-900 py-2 text-base font-bold">
          <span>TOTAL</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>

      <p className="mt-3 text-xs">
        <span className="font-semibold">Son pesos:</span>{" "}
        {numeroALetras(total)}.
      </p>

      <footer className="mt-10 flex items-end justify-between gap-6 border-t border-gray-300 pt-3 text-[11px]">
        <div>
          <p className="font-semibold">CAE N° {comprobante.cae}</p>
          <p className="mt-1 text-gray-600">
            Comprobante autorizado. Conserve este documento para su
            registración contable.
          </p>
        </div>
        <p className="shrink-0 font-semibold uppercase">
          Documento emitido por el proveedor
        </p>
      </footer>
    </article>
  );
}
