import { useLoaderData } from "react-router";
import ProductCatalog from "~/components/ProductCatalog";
import { getCatalogData } from "~/data/catalog";
import { getGuestCart, updateGuestCart } from "~/data/guest-cart.server";
import type { Route } from "./+types/catalogo-publico";

export async function loader({ request }: Route.LoaderArgs) {
  return getCatalogData(request, [], await getGuestCart(request));
}

export async function action({ request }: Route.ActionArgs) {
  return updateGuestCart(request);
}

export default function CatalogoPublico() {
  return <ProductCatalog {...useLoaderData<typeof loader>()} publicMode />;
}
