import { restrictTo } from "~/utils/access.server";
import { SalesLayout } from "~/components/SalesLayout";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/layout";

export const middleware = [restrictTo("Administrador", "Ventas")];

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Administrador", "Ventas"]);
  return null;
};

export default function VentasLayout() {
  return <SalesLayout />;
}
