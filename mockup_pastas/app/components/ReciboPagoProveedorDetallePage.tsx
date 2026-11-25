import { useInternalData } from "~/components/InternalDataProvider";
import PurchaseDocument from "./PurchaseDocument";
import FormalPageHeader from "~/components/FormalPageHeader";
import { useNavigate } from "react-router";

import BackToListButton from "~/components/BackToListButton";
import { EMPRESA, numeroALetras, getMedioPagoPorId, getTotalComprobante } from "~/data/facturacion-proveedores";
import { formatMoney } from "~/data/ordenes";

export default function ReciboPagoProveedorDetallePage({
  reciboId,
  onClose,
}: {
  reciboId: string;
  onClose?: () => void;
}) {
  const { getReciboPorId, getComprobantePorId, getProveedorPorId, getOrdenes, getTotalPagado, getSaldoPendiente } = useInternalData("purchases");
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/recibo-pago-proveedor");
  const recibo = getReciboPorId(Number(reciboId));

  if (!recibo) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <FormalPageHeader className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Recibo no encontrado
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            No existe un recibo de pago con ese identificador.
          </p>
          <BackToListButton onClick={irVolver} />
        </FormalPageHeader>
      </div>
    );
  }

  const comprobante = getComprobantePorId(recibo.idComprobanteVentaProveedor);
  const proveedor = comprobante
    ? getProveedorPorId(comprobante.idProveedor)
    : undefined;
  const medio = getMedioPagoPorId(recibo.idMedioPago);
  const orden = comprobante ? getOrdenes().find(candidate => candidate.id === comprobante.idOrdenCompraProveedor) : undefined;

  return <PurchaseDocument onClose={irVolver} title="Recibo de Pago Proveedor" supplier={proveedor} signature totalLabel="Monto abonado"
    document={{ number: recibo.numero, date: recibo.fechaEmision, total: recibo.montoPagado }}
    payments={[{ method: medio?.tipo ?? "Sin informar", reference: medio?.observacion, amount: recibo.montoPagado }]}
    details={[
      { label: "Tipo de comprobante", value: `Recibo ${recibo.letra} · Documento no válido como factura` },
      { label: "Punto de venta / Número", value: `${recibo.puntoVenta}-${recibo.numeroComprobante}` },
      { label: "Factura aplicada", value: comprobante?.numero ?? "No disponible", href: comprobante ? `/compras/factura-proveedor/${comprobante.id}` : undefined },
      { label: "Orden de compra", value: orden?.numero ?? "Sin vincular", href: orden ? `/compras/ordenes/${orden.id}` : undefined },
      ...(comprobante ? [
        { label: "Importe neto de la factura", value: formatMoney(comprobante.importeNeto) },
        { label: "IVA de la factura", value: formatMoney(comprobante.importeIVA) },
        { label: "Total de la factura", value: formatMoney(getTotalComprobante(comprobante)) },
        { label: "Total pagado a la fecha", value: formatMoney(getTotalPagado(comprobante.id)) },
        { label: "Saldo pendiente de la factura", value: formatMoney(getSaldoPendiente(comprobante)) },
      ] : []),
    ]}>
    <p className="voucher-operational-note">Recibí de {EMPRESA.razonSocial} la suma de pesos {numeroALetras(recibo.montoPagado)}.</p>
  </PurchaseDocument>;
}
