import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, useOutletContext } from "react-router";
import { MotionConfig, useAnimate, useReducedMotion } from "motion/react";

import Navbar from "~/components/Navbar";
import Sidebar from "~/components/Sidebar";
import CustomerLayout from "~/components/CustomerLayout";
import { EASE_OUT, Toaster } from "~/components/motion";
import type { PublicUser } from "~/utils/db.server";

/* Cambio de pantalla: el contenido entra con un fundido corto sin desmontar el árbol. */
function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [scope, animatePage] = useAnimate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!scope.current) return;
    scope.current.style.transform = "none";
    if (!reduceMotion) animatePage(scope.current, { opacity: [0, 1] }, { duration: 0.22, ease: EASE_OUT });
  }, [pathname]);

  return <main id="contenido-gestion" tabIndex={-1} ref={scope} className="flex min-w-0 flex-1 scroll-mt-16 p-3 sm:p-5">
    <div className="page-surface min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm">{children}</div>
  </main>;
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useOutletContext<{ user: PublicUser }>();

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  if (user.role === "Cliente") {
    return <CustomerLayout user={user}><Outlet context={{ user }} /></CustomerLayout>;
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="staff-shell flex min-h-screen bg-gray-50">
      <a href="#contenido-gestion" className="sr-only z-60 rounded-lg bg-white p-3 text-gray-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Ir al contenido</a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
        <PageTransition>
          <Outlet context={{ user }} />
        </PageTransition>
        <footer className="staff-footer border-t border-gray-200 px-4 py-4 text-center text-xs text-gray-500">
          Fábrica de Pastas © {new Date().getFullYear()} · Sistema de Gestión
        </footer>
      </div>
    </div>
    <Toaster />
    </MotionConfig>
  );
}
