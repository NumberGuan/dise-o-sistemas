import { Outlet, useLocation, useOutletContext, redirect } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/compras";
import type { User } from "~/utils/db.server";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const url = new URL(request.url);
  if (user.role === "Cliente" && url.pathname !== "/compras" && url.pathname !== "/compras/") {
    throw redirect("/compras");
  }
  return user;
};

import ModuleDashboard from "~/components/ModuleDashboard";
import { getOrdenes } from "~/data/ordenes";
import { PRESUPUESTOS_PROVEEDOR } from "~/data/presupuestos";
import { getProveedores, getNombreCompletoProveedor } from "~/data/proveedores";
import { REMITOS } from "~/data/remitos";

function PurchasesDashboard() {
  const proveedores = getProveedores();
  const ordenes = getOrdenes();
  const activeSuppliers = proveedores.filter((supplier) => supplier.estado === "Activo").length;
  const ordersBySupplier = proveedores.map((supplier) => ({
    label: getNombreCompletoProveedor(supplier),
    value: ordenes.filter((order) => order.idProveedor === supplier.idPersona).length,
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
        { label: "Órdenes de compra", value: ordenes.length },
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

function ClientPurchasesDashboard() {
  return (
    <ModuleDashboard
      moduleLabel="Mis Compras"
      title="Mis Compras"
      description="Consulta el historial de tus pedidos y facturas de la Fábrica de Pastas."
      summaryTitle="Resumen de cuenta"
      summaryDescription="Información sobre tus últimas operaciones."
      metrics={[
        { label: "Pedidos pendientes", value: 0, tone: "info" },
        { label: "Compras realizadas", value: 0 },
      ]}
      distributionTitle="Estado de tus pedidos"
      distributionDescription="Actualmente no tienes pedidos registrados en esta sesión."
      distribution={[]}
    />
  );
}

export default function Compras() {
  const { pathname } = useLocation();
  const { user } = useOutletContext<{ user: User }>();
  const isRoot = pathname === "/compras" || pathname === "/compras/";

  if (!isRoot) {
    return <Outlet />;
  }

  if (user.role === "Cliente") {
    return <ClientPurchasesDashboard />;
  }

  return <PurchasesDashboard />;
}
