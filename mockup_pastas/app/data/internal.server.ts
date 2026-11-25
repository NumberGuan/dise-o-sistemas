import type { Role } from "~/utils/db.server";
import { purchasesFixtures } from "./compras-fixtures.server";
import { SAMPLE_EMPLOYEES } from "./employees-fixtures.server";
import { SAMPLE_MACHINES, SAMPLE_MAINTENANCES } from "./maintenance-fixtures.server";
import { MATERIAS_PRIMAS_PRODUCCION, ORDENES_PRODUCCION, PRODUCTOS_PRODUCCION, RECETAS } from "./produccion-fixtures.server";
import { SAMPLE_CLIENTS, SAMPLE_ORDERS, SAMPLE_INVOICES, SAMPLE_BUDGETS, SAMPLE_REMITS, SAMPLE_CUSTOMER_RETURNS } from "./sales-fixtures.server";

export function getInternalData(role: Role) {
  const admin = role === "Administrador";
  const sales = role === "Ventas" || admin;
  const production = role === "Producción" || admin;

  return {
    employees: admin ? SAMPLE_EMPLOYEES : undefined,
    employeeDirectory: sales || production ? SAMPLE_EMPLOYEES.map(({ id, name, status }) => ({ id, name, status })) : undefined,
    sales: sales ? { SAMPLE_CLIENTS, SAMPLE_ORDERS, SAMPLE_INVOICES, SAMPLE_BUDGETS, SAMPLE_REMITS, SAMPLE_CUSTOMER_RETURNS } : undefined,
    production: production ? { MATERIAS_PRIMAS_PRODUCCION, ORDENES_PRODUCCION, PRODUCTOS_PRODUCCION, RECETAS } : undefined,
    maintenance: production ? { SAMPLE_MACHINES, SAMPLE_MAINTENANCES } : undefined,
    purchases: admin ? purchasesFixtures : undefined,
  };
}
