import { CatalogAddButton } from "~/components/InlineCatalog";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import { CATALOG_DEFINITIONS } from "~/data/catalogs";
import { NAV_SECTIONS } from "~/data/navigation";
import { useCatalogs } from "~/components/CatalogProvider";
import type { Route } from "./+types/administracion";

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
  const operational = NAV_SECTIONS.map(section => ({ ...section, items: section.items.filter(item => item.to !== "/administracion" && !item.to.includes("/catalogos/") && `${item.label} ${section.label}`.toLocaleLowerCase("es-AR").includes(query)) })).filter(section => section.items.length);
  return <div className="mx-auto max-w-7xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
    <p className="text-sm font-medium text-amber-700">Administración</p>
    <h1 className="mt-1 text-2xl font-bold">Gestión del sistema</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">Administrá los datos de referencia y accedé a la gestión de las entidades de todos los módulos.</p>
    <dl className="mt-6 grid gap-4 sm:grid-cols-3">{[["Catálogos administrables", CATALOG_DEFINITIONS.length], ["Registros activos", Object.values(catalogs).flat().filter(item => item.active).length], ["Módulos de gestión", NAV_SECTIONS.length]].map(([label, value]) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-5"><dt className="text-sm text-gray-500">{label}</dt><dd className="mt-2 text-3xl font-bold">{value}</dd></div>)}</dl>
    <label className="mt-8 block text-sm font-medium">Buscar una clase o pantalla<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Por ejemplo: cliente, IVA, marcas o empleados" className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" /></label>
    <h2 className="mt-8 text-xl font-semibold">Catálogos y datos de referencia</h2>
    <p className="mt-1 text-sm text-gray-500">Agregá, consultá, editá y desactivá las opciones que se utilizan en los formularios.</p>
    {groups.map(group => <section key={group} className="mt-6"><h3 className="mb-3 text-sm font-semibold text-gray-600">{group}</h3><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{definitions.filter(item => item.group === group).map(item => <article key={item.key} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h4 className="font-semibold"><Link to={`/administracion/catalogos/${item.key}`} className="rounded hover:text-amber-800 hover:underline focus-visible:outline-2 focus-visible:outline-amber-600">{item.title}</Link></h4><CatalogAddButton catalog={item.key} /></div><p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p><Link to={`/administracion/catalogos/${item.key}`} className="mt-4 inline-block text-xs font-medium text-amber-800 hover:underline">{catalogs[item.key].filter(row => row.active).length} activos · {catalogs[item.key].length} en total · Ver registros →</Link></article>)}</div></section>)}
    <section className="mt-10"><h2 className="text-xl font-semibold">Entidades y operaciones</h2><p className="mt-1 text-sm text-gray-500">Cada entidad conserva su pantalla de gestión. Los domicilios, teléfonos y detalles se administran dentro de su registro principal.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{operational.map(section => <div key={section.to} className="rounded-xl border border-gray-200 bg-white p-5"><h3 className="mb-3 font-semibold">{section.label}</h3><ul className="space-y-1">{section.items.map(item => <li key={item.to}><Link to={item.to} className="block rounded-lg px-2 py-2 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-800">{item.label}<span className="float-right" aria-hidden="true">→</span></Link></li>)}</ul></div>)}</div></section>
    {!definitions.length && !operational.length && <p role="status" className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No se encontraron clases con ese nombre.</p>}
  </div>;
}

export default function Administracion() {
  const { pathname } = useLocation();
  return pathname.replace(/\/$/, "") === "/administracion" ? <AdministrationDashboard /> : <Outlet />;
}
