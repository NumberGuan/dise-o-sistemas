import { useInternalData } from "~/components/InternalDataProvider";
import { restrictTo } from "~/utils/access.server";
import { Outlet, useLocation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/mantenimiento";

export const middleware = [restrictTo("Administrador", "Producción")];

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Administrador", "Producción"]);
  return null;
};

import ModuleDashboard from "~/components/ModuleDashboard";
import { useCatalogs } from "~/components/CatalogProvider";


function MaintenanceDashboard() {
  const { SAMPLE_MAINTENANCES } = useInternalData("maintenance");
  const catalogs = useCatalogs();
  const scheduled = SAMPLE_MAINTENANCES.filter((order) => order.status === "Programado").length;
  const inProgress = SAMPLE_MAINTENANCES.filter((order) => order.status === "En curso").length;
  const completed = SAMPLE_MAINTENANCES.filter((order) => order.status === "Finalizado").length;
  const items = SAMPLE_MAINTENANCES.flatMap((order) => order.items);
  const ordersByType = catalogs["tipos-mantenimiento"].map((type) => ({
    label: type.name,
    value: items.filter((item) => item.type === type.value).length,
  }));

  return (
    <ModuleDashboard
      moduleLabel="Mantenimiento"
      title="Mantenimiento"
      description="Administra las máquinas y realiza el seguimiento de sus intervenciones."
      summaryTitle="Resumen de mantenimiento"
      summaryDescription="Información calculada desde las órdenes de mantenimiento registradas."
      action={{ label: "Gestionar mantenimientos", to: "/mantenimiento/mantenimientos" }}
      metrics={[
        { label: "Órdenes totales", value: SAMPLE_MAINTENANCES.length },
        { label: "Programadas", value: scheduled, tone: "warning" },
        { label: "En curso", value: inProgress, tone: "info" },
        { label: "Finalizadas", value: completed, tone: "success" },
      ]}
      distributionTitle="Intervenciones por tipo"
      distributionDescription="Clasificación de las tareas incluidas en las órdenes actuales."
      distribution={ordersByType}
    />
  );
}

export default function Mantenimiento() {
  const location = useLocation();
  const root = location.pathname === "/mantenimiento" || location.pathname === "/mantenimiento/";
  return root ? <MaintenanceDashboard /> : <div className="text-gray-900"><Outlet /></div>;
}
