import { useParams } from "react-router";

import OrdenDetallePage from "~/components/OrdenDetallePage";

export default function OrdenDetalle() {
  const { id } = useParams();
  return <OrdenDetallePage ordenId={id ?? ""} />;
}