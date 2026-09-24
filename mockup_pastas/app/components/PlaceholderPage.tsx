import { Link } from "react-router";

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
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 shadow-sm">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-amber-700"
            aria-hidden="true"
          >
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h10" />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-gray-900">{title}</h1>
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
      </div>
    </div>
  );
}