import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";

import { motion } from "motion/react";

import { CloseIcon, Logo } from "~/components/icons";
import { Chevron, EASE_OUT } from "~/components/motion";
import { NAV_SECTIONS } from "~/data/navigation";

import type { PublicUser } from "~/utils/db.server";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  user: PublicUser;
};

type IconProps = {
  className?: string;
};

function SectionIcon({ section }: { section: string }) {
  const sharedProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
    "aria-hidden": true,
  };

  if (section === "Ventas") {
    return (
      <svg {...sharedProps}>
        <path d="M5 9h14l-1 10H6L5 9Z" />
        <path d="M8 9V6.5A3.5 3.5 0 0 1 11.5 3h1A3.5 3.5 0 0 1 16 6.5V9M4 19h16" />
        <path d="M9 13h6" />
      </svg>
    );
  }

  if (section === "Panel principal") {
    return (
      <svg {...sharedProps}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </svg>
    );
  }

  if (section === "Compras") {
    return (
      <svg {...sharedProps}>
        <path d="M3.5 5h2l1.8 8.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L20 8H6.2" />
        <circle cx="9.5" cy="19" r="1" />
        <circle cx="17" cy="19" r="1" />
      </svg>
    );
  }

  if (section === "Producción") {
    return (
      <svg {...sharedProps}>
        <path d="M4 20V10l5 2.5V9l5 2.5V6l6 3v11H4Z" />
        <path d="M8 16h1M12 16h1M16 16h1" />
      </svg>
    );
  }

  if (section === "Administración") {
    return (
      <svg {...sharedProps}>
        <path d="M14.5 20H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v2" />
        <path d="M10.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7.5 14a3 3 0 0 1 6 0" />
        <rect x="14" y="13" width="7" height="6" rx="1.5" />
        <path d="M16 13v-1a1.5 1.5 0 0 1 3 0v1" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="m14.2 6.2 3.6 3.6M12.8 7.6l4.8 4.8M4.5 19.5l5.8-5.8" />
      <path d="M14.3 4.6a4 4 0 0 0-5.1 5.1L4 14.9A2.9 2.9 0 1 0 8.1 19l5.2-5.2a4 4 0 0 0 5.1-5.1l-2.7 2.7-3.1-3.1 2.7-2.7a4 4 0 0 0-1-.9Z" />
    </svg>
  );
}

function LogoutIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${className}`} aria-hidden="true">
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M18 12H8" />
    </svg>
  );
}

export default function Sidebar({ open, onClose, user }: SidebarProps) {
  const { pathname } = useLocation();
  const isCatalogRoute = pathname.startsWith("/administracion/catalogos/");
  const isCurrentItem = (to: string, isActive: boolean) => isActive || (to === "/administracion" && isCatalogRoute);
  const canLogout = ["Administrador", "Ventas", "Producción"].includes(user.role);
  const compactRole = user.role === "Administrador" ? "Admin" : user.role;

  const filteredSections = NAV_SECTIONS.filter((section) => {
    if (user.role === "Administrador") return true;
    if (user.role === "Ventas" && section.label === "Ventas") return true;
    if (user.role === "Producción" && section.label === "Producción") return true;
    if (user.role === "Cliente" && section.label === "Compras") return true;
    return false;
  }).map(section => {
    // If it's a Cliente accessing Compras, replace internal sub-items with client sub-items
    if (user.role === "Cliente" && section.label === "Compras") {
      return { 
        ...section, 
        items: [
          { label: "Catálogo", to: "/compras/catalogo" },
          { label: "Mi Carrito", to: "/compras/carrito" },
          { label: "Mis Favoritos", to: "/compras/favoritos" },
          { label: "Mis Pedidos", to: "/compras/pedidos" },
          { label: "Mi Perfil", to: "/compras/perfil" },
        ] 
      };
    }
    return section;
  });

  const activeSection = filteredSections.find(
    (section) => pathname === section.to || pathname.startsWith(`${section.to}/`),
  );
  const [expandedSection, setExpandedSection] = useState<string | null>(
    activeSection?.label ?? "Ventas",
  );

  useEffect(() => {
    if (activeSection) {
      setExpandedSection(activeSection.label);
    }
  }, [activeSection?.label]);

  const handleNavigate = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {open && (
        <div
          className="staff-menu-backdrop fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        id="menu-gestion"
        aria-label="Menú lateral"
        className={`staff-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-64 shrink-0 flex-col overflow-hidden border-r shadow-xl transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0 lg:w-64" : "invisible -translate-x-full lg:visible lg:w-20"
        }`}
      >
        <div className={`staff-sidebar-brand flex h-16 shrink-0 items-center border-b ${open ? "gap-3 px-4" : "justify-center px-2"}`}>
          <NavLink
            to="/"
            onClick={handleNavigate}
            className={`flex min-w-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${open ? "flex-1 gap-3" : "justify-center"}`}
            title="Fábrica de Pastas"
          >
            <Logo />
            {open && (
              <span className="min-w-0 leading-tight">
                <span className="staff-brand-name block truncate font-bold">Fábrica de Pastas</span>
                <span className="staff-sidebar-muted block truncate text-[11px] font-medium">ERP Industrial</span>
              </span>
            )}
          </NavLink>
          {open && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú lateral"
              className="staff-menu-control ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition lg:hidden"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <nav className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Navegación principal">
          <ul className="flex flex-col gap-1.5">
            {filteredSections.map((section) => {
              const expanded = expandedSection === section.label;
              const active = activeSection?.label === section.label;

              return (
                <li key={section.to} className="shrink-0">
                  <div
                    className={`staff-menu-section relative flex min-h-11 shrink-0 items-center rounded-lg transition-colors ${
                      active ? "staff-menu-section-active" : ""
                    }`}
                  >
                    <NavLink
                      to={section.to}
                      onClick={handleNavigate}
                      title={section.label}
                      className={`flex min-w-0 flex-1 items-center rounded-lg py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${
                        open ? "gap-3 pl-4 pr-2" : "justify-center px-2"
                      }`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
                        <SectionIcon section={section.label} />
                      </span>
                      {open && <span className="truncate text-sm font-medium">{section.label}</span>}
                    </NavLink>

                    {open && section.items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expanded ? null : section.label)}
                        aria-expanded={expanded}
                        aria-controls={`sidebar-${section.label}`}
                        aria-label={`${expanded ? "Contraer" : "Expandir"} ${section.label}`}
                        className="staff-menu-control mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors"
                      >
                        <Chevron open={expanded} className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                    {open && expanded && section.items.length > 0 && (
                      <div id={`sidebar-${section.label}`}>
                        <div className="staff-submenu ml-6 mt-1.5 space-y-0.5 border-l pl-3">
                          {section.items.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              end
                              onClick={handleNavigate}
                              className={({ isActive }) =>
                                `staff-menu-link relative block rounded-md px-3 py-2 text-sm transition-colors ${
                                  isCurrentItem(item.to, isActive) ? "staff-menu-link-active font-semibold" : ""
                                }`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  {isCurrentItem(item.to, isActive) && (
                                    <motion.span
                                      layoutId="sidebar-active-item"
                                      aria-hidden="true"
                                      className="staff-menu-highlight absolute inset-0 rounded-md"
                                      transition={{ duration: 0.25, ease: EASE_OUT }}
                                    />
                                  )}
                                  <span className="relative">{item.label}</span>
                                </>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                </li>
              );
            })}
          </ul>
        </nav>

        {canLogout && (
          <div className="staff-sidebar-account mt-auto shrink-0 border-t px-3 pt-3 pb-4">
            <div
              className={`staff-profile mb-3 rounded-xl border ${
                open ? "flex items-center gap-3 px-3 py-3" : "flex flex-col items-center gap-1.5 px-1 py-2"
              }`}
              title={`${user.name} · ${user.role}`}
              role="group"
              aria-label={`Usuario ${user.name}, perfil ${user.role}`}
            >
              <span className="staff-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
              {open ? (
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-semibold">{user.name}</span>
                  <span className="staff-sidebar-muted mt-0.5 block truncate text-xs">{user.role}</span>
                </span>
              ) : (
                <span className="staff-sidebar-muted max-w-full text-center text-[8px] font-semibold leading-tight">{compactRole}</span>
              )}
            </div>
            <div className="staff-submenu border-t pt-3">
              <form action="/logout" method="post">
                <button
                  type="submit"
                  title="Cerrar sesión"
                  className={`staff-menu-control flex min-h-10 w-full items-center rounded-lg py-2 transition-colors ${
                    open ? "gap-3 px-3" : "flex-col justify-center gap-1 px-1"
                  }`}
                >
                  <LogoutIcon />
                  <span className={open ? "text-sm font-medium" : "text-[9px] text-center font-medium leading-tight"}>
                    Cerrar sesión
                  </span>
                </button>
              </form>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
