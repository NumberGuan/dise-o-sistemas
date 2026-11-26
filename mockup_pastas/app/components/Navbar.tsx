import { CloseIcon, MenuIcon } from "~/components/icons";

type NavbarProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export default function Navbar({ sidebarOpen, onToggleSidebar }: NavbarProps) {
  return (
    <header className="staff-navbar sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 sm:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Contraer menú" : "Abrir menú"}
        aria-expanded={sidebarOpen}
        aria-controls="menu-gestion"
        className="staff-menu-control inline-flex h-10 w-10 items-center justify-center rounded-lg border transition"
      >
        {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
      <span className="staff-navbar-title text-sm font-semibold">Sistema de gestión</span>
    </header>
  );
}
