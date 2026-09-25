const ORDER_STATS = [
  { label: "Pedidos activos", value: "18", note: "5 para hoy" },
  { label: "Pendientes de facturar", value: "7", note: "$284.500" },
  { label: "En preparación", value: "6", note: "Producción avisada" },
  { label: "Entregas próximas", value: "9", note: "48 hs" },
];

const ORDERS = [
  {
    number: "PC-000148",
    client: "Distribuidora El Sol",
    date: "24/09/2026",
    delivery: "25/09/2026",
    items: "Tallarines 500g, Ravioles verdura",
    total: "$128.400",
    status: "En preparación",
    statusClass: "bg-sky-100 text-sky-700",
  },
  {
    number: "PC-000147",
    client: "Supermercados Andes",
    date: "24/09/2026",
    delivery: "26/09/2026",
    items: "Spaghetti 500g",
    total: "$96.000",
    status: "Pendiente",
    statusClass: "bg-amber-100 text-amber-700",
  },
  {
    number: "PC-000146",
    client: "Almacén Don Pedro",
    date: "23/09/2026",
    delivery: "24/09/2026",
    items: "Ñoquis papa, Sorrentinos jamón y queso",
    total: "$54.800",
    status: "Listo para remito",
    statusClass: "bg-emerald-100 text-emerald-700",
  },
  {
    number: "PC-000145",
    client: "Mini Market Norte",
    date: "23/09/2026",
    delivery: "25/09/2026",
    items: "Fettuccine 500g",
    total: "$32.700",
    status: "Facturado",
    statusClass: "bg-gray-100 text-gray-700",
  },
];

const PRODUCTS = [
  { name: "Tallarines 500g", quantity: "40 cajas", stock: "Disponible" },
  { name: "Ravioles verdura", quantity: "18 cajas", stock: "A producir" },
  { name: "Spaghetti 500g", quantity: "30 cajas", stock: "Disponible" },
];

export default function Pedidos() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Ventas</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Pedidos de Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Alta, seguimiento y preparación de pedidos realizados por clientes mayoristas
            y comercios.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Exportar
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
          >
            Nuevo pedido
          </button>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ORDER_STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-amber-700">{stat.note}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-gray-900">Listado de pedidos</h2>
              <p className="mt-1 text-sm text-gray-500">
                Pedidos registrados ordenados por fecha de ingreso.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                placeholder="Buscar cliente o pedido"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-56"
              />
              <select className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                <option>Todos los estados</option>
                <option>Pendiente</option>
                <option>En preparación</option>
                <option>Listo para remito</option>
                <option>Facturado</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Pedido</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Entrega</th>
                  <th className="px-5 py-3 font-medium">Productos</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ORDERS.map((order) => (
                  <tr key={order.number} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{order.number}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{order.date}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">{order.client}</td>
                    <td className="px-5 py-4 text-gray-600">{order.delivery}</td>
                    <td className="max-w-xs px-5 py-4 text-gray-600">{order.items}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{order.total}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${order.statusClass}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Carga rápida</h2>
            <p className="mt-1 text-sm text-gray-500">
              Boceto del formulario para registrar un nuevo pedido.
            </p>

            <form className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Cliente</span>
                <select className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                  <option>Distribuidora El Sol</option>
                  <option>Supermercados Andes</option>
                  <option>Almacén Don Pedro</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Fecha de entrega</span>
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Observaciones</span>
                <textarea
                  rows={3}
                  placeholder="Condiciones de entrega, descuentos o notas internas"
                  className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>

              <button
                type="button"
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Guardar borrador
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Detalle del pedido seleccionado</h2>
            <p className="mt-1 text-sm text-gray-500">PC-000148 · Distribuidora El Sol</p>

            <div className="mt-4 divide-y divide-gray-100">
              {PRODUCTS.map((product) => (
                <div key={product.name} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{product.quantity}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {product.stock}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Ver detalle
              </button>
              <button
                type="button"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
              >
                Generar remito
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
