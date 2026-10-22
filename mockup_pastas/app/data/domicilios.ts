// Catálogo inicial de la maqueta. Las relaciones se definen una sola vez para
// clientes, proveedores y empleados; ampliar aquí al incorporar zonas de atención.
export const PROVINCIAS = [
  { id: "ba", nombre: "Buenos Aires" },
  { id: "caba", nombre: "Ciudad Autónoma de Buenos Aires" },
  { id: "cba", nombre: "Córdoba" },
  { id: "sf", nombre: "Santa Fe" },
] as const;

export const LOCALIDADES = [
  { id: "trenque-lauquen", provinciaId: "ba", nombre: "Trenque Lauquen" },
  { id: "la-plata", provinciaId: "ba", nombre: "La Plata" },
  { id: "brandsen", provinciaId: "ba", nombre: "Brandsen" },
  { id: "berisso", provinciaId: "ba", nombre: "Berisso" },
  { id: "city-bell", provinciaId: "ba", nombre: "City Bell" },
  { id: "moron", provinciaId: "ba", nombre: "Morón" },
  { id: "san-martin", provinciaId: "ba", nombre: "San Martín" },
  { id: "haedo", provinciaId: "ba", nombre: "Haedo" },
  { id: "villa-ballester", provinciaId: "ba", nombre: "Villa Ballester" },
  { id: "castelar", provinciaId: "ba", nombre: "Castelar" },
  { id: "ituzaingo", provinciaId: "ba", nombre: "Ituzaingó" },
  { id: "caba", provinciaId: "caba", nombre: "Ciudad Autónoma de Buenos Aires" },
  { id: "cordoba", provinciaId: "cba", nombre: "Córdoba" },
  { id: "rosario", provinciaId: "sf", nombre: "Rosario" },
  { id: "santa-fe", provinciaId: "sf", nombre: "Santa Fe" },
] as const;

const callesPorLocalidad: Record<string, string[]> = {
  // Plano municipal, julio de 2023 (selección de calles, no padrón exhaustivo):
  // https://www.trenquelauquen.gov.ar/wordpress/wp-content/uploads/Mapa-Trenque-Lauquen-actualizado-Julio-2023.pdf
  "trenque-lauquen": [
    "12 de Abril", "25 de Mayo", "9 de Julio", "Agote", "Alberdi",
    "Alberto Baretta", "Alfredo Palacios", "Almafuerte", "Alsina", "Ameghino",
    "Arturo Jauretche", "Avellaneda", "Baldovino", "Batallón 2 de Infantería",
    "Belgrano", "Bernardino Arzac", "Blandengues", "Bordignon", "Braille", "Brown",
    "Carlos Gardel", "Carmen Granada", "Caseros", "Castelli", "Chaumeil", "Cicoria",
    "Colón", "Combatientes de Malvinas", "Cura Brochero", "Curie", "Derqui",
    "Di Gerónimo", "División Norte", "Dorrego", "Dr. René Favaloro", "Edison",
    "Eleuteria Leiva", "Elsa Bossie", "Estrada", "Eva Perón", "Farrington",
    "Finochietto", "Fleming", "Fotheringham", "Freyre", "Frondizi", "Galbiatti",
    "Glattstein", "Hernández", "Hermana Marcela", "Hoffman", "Houssay",
    "Inocencia Suárez", "J. J. Paso", "José María Fabris", "Juan Llorens", "Juan Refusta",
    "Kienast", "Lagos", "Lavalle", "Ledesma", "Leloir", "Levalle",
    "Lisandro de la Torre", "Llambías", "Los Alerces", "Los Caldenes", "Los Cedros",
    "Los Chañares", "Los Ciruelos", "Los Laureles", "Los Manzanos", "Los Naranjos",
    "Los Ombúes", "Los Pinos", "Los Sauces", "Magdalena", "Mahatma Gandhi",
    "Maldonado", "Marconi", "Mitre", "Mollard", "Monferrand", "Morosini",
    "Namuncurá", "Nelson", "Nolo Ferreira", "Orellana", "Oro", "Orzali", "Pacheco",
    "Padre Mujica", "Papa Francisco", "Papa Juan Pablo II", "Paredes",
    "Pasaje Argentino", "Pasaje Las Cortaderas", "Pasteur", "Paul Harris", "Pellegrini",
    "Perú", "Pincén", "Quintana", "Racedo", "Raúl González", "Roca", "Rodón",
    "Saavedra", "Sabin", "Sáenz Peña", "Salk", "Salta", "San Lorenzo", "San Martín",
    "Sarmiento", "Scalabrini Ortiz", "Schweitzer", "Simini", "Sosa", "Tala",
    "T. Davis", "Trejo", "Tucumán", "Urquiza", "Uruguay", "Venezuela",
    "Viani", "Vignau", "Villegas", "Wilde", "Wintter", "Wysocki", "Zelasqui",
  ],
  "la-plata": ["Av. de los Cerezos", "Av. 44", "Calle 7", "Calle 12"],
  brandsen: ["Ruta 36", "Av. Mitre"],
  berisso: ["Calle Alsina", "Av. Montevideo"],
  "city-bell": ["Camino Centenario", "Calle Cantilo"],
  moron: ["Av. Rivadavia", "Belgrano"],
  "san-martin": ["Belgrano", "Av. San Martín"],
  haedo: ["Italia", "Av. Rivadavia"],
  "villa-ballester": ["San Lorenzo", "Alvear"],
  castelar: ["Las Heras", "Av. Rivadavia"],
  ituzaingo: ["Calle 25 de Mayo", "Av. Rivadavia"],
  caba: ["Av. Corrientes", "Av. Rivadavia", "Av. Santa Fe"],
  cordoba: ["Av. Colón", "Av. General Paz"],
  rosario: ["Av. Pellegrini", "Córdoba"],
  "santa-fe": ["San Martín", "Av. Freyre"],
};

export const CALLES = Object.entries(callesPorLocalidad).flatMap(([localidadId, nombres]) =>
  nombres.map((nombre, index) => ({ id: `${localidadId}-${index + 1}`, localidadId, nombre })),
);

// La comparación conserva el nombre original para mostrarlo y guardarlo.
export function searchStreets<T extends { nombre: string }>(streets: readonly T[], query: string): T[] {
  const normalize = (text: string) => text.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR");
  const prefix = normalize(query);
  return streets.filter(street => normalize(street.nombre).startsWith(prefix))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"));
}

export type AddressFields = {
  province: string;
  locality: string;
  street: string;
  streetNumber: string;
  floor: string;
  apartment: string;
};

export const EMPTY_ADDRESS: AddressFields = {
  province: "", locality: "", street: "", streetNumber: "", floor: "", apartment: "",
};

export function addressOptions(province: string, locality: string) {
  const provincia = PROVINCIAS.find(item => item.nombre === province);
  const localidades = LOCALIDADES.filter(item => item.provinciaId === provincia?.id);
  const selected = localidades.find(item => item.nombre === locality);
  return { localidades, calles: CALLES.filter(item => item.localidadId === selected?.id) };
}

export function isTabulatedAddress(address: Pick<AddressFields, "province" | "locality" | "street">) {
  return addressOptions(address.province, address.locality).calles.some(item => item.nombre === address.street);
}

export function validateTabulatedAddress(address: AddressFields, previous?: AddressFields) {
  const retained = previous && address.province === previous.province
    && address.locality === previous.locality && address.street === previous.street;
  if ((!isTabulatedAddress(address) && !retained) || !address.province || !address.locality || !address.street || !address.streetNumber.trim()) {
    throw new Error("Seleccioná provincia, localidad y calle del catálogo y completá la altura o kilómetro.");
  }
}
