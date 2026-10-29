import { PROVINCIAS, LOCALIDADES, CALLES } from "./domicilios";
import { UNIDADES, TIPOS_PRODUCTO, TIPOS_MATERIA_PRIMA, MARCAS } from "./produccion";

export type CatalogEntry = {
  id: string;
  value: string;
  name: string;
  description: string;
  active: boolean;
  parentId?: string;
  behavior?: "pickup" | "shipping";
};

export const CATALOG_DEFINITIONS = [
  { key: "tipos-cliente", title: "Tipos de cliente", singular: "tipo de cliente", group: "Ventas y facturación", description: "Clasificaciones comerciales de los clientes." },
  { key: "modalidades-entrega", title: "Modalidades de entrega", singular: "modalidad de entrega", group: "Ventas y facturación", description: "Opciones de retiro o envío para los pedidos." },
  { key: "medios-pago", title: "Métodos de pago", singular: "método de pago", group: "Ventas y facturación", description: "Medios habilitados para recibos y señas de eventos." },
  { key: "tipos-iva", title: "Tipos de IVA", singular: "tipo de IVA", group: "Ventas y facturación", description: "Condiciones de IVA de las personas. No modifica las alícuotas de las facturas." },
  { key: "tipos-documento", title: "Tipos de documento", singular: "tipo de documento", group: "Personas y domicilios", description: "Documentos para identificar clientes y proveedores." },
  { key: "cargos", title: "Cargos de empleados", singular: "cargo", group: "Personas y domicilios", description: "Funciones laborales del personal; los permisos de acceso dependen del rol de la cuenta." },
  { key: "provincias", title: "Provincias", singular: "provincia", group: "Personas y domicilios", description: "Provincias disponibles al cargar domicilios." },
  { key: "localidades", title: "Localidades", singular: "localidad", group: "Personas y domicilios", description: "Localidades vinculadas a una provincia.", parent: "provincias" },
  { key: "calles", title: "Calles", singular: "calle", group: "Personas y domicilios", description: "Calles vinculadas a una localidad.", parent: "localidades" },
  { key: "unidades", title: "Unidades de medida", singular: "unidad de medida", group: "Producción e inventario", description: "Unidades de productos y materias primas." },
  { key: "tipos-producto", title: "Tipos de producto", singular: "tipo de producto", group: "Producción e inventario", description: "Clasificaciones del catálogo de producción." },
  { key: "tipos-materia-prima", title: "Tipos de materia prima", singular: "tipo de materia prima", group: "Producción e inventario", description: "Clasificaciones de los insumos de producción." },
  { key: "marcas", title: "Marcas", singular: "marca", group: "Producción e inventario", description: "Marcas de las materias primas de producción." },
  { key: "tipos-maquina", title: "Tipos de máquina", singular: "tipo de máquina", group: "Mantenimiento", description: "Clasificaciones de las máquinas de producción." },
  { key: "tipos-mantenimiento", title: "Tipos de mantenimiento", singular: "tipo de mantenimiento", group: "Mantenimiento", description: "Clasificaciones de los trabajos sobre las máquinas." },
] as const;

export type CatalogKey = (typeof CATALOG_DEFINITIONS)[number]["key"];
export type Catalogs = Record<CatalogKey, CatalogEntry[]>;
export const catalogDefinition = (key: string) => CATALOG_DEFINITIONS.find(item => item.key === key);
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
    "tipos-materia-prima": TIPOS_MATERIA_PRIMA.map(item => entry(String(item.idTipoMateriaPrima), item.nombre)),
    marcas: MARCAS.map(item => entry(String(item.idMarca), item.nombre)),
    "tipos-maquina": names(["Amasadora", "Sobadora", "Formadora", "Secadero"]),
    "tipos-mantenimiento": names(["Preventivo", "Correctivo"]),
  };
}

export function catalogOptions(catalogs: Catalogs, key: CatalogKey, retained?: string) {
  return catalogs[key].filter(item => item.active || item.value === retained);
}

export function catalogDefaultValue(catalogs: Catalogs, key: CatalogKey, preferred: string) {
  const options = catalogOptions(catalogs, key);
  return options.find(item => item.value === preferred)?.value ?? options[0]?.value ?? "";
}

export function validCatalogValue(catalogs: Catalogs, key: CatalogKey, value: unknown, previous?: string): value is string {
  return typeof value === "string" && catalogs[key].some(item => item.value === value && (item.active || value === previous));
}

export function deliveryNeedsAddress(catalogs: Catalogs, value: string) {
  return catalogs["modalidades-entrega"].find(item => item.value === value)?.behavior !== "pickup";
}

export function catalogAddressData(catalogs: Catalogs) {
  return {
    provincias: catalogs.provincias.filter(item => item.active).map(item => ({ id: item.id, nombre: item.name })),
    localidades: catalogs.localidades.filter(item => item.active).map(item => ({ id: item.id, nombre: item.name, provinciaId: item.parentId })),
    calles: catalogs.calles.filter(item => item.active).map(item => ({ id: item.id, nombre: item.name, localidadId: item.parentId })),
  };
}
