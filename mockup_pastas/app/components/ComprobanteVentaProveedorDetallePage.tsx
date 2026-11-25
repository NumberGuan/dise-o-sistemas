import { useInternalData } from "~/components/InternalDataProvider";
import PurchaseDocument from "./PurchaseDocument";
import FormalPageHeader from "~/components/FormalPageHeader";
import { Link, useNavigate } from "react-router";

import BackToListButton from "~/components/BackToListButton";
import { numeroALetras, getMedioPagoPorId, getTotalComprobante } from "~/data/facturacion-proveedores";
import { formatFecha, formatMoney } from "~/data/ordenes";

export default function ComprobanteVentaProveedorDetallePage({
  comprobanteId,
  onClose,
}: {
  comprobanteId: string;
  onClose?: () => void;
}) {
  const { getComprobantePorId, getProveedorPorId, getOrdenes, getRecibosDelComprobante, getTotalPagado, getSaldoPendiente, getEstadoPago, getMateriaPrimaPorId } = useInternalData("purchases");
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/factura-proveedor");
  const comprobante = getComprobantePorId(Number(comprobanteId));

  if (!comprobante) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <FormalPageHeader className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Comprobante no encontrado
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            No existe un comprobante con ese identificador.
          </p>
          <BackToListButton onClick={irVolver} />
        </FormalPageHeader>
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

  return <PurchaseDocument onClose={irVolver} title="Factura Proveedor" supplier={proveedor}
    document={{ number: comprobante.numero, date: comprobante.fechaEmision, status: estado, subtotal: comprobante.importeNeto, tax: comprobante.importeIVA, total,
      items: comprobante.detalle.map(linea => {
        const producto = getMateriaPrimaPorId(linea.idMateriaPrima);
        return { productName: `${producto?.nombre ?? "Materia prima"} · ${producto?.marcas[0]?.nombre ?? "Sin marca"}`, quantity: linea.cantidad, unitPrice: linea.precioUnitario, subtotal: linea.subtotal };
      }),
    }} details={[
      { label: "Tipo de comprobante", value: `Factura ${comprobante.letra}` },
      { label: "Punto de venta / Número", value: `${comprobante.puntoVenta}-${comprobante.numeroComprobante}` },
      { label: "CAE", value: comprobante.cae },
      { label: "Orden de compra", value: orden?.numero ?? "Sin vincular", href: orden ? `/compras/ordenes/${orden.id}` : undefined },
    ]} extraTotals={[{ label: "Total pagado", amount: pagado }, { label: "Saldo pendiente", amount: saldo }]}>
    <p className="voucher-operational-note">Son pesos: {numeroALetras(total)}.</p>
    <section className="voucher-allocations">
      <h2>Recibos aplicados</h2>
      {recibos.length ? <table><thead><tr><th>Recibo / Fecha</th><th>Medio de pago</th><th className="numeric">Monto abonado</th></tr></thead>
        <tbody>{recibos.map(recibo => <tr key={recibo.id}>
          <td><Link to={`/compras/recibo-pago-proveedor/${recibo.id}`}>{recibo.numero}</Link><small>{formatFecha(recibo.fechaEmision)}</small></td>
          <td>{getMedioPagoPorId(recibo.idMedioPago)?.tipo ?? "Sin informar"}</td><td className="numeric">{formatMoney(recibo.montoPagado)}</td>
        </tr>)}</tbody></table> : <p>No hay recibos de pago registrados para esta factura.</p>}
    </section>
  </PurchaseDocument>;
}
