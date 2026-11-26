import { useInternalData } from "~/components/InternalDataProvider";
import PurchaseDocument from "./PurchaseDocument";
import FormalPageHeader from "~/components/FormalPageHeader";
import BackToListButton from "~/components/BackToListButton";
import { useNavigate } from "react-router";


import { getCantidadTotalRemito } from "~/data/remitos";


export default function RemitoProveedorDetallePage({
  remitoId,
  onClose,
}: {
  remitoId: string;
  onClose?: () => void;
}) {
  const { getRemitoPorId, getProveedorPorId, getOrdenes, getMateriaPrimaPorId } = useInternalData("purchases");
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/remito-proveedor");
  const remito = getRemitoPorId(Number(remitoId));

  if (!remito) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <FormalPageHeader className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Remito no encontrado
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            No existe un remito con ese identificador.
          </p>
          <BackToListButton onClick={irVolver} />
        </FormalPageHeader>
      </div>
    );
  }

  const proveedor = getProveedorPorId(remito.idProveedor);
  const orden = remito.idOrdenCompraProveedor
    ? getOrdenes().find((o) => o.id === remito.idOrdenCompraProveedor)
    : undefined;
  const cantidadTotal = getCantidadTotalRemito(remito.detalle);

  return <PurchaseDocument onClose={irVolver} title="Remito Proveedor" supplier={proveedor} signature
    attachment={{ kind: "remito", documentId: remito.id }}
    document={{ number: remito.numero, date: remito.fecha,
      items: remito.detalle.map(linea => {
        const producto = getMateriaPrimaPorId(linea.idMateriaPrima);
        return { productName: `${producto?.nombre ?? "Materia prima"} · ${producto?.marcas[0]?.nombre ?? "Sin marca"}`, quantity: linea.cantidad };
      }),
    }} details={[
      { label: "Orden de compra vinculada", value: orden?.numero ?? "Sin vincular", href: orden ? `/compras/ordenes/${orden.id}` : undefined },
      { label: "Cantidad total recibida", value: String(cantidadTotal) },
    ]} />;
}
