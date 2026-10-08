import { Outlet, useLoaderData } from "react-router";
import { requireUserId, getUser } from "~/utils/session.server";
import type { Route } from "./+types/protected";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return { user };
};

export default function ProtectedLayout() {
  const { user } = useLoaderData<typeof loader>();

  return <Outlet context={{ user }} />;
}
