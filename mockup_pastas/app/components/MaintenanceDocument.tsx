import type { ComponentProps } from "react";
import ProductionDocument from "./ProductionDocument";

export default function MaintenanceDocument(props: Omit<ComponentProps<typeof ProductionDocument>, "moduleLabel">) {
  return <ProductionDocument {...props} moduleLabel="Mantenimiento" />;
}

export { ProductionSection as MaintenanceSection, productionDate as maintenanceDate } from "./ProductionDocument";
