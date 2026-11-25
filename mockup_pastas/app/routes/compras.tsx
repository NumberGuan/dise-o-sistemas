import { Outlet } from "react-router";
import { restrictTo } from "~/utils/access.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/compras";

export const middleware = [restrictTo("Administrador")];

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserAndRole(request, ["Administrador"]);
  return null;
}

export default function ComprasInternas() {
  return <div className="purchases-page"><Outlet /></div>;
}
