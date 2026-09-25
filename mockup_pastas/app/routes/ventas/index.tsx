import { Link } from "react-router";

import { SalesPageHeader } from "~/components/SalesLayout";
import { SALES_PAGES } from "~/data/sales";

const PAGE_DETAILS = [
  { title: "Clientes", description: "Consulta y administra los clientes comerciales." },
  { title: "Pedidos", description: "Revisa pedidos de clientes y su preparación." },
  { title: "Comprobantes", description: "Consulta comprobantes asociados a las ventas." },
  { title: "Presupuestos", description: "Accede a los presupuestos preparados para clientes." },
  { title: "Remitos", description: "Consulta las entregas y remitos de venta." },
  { title: "Devoluciones", description: "Revisa devoluciones registradas por clientes." },
  { title: "Recibos", description: "Consulta los recibos de pago de clientes." },
];

export default function Ventas() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader title="Ventas" description="Gestión comercial y seguimiento de operaciones con clientes." />
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Módulos de Ventas">
        {SALES_PAGES.slice(1).map((page, index) => (
          <Link key={page.to} to={page.to} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
            <span className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-900">{page.label}</span>
              <span aria-hidden="true" className="text-lg text-amber-700 transition group-hover:translate-x-1">→</span>
            </span>
            <span className="mt-2 block text-sm leading-6 text-gray-500">{PAGE_DETAILS[index].description}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
