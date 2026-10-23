import { data } from "react-router";
import { saveCatalogEntry } from "~/data/catalogs.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/catalogos-crear";

export const action = async ({ request, params }: Route.ActionArgs) => {
  await requireUserAndRole(request, ["Administrador"]);
  try {
    const form = await request.formData();
    if (form.get("intent") !== "create" || form.has("id")) {
      return data({ error: "La acción solicitada no está disponible." }, { status: 400 });
    }
    form.set("active", "true");
    const entry = await saveCatalogEntry(params.catalogo, form);
    return data({ entry }, { status: 201 });
  } catch (error) {
    return data({ error: error instanceof Error ? error.message : "No se pudo guardar el registro." }, { status: 400 });
  }
};
