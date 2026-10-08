import { Outlet, useLocation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/compras";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return await requireUserAndRole(request, ["Producción"]);
};

import ModuleDashboard from "~/components/ModuleDashboard";
import { ORDENES } from "~/data/ordenes";
import { PRESUPUESTOS_PROVEEDOR } from "~/data/presupuestos";
import { PROVEEDORES, getNombreCompletoProveedor } from "~/data/proveedores";
import { REMITOS } from "~/data/remitos";

function PurchasesDashboard() {
  const activeSuppliers = PROVEEDORES.filter((supplier) => supplier.estado === "Activo").length;
  const ordersBySupplier = PROVEEDORES.map((supplier) => ({
    label: getNombreCompletoProveedor(supplier),
    value: ORDENES.filter((order) => order.idProveedor === supplier.idPersona).length,
  })).filter((item) => item.value > 0);

  return (
    <ModuleDashboard
      moduleLabel="Compras"
      title="Compras"
      description="Consulta proveedores y administra las operaciones de abastecimiento de la fábrica."
      summaryTitle="Resumen de abastecimiento"
      summaryDescription="Datos calculados desde las órdenes, presupuestos, remitos y proveedores registrados."
      action={{ label: "Nueva orden de compra", to: "/compras/ordenes/nueva" }}
      metrics={[
        { label: "Órdenes de compra", value: ORDENES.length },
        { label: "Presupuestos recibidos", value: PRESUPUESTOS_PROVEEDOR.length, tone: "info" },
        { label: "Remitos registrados", value: REMITOS.length, tone: "success" },
        { label: "Proveedores activos", value: activeSuppliers, tone: "warning" },
      ]}
      distributionTitle="Órdenes por proveedor"
      distributionDescription="Cantidad de órdenes asociadas a cada proveedor con actividad registrada."
      distribution={ordersBySupplier}
    />
  );
}

export default function Compras() {
  const { pathname } = useLocation();
  const isRoot = pathname === "/compras" || pathname === "/compras/";

  return isRoot ? <PurchasesDashboard /> : <Outlet />;
}
