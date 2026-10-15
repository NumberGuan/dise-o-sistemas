import type { ClientAddress } from "~/data/sales";

export default function ClientAddressesEditor({ addresses, onChange, disabled = false }: { addresses: ClientAddress[]; onChange: (addresses: ClientAddress[]) => void; disabled?: boolean }) {
  const inputClass = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 disabled:bg-gray-100";
  function update(index: number, key: keyof ClientAddress, value: string) {
    onChange(addresses.map((address, i) => i === index ? { ...address, [key]: value } : address));
  }
  return <section className="space-y-4" aria-label="Direcciones guardadas">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold text-gray-900">Direcciones de entrega</h2><p className="mt-1 text-sm text-gray-500">La dirección principal se selecciona inicialmente al hacer un pedido.</p></div>
      <button type="button" disabled={disabled || addresses.length >= 20} className="rounded-lg border border-amber-700 px-3 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50" onClick={() => onChange([...addresses, { id: crypto.randomUUID(), label: "", street: "", streetNumber: "", floor: "", apartment: "", locality: "", province: "Buenos Aires" }])}>Agregar dirección</button>
    </div>
    {!addresses.length && <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Todavía no hay direcciones guardadas. Agregá una para recibir pedidos.</p>}
    {addresses.map((address, index) => <fieldset key={address.id} disabled={disabled} className="rounded-xl border border-gray-200 bg-white p-4">
      <legend className="px-2 text-sm font-semibold text-gray-800">{address.label || `Dirección ${index + 1}`}{index === 0 ? " · Principal" : ""}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {([['label', 'Nombre de la dirección', 60], ['street', 'Calle', 160], ['streetNumber', 'Altura', 20], ['floor', 'Piso', 20], ['apartment', 'Departamento', 20], ['locality', 'Localidad', 100], ['province', 'Provincia', 100]] as const).map(([key, label, maxLength]) => <label key={key} className="block text-sm font-medium text-gray-700">{label}{key !== "floor" && key !== "apartment" ? " *" : ""}<input required={key !== "floor" && key !== "apartment"} maxLength={maxLength} value={address[key]} onChange={event => update(index, key, event.target.value)} placeholder={key === "label" ? "Ej.: Casa, Local o Depósito" : undefined} className={inputClass} /></label>)}
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        {index > 0 && <button type="button" className="text-sm font-semibold text-amber-800" onClick={() => onChange([address, ...addresses.filter((_, i) => i !== index)])}>Usar como principal</button>}
        <button type="button" className="text-sm font-semibold text-red-700" onClick={() => onChange(addresses.filter((_, i) => i !== index))}>Quitar dirección</button>
      </div>
    </fieldset>)}
  </section>;
}
