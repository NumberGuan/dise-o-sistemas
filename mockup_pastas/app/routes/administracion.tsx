import { Outlet, useLocation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/administracion";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Administrador"]);
  return null;
};

import ModuleDashboard from "~/components/ModuleDashboard";
import { EMPLOYEE_ROLES, SAMPLE_EMPLOYEES } from "~/data/employees";

function AdministrationDashboard() {
  const activeEmployees = SAMPLE_EMPLOYEES.filter((employee) => employee.status === "Activo").length;
  const inactiveEmployees = SAMPLE_EMPLOYEES.length - activeEmployees;
  const employeesByRole = EMPLOYEE_ROLES.map((role) => ({
    label: role,
    value: SAMPLE_EMPLOYEES.filter((employee) => employee.role === role).length,
  }));

  return (
    <ModuleDashboard
      moduleLabel="Administración"
      title="Administración"
      description="Consulta y actualiza el equipo de trabajo desde una única fuente compartida."
      summaryTitle="Resumen de empleados"
      summaryDescription="Información calculada desde el registro de empleados disponible durante esta sesión."
      action={{ label: "Gestionar empleados", to: "/administracion/empleados" }}
      metrics={[
        { label: "Total", value: SAMPLE_EMPLOYEES.length },
        { label: "Activos", value: activeEmployees, tone: "success" },
        { label: "Inactivos", value: inactiveEmployees, tone: "info" },
      ]}
      distributionTitle="Distribución por cargo"
      distribution={employeesByRole}
    />
  );
}

export default function Administracion() {
  const location = useLocation();
  const isAdministrationRoot = location.pathname === "/administracion" || location.pathname === "/administracion/";

  return isAdministrationRoot ? <AdministrationDashboard /> : <Outlet />;
}
