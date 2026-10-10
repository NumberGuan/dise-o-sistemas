import { Outlet, useLocation, redirect } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/compras";
import ModuleDashboard from "~/components/ModuleDashboard";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const requestPath = new URL(request.url).pathname;
  const pathname = requestPath === "/_root.data"
    ? "/"
    : requestPath.endsWith("/_.data")
      ? requestPath.replace(/_\.data$/, "")
    : requestPath.endsWith(".data")
      ? requestPath.slice(0, -".data".length)
      : requestPath;

  const allowedClientPaths = ["/compras", "/compras/", "/compras/catalogo", "/compras/carrito", "/compras/favoritos", "/compras/perfil", "/compras/pedidos"];
  if (user.role === "Cliente") {
    if (pathname === "/compras" || pathname === "/compras/") {
      throw redirect("/compras/catalogo");
    }
    if (!allowedClientPaths.includes(pathname)) {
      throw redirect("/compras/catalogo");
    }
  }
  return null;
};

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

export default function Compras() {
  const { pathname } = useLocation();
  const isRoot = pathname === "/compras" || pathname === "/compras/";

  if (!isRoot) {
    return <Outlet />;
  }

  return <PurchasesDashboard />;
}
