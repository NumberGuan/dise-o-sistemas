import { useLoaderData, useNavigation } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import { SAMPLE_PRODUCTS } from "~/data/sales";
import { updateCustomerProductData } from "~/data/customer.server";
import CustomerProductCard from "~/components/CustomerProductCard";
export { default as ErrorBoundary } from "~/components/CustomerErrorBoundary";
import type { Route } from "./+types/cliente-catalogo";

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR").trim();
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").slice(0, 100);
  const availability = url.searchParams.get("availability") === "available" ? "available" : "all";
  const requestedSort = url.searchParams.get("sort") ?? "";
  const sort = ["name", "price-asc", "price-desc"].includes(requestedSort) ? requestedSort : "default";
  const normalizedQuery = normalizeSearch(query);
  const products = SAMPLE_PRODUCTS.filter((product) => {
    const matchesQuery = !normalizedQuery || normalizeSearch(product.name).includes(normalizedQuery);
    const matchesAvailability = availability !== "available" || product.stock === "Disponible";
    return matchesQuery && matchesAvailability;
  });

  if (sort === "name") products.sort((a, b) => a.name.localeCompare(b.name, "es-AR"));
  if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") products.sort((a, b) => b.price - a.price);

  return {
    products,
    favorites: user.favorites ?? [],
    cart: user.cart ?? [],
    query,
    availability,
    sort,
    totalProducts: SAMPLE_PRODUCTS.length,
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  return updateCustomerProductData(user, await request.formData());
};

export default function ClienteCatalogo() {
  const { products, favorites, cart, query, availability, sort, totalProducts } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-3xl border border-[#eadfd3] bg-[#f1e4d6] shadow-sm" aria-labelledby="catalog-title">
        <img src="/hero-pastas.jpg" alt="Pastas variadas" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fffaf4] via-[#fffaf4]/95 to-[#fffaf4]/50 sm:via-[#fffaf4]/90" />
        <div className="max-w-2xl px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <span className="inline-flex rounded-full border border-amber-800/15 bg-white/75 px-3 py-1 text-xs font-semibold tracking-wide text-amber-900">Fábrica de Pastas</span>
          <h1 id="catalog-title" className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-4xl">Catálogo de productos</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-gray-700 sm:text-base">Consultá el catálogo actual, guardá tus favoritos y armá tu carrito.</p>
        </div>
      </section>

      <section aria-labelledby="products-heading" className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="products-heading" className="text-xl font-semibold tracking-tight text-gray-900">Productos</h2>
            <p className="mt-1 text-sm text-gray-600">{products.length} de {totalProducts} {totalProducts === 1 ? "producto" : "productos"} en el catálogo</p>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-gray-500">Los productos, precios y estados visibles provienen del catálogo de muestra del proyecto; todavía no hay una fuente comercial o de stock en tiempo real.</p>
          </div>
          <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {query && <input type="hidden" name="q" value={query} />}
            <div>
              <label htmlFor="catalog-availability" className="mb-1 block text-xs font-medium text-gray-600">Disponibilidad</label>
              <select id="catalog-availability" name="availability" defaultValue={availability} className="min-h-10 w-full rounded-xl border border-[#e5d9cb] bg-white px-3 text-sm text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-700">
                <option value="all">Todos los estados</option>
                <option value="available">Solo disponibles</option>
              </select>
            </div>
            <div>
              <label htmlFor="catalog-sort" className="mb-1 block text-xs font-medium text-gray-600">Ordenar por</label>
              <select id="catalog-sort" name="sort" defaultValue={sort} className="min-h-10 w-full rounded-xl border border-[#e5d9cb] bg-white px-3 text-sm text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-700">
                <option value="default">Orden original</option>
                <option value="name">Nombre</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
              </select>
            </div>
            <button type="submit" className="min-h-10 rounded-xl border border-[#e5d9cb] bg-white px-4 text-sm font-semibold text-gray-800 transition hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 sm:col-span-2">Aplicar filtros</button>
          </form>
        </div>

        {navigation.state === "loading" && <p role="status" className="mt-5 text-sm text-gray-600">Actualizando catálogo…</p>}
        {products.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#dfd0c0] bg-white px-6 py-14 text-center">
            <p className="font-semibold text-gray-900">No encontramos productos con esos filtros.</p>
            <p className="mt-2 text-sm text-gray-600">Probá otra búsqueda o volvé a mostrar todos los productos.</p>
            <a href="/compras/catalogo" className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-amber-800 px-4 text-sm font-semibold text-white hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800">Ver catálogo completo</a>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <CustomerProductCard
                key={product.id}
                product={product}
                isFavorite={favorites.includes(product.id)}
                cartQuantity={cart.find((item) => item.productId === product.id)?.quantity ?? 0}
                action="/compras/catalogo"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
