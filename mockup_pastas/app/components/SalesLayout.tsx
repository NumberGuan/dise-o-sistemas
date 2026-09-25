import { NavLink, Outlet } from "react-router";

import { SALES_PAGES } from "~/data/sales";

export function SalesLayout() {
  return (
    <>
      <nav className="border-b border-gray-200 bg-white" aria-label="Navegación de Ventas">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {SALES_PAGES.map((page) => (
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
      <Outlet />
    </>
  );
}

type SalesPageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function SalesPageHeader({ title, description, action }: SalesPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-amber-700">Ventas</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{description}</p>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </header>
  );
}
