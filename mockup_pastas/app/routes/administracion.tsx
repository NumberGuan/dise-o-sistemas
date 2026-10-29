import { CatalogAddButton } from "~/components/InlineCatalog";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import { CATALOG_DEFINITIONS } from "~/data/catalogs";
import { useCatalogs } from "~/components/CatalogProvider";
import type { Route } from "./+types/administracion";

const MODULE_STYLES: Record<string, { initials: string; description: string }> = {
  "Ventas y facturación": { initials: "VF", description: "Opciones comerciales, de entrega y facturación." },
  "Personas y domicilios": { initials: "PD", description: "Datos para identificar personas y ubicar domicilios." },
  "Producción e inventario": { initials: "PI", description: "Clasificaciones y unidades para productos e insumos." },
  Mantenimiento: { initials: "MA", description: "Clasificaciones para el cuidado de las máquinas." },
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Administrador"]);
  return null;
};

function AdministrationDashboard() {
  const catalogs = useCatalogs();
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase("es-AR");
  const definitions = CATALOG_DEFINITIONS.filter(item => `${item.title} ${item.description} ${item.group}`.toLocaleLowerCase("es-AR").includes(query));
  const groups = [...new Set(definitions.map(item => item.group))];
  return <div className="mx-auto max-w-7xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
    <h1 className="text-2xl font-bold">Gestión del sistema</h1>
    <label className="mt-6 block text-sm font-medium">Buscar una clase o pantalla<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Por ejemplo: cliente, IVA, marcas o empleados" className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" /></label>
    <h2 className="mt-8 text-xl font-semibold">Catálogos y datos de referencia</h2>
    <p className="mt-1 text-sm text-gray-500">Agregá, consultá, editá y desactivá las opciones que se utilizan en los formularios.</p>
    <div className="mt-6 space-y-5">{groups.map(group => {
      const moduleCatalogs = definitions.filter(item => item.group === group);
      const style = MODULE_STYLES[group] ?? { initials: "MO", description: "Catálogos utilizados en este módulo." };
      return <section key={group} className="overflow-hidden rounded-2xl border border-gray-200 border-t-4 border-t-gray-400 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gray-100 text-sm font-bold text-gray-700">{style.initials}</span>
            <div><h3 className="font-semibold text-gray-900">{group}</h3><p className="mt-0.5 text-sm text-gray-500">{style.description}</p></div>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{moduleCatalogs.length} {moduleCatalogs.length === 1 ? "catálogo" : "catálogos"}</span>
        </header>
        <div className="grid gap-4 bg-[#faf9f7] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">{moduleCatalogs.map(item => <article key={item.key} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"><div className="flex items-center justify-between gap-3"><h4 className="font-semibold"><Link to={`/administracion/catalogos/${item.key}`} className="rounded hover:text-amber-800 hover:underline focus-visible:outline-2 focus-visible:outline-amber-600">{item.title}</Link></h4><CatalogAddButton catalog={item.key} /></div><p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p><Link to={`/administracion/catalogos/${item.key}`} className="mt-4 inline-block text-xs font-medium text-amber-800 hover:underline">{catalogs[item.key].filter(row => row.active).length} activos · {catalogs[item.key].length} en total · Ver registros →</Link></article>)}</div>
      </section>;
    })}</div>
    {!definitions.length && <p role="status" className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No se encontraron clases con ese nombre.</p>}
  </div>;
}

export default function Administracion() {
  const { pathname } = useLocation();
  return pathname.replace(/\/$/, "") === "/administracion" ? <AdministrationDashboard /> : <Outlet />;
}
