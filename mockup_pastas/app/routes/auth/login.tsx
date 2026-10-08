import { Form, Link, useActionData, useSearchParams, useNavigation } from "react-router";
import { createUserSession } from "~/utils/session.server";
import { getUserByEmail, verifyPassword } from "~/utils/db.server";
import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Iniciar Sesión | Fábrica de Pastas" },
  ];
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

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{" "}
            <Link to="/register" className="font-medium text-amber-600 hover:text-amber-500">
              regístrate si no tienes cuenta
            </Link>
          </p>
        </div>
        
        <Form method="post" className="mt-8 space-y-6">
          <input type="hidden" name="redirectTo" value={searchParams.get("redirectTo") ?? undefined} />
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="••••••••"
              />
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
              className="flex w-full justify-center rounded-md border border-transparent bg-amber-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-70"
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
