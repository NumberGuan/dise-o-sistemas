export type CatalogEntry = {
  id: string;
  value: string;
  name: string;
  description: string;
  active: boolean;
  parentId?: string;
  behavior?: "pickup" | "shipping";
  materiasPrimas?: number[];
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
  { key: "subtipos-producto", title: "Subtipos de producto", singular: "subtipo de producto", group: "Producción e inventario", description: "Variedades de producto dentro de cada tipo.", parent: "tipos-producto" },
  { key: "tipos-materia-prima", title: "Tipos de materia prima", singular: "tipo de materia prima", group: "Producción e inventario", description: "Clasificaciones de los insumos de producción." },
  { key: "marcas", title: "Marcas", singular: "marca", group: "Producción e inventario", description: "Marcas de las materias primas de producción." },
  { key: "tipos-maquina", title: "Tipos de máquina", singular: "tipo de máquina", group: "Mantenimiento", description: "Clasificaciones de las máquinas de producción." },
  { key: "tipos-mantenimiento", title: "Tipos de mantenimiento", singular: "tipo de mantenimiento", group: "Mantenimiento", description: "Clasificaciones de los trabajos sobre las máquinas." },
] as const;

export type CatalogKey = (typeof CATALOG_DEFINITIONS)[number]["key"];
export type Catalogs = Record<CatalogKey, CatalogEntry[]>;
export const catalogDefinition = (key: string) => CATALOG_DEFINITIONS.find(item => item.key === key);
export function canCreateCatalog(role: string, key: string) {
  const definition = catalogDefinition(key);
  return Boolean(definition && (role === "Administrador" || role === "Producción" && definition.group === "Producción e inventario"));
}
export function brandRawMaterials(brand: CatalogEntry) {
  return brand.materiasPrimas ?? [];
}

export function brandsForRawMaterial(catalogs: Catalogs, idMateriaPrima: number, retainedId?: string) {
  return catalogs.marcas.filter(brand => brand.id === retainedId || (brand.active && brandRawMaterials(brand).includes(idMateriaPrima)));
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
