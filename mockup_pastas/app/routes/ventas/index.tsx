import ModuleDashboard from "~/components/ModuleDashboard";
import {
  ORDER_STATUSES,
  SAMPLE_BUDGETS,
  SAMPLE_INVOICES,
  SAMPLE_REMITS,
} from "~/data/sales";
import { getSalesData } from "~/data/sales.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Ventas"]);
  const { orders } = await getSalesData();
  return { orders };
};

export default function Ventas({ loaderData }: Route.ComponentProps) {
  const orders = loaderData.orders;
  const ordersInProgress = orders.filter(
    (order) => order.status === "Pendiente" || order.status === "En preparación",
  ).length;
  const issuedInvoices = SAMPLE_INVOICES.filter((invoice) => invoice.status === "Emitido").length;
  const deliveredRemits = SAMPLE_REMITS.filter((remit) => remit.status === "Entregado").length;
  const ordersByStatus = ORDER_STATUSES.map((status) => ({
    label: status,
    value: orders.filter((order) => order.status === status).length,
  }));

  return (
    <ModuleDashboard
      moduleLabel="Ventas"
      title="Ventas"
      description="Gestiona la actividad comercial y el seguimiento de las operaciones con clientes."
      summaryTitle="Resumen comercial"
      summaryDescription="Los pedidos se guardan en el registro; los demás indicadores conservan los datos de muestra."
      action={{ label: "Gestionar pedidos", to: "/ventas/pedidos" }}
      metrics={[
        { label: "Presupuestos", value: SAMPLE_BUDGETS.length },
        { label: "Pedidos en curso", value: ordersInProgress, tone: "warning" },
        { label: "Comprobantes emitidos", value: issuedInvoices, tone: "info" },
        { label: "Remitos entregados", value: deliveredRemits, tone: "success" },
      ]}
      distributionTitle="Pedidos por estado"
      distributionDescription="Distribución actual de los pedidos registrados."
      distribution={ordersByStatus}
    />
  );
}
