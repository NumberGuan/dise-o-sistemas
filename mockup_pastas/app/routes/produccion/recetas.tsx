import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { SAMPLE_MACHINES } from "~/data/maintenance";
import {
  MATERIAS_PRIMAS_PRODUCCION, PRODUCTOS_PRODUCCION, RECETAS,
  codigo, formatCantidad, getMateriaPrima, getUnidad, siguienteId,
  type DetalleMateriaPrima, type DetalleRecetaMaquina, type Receta,
} from "~/data/produccion";

const field = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-gray-700";
const filterClass = "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

type MateriaPrimaRow = { key: string; idMateriaPrima: string; cantidadNecesaria: string };
type MaquinaRow = DetalleRecetaMaquina & { key: string };

function formatTiempo(tiempo: string) {
  const [h, m] = tiempo.split(":").map(Number);
  return h ? `${h} h ${m} min` : `${m} min`;
}

function RecipeForm({ recipe, onCancel, onSave }: { recipe: Receta | null; onCancel: () => void; onSave: (r: Receta) => void }) {
  const [id] = useState(recipe?.idReceta ?? siguienteId(RECETAS.map((r) => r.idReceta)));
  const [nombre, setNombre] = useState(recipe?.nombre ?? "");
  const [procedimiento, setProcedimiento] = useState(recipe?.procedimiento ?? "");
  const [tiempo, setTiempo] = useState(recipe?.tiempoCoccion ?? "");
  const [temperatura, setTemperatura] = useState(recipe ? String(recipe.temperatura) : "");
  const [materias, setMaterias] = useState<MateriaPrimaRow[]>(() => (recipe?.materiasPrimas ?? []).map((d, i) => ({ key: `mp-${i}`, idMateriaPrima: String(d.idMateriaPrima), cantidadNecesaria: String(d.cantidadNecesaria) })));
  const [maquinas, setMaquinas] = useState<MaquinaRow[]>(() => (recipe?.maquinas ?? []).map((d, i) => ({ ...d, key: `maq-${i}` })));
  const [error, setError] = useState("");

  const updateMateria = (index: number, key: keyof MateriaPrimaRow, value: string) => setMaterias(materias.map((m, i) => i === index ? { ...m, [key]: value } : m));
  const updateMaquina = (index: number, key: keyof MaquinaRow, value: string) => setMaquinas(maquinas.map((m, i) => i === index ? { ...m, [key]: value } : m));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !procedimiento.trim()) return setError("Nombre y procedimiento son obligatorios.");
    if (!/^\d{2}:\d{2}$/.test(tiempo)) return setError("Ingresá un tiempo de cocción válido.");
    if (temperatura === "" || Number.isNaN(Number(temperatura))) return setError("Ingresá la temperatura de cocción.");
    if (materias.length === 0) return setError("Agregá al menos una materia prima.");
    if (materias.some((m) => !m.idMateriaPrima || !(Number(m.cantidadNecesaria) > 0))) return setError("Cada materia prima necesita una cantidad mayor a cero.");
    if (new Set(materias.map((m) => m.idMateriaPrima)).size !== materias.length) return setError("Hay materias primas repetidas.");
    if (maquinas.some((m) => !m.idMaquina || !m.horaInicio || !m.horaFin)) return setError("Completá máquina, hora de inicio y hora de fin en cada fila.");
    if (maquinas.some((m) => m.horaFin <= m.horaInicio)) return setError("La hora de fin tiene que ser posterior a la de inicio.");
    if (new Set(maquinas.map((m) => m.idMaquina)).size !== maquinas.length) return setError("Hay máquinas repetidas.");

    const detalleMaterias: DetalleMateriaPrima[] = materias.map((m) => ({ idMateriaPrima: Number(m.idMateriaPrima), cantidadNecesaria: Number(m.cantidadNecesaria) }));
    const detalleMaquinas: DetalleRecetaMaquina[] = maquinas.map(({ idMaquina, horaInicio, horaFin }) => ({ idMaquina, horaInicio, horaFin }));
    onSave({ idReceta: id, nombre: nombre.trim(), procedimiento: procedimiento.trim(), tiempoCoccion: tiempo, temperatura: Number(temperatura), materiasPrimas: detalleMaterias, maquinas: detalleMaquinas });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{recipe ? "Editar receta" : "Nueva receta"}</h2>
            <p className="mt-1 text-sm text-gray-500">{codigo("REC", id)}</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar formulario" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">✕</button>
        </div>

        <form id="recipe-form" onSubmit={submit} className="flex-1 overflow-y-auto p-5 sm:p-6">
          {error && <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>Nombre <span className="text-rose-600">*</span>
              <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={field} />
            </label>
            <label className={labelClass}>Tiempo de cocción (hh:mm) <span className="text-rose-600">*</span>
              <input type="time" value={tiempo} onChange={(e) => setTiempo(e.target.value)} className={field} />
            </label>
            <label className={labelClass}>Temperatura (°C) <span className="text-rose-600">*</span>
              <input type="number" step="0.1" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className={field} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Procedimiento <span className="text-rose-600">*</span>
              <textarea rows={4} value={procedimiento} onChange={(e) => setProcedimiento(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Materias primas</h3>
              <button type="button" onClick={() => setMaterias([...materias, { key: `mp-${Date.now()}`, idMateriaPrima: "", cantidadNecesaria: "" }])} className="text-sm font-semibold text-amber-700 hover:text-amber-800">+ Agregar materia prima</button>
            </div>
            <div className="mt-4 space-y-3">
              {materias.length === 0 ? (
                <p className="text-sm text-gray-500">Todavía no agregaste materias primas.</p>
              ) : materias.map((m, idx) => {
                const unidad = m.idMateriaPrima ? getUnidad(getMateriaPrima(Number(m.idMateriaPrima))?.idUnidad ?? 0) : "";
                return (
                  <div key={m.key} className="relative rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <button type="button" onClick={() => setMaterias(materias.filter((_, i) => i !== idx))} className="absolute right-2 top-2 p-2 text-gray-400 hover:text-red-600" aria-label="Quitar materia prima">✕</button>
                    <div className="grid gap-4 pr-6 sm:grid-cols-[2fr_1fr]">
                      <label className={labelClass}>Materia prima <span className="text-rose-600">*</span>
                        <select value={m.idMateriaPrima} onChange={(e) => updateMateria(idx, "idMateriaPrima", e.target.value)} className={field}>
                          <option value="">Seleccionar...</option>
                          {MATERIAS_PRIMAS_PRODUCCION.map((x) => <option key={x.idMateriaPrima} value={x.idMateriaPrima}>{x.nombre}</option>)}
                        </select>
                      </label>
                      <label className={labelClass}>Cantidad necesaria {unidad && <span className="font-normal text-gray-500">({unidad})</span>} <span className="text-rose-600">*</span>
                        <input type="number" min="0" step="0.01" value={m.cantidadNecesaria} onChange={(e) => updateMateria(idx, "cantidadNecesaria", e.target.value)} className={field} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Máquinas</h3>
              <button type="button" onClick={() => setMaquinas([...maquinas, { key: `maq-${Date.now()}`, idMaquina: "", horaInicio: "", horaFin: "" }])} className="text-sm font-semibold text-amber-700 hover:text-amber-800">+ Agregar máquina</button>
            </div>
            <div className="mt-4 space-y-3">
              {maquinas.length === 0 ? (
                <p className="text-sm text-gray-500">La receta no tiene máquinas asignadas.</p>
              ) : maquinas.map((m, idx) => (
                <div key={m.key} className="relative rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <button type="button" onClick={() => setMaquinas(maquinas.filter((_, i) => i !== idx))} className="absolute right-2 top-2 p-2 text-gray-400 hover:text-red-600" aria-label="Quitar máquina">✕</button>
                  <div className="grid gap-4 pr-6 sm:grid-cols-[2fr_1fr_1fr]">
                    <label className={labelClass}>Máquina <span className="text-rose-600">*</span>
                      <select value={m.idMaquina} onChange={(e) => updateMaquina(idx, "idMaquina", e.target.value)} className={field}>
                        <option value="">Seleccionar...</option>
                        {SAMPLE_MACHINES.map((x) => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
                      </select>
                    </label>
                    <label className={labelClass}>Hora de inicio <span className="text-rose-600">*</span>
                      <input type="time" value={m.horaInicio} onChange={(e) => updateMaquina(idx, "horaInicio", e.target.value)} className={field} />
                    </label>
                    <label className={labelClass}>Hora de fin <span className="text-rose-600">*</span>
                      <input type="time" value={m.horaFin} onChange={(e) => updateMaquina(idx, "horaFin", e.target.value)} className={field} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
          <button type="submit" form="recipe-form" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Guardar receta</button>
        </div>
      </section>
    </div>
  );
}

function RecipeDetails({ recipe, onClose, onEdit }: { recipe: Receta; onClose: () => void; onEdit: () => void }) {
  const productos = PRODUCTOS_PRODUCCION.filter((p) => p.idReceta === recipe.idReceta);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-4xl sm:rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{codigo("REC", recipe.idReceta)}</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{recipe.nombre}</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar</button>
            <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Cerrar</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-7 md:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Procedimiento</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">{recipe.procedimiento}</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">Materias primas</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {recipe.materiasPrimas.map((d) => {
                    const mp = getMateriaPrima(d.idMateriaPrima);
                    return (
                      <li key={d.idMateriaPrima} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="text-gray-900">{mp?.nombre ?? "—"}</span>
                        <span className="font-medium text-gray-700">{mp ? formatCantidad(d.cantidadNecesaria, mp.idUnidad) : d.cantidadNecesaria}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">Máquinas</h3>
                </div>
                {recipe.maquinas.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">La receta no tiene máquinas asignadas.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recipe.maquinas.map((d) => {
                      const maq = SAMPLE_MACHINES.find((m) => m.id === d.idMaquina);
                      return (
                        <li key={d.idMaquina} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                          <span>
                            <span className="text-xs font-semibold text-gray-500">{maq?.code}</span>
                            <span className="ml-2 text-gray-900">{maq?.name ?? "—"}</span>
                          </span>
                          <span className="font-medium text-gray-700">{d.horaInicio} a {d.horaFin}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Cocción</h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Tiempo de cocción</dt>
                    <dd className="mt-0.5 font-medium text-gray-800">{formatTiempo(recipe.tiempoCoccion)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Temperatura</dt>
                    <dd className="mt-0.5 font-medium text-gray-800">{recipe.temperatura} °C</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Productos con esta receta</h3>
                {productos.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-500">Ningún producto usa esta receta.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {productos.map((p) => (
                      <li key={p.idProducto}>
                        <Link to="/produccion/productos" className="text-sm font-medium text-amber-800 hover:text-amber-900">{p.nombre}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Recetas() {
  const [params, setParams] = useSearchParams();
  const [recipes, setRecipes] = useState(() => [...RECETAS]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Receta | null | undefined>();
  const [selected, setSelected] = useState<Receta | null>(null);

  const filtered = useMemo(() => recipes.filter((r) => {
    const q = search.toLowerCase();
    return !q || [codigo("REC", r.idReceta), r.nombre].some((v) => v.toLowerCase().includes(q));
  }), [recipes, search]);

  useEffect(() => {
    const id = params.get("receta");
    if (id) setSelected(RECETAS.find((r) => String(r.idReceta) === id) ?? null);
  }, [params]);

  useEffect(() => {
    if (editing === undefined && selected === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setEditing(undefined); closeDetails(); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editing, selected]);

  function closeDetails() {
    setSelected(null);
    if (params.has("receta")) setParams({});
  }

  function save(r: Receta) {
    const i = RECETAS.findIndex((x) => x.idReceta === r.idReceta);
    if (i >= 0) RECETAS[i] = r;
    else RECETAS.unshift(r);
    setRecipes([...RECETAS]);
    setEditing(undefined);
    setSelected(r);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Producción</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Recetas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Cómo se elabora cada producto: materias primas, máquinas y parámetros de cocción.</p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nueva Receta</button>
      </header>

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de recetas</h2>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? "receta" : "recetas"} encontradas</p>
          </div>
          <input aria-label="Buscar recetas" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código o nombre..." className={`${filterClass} w-full placeholder:text-gray-400 sm:w-64`} />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
            <h3 className="mt-4 font-semibold text-gray-900">No se encontraron recetas</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término.</p>
            <button type="button" onClick={() => setSearch("")} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar búsqueda</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-left">Código / Nombre</div>
              <div className="min-w-0 text-center">Cocción</div>
              <div className="min-w-0 text-center">Temperatura</div>
              <div className="min-w-0 text-center">Materias primas</div>
              <div className="min-w-0 text-center">Máquinas</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <article key={r.idReceta} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] lg:gap-5 lg:px-5">
                  <div className="col-span-2 min-w-0 text-left lg:col-span-1">
                    <p className="mb-1 text-xs font-medium text-gray-500">{codigo("REC", r.idReceta)}</p>
                    <h3 className="break-words font-semibold leading-5 text-gray-900">{r.nombre}</h3>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Cocción</p>
                    <p className="mt-1 text-sm text-gray-900 lg:mt-0">{formatTiempo(r.tiempoCoccion)}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Temperatura</p>
                    <p className="mt-1 text-sm text-gray-900 lg:mt-0">{r.temperatura} °C</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Materias primas</p>
                    <p className="mt-1 text-sm text-gray-900 lg:mt-0">{r.materiasPrimas.length}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Máquinas</p>
                    <p className="mt-1 text-sm text-gray-900 lg:mt-0">{r.maquinas.length}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:justify-center lg:border-0 lg:pt-0">
                    <button type="button" onClick={() => setSelected(r)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                    <button type="button" onClick={() => setEditing(r)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {editing !== undefined && <RecipeForm recipe={editing} onCancel={() => setEditing(undefined)} onSave={save} />}
      {selected && <RecipeDetails recipe={selected} onClose={closeDetails} onEdit={() => { setEditing(selected); closeDetails(); }} />}
    </div>
  );
}
