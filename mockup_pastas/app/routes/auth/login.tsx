import { Form, Link, useActionData, useSearchParams, useNavigation } from "react-router";
import { createUserSession } from "~/utils/session.server";
import { getUserByEmail, verifyPassword } from "~/utils/db.server";
import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Iniciar Sesión | Fábrica de Pastas" },
  ];
};

import { getUser } from "~/utils/session.server";
import { redirect } from "react-router";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request);
  if (user) {
    return redirect("/");
  }
  return null;
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo") || "/";

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Formulario inválido" };
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Credenciales incorrectas" };
  }

  return createUserSession(user.id, redirectTo as string);
};

import AuthLayout from "~/components/AuthLayout";

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <AuthLayout
      title="Acceso a Estación de Trabajo"
      subtitle="Ingrese sus credenciales registradas o su legajo de operario."
    >
      <Form method="post" className="space-y-6">
        <input type="hidden" name="redirectTo" value={searchParams.get("redirectTo") ?? undefined} />
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo corporativo o N° de Legajo
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="op.maccaroni@fabricadepastas.com"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <a href="#" className="text-xs font-medium text-amber-600 hover:text-amber-500">
                ¿Olvidaste tu contraseña?
              </a>
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
          
          <div className="flex items-center gap-2 mt-4 text-sm">
            <input type="checkbox" id="remember" className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" defaultChecked />
            <label htmlFor="remember" className="text-gray-700">Recordar este terminal seguro</label>
            <span className="ml-auto text-xs text-emerald-600 font-medium">TLS 1.3</span>
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
