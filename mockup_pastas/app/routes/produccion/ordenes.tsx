import PrintVoucher from "~/components/PrintVoucher";
import { useProductionCatalogs } from "~/components/CatalogProvider";
import RecordPage, { RecordNotFound } from "~/components/RecordPage";
import { useRecordScreen } from "~/utils/useRecordScreen";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router";
import { SAMPLE_EMPLOYEES } from "~/data/employees";
import { SAMPLE_MACHINES } from "~/data/maintenance";
import {
  ESTADOS_ORDEN_PRODUCCION, MATERIAS_PRIMAS_PRODUCCION, ORDENES_PRODUCCION, PRODUCTOS_PRODUCCION,
  codigo, consumoDeReceta, consumoTotal, getMateriaPrima, getProducto, getReceta, siguienteId,
  type ConsumoMateriaPrima, type DetalleOrdenProduccion, type EstadoOrdenProduccion, type OrdenProduccion,
} from "~/data/produccion";
import { AnimatedBadge, Collapse, EASE_OUT, HoldToConfirm, rowMotion, toast } from "~/components/motion";

const field = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-gray-700";
const badge = (s: EstadoOrdenProduccion) => s === "Pendiente" ? "bg-amber-100 text-amber-800" : s === "En proceso" ? "bg-sky-100 text-sky-800" : s === "Finalizada" ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700";
const today = () => new Date().toISOString().slice(0, 10);
const numero = (o: OrdenProduccion) => codigo("OP", o.idOrdenProduccion, 4);
const empleado = (id: string) => SAMPLE_EMPLOYEES.find((e) => e.id === id)?.name ?? "—";

type MateriaRow = { key: string; idMateriaPrima: string; cantidad: string };
type ProductoRow = { key: string; idProducto: string; tandas: number; materias: MateriaRow[] };

const MAX_TANDAS = 99;
const escalar = (cantidad: string, factor: number) => cantidad === "" || !Number.isFinite(Number(cantidad)) ? cantidad : String(Math.round(Number(cantidad) * factor * 1000) / 1000);

function TandasCounter({ value, onChange, label }: { value: number; onChange: (next: number) => void; label: string }) {
  const btn = "flex h-10 w-10 items-center justify-center text-lg font-semibold text-gray-700 transition hover:bg-amber-50 hover:text-amber-800 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-600";
  return (
    <div className="mt-1 inline-flex h-10 items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} className={btn} aria-label={`Restar cantidad de ${label}`}>−</button>
      <input
        type="number" min="1" max={MAX_TANDAS} step="1" inputMode="numeric" value={value}
        onChange={(e) => { const n = Math.trunc(Number(e.target.value)); if (n >= 1 && n <= MAX_TANDAS) onChange(n); }}
        aria-label={`Cantidad de ${label}`}
        className="w-12 border-x border-gray-300 text-center text-sm font-semibold tabular-nums text-gray-900 outline-none [appearance:textfield] focus:bg-amber-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= MAX_TANDAS} className={btn} aria-label={`Sumar cantidad de ${label}`}>+</button>
    </div>
  );
}

let rowSeq = 0;
const nextKey = (prefix: string) => `${prefix}-${++rowSeq}`;
const toMateriaRows = (consumo: ConsumoMateriaPrima[]): MateriaRow[] => consumo.map((m) => ({ key: nextKey("mp"), idMateriaPrima: String(m.idMateriaPrima), cantidad: String(m.cantidad) }));
const stockDe = (idMateriaPrima: number) => getMateriaPrima(idMateriaPrima)?.stockMateriaPrima ?? 0;
const nombresMp = (consumo: ConsumoMateriaPrima[]) => consumo.map((m) => getMateriaPrima(m.idMateriaPrima)?.nombre).join(", ");

// Materias primas cuyo consumo total supera el stock disponible.
const faltantes = (consumo: ConsumoMateriaPrima[]) => consumo.filter((m) => m.cantidad > stockDe(m.idMateriaPrima));

function ConsumoResumen({ consumo }: { consumo: ConsumoMateriaPrima[] }) {
  const { formatCantidad } = useProductionCatalogs();
  if (consumo.length === 0) return <p className="text-sm text-gray-500">Sin materias primas cargadas.</p>;
  return (
    <ul className="divide-y divide-gray-100 text-sm">
      {consumo.map((m) => {
        const mp = getMateriaPrima(m.idMateriaPrima);
        const falta = m.cantidad > stockDe(m.idMateriaPrima);
        return (
          <li key={m.idMateriaPrima} className="flex items-center justify-between gap-3 py-2">
            <span className="text-gray-800">{mp?.nombre ?? "—"}</span>
            <span className={`text-right tabular-nums ${falta ? "font-semibold text-rose-700" : "text-gray-900"}`}>
              {mp ? formatCantidad(m.cantidad, mp.idUnidad) : m.cantidad}
              <span className="block text-xs font-normal text-gray-500">Stock: {mp ? formatCantidad(mp.stockMateriaPrima, mp.idUnidad) : "—"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ProductionOrderForm({ order, onCancel, onSave }: { order: OrdenProduccion | null; onCancel: () => void; onSave: (o: OrdenProduccion) => void }) {
  const [id] = useState(order?.idOrdenProduccion ?? siguienteId(ORDENES_PRODUCCION.map((o) => o.idOrdenProduccion)));
  const [fechaEmision, setFechaEmision] = useState(order?.fechaEmision ?? today());
  const [idEmpleado, setIdEmpleado] = useState(order?.idEmpleado ?? "");
  const [lote, setLote] = useState(String(order?.nmrLote ?? siguienteId(ORDENES_PRODUCCION.map((o) => o.nmrLote))));
  const { getUnidad } = useProductionCatalogs();
  const [productos, setProductos] = useState<ProductoRow[]>(() => (order?.detalle ?? []).map((d) => ({ key: nextKey("p"), idProducto: String(d.idProducto), tandas: d.tandas ?? 1, materias: toMateriaRows(d.materiasPrimas) })));
  const [error, setError] = useState("");

  const updateRow = (key: string, change: (row: ProductoRow) => ProductoRow) => setProductos((rows) => rows.map((row) => row.key === key ? change(row) : row));
  const updateMateria = (rowKey: string, mpKey: string, patch: Partial<MateriaRow>) => updateRow(rowKey, (row) => ({ ...row, materias: row.materias.map((m) => m.key === mpKey ? { ...m, ...patch } : m) }));
  // Al elegir el producto se precargan las cantidades de su receta.
  const selectProducto = (rowKey: string, idProducto: string) => updateRow(rowKey, (row) => ({ ...row, idProducto, materias: idProducto ? toMateriaRows(consumoDeReceta(Number(idProducto), row.tandas)) : [] }));
  // Escala proporcionalmente las cantidades actuales (respeta ajustes manuales).
  const setTandas = (rowKey: string, tandas: number) => updateRow(rowKey, (row) => ({ ...row, tandas, materias: row.materias.map((m) => ({ ...m, cantidad: escalar(m.cantidad, tandas / row.tandas) })) }));

  const detalleBorrador: DetalleOrdenProduccion[] = productos.filter((p) => p.idProducto).map((p) => ({
    idProducto: Number(p.idProducto),
    tandas: p.tandas,
    cantidadRealGenerada: null,
    materiasPrimas: p.materias.filter((m) => m.idMateriaPrima && Number(m.cantidad) > 0).map((m) => ({ idMateriaPrima: Number(m.idMateriaPrima), cantidad: Number(m.cantidad) })),
  }));
  const consumo = consumoTotal(detalleBorrador);
  const sinStock = faltantes(consumo);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEmision)) return setError("Ingresá una fecha de emisión válida.");
    if (!idEmpleado) return setError("Seleccioná el empleado responsable.");
    if (!(Number(lote) > 0)) return setError("Ingresá un número de lote válido.");
    if (ORDENES_PRODUCCION.some((o) => o.nmrLote === Number(lote) && o.idOrdenProduccion !== id)) return setError("Ese número de lote ya está asignado a otra orden.");
    if (productos.length === 0) return setError("Agregá al menos un producto a la orden.");
    if (productos.some((p) => !p.idProducto)) return setError("Seleccioná un producto en cada fila.");
    if (new Set(productos.map((p) => p.idProducto)).size !== productos.length) return setError("Hay productos repetidos.");
    for (const p of productos) {
      const nombre = getProducto(Number(p.idProducto))?.nombre ?? "el producto";
      if (p.materias.length === 0) return setError(`Agregá al menos una materia prima para ${nombre}.`);
      if (p.materias.some((m) => !m.idMateriaPrima)) return setError(`Seleccioná la materia prima de cada fila de ${nombre}.`);
      if (p.materias.some((m) => !(Number(m.cantidad) > 0))) return setError(`Ingresá cantidades mayores a cero para ${nombre}.`);
      if (new Set(p.materias.map((m) => m.idMateriaPrima)).size !== p.materias.length) return setError(`Hay materias primas repetidas en ${nombre}.`);
    }

    onSave({ idOrdenProduccion: id, idEmpleado, fechaEmision, nmrLote: Number(lote), detalle: detalleBorrador, estado: order?.estado ?? "Pendiente", fechaInicio: order?.fechaInicio ?? null, fechaFinalizacion: order?.fechaFinalizacion ?? null, fechaVencimiento: order?.fechaVencimiento ?? null });
  }

  return (
    <RecordPage onBack={onCancel}>
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-800">Producción</p>
          <h1 className="text-2xl font-bold text-gray-900">{order ? "Editar orden de producción" : "Formulario Nueva Orden de Producción"}</h1>
          <p className="mt-1 text-sm text-gray-500">{codigo("OP", id, 4)}</p>
        </div>
      </div>

      <form noValidate id="production-order-form" onSubmit={submit} className="flex-1 p-5 sm:p-6">
        {error && <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Fecha de emisión <span className="text-rose-600">*</span>
            <input type="date" required value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Número de lote <span className="text-rose-600">*</span>
            <input type="number" min="1" required value={lote} onChange={(e) => setLote(e.target.value)} className={field} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>Empleado responsable <span className="text-rose-600">*</span>
            <select required value={idEmpleado} onChange={(e) => setIdEmpleado(e.target.value)} className={field}>
              <option value="">Seleccionar empleado...</option>
              {SAMPLE_EMPLOYEES.filter((x) => x.status === "Activo").map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
        </div>

        <div data-validation-message={productos.length ? "" : "Agregá al menos un producto a la orden."} className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Productos a elaborar</h3>
            <button type="button" onClick={() => setProductos([...productos, { key: nextKey("p"), idProducto: "", tandas: 1, materias: [] }])} className="text-sm font-semibold text-amber-700 hover:text-amber-800">+ Agregar producto</button>
          </div>
          <div className="mt-4">
            {productos.length === 0 && <p className="text-sm text-gray-500">No hay productos agregados a esta orden.</p>}
            <AnimatePresence initial={false}>
            {productos.map((p) => {
              const receta = p.idProducto ? getReceta(getProducto(Number(p.idProducto))?.idReceta ?? 0) : undefined;
              return (
                <Collapse key={p.key} className="pb-3">
                <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <button type="button" onClick={() => setProductos(productos.filter((x) => x.key !== p.key))} className="absolute right-2 top-2 p-2 text-gray-400 hover:text-red-600" aria-label="Quitar producto">✕</button>
                  <div className="grid gap-4 pr-6 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <label className={labelClass}>Producto <span className="text-rose-600">*</span>
                      <select required value={p.idProducto} onChange={(e) => selectProducto(p.key, e.target.value)} className={field}>
                        <option value="">Seleccionar...</option>
                        {PRODUCTOS_PRODUCCION.map((x) => <option key={x.idProducto} value={x.idProducto}>{x.nombre}</option>)}
                      </select>
                    </label>
                    <div>
                      <p className={labelClass}>Cantidad</p>
                      <TandasCounter value={p.tandas} onChange={(n) => setTandas(p.key, n)} label={getProducto(Number(p.idProducto))?.nombre ?? "producto"} />
                    </div>
                    <div>
                      <p className={labelClass}>Receta</p>
                      <p className="mt-1 flex h-10 items-center text-sm text-gray-700">{receta?.nombre ?? "—"}</p>
                    </div>
                  </div>
                  {p.idProducto && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">Materia prima a utilizar</p>
                        <button type="button" onClick={() => updateRow(p.key, (row) => ({ ...row, materias: [...row.materias, { key: nextKey("mp"), idMateriaPrima: "", cantidad: "" }] }))} className="text-sm font-semibold text-amber-700 hover:text-amber-800">+ Agregar materia prima</button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Cantidades de la receta × {p.tandas}. Podés ajustarlas; al cambiar la cantidad se escalan proporcionalmente.</p>
                      {p.materias.length === 0 && <p className="mt-3 text-sm text-gray-500">Sin materias primas cargadas.</p>}
                      <div className="mt-3 space-y-2">
                        {p.materias.map((m) => {
                          const mp = m.idMateriaPrima ? getMateriaPrima(Number(m.idMateriaPrima)) : undefined;
                          return (
                            <div key={m.key} className="grid grid-cols-[minmax(0,1fr)_7rem_auto] items-end gap-2">
                              <label className="block text-xs font-medium text-gray-600">Materia prima
                                <select value={m.idMateriaPrima} onChange={(e) => updateMateria(p.key, m.key, { idMateriaPrima: e.target.value })} className={field}>
                                  <option value="">Seleccionar...</option>
                                  {MATERIAS_PRIMAS_PRODUCCION.map((x) => <option key={x.idMateriaPrima} value={x.idMateriaPrima}>{x.nombre}</option>)}
                                </select>
                              </label>
                              <label className="block text-xs font-medium text-gray-600">Cantidad{mp && ` (${getUnidad(mp.idUnidad)})`}
                                <input type="number" min="0" step="0.01" inputMode="decimal" value={m.cantidad} onChange={(e) => updateMateria(p.key, m.key, { cantidad: e.target.value })} className={field} />
                              </label>
                              <button type="button" onClick={() => updateRow(p.key, (row) => ({ ...row, materias: row.materias.filter((x) => x.key !== m.key) }))} className="mb-0.5 p-2 text-gray-400 hover:text-red-600" aria-label={`Quitar ${mp?.nombre ?? "materia prima"}`}>✕</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                </Collapse>
              );
            })}
            </AnimatePresence>
          </div>
        </div>

        {consumo.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">Total de materia prima de la orden</h3>
            <p className="mt-1 text-xs text-gray-500">Se descuenta del stock al iniciar la producción.</p>
            {sinStock.length > 0 && <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">No alcanza el stock de {nombresMp(sinStock)}. Podés guardar la orden, pero no iniciarla hasta reponer.</p>}
            <div className="mt-2"><ConsumoResumen consumo={consumo} /></div>
          </div>
        )}
      </form>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
        <button type="submit" form="production-order-form" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Guardar orden</button>
      </div>
    </RecordPage>
  );
}

function ProductionOrderDetails({ order, onClose, onEdit, onTransition }: {
  order: OrdenProduccion;
  onClose: () => void;
  onEdit: () => void;
  onTransition: (next: EstadoOrdenProduccion, cantidades: Record<number, string>, fechaFin: string, vencimiento: string) => string | void;
}) {
  const { getUnidad, formatCantidad } = useProductionCatalogs();
  const [cantidades, setCantidades] = useState<Record<number, string>>(() => Object.fromEntries(order.detalle.map((d) => [d.idProducto, d.cantidadRealGenerada == null ? "" : String(d.cantidadRealGenerada)])));
  const [fechaFin, setFechaFin] = useState(today());
  const [vencimiento, setVencimiento] = useState("");
  const [error, setError] = useState("");
  const consumo = consumoTotal(order.detalle);
  const consumoNota = order.estado === "Pendiente" ? "Se descontará del stock al iniciar la producción." : order.estado === "Cancelada" ? "La orden se canceló sin consumir materia prima." : "Ya descontada del stock.";

  const handleTransition = (next: EstadoOrdenProduccion) => setError(onTransition(next, cantidades, fechaFin, vencimiento) ?? "");

  return (
    <RecordPage onBack={onClose}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Orden {numero(order)}</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Lote {order.nmrLote}</h1>
            <AnimatedBadge value={order.estado} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge(order.estado)}`} />
          </div>
        </div>
        <div className="flex gap-2"><PrintVoucher title="Orden de producción" document={{ number: numero(order), date: order.fechaEmision, status: order.estado, items: order.detalle.map(line => { const product = getProducto(line.idProducto); return { productName: `${product?.nombre ?? "Producto"} · ${product ? getUnidad(product.idUnidad) : ""}`, quantity: line.cantidadRealGenerada ?? undefined }; }) }} recipient={empleado(order.idEmpleado)} recipientLabel="Responsable de producción" details={[{ label: "Lote", value: String(order.nmrLote) }, { label: "Inicio", value: order.fechaInicio ?? "Sin iniciar" }, { label: "Finalización", value: order.fechaFinalizacion ?? "Pendiente" }, { label: "Cantidades", value: "Producción real registrada. Un guion indica una cantidad aún no registrada." }]} signature />
          {order.estado === "Pendiente" && <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar</button>}

        </div>
      </div>

      <form id="production-completion-form" noValidate onSubmit={event => event.preventDefault()} className="flex-1 p-5 sm:p-6">
        <div className="grid gap-7 md:grid-cols-[1fr_300px]">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Productos a elaborar</h3>
            <div className="mt-3 space-y-4">
              {order.detalle.map((d) => {
                const producto = getProducto(d.idProducto);
                const receta = producto ? getReceta(producto.idReceta) : undefined;
                const maquinas = (receta?.maquinas ?? []).map((m) => SAMPLE_MACHINES.find((x) => x.id === m.idMaquina)?.name).filter(Boolean).join(", ");
                return (
                  <div key={d.idProducto} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                      <div>
                        <span className="text-xs font-semibold text-gray-500">{codigo("PRO", d.idProducto)}</span>
                        <span className="ml-2 font-semibold text-gray-900">{producto?.nombre ?? "—"}</span>
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Cantidad: {d.tandas ?? 1}</span>
                      </div>
                      {receta && <Link to={`/produccion/recetas?receta=${receta.idReceta}`} className="rounded border bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:text-amber-800">{receta.nombre}</Link>}
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-xs text-gray-500">Máquinas de la receta</p>
                        <p className="mt-1 text-sm text-gray-900">{maquinas || "Sin máquinas asignadas"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Materia prima a utilizar</p>
                        <ul className="mt-1 space-y-0.5 text-sm text-gray-900">
                          {d.materiasPrimas.length === 0 ? <li className="text-gray-500">Sin materias primas cargadas</li> : d.materiasPrimas.map((m) => {
                            const mp = getMateriaPrima(m.idMateriaPrima);
                            return <li key={m.idMateriaPrima} className="flex justify-between gap-3"><span>{mp?.nombre ?? "—"}</span><span className="tabular-nums">{mp ? formatCantidad(m.cantidad, mp.idUnidad) : m.cantidad}</span></li>;
                          })}
                        </ul>
                      </div>
                      {order.estado === "En proceso" ? (
                        <label className={labelClass}>Cantidad real generada {producto && <span className="font-normal text-gray-500">({getUnidad(producto.idUnidad)})</span>} <span className="text-rose-600">*</span>
                          <input type="number" min="0" step="0.01" required value={cantidades[d.idProducto] ?? ""} onChange={(e) => setCantidades({ ...cantidades, [d.idProducto]: e.target.value })} className={field} />
                        </label>
                      ) : order.estado === "Finalizada" && (
                        <div>
                          <p className="text-xs text-gray-500">Cantidad real generada</p>
                          <p className="mt-1 font-medium text-gray-900">{d.cantidadRealGenerada != null && producto ? formatCantidad(d.cantidadRealGenerada, producto.idUnidad) : "—"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Información de la orden</h3>
              <dl className="mt-3 space-y-3 text-sm">
                {[
                  ["Empleado responsable", empleado(order.idEmpleado)],
                  ["Fecha de emisión", order.fechaEmision],
                  ["Fecha de inicio", order.fechaInicio ?? "—"],
                  ["Fecha de finalización", order.fechaFinalizacion ?? "—"],
                  ["Vencimiento del lote", order.fechaVencimiento ?? "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="mt-0.5 font-medium text-gray-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">Materia prima total</h3>
              <p className="mt-1 text-xs text-gray-500">{consumoNota}</p>
              <div className="mt-2"><ConsumoResumen consumo={consumo} /></div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Acciones de estado</h3>
              {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-800">{error}</p>}

              <AnimatePresence mode="wait" initial={false}>
              <motion.div key={order.estado} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: EASE_OUT }}>
              {order.estado === "Pendiente" && (
                <div className="mt-3 flex flex-col gap-2">
                  <button type="button" onClick={() => handleTransition("En proceso")} className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Iniciar producción</button>
                  <HoldToConfirm label="Mantené presionado para cancelar" holdingLabel="Seguí presionando..." onConfirm={() => handleTransition("Cancelada")} className="w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 select-none" />
                </div>
              )}

              {order.estado === "En proceso" && (
                <div className="mt-3 space-y-3">
                  <label className={labelClass}>Fecha de finalización <span className="text-rose-600">*</span>
                    <input type="date" required value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className={field} />
                  </label>
                  <label className={labelClass}>Vencimiento del lote <span className="text-rose-600">*</span>
                    <input type="date" required value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className={field} />
                  </label>
                  <p className="text-xs text-gray-500">Al finalizar, la cantidad generada se suma al stock de cada producto con el vencimiento de este lote.</p>
                  <button type="button" data-validate-form onClick={() => handleTransition("Finalizada")} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Finalizar orden</button>
                </div>
              )}

              {(order.estado === "Finalizada" || order.estado === "Cancelada") && (
                <p className="mt-2 text-xs text-gray-500">La orden está {order.estado.toLowerCase()} y no admite cambios.</p>
              )}
              </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </form>
    </RecordPage>
  );
}

export default function OrdenesProduccion() {
  const { formatCantidad } = useProductionCatalogs();
  const [orders, setOrders] = useState(() => [...ORDENES_PRODUCCION]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const { editing, setEditing, selected, setSelected, closeScreen, missing, params } = useRecordScreen(orders, item => item.idOrdenProduccion, "orden");

  useEffect(() => {
    if (editing === undefined && selected === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { closeScreen(); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editing, selected]);

  const filtered = useMemo(() => orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || numero(o).toLowerCase().includes(q) || String(o.nmrLote).includes(q) || o.detalle.some((d) => getProducto(d.idProducto)?.nombre.toLowerCase().includes(q));
    return matchesSearch && (statusFilter === "Todos" || o.estado === statusFilter);
  }), [orders, search, statusFilter]);

  function persist(order: OrdenProduccion) {
    const i = ORDENES_PRODUCCION.findIndex((o) => o.idOrdenProduccion === order.idOrdenProduccion);
    if (i >= 0) ORDENES_PRODUCCION[i] = order;
    else ORDENES_PRODUCCION.unshift(order);
    setOrders([...ORDENES_PRODUCCION]);
    setSelected(order);
  }

  function save(order: OrdenProduccion) {
    const isNew = !ORDENES_PRODUCCION.some((o) => o.idOrdenProduccion === order.idOrdenProduccion);
    persist(order);
    toast(`La orden ${numero(order)} se ${isNew ? "creó" : "actualizó"} correctamente.`);
  }

  function transition(next: EstadoOrdenProduccion, cantidades: Record<number, string>, fechaFin: string, vencimiento: string) {
    if (!selected) return;
    if (next === "En proceso") {
      const consumo = consumoTotal(selected.detalle);
      const sinStock = faltantes(consumo);
      if (sinStock.length > 0) return `No hay stock suficiente de ${nombresMp(sinStock)}.`;
      consumo.forEach((m) => {
        const i = MATERIAS_PRIMAS_PRODUCCION.findIndex((x) => x.idMateriaPrima === m.idMateriaPrima);
        if (i >= 0) MATERIAS_PRIMAS_PRODUCCION[i] = { ...MATERIAS_PRIMAS_PRODUCCION[i], stockMateriaPrima: Math.round((MATERIAS_PRIMAS_PRODUCCION[i].stockMateriaPrima - m.cantidad) * 1000) / 1000 };
      });
      toast(`Se inició la producción del lote ${selected.nmrLote} y se descontó la materia prima.`, "info");
      return persist({ ...selected, estado: next, fechaInicio: today() });
    }
    if (next === "Cancelada") {
      toast(`Se canceló la orden ${numero(selected)}.`, "info");
      return persist({ ...selected, estado: next });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)) return "Ingresá una fecha de finalización válida.";
    if (selected.fechaInicio && fechaFin < selected.fechaInicio) return "La fecha de finalización no puede ser anterior a la de inicio.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimiento)) return "Ingresá el vencimiento del lote.";
    if (vencimiento < fechaFin) return "El vencimiento del lote no puede ser anterior a la fecha de finalización.";
    if (selected.detalle.some((d) => cantidades[d.idProducto] === "" || !(Number(cantidades[d.idProducto]) >= 0))) return "Ingresá la cantidad real generada de cada producto.";

    const detalle = selected.detalle.map((d) => ({ ...d, cantidadRealGenerada: Number(cantidades[d.idProducto]) }));
    detalle.forEach((d) => {
      const i = PRODUCTOS_PRODUCCION.findIndex((p) => p.idProducto === d.idProducto);
      if (i >= 0) PRODUCTOS_PRODUCCION[i] = { ...PRODUCTOS_PRODUCCION[i], stockProducto: PRODUCTOS_PRODUCCION[i].stockProducto + d.cantidadRealGenerada };
    });
    persist({ ...selected, estado: next, fechaFinalizacion: fechaFin, fechaVencimiento: vencimiento, detalle });
    detalle.forEach((d) => {
      const producto = getProducto(d.idProducto);
      if (producto) toast(`Stock de ${producto.nombre}: +${formatCantidad(d.cantidadRealGenerada, producto.idUnidad)}`);
    });
  }

  if (missing) return <RecordNotFound onBack={closeScreen} />;
  if (editing !== undefined) return <ProductionOrderForm order={editing} onCancel={() => { setEditing(undefined); }} onSave={save} key={params.toString()} />;
  if (selected) return <ProductionOrderDetails key={params.toString()} order={selected} onClose={() => { setSelected(null); }} onEdit={() => { setEditing(selected); }} onTransition={transition} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Producción</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Órdenes de Producción</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Planificá la elaboración por lote y registrá cuánto se produjo de cada producto.</p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nueva Orden</button>
      </header>

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de órdenes</h2>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? "orden" : "órdenes"} encontradas</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <input aria-label="Buscar órdenes" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar número, lote o producto..." className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64" />
            <select aria-label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
              <option value="Todos">Todos los estados</option>
              {ESTADOS_ORDEN_PRODUCCION.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
            <h3 className="mt-4 font-semibold text-gray-900">No se encontraron órdenes</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("Todos"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1fr_0.8fr_1.6fr_1fr_1.2fr_1fr_auto] items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-left">Nº Orden</div>
              <div className="min-w-0 text-center">Lote</div>
              <div className="min-w-0 text-left">Productos</div>
              <div className="min-w-0 text-center">Emisión</div>
              <div className="min-w-0 text-center">Responsable</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
              <AnimatePresence mode="popLayout">
              {filtered.map((o, index) => {
                const resumen = o.detalle.map((d) => getProducto(d.idProducto)?.nombre).filter(Boolean).join(", ");
                return (
                  <motion.article key={o.idOrdenProduccion} {...rowMotion(index)} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-[1fr_0.8fr_1.6fr_1fr_1.2fr_1fr_auto] lg:gap-5 lg:px-5">
                    <div className="min-w-0 text-left">
                      <h3 className="font-semibold text-gray-900">{numero(o)}</h3>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Lote</p>
                      <p className="mt-1 text-sm text-gray-900 lg:mt-0">{o.nmrLote}</p>
                    </div>
                    <div className="col-span-2 min-w-0 text-left lg:col-span-1">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Productos</p>
                      <p className="mt-1 truncate text-sm text-gray-900 lg:mt-0" title={resumen}>{o.detalle.length} {o.detalle.length === 1 ? "producto" : "productos"}: {resumen}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Emisión</p>
                      <p className="mt-1 text-sm text-gray-900 lg:mt-0">{o.fechaEmision}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Responsable</p>
                      <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{empleado(o.idEmpleado)}</p>
                    </div>
                    <div className="flex flex-col items-start gap-1 lg:items-center">
                      <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                      <AnimatedBadge value={o.estado} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge(o.estado)}`} />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:justify-center lg:border-0 lg:pt-0">
                      <button type="button" onClick={() => { setSelected(o); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Consultar</button>
                    </div>
                  </motion.article>
                );
              })}
              </AnimatePresence>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
