import { Outlet, useLoaderData } from "react-router";
import { requireUserId, getUser } from "~/utils/session.server";
import type { Route } from "./+types/protected";
import { getCatalogs } from "~/data/catalogs.server";
import { InlineCatalogProvider } from "~/components/InlineCatalog";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return { user: publicUser, catalogs: await getCatalogs() };
};

export default function ProtectedLayout() {
  const { user, catalogs } = useLoaderData<typeof loader>();

  return <InlineCatalogProvider catalogs={catalogs} canCreate={user.role === "Administrador"}><Outlet context={{ user }} /></InlineCatalogProvider>;
}
