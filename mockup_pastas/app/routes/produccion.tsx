import { Outlet, useLocation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/produccion";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return await requireUserAndRole(request, ["Producción"]);
};

import ModuleDashboard from "~/components/ModuleDashboard";
import { MATERIAS_PRIMAS } from "~/data/ordenes";
import { SAMPLE_MACHINES } from "~/data/maintenance";
import { SAMPLE_PRODUCTS } from "~/data/sales";

function ProductionDashboard() {
  const availableProducts = SAMPLE_PRODUCTS.filter((product) => product.stock === "Disponible").length;
  const activeMachines = SAMPLE_MACHINES.filter((machine) => machine.status === "Activa").length;
  const stockStates = [...new Set(SAMPLE_PRODUCTS.map((product) => product.stock))];
  const productsByStock = stockStates.map((status) => ({
    label: status,
    value: SAMPLE_PRODUCTS.filter((product) => product.stock === status).length,
  }));

  return (
    <ModuleDashboard
      moduleLabel="Producción"
      title="Producción"
      description="Consulta los recursos disponibles para la elaboración y planificación de productos."
      summaryTitle="Resumen productivo"
      summaryDescription="Información obtenida de los catálogos actuales de productos, materias primas y máquinas."
      action={{ label: "Ver productos", to: "/produccion/productos" }}
      metrics={[
        { label: "Productos catalogados", value: SAMPLE_PRODUCTS.length },
        { label: "Productos disponibles", value: availableProducts, tone: "success" },
        { label: "Materias primas", value: MATERIAS_PRIMAS.length, tone: "warning" },
        { label: "Máquinas activas", value: activeMachines, tone: "info" },
      ]}
      distributionTitle="Productos por disponibilidad"
      distributionDescription="Clasificación derivada del estado de stock informado por cada producto."
      distribution={productsByStock}
    />
  );
}

export default function Produccion() {
  const { pathname } = useLocation();
  const isRoot = pathname === "/produccion" || pathname === "/produccion/";

  return isRoot ? <ProductionDashboard /> : <Outlet />;
}
