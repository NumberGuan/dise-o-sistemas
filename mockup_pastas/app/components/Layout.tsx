import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigation, useOutletContext } from "react-router";
import { AnimatePresence, MotionConfig, motion, useAnimate, useReducedMotion } from "motion/react";

import Navbar from "~/components/Navbar";
import Sidebar from "~/components/Sidebar";
import CustomerLayout from "~/components/CustomerLayout";
import { EASE_OUT, Toaster } from "~/components/motion";
import type { PublicUser } from "~/utils/db.server";

const SLOW_NAVIGATION_MS = 150;

/* Barra superior que solo aparece si la navegación tarda, para no parpadear en cambios instantáneos. */
function NavigationProgress() {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (navigation.state === "idle") return setVisible(false);
    const timer = window.setTimeout(() => setVisible(true), SLOW_NAVIGATION_MS);
    return () => window.clearTimeout(timer);
  }, [navigation.state]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden="true"
          className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-amber-600"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0.8, transition: { duration: 2, ease: EASE_OUT } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.2 } }}
        />
      )}
    </AnimatePresence>
  );
}

/* Cambio de pantalla: el contenido entra con un fundido corto sin desmontar el árbol. */
function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [scope, animatePage] = useAnimate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (scope.current && !reduceMotion) animatePage(scope.current, { opacity: [0, 1], transform: ["translateY(6px)", "translateY(0px)"] }, { duration: 0.22, ease: EASE_OUT });
  }, [pathname]);

  return <main ref={scope} className="flex-1">{children}</main>;
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
    <NavigationProgress />
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
        <PageTransition>
          <Outlet context={{ user }} />
        </PageTransition>
        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
          Fábrica de Pastas © {new Date().getFullYear()} · Sistema de Gestión
        </footer>
      </div>
    </div>
    <Toaster />
    </MotionConfig>
  );
}
