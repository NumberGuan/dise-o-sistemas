import { useId } from "react";
import StreetAutocomplete from "~/components/StreetAutocomplete";
import { addressOptions, PROVINCIAS, type AddressFields as AddressValue } from "~/data/domicilios";

export default function AddressFields({ value, onChange, previous, disabled = false }: {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  previous?: AddressValue;
  disabled?: boolean;
}) {
  const id = useId();
  const { localidades, calles } = addressOptions(value.province, value.locality);
  const retainedStreet = previous?.province === value.province && previous.locality === value.locality ? previous.street : undefined;
  const streetOptions = retainedStreet && !calles.some(item => item.nombre === retainedStreet)
    ? [...calles, { id: "saved-street", localidadId: "saved", nombre: retainedStreet }] : calles;
  const inputClass = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-100 disabled:text-gray-500";
  const selects = [
    { key: "province", label: "Provincia", options: PROVINCIAS, disabled: false, retained: previous?.province },
    { key: "locality", label: "Localidad", options: localidades, disabled: !value.province, retained: previous?.province === value.province ? previous.locality : undefined },
  ] as const;
  return <div className="grid gap-4 sm:grid-cols-2">
    {selects.map(field => <label key={field.key} htmlFor={`${id}-${field.key}`} className="block text-sm font-medium text-gray-700">{field.label} *
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
    </label>)}
    <StreetAutocomplete key={`${value.province}-${value.locality}`} value={value.street} options={streetOptions}
      onChange={street => onChange({ ...value, street })} disabled={disabled || !value.locality} inputClass={inputClass} />
    {([['streetNumber', 'Altura / km', 20], ['floor', 'Piso', 20], ['apartment', 'Departamento', 20]] as const).map(([key, label, maxLength]) => <label key={key} htmlFor={`${id}-${key}`} className="block text-sm font-medium text-gray-700">{label}{key === "streetNumber" ? " *" : ""}
      <input id={`${id}-${key}`} required={key === "streetNumber"} disabled={disabled} maxLength={maxLength} value={value[key]} onChange={event => onChange({ ...value, [key]: event.target.value })} className={inputClass} />
    </label>)}
  </div>;
}
