import { useParams } from "react-router";

import ProveedorDetallePage from "~/components/ProveedorDetallePage";

export default function ProveedorDetalle() {
  const { id } = useParams();
  return <ProveedorDetallePage proveedorId={id ?? ""} />;
}