import { useId, useRef, useState } from "react";
import { searchStreets } from "~/data/domicilios";
import { CatalogField } from "~/components/InlineCatalog";
import type { CatalogEntry } from "~/data/catalogs";

type StreetOption = { id: string; nombre: string };

export default function StreetAutocomplete({ value, options, onChange, disabled, inputClass, catalogParentId, canAdd = true, onStreetCreated }: {
  value: string;
  options: StreetOption[];
  onChange: (value: string) => void;
  disabled: boolean;
  inputClass: string;
  catalogParentId?: string;
  canAdd?: boolean;
  onStreetCreated?: (entry: CatalogEntry) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const matches = searchStreets(options, value);
  const expanded = open && !disabled;

  function choose(street: StreetOption) {
    onChange(street.nombre);
    setOpen(false);
    setActiveIndex(-1);
  }

  function highlight(index: number) {
    setActiveIndex(index);
    listRef.current?.children[index]?.scrollIntoView({ block: "nearest" });
  }

  return <div className="relative">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">Calle *</label>
    <CatalogField catalog="calles" parentId={catalogParentId} disabled={!canAdd} onCreated={onStreetCreated}>
    <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={expanded}
      aria-controls={`${id}-options`} aria-activedescendant={expanded && matches[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
      aria-describedby={`${id}-help`} required maxLength={160} autoComplete="off" disabled={disabled}
      value={value} placeholder={disabled ? "Primero seleccioná una localidad" : "Escribí para buscar una calle…"} className={inputClass}
      onFocus={() => { setOpen(true); setActiveIndex(-1); }}
      onBlur={() => { setOpen(false); setActiveIndex(-1); }}
      onChange={event => { onChange(event.target.value); setOpen(true); setActiveIndex(-1); }}
      onKeyDown={event => {
        if (event.key === "Escape" && expanded) { event.stopPropagation(); setOpen(false); setActiveIndex(-1); }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setOpen(true);
          const next = event.key === "ArrowDown"
            ? Math.min(activeIndex + 1, matches.length - 1)
            : activeIndex < 0 ? matches.length - 1 : Math.max(0, activeIndex - 1);
          highlight(next);
        }
        if (event.key === "Enter" && expanded) {
          event.preventDefault();
          const selected = matches[activeIndex] ?? (matches.length === 1 ? matches[0] : undefined);
          if (selected) choose(selected);
        }
      }} />
    </CatalogField>
    <p id={`${id}-help`} className="mt-1 text-xs text-gray-500">Buscá por las primeras letras y elegí una calle del catálogo.</p>
    {expanded && <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
      <ul ref={listRef} id={`${id}-options`} role="listbox" aria-label="Calles encontradas" className="max-h-56 overflow-y-auto overscroll-contain">
        {matches.map((street, index) => <li key={street.id} id={`${id}-option-${index}`} role="option" aria-selected={activeIndex === index}
          className={`cursor-pointer px-3 py-2 text-sm text-gray-900 ${activeIndex === index ? "bg-amber-100" : "hover:bg-amber-50"}`}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(street)}
          onMouseEnter={() => setActiveIndex(index)}>{street.nombre}</li>)}
      </ul>
      <p role="status" className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500">{matches.length ? `${matches.length} ${matches.length === 1 ? "calle encontrada" : "calles encontradas"}` : "No hay calles que empiecen con esas letras."}</p>
    </div>}
  </div>;
}
