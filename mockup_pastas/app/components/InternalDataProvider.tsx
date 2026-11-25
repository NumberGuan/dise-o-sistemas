import { createContext, useContext, useState, type ReactNode } from "react";
import { createPurchaseBilling } from "~/data/facturacion-proveedores";
import { createPurchaseOrders } from "~/data/ordenes";
import { createSupplierBudgets } from "~/data/presupuestos";
import { createSuppliers } from "~/data/proveedores";
import { createSupplierRemits } from "~/data/remitos";
import { createProductionOperations } from "~/data/produccion";
import { getRegisteredReturnedQuantity, getRemitAvailableQuantity } from "~/data/sales";
import type { getInternalData } from "~/data/internal.server";


type InternalData = ReturnType<typeof getInternalData>;

function createWorkspace(initial: InternalData) {
  // The mock modules keep their edits in this mounted session.
  const data = structuredClone(initial);
  const { production, purchases, sales } = data;
  return {
    employees: data.employees,
    employeeDirectory: data.employees ?? data.employeeDirectory,
    maintenance: data.maintenance,
    production: production && { ...production, ...createProductionOperations(production) },
    sales: sales && {
      ...sales,
      getRegisteredReturnedQuantity: (remitId: string, productId: string, excludingId?: string) =>
        getRegisteredReturnedQuantity(sales.SAMPLE_CUSTOMER_RETURNS, remitId, productId, excludingId),
      getRemitAvailableQuantity: (remit: (typeof sales.SAMPLE_REMITS)[number], productId: string, excludingId?: string) =>
        getRemitAvailableQuantity(sales.SAMPLE_CUSTOMER_RETURNS, remit, productId, excludingId),
    },
    purchases: purchases && {
      ...purchases,
      ...createSuppliers(purchases.suppliers),
      ...createPurchaseOrders(purchases.orders, purchases.MATERIAS_PRIMAS),
      ...createPurchaseBilling(purchases.COMPROBANTES_VENTA_PROVEEDOR, purchases.RECIBOS_PAGO_PROVEEDOR),
      ...createSupplierRemits(purchases.REMITOS),
      ...createSupplierBudgets(purchases.PRESUPUESTOS_PROVEEDOR),
    },
  };
}

type Workspace = ReturnType<typeof createWorkspace>;
const InternalDataContext = createContext<Workspace | null>(null);

export function InternalDataProvider({ initial, children }: { initial: InternalData; children: ReactNode }) {
  const [workspace] = useState(() => createWorkspace(initial));
  return <InternalDataContext.Provider value={workspace}>{children}</InternalDataContext.Provider>;
}

export function useInternalData<Key extends keyof Workspace>(key: Key): NonNullable<Workspace[Key]> {
  const value = useContext(InternalDataContext)?.[key];
  if (!value) throw new Error("Los datos de este módulo no están disponibles.");
  return value;
}
