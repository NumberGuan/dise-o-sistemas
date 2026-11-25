import { useInternalData } from "~/components/InternalDataProvider";
import { useState, type ReactElement, type ReactNode } from "react";
import { useCatalogs } from "~/components/CatalogProvider";
import { brandRawMaterials, catalogDefinition, type CatalogEntry, type CatalogKey } from "~/data/catalogs";


export const catalogInputClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-100";

type Props = {
  catalog: CatalogKey;
  entry?: CatalogEntry;
  initialParentId?: string;
  initialMateriaPrima?: number;
  renderParentField?: (catalog: CatalogKey, select: ReactElement, onCreated: (entry: CatalogEntry) => void) => ReactNode;
};

export function CatalogEntryFields({ catalog, entry, initialParentId, initialMateriaPrima, renderParentField }: Props) {
  const { MATERIAS_PRIMAS_PRODUCCION } = useInternalData("production");
  const catalogs = useCatalogs();
  const definition = catalogDefinition(catalog)!;
  const parentKey = "parent" in definition ? definition.parent : undefined;
  const parentDefinition = parentKey ? catalogDefinition(parentKey) : undefined;
  const parents = parentKey ? catalogs[parentKey] : [];
  const [parentId, setParentId] = useState(initialParentId ?? "");
  const materials = catalog === "marcas" && entry ? brandRawMaterials(entry) : initialMateriaPrima ? [initialMateriaPrima] : [];

  function parentLabel(parent: CatalogEntry) {
    const province = catalog === "calles" ? catalogs.provincias.find(item => item.id === parent.parentId) : undefined;
    return province ? `${parent.name} · ${province.name}` : parent.name;
  }

  const parent = parents.find(item => item.id === entry?.parentId);
  const parentSelect = <select name="parentId" required value={parentId} onChange={event => setParentId(event.target.value)} className={catalogInputClass}>
    <option value="">Seleccionar…</option>
    {parents.filter(item => item.active).map(item => <option key={item.id} value={item.id}>{parentLabel(item)}</option>)}
  </select>;

  return <>
    <label className="block text-sm font-medium">Nombre *
      <input name="name" required maxLength={100} defaultValue={entry?.name} autoFocus className={catalogInputClass} />
    </label>
    {parentKey && parentDefinition && <label className="block text-sm font-medium">{parentDefinition.singular} *
      {entry
        ? <><input readOnly value={parent ? parentLabel(parent) : "—"} className={catalogInputClass} /><input type="hidden" name="parentId" value={entry.parentId} /></>
        : renderParentField ? renderParentField(parentKey, parentSelect, created => setParentId(created.id)) : parentSelect}
    </label>}
    {catalog === "modalidades-entrega" && <label className="block text-sm font-medium">Forma de entrega *
      {entry
        ? <><input readOnly value={entry.behavior === "pickup" ? "Retiro: no requiere dirección" : "Envío: requiere dirección"} className={catalogInputClass} /><input type="hidden" name="behavior" value={entry.behavior} /></>
        : <select name="behavior" required defaultValue="shipping" className={catalogInputClass}><option value="shipping">Envío: requiere dirección</option><option value="pickup">Retiro: no requiere dirección</option></select>}
    </label>}
    {catalog === "marcas" && <fieldset>
      <legend className="text-sm font-medium">Materias primas de esta marca</legend>
      <p className="mt-1 text-xs text-gray-500">Al cargar una receta, la marca solo se ofrece para las materias primas marcadas.</p>
      <div className="mt-2 grid max-h-64 gap-1 overflow-y-auto rounded-lg border border-gray-300 p-3 sm:grid-cols-2">
        {MATERIAS_PRIMAS_PRODUCCION.map(material => <label key={material.idMateriaPrima} className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-amber-50">
          <input type="checkbox" name="materiasPrimas" value={material.idMateriaPrima} defaultChecked={materials.includes(material.idMateriaPrima)} className="h-4 w-4 accent-amber-600" />
          {material.nombre}
        </label>)}
      </div>
    </fieldset>}
    <label className="block text-sm font-medium">Descripción
      <textarea name="description" rows={3} maxLength={500} defaultValue={entry?.description} className={catalogInputClass} />
    </label>
    <label className="block text-sm font-medium">Estado *
      <select name="active" defaultValue={entry?.active === false ? "false" : "true"} className={catalogInputClass}><option value="true">Activo</option><option value="false">Inactivo</option></select>
    </label>
  </>;
}
