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
  { idMateriaPrima: 11, idUnidad: 1, idTipoMateriaPrima: 7, idMarca: 8, nombre: "Carne picada", stockMateriaPrima: 40, precioUltimaCompra: 7500 },
  { idMateriaPrima: 12, idUnidad: 1, idTipoMateriaPrima: 7, idMarca: 4, nombre: "Pechuga de pollo", stockMateriaPrima: 25, precioUltimaCompra: 6800 },
  { idMateriaPrima: 13, idUnidad: 1, idTipoMateriaPrima: 4, idMarca: 6, nombre: "Calabaza", stockMateriaPrima: 50, precioUltimaCompra: 900 },
  { idMateriaPrima: 14, idUnidad: 1, idTipoMateriaPrima: 4, idMarca: 6, nombre: "Cebolla", stockMateriaPrima: 40, precioUltimaCompra: 800 },
  { idMateriaPrima: 15, idUnidad: 1, idTipoMateriaPrima: 4, idMarca: 6, nombre: "Champiñones", stockMateriaPrima: 10, precioUltimaCompra: 9500 },
  { idMateriaPrima: 16, idUnidad: 1, idTipoMateriaPrima: 4, idMarca: 6, nombre: "Albahaca", stockMateriaPrima: 4, precioUltimaCompra: 12000 },
  { idMateriaPrima: 17, idUnidad: 1, idTipoMateriaPrima: 6, idMarca: 9, nombre: "Nuez", stockMateriaPrima: 8, precioUltimaCompra: 14000 },
  { idMateriaPrima: 18, idUnidad: 1, idTipoMateriaPrima: 8, idMarca: 10, nombre: "Tomate triturado", stockMateriaPrima: 80, precioUltimaCompra: 1500 },
  { idMateriaPrima: 19, idUnidad: 3, idTipoMateriaPrima: 8, idMarca: 9, nombre: "Aceite de oliva", stockMateriaPrima: 20, precioUltimaCompra: 11000 },
  { idMateriaPrima: 20, idUnidad: 3, idTipoMateriaPrima: 2, idMarca: 3, nombre: "Leche", stockMateriaPrima: 60, precioUltimaCompra: 1200 },
  { idMateriaPrima: 21, idUnidad: 3, idTipoMateriaPrima: 2, idMarca: 3, nombre: "Crema de leche", stockMateriaPrima: 30, precioUltimaCompra: 5200 },
  { idMateriaPrima: 22, idUnidad: 1, idTipoMateriaPrima: 2, idMarca: 3, nombre: "Manteca", stockMateriaPrima: 15, precioUltimaCompra: 8000 },
  { idMateriaPrima: 23, idUnidad: 1, idTipoMateriaPrima: 2, idMarca: 3, nombre: "Queso rallado", stockMateriaPrima: 20, precioUltimaCompra: 9800 },
  { idMateriaPrima: 24, idUnidad: 1, idTipoMateriaPrima: 2, idMarca: 3, nombre: "Queso azul", stockMateriaPrima: 6, precioUltimaCompra: 13500 },
];

type RecetaSemilla = Omit<Receta, "materiasPrimas"> & { materiasPrimas: Pick<DetalleMateriaPrima, "idMateriaPrima" | "cantidadNecesaria">[] };

const RECETAS_SEMILLA: RecetaSemilla[] = [
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
  {
    idReceta: 6, nombre: "Ravioles de jamón y queso", tiempoCoccion: "00:06", temperatura: 100,
    procedimiento: "Preparar la masa con harina 0000 y huevo. Mezclar ricota, jamón picado y muzzarella. Rellenar y cortar en la raviolera.",
    materiasPrimas: [{ idMateriaPrima: 2, cantidadNecesaria: 6 }, { idMateriaPrima: 4, cantidadNecesaria: 1 }, { idMateriaPrima: 5, cantidadNecesaria: 2 }, { idMateriaPrima: 7, cantidadNecesaria: 2 }, { idMateriaPrima: 6, cantidadNecesaria: 2 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "07:00", horaFin: "07:30" }, { idMaquina: "maq-3", horaInicio: "07:30", horaFin: "09:00" }],
  },
  {
    idReceta: 7, nombre: "Ravioles de ricota y nuez", tiempoCoccion: "00:06", temperatura: 100,
    procedimiento: "Preparar la masa con harina 0000 y huevo. Mezclar ricota con nuez picada y queso rallado. Rellenar y cortar en la raviolera.",
    materiasPrimas: [{ idMateriaPrima: 2, cantidadNecesaria: 6 }, { idMateriaPrima: 4, cantidadNecesaria: 1 }, { idMateriaPrima: 5, cantidadNecesaria: 4 }, { idMateriaPrima: 17, cantidadNecesaria: 1 }, { idMateriaPrima: 23, cantidadNecesaria: 0.5 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "09:00", horaFin: "09:30" }, { idMaquina: "maq-3", horaInicio: "09:30", horaFin: "11:00" }],
  },
  {
    idReceta: 8, nombre: "Sorrentinos de calabaza y queso", tiempoCoccion: "00:08", temperatura: 100,
    procedimiento: "Asar la calabaza y hacer un puré. Mezclar con muzzarella y queso rallado. Rellenar la masa, cerrar con molde redondo y espolvorear con sémola.",
    materiasPrimas: [{ idMateriaPrima: 2, cantidadNecesaria: 6 }, { idMateriaPrima: 4, cantidadNecesaria: 1 }, { idMateriaPrima: 13, cantidadNecesaria: 5 }, { idMateriaPrima: 6, cantidadNecesaria: 2 }, { idMateriaPrima: 23, cantidadNecesaria: 0.5 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "11:00", horaFin: "11:30" }, { idMaquina: "maq-2", horaInicio: "11:30", horaFin: "12:00" }],
  },
  {
    idReceta: 9, nombre: "Canelones de verdura y ricota", tiempoCoccion: "00:25", temperatura: 180,
    procedimiento: "Preparar panqueques con harina, huevo y leche. Rellenar con espinaca blanqueada, ricota y cebolla rehogada. Enrollar y porcionar.",
    materiasPrimas: [{ idMateriaPrima: 2, cantidadNecesaria: 3 }, { idMateriaPrima: 4, cantidadNecesaria: 1 }, { idMateriaPrima: 20, cantidadNecesaria: 4 }, { idMateriaPrima: 8, cantidadNecesaria: 4 }, { idMateriaPrima: 5, cantidadNecesaria: 3 }, { idMateriaPrima: 14, cantidadNecesaria: 1 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "13:00", horaFin: "13:30" }],
  },
  {
    idReceta: 10, nombre: "Lasagna de carne", tiempoCoccion: "00:40", temperatura: 180,
    procedimiento: "Laminar masa al huevo en placas. Preparar un tuco con carne picada, cebolla y tomate. Armar capas de masa, relleno, muzzarella y salsa blanca.",
    materiasPrimas: [{ idMateriaPrima: 2, cantidadNecesaria: 4 }, { idMateriaPrima: 4, cantidadNecesaria: 1 }, { idMateriaPrima: 11, cantidadNecesaria: 4 }, { idMateriaPrima: 14, cantidadNecesaria: 1 }, { idMateriaPrima: 18, cantidadNecesaria: 3 }, { idMateriaPrima: 6, cantidadNecesaria: 2 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "13:30", horaFin: "14:00" }, { idMaquina: "maq-2", horaInicio: "14:00", horaFin: "14:30" }],
  },
  {
    idReceta: 11, nombre: "Agnolottis de pollo", tiempoCoccion: "00:07", temperatura: 100,
    procedimiento: "Cocinar y procesar la pechuga con cebolla rehogada y queso rallado. Rellenar la masa al huevo y cerrar en forma de media luna.",
    materiasPrimas: [{ idMateriaPrima: 2, cantidadNecesaria: 6 }, { idMateriaPrima: 4, cantidadNecesaria: 1 }, { idMateriaPrima: 12, cantidadNecesaria: 4 }, { idMateriaPrima: 14, cantidadNecesaria: 1 }, { idMateriaPrima: 23, cantidadNecesaria: 0.5 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "14:30", horaFin: "15:00" }, { idMaquina: "maq-2", horaInicio: "15:00", horaFin: "15:45" }],
  },
  {
    idReceta: 12, nombre: "Capelettis de carne", tiempoCoccion: "00:07", temperatura: 100,
    procedimiento: "Rehogar la carne picada con cebolla, condimentar y enfriar. Cortar cuadrados de masa, rellenar y doblar formando el capeletti.",
    materiasPrimas: [{ idMateriaPrima: 2, cantidadNecesaria: 6 }, { idMateriaPrima: 4, cantidadNecesaria: 1 }, { idMateriaPrima: 11, cantidadNecesaria: 4 }, { idMateriaPrima: 14, cantidadNecesaria: 1 }, { idMateriaPrima: 10, cantidadNecesaria: 0.1 }],
    maquinas: [{ idMaquina: "maq-1", horaInicio: "15:45", horaFin: "16:15" }, { idMaquina: "maq-2", horaInicio: "16:15", horaFin: "17:00" }],
  },
  {
    idReceta: 13, nombre: "Salsa fileto", tiempoCoccion: "00:30", temperatura: 90,
    procedimiento: "Rehogar cebolla en aceite de oliva, agregar tomate triturado y sal. Cocinar a fuego bajo y fraccionar en frascos de 250 g.",
    materiasPrimas: [{ idMateriaPrima: 18, cantidadNecesaria: 8 }, { idMateriaPrima: 14, cantidadNecesaria: 1 }, { idMateriaPrima: 19, cantidadNecesaria: 0.3 }, { idMateriaPrima: 10, cantidadNecesaria: 0.1 }],
    maquinas: [],
  },
  {
    idReceta: 14, nombre: "Salsa bolognesa", tiempoCoccion: "01:00", temperatura: 90,
    procedimiento: "Dorar carne picada con cebolla, agregar tomate triturado y cocinar lentamente. Fraccionar en frascos de 250 g.",
    materiasPrimas: [{ idMateriaPrima: 11, cantidadNecesaria: 3 }, { idMateriaPrima: 18, cantidadNecesaria: 6 }, { idMateriaPrima: 14, cantidadNecesaria: 1 }, { idMateriaPrima: 19, cantidadNecesaria: 0.3 }, { idMateriaPrima: 10, cantidadNecesaria: 0.1 }],
    maquinas: [],
  },
  {
    idReceta: 15, nombre: "Salsa blanca", tiempoCoccion: "00:20", temperatura: 85,
    procedimiento: "Hacer un roux con manteca y harina, incorporar la leche de a poco sin dejar de batir. Salar y fraccionar.",
    materiasPrimas: [{ idMateriaPrima: 20, cantidadNecesaria: 8 }, { idMateriaPrima: 22, cantidadNecesaria: 0.6 }, { idMateriaPrima: 2, cantidadNecesaria: 0.6 }, { idMateriaPrima: 10, cantidadNecesaria: 0.05 }],
    maquinas: [],
  },
  {
    idReceta: 16, nombre: "Salsa cuatro quesos", tiempoCoccion: "00:15", temperatura: 85,
    procedimiento: "Calentar la crema y fundir muzzarella, queso azul y queso rallado. Fraccionar en caliente.",
    materiasPrimas: [{ idMateriaPrima: 21, cantidadNecesaria: 5 }, { idMateriaPrima: 6, cantidadNecesaria: 1 }, { idMateriaPrima: 24, cantidadNecesaria: 0.8 }, { idMateriaPrima: 23, cantidadNecesaria: 0.8 }],
    maquinas: [],
  },
  {
    idReceta: 17, nombre: "Salsa rosa", tiempoCoccion: "00:25", temperatura: 85,
    procedimiento: "Preparar una base de fileto y agregar crema de leche al final de la cocción. Fraccionar en frascos de 250 g.",
    materiasPrimas: [{ idMateriaPrima: 18, cantidadNecesaria: 6 }, { idMateriaPrima: 21, cantidadNecesaria: 2 }, { idMateriaPrima: 14, cantidadNecesaria: 0.5 }, { idMateriaPrima: 10, cantidadNecesaria: 0.1 }],
    maquinas: [],
  },
  {
    idReceta: 18, nombre: "Salsa pesto", tiempoCoccion: "00:00", temperatura: 4,
    procedimiento: "Procesar albahaca, nuez, queso rallado y aceite de oliva hasta obtener una pasta. Envasar en frío.",
    materiasPrimas: [{ idMateriaPrima: 16, cantidadNecesaria: 1.5 }, { idMateriaPrima: 17, cantidadNecesaria: 0.5 }, { idMateriaPrima: 23, cantidadNecesaria: 0.8 }, { idMateriaPrima: 19, cantidadNecesaria: 2 }, { idMateriaPrima: 10, cantidadNecesaria: 0.05 }],
    maquinas: [],
  },
  {
    idReceta: 19, nombre: "Salsa de champiñones", tiempoCoccion: "00:20", temperatura: 85,
    procedimiento: "Saltear champiñones y cebolla en manteca, agregar crema de leche y reducir. Fraccionar en frascos de 250 g.",
    materiasPrimas: [{ idMateriaPrima: 15, cantidadNecesaria: 2 }, { idMateriaPrima: 14, cantidadNecesaria: 0.5 }, { idMateriaPrima: 22, cantidadNecesaria: 0.3 }, { idMateriaPrima: 21, cantidadNecesaria: 4 }],
    maquinas: [],
  },
];

export const RECETAS: Receta[] = RECETAS_SEMILLA.map((receta) => ({
  ...receta,
  materiasPrimas: receta.materiasPrimas.map((d) => {
    const mp = MATERIAS_PRIMAS_PRODUCCION.find((m) => m.idMateriaPrima === d.idMateriaPrima)!;
    return { ...d, idUnidad: mp.idUnidad, idMarca: mp.idMarca };
  }),
}));

// Mismo listado que el catálogo de ventas (SAMPLE_PRODUCTS). Las salsas se cuentan por frasco de 250 g.
export const PRODUCTOS_PRODUCCION: Producto[] = [
  { idProducto: 1, idReceta: 1, idUnidad: 1, idTipoProducto: 2, nombre: "Tallarines al huevo", precio: 2000, stockProducto: 45 },
  { idProducto: 2, idReceta: 2, idUnidad: 5, idTipoProducto: 3, nombre: "Ravioles de verdura", precio: 3500, stockProducto: 12 },
  { idProducto: 3, idReceta: 3, idUnidad: 1, idTipoProducto: 2, nombre: "Ñoquis de papa", precio: 2800, stockProducto: 30 },
  { idProducto: 4, idReceta: 4, idUnidad: 5, idTipoProducto: 3, nombre: "Sorrentinos de jamón y queso", precio: 4200, stockProducto: 0 },
  { idProducto: 5, idReceta: 5, idUnidad: 4, idTipoProducto: 1, nombre: "Spaghetti 500 g", precio: 2200, stockProducto: 220 },
  { idProducto: 6, idReceta: 1, idUnidad: 1, idTipoProducto: 2, nombre: "Fettuccine al huevo", precio: 2100, stockProducto: 20 },
  { idProducto: 7, idReceta: 6, idUnidad: 5, idTipoProducto: 3, nombre: "Ravioles de jamón y queso", precio: 3800, stockProducto: 18 },
  { idProducto: 8, idReceta: 7, idUnidad: 5, idTipoProducto: 3, nombre: "Ravioles de ricota y nuez", precio: 4000, stockProducto: 10 },
  { idProducto: 9, idReceta: 8, idUnidad: 5, idTipoProducto: 3, nombre: "Sorrentinos de calabaza y queso", precio: 4100, stockProducto: 14 },
  { idProducto: 10, idReceta: 9, idUnidad: 4, idTipoProducto: 3, nombre: "Canelones de verdura y ricota", precio: 4500, stockProducto: 16 },
  { idProducto: 11, idReceta: 10, idUnidad: 4, idTipoProducto: 3, nombre: "Lasagna de carne", precio: 4800, stockProducto: 12 },
  { idProducto: 12, idReceta: 11, idUnidad: 5, idTipoProducto: 3, nombre: "Agnolottis de pollo", precio: 4300, stockProducto: 9 },
  { idProducto: 13, idReceta: 12, idUnidad: 5, idTipoProducto: 3, nombre: "Capelettis de carne", precio: 4400, stockProducto: 11 },
  { idProducto: 14, idReceta: 13, idUnidad: 4, idTipoProducto: 4, nombre: "Salsa fileto 250 g", precio: 1800, stockProducto: 40 },
  { idProducto: 15, idReceta: 14, idUnidad: 4, idTipoProducto: 4, nombre: "Salsa bolognesa 250 g", precio: 2500, stockProducto: 30 },
  { idProducto: 16, idReceta: 15, idUnidad: 4, idTipoProducto: 4, nombre: "Salsa blanca 250 g", precio: 2000, stockProducto: 25 },
  { idProducto: 17, idReceta: 16, idUnidad: 4, idTipoProducto: 4, nombre: "Salsa cuatro quesos 250 g", precio: 2800, stockProducto: 20 },
  { idProducto: 18, idReceta: 17, idUnidad: 4, idTipoProducto: 4, nombre: "Salsa rosa 250 g", precio: 2200, stockProducto: 22 },
  { idProducto: 19, idReceta: 18, idUnidad: 4, idTipoProducto: 4, nombre: "Salsa pesto 250 g", precio: 2600, stockProducto: 15 },
  { idProducto: 20, idReceta: 19, idUnidad: 4, idTipoProducto: 4, nombre: "Salsa de champiñones 250 g", precio: 2900, stockProducto: 12 },
];

const redondear = (n: number) => Math.round(n * 1000) / 1000;

// Cantidades por defecto de una línea: las de su receta multiplicadas por las tandas.
export function consumoDeReceta(idProducto: number, tandas = 1): ConsumoMateriaPrima[] {
  const idReceta = PRODUCTOS_PRODUCCION.find((p) => p.idProducto === idProducto)?.idReceta;
  return (RECETAS.find((r) => r.idReceta === idReceta)?.materiasPrimas ?? []).map((m) => ({ idMateriaPrima: m.idMateriaPrima, cantidad: redondear(m.cantidadNecesaria * tandas) }));
}

// Total por materia prima de toda la orden (una misma materia prima puede repetirse entre productos).
export function consumoTotal(detalle: DetalleOrdenProduccion[]): ConsumoMateriaPrima[] {
  const totales = new Map<number, number>();
  for (const linea of detalle) for (const m of linea.materiasPrimas) totales.set(m.idMateriaPrima, Math.round(((totales.get(m.idMateriaPrima) ?? 0) + m.cantidad) * 1000) / 1000);
  return [...totales].map(([idMateriaPrima, cantidad]) => ({ idMateriaPrima, cantidad }));
}

const linea = (idProducto: number, cantidadRealGenerada: number | null = null, tandas = 1): DetalleOrdenProduccion => ({ idProducto, tandas, cantidadRealGenerada, materiasPrimas: consumoDeReceta(idProducto, tandas) });

export const ORDENES_PRODUCCION: OrdenProduccion[] = [
  { idOrdenProduccion: 1, idEmpleado: "emp-1", fechaEmision: "2026-10-01", fechaInicio: "2026-10-02", fechaFinalizacion: "2026-10-02", fechaVencimiento: "2026-10-20", estado: "Finalizada", nmrLote: 261002, detalle: [linea(1, 48), linea(6, 20)] },
  { idOrdenProduccion: 2, idEmpleado: "emp-3", fechaEmision: "2026-10-05", fechaInicio: null, fechaFinalizacion: null, fechaVencimiento: null, estado: "Cancelada", nmrLote: 261006, detalle: [linea(5)] },
  { idOrdenProduccion: 3, idEmpleado: "emp-1", fechaEmision: "2026-10-12", fechaInicio: "2026-10-13", fechaFinalizacion: null, fechaVencimiento: null, estado: "En proceso", nmrLote: 261013, detalle: [linea(2), linea(4)] },
  { idOrdenProduccion: 4, idEmpleado: "emp-2", fechaEmision: "2026-10-14", fechaInicio: null, fechaFinalizacion: null, fechaVencimiento: null, estado: "Pendiente", nmrLote: 261015, detalle: [linea(3, null, 2), linea(5)] },
];

// Vencimiento vigente de un producto: el del último lote finalizado que lo produjo.
export function getVencimientoProducto(idProducto: number): string | null {
  return ORDENES_PRODUCCION
    .filter((o) => o.estado === "Finalizada" && o.fechaVencimiento && o.detalle.some((d) => d.idProducto === idProducto))
    .sort((a, b) => (b.fechaFinalizacion ?? "").localeCompare(a.fechaFinalizacion ?? ""))[0]?.fechaVencimiento ?? null;
}

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
