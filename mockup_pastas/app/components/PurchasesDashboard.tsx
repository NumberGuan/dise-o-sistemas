import { useInternalData } from "~/components/InternalDataProvider";
import ModuleDashboard from "~/components/ModuleDashboard";
import { getNombreCompletoProveedor } from "~/data/proveedores";

export default function PurchasesDashboard() {
  const { getProveedores, getOrdenes, PRESUPUESTOS_PROVEEDOR, REMITOS } = useInternalData("purchases");
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
