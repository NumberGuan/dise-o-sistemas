import { useId } from "react";
import { MAX_ADDITIONAL_PHONES } from "~/data/phones";

type PhoneFieldsProps = {
  primary: string;
  additional?: string[];
  onChange: (primary: string, additional: string[]) => void;
  disabled?: boolean;
};

const inputClass = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-100";
const buttonClass = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-amber-600";

export default function PhoneFields({ primary, additional = [], onChange, disabled = false }: PhoneFieldsProps) {
  const id = useId();
  return <fieldset disabled={disabled} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
    <legend className="px-1 text-sm font-semibold text-gray-900">Teléfonos</legend>
    <label htmlFor={`${id}-primary`} className="block text-sm font-medium text-gray-700">Teléfono principal <span className="text-rose-600">*</span>
      <input id={`${id}-primary`} type="tel" autoComplete="tel" required maxLength={40} value={primary} onChange={event => onChange(event.target.value, additional)} placeholder="Código de área y número" className={inputClass} />
    </label>
    {additional.length > 0 && <div className="space-y-3 border-t border-gray-200 pt-4">{additional.map((phone, index) => <div key={index} className="flex flex-wrap items-end gap-2">
      <label htmlFor={`${id}-${index}`} className="min-w-44 flex-1 text-sm font-medium text-gray-700">Teléfono adicional {index + 1}
        <input id={`${id}-${index}`} type="tel" required maxLength={40} value={phone} onChange={event => onChange(primary, additional.map((value, position) => position === index ? event.target.value : value))} placeholder="Código de área y número" className={inputClass} />
      </label>
      <button type="button" disabled={!phone.trim()} className={buttonClass} onClick={() => onChange(phone, additional.flatMap((value, position) => position === index ? primary.trim() ? [primary] : [] : [value]))} aria-label={`Usar teléfono adicional ${index + 1} como principal`}>Usar como principal</button>
      <button type="button" className={buttonClass} onClick={() => onChange(primary, additional.filter((_, position) => position !== index))} aria-label={`Quitar teléfono adicional ${index + 1}`}>Quitar</button>
    </div>)}</div>}
    <button type="button" disabled={additional.length >= MAX_ADDITIONAL_PHONES} onClick={() => onChange(primary, [...additional, ""])} className={buttonClass}>+ Agregar teléfono</button>
  </fieldset>;
}

export function PhoneDetails({ primary, additional = [] }: { primary?: string; additional?: string[] }) {
  return <>
    <div><dt className="text-xs text-gray-500">Teléfono principal</dt><dd className="mt-1 break-words font-medium text-gray-900">{primary || "Sin dato"}</dd></div>
    {additional.length > 0 && <div><dt className="text-xs text-gray-500">Teléfonos adicionales</dt><dd className="mt-1 font-medium text-gray-900"><ul className="space-y-1">{additional.map((phone, index) => <li key={index} className="break-words">{phone}</li>)}</ul></dd></div>}
  </>;
}
