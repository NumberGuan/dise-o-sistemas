// Datos de muestra del área de Producción. Los atributos siguen el diagrama de clases
// (namespaces "Produccion y recetas" e "Inventario y catalogos"). Las máquinas y los
// empleados se toman de los módulos de Mantenimiento y Administración.

export type Unidad = { idUnidad: number; unidad: string };
export type TipoProducto = { idTipoProducto: number; tipo: string };
export type SubtipoProducto = { idSubtipoProducto: number; idTipoProducto: number; subtipo: string };
export type TipoMateriaPrima = { idTipoMateriaPrima: number; nombre: string };
export type Marca = { idMarca: number; nombre: string };

export type MateriaPrima = {
  idMateriaPrima: number;
  idUnidad: number;
  idTipoMateriaPrima: number;
  idMarca: number;
  nombre: string;
  stockMateriaPrima: number;
  precioUltimaCompra: number;
};

export type Producto = {
  idProducto: number;
  idReceta: number;
  idUnidad: number;
  idTipoProducto: number;
  idSubtipoProducto: number;
  nombre: string;
  precio: number;
  stockProducto: number;
};

export type DetalleMateriaPrima = { idMateriaPrima: number; idUnidad: number; idMarca: number; cantidadNecesaria: number };
export type DetalleRecetaMaquina = { idMaquina: string; horaInicio: string; horaFin: string };

export type Receta = {
  idReceta: number;
  nombre: string;
  procedimiento: string;
  tiempoCoccion: string;
  temperatura: number;
  materiasPrimas: DetalleMateriaPrima[];
  maquinas: DetalleRecetaMaquina[];
};

export const ESTADOS_ORDEN_PRODUCCION = ["Pendiente", "En proceso", "Finalizada", "Cancelada"] as const;
export type EstadoOrdenProduccion = (typeof ESTADOS_ORDEN_PRODUCCION)[number];

// Materia prima que una línea de la orden consume; se descuenta del stock al iniciar la producción.
export type ConsumoMateriaPrima = { idMateriaPrima: number; cantidad: number };
// tandas: cuántas veces se elabora la receta; multiplica las cantidades de materia prima.
export type DetalleOrdenProduccion = { idProducto: number; tandas: number; cantidadRealGenerada: number | null; materiasPrimas: ConsumoMateriaPrima[] };

export type OrdenProduccion = {
  idOrdenProduccion: number;
  idEmpleado: string;
  fechaEmision: string;
  fechaInicio: string | null;
  fechaFinalizacion: string | null;
  // El vencimiento pertenece al lote producido, no al producto.
  fechaVencimiento: string | null;
  estado: EstadoOrdenProduccion;
  nmrLote: number;
  detalle: DetalleOrdenProduccion[];
};

export const UNIDADES: Unidad[] = [
  { idUnidad: 1, unidad: "kg" },
  { idUnidad: 2, unidad: "g" },
  { idUnidad: 3, unidad: "l" },
  { idUnidad: 4, unidad: "unidad" },
  { idUnidad: 5, unidad: "docena" },
];

export const TIPOS_PRODUCTO: TipoProducto[] = [
  { idTipoProducto: 1, tipo: "Pasta seca" },
  { idTipoProducto: 2, tipo: "Pasta fresca" },
  { idTipoProducto: 3, tipo: "Pasta rellena" },
  { idTipoProducto: 4, tipo: "Salsa" },
];

export const SUBTIPOS_PRODUCTO: SubtipoProducto[] = [
  { idSubtipoProducto: 1, idTipoProducto: 1, subtipo: "Spaghetti" },
  { idSubtipoProducto: 2, idTipoProducto: 2, subtipo: "Tallarines" },
  { idSubtipoProducto: 3, idTipoProducto: 2, subtipo: "Fettuccine" },
  { idSubtipoProducto: 4, idTipoProducto: 2, subtipo: "Ñoquis" },
  { idSubtipoProducto: 5, idTipoProducto: 3, subtipo: "Ravioles" },
  { idSubtipoProducto: 6, idTipoProducto: 3, subtipo: "Sorrentinos" },
  { idSubtipoProducto: 7, idTipoProducto: 3, subtipo: "Canelones" },
  { idSubtipoProducto: 8, idTipoProducto: 3, subtipo: "Lasagna" },
  { idSubtipoProducto: 9, idTipoProducto: 3, subtipo: "Agnolottis" },
  { idSubtipoProducto: 10, idTipoProducto: 3, subtipo: "Capelettis" },
  { idSubtipoProducto: 11, idTipoProducto: 4, subtipo: "Salsas de tomate" },
  { idSubtipoProducto: 12, idTipoProducto: 4, subtipo: "Salsas blancas y de queso" },
  { idSubtipoProducto: 13, idTipoProducto: 4, subtipo: "Pesto" },
];

export const TIPOS_MATERIA_PRIMA: TipoMateriaPrima[] = [
  { idTipoMateriaPrima: 1, nombre: "Harinas" },
  { idTipoMateriaPrima: 2, nombre: "Lácteos" },
  { idTipoMateriaPrima: 3, nombre: "Huevos" },
  { idTipoMateriaPrima: 4, nombre: "Verduras" },
  { idTipoMateriaPrima: 5, nombre: "Fiambres" },
  { idTipoMateriaPrima: 6, nombre: "Condimentos" },
  { idTipoMateriaPrima: 7, nombre: "Carnes" },
  { idTipoMateriaPrima: 8, nombre: "Aceites y conservas" },
];

export const MARCAS: Marca[] = [
  { idMarca: 1, nombre: "Molino La Plata" },
  { idMarca: 2, nombre: "AgroHarinas" },
  { idMarca: 3, nombre: "La Serenísima" },
  { idMarca: 4, nombre: "Granja del Sol" },
  { idMarca: 5, nombre: "Paladini" },
  { idMarca: 6, nombre: "Huerta Norte" },
  { idMarca: 7, nombre: "Celusal" },
  { idMarca: 8, nombre: "Frigorífico del Sur" },
  { idMarca: 9, nombre: "Natura" },
  { idMarca: 10, nombre: "Arcor" },
];

const redondear = (n: number) => Math.round(n * 1000) / 1000;

// Las recetas usan gramos y huevos individuales; el inventario usa kg y docenas.
export function unidadesCompatibles(idUnidad: number): number[] {
  if ([1, 2].includes(idUnidad)) return [1, 2];
  if ([4, 5].includes(idUnidad)) return [4, 5];
  return [idUnidad];
}

export function convertirUnidad(cantidad: number, origen: number, destino: number): number {
  if (!unidadesCompatibles(origen).includes(destino)) throw new Error("Las unidades de la materia prima no son compatibles.");
  const factor = (id: number) => id === 2 ? 0.001 : id === 5 ? 12 : 1;
  return cantidad * factor(origen) / factor(destino);
}

// Total por materia prima de toda la orden (una misma materia prima puede repetirse entre productos).
export function consumoTotal(detalle: DetalleOrdenProduccion[]): ConsumoMateriaPrima[] {
  const totales = new Map<number, number>();
  for (const linea of detalle) for (const m of linea.materiasPrimas) totales.set(m.idMateriaPrima, Math.round(((totales.get(m.idMateriaPrima) ?? 0) + m.cantidad) * 1000) / 1000);
  return [...totales].map(([idMateriaPrima, cantidad]) => ({ idMateriaPrima, cantidad }));
}

// Vencimiento vigente de un producto: el del último lote finalizado que lo produjo.
export function getVencimientoProducto(orders: OrdenProduccion[], idProducto: number): string | null {
  return orders
    .filter((o) => o.estado === "Finalizada" && o.fechaVencimiento && o.detalle.some((d) => d.idProducto === idProducto))
    .sort((a, b) => (b.fechaFinalizacion ?? "").localeCompare(a.fechaFinalizacion ?? ""))[0]?.fechaVencimiento ?? null;
}

export const codigo = (prefijo: string, id: number, digitos = 3) => `${prefijo}-${String(id).padStart(digitos, "0")}`;
export const siguienteId = (ids: number[]) => Math.max(0, ...ids) + 1;

export const getUnidad = (id: number) => UNIDADES.find((u) => u.idUnidad === id)?.unidad ?? "";
export const getTipoProducto = (id: number) => TIPOS_PRODUCTO.find((t) => t.idTipoProducto === id)?.tipo ?? "—";
export const getTipoMateriaPrima = (id: number) => TIPOS_MATERIA_PRIMA.find((t) => t.idTipoMateriaPrima === id)?.nombre ?? "—";
export const getMarca = (id: number) => MARCAS.find((m) => m.idMarca === id)?.nombre ?? "—";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(amount);
}

export function formatCantidad(cantidad: number, idUnidad: number) {
  return `${cantidad.toLocaleString("es-AR")} ${getUnidad(idUnidad)}`;
}

export function createProductionOperations({
  MATERIAS_PRIMAS_PRODUCCION, RECETAS, PRODUCTOS_PRODUCCION,
}: {
  MATERIAS_PRIMAS_PRODUCCION: MateriaPrima[];
  RECETAS: Receta[];
  PRODUCTOS_PRODUCCION: Producto[];
}) {
  function guardarRecetaConProducto(receta: Receta, producto: Producto | null) {
    if (!producto) throw new Error("Seleccioná o creá un producto asociado a la receta.");
    const existente = PRODUCTOS_PRODUCCION.find(p => p.idProducto === producto.idProducto);
    if (existente && existente.idReceta !== receta.idReceta && RECETAS.some(r => r.idReceta === existente.idReceta)) {
      throw new Error("El producto ya está asociado a otra receta.");
    }
    for (const materia of receta.materiasPrimas) {
      const mp = getMateriaPrima(materia.idMateriaPrima);
      if (!mp || !Number.isFinite(materia.cantidadNecesaria) || materia.cantidadNecesaria <= 0 || !unidadesCompatibles(mp.idUnidad).includes(materia.idUnidad)) {
        throw new Error("Revisá las cantidades y unidades de las materias primas.");
      }
    }
    const indice = RECETAS.findIndex(r => r.idReceta === receta.idReceta);
    if (indice >= 0) RECETAS[indice] = receta;
    else RECETAS.unshift(receta);
    if (!existente) PRODUCTOS_PRODUCCION.unshift({ ...producto, idReceta: receta.idReceta });
    else existente.idReceta = receta.idReceta;
  }

  function consumoDeReceta(idProducto: number, tandas = 1): ConsumoMateriaPrima[] {
    const idReceta = PRODUCTOS_PRODUCCION.find((p) => p.idProducto === idProducto)?.idReceta;
    return (RECETAS.find((r) => r.idReceta === idReceta)?.materiasPrimas ?? []).map((m) => ({ idMateriaPrima: m.idMateriaPrima, cantidad: redondear(convertirUnidad(m.cantidadNecesaria * tandas, m.idUnidad, getMateriaPrima(m.idMateriaPrima)!.idUnidad)) }));
  }

  const getReceta = (id: number) => RECETAS.find((r) => r.idReceta === id);

  const getProducto = (id: number) => PRODUCTOS_PRODUCCION.find((p) => p.idProducto === id);

  function getMateriaPrima(id: number) { return MATERIAS_PRIMAS_PRODUCCION.find((m) => m.idMateriaPrima === id); }
  return { guardarRecetaConProducto, consumoDeReceta, getReceta, getProducto, getMateriaPrima };
}
