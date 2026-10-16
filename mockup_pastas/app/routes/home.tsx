
const CENTER_CARDS = [
  {
    label: "Ventas del día",
    value: "$45.320",
    note: "+12% vs ayer",
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Pedidos Clientes",
    value: "32",
    note: "5 pendientes de entrega",
    accent: "bg-sky-100 text-sky-700",
  },
  {
    label: "Órdenes de producción",
    value: "12",
    note: "3 en proceso",
    accent: "bg-violet-100 text-violet-700",
  },
  {
    label: "Productos activos",
    value: "45",
    note: "En 6 líneas de pasta",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    label: "Máquinas",
    value: "8",
    note: "2 en mantenimiento",
    accent: "bg-orange-100 text-orange-700",
  },
  {
    label: "Proveedores",
    value: "17",
    note: "4 con deuda pendiente",
    accent: "bg-rose-100 text-rose-700",
  },
];

const RECENT_ORDERS = [
  { client: "Distribuidora El Sol", product: "Tallarines 500g", quantity: "120 cajas" },
  { client: "Supermercados Andes", product: "Spaghetti 500g", quantity: "80 cajas" },
  { client: "Almacén Don Pedro", product: "Fideos Cabello 400g", quantity: "45 cajas" },
  { client: "Mini Market Norte", product: "Fettuccine 500g", quantity: "30 cajas" },
  { client: "Comercio La Casa", product: "Tallarines 500g", quantity: "60 cajas" },
];

import { Link, useLoaderData, redirect } from "react-router";
import { getUser } from "~/utils/session.server";
import type { Route } from "./+types/home";

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
  return { user: publicUser };
};

export default function Home() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel principal</h1>
          <p className="mt-1 text-sm text-gray-500">
            Bienvenido {user.name} ({user.role}). Resumen de la operación de la fábrica de pastas.
          </p>
        </div>
        <Link
          to="/ventas/pedidos"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          Nuevo pedido
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CENTER_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${card.accent}`}
              >
                {card.note}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Últimos pedidos de clientes</h2>
          <Link to="/ventas/pedidos" className="text-sm font-medium text-amber-700 hover:text-amber-800">
            Ver todos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="px-5 py-3 font-medium">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RECENT_ORDERS.map((order) => (
                <tr key={order.client} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{order.client}</td>
                  <td className="px-5 py-3 text-gray-600">{order.product}</td>
                  <td className="px-5 py-3 text-gray-600">{order.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
