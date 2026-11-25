import { redirect } from "react-router";
import { restrictTo } from "~/utils/access.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/index";
import PurchasesDashboard from "~/components/PurchasesDashboard";

export const middleware = [restrictTo("Cliente", "Administrador")];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUserAndRole(request, ["Cliente", "Administrador"]);
  if (user.role === "Cliente") throw redirect("/compras/catalogo");
  return null;
}

export default PurchasesDashboard;
