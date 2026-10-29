import { useEffect, useState, type FormEvent } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { SalesFormHeader, SalesPageHeader, SalesListPanel, SalesEmptyState } from "~/components/SalesLayout";
import { useProductionCatalogs } from "~/components/CatalogProvider";
import { currentSalesDate } from "~/data/billing";
import { COUNTER_CLIENT } from "~/data/sales";
import { getSalesData } from "~/data/sales.server";
import { PRODUCTOS_PRODUCCION } from "~/data/produccion";
import { canDonateProduct, donationAvailability, DONATION_EXPIRY_DAYS, type Donation } from "~/data/donaciones";
import { getDonations, saveDonation } from "~/data/donaciones.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/donacion";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserAndRole(request, ["Ventas"]);
  const [{ clients }, donations] = await Promise.all([getSalesData(), getDonations()]);
  return { clients: clients.filter(client => client.id !== COUNTER_CLIENT.id && client.status === "Activo"), products: PRODUCTOS_PRODUCCION, donations, today: currentSalesDate() };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUserAndRole(request, ["Ventas"]);
  try {
    const data = await request.formData();
    const raw = data.get("donation");
    if (data.get("intent") !== "create" || typeof raw !== "string" || raw.length > 100000) throw new Error("Los datos de la donación no son válidos.");
    const donation = await saveDonation(JSON.parse(raw), user.role);
    return { success: true, number: donation.number };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo registrar la donación." };
  }
}

const field = "mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-amber-600 disabled:bg-gray-100";
const label = "block text-sm font-medium text-gray-700";
const button = "rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50";

function DonationForm({ onClose, onSaved }: { onClose: () => void; onSaved: (number: string) => void }) {
  const { clients, products, donations, today } = useLoaderData<typeof loader>();
  const { getUnidad } = useProductionCatalogs();
  const fetcher = useFetcher<typeof action>();
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState(today);
  const [productId, setProductId] = useState("");
  const [items, setItems] = useState<{ productId: number; quantity: number }[]>([]);
  const [observations, setObservations] = useState("");
  const pending = fetcher.state !== "idle";
  const [error, setError] = useState("");
  const eligible = products.filter(product => canDonateProduct(product, date) && donationAvailability(product, donations) > 0);
  const options = eligible.filter(product => !items.some(item => item.productId === product.idProducto));
  const serverError = fetcher.data && "error" in fetcher.data ? fetcher.data.error : "";
  const savedNumber = fetcher.data && "number" in fetcher.data ? fetcher.data.number : undefined;

  useEffect(() => { if (savedNumber) onSaved(savedNumber); }, [savedNumber, onSaved]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!clientId || !date || date > today) return setError("Seleccioná el cliente y una fecha válida hasta hoy.");
    if (!items.length) return setError("Agregá al menos un producto para donar.");
    for (const item of items) {
      const product = eligible.find(candidate => candidate.idProducto === item.productId);
      if (!product || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > donationAvailability(product, donations)) return setError("Revisá el vencimiento y las cantidades disponibles de los productos.");
    }
    const data = new FormData();
    data.set("intent", "create");
    data.set("donation", JSON.stringify({ clientId, date, items, observations }));
    fetcher.submit(data, { method: "post" });
  }

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <SalesFormHeader title="Nueva donación" onCancel={onClose} pending={pending} />
    <form onSubmit={submit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      {(error || serverError) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error || serverError}</p>}
      <fieldset disabled={pending} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>Cliente destinatario *<select required value={clientId} onChange={event => setClientId(event.target.value)} className={field}><option value="">Seleccionar cliente…</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name} · {client.code}</option>)}</select></label>
          <label className={label}>Fecha de donación *<input type="date" required value={date} max={today} onChange={event => { setDate(event.target.value); setProductId(""); }} className={field} /></label>
        </div>
        <section aria-labelledby="donation-products" className="space-y-4">
          <div><h2 id="donation-products" className="font-semibold text-gray-900">Productos a donar</h2><p className="mt-1 text-sm text-gray-500">Se ofrecen productos con existencias que vencen entre la fecha de donación y los {DONATION_EXPIRY_DAYS} días siguientes. El valor unitario y el total son $0.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className={`${label} flex-1`}>Producto<select value={productId} onChange={event => setProductId(event.target.value)} className={field}><option value="">Seleccionar producto…</option>{options.map(product => <option key={product.idProducto} value={product.idProducto}>{product.nombre} · Vence {product.fechaVencimiento} · Disponible {donationAvailability(product, donations)} {getUnidad(product.idUnidad)}</option>)}</select></label>
            <button type="button" disabled={!productId} className={button} onClick={() => { setItems(current => [...current, { productId: Number(productId), quantity: Math.min(1, donationAvailability(products.find(product => product.idProducto === Number(productId))!, donations)) }]); setProductId(""); }}>Agregar producto</button>
          </div>
          {!eligible.length && <p role="status" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">No hay productos disponibles próximos a vencer para esta fecha. Los productos vencidos o sin existencias no se pueden donar.</p>}
          {!clients.length && <p className="text-sm text-amber-900">Registrá un cliente activo en Clientes para poder seleccionarlo como destinatario.</p>}
          <div className="space-y-3">{items.map(item => {
            const product = products.find(candidate => candidate.idProducto === item.productId)!;
            const available = donationAvailability(product, donations);
            const valid = canDonateProduct(product, date) && item.quantity > 0 && item.quantity <= available;
            return <article key={item.productId} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-gray-900">{product.nombre}</h3><p className="mt-1 text-sm text-gray-600">Vencimiento: {product.fechaVencimiento} · Disponible para donar: {available} {getUnidad(product.idUnidad)}</p></div><button type="button" className="text-sm font-semibold text-red-700" aria-label={`Quitar ${product.nombre}`} onClick={() => setItems(current => current.filter(row => row.productId !== item.productId))}>Quitar</button></div>
              <div className="mt-3 grid items-end gap-4 sm:grid-cols-3"><label className={label}>Cantidad ({getUnidad(product.idUnidad)}) *<input type="number" required min="0.001" max={available} step="0.001" value={Number.isNaN(item.quantity) ? "" : item.quantity} onChange={event => setItems(current => current.map(row => row.productId === item.productId ? { ...row, quantity: event.target.valueAsNumber } : row))} className={field} /></label><p className="py-2 text-sm text-gray-600">Valor unitario: <strong>$0</strong></p><p className="py-2 text-sm text-gray-600">Subtotal: <strong>$0</strong></p></div>
              {!valid && <p role="alert" className="mt-2 text-sm text-red-700">Revisá la cantidad o quitá el producto si su vencimiento ya no corresponde a la fecha elegida.</p>}
            </article>;
          })}</div>
        </section>
        <label className={label}>Observaciones<textarea rows={3} maxLength={2000} value={observations} onChange={event => setObservations(event.target.value)} className={field} placeholder="Referencias de la entrega o motivo de la donación" /></label>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5"><p className="text-lg font-semibold text-gray-900">Total donación: $0</p><div className="flex gap-3"><button type="button" disabled={pending} onClick={onClose} className={button}>Cancelar</button><button type="submit" disabled={pending || !clients.length || !items.length} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">{pending ? "Registrando…" : "Registrar donación"}</button></div></div>
    </form>
  </div>;
}

function DonationDetails({ donation, onClose }: { donation: Donation; onClose: () => void }) {
  const { getUnidad } = useProductionCatalogs();
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><SalesFormHeader title={`Donación ${donation.number}`} onCancel={onClose} /><section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
    <dl className="grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-gray-500">Cliente destinatario</dt><dd className="mt-1 font-semibold text-gray-900">{donation.clientName}</dd></div><div><dt className="text-gray-500">Fecha de donación</dt><dd className="mt-1 text-gray-900">{donation.date}</dd></div><div><dt className="text-gray-500">Estado</dt><dd className="mt-1 font-semibold text-emerald-700">Registrada</dd></div></dl>
    <h2 className="font-semibold text-gray-900">Productos donados</h2><ul className="divide-y divide-gray-100">{donation.items.map(item => <li key={item.productId} className="flex flex-wrap justify-between gap-3 py-3"><div><p className="font-medium text-gray-900">{item.productName}</p><p className="text-sm text-gray-500">Vence {item.expirationDate} · {item.quantity} {getUnidad(item.unitId)}</p></div><p className="text-sm text-gray-700">Valor unitario $0 · Subtotal $0</p></li>)}</ul>
    {donation.observations && <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{donation.observations}</p>}<p className="border-t border-gray-100 pt-4 text-right text-lg font-semibold text-gray-900">Total donación: $0</p>
  </section></div>;
}

export default function Donacion() {
  const { donations } = useLoaderData<typeof loader>();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Donation | null>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const rows = donations.filter(donation => [donation.number, donation.clientName, ...donation.items.map(item => item.productName)].some(value => value.toLocaleLowerCase("es").includes(search.trim().toLocaleLowerCase("es"))));
  if (creating) return <DonationForm onClose={() => setCreating(false)} onSaved={number => { setCreating(false); setNotice(`Donación ${number} registrada correctamente por $0.`); }} />;
  if (selected) return <DonationDetails donation={selected} onClose={() => setSelected(null)} />;
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <SalesPageHeader title="Donación" description="Registrá productos próximos a vencer entregados a clientes sin cargo." action={<button type="button" onClick={() => { setNotice(""); setCreating(true); }} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700">＋ Nueva donación</button>} />
    {notice && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <SalesListPanel title="Donaciones registradas" summary={`${rows.length} donaciones · Valor total $0`} filters={<label className={label}>Buscar donación<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Número, cliente o producto…" className={field} /></label>}>
      {!rows.length ? <SalesEmptyState entity="donaciones" onReset={() => setSearch("")} /> : <div className="divide-y divide-gray-100">{rows.map(donation => <article key={donation.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><p className="text-xs font-medium text-amber-700">{donation.number} · {donation.date}</p><h2 className="mt-1 font-semibold text-gray-900">{donation.clientName}</h2><p className="mt-1 text-sm text-gray-500">{donation.items.map(item => item.productName).join(", ")}</p></div><div className="flex items-center gap-4"><span className="font-semibold text-gray-900">$0</span><button type="button" onClick={() => setSelected(donation)} className={button} aria-label={`Ver donación ${donation.number}`}>Ver detalle</button></div></article>)}</div>}
    </SalesListPanel>
  </div>;
}
