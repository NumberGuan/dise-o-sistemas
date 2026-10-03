import { Link, NavLink, Outlet, useLocation } from "react-router";

import { EMPLOYEE_ROLES, SAMPLE_EMPLOYEES } from "~/data/employees";

const ADMINISTRATION_PAGES = [
  { label: "Empleados", to: "/administracion/empleados" },
] as const;

function AdministrationDashboard() {
  const activeEmployees = SAMPLE_EMPLOYEES.filter((employee) => employee.status === "Activo").length;
  const inactiveEmployees = SAMPLE_EMPLOYEES.length - activeEmployees;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-medium text-amber-700">Administración</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Administración</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Consulta y actualiza el equipo de trabajo desde una única fuente compartida.
        </p>
      </header>

      <section aria-labelledby="employee-summary-title" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="employee-summary-title" className="text-lg font-semibold text-gray-900">Resumen de empleados</h2>
            <p className="mt-1 text-sm text-gray-500">Información disponible durante esta sesión.</p>
          </div>
          <Link
            to="/administracion/empleados"
            className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            Gestionar empleados
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{SAMPLE_EMPLOYEES.length}</p>
          </article>
          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">Activos</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">{activeEmployees}</p>
          </article>
          <article className="rounded-xl border border-gray-200 bg-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Inactivos</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{inactiveEmployees}</p>
          </article>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900">Distribución por cargo</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {EMPLOYEE_ROLES.map((role) => (
              <div key={role} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <dt className="text-sm text-gray-600">{role}</dt>
                <dd className="font-semibold text-gray-900">
                  {SAMPLE_EMPLOYEES.filter((employee) => employee.role === role).length}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
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
