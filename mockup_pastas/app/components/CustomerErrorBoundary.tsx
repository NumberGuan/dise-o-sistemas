import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export default function CustomerErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Compras</p>
      <h1 className="mt-3 text-2xl font-semibold text-gray-900">{notFound ? "No encontramos esa pantalla" : "No pudimos cargar esta sección"}</h1>
      <p className="mt-2 text-sm leading-6 text-gray-600">{notFound ? "Revisá la dirección o volvé a tu catálogo." : "Ocurrió un problema al consultar los datos. Probá de nuevo en unos minutos."}</p>
      <Link to="/compras/catalogo" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800">Ir al catálogo</Link>
    </main>
  );
}
