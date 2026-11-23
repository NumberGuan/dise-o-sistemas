import { useParams } from "react-router";

import ProveedorFormPage from "~/components/ProveedorFormPage";

export default function ProveedorModificar() {
  const { id } = useParams();
  return <ProveedorFormPage proveedorId={id ?? ""} />;
}