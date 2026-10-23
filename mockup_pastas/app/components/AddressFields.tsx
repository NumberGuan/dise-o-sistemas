import { useCatalogs } from "./CatalogProvider";
import { CatalogField } from "./InlineCatalog";
import { catalogAddressData } from "~/data/catalogs";
import { useId } from "react";
import StreetAutocomplete from "~/components/StreetAutocomplete";
import { addressOptions, type AddressFields as AddressValue } from "~/data/domicilios";

export default function AddressFields({ value, onChange, previous, disabled = false }: {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  previous?: AddressValue;
  disabled?: boolean;
}) {
  const id = useId();
  const catalogs = useCatalogs();
  const catalog = catalogAddressData(catalogs);
  const provinceId = catalogs.provincias.find(item => item.name === value.province)?.id;
  const localityId = catalogs.localidades.find(item => item.parentId === provinceId && item.name === value.locality)?.id;
  const { localidades, calles } = addressOptions(value.province, value.locality, catalog);
  const retainedStreet = previous?.province === value.province && previous.locality === value.locality ? previous.street : undefined;
  const streetOptions = retainedStreet && !calles.some(item => item.nombre === retainedStreet)
    ? [...calles, { id: "saved-street", localidadId: "saved", nombre: retainedStreet }] : calles;
  const inputClass = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-100 disabled:text-gray-500";
  const selects = [
    { key: "province", label: "Provincia", options: catalog.provincias, disabled: false, retained: previous?.province },
    { key: "locality", label: "Localidad", options: localidades, disabled: !value.province, retained: previous?.province === value.province ? previous.locality : undefined },
  ] as const;
  return <div className="grid gap-4 sm:grid-cols-2">
    {selects.map(field => <label key={field.key} htmlFor={`${id}-${field.key}`} className="block text-sm font-medium text-gray-700">{field.label} *
      <CatalogField catalog={field.key === "province" ? "provincias" : "localidades"} parentId={field.key === "locality" ? provinceId : undefined} disabled={disabled}
        onCreated={entry => {
          if (field.key === "province") onChange({ ...value, province: entry.name, locality: "", street: "" });
          else {
            const province = catalogs.provincias.find(item => item.id === entry.parentId);
            onChange({ ...value, province: province?.name ?? value.province, locality: entry.name, street: "" });
          }
        }}>
      <select id={`${id}-${field.key}`} required disabled={disabled || field.disabled} value={value[field.key]} className={inputClass} onChange={event => {
        const next = { ...value, [field.key]: event.target.value };
        if (field.key === "province") { next.locality = ""; next.street = ""; }
        if (field.key === "locality") next.street = "";
        onChange(next);
      }}>
        <option value="">Seleccionar {field.label.toLowerCase()}…</option>
        {field.retained && !field.options.some(item => item.nombre === field.retained) && <option value={field.retained}>{field.retained} (guardada)</option>}
        {field.options.map(item => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
      </select>
      </CatalogField>
    </label>)}
    <StreetAutocomplete key={`${value.province}-${value.locality}`} value={value.street} options={streetOptions}
      onChange={street => onChange({ ...value, street })} disabled={disabled || !value.locality} inputClass={inputClass}
      catalogParentId={localityId} canAdd={!disabled} onStreetCreated={entry => {
        const locality = catalogs.localidades.find(item => item.id === entry.parentId);
        const province = catalogs.provincias.find(item => item.id === locality?.parentId);
        onChange({ ...value, province: province?.name ?? value.province, locality: locality?.name ?? value.locality, street: entry.name });
      }} />
    {([['streetNumber', 'Altura / km', 20], ['floor', 'Piso', 20], ['apartment', 'Departamento', 20]] as const).map(([key, label, maxLength]) => <label key={key} htmlFor={`${id}-${key}`} className="block text-sm font-medium text-gray-700">{label}{key === "streetNumber" ? " *" : ""}
      <input id={`${id}-${key}`} required={key === "streetNumber"} disabled={disabled} maxLength={maxLength} value={value[key]} onChange={event => onChange({ ...value, [key]: event.target.value })} className={inputClass} />
    </label>)}
  </div>;
}
