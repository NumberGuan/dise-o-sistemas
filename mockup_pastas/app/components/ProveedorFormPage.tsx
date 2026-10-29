import { CatalogField } from "~/components/InlineCatalog";
import PhoneFields from "~/components/PhoneFields";
import { validatePhones } from "~/data/phones";
import { useCatalogs } from "~/components/CatalogProvider";
import { catalogAddressData } from "~/data/catalogs";
import AddressFields from "~/components/AddressFields";
import { validateTabulatedAddress } from "~/data/domicilios";
import BackToListButton from "~/components/BackToListButton";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

import {
  createProveedor,
  getDomicilioPorId,
  getProximoIdPersona,
  getProveedorPorId,
  updateProveedor,
  type DomicilioInput,
  type ProveedorInput,
} from "~/data/proveedores";

const ESTADOS = ["Activo", "Inactivo"];

const selectClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";
const inputClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";
const readOnlyClasses =
  "w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700";
const labelClasses =
  "block text-xs font-medium uppercase tracking-wide text-gray-500";

export default function ProveedorFormPage({
  proveedorId,
  onClose,
}: {
  proveedorId?: string;
  onClose?: () => void;
} = {}) {
  const catalogs = useCatalogs();
  const TIPOS_DOCUMENTO = catalogs["tipos-documento"].map(item => ({ id: Number(item.id), nombre: item.name, active: item.active }));
  const getTipoDocumentoPorId = (id: number) => TIPOS_DOCUMENTO.find(item => item.id === id);
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/proveedores");

  const proveedor = proveedorId
    ? getProveedorPorId(Number(proveedorId))
    : undefined;
  const esModificacion = Boolean(proveedor);
  const domicilioOrigen = proveedor
    ? getDomicilioPorId(proveedor.idDomicilio)
    : undefined;

  const idPersona = proveedor ? proveedor.idPersona : getProximoIdPersona();

  const [nombre, setNombre] = useState(proveedor?.nombre ?? "");
  const [idTipoDocumento, setIdTipoDocumento] = useState(
    proveedor ? String(proveedor.idTipoDocumento) : "",
  );
  const [nroDocumento, setNroDocumento] = useState(
    proveedor ? String(proveedor.nroDocumento) : "",
  );
  const [email, setEmail] = useState(proveedor?.email ?? "");
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? "");
  const [telefonosAdicionales, setTelefonosAdicionales] = useState(proveedor?.telefonosAdicionales ?? []);
  const [calle, setCalle] = useState(domicilioOrigen?.calle ?? "");
  const [altura, setAltura] = useState(domicilioOrigen?.altura ?? "");
  const [localidad, setLocalidad] = useState(domicilioOrigen?.localidad ?? "");
  const [provincia, setProvincia] = useState(
    domicilioOrigen?.provincia ?? "",
  );
  const [piso, setPiso] = useState(domicilioOrigen?.piso ?? "");
  const [departamento, setDepartamento] = useState(
    domicilioOrigen?.departamento ?? "",
  );
  const [estado, setEstado] = useState(proveedor?.estado ?? ESTADOS[0]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  if (proveedorId && !proveedor) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Proveedor no encontrado
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          No existe un proveedor con ese identificador.
        </p>
        <BackToListButton onClick={() => navigate("/compras/proveedores")} />
      </div>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newErrors: string[] = [];
    if (!nombre.trim()) {
      newErrors.push("Debes ingresar la razón social.");
    }
    if (!idTipoDocumento) {
      newErrors.push("Debes seleccionar el tipo de documento.");
    }
    if (!nroDocumento || Number(nroDocumento) <= 0) {
      newErrors.push("Debes ingresar un número de documento válido.");
    }
    if (!email.trim()) {
      newErrors.push("Debes ingresar el e-mail.");
    }
    let phones;
    try { phones = validatePhones(telefono, telefonosAdicionales); }
    catch (error) { newErrors.push((error as Error).message); }
    try {
      validateTabulatedAddress({ province: provincia, locality: localidad, street: calle, streetNumber: altura, floor: piso, apartment: departamento }, domicilioOrigen ? { province: domicilioOrigen.provincia, locality: domicilioOrigen.localidad, street: domicilioOrigen.calle, streetNumber: domicilioOrigen.altura, floor: domicilioOrigen.piso ?? "", apartment: domicilioOrigen.departamento ?? "" } : undefined, catalogAddressData(catalogs));
    } catch (error) { newErrors.push((error as Error).message); }

    setErrors(newErrors);
    setSaved(false);
    if (newErrors.length > 0 || !phones) {
      return;
    }

    const domicilio: DomicilioInput = {
      calle: calle.trim(),
      altura: altura.trim(),
      localidad: localidad.trim(),
      provincia: provincia.trim(),
      piso: piso.trim() || undefined,
      departamento: departamento.trim() || undefined,
    };

    const input: ProveedorInput = {
      idTipoDocumento: Number(idTipoDocumento),
      nroDocumento: Number(nroDocumento),
      nombre: nombre.trim(),
      apellido: "",
      email: email.trim(),
      telefono: phones.phone,
      telefonosAdicionales: phones.additionalPhones,
      estado,
    };

    if (esModificacion && proveedor) {
      updateProveedor(proveedor.idPersona, input, domicilio, catalogAddressData(catalogs));
    } else {
      createProveedor(input, domicilio, catalogAddressData(catalogs));
    }

    setSaved(true);
    if (onClose) {
      onClose();
    }
  };

  const contenido = (
    <>
      {saved && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {esModificacion
            ? "Proveedor modificado correctamente."
            : "Proveedor guardado correctamente."}
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mb-6 space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">
            Datos del Proveedor
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nombre" className={labelClasses}>
                Razón Social
              </label>
              <input
                required id="nombre"
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej: Molino La Plata S.A."
                className={`${inputClasses} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="idPersona" className={labelClasses}>
                Código de Persona
              </label>
              <input
                id="idPersona"
                type="number"
                readOnly
                value={idPersona}
                className={`${readOnlyClasses} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="estado" className={labelClasses}>
                Estado
              </label>
              <select
                id="estado"
                value={estado}
                onChange={(event) => setEstado(event.target.value)}
                className={`${selectClasses} mt-1`}
              >
                {ESTADOS.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="idTipoDocumento" className={labelClasses}>
                Tipo de Documento
              </label>
              <CatalogField catalog="tipos-documento" onCreated={entry => setIdTipoDocumento(entry.id)}><select
                required id="idTipoDocumento"
                value={idTipoDocumento}
                onChange={(event) => setIdTipoDocumento(event.target.value)}
                className={`${selectClasses} mt-1`}
              >
                <option value="">Seleccionar tipo</option>
                {TIPOS_DOCUMENTO.filter(item => item.active || item.id === proveedor?.idTipoDocumento).map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select></CatalogField>
            </div>

            <div>
              <label htmlFor="nroDocumento" className={labelClasses}>
                Nro. de Documento
              </label>
              <input
                required id="nroDocumento"
                type="number"
                min={1}
                value={nroDocumento}
                onChange={(event) => setNroDocumento(event.target.value)}
                placeholder="Ej: 30111222333"
                className={`${inputClasses} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClasses}>
                e-mail
              </label>
              <input
                required id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Ej: ventas@empresa.com"
                className={`${inputClasses} mt-1`}
              />
            </div>

          </div>

          <div className="mt-4"><PhoneFields primary={telefono} additional={telefonosAdicionales} onChange={(primary, additional) => { setTelefono(primary); setTelefonosAdicionales(additional); }} /></div>
          <div className="mt-4"><AddressFields previous={domicilioOrigen ? { province: domicilioOrigen.provincia, locality: domicilioOrigen.localidad, street: domicilioOrigen.calle, streetNumber: domicilioOrigen.altura, floor: domicilioOrigen.piso ?? "", apartment: domicilioOrigen.departamento ?? "" } : undefined} value={{ province: provincia, locality: localidad, street: calle, streetNumber: altura, floor: piso, apartment: departamento }} onChange={value => {
            setProvincia(value.province); setLocalidad(value.locality); setCalle(value.street);
            setAltura(value.streetNumber); setPiso(value.floor); setDepartamento(value.apartment);
          }} /></div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={irVolver}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
            >
              {esModificacion ? "Guardar Cambios" : "Guardar Proveedor"}
            </button>
          </div>
        </section>
      </form>
    </>
  );

  if (onClose) {
    return contenido;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="sticky top-16 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 py-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {esModificacion ? "Modificar Proveedor" : "Nuevo Proveedor"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {esModificacion
              ? "Actualiza los datos del proveedor y guarda los cambios."
              : "Registra un nuevo proveedor en el sistema."}
          </p>
        </div>
        <BackToListButton onClick={irVolver} />
      </div>
      {contenido}
    </div>
  );
}
