import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  ORDENES_PRODUCCION, PRODUCTOS_PRODUCCION, RECETAS, TIPOS_PRODUCTO, UNIDADES,
  codigo, formatCantidad, formatCurrency, getReceta, getTipoProducto, siguienteId, type Producto,
} from "~/data/produccion";

const field = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-gray-700";
const filterClass = "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const today = () => new Date().toISOString().slice(0, 10);

function vencimientoBadge(fecha: string) {
  if (fecha < today()) return { label: "Vencido", className: "bg-red-100 text-red-800" };
  const dias = (new Date(fecha).getTime() - new Date(today()).getTime()) / 86_400_000;
  if (dias <= 3) return { label: "Vence pronto", className: "bg-amber-100 text-amber-800" };
  return null;
}

function ProductForm({ product, onCancel, onSave }: { product: Producto | null; onCancel: () => void; onSave: (p: Producto) => void }) {
  const [id] = useState(product?.idProducto ?? siguienteId(PRODUCTOS_PRODUCCION.map((p) => p.idProducto)));
  const [nombre, setNombre] = useState(product?.nombre ?? "");
  const [tipo, setTipo] = useState(String(product?.idTipoProducto ?? ""));
  const [receta, setReceta] = useState(String(product?.idReceta ?? ""));
  const [unidad, setUnidad] = useState(String(product?.idUnidad ?? ""));
  const [precio, setPrecio] = useState(product ? String(product.precio) : "");
  const [stock, setStock] = useState(product ? String(product.stockProducto) : "0");
  const [vencimiento, setVencimiento] = useState(product?.fechaVencimiento ?? "");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !tipo || !receta || !unidad) return setError("Nombre, tipo, receta y unidad son obligatorios.");
    if (!(Number(precio) > 0)) return setError("Ingresá un precio mayor a cero.");
    if (stock === "" || Number(stock) < 0) return setError("El stock no puede ser negativo.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimiento)) return setError("Ingresá una fecha de vencimiento válida.");
    if (PRODUCTOS_PRODUCCION.some((p) => p.nombre.toLowerCase() === nombre.trim().toLowerCase() && p.idProducto !== id)) return setError("Ya existe un producto con ese nombre.");
    onSave({ idProducto: id, nombre: nombre.trim(), idTipoProducto: Number(tipo), idReceta: Number(receta), idUnidad: Number(unidad), precio: Number(precio), stockProducto: Number(stock), fechaVencimiento: vencimiento });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{product ? "Editar producto" : "Nuevo producto"}</h2>
            <p className="mt-1 text-sm text-gray-500">Los cambios quedan disponibles durante esta sesión.</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar formulario" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Código
              <input value={codigo("PRO", id)} readOnly className={`${field} bg-gray-100`} />
            </label>
            <label className={labelClass}>Nombre <span className="text-rose-600">*</span>
              <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={field} />
            </label>
            <label className={labelClass}>Tipo de producto <span className="text-rose-600">*</span>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={field}>
                <option value="">Seleccionar...</option>
                {TIPOS_PRODUCTO.map((t) => <option key={t.idTipoProducto} value={t.idTipoProducto}>{t.tipo}</option>)}
              </select>
            </label>
            <label className={labelClass}>Receta <span className="text-rose-600">*</span>
              <select value={receta} onChange={(e) => setReceta(e.target.value)} className={field}>
                <option value="">Seleccionar...</option>
                {RECETAS.map((r) => <option key={r.idReceta} value={r.idReceta}>{r.nombre}</option>)}
              </select>
            </label>
            <label className={labelClass}>Unidad <span className="text-rose-600">*</span>
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className={field}>
                <option value="">Seleccionar...</option>
                {UNIDADES.map((u) => <option key={u.idUnidad} value={u.idUnidad}>{u.unidad}</option>)}
              </select>
            </label>
            <label className={labelClass}>Precio (ARS) <span className="text-rose-600">*</span>
              <input type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} className={field} />
            </label>
            <label className={labelClass}>Stock <span className="text-rose-600">*</span>
              <input type="number" min="0" step="0.01" value={stock} onChange={(e) => setStock(e.target.value)} className={field} />
            </label>
            <label className={labelClass}>Fecha de vencimiento <span className="text-rose-600">*</span>
              <input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className={field} />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
            <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Guardar producto</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProductDetails({ product, onClose, onEdit }: { product: Producto; onClose: () => void; onEdit: () => void }) {
  const receta = getReceta(product.idReceta);
  const ordenes = ORDENES_PRODUCCION
    .filter((o) => o.detalle.some((d) => d.idProducto === product.idProducto))
    .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{codigo("PRO", product.idProducto)} · {getTipoProducto(product.idTipoProducto)}</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{product.nombre}</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar</button>
            <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Cerrar</button>
          </div>
        </div>
        <div className="grid gap-7 p-5 sm:grid-cols-[minmax(0,1fr)_1.2fr] sm:p-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Información del producto</h3>
            <dl className="mt-3 space-y-3 text-sm">
              {[
                ["Tipo", getTipoProducto(product.idTipoProducto)],
                ["Precio", formatCurrency(product.precio)],
                ["Stock", formatCantidad(product.stockProducto, product.idUnidad)],
                ["Fecha de vencimiento", product.fechaVencimiento],
                ["Receta", receta?.nombre ?? "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="mt-0.5 break-words font-medium text-gray-800">{value}</dd>
                </div>
              ))}
            </dl>
            {receta && (
              <Link to={`/produccion/recetas?receta=${receta.idReceta}`} className="mt-6 block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">Ver receta</Link>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Órdenes de producción</h3>
            <ol className="mt-4 divide-y divide-gray-100">
              {ordenes.length === 0 ? (
                <p className="text-sm text-gray-500">Este producto todavía no figura en ninguna orden.</p>
              ) : ordenes.map((o) => {
                const cantidad = o.detalle.find((d) => d.idProducto === product.idProducto)?.cantidadRealGenerada;
                return (
                  <li key={o.idOrdenProduccion} className="py-3 first:pt-0">
                    <Link to={`/produccion/ordenes?orden=${o.idOrdenProduccion}`} className="group flex items-start justify-between gap-3 rounded focus-visible:outline-2 focus-visible:outline-amber-600">
                      <span>
                        <span className="text-xs font-medium text-gray-500">{codigo("OP", o.idOrdenProduccion, 4)} · Lote {o.nmrLote}</span>
                        <span className="mt-1 block text-sm font-medium text-gray-900 group-hover:text-amber-800">
                          {cantidad != null ? `Se generaron ${formatCantidad(cantidad, product.idUnidad)}` : "Sin cantidad registrada"}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">Emitida el {o.fechaEmision}</span>
                      </span>
                      <span className="text-xs font-medium text-gray-500">{o.estado}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Productos() {
  const [products, setProducts] = useState(() => [...PRODUCTOS_PRODUCCION]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("Todos");
  const [editing, setEditing] = useState<Producto | null | undefined>();
  const [selected, setSelected] = useState<Producto | null>(null);

  const filtered = useMemo(() => products.filter((p) => {
    const q = search.toLowerCase();
    return (!q || [codigo("PRO", p.idProducto), p.nombre, getReceta(p.idReceta)?.nombre ?? ""].some((v) => v.toLowerCase().includes(q))) &&
      (type === "Todos" || String(p.idTipoProducto) === type);
  }), [products, search, type]);

  useEffect(() => {
    if (editing === undefined && selected === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setEditing(undefined); setSelected(null); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editing, selected]);

  function save(p: Producto) {
    const i = PRODUCTOS_PRODUCCION.findIndex((x) => x.idProducto === p.idProducto);
    if (i >= 0) PRODUCTOS_PRODUCCION[i] = p;
    else PRODUCTOS_PRODUCCION.unshift(p);
    setProducts([...PRODUCTOS_PRODUCCION]);
    setEditing(undefined);
    setSelected(p);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Producción</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Productos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Productos que elabora la fábrica, con su receta, precio y stock disponible.</p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nuevo Producto</button>
      </header>

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de productos</h2>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? "producto" : "productos"} encontrados</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <input aria-label="Buscar productos" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, nombre o receta..." className={`${filterClass} w-full placeholder:text-gray-400 sm:w-64`} />
            <select aria-label="Filtrar por tipo" value={type} onChange={(e) => setType(e.target.value)} className={filterClass}>
              <option value="Todos">Todos los tipos</option>
              {TIPOS_PRODUCTO.map((t) => <option key={t.idTipoProducto} value={t.idTipoProducto}>{t.tipo}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
            <h3 className="mt-4 font-semibold text-gray-900">No se encontraron productos</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setType("Todos"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr_1.2fr_1fr_1fr_1fr_1fr] items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-left">Código / Nombre</div>
              <div className="min-w-0 text-center">Tipo</div>
              <div className="min-w-0 text-center">Receta</div>
              <div className="min-w-0 text-center">Precio</div>
              <div className="min-w-0 text-center">Stock</div>
              <div className="min-w-0 text-center">Vencimiento</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const aviso = vencimientoBadge(p.fechaVencimiento);
                return (
                  <article key={p.idProducto} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-[1.5fr_1fr_1.2fr_1fr_1fr_1fr_1fr] lg:gap-5 lg:px-5">
                    <div className="col-span-2 min-w-0 text-left lg:col-span-1">
                      <p className="mb-1 text-xs font-medium text-gray-500">{codigo("PRO", p.idProducto)}</p>
                      <h3 className="break-words font-semibold leading-5 text-gray-900">{p.nombre}</h3>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Tipo</p>
                      <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{getTipoProducto(p.idTipoProducto)}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Receta</p>
                      <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{getReceta(p.idReceta)?.nombre ?? "—"}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Precio</p>
                      <p className="mt-1 text-sm text-gray-900 lg:mt-0">{formatCurrency(p.precio)}</p>
                    </div>
                    <div className="flex flex-col items-start gap-1 lg:items-center">
                      <span className="text-xs font-medium text-gray-500 lg:hidden">Stock</span>
                      {p.stockProducto === 0
                        ? <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">Sin stock</span>
                        : <span className="text-sm text-gray-900">{formatCantidad(p.stockProducto, p.idUnidad)}</span>}
                    </div>
                    <div className="flex flex-col items-start gap-1 lg:items-center">
                      <span className="text-xs font-medium text-gray-500 lg:hidden">Vencimiento</span>
                      <span className="text-sm text-gray-900">{p.fechaVencimiento}</span>
                      {aviso && <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${aviso.className}`}>{aviso.label}</span>}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:justify-center lg:border-0 lg:pt-0">
                      <button type="button" onClick={() => setSelected(p)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                      <button type="button" onClick={() => setEditing(p)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {editing !== undefined && <ProductForm product={editing} onCancel={() => setEditing(undefined)} onSave={save} />}
      {selected && <ProductDetails product={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} />}
    </div>
  );
}
