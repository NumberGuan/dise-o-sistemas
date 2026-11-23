import { Outlet, useLocation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/produccion";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Producción"]);
  return null;
};

import ModuleDashboard from "~/components/ModuleDashboard";
import { ESTADOS_ORDEN_PRODUCCION, MATERIAS_PRIMAS_PRODUCCION, ORDENES_PRODUCCION, PRODUCTOS_PRODUCCION, RECETAS } from "~/data/produccion";

function ProductionDashboard() {
  const inProgress = ORDENES_PRODUCCION.filter((order) => order.estado === "En proceso").length;
  const pending = ORDENES_PRODUCCION.filter((order) => order.estado === "Pendiente").length;
  const ordersByStatus = ESTADOS_ORDEN_PRODUCCION.map((status) => ({
    label: status,
    value: ORDENES_PRODUCCION.filter((order) => order.estado === status).length,
  }));

  return (
    <ModuleDashboard
      moduleLabel="Producción"
      title="Producción"
      description="Planificá la elaboración y consultá productos, recetas y materias primas."
      summaryTitle="Resumen productivo"
      summaryDescription="Datos calculados desde las órdenes de producción y los catálogos del área."
      action={{ label: "Ver órdenes de producción", to: "/produccion/ordenes" }}
      metrics={[
        { label: "Productos", value: PRODUCTOS_PRODUCCION.length },
        { label: "Órdenes pendientes", value: pending, tone: "warning" },
        { label: "Órdenes en proceso", value: inProgress, tone: "info" },
        { label: "Recetas", value: RECETAS.length, tone: "success" },
      ]}
      distributionTitle="Órdenes por estado"
      distributionDescription={`${ORDENES_PRODUCCION.length} órdenes registradas y ${MATERIAS_PRIMAS_PRODUCCION.length} materias primas en catálogo.`}
      distribution={ordersByStatus}
    />
  );
}

export default function Produccion() {
  const { pathname } = useLocation();
  const isRoot = pathname === "/produccion" || pathname === "/produccion/";

  return isRoot ? <ProductionDashboard /> : <Outlet />;
}
