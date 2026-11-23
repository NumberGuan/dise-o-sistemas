import { useParams } from "react-router";
import RemitoProveedorDetallePage from "~/components/RemitoProveedorDetallePage";

export default function RemitoProveedorDetalle() {
  const { id } = useParams();
  return <RemitoProveedorDetallePage remitoId={id ?? ""} />;
}
