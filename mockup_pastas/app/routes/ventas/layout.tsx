import { SalesLayout } from "~/components/SalesLayout";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/layout";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Ventas"]);
  return null;
};

export default function VentasLayout() {
  return <SalesLayout />;
}
