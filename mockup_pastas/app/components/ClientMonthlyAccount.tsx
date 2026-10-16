import { Link } from "react-router";
import { currentSalesMonth, getClientMonthlyAccount, monthLabel, money } from "~/data/billing";

const currency = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

export default function ClientMonthlyAccount({ months, clientId }: { months: ReturnType<typeof getClientMonthlyAccount>; clientId?: string }) {
  const current = currentSalesMonth();
  return <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50/40 p-4" aria-label="Cuenta mensual">
    <h3 className="font-semibold text-gray-900">Cuenta mensual</h3>
    <p className="mt-1 text-sm text-gray-700">Saldo total: <strong>{currency(money(months.reduce((sum, month) => sum + month.balance, 0)))}</strong></p>
    <p className="mt-2 text-xs text-gray-600">Los pedidos se agrupan por el mes en que se realizaron y se pueden pagar juntos a partir del mes siguiente. Los pedidos cancelados no suman saldo.</p>
    {!months.length && <p className="mt-3 text-sm text-gray-500">Todavía no hay pedidos en la cuenta.</p>}
    <ul className="mt-3 space-y-3">{months.map(month => <li key={month.month} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><strong className="capitalize">{monthLabel(month.month)}</strong><span>{month.balance === 0 ? "Pagado" : month.month === current ? "En curso" : "Pendiente de pago"}</span></div>
      <p className="mt-1 text-gray-600">{month.orderCount} pedidos · Total: {currency(month.total)} · Pagado: {currency(month.paid)}</p>
      <p className="mt-1 font-semibold">Saldo: {currency(month.balance)}</p>
      <p className="mt-1 text-xs text-gray-500">Se puede pagar desde {monthLabel(month.payableFrom)}.</p>
      {month.unbilled > 0 && <p className="mt-2 text-xs text-amber-900">{month.unbilled} pedidos pendientes de facturar. Su importe es estimado con el descuento del 15% e IVA; se confirma al emitir las facturas.</p>}
      {clientId && month.unbilled > 0 && <Link className="mt-2 inline-block font-semibold text-amber-800 underline" to="/ventas/comprobantes">Facturar pedidos pendientes</Link>}
      {clientId && month.month < current && month.balance > 0 && month.unbilled === 0 && <Link className="mt-3 inline-block font-semibold text-amber-800 underline" to={`/ventas/recibos?cliente=${encodeURIComponent(clientId)}&mes=${month.month}`}>Pagar todo el mes</Link>}
    </li>)}</ul>
  </section>;
}
