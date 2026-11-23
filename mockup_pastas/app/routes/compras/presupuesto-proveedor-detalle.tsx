import { useParams } from "react-router";

import PresupuestoDetallePage from "~/components/PresupuestoDetallePage";

export default function PresupuestoProveedorDetalle() {
  const { id } = useParams();
  return <PresupuestoDetallePage presupuestoId={id ?? ""} />;
}