import { Link, useFetchers, useLoaderData } from "react-router";
import CustomerCartLine from "~/components/CustomerCartLine";
import { getGuestCart, updateGuestCart } from "~/data/guest-cart.server";
import { SAMPLE_PRODUCTS } from "~/data/sales";
import type { Route } from "./+types/carrito-publico";

const currency = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

export async function loader({ request }: Route.LoaderArgs) {
  const cart = (await getGuestCart(request)).map(item => {
    const product = SAMPLE_PRODUCTS.find(product => product.id === item.productId)!;
    return { ...item, product, subtotal: product.price * item.quantity };
  });
  return { cart, total: cart.reduce((sum, item) => sum + item.subtotal, 0) };
}

export async function action({ request }: Route.ActionArgs) {
  return updateGuestCart(request);
}

export default function CarritoPublico() {
  const { cart, total } = useLoaderData<typeof loader>();
  const fetchers = useFetchers();
  const busy = fetchers.some(fetcher => fetcher.state !== "idle");
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-semibold">Mi carrito</h1>
    <p className="mt-2 text-sm text-gray-600">Podés agregar productos y ajustar las cantidades. Para confirmar el pedido necesitás una cuenta.</p>
    {cart.length ? <>
      <ul className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-[#eadfd3] bg-white">{cart.map(item => <CustomerCartLine key={item.productId} item={item} disabled={busy} />)}</ul>
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#eadfd3] bg-white p-5"><span className="font-semibold">Total de productos</span><strong className="text-2xl">{currency(total)}</strong></div>
      <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">Continuá con tu cuenta</h2>
        <p className="mt-2 text-sm text-amber-900">Conservaremos estos productos al ingresar o registrarte. Después podrás completar la dirección y confirmar el pedido.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/register?redirectTo=%2Fcompras%2Fcarrito" className="inline-flex min-h-11 items-center rounded-xl bg-amber-800 px-5 text-sm font-semibold text-white hover:bg-amber-900">Registrarme para comprar</Link>
          <Link to="/login?redirectTo=%2Fcompras%2Fcarrito" className="inline-flex min-h-11 items-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-black hover:bg-gray-50">Ya tengo cuenta</Link>
        </div>
      </section>
    </> : <section className="mt-6 rounded-2xl border border-dashed border-[#dfd0c0] bg-white p-10 text-center"><h2 className="font-semibold">Tu carrito está vacío</h2><p className="mt-2 text-sm text-gray-600">Explorá el catálogo y elegí tus productos.</p></section>}
    <Link to="/catalogo" className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-900 hover:bg-amber-50">Seguir explorando el catálogo</Link>
  </div>;
}
