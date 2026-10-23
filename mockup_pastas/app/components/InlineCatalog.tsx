import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFetcher } from "react-router";
import { CatalogContext, useCatalogs } from "~/components/CatalogProvider";
import { catalogDefinition, type CatalogEntry, type CatalogKey, type Catalogs } from "~/data/catalogs";
import type { action } from "~/routes/catalogos-crear";

type CreateOptions = {
  catalog: CatalogKey;
  parentId?: string;
  onCreated?: (entry: CatalogEntry) => void;
};
const CreationContext = createContext<((options: CreateOptions) => void) | null>(null);

export function InlineCatalogProvider({ catalogs, canCreate, children }: { catalogs: Catalogs; canCreate: boolean; children: ReactNode }) {
  const [request, setRequest] = useState<CreateOptions | null>(null);
  const [additions, setAdditions] = useState<Partial<Catalogs>>({});
  const current = useMemo(() => {
    const merged = { ...catalogs };
    for (const key of Object.keys(additions) as CatalogKey[]) {
      merged[key] = [...catalogs[key], ...(additions[key] ?? []).filter(entry => !catalogs[key].some(item => item.id === entry.id))];
    }
    return merged;
  }, [catalogs, additions]);
  const register = useCallback((catalog: CatalogKey, entry: CatalogEntry) => {
    setAdditions(previous => ({ ...previous, [catalog]: [...(previous[catalog] ?? []).filter(item => item.id !== entry.id), entry] }));
  }, []);

  return <CatalogContext.Provider value={current}>
    <CreationContext.Provider value={canCreate ? setRequest : null}>
      {children}
      {canCreate && request && <CatalogCreateModal request={request} onClose={() => setRequest(null)} register={register} />}
    </CreationContext.Provider>
  </CatalogContext.Provider>;
}

export function CatalogAddButton({ catalog, parentId, onCreated, disabled = false }: CreateOptions & { disabled?: boolean }) {
  const open = useContext(CreationContext);
  const definition = catalogDefinition(catalog)!;
  if (!open) return null;
  return <button type="button" disabled={disabled} aria-label={`Agregar ${definition.singular}`} title={`Agregar ${definition.singular}`}
    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-800 transition hover:border-amber-500 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
    onClick={event => { event.preventDefault(); event.stopPropagation(); open({ catalog, parentId, onCreated }); }}>
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5"><path d="M12 5v14M5 12h14" /></svg>
  </button>;
}

export function CatalogField({ children, ...options }: CreateOptions & { disabled?: boolean; children: ReactNode }) {
  return <span className="flex items-end gap-2"><span className="min-w-0 flex-1">{children}</span><CatalogAddButton {...options} /></span>;
}

function CatalogCreateModal({ request, onClose, register }: { request: CreateOptions; onClose: () => void; register: (catalog: CatalogKey, entry: CatalogEntry) => void }) {
  const catalogs = useCatalogs();
  const definition = catalogDefinition(request.catalog)!;
  const parentDefinition = "parent" in definition ? catalogDefinition(definition.parent) : undefined;
  const parents = "parent" in definition ? catalogs[definition.parent].filter(item => item.active) : [];
  const fetcher = useFetcher<typeof action>();
  const pending = fetcher.state !== "idle";
  const dialog = useRef<HTMLDialogElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const handled = useRef(false);
  const [saved, setSaved] = useState<CatalogEntry | null>(null);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const helpId = useId();
  const field = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-100";

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    nameInput.current?.focus();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, [mounted]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || !("entry" in fetcher.data) || handled.current) return;
    handled.current = true;
    const entry = fetcher.data.entry;
    register(request.catalog, entry);
    setSaved(entry);
    request.onCreated?.(entry);
  }, [fetcher.state, fetcher.data, register, request]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending || saved) return;
    fetcher.submit(new FormData(event.currentTarget), { method: "post", action: `/catalogos/${request.catalog}/crear` });
  }

  if (!mounted) return null;
  return createPortal(<dialog ref={dialog} aria-modal="true" aria-labelledby={titleId} aria-describedby={helpId}
    className="fixed m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border-0 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-gray-900/50"
    onCancel={event => { event.preventDefault(); event.stopPropagation(); }}
    onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); } }}>
    <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 sm:px-6">
      <div><h2 id={titleId} className="text-xl font-semibold">Agregar {definition.singular}</h2><p id={helpId} className="mt-1 text-sm text-gray-500">Creá una opción y continuá con el formulario. Cerrá esta ventana con la cruz superior.</p></div>
      <button type="button" disabled={pending} aria-label="Cerrar modal" title="Cerrar" onClick={() => { dialog.current?.close(); onClose(); }}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-amber-600">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>
    <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
      <input type="hidden" name="intent" value="create" />
      {fetcher.data && "error" in fetcher.data && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{fetcher.data.error}</p>}
      {saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">“{saved.name}” se agregó correctamente y ya está disponible. Podés cerrar con la cruz para continuar.</p>}
      <fieldset disabled={pending || Boolean(saved)} className="space-y-5">
        <label className="block text-sm font-medium">Nombre *<input ref={nameInput} required name="name" maxLength={100} className={field} /></label>
        {parentDefinition && <label className="block text-sm font-medium">{parentDefinition.title} *<select required name="parentId" defaultValue={request.parentId ?? ""} className={field}>
          <option value="">Seleccionar…</option>{parents.map(item => <option key={item.id} value={item.id}>{item.name}{definition.key === "calles" ? ` · ${catalogs.provincias.find(province => province.id === item.parentId)?.name ?? ""}` : ""}</option>)}
        </select></label>}
        {definition.key === "modalidades-entrega" && <label className="block text-sm font-medium">Forma de entrega *<select required name="behavior" defaultValue="shipping" className={field}><option value="shipping">Envío: requiere dirección</option><option value="pickup">Retiro: no requiere dirección</option></select></label>}
        <label className="block text-sm font-medium">Descripción<textarea name="description" rows={3} maxLength={500} className={field} /></label>
      </fieldset>
      <div className="flex justify-end border-t border-gray-100 pt-4"><button type="submit" disabled={pending || Boolean(saved)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-amber-600 disabled:opacity-50">{pending ? "Guardando…" : saved ? "Guardado" : "Guardar"}</button></div>
    </form>
  </dialog>, document.body);
}
