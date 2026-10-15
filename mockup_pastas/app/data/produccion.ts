// Datos de muestra del área de Producción. Los atributos siguen el diagrama de clases
// (namespaces "Produccion y recetas" e "Inventario y catalogos"). Las máquinas y los
// empleados se toman de los módulos de Mantenimiento y Administración.

export type Unidad = { idUnidad: number; unidad: string };
export type TipoProducto = { idTipoProducto: number; tipo: string };
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
  nombre: string;
  precio: number;
  fechaVencimiento: string;
  stockProducto: number;
};

export type DetalleMateriaPrima = { idMateriaPrima: number; cantidadNecesaria: number };
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

export type DetalleOrdenProduccion = { idProducto: number; cantidadRealGenerada: number | null };

export type OrdenProduccion = {
  idOrdenProduccion: number;
  idEmpleado: string;
  fechaEmision: string;
  fechaInicio: string | null;
  fechaFinalizacion: string | null;
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
];

export const TIPOS_MATERIA_PRIMA: TipoMateriaPrima[] = [
  { idTipoMateriaPrima: 1, nombre: "Harinas" },
  { idTipoMateriaPrima: 2, nombre: "Lácteos" },
  { idTipoMateriaPrima: 3, nombre: "Huevos" },
  { idTipoMateriaPrima: 4, nombre: "Verduras" },
  { idTipoMateriaPrima: 5, nombre: "Fiambres" },
  { idTipoMateriaPrima: 6, nombre: "Condimentos" },
];

export const MARCAS: Marca[] = [
  { idMarca: 1, nombre: "Molino La Plata" },
  { idMarca: 2, nombre: "AgroHarinas" },
  { idMarca: 3, nombre: "La Serenísima" },
  { idMarca: 4, nombre: "Granja del Sol" },
  { idMarca: 5, nombre: "Paladini" },
  { idMarca: 6, nombre: "Huerta Norte" },
  { idMarca: 7, nombre: "Celusal" },
];

export const MATERIAS_PRIMAS_PRODUCCION: MateriaPrima[] = [
  { idMateriaPrima: 1, idUnidad: 1, idTipoMateriaPrima: 1, idMarca: 1, nombre: "Harina 000", stockMateriaPrima: 320, precioUltimaCompra: 450 },
  { idMateriaPrima: 2, idUnidad: 1, idTipoMateriaPrima: 1, idMarca: 2, nombre: "Harina 0000", stockMateriaPrima: 180, precioUltimaCompra: 500 },
  { idMateriaPrima: 3, idUnidad: 1, idTipoMateriaPrima: 1, idMarca: 1, nombre: "Sémola de trigo", stockMateriaPrima: 95, precioUltimaCompra: 610 },
  { idMateriaPrima: 4, idUnidad: 5, idTipoMateriaPrima: 3, idMarca: 4, nombre: "Huevo", stockMateriaPrima: 40, precioUltimaCompra: 2900 },
  { idMateriaPrima: 5, idUnidad: 1, idTipoMateriaPrima: 2, idMarca: 3, nombre: "Ricota", stockMateriaPrima: 25, precioUltimaCompra: 3800 },
  { idMateriaPrima: 6, idUnidad: 1, idTipoMateriaPrima: 2, idMarca: 3, nombre: "Queso muzzarella", stockMateriaPrima: 18, precioUltimaCompra: 6200 },
  { idMateriaPrima: 7, idUnidad: 1, idTipoMateriaPrima: 5, idMarca: 5, nombre: "Jamón cocido", stockMateriaPrima: 12, precioUltimaCompra: 8900 },
  { idMateriaPrima: 8, idUnidad: 1, idTipoMateriaPrima: 4, idMarca: 6, nombre: "Espinaca", stockMateriaPrima: 15, precioUltimaCompra: 1700 },
  { idMateriaPrima: 9, idUnidad: 1, idTipoMateriaPrima: 4, idMarca: 6, nombre: "Papa", stockMateriaPrima: 120, precioUltimaCompra: 650 },
  { idMateriaPrima: 10, idUnidad: 1, idTipoMateriaPrima: 6, idMarca: 7, nombre: "Sal fina", stockMateriaPrima: 30, precioUltimaCompra: 900 },
];

export const RECETAS: Receta[] = [
  {
    idReceta: 1, nombre: "Masa al huevo", tiempoCoccion: "00:04", temperatura: 100,
    procedimiento: "Mezclar la harina con los huevos y la sal. Amasar hasta obtener una masa lisa, dejar reposar 20 minutos y laminar hasta 1,5 mm. Cortar según el producto.",
    materiasPrimas: [{ idMateriaPrima: 1, cantidadNecesaria: 10 }, { idMateriaPrima: 4, cantidadNecesaria: 2 }, { idMateriaPrima: 10, cantidadNecesaria: 0.2 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "07:00", horaFin: "07:30" }, { idMaquina: "maq-2", horaInicio: "07:30", horaFin: "08:15" }],
  },
  {
    idReceta: 2, nombre: "Ravioles de verdura", tiempoCoccion: "00:06", temperatura: 100,
    procedimiento: "Preparar la masa con harina 0000 y huevo. Para el relleno, blanquear la espinaca, picarla y mezclarla con la ricota. Rellenar y cortar en la raviolera.",
    materiasPrimas: [{ idMateriaPrima: 2, cantidadNecesaria: 6 }, { idMateriaPrima: 4, cantidadNecesaria: 1 }, { idMateriaPrima: 5, cantidadNecesaria: 4 }, { idMateriaPrima: 8, cantidadNecesaria: 3 }, { idMateriaPrima: 10, cantidadNecesaria: 0.1 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "08:30", horaFin: "09:00" }, { idMaquina: "maq-3", horaInicio: "09:00", horaFin: "10:30" }],
  },
  {
    idReceta: 3, nombre: "Ñoquis de papa", tiempoCoccion: "00:03", temperatura: 100,
    procedimiento: "Hervir las papas con cáscara, pelarlas y hacer un puré. Incorporar harina, huevo y sal. Formar cilindros, cortar y marcar con tenedor.",
    materiasPrimas: [{ idMateriaPrima: 9, cantidadNecesaria: 12 }, { idMateriaPrima: 1, cantidadNecesaria: 4 }, { idMateriaPrima: 4, cantidadNecesaria: 0.5 }, { idMateriaPrima: 10, cantidadNecesaria: 0.1 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "10:30", horaFin: "11:00" }],
  },
  {
    idReceta: 4, nombre: "Sorrentinos de jamón y queso", tiempoCoccion: "00:08", temperatura: 100,
    procedimiento: "Preparar la masa con harina 0000 y huevo. Mezclar ricota, jamón picado y muzzarella rallada. Rellenar, cerrar con molde redondo y espolvorear con sémola.",
    materiasPrimas: [{ idMateriaPrima: 2, cantidadNecesaria: 6 }, { idMateriaPrima: 4, cantidadNecesaria: 1 }, { idMateriaPrima: 5, cantidadNecesaria: 3 }, { idMateriaPrima: 7, cantidadNecesaria: 2 }, { idMateriaPrima: 6, cantidadNecesaria: 2 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "11:00", horaFin: "11:30" }, { idMaquina: "maq-2", horaInicio: "11:30", horaFin: "12:00" }, { idMaquina: "maq-3", horaInicio: "12:00", horaFin: "13:30" }],
  },
  {
    idReceta: 5, nombre: "Spaghetti de sémola", tiempoCoccion: "00:10", temperatura: 100,
    procedimiento: "Mezclar sémola con agua y sal. Extrudir en forma de spaghetti y llevar al secadero durante 6 horas a temperatura controlada.",
    materiasPrimas: [{ idMateriaPrima: 3, cantidadNecesaria: 15 }, { idMateriaPrima: 10, cantidadNecesaria: 0.1 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "08:00", horaFin: "08:40" }, { idMaquina: "maq-4", horaInicio: "09:00", horaFin: "15:00" }],
  },
];

export const PRODUCTOS_PRODUCCION: Producto[] = [
  { idProducto: 1, idReceta: 1, idUnidad: 1, idTipoProducto: 2, nombre: "Tallarines al huevo", precio: 2000, fechaVencimiento: "2026-10-20", stockProducto: 45 },
  { idProducto: 2, idReceta: 2, idUnidad: 5, idTipoProducto: 3, nombre: "Ravioles de verdura", precio: 3500, fechaVencimiento: "2026-10-18", stockProducto: 12 },
  { idProducto: 3, idReceta: 3, idUnidad: 1, idTipoProducto: 2, nombre: "Ñoquis de papa", precio: 2800, fechaVencimiento: "2026-10-17", stockProducto: 30 },
  { idProducto: 4, idReceta: 4, idUnidad: 5, idTipoProducto: 3, nombre: "Sorrentinos de jamón y queso", precio: 4200, fechaVencimiento: "2026-10-19", stockProducto: 0 },
  { idProducto: 5, idReceta: 5, idUnidad: 4, idTipoProducto: 1, nombre: "Spaghetti 500 g", precio: 2200, fechaVencimiento: "2027-04-30", stockProducto: 220 },
  { idProducto: 6, idReceta: 1, idUnidad: 1, idTipoProducto: 2, nombre: "Fettuccine al huevo", precio: 2100, fechaVencimiento: "2026-10-21", stockProducto: 20 },
];

export const ORDENES_PRODUCCION: OrdenProduccion[] = [
  { idOrdenProduccion: 1, idEmpleado: "emp-1", fechaEmision: "2026-10-01", fechaInicio: "2026-10-02", fechaFinalizacion: "2026-10-02", estado: "Finalizada", nmrLote: 261002, detalle: [{ idProducto: 1, cantidadRealGenerada: 48 }, { idProducto: 6, cantidadRealGenerada: 20 }] },
  { idOrdenProduccion: 2, idEmpleado: "emp-3", fechaEmision: "2026-10-05", fechaInicio: null, fechaFinalizacion: null, estado: "Cancelada", nmrLote: 261006, detalle: [{ idProducto: 5, cantidadRealGenerada: null }] },
  { idOrdenProduccion: 3, idEmpleado: "emp-1", fechaEmision: "2026-10-12", fechaInicio: "2026-10-13", fechaFinalizacion: null, estado: "En proceso", nmrLote: 261013, detalle: [{ idProducto: 2, cantidadRealGenerada: null }, { idProducto: 4, cantidadRealGenerada: null }] },
  { idOrdenProduccion: 4, idEmpleado: "emp-2", fechaEmision: "2026-10-14", fechaInicio: null, fechaFinalizacion: null, estado: "Pendiente", nmrLote: 261015, detalle: [{ idProducto: 3, cantidadRealGenerada: null }, { idProducto: 5, cantidadRealGenerada: null }] },
];

export const codigo = (prefijo: string, id: number, digitos = 3) => `${prefijo}-${String(id).padStart(digitos, "0")}`;
export const siguienteId = (ids: number[]) => Math.max(0, ...ids) + 1;

export const getUnidad = (id: number) => UNIDADES.find((u) => u.idUnidad === id)?.unidad ?? "";
export const getTipoProducto = (id: number) => TIPOS_PRODUCTO.find((t) => t.idTipoProducto === id)?.tipo ?? "—";
export const getTipoMateriaPrima = (id: number) => TIPOS_MATERIA_PRIMA.find((t) => t.idTipoMateriaPrima === id)?.nombre ?? "—";
export const getMarca = (id: number) => MARCAS.find((m) => m.idMarca === id)?.nombre ?? "—";
export const getReceta = (id: number) => RECETAS.find((r) => r.idReceta === id);
export const getProducto = (id: number) => PRODUCTOS_PRODUCCION.find((p) => p.idProducto === id);
export const getMateriaPrima = (id: number) => MATERIAS_PRIMAS_PRODUCCION.find((m) => m.idMateriaPrima === id);

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(amount);
}

export function formatCantidad(cantidad: number, idUnidad: number) {
  return `${cantidad.toLocaleString("es-AR")} ${getUnidad(idUnidad)}`;
}
