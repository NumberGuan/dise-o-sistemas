import { Navigate } from "react-router";

export default function MaquinasProduccionRedirect() {
  return <Navigate to="/mantenimiento/maquinas" replace />;
}
