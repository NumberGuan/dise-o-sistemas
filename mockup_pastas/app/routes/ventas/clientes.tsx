import { CatalogField } from "~/components/InlineCatalog";
import { catalogDefaultValue } from "~/data/catalogs";
import { CatalogOptions, useCatalogs } from "~/components/CatalogProvider";
import ClientMonthlyAccount from "~/components/ClientMonthlyAccount";
import { getClientMonthlyAccount } from "~/data/billing";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useFetcher, useLoaderData } from "react-router";

import ClientAddressesEditor from "~/components/ClientAddressesEditor";
import { SalesFormHeader, SalesPageHeader } from "~/components/SalesLayout";
import { getClientAddresses, createFixedClientAddress, formatClientAddress, type Client, type ClientStatus, type Order } from "~/data/sales";
import { getSalesData, saveSalesClient } from "~/data/sales.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/clientes";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Ventas"]);
  return { ...await getSalesData(), canChangeClientType: user.role === "Administrador" };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Ventas"]);
  const formData = await request.formData();
  if (formData.get("intent") !== "save-client") return { error: "La acción solicitada no está disponible." };
  try {
    const raw = formData.get("client");
    if (typeof raw !== "string") throw new Error("Los datos del cliente no son válidos.");
    const idValue = formData.get("id");
    if (idValue !== null && (typeof idValue !== "string" || idValue.length > 120)) throw new Error("El identificador del cliente no es válido.");
    await saveSalesClient(JSON.parse(raw), idValue || undefined, user.role);
    return { success: true, intent: "save-client" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar el cliente." };
  }
};

type ClientFormProps = {
  client: Client | null;
  onCancel: () => void;
  onSave: (client: Client) => void;
  pending: boolean;
  serverError: string;
  canChangeClientType: boolean;
};

const EMPTY_CLIENT: Omit<Client, "id" | "code"> = {
  type: "Particular", name: "", documentType: "DNI", cuitCuil: "", ivaType: "", phone: "", email: "", street: "", streetNumber: "", balance: 0, floor: "", apartment: "", locality: "", province: "Buenos Aires", status: "Activo", notes: "",
};

function ClientForm({ client, onCancel, onSave, pending, serverError, canChangeClientType }: ClientFormProps) {
  const catalogs = useCatalogs();
  const [values, setValues] = useState(client ? { ...client, addresses: getClientAddresses(client).length ? getClientAddresses(client) : [createFixedClientAddress()] } : { ...EMPTY_CLIENT, type: catalogDefaultValue(catalogs, "tipos-cliente", "Particular"), documentType: catalogDefaultValue(catalogs, "tipos-documento", "DNI"), id: "", code: "", addresses: [createFixedClientAddress()] });
  const [error, setError] = useState("");

  function update<K extends keyof Client>(key: K, value: Client[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Completá el nombre o razón social.");
      return;
    }
    onSave({
      ...values,
      street: values.addresses[0]?.street ?? "",
      streetNumber: values.addresses[0]?.streetNumber ?? "",
      floor: values.addresses[0]?.floor ?? "",
      apartment: values.addresses[0]?.apartment ?? "",
      locality: values.addresses[0]?.locality ?? "",
      province: values.addresses[0]?.province ?? "Buenos Aires",
      name: values.name.trim(),
      balance: values.type === "Comercio" ? values.balance : 0,
    });
  }

  const inputClass = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <SalesFormHeader title={client ? "Editar cliente" : "Nuevo cliente"} onCancel={onCancel} pending={pending} />
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <form noValidate onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          {(error || serverError) && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error || serverError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Tipo de cliente
              <CatalogField catalog="tipos-cliente" onCreated={entry => update("type", entry.value)} disabled={pending || Boolean(client) && !canChangeClientType}><select value={values.type} disabled={Boolean(client) && !canChangeClientType} onChange={(event) => update("type", event.target.value as Client["type"])} className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-500`}>
                <option value="">Seleccionar…</option><CatalogOptions catalog="tipos-cliente" retained={client?.type} />
              </select></CatalogField>
              {client && !canChangeClientType && <span className="mt-1 block text-xs font-normal text-gray-500">Solo un administrador puede cambiar la condición del cliente.</span>}
            </label>
            <label className={labelClass}>Estado
              <select value={values.status} onChange={(event) => update("status", event.target.value as ClientStatus)} className={inputClass}>
                <option>Activo</option><option>Inactivo</option>
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Razón social o nombre <span className="text-rose-600">*</span>
              <input required maxLength={100} value={values.name} onChange={(event) => update("name", event.target.value)} autoFocus className={inputClass} placeholder="Nombre del cliente" />
            </label>
            <label className={labelClass}>Tipo de documento
              <CatalogField catalog="tipos-documento" onCreated={entry => update("documentType", entry.value)} disabled={pending}><select value={values.documentType} onChange={(event) => update("documentType", event.target.value as Client["documentType"])} className={inputClass}>
                <CatalogOptions catalog="tipos-documento" retained={client?.documentType} />
              </select></CatalogField>
            </label>
            <label className={labelClass}>CUIT/CUIL
              <input value={values.cuitCuil} onChange={(event) => update("cuitCuil", event.target.value)} className={inputClass} placeholder="Número de documento" />
            </label>
            <label className={labelClass}>Tipo IVA
              <CatalogField catalog="tipos-iva" onCreated={entry => update("ivaType", entry.value)} disabled={pending}><select value={values.ivaType} onChange={(event) => update("ivaType", event.target.value as Client["ivaType"])} className={inputClass}>
                <option value="">Seleccionar</option>
                <CatalogOptions catalog="tipos-iva" retained={client?.ivaType} />
              </select></CatalogField>
            </label>
            <label className={labelClass}>Teléfono
              <input type="tel" value={values.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} placeholder="Código de área y número" />
            </label>
            <label className={labelClass}>Correo electrónico
              <input type="email" value={values.email} disabled={Boolean(client?.id.startsWith("customer-"))} onChange={(event) => update("email", event.target.value)} className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-500`} placeholder="nombre@comercio.com" />
            </label>
            {values.type === "Comercio" && <p className="text-sm text-gray-600 sm:col-span-2">El saldo se calcula automáticamente con los pedidos y pagos de cada mes. Las facturas incluyen el descuento del 15% para comercios.</p>}
            <label className={`${labelClass} sm:col-span-2`}>Observaciones
              <textarea rows={3} value={values.notes} onChange={(event) => update("notes", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
          </div>
          <ClientAddressesEditor addresses={values.addresses} onChange={addresses => setValues(current => ({ ...current, addresses }))} disabled={pending} />
          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" disabled={pending} onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
            <button type="submit" disabled={pending} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">{pending ? "Guardando…" : "Guardar cliente"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ClientDetails({ client, orders, onClose, onEdit, canEdit }: { client: Client; orders: Order[]; onClose: () => void; onEdit: () => void; canEdit: boolean }) {
  const { invoices, receipts } = useLoaderData<typeof loader>();
  const months = getClientMonthlyAccount(client, orders, invoices, receipts);
  const activity = orders.filter((order) => order.clientId === client.id).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <SalesFormHeader title={`Cliente ${client.name}`} onCancel={onClose} />
      <section aria-labelledby="client-detail-title" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{client.code} · {client.type}</p><h2 id="client-detail-title" className="mt-1 text-lg font-semibold text-gray-900">Datos del cliente</h2></div>
          {canEdit && <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar cliente</button>}
        </div>
        <div className="grid gap-7 p-5 sm:grid-cols-[minmax(0,1fr)_1.2fr] sm:p-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Información del cliente</h3>
            <dl className="mt-3 space-y-3 text-sm">
              {[["Tipo de documento", client.documentType], ["CUIT/CUIL", client.cuitCuil], ["Tipo IVA", client.ivaType], ["Teléfono", client.phone], ["Correo", client.email], ["Calle", client.street], ["Altura", client.streetNumber], ["Dirección fija de facturación", formatClientAddress(client)], ...(client.type === "Comercio" ? [["Saldo", new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(client.balance)]] : []), ["Estado", client.status]].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-0.5 break-words font-medium text-gray-800">{value || "Sin dato"}</dd></div>)}
            </dl>
            {client.type === "Comercio" && <ClientMonthlyAccount months={months} clientId={client.id} />}
            <h3 className="mt-5 text-sm font-semibold text-gray-900">Dirección fija y complementarias</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">{getClientAddresses(client).map((address, index) => <li key={address.id}><strong>{index === 0 ? "Dirección fija · Facturación" : address.label}</strong><p>{formatClientAddress(address)}</p></li>)}</ul>
            {client.notes && <div className="mt-4 rounded-lg bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-900">Observaciones</p><p className="mt-1 text-sm text-amber-900">{client.notes}</p></div>}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Actividad de Ventas</h3>
            <p className="mt-1 text-xs text-gray-500">Pedidos registrados para este cliente.</p>
            {activity.length ? <ol className="mt-4 divide-y divide-gray-100">{activity.map((order) => <li key={order.id} className="py-3 first:pt-0"><span className="text-xs font-medium text-amber-700">Pedido · {order.number}</span><span className="mt-1 block text-sm font-medium text-gray-900">{order.items.map((item) => item.productName).join(", ")}</span><span className="mt-1 block text-xs text-gray-500">{order.date} · {order.status} · ${order.total.toLocaleString("es-AR")}</span></li>)}</ol> : <p className="mt-4 rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-500">Todavía no hay pedidos registrados.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Clientes() {
  const { clients, orders, canChangeClientType } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [localityFilter, setLocalityFilter] = useState("Todas las localidades");
  const [editingClient, setEditingClient] = useState<Client | null | undefined>(undefined);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notice, setNotice] = useState("");
  const serverError = fetcher.data && "error" in fetcher.data ? fetcher.data.error : "";

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      setEditingClient(undefined);
      setSelectedClient(null);
      setNotice("Cliente guardado correctamente.");
    }
  }, [fetcher.data]);

  const localities = useMemo(() => [...new Set(clients.map((client) => client.locality).filter(Boolean))].sort(), [clients]);
  const filteredClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return clients.filter((client) => {
      const matchesSearch = !query || [client.name, client.code, client.documentType, client.cuitCuil].some((value) => value.toLocaleLowerCase("es").includes(query));
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
    const formData = new FormData();
    formData.set("intent", "save-client");
    formData.set("client", JSON.stringify(client));
    if (client.id) formData.set("id", client.id);
    fetcher.submit(formData, { method: "post" });
  }

  if (editingClient !== undefined) {
    return <ClientForm client={editingClient} onCancel={() => setEditingClient(undefined)} onSave={saveClient} pending={fetcher.state !== "idle"} serverError={serverError || ""} canChangeClientType={canChangeClientType} />;
  }

  if (selectedClient) {
    return <ClientDetails client={selectedClient} orders={orders} canEdit onClose={() => setSelectedClient(null)} onEdit={() => { setEditingClient(selectedClient); setSelectedClient(null); }} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader title="Clientes" description="Consulta y administra los datos de clientes comerciales y particulares." action={<button type="button" onClick={() => setEditingClient(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nuevo cliente</button>} />

      {notice && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}<button type="button" onClick={() => setNotice("")} className="ml-3 font-medium underline">Cerrar</button></p>}

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div><h2 className="font-semibold text-gray-900">Listado de clientes</h2><p className="mt-1 text-sm text-gray-500">{filteredClients.length} {filteredClients.length === 1 ? "cliente" : "clientes"} encontrados</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <label className="sr-only" htmlFor="client-search">Buscar por nombre, código, tipo de documento o CUIT/CUIL</label>
            <input id="client-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente…" className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64" />
            <label className="sr-only" htmlFor="client-status">Filtrar por estado</label>
            <select id="client-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"><option>Todos los estados</option><option>Activo</option><option>Inactivo</option></select>
            <label className="sr-only" htmlFor="client-locality">Filtrar por localidad</label>
            <select id="client-locality" value={localityFilter} onChange={(event) => setLocalityFilter(event.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"><option>Todas las localidades</option>{localities.map((locality) => <option key={locality}>{locality}</option>)}</select>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="px-5 py-14 text-center"><div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div><h3 className="mt-4 font-semibold text-gray-900">No encontramos clientes</h3><p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p><button type="button" onClick={() => { setSearch(""); setStatusFilter("Todos los estados"); setLocalityFilter("Todas las localidades"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button></div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-5 items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-center">Nombre/Razón Social</div>
              <div className="min-w-0 text-center">CUIT/CUIL</div>
              <div className="min-w-0 text-center">Localidad</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
            {filteredClients.map((client) => <article key={client.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-5 lg:gap-5 lg:px-5">
              <div className="col-span-2 min-w-0 lg:col-span-1 text-left lg:text-center">
                <p className="mb-1 text-xs font-medium text-gray-500">{client.code} · {client.type}</p>
                <h3 className="break-words font-semibold leading-5 text-gray-900">{client.name}</h3>
              </div>
              <div className="min-w-0 text-left lg:text-center">
                <p className="text-xs font-medium text-gray-500 lg:hidden">CUIT/CUIL</p>
                <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{client.cuitCuil || "Sin dato"}</p>
              </div>
              <div className="min-w-0 text-left lg:text-center">
                <p className="text-xs font-medium text-gray-500 lg:hidden">Localidad</p>
                <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{client.locality}</p>
              </div>
              <div className="flex flex-col items-start gap-1 lg:items-center">
                <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${client.status === "Activo" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{client.status}</span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                <button type="button" onClick={() => setSelectedClient(client)} aria-label={`Ver detalle de ${client.name}`} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                <button type="button" onClick={() => setEditingClient(client)} aria-label={`Editar ${client.name}`} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
              </div>
            </article>)}
          </div>
          </>
        )}
        <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">Incluye cuentas registradas en Compras y clientes de muestra de Ventas.</div>
      </section>

    </div>
  );
}
