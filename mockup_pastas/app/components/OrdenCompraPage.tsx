import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

import {
  MATERIAS_PRIMAS,
  ORDENES,
  PRESUPUESTOS,
  PROVEEDORES,
  formatMoney,
  getMarcaPorId,
  getOrdenPorId,
  getProveedorPorId,
} from "~/data/ordenes";

type OrdenItem = {
  key: number;
  idMateriaPrima: number | "";
  idMarca: number | "";
  cantidad: number;
  subtotal: number;
};

let nextItemKey = 1;

const createEmptyItem = (): OrdenItem => ({
  key: nextItemKey++,
  idMateriaPrima: "",
  idMarca: "",
  cantidad: 1,
  subtotal: 0,
});

const selectClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";
const inputClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";
const labelClasses =
  "block text-xs font-medium uppercase tracking-wide text-gray-500";

export default function OrdenCompraPage({
  ordenId,
  onClose,
}: {
  ordenId?: string;
  onClose?: () => void;
} = {}) {
  const navigate = useNavigate();
  const irVolver = () =>
    onClose ? onClose() : navigate("/compras/ordenes");

  const orden =
    ordenId && ordenId !== "nueva" ? getOrdenPorId(Number(ordenId)) : undefined;
  const esNueva = !orden;

  const [idProveedor, setIdProveedor] = useState(
    orden ? String(orden.idProveedor) : "",
  );
  const [idPresupuestoProveedor, setIdPresupuestoProveedor] = useState(
    orden && orden.idPresupuestoProveedor
      ? String(orden.idPresupuestoProveedor)
      : "",
  );
  const [fechaEmision, setFechaEmision] = useState(
    orden ? orden.fechaEmision : new Date().toISOString().slice(0, 10),
  );
  const [items, setItems] = useState<OrdenItem[]>(() =>
    orden
      ? orden.detalle.map((item) => ({
          key: nextItemKey++,
          idMateriaPrima: item.idMateriaPrima,
          idMarca: item.idMarca,
          cantidad: item.cantidad,
          subtotal: item.subtotal,
        }))
      : [createEmptyItem()],
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const montoTotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + (Number.isFinite(item.subtotal) ? item.subtotal : 0),
        0,
      ),
    [items],
  );

  const presupuestosDisponibles = PRESUPUESTOS.filter(
    (presupuesto) => presupuesto.idProveedor === Number(idProveedor),
  );

  const handleProveedorChange = (value: string) => {
    setIdProveedor(value);
    const proveedor = Number(value);
    const presupuestoValido = PRESUPUESTOS.find(
      (presupuesto) =>
        presupuesto.id === Number(idPresupuestoProveedor) &&
        presupuesto.idProveedor === proveedor,
    );
    if (!presupuestoValido) {
      setIdPresupuestoProveedor("");
    }
  };

  const handleMateriaPrimaChange = (key: number, idMateriaPrima: number | "") => {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) {
          return item;
        }
        return { ...item, idMateriaPrima, idMarca: "", subtotal: 0 };
      }),
    );
  };

  const handleMarcaChange = (key: number, idMarca: number | "") => {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) {
          return item;
        }
        const marca = idMarca
          ? getMarcaPorId(Number(idMarca))?.marca
          : undefined;
        const subtotal = marca ? item.cantidad * marca.precioUnitario : 0;
        return { ...item, idMarca, subtotal };
      }),
    );
  };

  const handleCantidadChange = (key: number, cantidad: number) => {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) {
          return item;
        }
        const marca = item.idMarca
          ? getMarcaPorId(Number(item.idMarca))?.marca
          : undefined;
        const subtotal = marca ? cantidad * marca.precioUnitario : 0;
        return { ...item, cantidad, subtotal };
      }),
    );
  };

  const handleSubtotalChange = (key: number, rawValue: string) => {
    const subtotal = Number(rawValue);
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, subtotal: Number.isFinite(subtotal) ? subtotal : 0 }
          : item,
      ),
    );
  };

  const handleAddItem = () => {
    setItems((current) => [...current, createEmptyItem()]);
  };

  const handleRemoveItem = (key: number) => {
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newErrors: string[] = [];
    if (!idProveedor) {
      newErrors.push("Debes seleccionar un proveedor.");
    }
    const itemsValidos = items.filter(
      (item) =>
        item.idMateriaPrima !== "" &&
        item.idMarca !== "" &&
        item.cantidad > 0,
    );
    if (itemsValidos.length === 0) {
      newErrors.push("Debes agregar al menos un ítem válido al detalle.");
    } else if (
      items.some(
        (item) => item.idMateriaPrima !== "" && item.idMarca === "",
      )
    ) {
      newErrors.push("Todos los ítems con materia prima deben tener una marca.");
    }

    setErrors(newErrors);
    setSaved(false);
    if (newErrors.length > 0) {
      return;
    }

    const ordenGuardada = {
      id: orden?.id,
      numero: orden?.numero ?? `OC-2024-${String(ORDENES.length + 1).padStart(4, "0")}`,
      idProveedor: Number(idProveedor),
      idPresupuestoProveedor: idPresupuestoProveedor
        ? Number(idPresupuestoProveedor)
        : null,
      fechaEmision,
      montoTotal,
      detalle: itemsValidos.map((item) => ({
        idMateriaPrima: item.idMateriaPrima,
        idMarca: item.idMarca,
        cantidad: item.cantidad,
        subtotal: item.subtotal,
      })),
    };

    console.log("Orden de compra guardada:", ordenGuardada);
    setSaved(true);
  };

  if (ordenId && ordenId !== "nueva" && !orden) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Orden no encontrada</h1>
        <p className="mt-2 text-sm text-gray-500">
          No existe una orden de compra con ese identificador.
        </p>
        <button
          type="button"
          onClick={irVolver}
          className="mt-6 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          Volver a Órdenes
        </button>
      </div>
    );
  }

  const proveedor = idProveedor ? getProveedorPorId(Number(idProveedor)) : undefined;

  const contenido = (
    <> 
      {saved && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Orden de compra guardada correctamente.
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
          <h2 className="text-base font-semibold text-gray-900">Cabecera</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="idProveedor" className={labelClasses}>
                Proveedor
              </label>
              <select
                id="idProveedor"
                value={idProveedor}
                onChange={(event) => handleProveedorChange(event.target.value)}
                className={`${selectClasses} mt-1`}
              >
                <option value="">Seleccionar proveedor</option>
                {PROVEEDORES.map((proveedor) => (
                  <option key={proveedor.idPersona} value={proveedor.idPersona}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="idPresupuestoProveedor" className={labelClasses}>
                Presupuesto Proveedor (opcional)
              </label>
              <select
                id="idPresupuestoProveedor"
                value={idPresupuestoProveedor}
                onChange={(event) =>
                  setIdPresupuestoProveedor(event.target.value)
                }
                disabled={!idProveedor}
                className={`${selectClasses} mt-1 disabled:bg-gray-100 disabled:text-gray-400`}
              >
                <option value="">Sin vincular presupuesto</option>
                {presupuestosDisponibles.map((presupuesto) => (
                  <option key={presupuesto.id} value={presupuesto.id}>
                    {presupuesto.numero} · {formatMoney(presupuesto.total)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fechaEmision" className={labelClasses}>
                Fecha de Emisión
              </label>
              <input
                id="fechaEmision"
                type="date"
                value={fechaEmision}
                onChange={(event) => setFechaEmision(event.target.value)}
                className={`${inputClasses} mt-1`}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              Detalle de la Orden
            </h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
            >
              + Agregar Ítem
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-3 font-medium">N°</th>
                  <th className="px-3 py-3 font-medium">Materia Prima</th>
                  <th className="px-3 py-3 font-medium">Marca</th>
                  <th className="px-3 py-3 font-medium">Cantidad</th>
                  <th className="px-3 py-3 font-medium">Subtotal</th>
                  <th className="px-3 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => {
                  const productoSeleccionado = item.idMateriaPrima
                    ? MATERIAS_PRIMAS.find(
                        (mp) => mp.id === Number(item.idMateriaPrima),
                      )
                    : undefined;
                  return (
                    <tr key={item.key}>
                      <td className="px-3 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-3 py-3">
                        <select
                          value={item.idMateriaPrima}
                          onChange={(event) =>
                            handleMateriaPrimaChange(
                              item.key,
                              Number(event.target.value),
                            )
                          }
                          className={selectClasses}
                        >
                          <option value="">Seleccionar materia prima</option>
                          {MATERIAS_PRIMAS.map((materiaPrima) => (
                            <option key={materiaPrima.id} value={materiaPrima.id}>
                              {materiaPrima.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={item.idMarca}
                          onChange={(event) =>
                            handleMarcaChange(item.key, Number(event.target.value))
                          }
                          disabled={!productoSeleccionado}
                          className={`${selectClasses} disabled:bg-gray-100 disabled:text-gray-400`}
                        >
                          <option value="">Seleccionar marca</option>
                          {productoSeleccionado?.marcas.map((marca) => (
                            <option key={marca.id} value={marca.id}>
                              {marca.nombre} · {formatMoney(marca.precioUnitario)}/u
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={1}
                          value={item.cantidad}
                          onChange={(event) =>
                            handleCantidadChange(item.key, Number(event.target.value))
                          }
                          className={inputClasses}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          value={item.subtotal}
                          onChange={(event) =>
                            handleSubtotalChange(item.key, event.target.value)
                          }
                          className={inputClasses}
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.key)}
                          aria-label={`Eliminar ítem ${index + 1}`}
                          className="inline-flex rounded-md p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                      No hay ítems cargados. Usa "Agregar Ítem" para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Monto total de la orden</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">
              {formatMoney(montoTotal)}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
              Guardar Orden
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
            {esNueva ? "Nueva Orden de Compra" : "Detalle de Orden de Compra"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {esNueva
              ? "Completa la cabecera y agrega los ítems para registrar la orden de compra."
              : `${orden?.numero} · ${proveedor?.nombre ?? "Proveedor"} · ${formatMoney(montoTotal)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={irVolver}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          Volver a Órdenes
        </button>
      </div>
      {contenido}
    </div>
  );
}