import { NavLink, Outlet, useLocation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/mantenimiento";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return await requireUserAndRole(request, ["Producción"]);
};

import ModuleDashboard from "~/components/ModuleDashboard";
import { MAINTENANCE_TYPES, SAMPLE_MAINTENANCES } from "~/data/maintenance";
const pages = [
  { label: "Resumen", to: "/mantenimiento" },
  { label: "Máquinas", to: "/mantenimiento/maquinas" },
  { label: "Mantenimiento de Máquinas", to: "/mantenimiento/mantenimientos" },
] as const;

function MaintenanceDashboard() {
  const scheduled = SAMPLE_MAINTENANCES.filter((order) => order.status === "Programado").length;
  const inProgress = SAMPLE_MAINTENANCES.filter((order) => order.status === "En curso").length;
  const completed = SAMPLE_MAINTENANCES.filter((order) => order.status === "Finalizado").length;
  const items = SAMPLE_MAINTENANCES.flatMap((order) => order.items);
  const ordersByType = MAINTENANCE_TYPES.map((type) => ({
    label: type,
    value: items.filter((item) => item.type === type).length,
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
  return (
    <>
      <nav className="border-b border-gray-200 bg-white" aria-label="Navegación de Mantenimiento">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {pages.map((page) => (
            <NavLink
              key={page.to}
              to={page.to}
              end
              className={({ isActive }) =>
                `shrink-0 border-b-2 px-3 py-3 text-sm transition ${
                  isActive
                    ? "border-amber-600 font-semibold text-amber-800"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
                }`
              }
            >
              {page.label}
            </NavLink>
          ))}
        </div>
      </nav>
      {root ? <MaintenanceDashboard /> : <div className="text-gray-900"><Outlet /></div>}
    </>
  );
}
