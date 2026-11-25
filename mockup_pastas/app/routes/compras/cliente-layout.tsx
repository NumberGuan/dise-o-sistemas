import { Outlet } from "react-router";
import { restrictTo } from "~/utils/access.server";

export const middleware = [restrictTo("Cliente")];

export default function ComprasCliente() {
  return <Outlet />;
}
