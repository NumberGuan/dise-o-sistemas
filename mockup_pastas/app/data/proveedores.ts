export type TipoDocumento = {
  id: number;
  nombre: string;
};

export type Domicilio = {
  id: number;
  calle: string;
  localidad: string;
  provincia: string;
  piso?: string;
  departamento?: string;
};

export type Proveedor = {
  idPersona: number;
  estado: string;
  idDomicilio: number;
  idTipoDocumento: number;
  nroDocumento: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
};

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  { id: 1, nombre: "CUIT" },
  { id: 2, nombre: "CUIL" },
  { id: 3, nombre: "DNI" },
];

export const DOMICILIOS: Domicilio[] = [
  {
    id: 1,
    calle: "Av. de los Cerezos 550",
    localidad: "La Plata",
    provincia: "Buenos Aires",
  },
  {
    id: 2,
    calle: "Ruta 36 km 85",
    localidad: "Brandsen",
    provincia: "Buenos Aires",
  },
  {
    id: 3,
    calle: "Calle Alsina 842",
    localidad: "Berisso",
    provincia: "Buenos Aires",
  },
  {
    id: 4,
    calle: "Camino Centenario 3100",
    localidad: "City Bell",
    provincia: "Buenos Aires",
  },
  {
    id: 5,
    calle: "Av. 44 2750",
    localidad: "La Plata",
    provincia: "Buenos Aires",
  },
];

export const PROVEEDORES: Proveedor[] = [
  {
    idPersona: 1,
    estado: "Activo",
    idDomicilio: 1,
    idTipoDocumento: 1,
    nroDocumento: 30111222333,
    nombre: "Molino La Plata S.A.",
    apellido: "",
    email: "ventas@molinolaplata.com.ar",
    telefono: "0221 425-6677",
  },
  {
    idPersona: 2,
    estado: "Activo",
    idDomicilio: 2,
    idTipoDocumento: 1,
    nroDocumento: 30222333444,
    nombre: "AgroHarinas S.R.L.",
    apellido: "",
    email: "agroharinas@gmail.com",
    telefono: "0221 429-8899",
  },
  {
    idPersona: 3,
    estado: "Inactivo",
    idDomicilio: 3,
    idTipoDocumento: 1,
    nroDocumento: 30555666777,
    nombre: "Proveedora del Norte",
    apellido: "",
    email: "compras@proveedoranorte.com",
    telefono: "0381 456-7788",
  },
  {
    idPersona: 4,
    estado: "Activo",
    idDomicilio: 4,
    idTipoDocumento: 3,
    nroDocumento: 25111112,
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan.perez@gmail.com",
    telefono: "0221 15-334-5566",
  },
  {
    idPersona: 5,
    estado: "Activo",
    idDomicilio: 5,
    idTipoDocumento: 2,
    nroDocumento: 20222222,
    nombre: "María",
    apellido: "González",
    email: "maria.gonzalez@gmail.com",
    telefono: "0221 15-667-8899",
  },
];

export const getProveedorPorId = (id: number) =>
  PROVEEDORES.find((proveedor) => proveedor.idPersona === id);

export const getTipoDocumentoPorId = (id: number) =>
  TIPOS_DOCUMENTO.find((tipo) => tipo.id === id);

export const getDomicilioPorId = (id: number) =>
  DOMICILIOS.find((domicilio) => domicilio.id === id);

export const getNombreCompletoProveedor = (proveedor: Proveedor) =>
  proveedor.apellido
    ? `${proveedor.nombre} ${proveedor.apellido}`.trim()
    : proveedor.nombre;