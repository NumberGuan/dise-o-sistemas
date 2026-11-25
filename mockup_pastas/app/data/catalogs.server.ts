import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { CATALOG_DEFINITIONS, catalogDefinition, type Catalogs, type CatalogEntry } from "./catalogs";

import { PROVINCIAS, LOCALIDADES, CALLES } from "./domicilios";
import { UNIDADES, TIPOS_PRODUCTO, SUBTIPOS_PRODUCTO, TIPOS_MATERIA_PRIMA, MARCAS } from "./produccion";
import { MATERIAS_PRIMAS_PRODUCCION } from "./produccion-fixtures.server";
import type { Role } from "~/utils/db.server";

const entry = (id: string, name: string, extra: Partial<CatalogEntry> = {}): CatalogEntry => ({ id, value: name, name, description: "", active: true, ...extra });
const names = (values: readonly string[]) => values.map((name, index) => entry(String(index + 1), name));

export function initialCatalogs(): Catalogs {
  return {
    "tipos-cliente": names(["Comercio", "Distribuidor", "Particular"]),
    "modalidades-entrega": [entry("1", "Retiro en local", { behavior: "pickup" }), entry("2", "Envío", { behavior: "shipping" })],
    "medios-pago": names(["Efectivo", "Transferencia", "Cheque", "Tarjeta de Crédito", "Tarjeta de Débito"]),
    "tipos-iva": names(["Responsable inscripto", "Monotributista", "Consumidor final", "Exento"]),
    // Se preservan los identificadores usados por los proveedores existentes.
    "tipos-documento": names(["CUIT", "CUIL", "DNI", "Pasaporte", "Otro"]),
    cargos: names(["Administrador", "Vendedor", "Repartidor"]),
    provincias: PROVINCIAS.map(item => entry(item.id, item.nombre)),
    localidades: LOCALIDADES.map(item => entry(item.id, item.nombre, { parentId: item.provinciaId })),
    calles: CALLES.map(item => entry(item.id, item.nombre, { parentId: item.localidadId })),
    unidades: UNIDADES.map(item => entry(String(item.idUnidad), item.unidad)),
    "tipos-producto": TIPOS_PRODUCTO.map(item => entry(String(item.idTipoProducto), item.tipo)),
    "subtipos-producto": SUBTIPOS_PRODUCTO.map(item => entry(String(item.idSubtipoProducto), item.subtipo, { parentId: String(item.idTipoProducto) })),
    "tipos-materia-prima": TIPOS_MATERIA_PRIMA.map(item => entry(String(item.idTipoMateriaPrima), item.nombre)),
    marcas: MARCAS.map(item => entry(String(item.idMarca), item.nombre, { materiasPrimas: materiasPrimasDeMarca(item.idMarca) })),
    "tipos-maquina": names(["Amasadora", "Sobadora", "Formadora", "Secadero"]),
    "tipos-mantenimiento": names(["Preventivo", "Correctivo"]),
  };
}

const materiasPrimasDeMarca = (idMarca: number) => MATERIAS_PRIMAS_PRODUCCION.filter(m => m.idMarca === idMarca).map(m => m.idMateriaPrima);

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
      result[key] = key === "marcas"
        ? rows.map(row => ({ ...row, materiasPrimas: row.materiasPrimas ?? materiasPrimasDeMarca(Number(row.id)) }))
        : rows;
    }
    return result;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return initialCatalogs();
    throw new Error("No se pudieron leer los catálogos. El archivo existente se conservó.");
  }
}

export const getCatalogs = () => serialized(readCatalogs);

const addressCatalogs = ["provincias", "localidades", "calles"] as const;
const customerCatalogs = ["modalidades-entrega", "tipos-documento", "tipos-iva", ...addressCatalogs] as const;
const visibleCatalogs: Record<Exclude<Role, "Administrador">, readonly (keyof Catalogs)[]> = {
  Cliente: customerCatalogs,
  Ventas: [...customerCatalogs, "tipos-cliente", "medios-pago", "unidades"],
  Producción: ["unidades", "tipos-producto", "subtipos-producto", "tipos-materia-prima", "marcas", "tipos-maquina", "tipos-mantenimiento"],
};

export async function getCatalogsForRole(role: Role): Promise<Catalogs> {
  const catalogs = await getCatalogs();
  if (role === "Administrador") return catalogs;
  for (const { key } of CATALOG_DEFINITIONS) {
    catalogs[key] = visibleCatalogs[role].includes(key)
      ? catalogs[key].map(entry => ({ ...entry, description: "" }))
      : [];
  }
  return catalogs;
}
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
    const rawMaterials = definition.key === "marcas" ? form.getAll("materiasPrimas") : [];
    if (rawMaterials.length > 500 || rawMaterials.some(value => typeof value !== "string" || !/^[1-9]\d{0,8}$/.test(value))) throw new Error("Las materias primas asociadas no son válidas.");
    const materiasPrimas = [...new Set(rawMaterials.map(Number))];
    const nextId = String(Math.max(0, ...rows.map(item => /^\d+$/.test(item.id) ? Number(item.id) : 0)) + 1);
    const entry: CatalogEntry = {
      id: previous?.id ?? nextId, value: previous?.value ?? name.trim().replace(/\s+/g, " "),
      name: name.trim().replace(/\s+/g, " "), description: description.trim(), active: active === "true",
      ...(typeof parentId === "string" ? { parentId } : {}),
      ...(behavior === "pickup" || behavior === "shipping" ? { behavior } : {}),
      ...(definition.key === "marcas" ? { materiasPrimas } : {}),
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
