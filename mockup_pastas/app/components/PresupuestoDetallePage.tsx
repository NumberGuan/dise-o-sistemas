import { useInternalData } from "~/components/InternalDataProvider";
import PurchaseDocument from "./PurchaseDocument";
import FormalPageHeader from "~/components/FormalPageHeader";
import BackToListButton from "~/components/BackToListButton";
import { useNavigate } from "react-router";

import { getMontoPresupuesto } from "~/data/presupuestos";


export default function PresupuestoDetallePage({
  presupuestoId,
  onClose,
}: {
  presupuestoId: string;
  onClose?: () => void;
}) {
  const { getPresupuestoPorId, getProveedorPorId, getMateriaPrimaPorId } = useInternalData("purchases");
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/presupuesto-proveedor");
  const presupuesto = getPresupuestoPorId(Number(presupuestoId));
  const hoy = new Date().toISOString().slice(0, 10);

  if (!presupuesto) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <FormalPageHeader className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Presupuesto no encontrado
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            No existe un presupuesto con ese identificador.
          </p>
          <BackToListButton onClick={irVolver} />
        </FormalPageHeader>
      </div>
    );
  }

  const proveedor = getProveedorPorId(presupuesto.idProveedor);
  const vencido = presupuesto.fechaVencimiento < hoy;
  const montoTotal = getMontoPresupuesto(presupuesto.detalle);

  return <PurchaseDocument onClose={irVolver} title="Presupuesto Proveedor" supplier={proveedor} signature
    document={{ number: presupuesto.numero, date: presupuesto.fechaEmision, status: vencido ? "Vencido" : "Vigente", total: montoTotal,
      items: presupuesto.detalle.map(linea => {
        const producto = getMateriaPrimaPorId(linea.idMateriaPrima);
        return { productName: `${producto?.nombre ?? "Materia prima"} · ${producto?.marcas[0]?.nombre ?? "Sin marca"}`, quantity: linea.cantidad, unitPrice: linea.cantidad ? linea.subtotal / linea.cantidad : undefined, subtotal: linea.subtotal };
      }),
    }} details={[{ label: "Vencimiento", value: presupuesto.fechaVencimiento }, { label: "Origen", value: "Presupuesto recibido del proveedor" }]} />;
}
