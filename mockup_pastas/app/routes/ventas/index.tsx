import { Link } from "react-router";

import { SalesPageHeader } from "~/components/SalesLayout";
import { SALES_PAGES } from "~/data/sales";

const PAGE_DETAILS: Record<string, string> = {
  "Clientes": "Consulta y administra los clientes comerciales.",
  "Pedidos": "Revisa pedidos de clientes y su preparación.",
  "Comprobantes": "Consulta comprobantes asociados a las ventas.",
  "Presupuestos": "Accede a los presupuestos preparados para clientes.",
  "Remitos": "Consulta las entregas y remitos de venta.",
  "Devoluciones": "Revisa devoluciones registradas por clientes.",
  "Recibos": "Consulta los recibos de pago de clientes.",};

export default function Ventas() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader title="Ventas" description="Gestión comercial y seguimiento de operaciones con clientes." />
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Módulos de Ventas">
        {SALES_PAGES.slice(1).map((page) => (
          <Link key={page.to} to={page.to} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
            <span className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-900">{page.label}</span>
              <span aria-hidden="true" className="text-lg text-amber-700 transition group-hover:translate-x-1">→</span>
            </span>
            <span className="mt-2 block text-sm leading-6 text-gray-500">{PAGE_DETAILS[page.label]}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

