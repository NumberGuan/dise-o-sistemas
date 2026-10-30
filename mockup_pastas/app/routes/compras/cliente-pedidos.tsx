import PrintVoucher from "~/components/PrintVoucher";
import { useCatalogs } from "~/components/CatalogProvider";
import { deliveryNeedsAddress } from "~/data/catalogs";
import { Link, useLoaderData } from "react-router";

import { requireUserAndRole } from "~/utils/session.server";
import { getSalesData } from "~/data/sales.server";
import type { Route } from "./+types/cliente-pedidos";
export { default as ErrorBoundary } from "~/components/CustomerErrorBoundary";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const { orders } = await getSalesData();
  return { recipient: user.name, orders: orders.filter(order => order.clientId === `customer-${user.id}`).sort((a, b) => b.date.localeCompare(a.date)) };
};

export default function ClientePedidos() {
  const { orders, recipient } = useLoaderData<typeof loader>();
  const catalogs = useCatalogs();
  return <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Tu cuenta</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Historial de pedidos</h1><p className="mt-2 text-sm text-gray-600">Pedidos asociados a tu cuenta.</p></div>
    {orders.length === 0 ? <section className="rounded-2xl border border-dashed border-[#dfd0c0] bg-white px-6 py-14 text-center"><h2 className="text-lg font-semibold text-gray-900">Todavía no tenés pedidos</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">Cuando confirmes una compra desde el carrito, aparecerá acá.</p><Link to="/compras/catalogo" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-amber-800 px-4 text-sm font-semibold text-white">Explorar catálogo</Link></section> : <ol className="space-y-4">{orders.map((order) => <li key={order.id} className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e7dd] px-5 py-4"><div><p className="text-xs font-medium text-gray-500">{order.number} · {order.date}</p><h2 className="mt-1 font-semibold text-gray-900">Pedido {order.status.toLocaleLowerCase("es-AR")}</h2></div><div className="flex flex-wrap items-center gap-3"><strong className="text-lg tabular-nums text-gray-900">{currency.format(order.total)}</strong><PrintVoucher title="Pedido de cliente" document={order} recipient={recipient} details={[{ label: "Entrega", value: order.deliveryDate }, { label: "Domicilio", value: order.deliveryAddress ?? "Sin informar" }]} /></div></div><ul className="divide-y divide-gray-100 px-5">{order.items.map((item) => <li key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span className="text-gray-700">{item.quantity} × {item.productName}</span><span className="shrink-0 tabular-nums text-gray-900">{currency.format(item.subtotal)}</span></li>)}</ul><div className="bg-[#fffdfa] px-5 py-3 text-xs text-gray-500">{order.kind ?? "Regular"} · {order.kind === "Evento" ? "Entrega programada" : "Entrega estimada"}: {order.deliveryDate}{order.deliveryTime ? ` a las ${order.deliveryTime}` : ""}{order.deliveryAddress && <p className="mt-1 text-sm text-gray-700">{!deliveryNeedsAddress(catalogs, order.fulfillment ?? "Envío") ? order.deliveryAddress : `Enviar a: ${order.deliveryAddress}`}</p>}{order.observations && <span> · {order.observations}</span>}</div></li>)}</ol>}
  </div>;
}
