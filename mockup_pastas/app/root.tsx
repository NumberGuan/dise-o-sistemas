import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import storefrontStylesheet from "./components/storefront.css?url";
import staffStylesheet from "./components/staff.css?url";
import FormValidation from "~/components/FormValidation";
import NavigationLoading from "~/components/NavigationLoading";
import { protectResponse } from "~/utils/access.server";

export const middleware = [protectResponse];

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: storefrontStylesheet },
  { rel: "stylesheet", href: staffStylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <FormValidation><Outlet /></FormValidation>
      <NavigationLoading />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "No pudimos cargar esta página";
  let details = "Ocurrió un problema inesperado. Intentá nuevamente.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 403 ? "Acceso denegado" : error.status === 404 ? "No encontramos esta página" : "Ocurrió un error";
    details =
      error.status === 404
        ? "Revisá la dirección o volvé al inicio."
        : error.status === 403
          ? "Tu cuenta no tiene permiso para acceder a esta sección."
        : details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="app-error mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="module-page-header">
        <h1>{message}</h1>
        <p className="mt-2 text-sm leading-6">{details}</p>
      </header>
      {stack && (
        <pre className="mt-4 w-full overflow-x-auto rounded-xl border border-gray-200 bg-white p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
