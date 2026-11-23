import { SortableTable } from "~/components/SortableRows";
import ModulePageHeader from "~/components/ModulePageHeader";
import FormalPageHeader from "~/components/FormalPageHeader";
import { CatalogField } from "~/components/InlineCatalog";
import BackToListButton from "~/components/BackToListButton";
import { CatalogEntryFields, catalogInputClass as field } from "~/components/CatalogEntryFields";
import { useCatalogs } from "~/components/CatalogProvider";
import { useEffect, useMemo, useState } from "react";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from "react-router";
import { brandRawMaterials, catalogDefinition, type CatalogEntry, type Catalogs, type CATALOG_DEFINITIONS } from "~/data/catalogs";
import { MATERIAS_PRIMAS_PRODUCCION } from "~/data/produccion";
import { getCatalogs, saveCatalogEntry } from "~/data/catalogs.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/catalogos";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Administrador"]);
  const definition = catalogDefinition(params.catalogo);
  if (!definition) throw new Response("El catálogo no existe.", { status: 404 });
  return { definition, catalogs: await getCatalogs() };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  await requireUserAndRole(request, ["Administrador"]);
  try {
    const form = await request.formData();
    if (form.get("intent") !== "save") throw new Error("La acción solicitada no está disponible.");
    const entry = await saveCatalogEntry(params.catalogo, form);
    return { success: true, id: entry.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar el registro." };
  }
};

const secondary = "rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600";

export default function CatalogPage() {
  const data = useLoaderData<typeof loader>();
  return <CatalogScreen key={data.definition.key} {...data} />;
}

function CatalogScreen({ definition }: { definition: (typeof CATALOG_DEFINITIONS)[number]; catalogs: Catalogs }) {
  const catalogs = useCatalogs();
  const [params, setParams] = useSearchParams();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const pending = navigation.state !== "idle";
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [parentFilter, setParentFilter] = useState("");
  const rows = catalogs[definition.key];
  const parentDefinition = "parent" in definition ? catalogDefinition(definition.parent) : undefined;
  const parents = "parent" in definition ? catalogs[definition.parent] : [];
  const selected = rows.find(item => item.id === params.get("registro"));
  const mode = params.get("vista");
  const isForm = mode === "nuevo" || mode === "editar" && selected;
  const parentLabel = (entry: CatalogEntry) => {
    const parent = parents.find(item => item.id === entry.parentId);
    const province = definition.key === "calles" ? catalogs.provincias.find(item => item.id === parent?.parentId) : undefined;
    return parent ? `${parent.name}${province ? ` · ${province.name}` : ""}` : "—";
  };

  useEffect(() => {
    if (result && "success" in result && result.success) {
      setNotice("Registro guardado. Los cambios ya están disponibles en los formularios del sistema.");
      setParams({}, { replace: true });
    }
  }, [result]);

  const filtered = useMemo(() => rows.filter(item => {
    const query = search.trim().toLocaleLowerCase("es-AR");
    return (!query || [item.name, item.value, item.description, item.id].some(text => text.toLocaleLowerCase("es-AR").includes(query)))
      && (status === "all" || item.active === (status === "active"))
      && (!parentFilter || item.parentId === parentFilter);
  }), [rows, search, status, parentFilter]);

  const backToAdmin = <Link to="/administracion" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-800 bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 active:translate-y-px active:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0"><path d="m12 19-7-7 7-7M5 12h14" /></svg>
    <span>Volver a Administración</span>
  </Link>;

  const CatalogHeader = mode ? FormalPageHeader : ModulePageHeader;
  return <div className="mx-auto max-w-7xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
    {isForm && <div className="mx-auto mb-3 flex max-w-2xl flex-wrap items-center justify-end gap-3">
      {backToAdmin}
      <BackToListButton onClick={() => setParams({})} disabled={pending} />
    </div>}
    {!isForm && <CatalogHeader className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm font-medium text-amber-700">{definition.group}</p><h1 className="mt-1 text-2xl font-bold">{mode === "detalle" && selected ? selected.name : definition.title}</h1><p className="mt-2 max-w-2xl text-sm text-gray-500">{definition.description}</p></div>
      {mode && <div className="flex flex-wrap items-center justify-end gap-2">{backToAdmin}</div>}
    </CatalogHeader>}
    {!mode && <div className="mb-6 flex flex-wrap items-center justify-end gap-3">{backToAdmin}<Link to="?vista=nuevo" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700">+ Agregar {definition.singular}</Link></div>}
    {notice && !mode && <p role="status" className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    {mode && mode !== "nuevo" && !selected ? <div className="rounded-xl border border-gray-200 bg-white p-6"><p role="alert">El registro solicitado no existe.</p><Link to="?" className="mt-4 inline-block text-amber-800 underline">Volver al listado</Link></div>
      : isForm ? <section className="form-sheet mx-auto max-w-2xl">
        <FormalPageHeader>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-600">Administración</p>
          <h1 className="text-xl font-bold text-gray-900">{selected ? `Editar ${selected.name}` : `Formulario para agregar ${definition.singular}`}</h1>
        </FormalPageHeader>
        <Form key={`${mode}-${selected?.id ?? "new"}`} method="post" className="form-sheet-body space-y-5">
          <p className="text-sm text-gray-500">Los campos con * son obligatorios. La baja es lógica y conserva el historial.</p>
          <input type="hidden" name="intent" value="save" />
          {selected && <input type="hidden" name="id" value={selected.id} />}
          {result && "error" in result && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{result.error}</p>}
          <CatalogEntryFields catalog={definition.key} entry={selected}
            renderParentField={(catalog, select, onCreated) => <CatalogField catalog={catalog} onCreated={onCreated}>{select}</CatalogField>} />
          {selected && <p className="text-xs text-gray-500">Código: {selected.id}. Las operaciones anteriores conservan su referencia original aunque cambies el nombre.</p>}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5"><Link to="?" aria-disabled={pending} onClick={event => { if (pending) event.preventDefault(); }} className={secondary}>Cancelar</Link><button disabled={pending} type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">{pending ? "Guardando…" : "Guardar"}</button></div>
        </Form>
      </section> : mode === "detalle" && selected ? <section className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 text-sm">{[["Código", selected.id], ["Estado", selected.active ? "Activo" : "Inactivo"], ["Descripción", selected.description || "Sin descripción"], ...(parentDefinition ? [[parentDefinition.title, parentLabel(selected)]] : []), ...(selected.behavior ? [["Forma de entrega", selected.behavior === "pickup" ? "Retiro" : "Envío con dirección"]] : []), ...(definition.key === "marcas" ? [["Materias primas", MATERIAS_PRIMAS_PRODUCCION.filter(material => brandRawMaterials(selected).includes(material.idMateriaPrima)).map(material => material.nombre).join(", ") || "Sin materias primas asociadas"]] : [])].map(([label, value]) => <div key={label}><dt className="text-gray-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl>
        <div className="mt-6 flex gap-3"><Link to="?" className={secondary}>Volver al listado</Link><Link to={`?vista=editar&registro=${selected.id}`} className={secondary}>Editar</Link></div>
      </section> : <>
        <dl className="mb-6 grid grid-cols-3 gap-3">{[["Total", rows.length], ["Activos", rows.filter(item => item.active).length], ["Inactivos", rows.filter(item => !item.active).length]].map(([label, value]) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-4"><dt className="text-sm text-gray-500">{label}</dt><dd className="mt-1 text-2xl font-bold">{value}</dd></div>)}</dl>
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-3 border-b border-gray-200 p-4">
            <label className="min-w-48 flex-1 text-xs text-gray-600">Buscar<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre, código o descripción…" className={field} /></label>
            <label className="text-xs text-gray-600">Estado<select value={status} onChange={event => setStatus(event.target.value)} className={field}><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></label>
            {parentDefinition && <label className="text-xs text-gray-600">{parentDefinition.title}<select value={parentFilter} onChange={event => setParentFilter(event.target.value)} className={field}><option value="">Todas</option>{parents.map(item => <option key={item.id} value={item.id}>{parentLabel({ ...item, parentId: item.id })}</option>)}</select></label>}
          </div>
          <p role="status" className="px-5 py-3 text-xs text-gray-500">{filtered.length} registros encontrados</p>
          <div className="overflow-x-auto">
            <SortableTable
              rows={filtered}
              className="w-full min-w-[44rem] table-fixed text-left"
              headClassName="border-y border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700"
              bodyClassName="divide-y divide-gray-200"
              newest="Código"
              columns={[
                [["Nombre", row => row.name], "px-5 py-3", [["Código", row => row.id]]],
                [["Estado", row => row.active ? 'Activo' : 'Inactivo'], "w-28 px-4 py-3"],
                ["Acciones", "w-52 px-5 py-3 text-right"],
              ]}
            >
              {mapRows => <>
                {filtered.length ? mapRows(item => <tr key={item.id}>
                  <td className="px-5 py-4 align-middle"><p className="break-words font-semibold">{item.name}</p><p className="mt-1 text-xs text-gray-500">Código {item.id}{parentDefinition ? ` · ${parentLabel(item)}` : ""}</p>{item.description && <p className="mt-1 break-words text-sm text-gray-600">{item.description}</p>}</td>
                  <td className="px-4 py-4 align-middle"><span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${item.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>{item.active ? "Activo" : "Inactivo"}</span></td>
                  <td className="px-5 py-4 align-middle"><div className="flex justify-end gap-2"><Link to={`?vista=detalle&registro=${item.id}`} className={secondary} aria-label={`Consultar ${item.name}`}>Consultar</Link><Link to={`?vista=editar&registro=${item.id}`} className={secondary} aria-label={`Editar ${item.name}`}>Editar</Link></div></td>
                </tr>) : <tr><td colSpan={3} className="p-10 text-center text-sm text-gray-500">No hay registros con los filtros seleccionados.</td></tr>}
              </>}
            </SortableTable>
          </div>
        </section>
        <p className="mt-4 text-xs leading-5 text-gray-500">Los registros inactivos se conservan en las operaciones existentes y dejan de ofrecerse para nuevas selecciones.</p>
      </>}
  </div>;
}
