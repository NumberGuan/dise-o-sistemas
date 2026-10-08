import { createStore, useStore } from "./store";

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

export type ProveedorInput = Omit<Proveedor, "idPersona" | "idDomicilio">;
export type DomicilioInput = Omit<Domicilio, "id">;

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  { id: 1, nombre: "CUIT" },
  { id: 2, nombre: "CUIL" },
  { id: 3, nombre: "DNI" },
];

type ProveedoresState = {
  proveedores: Proveedor[];
  domicilios: Domicilio[];
};

const INITIAL_STATE: ProveedoresState = {
  domicilios: [
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
  ],
  proveedores: [
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
  ],
};

const store = createStore<ProveedoresState>(INITIAL_STATE);

export const useProveedores = () => useStore(store).proveedores;

export const getProveedores = () => store.get().proveedores;

export const getProveedorPorId = (id: number) =>
  store.get().proveedores.find((proveedor) => proveedor.idPersona === id);

export const getTipoDocumentoPorId = (id: number) =>
  TIPOS_DOCUMENTO.find((tipo) => tipo.id === id);

export const getDomicilioPorId = (id: number) =>
  store.get().domicilios.find((domicilio) => domicilio.id === id);

export const getNombreCompletoProveedor = (proveedor: Proveedor) =>
  proveedor.apellido
    ? `${proveedor.nombre} ${proveedor.apellido}`.trim()
    : proveedor.nombre;

export const getProximoIdPersona = () => {
  const { proveedores } = store.get();
  return proveedores.length
    ? Math.max(...proveedores.map((proveedor) => proveedor.idPersona)) + 1
    : 1;
};

export const createProveedor = (
  proveedor: ProveedorInput,
  domicilio: DomicilioInput,
): Proveedor => {
  const current = store.get();
  const idPersona = getProximoIdPersona();
  const idDomicilio = current.domicilios.length
    ? Math.max(...current.domicilios.map((d) => d.id)) + 1
    : 1;
  const nuevo: Proveedor = { ...proveedor, idPersona, idDomicilio };
  store.set({
    proveedores: [...current.proveedores, nuevo],
    domicilios: [...current.domicilios, { ...domicilio, id: idDomicilio }],
  });
  return nuevo;
};

export const updateProveedor = (
  idPersona: number,
  proveedor: ProveedorInput,
  domicilio: DomicilioInput,
): boolean => {
  const current = store.get();
  const existente = current.proveedores.find(
    (p) => p.idPersona === idPersona,
  );
  if (!existente) {
    return false;
  }
  const actualizado: Proveedor = {
    ...proveedor,
    idPersona,
    idDomicilio: existente.idDomicilio,
  };
  store.set({
    proveedores: current.proveedores.map((p) =>
      p.idPersona === idPersona ? actualizado : p,
    ),
    domicilios: current.domicilios.map((d) =>
      d.id === existente.idDomicilio ? { ...domicilio, id: d.id } : d,
    ),
  });
  return true;
};

export const deleteProveedor = (idPersona: number): boolean => {
  const current = store.get();
  const existente = current.proveedores.find(
    (p) => p.idPersona === idPersona,
  );
  if (!existente) {
    return false;
  }
  store.set({
    proveedores: current.proveedores.filter(
      (p) => p.idPersona !== idPersona,
    ),
    domicilios: current.domicilios.filter(
      (d) => d.id !== existente.idDomicilio,
    ),
  });
  return true;
};