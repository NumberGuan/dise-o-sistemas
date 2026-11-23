import { useParams } from "react-router";
import ComprobanteVentaProveedorDetallePage from "~/components/ComprobanteVentaProveedorDetallePage";

export default function FacturaProveedorDetalle() {
  const { id } = useParams();
  return <ComprobanteVentaProveedorDetallePage comprobanteId={id ?? ""} />;
}
