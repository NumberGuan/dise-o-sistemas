import { Link, useLoaderData, redirect, useSearchParams } from "react-router";
import { getUser } from "~/utils/session.server";
import { getSalesData } from "~/data/sales.server";
import { currentSalesDate, monthLabel } from "~/data/billing";
import { ORDER_STATUSES } from "~/data/sales";
import type { Route } from "./+types/home";

const currency = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const statusColors = [
  "var(--color-brand-400)",
  "var(--color-slateblue-500)",
  "var(--color-brand-800)",
  "var(--color-emerald-600)",
  "var(--color-gray-200)",
];
const statusClasses: Record<string, string> = {
  Pendiente: "bg-amber-50 text-amber-800", "En preparación": "bg-gray-100 text-gray-700",
  "Listo para remito": "bg-brand-100 text-brand-800", Facturado: "bg-emerald-50 text-emerald-700", Cancelado: "bg-gray-100 text-gray-500",
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }

  const requestPath = new URL(request.url).pathname;
  const pathname = requestPath === "/_root.data"
    ? "/"
    : requestPath.endsWith("/_.data")
      ? requestPath.replace(/_\.data$/, "")
    : requestPath.endsWith(".data")
      ? requestPath.slice(0, -".data".length)
      : requestPath;

  if (pathname === "/") {
    if (user.role === "Ventas") throw redirect("/ventas");
    if (user.role === "Producción") throw redirect("/produccion");
    if (user.role === "Cliente") throw redirect("/compras/catalogo");
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  const sales = await getSalesData();
  const today = currentSalesDate();
  const months = [...new Set([today.slice(0, 7), ...sales.orders.map(order => order.date.slice(0, 7)), ...sales.invoices.map(invoice => invoice.date.slice(0, 7))])].filter(month => /^\d{4}-\d{2}$/.test(month)).sort().reverse();
  const requested = new URL(request.url).searchParams.get("mes");
  const month = requested && months.includes(requested) ? requested : today.slice(0, 7);
  const previousDate = new Date(`${month}-01T12:00:00Z`);
  previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
  const previous = previousDate.toISOString().slice(0, 7);
  const orders = sales.orders.filter(order => order.date.startsWith(month));
  const active = orders.filter(order => order.status !== "Cancelado");
  const netInvoices = sales.invoices.filter(invoice => invoice.status === "Emitido");
  const billed = (period: string) => netInvoices.filter(invoice => invoice.date.startsWith(period)).reduce((sum, invoice) => sum + (invoice.type === "Nota de Crédito" ? -invoice.total : invoice.total), 0);
  const revenue = billed(month);
  const previousRevenue = billed(previous);
  const days = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const daily = Array.from({ length: days }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    return { day: index + 1, total: netInvoices.filter(invoice => invoice.date === date).reduce((sum, invoice) => sum + (invoice.type === "Nota de Crédito" ? -invoice.total : invoice.total), 0) };
  });
  const products = new Map<string, { name: string; quantity: number }>();
  for (const order of active) for (const item of order.items) {
    const product = products.get(item.productId) ?? { name: item.productName, quantity: 0 };
    product.quantity += item.quantity;
    products.set(item.productId, product);
  }
  return {
    user: publicUser, month, months, revenue, previousRevenue, daily,
    orderCount: active.length,
    orderValue: active.reduce((sum, order) => sum + order.total, 0),
    customerCount: new Set(active.map(order => order.clientId)).size,
    statuses: ORDER_STATUSES.map(status => ({ status, count: orders.filter(order => order.status === status).length })),
    products: [...products.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    recent: [...orders].sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number)).slice(0, 5).map(order => ({ id: order.id, number: order.number, date: order.date, total: order.total, status: order.status, client: sales.clients.find(client => client.id === order.clientId)?.name ?? "Cliente sin identificar" })),
  };
};

function MetricIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    revenue: "M12 3v18m4-14H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7",
    orders: "M8 5H5v16h14V5h-3M8 3h8v4H8V3Zm0 9h8m-8 4h5",
    ticket: "M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm3 5h8m-8 4h8m-8 4h4",
    customers: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

export default function Home() {
  const data = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const { user, revenue, previousRevenue, statuses } = data;
  const totalOrders = statuses.reduce((sum, item) => sum + item.count, 0);
  const pending = statuses.filter(item => ["Pendiente", "En preparación", "Listo para remito"].includes(item.status)).reduce((sum, item) => sum + item.count, 0);
  const maxDaily = Math.max(1, ...data.daily.map(day => Math.abs(day.total)));
  const hasDaily = data.daily.some(day => day.total !== 0);
  let offset = 0;
  const gradient = statuses.map((item, index) => {
    const start = offset;
    offset += totalOrders ? item.count / totalOrders * 100 : 0;
    return `${statusColors[index]} ${start}% ${offset}%`;
  }).join(", ");
  const change = previousRevenue > 0 ? (revenue - previousRevenue) / previousRevenue * 100 : null;
  const canManageSales = user.role === "Administrador" || user.role === "Ventas";
  const cards = [
    { label: "Facturación neta", value: currency(revenue), note: "Comprobantes emitidos menos notas de crédito", icon: "revenue", color: "bg-brand-100 text-brand-700" },
    { label: "Pedidos del mes", value: String(data.orderCount), note: `${pending} pendientes de completar · excluye cancelados`, icon: "orders", color: "bg-brand-50 text-brand-700" },
    { label: "Ticket promedio", value: currency(data.orderCount ? data.orderValue / data.orderCount : 0), note: "Importe promedio por pedido no cancelado", icon: "ticket", color: "bg-gray-100 text-gray-700" },
    { label: "Clientes con pedidos", value: String(data.customerCount), note: "Clientes únicos con pedidos no cancelados", icon: "customers", color: "bg-brand-100 text-brand-800" },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-700">Resumen comercial</p><h1 className="text-2xl font-bold tracking-tight">Panel principal</h1><p className="mt-2 text-sm text-gray-500">Hola, {user.name}. Así se mueven las ventas de tu negocio.</p></div>
        <div className="flex flex-wrap items-end gap-3"><div><label htmlFor="dashboard-month" className="mb-1 block text-xs font-medium text-gray-500">Período de análisis</label><select id="dashboard-month" value={data.month} onChange={event => setSearchParams({ mes: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm capitalize shadow-sm focus:outline-2 focus:outline-amber-500">{data.months.map(month => <option key={month} value={month}>{monthLabel(month)}</option>)}</select></div>{canManageSales && <Link to="/ventas/pedidos" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">Ver pedidos <span aria-hidden="true">↗</span></Link>}</div>
      </header>

      <section aria-label="Resumen del período" className="relative overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-brand-500" />
        <div className="grid lg:grid-cols-[1.7fr_1fr]">
          <div className="bg-gradient-to-br from-brand-50 to-white p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-brand-800">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-500" />
              Facturación de <span className="capitalize">{monthLabel(data.month)}</span>
            </div>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">{currency(revenue)}</p>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              {change === null ? "Sin base de facturación para comparar con el mes anterior." : <><span className="mr-2 inline-flex rounded-md bg-brand-100 px-2 py-0.5 font-semibold text-brand-800">{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>respecto del mes anterior</>}
            </p>
          </div>
          <div className="flex flex-col justify-center border-t border-brand-100 px-6 py-6 lg:border-l lg:border-t-0 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Seguimiento de pedidos</p>
            <div className="mt-3 flex items-baseline gap-3"><p className="text-4xl font-semibold tracking-tight text-brand-800">{pending}</p><p className="text-sm text-gray-600">por completar</p></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand-400" style={{ width: `${totalOrders ? pending / totalOrders * 100 : 0}%` }} /></div>
            <p className="mt-3 text-xs leading-5 text-gray-500">{pending} de {totalOrders} pedidos del período requieren seguimiento.</p>
          </div>
        </div>
      </section>

      <section aria-label="Indicadores de ventas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <article key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand-200"><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-medium text-gray-500">{card.label}</h2><span aria-hidden="true" className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg font-semibold ${card.color}`}><MetricIcon kind={card.icon} /></span></div><p className="mt-3 text-2xl font-bold tracking-tight">{card.value}</p><p className="mt-2 text-xs leading-5 text-gray-500">{card.note}</p></article>)}</section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-semibold">Evolución de la facturación</h2><p className="mt-1 text-xs text-gray-500">Importe neto emitido por día · pesos argentinos</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">Diario</span></div>
          {hasDaily ? <><div className="mt-8 flex h-48 items-end gap-1 border-b border-gray-200" role="img" aria-label={`Facturación diaria de ${monthLabel(data.month)}. Total: ${currency(revenue)}. Las barras pizarra representan saldos negativos por notas de crédito.`}>{data.daily.map(day => <div key={day.day} className="group relative flex h-full min-w-0 flex-1 items-end"><div tabIndex={0} aria-label={`Día ${day.day}: ${currency(day.total)}`} title={`Día ${day.day}: ${currency(day.total)}`} className={`w-full rounded-t transition hover:opacity-70 focus:outline-2 focus:outline-gray-900 ${day.total < 0 ? "bg-gray-500" : "bg-brand-400"}`} style={{ height: `${day.total ? Math.max(3, Math.abs(day.total) / maxDaily * 100) : 1}%` }} /><span aria-hidden="true" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -trangray-x-1/2 whitespace-nowrap rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-md group-hover:block group-focus-within:block">Día {day.day}: {currency(day.total)}</span></div>)}</div><div className="mt-3 flex justify-between text-xs text-gray-400"><span>01</span><span>{Math.ceil(data.daily.length / 2)}</span><span>{data.daily.length}</span></div><p className="mt-4 text-xs text-gray-500">Terracota: importe positivo. Pizarra: saldo diario negativo por notas de crédito. Altura según valor absoluto.</p></> : <div className="mt-6 flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center"><span aria-hidden="true" className="text-3xl text-amber-500">▥</span><p className="mt-3 text-sm font-medium">Todavía no hay facturación en este mes</p><p className="mt-1 px-4 text-xs text-gray-500">Elegí otro período para consultar el historial.</p></div>}
        </section>
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Estado de los pedidos</h2><p className="mt-1 text-xs text-gray-500">Distribución del período seleccionado</p><div className="mx-auto my-6 flex h-36 w-36 items-center justify-center rounded-full" style={{ background: totalOrders ? `conic-gradient(${gradient})` : "var(--color-gray-200)" }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white"><span className="text-3xl font-bold">{totalOrders}</span><span className="text-xs text-gray-500">pedidos</span></div></div><ul className="space-y-3">{statuses.map((item, index) => <li key={item.status} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-gray-600"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: statusColors[index] }} />{item.status}</span><span className="font-semibold">{item.count}</span></li>)}</ul></section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2"><div className="flex items-center justify-between px-6 py-5"><div><h2 className="font-semibold">Últimos pedidos</h2><p className="mt-1 text-xs text-gray-500">Actividad del mes seleccionado</p></div>{canManageSales && <Link to="/ventas/pedidos" className="text-xs font-semibold text-amber-700 hover:underline">Ver todos →</Link>}</div><div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><thead className="border-y border-gray-100 bg-gray-50 text-xs text-gray-500"><tr>{["Pedido / cliente", "Fecha", "Importe", "Estado"].map(label => <th key={label} className="px-6 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{data.recent.map(order => <tr key={order.id} className="hover:bg-gray-50"><td className="px-6 py-4"><p className="font-semibold">{order.number}</p><p className="mt-1 max-w-48 truncate text-xs text-gray-500" title={order.client}>{order.client}</p></td><td className="px-6 py-4 text-gray-500">{order.date.split("-").reverse().join("/")}</td><td className="px-6 py-4 font-medium">{currency(order.total)}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[order.status]}`}>{order.status}</span></td></tr>)}{!data.recent.length && <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay pedidos registrados en este período.</td></tr>}</tbody></table></div></section>
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Productos más pedidos</h2><p className="mt-1 text-xs text-gray-500">Por unidades · excluye pedidos cancelados</p><ol className="mt-6 space-y-5">{data.products.map((product, index) => <li key={product.name}><div className="mb-2 flex items-start justify-between gap-3 text-sm"><span className="flex gap-2"><span className="font-medium text-gray-400">{String(index + 1).padStart(2, "0")}</span><span className="font-medium">{product.name}</span></span><span className="shrink-0 text-xs text-gray-500">{product.quantity} u.</span></div><div className="h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand-400" style={{ width: `${product.quantity / Math.max(1, data.products[0].quantity) * 100}%` }} /></div></li>)}</ol>{!data.products.length && <p className="py-12 text-center text-sm text-gray-500">Sin productos pedidos en este mes.</p>}</section>
      </div>
      <p className="text-xs leading-5 text-gray-400">Los indicadores corresponden al mes seleccionado. La facturación incluye impuestos y descuenta notas de crédito emitidas; el valor de los pedidos y su ticket promedio pueden diferir del importe facturado.</p>
    </div>
  );
}
