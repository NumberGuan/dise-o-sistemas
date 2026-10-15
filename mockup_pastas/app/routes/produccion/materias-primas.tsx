import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  MARCAS, MATERIAS_PRIMAS_PRODUCCION, RECETAS, TIPOS_MATERIA_PRIMA, UNIDADES,
  codigo, formatCantidad, formatCurrency, getMarca, getTipoMateriaPrima, siguienteId, type MateriaPrima,
} from "~/data/produccion";

const field = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-gray-700";
const filterClass = "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

function RawMaterialForm({ material, onCancel, onSave }: { material: MateriaPrima | null; onCancel: () => void; onSave: (m: MateriaPrima) => void }) {
  const [id] = useState(material?.idMateriaPrima ?? siguienteId(MATERIAS_PRIMAS_PRODUCCION.map((m) => m.idMateriaPrima)));
  const [nombre, setNombre] = useState(material?.nombre ?? "");
  const [tipo, setTipo] = useState(String(material?.idTipoMateriaPrima ?? ""));
  const [marca, setMarca] = useState(String(material?.idMarca ?? ""));
  const [unidad, setUnidad] = useState(String(material?.idUnidad ?? ""));
  const [stock, setStock] = useState(material ? String(material.stockMateriaPrima) : "0");
  const [precio, setPrecio] = useState(material ? String(material.precioUltimaCompra) : "");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !tipo || !marca || !unidad) return setError("Nombre, tipo, marca y unidad son obligatorios.");
    if (stock === "" || !Number.isInteger(Number(stock)) || Number(stock) < 0) return setError("El stock tiene que ser un número entero, cero o mayor.");
    if (precio !== "" && Number(precio) < 0) return setError("El precio de última compra no puede ser negativo.");
    if (MATERIAS_PRIMAS_PRODUCCION.some((m) => m.nombre.toLowerCase() === nombre.trim().toLowerCase() && String(m.idMarca) === marca && m.idMateriaPrima !== id)) return setError("Ya existe esa materia prima para la marca elegida.");
    onSave({ idMateriaPrima: id, nombre: nombre.trim(), idTipoMateriaPrima: Number(tipo), idMarca: Number(marca), idUnidad: Number(unidad), stockMateriaPrima: Number(stock), precioUltimaCompra: Number(precio) || 0 });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{material ? "Editar materia prima" : "Nueva materia prima"}</h2>
            <p className="mt-1 text-sm text-gray-500">Los cambios quedan disponibles durante esta sesión.</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar formulario" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Código
              <input value={codigo("MP", id)} readOnly className={`${field} bg-gray-100`} />
            </label>
            <label className={labelClass}>Nombre <span className="text-rose-600">*</span>
              <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={field} />
            </label>
            <label className={labelClass}>Tipo <span className="text-rose-600">*</span>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={field}>
                <option value="">Seleccionar...</option>
                {TIPOS_MATERIA_PRIMA.map((t) => <option key={t.idTipoMateriaPrima} value={t.idTipoMateriaPrima}>{t.nombre}</option>)}
              </select>
            </label>
            <label className={labelClass}>Marca <span className="text-rose-600">*</span>
              <select value={marca} onChange={(e) => setMarca(e.target.value)} className={field}>
                <option value="">Seleccionar...</option>
                {MARCAS.map((m) => <option key={m.idMarca} value={m.idMarca}>{m.nombre}</option>)}
              </select>
            </label>
            <label className={labelClass}>Unidad <span className="text-rose-600">*</span>
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className={field}>
                <option value="">Seleccionar...</option>
                {UNIDADES.map((u) => <option key={u.idUnidad} value={u.idUnidad}>{u.unidad}</option>)}
              </select>
            </label>
            <label className={labelClass}>Stock <span className="text-rose-600">*</span>
              <input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} className={field} />
            </label>
            <label className={labelClass}>Precio de última compra (ARS)
              <input type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} className={field} />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
            <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Guardar materia prima</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function RawMaterialDetails({ material, onClose, onEdit }: { material: MateriaPrima; onClose: () => void; onEdit: () => void }) {
  const recetas = RECETAS.flatMap((r) => {
    const uso = r.materiasPrimas.find((d) => d.idMateriaPrima === material.idMateriaPrima);
    return uso ? [{ receta: r, cantidad: uso.cantidadNecesaria }] : [];
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{codigo("MP", material.idMateriaPrima)} · {getTipoMateriaPrima(material.idTipoMateriaPrima)}</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{material.nombre}</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar</button>
            <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Cerrar</button>
          </div>
        </div>
        <div className="grid gap-7 p-5 sm:grid-cols-[minmax(0,1fr)_1.2fr] sm:p-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Información de la materia prima</h3>
            <dl className="mt-3 space-y-3 text-sm">
              {[
                ["Tipo", getTipoMateriaPrima(material.idTipoMateriaPrima)],
                ["Marca", getMarca(material.idMarca)],
                ["Stock", formatCantidad(material.stockMateriaPrima, material.idUnidad)],
                ["Precio de última compra", material.precioUltimaCompra ? formatCurrency(material.precioUltimaCompra) : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="mt-0.5 break-words font-medium text-gray-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Recetas que la usan</h3>
            <ol className="mt-4 divide-y divide-gray-100">
              {recetas.length === 0 ? (
                <p className="text-sm text-gray-500">Ninguna receta usa esta materia prima.</p>
              ) : recetas.map(({ receta, cantidad }) => (
                <li key={receta.idReceta} className="py-3 first:pt-0">
                  <Link to={`/produccion/recetas?receta=${receta.idReceta}`} className="group flex items-start justify-between gap-3 rounded focus-visible:outline-2 focus-visible:outline-amber-600">
                    <span>
                      <span className="text-xs font-medium text-gray-500">{codigo("REC", receta.idReceta)}</span>
                      <span className="mt-1 block text-sm font-medium text-gray-900 group-hover:text-amber-800">{receta.nombre}</span>
                    </span>
                    <span className="text-sm text-gray-700">{formatCantidad(cantidad, material.idUnidad)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function MateriasPrimas() {
  const [materials, setMaterials] = useState(() => [...MATERIAS_PRIMAS_PRODUCCION]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("Todos");
  const [brand, setBrand] = useState("Todas");
  const [editing, setEditing] = useState<MateriaPrima | null | undefined>();
  const [selected, setSelected] = useState<MateriaPrima | null>(null);

  const filtered = useMemo(() => materials.filter((m) => {
    const q = search.toLowerCase();
    return (!q || [codigo("MP", m.idMateriaPrima), m.nombre, getMarca(m.idMarca)].some((v) => v.toLowerCase().includes(q))) &&
      (type === "Todos" || String(m.idTipoMateriaPrima) === type) &&
      (brand === "Todas" || String(m.idMarca) === brand);
  }), [materials, search, type, brand]);

  useEffect(() => {
    if (editing === undefined && selected === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setEditing(undefined); setSelected(null); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editing, selected]);

  function save(m: MateriaPrima) {
    const i = MATERIAS_PRIMAS_PRODUCCION.findIndex((x) => x.idMateriaPrima === m.idMateriaPrima);
    if (i >= 0) MATERIAS_PRIMAS_PRODUCCION[i] = m;
    else MATERIAS_PRIMAS_PRODUCCION.unshift(m);
    setMaterials([...MATERIAS_PRIMAS_PRODUCCION]);
    setEditing(undefined);
    setSelected(m);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Producción</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Materia Prima</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Insumos que se usan en las recetas, con su marca, stock y el precio de la última compra.</p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nueva Materia Prima</button>
      </header>

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de materias primas</h2>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? "materia prima" : "materias primas"} encontradas</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <input aria-label="Buscar materias primas" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, nombre o marca..." className={`${filterClass} w-full placeholder:text-gray-400 sm:w-64`} />
            <select aria-label="Filtrar por tipo" value={type} onChange={(e) => setType(e.target.value)} className={filterClass}>
              <option value="Todos">Todos los tipos</option>
              {TIPOS_MATERIA_PRIMA.map((t) => <option key={t.idTipoMateriaPrima} value={t.idTipoMateriaPrima}>{t.nombre}</option>)}
            </select>
            <select aria-label="Filtrar por marca" value={brand} onChange={(e) => setBrand(e.target.value)} className={filterClass}>
              <option value="Todas">Todas las marcas</option>
              {MARCAS.map((m) => <option key={m.idMarca} value={m.idMarca}>{m.nombre}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
            <h3 className="mt-4 font-semibold text-gray-900">No se encontraron materias primas</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setType("Todos"); setBrand("Todas"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-left">Código / Nombre</div>
              <div className="min-w-0 text-center">Tipo</div>
              <div className="min-w-0 text-center">Marca</div>
              <div className="min-w-0 text-center">Stock</div>
              <div className="min-w-0 text-center">Última compra</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <article key={m.idMateriaPrima} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] lg:gap-5 lg:px-5">
                  <div className="col-span-2 min-w-0 text-left lg:col-span-1">
                    <p className="mb-1 text-xs font-medium text-gray-500">{codigo("MP", m.idMateriaPrima)}</p>
                    <h3 className="break-words font-semibold leading-5 text-gray-900">{m.nombre}</h3>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Tipo</p>
                    <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{getTipoMateriaPrima(m.idTipoMateriaPrima)}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Marca</p>
                    <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{getMarca(m.idMarca)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 lg:items-center">
                    <span className="text-xs font-medium text-gray-500 lg:hidden">Stock</span>
                    {m.stockMateriaPrima === 0
                      ? <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">Sin stock</span>
                      : <span className="text-sm text-gray-900">{formatCantidad(m.stockMateriaPrima, m.idUnidad)}</span>}
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Última compra</p>
                    <p className="mt-1 text-sm text-gray-900 lg:mt-0">{m.precioUltimaCompra ? formatCurrency(m.precioUltimaCompra) : "—"}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:justify-center lg:border-0 lg:pt-0">
                    <button type="button" onClick={() => setSelected(m)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                    <button type="button" onClick={() => setEditing(m)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {editing !== undefined && <RawMaterialForm material={editing} onCancel={() => setEditing(undefined)} onSave={save} />}
      {selected && <RawMaterialDetails material={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} />}
    </div>
  );
}
