import { NavLink } from "react-router";

import { CloseIcon, Logo, MenuIcon } from "~/components/icons";

type NavbarProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export default function Navbar({ sidebarOpen, onToggleSidebar }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Contraer menú" : "Abrir menú"}
        aria-expanded={sidebarOpen}
        className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
      >
        {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      <NavLink to="/" className="flex min-w-0 items-center gap-2.5">
        <Logo />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-gray-900 sm:text-lg">
            Fábrica de Pastas
          </p>
          <p className="-mt-0.5 hidden text-xs font-medium text-amber-700 sm:block">
            Sistema de Gestión
          </p>
        </div>
      </NavLink>

      <div className="ml-auto flex items-center">
        <span className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
            U
          </span>
          Usuario
        </span>
      </div>
    </header>
  );
}