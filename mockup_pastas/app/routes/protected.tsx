import { Outlet, useLoaderData } from "react-router";
import { requireUser } from "~/utils/session.server";
import type { Route } from "./+types/protected";
import { getCatalogsForRole } from "~/data/catalogs.server";
import { InlineCatalogProvider } from "~/components/InlineCatalog";
import { CATALOG_DEFINITIONS, canCreateCatalog } from "~/data/catalogs";
import { getInternalData } from "~/data/internal.server";
import { InternalDataProvider } from "~/components/InternalDataProvider";
import { requireSession } from "~/utils/access.server";
import { getPurchaseData } from "~/data/purchase-registration.server";

export const middleware = [requireSession];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUser(request);
  const publicUser = { name: user.name, role: user.role, cart: user.role === "Cliente" ? user.cart : undefined };
  return { user: publicUser, catalogs: await getCatalogsForRole(user.role), internalData: getInternalData(user.role, user.role === "Administrador" ? await getPurchaseData() : undefined) };
};

export default function ProtectedLayout() {
  const { user, catalogs, internalData } = useLoaderData<typeof loader>();

  const creatableCatalogs = CATALOG_DEFINITIONS.filter(item => canCreateCatalog(user.role, item.key)).map(item => item.key);
  return <InternalDataProvider key={user.role} initial={internalData}>
    <InlineCatalogProvider catalogs={catalogs} canCreate={creatableCatalogs.length > 0} creatableCatalogs={creatableCatalogs}><Outlet context={{ user }} /></InlineCatalogProvider>
  </InternalDataProvider>;
}
