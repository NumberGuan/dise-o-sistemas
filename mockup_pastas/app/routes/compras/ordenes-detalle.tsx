import { useParams } from "react-router";

import OrdenCompraPage from "~/components/OrdenCompraPage";

export default function OrdenDetalle() {
  const { id } = useParams();
  return <OrdenCompraPage ordenId={id} />;
}