import { useLoaderData } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import { SAMPLE_CLIENTS, SAMPLE_ORDERS } from "~/data/sales";
import type { Route } from "./+types/cliente-pedidos";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  
  // Try to find if this user exists as a Client in our mockup DB
  const client = SAMPLE_CLIENTS.find(c => c.email === user.email);
  
  let userOrders = [];
  if (client) {
    userOrders = SAMPLE_ORDERS.filter(o => o.clientId === client.id);
  }

  return { orders: userOrders };
};

export default function ClientePedidos() {
  const { orders } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta el historial y estado de tus compras anteriores.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center rounded-lg border-2 border-dashed border-gray-300 p-12 bg-white">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No tienes pedidos</h3>
          <p className="mt-1 text-sm text-gray-500">Aún no has realizado ninguna compra con esta cuenta.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Pedido <span className="font-semibold">{order.number}</span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Fecha: {new Date(order.date + 'T00:00:00').toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-1">
                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    order.status === 'Pendiente' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                    order.status === 'En preparación' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                    order.status === 'Facturado' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                    order.status === 'Cancelado' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-sm font-semibold text-gray-900">
                    Total: {order.total.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Productos</h4>
                <ul className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-2 flex justify-between">
                      <div className="flex gap-4 text-sm text-gray-700">
                        <span className="font-medium">{item.quantity}x</span>
                        <span>{item.productName}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {item.subtotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
