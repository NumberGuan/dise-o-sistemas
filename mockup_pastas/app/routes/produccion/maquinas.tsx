import { redirect } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/maquinas";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserAndRole(request, ["Administrador", "Producción"]);
  return redirect("/mantenimiento/maquinas");
}
