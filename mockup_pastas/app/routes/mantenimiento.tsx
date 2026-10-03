import { Link, NavLink, Outlet, useLocation } from "react-router";

const pages = [
  { label: "Resumen", to: "/mantenimiento" },
  { label: "Máquinas", to: "/mantenimiento/maquinas" },
  { label: "Mantenimiento de Máquinas", to: "/mantenimiento/mantenimientos" },
] as const;

const PAGE_DETAILS: Record<string, string> = {
  "Máquinas": "Gestiona el inventario y estado de las máquinas de producción.",
  "Mantenimiento de Máquinas": "Registra y consulta las intervenciones de mantenimiento.",
};

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Mantenimiento</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Mantenimiento</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Administración de máquinas y seguimiento de sus intervenciones.</p>
        </div>
      </header>
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Módulos de Mantenimiento">
        {pages.slice(1).map((page) => (
          <Link key={page.to} to={page.to} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
            <span className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-900">{page.label}</span>
              <span aria-hidden="true" className="text-lg text-amber-700 transition group-hover:translate-x-1">→</span>
            </span>
            <span className="mt-2 block text-sm leading-6 text-gray-500">{PAGE_DETAILS[page.label]}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default function Mantenimiento() {
  const location = useLocation();
  const root = location.pathname === "/mantenimiento" || location.pathname === "/mantenimiento/";
  return (
    <>
      <nav className="border-b border-gray-200 bg-white" aria-label="Navegación de Mantenimiento">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {pages.map((page) => (
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
      {root ? <Dashboard /> : <div className="text-gray-900"><Outlet /></div>}
    </>
  );
}
