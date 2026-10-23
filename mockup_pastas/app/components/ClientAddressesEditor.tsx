import { useState } from "react";
import AddressFields from "~/components/AddressFields";
import type { ClientAddress } from "~/data/sales";

export default function ClientAddressesEditor({ addresses, onChange, disabled = false }: { addresses: ClientAddress[]; onChange: (addresses: ClientAddress[]) => void; disabled?: boolean }) {
  const [originals] = useState(() => addresses);
  const inputClass = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 disabled:bg-gray-100";
  function update(index: number, key: keyof ClientAddress, value: string) {
    onChange(addresses.map((address, i) => i === index ? { ...address, [key]: value } : address));
  }
  return <section className="space-y-4" aria-label="Dirección fija y direcciones complementarias">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold text-gray-900">Dirección fija de facturación *</h2><p className="mt-1 text-sm text-gray-500">Completá el domicilio del cliente que se usará para facturar. También estará disponible para las entregas.</p></div>
    </div>
    {addresses.map((address, index) => <div key={address.id}>
      {index === 1 && <h3 className="mb-3 font-semibold text-gray-900">Direcciones complementarias</h3>}
      <fieldset disabled={disabled} className="rounded-xl border border-gray-200 bg-white p-4">
      <legend className="px-2 text-sm font-semibold text-gray-800">{index === 0 ? "Dirección fija · Facturación" : address.label || `Dirección complementaria ${index}`}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {index > 0 && <label className="block text-sm font-medium text-gray-700 sm:col-span-2">Nombre de la dirección *<input required maxLength={60} value={address.label} onChange={event => update(index, "label", event.target.value)} placeholder="Ej.: Sucursal o Depósito" className={inputClass} /></label>}
        <div className="sm:col-span-2"><AddressFields value={address} previous={originals.find(item => item.id === address.id)} disabled={disabled} onChange={value => onChange(addresses.map((item, i) => i === index ? { ...address, ...value } : item))} /></div>
      </div>
      {index > 0 && <div className="mt-4 flex flex-wrap justify-end gap-3">
        <button type="button" className="text-sm font-semibold text-red-700" onClick={() => onChange(addresses.filter((_, i) => i !== index))}>Quitar dirección</button>
      </div>}
    </fieldset></div>)}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
      <div>{addresses.length <= 1 && <h3 className="font-semibold text-gray-900">Direcciones complementarias</h3>}<p className="text-sm text-gray-500">Opcional: agregá otros domicilios para recibir pedidos.</p></div>
      <button type="button" disabled={disabled || addresses.length >= 20} className="rounded-lg border border-amber-700 px-3 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50" onClick={() => onChange([...addresses, { id: crypto.randomUUID(), label: "", street: "", streetNumber: "", floor: "", apartment: "", locality: "", province: "Buenos Aires" }])}>Agregar dirección complementaria</button>
    </div>
  </section>;
}
