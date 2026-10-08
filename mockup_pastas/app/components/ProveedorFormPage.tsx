import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

import {
  createProveedor,
  getDomicilioPorId,
  getProximoIdPersona,
  getProveedorPorId,
  TIPOS_DOCUMENTO,
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
  const [calle, setCalle] = useState(domicilioOrigen?.calle ?? "");
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
        <button
          type="button"
          onClick={() => navigate("/compras/proveedores")}
          className="mt-6 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          Volver a Proveedores
        </button>
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
    if (!telefono.trim()) {
      newErrors.push("Debes ingresar el teléfono.");
    }
    if (!calle.trim()) {
      newErrors.push("Debes ingresar la calle.");
    }
    if (!localidad.trim()) {
      newErrors.push("Debes ingresar la localidad.");
    }
    if (!provincia.trim()) {
      newErrors.push("Debes ingresar la provincia.");
    }

    setErrors(newErrors);
    setSaved(false);
    if (newErrors.length > 0) {
      return;
    }

    const domicilio: DomicilioInput = {
      calle: calle.trim(),
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
      telefono: telefono.trim(),
      estado,
    };

    if (esModificacion && proveedor) {
      updateProveedor(proveedor.idPersona, input, domicilio);
    } else {
      createProveedor(input, domicilio);
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
                id="nombre"
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
              <select
                id="idTipoDocumento"
                value={idTipoDocumento}
                onChange={(event) => setIdTipoDocumento(event.target.value)}
                className={`${selectClasses} mt-1`}
              >
                <option value="">Seleccionar tipo</option>
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="nroDocumento" className={labelClasses}>
                Nro. de Documento
              </label>
              <input
                id="nroDocumento"
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
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Ej: ventas@empresa.com"
                className={`${inputClasses} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="telefono" className={labelClasses}>
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                placeholder="Ej: (0221) 425-6677"
                className={`${inputClasses} mt-1`}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="calle" className={labelClasses}>
                Calle
              </label>
              <input
                id="calle"
                type="text"
                value={calle}
                onChange={(event) => setCalle(event.target.value)}
                placeholder="Calle y altura, ej: Av. de los Cerezos 550"
                className={`${inputClasses} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="piso" className={labelClasses}>
                Piso
              </label>
              <input
                id="piso"
                type="text"
                value={piso}
                onChange={(event) => setPiso(event.target.value)}
                placeholder="Ej: 2"
                className={`${inputClasses} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="localidad" className={labelClasses}>
                Localidad
              </label>
              <input
                id="localidad"
                type="text"
                value={localidad}
                onChange={(event) => setLocalidad(event.target.value)}
                placeholder="Ej: La Plata"
                className={`${inputClasses} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="provincia" className={labelClasses}>
                Provincia
              </label>
              <input
                id="provincia"
                type="text"
                value={provincia}
                onChange={(event) => setProvincia(event.target.value)}
                placeholder="Ej: Buenos Aires"
                className={`${inputClasses} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="departamento" className={labelClasses}>
                Departamento
              </label>
              <input
                id="departamento"
                type="text"
                value={departamento}
                onChange={(event) => setDepartamento(event.target.value)}
                placeholder="Ej: B"
                className={`${inputClasses} mt-1`}
              />
            </div>
          </div>

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
        <button
          type="button"
          onClick={irVolver}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          Volver a Proveedores
        </button>
      </div>
      {contenido}
    </div>
  );
}