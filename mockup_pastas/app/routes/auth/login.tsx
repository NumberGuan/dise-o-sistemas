import { Form, useActionData, useSearchParams, useNavigation, redirect } from "react-router";
import { createUserSession } from "~/utils/session.server";
import { getUserByEmail, verifyPassword } from "~/utils/db.server";
import type { Route } from "./+types/login";
import { getUser } from "~/utils/session.server";
import { localRedirect } from "~/utils/redirect";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Iniciar Sesión | Fábrica de Pastas" },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request);
  if (user) {
    return redirect("/");
  }
  return null;
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const emailInput = formData.get("email");
  const password = formData.get("password");
  const requestedRedirect = formData.get("redirectTo");
  const redirectTo = localRedirect(requestedRedirect);

  if (typeof emailInput !== "string" || typeof password !== "string") {
    return { error: "Ingresá tu correo electrónico y contraseña." };
  }

  const email = emailInput.trim().toLocaleLowerCase("en-US");
  if (!email || email.length > 254 || password.length > 128) {
    return { error: "El correo o la contraseña no son válidos." };
  }

  let user;
  try {
    user = await getUserByEmail(email);
  } catch {
    return { error: "No pudimos consultar las cuentas ahora. Intentá nuevamente más tarde." };
  }
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Credenciales incorrectas" };
  }

  try {
    return await createUserSession(user.id, redirectTo, request);
  } catch {
    return { error: "No pudimos recuperar tu carrito. Intentá ingresar nuevamente." };
  }
};

import AuthLayout from "~/components/AuthLayout";

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Ingresá para comprar, guardar favoritos y consultar tus pedidos."
    >
      <Form method="post" className="space-y-6">
        <input type="hidden" name="redirectTo" value={searchParams.get("redirectTo") ?? undefined} />
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="nombre@correo.com"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
            </div>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>
          
        </div>

        {actionData?.error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{actionData.error}</div>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-md border border-transparent bg-amber-700 py-3 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar al Sistema"}
          </button>
        </div>
      </Form>
    </AuthLayout>
  );
}
