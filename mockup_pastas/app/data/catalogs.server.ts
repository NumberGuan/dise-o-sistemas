import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { CATALOG_DEFINITIONS, catalogDefinition, initialCatalogs, type Catalogs, type CatalogEntry } from "./catalogs";

const filePath = path.join(process.cwd(), "data", "catalogs.json");
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const next = queue.then(operation, operation);
  queue = next.catch(() => undefined);
  return next;
}

async function readCatalogs(): Promise<Catalogs> {
  try {
    const saved: unknown = JSON.parse(await fs.readFile(filePath, "utf8"));
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Formato inválido");
    const result = initialCatalogs();
    for (const { key } of CATALOG_DEFINITIONS) {
      if (!(key in saved)) continue;
      const rows: unknown = Reflect.get(saved, key);
      if (!Array.isArray(rows) || rows.some(row => !row || typeof row.id !== "string" || typeof row.name !== "string" || typeof row.value !== "string" || typeof row.description !== "string" || typeof row.active !== "boolean")) throw new Error("Formato inválido");
      result[key] = rows;
    }
    return result;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return initialCatalogs();
    throw new Error("No se pudieron leer los catálogos. El archivo existente se conservó.");
  }
}

export const getCatalogs = () => serialized(readCatalogs);
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("es-AR");

export async function saveCatalogEntry(key: string, form: FormData) {
  const definition = catalogDefinition(key);
  if (!definition) throw new Error("El catálogo solicitado no existe.");
  return serialized(async () => {
    const catalogs = await readCatalogs();
    const rows = catalogs[definition.key];
    const id = form.get("id");
    if (id !== null && (typeof id !== "string" || id.length > 120)) throw new Error("El identificador no es válido.");
    const previous = rows.find(item => item.id === id);
    if (id && !previous) throw new Error("El registro ya no existe.");
    const name = form.get("name");
    const description = form.get("description") ?? "";
    const active = form.get("active");
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100 || typeof description !== "string" || description.length > 500 || (active !== "true" && active !== "false")) throw new Error("Completá un nombre de hasta 100 caracteres y una descripción de hasta 500.");
    const parentId = "parent" in definition ? form.get("parentId") : undefined;
    if ("parent" in definition && (typeof parentId !== "string" || !catalogs[definition.parent].some(item => item.id === parentId && (item.active || previous?.parentId === parentId && active === "false")))) throw new Error("Seleccioná un registro superior activo.");
    if (previous && previous.parentId !== parentId) throw new Error("La relación del registro no se puede cambiar. Creá uno nuevo para otra ubicación.");
    if (rows.some(item => item.id !== id && item.parentId === parentId && (normalize(item.name) === normalize(name) || normalize(item.value) === normalize(name)))) throw new Error("Ya existe un registro con ese nombre, incluso si está inactivo.");
    const behavior = definition.key === "modalidades-entrega" ? form.get("behavior") : undefined;
    if (definition.key === "modalidades-entrega" && behavior !== "pickup" && behavior !== "shipping") throw new Error("Indicá si la modalidad requiere una dirección de envío.");
    if (previous?.behavior && behavior !== previous.behavior) throw new Error("El comportamiento de una modalidad existente no se puede cambiar.");
    if (active === "false") {
      if (!rows.some(item => item.id !== id && item.active)) throw new Error("Debe quedar al menos un registro activo en el catálogo.");
      const child = CATALOG_DEFINITIONS.find(item => "parent" in item && item.parent === key);
      if (child && catalogs[child.key].some(item => item.parentId === id && item.active)) throw new Error("Primero desactivá los registros que dependen de este registro.");
    }
    const nextId = String(Math.max(0, ...rows.map(item => /^\d+$/.test(item.id) ? Number(item.id) : 0)) + 1);
    const entry: CatalogEntry = {
      id: previous?.id ?? nextId, value: previous?.value ?? name.trim().replace(/\s+/g, " "),
      name: name.trim().replace(/\s+/g, " "), description: description.trim(), active: active === "true",
      ...(typeof parentId === "string" ? { parentId } : {}),
      ...(behavior === "pickup" || behavior === "shipping" ? { behavior } : {}),
    };
    if (previous) rows[rows.indexOf(previous)] = entry;
    else rows.push(entry);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(catalogs, null, 2), { encoding: "utf8", flag: "wx" });
      await fs.rename(temporary, filePath);
    } catch (error) {
      await fs.rm(temporary, { force: true }).catch(() => undefined);
      throw error;
    }
    return entry;
  });
}
