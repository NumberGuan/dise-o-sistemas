import { Link, NavLink, Outlet, redirect, useLoaderData } from "react-router";
import { getUser } from "~/utils/session.server";
import { getGuestCart } from "~/data/guest-cart.server";
import { Logo } from "~/components/icons";
import type { Route } from "./+types/tienda-publica";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (user?.role === "Cliente") {
    const url = new URL(request.url);
    throw redirect(`${url.pathname === "/carrito" ? "/compras/carrito" : "/compras/catalogo"}${url.search}`);
  }
  const cart = await getGuestCart(request);
  return { cartCount: cart.reduce((sum, item) => sum + item.quantity, 0) };
}

export default function TiendaPublica() {
  const { cartCount } = useLoaderData<typeof loader>();
  const destination = cartCount ? "/compras/carrito" : "/compras/catalogo";
  const authQuery = new URLSearchParams({ redirectTo: destination }).toString();
  return <div className="min-h-screen bg-[#fbf8f3] text-gray-900">
    <header className="sticky top-0 z-30 border-b border-[#eadfd3] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/catalogo" className="flex items-center gap-3 font-bold"><Logo /><span>Fábrica de Pastas</span></Link>
        <nav aria-label="Tienda pública" className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <NavLink to="/catalogo" className="rounded-lg px-3 py-2 text-amber-900 hover:bg-amber-50">Catálogo</NavLink>
          <NavLink to="/carrito" className="rounded-lg border border-[#e5d9cb] px-3 py-2 hover:bg-amber-50">Carrito ({cartCount})</NavLink>
          <Link to={`/login?${authQuery}`} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-black hover:bg-gray-50">Ingresar</Link>
          <Link to={`/register?${authQuery}`} className="rounded-lg bg-amber-800 px-3 py-2 text-white hover:bg-amber-900">Crear cuenta</Link>
        </nav>
      </div>
    </header>
    <main><Outlet /></main>
    <footer className="mt-8 border-t border-[#eadfd3] px-4 py-6 text-center text-xs text-gray-600">Fábrica de Pastas · Catálogo público</footer>
  </div>;
}
