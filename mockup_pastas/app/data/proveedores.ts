import { validateTabulatedAddress, type AddressCatalog } from "./domicilios";
import { createStore, useStore } from "./store";
import { validatePhones } from "./phones";

export type TipoDocumento = {
  id: number;
  nombre: string;
};

export type Domicilio = {
  id: number;
  calle: string;
  altura: string;
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
  telefonosAdicionales?: string[];
};

export type ProveedorInput = Omit<Proveedor, "idPersona" | "idDomicilio">;
export type DomicilioInput = Omit<Domicilio, "id">;

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  { id: 1, nombre: "CUIT" },
  { id: 2, nombre: "CUIL" },
  { id: 3, nombre: "DNI" },
];

export type ProveedoresState = {
  proveedores: Proveedor[];
  domicilios: Domicilio[];
};

export const getTipoDocumentoPorId = (id: number) =>
  TIPOS_DOCUMENTO.find((tipo) => tipo.id === id);

export const getNombreCompletoProveedor = (proveedor: Proveedor) =>
  proveedor.apellido
    ? `${proveedor.nombre} ${proveedor.apellido}`.trim()
    : proveedor.nombre;
function validateDomicilio(domicilio: DomicilioInput, catalog?: AddressCatalog, previous?: Domicilio) {
  validateTabulatedAddress({ province: domicilio.provincia, locality: domicilio.localidad, street: domicilio.calle, streetNumber: domicilio.altura, floor: domicilio.piso ?? "", apartment: domicilio.departamento ?? "" }, previous ? { province: previous.provincia, locality: previous.localidad, street: previous.calle, streetNumber: previous.altura, floor: previous.piso ?? "", apartment: previous.departamento ?? "" } : undefined, catalog);
}

export function createSuppliers(initial: ProveedoresState) {
  const store = createStore(initial);

  const useProveedores = () => useStore(store).proveedores;

  const getProveedores = () => store.get().proveedores;

  const getProveedorPorId = (id: number) =>
    store.get().proveedores.find((proveedor) => proveedor.idPersona === id);

  const getDomicilioPorId = (id: number) =>
    store.get().domicilios.find((domicilio) => domicilio.id === id);

  const getProximoIdPersona = () => {
    const { proveedores } = store.get();
    return proveedores.length
      ? Math.max(...proveedores.map((proveedor) => proveedor.idPersona)) + 1
      : 1;
  };

  const createProveedor = (
    proveedor: ProveedorInput,
    domicilio: DomicilioInput,
    catalog?: AddressCatalog,
  ): Proveedor => {
    validateDomicilio(domicilio, catalog);
    const phones = validatePhones(proveedor.telefono, proveedor.telefonosAdicionales);
    const current = store.get();
    const idPersona = getProximoIdPersona();
    const idDomicilio = current.domicilios.length
      ? Math.max(...current.domicilios.map((d) => d.id)) + 1
      : 1;
    const nuevo: Proveedor = { ...proveedor, telefono: phones.phone, telefonosAdicionales: phones.additionalPhones, idPersona, idDomicilio };
    store.set({
      proveedores: [...current.proveedores, nuevo],
      domicilios: [...current.domicilios, { ...domicilio, id: idDomicilio }],
    });
    return nuevo;
  };

  const updateProveedor = (
    idPersona: number,
    proveedor: ProveedorInput,
    domicilio: DomicilioInput,
    catalog?: AddressCatalog,
  ): boolean => {
    const current = store.get();
    const existente = current.proveedores.find(
      (p) => p.idPersona === idPersona,
    );
    if (!existente) {
      return false;
    }
    validateDomicilio(domicilio, catalog, current.domicilios.find(item => item.id === existente.idDomicilio));
    const phones = validatePhones(proveedor.telefono, proveedor.telefonosAdicionales ?? existente.telefonosAdicionales);
    const actualizado: Proveedor = {
      ...proveedor,
      telefono: phones.phone,
      telefonosAdicionales: phones.additionalPhones,
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

  const deleteProveedor = (idPersona: number): boolean => {
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
  return { useProveedores, getProveedores, getProveedorPorId, getDomicilioPorId, getProximoIdPersona, createProveedor, updateProveedor, deleteProveedor };
}
