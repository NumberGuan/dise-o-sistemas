import { useState } from "react";
import { NavLink } from "react-router";

import { ChevronIcon } from "~/components/icons";
import { NAV_SECTIONS } from "~/data/navigation";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const BADGE_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-orange-100 text-orange-700",
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("Ventas");

  const handleNavigate = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-all duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0 lg:w-64" : "-translate-x-full lg:w-20"
        }`}
      >
        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Navegación principal">
          <ul className="space-y-1">
            {NAV_SECTIONS.map((section, index) => {
              const expanded = expandedSection === section.label;
              const badgeColor = BADGE_COLORS[index % BADGE_COLORS.length];

              return (
                <li key={section.to}>
                  <div className="flex items-center gap-1">
                    <NavLink
                      to={section.to}
                      onClick={handleNavigate}
                      title={section.label}
                      className={({ isActive }) =>
                        `flex flex-1 items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold ${badgeColor}`}
                        aria-hidden="true"
                      >
                        {section.label.charAt(0)}
                      </span>
                      {open && <span className="truncate">{section.label}</span>}
                    </NavLink>
                    {open && (
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expanded ? null : section.label)}
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Contraer" : "Expandir"} ${section.label}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <ChevronIcon className={expanded ? "rotate-180" : ""} />
                      </button>
                    )}
                  </div>
                  {open && expanded && (
                    <div className="ml-4 mt-1 border-l border-gray-200 pl-3">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end
                          onClick={handleNavigate}
                          className={({ isActive }) =>
                            `block rounded-md px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? "bg-gray-100 font-medium text-gray-900"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400">
            {open ? "Fábrica de Pastas · ERP" : "ERP"}
          </p>
        </div>
      </aside>
    </>
  );
}