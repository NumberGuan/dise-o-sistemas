import { useInternalData } from "~/components/InternalDataProvider";
import PurchaseDocument from "./PurchaseDocument";
import FormalPageHeader from "~/components/FormalPageHeader";
import BackToListButton from "~/components/BackToListButton";
import { useNavigate } from "react-router";


import { getMontoTotal } from "~/data/ordenes";

export default function OrdenDetallePage({
  ordenId,
  onClose,
}: {
  ordenId: string;
  onClose?: () => void;
}) {
  const { getOrdenPorId, getProveedorPorId, PRESUPUESTOS, getComprobantePorOrden, getMarcaPorId } = useInternalData("purchases");
  const navigate = useNavigate();
  const irVolver = () => (onClose ? onClose() : navigate("/compras/ordenes"));
  const orden = getOrdenPorId(Number(ordenId));

  if (!orden) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <FormalPageHeader className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Orden no encontrada</h1>
          <p className="mt-2 text-sm text-gray-500">
            No existe una orden de compra con ese identificador.
          </p>
          <BackToListButton onClick={irVolver} />
        </FormalPageHeader>
      </div>
    );
  }

  const proveedor = getProveedorPorId(orden.idProveedor);
  const presupuesto = orden.idPresupuestoProveedor
    ? PRESUPUESTOS.find((p) => p.id === orden.idPresupuestoProveedor)
    : undefined;
  const comprobante = getComprobantePorOrden(orden.id);
  const montoTotal = getMontoTotal(orden.detalle);

  return <PurchaseDocument onClose={irVolver} title="Orden Compra Proveedor" supplier={proveedor} issuedBySupplier={false} signature
    document={{ number: orden.numero, date: orden.fechaEmision, total: montoTotal,
      items: orden.detalle.map(linea => {
        const marca = getMarcaPorId(linea.idMarca);
        return { productName: `${marca?.producto.nombre ?? "Materia prima"} · ${marca?.marca.nombre ?? "Sin marca"}`, quantity: linea.cantidad, unitPrice: linea.cantidad ? linea.subtotal / linea.cantidad : undefined, subtotal: linea.subtotal };
      }),
    }} details={[
      { label: "Presupuesto vinculado", value: presupuesto?.numero ?? "Sin vincular" },
      { label: "Factura vinculada", value: comprobante?.numero ?? "Sin factura", href: comprobante ? `/compras/factura-proveedor/${comprobante.id}` : undefined },
    ]} />;
}
