import AuthPasswordField from "~/components/AuthPasswordField";
import { Form, Link, useActionData, useNavigation, useSearchParams } from "react-router";
import { localRedirect } from "~/utils/redirect";
import crypto from "node:crypto";
import { createUserSession } from "~/utils/session.server";
import { getUserByEmail, saveUser, hashPassword } from "~/utils/db.server";
import type { Route } from "./+types/register";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Registro | Fábrica de Pastas" },
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
  const nameInput = formData.get("name");
  const emailInput = formData.get("email");
  const password = formData.get("password");

  if (typeof nameInput !== "string" || typeof emailInput !== "string" || typeof password !== "string") {
    return { error: "Revisá el nombre, el correo y la contraseña." };
  }

  const name = nameInput.trim();
  const email = emailInput.trim().toLocaleLowerCase("en-US");
  if (name.length < 2 || name.length > 100) return { error: "El nombre debe tener entre 2 y 100 caracteres." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: "Ingresá un correo electrónico válido." };
  if (password.length < 6 || password.length > 128) return { error: "La contraseña debe tener entre 6 y 128 caracteres." };

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) return { error: "El correo electrónico ya está registrado." };
  } catch {
    return { error: "No pudimos consultar las cuentas ahora. Intentá nuevamente más tarde." };
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password),
    role: "Cliente" as const,
  };

  try {
    await saveUser(user);
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      return { error: "El correo electrónico ya está registrado." };
    }
    return { error: "No pudimos guardar tu cuenta. Intentá nuevamente más tarde." };
  }

  try {
    return await createUserSession(user.id, localRedirect(formData.get("redirectTo")), request);
  } catch {
    return { error: "Tu cuenta fue creada. Ingresá desde Iniciar sesión para recuperar el carrito y continuar." };
  }
};

import AuthLayout from "~/components/AuthLayout";

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [params] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  return (
    <AuthLayout
      title="Crear cuenta de cliente"
      subtitle="Creá tu cuenta para confirmar pedidos y guardar favoritos."
    >
      <Form noValidate method="post" className="space-y-6">
        <input type="hidden" name="redirectTo" value={params.get("redirectTo") ?? ""} />
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="name"
                name="name"
                type="text"
                required
              minLength={2}
              maxLength={100}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                autoComplete="name"
                placeholder="Juan Pérez"
              />
            </div>
          </div>
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña (mínimo 6 caracteres)
            </label>
            <AuthPasswordField newPassword invalid={Boolean(actionData?.error)} />
          </div>
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Las cuentas creadas desde este formulario tienen acceso de Cliente.</p>
        </div>

        {actionData?.error && (
          <div id="auth-error" role="alert" className="rounded-md bg-red-50 p-4 mt-4">
            <div className="text-sm text-red-700">{actionData.error}</div>
          </div>
        )}

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-md border border-transparent bg-amber-700 py-3 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </div>
      </Form>
    </AuthLayout>
  );
}
