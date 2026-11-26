import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFetcher } from "react-router";
import { CatalogEntryFields } from "~/components/CatalogEntryFields";
import { CatalogContext } from "~/components/CatalogProvider";
import { catalogDefinition, type CatalogEntry, type CatalogKey, type Catalogs } from "~/data/catalogs";
import type { action } from "~/routes/catalogos-crear";

type CreateOptions = {
  catalog: CatalogKey;
  parentId?: string;
  initialMateriaPrima?: number;
  onCreated?: (entry: CatalogEntry) => void;
};
const CreationContext = createContext<((options: CreateOptions) => void) | null>(null);

export function InlineCatalogProvider({ catalogs, canCreate, creatableCatalogs, children }: { catalogs: Catalogs; canCreate: boolean; creatableCatalogs?: CatalogKey[]; children: ReactNode }) {
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
    <CreationContext.Provider value={canCreate ? options => { if (!creatableCatalogs || creatableCatalogs.includes(options.catalog)) setRequest(options); } : null}>
      <CreatableCatalogsContext.Provider value={creatableCatalogs ?? null}>
      {children}
      {canCreate && request && <CatalogCreateModal request={request} onClose={() => setRequest(null)} register={register} />}
      </CreatableCatalogsContext.Provider>
    </CreationContext.Provider>
  </CatalogContext.Provider>;
}

const CreatableCatalogsContext = createContext<CatalogKey[] | null>(null);

export function CatalogAddButton({ catalog, parentId, initialMateriaPrima, onCreated, disabled = false }: CreateOptions & { disabled?: boolean }) {
  const open = useContext(CreationContext);
  const allowed = useContext(CreatableCatalogsContext);
  const definition = catalogDefinition(catalog)!;
  if (!open || allowed && !allowed.includes(catalog)) return null;
  return <button type="button" disabled={disabled} aria-label={`Agregar ${definition.singular}`} title={`Agregar ${definition.singular}`}
    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
    onClick={event => { event.preventDefault(); event.stopPropagation(); open({ catalog, parentId, initialMateriaPrima, onCreated }); }}>
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5"><path d="M12 5v14M5 12h14" /></svg>
  </button>;
}

export function CatalogField({ children, ...options }: CreateOptions & { disabled?: boolean; children: ReactNode }) {
  return <span className="flex items-end gap-2"><span className="min-w-0 flex-1">{children}</span><CatalogAddButton {...options} /></span>;
}

function CatalogCreateModal({ request, onClose, register }: { request: CreateOptions; onClose: () => void; register: (catalog: CatalogKey, entry: CatalogEntry) => void }) {
  const definition = catalogDefinition(request.catalog)!;
  const fetcher = useFetcher<typeof action>();
  const pending = fetcher.state !== "idle";
  const dialog = useRef<HTMLDialogElement>(null);
  const handled = useRef(false);
  const [saved, setSaved] = useState<CatalogEntry | null>(null);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const helpId = useId();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    element?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, [mounted]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || !("entry" in fetcher.data) || handled.current) return;
    handled.current = true;
    const entry = fetcher.data.entry;
    register(request.catalog, entry);
    setSaved(entry);
    if (entry.active) request.onCreated?.(entry);
  }, [fetcher.state, fetcher.data, register, request]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending || saved) return;
    fetcher.submit(new FormData(event.currentTarget), { method: "post", action: `/catalogos/${request.catalog}/crear` });
  }

  if (!mounted) return null;
  return createPortal(<dialog ref={dialog} aria-modal="true" aria-labelledby={titleId} aria-describedby={helpId}
    className="form-sheet create-form fixed m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto p-0 text-gray-900 shadow-2xl backdrop:bg-gray-900/50"
    onCancel={event => { event.preventDefault(); event.stopPropagation(); }}
    onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); } }}>
    <div className="form-heading flex items-start justify-between gap-4">
      <div><h2 id={titleId} className="text-xl font-semibold">Formulario para agregar {definition.singular}</h2><p id={helpId} className="mt-1 text-sm text-gray-500">Creá una opción y continuá con el formulario. Cerrá esta ventana con la cruz superior.</p></div>
      <button type="button" disabled={pending} aria-label="Cerrar modal" title="Cerrar" onClick={() => { dialog.current?.close(); onClose(); }}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-amber-600">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>
    <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
      <input type="hidden" name="intent" value="create" />
      {fetcher.data && "error" in fetcher.data && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{fetcher.data.error}</p>}
      {saved && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">“{saved.name}” se guardó {saved.active ? "y ya está disponible" : "como inactivo"}. Podés cerrar con la cruz para continuar.</p>}
      <fieldset disabled={pending || Boolean(saved)} className="space-y-5">
        <CatalogEntryFields catalog={request.catalog} initialParentId={request.parentId} initialMateriaPrima={request.initialMateriaPrima} />
      </fieldset>
      <div className="flex justify-end border-t border-gray-100 pt-4"><button type="submit" disabled={pending || Boolean(saved)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-amber-600 disabled:opacity-50">{pending ? "Guardando…" : saved ? "Guardado" : "Guardar"}</button></div>
    </form>
  </dialog>, document.body);
}
