import { useParams } from "react-router";
import ReciboPagoProveedorDetallePage from "~/components/ReciboPagoProveedorDetallePage";

export default function ReciboPagoProveedorDetalle() {
  const { id } = useParams();
  return <ReciboPagoProveedorDetallePage reciboId={id ?? ""} />;
}
