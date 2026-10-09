import { CloseIcon, MenuIcon } from "~/components/icons";
import type { User } from "~/utils/db.server";

type NavbarProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  user: User;
};

export default function Navbar({ sidebarOpen, onToggleSidebar, user }: NavbarProps) {
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

      <div className="ml-auto flex items-center">
        <span className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white uppercase">
            {user.name.charAt(0)}
          </span>
          <span className="font-medium text-gray-900">{user.name}</span>
          <span className="ml-1 text-xs text-gray-500">({user.role})</span>
        </span>
      </div>
    </header>
  );
}
