import { useLoaderData } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import { getCatalogData } from "~/data/catalog";
import { updateCustomerProductData } from "~/data/customer.server";
import ProductCatalog from "~/components/ProductCatalog";
import type { Route } from "./+types/cliente-catalogo";
export { default as ErrorBoundary } from "~/components/CustomerErrorBoundary";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  return getCatalogData(request, user.favorites ?? [], user.cart ?? []);
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  return updateCustomerProductData(user, await request.formData());
};

export default function ClienteCatalogo() {
  return <ProductCatalog {...useLoaderData<typeof loader>()} />;
}
