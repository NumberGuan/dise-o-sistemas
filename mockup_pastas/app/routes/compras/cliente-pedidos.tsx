import { useState } from "react";
import { Link, data, redirect, useActionData, useLoaderData, useSearchParams } from "react-router";

import CustomerOrderEditor from "~/components/CustomerOrderEditor";
import PrintVoucher from "~/components/PrintVoucher";
import ShopPageHero from "~/components/ShopPageHero";
import { getClientAddresses, type Order, type OrderStatus } from "~/data/sales";
import { customerAsClient } from "~/data/customer.server";
import { customerOrderVersion, getSalesData, saveCustomerOrderEdit } from "~/data/sales.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/cliente-pedidos";
export { default as ErrorBoundary } from "~/components/CustomerErrorBoundary";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const orderNumber = new Intl.Collator("es-AR", { numeric: true });
const ordersUrl = "/compras/pedidos";
const actionClass = "inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-semibold text-amber-900 hover:bg-amber-50 hover:underline focus-visible:outline-2 focus-visible:outline-amber-700";
const statusClasses: Record<OrderStatus, string> = {
  "Pendiente": "bg-amber-100 text-amber-950",
  "En preparación": "bg-sky-100 text-sky-900",
  "Listo para remito": "bg-emerald-100 text-emerald-900",
  "Facturado": "bg-purple-100 text-purple-900",
  "Cancelado": "bg-red-100 text-red-900",
};
const sortColumns = [
  { field: "number", label: "Número de pedido" },
  { field: "date", label: "Fecha" },
  { field: "status", label: "Estado" },
] as const;
type SortField = (typeof sortColumns)[number]["field"];

function orderUrl(id: string, view?: "editar" | "guardado") {
  const params = new URLSearchParams({ pedido: id });
  if (view) params.set("vista", view);
  return `${ordersUrl}?${params}`;
}

function formatOrderDate(value: string) {
  if (!value) return "Sin informar";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-").reverse().join("/") : value;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-AR");
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const client = customerAsClient(user);
  if (!client) throw new Response(null, { status: 404 });
  const { orders } = await getSalesData();
  const customerOrders = orders.filter(order => order.clientId === client.id);
  const params = new URL(request.url).searchParams;
  const id = params.get("pedido");
  const order = id ? customerOrders.find(item => item.id === id) : undefined;
  if (id && !order) throw new Response(null, { status: 404 });
  const version = order?.status === "Pendiente" && params.get("vista") === "editar" ? customerOrderVersion(order) : null;
  const addresses = version ? getClientAddresses(client).filter(address => address.street.trim() && address.locality.trim()) : [];
  return { recipient: user.name, orders: customerOrders, order, version, addresses };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const form = await request.formData();
  const orderId = form.get("orderId");
  if (form.get("intent") !== "edit-order" || typeof orderId !== "string" || !orderId.trim() || orderId.length > 120) {
    return data({ error: "La solicitud de edición no es válida." }, { status: 400 });
  }
  try {
    await saveCustomerOrderEdit(user.id, orderId, form);
    return redirect(orderUrl(orderId, "guardado"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No pudimos guardar los cambios del pedido." };
  }
};

function OrderStatusLabel({ status }: { status: OrderStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status] ?? "bg-gray-100 text-gray-800"}`}>{status}</span>;
}

function OrderDetails({ order, recipient }: { order: Order; recipient: string }) {
  const deliveryDate = `${formatOrderDate(order.deliveryDate)}${order.deliveryTime ? ` a las ${order.deliveryTime}` : ""}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-sm">
      <section aria-labelledby="delivery-summary" className="border-b border-[#eadfd3] p-4 sm:p-6">
        <h2 id="delivery-summary" className="text-lg font-semibold">Datos del pedido</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold">Fecha del pedido</dt><dd className="mt-1 text-gray-600">{formatOrderDate(order.date)}</dd></div>
          <div><dt className="font-semibold">Tipo</dt><dd className="mt-1 text-gray-600">{order.kind ?? "Regular"}</dd></div>
          <div><dt className="font-semibold">{order.kind === "Evento" ? "Entrega programada" : "Entrega estimada"}</dt><dd className="mt-1 text-gray-600">{deliveryDate}</dd></div>
          {order.fulfillment && <div><dt className="font-semibold">Modalidad de entrega</dt><dd className="mt-1 text-gray-600">{order.fulfillment}</dd></div>}
          {order.deliveryAddress && order.deliveryAddress !== order.fulfillment && <div><dt className="font-semibold">Dirección de entrega</dt><dd className="mt-1 text-gray-600">{order.deliveryAddress}</dd></div>}
          {order.observations && <div className="sm:col-span-2"><dt className="font-semibold">Observaciones</dt><dd className="mt-1 whitespace-pre-wrap break-words text-gray-600">{order.observations}</dd></div>}
        </dl>
      </section>
      <section aria-labelledby="order-products" className="p-4 sm:p-6">
        <h2 id="order-products" className="text-lg font-semibold">Productos</h2>
        <ul className="mt-3 divide-y divide-[#f0e7dd]">
          {order.items.map(item => <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-gray-700">{item.quantity} × {item.productName}</span>
            <span className="shrink-0 tabular-nums text-gray-900">{currency.format(item.subtotal)}</span>
          </li>)}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#eadfd3] pt-4">
          <div>
            {order.discount > 0 && <p className="text-sm text-gray-600">Descuento {currency.format(order.discount)}</p>}
            <p className="font-semibold">Total <span className="tabular-nums">{currency.format(order.total)}</span></p>
          </div>
          <PrintVoucher title="Pedido de cliente" document={order} recipient={recipient} details={[{ label: "Entrega", value: deliveryDate }, { label: "Domicilio", value: order.deliveryAddress ?? "Sin informar" }]} />
        </div>
      </section>
    </div>
  );
}

export default function ClientePedidos() {
  const { orders, recipient, order, version, addresses } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ field: SortField; descending: boolean }>({ field: "date", descending: true });
  const terms = normalizeSearch(query.trim()).split(/\s+/).filter(Boolean);
  const visibleOrders = orders.filter(item => {
    const content = normalizeSearch([item.number, item.date, formatOrderDate(item.date), item.status].join(" "));
    return terms.every(term => content.includes(term));
  }).sort((a, b) => {
    const value = sort.field === "number" ? orderNumber.compare(a.number, b.number) : a[sort.field].localeCompare(b[sort.field], "es-AR");
    return (sort.descending ? -value : value) || b.date.localeCompare(a.date) || orderNumber.compare(b.number, a.number);
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 text-gray-900 sm:px-6 sm:py-9 lg:px-8">
      {order ? (
        <>
          <Link to={ordersUrl} className="text-sm font-semibold text-amber-800 underline underline-offset-4">Volver a Mis pedidos</Link>
          <div className="mb-5 mt-3">
            <ShopPageHero title={`${version ? "Editar pedido" : "Pedido"} ${order.number}`} art="pedidos">
              <OrderStatusLabel status={order.status} />
              {!version && order.status === "Pendiente" && <Link to={orderUrl(order.id, "editar")} className={`${actionClass} bg-white/85`}>Editar</Link>}
            </ShopPageHero>
          </div>
          {actionData?.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{actionData.error}</p>}
          {params.get("vista") === "guardado" && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Se guardaron los cambios del pedido.</p>}
          {version ? <CustomerOrderEditor key={version} order={order} addresses={addresses} version={version} detailUrl={orderUrl(order.id)} /> : <OrderDetails order={order} recipient={recipient} />}
        </>
      ) : (
        <>
          <div className="mb-6"><ShopPageHero title="Mis pedidos" art="pedidos" /></div>
          {!orders.length ? (
            <section className="rounded-2xl border border-dashed border-[#dfd0c0] bg-white px-6 py-14 text-center">
              <h2 className="text-lg font-semibold">Todavía no tenés pedidos</h2>
              <p className="mt-2 text-sm text-gray-600">Cuando confirmes una compra desde el carrito, aparecerá acá.</p>
              <Link to="/compras/catalogo" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-amber-800 px-4 text-sm font-semibold text-white">Explorar catálogo</Link>
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-sm" aria-label="Historial de pedidos">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eadfd3] p-4 sm:p-5">
                <label className="w-full text-sm font-semibold text-gray-800 sm:max-w-sm">Buscar pedidos
                  <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Número, fecha o estado" className="mt-1 block h-11 w-full rounded-xl border border-gray-300 px-3 text-sm font-normal focus-visible:outline-2 focus-visible:outline-amber-700" />
                </label>
                <p role="status" className="pb-2 text-sm text-gray-600">{visibleOrders.length === 1 ? "1 pedido" : `${visibleOrders.length} pedidos`}</p>
              </div>
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de pedidos">
                <table className="w-full min-w-[19rem] text-left text-sm">
                  <thead className="bg-[#fffdfa] text-gray-700">
                    <tr>
                      {sortColumns.map(({ field, label }) => (
                        <th key={field} scope="col" aria-sort={sort.field === field ? sort.descending ? "descending" : "ascending" : undefined} className="px-2 sm:px-5">
                          <button type="button" className="flex min-h-11 items-center gap-1 rounded text-left font-semibold leading-tight hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-amber-700" onClick={() => setSort(current => ({ field, descending: current.field === field ? !current.descending : field === "date" }))}>
                            {label}<span aria-hidden="true" className={sort.field === field ? "text-amber-800" : "text-gray-400"}>{sort.field === field ? sort.descending ? "↓" : "↑" : "↕"}</span>
                          </button>
                        </th>
                      ))}
                      <th scope="col" className="px-2 font-semibold sm:px-5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0e7dd] border-t border-[#eadfd3]">
                    {!visibleOrders.length && <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-600">No encontramos pedidos para esa búsqueda.</td></tr>}
                    {visibleOrders.map(item => (
                      <tr key={item.id}>
                        <th scope="row" className="px-2 py-3 font-semibold text-gray-900 [overflow-wrap:anywhere] sm:whitespace-nowrap sm:px-5">{item.number}</th>
                        <td className="whitespace-nowrap px-2 py-3 tabular-nums text-gray-700 sm:px-5"><time dateTime={item.date}>{formatOrderDate(item.date)}</time></td>
                        <td className="px-2 py-3 sm:px-5"><OrderStatusLabel status={item.status} /></td>
                        <td className="px-1 py-1 sm:px-3">
                          <div className="flex flex-col items-start whitespace-nowrap sm:flex-row sm:flex-wrap">
                            <Link to={orderUrl(item.id)} aria-label={`Ver detalle del pedido ${item.number}`} className={actionClass}>Ver detalle</Link>
                            {item.status === "Pendiente" && <Link to={orderUrl(item.id, "editar")} aria-label={`Editar pedido ${item.number}`} className={actionClass}>Editar</Link>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
