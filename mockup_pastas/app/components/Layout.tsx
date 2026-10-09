import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router";

import Navbar from "~/components/Navbar";
import Sidebar from "~/components/Sidebar";
import type { User } from "~/utils/db.server";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useOutletContext<{ user: User }>();

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          user={user}
        />
        <main className="flex-1">
          <Outlet context={{ user }} />
        </main>
        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
          Fábrica de Pastas © {new Date().getFullYear()} · Sistema de Gestión
        </footer>
      </div>
    </div>
  );
}