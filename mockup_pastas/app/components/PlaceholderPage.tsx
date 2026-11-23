import { Link } from "react-router";
import ModulePageHeader from "~/components/ModulePageHeader";

import type { NavItem } from "~/data/navigation";

type PlaceholderPageProps = {
  title: string;
  description?: string;
  links?: NavItem[];
};

export function PlaceholderPage({
  title,
  description = "Módulo en construcción. Esta pantalla se implementará en una próxima iteración.",
  links,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ModulePageHeader>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 max-w-xl text-sm text-gray-500">{description}</p>
        {links && links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </ModulePageHeader>
    </div>
  );
}
