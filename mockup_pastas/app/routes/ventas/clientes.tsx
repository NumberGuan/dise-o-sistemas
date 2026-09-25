import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";

import { SalesPageHeader } from "~/components/SalesLayout";
import { SAMPLE_CLIENT_ACTIVITY, SAMPLE_CLIENTS, type Client, type ClientStatus } from "~/data/sales";

type ClientFormProps = {
  client: Client | null;
  onCancel: () => void;
  onSave: (client: Client) => void;
};

const EMPTY_CLIENT: Omit<Client, "id" | "code"> = {
  type: "Comercio", name: "", taxId: "", phone: "", email: "", address: "", locality: "", province: "Buenos Aires", terms: "Contado", status: "Activo", notes: "",
};

function ClientForm({ client, onCancel, onSave }: ClientFormProps) {
  const [values, setValues] = useState(client ?? { ...EMPTY_CLIENT, id: "", code: "" });
  const [error, setError] = useState("");

  function update<K extends keyof Client>(key: K, value: Client[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.name.trim() || !values.locality.trim()) {
      setError("Completa el nombre o razón social y la localidad.");
      return;
    }
    onSave({ ...values, name: values.name.trim(), locality: values.locality.trim() });
  }

  const inputClass = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="client-form-title" className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 id="client-form-title" className="text-lg font-semibold text-gray-900">{client ? "Editar cliente" : "Nuevo cliente"}</h2>
            <p className="mt-1 text-sm text-gray-500">Los cambios quedan disponibles durante esta sesión.</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar formulario" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Tipo de cliente
              <select value={values.type} onChange={(event) => update("type", event.target.value as Client["type"])} className={inputClass}>
                <option>Comercio</option><option>Distribuidor</option><option>Particular</option>
              </select>
            </label>
            <label className={labelClass}>Estado
              <select value={values.status} onChange={(event) => update("status", event.target.value as ClientStatus)} className={inputClass}>
                <option>Activo</option><option>Inactivo</option>
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Razón social o nombre <span className="text-rose-600">*</span>
              <input required maxLength={100} value={values.name} onChange={(event) => update("name", event.target.value)} autoFocus className={inputClass} placeholder="Nombre del cliente" />
            </label>
            <label className={labelClass}>Identificación fiscal
              <input value={values.taxId} onChange={(event) => update("taxId", event.target.value)} className={inputClass} placeholder="Dato de referencia" />
            </label>
            <label className={labelClass}>Teléfono
              <input type="tel" value={values.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} placeholder="Código de área y número" />
            </label>
            <label className={labelClass}>Correo electrónico
              <input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} className={inputClass} placeholder="nombre@comercio.com" />
            </label>
            <label className={labelClass}>Domicilio
              <input value={values.address} onChange={(event) => update("address", event.target.value)} className={inputClass} placeholder="Calle y altura" />
            </label>
            <label className={labelClass}>Localidad <span className="text-rose-600">*</span>
              <input required value={values.locality} onChange={(event) => update("locality", event.target.value)} className={inputClass} placeholder="Localidad" />
            </label>
            <label className={labelClass}>Provincia
              <input value={values.province} onChange={(event) => update("province", event.target.value)} className={inputClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Condición comercial
              <input value={values.terms} onChange={(event) => update("terms", event.target.value)} className={inputClass} placeholder="Ej.: contado o cuenta corriente" />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Observaciones
              <textarea rows={3} value={values.notes} onChange={(event) => update("notes", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
            <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Guardar cliente</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ClientDetails({ client, onClose, onEdit }: { client: Client; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="client-detail-title" className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{client.code} · {client.type}</p><h2 id="client-detail-title" className="mt-1 text-xl font-bold text-gray-900">{client.name}</h2></div>
          <div className="flex gap-2"><button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar</button><button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Cerrar</button></div>
        </div>
        <div className="grid gap-7 p-5 sm:grid-cols-[minmax(0,1fr)_1.2fr] sm:p-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Información del cliente</h3>
            <dl className="mt-3 space-y-3 text-sm">
              {[ ["Identificación fiscal", client.taxId], ["Teléfono", client.phone], ["Correo", client.email], ["Domicilio", [client.address, client.locality, client.province].filter(Boolean).join(", ")], ["Condición comercial", client.terms], ["Estado", client.status] ].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-0.5 break-words font-medium text-gray-800">{value || "Sin dato"}</dd></div>)}
            </dl>
            {client.notes && <div className="mt-4 rounded-lg bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-900">Observaciones</p><p className="mt-1 text-sm text-amber-900">{client.notes}</p></div>}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Actividad de Ventas</h3>
            <p className="mt-1 text-xs text-gray-500">Movimientos ficticios de referencia para la maqueta.</p>
            <ol className="mt-4 divide-y divide-gray-100">
              {SAMPLE_CLIENT_ACTIVITY.map((activity) => (
                <li key={activity.code} className="py-3 first:pt-0">
                  <Link to={activity.to} className="group flex items-start justify-between gap-3 rounded focus-visible:outline-2 focus-visible:outline-amber-600">
                    <span><span className="text-xs font-medium text-amber-700">{activity.type} · {activity.code}</span><span className="mt-1 block text-sm font-medium text-gray-900 group-hover:text-amber-800">{activity.summary}</span><span className="mt-1 block text-xs text-gray-500">{activity.date} · {activity.status}</span></span><span aria-hidden="true" className="mt-1 text-gray-400">↗</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Clientes() {
  const [clients, setClients] = useState(SAMPLE_CLIENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [localityFilter, setLocalityFilter] = useState("Todas las localidades");
  const [editingClient, setEditingClient] = useState<Client | null | undefined>(undefined);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notice, setNotice] = useState("");

  const localities = useMemo(() => [...new Set(clients.map((client) => client.locality).filter(Boolean))].sort(), [clients]);
  const filteredClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return clients.filter((client) => {
      const matchesSearch = !query || [client.name, client.code, client.taxId].some((value) => value.toLocaleLowerCase("es").includes(query));
      const matchesStatus = statusFilter === "Todos los estados" || client.status === statusFilter;
      const matchesLocality = localityFilter === "Todas las localidades" || client.locality === localityFilter;
      return matchesSearch && matchesStatus && matchesLocality;
    });
  }, [clients, search, statusFilter, localityFilter]);

  useEffect(() => {
    if (editingClient === undefined && selectedClient === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setEditingClient(undefined); setSelectedClient(null); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingClient, selectedClient]);

  function saveClient(client: Client) {
    const isNew = !client.id;
    if (isNew) {
      const nextNumber = Math.max(...clients.map((item) => Number(item.code.slice(-3))), 0) + 1;
      const saved = { ...client, id: `c-${Date.now()}`, code: `CLI-${String(nextNumber).padStart(5, "0")}` };
      setClients((current) => [saved, ...current]);
      setNotice("Cliente agregado a la lista durante esta sesión.");
    } else {
      setClients((current) => current.map((item) => item.id === client.id ? client : item));
      setNotice("Cambios actualizados durante esta sesión.");
    }
    setEditingClient(undefined);
    setSelectedClient(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader title="Clientes" description="Consulta y administra los datos de clientes comerciales y particulares." action={<button type="button" onClick={() => setEditingClient(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nuevo cliente</button>} />

      {notice && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}<button type="button" onClick={() => setNotice("")} className="ml-3 font-medium underline">Cerrar</button></p>}

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div><h2 className="font-semibold text-gray-900">Listado de clientes</h2><p className="mt-1 text-sm text-gray-500">{filteredClients.length} {filteredClients.length === 1 ? "cliente" : "clientes"} encontrados</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <label className="sr-only" htmlFor="client-search">Buscar por nombre, código o identificación fiscal</label>
            <input id="client-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente…" className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64" />
            <label className="sr-only" htmlFor="client-status">Filtrar por estado</label>
            <select id="client-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"><option>Todos los estados</option><option>Activo</option><option>Inactivo</option></select>
            <label className="sr-only" htmlFor="client-locality">Filtrar por localidad</label>
            <select id="client-locality" value={localityFilter} onChange={(event) => setLocalityFilter(event.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"><option>Todas las localidades</option>{localities.map((locality) => <option key={locality}>{locality}</option>)}</select>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="px-5 py-14 text-center"><div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div><h3 className="mt-4 font-semibold text-gray-900">No encontramos clientes</h3><p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p><button type="button" onClick={() => { setSearch(""); setStatusFilter("Todos los estados"); setLocalityFilter("Todas las localidades"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead><tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><th scope="col" className="px-5 py-3 font-medium">Código</th><th scope="col" className="px-5 py-3 font-medium">Cliente</th><th scope="col" className="px-5 py-3 font-medium">Identificación fiscal</th><th scope="col" className="px-5 py-3 font-medium">Localidad</th><th scope="col" className="px-5 py-3 font-medium">Contacto</th><th scope="col" className="px-5 py-3 font-medium">Estado</th><th scope="col" className="px-5 py-3 text-right font-medium">Acciones</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => <tr key={client.id} className="hover:bg-amber-50/30">
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-gray-500">{client.code}</td>
                  <td className="px-5 py-4"><button type="button" onClick={() => setSelectedClient(client)} className="text-left font-semibold text-gray-900 hover:text-amber-800 focus-visible:outline-2 focus-visible:outline-amber-600">{client.name}</button><p className="mt-0.5 text-xs text-gray-500">{client.type}</p></td>
                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">{client.taxId || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">{client.locality}</td>
                  <td className="px-5 py-4"><p className="whitespace-nowrap text-gray-700">{client.phone || "—"}</p><p className="mt-0.5 max-w-48 truncate text-xs text-gray-500">{client.email || "—"}</p></td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${client.status === "Activo" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{client.status}</span></td>
                  <td className="whitespace-nowrap px-5 py-4 text-right"><button type="button" onClick={() => setSelectedClient(client)} className="rounded px-2 py-1 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver</button><button type="button" onClick={() => setEditingClient(client)} className="ml-1 rounded px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">Datos de muestra para la maqueta de Ventas.</div>
      </section>

      {editingClient !== undefined && <ClientForm client={editingClient} onCancel={() => setEditingClient(undefined)} onSave={saveClient} />}
      {selectedClient && <ClientDetails client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={() => { setEditingClient(selectedClient); setSelectedClient(null); }} />}
    </div>
  );
}
