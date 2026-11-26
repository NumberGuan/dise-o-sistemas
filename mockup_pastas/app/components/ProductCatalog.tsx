import { Form, useFetchers, useNavigation } from "react-router";
import type { getCatalogData } from "~/data/catalog";
import CustomerProductCard from "~/components/CustomerProductCard";
import ShopPageHero from "~/components/ShopPageHero";

export default function ProductCatalog({ products, favorites, cart, query, availability, category, sort, totalProducts, publicMode = false }: ReturnType<typeof getCatalogData> & { publicMode?: boolean }) {
  const catalogPath = publicMode ? "/catalogo" : "/compras/catalogo";
  const navigation = useNavigation();
  const fetchers = useFetchers();
  const cartDisabled = publicMode && fetchers.some(fetcher => fetcher.state !== "idle");

  return (
    <div className="shop-catalog mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ShopPageHero
        title="Catálogo de productos"
        art="catalogo"
        description={publicMode ? "Explorá nuestros productos y armá tu carrito. Para confirmar el pedido, ingresá o creá una cuenta." : "Consultá el catálogo actual, guardá tus favoritos y armá tu carrito."}
      />

      <section aria-labelledby="products-heading" className="mt-8">
        <div className="catalog-controls rounded-2xl border p-4 sm:p-5">
          <Form action={catalogPath} method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
            <div className="catalog-field catalog-search flex min-h-11 flex-1 items-center gap-2 px-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 shrink-0" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
              <label htmlFor="catalog-search" className="sr-only">Buscar productos</label>
              <input key={query} id="catalog-search" type="search" name="q" defaultValue={query} maxLength={100} placeholder="Buscar productos del catálogo" className="min-w-0 flex-1 self-stretch border-0 bg-transparent text-sm outline-none" />
            </div>
            <input type="hidden" name="availability" value={availability} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="category" value={category} />
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="shop-primary min-h-11 flex-1 px-5 text-sm font-semibold sm:flex-none">Buscar</button>
              {query && <a href={`${catalogPath}?${new URLSearchParams({ availability, category, sort }).toString()}`} className="shop-secondary inline-flex min-h-11 items-center px-4 text-sm font-semibold">Limpiar búsqueda</a>}
            </div>
          </Form>
          <form method="get" className="catalog-filters mt-4 grid grid-cols-1 items-end gap-3 border-t pt-4 sm:grid-cols-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
            {query && <input type="hidden" name="q" value={query} />}
            <div>
              <label htmlFor="catalog-category" className="mb-1.5 block text-xs font-semibold">Categoría</label>
              <select key={category} id="catalog-category" name="category" defaultValue={category} className="catalog-field min-h-11 w-full px-3 text-sm">
                <option value="all">Todos los productos</option>
                <option value="Pastas">Pastas</option>
                <option value="Salsas">Salsas</option>
              </select>
            </div>
            <div>
              <label htmlFor="catalog-availability" className="mb-1.5 block text-xs font-semibold">Disponibilidad</label>
              <select id="catalog-availability" name="availability" key={availability} defaultValue={availability} className="catalog-field min-h-11 w-full px-3 text-sm">
                <option value="all">Todos los estados</option>
                <option value="available">Solo disponibles</option>
              </select>
            </div>
            <div>
              <label htmlFor="catalog-sort" className="mb-1.5 block text-xs font-semibold">Ordenar por</label>
              <select id="catalog-sort" name="sort" key={sort} defaultValue={sort} className="catalog-field min-h-11 w-full px-3 text-sm">
                <option value="default">Orden original</option>
                <option value="name">Nombre</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
              </select>
            </div>
            <button type="submit" className="shop-secondary min-h-11 px-5 text-sm font-semibold sm:col-span-3 lg:col-span-1">Aplicar filtros</button>
          </form>
        </div>

        <div className="mt-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="products-heading" className="catalog-products-title">Productos</h2>
            <p className="catalog-muted text-sm">{products.length} de {totalProducts} {totalProducts === 1 ? "producto" : "productos"} en el catálogo</p>
          </div>
          <p className="catalog-muted mt-1 max-w-2xl text-xs leading-5">Los productos, precios y estados visibles provienen del catálogo de muestra del proyecto; todavía no hay una fuente comercial o de stock en tiempo real.</p>
        </div>

        {navigation.state === "loading" && <p role="status" className="catalog-muted mt-5 text-sm">Actualizando catálogo…</p>}
        {products.length === 0 ? (
          <div className="catalog-empty mt-5 rounded-2xl border border-dashed px-6 py-14 text-center">
            <p className="font-semibold">No encontramos productos con esos filtros.</p>
            <p className="catalog-muted mt-2 text-sm">Probá otra búsqueda o volvé a mostrar todos los productos.</p>
            <a href={catalogPath} className="shop-primary mt-5 inline-flex min-h-11 items-center px-4 text-sm font-semibold">Ver catálogo completo</a>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <CustomerProductCard
                key={product.id}
                product={product}
                allowFavorites={!publicMode}
                cartDisabled={cartDisabled}
                isFavorite={favorites.includes(product.id)}
                cartQuantity={cart.find((item) => item.productId === product.id)?.quantity ?? 0}
                action={catalogPath}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
