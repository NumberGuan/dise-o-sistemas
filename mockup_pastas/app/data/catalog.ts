import { SAMPLE_PRODUCTS } from "~/data/sales";
import type { CartItem } from "~/data/guest-cart";

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR").trim();
}

export function getCatalogData(request: Request, favorites: string[] = [], cart: CartItem[] = []) {
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
    favorites,
    cart,
    query,
    availability,
    sort,
    totalProducts: SAMPLE_PRODUCTS.length,
  };
}
