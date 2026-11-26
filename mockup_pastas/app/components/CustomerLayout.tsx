import { Form, Link, NavLink, useMatch } from "react-router";

import { Logo, ShopMenuIcon } from "~/components/icons";
import type { PublicUser } from "~/utils/db.server";

const customerLinks = [
  { label: "Catálogo", to: "/compras/catalogo", icon: "catalog" },
  { label: "Favoritos", to: "/compras/favoritos", icon: "favorites" },
  { label: "Mis pedidos", to: "/compras/pedidos", icon: "orders" },
  { label: "Carrito", to: "/compras/carrito", icon: "cart" },
  { label: "Mi perfil", to: "/compras/perfil", icon: "profile" },
] as const;

export default function CustomerLayout({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const cartCount = (user.cart ?? []).reduce((total, item) => total + item.quantity, 0);
  const isCatalog = useMatch("/compras/catalogo");

  return (
    <div className={`flex min-h-screen flex-col bg-[#fbf8f3] text-gray-900${isCatalog ? " catalog-store" : ""}`}>
      <a href="#contenido" className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
        Ir al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-[#eadfd3] bg-[#fffdfa]/95 shadow-sm backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-4 xl:px-8">
          <Link to="/compras/catalogo" className="catalog-store-brand col-start-1 row-start-1 flex w-fit items-center gap-2 rounded-lg text-sm font-bold leading-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700">
            <Logo />
            <span>Fábrica de Pastas</span>
          </Link>

          <nav aria-label="Navegación de compras" className="col-span-2 col-start-1 row-start-2 border-t border-[#eadfd3] pt-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:border-0 lg:pt-0">
            <ul className="flex flex-wrap justify-center gap-1">
              {customerLinks.map(({ label, to, icon }) => (
                <li key={to} className="grow lg:grow-0">
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) =>
                      `flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 max-[359px]:gap-1 max-[359px]:px-1 max-[359px]:text-xs sm:px-3 lg:px-2 xl:px-3 ${isActive ? "bg-amber-100 text-amber-950" : "text-gray-700 hover:bg-amber-50 hover:text-gray-950"}`
                    }
                  >
                    <ShopMenuIcon name={icon} />
                    <span>{label}</span>
                    {to === "/compras/carrito" && (
                      <span className="catalog-store-count min-w-5 rounded-full bg-amber-700 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                        {cartCount}
                        <span className="sr-only"> {cartCount === 1 ? "producto" : "productos"}</span>
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-start-2 row-start-1 flex items-center gap-3 lg:col-start-3">
            <span className="catalog-store-user hidden max-w-32 truncate text-sm font-medium text-gray-600 sm:block lg:max-w-24 xl:max-w-32" title={user.name}>
              {user.name}
            </span>
            <Form action="/logout" method="post">
              <button type="submit" className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#e8ddd0] px-3 text-sm font-semibold text-gray-700 transition hover:bg-amber-50 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
                <ShopMenuIcon name="logout" />
                <span>Cerrar sesión</span>
              </button>
            </Form>
          </div>
        </div>
      </header>
      <main id="contenido" className="flex min-w-0 flex-1 p-3 sm:p-5">
        <div className="page-surface min-w-0 flex-1 rounded-2xl border border-[#eadfd3] bg-white shadow-sm">{children}</div>
      </main>
      <footer className="border-t border-[#eadfd3] bg-[#fffdfa] px-4 py-6 text-center text-xs text-gray-500">
        Fábrica de Pastas · Compras
      </footer>
    </div>
  );
}
