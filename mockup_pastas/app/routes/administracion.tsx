import { NavLink, Outlet, useLocation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/administracion";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return await requireUserAndRole(request, ["Administrador"]);
};

import ModuleDashboard from "~/components/ModuleDashboard";
import { EMPLOYEE_ROLES, SAMPLE_EMPLOYEES } from "~/data/employees";

const ADMINISTRATION_PAGES = [
  { label: "Empleados", to: "/administracion/empleados" },
] as const;

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

  return (
    <>
      <nav className="border-b border-gray-200 bg-white" aria-label="Navegación de Administración">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {ADMINISTRATION_PAGES.map((page) => (
            <NavLink
              key={page.to}
              to={page.to}
              end
              className={({ isActive }) =>
                `shrink-0 border-b-2 px-3 py-3 text-sm transition ${
                  isActive
                    ? "border-amber-600 font-semibold text-amber-800"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
                }`
              }
            >
              {page.label}
            </NavLink>
          ))}
        </div>
      </nav>
      {isAdministrationRoot ? <AdministrationDashboard /> : <Outlet />}
    </>
  );
}
